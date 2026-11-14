/* ================= TNR · LABO « NX » : a new app on the same engine =================
   Four places instead of three parts × six tabs: Aujourd'hui, Semaine, Séances, Progrès.
   No AI by default: every number and every advice comes from rules and his own data.
   The ✦ button brings Claude in, only when he asks for it. */

const NX = {tab: 'today', day: TODAY, wk: 0, lib: {seg: 'mine', f: 'all', q: ''}, pn: 30, classic: false, sh: [], html: {}, ai: false,
  open: {}, lv: {open: false, i: 0}, rest: null, t: null, dir: 1, ready: false, drag: null, pend: false};
try { const t = localStorage.getItem('nx.tab'); if (['today', 'week', 'lib', 'prog'].includes(t)) NX.tab = t; NX.ai = localStorage.getItem('nx.ai') === '1'; NX.pn = +localStorage.getItem('nx.pn') || 30; } catch (e) {}
const NX_TABS = [['today', 'Aujourd\'hui'], ['week', 'Semaine'], ['lib', 'Séances'], ['prog', 'Progrès']];
const NXC = {track: '#FF9F0A', gym: '#FF453A', good: '#30D158', warn: '#FFD60A', bad: '#FF453A', none: '#8E8E93', T: '#FF453A', N: '#30D158', R: '#0A84FF', ai: '#BF8CFF',
  water: '#40C8E0', kcal: '#F5A524', p: '#FF6B6B', c: '#4CC38A', sleep: '#8E7CF0', hrv: '#30D158', rhr: '#FF6482', load: '#FF9F0A', weight: '#64D2FF'};
const NX_CATC = {'Accélération': '#FF9F0A', 'Vitesse max': '#FF453A', 'Endurance de vitesse': '#FF375F', 'Résistance': '#BF5AF2', 'Tempo': '#64D2FF', 'Échauffement et gammes': '#8E8E93',
  'Bas du corps': '#FF453A', 'Chaîne postérieure': '#FF9F0A', 'Pliométrie': '#FFD60A', 'Haltérophilie': '#BF5AF2', 'Prévention': '#30D158', 'Tronc': '#64D2FF', 'Haut du corps': '#0A84FF'};
const nxCat = id => NX_CATC[exOf(id).cat] || '#8E8E93';
const nxHap = (ms = 8) => { if (PREFS.haptic !== false) try { navigator.vibrate?.(ms); } catch (e) {} };

/* ---------- icons ---------- */
const NXP = {
  today: '<circle cx="12" cy="12" r="8.5" opacity=".35"/><path d="M12 3.5a8.5 8.5 0 0 1 8.2 10.7"/><circle cx="12" cy="12" r="2.2"/>',
  week: '<rect x="3.5" y="5" width="17" height="15.5" rx="3.5"/><path d="M3.5 10h17M8.5 3v4M15.5 3v4"/><path d="M8 14.5h2M14 14.5h2M8 17.5h2"/>',
  lib: '<path d="M13 2.5 5.5 13.2h5.6L10.5 21.5 18.5 10.4h-5.7z"/>',
  prog: '<path d="M3.5 19.5h17"/><path d="M5.5 15.5l4.2-4.6 3.6 2.8 5.7-6.7"/><path d="M15.5 7h3.5v3.5"/>',
  spark: '<path d="M12 3.2c.5 4.6 2.4 6.6 7 7.2-4.6.6-6.5 2.6-7 7.2-.5-4.6-2.4-6.6-7-7.2 4.6-.6 6.5-2.6 7-7.2z"/><path d="M19 3.5v3M17.5 5h3"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', x: '<path d="M6 6l12 12M18 6 6 18"/>', check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  play: '<path d="M8 5.5v13l10.5-6.5z" fill="currentColor" stroke="none"/>', up: '<path d="M6 14l6-6 6 6"/>', down: '<path d="M6 10l6 6 6-6"/>',
  left: '<path d="M15 5l-7 7 7 7"/>', right: '<path d="M9 5l7 7-7 7"/>', copy: '<rect x="8.5" y="8.5" width="11" height="11" rx="2.5"/><path d="M15.5 5.5V5a1.5 1.5 0 0 0-1.5-1.5H6A1.5 1.5 0 0 0 4.5 5v8A1.5 1.5 0 0 0 6 14.5h.5"/>',
  edit: '<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/>', trash: '<path d="M4.5 7h15M10 11v6M14 11v6M6 7l1 12.5h10L18 7M9 7V4.5h6V7"/>',
  grip: '<circle cx="9" cy="7" r="1"/><circle cx="15" cy="7" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="9" cy="17" r="1"/><circle cx="15" cy="17" r="1"/>',
  list: '<path d="M9 6.5h11M9 12h11M9 17.5h11M4.5 6.5h.01M4.5 12h.01M4.5 17.5h.01"/>', moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>',
  heart: '<path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.4a4.3 4.3 0 0 1 7.5 2.4C19.5 15.4 12 20 12 20z"/>', wave: '<path d="M3 12h3.5l2.5-6 4 12 3-9 1.5 3H21"/>',
  drop: '<path d="M12 3.5s6 6.4 6 10.5a6 6 0 0 1-12 0c0-4.1 6-10.5 6-10.5z"/>', bolt: '<path d="M13 2.5 5.5 13.2h5.6L10.5 21.5 18.5 10.4h-5.7z"/>', clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  cal: '<rect x="3.5" y="5" width="17" height="15.5" rx="3.5"/><path d="M3.5 10h17M8.5 3v4M15.5 3v4M12 13v5M9.5 15.5h5"/>', flag: '<path d="M5 21V4.5M5 4.5h11l-2 4 2 4H5"/>',
  bottle: '<path d="M10 2.5h4v3l1.5 2v12a2 2 0 0 1-2 2h-3a2 2 0 0 1-2-2v-12l1.5-2z"/><path d="M8.5 12h7"/>', fork: '<path d="M7 3v8a2.5 2.5 0 0 0 5 0V3M9.5 3v18M17 3c-1.7 1.3-2.5 3.6-2.5 6.5V13h2.5v8"/>',
  out: '<path d="M14 4.5h5.5V10M19.5 4.5 11 13M18 14v4.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6H10"/>'
};
const ic = (n, s = 22) => `<svg class="i" viewBox="0 0 24 24" width="${s}" height="${s}" aria-hidden="true">${NXP[n] || ''}</svg>`;

/* ---------- small helpers ---------- */
const nxRest = s => !s ? '–' : s >= 60 ? `${Math.floor(s / 60)} min${s % 60 ? ' ' + String(s % 60).padStart(2, '0') : ''}` : s + ' s';
const nxSpan = m => m >= 60 ? Math.floor(m / 60) + ' h' + (m % 60 ? ' ' + String(m % 60).padStart(2, '0') : '') : Math.max(1, m) + ' min';
const nxCnt = (v, d = 0) => v == null || isNaN(v) ? '–' : `<span class="nx-cnt" data-v="${v}" data-d="${d}">${fx(v, d)}</span>`;
const nxNow = () => new Date().getHours() * 60 + new Date().getMinutes();
const nxKind = p => p?.kind === 'track' ? 'track' : 'gym';
const nxKindName = k => k === 'track' ? 'Piste' : 'Muscu';
const nxNorm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
function nxItemTxt(it) {
  const e = exOf(it.ex), u = unitOf(it);
  if (it.ex === 'warmup' || e.u === 'min') return (it.min || 15) + ' min';
  if (it.seq) return `${(it.blocks || 1) > 1 ? it.blocks + ' × ' : ''}${it.seq.join(' – ')} m${it.pct ? ' · ' + it.pct + ' %' : ''}`;
  if (e.t === 'test') return (it.reps || 3) + ' essais';
  if (e.t === 'track') return [`${it.reps || 1} × ${it.dist ? it.dist + ' m' : ''}`.trim(), it.pct ? it.pct + ' %' : '', it.rest ? 'récup ' + nxRest(it.rest) : ''].filter(Boolean).join(' · ');
  return [`${it.sets || 1} × ${it.reps || '?'}${u === 's' ? ' s' : ''}`, it.pct ? it.pct + ' %' : it.kg ? it.kg + ' kg' : '', it.rest ? 'récup ' + nxRest(it.rest) : ''].filter(Boolean).join(' · ');
}
// Sprint metres that count (as the engine counts them): sprint categories at 90 % or more.
function nxSprintM(p) {
  if (!p || p.kind !== 'track') return 0;
  return (p.items || []).reduce((s, it) => s + (SPRINT_CATS.includes(exOf(it.ex).cat) && (it.pct ?? 100) >= 90 ? (it.seq ? it.seq.reduce((a, b) => a + (+b || 0), 0) * (it.blocks || 1) : (+it.reps || 1) * (+it.dist || 0)) : 0), 0);
}
const nxSets = p => (p?.items || []).reduce((s, it) => s + (it.min ? 0 : +(it.sets || it.reps || 0)), 0);
function nxRing(v, col, size = 160, w = 14, cls = 'nx-arc') {
  const r = (size - w) / 2, c = 2 * Math.PI * r, o = v == null ? c : c * (1 - clamp(v, 0, 100) / 100), m = size / 2;
  return `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" aria-hidden="true"><circle cx="${m}" cy="${m}" r="${r}" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="${w}"/><circle class="${cls}" cx="${m}" cy="${m}" r="${r}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${o.toFixed(1)}" style="--c0:${c.toFixed(1)}" transform="rotate(-90 ${m} ${m})"/></svg>`;
}

/* ---------- the shell ---------- */
function nxMount() {
  document.documentElement.classList.add('nx-on');
  const tabs = NX_TABS.map(([t, n]) => `<button data-nx="tab" data-a="${t}" aria-label="${n}">${ic(t, 24)}<span>${n}</span></button>`).join('');
  document.body.insertAdjacentHTML('beforeend', `
  <div id="nx" class="nx">
    <div class="nx-aura" aria-hidden="true"><i></i><i></i><i></i></div>
    <aside class="nx-side"><div class="nx-logo"><b>TNR</b><span>Labo</span></div><nav>${tabs}</nav>
      <button class="nx-side-ai" data-nx="ai">${ic('spark', 20)}<span>Coach IA</span><em id="nx-side-ai"></em></button>
      <button class="nx-side-set" data-nx="set">${ic('gear', 20)}<span>Réglages du labo</span></button>
      <p class="nx-side-note">Labo : rien de ce que tu fais ici ne change ton vrai compte.</p></aside>
    <header class="nx-top"><div class="nx-logo"><b>TNR</b><span>Labo</span></div><span class="nx-top-t" id="nx-top-t"></span>
      <div class="nx-top-r"><button class="nx-aib" data-nx="ai" aria-label="Coach IA">${ic('spark', 18)}<span>IA</span></button><button class="nx-ib" data-nx="set" aria-label="Réglages du labo">${ic('gear', 22)}</button></div></header>
    <main class="nx-main" id="nx-main"><div id="nx-page" class="nx-page"></div></main>
    <nav class="nx-tabs" id="nx-tabs"><span class="nx-pill" id="nx-pill"></span>${tabs}</nav>
  </div>
  <div id="nx-shs"></div>
  <div id="nx-live" class="nx-live" hidden></div>
  <div id="nx-cele" class="nx-cele" hidden></div>
  <button id="nx-new" class="nx-backnew" data-nx="new" hidden>${ic('spark', 16)} Revenir au labo</button>`);
  const main = $('#nx-main');
  main.addEventListener('scroll', () => $('#nx').classList.toggle('sc', main.scrollTop > 28), {passive: true});
  addEventListener('resize', () => nxPillMove(true));
}
const NX_PAGES = {today: () => nxToday(), week: () => nxWeek(), lib: () => nxLib(), prog: () => nxProg()};
function nxSoon(ms = 90) { if (NX.classic) return; clearTimeout(NX.t); NX.t = setTimeout(() => nxDraw(false), ms); }
function nxDraw(enter, force) {
  if (NX.classic) return;
  // The labo has its own AI switch (off unless he turns it on here); the engine reads it from S.app.
  if (S.app && (S.app.ai !== false) !== NX.ai) S.app = {...S.app, ai: NX.ai};
  const pg = $('#nx-page'); if (!pg) return;
  if (!NX.ready) return;
  const ae = document.activeElement;
  if (!enter && !force && (NX.drag || (ae && pg.contains(ae) && /INPUT|TEXTAREA|SELECT/.test(ae.tagName)))) { NX.pend = true; return; }
  NX.pend = false;
  let html; try { html = NX_PAGES[NX.tab](); } catch (e) { console.error(e); html = `<div class="nx-pg"><div class="nx-card nx-err"><b>Cette page n'a pas pu s'afficher</b><small>${esc(String(e?.message || e))}</small></div></div>`; }
  if (enter || NX.html[NX.tab] !== html || pg.dataset.tab !== NX.tab) {
    const main = $('#nx-main'), y = main.scrollTop;
    pg.innerHTML = html; pg.dataset.tab = NX.tab; NX.html[NX.tab] = html;
    if (enter) { pg.classList.remove('enter', 'l', 'r'); void pg.offsetWidth; pg.classList.add('enter', NX.dir < 0 ? 'l' : 'r'); nxCount(pg); clearTimeout(NX.et); NX.et = setTimeout(() => pg.classList.remove('enter'), 1400); }
    else if (!pg.classList.contains('enter')) main.scrollTop = y;
  }
  for (const v of NX.sh) if (v.auto && !(ae && v.el.contains(ae) && /INPUT|TEXTAREA/.test(ae.tagName))) nxShDraw(v);
  nxChrome();
  if (NX.lv.open) { if (!S.live) nxLiveDone(); else if (!NX.lvInput) nxLiveDraw(); }
}
function nxChrome() {
  const kG = lastKey('hrv'), sc = kG ? recovery(kG)?.score : null, zc = NXC[zoneOf(sc)] || NXC.none;
  $('#nx')?.style.setProperty('--zc', zc);
  document.querySelectorAll('#nx [data-nx="tab"]').forEach(b => b.classList.toggle('on', b.dataset.a === NX.tab));
  const t = $('#nx-top-t'); if (t) t.textContent = (NX_TABS.find(x => x[0] === NX.tab) || [])[1] || '';
  const sa = $('#nx-side-ai'); if (sa) sa.textContent = NX.ai ? 'activé' : 'désactivé';
  document.querySelectorAll('.nx-aib').forEach(b => b.classList.toggle('on', NX.ai));
  nxPillMove();
}
function nxPillMove(now) {
  const b = $(`#nx-tabs [data-a="${NX.tab}"]`), p = $('#nx-pill'); if (!b || !p) return;
  if (now) p.style.transition = 'none';
  p.style.width = b.offsetWidth + 'px'; p.style.transform = `translateX(${b.offsetLeft}px)`;
  if (now) requestAnimationFrame(() => p.style.transition = '');
}
function nxTab(t, push = true) {
  if (!NX_PAGES[t]) return;
  const main = $('#nx-main');
  if (t === NX.tab) { main.scrollTo({top: 0, behavior: 'smooth'}); return; }
  const from = NX_TABS.findIndex(x => x[0] === NX.tab), to = NX_TABS.findIndex(x => x[0] === t);
  NX.dir = to >= from ? 1 : -1; NX.tab = t; nxHap(6);
  try { localStorage.setItem('nx.tab', t); } catch (e) {}
  try { if (push && t !== 'today' && !history.state?.nxt) history.pushState({mod: S.mod, nxt: t}, ''); else if (history.state?.nxt) history.replaceState({mod: S.mod, nxt: t}, ''); } catch (e) {}
  main.scrollTop = 0; nxDraw(true);
}
// Numbers count up when a page arrives.
function nxCount(root) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const els = [...root.querySelectorAll('.nx-cnt')]; if (!els.length) return;
  const t0 = performance.now(), D = 900;
  const step = t => { const k = Math.min(1, (t - t0) / D), e = 1 - Math.pow(1 - k, 3);
    for (const el of els) { if (!el.isConnected) continue; const v = +el.dataset.v, d = +el.dataset.d || 0; el.textContent = fx(v * e, d); }
    if (k < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}

/* ---------- sheets (the labo's own) ---------- */
function nxOpen(v) {
  const same = NX.sh.find(s => s.id === v.id); if (same) { Object.assign(same, v); nxShDraw(same); return; }
  const el = document.createElement('div'); el.className = 'nx-sh' + (v.full ? ' full' : '') + (v.cls ? ' ' + v.cls : '');
  el.innerHTML = `<div class="nx-sh-bg" data-nx="sh-x"></div><div class="nx-sh-card" role="dialog" aria-modal="true" aria-label="${esc(v.title || '')}"><div class="nx-sh-hd"><span class="nx-grab"></span><b>${esc(v.title || '')}</b><button class="nx-ib nx-sh-x" data-nx="sh-x" aria-label="Fermer">${ic('x', 20)}</button></div><div class="nx-sh-body"></div><div class="nx-sh-ft" hidden></div></div>`;
  $('#nx-shs').appendChild(el); v.el = el; NX.sh.push(v); nxShDraw(v);
  requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('on')));
  try { history.pushState({mod: S.mod, nxs: NX.sh.length}, ''); } catch (e) {}
  nxHap(6);
}
function nxShDraw(v = NX.sh.at(-1)) {
  if (!v) return;
  const b = v.el.querySelector('.nx-sh-body'), y = b.scrollTop;
  let h; try { h = v.render(); } catch (e) { console.error(e); h = `<div class="nx-card nx-err"><b>Cette fenêtre n'a pas pu s'afficher</b><small>${esc(String(e?.message || e))}</small></div>`; }
  if (b._h !== h) { b.innerHTML = h; b._h = h; b.scrollTop = y; }
  const f = v.el.querySelector('.nx-sh-ft'), fh = v.foot ? v.foot() : '';
  if (f._h !== fh) { f.innerHTML = fh; f._h = fh; } f.hidden = !fh;
  v.mount?.(v.el);
}
// Closing goes through the history, so the phone's back gesture and the buttons do the same thing.
function nxClose() { if (!NX.sh.length) return; const v = NX.sh.at(-1); if (v.guard && !v.guard()) return; v.guard = null; if (history.state?.nxs) history.back(); else nxPop(); }
function nxPop() {
  const v = NX.sh.pop(); if (!v) return;
  if (v.guard && !v.guard()) { NX.sh.push(v); try { history.pushState({mod: S.mod, nxs: NX.sh.length}, ''); } catch (e) {} return; }
  v.onClose?.(); v.el.classList.remove('on'); v.el.classList.add('off'); setTimeout(() => v.el.remove(), 450); nxSoon(20);
}
// Closes every labo sheet at once (no animation wait), and drops their history steps in one go.
function nxCloseAll() {
  const n = NX.sh.length; if (!n) return;
  while (NX.sh.length) { const v = NX.sh.pop(); v.onClose?.(); v.el.classList.remove('on'); v.el.classList.add('off'); const el = v.el; setTimeout(() => el.remove(), 450); }
  if (history.state?.nxs) { NX.skipPop = true; try { history.go(-Math.min(n, history.state.nxs)); } catch (e) { NX.skipPop = false; } }
}
addEventListener('popstate', () => {
  if (NX.skipPop) { NX.skipPop = false; return; }
  if (NX.classic) return;
  if (P.stack.length || S.sheet || PLFS.on) return;   // the engine closes its own windows
  if (NX.sh.length) { nxPop(); return; }
  if (NX.lv.open) { nxLiveHide(true); return; }
  if (NX.tab !== 'today') nxTab('today', false);
}, true);
// Pull the sheet down by its top to close it.
document.addEventListener('pointerdown', e => {
  const hd = e.target.closest('.nx-sh-hd'); if (!hd || e.target.closest('button')) return;
  const card = hd.closest('.nx-sh-card'); NX.shd = {card, y0: e.clientY, dy: 0, id: e.pointerId}; card.style.transition = 'none'; hd.setPointerCapture?.(e.pointerId);
});
document.addEventListener('pointermove', e => { const d = NX.shd; if (!d || e.pointerId !== d.id) return; d.dy = Math.max(0, e.clientY - d.y0); d.card.style.transform = `translateY(${d.dy}px)`; });
const nxShUp = e => { const d = NX.shd; if (!d || e.pointerId !== d.id) return; NX.shd = null; d.card.style.transition = ''; d.card.style.transform = ''; if (d.dy > 110) nxClose(); };
document.addEventListener('pointerup', nxShUp); document.addEventListener('pointercancel', nxShUp);

