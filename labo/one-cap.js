/* ================= Accueil · Ton cap : objectif, axes de travail, moyens de la semaine, chronos =================
   D'après le cours de préparation mentale d'Oscar (objectifs SMART ; long terme = le rêve, moyen terme = la discipline,
   court terme = la motivation) et la méta-analyse de Williamson et al. 2022 (27 études) : les objectifs de processus
   (ce que je fais) aident le plus la performance (d = 1,36), un chrono un peu (d = 0,44), un classement seul presque pas.
   Les objectifs de moyens d'Oscar, ce sont ses défauts à réduire : sa matrice « Préparation physique Sprint.xlsx »
   (feuille Planification Tec), notée sur l'importance (1 à 10) et la rapidité à corriger (1 à 10).
   Tout se change ici, dans l'appli, sans passer par Claude. Rangé dans settings/app.cap (sauvé à chaque geste). */
const CAP_PROC = {
  quest: ['Questionnaire du matin', 'jours', 7, k => !!M(k, 'mornAt')],
  sleep: ['Nuits de 8 h ou plus', 'nuits', 5, k => (+G(k, 'sleepS') || 0) >= 8 * 3600],
  gym: ['Séances de muscu', 'séances', 3, k => logsOn(k).some(l => l.kind === 'gym')],
  track: ['Séances de piste', 'séances', 3, k => logsOn(k).some(l => l.kind === 'track')],
  food: ['Journal nutrition rempli', 'jours', 6, k => !!M(k, 'closed')]
};
// Ses défauts, repris de son fichier, avec une mesure et des premières étapes (à changer comme il veut).
const CAP_AXES = () => [
  {id: 'contact', n: 'Temps de contact au sol trop long', imp: 9, rap: 8, m: 'Contact sous 200 ms (il était à 300 ms)', subs: ['Mesurer mon temps de contact en vidéo', 'Course sur lattes : poser le pied sous le bassin', 'Montées de genoux rapides, 3 × 10 m', 'Re-mesurer en vidéo dans 4 semaines']},
  {id: 'releve', n: 'Se relève trop vite sur les premiers mètres', imp: 8, rap: 6, m: 'Rester penché sur 10 à 15 m', subs: ['Filmer un départ de côté', 'Traîneau 10 m, buste penché', 'Départ 3 appuis : rester bas 5 appuis']},
  {id: 'freq', n: 'Pas assez de fréquence dans la foulée', imp: 7, rap: 7, m: 'Fréquence mesurée en vidéo (pas par seconde)', subs: ['Mesurer ma fréquence en vidéo', 'Lattes rapprochées, 4 × 20 m', 'Bras plus rapides : exercice des bras assis']},
  {id: 'relache', n: 'Buste et épaules pas assez relâchés', imp: 6, rap: 5, m: 'Courses relâchées validées en vidéo', subs: ['Filmer de face sur 60 m', 'Courses relâchées 4 × 60 m à 85 %', 'Mot-clé « relâche » à mi-course']},
  {id: 'tete', n: 'Tête relevée dès le départ', imp: 6, rap: 4, m: 'Regard au sol sur les 5 premiers mètres', subs: ['Filmer un départ de côté', 'Départs avec un repère au sol à 3 m']},
  {id: 'talons', n: 'Talons-fesses au départ', imp: 5, rap: 4, m: 'Genou devant dès le 1er appui', subs: ['A-skip et marche genou haut', 'Filmer un départ de côté']},
  {id: 'ligne', n: 'Épaules en avant de la ligne aux blocs', imp: 4, rap: 2, m: 'Épaules juste au-dessus de la ligne', subs: ['Photo de ma position de blocs', 'Régler les blocs avec le coach']},
  {id: 'fv', n: 'Profil force-vitesse : la vitesse à développer', imp: 7, rap: 5, m: 'Profil de saut proche de 100 % de l\'optimal (167 % en février)', subs: ['Charges légères déplacées vite', 'Refaire le profil force-vitesse au saut']}
].map(a => ({...a, st: 'todo', subs: a.subs.map(t => ({t, done: false}))}));
const capDef = () => {
  const pb = parseFloat(String(S.profile?.sprinter?.pb60 || '7.60').replace(',', '.')) || 7.6;
  return {dream: 'Le haut niveau : courir les championnats de France élite', res: 'Championnats en salle', date: '2027-03-07', ev: '60 m', pb, to: Math.round((pb - .15) * 100) / 100,
    steps: [{d: '2026-12-13', t: 'Liévin : premier 60 m de l\'hiver'}, {d: '2026-12-20', t: 'Meeting JB'}, {d: '2027-01-24', t: 'Fin janvier : 60 m sous ' + chr(pb - .08)}],
    proc: [{k: 'sleep', n: 5}, {k: 'gym', n: 3}, {k: 'track', n: 3}], free: [], axes: CAP_AXES(), chronos: [], skip: {}, adj: {}, draft: true};
};
const capGet = () => { const c = {...capDef(), ...(S.app?.cap || {})}; if (!c.axes) c.axes = CAP_AXES(); return c; };
const chr = v => { const x = Math.round(v * 100) / 100, s = Math.floor(x), c = Math.round((x - s) * 100); return `${s}"${String(c).padStart(2, '0')}`; };
const fmtLong = k => new Date(k + 'T12:00:00').toLocaleDateString('fr-FR', {day: 'numeric', month: 'long', year: 'numeric'});
const capPrio = a => (+a.imp || 0) * (+a.rap || 0);
const capAxes = c => [...(c.axes || [])].sort((a, b) => (a.st === 'done') - (b.st === 'done') || capPrio(b) - capPrio(a));
let CAPT = null;
// Sauvé à chaque geste (les textes, un peu après la dernière lettre).
function capSave(c, now) { S.app = {...(S.app || {}), cap: {...c, draft: false}}; clearTimeout(CAPT); const go = () => dbSet('settings/app', {...S.app, updatedAt: new Date().toISOString()}); if (now) go(); else CAPT = setTimeout(go, 700); }
function capMut(fn, keep) { const c = capGet(); fn(c); capSave(c, !keep); if (!keep) { if (P.stack.length) paneRender(); if (S.mod === 'home') renderMod(true); } }
// Les moyens de la semaine (lundi → aujourd'hui), comptés par l'appli, avec la correction et l'excuse de la semaine.
function capWeek(c) {
  const mon = monday(TODAY), days = []; for (let k = mon; k <= TODAY; k = addDays(k, 1)) days.push(k);
  return [...(c.proc || []).filter(p => CAP_PROC[p.k]).map(p => { const [n, u, , f] = CAP_PROC[p.k]; let v = 0; for (const k of days) try { if (f(k)) v++; } catch (e) {}
      const adj = +(c.adj || {})[p.k + '|' + mon] || 0, skip = (c.skip || {})[p.k] === mon; return {n, u, v: Math.max(0, v + adj), auto: v, adj, goal: p.n, k: p.k, skip}; }),
    ...(c.free || []).map((x, i) => ({n: x.t, u: '', v: (x.wk === mon ? 1 : 0), goal: 1, free: i}))];
}
const capOk = W => W.filter(x => x.skip || x.v >= x.goal).length;
// Les chronos de la saison : le meilleur se place sur la ligne, entre le record et l'objectif.
const capBest = c => { const L = (c.chronos || []).filter(x => +x.t > 0 && (!c.ev || !x.ev || x.ev === c.ev)); return L.length ? Math.min(...L.map(x => +x.t)) : null; };

