/* ================= TNR LABO : l'appli principale, une seule entrée =================
   Les pages sont exactement celles de l'appli principale. Ce qui change :
   · plus d'accueil ni de lettres : on arrive directement dans un module ;
   · une barre flottante en verre avec les 6 onglets (leurs noms suivent le module), et le pouce glisse d'un onglet à l'autre ;
   · en haut : « + » (questionnaire du jour) · T · N · R (même onglet, autre module) · « IA » (ouvre l'appli Claude, projet TNR) ;
   · les chiffres, courbes, blocs et anneaux s'animent quand une page arrive ou quand on change de période. */
const ONE_EXT = 4;
const ONE = {mods: ['T', 'N', 'R'], keys: {T: ['today', 'progress', 'sessions', 'library', 'body', 'profile'], N: ['journal', 'progress', 'menu', 'foods', 'nbody', 'goals'], R: ['today', 'trends', 'rsess', 'rlib', 'reports', 'profile']},
  name: {T: 'Training', N: 'Nutrition', R: 'Recovery'}, col: Object.fromEntries(HOME_K), ready: false, act: 0, seen: new WeakSet()};
const oneCur = () => S.mod === 'R' ? S.tab : S.mod === 'T' ? S.ttab : S.mod === 'N' ? S.ftab : null;
const oneIdx = () => Math.max(0, (ONE.keys[S.mod] || []).indexOf(oneCur()));
const oneView = () => S.mod === 'R' ? $('#v-' + S.tab) : S.mod === 'T' ? $('#t-view') : S.mod === 'N' ? $('#f-view') : null;
const oneHap = (ms = 6) => { try { if (PREFS.haptic !== false) navigator.vibrate?.(ms); } catch (e) {} };
const oneCalm = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
// L'accueil n'existe plus : tout ce qui y menait ramène au module en cours.
const oneGo0 = go;
// L'accueil existe à nouveau (page TNR) : y aller, c'est vraiment y aller (avant, ça renvoyait vers Recovery et ça faisait clignoter la barre).
go = function (mod, push = true) { if (mod === 'home') push = false; oneGo0(mod, push); oneSync(); };
// À l'ouverture : toujours Recovery · Aujourd'hui (la récupération d'abord).
const oneSaved = () => ({m: 'R', i: 0});
// Change de module en gardant la même position d'onglet. La page apparaît sur place (pas de glissement : ça, c'est pour les onglets).
function oneSwitch(m, i = oneIdx()) {
  if (!ONE.mods.includes(m)) return;
  if (S.sheet) closeSheet(); while (P.stack.length) closePane();
  const k = ONE.keys[m][i] || ONE.keys[m][0];
  if (m === 'R') S.tab = k; else if (m === 'T') S.ttab = k; else { S.ftab = k; if (k === 'journal') S.fday = TODAY; }
  saveUi(); ONE.act = performance.now(); const y0 = scrollY; oneCalmIn();
  oneGo0(m, false); try { history.replaceState({...(history.state || {}), mod: m}, ''); if (i > 0 && !history.state?.one) history.pushState({mod: m, one: 1}, ''); } catch (e) {}
  oneSync(); oneHap(8);
  // Même onglet, autre module : la page reste à la même hauteur (le planning, le corps… ne bougent pas), juste un échange.
  if (y0 > 0) { const y = Math.min(y0, document.documentElement.scrollHeight - innerHeight); window.scrollTo(0, Math.max(0, y)); }
}
function oneTab(i) {
  if (S.mod === 'home') { oneSwitch(ONE.lm || 'R', i); return; }
  const k = ONE.keys[S.mod]?.[i]; if (!k) return;
  if (k === oneCur()) { window.scrollTo({top: 0, behavior: 'smooth'}); return; }
  // Le retour du téléphone depuis un onglet ramène à Aujourd'hui (une seule étape dans l'historique).
  if (i > 0 && !history.state?.one) try { history.pushState({mod: S.mod, one: 1}, ''); } catch (e) {}
  // La nouvelle page arrive sur place : pas de titres ni de blocs qui remontent.
  oneCalmIn();
  if (S.mod === 'R') setTab(k); else { if (S.mod === 'T') S.ttab = k; else { S.ftab = k; if (k === 'journal') S.fday = TODAY; } saveUi(); renderMod(true); window.scrollTo(0, 0); pcSync(); }
  oneSync(); oneHap(5);
}
const ICN = {cal: '<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/>', plus: '<path d="M12 5v14M5 12h14"/>', ai: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>'};
const oneIc = (k, s = 20) => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICN[k]}</svg>`;
function oneMount() {
  document.documentElement.classList.add('one');
  document.body.insertAdjacentHTML('beforeend', `<div id="one-top" class="one-top"><button class="one-sq" data-hday aria-label="Questionnaire du jour" title="Questionnaire du jour">${oneIc('plus')}</button>
    <div class="one-mods" role="tablist" aria-label="Module"><span class="one-mp"></span>${ONE.mods.map(m => `<button role="tab" data-one-m="${m}" style="--c:${ONE.col[m]}"><b>${m}</b><span>${ONE.name[m]}</span></button>`).join('')}</div>
    <button class="one-sq" data-hplan aria-label="Planning" title="Planning">${oneIc('cal')}</button></div>
    <button class="one-sq one-aib one-hai" data-one-ai aria-label="Ouvrir Claude (projet TNR)" title="Ouvrir Claude (projet TNR)">${oneIc('ai')}<span>IA</span></button>
    <nav id="one-tabs" class="one-tabs" aria-label="Sections"><span class="one-pill"></span><button data-one-h aria-label="Accueil"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 11l8-6.5 8 6.5"/><path d="M6 9.5V20h12V9.5"/><path d="M10 20v-5h4v5"/></svg>Accueil</button>${[0, 1, 2, 3, 4, 5].map(i => `<button data-one-t="${i}"></button>`).join('')}</nav>`);
  document.addEventListener('click', e => {
    const m = e.target.closest('[data-one-m]'); if (m) { if (S.mod === 'home') oneSwitch(m.dataset.oneM, 0); else if (m.dataset.oneM !== S.mod) oneSwitch(m.dataset.oneM); else window.scrollTo({top: 0, behavior: 'smooth'}); return; }
    const t = e.target.closest('[data-one-t]'); if (t) { oneTab(+t.dataset.oneT); return; }
    if (e.target.closest('[data-one-h]')) { oneHome(); return; }
    if (e.target.closest('[data-one-ai]')) { oneAiGo(); return; }
  });
  for (const ev of ['pointerdown', 'keydown', 'touchstart']) addEventListener(ev, () => { ONE.act = performance.now(); }, {capture: true, passive: true});
  addEventListener('resize', () => oneSync());
}
// La lentille garde toujours sa taille. Elle glisse avec un petit élan, qui peut aller dans la marge de la barre sans jamais sortir du cadre ;
// ce qui passe dessous grossit un peu, comme sous une loupe.
function onePill(box, p, on) {
  if (!box || !on || !p) return;
  // En bas, la lentille déborde un peu de chaque côté du bouton : les mots longs (Aujourd'hui, Tendances) gardent leur taille
  // et respirent dedans, même grossis par la loupe.
  const ext = box.id === 'one-tabs' ? ONE_EXT : 0, x = Math.max(3, on.offsetLeft - ext / 2), w = on.offsetWidth + ext, lo = 3, hi = box.clientWidth - 3 - w;
  // En haut (T N R), la lentille est posée en proportion de la barre : elle reste sur le bon module même quand la barre s'élargit (sortie de l'Accueil).
  if (p.classList.contains('one-mp')) { oneMp(box, p, on); return; }
  const x0 = p._x; p._x = x; p._w = w;
  p.style.width = w + 'px'; p.style.transform = `translateX(${x}px)`;
  if (x0 == null || x0 === x || oneCalm()) { oneMag(box, p, 0); return; }
  const dir = Math.sign(x - x0), over = Math.max(lo, Math.min(hi, x + dir * Math.min(10, Math.abs(x - x0) * .07)));
  p.getAnimations().forEach(a => a.cancel());
  p.animate([{transform: `translateX(${x0}px)`}, {transform: `translateX(${over}px)`, offset: .7}, {transform: `translateX(${x}px)`}], {duration: 480, easing: 'cubic-bezier(.3,.7,.25,1)'});
  oneMag(box, p, 520);
}
function oneMp(box, p, on) {
  const bs = [...box.querySelectorAll('button')], i = bs.indexOf(on), n = bs.length, cs = getComputedStyle(box), pl = parseFloat(cs.paddingLeft), pr = parseFloat(cs.paddingRight);
  const i0 = p._i; p._i = i; p.style.left = pl + 'px'; p.style.width = `calc((100% - ${pl + pr}px) / ${n})`; p.style.transform = `translateX(${i * 100}%)`;
  if (i0 == null || i0 === i || oneCalm()) { oneMag(box, p, 0); return; }
  const dir = Math.sign(i - i0), edge = (i === 0 && dir < 0) || (i === n - 1 && dir > 0), ov = Math.min(edge ? Math.max(0, (dir < 0 ? pl : pr) - 3) : 10, Math.abs(i - i0) * on.offsetWidth * .07);
  p.getAnimations().forEach(a => a.cancel());
  p.animate([{transform: `translateX(${i0 * 100}%)`}, {transform: `translateX(calc(${i * 100}% + ${dir * ov}px))`, offset: .7}, {transform: `translateX(${i * 100}%)`}], {duration: 480, easing: 'cubic-bezier(.3,.7,.25,1)'});
  oneMag(box, p, 520);
}
function oneMag(box, p, ms) {
  const t0 = performance.now();
  const f = () => { const pr = p.getBoundingClientRect(), c = pr.left + pr.width / 2;
    box.querySelectorAll('button').forEach(b => { const r = b.getBoundingClientRect(), d = Math.abs(r.left + r.width / 2 - c) / (r.width || 1); b.style.setProperty('--mag', (1 + (box.id === 'one-tabs' ? .07 : .14) * Math.max(0, 1 - d)).toFixed(3)); });
    if (performance.now() - t0 < ms) requestAnimationFrame(f); };
  f();
}
// Met la barre et le sélecteur à jour (noms, icônes, pastilles) ; appelée après chaque changement de page.
function oneSync() {
  const tabs = $('#one-tabs'), top = $('#one-top'), home = S.mod === 'home'; if (!tabs || (!home && !ONE.mods.includes(S.mod))) return;
  if (!home) ONE.lm = S.mod; const m = home ? ONE.lm || 'R' : S.mod;
  document.documentElement.classList.toggle('one-home', home);
  // À l'Accueil, le haut de l'écran (heure, batterie) est toujours noir, comme la page.
  if (home && ONE.barTo !== '#000000' && !window.TNR_SPLASH_ON) syncBars();
  document.documentElement.style.setProperty('--one-c', home ? '#8E9BB5' : ONE.col[m]);
  const src = [...(pcBar(m)?.querySelectorAll('[role=tab]') || [])], i = home ? -1 : oneIdx();
  tabs.querySelectorAll('[data-one-t]').forEach((b, j) => { const s = src[j]; if (!s) return; const h = s.innerHTML; if (b._h !== h) { b.innerHTML = h; b._h = h; } b.setAttribute('aria-label', s.textContent.trim()); b.classList.toggle('on', j === i); });
  tabs.querySelector('[data-one-h]').classList.toggle('on', home);
  top.querySelectorAll('[data-one-m]').forEach(b => b.classList.toggle('on', !home && b.dataset.oneM === S.mod));
  onePill(tabs, tabs.querySelector('.one-pill'), tabs.querySelector('button.on'));
  const box = top.querySelector('.one-mods'), mp = top.querySelector('.one-mp');
  if (home) box.querySelectorAll('button').forEach(b => b.style.setProperty('--mag', 1));
  else onePill(box, mp, box.querySelector('.on'));
}
// Accueil : la page d'accueil de l'appli ; en haut, les noms s'effacent et le T, le N et le R se rapprochent pour écrire TNR.
function oneHome() {
  if (S.mod === 'home') { window.scrollTo({top: 0, behavior: 'smooth'}); return; }
  ONE.lm = S.mod; if (S.sheet) closeSheet(); while (P.stack.length) closePane();
  ONE.act = performance.now(); oneCalmIn(); oneGo0('home', false); window.scrollTo(0, 0); oneSync(); oneHap(6);
}
// Pendant un changement de module, les petites entrées animées de l'appli d'origine (blocs qui montent de quelques pixels)
// sont coupées : la page s'échange sur place, sans rebond. Les chiffres et courbes du labo s'animent toujours.
function oneCalmIn() { const R = document.documentElement; R.classList.add('one-sw'); clearTimeout(ONE.swT); ONE.swT = setTimeout(() => R.classList.remove('one-sw'), 700); }
// L'accueil du labo : juste la date et la phrase du jour (le reste de l'ancien accueil est retiré pour l'instant).
vHome = () => `<div class="hm one-hm" id="hm"><header class="hm-head" id="hm-head"><div class="sub">${fmtDay(TODAY)}</div><h1 class="hello">${esc(homeGreeting())}</h1></header></div>`;

