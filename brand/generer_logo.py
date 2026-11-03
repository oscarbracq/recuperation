"""Génère le logo TRF Athletics en SVG (variantes + icône d'appli).

Tout est dessiné avec des polygones : aucune police n'est nécessaire.
Lancer :  python generer_logo.py
"""
from pathlib import Path

OUT = Path(__file__).parent
SIZE = 1024
CX = SIZE / 2

NAVY = "#0B1733"
WHITE = "#F5F3EE"
GOLD_FLAT = "#D2A64E"


def pts(points, dx=0.0, dy=0.0):
    return " ".join(f"{x + dx:.2f},{y + dy:.2f}" for x, y in points)


def path(polys, dx=0.0, dy=0.0):
    """Plusieurs contours dans un seul chemin (evenodd => trous)."""
    return " ".join("M" + pts(p, dx, dy).replace(" ", " L") + " Z" for p in polys)


# ---------------------------------------------------------------- chapeau
def hat(apex_y, base_y, half_w, thick):
    # Triangle isocèle évidé : le triangle intérieur est une homothétie
    # autour du centre du cercle inscrit, ce qui donne un contour d'épaisseur égale.
    h = base_y - apex_y
    side = (half_w ** 2 + h ** 2) ** 0.5
    r = (half_w * h) / (half_w + side)
    iy = base_y - r
    k = (r - thick) / r
    outer = [(CX, apex_y), (CX + half_w, base_y), (CX - half_w, base_y)]
    inner = [(CX + k * (x - CX), iy + k * (y - iy)) for x, y in outer]
    return [outer, inner]


# ---------------------------------------------------------------- TRF
STROKE = 44  # même épaisseur pour le chapeau, la barre et toutes les lettres de TRF


def trf(bar_top, base):
    """Renvoie (T + barre + F d'un seul tenant, R).

    T, barre et F forment UNE seule forme : aucune jointure visible.
    Les bouts de la barre et du bras du F sont coupés à 45°.
    """
    t = STROKE
    g, r_w, arm = 22, 128, 78
    a = (SIZE - t - (2 * g + r_w + t)) / 2          # bord gauche du fût du T
    b = a + t + g + r_w + g                          # bord gauche du fût du F
    bb = bar_top + t                                 # bas de la barre
    fr = b + t                                       # bord droit du fût du F

    # bras du milieu du F : plus court que la barre, placé un peu haut
    mid_t = bb + (base - bb) * 0.27
    mid_b = mid_t + t
    mid_len = 36                                     # longueur en bas du bras
    tf = [(a - arm - t, bar_top), (fr + arm + t, bar_top), (fr + arm, bb),
          (fr, bb), (fr, mid_t), (fr + mid_len + t, mid_t), (fr + mid_len, mid_b),
          (fr, mid_b), (fr, base), (b, base), (b, bb), (a + t, bb),
          (a + t, base), (a, base), (a, bb), (a - arm, bb)]

    # R plus petit, logé sous la barre, traits de la même épaisseur
    x0 = a + t + g
    x1 = x0 + r_w
    y0 = bb + 14
    bowl_b = y0 + 3 * t                             # bas de la panse
    ch, cin, notch, leg = 20, 8, 14, 48
    r_outer = [(x0, y0), (x1 - ch, y0), (x1, y0 + ch), (x1, bowl_b - notch),
               (x1 - notch, bowl_b), (x1, base), (x1 - leg, base),
               (x1 - leg - notch, bowl_b), (x0 + t, bowl_b), (x0 + t, base), (x0, base)]
    r_inner = [(x0 + t, y0 + t), (x1 - t - cin, y0 + t), (x1 - t, y0 + t + cin),
               (x1 - t, bowl_b - t), (x0 + t, bowl_b - t)]
    return [tf], [r_outer, r_inner]


# ---------------------------------------------------------------- ATHLETICS
def glyphs(H, s):
    ch = s * 0.8
    # A : sommet plat, jambes d'épaisseur s, barre transversale, creux triangulaire
    W = 50
    sl = (W / 2 - 6) / H                     # pente des jambes
    li = lambda y: s + sl * (H - y)          # bord intérieur gauche
    ri = lambda y: W - s - sl * (H - y)      # bord intérieur droit
    cb_t, cb_b = H * 0.62, H * 0.62 + s - 2  # barre transversale
    ya = H - (W - 2 * s) / (2 * sl)          # pointe du creux
    A = [[(0, H), (W / 2 - 6, 0), (W / 2 + 6, 0), (W, H), (W - s, H),
          (ri(cb_b), cb_b), (li(cb_b), cb_b), (s, H)],
         [(W / 2, ya), (ri(cb_t), cb_t), (li(cb_t), cb_t)]]
    T = [[(0, 0), (40, 0), (40, s), (20 + s / 2, s), (20 + s / 2, H),
          (20 - s / 2, H), (20 - s / 2, s), (0, s)]]
    m0, m1 = (H - s) / 2, (H + s) / 2
    Hh = [[(0, 0), (s, 0), (s, m0), (40 - s, m0), (40 - s, 0), (40, 0), (40, H),
           (40 - s, H), (40 - s, m1), (s, m1), (s, H), (0, H)]]
    L = [[(0, 0), (s, 0), (s, H - s), (34, H - s), (34, H), (0, H)]]
    E = [[(0, 0), (34, 0), (34, s), (s, s), (s, m0), (30, m0), (30, m1), (s, m1),
          (s, H - s), (34, H - s), (34, H), (0, H)]]
    I = [[(0, 0), (s, 0), (s, H), (0, H)]]
    C = [[(ch, 0), (38, 0), (38, s), (s, s), (s, H - s), (38, H - s), (38, H),
          (ch, H), (0, H - ch), (0, ch)]]
    S = [[(ch, 0), (38, 0), (38, s), (s, s), (s, m0), (38 - ch, m0), (38, m0 + ch),
          (38, H - ch), (38 - ch, H), (0, H), (0, H - s), (38 - s, H - s), (38 - s, m1),
          (ch, m1), (0, m1 - ch), (0, ch)]]
    widths = {"A": W, "T": 40, "H": 40, "L": 34, "E": 34, "I": s, "C": 38, "S": 38}
    return {"A": A, "T": T, "H": Hh, "L": L, "E": E, "I": I, "C": C, "S": S}, widths


