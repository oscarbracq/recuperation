/* ================= Profil · Tests de réaction =================
   Trois façons de mesurer le temps de réaction au départ :
   · Au son : le doigt posé sur l'écran, on le lève au coup de pistolet. Le coup est joué par l'audio du téléphone à un
     instant prévu à l'avance ; on connaît l'heure exacte où il sort du haut-parleur (getOutputTimestamp) sur la même
     horloge que l'appui (event.timeStamp). Réaction = lever du doigt − sortie du son − latence ajoutée (écouteurs).
   · À la caméra : le téléphone posé, il filme l'athlète dans les blocs, joue le starter et un flash. Chaque image est
     datée à sa capture (requestVideoFrameCallback, captureTime) ; on mesure le mouvement dans le cadre choisi, et le
     départ = la première image où ça bouge nettement plus que pendant le « prêt ».
   · Sur une vidéo importée : on retrouve le coup dans la bande son, on choisit la personne (un cadre), et on cherche son
     premier mouvement image par image.
   Chaque essai s'ajoute à la session (courbe) ; on enregistre la meilleure de la session, et la tendance suit. */
const RCT = {mode: 'son', tries: {son: [], cam: [], video: []}, run: null, cam: null, vid: null, roi: {x: .2, y: .1, w: .6, h: .8}, last: null, roiOn: false};
const RC_DEF = {start: 'starter', mkMin: 6, mkMax: 10, stMin: 1.5, stMax: 2.5, gnMin: 2, gnMax: 5, lat: 0, flash: true, place: 10};
const rcCfg = () => { try { return {...RC_DEF, ...JSON.parse(localStorage.getItem('tnr-react') || '{}')}; } catch (e) { return {...RC_DEF}; } };
const rcSetCfg = p => { try { localStorage.setItem('tnr-react', JSON.stringify({...rcCfg(), ...p})); } catch (e) {} };
const rcRnd = (a, b) => +a + Math.random() * Math.max(0, +b - +a);
const rcWait = s => new Promise(r => setTimeout(r, s * 1000));
const rcMs = v => v == null ? '–' : Math.round(v) + ' ms';

/* ---------- le son : pistolet synthétisé, joué à l'instant prévu ---------- */
let RCA = null;
function rcAudio() {
  if (!RCA) { const C = window.AudioContext || window.webkitAudioContext; RCA = new C({latencyHint: 'interactive'}); }
  if (RCA.state === 'suspended') RCA.resume(); return RCA;
}
function rcGunBuf(ctx) {
  if (ctx._gun) return ctx._gun;
  const sr = ctx.sampleRate, n = Math.round(sr * .5), b = ctx.createBuffer(1, n, sr), d = b.getChannelData(0);
  // Un claquement sec : bruit blanc qui monte en 1 ms et s'éteint vite, avec un coup sourd dessous.
  for (let i = 0; i < n; i++) { const t = i / sr, a = t < .001 ? t / .001 : 1; d[i] = Math.max(-1, Math.min(1, (Math.random() * 2 - 1) * Math.exp(-t * 16) * a * .95 + Math.sin(2 * Math.PI * 85 * t) * Math.exp(-t * 28) * .5)); }
  return (ctx._gun = b);
}
// L'heure (sur l'horloge des appuis, en ms) où l'instant audio T sort du haut-parleur.
function rcPerf(T) {
  const ctx = RCA, ts = ctx.getOutputTimestamp?.();
  if (ts && ts.performanceTime > 0) return ts.performanceTime + (T - ts.contextTime) * 1000;
  return performance.now() + (T - ctx.currentTime) * 1000 + (ctx.outputLatency || ctx.baseLatency || 0) * 1000;
}
function rcSay(t) {
  return new Promise(res => { try { const u = new SpeechSynthesisUtterance(t); u.lang = 'fr-FR'; u.rate = 1; let done = false; const end = () => { if (!done) { done = true; res(); } };
    u.onend = end; u.onerror = end; speechSynthesis.cancel(); speechSynthesis.speak(u); setTimeout(end, 3000); } catch (e) { res(); } });
}
function rcFlash(cam) {
  if (!rcCfg().flash) return;
  const f = document.createElement('div'); f.className = 'rcflash'; document.body.appendChild(f); setTimeout(() => f.remove(), 120);
  const tr = cam?.track; try { if (tr?.getCapabilities?.().torch) { tr.applyConstraints({advanced: [{torch: true}]}); setTimeout(() => tr.applyConstraints({advanced: [{torch: false}]}).catch(() => {}), 200); } } catch (e) {}
}
// Le starter : « À vos marques », attente, « Prêt », attente, coup. Ou le coup seul après une attente au hasard.
async function rcStarter(tok, say) {
  const c = rcCfg(); rcAudio();
  if (c.start === 'starter') {
    say('À vos marques'); await rcSay('À vos marques'); if (!tok.on) return;
    await rcWait(rcRnd(c.mkMin, c.mkMax)); if (!tok.on) return;
    say('Prêt'); await rcSay('Prêt'); if (!tok.on) return;
  } else say('Attends le coup…');
  const d = c.start === 'starter' ? rcRnd(c.stMin, c.stMax) : rcRnd(c.gnMin, c.gnMax);
  const ctx = rcAudio(), src = ctx.createBufferSource(); src.buffer = rcGunBuf(ctx); src.connect(ctx.destination);
  const T = ctx.currentTime + d; src.start(T); tok.src = src; tok.T = T; tok.bp = rcPerf(T) + (+c.lat || 0);
  setTimeout(() => { if (!tok.on) return; tok.bp = rcPerf(T) + (+c.lat || 0); tok.fired = true; rcFlash(RCT.cam); say('Pan !'); }, d * 1000);
}

