/* TNR · maquettes labo 1 à 10 : données inventées + petits outils partagés (anneau, courbe, corps, créateur de séance, IA). */
(() => {
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const walk = (n, base, amp, lo, hi) => { let v = base; return Array.from({length: n}, () => (v = Math.max(lo, Math.min(hi, v + (rnd() - .5) * amp)), Math.round(v * 10) / 10)); };
const J = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
window.D = {
  nom: 'Coach', jour: 'Dimanche 15 novembre', heure: '7:42',
  forme: 78, formeMot: 'Prêt à charger', sommeil: {h: '7 h 42', score: 84, coucher: '23:05', lever: '6:47', profond: '1 h 38'},
  vfc: 68, vfcBase: 62, fcr: 49, fcrBase: 51, charge: 12.4, chargeMax: 21, poids: 74.2, pas: 8420,
  hist: {forme: walk(90, 70, 14, 35, 98), vfc: walk(90, 62, 8, 45, 85), sommeil: walk(90, 7.3, 1, 5.2, 9.1), charge: walk(90, 11, 6, 2, 20), vitesse: walk(12, 9.6, .3, 9.1, 10.2)},
  seance: {nom: 'Vitesse max', sous: '4 × 30 m lancés + force', type: 'piste', duree: 75, metres: 360, heure: '17:30', lieu: 'Stade',
    items: [{n: 'Échauffement + gammes', t: 'Prépa', d: '15 min'}, {n: '30 m lancés', t: 'Sprint', s: 4, r: '30 m', rec: '6 min', cible: '3"00'},
      {n: 'Départs 3 appuis', t: 'Sprint', s: 4, r: '20 m', rec: '4 min'}, {n: 'Squat', t: 'Force', s: 4, r: '3', kg: 120, rec: '3 min'},
      {n: 'Hip thrust', t: 'Force', s: 3, r: '6', kg: 140, rec: '2 min'}, {n: 'Gainage latéral', t: 'Gainage', s: 3, r: '45 s', rec: '45 s'}]},
  semaine: [['Lun', 'Accélération', 'piste', 1], ['Mar', 'Force bas', 'muscu', 1], ['Mer', 'Récup active', 'recup', 1], ['Jeu', 'Pliométrie', 'piste', 1],
    ['Ven', 'Haut du corps', 'muscu', 1], ['Sam', 'Repos', 'repos', 1], ['Dim', 'Vitesse max', 'piste', 0]].map(([j, n, t, f], i) => ({j, n, t, fait: !!f, num: 9 + i, auj: i === 6})),
  muscles: [['Ischios', 58], ['Quadriceps', 82], ['Mollets', 44], ['Fessiers', 90], ['Adducteurs', 74], ['Dos', 100], ['Abdos', 96], ['Épaules', 100], ['Pectoraux', 100], ['Bras', 100]].map(([n, v]) => ({n, v})),
  repas: [{n: 'Petit-déjeuner', h: '7:30', k: 640, p: 42, fait: 1, d: 'Skyr, flocons, noix, banane'}, {n: 'Déjeuner', h: '12:30', k: 820, p: 55, fait: 1, d: 'Riz 300 g, poulet, ratatouille'},
    {n: 'Collation', h: '16:00', k: 380, p: 25, fait: 0, d: 'Pain de seigle, skyr, chocolat 85 %'}, {n: 'Dîner', h: '20:00', k: 900, p: 50, fait: 0, d: 'Riz, poulet, légumes, huile d\'olive'}],
  macros: {kcal: [1460, 2900], p: [97, 165], g: [180, 380], l: [41, 80], eau: [1.5, 3]},
  records: [{n: '30 m lancé', v: '3"02', e: '−0"04', d: '28 oct.'}, {n: '60 m', v: '7"08', e: '−0"05', d: '12 oct.'}, {n: '100 m', v: '10"94', e: '−0"11', d: '21 sept.'}, {n: 'Squat 1RM', v: '150 kg', e: '+5 kg', d: '4 nov.'}, {n: 'Détente', v: '3,02 m', e: '+6 cm', d: '1 nov.'}],
  courses: [['Filets de poulet 1,5 kg', 11.99, 'Lidl'], ['Skyr nature 850 g', 3.36, 'U'], ['Riz basmati 1 kg', 1.95, 'Lidl'], ['Pain de seigle 500 g', 2.12, 'U'], ['Cerneaux de noix 200 g', 2.95, 'Lidl'],
    ['Chocolat noir 85 % 100 g', 1.00, 'Lidl'], ['Compote pomme vanille 750 g', 1.87, 'U'], ['Ratatouille 520 g', 2.59, 'U'], ['Huile d\'olive 1 L', 6.43, 'Lidl'], ['Sauce soja 150 ml', 0.99, 'Lidl']].map(([n, p, m]) => ({n, p, m})),
  biblio: [['Vitesse max', 'piste', 75], ['Accélération 10-30 m', 'piste', 70], ['Pliométrie bonds', 'piste', 60], ['Tempo 6 × 200 m', 'piste', 65], ['Force bas du corps', 'muscu', 70], ['Haut du corps', 'muscu', 55], ['Gainage + mobilité', 'recup', 35], ['Récup active vélo', 'recup', 40]].map(([n, t, d]) => ({n, t, d})),
  exos: {Sprint: ['30 m lancés', 'Départs 3 appuis', 'Départs en blocs', 'Côtes 40 m', 'Traîneau 20 m', 'Flying 20'], Pliométrie: ['Bonds horizontaux', 'Haies basses', 'Drop jump', 'Multi-bonds 5', 'Corde'],
    Force: ['Squat', 'Hip thrust', 'Soulevé de terre roumain', 'Fentes bulgares', 'Nordic', 'Épaulé'], 'Haut du corps': ['Développé couché', 'Tractions', 'Rowing', 'Dips'], Gainage: ['Gainage latéral', 'Planche', 'Dead bug', 'Pallof'], Mobilité: ['Hanches 90/90', 'Chevilles', 'Fente étirée']},
  conseils: ['Forme haute et VFC au-dessus de ta zone : jour idéal pour la vitesse max.', 'Mollets à 44 % : garde les bonds pour jeudi, pas aujourd\'hui.', 'Encore 68 g de protéines à prendre : la collation + le dîner suffisent.'],
  J
};
const C = {piste: '#ff7a1a', muscu: '#5b8cff', recup: '#2fd4a3', repos: '#8a93a6'};
D.col = t => C[t] || '#8a93a6';
D.zone = v => v >= 80 ? '#2fd4a3' : v >= 60 ? '#ffc23d' : '#ff4d6d';
D.ring = (v, s = 120, w = 10, c = 'currentColor', tr = 'rgba(127,127,127,.18)') => { const r = (s - w) / 2, L = 2 * Math.PI * r;
  return `<svg class="ring" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}"><circle cx="${s / 2}" cy="${s / 2}" r="${r}" fill="none" stroke="${tr}" stroke-width="${w}"/><circle class="arc" cx="${s / 2}" cy="${s / 2}" r="${r}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-dasharray="${L}" stroke-dashoffset="${L * (1 - v / 100)}" style="--L:${L}" transform="rotate(-90 ${s / 2} ${s / 2})"/></svg>`; };
D.spark = (a, w = 300, h = 80, c = 'currentColor', fill = true) => { const lo = Math.min(...a), hi = Math.max(...a), x = i => i / (a.length - 1) * w, y = v => h - 4 - (v - lo) / (hi - lo || 1) * (h - 8);
  const p = a.map((v, i) => (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(v).toFixed(1)).join(' '), id = 'g' + Math.round(rnd() * 1e6);
  return `<svg class="spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" width="100%" height="${h}"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c}" stop-opacity=".35"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></linearGradient></defs>${fill ? `<path d="${p} L${w} ${h} L0 ${h}Z" fill="url(#${id})"/>` : ''}<path class="ln" d="${p}" fill="none" stroke="${c}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg>`; };
D.bars = (a, h = 90, c = 'currentColor', labels) => `<div class="bars" style="display:flex;align-items:flex-end;gap:5px;height:${h}px">${a.map((v, i) => `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;height:100%;justify-content:flex-end"><div class="bar" style="width:100%;height:${v / Math.max(...a) * 100}%;background:${typeof c === 'function' ? c(v, i) : c};border-radius:6px 6px 3px 3px;--i:${i}"></div>${labels ? `<small style="font-size:10px;opacity:.6">${labels[i]}</small>` : ''}</div>`).join('')}</div>`;
// Stylised body, front + back. Colours by recovery of each muscle group.
D.body = (side = 'front', col = D.zone) => { const m = Object.fromEntries(D.muscles.map(x => [x.n, x.v])), f = n => `fill="${col(m[n])}" data-m="${n}"`, sk = 'fill="rgba(160,170,190,.28)"';
  const F = `<circle cx="60" cy="16" r="11" ${sk}/><rect x="54" y="26" width="12" height="7" ${sk}/><ellipse cx="38" cy="40" rx="11" ry="8" ${f('Épaules')}/><ellipse cx="82" cy="40" rx="11" ry="8" ${f('Épaules')}/><path d="M44 36h32l-2 22H46z" ${f('Pectoraux')}/><rect x="47" y="60" width="26" height="30" rx="6" ${f('Abdos')}/><rect x="25" y="48" width="10" height="34" rx="5" ${f('Bras')}/><rect x="85" y="48" width="10" height="34" rx="5" ${f('Bras')}/><rect x="22" y="84" width="9" height="26" rx="4" ${sk}/><rect x="89" y="84" width="9" height="26" rx="4" ${sk}/><path d="M46 92h28l-6 10H52z" ${sk}/><rect x="45" y="100" width="13" height="46" rx="6" ${f('Quadriceps')}/><rect x="62" y="100" width="13" height="46" rx="6" ${f('Quadriceps')}/><rect x="55" y="104" width="10" height="26" rx="4" ${f('Adducteurs')}/><rect x="46" y="150" width="11" height="38" rx="5" ${f('Mollets')}/><rect x="63" y="150" width="11" height="38" rx="5" ${f('Mollets')}/>`;
  const B = `<circle cx="60" cy="16" r="11" ${sk}/><rect x="54" y="26" width="12" height="7" ${sk}/><ellipse cx="38" cy="40" rx="11" ry="8" ${f('Épaules')}/><ellipse cx="82" cy="40" rx="11" ry="8" ${f('Épaules')}/><path d="M44 34h32l-3 54H47z" ${f('Dos')}/><rect x="25" y="48" width="10" height="34" rx="5" ${f('Bras')}/><rect x="85" y="48" width="10" height="34" rx="5" ${f('Bras')}/><rect x="22" y="84" width="9" height="26" rx="4" ${sk}/><rect x="89" y="84" width="9" height="26" rx="4" ${sk}/><ellipse cx="52" cy="98" rx="9" ry="10" ${f('Fessiers')}/><ellipse cx="68" cy="98" rx="9" ry="10" ${f('Fessiers')}/><rect x="45" y="110" width="13" height="38" rx="6" ${f('Ischios')}/><rect x="62" y="110" width="13" height="38" rx="6" ${f('Ischios')}/><rect x="46" y="152" width="11" height="36" rx="5" ${f('Mollets')}/><rect x="63" y="152" width="11" height="36" rx="5" ${f('Mollets')}/>`;
  return `<svg class="body" viewBox="0 0 120 194" width="100%">${side === 'front' ? F : B}</svg>`; };
D.eur = n => n.toFixed(2).replace('.', ',') + ' €';
// Number count-up for [data-n]
D.count = (root = document) => root.querySelectorAll('[data-n]').forEach(el => { const to = +el.dataset.n, dec = +(el.dataset.dec || 0), t0 = performance.now(), dur = 900;
  const st = t => { const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3); el.textContent = (to * e).toFixed(dec).replace('.', ','); if (k < 1) requestAnimationFrame(st); }; requestAnimationFrame(st); });
// ---------- Shared sheet (bottom on phone, centred on PC). Themed by the page's --sh-bg / --sh-fg / --sh-ac / --sh-line ----------
const css = `.xsh-bg{position:fixed;inset:0;background:rgba(0,0,0,.5);backdrop-filter:blur(6px);z-index:90;opacity:0;transition:opacity .3s}.xsh-bg.on{opacity:1}
.xsh{position:fixed;left:0;right:0;bottom:0;max-height:88vh;overflow:auto;background:var(--sh-bg,#15171c);color:var(--sh-fg,#fff);border-radius:22px 22px 0 0;padding:18px 18px 28px;z-index:91;transform:translateY(100%);transition:transform .45s cubic-bezier(.2,.9,.25,1.05);font:inherit}
.xsh.on{transform:none}.xsh h3{margin:4px 0 12px;font-size:20px}.xsh .grab{width:40px;height:4px;border-radius:4px;background:var(--sh-line,rgba(127,127,127,.4));margin:0 auto 12px}
.xsh .chips{display:flex;gap:8px;overflow-x:auto;padding-bottom:6px}.xsh .chip{flex:none;padding:8px 12px;border-radius:99px;border:1px solid var(--sh-line,rgba(127,127,127,.3));background:none;color:inherit;font:inherit;font-size:13px;cursor:pointer}
.xsh .chip.on{background:var(--sh-ac,#ff7a1a);border-color:transparent;color:#fff}.xsh .ex{display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--sh-line,rgba(127,127,127,.18))}
.xsh .ex b{flex:1;font-weight:600;min-width:0}.xsh .st{display:flex;align-items:center;gap:6px;font-size:13px}.xsh .st button,.xsh .add{width:30px;height:30px;border-radius:10px;border:0;background:var(--sh-line,rgba(127,127,127,.2));color:inherit;font-size:16px;cursor:pointer}
.xsh .go{width:100%;margin-top:16px;padding:14px;border:0;border-radius:14px;background:var(--sh-ac,#ff7a1a);color:#fff;font:inherit;font-weight:700;font-size:16px;cursor:pointer}
.xsh .pick{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0}.xsh .muted{opacity:.6;font-size:13px}.xsh input{width:100%;padding:12px;border-radius:12px;border:1px solid var(--sh-line,rgba(127,127,127,.3));background:transparent;color:inherit;font:inherit;font-size:16px;box-sizing:border-box}
.xtoast{position:fixed;left:50%;bottom:90px;transform:translate(-50%,20px);background:#111;color:#fff;padding:10px 16px;border-radius:12px;font-size:14px;z-index:99;opacity:0;transition:.3s;pointer-events:none}.xtoast.on{opacity:1;transform:translate(-50%,0)}
@media(min-width:800px){.xsh{left:50%;right:auto;bottom:50%;width:480px;border-radius:22px;transform:translate(-50%,60%);opacity:0;transition:.35s}.xsh.on{transform:translate(-50%,50%);opacity:1}}
.ring .arc{animation:xarc 1.2s cubic-bezier(.2,.8,.2,1) both}@keyframes xarc{from{stroke-dashoffset:var(--L)}}.spark .ln{stroke-dasharray:2000;animation:xln 1.6s ease both}@keyframes xln{from{stroke-dashoffset:2000}}
.bar{animation:xbar .8s cubic-bezier(.2,.9,.3,1.2) both;animation-delay:calc(var(--i)*50ms);transform-origin:bottom}@keyframes xbar{from{transform:scaleY(0)}}
@media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}`;
document.head.insertAdjacentHTML('beforeend', `<style>${css}</style>`);
let open = null;
D.sheet = html => { D.close(); const bg = document.createElement('div'), sh = document.createElement('div'); bg.className = 'xsh-bg'; sh.className = 'xsh'; sh.innerHTML = '<div class="grab"></div>' + html;
  document.body.append(bg, sh); bg.onclick = D.close; requestAnimationFrame(() => { bg.classList.add('on'); sh.classList.add('on'); }); open = [bg, sh]; return sh; };
D.close = () => { if (!open) return; const [bg, sh] = open; open = null; bg.classList.remove('on'); sh.classList.remove('on'); setTimeout(() => { bg.remove(); sh.remove(); }, 450); };
D.toast = t => { const el = document.createElement('div'); el.className = 'xtoast'; el.textContent = t; document.body.append(el); requestAnimationFrame(() => el.classList.add('on')); setTimeout(() => { el.classList.remove('on'); setTimeout(() => el.remove(), 300); }, 1800); };
// Session builder: pick a family, tap exercises, adjust sets, save.
D.builder = () => { let cat = 'Sprint'; const list = [{n: '30 m lancés', s: 4}, {n: 'Squat', s: 4}];
  const sh = D.sheet(''), draw = () => { sh.innerHTML = `<div class="grab"></div><h3>Nouvelle séance</h3><input placeholder="Nom de la séance" value="Vitesse + force">
    <p class="muted" style="margin:14px 0 6px">Ajoute des exercices</p><div class="chips">${Object.keys(D.exos).map(c => `<button class="chip ${c === cat ? 'on' : ''}" data-c="${c}">${c}</button>`).join('')}</div>
    <div class="pick">${D.exos[cat].map(e => `<button class="chip" data-e="${e}">+ ${e}</button>`).join('')}</div>
    ${list.map((x, i) => `<div class="ex"><b>${x.n}</b><span class="st"><button data-m="${i}">−</button>${x.s} séries<button data-p="${i}">+</button></span></div>`).join('')}
    <p class="muted" style="margin-top:10px">≈ ${15 + list.reduce((a, x) => a + x.s * 4, 0)} min · ${list.length} exercices</p><button class="go">Enregistrer et caler</button>`; };
  draw(); sh.onclick = e => { const b = e.target.closest('button'); if (!b) return; if (b.dataset.c) cat = b.dataset.c; else if (b.dataset.e) list.push({n: b.dataset.e, s: 3});
    else if (b.dataset.m) { const x = list[b.dataset.m]; if (--x.s < 1) list.splice(b.dataset.m, 1); } else if (b.dataset.p) list[b.dataset.p].s++; else if (b.classList.contains('go')) { D.close(); D.toast('Séance enregistrée (maquette)'); return; } draw(); }; };
D.ai = () => { const sh = D.sheet(`<h3>✦ Coach IA</h3><p class="muted">L'appli marche sans IA. Ce bouton ajoute une analyse poussée et personnalisée, seulement quand tu la demandes.</p>
  <div class="ex"><b>Analyser ma semaine</b><span>›</span></div><div class="ex"><b>Adapter la séance à ma forme</b><span>›</span></div><div class="ex"><b>Bilan nutrition</b><span>›</span></div><button class="go">Activer l'IA</button>`);
  sh.querySelector('.go').onclick = () => { D.close(); D.toast('IA activée (maquette)'); }; };
D.seanceSheet = () => D.sheet(`<h3>${D.seance.nom}</h3><p class="muted">${D.seance.sous} · ${D.seance.duree} min · ${D.seance.metres} m de sprint</p>${D.seance.items.map(x => `<div class="ex"><b>${x.n}</b><span class="muted">${x.s ? x.s + ' × ' + x.r : x.d}${x.kg ? ' · ' + x.kg + ' kg' : ''}</span></div>`).join('')}<button class="go" onclick="D.close();D.toast('Séance lancée (maquette)')">Commencer</button>`);
})();
