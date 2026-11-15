# Builds TNR TEST (tnr-test/index.html): the real engine (sprint-lab.html) + the labo layer (labo/nx.*)
# + the TNR Test layer (labo/nx-plus.*), inside the labo sandbox (labo/nx-head.js): it reads the real account,
# and what is done here stays on the device. Run from the app folder:  python -I tnr-test/build-tnr-test.py
# The main app (index.html at the root) is rebuilt afterwards and stays the real app.
import os, re, shutil, subprocess
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
rd = lambda p: open(p, encoding='utf-8').read()
src = open('sprint-lab.html', encoding='utf-8', newline='').read()
css = rd('labo/nx.css') + '\n' + rd('labo/nx-plus.css')
js = rd('labo/nx.js') + '\n' + rd('labo/nx-plus.js')
i = src.index('</style>'); src = src[:i] + css + src[i:]
j = src.rindex('</script>'); src = src[:j] + '\n' + js + '\n' + src[j:]
src = '<script>\n' + rd('labo/nx-head.js') + '\n</script>\n' + src
open('tnr-test/src.html', 'w', encoding='utf-8', newline='').write(src)
ps = ['powershell', '-ExecutionPolicy', 'Bypass', '-File', 'build.ps1', '-Source']
subprocess.run(ps + ['tnr-test/src.html'], check=True)
shutil.move('index.html', 'tnr-test/index.html')
subprocess.run(ps + ['sprint-lab.html'], check=True)
h = rd('tnr-test/index.html')
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
must('<meta name="apple-mobile-web-app-title" content="TNR Athletics">', '<meta name="apple-mobile-web-app-title" content="TNR Test"><title>TNR Test</title>')
assert h.index('function labSandbox') < h.index('const S = {'), 'nx-head.js must come first'
open('tnr-test/index.html', 'w', encoding='utf-8', newline='').write(h)
os.remove('tnr-test/src.html')
print('tnr-test built', len(h))
