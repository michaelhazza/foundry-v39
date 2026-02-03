#!/bin/bash
set -euo pipefail

echo "=== Health Check Schema Verification ==="

if [ ! -f "server/index.ts" ]; then
  echo "[SKIP] server/index.ts not found yet"
  exit 0
fi

ISSUES=0

if ! grep -q '/health\|/healthz\|/api/health' server/index.ts; then
  echo "[SKIP] No health check endpoint found"
  exit 0
fi

if ! grep -A 10 '/health' server/index.ts | grep -q 'status:'; then
  echo "[X] Health check missing status field"
  ISSUES=$((ISSUES + 1))
fi

if [ "$ISSUES" -eq 0 ]; then
  echo "[OK] Health check schema verification passed"
  exit 0
else
  echo "[X] Found $ISSUES health check issues"
  exit 1
fi
