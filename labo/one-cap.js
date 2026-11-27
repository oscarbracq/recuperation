/* ================= Accueil · Ton cap (objectif, sous-objectifs, moyens) et la page Idées =================
   D'après le cours de préparation mentale d'Oscar (objectifs SMART ; long terme = le rêve, moyen terme = la discipline,
   court terme = la motivation, les petites victoires) et la méta-analyse de Williamson et al. 2022 (27 études) :
   les objectifs de processus (ce que je fais) aident le plus la performance (d = 1,36), puis les objectifs de performance
   (un chrono, d = 0,44) ; l'objectif de résultat seul (un classement) presque pas (d = 0,09). D'où : un rêve, un résultat,
   un chrono mesurable avec une date, des jalons, et chaque semaine les moyens que l'appli compte toute seule.
   Rangé dans settings/app.cap ; la page Idées garde ses choix dans settings/app.ideas. */
const CAP_PROC = {
  quest: ['Questionnaire du matin', 'jours', 7, k => !!M(k, 'mornAt')],
  sleep: ['Nuits de 8 h ou plus', 'nuits', 5, k => (+G(k, 'sleepS') || 0) >= 8 * 3600],
  gym: ['Séances de muscu', 'séances', 3, k => logsOn(k).some(l => l.kind === 'gym')],
  track: ['Séances de piste', 'séances', 3, k => logsOn(k).some(l => l.kind === 'track')],
  food: ['Journal nutrition rempli', 'jours', 6, k => (fday(k).items || []).length > 0 && !fday(k).fromPlan || !!M(k, 'closed')]
};
const capDef = () => {
  const pb = parseFloat(String(S.profile?.sprinter?.pb60 || '7.60').replace(',', '.')) || 7.6;
  return {dream: 'Le haut niveau : courir les championnats de France élite', res: 'Championnats en salle', date: '2027-03-07', ev: '60 m', pb, to: Math.round((pb - .15) * 100) / 100,
    steps: [{d: '2026-12-13', t: 'Liévin : premier 60 m de l\'hiver'}, {d: '2026-12-20', t: 'Meeting JB : confirmer'}, {d: '2027-01-24', t: 'Fin janvier : 60 m sous ' + chr(pb - .08)}],
    proc: [{k: 'quest', n: 7}, {k: 'sleep', n: 5}, {k: 'gym', n: 3}], free: [], draft: true};
};
const capGet = () => ({...capDef(), ...(S.app?.cap || {})});
const chr = v => { const x = Math.round(v * 100) / 100, s = Math.floor(x), c = Math.round((x - s) * 100); return `${s}"${String(c).padStart(2, '0')}`; };
async function capSave(c) { S.app = {...(S.app || {}), cap: {...c, draft: false}}; await dbSet('settings/app', {...S.app, updatedAt: new Date().toISOString()}); }
// Les moyens de la semaine (lundi → aujourd'hui), comptés par l'appli.
function capWeek(c) {
  const mon = monday(TODAY), days = []; for (let k = mon; k <= TODAY; k = addDays(k, 1)) days.push(k);
  return [...(c.proc || []).filter(p => CAP_PROC[p.k]).map(p => { const [n, u, , f] = CAP_PROC[p.k]; let v = 0; for (const k of days) try { if (f(k)) v++; } catch (e) {} return {n, u, v, goal: p.n, k: p.k}; }),
    ...(c.free || []).map((x, i) => ({n: x.t, u: '', v: (x.wk === mon ? 1 : 0), goal: 1, free: i}))];
}
function capCard() {
  const c = capGet(), left = daysBetween(TODAY, c.date), W = capWeek(c), ok = W.filter(x => x.v >= x.goal).length;
  const steps = (c.steps || []).filter(s => s.d).sort((a, b) => a.d.localeCompare(b.d)), t0 = c.start || '2026-11-01', span = Math.max(1, daysBetween(t0, c.date));
  const pos = d => Math.max(0, Math.min(100, daysBetween(t0, d) / span * 100)), nx = steps.find(s => s.d >= TODAY);
  return `<button type="button" class="cap" data-capview aria-label="Ton cap : voir le détail"><span class="cap-h"><span class="eyebrow">Ton cap${c.draft ? ' · à valider' : ''}</span><span class="cap-j">${left > 0 ? 'J-' + left : left === 0 ? 'Jour J' : 'Passé'}</span></span>
    <span class="cap-goal">${esc(c.ev)} en ${chr(c.to)}</span>
    <span class="cap-sub">${esc(c.res)} · ${esc(fmtShort(c.date))}</span>
    <span class="cap-line" aria-hidden="true"><i style="width:${pos(TODAY).toFixed(1)}%"></i>${steps.map(s => `<em class="${s.done ? 'ok' : s.d < TODAY ? 'past' : ''}" style="left:${pos(s.d).toFixed(1)}%"></em>`).join('')}<em class="end" style="left:100%"></em></span>
    <span class="cap-f2"><span>${nx ? `Prochain : ${esc(nx.t.split(':')[0])} · ${esc(fmtShort(nx.d))}` : ''}</span>${W.length ? `<b>Semaine ${ok}/${W.length} ›</b>` : ''}</span></button>`;
}
// Le détail, au toucher : le rêve, le chrono, tous les jalons, les moyens de la semaine.
function capView() {
  openPane({title: 'Ton cap', render: () => { const c = capGet(), W = capWeek(c), steps = (c.steps || []).filter(s => s.d).sort((a, b) => a.d.localeCompare(b.d));
    return `${c.dream ? `<p class="cap-dream">${esc(c.dream)}</p>` : ''}
      <div class="cap-big"><b>${esc(c.ev)} en ${chr(c.to)}</b><span>${esc(c.res)} · ${esc(cap(fmtLong(c.date)))}</span><span>Record ${chr(c.pb)} · ${fx(Math.round((c.pb - c.to) * 100) / 100, 2)} s à gagner</span></div>
      <div class="sec-label">Les jalons</div><div class="list">${steps.map(s => `<div class="row"><span style="flex:1">${esc(s.t)}<span class="hint">${esc(cap(fmtShort(s.d)))}</span></span><b>${s.done ? '✓' : s.d < TODAY ? 'passé' : ''}</b></div>`).join('') || '<div class="row"><span class="muted">Aucun jalon</span></div>'}</div>
      ${W.length ? `<div class="sec-label">Cette semaine, ce qui dépend de toi</div><div class="cap-w">${W.map(x => `<div class="cap-r${x.v >= x.goal ? ' ok' : ''}">${x.free != null ? `<button type="button" class="cap-ck" data-capfree="${x.free}" aria-pressed="${x.v >= 1}" aria-label="Fait cette semaine">${x.v >= 1 ? '✓' : ''}</button>` : `<span class="cap-ck">${x.v >= x.goal ? '✓' : ''}</span>`}<span>${esc(x.n)}</span><b>${x.free != null ? '' : `${x.v}/${x.goal}`}</b></div>`).join('')}</div>` : ''}
      ${c.draft ? '<p class="small muted" style="margin:12px 4px 0">Proposition à partir de ton record : ajuste-la avec ton coach.</p>' : ''}
      <button class="btn" style="margin-top:16px;width:100%" data-capedit>${c.draft ? 'Valider mon objectif' : 'Modifier mon cap'}</button>`; }});
}
const fmtLong = k => new Date(k + 'T12:00:00').toLocaleDateString('fr-FR', {day: 'numeric', month: 'long', year: 'numeric'});
// L'éditeur : le rêve, le résultat, le chrono, les jalons, les moyens.
let CAPED = null;
function capEdit() {
  CAPED = structuredClone(capGet());
  openPane({title: 'Ton cap', onClose: () => { CAPED = null; }, render: () => { const c = CAPED; if (!c) return '';
    const f = (k, l, v, t = 'text', ph = '') => `<label class="cap-f">${l}<input class="mini-in" type="${t}" data-capf="${k}" value="${esc(v ?? '')}" placeholder="${esc(ph)}"${t === 'number' ? ' step="0.01" inputmode="decimal"' : ''}></label>`;
    return `<p class="small muted" style="margin:14px 4px 6px">Du plus loin au plus proche : le rêve donne la direction, le chrono se mesure, les jalons te font avancer, les moyens se font chaque semaine.</p>
      <div class="sec-label">Le rêve <small>long terme</small></div>${f('dream', 'Ce que tu vises dans ta carrière', c.dream)}
      <div class="sec-label">L'objectif de résultat</div><div class="cap-g2">${f('res', 'Compétition', c.res)}${f('date', 'Date', c.date, 'date')}</div>
      <div class="sec-label">L'objectif de performance <small>mesurable</small></div><div class="cap-g3">${f('ev', 'Épreuve', c.ev)}${f('pb', 'Record actuel (s)', c.pb, 'number')}${f('to', 'Objectif (s)', c.to, 'number')}</div>
      <div class="sec-label">Les jalons <small>moyen terme</small></div>
      <div class="list">${(c.steps || []).map((s, i) => `<div class="row cap-st"><input class="mini-in" type="date" data-capsd="${i}" value="${esc(s.d)}"><input class="mini-in" data-capst="${i}" value="${esc(s.t)}" placeholder="Ex. 60 m sous 7&quot;55"><button type="button" class="chip" data-capsdone="${i}" aria-pressed="${!!s.done}">${s.done ? '✓ Atteint' : 'Atteint ?'}</button><button type="button" class="cap-x" data-capsx="${i}" aria-label="Retirer">×</button></div>`).join('')}</div>
      <button type="button" class="btn ghost" style="margin-top:8px;width:100%" data-capsadd>+ Ajouter un jalon</button>
      <div class="sec-label">Les moyens <small>chaque semaine, comptés par l'appli</small></div>
      <div class="list">${Object.entries(CAP_PROC).map(([k, [n, u, d]]) => { const p = (c.proc || []).find(x => x.k === k); return `<div class="row"><label style="flex:1">${esc(n)}<span class="hint">${p ? `${p.n} ${u} par semaine` : 'pas suivi'}</span></label>${p ? `<input class="mini-in" style="width:56px" inputmode="numeric" data-capn="${k}" value="${p.n}">` : ''}<span class="switch"><input type="checkbox" data-capp="${k}"${p ? ' checked' : ''}><span></span></span></div>`; }).join('')}
        ${(c.free || []).map((x, i) => `<div class="row"><span style="flex:1">${esc(x.t)}<span class="hint">à cocher chaque semaine</span></span><button type="button" class="cap-x" data-capfx="${i}" aria-label="Retirer">×</button></div>`).join('')}</div>
      <div class="cap-g2" style="margin-top:8px"><input class="mini-in" data-capfn placeholder="Un autre moyen (ex. 5 min d'imagerie)" style="text-align:left"><button type="button" class="chip" data-capfadd>Ajouter</button></div>
      <button class="btn" style="margin-top:18px;width:100%" data-capsave>Enregistrer mon cap</button>`; }});
}
document.addEventListener('input', e => { const t = e.target; if (!CAPED) return;
  if (t.dataset.capf) CAPED[t.dataset.capf] = t.type === 'number' ? parseFloat(String(t.value).replace(',', '.')) || 0 : t.value;
  if (t.dataset.capst != null) CAPED.steps[+t.dataset.capst].t = t.value;
  if (t.dataset.capsd != null) CAPED.steps[+t.dataset.capsd].d = t.value;
  if (t.dataset.capn) { const p = CAPED.proc.find(x => x.k === t.dataset.capn); if (p) p.n = Math.max(1, Math.min(7, +t.value || 1)); } });
