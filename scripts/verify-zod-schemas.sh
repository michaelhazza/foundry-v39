#!/bin/bash
set -euo pipefail

echo "=== Zod Schema Verification ==="

if [ ! -d "server/routes" ]; then
  echo "[SKIP] Server routes not generated yet"
  exit 0
fi

ISSUES=0

for route_file in server/routes/*.routes.ts; do
  [ -f "$route_file" ] || continue

  MUTATION_ROUTES=$(grep -E 'router\.(post|put|patch)' "$route_file" 2>/dev/null | wc -l || true)
  VALIDATED=$(grep -c "validateRequest\|validateBody\|zodSchema\|Schema" "$route_file" 2>/dev/null || true)

  if [ "$MUTATION_ROUTES" -gt 0 ] && [ "$VALIDATED" -eq 0 ]; then
    echo "[X] $(basename $route_file) has $MUTATION_ROUTES mutation routes with no validation"
    ISSUES=$((ISSUES + 1))
  fi
done

if [ "$ISSUES" -eq 0 ]; then
  echo "[OK] Zod schema verification passed"
  exit 0
else
  echo "[X] Found $ISSUES validation issues"
  exit 1
fi
