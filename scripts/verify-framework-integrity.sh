#!/bin/bash
set -euo pipefail

echo "=== Framework Integrity Verification ==="

ISSUES=0

if command -v file >/dev/null 2>&1; then
  NON_ASCII=$(file docs/*.md 2>/dev/null | grep -v ASCII | grep -v "cannot open" | grep -v "UTF-8 Unicode" | wc -l || true)
  if [ "$NON_ASCII" -eq 0 ]; then
    echo "[OK] All spec files readable"
  fi
fi

if [ ! -d "scripts" ]; then
  echo "[X] scripts/ directory missing"
  ISSUES=$((ISSUES + 1))
fi

SCRIPT_COUNT=$(ls scripts/verify-*.sh 2>/dev/null | wc -l)
echo "Verification scripts found: $SCRIPT_COUNT"

if [ "$ISSUES" -eq 0 ]; then
  echo "[OK] Framework integrity: PASSED"
  exit 0
else
  echo "[X] Framework integrity: FAILED"
  exit 1
fi
