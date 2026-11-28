/* ================= Profil · Analyse de mes mouvements (musculation) et de ma dynamique de course =================
   Une vidéo de côté (ou de face pour les genoux) → MediaPipe Pose (Google, gratuit, sur l'appareil, déjà utilisé par le
   test de réaction) repère 33 points du corps sur chaque image. L'appli trouve seule les appuis (course) ou les
   répétitions (muscu), mesure les angles et les temps, et les compare aux repères des skills « coach-sprint » et
   « prepa-physique » (références biomecanique.md et analyse-mouvement.md : mêmes conventions, mêmes seuils).
   · Course : temps de contact, fréquence, pied posé devant la hanche, tibia et genou à la pose, écart des cuisses,
     cuisse libre, tronc, redressement sur les premiers appuis, tête, talons-fesses, position « prêt ».
   · Muscu : profondeur, tronc / tibia, talons, genou qui rentre (de face), hanches qui montent d'abord, extension,
     réception, temps de descente et de montée, perte de vitesse d'une répétition à l'autre.
   Les points forts et faibles de toutes les vidéos se rangent dans « Points forts · points faibles » (Profil) ; chaque
   point faible de course est relié à son axe de travail (« Ton cap »), et la consigne de chaque séance de sprint
   vient de là. Le coach Claude peut ajouter son analyse (bloc {"tnr":"analyse"} collé dans la vidéo).
   Les points du corps sont gardés sur l'appareil (IndexedDB 'p:'+id), les résultats dans settings/app.videos. */
const ANA = {busy: null, cache: {}, ts: 0, raf: 0};
const LIFT_EX = [['squat', 'Squat complet'], ['halfsquat', 'Demi-squat'], ['frontsquat', 'Squat avant'], ['deadlift', 'Soulevé de terre'], ['rdl', 'Soulevé jambes tendues'], ['clean', 'Épaulé / arraché'], ['lunge', 'Fente / squat bulgare'], ['hipthrust', 'Hip thrust'], ['jump', 'Saut (CMJ, sur box)']];
const RUN_PH = [['auto', 'Je ne sais pas'], ['depart', 'Départ, blocs'], ['acc', 'Accélération'], ['vmax', 'Vitesse max'], ['fin', 'Fin de course']];
const vKind = v => v?.kind || 'run';
const KIND_T = {run: 'Analyse de ma dynamique de course', lift: 'Analyse de mes mouvements · Musculation'};
// Les axes de « Ton cap » que chaque mesure de course dit.
const K_AXE = {ank: 'contact', hipx: 'releve', rk: 'freq', arm: 'relache', elb: 'relache', ct: 'contact', td: 'contact', shin: 'contact', knee: 'contact', fq: 'freq', sep: 'freq', thigh: 'freq', rise: 'releve', trunk1: 'releve', head: 'tete', heel: 'talons', set: 'ligne', trunk: 'relache'};
// Une consigne de 3 à 7 mots par axe (coach-sprint › defauts.md).
const AXE_CUE = {contact: 'Pied sous la hanche', freq: 'Genou devant, vite', releve: 'Pousse le sol derrière toi', tete: 'Regarde le sol à 3 m', talons: 'Genou devant, pied bas', relache: 'Visage mou, épaules basses', ligne: 'Épaules sur les mains', fv: 'Vite, pas fort'};

/* ---------- géométrie ---------- */
const anDg = r => r * 180 / Math.PI;
const anVA = (dx, up) => anDg(Math.atan2(dx, up));
const anA3 = (a, b, c) => { const ux = a[0] - b[0], uy = a[1] - b[1], wx = c[0] - b[0], wy = c[1] - b[1], n = Math.hypot(ux, uy) * Math.hypot(wx, wy); return n ? anDg(Math.acos(Math.max(-1, Math.min(1, (ux * wx + uy * wy) / n)))) : NaN; };
// Angle en 3D (points « monde » de MediaPipe, en mètres) : le même que vu de face ou de côté, la parallaxe ne le fausse plus.
const anA3w = (a, b, c) => { if (!a || !b || !c) return NaN; const u = [0, 1, 2].map(i => a[i] - b[i]), w = [0, 1, 2].map(i => c[i] - b[i]), n = Math.hypot(...u) * Math.hypot(...w); return n ? anDg(Math.acos(Math.max(-1, Math.min(1, (u[0] * w[0] + u[1] * w[1] + u[2] * w[2]) / n)))) : NaN; };
const anDist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const anMid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
const anMed = L => { const s = L.filter(x => Number.isFinite(x)).sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)] : NaN; };
const anMean = L => { const s = L.filter(x => Number.isFinite(x)); return s.length ? s.reduce((a, b) => a + b, 0) / s.length : NaN; };
const anH = () => (S.profile?.height || 177) / 100; // taille d'Oscar : l'échelle en mètres (hanche-cheville ≈ 0,49 × taille, Winter 2009)
const AN_SIDE = {G: {hip: 23, knee: 25, ank: 27, heel: 29, toe: 31, sh: 11, el: 13, wr: 15, ear: 7}, D: {hip: 24, knee: 26, ank: 28, heel: 30, toe: 32, sh: 12, el: 14, wr: 16, ear: 8}};

/* ---------- 1) le bonhomme sur chaque image ---------- */
// Le bonhomme sur TOUTE la vidéo (de l'entrée dans le champ à la sortie), et toujours sur Oscar : la personne au premier plan.
// 1) chaque image : jusqu'à 4 personnes détectées ; 2) on part de l'image où la personne la plus grande (la plus proche de la
// caméra, pieds les plus bas) est la plus nette ; 3) on la suit image par image, en avant et en arrière : à chaque image, la
// personne la plus proche de sa position prévue et de même taille. Une autre personne qui passe derrière n'est jamais prise.
// Entre les repères « début / fin » de la course : toutes les images (les mesures) ; en dehors : une image sur deux (l'affichage).
const anBox = p => { let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9, n = 0; for (const q of p) if (q[2] > .3) { n++; x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]); }
  return n < 6 ? null : {cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, h: y1 - y0, w: x1 - x0, foot: y1, n}; };
function anaPick(C, W, H, seedBox) {
  const B = C.map(L => L.map(p => ({p, b: anBox(p)})).filter(x => x.b)), n = B.length, out = Array(n).fill(null);
  // Le premier plan : grand et bas dans l'image ; on prend l'image où ce score est le plus haut comme point de départ.
  const fg = x => x.b.h / H + .5 * x.b.foot / H + .02 * x.b.n / 33;
  let i0 = -1, best = -1, seed = null;
  // Oscar a entouré la personne à analyser : on part d'elle (la plus grande part de son corps dans le cadre), image la plus proche.
  if (seedBox) { const ov = x => { const b = x.b, ix = Math.max(0, Math.min(b.cx + b.w / 2, seedBox.x1) - Math.max(b.cx - b.w / 2, seedBox.x0)), iy = Math.max(0, Math.min(b.cy + b.h / 2, seedBox.y1) - Math.max(b.cy - b.h / 2, seedBox.y0)); return ix * iy / Math.max(1, b.w * b.h); };
    for (let d = 0; d <= 20 && !seed; d++) for (const i of [seedBox.i - d, seedBox.i + d]) { if (i < 0 || i >= n || seed) continue; const c = B[i].map(x => [x, ov(x)]).filter(z => z[1] > .3).sort((a, b) => b[1] - a[1])[0]; if (c) { seed = c[0]; i0 = i; } } }
  if (!seed) { B.forEach((L, i) => L.forEach(x => { const s = fg(x); if (s > best) { best = s; i0 = i; } })); if (i0 < 0) return out; seed = B[i0].reduce((a, x) => fg(x) > fg(a) ? x : a); }
  out[i0] = seed.p;
  const run = dir => { let last = seed.b, vx = 0, vy = 0, gap = 0;
    for (let i = i0 + dir; i >= 0 && i < n; i += dir) {
      const px = last.cx + vx * (gap + 1), py = last.cy + vy * (gap + 1), lim = Math.max(.35 * last.h, 40) * (1 + gap * .5);
      let pick = null, pd = 1e9;
      for (const x of B[i]) { const d = Math.hypot(x.b.cx - px, x.b.cy - py), sz = x.b.h / Math.max(1, last.h); if (d < lim && sz > .6 && sz < 1.6 && d < pd) { pd = d; pick = x; } }
      // Personne perdue longtemps (sortie puis retour dans le champ) : on la reprend si c'est de nouveau la plus au premier plan.
      if (!pick && gap > 8 && B[i].length) { const c = B[i].reduce((a, x) => fg(x) > fg(a) ? x : a); if (c.b.h > .7 * seed.b.h) pick = c; }
      if (pick) { if (!gap) { vx = .6 * vx + .4 * (pick.b.cx - last.cx); vy = .6 * vy + .4 * (pick.b.cy - last.cy); } else { vx = (pick.b.cx - last.cx) / (gap + 1); vy = 0; }
        last = pick.b; gap = 0; out[i] = pick.p; } else gap++; } };
  run(1); run(-1);
  return out;
}
async function anaPose(id, onp) {
  const v = vids().find(x => x.id === id), blob = await vdbGet(id); if (!v || !blob) throw new Error('La vidéo n\'est pas sur cet appareil.');
  const lm = await (typeof rcPoseMany === 'function' ? rcPoseMany() : rcPoseHeavy()); if (!lm) throw new Error('Le bonhomme ne se charge pas (connexion ?).');
  const el = document.createElement('video'); el.muted = true; el.playsInline = true; el.preload = 'auto'; const url = URL.createObjectURL(blob); el.src = url;
  await new Promise((ok, ko) => { el.onloadeddata = ok; el.onerror = () => ko(new Error('Vidéo illisible')); setTimeout(ok, 6000); });
  const m = v.m || {}, D = el.duration || 0, mk = m.t0 != null && m.t1 > m.t0, a = mk ? Math.max(0, m.t0 - .3) : 0, b = mk ? Math.min(D, m.t1 + .3) : D;
  const fps = +v.fps || 30, step = Math.max(1 / fps, (b - a) / 900), step2 = Math.max(2 * step, D / 700), W = el.videoWidth || 1, H = el.videoHeight || 1, T = [];
  for (let t = 0; t < a - 1e-6; t += step2) T.push(t);
  for (let t = a; t <= b + 1e-6; t += step) T.push(t);
  for (let t = b + step2; t < D - 1e-3; t += step2) T.push(t);
  const C = [];
  for (let k = 0; k < T.length; k++) { const t = T[k];
    await new Promise(ok => { const done = () => { el.removeEventListener('seeked', done); ok(); }; el.addEventListener('seeked', done); el.currentTime = Math.min(t, D - .001); setTimeout(done, 1500); });
    ANA.ts = Math.max(performance.now(), ANA.ts + 1);
    let r = null; try { r = lm.detectForVideo(el, ANA.ts); } catch (e) {}
    C.push((r?.landmarks || []).map((p, j) => ({p: p.map(q => [+(q.x * W).toFixed(1), +(q.y * H).toFixed(1), +(q.visibility ?? 1).toFixed(2)]),
      w: r.worldLandmarks?.[j]?.map(q => [+q.x.toFixed(4), +q.y.toFixed(4), +q.z.toFixed(4)]) || null})));
    onp?.(k / Math.max(1, T.length - 1)); }
  URL.revokeObjectURL(url);
  const bx = v.box, sb = bx ? {i: T.reduce((bi, t, k) => Math.abs(t - bx.t) < Math.abs(T[bi] - bx.t) ? k : bi, 0), x0: bx.x0 * W, y0: bx.y0 * H, x1: bx.x1 * W, y1: bx.y1 * H} : null;
  const C2 = C.map(L => L.map(x => x.p)), S1 = anaPick(C2, W, H, sb), F = T.map((t, k) => { const j = S1[k] ? C2[k].indexOf(S1[k]) : -1; return {t, p: S1[k], w: j >= 0 ? C[k][j].w : null}; });
  const P = {W, H, step, step2, wa: a, wb: b, fps, F, v: 3}; await vdbPut('p:' + id, P); ANA.cache[id] = P; return P;
}
// Lisse chaque point sur 3 images (moins de tremblement) ; une image sans bonhomme reprend ses voisines.
function anaSmooth(F) {
  const n = F.length, out = F.map(f => f.p ? f.p.map(q => q.slice()) : null);
  for (let i = 0; i < n; i++) { if (!out[i]) { const a = F[i - 1]?.p, b = F[i + 1]?.p; if (a && b) out[i] = a.map((q, j) => [(q[0] + b[j][0]) / 2, (q[1] + b[j][1]) / 2, Math.min(q[2], b[j][2])]); continue; }
    const a = F[i - 1]?.p, b = F[i + 1]?.p; if (a && b) for (let j = 0; j < 33; j++) { out[i][j][0] = (a[j][0] + 2 * F[i].p[j][0] + b[j][0]) / 4; out[i][j][1] = (a[j][1] + 2 * F[i].p[j][1] + b[j][1]) / 4; } }
  return out;
}

