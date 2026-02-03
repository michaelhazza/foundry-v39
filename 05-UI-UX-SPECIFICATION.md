# UI/UX Specification: Foundry
## Version 1.0

**Document ID:** 05-UI-UX-SPECIFICATION  
**Created:** 2026-02-03  
**Agent:** Agent 5 (UI/UX Specification v36)  
**Framework:** Agent Specification Framework v2.1  
**Constitution:** Inherited from Agent 0 v4.6  
**Status:** ACTIVE  
**Input Sources:** 01-PRD.md, 02-ARCHITECTURE.md, 03-DATA-MODEL.md, 04-API-CONTRACT.md

---

## INHERITED CONSTITUTION

This UI/UX specification inherits **Agent 0: Agent Constitution v4.6**. Global rules are not restated here.

Reference Constitution for:
- Single-file output with embedded scripts (Section U)
- Tier 1 pre-flight gates (Section W)
- ErrorBoundary requirements
- JWT storage patterns

Changes to global conventions require `AR-### CHANGE_REQUEST` in Assumption Register.

---

## EXECUTIVE SUMMARY

### Application Overview

Foundry is a multi-tenant SaaS platform that transforms raw business data into AI-ready datasets. The UI provides:

- **Authentication:** Registration, login, password reset workflows
- **Project Management:** Create, configure, and manage data preparation projects
- **Data Pipeline:** Upload files, connect APIs, configure transformations
- **Processing:** Monitor batch jobs, review PII detection, configure de-identification
- **Export Management:** Download datasets in multiple formats
- **Team Collaboration:** User management, role-based access, organization settings

### UI Technology Stack

- **Framework:** React 18+ with TypeScript
- **Routing:** React Router v6
- **Styling:** Tailwind CSS
- **Components:** shadcn/ui (Radix UI primitives)
- **Icons:** lucide-react
- **Forms:** React Hook Form + Zod validation
- **State Management:** React Context (Auth, Theme)
- **API Client:** Axios with interceptors

### Page Inventory

**Total Pages:** 23 pages across 8 feature groups

| Feature Group | Page Count | Purpose |
|---------------|------------|---------|
| **Authentication** | 5 | Login, register, password reset, email verification |
| **Dashboard** | 1 | Overview with stats and recent activity |
| **Projects** | 5 | List, create, detail, edit, configure |
| **Data Sources** | 3 | Upload files, connect APIs, view details |
| **Processing** | 3 | Job monitoring, PII review, configuration |
| **Datasets** | 2 | List datasets, export management |
| **Users** | 2 | User management, team invitations |
| **Settings** | 2 | Organization settings, user profile |

---

## SECTION 1: PAGE INVENTORY

### Page Summary Table

| # | Page Name | Route | File Path | Auth Required | Role | API Dependencies |
|---|-----------|-------|-----------|---------------|------|------------------|
| 1 | Landing Page | `/` | `pages/LandingPage.tsx` | No | Public | None |
| 2 | Login | `/login` | `pages/auth/LoginPage.tsx` | No | Public | `POST /api/auth/login` |
| 3 | Register | `/register` | `pages/auth/RegisterPage.tsx` | No | Public | `POST /api/auth/register` |
| 4 | Forgot Password | `/forgot-password` | `pages/auth/ForgotPasswordPage.tsx` | No | Public | `POST /api/auth/forgot-password` |
| 5 | Reset Password | `/reset-password` | `pages/auth/ResetPasswordPage.tsx` | No | Public | `POST /api/auth/reset-password` |
| 6 | Dashboard | `/dashboard` | `pages/DashboardPage.tsx` | Yes | All | `GET /api/organizations/current/stats`, `GET /api/projects` |
| 7 | Projects List | `/projects` | `pages/projects/ProjectsListPage.tsx` | Yes | All | `GET /api/projects` |
| 8 | Create Project | `/projects/new` | `pages/projects/CreateProjectPage.tsx` | Yes | Admin, Member | `POST /api/projects` |
| 9 | Project Detail | `/projects/:id` | `pages/projects/ProjectDetailPage.tsx` | Yes | All | `GET /api/projects/:id`, `GET /api/projects/:projectId/data-sources` |
| 10 | Edit Project | `/projects/:id/edit` | `pages/projects/EditProjectPage.tsx` | Yes | Admin, Member | `GET /api/projects/:id`, `PATCH /api/projects/:id` |
| 11 | Project Settings | `/projects/:id/settings` | `pages/projects/ProjectSettingsPage.tsx` | Yes | Admin, Member | `GET /api/projects/:id`, `DELETE /api/projects/:id` |
| 12 | Upload Data | `/projects/:projectId/upload` | `pages/data-sources/UploadDataPage.tsx` | Yes | Admin, Member | `POST /api/projects/:projectId/data-sources/upload` |
| 13 | Connect API | `/projects/:projectId/connect-api` | `pages/data-sources/ConnectAPIPage.tsx` | Yes | Admin, Member | `POST /api/projects/:projectId/data-sources/api` |
| 14 | Data Source Detail | `/projects/:projectId/data-sources/:id` | `pages/data-sources/DataSourceDetailPage.tsx` | Yes | All | `GET /api/projects/:projectId/data-sources/:id` |
| 15 | Processing Jobs | `/projects/:projectId/jobs` | `pages/processing/ProcessingJobsPage.tsx` | Yes | All | `GET /api/projects/:projectId/jobs` |
| 16 | Job Detail | `/projects/:projectId/jobs/:id` | `pages/processing/JobDetailPage.tsx` | Yes | All | `GET /api/projects/:projectId/jobs/:id` |
| 17 | Configure Processing | `/projects/:projectId/configure` | `pages/processing/ConfigureProcessingPage.tsx` | Yes | Admin, Member | `GET /api/projects/:projectId/schema-mappings`, `POST /api/projects/:projectId/schema-mappings`, `GET /api/projects/:projectId/deidentification-rules`, `POST /api/projects/:projectId/deidentification-rules` |
| 18 | Datasets | `/projects/:projectId/datasets` | `pages/datasets/DatasetsPage.tsx` | Yes | All | `GET /api/projects/:projectId/datasets` |
| 19 | Export Dataset | `/projects/:projectId/datasets/:id/export` | `pages/datasets/ExportDatasetPage.tsx` | Yes | All | `GET /api/projects/:projectId/datasets/:id/download` |
| 20 | Users Management | `/users` | `pages/users/UsersPage.tsx` | Yes | Admin | `GET /api/users` |
| 21 | Invite User | `/users/invite` | `pages/users/InviteUserPage.tsx` | Yes | Admin | `POST /api/users/invite` |
| 22 | Organization Settings | `/settings/organization` | `pages/settings/OrganizationSettingsPage.tsx` | Yes | Admin | `GET /api/organizations/current`, `PATCH /api/organizations/current` |
| 23 | User Profile | `/settings/profile` | `pages/settings/ProfilePage.tsx` | Yes | All | `GET /api/users/me`, `PATCH /api/users/:id` |

