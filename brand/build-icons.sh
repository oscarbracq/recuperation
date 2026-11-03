#!/bin/sh
# Renders the app icons (PNG) from the brand SVGs with Edge in headless mode. Run from Git Bash: sh brand/build-icons.sh
cd "$(dirname "$0")" || exit 1
python generer_icone.py >/dev/null || exit 1
EDGE="/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
mkdir -p tmp
render() { # svg size output
  sed "1s/width=\"1024\" height=\"1024\"/width=\"$2\" height=\"$2\"/" "$1" > tmp/x.svg
  "$EDGE" --headless=new --disable-gpu --hide-scrollbars --default-background-color=00000000 --window-size="$2,$2" \
    --screenshot="$(cygpath -m "$PWD/$3")" "file:///$(cygpath -m "$PWD/tmp/x.svg")" >/dev/null 2>&1
}
render trf-icone-appli.svg 192 ../icon-192.png
render trf-icone-appli.svg 512 ../icon-512.png
render trf-icone-carree.svg 512 ../icon-maskable-512.png
render trf-icone-carree.svg 180 ../apple-touch-icon.png
render trf-logo.svg 1024 trf-logo.png
render trf-logo-carre.svg 1024 trf-logo-carre.png
rm -rf tmp
echo "icônes à jour"
