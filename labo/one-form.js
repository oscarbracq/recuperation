/* ================= Forme du jour, au début de la séance =================
   Quand Oscar commence une séance de muscu, le préparateur lit ses données du moment (récupération, sommeil, ressenti du
   questionnaire, douleurs, maladie, fatigue des muscles de la séance, CMJ, antécédents) et propose des réglages classés
   du plus utile au moins utile. Rien n'est imposé : il active ce qu'il veut, ou garde la séance prévue, et peut revenir
   en arrière tant qu'aucune série n'est validée. Performer ET durer : en grande forme, il propose aussi de pousser. */
function formCheck() {
  const sig = [], add = (v, t) => sig.push({v, t});
  try {
    const kG = lastKey('hrv'), r = kG && (kG === TODAY || kG === addDays(TODAY, -1)) ? recovery(kG) : null;
    if (r?.score != null) { const z = zoneOf(r.score); add(z === 'bad' ? -2 : z === 'warn' ? -1 : 1, `Récupération ${Math.round(r.score)} %`); }
    const sl = +G(TODAY, 'sleepS') || 0; if (sl) { const h = sl / 3600; if (h < 7) add(-1, `Nuit courte : ${fx(h, 1)} h`); else if (h >= 8.5) add(1, `Nuit complète : ${fx(h, 1)} h`); }
  } catch (e) {}
  const m = S.manual?.[TODAY] || {}, w = m.well || {};
  const fe = ['fat', 'sor', 'mot'].map(k => +w[k]).filter(x => x > 0);
  if (fe.length) { const a = fe.reduce((x, y) => x + y, 0) / fe.length; if (a <= 2.5) add(-1, 'Ressenti du matin bas (fatigue, courbatures, envie)'); else if (a >= 4) add(1, 'Ressenti du matin bon'); }
  if (Array.isArray(m.sick) && m.sick.length) add(-1, 'Malade : ' + m.sick.join(', '));
  try { const P = painNow(); const top = P.sort((a, b) => b.v - a.v)[0]; if (top) add(top.v >= 3 ? -2 : -1, `Douleur : ${painTxt(top.l)} ${top.v}/10`); } catch (e) {}
  try {
    const L = S.live, mus = new Set(); for (const it of L?.items || []) for (const [k, c] of Object.entries(musCoef(it.ex))) if (c >= .75) mus.add(k);
    const st = musState().filter(x => mus.has(x.k));
    const hot = st.map(x => ({n: MUSI[x.k]?.n, p: (x.fatPct || 0) / 100})).filter(x => x.p >= .8).sort((a, b) => b.p - a.p)[0];
    if (hot) add(-1, `${hot.n} encore fatigué (${Math.round(hot.p * 100)} %)`);
  } catch (e) {}
  try { const ck = cmjCheck(); if (ck && ck.d <= -5) add(-1, `CMJ ${fx(ck.d, 1)} % sous ta moyenne`); else if (ck && ck.d >= 3) add(1, `CMJ +${fx(ck.d, 1)} %`); } catch (e) {}
  if (lightOn()) add(-1, 'Semaine allégée');
  const sum = sig.reduce((a, x) => a + x.v, 0), lvl = sum <= -3 ? 'low' : sum <= -1 ? 'mid' : 'good';
  const inj = S.profile?.injury ? String(S.profile.injury).split(/[.(]/)[0].trim() : '';
  return {sig, lvl, inj};
}
// Les réglages, du plus utile au moins utile selon la forme. Les charges s'excluent entre elles, le reste se combine.
function formOpts(lvl) {
  const L = {
    low: [['k90', 'Charges −10 %', 'garde la vitesse, baisse la fatigue'], ['set', 'Une série de moins par exercice', 'même qualité, moins de volume'], ['plio', 'Sans sauts ni impacts', 'protège tendons, tibias et dos'], ['rpe', 'Arrêter à 3 répétitions en réserve', 'RPE 7 au plus']],
    mid: [['k95', 'Charges −5 %', 'la vitesse de barre reste haute'], ['rpe', 'Arrêter à 3 répétitions en réserve', 'RPE 7 au plus'], ['set', 'Une série de moins par exercice', 'si la fatigue monte pendant la séance']],
    good: [['k1025', 'Premier exercice +2,5 %', 'tu es frais : on pousse, dans ta règle des +2,5 %'], ['set+', 'Une série de plus au premier exercice', 'seulement si la barre reste rapide']]
  };
  return L[lvl] || [];
}
const FK = {k90: .9, k95: .95, k1025: 1.025};
function formApply() {
  const L = S.live; if (!L?.form) return; const f = L.form, on = f.on || [];
  const items = structuredClone(L.formBase), auto = f.autoK || 1, k = on.map(x => FK[x]).find(Boolean) || 1;
  items.forEach((it, i) => {
    if (!it.sets) return;
    const first = items.findIndex(x => x.sets) === i;
    // Les charges : celles du plan (sans la baisse automatique), puis le réglage choisi (+2,5 % : premier exercice seulement).
    const kk = on.includes('k1025') ? (first ? 1.025 : 1) : k;
    for (const s of it.sets) if (+s.kg > 0) s.kg = r25(+s.kg / auto * kk);
    if (on.includes('set') && it.sets.length > (isUni(it.tg || it) ? 2 : 1)) it.sets.splice(-(isUni(it.tg || it) ? 2 : 1));
    if (on.includes('set+') && first) it.sets.push(...structuredClone(it.sets.slice(-(isUni(it.tg || it) ? 2 : 1))));
    if (on.includes('rpe')) it.tg = {...(it.tg || {}), rpe: Math.min(+it.tg?.rpe || 7, 7)};
  });
  L.items = on.includes('plio') ? items.filter(it => !(exOf(it.ex).cat === 'Pliométrie' && !PLYO_NOT.test(exOf(it.ex).n))) : items;
}
function formCard() {
  const L = S.live; if (!L || L.kind !== 'gym') return '';
  const started = L.items.some(it => (it.sets || it.reps || []).some(x => x.done));
  if (!L.form && !started) { L.form = {...formCheck(), on: [], autoK: recFactor().k}; L.formBase = structuredClone(L.items); if (L.form.autoK !== 1) formApply(); }
  const f = L.form; if (!f) return '';
  const lab = {low: 'Forme basse', mid: 'Forme moyenne', good: 'Bonne forme'}[f.lvl], cls = {low: 'bad', mid: 'mid', good: 'ok'}[f.lvl];
  const ops = formOpts(f.lvl), chosen = ops.filter(([id]) => f.on.includes(id)).map(([, n]) => n);
  if (started) return chosen.length ? `<div class="card formc ${cls}"><span class="eyebrow">Forme du jour · ${lab}</span><p class="small" style="margin:6px 0 0">Séance adaptée : ${esc(chosen.join(', '))}.</p></div>` : '';
  return `<div class="card formc ${cls}"><div class="chead" style="margin-bottom:6px"><span class="eyebrow">Forme du jour</span><b class="fclab">${lab}</b></div>
    ${f.sig.length ? `<div class="fsig">${f.sig.map(x => `<span class="${x.v < 0 ? 'm' : 'p'}">${esc(x.t)}</span>`).join('')}</div>` : '<p class="small muted" style="margin:0">Pas encore de données ce matin : remplis ton questionnaire pour un avis plus précis.</p>'}
    ${f.inj ? `<p class="small muted" style="margin:6px 2px 0">Antécédent pris en compte : ${esc(f.inj)}.</p>` : ''}
    <div class="sec-label" style="margin:12px 2px 6px">Ce que tu peux changer, du plus utile au moins utile</div>
    ${ops.map(([id, n, why], i) => `<button type="button" class="fopt" data-fopt="${id}" aria-pressed="${f.on.includes(id)}"><i>${i + 1}</i><span><b>${esc(n)}</b><small>${esc(why)}</small></span><em>${f.on.includes(id) ? '✓' : ''}</em></button>`).join('')}
    <button type="button" class="fopt keep" data-fopt="keep" aria-pressed="${!f.on.length}"><i>·</i><span><b>Garder la séance prévue</b><small>les charges de ton programme, rien ne change</small></span><em>${!f.on.length ? '✓' : ''}</em></button></div>`;
}
document.addEventListener('click', e => {
  const b = e.target.closest?.('[data-fopt]'); if (!b || !S.live?.form) return;
  const f = S.live.form, id = b.dataset.fopt;
  if (id === 'keep') { f.on = []; formApply(); }
  else { const isK = !!FK[id]; f.on = f.on.includes(id) ? f.on.filter(x => x !== id) : [...f.on.filter(x => !(isK && FK[x])), id]; formApply(); }
  saveLive(); paneRender();
});
