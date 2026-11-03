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
<html lang="fr">
<head>
<meta charset="utf-8">
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
</style>
</head>
<body>
<div id="login" hidden><form><img class="logo" src="icon-192.png?v=tnr" alt="TNR Athletics"><h1 style="margin:0">TNR Athletics</h1><input name="email" type="email" required autocomplete="email" placeholder="ton e-mail"><input name="password" type="password" required autocomplete="current-password" placeholder="ton mot de passe"><button class="btn" type="submit">Se connecter</button><p class="msg"></p><button class="link" type="button" style="background:none;border:0;color:var(--fg2);font:inherit;font-size:.8125rem;text-decoration:underline">Pas encore de mot de passe ? Recevoir un lien par mail</button></form></div>
<div id="setpw" hidden><form><img class="logo" src="icon-192.png?v=tnr" alt="TNR Athletics"><h1 style="margin:0;font-size:1.375rem">Choisis ton mot de passe</h1><p class="small muted" style="margin:0">Pour ouvrir l'appli sur n'importe quel navigateur avec <b class="who"></b>.</p><input name="password" type="password" autocomplete="new-password" placeholder="nouveau mot de passe"><button class="btn" type="submit">Enregistrer</button><p class="msg"></p><button class="later" type="button" style="background:none;border:0;color:var(--fg2);font:inherit;font-size:.8125rem">Plus tard</button></form></div>
'@
$scripts = @'
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js"></script>
<script src="supabase-db.js?v=26"></script>
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
