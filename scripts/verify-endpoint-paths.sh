#!/bin/bash
set -euo pipefail

echo "=== Endpoint Path Verification ==="

if [ ! -d "server/routes" ]; then
  echo "[SKIP] Server routes not generated yet"
  exit 0
fi

ISSUES=0

echo "Checking parameter naming conventions..."
for route_file in server/routes/*.routes.ts; do
  [ -f "$route_file" ] || continue
  if grep -E "router\..*'[^']*:[A-Z]" "$route_file" 2>/dev/null | grep -q '.'; then
    echo "[X] $(basename $route_file) has uppercase parameter (should be lowercase)"
    ISSUES=$((ISSUES + 1))
  fi
done

if [ "$ISSUES" -eq 0 ]; then
  echo "[OK] Endpoint path verification passed"
  exit 0
else
  echo "[X] Found $ISSUES path violations"
  exit 1
fi
