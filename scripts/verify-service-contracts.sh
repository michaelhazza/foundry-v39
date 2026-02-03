#!/bin/bash
set -euo pipefail

echo "=== Service Contracts Validation ==="

ISSUES=0

if [ ! -f "docs/service-contracts.json" ]; then
  echo "[SKIP] service-contracts.json not found yet"
  exit 0
fi

if command -v python3 >/dev/null 2>&1; then
  if ! python3 -m json.tool docs/service-contracts.json > /dev/null 2>&1; then
    echo "[X] service-contracts.json is not valid JSON"
    ISSUES=$((ISSUES + 1))
  else
    echo "[OK] service-contracts.json is valid JSON"
  fi
elif command -v jq >/dev/null 2>&1; then
  if ! jq empty docs/service-contracts.json 2>/dev/null; then
    echo "[X] service-contracts.json is not valid JSON"
    ISSUES=$((ISSUES + 1))
  else
    echo "[OK] service-contracts.json is valid JSON"
  fi
else
  echo "[SKIP] No JSON validator available"
fi

if [ "$ISSUES" -eq 0 ]; then
  echo "[OK] Service contracts verification passed"
  exit 0
else
  echo "[X] Found $ISSUES issues"
  exit 1
fi
