#!/bin/bash
set -euo pipefail

echo "=== Vite Config Verification ==="

ISSUES=0

if [ ! -f "vite.config.ts" ]; then
  echo "[SKIP] vite.config.ts not found yet"
  exit 0
fi

if ! grep -q "port: 5000" vite.config.ts; then
  echo "[X] Vite missing port: 5000"
  ISSUES=$((ISSUES + 1))
fi

if ! grep -q "strictPort: true" vite.config.ts; then
  echo "[X] Vite missing strictPort: true"
  ISSUES=$((ISSUES + 1))
fi

if ! grep -q "target.*3001\|target.*127.0.0.1:3001" vite.config.ts; then
  echo "[X] Vite missing proxy target to 3001"
  ISSUES=$((ISSUES + 1))
fi

if ! grep -q "usePolling" vite.config.ts; then
  echo "[X] Vite missing usePolling"
  ISSUES=$((ISSUES + 1))
fi

if [ "$ISSUES" -eq 0 ]; then
  echo "[OK] Vite config verification passed"
  exit 0
else
  echo "[X] Found $ISSUES vite config issues"
  exit 1
fi