/* ---------- au son : le doigt posé, on le lève au coup ---------- */
const rcPadTxt = t => { const p = document.querySelector('.rcpad b'); if (p) p.textContent = t; };
document.addEventListener('pointerdown', e => {
  const p = e.target.closest?.('.rcpad'); if (!p || RCT.run) return;
  e.preventDefault(); try { p.setPointerCapture(e.pointerId); } catch (err) {}
  const tok = RCT.run = {on: true, pid: e.pointerId, kind: 'son'}; p.classList.add('down');
  rcStarter(tok, rcPadTxt);
}, true);
document.addEventListener('pointerup', e => { const tok = RCT.run; if (!tok || tok.kind !== 'son' || e.pointerId !== tok.pid) return; rcLift(tok, e.timeStamp); }, true);
document.addEventListener('pointercancel', e => { const tok = RCT.run; if (tok && tok.kind === 'son' && e.pointerId === tok.pid) rcStop(tok, 'Doigt perdu : recommence'); }, true);
document.addEventListener('contextmenu', e => { if (e.target.closest?.('.rcpad')) e.preventDefault(); });
function rcStop(tok, msg) { tok.on = false; try { tok.src?.stop(); } catch (e) {} try { speechSynthesis.cancel(); } catch (e) {} RCT.run = null; document.querySelector('.rcpad')?.classList.remove('down'); if (msg) rcPadTxt(msg); }
function rcLift(tok, ts) {
  if (tok.T != null && ts >= tok.bp - 400) tok.bp = rcPerf(tok.T) + (+rcCfg().lat || 0);
  const ms = tok.T != null ? ts - tok.bp : null, early = ms == null || ms < 0;
  rcStop(tok);
  const r = {ms: ms == null ? null : Math.round(ms * 10) / 10, fs: early || ms < 100, early, at: Date.now()};
  RCT.tries.son.push(r); RCT.last = null;
  paneRender();
  if (PREFS?.haptic) navigator.vibrate?.(r.fs ? [30, 40, 30] : 15);
}

/* ---------- la courbe ---------- */
function rcChart(vals, opt = {}) {
  const V = vals.map((v, i) => ({i, v})).filter(x => x.v != null); if (V.length < 2) return '';
  const W = 300, H = 96, lo = Math.min(...V.map(x => x.v)), hi = Math.max(...V.map(x => x.v)), pad = Math.max(10, (hi - lo) * .15), a = lo - pad, b = hi + pad;
  const X = i => 14 + (vals.length > 1 ? i / (vals.length - 1) : .5) * (W - 28), Y = v => 10 + (1 - (v - a) / (b - a)) * (H - 24);
  const pts = V.map(x => `${X(x.i).toFixed(1)},${Y(x.v).toFixed(1)}`).join(' '), best = Math.min(...V.map(x => x.v));
  return `<svg class="rcchart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(opt.label || 'Courbe')}"><polyline points="${pts}" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linejoin="round"/>
    ${V.map(x => `<circle cx="${X(x.i).toFixed(1)}" cy="${Y(x.v).toFixed(1)}" r="${x.v === best ? 4.5 : 3}" fill="${x.v === best ? 'var(--good)' : 'var(--accent)'}"/>`).join('')}
    ${Math.round(hi) !== Math.round(lo) ? `<text x="${W - 4}" y="${(Y(hi) - 6).toFixed(1)}" font-size="9" fill="var(--fg3)" text-anchor="end">${Math.round(hi)} ms</text>` : ''}<text x="${W - 4}" y="${(Y(lo) + 14).toFixed(1)}" font-size="9" fill="var(--fg3)" text-anchor="end">${Math.round(lo)} ms</text></svg>`;
}

