/* ================= TNR LABO : l'appli principale, une seule entrée =================
   Les pages sont exactement celles de l'appli principale. Ce qui change :
   · plus d'accueil ni de lettres : on arrive directement dans un module ;
   · une barre flottante en verre avec les 6 onglets (leurs noms suivent le module) ;
   · en haut, T · N · R : on change de module en restant sur le même onglet
     (Séances en T → Menu en N → Séances en R ; Mon corps reste Mon corps, etc.). */
const ONE = {mods: ['T', 'N', 'R'], keys: {T: ['today', 'progress', 'sessions', 'library', 'body', 'profile'], N: ['journal', 'progress', 'menu', 'foods', 'nbody', 'goals'], R: ['today', 'trends', 'rsess', 'rlib', 'reports', 'profile']},
  name: {T: 'Training', N: 'Nutrition', R: 'Recovery'}, col: Object.fromEntries(HOME_K), ready: false};
const oneCur = () => S.mod === 'R' ? S.tab : S.mod === 'T' ? S.ttab : S.mod === 'N' ? S.ftab : null;
const oneIdx = () => Math.max(0, (ONE.keys[S.mod] || []).indexOf(oneCur()));
const oneHap = (ms = 6) => { try { if (PREFS.haptic !== false) navigator.vibrate?.(ms); } catch (e) {} };
// L'accueil n'existe plus : tout ce qui y menait ramène au module en cours.
const oneGo0 = go;
go = function (mod, push = true) { if (mod === 'home') { mod = ONE.mods.includes(S.mod) ? S.mod : oneSaved().m; push = false; } oneGo0(mod, push); oneSync(); };
const oneSaved = () => { try { const o = JSON.parse(localStorage.getItem('one.pos') || '{}'); return {m: ONE.mods.includes(o.m) ? o.m : 'T', i: +o.i || 0}; } catch (e) { return {m: 'T', i: 0}; } };
// Change de module en gardant la même position d'onglet.
function oneSwitch(m, i = oneIdx()) {
  if (!ONE.mods.includes(m)) return;
  if (S.sheet) closeSheet(); while (P.stack.length) closePane();
  const k = ONE.keys[m][i] || ONE.keys[m][0];
  if (m === 'R') S.tab = k; else if (m === 'T') S.ttab = k; else { S.ftab = k; if (k === 'journal') S.fday = TODAY; }
  saveUi(); ONE.dir = ONE.mods.indexOf(m) - ONE.mods.indexOf(S.mod);
  oneGo0(m, false); try { history.replaceState({...(history.state || {}), mod: m}, ''); if (i > 0 && !history.state?.one) history.pushState({mod: m, one: 1}, ''); } catch (e) {}
  oneSync(true); oneHap(8);
}
function oneTab(i) {
  const k = ONE.keys[S.mod]?.[i]; if (!k) return;
  if (k === oneCur()) { window.scrollTo({top: 0, behavior: 'smooth'}); return; }
  // Le retour du téléphone depuis un onglet ramène à Aujourd'hui (une seule étape dans l'historique).
  if (i > 0 && !history.state?.one) try { history.pushState({mod: S.mod, one: 1}, ''); } catch (e) {}
  if (S.mod === 'R') setTab(k); else { if (S.mod === 'T') S.ttab = k; else { S.ftab = k; if (k === 'journal') S.fday = TODAY; } saveUi(); renderMod(true); window.scrollTo(0, 0); pcSync(); }
  oneSync(); oneHap(5);
}
function oneMount() {
  document.documentElement.classList.add('one');
  document.body.insertAdjacentHTML('beforeend', `<div id="one-top" class="one-top"><div class="one-mods" role="tablist" aria-label="Module"><span class="one-mp"></span>${ONE.mods.map(m => `<button role="tab" data-one-m="${m}" style="--c:${ONE.col[m]}"><b>${m}</b><span>${ONE.name[m]}</span></button>`).join('')}</div><button class="one-q" data-hday aria-label="Questionnaire du jour" title="Questionnaire du jour"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg></button></div>
    <nav id="one-tabs" class="one-tabs" aria-label="Sections"><span class="one-pill"></span>${[0, 1, 2, 3, 4, 5].map(i => `<button data-one-t="${i}"></button>`).join('')}</nav>`);
  document.addEventListener('click', e => {
    const m = e.target.closest('[data-one-m]'); if (m) { if (m.dataset.oneM !== S.mod) oneSwitch(m.dataset.oneM); else window.scrollTo({top: 0, behavior: 'smooth'}); return; }
    const t = e.target.closest('[data-one-t]'); if (t) oneTab(+t.dataset.oneT);
  });
  addEventListener('resize', () => oneSync());
}
// Met la barre et le sélecteur à jour (noms, icônes et pastille glissante) ; appelée après chaque changement de page.
function oneSync(jump) {
  const tabs = $('#one-tabs'), top = $('#one-top'); if (!tabs || !ONE.mods.includes(S.mod)) return;
  const R = document.documentElement; R.style.setProperty('--one-c', ONE.col[S.mod]);
  const src = [...(pcBar(S.mod)?.querySelectorAll('[role=tab]') || [])], i = oneIdx();
  tabs.querySelectorAll('[data-one-t]').forEach((b, j) => { const s = src[j]; if (!s) return; const h = s.innerHTML; if (b._h !== h) { b.innerHTML = h; b._h = h; } b.setAttribute('aria-label', s.textContent.trim()); b.classList.toggle('on', j === i); });
  top.querySelectorAll('[data-one-m]').forEach(b => b.classList.toggle('on', b.dataset.oneM === S.mod));
  const pill = (box, on, p) => { if (!on || !p) return; p.style.width = on.offsetWidth + 'px'; p.style.transform = `translateX(${on.offsetLeft}px)`; };
  pill(tabs, tabs.querySelector('.on'), tabs.querySelector('.one-pill')); pill(top, top.querySelector('.on'), top.querySelector('.one-mp'));
  try { localStorage.setItem('one.pos', JSON.stringify({m: S.mod, i})); } catch (e) {}
  if (jump) { const v = S.mod === 'R' ? $('#v-' + S.tab) : S.mod === 'T' ? $('#t-view') : $('#f-view'); if (v) { v.classList.remove('one-in', 'l', 'r'); void v.offsetWidth; v.classList.add('one-in', (ONE.dir || 0) < 0 ? 'l' : 'r'); setTimeout(() => v.classList.remove('one-in'), 700); } }
}
// Les fonctions du moteur qui changent de page passent par ici pour garder la barre juste.
const oneSetTab0 = setTab; setTab = function (t) { oneSetTab0(t); oneSync(); };
const oneRenderMod0 = renderMod; renderMod = function (f) { oneRenderMod0(f); oneSync(); };
oneMount();
addEventListener('popstate', () => { if (S.sheet || P.stack.length || PLFS.on || POP_SKIP || !ONE.mods.includes(S.mod)) return; if (oneIdx() > 0) oneTab(0); }, true);
// Au démarrage : directement dans le dernier module et le dernier onglet utilisés (Training · Aujourd'hui la première fois).
(function oneStart(n = 0) {
  if ((window.TNR_SPLASH_ON || !S.mod) && n < 200) { setTimeout(() => oneStart(n + 1), 100); return; }
  const s = oneSaved(); if (!ONE.mods.includes(S.mod)) oneSwitch(s.m, s.i); ONE.ready = true; oneSync();
})();
