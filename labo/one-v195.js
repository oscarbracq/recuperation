/* ================= v195 : séances de sprint remises, Mon mental, point du questionnaire, séances du coach en image ================= */

// 1) Les séances de sprint du coach (athle-AAAA-MM-JJ) n'étaient plus posées sur leurs jours : on les remet, une seule fois,
//    sur le créneau du soir (« jour|t »), sans rien écraser de ce qui est déjà calé.
(function mig195() {
  const t = setInterval(async () => {
    if (!S.app?.updatedAt || !S.tset?.updatedAt || !S.plans || !Object.keys(S.plans).length || typeof saveTset !== 'function') return;
    clearInterval(t); if (S.app.mig195) return;
    const dated = {...(S.tset.dated || {})}; let n = 0;
    for (const p of Object.values(S.plans)) { const m = /^athle-(\d{4}-\d\d-\d\d)$/.exec(p.id || ''); if (!m || p.deleted || p.kind !== 'track' || m[1] < TODAY) continue;
      const k = m[1]; if (dated[k + '|t'] || planOf(dated[k])?.kind === 'track') continue; dated[k + '|t'] = p.id; n++; }
    try { if (n) await saveTset({dated}); S.app = {...S.app, mig195: true}; await dbSet('settings/app', {...S.app, updatedAt: new Date().toISOString()}); if (n) toast(`${n} séances de sprint remises dans le planning`); } catch (e) { /* on réessaiera */ }
  }, 1500);
})();

// 2) Training · Mon corps : « Mon corps » reste au centre, « Mon mental » à côté, dans un bloc qui ouvre le préparateur mental.
const tBody195 = tBody;
tBody = function () { return tBody195().replace('<h1>Mon corps</h1>', '<div class="bodyh"><h1>Mon corps</h1><button type="button" class="bodyh-m" data-mpopen>Mon mental <span aria-hidden="true">›</span></button></div>'); };

// 3) Le petit point bleu sur « + » tant que le questionnaire du moment n'est pas rempli (matin, puis soir à partir de 18 h).
function qDot() { const b = document.querySelector('#one-top [data-hday]'); if (!b || !S.manual) return; const h = new Date().getHours();
  const due = !M(TODAY, 'mornAt') && h >= 5 || h >= 18 && !M(TODAY, 'closed'); b.classList.toggle('due', !!due); }
setInterval(qDot, 30e3); new MutationObserver(() => { clearTimeout(qDot.t); qDot.t = setTimeout(qDot, 300); }).observe(document.body, {childList: true});
document.addEventListener('visibilitychange', () => { if (!document.hidden) qDot(); });

// 4) Les séances du coach envoyées en image (WhatsApp, capture, PDF) : Claude les recopie telles quelles, avec ses
//    conseils, et ajoute en haut de chaque séance UNE phrase pour travailler un défaut d'Oscar. Sur téléphone aussi.
sprintChip = () => `<button type="button" class="seachip coachchip" data-coachsp aria-label="Coach sprint : créer des séances de piste"><span>Coach</span><b>Sprint</b></button>`;
const tSes195 = tSessions;
tSessions = () => tSes195().replace('data-tnew>+ Créer une séance</button>', 'data-tnew>+ Créer une séance</button><button class="btn ghost" style="margin-top:8px;width:100%" data-spimg>Séances de mon coach (image)</button>');
const spPrompt0 = spPrompt;
spPrompt = function () {
  if (!CSP.img) return spPrompt0();
  return `Utilise le skill « coach-sprint ». L'image jointe (ou le fichier) contient les séances de piste que mon coach de club m'a envoyées.
1. RECOPIE-LES EXACTEMENT : mêmes dates, même contenu (distances, répétitions, récupérations, intensités), mêmes conseils du coach. N'invente rien, ne change rien. Si une date manque, déduis-la du jour de la semaine et du mois ; si un élément est illisible, dis-le.
2. Pour CHAQUE séance, ajoute en haut une seule phrase (« cue », 2 à 10 mots) qui va m'aider à corriger un de mes défauts, choisie selon le contenu de la séance (départs → défaut de départ, vitesse → contact ou fréquence, lactique → relâchement).

Ce que l'appli sait de moi :
${spContext()}

Réponds d'abord par un tableau (date, séance du coach, ma phrase), puis TERMINE par un seul bloc \`\`\`json, de la même forme que d'habitude :
{"tnr":"plan","kind":"track","sessions":[{"date":"AAAA-MM-JJ","name":"…","title":"…","cue":"…","axe":"…","desc":"le texte du coach","tech":"ses conseils","twMin":15,"items":[…]}]}
Les exercices (« ex ») doivent être des identifiants de l'appli (voir le skill).`;
};
const spPane0 = spPane;
spPane = function () {
  spPane0(); const v = P.stack.at(-1); if (!v || v.title !== 'Coach sprint' || v.render._w) { paneRender(); return; } const r0 = v.render;
  v.render = () => { let h = r0();
    const sw = `<div class="seg spmode" role="group" style="margin-top:14px"><button type="button" data-spmode="0" aria-pressed="${!CSP.img}">Claude crée mes séances</button><button type="button" data-spmode="1" aria-pressed="${!!CSP.img}">Séances de mon coach</button></div>`;
    if (CSP.img) h = h.replace(/<div class="card"><span class="eyebrow">1 · Ce que tu veux<\/span>[\s\S]*?<\/div>\s*<div class="card" style="margin-top:12px"><span class="eyebrow">2 ·/, `<div class="card"><span class="eyebrow">1 · L'image de ton coach</span>
        <label class="btn ghost" style="width:100%;margin-top:8px"><input type="file" accept="image/*,application/pdf" data-spfile hidden>${CSP.imgName ? '✓ ' + esc(CSP.imgName) : 'Ajouter la capture ou le fichier'}</label>
        ${CSP.imgUrl ? `<img src="${CSP.imgUrl}" alt="" class="spimg">` : ''}<p class="small muted" data-tip="1" style="margin:8px 2px 0">Ensuite : « Demander à Claude » copie la demande ; dans Claude, colle-la ET joins la même image.</p></div>
      <div class="card" style="margin-top:12px"><span class="eyebrow">2 ·`);
    return sw + h; }; v.render._w = 1;
  paneRender();
};
document.addEventListener('click', e => { let b;
  if ((b = e.target.closest?.('[data-spimg]'))) { CSP.img = true; spPane(); return; }
  if ((b = e.target.closest?.('[data-spmode]'))) { CSP.img = b.dataset.spmode === '1'; paneRender(); return; } });
