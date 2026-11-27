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
// kind : « run » (course, axes de Ton cap) ou « lift » (musculation). Une vidéo sans kind est une course.
function vidPane(ax, kind) {
  VIDF.ax = ax || ''; VIDF.kind = kind || 'run';
  const run = VIDF.kind === 'run';
  openPane({title: run ? 'Ma dynamique de course' : 'Mes mouvements · muscu', render: () => { const c = typeof capGet === 'function' ? capGet() : {axes: []}, A = c.axes || [];
    const L = vids().filter(v => (v.kind || 'run') === VIDF.kind && (!VIDF.ax || (v.axes || []).includes(VIDF.ax))).sort((a, b) => (b.d || '').localeCompare(a.d || '') || (b.at || 0) - (a.at || 0));
    const sub = v => { const r = run ? vidTxt(vidCalc(v)) : ''; const ex = !run && typeof LIFT_EX !== 'undefined' ? LIFT_EX.find(x => x[0] === v.ex)?.[1] : ''; const a = v.an?.rows?.length ? v.an.rows.filter(x => x.lvl !== 'good').length + ' à travailler' : '';
      return [cap(fmtShort(v.d)), ex, r, a].filter(Boolean).join(' · '); };
    return `<label class="btn" style="margin-top:14px;width:100%;display:flex;justify-content:center;align-items:center">+ Ajouter une vidéo<input type="file" accept="video/*" data-vidfile hidden></label>
      <p class="small muted" data-tip="1" style="margin:8px 4px 0">${run ? 'De côté, caméra fixe, au ralenti si possible.' : 'Tout le corps dans l\'image, caméra fixe, de côté (ou de face pour les genoux).'} La vidéo reste sur cet appareil ; sa fiche et son analyse sont partout.</p>
      ${run ? `<div class="chips2b" style="margin-top:12px"><button type="button" class="chip" data-vidax="" aria-pressed="${!VIDF.ax}">Toutes</button>${A.map(a => `<button type="button" class="chip" data-vidax="${esc(a.id)}" aria-pressed="${VIDF.ax === a.id}">${esc(a.n.length > 26 ? a.n.slice(0, 24) + '…' : a.n)}</button>`).join('')}</div>` : ''}
      <div class="vgrid">${L.map(v => `<button type="button" class="vcard" data-vidplay="${esc(v.id)}"><span class="vth" data-vth="${esc(v.id)}"></span><b>${esc(v.title || 'Vidéo')}</b><small>${esc(sub(v))}</small></button>`).join('') || '<p class="small muted" data-tip="1" style="margin:16px 4px">Pas encore de vidéo ici.</p>'}</div>`; }});
  setTimeout(vidThumbs, 60);
}
async function vidThumbs() { for (const el of document.querySelectorAll('[data-vth]:not([data-ok])')) { el.dataset.ok = 1; const r = await vdbGet('t:' + el.dataset.vth); if (r) el.style.backgroundImage = `url(${URL.createObjectURL(r)})`; else el.classList.add('none'); } }
// Une image du début de la vidéo, en petit, pour la liste.
function vidThumb(file) { return new Promise(ok => { const v = document.createElement('video'); v.muted = true; v.playsInline = true; v.preload = 'auto'; v.src = URL.createObjectURL(file);
  const done = b => { URL.revokeObjectURL(v.src); ok(b); }; setTimeout(() => done(null), 8000);
  v.onloadeddata = () => { v.currentTime = Math.min(.5, (v.duration || 1) / 3); };
  v.onseeked = () => { try { const w = 320, h = Math.round(w * (v.videoHeight || 9) / (v.videoWidth || 16)), cv = document.createElement('canvas'); cv.width = w; cv.height = h; cv.getContext('2d').drawImage(v, 0, 0, w, h); cv.toBlob(b => done(b), 'image/jpeg', .7); } catch (e) { done(null); } }; }); }
document.addEventListener('change', async e => { const t = e.target; if (!t.matches?.('[data-vidfile]') || !t.files?.[0]) return;
  const f = t.files[0], id = 'v' + Date.now().toString(36); toast('Vidéo en cours de rangement…');
  try { await vdbPut(id, f); const th = await vidThumb(f); if (th) await vdbPut('t:' + id, th); } catch (er) { toast('Impossible de garder la vidéo sur ce téléphone'); return; }
  vidSave([...vids(), {id, d: TODAY, at: Date.now(), title: (VIDF.kind === 'lift' ? 'Muscu du ' : 'Course du ') + fmtShort(TODAY), kind: VIDF.kind || 'run', axes: VIDF.ax ? [VIDF.ax] : [], slow: 1, fps: 30, m: {}}], true);
  paneRender(); setTimeout(vidThumbs, 60); vidPlayer(id); });
document.addEventListener('click', e => { let b;
  if ((b = e.target.closest?.('[data-vidopen]'))) { vidPane(b.dataset.vidopen); return; }
  if ((b = e.target.closest?.('[data-vidax]'))) { VIDF.ax = b.dataset.vidax; paneRender(); setTimeout(vidThumbs, 60); return; }
  if ((b = e.target.closest?.('[data-vidplay]'))) { vidPlayer(b.dataset.vidplay); return; } });

