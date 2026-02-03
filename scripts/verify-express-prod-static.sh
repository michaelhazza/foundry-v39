#!/bin/bash
set -euo pipefail

echo "=== Express Prod Static Serving Verification ==="

ISSUES=0

if [ ! -f "package.json" ]; then
  echo "[SKIP] package.json not found yet"
  exit 0
fi

if ! grep '"start"' package.json | grep -q "PORT=5000"; then
  echo "[X] Start script missing PORT=5000"
  ISSUES=$((ISSUES + 1))
fi

if [ -f "server/index.ts" ]; then
  if ! grep -q "express.static\|serveStatic" server/index.ts; then
    echo "[X] Server doesn't serve static files"
    ISSUES=$((ISSUES + 1))
  fi

  if ! grep -q "0.0.0.0" server/index.ts; then
    echo "[X] Server missing 0.0.0.0 binding for prod"
    ISSUES=$((ISSUES + 1))
  fi
fi

if [ "$ISSUES" -eq 0 ]; then
  echo "[OK] Express prod static serving configured correctly"
  exit 0
else
  echo "[X] Found $ISSUES static serving issues"
  exit 1
fi
