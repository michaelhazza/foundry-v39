#!/bin/bash
set -euo pipefail

echo "=== Config File Verification ==="

ISSUES=0

for file in "package.json" "tsconfig.json" ".env.example"; do
  if [ ! -f "$file" ]; then
    echo "[X] Missing config file: $file"
    ISSUES=$((ISSUES + 1))
  fi
done

if [ -f ".replit" ]; then
  if ! grep -q "\[deployment\]" ".replit"; then
    echo "[X] .replit missing [deployment] section"
    ISSUES=$((ISSUES + 1))
  fi
fi

if [ -f "tsconfig.json" ]; then
  if ! grep -q '"strict": true\|"strict":true' "tsconfig.json"; then
    echo "[X] tsconfig.json missing strict mode"
    ISSUES=$((ISSUES + 1))
  fi
fi

if [ -f "package.json" ]; then
  for script in "dev" "build" "start" "verify"; do
    if ! grep -q "\"$script\":" "package.json"; then
      echo "[X] package.json missing $script script"
      ISSUES=$((ISSUES + 1))
    fi
  done
fi

if [ "$ISSUES" -eq 0 ]; then
  echo "[OK] All config files present and complete"
  exit 0
else
  echo "[X] Found $ISSUES config issues"
  exit 1
fi
