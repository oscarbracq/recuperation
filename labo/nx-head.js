/* ================= TNR · LABO : the sandbox =================
   Runs before anything else on the page.
   1. The labo has its own corner of the phone's storage: a live session, a draft or a choice made here never
      shows up in the real app (same web address, so without this they would share it). Only the sign-in is shared.
   2. labSandbox(db): reads the real account, but every write stays on this phone ("overlay"), merged on top of
      the real data. Nothing reaches the account. "Réinitialiser le labo" wipes the overlay. */
(() => {
  const PRE = 'labo:', shared = k => /^sb-|^supabase|^trf-mock-db$/.test(String(k));
  const sp = Storage.prototype, get = sp.getItem, set = sp.setItem, del = sp.removeItem;
  const own = (st, k) => st === window.localStorage && !shared(k) ? PRE + k : k;
  sp.getItem = function (k) { return get.call(this, own(this, k)); };
  sp.setItem = function (k, v) { return set.call(this, own(this, k), v); };
  sp.removeItem = function (k) { return del.call(this, own(this, k)); };
  window.LAB_RAW = {get: k => get.call(localStorage, k), set: (k, v) => set.call(localStorage, k, v), del: k => del.call(localStorage, k),
    wipe() { const ks = []; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith(PRE)) ks.push(k); } ks.forEach(k => del.call(localStorage, k)); }};
})();

