/* ================= Test de réaction · le bonhomme et le ralenti =================
   · Le bonhomme : MediaPipe Pose (Google, gratuit), qui tourne sur le téléphone. 33 points du corps (tête, épaules, coudes,
     poignets, hanches, genoux, chevilles, talons, pointes de pied), cherchés seulement dans le cadre choisi, une seule personne.
   · En direct (modèle « full », ~9 Mo) : lissé (filtre « One Euro » : stable à l'arrêt, sans retard quand ça bouge vite),
     et caché tant que le tronc n'est pas vu clairement.
   · Après le départ (modèle « heavy », ~31 Mo, le plus précis) : chaque image gardée est analysée DANS L'ORDRE (le modèle suit
     le corps d'une image à la suivante), puis nettoyée : un point qui donne une longueur de membre impossible, ou qui saute
     loin de ses voisins dans le temps, est écarté puis recalculé à partir des images d'avant et d'après.
   · Le ralenti : les images du cadre, de 0,6 s avant le coup à 0,9 s après, en grand (640 px), relues image par image.
   Le bonhomme ne tourne pas pendant le départ : il prendrait du temps à la mesure (des images perdues). */
const RCP = {lm: null, loading: null, hv: null, hvLoading: null, err: '', ts: 0, hts: 0, live: false, lastLive: 0, off: null, oe: null, n: 0, t0: 0};
const MP_V = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14', MP_M = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/';
let MP_MOD = null, MP_FS = null;
async function rcMk(model) {
  if (!MP_MOD) { MP_MOD = await import(MP_V + '/vision_bundle.mjs'); MP_FS = await MP_MOD.FilesetResolver.forVisionTasks(MP_V + '/wasm'); }
  const opt = d => ({baseOptions: {modelAssetPath: `${MP_M}pose_landmarker_${model}/float16/1/pose_landmarker_${model}.task`, delegate: d},
    runningMode: 'VIDEO', numPoses: 1, minPoseDetectionConfidence: .6, minPosePresenceConfidence: .6, minTrackingConfidence: .6});
  try { return await MP_MOD.PoseLandmarker.createFromOptions(MP_FS, opt('GPU')); } catch (e) { return await MP_MOD.PoseLandmarker.createFromOptions(MP_FS, opt('CPU')); }
}
function rcPoseLoad() {
  if (RCP.lm) return Promise.resolve(RCP.lm); if (RCP.loading) return RCP.loading;
  RCP.loading = rcMk('full').then(l => { RCP.lm = l; RCP.err = ''; return l; }).catch(() => { RCP.err = 'Bonhomme indisponible (pas de connexion ?)'; return null; }).finally(() => { RCP.loading = null; rcPoseStat(); });
  rcPoseStat(); return RCP.loading;
}
function rcPoseHeavy() {
  if (RCP.hv) return Promise.resolve(RCP.hv); if (RCP.hvLoading) return RCP.hvLoading;
  RCP.hvLoading = rcMk('heavy').catch(() => rcMk('full')).then(l => { RCP.hv = l; return l; }).catch(() => null).finally(() => { RCP.hvLoading = null; });
  return RCP.hvLoading;
}
function rcPoseStat() { const s = document.querySelector('.rcposestat'); if (s) s.textContent = !rcCfg().pose ? '' : RCP.err || (RCP.loading ? 'Chargement du bonhomme… (une seule fois)' : ''); }

/* ---------- le dessin : côté gauche en bleu, droit en orange, tronc et tête en blanc ---------- */
const RC_SEG = [[11, 12, 't'], [11, 23, 't'], [12, 24, 't'], [23, 24, 't'], [11, 13, 'l'], [13, 15, 'l'], [12, 14, 'r'], [14, 16, 'r'],
  [23, 25, 'l'], [25, 27, 'l'], [27, 29, 'l'], [29, 31, 'l'], [27, 31, 'l'], [24, 26, 'r'], [26, 28, 'r'], [28, 30, 'r'], [30, 32, 'r'], [28, 32, 'r']];
