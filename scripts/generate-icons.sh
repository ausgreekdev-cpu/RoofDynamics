#!/usr/bin/env bash
# Generate all app icons and store graphics from the source SVGs.
# Requires: rsvg-convert (librsvg) — `apt install librsvg2-bin` or `brew install librsvg`.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/frontend/public/icon-source.svg"
FG="$ROOT/store/feature-graphic-source.svg"

echo "Generating PWA icons..."
rsvg-convert -w 192 -h 192 "$SRC" -o "$ROOT/frontend/public/pwa-192x192.png"
rsvg-convert -w 512 -h 512 "$SRC" -o "$ROOT/frontend/public/pwa-512x512.png"

echo "Generating Play Store icon..."
mkdir -p "$ROOT/store"
rsvg-convert -w 512 -h 512 "$SRC" -o "$ROOT/store/icon-512.png"

echo "Generating feature graphic..."
rsvg-convert -w 1024 -h 500 "$FG" -o "$ROOT/store/feature-graphic-1024x500.png"

# Android mipmap densities
DENSITIES="mdpi:48 hdpi:72 xhdpi:96 xxhdpi:144 xxxhdpi:192"
for entry in $DENSITIES; do
  name="${entry%%:*}"
  size="${entry##*:}"
  dir="$ROOT/frontend/android/app/src/main/res/mipmap-$name"
  mkdir -p "$dir"
  rsvg-convert -w "$size" -h "$size" "$SRC" -o "$dir/ic_launcher.png"
  rsvg-convert -w "$size" -h "$size" "$SRC" -o "$dir/ic_launcher_round.png"
done

echo "Done. Generated:"
echo "  frontend/public/pwa-192x192.png, pwa-512x512.png"
echo "  store/icon-512.png, store/feature-graphic-1024x500.png"
echo "  frontend/android/app/src/main/res/mipmap-*/ic_launcher*.png"