function labSandbox(db) {
  if (!db) return db;
  const KEY = 'labo:overlay';
  let O = {}; try { O = JSON.parse(LAB_RAW.get(KEY) || '{}') || {}; } catch (e) { O = {}; }
  const save = () => { try { LAB_RAW.set(KEY, JSON.stringify(O)); } catch (e) { console.warn('labo: stockage plein', e); } };
  const subs = new Set(), meta = {fromCache: false, hasPendingWrites: false};
  const snapDoc = (id, d) => ({id, exists: d !== undefined && d !== null, data: () => d === null ? undefined : d, metadata: meta});
  const over = (col, id) => O[col + '/' + id];
  const mergeDoc = (col, id, real) => { const w = over(col, id); return w ? snapDoc(id, w.d) : real; };
  const mergeCol = (col, real) => {
    const m = new Map(); (real?.docs || []).forEach(d => m.set(d.id, d.data()));
    for (const [p, w] of Object.entries(O)) { const i = p.lastIndexOf('/'); if (p.slice(0, i) !== col) continue; const id = p.slice(i + 1); if (w.d == null) m.delete(id); else m.set(id, w.d); }
    const docs = [...m.keys()].sort().map(id => snapDoc(id, m.get(id)));
    return {docs, size: docs.length, empty: !docs.length, metadata: real?.metadata || meta, docChanges: () => []};
  };
  const fire = (col, id) => subs.forEach(l => { if (l.col !== col || !l.real) return; if (!l.id) l.fn(mergeCol(col, l.real)); else if (l.id === id) l.fn(mergeDoc(col, id, l.real)); });
  const write = (col, id, d) => { O[col + '/' + id] = {d: d == null ? null : JSON.parse(JSON.stringify(d)), t: Date.now()}; save(); setTimeout(() => fire(col, id)); };
  const listen = (col, id, src, fn, err) => {
    const l = {col, id, fn, real: null}; subs.add(l);
    const un = src.onSnapshot(s => { l.real = s; fn(id ? mergeDoc(col, id, s) : mergeCol(col, s)); }, err);
    return () => { subs.delete(l); if (typeof un === 'function') un(); };
  };
  const docRef = (col, id) => {
    const real = db.collection(col).doc(id);
    return {id, path: col + '/' + id,
      onSnapshot: (fn, err) => listen(col, id, real, fn, err),
      async get() { return mergeDoc(col, id, await real.get()); },
      async one() { const w = over(col, id); if (w) return w.d ?? null; return real.one ? real.one() : (await real.get()).data() ?? null; },
      async set(d) { write(col, id, d); },
      async update(d) { const w = over(col, id); let base = w ? w.d : null; if (!w) try { base = (await real.get()).data() || null; } catch (e) {} write(col, id, {...(base || {}), ...d}); },
      async delete() { write(col, id, null); }};
  };
  const api = {
    collection: col => ({path: col, onSnapshot: (fn, err) => listen(col, null, db.collection(col), fn, err), async get() { return mergeCol(col, await db.collection(col).get()); }, doc: id => docRef(col, id)}),
    doc: p => { const i = p.lastIndexOf('/'); return docRef(p.slice(0, i), p.slice(i + 1)); }
  };
  // Les 3 séances de muscu proposées pour la semaine de PPS (seulement dans le labo, une fois ; « Réinitialiser » les remet).
  const SEED = {"lab-pps-a": {"id": "lab-pps-a", "kind": "gym", "name": "PPS · Force et contraste", "short": "PA", "title": "Force max + sauts", "desc": "Préparation spécifique : garder la force maximale, la transformer en explosivité par contraste (lourd puis sauts). À placer le lendemain d'une séance de sprint légère, jamais la veille d'une séance de vitesse max.", "items": [{"ex": "halfsquat", "sets": 4, "reps": 3, "pct": 85, "rest": 240, "note": "Descente contrôlée, remontée la plus vite possible", "tempo": [3, 0, 1, 0]}, {"ex": "boxjump", "sets": 4, "reps": 3, "rest": 180, "link": true, "note": "Enchaîné 20 s après chaque série de squat : contraste", "tempo": [3, 0, 1, 0]}, {"ex": "hipthrust", "sets": 3, "reps": 5, "pct": 80, "rest": 150, "tempo": [3, 0, 1, 0]}, {"ex": "nordic", "sets": 3, "reps": 4, "rest": 150, "note": "Excentrique lent, protège les ischios pour la vitesse", "tempo": [3, 0, 1, 0]}, {"ex": "calf", "sets": 3, "reps": 8, "pct": 80, "rest": 90, "note": "Une jambe, pause 1 s en haut", "tempo": [3, 0, 1, 0]}, {"ex": "pallof", "sets": 3, "reps": 8, "rest": 60, "note": "Par côté", "tempo": [3, 0, 1, 0]}], "updatedAt": "2026-11-22T18:00:00.000Z", "lab": true}, "lab-pps-b": {"id": "lab-pps-b", "kind": "gym", "name": "PPS · Puissance", "short": "PB", "title": "Épaulé, sauts chargés, unilatéral", "desc": "Vitesse d'exécution : charges moyennes déplacées le plus vite possible, travail sur une jambe comme en course. Peu de volume, toujours de la qualité.", "items": [{"ex": "pclean", "sets": 5, "reps": 2, "pct": 75, "rest": 180, "note": "Chaque répétition explosive, on s'arrête si la vitesse baisse", "tempo": [3, 0, 1, 0]}, {"ex": "jsquat", "sets": 4, "reps": 4, "pct": 30, "rest": 150, "note": "30 % du max de squat, réception amortie", "tempo": [3, 0, 1, 0]}, {"ex": "bss", "sets": 3, "reps": 5, "pct": 75, "rest": 150, "note": "Par jambe, montée explosive", "tempo": [3, 0, 1, 0]}, {"ex": "rdl", "sets": 3, "reps": 5, "pct": 75, "rest": 150, "tempo": [3, 0, 1, 0]}, {"ex": "copen", "sets": 3, "reps": 6, "rest": 90, "note": "Par côté : adducteurs, protège le pubis", "tempo": [3, 0, 1, 0]}, {"ex": "tib", "sets": 2, "reps": 15, "rest": 60, "tempo": [3, 0, 1, 0]}], "updatedAt": "2026-11-22T18:00:00.000Z", "lab": true}, "lab-pps-c": {"id": "lab-pps-c", "kind": "gym", "name": "PPS · Haut du corps et prévention", "short": "PC", "title": "Bras, dos, psoas, ischios", "desc": "Le haut du corps entretient la force des bras (le bras moteur du sprint) ; le reste protège les zones qui travaillent le plus en vitesse. Séance courte, peut se faire après un sprint.", "items": [{"ex": "bench", "sets": 3, "reps": 5, "pct": 80, "rest": 150, "tempo": [3, 0, 1, 0]}, {"ex": "pullup", "sets": 3, "reps": 6, "rest": 150, "note": "Lesté si 6 passent facilement", "tempo": [3, 0, 1, 0]}, {"ex": "row", "sets": 3, "reps": 8, "pct": 70, "rest": 90, "tempo": [3, 0, 1, 0]}, {"ex": "hipflex", "sets": 3, "reps": 8, "rest": 90, "note": "Psoas : montée rapide du genou, élastique ou poulie", "tempo": [3, 0, 1, 0]}, {"ex": "legcurl", "sets": 3, "reps": 6, "pct": 75, "rest": 90, "note": "Descente en 3 s", "tempo": [3, 0, 1, 0]}, {"ex": "plank", "sets": 3, "reps": 40, "u": "s", "rest": 60, "tempo": [3, 0, 1, 0]}], "updatedAt": "2026-11-22T18:00:00.000Z", "lab": true}};
  if (!LAB_RAW.get('labo:seed-pps1')) { for (const id in SEED) if (!O['plans/' + id]) O['plans/' + id] = {d: SEED[id], t: Date.now()}; save(); LAB_RAW.set('labo:seed-pps1', '1'); }
  window.LAB_DB = {count: () => Object.keys(O).length, list: () => Object.keys(O), reset() { O = {}; save(); LAB_RAW.del('labo:seed-pps1'); }};
  // No cloud call from the labo: no sync request, no key saved, no notification switched on or off.
  const off = () => Promise.resolve('Labo : sans effet sur ton vrai compte');
  window.RECUP_SYNC = async () => 'Labo : tes données sont celles de ton compte, la synchro reste dans ta vraie appli';
  if (window.RECUP_KEYS) window.RECUP_KEYS = {...window.RECUP_KEYS, save: off, linkWithings: off};
  if (window.RECUP_PUSH) window.RECUP_PUSH = {...window.RECUP_PUSH, on: off, off: off, test: off};
  window.RECUP_AI_SAVE = async () => {};   // les analyses de l'IA faites dans le labo ne remplacent pas celles du compte
  return api;
}
