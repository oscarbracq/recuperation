/* ================= Coach training (ordinateur) =================
   Un carré « Coach training » à côté de « Planification », sur ordinateur seulement. On lui donne ce qu'un coach
   demande (objectif, échéance, durée, séances par semaine, salle, contraintes) ; l'appli ajoute tout ce qu'elle sait
   déjà (saison, douleurs, créneaux du planning, maxima, séances récentes, récupération, matériel des salles).
   Avec l'abonnement Claude (pas d'API payante) : « Demander à Claude » copie la demande complète, à coller dans Claude
   (onglet Code, où le skill « prepa-physique » est installé). Claude répond par un bloc de séances ; on le recolle ici,
   on voit les séances, puis « Envoyer dans le planning » les crée et les cale sur leurs jours. */
const CTR = {goal: '', until: '', comp: '', fit: true, weeks: 4, per: 3, gyms: ['dmarcq'], notes: '', paste: '', parsed: null, err: ''};
function coachChip() { return typeof isPC === 'function' && isPC() ? `<button type="button" class="seachip coachchip" data-coachtr aria-label="Coach muscu : créer des séances de musculation"><span>Coach</span><b>Muscu</b></button>` : ''; }
const ctMonday = () => { let d = addDays(TODAY, 1); while (dow(d) !== 1) d = addDays(d, 1); return d; };
function ctContext() {
  const L = [], n = seasonNow(TODAY), start = ctMonday(), days = [...Array(CTR.weeks * 7)].map((_, i) => addDays(start, i));
  L.push(`Aujourd'hui : ${TODAY}. Les séances commencent le lundi ${start} (${CTR.weeks} semaines).`);
  if (n && !n.before && !n.after) L.push(`Saison : bloc « ${n.name} », semaine ${n.week} sur ${n.of}${n.goal ? ' (' + n.goal + ')' : ''}${n.comp != null ? `, compétition dans ${n.comp} jours` : ''}.`);
  const se = S.tset?.season?.blocks || []; if (se.length) L.push('Blocs de la saison : ' + se.map(b => `${b[0]} ${b[1]} sem.`).join(' → ') + '.');
  const slots = days.filter(k => planHas(k, 'muscu')).map(k => { const b = dayPlan(k).find(x => x.c === 'muscu'); return `${k} (${DAYS_FR?.[dow(k)] || ''} ${b ? b.a + '-' + b.b : ''})`; });
  L.push('Créneaux de musculation du planning : ' + (slots.join(', ') || 'aucun : propose lundi, mercredi, vendredi 10 h') + '.');
  const sp = days.filter(k => planHas(k, 'athle')).map(k => { const b = dayPlan(k).find(x => x.c === 'athle'); return `${k} ${b ? b.a : ''}`; });
  if (sp.length) L.push('Séances de sprint du coach (le soir) : ' + sp.join(', ') + '.');
  const P = {}; for (let i = 0; i < 14; i++) { const k = addDays(TODAY, -i); for (const [z, v] of Object.entries(pains(k) || {})) if (+v > 0) P[z] = Math.max(P[z] || 0, +v); }
  L.push('Douleurs des 14 derniers jours : ' + (Object.keys(P).length ? Object.entries(P).map(([z, v]) => `${z} ${v}/10`).join(', ') : 'aucune') + '.');
  const pr = S.profile || {}; if (pr.injury || pr.notes) L.push('Profil : ' + [pr.injury, pr.notes].filter(Boolean).join(' · ').slice(0, 600));
  const rm = MAIN_LIFTS.concat(['halfsquat', 'bss', 'legpress']).map(id => { const r = rmOf(id)?.kg; return r ? `${exOf(id).n} ${fx(r)} kg` : ''; }).filter(Boolean);
  if (rm.length) L.push('Maxima (estimés ou testés) : ' + rm.join(', ') + '.');
  const lg = logs().filter(l => l.kind === 'gym' && l.date >= addDays(TODAY, -28)).slice(0, 8).map(l => `${l.date} ${l.name} (RPE ${l.rpe || '–'})`);
  if (lg.length) L.push('Séances de muscu des 4 dernières semaines : ' + lg.join(' ; ') + '.');
  try { const k = lastKey('hrv'), r = k ? recovery(k) : null; if (r) L.push(`Récupération du jour : ${r.score} %.`); } catch (e) {}
  const gs = CTR.gyms.length ? CTR.gyms : ['dmarcq'];
  L.push(gs.length > 1 ? `Salles possibles : ${gs.map(gymName).join(', ')}. Une séance se fait dans UNE seule salle, avec seulement son matériel (pas de matériel d'une autre salle dans la même séance).` : `Salle : ${gymName(gs[0])}.`);
  for (const g of gs) L.push(`Matériel de ${gymName(g)} (identifiant de salle « ${g} », identifiants de l'appli) : ${GYM_EQ[g].join(', ')}.`);
  return L.join('\n');
}
function ctPrompt() {
  return `Utilise le skill « prepa-physique » (préparateur physique et coach de musculation d'Oscar). Crée ses séances de musculation pour les ${CTR.weeks} prochaines semaines.

Ce qu'Oscar demande :
- Objectif : ${CTR.goal || 'progresser en sprint (60 m en salle, 100 m dehors) et durer, sans se blesser'}
- Échéance : ${CTR.until || 'la prochaine compétition de la saison'}${CTR.comp ? `
- Date de la compétition visée : ${CTR.comp}` : ''}
- Séances de musculation par semaine : ${CTR.per}
- Notes : ${CTR.notes || 'aucune'}

Ce que l'appli sait déjà :
${ctContext()}

Règles : un échauffement adapté à chaque séance (avec le matériel de la salle), une montée en charge, un retour au calme ; chaque séance dans UNE seule salle (champ "gym" = identifiant de la salle), avec uniquement les exercices faisables avec le matériel de cette salle ; identifiants d'exercices de l'appli (référence salles-et-exercices.md du skill) ; progression semaine par semaine, et une semaine allégée si le cycle le demande ; jamais de nordic ni de réception dure (périostites). Ce sont des salles commerciales, en intérieur, avec peu de place et du monde autour : pas de lancer de ballon vers l'arrière ou en hauteur, pas d'exercice qui demande beaucoup de place ou qui peut gêner les autres ; repère-les et propose une adaptation (swing kettlebell, lancer au sol, lancer contre le mur).

Les blocs de sa saison (PPG, Foncier, PPS, Pré-compétition, Compétition) seront recalés sur ta programmation : nomme chaque séance avec son bloc (« PPS S2 · … », « Pré-compét. S1 · … », « Compét. S1 · … ») et donne dans "blocks" la date de début (un lundi) de chaque bloc qui commence pendant ou juste après ces semaines, compétition comprise.

Réponds d'abord par un tableau court par semaine, puis TERMINE par un seul bloc \`\`\`json, exactement de cette forme (Oscar le recolle dans l'appli) :
{"tnr":"plan","blocks":[{"name":"Pré-compétition","from":"AAAA-MM-JJ"},{"name":"Compétition","from":"AAAA-MM-JJ"}],"sessions":[{"date":"AAAA-MM-JJ","gym":"dmarcq","name":"PPS S2 · Force","title":"…","desc":"…","warm":{"sel":["w_bike","m_ank","a_tib"],"preset":null},"cool":{"min":5,"sel":["r_coh"]},"items":[{"ex":"halfsquat","sets":4,"reps":3,"pct":85,"rest":240,"tempo":[2,0,1,0],"note":"…"},{"ex":"boxjump","sets":4,"reps":3,"rest":180,"link":true}]}]}`;
}
function ctParse(txt) {
  CTR.err = ''; CTR.parsed = null; if (!txt.trim()) return;
  const m = txt.match(/```json\s*([\s\S]*?)```/) || txt.match(/(\{[\s\S]*"sessions"[\s\S]*\})/);
  let j; try { j = JSON.parse((m ? m[1] : txt).trim()); } catch (e) { CTR.err = 'Je n\'arrive pas à lire la réponse : recolle tout le bloc json de Claude.'; return; }
  const ses = Array.isArray(j.sessions) ? j.sessions : []; if (!ses.length) { CTR.err = 'Aucune séance dans la réponse.'; return; }
  const unk = new Set(), gs = CTR.gyms.length ? CTR.gyms : ['dmarcq'];
  for (const s of ses) { if (!gs.includes(s.gym)) s.gym = gs.find(g => (s.items || []).every(it => !EXI[it.ex] || gymHas(g, it.ex))) || gs[0];
    s.miss = (s.items || []).filter(it => EXI[it.ex] && !gymHas(s.gym, it.ex)).map(it => exOf(it.ex).n);
    for (const it of s.items || []) if (!EXI[it.ex]) unk.add(it.ex); }
  CTR.blocks = Array.isArray(j.blocks) ? j.blocks.filter(b => b && /^\d{4}-\d\d-\d\d$/.test(b.from || '')) : [];
  CTR.parsed = ses.filter(s => /^\d{4}-\d\d-\d\d$/.test(s.date || '') && (s.items || []).length); CTR.unk = [...unk];
}
async function ctSend() {
  const ses = CTR.parsed; if (!ses?.length) return;
  const dated = {...(S.tset.dated || {})}, now = new Date().toISOString();
  for (const s of ses) {
    const id = 'coach-' + s.date + '-' + Math.random().toString(36).slice(2, 6);
    const p = {id, kind: 'gym', name: String(s.name || 'Séance').slice(0, 40), title: s.title || '', desc: s.desc || '', items: s.items.filter(it => EXI[it.ex]), warm: s.warm || null, cool: s.cool || null, updatedAt: now, coach: true};
    S.plans = {...(S.plans || {}), [id]: p}; await dbSet('plans/' + id, p); dated[s.date] = id;
  }
  const gp = {...(S.tset.gymPlan || {})}; for (const s of ses) if (s.gym) gp[dated[s.date]] = s.gym;
  const fit = CTR.fit ? seFit(ses, CTR.blocks, CTR.comp) : null;
  await saveTset({dated, gymPlan: gp, ...(fit?.changed ? {season: fit.se} : {})});
  toast(`${ses.length} séances envoyées dans le planning${fit?.changed ? ' · saison recalée' : ''}`); CTR.parsed = null; CTR.paste = ''; closeAllPanes?.(); try { renderMod(true); } catch (e) {}
}
function coachPane() {
  openPane({title: 'Coach muscu', side: true, render: () => {
    const f = (k, l, ph, t = 'text') => `<label class="ctf"><span>${l}</span><input type="${t}" data-ctk="${k}" value="${esc(String(CTR[k] ?? ''))}" placeholder="${ph}"></label>`;
    const P = CTR.parsed;
    return `<div style="margin-top:14px"></div>
      <div class="card"><span class="eyebrow">1 · Ce que tu veux</span>
        ${f('goal', 'Objectif', 'ex. 6,85 au 60 m, gagner en force sur une jambe')}
        ${f('until', 'Échéance', 'ex. championnats en salle, 7 mars')}
        ${f('comp', 'Date de la compétition visée', '', 'date')}
        <div class="ctrow2">${f('weeks', 'Semaines', '4', 'number')}${f('per', 'Séances par semaine', '3', 'number')}</div>
        <div class="ctf"><span>Salles possibles <small>(plusieurs au choix ; une seule salle par séance)</small></span><div class="chipsx">${GYMS.map(([g, n]) => `<button type="button" class="chip" data-ctgym="${g}" aria-pressed="${CTR.gyms.includes(g)}">${CTR.gyms.includes(g) ? '✓ ' : ''}${esc(n)}</button>`).join('')}</div></div>
        <label class="ctf"><span>Contraintes, envies, ce que ton coach de sprint prévoit</span><textarea data-ctk="notes" rows="3" placeholder="ex. pas de squat lourd la veille des départs, je veux plus de travail du pied">${esc(CTR.notes)}</textarea></label></div>
      <div class="card" style="margin-top:12px"><span class="eyebrow">2 · Ce que l'appli ajoute toute seule</span><pre class="ctctx">${esc(ctContext())}</pre></div>
      <button class="btn" style="margin-top:12px;width:100%" data-ctcopy>Demander à Claude (copie la demande)</button>
      <p class="small muted" style="margin:6px 2px 0">Colle-la dans Claude, onglet Code (le skill préparateur physique y est). Puis recolle sa réponse ci-dessous.</p>
      <div class="card" style="margin-top:12px"><span class="eyebrow">3 · La réponse de Claude</span><textarea data-ctk="paste" rows="5" placeholder="Colle ici toute la réponse (avec le bloc json)">${esc(CTR.paste)}</textarea>
        ${CTR.err ? `<p class="small" style="color:var(--bad);margin:6px 2px 0">${esc(CTR.err)}</p>` : ''}
        ${P ? `<div class="ctlist">${P.map(s => `<div class="row"><span class="l">${esc(cap(fmtShort(s.date)))}<span class="hint">${esc(s.name || '')} · ${esc(gymName(s.gym))} · ${s.items.length} exercices${s.warm ? ' · échauffement' : ''}${s.miss?.length ? ` · <b style="color:var(--warn)">pas de matériel pour ${esc(s.miss.join(', '))}</b>` : ''}</span></span></div>`).join('')}</div>
          ${CTR.unk?.length ? `<p class="small" style="color:var(--warn);margin:6px 2px 0">Exercices inconnus de l'appli, retirés : ${esc(CTR.unk.join(', '))}</p>` : ''}
          ${(() => { const fit = seFit(P, CTR.blocks, CTR.comp); return fit?.changed ? `<div class="ctfit"><label class="ctck"><input type="checkbox" data-ctfit${CTR.fit ? ' checked' : ''}> Recaler ma saison sur ces séances</label><div class="list">${fit.rows.map(r => `<div class="row"><span class="l">${esc(seLab(r.n))}<span class="hint">${esc(cap(fmtShort(r.a)))} – ${esc(fmtShort(r.b))}</span></span><b class="${r.w !== r.w0 ? 'ctchg' : ''}">${r.w} sem.${r.w !== r.w0 ? ` <small>(avant ${r.w0})</small>` : ''}</b></div>`).join('')}</div></div>` : ''; })()}
          <button class="btn" style="margin-top:10px;width:100%" data-ctsend>Envoyer dans le planning (${P.length} séances)</button>` : ''}</div>`;
  }});
}
document.addEventListener('click', async e => {
  const at = q => e.target.closest?.(q); let b;
  if (at('[data-coachtr]')) { coachPane(); return; }
  if ((b = at('[data-ctgym]'))) { const g = b.dataset.ctgym; CTR.gyms = CTR.gyms.includes(g) ? (CTR.gyms.length > 1 ? CTR.gyms.filter(x => x !== g) : CTR.gyms) : [...CTR.gyms, g]; if (CTR.paste) ctParse(CTR.paste); paneRender(); return; }
  if (at('[data-ctcopy]')) { try { await navigator.clipboard.writeText(ctPrompt()); toast('Demande copiée : colle-la dans Claude'); } catch (err) { toast('Copie impossible'); } return; }
  if (at('[data-ctsend]')) { await ctSend(); return; }
});
document.addEventListener('change', e => { if (e.target.matches?.('[data-ctfit]')) CTR.fit = e.target.checked; if (e.target.dataset?.ctk === 'comp' && CTR.parsed) paneRender(); });
document.addEventListener('input', e => { const k = e.target.dataset?.ctk; if (!k) return; CTR[k] = e.target.type === 'number' ? Math.max(1, +e.target.value || 1) : e.target.value; if (k === 'paste') { ctParse(CTR.paste); paneRender(); } });

