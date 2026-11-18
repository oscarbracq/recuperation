/* ================= TNR · Actus : les nouvelles du jour en stories =================
   Un carré « Actus » en haut à droite de l'Accueil (en face de l'IA). Plein écran, barres de progression, grand chiffre,
   mot géant en fond, et une courte synthèse (2 ou 3 lignes) avec tout ce qui compte. Chaque story garde la couleur de sa
   partie, en nuances, jusqu'en bas de l'écran : Recovery en bleus, Training en rouges et orangés, Nutrition en verts.
   · touche à droite : la suivante ; à gauche : la précédente ; reste appuyé : tout s'arrête (temps et voix), relâche : ça reprend ;
   · le haut-parleur lit toute la story ; allumé, la story repart de zéro et la barre du haut finit pile avec la voix ;
   · elles s'ouvrent toutes seules à la première ouverture de l'appli de la journée. */
const AC = {T: ['#FF3B30', '#FF6A2B', '#FF9F0A'], N: ['#30D158', '#3DDC97', '#0FB9A6'], R: ['#0A84FF', '#5E5CE6', '#64D2FF']};
const acT = (f, d = null) => { try { const v = f(); return v ?? d; } catch (e) { return d; } };
// Pour la voix : « 7 heures 32 », « 5,2 » se lit « 5 virgule 2 », les signes en mots.
const acHm = h => { const m = Math.round(h * 60), H = Math.floor(m / 60), mn = m % 60; return H + (H > 1 ? ' heures' : ' heure') + (mn ? ' ' + mn : ''); };
const acSg = (v, d = 0) => (v > 0 ? '+' : v < 0 ? '−' : '±') + fx(Math.abs(v), d);
const acSay = (v, d = 0) => (v < 0 ? 'moins ' : 'plus ') + fx(Math.abs(v), d);
function acList() {
  const L = [], h = new Date().getHours(), hello = h < 12 ? 'Bonjour' : h < 18 ? 'Salut' : 'Bonsoir';
  const kG = acT(() => lastKey('hrv')) || TODAY, rec = acT(() => recovery(kG)?.score), recY = acT(() => recovery(addDays(kG, -1))?.score);
  const sl = acT(() => VAL.sleepH(kG)), need = acT(() => sleepGoal(), 9);
  const hrv = acT(() => G(kG, 'hrv')), hb = acT(() => base('hrv', kG, 60)), h7 = acT(() => avgN('hrv', 7, kG)), rhr = acT(() => G(kG, 'rhr')), rb = acT(() => base('rhr', kG, 60));
  const pc = (v, b) => v != null && b ? Math.round((v / b - 1) * 100) : null;
  const high = acT(() => highDay(TODAY), true), tg = acT(() => effortTarget(rec, high));
  const first = [];   // la toute première story commence par bonjour
  const hi = s => { if (first.length) return s; first.push(1); return hello + ' ! ' + s; };

  // ---------- Recovery (bleus) ----------
  if (rec != null) {
    const z = zoneOf(rec), dH = pc(hrv, hb?.m), dR = rhr != null && rb ? Math.round(rhr - rb.m) : null;
    L.push({c: AC.R[0], c2: AC.R[1], w: 'RÉCUP', k: 'RECOVERY · CE MATIN', big: rec + '<small> %</small>', t: ZONE[z],
      g: [[hmH(sl), 'sommeil'], [hrv != null ? hrv + ' ms' : '–', 'VFC'], [rhr != null ? rhr + ' bpm' : '–', 'FC repos'], [recY != null ? acSg(rec - recY) + ' pts' : '–', 'vs hier']],
      syn: [ZONE_SUB[z] + '.', [dH != null ? 'VFC ' + acSg(dH) + ' % vs ta base' : '', dR != null ? 'FC repos ' + acSg(dR) + ' bpm' : ''].filter(Boolean).join(' · '), tg ? 'Effort conseillé : ' + tg.lvl[2].toLowerCase() + ' (' + tg.lvl[0] + ' à ' + tg.lvl[1] + ' sur 21)' : ''].filter(Boolean),
      say: hi(`On commence par ta récup : ${rec} pour cent ce matin${recY != null && recY !== rec ? `, ${Math.abs(rec - recY)} points de ${rec > recY ? 'plus' : 'moins'} qu'hier` : ''}. ${ZONE_SUB[z]}. `) +
        (dH != null ? `Ta VFC est à ${acSay(dH)} pour cent de ta base${dR != null ? `, ta fréquence cardiaque au repos à ${acSay(dR)} battements` : ''}. ` : '') + (tg ? tg.text : '')});
  }
  if (sl != null) {
    const n7 = acT(() => series('sleepH', 7, kG).map(p => p.v).filter(v => v != null), []), avg = n7.length ? mean(n7) : null, debt = n7.reduce((s, v) => s + Math.max(0, need - v), 0), gap = sl - need;
    const verdict = gap >= -.3 ? 'Nuit complète' : gap >= -1 ? 'Un peu courte' : 'Nuit trop courte';
    L.push({c: AC.R[1], c2: AC.R[2], w: 'NUIT', k: 'SOMMEIL · ' + acT(() => fmtShort(kG).toUpperCase(), ''), big: hmH(sl), t: verdict,
      g: [[hmH(need), 'ton besoin'], [(gap >= 0 ? '+' : '−') + hmH(Math.abs(gap)), 'écart'], [avg != null ? hmH(avg) : '–', 'moy. 7 nuits'], [debt > .1 ? hmH(debt) : '0 h', 'dette 7 nuits']],
      syn: [verdict + (gap < -.3 ? ' : il te manque ' + hmH(-gap) + '.' : '.'), avg != null ? 'Sur 7 nuits : ' + hmH(avg) + ' en moyenne, dette ' + (debt > .1 ? hmH(debt) : 'nulle') + '.' : '', debt > 1.5 ? 'Rattrape : sieste de 20 min ou coucher plus tôt.' : 'Garde la même heure de coucher.'].filter(Boolean),
      say: hi(`Ta nuit : ${acHm(sl)} de sommeil, pour un besoin de ${acHm(need)}. `) + (gap < -.3 ? `Il te manque ${acHm(-gap)}. ` : 'C\'est une nuit complète. ') +
        (avg != null ? `Sur les sept dernières nuits, tu dors ${acHm(avg)} en moyenne${debt > .1 ? `, avec une dette de ${acHm(debt)}` : ', sans dette'}. ` : '') + (debt > 1.5 ? 'Essaie de rattraper avec une petite sieste ou en te couchant plus tôt.' : 'Garde la même heure de coucher, ça marche.')});
  }
  if (hrv != null) {
    const d = pc(hrv, hb?.m), d7 = pc(h7, hb?.m), dR = rhr != null && rb ? Math.round(rhr - rb.m) : null;
    const tired = hb && h7 && h7 < hb.m * .9 && dR != null && dR >= 3, fresh = hb && h7 && h7 >= hb.m;
    const t = !hb ? 'Base en calcul' : hrv >= hb.m * .95 ? 'Dans ta zone' : hrv >= hb.m * .85 ? 'Un peu basse' : 'Basse';
    L.push({c: AC.R[2], c2: AC.R[0], w: 'VFC', k: 'VARIABILITÉ CARDIAQUE', big: hrv + '<small> ms</small>', t,
      g: [[hb ? Math.round(hb.m) + ' ms' : '–', 'ta base'], [d != null ? acSg(d) + ' %' : '–', 'vs ta base'], [h7 ? Math.round(h7) + ' ms' : '–', 'moy. 7 jours'], [rhr != null ? rhr + ' bpm' : '–', 'FC repos' + (dR != null ? ' (' + acSg(dR) + ')' : '')]],
      syn: [h7 && d7 != null ? 'Moyenne 7 jours : ' + Math.round(h7) + ' ms (' + acSg(d7) + ' %).' : '', tired ? 'VFC basse et cœur plus rapide : la fatigue s\'installe, allège un peu.' : fresh ? 'Tendance au-dessus de ta base : système nerveux frais.' : 'Rien d\'inquiétant, continue comme ça.'].filter(Boolean),
      say: hi(`Ta variabilité cardiaque est à ${hrv} millisecondes. `) + (!hb ? 'Ta base est encore en calcul. ' : `C'est ${acSay(d)} pour cent par rapport à ta base de ${Math.round(hb.m)}. `) +
        (h7 && d7 != null ? `Sur sept jours, tu es à ${Math.round(h7)} en moyenne. ` : '') + (tired ? 'Avec un cœur un peu plus rapide au repos, la fatigue s\'installe : allège un peu.' : fresh ? 'La tendance est au-dessus de ta base, ton système nerveux est frais.' : 'Rien d\'inquiétant, continue comme ça.')});
  }
  // Une douleur notée ces 3 derniers jours : elle compte dans la récup, on la rappelle.
  const pk = acT(() => { for (let i = 0; i < 3; i++) { const k = addDays(TODAY, -i); if ((maxPain(k) ?? 0) > 0) return k; } return null; });
  if (pk) {
    const P = Object.entries(acT(() => pains(pk), {})).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]), [l0, v0] = P[0] || ['', 0];
    let run = 0; for (let i = 0; i < 30; i++) { if ((acT(() => maxPain(addDays(pk, -i))) ?? 0) > 0) run++; else break; }
    L.push({c: AC.R[1], c2: AC.T[0], w: 'DOULEUR', k: 'DOULEURS · ' + acT(() => fmtShort(pk).toUpperCase(), ''), big: v0 + '<small> /10</small>', t: esc(painWords(l0)),
      g: P.slice(0, 3).map(([l, v]) => [v + ' /10', esc(painWords(l))]).concat([[run + (run > 1 ? ' jours' : ' jour'), 'd\'affilée']]).slice(0, 4),
      syn: [P.length > 1 ? P.length + ' zones notées.' : 'Une zone notée.', v0 >= 3 ? 'À 3 sur 10 et plus, ta récup est plafonnée à 33 %. Adapte la séance.' : 'Légère : garde un œil dessus.'],
      say: hi(`Côté douleurs : ${painWords(l0)} à ${v0} sur 10${run > 1 ? `, depuis ${run} jours` : ''}. `) + (P.length > 1 ? `Et ${P.slice(1, 3).map(([l, v]) => painWords(l) + ' à ' + v).join(', ')}. ` : '') + (v0 >= 3 ? 'Tant que c\'est à 3 ou plus, ta récup est plafonnée : adapte la séance.' : 'C\'est léger, garde juste un œil dessus.')});
  }

  // ---------- Training (rouges, orangés) ----------
  const plan = acT(() => planFor(TODAY)), logs = acT(() => logsOn(TODAY), []), eff = acT(() => effortDay(addDays(TODAY, -1)));
  const exs = plan ? acT(() => (plan.items || []).map(it => exOf(it.ex)?.n).filter(Boolean), []) : [], min = plan ? acT(() => estMin(plan)) : null, l0 = logs[0];
  L.push({c: AC.T[0], c2: AC.T[2], w: 'SÉANCE', k: 'TRAINING · AUJOURD\'HUI', big: l0 ? '✓' : plan ? (plan.kind === 'track' ? 'Sprint' : 'Muscu') : 'Repos', t: plan ? esc(plan.name || '') : 'Pas de séance prévue',
    g: plan ? [[exs.length + '', 'exercices'], [min ? min + ' min' : '–', 'durée prévue'], [eff != null ? fx(eff, 1) + ' /21' : '–', 'effort hier'], [tg ? tg.lvl[2] : '–', 'effort conseillé']]
      : [[eff != null ? fx(eff, 1) + ' /21' : '–', 'effort hier'], [tg ? tg.lvl[2] : '–', 'effort conseillé'], [rec != null ? rec + ' %' : '–', 'récup']],
    syn: l0 ? [l0.tonnage ? 'Faite : ' + fx(l0.tonnage) + ' kg soulevés.' : l0.sprintM ? 'Faite : ' + fx(l0.sprintM) + ' m de sprint.' : 'Séance faite.', 'Bien bossé. Pense à manger dans l\'heure.']
      : plan ? [exs.length ? 'Au menu : ' + esc(exs.slice(0, 4).join(', ')) + (exs.length > 4 ? '…' : '.') : '', tg ? tg.text : ''].filter(Boolean)
      : ['Jour sans séance : le corps se construit au repos.', 'Mobilité, marche ou vélo très facile.'],
    say: hi(l0 ? `Séance du jour faite${l0.tonnage ? ` : ${fx(l0.tonnage)} kilos soulevés` : l0.sprintM ? ` : ${fx(l0.sprintM)} mètres de sprint` : ''}. Bien bossé, pense à bien manger dans l'heure.`
      : plan ? `Aujourd'hui, ${plan.kind === 'track' ? 'séance de sprint' : 'séance de muscu'} : ${plan.name || ''}. ${exs.length ? `${exs.length} exercices, dont ${exs.slice(0, 3).join(', ')}. ` : ''}${min ? `Compte environ ${min} minutes. ` : ''}${tg ? tg.text : ''}`
      : `Pas de séance prévue aujourd'hui. Profites-en pour récupérer : mobilité, marche ou vélo tranquille.`)});
  const wk = acT(() => { const f = o => { let n = 0, d = 0, r = 0; for (let i = 0; i < 7; i++) { const k = addDays(TODAY, -i - o), e = effortDay(k) || 0; if (logsOn(k).length) n++; d += e; if (e < 3) r++; } return {n, d: d / 7, r}; }; return {...f(0), prev: f(7).d}; });
  if (wk) {
    const sp = acT(() => series('sprintM', 7).reduce((a, p) => a + (p.v || 0), 0), 0), dv = wk.prev > .5 ? Math.round((wk.d / wk.prev - 1) * 100) : null;
    const t = wk.d >= 14 ? 'Grosse semaine' : wk.d >= 8 ? 'Semaine solide' : 'Semaine légère';
    L.push({c: AC.T[1], c2: AC.T[0], w: 'CHARGE', k: 'TRAINING · 7 DERNIERS JOURS', big: wk.n + `<small> séance${wk.n > 1 ? 's' : ''}</small>`, t,
      g: [[fx(wk.d, 1) + ' /21', 'effort moyen'], [dv != null ? acSg(dv) + ' %' : '–', 'vs semaine d\'avant'], [fx(sp) + ' m', 'sprint'], [wk.r + '', 'jours de repos']],
      syn: [dv != null ? 'Effort ' + acSg(dv) + ' % par rapport à la semaine d\'avant.' : '', dv != null && dv > 15 ? 'Ça monte vite : reste sous +15 % par semaine.' : wk.r < 1 ? 'Aucun vrai jour de repos : prévois-en un.' : 'Progression bien dosée.'].filter(Boolean),
      say: hi(`Ta charge sur sept jours : ${wk.n} séance${wk.n > 1 ? 's' : ''}, un effort moyen de ${fx(wk.d, 1)} sur 21${sp ? `, et ${fx(sp)} mètres de sprint` : ''}. `) +
        (dv != null ? `C'est ${acSay(dv)} pour cent par rapport à la semaine d'avant. ` : '') + (dv != null && dv > 15 ? 'Ça monte vite, essaie de rester sous plus quinze pour cent par semaine.' : wk.r < 1 ? 'Tu n\'as pas eu de vrai jour de repos, pense à en prévoir un.' : 'La progression est bien dosée.')});
  }

  // ---------- Nutrition (verts) ----------
  const fg = acT(() => fuelGoal(TODAY)), ft = acT(() => dayTotals(TODAY), {}), td = acT(() => trainDay(TODAY), high);
  if (fg) {
    const ate = Math.round(ft?.kcal || 0), rest = Math.round(fg.kcal - ate), pr = Math.round(ft?.p || 0);
    L.push({c: AC.N[0], c2: AC.N[2], w: 'FUEL', k: 'NUTRITION · AUJOURD\'HUI', big: fx(Math.round(fg.kcal)) + '<small> kcal</small>', t: td ? 'Jour d\'entraînement' : 'Jour de repos',
      g: [[Math.round(fg.p) + ' g', 'protéines'], [Math.round(fg.c) + ' g', 'glucides'], [Math.round(fg.f) + ' g', 'lipides'], [ate ? fx(ate) + ' kcal' : '0', 'déjà mangé']],
      syn: [td ? 'Objectif plus haut : tu t\'entraînes.' : 'Objectif plus bas : jour de repos.', ate ? 'Reste ' + fx(Math.max(0, rest)) + ' kcal, dont ' + Math.max(0, Math.round(fg.p) - pr) + ' g de protéines.' : 'Rien de noté pour l\'instant.'],
      say: hi(`Côté assiette : objectif ${fx(Math.round(fg.kcal))} calories aujourd'hui, ${td ? 'parce que tu t\'entraînes' : 'c\'est un jour de repos'}. Dont ${Math.round(fg.p)} grammes de protéines, ${Math.round(fg.c)} de glucides et ${Math.round(fg.f)} de lipides. `) +
        (ate ? `Tu en es à ${fx(ate)}, il te reste ${fx(Math.max(0, rest))} calories.` : 'Rien de noté pour l\'instant.')});
  }
  const kW = acT(() => lastKey('weight')), wt = kW ? acT(() => W(kW, 'weight')) : null;
  if (wt != null) {
    const fat = acT(() => W(kW, 'fatPct')), mus = acT(() => W(kW, 'muscleKg'));
    const s30 = acT(() => series('weight', 30).map(p => p.v).filter(v => v != null), []), d30 = s30.length > 1 ? s30.at(-1) - s30[0] : null;
    const w1 = acT(() => avgN('weight', 7)), w0 = acT(() => avgN('weight', 7, addDays(TODAY, -7))), dw = w1 && w0 ? w1 - w0 : null;
    L.push({c: AC.N[2], c2: AC.N[1], w: 'POIDS', k: 'COMPOSITION · ' + acT(() => fmtShort(kW).toUpperCase(), ''), big: fx(wt, 1) + '<small> kg</small>', t: dw == null ? 'Withings' : Math.abs(dw) < .2 ? 'Stable' : dw > 0 ? 'En hausse' : 'En baisse',
      g: [[fat != null ? fx(fat, 1) + ' %' : '–', 'masse grasse'], [mus != null ? fx(mus, 1) + ' kg' : '–', 'muscle'], [dw != null ? acSg(dw, 1) + ' kg' : '–', 'sur 7 jours'], [d30 != null ? acSg(d30, 1) + ' kg' : '–', 'sur 30 jours']],
      syn: [dw != null ? 'Moyenne 7 jours : ' + fx(w1, 1) + ' kg (' + acSg(dw, 1) + ' kg en une semaine).' : '', 'Un seul jour ne veut rien dire : regarde la moyenne.'].filter(Boolean),
      say: hi(`Pour finir, ton poids : ${fx(wt, 1)} kilos${fat != null ? `, avec ${fx(fat, 1)} pour cent de masse grasse` : ''}. `) + (dw != null ? `Ta moyenne sur sept jours est ${Math.abs(dw) < .2 ? 'stable' : `à ${acSay(dw, 1)} kilo en une semaine`}. ` : '') + 'Bonne journée !'});
  }
  return L;
}

