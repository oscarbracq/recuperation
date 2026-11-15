/* ================= TNR LABO : l'appli principale, une seule entrée =================
   Les pages sont exactement celles de l'appli principale. Ce qui change :
   · plus d'accueil ni de lettres : on arrive directement dans un module ;
   · une barre flottante en verre avec les 6 onglets (leurs noms suivent le module), et le pouce glisse d'un onglet à l'autre ;
   · en haut : « + » (questionnaire du jour) · T · N · R (même onglet, autre module) · « IA » (le coach qui connaît tout) ;
   · les chiffres, courbes, blocs et anneaux s'animent quand une page arrive ou quand on change de période. */
const ONE = {mods: ['T', 'N', 'R'], keys: {T: ['today', 'progress', 'sessions', 'library', 'body', 'profile'], N: ['journal', 'progress', 'menu', 'foods', 'nbody', 'goals'], R: ['today', 'trends', 'rsess', 'rlib', 'reports', 'profile']},
  name: {T: 'Training', N: 'Nutrition', R: 'Recovery'}, col: Object.fromEntries(HOME_K), ready: false, act: 0, seen: new WeakSet(), chat: [], busy: false, aiOpen: false};
const oneCur = () => S.mod === 'R' ? S.tab : S.mod === 'T' ? S.ttab : S.mod === 'N' ? S.ftab : null;
const oneIdx = () => Math.max(0, (ONE.keys[S.mod] || []).indexOf(oneCur()));
const oneView = () => S.mod === 'R' ? $('#v-' + S.tab) : S.mod === 'T' ? $('#t-view') : S.mod === 'N' ? $('#f-view') : null;
const oneHap = (ms = 6) => { try { if (PREFS.haptic !== false) navigator.vibrate?.(ms); } catch (e) {} };
const oneCalm = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
// L'accueil n'existe plus : tout ce qui y menait ramène au module en cours.
const oneGo0 = go;
go = function (mod, push = true) { if (mod === 'home') { mod = ONE.mods.includes(S.mod) ? S.mod : oneSaved().m; push = false; } oneGo0(mod, push); oneSync(); };
const oneSaved = () => { try { const o = JSON.parse(localStorage.getItem('one.pos') || '{}'); return {m: ONE.mods.includes(o.m) ? o.m : 'T', i: +o.i || 0}; } catch (e) { return {m: 'T', i: 0}; } };
// Change de module en gardant la même position d'onglet. La page apparaît sur place (pas de glissement : ça, c'est pour les onglets).
function oneSwitch(m, i = oneIdx()) {
  if (!ONE.mods.includes(m)) return;
  if (S.sheet) closeSheet(); while (P.stack.length) closePane();
  const k = ONE.keys[m][i] || ONE.keys[m][0];
  if (m === 'R') S.tab = k; else if (m === 'T') S.ttab = k; else { S.ftab = k; if (k === 'journal') S.fday = TODAY; }
  saveUi(); ONE.act = performance.now();
  oneGo0(m, false); try { history.replaceState({...(history.state || {}), mod: m}, ''); if (i > 0 && !history.state?.one) history.pushState({mod: m, one: 1}, ''); } catch (e) {}
  oneSync(); oneHap(8);
  const v = oneView(); if (v && !oneCalm()) v.animate([{opacity: 0, transform: 'scale(.985)', filter: 'blur(8px)'}, {opacity: 1, transform: 'none', filter: 'blur(0)'}], {duration: 420, easing: 'cubic-bezier(.2,.8,.2,1)'});
}
function oneTab(i) {
  const k = ONE.keys[S.mod]?.[i]; if (!k) return;
  if (k === oneCur()) { window.scrollTo({top: 0, behavior: 'smooth'}); return; }
  // Le retour du téléphone depuis un onglet ramène à Aujourd'hui (une seule étape dans l'historique).
  if (i > 0 && !history.state?.one) try { history.pushState({mod: S.mod, one: 1}, ''); } catch (e) {}
  if (S.mod === 'R') setTab(k); else { if (S.mod === 'T') S.ttab = k; else { S.ftab = k; if (k === 'journal') S.fday = TODAY; } saveUi(); renderMod(true); window.scrollTo(0, 0); pcSync(); }
  oneSync(); oneHap(5);
}
const ICN = {plus: '<path d="M12 5v14M5 12h14"/>', ai: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>'};
const oneIc = (k, s = 20) => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICN[k]}</svg>`;
function oneMount() {
  document.documentElement.classList.add('one');
  document.body.insertAdjacentHTML('beforeend', `<div id="one-top" class="one-top"><button class="one-sq" data-hday aria-label="Questionnaire du jour" title="Questionnaire du jour">${oneIc('plus')}</button>
    <div class="one-mods" role="tablist" aria-label="Module"><span class="one-mp"></span>${ONE.mods.map(m => `<button role="tab" data-one-m="${m}" style="--c:${ONE.col[m]}"><b>${m}</b><span>${ONE.name[m]}</span></button>`).join('')}</div>
    <button class="one-sq one-aib" data-one-ai aria-label="Coach IA" title="Coach IA">${oneIc('ai')}<span>IA</span></button></div>
    <nav id="one-tabs" class="one-tabs" aria-label="Sections"><span class="one-pill"></span>${[0, 1, 2, 3, 4, 5].map(i => `<button data-one-t="${i}"></button>`).join('')}</nav>`);
  document.addEventListener('click', e => {
    const m = e.target.closest('[data-one-m]'); if (m) { if (m.dataset.oneM !== S.mod) oneSwitch(m.dataset.oneM); else window.scrollTo({top: 0, behavior: 'smooth'}); return; }
    const t = e.target.closest('[data-one-t]'); if (t) { oneTab(+t.dataset.oneT); return; }
    if (e.target.closest('[data-one-ai]')) { oneAiOpen(); return; }
    if (e.target.closest('[data-one-aix]')) { oneAiClose(); return; }
    if (e.target.closest('[data-one-new]')) { ONE.chat = []; oneChatSave(); oneAiDraw(); return; }
    const sg = e.target.closest('[data-one-sug]'); if (sg) oneAsk(sg.textContent);
  });
  for (const ev of ['pointerdown', 'keydown', 'touchstart']) addEventListener(ev, () => { ONE.act = performance.now(); }, {capture: true, passive: true});
  addEventListener('resize', () => oneSync());
}
// La pastille glisse avec un petit élan, mais ne dépasse jamais le cadre de la barre.
function onePill(box, p, on) {
  if (!box || !on || !p) return;
  const pad = parseFloat(getComputedStyle(box).paddingLeft) || 0, x = on.offsetLeft, w = on.offsetWidth, max = box.clientWidth - pad - w;
  const x0 = p._x, w0 = p._w; p._x = x; p._w = w;
  p.style.width = w + 'px'; p.style.transform = `translateX(${x}px)`;
  if (x0 == null || (x0 === x && w0 === w) || oneCalm()) return;
  const dir = Math.sign(x - x0), over = Math.max(pad, Math.min(max, x + dir * Math.min(9, Math.abs(x - x0) * .06)));
  p.getAnimations().forEach(a => a.cancel());
  p.animate([{transform: `translateX(${x0}px)`, width: w0 + 'px'}, {transform: `translateX(${over}px)`, width: w + 'px', offset: .72}, {transform: `translateX(${x}px)`, width: w + 'px'}], {duration: 460, easing: 'cubic-bezier(.3,.7,.25,1)'});
}
// Met la barre et le sélecteur à jour (noms, icônes, pastilles) ; appelée après chaque changement de page.
function oneSync() {
  const tabs = $('#one-tabs'), top = $('#one-top'); if (!tabs || !ONE.mods.includes(S.mod)) return;
  document.documentElement.style.setProperty('--one-c', ONE.col[S.mod]);
  const src = [...(pcBar(S.mod)?.querySelectorAll('[role=tab]') || [])], i = oneIdx();
  tabs.querySelectorAll('[data-one-t]').forEach((b, j) => { const s = src[j]; if (!s) return; const h = s.innerHTML; if (b._h !== h) { b.innerHTML = h; b._h = h; } b.setAttribute('aria-label', s.textContent.trim()); b.classList.toggle('on', j === i); });
  top.querySelectorAll('[data-one-m]').forEach(b => b.classList.toggle('on', b.dataset.oneM === S.mod));
  onePill(tabs, tabs.querySelector('.on'), tabs.querySelector('.one-pill')); onePill(top.querySelector('.one-mods'), top.querySelector('.one-mods .on'), top.querySelector('.one-mp'));
  try { localStorage.setItem('one.pos', JSON.stringify({m: S.mod, i})); } catch (e) {}
}

/* ---------- animations : courbes qui se dessinent, blocs qui montent, anneaux et chiffres qui partent de zéro ---------- */
// Seulement juste après un geste (arrivée sur une page, changement de période, d'unité…), pas à chaque mise à jour silencieuse des données.
const oneRecent = () => performance.now() - ONE.act < 1600 || performance.now() < 7000;
function oneAnim(root) {
  if (!root || oneCalm() || !oneRecent()) return;
  const fresh = el => { if (ONE.seen.has(el)) return false; ONE.seen.add(el); return true; };
  root.querySelectorAll('.chartbox svg.chart').forEach(svg => {
    if (!fresh(svg)) return;
    svg.querySelectorAll('path[fill="none"]').forEach(p => { p.setAttribute('pathLength', '1'); p.animate([{strokeDasharray: '1 2', strokeDashoffset: 1}, {strokeDasharray: '1 2', strokeDashoffset: 0}], {duration: 1150, easing: 'cubic-bezier(.45,0,.2,1)'}); });
    svg.querySelectorAll('path:not([fill="none"])').forEach(p => p.animate([{opacity: 0}, {opacity: p.getAttribute('opacity') || 1}], {duration: 700, delay: 500, fill: 'backwards'}));
    svg.querySelectorAll('rect[rx]').forEach((r, i) => { r.style.transformBox = 'fill-box'; r.style.transformOrigin = '50% 100%'; r.animate([{transform: 'scaleY(0)'}, {transform: 'scaleY(1)'}], {duration: 560, delay: Math.min(520, i * 16), easing: 'cubic-bezier(.34,1.35,.5,1)', fill: 'backwards'}); });
    svg.querySelectorAll(':scope > circle').forEach((c, i) => { c.style.transformBox = 'fill-box'; c.style.transformOrigin = 'center'; c.animate([{transform: 'scale(0)', opacity: 0}, {transform: 'scale(1)', opacity: 1}], {duration: 320, delay: 650 + Math.min(450, i * 10), fill: 'backwards'}); });
    svg.querySelectorAll('.trendl, .sc').forEach(l => l.animate([{opacity: 0}, {opacity: 1}], {duration: 450, delay: 1000, fill: 'backwards'}));
  });
  root.querySelectorAll('svg.ring').forEach(s => { if (!fresh(s)) return; const c = s.querySelectorAll('circle')[1]; if (!c) return; const C = +c.getAttribute('stroke-dasharray'), o = +c.getAttribute('stroke-dashoffset'); if (!C) return;
    c.animate([{strokeDashoffset: C}, {strokeDashoffset: o}], {duration: 1150, easing: 'cubic-bezier(.3,.8,.25,1)'}); });
  root.querySelectorAll('.imb i').forEach((b, i) => { if (!fresh(b)) return; b.style.transformOrigin = b.classList.contains('neg') ? 'right' : 'left';
    b.animate([{transform: 'scaleX(0)'}, {transform: 'scaleX(1)'}], {duration: 750, delay: 150 + i * 60, easing: 'cubic-bezier(.3,1.25,.5,1)', fill: 'backwards'}); });
  oneCount([...root.querySelectorAll('.num, .imh b, .segl b')].filter(fresh));
}
// Le chiffre monte de 0 jusqu'à sa valeur (le premier nombre de chaque élément, le reste du texte ne bouge pas).
function oneCount(els) {
  const items = [];
  for (const el of els) { const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let n;
    while ((n = tw.nextNode())) { const m = n.nodeValue.match(/^([^\d]*?)(\d{1,3}(?:[  ]\d{3})+|\d+)(,\d+)?([\s\S]*)$/); if (!m) continue;
      const sep = /[  ]/.test(m[2]), dec = m[3] ? m[3].length - 1 : 0, v = parseFloat(m[2].replace(/[  ]/g, '') + (m[3] ? '.' + m[3].slice(1) : ''));
      if (isFinite(v) && v > 0) items.push({n, pre: m[1], suf: m[4], v, dec, sep}); break; } }
  if (!items.length) return;
  const fmt = (x, d, sep) => { let [a, b] = x.toFixed(d).split('.'); if (sep) a = a.replace(/\B(?=(\d{3})+(?!\d))/g, ' '); return b ? a + ',' + b : a; };
  const t0 = performance.now(), D = 950;
  const step = t => { const k = Math.min(1, (t - t0) / D), e = 1 - Math.pow(1 - k, 3); for (const it of items) if (it.n.isConnected) it.n.nodeValue = it.pre + fmt(it.v * e, it.dec, it.sep) + it.suf; if (k < 1) requestAnimationFrame(step); };
  for (const it of items) it.n.nodeValue = it.pre + fmt(0, it.dec, it.sep) + it.suf;
  requestAnimationFrame(step);
}

/* ---------- le coach IA : une vraie discussion, dans l'appli, avec toutes les données ---------- */
try { ONE.chat = JSON.parse(localStorage.getItem('one.chat') || '[]') || []; } catch (e) { ONE.chat = []; }
const oneChatSave = () => { try { localStorage.setItem('one.chat', JSON.stringify(ONE.chat.slice(-60))); } catch (e) {} };
const ONE_SUG = ['Comment je récupère cette semaine par rapport à la précédente ?', 'Que manger avant ma prochaine séance, et à quelle heure ?', 'Pourquoi ma VFC a bougé ces derniers jours ?', 'Organise ma journée de demain heure par heure', 'Est-ce que ma charge monte trop vite ?', 'Mes douleurs : qu\'est-ce que je dois adapter ?'];
// Tout ce que l'appli sait, en texte : l'état du jour, 90 jours de mesures, les séances, le programme, le menu, le profil.
function oneContext() {
  const L = [], t = (f, d = '') => { try { return f() ?? d; } catch (e) { return d; } };
  L.push('Aujourd\'hui : ' + TODAY + ' (' + t(() => fmtDay(TODAY)) + '), heure ' + new Date().toTimeString().slice(0, 5));
  L.push(t(() => claudeContext()));
  L.push('\n## 90 derniers jours\ndate;récupération %;sommeil h;VFC ms;FC repos;effort /21;poids kg;kcal;protéines g;sprint m;douleurs');
  for (let i = 89; i >= 0; i--) { const k = addDays(TODAY, -i);
    L.push([k, t(() => recovery(k)?.score), t(() => VAL.sleepH(k) != null ? fx(VAL.sleepH(k), 1) : ''), t(() => G(k, 'hrv')), t(() => G(k, 'rhr')), t(() => effortDay(k) != null ? fx(effortDay(k), 1) : ''),
      t(() => W(k, 'weight')), t(() => Math.round(dayTotals(k).kcal) || ''), t(() => Math.round(dayTotals(k).p) || ''), t(() => VAL.sprint(k) || ''),
      t(() => Object.entries(pains(k) || {}).filter(([, v]) => v > 0).map(([a, v]) => a + ' ' + v).join(' '))].join(';')); }
  L.push('\n## Séances faites (60 jours)'); t(() => logs().filter(l => l.date >= addDays(TODAY, -60)).forEach(l => L.push(`${l.date} · ${l.name} · ${l.min} min · RPE ${l.rpe}${l.sprintM ? ' · ' + l.sprintM + ' m de sprint' : ''}${l.tonnage ? ' · ' + Math.round(l.tonnage) + ' kg soulevés' : ''}`)));
  L.push('\n## Programme des 14 prochains jours'); for (let i = 0; i < 14; i++) { const k = addDays(TODAY, i); L.push(k + ' : ' + (['track', 'gym'].map(kd => t(() => planForK(k, kd)?.name)).filter(Boolean).join(' + ') || 'pas de séance')); }
  L.push('\n## Planning du jour'); t(() => dayPlan(TODAY).forEach(x => L.push(`${x.a}–${x.b} ${plName(x.n)}`)));
  L.push('\n## Menu du jour'); t(() => (menuFor(TODAY) || []).forEach(x => L.push(`${x.meal || ''} · ${x.n}${x.g ? ' ' + Math.round(x.g) + ' g' : ''}${x.kcal ? ' · ' + Math.round(x.kcal) + ' kcal' : ''}`)));
  L.push('\n## Objectifs du jour'); t(() => L.push(JSON.stringify(fuelGoal(TODAY))));
  L.push('\n## Profil'); t(() => L.push(JSON.stringify(S.profile || {})));
  return L.join('\n');
}
const oneMd = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/^#+\s*(.+)$/gm, '<b>$1</b>').replace(/^[-•]\s+/gm, '• ').replace(/\n/g, '<br>');
function oneAiOpen() {
  let el = $('#one-ai');
  if (!el) {
    el = document.createElement('div'); el.id = 'one-ai'; el.className = 'one-ai';
    el.innerHTML = `<div class="one-ai-bg" data-one-aix></div><div class="one-ai-card" role="dialog" aria-label="Coach IA"><header><span class="one-ai-ic">${oneIc('ai', 22)}</span><div><b>Coach IA</b><small>connaît toutes tes données</small></div><button class="one-ai-new" data-one-new>Nouvelle</button><button class="one-ai-x" data-one-aix aria-label="Fermer">×</button></header>
      <div class="one-ai-log" id="one-ai-log"></div><form class="one-ai-f" id="one-ai-f"><textarea rows="1" placeholder="Pose ta question…" aria-label="Ta question"></textarea><button type="submit" aria-label="Envoyer">↑</button></form></div>`;
    document.body.appendChild(el);
    const f = el.querySelector('form'), ta = f.querySelector('textarea');
    f.onsubmit = e => { e.preventDefault(); const q = ta.value.trim(); if (q) { ta.value = ''; ta.style.height = ''; oneAsk(q); } };
    ta.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); f.requestSubmit(); } });
    ta.addEventListener('input', () => { ta.style.height = ''; ta.style.height = Math.min(120, ta.scrollHeight) + 'px'; });
  }
  if (!ONE.aiOpen) { ONE.aiOpen = true; try { history.pushState({mod: S.mod, one: history.state?.one, oneai: 1}, ''); } catch (e) {} }
  el.hidden = false; requestAnimationFrame(() => el.classList.add('on')); oneAiDraw(); oneHap(6);
}
function oneAiClose(fromBack) {
  const el = $('#one-ai'); if (!el || !ONE.aiOpen) return; ONE.aiOpen = false;
  el.classList.remove('on'); setTimeout(() => { if (!ONE.aiOpen) el.hidden = true; }, 350);
  if (!fromBack && history.state?.oneai) { POP_SKIP = true; history.back(); }
}
function oneAiDraw() {
  const log = $('#one-ai-log'); if (!log) return;
  const msgs = ONE.chat.map(m => `<div class="one-b ${m.role === 'user' ? 'me' : 'it'}${m.err ? ' err' : ''}">${m.role === 'user' ? esc(m.content).replace(/\n/g, '<br>') : oneMd(m.content)}</div>`).join('');
  log.innerHTML = (ONE.chat.length ? '' : `<div class="one-ai-hi"><b>Pose-moi n'importe quelle question.</b><p>Je lis ta forme, ton sommeil, ta VFC, tes séances, ta charge, tes repas, ton programme et tes douleurs avant de répondre. Tu peux demander au jour près, ou à l'heure près.</p></div>`)
    + msgs + (ONE.busy ? '<div class="one-b it typing"><i></i><i></i><i></i></div>' : '')
    + (ONE.busy ? '' : `<div class="one-sugs">${ONE_SUG.map(s => `<button data-one-sug>${esc(s)}</button>`).join('')}</div>`);
  log.scrollTop = log.scrollHeight;
}
async function oneAsk(q) {
  if (!q || ONE.busy) return;
  ONE.chat.push({role: 'user', content: q}); ONE.busy = true; oneChatSave(); oneAiDraw();
  // On n'envoie pas les messages d'erreur, ni une question restée sans réponse.
  const send = ONE.chat.filter((m, i, a) => !m.err && !(m.role === 'user' && a[i + 1]?.err)).map(({role, content}) => ({role, content}));
  try {
    const tok = await window.RECUP_TOKEN?.(); if (!tok) throw new Error('Connecte-toi à ton compte pour parler au coach.');
    const r = await fetch(RECUP_SUPABASE.url + '/functions/v1/coach', {method: 'POST', headers: {Authorization: 'Bearer ' + tok, apikey: RECUP_SUPABASE.key, 'Content-Type': 'application/json'}, body: JSON.stringify({context: oneContext(), messages: send})});
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || (r.status === 404 ? 'Le coach n\'est pas encore installé sur ton serveur (fonction « coach » à ajouter dans Supabase).' : 'Erreur ' + r.status));
    ONE.chat.push({role: 'assistant', content: j.text || '(pas de réponse)'});
  } catch (e) { ONE.chat.push({role: 'assistant', content: '⚠ ' + (e?.message || e), err: 1}); }
  ONE.busy = false; oneChatSave(); oneAiDraw();
}

/* ---------- les plannings : même format en T, N et R ---------- */
// Les cases « + » vides de Nutrition et Recovery reçoivent le même « + » que Training (le style fait le reste).
function onePlan(root) { root?.querySelectorAll('.sboard .bcell:not(.past) .bplus:empty').forEach(b => { b.textContent = '+'; }); }

/* ---------- le questionnaire du jour, habillé plus moderne ---------- */
const oneOpenSheet0 = openSheet;
openSheet = function (kind, ...a) { const r = oneOpenSheet0(kind, ...a); $('#sheet')?.classList.toggle('one-qs', kind === 'note'); return r; };

// Les fonctions du moteur qui changent de page passent par ici : barre juste, plannings alignés, animations.
const oneAfter = () => { const v = oneView(); onePlan(v); oneAnim(v); };
const oneSetTab0 = setTab; setTab = function (t) { oneSetTab0(t); oneSync(); };
const oneRender0 = render; render = function (...a) { const r = oneRender0(...a); if (S.mod === 'R') oneAfter(); return r; };
const oneRenderMod0 = renderMod; renderMod = function (f) { oneRenderMod0(f); oneSync(); if (S.mod === 'T' || S.mod === 'N') oneAfter(); };
oneMount();
addEventListener('popstate', () => {
  if (ONE.aiOpen) { oneAiClose(true); return; }
  if (S.sheet || P.stack.length || PLFS.on || POP_SKIP || !ONE.mods.includes(S.mod)) return; if (oneIdx() > 0) oneTab(0);
}, true);
// Au démarrage : directement dans le dernier module et le dernier onglet utilisés (Training · Aujourd'hui la première fois).
(function oneStart(n = 0) {
  if ((window.TNR_SPLASH_ON || !S.mod) && n < 200) { setTimeout(() => oneStart(n + 1), 100); return; }
  const s = oneSaved(); if (!ONE.mods.includes(S.mod)) oneSwitch(s.m, s.i); ONE.ready = true; oneSync(); oneAfter();
})();
