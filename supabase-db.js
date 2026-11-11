// Récupération — Supabase stand-in for the artifact `db` capability.
// Same small surface the page uses: db.collection(c).onSnapshot/get, db.doc('c/id').onSnapshot/get/set.
// All documents live in one table, public.docs(collection, id, data jsonb), protected by row level security.
window.RECUP_SUPABASE = {
  url: 'https://emrdmohqmswncfchbvbp.supabase.co',
  key: 'sb_publishable_M9pSe3Z09YfVUWM3cvCCJg_BADWxRWG'
};

// Must match, letter for letter, the address entered in the Withings developer dashboard.
const WITHINGS_REDIRECT = 'https://oscarbracq.github.io/recuperation/';

function makeSupabaseDb(SB) {
  const cache = {};
  const listeners = new Set();
  const loading = {};
  // What this phone wrote last, per document. A reload or a live event that left the server before
  // that write must not bring the old version back (a note saved, then gone when coming back).
  const mine = {};
  const fresher = (col, id, at) => { const w = mine[col + '/' + id]; return w && (!at || Date.parse(at) < w.t) ? w : null; };

  async function load(col) {
    if (loading[col]) return loading[col];
    loading[col] = (async () => {
      const rows = [];
      for (let from = 0; ; from += 1000) {
        const {data, error} = await SB.from('docs').select('id,data,updated_at').eq('collection', col).range(from, from + 999);
        if (error) throw error;
        rows.push(...data);
        if (data.length < 1000) break;
      }
      const m = new Map(rows.map(r => { const w = fresher(col, r.id, r.updated_at); return [r.id, w ? w.data : r.data]; }));
      for (const [key, w] of Object.entries(mine)) { const i = key.lastIndexOf('/'); if (key.slice(0, i) === col && !m.has(key.slice(i + 1))) m.set(key.slice(i + 1), w.data); }
      cache[col] = m;
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
    if (p.eventType !== 'DELETE' && fresher(r.collection, r.id, p.new.updated_at)) return;
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
      async one() { const {data, error} = await SB.from('docs').select('data').eq('collection', col).eq('id', id).maybeSingle(); if (error) throw error; return data?.data ?? null; },
      async set(data) {
        const at = new Date().toISOString();
        mine[col + '/' + id] = {data, t: Date.parse(at)};
        const {error} = await SB.from('docs').upsert({collection: col, id, data, updated_at: at});
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
  window.RECUP_SIGNOUT = async () => { await SB.auth.signOut(); location.reload(); };
  // Pull to refresh: the sync function asks Garmin and Withings right away (a few seconds).
  window.RECUP_SYNC = async () => {
    const {data: {session: s}} = await SB.auth.getSession();
    // Once: 60 days, to bring back the Body Scan segments of the past weeks.
    let once = false; try { once = !localStorage.getItem('seg60'); } catch { /* storage blocked */ }
    const r = await fetch(RECUP_SUPABASE.url + '/functions/v1/sync?days=' + (once ? 60 : 8), {method: 'POST', headers: {Authorization: 'Bearer ' + s.access_token, apikey: RECUP_SUPABASE.key}});
    const j = await r.json();
    if (once && j.withings && !j.withings.error) try { localStorage.setItem('seg60', '1'); } catch { /* storage blocked */ }
    const ok = x => x && !x.error;
    const withings = ok(j.withings) ? 'Withings à jour' : /pas encore install/.test(j.withings?.error || '') ? 'Withings à connecter (Réglages)' : 'Withings indisponible';
    return (ok(j.garmin) ? 'Garmin à jour' : 'Garmin indisponible') + ' · ' + withings;
  };
  // Réglages > Connexions: keys go into the private table through recup_key_set; only yes/no comes back.
  window.RECUP_KEYS = {
    state: async () => { const {data, error} = await SB.rpc('recup_key_state'); if (error) throw error; return data; },
    save: async (k, v) => { const {error} = await SB.rpc('recup_key_set', {p_k: k, p_v: v}); if (error) throw error; },
    // Withings sign-in: their page sends back here with ?code=…&state=withings.
    linkWithings: clientId => {
      location.href = 'https://account.withings.com/oauth2_user/authorize2?' + new URLSearchParams({
        response_type: 'code', client_id: clientId, scope: 'user.info,user.metrics,user.activity', redirect_uri: WITHINGS_REDIRECT, state: 'withings'});
    }
  };
  // Notifications at 9 h and 20 h: the phone subscribes to Web Push with the key of the `notify` function,
  // which keeps the subscription in the private table and sends the summaries.
  const notify = async body => {
    const {data: {session: s}} = await SB.auth.getSession();
    const r = await fetch(RECUP_SUPABASE.url + '/functions/v1/notify', {method: 'POST', headers: {Authorization: 'Bearer ' + s.access_token, apikey: RECUP_SUPABASE.key, 'Content-Type': 'application/json'}, body: JSON.stringify(body)});
    const j = await r.json().catch(() => ({}));
    if (!r.ok || j.error) throw new Error(j.error || 'notify ' + r.status);
    return j;
  };
  const pushReady = async () => 'PushManager' in window && 'serviceWorker' in navigator ? navigator.serviceWorker.ready : null;
  window.RECUP_PUSH = {
    state: async () => {
      if (!('Notification' in window) || !(await pushReady())) return 'unsupported';
      if (Notification.permission === 'denied') return 'denied';
      const sub = await (await pushReady()).pushManager.getSubscription();
      if (!sub || Notification.permission !== 'granted') return 'off';
      // The phone re-sends its subscription each time, so the server list heals itself if it was lost.
      notify({subscribe: sub.toJSON()}).catch(() => {});
      return 'on';
    },
    on: async () => {
      if (await Notification.requestPermission() !== 'granted') return 'denied';
      const reg = await pushReady(), {key} = await notify({key: true});
      const raw = Uint8Array.from(atob(key.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((key.length + 3) % 4)), c => c.charCodeAt(0));
      let sub = await reg.pushManager.getSubscription();
      if (sub) await sub.unsubscribe();
      sub = await reg.pushManager.subscribe({userVisibleOnly: true, applicationServerKey: raw});
      await notify({subscribe: sub.toJSON()});
      return 'on';
    },
    off: async () => {
      const sub = await (await pushReady())?.pushManager.getSubscription();
      if (sub) { await notify({unsubscribe: sub.endpoint}).catch(() => {}); await sub.unsubscribe(); }
      return 'off';
    },
    test: async () => {
      const sub = await (await pushReady())?.pushManager.getSubscription();
      if (sub) await notify({subscribe: sub.toJSON()});
      return notify({test: true});
    }
  };
  const back = new URLSearchParams(location.search);
  if (back.get('state') === 'withings') {
    history.replaceState(null, '', location.pathname);
    window.RECUP_WITHINGS_DONE = (async () => {
      if (!back.get('code')) return 'Connexion Withings annulée';
      const r = await fetch(RECUP_SUPABASE.url + '/functions/v1/sync?days=8', {method: 'POST', headers: {Authorization: 'Bearer ' + session.access_token, apikey: RECUP_SUPABASE.key, 'Content-Type': 'application/json'},
        body: JSON.stringify({withingsCode: back.get('code'), redirect: WITHINGS_REDIRECT})});
      const j = await r.json().catch(() => ({}));
      return j.linked ? 'Withings connecté' : 'Withings : ' + (j.error || 'connexion impossible');
    })();
  }
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
