#!/bin/bash
set -euo pipefail

echo "=== Frontend-Backend Contract Validation ==="

if [ ! -f "docs/service-contracts.json" ]; then
  echo "[SKIP] No service contract found"
  exit 0
fi

if [ ! -d "client/src" ]; then
  echo "[SKIP] Client code not generated yet"
  exit 0
fi

API_CALLS=$(find client/src -name "*.tsx" -o -name "*.ts" 2>/dev/null | \
  xargs grep -Eoh "api\.(get|post|patch|delete|put)\(['\"\`][^'\"\`?]*" 2>/dev/null | \
  sed -E "s/.*['\"\`]//g" | \
  sed 's|?.*||' | \
  sort -u || true)

if [ -z "$API_CALLS" ]; then
  echo "[SKIP] No frontend API calls found yet"
  exit 0
fi

BACKEND=$(python3 -c "
import json
with open('docs/service-contracts.json') as f:
    data = json.load(f)
endpoints = data.get('serviceContracts', data).get('endpoints', [])
for e in endpoints:
    path = e['path'].replace('/api', '', 1)
    print(path)
" 2>/dev/null | sort -u || true)

ISSUES=0

while IFS= read -r path; do
  [ -z "$path" ] && continue
  normalized=$(echo "$path" | sed 's|^/api||' | sed 's|?.*||')
  if ! echo "$BACKEND" | grep -qF "$normalized"; then
    echo "[X] Frontend calls '$path' but no backend endpoint matches"
    ISSUES=$((ISSUES + 1))
  fi
done <<< "$API_CALLS"

if [ "$ISSUES" -eq 0 ]; then
  echo "[OK] All frontend calls match backend"
  exit 0
else
  echo "[X] Found $ISSUES mismatches"
  exit 1
fi
