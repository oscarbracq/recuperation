/* ================= Accueil · Bilan de la semaine =================
   Comme un coach qui fait le point le vendredi soir : pas la liste des chiffres, mais l'état de forme, ce qui a marché,
   ce qui a coincé, et 3 choses précises pour la semaine suivante.
   · La semaine : du samedi au vendredi. Le bilan change le vendredi à 20 h ; avant, c'est celui du vendredi d'avant.
   · Chaque donnée est comparée aux 4 semaines d'avant (sa « normale »), pas à une valeur toute faite.
   · Tout est calculé ici, à partir des données de l'appli : rien n'est envoyé ailleurs. */
// Le vendredi du bilan affiché : le dernier vendredi dont 20 h est passé.
function wkFriday(now = new Date()) {
  const d = new Date(now); d.setHours(20, 0, 0, 0);
  const back = (d.getDay() + 2) % 7; d.setDate(d.getDate() - back);   // vendredi de cette semaine ou d'avant
  if (d > now) d.setDate(d.getDate() - 7);
  return key(d);
}
const wkDays = end => [...Array(7)].map((_, i) => addDays(end, i - 6));
const wkMean = a => { const v = a.filter(x => x != null && !Number.isNaN(x)); return v.length ? mean(v) : null; };
const wkSafe = f => { try { return f(); } catch (e) { return null; } };
// Les chiffres d'une semaine (end = son vendredi).
function wkStats(end) {
  const D = wkDays(end), R = {days: D};
  const recs = D.map(k => wkSafe(() => recovery(k)?.score));
  R.rec = wkMean(recs); R.recN = recs.filter(x => x != null).length; R.red = recs.filter(x => x != null && x < 34).length; R.green = recs.filter(x => x != null && x >= 67).length;
  const sl = D.map(k => wkSafe(() => VAL.sleepH(addDays(k, 1)))); R.sleep = wkMean(sl); R.short = sl.filter(x => x != null && x < 7).length; R.sleepN = sl.filter(x => x != null).length;
  const bed = D.map(k => wkSafe(() => hm2min(G(addDays(k, 1), 'bed')))).filter(x => x != null);
  R.bed = bed.length ? mean(bed) : null; R.bedSd = bed.length >= 3 ? Math.sqrt(mean(bed.map(x => (x - R.bed) ** 2))) : null; R.late = bed.filter(x => x > 23 * 60 + 45).length;
  R.hrv = wkMean(D.map(k => wkSafe(() => G(k, 'hrv')))); R.rhr = wkMean(D.map(k => wkSafe(() => G(k, 'rhr'))));
  const eff = D.map(k => wkSafe(() => effortDay(k)) || 0); R.load = eff.reduce((a, x) => a + x, 0); R.hard = eff.filter(x => x >= 14).length;
  R.b2b = eff.slice(1).filter((x, i) => x >= 14 && eff[i] >= 14).length; R.rest = eff.filter(x => x < 6).length;
  R.gym = D.filter(k => wkSafe(() => logsOn(k).some(l => l.kind === 'gym') || !!M(k, 'gymRpe'))).length;
  R.track = D.filter(k => wkSafe(() => logsOn(k).some(l => l.kind === 'track') || !!M(k, 'trackRpe'))).length;
  const food = D.map(k => wkSafe(() => { const t = dayTotals(k); if (!t.kcal) return null; const g = fuelGoal(k); return {k: t.kcal / g.kcal, p: t.p, gp: g.p}; })).filter(Boolean);
  R.foodN = food.length; R.kcal = food.length ? mean(food.map(x => x.k)) : null; R.prot = food.length ? mean(food.map(x => x.p)) : null; R.protG = food.length ? mean(food.map(x => x.gp)) : null;
  R.water = D.filter(k => wkSafe(() => S.manual[k] && waterOf(k).L >= 2)).length; R.waterN = D.filter(k => S.manual?.[k]).length;
  const pn = D.map(k => wkSafe(() => maxPain(k)) || 0); R.pain = pn.filter(x => x > 0).length; R.painMax = Math.max(0, ...pn);
  R.zones = [...new Set(D.flatMap(k => wkSafe(() => Object.entries(pains(k)).filter(([, v]) => +v > 0).map(([l]) => l)) || []))];
  R.recov = D.reduce((a, k) => a + (S.manual?.[k]?.recov || []).reduce((b, x) => b + (+x.min || 0), 0), 0);
  R.weight = wkMean(D.map(k => wkSafe(() => W(k, 'weight'))));
  return R;
}
// La « normale » : la moyenne des 4 semaines d'avant, champ par champ.
function wkNorm(end) {
  const W4 = [1, 2, 3, 4].map(i => wkStats(addDays(end, -7 * i))), o = {};
  for (const f of ['rec', 'sleep', 'bed', 'hrv', 'rhr', 'load', 'hard', 'gym', 'track', 'kcal', 'prot', 'recov', 'weight', 'short', 'pain']) o[f] = wkMean(W4.map(w => w[f]));
  o.prevWeight = W4[0].weight; o.prevRec = W4[0].rec; o.prevLoad = W4[0].load; return o;
}
const wkH = v => { const h = Math.floor(v), m = Math.round((v - h) * 60); return m === 60 ? `${h + 1} h` : `${h} h${m ? ' ' + String(m).padStart(2, '0') : ''}`; };
const wkT = v => { v = Math.round(v) % 1440; return `${Math.floor(v / 60)} h ${String(v % 60).padStart(2, '0')}`; };
// Le bilan : un titre, un paragraphe d'état de forme, et 3 objectifs pour la semaine qui vient.
function wkCoach(end = wkFriday()) {
  const A = wkStats(end), N = wkNorm(end), good = [], bad = [], todo = [];
  const pct = (a, b) => a != null && b ? (a / b - 1) * 100 : null;
  const dRec = A.rec != null && N.rec != null ? A.rec - N.rec : null, dLoad = pct(A.load, N.load), dHrv = pct(A.hrv, N.hrv), dRhr = A.rhr != null && N.rhr != null ? A.rhr - N.rhr : null;
  // 1. Le corps : récupération, VFC, pouls au repos.
  if (dRec != null && dRec <= -6) bad.push([3 + Math.min(3, -dRec / 6), `ta récupération a baissé (${Math.round(A.rec)} % en moyenne, ${Math.round(-dRec)} points sous ta normale)${A.red ? `, avec ${A.red} matin${A.red > 1 ? 's' : ''} dans le rouge` : ''}`]);
  else if (dRec != null && dRec >= 5) good.push([3, `ta récupération est au-dessus de ta normale (${Math.round(A.rec)} %, +${Math.round(dRec)} points)`]);
  else if (A.rec != null) good.push([1, `ta récupération reste stable autour de ${Math.round(A.rec)} %`]);
  if (dHrv != null && dHrv <= -7 && dRhr != null && dRhr >= 2) bad.push([4, `ta VFC a baissé de ${Math.round(-dHrv)} % et ton pouls au repos a pris ${Math.round(dRhr)} battements : ton système nerveux encaisse`]);
  else if (dHrv != null && dHrv >= 6) good.push([2, `ta VFC monte (+${Math.round(dHrv)} % sur ta normale), signe que le corps assimile bien`]);
  // 2. La charge d'entraînement, comparée aux 4 semaines d'avant.
  const ratio = A.load && N.load ? A.load / N.load : null;
  if (ratio != null && ratio >= 1.3) bad.push([3 + (dRec != null && dRec < -3 ? 2 : 0), `la charge a fait un bond de ${Math.round((ratio - 1) * 100)} % par rapport à tes semaines habituelles`]);
  else if (ratio != null && ratio <= .7 && A.load > 0) good.push([1, `la semaine a été plus légère (${Math.round((1 - ratio) * 100)} % de charge en moins), utile pour assimiler`]);
  else if (ratio != null && A.load > 0) good.push([1.5, `la charge est restée dans ta zone habituelle`]);
  if (A.b2b >= 2) bad.push([3, `${A.b2b + 1} grosses journées se sont enchaînées sans jour calme entre elles`]);
  if (A.track + A.gym === 0 && N.gym + N.track >= 2) bad.push([2, `aucune séance enregistrée cette semaine`]);
  else if (A.track + A.gym > 0) good.push([1, `${A.gym ? A.gym + ' séance' + (A.gym > 1 ? 's' : '') + ' de muscu' : ''}${A.gym && A.track ? ' et ' : ''}${A.track ? A.track + ' de sprint' : ''} faite${A.gym + A.track > 1 ? 's' : ''}`]);
  // 3. Le sommeil : la durée et la régularité du coucher.
  if (A.sleep != null && A.sleep < 7.7) bad.push([3.5 + (8 - A.sleep), `tes nuits sont trop courtes pour un sprinteur (${wkH(A.sleep)} en moyenne${A.short ? `, ${A.short} sous 7 h` : ''})`]);
  else if (A.sleep != null && A.sleep >= 8.3) good.push([2.5, `tes nuits ont été longues (${wkH(A.sleep)} en moyenne)`]);
  if (A.bedSd != null && A.bedSd > 50) bad.push([2.5, `ton heure de coucher a beaucoup bougé (± ${Math.round(A.bedSd)} min d'un soir à l'autre)`]);
  else if (A.late >= 3) bad.push([2.5, `${A.late} couchers après 23 h 45`]);
  // 4. Nutrition, eau, douleurs, récup.
  if (A.foodN >= 3 && A.prot != null && A.protG && A.prot < A.protG * .85) bad.push([2.5, `les protéines sont restées en dessous de ton besoin (${Math.round(A.prot)} g par jour pour ${Math.round(A.protG)} g visés)`]);
  if (A.foodN >= 3 && A.kcal != null && A.kcal < .85) bad.push([2.5, `tu as mangé environ ${Math.round((1 - A.kcal) * 100)} % de moins que ce que ta dépense demandait`]);
  else if (A.foodN >= 4 && A.kcal != null && Math.abs(A.kcal - 1) <= .08) good.push([1.5, `les apports ont collé à ta dépense`]);
  if (A.foodN && A.foodN < 3) bad.push([1, `l'alimentation n'a été notée que ${A.foodN} jour${A.foodN > 1 ? 's' : ''}`]);
  if (A.waterN >= 3 && A.water <= 2) bad.push([1.5, `l'eau n'a atteint 2 L que ${A.water} jour${A.water > 1 ? 's' : ''}`]);
  // Une blessure en cours (profil) : une douleur au même endroit passe en premier.
  const inj = String(S.profile?.injury || ''), back = /L3|L4|L5|lomb|dos/i.test(inj), backZ = A.zones.filter(z => /dos|lomb/i.test(z));
  if (back && backZ.length && A.pain >= 2) bad.push([5 + A.painMax / 3, `le bas du dos s'est réveillé ${A.pain} jours (jusqu'à ${A.painMax}/10), le signal n°1 avec ta reprise après L3`]);
  else if (A.pain >= 3 || A.painMax >= 6) bad.push([3 + A.painMax / 3, `une douleur revient (${A.zones.slice(0, 2).map(z => painTxt(z)).join(', ')}, jusqu'à ${A.painMax}/10)`]);
  if (A.recov >= 60) good.push([1.5, `${A.recov} min de récup active`]);
  // Le titre : l'état de forme en quelques mots.
  // Le titre suit les mêmes constats que le paragraphe (jamais « fatigue » si rien ne coince).
  const bw = bad.reduce((a, x) => a + x[0], 0), bigBad = bad.filter(x => x[0] >= 3).length;
  const title = A.recN < 3 && A.sleepN < 3 ? 'Pas assez de données cette semaine' : (dRec != null && dRec <= -10) || bw >= 12 ? 'Semaine dure pour ton corps'
    : bigBad >= 2 && (dRec ?? 0) < 0 ? 'La fatigue s\'installe' : bw >= 3 ? 'Semaine correcte, quelques réglages' : 'Semaine solide, tu es en forme';
  bad.sort((a, b) => b[0] - a[0]); good.sort((a, b) => b[0] - a[0]);
  const capi = t => t.charAt(0).toUpperCase() + t.slice(1);
  // Le paragraphe : ce qui a marché, ce qui a coincé, et le lien entre les deux quand il existe.
  let para = '';
  if (good.length) para += capi(good.slice(0, 2).map(x => x[1]).join(' et ')) + '. ';
  if (bad.length) para += (good.length ? 'Mais ' : '') + bad.slice(0, 2).map(x => x[1]).join(', et ') + '. ';
  const sleepBad = bad.some(x => /nuits|coucher/.test(x[1])), recBad = dRec != null && dRec <= -6;
  if (recBad && sleepBad) para += 'Les deux sont liés : c\'est d\'abord le sommeil qui freine ta récupération, avant la charge.';
  else if (recBad && ratio && ratio >= 1.3) para += 'La baisse vient surtout de la charge : le corps a besoin de quelques jours pour l\'absorber.';
  else if (!bad.length) para += 'Rien ne coince : garde ce rythme, c\'est ce qui fait progresser.';
  else if (bad.length === 1 && !recBad) para += 'Le corps tient : règle ça avant que ça pèse.';
  // Les 3 objectifs : les plus utiles d'abord, chacun chiffré.
  const add = (w, t) => todo.push([w, t]);
  if (A.sleep != null && A.sleep < 8) add(4 + (8 - A.sleep), `Vise ${wkH(Math.min(9, Math.max(8, A.sleep + .5)))} de sommeil : coucher avant ${wkT(Math.min(A.bed || 1410, 1395))} au moins 5 soirs.`);
  if (A.bedSd != null && A.bedSd > 50) add(3, `Couche-toi à la même heure à 30 min près, week-end compris.`);
  if (ratio != null && ratio >= 1.3) add(4, `Redescends la charge d'environ ${Math.round((1 - 1.1 / ratio) * 100)} % : ${A.hard > 2 ? 'garde 2 journées dures, pas plus' : 'une séance plus légère'}.`);
  if (A.b2b >= 2) add(3.5, `Mets au moins un jour calme entre deux grosses journées, surtout après le sprint.`);
  if (recBad && !(ratio >= 1.3)) add(3, `Cale tes séances intenses les matins où la récup est verte, et décale-les si elle est rouge.`);
  if (A.foodN >= 3 && A.prot != null && A.protG && A.prot < A.protG * .85) add(3, `Monte à ${Math.round(A.protG)} g de protéines par jour : ajoute une source à chaque repas.`);
  if (A.foodN >= 3 && A.kcal != null && A.kcal < .85) add(3, `Mange un peu plus les jours d'entraînement (+${Math.round((1 - A.kcal) * 2000 / 10) * 10} kcal environ).`);
  if (A.waterN >= 3 && A.water <= 3) add(2, `Atteins 2 L d'eau au moins 5 jours sur 7.`);
  if (back && backZ.length && A.pain >= 2) add(5, `Bas du dos à 0 : pas d'extension lombaire chargée ni de rotation rapide tant qu'il se réveille.`);
  else if (A.pain >= 3 || A.painMax >= 6) add(3.5, `Allège ce qui réveille la douleur et fais l'exercice de récupération « Douleur » chaque jour.`);
  // La prochaine étape du plan de reprise (profil), si elle tombe dans les 10 jours qui suivent le bilan.
  const ms = (S.profile?.milestones || []).filter(m => !m.done && m.date > end && m.date <= addDays(end, 10)).sort((a, b) => a.date < b.date ? -1 : 1)[0];
  if (ms) add(3.2, `${cap(fmtShort(ms.date)).replace(/\.$/, '')} : ${ms.label.charAt(0).toLowerCase() + ms.label.slice(1)}. Arrive-y dos à 0, récup verte.`);
  if (A.recov < 30) add(1.5, `2 récups de 15 min (rouleau, respiration) après tes grosses journées.`);
  if (A.foodN < 3) add(1, `Note ce que tu manges au moins 4 jours : sans ça, le bilan nutrition reste aveugle.`);
  if (!todo.length) add(1, `Garde la même structure de semaine, et ajoute une petite progression sur ta séance clé.`);
  todo.sort((a, b) => b[0] - a[0]);
  const prev = wkCoach0(addDays(end, -7), A);
  return {end, from: addDays(end, -6), title, para: para.trim(), todo: todo.slice(0, 3).map(x => x[1]), A, N, prev};
}
// Ce qui a changé depuis le bilan d'avant (une petite phrase en plus quand c'est parlant).
function wkCoach0(end, A) {
  const B = wkStats(end); if (A.rec == null || B.rec == null) return '';
  const d = A.rec - B.rec; return Math.abs(d) >= 5 ? `${d > 0 ? '+' : '−'}${Math.round(Math.abs(d))} pts de récup sur la semaine d'avant` : '';
}
let WK = null;
function wkCard() {
  // Recalculé à chaque affichage (une quinzaine de ms) : au démarrage les données arrivent par morceaux, un bilan gardé de côté serait faux.
  const C = wkSafe(() => (WK = wkCoach()));
  if (!C) return '';
  const range = `${fmtShort(C.from).replace(/\.$/, '')} – ${fmtShort(C.end)}`;
  return `<section class="wk" aria-label="Bilan de la semaine"><div class="wk-h"><span class="eyebrow">Bilan de la semaine</span><small>${esc(range)}</small></div>
    <h2 class="wk-t">${esc(C.title)}</h2><p class="wk-p">${esc(C.para)}</p>
    <div class="wk-n"><span class="eyebrow">Pour la semaine qui vient</span><ol>${C.todo.map(t => `<li>${esc(t)}</li>`).join('')}</ol></div></section>`;
}
// L'accueil : la date, la phrase du jour, puis le bilan juste en dessous.
vHome = () => `<div class="hm one-hm" id="hm"><header class="hm-head" id="hm-head"><div class="sub">${fmtDay(TODAY)}</div><h1 class="hello">${esc(homeGreeting())}</h1></header>${wkCard()}</div>`;
// À l'arrivée sur l'accueil : le bilan monte doucement, ligne par ligne.
let WKIN = 0;
new MutationObserver(() => { const w = document.querySelector('#hm .wk:not([data-in])'); if (!w) return; w.dataset.in = '1'; // seulement juste après être arrivé sur l'accueil (pas à chaque mise à jour des données)
  if (performance.now() - (ONE.act || 0) > 1600 || performance.now() - WKIN < 1600 || matchMedia('(prefers-reduced-motion: reduce)').matches) return; WKIN = performance.now();
  [...w.querySelectorAll('.wk-h, .wk-t, .wk-p, .wk-n .eyebrow, li')].forEach((el, i) => el.animate([{opacity: 0, transform: 'translateY(10px)'}, {opacity: 1, transform: 'none'}], {duration: 520, delay: 80 + i * 70, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'backwards'})); }).observe(document.body, {childList: true, subtree: true});
// Le vendredi à 20 h, le bilan change tout seul si l'appli est ouverte.
setInterval(() => { if (WK && WK.end !== wkFriday()) { WK = null; if (S.mod === 'home') render(); } }, 60000);
