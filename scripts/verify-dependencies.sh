#!/bin/bash
set -euo pipefail

echo "=== Dependency Verification ==="

if [ ! -f "package.json" ]; then
  echo "[SKIP] package.json not found yet"
  exit 0
fi

ISSUES=0

REQUIRED_DEPS=("express" "drizzle-orm" "jsonwebtoken" "bcrypt" "zod" "cors" "helmet")

for dep in "${REQUIRED_DEPS[@]}"; do
  if ! grep -q "\"$dep\"" package.json; then
    echo "[X] Missing dependency: $dep"
    ISSUES=$((ISSUES + 1))
  fi
done

if [ "$ISSUES" -eq 0 ]; then
  echo "[OK] All required dependencies present"
  exit 0
else
  echo "[X] Found $ISSUES missing dependencies"
  exit 1
fi
