# Builds the two apps from the same page (sprint-lab.html):
#   · index.html (the real app, phone and computer) = the page + labo/one.css + labo/one.js: floating glass bars,
#     T/N/R switch, Accueil, animations, opening where the letters fly into place;
#   · labo/index.html = the classic page (the app as it was before the switch), kept to reach what only it still has.
# Both read and write the real account (no sandbox any more).
# Run from the app folder:  python -I labo/build-labo.py
import os, re, shutil, subprocess
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
src = open('sprint-lab.html', encoding='utf-8', newline='').read()
css = open('labo/one.css', encoding='utf-8').read()
js = open('labo/one.js', encoding='utf-8').read()
ps = ['powershell', '-ExecutionPolicy', 'Bypass', '-File', 'build.ps1', '-Source']

def must(h, o, n, cnt=None):
    c = h.count(o); assert c >= 1 and (cnt is None or c == cnt), (c, o); return h.replace(o, n)

# 1) The classic page, moved to labo/ (same account, no install, no service worker).
subprocess.run(ps + ['sprint-lab.html'], check=True)
h = open('index.html', encoding='utf-8').read()
h = must(h, '<link rel="manifest" href="manifest.webmanifest">', '')
h = must(h, 'src="icon-192.png', 'src="../icon-192.png')
h = must(h, 'href="icon-192.png', 'href="../icon-192.png')
h = must(h, 'href="apple-touch-icon.png', 'href="../apple-touch-icon.png')
h = must(h, '<script src="supabase-db.js', '<script src="../supabase-db.js')
h = re.sub(r"<script>if \('serviceWorker' in navigator\) \{.*?\}</script>", '', h, count=1, flags=re.S)
assert "navigator.serviceWorker.register('sw.js')" not in h
h = must(h, '<meta name="apple-mobile-web-app-title" content="TNR Athletics">', '<meta name="apple-mobile-web-app-title" content="TNR Classique"><title>TNR Classique</title>')
open('labo/index.html', 'w', encoding='utf-8', newline='').write(h)

# 2) The real app: the same page dressed by one.css / one.js.
i = src.index('</style>'); s2 = src[:i] + css + src[i:]
j = s2.rindex('</script>'); s2 = s2[:j] + '\n' + js + '\n' + s2[j:]
open('labo/app-src.html', 'w', encoding='utf-8', newline='').write(s2)
subprocess.run(ps + ['labo/app-src.html'], check=True)
os.remove('labo/app-src.html')
h = open('index.html', encoding='utf-8').read()
# Opening: the T, N and R of the logo fly into their places (labo/one.js, ONE_SPLASH) instead of the zoom into the N.
HID = "    if (document.hidden) { el.remove(); bars(); return; }" + chr(10)
h = must(h, HID, HID + "    if (window.ONE_SPLASH && window.ONE_SPLASH(el, svg, bars)) return;" + chr(10), 1)
assert "navigator.serviceWorker.register('sw.js')" in h and 'labSandbox' not in h
open('index.html', 'w', encoding='utf-8', newline='').write(h)
print('built: index.html (nouvelle appli)', len(h), '· labo/index.html (classique)')
