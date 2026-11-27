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
const K_AXE = {ct: 'contact', td: 'contact', shin: 'contact', knee: 'contact', fq: 'freq', sep: 'freq', thigh: 'freq', rise: 'releve', trunk1: 'releve', head: 'tete', heel: 'talons', set: 'ligne', trunk: 'relache'};
// Une consigne de 3 à 7 mots par axe (coach-sprint › defauts.md).
const AXE_CUE = {contact: 'Pied sous la hanche', freq: 'Genou devant, vite', releve: 'Pousse le sol derrière toi', tete: 'Regarde le sol à 3 m', talons: 'Genou devant, pied bas', relache: 'Visage mou, épaules basses', ligne: 'Épaules sur les mains', fv: 'Vite, pas fort'};

/* ---------- géométrie ---------- */
const anDg = r => r * 180 / Math.PI;
const anVA = (dx, up) => anDg(Math.atan2(dx, up));
const anA3 = (a, b, c) => { const ux = a[0] - b[0], uy = a[1] - b[1], wx = c[0] - b[0], wy = c[1] - b[1], n = Math.hypot(ux, uy) * Math.hypot(wx, wy); return n ? anDg(Math.acos(Math.max(-1, Math.min(1, (ux * wx + uy * wy) / n)))) : NaN; };
const anDist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const anMid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
const anMed = L => { const s = L.filter(x => Number.isFinite(x)).sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)] : NaN; };
const anMean = L => { const s = L.filter(x => Number.isFinite(x)); return s.length ? s.reduce((a, b) => a + b, 0) / s.length : NaN; };
const AN_SIDE = {G: {hip: 23, knee: 25, ank: 27, heel: 29, toe: 31, sh: 11, el: 13, wr: 15, ear: 7}, D: {hip: 24, knee: 26, ank: 28, heel: 30, toe: 32, sh: 12, el: 14, wr: 16, ear: 8}};

