/* ================= Vidéos · v195 : l'angle, la personne entourée, la fiabilité, la barre et la force =================
   · Avant l'analyse : Profil, Face ou Téléphone libre (la vidéo reste rangée au même endroit), et « Entourer la personne » :
     Oscar trace un cadre sur lui ; le bonhomme part de là et le suit (plus jamais un autre athlète).
   · Seule la partie exploitable est mesurée : images où le corps est entier et bien vu. Si elle est trop courte ou trop
     mauvaise, l'appli le dit (« Vidéo pas assez fiable ») avec les raisons et quoi changer, et n'ajoute aucun point.
   · Haltérophilie (de profil) : le trajet de la barre (milieu des poignets) et la flèche de la force (direction de la
     force sur la barre, longueur = intensité, du vert au rouge), à montrer ou cacher. F = m (a + g).
   · Musculation : les points forts et faibles sont rangés exercice par exercice (un curl n'est pas un mollet). */
const OLY = ['clean', 'snatch', 'jerk', 'pull'];
LIFT_EX.splice(LIFT_EX.findIndex(x => x[0] === 'clean'), 1, ['clean', 'Épaulé'], ['snatch', 'Arraché'], ['jerk', 'Jeté'], ['pull', 'Tirage (haltérophilie)']);
const CAM = [['side', 'Profil'], ['front', 'Face'], ['free', 'Téléphone libre']];
const vCam = v => v.cam || (v.view === 'front' ? 'front' : 'side');

