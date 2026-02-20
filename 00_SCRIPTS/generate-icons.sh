#!/bin/bash
set -e

SRC="icon.png"
OUT="build/icons"

mkdir -p "$OUT"

echo "→ Generant PNGs per Linux/Electron..."
for size in 16 24 32 48 64 128 256 512 1024; do
  convert "$SRC" -resize "${size}x${size}" "$OUT/${size}x${size}.png"
done

# Còpia principal que usa Electron (Linux)
cp "$OUT/512x512.png" "$OUT/icon.png"

echo "→ Generant icon.ico per Windows..."
convert "$SRC" \
  \( -clone 0 -resize 16x16   \) \
  \( -clone 0 -resize 24x24   \) \
  \( -clone 0 -resize 32x32   \) \
  \( -clone 0 -resize 48x48   \) \
  \( -clone 0 -resize 64x64   \) \
  \( -clone 0 -resize 128x128 \) \
  \( -clone 0 -resize 256x256 \) \
  -delete 0 "$OUT/icon.ico"

echo "→ Generant icon.icns per macOS..."
png2icns "$OUT/icon.icns" \
  "$OUT/16x16.png" \
  "$OUT/32x32.png" \
  "$OUT/128x128.png" \
  "$OUT/256x256.png" \
  "$OUT/512x512.png"

echo "✓ Icones generats a $OUT/"
ls -lh "$OUT/"