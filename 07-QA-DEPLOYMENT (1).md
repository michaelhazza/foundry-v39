# 07: QA & Deployment Specification
## Foundry - Data Preparation Platform

**Document ID:** 07-QA-DEPLOYMENT  
**Created:** 2026-02-03  
**Agent:** Agent 7 (QA & Deployment Specification v49)  
**Framework:** Agent Specification Framework v2.1  
**Constitution:** Inherited from Agent 0 v4.6  
**Status:** ACTIVE  
**Deployment Target:** Replit (Single Container, PostgreSQL via Neon)

---

## Project Overview

**Product:** Foundry - Multi-tenant SaaS platform that transforms raw business data into clean, de-identified, structured datasets ready for AI systems.

**Architecture:** Monolithic SPA + REST API
- Frontend: React 18 + Vite 5 + TailwindCSS + shadcn/ui
- Backend: Node.js 20 + Express 4 + TypeScript 5
- Database: PostgreSQL 14+ with Drizzle ORM
- Authentication: JWT with refresh tokens (15m access, 7d refresh)
- Deployment: Single container on Replit, port 5000

**Key Features:**
- Multi-tenant organization management
- File upload processing (CSV, Excel, JSON)
- Teamwork Desk API connector
- PII detection and de-identification
- Export to JSONL, Q&A pairs, JSON
- RBAC with Admin, Member, Viewer roles

---

## 1. Tiered Prevention Strategy

### 1.1 Quality Targets (Constitution v4.6)

Based on the Constitution Section W: Tiered Prevention Model, our quality targets are:

- **Tier 1 Issues:** 0 expected (prevented before code generation via Phase 0.5 gates)
- **Tier 2 Issues:** 0-2 expected (caught during progressive build validation)
- **Tier 3 Issues:** Edge cases only (advisory warnings, not blocking)
- **Total Expected:** 0-4 issues across all tiers (99.9% prevention rate)

### 1.2 Prevention Philosophy

Quality is achieved through **specification clarity**, not post-build auditing. The tiered approach ensures:
1. Critical security patterns are verified BEFORE code generation
2. Progressive validation catches issues during each build phase
3. Final validation identifies edge cases without blocking deployment

---

## 2. Applicable Gates by Tier

### 2.1 Tier 1: Pre-Flight Gates (Phase 0.5)

**Purpose:** Verify critical security and architectural patterns BEFORE code generation  
**Timing:** Run once during Phase 0.5 (2-3 minutes)  
**Failure Mode:** BLOCKING - build stops if any gate fails  
**Expected Result:** ALL PASS (0 failures)

---

#### Gate #1: Multi-Tenant Isolation

**Status:** ✅ APPLICABLE

**Classification:**
- **Tier:** 1 (Pre-Flight)
- **Priority:** CRITICAL-MANDATORY
- **Phase:** 0.5
- **Blocking:** true
- **Auto-Fix:** NO
- **Duration:** <30 seconds
- **Expected Failures:** 0%

**Rationale:**
Foundry is a multi-tenant SaaS platform. All tenant-scoped tables include `organizationId` foreign key:
- users (organizationId)
- projects (organizationId, ownerId)
- data_sources (organizationId, projectId)
- processing_jobs (organizationId, dataSourceId)
- schema_mappings (organizationId, projectId)
- deidentification_rules (organizationId, projectId)
- datasets (organizationId, projectId, processingJobId)

**Verification:**
- **Script:** `scripts/verify-security-patterns.sh` (Agent 4 Section 9.1)
- **Check:** All organization-scoped endpoints include `organizationId` parameter
- **Cross-Reference:** Agent 4 Section 9.1 (Multi-Tenant Isolation), Constitution Section W Tier 1 Pattern 1

**Expected Pattern:**
```typescript
// All organization-scoped queries MUST filter by organizationId
const projects = await db.select()
  .from(projectsTable)
  .where(and(
    eq(projectsTable.organizationId, user.organizationId),
    eq(projectsTable.id, projectId)
  ));
```

---

#### Gate #2: RBAC Enforcement

**Status:** ✅ APPLICABLE

**Classification:**
- **Tier:** 1 (Pre-Flight)
- **Priority:** CRITICAL-MANDATORY
- **Phase:** 0.5
- **Blocking:** true
- **Auto-Fix:** NO
- **Duration:** <30 seconds
- **Expected Failures:** 0%

**Rationale:**
Foundry implements role-based access control with three roles:
- **Admin:** Full organization management
- **Member:** Project creation and management
- **Viewer:** Read-only access

Admin operations (user management, organization settings) require role verification.

**Verification:**
- **Script:** `scripts/verify-security-patterns.sh` (Agent 4 Section 9.3)
- **Check:** `requireRole('admin')` middleware on admin-only endpoints
- **Cross-Reference:** Agent 4 Section 9.3 (RBAC Enforcement), Constitution Section W Tier 1 Pattern 2

**Expected Pattern:**
```typescript
// Admin-only endpoints MUST use requireRole middleware
router.patch('/api/organizations/:organizationId', 
  authenticate, 
  requireRole('admin'),
  updateOrganization
);
```

---

#### Gate #3: Rate Limiting

**Status:** ✅ APPLICABLE

**Classification:**
- **Tier:** 1 (Pre-Flight)
- **Priority:** CRITICAL-MANDATORY
- **Phase:** 0.5
- **Blocking:** true
- **Auto-Fix:** NO
- **Duration:** <30 seconds
- **Expected Failures:** 0%

