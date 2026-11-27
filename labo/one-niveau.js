/* ================= Ton niveau FFA : la courbe des niveaux, du D7 à l'IA =================
   Barème FFA hommes (classement des clubs, athle.fr « Barèmes Hommes », toujours en vigueur en 2025-2026) :
   pour chaque niveau, ses points et le temps à battre au 60 m en salle et au 100 m. Une performance égale ou meilleure
   que le temps du niveau donne ce niveau. En bas, 0,30 à 0,40 s séparent deux niveaux ; en haut, 0,10 s : chaque
   centième y coûte bien plus cher. La courbe le montre : elle se redresse quand on monte. */
const FFA_LV = [ // du plus bas au plus haut : [niveau, points, 60 m, 100 m]
  ['D7', 2, 9.04, 14.14], ['D6', 3, 8.84, 13.74], ['D5', 4, 8.64, 13.44], ['D4', 5, 8.54, 13.14], ['D3', 6, 8.44, 12.94], ['D2', 7, 8.34, 12.74], ['D1', 8, 8.24, 12.54],
  ['R6', 10, 8.14, 12.44], ['R5', 11, 8.04, 12.34], ['R4', 12, 7.94, 12.24], ['R3', 13, 7.84, 12.14], ['R2', 14, 7.74, 11.94], ['R1', 15, 7.64, 11.74],
  ['IR4', 18, 7.54, 11.54], ['IR3', 19, 7.44, 11.44], ['IR2', 20, 7.34, 11.34], ['IR1', 21, 7.24, 11.14],
  ['N4', 24, 7.14, 10.94], ['N3', 26, 6.94, 10.84], ['N2', 28, 6.84, 10.64], ['N1', 30, 6.74, 10.34], ['IB', 35, 6.66, 10.20], ['IA', 40, 6.56, 10.10]];