/* ---------- 1) la partie exploitable et la fiabilité ---------- */
const AN_KEYJ = [11, 12, 23, 24, 25, 26, 27, 28];
function anaUsable(v, Q) {
  const n = Q.F.length; if (!n) return null;
  const good = Q.F.map(f => { const p = f.p; if (!p) return false; const vis = AN_KEYJ.reduce((a, j) => a + (p[j]?.[2] || 0), 0) / AN_KEYJ.length;
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; for (const j of AN_KEYJ) { x0 = Math.min(x0, p[j][0]); x1 = Math.max(x1, p[j][0]); y0 = Math.min(y0, p[j][1]); y1 = Math.max(y1, p[j][1]); }
    const inside = x0 > .01 * Q.W && x1 < .99 * Q.W && y1 < .995 * Q.H; return vis >= .5 && inside; });
  // Les morceaux exploitables (on bouche les trous d'une ou deux images) ; on garde ceux d'au moins 0,4 s.
  for (let i = 1; i < n - 1; i++) if (!good[i] && good[i - 1] && (good[i + 1] || good[i + 2])) good[i] = true;
  const segs = []; for (let i = 0; i < n; i++) if (good[i]) { let j = i; while (j + 1 < n && good[j + 1]) j++; segs.push([i, j]); i = j; }
  const dt = Q.step, keep = segs.filter(([a, b]) => (b - a + 1) * dt >= .4), useT = keep.reduce((s, [a, b]) => s + (b - a + 1) * dt, 0), allT = n * dt;
  const F = Q.F.map((f, i) => keep.some(([a, b]) => i >= a && i <= b) ? f : {...f, p: null, w: null});
  return {Q: {...Q, F}, useT, allT, segs: keep.length, vis: Q.F.filter(f => f.p).length / n};
}
function anaRely(v, Q, A, U) {
  const why = [], tips = [], cam = vCam(v), kind = vKind(v), slow = +v.slow || 1, fps = (+v.fps || 30) * 1;
  if (U) { if (U.useT / slow < (kind === 'run' ? .6 : 1)) { why.push(`le corps n'est entier et bien visible que ${fx(U.useT / slow, 1)} s sur ${fx(U.allT / slow, 1)} s`); tips.push('tout le corps dans l\'image du début à la fin, de la tête aux pieds'); }
    if (U.vis < .5) { why.push('la personne n\'est trouvée que sur ' + Math.round(U.vis * 100) + ' % des images'); tips.push('une seule personne bien visible, ou entoure-toi avant l\'analyse'); } }
  if (kind === 'run' && cam === 'front') { why.push('de face, les angles de course (tronc, tibia, pied sous la hanche) ne se mesurent pas'); tips.push('filme de profil, à 5 à 10 m'); }
  if (kind === 'run' && A.kind === 'run' && (A.steps?.length || 0) < 3) { why.push(`${A.steps?.length || 0} appui${(A.steps?.length || 0) > 1 ? 's' : ''} exploitable${(A.steps?.length || 0) > 1 ? 's' : ''} seulement (il en faut 3)`); tips.push('filme plus de foulées, ou plus loin pour en voir davantage'); }
  if (kind === 'run' && fps / slow < 50 && fps < 100) tips.push('filme au ralenti (120 ou 240 images/s) pour des temps de contact justes');
  if (A.view?.q === 'biais') { why.push('filmé de biais (épaules vues de trois quarts) : les angles sont faussés'); tips.push('caméra perpendiculaire à la course, à hauteur de hanche'); }
  if (cam === 'free') tips.push('téléphone libre : les distances (longueur de pas, vitesse) ne sont pas mesurées, seuls les angles et les temps le sont');
  if (A.err && !A.rows?.length) why.push(A.err.replace(/\.$/, ''));
  const ok = !why.length || (why.length === 1 && A.view?.q === 'biais' && (A.rows || []).length >= 4 && cam !== 'front');
  const out = {...A, rel: {ok, why, tips: [...new Set(tips)], useT: U ? +(U.useT / slow).toFixed(2) : null, allT: U ? +(U.allT / slow).toFixed(2) : null}};
  if (cam === 'free' && out.key) { out.key = {...out.key, len: null, spd: null}; }
  if (cam === 'free') out.view = {...(out.view || {}), q: 'biais'}; // téléphone libre : chaque angle passe en « à vérifier »
  return out;
}
const anaResHtml0 = anaResHtml;
anaResHtml = function (v) {
  const R = v.an?.rel, cut = R && R.useT != null && R.allT && R.useT < R.allT - .2 ? `<p class="small muted" data-tip="1" style="margin:8px 4px 0">Mesuré sur la partie exploitable seulement : ${fx(R.useT, 1)} s sur ${fx(R.allT, 1)} s.</p>` : '';
  if (R && !R.ok) return `<div class="card anrel"><span class="eyebrow">Vidéo pas assez fiable</span><p>Aucun point fort ni faible n'est ajouté avec cette vidéo.</p>
    <p class="anrel-h">Pourquoi</p><ul>${R.why.map(x => `<li>${esc(x.charAt(0).toUpperCase() + x.slice(1))}.</li>`).join('')}</ul>
    ${R.tips.length ? `<p class="anrel-h">La prochaine fois</p><ul>${R.tips.map(x => `<li>${esc(x.charAt(0).toUpperCase() + x.slice(1))}.</li>`).join('')}</ul>` : ''}</div>`;
  const h = anaResHtml0(v); return R?.tips?.length ? h + cut + `<p class="small muted" data-tip="1" style="margin:6px 4px 0">Pour plus de précision : ${esc(R.tips.join(' ; '))}.</p>` : h + cut;
};