/* La saison recalée sur la programmation du coach : les blocs passés ne bougent pas ; ceux qui viennent commencent là où
   le coach les fait commencer (champ « blocks » de sa réponse, sinon la première séance nommée « PPS », « Pré-compét. »,
   « Compét. »). Le bloc en cours s'allonge ou se raccourcit pour faire la jonction. La compétition finit à la date visée
   (ou à la date de la saison). L'écart est rattrapé par le bloc qui suit la compétition, pour que la saison d'été ne bouge pas. */
const seType = n => { const s = String(n || '').toLowerCase().normalize('NFD').replace(/\p{M}/gu, ''); return /^pre[- ]?comp/.test(s) ? 'pre' : /^comp/.test(s) ? 'comp' : /^pps/.test(s) ? 'pps' : /^ppg|^foncier/.test(s) ? 'ppg' : /^trans/.test(s) ? 'tr' : ''; };
function seFit(ses, blocks, comp) {
  const se0 = S.tset?.season?.start ? S.tset.season : SEASON_2627(), se = structuredClone(se0), B = se.blocks; if (!B?.length) return null;
  const st = []; let d = se.start; for (const b of B) { st.push(d); d = addDays(d, b[1] * 7); } st.push(d);
  const iC = B.findIndex((b, i) => seType(b[0]) === 'comp' && addDays(st[i + 1], -1) >= TODAY); if (iC < 0) return null;
  const iN = Math.max(0, B.findIndex((b, i) => addDays(st[i + 1], -1) >= TODAY));
  const want = {}; const put = (t, k) => { if (t && k && (!want[t] || k < want[t])) want[t] = monday(k); };
  for (const b of blocks || []) put(seType(b.name), b.from);
  for (const s of ses || []) put(seType(s.name), s.date);
  // Une programmation qui finit en pré-compétition s'arrête à la compétition : elle commence le lundi qui suit.
  const lastS = [...(ses || [])].filter(s => s.date).sort((a, b) => a.date.localeCompare(b.date)).pop();
  if (lastS && seType(lastS.name) === 'pre' && !want.comp) want.comp = addDays(monday(lastS.date), 7);
  const end0 = st[iC + 1], endC = comp && /^\d{4}-\d\d-\d\d$/.test(comp) && comp > TODAY ? addDays(monday(comp), 7) : end0;
  const ns = st.slice(); ns[iC + 1] = endC;
  for (let j = iC; j > iN; j--) { const t = seType(B[j][0]), w = want[t] && want[t] > TODAY && B.findIndex((x, i) => i > iN && seType(x[0]) === t) === j ? want[t] : null;
    ns[j] = w || addDays(ns[j + 1], -B[j][1] * 7); if (ns[j] >= ns[j + 1]) ns[j] = addDays(ns[j + 1], -7); }
  const minCur = addDays(monday(TODAY), 7); if (ns[iN + 1] < minCur) return null;   // le bloc en cours ne peut pas finir avant cette semaine
  const W = (a, b) => Math.round(daysBetween(a, b) / 7), rows = [];
  for (let j = iN; j <= iC; j++) { const w0 = B[j][1], w = W(ns[j], ns[j + 1]); if (w < 1) return null; B[j][1] = w; rows.push({n: B[j][0], a: ns[j], b: addDays(ns[j + 1], -1), w, w0}); }
  // L'écart après la compétition : rattrapé par la transition puis le premier foncier d'été (la saison d'été ne bouge pas).
  let gap = W(endC, end0); for (let j = iC + 1; j < B.length && gap; j++) { const t = seType(B[j][0]); if (t !== 'tr' && t !== 'ppg') break; const nw = Math.max(1, B[j][1] + gap); gap -= nw - B[j][1]; B[j][1] = nw; }
  if (comp && endC !== end0 && comp < (se.comp2 || '9999')) se.comp = comp;
  return {se, rows, changed: rows.some(r => r.w !== r.w0) || endC !== end0};
}
