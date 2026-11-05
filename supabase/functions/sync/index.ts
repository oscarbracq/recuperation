// Récupération — instant sync. Fetches the last days of raw Garmin and Withings data and merges them
// into public.docs (garmin/YYYY-MM, withings/YYYY-MM), then stamps status/sync with the check time,
// even when nothing was new. Called by the phone app (Oscar's session) or the cloud routine (ingest token).
import { createClient } from 'npm:@supabase/supabase-js@2';

const OWNER = 'oscarbracq@yahoo.com';
const TOKEN_SHA256 = '7d3e47eda3a61b0c60e093ebb88e3f71717e4b5bfddb6ebf96c58b869d1c6351';
const GARMIN = 'https://personal.connectapi.garmin.com';
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-recup-token',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};
// 227 = metabolic age computed by Withings (kept only to compare with our own estimate), 91 = pulse wave velocity (m/s).
const WTYPES: Record<number, string> = {1: 'weight', 6: 'fatPct', 8: 'fatKg', 76: 'muscleKg', 77: 'waterKg', 227: 'metaAge', 91: 'pwv'};

// Server-side key, injected by Supabase (legacy name, or the newer JSON list of secret keys).
const serverKey = () => {
  const legacy = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (legacy) return legacy;
  const keys = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') || '{}');
  return keys.default || Object.values(keys)[0] as string;
};
const db = createClient(Deno.env.get('SUPABASE_URL')!, serverKey(), {auth: {persistSession: false}});
const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), {status, headers: {...CORS, 'Content-Type': 'application/json'}});
const r1 = (v: unknown) => typeof v === 'number' ? Math.round(v * 10) / 10 : undefined;
const pick = (o: Record<string, unknown>, names: string[]) => { for (const n of names) if (o[n] != null) return o[n]; return undefined; };
// Paris calendar day and clock time, whatever the server's time zone.
const parisDay = (d: Date) => new Intl.DateTimeFormat('en-CA', {timeZone: 'Europe/Paris'}).format(d);
const parisTime = (d: Date) => new Intl.DateTimeFormat('fr-FR', {timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit'}).format(d);
const addDays = (k: string, n: number) => { const d = new Date(k + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
// Garmin "local" timestamps are wall-clock values: read them as UTC to keep the local HH:MM.
const localHM = (v: unknown) => {
  if (v == null) return undefined;
  const d = typeof v === 'number' ? new Date(v) : new Date(String(v).replace(' ', 'T') + (String(v).endsWith('Z') ? '' : 'Z'));
  return isNaN(+d) ? undefined : d.toISOString().slice(11, 16);
};
const clean = (o: Record<string, unknown>) => { Object.keys(o).forEach(k => o[k] === undefined && delete o[k]); return o; };

async function sha256(s: string) {
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
}
async function getDoc(collection: string, id: string) {
  const {data} = await db.from('docs').select('data').eq('collection', collection).eq('id', id).maybeSingle();
  return data?.data ?? null;
}
async function putDoc(collection: string, id: string, data: unknown) {
  const {error} = await db.from('docs').upsert({collection, id, data, updated_at: new Date().toISOString()});
  if (error) throw error;
}
async function getPrivate(k: string) {
  const {data} = await db.from('recup_private').select('v').eq('k', k).maybeSingle();
  return data?.v ?? null;
}
async function putPrivate(k: string, v: unknown) {
  const {error} = await db.from('recup_private').upsert({k, v, updated_at: new Date().toISOString()});
  if (error) throw error;
}

// Merges fresh days into the month documents; a fresh day replaces the fields it carries.
async function mergeMonths(collection: string, days: Record<string, Record<string, unknown>>, extra: (doc: Record<string, unknown>) => void = () => {}) {
  const months: Record<string, string[]> = {};
  for (const k of Object.keys(days)) (months[k.slice(0, 7)] ||= []).push(k);
  for (const [m, keys] of Object.entries(months)) {
    const doc = (await getDoc(collection, m)) || {days: {}};
    doc.days ||= {};
    for (const k of keys) doc.days[k] = {...(doc.days[k] || {}), ...days[k]};
    doc.syncedAt = new Date().toISOString();
    extra(doc);
    await putDoc(collection, m, doc);
  }
  return Object.keys(days).length;
}

async function syncGarmin(nDays: number, debug: boolean) {
  // Access pass: from the personal API key Oscar pasted in the app's settings (recup_private.garmin.apiKey).
  // Each success also keeps that 24 h pass as a spare, used if Garmin refuses the key for a moment.
  let jwt = '', keyErr = '';
  const priv = (await getPrivate('garmin')) || {};
  const key = priv.apiKey || Deno.env.get('GARMIN_API_KEY');
  if (key) {
    const tr = await fetch(`${GARMIN}/personalapitoken-service/personal-api/personal-api-key/token`, {method: 'POST', headers: {Authorization: 'ApiKey ' + key}});
    if (tr.ok) {
      jwt = (await tr.text()).trim();
      try { const j = JSON.parse(jwt); jwt = j.token || j.accessToken || j.access_token || jwt; } catch { /* raw JWT */ }
      // Garmin keys live one year from their creation: the first day a key works stands for that date.
      const keyId = (await sha256(key)).slice(0, 16);
      const keyAddedAt = priv.keyId === keyId && priv.keyAddedAt ? priv.keyAddedAt : new Date().toISOString();
      Object.assign(priv, {jwt, exp: jwtExp(jwt), keyId, keyAddedAt, keyOkAt: new Date().toISOString()});
      await putPrivate('garmin', priv);
    } else keyErr = 'clé API Garmin refusée (' + tr.status + ')';
  }
  if (!jwt) {
    if (!priv.jwt) throw new Error(keyErr || 'clé API Garmin pas encore installée');
    if (priv.exp && priv.exp * 1000 < Date.now()) throw new Error(keyErr || 'pass Garmin expiré');
    jwt = priv.jwt;
  }
  // 360 days rather than 365: a margin for the day or two between creating the key and pasting it.
  const keyExpires = priv.keyExpires || (priv.keyAddedAt ? new Date(Date.parse(priv.keyAddedAt) + 360 * 864e5).toISOString() : undefined);
  const get = async (p: string) => {
    const r = await fetch(GARMIN + p, {headers: {Authorization: 'Bearer ' + jwt, Accept: 'application/json'}});
    if (!r.ok) throw new Error(r.status + ' ' + p.split('?')[0]);
    return r.json();
  };
  const today = parisDay(new Date()), first = addDays(today, -(nDays - 1));
  const days: Record<string, Record<string, unknown>> = {};
  const day = (k: string) => days[k] ||= {};
  const raw: Record<string, unknown> = {};

  const hrv = await get(`/hrv-service/hrv/daily/${first}/${today}`);
  for (const h of hrv.hrvSummaries || []) if (h.lastNightAvg != null) day(h.calendarDate).hrv = h.lastNightAvg;

  const sleep = await get(`/sleep-service/sleep/dailySleepSummariesByDate?startDate=${first}&endDate=${today}`);
  const sleeps = Array.isArray(sleep) ? sleep : (sleep.dailySleepSummaries || sleep.sleepSummaries || []);
  if (debug) raw.sleep = sleeps[0];
  for (const s of sleeps) {
    const k = s.calendarDate; if (!k) continue;
    Object.assign(day(k), clean({
      sleepS: pick(s, ['sleepTimeSeconds', 'totalSleepTimeInSeconds']),
      deepS: pick(s, ['deepSleepSeconds', 'deepTime']), remS: pick(s, ['remSleepSeconds', 'remTime']),
      lightS: pick(s, ['lightSleepSeconds', 'lightTime']), awakeS: pick(s, ['awakeSleepSeconds', 'awakeTime']),
      sleepHr: r1(pick(s, ['avgHeartRate', 'averageHeartRate', 'avgSleepHeartRate'])),
      resp: r1(pick(s, ['averageRespirationValue', 'avgRespirationValue', 'respiration'])),
      spo2: r1(pick(s, ['averageSpO2Value', 'avgSpO2Value', 'spO2'])),
      skinTempC: r1(pick(s, ['avgSkinTempDeviationC', 'skinTempDeviationC', 'avgSkinTemperatureDeviation'])),
      rhr: pick(s, ['restingHeartRate']),
      bed: localHM(pick(s, ['sleepStartTimestampLocal', 'localSleepStartTimeInMillis'])),
      wake: localHM(pick(s, ['sleepEndTimestampLocal', 'localSleepEndTimeInMillis']))
    }));
  }
  for (let k = first; k <= today; k = addDays(k, 1)) {
    if (days[k]?.rhr != null) continue;
    try { const u = await get(`/usersummary-service/usersummary/daily?calendarDate=${k}`); if (u.restingHeartRate) day(k).rhr = u.restingHeartRate; } catch { /* day not ready yet */ }
  }

  const acts = await get(`/activitylist-service/activities/search/activities?startDate=${first}&endDate=${today}&limit=100`);
  if (debug) raw.activity = acts[0];
  let hrMax = 0;
  const seen = new Set<string>();
  for (const a of acts) {
    const k = String(a.startTimeLocal || '').slice(0, 10); if (!k) continue;
    if (a.maxHR > hrMax) hrMax = a.maxHR;
    const d = day(k);
    // The API returns every activity of the day, so the day's list and bike totals are rebuilt from scratch.
    if (!seen.has(k)) { seen.add(k); d.acts = []; d.bikeKm = undefined; d.bikeMin = undefined; }
    const min = r1((a.movingDuration || a.duration || 0) / 60) || 0, type = a.activityType?.typeKey || 'other';
    // Bike totals include commutes: he gets around by bike, so it is real daily load.
    if (/cycling|biking/.test(type)) { d.bikeKm = r1(((d.bikeKm as number) || 0) + (a.distance || 0) / 1000); d.bikeMin = Math.round(((d.bikeMin as number) || 0) + min); }
    // Short bike/walk rides under 12 min are commutes: too little load to matter, too much noise.
    if (min < 12 && /cycling|biking|walking/.test(type)) continue;
    const o: Record<string, unknown> = {type, start: String(a.startTimeLocal || '').slice(11, 16), min, km: a.distance ? r1(a.distance / 1000) : undefined,
      avgHr: a.averageHR ? Math.round(a.averageHR) : undefined, maxHr: a.maxHR ? Math.round(a.maxHR) : undefined};
    if (/running|track/.test(type)) { o.name = a.activityName; o.vmax = a.maxSpeed ? r1(a.maxSpeed * 3.6) : undefined; }
    (d.acts as unknown[]).push(clean(o));
  }
  for (const d of Object.values(days)) { clean(d); if (Array.isArray(d.acts) && !d.acts.length) delete d.acts; }
  const n = await mergeMonths('garmin', days, doc => { if (hrMax > ((doc.hrMax as number) || 0)) doc.hrMax = hrMax; });
  return debug ? {days: n, keyExpires, keyErr, raw} : {days: n, keyExpires, keyErr: keyErr || undefined};
}

async function syncWithings(nDays: number) {
  const cfg = await getPrivate('withings');
  if (!cfg?.refresh_token || !cfg?.client_id || !cfg?.client_secret) throw new Error('accès Withings pas encore installé');
  const tr = await fetch('https://wbsapi.withings.net/v2/oauth2', {method: 'POST', body: new URLSearchParams({
    action: 'requesttoken', grant_type: 'refresh_token', client_id: cfg.client_id, client_secret: cfg.client_secret, refresh_token: cfg.refresh_token})});
  const tj = await tr.json();
  if (tj.status !== 0) throw new Error('Withings demande une nouvelle autorisation (' + tj.status + ')');
  // The refresh token rotates: save the new one before anything else, the old one no longer works.
  await putPrivate('withings', {...cfg, refresh_token: tj.body.refresh_token, updatedAt: new Date().toISOString()});
  const end = Math.floor(Date.now() / 1000);
  const mr = await fetch('https://wbsapi.withings.net/measure', {method: 'POST', headers: {Authorization: 'Bearer ' + tj.body.access_token}, body: new URLSearchParams({
    action: 'getmeas', meastypes: Object.keys(WTYPES).join(','), category: '1', startdate: String(end - nDays * 86400), enddate: String(end)})});
  const mj = await mr.json();
  if (mj.status !== 0) throw new Error('mesures Withings ' + mj.status);
  const byTime: Record<number, Record<string, number>> = {};
  for (const g of mj.body.measuregrps || []) {
    const o = byTime[g.date] ||= {};
    for (const m of g.measures) if (WTYPES[m.type]) o[WTYPES[m.type]] = Math.round(m.value * Math.pow(10, m.unit) * 100) / 100;
  }
  const days: Record<string, Record<string, unknown>> = {}, pwv: Record<string, number> = {};
  for (const t of Object.keys(byTime).map(Number).sort((a, b) => a - b)) {
    const o = byTime[t], d = new Date(t * 1000), k = parisDay(d);
    // Pulse wave velocity comes in its own measure group: keep the first reading of the day.
    if (o.pwv != null && pwv[k] == null) pwv[k] = o.pwv;
    delete o.pwv;
    // First weigh-in of the day: morning, most comparable.
    if (o.weight == null || days[k]?.weight != null) continue;
    days[k] = {...(days[k] || {}), ...o, time: parisTime(d)};
  }
  for (const [k, v] of Object.entries(pwv)) (days[k] ||= {}).pwv = v;
  return {days: await mergeMonths('withings', days)};
}

const jwtExp = (t: string) => { try { return JSON.parse(atob(t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).exp; } catch { return undefined; } };
// The app shows analysis/latest.syncWarning. A key that no longer works, or one with 14 days left, puts a Garmin
// message there on every sync (so the morning analysis cannot wipe it); a working key clears it.
// deno-lint-ignore no-explicit-any
async function garminWarning(g: PromiseSettledResult<any>) {
  let msg = '';
  const how = 'crée-en une nouvelle sur connect.garmin.com (Paramètres > Clé API personnelle) et colle-la dans l\'appli, Réglages > Connexions.';
  if (g.status === 'rejected') {
    // Another failure (Garmin down, network): leave the message as it is.
    if (!/clé|pass/.test(String(g.reason?.message || g.reason))) return;
    msg = 'Garmin : ta clé API ne marche plus, ' + how;
  }
  else if (g.value.keyErr) msg = 'Garmin : ta clé API ne marche plus (le pass de secours tient jusqu\'à demain), ' + how;
  else if (g.value.keyExpires) {
    const end = Date.parse(g.value.keyExpires as string);
    if (end - Date.now() < 14 * 864e5) msg = `Garmin : ta clé API expire vers le ${new Intl.DateTimeFormat('fr-FR', {timeZone: 'Europe/Paris', day: 'numeric', month: 'long'}).format(end)}, ` + how;
  }
  const a = (await getDoc('analysis', 'latest')) || {};
  const cur = String(a.syncWarning || ''), mine = !cur || /^Garmin/.test(cur);
  if (msg && mine && cur !== msg) await putDoc('analysis', 'latest', {...a, syncWarning: msg});
  else if (!msg && cur && /^Garmin/.test(cur)) { delete a.syncWarning; await putDoc('analysis', 'latest', a); }
}

// Withings sign-in, last step: the app sends back the one-time code Withings gave it, exchanged here
// with the client id and secret Oscar pasted in the settings. Only the refresh token is kept.
async function linkWithings(code: string, redirect: string) {
  const cfg = await getPrivate('withings');
  if (!cfg?.client_id || !cfg?.client_secret) throw new Error('client ID et secret Withings manquants');
  const tr = await fetch('https://wbsapi.withings.net/v2/oauth2', {method: 'POST', body: new URLSearchParams({
    action: 'requesttoken', grant_type: 'authorization_code', client_id: cfg.client_id, client_secret: cfg.client_secret, code, redirect_uri: redirect})});
  const tj = await tr.json();
  if (tj.status !== 0) throw new Error('Withings a refusé le code (' + tj.status + ')');
  await putPrivate('withings', {...cfg, refresh_token: tj.body.refresh_token, userid: tj.body.userid, linkedAt: new Date().toISOString(), updatedAt: new Date().toISOString()});
  return {linked: true};
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', {headers: CORS});
  const token = req.headers.get('x-recup-token');
  let allowed = false;
  if (token) allowed = (await sha256(token)) === TOKEN_SHA256;
  else {
    const jwt = (req.headers.get('Authorization') || '').replace(/^Bearer /, '');
    const {data} = await db.auth.getUser(jwt);
    allowed = data.user?.email === OWNER;
  }
  if (!allowed) return json({error: 'non autorisé'}, 401);
  const body = await req.json().catch(() => ({}));
  if (body.withingsCode) {
    if (token) return json({error: 'non autorisé'}, 401);
    try { return json(await linkWithings(String(body.withingsCode), String(body.redirect || ''))); } catch (e) { return json({error: String((e as Error).message || e)}, 400); }
  }

  const url = new URL(req.url);
  const nDays = Math.min(60, Math.max(1, Number(url.searchParams.get('days')) || 3));
  const debug = !!token && url.searchParams.get('debug') === '1';
  const status = (await getDoc('status', 'sync')) || {};
  const out: Record<string, unknown> = {};
  const now = new Date().toISOString();
  const [g, w] = await Promise.allSettled([syncGarmin(nDays, debug), syncWithings(nDays)]);
  if (g.status === 'fulfilled') { out.garmin = g.value; status.garmin = now; } else out.garmin = {error: String(g.reason?.message || g.reason)};
  if (w.status === 'fulfilled') { out.withings = w.value; status.withings = now; } else out.withings = {error: String(w.reason?.message || w.reason)};
  if (g.status === 'fulfilled' && g.value.keyExpires) status.garminKeyExpires = g.value.keyExpires;
  await putDoc('status', 'sync', status);
  await garminWarning(g);
  return json(out);
});
