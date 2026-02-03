#!/bin/bash
set -euo pipefail

echo "=== Error Envelope Verification ==="

if [ ! -d "server/routes" ]; then
  echo "[SKIP] Server routes not generated yet"
  exit 0
fi

ISSUES=0

WRONG_FORMAT=$(grep -rn "success:.*true.*data:\|success:.*false" server/routes/ 2>/dev/null | wc -l || true)

if [ "$WRONG_FORMAT" -gt 0 ]; then
  echo "[X] Found $WRONG_FORMAT responses using { success, data } format"
  ISSUES=$((ISSUES + 1))
fi

if [ "$ISSUES" -eq 0 ]; then
  echo "[OK] Error envelope verification passed"
  exit 0
else
  echo "[X] Found $ISSUES error envelope issues"
  exit 1
fi
