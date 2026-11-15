/* ================= TNR TEST : l'appli qui réunit les idées retenues =================
   Se charge après nx.js et remplace certains écrans. Règle : chaque information n'est affichée qu'à un seul endroit.
   · Aujourd'hui : stories (nuit, VFC, FC repos, poids, corps) · forme · check du matin · ta journée (séances et repas à leur heure, + entre les blocs) · carburant · conseils
   · Semaine : calendrier · piste des mètres de sprint · la semaine en chiffres
   · Séances : qualités physiques (exercices + dosage) · mes séances · modèles · historique
   · Progrès : régularité · tendances · jauge de charge · vitesse et records */

/* ---------- stories : les mesures du corps, en plein écran ---------- */
const NXS_DEF = () => {
  const kG = lastKey('hrv') || TODAY, sl = VAL.sleepH(kG), need = sleepGoal(), hrv = G(kG, 'hrv'), hb = base('hrv', kG, 60), rhr = G(kG, 'rhr'), rb = base('rhr', kG, 60);
  const kW = lastKey('weight'), wt = kW ? W(kW, 'weight') : null, PN = Object.entries(pains(TODAY)).filter(([, v]) => v > 0), sor = M(TODAY, 'well')?.sor;
  const s7 = series('sleepH', 7).map(p => p.v).filter(v => v != null), debt = s7.reduce((a, v) => a + Math.max(0, need - v), 0);
  const pct = (v, b) => v != null && b ? (v >= b ? '+' : '−') + Math.abs(Math.round((v / b - 1) * 100)) + ' %' : '–';
  return [
    {k: 'nuit', lab: 'Nuit', word: 'NUIT', c: NXC.sleep, ring: sl != null ? hmH(sl).replace(/\s/g, '') : '–', p: sl != null ? Math.min(100, sl / need * 100) : 0,
      body: () => `<span class="k">SOMMEIL · ${esc(fmtShort(kG).toUpperCase())}</span><div class="big">${hmH(sl)}</div><div class="ttl">${sl == null ? 'Pas de mesure' : sl >= need - .3 ? 'Nuit complète' : sl >= need - 1 ? 'Un peu courte' : 'Nuit trop courte'}</div>
        <div class="grid"><div><b>${hmH(need)}</b><span>ton besoin</span></div><div><b>${s7.length ? hmH(mean(s7)) : '–'}</b><span>moyenne 7 nuits</span></div><div><b>${hmH(debt)}</b><span>dette sur 7 nuits</span></div></div>
        ${nxBars(series('sleepH', 14).map(p => ({v: p.v, hl: p.k === kG})), {c: '#fff', ref: need, refLab: 'besoin', max: 10})}`},
    {k: 'vfc', lab: 'VFC', word: 'VFC', c: NXC.hrv, ring: hrv ?? '–', p: hrv && hb ? clamp(hrv / hb.m * 70, 0, 100) : 0,
      body: () => `<span class="k">VARIABILITÉ CARDIAQUE · NUIT</span><div class="big">${hrv != null ? nxCnt(hrv) : '–'}<small> ms</small></div><div class="ttl">${hrv == null || !hb ? 'Base en calcul' : hrv >= hb.m * .95 ? 'Dans ta zone' : hrv >= hb.m * .85 ? 'Un peu basse' : 'Basse'}</div>
        <div class="grid"><div><b>${hb ? fx(hb.m) + ' ms' : '–'}</b><span>ta base 60 jours</span></div><div><b>${pct(hrv, hb?.m)}</b><span>par rapport à ta base</span></div><div><b>${hb ? fx(hb.m - hb.sd) + '–' + fx(hb.m + hb.sd) : '–'}</b><span>zone normale</span></div></div>
        ${nxLine(series('hrv', 14), {c: '#fff', h: 110, band: hb ? [hb.m - hb.sd, hb.m + hb.sd] : null})}<p class="tip">Plus elle est haute par rapport à ta base, mieux ton système nerveux a récupéré.</p>`},
    {k: 'fc', lab: 'FC repos', word: 'CŒUR', c: NXC.rhr, ring: rhr ?? '–', p: rhr && rb ? clamp(100 - (rhr - rb.m) * 8, 0, 100) : 0,
      body: () => `<span class="k">FRÉQUENCE CARDIAQUE AU REPOS</span><div class="big">${rhr != null ? nxCnt(rhr) : '–'}<small> bpm</small></div><div class="ttl">${rhr == null || !rb ? 'Base en calcul' : rhr <= rb.m + 2 ? 'Normale' : rhr <= rb.m + 5 ? 'Un peu haute' : 'Haute'}</div>
        <div class="grid"><div><b>${rb ? fx(rb.m) + ' bpm' : '–'}</b><span>ta base</span></div><div><b>${rhr != null && rb ? (rhr - rb.m > 0 ? '+' : '') + fx(rhr - rb.m) : '–'}</b><span>écart</span></div><div><b>${G(kG, 'hrMin') ?? '–'}</b><span>minimum de la nuit</span></div></div>
        ${nxLine(series('rhr', 14), {c: '#fff', h: 110})}<p class="tip">Une hausse de plus de 5 bpm sur plusieurs jours signale souvent fatigue, stress ou début de maladie.</p>`},
    {k: 'poids', lab: 'Poids', word: 'POIDS', c: NXC.weight, ring: wt != null ? fx(wt, 1) : '–', p: 70,
      body: () => `<span class="k">COMPOSITION · ${kW ? esc(fmtShort(kW).toUpperCase()) : ''}</span><div class="big">${wt != null ? nxCnt(wt, 1) : '–'}<small> kg</small></div><div class="ttl">Withings</div>
        <div class="grid"><div><b>${W(kW || TODAY, 'fatPct') != null ? fx(W(kW, 'fatPct'), 1) + ' %' : '–'}</b><span>masse grasse</span></div><div><b>${W(kW || TODAY, 'muscleKg') != null ? fx(W(kW, 'muscleKg'), 1) + ' kg' : '–'}</b><span>masse musculaire</span></div><div><b>${(() => { const s = series('weight', 30).map(p => p.v).filter(v => v != null); return s.length > 1 ? (s.at(-1) - s[0] > 0 ? '+' : '') + fx(s.at(-1) - s[0], 1) + ' kg' : '–'; })()}</b><span>sur 30 jours</span></div></div>
        ${nxLine(series('weight', 30), {c: '#fff', h: 110})}`},
    {k: 'corps', lab: 'Corps', word: 'CORPS', c: PN.length ? NXC.warn : NXC.good, ring: PN.length ? PN.length : '✓', p: PN.length ? 40 : 100,
      body: () => `<span class="k">DOULEURS ET COURBATURES · CHECK DU MATIN</span><div class="big">${PN.length || '0'}</div><div class="ttl">${PN.length ? 'Zone' + (PN.length > 1 ? 's' : '') + ' à ménager' : 'Rien à signaler'}</div>
        ${PN.map(([l, v]) => `<div class="ln"><span>${esc(l)}</span><span>${v} / 10</span></div>`).join('')}${sor ? `<div class="ln"><span>Courbatures</span><span>${['', 'très fortes', 'fortes', 'moyennes', 'légères', 'aucune'][sor]}</span></div>` : '<p class="tip">Remplis le check du matin pour voir ton état ici.</p>'}
        ${PN.some(([, v]) => v >= 6) ? '<p class="tip">Douleur à 6 ou plus : pas de vitesse maximale sur cette zone aujourd\'hui.</p>' : ''}`}];
};
let NXST = null;
function nxStories() { return `<div class="nx-stories">${NXS_DEF().map((s, i) => `<button class="nx-sto" data-nx="story" data-a="${i}" style="--c:${s.c};--p:${s.p}"><i><span>${esc(String(s.ring))}</span></i>${esc(s.lab)}</button>`).join('')}</div>`; }
function nxStory(i) {
  const L = NXS_DEF(); let el = $('#nx-story');
  if (!el) { el = document.createElement('div'); el.id = 'nx-story'; el.className = 'nx-story'; document.body.appendChild(el); }
  clearTimeout(NXST?.t);
  if (i < 0) i = 0; if (i >= L.length) return nxStoryClose();
  if (!NXST) { NXST = {}; try { history.pushState({mod: S.mod, nxst: 1}, ''); } catch (e) {} }
  const s = L[i]; NXST.i = i;
  el.style.setProperty('--c', s.c);
  el.innerHTML = `<div class="bars">${L.map((_, k) => `<i class="${k < i ? 'd' : k === i ? 'c' : ''}"><b></b></i>`).join('')}</div><button class="x" data-nx="story-x" aria-label="Fermer">${ic('x', 24)}</button><div class="bgw" aria-hidden="true">${s.word}</div><div class="ct">${s.body()}</div>`;
  el.hidden = false; requestAnimationFrame(() => el.classList.add('on')); nxCount(el); nxHap(5);
  NXST.t = setTimeout(() => nxStory(i + 1), 7000);
}
function nxStoryClose(fromBack) {
  const el = $('#nx-story'); if (!el || !NXST) return; clearTimeout(NXST.t); NXST = null;
  el.classList.remove('on'); setTimeout(() => { if (!NXST) el.hidden = true; }, 300);
  if (!fromBack && history.state?.nxst) { NX.skipPop = true; history.back(); }
}
addEventListener('popstate', () => { if (NXST) nxStoryClose(true); });
document.addEventListener('click', e => { const el = e.target.closest('#nx-story'); if (!el || !NXST || e.target.closest('[data-nx="story-x"]')) return; nxStory(NXST.i + (e.clientX < innerWidth / 3 ? -1 : 1)); });
addEventListener('keydown', e => { if (!NXST) return; if (e.key === 'Escape') nxStoryClose(); if (e.key === 'ArrowRight') nxStory(NXST.i + 1); if (e.key === 'ArrowLeft') nxStory(NXST.i - 1); });

