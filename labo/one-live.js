/* ================= La séance en cours : le temps, la fin de chaque exercice, le corps de la séance =================
   - En haut : le chrono, la durée prévue, l'heure de fin prévue, et si Oscar est en avance ou en retard (détail repliable).
   - Chaque exercice : « Terminer l'exercice » en bas, même si toutes les séries ne sont pas faites ; il se replie en une ligne.
   - Fin de séance : le corps avec les muscles de CETTE séance (rouge = le plus sollicité, orange = moyen, vert = peu). */
// Le temps prévu d'un exercice, en minutes : effort (40 s par série, ou la course) + récup + séries de montée.
function liveItemMin(it, i) {
  const L = S.live, tg = it.tg || {}, arr = it.sets || it.reps || [];
  if (it.test) return 5;
  if (tg.min && !arr.length) return +tg.min;
  if (exOf(it.ex).u === 'min') return arr.reduce((a, r) => a + (+r.min || +tg.min || 0), 0) || +tg.min || 10;
  const linked = L.items[i + 1]?.tg?.link && it.sets, rest = linked ? 15 : +(it.rest ?? tg.rest ?? 60) || 60;
  const uni = arr.some(x => x.side), work = it.reps ? (+tg.dist || +arr[0]?.dist || 30) / 6 : 40;
  const ramp = it.sets && unitOf(it) === 'reps' ? rampText(it.ex, +(arr[0]?.kg || 0), +(tg.reps || arr[0]?.reps || 0), true).length : 0;
  return (arr.length * work + (uni ? arr.length / 2 : arr.length) * rest + ramp * 75) / 60;
}
// Le plan minute par minute, depuis « Commencer la séance » : l'échauffement d'abord, puis chaque exercice.
function livePlanT() {
  const L = S.live; let t = L.warm ? warmMin(L.warm) : 0; const out = [];
  L.items.forEach((it, i) => { const a = t; t += liveItemMin(it, i); out.push({a, b: t}); });
  return {list: out, total: t + (L.cool?.min || 0)};
}
const liveEl = ms => (ms - new Date(S.live.start)) / 60000;
// Quand l'exercice a été fini : le bouton « Terminer l'exercice », sinon sa dernière série si toutes sont faites.
function liveItemEnd(it) {
  if (it.fin) return it.fin;
  const arr = it.sets || it.reps || []; if (!arr.length || !arr.every(x => x.done)) return null;
  const ts = arr.map(x => x.at).filter(Boolean); return ts.length ? Math.max(...ts) : null;
}
const mm = m => { m = Math.max(0, Math.round(m)); return m < 60 ? m + ' min' : Math.floor(m / 60) + ' h ' + String(m % 60).padStart(2, '0'); };
const gapTxt = d => Math.abs(d) < 1.5 ? 'dans les temps' : d < 0 ? `${Math.round(-d)} min d'avance` : `${Math.round(d)} min de retard`;
const gapCls = d => Math.abs(d) < 1.5 ? 'ok' : d < 0 ? 'ok' : d <= 8 ? 'mid' : 'bad';
// L'écart du moment : le dernier exercice fini, sinon l'exercice en cours s'il dépasse déjà sa fin prévue.
function liveGap() {
  const L = S.live, P = livePlanT(); let gap = null;
  L.items.forEach((it, i) => { const e = liveItemEnd(it); if (e) gap = liveEl(e) - P.list[i].b; });
  const cur = L.items.findIndex(it => !liveItemEnd(it)), now = liveEl(Date.now());
  if (cur >= 0 && now > P.list[cur].b) gap = Math.max(gap ?? -Infinity, now - P.list[cur].b);
  return {P, gap, cur};
}
function liveTimeCard() {
  const L = S.live; if (!L?.start || !L.items.length) return '';
  const {P, gap, cur} = liveGap(), now = liveEl(Date.now()), endAt = new Date(new Date(L.start).getTime() + (P.total + (gap > 0 ? gap : 0)) * 60000);
  const pc = Math.min(100, now / Math.max(1, P.total) * 100), hh = d => `${d.getHours()} h ${String(d.getMinutes()).padStart(2, '0')}`;
  const rows = L.items.map((it, i) => { const e = liveItemEnd(it), d = e ? liveEl(e) - P.list[i].b : null;
    return `<div class="ltr${i === cur ? ' cur' : ''}"><span>${esc(exOf(it.ex).n)}</span><span>${mm(P.list[i].b)}</span><span>${e ? mm(liveEl(e)) : i === cur ? 'en cours' : '–'}</span><b class="${d == null ? '' : gapCls(d)}">${d == null ? '' : Math.abs(d) < 1.5 ? '=' : (d > 0 ? '+' : '−') + Math.round(Math.abs(d))}</b></div>`; }).join('');
  return `<div class="card ltime"><div class="lthead"><div><span class="eyebrow">Chrono</span><b class="num" data-lchrono>${liveChrono()}</b></div>
    <div class="ltr2"><span>Prévu <b>${mm(P.total)}</b></span><span>Fin vers <b>${hh(endAt)}</b></span></div></div>
    <div class="ltbar"><i style="width:${pc.toFixed(1)}%"></i>${P.list.map(x => `<em style="left:${(x.b / Math.max(1, P.total) * 100).toFixed(1)}%"></em>`).join('')}</div>
    ${gap != null ? `<span class="ltgap ${gapCls(gap)}">${gapTxt(gap)}</span>` : '<span class="ltgap">Le chrono tourne : bonne séance</span>'}
    <details class="ltdet"><summary>Détail</summary><div class="ltr hd"><span>Exercice</span><span>Prévu</span><span>Réel</span><span>Écart</span></div>${rows}<p class="small muted" style="margin:8px 2px 0">Depuis le début. Prévu : 40 s par série + ta récup.</p></details></div>`;
}
// Le petit repère au-dessus de chaque exercice.
function exTimeChip(i) {
  const L = S.live; if (!L?.start) return ''; const {list} = livePlanT(), x = list[i]; if (!x) return '';
  const now = liveEl(Date.now()), late = now > x.b && !liveItemEnd(L.items[i]);
  return `<div class="extime${late ? ' late' : ''}">Prévu de ${mm(x.a)} à ${mm(x.b)}${late ? ` · ${Math.round(now - x.b)} min de retard` : ''}</div>`;
}
function exFinBox(it, i) {
  const arr = it.sets || it.reps || [], n = arr.filter(x => x.done).length, e = liveItemEnd(it), P = livePlanT().list[i], d = e && P ? liveEl(e) - P.b : null;
  return `<div class="exbox exdone"><span class="exck">${TICK}</span><span class="exdt"><b>${esc(exOf(it.ex).n)}</b><small>${n}/${arr.length} série${arr.length > 1 ? 's' : ''}${e ? ` · fini à ${mm(liveEl(e))}` : ''}${d != null ? ` · <i class="${gapCls(d)}">${gapTxt(d)}</i>` : ''}</small></span><button type="button" class="chip" data-tlreopen="${i}">Rouvrir</button></div>`;
}
document.addEventListener('click', e => {
  const L = S.live; if (!L) return; let b;
  if ((b = e.target.closest?.('[data-tlfin]'))) { const t = Date.now(); for (const k of b.dataset.tlfin.split(',').map(Number)) if (L.items[k]) L.items[k].fin = t; saveLive(); paneRender(); if (PREFS.haptic) navigator.vibrate?.(16); toast('Exercice terminé'); return; }
  if ((b = e.target.closest?.('[data-tlreopen]'))) { const it = L.items[+b.dataset.tlreopen]; if (it) delete it.fin; saveLive(); paneRender(); }
});
// Le chrono et l'avance / le retard se mettent à jour toutes les 30 s pendant la séance.
setInterval(() => { const c = document.querySelector('.ltime'); if (!c || !S.live || document.activeElement?.matches?.('input,textarea')) return; const o = c.querySelector('.ltdet')?.open, n = document.createElement('div'); n.innerHTML = liveTimeCard(); const k = n.firstElementChild; if (!k) return; if (o) k.querySelector('.ltdet').open = true; c.replaceWith(k); }, 30000);
// Fin de séance : les muscles de cette séance seulement, du plus sollicité (rouge) au moins sollicité (vert).
function finBody() {
  const L = S.live; if (!L || L.kind === 'class') return '';
  const m = logMuscle({items: L.items.filter(it => !it.test).map(it => it.sets ? {ex: it.ex, u: it.u, sets: it.sets.filter(x => x.done)} : {ex: it.ex, ...(it.p || {}), cones: it.tg?.cones, feet: it.tg?.feet, hn: it.tg?.hn, pct: it.p?.pct ?? it.tg?.pct, reps: (it.reps || []).filter(x => x.done)})});
  const mx = Math.max(0, ...Object.values(m)); if (!(mx > 0)) return '';
  const per = {}; for (const [k] of MUS) per[k] = {load: 0, pct: 0}; for (const v of ['front', 'back']) for (const [k] of MZ[v]) per[k] ||= {load: 0, pct: 0};
  for (const [k, v] of Object.entries(m)) { if (!(v > 0)) continue; const r = v / mx; per[k] = {load: v, pct: r >= .66 ? 115 : r >= .33 ? 85 : 45}; }
  const top = Object.entries(m).filter(([, v]) => v / mx >= .66).sort((a, b) => b[1] - a[1]).map(([k]) => MUSI[k]?.n).filter(Boolean).slice(0, 4);
  return `<div class="sec-label">Les muscles de cette séance</div><div class="card livebody fin"><div class="mbody nohit">${musFigure('front', per, null)}${musFigure('back', per, null)}</div>
    <div class="mlegend"><span><i style="background:var(--bad)"></i>très sollicités</span><span><i style="background:var(--warn)"></i>moyennement</span><span><i style="background:var(--good)"></i>peu</span></div>
    ${top.length ? `<p class="small muted" style="margin:8px 2px 0">Le plus travaillé : ${esc(top.join(', ').toLowerCase())}.</p>` : ''}</div>`;
}
