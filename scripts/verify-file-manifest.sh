#!/bin/bash
set -euo pipefail

echo "=== File Manifest Verification ==="

ISSUES=0

REQUIRED_FILES=(
  ".env.example"
  "tsconfig.json"
  "package.json"
)

for file in "${REQUIRED_FILES[@]}"; do
  if [ ! -f "$file" ]; then
    echo "[X] Missing required file: $file"
    ISSUES=$((ISSUES + 1))
  fi
done

if [ -f "vite.config.ts" ]; then
  echo "[OK] vite.config.ts exists"
fi

if [ "$ISSUES" -eq 0 ]; then
  echo "[OK] File manifest verification passed"
  exit 0
else
  echo "[X] Found $ISSUES missing files"
  exit 1
fi
