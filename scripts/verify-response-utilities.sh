#!/bin/bash
set -euo pipefail

echo "=== Response Utilities Verification ==="

if [ ! -d "server/routes" ]; then
  echo "[SKIP] Server routes not generated yet"
  exit 0
fi

ISSUES=0

if [ -f "server/utils/response.ts" ]; then
  if ! grep -q "sendSuccess" server/utils/response.ts; then
    echo "[X] Missing sendSuccess in response utilities"
    ISSUES=$((ISSUES + 1))
  fi
  if ! grep -q "sendCreated" server/utils/response.ts; then
    echo "[X] Missing sendCreated in response utilities"
    ISSUES=$((ISSUES + 1))
  fi
  if ! grep -q "sendPaginated" server/utils/response.ts; then
    echo "[X] Missing sendPaginated in response utilities"
    ISSUES=$((ISSUES + 1))
  fi
  if ! grep -q "sendNoContent" server/utils/response.ts; then
    echo "[X] Missing sendNoContent in response utilities"
    ISSUES=$((ISSUES + 1))
  fi
fi

# Check that routes use response helpers instead of res.json
DIRECT_JSON=$(grep -rn "res\.json(" server/routes/ 2>/dev/null | grep -v "sendSuccess\|sendCreated\|sendPaginated\|sendNoContent\|errorHandler" | wc -l || true)

if [ "$DIRECT_JSON" -gt 0 ]; then
  echo "[WARN] Found $DIRECT_JSON direct res.json() calls in routes"
  echo "  Should use sendSuccess/sendCreated/sendPaginated helpers"
fi

if [ "$ISSUES" -eq 0 ]; then
  echo "[OK] Response utilities verification passed"
  exit 0
else
  echo "[X] Found $ISSUES response utility issues"
  exit 1
fi