/* ---------- 2) les mesures ---------- */
const anLv = (x, good, warn, hi = false) => !Number.isFinite(x) ? null : hi ? (x >= good ? 'good' : x >= warn ? 'warn' : 'bad') : (x <= good ? 'good' : x <= warn ? 'warn' : 'bad');
const anRow = (k, n, val, txt, lvl, ref) => lvl ? {k, n, v: val, txt, lvl, ref, axe: K_AXE[k] || null} : null;

function anaRun(v, P) {
  const L = anaSmooth(P.F), n = L.length, slow = +v.slow || 1, dtr = P.step / slow, ok = L.map(Boolean);
  const pt = (i, j) => L[i][j], hipC = i => anMid(pt(i, 23), pt(i, 24)), shC = i => anMid(pt(i, 11), pt(i, 12));
  const idx = [...Array(n).keys()].filter(i => ok[i]); if (idx.length < 8) return {err: 'Le corps n\'est pas assez visible sur la vidéo.'};
  const leg = anMed(idx.flatMap(i => [anDist(pt(i, 23), pt(i, 27)), anDist(pt(i, 24), pt(i, 28))]));
  const hxs = idx.map(i => hipC(i)[0]).sort((a, b) => a - b), moving = hxs[Math.floor(hxs.length * .85)] - hxs[Math.floor(hxs.length * .15)] > leg;
  const vmed = anMed(idx.slice(1).map((i, k) => (hipC(i)[0] - hipC(idx[k])[0]) / (i - idx[k])));
  const toeh = anMean(idx.flatMap(i => [pt(i, 31)[0] - pt(i, 29)[0], pt(i, 32)[0] - pt(i, 30)[0]]));
  const nose = anMean(idx.map(i => pt(i, 0)[0] - (pt(i, 7)[0] + pt(i, 8)[0]) / 2)), dir = moving && vmed ? Math.sign(vmed) : Math.abs(toeh) > .04 * leg ? Math.sign(toeh) : (nose >= 0 ? 1 : -1);
  const foot = (i, s) => anMid(pt(i, AN_SIDE[s].heel), pt(i, AN_SIDE[s].toe));
  const trunk = i => { const h = hipC(i), s = shC(i); return anVA((s[0] - h[0]) * dir, h[1] - s[1]); };
  const thigh = (i, s) => { const h = pt(i, AN_SIDE[s].hip), k = pt(i, AN_SIDE[s].knee); return anVA((k[0] - h[0]) * dir, k[1] - h[1]); };
  const shin = (i, s) => { const a = pt(i, AN_SIDE[s].ank), k = pt(i, AN_SIDE[s].knee); return anVA((k[0] - a[0]) * dir, a[1] - k[1]); };
  const Wp = i => P.F[i]?.w, J3 = (i, s, k) => Wp(i)?.[AN_SIDE[s][k]];
  // Le genou : en 3D quand MediaPipe le donne (vidéos analysées depuis la v194), sinon dans l'image.
  const knee = (i, s) => { const a = anA3w(J3(i, s, 'hip'), J3(i, s, 'knee'), J3(i, s, 'ank')); return Number.isFinite(a) ? a : anA3(pt(i, AN_SIDE[s].hip), pt(i, AN_SIDE[s].knee), pt(i, AN_SIDE[s].ank)); };
  const ankA = (i, s) => anA3(pt(i, AN_SIDE[s].knee), pt(i, AN_SIDE[s].ank), pt(i, AN_SIDE[s].toe));
  const elbA = (i, s) => { const a = anA3w(J3(i, s, 'sh'), J3(i, s, 'el'), J3(i, s, 'wr')); return Number.isFinite(a) ? a : anA3(pt(i, AN_SIDE[s].sh), pt(i, AN_SIDE[s].el), pt(i, AN_SIDE[s].wr)); };
  const armA = (i, s) => { const h = pt(i, AN_SIDE[s].sh), e = pt(i, AN_SIDE[s].el); return anVA((e[0] - h[0]) * dir, e[1] - h[1]); };
  const head = i => { const s = shC(i), h = hipC(i), e = anMid(pt(i, 7), pt(i, 8)); return anVA((e[0] - s[0]) * dir, s[1] - e[1]) - anVA((s[0] - h[0]) * dir, h[1] - s[1]); };
  // Les appuis : le pied au plus bas de sa trajectoire, presque immobile (caméra fixe : aussi immobile de côté).
  const win = Math.max(2, Math.ceil(.35 / dtr)), tol = .05 * leg, C = [];
  for (const s of ['G', 'D']) {
    const y = L.map((p, i) => p ? foot(i, s)[1] : NaN), x = L.map((p, i) => p ? foot(i, s)[0] : NaN), hxs = L.map((p, i) => p ? hipC(i)[0] : NaN), st = [];
    for (let i = 1; i < n - 1; i++) { if (!ok[i] || !ok[i - 1] || !ok[i + 1]) { st.push(false); continue; }
      let g = -1e9; for (let j = Math.max(0, i - win); j <= Math.min(n - 1, i + win); j++) if (Number.isFinite(y[j])) g = Math.max(g, y[j]);
      const vy = Math.abs(y[i + 1] - y[i - 1]) / 2 / leg / dtr, vx = Math.abs(x[i + 1] - x[i - 1]) / 2, vh = Math.abs(hxs[i + 1] - hxs[i - 1]) / 2;
      st.push(y[i] >= g - tol && vy < 2.2 && (!moving || vx < .45 * vh + .01 * leg)); }
    st.unshift(false); st.push(false);
    for (let i = 1; i < n - 1; i++) if (!st[i] && st[i - 1] && st[i + 1]) st[i] = true;
    for (let i = 0; i < n; i++) if (st[i]) { let j = i; while (j + 1 < n && st[j + 1]) j++; if (i > 1 && j < n - 2) C.push({s, a: i, b: j}); i = j; }
  }
  // Les appuis marqués à la main (Pose du pied / Le pied décolle) remplacent ceux trouvés seuls.
  const M = v.m || {}, near = t => { let bi = 0, bd = 1e9; L.forEach((p, i) => { const d = Math.abs(P.F[i].t - t); if (d < bd) { bd = d; bi = i; } }); return bi; };
  let manual = false;
  if ((M.poses || []).length >= 2) { const O = (M.offs || []).slice().sort((a, b) => a - b), Cm = [];
    for (const t of M.poses.slice().sort((a, b) => a - b)) { const o = O.find(x => x > t && (x - t) / slow < .5); if (o == null) continue; const a = near(t), b = Math.max(a, near(o) - 1); if (!ok[a]) continue;
      Cm.push({s: foot(a, 'G')[1] > foot(a, 'D')[1] ? 'G' : 'D', a, b, tm: (o - t) / slow}); }
    if (Cm.length >= 2) { C.length = 0; C.push(...Cm); manual = true; } }
  C.sort((p, q) => p.a - q.a);
  { const keep = C.filter(c => (c.tm ?? (c.b - c.a + 1) * dtr) <= .45); C.length = 0; C.push(...keep); }
  const real = i => P.F[i].t / slow, prec = Math.round(dtr * 1000);
  const S = C.map((c, k) => { const o = c.s === 'G' ? 'D' : 'G', nx = C[k + 1], i = c.a, end = nx ? nx.a : Math.min(n - 1, c.b + win);
    let tl = -90, hk = 180, rk = 180, amx = -180, amn = 180, el = []; for (let j = c.a; j <= end; j++) if (ok[j]) { tl = Math.max(tl, thigh(j, o)); if (j <= c.b && thigh(j, o) < 10) hk = Math.min(hk, knee(j, o)); rk = Math.min(rk, knee(j, o));
      for (const sd of ['G', 'D']) { const a = armA(j, sd); amx = Math.max(amx, a); amn = Math.min(amn, a); el.push(elbA(j, sd)); } }
    return {n: k + 1, s: c.s, t: real(i), ct: c.tm ?? (c.b - c.a + 1) * dtr, td: (foot(i, c.s)[0] - hipC(i)[0]) * dir / leg, shin: shin(i, c.s), knee: knee(i, c.s),
      sep: Math.abs(thigh(i, c.s) - thigh(i, o)), trunk: trunk(i), head: head(i), tl, hk, rk, ank: ankA(i, c.s), hipx: ok[c.b] ? -thigh(c.b, c.s) : NaN, arm: amx - amn, elb: anMed(el)}; });
  // La position « prêt » : mains au sol, corps immobile, au début de la vidéo.
  let set = null; for (const i of idx.slice(0, Math.ceil(idx.length / 3))) { const w = anMid(pt(i, 15), pt(i, 16)), kn = anMid(pt(i, 25), pt(i, 26));
    if (w[1] > kn[1] - .05 * leg) { const s = shC(i), arm = anDist(pt(i, 11), pt(i, 15)) || leg / 2; set = {i, off: (s[0] - w[0]) * dir / arm}; } else if (set) break; }
  // Échelle image par image : la jambe tendue la plus longue autour de l'image (≈ 0,49 × taille). Si Oscar s'approche ou
  // s'éloigne de la caméra (parallaxe, couloir pas parallèle à l'image), l'échelle suit, et les distances restent justes.
  const w2 = Math.max(2, Math.ceil(.5 / dtr)), legPx = L.map((p, i) => p ? Math.max(anDist(pt(i, 23), pt(i, 27)), anDist(pt(i, 24), pt(i, 28))) : NaN);
  const ppm = i => { let m = 0; for (let j = Math.max(0, i - w2); j <= Math.min(n - 1, i + w2); j++) if (Number.isFinite(legPx[j])) m = Math.max(m, legPx[j]); return m / (.49 * anH()); };
  const lens = []; for (let k = 0; k + 1 < S.length; k++) { const a = C[k], b = C[k + 1], dt = S[k + 1].t - S[k].t; if (!moving || dt < .15 || dt > .7) continue;
    const s = (ppm(a.a) + ppm(b.a)) / 2; if (s > 0) lens.push((foot(b.a, b.s)[0] - foot(a.a, a.s)[0]) * dir / s); }
  const dts = S.slice(1).map((x, k) => x.t - S[k].t).filter(d => d >= .15 && d <= .7), len = anMed(lens.filter(x => x > .3 && x < 3.2));
  const drift = S.length >= 2 && ppm(C[0].a) ? Math.abs(ppm(C.at(-1).a) / ppm(C[0].a) - 1) : 0;
  const shR = anMed(idx.map(i => Math.abs(pt(i, 11)[0] - pt(i, 12)[0]) / (anDist(shC(i), hipC(i)) || 1)));
  // Les appuis tout au bord de l'image sont vus de biais par l'objectif : on les écarte des moyennes s'il en reste assez.
  const Sc = S.filter((x, k) => { const fx0 = foot(C[k].a, C[k].s)[0]; return fx0 > .08 * P.W && fx0 < .92 * P.W; }), SS = Sc.length >= 3 ? Sc : S;
  const view = {q: shR > .45 || drift > .15 ? 'biais' : shR > .3 || drift > .08 ? 'moyenne' : 'bonne', sh: +shR.toFixed(2), drift: +drift.toFixed(2), edge: S.length - SS.length};
  const tr = anMed(SS.map(x => x.trunk)), ph = v.phase && v.phase !== 'auto' ? v.phase : set ? 'depart' : tr > 22 ? 'acc' : 'vmax', acc = ph === 'depart' || ph === 'acc';
  const R = [], T = L => L.filter(Boolean), cts = S.map(x => x.ct), fq = dts.length >= 2 ? 1 / anMed(dts) : NaN;
  const pr = dtr > .02 ? ` · précision ± ${prec} ms (filme au ralenti pour mieux)` : '';
  if (set) R.push(anRow('set', 'Épaules au-dessus des mains', set.off, `${set.off > 0 ? 'devant' : 'derrière'} de ${Math.round(Math.abs(set.off) * 100)} % du bras`, anLv(set.off, .15, .3), 'juste au-dessus, au plus 15 % du bras devant'));
  if (S.length) {
    const ctm = anMean(cts);
    R.push(acc ? anRow('ct', 'Temps de contact (premiers appuis)', ctm, Math.round(ctm * 1000) + ' ms' + pr, anLv(ctm, .2, .25), '0,17 à 0,23 s au départ') : anRow('ct', 'Temps de contact', ctm, Math.round(ctm * 1000) + ' ms' + pr, anLv(ctm, .11, .13), 'moins de 0,11 s à vitesse max (meilleurs : 0,08 à 0,10)'));
    if (Number.isFinite(fq)) R.push(anRow('fq', 'Fréquence de foulée', fq, fx(fq, 2) + ' pas/s', acc ? anLv(fq, 4.0, 3.6, true) : anLv(fq, 4.4, 4.1, true), acc ? '3,8 à 4,4 pas/s en accélération' : '4,3 à 4,7 pas/s (bon national)'));
    const td = anMed(SS.map(x => x.td)); R.push(acc ? anRow('td', 'Pied posé par rapport à la hanche', td, `${td > 0 ? 'devant' : 'derrière'}, ${Math.round(Math.abs(td) * 100)} % de la jambe`, anLv(td, .05, .15), 'sous ou derrière la hanche au départ')
      : anRow('td', 'Pied posé devant la hanche', td, `${Math.round(td * 100)} % de la longueur de jambe`, anLv(td, .3, .4), 'au plus 30 % de la jambe (≈ 25 à 35 cm)'));
    const sh = anMed(SS.map(x => x.shin)); R.push(acc ? anRow('shin', 'Tibia à la pose', sh, `${Math.round(sh)}° vers l'avant`, anLv(sh, 35, 20, true), '40 à 50° vers l\'avant au 1er appui') : anRow('shin', 'Tibia à la pose', sh, `${sh >= 0 ? Math.round(sh) + '° vers l\'avant' : Math.round(-sh) + '° vers l\'arrière (cheville devant le genou)'}`, anLv(sh, -5, -12, true), 'proche de la verticale'));
    if (!acc) { const kn = anMed(SS.map(x => x.knee)); R.push(anRow('knee', 'Genou à la pose', kn, Math.round(kn) + '°', kn >= 145 && kn <= 168 ? 'good' : kn >= 138 && kn <= 175 ? 'warn' : 'bad', '150 à 160°'));
      const sp = anMed(SS.map(x => x.sep)); R.push(anRow('sep', 'Écart des cuisses à la pose', sp, Math.round(sp) + '°', anLv(sp, 20, 35), 'genou libre à côté du genou d\'appui (≤ 20°)'));
      const tl = anMed(SS.map(x => x.tl)); R.push(anRow('thigh', 'Cuisse libre au plus haut', tl, `${Math.round(90 - tl)}° sous l'horizontale`, anLv(90 - tl, 20, 35), 'presque horizontale (≤ 20° dessous)'));
      R.push(anRow('trunk', 'Tronc à vitesse max', tr, Math.round(tr) + '° vers l\'avant', tr >= -3 && tr <= 12 ? 'good' : tr <= 20 ? 'warn' : 'bad', '0 à 10°, stable')); }
    if (acc) { const t1 = S[0].trunk; if (ph === 'depart') R.push(anRow('trunk1', 'Tronc au 1er appui', t1, Math.round(t1) + '° (par rapport à la verticale)', anLv(t1, 40, 30, true), '40 à 50°'));
      const k4 = S.slice(0, Math.min(5, S.length)); if (k4.length >= 3) { const drop = (k4[0].trunk - k4.at(-1).trunk) / (k4.length - 1); R.push(anRow('rise', 'Redressement du tronc', drop, `${fx(drop, 1)}° par appui (${Math.round(k4[0].trunk)}° → ${Math.round(k4.at(-1).trunk)}°)`, anLv(drop, 5, 8), '2 à 5° par appui, régulier')); }
      const hk = S.slice(0, 4).filter(x => x.hk < 180).map(x => x.hk); if (hk.length >= 2) { const m = anMed(hk); R.push(anRow('heel', 'Talon de la jambe libre', m, `genou fermé à ${Math.round(m)}°${m < 45 ? ' : talon vers la fesse' : ''}`, anLv(m, 0, 0) && (m >= 55 ? 'good' : m >= 45 ? 'warn' : 'bad'), 'talon bas, genou qui avance (≥ 55°)')); } }
    // Les autres articulations : cheville, hanche à la poussée, retour de la jambe, bras et coudes.
    const ak = anMed(SS.map(x => x.ank)); if (Number.isFinite(ak)) R.push(anRow('ank', 'Cheville à la pose', ak, `${Math.round(ak)}° entre tibia et pied`, anLv(ak, 110, 120), 'pied « armé », pointe relevée : 95 à 110°'));
    const hx = anMed(SS.map(x => x.hipx)); if (Number.isFinite(hx)) R.push(acc ? anRow('hipx', 'Hanche à la fin de la poussée', hx, `cuisse ${Math.round(hx)}° derrière la verticale`, anLv(hx, 25, 15, true), 'poussée complète : 25° ou plus derrière')
      : anRow('hipx', 'Hanche à la fin de la poussée', hx, `cuisse ${Math.round(hx)}° derrière la verticale`, anLv(hx, 22, 30), 'à vitesse max : pied qui quitte vite le sol, 22° au plus'));
    if (!acc) { const rk = anMed(SS.map(x => x.rk).filter(x => x < 180)); if (Number.isFinite(rk)) R.push(anRow('rk', 'Retour de la jambe libre', rk, `genou fermé à ${Math.round(rk)}°`, anLv(rk, 45, 60), 'talon près de la fesse : 45° ou moins (jambe courte = retour rapide)')); }
    const am = anMed(S.map(x => x.arm)); if (Number.isFinite(am)) R.push(anRow('arm', 'Amplitude des bras', am, `${Math.round(am)}° d'avant en arrière`, anLv(am, 90, 70, true), '90° ou plus, mains du menton à la hanche'));
    const eb = anMed(S.map(x => x.elb)); if (Number.isFinite(eb)) R.push(anRow('elb', 'Coudes', eb, `${Math.round(eb)}° en moyenne`, eb >= 70 && eb <= 115 ? 'good' : eb >= 55 && eb <= 135 ? 'warn' : 'bad', 'fléchis autour de 90° (70 à 115°)'));
    const hd = anMed(S.slice(0, acc ? 4 : 99).map(x => x.head)); R.push(anRow('head', 'Tête', hd, hd < -10 ? `relevée de ${Math.round(-hd)}° par rapport au dos` : 'dans l\'alignement du dos', hd >= -20 ? 'good' : hd >= -32 ? 'warn' : 'bad', 'alignée avec le tronc'));
    const g = S.filter(x => x.s === 'G').map(x => x.ct), d = S.filter(x => x.s === 'D').map(x => x.ct);
    if (g.length >= 2 && d.length >= 2 && dtr <= .02) { const a = anMean(g), b = anMean(d), gap = Math.abs(a - b) / Math.max(a, b) * 100; R.push(anRow('sym', 'Contact gauche / droite', gap, `G ${Math.round(a * 1000)} · D ${Math.round(b * 1000)} ms (${Math.round(gap)} %)`, anLv(gap, 8, 15), 'moins de 8 % d\'écart')); }
  }
  return {at: Date.now(), kind: 'run', ph, manual, prec, view, key: {ct: S.length ? +anMean(cts).toFixed(3) : null, fq: Number.isFinite(fq) ? +fq.toFixed(2) : null, len: Number.isFinite(len) ? +len.toFixed(2) : null, spd: Number.isFinite(len) && Number.isFinite(fq) ? +(len * fq).toFixed(2) : null}, steps: S.map(x => ({n: x.n, s: x.s, t: +x.t.toFixed(3), ct: +x.ct.toFixed(3), td: +x.td.toFixed(2), shin: Math.round(x.shin), knee: Math.round(x.knee), sep: Math.round(x.sep), trunk: Math.round(x.trunk), ank: Math.round(x.ank), hipx: Math.round(x.hipx), elb: Math.round(x.elb)})), rows: T(R), err: S.length ? '' : 'Aucun appui trouvé : filme de côté, caméra fixe, ou marque les appuis à la main.'};
}