/* ================= PAGE 1 · AUJOURD'HUI ================= */
function nxToday() {
  const kG = lastKey('hrv'), rec = kG ? recovery(kG) : null, sc = rec?.score ?? null, z = zoneOf(sc), zc = NXC[z] || NXC.none;
  const hi = highDay(TODAY), tgt = effortTarget(sc, hi);
  const card = (cls, order, col, html, extra = '') => `<section class="nx-card ${cls}" style="--o:${order};${extra}">${html}</section>`;
  // Forme
  const sl = kG ? VAL.sleepH(kG) : null, need = sleepGoal(), hrv = kG ? G(kG, 'hrv') : null, hb = kG ? base('hrv', kG, 60) : null, rhr = kG ? G(kG, 'rhr') : null, rb = kG ? base('rhr', kG, 60) : null;
  const vit = (icn, col, lab, val, sub, st) => `<div class="nx-vit ${st || ''}" style="--c:${col}">${ic(icn, 16)}<span>${lab}</span><b>${val}</b><small>${sub}</small></div>`;
  const hero = `<button class="nx-hero-in" data-nx="why" aria-label="Pourquoi ce score">
      <div class="nx-ring">${nxRing(sc, zc, 176, 15)}<div class="nx-ring-v"><b>${sc == null ? '–' : nxCnt(sc)}${sc == null ? '' : '<small>%</small>'}</b><span>Forme</span></div></div>
      <div class="nx-hero-t"><span class="nx-tag" style="--c:${zc}">${esc(ZONE[z])}</span><p class="nx-say">${esc(tgt.text)}</p><span class="nx-more">${kG && kG !== TODAY ? 'Dernière mesure : ' + esc(fmtShort(kG)) + ' · ' : ''}Pourquoi ce score ›</span></div></button>
    <div class="nx-vits">${vit('moon', NXC.sleep, 'Sommeil', hmH(sl), 'besoin ' + hmH(need), sl == null ? '' : sl >= need - .3 ? 'ok' : sl >= need - 1 ? 'mid' : 'bad')}
      ${vit('wave', NXC.hrv, 'VFC', hrv != null ? hrv + ' ms' : '–', hb && hrv != null ? (hrv >= hb.m ? '+' : '−') + Math.abs(Math.round((hrv / hb.m - 1) * 100)) + ' % / ta base' : 'base en calcul', hb && hrv != null ? (hrv >= hb.m * .95 ? 'ok' : hrv >= hb.m * .85 ? 'mid' : 'bad') : '')}
      ${vit('heart', NXC.rhr, 'FC repos', rhr != null ? rhr + ' bpm' : '–', rb ? 'base ' + fx(rb.m) + ' bpm' : '', rb && rhr != null ? (rhr <= rb.m + 2 ? 'ok' : rhr <= rb.m + 5 ? 'mid' : 'bad') : '')}</div>`;
  const C = nxCoach(rec, tgt, kG), nC = NX.open.coach ? C.length : 3;
  const WHO = {T: NXC.T, N: NXC.N, R: NXC.R};
  const coach = `<h3 class="nx-ct">À retenir aujourd'hui<small>sans IA · tes règles et tes données</small></h3>
    ${C.slice(0, nC).map(x => `<div class="nx-tip ${x.z}"><i style="--c:${WHO[x.who] || NXC.none}">${x.who}</i><p>${esc(x.t)}${x.h ? `<span class="cact">${x.h}</span>` : ''}</p></div>`).join('') || '<p class="nx-empty">Rien à corriger : continue exactement comme ça.</p>'}
    ${C.length > 3 ? `<button class="nx-link" data-nx="open" data-a="coach">${NX.open.coach ? 'Moins' : 'Voir les ' + C.length + ' conseils'}</button>` : ''}`;
  const AI = NX.ai ? AN()?.homeText : null;
  const cards = [
    `<div class="nx-col c1">`,
    card('nx-hero', 1, zc, hero, `--zc:${zc}`),
    nxCheckCard(2),
    card('nx-coach', 6, '', coach),
    `</div><div class="nx-col c2">`,
    nxSessCards(3, sc, hi, tgt),
    card('nx-dayc', 4, '', `<h3 class="nx-ct">Ta journée<small>${NX.open.day ? 'toute la journée' : 'à partir de maintenant'}</small></h3><div class="nx-tls">${nxDayLine(TODAY, !!NX.open.day) || '<p class="nx-empty">Plus rien de prévu : place au calme et au sommeil.</p>'}</div><button class="nx-link" data-nx="open" data-a="day">${NX.open.day ? 'Seulement la suite' : 'Toute la journée'}</button>`),
    `</div><div class="nx-col c3">`,
    nxFuelCard(5),
    AI ? card('nx-aic', 7, '', `<h3 class="nx-ct"><span class="nx-spk">${ic('spark', 16)}</span>Analyse de Claude<small>coach IA activé</small></h3><p>${esc(AI)}</p><button class="nx-link" data-nx="ai">Poser une question ›</button>`) : '',
    `</div>`
  ].join('');
  const h = new Date().getHours(), hello = (h < 5 ? 'Bonne nuit' : h < 18 ? 'Bonjour' : 'Bonsoir') + ' ' + (S.profile?.name || 'Oscar');
  return `<div class="nx-pg nx-today"><div class="nx-h"><p class="nx-eye">${esc(cap(fmtDay(TODAY)))}</p><h1>${esc(hello)}</h1></div>${nxStrip()}<div class="nx-cols">${cards}</div></div>`;
}
function nxStrip() {
  const mon = monday(TODAY);
  return `<div class="nx-strip">${[...Array(7)].map((_, i) => { const k = addDays(mon, i), t = planForK(k, 'track'), g = planForK(k, 'gym');
    const dots = [t ? `<em class="${kindDone(k, 'track') ? 'dn' : ''}" style="--c:${NXC.track}"></em>` : '', g ? `<em class="${kindDone(k, 'gym') ? 'dn' : ''}" style="--c:${NXC.gym}"></em>` : ''].join('');
    return `<button class="nx-sd${k === TODAY ? ' on' : ''}${k < TODAY ? ' past' : ''}" data-nx="goday" data-a="${k}" aria-label="${esc(fmtDay(k))}"><span>${DOW[i]}</span><b>${+k.slice(8)}</b><i>${dots}</i></button>`; }).join('')}</div>`;
}
function nxCheckCard(order) {
  const W0 = M(TODAY, 'well') || {}, PN = pains(TODAY), n = WELL.filter(([id]) => W0[id]).length, done = n === WELL.length;
  if (done && !NX.open.check) {
    const lab = {slq: 'Sommeil', fat: 'Fraîcheur', sor: 'Courbatures', str: 'Stress', mood: 'Humeur'};
    const pn = Object.entries(PN).filter(([, v]) => v > 0);
    return `<section class="nx-card nx-check done" style="--o:${order}"><div class="nx-chk-ok">${ic('check', 18)}</div><div><b>Check du matin fait</b><small>${WELL.map(([id]) => `${lab[id]} ${W0[id]}`).join(' · ')}${pn.length ? ' · douleur : ' + pn.map(([l, v]) => esc(l) + ' ' + v).join(', ') : ''}</small></div><button class="nx-link" data-nx="open" data-a="check">Modifier</button></section>`;
  }
  return `<section class="nx-card nx-check" style="--o:${order}"><h3 class="nx-ct">Check du matin<small>${n}/${WELL.length} · 1 = mal, 5 = au top</small></h3>
    ${WELL.map(([id, nm, lo, hi]) => `<div class="nx-q"><span>${esc(nm)}<small>${esc(lo)} → ${esc(hi)}</small></span><div class="nx-dots">${[1, 2, 3, 4, 5].map(v => `<button class="${W0[id] === v ? 'on' : ''}" data-nx="well" data-a="${id}" data-b="${v}" aria-label="${esc(nm)} ${v}" style="--c:${['', '#FF453A', '#FF9F0A', '#FFD60A', '#9BE15D', '#30D158'][v]}">${v}</button>`).join('')}</div></div>`).join('')}
    <div class="nx-q nx-qp"><span>Une douleur ?<small>touche pour monter : 2, 4, 6, 8, puis retirer</small></span><div class="nx-chips">${COMMON_PAINS.concat(Object.keys(PN).filter(l => !COMMON_PAINS.includes(l))).map(p => { const v = PN[p] || 0; return `<button class="nx-chip${v ? ' on' : ''}" data-nx="pain" data-a="${esc(p)}" style="--c:${v >= 6 ? NXC.bad : v >= 3 ? NXC.warn : NXC.good}">${esc(p)}${v ? ` <b>${v}</b>` : ''}</button>`; }).join('')}</div></div>
    ${done ? '<button class="nx-btn" data-nx="open" data-a="check">C\'est noté</button>' : ''}
    <button class="nx-link" data-nx="note">Questionnaire complet (journée, activités, notes) ›</button></section>`;
}
async function nxManual(fn) {
  const doc = structuredClone(S.manual[TODAY] || {}); fn(doc); doc.date = TODAY; doc.updatedAt = new Date().toISOString();
  S.manual[TODAY] = doc; nxSoon(10);
  try { await S.db?.collection('manual').doc(TODAY).set(doc); } catch (e) { toast('Échec de l\'enregistrement'); }
}
function nxSessCards(order, sc, hi, tgt) {
  const out = [], L = S.live;
  if (L) {
    const c = nxLiveCount(L), min = Math.max(0, Math.floor((Date.now() - new Date(L.start)) / 60000)), kc = NXC[nxKind(L)];
    out.push(`<section class="nx-card nx-sess live" style="--o:${order};--k:${kc}"><div class="nx-sess-top"><span class="nx-kind"><i class="nx-live-dot"></i>En cours · ${min} min</span><span class="nx-sess-min">${c.d}/${c.n}</span></div><h2>${esc(L.name)}</h2><div class="nx-bar"><i style="width:${c.n ? c.d / c.n * 100 : 0}%"></i></div><div class="nx-row"><button class="nx-btn nx-go" data-nx="live">${ic('play', 18)} Reprendre</button></div></section>`);
  }
  for (const kind of ['track', 'gym']) {
    if (L && nxKind(L) === kind && L.date === TODAY) continue;
    const p = planForK(TODAY, kind), done = kindDone(TODAY, kind), lg = logsOn(TODAY).find(l => l.kind === kind);
    if (done) out.push(nxDoneCard(order, kind, p, lg));
    else if (p) out.push(nxPlanCard(order, kind, p, sc, hi, tgt));
  }
  if (!out.length) {
    const n = nextSess();
    out.push(`<section class="nx-card nx-sess nxrest" style="--o:${order}"><div class="nx-sess-top"><span class="nx-kind">Ta séance</span></div><h2>${hi ? 'Aucune séance calée' : 'Repos aujourd\'hui'}</h2>
      <p class="nx-sub">${hi ? 'Ton planning a un créneau d\'entraînement aujourd\'hui, mais aucune séance n\'y est calée.' : 'Pas de séance prévue : c\'est pendant le repos que tu progresses.'}</p>
      ${n ? `<button class="nx-next" data-nx="plan" data-a="${esc(caleRef(n.p))}"><span>Prochaine séance · ${esc(n.k === addDays(TODAY, 1) ? 'demain' : fmtShort(n.k))}</span><b>${esc(n.p.name)}</b>${ic('right', 18)}</button>` : ''}
      ${hi ? `<div class="nx-row"><button class="nx-btn2" data-nx="cale" data-a="${TODAY}">${ic('cal', 18)} Caler une séance aujourd'hui</button></div>` : `<button class="nx-link" data-nx="cale" data-a="${TODAY}">Caler quand même une séance aujourd'hui ›</button>`}</section>`);
  }
  return out.join('');
}
function nxPlanCard(order, kind, p, sc, hi, tgt) {
  const b = dayPlan(TODAY).find(x => x.c === (kind === 'track' ? 'athle' : 'muscu')), ref = caleRef(p), skip = kindSkip(TODAY, kind), its = p.items.filter(it => it.ex !== 'warmup'), sm = nxSprintM(p);
  if (skip) return `<section class="nx-card nx-sess skip" style="--o:${order};--k:${NXC[kind]}"><div class="nx-sess-top"><span class="nx-kind">${nxKindName(kind)} · pas aujourd'hui</span></div><h2>${esc(p.name)}</h2><p class="nx-sub">Tu as choisi de ne pas la faire aujourd'hui.</p><div class="nx-row"><button class="nx-btn2" data-nx="skip" data-a="${kind}" data-b="0">La remettre</button></div></section>`;
  const sp = nxSpeed(), warn = kind === 'track' && sp.tips.find(t => /veille du sprint/.test(t[1]));
  const adapt = sc != null && hi && sc < 67 ? tgt.text : warn ? warn[1] : '';
  return `<section class="nx-card nx-sess" style="--o:${order};--k:${NXC[kind]}">
    <div class="nx-sess-top"><span class="nx-kind">${nxKindName(kind)}${b ? ' · ' + tfr(b.a) : ''}${b?.dest ? ' · ' + esc(b.dest) : ''}</span><span class="nx-sess-min">${ic('clock', 15)} ${estMin(p)} min</span></div>
    <h2>${esc(p.name)}</h2>${p.title || p.desc ? `<p class="nx-sub">${esc(p.title || p.desc)}</p>` : ''}
    <div class="nx-sess-f">${sm ? `<span><b>${fx(sm)}</b> m de sprint</span>` : ''}<span><b>${its.length}</b> exercices</span><span><b>${nxSets(p)}</b> ${kind === 'track' ? 'répétitions' : 'séries'}</span></div>
    <ol class="nx-exl">${its.slice(0, 5).map(it => `<li style="--c:${nxCat(it.ex)}"><b>${esc(exOf(it.ex).n)}</b><span>${esc(nxItemTxt(it))}</span></li>`).join('')}${its.length > 5 ? `<li class="nx-mli">+ ${its.length - 5} autre${its.length - 5 > 1 ? 's' : ''}</li>` : ''}</ol>
    ${adapt ? `<p class="nx-adapt">${esc(adapt)}</p>` : ''}
    <div class="nx-row"><button class="nx-btn nx-go" data-nx="start" data-a="${esc(p.id)}" data-b="${p.n || ''}">${ic('play', 18)} Commencer</button><button class="nx-btn2" data-nx="plan" data-a="${esc(ref)}">Détail</button></div>
    <button class="nx-link" data-nx="skip" data-a="${kind}" data-b="1">Pas aujourd'hui</button></section>`;
}
function nxDoneCard(order, kind, p, l) {
  const st = (v, s) => `<span><b>${v}</b>${s}</span>`, rpe = M(TODAY, kind === 'gym' ? 'gymRpe' : 'trackRpe');
  return `<section class="nx-card nx-sess done" style="--o:${order};--k:${NXC[kind]}"><div class="nx-sess-top"><span class="nx-kind">${nxKindName(kind)} · faite</span><span class="nx-done-ic">${ic('check', 18)}</span></div>
    <h2>${esc(l?.name || p?.name || 'Séance')}</h2>
    <div class="nx-sess-f">${l ? st(l.min + ' min', 'durée') + st(l.rpe + '/10', 'RPE') + (kind === 'track' ? st(fx(l.sprintM) + ' m', 'sprint') : st(fx((l.tonnage || 0) / 1000, 1) + ' t', 'soulevées')) : st('RPE ' + (rpe ?? '–'), 'noté au questionnaire')}</div>
    <p class="nx-sub">Bien joué. Elle compte déjà dans ta charge et dans tes besoins du jour.</p>
    ${l ? `<div class="nx-row"><button class="nx-btn2" data-nx="log" data-a="${esc(l.id)}">Revoir la séance</button></div>` : ''}</section>`;
}
function nxDayLine(k, all) {
  const now = nxNow(), L = dayPlan(k).filter(x => x.c !== 'quest' && !(x.c === 'sommeil' && x.a === '00:00'));
  let rows = L; if (!all && k === TODAY) { const i = L.findIndex(x => tmin(x.b) > now); rows = i < 0 ? [] : L.slice(i, i + 5); }
  return rows.map(x => {
    const a = tmin(x.a), b = tmin(x.b), on = k === TODAY && a <= now && b > now, past = k === TODAY && b <= now, col = PCAT[x.c]?.[1] || '#888';
    const kd = x.c === 'muscu' ? 'gym' : x.c === 'athle' ? 'track' : null, q = kd && planForK(k, kd), cat = PCAT[x.c]?.[0] || '';
    const when = k !== TODAY || past ? '' : on ? 'maintenant' : 'dans ' + nxSpan(a - now);
    const sub = [q ? cat : cat !== plName(x.n) ? cat : '', x.dest, x.trip].filter(Boolean).join(' · ');
    return `<div class="nx-tl${on ? ' now' : ''}${past ? ' past' : ''}" style="--c:${col}${on ? ';--p:' + Math.round((now - a) / Math.max(1, b - a) * 100) + '%' : ''}"><span class="t"><b>${tfr(x.a)}</b>${when ? `<small>${when}</small>` : ''}</span><i></i><span class="n"><b>${esc(q ? q.name : plName(x.n))}</b>${sub ? `<small>${esc(sub)}</small>` : ''}</span></div>`;
  }).join('');
}
function nxFuelCard(order) {
  const g = fuelGoal(TODAY), t = dayTotals(TODAY), w = waterOf(TODAY), d = fday(TODAY), wb = w.wb || {b1: 0, b2: 0, t: 0};
  const mini = (lab, v, goal, u, col, dec = 0) => { const p = goal ? Math.min(100, v / goal * 100) : 0; return `<div class="nx-mini"><div class="nx-mini-r">${nxRing(p, col, 58, 6, 'nx-arc sm')}<b>${goal ? Math.round(p) : '–'}<small>%</small></b></div><span>${lab}</span><small>${fx(v, dec)} / ${fx(goal, dec)} ${u}</small></div>`; };
  const meals = MEALS.map(([m]) => { const its = (d.items || []).filter(it => it.meal === m), kc = its.reduce((s, it) => s + (it.kcal || 0), 0);
    return `<div class="nx-meal"><button class="nx-meal-in" data-nx="meal" data-a="${m}"><span class="nx-meal-ic">${ic('fork', 16)}</span><span class="nx-meal-t"><b>${esc(mealLab(m))}</b><small>${its.length ? esc(its.map(it => it.n).slice(0, 3).join(', ')) + (its.length > 3 ? '…' : '') : 'rien noté'}</small></span><em>${its.length ? fx(kc) + ' kcal' : ''}</em></button><button class="nx-ib nx-plus" data-nx="food" data-a="${m}" aria-label="Ajouter à ${esc(mealLab(m))}">${ic('plus', 18)}</button></div>`; }).join('');
  return `<section class="nx-card nx-fuel" style="--o:${order}"><h3 class="nx-ct">Carburant<small>${d.fromPlan ? 'rempli d\'après ton plan · change ce qui diffère' : g.train ? 'jour d\'entraînement' : 'jour de repos'}</small></h3>
    <div class="nx-minis">${mini('Énergie', t.kcal, g.kcal, 'kcal', NXC.kcal)}${mini('Protéines', t.p, g.p, 'g', NXC.p)}${mini('Glucides', t.c, g.c, 'g', NXC.c)}${mini('Eau', w.L, g.waterL, 'L', NXC.water, 1)}</div>
    <div class="nx-meals">${meals}</div>
    <div class="nx-water"><button class="nx-btl${wnum(wb.b1) ? ' on' : ''}" data-nx="wb" data-a="b1">${ic('bottle', 22)}<span>Gourde 1<small>1 L</small></span></button><button class="nx-btl${wnum(wb.b2) ? ' on' : ''}" data-nx="wb" data-a="b2">${ic('bottle', 22)}<span>Gourde 2<small>1 L</small></span></button>
      <div class="nx-btl tr${wb.t ? ' on' : ''}">${ic('bottle', 22)}<span>Entraînement<small>${fx(wb.t || 0, 1)} × 0,8 L</small></span><span class="nx-step"><button data-nx="wt" data-a="-0.5" aria-label="Moins">−</button><button data-nx="wt" data-a="0.5" aria-label="Plus">+</button></span></div></div></section>`;
}

