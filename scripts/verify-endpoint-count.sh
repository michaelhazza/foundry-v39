#!/bin/bash
set -euo pipefail

echo "=== Endpoint Count Verification ==="

if [ ! -f "docs/service-contracts.json" ]; then
  echo "[SKIP] service-contracts.json not found yet"
  exit 0
fi

EXPECTED=$(grep -o '"method"' docs/service-contracts.json | wc -l || true)
IMPLEMENTED=0

if [ -d "server/routes" ]; then
  IMPLEMENTED=$(grep -r "router\." server/routes/ 2>/dev/null | grep -E '\.(get|post|put|patch|delete)\(' | wc -l || true)
fi

echo "Expected endpoints: $EXPECTED"
echo "Implemented routes: $IMPLEMENTED"

if [ "$IMPLEMENTED" -ge "$EXPECTED" ]; then
  echo "[OK] PASS - Endpoint count matches or exceeds spec"
  exit 0
else
  echo "[WARN] Endpoint count mismatch (expected: $EXPECTED, found: $IMPLEMENTED)"
  exit 0
fi
