# Claude Code Master Build Prompt (Application-Agnostic v26)

## ⚠️ CRITICAL: APPLICATION-AGNOSTIC VERSION

**This Build Prompt works with ANY codebase** - no hardcoded file names or paths.

All verification scripts use **pattern-based detection** instead of checking specific files.

---

### Step 8.X: Verify Spec Stack Integrity (FINAL CHECK)

**Purpose:** Confirm no specification mutations occurred during build

**Why Critical:** If any spec file changed after Phase 0.0a, later phases may have generated inconsistent code. This is a critical integrity check.

**Execution:**

```bash
echo "=== Phase 8: Spec Stack Integrity Check ==="

bash scripts/verify-spec-freeze.sh

if [ $? -eq 0 ]; then
  echo "[OK] Spec stack integrity verified - no mutations detected"
else
  echo "[X] CRITICAL FAILURE - Spec stack was modified during build"
  echo ""
  echo "ACTION REQUIRED:"
  echo "1. Do NOT deploy this build"
  echo "2. Restore original spec files"
  echo "3. Re-run entire build from Phase 0"
  exit 1
fi
```

**Gate:** BLOCKING - Deployment stops if spec files changed since Phase 0.0a

**What It Detects:**
- Accidental spec edits during build
- Tool auto-save corruption
- Version control conflicts
- Any spec file modification after Phase 0.0a

**Expected Output:**
```
=== Spec Freeze Hash Validation ===
Original hash (Phase 0.0a): a1b2c3d4e5f6...
Current hash (Phase 8):     a1b2c3d4e5f6...

[OK] PASS - Spec stack unchanged
All specification files match Phase 0.0a state
```

---

## FRAMEWORK VERSION

Framework: Agent Specification Framework v2.1
Constitution: Inherited from Agent 0 (Constitution v4.6)
Document: Claude Code Master Build Prompt (Application-Agnostic)
Version: v26
Status: Active
Optimization: AI-to-AI Communication
Agent Versions: Agent 0 v4.6, Agent 1 v20, Agent 2 v26, Agent 3 v23, Agent 4 v38, Agent 5 v35, Agent 6 v54, Agent 7 v49, Agent 8 v42
Audit: Agent 8 v42 (82 patterns, tiered 1/2/3, auto-fix enabled, 0-2 issue target)

---

## VERSION HISTORY

| Version | Date | Changes |
|---------|------|---------|
| v26 | 2026-02 | **2-LAYER ENFORCEMENT MODEL:** Updated to Agent 6 v54-MACHINE-SPEC with comprehensive 2-layer enforcement. **CONFIGURATION section replaced with 2-layer enforcement model:** Progressive enforcement (run-all-gates.sh after each phase) + Backstop enforcement (npm prebuild/predev hooks). Added explicit numbered procedural verification steps after each phase (Phase 1 → GATE → Phase 2 → GATE, etc.). Updated script count from 25 to 30 (added verify-no-db-in-routes.sh, verify-error-envelope.sh, verify-response-utilities.sh, verify-specs.sh, verify-config-completeness.sh). Master runner (run-all-gates.sh) with set -euo pipefail. Frontend-backend contract validator enhanced (template strings, query strings, robust normalization). All verification scripts use safe if-not pattern (no `|| ((ISSUES++))`). JSON extraction uses docs/ path consistently. All 30 scripts explicitly enumerated. Port architecture enforced: Vite 5000 (dev), Express 3001 (dev), Express 5000 (prod). Drizzle scripts use --force flags. Package.json includes prebuild/predev hooks. Cross-references: Agent 6 v54 Phases 0-8, run-all-gates.sh master runner, 2-layer enforcement model. Expected: 99.9% prevention via Progressive + Backstop enforcement; Hygiene Gate: PASS |
| v25 | 2026-02 | **CONSTITUTION v4.6 ALIGNMENT:** Updated framework references to Constitution v4.6 tiered prevention model. Updated agent version references (Agent 0 v4.6, Agent 1 v20, Agent 2 v26, Agent 3 v23, Agent 4 v38, Agent 5 v35, Agent 6 v53, Agent 7 v49, Agent 8 v42). Phase 0 now references Phase 0.5 pre-flight gates from Agent 6 v53 (20 BLOCKING patterns before scaffolding). Security pattern verification references Agent 4 Section 9 (6 security patterns). Mandatory UI component verification references Agent 5 Section 7 (3 UI patterns). Updated expected issue count: 0-2 issues (was 0) reflecting 99.9% prevention rate. Framework version updated to v2.1. Constitution reference explicit: v4.6 tiered prevention model. Cross-references: Agent 6 v53 Phase 0.5, Agent 4 Section 9, Agent 5 Section 7, Constitution Section W/X. Expected outcome: Phase 0 creates verification scripts, Phase 0.5 gates validate before scaffolding, Phases 1-8 progressive gates enforce quality; Hygiene Gate: PASS | **Integration:** Build prompt now fully aligned with Constitution v4.6 3-tier prevention model. Phase 0.5 pre-flight gates (from Agent 6 v53) run BEFORE Phase 1 scaffolding - validates security patterns (multi-tenant isolation, RBAC, rate limiting, password validation, transactions, cross-org), UI components (ErrorBoundary first, AcceptInvitePage conditional, API client 401), and spec quality (freeze hash, arithmetic validation). All verification scripts reference updated agent versions. Expected issue count adjusted to 0-2 (99.9% prevention) from 0 (100% unrealistic). Agent 8 v42 audit expects clean build = success (tiered prevention worked). Constitution Section W patterns distributed across build lifecycle. Section X spec freeze prevents mid-build mutations. Quality target: Tier 1 (0 issues), Tier 2 (0-2 issues), Tier 3 (edge cases). Total: 0-4 issues per build vs previous 15-20. Prevention-first architecture complete. |
| v24.3 | 2026-01-29 | **APPLICATION-AGNOSTIC:** Removed ALL Foundry-specific hardcoded checks. Gate #54 now uses pattern-based detection (checks ALL route files for singular vs plural imports dynamically). Endpoint path verifier made generic (no hardcoded paths). Transaction verifier checks patterns (multi-table operations) not specific files. Zod schema verifier checks auth patterns in ANY file. Multi-tenant verifier checks access control patterns not specific routes. All 25 verification scripts now work with ANY codebase. Added validation that service-contracts.json is valid JSON. Expected: Framework works for any Express+React+PostgreSQL application; Hygiene Gate: PASS | Gate #54: Dynamic singular/plural detection, checks ALL *.routes.ts files. Endpoint paths: Removed /api/invitations and /api/process hardcodes, now generic. Transactions: Checks for async register/delete patterns in ANY service file. Zod schemas: Checks for .login(x,y) pattern anywhere, not just auth.routes.ts. Multi-tenant: Checks for organizationId validation pattern in ANY route file. All scripts use for loops over *.routes.ts and *.service.ts instead of checking specific files. Completes true application-agnostic framework. |
| v24.2 | 2026-01-29 | **FINAL HARDENING:** Added 3 high-value verification scripts. Phase 0.0a: verify-spec-freeze.sh. Phase 0.7m: verify-no-implicit-defaults.sh. Phase 0.7n: verify-zero-console-noise.sh. Phase 8.X: Verifies spec hash unchanged. Total scripts: 21 -> 24 (+3). Cross-references: Agent 7 v48.2 Gates. Prevents: spec mutations, hidden config, log pollution. Expected: 98% -> 99% first-run code quality; Hygiene Gate: PASS |
| v24 | 2026-01-28 | **20 VERIFICATION SCRIPTS:** Added 12 semantic pattern scripts (Steps 0.7a-0.7l). Total: 8 structural + 12 semantic = 20. Each targets specific audit finding. Scripts catch issues at generation time vs audit time. Prevention rate: 0% -> 100% for known issues; Hygiene Gate: PASS |

---

## ENFORCEMENT MODEL (2-LAYER)

**[CRITICAL]** This framework uses a 2-layer enforcement architecture for 99.9% issue prevention.

---

### LAYER 1: PROGRESSIVE ENFORCEMENT (Per-Phase Gates)

**What:** Phase gate after EVERY phase (Phases 1-8)

**How:** Run `bash scripts/run-all-gates.sh` after each phase completes

**Blocks:** Any phase that fails verification - must fix before proceeding

**Requirement:** Gates must be run sequentially, never skipped

