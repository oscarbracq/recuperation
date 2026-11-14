/* ================= TNR Athletics · LABO =================
   The test version: same data, same pages, but a new home that answers "what do I do now?" on one screen,
   one coach instead of three, a speed block made for a sprinter, a real computer layout.
   Sandbox: nothing written here reaches the real account (see labSandbox). */
function labSandbox(db) {
  if (!db) return db;
  const W = window.LAB_WRITES = {};
  const wrapDoc = (path, ref) => new Proxy(ref, {get(t, k) {
    if (k === 'set') return async d => { W[path] = d; };
    if (k === 'update') return async d => { W[path] = {...(W[path] || {}), ...d}; };
    if (k === 'delete') return async () => { W[path] = null; };
    const v = t[k]; return typeof v === 'function' ? v.bind(t) : v; }});
  return new Proxy(db, {get(t, k) {
    if (k === 'doc') return p => wrapDoc(p, t.doc(p));
    if (k === 'collection') return c => { const col = t.collection(c); return new Proxy(col, {get(ct, ck) { if (ck === 'doc') return id => wrapDoc(c + '/' + id, ct.doc(id)); const v = ct[ck]; return typeof v === 'function' ? v.bind(ct) : v; }}); };
    const v = t[k]; return typeof v === 'function' ? v.bind(t) : v; }});
}
(() => {
  const no = () => { toast('Labo : rien n\'est changé sur ton vrai compte'); return Promise.resolve('off'); };
  if (window.RECUP_KEYS) { RECUP_KEYS.save = async () => { no(); }; RECUP_KEYS.linkWithings = () => no(); }
  if (window.RECUP_PUSH) { RECUP_PUSH.on = no; RECUP_PUSH.off = no; }
  if (window.RECUP_SYNC) window.RECUP_SYNC = async () => 'Labo : synchro désactivée';
})();

// ---------- one coach: the three coaches' advice, sorted, the three that matter now ----------
const LAB_CAP = {};
const coachBox0 = coachBox;
coachBox = (who, L) => { LAB_CAP[who] = L.filter(Boolean); return coachBox0(who, L); };
function labCoach(rec, tgt, kG) {
  for (const k in LAB_CAP) delete LAB_CAP[k];
  try { coachCard(); } catch (e) {} try { coachRecovery(rec, tgt, kG); } catch (e) {} try { coachNutrition(TODAY); } catch (e) {}
  const all = []; for (const [who, L] of Object.entries(LAB_CAP)) for (const x of L) all.push({who, z: x[0], t: x[1], h: x[2]});
  // Sprint first: a speed rule for a sprinter weighs more than a generic tip.
  for (const s of labSpeed().tips) all.push({who: 'T', z: s[0], t: s[1]});
  const rank = {bad: 0, mid: 1, warn: 1, good: 2, ok: 2};
  const seen = new Set();
  return all.filter(x => { const k = x.t.slice(0, 40); if (seen.has(k)) return false; seen.add(k); return true; }).sort((a, b) => rank[a.z] - rank[b.z]).slice(0, 4);
}

// ---------- speed: what a sprinter needs to see ----------
function labSpeed() {
  const tr = k => !!(M(k, 'trackRpe') || logsOn(k).some(l => l.kind === 'track'));
  const gymHeavy = k => logsOn(k).some(l => l.kind === 'gym' && (l.rpe || 0) >= 7) || (M(k, 'gymRpe') || 0) >= 7;
  let last = null; for (let i = 0; i < 60; i++) { const k = addDays(TODAY, -i); if (tr(k)) { last = k; break; } }
  const since = last ? daysBetween(last, TODAY) : null;
  // The usual week: only the past weeks where he really sprinted (a restart two weeks ago must not look like +300 %).
  const m7 = sumN('sprint', 7), past = [1, 2, 3, 4].map(i => sumN('sprint', 7, addDays(TODAY, -7 * i))).filter(v => v > 0), m28 = past.length >= 2 ? mean(past) : 0;
  const nx = nextSess('track'), ng = nextSess('gym');
  const tips = [];
  if (since != null && since >= 7) tips.push(['mid', `${since} jours sans vitesse maximale. Au-delà de 7 à 10 jours, le nerveux redescend : même 3 sprints courts à 95 % suffisent à le garder.`]);
  if (nx) { const before = addDays(nx.k, -1); if (gymHeavy(before) || (planForK(before, 'gym') && !kindDone(before, 'gym'))) tips.push(['mid', `Muscu lourde la veille du sprint du ${fmtShort(nx.k)} : laisse si possible 48 h entre les deux pour arriver frais sur la piste.`]); }
  if (m28 > 0 && m7 > m28 * 1.4) tips.push(['bad', `${fx(m7)} m de sprint cette semaine, contre ${fx(m28)} m en moyenne : +${Math.round((m7 / m28 - 1) * 100)} %. Les ischios encaissent mal les hausses brusques de vitesse maximale.`]);
  return {since, last, m7, m28, nx, ng, tips};
}