document.addEventListener('change', e => { const t = e.target; if (!CAPED || !t.dataset?.capp) return; const k = t.dataset.capp;
  CAPED.proc = t.checked ? [...(CAPED.proc || []), {k, n: CAP_PROC[k][2]}] : (CAPED.proc || []).filter(x => x.k !== k); paneRender(); });
document.addEventListener('click', async e => { let b; const at = q => e.target.closest?.(q);
  if (at('[data-capview]')) { capView(); return; }
  if (at('[data-capedit]')) { capEdit(); return; }
  if ((b = at('[data-capfree]'))) { const c = capGet(), i = +b.dataset.capfree, mon = monday(TODAY); c.free = (c.free || []).map((x, j) => j === i ? {...x, wk: x.wk === mon ? null : mon} : x); await capSave(c); renderMod(true); if (P.stack.length) paneRender(); oneHap?.(8); return; }
  if (!CAPED) return;
  if (at('[data-capsadd]')) { (CAPED.steps ||= []).push({d: addDays(TODAY, 28), t: ''}); paneRender(); return; }
  if ((b = at('[data-capsx]'))) { CAPED.steps.splice(+b.dataset.capsx, 1); paneRender(); return; }
  if ((b = at('[data-capsdone]'))) { const s = CAPED.steps[+b.dataset.capsdone]; s.done = !s.done; paneRender(); return; }
  if ((b = at('[data-capfx]'))) { CAPED.free.splice(+b.dataset.capfx, 1); paneRender(); return; }
  if (at('[data-capfadd]')) { const v = document.querySelector('[data-capfn]')?.value.trim(); if (!v) return; (CAPED.free ||= []).push({t: v}); paneRender(); return; }
  if (at('[data-capsave]')) { if (!(CAPED.to > 0 && CAPED.date)) { toast('Mets un chrono et une date'); return; } await capSave(CAPED); closePane(); renderMod(true); if (P.stack.length) paneRender(); toast('Ton cap est enregistré'); }
});

