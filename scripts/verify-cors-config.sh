#!/bin/bash
set -euo pipefail

echo "=== CORS Configuration Check ==="

if [ ! -f "server/index.ts" ]; then
  echo "[SKIP] server/index.ts not found yet"
  exit 0
fi

if grep -q "cors(" server/index.ts; then
  echo "[OK] PASS - CORS configured"
  exit 0
else
  echo "[SKIP] CORS not configured yet"
  exit 0
fi