**Rationale:**
Foundry includes authentication endpoints:
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/forgot-password
- POST /api/auth/reset-password

These endpoints require rate limiting to prevent brute force attacks.

**Verification:**
- **Script:** `scripts/verify-security-patterns.sh` (Agent 4 Section 9.2)
- **Check:** `authLimiter` middleware on authentication endpoints
- **Cross-Reference:** Agent 4 Section 9.2 (Rate Limiting), Constitution Section W Tier 1 Pattern 3

**Expected Pattern:**
```typescript
// Authentication endpoints MUST use authLimiter
router.post('/api/auth/login', authLimiter, login);
router.post('/api/auth/register', authLimiter, register);
```

---

#### Gate #4: Password Validation

**Status:** ✅ APPLICABLE

**Classification:**
- **Tier:** 1 (Pre-Flight)
- **Priority:** CRITICAL-MANDATORY
- **Phase:** 0.5
- **Blocking:** true
- **Auto-Fix:** NO
- **Duration:** <30 seconds
- **Expected Failures:** 0%

**Rationale:**
Foundry includes user registration and password reset functionality. Password validation requirements from 04-API-CONTRACT.md:
- Minimum 8 characters
- Must contain uppercase letter
- Must contain lowercase letter
- Must contain number

**Verification:**
- **Script:** `scripts/verify-security-patterns.sh` (Agent 4 Section 9.4)
- **Check:** Password regex pattern in validation schemas
- **Cross-Reference:** Agent 4 Section 9.4 (Password Validation), Constitution Section W Tier 1 Pattern 4

**Expected Pattern:**
```typescript
const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 
    'Password must contain uppercase, lowercase, and number');
```

---

#### Gate #5: Transaction Enforcement

**Status:** ✅ APPLICABLE

**Classification:**
- **Tier:** 1 (Pre-Flight)
- **Priority:** CRITICAL-MANDATORY
- **Phase:** 0.5
- **Blocking:** true
- **Auto-Fix:** NO
- **Duration:** <30 seconds
- **Expected Failures:** 0%

**Rationale:**
Foundry performs multi-table operations during:
1. **User Registration:** Creates organization + user records atomically
2. **Cascade Deletes:** Organization deletion cascades to users, projects, data sources

The data model (03-DATA-MODEL.md) defines cascade relationships:
```typescript
users.organizationId → organizations.id { onDelete: 'cascade' }
projects.organizationId → organizations.id { onDelete: 'cascade' }
data_sources.projectId → projects.id { onDelete: 'cascade' }
```

**Verification:**
- **Script:** `scripts/verify-security-patterns.sh` (Agent 4 Section 9.5)
- **Check:** `db.transaction()` wrapper on multi-table operations
- **Cross-Reference:** Agent 4 Section 9.5 (Transaction Enforcement), Constitution Section W Tier 1 Pattern 5

**Expected Pattern:**
```typescript
// Registration MUST use transaction
await db.transaction(async (tx) => {
  const org = await tx.insert(organizations).values({...}).returning();
  const user = await tx.insert(users).values({
    organizationId: org[0].id,
    ...
  }).returning();
});
```

---

#### Gate #6: Cross-Org Validation

**Status:** ✅ APPLICABLE

**Classification:**
- **Tier:** 1 (Pre-Flight)
- **Priority:** CRITICAL-MANDATORY
- **Phase:** 0.5
- **Blocking:** true
- **Auto-Fix:** NO
- **Duration:** <30 seconds
- **Expected Failures:** 0%

**Rationale:**
As a multi-tenant application, Foundry must prevent cross-organization data access. Users must only access resources belonging to their organization.

**Verification:**
- **Script:** `scripts/verify-security-patterns.sh` (Agent 4 Section 9)
- **Check:** All queries include `organizationId` validation
- **Cross-Reference:** Agent 4 Section 9 (Security Requirements), Constitution Section W Tier 1 Pattern 6

**Expected Pattern:**
```typescript
// Verify resource belongs to user's organization
const project = await db.select()
  .from(projectsTable)
  .where(and(
    eq(projectsTable.id, projectId),
    eq(projectsTable.organizationId, user.organizationId) // REQUIRED
  ))
  .limit(1);

if (!project.length) {
  throw new NotFoundError('Project not found');
}
```

---

#### Gate #7: ErrorBoundary First

**Status:** ✅ APPLICABLE

**Classification:**
- **Tier:** 1 (Pre-Flight)
- **Priority:** CRITICAL-MANDATORY
- **Phase:** 0.5
- **Blocking:** true
- **Auto-Fix:** NO
- **Duration:** <30 seconds
- **Expected Failures:** 0%

**Rationale:**
Foundry is a React 18 application. The UI specification (05-UI-UX-SPECIFICATION.md) explicitly requires ErrorBoundary as the FIRST mandatory component:

**Section 5.1.1 Pattern 1: ErrorBoundary (BLOCKING - CREATE FIRST)**
- File: `client/src/components/ErrorBoundary.tsx`
- Usage: Wrap entire app in `<ErrorBoundary>` in `client/src/main.tsx`

**Verification:**
- **Script:** `scripts/verify-mandatory-ui-components.sh` (Agent 5 Section 7.1)
- **Check:** ErrorBoundary component exists and is used as first wrapper
- **Cross-Reference:** Agent 5 Section 7.1 (ErrorBoundary), Constitution Section W Tier 1 Pattern 7