/* ---------- la caméra : le mouvement dans le cadre, image par image ---------- */
const RCV = {c: null, g: null, prev: null};
function rcMotion(el, roi) {
  const vw = el.videoWidth, vh = el.videoHeight; if (!vw) return 0;
  const sx = roi.x * vw, sy = roi.y * vh, sw = Math.max(8, roi.w * vw), sh = Math.max(8, roi.h * vh), W = 112, H = Math.max(16, Math.round(W * sh / sw));
  if (!RCV.c || RCV.c.width !== W || RCV.c.height !== H) { RCV.c = document.createElement('canvas'); RCV.c.width = W; RCV.c.height = H; RCV.g = RCV.c.getContext('2d', {willReadFrequently: true}); RCV.prev = null; }
  RCV.g.drawImage(el, sx, sy, sw, sh, 0, 0, W, H);
  const d = RCV.g.getImageData(0, 0, W, H).data, n = W * H, gray = new Float32Array(n);
  for (let i = 0; i < n; i++) gray[i] = d[i * 4] * .299 + d[i * 4 + 1] * .587 + d[i * 4 + 2] * .114;
  let m = 0; if (RCV.prev) { for (let i = 0; i < n; i++) m += Math.abs(gray[i] - RCV.prev[i]); m /= n; }
  RCV.prev = gray; return m;
}
// Le départ : la première image (à partir de 300 ms avant le coup) où le mouvement dépasse nettement celui du « prêt »,
// et la suivante aussi. Le mouvement a commencé entre l'image d'avant et celle-là : on prend le milieu.
function rcOnset(F, tb) {
  const base = F.filter(f => f.t > tb - 1000 && f.t < tb - 20 && f.m > 0).map(f => f.m); if (base.length < 4) return null;
  const mu = mean(base), sd = Math.sqrt(mean(base.map(x => (x - mu) ** 2))), thr = mu + Math.max(6 * sd, 1.2);
  for (let i = 1; i < F.length - 1; i++) { if (F[i].t < tb - 300) continue; if (F[i].m > thr && F[i + 1].m > thr * .6) return {i, thr, mu}; }
  return null;
}
function rcResult(F, tb, i) { if (i == null || !F[i] || !F[i - 1]) return null; return (F[i - 1].t + F[i].t) / 2 - tb; }
function rcMotionChart(L) {
  if (!L) return '';
  const {F, tb, i, thr} = L, W = 300, H = 110, t0 = tb - 500, t1 = tb + 900, S = F.filter(f => f.t >= t0 && f.t <= t1); if (S.length < 3) return '';
  const hi = Math.max(thr * 1.4, ...S.map(f => f.m)), X = t => 8 + (t - t0) / (t1 - t0) * (W - 16), Y = m => 8 + (1 - m / hi) * (H - 26);
  const on = i != null && F[i] ? (F[i - 1].t + F[i].t) / 2 : null;
  return `<svg class="rcchart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Mouvement autour du coup"><line x1="8" x2="${W - 8}" y1="${Y(thr).toFixed(1)}" y2="${Y(thr).toFixed(1)}" stroke="var(--fg3)" stroke-dasharray="3 3"/>
    <polyline points="${S.map(f => `${X(f.t).toFixed(1)},${Y(f.m).toFixed(1)}`).join(' ')}" fill="none" stroke="var(--accent)" stroke-width="1.8"/>
    <line x1="${X(tb).toFixed(1)}" x2="${X(tb).toFixed(1)}" y1="4" y2="${H - 16}" stroke="var(--warn)" stroke-width="2"/><text x="${X(tb).toFixed(1)}" y="${H - 4}" font-size="9" fill="var(--warn)" text-anchor="middle">coup</text>
    ${on != null ? `<line x1="${X(on).toFixed(1)}" x2="${X(on).toFixed(1)}" y1="4" y2="${H - 16}" stroke="var(--good)" stroke-width="2"/><text x="${X(on).toFixed(1)}" y="${H - 4}" font-size="9" fill="var(--good)" text-anchor="middle">départ</text>` : ''}</svg>
    <p class="small muted" style="margin:4px 0 0">${S.length} images sur 1,4 s · une image toutes les ${fx(mean(S.slice(1).map((f, k) => f.t - S[k].t)), 1)} ms en moyenne : la mesure est juste à une demi-image près.</p>`;
}
async function rcCamOpen() {
  if (RCT.cam) return;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({audio: false, video: {facingMode: {ideal: 'environment'}, frameRate: {ideal: 240}, width: {ideal: 1280}, height: {ideal: 720}}});
    const track = stream.getVideoTracks()[0]; try { await track.applyConstraints({frameRate: {ideal: 240}}); } catch (e) {}
    const el = document.createElement('video'); el.playsInline = true; el.muted = true; el.autoplay = true; el.srcObject = stream; el.className = 'rcvid'; await el.play().catch(() => {});
    RCT.cam = {stream, track, el, fps: track.getSettings?.().frameRate || null}; paneRender();
  } catch (e) { toast('Caméra refusée ou indisponible'); }
}
function rcCamClose() { try { RCT.cam?.stream.getTracks().forEach(t => t.stop()); } catch (e) {} RCT.cam = null; }
async function rcCamGo() {
  const cam = RCT.cam; if (!cam || RCT.run) return;
  const c = rcCfg(), tok = RCT.run = {on: true, kind: 'cam'}, F = [], st = t => { const s = document.querySelector('.rcstat'); if (s) s.textContent = t; };
  RCV.prev = null;
  const loop = (now, md) => {
    if (!tok.on) return;
    F.push({t: md.captureTime || md.expectedDisplayTime || now, m: rcMotion(cam.el, RCT.roi)}); if (F.length > 3000) F.splice(0, 1000);
    if (tok.fired && F.at(-1).t > tok.bp + 1200) { rcCamDone(tok, F); return; }
    cam.el.requestVideoFrameCallback(loop);
  };
  if (c.place > 0) { st('Mets-toi en place…'); rcSay('Mets-toi en place'); for (let s = Math.round(c.place); s > 0 && tok.on; s--) { st('Mets-toi en place · ' + s); await rcWait(1); } }
  if (!tok.on) return;
  cam.el.requestVideoFrameCallback(loop);
  await rcStarter(tok, st);
}
function rcCamDone(tok, F) {
  tok.on = false; RCT.run = null;
  const o = rcOnset(F, tok.bp), ms = o ? rcResult(F, tok.bp, o.i) : null;
  RCT.last = {F, tb: tok.bp, i: o?.i ?? null, thr: o?.thr ?? 2, mode: 'cam'};
  RCT.tries.cam.push({ms: ms == null ? null : Math.round(ms), fs: ms != null && ms < 100, early: ms != null && ms < 0, at: Date.now(), none: ms == null});
  paneRender();
}
// Corriger d'une image : le départ se décale à l'image d'avant ou d'après, et l'essai se recalcule.
function rcStep(d) {
  const L = RCT.last; if (!L || L.i == null) return; const i = Math.max(1, Math.min(L.F.length - 1, L.i + d)); L.i = i;
  const ms = rcResult(L.F, L.tb, i), arr = RCT.tries[L.mode], r = arr.at(-1); if (r) { r.ms = Math.round(ms); r.fs = ms < 100; r.early = ms < 0; r.none = false; }
  paneRender();
}

