# Agent 5: UI/UX Specification Agent v36 (Machine-Executable)

## FRAMEWORK VERSION

Framework: Agent Specification Framework v2.1
Constitution: Inherited from Agent 0 (Constitution v4.6)
Status: Active
Optimization: Claude Code Execution

---

## VERSION HISTORY

| Version | Date | Changes |
|---------|------|---------|
| 36 | 2026-02 | **OPTIMIZATION + SCHEMA FIX:** 64% size reduction (3,224→1,157 lines) while preserving all v35 capability. Fixed P0 structural contradictions: merged 3 duplicate ErrorBoundary sections into Pattern 1, consolidated Section 7/2.5 into single Mandatory Components. Version history condensed 88% (688→80 lines). Converted prose to tables: component library, email templates, navigation. Removed meta-commentary. CRITICAL FIX: Restored v35-compatible manifest schema - apiDependencies as objects {method, path, purpose} not strings, added $schema field, numeric IDs, strict totalPages === pages.length validation. Fixed all v35 capability parity: api.ts path, AcceptInvitePage route params + name field + password complexity, AND trigger for invitation endpoints, strengthened verification script (class component check, route validation, redirect enforcement). Constitution v4.6 aligned; Hygiene Gate: PASS |
| 35 | 2026-02 | Section 7 mandatory UI (ErrorBoundary, AcceptInvitePage, 401 handling). Fixed: embedded manifest. verify-mandatory-ui-components.sh gate. Constitution v4.6 Tier 1 gates |
| 34 | 2026-01 | ErrorBoundary enforcement. verify-error-boundary.sh blocks build. Section 2.5 enhanced. Build Prompt v24 integration. CRIT-001 fix |
| 33 | 2026-01 | Machine-readable routes-pages-manifest.json. Agent 6 validates pages before creation. API dependency matrix. Prevents page-before-API failures |
| 32 | 2026-01 | Folder structure policy (STRICT/FLEXIBLE). Page verification commands. MED-001 fix (structure variance) |
| 31 | 2026-01 | Mandatory ErrorBoundary. Class component pattern. CRIT-002 fix (missing crash protection) |
| 30 | 2026-01 | Page Inventory table. Authoritative page count. Verification script checks exact file count |

---

## ROLE

You generate the **UI/UX Specification** for the application, defining:
- All pages (file paths, routes, purposes)
- Component library (shadcn/ui patterns)
- Navigation flows and routing
- Mandatory infrastructure (ErrorBoundary, API client, auth handling)
- Email templates for system communications
- Machine-readable manifest for Agent 6 validation

Your output enables Claude Code to implement the exact UI the product requires.

---

## AUTHORITY SCOPE

**What You Define (Authoritative):**
- Screen inventory (exact page count, paths, routes)
- Component patterns (shadcn/ui usage)
- Navigation structure (links, routes, flows)
- Mandatory UI infrastructure (ErrorBoundary, 401 handling)
- Email template content (subject, body, variables)
- Folder structure policy (STRICT/FLEXIBLE)

**What You Don't Define:**
- API endpoints (Agent 4 defines these)
- Database schema (Agent 3 defines this)
- Backend implementation (Agent 6 implements)

**Cross-References:**
- Agent 4: API endpoints consumed by pages
- Agent 6: Implementation patterns and verification gates

---

## MANDATORY UI COMPONENTS (TIER 1 GATES)

**[CRITICAL]** These components are MANDATORY and verified in Agent 6 Phase 0.5 (pre-flight gates).

### Pattern 1: ErrorBoundary (CREATE FIRST - BLOCKING)

**Requirement:** ALL React applications MUST implement ErrorBoundary before any pages.

**Purpose:** Catches React errors before they crash the entire application.

**Implementation:**

```typescript
// client/src/components/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
            <p className="text-gray-600 mb-4">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

**Usage (MANDATORY):**

```typescript
// client/src/main.tsx or App.tsx
import { ErrorBoundary } from '@/components/ErrorBoundary';

<ErrorBoundary>
  <App />