function capCard() {
  const c = capGet(), left = daysBetween(TODAY, c.date), W = capWeek(c), ax = capAxes(c).find(a => a.st !== 'done');
  const steps = (c.steps || []).filter(s => s.d).sort((a, b) => a.d.localeCompare(b.d)), t0 = c.start || '2026-11-01', span = Math.max(1, daysBetween(t0, c.date));
  const pos = d => Math.max(0, Math.min(100, daysBetween(t0, d) / span * 100)), nx = steps.find(s => s.d >= TODAY), best = capBest(c);
  const sd = ax ? ax.subs.filter(s => s.done).length : 0;
  return `<button type="button" class="cap" data-capview aria-label="Ton cap : ouvrir"><span class="cap-h"><span class="eyebrow">Ton cap</span><span class="cap-j">${left > 0 ? 'J-' + left : left === 0 ? 'Jour J' : 'Passé'}</span></span>
    <span class="cap-goal">${esc(c.ev)} en ${chr(c.to)}</span>
    <span class="cap-sub">${esc(c.res)} · ${esc(fmtShort(c.date))}${best ? ` · meilleur ${chr(best)}` : ` · record ${chr(c.pb)}`}</span>
    <span class="cap-line" aria-hidden="true"><i style="width:${pos(TODAY).toFixed(1)}%"></i>${steps.map(s => `<em class="${s.done ? 'ok' : s.d < TODAY ? 'past' : ''}" style="left:${pos(s.d).toFixed(1)}%"></em>`).join('')}<em class="end" style="left:100%"></em></span>
    ${ax ? `<span class="cap-ax"><small>Axe n° 1</small>${esc(ax.n)}<b>${sd}/${ax.subs.length}</b></span>` : ''}
    <span class="cap-f2"><span>${nx ? `Prochain : ${esc(nx.t.split(':')[0])} · ${esc(fmtShort(nx.d))}` : ''}</span>${W.length ? `<b>Semaine ${capOk(W)}/${W.length} ›</b>` : ''}</span></button>`;
}

