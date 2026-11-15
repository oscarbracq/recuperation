/* ================= TNR LABO : l'appli principale, une seule entrée =================
   Les pages sont exactement celles de l'appli principale. Ce qui change :
   · plus d'accueil ni de lettres : on arrive directement dans un module ;
   · une barre flottante en verre avec les 6 onglets (leurs noms suivent le module), et le pouce glisse d'un onglet à l'autre ;
   · en haut : « + » (questionnaire du jour) · T · N · R (même onglet, autre module) · « IA » (ouvre l'appli Claude, projet TNR) ;
   · les chiffres, courbes, blocs et anneaux s'animent quand une page arrive ou quand on change de période. */
const ONE = {mods: ['T', 'N', 'R'], keys: {T: ['today', 'progress', 'sessions', 'library', 'body', 'profile'], N: ['journal', 'progress', 'menu', 'foods', 'nbody', 'goals'], R: ['today', 'trends', 'rsess', 'rlib', 'reports', 'profile']},
  name: {T: 'Training', N: 'Nutrition', R: 'Recovery'}, col: Object.fromEntries(HOME_K), ready: false, act: 0, seen: new WeakSet()};
const oneCur = () => S.mod === 'R' ? S.tab : S.mod === 'T' ? S.ttab : S.mod === 'N' ? S.ftab : null;
const oneIdx = () => Math.max(0, (ONE.keys[S.mod] || []).indexOf(oneCur()));
const oneView = () => S.mod === 'R' ? $('#v-' + S.tab) : S.mod === 'T' ? $('#t-view') : S.mod === 'N' ? $('#f-view') : null;
const oneHap = (ms = 6) => { try { if (PREFS.haptic !== false) navigator.vibrate?.(ms); } catch (e) {} };
const oneCalm = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
// L'accueil n'existe plus : tout ce qui y menait ramène au module en cours.
const oneGo0 = go;
go = function (mod, push = true) { if (mod === 'home') { mod = ONE.mods.includes(S.mod) ? S.mod : oneSaved().m; push = false; } oneGo0(mod, push); oneSync(); };
// À l'ouverture : toujours Recovery · Aujourd'hui (la récupération d'abord).
const oneSaved = () => ({m: 'R', i: 0});
// Change de module en gardant la même position d'onglet. La page apparaît sur place (pas de glissement : ça, c'est pour les onglets).
function oneSwitch(m, i = oneIdx()) {
  if (!ONE.mods.includes(m)) return;
  if (S.sheet) closeSheet(); while (P.stack.length) closePane();
  const k = ONE.keys[m][i] || ONE.keys[m][0];
  if (m === 'R') S.tab = k; else if (m === 'T') S.ttab = k; else { S.ftab = k; if (k === 'journal') S.fday = TODAY; }
  saveUi(); ONE.act = performance.now();
  oneGo0(m, false); try { history.replaceState({...(history.state || {}), mod: m}, ''); if (i > 0 && !history.state?.one) history.pushState({mod: m, one: 1}, ''); } catch (e) {}
  oneSync(); oneHap(8);
  const v = oneView(); if (v && !oneCalm()) v.animate([{opacity: 0, filter: 'blur(8px)'}, {opacity: 1, filter: 'blur(0)'}], {duration: 420, easing: 'cubic-bezier(.2,.8,.2,1)'});
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
    <button class="one-sq one-aib" data-one-ai aria-label="Ouvrir Claude (projet TNR)" title="Ouvrir Claude (projet TNR)">${oneIc('ai')}<span>IA</span></button></div>
    <nav id="one-tabs" class="one-tabs" aria-label="Sections"><span class="one-pill"></span>${[0, 1, 2, 3, 4, 5].map(i => `<button data-one-t="${i}"></button>`).join('')}</nav>`);
  document.addEventListener('click', e => {
    const m = e.target.closest('[data-one-m]'); if (m) { if (m.dataset.oneM !== S.mod) oneSwitch(m.dataset.oneM); else window.scrollTo({top: 0, behavior: 'smooth'}); return; }
    const t = e.target.closest('[data-one-t]'); if (t) { oneTab(+t.dataset.oneT); return; }
    if (e.target.closest('[data-one-ai]')) { oneAiGo(); return; }
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
  const dir = Math.sign(x - x0), want = Math.min(9, Math.abs(x - x0) * .06), over = Math.max(pad, Math.min(max, x + dir * want)), sq = want - Math.abs(over - x);
  // Contre un bord, l'élan qui ne peut pas passer devient un petit écrasement : la pastille reste dans le cadre.
  const mid = sq > 1 ? {transform: `translateX(${dir > 0 ? x + sq * 1.1 : x}px)`, width: (w - sq * 1.1) + 'px', offset: .72} : {transform: `translateX(${over}px)`, width: w + 'px', offset: .72};
  p.getAnimations().forEach(a => a.cancel());
  p.animate([{transform: `translateX(${x0}px)`, width: w0 + 'px'}, mid, {transform: `translateX(${x}px)`, width: w + 'px'}], {duration: 460, easing: 'cubic-bezier(.3,.7,.25,1)'});
}
// Met la barre et le sélecteur à jour (noms, icônes, pastilles) ; appelée après chaque changement de page.
function oneSync() {
  const tabs = $('#one-tabs'), top = $('#one-top'); if (!tabs || !ONE.mods.includes(S.mod)) return;
  document.documentElement.style.setProperty('--one-c', ONE.col[S.mod]);
  const src = [...(pcBar(S.mod)?.querySelectorAll('[role=tab]') || [])], i = oneIdx();
  tabs.querySelectorAll('[data-one-t]').forEach((b, j) => { const s = src[j]; if (!s) return; const h = s.innerHTML; if (b._h !== h) { b.innerHTML = h; b._h = h; } b.setAttribute('aria-label', s.textContent.trim()); b.classList.toggle('on', j === i); });
  top.querySelectorAll('[data-one-m]').forEach(b => b.classList.toggle('on', b.dataset.oneM === S.mod));
  onePill(tabs, tabs.querySelector('.one-pill'), tabs.querySelector('[data-one-t].on')); onePill(top.querySelector('.one-mods'), top.querySelector('.one-mp'), top.querySelector('.one-mods .on'));
  try { localStorage.setItem('one.pos', JSON.stringify({m: S.mod, i})); } catch (e) {}
}

/* ---------- animations : courbes qui se dessinent, blocs qui montent, anneaux et chiffres qui partent de zéro ---------- */
// Seulement juste après un geste (arrivée sur une page, changement de période, d'unité…), pas à chaque mise à jour silencieuse des données.
const oneRecent = () => (ONE.reveal || (!document.getElementById('splash') && !window.TNR_SPLASH_ON)) && performance.now() - ONE.act < 1600 && ONE.done !== ONE.act;
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
  // Intensité et volume (Training · Tendance) : les barres poussent comme celles du tonnage.
  root.querySelectorAll('svg.dual').forEach(svg => { if (!fresh(svg)) return; svg.querySelectorAll('rect').forEach((r, i) => { r.style.transformBox = 'fill-box'; r.style.transformOrigin = '50% 100%'; r.animate([{transform: 'scaleY(0)'}, {transform: 'scaleY(1)'}], {duration: 560, delay: Math.min(520, i * 22), easing: 'cubic-bezier(.34,1.35,.5,1)', fill: 'backwards'}); }); });
  root.querySelectorAll('svg.ring').forEach(s => { if (!fresh(s)) return; const c = s.querySelectorAll('circle')[1]; if (!c) return; const C = +c.getAttribute('stroke-dasharray'), o = +c.getAttribute('stroke-dashoffset'); if (!C) return;
    c.animate([{strokeDashoffset: C}, {strokeDashoffset: o}], {duration: 1150, easing: 'cubic-bezier(.3,.8,.25,1)'}); });
  root.querySelectorAll('.imb i').forEach((b, i) => { if (!fresh(b)) return; b.style.transformOrigin = b.classList.contains('neg') ? 'right' : 'left';
    b.animate([{transform: 'scaleX(0)'}, {transform: 'scaleX(1)'}], {duration: 750, delay: 150 + i * 60, easing: 'cubic-bezier(.3,1.25,.5,1)', fill: 'backwards'}); });
  const nums = [...root.querySelectorAll('.num, .imh b, .segl b')].filter(fresh); oneCount(nums);
  if (nums.length || root.querySelector('svg')) ONE.done = ONE.act;
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

/* ---------- IA : l'appli Claude, projet TNR (elle lit tes données à jour grâce au connecteur TNR) ---------- */
function oneAiGo() { oneHap(6); aiOpenClaude(); }

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
  if (S.sheet || P.stack.length || PLFS.on || POP_SKIP || !ONE.mods.includes(S.mod)) return; if (oneIdx() > 0) oneTab(0);
}, true);
// Au démarrage : directement dans le dernier module et le dernier onglet utilisés (Training · Aujourd'hui la première fois).
(function oneStart(n = 0) {
  if (!S.mod && n < 200) { setTimeout(() => oneStart(n + 1), 50); return; }
  oneSwitch('R', 0); ONE.ready = true; oneSync();
})();

/* ---------- même période partout : Jour · Semaine · Mois · Année · Tout, et les flèches pour remonter le temps ---------- */
// Ce qui compte « jusqu'à aujourd'hui » compte jusqu'à la fin de la période choisie quand une page la demande.
const oneTo = () => ONE.per && ONE.per.to < TODAY ? ONE.per.to : TODAY;
const oneShift = f => (0, eval)('(' + f.toString().replace(/\bTODAY\b/g, 'oneTo()') + ')');
musPeriod = oneShift(musPeriod); tBuckets = oneShift(tBuckets); painWindow = oneShift(painWindow); zoneCare = oneShift(zoneCare);
const ONE_DAYS = {day: 1, week: 7, month: 30, year: 365, all: 3650};
const onePerBar = P => granSeg() + `<div class="card" style="margin-top:10px;padding:8px 12px">${periodNav(P)}</div>`;
const oneAfterHead = (h, add) => h.replace('</header>', '</header>' + add);
function oneWithPer(fn) { ONE.per = periodOf(S.gran, S.off); try { return fn(ONE.per); } finally { ONE.per = null; } }
// Training · Tendance
const oneTProg0 = tProgress;
tProgress = () => oneWithPer(P => {
  const sv = S.tgran; S.tgran = S.gran === 'all' ? 'year' : S.gran; let h; try { h = oneTProg0(); } finally { S.tgran = sv; }
  h = h.replace(/<div class="seg" role="group" aria-label="Période">(?:(?!<\/div>)[\s\S])*?data-tgran[\s\S]*?<\/div>/, '');
  return oneAfterHead(h, onePerBar(P));
});
// Training · Mon corps : la période en haut, puis muscu / sprint / les deux / tout, puis le corps
const oneBodyCard0 = bodyCard;
bodyCard = () => { let h = oneBodyCard0(); if (!ONE.per) return h; return h.replace(msrcSeg(), '').replace(/<div class="seg" role="group" aria-label="Période" style="margin-top:8px">[\s\S]*?<\/div>/, ''); };
const oneTBody0 = tBody;
tBody = () => oneWithPer(P => { const sv = S.mgran; S.mgran = S.gran; let h; try { h = oneTBody0(); } finally { S.mgran = sv; } return oneAfterHead(h, onePerBar(P) + msrcSeg()); });
// Recovery · Mon corps
const oneRBody0 = vReports;
vReports = () => oneWithPer(P => {
  const sv = RB.n; RB.n = Math.max(1, Math.min(ONE_DAYS[S.gran] || 7, daysBetween(P.from, oneTo()) + 1)); let h; try { h = oneRBody0(); } finally { RB.n = sv; }
  h = h.replace(/<div class="seg" role="group" aria-label="Période">[\s\S]*?<\/div>/, '').replace(/Douleurs (du jour|des 7 derniers jours|des 30 derniers jours)/, 'Douleurs · ' + esc(P.title.toLowerCase()));
  return oneAfterHead(h, onePerBar(P) + '<div class="one-segsp" aria-hidden="true"></div>');
});
document.addEventListener('click', e => { if (S.mod === 'T' && e.target.closest('[data-gran],[data-off]')) { ONE.act = performance.now(); setTimeout(() => renderMod(true)); } });

/* ---------- Séances : le planning en premier (même hauteur en T, N et R), la saison en dessous des boutons ---------- */
const oneTSes0 = tSessions;
tSessions = () => {
  let h = oneTSes0();
  const ban = h.match(/<button class="banner" data-tseason[\s\S]*?<\/button>/)?.[0], seg = h.match(/<div class="seg" role="group" aria-label="Type">[\s\S]*?<\/div>/)?.[0], row = h.match(/<div class="btnrow two"[\s\S]*?<\/div>/)?.[0];
  if (!ban || !seg || !row) return h;
  h = h.replace(ban, '').replace(seg, '');
  const board = sesBoard(S.tkind); h = h.includes(board) ? h.replace(board, board + seg) : h;
  return h.replace(row, row + '<div style="margin-top:12px">' + ban + '</div>');
};
/* ---------- Les compléments (créatine…) passent dans Menu, sous « + Menu semaine · + Menu jour » ---------- */
const oneFoods0 = fFoods; fFoods = () => oneFoods0().replace(suppSection(), '');
const oneMenu0 = fMenu; fMenu = () => oneMenu0().replace(/(<div class="btnrow" style="margin-top:16px"><button class="btn ghost" data-mnew="week">[\s\S]*?<\/div>)/, '$1<div style="margin-top:16px">' + suppSection() + '</div>');
/* ---------- Training · Aujourd'hui : la phrase du jour toujours là, comme en Nutrition et Recovery ---------- */
const oneTToday0 = tToday;
tToday = () => {
  let h = oneTToday0(); const sl = seasonLine(); if (sl) h = h.replace(sl + '</header>', '</header>' + sl);
  if (!/<p class="pmsg">/.test(h.slice(0, h.indexOf('</header>')))) {
    const pg = planForK(TODAY, 'gym'), ptk = planForK(TODAY, 'track'), p = pg && !kindDone(TODAY, 'gym') ? pg : ptk && !kindDone(TODAY, 'track') ? ptk : pg || ptk;
    h = h.replace(/(<header class="top"><div class="sub">[^<]*<\/div>)/, `$1<p class="pmsg">${esc(trainMsg(p, logsOn(TODAY)))}</p>`);
  }
  return h;
};

/* ---------- Ouverture : le T, le N et le R du logo se séparent et vont se poser dans leurs carrés, en haut ---------- */
window.ONE_SPLASH = function (el, svg, bars) {
  const tg = [...document.querySelectorAll('#one-top .one-mods button b')], ps = svg.querySelectorAll('path');
  if (tg.length !== 3 || ps.length < 4 || oneCalm()) return false;
  const NS = 'http://www.w3.org/2000/svg', D = 1050, fl = [];
  for (let i = 0; i < 3; i++) {
    const bb = ps[i].getBBox(), m = ps[i].getScreenCTM(); if (!m) return false;
    const x = m.e + bb.x * m.a, y = m.f + bb.y * m.d, w = bb.width * m.a, h = bb.height * m.d;
    const s = document.createElementNS(NS, 'svg'); s.setAttribute('viewBox', `${bb.x} ${bb.y} ${bb.width} ${bb.height}`);
    s.style.cssText = `position:fixed;left:${x}px;top:${y}px;width:${w}px;height:${h}px;z-index:302;pointer-events:none;overflow:visible`;
    const p = ps[i].cloneNode(); p.setAttribute('fill', '#fff'); s.appendChild(p); document.body.appendChild(s); fl.push(s);
    const r = tg[i].getBoundingClientRect(), sc = r.height * .56 / h, tx = r.left + r.width / 2 - (x + w / 2), ty = r.top + r.height / 2 - (y + h / 2);
    s.animate([{transform: 'none'}, {transform: `translate(${tx}px,${ty}px) scale(${sc})`}], {duration: D, delay: i * 70, easing: 'cubic-bezier(.7,0,.2,1)', fill: 'forwards'});
    tg[i].animate([{transform: 'scale(.3)', opacity: 0}, {transform: 'scale(1)', opacity: getComputedStyle(tg[i]).opacity}], {duration: 420, delay: D * .78 + i * 70, easing: 'cubic-bezier(.34,1.56,.64,1)', fill: 'backwards'});
  }
  for (let i = 0; i < 3; i++) ps[i].style.opacity = 0;
  el.querySelector('.sp')?.remove();
  el.animate([{opacity: 1}, {opacity: 0}], {duration: 700, delay: 220, easing: 'ease', fill: 'forwards'});
  setTimeout(() => fl.forEach(s => s.animate([{opacity: 1}, {opacity: 0}], {duration: 180, fill: 'forwards'})), D + 150);
  setTimeout(() => { fl.forEach(s => s.remove()); el.remove(); bars(); }, D + 380);
  setTimeout(() => { ONE.reveal = true; ONE.act = performance.now(); ONE.seen = new WeakSet(); oneAfter(); }, 260);
  return true;
};

/* ---------- Mon corps : le même bonhomme, à la même taille et au même endroit en Training, Nutrition et Recovery ---------- */
// Nutrition : deux silhouettes, comme Training et Recovery (face et dos) ; les bras sur l'une, le tronc et les jambes sur l'autre.
const oneFBody0 = fBody;
fBody = () => {
  const h = oneFBody0(), m = h.match(/<div class="segw"><svg viewBox="0 0 200 392"[^>]*>([\s\S]*?)<\/svg>/); if (!m) return h;
  const ells = m[1].match(/<ellipse [^>]*\/>/g) || [], arm = e => /cx="(53|147)"/.test(e);
  const fig = (suf, lab, L) => `<div><div class="lab">${lab}</div><svg viewBox="0 0 200 392" role="img" aria-label="${lab}">${silBase('front', suf)}<g clip-path="url(#silc${suf})" pointer-events="none">${L.join('').replace(/url\(#softsg\)/g, `url(#soft${suf})`)}</g></svg></div>`;
  return h.replace(m[0], `<div class="one-2body">${fig('sgA', 'BRAS', ells.filter(arm))}${fig('sgB', 'TRONC ET JAMBES', ells.filter(e => !arm(e)))}</div><div class="segw one-segw">`);
};