document.addEventListener('change', e => { const t = e.target; if (!t.matches?.('[data-spfile]') || !t.files?.[0]) return; const f = t.files[0];
  if (CSP.imgUrl) URL.revokeObjectURL(CSP.imgUrl); CSP.imgName = f.name; CSP.imgUrl = /^image\//.test(f.type) ? URL.createObjectURL(f) : ''; CSP.over = true; paneRender(); });

// 5) Les notes du coach : Oscar ajoute à la main un point fort ou faible que son coach lui a donné. Il compte comme un
//    point sûr (dans les cadres, en premier), nourrit la consigne des séances et la prépa, et se retire d'un geste.
const coachPts = kind => (S.app?.coachPts || []).filter(x => x.kind === kind);
const anaAgg196 = anaAgg;
anaAgg = function (kind) { const r = anaAgg196(kind);
  r.P = [...r.P, ...coachPts(kind).map(x => ({key: 'cp:' + x.id, n: x.t, k: 'coach', axe: x.axe || null, lvl: x.lvl, sc: x.lvl === 'good' ? 2 : 0, cnt: 2, sure: true, trend: 0, txt: `Note de ton coach · ${fmtShort(x.d)}`, seq: [], d: x.d, prio: 1, cue: '', coach: 1, ex: 'coach'}))]; return r; };
const anaProfileHtml196 = anaProfileHtml;
anaProfileHtml = function (kind) {
  const h = anaProfileHtml196(kind).replace(/(Note de ton coach · [^<]*?) · vu \d+ fois/g, '$1'), L = coachPts(kind);
  return h + `<div class="card cpbox"><span class="eyebrow">Les notes de mon coach</span>
    <div class="seg segsm" role="group" style="margin-top:8px"><button type="button" data-cplvl="good" aria-pressed="${CPL !== 'bad'}">Point fort</button><button type="button" data-cplvl="bad" aria-pressed="${CPL === 'bad'}">Point faible</button></div>
    <div class="cprow"><input class="mini-in" data-cptxt placeholder="${kind === 'run' ? 'Ex. « bon placement du bassin à vitesse max »' : 'Ce que ton coach a remarqué'}"><button type="button" class="btn" data-cpadd="${kind}">Ajouter</button></div>
    ${L.map(x => `<div class="cpli"><span class="cpt ${x.lvl}">${x.lvl === 'good' ? 'Fort' : 'Faible'}</span><span class="cpx">${esc(x.t)}<small>${esc(fmtShort(x.d))}</small></span><button type="button" class="cap-x" data-cpdel="${esc(x.id)}" aria-label="Retirer">×</button></div>`).join('')}
    <p class="small muted" data-tip="1" style="margin:8px 2px 0">Ses notes comptent comme des points sûrs : elles passent en tête de tes points forts ou faibles et guident la consigne de tes séances.</p></div>`;
};
let CPL = 'good';
function cpSave(L) { S.app = {...(S.app || {}), coachPts: L}; dbSet('settings/app', {...S.app, updatedAt: new Date().toISOString()}).catch(() => {}); const y = $('#pane-scroll')?.scrollTop; paneRender(); if (y != null) $('#pane-scroll').scrollTop = y; }
document.addEventListener('click', e => { let b;
  if ((b = e.target.closest?.('[data-cplvl]'))) { CPL = b.dataset.cplvl; b.parentElement.querySelectorAll('[data-cplvl]').forEach(x => x.setAttribute('aria-pressed', x === b)); return; }
  if ((b = e.target.closest?.('[data-cpadd]'))) { const inp = b.parentElement.querySelector('[data-cptxt]'), t = (inp?.value || '').trim(); if (!t) { toast('Écris la note de ton coach'); return; }
    cpSave([...(S.app?.coachPts || []), {id: 'cp' + Date.now().toString(36), kind: b.dataset.cpadd, lvl: CPL, t: t.slice(0, 200), d: TODAY}]); toast('Note du coach ajoutée'); return; }
  if ((b = e.target.closest?.('[data-cpdel]'))) { if (!confirm('Retirer cette note du coach ?')) return; cpSave((S.app?.coachPts || []).filter(x => x.id !== b.dataset.cpdel)); } });
document.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.matches?.('[data-cptxt]')) e.target.parentElement.querySelector('[data-cpadd]')?.click(); });
