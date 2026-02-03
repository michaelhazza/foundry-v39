#!/bin/bash
set -euo pipefail

echo "=== Package Scripts Verification ==="

ISSUES=0

if [ ! -f "package.json" ]; then
  echo "[SKIP] package.json not found yet"
  exit 0
fi

for script in "dev" "build" "start" "verify"; do
  if ! grep -q "\"$script\":" package.json; then
    echo "[X] package.json missing $script script"
    ISSUES=$((ISSUES + 1))
  fi
done

if ! grep -q "concurrently" package.json; then
  echo "[X] package.json missing concurrently for dev script"
  ISSUES=$((ISSUES + 1))
fi

if ! grep -q "prebuild" package.json; then
  echo "[X] package.json missing prebuild hook"
  ISSUES=$((ISSUES + 1))
fi

if [ "$ISSUES" -eq 0 ]; then
  echo "[OK] Package scripts verification passed"
  exit 0
else
  echo "[X] Found $ISSUES package script issues"
  exit 1
fi
