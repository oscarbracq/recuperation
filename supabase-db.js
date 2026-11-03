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
      async get() { await load(col); notify(col); return docSnap(col, id); },
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
      async get() { await load(col); notify(col); return colSnap(col); },
      doc: id => docRef(col, id)
    }),
    doc: path => { const i = path.lastIndexOf('/'); return docRef(path.slice(0, i), path.slice(i + 1)); }
  };
}

// Sign-in with e-mail + password (the mail link stays as a fallback for the very first time).
// Once signed in without a password, the app asks once to choose one, so another browser can sign in too.
async function recupGetDb() {
  const SB = window.supabase.createClient(RECUP_SUPABASE.url, RECUP_SUPABASE.key, {auth: {persistSession: true, detectSessionInUrl: true}});
  let {data: {session}} = await SB.auth.getSession();
  if (!session) {
    session = await new Promise(resolve => {
      const box = document.getElementById('login');
      box.hidden = false;
      const form = box.querySelector('form'), msg = box.querySelector('.msg');
      form.addEventListener('submit', async e => {
        e.preventDefault();
        const email = form.email.value.trim(), password = form.password.value;
        if (password.length < 6) { msg.textContent = 'Mot de passe : au moins 6 caractères.'; return; }
        msg.textContent = 'Connexion…';
        const {error} = await SB.auth.signInWithPassword({email, password});
        if (error) msg.textContent = 'E-mail ou mot de passe incorrect.';
      });
      box.querySelector('.link').addEventListener('click', async () => {
        const email = form.email.value.trim();
        if (!email) { msg.textContent = 'Écris d\'abord ton e-mail.'; return; }
        msg.textContent = 'Envoi…';
        const {error} = await SB.auth.signInWithOtp({email, options: {emailRedirectTo: location.origin + location.pathname, shouldCreateUser: true}});
        msg.textContent = error ? 'Envoi impossible : ' + error.message : 'Lien envoyé : ouvre le mail et touche « Sign in ».';
      });
      SB.auth.onAuthStateChange((_ev, s) => { if (s) { box.hidden = true; resolve(s); } });
    });
  }
  if (!session.user.user_metadata?.hasPassword) askPassword(SB, session.user.email);
  // Pull to refresh: the sync function asks Garmin and Withings right away (a few seconds).
  window.RECUP_SYNC = async () => {
    const {data: {session: s}} = await SB.auth.getSession();
    const r = await fetch(RECUP_SUPABASE.url + '/functions/v1/sync', {method: 'POST', headers: {Authorization: 'Bearer ' + s.access_token, apikey: RECUP_SUPABASE.key}});
    const j = await r.json();
    const ok = x => x && !x.error;
    // Withings stays with the hourly cloud sync (the refresh request left above): it arrives within the hour.
    const withings = ok(j.withings) ? 'Withings à jour' : /pas encore install/.test(j.withings?.error || '') ? 'Withings dans l\'heure' : 'Withings indisponible';
    return (ok(j.garmin) ? 'Garmin à jour' : 'Garmin indisponible') + ' · ' + withings;
  };
  return makeSupabaseDb(SB);
}

function askPassword(SB, email) {
  const box = document.getElementById('setpw');
  box.querySelector('.who').textContent = email;
  box.hidden = false;
  const form = box.querySelector('form'), msg = box.querySelector('.msg');
  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (form.password.value.length < 6) { msg.textContent = 'Au moins 6 caractères.'; return; }
    msg.textContent = 'Enregistrement…';
    const {error} = await SB.auth.updateUser({password: form.password.value, data: {hasPassword: true}});
    if (error) { msg.textContent = 'Impossible : ' + error.message; return; }
    box.hidden = true;
  });
  box.querySelector('.later').addEventListener('click', () => { box.hidden = true; });
}