function anaLift(v, P) {
  const L = anaSmooth(P.F), n = L.length, slow = +v.slow || 1, dtr = P.step / slow, ok = L.map(Boolean), ex = v.ex || 'squat', front = v.view === 'front';
  const idx = [...Array(n).keys()].filter(i => ok[i]); if (idx.length < 8) return {err: 'Le corps n\'est pas assez visible sur la vidéo.'};
  const vis = s => anMean(idx.map(i => L[i][AN_SIDE[s].knee][2] + L[i][AN_SIDE[s].hip][2] + L[i][AN_SIDE[s].ank][2])), s = vis('G') >= vis('D') ? 'G' : 'D', J = AN_SIDE[s];
  const pt = (i, j) => L[i][j], leg = anMed(idx.map(i => anDist(pt(i, J.hip), pt(i, J.ank)))), thighL = anMed(idx.map(i => anDist(pt(i, J.hip), pt(i, J.knee))));
  const toeAhead = anMean(idx.map(i => pt(i, J.toe)[0] - pt(i, J.heel)[0])), dir = toeAhead >= 0 ? 1 : -1;
  const trunk = i => anVA((pt(i, J.sh)[0] - pt(i, J.hip)[0]) * dir, pt(i, J.hip)[1] - pt(i, J.sh)[1]);
  const shin = i => anVA((pt(i, J.knee)[0] - pt(i, J.ank)[0]) * dir, pt(i, J.ank)[1] - pt(i, J.knee)[1]);
  const knee = i => anA3(pt(i, J.hip), pt(i, J.knee), pt(i, J.ank)), hipA = i => anA3(pt(i, J.sh), pt(i, J.hip), pt(i, J.knee));
  const hy = L.map((p, i) => p ? (pt(i, 23)[1] + pt(i, 24)[1]) / 2 : NaN), sy = L.map((p, i) => p ? (pt(i, 11)[1] + pt(i, 12)[1]) / 2 : NaN);
  const w = Math.max(2, Math.ceil(.35 / dtr)), prom = (ex === 'jump' ? .15 : .2) * leg, up = ex === 'hipthrust';
  const sig = hy.map(y => up ? -y : y), ext = [];
  for (const i of idx) { let isMax = true, lo = Infinity; for (let j = Math.max(0, i - w); j <= Math.min(n - 1, i + w); j++) if (Number.isFinite(sig[j]) && sig[j] > sig[i]) isMax = false;
    for (let j = Math.max(0, i - 4 * w); j <= Math.min(n - 1, i + 4 * w); j++) if (Number.isFinite(sig[j])) lo = Math.min(lo, sig[j]);
    if (isMax && sig[i] - lo > prom && !ext.some(e => Math.abs(e - i) < w)) ext.push(i); }
  const R = [], reps = [];
  const topAfter = (i, lim) => { let b = i; for (let j = i; j <= Math.min(n - 1, lim); j++) if (Number.isFinite(sig[j]) && sig[j] < sig[b]) b = j; return b; };
  const topBefore = (i, lim) => { let b = i; for (let j = i; j >= Math.max(0, lim); j--) if (Number.isFinite(sig[j]) && sig[j] < sig[b]) b = j; return b; };
  ext.forEach((i, k) => { const t0 = topBefore(i, k ? ext[k - 1] : 0), t1 = topAfter(i, k + 1 < ext.length ? ext[k + 1] : n - 1);
    const rise = Math.abs(hy[i] - hy[t1]) / leg, asc = (t1 - i) * dtr, desc = (i - t0) * dtr; reps.push({i, t0, t1, asc, desc, vel: asc > 0 ? rise / asc : NaN}); });
  if (front) {
    const valg = i => { const mx = (pt(i, 23)[0] + pt(i, 24)[0]) / 2, hw = Math.abs(pt(i, 23)[0] - pt(i, 24)[0]) || leg / 3, out = {};
      for (const q of ['G', 'D']) { const Q = AN_SIDE[q], h = pt(i, Q.hip), a = pt(i, Q.ank), k = pt(i, Q.knee), f = (k[1] - h[1]) / ((a[1] - h[1]) || 1), lx = h[0] + (a[0] - h[0]) * f;
        out[q] = (Math.abs(lx - mx) - Math.abs(k[0] - mx)) / hw; } return out; };
    // Par répétition : la valeur médiane du bas jusqu'à mi-montée (un point mal repéré ne fait pas l'alerte), puis la pire répétition.
    const worst = {G: -9, D: -9}, visOk = j => [23, 24, 25, 26, 27, 28].every(q => L[j][q][2] > .5);
    for (const r of reps) { const fr = []; for (let j = r.i; j <= r.i + Math.ceil((r.t1 - r.i) / 2); j++) if (ok[j] && visOk(j)) fr.push(valg(j)); if (fr.length < 2) continue;
      for (const q of ['G', 'D']) worst[q] = Math.max(worst[q], anMed(fr.map(o => o[q]))); }
    if (reps.length) for (const q of ['G', 'D']) R.push(anRow('valgus', `Genou ${q === 'G' ? 'gauche' : 'droit'} qui rentre`, worst[q], worst[q] > .04 ? `rentre de ${Math.round(worst[q] * 100)} % de la largeur du bassin` : 'reste dans l\'axe', anLv(worst[q], .08, .15), 'au-dessus du pied (≤ 8 %)'));
  } else if (ex === 'clean') {
    let pk = idx[0]; for (const i of idx) if (hy[i] < hy[pk]) pk = i;
    let kx = 0, hx = 0; for (let j = Math.max(0, pk - 3); j <= Math.min(n - 1, pk + 1); j++) if (ok[j]) { kx = Math.max(kx, knee(j)); hx = Math.max(hx, hipA(j)); }
    R.push(anRow('ext', 'Extension du genou au 2e tirage', kx, Math.round(kx) + '°', anLv(kx, 165, 155, true), '165° ou plus'), anRow('exth', 'Extension de la hanche', hx, Math.round(hx) + '°', anLv(hx, 172, 162, true), '175° ou plus'));
    let ct = pk; for (let j = pk; j < Math.min(n, pk + Math.ceil(1 / dtr)); j++) if (ok[j] && hy[j] > hy[ct]) ct = j;
    const kc = knee(ct); R.push(anRow('catch', 'Réception', kc, `genou à ${Math.round(kc)}°, ${fx((ct - pk) * dtr, 2)} s après l'extension`, kc <= 130 ? 'good' : kc <= 150 ? 'warn' : 'bad', 'demi-squat stable (genou ≤ 130°)'));
  } else if (ex === 'hipthrust') {
    if (reps.length) { const hA = anMed(reps.map(r => hipA(r.i))), sh = anMed(reps.map(r => shin(r.i)));
      R.push(anRow('ext', 'Hanche en haut', hA, Math.round(hA) + '°', hA >= 168 && hA <= 192 ? 'good' : hA >= 160 ? 'warn' : 'bad', '180° : tronc et cuisse alignés, sans cambrer'), anRow('shin', 'Tibia en haut', sh, Math.round(Math.abs(sh)) + '° de la verticale', anLv(Math.abs(sh), 10, 18), 'vertical')); }
  } else if (ex === 'jump') {
    if (reps.length) { const r = reps[0], kc = knee(r.i); R.push(anRow('depth', 'Contre-mouvement', kc, `genou à ${Math.round(kc)}°`, kc >= 80 && kc <= 120 ? 'good' : kc >= 65 ? 'warn' : 'bad', '90 à 110°, rapide'), anRow('desc', 'Durée de la descente', r.desc, fx(r.desc, 2) + ' s', anLv(r.desc, .5, .7), 'moins de 0,5 s'));
      const fy = L.map((p, i) => p ? Math.max(pt(i, 31)[1], pt(i, 32)[1]) : NaN), g = Math.max(...fy.filter(Number.isFinite)); let a = -1, b = -1;
      for (let j = r.i; j < n; j++) { if (fy[j] < g - .06 * leg) { if (a < 0) a = j; b = j; } else if (a >= 0) break; }
      if (a > 0) { const tf = (b - a + 1) * dtr, h = 9.81 * tf * tf / 8 * 100; R.push(anRow('fly', 'Hauteur (temps de vol)', h, `${fx(h, 1)} cm (vol ${Math.round(tf * 1000)} ms)`, 'good', 'précision ± ' + Math.round(dtr * 1000) + ' ms')); } }
  } else if (reps.length) {
    const B = reps.map(r => r.i), kn = anMed(B.map(knee)), tr = anMed(B.map(trunk)), sh = anMed(B.map(shin));
    if (/squat/.test(ex) || ex === 'lunge') {
      const dp = anMed(B.map(i => (pt(i, J.hip)[1] - pt(i, J.knee)[1]) / thighL));
      if (ex === 'halfsquat') R.push(anRow('depth', 'Profondeur (genou au bas)', kn, Math.round(kn) + '°', kn >= 85 && kn <= 115 ? 'good' : kn >= 75 && kn <= 125 ? 'warn' : 'bad', '90 à 110° pour le sprint'));
      else if (ex !== 'lunge') R.push(anRow('depth', 'Profondeur', dp, dp >= -.02 ? 'hanche sous le genou' : `hanche ${Math.round(-dp * 100)} % de cuisse au-dessus du genou`, anLv(-dp, .02, .15), 'pli de hanche sous le haut du genou'));
      R.push(anRow('par', 'Tronc et tibia', Math.abs(tr - sh), `tronc ${Math.round(tr)}° · tibia ${Math.round(sh)}° (écart ${Math.round(Math.abs(tr - sh))}°)`, anLv(Math.abs(tr - sh), 15, 25), 'parallèles (écart ≤ 15°)'));
      R.push(anRow('shin', 'Avancée du genou (tibia)', sh, Math.round(sh) + '° vers l\'avant', ex === 'lunge' ? (sh <= 32 ? 'good' : 'warn') : anLv(sh, 20, 12, true), ex === 'lunge' ? '10 à 30°' : '25 à 40° : sinon cheville raide ?'));
      const hl = anMed(reps.map(r => (pt(r.t0, J.heel)[1] - pt(r.i, J.heel)[1]) / leg)); R.push(anRow('heel', 'Talons', hl, hl > .03 ? 'le talon décolle' : 'au sol', anLv(hl, .03, .06), 'au sol'));
    } else {
      if (ex === 'deadlift') { const hf = anMean(reps.map(r => { const tot = hy[r.i] - hy[r.t1]; if (tot <= 0) return NaN; let j = r.i; while (j < r.t1 && hy[r.i] - hy[j] < .3 * tot) j++; const s0 = sy[r.i] - sy[j]; return s0 / ((hy[r.i] - hy[j]) || 1); }));
        R.push(anRow('hipfirst', 'Hanches et épaules au décollage', hf, hf >= .75 ? 'montent ensemble' : `les épaules montent ${Math.round(hf * 100)} % de la hanche : les hanches partent d'abord`, anLv(hf, .75, .5, true), 'montent au même rythme')); }
      if (ex === 'rdl') R.push(anRow('knee', 'Genou pendant la bascule', kn, Math.round(kn) + '°', kn >= 145 ? 'good' : kn >= 130 ? 'warn' : 'bad', '150 à 170°, fixe'));
      R.push(anRow('trunk', 'Tronc au bas', tr, Math.round(tr) + '° vers l\'avant', 'good', 'selon la souplesse des ischios'));
    }
  }
  if (reps.length >= 2 && !['clean', 'jump'].includes(ex)) { const V = reps.map(r => r.vel).filter(Number.isFinite), loss = V.length >= 2 ? (1 - V.at(-1) / Math.max(...V)) * 100 : NaN;
    if (Number.isFinite(loss)) R.push(anRow('vloss', 'Perte de vitesse (dernière répétition)', loss, `${Math.round(loss)} % plus lente que la plus rapide`, anLv(loss, 15, 25), 'moins de 20 % en force et puissance'));
    R.push(anRow('tempo', 'Tempo moyen', anMean(reps.map(r => r.asc)), `descente ${fx(anMean(reps.map(r => r.desc)), 1)} s · montée ${fx(anMean(reps.map(r => r.asc)), 2)} s`, 'good', 'montée la plus rapide possible')); }
  return {at: Date.now(), kind: 'lift', ex, side: s, reps: reps.map((r, k) => ({n: k + 1, t: +(P.F[r.i].t / slow).toFixed(2), desc: +r.desc.toFixed(2), asc: +r.asc.toFixed(2), knee: Math.round(knee(r.i)), trunk: Math.round(trunk(r.i))})), rows: R.filter(Boolean),
    err: reps.length || ex === 'clean' ? '' : 'Aucune répétition trouvée : filme tout le corps, de côté, caméra fixe.'};
}
// Les mesures ne lisent que les images du passage marqué (pas régulier) ; le reste sert à l'affichage du bonhomme.
const anaCompute = (v, P) => { let Q = P.wa != null ? {...P, F: P.F.filter(f => f.t >= P.wa - 1e-6 && f.t <= P.wb + 1e-6)} : P;
  const U = typeof anaUsable === 'function' ? anaUsable(v, Q) : null; if (U) Q = U.Q;
  const A = vKind(v) === 'lift' ? anaLift(v, Q) : anaRun(v, Q); return typeof anaRely === 'function' ? anaRely(v, Q, A, U) : A; };

