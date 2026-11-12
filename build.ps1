# TNR Athletics — builds the installable app from the Claude page (sprint-lab.html, kept in this folder).
# Usage: powershell -ExecutionPolicy Bypass -File build.ps1 -Source <path to sprint-lab.html>
param([Parameter(Mandatory)][string]$Source)
$ErrorActionPreference = 'Stop'
$out = $PSScriptRoot

# Icons: the TNR Athletics logo. They are drawn from brand/*.svg by brand/generer_icone.py + build-icons.sh and kept as PNG files here,
# so the build no longer redraws them.

$page = [IO.File]::ReadAllText($Source)
$page = $page.Replace('<meta name="claude:viewport-fit-sides" content="cover">', '')
$page = $page.Replace("const db = window.claude?.use ? await window.claude.use('db') : null;", 'const db = await recupGetDb();')

$head = @'
<!doctype html>
<html lang="fr" translate="no">
<head>
<meta charset="utf-8">
<meta name="google" content="notranslate">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#000000">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="TNR Athletics">
<meta name="application-name" content="TNR Athletics">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="icon-192.png?v=tnr">
<link rel="apple-touch-icon" href="apple-touch-icon.png?v=tnr">
<style>
body{margin:0}
img{max-width:100%}
[hidden]{display:none!important}
#login,#setpw{position:fixed;inset:0;z-index:100;display:flex;align-items:center;justify-content:center;padding:24px;background:var(--bg)}
#login form,#setpw form{width:min(360px,100%);display:flex;flex-direction:column;gap:12px;text-align:center;position:relative;z-index:1}
#login .logo,#setpw .logo{display:block;width:80px;height:80px;margin:0 auto 8px;border-radius:18px;box-shadow:0 0 0 1px var(--line),0 6px 18px rgba(11,23,51,.2)}
#login input,#setpw input{font:inherit;padding:14px;border-radius:12px;border:1px solid var(--line);background:var(--card);color:var(--fg)}
#login .msg,#setpw .msg{font-size:.875rem;color:var(--fg2);min-height:1.4em;margin:0}
#splash{position:fixed;inset:0;z-index:300;background:#0B1733;display:flex;align-items:center;justify-content:center;transition:background-color .45s ease .35s,opacity .35s ease .75s;pointer-events:none}
#splash .w{display:flex;flex-direction:column;align-items:center;color:#fff;font-family:'Segoe UI Variable Display','Segoe UI',Roboto,system-ui,sans-serif;will-change:transform;transition:transform .95s cubic-bezier(.7,0,.84,0)}
#splash .t{font-size:min(28vw,150px);font-weight:800;letter-spacing:-.01em;line-height:1}
#splash .a{font-size:min(6.4vw,34px);font-weight:600;letter-spacing:.32em;margin:.25em 0 0 .32em;transition:opacity .25s}
#splash.go{background-color:rgba(11,23,51,0)}#splash.go .a{opacity:0}#splash.go{opacity:0}
@media (prefers-reduced-motion:reduce){#splash .w{transition:none}#splash{transition:opacity .3s}}
</style>
</head>
<body>
<div id="splash" aria-hidden="true"><div class="w"><div class="t"><span>T</span><span class="n">N</span><span>R</span></div><div class="a">ATHLETICS</div></div></div>
<script>
// Opening screen: the logo while the data and the Garmin / Withings sync arrive (about 5 s at most), then a zoom into the N.
(function () {
  var t0 = Date.now(), st = {}, done = false, el = document.getElementById('splash');
  function go() {
    if (done || !el) return; done = true;
    var w = el.querySelector('.w'), n = el.querySelector('.n'), r = n.getBoundingClientRect(), R = w.getBoundingClientRect();
    // Zoom centred on the middle of the N (on its diagonal stroke): the screen turns white, then fades onto the app.
    w.style.transformOrigin = (r.left + r.width / 2 - R.left) + 'px ' + (r.top + r.height * .5 - R.top) + 'px';
    el.classList.add('go'); w.style.transform = 'scale(60)';
    setTimeout(function () { el.remove(); }, 1300);
  }
  function check() { var e = Date.now() - t0; if (done) return; if (e > 900 && st.data && (st.sync || e > 5000)) go(); }
  window.TNR_SPLASH = {ready: function (k) { st[k] = 1; check(); }};
  var iv = setInterval(function () { var l = document.getElementById('login'); if (l && !l.hidden) { go(); } check(); if (done || Date.now() - t0 > 8000) { clearInterval(iv); go(); } }, 150);
})();
</script>
<div id="login" hidden><form><img class="logo" src="icon-192.png?v=tnr" alt="TNR Athletics"><h1 style="margin:0">TNR Athletics</h1><input name="email" type="email" required autocomplete="email" placeholder="ton e-mail"><input name="password" type="password" required autocomplete="current-password" placeholder="ton mot de passe"><button class="btn" type="submit">Se connecter</button><p class="msg"></p><button class="link" type="button" style="background:none;border:0;color:var(--fg2);font:inherit;font-size:.8125rem;text-decoration:underline">Pas encore de mot de passe ? Recevoir un lien par mail</button></form></div>
<div id="setpw" hidden><form><img class="logo" src="icon-192.png?v=tnr" alt="TNR Athletics"><h1 style="margin:0;font-size:1.375rem">Choisis ton mot de passe</h1><p class="small muted" style="margin:0">Pour ouvrir l'appli sur n'importe quel navigateur avec <b class="who"></b>.</p><input name="password" type="password" autocomplete="new-password" placeholder="nouveau mot de passe"><button class="btn" type="submit">Enregistrer</button><p class="msg"></p><button class="later" type="button" style="background:none;border:0;color:var(--fg2);font:inherit;font-size:.8125rem">Plus tard</button></form></div>
'@
$scripts = @'
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js"></script>
<script src="supabase-db.js?v=65"></script>
<script>if ('serviceWorker' in navigator) {
  // A new version found by the pull-to-refresh takes over at once: reload into it (not on the very first install).
  const had = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.register('sw.js');
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (had) location.reload(); });
}</script>
<script>
'@
$idx = $page.IndexOf("`n<script>")
if ($idx -lt 0) { throw 'script tag not found' }
$page = $page.Substring(0, $idx) + "`n" + $scripts + $page.Substring($idx + "`n<script>".Length + 1)
[IO.File]::WriteAllText("$out\index.html", $head + $page + "`n</body>`n</html>`n", (New-Object System.Text.UTF8Encoding $false))
Write-Output "built: $out\index.html"
