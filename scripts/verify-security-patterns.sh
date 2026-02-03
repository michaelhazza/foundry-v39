#!/bin/bash
set -euo pipefail

echo "=== Security Patterns Verification ==="

ISSUES=0

# Skip if no server code yet
if [ ! -d "server/services" ] && [ ! -d "server/routes" ]; then
  echo "[SKIP] Server code not generated yet"
  exit 0
fi

# Pattern 1: Multi-tenant isolation
if [ -d "server/services" ]; then
  for svc in server/services/*.service.ts; do
    [ -f "$svc" ] || continue
    if grep -q "findMany\|findFirst\|\.select()" "$svc" 2>/dev/null; then
      if ! grep -q "organizationId" "$svc" 2>/dev/null; then
        echo "[X] $(basename $svc) missing organizationId filter"
        ISSUES=$((ISSUES + 1))
      fi
    fi
  done
fi

# Pattern 3: Rate limiting on auth
if [ -d "server/routes" ] && [ -f "server/routes/auth.routes.ts" ]; then
  if ! grep -q "authLimiter\|rateLimiter\|rateLimit" server/routes/auth.routes.ts 2>/dev/null; then
    echo "[X] Auth routes missing rate limiting"
    ISSUES=$((ISSUES + 1))
  fi
fi

# Pattern 5: Transaction enforcement for registration
if [ -d "server/services" ]; then
  for svc in server/services/*.service.ts; do
    [ -f "$svc" ] || continue
    if grep -q "async.*register" "$svc" 2>/dev/null; then
      FUNC_CONTENT=$(grep -A 30 'async.*register' "$svc" | head -n 30)
      INSERT_COUNT=$(echo "$FUNC_CONTENT" | grep -c '\.insert(\|\.create(' || true)
      if [ "$INSERT_COUNT" -gt 1 ]; then
        if ! echo "$FUNC_CONTENT" | grep -q 'db\.transaction\|\.transaction'; then
          echo "[X] $(basename $svc) registration has $INSERT_COUNT inserts without transaction"
          ISSUES=$((ISSUES + 1))
        fi
      fi
    fi
  done
fi

if [ "$ISSUES" -eq 0 ]; then
  echo "[OK] Security patterns verification passed"
  exit 0
else
  echo "[X] Found $ISSUES security pattern issues"
  exit 1
fi