def profile(polys, H, steps=60):
    """Pour chaque hauteur : bord gauche et bord droit de la lettre."""
    out = []
    for i in range(steps):
        y = (i + 0.5) * H / steps
        xs = []
        for p in polys:
            for (x1, y1), (x2, y2) in zip(p, p[1:] + p[:1]):
                if (y1 <= y < y2) or (y2 <= y < y1):
                    xs.append(x1 + (y - y1) * (x2 - x1) / (y2 - y1))
        out.append((min(xs), max(xs)))
    return out


def athletics(top, H, s, gap):
    """Espacement optique : la surface vide entre deux lettres est la même
    pour chaque paire (le A et le T ne paraissent plus plus écartés que le T et le I)."""
    shapes, widths = glyphs(H, s)
    word = "ATHLETICS"
    cap = H * 0.1  # un creux ouvert (T, L, C) ne compte qu'en partie
    prof = {c: profile(shapes[c], H) for c in set(word)}
    xs = [0.0]
    for left, right in zip(word, word[1:]):
        # espace moyen si les deux lettres se touchaient par leur cadre
        open_space = [min(widths[left] - r, cap) + min(l, cap)
                      for (_, r), (l, _) in zip(prof[left], prof[right])]
        avg = sum(open_space) / len(open_space)
        xs.append(xs[-1] + widths[left] + gap - avg)
    total = xs[-1] + widths[word[-1]]
    x0 = CX - total / 2
    polys = []
    for c, x in zip(word, xs):
        polys += [[(px + x0 + x, py + top) for px, py in p] for p in shapes[c]]
    return polys


# ---------------------------------------------------------------- assemblage
GOLD_GRADIENT = """
    <linearGradient id="or" x1="0" y1="0" x2="1" y2="1" gradientUnits="objectBoundingBox">
      <stop offset="0" stop-color="#B8862F"/>
      <stop offset="0.45" stop-color="#F4DA8E"/>
      <stop offset="0.7" stop-color="#D4A84F"/>
      <stop offset="1" stop-color="#A6772A"/>
    </linearGradient>"""


def logo_group(gold):
    top, hat_base, bar_top, base, ath_top, ath_h = 232, 440, 464, 708, 752, 58
    hat_polys = hat(apex_y=top, base_y=hat_base, half_w=152, thick=STROKE)
    tf, r = trf(bar_top=bar_top, base=base)
    ath = athletics(top=ath_top, H=ath_h, s=13, gap=16)
    parts = [f'<path fill="{gold}" fill-rule="evenodd" d="{path(hat_polys)}"/>']
    for polys in (tf, r):
        parts.append(f'<path fill="{WHITE}" fill-rule="evenodd" d="{path(polys)}"/>')
    parts.append(f'<path fill="{gold}" fill-rule="evenodd" d="{path(ath)}"/>')
    # centre verticalement le dessin
    return "\n    ".join(parts), (SIZE - (top + ath_top + ath_h)) / 2


def svg(body, defs=""):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {SIZE} {SIZE}" '
            f'width="{SIZE}" height="{SIZE}">\n  <defs>{defs}\n  </defs>\n  {body}\n</svg>\n')


def placed(g, dy, scale):
    """Centre le logo et le met à l'échelle autour du centre du carré."""
    off = CX * (1 - scale)
    return f'<g transform="translate({off} {off + dy * scale}) scale({scale})">\n    {g}\n  </g>'


# Logo retenu : la variante 2 (barre blanche, chapeau et ATHLETICS dorés)
g, dy = logo_group("url(#or)")
RADIUS = f'rx="{SIZE * 0.2237:.0f}"'
fond = """
    <linearGradient id="fond" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#11204A"/>
      <stop offset="1" stop-color="#091229"/>
    </linearGradient>"""
FILES = {
    # nom : (coins, échelle du dessin)
    "trf-logo": (RADIUS, 1.1),             # logo principal, coins arrondis
    "trf-logo-carre": ("", 1.15),          # coins droits (réseaux sociaux, impression)
    "trf-icone-appli": (RADIUS, 0.95),     # plus de marge pour l'écran d'accueil
    "trf-icone-carree": ("", 0.95),        # icône pleine (iPhone et Android arrondissent eux-mêmes)
}
for name, (corners, scale) in FILES.items():
    body = (f'<rect width="{SIZE}" height="{SIZE}" {corners} fill="url(#fond)"/>\n'
            f'  {placed(g, dy, scale)}')
    (OUT / f"{name}.svg").write_text(svg(body, GOLD_GRADIENT + fond), encoding="utf-8")
print("SVG générés dans", OUT)
