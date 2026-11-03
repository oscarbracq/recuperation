"""Icône TRF Athletics : « TRF » et « ATHLETICS » en blanc sur bleu marine, rien d'autre.

Deux couleurs seulement. Lancer :  python generer_icone.py
Les PNG de l'appli sont ensuite rendus par build-icons.sh (Edge sans fenêtre).
"""
from pathlib import Path

OUT = Path(__file__).parent
SIZE = 1024
NAVY = "#0B1733"
WHITE = "#FFFFFF"
FONT = "'Segoe UI Variable Display','Segoe UI',system-ui,sans-serif"


def icon(scale, rounded):
    """scale = taille du texte (1 = pleine icône). rounded = coins arrondis comme une icône iPhone."""
    rx = f' rx="{SIZE * 0.2237:.0f}"' if rounded else ""
    trf, ath = 330 * scale, 74 * scale
    # Le bloc de texte (TRF + ATHLETICS) est centré verticalement.
    gap = 40 * scale
    block = trf * 0.72 + gap + ath * 0.72
    y_trf = SIZE / 2 - block / 2 + trf * 0.72
    y_ath = y_trf + gap + ath * 0.72
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {SIZE} {SIZE}" width="{SIZE}" height="{SIZE}">
  <rect width="{SIZE}" height="{SIZE}"{rx} fill="{NAVY}"/>
  <g fill="{WHITE}" font-family="{FONT}" text-anchor="middle">
    <text x="{SIZE / 2}" y="{y_trf:.1f}" font-size="{trf:.1f}" font-weight="800" letter-spacing="{-trf * 0.01:.1f}">TRF</text>
    <text x="{SIZE / 2 + ath * 0.16:.1f}" y="{y_ath:.1f}" font-size="{ath:.1f}" font-weight="600" letter-spacing="{ath * 0.32:.1f}">ATHLETICS</text>
  </g>
</svg>
"""


FILES = {
    "trf-logo": (1.0, True),          # logo principal, coins arrondis
    "trf-logo-carre": (1.0, False),   # coins droits (réseaux sociaux, impression)
    "trf-icone-appli": (0.86, True),  # icône d'appli : un peu plus de marge
    "trf-icone-carree": (0.86, False) # icône pleine (iPhone et Android arrondissent eux-mêmes)
}
for name, (scale, rounded) in FILES.items():
    (OUT / f"{name}.svg").write_text(icon(scale, rounded), encoding="utf-8")
print("SVG générés dans", OUT)
