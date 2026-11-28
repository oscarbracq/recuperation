/* ================= Accueil · le bilan : la carte de la semaine, puis la page Bilan (semaine + mois) =================
   · La carte : le résumé et les 3 conseils. Chaque chiffre est un peu plus gras et se touche : il ouvre sa courbe.
     Les conseils tiennent compte de la semaine qui vient (séances prévues, compétition proche), pas seulement du passé.
   · Toucher la carte ouvre la page Bilan : la synthèse de la semaine (tous les chiffres face à ta normale, les 4
     dernières semaines), puis plus bas le bilan du mois : toutes les données du mois, tes notes (enregistrées toutes
     seules), et « Copier pour Claude » → la réponse de Claude se colle ici et reste dans l'appli.
   · Notifications : le vendredi soir (./?q=bilan) ouvre la page ; le 1er du mois (./?q=mois) ouvre le bilan du mois.
   Rangé dans settings/app.monthRev["AAAA-MM"] = {notes, at, rev}. */

// Chaque chiffre d'une phrase : en gras, et relié à sa courbe d'après le mot qui le précède.
const WK_MET = [[/récup(?!s)/i, 'recovery'], [/VFC/i, 'hrv'], [/pouls|FC|battements/i, 'rhr'], [/nuit|sommeil|coucher|couché/i, 'sleepH'], [/charge|journées?|séances?|effort/i, 'effort'], [/poids|kg/i, 'weight']];
function wkLinks(t) {
  const h = esc(t);
  return h.replace(/(?<![&#\w,.])(\d+(?:[,.]\d+)?(?:\s?h(?:\s?\d{2})?)?(?:\s?(?:%|g|kcal|min|L|ms|pts|points|battements|jours?|soirs?|\/10))?)/g, (m, x, off) => {
    const before = h.slice(Math.max(0, off - 80), off + m.length + 30), mt = WK_MET.find(([re]) => re.test(before))?.[1];
    return `<b class="wkv"${mt ? ` data-metric="${mt}" role="button"` : ''}>${m}</b>`; });
}
// La semaine qui vient : séances prévues et compétition proche, pour des conseils qui servent vraiment.
function wkNext(end, A, N) {
  const D = [...Array(7)].map((_, i) => addDays(end, i + 1)), out = [];
  const has = (k, kind) => { try { return !!planForK(k, kind); } catch (e) { return false; } };
  const dbl = D.filter(k => has(k, 'gym') && has(k, 'track')), trk = D.filter(k => has(k, 'track')), gym = D.filter(k => has(k, 'gym'));
  const dn = k => new Date(k + 'T12:00:00').toLocaleDateString('fr-FR', {weekday: 'short'}).replace('.', '');
  const c = typeof capGet === 'function' ? capGet() : null;
  const comp = c ? [...(c.steps || []).filter(s => s.d && !s.done), {d: c.date, t: c.res}].filter(s => s.d > end && s.d <= addDays(end, 10)).sort((a, b) => a.d.localeCompare(b.d))[0] : null;
  if (comp) { const j = daysBetween(end, comp.d), nm = String(comp.t || 'Compétition').split(':')[0];
    out.push([6, `${nm} ${fmtShort(comp.d).replace(/\.$/, '')} (J-${j}) : dernière séance de sprint intense ${j >= 5 ? '3 jours avant' : 'au plus tard 2 jours avant'}, puis léger ; même heure de coucher 3 soirs avant.`]); }
  const recLow = A.rec != null && N.rec != null && A.rec < N.rec - 3;
  if (dbl.length >= 3) out.push([recLow ? 4.6 : 3.4, `${dbl.length} jours doubles prévus (${dbl.map(dn).join(', ')}) : les jours entre eux restent vraiment calmes (marche, mobilité), sinon la piste du soir perd sa qualité.`]);
  else if (trk.length + gym.length === 0 && (N.gym + N.track) >= 2) out.push([2.5, 'Aucune séance prévue la semaine prochaine : place-les dans le planning pour que l\'appli adapte tes conseils.']);
  if (recLow && trk.length) out.push([4.2, `Récup sous ta normale et ${trk.length} séance${trk.length > 1 ? 's' : ''} de piste prévue${trk.length > 1 ? 's' : ''} : garde la vitesse max, coupe 1 ou 2 répétitions si le matin est rouge.`]);
  return out;
}
const wkCoach0b = wkCoach;
wkCoach = function (end = wkFriday()) {
  const C = wkCoach0b(end); try { const X = wkNext(end, C.A, C.N); if (X.length) { const L = [...X.sort((a, b) => b[0] - a[0]).map(x => x[1]), ...C.todo]; C.todo = [...new Set(L)].slice(0, 3); } } catch (e) {} return C;
};
wkCard = function () {
  const C = wkSafe(() => (WK = wkCoach())); if (!C) return '';
  const range = `${fmtShort(C.from).replace(/\.$/, '')} – ${fmtShort(C.end)}`;
  return `<section class="wk wkb" data-bilan role="button" tabindex="0" aria-label="Bilan de la semaine : ouvrir"><div class="wk-h"><span class="eyebrow">Bilan de la semaine</span><small>${esc(range)} ›</small></div>
    <h2 class="wk-t">${esc(C.title)}</h2><p class="wk-p">${wkLinks(C.para)}</p>
    <div class="wk-n"><span class="eyebrow">Pour la semaine qui vient</span><ol>${C.todo.map(t => `<li><span>${wkLinks(t)}</span></li>`).join('')}</ol></div></section>`;
};

/* ---------- la page Bilan ---------- */
let BLN = {off: 0, mo: null};
const blnMonth = () => { const d = +TODAY.slice(8, 10); return d <= 7 ? addDays(TODAY.slice(0, 8) + '01', -1).slice(0, 7) : TODAY.slice(0, 7); };
const moName = m => cap(new Date(m + '-15T12:00:00').toLocaleDateString('fr-FR', {month: 'long', year: 'numeric'}));
function blnOpen(part) { BLN = {off: 0, mo: blnMonth()}; openPane({title: 'Bilan', full: true, render: blnHtml}); if (part === 'mois') setTimeout(() => document.getElementById('blnmo')?.scrollIntoView({behavior: 'smooth', block: 'start'}), 450); }
const bf = (v, d = 0, u = '') => v == null || Number.isNaN(v) ? '–' : fx(v, d) + u;
function blnRows(A, N) {
  const dd = (a, b, d = 0, u = '', inv) => a == null || b == null ? '' : (() => { const x = a - b, good = inv ? x < 0 : x > 0; return Math.abs(x) < Math.pow(10, -d) / 2 ? '<span class="bln-eq">=</span>' : `<span class="${good ? 'bln-up' : 'bln-dn'}">${x > 0 ? '+' : '−'}${fx(Math.abs(x), d)}${u}</span>`; })();
  const R = [
    ['recovery', 'Récupération', bf(A.rec, 0, ' %'), bf(N.rec, 0, ' %'), dd(A.rec, N.rec, 0, ' pts')],
    ['hrv', 'VFC', bf(A.hrv, 0, ' ms'), bf(N.hrv, 0, ' ms'), dd(A.hrv, N.hrv, 0, ' ms')],
    ['rhr', 'FC au repos', bf(A.rhr, 0), bf(N.rhr, 0), dd(A.rhr, N.rhr, 0, '', true)],
    ['sleepH', 'Sommeil', A.sleep != null ? wkH(A.sleep) : '–', N.sleep != null ? wkH(N.sleep) : '–', dd(A.sleep, N.sleep, 1, ' h')],
    ['sleepH', 'Coucher moyen', A.bed != null ? wkT(A.bed) : '–', N.bed != null ? wkT(N.bed) : '–', A.bed != null && N.bed != null ? `<span class="${A.bed <= N.bed ? 'bln-up' : 'bln-dn'}">${A.bed <= N.bed ? '−' : '+'}${Math.round(Math.abs(A.bed - N.bed))} min</span>` : ''],
    ['effort', 'Charge (effort cumulé)', bf(A.load, 0), bf(N.load, 0), dd(A.load, N.load, 0)],
    ['effort', 'Jours durs', bf(A.hard, 0), bf(N.hard, 1), ''],
    ['', 'Séances muscu · piste', `${A.gym} · ${A.track}`, `${bf(N.gym, 1)} · ${bf(N.track, 1)}`, ''],
    ['', 'Protéines par jour', bf(A.prot, 0, ' g'), A.protG ? bf(A.protG, 0, ' g visés') : '–', ''],
    ['', 'Apports / dépense', A.kcal != null ? bf(A.kcal * 100, 0, ' %') : '–', '100 %', ''],
    ['', 'Jours à 2 L d\'eau', `${A.water}/${A.waterN || 7}`, '', ''],
    ['', 'Douleur', A.pain ? `${A.pain} j · max ${A.painMax}/10` : 'aucune', '', ''],
    ['', 'Récup active', bf(A.recov, 0, ' min'), bf(N.recov, 0, ' min'), ''],
    ['weight', 'Poids', bf(A.weight, 1, ' kg'), bf(N.weight, 1, ' kg'), dd(A.weight, N.weight, 1, ' kg')]];
  return `<div class="bln-t"><div class="bln-r bln-hd"><span></span><b>Cette semaine</b><b>Ta normale</b><b>Écart</b></div>${R.map(([m, l, a, n, d]) => `<div class="bln-r${m ? ' bln-go' : ''}"${m ? ` data-metric="${m}" role="button"` : ''}><span>${l}</span><b>${a}</b><span>${n}</span><span>${d}</span></div>`).join('')}</div>`;
}
function blnHtml() {
  const end = addDays(wkFriday(), -7 * BLN.off), C = wkCoach(end), A = C.A, N = C.N;
  const W4 = [0, 1, 2, 3].map(i => ({e: addDays(end, -7 * i), s: i ? wkStats(addDays(end, -7 * i)) : A})).reverse();
  const range = `${fmtShort(C.from).replace(/\.$/, '')} – ${fmtShort(C.end)}`;
  return `<div class="bln">
    <div class="bln-nav"><button type="button" class="chip" data-blnoff="1" aria-label="Semaine d'avant">‹</button><span>${esc(range)}</span><button type="button" class="chip" data-blnoff="-1"${BLN.off ? '' : ' disabled'} aria-label="Semaine d'après">›</button></div>
    <h2 class="bln-h">${esc(C.title)}</h2><p class="bln-p">${wkLinks(C.para)}</p>
    <div class="sec-label">Pour la semaine qui vient</div><ol class="bln-todo">${C.todo.map(t => `<li><span>${wkLinks(t)}</span></li>`).join('')}</ol>
    <div class="sec-label">Tes chiffres <small>face aux 4 semaines d'avant · touche une ligne pour sa courbe</small></div>${blnRows(A, N)}
    <div class="sec-label">Les 4 dernières semaines</div>
    <div class="bln-t bln-4"><div class="bln-r bln-hd"><span></span>${W4.map(w => `<b>${esc(fmtShort(addDays(w.e, -6)).replace(/\.$/, ''))}</b>`).join('')}</div>
      ${[['Récup', w => bf(w.rec, 0, ' %')], ['Sommeil', w => w.sleep != null ? wkH(w.sleep) : '–'], ['Charge', w => bf(w.load, 0)], ['Séances', w => `${w.gym + w.track}`], ['Douleur', w => w.pain ? `${w.pain} j` : '0'], ['Poids', w => bf(w.weight, 1)]].map(([l, f]) => `<div class="bln-r"><span>${l}</span>${W4.map(w => `<b>${f(w.s)}</b>`).join('')}</div>`).join('')}</div>
    ${blnMonthHtml()}</div>`;
}

/* ---------- le bilan du mois ---------- */
const moDays = m => { const L = []; for (let k = m + '-01'; k.startsWith(m) && k <= TODAY; k = addDays(k, 1)) L.push(k); return L; };
function moDay(k) {
  const s = f => wkSafe(f), t = s(() => dayTotals(k)), g = s(() => fuelGoal(k)), w = M(k, 'well') || {};
  return {k, rec: s(() => recovery(k)?.score), hrv: s(() => G(k, 'hrv')), rhr: s(() => G(k, 'rhr')), sl: s(() => VAL.sleepH(addDays(k, 1))), bed: s(() => G(addDays(k, 1), 'bed')),
    eff: s(() => effortDay(k)), gym: s(() => logsOn(k).some(l => l.kind === 'gym')) || !!M(k, 'gymRpe'), trk: s(() => logsOn(k).some(l => l.kind === 'track')) || !!M(k, 'trackRpe'),
    grpe: M(k, 'gymRpe'), trpe: M(k, 'trackRpe'), kcal: t?.kcal || null, kg: g?.kcal || null, p: t?.p || null, water: s(() => waterOf(k).L),
    pain: s(() => maxPain(k)) || 0, zones: s(() => Object.entries(pains(k)).filter(([, v]) => +v > 0).map(([z, v]) => `${painTxt(z)} ${v}`).join(', ')) || '',
    well: w, str: M(k, 'eve')?.dstr || null, wt: s(() => W(k, 'weight'))};
}
function moStats(m) {
  const D = moDays(m).map(moDay), avg = f => wkMean(D.map(f));
  return {D, n: D.length, rec: avg(d => d.rec), hrv: avg(d => d.hrv), rhr: avg(d => d.rhr), sl: avg(d => d.sl), gym: D.filter(d => d.gym).length, trk: D.filter(d => d.trk).length,
    eff: D.reduce((a, d) => a + (d.eff || 0), 0), pain: D.filter(d => d.pain > 0).length, painMax: Math.max(0, ...D.map(d => d.pain)), kcal: avg(d => d.kcal && d.kg ? d.kcal / d.kg : null), p: avg(d => d.p),
    w0: D.find(d => d.wt)?.wt, w1: [...D].reverse().find(d => d.wt)?.wt, food: D.filter(d => d.kcal).length, quest: D.filter(d => M(d.k, 'mornAt')).length};
}
const moRev = m => S.app?.monthRev?.[m] || {};
function blnMonthHtml() {
  const m = BLN.mo || blnMonth(), X = moStats(m), R = moRev(m), r = R.rev, mn = S.app?.mental?.[m] || S.app?.mental?.[addDays(m + '-01', 32).slice(0, 7)];
  const opts = [0, 1, 2].map(i => addDays(TODAY.slice(0, 8) + '01', -i * 28).slice(0, 7)).filter((x, i, a) => a.indexOf(x) === i);
  const kv = (l, v, mt) => `<div class="bln-kv"${mt ? ` data-metric="${mt}" role="button"` : ''}><span>${l}</span><b>${v}</b></div>`;
  return `<div id="blnmo" class="bln-mo"><div class="bln-moh"><span class="eyebrow">Bilan du mois</span><div class="seg segsm">${opts.map(o => `<button type="button" data-blnmo="${o}" aria-pressed="${o === m}">${esc(new Date(o + '-15T12:00:00').toLocaleDateString('fr-FR', {month: 'short'}))}</button>`).join('')}</div></div>
    <h2 class="bln-h">${esc(moName(m))}${m === TODAY.slice(0, 7) ? ' <small>en cours</small>' : ''}</h2>
    <div class="bln-grid">${kv('Récup moyenne', bf(X.rec, 0, ' %'), 'recovery')}${kv('VFC', bf(X.hrv, 0, ' ms'), 'hrv')}${kv('FC repos', bf(X.rhr, 0), 'rhr')}${kv('Sommeil', X.sl != null ? wkH(X.sl) : '–', 'sleepH')}
      ${kv('Séances muscu', X.gym)}${kv('Séances piste', X.trk)}${kv('Charge du mois', bf(X.eff, 0), 'effort')}${kv('Jours de douleur', X.pain ? `${X.pain} · max ${X.painMax}/10` : '0')}
      ${kv('Apports / dépense', X.kcal != null ? bf(X.kcal * 100, 0, ' %') : '–')}${kv('Protéines', bf(X.p, 0, ' g/j'))}${kv('Poids', X.w0 && X.w1 ? `${fx(X.w0, 1)} → ${fx(X.w1, 1)} kg` : '–', 'weight')}${kv('Bilan mental', mn ? mn.note + '/100' : 'pas fait')}</div>
    ${r ? `<div class="card bln-rev"><span class="eyebrow">L'analyse de Claude</span>${r.titre ? `<h3>${esc(r.titre)}</h3>` : ''}${r.resume ? `<p>${esc(r.resume)}</p>` : ''}
      ${r.forts?.length ? `<div class="sec-label">Points forts</div><ol>${r.forts.map(x => `<li>${esc(x)}</li>`).join('')}</ol>` : ''}
      ${r.faibles?.length ? `<div class="sec-label">Points faibles</div><ol>${r.faibles.map(x => `<li>${esc(x)}</li>`).join('')}</ol>` : ''}
      ${r.objectifs?.length ? `<div class="sec-label">Le mois qui vient</div><ol>${r.objectifs.map(x => `<li>${esc(x)}</li>`).join('')}</ol>` : ''}
      ${r.domaines ? Object.entries(r.domaines).map(([k, v]) => `<p class="small"><b>${esc(k)} :</b> ${esc(v)}</p>`).join('') : ''}</div>` : ''}
    <div class="sec-label">Mes notes du mois <small>enregistrées toutes seules</small></div>
    <textarea class="mini-in bln-notes" data-blnnotes="${m}" rows="4" placeholder="Ce qui s'est passé ce mois : compétitions, sensations, fatigue, vie perso, ce que tu veux changer…">${esc(R.notes || '')}</textarea>
    <div class="btnrow two" style="margin-top:12px"><button type="button" class="btn" data-blncopy="${m}">Copier pour Claude</button><button type="button" class="btn ghost" data-blnpaste="${m}">Coller sa réponse</button></div>
    <p class="small muted" data-tip="1" style="margin:8px 4px 0">« Copier » prend toutes les données du mois, jour par jour (récup, sommeil, séances, nutrition, douleurs, ressenti, poids), ton bilan mental, Ton cap et tes vidéos. Colle-les dans Claude, puis colle sa réponse ici : elle reste dans l'appli.</p>
    <textarea class="mini-in" data-blnin="${m}" rows="3" placeholder="Colle ici la réponse de Claude (avec le bloc json)" style="width:100%;margin-top:8px;display:none"></textarea></div>`;
}
function moPrompt(m) {
  const X = moStats(m), f = (v, d = 0) => v == null || Number.isNaN(+v) ? '' : fx(+v, d);
  const rows = X.D.map(d => [d.k, f(d.rec), f(d.hrv), f(d.rhr), d.sl != null ? f(d.sl, 1) : '', d.bed || '', f(d.eff, 1), [d.gym ? 'muscu' + (d.grpe ? ' RPE ' + d.grpe : '') : '', d.trk ? 'piste' + (d.trpe ? ' RPE ' + d.trpe : '') : ''].filter(Boolean).join(' + '),
    d.kcal ? `${Math.round(d.kcal)}/${Math.round(d.kg || 0)}` : '', f(d.p), d.water != null ? f(d.water, 1) : '', d.pain ? d.zones : '', ['slq', 'fat', 'sor', 'str', 'moo'].map(x => d.well[x] || '-').join('/'), d.str || '', f(d.wt, 1)].join(' ; ')).join('\n');
  const mn = S.app?.mental?.[m] || S.app?.mental?.[addDays(m + '-01', 32).slice(0, 7)];
  const c = typeof capGet === 'function' ? capGet() : null, ax = c ? capAxes(c).filter(a => a.st !== 'done').slice(0, 5).map(a => `- ${a.n} (${a.subs.filter(s => s.done).length}/${a.subs.length})`).join('\n') : '';
  const vp = typeof anaPts === 'function' ? anaPts('run') : null;
  return `Utilise les skills recup-kine, nutrition-sport, prepa-physique, coach-sprint et preparateur-mental. Fais mon BILAN DU MOIS de ${moName(m)} : complet, rien d'oublié, chiffré, comparé à mes normales, avec les liens entre les données (sommeil → récup → séances, nutrition → poids, douleurs → charge, mental → performance).
Je suis Oscar, sprinteur 60/100 m. Objectif : ${c ? `${c.ev} en ${chr(c.to)} (${c.res}, ${c.date})` : ''}.

Résumé : ${X.n} jours · récup ${f(X.rec)} % · VFC ${f(X.hrv)} ms · FC repos ${f(X.rhr)} · sommeil ${X.sl != null ? wkH(X.sl) : '?'} · ${X.gym} séances muscu, ${X.trk} piste · charge ${f(X.eff)} · ${X.pain} jours de douleur (max ${X.painMax}/10) · apports ${X.kcal != null ? f(X.kcal * 100) + ' % de la dépense' : '?'} sur ${X.food} jours notés · protéines ${f(X.p)} g/j · poids ${X.w0 ? f(X.w0, 1) + ' → ' + f(X.w1, 1) + ' kg' : '?'} · questionnaire du matin ${X.quest}/${X.n} jours.

Jour par jour (date ; récup % ; VFC ; FC repos ; sommeil h ; coucher ; effort ; séances ; kcal mangées/besoin ; protéines g ; eau L ; douleurs ; ressenti sommeil/fatigue/courbatures/stress/humeur sur 5 ; stress du soir sur 4 ; poids) :
${rows}

${mn ? `Bilan mental du mois : ${mn.note}/100 (tension ${mn.sc.tens}, humeur ${mn.sc.mood}, énergie ${mn.sc.burn}, mental de compétition ${mn.sc.comp}, équilibre ${mn.sc.life}).\n` : ''}${ax ? `Mes axes de travail (Ton cap) :\n${ax}\n` : ''}${vp?.n ? `Vidéos de course (${vp.n}) · points forts : ${vp.forts.slice(0, 4).map(x => x.t).join(' ; ')} · points faibles : ${vp.faibles.slice(0, 4).map(x => x.t).join(' ; ')}\n` : ''}${moRev(m).notes ? `Mes notes : ${moRev(m).notes}\n` : ''}
Réponds en français simple, phrases courtes, tableaux. Termine par un seul bloc \`\`\`json : {"tnr":"mois","mois":"${m}","titre":"…","resume":"…","forts":["…"],"faibles":["…"],"objectifs":["…","…","…"],"domaines":{"Récupération":"…","Entraînement":"…","Sprint":"…","Nutrition":"…","Mental":"…"}}`;
}
function moParse(t) { const x = t.match(/```json\s*([\s\S]*?)```/) || t.match(/(\{[\s\S]*"tnr"\s*:\s*"mois"[\s\S]*\})/); if (!x) return null;
  try { const j = JSON.parse(x[1].trim()); if (j.tnr !== 'mois') return null; const L = a => (Array.isArray(a) ? a : []).map(v => String(v).slice(0, 300)).slice(0, 8);
    return {titre: String(j.titre || '').slice(0, 120), resume: String(j.resume || '').slice(0, 1500), forts: L(j.forts), faibles: L(j.faibles), objectifs: L(j.objectifs), domaines: j.domaines && typeof j.domaines === 'object' ? Object.fromEntries(Object.entries(j.domaines).slice(0, 8).map(([k, v]) => [String(k).slice(0, 30), String(v).slice(0, 500)])) : null}; } catch (e) { return null; } }
let BLNT = null;
function moSave(m, patch, now) { S.app = {...(S.app || {}), monthRev: {...(S.app?.monthRev || {}), [m]: {...moRev(m), ...patch}}}; clearTimeout(BLNT);
  const go = () => dbSet('settings/app', {...S.app, updatedAt: new Date().toISOString()}).catch(() => {}); if (now) return go(); BLNT = setTimeout(go, 800); }
document.addEventListener('click', async e => { let b; const at = q => (b = e.target.closest?.(q));
  if (at('[data-bilan]')) { if (e.target.closest('[data-metric]')) return; try { oneHap(6); } catch (er) {} blnOpen(); return; }
  if (at('[data-blnoff]')) { if (b.disabled) return; BLN.off = Math.max(0, BLN.off + +b.dataset.blnoff); paneRender(); return; }
  if (at('[data-blnmo]')) { BLN.mo = b.dataset.blnmo; const y = $('#pane-scroll')?.scrollTop; paneRender(); if (y != null) $('#pane-scroll').scrollTop = y; return; }
  if (at('[data-blncopy]')) { try { await navigator.clipboard.writeText(moPrompt(b.dataset.blncopy)); toast('Bilan copié : colle-le dans Claude'); } catch (er) { toast('Copie impossible'); } return; }
  if (at('[data-blnpaste]')) { const t = document.querySelector(`[data-blnin="${b.dataset.blnpaste}"]`); if (t) { t.style.display = ''; t.focus(); } return; }
});
document.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches?.('[data-bilan]')) { e.preventDefault(); blnOpen(); } });
document.addEventListener('input', e => { const t = e.target;
  if (t.matches?.('[data-blnnotes]')) { moSave(t.dataset.blnnotes, {notes: t.value}); return; }
  if (t.matches?.('[data-blnin]')) { const r = moParse(t.value); if (!r) return; const m = t.dataset.blnin; moSave(m, {rev: r, at: new Date().toISOString()}, true); toast('Bilan du mois rangé'); const y = $('#pane-scroll')?.scrollTop; paneRender(); if (y != null) $('#pane-scroll').scrollTop = y; }
});
// Les notifications : vendredi soir → la page Bilan ; début du mois → le bilan du mois.
function blnAuto(part) { const t = setInterval(() => { if (!S.app || window.TNR_SPLASH_ON || document.getElementById('splash')) return; clearInterval(t); blnOpen(part); }, 250); }
navigator.serviceWorker?.addEventListener('message', e => { const o = e.data?.open || ''; if (/[?&]q=bilan/.test(o)) blnAuto(); else if (/[?&]q=mois/.test(o)) blnAuto('mois'); });
{ const q = new URLSearchParams(location.search).get('q'); if (q === 'bilan' || q === 'mois') { history.replaceState(history.state, '', location.pathname); blnAuto(q === 'mois' ? 'mois' : ''); } }