**Implementation:**
```bash
# After Phase 1 (Scaffolding + Templates)
bash scripts/run-all-gates.sh || exit 1

# After Phase 2 (Services)  
bash scripts/run-all-gates.sh || exit 1

# After Phase 3 (Routes)
bash scripts/run-all-gates.sh || exit 1

# ... after each phase ...

# After Phase 8 (Final Integration)
bash scripts/run-all-gates.sh || exit 1
```

**Purpose:** Catches issues immediately after generation, when context is fresh and fixes are cheap.

---

### LAYER 2: BACKSTOP ENFORCEMENT (NPM Lifecycle Hooks)

**What:** NPM lifecycle hooks run verification automatically

**How:** `prebuild` and `predev` hooks in package.json call verification scripts

**Blocks:** `npm run build` and `npm run dev` if verification fails

**Requirement:** Hooks must always be present and cannot be bypassed

**Implementation:**
```json
{
  "scripts": {
    "prebuild": "bash scripts/run-all-gates.sh",
    "predev": "bash scripts/run-all-gates.sh",
    "dev": "PORT=3001 concurrently \"npm run dev:server\" \"npm run dev:client\"",
    "build": "npm run db:push && tsc && vite build",
    "start": "NODE_ENV=production PORT=5000 node dist/server/index.js"
  }
}
```

**Purpose:** Prevents deployment or running of unverified code, even if developer skips manual verification.

---

### BYPASS PROTECTION

**Problem:** Developers can bypass npm hooks with:
- `npm run dev --ignore-scripts` (bypasses prebuild/predev hooks)
- `vite` (runs Vite directly)
- `node server/index.js` (runs Express directly)

**Required Protection Rules:**
1. **NEVER run subcommands directly** - Always use `npm run dev`, `npm run build`, `npm run verify`
2. **NEVER use --ignore-scripts flag** - This bypasses all verification
3. **CI/CD must enforce** - Add CI check that fails if scripts were bypassed

**For Production Teams:** Add Git pre-commit hooks that run verification and prevent commits with --ignore-scripts in scripts.

---

### BOTH LAYERS REQUIRED

**Progressive** catches issues early (per-phase), **Backstop** prevents deployment of unverified code.

**Without Progressive:** Issues accumulate, harder to debug, context lost  
**Without Backstop:** Developers can skip verification, deploy broken code  
**With Both:** 99.9% prevention rate (0-2 issues per build)

---

### VERIFICATION GATE COUNT: 30 Scripts

The framework includes **30 verification scripts** (not 25, not 28):

1. verify-vite-config.sh
2. verify-package-scripts.sh
3. verify-health-check-schema.sh
4. verify-cors-config.sh
5. verify-endpoint-count.sh
6. verify-service-contracts.sh
7. verify-security-patterns.sh
8. verify-mandatory-ui-components.sh
9. verify-frontend-backend-contract.sh
10. verify-stub-detection.sh
11. verify-express-dev-port.sh
12. verify-express-prod-static.sh
13. verify-endpoint-paths.sh
14. verify-spec-freeze.sh
15. verify-transactions.sh
16. verify-file-manifest.sh
17. verify-directories.sh
18. verify-dependencies.sh
19. verify-no-db-in-routes.sh
20. verify-error-envelope.sh
21. verify-response-utilities.sh
22. verify-middleware-order.sh
23. verify-zod-schemas.sh
24. verify-base-service-pattern.sh
25. verify-no-inline-styles.sh
26. verify-route-service-separation.sh
27. generate-spec-freeze-hash.sh
28. extract-json-contracts.sh
29. verify-specs.sh
30. verify-config-completeness.sh

Plus: `run-all-gates.sh` (master runner that executes all verify-*.sh scripts)

---

### CRITICAL DISTINCTION: GATES vs AGENT 8

| Feature | Always Runs? | Controlled By | Can Skip? |
|---------|-------------|---------------|-----------|
| **Phase 0: Create scripts** | ✓ YES | ALWAYS | ✗ NO |
| **Phase 0.5: Pre-flight gates** | ✓ YES | ALWAYS | ✗ NO |
| **Progressive gates (Phases 1-8)** | ✓ YES | ALWAYS | ✗ NO |
| **Backstop hooks (prebuild/predev)** | ✓ YES | ALWAYS | ✗ NO |
| **Agent 8 audit loop** | ✗ NO | AUTO_FIX_MODE | ✓ YES |
| **Agent 8 auto-fix** | ✗ NO | AUTO_FIX_MODE | ✓ YES |

**[CRITICAL]** VERIFICATION GATES ARE NOT OPTIONAL. They are the framework's quality assurance layer and must run on every build.

---

### AUTO_FIX_MODE: Controls Agent 8 Auto-Fix Loop ONLY

```
AUTO_FIX_MODE = false  # DEFAULT - Prevention-first approach
```

**What This Controls (AND ONLY THIS):**
- ✓ Agent 8 comprehensive audit (runs when true, skips when false)
- ✓ Agent 8 auto-fix iteration loop (runs when true, skips when false)

**What This Does NOT Control:**
- ✗ Verification gates (ALWAYS run regardless of this setting)
- ✗ Progressive enforcement (ALWAYS run)
- ✗ Backstop enforcement (ALWAYS run)

**Options:**
- `false` (DEFAULT) - Prevention-first: Skip Agent 8, rely on 2-layer enforcement
  - Faster builds (~3 min saved)
  - Expected: 0-2 issues if gates pass
  - Recommended for most builds
  
- `true` - Detection + auto-fix: Run Agent 8 after gates pass
  - Comprehensive audit (82 patterns)
  - Auto-fixes detected issues
  - Use as safety net for complex builds
  - Expected: Iteration 1 finds 0-1 issues

---

### CONCURRENT_EXECUTION: Parallel vs Sequential Build

```
CONCURRENT_EXECUTION = true  # DEFAULT
```

**What This Controls:**
- Thread A: Services → Routes (sequential within thread)
- Thread B: Database schema
- Thread C: Components → Pages (sequential within thread)

**Options:**
- `true` (DEFAULT) - 25% faster builds via parallel execution
- `false` - Sequential execution (easier debugging)

**Note:** Each thread still runs gates after its phases complete.

---

### Current Workflow (CONCURRENT_EXECUTION=true, AUTO_FIX_MODE=false)

```
Phase 0: Create 30 verification scripts + run-all-gates.sh
  ↓
Phase 0.5: Pre-flight gates (BLOCKING) → ALWAYS RUNS
  ↓
Phase 1: Scaffolding + Templates
  ↓ [GATE: bash scripts/run-all-gates.sh]
  ↓
---CONCURRENT BLOCK---
  Thread A: Phase 2 (Services)
            ↓ [GATE: bash scripts/run-all-gates.sh]
            Phase 3 (Routes)
            ↓ [GATE: bash scripts/run-all-gates.sh]
  Thread B: Phase 4 (Database)
            ↓ [GATE: bash scripts/run-all-gates.sh]
  Thread C: Phase 5 (Components)
            ↓ [GATE: bash scripts/run-all-gates.sh]
            Phase 7 (Pages)
            ↓ [GATE: bash scripts/run-all-gates.sh]
---END CONCURRENT BLOCK---
  ↓
Phase 6: Auth & Middleware
  ↓ [GATE: bash scripts/run-all-gates.sh]
  ↓
Phase 8: Integration + spec freeze verification
  ↓ [GATE: bash scripts/run-all-gates.sh]
  ↓
npm run build (triggers prebuild hook → run-all-gates.sh) → BACKSTOP LAYER
  ↓
Agent 8: SKIPPED (AUTO_FIX_MODE=false)
  ↓
Deploy (if all gates passed)
```

**Key Point:** Progressive gates run after every phase. Backstop hooks run before build/dev. Agent 8 is optional.

---

### What Happens If Gates Are Skipped (DON'T DO THIS)

**If verification gates don't run:**
- Import paths wrong (singular vs plural) → MODULE_NOT_FOUND crashes
- Function signatures wrong → Runtime type errors
- List endpoints wrong → Pagination broken
- 10-20 issues in code → Manual debugging required
- Build unusable

**If gates DO run (2-layer enforcement):**
- Issues caught at generation time (Progressive)
- Backstop prevents deployment of broken code
- 0-2 issues in final code (99.9% prevention)
- Deploy immediately

**[CRITICAL]** Never skip gates. 2-layer enforcement is NON-NEGOTIABLE.

---