/* ---------- le temps de chaque story ---------- */
// Sans la voix : le temps de lire (8 à 14 s). Avec la voix : la barre suit la phrase et finit pile avec elle.
const ACS = {on: false, i: 0, L: [], el0: 0, t0: 0, D: 8000, raf: 0, paused: false, voice: false, ended: true, pEnd: 0, tEnd: 0, audio: false, cps: 14};
try { ACS.audio = localStorage.getItem('tnr-actus-audio') === '1'; ACS.cps = +localStorage.getItem('tnr-actus-cps') || 14; } catch (e) {}
const acReadMs = s => Math.max(8000, Math.min(14000, 4500 + (s.syn.join(' ').length + s.g.length * 14) * 45));
const acIc = {spk: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/></svg>',
  mute: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="m16 9 5 6M21 9l-5 6"/></svg>',
  x: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>'};
function acOpen(i = 0) {
  ACS.L = acList(); if (!ACS.L.length) return;
  let el = document.getElementById('one-st'); if (!el) { el = document.createElement('div'); el.id = 'one-st'; el.className = 'one-st'; document.body.appendChild(el); acBind(el); }
  if (!ACS.on) { ACS.on = true; try { history.pushState({...(history.state || {}), acst: 1}, ''); } catch (e) {} }
  el.hidden = false; el.classList.add('on'); acShow(i); acSeen(); acZoom(el, true);
}
// Comme une story : l'écran sort du carré « Actus » et grandit vers toi ; à la fin, il y retourne en se refermant.
// La story naît du carré « Actus » : un carré arrondi de sa taille qui grandit jusqu'à l'écran entier, puis y retourne.
// Tout passe par transform (fait par la carte graphique), pas par une découpe : c'est fluide même sur téléphone.
function acZoom(el, open, done) {
  const sq = document.querySelector('.one-act'), r = sq?.getBoundingClientRect();
  el.getAnimations({subtree: true}).forEach(a => a.cancel());
  if (!r || !r.width || matchMedia('(prefers-reduced-motion: reduce)').matches) { if (!open) done?.(); return; }
  const W = innerWidth, H = innerHeight, sx = r.width / W, sy = r.height / H, rad = 16;
  const small = {transform: `translate(${r.left}px, ${r.top}px) scale(${sx}, ${sy})`, borderRadius: `${rad / sx}px / ${rad / sy}px`},
    big = {transform: 'translate(0px, 0px) scale(1, 1)', borderRadius: '0px / 0px'};
  el.style.transformOrigin = '0 0'; el.style.willChange = 'transform';
  const dur = open ? 520 : 400, ease = open ? 'cubic-bezier(.32,.72,0,1)' : 'cubic-bezier(.4,0,.6,1)';
  const a = el.animate(open ? [small, big] : [big, small], {duration: dur, easing: ease, fill: open ? 'none' : 'forwards'});
  // Le contenu apparaît une fois le carré ouvert (et disparaît vite à la fermeture) : on ne le voit jamais déformé.
  for (const c of el.children) c.animate(open ? [{opacity: 0}, {opacity: 0, offset: .35}, {opacity: 1}] : [{opacity: 1}, {opacity: 0, offset: .4}, {opacity: 0}], {duration: dur, easing: 'ease-out', fill: open ? 'none' : 'forwards'});
  a.finished.then(() => { el.style.willChange = ''; }).catch(() => {});
  if (!open) { let ok = false; const f = () => { if (ok) return; ok = true; done?.(); }; a.finished.then(f).catch(f); setTimeout(f, dur + 120); }
}
function acShow(i) {
  const el = document.getElementById('one-st'); if (!el) return;
  if (i < 0) i = 0; if (i >= ACS.L.length) { acClose(); return; }
  cancelAnimationFrame(ACS.raf); acHush();
  const s = ACS.L[i]; ACS.i = i; ACS.paused = false; el.classList.remove('paused');
  el.style.setProperty('--c', s.c); el.style.setProperty('--c2', s.c2 || s.c);
  el.innerHTML = `<div class="bars">${ACS.L.map((x, k) => `<i class="${k < i ? 'd' : k === i ? 'c' : ''}"><b></b></i>`).join('')}</div>
    <button class="ax" data-acx aria-label="Fermer">${acIc.x}</button>
    <div class="bgw" aria-hidden="true">${s.w}</div><div class="ct"><span class="k">${s.k}</span><div class="big">${s.big}</div><div class="ttl">${s.t}</div>
    <div class="grid${s.g.length === 4 ? ' g4' : ''}">${s.g.map(([b, l]) => `<div><b>${b}</b><span>${l}</span></div>`).join('')}</div>
    <p class="syn">${s.syn.map(x => /[.!?…]$/.test(x) ? x : x + '.').join(' ')}</p></div>`;
  ACS.audio = false; acRun(false);
  try { if (PREFS.haptic !== false) navigator.vibrate?.(5); } catch (e) {}
}
// Lance (ou relance de zéro) le temps de la story en cours, avec ou sans la voix.
function acRun(voice) {
  const s = ACS.L[ACS.i]; cancelAnimationFrame(ACS.raf);
  ACS.voice = voice; ACS.ended = !voice; ACS.el0 = 0; ACS.t0 = performance.now();
  ACS.D = voice ? acSpeakMs(s.say) : acReadMs(s);
  if (voice) acSpeak(s.say);
  ACS.raf = requestAnimationFrame(acFrame);
}
const acSpeakMs = txt => 400 + txt.length / ACS.cps * 1000;
const acElapsed = () => ACS.el0 + (ACS.paused ? 0 : performance.now() - ACS.t0);
// Où en est la barre (0 à 1). Avec la voix, elle ralentit tout près de la fin si la phrase n'est pas finie,
// puis finit en un instant quand la voix se tait : les deux s'arrêtent ensemble.
function acProg() {
  const t = acElapsed(), D = ACS.D;
  if (!ACS.voice) return t / D;
  if (ACS.ended) return Math.min(1, ACS.pEnd + (1 - ACS.pEnd) * (performance.now() - ACS.tEnd) / 220);
  return t < .92 * D ? t / D : .92 + .07 * (1 - Math.exp(-(t - .92 * D) / (.3 * D)));
}
function acFrame() {
  if (!ACS.on) return;
  const p = acProg(), b = document.querySelector('#one-st .bars .c b'); if (b) b.style.transform = `scaleX(${Math.max(0, Math.min(1, p))})`;
  if (p >= 1 && !ACS.paused) { acShow(ACS.i + 1); return; }
  ACS.raf = requestAnimationFrame(acFrame);
}
// La voix la plus naturelle du téléphone : d'abord les voix « naturelles » ou « améliorées », puis celles de Google,
// puis les voix en ligne ; jamais les voix robotiques de secours.
function acVoice() {
  let V = []; try { V = speechSynthesis.getVoices().filter(v => /^fr\b|^fr[-_]/i.test(v.lang)); } catch (e) {}
  const sc = v => { const n = v.name + ' ' + v.voiceURI; let s = 0;
    if (/natural|neural|premium|enhanced|wavenet|studio|journey|polyglot/i.test(n)) s += 50;
    if (/online|network/i.test(n)) s += 20; if (/google/i.test(n)) s += 15; if (v.localService === false) s += 10; if (/fr[-_]fr/i.test(v.lang)) s += 6;
    if (/denise|vivienne|eloise|amélie|amelie|audrey|aurélie|aurelie|marie|julie/i.test(n)) s += 8;
    if (/compact|espeak|robot/i.test(n)) s -= 40; return s; };
  return V.sort((a, b) => sc(b) - sc(a))[0] || null;
}
try { speechSynthesis.getVoices(); speechSynthesis.addEventListener?.('voiceschanged', () => {}); } catch (e) {}
// La phrase est lue morceau par morceau (une phrase à la fois) : certaines voix s'arrêtent seules au bout de 15 s.
function acSpeak(txt) {
  try {
    const i = ACS.i, parts = txt.match(/[^.!?]+[.!?]*\s*/g) || [txt], v = acVoice(); let t0 = 0;
    parts.forEach((p, k) => {
      const u = new SpeechSynthesisUtterance(p.trim()); u.lang = v?.lang || 'fr-FR'; if (v) u.voice = v; u.rate = 1.02; u.pitch = 1;
      if (k === 0) u.onstart = () => { if (ACS.i !== i || !ACS.voice) return; t0 = performance.now();
        // La voix démarre : la barre se recale sur le vrai départ (le temps d'attente ne compte pas).
        ACS.D = acElapsed() + txt.length / ACS.cps * 1000; };
      if (k === parts.length - 1) u.onend = () => { if (ACS.i !== i || !ACS.on || !ACS.voice || ACS.ended) return;
        if (t0) { const cps = txt.length / ((performance.now() - t0) / 1000); if (cps > 6 && cps < 30) { ACS.cps = ACS.cps * .4 + cps * .6; try { localStorage.setItem('tnr-actus-cps', ACS.cps.toFixed(2)); } catch (e) {} } }
        ACS.pEnd = acProg(); ACS.tEnd = performance.now(); ACS.ended = true; };
      u.onerror = () => { if (ACS.i === i && ACS.voice && !ACS.ended) { ACS.pEnd = acProg(); ACS.tEnd = performance.now(); ACS.ended = true; } };
      speechSynthesis.speak(u);
    });
  } catch (e) { ACS.pEnd = acProg(); ACS.tEnd = performance.now(); ACS.ended = true; }
}
function acHush() { try { speechSynthesis.cancel(); } catch (e) {} }
function acPause(on) {
  const el = document.getElementById('one-st'); if (!el || !ACS.on || ACS.paused === on) return;
  if (on) { ACS.el0 = acElapsed(); ACS.paused = true; if (ACS.ended && ACS.voice) ACS.pEnd = acProg(); try { speechSynthesis.pause(); } catch (e) {} }
  else { ACS.t0 = performance.now(); ACS.paused = false; if (ACS.ended && ACS.voice) ACS.tEnd = performance.now(); try { speechSynthesis.resume(); } catch (e) {} }
  el.classList.toggle('paused', on);
}
function acClose(fromBack) {
  const el = document.getElementById('one-st'); if (!el || !ACS.on) return;
  ACS.on = false; cancelAnimationFrame(ACS.raf); acHush();
  acZoom(el, false, () => { if (ACS.on) return; el.classList.remove('on'); el.hidden = true; el.getAnimations().forEach(a => a.cancel()); });
  if (!fromBack && history.state?.acst) { try { POP_SKIP = true; } catch (e) {} history.back(); }
}
function acBind(el) {
  let down = null;
  // Les gestes dans les actus restent dans les actus (avant, glisser ici changeait aussi d'onglet dans l'appli dessous).
  for (const ev of ['touchstart', 'touchmove', 'touchend']) el.addEventListener(ev, e => e.stopPropagation(), {passive: true});
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
    s.classList.toggle('on', ACS.audio); s.innerHTML = ACS.audio ? acIc.spk : acIc.mute; s.setAttribute('aria-label', ACS.audio ? 'Couper la voix' : 'Lire à voix haute');
    if (ACS.audio) { acHush(); ACS.paused = false; el.classList.remove('paused'); acRun(true); }   // la voix allumée : la story repart de zéro avec elle
    else { const p = acProg(); acHush(); ACS.voice = false; ACS.ended = true; ACS.D = acReadMs(ACS.L[ACS.i]); ACS.el0 = Math.min(.999, p) * ACS.D; ACS.t0 = performance.now(); }
  });
}
addEventListener('popstate', () => { if (ACS.on) acClose(true); }, true);
addEventListener('keydown', e => { if (!ACS.on) return; if (e.key === 'Escape') acClose(); if (e.key === 'ArrowRight') acShow(ACS.i + 1); if (e.key === 'ArrowLeft') acShow(ACS.i - 1); });
// L'appli passe en arrière-plan : les actus se mettent en pause (et la voix se tait).
document.addEventListener('visibilitychange', () => { if (document.hidden && ACS.on) acPause(true); });
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
