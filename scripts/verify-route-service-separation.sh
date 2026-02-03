#!/bin/bash
set -euo pipefail

echo "=== Route-Service Separation Verification ==="

if [ ! -d "server/routes" ]; then
  echo "[SKIP] Server routes not generated yet"
  exit 0
fi

ISSUES=0

DB_OPS=$(grep -rn 'db\.\(insert\|update\|delete\|select\|query\)' server/routes/ 2>/dev/null | grep -v 'import\|//' | wc -l || true)

if [ "$DB_OPS" -gt 0 ]; then
  echo "[X] Found $DB_OPS direct DB operations in route files"
  ISSUES=$((ISSUES + 1))
fi

if [ "$ISSUES" -eq 0 ]; then
  echo "[OK] Route-service separation verified"
  exit 0
else
  echo "[X] Routes must delegate to services"
  exit 1
fi