/* ---------- le lecteur : ralenti, image par image, chrono, appuis ---------- */
const VP = {id: null, url: null};
function vidPlayer(id) {
  const v0 = vids().find(v => v.id === id); if (!v0) return; VP.id = id;
  openPane({title: v0.title || 'Vidéo', onClose: () => { if (VP.url) URL.revokeObjectURL(VP.url); VP.url = null; VP.id = null; }, render: () => { const v = vids().find(x => x.id === VP.id); if (!v) return '';
    const c = typeof capGet === 'function' ? capGet() : {axes: []}, run = (v.kind || 'run') === 'run';
    return `<div class="vbox"><video class="vplay" playsinline preload="auto" muted data-vvid></video><canvas class="vpose"></canvas><div class="vnone" hidden>Cette vidéo est sur un autre appareil : ses mesures sont ci-dessous.</div></div>
      <div class="vtime"><b data-vt>0,00 s</b><span>temps réel${+v.slow > 1 ? ` (ralenti ×${v.slow})` : ''}</span></div>
      <div class="vctl"><button type="button" data-vc="back">− 1 image</button><button type="button" class="vmain" data-vc="play">Lecture</button><button type="button" data-vc="fwd">+ 1 image</button></div>
      <div class="seg vsp">${[.25, .5, 1].map(r => `<button type="button" data-vrate="${r}" aria-pressed="${r === 1}">${r === 1 ? 'Vitesse normale' : '×' + String(r).replace('.', ',')}</button>`).join('')}</div>
      ${typeof anaSection === 'function' ? anaSection(v) : ''}
      ${run ? `<div class="sec-label">Mesurer à la main</div>
      <div class="vgr"><button type="button" class="chip" data-vm="t0">Départ ici</button><button type="button" class="chip" data-vm="t1">Arrivée ici</button><button type="button" class="chip" data-vm="pose">Pose du pied</button><button type="button" class="chip" data-vm="off">Le pied décolle</button></div>
      <div class="vres" data-vres>${vidResHtml(v)}</div>
      <p class="small muted" data-tip="1" style="margin:6px 4px 0">Avance image par image : « Pose du pied » quand il touche le sol, « Le pied décolle » quand il quitte le sol. 3 appuis ou plus donnent ta fréquence. L'analyse du corps les utilise à la place des siens.</p>` : ''}
      <div class="sec-label">La vidéo</div>
      <div class="cap-g2"><label class="cap-f">Ralenti du téléphone<select class="mini-in" data-vset="slow">${[[1, 'Non (vitesse normale)'], [4, '×4 (120 images/s)'], [8, '×8 (240 images/s)']].map(([k, l]) => `<option value="${k}"${+v.slow === k ? ' selected' : ''}>${l}</option>`).join('')}</select></label>
        <label class="cap-f">Images par seconde du fichier<select class="mini-in" data-vset="fps">${[24, 30, 60, 120, 240].map(k => `<option${+v.fps === k ? ' selected' : ''}>${k}</option>`).join('')}</select></label></div>
      <label class="cap-f">Titre<input class="mini-in" data-vtitle value="${esc(v.title || '')}"></label>
      <label class="cap-f">Ce que je vois (défauts, points forts)<textarea rows="3" data-vnote placeholder="Ex. je me relève au 3e appui">${esc(v.note || '')}</textarea></label>
      ${run ? `<div class="sec-label">Rangée dans</div><div class="chips2b">${(c.axes || []).map(a => `<button type="button" class="chip" data-vtag="${esc(a.id)}" aria-pressed="${(v.axes || []).includes(a.id)}">${esc(a.n)}</button>`).join('')}</div>` : ''}
      <button type="button" class="small muted" data-vdel style="padding:14px;margin-top:8px">Supprimer la vidéo</button>`; }});
  vidLoad();
}
async function vidLoad() { const el = document.querySelector('[data-vvid]'); if (!el) return; const b = await vdbGet(VP.id);
  if (!b) { el.hidden = true; el.parentNode.querySelector('.vnone').hidden = false; return; }
  if (VP.url) URL.revokeObjectURL(VP.url); VP.url = URL.createObjectURL(b); el.src = VP.url;
  const t = () => { const v = vids().find(x => x.id === VP.id), o = document.querySelector('[data-vt]'); if (o && v) o.textContent = fx(el.currentTime / (+v.slow || 1), 2) + ' s'; };
  if (typeof anaBind === 'function') anaBind(el);
  el.ontimeupdate = t; el.onseeked = t; el.onplay = () => { const p = document.querySelector('[data-vc="play"]'); if (p) p.textContent = 'Pause'; }; el.onpause = () => { const p = document.querySelector('[data-vc="play"]'); if (p) p.textContent = 'Lecture'; }; }
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
