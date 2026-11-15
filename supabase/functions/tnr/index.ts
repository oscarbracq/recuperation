// TNR Athletics — connecteur pour l'appli Claude (téléphone et PC).
// Claude lit ici, au moment de répondre, les données d'Oscar : le résumé calculé par l'appli et les données brutes
// (Garmin, Withings, questionnaire, séances, repas, temps d'écran…). Lecture seule : rien n'est jamais modifié.
// Adresse : …/functions/v1/tnr/<code secret>. Seule l'empreinte du code est ici ; sans le bon code, la fonction ne répond rien.
// Protocole MCP (« Streamable HTTP ») écrit à la main : réponses JSON simples, sans session.
// deno-lint-ignore-file no-explicit-any
import { createClient } from 'npm:@supabase/supabase-js@2';

const SECRET_SHA256 = '65e3dbf35d3dfbc4316c6960996195d45839d4fed13275fb43f3f0b997f6c25b';
const VERSIONS = ['2025-11-25', '2025-06-18', '2025-03-26', '2024-11-05'];
const MAX = 150_000; // caractères par réponse, pour rester lisible par Claude

const serverKey = () => {
  const legacy = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (legacy) return legacy;
  const keys = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') || '{}');
  return keys.default || Object.values(keys)[0] as string;
};
const db = createClient(Deno.env.get('SUPABASE_URL')!, serverKey(), {auth: {persistSession: false}});

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, mcp-protocol-version, mcp-session-id, accept',
  'Access-Control-Allow-Methods': 'POST, GET, DELETE, OPTIONS'
};
const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), {status, headers: {...CORS, 'Content-Type': 'application/json'}});
const sha256 = async (s: string) => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)))].map(x => x.toString(16).padStart(2, '0')).join('');
const parisDay = (d = new Date()) => new Intl.DateTimeFormat('en-CA', {timeZone: 'Europe/Paris'}).format(d);
const parisNow = () => new Intl.DateTimeFormat('fr-FR', {timeZone: 'Europe/Paris', dateStyle: 'full', timeStyle: 'short'}).format(new Date());
const addDays = (k: string, n: number) => { const d = new Date(k + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const isDay = (s: unknown) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);

// Ce que Claude peut demander. La clé = la collection dans public.docs.
const TYPES: Record<string, string> = {
  garmin: 'Montre Garmin, jour par jour : sommeil (durée, phases, heures), VFC, FC au repos, pas, stress, Body Battery, activités.',
  withings: 'Balance Withings, jour par jour : poids, masse grasse, muscle, eau, segments du Body Scan, vitesse de l\'onde de pouls.',
  manual: 'Questionnaire du jour rempli dans l\'appli : forme ressentie, douleurs par zone, humeur, notes, habitudes.',
  training: 'Séances faites et notées : exercices, séries, charges, répétitions, durée, RPE, mètres de sprint.',
  plans: 'Programmes et séances prévues (bibliothèque de séances).',
  fuel: 'Journal alimentaire jour par jour : repas, aliments, quantités, calories, macros.',
  foods: 'Aliments enregistrés (valeurs nutritionnelles).',
  screen: 'Temps d\'écran (ancien format).',
  screenph: 'Temps d\'écran du téléphone, jour par jour, par appli.',
  screenpc: 'Temps d\'écran du PC, jour par jour, par appli.',
  reports: 'Rapports et bilans enregistrés.',
  analysis: 'Dernière analyse calculée.',
  profile: 'Profil : objectifs, blessures, contraintes, plan alimentaire, routine, heure de coucher visée.',
  settings: 'Réglages : planning de la semaine, entraînement, prix et objectifs nutrition, prises de sang, sauts.',
  tdv: 'Train de vie performance : plans, protocole, alimentation.'
};

const TOOLS = [
  {
    name: 'resume_tnr',
    title: 'Résumé TNR Athletics',
    description: 'À appeler en premier pour toute question sur Oscar (forme, récupération, sommeil, entraînement, nutrition, programme). Renvoie le résumé complet calculé par son appli TNR Athletics : synthèse du jour, scores de récupération, tableau des 90 derniers jours (récupération, sommeil, VFC, FC repos, effort, poids, calories, protéines, sprint, douleurs), séances des 60 derniers jours, programme des 14 prochains jours, planning et menu du jour, objectifs, profil. Indique aussi l\'heure de la dernière mise à jour.',
    inputSchema: {type: 'object', properties: {}, additionalProperties: false},
    annotations: {readOnlyHint: true, openWorldHint: false}
  },
  {
    name: 'donnees_tnr',
    title: 'Données brutes TNR',
    description: 'Lit les données brutes et à jour d\'Oscar pour un type et une période, quand le résumé ne suffit pas (détail d\'une nuit, d\'une séance, d\'un repas, d\'une appli…). Types : ' + Object.entries(TYPES).map(([k, v]) => k + ' = ' + v).join(' ') + ' Sans dates : les 14 derniers jours.',
    inputSchema: {
      type: 'object',
      properties: {
        type: {type: 'string', enum: Object.keys(TYPES), description: 'Quelles données lire.'},
        du: {type: 'string', description: 'Premier jour, AAAA-MM-JJ (facultatif).'},
        au: {type: 'string', description: 'Dernier jour, AAAA-MM-JJ (facultatif, par défaut aujourd\'hui).'}
      },
      required: ['type'],
      additionalProperties: false
    },
    annotations: {readOnlyHint: true, openWorldHint: false}
  }
];

async function readAll(collection: string) {
  const rows: any[] = [];
  for (let from = 0; ; from += 1000) {
    const {data, error} = await db.from('docs').select('id,data,updated_at').eq('collection', collection).range(from, from + 999);
    if (error) throw error;
    rows.push(...data);
    if (data.length < 1000) break;
  }
  return rows;
}

const cut = (s: string) => s.length > MAX ? s.slice(0, MAX) + '\n… (coupé : demande une période plus courte)' : s;

async function resume() {
  const [{data: ctx}, {data: st}] = await Promise.all([
    db.from('docs').select('data,updated_at').eq('collection', 'ai').eq('id', 'contexte').maybeSingle(),
    db.from('docs').select('data').eq('collection', 'status').eq('id', 'sync').maybeSingle()
  ]);
  const head = `Maintenant (heure de Paris) : ${parisNow()}.` + (st?.data ? `\nDernière récupération Garmin/Withings : ${JSON.stringify(st.data)}` : '');
  if (!ctx?.data?.text) return head + '\nPas encore de résumé : Oscar doit ouvrir l\'appli TNR une fois. En attendant, utilise donnees_tnr.';
  const at = ctx.data.at || ctx.updated_at;
  return cut(`${head}\nRésumé calculé par l'appli le ${at} (si c'est ancien, complète avec donnees_tnr pour les derniers jours).\n\n${ctx.data.text}`);
}

async function donnees(a: any) {
  const type = String(a?.type || '');
  if (!TYPES[type]) return {error: 'Type inconnu. Types possibles : ' + Object.keys(TYPES).join(', ')};
  const au = isDay(a?.au) ? a.au : parisDay();
  const du = isDay(a?.du) ? a.du : addDays(au, -13);
  const rows = await readAll(type);
  const out: Record<string, unknown> = {};
  let kept = 0;
  for (const r of rows) {
    const d = r.data || {};
    if (d.days && typeof d.days === 'object') {
      // Mois (garmin/AAAA-MM, withings/AAAA-MM) : on garde les jours de la période.
      for (const [k, v] of Object.entries(d.days)) if (k >= du && k <= au) { out[k] = {...(out[k] as any || {}), ...(v as any)}; kept++; }
    } else if (isDay(r.id) || isDay(d.date)) {
      const k = isDay(r.id) ? r.id : d.date;
      if (k >= du && k <= au) { out[r.id] = d; kept++; }
    } else { out[r.id] = d; kept++; }
  }
  const sorted = Object.fromEntries(Object.entries(out).sort(([x], [y]) => x < y ? -1 : 1));
  return {text: cut(`${type} du ${du} au ${au} (${kept} éléments) — ${TYPES[type]}\n` + JSON.stringify(sorted))};
}

async function call(name: string, args: any) {
  try {
    if (name === 'resume_tnr') return {content: [{type: 'text', text: await resume()}]};
    if (name === 'donnees_tnr') {
      const r: any = await donnees(args);
      return r.error ? {content: [{type: 'text', text: r.error}], isError: true} : {content: [{type: 'text', text: r.text}]};
    }
    return {content: [{type: 'text', text: 'Outil inconnu : ' + name}], isError: true};
  } catch (e) {
    return {content: [{type: 'text', text: 'Lecture impossible : ' + String((e as Error)?.message || e)}], isError: true};
  }
}

async function handle(m: any) {
  const id = m?.id;
  if (id === undefined || id === null) return null; // notification : pas de réponse
  const ok = (result: unknown) => ({jsonrpc: '2.0', id, result});
  switch (m.method) {
    case 'initialize': {
      const want = m.params?.protocolVersion;
      return ok({
        protocolVersion: VERSIONS.includes(want) ? want : VERSIONS[0],
        capabilities: {tools: {listChanged: false}},
        serverInfo: {name: 'TNR Athletics', version: '1.0.0'},
        instructions: 'Données personnelles d\'Oscar (sprinteur et coach) issues de son appli TNR Athletics. Pour toute question sur sa forme, son sommeil, sa récupération, ses séances, sa nutrition ou son programme : appelle d\'abord resume_tnr, puis donnees_tnr pour le détail. Cite les dates et les chiffres exacts.'
      });
    }
    case 'ping': return ok({});
    case 'tools/list': return ok({tools: TOOLS});
    case 'tools/call': return ok(await call(m.params?.name, m.params?.arguments || {}));
    case 'resources/list': return ok({resources: []});
    case 'prompts/list': return ok({prompts: []});
    default: return {jsonrpc: '2.0', id, error: {code: -32601, message: 'Méthode inconnue : ' + m.method}};
  }
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', {headers: CORS});
  const secret = new URL(req.url).pathname.split('/').filter(Boolean).pop() || '';
  if (await sha256(secret) !== SECRET_SHA256) return new Response('Not found', {status: 404, headers: CORS});
  if (req.method !== 'POST') return new Response(null, {status: 405, headers: {...CORS, Allow: 'POST'}});
  let body: any;
  try { body = await req.json(); } catch { return json({jsonrpc: '2.0', id: null, error: {code: -32700, message: 'JSON illisible'}}, 400); }
  if (Array.isArray(body)) {
    const out = (await Promise.all(body.map(handle))).filter(Boolean);
    return out.length ? json(out) : new Response(null, {status: 202, headers: CORS});
  }
  const r = await handle(body);
  return r ? json(r) : new Response(null, {status: 202, headers: CORS});
});
