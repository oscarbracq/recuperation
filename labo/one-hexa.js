/* ================= Idée à tester : l'hexagone de tes qualités =================
   6 qualités du sprinteur, chacune notée de 0 à 100 à partir de ses vrais tests de l'appli :
   force (squat / poids du corps), explosivité (CMJ), réactivité (RSI), accélération (10 ou 30 m, ou F0), vitesse max
   (Vmax du profil en sprint, sinon le 60 m), endurance de vitesse (100 m comparé au 60 m).
   Les bornes : 0 = un sportif entraîné qui débute le sprint, 100 = niveau international (Haugen 2019, Suchomel 2016,
   Loturco 2015 pour les ordres de grandeur). C'est une échelle de lecture, pas une norme : elle sert à voir la forme
   de son profil et ce qui bouge d'un test à l'autre. Une qualité sans test s'affiche « à tester ». */
const HX_Q = [
  ['force', 'Force', 'squat ÷ poids du corps', 1.2, 2.6, x => fx(x, 2) + ' × PDC', 'data-rmlist'],
  ['explo', 'Explosivité', 'CMJ', 30, 70, x => fx(x, 1) + ' cm', 'data-tplyo'],
  ['react', 'Réactivité', 'RSI (drop jump, 10/5, pogo)', 1.0, 3.0, x => 'RSI ' + fx(x, 2), 'data-tplyo'],
  ['acc', 'Accélération', '10 m, 30 m ou F0', 0, 1, x => x, 'data-thfvstart'],
  ['vmax', 'Vitesse max', 'Vmax du profil, sinon le 60 m', 0, 1, x => x, 'data-thfvstart'],
  ['send', 'Endurance de vitesse', '100 m ÷ 60 m', 1.66, 1.52, x => '100 m = ' + fx(x, 3) + ' × 60 m', 'data-tsprint']
];
const hxSc = (x, a, b) => Math.round(Math.max(0, Math.min(100, (x - a) / (b - a) * 100)));
const hxNum = s => parseFloat(String(s || '').replace(/''|"|’/g, '.').replace(',', '.')) || null;
function hxVals() {
  const bw = typeof bodyKg === 'function' ? bodyKg() : null, out = {};
  const sq = [['squat', 1], ['halfsquat', .8], ['frontsquat', 1 / .85]].map(([id, k]) => { try { const r = rmOf(id)?.kg; return r ? r * k : 0; } catch (e) { return 0; } }).reduce((a, b) => Math.max(a, b), 0);
  if (sq && bw) out.force = {x: sq / bw};
  const cmj = jBest('cmj'); if (cmj) out.explo = {x: +cmj.h};
  const rs = ['dj', 'rj105', 'pogo'].map(t => jBest(t)).filter(Boolean).map(j => +j.rsi || 0).filter(x => x > 0); if (rs.length) out.react = {x: Math.max(...rs)};
  const hf = tests().filter(x => x.type === 'hfv').sort((a, b) => b.date.localeCompare(a.date))[0], s10 = jBest('spr10'), s30 = jBest('spr30');
  if (s10) out.acc = {s: hxSc(+s10.t, 2.10, 1.60), txt: `10 m en ${fx(+s10.t, 2)} s`}; else if (s30) out.acc = {s: hxSc(+s30.t, 4.6, 3.7), txt: `30 m en ${fx(+s30.t, 2)} s`}; else if (hf?.F0) out.acc = {s: hxSc(+hf.F0, 6, 11), txt: `F0 ${fx(hf.F0, 1)} N/kg`};
  const sp = S.profile?.sprinter || {}, p60 = hxNum(sp.pb60), p100 = hxNum(sp.pb100);
  if (hf?.vmax) out.vmax = {s: hxSc(+hf.vmax, 8.5, 11.8), txt: `${fx(hf.vmax, 2)} m/s`}; else if (p60) out.vmax = {s: hxSc(p60, 8.2, 6.5), txt: `60 m en ${fx(p60, 2)}`};
  if (p60 && p100) out.send = {x: p100 / p60};
  return HX_Q.map(([k, n, how, a, b, f, go]) => { const o = out[k]; if (!o) return {k, n, how, go, s: null};
    return {k, n, how, go, s: o.s ?? hxSc(o.x, a, b), txt: o.txt || f(o.x)}; });
}
function hxSvg(Q) {
  const W = 300, c = W / 2, R = 104, pt = (i, r) => { const a = -Math.PI / 2 + i * Math.PI / 3; return [c + r * Math.cos(a), c + r * Math.sin(a)]; }, poly = f => Q.map((q, i) => pt(i, f(q)).map(v => v.toFixed(1)).join(',')).join(' ');
  const grid = [25, 50, 75, 100].map(g => `<polygon points="${poly(() => R * g / 100)}" class="hxg"/>`).join('') + Q.map((q, i) => `<line x1="${c}" y1="${c}" x2="${pt(i, R)[0]}" y2="${pt(i, R)[1]}" class="hxg"/>`).join('');
  const lab = Q.map((q, i) => { const [x, y] = pt(i, R + 26), an = Math.abs(x - c) < 8 ? 'middle' : x > c ? 'start' : 'end';
    return `<text x="${x.toFixed(1)}" y="${(y + 4).toFixed(1)}" text-anchor="${an}" class="hxl">${esc(q.n)}</text><text x="${x.toFixed(1)}" y="${(y + 18).toFixed(1)}" text-anchor="${an}" class="hxv">${q.s == null ? 'à tester' : q.s}</text>`; }).join('');
  const dots = Q.map((q, i) => q.s == null ? '' : `<circle cx="${pt(i, R * q.s / 100)[0].toFixed(1)}" cy="${pt(i, R * q.s / 100)[1].toFixed(1)}" r="3.5" class="hxd"/>`).join('');
  return `<svg viewBox="-105 -10 510 330" class="hxsvg" role="img" aria-label="Hexagone de tes qualités">${grid}<polygon points="${poly(q => R * (q.s ?? 0) / 100)}" class="hxp"/>${dots}${lab}</svg>`;
}
function hexPane() {
  openPane({title: 'L\'hexagone de tes qualités', render: () => { const Q = hxVals(), on = Q.filter(q => q.s != null).sort((a, b) => b.s - a.s);
    return `<div class="card" style="margin-top:14px">${hxSvg(Q)}
      ${on.length >= 2 ? `<p class="small" style="margin:4px 2px 0"><b>Ta qualité la plus haute :</b> ${esc(on[0].n.toLowerCase())} (${on[0].s}). <b>La plus basse :</b> ${esc(on.at(-1).n.toLowerCase())} (${on.at(-1).s}). Un sprinteur progresse le plus en remontant la plus basse.</p>` : ''}</div>
      <div class="list" style="margin-top:12px">${Q.map(q => `<button type="button" class="rowbtn" ${q.go}><span><b>${esc(q.n)}${q.s != null ? ' · ' + q.s : ''}</b><span class="meta">${q.s != null ? esc(q.txt) + ' · ' : 'à tester · '}${esc(q.how)}</span></span>${ICON.chev}</button>`).join('')}</div>
      <p class="small muted" data-tip="1" style="margin:10px 4px 0">0 = sportif entraîné qui débute le sprint, 100 = niveau international. C'est une échelle pour lire la forme de ton profil, pas une note. Chaque nouveau test la met à jour.</p>`; }});
}
document.addEventListener('click', e => { if (e.target.closest?.('[data-tsprint]')) { try { vaPane('sprint'); } catch (er) {} } });
if (typeof IDEAS !== 'undefined') IDEAS.splice(3, 0, ['hexa', 'Prête', 'L\'hexagone de tes qualités', 'Tes 6 qualités de sprinteur sur un hexagone, notées de 0 à 100 à partir de tes vrais tests : force, explosivité, réactivité, accélération, vitesse max, endurance de vitesse. Pour voir d\'un coup d\'œil celle à remonter.', () => hexPane()]);
