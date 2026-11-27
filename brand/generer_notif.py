"""Images des notifications TNR Athletics (deux couleurs : bleu marine et blanc, comme l'icône).

· notif-badge.png : la petite icône de la barre d'état Android (blanc sur transparent, Android n'en garde que la forme) ;
· notif-matin.png / notif-soir.png : la grande image sous le texte de la notification (format 2:1).
Lancer depuis le dossier de l'appli :  python -I brand/generer_notif.py
"""
from PIL import Image, ImageDraw, ImageFont
NAVY, WHITE = (11, 23, 51), (255, 255, 255)
F = 'C:/Windows/Fonts/'
def font(size, bold=True):
    for n in (['seguibl.ttf', 'segoeuib.ttf'] if bold else ['segoeuisl.ttf', 'segoeui.ttf']):
        try: return ImageFont.truetype(F + n, size)
        except OSError: pass
    return ImageFont.load_default()

def spaced(d, xy, text, f, fill, track, anchor_center=True):
    w = sum(d.textlength(c, font=f) for c in text) + track * (len(text) - 1)
    x, y = xy; x = x - w / 2 if anchor_center else x
    for c in text: d.text((x, y), c, font=f, fill=fill); x += d.textlength(c, font=f) + track

# 1) Badge : « TNR » en blanc, dessiné en grand puis réduit pour des bords nets.
S = 384; im = Image.new('RGBA', (S, S), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
f = font(190); w = d.textlength('TNR', font=f); d.text(((S - w) / 2, S / 2), 'TNR', font=f, fill=WHITE, anchor='lm')
im.resize((96, 96), Image.LANCZOS).save('notif-badge.png')

# 2) Les deux grandes images.
def banner(name, big, small, moon):
    W, H, k = 1024, 512, 2
    im = Image.new('RGB', (W * k, H * k), NAVY); d = ImageDraw.Draw(im)
    cx, cy, r = W * k * 0.80, H * k * 0.50, 120 * k
    if moon:   # croissant de lune : un disque blanc mordu par un disque bleu
        d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=WHITE); d.ellipse((cx - r + 70 * k, cy - r - 30 * k, cx + r + 70 * k, cy + r - 30 * k), fill=NAVY)
    else:      # soleil : un disque et ses rayons, en blanc
        import math
        d.ellipse((cx - 70 * k, cy - 70 * k, cx + 70 * k, cy + 70 * k), fill=WHITE)
        for i in range(12):
            a = i * math.pi / 6; d.line((cx + math.cos(a) * 100 * k, cy + math.sin(a) * 100 * k, cx + math.cos(a) * 140 * k, cy + math.sin(a) * 140 * k), fill=WHITE, width=14 * k)
    x0 = 80 * k
    spaced(d, (x0, 70 * k), 'TNR  ATHLETICS', font(30 * k), WHITE, 7 * k, False)
    d.text((x0 - 6 * k, 215 * k), big, font=font(120 * k), fill=WHITE, anchor='lm')
    d.text((x0, 335 * k), small, font=font(42 * k, False), fill=WHITE, anchor='lm')
    d.rounded_rectangle((x0, 400 * k, x0 + 330 * k, 462 * k), radius=31 * k, outline=WHITE, width=4 * k)
    d.text((x0 + 165 * k, 431 * k), '1 minute  →', font=font(32 * k), fill=WHITE, anchor='mm')
    im.resize((W, H), Image.LANCZOS).save(name, optimize=True)

banner('notif-matin.png', 'Bonjour', 'Ton questionnaire du matin', False)
banner('notif-soir.png', 'Bonsoir', 'Ton questionnaire du soir', True)
print('ok')