/* ---------- le détail : chaque bloc se change sur place (« Modifier » ouvre ses champs, rien d'autre ne bouge) ---------- */
let CAPM = null, CAPX = null, CAPW = null;
const capIn = (k, v, t = 'text', ph = '', cls = '') => `<input class="mini-in cap-in ${cls}" type="${t}" data-capin="${k}" value="${esc(v ?? '')}" placeholder="${esc(ph)}"${t === 'number' ? ' step="0.01" inputmode="decimal"' : ''}>`;
const capSec = (k, title, sub) => `<div class="cap-sec"><span class="sec-label">${title}${sub ? ` <small>${sub}</small>` : ''}</span><button type="button" class="cap-mod" data-capmode="${k}">${CAPM === k ? 'OK' : 'Modifier'}</button></div>`;
function capView() { CAPM = null; CAPX = null; CAPW = null; openPane({title: 'Ton cap', onClose: () => { CAPM = CAPX = CAPW = null; }, render: capHub}); }
function capHub() {
  const c = capGet(), W = capWeek(c), steps = (c.steps || []).map((s, i) => ({...s, i})).sort((a, b) => (a.d || '').localeCompare(b.d || '')), best = capBest(c), A = capAxes(c);
  const goal = CAPM === 'goal' ? `<div class="cap-ed"><label>Le rêve${capIn('dream', c.dream, 'text', 'Ce que tu vises dans ta carrière')}</label>
      <div class="cap-g2"><label>Compétition${capIn('res', c.res)}</label><label>Date${capIn('date', c.date, 'date')}</label></div>
      <div class="cap-g3"><label>Épreuve${capIn('ev', c.ev)}</label><label>Record (s)${capIn('pb', c.pb, 'number')}</label><label>Objectif (s)${capIn('to', c.to, 'number')}</label></div></div>`
    : `${c.dream ? `<p class="cap-dream">${esc(c.dream)}</p>` : ''}<div class="cap-big"><b>${esc(c.ev)} en ${chr(c.to)}</b><span>${esc(c.res)} · ${esc(cap(fmtLong(c.date)))}</span><span>Record ${chr(c.pb)}${best ? ` · meilleur cette saison ${chr(best)}` : ''} · ${fx(Math.round(((best || c.pb) - c.to) * 100) / 100, 2)} s à gagner</span></div>`;
  const jal = CAPM === 'steps' ? `${steps.map(s => `<div class="cap-st">${capIn('sd' + s.i, s.d, 'date')}${capIn('st' + s.i, s.t, 'text', 'Ex. 60 m sous 7"55')}<button type="button" class="cap-x" data-capdel="steps.${s.i}" aria-label="Retirer">×</button></div>`).join('')}<button type="button" class="cap-add" data-capadd="steps">+ Ajouter un jalon</button>`
    : `<div class="list">${steps.map(s => `<button type="button" class="row cap-row" data-captog="steps.${s.i}"><span class="cap-ck${s.done ? ' on' : ''}">${s.done ? '✓' : ''}</span><span style="flex:1">${esc(s.t)}<span class="hint">${esc(cap(fmtShort(s.d)))}${s.d < TODAY && !s.done ? ' · passé' : ''}</span></span></button>`).join('') || '<p class="small muted" style="margin:6px 4px">Aucun jalon.</p>'}</div>`;
  const axes = A.map(a => { const i = c.axes.indexOf(a), open = CAPX === a.id, sd = a.subs.filter(s => s.done).length, nv = (S.app?.videos || []).filter(v => (v.axes || []).includes(a.id)).length, ms = typeof vidMeasure === 'function' ? vidMeasure(a.id) : '';
    return `<div class="cap-axe${open ? ' open' : ''}${a.st === 'done' ? ' done' : ''}"><button type="button" class="cap-axh" data-capax="${esc(a.id)}"><span class="cap-pr">${a.st === 'done' ? '✓' : capPrio(a)}</span><span class="cap-axn">${esc(a.n)}<small>Important ${a.imp}/10 · rapide à corriger ${a.rap}/10</small></span><b>${sd}/${a.subs.length}</b></button>
      ${open ? `<div class="cap-axb">${CAPM === 'ax' + a.id ? `<label>Le défaut${capIn('an' + i, a.n)}</label><div class="cap-g2"><label>Important (1-10)${capIn('ai' + i, a.imp, 'number')}</label><label>Rapide à corriger (1-10)${capIn('ar' + i, a.rap, 'number')}</label></div><label>Comment je sais que c'est corrigé${capIn('am' + i, a.m)}</label>
          ${a.subs.map((s, j) => `<div class="cap-st1">${capIn('as' + i + '.' + j, s.t)}<button type="button" class="cap-x" data-capdel="sub.${i}.${j}" aria-label="Retirer">×</button></div>`).join('')}<button type="button" class="cap-add" data-capadd="sub.${i}">+ Ajouter une étape</button>
          <div class="cap-g2" style="margin-top:10px"><button type="button" class="chip" data-capst="${i}">${a.st === 'done' ? 'Remettre à travailler' : 'Défaut corrigé'}</button><button type="button" class="chip cap-danger" data-capdel="axe.${i}">Supprimer l'axe</button></div>`
        : `${a.m ? `<p class="cap-m">${esc(a.m)}${ms ? `<b>${esc(ms)}</b>` : ''}</p>` : ''}<div class="list">${a.subs.map((s, j) => `<button type="button" class="row cap-row" data-captog="sub.${i}.${j}"><span class="cap-ck${s.done ? ' on' : ''}">${s.done ? '✓' : ''}</span><span style="flex:1">${esc(s.t)}</span></button>`).join('')}</div>
          <div class="cap-axf"><button type="button" class="chip" data-vidopen="${esc(a.id)}">${nv ? `Vidéos (${nv})` : 'Ajouter une vidéo'}</button><button type="button" class="cap-mod" data-capmode="ax${esc(a.id)}">Modifier</button></div>`}</div>` : ''}</div>`; }).join('');
  const week = W.map(x => { const open = CAPW === (x.k || 'f' + x.free), ok = x.skip || x.v >= x.goal;
    return `<div class="cap-wr${open ? ' open' : ''}"><button type="button" class="cap-r${ok ? ' ok' : ''}" data-capwk="${x.k || 'f' + x.free}"><span class="cap-ck${ok ? ' on' : ''}">${ok ? '✓' : ''}</span><span>${esc(x.n)}${x.skip ? '<small> · pas cette semaine</small>' : ''}</span><b>${x.free != null ? '' : `${x.v}/${x.goal}`}</b></button>
      ${open ? (x.free != null ? `<div class="cap-wb"><button type="button" class="chip" data-capfree="${x.free}">${x.v ? 'Pas fait cette semaine' : 'Fait cette semaine'}</button><button type="button" class="chip cap-danger" data-capdel="free.${x.free}">Retirer</button></div>`
        : `<div class="cap-wb"><span>Objectif</span><button type="button" class="cap-pm" data-capn="${x.k}.-1">−</button><b>${x.goal}</b><button type="button" class="cap-pm" data-capn="${x.k}.1">+</button><span>par semaine</span></div>
          <div class="cap-wb"><span>Compté : ${x.auto}${x.adj ? ` ${x.adj > 0 ? '+' : '−'} ${Math.abs(x.adj)}` : ''}</span><button type="button" class="cap-pm" data-capadj="${x.k}.-1">−</button><button type="button" class="cap-pm" data-capadj="${x.k}.1">+</button><span>corriger</span></div>
          <div class="cap-wb"><button type="button" class="chip" data-capskip="${x.k}" aria-pressed="${x.skip}">${x.skip ? '✓ Pas cette semaine' : 'Pas cette semaine (blessure, repos…)'}</button><button type="button" class="chip cap-danger" data-capdel="proc.${x.k}">Ne plus suivre</button></div>`) : ''}</div>`; }).join('');
  const off = Object.keys(CAP_PROC).filter(k => !(c.proc || []).some(p => p.k === k));
  const chronos = (c.chronos || []).map((x, i) => ({...x, i})).sort((a, b) => (b.d || '').localeCompare(a.d || ''));
  return `${capSec('goal', 'Ton objectif')}${goal}
    ${capSec('steps', 'Les jalons', 'touche pour cocher')}${jal}
    <div class="cap-sec"><span class="sec-label">Tes axes de travail <small>tes objectifs de moyens</small></span></div>
    <p class="small muted" style="margin:0 4px 8px">Tes défauts, classés : important × rapide à corriger.</p>
    <div class="cap-axes">${axes}</div><button type="button" class="cap-add" data-capadd="axe">+ Ajouter un axe de travail</button>
    <div class="cap-sec"><span class="sec-label">Cette semaine <small>ce qui dépend de toi</small></span></div>
    <div class="cap-w">${week}</div>
    <div class="cap-g2" style="margin-top:8px">${off.length ? `<select class="mini-in" data-capproc><option value="">+ Suivre aussi…</option>${off.map(k => `<option value="${k}">${esc(CAP_PROC[k][0])}</option>`).join('')}</select>` : ''}<button type="button" class="chip" data-capadd="free">+ Un moyen à moi</button></div>
    <div class="cap-sec"><span class="sec-label">Tes chronos <small>la saison</small></span></div>
    <div class="list">${chronos.map(x => `<div class="row"><span style="flex:1"><b>${chr(+x.t)}</b> · ${esc(x.ev || c.ev)}<span class="hint">${esc(x.w || '')}${x.d ? ' · ' + esc(fmtShort(x.d)) : ''}</span></span><button type="button" class="cap-x" data-capdel="chr.${x.i}" aria-label="Retirer">×</button></div>`).join('')}
      <div class="row cap-chr">${capIn('cd', TODAY, 'date', '', 'cap-cd')}${capIn('ct', '', 'number', 'Temps (s)', 'cap-ct')}${capIn('cw', '', 'text', 'Où', 'cap-cw')}<button type="button" class="chip" data-capchr>Ajouter</button></div></div>
    <div class="cap-g2" style="margin-top:16px"><button type="button" class="btn ghost" data-vidopen="">Mes vidéos de sprint</button><button type="button" class="btn ghost" data-ideago="start">Le starter</button></div>`;
}
// Les champs : un texte change la donnée sans redessiner (le clavier reste ouvert).
document.addEventListener('input', e => { const k = e.target.dataset?.capin; if (!k || ['cd', 'ct', 'cw'].includes(k)) return; const v = e.target.value;
  capMut(c => {
    if (['dream', 'res', 'date', 'ev'].includes(k)) c[k] = v; else if (k === 'pb' || k === 'to') c[k] = parseFloat(String(v).replace(',', '.')) || c[k];
    else if (/^s[dt]\d+$/.test(k)) { const s = c.steps[+k.slice(2)]; if (s) s[k[1] === 'd' ? 'd' : 't'] = v; }
    else if (/^a[nirm]\d+$/.test(k)) { const a = c.axes[+k.slice(2)]; if (a) { const f = {an: 'n', ai: 'imp', ar: 'rap', am: 'm'}[k.slice(0, 2)]; a[f] = f === 'imp' || f === 'rap' ? Math.max(1, Math.min(10, Math.round(+v) || 1)) : v; } }
    else if (/^as\d+\.\d+$/.test(k)) { const [i, j] = k.slice(2).split('.').map(Number); if (c.axes[i]?.subs[j]) c.axes[i].subs[j].t = v; }
  }, true); });
