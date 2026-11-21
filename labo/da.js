/* ---------- TNR Lab : trois directions artistiques, chacune avec une palette de 5 couleurs ----------
   Chaque couleur a un rôle : le fond, les blocs, le discret (textes secondaires, traits), l'accent (boutons, anneaux,
   graphiques, ce qui est actif) et le texte. L'appli est d'abord rangée par rôle (chaque rôle reçoit une clarté à lui),
   puis tout l'écran est repeint : chaque point prend la couleur de son rôle. Entre deux rôles (le bord d'une lettre,
   d'un anneau), la couleur passe en douceur de l'une à l'autre : les bords restent nets, sans escalier de pixels.
   Contrastes vérifiés avec la formule officielle (WCAG, celle des vérificateurs de Coolors). */
const DA = {
  a: {name: 'Tartan', how: 'La piste d\'athlétisme la nuit : bleu nuit, ardoise et le rouge orangé du tartan, sur un texte couleur craie.',
      pal: [['Nuit', '#0B0F14'], ['Ardoise', '#1C2430'], ['Acier', '#8A9AAB'], ['Tartan', '#EE5A30'], ['Craie', '#F4F1EA']],
      ct: 'Texte sur fond 17 · accent sur blocs 4,6 · texte sur accent 3,0'},
  b: {name: 'Océan', how: 'La récupération : des bleus profonds et un turquoise calme, comme l\'eau froide après l\'effort.',
      pal: [['Abysse', '#06141B'], ['Pétrole', '#11303B'], ['Brume', '#7FA7AC'], ['Turquoise', '#16A396'], ['Écume', '#E8F6F3']],
      ct: 'Texte sur fond 16,8 · accent sur blocs 4,4 · texte sur accent 2,8'},
  c: {name: 'Électrique', how: 'La performance : un noir bleuté et un bleu électrique vif, net et moderne.',
      pal: [['Encre', '#0B0B14'], ['Minuit', '#1C1C2E'], ['Lavande grise', '#8C8CA8'], ['Électrique', '#5B6CFF'], ['Givre', '#F3F3FA']],
      ct: 'Texte sur fond 17,7 · accent sur blocs 4,0 · texte sur accent 3,8'}
};
// Clarté (0 → 1) de chaque rôle une fois l'appli rangée, et la couleur qu'elle prend : fond, blocs, discret, accent, texte.
const DA_STOPS = [[0, 0], [.07, 0], [.13, 1], [.22, 1], [.32, 2], [.5, 2], [.58, 3], [.74, 3], [.86, 4], [1, 4]];
function daFilter(k, t) {
  const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255), P = t.pal.map(([, c]) => rgb(c)), n = 128;
  const at = (v, ch) => { for (let i = 1; i < DA_STOPS.length; i++) { const [x1, c1] = DA_STOPS[i]; if (v <= x1) { const [x0, c0] = DA_STOPS[i - 1], f = x1 > x0 ? (v - x0) / (x1 - x0) : 0; return P[c0][ch] + (P[c1][ch] - P[c0][ch]) * f; } } return P[4][ch]; };
  const tab = ch => [...Array(n + 1)].map((_, i) => at(i / n, ch).toFixed(4)).join(' ');
  return `<filter id="da-f-${k}" color-interpolation-filters="sRGB" x="0" y="0" width="100%" height="100%"><feColorMatrix type="matrix" values=".2126 .7152 .0722 0 0  .2126 .7152 .0722 0 0  .2126 .7152 .0722 0 0  0 0 0 1 0"/>
    <feComponentTransfer><feFuncR type="table" tableValues="${tab(0)}"/><feFuncG type="table" tableValues="${tab(1)}"/><feFuncB type="table" tableValues="${tab(2)}"/><feFuncA type="linear" slope="0" intercept="1"/></feComponentTransfer></filter>`;
}
// Le rangement par rôle : les couleurs de l'appli reçoivent chacune la clarté de leur rôle avant d'être repeintes.
const DA_ROLES = `--bg:#000!important;--card:#262626!important;--card2:#2E2E2E!important;--fg:#F0F0F0!important;--fg2:#727272!important;--fg3:#5E5E5E!important;--line:rgba(255,255,255,.16)!important;--bar:rgba(38,38,38,.92)!important;
  --accent:#A6A6A6!important;--accent-soft:rgba(166,166,166,.22)!important;--good:#A6A6A6!important;--warn:#A6A6A6!important;--bad:#A6A6A6!important;--blue:#A6A6A6!important;--violet:#A6A6A6!important;--teal:#A6A6A6!important;--orange:#A6A6A6!important;
  --o1:#A6A6A6!important;--o2:#A6A6A6!important;--o3:#A6A6A6!important;--one-c:#A6A6A6!important;--sbc:#A6A6A6!important`;