/* ---------- animations : courbes qui se dessinent, blocs qui montent, anneaux et chiffres qui partent de zéro ---------- */
// Seulement juste après un geste (arrivée sur une page, changement de période, d'unité…), pas à chaque mise à jour silencieuse des données.
const oneRecent = () => (ONE.reveal || (!document.getElementById('splash') && !window.TNR_SPLASH_ON)) && performance.now() - ONE.act < 1600 && ONE.done !== ONE.act;
function oneAnim(root) {
  // Juste après un glissement au pouce, la page était déjà visible avec ses vrais chiffres : on ne les refait pas partir de 0.
  if (!root || oneCalm() || !oneRecent() || performance.now() - (ONE.swiped || 0) < 900) return;
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
  // Nutrition · le chiffre du jour part de « − ce que tu dois manger » et monte jusqu'à ton bilan (ex. −2 580 → +2).
  root.querySelectorAll('.calring .rw > b').forEach(b => { if (!fresh(b)) return; try { const g = fuelGoal(S.fday)?.kcal, t = dayTotals(S.fday)?.kcal || 0; if (g) oneBal(b, -g, t - g); } catch (e) {} });
  const nums = [...root.querySelectorAll('.num, .imh b, .segl b')].filter(fresh); oneCount(nums);
  if (nums.length || root.querySelector('svg')) ONE.done = ONE.act;
}
// Le chiffre monte de 0 jusqu'à sa valeur (le premier nombre de chaque élément, le reste du texte ne bouge pas).
function oneBal(b, from, to) {
  const n = b.firstChild; if (!n || n.nodeType !== 3) return; const fin = n.nodeValue, t0 = performance.now(), D = 1300;
  const txt = v => { const r = Math.round(v); return (r < 0 ? '−' : r > 0 ? '+' : '') + fx(Math.abs(r)); };
  const step = t => { if (!n.isConnected) return; const k = Math.min(1, (t - t0) / D), e = 1 - Math.pow(1 - k, 3); n.nodeValue = k < 1 ? txt(from + (to - from) * e) : fin; if (k < 1) requestAnimationFrame(step); };
  n.nodeValue = txt(from); requestAnimationFrame(step);
}
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
const oneAfter = () => { const v = oneView(); onePlan(v); oneAnim(v); try { archHide(v); } catch (e) {} };
// Arriver sur un onglet de Recovery le redessine toujours : chiffres et anneaux repartent de zéro à chaque visite
// (avant, une page identique n'était pas redessinée, donc rien ne bougeait en revenant).
const oneSetTab0 = setTab; setTab = function (t) { const v = $('#v-' + t); if (v && performance.now() - ONE.act < 400 && performance.now() - (ONE.swiped || 0) > 900) v._html = null; oneSetTab0(t); oneSync(); };
const oneRender0 = render; render = function (...a) { const r = oneRender0(...a); if (S.mod === 'R') oneAfter(); return r; };
const oneRenderMod0 = renderMod; renderMod = function (f) { oneRenderMod0(f); oneSync(); if (S.mod === 'T' || S.mod === 'N') oneAfter(); };
oneMount();
// Retour du téléphone : on revient à Aujourd'hui seulement si l'étape où l'on revient n'est pas déjà un onglet
// (fermer un volet, comme le détail de la masse musculaire, ramène à l'onglet où l'on était : Tendances reste Tendances).
addEventListener('popstate', e => {
  if (e.state?.one || e.state?.sheet || S.sheet || P.stack.length || PLFS.on || POP_SKIP || !ONE.mods.includes(S.mod)) return; if (oneIdx() > 0) oneTab(0);
}, true);
// Au démarrage : directement dans le dernier module et le dernier onglet utilisés (Training · Aujourd'hui la première fois).
try { history.scrollRestoration = 'manual'; } catch (e) {}
(function oneStart(n = 0) {
  if (!S.mod && n < 200) { setTimeout(() => oneStart(n + 1), 50); return; }
  ONE.lm = 'R'; oneGo0('home', false); window.scrollTo(0, 0); ONE.ready = true; oneSync();
})();

