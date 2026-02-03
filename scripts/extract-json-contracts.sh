#!/bin/bash
set -euo pipefail

echo "=== Extracting JSON Contracts ==="

mkdir -p docs

# Check for sentinel collisions
for sentinel in "SERVICE-CONTRACTS-JSON" "ROUTES-PAGES-MANIFEST-JSON" "ARCHITECTURAL-DECISIONS-JSON"; do
  case $sentinel in
    "SERVICE-CONTRACTS-JSON")
      file="docs/04-API-CONTRACT.md"
      ;;
    "ROUTES-PAGES-MANIFEST-JSON")
      file="docs/05-UI-SPECIFICATION.md"
      ;;
    "ARCHITECTURAL-DECISIONS-JSON")
      file="docs/02-ARCHITECTURE.md"
      ;;
  esac

  if [ -f "$file" ]; then
    count=$(grep -c "### $sentinel" "$file" || true)
    if [ "$count" -gt 1 ]; then
      echo "[X] ERROR: Multiple '### $sentinel' headers found in $file"
      exit 1
    elif [ "$count" -eq 0 ]; then
      echo "[WARN] Sentinel '### $sentinel' not found in $file - will skip"
    fi
  fi
done

# Extract service-contracts.json
if [ -f "docs/04-API-CONTRACT.md" ] && grep -q "### SERVICE-CONTRACTS-JSON" "docs/04-API-CONTRACT.md"; then
  sed -n '/### SERVICE-CONTRACTS-JSON/,/^```$/p' docs/04-API-CONTRACT.md | \
    sed '1d;$d' | sed '/^```json$/d' | sed '/^```$/d' > docs/service-contracts.json
  echo "[OK] Extracted service-contracts.json"
else
  echo "[WARN] Could not extract service-contracts.json"
fi

# Extract routes-pages-manifest.json
if [ -f "docs/05-UI-SPECIFICATION.md" ] && grep -q "### ROUTES-PAGES-MANIFEST-JSON" "docs/05-UI-SPECIFICATION.md"; then
  sed -n '/### ROUTES-PAGES-MANIFEST-JSON/,/^```$/p' docs/05-UI-SPECIFICATION.md | \
    sed '1d;$d' | sed '/^```json$/d' | sed '/^```$/d' > docs/routes-pages-manifest.json
  echo "[OK] Extracted routes-pages-manifest.json"
else
  echo "[WARN] Could not extract routes-pages-manifest.json"
fi

# Extract architectural-decisions.json
if [ -f "docs/02-ARCHITECTURE.md" ] && grep -q "### ARCHITECTURAL-DECISIONS-JSON" "docs/02-ARCHITECTURE.md"; then
  sed -n '/### ARCHITECTURAL-DECISIONS-JSON/,/^```$/p' docs/02-ARCHITECTURE.md | \
    sed '1d;$d' | sed '/^```json$/d' | sed '/^```$/d' > docs/architectural-decisions.json
  echo "[OK] Extracted architectural-decisions.json"
else
  echo "[WARN] Could not extract architectural-decisions.json"
fi

# Validate JSON syntax
for file in service-contracts.json routes-pages-manifest.json architectural-decisions.json; do
  if [ -f "docs/$file" ]; then
    if command -v python3 >/dev/null 2>&1; then
      if ! python3 -m json.tool "docs/$file" > /dev/null 2>&1; then
        echo "[WARN] Invalid JSON in $file - may need manual correction"
      else
        echo "[OK] Valid JSON: $file"
      fi
    fi
  fi
done

echo "[OK] JSON contract extraction complete"
