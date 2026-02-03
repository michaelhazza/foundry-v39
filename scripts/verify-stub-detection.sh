#!/bin/bash
set -euo pipefail

echo "=== Stub Detection Verification ==="

ISSUES=0

if [ ! -d "server/services" ]; then
  echo "[SKIP] Server services not generated yet"
  exit 0
fi

STUBS=$(grep -rn "TODO\|FIXME\|throw new Error.*not implemented\|NOT_IMPLEMENTED" server/services/ 2>/dev/null | wc -l || true)

if [ "$STUBS" -gt 0 ]; then
  echo "[X] Found $STUBS stub/TODO patterns in services"
  grep -rn "TODO\|FIXME\|throw new Error.*not implemented" server/services/ 2>/dev/null | head -10
  ISSUES=$((ISSUES + 1))
fi

if [ "$ISSUES" -eq 0 ]; then
  echo "[OK] No stubs detected"
  exit 0
else
  echo "[X] Stub detection failed"
  exit 1
fi