/* ---------- 3) profil : points forts · à affiner · points faibles, sur toutes les vidéos ---------- */
// Un point n'est fort ou faible que s'il revient : on prend ses 5 dernières mesures (bien = 2, à affiner = 1, à corriger = 0).
// Moyenne ≥ 1,5 : point fort ; < 0,75 : point faible ; entre les deux : à affiner. Vu une seule fois : « à confirmer ».
const LV_SC = {good: 2, warn: 1, bad: 0}, LV_N = {good: 'Point fort', warn: 'À affiner', bad: 'Point faible'};
const LIFT_CUE = {depth: 'Hanches sous les genoux', par: 'Poitrine et tibias parallèles', shin: 'Genoux vers l\'avant', heel: 'Talons vissés au sol', valgus: 'Genoux au-dessus des pieds', hipfirst: 'Poitrine et hanches ensemble', knee: 'Genoux souples et fixes', ext: 'Grandis-toi jusqu\'au bout', exth: 'Hanches à fond devant', catch: 'Reçois bas et solide', vloss: 'Chaque répétition à fond', desc: 'Descends vite, repars vite', trunk: 'Dos plat, poitrine fière', fly: 'Pousse le sol, vite'};
const anCue = (kind, k, axe) => kind === 'run' ? (k === 'sym' ? 'Mêmes appuis à gauche et à droite' : AXE_CUE[axe || K_AXE[k]] || 'Vite et relâché') : LIFT_CUE[k] || 'Vite et propre';
function anaAgg(kind) {
  const L = vids().filter(v => vKind(v) === kind && ((v.an?.rows?.length && v.an?.rel?.ok !== false) || v.coach)).sort((a, b) => (a.taken || Date.parse(a.d) || 0) - (b.taken || Date.parse(b.d) || 0));
  const exN = id => LIFT_EX.find(x => x[0] === id)?.[1] || '', M = new Map();
  const add = (key, name, it) => { if (!M.has(key)) M.set(key, {key, n: name, k: it.k, axe: it.axe, ex: it.ex, seq: []}); const o = M.get(key); o.seq.push(it); if (it.axe) o.axe = it.axe; };
  for (const v of L) { const acc = ['depart', 'acc'].includes(v.an?.ph);
    for (const r of v.an?.rows || []) add(kind === 'lift' ? (v.ex || 'squat') + ':' + r.k : r.k + (['ct', 'fq', 'td', 'shin'].includes(r.k) ? (acc ? '|a' : '|v') : ''), kind === 'lift' ? `${exN(v.ex)} · ${r.n}` : r.n, {k: r.k, lvl: r.lvl, txt: r.txt, ref: r.ref, axe: r.axe, d: v.d, vid: v.id, ex: v.ex, b: v.an?.view?.q === 'biais' && !['ct', 'fq', 'sym', 'vloss', 'tempo', 'desc'].includes(r.k)});
    for (const [L2, lv] of [[v.coach?.forts || [], 'good'], [v.coach?.faibles || [], 'bad']]) for (const it of L2) add('c:' + (it.k || it.t), it.t, {k: it.k, lvl: lv, txt: it.t, axe: it.axe || K_AXE[it.k] || null, cue: it.cue, drill: it.drill, d: v.d, vid: v.id, coach: 1}); }
  const out = [...M.values()].map(o => { const last = o.seq.slice(-5), sc = last.reduce((a, x) => a + LV_SC[x.lvl], 0) / last.length, lvl = sc >= 1.5 ? 'good' : sc < .75 ? 'bad' : 'warn';
    const f = o.seq[0], z = o.seq.at(-1), trend = o.seq.length >= 2 ? Math.sign(LV_SC[z.lvl] - LV_SC[f.lvl]) : 0;
    return {...o, lvl, sc, cnt: o.seq.length, sure: o.seq.filter(x => !x.b).length >= 2, trend, txt: z.txt, ref: z.ref, d: z.d, vid: z.vid, cue: z.cue || anCue(kind, o.k, o.axe)}; });
  out.sort((a, b) => a.sc - b.sc || b.cnt - a.cnt);
  return {L, P: out};
}
// Ce que lisent la consigne des séances et Ton cap : les points à travailler et les points forts, tous vidéos confondues.
function anaPts(kind) {
  const {L, P} = anaAgg(kind), it = o => ({t: `${o.n} : ${o.txt}`, k: o.k, lvl: o.lvl, axe: o.axe, cue: o.cue, d: o.d, vid: o.vid, ref: o.ref, cnt: o.cnt});
  return {forts: P.filter(o => o.lvl === 'good').map(it), faibles: P.filter(o => o.lvl !== 'good').map(it), n: L.length};
}

