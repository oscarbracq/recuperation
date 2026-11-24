/* ================= Coach training (ordinateur) =================
   Un carré « Coach training » à côté de « Planification », sur ordinateur seulement. On lui donne ce qu'un coach
   demande (objectif, échéance, durée, séances par semaine, salle, contraintes) ; l'appli ajoute tout ce qu'elle sait
   déjà (saison, douleurs, créneaux du planning, maxima, séances récentes, récupération, matériel des salles).
   Avec l'abonnement Claude (pas d'API payante) : « Demander à Claude » copie la demande complète, à coller dans Claude
   (onglet Code, où le skill « prepa-physique » est installé). Claude répond par un bloc de séances ; on le recolle ici,
   on voit les séances, puis « Envoyer dans le planning » les crée et les cale sur leurs jours. */
const CTR = {goal: '', until: '', weeks: 4, per: 3, gym: '', notes: '', paste: '', parsed: null, err: ''};
function coachChip() { return typeof isPC === 'function' && isPC() ? `<button type="button" class="seachip coachchip" data-coachtr aria-label="Coach training : créer des séances"><span>Coach</span><b>Training</b></button>` : ''; }
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
  const g = CTR.gym || 'dmarcq'; L.push(`Salle : ${gymName(g)}. Matériel (identifiants de l'appli) : ${GYM_EQ[g].join(', ')}.`);
  return L.join('\n');
}
function ctPrompt() {
  return `Utilise le skill « prepa-physique » (préparateur physique et coach de musculation d'Oscar). Crée ses séances de musculation pour les ${CTR.weeks} prochaines semaines.

Ce qu'Oscar demande :
- Objectif : ${CTR.goal || 'progresser en sprint (60 m en salle, 100 m dehors) et durer, sans se blesser'}
- Échéance : ${CTR.until || 'la prochaine compétition de la saison'}
- Séances de musculation par semaine : ${CTR.per}
- Notes : ${CTR.notes || 'aucune'}

Ce que l'appli sait déjà :
${ctContext()}

Règles : un échauffement adapté à chaque séance (avec le matériel de la salle), une montée en charge, un retour au calme ; uniquement des exercices faisables dans la salle ; identifiants d'exercices de l'appli (référence salles-et-exercices.md du skill) ; progression semaine par semaine, et une semaine allégée si le cycle le demande ; jamais de nordic ni de réception dure (périostites).

Réponds d'abord par un tableau court par semaine, puis TERMINE par un seul bloc \`\`\`json, exactement de cette forme (Oscar le recolle dans l'appli) :
{"tnr":"plan","sessions":[{"date":"AAAA-MM-JJ","name":"PPS S2 · Force","title":"…","desc":"…","warm":{"sel":["w_bike","m_ank","a_tib"],"preset":null},"cool":{"min":5,"sel":["r_coh"]},"items":[{"ex":"halfsquat","sets":4,"reps":3,"pct":85,"rest":240,"tempo":[2,0,1,0],"note":"…"},{"ex":"boxjump","sets":4,"reps":3,"rest":180,"link":true}]}]}`;
}
function ctParse(txt) {
  CTR.err = ''; CTR.parsed = null; if (!txt.trim()) return;
  const m = txt.match(/```json\s*([\s\S]*?)```/) || txt.match(/(\{[\s\S]*"sessions"[\s\S]*\})/);
  let j; try { j = JSON.parse((m ? m[1] : txt).trim()); } catch (e) { CTR.err = 'Je n\'arrive pas à lire la réponse : recolle tout le bloc json de Claude.'; return; }
  const ses = Array.isArray(j.sessions) ? j.sessions : []; if (!ses.length) { CTR.err = 'Aucune séance dans la réponse.'; return; }
  const unk = new Set(); for (const s of ses) for (const it of s.items || []) if (!EXI[it.ex]) unk.add(it.ex);
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
  const gp = {...(S.tset.gymPlan || {})}; if (CTR.gym) for (const s of ses) gp[dated[s.date]] = CTR.gym;
  await saveTset({dated, gymPlan: gp});
  toast(`${ses.length} séances envoyées dans le planning`); CTR.parsed = null; CTR.paste = ''; closeAllPanes?.(); try { renderMod(true); } catch (e) {}
}
function coachPane() {
  openPane({title: 'Coach training', side: true, render: () => {
    const f = (k, l, ph, t = 'text') => `<label class="ctf"><span>${l}</span><input type="${t}" data-ctk="${k}" value="${esc(String(CTR[k] ?? ''))}" placeholder="${ph}"></label>`;
    const P = CTR.parsed;
    return `<div style="margin-top:14px"></div>
      <div class="card"><span class="eyebrow">1 · Ce que tu veux</span>
        ${f('goal', 'Objectif', 'ex. 6,85 au 60 m, gagner en force sur une jambe')}
        ${f('until', 'Échéance', 'ex. championnats en salle, 7 mars')}
        <div class="ctrow2">${f('weeks', 'Semaines', '4', 'number')}${f('per', 'Séances par semaine', '3', 'number')}</div>
        <div class="ctf"><span>Salle</span><div class="chipsx">${GYMS.map(([g, n]) => `<button type="button" class="chip" data-ctgym="${g}" aria-pressed="${(CTR.gym || 'dmarcq') === g}">${esc(n)}</button>`).join('')}</div></div>
        <label class="ctf"><span>Contraintes, envies, ce que ton coach de sprint prévoit</span><textarea data-ctk="notes" rows="3" placeholder="ex. pas de squat lourd la veille des départs, je veux plus de travail du pied">${esc(CTR.notes)}</textarea></label></div>
      <div class="card" style="margin-top:12px"><span class="eyebrow">2 · Ce que l'appli ajoute toute seule</span><pre class="ctctx">${esc(ctContext())}</pre></div>
      <button class="btn" style="margin-top:12px;width:100%" data-ctcopy>Demander à Claude (copie la demande)</button>
      <p class="small muted" style="margin:6px 2px 0">Colle-la dans Claude, onglet Code (le skill préparateur physique y est). Puis recolle sa réponse ci-dessous.</p>
      <div class="card" style="margin-top:12px"><span class="eyebrow">3 · La réponse de Claude</span><textarea data-ctk="paste" rows="5" placeholder="Colle ici toute la réponse (avec le bloc json)">${esc(CTR.paste)}</textarea>
        ${CTR.err ? `<p class="small" style="color:var(--bad);margin:6px 2px 0">${esc(CTR.err)}</p>` : ''}
        ${P ? `<div class="ctlist">${P.map(s => `<div class="row"><span class="l">${esc(cap(fmtShort(s.date)))}<span class="hint">${esc(s.name || '')} · ${s.items.length} exercices${s.warm ? ' · échauffement' : ''}</span></span></div>`).join('')}</div>
          ${CTR.unk?.length ? `<p class="small" style="color:var(--warn);margin:6px 2px 0">Exercices inconnus de l'appli, retirés : ${esc(CTR.unk.join(', '))}</p>` : ''}
          <button class="btn" style="margin-top:10px;width:100%" data-ctsend>Envoyer dans le planning (${P.length} séances)</button>` : ''}</div>`;
  }});
}
document.addEventListener('click', async e => {
  const at = q => e.target.closest?.(q); let b;
  if (at('[data-coachtr]')) { coachPane(); return; }
  if ((b = at('[data-ctgym]'))) { CTR.gym = b.dataset.ctgym; paneRender(); return; }
  if (at('[data-ctcopy]')) { try { await navigator.clipboard.writeText(ctPrompt()); toast('Demande copiée : colle-la dans Claude'); } catch (err) { toast('Copie impossible'); } return; }
  if (at('[data-ctsend]')) { await ctSend(); return; }
});
document.addEventListener('input', e => { const k = e.target.dataset?.ctk; if (!k) return; CTR[k] = e.target.type === 'number' ? Math.max(1, +e.target.value || 1) : e.target.value; if (k === 'paste') { ctParse(CTR.paste); paneRender(); } });