**Folder Structure Policy:** STRICT (paths must match exactly as specified)

---

## SECTION 2: MANDATORY COMPONENTS

### Pattern 1: ErrorBoundary (BLOCKING - CREATE FIRST)

**File:** `client/src/components/ErrorBoundary.tsx`

**Implementation:**
```typescript
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
        <div className="flex min-h-screen items-center justify-center p-4 bg-gray-50">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h1 className="text-2xl font-bold mb-2 text-gray-900">Something went wrong</h1>
            <p className="text-gray-600 mb-6">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <Button
              onClick={() => window.location.reload()}
              className="w-full"
            >
              Reload Page
            </Button>
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
// client/src/main.tsx
import { ErrorBoundary } from '@/components/ErrorBoundary';

<ErrorBoundary>
  <App />
</ErrorBoundary>
```

**Verification:**
```bash
grep -q "class ErrorBoundary" client/src/components/ErrorBoundary.tsx && \
grep -q "getDerivedStateFromError" client/src/components/ErrorBoundary.tsx && \
grep -q "componentDidCatch" client/src/components/ErrorBoundary.tsx && \
grep -q "<ErrorBoundary>" client/src/main.tsx
```

---

### Pattern 2: API Client with 401 Handling (MANDATORY)

**File:** `client/src/lib/api.ts`

**Implementation:**
```typescript
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor: Add JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Handle 401 errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 401 Unauthorized: Redirect to login
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Clear tokens
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      
      // Redirect to login
      window.location.href = '/login';
      
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);
```

**Verification:**
```bash
grep -A 10 "interceptors.response.use" client/src/lib/api.ts | grep -q "401"
```

---

### Pattern 3: Auth Context (MANDATORY)

**File:** `client/src/contexts/AuthContext.tsx`