/* ---------- 2) l'angle, entourer la personne, supprimer ---------- */
const anaSection0 = anaSection;
anaSection = function (v) {
  const cam = vCam(v), lift = vKind(v) === 'lift', oly = lift && OLY.includes(v.ex);
  let h = anaSection0(v);
  // L'ancien choix « Filmé de côté / de face » de la musculation est remplacé par l'angle commun.
  h = h.replace(/<label class="cap-f">Filmé<select[\s\S]*?<\/select><\/label>/, '');
  const head = `<div class="sec-label">Comment tu as filmé</div><div class="seg vcam" role="group">${CAM.map(([k, l]) => `<button type="button" data-vcam="${k}" aria-pressed="${cam === k}">${l}</button>`).join('')}</div>
    <div class="btnrow two" style="margin-top:10px"><button type="button" class="btn ghost" data-vbox>${v.box ? 'Personne entourée ✓' : 'Entourer la personne'}</button>${v.box ? '<button type="button" class="btn ghost" data-vboxx>Enlever le cadre</button>' : '<span></span>'}</div>
    <p class="small muted" data-tip="1" style="margin:6px 4px 0">${v.box ? 'Le bonhomme part de la personne entourée et la suit jusqu\'au bout.' : 'Mets la vidéo sur une image où tu es bien visible, touche « Entourer la personne » et trace un cadre sur toi.'}</p>`;
  const bar = lift ? `<div class="sec-label">Sur la vidéo</div><div class="btnrow two"><button type="button" class="btn ghost" data-vbar="path" aria-pressed="${!!ANA.showPath}">${ANA.showPath ? '✓ ' : ''}Trajet de la barre</button><button type="button" class="btn ghost" data-vbar="force" aria-pressed="${!!ANA.showForce}">${ANA.showForce ? '✓ ' : ''}Force</button></div>
    ${cam !== 'side' ? '<p class="small muted" data-tip="1" style="margin:6px 4px 0">La barre et la force ne se lisent que de profil.</p>' : ''}<label class="cap-f" style="margin-top:8px">Charge sur la barre (kg)<input class="mini-in" inputmode="decimal" data-vkg value="${esc(v.kg ?? '')}" placeholder="Ex. 80 : la force s'affiche en newtons"></label>` : '';
  return h.replace('<div class="sec-label">Analyse du corps</div>', '<div class="sec-label">Analyse du corps</div>' + head) .replace('<div data-anares>', bar + '<div data-anares>')
    + `<button type="button" class="btn ghost vdel2" data-vdel>Supprimer cette vidéo</button><p class="small muted" data-tip="1" style="margin:4px 4px 0">Ses points forts et faibles disparaissent avec elle.</p>`;
};
// Le cadre : on le trace au doigt sur l'image affichée (coordonnées rangées en fraction de la vidéo).
function vBoxMode(on) { const box = document.querySelector('.vbox'), el = box?.querySelector('[data-vvid]'); if (!box || !el) return; el.pause?.();
  let ov = box.querySelector('.vboxov'); if (!on) { ov?.remove(); return; }
  if (!ov) { ov = document.createElement('div'); ov.className = 'vboxov'; ov.innerHTML = '<i></i><span>Trace un cadre autour de toi</span>'; box.appendChild(ov); }
  const r0 = () => { const a = el.videoWidth / el.videoHeight, ew = el.clientWidth, eh = el.clientHeight, w = ew / eh > a ? eh * a : ew, h = ew / eh > a ? eh : ew / a; return {ox: el.offsetLeft + (ew - w) / 2, oy: el.offsetTop + (eh - h) / 2, w, h}; };
  let st = null; const rect = ov.querySelector('i'), pos = e => { const b = box.getBoundingClientRect(); return [e.clientX - b.left, e.clientY - b.top]; };
  ov.onpointerdown = e => { e.preventDefault(); ov.setPointerCapture(e.pointerId); st = pos(e); rect.style.cssText = `left:${st[0]}px;top:${st[1]}px;width:0;height:0;display:block`; };
  ov.onpointermove = e => { if (!st) return; const p = pos(e); rect.style.left = Math.min(st[0], p[0]) + 'px'; rect.style.top = Math.min(st[1], p[1]) + 'px'; rect.style.width = Math.abs(p[0] - st[0]) + 'px'; rect.style.height = Math.abs(p[1] - st[1]) + 'px'; };
  ov.onpointerup = e => { if (!st) return; const p = pos(e), g = r0(), c = (x, a, l) => Math.max(0, Math.min(1, (x - a) / l));
    const b = {t: el.currentTime, x0: c(Math.min(st[0], p[0]), g.ox, g.w), x1: c(Math.max(st[0], p[0]), g.ox, g.w), y0: c(Math.min(st[1], p[1]), g.oy, g.h), y1: c(Math.max(st[1], p[1]), g.oy, g.h)}; st = null;
    if (b.x1 - b.x0 < .03 || b.y1 - b.y0 < .05) { toast('Cadre trop petit : recommence'); rect.style.display = 'none'; return; }
    vidUp(VP.id, x => ({...x, box: b}), true); vBoxMode(false); toast('Personne choisie : lance l\'analyse'); const y = $('#pane-scroll')?.scrollTop; paneRender(); if (y != null) $('#pane-scroll').scrollTop = y; };
}
document.addEventListener('click', e => { if (!VP.id) return; let b; const at = q => (b = e.target.closest?.(q));
  if (at('[data-vcam]')) { const c = b.dataset.vcam; vidUp(VP.id, x => ({...x, cam: c, view: c === 'front' ? 'front' : 'side'}), true); document.querySelectorAll('[data-vcam]').forEach(x => x.setAttribute('aria-pressed', x === b)); return; }
  if (at('[data-vbox]')) { vBoxMode(true); document.querySelector('.vbox')?.scrollIntoView({behavior: 'smooth', block: 'center'}); return; }
  if (at('[data-vboxx]')) { vidUp(VP.id, x => { const y = {...x}; delete y.box; return y; }, true); const s = $('#pane-scroll')?.scrollTop; paneRender(); if (s != null) $('#pane-scroll').scrollTop = s; return; }
  if (at('[data-vbar]')) { const k = b.dataset.vbar; if (k === 'path') ANA.showPath = !ANA.showPath; else ANA.showForce = !ANA.showForce; b.setAttribute('aria-pressed', k === 'path' ? !!ANA.showPath : !!ANA.showForce); b.textContent = (b.getAttribute('aria-pressed') === 'true' ? '✓ ' : '') + (k === 'path' ? 'Trajet de la barre' : 'Force'); ANA.redraw?.(); return; }
});
document.addEventListener('input', e => { if (!VP.id || !e.target.matches?.('[data-vkg]')) return; const k = parseFloat(String(e.target.value).replace(',', '.')); vidUp(VP.id, x => ({...x, kg: k > 0 ? k : null})); ANA.redraw?.(); });

