#!/bin/bash
set -euo pipefail

echo "=== Express Dev Port Verification ==="

ISSUES=0

if [ ! -f "package.json" ]; then
  echo "[SKIP] package.json not found yet"
  exit 0
fi

if ! grep '"dev"' package.json | grep -q "PORT=3001"; then
  echo "[X] Dev script missing PORT=3001"
  ISSUES=$((ISSUES + 1))
fi

if [ -f "server/index.ts" ]; then
  if ! grep -q "process.env.PORT" server/index.ts; then
    echo "[X] Server doesn't use process.env.PORT"
    ISSUES=$((ISSUES + 1))
  fi
fi

if [ "$ISSUES" -eq 0 ]; then
  echo "[OK] Express dev port configured correctly"
  exit 0
else
  echo "[X] Found $ISSUES port configuration issues"
  exit 1
fi