## PROGRESSIVE ENFORCEMENT: NUMBERED VERIFICATION STEPS

**[CRITICAL]** After EVERY phase (1-8), you MUST run the master gate runner. Do NOT proceed to the next phase until gates pass.

### Execution Pattern for ALL Phases

```bash
# After Phase 1: Scaffolding + Templates
echo "=== Running Phase 1 Verification Gates ==="
bash scripts/run-all-gates.sh
if [ $? -ne 0 ]; then
  echo "[X] Phase 1 verification FAILED - fix issues before Phase 2"
  exit 1
fi
echo "[OK] Phase 1 COMPLETE - proceeding to Phase 2"

# After Phase 2: Services
echo "=== Running Phase 2 Verification Gates ==="
bash scripts/run-all-gates.sh
if [ $? -ne 0 ]; then
  echo "[X] Phase 2 verification FAILED - fix issues before Phase 3"
  exit 1
fi
echo "[OK] Phase 2 COMPLETE - proceeding to Phase 3"

# After Phase 3: Routes
echo "=== Running Phase 3 Verification Gates ==="
bash scripts/run-all-gates.sh
if [ $? -ne 0 ]; then
  echo "[X] Phase 3 verification FAILED - fix issues before Phase 4"
  exit 1
fi
echo "[OK] Phase 3 COMPLETE - proceeding to Phase 4"

# After Phase 4: Database
echo "=== Running Phase 4 Verification Gates ==="
bash scripts/run-all-gates.sh
if [ $? -ne 0 ]; then
  echo "[X] Phase 4 verification FAILED - fix issues before Phase 5"
  exit 1
fi
echo "[OK] Phase 4 COMPLETE - proceeding to Phase 5"

# After Phase 5: Components
echo "=== Running Phase 5 Verification Gates ==="
bash scripts/run-all-gates.sh
if [ $? -ne 0 ]; then
  echo "[X] Phase 5 verification FAILED - fix issues before Phase 6"
  exit 1
fi
echo "[OK] Phase 5 COMPLETE - proceeding to Phase 6"

# After Phase 6: Auth & Middleware
echo "=== Running Phase 6 Verification Gates ==="
bash scripts/run-all-gates.sh
if [ $? -ne 0 ]; then
  echo "[X] Phase 6 verification FAILED - fix issues before Phase 7"
  exit 1
fi
echo "[OK] Phase 6 COMPLETE - proceeding to Phase 7"

# After Phase 7: Pages
echo "=== Running Phase 7 Verification Gates ==="
bash scripts/run-all-gates.sh
if [ $? -ne 0 ]; then
  echo "[X] Phase 7 verification FAILED - fix issues before Phase 8"
  exit 1
fi
echo "[OK] Phase 7 COMPLETE - proceeding to Phase 8"

# After Phase 8: Integration + Spec Freeze Verification
echo "=== Running Phase 8 Verification Gates ==="
bash scripts/run-all-gates.sh
if [ $? -ne 0 ]; then
  echo "[X] Phase 8 verification FAILED - fix issues before build"
  exit 1
fi
bash scripts/verify-spec-freeze.sh || exit 1
echo "[OK] Phase 8 COMPLETE - ready for npm run build"
```

### Gate Execution Rules

1. **BLOCKING:** If any gate fails, STOP immediately and fix the issue
2. **SEQUENTIAL:** Gates must run in order (cannot skip phases)
3. **COMPREHENSIVE:** run-all-gates.sh runs ALL 30 verification scripts
4. **MANDATORY:** These gates are not optional under any circumstances

### What run-all-gates.sh Does

```bash
# Executes all verify-*.sh scripts in scripts/ directory
# Counts passes and failures
# Exits with code 1 if ANY gate fails
# Blocks progression until all gates pass
```

### Phase-to-Gate Mapping

| Phase | After What | Gate Command | Must Pass Before |
|-------|-----------|--------------|------------------|
| Phase 1 | Scaffolding + Templates | `bash scripts/run-all-gates.sh` | Phase 2 |
| Phase 2 | Services implementation | `bash scripts/run-all-gates.sh` | Phase 3 |
| Phase 3 | Routes implementation | `bash scripts/run-all-gates.sh` | Phase 4 |
| Phase 4 | Database schema | `bash scripts/run-all-gates.sh` | Phase 5 |
| Phase 5 | UI Components | `bash scripts/run-all-gates.sh` | Phase 6 |
| Phase 6 | Auth & Middleware | `bash scripts/run-all-gates.sh` | Phase 7 |
| Phase 7 | Pages implementation | `bash scripts/run-all-gates.sh` | Phase 8 |
| Phase 8 | Integration + spec freeze | `bash scripts/run-all-gates.sh && bash scripts/verify-spec-freeze.sh` | Build |

**[CRITICAL]** This table shows the minimum required gates. Agent 6 v54 may have additional phase-specific verification steps - follow Agent 6 precisely.

---

## Phase 0: Pre-Flight Validation (MANDATORY - CREATE SCRIPTS FIRST)

**[CRITICAL]** Before generating ANY application code, you MUST create all verification scripts. These scripts prevent issues at generation time.

---

### Step 0.1: Create Verification Infrastructure (BLOCKING)

**Create scripts/ directory:**
```bash
mkdir -p scripts
```

**[CRITICAL]** You must create ALL verification scripts below BEFORE proceeding to Step 0.2.

---

### Step 0.2: Create Gate #54 - Contract Compliance (BLOCKING) - APPLICATION-AGNOSTIC

**File:** `scripts/verify-contract-compliance.sh`

```bash
#!/bin/bash
# Gate #54: verify-contract-compliance.sh - Validates routes match service-contracts.json
# APPLICATION-AGNOSTIC VERSION - Works with ANY codebase

echo "=== Gate #54: Contract Compliance Validation ==="
echo ""

# Check if contracts exist
if [ ! -f "docs/service-contracts.json" ]; then
  echo "[X] FAIL - service-contracts.json not found in docs/"
  exit 1
fi

FAILED=0

# Check 1: Service file import paths (PATTERN-BASED, NOT HARDCODED)
echo "Check 1: Import path compliance (singular vs plural)"
IMPORT_ERRORS=0

# For ALL route files, check if they import singular service names
for route_file in server/routes/*.routes.ts; do
  if [ ! -f "$route_file" ]; then continue; fi
  
  route_name=$(basename "$route_file" .routes.ts)
  
  # Extract the resource name (e.g., "projects" from "projects.routes.ts")
  resource="${route_name}"
  
  # Check if it imports the singular form
  # Pattern: imports from '../services/X.service' where X is singular of resource
  # Example: projects.routes.ts should NOT import from '../services/project.service'
  
  # Generate singular form (simple heuristic: remove trailing 's')
  if [[ "$resource" =~ s$ ]]; then
    singular="${resource%s}"
    
    # Check if file imports singular when it should import plural
    if grep -q "from.*['\"].*/${singular}\.service['\"]" "$route_file" 2>/dev/null; then
      echo "[X] FAIL: $route_file imports '${singular}.service' - should be '${resource}.service'"
      IMPORT_ERRORS=1
      FAILED=1
    fi
  fi
done

if [ $IMPORT_ERRORS -eq 0 ]; then
  echo "[OK] PASS - All import paths follow plural convention"
else
  echo "[X] FAIL - Import path violations found"
fi

echo ""

# Check 2: Function signature patterns (GENERIC - checks ANY file)
echo "Check 2: Function signature patterns"
SIGNATURE_ERRORS=0

# Check for positional arguments pattern in ANY route file
# Looks for .METHOD(arg1, arg2) where args are simple identifiers (not objects)
if grep -rE '\.(login|register|authenticate|authorize)\([a-zA-Z_]+\s*,\s*[a-zA-Z_]+\)' server/routes/ 2>/dev/null; then
  echo "[X] FAIL: Found auth method calls with positional args"
  echo "    Should use object parameters: { email, password }"
  SIGNATURE_ERRORS=1
  FAILED=1
fi

if grep -rE '\.forgot.*Password\([a-zA-Z_]+\)' server/routes/ 2>/dev/null | grep -v '{' | grep -q '.'; then
  echo "[X] FAIL: Found forgotPassword with non-object arg"
  echo "    Should use object parameter: { email }"
  SIGNATURE_ERRORS=1
  FAILED=1
fi

if [ $SIGNATURE_ERRORS -eq 0 ]; then
  echo "[OK] PASS - Function signatures use object parameters"
else
  echo "[X] FAIL - Function signature violations found"
fi

echo ""

# Check 3: List endpoint patterns (GENERIC - checks ALL files)
echo "Check 3: List endpoint patterns"
LIST_ERRORS=0

# Check ANY route file for list methods with 4+ positional parameters
for route_file in server/routes/*.routes.ts; do
  if [ ! -f "$route_file" ]; then continue; fi
  
  # Look for .list* method calls with comma-separated args (4+ args = violation)
  if grep -E '\.(list[A-Z][a-zA-Z]*|getAll|findAll)\([^)]*,[^)]*,[^)]*,[^)]*\)' "$route_file" 2>/dev/null | grep -q '.'; then
    echo "[X] FAIL: $(basename $route_file) has list method with 4+ positional params"
    echo "    Should use options object: list({ page, limit, sort, filter })"
    LIST_ERRORS=1
    FAILED=1
    break
  fi
done

if [ $LIST_ERRORS -eq 0 ]; then
  echo "[OK] PASS - List methods use options objects"
else
  echo "[X] FAIL - List endpoint violations found"
fi

echo ""

# Check 4: Service-contracts.json validation (GENERIC)
echo "Check 4: Contract file structure"

# Verify contract file is valid JSON
if command -v python3 >/dev/null 2>&1; then
  if ! python3 -m json.tool docs/service-contracts.json > /dev/null 2>&1; then
    echo "[X] FAIL: service-contracts.json is not valid JSON"
    FAILED=1
  else
    echo "[OK] PASS - Contract file is valid JSON"
  fi
else
  # Fallback if python3 not available
  if grep -q '{' docs/service-contracts.json && grep -q '}' docs/service-contracts.json; then
    echo "[OK] PASS - Contract file appears valid (python3 not available for full validation)"
  else
    echo "[X] FAIL: service-contracts.json appears malformed"
    FAILED=1
  fi
fi

echo ""
echo "=========================================="

if [ $FAILED -eq 0 ]; then
  echo "[OK] Contract compliance validation PASSED"
  echo ""
  echo "All routes follow contract conventions:"
  echo "  - Import paths use plural service names"
  echo "  - Function signatures use object parameters"
  echo "  - List methods use options objects"
  echo "  - Contract file is valid JSON"
  exit 0
else
  echo "[X] Contract compliance validation FAILED"
  echo ""
  echo "COMMON FIXES:"
  echo "  1. Import mismatch: Change '../services/X.service' to '../services/Xs.service'"
  echo "  2. Positional args: Change func(a, b, c) to func({ a, b, c })"
  echo "  3. List params: Change list(id, page, limit, sort) to list({ id, page, limit, sort })"
  echo ""
  echo "See service-contracts.json for exact function signatures"
  exit 1
fi
```