document.addEventListener('change', e => { const t = e.target; if (t.matches?.('[data-capproc]') && t.value) { const k = t.value; capMut(c => { c.proc = [...(c.proc || []), {k, n: CAP_PROC[k][2]}]; }); } });
document.addEventListener('click', e => { let b; const at = q => (b = e.target.closest?.(q));
  if (at('[data-capview]')) { capView(); return; }
  if (at('[data-capmode]')) { const k = b.dataset.capmode; CAPM = CAPM === k ? null : k; if (CAPM === null) { capSave(capGet(), true); if (S.mod === 'home') renderMod(true); } paneRender(); return; }
  if (at('[data-capax]')) { const id = b.dataset.capax; CAPX = CAPX === id ? null : id; if (CAPM?.startsWith('ax')) CAPM = null; paneRender(); return; }
  if (at('[data-capwk]')) { const k = b.dataset.capwk; CAPW = CAPW === k ? null : k; paneRender(); return; }
  if (at('[data-captog]')) { const [w, i, j] = b.dataset.captog.split('.'); capMut(c => { if (w === 'steps') c.steps[+i].done = !c.steps[+i].done; else { const s = c.axes[+i].subs[+j]; s.done = !s.done; } }); oneHap?.(8); return; }
  if (at('[data-capst]')) { capMut(c => { const a = c.axes[+b.dataset.capst]; a.st = a.st === 'done' ? 'todo' : 'done'; }); CAPM = null; return; }
  if (at('[data-capn]')) { const [k, d] = b.dataset.capn.split('.'); capMut(c => { const p = c.proc.find(x => x.k === k); if (p) p.n = Math.max(1, Math.min(7, p.n + +d)); }); return; }
  if (at('[data-capadj]')) { const [k, d] = b.dataset.capadj.split('.'), key = k + '|' + monday(TODAY); capMut(c => { c.adj = {...(c.adj || {}), [key]: (+(c.adj || {})[key] || 0) + +d}; }); return; }
  if (at('[data-capskip]')) { const k = b.dataset.capskip, mon = monday(TODAY); capMut(c => { c.skip = {...(c.skip || {})}; c.skip[k] = c.skip[k] === mon ? null : mon; }); return; }
  if (at('[data-capfree]')) { const i = +b.dataset.capfree, mon = monday(TODAY); capMut(c => { c.free[i].wk = c.free[i].wk === mon ? null : mon; }); oneHap?.(8); return; }
  if (at('[data-capadd]')) { const w = b.dataset.capadd;
    if (w === 'steps') capMut(c => { (c.steps ||= []).push({d: addDays(TODAY, 28), t: ''}); });
    else if (w === 'axe') { const id = 'a' + Date.now().toString(36); capMut(c => { (c.axes ||= []).push({id, n: 'Nouveau défaut', imp: 5, rap: 5, m: '', st: 'todo', subs: [{t: 'Filmer pour voir où j\'en suis', done: false}]}); }); CAPX = id; CAPM = 'ax' + id; paneRender(); }
    else if (w === 'free') { const t = prompt('Ton moyen (ex. 5 min d\'imagerie du départ)'); if (t?.trim()) capMut(c => { (c.free ||= []).push({t: t.trim()}); }); }
    else if (w.startsWith('sub.')) capMut(c => { c.axes[+w.slice(4)].subs.push({t: '', done: false}); });
    return; }
  if (at('[data-capdel]')) { const [w, i, j] = b.dataset.capdel.split('.');
    if (w === 'axe' && !confirm('Supprimer cet axe de travail ?')) return;
    capMut(c => { if (w === 'steps') c.steps.splice(+i, 1); else if (w === 'sub') c.axes[+i].subs.splice(+j, 1); else if (w === 'axe') { c.axes.splice(+i, 1); CAPX = null; CAPM = null; }
      else if (w === 'free') c.free.splice(+i, 1); else if (w === 'proc') { c.proc = c.proc.filter(p => p.k !== i); CAPW = null; } else if (w === 'chr') c.chronos.splice(+i, 1); }); return; }
  if (at('[data-capchr]')) { const t = parseFloat(String($('.cap-ct')?.value || '').replace(',', '.')); if (!(t > 0)) { toast('Écris le temps, ex. 7.58'); return; }
    capMut(c => { (c.chronos ||= []).push({d: $('.cap-cd')?.value || TODAY, t, w: ($('.cap-cw')?.value || '').trim(), ev: c.ev}); }); toast('Chrono ajouté'); return; }
});