const RC_COL = {l: '#64D2FF', r: '#FF9F0A', t: '#FFFFFF'};
function rcDrawPose(g, lm, X, Y, s = 1) {
  if (!lm) return;
  const vis = i => (lm[i]?.visibility ?? 1) > .5, P = i => [X(lm[i].x), Y(lm[i].y)];
  g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
  const line = (a, b, c) => { g.beginPath(); g.moveTo(...a); g.lineTo(...b); g.strokeStyle = 'rgba(0,0,0,.55)'; g.lineWidth = 6 * s; g.stroke(); g.strokeStyle = c; g.lineWidth = 3.2 * s; g.stroke(); };
  for (const [a, b, k] of RC_SEG) if (vis(a) && vis(b)) line(P(a), P(b), RC_COL[k]);
  if (vis(11) && vis(12) && vis(0)) {
    const sh = [(X(lm[11].x) + X(lm[12].x)) / 2, (Y(lm[11].y) + Y(lm[12].y)) / 2], h = P(0);
    const r = Math.max(7 * s, vis(7) && vis(8) ? Math.hypot(X(lm[7].x) - X(lm[8].x), Y(lm[7].y) - Y(lm[8].y)) * .7 : 0, Math.hypot(h[0] - sh[0], h[1] - sh[1]) * .32);
    line(sh, h, RC_COL.t);
    g.beginPath(); g.arc(h[0], h[1], r, 0, 7); g.strokeStyle = 'rgba(0,0,0,.55)'; g.lineWidth = 6 * s; g.stroke(); g.strokeStyle = '#fff'; g.lineWidth = 3 * s; g.stroke();
  }
  for (const i of [13, 14, 15, 16, 25, 26, 27, 28, 23, 24, 11, 12]) if (vis(i)) { const [x, y] = P(i); g.beginPath(); g.arc(x, y, 3.4 * s, 0, 7); g.fillStyle = i % 2 ? RC_COL.l : RC_COL.r; g.fill(); }
  g.restore();
}
// Un vrai corps : les épaules et les hanches bien vues.
const rcTorsoOk = lm => !!lm && [11, 12, 23, 24].reduce((a, i) => a + (lm[i]?.visibility ?? 0), 0) / 4 > .6;

// Le cadre découpé dans une petite image carrée (avec une marge), pour le bonhomme en direct.
function rcCrop(el, roi, max = 320) {
  const vw = el.videoWidth, vh = el.videoHeight; if (!vw) return null;
  const sx = roi.x * vw, sy = roi.y * vh, sw = Math.max(8, roi.w * vw), sh = Math.max(8, roi.h * vh), k = Math.min(1, max / Math.max(sw, sh));
  const c = RCP.off || (RCP.off = document.createElement('canvas')), W = Math.round(sw * k), H = Math.round(sh * k);
  if (c.width !== W || c.height !== H) { c.width = W; c.height = H; }
  c.getContext('2d').drawImage(el, sx, sy, sw, sh, 0, 0, W, H); return c;
}

/* ---------- le filtre « One Euro » (Casiez 2012) : lisse les tremblements sans retarder les vrais mouvements ---------- */
function rcOE(lm, t) {
  const a = (fc, dt) => { const r = 2 * Math.PI * fc * dt; return r / (r + 1); };
  const S = RCP.oe; if (!S || t - S.t > 500) { RCP.oe = {t, p: lm.map(q => ({x: q.x, y: q.y, dx: 0, dy: 0, v: q.visibility ?? 1}))}; return lm; }
  const dt = Math.max(.001, (t - S.t) / 1000); S.t = t;
  return lm.map((q, i) => {
    const p = S.p[i], dx = (q.x - p.x) / dt, dy = (q.y - p.y) / dt, ad = a(1, dt);
    p.dx += ad * (dx - p.dx); p.dy += ad * (dy - p.dy);
    const fc = 1.2 + 2.5 * Math.hypot(p.dx, p.dy), ax = a(fc, dt);
    p.x += ax * (q.x - p.x); p.y += ax * (q.y - p.y); p.v += .5 * ((q.visibility ?? 1) - p.v);
    return {x: p.x, y: p.y, visibility: p.v};
  });
}

