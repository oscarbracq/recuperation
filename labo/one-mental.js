/* ================= Bilan mental du mois : la santé mentale de l'athlète, une fois par mois =================
   Construit sur des questionnaires validés, reformulés en français simple :
   - Tension mentale de l'athlète : APSQ (Rice et al. 2020), l'étape 1 de l'outil du CIO (SMHAT-1, Gouttebarge et al. 2021).
     10 questions sur le mois passé, total 10 à 50 ; 17 ou plus = le CIO conseille d'aller plus loin avec un professionnel.
   - Humeur et anxiété : PHQ-2 (Kroenke 2003) et GAD-2 (Kroenke 2007), sur 2 semaines ; 3 ou plus = à voir avec un médecin.
   - Épuisement de l'athlète : ABQ (Raedeke et Smith 2001, version française Isoard-Gautheur 2010), 15 questions, 3 parties.
     Moyenne de 3 ou plus (« souvent ») sur une partie = signal fort.
   - Mental de compétition et équilibre de vie : questions de son cours de préparation mentale (confiance, routine, imagerie,
     retour après une erreur ; plaisir, soutien, temps pour soi). Indicatif, pas un test validé.
   La note sur 100 rassemble les 5 parties (100 = tout va bien). Ce n'est pas un diagnostic.
   Rangé dans settings/app.mental["AAAA-MM"] = {at, a: réponses, sc: notes par partie, note}. */
const MN_F = ['Jamais', 'Rarement', 'Parfois', 'Souvent', 'Tout le temps'];
const MN_F4 = ['Jamais', 'Plusieurs jours', 'Plus d\'un jour sur deux', 'Presque tous les jours'];
const MN_A = ['Pas du tout', 'Un peu', 'Moyennement', 'Plutôt', 'Tout à fait'];
// [id, titre, consigne, choix, questions [id, texte, inversée ?]]
const MN_SEC = [
  ['tens', 'Tension mentale', 'Le mois passé, à quelle fréquence…', MN_F, [
    ['t1', 'J\'ai eu du mal à être avec mon groupe d\'entraînement'], ['t2', 'J\'ai eu du mal à faire ce que j\'avais à faire'],
    ['t3', 'J\'ai été moins motivé'], ['t4', 'J\'ai été irritable, en colère ou agressif'],
    ['t5', 'Je n\'arrivais pas à arrêter de m\'inquiéter pour une blessure ou mes performances'], ['t6', 'L\'entraînement m\'a paru plus stressant'],
    ['t7', 'J\'ai eu du mal à gérer la pression des sélections et des chronos à faire'], ['t8', 'Je me suis inquiété pour ma vie après le sport'],
    ['t9', 'J\'ai eu besoin d\'alcool ou d\'autre chose pour me détendre'], ['t10', 'J\'ai pris des risques inhabituels en dehors du sport']]],
  ['mood', 'Humeur', 'Les 2 dernières semaines, à quelle fréquence…', MN_F4, [
    ['m1', 'Peu d\'intérêt ou de plaisir à faire les choses'], ['m2', 'Triste, déprimé ou sans espoir'],
    ['m3', 'Nerveux, anxieux ou à bout'], ['m4', 'Incapable d\'arrêter de m\'inquiéter ou de contrôler mes inquiétudes']]],
  ['burn', 'Épuisement', 'Le mois passé, à quelle fréquence…', MN_F, [
    ['b1', 'Je me suis senti très fatigué par l\'athlé', 'pee'], ['b2', 'Je me suis senti vidé par l\'entraînement et la compétition', 'pee'],
    ['b3', 'Je me suis senti à plat', 'pee'], ['b4', 'J\'ai été épuisé par ce que l\'athlé me demande, au corps et à la tête', 'pee'],
    ['b5', 'J\'étais si fatigué par l\'entraînement qu\'il me restait peu d\'énergie pour le reste', 'pee'],
    ['b6', 'J\'ai réussi des choses qui comptent en athlé', 'ra', 1], ['b7', 'Je me suis senti efficace dans mon sport', 'ra', 1],
    ['b8', 'J\'ai eu l\'impression de ne pas progresser', 'ra'], ['b9', 'Je n\'ai pas couru à la hauteur de mes capacités', 'ra'],
    ['b10', 'Quoi que je fasse, je ne performe pas comme je le devrais', 'ra'],
    ['b11', 'Je me suis demandé si l\'athlé vaut tout le temps que j\'y mets', 'sd'], ['b12', 'J\'ai eu moins envie qu\'avant de m\'entraîner', 'sd'],
    ['b13', 'Mes performances m\'ont moins importé qu\'avant', 'sd'], ['b14', 'J\'ai eu des sentiments négatifs envers l\'athlé', 'sd'],
    ['b15', 'L\'énergie que je mets dans l\'athlé serait mieux ailleurs', 'sd']]],
  ['comp', 'Mental de compétition', 'Aujourd\'hui, c\'est vrai pour toi ?', MN_A, [
    ['c1', 'J\'ai confiance en ma capacité à atteindre mon objectif de la saison'], ['c2', 'Après un mauvais essai, je sais me remettre dedans'],
    ['c3', 'Avant une course, je sais me mettre dans l\'état qui me fait courir vite'], ['c4', 'Je visualise mes courses (imagerie) au moins une fois par semaine'],
    ['c5', 'J\'ai une routine d\'avant-course qui m\'aide']]],
  ['life', 'Équilibre de vie', 'Le mois passé, c\'était vrai pour toi ?', MN_A, [
    ['l1', 'J\'ai eu du plaisir à m\'entraîner'], ['l2', 'Je me suis senti soutenu (famille, amis, coach)'],
    ['l3', 'J\'ai eu du temps pour moi en dehors du sport'], ['l4', 'Les études ou le travail m\'ont mis la pression', 1]]]
];
const MN_W = {tens: 25, burn: 25, mood: 20, comp: 15, life: 15};
const MN_TXT = {tens: 'Tension mentale', mood: 'Humeur', burn: 'Énergie', comp: 'Mental de compétition', life: 'Équilibre de vie'};
const mnMonth = (k = TODAY) => k.slice(0, 7);
const mnAll = () => S.app?.mental || {};
const mnDone = () => !!mnAll()[mnMonth()]?.at;
let MN = {i: 0, a: {}, res: null};

