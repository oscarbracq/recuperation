// Récupération — Supabase stand-in for the artifact `db` capability.
// Same small surface the page uses: db.collection(c).onSnapshot/get, db.doc('c/id').onSnapshot/get/set.
// All documents live in one table, public.docs(collection, id, data jsonb), protected by row level security.
window.RECUP_SUPABASE = {
  url: 'https://emrdmohqmswncfchbvbp.supabase.co',
  key: 'sb_publishable_M9pSe3Z09YfVUWM3cvCCJg_BADWxRWG'
};

function makeSupabaseDb(SB) {
  const cache = {};
  const listeners = new Set();
  const loading = {};

  async function load(col) {
    if (loading[col]) return loading[col];
    loading[col] = (async () => {
      const rows = [];
      for (let from = 0; ; from += 1000) {
        const {data, error} = await SB.from('docs').select('id,data').eq('collection', col).range(from, from + 999);
        if (error) throw error;
        rows.push(...data);
        if (data.length < 1000) break;
      }
      cache[col] = new Map(rows.map(r => [r.id, r.data]));
    })();
    try { await loading[col]; } finally { delete loading[col]; }
  }
  const meta = {fromCache: false, hasPendingWrites: false};
  const docSnap = (col, id) => { const d = cache[col]?.get(id); return {id, exists: d !== undefined, data: () => d, metadata: meta}; };
  const colSnap = col => {
    const docs = [...(cache[col] || new Map()).keys()].sort().map(id => docSnap(col, id));
    return {docs, size: docs.length, empty: !docs.length, metadata: meta, docChanges: () => []};
  };
  const notify = col => listeners.forEach(l => { if (l.col === col) l.fn(l.id ? docSnap(col, l.id) : colSnap(col)); });

  // Live updates: the cloud sync writes, the open app redraws.
  SB.channel('docs-live').on('postgres_changes', {event: '*', schema: 'public', table: 'docs'}, p => {
    const r = p.new && p.new.collection ? p.new : p.old;
    if (!r || !r.collection || !cache[r.collection]) return;
    if (p.eventType === 'DELETE') cache[r.collection].delete(r.id); else cache[r.collection].set(r.id, p.new.data);
    notify(r.collection);
  }).subscribe();

  function listen(col, id, fn, err) {
    const l = {col, id, fn};
    listeners.add(l);
    (cache[col] ? Promise.resolve() : load(col)).then(() => fn(id ? docSnap(col, id) : colSnap(col))).catch(e => err && err(e));
    return () => listeners.delete(l);
  }
  function docRef(col, id) {
    return {
      id, path: col + '/' + id,
      onSnapshot: (fn, err) => listen(col, id, fn, err),
      async get() { await load(col); return docSnap(col, id); },
      async set(data) {
        const {error} = await SB.from('docs').upsert({collection: col, id, data, updated_at: new Date().toISOString()});
        if (error) throw error;
        (cache[col] ||= new Map()).set(id, data);
        notify(col);
      }
    };
  }
  return {
    collection: col => ({
      path: col,
      onSnapshot: (fn, err) => listen(col, null, fn, err),
      async get() { await load(col); return colSnap(col); },
      doc: id => docRef(col, id)
    }),
    doc: path => { const i = path.lastIndexOf('/'); return docRef(path.slice(0, i), path.slice(i + 1)); }
  };
}

// Sign-in with a code (or link) sent by e-mail; the session then stays on the phone.
// The code lets the installed app sign in even when mail links open another browser.
async function recupGetDb() {
  const SB = window.supabase.createClient(RECUP_SUPABASE.url, RECUP_SUPABASE.key, {auth: {persistSession: true, detectSessionInUrl: true}});
  let {data: {session}} = await SB.auth.getSession();
  if (!session) {
    session = await new Promise(resolve => {
      const box = document.getElementById('login');
      box.hidden = false;
      const form = box.querySelector('form'), msg = box.querySelector('.msg');
      const codeRow = box.querySelector('.code'), btn = form.querySelector('button');
      let sentTo = null;
      form.addEventListener('submit', async e => {
        e.preventDefault();
        const email = form.email.value.trim();
        if (sentTo === email && form.code.value.trim()) {
          msg.textContent = 'Vérification…';
          const {error} = await SB.auth.verifyOtp({email, token: form.code.value.trim(), type: 'email'});
          if (error) msg.textContent = 'Code incorrect ou expiré. Vérifie-le ou redemande un code.';
          return;
        }
        msg.textContent = 'Envoi…';
        const {error} = await SB.auth.signInWithOtp({email, options: {emailRedirectTo: location.origin + location.pathname, shouldCreateUser: true}});
        if (error) { msg.textContent = 'Envoi impossible : ' + error.message; return; }
        sentTo = email;
        codeRow.hidden = false;
        btn.textContent = 'Valider le code';
        form.code.focus();
        msg.textContent = 'C\'est envoyé ! Tape le code reçu par mail.';
      });
      form.email.addEventListener('input', () => { sentTo = null; codeRow.hidden = true; btn.textContent = 'Recevoir le code'; });
      SB.auth.onAuthStateChange((_ev, s) => { if (s) { box.hidden = true; resolve(s); } });
    });
  }
  return makeSupabaseDb(SB);
}