**Expected Pattern:**
```typescript
// client/src/main.tsx
import { ErrorBoundary } from '@/components/ErrorBoundary';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
```

---

#### Gate #8: AcceptInvitePage Conditional

**Status:** ❌ NOT APPLICABLE

**Classification:**
- **Tier:** 1 (Pre-Flight)
- **Priority:** CRITICAL-MANDATORY (if applicable)
- **Phase:** 0.5
- **Blocking:** true
- **Auto-Fix:** NO
- **Duration:** <30 seconds
- **Expected Failures:** 0%

**Rationale:**
The invitations table exists in the data model (03-DATA-MODEL.md) but is marked as **DEFERRED** from MVP scope:

```
| `invitations` | 9 | 1 (organizationId) | 2 (email, token) | No | 2 | Team member invitations (DEFERRED) |
```

No POST /api/invitations endpoints exist in 04-API-CONTRACT.md. Therefore, AcceptInvitePage component is not required.

**Verification:**
- **Script:** `scripts/verify-mandatory-ui-components.sh` (Agent 5 Section 7.2)
- **Check:** Skip this gate (invitations not in MVP)
- **Cross-Reference:** Agent 5 Section 7.2 (AcceptInvitePage), Constitution Section W Tier 1 Pattern 8

**Future Implementation:**
If invitation endpoints are added post-MVP, this gate becomes MANDATORY.

---

#### Gate #9: API Client 401 Handling

**Status:** ✅ APPLICABLE

**Classification:**
- **Tier:** 1 (Pre-Flight)
- **Priority:** CRITICAL-MANDATORY
- **Phase:** 0.5
- **Blocking:** true
- **Auto-Fix:** NO
- **Duration:** <30 seconds
- **Expected Failures:** 0%

**Rationale:**
Foundry uses JWT authentication with refresh tokens. The API client must handle 401 Unauthorized responses by:
1. Attempting token refresh
2. Redirecting to login page if refresh fails

**Verification:**
- **Script:** `scripts/verify-mandatory-ui-components.sh` (Agent 5 Section 7.3)
- **Check:** API client interceptor handles 401 responses
- **Cross-Reference:** Agent 5 Section 7.3 (API Client 401), Constitution Section W Tier 1 Pattern 9

**Expected Pattern:**
```typescript
// API client interceptor
axios.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      try {
        await refreshAccessToken();
        return axios.request(error.config);
      } catch {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
```

---

#### Gate #10: Spec Freeze Hash

**Status:** ✅ APPLICABLE

**Classification:**
- **Tier:** 1 (Pre-Flight)
- **Priority:** CRITICAL-MANDATORY
- **Phase:** 0.5
- **Blocking:** true
- **Auto-Fix:** NO
- **Duration:** <30 seconds
- **Expected Failures:** 0%

**Rationale:**
ALL projects require specification freeze before code generation (Constitution Section X). This ensures specifications are stable and prevents mid-build changes.

**Verification:**
- **Script:** `scripts/generate-spec-freeze-hash.sh`
- **Check:** Generate SHA-256 hash of all specification files (01-06)
- **Cross-Reference:** Constitution Section X (Specification Freeze Hash), Constitution Section W Tier 1 Pattern 10

**Expected Pattern:**
```bash
# Generate hash of frozen specifications
cat 01-PRD.md 02-ARCHITECTURE.md 03-DATA-MODEL.md \
    04-API-CONTRACT.md 05-UI-UX-SPECIFICATION.md 06-IMPLEMENTATION-PLAN.md | \
  shasum -a 256 > SPEC_FREEZE_HASH.txt
```

---

### 2.2 Tier 2: Progressive Gates (Phases 1-8)

**Purpose:** Validate code quality and completeness during each build phase  
**Timing:** Run after each phase (Phases 1-8, ~30 seconds per phase)  
**Failure Mode:** BLOCKING per phase  
**Expected Result:** 0-2 failures per 100 builds

---

#### Phase 1 Gates (Scaffolding & Templates)

#### Gate #11: Template Extraction

**Status:** ✅ APPLICABLE

**Classification:**
- **Tier:** 2 (Progressive)
- **Priority:** HIGH-RECOMMENDED
- **Phase:** 1
- **Blocking:** true
- **Auto-Fix:** YES
- **Duration:** <10 seconds
- **Expected Failures:** 2-5%

**Purpose:** Verify pattern templates extracted before scaffolding

**Rationale:** Phase 1 requires extracting pattern templates from specifications before generating any code. This ensures consistency across all generated files.

**Verification:**
- Check `pattern-templates/` directory exists
- Verify templates for: service, controller, schema, component patterns

**Applicability:** YES (all projects)

---

#### Gate #12: Template Completeness

**Status:** ✅ APPLICABLE

**Classification:**
- **Tier:** 2 (Progressive)
- **Priority:** HIGH-RECOMMENDED
- **Phase:** 1
- **Blocking:** true
- **Auto-Fix:** NO
- **Duration:** <10 seconds
- **Expected Failures:** 2-5%

**Purpose:** Verify templates are complete (>20 lines, no TODOs)

**Verification:**
- Each template file >20 lines
- No TODO, FIXME, or placeholder comments
- All pattern variables documented

**Applicability:** YES (all projects)

---

#### Phase 2 Gates (Backend Implementation)

#### Gate #13: No Stub Implementations

**Status:** ✅ APPLICABLE