/* ---------- la page Idées : à gauche de l'accueil. Des fonctions de l'appli, pas des conseils ---------- */
// Prêtes : « Ouvrir » les lance. À construire : « Je la veux » la note pour la suite.
const IDEAS = [
  ['vid', 'Prête', 'Mes vidéos de sprint', 'Range tes vidéos d\'entraînement, regarde-les au ralenti image par image, chronomètre un passage, mesure ton temps de contact et ta fréquence de foulée. Chaque vidéo se range dans un axe de travail.', () => vidPane()],
  ['axes', 'Prête', 'Mes axes de travail', 'Tes défauts de course, classés par importance et rapidité à corriger, avec leurs étapes à cocher et la mesure vidéo qui dit si c\'est corrigé.', () => capView()],
  ['start', 'Prête', 'Le starter', '« À vos marques… prêt… » puis le bip à un moment au hasard, comme en compétition. Touche l\'écran au bip : l\'appli donne ton temps de réaction.', () => starterPane()],
  ['mental', 'À construire', 'Les séances mentales dans le planning', 'Imagerie, routine d\'avant-course, respiration : des séances de Training à caler comme les autres, avec leur minuteur.'],
  ['compare', 'À construire', 'Deux vidéos côte à côte', 'Ton départ d\'aujourd\'hui à côté de celui d\'il y a un mois, synchronisés au premier appui.'],
  ['jalon', 'À construire', 'Le bilan de chaque jalon', 'Après chaque compétition : ton chrono, ce qui a marché, tes axes qui ont bougé, et le prochain jalon recalculé.'],
  ['fly', 'À construire', 'Le 30 m lancé chronométré au téléphone', 'Le téléphone posé à l\'arrivée filme et détecte ton passage : ta vitesse maximale chaque mois.'],
  ['race', 'À construire', 'Le plan du jour de compétition', 'L\'heure de ta série : l\'appli te donne l\'heure du repas, de l\'échauffement, de la chambre d\'appel.']
];
function ideasPage() {
  const st = S.app?.ideas || {};
  return `<div class="hm one-hm idp" id="hm"><header class="hm-head idp-h"><div class="sub">Pour aller plus vite, plus tôt</div><h1 class="hello">Idées</h1>
    <p class="idp-p">Des fonctions pour l'appli. « Ouvrir » lance celles qui sont prêtes ; « Je la veux » note les autres pour les construire. Glisse vers la gauche pour revenir.</p></header>
    ${['Prête', 'À construire'].map(k => `<div class="sec-label">${k === 'Prête' ? 'Prêtes' : 'À construire'}</div><div class="idl">${IDEAS.filter(x => x[1] === k).map(([id, , t, how, fn]) => { const s = st[id];
      return `<article class="idc${s === 'yes' ? ' yes' : ''}"><b>${esc(t)}</b><p>${esc(how)}</p><div class="idb">${fn ? `<button type="button" class="chip on" data-ideago="${id}">Ouvrir</button>` : `<button type="button" class="chip" data-idea="${id}" aria-pressed="${s === 'yes'}">${s === 'yes' ? '✓ Je la veux' : 'Je la veux'}</button>`}</div></article>`; }).join('')}</div>`).join('')}</div>`;
}
document.addEventListener('click', async e => {
  const g = e.target.closest?.('[data-ideago]'); if (g) { IDEAS.find(x => x[0] === g.dataset.ideago)?.[4]?.(); return; }
  const b = e.target.closest?.('[data-idea]'); if (!b) return;
  const id = b.dataset.idea, st = {...(S.app?.ideas || {})}; st[id] = st[id] === 'yes' ? null : 'yes';
  S.app = {...(S.app || {}), ideas: st}; oneHap?.(8);
  const el = $('#home-view'); if (el && S.homeP === 'ideas') { el.innerHTML = ideasPage(); el._html = null; }
  await dbSet('settings/app', {...S.app, updatedAt: new Date().toISOString()});
  if (st[id] === 'yes') toast('Noté : à construire');
});

