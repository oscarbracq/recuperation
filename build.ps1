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
#splash{position:fixed;inset:0;z-index:300;background:#0B1733;pointer-events:none;--d:240px;--sh:0px}
#splash svg{position:absolute;left:50%;top:50%;width:var(--d);height:var(--d);margin:calc(var(--d) / -2 - var(--sh)) 0 0 calc(var(--d) / -2);fill:#fff}
#splash .sp{position:absolute;left:50%;top:calc(50% - var(--sh) + var(--d) * .3);width:22px;height:22px;margin:-11px 0 0 -11px;box-sizing:border-box;border-radius:50%;border:2.5px solid rgba(255,255,255,.16);border-top-color:rgba(255,255,255,.9);animation:tnrspin .75s linear infinite,tnrfade .35s ease .15s both;transition:opacity .2s}
#splash .sp.out{opacity:0}
@keyframes tnrspin{to{transform:rotate(360deg)}}@keyframes tnrfade{from{opacity:0}}
</style>
</head>
<body>
<div id="splash" aria-hidden="true"><svg viewBox="0 0 1024 1024"><path d="M236 375.25 387 375.25 387.13 375.50 387 411.67 333.95 411.75 333.90 573.75 333.75 574 289.25 574 289.03 573.75 289 411.86 288.75 411.67 236 411.67 235.83 411.50Z"/><path d="M413.49 375.25 461.25 375.25 461.50 375.42 540.08 493.75 545.09 502 549.50 509.96 550 510.25 550.16 510 549.90 504.75 549.64 488 549.64 375.50 550 375.25 591.75 375.25 591.90 375.50 591.90 573.75 591.75 574 546.75 573.94 464.95 451.50 459.91 443.25 455.25 434.88 454.87 435 455.38 457 455.40 573.75 455.25 574 413.25 573.97Z"/><path fill-rule="evenodd" d="M632 375.25 702.75 375.25 714.50 375.66 725.25 376.92 732.50 378.46 737.75 379.95 742.50 381.67 747.50 383.98 751.75 386.41 756 389.45 760 393.06 763.82 397.25 767.82 403 770.85 409 773.07 415.50 774.30 421.25 775.04 429 774.82 437.25 773.84 443.75 772.07 450.25 769.85 455.75 768.08 459.25 765.84 463 761.80 468.50 756.50 474.08 751.50 478.07 746 481.56 742 483.57 737.75 485.35 733.25 486.85 732.93 487.25 738.50 490.22 743.50 493.93 748.30 498.75 751.59 502.75 754.34 506.50 757.83 511.75 762.57 519.75 792.83 573.25 793.11 573.75 793 574 743 573.99 713.33 520 711.32 516.50 707.33 510.50 705.30 508 702.50 505.15 699 502.66 697 501.64 694 500.73 691.25 500.24 688.75 500.12 676.57 500.25 676.50 573.90 632 574 631.81 573.75ZM676.75 409.38 676.57 409.50 676.57 465.50 676.75 465.75 697.50 465.75 702.50 465.33 707.50 464.36 710.50 463.37 714.75 461.33 717.75 459.31 719.78 457.50 722.05 455 724.36 451.50 726.57 446.25 727.59 441.50 727.94 436 727.84 432.75 727.34 429.25 726.82 427 725.31 423 722.82 419 720.25 416.23 716.25 413.42 713 411.92 709 410.63 705.25 409.92 699.25 409.40Z"/><path fill-rule="evenodd" d="M669.72 609 673.50 608.88 676.50 609.16 679.50 609.90 682.50 611.20 684.75 612.70 687.25 615.06 689.05 617.50 690.33 620 685.50 622.05 683.75 622.57 682.34 620.25 681.29 619 679.75 617.65 678.50 616.88 676.75 616.15 674.50 615.66 670.75 615.62 667 616.68 664.25 618.42 661.84 621 660.10 624 659.10 627 658.60 630 658.60 634.50 659.10 637.50 659.94 640 661.14 642.25 663.03 644.50 665 646.08 667.50 647.31 671 648.11 674.50 648.12 676.25 647.83 678.50 647.05 680.50 645.84 682.84 643.50 684.25 641.26 690.71 644.25 689.82 646 688.50 647.85 686.69 649.75 684.75 651.33 682.75 652.59 680 653.80 675.50 654.80 670 654.84 666.50 654.29 662.75 653.07 659.50 651.28 656.47 648.75 653.74 645.25 651.97 641.50 650.93 637.25 650.67 634.75 650.65 631.50 651.20 626.50 652.44 622.25 654.50 618.25 656.20 616 657.75 614.38 661.25 611.72 665.25 609.91ZM731.72 609 735 608.90 737.25 609.16 739.25 609.66 741.25 610.45 743 611.46 745 613.09 746.30 614.50 747.92 617 747.75 617.30 741.75 620.15 739.90 617.75 737.75 616.13 735.25 615.37 731.75 615.37 729.75 615.92 728.50 616.62 727.34 617.75 726.64 619 726.33 620.50 726.43 622.25 727.13 624 728.03 625 729.25 625.84 731 626.61 737.75 628.46 740.25 629.43 742.50 630.66 744.25 631.96 745.51 633.25 746.78 635.25 747.55 637.25 748.05 640.25 747.80 644.25 747 646.93 745.51 649.50 743.25 651.84 741 653.28 738.25 654.30 735.25 654.84 731 654.86 728.75 654.60 726.50 654.05 724 653.07 721.50 651.57 719.46 649.75 718 647.87 716.88 645.75 723.25 642.50 725.16 645.25 726.25 646.31 727.75 647.30 729 647.85 731 648.35 734.50 648.38 736.75 647.85 738.25 647.08 739.63 645.75 740.31 644.50 740.65 643.25 740.65 641 740.08 639.25 738.75 637.59 736 635.92 727.50 633.33 724 631.56 722.31 630.25 720.95 628.75 720.19 627.50 719.42 625.50 718.95 622.25 719.19 619.25 719.72 617.25 720.99 614.75 723.07 612.50 725.75 610.70 728.25 609.67ZM290.17 609.75 298.66 609.75 315 654.05 307 654.06 303.30 644 303 643.62 285.50 643.62 281.74 654 273.67 654ZM331.11 609.75 363.43 609.75 363.44 615.75 363.25 615.94 351.25 615.95 351.05 616.25 351 654.05 343.50 654 343.40 616 331.25 615.92 331.09 615.75ZM390.36 609.75 397.84 609.75 397.85 628.25 398 628.38 418.50 628.38 418.67 628.25 418.68 609.75 426.24 609.75 426.25 654 418.67 654 418.67 635.25 418.50 634.95 398 634.95 397.85 635.25 397.85 654 390.34 654ZM456.93 609.75 464.43 609.75 464.44 647.50 464.75 647.65 481.50 647.66 481.69 648 481.69 654 481.50 654.12 456.92 654ZM507.82 609.75 531.89 609.75 531.91 615.75 531.75 616.03 515.50 616.05 515.33 616.25 515.33 628.25 515.50 628.40 530.50 628.41 530.75 628.75 530.75 634.50 530.50 634.84 515.50 634.85 515.33 635 515.33 647.50 515.50 647.80 532.75 647.83 532.91 648 532.91 654 532.75 654.11 507.81 654ZM556.11 609.75 588.43 609.75 588.44 615.75 588.25 615.94 576.25 615.95 576.05 616.25 576 654.05 568.50 654 568.40 616 556.25 615.92 556.09 615.75ZM615.36 609.75 622.84 609.75 622.75 654.10 615.34 654ZM294.25 617.25 287.50 637.29 301.04 637.25Z"/></svg><div class="sp"></div></div>
<script>
// Opening screen: the logo exactly as on the icon (same drawing, same size as Android's own launch screen), a small
// spinner while the data and the Garmin / Withings sync arrive, then, as soon as it is all there, a zoom into the N:
// the navy stays solid, the N becomes a window onto the app and grows until it fills the screen.
(function () {
  var el = document.getElementById('splash'), svg = el.querySelector('svg'), sp = el.querySelector('.sp');
  var t0 = Date.now(), st = {}, done = false, ua = navigator.userAgent;
  var vw = innerWidth, vh = innerHeight, D = Math.min(vw, vh) < 600 ? 240 : 300, sh = 0, AND = /Android/i.test(ua) && matchMedia('(display-mode: standalone)').matches;
  // Android draws its own launch screen first: the same logo, a little bigger, centred on the whole screen (status bar
  // included). Measured on his S26 from a screen recording: same size and place here, so the hand-over can't be seen.
  if (AND) D = 274;
  function place() {
    vw = innerWidth; vh = innerHeight;
    // The bar at the bottom (gesture line) is about 15 px; the rest of what the page lacks is the status bar at the top.
    if (AND) { var I = Math.max(0, screen.height - vh), top = Math.max(0, Math.min(48, I - 15.2)); sh = top - I / 2; }
    el.style.setProperty('--d', D + 'px'); el.style.setProperty('--sh', sh + 'px');
  }
  place(); addEventListener('resize', place);
  // The phone's top bar stays navy, like Android's launch screen, until the app shows.
  window.TNR_SPLASH_ON = true;
  try { document.querySelectorAll('meta[name="theme-color"]').forEach(function (m) { m.content = '#0B1733'; }); } catch (e) {}
  function bars() { window.TNR_SPLASH_ON = false; try { if (typeof syncBars === 'function') syncBars(); else document.querySelectorAll('meta[name="theme-color"]').forEach(function (m) { m.content = '#000000'; }); } catch (e) {} }
  var PX = 504, PY = 474.6, RIN = 19; // a point in the middle of the N's diagonal, and the stroke's half width there
  function sm(a, b, x) { x = Math.max(0, Math.min(1, (x - a) / (b - a))); return x * x * (3 - 2 * x); }
  function zoom() {
    if (!el.isConnected) return;
    if (document.hidden) { el.remove(); bars(); return; }
    removeEventListener('resize', place); vw = innerWidth; vh = innerHeight;
    var dpr = Math.min(devicePixelRatio || 1, 3), c = document.createElement('canvas'), r = svg.getBoundingClientRect();
    c.width = Math.round(vw * dpr); c.height = Math.round(vh * dpr);
    // The canvas always covers the whole page, even if the page grows during the zoom (no black band at the bottom).
    c.style.cssText = 'position:fixed;left:0;top:0;width:100%;height:100%;z-index:301;pointer-events:none';
    var x = c.getContext('2d'), k = r.width / 1024, px = r.left + PX * k, py = r.top + PY * k;
    var ps = svg.querySelectorAll('path'), PT = new Path2D(ps[0].getAttribute('d')), PN = new Path2D(ps[1].getAttribute('d')), PR = new Path2D(ps[2].getAttribute('d')), PA = new Path2D(ps[3].getAttribute('d'));
    var far = Math.max(Math.hypot(px, py), Math.hypot(vw - px, py), Math.hypot(px, vh - py), Math.hypot(vw - px, vh - py));
    var L = Math.log(far / (RIN * k) * 1.06), T = 1150, ts = null;
    function fit() {
      if (innerWidth === vw && innerHeight === vh) return;
      px += (innerWidth - vw) / 2; py += (innerHeight - vh) / 2; vw = innerWidth; vh = innerHeight;
      c.width = Math.round(vw * dpr); c.height = Math.round(vh * dpr);
    }
    function draw(t) {
      fit();
      var e = t * t * t * (t * (t * 6 - 15) + 10), s = Math.exp(L * e), rev = sm(.03, .34, t), fa = 1 - sm(0, .2, t), m = dpr * s * k;
      x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1; x.fillStyle = '#0B1733'; x.fillRect(0, 0, c.width, c.height);
      x.setTransform(m, 0, 0, m, dpr * px - m * PX, dpr * py - m * PY);
      if (rev > 0) { x.globalCompositeOperation = 'destination-out'; x.globalAlpha = rev; x.fill(PN); x.globalCompositeOperation = 'source-over'; }
      x.fillStyle = '#fff'; x.globalAlpha = 1 - rev; if (rev < 1) x.fill(PN);
      // T and R turn into windows onto the app too, at the same pace as the N, while they fly out of the screen.
      if (rev > 0) { x.globalCompositeOperation = 'destination-out'; x.globalAlpha = rev; x.fill(PT); x.fill(PR, 'evenodd'); x.globalCompositeOperation = 'source-over'; }
      x.globalAlpha = 1 - rev; if (rev < 1) { x.fill(PT); x.fill(PR, 'evenodd'); }
      if (fa > 0) { x.globalAlpha = fa; x.fill(PA, 'evenodd'); }
    }
    draw(0); document.body.appendChild(c); el.remove();
    var kill = setTimeout(function () { c.remove(); bars(); }, T + 600);
    requestAnimationFrame(function f(now) { if (ts == null) ts = now; var t = Math.min(1, (now - ts) / T); draw(t); if (t < 1) requestAnimationFrame(f); else { clearTimeout(kill); c.remove(); bars(); } });
  }
  function go() {
    if (done) return; done = true; clearInterval(iv);
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || !window.Path2D) { el.style.transition = 'opacity .3s'; el.style.opacity = '0'; setTimeout(function () { el.remove(); bars(); }, 350); return; }
    // The spinner goes first, then the zoom starts on a quiet frame.
    sp.classList.add('out'); setTimeout(function () { requestAnimationFrame(function () { requestAnimationFrame(zoom); }); }, 180);
    setTimeout(function () { if (el.isConnected) zoom(); }, 900);
  }
  function check() { if (!done && st.data && st.sync) go(); }
  window.TNR_SPLASH = {ready: function (k) { st[k] = 1; check(); }};
  var iv = setInterval(function () { var l = document.getElementById('login'), s = document.getElementById('setpw'); if ((l && !l.hidden) || (s && !s.hidden) || Date.now() - t0 > 15000) go(); }, 120);
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