// Les notes : chaque partie sur 100 (100 = tout va bien), puis la note globale pondérée.
function mnScore(a) {
  const v = (id, inv, max) => { const x = a[id]; return x == null ? null : inv ? max - x : x; };
  const sc = {}, raw = {};
  const ts = MN_SEC[0][4].map(q => v(q[0], 0, 4)); raw.apsq = ts.reduce((s, x) => s + (x ?? 0) + 1, 0); sc.tens = Math.round((50 - raw.apsq) / 40 * 100);
  raw.phq = (a.m1 ?? 0) + (a.m2 ?? 0); raw.gad = (a.m3 ?? 0) + (a.m4 ?? 0); sc.mood = Math.round((12 - raw.phq - raw.gad) / 12 * 100);
  const sub = k => { const L = MN_SEC[2][4].filter(q => q[2] === k).map(q => (v(q[0], q[3], 4) ?? 0) + 1); return L.reduce((s, x) => s + x, 0) / L.length; };
  raw.pee = sub('pee'); raw.ra = sub('ra'); raw.sd = sub('sd'); sc.burn = Math.round((5 - (raw.pee + raw.ra + raw.sd) / 3) / 4 * 100);
  const mean = i => { const L = MN_SEC[i][4].map(q => v(q[0], q[2] === 1, 4) ?? 0); return L.reduce((s, x) => s + x, 0) / L.length; };
  sc.comp = Math.round(mean(3) / 4 * 100); sc.life = Math.round(mean(4) / 4 * 100);
  const note = Math.round(Object.keys(MN_W).reduce((s, k) => s + sc[k] * MN_W[k], 0) / 100);
  return {sc, raw, note};
}
const mnLvl = n => n >= 80 ? ['Solide', 'good'] : n >= 65 ? ['Bien, à surveiller', 'ok'] : n >= 50 ? ['Fragile', 'mid'] : ['À prendre au sérieux', 'bad'];
// Ce qui ressort : les signaux d'alerte d'abord (seuils des questionnaires), puis le point fort et la partie à travailler.
function mnConc(r, prev) {
  const {sc, raw, note} = r, al = [];
  if (raw.phq >= 3 || raw.gad >= 3) al.push(`${raw.phq >= 3 ? 'Humeur basse' : 'Anxiété'} au-dessus du seuil (${raw.phq >= 3 ? 'PHQ-2 ' + raw.phq : 'GAD-2 ' + raw.gad} sur 6, seuil 3) : prends rendez-vous avec ton médecin pour en parler. Ce n'est pas une faiblesse, c'est un réglage comme un autre.`);
  if (raw.apsq >= 17) al.push(`Tension mentale à ${raw.apsq} sur 50 : au-dessus du seuil du CIO (17). Le CIO conseille d'en parler à un professionnel (médecin, psychologue du sport).`);
  if (raw.pee >= 3) al.push(`Épuisement physique et émotionnel à ${fx(raw.pee, 1)} sur 5 (« souvent ») : vois avec ton coach pour alléger une semaine.`);
  if (raw.sd >= 3) al.push(`L'envie baisse (${fx(raw.sd, 1)} sur 5) : c'est le signe d'épuisement à surveiller en premier (Raedeke 2001). Parles-en avec ton coach.`);
  const K = Object.keys(MN_W).sort((x, y) => sc[y] - sc[x]), best = K[0], low = K.at(-1);
  const ACT = {
    tens: ['Écris le soir, en 2 minutes, ce qui t\'inquiète et ce qui dépend de toi.', 'Parle d\'une inquiétude à ton coach cette semaine.'],
    mood: ['Garde une activité qui te fait plaisir hors du sport chaque semaine.', 'Si ça dure plus de 2 semaines : médecin.'],
    burn: ['Une semaine allégée (volume −40 %) avec ton coach.', 'Protège tes nuits : couché avant minuit les veilles de jour haut.'],
    comp: ['5 min d\'imagerie de ton départ, 3 fois par semaine.', 'Écris ta routine d\'avant-course et répète-la à chaque séance de piste.'],
    life: ['Bloque un moment à toi dans ta semaine, comme une séance.', 'Note un plaisir de la séance dans ton questionnaire du soir.']
  };
  const d = prev ? note - prev.note : null;
  return {al, best, low, act: ACT[low], d,
    head: `${mnLvl(note)[0]}${d != null ? ` · ${d >= 0 ? '+' : '−'}${Math.abs(d)} depuis le mois dernier` : ''}`,
    txt: `Ton point fort ce mois-ci : ${MN_TXT[best].toLowerCase()} (${sc[best]}/100). Ce qui te coûte le plus : ${MN_TXT[low].toLowerCase()} (${sc[low]}/100).`};
}