/* ---------- one coach: the engine's three coaches + sprint rules, sorted ---------- */
const NX_CAP = {}; let NX_CAPON = false;
const nxCoachBox0 = coachBox;
coachBox = (who, L) => { if (NX_CAPON) NX_CAP[who] = (L || []).filter(Boolean); return nxCoachBox0(who, L); };
function nxCoach(rec, tgt, kG) {
  for (const k in NX_CAP) delete NX_CAP[k];
  NX_CAPON = true;
  try { coachCard(); } catch (e) {} try { coachRecovery(rec, tgt, kG); } catch (e) {} try { coachNutrition(TODAY); } catch (e) {}
  NX_CAPON = false;
  const all = []; for (const [who, L] of Object.entries(NX_CAP)) for (const x of L) if (x && x[1]) all.push({who, z: x[0], t: x[1], h: x[2]});
  for (const s of nxSpeed().tips) all.unshift({who: 'T', z: s[0], t: s[1]});
  const rank = {bad: 0, mid: 1, warn: 1, good: 2, ok: 2}, seen = new Set();
  return all.filter(x => { const k = String(x.t).slice(0, 40); if (seen.has(k)) return false; seen.add(k); return true; }).sort((a, b) => (rank[a.z] ?? 2) - (rank[b.z] ?? 2));
}
// What a sprinter must not miss: days without top speed, heavy gym the day before the track, sudden jumps in sprint volume.
function nxSpeed() {
  const tr = k => !!(M(k, 'trackRpe') || logsOn(k).some(l => l.kind === 'track'));
  const gymHeavy = k => logsOn(k).some(l => l.kind === 'gym' && (l.rpe || 0) >= 7) || (M(k, 'gymRpe') || 0) >= 7;
  let last = null; for (let i = 0; i < 60; i++) { const k = addDays(TODAY, -i); if (tr(k)) { last = k; break; } }
  const since = last ? daysBetween(last, TODAY) : null;
  const m7 = sumN('sprint', 7), past = [1, 2, 3, 4].map(i => sumN('sprint', 7, addDays(TODAY, -7 * i))).filter(v => v > 0), m28 = past.length >= 2 ? mean(past) : 0;
  const nx = nextSess('track'), tips = [];
  if (since != null && since >= 7) tips.push(['mid', `${since} jours sans vitesse maximale. Au-delà de 7 à 10 jours, le système nerveux perd sa vivacité : même 3 sprints courts à 95 % suffisent à la garder.`]);
  if (nx) { const before = addDays(nx.k, -1); if (gymHeavy(before) || (planForK(before, 'gym') && !kindDone(before, 'gym'))) tips.push(['mid', `Muscu la veille du sprint du ${fmtShort(nx.k)} : laisse si possible 48 h entre une muscu lourde et la piste pour arriver frais.`]); }
  if (m28 > 0 && m7 > m28 * 1.4) tips.push(['bad', `${fx(m7)} m de sprint sur 7 jours, contre ${fx(m28)} m d'habitude (+${Math.round((m7 / m28 - 1) * 100)} %). Les ischios encaissent mal les hausses brusques de vitesse maximale.`]);
  return {since, last, m7, m28, nx, tips};
}

