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
const HXP = [['sem', 'Semaine', 7, 'il y a 1 semaine'], ['mois', 'Mois', 30, 'il y a 1 mois'], ['tri', '3 mois', 91, 'il y a 3 mois'], ['an', 'Année', 365, 'il y a 1 an']];
const HXS = {per: 'mois', open: null, anim: false, shown: null};
const hxPt = (i, r, c = 150) => { const a = -Math.PI / 2 + i * Math.PI / 3; return [c + r * Math.cos(a), c + r * Math.sin(a)]; };
const hxPoly = sc => sc.map((v, i) => hxPt(i, 104 * (v ?? 0) / 100).map(z => z.toFixed(1)).join(',')).join(' ');
// L'hexagone : la grille, l'hexagone d'avant (autre couleur, en pointillés) sous l'hexagone d'aujourd'hui.
function hxSvg(Q, O) {
  const R = 104, c = 150;
  const grid = [25, 50, 75, 100].map(g => `<polygon points="${hxPoly(Q.map(() => g))}" class="hxg"/>`).join('') + Q.map((q, i) => `<line x1="${c}" y1="${c}" x2="${hxPt(i, R)[0].toFixed(1)}" y2="${hxPt(i, R)[1].toFixed(1)}" class="hxg"/>`).join('');
  const lab = Q.map((q, i) => { const [x, y] = hxPt(i, R + 26), an = Math.abs(x - c) < 8 ? 'middle' : x > c ? 'start' : 'end', d = O && q.s != null && O[i].s != null ? q.s - O[i].s : null;
    const L = q.n.length > 13 ? q.n.split(/ (?=de )/) : [q.n], dy = (L.length - 1) * 18, y0 = y + 4 - (i === 3 ? 0 : dy / 2);
    return `<g class="hxk" data-hxk="${q.k}"><text x="${x.toFixed(1)}" y="${y0.toFixed(1)}" text-anchor="${an}" class="hxl">${L.map((t, j) => `<tspan x="${x.toFixed(1)}" dy="${j ? 18 : 0}">${esc(t)}</tspan>`).join('')}</text><text x="${x.toFixed(1)}" y="${(y0 + dy + 19).toFixed(1)}" text-anchor="${an}" class="hxv">${q.s == null ? 'à tester' : q.s}${d ? `<tspan class="${d > 0 ? 'hxu' : 'hxdn'}"> ${d > 0 ? '+' : '−'}${Math.abs(d)}</tspan>` : ''}</text></g>`; }).join('');
  const dots = Q.map((q, i) => q.s == null ? '' : `<circle cx="${hxPt(i, R * q.s / 100)[0].toFixed(1)}" cy="${hxPt(i, R * q.s / 100)[1].toFixed(1)}" r="3.5" class="hxd"/>`).join('');
  const old = O ? `<polygon points="${hxPoly(O.map(o => o.s))}" class="hxo"/>` : '';
  return `<svg viewBox="-112 -14 524 346" class="hxsvg" role="img" aria-label="Hexagone de tes qualités physiques">${grid}${old}<polygon points="${hxPoly(Q.map(q => q.s))}" class="hxp"/>${dots}${lab}</svg>`;
}
// Les formes bougent en douceur : de l'ancienne forme à la nouvelle en 0,45 s.
function hxTween(poly, from, to, ms = 450) {
  if (!poly) return; const t0 = performance.now(), ease = t => 1 - Math.pow(1 - t, 3);
  const step = now => { const k = ease(Math.min(1, (now - t0) / ms)); poly.setAttribute('points', hxPoly(to.map((v, i) => (from[i] ?? 0) + ((v ?? 0) - (from[i] ?? 0)) * k))); if (k < 1 && poly.isConnected) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}
const hxDate = d => d ? fmtShort(d) : 'date inconnue';
function hxDetail(q) {
  const T = q.T, hasNote = T.filter(t => t.jt);
  return `<div class="hxdin"><p class="small" style="margin:2px 0 8px">${esc(q.q.why)}</p>
    <div class="hxtt">${T.map(t => `<div class="hxtr${t.r ? '' : ' off'}"><span><b>${esc(t.n)}</b><small>${t.r ? esc(t.r.txt) + ' · ' + esc(hxDate(t.r.date)) : 'pas encore testé'}</small></span><span class="hxsc">${t.sc ?? '–'}</span><small class="hxref">0 = ${esc(fx(t.a, t.a % 1 ? 2 : 0))} · 100 = ${esc(fx(t.b, t.b % 1 ? 2 : 0))} ${esc(t.u)} · compte pour ${Math.round(t.w * 100)} %</small></div>`).join('')}</div>
    ${[...new Map(T.filter(t => t.go).map(t => [t.go, t])).values()].map(t => `<button type="button" class="btn ghost hxgo" ${t.go}>Faire le test : ${esc(t.gn)}</button>`).join('')}
    ${q.k === 'force' ? '<button type="button" class="btn ghost hxgo" data-rmlist>Noter un max à la main</button>' : ''}
    ${hasNote.length ? `<div class="hxnote"><span class="eyebrow">Noter un résultat à la main</span>${hasNote.map(t => `<div class="row"><label for="hxn-${t.id}">${esc(t.n)}</label><span><input class="mini-in" id="hxn-${t.id}" inputmode="decimal" style="width:76px" placeholder="${esc(t.f === 't' ? 's' : t.f === 'rsi' ? 'RSI' : 'cm')}"> <button type="button" class="chip" data-hxnote="${t.jt}|${t.f}|${t.id}">Noter</button></span></div>`).join('')}<p class="small muted" data-tip="1" style="margin:6px 2px 0">Un test fait dans l'appli se note tout seul ici. À la main : pour un test mesuré ailleurs (cellules, My Jump, plateforme).</p></div>` : ''}
    <p class="small muted" data-tip="1" style="margin:8px 2px 0">Sources : ${esc(q.q.src)}.</p></div>`;
}
function hxBody() {
  const Q = hxVals(), p = HXP.find(x => x[0] === HXS.per), D = addDays(TODAY, -p[2]), O = hxOld(Q, D), on = Q.filter(q => q.s != null).sort((a, b) => b.s - a.s);
  const same = Q.every((q, i) => q.s === O[i].s), none = O.every(o => o.s == null);
  return `<div class="seg hxseg" role="group" aria-label="Comparer avec">${HXP.map(([k, l]) => `<button type="button" data-hxper="${k}" aria-pressed="${k === HXS.per}">${l}</button>`).join('')}</div>
    <div class="card hxcard">${hxSvg(Q, none ? null : O)}
      <div class="hxleg"><span><i class="now"></i>Aujourd'hui</span><span><i class="old"></i>${esc(cap(p[3]))} · ${esc(fmtShort(D))}</span></div>
      ${none ? `<p class="small muted" data-tip="1" style="margin:4px 2px 0">Pas encore de test ${esc(p[3])} : l'hexagone d'avant apparaîtra avec tes prochains tests.</p>` : same ? `<p class="small muted" data-tip="1" style="margin:4px 2px 0">Aucun test nouveau depuis ${esc(p[3].replace('il y a ', ''))} : les deux formes sont les mêmes.</p>` : ''}
      ${on.length >= 2 ? `<p class="small" style="margin:6px 2px 0"><b>Ta plus haute :</b> ${esc(on[0].n.toLowerCase())} (${on[0].s}). <b>Ta plus basse :</b> ${esc(on.at(-1).n.toLowerCase())} (${on.at(-1).s}).</p>` : ''}</div>
    <div class="list hxlist">${Q.map((q, i) => { const d = q.s != null && O[i].s != null ? q.s - O[i].s : null, open = HXS.open === q.k;
      return `<div class="hxrow${open ? ' on' : ''}" data-hxrow="${q.k}"><button type="button" class="rowbtn" data-hxk="${q.k}" aria-expanded="${open}"><span><b>${esc(q.n)}${q.s != null ? ' · ' + q.s : ''}${d ? ` <em class="${d > 0 ? 'hxu' : 'hxdn'}">${d > 0 ? '+' : '−'}${Math.abs(d)}</em>` : ''}</b><span class="meta">${q.s != null ? `${q.n0} test${q.n0 > 1 ? 's' : ''} sur ${q.T.length}${q.est ? ' · estimée' : ''} · ${esc(hxDate(q.date))}` : 'à tester'} · ${esc(q.q.s)}</span></span><i class="hxchev">${ICON.chev}</i></button>
        <div class="hxdet">${hxDetail(q)}</div></div>`; }).join('')}</div>
    <p class="small muted" data-tip="1" style="margin:10px 4px 0">0 = sportif entraîné qui débute le sprint (≈ 13″5 au 100 m), 100 = sprinteur international (≈ 10″10). Chaque qualité est la moyenne de ses tests, pondérée par leur lien avec le sprint. Un test compte 6 mois. Touche une qualité pour voir ses tests et faire le bon.</p>`;
}
function hexPane() {
  HXS.anim = true;
  openPane({title: 'Tes qualités physiques', render: hxBody});
  requestAnimationFrame(() => { if (!HXS.anim) return; HXS.anim = false; const b = $('#pane-body'), Q = hxVals(), O = hxOld(Q, addDays(TODAY, -HXP.find(x => x[0] === HXS.per)[2])), z = Q.map(() => 0);
    hxTween(b?.querySelector('.hxp'), z, Q.map(q => q.s), 650); hxTween(b?.querySelector('.hxo'), z, O.map(o => o.s), 650); HXS.shown = O.map(o => o.s); });
}
document.addEventListener('click', async e => {
  const at = q => e.target.closest?.(q); let b;
  if (at('[data-tsprint]')) { try { vaPane('sprint'); } catch (er) {} return; }
  if ((b = at('[data-hxper]'))) { const k = b.dataset.hxper; if (k === HXS.per) return; const Q = hxVals(), prev = hxOld(Q, addDays(TODAY, -HXP.find(x => x[0] === HXS.per)[2])).map(o => o.s); HXS.per = k;
    const sc = $('#pane-scroll'), y = sc?.scrollTop; paneRender(); if (sc) sc.scrollTop = y;
    const O = hxOld(Q, addDays(TODAY, -HXP.find(x => x[0] === k)[2])).map(o => o.s), poly = $('#pane-body .hxo'); if (poly) hxTween(poly, prev.map((v, i) => v ?? O[i]), O); return; }
  if ((b = at('[data-hxk]')) && b.closest('#pane-body')) { const k = b.dataset.hxk, row = $(`#pane-body [data-hxrow="${k}"]`); if (!row) return;
    const was = HXS.open === k; document.querySelectorAll('#pane-body .hxrow.on').forEach(r => { r.classList.remove('on'); r.querySelector('[aria-expanded]')?.setAttribute('aria-expanded', 'false'); });
    HXS.open = was ? null : k; if (!was) { row.classList.add('on'); row.querySelector('[aria-expanded]')?.setAttribute('aria-expanded', 'true');
      if (b.tagName !== 'BUTTON') setTimeout(() => row.scrollIntoView({behavior: 'smooth', block: 'start'}), 60); } return; }
  if ((b = at('[data-hxnote]'))) { const [type, f, id] = b.dataset.hxnote.split('|'), inp = $('#hxn-' + id), v = +String(inp?.value || '').replace(',', '.');
    const ok = v > 0 && (f === 't' ? v > 1 && v < 10 : f === 'rsi' ? v < 6 : f === 'd' ? v > 100 && v < 400 : v > 5 && v < 75);
    if (!ok) { toast(f === 't' ? 'Temps en secondes, par exemple 1,85' : f === 'rsi' ? 'RSI, par exemple 2,1' : f === 'd' ? 'Distance en cm, par exemple 265' : 'Hauteur en cm, par exemple 48'); return; }
    const j = {id: uid(), type, date: TODAY, src: 'manuel', [f]: f === 'd' ? Math.round(v) : +v.toFixed(f === 'h' ? 1 : 2)};
    const sc = $('#pane-scroll'), y = sc?.scrollTop; await saveJumps([...jumps(), j]); if (sc) sc.scrollTop = y; toast('Noté : ' + (JT[type]?.n || 'test')); return; }
});
if (typeof IDEAS !== 'undefined') IDEAS.splice(3, 0, ['hexa', 'Prête', 'Tes qualités physiques', 'Tes 6 qualités de sprinteur sur un hexagone, notées de 0 à 100 avec tes vrais tests : force, explosivité, réactivité, accélération, vitesse max, endurance de vitesse. Compare avec il y a une semaine, un mois ou un an.', () => hexPane()]);