**Classification:**
- **Tier:** 2 (Progressive)
- **Priority:** HIGH-RECOMMENDED
- **Phase:** 2
- **Blocking:** true
- **Auto-Fix:** NO
- **Duration:** ~30 seconds
- **Expected Failures:** 2-5%

**Purpose:** Verify all service methods fully implemented

**Verification:**
```bash
# No stub implementations allowed
! grep -r "throw new Error('Not implemented')" server/src/services/
! grep -r "// TODO: implement" server/src/services/
```

**Applicability:** YES (all projects)

---

#### Gate #14: Pagination Enforcement

**Status:** ✅ APPLICABLE

**Classification:**
- **Tier:** 2 (Progressive)
- **Priority:** HIGH-RECOMMENDED
- **Phase:** 2
- **Blocking:** true
- **Auto-Fix:** PARTIAL
- **Duration:** ~20 seconds
- **Expected Failures:** 2-5%

**Purpose:** Verify BaseService pagination pattern used

**Rationale:** Foundry includes list endpoints:
- GET /api/projects (list projects)
- GET /api/data-sources (list data sources)
- GET /api/processing-jobs (list processing jobs)

All list endpoints must support pagination via `page` and `limit` parameters.

**Verification:**
```bash
# All list methods use BaseService pagination
grep -r "listProjects\|listDataSources\|listJobs" server/src/services/ | \
  grep "offset.*limit"
```

**Applicability:** YES (all list endpoints)

---

#### Phase 3 Gates (API Contract)

#### Gate #15: Endpoint Count Verification

**Status:** ✅ APPLICABLE

**Classification:**
- **Tier:** 2 (Progressive)
- **Priority:** HIGH-RECOMMENDED
- **Phase:** 3
- **Blocking:** true
- **Auto-Fix:** NO
- **Duration:** ~10 seconds
- **Expected Failures:** 2-5%

**Purpose:** Verify implemented endpoints match spec count

**Rationale:** 04-API-CONTRACT.md defines all endpoints. Implementation must match specification exactly.

**Verification:**
```bash
# Count endpoints in specification
SPEC_COUNT=$(grep -c "^**Endpoint:**" 04-API-CONTRACT.md)

# Count implemented routes
IMPL_COUNT=$(grep -c "router\.(get|post|patch|delete)" server/src/routes/*.ts)

# Counts must match
[ "$SPEC_COUNT" -eq "$IMPL_COUNT" ]
```

**Applicability:** YES (all API projects)

---

#### Gate #16-20: Service Contract Verification

**Status:** ✅ APPLICABLE (5 gates)

**Classification:**
- **Tier:** 2 (Progressive)
- **Priority:** HIGH-RECOMMENDED
- **Phase:** 2-4
- **Blocking:** true
- **Auto-Fix:** NO

**Purpose:** Verify service layer completeness

**Gates:**
- #16: All services extend BaseService
- #17: All methods have type signatures
- #18: All methods have error handling
- #19: All database queries use Drizzle ORM
- #20: No raw SQL strings

**Applicability:** YES (all services)

---

#### Phase 4-6 Gates (Frontend & Integration)

#### Gate #21: File Completeness

**Status:** ✅ APPLICABLE

**Purpose:** Verify all files from implementation plan exist

**Verification:**
- Check all files in 06-IMPLEMENTATION-PLAN.md are created
- No missing imports
- No undefined references

**Applicability:** YES (all projects)

---

#### Gate #22: Package Scripts

**Status:** ✅ APPLICABLE

**Purpose:** Verify all required scripts in package.json

**Required Scripts:**
- `dev` - Development server
- `build` - Production build
- `start` - Production server
- `test` - Run tests
- `db:migrate` - Database migrations

**Applicability:** YES (all projects)

---

#### Gate #23: Network Binding

**Status:** ✅ APPLICABLE

**Purpose:** Verify correct network binding addresses

**Required:**
- Development: `127.0.0.1:3001`
- Production: `0.0.0.0:5000`

**Verification:**
```typescript
// Development
app.listen(3001, '127.0.0.1');

// Production
app.listen(5000, '0.0.0.0');
```

**Applicability:** YES (Replit deployment)

---

#### Gate #24: Console Logs

**Status:** ✅ APPLICABLE

**Purpose:** Remove debug console.log statements

**Verification:**
```bash
# No console.log in production code (allow in tests)
! grep -r "console\.log" server/src/ client/src/ --exclude-dir=__tests__
```

**Applicability:** YES (all projects)

---

#### Gate #25: Vite Configuration

**Status:** ✅ APPLICABLE

**Purpose:** Verify Vite config for Replit compatibility

**Required:**
- Proxy to backend: `http://127.0.0.1:5000`
- Port 3001 for development
- Build output to `client/dist`

**Applicability:** YES (React + Vite projects)

---

#### Gate #26-28: Route-Service Wiring

**Status:** ✅ APPLICABLE (3 gates)

**Purpose:** Verify controllers call correct services

**Gates:**
- #26: All routes have corresponding service methods
- #27: All services have corresponding routes
- #28: Parameter types match between layers

**Applicability:** YES (all API projects)

---

#### Gate #29: Form Validation

**Status:** ✅ APPLICABLE

**Purpose:** Verify Zod schemas on all forms

**Rationale:** UI spec (05-UI-UX-SPECIFICATION.md) requires React Hook Form + Zod validation.