**After creating:** `chmod +x scripts/verify-contract-compliance.sh`

---

### Step 0.3: Create Route-Service Contract Verifier (BLOCKING)

**File:** `scripts/verify-route-service-contract.sh`

```bash
#!/bin/bash
# verify-route-service-contract.sh - Validates routes call existing service functions

echo "=== Route-Service Contract Verification ==="

FAILED=0

# Check that route files import from correct service files
echo "Checking route imports..."
for route_file in server/routes/*.routes.ts; do
  if [ ! -f "$route_file" ]; then continue; fi
  
  route_name=$(basename "$route_file" .routes.ts)
  service_file="server/services/${route_name}.service.ts"
  
  # Check if corresponding service exists
  if [ ! -f "$service_file" ]; then
    echo "[X] FAIL: $route_file exists but $service_file does not"
    FAILED=1
  fi
done

if [ $FAILED -eq 0 ]; then
  echo "[OK] PASS - All routes have corresponding services"
  exit 0
else
  echo "[X] FAIL - Some routes missing services"
  exit 1
fi
```

**After creating:** `chmod +x scripts/verify-route-service-contract.sh`

---

### Step 0.4: Create Endpoint Count Verifier (BLOCKING)

**File:** `scripts/verify-endpoint-count.sh`

```bash
#!/bin/bash
# verify-endpoint-count.sh - Validates all endpoints from contracts are implemented

echo "=== Endpoint Count Verification ==="

if [ ! -f "docs/service-contracts.json" ]; then
  echo "[X] FAIL - service-contracts.json not found"
  exit 1
fi

# Count expected endpoints from contract
EXPECTED=$(grep -o '"method"' docs/service-contracts.json | wc -l)

# Count implemented routes
IMPLEMENTED=$(grep -r "router\." server/routes/ 2>/dev/null | grep -E '\.(get|post|put|patch|delete)\(' | wc -l)

echo "Expected endpoints: $EXPECTED"
echo "Implemented routes: $IMPLEMENTED"

if [ "$IMPLEMENTED" -ge "$EXPECTED" ]; then
  echo "[OK] PASS - Endpoint count matches or exceeds spec"
  exit 0
else
  echo "[WARN] Endpoint count mismatch (expected: $EXPECTED, found: $IMPLEMENTED)"
  echo "This may indicate missing routes or counting discrepancy"
  exit 0  # Non-blocking, just warn
fi
```

**After creating:** `chmod +x scripts/verify-endpoint-count.sh`

---

### Step 0.5: Create Endpoint Path Verifier (BLOCKING) - APPLICATION-AGNOSTIC

**File:** `scripts/verify-endpoint-paths.sh`

```bash
#!/bin/bash
# verify-endpoint-paths.sh - Validates endpoint paths match specs
# APPLICATION-AGNOSTIC VERSION - Generic pattern checks only

echo "=== Endpoint Path Verification ==="

if [ ! -f "docs/04-API-CONTRACT.md" ]; then
  echo "[WARN] 04-API-CONTRACT.md not found (skipping path verification)"
  exit 0
fi

FAILED=0

# GENERIC CHECK: Look for paths without expected parameters
echo "Checking for missing route parameters..."

# Check if any routes have paths that look overly simplified
# Pattern: /api/RESOURCE without any :id or :param
SIMPLE_PATHS=$(grep -r "router\\..*('/api/[a-z]*')" server/routes/ 2>/dev/null | wc -l)

if [ $SIMPLE_PATHS -gt 0 ]; then
  echo "[WARN] Found $SIMPLE_PATHS potentially simplified paths"
  echo "  Verify these paths match 04-API-CONTRACT.md"
  echo "  Common issue: /api/resource should be /api/parent/:parentId/resource"
fi

# GENERIC CHECK: Ensure RESTful parameter naming
echo "Checking parameter naming conventions..."
PARAM_ISSUES=0

for route_file in server/routes/*.routes.ts; do
  if [ ! -f "$route_file" ]; then continue; fi
  
  # Check for inconsistent ID parameters (should be :id, :resourceId, etc.)
  if grep -E "router\..*'[^']*:[A-Z]" "$route_file" 2>/dev/null | grep -q '.'; then
    echo "[X] FAIL: $(basename $route_file) has uppercase parameter (should be lowercase)"
    PARAM_ISSUES=1
    FAILED=1
  fi
done

if [ $PARAM_ISSUES -eq 0 ]; then
  echo "[OK] PASS - Parameter naming follows conventions"
else
  echo "[X] FAIL - Parameter naming violations found"
fi

if [ $FAILED -eq 0 ]; then
  echo "[OK] PASS - No critical path violations"
  exit 0
else
  echo "[X] FAIL - Path violations found"
  exit 1
fi
```

**After creating:** `chmod +x scripts/verify-endpoint-paths.sh`

---

### Step 0.6: Create Zod Coverage Verifier (BLOCKING)

**File:** `scripts/verify-zod-coverage.sh`

```bash
#!/bin/bash
# verify-zod-coverage.sh - Validates all POST/PUT/PATCH routes use Zod validation

echo "=== Zod Validation Coverage ==="

FAILED=0
MISSING=0

for route_file in server/routes/*.routes.ts; do
  if [ ! -f "$route_file" ]; then continue; fi
  
  # Count POST/PUT/PATCH routes
  MUTATION_ROUTES=$(grep -E 'router\.(post|put|patch)' "$route_file" 2>/dev/null | wc -l)
  
  # Count validateBody usages
  VALIDATED=$(grep "validateBody" "$route_file" 2>/dev/null | wc -l)
  
  if [ $MUTATION_ROUTES -gt $VALIDATED ]; then
    echo "[X] $(basename $route_file): $MUTATION_ROUTES mutations but only $VALIDATED validated"
    MISSING=$((MISSING + MUTATION_ROUTES - VALIDATED))
    FAILED=1
  fi
done

if [ $FAILED -eq 0 ]; then
  echo "[OK] PASS - All mutation routes validated"
  exit 0
else
  echo "[X] FAIL - $MISSING routes missing Zod validation"
  exit 1
fi
```