/* ---------- AUJOURD'HUI ---------- */
nxToday = function () {
  const kG = lastKey('hrv'), rec = kG ? recovery(kG) : null, sc = rec?.score ?? null, z = zoneOf(sc), zc = NXC[z] || NXC.none;
  const hi = highDay(TODAY), tgt = effortTarget(sc, hi);
  const hero = `<section class="nx-card nx-hero2" style="--o:1;--zc:${zc}"><button class="nx-h2" data-nx="why" aria-label="Pourquoi ce score">
      <span class="nx-lab">Forme${kG && kG !== TODAY ? ' · ' + esc(fmtShort(kG)) : ''}</span><span class="nx-h2n"><b>${sc == null ? '–' : nxCnt(sc)}</b>${sc == null ? '' : '<small>%</small>'}<span class="nx-tag" style="--c:${zc}">${esc(ZONE[z])}</span></span>
      <p class="nx-say">${esc(tgt.text)}</p>${nxLine(series('recovery', 30), {c: zc, h: 70, lo: 0, hi: 100})}<span class="nx-more">30 derniers jours · pourquoi ce score ›</span></button></section>`;
  const C = nxCoach(rec, tgt, kG), nC = NX.open.coach ? C.length : 3, WHO = {T: NXC.T, N: NXC.N, R: NXC.R};
  const coach = `<section class="nx-card nx-coach" style="--o:5"><h3 class="nx-ct">À retenir<small>sans IA · tes règles et tes données</small></h3>
    ${C.slice(0, nC).map(x => `<div class="nx-tip ${x.z}"><i style="--c:${WHO[x.who] || NXC.none}">${x.who}</i><p>${esc(x.t)}${x.h ? `<span class="cact">${x.h}</span>` : ''}</p></div>`).join('') || '<p class="nx-empty">Rien à corriger : continue exactement comme ça.</p>'}
    ${C.length > 3 ? `<button class="nx-link" data-nx="open" data-a="coach">${NX.open.coach ? 'Moins' : 'Voir les ' + C.length + ' conseils'}</button>` : ''}</section>`;
  const AI = NX.ai ? AN()?.homeText : null;
  const h = new Date().getHours(), hello = (h < 5 ? 'Bonne nuit' : h < 18 ? 'Bonjour' : 'Bonsoir') + ' ' + (S.profile?.name || 'Oscar');
  return `<div class="nx-pg nx-today"><div class="nx-h"><p class="nx-eye">${esc(cap(fmtDay(TODAY)))}</p><h1>${esc(hello)}</h1></div>${nxStories()}<div class="nx-cols">
    <div class="nx-col c1">${hero}${nxCheckCard(2)}${nxFuel2(4)}</div>
    <div class="nx-col c2">${nxJour(sc, hi, tgt)}</div>
    <div class="nx-col c3">${coach}${AI ? `<section class="nx-card nx-aic" style="--o:6"><h3 class="nx-ct"><span class="nx-spk">${ic('spark', 16)}</span>Analyse de Claude</h3><p>${esc(AI)}</p><button class="nx-link" data-nx="ai">Poser une question ›</button></section>` : ''}</div></div></div>`;
};
// Carburant : totaux et gourdes. Les repas sont dans « Ta journée », à leur heure (sauf s'ils n'ont pas d'horaire).
function nxFuel2(order) {
  const h = nxFuelCard(order);
  return dayPlan(TODAY).some(x => x.c === 'alim') ? h.replace(/<div class="nx-meals">[\s\S]*?<\/div>\s*<div class="nx-water">/, '<div class="nx-water">') : h;
}
const nxSessKind = x => x.c === 'athle' ? 'track' : x.c === 'muscu' ? 'gym' : null;
function nxJour(sc, hi, tgt) {
  const now = nxNow(), all = !!NX.open.day, L = S.live;
  const rows = dayPlan(TODAY).filter(x => x.c !== 'quest' && !(x.c === 'sommeil' && x.a === '00:00'));
  const hasS = kd => !!(planForK(TODAY, kd) || kindDone(TODAY, kd));
  let from = 0; if (!all) { const i = rows.findIndex(x => tmin(x.b) > now); from = i < 0 ? rows.length : i; }
  const shown = rows.filter((x, i) => i >= from || (nxSessKind(x) && hasS(nxSessKind(x))));
  let top = '';
  if (L) { const c = nxLiveCount(L), min = Math.max(0, Math.floor((Date.now() - new Date(L.start)) / 60000));
    top += `<section class="nx-card nx-sess live" style="--k:${NXC[nxKind(L)]}"><div class="nx-sess-top"><span class="nx-kind"><i class="nx-live-dot"></i>En cours · ${min} min</span><span class="nx-sess-min">${c.d}/${c.n}</span></div><h2>${esc(L.name)}</h2><div class="nx-bar"><i style="width:${c.n ? c.d / c.n * 100 : 0}%"></i></div><div class="nx-row"><button class="nx-btn nx-go" data-nx="live">${ic('play', 18)} Reprendre</button></div></section>`; }
  // Une séance calée sans créneau horaire va en tête ; un jour sans séance affiche la carte « repos ».
  for (const kd of ['track', 'gym']) if (hasS(kd) && !(L && nxKind(L) === kd) && !rows.some(x => nxSessKind(x) === kd)) top += nxSessBlock(kd, sc, hi, tgt);
  if (!L && !hasS('track') && !hasS('gym')) top += nxSessCards(0, sc, hi, tgt);
  const row = x => {
    const a = tmin(x.a), b = tmin(x.b), on = a <= now && b > now, past = b <= now, col = PCAT[x.c]?.[1] || '#888', kd = nxSessKind(x);
    const when = past ? '' : on ? 'en cours' : nxSpan(a - now);
    let body;
    if (kd && L && nxKind(L) === kd) body = `<b>${esc(L.name)}</b><small>en cours</small>`;
    else if (kd && hasS(kd)) return `<div class="nx-t3 sess${past ? ' past' : ''}" style="--c:${col}"><span class="t"><b>${tfr(x.a)}</b>${when ? `<small>${when}</small>` : ''}</span><i class="d"></i><div class="b">${nxSessBlock(kd, sc, hi, tgt)}</div></div>`;
    else if (x.c === 'alim') { const m = plMeal(x), its = (fday(TODAY).items || []).filter(it => it.meal === m), kc = its.reduce((s, it) => s + (it.kcal || 0), 0);
      body = `<button class="nx-t3m" data-nx="meal" data-a="${m}"><b>${esc(plName(x.n))}</b><small>${its.length ? esc(its.map(it => it.n).slice(0, 3).join(', ')) + (its.length > 3 ? '…' : '') + ' · ' + fx(kc) + ' kcal' : 'rien noté'}</small></button><button class="nx-ib nx-plus" data-nx="food" data-a="${m}" aria-label="Ajouter à ${esc(plName(x.n))}">${ic('plus', 18)}</button>`; }
    else { const sub = [kd ? 'créneau libre' : PCAT[x.c]?.[0] !== plName(x.n) ? PCAT[x.c]?.[0] : '', x.dest, x.trip].filter(Boolean).join(' · ');
      body = `<span class="nx-t3n"><b>${esc(plName(x.n))}</b>${sub ? `<small>${esc(sub)}</small>` : ''}</span>${kd ? `<button class="nx-chip" data-nx="cale" data-a="${TODAY}">Caler</button>` : ''}`; }
    return `<div class="nx-t3${on ? ' now' : ''}${past ? ' past' : ''}" style="--c:${col}${on ? ';--p:' + Math.round((now - a) / Math.max(1, b - a) * 100) + '%' : ''}"><span class="t"><b>${tfr(x.a)}</b>${when ? `<small>${when}</small>` : ''}</span><i class="d"></i><div class="b">${body}</div></div>`;
  };
  let nowDone = false;
  const tl = shown.map((x, i) => { let s = '';
    if (all && !nowDone && tmin(x.a) > now) { nowDone = true; s += `<div class="nx-now"><span>${tfr(String(Math.floor(now / 60)).padStart(2, '0') + ':' + String(now % 60).padStart(2, '0'))}</span></div>`; }
    s += row(x); if (i < shown.length - 1) s += `<div class="nx-ins"><button data-nx="ins" data-a="${x.b}" aria-label="Ajouter quelque chose après ${tfr(x.b)}">${ic('plus', 14)}</button></div>`; return s; }).join('');
  return `<section class="nx-card nx-dayc" style="--o:3"><h3 class="nx-ct">Ta journée<small>${all ? 'toute la journée' : 'à partir de maintenant'} · + pour ajouter entre deux blocs</small></h3>${top}
    <div class="nx-t3s">${tl || '<p class="nx-empty">Plus rien de prévu : place au calme et au sommeil.</p>'}</div><button class="nx-link" data-nx="open" data-a="day">${all ? 'Seulement la suite' : 'Toute la journée'}</button></section>`;
}
function nxSessBlock(kd, sc, hi, tgt) {
  const p = planForK(TODAY, kd), lg = logsOn(TODAY).find(l => l.kind === kd);
  return kindDone(TODAY, kd) ? nxDoneCard(0, kd, p, lg) : p ? nxPlanCard(0, kd, p, sc, hi, tgt) : '';
}
function nxInsSheet(t) {
  const meals = MEALS.map(([m]) => [m, mealLab(m)]);
  nxOpen({id: 'ins', title: 'Ajouter vers ' + tfr(t), render: () => `<p class="nx-sub">Ce que tu veux glisser dans ta journée :</p>
    <div class="nx-insl"><button data-nx="ins-go" data-a="cale" data-b="${TODAY}">${ic('bolt', 20)}<span><b>Une séance</b><small>de ton programme, de tes séances ou nouvelle</small></span></button>
    ${meals.map(([m, l]) => `<button data-nx="ins-go" data-a="food" data-b="${m}">${ic('fork', 20)}<span><b>${esc(l)}</b><small>ajouter un aliment</small></span></button>`).join('')}
    <button data-nx="ins-go" data-a="note" data-b="">${ic('edit', 20)}<span><b>Une note, une sieste, un soin</b><small>questionnaire du jour</small></span></button>
    <button data-nx="ins-go" data-a="eng" data-b="planning">${ic('clock', 20)}<span><b>Un nouveau créneau</b><small>dans tes horaires</small></span></button></div>`});
}
Object.assign(NXA, {
  story: b => nxStory(+b.dataset.a), 'story-x': () => nxStoryClose(),
  ins: b => nxInsSheet(b.dataset.a),
  'ins-go': b => { const a = b.dataset.a, v = b.dataset.b; nxClose(); setTimeout(() => NXA[a]?.({dataset: {a: v}}), 260); },
  qual: b => nxQualSheet(+b.dataset.a), 'q-add': b => nxQualAdd(+b.dataset.a, +b.dataset.b)
});