function mnOpen() { MN = {i: 0, a: {}, res: mnDone() ? mnAll()[mnMonth()] : null}; openPane({title: 'Bilan mental du mois', render: mnRender, onClose: () => { MN.res = null; }}); }
function mnRender() {
  if (MN.res) return mnResult(MN.res);
  if (!MN.on) {
    const L = Object.keys(mnAll()).sort().reverse();
    return `<div class="mn-in"><p class="mn-big">5 minutes pour faire le point sur ta tête.</p>
      <p class="small muted" data-tip="1">38 questions en 5 parties : tension mentale, humeur, énergie, mental de compétition, équilibre de vie. À la fin : une note sur 100 et ta conclusion. Réponds vite, la première réponse est souvent la bonne.</p>
      <button type="button" class="btn" data-mnstart style="width:100%;margin-top:14px">Commencer</button>
      ${L.length ? `<div class="sec-label" style="margin-top:22px">Tes bilans</div><div class="list">${L.map(m => { const r = mnAll()[m], [t, c] = mnLvl(r.note);
        return `<button type="button" class="row" data-mnsee="${m}"><span style="flex:1"><b>${cap(new Date(m + '-15').toLocaleDateString('fr-FR', {month: 'long', year: 'numeric'}))}</b><span class="hint">${t}</span></span><b class="num mn-n ${c}">${r.note}</b></button>`; }).join('')}</div>` : ''}</div>`;
  }
  const [id, t, how, ch, Q] = MN_SEC[MN.i], n = Q.filter(q => MN.a[q[0]] != null).length, all = n === Q.length;
  return `<div class="mn-in"><div class="mn-prog" aria-hidden="true">${MN_SEC.map((s, i) => `<i class="${i < MN.i ? 'ok' : i === MN.i ? 'on' : ''}"></i>`).join('')}</div>
    <p class="mn-sec">${MN.i + 1} / ${MN_SEC.length} · ${t}</p><p class="small muted" data-tip="1">${how}</p>
    ${Q.map(([q, txt]) => `<div class="mn-q${MN.a[q] != null ? ' done' : ''}" data-mnq="${q}"><p>${esc(txt)}</p><div class="mn-ch">${ch.map((c, v) => `<button type="button" data-mna="${q}.${v}" aria-pressed="${MN.a[q] === v}" class="${MN.a[q] === v ? 'on' : ''}">${c}</button>`).join('')}</div></div>`).join('')}
    <div class="mn-nav">${MN.i ? '<button type="button" class="btn ghost" data-mngo="-1">Retour</button>' : ''}<button type="button" class="btn" data-mngo="1"${all ? '' : ' disabled'}>${MN.i === MN_SEC.length - 1 ? 'Voir ma conclusion' : `Suivant (${n}/${Q.length})`}</button></div></div>`;
}
function mnResult(r) {
  const months = Object.keys(mnAll()).sort(), m = r.m || mnMonth(), prev = mnAll()[months[months.indexOf(m) - 1]], c = mnConc(r, prev), [lv, cl] = mnLvl(r.note);
  const hist = months.slice(-12);
  return `<div class="mn-in"><div class="mn-res ${cl}"><b class="num">${r.note}</b><span>/ 100</span></div><p class="mn-lv">${c.head}</p>
    ${c.al.length ? `<div class="mn-al">${c.al.map(x => `<p>${esc(x)}</p>`).join('')}</div>` : ''}
    <p class="mn-txt">${esc(c.txt)}</p>
    <div class="sec-label">Tes 5 parties</div><div class="mn-bars">${Object.keys(MN_W).map(k => `<div class="mn-bar"><span>${MN_TXT[k]}</span><i><em class="${mnLvl(r.sc[k])[1]}" style="width:${Math.max(3, r.sc[k])}%"></em></i><b class="num">${r.sc[k]}</b></div>`).join('')}</div>
    <div class="sec-label">Ce mois-ci</div><div class="list">${c.act.map(x => `<div class="row"><span>${esc(x)}</span></div>`).join('')}</div>
    ${hist.length > 1 ? `<div class="sec-label">Ta note mois après mois</div><div class="mn-hist">${hist.map(k => `<div><i style="height:${mnAll()[k].note}%" class="${mnLvl(mnAll()[k].note)[1]}"></i><span>${new Date(k + '-15').toLocaleDateString('fr-FR', {month: 'short'}).replace('.', '')}</span></div>`).join('')}</div>` : ''}
    <p class="small muted mn-src" data-tip="1">Tension : APSQ du CIO (Rice 2020) · ${r.raw.apsq}/50. Humeur : PHQ-2 ${r.raw.phq}/6 et GAD-2 ${r.raw.gad}/6. Épuisement : ABQ (Raedeke 2001) · fatigue ${fx(r.raw.pee, 1)}, accomplissement ${fx(r.raw.ra, 1)}, envie ${fx(r.raw.sd, 1)} sur 5. Ce bilan n'est pas un diagnostic.</p>
    <p class="small muted mn-src" data-tip="1">Idées noires, besoin de parler tout de suite : <b>3114</b>, gratuit, jour et nuit.</p>
    ${m === mnMonth() ? '<button type="button" class="btn ghost" data-mnredo style="width:100%;margin-top:14px">Refaire le bilan de ce mois</button>' : ''}</div>`;
}
document.addEventListener('click', async e => {
  const b = e.target.closest?.('[data-mna],[data-mngo],[data-mnsee],[data-mnredo],[data-mnstart],[data-one-mental]'); if (!b) return;
  if (b.dataset.oneMental != null) { try { oneHap(6); } catch (er) {} mnOpen(); return; }
  if (b.dataset.mnsee) { MN.on = 0; MN.res = {...mnAll()[b.dataset.mnsee], m: b.dataset.mnsee}; paneRender(); return; }
  if (b.dataset.mnredo != null) { MN = {i: 0, a: {}, res: null, on: 1}; paneRender(); $('#pane-scroll')?.scrollTo(0, 0); return; }
  if (b.dataset.mna) { const [q, v] = b.dataset.mna.split('.'); MN.a[q] = +v; try { oneHap(5); } catch (er) {}
    const top = $('#pane-scroll')?.scrollTop; paneRender(); if (top != null) $('#pane-scroll').scrollTop = top;
    // On glisse doucement vers la question suivante pas encore répondue.
    const nx = [...document.querySelectorAll('#pane .mn-q:not(.done)')][0]; if (nx) setTimeout(() => nx.scrollIntoView({behavior: 'smooth', block: 'center'}), 120); return; }
  if (b.dataset.mnstart != null) { MN.on = 1; MN.i = 0; paneRender(); $('#pane-scroll')?.scrollTo(0, 0); return; }
  if (b.dataset.mngo) { const d = +b.dataset.mngo;
    if (d > 0 && MN.i === MN_SEC.length - 1) { const r = {...mnScore(MN.a), a: {...MN.a}, at: new Date().toISOString()};
      S.app = {...(S.app || {}), mental: {...mnAll(), [mnMonth()]: r}}; MN.res = {...r, m: mnMonth()}; MN.on = 0; paneRender(); $('#pane-scroll')?.scrollTo(0, 0); mnDot();
      try { await dbSet('settings/app', {...S.app, updatedAt: new Date().toISOString()}); toast('Bilan enregistré'); } catch (er) { toast('Pas enregistré : réessaie avec du réseau'); } return; }
    MN.i = Math.max(0, Math.min(MN_SEC.length - 1, MN.i + d)); paneRender(); $('#pane-scroll')?.scrollTo({top: 0, behavior: 'smooth'}); }
});
// Les deux carrés de l'accueil : à gauche le bilan mental (point rouge s'il reste à faire ce mois-ci), à droite Ton cap.
function mnDot() { const b = $('.one-hmen'); if (b) b.classList.toggle('due', !mnDone()); const c = $('.one-hcap span'); if (c && typeof capGet === 'function') { const l = daysBetween(TODAY, capGet().date); c.textContent = l > 0 ? 'J-' + l : l === 0 ? 'J' : 'Cap'; } }
document.body.insertAdjacentHTML('beforeend', `<button class="one-sq one-aib one-hmen" data-one-mental aria-label="Bilan mental du mois" title="Bilan mental du mois"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 21v-3.2A7 7 0 1 1 18.6 12l1.4 3h-2v2.5a1.5 1.5 0 0 1-1.5 1.5H14v2"/><path d="M10.5 9.5a2 2 0 1 1 2.5 1.9V12"/></svg><span>MENTAL</span></button>
  <button class="one-sq one-aib one-hcap" data-capview aria-label="Ton cap" title="Ton cap"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 21V4"/><path d="M5 4h11l-2 4 2 4H5"/></svg><span>CAP</span></button>`);
setTimeout(mnDot, 0); setInterval(mnDot, 60e3);
// La notification du mois (./?q=mental) ouvre directement le bilan.
function mnAuto() { const t = setInterval(() => { if (!S.app || window.TNR_SPLASH_ON || document.getElementById('splash')) return; clearInterval(t); mnDot(); mnOpen(); }, 250); }
navigator.serviceWorker?.addEventListener('message', e => { if (/[?&]q=mental/.test(e.data?.open || '')) mnAuto(); });
if (new URLSearchParams(location.search).get('q') === 'mental') { history.replaceState(history.state, '', location.pathname); mnAuto(); }