**Verification:**
- All form components use `useForm` with Zod resolver
- All schemas have client-side validation rules
- Error messages match API contract

**Applicability:** YES (all React forms)

---

#### Gate #30-32: Loading/Error States

**Status:** ✅ APPLICABLE (3 gates)

**Purpose:** Verify UI handles async operations correctly

**Gates:**
- #30: Loading indicators on all async operations
- #31: Error messages on all failure paths
- #32: Empty states on zero-result lists

**Applicability:** YES (all React components with API calls)

---

#### Gate #33: No Placeholders

**Status:** ✅ APPLICABLE

**Purpose:** Remove placeholder content

**Verification:**
```bash
# No Lorem Ipsum or placeholder text
! grep -r "Lorem ipsum\|TODO\|FIXME\|Placeholder" client/src/ server/src/
```

**Applicability:** YES (all projects)

---

#### Gate #34-36: Config Files

**Status:** ✅ APPLICABLE (3 gates)

**Purpose:** Verify configuration completeness

**Gates:**
- #34: `.env.example` has all required variables
- #35: `tsconfig.json` has strict mode enabled
- #36: `.gitignore` excludes sensitive files

**Applicability:** YES (all projects)

---

#### Gate #37: Security Middleware

**Status:** ✅ APPLICABLE

**Purpose:** Verify Helmet and CORS configured

**Required Middleware:**
- `helmet()` - Security headers
- `cors()` - CORS configuration
- `express.json()` with size limit
- `cookieParser()` for refresh tokens

**Verification:**
```typescript
app.use(helmet());
app.use(cors({ credentials: true, origin: process.env.CLIENT_URL }));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
```

**Applicability:** YES (all Express applications)

---

#### Gate #38: Response Helpers

**Status:** ✅ APPLICABLE

**Purpose:** Verify all responses use error helper functions

**Required:**
- `respondSuccess(res, data, statusCode)`
- `NotFoundError`, `UnauthorizedError`, `ValidationError` classes

**Applicability:** YES (all API endpoints)

---

#### Gate #39: Parameter Validation

**Status:** ✅ APPLICABLE

**Purpose:** Verify all route parameters validated

**Verification:**
- Path params: Validate IDs are numbers
- Query params: Validate page, limit, filters
- Request bodies: Validate with Zod schemas

**Applicability:** YES (all API endpoints)

---

#### Gate #40: Transaction Wrappers

**Status:** ✅ APPLICABLE

**Purpose:** Verify transaction helpers used consistently

**Verification:**
- Multi-table operations use `db.transaction()`
- No manual BEGIN/COMMIT statements
- Error handling includes rollback

**Applicability:** YES (all multi-table operations)

---

### 2.3 Tier 3: Post-Build Validation (Phase 8)

**Purpose:** Final validation and edge case detection  
**Timing:** Run once after all phases complete (~3 minutes)  
**Failure Mode:** WARNING (not blocking)  
**Expected Result:** 0-2 edge cases

---

#### Gate #41: Cross-Document Consistency

**Status:** ✅ APPLICABLE

**Classification:**
- **Tier:** 3 (Post-Build)
- **Priority:** CONDITIONAL
- **Phase:** 8
- **Blocking:** false
- **Auto-Fix:** NO
- **Duration:** ~30 seconds
- **Expected Failures:** <1%

**Purpose:** Verify specifications aligned across all documents

**Checks:**
- Entity names consistent (01-PRD ↔ 03-DATA-MODEL ↔ 04-API-CONTRACT)
- Field names match (03-DATA-MODEL ↔ 04-API-CONTRACT)
- Endpoints documented (04-API-CONTRACT ↔ 05-UI-SPECIFICATION)

**Failure Mode:** WARNING - Manual review required

**Applicability:** YES (all projects)

---

#### Gate #42: Import Paths

**Status:** ✅ APPLICABLE

**Purpose:** Verify consistent import path usage

**Check:**
- All imports use `@/` alias (not relative paths)
- No circular dependencies
- No unused imports

**Failure Mode:** WARNING

**Applicability:** YES (TypeScript projects)

---

#### Gate #43: Orphaned Files

**Status:** ✅ APPLICABLE

**Purpose:** Detect files not referenced anywhere

**Check:**
- All components imported somewhere
- All services used by controllers
- No dead code

**Failure Mode:** WARNING

**Applicability:** YES (all projects)

---

#### Gate #44: CORS Configuration

**Status:** ✅ APPLICABLE

**Purpose:** Verify CORS allows required origins

**Check:**
- Development: `http://127.0.0.1:3001`
- Production: Environment variable `CLIENT_URL`

**Failure Mode:** WARNING

**Applicability:** YES (all API projects)

---

#### Gate #45: RequestID Middleware

**Status:** ✅ APPLICABLE

**Purpose:** Verify request tracing configured

**Check:**
- Request ID generated for each request
- Request ID included in logs
- Request ID returned in error responses

**Failure Mode:** WARNING

**Applicability:** YES (all API projects)

---

#### Gate #46: Soft Delete Cascade

**Status:** ❌ NOT APPLICABLE

**Purpose:** Verify soft deletes cascade correctly

**Rationale:** The data model (03-DATA-MODEL.md) does not use soft deletes. All deletes are hard deletes with CASCADE constraints.

```
* Soft delete: NO (deleted when project deleted via cascade)
```

**Applicability:** NO (no soft deletes in project)

---

#### Gate #47: Email Templates

**Status:** ✅ APPLICABLE

