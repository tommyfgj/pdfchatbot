#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   bash scripts/package-standalone.sh [OUTPUT_DIR]
# Example:
#   bash scripts/package-standalone.sh dist
# Result:
#   Creates dist/pdfchatbot-standalone-YYYYmmdd_HHMMSS.tar.gz with:
#     .next/standalone/
#     .next/static/
#     public/
#     scripts/run-standalone.sh

ROOT_DIR=$(cd "$(dirname "$0")/.." && pwd)
OUTPUT_DIR=${1:-"$ROOT_DIR/dist"}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
PACKAGE_NAME="pdfchatbot-standalone-$TIMESTAMP.tar.gz"

cd "$ROOT_DIR"

# 1) Build project (submodule + Next standalone)
echo "[package] Building project (standalone)..."
npm run build

# 2) Verify required directories
[ -d .next/standalone ] || { echo "[error] .next/standalone not found"; exit 1; }
[ -d .next/static ] || { echo "[error] .next/static not found"; exit 1; }
[ -d public ] || { echo "[error] public not found"; exit 1; }

# 3) Prepare output directory
mkdir -p "$OUTPUT_DIR"

# 4) Create tarball including run script
TMP_STAGE="$(mktemp -d)"
mkdir -p "$TMP_STAGE/.next/standalone/.next" "$TMP_STAGE/.next/standalone/public" "$TMP_STAGE/scripts"
# copy standalone server (avoid nested dir)
cp -a .next/standalone/. "$TMP_STAGE/.next/standalone"
# place static inside standalone/.next/static
cp -a .next/static "$TMP_STAGE/.next/standalone/.next/static"
# place public inside standalone/public
cp -a public/. "$TMP_STAGE/.next/standalone/public/"
# include run script and deploy setup script at root scripts/
cp -a scripts/run-standalone.sh "$TMP_STAGE/scripts/run-standalone.sh"
cp -a scripts/deploy-setup.sh "$TMP_STAGE/scripts/deploy-setup.sh"
chmod +x "$TMP_STAGE/scripts/run-standalone.sh"
chmod +x "$TMP_STAGE/scripts/deploy-setup.sh"

# 5) Package
cd "$TMP_STAGE"
# Only need .next/standalone and scripts in the tarball
tar -czf "$OUTPUT_DIR/$PACKAGE_NAME" .next/standalone scripts
cd - >/dev/null

# 6) Print result
PACKAGE_PATH="$OUTPUT_DIR/$PACKAGE_NAME"
echo "[package] Created: $PACKAGE_PATH"
echo "[package] To deploy:"
echo "  1) copy the tar.gz to server and extract, e.g.:"
echo "     tar -xzf $PACKAGE_NAME -C /opt/pdfchatbot"
echo "  2) setup native modules (required for better-sqlite3):"
echo "     cd /opt/pdfchatbot && bash scripts/deploy-setup.sh"
echo "  3) run:"
echo "     cd /opt/pdfchatbot && PORT=3000 NODE_ENV=production bash scripts/run-standalone.sh"
