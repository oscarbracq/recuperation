/* ================= Adaptation de la prochaine séance =================
   Sous « Créer une séance » : pour la prochaine séance de muscu, le préparateur propose de changer le dernier exercice
   pour rééquilibrer une chaîne en retard (durer, pas seulement performer). Sources : la charge par muscle sur 7 jours
   (balEx, paires de muscles opposés) et, quand l'IA est activée, les propositions écrites avec le skill prepa-physique
   (analysis/coach.adapt). On applique d'un geste, et on peut revenir en arrière. */
function adNext() {
  const n = typeof nextSess === 'function' ? nextSess('gym') : null; if (!n) return null;
  const p = S.plans?.[n.p.id] || n.p; return {k: n.k, p, mine: !!S.plans?.[n.p.id], gym: S.tset?.gymPlan?.[n.p.id] || 'dmarcq'};
}
function adProps(nx) {
  const p = nx.p, items = (p.items || []).filter(it => it.ex !== 'warmup'), last = items[items.length - 1]; if (!last) return [];
  const out = [];
  // 1. Écrites par Claude avec le skill (le matin), pour cette séance.
  const ai = typeof aiOn === 'function' && aiOn() ? (S.coachAI?.adapt || []) : [];
  for (const a of ai) if ((a.plan === p.id || a.date === nx.k) && EXI[a.to] && (!a.from || EXI[a.from])) out.push({from: a.from || last.ex, to: a.to, sets: a.sets, reps: a.reps, why: a.why || '', detail: a.detail || '', ai: true});
  // 2. Calculées par l'appli : la chaîne la plus en retard, avec un exercice ciblé faisable dans la salle de la séance.
  try {
    const st = musState(), wk = Object.fromEntries(st.map(x => [x.k, x.week])), have = new Set(items.map(it => it.ex));
    for (const b of balEx()) {
      const m = b.m, hit = id => (musCoef(id)[m] || 0) >= .75;
      if (items.some(it => hit(it.ex))) continue;   // la séance travaille déjà ce muscle
      let to = gymHas(nx.gym, b.id) ? b.id : null;
      if (!to) to = EX.find(e => e.t === 'gym' && !e.hide && e.cat === 'Prévention' && hit(e.id) && gymHas(nx.gym, e.id) && !have.has(e.id))?.id || null;
      if (!to || have.has(to)) continue;
      const pct = Math.round((wk[m] || 0) / musLimit(m) * 100);
      out.push({from: last.ex, to, sets: last.sets || 3, reps: 12, why: `${MUSI[m]?.n || m} : ${pct} % de sa limite sur 7 jours, le plus en retard de tes chaînes. On le renforce en fin de séance pour durer.`});
      break;
    }
  } catch (e) {}
  return out.slice(0, 2);
}
function adaptCard() {
  const nx = adNext(); if (!nx) return '';
  const p = nx.p, prev = p.adaptPrev, L = prev ? [] : adProps(nx);
  const when = cap(fmtShort(nx.k)), nm = id => esc(exOf(id).n);
  const body = prev
    ? `<div class="adrow done"><span><b>Adapté</b> : ${nm(prev.from)} → ${nm(prev.to)}<small>${esc(prev.why || '')}</small></span><button type="button" class="btn ghost" data-adundo="${esc(p.id)}">Revenir en arrière</button></div>`
    : L.length ? L.map((a, i) => `<div class="adrow"><span><b>${nm(a.from)}</b> → <b>${nm(a.to)}</b> · ${a.sets || 3} × ${a.reps || 12}<small>${esc(a.why)}${a.ai ? ' · préparateur physique (Claude)' : ''}</small>${a.detail ? `<details><summary>Pourquoi</summary><p class="small">${esc(a.detail)}</p></details>` : ''}</span>${nx.mine ? `<button type="button" class="btn" data-adapply="${i}">Appliquer</button>` : ''}</div>`).join('')
    : '<p class="small muted" style="margin:0">Rien à changer : tes chaînes sont équilibrées pour cette séance.</p>';
  return `<div class="card adapt"><div class="chead" style="margin-bottom:8px"><span class="eyebrow">Adaptation de la prochaine séance</span><span class="small muted">${esc(when)}</span></div>
    <button type="button" class="adses" data-tplanv="${esc(p.id)}"><b>${esc(p.name)}</b><span class="small muted">${esc(gymName(nx.gym))}</span></button>${body}</div>`;
}
document.addEventListener('click', async e => {
  const at = q => e.target.closest?.(q); let b;
  if ((b = at('[data-adapply]'))) {
    const nx = adNext(); if (!nx?.mine) return; const a = adProps(nx)[+b.dataset.adapply]; if (!a) return;
    const p = nx.p, i = p.items.map(it => it.ex).lastIndexOf(a.from); if (i < 0) return;
    const items = p.items.map((it, j) => j === i ? {ex: a.to, sets: +a.sets || it.sets || 3, reps: +a.reps || 12, rest: 60, note: 'Rééquilibre : ' + a.why} : it);
    const q = {...p, items, adaptPrev: {items: p.items, from: a.from, to: a.to, why: a.why, at: new Date().toISOString()}, updatedAt: new Date().toISOString()};
    S.plans = {...S.plans, [p.id]: q}; await dbSet('plans/' + p.id, q); toast('Séance adaptée : ' + exOf(a.to).n); renderMod(true); return;
  }
  if ((b = at('[data-adundo]'))) {
    const p = S.plans?.[b.dataset.adundo]; if (!p?.adaptPrev) return;
    const q = {...p, items: p.adaptPrev.items, updatedAt: new Date().toISOString()}; delete q.adaptPrev;
    S.plans = {...S.plans, [p.id]: q}; await dbSet('plans/' + p.id, q); toast('Séance remise comme avant'); renderMod(true); return;
  }
  if ((b = at('[data-donemore]'))) { S.doneAll = !S.doneAll; renderMod(true); }
});

