/* ================= Test de réaction · le bonhomme et le ralenti =================
   · Le bonhomme : MediaPipe Pose (Google, gratuit), qui tourne sur le téléphone. Il repère 33 points du corps
     (tête, épaules, coudes, poignets, hanches, genoux, chevilles, talons, pointes de pied) dans le cadre choisi.
     Le modèle (~19 Mo) se télécharge une fois, au premier usage, puis reste dans le cache du navigateur.
   · Le ralenti : pendant le départ, on garde chaque image du cadre de 0,4 s avant le coup à 0,9 s après.
     Ensuite on les relit image par image, ou au ralenti, avec le temps depuis le coup et le bonhomme dessus.
   Le bonhomme ne tourne pas pendant le départ lui-même : il prendrait du temps à la mesure (des images perdues). */
const RCP = {lm: null, loading: null, err: '', ts: 0, live: false, lastLive: 0, off: null};
function rcPoseLoad() {
  if (RCP.lm || RCP.loading) return RCP.loading || Promise.resolve(RCP.lm);
  const V = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14';
  RCP.loading = (async () => {
    try {
      const m = await import(V + '/vision_bundle.mjs'), fs = await m.FilesetResolver.forVisionTasks(V + '/wasm');
      const opt = d => ({baseOptions: {modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task', delegate: d},
        runningMode: 'VIDEO', numPoses: 1, minPoseDetectionConfidence: .4, minPosePresenceConfidence: .4, minTrackingConfidence: .4});
      try { RCP.lm = await m.PoseLandmarker.createFromOptions(fs, opt('GPU')); } catch (e) { RCP.lm = await m.PoseLandmarker.createFromOptions(fs, opt('CPU')); }
      RCP.err = '';
    } catch (e) { RCP.err = 'Bonhomme indisponible (pas de connexion ?)'; RCP.lm = null; }
    RCP.loading = null; rcPoseStat(); return RCP.lm;
  })();
  rcPoseStat(); return RCP.loading;
}
// Le corps sur une image (canvas ou image) : 33 points en 0-1, ou rien.
function rcPoseOn(src) {
  if (!RCP.lm) return null;
  try { RCP.ts = Math.max(RCP.ts + 1, performance.now()); const r = RCP.lm.detectForVideo(src, RCP.ts); return r?.landmarks?.[0] || null; } catch (e) { return null; }
}
function rcPoseStat() { const s = document.querySelector('.rcposestat'); if (s) s.textContent = !rcCfg().pose ? '' : RCP.err || (RCP.loading ? 'Chargement du bonhomme… (une seule fois, ~19 Mo)' : RCP.lm ? '' : ''); }

// Le dessin : le côté gauche en bleu, le droit en orange, le tronc et la tête en blanc.
const RC_SEG = [[11, 12, 't'], [11, 23, 't'], [12, 24, 't'], [23, 24, 't'], [11, 13, 'l'], [13, 15, 'l'], [12, 14, 'r'], [14, 16, 'r'],
  [23, 25, 'l'], [25, 27, 'l'], [27, 29, 'l'], [29, 31, 'l'], [27, 31, 'l'], [24, 26, 'r'], [26, 28, 'r'], [28, 30, 'r'], [30, 32, 'r'], [28, 32, 'r']];
const RC_COL = {l: '#64D2FF', r: '#FF9F0A', t: '#FFFFFF'};
function rcDrawPose(g, lm, X, Y, s = 1) {
  if (!lm) return;
  const vis = i => (lm[i]?.visibility ?? 1) > .3, P = i => [X(lm[i].x), Y(lm[i].y)];
  g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
  const line = (a, b, c) => { g.beginPath(); g.moveTo(...a); g.lineTo(...b); g.strokeStyle = 'rgba(0,0,0,.55)'; g.lineWidth = 6 * s; g.stroke(); g.strokeStyle = c; g.lineWidth = 3.2 * s; g.stroke(); };
  for (const [a, b, k] of RC_SEG) if (vis(a) && vis(b)) line(P(a), P(b), RC_COL[k]);
  // Le cou et la tête
  if (vis(11) && vis(12) && vis(0)) {
    const sh = [(X(lm[11].x) + X(lm[12].x)) / 2, (Y(lm[11].y) + Y(lm[12].y)) / 2], h = P(0);
    const r = Math.max(7 * s, vis(7) && vis(8) ? Math.hypot(X(lm[7].x) - X(lm[8].x), Y(lm[7].y) - Y(lm[8].y)) * .7 : 0, Math.hypot(h[0] - sh[0], h[1] - sh[1]) * .32);
    line(sh, h, RC_COL.t);
    g.beginPath(); g.arc(h[0], h[1], r, 0, 7); g.strokeStyle = 'rgba(0,0,0,.55)'; g.lineWidth = 6 * s; g.stroke(); g.strokeStyle = '#fff'; g.lineWidth = 3 * s; g.stroke();
  }
  for (const i of [13, 14, 15, 16, 25, 26, 27, 28, 23, 24, 11, 12]) if (vis(i)) { const [x, y] = P(i); g.beginPath(); g.arc(x, y, 3.4 * s, 0, 7); g.fillStyle = i % 2 ? RC_COL.l : RC_COL.r; g.fill(); }
  g.restore();
}

// Le cadre (en coordonnées de la vidéo) découpé dans une petite image, pour le bonhomme.
function rcCrop(el, roi, max = 256) {
  const vw = el.videoWidth, vh = el.videoHeight; if (!vw) return null;
  const sx = roi.x * vw, sy = roi.y * vh, sw = Math.max(8, roi.w * vw), sh = Math.max(8, roi.h * vh), k = Math.min(1, max / Math.max(sw, sh));
  const c = RCP.off || (RCP.off = document.createElement('canvas')), W = Math.round(sw * k), H = Math.round(sh * k);
  if (c.width !== W || c.height !== H) { c.width = W; c.height = H; }
  c.getContext('2d').drawImage(el, sx, sy, sw, sh, 0, 0, W, H); return c;
}

/* ---------- en direct : le bonhomme sur la caméra, dans le cadre ---------- */
function rcPoseLive() {
  const cam = RCT.cam; if (!cam || !rcCfg().pose || RCP.live) return;
  RCP.live = true; rcPoseLoad();
  const tick = now => {
    if (!RCT.cam || RCT.cam !== cam || !rcCfg().pose) { RCP.live = false; rcPoseClear(); return; }
    cam.el.requestVideoFrameCallback(tick);
    if (RCT.run || !RCP.lm || now - RCP.lastLive < 40) return; RCP.lastLive = now;
    const c = rcCrop(cam.el, RCT.roi); if (!c) return;
    rcPoseDrawLive(rcPoseOn(c));
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
// À chaque image : on garde le cadre en petit (côté max 300 px). Avant le coup, seulement les 0,4 dernières secondes.
function rcGrab(el, roi, t, cap, bp) {
  if (bp != null && t > bp + 900) return;
  const vw = el.videoWidth, vh = el.videoHeight; if (!vw) return;
  const sx = roi.x * vw, sy = roi.y * vh, sw = Math.max(8, roi.w * vw), sh = Math.max(8, roi.h * vh), k = Math.min(1, 300 / Math.max(sw, sh));
  const f = {t, bmp: null}; cap.push(f);
  createImageBitmap(el, sx, sy, sw, sh, {resizeWidth: Math.round(sw * k), resizeHeight: Math.round(sh * k), resizeQuality: 'medium'}).then(b => { if (f.dead) b.close(); else f.bmp = b; }).catch(() => {});
  if (bp == null) while (cap.length && cap[0].t < t - 400) { const o = cap.shift(); o.dead = true; o.bmp?.close?.(); }
}
function rcFree(L) { L?.frames?.forEach(f => { f.dead = true; f.bmp?.close?.(); }); }
function rcSetLast(L) { rcRepStop(); if (RCT.last && RCT.last !== L) rcFree(RCT.last); RCT.last = L; RCT.rep = {i: 0, speed: .1, play: false}; if (L?.frames?.length) RCT.rep.i = rcRepIdx(L, 'dep') ?? rcRepIdx(L, 'coup') ?? 0; }
// L'image la plus proche du coup, ou du départ trouvé.
function rcRepIdx(L, what) {
  const fr = L.frames; if (!fr?.length) return null;
  const t = what === 'coup' ? L.tb : L.i != null && L.F[L.i] && L.F[L.i - 1] ? L.F[L.i].t : null; if (t == null) return null;
  let b = 0; fr.forEach((f, k) => { if (Math.abs(f.t - t) < Math.abs(fr[b].t - t)) b = k; }); return b;
}

/* ---------- le ralenti ---------- */
function rcReplay(L) {
  const fr = L.frames?.filter(f => f.bmp); if (!fr?.length) return '';
  L.frames = fr; const n = fr.length, R = RCT.rep || (RCT.rep = {i: 0, speed: .1}), ic = rcRepIdx(L, 'coup'), id = rcRepIdx(L, 'dep'), pct = k => (n > 1 ? k / (n - 1) * 100 : 50).toFixed(1);
  queueMicrotask(rcRepDraw);
  return `<div class="rcrep"><canvas class="rcrepc"></canvas><span class="rcreplab"></span></div>
    <div class="rcrepbar">${ic != null ? `<i class="mk coup" style="left:${pct(ic)}%"></i>` : ''}${id != null ? `<i class="mk dep" style="left:${pct(id)}%"></i>` : ''}<input type="range" min="0" max="${n - 1}" step="1" value="${Math.min(R.i, n - 1)}" data-rcrepi aria-label="Image"></div>
    <div class="rcrepbtns"><button type="button" class="btn ghost" data-rcrepstep="-1" aria-label="Image d'avant">‹</button><button type="button" class="btn" data-rcrepplay>${R.play ? 'Pause' : '▶ Ralenti'}</button><button type="button" class="btn ghost" data-rcrepstep="1" aria-label="Image d'après">›</button></div>
    <div class="seg rcspeed">${[[.05, '× 1/20'], [.1, '× 1/10'], [.25, '× 1/4'], [1, '× 1']].map(([v, l]) => `<button type="button" data-rcrepspeed="${v}" aria-pressed="${R.speed === v}">${l}</button>`).join('')}</div>
    <div class="rcrepgo">${ic != null ? '<button type="button" class="chip" data-rcrepgo="coup">Au coup</button>' : ''}${id != null ? '<button type="button" class="chip" data-rcrepgo="dep">Au départ</button>' : ''}<button type="button" class="chip" data-rcposeon aria-pressed="${!!rcCfg().pose}">Bonhomme</button></div>
    <p class="rcnote">${n} images · bleu = côté gauche, orange = côté droit</p>`;
}
async function rcRepDraw() {
  const L = RCT.last, cv = document.querySelector('.rcrepc'); if (!L?.frames?.length || !cv) return;
  const R = RCT.rep, i = R.i = Math.max(0, Math.min(L.frames.length - 1, R.i)), f = L.frames[i]; if (!f.bmp) return;
  if (cv.width !== f.bmp.width * 2) { cv.width = f.bmp.width * 2; cv.height = f.bmp.height * 2; }
  const g = cv.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(f.bmp, 0, 0, cv.width, cv.height);
  if (rcCfg().pose) {
    if (f.pose === undefined && RCP.lm) f.pose = rcPoseOn(f.bmp);
    if (f.pose) rcDrawPose(g, f.pose, x => x * cv.width, y => y * cv.height, cv.width / 300 * 1.2);
    else if (!RCP.lm && !RCP.err) rcPoseLoad().then(() => { if (RCT.rep?.i === i) rcRepDraw(); });
  }
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
document.addEventListener('input', e => { const s = e.target.closest?.('[data-rcrepi]'); if (!s) return; rcRepStop(); RCT.rep.i = +s.value; rcRepDraw(); });
document.addEventListener('click', e => {
  const at = q => e.target.closest?.(q); let b;
  if ((b = at('[data-rcrepstep]'))) { rcRepStop(); RCT.rep.i += +b.dataset.rcrepstep; rcRepDraw(); return; }
  if (at('[data-rcrepplay]')) { rcRepPlay(); return; }
  if ((b = at('[data-rcrepspeed]'))) { RCT.rep.speed = +b.dataset.rcrepspeed; RCT.rep.reset?.(); document.querySelectorAll('[data-rcrepspeed]').forEach(x => x.setAttribute('aria-pressed', x === b)); return; }
  if ((b = at('[data-rcrepgo]'))) { rcRepStop(); const k = rcRepIdx(RCT.last, b.dataset.rcrepgo); if (k != null) { RCT.rep.i = k; rcRepDraw(); } return; }
  if (at('[data-rcposeon]')) { rcSetCfg({pose: !rcCfg().pose}); if (rcCfg().pose) { rcPoseLoad(); rcPoseLive(); } else rcPoseClear(); paneRender(); return; }
});