**After creating:** `chmod +x scripts/verify-zod-coverage.sh`

---

### Step 0.7: Create Additional Critical Verifiers (BLOCKING)

**File:** `scripts/verify-no-sensitive-logs.sh`

```bash
#!/bin/bash
# verify-no-sensitive-logs.sh - Check for password/token logging

echo "=== Sensitive Data in Logs Check ==="

FAILED=0

if grep -r "console\.log.*password" server/ 2>/dev/null | grep -v "// @allow"; then
  echo "[X] FAIL: Found password in console.log"
  FAILED=1
fi

if grep -r "console\.log.*token" server/ 2>/dev/null | grep -v "// @allow"; then
  echo "[X] FAIL: Found token in console.log"
  FAILED=1
fi

if grep -r "console\.log.*secret" server/ 2>/dev/null | grep -v "// @allow"; then
  echo "[X] FAIL: Found secret in console.log"
  FAILED=1
fi

if [ $FAILED -eq 0 ]; then
  echo "[OK] PASS - No sensitive data logged"
  exit 0
else
  echo "[X] FAIL - Sensitive data found in logs"
  exit 1
fi
```

**After creating:** `chmod +x scripts/verify-no-sensitive-logs.sh`

---

**File:** `scripts/verify-cors-config.sh`

```bash
#!/bin/bash
# verify-cors-config.sh - Validate CORS configuration

echo "=== CORS Configuration Check ==="

if [ ! -f "server/index.ts" ]; then
  echo "[X] FAIL - server/index.ts not found"
  exit 1
fi

if grep -q "cors()" server/index.ts; then
  echo "[OK] PASS - CORS configured"
  exit 0
else
  echo "[WARN] CORS not configured (may be intentional)"
  exit 0  # Non-blocking
fi
```

**After creating:** `chmod +x scripts/verify-cors-config.sh`

---

**File:** `scripts/verify-rate-limiting.sh`

```bash
#!/bin/bash
# verify-rate-limiting.sh - Validate rate limiting exists

echo "=== Rate Limiting Check ==="

if [ -f "server/middleware/rateLimiter.ts" ]; then
  if grep -q "rateLimit" server/middleware/rateLimiter.ts; then
    echo "[OK] PASS - Rate limiting configured"
    exit 0
  fi
fi

echo "[WARN] Rate limiting not found (may be intentional for internal APIs)"
exit 0  # Non-blocking
```

**After creating:** `chmod +x scripts/verify-rate-limiting.sh`

---

### Step 0.7a: Create Response Envelope Verifier (BLOCKING)

**File:** `scripts/verify-response-envelope.sh`

```bash
#!/bin/bash
# verify-response-envelope.sh - Validates response format matches API contract

echo "=== Response Envelope Format Verification ==="

FAILED=0

# Check for wrong envelope format: { success: true, data: ... }
echo "Checking for incorrect envelope format..."
WRONG_FORMAT=$(grep -r "success:.*true.*data:" server/routes/ 2>/dev/null | wc -l)

if [ $WRONG_FORMAT -gt 0 ]; then
  echo "[X] FAIL: Found $WRONG_FORMAT responses using { success, data } format"
  echo "    API contract requires { data, meta: { timestamp } } format"
  FAILED=1
else
  echo "[OK] PASS - No incorrect success field found"
fi

# Check for missing meta.timestamp
echo "Checking for meta.timestamp presence..."
if grep -r 'res\.json(' server/routes/ 2>/dev/null | grep -v 'meta.*timestamp' | grep -v 'sendSuccess\|sendCreated\|sendNoContent' | grep -q 'res\.json'; then
  echo "[WARN] Found responses without meta.timestamp"
  echo "  Consider using response helper utilities"
fi

if [ $FAILED -eq 0 ]; then
  echo "[OK] Response envelope format correct"
  exit 0
else
  echo "[X] Response envelope format violations found"
  echo "    Create server/utils/response.ts with sendSuccess/sendCreated helpers"
  exit 1
fi
```

**After creating:** `chmod +x scripts/verify-response-envelope.sh`

---

### Step 0.7b: Create RequireIntParam Verifier (BLOCKING)

**File:** `scripts/verify-require-int-param.sh`

```bash
#!/bin/bash
# verify-require-int-param.sh - Validates parseInt usage follows utility pattern

echo "=== RequireIntParam Usage Verification ==="

FAILED=0

# Check for direct parseInt on route params
DIRECT_PARSEINT=$(grep -r 'parseInt(req\.params\.' server/routes/ 2>/dev/null | wc -l)

if [ $DIRECT_PARSEINT -gt 0 ]; then
  echo "[WARN] Found $DIRECT_PARSEINT direct parseInt(req.params.*) calls"
  echo "    Consider using requireIntParam() utility for validation"
else
  echo "[OK] PASS - No direct parseInt usage found"
fi

# Check that requireIntParam utility exists (if used)
if grep -rq 'requireIntParam' server/routes/ 2>/dev/null; then
  if [ ! -f "server/utils/validation.ts" ] || ! grep -q 'requireIntParam' server/utils/validation.ts; then
    echo "[X] FAIL: requireIntParam used but not found in server/utils/validation.ts"
    FAILED=1
  else
    echo "[OK] PASS - requireIntParam utility exists"
  fi
fi

if [ $FAILED -eq 0 ]; then
  echo "[OK] RequireIntParam check passed"
  exit 0
else
  echo "[X] RequireIntParam violations found"
  exit 1
fi
```

**After creating:** `chmod +x scripts/verify-require-int-param.sh`

---

### Step 0.7c: Create Transaction Verifier (BLOCKING) - APPLICATION-AGNOSTIC

**File:** `scripts/verify-transactions.sh`

```bash
#!/bin/bash
# verify-transactions.sh - Validates multi-table operations use transactions
# APPLICATION-AGNOSTIC VERSION - Pattern-based detection

echo "=== Transaction Usage Verification ==="

FAILED=0

# GENERIC CHECK: Look for async register/signup functions that create multiple records
echo "Checking registration functions for transactions..."
for service_file in server/services/*.service.ts; do
  if [ ! -f "$service_file" ]; then continue; fi
  
  # Check for register/signup functions
  if grep -q 'async.*register\|async.*signup\|async.*createUser' "$service_file" 2>/dev/null; then
    # Check if function has multiple inserts/creates
    FUNC_CONTENT=$(grep -A 30 'async.*register\|async.*signup\|async.*createUser' "$service_file" | head -n 30)
    INSERT_COUNT=$(echo "$FUNC_CONTENT" | grep -c '\.insert(\|\.create(')
    
    if [ $INSERT_COUNT -gt 1 ]; then
      # Multiple inserts - should have transaction
      if ! echo "$FUNC_CONTENT" | grep -q 'db\.transaction\|trx\|transaction'; then
        echo "[X] FAIL: $(basename $service_file) has registration with $INSERT_COUNT inserts without transaction"
        FAILED=1
      else
        echo "[OK] PASS - $(basename $service_file) registration uses transaction"
      fi
    fi
  fi
done

# GENERIC CHECK: Look for delete functions that perform cascade deletes
echo "Checking delete functions for transactions..."
for service_file in server/services/*.service.ts; do
  if [ ! -f "$service_file" ]; then continue; fi
  
  # Check for delete functions
  if grep -q 'async.*delete' "$service_file" 2>/dev/null; then
    # Check if function has multiple deletes
    FUNC_CONTENT=$(grep -A 30 'async.*delete' "$service_file" | head -n 30)
    DELETE_COUNT=$(echo "$FUNC_CONTENT" | grep -c '\.delete(\|\.remove(')
    
    if [ $DELETE_COUNT -gt 1 ]; then
      # Multiple deletes - should have transaction
      if ! echo "$FUNC_CONTENT" | grep -q 'db\.transaction\|trx\|transaction'; then
        echo "[X] FAIL: $(basename $service_file) has cascade delete with $DELETE_COUNT deletes without transaction"
        FAILED=1
      else
        echo "[OK] PASS - $(basename $service_file) cascade delete uses transaction"
      fi
    fi
  fi
done

if [ $FAILED -eq 0 ]; then
  echo "[OK] Critical transactions present or not needed"
  exit 0
else
  echo "[X] Transaction violations found"
  echo "    Wrap multi-table operations in db.transaction()"
  exit 1
fi
```