// ---------- the day, from now ----------
function labDay() {
  const now = new Date().getHours() * 60 + new Date().getMinutes();
  const L = dayPlan(TODAY).filter(x => !['quest'].includes(x.c) && !(x.c === 'sommeil' && x.a === '00:00'));
  const cur = L.find(x => tmin(x.a) <= now && tmin(x.b) > now), next = L.filter(x => tmin(x.a) > now).slice(0, cur ? 3 : 4);
  const span = m => m >= 60 ? Math.floor(m / 60) + ' h' + (m % 60 ? ' ' + String(m % 60).padStart(2, '0') : '') : m + ' min';
  const row = (x, on) => { const a = tmin(x.a), col = PCAT[x.c]?.[1] || '#888', chip = plChip(x, TODAY);
    const kd = x.c === 'muscu' ? 'gym' : x.c === 'athle' ? 'track' : null, q = kd && planForK(TODAY, kd), dn = kd && kindDone(TODAY, kd);
    const act = q && !dn ? `<button class="lab-go" data-tstart="${q.id}"${q.n ? ` data-tn="${q.n}"` : ''}>Commencer</button>` : dn ? '<span class="lab-ok">Faite ✓</span>' : '';
    return `<div class="lab-blk${on ? ' now' : ''}" style="--c:${col}"><span class="t">${on ? 'maintenant' : 'dans ' + span(a - now)}<b>${tfr(x.a)}</b></span><i></i><span class="n"><b>${esc(plName(x.n))}${x.dest ? ' · ' + esc(x.dest) : ''}</b>${x.trip ? `<small>${esc(x.trip)}</small>` : ''}${chip ? `<span class="lab-chip">${chip}</span>` : ''}</span>${act}</div>`; };
  return (cur ? row(cur, true) : '') + next.map(x => row(x, false)).join('') || '<p class="lab-empty">Plus rien de prévu aujourd\'hui : place au calme et au sommeil.</p>';
}

// ---------- the ring ----------
function labRing(v, col, size = 132, w = 11) {
  const r = (size - w) / 2, c = 2 * Math.PI * r, o = v == null ? c : c * (1 - v / 100);
  return `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" aria-hidden="true"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="${w}"/><circle class="lab-arc" cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${o.toFixed(1)}" style="--c0:${c.toFixed(1)}" transform="rotate(-90 ${size / 2} ${size / 2})"/></svg>`;
}