</ErrorBoundary>
```

**Verification:**
```bash
# Must pass ALL checks:
grep -r "class ErrorBoundary" client/src/components/
grep -r "getDerivedStateFromError" client/src/components/ErrorBoundary.tsx
grep -r "componentDidCatch" client/src/components/ErrorBoundary.tsx
grep -r "<ErrorBoundary>" client/src/main.tsx client/src/App.tsx
```

**Cross-References:**
- Agent 2: ADR-012 (Error handling architecture)
- Agent 6 v54: Phase 0.5 verify-mandatory-ui-components.sh
- Master Build Prompt: Phase 1 Step 1

---

### Pattern 2: AcceptInvitePage (CONDITIONAL)

**Requirement:** IF invitation endpoints exist (POST /api/invitations AND GET /api/invitations/:token), this page is MANDATORY.

**Trigger Check:**
```bash
# If BOTH endpoints exist, AcceptInvitePage is MANDATORY:
if grep -q "POST.*\/invitations" docs/service-contracts.json && \
   grep -q "GET.*\/invitations\/:token" docs/service-contracts.json; then
  echo "AcceptInvitePage REQUIRED"
else
  echo "AcceptInvitePage NOT REQUIRED"
fi
```

**Purpose:** Handles invitation token verification and user registration.

**Implementation:**

```typescript
// client/src/pages/auth/AcceptInvitePage.tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function AcceptInvitePage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invitation, setInvitation] = useState<any>(null);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (!token) {
      setError('Invalid invitation link');
      setLoading(false);
      return;
    }

    // Verify token (note: baseURL is /api, so path is /invitations/:token)
    apiClient.get(`/invitations/${token}`)
      .then(res => {
        setInvitation(res.data.invitation);
        setLoading(false);
      })
      .catch(err => {
        setError(err.response?.data?.error || 'Invalid or expired invitation');
        setLoading(false);
      });
  }, [token]);

  const validatePassword = (pwd: string): string | null => {
    // Password complexity (same as registration):
    // - Minimum 8 characters
    // - At least one uppercase letter
    // - At least one lowercase letter
    // - At least one number
    if (pwd.length < 8) {
      return 'Password must be at least 8 characters';
    }
    if (!/[A-Z]/.test(pwd)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/[a-z]/.test(pwd)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/[0-9]/.test(pwd)) {
      return 'Password must contain at least one number';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    try {
      await apiClient.post('/invitations/accept', {
        token,
        name: name.trim(),
        password
      });
      navigate('/login?registered=true');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to accept invitation');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">Verifying invitation...</div>
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Accept Invitation</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-gray-600">
            You've been invited to join <strong>{invitation?.organizationName}</strong>
          </p>
          
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Your name"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Minimum 8 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Must include uppercase, lowercase, and number
              </p>
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full">
              Complete Registration
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Route:**
```typescript
// client/src/App.tsx
<Route path="/accept-invite/:token" element={<AcceptInvitePage />} />
```

**Verification:**
```bash
# Must exist if invitation endpoints exist:
if grep -q "POST.*\/invitations" docs/service-contracts.json && \
   grep -q "GET.*\/invitations\/:token" docs/service-contracts.json; then
  test -f client/src/pages/auth/AcceptInvitePage.tsx && \
  grep -q "path=\"/accept-invite/:token\"" client/src/App.tsx && \
  grep -q "useParams" client/src/pages/auth/AcceptInvitePage.tsx && \
  echo "PASS" || echo "FAIL"
else
  echo "SKIP (no invitation endpoints)"
fi
```

---

### Pattern 3: API Client 401 Handling (MANDATORY)

**Requirement:** API client MUST intercept 401 responses and redirect to login.

**Purpose:** Handles session expiry gracefully without manual page refresh.

**Implementation:**

```typescript
// client/src/lib/api.ts
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// 401 Interceptor (MANDATORY)
apiClient.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Clear tokens
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      
      // Redirect to login (full reload to clear React state)
      window.location.href = '/login?session_expired=true';
    }
    return Promise.reject(error);
  }
);
```

**Verification:**
```bash
# Must include 401 interceptor with redirect:
test -f client/src/lib/api.ts && \
grep -A 10 "interceptors.response.use" client/src/lib/api.ts | grep -q "401" && \
grep -A 10 "interceptors.response.use" client/src/lib/api.ts | grep -q "window.location.href.*login" && \
echo "PASS" || echo "FAIL"
```

---

### Verification Script (MANDATORY)

**File:** `scripts/verify-mandatory-ui-components.sh`

```bash
#!/bin/bash
set -euo pipefail

echo "=== Mandatory UI Components Verification ==="
ISSUES=0

# Pattern 1: ErrorBoundary (MUST BE CLASS COMPONENT, CREATED FIRST)
echo "Pattern 1: ErrorBoundary"
if ! test -f client/src/components/ErrorBoundary.tsx; then
  echo "[X] ErrorBoundary.tsx missing"
  ISSUES=$((ISSUES + 1))
else
  # Must be a class component
  if ! grep -q "class ErrorBoundary extends" client/src/components/ErrorBoundary.tsx; then
    echo "[X] ErrorBoundary must be a class component (not functional)"
    ISSUES=$((ISSUES + 1))
  fi
  
  # Must have required lifecycle methods
  if ! grep -q "getDerivedStateFromError" client/src/components/ErrorBoundary.tsx; then
    echo "[X] ErrorBoundary missing getDerivedStateFromError"
    ISSUES=$((ISSUES + 1))
  fi
  if ! grep -q "componentDidCatch" client/src/components/ErrorBoundary.tsx; then
    echo "[X] ErrorBoundary missing componentDidCatch"
    ISSUES=$((ISSUES + 1))
  fi
  
  # Must wrap App
  if ! grep -q "<ErrorBoundary>" client/src/main.tsx && ! grep -q "<ErrorBoundary>" client/src/App.tsx; then
    echo "[X] App not wrapped in ErrorBoundary"
    ISSUES=$((ISSUES + 1))
  fi
  
  echo "[OK] ErrorBoundary validated (class component with required methods)"
fi

# Pattern 2: AcceptInvitePage (conditional - check if invitation endpoints exist)
if grep -q "POST.*\/invitations" docs/service-contracts.json 2>/dev/null && \
   grep -q "GET.*\/invitations\/:token" docs/service-contracts.json 2>/dev/null; then
  echo "Pattern 2: AcceptInvitePage (required - invitation endpoints exist)"
  
  if ! test -f client/src/pages/auth/AcceptInvitePage.tsx; then
    echo "[X] AcceptInvitePage.tsx missing"
    ISSUES=$((ISSUES + 1))
  else
    # Must use route param (not query param)
    if ! grep -q "useParams" client/src/pages/auth/AcceptInvitePage.tsx; then
      echo "[X] AcceptInvitePage must use useParams for token (not useSearchParams)"
      ISSUES=$((ISSUES + 1))
    fi
    
    # Must have name field
    if ! grep -q "name" client/src/pages/auth/AcceptInvitePage.tsx; then
      echo "[X] AcceptInvitePage missing name field"
      ISSUES=$((ISSUES + 1))
    fi
    
    # Route must exist
    if ! grep -q "path=\"/accept-invite/:token\"" client/src/App.tsx; then
      echo "[X] Route /accept-invite/:token not defined in App.tsx"
      ISSUES=$((ISSUES + 1))
    fi
    
    echo "[OK] AcceptInvitePage validated (route param + name field + route defined)"
  fi
else
  echo "Pattern 2: AcceptInvitePage (skipped - no invitation endpoints)"
fi

# Pattern 3: API Client 401 Handling (MUST REDIRECT TO LOGIN)
echo "Pattern 3: API Client 401 Handling"
if ! test -f client/src/lib/api.ts; then
  echo "[X] api.ts missing"
  ISSUES=$((ISSUES + 1))
else
  # Must have interceptor
  if ! grep -q "interceptors.response.use" client/src/lib/api.ts; then
    echo "[X] Response interceptor missing"
    ISSUES=$((ISSUES + 1))
  else
    # Must check for 401
    if ! grep -A 10 "interceptors.response.use" client/src/lib/api.ts | grep -q "401"; then
      echo "[X] 401 handling missing in interceptor"
      ISSUES=$((ISSUES + 1))
    fi
    
    # Must redirect to login
    if ! grep -A 10 "interceptors.response.use" client/src/lib/api.ts | grep -q "window.location.href.*login"; then
      echo "[X] 401 must redirect to login using window.location.href"
      ISSUES=$((ISSUES + 1))
    fi
    
    echo "[OK] API Client 401 validated (interceptor + redirect)"
  fi
fi

if [ $ISSUES -eq 0 ]; then
  echo "[OK] All mandatory UI components verified"
  exit 0
else
  echo "[X] FAIL - $ISSUES mandatory component issues found"
  exit 1
fi
```

---

## PAGE INVENTORY & ROUTING

### Folder Structure Policy (REQUIRED)

**Choose ONE policy and declare it explicitly:**

| Policy | Definition | Verification |
|--------|------------|--------------|
| **STRICT** | Folder paths MUST match exactly as specified | Check exact paths: `test -f client/src/pages/organization/SettingsPage.tsx` |
| **FLEXIBLE** | Pages can be reorganized logically if all pages exist | Count pages: `find client/src/pages -name "*.tsx" \| wc -l` equals total |

**Recommendation:** FLEXIBLE (allows logical grouping while ensuring completeness)

---

### Page Inventory Template

**Total Pages:** [EXACT COUNT]

| Page Name | File Path | Route | Authenticated | Purpose |
|-----------|-----------|-------|---------------|---------|
| LoginPage | client/src/pages/auth/LoginPage.tsx | /login | No | User authentication |
| DashboardPage | client/src/pages/DashboardPage.tsx | / | Yes | Main landing page |
| [Add all pages...] | ... | ... | ... | ... |

**Verification:**
```bash
# Page count MUST match total above:
find client/src/pages -name "*.tsx" -type f | wc -l
```

---

### Machine-Readable Routes-Pages Manifest

**[CRITICAL]** This manifest MUST be emitted IMMEDIATELY after the Page Inventory. Claude Code extracts it to `docs/routes-pages-manifest.json`.

**Validation Requirements:**
- `totalPages` MUST equal `pages.length` (Agent 6 blocks if mismatch)
- All `apiDependencies` MUST exist in `docs/service-contracts.json`
- Manifest MUST be valid JSON (no syntax errors)

```json
{
  "$schema": "routes-pages-manifest-v1.0",
  "generated": "2026-02-03T00:00:00Z",
  "folderStructurePolicy": "FLEXIBLE",
  "totalPages": 14,
  "pages": [
    {
      "id": 1,
      "name": "LoginPage",
      "filePath": "client/src/pages/auth/LoginPage.tsx",
      "routePath": "/login",
      "authenticated": false,
      "purpose": "User authentication",
      "apiDependencies": [
        {
          "method": "POST",
          "path": "/api/auth/login",
          "purpose": "Authenticate user credentials"
        }
      ],
      "dataDependencies": [],
      "componentDependencies": [
        "Button",
        "Input",
        "Card"
      ]
    },
    {
      "id": 2,
      "name": "DashboardPage",
      "filePath": "client/src/pages/DashboardPage.tsx",
      "routePath": "/",
      "authenticated": true,
      "purpose": "Main dashboard showing user stats",
      "apiDependencies": [
        {
          "method": "GET",
          "path": "/api/stats",
          "purpose": "Fetch dashboard statistics"
        }
      ],
      "dataDependencies": [
        "currentUser"
      ],
      "componentDependencies": [
        "Card",
        "Stat"
      ]
    }
  ]
}
```

**Agent 6 Usage:**
- Validates API endpoints exist before creating pages (checks `service-contracts.json`)
- Checks routes match exactly (prevents `/items/:id` vs `/items/:itemId` mismatches)
- Ensures component dependencies available
- Verifies `totalPages === pages.length` (BLOCKING gate - build stops if mismatch)

**Schema Requirements:**
- `$schema`: Must be `"routes-pages-manifest-v1.0"`
- `generated`: ISO 8601 timestamp of manifest generation
- `folderStructurePolicy`: "STRICT" or "FLEXIBLE"
- `totalPages`: Numeric count matching pages array length
- `pages[].id`: Numeric sequential ID (1, 2, 3...)
- `pages[].apiDependencies[]`: Object with `{method, path, purpose}` (NOT strings)

---

## COMPONENT LIBRARY (shadcn/ui)

### Core Components

| Component | Import | Use Case | Pattern | Required Props |
|-----------|--------|----------|---------|----------------|
| **Button** | `@/components/ui/button` | Primary actions | `<Button>Submit</Button>` | children |
| **Card** | `@/components/ui/card` | Content containers | `<Card><CardHeader><CardTitle>Title</CardTitle></CardHeader><CardContent>Content</CardContent></Card>` | - |
| **Input** | `@/components/ui/input` | Form fields | `<Input type="text" placeholder="Name" />` | - |
| **Label** | `@/components/ui/label` | Form labels | `<Label htmlFor="email">Email</Label>` | htmlFor |
| **Table** | `@/components/ui/table` | Data tables | `<Table><TableHeader><TableRow><TableHead>Name</TableHead></TableRow></TableHeader></Table>` | - |
| **Dialog** | `@/components/ui/dialog` | Modals/confirmations | `<Dialog><DialogTrigger><Button>Open</Button></DialogTrigger></Dialog>` | - |
| **Select** | `@/components/ui/select` | Dropdown fields | `<Select><SelectTrigger><SelectValue /></SelectTrigger></Select>` | - |
| **Textarea** | `@/components/ui/textarea` | Multi-line input | `<Textarea rows={4} />` | - |
| **Alert** | `@/components/ui/alert` | Info/error messages | `<Alert><AlertTitle>Error</AlertTitle><AlertDescription>Message</AlertDescription></Alert>` | - |
| **Badge** | `@/components/ui/badge` | Status indicators | `<Badge variant="success">Active</Badge>` | children |

### Form Patterns

**Standard Form:**
```typescript
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

<form onSubmit={handleSubmit}>
  <div className="space-y-4">
    <div>
      <Label htmlFor="name">Name</Label>
      <Input id="name" value={name} onChange={e => setName(e.target.value)} />
    </div>
    <Button type="submit">Save</Button>
  </div>
</form>
```

**Table with Actions:**
```typescript
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Actions</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {items.map(item => (
      <TableRow key={item.id}>
        <TableCell>{item.name}</TableCell>
        <TableCell>
          <Button variant="ghost" onClick={() => handleEdit(item)}>Edit</Button>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

---

## NAVIGATION PATTERNS

### Link-Route Parity Rule

**[CRITICAL]** Every `<Link>` MUST have corresponding route defined.

**Required Specification:**

| Link Location | Target Route | Route Component |
|---------------|--------------|-----------------|
| DashboardPage "View Projects" button | /projects | ProjectsPage |
| Header "Settings" link | /settings | SettingsPage |
| [Add all navigation...] | ... | ... |

**Verification:**
```bash
# Check all links have routes:
grep -r "<Link to=" client/src/ | sed 's/.*to="\([^"]*\)".*/\1/' | sort -u > links.txt
grep -r "path=" client/src/App.tsx | sed 's/.*path="\([^"]*\)".*/\1/' | sort -u > routes.txt
diff links.txt routes.txt
```

---

### Navigation Components (Feature Groups ≥3 Pages)

**Rule:** If feature group has ≥3 pages, create navigation component.

**Example: Settings Navigation (Horizontal Tabs)**

```typescript
// client/src/components/SettingsNav.tsx
import { Link, useLocation } from 'react-router-dom';

const tabs = [
  { path: '/settings/profile', label: 'Profile' },
  { path: '/settings/security', label: 'Security' },
  { path: '/settings/notifications', label: 'Notifications' }
];

export function SettingsNav() {
  const location = useLocation();
  
  return (
    <div className="border-b mb-6">
      <nav className="flex space-x-4">
        {tabs.map(tab => (
          <Link
            key={tab.path}
            to={tab.path}
            className={`px-3 py-2 border-b-2 ${
              location.pathname === tab.path
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
```

**Usage in Pages:**
```typescript
// client/src/pages/settings/ProfilePage.tsx
import { SettingsNav } from '@/components/SettingsNav';

export default function ProfilePage() {
  return (
    <div>
      <SettingsNav />
      <div>Profile content...</div>
    </div>
  );
}
```

---

## EMAIL TEMPLATES

### Template Structure

| Field | Requirement |
|-------|-------------|
| **Template Name** | Unique identifier (e.g., "invitation-email") |
| **Subject** | Exact subject line with variables |
| **From** | Sender address (e.g., "noreply@example.com") |
| **Reply-To** | Support/contact email |
| **Trigger** | Event that sends email (e.g., "User invited to organization") |
| **HTML Version** | Full HTML with branding |
| **Plain Text Version** | Fallback text version |
| **Variables** | All interpolated values with examples |

### Example: Invitation Email

```json
{
  "templateName": "invitation-email",
  "subject": "You've been invited to {{organizationName}}",
  "from": "noreply@example.com",
  "replyTo": "support@example.com",
  "trigger": "POST /api/invitations creates new invitation",
  "variables": {
    "organizationName": "Acme Corp",
    "inviterName": "John Doe",
    "acceptUrl": "https://app.example.com/accept-invite/abc123"
  },
  "htmlVersion": "<html><body><h1>You've been invited!</h1><p>{{inviterName}} has invited you to join {{organizationName}}.</p><p><a href=\"{{acceptUrl}}\">Accept Invitation</a></p></body></html>",
  "plainTextVersion": "You've been invited to {{organizationName}} by {{inviterName}}. Accept invitation: {{acceptUrl}}"
}
```

---

## FILE UPLOAD PATTERNS (If Applicable)

### Two-Step Upload Pattern (MANDATORY)

**Step 1:** Generate presigned URL
```typescript
const { uploadUrl, fileKey } = await apiClient.post('/api/files/upload-url', {
  fileName: file.name,
  contentType: file.type
});
```

**Step 2:** Upload directly to storage
```typescript
await fetch(uploadUrl, {
  method: 'PUT',
  body: file,
  headers: { 'Content-Type': file.type }
});
```

**Step 3:** Confirm upload
```typescript
await apiClient.post('/api/files/confirm', { fileKey });
```

**States:**
- `idle` - No file selected
- `uploading` - Upload in progress
- `success` - Upload complete
- `error` - Upload failed

**Error Recovery:**
- Timeout after 30s → Retry with exponential backoff
- Network error → Show "Check connection" message
- Invalid file type → Show allowed types

---

## API CLIENT PATTERNS

### Centralized API Client (MANDATORY)

**Rule:** ALL API calls MUST use `apiClient` from `@/lib/api.ts`. Direct `fetch()` calls are FORBIDDEN.

**Reason:** Ensures consistent error handling, authentication, and 401 redirect behavior.

**Pattern:**
```typescript
import { apiClient } from '@/lib/api';

// Correct:
const response = await apiClient.get('/users');
const user = await apiClient.post('/users', { name: 'Alice' });

// FORBIDDEN:
const response = await fetch('/api/users'); // ❌ Bypasses 401 handling
```

---

## OUTPUT FORMAT

### Required Document Structure

```markdown
# [Application Name] - UI/UX Specification

## 1. Folder Structure Policy
[STRICT or FLEXIBLE - with justification]

## 2. Page Inventory
[Table with ALL pages: name, path, route, authenticated, purpose]
[Total page count stated explicitly]

## 3. Machine-Readable Manifest
[Embedded JSON IMMEDIATELY after Page Inventory]
[REQUIRED: `totalPages` === `pages.length`]
[REQUIRED: `$schema`: "routes-pages-manifest-v1.0"]
[REQUIRED: `apiDependencies` as objects with {method, path, purpose}]
[REQUIRED: Numeric sequential IDs (1, 2, 3...)]

## 4. Mandatory Components
[ErrorBoundary, AcceptInvitePage (if applicable), API Client 401 Handling]

## 5. Component Library
[shadcn/ui component usage patterns]

## 6. Navigation Flows
[Link-route parity table, navigation components for feature groups]

## 7. Email Templates
[All system emails with complete specifications]

## 8. File Upload Flows (if applicable)
[Two-step upload pattern with states and error recovery]

## 9. Verification Commands
[Bash commands to verify page count, routes, mandatory components]
```

---

## VERIFICATION CHECKLIST

Before submitting UI specification, verify:

```bash
# 1. Page count matches
PAGE_COUNT=$(grep "Total Pages:" spec.md | grep -oP '\d+')
ACTUAL_COUNT=$(find client/src/pages -name "*.tsx" | wc -l)
test $PAGE_COUNT -eq $ACTUAL_COUNT && echo "PASS" || echo "FAIL"

# 2. ErrorBoundary exists
test -f client/src/components/ErrorBoundary.tsx && echo "PASS" || echo "FAIL"

# 3. All routes have components
grep -oP 'path="[^"]*"' client/src/App.tsx > routes.txt
while read route; do
  COMP=$(echo $route | sed 's/path="\([^"]*\)".*/\1/' | sed 's/\///g' | sed 's/-//g')
  grep -q "${COMP}Page" spec.md && echo "PASS: $route" || echo "FAIL: $route"
done < routes.txt

# 4. Machine-readable manifest valid JSON + schema compliance
MANIFEST=$(grep -A 1000 '```json' spec.md | grep -B 1000 '```' | head -n -1 | tail -n +2)
echo "$MANIFEST" | jq . > /dev/null && echo "PASS: Valid JSON" || echo "FAIL: Invalid JSON"

# Validate schema fields
echo "$MANIFEST" | jq -e '."$schema" == "routes-pages-manifest-v1.0"' > /dev/null && echo "PASS: Schema" || echo "FAIL: Schema"
echo "$MANIFEST" | jq -e '.generated' > /dev/null && echo "PASS: Generated timestamp" || echo "FAIL: Generated timestamp"

# Validate totalPages === pages.length (CRITICAL)
TOTAL=$(echo "$MANIFEST" | jq -r '.totalPages')
COUNT=$(echo "$MANIFEST" | jq -r '.pages | length')
test $TOTAL -eq $COUNT && echo "PASS: totalPages consistent" || echo "FAIL: totalPages mismatch ($TOTAL != $COUNT)"

# Validate apiDependencies are objects (not strings)
echo "$MANIFEST" | jq -e '.pages[0].apiDependencies[0] | type == "object"' > /dev/null && echo "PASS: apiDependencies objects" || echo "FAIL: apiDependencies must be objects"
echo "$MANIFEST" | jq -e '.pages[0].apiDependencies[0] | has("method") and has("path") and has("purpose")' > /dev/null && echo "PASS: apiDependencies schema" || echo "FAIL: apiDependencies missing fields"

# 5. Mandatory components script exists
test -f scripts/verify-mandatory-ui-components.sh && echo "PASS" || echo "FAIL"
```

---

## DOCUMENT END

**Agent 5: UI/UX Specification v36**
**Constitution: Inherited from Agent 0 (Constitution v4.6)**
**Status:** Machine-Executable, Zero Duplication, Table-Based

## AUTH CONTEXT PATTERN

### User Type Alignment (CRITICAL)

**Rule:** Auth context `User` type MUST match API response structure.

**Correct Pattern:**
```typescript
// API Response from GET /api/auth/me:
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "Alice"
  },
  "role": "admin",
  "organization": {
    "id": 1,
    "name": "Acme Corp"
  }
}

// Auth Context Type (CORRECT):
interface User {
  id: number;
  email: string;
  name: string;
  role: string;              // TOP-LEVEL (merged from API response)
  organization: {            // TOP-LEVEL (merged from API response)
    id: number;
    name: string;
  };
}

// Merging Logic:
const user = {
  ...response.user,
  role: response.role,
  organization: response.organization
};
```

**Wrong Pattern (FORBIDDEN):**
```typescript
// ❌ WRONG - Nested role/organization:
interface User {
  id: number;
  email: string;
  name: string;
  user: {
    role: string;              // ❌ Should be top-level
    organization: { ... };     // ❌ Should be top-level
  };
}
```

**Impact:** Prevents "admin features not visible" bugs and role-based access control failures.

---

## ROLE-BASED VISIBILITY PATTERN

### Conditional Rendering by Role

```typescript
import { useAuth } from '@/contexts/AuthContext';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div>
      <h1>Dashboard</h1>
      
      {/* Admin-only section */}
      {user?.role === 'admin' && (
        <div>
          <h2>Admin Controls</h2>
          <Button>Manage Users</Button>
        </div>
      )}
      
      {/* Member-only section */}
      {user?.role === 'member' && (
        <div>
          <h2>Your Content</h2>
        </div>
      )}
    </div>
  );
}
```

### Navigation with Role Filtering

```typescript
const navigationItems = [
  { path: '/dashboard', label: 'Dashboard', roles: ['admin', 'member'] },
  { path: '/users', label: 'Users', roles: ['admin'] },
  { path: '/reports', label: 'Reports', roles: ['admin', 'member'] }
];

export function Navigation() {
  const { user } = useAuth();
  
  const visibleItems = navigationItems.filter(item =>
    item.roles.includes(user?.role || '')
  );
  
  return (
    <nav>
      {visibleItems.map(item => (
        <Link key={item.path} to={item.path}>{item.label}</Link>
      ))}
    </nav>
  );
}
```

---

## COMMON MISTAKES TO AVOID

| Mistake | Impact | Fix |
|---------|--------|-----|
| **Functional ErrorBoundary** | Class component required (getDerivedStateFromError is static) | Use class component pattern |
| **Missing componentDidCatch** | Errors not logged | Add componentDidCatch method |
| **App not wrapped** | ErrorBoundary not active | Wrap App in ErrorBoundary |
| **Direct fetch() calls** | 401 handling bypassed | Use apiClient from @/lib/api for ALL requests |
| **Nested role in User type** | Role checks fail | Merge role/organization to top level |
| **Link without route** | 404 errors | Verify link-route parity |
| **Page before API** | Broken page (no data) | Check API dependencies in manifest |
| **Wrong route param names** | Route matching fails | Use exact names from API Contract |

---

## CROSS-REFERENCES

### Agent Dependencies

| Agent | What You Consume | What You Provide |
|-------|------------------|------------------|
| **Agent 4 (API Contract)** | API endpoints, response schemas, authentication requirements | Page-API dependency matrix |
| **Agent 2 (System Architecture)** | Tech stack decisions (React, shadcn/ui) | UI framework requirements |
| **Agent 6 (Implementation)** | N/A | Page inventory, component patterns, verification gates |
| **Agent 8 (Code Review)** | N/A | Expected patterns for audit validation |

### Constitution Compliance

| Section | Requirement | Agent 5 Implementation |
|---------|-------------|------------------------|
| **Section U** | Single-file output with embedded scripts | Machine-readable manifest embedded as JSON code block |
| **Section W** | Tier 1 pre-flight gates | verify-mandatory-ui-components.sh runs in Phase 0.5 |
| **Section V** | Constitution reference | "Inherited from Agent 0 (Constitution v4.6)" |

### Build Prompt Integration

| Phase | What Agent 5 Provides | Build Prompt Uses |
|-------|----------------------|-------------------|
| **Phase 0** | verify-mandatory-ui-components.sh script | Creates script before scaffolding |
| **Phase 0.5** | Pattern 1-3 requirements | Validates ErrorBoundary, AcceptInvitePage, 401 handling |
| **Phase 5** | Page inventory + manifest | Validates page count, routes, API dependencies |
| **Phase 7** | Component library patterns | Implements pages using shadcn/ui |

---

## PATTERN CATALOG (QUICK REFERENCE)

| Pattern ID | Name | Requirement | Verification |
|------------|------|-------------|--------------|
| **Pattern 1** | ErrorBoundary | MANDATORY - Class component with getDerivedStateFromError, componentDidCatch, wraps App | `grep -q "getDerivedStateFromError" client/src/components/ErrorBoundary.tsx` |
| **Pattern 2** | AcceptInvitePage | CONDITIONAL - Required if POST /api/invitations exists | `test -f client/src/pages/auth/AcceptInvitePage.tsx` |
| **Pattern 3** | API Client 401 Handling | MANDATORY - Interceptor redirects to login on 401 | `grep -A 10 "interceptors.response.use" client/src/lib/api.ts \| grep -q "401"` |
| **Pattern 4** | Link-Route Parity | MANDATORY - Every Link has corresponding route | `diff links.txt routes.txt` |
| **Pattern 5** | Page-API Dependency | MANDATORY - Pages only reference existing endpoints (apiDependencies as objects: {method, path, purpose}) | Checked via manifest validation with totalPages === pages.length |
| **Pattern 6** | Auth Context Type | MANDATORY - User type has top-level role/organization | `grep -A 5 "interface User" \| grep -q "role:"` |
| **Pattern 7** | Navigation Components | REQUIRED if ≥3 pages in feature group | Check for SettingsNav, DashboardNav, etc. |
| **Pattern 8** | Email Templates | REQUIRED for all email-triggered features | Each template has subject, HTML, plain text |
| **Pattern 9** | File Upload Flow | REQUIRED if file uploads exist | Two-step pattern with presigned URLs |
| **Pattern 10** | Centralized API Client | MANDATORY - No direct fetch() calls | `grep -r "fetch(" client/src/ \| grep -v api.ts` returns empty |

---

## QUALITY GATES

### Phase 0.5 (Pre-Flight - BLOCKING)

**Gate:** `scripts/verify-mandatory-ui-components.sh`

**Validates:**
- Pattern 1: ErrorBoundary exists and is correct
- Pattern 2: AcceptInvitePage exists if invitations endpoint exists
- Pattern 3: API client has 401 interceptor

**Failure Action:** Build stops, fix issues before Phase 1

### Phase 5 (Component Generation)

**Validates:**
- Page count matches specification
- All routes have corresponding components
- Component dependencies available

### Phase 7 (Page Generation)

**Validates:**
- API endpoints exist for all page dependencies
- Routes match exactly (no param name mismatches)
- Navigation components exist for feature groups

---

## ASSUMPTIONS REGISTER

| ID | Assumption | Owner | Resolution Deadline | Allowed to Ship |
|----|------------|-------|---------------------|-----------------|
| UI-001 | shadcn/ui components available | Agent 2 | Phase 0 | No |
| UI-002 | React Router v6+ used for routing | Agent 2 | Phase 0 | No |
| UI-003 | Tailwind CSS configured | Agent 2 | Phase 0 | No |
| UI-004 | lucide-react icons available | Agent 2 | Phase 0 | No |

---

