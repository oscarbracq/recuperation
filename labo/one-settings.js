/* ================= TNR · Paramètres (la roue crantée, en haut à gauche de l'Accueil) =================
   Tout ce qui se règle dans l'appli, au même endroit :
   · Intelligence artificielle : avec l'IA coupée, l'appli tourne à 100 % sur son propre programme. Aucun texte écrit par
     Claude (analyse du matin, bilan du vendredi, notifications), plus de bouton IA, plus d'envoi de tes données au
     connecteur Claude. Tout ce que tu lis vient alors des calculs de l'appli sur tes données.
   · Coachs : les conseils des coachs Training, Nutrition et Recovery, affichés ou masqués.
   · Affichage, démarrage, notifications, connexions, données de l'appli. */
const OS_GEAR = '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>';
// La roue crantée : même carré que le bouton IA, à sa place d'avant (en haut à gauche). L'IA passe à droite.
document.body.insertAdjacentHTML('beforeend', `<button class="one-sq one-aib one-hset" data-one-set aria-label="Paramètres" title="Paramètres"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${OS_GEAR}</svg></button>`);

// Les réglages de ce téléphone en plus : taille du texte, animations, page d'ouverture.
Object.assign(PREFS, {fs: PREFS.fs || 'n', calm: !!PREFS.calm, start: PREFS.start || 'home'});
function osApply() {
  const r = document.documentElement;
  r.style.fontSize = {n: '', l: '108%', xl: '116%'}[PREFS.fs] ?? '';
  r.classList.toggle('one-calmx', !!PREFS.calm);
  r.classList.toggle('one-noai', !aiOn());
}
{ const ap0 = applyPrefs; applyPrefs = function () { ap0(); osApply(); }; }
{ const r0 = render; render = function (...a) { const x = r0.apply(this, a); osApply(); return x; }; }
osApply();
// Page d'ouverture : une fois, quand les données sont là.
(function osStart(n = 0) {
  const m = PREFS.start; if (!['T', 'N', 'R'].includes(m) || n > 60) return;
  if (!(S.status === 'ready' || S.status === 'slow') || document.getElementById('splash') || window.TNR_SPLASH_ON) { setTimeout(() => osStart(n + 1), 400); return; }
  if (S.mod === 'home' && !P.stack.length) try { oneSwitch(m); } catch (e) {}
})();

async function osSaveApp(patch) {
  S.app = {...(S.app || {}), ...patch}; osApply(); render(); try { renderMod(true); } catch (e) {} if (P.stack.length) paneRender();
  await dbSet('settings/app', {...S.app, updatedAt: new Date().toISOString()});
}
let OS_VER = '';
fetch('./sw.js', {cache: 'no-store'}).then(r => r.text()).then(t => { OS_VER = (t.match(/recup-v(\d+)/) || [])[1] || ''; }).catch(() => {});

