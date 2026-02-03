#!/bin/bash
set -euo pipefail

FAILED=0
TOTAL=0
FAILED_LIST=()

for script in scripts/verify-*.sh; do
  [ -f "$script" ] || continue
  TOTAL=$((TOTAL+1))
  GATE=$(basename "$script" .sh)

  if bash "$script" > "/tmp/${GATE}.log" 2>&1; then
    printf "%-50s PASS\n" "$GATE"
  else
    printf "%-50s FAIL\n" "$GATE"
    cat "/tmp/${GATE}.log"
    FAILED=$((FAILED+1))
    FAILED_LIST+=("$GATE")
  fi
done

echo ""
echo "Total: $TOTAL | Passed: $((TOTAL-FAILED)) | Failed: $FAILED"

if [ $FAILED -gt 0 ]; then
  echo "BUILD BLOCKED - Fix:"
  for gate in "${FAILED_LIST[@]}"; do echo "  - $gate"; done
  exit 1
else
  echo "ALL GATES PASSED"
  exit 0
fi