/* ---------- 4) la consigne de chaque séance de sprint ---------- */
// Le défaut le plus prioritaire (« Ton cap ») qui se travaille dans CETTE séance ; un point faible vu en vidéo passe devant.
function sprintCue(p) {
  if (!p || p.kind !== 'track') return null;
  if (p.cue) return {t: p.cue, axe: p.axe || null, own: true};
  const it = p.items || [], has = re => it.some(x => re.test(x.ex || '') || re.test(x.start || '') || (x.res && re.test('res')));
  const type = has(/^(blocks|accel|start3|sled|hill|bandres|res)$/) ? 'acc' : has(/^(fly|wickets)$/) ? 'vmax' : has(/^speedend$/) ? 'se' : 'tech';
  const OK = {acc: ['releve', 'tete', 'talons', 'ligne'], vmax: ['contact', 'freq', 'relache'], se: ['relache', 'freq', 'contact'], tech: ['contact', 'freq', 'relache', 'releve', 'talons']}[type];
  const c = typeof capGet === 'function' ? capGet() : null, ax = c ? capAxes(c).filter(a => a.st !== 'done') : [], W = anaPts('run').faibles;
  const score = a => capPrio(a) + (W.some(w => w.axe === a.id && w.lvl === 'bad') ? 40 : W.some(w => w.axe === a.id) ? 20 : 0);
  const cand = ax.filter(a => OK.includes(a.id)).sort((a, b) => score(b) - score(a))[0] || ax.find(a => !CAP_AXES().some(d => d.id === a.id));
  if (!cand) return null;
  const vc = W.find(w => w.axe === cand.id && w.cue)?.cue;
  return {t: cand.cue || vc || AXE_CUE[cand.id] || cand.n, axe: cand.id, n: cand.n, type};
}
function cueCard(p) {
  const c = sprintCue(p); if (!c) return '';
  return `<div class="card cuec"><span class="eyebrow">Le seul détail de la séance</span><b class="cuet">« ${esc(c.t)} »</b>${c.n ? `<p class="small muted" data-tip="1" style="margin:4px 0 0">Ton axe : ${esc(c.n)}${c.own ? '' : ' · choisi dans Ton cap et tes vidéos'}</p>` : ''}</div>`;
}