/* ---------- le starter : « À vos marques… prêt… » puis bip au hasard, et ton temps de réaction ---------- */
const STR = {on: false, t: null, beep: 0, last: null, best: null};
function starterPane() {
  openPane({title: 'Le starter', onClose: () => { clearTimeout(STR.t); STR.on = false; try { speechSynthesis.cancel(); } catch (e) {} }, render: () => `
    <p class="small muted" style="margin:14px 4px 10px">Mets-toi en position. « À vos marques », 5 secondes, « prêt », puis le bip entre 1,2 et 2,5 secondes après. Touche le grand bouton au bip.</p>
    <button type="button" class="strbig${STR.on ? ' on' : ''}" data-strgo>${STR.on ? (STR.beep ? 'TOUCHE !' : 'Attends le bip…') : 'Lancer le départ'}</button>
    ${STR.last != null ? `<div class="strres"><b class="num">${STR.last < 0 ? 'Faux départ' : STR.last + ' ms'}</b><span>${STR.last < 0 ? 'tu es parti avant le bip' : STR.last < 100 ? 'moins de 100 ms : en compétition, c\'est un faux départ' : 'temps de réaction'}${STR.best ? ` · meilleur ${STR.best} ms` : ''}</span></div>` : ''}`});
}
function strBeep() { try { const A = STR.ac ||= new (window.AudioContext || window.webkitAudioContext)(), o = A.createOscillator(), g = A.createGain(); o.frequency.value = 1000; g.gain.value = .5; o.connect(g).connect(A.destination); o.start(); o.stop(A.currentTime + .25); } catch (e) {} }
function strSay(t) { try { const u = new SpeechSynthesisUtterance(t); u.lang = 'fr-FR'; u.rate = .95; speechSynthesis.speak(u); } catch (e) {} }
document.addEventListener('click', e => { if (!e.target.closest?.('[data-strgo]')) return;
  if (!STR.on) { STR.on = true; STR.beep = 0; STR.last = null; try { (STR.ac ||= new (window.AudioContext || window.webkitAudioContext)()).resume(); } catch (er) {} strSay('À vos marques'); paneRender();
    STR.t = setTimeout(() => { strSay('Prêt'); STR.t = setTimeout(() => { strBeep(); STR.beep = performance.now(); paneRender(); STR.t = setTimeout(() => { if (STR.on) { STR.on = false; STR.last = null; paneRender(); } }, 3000); }, 1200 + Math.random() * 1300); }, 5000); return; }
  clearTimeout(STR.t); const r = STR.beep ? Math.round(performance.now() - STR.beep) : -1; STR.on = false; STR.last = r; if (r >= 100 && (!STR.best || r < STR.best)) STR.best = r; oneHap?.(12); paneRender(); });

// L'accueil : la date, la phrase du jour, puis le bilan. Ton cap est un carré en haut (à côté du planning) ;
// plus de page Idées sur le côté : ses fonctions sont dans Ton cap (vidéos, axes, starter).
S.homeP = null;
