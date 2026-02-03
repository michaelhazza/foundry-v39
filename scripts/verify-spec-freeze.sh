#!/bin/bash
set -euo pipefail

echo "=== Spec Freeze Hash Validation ==="

SPEC_HASH_FILE=".artifacts/spec-hash.txt"

compute_spec_hash() {
  find docs/ -maxdepth 1 -name "*.md" -type f 2>/dev/null | sort | while read file; do
    cat "$file"
  done | sha256sum | awk '{print $1}'
}

mkdir -p .artifacts

if [ "${1:-}" = "--compute" ]; then
  HASH=$(compute_spec_hash)
  echo "$HASH" > "$SPEC_HASH_FILE"
  echo "[OK] Spec hash computed: $HASH"
  echo "Spec stack frozen"
  exit 0
fi

if [ ! -f "$SPEC_HASH_FILE" ]; then
  echo "[SKIP] No spec hash found (run with --compute first)"
  exit 0
fi

ORIGINAL_HASH=$(cat "$SPEC_HASH_FILE")
CURRENT_HASH=$(compute_spec_hash)

echo "Original hash: $ORIGINAL_HASH"
echo "Current hash:  $CURRENT_HASH"

if [ "$ORIGINAL_HASH" != "$CURRENT_HASH" ]; then
  echo "[X] FAIL - Spec stack modified during build!"
  exit 1
else
  echo "[OK] PASS - Spec stack unchanged"
fi

exit 0
