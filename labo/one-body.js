/* ================= Le corps anatomique en 3 couches, dans Training, Recovery et Nutrition =================
   · Training · Mon corps : les vrais muscles, colorés par leur charge. Un bouton en haut : Superficiels ou Profonds
     (Profonds = les muscles du milieu et les plus profonds ; les superficiels restent en ombre pour garder les repères).
     1re touche : le groupe (ex. Ischio-jambiers) ; 2e touche sur le même groupe : le muscle précis (ex. Semi-tendineux).
   · Recovery (douleurs) : le même corps, muscles grisés ; on touche toujours les mêmes endroits qu'avant (les zones
     de douleur ne sont pas toutes des muscles : genou, cheville, dos…).
   · Nutrition · Mon corps : le même corps en simple forme, avec les taches de couleur des segments ; masse musculaire
     à gauche, masse grasse à droite. */
// Le muscle du corps → le muscle suivi par l'appli (charge, limites).
function b3Key(g, sub) {
  const t = String(sub).toLowerCase(), R = [[/dentelé/, 'serr'], [/moyen fessier|petit fessier/, 'gmed'], [/piriforme|jumeaux et obt|obturateur|carré fémoral/, 'piri'], [/soléaire|tibial postérieur|long fléchisseur de|long fléchisseur des orteils/, 'soleus'],
    [/transverse/, 'transv'], [/carré des lombes/, 'ql'], [/psoas|iliaque/, 'psoas'], [/tibial antérieur|extenseur.*(orteils|hallux)/, 'tib'], [/sus-épineux|infra-épineux|petit rond|sous-scapulaire/, 'rotat'],
    [/rhombo|élévateur/, 'rhomb'], [/oblique/, 'obl'], [/grand droit|bas-ventre/, 'abs'], [/érecteur|multifide|épineux de la tête|splénius/, 'erect'], [/trapèze/, 'traps'], [/grand dorsal|grand rond/, 'lats'],
    [/deltoïde/, 'shoul'], [/pectoral|subclavier/, 'pecs'], [/^biceps$|brachial|coraco/, 'bi'], [/triceps/, 'tri'], [/biceps fémoral|semi-|ischio/, 'hams'], [/jumeau|poplité/, 'calves'],
    [/fléchisseur|extenseur|brachio-radial|pronateur|supinateur|abducteur du pouce/, 'forearm'], [/vaste|droit fémoral/, 'quads'], [/adducteur|gracile|pectiné/, 'adduct'], [/grand fessier/, 'glutes']];
  for (const [re, k] of R) if (re.test(t)) return k;
  return {pecs: 'pecs', delts: 'shoul', traps: 'traps', lats: 'lats', lowb: 'erect', biceps: 'bi', triceps: 'tri', fore: 'forearm', abs: 'abs', obl: 'obl', glutes: 'glutes', quads: 'quads', add: 'adduct',
    hams: 'hams', calves: 'calves', tib: 'tib', rot: 'rotat', rhomb: 'rhomb', arm: 'bi', hip: 'psoas', hiprot: 'piri'}[g] || null;
}
const B3VB = {front: [94, 84, 540, 1268], back: [813.5, 84, 540, 1268]};
const B3C = {skin: '#2f3036', ghost: '#25262b', line: '#141416'};
// Le corps dessiné, en coordonnées d'origine. paint(key, sub) → {fill, cls} pour chaque muscle ; layer : 'm' (superficiels), 'deep' (moyens et profonds), 'shape' (la forme seule).
function b3Inner(view, layer, paint) {
  const B = B3D[view], mir = `transform="translate(${2 * B.cx} 0) scale(-1 1)"`, hd = `transform="translate(${B.dx} 0)"`, nm = view === 'front' ? ['droit', 'gauche'] : ['gauche', 'droit'];
  const all = [...B.s, ...B.m.map(x => x[2])].map(d => `<path d="${d}"/>`).join(''), head = B.c.map(d => `<path d="${d}"/>`).join('');
  const skin = [...B.s, ...B.x].map(d => `<path d="${d}" fill="${B3C.skin}"/>`).join('');
  const mus = (list, k) => list.map(([g, sub, d]) => { const key = b3Key(g, sub), p = paint ? paint(key, sub, g) : null;
    return `<path d="${d}" class="m3${p?.cls ? ' ' + p.cls : ''}" ${key ? `data-mz3="${key}"` : ''} data-sub="${esc(sub)}" data-side="${nm[k]}" fill="${p?.fill || B3C.skin}"/>`; }).join('');
  const half = k => layer === 'shape' ? skin + B.m.map(x => `<path d="${x[2]}" fill="${B3C.skin}"/>`).join('')
    : skin + (layer === 'deep' ? B.m.map(x => `<path d="${x[2]}" fill="${B3C.ghost}"/>`).join('') + mus([...B.i, ...B.d], k) : mus(B.m, k));
  const top = B.hair ? `<g ${hd}><g fill="${B3C.skin}" stroke="${B3C.skin}">${head}</g><path d="${B.hair}" fill="#26272d" stroke="${B3C.line}" stroke-width="3"/></g>` : `<g ${hd} fill="${B3C.skin}">${head}</g>`;
  return `<g stroke="${B3C.line}" stroke-width="3.2" stroke-linejoin="round"><g fill="${B3C.skin}" stroke="${B3C.skin}" stroke-width="12">${all}<g ${mir}>${all}</g><g ${hd}>${head}</g></g>${top}${half(0)}<g ${mir}>${half(1)}</g></g>`;
}
function b3Svg(view, layer, paint, cls = '') {
  return `<svg class="b3 ${cls}" viewBox="${B3VB[view].join(' ')}" role="img" aria-label="${view === 'front' ? 'Face' : 'Dos'}">${b3Inner(view, layer, paint)}</svg>`;
}
// Le même corps posé dans l'ancien repère 200 × 392 (là où étaient placées les zones de douleur et les taches des segments).
const B3FIT = {front: null, back: null};
function b3Fit(view) {
  if (B3FIT[view]) return B3FIT[view];
  // La silhouette d'origine : de la tête (y 6) aux pieds (y 383), centrée sur x 100 ; on cale le nouveau corps sur la même hauteur.
  const B = B3D[view], top = 96, bot = 1341, s = (383 - 6) / (bot - top), cx = B.cx;
  return (B3FIT[view] = `translate(${100 - cx * s} ${6 - top * s}) scale(${s})`);
}
const b3In200 = (view, layer, paint) => `<g transform="${b3Fit(view)}">${b3Inner(view, layer, paint)}</g>`;

