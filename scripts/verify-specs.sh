#!/bin/bash
set -euo pipefail

echo "=== Spec File Verification ==="

ISSUES=0

for file in "docs/01-PRD.md" "docs/02-ARCHITECTURE.md" "docs/03-DATA-MODEL.md" "docs/04-API-CONTRACT.md" "docs/05-UI-SPECIFICATION.md"; do
  if [ ! -f "$file" ]; then
    echo "[X] Missing spec file: $file"
    ISSUES=$((ISSUES + 1))
  fi
done

if [ "$ISSUES" -eq 0 ]; then
  echo "[OK] All spec files present"
  exit 0
else
  echo "[X] Found $ISSUES missing spec files"
  exit 1
fi