/* ---------- 5) l'écran de la vidéo : analyser, voir le bonhomme, le coach ---------- */
const anDot = l => `<i class="anad ${l}"></i>`;
// L'unique intention à garder en tête : le point à corriger le plus important (ordre de Ton cap pour la course).
function anaIntent(kind, rows, coach) {
  if (coach?.cue) return coach.cue;
  const c = kind === 'run' && typeof capGet === 'function' ? capGet() : null, ax = c ? capAxes(c) : [], pr = r => { const a = ax.find(x => x.id === (r.axe || K_AXE[r.k])); return a ? capPrio(a) : 0; };
  const bad = rows.filter(r => r.lvl === 'bad').sort((a, b) => pr(b) - pr(a) || anImp(b) - anImp(a)), r = bad[0];
  return r ? anCue(kind, r.k, r.axe) : kind === 'run' ? 'Garde ça : vite et relâché' : 'Garde ça : vite et propre';
}
// Ce que coûte (ou rapporte) chaque point sur un 100 m, du plus au moins : la fréquence et le temps de contact font la
// vitesse (Weyand 2000, Morin 2012) ; le pied devant la hanche freine à chaque appui ; l'écart gauche / droite, la poussée
// des premiers appuis (tronc, tibia) font l'accélération (Kugler 2010) ; la tête et la position des blocs comptent moins.
const AN_IMP = {ank: 6, hipx: 6, rk: 5, arm: 5, elb: 3, fq: 10, ct: 10, td: 9, sym: 7, trunk1: 7, rise: 7, shin: 6, thigh: 6, knee: 5, sep: 5, trunk: 4, heel: 4, set: 3, head: 3,
  vloss: 8, depth: 6, ext: 7, exth: 7, catch: 5, fly: 9, par: 6, valgus: 8, hipfirst: 6, desc: 4, tempo: 3};