const DA_COL0 = {...ONE.col};
function daSet(k) {
  const R = document.documentElement, t = DA[k];
  if (t) R.dataset.da = k; else delete R.dataset.da;
  try { localStorage.setItem('tnr-da', k || ''); } catch (e) {}
  for (const m of ONE.mods) ONE.col[m] = t ? '#A6A6A6' : DA_COL0[m];
  document.querySelectorAll('#one-top [data-one-m]').forEach(b => b.style.setProperty('--c', ONE.col[b.dataset.oneM]));
  const p = document.querySelector('.da-pick'); if (p) p.textContent = t ? t.name : 'Choisir un test';
  if (t) document.querySelectorAll('meta[name="theme-color"]').forEach(m => { m.content = t.pal[0][1]; }); else try { syncBars(); } catch (e) {}
}
function daOpen() {
  let el = document.getElementById('da-ch');
  if (!el) { el = document.createElement('div'); el.id = 'da-ch'; document.body.appendChild(el); }
  const cur = document.documentElement.dataset.da || '';
  el.innerHTML = `<div class="da-in"><div class="da-k">TNR Lab</div><h1>Choisis une direction</h1><p>Trois applis, chacune avec une palette de 5 couleurs seulement : le fond, les blocs, le discret, l'accent et le texte. Les textes d'explication sont retirés.</p>
    ${Object.entries(DA).map(([k, t]) => `<button type="button" class="da-c${cur === k ? ' on' : ''}" data-da-go="${k}" style="background:${t.pal[1][1]};color:${t.pal[4][1]}"><span class="da-sw">${t.pal.map(([n, c]) => `<i style="background:${c}" title="${n}"></i>`).join('')}</span><b>${t.name}</b><small style="color:${t.pal[2][1]}">${t.pal.map(([n, c]) => `${n} ${c}`).join(' · ')}</small><em style="color:${t.pal[4][1]}">${t.how}</em><small style="color:${t.pal[2][1]}">Contrastes : ${t.ct}</small></button>`).join('')}</div>`;
  el.classList.add('on'); document.documentElement.classList.add('da-open');
}
function daClose() { document.getElementById('da-ch')?.classList.remove('on'); document.documentElement.classList.remove('da-open'); }
document.addEventListener('click', e => {
  const g = e.target.closest('[data-da-go]'); if (g) { daSet(g.dataset.daGo); daClose(); return; }
  if (e.target.closest('.da-pick')) daOpen();
});
(() => {
  document.body.insertAdjacentHTML('beforeend', `<svg width="0" height="0" style="position:absolute" aria-hidden="true">${Object.entries(DA).map(([k, t]) => daFilter(k, t)).join('')}</svg><button type="button" class="da-pick">Choisir un test</button>`);
  const st = document.createElement('style');
  st.textContent = `html[data-da]:not(.da-open),html[data-da]:not(.da-open) *{${DA_ROLES}}` + Object.keys(DA).map(k => `html[data-da="${k}"]:not(.da-open){filter:url(#da-f-${k});background:${DA[k].pal[0][1]}}html[data-da="${k}"]:not(.da-open) body{background:#000}`).join('');
  document.head.appendChild(st);
  let k = ''; try { k = localStorage.getItem('tnr-da') || ''; } catch (e) {}
  daSet(DA[k] ? k : ''); daOpen();
})();
