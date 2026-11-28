/* ================= Le préparateur mental : une page à part entière (l'entraînement du mental) =================
   D'après les cours de préparation mentale d'Oscar (T. Knaepen, BPJEPS) : dialogue interne et ses 4 dominantes
   (confiance, calme, combativité, concentration), le « switch » en 4 étapes, le tableau de la confiance, les objectifs
   de résultat / performance / processus (Kingston et Hardy 1997), les routines de performance, la respiration
   (cohérence cardiaque à 6 cycles par minute, respiration carrée, respiration dynamisante avant l'effort), l'imagerie
   (modèle PETTLEP, Holmes et Collins 2001), la relaxation progressive (Jacobson).
   Rangé dans settings/app.mprep. Le bilan mental du mois (questionnaire) reste à part, sur l'accueil. */
const MP_DEF = {
  routine: ['Échauffement fini 15 min avant l\'appel', '3 accélérations, la dernière à fond', 'Respiration dynamisante 30 s', 'Mon mot de confiance, 3 fois', 'Imagerie du départ : les 5 premiers appuis', 'Réglage des blocs, toujours dans le même ordre', 'Soupir long, épaules basses : « À vos marques »'],
  words: {conf: ['Je me suis entraîné pour ça'], calm: ['Épaules basses'], comb: ['Explosif, tout de suite'], conc: ['Pousse loin derrière']},
  sw: [['Je n\'ai pas les jambes aujourd\'hui', 'Mes jambes répondent dès le premier appui']], fier: [], deb: []
};
const mpGet = () => ({...MP_DEF, ...(S.app?.mprep || {})});
let MPT = null;
function mpSave(fn, keep) { const m = mpGet(); fn(m); S.app = {...(S.app || {}), mprep: m}; clearTimeout(MPT); const go = () => dbSet('settings/app', {...S.app, updatedAt: new Date().toISOString()}).catch(() => {}); if (keep) MPT = setTimeout(go, 700); else { go(); const y = $('#pane-scroll')?.scrollTop; paneRender(); if (y != null) $('#pane-scroll').scrollTop = y; } }
const MP_DOM = [['conf', 'Confiance'], ['calm', 'Calme'], ['comb', 'Combativité'], ['conc', 'Concentration']];
// Les scripts d'imagerie : à la 1re personne, avec les sensations (PETTLEP), à la vitesse réelle à la fin.
const MP_IMG = {
  depart: ['Le départ dans les blocs', [['Installe-toi assis, yeux fermés. Trois respirations lentes.', 20], ['Tu es dans la chambre d\'appel : tu entends les noms, tu sens tes pointes aux pieds. Tu es calme et prêt.', 25], ['Tu règles tes blocs, toujours dans le même ordre. Tes mains sur la piste, le contact de la ligne.', 25], ['« À vos marques » : épaules juste au-dessus de la ligne, regard au sol. « Prêt » : hanches montent, tout le corps est chargé.', 25], ['Le coup de feu : tu pousses fort sur les deux blocs, le bras part vite, le premier appui tombe sous toi.', 20], ['Cinq appuis bas et puissants : tu pousses le sol loin derrière toi, le buste se relève petit à petit.', 25], ['Revois-le une dernière fois à vitesse réelle, du « prêt » au 10e mètre. Ouvre les yeux.', 20]]],
  course: ['Mon 60 m parfait', [['Yeux fermés, trois respirations lentes. Tu es dans ton couloir.', 20], ['Le départ : puissance, pied sous la hanche, tu restes penché.', 20], ['L\'accélération : chaque appui pousse un peu plus vite, le corps se redresse tout seul.', 25], ['La vitesse max : relâché, visage mou, genoux devant, les pieds griffent le sol.', 25], ['Les derniers mètres : tu gardes ta fréquence, tu cours au-delà de la ligne.', 20], ['Tu vois ton chrono : celui de ton objectif. Ressens la fierté.', 20]]],
  appel: ['Gérer la chambre d\'appel', [['Yeux fermés, respiration lente : inspire 5 s, expire 5 s.', 25], ['Tu arrives en chambre d\'appel. Les autres sautent, parlent fort. Toi, tu restes dans ta bulle.', 25], ['Une pensée négative arrive (« ils sont plus forts »). Ton stop : un geste, et tu dis ton mot de confiance.', 25], ['Tu fais ta routine, étape par étape, comme à l\'entraînement.', 25], ['Tu marches vers ta ligne, calme et chargé. Tu es prêt.', 20]]]
};
let MPV = null;
function mpOpen() { MPV = null; openPane({title: 'Préparateur mental', full: true, render: mpRender, onClose: () => { mpStop(); MPV = null; }}); }
function mpRender() {
  if (MPV?.k === 'breath') return mpBreathHtml();
  if (MPV?.k === 'img') return mpImgHtml();
  const m = mpGet(), mn = S.app?.mental || {}, last = Object.keys(mn).sort().at(-1), lr = last ? mn[last] : null;
  const tile = (a, t, s) => `<button type="button" class="mp-tile" ${a}><b>${t}</b><span>${s}</span></button>`;
  const editL = (key, L, ph) => `${L.map((x, i) => `<div class="mp-li"><input class="mini-in" data-mpin="${key}.${i}" value="${esc(x)}"><button type="button" class="cap-x" data-mpdel="${key}.${i}" aria-label="Retirer">×</button></div>`).join('')}<button type="button" class="cap-add" data-mpadd="${key}">+ ${ph}</button>`;
  const today = m.fier.find(x => x.d === TODAY) || {};
  return `<div class="mp">
    <button type="button" class="card mp-bil" data-one-mental><span class="eyebrow">Bilan mental du mois</span>${lr ? `<b class="num">${lr.note}<small>/100</small></b><span>${esc(mnLvl(lr.note)[0])} · ${esc(moName(last))}</span>` : '<b>À faire</b><span>38 questions, une note et ta conclusion</span>'}${mnDone() ? '' : '<em>à faire ce mois-ci</em>'}</button>
    <div class="sec-label">Respirer</div>
    <div class="mp-grid">${tile('data-mpbr="coh"', 'Cohérence cardiaque', '5 min · 6 respirations par minute · calme et récup')}${tile('data-mpbr="car"', 'Respiration carrée', '3 min · 4 s inspire, bloque, expire, bloque')}${tile('data-mpbr="dyn"', 'Respiration dynamisante', '30 s · 1 par seconde · juste avant l\'effort')}${tile('data-mpbr="sigh"', 'Soupir long', '1 min · 2 inspirations, 1 longue expiration')}</div>
    <div class="sec-label">Imagerie</div>
    <div class="mp-grid">${Object.entries(MP_IMG).map(([k, [t, L]]) => tile(`data-mpimg="${k}"`, t, `${Math.max(1, Math.round(L.reduce((a, x) => a + x[1], 0) / 60))} min · guidée, avec la voix`)).join('')}</div>
    <div class="sec-label">Ma routine d'avant-course <small>la même à chaque fois</small></div>
    <div class="mp-box">${editL('routine', m.routine, 'Ajouter une étape')}</div>
    <div class="sec-label">Mes mots-clés <small>dialogue interne · préparés à l'avance</small></div>
    <div class="mp-box">${MP_DOM.map(([k, l]) => `<p class="mp-dom">${l}</p>${editL('words.' + k, m.words[k] || [], 'Un mot de ' + l.toLowerCase())}`).join('')}</div>
    <div class="sec-label">Mes switchs <small>pensée qui freine → phrase qui pousse</small></div>
    <div class="mp-box">${m.sw.map(([a, b], i) => `<div class="mp-sw"><input class="mini-in" data-mpin="sw.${i}.0" value="${esc(a)}" placeholder="La pensée qui freine"><span>→</span><input class="mini-in" data-mpin="sw.${i}.1" value="${esc(b)}" placeholder="Ce que je me dis à la place"><button type="button" class="cap-x" data-mpdel="sw.${i}" aria-label="Retirer">×</button></div>`).join('')}<button type="button" class="cap-add" data-mpadd="sw">+ Un switch</button>
      <p class="small muted" data-tip="1">1) repère la pensée ; 2) ton stop (un mot, un geste) ; 3) la phrase positive, sans « ne… pas » ; 4) teste-la en séance et ajuste.</p></div>
    <div class="sec-label">Le tableau de la confiance <small>chaque soir, 1 minute</small></div>
    <div class="mp-box"><label class="cap-f">Ce dont je suis fier aujourd'hui<textarea class="mini-in" rows="2" data-mpfier="t">${esc(today.t || '')}</textarea></label><label class="cap-f">Mon objectif pour demain<textarea class="mini-in" rows="2" data-mpfier="o">${esc(today.o || '')}</textarea></label>
      ${m.fier.filter(x => x.d !== TODAY).slice(-5).reverse().map(x => `<p class="mp-hist"><b>${esc(fmtShort(x.d))}</b> ${esc(x.t || '')}${x.o ? `<small>→ ${esc(x.o)}</small>` : ''}</p>`).join('')}</div>
    <div class="sec-label">Après une course</div>
    <div class="mp-box"><label class="cap-f">Course<input class="mini-in" data-mpdeb="ev" placeholder="Ex. Liévin, 60 m, 7&quot;58"></label><label class="cap-f">Ce qui a marché<textarea class="mini-in" rows="2" data-mpdeb="ok"></textarea></label><label class="cap-f">Ce que je change<textarea class="mini-in" rows="2" data-mpdeb="ch"></textarea></label><label class="cap-f">Mon mot pour la prochaine<input class="mini-in" data-mpdeb="mot"></label>
      <button type="button" class="btn" data-mpdebsave style="width:100%;margin-top:8px">Garder ce débrief</button>
      ${m.deb.slice(-4).reverse().map(x => `<p class="mp-hist"><b>${esc(fmtShort(x.d))} · ${esc(x.ev || '')}</b> ${esc(x.ok || '')}${x.ch ? `<small>À changer : ${esc(x.ch)}${x.mot ? ' · mot : « ' + esc(x.mot) + ' »' : ''}</small>` : ''}</p>`).join('')}</div>
    <p class="small muted" data-tip="1" style="margin:18px 4px 0">La préparation mentale s'entraîne comme le reste : 10 min par jour valent mieux qu'une heure la veille. Si le stress ou l'humeur pèsent longtemps, parles-en à un psychologue du sport.</p></div>`;
}
/* ---------- la respiration guidée : un cercle qui gonfle et dégonfle, le temps qui reste ---------- */
const MP_BR = {coh: ['Cohérence cardiaque', [['Inspire', 5], ['Expire', 5]], 300], car: ['Respiration carrée', [['Inspire', 4], ['Bloque', 4], ['Expire', 4], ['Bloque', 4]], 180], dyn: ['Respiration dynamisante', [['Inspire', .5], ['Expire', .5]], 30], sigh: ['Soupir long', [['Inspire', 2], ['Encore un peu', 1], ['Expire longtemps', 6]], 60]};
function mpBreathHtml() { const [t] = MP_BR[MPV.id]; return `<div class="mp-run"><button type="button" class="chip" data-mpback>‹ Retour</button><h2>${t}</h2><div class="mp-circle"><i></i><b data-mpph>Prêt</b></div><p class="mp-left num" data-mpleft></p><button type="button" class="btn" data-mpgo>${MPV.on ? 'Arrêter' : 'Commencer'}</button></div>`; }
function mpStop() { clearTimeout(MPV?.tm); cancelAnimationFrame(MPV?.raf); try { speechSynthesis.cancel(); } catch (e) {} if (MPV) MPV.on = false; }
function mpBreathRun() {
  const [, P, dur] = MP_BR[MPV.id], t0 = performance.now(), cyc = P.reduce((a, x) => a + x[1], 0);
  const loop = now => { if (!MPV?.on) return; const t = (now - t0) / 1000, left = dur - t, c = $('.mp-circle i'), ph = $('[data-mpph]'), lf = $('[data-mpleft]');
    if (left <= 0) { mpStop(); if (ph) ph.textContent = 'Terminé'; if (c) c.style.transform = 'scale(.55)'; const b = $('[data-mpgo]'); if (b) b.textContent = 'Recommencer'; try { oneHap(20); } catch (e) {} return; }
    let x = t % cyc, i = 0; while (x >= P[i][1]) { x -= P[i][1]; i++; } const k = x / P[i][1], nm = P[i][0];
    const s = /Inspire|Encore/.test(nm) ? .55 + .45 * (nm === 'Encore un peu' ? 1 : k) : /Expire/.test(nm) ? 1 - .45 * k : (i === 1 ? 1 : .55);
    if (c) c.style.transform = `scale(${s.toFixed(3)})`; if (ph && ph.textContent !== nm) { ph.textContent = nm; if (MPV.id !== 'dyn') try { navigator.vibrate?.(15); } catch (e) {} }
    if (lf) lf.textContent = `${Math.floor(left / 60)}:${String(Math.floor(left % 60)).padStart(2, '0')}`; MPV.raf = requestAnimationFrame(loop); };
  MPV.raf = requestAnimationFrame(loop);
}
/* ---------- l'imagerie guidée : une étape à la fois, lue à voix haute ---------- */
function mpImgHtml() { const [t, L] = MP_IMG[MPV.id], i = MPV.i || 0;
  return `<div class="mp-run"><button type="button" class="chip" data-mpback>‹ Retour</button><h2>${t}</h2><div class="mn-prog">${L.map((_, j) => `<i class="${j < i ? 'ok' : j === i && MPV.on ? 'on' : ''}"></i>`).join('')}</div>
    <p class="mp-step">${esc(MPV.on || i ? L[Math.min(i, L.length - 1)][0] : 'Assieds-toi au calme. Le téléphone lit chaque étape ; garde les yeux fermés et vis la scène avec tes sensations.')}</p>
    <button type="button" class="btn" data-mpgo>${MPV.on ? 'Arrêter' : i >= L.length ? 'Recommencer' : 'Commencer'}</button></div>`; }