const anImp = x => x.prio ? Math.max(1, 12 - x.prio) : AN_IMP[x.k] ?? 4;
const anPill = '<i class="anunc">à vérifier</i>';
// Deux listes seulement : points forts, points faibles (le « moyen » n'est pas montré). Les points sûrs sont dans les cadres,
// classés par ce qui se répète et ce qui pèse le plus sur le chrono ; les autres, en bas, avec la pastille « à vérifier ».
function anaTwo(F, B, U, cap) {
  const li = (L, num) => L.map((x, i) => `<p>${num ? `<em class="annum">${i + 1}</em>` : ''}${x.h}</p>`).join('');
  const box = (t, L) => `<div class="an2b"><span class="an3t">${t} · ${L.length}</span>${li(L, true) || '<p class="muted">Rien de sûr pour l\'instant</p>'}</div>`;
  const uf = U.filter(x => x.l === 'good'), ub = U.filter(x => x.l === 'bad');
  return `<div class="an2">${box('Points forts', F)}${box('Points faibles', B)}</div>
    ${U.length ? `<div class="an2u"><span class="an3t">À vérifier</span><p class="small muted" data-tip="1">${cap}</p>${uf.length ? `<p class="an2h">Points forts</p>${li(uf)}` : ''}${ub.length ? `<p class="an2h">Points faibles</p>${li(ub)}` : ''}</div>` : ''}`;
}
function anaResHtml(v) {
  const A = v.an, C = v.coach, k = vKind(v);
  if (!A && !C) return '<p class="small muted" data-tip="1" style="margin:8px 4px 0">Pas encore analysée.</p>';
  if (A?.err && !A.rows?.length && !C) return `<p class="small" style="color:var(--warn);margin:8px 4px 0">${esc(A.err)}</p>`;
  const rows = A?.rows || [], unc = A?.view?.q === 'biais', angle = r => !['ct', 'fq', 'sym', 'vloss', 'tempo', 'desc'].includes(r.k);
  // Revient sur combien de vidéos avec le même verdict (cette vidéo comprise) : ce qui se répète passe devant.
  const rep = r => vids().filter(x => vKind(x) === k && x.an?.rows?.some(y => y.k === r.k && y.lvl === r.lvl)).length || 1;
  const it = r => ({l: r.lvl, s: anImp(r) * rep(r), sure: !(unc && angle(r)), h: `<b>${esc(r.n)}</b> ${esc(r.txt)}<small>Repère : ${esc(r.ref)}${rep(r) > 1 ? ` · revient sur ${rep(r)} vidéos` : ''}</small>`});
  const L = [...rows.filter(r => r.lvl !== 'warn').map(it),
    ...(C?.forts || []).map(x => ({l: 'good', s: anImp(x) * 2, sure: true, h: `${esc(x.t)}<small>Le coach</small>`})),
    ...(C?.faibles || []).map(x => ({l: 'bad', s: anImp(x) * 2, sure: true, h: `${esc(x.t)}<small>Le coach${x.drill ? ' · exercice : ' + esc(x.drill) : ''}</small>`}))].sort((a, b) => b.s - a.s);
  const U = L.filter(x => !x.sure).map(x => ({...x, h: x.h.replace('<small>', anPill + '<small>')}));
  const boxes = anaTwo(L.filter(x => x.sure && x.l === 'good'), L.filter(x => x.sure && x.l === 'bad'), U, 'Filmé un peu de biais : ces angles peuvent être faux de quelques degrés. Refilme bien de côté pour les confirmer.');
  const K = A?.key || {}, kv = (l, x) => `<div><span>${l}</span><b>${x}</b></div>`;
  const keys = k === 'run' ? `<div class="vres">${kv('Temps de contact', K.ct ? Math.round(K.ct * 1000) + ' ms' : '–')}${kv('Fréquence', K.fq ? fx(K.fq, 2) + ' pas/s' : '–')}${kv('Longueur de pas', K.len ? fx(K.len, 2) + ' m' : '–')}${K.spd ? kv('Vitesse', fx(K.spd, 1) + ' m/s') : ''}</div>`
    : A?.reps?.length ? `<div class="vres">${kv('Répétitions', A.reps.length)}${kv('Descente', fx(anMean(A.reps.map(r => r.desc)), 2) + ' s')}${kv('Montée', fx(anMean(A.reps.map(r => r.asc)), 2) + ' s')}</div>` : '';
  const tab = A?.kind === 'run' && A.steps?.length ? `<details class="anadet"><summary>Appui par appui (${A.steps.length})</summary><table class="anat"><tr><th>#</th><th>Pied</th><th>Contact</th><th>Pied-hanche</th><th>Tibia</th><th>Tronc</th><th>Genou</th><th>Cheville</th><th>Hanche</th></tr>${A.steps.map(s => `<tr><td>${s.n}</td><td>${s.s}</td><td>${Math.round(s.ct * 1000)} ms</td><td>${Math.round(s.td * 100)} %</td><td>${s.shin}°</td><td>${s.trunk}°</td><td>${s.knee ?? '–'}°</td><td>${Number.isFinite(s.ank) ? s.ank + '°' : '–'}</td><td>${Number.isFinite(s.hipx) ? s.hipx + '°' : '–'}</td></tr>`).join('')}</table></details>`
    : A?.reps?.length ? `<details class="anadet"><summary>Répétition par répétition (${A.reps.length})</summary><table class="anat"><tr><th>#</th><th>Descente</th><th>Montée</th><th>Genou</th><th>Tronc</th></tr>${A.reps.map(r => `<tr><td>${r.n}</td><td>${fx(r.desc, 2)} s</td><td>${fx(r.asc, 2)} s</td><td>${r.knee}°</td><td>${r.trunk}°</td></tr>`).join('')}</table></details>` : '';
  const vw = A?.view, VQ = {bonne: 'bonne prise de vue (bien de côté, distance stable)', moyenne: 'prise de vue moyenne : un peu de biais ou de parallaxe, les angles peuvent bouger de quelques degrés', biais: 'filmé en biais : les angles sont faussés, refilme bien de côté'};
  const foot = A ? `<p class="small muted" data-tip="1" style="margin:6px 4px 0">${A.kind === 'run' ? `Phase : ${esc(RUN_PH.find(x => x[0] === A.ph)?.[1] || '')}` : `Côté mesuré : ${A.side === 'G' ? 'gauche' : 'droit'}`}${vw ? ' · ' + VQ[vw.q] : ''}${vw?.edge ? ` · ${vw.edge} appui${vw.edge > 1 ? 's' : ''} au bord de l'image écarté${vw.edge > 1 ? 's' : ''}` : ''}${A.prec > 20 ? ` · temps à ± ${A.prec} ms (filme au ralenti pour mieux)` : ''}.</p>` : '';
  return `${keys}${boxes}<div class="card cuec anint"><span class="eyebrow">${k === 'run' ? 'Ta seule intention pour le prochain sprint' : 'Ta seule intention pour la prochaine série'}</span><b class="cuet">« ${esc(anaIntent(k, rows, C))} »</b></div>${tab}${foot}`;
}
function anaSection(v) {
  const k = vKind(v);
  return `<div class="sec-label">Analyse du corps</div>
    ${k === 'lift' ? `<div class="cap-g2"><label class="cap-f">Exercice<select class="mini-in" data-anaset="ex">${LIFT_EX.map(([x, l]) => `<option value="${x}"${(v.ex || 'squat') === x ? ' selected' : ''}>${l}</option>`).join('')}</select></label>
      <label class="cap-f">Filmé<select class="mini-in" data-anaset="view">${[['side', 'De côté'], ['front', 'De face']].map(([x, l]) => `<option value="${x}"${(v.view || 'side') === x ? ' selected' : ''}>${l}</option>`).join('')}</select></label></div>`
    : `<label class="cap-f">Phase de la course<select class="mini-in" data-anaset="phase">${RUN_PH.map(([x, l]) => `<option value="${x}"${(v.phase || 'auto') === x ? ' selected' : ''}>${l}</option>`).join('')}</select></label>`}
    <button type="button" class="btn" style="width:100%;margin-top:10px" data-anago>${v.an ? 'Refaire l\'analyse' : 'Analyser mon corps sur cette vidéo'}</button>
    <p class="small muted" data-tip="1" data-anaprog style="margin:6px 4px 0">${k === 'run' ? 'De côté, caméra fixe à hauteur de hanche, à 5 à 10 m : moins de parallaxe, des angles plus justes.' : 'Tout le corps dans l\'image, caméra fixe à hauteur de hanche. De côté pour les angles, de face pour les genoux.'}</p>
    <div data-anares>${anaResHtml(v)}</div>
    <div class="sec-label">Le coach ${k === 'run' ? 'sprint' : 'muscu'}</div>
    <div class="btnrow two"><button type="button" class="btn ghost" data-anaask>Demander à Claude</button><button type="button" class="btn ghost" data-anasheet>Image pour Claude</button></div>
    <p class="small muted" data-tip="1" style="margin:6px 4px 0">« Demander » copie la demande avec tes mesures ; « Image » enregistre 8 images clés avec le bonhomme. Envoie-les à Claude avec la vidéo, puis colle sa réponse ici.</p>
    <textarea class="mini-in" rows="3" data-anapaste placeholder="Colle ici la réponse de Claude (avec le bloc json)" style="width:100%;margin-top:8px"></textarea>`;
}
function anaPrompt(v) {
  const A = v.an, k = vKind(v), ex = LIFT_EX.find(x => x[0] === v.ex)?.[1];
  const c = typeof capGet === 'function' ? capGet() : null, ax = c ? capAxes(c).map((a, i) => `${i + 1}. ${a.n} (id « ${a.id} », importance ${a.imp}, rapidité ${a.rap})`).join('\n') : '';
  return `Utilise le skill « ${k === 'run' ? 'coach-sprint' : 'prepa-physique'} ». Analyse ${k === 'run' ? 'ma course' : 'mon ' + (ex || 'mouvement')} sur la vidéo jointe (« ${v.title || 'vidéo'} », ${v.d}${+v.slow > 1 ? `, ralenti ×${v.slow}` : ''}, fichier à ${v.fps || 30} images/s${k === 'lift' ? `, filmé ${v.view === 'front' ? 'de face' : 'de côté'}` : ''}).
Extrais les images (scripts/extraire_images.py du skill coach-sprint), regarde-les, mesure, compare aux repères, trouve les causes.
${A?.rows?.length ? `\nCe que l'appli a mesuré seule (MediaPipe, en 2D) :\n${A.rows.map(r => `- ${r.n} : ${r.txt} (repère : ${r.ref})`).join('\n')}\n${A.steps?.length ? 'Appuis : ' + A.steps.map(s => `#${s.n} ${s.s} ${Math.round(s.ct * 1000)} ms, pied ${Math.round(s.td * 100)} % de jambe, tronc ${s.trunk}°`).join(' ; ') + '\n' : ''}${A.reps?.length ? 'Répétitions : ' + A.reps.map(r => `#${r.n} descente ${r.desc} s, montée ${r.asc} s, genou ${r.knee}°`).join(' ; ') + '\n' : ''}` : ''}${v.note ? `\nCe que je vois : ${v.note}\n` : ''}${k === 'run' && ax ? `\nMes axes de travail (Ton cap) :\n${ax}\n` : ''}
Réponds en français simple, en 2 listes chiffrées (points forts · points faibles, rien de « moyen »), classées par ce qui se répète et ce qui coûte ou rapporte le plus de temps sur 100 m, avec la cause de chaque point à corriger, puis UNE seule intention courte à appliquer dès le prochain essai, deux exercices${k === 'run' ? ', le complément en salle' : ', ce que tu changes dans mon programme, le lien avec le sprint'}.
Termine par un seul bloc \`\`\`json : {"tnr":"analyse","kind":"${k}",${k === 'lift' ? `"ex":"${v.ex || 'squat'}",` : ''}"forts":[{"t":"…","k":"…"}],"faibles":[{"t":"…","k":"…",${k === 'run' ? '"axe":"…",' : ''}"prio":1,"cue":"…","drill":"…"}],"cue":"…","resume":"…"}`;
}
// 8 images clés (poses ou bas des répétitions) avec le bonhomme, sur une planche à enregistrer.
async function anaSheet(v) {
  const P = ANA.cache[v.id] || await vdbGet('p:' + v.id), blob = await vdbGet(v.id); if (!blob) { toast('La vidéo n\'est pas sur cet appareil'); return; }
  const slow = +v.slow || 1, T = (v.an?.steps?.map(s => s.t * slow) || v.an?.reps?.map(r => r.t * slow) || []).slice(0, 8);
  if (T.length < 8) { const D = P?.F?.length ? P.F.at(-1).t : 3, a = P?.F?.[0]?.t || 0; for (let i = T.length; i < 8; i++) T.push(a + (D - a) * (i + .5) / 8); T.sort((x, y) => x - y); }
  const el = document.createElement('video'); el.muted = true; el.playsInline = true; const url = URL.createObjectURL(blob); el.src = url;
  await new Promise(ok => { el.onloadeddata = ok; setTimeout(ok, 5000); });
  const tw = 480, th = Math.round(tw * (el.videoHeight || 9) / (el.videoWidth || 16)), cv = document.createElement('canvas'); cv.width = tw * 4; cv.height = th * 2; const g = cv.getContext('2d');
  for (let i = 0; i < 8; i++) { await new Promise(ok => { el.onseeked = ok; el.currentTime = T[i]; setTimeout(ok, 1500); });
    const x = (i % 4) * tw, y = Math.floor(i / 4) * th; g.drawImage(el, x, y, tw, th);
    const f = anaFrameAt(P, T[i]); if (f) anaDraw(g, f, P, z => x + z / P.W * tw, z => y + z / P.H * th, .8);
    g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(x, y, 150, 26); g.fillStyle = '#fff'; g.font = '600 15px system-ui'; g.fillText(`${fx(T[i] / slow, 3)} s`, x + 8, y + 18); }
  URL.revokeObjectURL(url);
  cv.toBlob(b => { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `${(v.title || 'video').replace(/[^\w\- ]+/g, '').trim() || 'video'}-planche.png`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); toast('Image enregistrée'); }, 'image/png');
}
// L'image la plus proche où le bonhomme est trouvé (un trou de quelques images ne le fait plus disparaître).
function anaFrameAt(P, t) { if (!P?.F?.length) return null; let b = null, bd = 1e9; for (const f of P.F) { if (!f.p) continue; const d = Math.abs(f.t - t); if (d < bd) { bd = d; b = f; } } return bd <= (P.step2 || P.step) * 4 ? b?.p : null; }
function anaDraw(g, p, P, X, Y, s = 1) {
  if (typeof rcDrawPose !== 'function' || !p) return;
  rcDrawPose(g, p.map(q => ({x: q[0], y: q[1], visibility: q[2]})), X, Y, s);
}
// Le bonhomme par-dessus la vidéo, à l'image affichée.
function anaBind(el) {
  const box = el.closest('.vbox'); if (!box) return; let cv = box.querySelector('canvas.vpose'); if (!cv) { cv = document.createElement('canvas'); cv.className = 'vpose'; box.appendChild(cv); }
  const id = VP.id, draw = async () => { if (VP.id !== id) return; const P = ANA.cache[id] || (ANA.cache[id] = await vdbGet('p:' + id)); const r = box.getBoundingClientRect(), d = devicePixelRatio || 1;
    cv.width = r.width * d; cv.height = r.height * d; const g = cv.getContext('2d'); g.setTransform(d, 0, 0, d, 0, 0); g.clearRect(0, 0, r.width, r.height); if (!P || !el.videoWidth) return;
    const a = el.videoWidth / el.videoHeight, ew = el.clientWidth, eh = el.clientHeight, w = ew / eh > a ? eh * a : ew, h = ew / eh > a ? eh : ew / a, ox = el.offsetLeft + (ew - w) / 2, oy = el.offsetTop + (eh - h) / 2;
    const f = anaFrameAt(P, el.currentTime); if (f) anaDraw(g, f, P, z => ox + z / P.W * w, z => oy + z / P.H * h, .7); };
  el.addEventListener('seeked', draw); el.addEventListener('loadeddata', draw);
  el.addEventListener('play', () => { const loop = () => { if (el.paused || VP.id !== id) return; draw(); ANA.raf = requestAnimationFrame(loop); }; loop(); });
  ANA.redraw = draw; setTimeout(draw, 300);
}
async function anaGo(id) {
  if (ANA.busy) return; ANA.busy = id; const pr = () => document.querySelector('[data-anaprog]'), btn = document.querySelector('[data-anago]');
  if (btn) btn.disabled = true;
  try { if (pr()) pr().textContent = 'Chargement du bonhomme… (une seule fois, environ 30 Mo)';
    const P = await anaPose(id, f => { const e = pr(); if (e) e.textContent = `Analyse image par image… ${Math.round(f * 100)} %`; });
    const v = vids().find(x => x.id === id), A = anaCompute(v, P);
    vidUp(id, x => ({...x, an: A}), true); const nv = vids().find(x => x.id === id);
    const r = document.querySelector('[data-anares]'); if (r) r.innerHTML = anaResHtml(nv);
    if (pr()) pr().textContent = A.err || `${A.rows.length} mesures · le bonhomme est sur la vidéo, avance image par image pour le voir.`;
    if (btn) btn.textContent = 'Refaire l\'analyse'; ANA.redraw?.(); oneHap?.(10);
  } catch (e) { if (pr()) pr().textContent = String(e?.message || e); }
  finally { ANA.busy = null; if (btn) btn.disabled = false; }
}
function anaParse(txt) {
  const m = txt.match(/```json\s*([\s\S]*?)```/) || txt.match(/(\{[\s\S]*"tnr"\s*:\s*"analyse"[\s\S]*\})/); if (!m) return null;
  try { const j = JSON.parse(m[1].trim()); if (j.tnr !== 'analyse') return null; const cl = L => (Array.isArray(L) ? L : []).filter(x => x && x.t).map(x => ({t: String(x.t).slice(0, 200), k: x.k || '', axe: x.axe || null, prio: +x.prio || null, cue: x.cue || '', drill: x.drill || ''}));
    return {forts: cl(j.forts), faibles: cl(j.faibles), cue: String(j.cue || '').slice(0, 80), resume: String(j.resume || '').slice(0, 900), ex: j.ex || null, at: new Date().toISOString()}; } catch (e) { return null; }
}
document.addEventListener('click', async e => { if (!VP.id) return; let b; const v = vids().find(x => x.id === VP.id); if (!v) return;
  if (e.target.closest?.('[data-anago]')) { anaGo(VP.id); return; }
  if (e.target.closest?.('[data-anaask]')) { try { await navigator.clipboard.writeText(anaPrompt(v)); toast('Demande copiée : colle-la dans Claude avec la vidéo'); } catch (er) { toast('Copie impossible'); } return; }
  if (e.target.closest?.('[data-anasheet]')) { toast('Préparation de l\'image…'); anaSheet(v); return; }
});
document.addEventListener('change', e => { if (!VP.id) return; const t = e.target; if (!t.matches?.('[data-anaset]')) return; vidUp(VP.id, x => ({...x, [t.dataset.anaset]: t.value}), true); });
document.addEventListener('input', e => { if (!VP.id || !e.target.matches?.('[data-anapaste]')) return; const c = anaParse(e.target.value); if (!c) return;
  vidUp(VP.id, x => ({...x, coach: c, ...(c.ex && vKind(x) === 'lift' ? {ex: c.ex} : {})}), true); e.target.value = ''; const r = document.querySelector('[data-anares]'); if (r) r.innerHTML = anaResHtml(vids().find(x => x.id === VP.id)); toast('Analyse du coach rangée'); oneHap?.(10); });