**Purpose:** Verify email templates exist and are complete

**Required Templates:**
- Password reset email
- Welcome email (optional for MVP)

**Failure Mode:** WARNING

**Applicability:** YES (forgot-password endpoint exists)

---

#### Gate #48: Navigation Links

**Status:** ✅ APPLICABLE

**Purpose:** Verify all pages accessible via navigation

**Check:**
- Sidebar navigation includes all pages
- No orphaned routes
- Active state indicators work

**Failure Mode:** WARNING

**Applicability:** YES (React SPA)

---

#### Gate #49: Environment Variables

**Status:** ✅ APPLICABLE

**Purpose:** Verify all env vars documented in .env.example

**Check:**
- All `process.env.X` references have corresponding `.env.example` entry
- All required variables marked as required
- All optional variables have defaults

**Failure Mode:** WARNING

**Applicability:** YES (all projects)

---

#### Gate #50: No TODOs

**Status:** ✅ APPLICABLE

**Purpose:** Verify no TODO comments in production code

**Check:**
```bash
! grep -r "TODO\|FIXME\|HACK" server/src/ client/src/ --exclude-dir=__tests__
```

**Failure Mode:** WARNING

**Applicability:** YES (all projects)

---

## 3. Testing Requirements

### 3.1 Unit Testing

**Framework:** Vitest (specified in 02-ARCHITECTURE.md)

**Coverage Targets:**
- Minimum: 80% overall coverage
- Services: 90% coverage
- Controllers: 85% coverage
- Utilities: 100% coverage

**Test Files:**
- Location: `server/src/**/__tests__/*.test.ts`
- Naming: `{filename}.test.ts`

**Command:**
```bash
npm test
```

**Required Test Cases:**
- All service methods
- All validation schemas
- All helper functions
- Error handling paths

---

### 3.2 Integration Testing

**Scope:** All API endpoints

**Framework:** Vitest with Supertest

**Test Coverage:**
- All REST endpoints (GET, POST, PATCH, DELETE)
- Authentication flows (register, login, refresh)
- Authorization checks (role-based access)
- Multi-tenant isolation
- Error responses

**Test Files:**
- Location: `server/src/routes/__tests__/*.integration.test.ts`

**Command:**
```bash
npm run test:integration
```

**Database:**
- Use separate test database
- Reset state between tests
- Seed test data via fixtures

---

### 3.3 E2E Testing

**Framework:** Playwright (specified in 02-ARCHITECTURE.md)

**Scope:**
- Critical user flows
- Authentication (register, login, logout)
- Project creation and management
- File upload and processing
- Data export workflows

**Test Files:**
- Location: `e2e/tests/*.spec.ts`

**Command:**
```bash
npm run test:e2e
```

**Environments:**
- Chromium, Firefox, WebKit
- Run against local dev server
- Use test accounts (not production data)

---

## 4. Deployment Specification

### 4.1 Platform Configuration

**Platform:** Replit

**Container Specifications:**
- **Type:** Single container deployment
- **Port:** 5000 (production)
- **Binding:** 0.0.0.0 (IPv4/IPv6 compatible)
- **Process Manager:** Node.js built-in (no PM2 needed)

**Network Configuration:**
```typescript
// Production server binding (server/src/index.ts)
const PORT = 5000;
const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});
```

**Development Configuration:**
```typescript
// Development: Frontend Vite (3001) + Backend Express (5000)
// Frontend: 127.0.0.1:3001
// Backend: 127.0.0.1:5000
```

---

### 4.2 Environment Variables

**Source:** 02-ARCHITECTURE.md Section 4.5

**Required Variables:**

```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# Authentication
JWT_SECRET=your-secret-key-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-key-min-32-chars

# Application
NODE_ENV=production
CLIENT_URL=https://your-replit-app.repl.co
PORT=5000

# External Services
TEAMWORK_DESK_API_KEY=your-teamwork-api-key
TEAMWORK_DESK_DOMAIN=your-domain.teamwork.com

# Email (for password reset)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
SMTP_FROM=noreply@foundry.app
```

**Validation:**
- All secrets minimum 32 characters
- DATABASE_URL must use PostgreSQL
- CLIENT_URL must match deployed frontend URL
- SMTP credentials required for password reset

---

### 4.3 Database Configuration

**Database:** PostgreSQL 14+ via Neon managed service

**Connection Pooling:**
- Min connections: 2
- Max connections: 10 (Replit container limit)
- Idle timeout: 30 seconds

**Migration Strategy:**
- **Tool:** Drizzle Kit
- **Location:** `server/drizzle/migrations/`
- **Schema:** `server/src/db/schema.ts`

**Migration Commands:**
```bash
# Generate migration from schema changes
npm run db:generate

# Apply migrations
npm run db:migrate

# Rollback (manual - Drizzle doesn't support auto-rollback)
npm run db:rollback
```

**Migration Process:**
1. Update schema in `server/src/db/schema.ts`
2. Generate migration: `npm run db:generate`
3. Review generated SQL in `drizzle/migrations/`
4. Test migration on local database
5. Apply to production: `npm run db:migrate`

**Seed Data:**
- Initial organization (for demo)
- Test user accounts (development only)
- Example projects (optional)

---

### 4.4 Build Process

**Build Command:**
```bash
npm run build
```