/* ================= PAGE 2 · SEMAINE ================= */
function nxWeek() {
  const mon = addDays(monday(TODAY), 7 * NX.wk), days = [...Array(7)].map((_, i) => addDays(mon, i));
  if (!days.includes(NX.day)) NX.day = days.includes(TODAY) ? TODAY : mon;
  const cell = (k, i) => {
    const ss = ['track', 'gym'].map(kd => ({kd, p: planForK(k, kd), dn: kindDone(k, kd)})).filter(x => x.p || x.dn);
    const r = k <= TODAY ? recovery(k)?.score : null;
    return `<div class="nx-wd${k === NX.day ? ' sel' : ''}${k === TODAY ? ' today' : ''}${k < TODAY ? ' past' : ''}" data-drop="${k}">
      <button class="nx-wd-h" data-nx="day" data-a="${k}"><span>${DOW[i]}</span><b>${+k.slice(8)}</b><i>${ss.map(x => `<em class="${x.dn ? 'dn' : ''}" style="--c:${NXC[x.kd]}"></em>`).join('')}</i>${r != null ? `<u style="--c:${NXC[zoneOf(r)]};--w:${r}%"></u>` : ''}</button>
      <div class="nx-wd-s">${ss.map(x => { const ref = x.p ? caleRef(x.p) : ''; return `<button class="nx-wchip${x.dn ? ' dn' : ''}" style="--c:${NXC[x.kd]}" data-nx="${x.p ? 'plan' : 'day'}" data-a="${esc(x.p ? ref : k)}"${x.p && !x.dn ? ` draggable="true" data-drag="${esc(ref)}" data-from="${k}"` : ''}><b>${esc(x.p?.name || (x.kd === 'track' ? 'Piste' : 'Muscu'))}</b><small>${x.dn ? 'faite' : x.p ? estMin(x.p) + ' min' : ''}</small></button>`; }).join('')}
        <button class="nx-wadd" data-nx="cale" data-a="${k}" aria-label="Caler une séance">${ic('plus', 16)}</button></div></div>`;
  };
  // The week in numbers
  const past = days.filter(k => k <= TODAY), planned = days.flatMap(k => ['track', 'gym'].map(kd => planForK(k, kd) ? {k, kd} : null)).filter(Boolean);
  const doneN = days.reduce((s, k) => s + ['track', 'gym'].filter(kd => kindDone(k, kd)).length, 0);
  const smPlan = days.reduce((s, k) => s + nxSprintM(planForK(k, 'track')), 0), smDone = days.reduce((s, k) => s + (VAL.sprint(k) || 0), 0);
  const effs = past.map(k => effortDay(k)).filter(v => v != null), recs = past.map(k => recovery(k)?.score).filter(v => v != null);
  const stat = (v, l, col) => `<div class="nx-ws"><b style="color:${col || 'inherit'}">${v}</b><span>${l}</span></div>`;
  const summary = `<h3 class="nx-ct">La semaine en chiffres</h3><div class="nx-wss">${stat(doneN + ' / ' + planned.length, 'séances faites')}${stat(fx(smDone) + ' m', 'sprint fait · ' + fx(smPlan) + ' prévus', NXC.track)}${stat(effs.length ? fx(mean(effs), 1) : '–', 'effort moyen / 21', NXC.load)}${stat(recs.length ? Math.round(mean(recs)) + ' %' : '–', 'forme moyenne', recs.length ? NXC[zoneOf(mean(recs))] : '')}</div>
    <div class="nx-acts"><button data-nx="bilan">${ic('flag', 18)}<span>Bilan de la semaine</span></button><button data-nx="eng" data-a="shop">${ic('list', 18)}<span>Liste de courses</span></button><button data-nx="eng" data-a="menu">${ic('fork', 18)}<span>Mon menu</span></button><button data-nx="eng" data-a="planning">${ic('clock', 18)}<span>Mes horaires</span></button></div>`;
  return `<div class="nx-pg nx-weekp"><div class="nx-h"><p class="nx-eye">${esc(cap(fmtShort(mon)))} – ${esc(fmtShort(addDays(mon, 6)))}</p><h1>Semaine ${seasonWeek(mon)}</h1>
    <div class="nx-wnav"><button class="nx-ib" data-nx="wk" data-a="-1" aria-label="Semaine d'avant">${ic('left', 20)}</button>${NX.wk ? '<button class="nx-chip" data-nx="wk" data-a="0">Cette semaine</button>' : ''}<button class="nx-ib" data-nx="wk" data-a="1" aria-label="Semaine d'après">${ic('right', 20)}</button></div></div>
    <div class="nx-cal">${days.map(cell).join('')}</div>
    <div class="nx-cols nx-wcols"><div class="nx-col c1"><section class="nx-card phone-only" style="--o:1"><h3 class="nx-ct">Les séances de la semaine<small>touche un jour pour le détail</small></h3><div class="nx-wl">${days.map((k, i) => { const ss = ['track', 'gym'].map(kd => ({kd, p: planForK(k, kd), dn: kindDone(k, kd)})).filter(x => x.p || x.dn);
      return `<button class="nx-wlr${k === NX.day ? ' sel' : ''}${k === TODAY ? ' today' : ''}${k < TODAY ? ' past' : ''}" data-nx="day" data-a="${k}"><span>${esc(fmtShort(k).split(' ')[0].replace('.', ''))}<b>${+k.slice(8)}</b></span><div>${ss.map(x => `<em class="${x.dn ? 'dn' : ''}" style="--c:${NXC[x.kd]}">${esc(x.p?.name || nxKindName(x.kd))}</em>`).join('') || `<i>${highDay(k) ? 'créneau libre' : 'repos'}</i>`}</div></button>`; }).join('')}</div></section>
      <section class="nx-card nx-dd" style="--o:2">${nxDayDetail(NX.day)}</section></div><div class="nx-col c2"><section class="nx-card" style="--o:3">${summary}</section></div></div>
    <p class="nx-hint pc-only">Glisse une séance d'un jour à l'autre pour la déplacer.</p></div>`;
}
function nxDayDetail(k) {
  const ses = ['track', 'gym'].map(kd => {
    const p = planForK(k, kd), dn = kindDone(k, kd), lg = logsOn(k).find(l => l.kind === kd); if (!p && !dn) return '';
    const ref = p ? caleRef(p) : null;
    return `<div class="nx-ses" style="--k:${NXC[kd]}"><button class="nx-ses-in" data-nx="${p ? 'plan' : 'log'}" data-a="${esc(p ? ref : lg?.id || '')}"><span class="nx-kind">${nxKindName(kd)}${dn ? ' · faite ✓' : ''}</span><b>${esc(lg?.name || p?.name || '')}</b><small>${lg ? lg.min + ' min · RPE ' + lg.rpe : p ? estMin(p) + ' min · ' + p.items.length + ' exercices' : ''}</small></button>
      ${p && !dn ? `<div class="nx-ses-a">${k === TODAY ? `<button class="nx-btn nx-go sm" data-nx="start" data-a="${esc(p.id)}" data-b="${p.n || ''}">${ic('play', 16)} Commencer</button>` : ''}<button class="nx-chip" data-nx="move" data-a="${esc(ref)}" data-b="${k}">Déplacer</button><button class="nx-chip" data-nx="unplace" data-a="${esc(ref)}" data-b="${k}">Retirer</button></div>` : ''}</div>`;
  }).join('');
  const rec = k <= TODAY ? recovery(k)?.score : null, eff = k <= TODAY ? effortDay(k) : null, sl = k <= TODAY ? VAL.sleepH(k) : null;
  const mp = k >= TODAY ? (() => { const L = menuFor(k) || []; if (!L.length) return ''; const t = L.reduce((a, x) => ({kcal: a.kcal + (x.kcal || 0), p: a.p + (x.p || 0)}), {kcal: 0, p: 0}); return `<div class="nx-dd-m">${ic('fork', 16)}<span>Menu prévu : <b>${fx(t.kcal)} kcal</b> · ${fx(t.p)} g de protéines</span></div>`; })() : (() => { const t = dayTotals(k); return t.kcal ? `<div class="nx-dd-m">${ic('fork', 16)}<span>Mangé : <b>${fx(t.kcal)} kcal</b> · ${fx(t.p)} g de protéines</span></div>` : ''; })();
  return `<h3 class="nx-ct">${esc(cap(fmtDay(k)))}${k === TODAY ? '<small>aujourd\'hui</small>' : ''}</h3>
    ${k <= TODAY && (rec != null || eff) ? `<div class="nx-dd-d">${rec != null ? `<span style="--c:${NXC[zoneOf(rec)]}"><b>${rec} %</b>forme</span>` : ''}${eff != null ? `<span style="--c:${NXC.load}"><b>${fx(eff, 1)}</b>effort</span>` : ''}${sl != null ? `<span style="--c:${NXC.sleep}"><b>${hmH(sl)}</b>sommeil</span>` : ''}</div>` : ''}
    ${ses || `<p class="nx-empty">${highDay(k) ? 'Créneau d\'entraînement, aucune séance calée.' : 'Pas de séance : jour léger.'}</p>`}
    ${k >= TODAY ? `<button class="nx-add sm" data-nx="cale" data-a="${k}">${ic('plus', 18)} Caler une séance</button>` : ''}
    ${mp}
    <h4 class="nx-h4">Planning</h4><div class="nx-tls sm">${nxDayLine(k, true) || '<p class="nx-empty">Rien de prévu.</p>'}</div>
    <button class="nx-link" data-nx="eng" data-a="planning">Modifier mes horaires ›</button>`;
}
async function nxPlace(ref, k, on) {
  const p = planOf(ref); if (!p) return;
  const dated = {...(S.tset.dated || {})};
  for (const x of [k, k + '|t']) if (dated[x] === ref) delete dated[x];
  if (on) { if (p.kind === 'track' && planOf(dated[k])?.kind === 'track') delete dated[k]; dated[dKey(k, p.kind)] = ref; }
  S.tset = {...S.tset, dated}; nxSoon(10);
  await dbSet('settings/training', {...S.tset, updatedAt: new Date().toISOString()});
}
function nxPickSess(k, moveRef) {
  nxOpen({id: 'pks', title: moveRef ? 'Déplacer la séance' : 'Caler · ' + cap(fmtShort(k)), render: () => {
    if (moveRef) {
      const p = planOf(moveRef);
      return `<p class="nx-sub">Choisis le nouveau jour de « ${esc(p?.name || '')} ».</p><div class="nx-days">${[...Array(21)].map((_, i) => { const d = addDays(TODAY, i), x = planForK(d, nxKind(p)); return `<button class="nx-dc${d === k ? ' on' : ''}" data-nx="moveto" data-a="${esc(moveRef)}" data-b="${k}" data-c="${d}"><span>${DOW[(dow(d) + 6) % 7]}</span><b>${+d.slice(8)}</b>${x && d !== k ? '<i></i>' : ''}</button>`; }).join('')}</div>`;
    }
    const row = (p, sub) => `<button class="nx-pkr" data-nx="pks" data-a="${esc(caleRef(p))}" data-b="${k}" style="--k:${NXC[nxKind(p)]}"><span class="nx-kind">${nxKindName(nxKind(p))}</span><b>${esc(p.name)}</b><small>${esc(sub || p.title || p.desc || '')} · ${estMin(p)} min</small></button>`;
    const todo = tdvTodo(4), mine = myPlans();
    return `${todo.length ? `<h4 class="nx-h4">Ton programme · dans l'ordre</h4>${todo.map(p => row(p, p.title)).join('')}` : ''}
      <h4 class="nx-h4">Mes séances</h4>${mine.map(p => row(p)).join('') || '<p class="nx-empty">Tu n\'as pas encore créé de séance.</p>'}
      <button class="nx-add" data-nx="new" data-a="${k}">${ic('plus', 18)} Créer une nouvelle séance pour ce jour</button>
      <h4 class="nx-h4">Modèles</h4>${BUILTIN.map(p => row(p)).join('')}`;
  }});
}

/* ================= PAGE 3 · SÉANCES (the coach's studio) ================= */
function nxLib() {
  const s = NX.lib, seg = (v, n) => `<button class="${s.seg === v ? 'on' : ''}" data-nx="libseg" data-a="${v}">${n}</button>`;
  let body = '';
  if (s.seg === 'mine') {
    const q = nxNorm(s.q), ok = p => (s.f === 'all' || nxKind(p) === s.f) && (!q || nxNorm(p.name + ' ' + (p.desc || '') + ' ' + (p.title || '')).includes(q));
    const todo = tdvTodo(6).filter(ok), mine = myPlans().filter(ok);
    body = `<div class="nx-libbar"><input class="nx-in nx-search" type="search" data-nxin="libq" placeholder="Rechercher une séance" value="${esc(s.q)}"><div class="nx-chips">${[['all', 'Tout'], ['track', 'Piste'], ['gym', 'Muscu']].map(([v, n]) => `<button class="nx-chip${s.f === v ? ' on' : ''}" data-nx="libf" data-a="${v}">${n}</button>`).join('')}</div></div>
      ${todo.length ? `<h3 class="nx-sec">Ton programme<small>les prochaines, dans l'ordre</small></h3><div class="nx-pcs nx-hscroll">${todo.map((p, i) => nxPlanTile(p, i)).join('')}</div>` : ''}
      <h3 class="nx-sec">Mes séances<small>${mine.length}</small></h3>
      <div class="nx-pcs">${mine.map((p, i) => nxPlanTile(p, i)).join('')}<button class="nx-pc new" data-nx="new">${ic('plus', 28)}<b>Créer une séance</b><small>piste ou muscu, en 1 minute</small></button></div>`;
  } else if (s.seg === 'models') {
    body = `<p class="nx-sub nx-pad">Des bases prêtes : ouvre-en une, puis « Utiliser comme base » pour la copier dans tes séances et l'adapter.</p><div class="nx-pcs">${BUILTIN.filter(p => s.f === 'all' || nxKind(p) === s.f).map((p, i) => nxPlanTile(p, i)).join('')}</div>`;
  } else {
    const L = logs().slice(0, 60); let last = '';
    body = `<div class="nx-hist">${L.map((l, i) => { const m = l.date.slice(0, 7), h = m !== last ? `<h3 class="nx-sec">${esc(cap(new Date(l.date + 'T12:00:00').toLocaleDateString('fr-FR', {month: 'long', year: 'numeric'})))}</h3>` : ''; last = m;
      return h + `<button class="nx-hr" data-nx="log" data-a="${esc(l.id)}" style="--k:${NXC[l.kind === 'track' ? 'track' : 'gym']}"><span class="d"><b>${+l.date.slice(8)}</b>${esc(DOW[(dow(l.date) + 6) % 7])}</span><span class="n"><b>${esc(l.name)}</b><small>${l.min} min · RPE ${l.rpe}${l.kind === 'track' ? ' · ' + fx(l.sprintM) + ' m' : l.tonnage ? ' · ' + fx(l.tonnage / 1000, 1) + ' t' : ''}</small></span>${ic('right', 18)}</button>`; }).join('') || '<p class="nx-empty">Aucune séance enregistrée.</p>'}</div>`;
  }
  return `<div class="nx-pg nx-libp"><div class="nx-h nx-h-row"><div><p class="nx-eye">Ton atelier de coach</p><h1>Séances</h1></div><button class="nx-btn nx-create" data-nx="new">${ic('plus', 20)} Créer</button></div>
    <div class="nx-seg">${seg('mine', 'Mes séances')}${seg('models', 'Modèles')}${seg('done', 'Historique')}</div>${body}</div>`;
}
function nxPlanTile(p, i) {
  const ref = caleRef(p), on = caledOn(ref), sm = nxSprintM(p), kd = nxKind(p);
  return `<button class="nx-pc" data-nx="plan" data-a="${esc(ref)}" style="--k:${NXC[kd]};--i:${i}"><span class="nx-kind">${nxKindName(kd)}</span><b>${esc(p.name)}</b><small>${esc(p.title || p.desc || '')}</small>
    <span class="nx-pc-f"><em>${estMin(p)} min</em><em>${p.items.length} exos</em>${sm ? `<em>${fx(sm)} m</em>` : ''}${on.length ? `<em class="cal">${ic('cal', 13)} ${esc(fmtShort(on[0]))}</em>` : ''}</span></button>`;
}
function nxPlanSheet(ref) { nxOpen({id: 'plan', title: 'Séance', auto: true, render: () => nxPlanBody(ref)}); }
function nxPlanBody(ref) {
  const p = planOf(ref); if (!p) return '<p class="nx-empty">Séance introuvable.</p>';
  const own = !!S.plans[p.id] && !p.n, kd = nxKind(p), on = caledOn(ref), sm = nxSprintM(p), lab = itemLabels(p.items);
  const wt = (() => { try { return warmText(p.warm); } catch (e) { return []; } })();
  return `<div class="nx-pd" style="--k:${NXC[kd]}"><span class="nx-kind">${nxKindName(kd)}${p.n ? ' · ton programme' : !own ? ' · modèle' : ''}</span><h2>${esc(p.name)}</h2>${p.title || p.desc ? `<p class="nx-sub">${esc(p.title || p.desc)}</p>` : ''}
    <div class="nx-sess-f"><span><b>${estMin(p)}</b> min</span><span><b>${p.items.length}</b> exercices</span>${sm ? `<span><b>${fx(sm)}</b> m de sprint</span>` : `<span><b>${nxSets(p)}</b> séries</span>`}</div></div>
    <div class="nx-row nx-pd-a" style="--k:${NXC[kd]}"><button class="nx-btn nx-go" data-nx="start" data-a="${esc(p.id)}" data-b="${p.n || ''}">${ic('play', 18)} Commencer maintenant</button></div>
    ${wt.length ? `<div class="nx-card in"><h4 class="nx-h4">Échauffement · ${warmMin(p.warm)} min</h4>${wt.map(t => `<p class="nx-sub">${esc(t)}</p>`).join('')}</div>` : ''}
    ${p.tech ? `<div class="nx-card in"><h4 class="nx-h4">Technique</h4><p class="nx-sub">${esc(p.tech)}</p></div>` : ''}
    <ol class="nx-pdl">${p.items.map((it, i) => { const e = exOf(it.ex); return `<li style="--c:${nxCat(it.ex)}"><span class="l">${lab[i] || '•'}</span><span class="t"><b>${esc(e.n)}</b><small>${esc(nxItemTxt(it))}</small>${e.c ? `<details><summary>Consignes</summary><p>${esc(e.c)}</p></details>` : ''}</span></li>`; }).join('')}</ol>
    <h4 class="nx-h4">Caler à un jour<small>touche un jour pour l'ajouter ou l'enlever</small></h4>
    <div class="nx-days">${[...Array(21)].map((_, i) => { const k = addDays(TODAY, i), x = planForK(k, kd), mine = on.includes(k); return `<button class="nx-dc${mine ? ' on' : ''}" data-nx="toggleday" data-a="${esc(ref)}" data-b="${k}"><span>${DOW[(dow(k) + 6) % 7]}</span><b>${+k.slice(8)}</b>${x && !mine ? '<i title="déjà une séance ce jour-là"></i>' : ''}</button>`; }).join('')}</div>
    <div class="nx-acts">${own ? `<button data-nx="edit" data-a="${esc(p.id)}">${ic('edit', 18)}<span>Modifier</span></button>` : `<button data-nx="copy" data-a="${esc(ref)}">${ic('edit', 18)}<span>Utiliser comme base</span></button>`}
      ${own ? `<button data-nx="copy" data-a="${esc(ref)}">${ic('copy', 18)}<span>Dupliquer</span></button><button data-nx="del" data-a="${esc(p.id)}" class="bad">${ic('trash', 18)}<span>Supprimer</span></button>` : ''}</div>`;
}

/* ---------- the session builder ---------- */
const NX_STEPS = {dist: [10, 15, 20, 25, 30, 40, 50, 60, 70, 80, 100, 120, 150, 200, 250, 300, 400], rest: [0, 15, 30, 45, 60, 75, 90, 120, 150, 180, 240, 300, 360, 420, 480, 600],
  pct: [0, 50, 60, 70, 75, 80, 85, 90, 95, 100]};
const NX_TPL_GYM = [{name: 'Pliométrie · réactivité', desc: 'Contacts courts, raideur, élasticité', kind: 'gym', items: [{ex: 'pogo', sets: 3, reps: 20, rest: 60}, {ex: 'hurdlehop', sets: 4, reps: 5, rest: 90}, {ex: 'bounds', sets: 4, reps: 6, rest: 120}, {ex: 'dropjump', sets: 3, reps: 5, rest: 120}, {ex: 'medball', sets: 3, reps: 5, rest: 90}]}];
function nxSmartItem(id, kind) {
  const it = defaultItem(id), e = exOf(id); delete it.tempo;
  const D = {'Vitesse max': {reps: 4, dist: 30, pct: 100, rest: 300}, 'Accélération': {reps: 5, dist: 20, pct: 95, rest: 150}, 'Endurance de vitesse': {reps: 3, dist: 120, pct: 95, rest: 480},
    'Résistance': {reps: 6, dist: 20, pct: 95, rest: 150}, 'Tempo': {reps: 8, dist: 100, pct: 70, rest: 45},
    'Pliométrie': {sets: 3, reps: 6, rest: 90}, 'Haltérophilie': {sets: 4, reps: 3, pct: 75, rest: 150}, 'Prévention': {sets: 3, reps: 8, rest: 60}, 'Tronc': {sets: 3, rest: 45}};
  if (e.t === 'track' && e.u !== 'g' && D[e.cat]) Object.assign(it, D[e.cat]);
  if (e.t === 'gym' && D[e.cat]) Object.assign(it, D[e.cat]);
  if (e.t === 'gym' && ['squat', 'fsquat', 'hbdl', 'deadlift', 'bench', 'halfsquat'].includes(id)) Object.assign(it, {sets: 4, reps: 5, pct: 80, rest: 180});
  return it;
}
function nxEdOpen(src, copy, day) {
  const p = src ? planOf(src) : null, own = !!(p && S.plans[p.id] && !p.n && !copy);
  NX.ed = {id: own ? p.id : uid(), base: own ? structuredClone(p) : null, own, kind: p ? nxKind(p) : NX.lib.f === 'gym' ? 'gym' : 'track',
    name: own ? (p.autoName ? '' : p.name || '') : p ? (p.name || '') + (copy && S.plans[p.id] ? ' (copie)' : '') : '', items: p ? structuredClone(p.items) : [],
    days: new Set(own ? caledOn(p.id) : day ? [day] : []), descAuto: own ? !!p.autoDesc : !p, desc: p ? p.desc || '' : '', dirty: false};
  if (p && !own) { NX.ed.base = {warm: p.warm, cool: p.cool, tech: p.tech}; for (const k of ['warm', 'cool', 'tech']) if (NX.ed.base[k] == null) delete NX.ed.base[k]; }
  nxOpen({id: 'ed', full: true, cls: 'nx-ed', title: own ? 'Modifier la séance' : 'Nouvelle séance', render: nxEdBody, foot: nxEdFoot,
    guard: () => !NX.ed?.dirty || confirm('Quitter sans enregistrer cette séance ?'), onClose: () => { NX.ed = null; }});
}
function nxEdBody() {
  const E = NX.ed; if (!E) return '';
  const pl = {kind: E.kind, items: E.items}, A = sessionAuto(pl), sm = nxSprintM(pl);
  return `<div class="nx-seg nx-segk">${['track', 'gym'].map(k => `<button class="${E.kind === k ? 'on' : ''}" style="--k:${NXC[k]}" data-nx="ed-kind" data-a="${k}">${k === 'track' ? 'Piste · vitesse' : 'Muscu · force'}</button>`).join('')}</div>
    <input class="nx-in nx-ed-name" data-nxin="ed-name" placeholder="${esc(A.name || 'Nom de la séance (automatique si vide)')}" value="${esc(E.name)}" aria-label="Nom de la séance">
    <div class="nx-edstats" style="--k:${NXC[E.kind]}"><span><b>${E.items.length ? estMin(pl) : 0}</b>min</span><span><b>${E.items.filter(it => it.ex !== 'warmup').length}</b>exercices</span>${E.kind === 'track' ? `<span><b>${fx(sm)}</b>m de sprint</span>` : `<span><b>${nxSets(pl)}</b>séries</span>`}</div>
    ${E.items.length ? `<div class="nx-eds" id="nx-eds">${E.items.map(nxEdItem).join('')}</div>` : nxEdTpl()}
    <button class="nx-add" data-nx="ed-add">${ic('plus', 20)} Ajouter un exercice</button>
    <h4 class="nx-h4">Caler la séance<small>touche un ou plusieurs jours</small></h4>
    <div class="nx-days">${[...Array(21)].map((_, i) => { const k = addDays(TODAY, i), x = planForK(k, E.kind), on = E.days.has(k); return `<button class="nx-dc${on ? ' on' : ''}" data-nx="ed-day" data-a="${k}"><span>${DOW[(dow(k) + 6) % 7]}</span><b>${+k.slice(8)}</b>${x && x.id !== E.id && !on ? '<i title="déjà une séance"></i>' : ''}</button>`; }).join('')}</div>
    <button class="nx-link" data-nx="ed-full">Éditeur complet : tempo, superséries, échauffement détaillé ›</button>`;
}
const nxEdFoot = () => NX.ed ? `<button class="nx-btn nx-go wide" data-nx="ed-save"${NX.ed.items.length ? '' : ' disabled'}>${ic('check', 18)} Enregistrer la séance</button>` : '';
function nxEdTpl() {
  const L = [...BUILTIN.filter(p => p.kind === NX.ed.kind), ...NX_TPL_GYM.filter(p => p.kind === NX.ed.kind)];
  return `<div class="nx-tpl"><p class="nx-sub">Pars d'un modèle et adapte-le, ou ajoute tes exercices un par un.</p><div class="nx-tplg">${L.map((p, i) => `<button data-nx="ed-tpl" data-a="${i}" style="--k:${NXC[NX.ed.kind]}"><b>${esc(p.name)}</b><small>${esc(p.desc || '')}</small></button>`).join('')}</div></div>`;
}
function nxEdItem(it, i) {
  const e = exOf(it.ex), u = unitOf(it);
  const st = (f, lab, v, show) => `<div class="nx-st"><span>${lab}</span><div><button data-nx="ed-st" data-a="${i}" data-b="${f}" data-c="-1" aria-label="${lab} moins">−</button><b>${show}</b><button data-nx="ed-st" data-a="${i}" data-b="${f}" data-c="1" aria-label="${lab} plus">+</button></div></div>`;
  let ctl = '';
  if (it.ex === 'warmup' || e.u === 'min') ctl = st('min', 'Durée', it.min, (it.min || 15) + ' min');
  else if (it.seq) ctl = `<p class="nx-sub">Séquence ${esc(nxItemTxt(it))} · à modifier dans l'éditeur complet.</p>`;
  else if (e.t === 'track' || e.t === 'test') ctl = st('reps', 'Répétitions', it.reps, it.reps || 1) + (e.t === 'test' ? '' : st('dist', 'Distance', it.dist, (it.dist || 0) + ' m') + (e.u === 'g' ? '' : st('pct', 'Intensité', it.pct, it.pct ? it.pct + ' %' : 'libre') + st('rest', 'Récup', it.rest, nxRest(it.rest))));
  else ctl = st('sets', 'Séries', it.sets, it.sets || 1) + st('reps', u === 's' ? 'Secondes' : 'Reps', it.reps, it.reps || 1) + st('pct', '% du max', it.pct, it.pct ? it.pct + ' %' : 'libre') + st('rest', 'Récup', it.rest, nxRest(it.rest));
  const adv = [it.tempo ? 'tempo ' + it.tempo.join('') : '', it.link ? 'supersérie' : '', it.ct ? (CT.find(c => c[0] === it.ct) || [, ''])[1] : ''].filter(Boolean).join(' · ');
  return `<div class="nx-edi" style="--c:${nxCat(it.ex)}" data-i="${i}"><div class="nx-edi-h"><span class="nx-grip" data-nxdrag="${i}" aria-label="Glisser pour déplacer">${ic('grip', 18)}</span><span class="nx-edi-n"><b>${esc(e.n)}</b><small>${esc(e.cat || '')}${adv ? ' · ' + esc(adv) : ''}</small></span>
    <button class="nx-ib" data-nx="ed-mv" data-a="${i}" data-b="-1" aria-label="Monter"${i ? '' : ' disabled'}>${ic('up', 18)}</button><button class="nx-ib" data-nx="ed-dup" data-a="${i}" aria-label="Dupliquer">${ic('copy', 18)}</button><button class="nx-ib" data-nx="ed-rm" data-a="${i}" aria-label="Retirer">${ic('x', 18)}</button></div><div class="nx-ctl">${ctl}</div></div>`;
}
function nxEdStep(i, f, d) {
  const it = NX.ed.items[i]; if (!it) return; const e = exOf(it.ex), u = unitOf(it);
  // Next or previous value of the list; a value typed elsewhere (between two steps) goes to the nearest step that way.
  const list = (L, v) => { v = v || 0; if (v > L.at(-1)) return d > 0 ? v : L.at(-1); let j = L.findIndex(x => x >= v); if (L[j] !== v && d > 0) j--; return L[clamp(j + d, 0, L.length - 1)]; };
  if (f === 'dist' || f === 'rest') it[f] = list(NX_STEPS[f], it[f]);
  else if (f === 'pct') { const v = list(NX_STEPS.pct, it.pct); if (v) it.pct = v; else delete it.pct; }
  else if (f === 'min') it.min = clamp((it.min || 15) + 5 * d, 5, 90);
  else if (f === 'sets') it.sets = clamp((it.sets || 1) + d, 1, 12);
  else if (f === 'reps') it.reps = clamp((it.reps || 1) + d * (u === 's' && e.t !== 'track' ? 5 : 1), 1, u === 's' ? 300 : 60);
  if (f === 'rest' && !it.rest) delete it.rest;
  NX.ed.dirty = true; nxHap(5); nxShDraw();
}
async function nxEdSave() {
  const E = NX.ed; if (!E || !E.items.length) { toast('Ajoute au moins un exercice'); return; }
  const A = sessionAuto({kind: E.kind, items: E.items}), name = (E.name || '').trim();
  const doc = {...(E.base || {}), id: E.id, kind: E.kind, name: name || A.name || 'Ma séance', desc: E.descAuto ? A.desc : E.desc || A.desc, items: E.items, autoName: !name, autoDesc: E.descAuto, updatedAt: new Date().toISOString()};
  for (const k of ['date', 'date0', 'wk', 'n', 'title', 'deleted']) delete doc[k];
  S.plans[doc.id] = doc;
  await dbSet('plans/' + doc.id, doc);
  const dated = {...(S.tset.dated || {})};
  for (const [k, v] of Object.entries(dated)) if (v === doc.id && k.slice(0, 10) >= TODAY) delete dated[k];
  for (const k of E.days) { if (k < TODAY) continue; if (doc.kind === 'track' && planOf(dated[k])?.kind === 'track') delete dated[k]; dated[dKey(k, doc.kind)] = doc.id; }
  S.tset = {...S.tset, dated}; await dbSet('settings/training', {...S.tset, updatedAt: new Date().toISOString()});
  E.dirty = false; nxClose(); toast(E.days.size ? `Séance enregistrée et calée ${E.days.size > 1 ? 'sur ' + E.days.size + ' jours' : 'le ' + fmtShort([...E.days][0])}` : 'Séance enregistrée dans tes séances');
  NX.lib.seg = 'mine'; nxSoon(10);
}
// Exercise picker: search, families, stays open to add several.
function nxPick() {
  NX.pk = {q: '', cat: '', n: 0};
  nxOpen({id: 'pick', title: 'Ajouter un exercice', cls: 'nx-pick', render: nxPickBody, foot: () => `<button class="nx-btn wide" data-nx="pk-done">${NX.pk?.n ? `Terminé · ${NX.pk.n} ajouté${NX.pk.n > 1 ? 's' : ''}` : 'Terminé'}</button>`});
}
function nxPickPool() { const k = NX.ed?.kind || 'track'; return EX.filter(e => k === 'track' ? e.t === 'track' || e.t === 'test' : e.t === 'gym'); }
function nxPickBody() {
  const pool = nxPickPool(), cats = [...new Set(pool.map(e => e.t === 'test' ? 'Tests' : e.cat).filter(Boolean))];
  return `<input class="nx-in nx-search" type="search" data-nxin="pk-q" placeholder="Rechercher : lancé, squat, nordic…" value="${esc(NX.pk.q)}" aria-label="Rechercher un exercice">
    <div class="nx-chips nx-cats">${['', ...cats].map(c => `<button class="nx-chip${NX.pk.cat === c ? ' on' : ''}" data-nx="pk-cat" data-a="${esc(c)}"${c ? ` style="--c:${NX_CATC[c] || '#8E8E93'}"` : ''}>${esc(c || 'Tout')}</button>`).join('')}</div>
    <div class="nx-exs" id="nx-exs">${nxPickRows()}</div>`;
}
function nxPickRows() {
  const q = nxNorm(NX.pk.q), c = NX.pk.cat, pool = nxPickPool();
  let L = pool.filter(e => (!c || (c === 'Tests' ? e.t === 'test' : e.cat === c)) && (!q || nxNorm(e.n + ' ' + (e.en || '') + ' ' + (e.m || '') + ' ' + (e.cat || '')).includes(q)));
  if (!q && !c) { const used = {}; for (const p of myPlans()) for (const it of p.items) used[it.ex] = (used[it.ex] || 0) + 1; for (const l of logs().slice(0, 40)) for (const it of l.items || []) used[it.ex] = (used[it.ex] || 0) + 2; L = L.slice().sort((a, b) => (used[b.id] || 0) - (used[a.id] || 0)); }
  const n = (NX.ed?.items || []).reduce((o, it) => (o[it.ex] = (o[it.ex] || 0) + 1, o), {});
  return L.slice(0, 120).map(e => `<button class="nx-ex${n[e.id] ? ' in' : ''}" data-nx="pk" data-a="${e.id}" style="--c:${NX_CATC[e.cat] || '#8E8E93'}"><span><b>${esc(e.n)}</b><small>${esc([e.t === 'test' ? 'Test' : e.cat, e.m].filter(Boolean).join(' · '))}</small></span><i>${n[e.id] ? '×' + n[e.id] : ic('plus', 18)}</i></button>`).join('') || '<p class="nx-empty">Aucun exercice ne correspond.</p>';
}
// Reorder by dragging the grip (finger or mouse).
document.addEventListener('pointerdown', e => {
  const g = e.target.closest('[data-nxdrag]'); if (!g || !NX.ed) return;
  e.preventDefault(); const el = g.closest('.nx-edi'), list = [...document.querySelectorAll('#nx-eds .nx-edi')], i = list.indexOf(el); if (i < 0) return;
  const R = list.map(x => x.getBoundingClientRect());
  NX.drag = {el, list, i, to: i, y0: e.clientY, R, h: R[i].height + 10, id: e.pointerId};
  el.classList.add('lift'); list.forEach(x => x !== el && (x.style.transition = 'transform .22s cubic-bezier(.2,.8,.2,1)')); try { g.setPointerCapture(e.pointerId); } catch (err) {} nxHap(10);
});
document.addEventListener('pointermove', e => {
  const d = NX.drag; if (!d || e.pointerId !== d.id) return;
  const dy = e.clientY - d.y0, c = d.R[d.i].top + d.R[d.i].height / 2 + dy; d.el.style.transform = `translateY(${dy}px) scale(1.02)`;
  let to = d.i; for (let j = 0; j < d.list.length; j++) { if (j === d.i) continue; const m = d.R[j].top + d.R[j].height / 2; if (j > d.i && c > m) to = j; if (j < d.i && c < m && to === d.i) to = j; }
  for (let j = 0; j < d.list.length; j++) if (j < d.i && c < d.R[j].top + d.R[j].height / 2) { to = Math.min(to, j); break; }
  d.to = to; d.list.forEach((x, j) => { if (j === d.i) return; x.style.transform = j > d.i && j <= to ? `translateY(${-d.h}px)` : j < d.i && j >= to ? `translateY(${d.h}px)` : ''; });
});
const nxDragEnd = e => { const d = NX.drag; if (!d || e.pointerId !== d.id) return; NX.drag = null; if (d.to !== d.i) { const [it] = NX.ed.items.splice(d.i, 1); NX.ed.items.splice(d.to, 0, it); NX.ed.dirty = true; nxHap(8); } nxShDraw(); if (NX.pend) nxSoon(); };
document.addEventListener('pointerup', nxDragEnd); document.addEventListener('pointercancel', nxDragEnd);

/* ================= PAGE 4 · PROGRÈS ================= */
function nxSeries(f, n) { const s = series(f, n); if (n <= 120) return s; const out = []; for (let i = 0; i < s.length; i += 7) { const w = s.slice(i, i + 7), v = w.map(p => p.v).filter(x => x != null); out.push({k: w[0].k, v: v.length ? mean(v) : null}); } return out; }
function nxLine(pts, o = {}) {
  const W = 320, H = o.h || 120, vals = pts.map(p => p.v).filter(v => v != null);
  if (vals.length < 2) return '<div class="nx-nodata">Pas encore assez de données sur cette période</div>';
  let lo = Math.min(...vals), hi = Math.max(...vals); if (o.band) { lo = Math.min(lo, o.band[0]); hi = Math.max(hi, o.band[1]); } for (const r of o.refs || []) { lo = Math.min(lo, r[0]); hi = Math.max(hi, r[0]); }
  if (o.lo != null) lo = Math.min(lo, o.lo); if (o.hi != null) hi = Math.max(hi, o.hi);
  const pad = (hi - lo) * .12 || 1; lo -= pad; hi += pad;
  const X = i => i / Math.max(1, pts.length - 1) * W, Y = v => H - 4 - (v - lo) / (hi - lo) * (H - 8);
  const segs = []; let cur = []; pts.forEach((p, i) => { if (p.v == null) { if (cur.length) segs.push(cur); cur = []; } else cur.push([X(i), Y(p.v)]); }); if (cur.length) segs.push(cur);
  const id = 'g' + Math.random().toString(36).slice(2, 7), col = o.c || '#fff';
  const lines = segs.map(s => s.length === 1 ? '' : smoothD(s)).filter(Boolean);
  const areas = segs.filter(s => s.length > 1).map(s => smoothD(s) + ` L${s.at(-1)[0].toFixed(1)} ${H} L${s[0][0].toFixed(1)} ${H} Z`);
  const lastI = pts.map(p => p.v).lastIndexOf(pts.filter(p => p.v != null).at(-1).v), lv = pts[lastI].v;
  return `<div class="nx-chart" style="--c:${col}"><svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${col}" stop-opacity=".32"/><stop offset="1" stop-color="${col}" stop-opacity="0"/></linearGradient></defs>
    ${o.band ? `<rect x="0" y="${Y(o.band[1]).toFixed(1)}" width="${W}" height="${Math.max(1, Y(o.band[0]) - Y(o.band[1])).toFixed(1)}" fill="${col}" opacity=".09"/>` : ''}
    ${(o.refs || []).map(r => `<line x1="0" x2="${W}" y1="${Y(r[0]).toFixed(1)}" y2="${Y(r[0]).toFixed(1)}" stroke="rgba(255,255,255,.22)" stroke-dasharray="3 4" vector-effect="non-scaling-stroke"/>`).join('')}
    ${areas.map(d => `<path class="nx-area" d="${d}" fill="url(#${id})"/>`).join('')}${lines.map(d => `<path class="nx-ln" d="${d}" pathLength="1" fill="none" stroke="${col}" stroke-width="2.4" stroke-linecap="round" vector-effect="non-scaling-stroke"/>`).join('')}</svg>
    <i class="nx-dot" style="left:${(X(lastI) / W * 100).toFixed(2)}%;top:${(Y(lv) / H * 100).toFixed(2)}%"></i>
    ${(o.refs || []).map(r => `<em class="nx-ref" style="top:${(Y(r[0]) / H * 100).toFixed(2)}%">${esc(r[1])}</em>`).join('')}</div>`;
}
function nxBars(vals, o = {}) {
  const mx = Math.max(o.max || 0, ...vals.map(x => x.v || 0)) || 1;
  return `<div class="nx-bars" style="--n:${vals.length};--c:${o.c || '#fff'}">${vals.map((x, i) => `<i class="${x.hl ? 'hl' : ''}${x.v == null ? ' na' : ''}" style="--h:${((x.v || 0) / mx * 100).toFixed(1)}%;--d:${Math.min(600, i * 14)}ms${x.c ? ';--bc:' + x.c : ''}"></i>`).join('')}${o.ref ? `<b class="nx-bref" style="bottom:${(o.ref / mx * 100).toFixed(1)}%"><span>${esc(o.refLab || '')}</span></b>` : ''}</div>`;
}
function nxProg() {
  const n = NX.pn, per = {30: '30 jours', 90: '3 mois', 365: '1 an'}[n];
  const kG = lastKey('hrv') || TODAY, delta = (s, inv) => { const v = s.map(p => p.v).filter(x => x != null); if (v.length < 4) return ''; const h = Math.floor(v.length / 2), a = mean(v.slice(0, h)), b = mean(v.slice(h)); if (!a) return ''; const p = (b / a - 1) * 100; if (Math.abs(p) < 1.5) return '<em class="nx-dl">stable</em>'; const good = inv ? p < 0 : p > 0; return `<em class="nx-dl ${good ? 'up' : 'down'}">${p > 0 ? '▲' : '▼'} ${fx(Math.abs(p))} %</em>`; };
  const card = (o, id, col, icn, lab, val, sub, chart, extra = '') => `<section class="nx-card nx-pc2" style="--o:${o};--c:${col}"><button class="nx-pc2-h" ${id ? `data-nx="metric" data-a="${id}"` : 'tabindex="-1"'}><span class="nx-pc2-l">${ic(icn, 16)}${lab}</span><span class="nx-pc2-v"><b>${val}</b>${sub}</span></button>${chart}${extra}</section>`;
  const rec = nxSeries('recovery', n), hrv = nxSeries('hrv', n), rhr = nxSeries('rhr', n), wt = nxSeries('weight', n);
  const hb = base('hrv', TODAY, 60), r0 = recovery(kG)?.score;
  const slp = series('sleepH', Math.min(n, 30)), need = sleepGoal();
  // Load: daily effort (or weekly sums over a year), and the 7 / 28 days ratio.
  const effD = n <= 90 ? series('effort', n).map(p => ({v: p.v, hl: p.k === TODAY})) : [...Array(52)].map((_, i) => { const end = addDays(TODAY, -7 * (51 - i)); return {v: series('effort', 7, end).reduce((s, p) => s + (p.v || 0), 0)}; });
  const e7 = avgN('effort', 7), e28 = avgN('effort', 28), acwr = e7 != null && e28 ? e7 / e28 : null;
  // Speed: sprint metres per week over 12 weeks, and best times.
  const mon = monday(TODAY), wk = [...Array(12)].map((_, i) => { const s = addDays(mon, -7 * (11 - i)), e = addDays(s, 6); let m = 0; for (let k = s; k <= e && k <= TODAY; k = addDays(k, 1)) m += VAL.sprint(k) || 0; return {v: m, hl: i === 11}; });
  const best = {}; for (const l of logs()) if (l.kind === 'track') for (const it of l.items || []) for (const r of it.reps || []) { const t = +r.t, d = +r.dist; if (!t || !d || t > d / 4) continue; const key = exOf(it.ex).n + '|' + d; if (!best[key] || t < best[key].t) best[key] = {t, d, n: exOf(it.ex).n, date: l.date}; }
  const recs = Object.values(best).sort((a, b) => a.d - b.d).slice(0, 8);
  const sp = nxSpeed();
  const fuelN = Math.min(n, 30), fuel = [...Array(fuelN)].map((_, i) => { const k = addDays(TODAY, i - fuelN + 1), t = dayTotals(k), g = fuelGoal(k); return {v: g.p ? t.p / g.p * 100 : null, hl: k === TODAY, c: t.p >= g.p * .9 ? NXC.good : t.p >= g.p * .7 ? NXC.warn : NXC.bad}; });
  const lastV = s => { const v = s.map(p => p.v).filter(x => x != null); return v.length ? v.at(-1) : null; };
  const sec = (t, s) => `<h3 class="nx-sec">${t}<small>${s || ''}</small></h3>`;
  return `<div class="nx-pg nx-progp"><div class="nx-h"><p class="nx-eye">Tes tendances · ${per}</p><h1>Progrès</h1>
    <div class="nx-seg nx-segp">${[[30, '30 j'], [90, '3 mois'], [365, '1 an']].map(([v, l]) => `<button class="${n === v ? 'on' : ''}" data-nx="pn" data-a="${v}">${l}</button>`).join('')}</div></div>
    ${sec('Ton corps', 'récupération')}
    <div class="nx-pgrid">
      ${card(1, 'recovery', NXC[zoneOf(r0)] || NXC.good, 'today', 'Forme', r0 != null ? r0 + ' %' : '–', delta(rec), nxLine(rec, {c: NXC[zoneOf(r0)] || NXC.good, lo: 0, hi: 100, refs: [[67, 'élevée'], [34, 'faible']]}))}
      ${card(2, 'hrv', NXC.hrv, 'wave', 'VFC nocturne', lastV(hrv) != null ? fx(lastV(hrv)) + ' ms' : '–', delta(hrv), nxLine(hrv, {c: NXC.hrv, band: hb ? [hb.m - hb.sd, hb.m + hb.sd] : null}), hb ? `<p class="nx-cap">Bande : ta zone normale (base ${fx(hb.m)} ms ± ${fx(hb.sd)})</p>` : '')}
      ${card(3, 'sleepH', NXC.sleep, 'moon', 'Sommeil', hmH(lastV(slp)), `<em class="nx-dl">moy. ${hmH(mean(slp.map(p => p.v).filter(v => v != null)))}</em>`, nxBars(slp.map(p => ({v: p.v, hl: p.k === TODAY, c: p.v == null ? '' : p.v >= need - .3 ? NXC.sleep : p.v >= need - 1 ? '#6E5FC2' : '#4A3F86'})), {c: NXC.sleep, ref: need, refLab: 'besoin ' + hmH(need), max: 10}), Math.min(n, 30) < n ? '<p class="nx-cap">Les 30 dernières nuits</p>' : '')}
      ${card(4, 'rhr', NXC.rhr, 'heart', 'FC au repos', lastV(rhr) != null ? fx(lastV(rhr)) + ' bpm' : '–', delta(rhr, true), nxLine(rhr, {c: NXC.rhr}))}
    </div>
    ${sec('Ton entraînement', 'charge et vitesse')}
    <div class="nx-pgrid">
      ${card(5, 'effort', NXC.load, 'bolt', 'Charge', acwr != null ? fx(acwr, 2) : '–', `<em class="nx-dl ${acwr == null ? '' : acwr > 1.3 ? 'down' : acwr < .8 ? 'mid' : 'up'}">${acwr == null ? '' : acwr > 1.3 ? 'trop haute' : acwr < .8 ? 'basse' : 'dans la zone'}</em>`, nxBars(effD, {c: NXC.load}), `<p class="nx-cap">Ratio 7 jours / 28 jours : zone idéale 0,8 à 1,3. ${n > 90 ? 'Effort total par semaine.' : 'Effort par jour, sur 21.'}</p>`)}
      ${card(6, 'sprint', NXC.track, 'flag', 'Vitesse', fx(sp.m7) + ' m', `<em class="nx-dl">7 derniers jours</em>`, nxBars(wk, {c: NXC.track}), `<p class="nx-cap">Mètres de sprint (90 % et plus) par semaine, 12 semaines.${sp.since != null ? ' Dernière vitesse max : ' + (sp.since === 0 ? 'aujourd\'hui' : sp.since === 1 ? 'hier' : 'il y a ' + sp.since + ' jours') + '.' : ''}</p>
        ${recs.length ? `<div class="nx-recs">${recs.map(r => `<div><span>${esc(r.n)} · ${r.d} m</span><b>${fx(r.t, 2)} s</b><small>${esc(fmtShort(r.date))}</small></div>`).join('')}</div>` : '<p class="nx-cap">Note tes temps pendant la séance : tes records apparaîtront ici.</p>'}`)}
    </div>
    ${sec('Ta composition', 'Withings')}
    <div class="nx-pgrid">
      ${card(7, 'weight', NXC.weight, 'drop', 'Poids', lastV(wt) != null ? fx(lastV(wt), 1) + ' kg' : '–', delta(wt), nxLine(wt, {c: NXC.weight}), W(lastKey('weight') || TODAY, 'fatPct') != null ? `<p class="nx-cap">Masse grasse ${fx(W(lastKey('weight') || TODAY, 'fatPct'), 1)} % · masse musculaire ${fx(W(lastKey('weight') || TODAY, 'muscleKg'), 1)} kg</p>` : '')}
      ${card(8, '', NXC.p, 'fork', 'Protéines', fuel.at(-1)?.v != null ? Math.round(fuel.at(-1).v) + ' %' : '–', '<em class="nx-dl">de ton objectif</em>', nxBars(fuel, {c: NXC.p, ref: 100, refLab: 'objectif', max: 130}), `<p class="nx-cap">Les ${fuelN} derniers jours.</p>`)}
    </div>
    <div class="nx-acts nx-more-acts"><button data-nx="eng" data-a="tests">${ic('bolt', 18)}<span>Faire un test</span></button><button data-nx="eng" data-a="jumps">${ic('up', 18)}<span>Mes sauts</span></button><button data-nx="eng" data-a="blood">${ic('drop', 18)}<span>Prises de sang</span></button><button data-nx="bilan">${ic('flag', 18)}<span>Bilan de la semaine</span></button></div></div>`;
}

/* ---------- the "why" of the score ---------- */
function nxWhy() {
  nxOpen({id: 'why', title: 'Ta forme', auto: true, render: () => {
    const kG = lastKey('hrv'); if (!kG) return '<p class="nx-sub">Il faut quelques nuits de mesures de ta montre pour calculer ta forme.</p>';
    const r = recovery(kG), bH = base('hrv', kG, 60), bR = base('rhr', kG, 60), hrv = G(kG, 'hrv'), h7 = avgN('hrv', 7, kG), rhr = G(kG, 'rhr');
    if (!r || !bH) return '<p class="nx-sub">Ta base de VFC se calcule encore : il faut au moins une semaine de nuits.</p>';
    const zH = .5 * zOf(hrv, bH) + .5 * zOf(h7, bH), zR = rhr != null && bR ? zOf(rhr, bR) : 0, sp = VAL.sleepPerf(kG) ?? 85;
    const parts = [['VFC', 45, sig(zH) * 100, NXC.hrv, `${hrv} ms cette nuit, ${fx(h7)} ms sur 7 jours. Ta base : ${fx(bH.m)} ms.`], ['Sommeil', 35, sp, NXC.sleep, `${hmH(VAL.sleepH(kG))} pour un besoin de ${hmH(sleepGoal())}.`], ['FC au repos', 20, sig(-zR) * 100, NXC.rhr, `${rhr ?? '–'} bpm. Ta base : ${bR ? fx(bR.m) : '–'} bpm.`]];
    const d14 = [...Array(14)].map((_, i) => { const k = addDays(kG, i - 13), s = recovery(k)?.score; return {v: s, hl: k === kG, c: s == null ? '' : NXC[zoneOf(s)]}; });
    return `<div class="nx-why-top"><div class="nx-ring">${nxRing(r.score, NXC[zoneOf(r.score)], 132, 12)}<div class="nx-ring-v"><b>${r.score}<small>%</small></b><span>${esc(ZONE[zoneOf(r.score)])}</span></div></div>
      <p class="nx-sub">Ton score mélange trois mesures de ta nuit, comparées à <b>tes propres</b> habitudes des 60 derniers jours, pas à une norme.</p></div>
      ${parts.map(([n, w, v, c, t]) => `<div class="nx-part" style="--c:${c}"><div><b>${n}</b><span>compte pour ${w} %</span><em>${Math.round(v)} / 100</em></div><div class="nx-bar"><i style="width:${clamp(v, 2, 100)}%"></i></div><small>${esc(t)}</small></div>`).join('')}
      ${r.ill ? '<p class="nx-adapt">Respiration ou température de nuit plus hautes que d\'habitude : −15 points. Possible début de maladie, écoute-toi.</p>' : ''}
      ${(maxPain(kG) ?? 0) >= 3 ? '<p class="nx-adapt">Douleur notée à 3 ou plus : ta forme est plafonnée à 33 % tant qu\'elle dure.</p>' : ''}
      <h4 class="nx-h4">Les 14 derniers jours</h4>${nxBars(d14, {c: NXC.good, max: 100})}
      <div class="nx-row" style="margin-top:14px"><button class="nx-btn2" data-nx="goprog">Voir toutes mes courbes</button></div>`;
  }});
}

/* ---------- meals ---------- */
function nxMeal(m) {
  nxOpen({id: 'meal', title: mealLab(m), auto: true, render: () => {
    const d = fday(TODAY), its = (d.items || []).map((it, i) => ({it, i})).filter(x => x.it.meal === m), t = its.reduce((a, {it}) => ({kcal: a.kcal + (it.kcal || 0), p: a.p + (it.p || 0), c: a.c + (it.c || 0)}), {kcal: 0, p: 0, c: 0});
    return `${d.fromPlan ? '<p class="nx-sub">Rempli d\'après ton plan alimentaire. Retire ou change ce que tu n\'as pas mangé.</p>' : ''}
      <div class="nx-mt"><span><b>${fx(t.kcal)}</b>kcal</span><span><b>${fx(t.p)} g</b>protéines</span><span><b>${fx(t.c)} g</b>glucides</span></div>
      <div class="nx-list">${its.map(({it, i}) => `<div class="nx-li"><button class="nx-li-in" data-nx="fedit" data-a="${i}"><b>${esc(it.n)}</b><small>${fx(it.g)} g · ${fx(it.kcal)} kcal · ${fx(it.p, 1)} g prot.</small></button><button class="nx-ib" data-nx="fdel" data-a="${i}" aria-label="Retirer">${ic('x', 18)}</button></div>`).join('') || '<p class="nx-empty">Rien pour ce repas.</p>'}</div>
      <div class="nx-row"><button class="nx-btn" data-nx="food" data-a="${m}">${ic('plus', 18)} Ajouter un aliment</button>${d.fromPlan ? '' : `<button class="nx-btn2" data-nx="mplan" data-a="${m}">Remettre le plan</button>`}</div>`;
  }});
}

/* ---------- coach IA (optional) ---------- */
const NX_Q = ['Comment adapter ma séance de demain ?', 'Pourquoi ma VFC baisse ?', 'Est-ce que je récupère assez ?', 'Mon alimentation suit-elle ma charge ?'];
function nxAsk(q) {
  let t = claudeContext(); if (t.length > 4600) t = t.slice(0, 4600);
  window.open('https://claude.ai/new?q=' + encodeURIComponent(t + (q || '')), '_blank');
}
function nxAiSheet() {
  nxOpen({id: 'ai', title: 'Coach IA', cls: 'nx-aish', auto: true, render: () => {
    const A = AN(), R = (S.reports || []).slice().sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')))[0];
    return `<div class="nx-ai-hero"><span class="nx-spk big">${ic('spark', 30)}</span><h2>Ton appli marche sans IA</h2><p class="nx-sub">La forme, les séances, les repas et les conseils du jour viennent de règles claires et de tes propres données. L'IA est un plus, quand tu veux aller plus loin : Claude lit tout ton historique et te répond comme un préparateur.</p></div>
      <label class="nx-switch"><span><b>Coach IA</b><small>${NX.ai ? 'Activé : les analyses de Claude apparaissent dans l\'appli' : 'Désactivé : aucune analyse IA n\'est affichée'}</small></span><input type="checkbox" data-nxin="ai"${NX.ai ? ' checked' : ''}><i></i></label>
      ${NX.ai ? `<div class="nx-card in"><h4 class="nx-h4">Analyse du jour</h4>${A?.homeText ? `<p>${esc(A.homeText)}</p>` : '<p class="nx-sub">Pas encore d\'analyse aujourd\'hui : Claude écrit la sienne à chaque synchronisation.</p>'}</div>
        ${R ? `<div class="nx-card in"><h4 class="nx-h4">Bilan de Claude · ${esc(R.date ? fmtShort(String(R.date).slice(0, 10)) : '')}</h4>${R.headline || R.title ? `<p><b>${esc(R.headline || R.title)}</b></p>` : ''}${R.summary ? `<p class="nx-sub">${esc(String(R.summary))}</p>` : ''}<button class="nx-link" data-nx="bilan">Lire le bilan complet ›</button></div>` : ''}
        <div class="nx-card in"><h4 class="nx-h4">Poser une question à Claude</h4><p class="nx-sub">Claude s'ouvre avec ton état du jour, tes 7 derniers jours, tes séances et ta charge déjà écrits. Tu n'as qu'à ajouter ta question.</p>
          <div class="nx-qs">${NX_Q.map(q => `<button data-nx="ask" data-a="${esc(q)}">${esc(q)}${ic('out', 15)}</button>`).join('')}</div><button class="nx-btn wide" data-nx="ask" data-a="">${ic('spark', 18)} Ouvrir Claude avec mes données</button></div>`
      : `<div class="nx-card in"><h4 class="nx-h4">Ce que l'IA ajoute si tu l'actives</h4><ul class="nx-ul"><li>Une analyse écrite de ta journée et de tes tendances</li><li>Le bilan de Claude chaque vendredi</li><li>Tes questions, avec toutes tes données déjà fournies</li></ul></div>`}`;
  }});
}
function nxSetSheet() {
  nxOpen({id: 'set', title: 'Réglages du labo', render: () => `
    <div class="nx-card in"><h4 class="nx-h4">Le labo</h4><p class="nx-sub">Une version test de ton appli : elle lit tes vraies données, mais tout ce que tu fais ici (séances créées, repas, check du matin, séances faites) reste sur cet appareil. Ton vrai compte et ta vraie appli ne changent jamais.</p>
      <p class="nx-sub"><b>${window.LAB_DB?.count?.() || 0}</b> changement${(window.LAB_DB?.count?.() || 0) > 1 ? 's' : ''} gardé${(window.LAB_DB?.count?.() || 0) > 1 ? 's' : ''} sur cet appareil.</p><button class="nx-btn2" data-nx="reset">Tout effacer et repartir de mes vraies données</button></div>
    <div class="nx-card in"><h4 class="nx-h4">Version complète</h4><p class="nx-sub">Toutes les pages de ton appli actuelle (T, N, R), pour retrouver un détail que le labo ne montre pas.</p><button class="nx-btn2" data-nx="classic">Ouvrir la version complète</button></div>
    <div class="nx-card in"><h4 class="nx-h4">Outils</h4><div class="nx-acts">${[['tests', 'bolt', 'Tests'], ['jumps', 'up', 'Sauts'], ['blood', 'drop', 'Prises de sang'], ['menu', 'fork', 'Mon menu'], ['shop', 'list', 'Courses'], ['planning', 'clock', 'Mes horaires'], ['trips', 'right', 'Mes trajets'], ['journal', 'edit', 'Journal de bord']].map(([a, i, n]) => `<button data-nx="eng" data-a="${a}">${ic(i, 18)}<span>${n}</span></button>`).join('')}</div></div>`});
}

/* ================= LIVE · focus mode, one exercise at a time ================= */
function nxLiveCount(L) { let n = 0, d = 0; for (const it of L.items || []) { if (it.test) { n++; if (it.done) d++; continue; } for (const x of it.sets || it.reps || []) { n++; if (x.done) d++; } } return {n, d}; }
const nxItDone = it => it.test ? !!it.done : (it.sets || it.reps || []).length > 0 && (it.sets || it.reps).every(x => x.done);
function nxStart(id, n) {
  if (S.live) { nxLiveOpen(); return; }
  const p = (n ? tdvNum(+n) : null) || planById(id); if (!p) { toast('Séance introuvable'); return; }
  const gym = S.tset?.gymPlan?.[p.id] || null; GYM_CTX = gym;
  S.live = {id: uid(), plan: p.id, name: p.name, kind: p.kind, date: TODAY, start: new Date().toISOString(), gym, items: p.items.map(liveItem), warm: p.warm || null, cool: p.cool || null};
  saveLive(); nxCloseAll();
  NX.lv.i = 0; setTimeout(nxLiveOpen, NX.skipPop ? 120 : 0); nxSoon(10);
}
function nxLiveOpen() {
  if (!S.live || NX.lv.open) return; NX.lv.open = true; NX.lvId = S.live.id;
  if (NX.lv.i == null || NX.lv.i >= S.live.items.length || nxItDone(S.live.items[NX.lv.i])) { const j = S.live.items.findIndex(it => !nxItDone(it)); NX.lv.i = j < 0 ? 0 : j; }
  const el = $('#nx-live'); el.hidden = false; nxLiveDraw(); requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('on')));
  try { history.pushState({mod: S.mod, nxl: 1}, ''); } catch (e) {}
  clearInterval(NX.lvT); NX.lvT = setInterval(nxLiveTick, 500);
}
function nxLiveHide(fromBack) {
  if (!NX.lv.open) return; NX.lv.open = false; const el = $('#nx-live'); el.classList.remove('on'); setTimeout(() => { if (!NX.lv.open) el.hidden = true; }, 420);
  clearInterval(NX.lvT); NX.rest = null;
  if (!fromBack && history.state?.nxl) { NX.skipPop = true; history.back(); }
  nxSoon(10);
}
// Saved: a small celebration. Abandoned (from the list view): just close.
function nxLiveDone() { const id = NX.lvId; nxLiveHide(); if (id && S.logs?.[id]) nxCele(); }
function nxLiveDraw() {
  const L = S.live, el = $('#nx-live'); if (!L || !el) return;
  const i = clamp(NX.lv.i, 0, L.items.length - 1), it = L.items[i], e = exOf(it.ex), arr = it.sets || it.reps || [], c = nxLiveCount(L), kc = NXC[nxKind(L)];
  const nxt = arr.findIndex(x => !x.done), min = Math.max(0, Math.floor((Date.now() - new Date(L.start)) / 60000)), lab = itemLabels(L.items);
  const row = (x, j) => it.sets
    ? `<div class="nx-set${x.done ? ' dn' : ''}${j === nxt ? ' nx1' : ''}"><span class="n">${j + 1}</span><label><input inputmode="decimal" data-nxlv="${i}.${j}.kg" value="${esc(x.kg ?? '')}" placeholder="–"><small>kg</small></label><label><input inputmode="numeric" data-nxlv="${i}.${j}.reps" value="${esc(x.reps ?? '')}" placeholder="–"><small>${it.u === 's' ? 's' : 'reps'}</small></label><button class="nx-tick" data-nx="lv-tick" data-a="${i}.${j}" aria-label="Valider la série ${j + 1}">${ic('check', 22)}</button></div>`
    : `<div class="nx-set${x.done ? ' dn' : ''}${j === nxt ? ' nx1' : ''}"><span class="n">${j + 1}</span><span class="d">${x.dist ? x.dist + ' m' : x.min ? x.min + ' min' : '–'}${x.blk ? `<small>bloc ${x.blk}</small>` : ''}</span><label><input inputmode="decimal" data-nxlv="${i}.${j}.t" value="${esc(x.t ?? '')}" placeholder="–"><small>s</small></label><button class="nx-tick" data-nx="lv-tick" data-a="${i}.${j}" aria-label="Valider la répétition ${j + 1}">${ic('check', 22)}</button></div>`;
  const last = i >= L.items.length - 1;
  const cta = it.test ? `<button class="nx-btn nx-go wide" data-nx="lv-list">Faire le test dans la vue liste</button>`
    : nxt >= 0 ? `<button class="nx-btn nx-go wide" data-nx="lv-tick" data-a="${i}.${nxt}">${ic('check', 20)} Valider ${it.sets ? 'la série' : 'la répétition'} ${nxt + 1}</button>`
    : last ? `<button class="nx-btn nx-go wide" data-nx="lv-end">${ic('flag', 18)} Terminer la séance</button>` : `<button class="nx-btn nx-go wide" data-nx="lv-go" data-a="${i + 1}">Exercice suivant ${ic('right', 18)}</button>`;
  const R = NX.rest, rl = R ? Math.max(0, Math.ceil((R.end - Date.now()) / 1000)) : 0;
  el.innerHTML = `<div class="nx-lv" style="--k:${kc}">
    <div class="nx-lv-hd"><button class="nx-ib" data-nx="lv-min" aria-label="Réduire">${ic('down', 24)}</button><div class="nx-lv-ttl"><b>${esc(L.name)}</b><small id="nx-lv-time">${min} min · ${c.d}/${c.n}</small></div><button class="nx-ib" data-nx="lv-list" aria-label="Vue liste">${ic('list', 22)}</button></div>
    <div class="nx-lv-prog"><i style="width:${c.n ? c.d / c.n * 100 : 0}%"></i></div>
    <div class="nx-lv-chips" id="nx-lv-chips">${L.items.map((x, j) => `<button class="${j === i ? 'on' : ''}${nxItDone(x) ? ' dn' : ''}" data-nx="lv-go" data-a="${j}" style="--c:${nxCat(x.ex)}">${lab[j] ? `<em>${lab[j]}</em>` : ''}${esc(exOf(x.ex).n)}</button>`).join('')}</div>
    <div class="nx-lv-card" data-i="${i}"><span class="nx-lv-cat" style="--c:${nxCat(it.ex)}">${esc(it.test ? 'Test' : e.cat || '')} · ${i + 1} / ${L.items.length}</span><h2>${esc(e.n)}</h2><p class="nx-lv-tg">${esc(nxItemTxt(it.tg || {}))}</p>
      ${it.adapted ? `<p class="nx-adapt">${esc(it.adapted)}</p>` : ''}${e.c ? `<details class="nx-cue"><summary>Consignes</summary><p>${esc(e.c)}</p></details>` : ''}
      ${it.test ? '<p class="nx-sub">Un test se fait avec ses outils (vidéo, chrono, sauts) : ouvre la vue liste.</p>' : `<div class="nx-sets">${arr.map(row).join('')}</div><button class="nx-link" data-nx="lv-addset" data-a="${i}">+ ${it.sets ? 'Une série' : 'Une répétition'} de plus</button>`}</div>
    <div class="nx-lv-ft">${cta}<div class="nx-lv-nav"><button class="nx-ib" data-nx="lv-go" data-a="${i - 1}"${i ? '' : ' disabled'} aria-label="Exercice précédent">${ic('left', 22)}</button><button class="nx-lv-end" data-nx="lv-end">Terminer</button><button class="nx-ib" data-nx="lv-go" data-a="${i + 1}"${last ? ' disabled' : ''} aria-label="Exercice suivant">${ic('right', 22)}</button></div></div>
    ${R ? `<div class="nx-rest${rl ? '' : ' end'}"><div class="nx-rest-r"><svg viewBox="0 0 200 200" aria-hidden="true"><circle cx="100" cy="100" r="88" fill="none" stroke="rgba(255,255,255,.1)" stroke-width="10"/><circle cx="100" cy="100" r="88" fill="none" stroke="${kc}" stroke-width="10" stroke-linecap="round" stroke-dasharray="553" style="animation-duration:${R.total}s;animation-delay:-${((Date.now() - R.t0) / 1000).toFixed(2)}s" class="nx-rest-arc" transform="rotate(-90 100 100)"/></svg><b id="nx-rest-t">${Math.floor(rl / 60)}:${String(rl % 60).padStart(2, '0')}</b><small>récupération</small></div>
      <p class="nx-rest-n">${R.next ? 'Ensuite : ' + esc(R.next) : 'Belle série.'}</p><div class="nx-row"><button class="nx-btn2" data-nx="rest-add">+ 30 s</button><button class="nx-btn" data-nx="rest-skip">Passer</button></div></div>` : ''}</div>`;
  const ch = $('#nx-lv-chips .on'); if (ch) ch.scrollIntoView({block: 'nearest', inline: 'center', behavior: NX.lvMoved ? 'smooth' : 'auto'}); NX.lvMoved = false;
}
function nxLiveTick() {
  if (!S.live) { if (NX.lv.open) nxLiveDone(); return; }
  const L = S.live, c = nxLiveCount(L), t = $('#nx-lv-time'); if (t) t.textContent = `${Math.max(0, Math.floor((Date.now() - new Date(L.start)) / 60000))} min · ${c.d}/${c.n}`;
  const R = NX.rest; if (!R) return;
  const rl = Math.max(0, Math.ceil((R.end - Date.now()) / 1000)), b = $('#nx-rest-t'); if (b) b.textContent = `${Math.floor(rl / 60)}:${String(rl % 60).padStart(2, '0')}`;
  if (rl <= 0 && !R.rang) { R.rang = true; try { navigator.vibrate?.([180, 90, 180]); } catch (e) {} $('.nx-rest')?.classList.add('end'); setTimeout(() => { if (NX.rest === R) { NX.rest = null; nxLiveDraw(); } }, 1600); }
}
function nxTick(i, j) {
  const L = S.live, it = L?.items[i], x = (it?.sets || it?.reps || [])[j]; if (!x) return;
  x.done = !x.done;
  if (x.done) {
    L.t0 ||= Date.now(); L.t1 = Date.now(); nxHap(14);
    const arr = it.sets || it.reps, rest = +(it.rest ?? it.tg?.rest ?? 0), more = arr.some(y => !y.done);
    const nI = more ? i : L.items.findIndex((y, k) => k > i && !nxItDone(y));
    if (rest > 0 && (more || nI >= 0)) NX.rest = {t0: Date.now(), end: Date.now() + rest * 1000, total: rest, next: more ? `${exOf(it.ex).n}, ${it.sets ? 'série' : 'répétition'} ${arr.findIndex(y => !y.done) + 1}` : exOf(L.items[nI].ex).n};
    if (!more && nI >= 0) { NX.lv.i = nI; NX.lvMoved = true; }
  }
  saveLive(); nxLiveDraw();
}
function nxCele() {
  const el = $('#nx-cele'); if (!el) return;
  el.innerHTML = `<div class="nx-cele-in"><div class="nx-cele-ring">${ic('check', 54)}</div><b>Séance enregistrée</b><small>Elle compte dans ta charge, ta forme et tes besoins du jour.</small></div>${[...Array(18)].map((_, i) => `<i style="--a:${i * 20}deg;--d:${(i % 3) * 60}ms"></i>`).join('')}`;
  el.hidden = false; requestAnimationFrame(() => el.classList.add('on')); nxHap(30);
  setTimeout(() => { el.classList.remove('on'); setTimeout(() => { el.hidden = true; }, 500); }, 2200);
}