/* ---------- SEMAINE : la piste des mètres de sprint ---------- */
const nxWeek0 = nxWeek;
nxWeek = function () {
  let h = nxWeek0();
  const mon = addDays(monday(TODAY), 7 * NX.wk), days = [...Array(7)].map((_, i) => addDays(mon, i));
  const plan = days.reduce((s, k) => s + nxSprintM(planForK(k, 'track')), 0), done = days.reduce((s, k) => s + (VAL.sprint(k) || 0), 0);
  // La piste remplace les deux chiffres « sprint » et « effort » (l'effort est dans la jauge de Progrès).
  h = h.replace(/<div class="nx-ws"><b[^>]*>[^<]*<\/b><span>sprint fait[^<]*<\/span><\/div>/, '').replace(/<div class="nx-ws"><b[^>]*>[^<]*<\/b><span>effort moyen[^<]*<\/span><\/div>/, '');
  const goal = Math.max(plan, done, 1), P = 'M90 30 H310 A70 70 0 0 1 310 170 H90 A70 70 0 0 1 90 30', Lp = 2 * 220 + 2 * Math.PI * 70;
  const track = `<section class="nx-card nx-trk" style="--o:3"><h3 class="nx-ct">Mètres de sprint<small>faits / prévus cette semaine</small></h3><div class="nx-trk-v"><b>${nxCnt(done)}</b><span>/ ${fx(plan)} m</span></div>
    <svg viewBox="0 0 400 200" aria-hidden="true"><path d="${P}" fill="none" class="lane" stroke-width="36"/>${[0, 1, 2, 3, 4].map(i => `<path d="M90 ${12 + i * 9} H310 A${88 - i * 9} ${88 - i * 9} 0 0 1 310 ${188 - i * 9} H90 A${88 - i * 9} ${88 - i * 9} 0 0 1 90 ${12 + i * 9}" fill="none" stroke="rgba(255,255,255,.18)" stroke-width="1"/>`).join('')}
    <path d="${P}" fill="none" class="prog" stroke-width="6" stroke-linecap="round" style="--L:${Lp.toFixed(0)};--o:${(Lp * (1 - Math.min(1, done / goal))).toFixed(0)}"/><circle class="run" r="6.5" style="offset-path:path('${P}')"/></svg></section>`;
  return h.replace('<div class="nx-col c2">', '<div class="nx-col c2">' + track);
};

