# Lists the French texts of the app that the English table (labo/one-i18n-en.js) does not know yet.
# Run from the app folder:  python -I labo/i18n-missing.py  > missing.txt
# Each line is a text as the code writes it, {} standing for a value filled in by the code (a number, a name…).
# Translate them, add them to labo/one-i18n-en.js as  "texte français": "English text",  then rebuild.
# The list is generous on purpose (it may show code words or names that need no translation): skip those.
import os, re, json
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
BS = chr(92)
build = open('labo/build-labo.py', encoding='utf-8').read()
FILES = ['sprint-lab.html', 'supabase-db.js', 'build.ps1'] + [f for f in re.findall(r"open\('(labo/[\w-]+\.js)'", build)
                                                             if 'i18n' not in f and f not in ('labo/nx-head.js', 'labo/da.js')]
WORD = r"[A-Za-zÀ-ÿœŒ]"
FR = re.compile(r"[àâäçéèêëîïôöùûüœÀÂÇÉÈÊÎÔÙÛŒ]|\b(le|la|les|des|du|de|un|une|et|ou|pour|avec|sans|ton|ta|tes|est|sur|dans|par|pas|plus|jour|jours|semaine|mois|au|aux|en|tout|toute|tous|mon|ma|mes|tu|te|ce|cette|qui|que)\b", re.I)
HTMLY = re.compile(r"<|\.join\(|\.map\(|[Hh]tml|row\(|[Cc]hip|[Cc]ard|[Bb]tn|[Ii]con|svg|SVG|TICK|ICO|bar\(|pill|Row|tile|sec\(")


def tmpl_end(s, k):
    n = len(s)
    while k < n:
        if s[k] == BS: k += 2; continue
        if s[k] == '`': return k
        if s[k:k + 2] == '${': k = expr_end(s, k + 2) + 1; continue
        k += 1
    return n


def expr_end(s, k):
    n = len(s); d = 1
    while k < n:
        ch = s[k]
        if ch == '`': k = tmpl_end(s, k + 1) + 1; continue
        if ch in '\'"':
            k += 1
            while k < n and s[k] != ch and s[k] != '\n':
                if s[k] == BS: k += 1
                k += 1
            k += 1; continue
        if ch == '{': d += 1
        elif ch == '}':
            d -= 1
            if d == 0: return k
        k += 1
    return n


def lits(s):
    """Every string literal of a JS text; in a template literal, ${…} becomes {} (or a break when it holds HTML)."""
    i = 0; n = len(s)
    while i < n:
        c = s[i]
        if c == '/' and s[i + 1:i + 2] == '/' and (i == 0 or s[i - 1] != ':'):
            j = s.find('\n', i); i = n if j < 0 else j; continue
        if c == '/' and s[i + 1:i + 2] == '*':
            j = s.find('*/', i + 2); i = n if j < 0 else j + 2; continue
        if c in '\'"':
            j = i + 1; b = []
            while j < n and s[j] != c:
                if s[j] == BS: b.append(s[j:j + 2]); j += 2; continue
                if s[j] == '\n': break
                b.append(s[j]); j += 1
            yield ''.join(b); i = j + 1; continue
        if c == '`':
            j = i + 1; cur = []
            while j < n:
                if s[j] == BS: cur.append(s[j:j + 2]); j += 2; continue
                if s[j] == '`': break
                if s[j:j + 2] == '${':
                    k = expr_end(s, j + 2); ex = s[j + 2:k]
                    yield from lits(ex)
                    cur.append('\n' if HTMLY.search(ex) else '\x01'); j = k + 1; continue
                cur.append(s[j]); j += 1
            yield ''.join(cur); i = j + 1; continue
        i += 1


def segs(l):
    l = l.replace(BS + "'", "'").replace(BS + '"', '"').replace(BS + 'n', '\n').replace('&nbsp;', ' ')
    res = re.findall(r'(?:placeholder|aria-label|title|data-tip)="([^"]*)"', l)
    return res + re.sub(r'<[^>]*>', '\n', l).split('\n')


def clean(seg):
    seg = re.sub(r'\s+', ' ', seg).strip()
    seg = re.sub(r'^(\x01\s*)+|(\s*\x01)+$', '', seg).strip()
    return seg.replace('\x01', '{}')


table = {}
for line in open('labo/one-i18n-en.js', encoding='utf-8'):
    if line.startswith('"'): table.update(json.loads('{' + line.rstrip().rstrip(',') + '}'))
known = set(table) | {k[2:] for k in table if k.startswith('· ')}
def seen(s): return s in known or s.replace('{P}', '{}') in known
english = set(w.lower() for w in re.findall(r'[A-Za-z]+', ' '.join(table.values())))
out = []
for f in FILES:
    t = open(f, encoding='utf-8').read()
    for l in lits(t):
        for seg in segs(l):
            seg = clean(seg)
            if len(seg) < 2 or seen(seg) or seg in out or not re.search(WORD + '{2}', seg): continue
            if re.fullmatch(r'[\w.:#\-\[\]=>*() ]+', seg) and ' ' not in seg and not re.search('[À-ÿ]', seg) and seg[:1].islower(): continue
            words = re.findall(WORD + '+', seg.lower())
            if not FR.search(seg) and all(w in english for w in words): continue
            if not FR.search(seg) and not re.search(r'[A-ZÀ-Ý]', seg[:1]) and ' ' not in seg: continue
            out.append(seg)
import sys
sys.stdout.reconfigure(encoding='utf-8')
print('\n'.join(out))