function mpImgStep() { const L = MP_IMG[MPV.id][1]; if (!MPV.on) return; if (MPV.i >= L.length) { mpStop(); paneRender(); return; }
  paneRender(); try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(L[MPV.i][0]); u.lang = 'fr-FR'; u.rate = .9; speechSynthesis.speak(u); } catch (e) {}
  MPV.tm = setTimeout(() => { MPV.i++; mpImgStep(); }, L[MPV.i][1] * 1000); }
document.addEventListener('click', e => { let b; const at = q => (b = e.target.closest?.(q));
  if (at('[data-mpopen]')) { mpOpen(); return; }
  if (at('[data-mpbr]')) { MPV = {k: 'breath', id: b.dataset.mpbr, on: false}; paneRender(); $('#pane-scroll')?.scrollTo(0, 0); return; }
  if (at('[data-mpimg]')) { MPV = {k: 'img', id: b.dataset.mpimg, on: false, i: 0}; paneRender(); $('#pane-scroll')?.scrollTo(0, 0); return; }
  if (at('[data-mpback]')) { mpStop(); MPV = null; paneRender(); return; }
  if (at('[data-mpgo]')) { if (MPV.on) { mpStop(); paneRender(); return; } MPV.on = true; if (MPV.k === 'breath') { paneRender(); mpBreathRun(); } else { MPV.i = MPV.i >= MP_IMG[MPV.id][1].length ? 0 : MPV.i || 0; mpImgStep(); } return; }
  if (at('[data-mpadd]')) { const k = b.dataset.mpadd; mpSave(m => { if (k === 'sw') m.sw = [...m.sw, ['', '']]; else if (k.startsWith('words.')) { const d = k.slice(6); m.words = {...m.words, [d]: [...(m.words[d] || []), '']}; } else m[k] = [...m[k], '']; }); return; }
  if (at('[data-mpdel]')) { const [k, a, i] = b.dataset.mpdel.split('.'); mpSave(m => { if (k === 'words') { m.words = {...m.words, [a]: m.words[a].filter((_, j) => j !== +i)}; } else m[k] = m[k].filter((_, j) => j !== +a); }); return; }
  if (at('[data-mpdebsave]')) { const v = q => $(`[data-mpdeb="${q}"]`)?.value.trim() || ''; if (!v('ok') && !v('ch')) { toast('Écris au moins ce qui a marché'); return; } mpSave(m => { m.deb = [...m.deb, {d: TODAY, ev: v('ev'), ok: v('ok'), ch: v('ch'), mot: v('mot')}]; }); toast('Débrief gardé'); return; }
});
document.addEventListener('input', e => { const t = e.target;
  if (t.matches?.('[data-mpin]')) { const p = t.dataset.mpin.split('.'); mpSave(m => { if (p[0] === 'words') { const L = [...(m.words[p[1]] || [])]; L[+p[2]] = t.value; m.words = {...m.words, [p[1]]: L}; } else if (p[0] === 'sw') { m.sw = m.sw.map((x, i) => i === +p[1] ? (p[2] === '0' ? [t.value, x[1]] : [x[0], t.value]) : x); } else { const L = [...m[p[0]]]; L[+p[1]] = t.value; m[p[0]] = L; } }, true); return; }
  if (t.matches?.('[data-mpfier]')) { mpSave(m => { const o = {...(m.fier.find(x => x.d === TODAY) || {d: TODAY}), [t.dataset.mpfier]: t.value}; m.fier = [...m.fier.filter(x => x.d !== TODAY), o].slice(-60); }, true); }
});
// Le bilan mental mène au préparateur : un bouton sous l'introduction et sous la conclusion.
const mnRender0 = mnRender;
mnRender = function () { const h = mnRender0(); return MN.on ? h : h + '<button type="button" class="btn ghost mp-link" data-mpopen>Ouvrir le préparateur mental</button>'; };
