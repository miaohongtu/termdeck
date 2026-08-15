#!/usr/bin/env bash
set -euo pipefail

repo_dir="$(cd "$(dirname "$0")/.." && pwd)"
iconset="$repo_dir/build/icon.iconset"
source_png="$repo_dir/build/icon-1024.png"

mkdir -p "$iconset"
sips -s format png "$repo_dir/build/icon.svg" --out "$source_png" >/dev/null

for size in 16 32 128 256 512; do
  sips -z "$size" "$size" "$source_png" --out "$iconset/icon_${size}x${size}.png" >/dev/null
  double=$((size * 2))
  sips -z "$double" "$double" "$source_png" --out "$iconset/icon_${size}x${size}@2x.png" >/dev/null
done

iconutil -c icns "$iconset" -o "$repo_dir/build/icon.icns"
rm -rf "$iconset" "$source_png"