/* ================= Adapter la séance (Aujourd'hui → la séance en mode édition) =================
   Sur Aujourd'hui, la séance du jour (ou la prochaine) est posée dans un bloc « Adapter la séance » quand un exercice
   le demande : une douleur notée dans le questionnaire (3 derniers jours) sur un muscle qu'il charge, ou, en muscu, une
   chaîne en retard (rééquilibre). « Adapter » ouvre la séance comme quand on la crée : sous chaque exercice concerné,
   les adaptations rangées de la plus utile à la moins utile. Oscar choisit ; rien ne change tout seul. */
function adPlanOpts(it, pn) {
  const e = exOf(it.ex), note = t => x => { x.note = (x.note ? x.note + ' · ' : '') + t; };
  const drop = {t: 'Retirer l\'exercice aujourd\'hui', why: 'Pour une douleur forte seulement : tu perds le travail du jour, mais tu protèges les semaines suivantes.', fn: 'remove'};
  if (e.t === 'track') return [
    {t: 'Courir à 85 % au lieu du maximum', why: 'La vitesse maximale est le moment le plus risqué pour les ischios et les mollets.', fn: x => { x.pct = Math.min(+x.pct || 100, 85); }},
    {t: 'Faire un tiers de répétitions en moins', why: 'Moins de volume à haute vitesse sur la zone.', fn: x => { x.reps = Math.max(1, Math.ceil((+x.reps || 3) * 2 / 3)); }}, drop];
  const load = f => ({t: `Baisser la charge de ${Math.round((1 - f) * 100)} %${+it.pct ? ` (${it.pct} → ${Math.round(+it.pct * f)} % du max)` : ''}`, why: 'La tension sur le tissu est ce qui l\'irrite le plus. Tu gardes les répétitions, donc le travail reste là. Pendant l\'exercice : 3/10 de douleur au maximum.', fn: x => { if (+x.pct) x.pct = Math.round(+x.pct * f); else note(`charge −${Math.round((1 - f) * 100)} %`)(x); }});
  const rom = {t: 'Réduire l\'amplitude à la zone sans douleur', why: 'Un muscle douloureux souffre surtout en position étirée. Rester dans l\'amplitude indolore garde la force sans l\'agresser.', fn: note('amplitude réduite, sans douleur')};
  const iso = {t: 'Passer en isométrie : 3 × 30 s à 70 %', why: 'Une contraction sans mouvement à charge modérée entretient la force et calme souvent la douleur sur le moment.', fn: x => { x.ct = 'iso'; x.sets = Math.min(+x.sets || 3, 3); x.reps = 30; x.pct = +x.pct ? Math.round(+x.pct * .7) : 70; }};
  const less = +it.sets > 1 ? {t: 'Enlever une série', why: 'Moins de volume sur la zone, la même qualité sur les séries gardées.', fn: x => { x.sets = Math.max(1, (+x.sets || 3) - 1); }} : null;
  const rest = {t: 'Récupérer 1 min de plus entre les séries', why: 'Le muscle arrive moins fatigué à chaque série : moins de compensations, moins de risque.', fn: x => { x.rest = (+x.rest || 90) + 60; }};
  const tempo = {t: 'Descendre en 3 secondes', why: 'Un tempo lent enlève les à-coups sur la zone et améliore le contrôle.', fn: x => { x.tempo = [3, 0, 1, 0]; }};
  const sub = subFor(it.ex, pn.hit), swap = sub ? {t: `Remplacer par ${sub.n}`, why: `Il fait travailler les mêmes muscles en épargnant : ${pn.hit.map(k => MUSI[k]?.n.toLowerCase()).filter(Boolean).join(', ')}.`, fn: x => { x.ex = sub.id; }} : null;
  const L = pn.v >= 6 ? [swap, drop, iso, load(.6)] : pn.v >= 3 ? [load(.75), rom, iso, less, swap, rest, drop] : [load(.9), tempo, rom, less, swap, rest];
  return L.filter(Boolean);
}
// Les exercices d'une séance qui demandent une adaptation, la douleur la plus forte d'abord, puis le rééquilibre.
function adItems(p, srcId = p?.id) {
  if (!p?.items) return []; const out = [];
  p.items.forEach((it0, i) => { const it = it0._ad ? JSON.parse(it0._ad.snap) : it0; if (it.ex === 'warmup' || it.test || exOf(it.ex).t === 'test' || it.seq || it.tw || (!it0._ad && /Adapté : /.test(it.note || ''))) return;
    const pn = painFor(it.ex); if (pn) out.push({i, ex: it.ex, pn, head: `Douleur notée : ${pn.l} (${pn.v}/10)`, opts: adPlanOpts(it, pn)}); });
  out.sort((a, b) => b.pn.v - a.pn.v);
  if (p.kind !== 'track') try { const nx = adNext(); if (nx && nx.p.id === srcId) for (const a of adProps(nx)) {
    const i = p.items.map(it => it._ad ? JSON.parse(it._ad.snap).ex : it.ex).lastIndexOf(a.from); if (i < 0 || out.some(o => o.i === i)) continue;
    out.push({i, ex: a.from, head: 'Rééquilibre de tes chaînes', opts: [{t: `Remplacer par ${exOf(a.to).n} · ${a.sets || 3} × ${a.reps || 12}`, why: a.why + (a.ai ? ' · préparateur physique (Claude)' : ''), fn: x => { x.ex = a.to; x.sets = +a.sets || 3; x.reps = +a.reps || 12; x.rest = 60; delete x.pct; x.note = 'Rééquilibre'; }}]}); } } catch (e) {}
  return out.filter(o => o.opts.length);
}
// La séance d'Aujourd'hui (ou la prochaine) dans le bloc « Adapter la séance ».
function adWrap(kd, html) {
  if (!html || kindDone(TODAY, kd) || kindSkip(TODAY, kd)) return html;
  let q = planForK(TODAY, kd), k = TODAY;
  if (!q) { const nx = [...Array(60)].map((_, i) => addDays(TODAY, i + 1)).map(d => ({k: d, p: planForK(d, kd)})).find(x => x.p); if (!nx) return html; q = nx.p; k = nx.k; }
  const A = adItems(q); if (!A.length) return html;
  const why = [...new Set(A.map(a => a.pn ? `${a.pn.l} ${a.pn.v}/10` : 'rééquilibre'))].join(' · ');
  return `<div class="adwrap"><div class="adwh"><span class="adwt"><b>Adapter la séance</b><small>${A.length} exercice${A.length > 1 ? 's' : ''} à adapter · ${esc(why)}</small></span><button type="button" class="btn adgo" data-adedit="${esc(q.id)}|${k}">Adapter</button></div><div class="adwin">${html}</div></div>`;
}
// Dans l'éditeur : sous chaque exercice concerné, ses adaptations (3 d'abord, les autres sur demande), ou celle choisie.
function adBox(a) {
  const it = ED.items[a.i], ch = it?._ad;
  if (ch) return `<div class="edad done"><span>✓ ${esc(ch.t)}${ch.rm ? ' · retiré à l\'enregistrement' : ''}</span><button type="button" class="linkbtn" data-edadx="${a.i}">Annuler</button></div>`;
  const more = ED.adMore?.[a.i], L = more ? a.opts : a.opts.slice(0, 3);
  return `<div class="edad"><span class="edadh">${esc(a.head)} · de la plus utile à la moins utile</span>${L.map((o, j) => `<button type="button" class="adopt" data-edad="${a.i}.${j}"><b>${j + 1}. ${esc(o.t)}</b><small>${esc(o.why)}</small></button>`).join('')}${a.opts.length > 3 ? `<button type="button" class="linkbtn" data-edadm="${a.i}">${more ? 'Moins d\'adaptations' : `+ ${a.opts.length - 3} autre${a.opts.length - 3 > 1 ? 's' : ''}`}</button>` : ''}</div>`;
}
const adEditBody0 = editBody;
editBody = function () {
  let h = adEditBody0(); if (!ED?.adapt) return h;
  const A = adItems(ED, ED.adSrc);
  const ban = `<div class="adban"><b>Adapter la séance</b><span>${A.length ? `${A.length} exercice${A.length > 1 ? 's' : ''} à adapter : ${esc(A.map(a => exOf(a.ex).n).join(', '))}. Choisis l'adaptation qui te va sous chacun, puis « Enregistrer ».` : 'Plus rien à adapter. « Enregistrer » garde tes choix.'}</span>${ED.tbl ? A.map(a => `<div class="adbx"><b>${esc(exOf(a.ex).n)}</b>${adBox(a)}</div>`).join('') : ''}</div>`;
  h = h.replace('<h2 class="sesh">Séance</h2>', '<h2 class="sesh">Séance</h2>' + ban);
  if (!ED.tbl) for (const a of A) { const m = h.indexOf(`data-edi="${a.i}">`); if (m < 0) continue; const e = h.indexOf('</h3>', m); if (e < 0) continue; h = h.slice(0, e + 5) + adBox(a) + h.slice(e + 5); }
  for (const [i, it] of ED.items.entries()) if (it._ad?.rm) h = h.replace(`data-edi="${i}">`, `data-edi="${i}" data-adrm>`);
  return h;
};
// À l'enregistrement : les exercices retirés partent, les marques d'adaptation aussi (la note de l'exercice garde le choix).
const adSavePlan0 = savePlan;
savePlan = async function (...a) {
  if (ED) { ED.items = ED.items.filter(it => !it._ad?.rm).map(it => { if (!it._ad) return it; const x = {...it}, t = x._ad.t; delete x._ad; if (!/^Rééquilibre/.test(x.note || '') && !(x.note || '').includes(t)) x.note = (x.note ? x.note + ' · ' : '') + 'Adapté : ' + t; return x; });
    delete ED.adapt; delete ED.adSrc; delete ED.adMore; }
  return adSavePlan0.apply(this, a);
};
document.addEventListener('click', e => {
  const at = q => e.target.closest?.(q); let b;
  if ((b = at('[data-adedit]'))) { const [id, k] = b.dataset.adedit.split('|'); editPlan(id, k); if (ED) { ED.adapt = true; ED.adSrc = id; ED.adMore = {}; paneRender(); } return; }
  if (!ED?.adapt) return;
  if ((b = at('[data-edad]'))) { const [i, j] = b.dataset.edad.split('.').map(Number), a = adItems(ED, ED.adSrc).find(x => x.i === i), o = a?.opts[j]; if (!o) return;
    const it = ED.items[i], snap = JSON.stringify(it);
    if (o.fn === 'remove') it._ad = {t: o.t, snap, rm: true}; else { const x = JSON.parse(snap); o.fn(x); x._ad = {t: o.t, snap}; ED.items[i] = x; }
    try { oneHap(8); } catch (er) {} paneRender(); return; }
  if ((b = at('[data-edadx]'))) { const i = +b.dataset.edadx, it = ED.items[i]; if (it?._ad) ED.items[i] = JSON.parse(it._ad.snap); paneRender(); return; }
  if ((b = at('[data-edadm]'))) { const i = +b.dataset.edadm; ED.adMore = {...ED.adMore, [i]: !ED.adMore?.[i]}; paneRender(); }
});
