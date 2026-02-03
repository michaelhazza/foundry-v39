#!/bin/bash
set -euo pipefail

echo "=== Mandatory UI Components Verification ==="

ISSUES=0

# ErrorBoundary component
if [ -d "client/src/components" ]; then
  if [ ! -f "client/src/components/ErrorBoundary.tsx" ]; then
    echo "[X] ErrorBoundary.tsx not found"
    ISSUES=$((ISSUES + 1))
  else
    if ! grep -q "componentDidCatch" client/src/components/ErrorBoundary.tsx; then
      echo "[X] ErrorBoundary missing componentDidCatch"
      ISSUES=$((ISSUES + 1))
    fi
    if ! grep -q "getDerivedStateFromError" client/src/components/ErrorBoundary.tsx; then
      echo "[X] ErrorBoundary missing getDerivedStateFromError"
      ISSUES=$((ISSUES + 1))
    fi
  fi

  # Check ErrorBoundary is used in main.tsx
  if [ -f "client/src/main.tsx" ]; then
    if ! grep -q "ErrorBoundary" client/src/main.tsx; then
      echo "[X] ErrorBoundary not used in main.tsx"
      ISSUES=$((ISSUES + 1))
    fi
  fi
else
  echo "[SKIP] client/src/components not created yet"
  exit 0
fi

# API Client 401 handling
if [ -f "client/src/lib/api.ts" ]; then
  if ! grep -q "401\|interceptor" client/src/lib/api.ts; then
    echo "[X] API client missing 401 handling"
    ISSUES=$((ISSUES + 1))
  fi
fi

if [ "$ISSUES" -eq 0 ]; then
  echo "[OK] Mandatory UI components verification passed"
  exit 0
else
  echo "[X] Found $ISSUES UI component issues"
  exit 1
fi