/* ---------- SÉANCES : les qualités physiques ---------- */
// Chaque qualité → les exercices qui la travaillent, avec le dosage qui la développe (séries × répétitions, intensité, récup).
const NX_QUAL = [
  {n: 'Vitesse maximale', s: 'Atteindre et tenir ta vitesse de pointe', k: 'track', svg: '<path d="M10 30h34M18 46h40M6 62h26"/><path d="M60 22l24 24-24 24"/>',
    x: [['fly', {reps: 4, dist: 30, pct: 100, rest: 420}, 'Lancé sur 20 m, puis 30 m à fond'], ['wickets', {reps: 4, dist: 30, pct: 95, rest: 240}, 'Fréquence et pied actif'], ['strides', {reps: 4, dist: 80, pct: 85, rest: 120}, 'Relâchement, en fin d\'échauffement']]},
  {n: 'Accélération', s: 'Les 30 premiers mètres', k: 'track', svg: '<path d="M8 80C34 78 54 58 64 18"/><path d="M52 22l12-6 4 13"/>',
    x: [['start3', {reps: 6, dist: 20, pct: 100, rest: 180}, 'Pousser loin derrière'], ['blocks', {reps: 5, dist: 30, pct: 100, rest: 240}, 'Au signal'], ['sled', {reps: 5, dist: 20, pct: 100, rest: 180}, 'Charge qui ralentit de 10 à 30 %'], ['hill', {reps: 6, dist: 30, pct: 95, rest: 180}, 'Côte de 5 à 10 %']]},
  {n: 'Endurance de vitesse', s: 'Tenir la vitesse en fin de course', k: 'track', svg: '<path d="M6 46c12-22 24 22 36 0s24 22 36 0"/><path d="M6 68c12-22 24 22 36 0s24 22 36 0" opacity=".45"/>',
    x: [['speedend', {reps: 3, dist: 150, pct: 95, rest: 600}, 'Relâché sur la fin'], ['tempo', {reps: 8, dist: 100, pct: 70, rest: 60}, 'Base aérobie, jour léger']]},
  {n: 'Force maximale', s: 'Lourd, peu de répétitions', k: 'gym', svg: '<path d="M12 48h68M20 32v32M28 26v44M64 26v44M72 32v32"/>',
    x: [['squat', {sets: 4, reps: 3, pct: 87, rest: 240}, 'Descente contrôlée'], ['hbdl', {sets: 4, reps: 3, pct: 85, rest: 240}, ''], ['rdl', {sets: 4, reps: 5, pct: 80, rest: 180}, 'Ischios en tension'], ['hipthrust', {sets: 4, reps: 6, pct: 85, rest: 150}, '1 s en haut'], ['bss', {sets: 3, reps: 5, pct: 80, rest: 150}, 'Par jambe']]},
  {n: 'Puissance', s: 'De la force produite vite', k: 'gym', svg: '<path d="M52 8 24 52h20l-6 34 30-46H48z"/>',
    x: [['pclean', {sets: 5, reps: 3, pct: 75, rest: 180}, 'Vitesse avant la charge'], ['jsquat', {sets: 4, reps: 5, pct: 30, rest: 150}, 'Sauter le plus haut possible'], ['medball', {sets: 4, reps: 4, rest: 90}, 'Lancer explosif vers l\'avant'], ['boxjump', {sets: 4, reps: 4, rest: 120}, 'Atterrissage silencieux']]},
  {n: 'Réactivité', s: 'Pliométrie, contacts courts', k: 'gym', svg: '<path d="M6 74q12-46 24 0q12-36 24 0q12-26 24 0"/>',
    x: [['pogo', {sets: 3, reps: 20, rest: 60}, 'Chevilles raides'], ['dropjump', {sets: 4, reps: 5, rest: 120}, 'Le sol est brûlant'], ['hurdlehop', {sets: 4, reps: 5, rest: 120}, 'Enchaîné, sans temps mort'], ['bounds', {sets: 4, reps: 6, rest: 150}, 'Grands bonds, bassin haut']]},
  {n: 'Tronc', s: 'Transmettre la force sans fuite', k: 'gym', svg: '<path d="M10 58h56"/><circle cx="76" cy="52" r="7"/><path d="M16 58v14M60 58v14"/>',
    x: [['plank', {sets: 3, reps: 45, rest: 45}, 'En secondes'], ['pallof', {sets: 3, reps: 10, rest: 60}, 'Ne pas tourner'], ['deadbug', {sets: 3, reps: 10, rest: 45}, 'Bas du dos collé'], ['farmer', {sets: 3, reps: 30, rest: 60}, 'En secondes, épaules basses']]},
  {n: 'Robustesse', s: 'Prévenir les blessures du sprinteur', k: 'gym', svg: '<path d="M46 8l30 12v22c0 20-14 34-30 40C30 76 16 62 16 42V20z"/><path d="M34 44l9 9 17-19"/>',
    x: [['nordic', {sets: 3, reps: 5, rest: 120}, 'Ischios · le n°1 contre les déchirures'], ['copen', {sets: 3, reps: 6, rest: 60}, 'Adducteurs'], ['calf', {sets: 3, reps: 12, rest: 60}, 'Mollets et tendon d\'Achille'], ['tib', {sets: 3, reps: 15, rest: 45}, 'Tibias']]}];