function oneSettings() {
  openPane({title: 'Paramètres', side: true, render: () => {
    const sw = (attr, on, label, hint) => `<div class="row"><label>${label}<span class="hint">${hint}</span></label><span class="switch"><input type="checkbox" ${attr}${on ? ' checked' : ''}><span></span></span></div>`;
    const seg = (k, opts) => `<div class="seg" role="group">${opts.map(([v, l]) => `<button type="button" data-pref="${k}" data-v="${v}" aria-pressed="${PREFS[k] === v}">${l}</button>`).join('')}</div>`;
    const psw = (k, label, hint) => sw(`data-prefsw="${k}"`, PREFS[k], label, hint);
    const ai = aiOn(), coach = S.app?.coach !== false;
    return `<div style="margin-top:14px"></div>
    <h2>Intelligence artificielle</h2><div class="list">
      ${sw('data-osai', ai, 'Utiliser l\'IA', ai ? 'Activée : Claude écrit l\'analyse du matin et le bilan du vendredi, le bouton IA est en haut à droite.' : 'Coupée : zéro IA. Tout ce que tu lis est calculé par le programme de l\'appli à partir de tes données. Rien n\'est envoyé à Claude.')}</div>
    <p class="note" style="text-align:left">${ai ? 'Coupe-la si tu n\'as plus d\'abonnement Claude : l\'appli continue de tout calculer seule (récupération, charge, objectifs, conseils, bilans).' : 'Tes données (Garmin, Withings, tes saisies) continuent d\'arriver normalement. Rallume quand tu veux.'}</p>
    <h2>Coachs</h2><div class="list">
      ${sw('data-oscoach', coach, 'Conseils des coachs', coach ? 'Affichés : coach training, coach nutrition et coach recovery.' : 'Masqués : plus aucun conseil de coach dans Training, Nutrition et Recovery.')}</div>
    <h2>Affichage</h2><div class="list">
      <div class="row col"><span class="l">Thème<span class="hint">Automatique suit le réglage clair ou sombre du téléphone</span></span>${seg('theme', [['auto', 'Automatique'], ['light', 'Clair'], ['dark', 'Sombre']])}</div>
      <div class="row col"><span class="l">Taille du texte</span>${seg('fs', [['n', 'Normale'], ['l', 'Grande'], ['xl', 'Très grande']])}</div>
      ${psw('aura', 'Fond animé', 'Les halos de couleur qui bougent doucement derrière les pages')}
      <div class="row col"><label for="pref-bg">Intensité des couleurs de fond<span class="hint">De très discret à très coloré</span></label><div class="rangeline"><input type="range" id="pref-bg" min="0" max="150" step="10" value="${PREFS.bgInt ?? 100}" data-osrange="bgInt"></div></div>
      <div class="row col"><label for="pref-grain">Grain du fond<span class="hint">Un fond lisse, ou un léger grain comme une photo</span></label><div class="rangeline"><input type="range" id="pref-grain" min="0" max="100" step="10" value="${PREFS.grain ?? 50}" data-osrange="grain"></div></div>
      ${psw('calm', 'Réduire les animations', 'Les pages changent sans glisser ni rebondir : plus calme, et plus rapide sur un vieux téléphone')}
      ${psw('haptic', 'Vibrations', 'Un petit retour quand tu touches les boutons et tires pour actualiser')}</div>
    <h2>Ouverture de l'appli</h2><div class="list">
      <div class="row col"><span class="l">Page d'ouverture<span class="hint">La page qui s'affiche quand tu ouvres l'appli</span></span>${seg('start', [['home', 'Accueil'], ['T', 'Training'], ['N', 'Nutrition'], ['R', 'Recovery']])}</div>
      ${psw('autoSync', 'Actualiser à l\'ouverture', 'Va chercher Garmin et Withings à chaque ouverture')}</div>
    <h2>Langue</h2><div class="list"><div class="row col"><span class="l">Noms des trois parties<span class="hint">Les lettres T, N, R restent les mêmes</span></span>
      <div class="seg" role="group" aria-label="Langue">${[['fr', 'Français'], ['en', 'English']].map(([v, l]) => `<button type="button" data-hlang="${v}" aria-pressed="${(S.lang || 'en') === v}">${l}</button>`).join('')}</div></div></div>
    ${notifSection()}
    ${connSection()}
    ${appsSection()}
    <h2>Données et appli</h2><div class="list">
      <button class="row" data-osexport><span class="l">Exporter mes données<span class="hint">Un fichier avec toutes tes mesures, séances, plans, tests et réglages</span></span><span aria-hidden="true">›</span></button>
      <button class="row" data-osupdate><span class="l">Mettre à jour l'appli<span class="hint">Recharge la toute dernière version${OS_VER ? ' · version actuelle ' + OS_VER : ''}</span></span><span aria-hidden="true">›</span></button></div>
    ${window.RECUP_SIGNOUT ? `<div style="margin-top:16px"><button class="btn ghost" id="pf-signout">Se déconnecter</button></div>` : ''}
    <p class="note">TNR Athletics${OS_VER ? ' · version ' + OS_VER : ''}</p>`;
  }});
  if (window.RECUP_KEYS) try { connLoad(); } catch (e) {}
  try { notifLoad(); } catch (e) {}
}
document.addEventListener('click', async e => {
  if (e.target.closest('[data-one-set]')) { try { oneHap(6); } catch (err) {} oneSettings(); return; }
  if (e.target.closest('[data-osexport]')) {
    const data = {exporte: new Date().toISOString(), garmin: S.g, withings: S.w, saisies: S.manual, profil: S.profile, reglages: S.app, plans: S.plans, tests: S.tset, entrainement: S.training ?? null};
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 1)], {type: 'application/json'})); a.download = 'tnr-donnees-' + TODAY + '.json'; document.body.appendChild(a); a.click(); a.remove();
    toast('Fichier de tes données créé'); return;
  }
  if (e.target.closest('[data-osupdate]')) { toast('Mise à jour…'); try { const r = await navigator.serviceWorker?.getRegistration(); await r?.update(); for (const k of await caches.keys()) await caches.delete(k); } catch (err) {} location.reload(); return; }
});
document.addEventListener('change', e => {
  if (e.target.matches?.('[data-osai]')) { osSaveApp({ai: e.target.checked}); toast(e.target.checked ? 'IA activée' : 'IA coupée : l\'appli tourne sur son propre programme'); return; }
  if (e.target.matches?.('[data-oscoach]')) { osSaveApp({coach: e.target.checked}); toast(e.target.checked ? 'Conseils des coachs affichés' : 'Conseils des coachs masqués'); return; }
});
document.addEventListener('input', e => { const k = e.target.dataset?.osrange; if (k) setPref(k, +e.target.value); });