**Implementation:**
```typescript
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient } from '@/lib/api';

interface User {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'member' | 'viewer';
  organizationId: number;
  emailVerified: boolean;
  organization: {
    id: number;
    name: string;
    subscriptionTier: 'free' | 'pro' | 'enterprise';
  };
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, organizationName: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const response = await apiClient.get('/auth/me');
          // Merge role and organization to top level
          setUser({
            ...response.data.user,
            role: response.data.role,
            organization: response.data.organization
          });
        } catch (error) {
          console.error('Auth initialization failed:', error);
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await apiClient.post('/auth/login', { email, password });
    localStorage.setItem('accessToken', response.data.accessToken);
    localStorage.setItem('refreshToken', response.data.refreshToken);
    setUser({
      ...response.data.user,
      role: response.data.user.role,
      organization: response.data.organization
    });
  };

  const register = async (email: string, password: string, name: string, organizationName: string) => {
    const response = await apiClient.post('/auth/register', {
      email,
      password,
      name,
      organizationName
    });
    localStorage.setItem('accessToken', response.data.accessToken);
    localStorage.setItem('refreshToken', response.data.refreshToken);
    setUser({
      ...response.data.user,
      role: response.data.user.role,
      organization: response.data.organization
    });
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      try {
        await apiClient.post('/auth/logout', { refreshToken });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
  };

  const refreshUser = async () => {
    const response = await apiClient.get('/auth/me');
    setUser({
      ...response.data.user,
      role: response.data.role,
      organization: response.data.organization
    });
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

**Verification:**
```bash
grep -A 5 "interface User" client/src/contexts/AuthContext.tsx | grep -q "role:"
```

---

## SECTION 3: NAVIGATION STRUCTURE

### Main Navigation

**File:** `client/src/components/Navigation.tsx`

**Menu Structure:**

```typescript
const navigationItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'member', 'viewer'] },
  { path: '/projects', label: 'Projects', icon: FolderKanban, roles: ['admin', 'member', 'viewer'] },
  { path: '/users', label: 'Users', icon: Users, roles: ['admin'] },
  { path: '/settings/organization', label: 'Settings', icon: Settings, roles: ['admin'] },
  { path: '/settings/profile', label: 'Profile', icon: User, roles: ['admin', 'member', 'viewer'] }
];
```

**Filtering Logic:**
```typescript
const visibleItems = navigationItems.filter(item =>
  item.roles.includes(user?.role || '')
);
```

---

### Project Detail Navigation

**File:** `client/src/components/ProjectNav.tsx`

**Sub-Navigation for Project Pages:**

```typescript
const projectNavItems = [
  { path: `/projects/${projectId}`, label: 'Overview', icon: Home },
  { path: `/projects/${projectId}/upload`, label: 'Add Data', icon: Upload },
  { path: `/projects/${projectId}/jobs`, label: 'Processing', icon: Activity },
  { path: `/projects/${projectId}/configure`, label: 'Configure', icon: Settings },
  { path: `/projects/${projectId}/datasets`, label: 'Datasets', icon: Database },
  { path: `/projects/${projectId}/settings`, label: 'Settings', icon: Cog }
];
```

**Role-Based Restrictions:**
- Viewers: Can only access Overview, Processing, and Datasets (read-only)
- Members: Can access all tabs except Settings
- Admins: Full access to all tabs

---

## SECTION 4: COMPONENT LIBRARY

### shadcn/ui Components Used

| Component | Usage | Pages |
|-----------|-------|-------|
| `Button` | Primary actions, form submissions | All pages |
| `Input` | Text fields, email, password | Auth pages, forms |
| `Label` | Form field labels | All forms |
| `Card` | Content containers, stat displays | Dashboard, project cards |
| `Table` | Data lists (projects, users, datasets) | List pages |
| `Dialog` | Modals (delete confirmations, invitations) | Settings, user management |
| `Alert` | Error messages, warnings, success notifications | All pages |
| `Badge` | Status indicators (job status, role badges) | Jobs, users |
| `Tabs` | Project detail sections | Project detail |
| `Select` | Dropdowns (roles, formats, schemas) | Forms |
| `Textarea` | Multi-line text (descriptions, rules) | Project forms |
| `Checkbox` | Multi-select (PII types, export options) | Configuration |
| `RadioGroup` | Single select (export format) | Export page |
| `Progress` | Job progress indicators | Processing pages |
| `Separator` | Visual dividers | Settings pages |
| `Tooltip` | Help text, icon explanations | Complex forms |

---

## SECTION 5: PAGE-SPECIFIC SPECIFICATIONS

### 5.1 Landing Page (`/`)

**Purpose:** Marketing page with call-to-action for signup

**Layout:**
- Hero section with value proposition
- Feature highlights (3-column grid)
- Use case examples
- CTA buttons: "Get Started" (→ /register), "Sign In" (→ /login)

**No API calls required**

---

### 5.2 Login Page (`/login`)

**Purpose:** User authentication

**Form Fields:**
- Email (email input, required)
- Password (password input, required)
- "Remember me" checkbox (optional for MVP)

**Actions:**
- Submit → `POST /api/auth/login`
- Success → Redirect to `/dashboard`
- Failure → Display error message
- Link to `/forgot-password`
- Link to `/register`

**Validation:**
- Email format validation
- Required field validation

---

### 5.3 Register Page (`/register`)

**Purpose:** New organization and user creation

**Form Fields:**
- Name (text input, required, min 2 chars)
- Email (email input, required)
- Password (password input, required, min 8 chars, complexity validation)
- Confirm Password (password input, required, must match)
- Organization Name (text input, required, min 2 chars)

**Actions:**
- Submit → `POST /api/auth/register`
- Success → Redirect to `/dashboard`
- Failure → Display error message
- Link to `/login`

**Validation:**
- Email format validation
- Password complexity: uppercase, lowercase, number, min 8 chars
- Passwords match
- Organization name length

---

### 5.4 Forgot Password Page (`/forgot-password`)

**Purpose:** Initiate password reset

**Form Fields:**
- Email (email input, required)

**Actions:**
- Submit → `POST /api/auth/forgot-password`
- Success → Display success message (generic: "If email exists, reset link sent")
- Link back to `/login`

---

### 5.5 Reset Password Page (`/reset-password`)

**Purpose:** Complete password reset with token

**URL Parameters:**
- `token` (from email link)

**Form Fields:**
- New Password (password input, required, min 8 chars)
- Confirm Password (password input, required, must match)

**Actions:**
- Submit → `POST /api/auth/reset-password` with token
- Success → Display success, redirect to `/login`
- Failure → Display error (invalid/expired token)

---

### 5.6 Dashboard Page (`/dashboard`)

**Purpose:** Overview of organization activity and stats

**Layout:**
- **Stats Cards (4-column grid):**
  - Total Projects
  - Active Processing Jobs
  - Total Datasets
  - Total Records Processed

- **Recent Projects Section:**
  - Table: Project Name, Created, Last Updated, Status
  - "View All" button → `/projects`

- **Recent Activity Feed:**
  - Processing job completed
  - Dataset exported
  - User invited

**API Calls:**
- On mount: `GET /api/organizations/current/stats`
- On mount: `GET /api/projects?limit=5&sort=updatedAt:desc`

---

### 5.7 Projects List Page (`/projects`)

**Purpose:** View and manage all projects

**Layout:**
- Header with "Create Project" button (→ `/projects/new`)
- Search/filter bar (by name, status)
- Projects grid/table:
  - Project Name (clickable → `/projects/:id`)
  - Description
  - Data Sources Count
  - Datasets Count
  - Last Updated
  - Actions: Edit, Delete (admin/member only)

**API Calls:**
- On mount: `GET /api/projects`
- On delete: `DELETE /api/projects/:id`

**Empty State:**
- "No projects yet. Create your first project to get started."
- Large "Create Project" button

---

### 5.8 Create Project Page (`/projects/new`)

**Purpose:** Create new data preparation project

**Form Fields:**
- Project Name (text input, required, max 100 chars)
- Description (textarea, optional, max 500 chars)
- Target Schema (select dropdown):
  - "Conversational" (default for MVP)
  - "Structured Data" (future)
  - "Documents" (future)

**Actions:**
- Submit → `POST /api/projects`
- Success → Redirect to `/projects/:id` (newly created project)
- Cancel → Back to `/projects`

---

### 5.9 Project Detail Page (`/projects/:id`)

**Purpose:** Overview of single project

**Layout:**
- Project header: Name, Description, Owner, Created Date
- Tabs (ProjectNav component):
  - **Overview Tab (active):**
    - Stats cards: Data Sources, Processing Jobs, Datasets, Records
    - Data Sources list with status
    - Recent processing jobs
  - Other tabs: See ProjectNav specification

**API Calls:**
- On mount: `GET /api/projects/:id`
- On mount: `GET /api/projects/:projectId/data-sources`
- On mount: `GET /api/projects/:projectId/jobs?limit=5`

---

### 5.10 Edit Project Page (`/projects/:id/edit`)

**Purpose:** Update project details

**Form Fields:**
- Project Name (pre-filled, editable)
- Description (pre-filled, editable)
- Target Schema (select, pre-selected)

**Actions:**
- Submit → `PATCH /api/projects/:id`
- Success → Redirect to `/projects/:id`
- Cancel → Back to `/projects/:id`

**API Calls:**
- On mount: `GET /api/projects/:id`
- On submit: `PATCH /api/projects/:id`

---

### 5.11 Project Settings Page (`/projects/:id/settings`)

**Purpose:** Project configuration and deletion

**Sections:**
- **General Settings:** Owner assignment (admin only)
- **Danger Zone:**
  - Delete Project button (red, confirmation dialog)
  - Warning: "This will delete all data sources, jobs, and datasets."

**Actions:**
- Delete → Confirmation dialog → `DELETE /api/projects/:id`
- Success → Redirect to `/projects`

---

### 5.12 Upload Data Page (`/projects/:projectId/upload`)

**Purpose:** Upload files (CSV, Excel, JSON)

**Layout:**
- File upload dropzone (drag-and-drop or click to browse)
- Accepted formats: .csv, .xlsx, .xls, .json
- Max file size: 50MB
- Data source name field (auto-populated from filename, editable)

**Actions:**
- Upload → `POST /api/projects/:projectId/data-sources/upload`
- Success → Redirect to `/projects/:projectId` with success message
- Failure → Display error message

**Validation:**
- File type validation (client-side)
- File size validation (client-side)

---

### 5.13 Connect API Page (`/projects/:projectId/connect-api`)

**Purpose:** Configure Teamwork Desk API connection

**Form Fields:**
- Connection Name (text input, required)
- API Key (password input, required)
- Domain (text input, required, e.g., "mycompany.teamwork.com")
- Inbox ID (text input, optional, leave empty to sync all)

**Actions:**
- Test Connection button → Validates credentials without saving
- Submit → `POST /api/projects/:projectId/data-sources/api`
- Success → Redirect to `/projects/:projectId`

---

### 5.14 Data Source Detail Page (`/projects/:projectId/data-sources/:id`)

**Purpose:** View data source details and preview

**Layout:**
- Data source metadata:
  - Name, Type, Status
  - Record Count, Created Date
  - Connection details (API) or file path (upload)
- Preview table: First 10 records
- Actions:
  - "Process Data" button (→ create processing job)
  - "Delete" button (admin/member only)

**API Calls:**
- On mount: `GET /api/projects/:projectId/data-sources/:id`

---

### 5.15 Processing Jobs Page (`/projects/:projectId/jobs`)

**Purpose:** Monitor batch processing jobs

**Layout:**
- Header with "Start New Job" button
- Jobs table:
  - Job ID, Type, Status (badge), Progress (bar)
  - Processed Records, Failed Records
  - Created Date, Duration
  - Actions: View Details, Cancel (if pending/processing)

**API Calls:**
- On mount: `GET /api/projects/:projectId/jobs`
- On cancel: `PATCH /api/projects/:projectId/jobs/:id/cancel`
- Polling (every 5s): Refresh jobs list if any jobs in progress

**Status Badges:**
- Pending: Blue
- Processing: Yellow
- Completed: Green
- Failed: Red
- Cancelled: Gray

---

### 5.16 Job Detail Page (`/projects/:projectId/jobs/:id`)

**Purpose:** View detailed job information and logs

**Layout:**
- Job metadata: Type, Status, Created, Duration
- Progress indicator (percentage complete)
- Processed/Failed records counts
- Error logs (if failed)
- Output dataset link (if completed)

**API Calls:**
- On mount: `GET /api/projects/:projectId/jobs/:id`
- Polling (every 3s): Refresh if job status is pending/processing

---

### 5.17 Configure Processing Page (`/projects/:projectId/configure`)

**Purpose:** Configure schema mappings and de-identification rules

**Tabs:**
- **Schema Mapping Tab:**
  - Source fields → Target fields mapping
  - Transformation rules (e.g., date format, text normalization)
  - Save button → `POST /api/projects/:projectId/schema-mappings`

- **De-identification Tab:**
  - PII types checklist: Email, Phone, Name, Address, SSN
  - Detection method: Regex, ML-based
  - Masking strategy: Redact, Hash, Tokenize, Fake
  - Save button → `POST /api/projects/:projectId/deidentification-rules`

**API Calls:**
- On mount: `GET /api/projects/:projectId/schema-mappings`
- On mount: `GET /api/projects/:projectId/deidentification-rules`
- On save: `POST /api/projects/:projectId/schema-mappings`
- On save: `POST /api/projects/:projectId/deidentification-rules`

---

### 5.18 Datasets Page (`/projects/:projectId/datasets`)

**Purpose:** View and download exported datasets

**Layout:**
- Datasets table:
  - Dataset Name, Format, Record Count
  - Created Date, File Size
  - Actions: Download, Delete

**API Calls:**
- On mount: `GET /api/projects/:projectId/datasets`
- On download: `GET /api/projects/:projectId/datasets/:id/download`
- On delete: `DELETE /api/projects/:projectId/datasets/:id`

**Empty State:**
- "No datasets yet. Process data to generate your first dataset."

---

### 5.19 Export Dataset Page (`/projects/:projectId/datasets/:id/export`)

**Purpose:** Download dataset in selected format

**Layout:**
- Export format selection (radio group):
  - JSONL (default)
  - JSON
  - Q&A Pairs
  - CSV
- File naming preview
- Download button

**Actions:**
- Download → `GET /api/projects/:projectId/datasets/:id/download?format={format}`
- Triggers browser download

---

### 5.20 Users Management Page (`/users`)

**Purpose:** Admin-only user management

**Layout:**
- Header with "Invite User" button (→ `/users/invite`)
- Users table:
  - Name, Email, Role (badge), Status
  - Created Date, Last Login
  - Actions: Edit Role, Delete (cannot delete self)

**API Calls:**
- On mount: `GET /api/users`
- On update role: `PATCH /api/users/:id`
- On delete: `DELETE /api/users/:id`

**Role Badges:**
- Admin: Purple
- Member: Blue
- Viewer: Gray

---

### 5.21 Invite User Page (`/users/invite`)

**Purpose:** Send email invitation to join organization

**Form Fields:**
- Email (email input, required)
- Role (select dropdown: Member, Viewer)
- Message (textarea, optional)

**Actions:**
- Submit → `POST /api/users/invite`
- Success → Redirect to `/users` with success message
- Cancel → Back to `/users`

---

### 5.22 Organization Settings Page (`/settings/organization`)

**Purpose:** Admin-only organization configuration

**Sections:**
- **General:**
  - Organization Name (editable)
  - Subscription Tier (read-only)
  - Created Date (read-only)

- **Danger Zone:**
  - Delete Organization button (red, confirmation dialog)
  - Warning: "This will delete all users, projects, and data."

**API Calls:**
- On mount: `GET /api/organizations/current`
- On update: `PATCH /api/organizations/current`
- On delete: `DELETE /api/organizations/current`

---

### 5.23 User Profile Page (`/settings/profile`)

**Purpose:** User profile management

**Sections:**
- **Profile Information:**
  - Name (editable)
  - Email (read-only)
  - Role (read-only)

- **Change Password:**
  - Current Password
  - New Password
  - Confirm New Password

**API Calls:**
- On mount: `GET /api/users/me`
- On update profile: `PATCH /api/users/:id`

---

## SECTION 6: ROUTING CONFIGURATION

### React Router Setup

**File:** `client/src/App.tsx`

```typescript
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';