/* ---------- vidéo importée : le coup dans le son, la personne dans un cadre ---------- */
function rcFindBang(ab) {
  const ch = ab.getChannelData(0), sr = ab.sampleRate, w = Math.max(1, Math.round(sr * .002)), n = Math.floor(ch.length / w), E = new Float32Array(n);
  for (let i = 0; i < n; i++) { let s = 0; for (let j = i * w, e = j + w; j < e; j++) s += ch[j] * ch[j]; E[i] = s / w; }
  const C = [];
  for (let i = 60; i < n; i++) { let b = 0; for (let j = i - 60; j < i - 5; j++) b += E[j]; b /= 55; const r = E[i] / (b + 1e-9); if (r > 25 && E[i] > 1e-5) C.push({i, r, e: E[i]}); }
  // Un coup par fenêtre de 300 ms (le plus fort), puis on remonte au tout début de la montée.
  const out = []; for (const c of C.sort((a, b) => b.e - a.e)) if (!out.some(o => Math.abs(o.i - c.i) < 150)) out.push(c);
  return out.slice(0, 4).map(c => { let k = c.i; while (k > 1 && E[k - 1] > E[c.i] * .1) k--; return {t: k * w / sr, e: c.e}; }).sort((a, b) => b.e - a.e);
}
async function rcVidLoad(file) {
  if (!file) return;
  try { if (RCT.vid?.url) URL.revokeObjectURL(RCT.vid.url); } catch (e) {}
  const url = URL.createObjectURL(file), el = document.createElement('video'); el.src = url; el.playsInline = true; el.muted = true; el.controls = true; el.className = 'rcvid'; el.preload = 'auto';
  RCT.vid = {url, el, name: file.name, cands: [], tb: null, busy: 'Lecture du son…'}; RCT.roiOn = false; paneRender();
  await new Promise(r => { el.onloadedmetadata = r; setTimeout(r, 4000); });
  try { const ab = await rcAudio().decodeAudioData(await file.arrayBuffer()); RCT.vid.cands = rcFindBang(ab); RCT.vid.tb = RCT.vid.cands[0]?.t ?? null; }
  catch (e) { RCT.vid.err = 'Son illisible dans cette vidéo : place le coup à la main (mets la vidéo sur l\'image du coup).'; }
  RCT.vid.busy = ''; if (RCT.vid.tb != null) el.currentTime = RCT.vid.tb; paneRender();
}
async function rcVidAnalyze() {
  const V = RCT.vid; if (!V || V.tb == null || V.busy) return;
  const el = V.el, F = [], tb = V.tb * 1000; V.busy = 'Analyse image par image…'; paneRender(); RCV.prev = null;
  el.controls = false; el.pause(); el.currentTime = Math.max(0, V.tb - .8);
  await new Promise(r => { el.onseeked = r; setTimeout(r, 2000); });
  el.playbackRate = .25;
  await new Promise(res => {
    const loop = (now, md) => { F.push({t: md.mediaTime * 1000, m: rcMotion(el, RCT.roi)}); if (md.mediaTime > V.tb + 1.3 || el.ended) { el.pause(); res(); return; } el.requestVideoFrameCallback(loop); };
    el.requestVideoFrameCallback(loop); el.play().catch(res); setTimeout(res, 20000);
  });
  el.playbackRate = 1; el.controls = true;
  const o = rcOnset(F, tb), ms = o ? rcResult(F, tb, o.i) : null;
  RCT.last = {F, tb, i: o?.i ?? null, thr: o?.thr ?? 2, mode: 'video'};
  RCT.tries.video.push({ms: ms == null ? null : Math.round(ms), fs: ms != null && ms < 100, early: ms != null && ms < 0, at: Date.now(), none: ms == null});
  V.busy = ''; paneRender();
}
// Le cadre de la personne : on le trace au doigt sur l'image.
(() => {
  let D = null;
  const rel = (box, e) => { const r = box.getBoundingClientRect(); return [Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)), Math.max(0, Math.min(1, (e.clientY - r.top) / r.height))]; };
  document.addEventListener('pointerdown', e => { const box = e.target.closest?.('.rcvbox.roion'); if (!box) return; e.preventDefault(); try { box.setPointerCapture(e.pointerId); } catch (err) {} const [x, y] = rel(box, e); D = {box, x, y, id: e.pointerId}; }, true);
  document.addEventListener('pointermove', e => { if (!D || e.pointerId !== D.id) return; const [x, y] = rel(D.box, e); RCT.roi = {x: Math.min(x, D.x), y: Math.min(y, D.y), w: Math.max(.04, Math.abs(x - D.x)), h: Math.max(.04, Math.abs(y - D.y))}; rcRoiDraw(); }, true);
  document.addEventListener('pointerup', e => { if (D && e.pointerId === D.id) D = null; }, true);
})();
function rcRoiDraw() { const r = document.querySelector('.rcroi'); if (!r) return; const o = RCT.roi; Object.assign(r.style, {left: o.x * 100 + '%', top: o.y * 100 + '%', width: o.w * 100 + '%', height: o.h * 100 + '%'}); }
// Le lecteur vidéo survit aux nouveaux rendus du panneau : on le replace dans sa boîte.
function rcMount() { const box = document.querySelector('.rcvbox'); const el = RCT.mode === 'cam' ? RCT.cam?.el : RCT.mode === 'video' ? RCT.vid?.el : null; if (box && el && el.parentNode !== box) box.prepend(el); rcRoiDraw(); }

