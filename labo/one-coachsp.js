/* ================= Coach sprint (ordinateur), à gauche de « Planification » =================
   Comme le Coach muscu, mais pour la piste, avec le skill « coach-sprint » (biomécanicien et entraîneur de sprint).
   L'appli ajoute ce qu'elle sait : saison, créneaux d'athlé du planning, séances déjà calées (celles du coach du club
   ne sont pas écrasées sans le dire), axes de travail de « Ton cap », points faibles vus en vidéo, records, douleurs.
   Chaque séance revient avec UNE consigne (« cue ») tirée de ses défauts. */
const CSP = {goal: '', until: '', comp: '', weeks: 4, per: 3, notes: '', paste: '', parsed: null, err: '', over: false};
const TRACK_WARM = {sel: ['jbm_m1', 'jbm_m2', 'jbm_m3', 'jbm_m4', 'jbm_m5', 'jbm_d1', 'jbm_d2', 'jbm_d3', 'jbm_d4', 'jbm_d5', 'jbm_p1', 'jbm_p2', 'jbm_p3'], preset: 'jbm'};
function sprintChip() { return typeof isPC === 'function' && isPC() ? `<button type="button" class="seachip coachchip" data-coachsp aria-label="Coach sprint : créer des séances de piste"><span>Coach</span><b>Sprint</b></button>` : ''; }
const tSesCoach0 = tSessions;
tSessions = () => tSesCoach0().replace('<div class="sechipw">', '<div class="sechipw">' + sprintChip());
function spContext() {
  const L = [], n = seasonNow(TODAY), start = ctStart('track'), days = [...Array(CSP.weeks * 7)].map((_, i) => addDays(start, i)), pr = S.profile || {}, sp = pr.sprinter || {};
  L.push(`Aujourd'hui : ${TODAY}. Les séances commencent le lundi ${start} (${CSP.weeks} semaines).`);
  if (n && !n.before && !n.after) L.push(`Saison : bloc « ${n.name} », semaine ${n.week} sur ${n.of}${n.goal ? ' (' + n.goal + ')' : ''}${n.comp != null ? `, compétition dans ${n.comp} jours` : ''}.`);
  const se = S.tset?.season?.blocks || []; if (se.length) L.push('Blocs de la saison : ' + se.map(b => `${b[0]} ${b[1]} sem.`).join(' → ') + '.');
  if (sp.pb60 || sp.pb100) L.push(`Records : 60 m ${sp.pb60 || '?'} · 100 m ${sp.pb100 || '?'}.`);
  const c = typeof capGet === 'function' ? capGet() : null;
  if (c) { L.push(`Objectif : ${c.ev || '60 m'} en ${c.to ? chr(c.to) : '?'} aux ${c.res || 'championnats'} le ${c.date}. Jalons : ${(c.steps || []).map(s => `${s.d} ${s.t}`).join(' ; ')}.`);
    L.push('Axes de travail (défauts), du plus prioritaire au moins prioritaire :\n' + capAxes(c).map((a, i) => `  ${i + 1}. ${a.n} (id « ${a.id} », importance ${a.imp}/10, rapidité ${a.rap}/10${a.st === 'done' ? ', corrigé' : ''})`).join('\n'));
    const ch = (c.chronos || []).slice(-6); if (ch.length) L.push('Derniers chronos : ' + ch.map(x => `${x.d || ''} ${x.ev || ''} ${x.t}`).join(' ; ') + '.'); }
  if (typeof anaPts === 'function') { const W = anaPts('run').faibles.slice(0, 6); if (W.length) L.push('Points faibles vus en vidéo : ' + W.map(w => `${w.t}${w.axe ? ` (axe ${w.axe})` : ''}`).join(' ; ') + '.'); }
  const hf = tests().filter(x => x.type === 'hfv').sort((a, b) => b.date.localeCompare(a.date))[0]; if (hf) L.push(`Profil force-vitesse en sprint (${hf.date}) : F0 ${fx(hf.F0, 1)} N/kg, Vmax ${fx(hf.vmax, 2)} m/s.`);
  const fv = lastTest('fv'), fr = fv ? fvProfile(fv) : null; if (fr) L.push(`Profil force-vitesse au saut (${fv.date}) : ${Math.round(fr.imb * 100)} % de l'optimal.`);
  const slots = days.filter(k => planHas(k, 'athle')).map(k => { const b = dayPlan(k).find(x => x.c === 'athle'), has = planOf(S.tset?.dated?.[k + '|t']); return `${k} (${DAYS_FR?.[dow(k)] || ''} ${b ? b.a : ''}${has ? ` · déjà calée : « ${has.name} »` : ''})`; });
  L.push('Créneaux d\'athlé du planning : ' + (slots.join(', ') || 'aucun : propose lundi, mercredi, vendredi soir') + '.');
  const gy = days.filter(k => planHas(k, 'muscu')); if (gy.length) L.push('Muscu le matin : ' + gy.join(', ') + '.');
  const lg = logs().filter(l => l.kind === 'track' && l.date >= addDays(TODAY, -28)).slice(0, 10).map(l => `${l.date} ${l.name} (RPE ${l.rpe || '–'}${l.sprintM ? ', ' + l.sprintM + ' m' : ''})`);
  if (lg.length) L.push('Séances de piste des 4 dernières semaines : ' + lg.join(' ; ') + '.');
  const P = {}; for (let i = 0; i < 14; i++) { const k = addDays(TODAY, -i); for (const [z, v] of Object.entries(pains(k) || {})) if (+v > 0) P[z] = Math.max(P[z] || 0, +v); }
  L.push('Douleurs des 14 derniers jours : ' + (Object.keys(P).length ? Object.entries(P).map(([z, v]) => `${z} ${v}/10`).join(', ') : 'aucune') + '.');
  if (pr.injury || pr.notes) L.push('Profil : ' + [pr.injury, pr.notes].filter(Boolean).join(' · ').slice(0, 500));
  try { const k = lastKey('hrv'), r = k ? recovery(k) : null; if (r) L.push(`Récupération du jour : ${r.score} %.`); } catch (e) {}
  return L.join('\n');
}
function spPrompt() {
  return `Utilise le skill « coach-sprint » (coach de sprint et biomécanicien d'Oscar). Crée ses séances de piste pour les ${CSP.weeks} prochaines semaines.

Ce qu'Oscar demande :
- Objectif : ${CSP.goal || 'courir plus vite sur 60 m (salle) puis 100 m, en corrigeant ses défauts, sans se blesser'}
- Échéance : ${CSP.until || 'la prochaine compétition de la saison'}${CSP.comp ? `\n- Date de la compétition visée : ${CSP.comp}` : ''}
- Séances de piste par semaine : ${CSP.per}
- Notes : ${CSP.notes || 'aucune'}

Ce que l'appli sait déjà :
${spContext()}

Règles : une qualité principale par séance ; la vitesse et les départs frais, en début de séance ; récupération complète ; échauffement de piste (preset « jbm » de l'appli + gammes liées à la consigne) ; UNE consigne technique par séance (champ "cue", 3 à 7 mots), tirée de l'axe le plus prioritaire qui se travaille dans cette séance, gardée 2 à 3 séances avant d'en changer ; "axe" = l'identifiant de cet axe ; cohérence avec la muscu du matin (méthode haut-bas). Identifiants des courses : blocks, accel, start3, fly, speedend, tempo, hill, sled, bandres, techplace, techrelax, wickets, strides, tw_course, tw_plio, tw_renfo.

Réponds d'abord par un tableau court par semaine (jour, séance, consigne), puis TERMINE par un seul bloc \`\`\`json, exactement de cette forme :
{"tnr":"plan","kind":"track","sessions":[{"date":"AAAA-MM-JJ","name":"PPS S2 · Vitesse max","title":"…","cue":"Pied sous la hanche","axe":"contact","desc":"…","tech":"Lattes à 1,9 m","twMin":15,"items":[{"ex":"tw_course","tw":"course","min":15},{"ex":"fly","seq":[30],"blocks":4,"pct":100,"start":"fly","run":20,"rest":360,"brest":480,"note":"…"},{"ex":"sled","seq":[20],"blocks":4,"pct":95,"res":"sled","kg":20,"rest":180}]}]}`;
}
function spParse(txt) {
  CSP.err = ''; CSP.parsed = null; if (!txt.trim()) return;
  const m = txt.match(/```json\s*([\s\S]*?)```/) || txt.match(/(\{[\s\S]*"sessions"[\s\S]*\})/);
  let j; try { j = JSON.parse((m ? m[1] : txt).trim()); } catch (e) { CSP.err = 'Je n\'arrive pas à lire la réponse : recolle tout le bloc json de Claude.'; return; }
  const unk = new Set(), ses = (Array.isArray(j.sessions) ? j.sessions : []).filter(s => /^\d{4}-\d\d-\d\d$/.test(s.date || ''));
  for (const s of ses) { s.items = (s.items || []).filter(it => { const ok = EXI[it.ex] && exOf(it.ex).t === 'track'; if (!ok) unk.add(it.ex); return ok; });
    for (const it of s.items) if (it.seq) { it.seq = (Array.isArray(it.seq) ? it.seq : [it.seq]).map(Number).filter(x => x > 0); it.blocks = +it.blocks || 1; it.reps = it.seq.length * it.blocks; it.dist = Math.round(it.seq.reduce((a, b) => a + b, 0) / it.seq.length); } }
  CSP.parsed = ses.filter(s => s.items.length); CSP.unk = [...unk]; if (!CSP.parsed.length) { CSP.parsed = null; CSP.err = 'Aucune séance de piste dans la réponse.'; }
}
async function spSend() {
  const ses = CSP.parsed; if (!ses?.length) return;
  const dated = {...(S.tset.dated || {})}, now = new Date().toISOString(); let kept = 0, put = 0;
  for (const s of ses) { const k = s.date + '|t';
    if (dated[k] && !CSP.over) { kept++; continue; }
    const id = 'csp-' + s.date + '-' + Math.random().toString(36).slice(2, 6);
    const p = {id, kind: 'track', name: String(s.name || 'Piste').slice(0, 40), title: s.title || '', desc: s.desc || '', cue: String(s.cue || '').slice(0, 60), axe: s.axe || null, tech: s.tech || '', twMin: +s.twMin || (s.tech ? 15 : 0),
      warm: s.warm?.sel?.length ? s.warm : TRACK_WARM, items: s.items, seqAuto: true, coach: true, updatedAt: now};
    S.plans = {...(S.plans || {}), [id]: p}; await dbSet('plans/' + id, p); dated[k] = id; put++; }
  await saveTset({dated});
  toast(`${put} séances de piste dans le planning${kept ? ` · ${kept} jours gardés (déjà calés)` : ''}`); CSP.parsed = null; CSP.paste = ''; closeAllPanes?.(); try { renderMod(true); } catch (e) {}
}
function spPane() {
  openPane({title: 'Coach sprint', side: true, render: () => {
    const f = (k, l, ph, t = 'text') => `<label class="ctf"><span>${l}</span><input type="${t}" data-spk="${k}" value="${esc(String(CSP[k] ?? ''))}" placeholder="${ph}"></label>`, Pp = CSP.parsed;
    const taken = Pp ? Pp.filter(s => S.tset?.dated?.[s.date + '|t']).length : 0;
    return `<div style="margin-top:14px"></div>
      <div class="card"><span class="eyebrow">1 · Ce que tu veux</span>
        ${f('goal', 'Objectif', 'ex. 6,95 au 60 m, garder le buste penché jusqu\'à 15 m')}
        ${f('until', 'Échéance', 'ex. championnats en salle, 7 mars')}
        ${f('comp', 'Date de la compétition visée', '', 'date')}
        <p class="small muted" data-spwk style="margin:4px 2px 0">${ctWkTxt('track', CSP.comp)}</p><div class="ctrow2">${f('weeks', 'Semaines', '4', 'number')}${f('per', 'Séances de piste par semaine', '3', 'number')}</div>
        <label class="ctf"><span>Contraintes, envies, ce que ton coach de club prévoit</span><textarea data-spk="notes" rows="3" placeholder="ex. le mercredi c'est mon coach qui fait la séance ; pas de départs si le dos tire">${esc(CSP.notes)}</textarea></label></div>
      <div class="card" style="margin-top:12px"><span class="eyebrow">2 · Ce que l'appli ajoute toute seule</span><pre class="ctctx">${esc(spContext())}</pre></div>
      <button class="btn" style="margin-top:12px;width:100%" data-spcopy>Demander à Claude (copie la demande)</button>
      <p class="small muted" style="margin:6px 2px 0">Colle-la dans Claude, onglet Code (le skill coach-sprint y est). Puis recolle sa réponse ci-dessous.</p>
      <div class="card" style="margin-top:12px"><span class="eyebrow">3 · La réponse de Claude</span><textarea data-spk="paste" rows="5" placeholder="Colle ici toute la réponse (avec le bloc json)">${esc(CSP.paste)}</textarea>
        ${CSP.err ? `<p class="small" style="color:var(--bad);margin:6px 2px 0">${esc(CSP.err)}</p>` : ''}
        ${Pp ? `<div class="ctlist">${Pp.map(s => `<div class="row"><span class="l">${esc(cap(fmtShort(s.date)))}<span class="hint">${esc(s.name || '')} · ${s.items.length} parties${s.cue ? ` · consigne « ${esc(s.cue)} »` : ''}${S.tset?.dated?.[s.date + '|t'] ? ' · <b style="color:var(--warn)">jour déjà calé</b>' : ''}</span></span></div>`).join('')}</div>
          ${CSP.unk?.length ? `<p class="small" style="color:var(--warn);margin:6px 2px 0">Exercices inconnus de l'appli, retirés : ${esc(CSP.unk.join(', '))}</p>` : ''}
          ${taken ? `<label class="ctck" style="margin-top:8px"><input type="checkbox" data-spover${CSP.over ? ' checked' : ''}> Remplacer les ${taken} séances déjà calées (celles de ton coach de club)</label>` : ''}
          <button class="btn" style="margin-top:10px;width:100%" data-spsend>Envoyer dans le planning (${Pp.length - (CSP.over ? 0 : taken)} séances)</button>` : ''}</div>`;
  }});
}
document.addEventListener('click', async e => {
  const at = q => e.target.closest?.(q);
  if (at('[data-coachsp]')) { spPane(); return; }
  if (at('[data-spcopy]')) { try { await navigator.clipboard.writeText(spPrompt()); toast('Demande copiée : colle-la dans Claude'); } catch (err) { toast('Copie impossible'); } return; }
  if (at('[data-spsend]')) { await spSend(); return; }
});
document.addEventListener('change', e => { if (e.target.matches?.('[data-spover]')) { CSP.over = e.target.checked; paneRender(); } });
document.addEventListener('input', e => { const k = e.target.dataset?.spk; if (!k) return; CSP[k] = e.target.type === 'number' ? Math.max(1, +e.target.value || 1) : e.target.value; if (k === 'comp') { const w = ctWeeks(ctStart('track'), CSP.comp); if (w) { CSP.weeks = w; const i = document.querySelector('[data-spk="weeks"]'); if (i) i.value = w; } const s2 = document.querySelector('[data-spwk]'); if (s2) s2.textContent = ctWkTxt('track', CSP.comp); } if (k === 'paste') { spParse(CSP.paste); paneRender(); } });
