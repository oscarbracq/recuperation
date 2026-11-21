/* ---------- TNR Lab : trois directions artistiques, avec VRAIMENT 2, 3 ou 4 couleurs, avant l'Accueil ----------
   Tout l'écran est repeint pixel par pixel : chaque point prend la couleur de la palette qui correspond à sa clarté
   (le fond le plus sombre, les blocs, les touches de couleur, les textes et chiffres le plus clair). Il ne peut donc
   apparaître aucune autre couleur, quel que soit l'endroit de l'appli. Les textes d'explication sont retirés. */
const DA = {
  a: {name: 'Test 1 · 2 couleurs', how: 'Encre et orange. Le fond et les blocs en encre ; textes, chiffres, graphiques et boutons en orange.',
      pal: [['Encre', '#14161C'], ['Orange', '#FF7A2F']], cut: [.3]},
  b: {name: 'Test 2 · 3 couleurs', how: 'Vert forêt pour le fond, sauge pour les blocs, sable pour les textes, chiffres et graphiques.',
      pal: [['Forêt', '#0F2420'], ['Sauge', '#2E5E4E'], ['Sable', '#F1E4C8']], cut: [.07, .3]},
  c: {name: 'Test 3 · 4 couleurs', how: 'Prune pour le fond, violet pour les blocs, rose corail pour les touches de couleur, blanc cassé pour les textes et chiffres.',
      pal: [['Prune', '#1A1023'], ['Violet', '#3A2350'], ['Rose corail', '#FF6F91'], ['Blanc cassé', '#FFF4EC']], cut: [.07, .3, .75]}
};
// La clarté de chaque point (0 noir → 1 blanc) choisit sa couleur dans la palette : 100 marches, chacune rangée dans sa bande.
function daFilter(k, t) {
  const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255), P = t.pal.map(([, c]) => rgb(c));
  const band = v => t.cut.filter(c => v >= c).length, n = 100, tab = ch => [...Array(n)].map((_, i) => P[band((i + .5) / n)][ch].toFixed(4)).join(' ');
  return `<filter id="da-f-${k}" color-interpolation-filters="sRGB" x="0" y="0" width="100%" height="100%"><feColorMatrix type="matrix" values=".2126 .7152 .0722 0 0  .2126 .7152 .0722 0 0  .2126 .7152 .0722 0 0  0 0 0 1 0"/>
    <feComponentTransfer><feFuncR type="discrete" tableValues="${tab(0)}"/><feFuncG type="discrete" tableValues="${tab(1)}"/><feFuncB type="discrete" tableValues="${tab(2)}"/><feFuncA type="linear" slope="0" intercept="1"/></feComponentTransfer></filter>`;
}
function daSet(k) {
  const R = document.documentElement, t = DA[k];
  if (t) R.dataset.da = k; else delete R.dataset.da;
  try { localStorage.setItem('tnr-da', k || ''); } catch (e) {}
  const p = document.querySelector('.da-pick'); if (p) p.textContent = t ? t.name : 'Tests de couleurs';
  // La barre du haut du téléphone : la couleur du fond de la palette.
  if (t) document.querySelectorAll('meta[name="theme-color"]').forEach(m => { m.content = t.pal[0][1]; }); else try { syncBars(); } catch (e) {}
}
function daOpen() {
  let el = document.getElementById('da-ch');
  if (!el) { el = document.createElement('div'); el.id = 'da-ch'; document.body.appendChild(el); }
  const cur = document.documentElement.dataset.da || '';
  el.innerHTML = `<div class="da-in"><div class="da-k">TNR Lab</div><h1>Choisis une direction</h1><p>Dans chaque test, l'appli entière n'a que ces couleurs, partout où tu vas. Les textes d'explication sont retirés : regarde les blocs, les visuels et les chiffres.</p>
    ${Object.entries(DA).map(([k, t]) => `<button type="button" class="da-c${cur === k ? ' on' : ''}" data-da-go="${k}"><span class="da-sw">${t.pal.map(([n, c]) => `<i style="background:${c}" title="${n}"></i>`).join('')}</span><b>${t.name}</b><small>${t.pal.map(([n, c]) => `${n} ${c}`).join(' · ')}</small><em>${t.how}</em></button>`).join('')}
    <button type="button" class="da-c da-cur${cur ? '' : ' on'}" data-da-go=""><span class="da-sw">${['#FF3B30', '#30D158', '#0A84FF'].map(c => `<i style="background:${c}"></i>`).join('')}</span><b>Mon appli actuelle</b><small>Toutes les couleurs d'aujourd'hui</small></button></div>`;
  el.classList.add('on'); document.documentElement.classList.add('da-open');
}
function daClose() { document.getElementById('da-ch')?.classList.remove('on'); document.documentElement.classList.remove('da-open'); }
document.addEventListener('click', e => {
  const g = e.target.closest('[data-da-go]'); if (g) { daSet(g.dataset.daGo); daClose(); return; }
  if (e.target.closest('.da-pick')) daOpen();
});
(() => {
  document.body.insertAdjacentHTML('beforeend', `<svg width="0" height="0" style="position:absolute" aria-hidden="true">${Object.entries(DA).map(([k, t]) => daFilter(k, t)).join('')}</svg><button type="button" class="da-pick">Tests de couleurs</button>`);
  const st = document.createElement('style');
  st.textContent = Object.keys(DA).map(k => `html[data-da="${k}"]:not(.da-open){filter:url(#da-f-${k})}html[data-da="${k}"]:not(.da-open){background:${DA[k].pal[0][1]}}html[data-da="${k}"]:not(.da-open) body{background:#000}`).join('');
  document.head.appendChild(st);
  let k = ''; try { k = localStorage.getItem('tnr-da') || ''; } catch (e) {}
  daSet(DA[k] ? k : ''); daOpen();
})();