// Public routes
import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage';

// Protected routes
import DashboardPage from '@/pages/DashboardPage';
import ProjectsListPage from '@/pages/projects/ProjectsListPage';
import CreateProjectPage from '@/pages/projects/CreateProjectPage';
// ... other imports

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Protected Routes */}
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/projects" element={<ProtectedRoute><ProjectsListPage /></ProtectedRoute>} />
          <Route path="/projects/new" element={<ProtectedRoute roles={['admin', 'member']}><CreateProjectPage /></ProtectedRoute>} />
          <Route path="/projects/:id" element={<ProtectedRoute><ProjectDetailPage /></ProtectedRoute>} />
          <Route path="/projects/:id/edit" element={<ProtectedRoute roles={['admin', 'member']}><EditProjectPage /></ProtectedRoute>} />
          <Route path="/projects/:id/settings" element={<ProtectedRoute roles={['admin', 'member']}><ProjectSettingsPage /></ProtectedRoute>} />
          
          {/* Data Sources */}
          <Route path="/projects/:projectId/upload" element={<ProtectedRoute roles={['admin', 'member']}><UploadDataPage /></ProtectedRoute>} />
          <Route path="/projects/:projectId/connect-api" element={<ProtectedRoute roles={['admin', 'member']}><ConnectAPIPage /></ProtectedRoute>} />
          <Route path="/projects/:projectId/data-sources/:id" element={<ProtectedRoute><DataSourceDetailPage /></ProtectedRoute>} />
          
          {/* Processing */}
          <Route path="/projects/:projectId/jobs" element={<ProtectedRoute><ProcessingJobsPage /></ProtectedRoute>} />
          <Route path="/projects/:projectId/jobs/:id" element={<ProtectedRoute><JobDetailPage /></ProtectedRoute>} />
          <Route path="/projects/:projectId/configure" element={<ProtectedRoute roles={['admin', 'member']}><ConfigureProcessingPage /></ProtectedRoute>} />
          
          {/* Datasets */}
          <Route path="/projects/:projectId/datasets" element={<ProtectedRoute><DatasetsPage /></ProtectedRoute>} />
          <Route path="/projects/:projectId/datasets/:id/export" element={<ProtectedRoute><ExportDatasetPage /></ProtectedRoute>} />
          
          {/* Users */}
          <Route path="/users" element={<ProtectedRoute roles={['admin']}><UsersPage /></ProtectedRoute>} />
          <Route path="/users/invite" element={<ProtectedRoute roles={['admin']}><InviteUserPage /></ProtectedRoute>} />
          
          {/* Settings */}
          <Route path="/settings/organization" element={<ProtectedRoute roles={['admin']}><OrganizationSettingsPage /></ProtectedRoute>} />
          <Route path="/settings/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