/* ---------- le panneau ---------- */
const RC_MODES = [['son', 'Au son'], ['cam', 'Caméra'], ['video', 'Vidéo importée']];
function rcSettings(cam) {
  const c = rcCfg(), n = (k, l, step = .1) => `<label>${l}<input class="mini-in" type="number" inputmode="decimal" step="${step}" min="0" data-rccfg="${k}" value="${c[k]}"></label>`;
  return `<details class="card rcset"><summary class="eyebrow">Réglages du départ</summary>
    <div class="seg" style="margin-top:10px">${[['starter', 'Starter complet'], ['gun', 'Pistolet seul']].map(([v, l]) => `<button type="button" data-rcstart="${v}" aria-pressed="${c.start === v}">${l}</button>`).join('')}</div>
    ${c.start === 'starter' ? `<p class="small muted" style="margin:8px 2px 4px">« À vos marques », puis « Prêt » au hasard entre les deux temps, puis le coup au hasard entre les deux autres.</p>
      <div class="edrow" style="grid-template-columns:1fr 1fr">${n('mkMin', 'Marques → prêt, mini (s)')}${n('mkMax', 'Marques → prêt, maxi (s)')}</div>
      <div class="edrow" style="grid-template-columns:1fr 1fr">${n('stMin', 'Prêt → coup, mini (s)')}${n('stMax', 'Prêt → coup, maxi (s)')}</div>`
      : `<p class="small muted" style="margin:8px 2px 4px">Le coup part au hasard entre les deux temps.</p><div class="edrow" style="grid-template-columns:1fr 1fr">${n('gnMin', 'Attente mini (s)')}${n('gnMax', 'Attente maxi (s)')}</div>`}
    <div class="edrow" style="grid-template-columns:1fr${cam ? ' 1fr' : ''}">${n('lat', 'Latence ajoutée (ms)', 1)}${cam ? n('place', 'Temps pour te placer (s)', 1) : ''}</div>
    <p class="small muted" style="margin:6px 2px 0">Moins de 100 ms après le coup = faux départ (règle World Athletics). Mesure au dixième de milliseconde, juste à quelques ms près (l'écran lit le doigt environ toutes les 4 ms). Le retard du haut-parleur du téléphone est déjà compté. Avec des écouteurs Bluetooth, mets leur retard (souvent 150 à 250 ms), ou mieux : le haut-parleur.</p>
    <div class="ctrow"><span>Flash au coup</span><div class="seg">${[[1, 'Oui'], [0, 'Non']].map(([v, l]) => `<button type="button" data-rcflash="${v}" aria-pressed="${!!c.flash === !!v}">${l}</button>`).join('')}</div></div></details>`;
}
function rcTryChip(r) { return `<span class="rctry${r.fs ? ' fs' : ''}">${r.none ? 'pas de départ vu' : r.early ? 'faux départ' + (r.ms != null ? ' · ' + rcMs(-r.ms) + ' trop tôt' : '') : rcMs(r.ms) + (r.fs ? ' · faux départ' : '')}</span>`; }
function rcBody() {
  queueMicrotask(rcMount);
  const m = RCT.mode, tr = RCT.tries[m], ok = tr.filter(r => !r.fs && r.ms != null), best = ok.length ? Math.min(...ok.map(r => r.ms)) : null, last = tr.at(-1);
  const hist = tests().filter(t => t.type === 'react' && t.mode === m).sort((a, b) => a.date.localeCompare(b.date));
  let main = '';
  if (m === 'son') main = `${rcSettings(false)}
    <div class="rcpad${last?.fs ? ' fs' : ''}" role="button" aria-label="Pose ton doigt ici, lève-le au coup"><b>${last ? (last.fs ? (last.early ? 'Faux départ' : rcMs(last.ms) + ' · faux départ') : rcMs(last.ms)) : 'Pose ton doigt ici'}</b><small>${last ? 'Repose ton doigt pour un nouvel essai' : 'Garde-le posé, et lève-le au coup de pistolet'}</small></div>
    <p class="rcnote">Moins de 100 ms = faux départ</p>`;
  else if (m === 'cam') main = `${rcSettings(true)}
    ${RCT.cam ? `<div class="card rccard"><div class="rcvbox${RCT.roiOn ? ' roion' : ''}"><div class="rcroi"></div></div>
      <p class="small muted" style="margin:6px 2px 0">${RCT.cam.fps ? 'Caméra à ' + Math.round(RCT.cam.fps) + ' images/s. ' : ''}Pose le téléphone au sol, de profil, à 2 ou 3 m des blocs. Le cadre vert = la zone surveillée : toi seul dedans.</p>
      <div class="btnrow two" style="margin-top:8px"><button class="btn ghost" data-rcroi>${RCT.roiOn ? 'Valider le cadre' : 'Tracer le cadre'}</button><button class="btn" data-rccamgo${RCT.run ? ' disabled' : ''}>Lancer le départ</button></div>
      <p class="rcstat small" style="text-align:center;margin:8px 0 0"></p></div>` : `<button class="btn rcopen" data-rccam>Ouvrir la caméra</button><p class="rcnote">Téléphone posé au sol, de profil, toi dans les blocs</p>`}
    ${RCT.last?.mode === 'cam' ? rcAnalysis() : ''}`;
  else { const V = RCT.vid;
    main = `<label class="btn ghost rcfile">${V ? 'Choisir une autre vidéo' : 'Importer une vidéo de départ'}<input type="file" accept="video/*" data-rcfile hidden></label>
    ${V ? `<div class="card rccard"><div class="rcvbox${RCT.roiOn ? ' roion' : ''}"><div class="rcroi"></div></div>
      ${V.busy ? `<p class="small" style="text-align:center;margin:8px 0 0">${V.busy}</p>` : `
      ${V.err ? `<p class="small" style="color:var(--warn);margin:8px 2px 0">${esc(V.err)}</p>` : ''}
      <div class="sec-label" style="margin:10px 2px 4px">Le coup de pistolet</div>
      <div class="chips2b">${V.cands.map(c => `<button type="button" class="chip" data-rcbang="${c.t}" aria-pressed="${V.tb === c.t}">${fx(c.t, 3)} s</button>`).join('')}<button type="button" class="chip" data-rcbanghere>À l'image affichée</button></div>
      <p class="small muted" style="margin:4px 2px 0">${V.tb != null ? 'Coup à ' + fx(V.tb, 3) + ' s. ' : ''}Le plus fort bruit sec est proposé en premier ; touche-en un pour aller voir l'image.</p>
      <div class="btnrow two" style="margin-top:8px"><button class="btn ghost" data-rcroi>${RCT.roiOn ? 'Valider la personne' : 'Choisir la personne'}</button><button class="btn" data-rcvidgo${V.tb == null ? ' disabled' : ''}>Analyser le départ</button></div>
      <p class="small muted" style="margin:6px 2px 0">« Choisir la personne » : trace un cadre autour d'elle seule, sur l'image du coup. Les autres couloirs ne comptent pas.</p>`}</div>` : '<p class="small muted" style="margin:6px 2px 0">Une vidéo avec le son du starter : le coup est retrouvé dans le son, puis le premier mouvement de la personne choisie, image par image. Plus la vidéo a d\'images par seconde (ralenti), plus c\'est précis.</p>'}
    ${RCT.last?.mode === 'video' ? rcAnalysis() : ''}`; }
  return `<div class="rcwrap"><div class="seg" style="margin-top:14px">${RC_MODES.map(([v, l]) => `<button type="button" data-rcmode="${v}" aria-pressed="${m === v}">${l}</button>`).join('')}</div>
    ${main}
    <div class="card" style="margin-top:12px"><div class="chead"><span class="eyebrow">Cette session · ${tr.length} essai${tr.length > 1 ? 's' : ''}</span>${best != null ? `<b class="num">${rcMs(best)}</b>` : ''}</div>
      ${tr.length ? `<div class="rctries">${tr.map(rcTryChip).join('')}</div>${rcChart(tr.map(r => r.fs ? null : r.ms), {label: 'Essais de la session'})}` : '<p class="small muted" style="margin:6px 0 0">Tes essais s\'ajoutent ici, avec leur courbe.</p>'}
      ${tr.length ? `<div class="btnrow two" style="margin-top:12px"><button class="btn" data-rcsave${best == null ? ' disabled' : ''}>Enregistrer${best != null ? ' ' + rcMs(best) : ''}</button><button class="btn ghost" data-rcclear>Nouvelle session</button></div>` : ''}</div>
    ${hist.length ? `<div class="card" style="margin-top:12px"><span class="eyebrow">Tendance · meilleure de chaque session</span>${rcChart(hist.map(h => h.best), {label: 'Tendance'})}
      <div class="list" style="margin-top:6px">${hist.slice(-6).reverse().map(h => `<div class="row"><span class="l">${esc(cap(fmtShort(h.date)))}</span><span class="small muted">${h.n || 0} essais · moyenne ${rcMs(h.avg)}</span><b class="num">${rcMs(h.best)}</b></div>`).join('')}</div></div>` : ''}</div>`;
}
function rcAnalysis() { const L = RCT.last, ms = L.i != null ? rcResult(L.F, L.tb, L.i) : null;
  return `<div class="card" style="margin-top:12px"><span class="eyebrow">Dernier départ</span><div class="rcbig num">${ms == null ? 'Pas de départ vu' : rcMs(ms)}</div>
    ${rcMotionChart(L)}${L.i != null ? `<div class="btnrow two" style="margin-top:8px"><button class="btn ghost" data-rcstep="-1">← Une image avant</button><button class="btn ghost" data-rcstep="1">Une image après →</button></div>` : '<p class="small muted">Rien n\'a bougé assez fort dans le cadre : agrandis-le ou rapproche le téléphone.</p>'}</div>`; }
