#!/bin/bash
set -euo pipefail

echo "=== No DB Operations in Routes Verification ==="

if [ ! -d "server/routes" ]; then
  echo "[SKIP] Server routes not generated yet"
  exit 0
fi

ISSUES=0

DB_IN_ROUTES=$(grep -rn 'db\.\(insert\|update\|delete\|select\|query\)' server/routes/ 2>/dev/null | wc -l || true)

if [ "$DB_IN_ROUTES" -gt 0 ]; then
  echo "[X] Found $DB_IN_ROUTES direct DB operations in routes"
  grep -rn 'db\.\(insert\|update\|delete\|select\|query\)' server/routes/ 2>/dev/null | head -5
  ISSUES=$((ISSUES + 1))
fi

if [ "$ISSUES" -eq 0 ]; then
  echo "[OK] No DB operations in routes"
  exit 0
else
  echo "[X] Routes should delegate to services"
  exit 1
fi
