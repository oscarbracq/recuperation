/* ================= Mes vidéos de sprint =================
   Oscar range ici ses vidéos d'entraînement. Chaque vidéo se regarde au ralenti, image par image ; on y chronomètre un
   passage (départ → arrivée) et on marque les appuis (pose du pied, décollage) : l'appli calcule le temps de contact
   et la fréquence de foulée, qui s'affichent dans l'axe de travail lié (« Ton cap »).
   La vidéo reste sur le téléphone où elle a été ajoutée (IndexedDB, rien n'est envoyé) ; sa fiche (titre, note, axes,
   mesures) est rangée dans settings/app.videos, donc visible partout. */
const VDB = {db: null};
function vdb() { return VDB.db ||= new Promise((ok, ko) => { const r = indexedDB.open('tnr-videos', 1); r.onupgradeneeded = () => r.result.createObjectStore('v'); r.onsuccess = () => ok(r.result); r.onerror = () => ko(r.error); }); }
async function vdbPut(id, val) { const d = await vdb(); return new Promise((ok, ko) => { const t = d.transaction('v', 'readwrite'); t.objectStore('v').put(val, id); t.oncomplete = ok; t.onerror = () => ko(t.error); }); }
async function vdbGet(id) { const d = await vdb(); return new Promise(ok => { const r = d.transaction('v').objectStore('v').get(id); r.onsuccess = () => ok(r.result || null); r.onerror = () => ok(null); }); }
async function vdbDel(id) { const d = await vdb(); return new Promise(ok => { const t = d.transaction('v', 'readwrite'); t.objectStore('v').delete(id); t.oncomplete = ok; t.onerror = ok; }); }
const vids = () => S.app?.videos || [];
let VIDT = null;
function vidSave(list, now) { S.app = {...(S.app || {}), videos: list}; clearTimeout(VIDT); const go = () => dbSet('settings/app', {...S.app, updatedAt: new Date().toISOString()}); if (now) go(); else VIDT = setTimeout(go, 700); }
const vidUp = (id, fn, now) => vidSave(vids().map(v => v.id === id ? fn({...v}) : v), now);
// Les mesures d'une vidéo, en temps réel (une vidéo ralentie ×8 se lit 8 fois plus lentement).
function vidCalc(v) {
  const m = v.m || {}, k = +v.slow || 1, out = {};
  if (m.t0 != null && m.t1 != null && m.t1 > m.t0) out.chrono = (m.t1 - m.t0) / k;
  const P = (m.poses || []).slice().sort((a, b) => a - b), O = (m.offs || []).slice().sort((a, b) => a - b), C = [];
  for (const p of P) { const o = O.find(x => x > p); if (o != null && (o - p) / k < .5) C.push((o - p) / k); }
  if (C.length) out.contact = C.reduce((a, b) => a + b, 0) / C.length;
  if (P.length >= 3) out.freq = (P.length - 1) / ((P.at(-1) - P[0]) / k);
  return out;
}
const vidTxt = r => [r.chrono != null ? `chrono ${fx(r.chrono, 2)} s` : '', r.contact != null ? `contact ${Math.round(r.contact * 1000)} ms` : '', r.freq != null ? `${fx(r.freq, 2)} pas/s` : ''].filter(Boolean).join(' · ');
// Pour « Ton cap » : la dernière mesure vidéo liée à un axe.
function vidMeasure(axId) {
  const L = vids().filter(v => (v.axes || []).includes(axId)).sort((a, b) => (b.d || '').localeCompare(a.d || ''));
  // D'abord l'analyse du corps (toutes les vidéos de course), puis les mesures à la main.
  for (const v of vids().filter(x => (x.kind || 'run') === 'run' && x.an?.rows?.length).sort((a, b) => (b.d || '').localeCompare(a.d || ''))) { const r = v.an.rows.find(x => x.axe === axId); if (r) return `Vidéo du ${fmtShort(v.d)} : ${r.n.toLowerCase()} ${r.txt}`; }
  for (const v of L) { const r = vidCalc(v); if (axId === 'contact' && r.contact != null) return `Dernière mesure : ${Math.round(r.contact * 1000)} ms`; if (axId === 'freq' && r.freq != null) return `Dernière mesure : ${fx(r.freq, 2)} pas/s`; const t = vidTxt(r); if (t && !['contact', 'freq'].includes(axId)) return 'Dernière vidéo : ' + t; }
  return '';
}
const VIDF = {ax: '', kind: 'run'};
// kind : « run » (course) ou « lift » (musculation). Une vidéo sans kind est une course. Page entière, fond noir :
// filmer ou choisir une vidéo, la liste, puis (en descendant) les points forts · à affiner · à corriger et leur évolution.
function vidPane(ax, kind, toProfile) {
  VIDF.ax = ''; VIDF.kind = kind || 'run';
  const run = VIDF.kind === 'run';
  openPane({title: run ? 'Ma dynamique de course' : 'Mes mouvements · musculation', full: true, render: () => {
    const L = vids().filter(v => (v.kind || 'run') === VIDF.kind).sort((a, b) => (b.d || '').localeCompare(a.d || '') || (b.taken || b.at || 0) - (a.taken || a.at || 0));
    const sub = v => { const ex = !run && typeof LIFT_EX !== 'undefined' ? LIFT_EX.find(x => x[0] === v.ex)?.[1] : ''; const R = v.an?.rows || [], a = R.length ? `${R.filter(x => x.lvl === 'good').length} bien · ${R.filter(x => x.lvl !== 'good').length} à travailler` : 'pas encore analysée';
      return [ex, a].filter(Boolean).join(' · '); };
    return `<div class="vadd"><label class="btn"><input type="file" accept="video/*" capture="environment" data-vidfile hidden>Filmer</label><label class="btn ghost"><input type="file" accept="video/*" data-vidfile hidden>Choisir une vidéo</label></div>
      <p class="small muted" data-tip="1" style="margin:8px 4px 0">${run ? 'De côté, à 5 à 10 m, caméra fixe à hauteur de hanche, tout le corps dans l\'image.' : 'Tout le corps dans l\'image, caméra fixe à hauteur de hanche, de côté (ou de face pour les genoux).'} La date et les images par seconde sont lues dans la vidéo.</p>
      <div class="vgrid">${L.map(v => `<button type="button" class="vcard" data-vidplay="${esc(v.id)}"><span class="vth" data-vth="${esc(v.id)}"></span><b>${esc(v.title || 'Vidéo')}</b><small>${esc(sub(v))}</small></button>`).join('') || '<p class="small muted" data-tip="1" style="margin:16px 4px">Pas encore de vidéo ici.</p>'}</div>
      ${typeof anaProfileHtml === 'function' ? anaProfileHtml(VIDF.kind) : ''}`; }});
  setTimeout(vidThumbs, 60);
  if (toProfile) setTimeout(() => document.getElementById('anaprof')?.scrollIntoView({behavior: 'smooth', block: 'start'}), 300);
}
/* La fiche de la vidéo lue dans le fichier lui-même (MP4 / MOV) : date de prise de vue (mvhd), images par seconde
   (mdhd + stts de la piste vidéo), et le ralenti d'Android (clé com.android.capture.fps). Rien n'est envoyé. */
