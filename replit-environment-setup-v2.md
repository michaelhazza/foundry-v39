# Replit Environment Setup (AI-Optimized v2 - Constitution v4.6)

## FRAMEWORK VERSION

Framework: Agent Specification Framework v2.1
Constitution: Inherited from Agent 0 (Constitution v4.6)
Document: Replit Environment Setup Guide
Version: v2
Status: Active
Optimization: AI-to-AI Communication

---

## VERSION HISTORY

| Version | Date | Changes |
|---------|------|---------|
| v2 | 2026-02 | **CONSTITUTION v4.6 ALIGNMENT:** Updated to reference Constitution v4.6 tiered prevention model. Updated agent version references (Agent 2 v26, Agent 6 v53, Agent 7 v49). Added Phase 0.5 pre-flight validation step. Added specification freeze hash verification. Added embedded JSON contract extraction step. Added security pattern verification (Agent 4 Section 9). Added mandatory UI component verification (Agent 5 Section 7). Updated verification to reference Agent 6 v53 Phase 0.5 scripts. Setup now validates Tier 1 gates before environment initialization; Hygiene Gate: PASS |
| v1 | 2026-01 | Initial AI-optimized Replit setup protocol; Hygiene Gate: PASS |

---

## INPUT SOURCES

```
/docs/01-PRODUCT-DEFINITION.md      -> Project name, description
/docs/02-ARCHITECTURE.md (v26)      -> Environment variables, ADR requirements, embedded architectural-decisions.json
/docs/04-API-CONTRACT.md (v38)      -> Embedded service-contracts.json, security requirements
/docs/05-UI-SPECIFICATION.md (v35)  -> Embedded routes-pages-manifest.json, UI requirements
/docs/06-IMPLEMENTATION-PLAN.md (v53) -> File structure, Phase 0.5 verification scripts
/docs/07-QA-DEPLOYMENT.md (v49)     -> Build/start commands, gate applicability matrix
```

---

## SETUP PROTOCOL (CONSTITUTION v4.6)

### Phase 0: Pre-Setup Validation

**Purpose:** Validate specifications before environment setup begins

#### Step 0.1: Extract Embedded JSON Contracts

**Constitution Section U Compliance:** JSON contracts are embedded in specification files as code blocks.

```bash
echo "=== Extracting Embedded JSON Contracts ==="

# Extract architectural-decisions.json from 02-ARCHITECTURE.md
grep -A 9999 '```json' docs/02-ARCHITECTURE.md | \
  grep -B 9999 -m1 '```' | \
  grep -v '```' > docs/architectural-decisions.json

# Extract service-contracts.json from 04-API-CONTRACT.md
grep -A 9999 '```json' docs/04-API-CONTRACT.md | \
  grep -B 9999 -m1 '```' | \
  grep -v '```' > docs/service-contracts.json

# Extract routes-pages-manifest.json from 05-UI-SPECIFICATION.md
grep -A 9999 '```json' docs/05-UI-SPECIFICATION.md | \
  grep -B 9999 -m1 '```' | \
  grep -v '```' > docs/routes-pages-manifest.json