/* ---------- même période partout : Jour · Semaine · Mois · Année · Tout, et les flèches pour remonter le temps ---------- */
// Ce qui compte « jusqu'à aujourd'hui » compte jusqu'à la fin de la période choisie quand une page la demande.
const oneTo = () => ONE.per && ONE.per.to < TODAY ? ONE.per.to : TODAY;
const oneShift = f => (0, eval)('(' + f.toString().replace(/\bTODAY\b/g, 'oneTo()') + ')');
painSection = (0, eval)('(' + painSection.toString().replace("draft._view || 'back'", "draft._view || 'front'") + ')');
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
  // L'écran d'ouverture relance son départ au bout de 0,9 s s'il est encore là (sécurité prévue pour l'ancien zoom) :
  // une seule envolée, sinon le fond bleu nuit revenait d'un coup (le flash) et les lettres repartaient.
  if (ONE.spl) return true;
  const tg = [...document.querySelectorAll('#one-top .one-mods button b')], ps = svg.querySelectorAll('path');
  if (tg.length !== 3 || ps.length < 4 || oneCalm()) return false;
  ONE.spl = true;
  // L'appli s'ouvre sur l'Accueil : on mesure la barre dans sa forme finale (T N R serrés), sans attendre ses transitions.
  const de = document.documentElement; de.classList.add('one-home', 'one-notr'); void de.offsetWidth;
  const ink = tg.map(oneInk); de.classList.remove('one-notr');
  const NS = 'http://www.w3.org/2000/svg', D = 1050, fl = [], land = [];
  for (let i = 0; i < 3; i++) {
    const bb = ps[i].getBBox(), m = ps[i].getScreenCTM(); if (!m) return false;
    const x = m.e + bb.x * m.a, y = m.f + bb.y * m.d, w = bb.width * m.a, h = bb.height * m.d;
    const s = document.createElementNS(NS, 'svg'); s.setAttribute('viewBox', `${bb.x} ${bb.y} ${bb.width} ${bb.height}`);
    s.style.cssText = `position:fixed;left:${x}px;top:${y}px;width:${w}px;height:${h}px;z-index:302;pointer-events:none;overflow:visible;transform-origin:50% 50%`;
    const p = ps[i].cloneNode(); p.setAttribute('fill', '#fff'); s.appendChild(p); document.body.appendChild(s); fl.push(s);
    const r = ink[i], sc = r.h / h, tx = r.x + r.w / 2 - (x + w / 2), ty = r.y + r.h / 2 - (y + h / 2), dl = i * 70;
    tg[i].style.transition = 'none'; tg[i].style.opacity = '0';
    const a = s.animate([{transform: 'none'}, {transform: `translate(${tx}px,${ty}px) scale(${sc})`}], {duration: D, delay: dl, easing: 'cubic-bezier(.7,0,.2,1)', fill: 'forwards'});
    // Posée (vraiment, même si le téléphone a démarré l'animation en retard) : la vraie lettre est déjà là, pleine, juste dessous,
    // et la lettre dessinée s'efface par-dessus. Jamais les deux à moitié transparentes en même temps : pas de flash.
    land.push(a.finished.then(() => { tg[i].style.opacity = ''; return s.animate([{opacity: 1}, {opacity: 0}], {duration: 120, fill: 'forwards'}).finished; }).catch(() => {}));
  }
  for (let i = 0; i < 3; i++) ps[i].style.opacity = 0;
  el.querySelector('.sp')?.remove();
  el.animate([{opacity: 1}, {opacity: 0}], {duration: 700, delay: 220, easing: 'ease', fill: 'forwards'});
  let end = false; const fin = () => { if (end) return; end = true; fl.forEach(s => s.remove()); el.remove(); bars(); tg.forEach(b => { b.style.opacity = ''; }); void document.body.offsetWidth; tg.forEach(b => { b.style.transition = ''; }); };
  Promise.all(land).then(fin); setTimeout(fin, 4000);
  return true;
};
// Le contour réel de la lettre affichée (pas sa boîte) : position et hauteur de l'encre, pour que la lettre volante s'y pose pile.
function oneInk(b) {
  const t = b.firstChild, cs = getComputedStyle(b), rg = document.createRange(); rg.selectNodeContents(b);
  const rr = rg.getBoundingClientRect(), cx = (oneInk.c ||= document.createElement('canvas').getContext('2d'));
  cx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`; const m = cx.measureText(t?.nodeValue || 'T');
  const asc = m.actualBoundingBoxAscent, h = asc + m.actualBoundingBoxDescent, w = m.actualBoundingBoxLeft + m.actualBoundingBoxRight;
  const lineTop = rr.top + (rr.height - (m.fontBoundingBoxAscent + m.fontBoundingBoxDescent)) / 2;
  return {x: rr.left - m.actualBoundingBoxLeft, y: lineTop + m.fontBoundingBoxAscent - asc, w, h};
}

/* ---------- Mon corps : le même bonhomme, à la même taille et au même endroit en Training, Nutrition et Recovery ---------- */
// Nutrition : deux silhouettes, comme Training et Recovery (face et dos) ; les bras sur l'une, le tronc et les jambes sur l'autre.
const oneFBody0 = fBody;
fBody = () => {
  const h = oneFBody0(), m = h.match(/<div class="segw"><svg viewBox="0 0 200 392"[^>]*>([\s\S]*?)<\/svg>/); if (!m) return h;
  const ells = m[1].match(/<ellipse [^>]*\/>/g) || [], arm = e => /cx="(53|147)"/.test(e);
  const fig = (suf, lab, L) => `<div><div class="lab">${lab}</div><svg viewBox="0 0 200 392" role="img" aria-label="${lab}">${silBase('front', suf)}<g clip-path="url(#silc${suf})" pointer-events="none">${L.join('').replace(/url\(#softsg\)/g, `url(#soft${suf})`)}</g></svg></div>`;
  return h.replace(m[0], `<div class="one-2body">${fig('sgA', 'BRAS', ells.filter(arm))}${fig('sgB', 'TRONC ET JAMBES', ells.filter(e => !arm(e)))}</div><div class="segw one-segw">`);
};

/* ---------- au pouce, l'Accueil est la page juste à gauche d'Aujourd'hui (et Aujourd'hui juste à droite de l'Accueil) ---------- */
window.TAB_XNB = (k, T, html) => {
  if (T.home) { if (k < 0) return null; const m = ONE.lm || 'R', key = ONE.keys[m][0];
    return {cls: '', box: $('#home-view'), html: () => `<div class="wrap">${m === 'R' ? '<div class="mm-space"></div>' : ''}<section class="gv-${m === 'R' ? 'v-' + key : m === 'T' ? 't-view' : 'f-view'}">${html(m, key)}</section></div>`, go: () => oneSwitch(m, 0)}; }
  if (k < 0 && T.i === 0 && ONE.mods.includes(S.mod)) return {cls: '', box: $('#mod-' + S.mod), html: () => vHome(), go: () => oneHome()};
  return null;
};
/* ---------- la bulle du bas suit le pouce pendant qu'on glisse d'un onglet à l'autre (dès le premier pixel) ---------- */
window.TAB_DRAG = (i, f, ms) => {
  oneCalmIn();
  if (ms && f) ONE.swiped = performance.now() + ms;
  const tabs = $('#one-tabs'), p = tabs?.querySelector('.one-pill'); if (!p) return;
  // Les boutons dans l'ordre : Accueil, puis les 6 onglets (Accueil = position -1).
  const bs = [...tabs.querySelectorAll('button')], a = bs[i + 1]; if (!a) return;
  const b = bs[i + 1 + Math.sign(f)] || a, q = Math.abs(f);
  const x = Math.max(3, a.offsetLeft - ONE_EXT / 2 + (b.offsetLeft - a.offsetLeft) * q), w = a.offsetWidth + (b.offsetWidth - a.offsetWidth) * q + ONE_EXT;
  p.getAnimations().forEach(an => an.cancel());
  const from = p.style.transform, fw = p.style.width; p.style.transform = `translateX(${x}px)`; p.style.width = w + 'px'; p._x = x; p._w = w;
  if (ms && from) { p.animate([{transform: from, width: fw || w + 'px'}, {transform: p.style.transform, width: w + 'px'}], {duration: ms, easing: 'cubic-bezier(.22,.8,.3,1)'}); oneMag(tabs, p, ms + 40); }
  else oneMag(tabs, p, 0);
};

/* ---------- la barre d'état du téléphone (en haut, avec l'heure) change de couleur au même rythme que le fond ---------- */
const oneRgb = c => { c = String(c || '').trim(); let m = c.match(/^#([0-9a-f]{3})$/i); if (m) c = '#' + [...m[1]].map(x => x + x).join('');
  m = c.match(/^#([0-9a-f]{6})$/i); if (m) return [0, 2, 4].map(k => parseInt(m[1].slice(k, k + 2), 16));
  m = c.match(/^rgba?\((\d+)\D+(\d+)\D+(\d+)/i); return m ? [+m[1], +m[2], +m[3]] : null; };
const ONE_BAR = {cur: null, raf: 0}, ONE_BAND = .3;   // même dosage que --band (one.css)
syncBars = function () {
  const R = document.documentElement, set = c => { if (ONE_BAR.cur === c) return; ONE_BAR.cur = c; document.querySelectorAll('meta[name="theme-color"]').forEach(m => { m.media = ''; m.content = c; }); };
  cancelAnimationFrame(ONE_BAR.raf);
  if (window.TNR_SPLASH_ON) { ONE.barTo = '#0B1733'; set('#0B1733'); return; }
  const c1 = R.classList.contains('one-pl') ? null : oneRgb({T: '#FF3B30', N: '#30D158', R: '#0A84FF'}[S.mod]);
  // Accueil, planning, questionnaire : noir tout de suite, comme la page.
  if (!c1) { ONE.barTo = '#000000'; set('#000000'); return; }
  const hex = v => '#' + v.map(x => Math.round(x * ONE_BAND).toString(16).padStart(2, '0')).join('');
  ONE.barTo = hex(c1);
  // Ailleurs : la barre lit, image par image, la couleur que la page est en train d'afficher (--o1, qui glisse en 1,6 s),
  // donc elle change exactement au même rythme que le fond et le dégradé.
  const t0 = performance.now(), to = ONE.barTo;
  const f = now => { if (ONE.barTo !== to) return; const c = oneRgb(getComputedStyle(R).getPropertyValue('--o1')) || c1, h = hex(c);
    set(h); if (h !== to && now - t0 < 2500) ONE_BAR.raf = requestAnimationFrame(f); else set(to); };
  if (oneCalm() || document.hidden) { set(to); return; }
  ONE_BAR.raf = requestAnimationFrame(f);
};

// En revenant dans l'appli, la barre reprend la couleur de la page affichée.
document.addEventListener('visibilitychange', () => { if (!document.hidden) { ONE_BAR.cur = null; syncBars(); } });

/* ---------- Planning et questionnaire du jour : une page à part, toute noire (sans fond coloré, sans dégradé en haut,
   sans les barres). Le planning monte du bas en s'ouvrant, comme le questionnaire. ---------- */
(function onePlanWatch() {
  const el = document.getElementById('plfs'), sh = document.getElementById('sheet'); if (!el || !sh) { setTimeout(onePlanWatch, 300); return; }
  let was = false;
  const sync = () => {
    const pl = el.classList.contains('on'), full = sh.classList.contains('on') && sh.classList.contains('full'), on = pl || full;
    if (pl && !was && !oneCalm()) el.animate([{transform: 'translateY(100%)'}, {transform: 'none'}], {duration: 420, easing: 'cubic-bezier(.32,.72,0,1)'});
    was = pl;
    if (on === document.documentElement.classList.contains('one-pl')) return; document.documentElement.classList.toggle('one-pl', on); syncBars(); };
  new MutationObserver(sync).observe(el, {attributes: true, attributeFilter: ['class']});
  new MutationObserver(sync).observe(sh, {attributes: true, attributeFilter: ['class']}); sync();
  // La flèche du questionnaire devient une croix (en haut à droite).
  const b = document.getElementById('sh-back'); if (b) { b.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>'; b.setAttribute('aria-label', 'Fermer'); }
})();
// Fenêtres qui montent du bas : plus de flèche retour (on les descend avec la tirette) ; une croix en haut à droite
// seulement là où on ne peut pas les descendre (fenêtres fixes, comme l'éditeur de séance, et sur ordinateur).
const onePaneShow0 = paneShow;
paneShow = function (...a) { const r = onePaneShow0.apply(this, a); const v = P.stack.at(-1); if (v) { $('#pn-back').hidden = true; $('#pn-close').hidden = !(v.fixed || P.stack[0]?.side || (typeof isPC === 'function' && isPC())); } return r; };

/* ---------- Les petits textes d'aide (« Touche un bloc pour… », « Garde le doigt… ») sont masqués :
   à leur place, un petit « Afficher » pour les lire si besoin. Les chiffres et les vraies infos restent visibles. ---------- */
(function oneTips() {
  const SEL = 'p.small.muted, p.hint, p.small.hint, .tools .hint, h2 small, .sec-label small';
  const skip = el => el.closest('.one-st, #one-top, #one-tabs, .toast, .dhead, .chartbox, svg') || el.dataset.tip;
  const run = root => {
    root.querySelectorAll?.(SEL).forEach(el => {
      if (skip(el)) return; el.dataset.tip = '1';
      const t = el.textContent.trim();
      if (el.matches('h2 small, .sec-label small')) { if (t.length > 22) el.hidden = true; return; }
      if (t.length < 46) return;
      el.hidden = true; el.classList.add('one-tipx');
      const b = document.createElement('button'); b.type = 'button'; b.className = 'one-tipb'; b.textContent = 'Détail';
      b.onclick = e => { e.stopPropagation(); el.hidden = !el.hidden; b.textContent = el.hidden ? 'Détail' : 'Masquer'; };
      el.after(b);
    });
  };
  // Juste après chaque changement de page, avant qu'elle s'affiche (la copie qui glisse au pouce aussi) : rien ne saute.
  new MutationObserver(ms => { for (const m of ms) for (const n of m.addedNodes) if (n.nodeType === 1) { if (n.matches(SEL)) run(n.parentNode); else run(n); } }).observe(document.body, {childList: true, subtree: true});
  run(document.body);
})();

/* ---------- Sur téléphone, toutes les fenêtres montent du bas (tirette) : plus aucune qui arrive par le côté. ---------- */
const oneOpenPane0 = openPane;
openPane = function (v, ...a) { if (v?.side && !(typeof isPC === 'function' && isPC())) v.side = false; return oneOpenPane0(v, ...a); };

/* ---------- Tendances : toute la carte s'ouvre (avant, seul le petit bouton du bas ouvrait le détail) ---------- */
document.addEventListener('click', e => {
  if (e.defaultPrevented || e.target.closest('button, a, input, select, textarea, label, summary, .chartbox, .seg, [data-metric]')) return;
  const c = e.target.closest('.card'); if (!c || !c.closest('#t-view, #f-view, [id^="v-"]')) return;
  const m = c.querySelectorAll('[data-metric]'); if (m.length === 1) m[0].click();
});

/* ---------- Archives des plannings (Training, Recovery, Nutrition) ----------
   En bas de chaque planning, un bouton « Archive ». Quand on attrape une séance (ou un menu), il devient « Archiver » :
   on la lâche dessus, elle quitte la liste (sans être perdue). Un exercice attrapé : « Supprimer » (on peut le rajouter).
   Sans rien attraper, « Archive » ouvre les séances archivées, qu'on peut remettre. */
const ARCH = {
  T: {get: () => S.tset?.arch || [], set: L => saveTset({arch: L}), name: r => refName(r), attr: 'bref', ex: r => isExRef(r), del: r => saveTset({myEx: (S.tset.myEx || []).filter(x => x !== r.slice(2))})},
  R: {get: () => S.app?.rarch || [], set: L => rsSaveApp({rarch: L}), name: r => rsRef(r)?.name || '', attr: 'rref', ex: r => isExRef(r), del: r => rsSaveApp({rmyEx: (S.app.rmyEx || []).filter(x => x !== r.slice(2))})},
  N: {get: () => S.fset?.march || [], set: L => saveFset({march: L}), name: r => menuById(r)?.name || '', attr: 'mref', ex: () => false, del: () => {}}
};
const archMod = el => el?.closest('.rboard') ? 'R' : el?.closest('.mboard') ? 'N' : 'T';
// Ce qui est archivé n'apparaît plus dans les listes à caler (le reste du planning ne change pas).
function archHide(root = document) {
  root.querySelectorAll?.('.sboard').forEach(b => {
    const m = archMod(b), A = ARCH[m], L = new Set(A.get());
    b.querySelectorAll(`.bsrc [data-${A.attr}]`).forEach(c => { c.style.display = L.has(c.dataset[A.attr]) ? 'none' : ''; });
    if (!b.querySelector(':scope > .one-archrow')) b.insertAdjacentHTML('beforeend', `<div class="one-archrow"><button type="button" class="one-arch" data-onearch="${m}">Archive</button></div>`);
  });
}
new MutationObserver(ms => { for (const x of ms) for (const n of x.addedNodes) if (n.nodeType === 1 && (n.matches?.('.sboard') || n.querySelector?.('.sboard'))) { archHide(n.parentNode || document); return; } }).observe(document.body, {childList: true, subtree: true});
// Pendant qu'on porte un bloc de la liste : le bouton devient la cible.
new MutationObserver(() => {
  const on = document.body.classList.contains('bdragging'), src = document.querySelector('.bdrag');
  document.querySelectorAll('.one-arch').forEach(b => { const mine = on && src && b.closest('.sboard')?.contains(src) && src.closest('.bsrc');
    const m = b.dataset.onearch, ref = src?.dataset[ARCH[m].attr === 'bref' ? 'bref' : ARCH[m].attr === 'rref' ? 'rref' : 'mref'];
    b.classList.toggle('drop', !!mine); b.textContent = mine ? (ARCH[m].ex(ref) ? 'Supprimer' : 'Archiver') : 'Archive'; });
}).observe(document.body, {attributes: true, attributeFilter: ['class']});
document.addEventListener('pointermove', e => { const b = document.querySelector('.one-arch.drop'); if (!b) return; const r = b.getBoundingClientRect(); b.classList.toggle('over', e.clientX > r.left - 10 && e.clientX < r.right + 10 && e.clientY > r.top - 14 && e.clientY < r.bottom + 14); }, true);
document.addEventListener('pointerup', async e => {
  const b = document.querySelector('.one-arch.drop.over'), src = document.querySelector('.bdrag'); if (!b || !src) return;
  const m = b.dataset.onearch, A = ARCH[m], ref = src.dataset[A.attr === 'bref' ? 'bref' : A.attr === 'rref' ? 'rref' : 'mref']; if (!ref) return;
  const n = A.name(ref) || 'Bloc';
  if (A.ex(ref)) { await A.del(ref); toast(n + ' supprimé'); }
  else { const p = A.set([...new Set([...A.get(), ref])]); archHide(); await p; archHide(); toast(n + ' archivé'); }
  oneHap(10);
}, true);
function archPane(m) {
  const A = ARCH[m];
  openPane({title: 'Archive', render: () => { const L = A.get().filter(r => A.name(r));
    return L.length ? `<div class="list" style="margin-top:14px">${L.map(r => `<div class="row"><span class="l">${esc(A.name(r))}</span><button type="button" class="chip" data-onerest="${m}|${esc(r)}">Remettre</button></div>`).join('')}</div>`
      : '<div class="card empty" style="margin-top:14px"><b>Rien d\'archivé</b>Attrape une séance dans la liste et lâche-la sur « Archiver ».</div>'; }});
}
document.addEventListener('click', async e => {
  const a = e.target.closest('[data-onearch]'); if (a && !a.classList.contains('drop')) { archPane(a.dataset.onearch); return; }
  const r = e.target.closest('[data-onerest]'); if (r) { const [m, ...x] = r.dataset.onerest.split('|'), ref = x.join('|'); await ARCH[m].set(ARCH[m].get().filter(y => y !== ref)); paneRender(); archHide(); toast('Remis dans la liste'); }
});
