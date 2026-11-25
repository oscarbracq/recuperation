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