/* ---------- la page Idées : juste à droite de l'Accueil, au pouce ---------- */
// Des idées pour performer plus vite, chacune avec sa preuve. « Je teste » l'ajoute aux moyens de la semaine (Ton cap).
const IDEAS = [
  ['img', 'Mental', 'Imagerie du départ, 5 min par jour', 'Le soir, yeux fermés : la chambre d\'appel, « à vos marques », la poussée, les 10 premiers appuis. En première personne, à vitesse réelle.', 'L\'imagerie améliore la performance motrice, surtout combinée à la pratique (méta-analyse Toth et al. 2020).'],
  ['rout', 'Mental', 'Une routine d\'avant-course, toujours la même', 'Écrire les 10 dernières minutes avant un 60 m : échauffement, 2 départs, respiration, mot-clé. La répéter à chaque séance de départs.', 'Les routines de performance stabilisent l\'attention et la régularité (ton cours de préparation mentale ; Cotterill 2010).'],
  ['talk', 'Mental', 'Un mot-clé par course', 'Un seul mot qui dit le geste : « pousse », « grand », « vite ». Le dire au « prêt ».', 'Le discours interne instructionnel améliore les tâches techniques (méta-analyse Hatzigeorgiadis et al. 2011, 32 études).'],
  ['ifthen', 'Mental', 'Mes plans « si… alors… »', 'Si je rate mon départ, alors je reste haut et je relâche les épaules. Si j\'ai les jambes lourdes à l\'échauffement, alors je fais 2 lignes droites de plus.', 'Les intentions de mise en œuvre aident à atteindre ses objectifs (méta-analyse Gollwitzer et Sheeran 2006).'],
  ['breath', 'Mental', 'Respiration 4-6 avant la chambre d\'appel', '2 minutes : inspire 4 s, souffle 6 s. Le cœur ralentit, la tête reste claire.', 'La respiration lente baisse l\'activation et le stress perçu (revue Zaccaro et al. 2018).'],
  ['proc', 'Objectifs', 'Le but de la séance, écrit avant', 'Une phrase avant chaque séance : « départ : pousser 3 appuis bas ». À la fin : réussi ou pas.', 'Les objectifs de processus sont ceux qui aident le plus la performance (Williamson et al. 2022 : d = 1,36).'],
  ['journal', 'Objectifs', 'Le carnet de 3 lignes', 'Après chaque séance : ce qui a marché, ce qui coince, ce que je change demain. 1 minute.', 'L\'auto-observation régulière accélère l\'apprentissage et la confiance (ton cours : le progrès se voit avec des faits).'],
  ['nap', 'Récupération', 'Sieste de 20 min les jours hauts', 'Entre la muscu et la piste : 20 min allongé, réveil avant 30 min.', 'Une courte sieste améliore le sprint et la vigilance après une nuit courte (revue Lastella et al. 2021).'],
  ['sleepx', 'Récupération', 'Allonger les nuits pendant 3 semaines', 'Viser 9 h au lit avant les compétitions de décembre.', 'Plus de sommeil = sprints plus rapides chez des athlètes universitaires (Mah et al. 2011).'],
  ['caf', 'Compétition', 'Tester la caféine à l\'entraînement', '3 mg/kg (environ 240 mg) 45 à 60 min avant une séance de départs. Seulement si ça te va, jamais le jour J sans test.', 'Gain sur la puissance et la vigilance (position de l\'ISSN, Guest et al. 2021).'],
  ['sim', 'Compétition', 'Une simulation de compétition', 'Une séance de départs aux horaires d\'une série : chambre d\'appel, 2 courses à 45 min d\'écart.', 'S\'entraîner dans les conditions du jour J réduit le stress et améliore le transfert (spécificité de l\'entraînement).'],
  ['video', 'Mesure', 'Filmer ses départs au ralenti', 'Téléphone sur le côté à 10 m, ralenti : angle du tibia, hauteur des hanches, premiers appuis. Comparer chaque mois.', 'Le retour vidéo accélère l\'apprentissage technique (revue Kok et al. 2020).'],
  ['fly', 'Mesure', 'Un 30 m lancé chronométré par mois', 'Même endroit, même chaussures. La vitesse max se suit comme un chrono de compétition.', 'Le suivi d\'un test simple et fiable montre les vrais progrès (Haugen et Buchheit 2016).'],
  ['cmj', 'Mesure', 'Un saut vertical chaque lundi', '3 sauts mains sur les hanches, la meilleure hauteur. Baisse de plus de 5 % = semaine plus légère.', 'Le saut suit bien la fatigue neuromusculaire (Claudino et al. 2017).'],
  ['coach', 'Équipe', 'Un point de 10 minutes par mois avec ton coach', 'Tes chiffres, ta vidéo, ton prochain jalon. Il voit ce que tu ne vois pas.', 'Les objectifs fixés avec un expert marchent mieux que seuls (Williamson et al. 2022).'],
  ['app-chrono', 'Idée d\'appli', 'Le chrono de départ dans l\'appli', 'L\'appli dit « à vos marques… prêt… » puis un bip à un moment au hasard, pour travailler la réaction seul.', 'Idée d\'outil, à construire si tu dis oui.'],
  ['app-week', 'Idée d\'appli', 'Le bilan du jalon', 'À chaque jalon passé, une page : le chrono, ce qui a marché, le prochain jalon recalculé.', 'Idée d\'outil, à construire si tu dis oui.']
];
function ideasPage() {
  const st = S.app?.ideas || {}, cats = [...new Set(IDEAS.map(x => x[1]))], c = capGet();
  const n = IDEAS.filter(x => st[x[0]] === 'yes').length;
  return `<div class="hm one-hm idp" id="hm"><header class="hm-head idp-h"><div class="sub">Pour aller plus vite, plus tôt</div><h1 class="hello">Idées</h1>
    <p class="idp-p">Des idées sérieuses, chacune avec sa preuve. « Je teste » l'ajoute à tes moyens de la semaine. Glisse vers la gauche pour revenir à l'accueil.${n ? ` Tu en testes ${n}.` : ''}</p></header>
    ${cats.map(k => `<div class="sec-label">${esc(k)}</div><div class="idl">${IDEAS.filter(x => x[1] === k).map(([id, , t, how, why]) => { const s = st[id];
      return `<article class="idc${s === 'yes' ? ' yes' : s === 'no' ? ' no' : ''}"><b>${esc(t)}</b><p>${esc(how)}</p><small>${esc(why)}</small><div class="idb"><button type="button" class="chip" data-idea="${id}|yes" aria-pressed="${s === 'yes'}">${s === 'yes' ? '✓ Je teste' : 'Je teste'}</button><button type="button" class="chip" data-idea="${id}|no" aria-pressed="${s === 'no'}">Pas pour moi</button></div></article>`; }).join('')}</div>`).join('')}
    <p class="small muted" style="margin:18px 4px 0">Cette page est un brouillon d'idées : ce que tu gardes passe dans l'appli, le reste disparaîtra.</p></div>`;
}
document.addEventListener('click', async e => { const b = e.target.closest?.('[data-idea]'); if (!b) return;
  const [id, v] = b.dataset.idea.split('|'), st = {...(S.app?.ideas || {})}, was = st[id]; st[id] = was === v ? null : v;
  const I = IDEAS.find(x => x[0] === id), c = capGet();
  if (I && !/^app-/.test(id)) { const has = (c.free || []).some(x => x.id === id); if (st[id] === 'yes' && !has) c.free = [...(c.free || []), {t: I[2], id}]; if (st[id] !== 'yes' && has) c.free = c.free.filter(x => x.id !== id); }
  S.app = {...(S.app || {}), ideas: st, cap: {...c, draft: c.draft}}; oneHap?.(8);
  const el = $('#home-view'); if (el && S.homeP === 'ideas') { el.innerHTML = ideasPage(); el._html = null; }
  await dbSet('settings/app', {...S.app, updatedAt: new Date().toISOString()});
  if (st[id] === 'yes') toast(/^app-/.test(id) ? 'Noté : idée d\'appli à construire' : 'Ajouté à tes moyens de la semaine');
});
// L'accueil : la date, la phrase du jour, Ton cap, puis le bilan. Avec la page Idées juste à droite.
const vHomeMain = vHome;
vHome = () => S.homeP === 'ideas' ? ideasPage() : vHomeMain().replace('</header>', '</header>' + capCard());
const capXnb0 = window.TAB_XNB;
// Idées est la page à gauche de l'accueil : le pouce glisse vers la droite pour l'ouvrir, vers la gauche pour revenir.
window.TAB_XNB = (k, T, html) => {
  if (T.home) {
    if (!S.homeP && k < 0) return {cls: '', box: $('#home-view'), html: () => ideasPage(), go: () => { S.homeP = 'ideas'; renderMod(true); window.scrollTo(0, 0); }};
    if (S.homeP && k > 0) return {cls: '', box: $('#home-view'), html: () => vHomeMain().replace('</header>', '</header>' + capCard()), go: () => { S.homeP = null; renderMod(true); window.scrollTo(0, 0); }};
    if (S.homeP) return null;
  }
  if (k < 0 && T.i === 0 && ONE.mods.includes(S.mod)) { S.homeP = null; }
  return capXnb0?.(k, T, html) ?? null;
};
const capHome0 = oneHome;
oneHome = function () { if (S.mod === 'home' && S.homeP) { S.homeP = null; renderMod(true); window.scrollTo(0, 0); return; } S.homeP = null; capHome0(); };