/* ---------- 3) haltérophilie : la barre, sa vitesse, la force ---------- */
// La barre = le milieu des poignets (elle est dans les mains) ; lissée sur 5 images. Échelle : la jambe ≈ 0,49 × la taille.
function anaBar(P, slow = 1) {
  if (!P?.F?.length) return null; const F = P.F.filter(f => f.p), pts = F.map(f => { const a = f.p[15], b = f.p[16], va = a[2] > .3, vb = b[2] > .3;
    return {t: f.t, x: va && vb ? (a[0] + b[0]) / 2 : va ? a[0] : b[0], y: va && vb ? (a[1] + b[1]) / 2 : va ? a[1] : b[1], leg: Math.max(anDist(f.p[23], f.p[27]), anDist(f.p[24], f.p[28]))}; });
  if (pts.length < 6) return null;
  const sm = pts.map((p, i) => { const L = pts.slice(Math.max(0, i - 2), i + 3); return {...p, x: L.reduce((a, q) => a + q.x, 0) / L.length, y: L.reduce((a, q) => a + q.y, 0) / L.length}; });
  const ppm = anMed(pts.map(p => p.leg)) / (.49 * anH());
  for (let i = 1; i < sm.length - 1; i++) { const a = sm[i - 1], b = sm[i + 1], dt = (b.t - a.t) / slow || 1e-3; sm[i].vx = (b.x - a.x) / dt / ppm; sm[i].vy = -(b.y - a.y) / dt / ppm; }
  for (let i = 2; i < sm.length - 2; i++) { const a = sm[i - 1], b = sm[i + 1], dt = (b.t - a.t) / slow || 1e-3; if (a.vx == null || b.vx == null) continue; sm[i].ax = (b.vx - a.vx) / dt; sm[i].ay = (b.vy - a.vy) / dt; }
  return {pts: sm, ppm};
}
const anaLift0 = anaLift;
anaLift = function (v, P) {
  const oly = OLY.includes(v.ex), A = anaLift0(oly && v.ex !== 'clean' ? {...v, ex: 'clean'} : v, P); if (!oly) return A;
  const B = anaBar(P, +v.slow || 1); if (!B || vCam(v) !== 'side') return {...A, ex: v.ex};
  const L = B.pts, x0 = L[0].x, dev = Math.max(...L.map(p => Math.abs(p.x - x0))) / B.ppm * 100, vmax = Math.max(...L.map(p => p.vy || 0)), hmax = (L[0].y - Math.min(...L.map(p => p.y))) / B.ppm;
  const R = [...(A.rows || [])];
  R.push(anRow('bardev', 'Trajet de la barre', dev, `s'écarte de ${Math.round(dev)} cm de sa ligne de départ`, anLv(dev, 10, 16), 'proche de la verticale : 10 cm d\'écart au plus'));
  if (vmax > 0) R.push(anRow('vbar', 'Vitesse max de la barre', vmax, fx(vmax, 2) + ' m/s', v.ex === 'snatch' ? anLv(vmax, 1.8, 1.5, true) : anLv(vmax, 1.5, 1.25, true), v.ex === 'snatch' ? '1,8 à 2,1 m/s à l\'arraché' : '1,5 à 1,8 m/s à l\'épaulé'));
  if (hmax > 0) R.push(anRow('hbar', 'Hauteur de la barre au plus haut', hmax, fx(hmax * 100, 0) + ' cm de montée', 'good', 'selon ta taille et le mouvement'));
  return {...A, ex: v.ex, rows: R, err: R.length ? '' : A.err};
};
Object.assign(AN_IMP, {bardev: 7, vbar: 8, hbar: 3});
// Le dessin : par-dessus le bonhomme, le trajet (toute la vidéo) et la flèche de force à l'image affichée.
const anaBind0 = anaBind;
anaBind = function (el) {
  anaBind0(el); const box = el.closest('.vbox'); if (!box) return; let cv = box.querySelector('canvas.vbar'); if (!cv) { cv = document.createElement('canvas'); cv.className = 'vbar'; box.appendChild(cv); }
  const id = VP.id, draw = async () => { if (VP.id !== id) return; const v = vids().find(x => x.id === id), r = box.getBoundingClientRect(), d = devicePixelRatio || 1; cv.width = r.width * d; cv.height = r.height * d;
    const g = cv.getContext('2d'); g.setTransform(d, 0, 0, d, 0, 0); g.clearRect(0, 0, r.width, r.height); if (!v || vKind(v) !== 'lift' || !(ANA.showPath || ANA.showForce) || !el.videoWidth) return;
    const P = ANA.cache[id] || (ANA.cache[id] = await vdbGet('p:' + id)); if (!P) return; const B = ANA.bar?.id === id && ANA.bar.P === P ? ANA.bar.B : (ANA.bar = {id, P, B: anaBar(P, +v.slow || 1)}).B; if (!B) return;
    const a = el.videoWidth / el.videoHeight, ew = el.clientWidth, eh = el.clientHeight, w = ew / eh > a ? eh * a : ew, h = ew / eh > a ? eh : ew / a, ox = el.offsetLeft + (ew - w) / 2, oy = el.offsetTop + (eh - h) / 2, X = z => ox + z / P.W * w, Y = z => oy + z / P.H * h;
    const L = B.pts, t = el.currentTime; let cur = L[0]; for (const p of L) if (Math.abs(p.t - t) < Math.abs(cur.t - t)) cur = p;
    if (ANA.showPath) { g.lineWidth = 3; g.lineJoin = 'round'; g.strokeStyle = 'rgba(100,210,255,.35)'; g.beginPath(); L.forEach((p, i) => i ? g.lineTo(X(p.x), Y(p.y)) : g.moveTo(X(p.x), Y(p.y))); g.stroke();
      g.strokeStyle = '#64D2FF'; g.beginPath(); L.filter(p => p.t <= t).forEach((p, i) => i ? g.lineTo(X(p.x), Y(p.y)) : g.moveTo(X(p.x), Y(p.y))); g.stroke();
      g.fillStyle = '#fff'; g.beginPath(); g.arc(X(cur.x), Y(cur.y), 5, 0, 7); g.fill(); }
    if (ANA.showForce && cur.ax != null && Math.abs(cur.t - t) < .2) {
      const fx0 = cur.ax, fy0 = cur.ay + 9.81, mag = Math.hypot(fx0, fy0) / 9.81, k = Math.max(0, Math.min(1, (mag - .6) / 1.8)), len = Math.min(160, 26 + 52 * mag), ang = Math.atan2(-fy0, fx0);
      const col = `hsl(${Math.round(120 - 120 * k)},90%,55%)`, x1 = X(cur.x), y1 = Y(cur.y), x2 = x1 + Math.cos(ang) * len, y2 = y1 + Math.sin(ang) * len;
      g.strokeStyle = col; g.fillStyle = col; g.lineWidth = 5; g.lineCap = 'round'; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
      g.beginPath(); g.moveTo(x2 + Math.cos(ang) * 10, y2 + Math.sin(ang) * 10); g.lineTo(x2 + Math.cos(ang + 2.4) * 14, y2 + Math.sin(ang + 2.4) * 14); g.lineTo(x2 + Math.cos(ang - 2.4) * 14, y2 + Math.sin(ang - 2.4) * 14); g.closePath(); g.fill();
      g.font = '700 13px system-ui'; g.fillStyle = '#fff'; g.fillText(v.kg ? `${Math.round(v.kg * mag * 9.81)} N` : `${fx(mag, 1)} × le poids de la barre`, x2 + 12, y2); }
  };
  const ld = ANA.redraw; ANA.redraw = () => { ld?.(); draw(); };
  el.addEventListener('seeked', draw); el.addEventListener('loadeddata', draw); el.addEventListener('timeupdate', draw);
  el.addEventListener('play', () => { const loop = () => { if (el.paused || VP.id !== id) return; draw(); requestAnimationFrame(loop); }; loop(); });
  setTimeout(draw, 350);
};