```

---

### ProtectedRoute Component

**File:** `client/src/components/ProtectedRoute.tsx`

```typescript
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  roles?: Array<'admin' | 'member' | 'viewer'>;
}

export function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div>Loading...</div>; // Or LoadingSpinner component
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
```

---

## SECTION 7: EMAIL TEMPLATES

### Template 1: Password Reset

**Subject:** Reset Your Foundry Password

**HTML Body:**
```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .button { display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px; }
    .footer { margin-top: 40px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <h2>Reset Your Password</h2>
    <p>You requested to reset your password for your Foundry account.</p>
    <p>Click the button below to reset your password. This link will expire in 1 hour.</p>
    <p>
      <a href="{{resetUrl}}" class="button">Reset Password</a>
    </p>
    <p>If you didn't request this, you can safely ignore this email.</p>
    <div class="footer">
      <p>Foundry - Data Preparation for AI</p>
      <p>This is an automated email. Please do not reply.</p>
    </div>
  </div>
</body>
</html>
```

**Plain Text Body:**
```
Reset Your Password

You requested to reset your password for your Foundry account.

Click the link below to reset your password. This link will expire in 1 hour.

{{resetUrl}}

If you didn't request this, you can safely ignore this email.

---
Foundry - Data Preparation for AI
This is an automated email. Please do not reply.
```

**Variables:**
- `{{resetUrl}}`: Full URL with reset token (e.g., `https://app.foundry.com/reset-password?token=abc123`)

---

### Template 2: User Invitation

**Subject:** You've Been Invited to Join {{organizationName}} on Foundry

**HTML Body:**
```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .button { display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px; }
    .footer { margin-top: 40px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <h2>You've Been Invited to Join Foundry</h2>
    <p>{{inviterName}} has invited you to join <strong>{{organizationName}}</strong> on Foundry.</p>
    <p>Foundry is a platform for transforming business data into AI-ready datasets.</p>
    <p>Click the button below to accept the invitation and create your account.</p>
    <p>
      <a href="{{invitationUrl}}" class="button">Accept Invitation</a>
    </p>
    <p>If you have any questions, please contact {{inviterEmail}}.</p>
    <div class="footer">
      <p>Foundry - Data Preparation for AI</p>
      <p>This is an automated email. Please do not reply.</p>
    </div>
  </div>
</body>
</html>
```

**Plain Text Body:**
```
You've Been Invited to Join Foundry

{{inviterName}} has invited you to join {{organizationName}} on Foundry.

Foundry is a platform for transforming business data into AI-ready datasets.

Click the link below to accept the invitation and create your account:

{{invitationUrl}}

If you have any questions, please contact {{inviterEmail}}.

---
Foundry - Data Preparation for AI
This is an automated email. Please do not reply.
```

**Variables:**
- `{{organizationName}}`: Name of the organization
- `{{inviterName}}`: Name of the person who sent the invitation
- `{{inviterEmail}}`: Email of the inviter
- `{{invitationUrl}}`: Full URL with invitation token

---

### Template 3: Processing Job Completed

**Subject:** Your Dataset is Ready - {{projectName}}

**HTML Body:**
```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .button { display: inline-block; padding: 12px 24px; background-color: #10b981; color: white; text-decoration: none; border-radius: 6px; }
    .stats { background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0; }
    .footer { margin-top: 40px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <h2>✓ Your Dataset is Ready</h2>
    <p>Your processing job for <strong>{{projectName}}</strong> has completed successfully.</p>
    <div class="stats">
      <p><strong>Dataset Statistics:</strong></p>
      <ul>
        <li>Records Processed: {{recordCount}}</li>
        <li>PII Items Detected: {{piiCount}}</li>
        <li>Format: {{format}}</li>
      </ul>
    </div>
    <p>
      <a href="{{datasetUrl}}" class="button">View Dataset</a>
    </p>
    <div class="footer">
      <p>Foundry - Data Preparation for AI</p>
      <p>This is an automated email. Please do not reply.</p>
    </div>
  </div>
</body>
</html>
```

**Variables:**
- `{{projectName}}`: Name of the project
- `{{recordCount}}`: Number of records processed
- `{{piiCount}}`: Number of PII items detected and de-identified
- `{{format}}`: Output format (JSONL, JSON, etc.)
- `{{datasetUrl}}`: Link to dataset detail page

---

## SECTION 8: MACHINE-READABLE MANIFEST

### routes-pages-manifest.json

```json
{
  "$schema": "https://foundry.dev/schemas/routes-pages-manifest-v1.json",
  "version": "1.0",
  "generated": "2026-02-03T00:00:00Z",
  "totalPages": 23,
  "pages": [
    {
      "id": 1,
      "name": "Landing Page",
      "route": "/",
      "filePath": "client/src/pages/LandingPage.tsx",
      "authRequired": false,
      "roles": ["public"],
      "apiDependencies": []
    },
    {
      "id": 2,
      "name": "Login Page",
      "route": "/login",
      "filePath": "client/src/pages/auth/LoginPage.tsx",
      "authRequired": false,
      "roles": ["public"],
      "apiDependencies": [
        {
          "method": "POST",
          "path": "/api/auth/login",
          "purpose": "User authentication"
        }
      ]
    },
    {
      "id": 3,
      "name": "Register Page",
      "route": "/register",
      "filePath": "client/src/pages/auth/RegisterPage.tsx",
      "authRequired": false,
      "roles": ["public"],
      "apiDependencies": [
        {
          "method": "POST",
          "path": "/api/auth/register",
          "purpose": "New user registration"
        }
      ]
    },
    {
      "id": 4,
      "name": "Forgot Password Page",
      "route": "/forgot-password",
      "filePath": "client/src/pages/auth/ForgotPasswordPage.tsx",
      "authRequired": false,
      "roles": ["public"],
      "apiDependencies": [
        {
          "method": "POST",
          "path": "/api/auth/forgot-password",
          "purpose": "Initiate password reset"
        }
      ]
    },
    {
      "id": 5,
      "name": "Reset Password Page",
      "route": "/reset-password",
      "filePath": "client/src/pages/auth/ResetPasswordPage.tsx",
      "authRequired": false,
      "roles": ["public"],
      "apiDependencies": [
        {
          "method": "POST",
          "path": "/api/auth/reset-password",
          "purpose": "Complete password reset"
        }
      ]
    },
    {
      "id": 6,
      "name": "Dashboard Page",
      "route": "/dashboard",
      "filePath": "client/src/pages/DashboardPage.tsx",
      "authRequired": true,
      "roles": ["admin", "member", "viewer"],
      "apiDependencies": [
        {
          "method": "GET",
          "path": "/api/organizations/current/stats",
          "purpose": "Fetch organization statistics"
        },
        {
          "method": "GET",
          "path": "/api/projects",
          "purpose": "Fetch recent projects"
        }
      ]
    },
    {
      "id": 7,
      "name": "Projects List Page",
      "route": "/projects",
      "filePath": "client/src/pages/projects/ProjectsListPage.tsx",
      "authRequired": true,
      "roles": ["admin", "member", "viewer"],
      "apiDependencies": [
        {
          "method": "GET",
          "path": "/api/projects",
          "purpose": "Fetch all projects"
        }
      ]
    },
    {
      "id": 8,
      "name": "Create Project Page",
      "route": "/projects/new",
      "filePath": "client/src/pages/projects/CreateProjectPage.tsx",
      "authRequired": true,
      "roles": ["admin", "member"],
      "apiDependencies": [
        {
          "method": "POST",
          "path": "/api/projects",
          "purpose": "Create new project"
        }
      ]
    },
    {
      "id": 9,
      "name": "Project Detail Page",
      "route": "/projects/:id",
      "filePath": "client/src/pages/projects/ProjectDetailPage.tsx",
      "authRequired": true,
      "roles": ["admin", "member", "viewer"],
      "apiDependencies": [
        {
          "method": "GET",
          "path": "/api/projects/:id",
          "purpose": "Fetch project details"
        },
        {
          "method": "GET",
          "path": "/api/projects/:projectId/data-sources",
          "purpose": "Fetch data sources"
        }
      ]
    },
    {
      "id": 10,
      "name": "Edit Project Page",
      "route": "/projects/:id/edit",
      "filePath": "client/src/pages/projects/EditProjectPage.tsx",
      "authRequired": true,
      "roles": ["admin", "member"],
      "apiDependencies": [
        {
          "method": "GET",
          "path": "/api/projects/:id",
          "purpose": "Fetch project to edit"
        },
        {
          "method": "PATCH",
          "path": "/api/projects/:id",
          "purpose": "Update project"
        }
      ]
    },
    {
      "id": 11,
      "name": "Project Settings Page",
      "route": "/projects/:id/settings",
      "filePath": "client/src/pages/projects/ProjectSettingsPage.tsx",
      "authRequired": true,
      "roles": ["admin", "member"],
      "apiDependencies": [
        {
          "method": "GET",
          "path": "/api/projects/:id",
          "purpose": "Fetch project settings"
        },
        {
          "method": "DELETE",
          "path": "/api/projects/:id",
          "purpose": "Delete project"
        }
      ]
    },
    {
      "id": 12,
      "name": "Upload Data Page",
      "route": "/projects/:projectId/upload",
      "filePath": "client/src/pages/data-sources/UploadDataPage.tsx",
      "authRequired": true,
      "roles": ["admin", "member"],
      "apiDependencies": [
        {
          "method": "POST",
          "path": "/api/projects/:projectId/data-sources/upload",
          "purpose": "Upload file data source"
        }
      ]
    },
    {
      "id": 13,
      "name": "Connect API Page",
      "route": "/projects/:projectId/connect-api",
      "filePath": "client/src/pages/data-sources/ConnectAPIPage.tsx",
      "authRequired": true,
      "roles": ["admin", "member"],
      "apiDependencies": [
        {
          "method": "POST",
          "path": "/api/projects/:projectId/data-sources/api",
          "purpose": "Create API connector data source"
        }
      ]
    },
    {
      "id": 14,
      "name": "Data Source Detail Page",
      "route": "/projects/:projectId/data-sources/:id",
      "filePath": "client/src/pages/data-sources/DataSourceDetailPage.tsx",
      "authRequired": true,
      "roles": ["admin", "member", "viewer"],
      "apiDependencies": [
        {
          "method": "GET",
          "path": "/api/projects/:projectId/data-sources/:id",
          "purpose": "Fetch data source details"
        }
      ]
    },
    {
      "id": 15,
      "name": "Processing Jobs Page",
      "route": "/projects/:projectId/jobs",
      "filePath": "client/src/pages/processing/ProcessingJobsPage.tsx",
      "authRequired": true,
      "roles": ["admin", "member", "viewer"],
      "apiDependencies": [
        {
          "method": "GET",
          "path": "/api/projects/:projectId/jobs",
          "purpose": "Fetch processing jobs"
        },
        {
          "method": "PATCH",
          "path": "/api/projects/:projectId/jobs/:id/cancel",
          "purpose": "Cancel job"
        }
      ]
    },
    {
      "id": 16,
      "name": "Job Detail Page",
      "route": "/projects/:projectId/jobs/:id",
      "filePath": "client/src/pages/processing/JobDetailPage.tsx",
      "authRequired": true,
      "roles": ["admin", "member", "viewer"],
      "apiDependencies": [
        {
          "method": "GET",
          "path": "/api/projects/:projectId/jobs/:id",
          "purpose": "Fetch job details"
        }
      ]
    },
    {
      "id": 17,
      "name": "Configure Processing Page",
      "route": "/projects/:projectId/configure",
      "filePath": "client/src/pages/processing/ConfigureProcessingPage.tsx",
      "authRequired": true,
      "roles": ["admin", "member"],
      "apiDependencies": [
        {
          "method": "GET",
          "path": "/api/projects/:projectId/schema-mappings",
          "purpose": "Fetch schema mappings"
        },
        {
          "method": "POST",
          "path": "/api/projects/:projectId/schema-mappings",
          "purpose": "Save schema mappings"
        },
        {
          "method": "GET",
          "path": "/api/projects/:projectId/deidentification-rules",
          "purpose": "Fetch de-identification rules"
        },
        {
          "method": "POST",
          "path": "/api/projects/:projectId/deidentification-rules",
          "purpose": "Save de-identification rules"
        }
      ]
    },
    {
      "id": 18,
      "name": "Datasets Page",
      "route": "/projects/:projectId/datasets",
      "filePath": "client/src/pages/datasets/DatasetsPage.tsx",
      "authRequired": true,
      "roles": ["admin", "member", "viewer"],
      "apiDependencies": [
        {
          "method": "GET",
          "path": "/api/projects/:projectId/datasets",
          "purpose": "Fetch datasets"
        }
      ]
    },
    {
      "id": 19,
      "name": "Export Dataset Page",
      "route": "/projects/:projectId/datasets/:id/export",
      "filePath": "client/src/pages/datasets/ExportDatasetPage.tsx",
      "authRequired": true,
      "roles": ["admin", "member", "viewer"],
      "apiDependencies": [
        {
          "method": "GET",
          "path": "/api/projects/:projectId/datasets/:id/download",
          "purpose": "Download dataset"
        }
      ]
    },
    {
      "id": 20,
      "name": "Users Management Page",
      "route": "/users",
      "filePath": "client/src/pages/users/UsersPage.tsx",
      "authRequired": true,
      "roles": ["admin"],
      "apiDependencies": [
        {
          "method": "GET",
          "path": "/api/users",
          "purpose": "Fetch organization users"
        },
        {
          "method": "PATCH",
          "path": "/api/users/:id",
          "purpose": "Update user role"
        },
        {
          "method": "DELETE",
          "path": "/api/users/:id",
          "purpose": "Delete user"
        }
      ]
    },
    {
      "id": 21,
      "name": "Invite User Page",
      "route": "/users/invite",
      "filePath": "client/src/pages/users/InviteUserPage.tsx",
      "authRequired": true,
      "roles": ["admin"],
      "apiDependencies": [
        {
          "method": "POST",
          "path": "/api/users/invite",
          "purpose": "Send user invitation"
        }
      ]
    },
    {
      "id": 22,
      "name": "Organization Settings Page",
      "route": "/settings/organization",
      "filePath": "client/src/pages/settings/OrganizationSettingsPage.tsx",
      "authRequired": true,
      "roles": ["admin"],
      "apiDependencies": [
        {
          "method": "GET",
          "path": "/api/organizations/current",
          "purpose": "Fetch organization details"
        },
        {
          "method": "PATCH",
          "path": "/api/organizations/current",
          "purpose": "Update organization"
        },
        {
          "method": "DELETE",
          "path": "/api/organizations/current",
          "purpose": "Delete organization"
        }
      ]
    },
    {
      "id": 23,
      "name": "User Profile Page",
      "route": "/settings/profile",
      "filePath": "client/src/pages/settings/ProfilePage.tsx",
      "authRequired": true,
      "roles": ["admin", "member", "viewer"],
      "apiDependencies": [
        {
          "method": "GET",
          "path": "/api/users/me",
          "purpose": "Fetch current user"
        },
        {
          "method": "PATCH",
          "path": "/api/users/:id",
          "purpose": "Update user profile"
        }
      ]
    }
  ]
}
```

---

## SECTION 9: VERIFICATION GATES

### Phase 0.5: Pre-Flight Verification Script

**File:** `scripts/verify-mandatory-ui-components.sh`

```bash
#!/bin/bash

# Phase 0.5: Mandatory UI Components Verification
# This script MUST pass before Phase 1 scaffolding

set -e

echo "==================================="
echo "Phase 0.5: Mandatory UI Components"
echo "==================================="

ERRORS=0

# Pattern 1: ErrorBoundary (BLOCKING)
echo ""
echo "[1/3] Checking ErrorBoundary..."

if [ ! -f "client/src/components/ErrorBoundary.tsx" ]; then
  echo "❌ FAILED: ErrorBoundary.tsx not found"
  ERRORS=$((ERRORS + 1))
else
  echo "✓ ErrorBoundary.tsx exists"
  
  # Check for class component
  if ! grep -q "class ErrorBoundary" "client/src/components/ErrorBoundary.tsx"; then
    echo "❌ FAILED: ErrorBoundary must be a class component"
    ERRORS=$((ERRORS + 1))
  else
    echo "✓ ErrorBoundary is a class component"
  fi
  
  # Check for getDerivedStateFromError
  if ! grep -q "getDerivedStateFromError" "client/src/components/ErrorBoundary.tsx"; then
    echo "❌ FAILED: Missing getDerivedStateFromError method"
    ERRORS=$((ERRORS + 1))
  else
    echo "✓ getDerivedStateFromError method exists"
  fi
  
  # Check for componentDidCatch
  if ! grep -q "componentDidCatch" "client/src/components/ErrorBoundary.tsx"; then
    echo "❌ FAILED: Missing componentDidCatch method"
    ERRORS=$((ERRORS + 1))
  else
    echo "✓ componentDidCatch method exists"
  fi
  
  # Check if App is wrapped
  if [ -f "client/src/main.tsx" ]; then
    if ! grep -q "<ErrorBoundary>" "client/src/main.tsx"; then
      echo "❌ FAILED: App not wrapped in ErrorBoundary (check main.tsx)"
      ERRORS=$((ERRORS + 1))
    else
      echo "✓ App wrapped in ErrorBoundary"
    fi
  elif [ -f "client/src/App.tsx" ]; then
    if ! grep -q "<ErrorBoundary>" "client/src/App.tsx"; then
      echo "❌ FAILED: App not wrapped in ErrorBoundary (check App.tsx)"
      ERRORS=$((ERRORS + 1))
    else
      echo "✓ App wrapped in ErrorBoundary"
    fi
  fi
fi

# Pattern 2: API Client 401 Handling (MANDATORY)
echo ""
echo "[2/3] Checking API Client..."

if [ ! -f "client/src/lib/api.ts" ]; then
  echo "❌ FAILED: api.ts not found"
  ERRORS=$((ERRORS + 1))
else
  echo "✓ api.ts exists"
  
  # Check for 401 interceptor
  if ! grep -A 10 "interceptors.response.use" "client/src/lib/api.ts" | grep -q "401"; then
    echo "❌ FAILED: Missing 401 handling in response interceptor"
    ERRORS=$((ERRORS + 1))
  else
    echo "✓ 401 handling exists"
  fi
  
  # Check for redirect to login
  if ! grep -A 15 "interceptors.response.use" "client/src/lib/api.ts" | grep -q "/login"; then
    echo "❌ FAILED: Missing redirect to login on 401"
    ERRORS=$((ERRORS + 1))
  else
    echo "✓ Redirect to login on 401"
  fi
fi

# Pattern 3: Auth Context (MANDATORY)
echo ""
echo "[3/3] Checking Auth Context..."

if [ ! -f "client/src/contexts/AuthContext.tsx" ]; then
  echo "❌ FAILED: AuthContext.tsx not found"
  ERRORS=$((ERRORS + 1))
else
  echo "✓ AuthContext.tsx exists"
  
  # Check for User type with top-level role
  if ! grep -A 10 "interface User" "client/src/contexts/AuthContext.tsx" | grep -q "role:"; then
    echo "❌ FAILED: User type missing top-level role field"
    ERRORS=$((ERRORS + 1))
  else
    echo "✓ User type has top-level role field"
  fi
  
  # Check for organization field
  if ! grep -A 10 "interface User" "client/src/contexts/AuthContext.tsx" | grep -q "organization:"; then
    echo "❌ FAILED: User type missing organization field"
    ERRORS=$((ERRORS + 1))
  else
    echo "✓ User type has organization field"
  fi
fi

# Summary
echo ""
echo "==================================="
if [ $ERRORS -eq 0 ]; then
  echo "✓ ALL CHECKS PASSED"
  echo "==================================="
  exit 0
else
  echo "❌ $ERRORS CHECKS FAILED"
  echo "==================================="
  echo ""
  echo "Fix all errors before proceeding to Phase 1."
  exit 1
fi
```

---

### Phase 5: Page Count Verification

**Verification Command:**
```bash
# Count TypeScript files in pages directory
find client/src/pages -name "*.tsx" | wc -l
# Expected: 23
```

**Route-Page Parity Check:**
```bash
# Extract all routes from App.tsx
grep -oP '(?<=path=")[^"]+' client/src/App.tsx | sort > /tmp/routes.txt

# Extract all pages from manifest
jq -r '.pages[].route' docs/routes-pages-manifest.json | sort > /tmp/manifest-routes.txt

# Compare
diff /tmp/routes.txt /tmp/manifest-routes.txt
# Expected: No differences
```

---

## SECTION 10: COMMON PATTERNS

### Pattern: Loading State

```typescript
const [loading, setLoading] = useState(true);
const [data, setData] = useState(null);

useEffect(() => {
  async function fetchData() {
    try {
      const response = await apiClient.get('/api/endpoint');
      setData(response.data);
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  }
  fetchData();
}, []);

if (loading) {
  return <div>Loading...</div>;
}
```

---

### Pattern: Form with Validation

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email format')
});