/* ---------- en direct : le bonhomme sur la caméra, dans le cadre ---------- */
function rcPoseLive() {
  const cam = RCT.cam; if (!cam || RCP.live) return;
  RCP.live = true; if (rcCfg().pose) rcPoseLoad();
  const tick = (now, md) => {
    if (!RCT.cam || RCT.cam !== cam) { RCP.live = false; rcPoseClear(); return; }
    cam.el.requestVideoFrameCallback(tick);
    // La cadence réelle de la caméra, mesurée sur les images reçues.
    RCP.n++; if (!RCP.t0) RCP.t0 = now; if (now - RCP.t0 > 1500) { cam.real = RCP.n * 1000 / (now - RCP.t0); RCP.n = 0; RCP.t0 = now; const f = document.querySelector('.rcfps'); if (f) f.textContent = Math.round(cam.real) + ' im/s mesurées'; }
    if (!rcCfg().pose || RCT.run || RCT.last?.body?.busy || !RCP.lm || now - RCP.lastLive < 33) return; RCP.lastLive = now;
    const c = rcCrop(cam.el, RCT.roi); if (!c) return;
    let lm = null; try { RCP.ts = Math.max(RCP.ts + 1, now); lm = RCP.lm.detectForVideo(c, RCP.ts)?.landmarks?.[0] || null; } catch (e) {}
    if (!lm || !rcTorsoOk(lm)) { RCP.oe = null; rcPoseClear(); return; }
    rcPoseDrawLive(rcOE(lm, now));
  };
  cam.el.requestVideoFrameCallback(tick);
}
function rcPoseCanvas() {
  const box = document.querySelector('.rcvbox'); if (!box) return null;
  let cv = box.querySelector('.rcpose'); if (!cv) { cv = document.createElement('canvas'); cv.className = 'rcpose'; box.appendChild(cv); }
  const r = box.getBoundingClientRect(), d = devicePixelRatio || 1, W = Math.round(r.width * d), H = Math.round(r.height * d);
  if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; } return cv;
}
function rcPoseClear() { const cv = document.querySelector('.rcvbox .rcpose'); cv?.getContext('2d').clearRect(0, 0, cv.width, cv.height); }
function rcPoseDrawLive(lm) {
  const cv = rcPoseCanvas(); if (!cv) return; const g = cv.getContext('2d'), o = RCT.roi; g.clearRect(0, 0, cv.width, cv.height);
  rcDrawPose(g, lm, x => (o.x + x * o.w) * cv.width, y => (o.y + y * o.h) * cv.height, devicePixelRatio || 1);
}

/* ---------- les images gardées autour du coup ---------- */
// À chaque image : le cadre en grand (côté max 640 px). Avant le coup, seulement les 0,6 dernières secondes.
function rcGrab(el, roi, t, cap, bp) {
  if (bp != null && t > bp + 900) return;
  const vw = el.videoWidth, vh = el.videoHeight; if (!vw) return;
  const sx = roi.x * vw, sy = roi.y * vh, sw = Math.max(8, roi.w * vw), sh = Math.max(8, roi.h * vh), k = Math.min(1, 640 / Math.max(sw, sh));
  const f = {t, bmp: null}; cap.push(f);
  createImageBitmap(el, sx, sy, sw, sh, {resizeWidth: Math.round(sw * k), resizeHeight: Math.round(sh * k), resizeQuality: 'high'}).then(b => { if (f.dead) b.close(); else f.bmp = b; }).catch(() => {});
  if (bp == null) while (cap.length && cap[0].t < t - 600) { const o = cap.shift(); o.dead = true; o.bmp?.close?.(); }
}
function rcFree(L) { L?.frames?.forEach(f => { f.dead = true; f.bmp?.close?.(); }); }
function rcSetLast(L) {
  rcRepStop(); if (RCT.last && RCT.last !== L) { if (RCT.last.body) RCT.last.body.stop = true; rcFree(RCT.last); }
  RCT.last = L; RCT.rep = {i: 0, speed: .1, play: false};
  if (L?.frames?.length) { RCT.rep.i = rcRepIdx(L, 'dep') ?? rcRepIdx(L, 'coup') ?? 0; setTimeout(() => rcBodyAnalyze(L), 250); }
}
function rcRepIdx(L, what) {
  const fr = L.frames; if (!fr?.length) return null;
  const t = what === 'coup' ? L.tb : L.i != null && L.F[L.i] && L.F[L.i - 1] ? L.F[L.i].t : null; if (t == null) return null;
  let b = 0; fr.forEach((f, k) => { if (Math.abs(f.t - t) < Math.abs(fr[b].t - t)) b = k; }); return b;
}

