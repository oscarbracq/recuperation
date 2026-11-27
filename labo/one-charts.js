/* ================= Graphiques au doigt et à la souris =================
   La bulle (la valeur) n'apparaît que pendant que le doigt ou la souris est sur le graphique, et part avec lui.
   Avant, au téléphone, la dernière valeur restait affichée (tonnage, sprint…). « Intensité et volume » se lit aussi
   au doigt : volume et intensité de la période touchée. */
initCharts = function () {};
const chOff = b => { const sc = b.querySelector('.sc'), bu = b.querySelector('.bubble'); if (sc) sc.innerHTML = ''; if (bu) bu.hidden = true; };
const chAllOff = () => document.querySelectorAll('.chartbox, .dualbox').forEach(chOff);
document.addEventListener('pointerup', e => { if (e.pointerType !== 'mouse') chAllOff(); });
document.addEventListener('pointercancel', chAllOff);

// Intensité et volume : une boîte autour du graphique, la même bulle que les autres.
const DU = {}; let duId = 0;
const chDual0 = dualChart;
dualChart = function (pts, vKey, iKey, vUnit, vDiv = 1) {
  const id = 'd' + (++duId), W0 = typeof isPC === 'function' && isPC() ? 760 : 340;
  DU[id] = {W0, H: 160, L: 8, R: 8, Bm: 22, n: pts.length, P: pts.map(p => ({tip: p.tip, v: (p[vKey] || 0) / vDiv, i: p[iKey]})), u: vUnit, dec: vDiv > 1 ? 1 : 0};
  return `<div class="dualbox" data-du="${id}">${chDual0(pts, vKey, iKey, vUnit, vDiv).replace(/<\/svg>$/, '<g class="sc"></g></svg>')}<div class="bubble" hidden></div></div>`;
};
function duTo(box, e) {
  const c = DU[box.dataset.du]; if (!c || !c.n) return;
  const r = box.querySelector('svg').getBoundingClientRect(), x = (e.clientX - r.left) / r.width * c.W0, bw = (c.W0 - c.L - c.R) / c.n;
  const i = Math.max(0, Math.min(c.n - 1, Math.floor((x - c.L) / bw))), p = c.P[i];
  box.querySelector('.sc').innerHTML = `<rect x="${(c.L + i * bw).toFixed(1)}" y="4" width="${bw.toFixed(1)}" height="${c.H - c.Bm - 4}" rx="4" class="duhl"/>`;
  const b = box.querySelector('.bubble');
  b.innerHTML = `<b>${fx(p.v, c.dec)}${c.u ? ' ' + esc(c.u) : ''}</b><em>${esc(p.tip || '')}${p.i != null ? ' · intensité ' + fx(p.i) + ' %' : ''}</em>`; b.hidden = false;
  const bx = box.getBoundingClientRect(), px = (c.L + (i + .5) * bw) / c.W0 * r.width + (r.left - bx.left), half = Math.min(b.offsetWidth, bx.width) / 2;
  b.style.left = Math.max(half, Math.min(bx.width - half, px)) + 'px';
}
let DUB = null;
document.addEventListener('pointerdown', e => { const b = e.target.closest?.('.dualbox'); if (!b) return; DUB = b; duTo(b, e); });
document.addEventListener('pointermove', e => { const b = e.target.closest?.('.dualbox'); if (b && (DUB === b || e.pointerType === 'mouse')) duTo(b, e); });
document.addEventListener('pointerup', () => { DUB = null; });
document.addEventListener('pointercancel', () => { DUB = null; });
document.addEventListener('pointerout', e => { if (e.pointerType !== 'mouse') return; const b = e.target.closest?.('.dualbox'); if (b && !b.contains(e.relatedTarget)) chOff(b); });
