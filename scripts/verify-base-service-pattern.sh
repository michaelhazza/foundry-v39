#!/bin/bash
set -euo pipefail

echo "=== Base Service Pattern Verification ==="

if [ ! -d "server/services" ]; then
  echo "[SKIP] Server services not generated yet"
  exit 0
fi

ISSUES=0

if [ -f "server/services/base.service.ts" ]; then
  if ! grep -q "findAll\|pagination\|pageSize" server/services/base.service.ts; then
    echo "[X] BaseService missing pagination support"
    ISSUES=$((ISSUES + 1))
  fi
  echo "[OK] base.service.ts exists"
else
  echo "[SKIP] base.service.ts not created yet"
fi

if [ "$ISSUES" -eq 0 ]; then
  echo "[OK] Base service pattern verification passed"
  exit 0
else
  echo "[X] Found $ISSUES base service issues"
  exit 1
fi