/* ---------- après le départ : le corps, image par image, dans l'ordre, puis nettoyé ---------- */
async function rcBodyAnalyze(L) {
  if (!rcCfg().pose || !L?.frames?.length || L.body) return;
  L.body = {busy: true, n: 0, N: L.frames.length}; rcBodyStat(L);
  const lm = await rcPoseHeavy();
  if (!lm || L.body.stop) { L.body = {err: true}; rcBodyStat(L); return; }
  L.frames = L.frames.filter(f => f.bmp);
  const base = RCP.hts + 10000, t0 = L.frames[0]?.t || 0;
  for (let k = 0; k < L.frames.length; k++) {
    if (L.body.stop) return;
    const f = L.frames[k]; RCP.hts = base + (f.t - t0);
    try { f.raw = lm.detectForVideo(f.bmp, RCP.hts)?.landmarks?.[0] || null; } catch (e) { f.raw = null; }
    L.body.n = k + 1; if (k % 2 === 0) { rcBodyStat(L); await new Promise(r => setTimeout(r, 0)); }
  }
  rcClean(L.frames); L.body = {done: true};
  if (RCT.last === L) { rcBodyStat(L); rcRepDraw(); }
}
function rcBodyStat(L) {
  const s = document.querySelector('.rcbodystat'); if (!s || RCT.last !== L) return; const b = L.body || {};
  s.textContent = b.busy ? `Analyse du corps… ${b.n}/${b.N}` : b.err ? 'Bonhomme indisponible (connexion ?)' : b.done ? `Corps suivi sur ${L.frames.filter(f => f.pose).length} images sur ${L.frames.length}` : '';
}
const rcMed = a => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
function rcClean(F) {
  const n = F.length, V = .5;
  const P = F.map(f => f.raw && rcTorsoOk(f.raw) ? f.raw.map(q => ({x: q.x, y: q.y, ok: (q.visibility ?? 1) > V})) : null);
  const d = (p, a, b) => Math.hypot(p[a].x - p[b].x, p[a].y - p[b].y);
  // L'échelle : la longueur du tronc (épaule-hanche), sa médiane sur toute la séquence.
  const tor = []; P.forEach(p => { if (!p) return; if (p[11].ok && p[23].ok) tor.push(d(p, 11, 23)); if (p[12].ok && p[24].ok) tor.push(d(p, 12, 24)); });
  const T = rcMed(tor) || .3;
  // 1. Les longueurs des os ne changent pas : un point qui en donne une impossible (± 45 % de la médiane) est écarté.
  const med = {}; for (const [a, b] of RC_SEG) { const L = []; P.forEach(p => { if (p && p[a].ok && p[b].ok) L.push(d(p, a, b)); }); med[a + '-' + b] = rcMed(L); }
  P.forEach(p => { if (!p) return;
    for (let j = 11; j < 33; j++) {
      const bones = RC_SEG.filter(([a, b]) => (a === j || b === j) && p[a].ok && p[b].ok && med[a + '-' + b]);
      if (bones.length && bones.every(([a, b]) => Math.abs(d(p, a, b) / med[a + '-' + b] - 1) > .45)) p[j].ok = false;
    } });
  // 2. Dans le temps : un point loin de ses voisins (2 images avant, 2 après) a sauté : écarté.
  for (let j = 0; j < 33; j++) for (let k = 0; k < n; k++) {
    const p = P[k]; if (!p || !p[j].ok) continue;
    const nb = []; for (let m = k - 2; m <= k + 2; m++) if (m !== k && P[m]?.[j].ok) nb.push(P[m][j]);
    if (nb.length < 2) continue;
    const mx = rcMed(nb.map(q => q.x)), my = rcMed(nb.map(q => q.y));
    if (Math.hypot(p[j].x - mx, p[j].y - my) > .45 * T) p[j].ok = false;
  }
  // 3. Les trous courts (3 images max) : recalculés entre l'image d'avant et celle d'après.
  for (let j = 0; j < 33; j++) for (let k = 0; k < n; k++) {
    if (!P[k] || P[k][j].ok) continue;
    let a = k - 1; while (a >= 0 && !(P[a]?.[j].ok)) a--; let b = k + 1; while (b < n && !(P[b]?.[j].ok)) b++;
    if (a < 0 || b >= n || b - a > 4) continue;
    const u = (F[k].t - F[a].t) / (F[b].t - F[a].t || 1), A = P[a][j], B = P[b][j];
    P[k][j] = {x: A.x + u * (B.x - A.x), y: A.y + u * (B.y - A.y), ok: true, fill: true};
  }
  // 4. Un léger lissage (1-2-1) qui garde les vrais mouvements.
  const out = P.map((p, k) => p && p.map((q, j) => {
    if (!q.ok) return {x: q.x, y: q.y, visibility: 0};
    const A = P[k - 1]?.[j], B = P[k + 1]?.[j];
    if (A?.ok && B?.ok) return {x: (A.x + 2 * q.x + B.x) / 4, y: (A.y + 2 * q.y + B.y) / 4, visibility: 1};
    return {x: q.x, y: q.y, visibility: 1};
  }));
  F.forEach((f, k) => { f.pose = out[k]; });
}

