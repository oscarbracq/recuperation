/* ---------- TNR Lab : trois directions artistiques à essayer (2, 3 ou 4 couleurs), avant l'Accueil ----------
   Chaque test repeint toute l'appli avec sa palette et retire les textes d'explication : il ne reste que les blocs,
   les visuels et les chiffres. « Mon appli actuelle » remet les couleurs de toujours. Le choix est gardé sur ce téléphone. */
const DA = {
  a: {name: 'Test 1 · 2 couleurs', how: 'Contraste chaud et doux : un corail vif pour tout ce qui compte, un crème pour les données.',
      sw: [['Corail', '#FF6B4A'], ['Crème', '#F4E9D8']],
      mod: {T: ['#FF6B4A', '#FF8E6E', '#E8553A'], N: ['#FF6B4A', '#FF8E6E', '#E8553A'], R: ['#FF6B4A', '#FF8E6E', '#E8553A']},
      data: {good: '#F4E9D8', warn: '#FF9A7E', bad: '#FF6B4A', blue: '#F4E9D8', violet: '#F4E9D8', teal: '#F4E9D8', orange: '#FF6B4A'}},
  b: {name: 'Test 2 · 3 couleurs', how: 'Triade : trois couleurs à égale distance sur le cercle, une par module.',
      sw: [['Ambre', '#F5A524'], ['Turquoise', '#14B8A6'], ['Indigo', '#6E6AF6']],
      mod: {T: ['#F5A524', '#F7B955', '#D98A0B'], N: ['#14B8A6', '#2DD4BF', '#0F9488'], R: ['#6E6AF6', '#8F8CF8', '#5653E0']},
      data: {good: '#14B8A6', warn: '#F5A524', bad: '#D98A0B', blue: '#6E6AF6', violet: '#6E6AF6', teal: '#14B8A6', orange: '#F5A524'}},
  c: {name: 'Test 3 · 4 couleurs', how: 'Couleurs voisines et douces (rose, menthe, bleu ciel) et un violet pour les données.',
      sw: [['Rose', '#F472B6'], ['Menthe', '#5EEAD4'], ['Bleu ciel', '#60A5FA'], ['Violet', '#A78BFA']],
      mod: {T: ['#F472B6', '#F9A8D4', '#EC4899'], N: ['#5EEAD4', '#99F6E4', '#2DD4BF'], R: ['#60A5FA', '#93C5FD', '#3B82F6']},
      data: {good: '#5EEAD4', warn: '#A78BFA', bad: '#F472B6', blue: '#60A5FA', violet: '#A78BFA', teal: '#5EEAD4', orange: '#F472B6'}}
};
const DA_COL0 = {...ONE.col};
function daCss() {
  let css = '';
  for (const [k, t] of Object.entries(DA)) {
    const d = Object.entries(t.data).map(([v, c]) => `--${v}:${c}!important;`).join('');
    css += `html[data-da="${k}"]{${d}}`;
    for (const [m, [c1, c2, c3]] of Object.entries(t.mod)) {
      css += `html[data-da="${k}"][data-mod="${m}"],html[data-da="${k}"][data-mod="${m}"]:not([data-theme="light"]){--accent:${c1}!important;--accent-soft:color-mix(in srgb,${c1} 18%,transparent)!important;--o1:${c1}!important;--o2:${c2}!important;--o3:${c3}!important;--aura1:${c1}!important;--aura2:${c2}!important;--aura3:${c3}!important;--top:color-mix(in srgb,${c1} 30%,#000)!important}`;
    }
  }
  return css;
}
function daSet(k) {
  const R = document.documentElement, t = DA[k];
  if (t) R.dataset.da = k; else delete R.dataset.da;
  try { localStorage.setItem('tnr-da', k || ''); } catch (e) {}
  window.DA_TRI = t ? t.mod : null;
  for (const m of ONE.mods) ONE.col[m] = t ? t.mod[m][0] : DA_COL0[m];
  document.querySelectorAll('#one-top [data-one-m]').forEach(b => b.style.setProperty('--c', ONE.col[b.dataset.oneM]));
  try { oneSync(); syncBars(); } catch (e) {}
  const p = document.querySelector('.da-pick'); if (p) p.textContent = t ? t.name : 'Tests de couleurs';
}
function daOpen() {
  let el = document.getElementById('da-ch');
  if (!el) { el = document.createElement('div'); el.id = 'da-ch'; document.body.appendChild(el); }
  const cur = document.documentElement.dataset.da || '';
  el.innerHTML = `<div class="da-in"><div class="da-k">TNR Lab</div><h1>Choisis une direction</h1><p>Trois façons de colorer l'appli. Les textes d'explication sont retirés : regarde juste les blocs, les visuels et les chiffres.</p>
    ${Object.entries(DA).map(([k, t]) => `<button type="button" class="da-c${cur === k ? ' on' : ''}" data-da-go="${k}"><span class="da-sw">${t.sw.map(([n, c]) => `<i style="background:${c}" title="${n}"></i>`).join('')}</span><b>${t.name}</b><small>${t.sw.map(([n, c]) => `${n} ${c}`).join(' · ')}</small><em>${t.how}</em></button>`).join('')}
    <button type="button" class="da-c da-cur${cur ? '' : ' on'}" data-da-go=""><span class="da-sw">${['#FF3B30', '#30D158', '#0A84FF'].map(c => `<i style="background:${c}"></i>`).join('')}</span><b>Mon appli actuelle</b><small>Rouge, vert, bleu et toutes les couleurs des données</small></button></div>`;
  el.classList.add('on');
}
document.addEventListener('click', e => {
  const g = e.target.closest('[data-da-go]'); if (g) { daSet(g.dataset.daGo); document.getElementById('da-ch')?.classList.remove('on'); return; }
  if (e.target.closest('.da-pick')) daOpen();
});
(() => {
  const st = document.createElement('style'); st.textContent = daCss(); document.head.appendChild(st);
  document.body.insertAdjacentHTML('beforeend', '<button type="button" class="da-pick">Tests de couleurs</button>');
  let k = ''; try { k = localStorage.getItem('tnr-da') || ''; } catch (e) {}
  daSet(DA[k] ? k : ''); daOpen();
})();