const nxQDose = (k, d) => k === 'track' ? `${d.reps} × ${d.dist} m${d.pct ? ' · ' + d.pct + ' %' : ''} · récup ${nxRest(d.rest)}` : `${d.sets} × ${d.reps}${d.pct ? ' · ' + d.pct + ' %' : ''} · récup ${nxRest(d.rest)}`;
function nxQualSheet(qi) {
  const q = NX_QUAL[qi];
  nxOpen({id: 'qual', title: q.n, render: () => `<p class="nx-sub">${esc(q.s)}. Ici c'est le dosage qui fait la qualité : séries, répétitions, intensité et récupération.</p>
    <div class="nx-ql">${q.x.map(([id, d, tip], j) => `<div class="nx-qx" style="--c:${NXC[q.k]}"><span><b>${esc(exOf(id).n)}</b><small>${esc(nxQDose(q.k, d))}${tip ? ' · ' + esc(tip) : ''}</small></span><button class="nx-ib nx-plus" data-nx="q-add" data-a="${qi}" data-b="${j}" aria-label="Ajouter ${esc(exOf(id).n)} à une séance">${ic('plus', 18)}</button></div>`).join('')}</div>
    <p class="nx-cap">Touche + : l'exercice part dans une nouvelle séance (ou dans celle que tu es en train de créer), avec ce dosage. Tu ajustes ensuite.</p>`});
}
function nxQualAdd(qi, j) {
  const q = NX_QUAL[qi], [id, d] = q.x[j], it = Object.assign(nxSmartItem(id, q.k), d);
  const into = () => { if (!NX.ed) return; NX.ed.kind = NX.ed.items.length ? NX.ed.kind : q.k; NX.ed.items.push(it); NX.ed.dirty = true; nxShDraw(NX.sh.find(s => s.id === 'ed')); toast(exOf(id).n + ' ajouté'); };
  if (NX.ed) { into(); return; }
  nxClose(); setTimeout(() => { nxEdOpen(null); into(); }, 320);
}
const nxLib0 = nxLib;
nxLib = function () {
  const segs = [['mine', 'Mes séances'], ['q', 'Qualités'], ['models', 'Modèles'], ['done', 'Historique']];
  const bar = `<div class="nx-seg nx-seg4">${segs.map(([v, n]) => `<button class="${NX.lib.seg === v ? 'on' : ''}" data-nx="libseg" data-a="${v}">${n}</button>`).join('')}</div>`;
  if (NX.lib.seg !== 'q') return nxLib0().replace(/<div class="nx-seg">[\s\S]*?<\/div>/, bar);
  return `<div class="nx-pg nx-libp"><div class="nx-h nx-h-row"><div><p class="nx-eye">Ton atelier de coach</p><h1>Séances</h1></div><button class="nx-btn nx-create" data-nx="new">${ic('plus', 20)} Créer</button></div>${bar}
    <p class="nx-sub nx-pad">Choisis la qualité à développer : tu as les exercices qui la travaillent et le dosage qui va avec.</p>
    <div class="nx-qg">${NX_QUAL.map((q, i) => `<button class="nx-qt" data-nx="qual" data-a="${i}" style="--c:${NXC[q.k]};--i:${i}"><svg viewBox="0 0 92 92" aria-hidden="true">${q.svg}</svg><b>${esc(q.n)}</b><small>${esc(q.s)}</small><em>${q.k === 'track' ? 'Piste' : 'Muscu'} · ${q.x.length} exercices</em></button>`).join('')}</div></div>`;
};