/* ================= events ================= */
const NXA = {
  tab: b => nxTab(b.dataset.a),
  'sh-x': () => nxClose(),
  why: () => nxWhy(), goprog: () => { nxCloseAll(); setTimeout(() => nxTab('prog'), 80); },
  ai: () => nxAiSheet(), set: () => nxSetSheet(),
  open: b => { const k = b.dataset.a; NX.open[k] = !NX.open[k]; nxDraw(false); },
  note: () => openSheet('note', TODAY),
  well: b => { nxHap(6); nxManual(d => { d.well = {...(d.well || {}), [b.dataset.a]: +b.dataset.b}; }); },
  pain: b => { const l = b.dataset.a, L = [0, 2, 4, 6, 8]; nxHap(6); nxManual(d => { const p = {...pains(TODAY)}, v = p[l] || 0, nv = L[(L.indexOf(L.find(x => x >= v) ?? 0) + 1) % L.length]; if (nv) p[l] = nv; else delete p[l]; d.pains = p; delete d.pain; }); },
  start: b => nxStart(b.dataset.a, b.dataset.b), live: () => nxLiveOpen(),
  plan: b => nxPlanSheet(b.dataset.a), log: b => b.dataset.a && logView(b.dataset.a),
  skip: (b) => setSkip(TODAY, b.dataset.a, b.dataset.b === '1'),
  cale: b => nxPickSess(b.dataset.a),
  pks: async b => { await nxPlace(b.dataset.a, b.dataset.b, true); nxClose(); toast('Séance calée ' + (b.dataset.b === TODAY ? 'aujourd\'hui' : 'le ' + fmtShort(b.dataset.b))); },
  move: b => nxPickSess(b.dataset.b, b.dataset.a),
  moveto: async b => { const [ref, from, to] = [b.dataset.a, b.dataset.b, b.dataset.c]; if (from !== to) { await nxPlace(ref, from, false); await nxPlace(ref, to, true); toast('Déplacée au ' + fmtShort(to)); } nxClose(); },
  unplace: async b => { await nxPlace(b.dataset.a, b.dataset.b, false); toast('Retirée de ce jour · elle reste dans tes séances'); },
  toggleday: async b => { const ref = b.dataset.a, k = b.dataset.b, on = caledOn(ref).includes(k); nxHap(6); await nxPlace(ref, k, !on); },
  goday: b => { NX.day = b.dataset.a; NX.wk = 0; nxTab('week'); },
  day: b => { NX.day = b.dataset.a; nxHap(5); nxDraw(false); if (b.classList.contains('nx-wlr')) setTimeout(() => $('.nx-dd')?.scrollIntoView({behavior: 'smooth', block: 'start'}), 30); },
  wk: b => { const d = +b.dataset.a; NX.wk = d ? NX.wk + d : 0; NX.day = null; NX.dir = d < 0 ? -1 : 1; nxDraw(true); },
  bilan: () => bilanPane(),
  eng: b => ({shop: () => shopPane(), menu: () => menuPane(), planning: () => planningPane(), tests: () => testsPane(), jumps: () => jumpsPane(), blood: () => bloodPane(), trips: () => tripsPane(), journal: () => journalLog()}[b.dataset.a] || (() => {}))(),
  metric: b => openSheet('detail', b.dataset.a),
  pn: b => { NX.pn = +b.dataset.a; try { localStorage.setItem('nx.pn', NX.pn); } catch (e) {} nxDraw(true); },
  libseg: b => { NX.lib.seg = b.dataset.a; nxDraw(false); }, libf: b => { NX.lib.f = b.dataset.a; nxDraw(false); },
  new: b => { if (NX.classic) { nxClassic(false); return; } nxEdOpen(null, false, b.dataset.a || null); },
  edit: b => nxEdOpen(b.dataset.a), copy: b => nxEdOpen(b.dataset.a, true),
  del: async b => { const p = S.plans[b.dataset.a]; if (!p || !confirm(`Supprimer « ${p.name} » ?`)) return; const doc = {...p, deleted: true, updatedAt: new Date().toISOString()}; S.plans[p.id] = doc; await dbSet('plans/' + p.id, doc);
    const dated = Object.fromEntries(Object.entries(S.tset.dated || {}).filter(([k, v]) => !(v === p.id && k.slice(0, 10) >= TODAY))); S.tset = {...S.tset, dated}; await dbSet('settings/training', {...S.tset, updatedAt: new Date().toISOString()}); nxClose(); toast('Séance supprimée'); },
  'ed-kind': b => { const E = NX.ed; if (E.kind === b.dataset.a) return; if (E.items.some(it => it.ex !== 'warmup') && !confirm('Changer de type vide la liste d\'exercices. Continuer ?')) return; E.kind = b.dataset.a; E.items = E.items.filter(it => it.ex === 'warmup'); E.dirty = true; nxShDraw(); },
  'ed-tpl': b => { const L = [...BUILTIN.filter(p => p.kind === NX.ed.kind), ...NX_TPL_GYM.filter(p => p.kind === NX.ed.kind)], p = L[+b.dataset.a]; if (!p) return; NX.ed.items = structuredClone(p.items); if (!NX.ed.name) NX.ed.name = ''; NX.ed.dirty = true; nxHap(10); nxShDraw(); },
  'ed-add': () => nxPick(),
  'ed-st': b => nxEdStep(+b.dataset.a, b.dataset.b, +b.dataset.c),
  'ed-mv': b => { const i = +b.dataset.a, j = i + +b.dataset.b, L = NX.ed.items; if (j < 0 || j >= L.length) return; [L[i], L[j]] = [L[j], L[i]]; NX.ed.dirty = true; nxShDraw(); },
  'ed-dup': b => { const i = +b.dataset.a; NX.ed.items.splice(i + 1, 0, structuredClone(NX.ed.items[i])); NX.ed.dirty = true; nxShDraw(); },
  'ed-rm': b => { NX.ed.items.splice(+b.dataset.a, 1); NX.ed.dirty = true; nxShDraw(); },
  'ed-day': b => { const k = b.dataset.a, D = NX.ed.days; if (D.has(k)) D.delete(k); else D.add(k); NX.ed.dirty = true; nxHap(5); nxShDraw(); },
  'ed-save': () => nxEdSave(),
  'ed-full': () => { const E = NX.ed; if (!E) return; if (!E.items.length) { toast('Ajoute d\'abord un exercice'); return; }
    // The full editor works on a saved session: keep this one first (unplaced days stay as chosen), then open it there.
    nxEdSave().then(() => setTimeout(() => editPlan(E.id), 450)); },
  'pk-cat': b => { NX.pk.cat = b.dataset.a; nxShDraw(); },
  pk: b => { const id = b.dataset.a; NX.ed.items.push(nxSmartItem(id, NX.ed.kind)); NX.ed.dirty = true; NX.pk.n++; nxHap(10); b.classList.add('flash'); setTimeout(() => { const x = $('#nx-exs'); if (x) x.innerHTML = nxPickRows(); nxShDraw(); }, 260); const ed = NX.sh.find(s => s.id === 'ed'); if (ed) nxShDraw(ed); },
  'pk-done': () => nxClose(),
  meal: b => nxMeal(b.dataset.a),
  food: b => { S.fday = TODAY; addFood(b.dataset.a); },
  fedit: b => { S.fday = TODAY; const i = +b.dataset.a, it = fday(TODAY).items[i]; if (!it) return; qtyPane({n: it.n, kcal: it.kcal / it.g * 100, p: it.p / it.g * 100, c: it.c / it.g * 100, f: it.f / it.g * 100, g: it.g, id: it.food}, it.meal, i); },
  fdel: b => { const d = structuredClone(fday(TODAY)); d.items.splice(+b.dataset.a, 1); saveDay(TODAY, d); nxHap(8); },
  mplan: b => { const m = b.dataset.a, d = structuredClone(fday(TODAY)); d.items = (d.items || []).filter(it => it.meal !== m).concat(structuredClone((menuFor(TODAY) || []).filter(it => it.meal === m))); saveDay(TODAY, d); toast('Repas du plan remis'); },
  wb: b => { const w = waterOf(TODAY).wb || {}; setWater(TODAY, {[b.dataset.a]: wnum(w[b.dataset.a]) ? 0 : 1}); nxHap(8); },
  wt: b => { const w = waterOf(TODAY).wb || {}; setWater(TODAY, {t: clamp((w.t || 0) + +b.dataset.a, 0, 4)}); nxHap(6); },
  ask: b => nxAsk(b.dataset.a || ''),
  reset: () => { if (!confirm('Effacer tout ce que tu as fait dans le labo et repartir de tes vraies données ?')) return; window.LAB_DB?.reset(); LAB_RAW.wipe(); location.reload(); },
  classic: () => { nxCloseAll(); setTimeout(() => nxClassic(true), 120); },
  'lv-min': () => nxLiveHide(), 'lv-list': () => openLive(),
  'lv-go': b => { const j = +b.dataset.a; if (!S.live || j < 0 || j >= S.live.items.length) return; NX.lv.i = j; NX.lvMoved = true; nxHap(5); nxLiveDraw(); const c = $('.nx-lv-card'); c?.classList.add('swap'); },
  'lv-tick': b => { const [i, j] = b.dataset.a.split('.').map(Number); nxTick(i, j); },
  'lv-addset': b => { const it = S.live.items[+b.dataset.a], arr = it?.sets || it?.reps; if (!arr) return; const l = arr.at(-1) || {}; arr.push({...l, done: false, t: ''}); saveLive(); nxLiveDraw(); },
  'lv-end': () => finishPane(),
  'rest-add': () => { const R = NX.rest; if (!R) return; R.end += 30e3; R.total += 30; R.rang = false; nxLiveDraw(); },
  'rest-skip': () => { NX.rest = null; nxLiveDraw(); }
};
document.addEventListener('click', e => {
  const b = e.target.closest('[data-nx]'); if (!b || b.disabled) return;
  const f = NXA[b.dataset.nx]; if (!f) return;
  e.preventDefault(); try { f(b, e); } catch (err) { console.error(err); toast('Oups : ' + (err?.message || err)); }
});
document.addEventListener('input', e => {
  const t = e.target, d = t.dataset;
  if (d.nxin === 'libq') { NX.lib.q = t.value; clearTimeout(NX.qt); NX.qt = setTimeout(() => { const pos = t.selectionStart; nxDraw(false, true); const n = $('[data-nxin="libq"]'); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (err) {} } }, 220); }
  else if (d.nxin === 'pk-q') { NX.pk.q = t.value; const x = $('#nx-exs'); if (x) x.innerHTML = nxPickRows(); }
  else if (d.nxin === 'ed-name') { NX.ed.name = t.value; NX.ed.dirty = true; }
  else if (d.nxlv) {
    const [i, j, f] = d.nxlv.split('.'), arr = S.live?.items[i]?.sets || S.live?.items[i]?.reps; if (!arr?.[j]) return;
    const old = arr[j][f], v = t.value.replace(',', '.'); arr[j][f] = v;
    if (f === 'kg') for (let n = +j + 1; n < arr.length; n++) if (!arr[n].done && (arr[n].kg === '' || arr[n].kg == null || arr[n].kg === old)) { arr[n].kg = v; const el = document.querySelector(`[data-nxlv="${i}.${n}.kg"]`); if (el) el.value = v; }
    saveLive();
  }
});
document.addEventListener('change', e => {
  const t = e.target;
  if (t.dataset.nxin === 'ai') { NX.ai = t.checked; try { localStorage.setItem('nx.ai', NX.ai ? '1' : '0'); } catch (err) {} toast(NX.ai ? 'Coach IA activé dans le labo' : 'Coach IA désactivé : l\'appli marche sans IA'); nxDraw(false); }
});
document.addEventListener('focusin', e => { if (e.target.closest?.('#nx-live')) NX.lvInput = true; });
document.addEventListener('focusout', e => { if (e.target.closest?.('#nx-live')) { NX.lvInput = false; } if (NX.pend) nxSoon(200); });
// PC: drag a session from one day to another.
document.addEventListener('dragstart', e => { const c = e.target.closest?.('[data-drag]'); if (!c) return; e.dataTransfer.setData('text/plain', c.dataset.drag + '|' + c.dataset.from); e.dataTransfer.effectAllowed = 'move'; c.classList.add('ghost'); });
document.addEventListener('dragend', e => { e.target.closest?.('[data-drag]')?.classList.remove('ghost'); document.querySelectorAll('.nx-wd.over').forEach(x => x.classList.remove('over')); });
document.addEventListener('dragover', e => { const c = e.target.closest?.('[data-drop]'); if (!c) return; e.preventDefault(); document.querySelectorAll('.nx-wd.over').forEach(x => x !== c && x.classList.remove('over')); c.classList.add('over'); });
document.addEventListener('drop', async e => { const c = e.target.closest?.('[data-drop]'); if (!c) return; e.preventDefault(); c.classList.remove('over'); const [ref, from] = (e.dataTransfer.getData('text/plain') || '').split('|'), to = c.dataset.drop; if (!ref || !from || from === to) return; await nxPlace(ref, from, false); await nxPlace(ref, to, true); toast('Déplacée au ' + fmtShort(to)); });