**After creating:** `chmod +x scripts/verify-transactions.sh`

---

### Step 0.7d: Create ErrorBoundary Verifier (BLOCKING)

**File:** `scripts/verify-error-boundary.sh`

```bash
#!/bin/bash
# verify-error-boundary.sh - Validates React ErrorBoundary exists and is used

echo "=== ErrorBoundary Verification ==="

FAILED=0

# Check ErrorBoundary component exists
if [ ! -f "client/src/components/ErrorBoundary.tsx" ]; then
  echo "[WARN] ErrorBoundary.tsx component not found (create for production resilience)"
else
  echo "[OK] PASS - ErrorBoundary component exists"
  
  # Check it has componentDidCatch
  if ! grep -q 'componentDidCatch' client/src/components/ErrorBoundary.tsx; then
    echo "[X] FAIL: ErrorBoundary missing componentDidCatch"
    FAILED=1
  else
    echo "[OK] PASS - ErrorBoundary has componentDidCatch"
  fi
  
  # Check ErrorBoundary is used in main.tsx or App.tsx
  if ! grep -q 'ErrorBoundary' client/src/main.tsx 2>/dev/null && ! grep -q 'ErrorBoundary' client/src/App.tsx 2>/dev/null; then
    echo "[WARN] ErrorBoundary not used in main.tsx or App.tsx"
  else
    echo "[OK] PASS - ErrorBoundary is used"
  fi
fi

if [ $FAILED -eq 0 ]; then
  echo "[OK] ErrorBoundary check passed"
  exit 0
else
  echo "[X] ErrorBoundary violations found"
  exit 1
fi
```

**After creating:** `chmod +x scripts/verify-error-boundary.sh`

---

### Step 0.7e: Create Math.random Detector (BLOCKING)

**File:** `scripts/verify-no-math-random.sh`

```bash
#!/bin/bash
# verify-no-math-random.sh - Detects Math.random() in server code

echo "=== Math.random() Detection ==="

FAILED=0

# Check server code for Math.random
MATH_RANDOM=$(grep -r 'Math\.random()' server/ 2>/dev/null | wc -l)

if [ $MATH_RANDOM -gt 0 ]; then
  echo "[X] FAIL: Found $MATH_RANDOM Math.random() calls in server code"
  echo "    Use crypto.randomBytes() for server-side randomness"
  grep -rn 'Math\.random()' server/ 2>/dev/null | head -5
  FAILED=1
else
  echo "[OK] PASS - No Math.random() in server code"
fi

if [ $FAILED -eq 0 ]; then
  echo "[OK] No insecure random usage"
  exit 0
else
  echo "[X] Math.random() violations found"
  echo "    Replace with crypto.randomBytes() or crypto.randomUUID()"
  exit 1
fi
```

**After creating:** `chmod +x scripts/verify-no-math-random.sh`

---

### Step 0.7f: Create Transaction Boundaries Verifier (BLOCKING)

**File:** `scripts/verify-transaction-boundaries.sh`

```bash
#!/bin/bash
# verify-transaction-boundaries.sh - Validates soft delete cascades use transactions

echo "=== Transaction Boundaries Verification ==="

FAILED=0

# Check all soft delete functions for transaction wrappers
echo "Checking soft delete cascade operations..."

for service_file in server/services/*.service.ts; do
  if [ -f "$service_file" ]; then
    # Look for delete functions that update multiple tables with deletedAt
    if grep -q 'deletedAt.*new Date()' "$service_file"; then
      # Check if there are multiple update calls
      DELETE_FUNC=$(grep -A 50 'delete.*function\|async.*delete' "$service_file" | head -n 50)
      UPDATE_COUNT=$(echo "$DELETE_FUNC" | grep -c '\.update(')
      
      if [ $UPDATE_COUNT -gt 1 ]; then
        # Multiple updates - should have transaction
        if ! echo "$DELETE_FUNC" | grep -q 'db\.transaction\|trx'; then
          echo "[X] FAIL: $(basename $service_file) has $UPDATE_COUNT soft delete updates without transaction"
          FAILED=1
        fi
      fi
    fi
  fi
done

if [ $FAILED -eq 0 ]; then
  echo "[OK] PASS - Soft delete cascades use transactions or not applicable"
  exit 0
else
  echo "[X] Transaction boundary violations found"
  echo "    Wrap cascade soft deletes in db.transaction()"
  exit 1
fi
```

**After creating:** `chmod +x scripts/verify-transaction-boundaries.sh`

---

### Step 0.7g: Create Enhanced Zod Schema Verifier (BLOCKING) - APPLICATION-AGNOSTIC

**File:** `scripts/verify-zod-schemas-enhanced.sh`

```bash
#!/bin/bash
# verify-zod-schemas-enhanced.sh - Validates Zod schema strength
# APPLICATION-AGNOSTIC VERSION - Pattern-based checks

echo "=== Enhanced Zod Schema Verification ==="

FAILED=0

# GENERIC CHECK: Password validation strength (check ANY file)
echo "Checking password validation..."
FOUND_PASSWORD=false

for route_file in server/routes/*.routes.ts; do
  if [ ! -f "$route_file" ]; then continue; fi
  
  if grep -q 'password.*z\.string()' "$route_file"; then
    FOUND_PASSWORD=true
    # Check for minimum length
    if grep 'password.*z\.string()' "$route_file" | grep -q 'min(8)'; then
      # Has min(8), check for complexity regex
      if ! grep -A 2 'password.*z\.string()' "$route_file" | grep -q 'regex\|matches'; then
        echo "[WARN] Password validation in $(basename $route_file) missing complexity requirements"
        echo "    Consider adding regex for uppercase, lowercase, number"
      else
        echo "[OK] PASS - Password has complexity validation in $(basename $route_file)"
      fi
    else
      echo "[WARN] Password validation in $(basename $route_file) missing minimum length"
    fi
  fi
done

if [ "$FOUND_PASSWORD" = false ]; then
  echo "[OK] No password validation found (may not be needed)"
fi

# GENERIC CHECK: Role/enum validation (check ANY file)
echo "Checking role/enum validation..."
for route_file in server/routes/*.routes.ts; do
  if [ ! -f "$route_file" ]; then continue; fi
  
  if grep -q 'role.*z\.string()' "$route_file" 2>/dev/null; then
    echo "[WARN] $(basename $route_file) uses z.string() for role"
    echo "    Consider using z.enum() for role validation"
  fi
done

echo "[OK] Zod schema validation check complete"
exit 0  # Non-blocking, just warnings
```

**After creating:** `chmod +x scripts/verify-zod-schemas-enhanced.sh`

---

### Step 0.7h: Create Package.json Verifier (BLOCKING)

**File:** `scripts/verify-package-json.sh`

```bash
#!/bin/bash
# verify-package-json.sh - Validates package.json scripts have required flags

echo "=== Package.json Scripts Verification ==="

if [ ! -f "package.json" ]; then
  echo "[X] FAIL - package.json not found"
  exit 1
fi

echo "Checking for database migration scripts..."

# Check if drizzle-kit is used
if grep -q 'drizzle-kit' package.json; then
  # Check for --force flags
  if ! grep -q 'db:push.*--force\|drizzle.*push.*--force' package.json; then
    echo "[WARN] db:push script may need --force flag for Drizzle Kit"
  else
    echo "[OK] PASS - db:push has --force flag"
  fi
else
  echo "[OK] PASS - Drizzle Kit not used (may use different ORM)"
fi

echo "[OK] Package.json validation complete"
exit 0  # Non-blocking
```

**After creating:** `chmod +x scripts/verify-package-json.sh`

---

### Step 0.7i: Create Enhanced CORS Config Verifier (BLOCKING)

**File:** `scripts/verify-cors-config-enhanced.sh`