function reactPane() { openPane({title: 'Test de réaction', render: rcBody, onClose: () => { if (RCT.run) rcStop(RCT.run); rcCamClose(); }}); }
const rcLastTxt = () => { const t = tests().filter(x => x.type === 'react').sort((a, b) => b.date.localeCompare(a.date))[0]; return t ? `${rcMs(t.best)} le ${fmtShort(t.date)} · ` : ''; };
document.addEventListener('click', async e => {
  const at = q => e.target.closest?.(q); let b;
  if (at('[data-treact]')) { reactPane(); return; }
  if ((b = at('[data-rcmode]'))) { if (RCT.run) rcStop(RCT.run); RCT.mode = b.dataset.rcmode; RCT.roiOn = false; if (RCT.mode !== 'cam') rcCamClose(); paneRender(); return; }
  if ((b = at('[data-rcstart]'))) { rcSetCfg({start: b.dataset.rcstart}); paneRender(); return; }
  if ((b = at('[data-rcflash]'))) { rcSetCfg({flash: b.dataset.rcflash === '1'}); paneRender(); return; }
  if (at('[data-rccam]')) { rcCamOpen(); return; }
  if (at('[data-rccamgo]')) { RCT.roiOn = false; document.querySelector('.rcvbox')?.classList.remove('roion'); rcCamGo(); return; }
  if (at('[data-rcroi]')) { RCT.roiOn = !RCT.roiOn; if (RCT.vid?.el) RCT.vid.el.controls = !RCT.roiOn; paneRender(); return; }
  if ((b = at('[data-rcbang]'))) { const V = RCT.vid; V.tb = +b.dataset.rcbang; V.el.currentTime = V.tb; paneRender(); return; }
  if (at('[data-rcbanghere]')) { const V = RCT.vid; V.tb = V.el.currentTime; paneRender(); return; }
  if (at('[data-rcvidgo]')) { RCT.roiOn = false; rcVidAnalyze(); return; }
  if ((b = at('[data-rcstep]'))) { rcStep(+b.dataset.rcstep); return; }
  if (at('[data-rcclear]')) { RCT.tries[RCT.mode] = []; RCT.last = null; paneRender(); return; }
  if (at('[data-rcsave]')) {
    const m = RCT.mode, ok = RCT.tries[m].filter(r => !r.fs && r.ms != null); if (!ok.length) return; const v = ok.map(r => r.ms);
    await saveTset({tests: [...tests(), {type: 'react', mode: m, date: TODAY, best: Math.min(...v), avg: Math.round(mean(v)), n: RCT.tries[m].length, tries: RCT.tries[m].map(r => r.fs ? null : r.ms), start: rcCfg().start}]});
    RCT.tries[m] = []; RCT.last = null; toast('Meilleure de la session enregistrée'); paneRender(); return;
  }
});
document.addEventListener('change', e => {
  const t = e.target, d = t.dataset || {};
  if (d.rccfg) { const v = +String(t.value).replace(',', '.'); if (!isNaN(v)) rcSetCfg({[d.rccfg]: v}); return; }
  if (d.rcfile !== undefined) rcVidLoad(t.files?.[0]);
});
