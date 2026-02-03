#!/bin/bash
set -euo pipefail

echo "=== Directory Structure Verification ==="

ISSUES=0

REQUIRED_DIRS=(
  "server"
  "server/routes"
  "server/services"
  "server/middleware"
  "server/lib"
  "server/db"
  "server/errors"
  "server/utils"
  "client/src"
  "client/src/pages"
  "client/src/components"
  "client/src/hooks"
  "client/src/lib"
  "client/src/types"
  "scripts"
)

for dir in "${REQUIRED_DIRS[@]}"; do
  if [ ! -d "$dir" ]; then
    echo "[X] Missing directory: $dir"
    ISSUES=$((ISSUES + 1))
  fi
done

if [ "$ISSUES" -eq 0 ]; then
  echo "[OK] Directory structure verification passed"
  exit 0
else
  echo "[X] Found $ISSUES missing directories"
  exit 1
fi