/* ---------- 4) musculation : un bloc de points forts et faibles par exercice ---------- */
const anaProfileHtml0 = anaProfileHtml;
anaProfileHtml = function (kind) {
  if (kind !== 'lift') return anaProfileHtml0(kind);
  const {L, P} = anaAgg('lift'), n = L.filter(v => v.an || v.coach).length;
  if (!n) return anaProfileHtml0(kind);
  const exN = id => LIFT_EX.find(x => x[0] === id)?.[1] || 'Autre', w = o => anImp(o) * Math.min(o.cnt, 5) * (o.lvl === 'good' ? o.sc : 2 - o.sc);
  const item = (o, i) => `<button type="button" class="anpi" data-vidplay="${esc(o.vid)}">${i != null ? `<em class="annum">${i + 1}</em>` : ''}<b>${esc(o.n.replace(/^[^·]*·\s*/, ''))}</b><small>${esc(o.txt)} · vu ${o.cnt} fois</small>${o.sure ? '' : anPill}</button>`;
  const exs = [...new Set(P.map(o => o.ex || 'squat'))];
  return `<div id="anaprof" class="sec-label" style="margin-top:22px">Mon profil · ${n} vidéo${n > 1 ? 's' : ''} analysée${n > 1 ? 's' : ''}</div>
    ${exs.map(ex => { const S2 = P.filter(o => (o.ex || 'squat') === ex && o.lvl !== 'warn').sort((a, b) => w(b) - w(a)), F = S2.filter(o => o.sure && o.lvl === 'good'), B = S2.filter(o => o.sure && o.lvl === 'bad'), U = S2.filter(o => !o.sure);
      const nv = L.filter(v => (v.ex || 'squat') === ex).length;
      return `<div class="anex"><h3>${esc(exN(ex))} <small>${nv} vidéo${nv > 1 ? 's' : ''}</small></h3><div class="an2"><div class="an2b"><span class="an3t">Points forts · ${F.length}</span>${F.map(item).join('') || '<p class="muted">Rien de sûr pour l\'instant</p>'}</div><div class="an2b"><span class="an3t">Points faibles · ${B.length}</span>${B.map(item).join('') || '<p class="muted">Rien de sûr pour l\'instant</p>'}</div></div>
        ${U.length ? `<div class="an2u"><span class="an3t">À vérifier</span>${U.map(o => item(o)).join('')}</div>` : ''}</div>`; }).join('')}
    <p class="small muted" data-tip="1" style="margin:8px 4px 0">Chaque exercice a ses propres points : ils ne se mélangent pas. Un point devient sûr quand il revient sur 2 vidéos.</p>`;
};
