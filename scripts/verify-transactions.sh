#!/bin/bash
set -euo pipefail

echo "=== Transaction Usage Verification ==="

ISSUES=0

if [ ! -d "server/services" ]; then
  echo "[SKIP] Server services not generated yet"
  exit 0
fi

for service_file in server/services/*.service.ts; do
  [ -f "$service_file" ] || continue

  if grep -q 'async.*register\|async.*signup\|async.*createUser' "$service_file" 2>/dev/null; then
    FUNC_CONTENT=$(grep -A 30 'async.*register\|async.*signup\|async.*createUser' "$service_file" | head -n 30)
    INSERT_COUNT=$(echo "$FUNC_CONTENT" | grep -c '\.insert(\|\.create(' || true)
    if [ "$INSERT_COUNT" -gt 1 ]; then
      if ! echo "$FUNC_CONTENT" | grep -q 'db\.transaction\|\.transaction\|trx'; then
        echo "[X] $(basename $service_file) registration has $INSERT_COUNT inserts without transaction"
        ISSUES=$((ISSUES + 1))
      else
        echo "[OK] $(basename $service_file) registration uses transaction"
      fi
    fi
  fi
done

for service_file in server/services/*.service.ts; do
  [ -f "$service_file" ] || continue
  if grep -q 'async.*delete' "$service_file" 2>/dev/null; then
    FUNC_CONTENT=$(grep -A 30 'async.*delete' "$service_file" | head -n 30)
    DELETE_COUNT=$(echo "$FUNC_CONTENT" | grep -c '\.delete(\|\.update.*deletedAt' || true)
    if [ "$DELETE_COUNT" -gt 1 ]; then
      if ! echo "$FUNC_CONTENT" | grep -q 'db\.transaction\|\.transaction\|trx'; then
        echo "[X] $(basename $service_file) cascade delete without transaction"
        ISSUES=$((ISSUES + 1))
      fi
    fi
  fi
done

if [ "$ISSUES" -eq 0 ]; then
  echo "[OK] Transaction verification passed"
  exit 0
else
  echo "[X] Found $ISSUES transaction issues"
  exit 1
fi
