// TNR Athletics — the 9 h and 20 h summary, sent to Oscar's phone as a Web Push notification (free, no third party).
// Called by pg_cron every 5 minutes, with the cron key this function keeps in recup_private (push.cronKey),
// so no secret is ever written in the job; it only sends at the times Oscar chose in the app (settings/app.notifTimes,
// up to 3, default 9 h and 20 h, Paris time; before 14 h the morning summary, after it the evening one), asks the `sync` function
// for fresh Garmin and Withings data first (with the ingest token handed over once by supabase-notify-token.ps1),
// then builds the text from the same rules as the app.
// The app (Oscar's session) uses it to get the public key, save its push subscription and send a test.
// deno-lint-ignore-file no-explicit-any
import { createClient } from 'npm:@supabase/supabase-js@2';

const OWNER = 'oscarbracq@yahoo.com';
const TOKEN_SHA256 = '7d3e47eda3a61b0c60e093ebb88e3f71717e4b5bfddb6ebf96c58b869d1c6351';
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-recup-token',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};
const serverKey = () => {
  const legacy = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (legacy) return legacy;
  const keys = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') || '{}');
  return keys.default || Object.values(keys)[0] as string;
};
const db = createClient(Deno.env.get('SUPABASE_URL')!, serverKey(), {auth: {persistSession: false}});
const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), {status, headers: {...CORS, 'Content-Type': 'application/json'}});
const parisDay = (d: Date) => new Intl.DateTimeFormat('en-CA', {timeZone: 'Europe/Paris'}).format(d);
const parisHM = (d: Date) => new Intl.DateTimeFormat('en-GB', {timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'}).format(d);
const mins = (hm: string) => +hm.slice(0, 2) * 60 + +hm.slice(3, 5);

async function sha256(s: string) {
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
}
async function getPrivate(k: string) {
  const {data} = await db.from('recup_private').select('v').eq('k', k).maybeSingle();
  return data?.v ?? null;
}
async function putPrivate(k: string, v: unknown) {
  const {error} = await db.from('recup_private').upsert({k, v, updated_at: new Date().toISOString()});
  if (error) throw error;
}

/* ---------- Web Push (RFC 8291 payload encryption, RFC 8292 VAPID) with the built-in crypto ---------- */
const enc = new TextEncoder();
const b64u = (b: Uint8Array) => btoa(String.fromCharCode(...b)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64u = (s: string) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4)), c => c.charCodeAt(0));
const cat = (...a: Uint8Array[]) => { const o = new Uint8Array(a.reduce((n, x) => n + x.length, 0)); let i = 0; for (const x of a) { o.set(x, i); i += x.length; } return o; };
async function hmac(key: Uint8Array, data: Uint8Array) {
  const k = await crypto.subtle.importKey('raw', key, {name: 'HMAC', hash: 'SHA-256'}, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', k, data));
}
// The key pair is made once, here, and kept in the private table: the private half never leaves Supabase.
async function vapidKeys(st: any) {
  if (st.vapid) return st.vapid;
  const kp = await crypto.subtle.generateKey({name: 'ECDSA', namedCurve: 'P-256'}, true, ['sign', 'verify']) as CryptoKeyPair;
  st.vapid = {pub: b64u(new Uint8Array(await crypto.subtle.exportKey('raw', kp.publicKey))), jwk: await crypto.subtle.exportKey('jwk', kp.privateKey)};
  await putPrivate('push', st);
  return st.vapid;
}
async function vapidJwt(aud: string, jwk: JsonWebKey) {
  const key = await crypto.subtle.importKey('jwk', jwk, {name: 'ECDSA', namedCurve: 'P-256'}, false, ['sign']);
  const part = (o: unknown) => b64u(enc.encode(JSON.stringify(o)));
  const head = part({typ: 'JWT', alg: 'ES256'}) + '.' + part({aud, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: 'mailto:' + OWNER});
  const sig = new Uint8Array(await crypto.subtle.sign({name: 'ECDSA', hash: 'SHA-256'}, key, enc.encode(head)));
  return head + '.' + b64u(sig);
}
async function encrypt(text: string, p256dh: string, auth: string) {
  const ua = unb64u(p256dh), secret = unb64u(auth), salt = crypto.getRandomValues(new Uint8Array(16));
  const eph = await crypto.subtle.generateKey({name: 'ECDH', namedCurve: 'P-256'}, true, ['deriveBits']) as CryptoKeyPair;
  const as = new Uint8Array(await crypto.subtle.exportKey('raw', eph.publicKey));
  const uaKey = await crypto.subtle.importKey('raw', ua, {name: 'ECDH', namedCurve: 'P-256'}, false, []);
  const shared = new Uint8Array(await crypto.subtle.deriveBits({name: 'ECDH', public: uaKey}, eph.privateKey, 256));
  const ikm = await hmac(await hmac(secret, shared), cat(enc.encode('WebPush: info\0'), ua, as, new Uint8Array([1])));
  const prk = await hmac(salt, ikm);
  const cek = (await hmac(prk, enc.encode('Content-Encoding: aes128gcm\0\x01'))).slice(0, 16);
  const nonce = (await hmac(prk, enc.encode('Content-Encoding: nonce\0\x01'))).slice(0, 12);
  const key = await crypto.subtle.importKey('raw', cek, 'AES-GCM', false, ['encrypt']);
  const body = new Uint8Array(await crypto.subtle.encrypt({name: 'AES-GCM', iv: nonce}, key, cat(enc.encode(text), new Uint8Array([2]))));
  return cat(salt, new Uint8Array([0, 0, 16, 0, as.length]), as, body);
}
async function pushTo(sub: any, payload: unknown, v: any) {
  const jwt = await vapidJwt(new URL(sub.endpoint).origin, v.jwk);
  const r = await fetch(sub.endpoint, {method: 'POST', headers: {
    TTL: '14400', Urgency: 'high', 'Content-Encoding': 'aes128gcm', 'Content-Type': 'application/octet-stream',
    Authorization: `vapid t=${jwt}, k=${v.pub}`}, body: await encrypt(JSON.stringify(payload), sub.keys.p256dh, sub.keys.auth)});
  return {status: r.status, text: r.ok ? '' : (await r.text()).slice(0, 200)};
}
async function sendAll(st: any, payload: unknown) {
  const v = await vapidKeys(st), out = [];
  for (const s of st.subs || []) out.push({...await pushTo(s, payload, v), endpoint: s.endpoint.slice(0, 40)});
  // A phone that unsubscribed (or reinstalled the app) answers 404 / 410: forget it.
  const gone = new Set(out.filter(r => r.status === 404 || r.status === 410).map(r => r.endpoint));
  if (gone.size) { st.subs = st.subs.filter((s: any) => !gone.has(s.endpoint.slice(0, 40))); await putPrivate('push', st); }
  return out;
}

/* ---------- the same numbers as the app (sprint-lab.html, "metrics") ---------- */
async function loadData() {
  const rows: any[] = [];
  for (let from = 0; ; from += 1000) {
    const {data, error} = await db.from('docs').select('collection,id,data').in('collection', ['garmin', 'withings', 'manual', 'profile', 'analysis', 'settings', 'training']).range(from, from + 999);
    if (error) throw error;
    rows.push(...data);
    if (data.length < 1000) break;
  }
  const S: any = {g: {}, w: {}, manual: {}, profile: null, analysis: null, hrMax: 195};
  for (const r of rows) {
    if (r.collection === 'garmin' || r.collection === 'withings') { Object.assign(S[r.collection === 'garmin' ? 'g' : 'w'], r.data?.days || {}); if (r.data?.hrMax) S.hrMax = r.data.hrMax; }
    else if (r.collection === 'manual') S.manual[r.id] = r.data;
    else if (r.collection === 'profile' && r.id === 'main') S.profile = r.data;
    else if (r.collection === 'analysis' && r.id === 'latest') S.analysis = r.data;
    else if (r.collection === 'settings' && r.id === 'app') S.app = r.data;
    else if (r.collection === 'training') (S.training ||= {})[r.id] = r.data;
  }
  return S;
}
function brief(S: any, TODAY: string) {
  const addDays = (k: string, n: number) => { const d = new Date(k + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
  const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
  const mean = (a: number[]) => a.length ? a.reduce((x, y) => x + y, 0) / a.length : null;
  const fx = (v: number, n = 0) => Number(v).toLocaleString('fr-FR', {minimumFractionDigits: n, maximumFractionDigits: n});
  const G = (k: string, f: string) => S.g[k]?.[f], M = (k: string, f: string) => S.manual[k]?.[f];
  const SLEEP_NEED = 8.5, GYM_RE = /strength|fitness_equipment|hiit|cardio_training|training/;
  const sleepH = (k: string) => G(k, 'sleepS') != null && G(k, 'sleepS') > 7200 ? G(k, 'sleepS') / 3600 : null;
  const VAL: Record<string, (k: string) => any> = {hrv: k => G(k, 'hrv'), rhr: k => G(k, 'rhr'), resp: k => G(k, 'resp'), sleepH};
  const series = (f: string, n: number, end: string) => { const o = []; for (let i = n - 1; i >= 0; i--) o.push(VAL[f](addDays(end, -i))); return o.filter(v => v != null).map(Number); };
  const base = (f: string, end: string, n: number) => { const v = series(f, n, addDays(end, -1)); if (v.length < 7) return null; const m = mean(v)!, sd = Math.sqrt(mean(v.map(x => (x - m) ** 2))!) || 1; return {m, sd}; };
  const avgN = (f: string, n: number, end: string) => mean(series(f, n, end));
  const lastKey = (f: string) => { for (let i = 0; i < 10; i++) { const k = addDays(TODAY, -i); if (VAL[f](k) != null) return k; } return null; };
  const restHr = base('rhr', TODAY, 60)?.m ?? 50;
  const trimpOf = (a: any) => { if (!a.avgHr || !a.min) return 0; const x = clamp((a.avgHr - restHr) / (S.hrMax - restHr), 0, 1); return a.min * x * 0.64 * Math.exp(1.92 * x); };
  const gymAct = (k: string) => (G(k, 'acts') || []).find((a: any) => GYM_RE.test(a.type));
  const trackAct = (k: string) => (G(k, 'acts') || []).find((a: any) => /track/.test(a.type) || (/running/.test(a.type) && (a.start || '') >= '16:00'));
  const loadDay = (k: string) => {
    const acts = G(k, 'acts') || [], gA = gymAct(k), tA = trackAct(k), gR = M(k, 'gymRpe'), tR = M(k, 'trackRpe');
    let L = G(k, 'acts') ? acts.reduce((s: number, a: any) => s + ((a === gA && gR) || (a === tA && tR) ? 0 : trimpOf(a)), 0) : (G(k, 'trimp') || 0);
    if (gR) L += gR * (M(k, 'gymMin') || gA?.min || 90) / 4;
    if (tR) L += tR * (M(k, 'trackMin') || tA?.min || 75) / 4;
    return L;
  };
  const effortDay = (k: string) => { const L = loadDay(k); return L > 0 ? clamp(21 * Math.log(1 + L / 3) / Math.log(1 + 700 / 3), 0, 21) : 0; };
  const zOf = (v: number | null, b: any) => v == null || !b ? 0 : (v - b.m) / b.sd;
  const sig = (z: number) => clamp(.5 + z / 4, 0, 1);
  const maxPain = (k: string) => { const p = {...(M(k, 'pains') || {})}; if (M(k, 'pain') != null && !Object.keys(p).length) p.Dos = M(k, 'pain'); const v = Object.values(p) as number[]; return v.length ? Math.max(...v) : null; };
  const recovery = (k: string) => {
    const hrv = G(k, 'hrv'); if (hrv == null) return null;
    const bH = base('hrv', k, 60), bR = base('rhr', k, 60), bResp = base('resp', k, 60);
    if (!bH) return null;
    const zH = .5 * zOf(hrv, bH) + .5 * zOf(avgN('hrv', 7, k), bH);
    const zR = G(k, 'rhr') != null && bR ? zOf(G(k, 'rhr'), bR) : 0;
    const sh = sleepH(k), sp = (sh != null ? clamp(sh / SLEEP_NEED * 100, 0, 100) : 85) / 100;
    let s = 100 * (.45 * sig(zH) + .2 * sig(-zR) + .35 * sp);
    if (bResp && G(k, 'resp') != null && G(k, 'resp') - bResp.m > 1 || (G(k, 'skinTempC') ?? 0) > 1) s -= 15;
    if ((maxPain(k) ?? 0) >= 3) s = Math.min(s, 33);
    return Math.round(clamp(s, 1, 99));
  };
  const zoneOf = (s: number | null) => s == null ? 'none' : s >= 67 ? 'good' : s >= 34 ? 'warn' : 'bad';
  const ZONE: Record<string, string> = {good: 'Récupération élevée', warn: 'Récupération modérée', bad: 'Récupération faible', none: 'En calibrage'};
  const highDay = (k: string) => (S.profile?.schedule?.highDays || [1, 3, 5]).includes(new Date(k + 'T12:00:00Z').getUTCDay());
  const EFFORT: [number, number, string][] = [[0, 10, 'Léger'], [10, 14, 'Modéré'], [14, 18, 'Soutenu'], [18, 21, 'Maximal']];
  const effortTarget = (score: number | null, high: boolean) => {
    if (!high) return {lvl: EFFORT[0], text: 'Jour de récupération : récupération active, mobilité, vélo très facile.'};
    if (score == null || score >= 67) return {lvl: EFFORT[2], text: 'Jour d\'entraînement et récupération élevée : séance complète.'};
    if (score >= 34) return {lvl: EFFORT[1], text: 'Jour d\'entraînement, récupération modérée : garde la qualité, coupe 20 à 30 % du volume.'};
    return {lvl: EFFORT[0], text: 'Récupération faible : transforme ce jour d\'entraînement en jour de récupération.'};
  };
  const kG = lastKey('hrv'), score = kG ? recovery(kG) : null, z = zoneOf(score), high = highDay(TODAY), tgt = effortTarget(score, high);
  const sl = kG ? sleepH(kG) : null, hrv = kG ? G(kG, 'hrv') : null;
  // With the AI switched off in the app's menu, only the app's own rules speak.
  const A = S.app?.ai === false ? null : S.analysis, fresh = String(A?.date || A?.updatedAt || A?.generatedAt || '').slice(0, 10) === TODAY;
  return {
    morning: () => ({
      title: score != null ? `${ZONE[z]} · ${score} %` : 'Ton bilan du matin',
      body: [[sl != null && `Nuit ${fx(sl, 1)} h`, hrv != null && `VFC ${hrv} ms`, score != null && `Récupération ${score} %`].filter(Boolean).join(' · '),
        (fresh && A?.today?.[0]) || tgt.text].filter(Boolean).join('\n')
    }),
    evening: () => {
      const eff = effortDay(TODAY), [lo, hi, name] = tgt.lvl;
      const todo = eff >= hi ? 'Objectif atteint, bravo. Ce soir : repas complet, étirements doux et au lit pour viser 8 h 30.'
        : eff >= lo && eff > 0 ? 'Effort dans la cible, bien joué. Ce soir : recharge en glucides et couche-toi tôt.'
        : high ? 'Il te reste de la marge sur l\'objectif. Ce soir : mobilité ou vélo facile, puis coucher tôt.'
        : 'Journée légère, parfaite pour récupérer. Ce soir : mobilité douce et coucher tôt.';
      const avoid = z === 'bad' ? 'les séances intenses et le sprint maximal' : eff >= hi ? 'toute séance en plus' : `de dépasser ${hi} sur 21 d'effort`;
      return {
        title: `Effort ${fx(eff, 1)}/21 · objectif ${name.toLowerCase()} (${lo} à ${hi})`,
        body: `${todo}\nÀ éviter : ${avoid}.`
      };
    }
  };
}

// Once an hour from 11 h to 22 h: a quick sync, then if the watch sent a strength or track session today and
// nothing is noted yet in Training, one notification per session to fill it in.
async function sessionWatch(st: any, TODAY: string, hm: string, token: string | null) {
  const h = +hm.slice(0, 2), m = +hm.slice(3, 5);
  if (h < 11 || h > 22 || m >= 5 || !st.subs?.length || st.watchRun === TODAY + ' ' + h) return null;
  st.watchRun = TODAY + ' ' + h; await putPrivate('push', st);
  const syncToken = token || st.syncToken;
  if (syncToken) {
    try { await fetch(Deno.env.get('SUPABASE_URL') + '/functions/v1/sync', {method: 'POST', headers: {'x-recup-token': syncToken, Authorization: 'Bearer ' + (st.anonKey || Deno.env.get('SUPABASE_ANON_KEY') || ''), 'Content-Type': 'application/json'}, body: '{}', signal: AbortSignal.timeout(40000)}); } catch (_) { /* the check still runs on what is there */ }
  }
  const S = await loadData();
  const acts = (S.g[TODAY]?.acts || []).filter((a: any) => (a.min || 0) >= 10);
  // Already noted: an RPE in the day journal (written by hand or by a Training session) for that kind of session.
  const man = S.manual?.[TODAY] || {};
  const noted = (a: any) => !!man.actRpe?.[a.start] || (/strength/.test(a.type) ? !!man.gymRpe : /track/.test(a.type) ? !!man.trackRpe : false);
  const logged = acts.length > 0 && acts.every(noted);
  const seen: string[] = st.seen?.[TODAY] || [], a = acts.find((x: any) => !seen.includes(x.start) && !noted(x));
  if (!a || logged) return {watched: hm, acts: acts.length, logged};
  st.seen = {[TODAY]: [...seen, a.start]}; await putPrivate('push', st);
  const kind = /strength/.test(a.type) ? 'Musculation' : /track/.test(a.type) ? 'Sprint' : (a.name || 'Activité');
  const results = await sendAll(st, {title: `${kind} reçue · ${Math.round(a.min)} min`, body: 'Note ton RPE à chaud dans le questionnaire du jour : la durée est déjà remplie par ta montre.', tag: 'tnr-rpe', url: './?rpe=1'});
  return {sessionNotified: a.start, results};
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', {headers: CORS});
  const token = req.headers.get('x-recup-token'), cronKey = req.headers.get('x-notify-key');
  const st: any = (await getPrivate('push')) || {};
  let allowed = false;
  if (token) allowed = (await sha256(token)) === TOKEN_SHA256;
  else if (cronKey) allowed = !!st.cronKey && cronKey === st.cronKey;
  else {
    const jwt = (req.headers.get('Authorization') || '').replace(/^Bearer /, '');
    const {data} = await db.auth.getUser(jwt);
    allowed = data.user?.email === OWNER;
  }
  if (!allowed) return json({error: 'non autorisé'}, 401);
  const body = await req.json().catch(() => ({}));
  // The cron job reads both from the private table: its own key, and the public anon key the gateway asks for.
  if (!st.cronKey || (!st.anonKey && Deno.env.get('SUPABASE_ANON_KEY'))) {
    st.cronKey ||= b64u(crypto.getRandomValues(new Uint8Array(24))); st.anonKey ||= Deno.env.get('SUPABASE_ANON_KEY');
    await putPrivate('push', st);
  }
  // supabase-notify-token.ps1 hands over the ingest token, and the public anon key it was let in with.
  if (token && body.keepToken) {
    st.syncToken = token;
    const anon = (req.headers.get('Authorization') || '').replace(/^Bearer /, '');
    if (anon.startsWith('eyJ')) st.anonKey = anon;
    await putPrivate('push', st);
    return json({kept: true, anonKey: !!st.anonKey});
  }
  const now = new Date(), TODAY = parisDay(now), hm = parisHM(now), hour = +hm.slice(0, 2);

  if (body.key) return json({key: (await vapidKeys(st)).pub});
  if (body.subscribe?.endpoint && body.subscribe?.keys?.p256dh) {
    st.subs = [...(st.subs || []).filter((s: any) => s.endpoint !== body.subscribe.endpoint), {endpoint: body.subscribe.endpoint, keys: body.subscribe.keys, at: now.toISOString()}];
    await putPrivate('push', st);
    return json({subscribed: true, count: st.subs.length});
  }
  if (body.unsubscribe) {
    st.subs = (st.subs || []).filter((s: any) => s.endpoint !== body.unsubscribe);
    await putPrivate('push', st);
    return json({unsubscribed: true});
  }

  // Scheduled run (or a test): a chosen time reached in the last 10 minutes and not sent yet today.
  let due: string | null = null;
  if (!body.test) {
    const {data: app} = await db.from('docs').select('data').eq('collection', 'settings').eq('id', 'app').maybeSingle();
    const times: string[] = Array.isArray(app?.data?.notifTimes) ? app.data.notifTimes : ['09:00', '20:00'];
    due = times.find(t => /^\d\d:\d\d$/.test(t) && mins(hm) - mins(t) >= 0 && mins(hm) - mins(t) < 10 && (st.last || {})[t] !== TODAY) || null;
    if (!due) return json((await sessionWatch(st, TODAY, hm, token)) || {skipped: 'pas d\'envoi prévu à ' + hm});
  }
  const slot = (due ? +due.slice(0, 2) : hour) < 14 ? 'morning' : 'evening';
  if (!st.subs?.length) return json({skipped: 'aucun téléphone abonné'});
  let sync: unknown = null;
  const syncToken = token || st.syncToken;
  if (syncToken && !body.test) {
    try {
      const r = await fetch(Deno.env.get('SUPABASE_URL') + '/functions/v1/sync', {method: 'POST', headers: {'x-recup-token': syncToken, Authorization: 'Bearer ' + (st.anonKey || Deno.env.get('SUPABASE_ANON_KEY') || ''), 'Content-Type': 'application/json'}, body: '{}', signal: AbortSignal.timeout(40000)});
      sync = await r.json().catch(() => r.status);
    } catch (e) { sync = String(e); }
  }
  const b = brief(await loadData(), TODAY)[slot as 'morning' | 'evening']();
  const results = await sendAll(st, {...b, tag: 'tnr-' + slot, url: './'});
  if (due) { st.last = {...(st.last || {}), [due]: TODAY}; await putPrivate('push', st); }
  return json({slot, ...b, sync, results});
});