/* ---------- 1) le bonhomme sur chaque image ---------- */
async function anaPose(id, onp) {
  const v = vids().find(x => x.id === id), blob = await vdbGet(id); if (!v || !blob) throw new Error('La vidéo n\'est pas sur cet appareil.');
  const lm = await (typeof rcPoseHeavy === 'function' ? rcPoseHeavy() : null); if (!lm) throw new Error('Le bonhomme ne se charge pas (connexion ?).');
  const el = document.createElement('video'); el.muted = true; el.playsInline = true; el.preload = 'auto'; const url = URL.createObjectURL(blob); el.src = url;
  await new Promise((ok, ko) => { el.onloadeddata = ok; el.onerror = () => ko(new Error('Vidéo illisible')); setTimeout(ok, 6000); });
  const m = v.m || {}, D = el.duration || 0, a = m.t0 != null && m.t1 > m.t0 ? Math.max(0, m.t0 - .3) : 0, b = m.t0 != null && m.t1 > m.t0 ? Math.min(D, m.t1 + .3) : D;
  const fps = +v.fps || 30, step = Math.max(1 / fps, (b - a) / 420), F = [], W = el.videoWidth || 1, H = el.videoHeight || 1;
  for (let t = a; t <= b + 1e-6; t += step) {
    await new Promise(ok => { const done = () => { el.removeEventListener('seeked', done); ok(); }; el.addEventListener('seeked', done); el.currentTime = Math.min(t, D - .001); setTimeout(done, 1500); });
    ANA.ts = Math.max(performance.now(), ANA.ts + 1);
    let r = null; try { r = lm.detectForVideo(el, ANA.ts); } catch (e) {}
    const p = r?.landmarks?.[0]; F.push({t, p: p ? p.map(q => [+(q.x * W).toFixed(1), +(q.y * H).toFixed(1), +(q.visibility ?? 1).toFixed(2)]) : null});
    onp?.((t - a) / Math.max(.001, b - a));
  }
  URL.revokeObjectURL(url);
  const P = {W, H, step, fps, F}; await vdbPut('p:' + id, P); ANA.cache[id] = P; return P;
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
  const hx0 = hipC(idx[0])[0], hx1 = hipC(idx.at(-1))[0], moving = Math.abs(hx1 - hx0) > leg;
  const nose = anMean(idx.map(i => pt(i, 0)[0] - (pt(i, 7)[0] + pt(i, 8)[0]) / 2)), dir = moving ? Math.sign(hx1 - hx0) : (nose >= 0 ? 1 : -1);
  const foot = (i, s) => anMid(pt(i, AN_SIDE[s].heel), pt(i, AN_SIDE[s].toe));
  const trunk = i => { const h = hipC(i), s = shC(i); return anVA((s[0] - h[0]) * dir, h[1] - s[1]); };
  const thigh = (i, s) => { const h = pt(i, AN_SIDE[s].hip), k = pt(i, AN_SIDE[s].knee); return anVA((k[0] - h[0]) * dir, k[1] - h[1]); };
  const shin = (i, s) => { const a = pt(i, AN_SIDE[s].ank), k = pt(i, AN_SIDE[s].knee); return anVA((k[0] - a[0]) * dir, a[1] - k[1]); };
  const knee = (i, s) => anA3(pt(i, AN_SIDE[s].hip), pt(i, AN_SIDE[s].knee), pt(i, AN_SIDE[s].ank));
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
  const real = i => P.F[i].t / slow, prec = Math.round(dtr * 1000);
  const S = C.map((c, k) => { const o = c.s === 'G' ? 'D' : 'G', nx = C[k + 1], i = c.a, end = nx ? nx.a : Math.min(n - 1, c.b + win);
    let tl = -90, hk = 180; for (let j = c.a; j <= end; j++) if (ok[j]) { tl = Math.max(tl, thigh(j, o)); if (j <= c.b && thigh(j, o) < 10) hk = Math.min(hk, knee(j, o)); }
    return {n: k + 1, s: c.s, t: real(i), ct: c.tm ?? (c.b - c.a + 1) * dtr, td: (foot(i, c.s)[0] - hipC(i)[0]) * dir / leg, shin: shin(i, c.s), knee: knee(i, c.s),
      sep: Math.abs(thigh(i, c.s) - thigh(i, o)), trunk: trunk(i), head: head(i), tl, hk}; });
  // La position « prêt » : mains au sol, corps immobile, au début de la vidéo.
  let set = null; for (const i of idx.slice(0, Math.ceil(idx.length / 3))) { const w = anMid(pt(i, 15), pt(i, 16)), kn = anMid(pt(i, 25), pt(i, 26));
    if (w[1] > kn[1] - .05 * leg) { const s = shC(i), arm = anDist(pt(i, 11), pt(i, 15)) || leg / 2; set = {i, off: (s[0] - w[0]) * dir / arm}; } else if (set) break; }
  const tr = anMed(S.map(x => x.trunk)), ph = v.phase && v.phase !== 'auto' ? v.phase : set ? 'depart' : tr > 22 ? 'acc' : 'vmax', acc = ph === 'depart' || ph === 'acc';
  const R = [], T = L => L.filter(Boolean), cts = S.map(x => x.ct), span = S.length >= 3 ? S.at(-1).t - S[0].t : NaN, fq = S.length >= 3 ? (S.length - 1) / span : NaN;
  const pr = dtr > .02 ? ` · précision ± ${prec} ms (filme au ralenti pour mieux)` : '';
  if (set) R.push(anRow('set', 'Épaules au-dessus des mains', set.off, `${set.off > 0 ? 'devant' : 'derrière'} de ${Math.round(Math.abs(set.off) * 100)} % du bras`, anLv(set.off, .15, .3), 'juste au-dessus, au plus 15 % du bras devant'));
  if (S.length) {
    const ctm = anMean(cts);
    R.push(acc ? anRow('ct', 'Temps de contact (premiers appuis)', ctm, Math.round(ctm * 1000) + ' ms' + pr, anLv(ctm, .2, .25), '0,17 à 0,23 s au départ') : anRow('ct', 'Temps de contact', ctm, Math.round(ctm * 1000) + ' ms' + pr, anLv(ctm, .11, .13), 'moins de 0,11 s à vitesse max (meilleurs : 0,08 à 0,10)'));
    if (Number.isFinite(fq)) R.push(anRow('fq', 'Fréquence de foulée', fq, fx(fq, 2) + ' pas/s', acc ? anLv(fq, 4.0, 3.6, true) : anLv(fq, 4.4, 4.1, true), acc ? '3,8 à 4,4 pas/s en accélération' : '4,3 à 4,7 pas/s (bon national)'));
    const td = anMed(S.map(x => x.td)); R.push(acc ? anRow('td', 'Pied posé par rapport à la hanche', td, `${td > 0 ? 'devant' : 'derrière'}, ${Math.round(Math.abs(td) * 100)} % de la jambe`, anLv(td, .05, .15), 'sous ou derrière la hanche au départ')
      : anRow('td', 'Pied posé devant la hanche', td, `${Math.round(td * 100)} % de la longueur de jambe`, anLv(td, .3, .4), 'au plus 30 % de la jambe (≈ 25 à 35 cm)'));
    const sh = anMed(S.map(x => x.shin)); R.push(acc ? anRow('shin', 'Tibia à la pose', sh, `${Math.round(sh)}° vers l'avant`, anLv(sh, 35, 20, true), '40 à 50° vers l\'avant au 1er appui') : anRow('shin', 'Tibia à la pose', sh, `${sh >= 0 ? Math.round(sh) + '° vers l\'avant' : Math.round(-sh) + '° vers l\'arrière (cheville devant le genou)'}`, anLv(sh, -5, -12, true), 'proche de la verticale'));
    if (!acc) { const kn = anMed(S.map(x => x.knee)); R.push(anRow('knee', 'Genou à la pose', kn, Math.round(kn) + '°', kn >= 145 && kn <= 168 ? 'good' : kn >= 138 && kn <= 175 ? 'warn' : 'bad', '150 à 160°'));
      const sp = anMed(S.map(x => x.sep)); R.push(anRow('sep', 'Écart des cuisses à la pose', sp, Math.round(sp) + '°', anLv(sp, 20, 35), 'genou libre à côté du genou d\'appui (≤ 20°)'));
      const tl = anMed(S.map(x => x.tl)); R.push(anRow('thigh', 'Cuisse libre au plus haut', tl, `${Math.round(90 - tl)}° sous l'horizontale`, anLv(90 - tl, 20, 35), 'presque horizontale (≤ 20° dessous)'));
      R.push(anRow('trunk', 'Tronc à vitesse max', tr, Math.round(tr) + '° vers l\'avant', tr >= -3 && tr <= 12 ? 'good' : tr <= 20 ? 'warn' : 'bad', '0 à 10°, stable')); }
    if (acc) { const t1 = S[0].trunk; if (ph === 'depart') R.push(anRow('trunk1', 'Tronc au 1er appui', t1, Math.round(t1) + '° (par rapport à la verticale)', anLv(t1, 40, 30, true), '40 à 50°'));
      const k4 = S.slice(0, Math.min(5, S.length)); if (k4.length >= 3) { const drop = (k4[0].trunk - k4.at(-1).trunk) / (k4.length - 1); R.push(anRow('rise', 'Redressement du tronc', drop, `${fx(drop, 1)}° par appui (${Math.round(k4[0].trunk)}° → ${Math.round(k4.at(-1).trunk)}°)`, anLv(drop, 5, 8), '2 à 5° par appui, régulier')); }
      const hk = S.slice(0, 4).filter(x => x.hk < 180).map(x => x.hk); if (hk.length >= 2) { const m = anMed(hk); R.push(anRow('heel', 'Talon de la jambe libre', m, `genou fermé à ${Math.round(m)}°${m < 45 ? ' : talon vers la fesse' : ''}`, anLv(m, 0, 0) && (m >= 55 ? 'good' : m >= 45 ? 'warn' : 'bad'), 'talon bas, genou qui avance (≥ 55°)')); } }
    const hd = anMed(S.slice(0, acc ? 4 : 99).map(x => x.head)); R.push(anRow('head', 'Tête', hd, hd < -10 ? `relevée de ${Math.round(-hd)}° par rapport au dos` : 'dans l\'alignement du dos', hd >= -20 ? 'good' : hd >= -32 ? 'warn' : 'bad', 'alignée avec le tronc'));
    const g = S.filter(x => x.s === 'G').map(x => x.ct), d = S.filter(x => x.s === 'D').map(x => x.ct);
    if (g.length >= 2 && d.length >= 2 && dtr <= .02) { const a = anMean(g), b = anMean(d), gap = Math.abs(a - b) / Math.max(a, b) * 100; R.push(anRow('sym', 'Contact gauche / droite', gap, `G ${Math.round(a * 1000)} · D ${Math.round(b * 1000)} ms (${Math.round(gap)} %)`, anLv(gap, 8, 15), 'moins de 8 % d\'écart')); }
  }
  return {at: Date.now(), kind: 'run', ph, manual, prec, steps: S.map(x => ({n: x.n, s: x.s, t: +x.t.toFixed(3), ct: +x.ct.toFixed(3), td: +x.td.toFixed(2), shin: Math.round(x.shin), knee: Math.round(x.knee), sep: Math.round(x.sep), trunk: Math.round(x.trunk)})), rows: T(R), err: S.length ? '' : 'Aucun appui trouvé : filme de côté, caméra fixe, ou marque les appuis à la main.'};
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
const anaCompute = (v, P) => vKind(v) === 'lift' ? anaLift(v, P) : anaRun(v, P);

/* ---------- 3) points forts · points faibles (toutes les vidéos) ---------- */
function anaPts(kind) {
  const L = vids().filter(v => vKind(v) === kind && (v.an?.rows?.length || v.coach)).sort((a, b) => (b.d || '').localeCompare(a.d || '') || (b.at || 0) - (a.at || 0)), seen = new Set(), F = [], W = [];
  const exN = id => LIFT_EX.find(x => x[0] === id)?.[1] || '';
  for (const v of L) { const pre = kind === 'lift' ? (v.ex || '') + ':' : '', tag = kind === 'lift' ? exN(v.ex) : (RUN_PH.find(x => x[0] === v.an?.ph)?.[1] || '');
    const put = (it, good, src) => { const key = pre + (it.k || it.t); if (seen.has(key)) return; seen.add(key); (good ? F : W).push({...it, d: v.d, vid: v.id, src, tag}); };
    for (const it of v.coach?.faibles || []) put({...it, lvl: 'bad', axe: it.axe || K_AXE[it.k] || null}, false, 'coach');
    for (const it of v.coach?.forts || []) put({...it, lvl: 'good'}, true, 'coach');
    for (const r of v.an?.rows || []) put({t: `${r.n} : ${r.txt}`, k: r.k, lvl: r.lvl, axe: r.axe, ref: r.ref}, r.lvl === 'good', 'auto'); }
  W.sort((a, b) => (a.lvl === 'bad' ? 0 : 1) - (b.lvl === 'bad' ? 0 : 1) || (a.prio || 9) - (b.prio || 9));
  return {forts: F, faibles: W, n: L.length};
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
function anaResHtml(v) {
  const A = v.an, C = v.coach;
  const coach = C ? `<div class="card anac"><span class="eyebrow">L'analyse du coach${C.at ? ' · ' + esc(fmtShort(C.at.slice(0, 10))) : ''}</span>${C.cue ? `<b class="cuet">« ${esc(C.cue)} »</b>` : ''}${C.resume ? `<p class="small">${esc(C.resume)}</p>` : ''}
    ${(C.forts || []).map(x => `<div class="anar">${anDot('good')}<span>${esc(x.t)}</span></div>`).join('')}${(C.faibles || []).map(x => `<div class="anar">${anDot('bad')}<span>${esc(x.t)}${x.drill ? `<small>Exercice : ${esc(x.drill)}</small>` : ''}</span></div>`).join('')}</div>` : '';
  if (!A) return coach + '<p class="small muted" data-tip="1" style="margin:8px 4px 0">Pas encore analysée.</p>';
  if (A.err && !A.rows?.length) return coach + `<p class="small" style="color:var(--warn);margin:8px 4px 0">${esc(A.err)}</p>`;
  const tab = A.kind === 'run' && A.steps?.length ? `<details class="anadet"><summary>Appui par appui (${A.steps.length})</summary><table class="anat"><tr><th>#</th><th>Pied</th><th>Contact</th><th>Pied-hanche</th><th>Tibia</th><th>Tronc</th></tr>${A.steps.map(s => `<tr><td>${s.n}</td><td>${s.s}</td><td>${Math.round(s.ct * 1000)} ms</td><td>${Math.round(s.td * 100)} %</td><td>${s.shin}°</td><td>${s.trunk}°</td></tr>`).join('')}</table></details>`
    : A.reps?.length ? `<details class="anadet"><summary>Répétition par répétition (${A.reps.length})</summary><table class="anat"><tr><th>#</th><th>Descente</th><th>Montée</th><th>Genou</th><th>Tronc</th></tr>${A.reps.map(r => `<tr><td>${r.n}</td><td>${fx(r.desc, 2)} s</td><td>${fx(r.asc, 2)} s</td><td>${r.knee}°</td><td>${r.trunk}°</td></tr>`).join('')}</table></details>` : '';
  return coach + `<div class="anarows">${A.rows.map(r => `<div class="anar">${anDot(r.lvl)}<span><b>${esc(r.n)}</b> ${esc(r.txt)}<small>Repère : ${esc(r.ref)}</small></span></div>`).join('')}</div>${tab}
    <p class="small muted" data-tip="1" style="margin:6px 4px 0">${A.kind === 'run' ? `Phase : ${esc(RUN_PH.find(x => x[0] === A.ph)?.[1] || '')}${A.manual ? ' · appuis marqués à la main' : ' · appuis trouvés seuls'}` : `Côté mesuré : ${A.side === 'G' ? 'gauche' : 'droit'}`}. L'appli mesure ce qu'elle voit en 2D : une vidéo en biais fausse les angles.</p>`;
}
function anaSection(v) {
  const k = vKind(v);
  return `<div class="sec-label">Analyse du corps</div>
    <div class="seg ana-k">${[['run', 'Course'], ['lift', 'Musculation']].map(([x, l]) => `<button type="button" data-anakind="${x}" aria-pressed="${k === x}">${l}</button>`).join('')}</div>
    ${k === 'lift' ? `<div class="cap-g2"><label class="cap-f">Exercice<select class="mini-in" data-anaset="ex">${LIFT_EX.map(([x, l]) => `<option value="${x}"${(v.ex || 'squat') === x ? ' selected' : ''}>${l}</option>`).join('')}</select></label>
      <label class="cap-f">Filmé<select class="mini-in" data-anaset="view">${[['side', 'De côté'], ['front', 'De face']].map(([x, l]) => `<option value="${x}"${(v.view || 'side') === x ? ' selected' : ''}>${l}</option>`).join('')}</select></label></div>`
    : `<label class="cap-f">Phase de la course<select class="mini-in" data-anaset="phase">${RUN_PH.map(([x, l]) => `<option value="${x}"${(v.phase || 'auto') === x ? ' selected' : ''}>${l}</option>`).join('')}</select></label>`}
    <button type="button" class="btn" style="width:100%;margin-top:10px" data-anago>${v.an ? 'Refaire l\'analyse' : 'Analyser mon corps sur cette vidéo'}</button>
    <p class="small muted" data-tip="1" data-anaprog style="margin:6px 4px 0">${k === 'run' ? 'De côté, caméra fixe, au ralenti si possible. Marque Départ et Arrivée pour n\'analyser que ce passage.' : 'Tout le corps dans l\'image, caméra fixe. De côté pour les angles, de face pour les genoux.'}</p>
    <div data-anares>${anaResHtml(v)}</div>
    <div class="sec-label">Le coach ${k === 'run' ? 'sprint' : 'muscu'}</div>
    <div class="btnrow two"><button type="button" class="btn ghost" data-anaask>Demander à Claude</button><button type="button" class="btn ghost" data-anasheet>Image pour Claude</button></div>
    <p class="small muted" data-tip="1" style="margin:6px 4px 0">« Demander » copie la demande avec tes mesures ; « Image » enregistre 8 images clés avec le bonhomme. Envoie-les à Claude (onglet Code) avec la vidéo, puis colle sa réponse ici.</p>
    <textarea class="mini-in" rows="3" data-anapaste placeholder="Colle ici la réponse de Claude (avec le bloc json)" style="width:100%;margin-top:8px"></textarea>`;
}
function anaPrompt(v) {
  const A = v.an, k = vKind(v), ex = LIFT_EX.find(x => x[0] === v.ex)?.[1];
  const c = typeof capGet === 'function' ? capGet() : null, ax = c ? capAxes(c).map((a, i) => `${i + 1}. ${a.n} (id « ${a.id} », importance ${a.imp}, rapidité ${a.rap})`).join('\n') : '';
  return `Utilise le skill « ${k === 'run' ? 'coach-sprint' : 'prepa-physique'} ». Analyse ${k === 'run' ? 'ma course' : 'mon ' + (ex || 'mouvement')} sur la vidéo jointe (« ${v.title || 'vidéo'} », ${v.d}${+v.slow > 1 ? `, ralenti ×${v.slow}` : ''}, fichier à ${v.fps || 30} images/s${k === 'lift' ? `, filmé ${v.view === 'front' ? 'de face' : 'de côté'}` : ''}).
Extrais les images (scripts/extraire_images.py du skill coach-sprint), regarde-les, mesure, compare aux repères, trouve les causes.
${A?.rows?.length ? `\nCe que l'appli a mesuré seule (MediaPipe, en 2D) :\n${A.rows.map(r => `- ${r.n} : ${r.txt} (repère : ${r.ref})`).join('\n')}\n${A.steps?.length ? 'Appuis : ' + A.steps.map(s => `#${s.n} ${s.s} ${Math.round(s.ct * 1000)} ms, pied ${Math.round(s.td * 100)} % de jambe, tronc ${s.trunk}°`).join(' ; ') + '\n' : ''}${A.reps?.length ? 'Répétitions : ' + A.reps.map(r => `#${r.n} descente ${r.desc} s, montée ${r.asc} s, genou ${r.knee}°`).join(' ; ') + '\n' : ''}` : ''}${v.note ? `\nCe que je vois : ${v.note}\n` : ''}${k === 'run' && ax ? `\nMes axes de travail (Ton cap) :\n${ax}\n` : ''}
Réponds en français simple, en tableaux : points forts chiffrés, points faibles classés avec leur cause, UNE consigne, deux exercices${k === 'run' ? ', le complément en salle' : ', ce que tu changes dans mon programme, le lien avec le sprint'}.
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
function anaFrameAt(P, t) { if (!P?.F?.length) return null; let b = null, bd = 1e9; for (const f of P.F) { const d = Math.abs(f.t - t); if (d < bd) { bd = d; b = f; } } return bd <= P.step * 1.5 ? b?.p : null; }
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
  if ((b = e.target.closest?.('[data-anakind]'))) { vidUp(VP.id, x => ({...x, kind: b.dataset.anakind, an: null}), true); const p = P.stack.at(-1); paneRender(); vidLoad(); return; }
  if (e.target.closest?.('[data-anago]')) { anaGo(VP.id); return; }
  if (e.target.closest?.('[data-anaask]')) { try { await navigator.clipboard.writeText(anaPrompt(v)); toast('Demande copiée : colle-la dans Claude avec la vidéo'); } catch (er) { toast('Copie impossible'); } return; }
  if (e.target.closest?.('[data-anasheet]')) { toast('Préparation de l\'image…'); anaSheet(v); return; }
});
document.addEventListener('change', e => { if (!VP.id) return; const t = e.target; if (!t.matches?.('[data-anaset]')) return; vidUp(VP.id, x => ({...x, [t.dataset.anaset]: t.value}), true); });
document.addEventListener('input', e => { if (!VP.id || !e.target.matches?.('[data-anapaste]')) return; const c = anaParse(e.target.value); if (!c) return;
  vidUp(VP.id, x => ({...x, coach: c, ...(c.ex && vKind(x) === 'lift' ? {ex: c.ex} : {})}), true); e.target.value = ''; const r = document.querySelector('[data-anares]'); if (r) r.innerHTML = anaResHtml(vids().find(x => x.id === VP.id)); toast('Analyse du coach rangée'); oneHap?.(10); });

/* ---------- 6) Profil : les 4 cases ---------- */
function proAnaCards() {
  const c = k => { const L = vids().filter(v => vKind(v) === k), a = L.filter(v => v.an || v.coach).length, P = anaPts(k);
    return {L, a, P}; }, R = c('run'), M = c('lift');
  const box = (k, t, o) => `<button type="button" class="card pac" data-proana="${k}"><span class="eyebrow">Analyse</span><b>${t}</b><small>${o.L.length ? `${o.L.length} vidéo${o.L.length > 1 ? 's' : ''} · ${o.a} analysée${o.a > 1 ? 's' : ''}` : 'Ajoute une vidéo'}</small></button>`;
  const pts = (k, o) => { const F = o.P.forts, W = o.P.faibles;
    return `<button type="button" class="card pac pts" data-propts="${k}"><span class="eyebrow">Points forts · points faibles</span>${W.length || F.length ? `${W.slice(0, 2).map(x => `<p class="pacl">${anDot(x.lvl)}${esc(x.t.length > 60 ? x.t.slice(0, 58) + '…' : x.t)}</p>`).join('')}${F.slice(0, 1).map(x => `<p class="pacl">${anDot('good')}${esc(x.t.length > 60 ? x.t.slice(0, 58) + '…' : x.t)}</p>`).join('')}<small>${W.length} à travailler · ${F.length} point${F.length > 1 ? 's' : ''} fort${F.length > 1 ? 's' : ''}</small>` : '<small>Ils apparaîtront après ta première analyse.</small>'}</button>`; };
  return `<div class="sec-label">Mes analyses vidéo</div><div class="pagrid">${box('lift', 'Mes mouvements · musculation', M)}${box('run', 'Ma dynamique de course', R)}${pts('lift', M)}${pts('run', R)}</div>`;
}
function ptsPane(k) {
  openPane({title: k === 'run' ? 'Course · forts et faibles' : 'Muscu · forts et faibles', render: () => { const P = anaPts(k), c = typeof capGet === 'function' ? capGet() : {axes: []}, axN = id => c.axes?.find(a => a.id === id)?.n;
    const it = x => `<button type="button" class="rowbtn" data-vidplay="${esc(x.vid)}"><span>${anDot(x.lvl)}<b>${esc(x.t)}</b><span class="meta">${esc(cap(fmtShort(x.d)))}${x.tag ? ' · ' + esc(x.tag) : ''}${x.src === 'coach' ? ' · coach' : ''}${x.axe && axN(x.axe) ? ' · axe : ' + esc(axN(x.axe)) : ''}${x.cue ? ' · consigne « ' + esc(x.cue) + ' »' : ''}${x.ref ? ' · repère : ' + esc(x.ref) : ''}</span></span>${ICON.chev}</button>`;
    return `<p class="small muted" data-tip="1" style="margin:14px 4px 8px">La dernière mesure de chaque point, sur toutes tes vidéos${k === 'run' ? '. Les points faibles de course choisissent la consigne de tes séances de sprint.' : '.'}</p>
      <div class="sec-label">À travailler (${P.faibles.length})</div><div class="list">${P.faibles.map(it).join('') || '<p class="small muted" data-tip="1">Rien pour l\'instant.</p>'}</div>
      <div class="sec-label">Points forts (${P.forts.length})</div><div class="list">${P.forts.map(it).join('') || '<p class="small muted" data-tip="1">Rien pour l\'instant.</p>'}</div>
      <button type="button" class="btn" style="width:100%;margin-top:14px" data-proana="${k}">Mes vidéos</button>`; }});
}
document.addEventListener('click', e => { let b;
  if ((b = e.target.closest?.('[data-proana]'))) { vidPane('', b.dataset.proana); return; }
  if ((b = e.target.closest?.('[data-propts]'))) { ptsPane(b.dataset.propts); return; } });
const tProfile0 = tProfile;
tProfile = function () { const h = tProfile0(); return h.replace('<div class="sec-label">Mes résultats</div>', proAnaCards() + '<div class="sec-label">Mes résultats</div>'); };
// La consigne aussi pendant la séance de sprint.
const liveBody0 = liveBody;
liveBody = function () { const h = liveBody0(), L = S.live, p = L && L.kind === 'track' ? planById(L.plan) : null; return (p ? cueCard(p) : '') + h; };