type FormData = z.infer<typeof formSchema>;

function MyForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema)
  });

  const onSubmit = async (data: FormData) => {
    try {
      await apiClient.post('/api/endpoint', data);
      // Success handling
    } catch (error) {
      // Error handling
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <Label htmlFor="name">Name</Label>
        <Input id="name" {...register('name')} />
        {errors.name && <p className="text-red-500">{errors.name.message}</p>}
      </div>
      <Button type="submit">Submit</Button>
    </form>
  );
}
```

---

### Pattern: Confirmation Dialog

```typescript
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

function DeleteButton({ onDelete }: { onDelete: () => Promise<void> }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">Delete</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the item.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

---

### Pattern: Role-Based Rendering

```typescript
import { useAuth } from '@/contexts/AuthContext';

function AdminSection() {
  const { user } = useAuth();

  if (user?.role !== 'admin') {
    return null; // Don't render for non-admins
  }

  return (
    <div>
      <h2>Admin Controls</h2>
      {/* Admin-only content */}
    </div>
  );
}
```

---

## SECTION 11: ASSUMPTIONS REGISTER

| ID | Assumption | Impact if Wrong | Resolution | Owner | Status |
|----|------------|----------------|------------|-------|--------|
| UI-001 | shadcn/ui components available | Cannot build UI without component library | Verify shadcn/ui installation | Agent 2 | UNRESOLVED |
| UI-002 | React Router v6+ used | Routing implementation incompatible | Confirm routing library version | Agent 2 | UNRESOLVED |
| UI-003 | Tailwind CSS configured | Styling system missing | Verify Tailwind setup | Agent 2 | UNRESOLVED |
| UI-004 | lucide-react icons available | Missing icons for UI | Install lucide-react | Agent 2 | UNRESOLVED |
| UI-005 | File upload max 50MB acceptable | Users may need larger files | Validate with Product Owner | Agent 1 | UNRESOLVED |
| UI-006 | Email templates use HTML/plain text | Email client compatibility | Confirm email service supports HTML | Agent 4 | UNRESOLVED |
| UI-007 | Polling interval 5s acceptable | May cause excessive API calls | Load test polling frequency | Agent 6 | UNRESOLVED |
| UI-008 | Organization deletion shows confirmation | Risk of accidental deletion | Confirm UX pattern with Product Owner | Agent 1 | UNRESOLVED |

---

## SECTION 12: CROSS-REFERENCES

### Agent Dependencies

| Agent | Consumes from This Spec | Provides to This Spec |
|-------|------------------------|----------------------|
| **Agent 2 (Architecture)** | UI framework requirements (React, Tailwind, shadcn/ui) | Technology stack decisions |
| **Agent 4 (API Contract)** | API endpoint usage patterns | Endpoint definitions, request/response schemas |
| **Agent 6 (Implementation)** | Page inventory, component patterns, routing config | N/A |
| **Agent 8 (Code Review)** | Expected UI patterns for validation | N/A |

---

### Constitution Compliance

| Section | Requirement | Implementation |
|---------|-------------|---------------|
| **Section U** | Single-file output with embedded scripts | Verification script embedded in Section 9 |
| **Section W** | Tier 1 pre-flight gates | verify-mandatory-ui-components.sh in Phase 0.5 |
| **Section C** | JWT storage patterns | localStorage for access/refresh tokens |
| **Section C** | 401 redirect handling | API client interceptor redirects to /login |

---

## DOCUMENT END

**Agent 5: UI/UX Specification v1.0 - EXECUTION COMPLETE**

**Output:** `05-UI-UX-SPECIFICATION.md`

**Next Step:** Agent 6 (Implementation) will use this specification to build all UI components and pages.

**Specification Summary:**
- **Total Pages:** 23 (5 auth, 1 dashboard, 5 projects, 3 data sources, 3 processing, 2 datasets, 2 users, 2 settings)
- **Mandatory Components:** ErrorBoundary (class), API Client (401 handling), Auth Context
- **Navigation:** Main nav + Project detail sub-nav with role-based filtering
- **Component Library:** shadcn/ui (15 components)
- **Email Templates:** 3 templates (password reset, invitation, job completed)
- **Verification Gates:** Phase 0.5 pre-flight (verify-mandatory-ui-components.sh)
- **Folder Structure:** STRICT (paths must match specification exactly)

**Quality Verification:**
- [x] All pages documented (23 pages)
- [x] Mandatory components specified (ErrorBoundary, API Client, Auth Context)
- [x] Navigation structure complete
- [x] Email templates included
- [x] Machine-readable manifest (routes-pages-manifest.json)
- [x] Verification script (verify-mandatory-ui-components.sh)
- [x] Assumptions register complete
- [x] Cross-references documented

**Constitutional Compliance:** Aligned with Agent 0 v4.6