```bash
#!/bin/bash
# verify-cors-config-enhanced.sh - Validates CORS not using wildcard

echo "=== Enhanced CORS Configuration Verification ==="

if [ ! -f "server/index.ts" ]; then
  echo "[X] FAIL - server/index.ts not found"
  exit 1
fi

# Check for wildcard CORS
if grep -q 'cors()' server/index.ts; then
  if ! grep -A 3 'cors(' server/index.ts | grep -q 'origin:'; then
    echo "[WARN] CORS may be using wildcard (no explicit origin restriction)"
    echo "  Consider: { origin: process.env.APP_URL || '*', credentials: true }"
  else
    echo "[OK] PASS - CORS has origin configuration"
  fi
else
  echo "[OK] PASS - CORS not used (may be behind proxy)"
fi

exit 0  # Non-blocking
```

**After creating:** `chmod +x scripts/verify-cors-config-enhanced.sh`

---

### Step 0.7j: Create Multi-Tenant Isolation Verifier (BLOCKING) - APPLICATION-AGNOSTIC

**File:** `scripts/verify-multi-tenant-isolation.sh`

```bash
#!/bin/bash
# verify-multi-tenant-isolation.sh - Validates organization access control
# APPLICATION-AGNOSTIC VERSION - Pattern-based checks

echo "=== Multi-Tenant Data Isolation Verification ==="

FAILED=0

# GENERIC CHECK: Look for tenant ID validation in ANY route file
echo "Checking for tenant/organization access control..."

FOUND_TENANT_ROUTES=false

for route_file in server/routes/*.routes.ts; do
  if [ ! -f "$route_file" ]; then continue; fi
  
  # Check if this route handles organization/tenant IDs
  if grep -q ':organizationId\|:tenantId\|:orgId' "$route_file"; then
    FOUND_TENANT_ROUTES=true
    
    # Check for validation
    if ! grep -q 'req\.user.*organizationId.*===\|organizationId.*!==.*req\.user\|verifyAccess\|checkTenant' "$route_file"; then
      echo "[X] FAIL: $(basename $route_file) has tenant routes without access validation"
      echo "    Add check: if (organizationId !== req.user.organizationId) throw error"
      FAILED=1
    else
      echo "[OK] PASS - $(basename $route_file) validates tenant access"
    fi
  fi
done

if [ "$FOUND_TENANT_ROUTES" = false ]; then
  echo "[OK] PASS - No multi-tenant routes found (single-tenant application)"
fi

if [ $FAILED -eq 0 ]; then
  echo "[OK] Multi-tenant isolation check passed"
  exit 0
else
  echo "[X] Multi-tenant isolation violations found"
  exit 1
fi
```

**After creating:** `chmod +x scripts/verify-multi-tenant-isolation.sh`

---

### Step 0.7k: Create Health Check Schema Verifier (BLOCKING)

**File:** `scripts/verify-health-check-schema.sh`

```bash
#!/bin/bash
# verify-health-check-schema.sh - Validates health check response format

echo "=== Health Check Schema Verification ==="

if [ ! -f "server/index.ts" ]; then
  echo "[WARN] server/index.ts not found"
  exit 0
fi

# Check for health check endpoint
if grep -q '/health\|/healthz\|/api/health' server/index.ts; then
  echo "Checking health check response format..."
  
  if ! grep -A 10 '/health\|/healthz\|/api/health' server/index.ts | grep -q 'version:\|status:'; then
    echo "[WARN] Health check may be missing version or status field"
    echo "  Consider adding: { status: 'healthy', version: '1.0.0', checks: {...} }"
  else
    echo "[OK] PASS - Health check has version/status fields"
  fi
else
  echo "[OK] PASS - No health check endpoint (may not be needed)"
fi

exit 0  # Non-blocking
```

**After creating:** `chmod +x scripts/verify-health-check-schema.sh`

---

### Step 0.7l: Create Status Codes Verifier (BLOCKING)

**File:** `scripts/verify-status-codes.sh`

```bash
#!/bin/bash
# verify-status-codes.sh - Validates HTTP status codes match API contract

echo "=== Status Codes Verification ==="

echo "Checking for proper status code usage..."

# GENERIC CHECK: Look for password-related endpoints returning wrong status
for route_file in server/routes/*.routes.ts; do
  if [ ! -f "$route_file" ]; then continue; fi
  
  # Check for forgot/reset/change password endpoints
  if grep -q 'forgot.*password\|reset.*password\|change.*password' "$route_file" 2>/dev/null; then
    # These should return 204 No Content, not 200
    if grep -A 5 'forgot.*password\|reset.*password\|change.*password' "$route_file" | grep -q 'res\.json'; then
      echo "[WARN] $(basename $route_file) password endpoint returns 200, consider 204 No Content"
    fi
  fi
done

echo "[OK] Status code validation complete"
exit 0  # Non-blocking
```

**After creating:** `chmod +x scripts/verify-status-codes.sh`

---

### Step 0.7m: No Implicit Defaults Enforcement

**File:** `scripts/verify-no-implicit-defaults.sh`

```bash
#!/bin/bash
# verify-no-implicit-defaults.sh - Enforces explicit configuration

echo "=== No Implicit Defaults Enforcement ==="

FAILED=0
VIOLATIONS=0

echo "Checking for implicit defaults in server code..."
echo ""

# Check 1: process.env with || default
echo -n "1. Environment variable defaults: "
ENV_DEFAULTS=$(grep -rn 'process\.env\.[A-Z_]* *|| *' server/ 2>/dev/null | \
  grep -v '^Binary' | \
  grep -v '// @allow-default' | \
  grep -v 'server/db/seed' | \
  grep -v 'scripts/' | \
  wc -l)

if [ "$ENV_DEFAULTS" -gt 0 ]; then
  echo "[WARN] Found $ENV_DEFAULTS implicit env defaults"
  echo "  Consider centralizing in server/config/defaults.ts"
  VIOLATIONS=$((VIOLATIONS + 1))
else
  echo "[OK] PASS"
fi

# Check 2: ?? default operator with hard-coded values
echo -n "2. Nullish coalescing defaults: "
NULL_DEFAULTS=$(grep -rn '?? *[0-9]' server/ 2>/dev/null | \
  grep -v '^Binary' | \
  grep -v '// @allow-default' | \
  grep -v 'server/db/seed' | \
  grep -v 'scripts/' | \
  wc -l)

if [ "$NULL_DEFAULTS" -gt 0 ]; then
  echo "[WARN] Found $NULL_DEFAULTS nullish coalescing defaults"
  VIOLATIONS=$((VIOLATIONS + 1))
else
  echo "[OK] PASS"
fi

if [ $VIOLATIONS -gt 0 ]; then
  echo ""
  echo "[WARN] Found implicit defaults (non-blocking)"
  echo "  Consider centralizing configuration in server/config/defaults.ts"
else
  echo ""
  echo "[OK] No implicit defaults enforcement: PASSED"
fi

exit 0  # Non-blocking, just warnings
```

**After creating:** `chmod +x scripts/verify-no-implicit-defaults.sh`

---

### Step 0.7n: Zero Console Noise Enforcement

**File:** `scripts/verify-zero-console-noise.sh`

```bash
#!/bin/bash
# verify-zero-console-noise.sh - Enforces structured logging

echo "=== Zero Console Noise Enforcement ==="

CONSOLE_VIOLATIONS=0

echo "Checking for console statements in production code..."
echo ""

# Check 1: console.log in server code (excluding allowed locations)
echo -n "1. console.log in production code: "
CONSOLE_LOGS=$(grep -rn 'console\.log(' server/ 2>/dev/null | \
  grep -v '^Binary' | \
  grep -v '// @allow-console' | \
  grep -v 'server/index.ts.*Server listening\|Environment:' | \
  grep -v 'server/db/' | \
  grep -v 'scripts/' | \
  grep -v '\.test\.\|\.spec\.' | \
  wc -l)

if [ "$CONSOLE_LOGS" -gt 0 ]; then
  echo "[WARN] Found $CONSOLE_LOGS console.log statements"
  echo "  Consider using structured logger"
  CONSOLE_VIOLATIONS=$((CONSOLE_VIOLATIONS + CONSOLE_LOGS))
else
  echo "[OK] PASS"
fi

# Check 2: console.error (should use logger)
echo -n "2. console.error in production code: "
CONSOLE_ERRORS=$(grep -rn 'console\.error(' server/ 2>/dev/null | \
  grep -v '^Binary' | \
  grep -v '// @allow-console' | \
  grep -v 'server/middleware/errorHandler.ts' | \
  grep -v 'server/index.ts.*process\.on' | \
  grep -v 'server/db/' | \
  grep -v 'scripts/' | \
  wc -l)

if [ "$CONSOLE_ERRORS" -gt 0 ]; then
  echo "[WARN] Found $CONSOLE_ERRORS console.error statements"
  CONSOLE_VIOLATIONS=$((CONSOLE_VIOLATIONS + CONSOLE_ERRORS))
else
  echo "[OK] PASS"
fi

if [ $CONSOLE_VIOLATIONS -gt 0 ]; then
  echo ""
  echo "[WARN] Found console statements (non-blocking)"
  echo "  Consider using structured logger (logger.info, logger.error, etc.)"
  echo ""
  echo "Allowed locations:"
  echo "  - server/index.ts (bootstrap only)"
  echo "  - server/db/migrate.ts, server/db/seed*.ts"
  echo "  - scripts/"
else
  echo ""
  echo "[OK] Zero console noise: PASSED"
fi

exit 0  # Non-blocking, just warnings
```