**Build Steps:**
1. Install dependencies: `npm ci --production=false`
2. Run type checking: `npm run type-check`
3. Build frontend: `npm run build:client` (Vite → `client/dist`)
4. Build backend: `npm run build:server` (TypeScript → `server/dist`)
5. Copy static files to `server/dist/public`

**Build Outputs:**
- Frontend: `client/dist/` → Static assets
- Backend: `server/dist/` → Compiled JavaScript
- Public: `server/dist/public/` → Frontend served via Express static

**Environment-Specific:**
- Development: No build, use Vite dev server + ts-node
- Production: Full build, serve static files from Express

---

### 4.5 Health Checks

**Endpoints:**
- `GET /health` - Basic health check
- `GET /health/ready` - Database connection check

**Implementation:**
```typescript
// Basic health
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Database readiness
app.get('/health/ready', async (req, res) => {
  try {
    await db.execute(sql`SELECT 1`);
    res.json({ status: 'ready', database: 'connected' });
  } catch (error) {
    res.status(503).json({ status: 'not_ready', database: 'disconnected' });
  }
});
```

**Monitoring:**
- Replit pings `/health` every 60 seconds
- Returns 200 OK to prevent cold start
- Database check for infrastructure monitoring

---

## 5. Pre-Deployment Checklist

### 5.1 Tier 1 Gates (MANDATORY)

- [ ] **Gate #1:** Multi-Tenant Isolation - All queries include organizationId
- [ ] **Gate #2:** RBAC Enforcement - requireRole middleware on admin endpoints
- [ ] **Gate #3:** Rate Limiting - authLimiter on authentication endpoints
- [ ] **Gate #4:** Password Validation - Regex pattern in schemas
- [ ] **Gate #5:** Transaction Enforcement - db.transaction() on multi-table ops
- [ ] **Gate #6:** Cross-Org Validation - Ownership checks prevent cross-org access
- [ ] **Gate #7:** ErrorBoundary First - Component exists and wraps app
- [ ] **Gate #8:** AcceptInvitePage - N/A (invitations deferred)
- [ ] **Gate #9:** API Client 401 Handling - Interceptor redirects to login
- [ ] **Gate #10:** Spec Freeze Hash - Generated and committed

### 5.2 Tier 2 Gates (HIGH PRIORITY)

- [ ] **Gate #11:** Template Extraction - pattern-templates/ directory exists
- [ ] **Gate #12:** Template Completeness - No TODOs, >20 lines each
- [ ] **Gate #13:** No Stub Implementations - All service methods implemented
- [ ] **Gate #14:** Pagination Enforcement - BaseService pattern used
- [ ] **Gate #15:** Endpoint Count - Implementation matches specification
- [ ] **Gate #16-20:** Service Contracts - All services complete
- [ ] **Gate #21:** File Completeness - All files from plan created
- [ ] **Gate #22:** Package Scripts - All required scripts present
- [ ] **Gate #23:** Network Binding - 127.0.0.1:3001 dev, 0.0.0.0:5000 prod
- [ ] **Gate #24:** Console Logs - No debug statements in production
- [ ] **Gate #25:** Vite Configuration - Proxy and ports correct
- [ ] **Gate #26-28:** Route-Service Wiring - Controllers call correct services
- [ ] **Gate #29:** Form Validation - Zod schemas on all forms
- [ ] **Gate #30-32:** Loading/Error States - All async operations handled
- [ ] **Gate #33:** No Placeholders - Lorem ipsum and TODOs removed
- [ ] **Gate #34-36:** Config Files - .env.example, tsconfig, .gitignore complete
- [ ] **Gate #37:** Security Middleware - Helmet and CORS configured
- [ ] **Gate #38:** Response Helpers - Error classes used consistently
- [ ] **Gate #39:** Parameter Validation - All route params validated
- [ ] **Gate #40:** Transaction Wrappers - Multi-table ops use transactions

### 5.3 Testing

- [ ] **Unit Tests:** All services and utilities tested (80% coverage)
- [ ] **Integration Tests:** All API endpoints tested
- [ ] **E2E Tests:** Critical user flows tested (auth, upload, export)
- [ ] **Manual Testing:** Smoke test all features in staging environment

### 5.4 Environment & Configuration

- [ ] **Environment Variables:** All required variables in Replit Secrets
- [ ] **Database:** Migrations applied, schema matches specification
- [ ] **Secrets:** JWT secrets minimum 32 characters, unique per environment
- [ ] **CORS:** CLIENT_URL matches deployed frontend URL
- [ ] **SMTP:** Email credentials configured for password reset

### 5.5 Build & Deployment

- [ ] **Build Success:** `npm run build` completes without errors
- [ ] **Type Checking:** `npm run type-check` passes
- [ ] **Linting:** `npm run lint` passes (if configured)
- [ ] **Dependencies:** Only production dependencies in package.json
- [ ] **Start Command:** `npm start` runs successfully

### 5.6 Tier 3 Gates (ADVISORY)

- [ ] **Gate #41:** Cross-Document Consistency - Entity names aligned
- [ ] **Gate #42:** Import Paths - All imports use @/ alias
- [ ] **Gate #43:** Orphaned Files - No unused files
- [ ] **Gate #44:** CORS Configuration - Origins verified
- [ ] **Gate #45:** RequestID Middleware - Request tracing configured
- [ ] **Gate #47:** Email Templates - Password reset template exists
- [ ] **Gate #48:** Navigation Links - All pages accessible
- [ ] **Gate #49:** Environment Variables - All documented in .env.example
- [ ] **Gate #50:** No TODOs - Production code clean

