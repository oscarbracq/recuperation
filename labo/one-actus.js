/* ================= TNR · Actus : les nouvelles du jour en stories =================
   Un carré « Actus » en haut à droite de l'Accueil (en face de l'IA). Les stories reprennent celles de la première
   version test : plein écran, barres de progression, grand chiffre, mot géant en fond. Chaque story garde la couleur
   de sa partie, en nuances : Recovery en bleus, Training en rouges et orangés, Nutrition en verts.
   · touche à droite : la suivante ; à gauche : la précédente ; reste appuyé : tout s'arrête (temps et voix), relâche : ça reprend ;
   · environ 8 s par story (plus si le texte est long) ;
   · le petit haut-parleur lit la story à voix haute ; la story attend la fin de la phrase avant de passer à la suivante ;
   · elles s'ouvrent toutes seules à la première ouverture de l'appli de la journée. */
const AC = {T: ['#FF3B30', '#FF6A2B', '#FF9F0A'], N: ['#30D158', '#3DDC97', '#0FB9A6'], R: ['#0A84FF', '#5E5CE6', '#64D2FF']};
const acT = (f, d = null) => { try { const v = f(); return v ?? d; } catch (e) { return d; } };
function acList() {
  const L = [], kG = acT(() => lastKey('hrv')) || TODAY, rec = acT(() => recovery(kG)?.score), sl = acT(() => VAL.sleepH(kG)), need = acT(() => sleepGoal(), 9);
  const hrv = acT(() => G(kG, 'hrv')), hb = acT(() => base('hrv', kG, 60)), rhr = acT(() => G(kG, 'rhr')), rb = acT(() => base('rhr', kG, 60));
  const pct = (v, b) => v != null && b ? (v >= b ? '+' : '−') + Math.abs(Math.round((v / b - 1) * 100)) + ' %' : '–';
  // Recovery (bleus)
  if (rec != null) L.push({c: AC.R[0], w: 'RÉCUP', k: 'RECOVERY · CE MATIN', big: Math.round(rec) + '<small> %</small>', t: rec >= 67 ? 'Prêt à envoyer' : rec >= 34 ? 'Corps qui tient la charge' : 'Journée à alléger',
    g: [[hmH(sl), 'sommeil'], [hrv != null ? hrv + ' ms' : '–', 'VFC'], [rhr != null ? rhr + ' bpm' : '–', 'FC repos']],
    say: `Récupération à ${Math.round(rec)} pour cent ce matin. ${rec >= 67 ? 'Tu es prêt à envoyer.' : rec >= 34 ? 'Ton corps tient la charge.' : 'Journée à alléger.'}`});
  if (sl != null) L.push({c: AC.R[1], w: 'NUIT', k: 'SOMMEIL · ' + acT(() => fmtShort(kG).toUpperCase(), ''), big: hmH(sl), t: sl >= need - .3 ? 'Nuit complète' : sl >= need - 1 ? 'Un peu courte' : 'Nuit trop courte',
    g: [[hmH(need), 'ton besoin'], [acT(() => { const s = series('sleepH', 7).map(p => p.v).filter(v => v != null); return s.length ? hmH(mean(s)) : '–'; }, '–'), 'moyenne 7 nuits']],
    say: `Tu as dormi ${Math.floor(sl)} heures ${Math.round(sl % 1 * 60)}. ${sl >= need - .3 ? 'Nuit complète.' : sl >= need - 1 ? 'Un peu court.' : 'C\'est trop court, essaie de te coucher plus tôt ce soir.'}`});
  if (hrv != null) L.push({c: AC.R[2], w: 'VFC', k: 'VARIABILITÉ CARDIAQUE', big: hrv + '<small> ms</small>', t: !hb ? 'Base en calcul' : hrv >= hb.m * .95 ? 'Dans ta zone' : hrv >= hb.m * .85 ? 'Un peu basse' : 'Basse',
    g: [[hb ? Math.round(hb.m) + ' ms' : '–', 'ta base'], [pct(hrv, hb?.m), 'par rapport à ta base'], [rhr != null ? rhr + ' bpm' : '–', 'FC repos' + (rb && rhr != null ? ' (' + (rhr - rb.m > 0 ? '+' : '') + Math.round(rhr - rb.m) + ')' : '')]],
    say: `Ta variabilité cardiaque est à ${hrv} millisecondes. ${!hb ? 'Ta base est encore en calcul.' : hrv >= hb.m * .95 ? 'C\'est dans ta zone.' : 'Elle est un peu basse par rapport à ta base.'}`});
  // Training (rouges, orangés)
  const plan = acT(() => planFor(TODAY)), done = acT(() => logsOn(TODAY).length, 0), eff = acT(() => effortDay(addDays(TODAY, -1)));
  L.push({c: AC.T[0], w: 'SÉANCE', k: 'TRAINING · AUJOURD\'HUI', big: plan ? (done ? '✓' : (plan.kind === 'track' ? 'Sprint' : 'Muscu')) : 'Repos', t: plan ? esc(plan.name || '') : 'Pas de séance prévue',
    g: plan ? [[acT(() => (plan.items || []).length, 0) + '', 'exercices'], [acT(() => estMin(plan) + ' min', '–'), 'durée prévue'], [eff != null ? fx(eff, 1) + ' /21' : '–', 'effort hier']] : [[eff != null ? fx(eff, 1) + ' /21' : '–', 'effort hier']],
    say: plan ? `${done ? 'Séance faite, bien joué.' : 'Aujourd\'hui, ' + (plan.kind === 'track' ? 'séance de sprint' : 'séance de musculation') + ' : ' + (plan.name || '') + '.'}` : 'Pas de séance prévue aujourd\'hui. Profites-en pour récupérer.'});
  const wk = acT(() => { let n = 0, d = 0; for (let i = 0; i < 7; i++) { const k = addDays(TODAY, -i); if (logsOn(k).length) n++; d += effortDay(k) || 0; } return {n, d: d / 7}; });
  if (wk) L.push({c: AC.T[1], w: 'CHARGE', k: 'TRAINING · 7 DERNIERS JOURS', big: wk.n + '<small> séances</small>', t: wk.d >= 14 ? 'Grosse semaine' : wk.d >= 8 ? 'Semaine solide' : 'Semaine légère',
    g: [[fx(wk.d, 1) + ' /21', 'effort moyen'], [acT(() => fx(series('sprintM', 7).reduce((a, p) => a + (p.v || 0), 0)) + ' m', '–'), 'sprint']], say: `Sur les 7 derniers jours : ${wk.n} séances, effort moyen ${fx(wk.d, 1)} sur 21.`});
  // Nutrition (verts)
  const fg = acT(() => fuelGoal(TODAY)), ft = acT(() => dayTotals(TODAY));
  if (fg) L.push({c: AC.N[0], w: 'FUEL', k: 'NUTRITION · AUJOURD\'HUI', big: Math.round(fg.kcal) + '<small> kcal</small>', t: 'Ton objectif du jour',
    g: [[Math.round(fg.p) + ' g', 'protéines'], [Math.round(fg.c) + ' g', 'glucides'], [Math.round(fg.f) + ' g', 'lipides']],
    say: `Objectif du jour : ${Math.round(fg.kcal)} calories, dont ${Math.round(fg.p)} grammes de protéines.${ft?.kcal ? ' Tu en es à ' + Math.round(ft.kcal) + '.' : ''}`});
  const kW = acT(() => lastKey('weight')), wt = kW ? acT(() => W(kW, 'weight')) : null;
  if (wt != null) L.push({c: AC.N[2], w: 'POIDS', k: 'COMPOSITION · ' + acT(() => fmtShort(kW).toUpperCase(), ''), big: fx(wt, 1) + '<small> kg</small>', t: 'Withings',
    g: [[acT(() => fx(W(kW, 'fatPct'), 1) + ' %', '–'), 'masse grasse'], [acT(() => { const s = series('weight', 30).map(p => p.v).filter(v => v != null); return s.length > 1 ? (s.at(-1) - s[0] > 0 ? '+' : '') + fx(s.at(-1) - s[0], 1) + ' kg' : '–'; }, '–'), 'sur 30 jours']],
    say: `Ton poids : ${fx(wt, 1)} kilos.`});
  return L;
}
const ACS = {on: false, i: 0, L: [], t0: 0, left: 0, dur: 0, timer: 0, paused: false, spoke: true, audio: false};
try { ACS.audio = localStorage.getItem('tnr-actus-audio') === '1'; } catch (e) {}
const acIc = {spk: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/></svg>',
  mute: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="m16 9 5 6M21 9l-5 6"/></svg>',
  x: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>'};
function acOpen(i = 0) {
  ACS.L = acList(); if (!ACS.L.length) return;
  let el = document.getElementById('one-st'); if (!el) { el = document.createElement('div'); el.id = 'one-st'; el.className = 'one-st'; document.body.appendChild(el); acBind(el); }
  if (!ACS.on) { ACS.on = true; try { history.pushState({...(history.state || {}), acst: 1}, ''); } catch (e) {} }
  el.hidden = false; requestAnimationFrame(() => el.classList.add('on')); acShow(i); acSeen();
}
function acShow(i) {
  const el = document.getElementById('one-st'); if (!el) return;
  if (i < 0) i = 0; if (i >= ACS.L.length) { acClose(); return; }
  clearTimeout(ACS.timer); try { speechSynthesis.cancel(); } catch (e) {}
  const s = ACS.L[i]; ACS.i = i; ACS.paused = false; el.classList.remove('paused');
  // Durée : environ 8 s, plus si le texte est long (lecture lente) ; avec la voix, la story attend aussi la fin de la phrase.
  ACS.dur = Math.max(7000, Math.min(12000, 5500 + s.say.length * 45)); ACS.left = ACS.dur; ACS.spoke = !ACS.audio;
  el.style.setProperty('--c', s.c); el.style.setProperty('--dur', ACS.dur + 'ms');
  el.innerHTML = `<div class="bars">${ACS.L.map((x, k) => `<i class="${k < i ? 'd' : k === i ? 'c' : ''}" style="--c2:${x.c}"><b></b></i>`).join('')}</div>
    <button class="ax" data-acx aria-label="Fermer">${acIc.x}</button><button class="as${ACS.audio ? ' on' : ''}" data-acs aria-label="${ACS.audio ? 'Couper la voix' : 'Lire à voix haute'}">${ACS.audio ? acIc.spk : acIc.mute}</button>
    <div class="bgw" aria-hidden="true">${s.w}</div><div class="ct"><span class="k">${s.k}</span><div class="big">${s.big}</div><div class="ttl">${s.t}</div>
    <div class="grid">${s.g.map(([b, l]) => `<div><b>${b}</b><span>${l}</span></div>`).join('')}</div><p class="tip">${esc(s.say)}</p></div>`;
  ACS.t0 = performance.now(); ACS.timer = setTimeout(acTick, ACS.left);
  if (ACS.audio) acSpeak(s.say);
  try { if (PREFS.haptic !== false) navigator.vibrate?.(5); } catch (e) {}
}
// Au bout du temps : on passe à la suivante, sauf si la voix n'a pas fini (elle passera à la fin de la phrase).
function acTick() { ACS.left = 0; if (ACS.spoke) acShow(ACS.i + 1); }
function acSpeak(txt) {
  try {
    const u = new SpeechSynthesisUtterance(txt); u.lang = 'fr-FR'; u.rate = .95;
    const v = speechSynthesis.getVoices().find(x => /^fr/i.test(x.lang)); if (v) u.voice = v;
    const i = ACS.i; u.onend = () => { if (ACS.i !== i || !ACS.on) return; ACS.spoke = true; if (ACS.left <= 0 && !ACS.paused) acShow(i + 1); };
    speechSynthesis.speak(u);
  } catch (e) { ACS.spoke = true; }
}
function acPause(on) {
  const el = document.getElementById('one-st'); if (!el || !ACS.on || ACS.paused === on) return;
  ACS.paused = on; el.classList.toggle('paused', on);
  if (on) { clearTimeout(ACS.timer); ACS.left = Math.max(0, ACS.left - (performance.now() - ACS.t0)); try { speechSynthesis.pause(); } catch (e) {} }
  else { ACS.t0 = performance.now(); try { speechSynthesis.resume(); } catch (e) {} if (ACS.left > 0) ACS.timer = setTimeout(acTick, ACS.left); else if (ACS.spoke) acShow(ACS.i + 1); }
}
function acClose(fromBack) {
  const el = document.getElementById('one-st'); if (!el || !ACS.on) return;
  ACS.on = false; clearTimeout(ACS.timer); try { speechSynthesis.cancel(); } catch (e) {}
  el.classList.remove('on'); setTimeout(() => { if (!ACS.on) el.hidden = true; }, 320);
  if (!fromBack && history.state?.acst) { try { POP_SKIP = true; } catch (e) {} history.back(); }
}
function acBind(el) {
  let down = null;
  el.addEventListener('pointerdown', e => { if (e.target.closest('[data-acx],[data-acs]')) return; down = {x: e.clientX, y: e.clientY, t: performance.now(), hold: setTimeout(() => acPause(true), 220)}; });
  el.addEventListener('pointerup', e => {
    if (!down) return; const d = down; down = null; clearTimeout(d.hold);
    if (ACS.paused) { acPause(false); return; }   // on relâche après être resté appuyé : la story reprend
    if (e.clientY - d.y > 90) { acClose(); return; }   // glisser vers le bas : fermer
    acShow(ACS.i + (e.clientX < innerWidth / 3 ? -1 : 1));
  });
  el.addEventListener('pointercancel', () => { if (down) clearTimeout(down.hold); down = null; acPause(false); });
  el.addEventListener('contextmenu', e => e.preventDefault());
  el.addEventListener('click', e => {
    if (e.target.closest('[data-acx]')) { acClose(); return; }
    const s = e.target.closest('[data-acs]'); if (!s) return;
    ACS.audio = !ACS.audio; try { localStorage.setItem('tnr-actus-audio', ACS.audio ? '1' : '0'); } catch (err) {}
    s.classList.toggle('on', ACS.audio); s.innerHTML = ACS.audio ? acIc.spk : acIc.mute;
    if (ACS.audio) { ACS.spoke = false; acSpeak(ACS.L[ACS.i].say); } else { try { speechSynthesis.cancel(); } catch (err) {} ACS.spoke = true; if (ACS.left <= 0) acShow(ACS.i + 1); }
  });
}
addEventListener('popstate', () => { if (ACS.on) acClose(true); }, true);
addEventListener('keydown', e => { if (!ACS.on) return; if (e.key === 'Escape') acClose(); if (e.key === 'ArrowRight') acShow(ACS.i + 1); if (e.key === 'ArrowLeft') acShow(ACS.i - 1); });
// Le carré « Actus » : allumé tant que les actus du jour n'ont pas été vues.
const acSeenToday = () => { try { return localStorage.getItem('tnr-actus-day') === TODAY; } catch (e) { return false; } };
function acSeen() { try { localStorage.setItem('tnr-actus-day', TODAY); } catch (e) {} document.querySelector('.one-act')?.classList.add('seen'); }
document.body.insertAdjacentHTML('beforeend', `<button class="one-sq one-act${acSeenToday() ? ' seen' : ''}" data-acopen aria-label="Actus du jour"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="4"/><path d="M9 9h6M9 12h6M9 15h3"/></svg><span>Actus</span></button>`);
document.addEventListener('click', e => { if (e.target.closest('[data-acopen]')) acOpen(0); });
// Première ouverture de la journée : dès que les données sont là et que l'écran d'ouverture est parti.
(function acAuto(n = 0) {
  if (acSeenToday() || n > 120) return;
  const ready = (S.status === 'ready' || S.status === 'slow') && !document.getElementById('splash') && !window.TNR_SPLASH_ON && S.mod === 'home';
  if (!ready) { setTimeout(() => acAuto(n + 1), 500); return; }
  setTimeout(() => { if (!acSeenToday() && S.mod === 'home' && !S.sheet && !P.stack.length) acOpen(0); }, 600);
})();
