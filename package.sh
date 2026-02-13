#!/bin/bash
set -euo pipefail

# 設定
TARGET_DIR="."
TMP_DIR="./package_tmp"
OUTPUT_DIR="./package"

# バージョン番号を manifest から取得
get_version() {
    local manifest_file=""
    if [ -f "$TARGET_DIR/manifest.json" ]; then
        manifest_file="$TARGET_DIR/manifest.json"
    elif [ -f "$TARGET_DIR/manifest_firefox.json" ]; then
        manifest_file="$TARGET_DIR/manifest_firefox.json"
    else
        echo "0.0.0"
        return
    fi

    # バージョン情報を抽出
    grep -oE '"version"\s*:\s*"[^"]+"' "$manifest_file" | sed -E 's/.*"([^"]+)"/\1/' | tr '.' '_' || echo "0_0_0"
}

VERSION="$(get_version)"
echo "version: $VERSION"

ZIP_FIREFOX="CSLT_Firefox_${VERSION}.zip"
ZIP_CHROME="CSLT_Chromium_${VERSION}.zip"

# 初期化
mkdir -p "$OUTPUT_DIR"
rm -rf "$TMP_DIR"
mkdir -p "$TMP_DIR"

# 除外ルール
RSYNC_EXCLUDES=(
  --exclude=".git"
  --exclude=".gitignore"
  --exclude="README.md"
  --exclude=".DS_Store"
  --exclude="package_tmp"
  --exclude="package"
  --exclude="*.sh"
  --exclude="*.ps1"
)

# Firefox 用 ZIP
rsync -av "${RSYNC_EXCLUDES[@]}" "$TARGET_DIR/" "$TMP_DIR/"
if [ -f "$TMP_DIR/manifest_firefox.json" ]; then
    mv "$TMP_DIR/manifest_firefox.json" "$TMP_DIR/manifest.json"
fi
(cd "$TMP_DIR" && zip -r "../$OUTPUT_DIR/$ZIP_FIREFOX" .)
rm -rf "$TMP_DIR"

# Chrome 用 ZIP
mkdir -p "$TMP_DIR"
rsync -av "${RSYNC_EXCLUDES[@]}" --exclude="manifest_firefox.json" "$TARGET_DIR/" "$TMP_DIR/"
(cd "$TMP_DIR" && zip -r "../$OUTPUT_DIR/$ZIP_CHROME" .)
rm -rf "$TMP_DIR"

echo "ZIP圧縮が完了しました:"
echo " - Firefox版: $OUTPUT_DIR/$ZIP_FIREFOX"
echo " - Chrome版:  $OUTPUT_DIR/$ZIP_CHROME"