/* ---------- le ralenti ---------- */
function rcReplay(L) {
  const fr = L.frames?.filter(f => f.bmp); if (!fr?.length) return '';
  L.frames = fr; const n = fr.length, R = RCT.rep || (RCT.rep = {i: 0, speed: .1}), ic = rcRepIdx(L, 'coup'), id = rcRepIdx(L, 'dep'), pct = k => (n > 1 ? k / (n - 1) * 100 : 50).toFixed(1);
  const dt = n > 1 ? (fr.at(-1).t - fr[0].t) / (n - 1) : 0;
  queueMicrotask(() => { rcRepDraw(); rcBodyStat(L); });
  return `<div class="rcrep"><canvas class="rcrepc"></canvas><span class="rcreplab"></span></div>
    <div class="rcrepbar">${ic != null ? `<i class="mk coup" style="left:${pct(ic)}%"></i>` : ''}${id != null ? `<i class="mk dep" style="left:${pct(id)}%"></i>` : ''}<input type="range" min="0" max="${n - 1}" step="1" value="${Math.min(R.i, n - 1)}" data-rcrepi aria-label="Image"></div>
    <div class="rcrepbtns"><button type="button" class="btn ghost" data-rcrepstep="-1" aria-label="Image d'avant">‹</button><button type="button" class="btn" data-rcrepplay>${R.play ? 'Pause' : '▶ Ralenti'}</button><button type="button" class="btn ghost" data-rcrepstep="1" aria-label="Image d'après">›</button></div>
    <div class="seg rcspeed">${[[.05, '× 1/20'], [.1, '× 1/10'], [.25, '× 1/4'], [1, '× 1']].map(([v, l]) => `<button type="button" data-rcrepspeed="${v}" aria-pressed="${R.speed === v}">${l}</button>`).join('')}</div>
    <div class="rcrepgo">${ic != null ? '<button type="button" class="chip" data-rcrepgo="coup">Au coup</button>' : ''}${id != null ? '<button type="button" class="chip" data-rcrepgo="dep">Au départ</button>' : ''}<button type="button" class="chip" data-rcposeon aria-pressed="${!!rcCfg().pose}">Bonhomme</button></div>
    <p class="rcnote">${n} images · une toutes les ${fx(dt, 1)} ms (${Math.round(1000 / (dt || 1))} im/s) · <span class="rcbodystat"></span></p>`;
}
function rcRepDraw() {
  const L = RCT.last, cv = document.querySelector('.rcrepc'); if (!L?.frames?.length || !cv) return;
  const R = RCT.rep, i = R.i = Math.max(0, Math.min(L.frames.length - 1, R.i)), f = L.frames[i]; if (!f.bmp) return;
  if (cv.width !== f.bmp.width) { cv.width = f.bmp.width; cv.height = f.bmp.height; }
  const g = cv.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(f.bmp, 0, 0);
  if (rcCfg().pose && f.pose) rcDrawPose(g, f.pose, x => x * cv.width, y => y * cv.height, Math.max(1, cv.width / 360));
  const d = f.t - L.tb, ic = rcRepIdx(L, 'coup'), id = rcRepIdx(L, 'dep');
  const lab = document.querySelector('.rcreplab'); if (lab) { lab.textContent = (d >= 0 ? '+' : '−') + Math.abs(Math.round(d)) + ' ms' + (i === ic ? ' · COUP' : '') + (i === id ? ' · DÉPART' : ''); lab.className = 'rcreplab' + (i === id ? ' dep' : i === ic ? ' coup' : d < 0 ? ' pre' : ''); }
  const s = document.querySelector('[data-rcrepi]'); if (s && +s.value !== i) s.value = i;
}
function rcRepStop() { const R = RCT.rep; if (R?.play) { R.play = false; const b = document.querySelector('[data-rcrepplay]'); if (b) b.textContent = '▶ Ralenti'; } }
function rcRepPlay() {
  const L = RCT.last, R = RCT.rep; if (!L?.frames?.length) return;
  if (R.play) { rcRepStop(); return; }
  R.play = true; const b = document.querySelector('[data-rcrepplay]'); if (b) b.textContent = 'Pause';
  if (R.i >= L.frames.length - 1) R.i = 0;
  let t0 = performance.now(), m0 = L.frames[R.i].t;
  const step = now => {
    if (!R.play || RCT.last !== L || !document.querySelector('.rcrepc')) { R.play = false; return; }
    const m = m0 + (now - t0) * R.speed; let i = R.i; while (i < L.frames.length - 1 && L.frames[i + 1].t <= m) i++;
    if (i !== R.i) { R.i = i; rcRepDraw(); }
    if (i >= L.frames.length - 1) { rcRepStop(); return; }
    requestAnimationFrame(step);
  };
  R.reset = () => { t0 = performance.now(); m0 = L.frames[R.i].t; };
  requestAnimationFrame(step);
}
document.addEventListener('input', e => {
  const s = e.target.closest?.('[data-rcrepi]'); if (s) { rcRepStop(); RCT.rep.i = +s.value; rcRepDraw(); return; }
  const z = e.target.closest?.('[data-rczoom]'); if (z && RCT.cam?.track) { const v = +z.value; RCT.cam.zoom = v; RCT.cam.track.applyConstraints({advanced: [{zoom: v}]}).catch(() => {}); rcSetCfg({zoom: v}); const l = document.querySelector('.rczoomv'); if (l) l.textContent = '× ' + fx(v, 1); }
});
document.addEventListener('click', e => {
  const at = q => e.target.closest?.(q); let b;
  if ((b = at('[data-rcrepstep]'))) { rcRepStop(); RCT.rep.i += +b.dataset.rcrepstep; rcRepDraw(); return; }
  if (at('[data-rcrepplay]')) { rcRepPlay(); return; }
  if ((b = at('[data-rcrepspeed]'))) { RCT.rep.speed = +b.dataset.rcrepspeed; RCT.rep.reset?.(); document.querySelectorAll('[data-rcrepspeed]').forEach(x => x.setAttribute('aria-pressed', x === b)); return; }
  if ((b = at('[data-rcrepgo]'))) { rcRepStop(); const k = rcRepIdx(RCT.last, b.dataset.rcrepgo); if (k != null) { RCT.rep.i = k; rcRepDraw(); } return; }
  if (at('[data-rcposeon]')) { rcSetCfg({pose: !rcCfg().pose}); if (rcCfg().pose) { rcPoseLoad(); rcPoseLive(); if (RCT.last && !RCT.last.body) rcBodyAnalyze(RCT.last); } else rcPoseClear(); paneRender(); return; }
});
document.addEventListener('change', e => { const s = e.target.closest?.('[data-rccamid]'); if (!s) return; rcSetCfg({camId: s.value, zoom: null}); rcCamClose(); paneRender(); rcCamOpen(); });
