#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   PORT=3000 NODE_ENV=production bash scripts/run-standalone.sh
#   or just: bash scripts/run-standalone.sh
#
# It requires the following directories at the same level:
#   .next/standalone/
#   .next/static/
#   public/

ROOT_DIR=$(cd "$(dirname "$0")/.." && pwd)
cd "$ROOT_DIR"

: ${PORT:=3000}
: ${NODE_ENV:=production}

# Ensure required directories exist
[ -d .next/standalone ] || { echo "[error] .next/standalone not found"; exit 1; }
[ -d .next/static ] || { echo "[error] .next/static not found"; exit 1; }
[ -d public ] || { echo "[error] public not found"; exit 1; }

export PORT NODE_ENV
exec node .next/standalone/server.js