async function vidMeta(f) {
  const out = {}, N = f.size, s4 = (d, p) => String.fromCharCode(d.getUint8(p), d.getUint8(p + 1), d.getUint8(p + 2), d.getUint8(p + 3));
  const kids = (d, a, b, cb) => { let p = a; while (p + 8 <= b) { let sz = d.getUint32(p), hs = 8; const ty = s4(d, p + 4); if (sz === 1) { sz = Number(d.getBigUint64(p + 8)); hs = 16; } else if (sz === 0) sz = b - p; if (sz < 8 || p + sz > b) break; cb(ty, p + hs, p + sz, p); p += sz; } };
  try {
    let o = 0, moov = null;
    while (o + 8 <= N) { const d = new DataView(await f.slice(o, o + 16).arrayBuffer()); let sz = d.getUint32(0), hs = 8; const ty = s4(d, 4);
      if (sz === 1) { sz = Number(d.getBigUint64(8)); hs = 16; } else if (sz === 0) sz = N - o;
      if (ty === 'moov') { if (sz < 64e6) moov = new DataView(await f.slice(o + hs, o + sz).arrayBuffer()); break; }
      if (sz < 8) break; o += sz; }
    if (!moov) return out;
    const keys = [];
    const meta = (a, b) => { const st = ['hdlr', 'keys', 'ilst'].includes(s4(moov, a + 4)) ? a : a + 4;
      kids(moov, st, b, (t2, c, e) => {
        if (t2 === 'keys') { const k = moov.getUint32(c + 4); let q = c + 8; for (let i = 0; i < k && q + 8 <= e; i++) { const sz = moov.getUint32(q); let nm = ''; for (let j = q + 8; j < q + sz; j++) nm += String.fromCharCode(moov.getUint8(j)); keys.push(nm); q += sz; } }
        else if (t2 === 'ilst') kids(moov, c, e, (t3, c3, e3, p3) => { const name = keys[moov.getUint32(p3 + 4) - 1];
          if (name === 'com.android.capture.fps') kids(moov, c3, e3, (t4, c4) => { if (t4 === 'data') { const typ = moov.getUint32(c4) & 0xffffff, val = typ === 23 ? moov.getFloat32(c4 + 8) : typ === 24 ? moov.getFloat64(c4 + 8) : NaN; if (val > 0) out.capFps = Math.round(val); } }); }); }); };
    kids(moov, 0, moov.byteLength, (ty, a, b) => {
      if (ty === 'mvhd') { const v = moov.getUint8(a), ct = v ? Number(moov.getBigUint64(a + 4)) : moov.getUint32(a + 4), ms = (ct - 2082844800) * 1000; if (ct && ms > Date.UTC(2005, 0, 1) && ms < Date.now() + 864e5) out.taken = ms; }
      if (ty === 'trak') { let vide = false, ts = 0, du = 0, n = 0;
        const walk = (a2, b2) => kids(moov, a2, b2, (t2, c, e) => {
          if (['mdia', 'minf', 'stbl'].includes(t2)) walk(c, e);
          else if (t2 === 'hdlr') vide = s4(moov, c + 8) === 'vide';
          else if (t2 === 'mdhd') { const v = moov.getUint8(c); ts = moov.getUint32(c + (v ? 20 : 12)); du = v ? Number(moov.getBigUint64(c + 24)) : moov.getUint32(c + 16); }
          else if (t2 === 'stts') { const k = moov.getUint32(c + 4); for (let i = 0; i < k; i++) n += moov.getUint32(c + 8 + i * 8); } });
        walk(a, b); if (vide && ts && du && n) out.fps = Math.round(n / (du / ts)); }
      if (ty === 'meta') meta(a, b);
      if (ty === 'udta') kids(moov, a, b, (t2, c, e) => { if (t2 === 'meta') meta(c, e); });
    });
  } catch (e) {}
  out.slow = out.capFps && out.fps && out.capFps > out.fps * 1.5 ? Math.round(out.capFps / out.fps) : 1;
  return out;
}
const vidDayOf = ms => { const d = new Date(ms); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const vidHour = ms => { const d = new Date(ms); return `${d.getHours()} h ${String(d.getMinutes()).padStart(2, '0')}`; };
const vidTitle = (kind, ms) => `${kind === 'lift' ? 'Muscu' : 'Course'} du ${fmtShort(vidDayOf(ms))} ${new Date(ms).getFullYear()} · ${vidHour(ms)}`;
const VTH = {};
async function vidThumbs() { for (const el of document.querySelectorAll('[data-vth]:not([data-ok])')) { el.dataset.ok = 1; const id = el.dataset.vth;
  if (!(id in VTH)) { const r = await vdbGet('t:' + id).catch(() => null); VTH[id] = r ? URL.createObjectURL(r) : ''; }
  if (VTH[id]) el.style.backgroundImage = `url(${VTH[id]})`; else el.classList.add('none'); } }
// Une image du début de la vidéo, en petit, pour la liste.
function vidThumb(file) { return new Promise(ok => { const v = document.createElement('video'); v.muted = true; v.playsInline = true; v.preload = 'auto'; v.src = URL.createObjectURL(file);
  const done = b => { URL.revokeObjectURL(v.src); ok(b); }; setTimeout(() => done(null), 8000);
  v.onloadeddata = () => { v.currentTime = Math.min(.5, (v.duration || 1) / 3); };
  v.onseeked = () => { try { const w = 320, h = Math.round(w * (v.videoHeight || 9) / (v.videoWidth || 16)), cv = document.createElement('canvas'); cv.width = w; cv.height = h; cv.getContext('2d').drawImage(v, 0, 0, w, h); cv.toBlob(b => done(b), 'image/jpeg', .7); } catch (e) { done(null); } }; }); }
document.addEventListener('change', async e => { const t = e.target; if (!t.matches?.('[data-vidfile]') || !t.files?.[0]) return;
  const f = t.files[0], id = 'v' + Date.now().toString(36); t.value = ''; toast('Vidéo en cours de rangement…');
  try { await vdbPut(id, f); const th = await vidThumb(f); if (th) await vdbPut('t:' + id, th); } catch (er) { toast('Impossible de garder la vidéo sur ce téléphone'); return; }
  const M = await vidMeta(f), ms = M.taken || f.lastModified || Date.now();
  vidSave([...vids(), {id, d: vidDayOf(ms), taken: ms, at: Date.now(), title: vidTitle(VIDF.kind, ms), kind: VIDF.kind || 'run', axes: [], slow: M.slow || 1, fps: M.fps || 30, meta: {fps: M.fps || null, capFps: M.capFps || null, date: M.taken ? 'video' : 'fichier'}, m: {}}], true);
  paneRender(); setTimeout(vidThumbs, 60); vidPlayer(id); });
document.addEventListener('click', e => { let b;
  if ((b = e.target.closest?.('[data-vidopen]'))) { vidPane(b.dataset.vidopen); return; }
  if ((b = e.target.closest?.('[data-vidax]'))) { VIDF.ax = b.dataset.vidax; paneRender(); setTimeout(vidThumbs, 60); return; }
  if ((b = e.target.closest?.('[data-vidplay]'))) { vidPlayer(b.dataset.vidplay); return; } });

/* ---------- le lecteur : ralenti, image par image, analyse ---------- */
const VP = {id: null, url: null};
function vidPlayer(id) {
  const v0 = vids().find(v => v.id === id); if (!v0) return; VP.id = id; VP.t = 0;
  openPane({title: v0.title || 'Vidéo', full: true, onClose: () => { if (VP.url) URL.revokeObjectURL(VP.url); VP.url = null; VP.uid = null; VP.id = null; VP.blob = null; VP.bid = null; VP.t = 0; }, render: () => { const v = vids().find(x => x.id === VP.id); if (!v) return '';
    const mt = v.meta || {};
    return `<div class="vbox"><video class="vplay" playsinline preload="auto" muted data-vvid></video><canvas class="vpose"></canvas><div class="vnone" hidden>Cette vidéo est sur un autre appareil : son analyse est ci-dessous.</div></div>
      <div class="vtime"><b data-vt>0,00 s</b><span>temps réel${+v.slow > 1 ? ` (ralenti ×${v.slow} corrigé)` : ''}</span></div>
      <div class="vctl"><button type="button" data-vc="back" aria-label="Image précédente">‹ Image</button><button type="button" class="vmain" data-vc="play">Lecture</button><button type="button" data-vc="fwd" aria-label="Image suivante">Image ›</button></div>
      <div class="seg vsp">${[.25, .5, 1].map(r => `<button type="button" data-vrate="${r}" aria-pressed="${r === 1}">${r === 1 ? 'Normal' : r === .5 ? 'Ralenti ×2' : 'Ralenti ×4'}</button>`).join('')}</div>
      <p class="small muted" data-tip="1" style="margin:6px 4px 0">« Image » avance ou recule d'une seule image : pour voir le pied toucher le sol.</p>
      ${typeof anaSection === 'function' ? anaSection(v) : ''}
      <details class="anadet vset"><summary>La vidéo · trouvé seul : ${+v.fps || 30} images/s, ${+v.slow > 1 ? `ralenti ×${v.slow}` : 'pas de ralenti'}${mt.date === 'video' ? ', date de la vidéo' : ''}</summary>
        <div class="cap-g2"><label class="cap-f">Ralenti<select class="mini-in" data-vset="slow">${[[1, 'Non'], [2, '×2'], [4, '×4'], [8, '×8'], [16, '×16'], [32, '×32']].map(([k, l]) => `<option value="${k}"${+v.slow === k ? ' selected' : ''}>${l}</option>`).join('')}</select></label>
          <label class="cap-f">Images par seconde<select class="mini-in" data-vset="fps">${[...new Set([24, 25, 30, 50, 60, 120, 240, 480, 960, +v.fps || 30])].sort((a, b) => a - b).map(k => `<option${+v.fps === k ? ' selected' : ''}>${k}</option>`).join('')}</select></label></div>
        <label class="cap-f">Titre<input class="mini-in" data-vtitle value="${esc(v.title || '')}"></label>
        <label class="cap-f">Ce que je ressens<textarea rows="2" data-vnote placeholder="Ex. fatigué, vent de face, 2e essai">${esc(v.note || '')}</textarea></label>
        <button type="button" class="small muted" data-vdel style="padding:14px 0 4px">Supprimer la vidéo</button></details>`; }});
  vidLoad();
}
async function vidLoad() { const el = document.querySelector('[data-vvid]:not([data-on])'); if (!el || !VP.id) return; el.dataset.on = '1'; const id = VP.id;
  // La vidéo est lue une fois ; si le lecteur se redessine, la nouvelle copie reprend la même (avant : écran noir une fois sur deux).
  const b = VP.bid === id && VP.blob ? VP.blob : await vdbGet(id); if (VP.id !== id || !el.isConnected) return; VP.blob = b; VP.bid = id;
  if (!b) { el.hidden = true; el.parentNode.querySelector('.vnone').hidden = false; return; }
  // Une vidéo ajoutée avant : relire sa date et ses images par seconde dans le fichier.
  const v0 = vids().find(x => x.id === VP.id);
  if (v0 && !v0.meta) vidMeta(b).then(M => { const ms = M.taken || b.lastModified || 0, auto = /^(Course|Muscu) du /.test(v0.title || '');
    vidUp(VP.id, x => ({...x, meta: {fps: M.fps || null, capFps: M.capFps || null, date: M.taken ? 'video' : 'fichier'}, ...(M.fps ? {fps: M.fps} : {}), ...(M.slow > 1 ? {slow: M.slow} : {}), ...(ms ? {d: vidDayOf(ms), taken: ms, ...(auto ? {title: vidTitle(x.kind, ms)} : {})} : {})}), true);
    const nv = vids().find(x => x.id === VP.id), tt = document.getElementById('pane-title'); if (tt && nv) tt.textContent = nv.title; });
  if (!(id in VTH)) { const th = await vdbGet('t:' + id).catch(() => null); VTH[id] = th ? URL.createObjectURL(th) : ''; } if (VTH[id]) el.poster = VTH[id];
  if (!(VP.url && VP.uid === id)) { if (VP.url) URL.revokeObjectURL(VP.url); VP.url = URL.createObjectURL(b); VP.uid = id; } const t0 = VP.t || 0; el.src = VP.url;
  // Certains téléphones laissent l'écran noir tant que la vidéo n'a pas bougé : on la pose sur sa première image.
  el.addEventListener('loadedmetadata', () => { try { el.currentTime = t0 || .001; } catch (e) {} }, {once: true});
  el.onerror = () => { const n = el.parentNode.querySelector('.vnone'); n.hidden = false; n.textContent = 'Ce téléphone ne lit pas cette vidéo ici (format HEVC ?). Dans l\'appareil photo, choisis le format le plus compatible (H.264).'; };
  const t = () => { const v = vids().find(x => x.id === VP.id), o = document.querySelector('[data-vt]'); if (o && v) o.textContent = fx(el.currentTime / (+v.slow || 1), 2) + ' s'; };
  if (typeof anaBind === 'function') anaBind(el);
  el.ontimeupdate = () => { VP.t = el.currentTime; t(); }; el.onseeked = () => { VP.t = el.currentTime; t(); }; el.onplay = () => { const p = document.querySelector('[data-vc="play"]'); if (p) p.textContent = 'Pause'; }; el.onpause = () => { const p = document.querySelector('[data-vc="play"]'); if (p) p.textContent = 'Lecture'; }; }
function vidResHtml(v) { const r = vidCalc(v), m = v.m || {};
  return `<div><span>Chrono</span><b>${r.chrono != null ? fx(r.chrono, 2) + ' s' : '–'}</b></div><div><span>Contact au sol</span><b>${r.contact != null ? Math.round(r.contact * 1000) + ' ms' : '–'}</b></div><div><span>Fréquence</span><b>${r.freq != null ? fx(r.freq, 2) + ' pas/s' : '–'}</b></div>
    <small>${(m.poses || []).length} poses · ${(m.offs || []).length} décollages${(m.poses || []).length || m.t0 != null ? ' · <button type="button" class="linkbtn" data-vm="clear">effacer</button>' : ''}</small>`; }
document.addEventListener('click', e => { if (!VP.id) return; const el = document.querySelector('[data-vvid]'); let b;
  const v = vids().find(x => x.id === VP.id); if (!v) return;
  if ((b = e.target.closest?.('[data-vc]')) && el) { const k = b.dataset.vc, st = 1 / (+v.fps || 30);
    if (k === 'play') { if (el.paused) el.play(); else el.pause(); } else { el.pause(); el.currentTime = Math.max(0, Math.min(el.duration || 0, el.currentTime + (k === 'fwd' ? st : -st))); } return; }
  if ((b = e.target.closest?.('[data-vrate]')) && el) { el.playbackRate = +b.dataset.vrate; document.querySelectorAll('[data-vrate]').forEach(x => x.setAttribute('aria-pressed', x === b)); return; }
  if ((b = e.target.closest?.('[data-vm]'))) { const k = b.dataset.vm, t = el ? el.currentTime : 0;
    vidUp(VP.id, x => { const m = {...(x.m || {})}; if (k === 'clear') return {...x, m: {}}; if (k === 't0' || k === 't1') m[k] = t; else { const f = k === 'pose' ? 'poses' : 'offs'; m[f] = [...(m[f] || []), t]; } return {...x, m}; }, true);
    const r = document.querySelector('[data-vres]'); if (r) r.innerHTML = vidResHtml(vids().find(x => x.id === VP.id)); oneHap?.(6); return; }
  if ((b = e.target.closest?.('[data-vtag]'))) { const a = b.dataset.vtag; vidUp(VP.id, x => ({...x, axes: (x.axes || []).includes(a) ? x.axes.filter(y => y !== a) : [...(x.axes || []), a]}), true); b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') !== 'true'); return; }
  if (e.target.closest?.('[data-vdel]')) { if (!confirm('Supprimer cette vidéo ?')) return; const id = VP.id; vdbDel(id); vdbDel('t:' + id); vidSave(vids().filter(x => x.id !== id), true); closePane(); if (P.stack.length) { paneRender(); setTimeout(vidThumbs, 60); } toast('Vidéo supprimée'); }
});
document.addEventListener('input', e => { if (!VP.id) return; const t = e.target;
  if (t.matches?.('[data-vtitle]')) vidUp(VP.id, x => ({...x, title: t.value}));
  if (t.matches?.('[data-vnote]')) vidUp(VP.id, x => ({...x, note: t.value})); });
document.addEventListener('change', e => { if (!VP.id) return; const t = e.target; if (!t.matches?.('[data-vset]')) return;
  vidUp(VP.id, x => ({...x, [t.dataset.vset]: +t.value}), true); const r = document.querySelector('[data-vres]'); if (r) r.innerHTML = vidResHtml(vids().find(x => x.id === VP.id)); });
// Chaque fois qu'une liste de vidéos ou un lecteur apparaît (ouverture, retour, page redessinée), ses images sont remises.
new MutationObserver(() => { if (document.querySelector('[data-vth]:not([data-ok])')) vidThumbs(); if (VP.id && document.querySelector('[data-vvid]:not([data-on])')) vidLoad(); }).observe(document.body, {childList: true, subtree: true});