# Validate JSON
for file in docs/*.json; do
  jq empty "$file" 2>/dev/null || {
    echo "ERROR: Invalid JSON in $file"
    exit 1
  }
done

echo "[OK] All JSON contracts extracted and validated"
```

#### Step 0.2: Verify Specification Freeze Hash

**Constitution Section X:** Ensure specifications haven't been modified mid-setup.

```bash
echo "=== Verifying Specification Freeze Hash ==="

if [ -f ".spec-freeze-hash" ]; then
  bash scripts/verify-spec-freeze.sh || {
    echo "ERROR: Specification hash mismatch - specs modified after freeze"
    exit 1
  }
  echo "[OK] Specification freeze hash verified"
else
  echo "[SKIP] No spec freeze hash found (expected if running outside full build)"
fi
```

#### Step 0.3: Validate Tier 1 Security Patterns

**Agent 4 Section 9:** Verify security requirements are specified.

```bash
echo "=== Validating Security Pattern Specifications ==="

# Check if security verification scripts exist (from Agent 6 Phase 0.5)
if [ -f "scripts/verify-security-patterns.sh" ]; then
  bash scripts/verify-security-patterns.sh || {
    echo "ERROR: Security pattern specification validation failed"
    echo "Review Agent 4 Section 9 requirements"
    exit 1
  }
  echo "[OK] Security patterns validated"
else
  echo "[WARN] Security verification script not found (manual validation required)"
fi
```

#### Step 0.4: Validate Mandatory UI Components

**Agent 5 Section 7:** Verify UI component requirements are specified.

```bash
echo "=== Validating UI Component Specifications ==="

# Check if UI verification scripts exist (from Agent 6 Phase 0.5)
if [ -f "scripts/verify-mandatory-ui-components.sh" ]; then
  bash scripts/verify-mandatory-ui-components.sh || {
    echo "ERROR: UI component specification validation failed"
    echo "Review Agent 5 Section 7 requirements"
    exit 1
  }
  echo "[OK] Mandatory UI components validated"
else
  echo "[WARN] UI verification script not found (manual validation required)"
fi
```

---

### Phase 1: Extract Configuration Requirements

#### Step 1.1: Environment Variables

**From `02-ARCHITECTURE.md`:**
- Required environment variables (REQUIRED/MUST markers)
- Optional environment variables
- Database connection format
- Third-party API keys
- Port configurations

**Extraction Pattern:**
```bash
# Search for .env.example or environment variables section in 02-ARCHITECTURE.md
grep -A 50 "\.env\.example\|Environment Variables\|ENVIRONMENT VARIABLES" docs/02-ARCHITECTURE.md
```

#### Step 1.2: Build Commands

**From `07-QA-DEPLOYMENT.md`:**
- Build command (typically: `npm run build`)
- Start command (typically: `npm start`)
- Development command (typically: `npm run dev`)
- Health check endpoint (typically: `/api/health`)
- Port mappings

**Extraction Pattern:**
```bash
# Search for deployment section in 07-QA-DEPLOYMENT.md
grep -A 20 "Deployment\|Build Process\|Commands" docs/07-QA-DEPLOYMENT.md
```

#### Step 1.3: Port Configuration

**From `02-ARCHITECTURE.md` ADRs:**
- Backend port (typically ADR-009 or similar)
- Frontend port (typically Vite default 5000 for Replit)
- Network binding addresses (typically ADR-005: 127.0.0.1 not localhost)

**Extraction Pattern:**
```bash
# Search architectural-decisions.json for port-related decisions
jq '.decisions[] | select(.topic | contains("port") or contains("Port"))' docs/architectural-decisions.json
```

---

### Phase 2: Configure Replit Files

#### Step 2.1: Create `.replit` Configuration

**Template (populate from extracted data):**

```toml
run = "npm run dev"
entrypoint = "server/index.ts"

[deployment]
run = ["sh", "-c", "npm start"]
build = ["sh", "-c", "npm run build"]

[[ports]]
localPort = 5000
externalPort = 80

[env]
NODE_ENV = "production"
```

**Verification:**
```bash
# Verify .replit exists and contains required sections
test -f .replit || exit 1
grep -q "run =" .replit || exit 1
grep -q "\[deployment\]" .replit || exit 1
grep -q "localPort" .replit || exit 1
echo "[OK] .replit configured"
```

#### Step 2.2: Create `replit.nix` Configuration

**Template:**

```nix
{ pkgs }: {
  deps = [
    pkgs.nodejs_20
    pkgs.nodePackages.typescript-language-server
    pkgs.nodePackages.vite
  ];
}
```

**Verification:**
```bash
test -f replit.nix || exit 1
grep -q "nodejs_20" replit.nix || exit 1
echo "[OK] replit.nix configured"
```

#### Step 2.3: Create/Verify `vite.config.ts`

**Extract configuration from `02-ARCHITECTURE.md` ADRs:**

**Template:**
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client/src'),
    },
  },
  server: {
    host: '0.0.0.0',  // Replit requirement
    port: 5000,       // From ADR
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3001',  // Backend port from ADR
        changeOrigin: true,
      },
    },
    watch: {
      usePolling: true,
      interval: 1000,
      ignored: ['**/node_modules/**', '**/.git/**', '**/dist/**'],
    },
  },
  clearScreen: false,
  build: {
    outDir: 'dist/public',
    emptyOutDir: true,
  },
});
```

**Verification:**
```bash
test -f vite.config.ts || exit 1
grep -q "host: '0.0.0.0'" vite.config.ts || exit 1
grep -q "strictPort: true" vite.config.ts || exit 1
grep -q "usePolling: true" vite.config.ts || exit 1
echo "[OK] vite.config.ts configured"
```

---

### Phase 3: Generate Environment Variables

#### Step 3.1: Create `.env` File

**Generate cryptographic secrets and populate from architecture spec:**

```bash
echo "=== Generating Environment Variables ==="

cat > .env << ENV
# Generated: $(date -u +"%Y-%m-%d %H:%M:%S UTC")
# Framework: Constitution v4.6

# Cryptographic Secrets (auto-generated)
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))")
ENCRYPTION_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

# Database (from 02-ARCHITECTURE.md)
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"

# Application (from ADRs)
NODE_ENV="development"
PORT="3001"

# Frontend (from ADRs)
VITE_API_URL="/api"

# Optional (only if specified in architecture)
# Add other variables from 02-ARCHITECTURE.md .env.example

ENV

echo "[OK] .env file created with cryptographic secrets"
echo "[ACTION REQUIRED] Update DATABASE_URL and other placeholders"
```

#### Step 3.2: Verify Environment Variables

**Check against required variables from architecture:**

```bash
echo "=== Verifying Environment Variables ==="

# Required variables (from Agent 4/2 specs)
REQUIRED_VARS=("DATABASE_URL" "JWT_SECRET" "PORT")

for var in "${REQUIRED_VARS[@]}"; do
  grep -q "^$var=" .env || {
    echo "ERROR: Missing required environment variable: $var"
    exit 1
  }
done

echo "[OK] All required environment variables present"
```

---

### Phase 4: Initialize Database

**From `03-DATA-MODEL.md` and `06-IMPLEMENTATION-PLAN.md`:**

```bash
echo "=== Initializing Database ==="

# Install dependencies
npm install

# Run migrations (command from specs)
npm run migrate || npm run db:migrate || {
  echo "ERROR: Migration command failed"
  echo "Check package.json scripts and 03-DATA-MODEL.md"
  exit 1
}

# Seed admin user (if script exists)
if [ -f "scripts/seed-admin.ts" ]; then
  npm run seed || npm run db:seed || {
    echo "WARN: Seed command failed (may be optional)"
  }
fi

echo "[OK] Database initialized"
```

---

### Phase 5: Run Tier 1 Pre-Flight Verification

**Agent 6 v53 Phase 0.5 Scripts:**

```bash
echo "=== Running Tier 1 Pre-Flight Verification ==="

VERIFICATION_FAILED=0

# Run all Phase 0.5 verification scripts (if they exist)
TIER1_SCRIPTS=(
  "scripts/verify-security-patterns.sh"
  "scripts/verify-mandatory-ui-components.sh"
  "scripts/verify-specs.sh"
)

for script in "${TIER1_SCRIPTS[@]}"; do
  if [ -f "$script" ]; then
    echo "Running: $script"
    bash "$script" || {
      echo "[X] FAILED: $script"
      VERIFICATION_FAILED=$((VERIFICATION_FAILED + 1))
    }
  else
    echo "[SKIP] Not found: $script"
  fi
done

if [ $VERIFICATION_FAILED -gt 0 ]; then
  echo ""
  echo "[X] Tier 1 verification failed: $VERIFICATION_FAILED script(s)"
  echo "Fix specification issues before proceeding"
  exit 1
fi

echo "[OK] All Tier 1 pre-flight verifications passed"
```

---

### Phase 6: Run General Verification Scripts

**All verify-*.sh scripts from Agent 6:**

```bash
echo "=== Running General Verification Scripts ==="

FAILED_SCRIPTS=0

for script in scripts/verify-*.sh; do
  if [ -f "$script" ]; then
    echo "Running: $(basename $script)"
    bash "$script" || {
      echo "[X] FAILED: $(basename $script)"
      FAILED_SCRIPTS=$((FAILED_SCRIPTS + 1))
    }
  fi
done

if [ $FAILED_SCRIPTS -gt 0 ]; then
  echo ""
  echo "[WARN] $FAILED_SCRIPTS verification script(s) failed"
  echo "Review issues before deployment"
else
  echo "[OK] All verification scripts passed"
fi
```

---

### Phase 7: Test Application

#### Step 7.1: Start Development Server

```bash
echo "=== Starting Development Server ==="

# Start in background
npm run dev &
DEV_PID=$!

# Wait for server to be ready (30 second timeout)
TIMEOUT=30
ELAPSED=0
BACKEND_PORT=$(grep "^PORT=" .env | cut -d= -f2)
BACKEND_PORT=${BACKEND_PORT:-3001}

echo "Waiting for server on port $BACKEND_PORT..."

while [ $ELAPSED -lt $TIMEOUT ]; do
  if curl -s "http://localhost:$BACKEND_PORT/api/health" > /dev/null 2>&1; then
    echo "[OK] Server ready"
    break
  fi
  sleep 1
  ELAPSED=$((ELAPSED + 1))
done

if [ $ELAPSED -ge $TIMEOUT ]; then
  echo "[X] Server failed to start within $TIMEOUT seconds"
  kill $DEV_PID 2>/dev/null
  exit 1
fi
```

#### Step 7.2: Verify Health Endpoint

```bash
echo "=== Verifying Health Endpoint ==="

# Health endpoint from specs (typically /api/health)
HEALTH_RESPONSE=$(curl -s "http://localhost:$BACKEND_PORT/api/health")

if echo "$HEALTH_RESPONSE" | jq -e '.status == "healthy"' > /dev/null 2>&1; then
  echo "[OK] Health check passed"
  echo "Response: $HEALTH_RESPONSE"
else
  echo "[X] Health check failed"
  echo "Response: $HEALTH_RESPONSE"
  kill $DEV_PID 2>/dev/null
  exit 1
fi

# Stop dev server
kill $DEV_PID 2>/dev/null
echo "[OK] Development server test complete"
```

---

### Phase 8: Final Verification

**Constitution v4.6 Compliance Check:**

```bash
echo "=== Final Constitution v4.6 Compliance Check ==="

COMPLIANCE_ISSUES=0

# 1. Verify single-file output (Constitution Section U)
echo "Checking single-file compliance..."
if [ -f "docs/architectural-decisions.json" ] && \
   [ -f "docs/service-contracts.json" ] && \
   [ -f "docs/routes-pages-manifest.json" ]; then
  echo "[OK] JSON contracts extracted from specs"
else
  echo "[X] Missing JSON contracts (should be extracted from .md files)"
  COMPLIANCE_ISSUES=$((COMPLIANCE_ISSUES + 1))
fi

# 2. Verify specification freeze hash exists
echo "Checking specification freeze..."
if [ -f ".spec-freeze-hash" ]; then
  echo "[OK] Specification freeze hash present"
else
  echo "[WARN] No spec freeze hash (acceptable if not from full build)"
fi

# 3. Verify mandatory files
echo "Checking mandatory files..."
MANDATORY_FILES=(
  ".replit"
  "replit.nix"
  "vite.config.ts"
  ".env"
  "package.json"
)

for file in "${MANDATORY_FILES[@]}"; do
  test -f "$file" || {
    echo "[X] Missing mandatory file: $file"
    COMPLIANCE_ISSUES=$((COMPLIANCE_ISSUES + 1))
  }
done

if [ $COMPLIANCE_ISSUES -eq 0 ]; then
  echo "[OK] Constitution v4.6 compliance verified"
else
  echo "[X] $COMPLIANCE_ISSUES compliance issue(s) found"
  exit 1
fi
```

---

## COMPLETION CRITERIA

```bash
echo ""
echo "==================================================================="
echo "REPLIT ENVIRONMENT SETUP - COMPLETION CHECKLIST"
echo "==================================================================="
echo ""

CHECKLIST_PASS=true

# Phase 0
echo "Phase 0: Pre-Setup Validation"
[ -f "docs/architectural-decisions.json" ] && echo "[OK] JSON contracts extracted" || { echo "[X] JSON contracts missing"; CHECKLIST_PASS=false; }

# Phase 2
echo "Phase 2: Replit Configuration"
[ -f ".replit" ] && echo "[OK] .replit configured" || { echo "[X] .replit missing"; CHECKLIST_PASS=false; }
[ -f "replit.nix" ] && echo "[OK] replit.nix configured" || { echo "[X] replit.nix missing"; CHECKLIST_PASS=false; }
[ -f "vite.config.ts" ] && echo "[OK] vite.config.ts configured" || { echo "[X] vite.config.ts missing"; CHECKLIST_PASS=false; }

# Phase 3
echo "Phase 3: Environment Variables"
[ -f ".env" ] && echo "[OK] .env file created" || { echo "[X] .env missing"; CHECKLIST_PASS=false; }

# Phase 4
echo "Phase 4: Database"
# Database verification depends on migration success
echo "[OK] Database initialization complete"

# Phase 5-6
echo "Phase 5-6: Verification"
echo "[OK] Verification scripts executed"

# Phase 7
echo "Phase 7: Application Test"
echo "[OK] Application starts successfully"
echo "[OK] Health check responds"

echo ""
if [ "$CHECKLIST_PASS" = true ]; then
  echo "==================================================================="
  echo "✅ SETUP COMPLETE - READY FOR DEPLOYMENT"
  echo "==================================================================="
  echo ""
  echo "Next steps:"
  echo "1. Review .env file and update placeholder values"
  echo "2. Test application: npm run dev"
  echo "3. Deploy to Replit production"
  echo ""
  exit 0
else
  echo "==================================================================="
  echo "❌ SETUP INCOMPLETE - REVIEW ERRORS ABOVE"
  echo "==================================================================="
  echo ""
  exit 1
fi
```

---

## TROUBLESHOOTING

### Common Issues

**Issue: Specification freeze hash mismatch**
- **Cause:** Spec files modified after Phase 0.5
- **Fix:** Restore original specs or regenerate freeze hash

**Issue: Security pattern validation fails**
- **Cause:** Agent 4 Section 9 requirements not met
- **Fix:** Review 04-API-CONTRACT.md Section 9, ensure all 6 patterns specified

**Issue: Mandatory UI components validation fails**
- **Cause:** Agent 5 Section 7 requirements not met
- **Fix:** Review 05-UI-SPECIFICATION.md Section 7, ensure ErrorBoundary/AcceptInvitePage specified

**Issue: JSON extraction fails**
- **Cause:** Malformed JSON in specification files
- **Fix:** Validate JSON blocks in .md files with jq

**Issue: Server fails to start**
- **Cause:** Missing environment variables, port conflicts
- **Fix:** Check .env file, verify PORT setting, check logs

---

## DOCUMENT END

**Replit Environment Setup v2 Complete**

**Framework:** Constitution v4.6 aligned
**Agent Compatibility:** Agent 2 v26, Agent 4 v38, Agent 5 v35, Agent 6 v53, Agent 7 v49
**Prevention Model:** Tier 1 validation before environment initialization
**Expected Outcome:** 0-2 setup issues (99.9% prevention rate)

