# Récupération — builds the installable app from the Claude page (sprint-lab.html) and draws the "R" icons.
# Usage: powershell -ExecutionPolicy Bypass -File build.ps1 -Source <path to sprint-lab.html>
param([Parameter(Mandatory)][string]$Source)
$ErrorActionPreference = 'Stop'
$out = $PSScriptRoot
Add-Type -AssemblyName System.Drawing

# Icons: deep blue gradient, white "R". The maskable one keeps the letter inside the 80 % safe zone.
function New-Icon([int]$size, [string]$path, [double]$scale) {
  $bmp = New-Object System.Drawing.Bitmap $size, $size
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = 'AntiAlias'; $g.TextRenderingHint = 'AntiAliasGridFit'
  $rect = New-Object System.Drawing.Rectangle 0, 0, $size, $size
  $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush $rect, ([System.Drawing.Color]::FromArgb(47, 123, 245)), ([System.Drawing.Color]::FromArgb(29, 78, 216)), 45
  $g.FillRectangle($brush, $rect)
  $font = New-Object System.Drawing.Font 'Segoe UI', ([float]($size * $scale)), ([System.Drawing.FontStyle]::Bold), ([System.Drawing.GraphicsUnit]::Pixel)
  $sf = New-Object System.Drawing.StringFormat; $sf.Alignment = 'Center'; $sf.LineAlignment = 'Center'
  $rf = New-Object System.Drawing.RectangleF 0, ([float]($size * 0.03)), $size, $size
  $g.DrawString('R', $font, [System.Drawing.Brushes]::White, $rf, $sf)
  $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose(); $bmp.Dispose()
}
New-Icon 192 "$out\icon-192.png" 0.62
New-Icon 512 "$out\icon-512.png" 0.62
New-Icon 512 "$out\icon-maskable-512.png" 0.46
New-Icon 180 "$out\apple-touch-icon.png" 0.62

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
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="icon-192.png">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
<style>
:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}
body{margin:0}
img{max-width:100%}
[hidden]{display:none!important}
#login,#setpw{position:fixed;inset:0;z-index:100;display:flex;align-items:center;justify-content:center;padding:24px;background:var(--bg)}
#login form,#setpw form{width:min(360px,100%);display:flex;flex-direction:column;gap:12px;text-align:center;position:relative;z-index:1}
#login .logo,#setpw .logo{width:72px;height:72px;margin:0 auto 8px;border-radius:18px;background:linear-gradient(135deg,#2F7BF5,#1D4ED8);color:#fff;font:700 44px/72px system-ui,sans-serif}
#login input,#setpw input{font:inherit;padding:14px;border-radius:12px;border:1px solid var(--line);background:var(--card);color:var(--fg)}
#login .msg,#setpw .msg{font-size:.875rem;color:var(--fg2);min-height:1.4em;margin:0}
</style>
</head>
<body>
<div id="login" hidden><form><div class="logo">R</div><h1 style="margin:0">Récupération</h1><input name="email" type="email" required autocomplete="email" placeholder="ton e-mail"><input name="password" type="password" required autocomplete="current-password" placeholder="ton mot de passe"><button class="btn" type="submit">Se connecter</button><p class="msg"></p><button class="link" type="button" style="background:none;border:0;color:var(--fg2);font:inherit;font-size:.8125rem;text-decoration:underline">Pas encore de mot de passe ? Recevoir un lien par mail</button></form></div>
<div id="setpw" hidden><form><div class="logo">R</div><h1 style="margin:0;font-size:1.375rem">Choisis ton mot de passe</h1><p class="small muted" style="margin:0">Pour ouvrir l'appli sur n'importe quel navigateur avec <b class="who"></b>.</p><input name="password" type="password" autocomplete="new-password" placeholder="nouveau mot de passe"><button class="btn" type="submit">Enregistrer</button><p class="msg"></p><button class="later" type="button" style="background:none;border:0;color:var(--fg2);font:inherit;font-size:.8125rem">Plus tard</button></form></div>
'@
$scripts = @'
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js"></script>
<script src="supabase-db.js?v=5"></script>
<script>if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');</script>
<script>
'@
$idx = $page.IndexOf("`n<script>")
if ($idx -lt 0) { throw 'script tag not found' }
$page = $page.Substring(0, $idx) + "`n" + $scripts + $page.Substring($idx + "`n<script>".Length + 1)
[IO.File]::WriteAllText("$out\index.html", $head + $page + "`n</body>`n</html>`n", (New-Object System.Text.UTF8Encoding $false))
Write-Output "built: $out\index.html"