const lvT = x => fx(x, 2).replace(',', '″');
// Où tombe un temps : le niveau atteint (index) et la position entre deux niveaux (pour placer le point sur la courbe).
function lvPos(t, col) {
  if (!(t > 0)) return null; const c = col === 60 ? 2 : 3; let i = -1;
  for (let k = 0; k < FFA_LV.length; k++) if (t <= FFA_LV[k][c] + 1e-9) i = k;
  const nx = FFA_LV[i + 1], cur = FFA_LV[i];
  const pos = i < 0 ? -Math.min(.8, (t - FFA_LV[0][c]) / .4) : !nx ? i : i + (cur[c] - t) / (cur[c] - nx[c]);
  return {i, pos, lv: cur?.[0] || 'sous D7', pts: cur?.[1] || 0, next: nx ? {lv: nx[0], t: nx[c], gap: t - nx[c]} : null};
}
function lvSvg(p100, p60) {
  const N = FFA_LV.length, RH = 25, top = 26, H = top + N * RH + 10, x0 = 66, x1 = 246, t0 = 14.24, t1 = 10.10;
  const X = t => x0 + (t0 - t) / (t0 - t1) * (x1 - x0), Y = i => top + (N - 1 - i) * RH + RH / 2;
  const P = FFA_LV.map((l, i) => [X(l[3]), Y(i)]);
  // Courbe lisse (Catmull-Rom → Bézier) passant par chaque niveau.
  const path = pts => pts.map((p, i) => { if (!i) return `M${p[0].toFixed(1)},${p[1].toFixed(1)}`; const a = pts[i - 2] || pts[i - 1], b = pts[i - 1], d = pts[i + 1] || p;
    return `C${(b[0] + (p[0] - a[0]) / 6).toFixed(1)},${(b[1] + (p[1] - a[1]) / 6).toFixed(1)} ${(p[0] - (d[0] - b[0]) / 6).toFixed(1)},${(p[1] - (d[1] - b[1]) / 6).toFixed(1)} ${p[0].toFixed(1)},${p[1].toFixed(1)}`; }).join('');
  const at = pos => { const i = Math.max(0, Math.min(N - 1, Math.floor(pos))), f = Math.max(0, pos - i), a = P[i], b = P[Math.min(N - 1, i + 1)]; return pos < 0 ? [x0 - 6, Y(0) + (-pos) * RH] : [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]; };
  const me = p100 || p60, cut = me ? Math.max(0, Math.floor(me.pos)) : -1;
  const done = cut >= 0 ? path([...P.slice(0, cut + 1), at(me.pos)]) : '', rest = path(me ? [at(Math.max(0, me.pos)), ...P.slice(cut + 1)] : P);
  const rows = FFA_LV.map((l, i) => { const y = Y(i), mine = p100?.i === i || p60?.i === i;
    return `${mine ? `<rect x="0" y="${(y - RH / 2 + 1).toFixed(1)}" width="340" height="${RH - 2}" rx="7" class="lvband"/>` : ''}
      <text x="8" y="${(y + 4).toFixed(1)}" class="lvn${mine ? ' on' : ''}">${l[0]}</text><text x="54" y="${(y + 4).toFixed(1)}" text-anchor="end" class="lvp">${l[1]}</text>
      <text x="294" y="${(y + 4).toFixed(1)}" text-anchor="end" class="lvt${p60?.i === i ? ' on' : ''}">${lvT(l[2])}</text><text x="334" y="${(y + 4).toFixed(1)}" text-anchor="end" class="lvt${p100?.i === i ? ' on' : ''}">${lvT(l[3])}</text>`; }).join('');
  const dots = P.map((p, i) => `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="2.6" class="lvd${me && i <= me.pos ? ' on' : ''}"/>`).join('');
  const mk = (o, cls, lab) => { if (!o) return ''; const [x, y] = at(o.pos); return `<g class="${cls}"><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="7"/><text x="${(x - 11).toFixed(1)}" y="${(y + 4).toFixed(1)}" text-anchor="end">${lab}</text></g>`; };
  return `<svg viewBox="0 0 340 ${H}" class="lvsvg" role="img" aria-label="Courbe des niveaux FFA, du D7 à l'IA, avec ta position">
    <text x="8" y="14" class="lvh">Niv.</text><text x="54" y="14" text-anchor="end" class="lvh">pts</text><text x="294" y="14" text-anchor="end" class="lvh">60 m</text><text x="334" y="14" text-anchor="end" class="lvh">100 m</text>
    ${rows}<path d="${rest}" class="lvrest"/>${done ? `<path d="${done}" class="lvdone"/>` : ''}${dots}${mk(p60, 'lvme60', '60 m')}${mk(p100, 'lvme', '100 m')}</svg>`;
}
function lvPane() {
  openPane({title: 'Ton niveau', render: () => {
    const sp = S.profile?.sprinter || {}, t100 = hxNum(sp.pb100), t60 = hxNum(sp.pb60), a = lvPos(t100, 100), b = lvPos(t60, 60);
    const box = (d, t, o) => !o ? `<div class="lvbox"><span class="eyebrow">${d}</span><b>–</b><small>pas encore de temps</small></div>` : `<div class="lvbox"><span class="eyebrow">${d} · ${lvT(t)}</span><b>${esc(o.lv)}${o.pts ? ` <small>${o.pts} pts</small>` : ''}</b><small>${o.next ? `${esc(o.next.lv)} en ${lvT(o.next.t)} : encore ${fx(o.next.gap, 2)} s` : 'le plus haut niveau'}</small></div>`;
    const path = (o, c, d) => { if (!o) return ''; const L = FFA_LV.slice(o.i + 1, o.i + 4), t = c === 60 ? t60 : t100; return L.length ? `<div class="lvpath"><span class="eyebrow">Chemin · ${d}</span>${L.map(l => `<div class="lvstep"><b>${l[0]}</b><span>${lvT(l[c === 60 ? 2 : 3])}</span><em>−${fx(t - l[c === 60 ? 2 : 3], 2)} s</em></div>`).join('')}</div>` : ''; };
    return `<div class="lvtop">${box('100 m', t100, a)}${box('60 m', t60, b)}</div>
      ${sp.level ? `<p class="small" style="margin:8px 4px 0">Ta fiche FFA : <b>${esc(sp.level)}</b>${sp.pb60Note ? ` · 60 m ${esc(sp.pb60Note)}` : ''}.</p>` : ''}
      <div class="card lvcard">${lvSvg(a, b)}</div>
      <div class="lvpaths">${path(a, 100, '100 m')}${path(b, 60, '60 m')}</div>
      <p class="small muted" data-tip="1" style="margin:10px 4px 0">La courbe se redresse en montant : entre deux niveaux du bas, il y a 0,20 à 0,40 s au 100 m ; tout en haut, 0,10 s, et chacun de ces centièmes demande des années. Barème FFA hommes du classement des clubs : un temps égal ou meilleur que celui du niveau le donne. Le niveau de ta fiche FFA peut venir d'une autre course ou d'un autre barème.</p>`;
  }});
}
const sprinterCard0 = sprinterCard;
sprinterCard = function () { return `<div class="lvbtn" role="button" tabindex="0" data-lvl aria-label="Voir la courbe des niveaux FFA">${sprinterCard0()}</div>`; };
document.addEventListener('click', e => { if (e.target.closest?.('[data-lvl]')) lvPane(); });