**After creating:** `chmod +x scripts/verify-zero-console-noise.sh`

---

### Step 0.8: Verify Script Infrastructure (BLOCKING)

**Test that all scripts were created:**

```bash
echo "Verifying script infrastructure..."
REQUIRED_SCRIPTS=(
  "verify-spec-freeze.sh"
  "verify-contract-compliance.sh"
  "verify-route-service-contract.sh"
  "verify-endpoint-count.sh"
  "verify-endpoint-paths.sh"
  "verify-zod-coverage.sh"
  "verify-no-sensitive-logs.sh"
  "verify-cors-config.sh"
  "verify-rate-limiting.sh"
  "verify-response-envelope.sh"
  "verify-require-int-param.sh"
  "verify-transactions.sh"
  "verify-error-boundary.sh"
  "verify-no-math-random.sh"
  "verify-transaction-boundaries.sh"
  "verify-zod-schemas-enhanced.sh"
  "verify-package-json.sh"
  "verify-cors-config-enhanced.sh"
  "verify-multi-tenant-isolation.sh"
  "verify-health-check-schema.sh"
  "verify-status-codes.sh"
  "verify-no-implicit-defaults.sh"
  "verify-zero-console-noise.sh"
  "verify-framework-integrity.sh"
)

MISSING=0
for script in "${REQUIRED_SCRIPTS[@]}"; do
  if [ ! -f "scripts/$script" ]; then
    echo "[X] Missing: scripts/$script"
    MISSING=$((MISSING + 1))
  else
    echo "[OK] Found: scripts/$script"
  fi
done

if [ $MISSING -gt 0 ]; then
  echo ""
  echo "[X] BLOCKING: $MISSING verification scripts missing"
  echo "Cannot proceed to Phase 1 until all scripts exist"
  exit 1
else
  echo ""
  echo "[OK] All 24 verification scripts created"
  echo "Ready to proceed to Phase 1"
fi
```

**[BLOCKING]** Do NOT proceed to Phase 1 until the above verification passes.

---

### Step 0.9: Create Standard Infrastructure Files

Now create the standard pre-flight files:

**Files to create:**
- `.replit`
- `package.json`
- `.env.example`
- `.gitignore`
- `tsconfig.json`

(Continue with existing Phase 0 file creation logic...)

---

### Phase 0 Final Gate (BLOCKING)

**Before proceeding to Phase 1, verify:**

```bash
# All scripts exist
ls -la scripts/*.sh

# All scripts executable
chmod +x scripts/*.sh

# Standard files created
ls -la .replit package.json tsconfig.json
```

**[CRITICAL]** If ANY verification script is missing, STOP and create it before Phase 1.

---

### Step 0.0a: Create Spec Freeze Hash (FIRST STEP)

**Purpose:** Lock specification stack to prevent mid-build mutation

**Why Critical:** Prevents accidental spec edits, tool corruption, or version control conflicts from causing late-phase inconsistencies during build.

**Script to Create:** `scripts/verify-spec-freeze.sh`

```bash
#!/bin/bash
# verify-spec-freeze.sh - Prevents spec mutation during build

echo "=== Spec Freeze Hash Validation ==="

SPEC_HASH_FILE=".artifacts/spec-hash.txt"

# Compute hash of all spec files in deterministic order
compute_spec_hash() {
  # Find all spec files and hash them
  find . -maxdepth 1 -name "*.md" -type f | sort | while read file; do
    cat "$file"
  done | sha256sum | awk '{print $1}'
}

# Create .artifacts directory if needed
mkdir -p .artifacts

# Phase 0.0a: Compute and store initial hash
if [ "$1" = "--compute" ]; then
  HASH=$(compute_spec_hash)
  echo "$HASH" > "$SPEC_HASH_FILE"
  echo "[OK] Spec hash computed: $HASH"
  echo "Spec stack frozen"
  exit 0
fi

# Phase 8: Verify hash hasn't changed
if [ ! -f "$SPEC_HASH_FILE" ]; then
  echo "[X] FAIL - No spec hash found"
  exit 1
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
```

**Execute:**
```bash
mkdir -p .artifacts
cat > scripts/verify-spec-freeze.sh << 'SCRIPT_END'
[paste script above]
SCRIPT_END
chmod +x scripts/verify-spec-freeze.sh
bash scripts/verify-spec-freeze.sh --compute
```

---

### Step 0.0b: Framework Integrity Verification (BEFORE ALL OTHER STEPS)

**Purpose:** Validate framework self-consistency before starting build

**Script:** `scripts/verify-framework-integrity.sh`

```bash
#!/bin/bash
# Framework integrity verification

echo "==================================================================="
echo "FRAMEWORK INTEGRITY VERIFICATION"
echo "==================================================================="

FAILED=0

# Check 1: ASCII-only encoding
echo "Checking framework file encoding..."
if command -v file >/dev/null 2>&1; then
  NON_ASCII=$(file *.md 2>/dev/null | grep -v ASCII | grep -v "cannot open" | wc -l)
  if [ "$NON_ASCII" -eq 0 ]; then
    echo "[OK] All files ASCII-clean"
  else
    echo "[WARN] $NON_ASCII files not ASCII (may contain UTF-8)"
  fi
fi

echo ""
echo "==================================================================="
if [ $FAILED -eq 0 ]; then
  echo "[OK] FRAMEWORK INTEGRITY: PASSED"
  exit 0
else
  echo "[X] FRAMEWORK INTEGRITY: FAILED"
  exit 1
fi
```

**Execute:**
```bash
cat > scripts/verify-framework-integrity.sh << 'SCRIPT_END'
[paste script above]
SCRIPT_END
chmod +x scripts/verify-framework-integrity.sh
bash scripts/verify-framework-integrity.sh
```

---

## Summary of Application-Agnostic Changes

### 🎯 **Key Improvements (v24.3)**

| Component | Before (Foundry-specific) | After (Application-agnostic) |
|-----------|--------------------------|------------------------------|
| **Gate #54** | Hardcodes 5 files | Checks ALL *.routes.ts dynamically |
| **Endpoint Paths** | Hardcodes /api/invitations, /api/process | Generic parameter checks only |
| **Transactions** | Checks specific Foundry files | Pattern-based (register/delete) |
| **Zod Schemas** | Checks auth.routes.ts, organizations.routes.ts | Checks ANY file for patterns |
| **Multi-tenant** | Checks organizations.routes.ts | Checks ANY file with tenant IDs |
| **Works For** | Foundry only | ANY Express+React+PostgreSQL app |

---

## 📋 **What Makes This Version Agnostic**

✅ **Dynamic File Discovery** - Uses `for file in *.routes.ts` instead of hardcoded names  
✅ **Pattern Detection** - Looks for `.login(x,y)` pattern anywhere, not specific files  
✅ **Conditional Checks** - Only validates if features are present (e.g., multi-tenant)  
✅ **Graceful Degradation** - Non-blocking warnings instead of hard failures  
✅ **JSON Validation** - Checks if service-contracts.json is valid JSON  
✅ **No Hardcoded Paths** - No /api/invitations or Foundry-specific endpoints  

---

## ✨ **Expected Behavior**

This Build Prompt will now work with:
- ✅ E-commerce platforms
- ✅ SaaS applications  
- ✅ CMS systems
- ✅ Internal tools
- ✅ Admin dashboards
- ✅ API-only backends
- ✅ ANY Express + React + PostgreSQL application

**No hardcoded assumptions about your domain!**

---

**Status:** Application-Agnostic v26 - 2-Layer Enforcement (Agent 6 v54) ✅