/* ================= classic mode, and hooks into the engine ================= */
const nxRender0 = render, nxRenderMod0 = renderMod, nxGo0 = go;
render = function () { if (NX.classic) return nxRender0.apply(this, arguments); if (S.sheet?.kind === 'detail' && !scrubBox) { const y = $('#sheet-scroll').scrollTop; $('#sheet-body').innerHTML = detailBody(S.sheet.arg); initCharts($('#sheet-body')); $('#sheet-scroll').scrollTop = y; } nxSoon(); };
renderMod = function () { if (NX.classic) return nxRenderMod0.apply(this, arguments); if (P.stack.length && P.live) paneRender(); nxSoon(); };
// An engine button that leads to one of the old parts opens the full version there.
go = function (m, push) { if (!NX.classic && m !== 'home') nxClassic(true, true); return nxGo0.apply(this, arguments); };
// The phone's top bar stays black on the labo; the old colours come back in the full version.
const nxSync0 = syncBars;
syncBars = function () { if (NX.classic) return nxSync0.apply(this, arguments); document.querySelectorAll('meta[name="theme-color"]').forEach(m => m.setAttribute('content', '#000000')); };
// The labo is dark, windows of the engine included.
PREFS.theme = 'dark'; try { applyPrefs(); } catch (e) {}
function nxClassic(on, quiet) {
  NX.classic = on; document.documentElement.classList.toggle('nx-on', !on);
  $('#nx').hidden = on; $('#nx-new').hidden = !on;
  if (on) { if (NX.lv.open) nxLiveHide(); if (!quiet) { nxGo0('home', false); } nxRender0(); nxRenderMod0(true); pcSync(); toast('Version complète · le bouton en haut te ramène au labo'); }
  else { closeAllPanes(); if (S.sheet) closeSheet(); nxGo0('home', false); pcSync(); nxDraw(true); }
}
// The day moves: the timeline and the "in 1 h 20" refresh every minute.
setInterval(() => { if (!document.hidden && !NX.classic && (NX.tab === 'today' || NX.tab === 'week')) nxSoon(); }, 60e3);
document.addEventListener('visibilitychange', () => { if (!document.hidden) nxSoon(); });

// Start: the shell is drawn at once; the arrival animation waits for the splash screen to go.
nxMount();
nxChrome();
(function nxWaitSplash(n = 0) {
  if (window.TNR_SPLASH_ON && n < 200) { setTimeout(() => nxWaitSplash(n + 1), 100); return; }
  setTimeout(() => { NX.ready = true; nxDraw(true); if (S.live && S.live.date === TODAY) toast('Séance en cours : touche « Reprendre »'); }, n ? 60 : 350);
})();
