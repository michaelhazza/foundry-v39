#!/bin/bash
set -euo pipefail

echo "=== No Inline Styles Verification ==="

if [ ! -d "client/src/pages" ]; then
  echo "[SKIP] Client pages not generated yet"
  exit 0
fi

INLINE_STYLES=$(grep -rn 'style={{' client/src/pages/ 2>/dev/null | wc -l || true)

if [ "$INLINE_STYLES" -gt 0 ]; then
  echo "[WARN] Found $INLINE_STYLES inline style usages"
  echo "  Should use Tailwind classes instead"
else
  echo "[OK] No inline styles found"
fi

exit 0