/* ---------- Training · Mon corps ---------- */
const MZONE_C = {good: '#30D158', mid: '#FFD60A', bad: '#FF453A'};
musFigure = function (view, per, sel) {
  const lay = S.mlay === 'deep' ? 'deep' : 'm', sub = S.msub || '';
  const paint = key => { if (!key || !per[key]) return {fill: '#3a3b42'}; const x = per[key];
    const f = x.load ? MZONE_C[musZone(x.pct)] : '#4a4d57', on = sel === key && (!sub || true);
    return {fill: f, cls: sel ? (on ? 'on' : 'off') : (x.load ? '' : 'idle')}; };
  let svg = b3Svg(view, lay, paint, sel ? 'dim' : '');
  if (sel && sub) svg = svg.replace(/class="m3 on"([^>]*data-sub="([^"]*)")/g, (m, rest, sb) => sb === sub ? `class="m3 on pick"${rest}` : `class="m3 on soft"${rest}`);
  return `<figure style="margin:0">${svg}<figcaption>${view === 'front' ? 'Face' : 'Dos'}</figcaption></figure>`;
};
const oneBodyCard1 = bodyCard;
bodyCard = () => {
  let h = oneBodyCard1(); if (!h) return h;
  const lay = S.mlay === 'deep' ? 'deep' : 'm';
  h = h.replace('<div class="mbody">', `<div class="seg b3seg" role="group" aria-label="Couche">${[['m', 'Superficiels'], ['deep', 'Profonds']].map(([v, l]) => `<button type="button" data-mlay="${v}" aria-pressed="${lay === v}">${l}</button>`).join('')}</div><div class="mbody">`);
  // Le muscle précis touché, au-dessus du groupe.
  if (S.msel && S.msub) h = h.replace(`<b>${esc(MUSI[S.msel].n)}</b>`, `<b>${esc(S.msub)}</b> · ${esc(MUSI[S.msel].n)}`);
  return h;
};
document.addEventListener('click', e => {
  const l = e.target.closest('[data-mlay]'); if (l) { S.mlay = l.dataset.mlay; S.msub = ''; renderMod(true); return; }
  const m = e.target.closest('svg.b3 [data-mz3]'); if (!m || !m.closest('#t-view, .tab-ghost')) return;
  e.stopPropagation();
  // 1re touche : le groupe ; 2e touche sur le même groupe : le muscle précis ; encore : le groupe ; ailleurs : on ferme.
  const k = m.dataset.mz3, sub = m.dataset.sub;
  if (S.msel === k && S.msub !== sub) S.msub = sub; else if (S.msel === k && S.msub === sub) S.msub = ''; else { S.msel = k; S.msub = ''; }
  renderMod(true);
}, true);
document.addEventListener('click', e => { if (S.mod === 'T' && S.msel && e.target.closest('.mbody') && !e.target.closest('[data-mz3]')) { S.msel = null; S.msub = ''; renderMod(true); } });

/* ---------- Recovery : douleurs ---------- */
// Le corps grisé sous les zones qu'on touche (les mêmes qu'avant : tendons, articulations, dos…).
const oneBodySvg0 = bodySvg;
bodySvg = function (view) {
  const h = oneBodySvg0(view);
  return h.replace(/<path class="silp"[^>]*\/>/, `${b3In200(view, 'shape')}`).replace(/<g fill="none" stroke="#000" stroke-opacity=".28" stroke-width="1">[\s\S]*?<\/g>/, '');
};

