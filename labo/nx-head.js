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
  window.LAB_DB = {count: () => Object.keys(O).length, list: () => Object.keys(O), reset() { O = {}; save(); }};
  // No cloud call from the labo: no sync request, no key saved, no notification switched on or off.
  const off = () => Promise.resolve('Labo : sans effet sur ton vrai compte');
  window.RECUP_SYNC = async () => 'Labo : tes données sont celles de ton compte, la synchro reste dans ta vraie appli';
  if (window.RECUP_KEYS) window.RECUP_KEYS = {...window.RECUP_KEYS, save: off, linkWithings: off};
  if (window.RECUP_PUSH) window.RECUP_PUSH = {...window.RECUP_PUSH, on: off, off: off, test: off};
  return api;
}