/* ---------- 6) Le profil dans la page des vidéos, et l'évolution ---------- */
// La courbe : pour chaque vidéo analysée, la part de points au vert (bien = 1, à affiner = 0,5).
function anaCurve(L) {
  const pts = L.filter(v => v.an?.rows?.length).map(v => { const R = v.an.rows; return {d: v.d, y: Math.round(R.reduce((a, r) => a + (r.lvl === 'good' ? 1 : r.lvl === 'warn' ? .5 : 0), 0) / R.length * 100)}; });
  if (pts.length < 2) return '';
  const W = 320, H = 110, X = i => 14 + i * (W - 28) / (pts.length - 1), Y = y => 12 + (100 - y) * (H - 34) / 100;
  return `<div class="card ancurve"><span class="eyebrow">Ton évolution · part des points au vert</span><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Évolution"><line x1="14" x2="${W - 14}" y1="${Y(50)}" y2="${Y(50)}" class="ancg"/><polyline points="${pts.map((p, i) => X(i).toFixed(1) + ',' + Y(p.y).toFixed(1)).join(' ')}" class="ancl"/>${pts.map((p, i) => `<circle cx="${X(i).toFixed(1)}" cy="${Y(p.y).toFixed(1)}" r="3.5" class="ancd"/>`).join('')}
    <text x="14" y="${H - 4}" class="anct">${esc(fmtShort(pts[0].d))}</text><text x="${W - 14}" y="${H - 4}" text-anchor="end" class="anct">${esc(fmtShort(pts.at(-1).d))}</text></svg>
    <p class="small" style="margin:2px 2px 0"><b>${pts[0].y} % → ${pts.at(-1).y} %</b> ${pts.at(-1).y > pts[0].y ? 'de points au vert : tu progresses.' : pts.at(-1).y < pts[0].y ? 'de points au vert : regarde ce qui a baissé plus bas.' : 'de points au vert.'}</p></div>`;
}
function anaProfileHtml(kind) {
  const {L, P} = anaAgg(kind), n = L.filter(v => v.an || v.coach).length;
  const item = (o, i) => `<button type="button" class="anpi" data-vidplay="${esc(o.vid)}">${i != null ? `<em class="annum">${i + 1}</em>` : ''}<b>${esc(o.n)}</b><small>${esc(o.txt)} · vu ${o.cnt} fois${o.trend > 0 ? ' · progresse' : o.trend < 0 ? ' · baisse' : ''}</small>${o.sure ? '' : anPill}</button>`;
  // Fort ou faible seulement s'il revient (2 vidéos ou plus, même verdict) ; classé par répétition × poids sur le 100 m.
  const w = o => anImp(o) * Math.min(o.cnt, 5) * (o.lvl === 'good' ? o.sc : 2 - o.sc), S2 = P.filter(o => o.lvl !== 'warn').sort((a, b) => w(b) - w(a));
  const F = S2.filter(o => o.sure && o.lvl === 'good'), B = S2.filter(o => o.sure && o.lvl === 'bad'), U = S2.filter(o => !o.sure);
  const box = (t, L) => `<div class="an2b"><span class="an3t">${t} · ${L.length}</span>${L.map(item).join('') || '<p class="muted">Rien de sûr pour l\'instant</p>'}</div>`;
  return `<div id="anaprof" class="sec-label" style="margin-top:22px">Mon profil · ${n} vidéo${n > 1 ? 's' : ''} analysée${n > 1 ? 's' : ''}</div>
    ${n ? `${anaCurve(L)}<div class="an2">${box('Points forts', F)}${box('Points faibles', B)}</div>
    ${U.length ? `<div class="an2u"><span class="an3t">À vérifier</span><p class="small muted" data-tip="1">Vus sur une seule vidéo : un jour de fatigue ou de vent ne suffit pas. Ils montent dans les cadres quand ils reviennent.</p>${U.some(o => o.lvl === 'good') ? `<p class="an2h">Points forts</p>${U.filter(o => o.lvl === 'good').map(o => item(o)).join('')}` : ''}${U.some(o => o.lvl === 'bad') ? `<p class="an2h">Points faibles</p>${U.filter(o => o.lvl === 'bad').map(o => item(o)).join('')}` : ''}</div>` : ''}
    <p class="small muted" data-tip="1" style="margin:8px 4px 0">Classés par ce qui revient le plus et ce qui pèse le plus sur ton 100 m.</p>`
    : '<p class="small muted" data-tip="1" style="margin:4px 4px 0">Ton profil apparaîtra après ta première analyse.</p>'}`;
}
// Profil : tes qualités physiques (l'hexagone), puis les deux analyses et leurs points forts · faibles (même page, plus bas).
function proAnaCards() {
  const c = k => { const L = vids().filter(v => vKind(v) === k), a = L.filter(v => v.an || v.coach).length, {P} = anaAgg(k); return {L, a, P}; }, R = c('run'), M = c('lift');
  const box = (k, t, o) => `<button type="button" class="card pac" data-proana="${k}"><span class="eyebrow">Analyse</span><b>${t}</b><small>${o.L.length ? `${o.L.length} vidéo${o.L.length > 1 ? 's' : ''} · ${o.a} analysée${o.a > 1 ? 's' : ''}` : 'Filme ou ajoute une vidéo'}</small></button>`;
  const pts = (k, o) => { const g = o.P.filter(x => x.lvl === 'good' && x.sure).length, b = o.P.filter(x => x.lvl === 'bad' && x.sure).length;
    return `<button type="button" class="card pac pts" data-propts="${k}"><span class="eyebrow">Points forts · faibles</span>${o.P.length ? `<p class="pacl">${anDot('good')}${g} fort${g > 1 ? 's' : ''}</p><p class="pacl">${anDot('bad')}${b} faible${b > 1 ? 's' : ''}</p>` : '<small>Après ta première analyse.</small>'}</button>`; };
  const hx = typeof hxCard === 'function' ? hxCard() : '';
  return `${hx}<div class="sec-label">Mes analyses vidéo</div><div class="pagrid">${box('run', 'Ma dynamique de course', R)}${box('lift', 'Mes mouvements · musculation', M)}${pts('run', R)}${pts('lift', M)}</div>`;
}
document.addEventListener('click', e => { let b;
  if ((b = e.target.closest?.('[data-proana]'))) { vidPane('', b.dataset.proana); return; }
  if ((b = e.target.closest?.('[data-propts]'))) { vidPane('', b.dataset.propts, true); return; } });
const tProfile0 = tProfile;
tProfile = function () { const h = tProfile0(); return h.replace('<div class="sec-label">Mes résultats</div>', proAnaCards() + '<div class="sec-label">Mes résultats</div>'); };
// La consigne aussi pendant la séance de sprint.
const liveBody0 = liveBody;
liveBody = function () { const h = liveBody0(), L = S.live, p = L && L.kind === 'track' ? planById(L.plan) : null; return (p ? cueCard(p) : '') + h; };