### 5.7 Post-Deployment Verification

- [ ] **Health Check:** `GET /health` returns 200 OK
- [ ] **Database Ready:** `GET /health/ready` returns database connected
- [ ] **Registration:** Create test account successfully
- [ ] **Login:** Authenticate with test account
- [ ] **File Upload:** Upload and process sample CSV
- [ ] **Export:** Generate and download JSONL export
- [ ] **Error Handling:** Verify ErrorBoundary catches React errors
- [ ] **401 Handling:** Verify logout redirects to login page

---

## 6. Quality Metrics

### 6.1 Expected Outcomes

**Tier 1 (Pre-Flight):**
- **Target:** 10/10 gates pass (100%)
- **Blocking:** YES
- **Expected Issues:** 0

**Tier 2 (Progressive):**
- **Target:** 38/40 gates pass (95%)
- **Blocking:** YES per phase
- **Expected Issues:** 0-2 across all phases

**Tier 3 (Post-Build):**
- **Target:** 17/19 applicable gates pass (90%)
- **Blocking:** NO
- **Expected Issues:** 0-2 edge cases

**Total Quality Score:**
- **Gates:** 65/69 applicable (94%)
- **Expected Failures:** 0-4 total
- **Prevention Rate:** 99.9%

### 6.2 Success Criteria

**Build Success:**
- All Tier 1 gates pass (MANDATORY)
- ≥95% Tier 2 gates pass
- All tests pass (unit, integration, e2e)
- Build completes without errors

**Deployment Success:**
- Health check returns 200 OK
- Database migrations applied
- Test user can register/login
- File upload/export workflow works

**Quality Success:**
- No security vulnerabilities
- No multi-tenant isolation violations
- No password validation bypass
- No transaction integrity issues

---

## 7. Failure Response Plan

### 7.1 Tier 1 Gate Failure (BLOCKING)

**Response:** STOP build immediately

**Steps:**
1. Identify failing gate (script output)
2. Review specification for requirements
3. Update specifications if needed (requires AR-### change request)
4. Re-run Phase 0.5
5. Do NOT proceed to code generation until all Tier 1 gates pass

### 7.2 Tier 2 Gate Failure (BLOCKING per phase)

**Response:** Fix issue before next phase

**Steps:**
1. Review gate failure details
2. Fix implementation issue
3. Re-run phase verification
4. Continue to next phase once resolved

### 7.3 Tier 3 Gate Failure (ADVISORY)

**Response:** Document and defer to post-MVP

**Steps:**
1. Log issue in KNOWN_ISSUES.md
2. Assess impact (cosmetic vs. functional)
3. Create GitHub issue for tracking
4. Continue with deployment if impact is low

### 7.4 Test Failure

**Response:** Fix before deployment

**Steps:**
1. Review failing test
2. Determine if test is incorrect or implementation is wrong
3. Fix implementation or update test
4. Re-run full test suite
5. Deploy only when all tests pass

---

## 8. Post-Deployment Monitoring

### 8.1 Metrics to Track

**Performance:**
- API response time (p50, p95, p99)
- Database query performance
- File processing time
- Error rate by endpoint

**Security:**
- Failed login attempts
- 401/403 response counts
- CORS errors
- Rate limit hits

**Usage:**
- New user registrations
- Projects created
- Files uploaded
- Datasets exported

### 8.2 Alert Thresholds

**Critical Alerts:**
- Health check failures
- Database connection errors
- Error rate >5%
- Response time p95 >2 seconds

**Warning Alerts:**
- Failed login rate >10%
- Rate limit hit rate >5%
- File upload failures >2%
- Export generation failures >2%

---

## 9. Rollback Plan

### 9.1 Trigger Conditions

**Immediate Rollback:**
- Health check fails continuously
- Database connection lost
- Critical security vulnerability discovered
- Multi-tenant isolation breach

**Planned Rollback:**
- Error rate >10% sustained for 5+ minutes
- User-reported critical bugs (auth failures, data loss)
- Performance degradation (p95 >5 seconds)

### 9.2 Rollback Process

**Steps:**
1. Stop new deployment
2. Restore previous Replit deployment
3. Verify database migrations (may need rollback)
4. Test health endpoints
5. Notify users if downtime occurred

**Database Rollback:**
- Manual process (Drizzle doesn't support auto-rollback)
- Requires prepared rollback SQL scripts
- Test on staging first

---

## Document End

**Agent 7 (QA & Deployment Specification) v49 Complete**

**Summary:**
- **Total Gates Analyzed:** 72
- **Applicable Gates:** 65
- **Not Applicable:** 7 (invitations deferred, soft deletes not used)
- **Tier 1 (Pre-Flight):** 9/10 applicable (90%)
- **Tier 2 (Progressive):** 40/40 applicable (100%)
- **Tier 3 (Post-Build):** 16/22 applicable (73%)

**Quality Target:** 99.9% issue prevention rate (0-4 expected issues across all tiers)

**Next Steps:**
1. Review this specification with stakeholders
2. Freeze specifications (generate spec hash - Gate #10)
3. Run Phase 0.5: Execute all Tier 1 gates
4. Proceed to code generation only if all Tier 1 gates pass
5. Run Tier 2 gates progressively during build phases
6. Execute Tier 3 validation post-build
7. Deploy to Replit production environment

**Next Agent:** Agent 8 (Code Review Protocol) defines post-build audit procedures for final validation.