function labDash() {
  const kG = lastKey('hrv'), rec = kG ? recovery(kG) : null, z = zoneOf(rec?.score), zc = {good: '#30D158', warn: '#FFD60A', bad: '#FF453A'}[z] || '#8E8E93';
  const tgt = effortTarget(rec?.score, highDay(TODAY)), eff = effortDay(TODAY);
  const sl = kG ? VAL.sleepH(kG) : null, need = sleepGoal(), hrv = kG ? G(kG, 'hrv') : null, hb = kG ? base('hrv', kG, 60) : null;
  const e7 = avgN('effort', 7), e28 = avgN('effort', 28), acwr = e7 != null && e28 ? e7 / e28 : null;
  const sp = labSpeed(), C = labCoach(rec, tgt, kG);
  const g = fuelGoal(TODAY), t = dayTotals(TODAY), w = waterOf(TODAY);
  const vit = (lab, val, sub, state) => `<div class="lab-v ${state || ''}"><span>${lab}</span><b>${val}</b><small>${sub}</small></div>`;
  const pct = (a, b) => b ? Math.round(a / b * 100) : 0;
  const days = [...Array(7)].map((_, i) => addDays(TODAY, i - 6)), effs = days.map(k => effortDay(k) || 0), mx = Math.max(21, ...effs);
  const bar = (v, k) => `<div class="lab-d${k === TODAY ? ' td' : ''}"><i style="height:${Math.max(3, v / mx * 100).toFixed(0)}%"></i><span>${DOW[(dow(k) + 6) % 7]}</span><em>${[kindDone(k, 'gym') ? 'M' : '', kindDone(k, 'track') ? 'S' : ''].filter(Boolean).join('·')}</em></div>`;
  const WHO = {T: ['Training', '#FF453A'], N: ['Nutrition', '#30D158'], R: ['Recovery', '#0A84FF']};
  return `<div class="lab">
    <div class="lab-tag">LABO · version test · rien n'est enregistré</div>
    <section class="lab-c lab-ready">
      <div class="lab-ring">${labRing(rec?.score, zc)}<div class="lab-rv"><b>${rec?.score ?? '–'}<small>%</small></b><span>${esc(ZONE[z])}</span></div></div>
      <div class="lab-vs">${vit('Sommeil', hmH(sl), 'sur ' + hmH(need), sl == null ? '' : sl >= need - .3 ? 'ok' : sl >= need - 1 ? 'mid' : 'bad')}
        ${vit('VFC', hrv != null ? hrv + ' ms' : '–', hb ? (hrv >= hb.m ? '+' : '−') + Math.abs(Math.round((hrv / hb.m - 1) * 100)) + ' % vs ta base' : 'base en calcul', hb && hrv != null ? (hrv >= hb.m * .95 ? 'ok' : hrv >= hb.m * .85 ? 'mid' : 'bad') : '')}
        ${vit('Charge', acwr != null ? fx(acwr, 2) : '–', '7 j / 28 j · zone 0,8 – 1,3', acwr == null ? '' : acwr > 1.3 ? 'bad' : acwr < .8 ? 'mid' : 'ok')}
        ${vit('Effort du jour', eff != null ? fx(eff, 1) : '0', `visé ${tgt.lvl[0]} à ${tgt.lvl[1]} sur 21`, '')}</div>
      <p class="lab-say">${esc(tgt.text)}</p>
    </section>
    <section class="lab-c lab-now"><h3>Ta journée <small>à partir de maintenant</small></h3>${labDay()}<button class="lab-link" data-hplan>Tout le planning ›</button></section>
    <section class="lab-c lab-coach"><h3>Ton coach <small>les ${C.length} points qui comptent aujourd'hui</small></h3>
      ${C.map(x => `<div class="lab-tip ${x.z}"><i style="background:${WHO[x.who][1]}">${x.who}</i><p>${esc(x.t)}${x.h ? `<span class="cact">${x.h}</span>` : ''}</p></div>`).join('') || '<p class="lab-empty">Rien à corriger : continue exactement comme ça.</p>'}</section>
    <section class="lab-c lab-speed"><h3>Vitesse <small>ce qui fait un sprinteur</small></h3>
      <div class="lab-vs three">${vit('Dernière vitesse max', sp.since == null ? '–' : sp.since === 0 ? 'aujourd\'hui' : sp.since === 1 ? 'hier' : 'il y a ' + sp.since + ' j', sp.last ? fmtShort(sp.last) : 'aucune sur 60 jours', sp.since == null ? '' : sp.since <= 5 ? 'ok' : sp.since <= 9 ? 'mid' : 'bad')}
        ${vit('Sprint 7 jours', fx(sp.m7) + ' m', sp.m28 ? 'semaine habituelle ' + fx(sp.m28) + ' m' : 'pas encore de semaine de référence', sp.m28 && sp.m7 > sp.m28 * 1.4 ? 'bad' : sp.m28 ? 'ok' : '')}
        ${vit('Prochaine piste', sp.nx ? cap(fmtShort(sp.nx.k)) : '–', sp.nx ? esc(sp.nx.p.name) : 'rien de calé', '')}</div></section>
    <section class="lab-c lab-fuel"><h3>Carburant <small>aujourd'hui</small></h3>
      <div class="lab-bars">${[['Énergie', t.kcal, g.kcal, 'kcal', '#F5A524'], ['Protéines', t.p, g.p, 'g', '#FF6B6B'], ['Glucides', t.c, g.c, 'g', '#4CC38A'], ['Eau', w.L, g.waterL, 'L', '#40C8E0']].map(([n, v, goal, u, c]) => `<div class="lab-bar"><span>${n}<b>${fx(v || 0, u === 'L' ? 1 : 0)} / ${fx(goal || 0, u === 'L' ? 1 : 0)} ${u}</b></span><div><i style="width:${Math.min(100, pct(v || 0, goal || 0))}%;background:${c}"></i></div></div>`).join('')}</div></section>
    <section class="lab-c lab-week"><h3>Ta semaine <small>effort par jour · M muscu · S sprint</small></h3><div class="lab-ds">${days.map((k, i) => bar(effs[i], k)).join('')}</div></section>
    <section class="lab-c lab-acts"><button data-hday><b>+</b>Questionnaire du jour</button><button data-hlog><b>✎</b>Journal de bord</button><button data-hbilan><b>≡</b>Bilan de la semaine</button><button data-hplan><b>◷</b>Planning</button></section>
  </div>`;
}
homeSyn = () => labDash();
homeActs = () => '';
homeFit = () => { const h = $('#hm-head'); if (h) h.style.setProperty('--hmz', 1); };
// The day moves: the home page redraws every minute while it is shown.
setInterval(() => { if (S.mod === 'home' && !document.hidden && !HP.sel && !HP.busy) { const h = $('#hm-head'); if (h) { const y = h.scrollTop; renderMod(true); const h2 = $('#hm-head'); if (h2) h2.scrollTop = y; } } }, 60e3);
