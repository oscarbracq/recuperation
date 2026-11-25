/* ================= Max haltérophilie : la table de Baroga =================
   Ratios repris tels quels du fichier « Table BAROGA Bilan.Haltérophilie » (cours d'haltérophilie de Romain, table
   d'évaluation de Baroga, version de Florin Nicolae, E.T.R. Bourgogne). Chaque mouvement vaut un pourcentage du total
   olympique (arraché + épaulé-jeté). Écart : « − » sous 95 % de l'attendu, « + » au-dessus de 106 %, sinon « = ».
   La colonne « 80 % » du fichier est la charge de travail à 80 % de l'attendu. */
const BAROGA = [
  // [n°, mouvement, catégorie (T technique, S semi-technique, R renforcement musculaire), % du total, famille]
  [1, 'Arraché', 'T', .444, 'ar'], [2, 'Arraché flexion des plots', 'S', .42, 'ar'], [3, 'Arraché flexion puissance', 'S', .41, 'ar'],
  [4, 'Arraché debout', 'S', .38, 'ar'], [5, 'Arraché debout des plots', 'S', .36, 'ar'], [6, 'Arraché debout puissance', 'S', .36, 'ar'],
  [7, 'Arraché force', 'S', .28, 'ar'], [8, 'Tirage de bras d\'arraché', 'R', .2, 'ar'], [9, 'Tirage lourd d\'arraché', 'R', .53, 'ar'],
  [10, 'Tirage lourd d\'arraché des plots', 'R', .55, 'ar'], [11, 'Tirage haut d\'arraché', 'R', .444, 'ar'], [12, 'Flexion d\'arraché', 'R', .444, 'ar'],
  [13, 'Passages d\'arraché', 'S', .25, 'ar'], [14, 'Chute d\'arraché nuque', 'S', .444, 'ar'], [15, 'Développé d\'arraché', 'R', .2, 'ar'],
  [17, 'Épaulé-jeté', 'T', .556, 'ej'], [18, 'Épaulé flexion', 'T', .556, 'ej'], [19, 'Épaulé flexion des plots', 'S', .54, 'ej'],
  [20, 'Épaulé puissance', 'S', .52, 'ej'], [21, 'Épaulé debout', 'S', .47, 'ej'], [22, 'Épaulé debout des plots', 'S', .45, 'ej'],
  [23, 'Épaulé debout puissance', 'S', .41, 'ej'], [24, 'Épaulé force', 'S', .35, 'ej'], [25, 'Passages d\'épaulé', 'S', .35, 'ej'],
  [26, 'Tirage de bras d\'épaulé', 'R', .25, 'ej'], [27, 'Tirage lourd d\'épaulé', 'R', .72, 'ej'], [28, 'Tirage lourd d\'épaulé des plots', 'R', .78, 'ej'],
  [29, 'Jeté supports', 'S', .556, 'je'], [30, 'Jeté nuque', 'S', .6, 'je'], [31, 'Jeté debout puissance', 'S', .52, 'je'],
  [32, 'Jeté puissance nuque', 'S', .5, 'je'], [33, 'Chute de jeté', 'S', .25, 'je'], [34, 'Chute de jeté nuque', 'S', .25, 'je'],
  [35, 'Jeté force', 'S', .38, 'je'], [36, 'Jeté force nuque', 'S', .4, 'je'],
  [37, 'Développé nuque en fente', 'R', .28, 'rf'], [38, 'Flexion clavicules', 'R', .62, 'rf'], [39, 'Flexion nuque', 'R', .75, 'rf'],
  [40, 'Lombaires nuque (good morning)', 'R', .32, 'rf'], [41, 'Lombaires plinth', 'R', .3, 'rf'], [42, 'Lombaires surélevés', 'R', .556, 'rf'],
  [43, 'Développé clavicules', 'R', .32, 'rf'], [44, 'Développé nuque', 'R', .3, 'rf'], [45, 'Rowing', 'R', .3, 'rf'], [46, 'Tirage poitrine', 'R', .3, 'rf']
];
const BG_CAT = {T: 'Technique', S: 'Semi-technique', R: 'Renforcement'}, BG_FAM = [['ar', 'Arraché'], ['ej', 'Épaulé'], ['je', 'Jeté'], ['rf', 'Flexions, lombaires, développés, tirages']];
const bgData = () => S.tset?.olym || {};
const bgTotal = () => { const o = bgData(); return (+o.done?.[1] || 0) + (+o.done?.[17] || 0); };
// Le verdict exact du fichier : =SI(fait < attendu × 95 % ; « − » ; SI(fait > attendu × 106 % ; « + » ; « = »)).
const bgSign = (done, exp) => done < exp * .95 ? '-' : done > exp * 1.06 ? '+' : '=';
const bgNum = (v, d = 0) => (+v).toFixed(d).replace('.', ','), bgKg = v => { const r = Math.round(v * 2) / 2; return bgNum(r, r % 1 ? 1 : 0); };
function bgRows() {
  const T = bgTotal(), d = bgData().done || {};
  return BAROGA.map(([n, name, c, pct, fam]) => { const exp = T * pct, done = +d[n] || 0; return {n, name, c, pct, fam, exp, done, gap: done ? done - exp : null, gp: done ? done / exp - 1 : null, sg: done && T ? bgSign(done, exp) : null}; });
}
function baroCard() {
  const T = bgTotal(), R = bgRows().filter(r => r.done && r.n !== 1 && r.n !== 17), minus = R.filter(r => r.sg === '-').sort((a, b) => a.gp - b.gp), plus = R.filter(r => r.sg === '+').sort((a, b) => b.gp - a.gp);
  if (!T) return '';
  const li = r => `<div class="row"><span class="l">${esc(r.name)}<span class="hint">${bgKg(r.done)} kg pour ${bgKg(r.exp)} kg attendus</span></span><b class="bgg ${r.sg === '-' ? 'm' : 'p'}">${r.gp > 0 ? '+' : ''}${bgNum(r.gp * 100)} %</b></div>`;
  return `<div class="card bgsum"><span class="eyebrow">Tes déficits</span>${minus.length ? `<div class="list">${minus.map(li).join('')}</div>` : `<p class="small muted" style="margin:6px 0 0">${R.length ? 'Aucun : tout ce que tu as noté est à 95 % ou plus de l\'attendu.' : 'Note tes max dans le tableau pour les voir ici.'}</p>`}
    ${plus.length ? `<span class="eyebrow" style="display:block;margin-top:14px">Tes points forts</span><div class="list">${plus.slice(0, 5).map(li).join('')}</div>` : ''}</div>`;
}
function baroPane() {
  openPane({title: 'Max haltérophilie', render: () => {
    const o = bgData(), T = bgTotal(), rows = bgRows();
    const inp = (n, ph) => `<input class="mini-in bgin" inputmode="decimal" placeholder="${ph}" value="${o.done?.[n] ? bgNum(+o.done[n], +o.done[n] % 1 ? 1 : 0) : ''}" data-bgset="${n}" aria-label="Ton max">`;
    const app = EX.filter(e => e.t === 'gym' && e.u === 'kg' && e.cat === 'Haltérophilie' && rmOf(e.id, '', null));
    return `<p class="small muted" style="margin:16px 4px 8px">La table de Baroga : à partir de ton arraché et de ton épaulé-jeté, elle donne la charge attendue sur chaque mouvement. Ton max face à l'attendu montre tes déficits.</p>
      <div class="card bgtop"><div class="bgtwo"><label>Arraché<span>${inp(1, 'kg')} kg</span></label><label>Épaulé-jeté<span>${inp(17, 'kg')} kg</span></label></div>
        <div class="stats" style="margin-top:12px"><div><b>${T ? bgKg(T) + ' kg' : '–'}</b><span>total olympique</span></div><div><b>${T ? bgNum((+o.done[1] || 0) / T * 100, 1) + ' %' : '–'}</b><span>arraché / total <small>(table : 44,4 %)</small></span></div></div></div>
      ${baroCard()}
      ${T ? BG_FAM.map(([f, fn]) => `<div class="sec-label">${esc(fn)}</div><div class="bgt" role="table"><div class="bgh" role="row"><span role="columnheader">Mouvement</span><span role="columnheader">Attendu</span><span role="columnheader">Ton max</span><span role="columnheader">Écart</span></div>
        ${rows.filter(r => r.fam === f && r.n !== 1 && r.n !== 17).map(r => `<div class="bgr" role="row"><span class="bgn" role="cell">${esc(r.name)}<small>${BG_CAT[r.c]} · ${bgNum(r.pct * 100, 1)} % · travail à 80 % : ${bgKg(r.exp * .8)} kg</small></span><span class="bgx" role="cell">${bgKg(r.exp)}</span><span role="cell">${inp(r.n, '–')}</span><span role="cell" class="bgs ${r.sg === '-' ? 'm' : r.sg === '+' ? 'p' : r.sg ? 'e' : ''}">${r.sg ? (r.sg === '=' ? '=' : r.sg === '-' ? '−' : '+') + `<small>${r.gp > 0 ? '+' : ''}${bgNum(r.gp * 100)} %</small>` : '<small>à tester</small>'}</span></div>`).join('')}</div>`).join('')
      : '<div class="card" style="margin-top:12px"><p class="small muted" style="margin:0">Note ton arraché et ton épaulé-jeté : le tableau des 44 autres mouvements apparaît.</p></div>'}
      <details class="card bgwhy" style="margin-top:14px"><summary>Comment ça marche</summary><p class="small" style="margin:8px 0 0">Chaque mouvement vaut un pourcentage fixe du total arraché + épaulé-jeté (table de Baroga, fichier de ton cours d'haltérophilie). <b>−</b> : ton max est sous 95 % de l'attendu, c'est un déficit à travailler. <b>+</b> : au-dessus de 106 %, c'est un point fort. <b>=</b> : entre les deux. « Travail à 80 % » : la charge de travail que donne le fichier.</p></details>
      ${app.length ? `<div class="sec-label">Tes max d'haltérophilie dans l'appli</div><div class="list">${app.map(e => rmRow(e)).join('')}</div>` : ''}`;
  }});
}
document.addEventListener('change', async e => {
  const i = e.target.closest?.('[data-bgset]'); if (!i) return;
  const n = +i.dataset.bgset, v = +String(i.value).replace(',', '.'), o = {...bgData(), done: {...(bgData().done || {})}};
  if (v > 0) o.done[n] = v; else delete o.done[n];
  o.date = TODAY; await saveTset({olym: o});
});
document.addEventListener('click', e => { if (e.target.closest?.('[data-baroga]')) baroPane(); });
