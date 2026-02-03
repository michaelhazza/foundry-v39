#!/bin/bash
set -euo pipefail

echo "=== Middleware Order Verification ==="

if [ ! -f "server/index.ts" ]; then
  echo "[SKIP] server/index.ts not found yet"
  exit 0
fi

ISSUES=0

# Check helmet is before routes
if grep -q "helmet()" server/index.ts; then
  HELMET_LINE=$(grep -n "helmet()" server/index.ts | head -1 | cut -d: -f1)
  ROUTES_LINE=$(grep -n "app\.use.*routes\|app\.use.*router\|app\.use.*'/api'" server/index.ts | head -1 | cut -d: -f1)

  if [ -n "$ROUTES_LINE" ] && [ -n "$HELMET_LINE" ]; then
    if [ "$HELMET_LINE" -gt "$ROUTES_LINE" ]; then
      echo "[X] helmet() must come before routes"
      ISSUES=$((ISSUES + 1))
    fi
  fi
fi

# Check errorHandler is last
if grep -q "errorHandler" server/index.ts; then
  ERROR_LINE=$(grep -n "errorHandler" server/index.ts | tail -1 | cut -d: -f1)
  LAST_USE_LINE=$(grep -n "app\.use" server/index.ts | tail -1 | cut -d: -f1)

  if [ "$ERROR_LINE" != "$LAST_USE_LINE" ]; then
    echo "[WARN] errorHandler may not be last middleware"
  fi
fi

if [ "$ISSUES" -eq 0 ]; then
  echo "[OK] Middleware order verification passed"
  exit 0
else
  echo "[X] Found $ISSUES middleware order issues"
  exit 1
fi
