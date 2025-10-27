#!/usr/bin/env bash
set -euo pipefail

# 部署服务器上的设置脚本
# 用于在目标服务器上重新编译原生模块
#
# Usage:
#   bash scripts/deploy-setup.sh

ROOT_DIR=$(cd "$(dirname "$0")/.." && pwd)
cd "$ROOT_DIR"

echo "[deploy-setup] Checking for .next/standalone..."
if [ ! -d .next/standalone ]; then
  echo "[error] .next/standalone not found. Please extract the deployment package first."
  exit 1
fi

echo "[deploy-setup] Reinstalling better-sqlite3 for current platform..."
cd .next/standalone

# 检查是否有 package.json
if [ ! -f package.json ]; then
  echo "[error] package.json not found in .next/standalone"
  exit 1
fi

# 重新安装 better-sqlite3（会针对当前平台编译）
npm install better-sqlite3@12.4.1 --build-from-source

echo "[deploy-setup] Setup complete!"
echo "[deploy-setup] You can now run: PORT=3000 NODE_ENV=production bash scripts/run-standalone.sh"
