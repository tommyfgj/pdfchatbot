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

# Determine layout: either root-level static/public, or embedded inside .next/standalone
if [ -d .next/static ] && [ -d public ] && [ -f .next/standalone/server.js ]; then
  export PORT NODE_ENV
  exec node .next/standalone/server.js
elif [ -d .next/standalone/.next/static ] && [ -d .next/standalone/public ] && [ -f .next/standalone/server.js ]; then
  export PORT NODE_ENV
  cd .next/standalone
  exec node server.js
else
  echo "[error] required assets not found. Expected either:" >&2
  echo "  1) .next/static and public at repo root; or" >&2
  echo "  2) .next/standalone/.next/static and .next/standalone/public" >&2
  exit 1
fi
