# Builds the LABO version (labo/index.html): the same engine (sprint-lab.html) with a new app on top
# (labo/nx.js + labo/nx.css) and a sandbox (labo/nx-head.js) so nothing reaches the real account.
# Run from the app folder:  python -I labo/build-labo.py
# The main app is rebuilt afterwards, so index.html at the root stays the real app.
import os, re, shutil, subprocess
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
src = open('sprint-lab.html', encoding='utf-8', newline='').read()
css = open('labo/nx.css', encoding='utf-8').read()
js = open('labo/nx.js', encoding='utf-8').read()
head = open('labo/nx-head.js', encoding='utf-8').read()
i = src.index('</style>'); src = src[:i] + css + src[i:]
j = src.rindex('</script>'); src = src[:j] + '\n' + js + '\n' + src[j:]
src = '<script>\n' + head + '\n</script>\n' + src
open('labo/labo-src.html', 'w', encoding='utf-8', newline='').write(src)
ps = ['powershell', '-ExecutionPolicy', 'Bypass', '-File', 'build.ps1', '-Source']
subprocess.run(ps + ['labo/labo-src.html'], check=True)
shutil.move('index.html', 'labo/index.html')
subprocess.run(ps + ['sprint-lab.html'], check=True)
h = open('labo/index.html', encoding='utf-8').read()
def must(o, n, cnt=None):
    global h
    c = h.count(o); assert c >= 1 and (cnt is None or c == cnt), (c, o); h = h.replace(o, n)
must('<link rel="manifest" href="manifest.webmanifest">', '')
must('src="icon-192.png', 'src="../icon-192.png')
must('href="icon-192.png', 'href="../icon-192.png')
must('href="apple-touch-icon.png', 'href="../apple-touch-icon.png')
must('<script src="supabase-db.js', '<script src="../supabase-db.js')
h = re.sub(r"<script>if \('serviceWorker' in navigator\) \{.*?\}</script>", '', h, count=1, flags=re.S)
assert "navigator.serviceWorker.register('sw.js')" not in h
must('const db = await recupGetDb();', 'const db = labSandbox(await recupGetDb());', 1)
must('<meta name="apple-mobile-web-app-title" content="TNR Athletics">', '<meta name="apple-mobile-web-app-title" content="TNR Labo"><title>TNR Labo</title>')
# The sandbox must run before every other script of the page.
assert h.index('function labSandbox') < h.index('const S = {'), 'nx-head.js must come first'
open('labo/index.html', 'w', encoding='utf-8', newline='').write(h)
os.remove('labo/labo-src.html')
print('labo built', len(h))