/* ---------- PROGRÈS : régularité + jauge de charge ---------- */
function nxStreak() {
  const has = k => { const w = M(k, 'well'); return !!(w && Object.values(w).some(v => v)); };
  let d = 0, k = has(TODAY) ? TODAY : addDays(TODAY, -1); while (has(k) && d < 999) { d++; k = addDays(k, -1); }
  const wk = []; let mon = addDays(monday(TODAY), -7);
  for (let i = 0; i < 8; i++) { const days = [...Array(7)].map((_, j) => addDays(mon, j)), due = days.reduce((s, x) => s + ['track', 'gym'].filter(kd => planForK(x, kd)).length, 0), dn = days.reduce((s, x) => s + ['track', 'gym'].filter(kd => kindDone(x, kd)).length, 0);
    wk.unshift(due ? dn >= due : null); mon = addDays(mon, -7); }
  let full = 0; for (let i = wk.length - 1; i >= 0 && wk[i]; i--) full++;
  return {d, wk, full};
}
const nxProg0 = nxProg;
nxProg = function () {
  let h = nxProg0();
  const e7 = avgN('effort', 7), e28 = avgN('effort', 28), r = e7 != null && e28 ? e7 / e28 : null, x = r == null ? null : clamp((r - .5) / 1.1 * 100, 0, 100);
  const gauge = r == null ? '' : `<div class="nx-gauge"><i style="--x:${x.toFixed(1)}%"></i></div><div class="nx-gl"><span>Récup</span><span>Optimal</span><span>Trop</span></div>`;
  h = h.replace(/(data-a="effort"[\s\S]*?<\/button>)/, '$1' + gauge);
  const st = nxStreak(), rec7 = series('recovery', 7).map(p => p.v).filter(v => v != null), f7 = rec7.length ? mean(rec7) : null;
  const status = r == null ? 'En calcul' : r > 1.3 ? 'Surcharge' : r < .8 ? (f7 != null && f7 >= 67 ? 'Récupération' : 'Désentraînement') : f7 != null && f7 < 50 ? 'Tendu' : 'Productif';
  const reg = `<section class="nx-card nx-reg" style="--o:0"><div class="nx-reg-f">${NX_FLAME}</div><div class="nx-reg-t"><b>${st.d} jour${st.d > 1 ? 's' : ''}</b><span>de check du matin d'affilée</span>
    <div class="nx-reg-w" aria-label="8 dernières semaines">${st.wk.map(v => `<i class="${v ? 'on' : v === false ? 'off' : ''}"></i>`).join('')}</div><small>${st.full ? st.full + ' semaine' + (st.full > 1 ? 's' : '') + ' complète' + (st.full > 1 ? 's' : '') + ' de suite' : 'Semaines où toutes les séances prévues sont faites'}</small></div>
    <div class="nx-reg-s"><small>Statut</small><b>${status}</b></div></section>`;
  return h.replace('<h3 class="nx-sec">Ton corps', reg + '<h3 class="nx-sec">Ton corps');
};
const NX_FLAME = '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c4 0 7-3 7-7 0-5-5-7-5-12-3 2-4 5-4 7-1-1-2-2-2-4-2 2-3 5-3 9 0 4 3 7 7 7z"/></svg>';

/* ---------- l'en-tête : TNR Test, bouton Claude ---------- */
(function nxPlusChrome(n = 0) {
  if (!$('#nx')) { if (n < 100) setTimeout(() => nxPlusChrome(n + 1), 50); return; }
  document.querySelectorAll('#nx .nx-logo span').forEach(s => s.textContent = 'Test');
  document.querySelectorAll('#nx .nx-aib span').forEach(s => s.textContent = 'Claude');
  const sa = $('.nx-side-ai span'); if (sa) sa.textContent = 'Demander à Claude';
  const nt = $('.nx-side-note'); if (nt) nt.textContent = 'TNR Test : lit ton compte, garde tes essais sur cet appareil.';
  const st = $('.nx-side-set span'); if (st) st.textContent = 'Réglages';
})();
