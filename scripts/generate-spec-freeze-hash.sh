#!/bin/bash
set -euo pipefail

echo "=== Generating Specification Freeze Hash ==="

SPEC_FILES=(
  "docs/01-PRD.md"
  "docs/02-ARCHITECTURE.md"
  "docs/03-DATA-MODEL.md"
  "docs/04-API-CONTRACT.md"
  "docs/05-UI-SPECIFICATION.md"
  "docs/06-IMPLEMENTATION-PLAN.md"
)

COMBINED=""
for file in "${SPEC_FILES[@]}"; do
  if [ -f "$file" ]; then
    COMBINED+=$(cat "$file")
  fi
done

HASH=$(echo -n "$COMBINED" | sha256sum | awk '{print $1}')

echo "$HASH" > .spec-freeze-hash

echo "Specification freeze hash generated: $HASH"
echo "Spec stack frozen"
