/* ================= Tes qualités physiques : l'hexagone =================
   6 qualités du sprinteur, chacune notée de 0 à 100 à partir de ses vrais tests, avec plusieurs tests par qualité
   quand la science le justifie (moyenne pondérée de ceux qui existent).
   Échelle : 0 = sportif entraîné qui débute le sprint (≈ 13″5 au 100 m), 100 = sprinteur international (≈ 10″10).
   Les bornes viennent des valeurs publiées chez des sprinteurs de ces niveaux : Suchomel 2016 (force relative),
   Loturco 2015 et 2019 (sauts et sprint), Samozino 2016 (profil force-vitesse vertical), Flanagan 2008 et 2016 (RSI),
   Rabita 2015 et Morin 2012 (F0 et Vmax en sprint), Haugen 2019 (temps de passage). C'est une échelle de lecture :
   elle montre la forme de ton profil et ce qui bouge, pas une note officielle.
   Une valeur de test vaut 6 mois (on garde la meilleure des 6 derniers mois) ; un max de muscu, le dernier connu. */
const HX_WIN = 182;
// [id, nom, unité, borne à 0, borne à 100, poids, lien du test, type de saut pour noter à la main, champ]
const HX_Q = [
  {k: 'force', n: 'Force', s: 'Squat, hip thrust, soulevé de terre', why: 'La force maximale des jambes et des hanches, rapportée à ton poids. Elle nourrit surtout l\'accélération (Seitz 2014 : r ≈ −0,6 entre squat relatif et temps sur 10 à 30 m). On garde les 3 mouvements de base du sprinteur ; pas les mollets ni le gainage, qui ne disent rien de ta force de poussée.',
    src: 'Suchomel 2016 (squat ≥ 2 × ton poids = très fort) · Seitz 2014 · Loturco 2018 (hip thrust)', T: [
    {id: 'squat', n: 'Squat complet', u: '× ton poids', a: 1.2, b: 2.4, w: .4, go: 'data-t5start', gn: 'Test de RM'},
    {id: 'hipthrust', n: 'Hip thrust', u: '× ton poids', a: 1.5, b: 3.2, w: .3, go: 'data-t5start', gn: 'Test de RM'},
    {id: 'dl', n: 'Soulevé de terre ou trap bar', u: '× ton poids', a: 1.4, b: 2.8, w: .3, go: 'data-t5start', gn: 'Test de RM'}]},
  {k: 'explo', n: 'Explosivité', s: 'CMJ, squat jump, puissance, longueur', why: 'Produire beaucoup de force en peu de temps, à partir de l\'arrêt ou d\'un petit élan. Le CMJ est le test le plus lié au 100 m chez les sprinteurs (Loturco 2015 : r ≈ −0,7) ; le squat jump et la puissance du profil force-vitesse la complètent, le saut en longueur donne la part horizontale.',
    src: 'Loturco 2015 et 2019 · Samozino 2016 (Pmax en W/kg)', T: [
    {id: 'cmj', n: 'CMJ (mains sur les hanches)', u: 'cm', a: 30, b: 65, w: .4, go: 'data-vatest="cmj"', gn: 'Test CMJ filmé', jt: 'cmj', f: 'h'},
    {id: 'sj', n: 'Squat jump', u: 'cm', a: 28, b: 60, w: .2, go: 'data-vatest="sj"', gn: 'Test squat jump filmé', jt: 'sj', f: 'h'},
    {id: 'pmax', n: 'Puissance max (profil vertical)', u: 'W/kg', a: 18, b: 32, w: .2, go: 'data-tfvstart', gn: 'Test profil force-vitesse vertical'},
    {id: 'broad', n: 'Saut en longueur sans élan', u: 'cm', a: 220, b: 330, w: .2, go: '', gn: '', jt: 'broad', f: 'd'}]},
  {k: 'react', n: 'Réactivité', s: 'RSI : drop jump, test 10/5', why: 'Rebondir vite et haut : ce que tes chevilles et tes tendons rendent à chaque appui (contacts de 80 à 110 ms en vitesse max). L\'indice de force réactive (RSI = hauteur ÷ temps de contact) est la mesure de référence.',
    src: 'Flanagan 2008 et 2016 (RSI) · Ebben 2011 (RSI modifié)', T: [
    {id: 'dj', n: 'Drop jump (box 30 à 40 cm)', u: 'RSI', a: 1.0, b: 3.0, w: .5, go: 'data-vatest="dj"', gn: 'Test drop jump filmé', jt: 'dj', f: 'rsi'},
    {id: 'rj105', n: 'Test 10/5 (rebonds)', u: 'RSI', a: 1.2, b: 3.2, w: .3, go: 'data-vatest="rj105"', gn: 'Test 10/5 filmé', jt: 'rj105', f: 'rsi'},
    {id: 'rsimod', n: 'RSI modifié (CMJ)', u: 'RSI mod', a: .30, b: .75, w: .2, go: 'data-vatest="rsimod"', gn: 'Test RSI modifié filmé', jt: 'rsimod', f: 'rsi'}]},
  {k: 'acc', n: 'Accélération', s: '10 m, 30 m, force horizontale F0', why: 'Prendre de la vitesse sur les 30 premiers mètres. Le test du profil force-vitesse en sprint (un 30 m filmé) donne tout d\'un coup : ton 10 m, ton 30 m et F0, la force que tu mets à l\'horizontale au départ.',
    src: 'Haugen 2019 (temps de passage) · Rabita 2015 et Morin 2012 (F0 des sprinteurs mondiaux ≈ 9 à 10 N/kg)', T: [
    {id: 'spr10', n: '10 m départ debout', u: 's', a: 2.05, b: 1.70, w: .4, go: 'data-thfvstart', gn: 'Test profil force-vitesse en sprint', jt: 'spr10', f: 't'},
    {id: 'spr30', n: '30 m départ debout', u: 's', a: 4.65, b: 3.80, w: .3, go: 'data-thfvstart', gn: 'Test profil force-vitesse en sprint', jt: 'spr30', f: 't'},
    {id: 'f0', n: 'F0, force horizontale', u: 'N/kg', a: 6, b: 10, w: .3, go: 'data-thfvstart', gn: 'Test profil force-vitesse en sprint'}]},
  {k: 'vmax', n: 'Vitesse max', s: 'Vmax du profil en sprint', why: 'Ta vitesse de pointe, atteinte vers 50 à 70 m. Le profil force-vitesse en sprint la mesure ; sans lui, elle est estimée depuis ton 100 m (pointe ≈ 1,18 × ta vitesse moyenne).',
    src: 'Morin 2012 · Rabita 2015 · Haugen 2019 (Vmax des finalistes mondiaux ≈ 11,5 à 12,3 m/s)', T: [
    {id: 'vmax', n: 'Vmax', u: 'm/s', a: 8.5, b: 11.8, w: 1, go: 'data-thfvstart', gn: 'Test profil force-vitesse en sprint'}]},
  {k: 'send', n: 'Endurance de vitesse', s: 'Ton 100 m comparé à ton 60 m', why: 'Garder ta vitesse jusqu\'au bout. Le rapport entre ton 100 m et ton 60 m montre ce que tu perds sur les 40 derniers mètres : 1,53 chez un sprinteur international, 1,66 chez un débutant. Il se met à jour avec tes courses.',
    src: 'Calcul sur les barèmes FFA et les meilleures performances (rapport 100 m ÷ 60 m)', T: [
    {id: 'ratio', n: '100 m ÷ 60 m', u: '', a: 1.66, b: 1.53, w: 1, go: '', gn: ''}]}
];
const hxSc = (x, a, b) => Math.round(Math.max(0, Math.min(100, (x - a) / (b - a) * 100)));
const hxNum = s => parseFloat(String(s || '').replace(/''|"|″|’/g, '.').replace(',', '.')) || null;
const hxBack = D => addDays(D, -HX_WIN);
// Le meilleur saut ou sprint des 6 mois avant la date D. Les valeurs impossibles (au-delà du record des meilleurs
// sprinteurs : squat jump > 70 cm, CMJ > 78 cm) viennent d'une image mal marquée : elles sont écartées.
const HX_MAXH = {sj: 70, cmj: 78, abk: 85};
const hxJ = (type, D) => { const L = jumps().filter(j => j.type === type && j.date <= D && j.date >= hxBack(D) && jVal(j) > 0 && !(HX_MAXH[type] && +j.h > HX_MAXH[type])); return L.sort((a, b) => jVal(b) - jVal(a))[0] || null; };
// Le max connu à la date D : la fiche du max si elle date d'avant D, sinon le dernier test de RM d'avant D.
function hxRm(id, D) {
  const c = S.tset?.rm?.[id], L = [];
  if (c?.kg && (!c.date || c.date <= D)) L.push({kg: +c.kg, date: c.date || ''});
  for (const t of tests()) if (t.type === '5rm' && t.ex === id && t.date <= D) L.push({kg: Math.round(e1rm(+t.kg, +t.reps || 5)), date: t.date});
  return L.sort((a, b) => b.date.localeCompare(a.date))[0] || null;
}
const hxLast = (type, D) => tests().filter(t => t.type === type && t.date <= D).sort((a, b) => b.date.localeCompare(a.date))[0] || null;
// La valeur de chaque test à la date D : {x, date, txt, est}.
function hxRaw(id, D) {
  const bw = bodyKg(), F = (x, n) => fx(x, n);
  const rel = r => r && bw ? {x: r.kg / bw, date: r.date, txt: `${fx(r.kg)} kg · ${fx(r.kg / bw, 2)} × ton poids`} : null;
  if (id === 'squat') return rel(hxRm('squat', D));
  if (id === 'hipthrust') return rel(hxRm('hipthrust', D));
  if (id === 'dl') { const a = hxRm('deadlift', D), b = hxRm('hbdl', D), bb = b ? {kg: Math.round(b.kg / 1.05), date: b.date, tb: b.kg} : null, m = [a, bb].filter(Boolean).sort((x, y) => y.kg - x.kg)[0];
    const o = rel(m); if (o && m.tb) o.txt = `trap bar ${fx(m.tb)} kg ≈ ${fx(m.kg)} kg au soulevé · ${fx(m.kg / bw, 2)} × ton poids`; return o; }
  if (id === 'pmax') { const t = hxLast('fv', D), r = t ? fvProfile(t) : null; return r && t.date >= hxBack(D) ? {x: r.Pmax, date: t.date, txt: `${F(r.Pmax, 1)} W/kg`} : null; }
  if (id === 'f0' || id === 'vmax') { const t = hxLast('hfv', D); if (t && t.date >= hxBack(D) && +t[id === 'f0' ? 'F0' : 'vmax'] > 0) { const x = +t[id === 'f0' ? 'F0' : 'vmax']; return {x, date: t.date, txt: id === 'f0' ? `${F(x, 1)} N/kg` : `${F(x, 2)} m/s`}; }
    if (id === 'vmax') { const sp = S.profile?.sprinter || {}, t100 = hxNum(sp.pb100); if (t100 && (!sp.pb100Date || sp.pb100Date <= D)) { const x = 1.18 * 100 / t100; return {x, date: sp.pb100Date || '', txt: `≈ ${F(x, 2)} m/s, estimée depuis ton 100 m en ${F(t100, 2)}`, est: true}; } }
    return null; }
  if (id === 'ratio') { const sp = S.profile?.sprinter || {}, a = hxNum(sp.pb60), b = hxNum(sp.pb100); return a && b && (!sp.pb100Date || sp.pb100Date <= D) ? {x: b / a, date: sp.pb100Date || '', txt: `${F(b, 2)} ÷ ${F(a, 2)} = ${F(b / a, 3)}`} : null; }
  const t = HX_Q.flatMap(q => q.T).find(x => x.id === id), j = t?.jt ? hxJ(t.jt, D) : null; if (!j) return null;
  const x = t.f === 't' ? +j.t : t.f === 'rsi' ? +j.rsi : t.f === 'd' ? +j.d : +j.h;
  return {x, date: j.date, txt: t.f === 't' ? `${F(x, 2)} s` : t.f === 'rsi' ? `${t.u} ${F(x, 2)}` : `${F(x, 1)} cm`};
}
// Les 6 qualités à la date D : chaque test noté, puis la moyenne pondérée de ceux qui existent.
function hxVals(D = TODAY) {
  return HX_Q.map(q => { const T = q.T.map(t => { const r = hxRaw(t.id, D); return {...t, r, sc: r ? hxSc(r.x, t.a, t.b) : null}; }), on = T.filter(t => t.sc != null), W = on.reduce((a, t) => a + t.w, 0);
    const s = W ? Math.round(on.reduce((a, t) => a + t.sc * t.w, 0) / W) : null, last = on.map(t => t.r.date).filter(Boolean).sort().at(-1) || '';
    return {k: q.k, n: q.n, q, T, s, n0: on.length, date: last, est: on.length === 1 && on[0].r.est}; });
}
// L'hexagone d'avant se compare sur les MÊMES tests : sa note = la note d'aujourd'hui + l'écart moyen (pondéré) des tests
// qui existaient aux deux dates. Un test nouveau ne fait donc pas bouger la forme d'avant.
function hxOld(Q, D) { const O = hxVals(D);
  return Q.map((q, i) => { const c = q.T.map((t, j) => [t, O[i].T[j]]).filter(([a, b]) => a.sc != null && b.sc != null), W = c.reduce((a, [t]) => a + t.w, 0);
    return {k: q.k, s: W ? Math.max(0, Math.min(100, Math.round(q.s + c.reduce((a, [t, o]) => a + (o.sc - t.sc) * t.w, 0) / W))) : null}; }); }
const HXP = [['jour', 'Jour', 1, 'hier'], ['sem', 'Semaine', 7, 'il y a 1 semaine'], ['mois', 'Mois', 30, 'il y a 1 mois'], ['an', 'Année', 365, 'il y a 1 an']];
const HXS = {per: 'mois'};
const hxPer = () => HXP.find(x => x[0] === HXS.per) || HXP[2];
const hxPt = (i, r, c = 150) => { const a = -Math.PI / 2 + i * Math.PI / 3; return [c + r * Math.cos(a), c + r * Math.sin(a)]; };
const hxPoly = sc => sc.map((v, i) => hxPt(i, 104 * (v ?? 0) / 100).map(z => z.toFixed(1)).join(',')).join(' ');
// L'hexagone : la grille, l'hexagone d'avant (gris, en pointillés) sous celui d'aujourd'hui. Les noms des qualités
// se touchent (une grande zone autour de chaque nom).
function hxSvg(Q, O) {
  const R = 104, c = 150;
  const grid = [25, 50, 75, 100].map(g => `<polygon points="${hxPoly(Q.map(() => g))}" class="hxg"/>`).join('') + Q.map((q, i) => `<line x1="${c}" y1="${c}" x2="${hxPt(i, R)[0].toFixed(1)}" y2="${hxPt(i, R)[1].toFixed(1)}" class="hxg"/>`).join('');
  const lab = Q.map((q, i) => { const [x, y] = hxPt(i, R + 26), an = Math.abs(x - c) < 8 ? 'middle' : x > c ? 'start' : 'end', d = O && q.s != null && O[i].s != null ? q.s - O[i].s : null;
    const L = q.n.length > 13 ? q.n.split(/ (?=de )/) : [q.n], dy = (L.length - 1) * 18, y0 = y + 4 - (i === 3 ? 0 : dy / 2);
    const w = Math.max(...L.map(t => t.length)) * 10 + 16, hx = an === 'middle' ? x - w / 2 : an === 'start' ? x - 8 : x - w + 8;
    return `<g class="hxk" data-hxq="${q.k}" role="button" tabindex="0" aria-label="${esc(q.n)}"><rect x="${hx.toFixed(1)}" y="${(y0 - 20).toFixed(1)}" width="${w}" height="${dy + 46}" rx="10" class="hxhit"/><text x="${x.toFixed(1)}" y="${y0.toFixed(1)}" text-anchor="${an}" class="hxl">${L.map((t, j) => `<tspan x="${x.toFixed(1)}" dy="${j ? 18 : 0}">${esc(t)}</tspan>`).join('')}</text><text x="${x.toFixed(1)}" y="${(y0 + dy + 19).toFixed(1)}" text-anchor="${an}" class="hxv">${q.s == null ? 'à tester' : q.s}${d ? `<tspan class="${d > 0 ? 'hxu' : 'hxdn'}"> ${d > 0 ? '+' : '−'}${Math.abs(d)}</tspan>` : ''}</text></g>`; }).join('');
  const dots = Q.map((q, i) => q.s == null ? '' : `<circle cx="${hxPt(i, R * q.s / 100)[0].toFixed(1)}" cy="${hxPt(i, R * q.s / 100)[1].toFixed(1)}" r="3.5" class="hxd" data-i="${i}"/>`).join('');
  const old = O ? `<polygon points="${hxPoly(O.map(o => o.s))}" class="hxo"/>` : '';
  return `<svg viewBox="-84 -14 472 346" class="hxsvg" role="img" aria-label="Hexagone de tes qualités physiques"><g class="hxrot">${grid}${old}<polygon points="${hxPoly(Q.map(q => q.s))}" class="hxp"/>${dots}</g>${lab}</svg>`;
}
// Les formes bougent en douceur : de l'ancienne forme à la nouvelle.
function hxTween(poly, from, to, ms = 450) {
  if (!poly) return; const t0 = performance.now(), ease = t => 1 - Math.pow(1 - t, 3);
  const step = now => { const k = ease(Math.min(1, (now - t0) / ms)); poly.setAttribute('points', hxPoly(to.map((v, i) => (from[i] ?? 0) + ((v ?? 0) - (from[i] ?? 0)) * k))); if (k < 1 && poly.isConnected) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}
const hxDate = d => d ? fmtShort(d) : 'date inconnue';

/* ---------- La carte de Profil : l'hexagone en grand, Jour · Semaine · Mois · Année (Mois par défaut) ---------- */
function hxCardIn() {
  const Q = hxVals(), p = hxPer(), D = addDays(TODAY, -p[2]), O = hxOld(Q, D), none = O.every(o => o.s == null), same = Q.every((q, i) => q.s === O[i].s);
  return `<div class="chead"><span class="eyebrow">Tes qualités physiques</span></div>
    <div class="seg hxseg" role="group" aria-label="Comparer avec">${HXP.map(([k, l]) => `<button type="button" data-hxper="${k}" aria-pressed="${k === HXS.per}">${l}</button>`).join('')}</div>
    ${hxSvg(Q, none ? null : O)}
    <div class="hxleg"><span><i class="now"></i>Aujourd'hui</span><span><i class="old"></i>${esc(cap(p[3]))}</span></div>
    <p class="small muted hxhint" data-tip="1">${none ? `Pas encore de test ${esc(p[3])}. ` : same ? 'Aucun test nouveau sur cette période. ' : ''}Touche une qualité pour la voir en grand et faire ses tests.</p>`;
}
const hxCard = () => `<div class="card hxpro" id="hxcard">${hxCardIn()}</div>`;

/* ---------- Une qualité en grand : tout l'écran passe au noir (barre du téléphone comprise), l'hexagone grandit et
   tourne pour coucher la qualité vers la droite, son nom au bout de l'axe gradué. En haut : Jour · Semaine · Mois · Année. ---------- */
const HX_GO = {
  force: [['data-t5start', 'Test de force maximale', 'Test de RM · de 1 à 5RM, ton 1RM calculé, squat, hip thrust, soulevé de terre'], ['data-rmlist', 'Noter un max à la main', 'Max musculation · un test fait ailleurs ou un ancien record']],
  explo: [['data-vatest="cmj"', 'Test de détente verticale', 'CMJ filmé · mains sur les hanches, avec contre-mouvement'], ['data-vatest="sj"', 'Test de détente sans élan', 'Squat jump filmé · départ arrêté, genoux à 90°'], ['data-tfvstart', 'Test de puissance en saut', 'Profil force-vitesse vertical · squat jumps chargés filmés, méthode Samozino']],
  react: [['data-vatest="dj"', 'Test de rebond', 'Drop jump filmé · RSI, temps de contact, raideur'], ['data-vatest="rj105"', 'Test de rebonds enchaînés', 'Test 10/5 · moyenne de tes 5 meilleurs RSI'], ['data-vatest="rsimod"', 'Test de saut rapide', 'RSI modifié · hauteur du CMJ ÷ temps jusqu\'au décollage']],
  acc: [['data-thfvstart', 'Test d\'accélération et de vitesse max', 'Profil force-vitesse en sprint · 30 m filmé, donne 10 m, 30 m, F0 et Vmax'], ['data-vatest="sprint"', 'Test de vitesse chronométré', 'Tests de sprint · 10, 20, 30, 60 m et 5-0-5, à la vidéo']],
  vmax: [['data-thfvstart', 'Test d\'accélération et de vitesse max', 'Profil force-vitesse en sprint · 30 m filmé, donne ta Vmax']],
  send: []};
const HXO = {on: false, k: null, el: null, busy: false};
function hxoPanel(k) {
  const Q = hxVals(), i = Q.findIndex(q => q.k === k), q = Q[i], p = hxPer(), O = hxOld(Q, addDays(TODAY, -p[2])), d = q.s != null && O[i].s != null ? q.s - O[i].s : null, notes = q.T.filter(t => t.jt);
  return `<div class="hxo-score"><b>${q.s ?? '–'}</b><span>/ 100</span>${d ? `<em class="${d > 0 ? 'hxu' : 'hxdn'}">${d > 0 ? '+' : '−'}${Math.abs(d)} ${esc(p[3].replace('il y a ', 'en '))}</em>` : ''}</div>
    <p class="hxo-sub">${q.s != null ? `${q.n0} test${q.n0 > 1 ? 's' : ''} sur ${q.T.length}${q.est ? ' · estimée' : ''} · dernier le ${esc(hxDate(q.date))}` : 'à tester : fais un des tests plus bas'}</p>
    <p class="hxo-why">${esc(q.q.why)}</p>
    <div class="sec-label">Ce qui compte dans ta note</div>
    <div class="hxtt">${q.T.map(t => `<div class="hxtr${t.r ? '' : ' off'}"><span><b>${esc(t.n)}</b><small>${t.r ? esc(t.r.txt) + ' · ' + esc(hxDate(t.r.date)) : 'pas encore testé'}</small></span><span class="hxsc">${t.sc ?? '–'}</span><small class="hxref">0 = ${esc(fx(t.a, t.a % 1 ? 2 : 0))} · 100 = ${esc(fx(t.b, t.b % 1 ? 2 : 0))} ${esc(t.u)} · compte pour ${Math.round(t.w * 100)} %</small></div>`).join('')}</div>
    ${HX_GO[k].length ? `<div class="sec-label">Les tests à faire</div><div class="list">${HX_GO[k].map(([a, n, s]) => `<button type="button" class="rowbtn" ${a}><span><b>${esc(n)}</b><span class="meta">${esc(s)}</span></span>${ICON.chev}</button>`).join('')}</div>`
      : '<p class="small hxo-why">Pas de test à faire : elle se met à jour avec tes courses (ta fiche FFA). Un 60 m et un 100 m de la même saison la rendent plus juste.</p>'}
    ${notes.length ? `<div class="sec-label">Noter un résultat à la main</div><div class="list hxnote">${notes.map(t => `<div class="row"><label for="hxn-${t.id}">${esc(t.n)}</label><span><input class="mini-in" id="hxn-${t.id}" inputmode="decimal" style="width:76px" placeholder="${esc(t.f === 't' ? 's' : t.f === 'rsi' ? 'RSI' : 'cm')}"> <button type="button" class="chip" data-hxnote="${t.jt}|${t.f}|${t.id}">Noter</button></span></div>`).join('')}</div><p class="small muted" data-tip="1" style="margin:6px 4px 0">Un test fait dans l'appli se note tout seul. À la main : pour un test mesuré ailleurs (cellules, My Jump, plateforme).</p>` : ''}
    <p class="small muted" data-tip="1" style="margin:14px 4px 0">0 = sportif entraîné qui débute le sprint (≈ 13″5 au 100 m), 100 = sprinteur international (≈ 10″10). Un test compte 6 mois. Sources : ${esc(q.q.src)}.</p>`;
}
// Où l'hexagone de la carte se trouve, et où il va : la qualité couchée vers la droite, son nom au bout de l'axe,
// l'hexagone poussé vers la gauche. À l'arrivée il est à sa vraie taille (échelle 1) : les traits restent fins.
function hxoGeo(svg, i, topH = 70) {
  const r = svg.getBoundingClientRect(), u0 = Math.min(r.width / 472, r.height / 346) || 1, ox = r.left + (r.width - 472 * u0) / 2, oy = r.top + (r.height - 346 * u0) / 2;
  const W = innerWidth, H = innerHeight, pc = typeof isPC === 'function' && isPC(), colW = Math.min(W, 680), colL = (W - colW) / 2, lab = 140;
  const R = Math.round(pc ? Math.min(H * .24, 170) : Math.min(colW * .35, H * .17, 150)), u1 = R / 104;
  const cx = Math.min(colL + colW - 28 - lab - R, colL + (colW - 2 * R - 12 - lab) / 2 + R), cy = topH + 18 + R * .866;
  let rot = 90 - 60 * i; if (rot > 180) rot -= 360; if (rot <= -180) rot += 360;
  return {R, u1, cx, cy, rot, topH, w: 472 * u1, h: 346 * u1, t0: `translate(${ox}px,${oy}px) scale(${u0 / u1})`, t1: `translate(${cx - 234 * u1}px,${cy - 164 * u1}px)`, top: Math.round(cy + R * .866 + 24)};
}
const hxoD = k => { const Q = hxVals(), i = Q.findIndex(q => q.k === k), q = Q[i], O = hxOld(Q, addDays(TODAY, -hxPer()[2])), d = q.s != null && O[i].s != null ? q.s - O[i].s : null; return {Q, i, q, O, d}; };
// L'axe de la qualité, couché vers la droite, gradué 25 · 50 · 75 · 100 (les anneaux de la grille tombent pile dessus).
// Le halo : un arc de cercle rouge au rayon du score, centré sur l'hexagone, qui s'ouvre de part et d'autre de l'axe
// (plus fort sur l'axe, il s'efface en tournant), flou et doux. La ligne de l'axe reste fine, sans lumière.
const hxArc = (r, dir) => { const t = 112 * Math.PI / 180, x = 150 + r * Math.cos(t), y = 150 + dir * r * Math.sin(t);
  return `M${(150 + r).toFixed(1)} 150A${r.toFixed(1)} ${r.toFixed(1)} 0 0 ${dir > 0 ? 1 : 0} ${x.toFixed(1)} ${y.toFixed(1)}`; };
const hxoHalo = (s0, u1) => { const r = Math.max(4, 104 * (s0 ?? 0) / 100), g = `x1="${(150 + r).toFixed(1)}" y1="150" x2="${(150 - .38 * r).toFixed(1)}" y2="150"`;
  return `<defs><filter id="hxglow" filterUnits="userSpaceOnUse" x="-20" y="-20" width="340" height="340"><feGaussianBlur stdDeviation="${(9 / u1).toFixed(2)}"/></filter>
    <filter id="hxglow2" filterUnits="userSpaceOnUse" x="-20" y="-20" width="340" height="340"><feGaussianBlur stdDeviation="${(3 / u1).toFixed(2)}"/></filter>
    <linearGradient id="hxhg" gradientUnits="userSpaceOnUse" ${g}><stop offset="0" stop-color="var(--accent)" stop-opacity="1"/><stop offset=".55" stop-color="var(--accent)" stop-opacity=".45"/><stop offset="1" stop-color="var(--accent)" stop-opacity="0"/></linearGradient>
    <radialGradient id="hxpg"><stop offset="0" stop-color="var(--accent)" stop-opacity=".85"/><stop offset="1" stop-color="var(--accent)" stop-opacity="0"/></radialGradient></defs>
    <g class="hxhalo"${s0 ? '' : ' style="display:none"'}><circle cx="${(150 + r).toFixed(1)}" cy="150" r="${(30 / u1).toFixed(2)}" fill="url(#hxpg)" class="hxhp"/>
    ${[[22, 'hxglow', 'hxa1'], [7, 'hxglow2', 'hxa2'], [1.6, '', 'hxa3']].map(([w, f, c]) => [1, -1].map(d => `<path d="${hxArc(r, d)}" pathLength="1" fill="none" stroke="url(#hxhg)" stroke-width="${(w / u1).toFixed(2)}" stroke-linecap="round"${f ? ` filter="url(#${f})"` : ''} class="hxarc ${c}"/>`).join('')).join('')}</g>`; };
const hxoAxis = (q, u1) => `${hxoHalo(q.s, u1)}<g class="hxaxis"><line x1="150" y1="150" x2="254" y2="150" class="hxtrack"/>`
  + [25, 50, 75, 100].map(v => `<text x="${(150 + 104 * v / 100).toFixed(1)}" y="${(150 - 8 / u1).toFixed(1)}" text-anchor="middle" class="hxtk" style="font-size:${(10.5 / u1).toFixed(2)}px;stroke-width:${(3 / u1).toFixed(2)}px">${v}</text>`).join('') + '</g>';
const hxoLab = (q, d) => `<b>${q.n.split(/ (?=de )/).map(esc).join('<br>')}</b><span>${q.s ?? 'à tester'}${d ? ` <em class="${d > 0 ? 'hxu' : 'hxdn'}">${d > 0 ? '+' : '−'}${Math.abs(d)}</em>` : ''}</span>`;
const hxoSeg = () => HXP.map(([k, l]) => `<button type="button" data-hxoper="${k}" aria-pressed="${k === HXS.per}">${l}</button>`).join('');
function hxoLay(el, g) { const w = el.querySelector('.hxo-w'); w.style.width = g.w + 'px'; w.style.height = g.h + 'px'; w.style.setProperty('--t0', g.t0); w.style.setProperty('--t1', g.t1); w.style.setProperty('--rot', g.rot + 'deg'); const rr = w.querySelector('.hxo-r'); if (rr) rr.style.transformOrigin = `${(234 * g.u1).toFixed(2)}px ${(164 * g.u1).toFixed(2)}px`;
  const inn = el.querySelector('.hxo-in'); if (inn) inn.style.minHeight = Math.round(innerHeight - g.topH) + 'px';
  const l = el.querySelector('.hxo-lab'), lx = Math.round(g.cx + g.R + 14), ly = Math.round(g.cy), colL = Math.max(0, (innerWidth - 680) / 2);
  l.style.left = lx + 'px'; l.style.top = ly + 'px'; el.querySelector('.hxo-gap').style.height = g.top + 'px';
  g.D = Math.max(80, g.top - g.topH - 64); g.hdx = -(g.cx + g.R + 40); g.hdy = -g.D * .35; g.ldx = colL + 18 - lx; g.ldy = g.topH + 30 - ly;
  if (inn) inn.style.minHeight = Math.round(innerHeight - g.topH - 64) + 'px';
  el.style.setProperty('--hdx', g.hdx + 'px'); el.style.setProperty('--hdy', g.hdy + 'px'); el.style.setProperty('--ldx', g.ldx + 'px'); el.style.setProperty('--ldy', g.ldy + 'px');
  el.querySelector('.hxo-dockbg').style.height = (g.topH + 72) + 'px';
  el.querySelector('.hxo-hx').style.animationRange = el.querySelector('.hxo-lab').style.animationRange = `0px ${g.D}px`; el.querySelector('.hxo-dockbg').style.animationRange = `${Math.round(g.D * .55)}px ${g.D}px`;
  HXO.g = g; }
// Défilement lié au geste : sur les téléphones récents, le navigateur le fait lui-même (aucun décalage avec le doigt).
const HX_SD = (() => { try { return CSS.supports('animation-timeline: scroll()') && CSS.supports('timeline-scope: --a'); } catch (e) { return false; } })();
// En faisant défiler : l'hexagone monte moins vite que le texte, rapetisse et glisse vers la gauche, puis le texte le recouvre.
function hxoScroll() { const el = HXO.el, g = HXO.g; if (!el || !g || el.classList.contains('closing') || HX_SD) return;
  const y = el.querySelector('.hxo-p').scrollTop, p = Math.max(0, Math.min(1, y / g.D)), q = Math.max(0, Math.min(1, (y - g.D * .55) / (g.D * .45)));
  el.querySelector('.hxo-hx').style.transform = p ? `translate(${(g.hdx * p).toFixed(1)}px,${(g.hdy * p).toFixed(1)}px) scale(${(1 - .2 * p).toFixed(3)})` : '';
  el.querySelector('.hxo-lab').style.transform = `translate(${(g.ldx * p).toFixed(1)}px,${(g.ldy * p).toFixed(1)}px) translateY(-50%) scale(${(1 - .14 * p).toFixed(3)})`;
  el.querySelector('.hxo-dockbg').style.opacity = q.toFixed(3); }
// La barre du téléphone (heure, batterie) passe au noir en douceur, puis reprend sa couleur à la fermeture.
const hxRgb = c => { const d = document.createElement('i'); d.style.color = c; document.body.appendChild(d); const m = (getComputedStyle(d).color.match(/[\d.]+/g) || [0, 0, 0]).slice(0, 3).map(Number); d.remove(); return m; };
function hxBar(on) { const ms = document.querySelectorAll('meta[name="theme-color"]'); if (!ms.length) return; cancelAnimationFrame(HXO.bar); if (on) HXO.bar0 = ms[0].content;
  const top = getComputedStyle(document.documentElement).getPropertyValue('--top').trim() || '#000', a = hxRgb(ms[0].content || top), b = on ? [0, 0, 0] : hxRgb(HXO.bar0 || top), t0 = performance.now();
  const step = now => { const k = Math.min(1, (now - t0) / 480), e = k * (2 - k), c = '#' + a.map((v, j) => Math.round(v + (b[j] - v) * e).toString(16).padStart(2, '0')).join('');
    if (k >= 1 || now - (HXO.barT || 0) > 40) { HXO.barT = now; ms.forEach(m => { m.media = ''; m.content = c; }); } if (k < 1) HXO.bar = requestAnimationFrame(step); else if (!on) { try { syncBars(); } catch (er) {} } };
  HXO.bar = requestAnimationFrame(step); }
const hxSync0 = syncBars;
syncBars = function (...a) { if (HXO.on && !HXO.el?.classList.contains('closing')) { document.querySelectorAll('meta[name="theme-color"]').forEach(m => { m.media = ''; m.content = '#000'; }); return; } return hxSync0.apply(this, a); };
const hxCardShape = on => document.querySelectorAll('#hxcard svg.hxsvg .hxrot').forEach(g => { g.style.visibility = on ? '' : 'hidden'; });
function hxoOpen(k) {
  if (HXO.on || HXO.busy) return; const card = $('#hxcard svg.hxsvg'); if (!card) return;
  const {Q, i, q, O, d} = hxoD(k);
  const el = document.createElement('div'); el.className = 'hxo-ov prep' + (HX_SD ? ' sd' : ''); el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', q.n);
  el.innerHTML = `<div class="hxo-bg"></div><div class="hxo-hx"><div class="hxo-w"></div></div>
    <div class="hxo-p"><div class="hxo-gap"></div><div class="hxo-in">${hxoPanel(k)}</div></div>
    <div class="hxo-dock" aria-hidden="true"><div class="hxo-dockbg"></div><div class="hxo-lab">${hxoLab(q, d)}</div></div>
    <div class="hxo-top"><div class="seg hxo-seg" role="group" aria-label="Comparer avec">${hxoSeg()}</div><button type="button" class="hxo-x" aria-label="Fermer"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg></button></div>`;
  document.body.appendChild(el);
  const g = hxoGeo(card, i, el.querySelector('.hxo-top').offsetHeight);
  el.querySelector('.hxo-w').innerHTML = `<div class="hxo-r">${hxSvg(Q, O).replace(/<g class="hxk"[\s\S]*?<\/g>/g, '')}</div><svg viewBox="-84 -14 472 346" class="hxsvg hxo-axs" aria-hidden="true">${hxoAxis(q, g.u1)}</svg>`;
  el.querySelectorAll('.hxd').forEach(c => c.classList.toggle('sel', +c.dataset.i === i));
  Object.assign(HXO, {on: true, k, i, el, busy: true, tok: Date.now()}); hxoLay(el, g);
  // Le doigt sur la page noire ne touche qu'elle : plus de glissement d'onglet ni de « tirer pour actualiser » dessous.
  for (const ev of ['touchstart', 'touchmove', 'touchend', 'touchcancel', 'pointerdown', 'pointermove', 'pointerup']) el.addEventListener(ev, e => e.stopPropagation(), {passive: true});
  hxCardShape(false); document.documentElement.classList.add('hxo-lock');
  el.querySelector('.hxo-p').addEventListener('scroll', () => { if (HXO.raf) return; HXO.raf = requestAnimationFrame(() => { HXO.raf = 0; hxoScroll(); }); }, {passive: true});
  try { history.pushState({...(history.state || {}), hxo: HXO.tok}, ''); } catch (e) {}
  hxBar(true); void el.offsetWidth; el.classList.remove('prep'); void el.offsetWidth; el.classList.add('open'); setTimeout(() => { HXO.busy = false; }, 640);
}
// Une autre période, un test noté : l'hexagone d'avant glisse vers sa nouvelle forme, les chiffres suivent.
function hxoRefresh(prev) { const el = HXO.el; if (!el) return; const {Q, q, O, d} = hxoD(HXO.k);
  const c = $('#hxcard'); if (c && prev) c.innerHTML = hxCardIn(); hxCardShape(false);
  el.querySelectorAll('[data-hxoper]').forEach(x => x.setAttribute('aria-pressed', x.dataset.hxoper === HXS.per));
  const poly = el.querySelector('.hxo-w .hxo'), o = O.map(x => x.s); if (poly) { if (prev) hxTween(poly, prev, o); else poly.setAttribute('points', hxPoly(o)); }
  el.querySelector('.hxo-w .hxp')?.setAttribute('points', hxPoly(Q.map(x => x.s)));
  el.querySelectorAll('.hxo-w .hxd').forEach(dt => { const v = Q[+dt.dataset.i].s; if (v != null) { const [x, y] = hxPt(+dt.dataset.i, 104 * v / 100); dt.setAttribute('cx', x.toFixed(1)); dt.setAttribute('cy', y.toFixed(1)); } });
  { const sv = el.querySelector('svg.hxo-axs'); if (sv && HXO.g) { const old = sv.querySelector('.hxhalo'); sv.querySelector('defs')?.remove(); old?.remove(); sv.insertAdjacentHTML('afterbegin', hxoHalo(q.s, HXO.g.u1)); } }
  el.querySelector('.hxo-lab').innerHTML = hxoLab(q, d);
  const inn = el.querySelector('.hxo-in'), sc = el.querySelector('.hxo-p'), y = sc.scrollTop; inn.innerHTML = hxoPanel(HXO.k); sc.scrollTop = y; }
function hxoClose(fromBack) {
  if (!HXO.on || HXO.busy) return; const el = HXO.el, card = $('#hxcard svg.hxsvg');
  if (!fromBack && history.state?.hxo === HXO.tok) { try { POP_SKIP = true; history.go(history.state.hxpane ? -2 : -1); } catch (e) {} }
  HXO.busy = true; if (card) { el.querySelector('.hxo-w').style.setProperty('--t0', hxoGeo(card, 0, HXO.g?.topH).t0); hxCardShape(false); }
  const sc = el.querySelector('.hxo-p'); if (sc.scrollTop > 0) { try { sc.scrollTo({top: 0, behavior: 'smooth'}); } catch (e) { sc.scrollTop = 0; } }
  el.classList.add('closing'); el.classList.remove('open'); el.querySelector('.hxo-hx').style.transform = ''; el.querySelector('.hxo-dockbg').style.opacity = ''; hxBar(false);
  setTimeout(() => { el.remove(); hxCardShape(true); document.documentElement.classList.remove('hxo-lock'); Object.assign(HXO, {on: false, k: null, el: null, busy: false, tok: 0, g: null}); }, 620);
}
// Bouton retour du téléphone : il ferme d'abord le test ouvert par-dessus, puis la page de la qualité. Jamais l'onglet.
addEventListener('popstate', e => { if (!HXO.on || POP_SKIP || HXO.el?.classList.contains('closing')) return;
  if (!P.stack.length && e.state?.hxo !== HXO.tok) { HXO.busy = false; hxoClose(true); } }, true);
// Un test ouvert par-dessus la page : une étape de plus dans l'historique, retirée quand le test se ferme.
const hxOpenPane0 = openPane;
openPane = function (v, ...a) { if (HXO.on && !P.stack.length && history.state?.hxo === HXO.tok && !history.state.hxpane) { try { history.pushState({...history.state, hxpane: 1}, ''); } catch (e) {} } return hxOpenPane0.call(this, v, ...a); };
const hxPaneGone = () => { if (HXO.on && !P.stack.length && history.state?.hxpane && history.state.hxo === HXO.tok) { try { POP_SKIP = true; history.back(); } catch (e) {} } };
const hxClosePane0 = closePane; closePane = function (...a) { const r = hxClosePane0.apply(this, a); hxPaneGone(); return r; };
const hxCloseAll0 = closeAllPanes; closeAllPanes = function (...a) { const r = hxCloseAll0.apply(this, a); hxPaneGone(); return r; };
addEventListener('keydown', e => { if (e.key === 'Escape' && HXO.on && !P.stack.length) hxoClose(); });
addEventListener('resize', () => { if (!HXO.on || HXO.busy) return; const card = $('#hxcard svg.hxsvg'); if (!card) return; hxCardShape(false); hxoLay(HXO.el, hxoGeo(card, HXO.i, HXO.el.querySelector('.hxo-top').offsetHeight)); hxoScroll(); });
// Un test noté ou enregistré pendant que la page est ouverte : les chiffres se mettent à jour.
const hxRenderMod0 = renderMod;
renderMod = function (...a) { const r = hxRenderMod0.apply(this, a); if (HXO.on) hxoRefresh(null); return r; };

document.addEventListener('click', async e => {
  const at = q => e.target.closest?.(q); let b;
  if (at('[data-tsprint]')) { try { vaPane('sprint'); } catch (er) {} return; }
  if (HXO.on && at('.hxo-x')) { hxoClose(); return; }
  if (HXO.on && (b = at('[data-hxoper]'))) { const k = b.dataset.hxoper; if (k === HXS.per) return; const prev = hxoD(HXO.k).O.map(x => x.s); HXS.per = k; hxoRefresh(prev); return; }
  if ((b = at('#hxcard [data-hxq]'))) { hxoOpen(b.dataset.hxq); return; }
  if ((b = at('#hxcard [data-hxper]'))) { const k = b.dataset.hxper; if (k === HXS.per) return; const Q = hxVals(), prev = hxOld(Q, addDays(TODAY, -hxPer()[2])).map(o => o.s);
    HXS.per = k; const c = $('#hxcard'); c.innerHTML = hxCardIn(); const O = hxOld(Q, addDays(TODAY, -hxPer()[2])).map(o => o.s), poly = c.querySelector('.hxo'); if (poly) hxTween(poly, prev.map((v, i) => v ?? O[i]), O); return; }
  if ((b = at('[data-hxnote]'))) { const [type, f, id] = b.dataset.hxnote.split('|'), inp = document.getElementById('hxn-' + id), v = +String(inp?.value || '').replace(',', '.');
    const ok = v > 0 && (f === 't' ? v > 1 && v < 10 : f === 'rsi' ? v < 6 : f === 'd' ? v > 100 && v < 400 : v > 5 && v < 75);
    if (!ok) { toast(f === 't' ? 'Temps en secondes, par exemple 1,85' : f === 'rsi' ? 'RSI, par exemple 2,1' : f === 'd' ? 'Distance en cm, par exemple 265' : 'Hauteur en cm, par exemple 48'); return; }
    await saveJumps([...jumps(), {id: uid(), type, date: TODAY, src: 'manuel', [f]: f === 'd' ? Math.round(v) : +v.toFixed(f === 'h' ? 1 : 2)}]); toast('Noté : ' + (JT[type]?.n || 'test')); return; }
});
document.addEventListener('keydown', e => { const g = e.target.closest?.('#hxcard [data-hxq]'); if (g && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); hxoOpen(g.dataset.hxq); } });