/* ---------- Nutrition · Mon corps : masse musculaire à gauche, masse grasse à droite ---------- */
fBody = function () {
  const P = periodOf(S.gran, S.off), day = S.gran === 'day';
  const head = `<header class="top tophead"><div><div class="sub">Segment par segment · ta Withings Body Scan</div><h1>Mon corps</h1></div></header>${granSeg()}<div class="card" style="margin-top:10px;padding:8px 12px">${periodNav(P)}</div>`;
  const D = {}; for (const m of ['mm', 'fm']) { D[m] = []; for (let k = P.from; k <= P.to && k <= TODAY; k = addDays(k, 1)) { const sg = W(k, 'seg'); if (sg?.[m]) D[m].push({k, sg: sg[m]}); } }
  if (!D.mm.length && !D.fm.length) { const any = Object.values(S.w || {}).some(d => d?.seg);
    return head + `<div class="card empty" style="margin-top:12px"><b>${any ? 'Pas de pesée sur cette période' : 'Tes segments arrivent avec la prochaine pesée'}</b>${any ? 'Change de période, ou monte sur ta balance demain matin.' : 'Ta Body Scan mesure la masse grasse et la masse musculaire de chaque bras, de chaque jambe et du tronc.'}</div>`; }
  const one = m => { const days = D[m], [lab, col] = SEGM[m]; if (!days.length) return null;
    const first = days[0], last = days.at(-1);
    const val = id => { if (day) return last.sg[id] ?? null; const v = days.map(d => d.sg[id]).filter(x => x != null); return v.length ? mean(v) : null; };
    const V = Object.fromEntries(SEGS.map(([id]) => [id, val(id)])), tot = Object.values(V).reduce((a, x) => a + (x || 0), 0);
    const dens = id => V[id] == null || !tot ? null : V[id] / tot / SEG_REF[id];
    const ell = SEGS.map(([id, n, cx, cy, rx, ry]) => { const d = dens(id); if (d == null) return ''; return `<ellipse cx="${cx}" cy="${cy}" rx="${rx + 4}" ry="${ry}" fill="${col}" opacity="${(.22 + clamp((d - .8) / .4, 0, 1) * .73).toFixed(2)}" filter="url(#soft${m}n)"/>`; }).join('');
    const delta = id => { const a = first.sg[id], b = last.sg[id]; return a != null && b != null && days.length > 1 ? b - a : null; };
    return {m, lab, col, tot, V, delta, days, last,
      fig: `<div><div class="lab" style="color:${col}">${m === 'mm' ? 'MASSE MUSCULAIRE' : 'MASSE GRASSE'}</div><svg viewBox="0 0 200 392" role="img" aria-label="${lab}"><defs><filter id="soft${m}n" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="5"/></filter><mask id="mk${m}n">${b3In200('front', 'shape').replace(/fill="[^"]*"/g, 'fill="#fff"').replace(/stroke="[^"]*"/g, 'stroke="#fff"')}</mask></defs>${b3In200('front', 'shape')}<g mask="url(#mk${m}n)" pointer-events="none">${ell}</g></svg><b class="num" style="display:block;margin-top:4px">${fx(tot, 1)} kg</b></div>`};
  };
  const A = one('mm'), B = one('fm');
  const dTxt = (d, good) => d == null ? '' : `<small class="${(good ? d >= 0 : d <= 0) ? 'up' : 'down'}">${d >= 0 ? '+' : '−'}${fx(Math.abs(d), 2)} kg</small>`;
  const block = X => X ? `<div class="card pc6"><div class="chead" style="margin-bottom:6px"><span class="eyebrow" style="color:${X.col}">${X.lab} · ${day ? esc(cap(fmtShort(X.last.k))) : 'moyenne de ' + X.days.length + ' pesée' + (X.days.length > 1 ? 's' : '')}</span><b class="num nowrap">${fx(X.tot, 1)} kg</b></div>
    <div class="list segl3">${SEGS.map(([id, n]) => X.V[id] != null ? `<div class="row"><span class="l">${n}</span><b class="num">${fx(X.V[id], 2)} kg ${dTxt(X.delta(id), X.m === 'mm')}</b></div>` : '').join('')}</div></div>` : '';
  const sym = (a, b) => a && b ? Math.abs(a - b) / ((a + b) / 2) * 100 : null;
  const sA = A && sym(A.V.ra, A.V.la), sL = A && sym(A.V.rl, A.V.ll);
  return head + `<div class="stack" style="margin-top:12px">
    <div class="card pc6"><div class="one-2body b3n">${A ? A.fig : '<div></div>'}${B ? B.fig : '<div></div>'}</div>
      <div class="segleg"><span>moins dense</span><i style="background:linear-gradient(90deg,#ffffff22,#ffffffcc)"></i><span>plus dense</span></div>
      <p class="small muted" style="margin:8px 0 0">Couleur : la part de chaque segment dans ton total, comparée à la part habituelle de ce segment. Écart gauche / droite (muscle) : bras ${sA != null ? fx(sA, 1) + ' %' : '–'}, jambes ${sL != null ? fx(sL, 1) + ' %' : '–'} ; au-delà de 10 % sur les jambes, un déséquilibre de force est probable.</p></div>
    ${block(A)}${block(B)}</div>`;
};
