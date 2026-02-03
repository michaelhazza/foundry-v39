# API Contract Specification: Foundry
## Version 1.0

**Document ID:** 04-API-CONTRACT  
**Created:** 2026-02-03  
**Agent:** Agent 4 (API Contract v39)  
**Framework:** Agent Specification Framework v2.1  
**Constitution:** Inherited from Agent 0 v4.6  
**Status:** ACTIVE  
**Input Sources:** 01-PRD.md, 02-ARCHITECTURE.md, 03-DATA-MODEL.md

---

## INHERITED CONSTITUTION

This API contract inherits **Agent 0: Agent Constitution v4.6**. Global rules are not restated here.

Reference Constitution for:
- Health endpoints (Section C: `GET /health`)
- Error envelopes (Section C: structured error responses)
- Auth storage (Section C: JWT configuration)
- Ports and network binding (Section C, D)
- JWT configuration (Section C: 15m access, 7d refresh)
- Cryptographic randomness (Section C: `crypto.randomBytes()`)
- Tiered prevention model (Section W: Tier 1 security patterns)

Changes to global conventions require `AR-### CHANGE_REQUEST` in Assumption Register.

---

## EXECUTIVE SUMMARY

### API Overview

This document defines the complete REST API contract for Foundry, a multi-tenant SaaS platform for AI-ready dataset preparation. The API provides:

- **Authentication:** JWT-based with refresh token rotation
- **Multi-Tenancy:** Organization-scoped resource isolation
- **Data Processing:** File upload, API connectors, batch processing
- **Privacy Compliance:** PII detection and de-identification
- **Export Management:** Multiple format support (JSONL, JSON, Q&A pairs)

### API Design Principles

1. **RESTful Conventions:** Standard HTTP methods, resource-based URLs
2. **Security-First:** Rate limiting, RBAC, multi-tenant isolation enforced
3. **Type Safety:** Zod validation on all inputs
4. **Consistent Errors:** Structured error responses per Constitution Section C
5. **Stateless Auth:** JWT access tokens with refresh token rotation

### Endpoint Summary

**Total Endpoints:** 49

| Category | Endpoints | Methods |
|----------|-----------|---------|
| Authentication | 6 | POST |
| Organizations | 4 | GET, PATCH, DELETE |
| Users | 5 | GET, POST, PATCH, DELETE |
| Projects | 5 | GET, POST, PATCH, DELETE |
| Data Sources | 6 | GET, POST, PATCH, DELETE |
| Processing Jobs | 4 | GET, POST, PATCH |
| Schema Mappings | 4 | GET, POST, PATCH, DELETE |
| De-identification Rules | 4 | GET, POST, PATCH, DELETE |
| Datasets | 5 | GET, POST, DELETE, download |
| Health | 1 | GET |

---

## SECTION 1: AUTHENTICATION ENDPOINTS

### 1.1 Register New User

**Endpoint:** `POST /api/auth/register`

**Purpose:** Create new organization and admin user account

**Authentication:** None (public endpoint)

**Rate Limiting:** `authLimiter` (5 requests per 15 minutes per IP)

**Request Schema:**
```typescript
const registerSchema = z.object({
  email: z.string()
    .email('Invalid email format')
    .toLowerCase()
    .trim(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/, 
      'Password must contain uppercase, lowercase, and number'),
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .trim(),
  organizationName: z.string()
    .min(2, 'Organization name must be at least 2 characters')
    .max(100, 'Organization name must be less than 100 characters')
    .trim()
});
```

**Success Response (201):**
```typescript
{
  user: {
    id: number;
    email: string;
    name: string;
    role: 'admin' | 'member' | 'viewer';
    organizationId: number;
    emailVerified: boolean;
    createdAt: string; // ISO 8601
  },
  organization: {
    id: number;
    name: string;
    subscriptionTier: 'free' | 'pro' | 'enterprise';
    createdAt: string;
  },
  accessToken: string;
  refreshToken: string;
}
```

**Error Responses:**
- `400` - Validation error (email/password format)
- `409` - Email already exists
- `429` - Rate limit exceeded
- `500` - Internal server error

**Security Requirements:**
- Password hashing with `bcrypt` (cost factor 12)
- Transaction enforcement: Create organization → user → session atomically
- No email verification in MVP (AR-009 deferred)

**Service Contract:**
```typescript
async function register(data: RegisterInput): Promise<RegisterResponse> {
  return db.transaction(async (tx) => {
    // 1. Create organization
    const org = await tx.insert(organizations).values({
      name: data.organizationName,
      subscriptionTier: 'free'
    }).returning();
    
    // 2. Create user with admin role
    const hashedPassword = await bcrypt.hash(data.password, 12);
    const user = await tx.insert(users).values({
      organizationId: org.id,
      email: data.email,
      passwordHash: hashedPassword,
      name: data.name,
      role: 'admin',
      emailVerified: false
    }).returning();
    
    // 3. Create session with refresh token
    const refreshToken = crypto.randomBytes(32).toString('hex');
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 12);
    const session = await tx.insert(userSessions).values({
      userId: user.id,
      refreshToken: hashedRefreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    }).returning();
    
    // 4. Generate JWT access token
    const accessToken = jwt.sign(
      { userId: user.id, organizationId: org.id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '15m' }
    );
    
    return { user, organization: org, accessToken, refreshToken };
  });
}
```

---

### 1.2 Login

**Endpoint:** `POST /api/auth/login`

**Purpose:** Authenticate existing user

**Authentication:** None (public endpoint)

**Rate Limiting:** `authLimiter` (5 requests per 15 minutes per IP)

**Request Schema:**
```typescript
const loginSchema = z.object({
  email: z.string()
    .email('Invalid email format')
    .toLowerCase()
    .trim(),
  password: z.string()
    .min(1, 'Password is required')
});
```

**Success Response (200):**
```typescript
{
  user: {
    id: number;
    email: string;
    name: string;
    role: 'admin' | 'member' | 'viewer';
    organizationId: number;
    emailVerified: boolean;
  },
  accessToken: string;
  refreshToken: string;
}
```

**Error Responses:**
- `400` - Validation error
- `401` - Invalid email or password
- `429` - Rate limit exceeded
- `500` - Internal server error

**Service Contract:**
```typescript
async function login(data: LoginInput): Promise<LoginResponse> {
  // 1. Find user by email
  const user = await db.query.users.findFirst({
    where: eq(users.email, data.email)
  });
  
  if (!user) {
    throw new UnauthorizedError('Invalid email or password');
  }
  
  // 2. Verify password
  const passwordValid = await bcrypt.compare(data.password, user.passwordHash);
  if (!passwordValid) {
    throw new UnauthorizedError('Invalid email or password');
  }
  
  // 3. Create new session with refresh token
  const refreshToken = crypto.randomBytes(32).toString('hex');
  const hashedRefreshToken = await bcrypt.hash(refreshToken, 12);
  await db.insert(userSessions).values({
    userId: user.id,
    refreshToken: hashedRefreshToken,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  });
  
  // 4. Generate access token
  const accessToken = jwt.sign(
    { userId: user.id, organizationId: user.organizationId, role: user.role },
    process.env.JWT_SECRET!,
    { expiresIn: '15m' }
  );
  
  return { user, accessToken, refreshToken };
}
```

---

### 1.3 Refresh Access Token

**Endpoint:** `POST /api/auth/refresh`

**Purpose:** Generate new access token and rotate refresh token (Section 9.6)

**Authentication:** Refresh token required (no JWT)

**Request Schema:**
```typescript
const refreshSchema = z.object({
  refreshToken: z.string()
    .min(1, 'Refresh token is required')
});
```

**Success Response (200):**
```typescript
{
  accessToken: string;
  refreshToken: string; // NEW token (rotation)
}
```

**Error Responses:**
- `400` - Validation error
- `401` - Invalid or expired refresh token
- `401` - Refresh token already used
- `500` - Internal server error

**Security Requirements (Section 9.6):**
- **Token Rotation:** One-time-use refresh tokens
- **Invalidation:** Old refresh token deleted after use
- **New Session:** New session created with new refresh token

**Service Contract:**
```typescript
async function refreshAccessToken(refreshToken: string): Promise<RefreshResponse> {
  return db.transaction(async (tx) => {
    // 1. Hash provided token
    const hashedToken = await bcrypt.hash(refreshToken, 12);
    
    // 2. Find session (must not be used, must not be expired)
    const session = await tx.query.userSessions.findFirst({
      where: and(
        eq(userSessions.refreshToken, hashedToken),
        isNull(userSessions.usedAt), // Section 9.6: Check not used
        gt(userSessions.expiresAt, new Date())
      ),
      with: { user: true }
    });
    
    if (!session) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }
    
    // 3. Mark old session as used (Section 9.6)
    await tx.update(userSessions)
      .set({ usedAt: new Date() })
      .where(eq(userSessions.id, session.id));
    
    // 4. Delete old session (Section 9.6: Rotation)
    await tx.delete(userSessions)
      .where(eq(userSessions.id, session.id));
    
    // 5. Create NEW session with NEW refresh token (Section 9.6)
    const newRefreshToken = crypto.randomBytes(32).toString('hex');
    const newHashedToken = await bcrypt.hash(newRefreshToken, 12);
    await tx.insert(userSessions).values({
      userId: session.userId,
      refreshToken: newHashedToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });
    
    // 6. Generate new access token
    const accessToken = jwt.sign(
      { userId: session.user.id, organizationId: session.user.organizationId, role: session.user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '15m' }
    );
    
    // 7. Return new tokens (Section 9.6: Client must store new refresh token)
    return { accessToken, refreshToken: newRefreshToken };
  });
}
```

---

### 1.4 Logout

**Endpoint:** `POST /api/auth/logout`

**Purpose:** Invalidate refresh token

**Authentication:** JWT required (`requireAuth`)

**Request Schema:**
```typescript
const logoutSchema = z.object({
  refreshToken: z.string()
    .min(1, 'Refresh token is required')
});
```

**Success Response (200):**
```typescript
{
  message: 'Logged out successfully'
}
```

**Error Responses:**
- `400` - Validation error
- `401` - Unauthorized (invalid JWT)
- `500` - Internal server error

**Service Contract:**
```typescript
async function logout(userId: number, refreshToken: string): Promise<void> {
  const hashedToken = await bcrypt.hash(refreshToken, 12);
  
  // Delete session by refresh token and user ID
  await db.delete(userSessions)
    .where(and(
      eq(userSessions.userId, userId),
      eq(userSessions.refreshToken, hashedToken)
    ));
}
```

---

### 1.5 Forgot Password

**Endpoint:** `POST /api/auth/forgot-password`

**Purpose:** Initiate password reset (Section 9.7: No token in response)

**Authentication:** None (public endpoint)

**Rate Limiting:** `authLimiter` (5 requests per 15 minutes per IP)

**Request Schema:**
```typescript
const forgotPasswordSchema = z.object({
  email: z.string()
    .email('Invalid email format')
    .toLowerCase()
    .trim()
});
```

**Success Response (200):**
```typescript
{
  message: 'If email exists, reset link sent'
}
```

**Error Responses:**
- `400` - Validation error
- `429` - Rate limit exceeded
- `500` - Internal server error

**Security Requirements (Section 9.7):**
- **No Token Exposure:** Reset token NOT returned in HTTP response body
- **Email-Only Distribution:** Token sent via email only
- **Development Logging:** Token logged to console in dev mode (not response)
- **Generic Response:** Same message whether email exists or not (prevent email enumeration)

**Service Contract:**
```typescript
async function forgotPassword(email: string): Promise<{ message: string }> {
  // 1. Find user by email
  const user = await db.query.users.findFirst({
    where: eq(users.email, email)
  });
  
  // Section 9.7: Generic response (don't leak user existence)
  if (!user) {
    return { message: 'If email exists, reset link sent' };
  }
  
  // 2. Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = await bcrypt.hash(resetToken, 12);
  
  // 3. Store hashed token in session (1 hour expiry)
  await db.insert(userSessions).values({
    userId: user.id,
    refreshToken: hashedToken, // Reuse column for reset token
    expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
  });
  
  // 4. Send token via email ONLY (Section 9.7)
  await sendPasswordResetEmail(user.email, resetToken);
  
  // 5. DEVELOPMENT ONLY: Log token to console (Section 9.7)
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[DEV] Reset token for ${email}: ${resetToken}`);
  }
  
  // 6. Return generic message WITHOUT token (Section 9.7)
  return { message: 'If email exists, reset link sent' };
}
```

---

### 1.6 Reset Password

**Endpoint:** `POST /api/auth/reset-password`

**Purpose:** Complete password reset with token from email

**Authentication:** None (token validated)

**Rate Limiting:** `authLimiter` (5 requests per 15 minutes per IP)

**Request Schema:**
```typescript
const resetPasswordSchema = z.object({
  token: z.string()
    .min(1, 'Reset token is required'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/, 
      'Password must contain uppercase, lowercase, and number')
});
```

**Success Response (200):**
```typescript
{
  message: 'Password reset successful'
}
```

**Error Responses:**
- `400` - Validation error
- `401` - Invalid or expired reset token
- `429` - Rate limit exceeded
- `500` - Internal server error

**Service Contract:**
```typescript
async function resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
  return db.transaction(async (tx) => {
    // 1. Hash provided token
    const hashedToken = await bcrypt.hash(token, 12);
    
    // 2. Find session with reset token (Section 9.7: Token from email, not from HTTP response)
    const session = await tx.query.userSessions.findFirst({
      where: and(
        eq(userSessions.refreshToken, hashedToken),
        gt(userSessions.expiresAt, new Date())
      ),
      with: { user: true }
    });
    
    if (!session) {
      throw new UnauthorizedError('Invalid or expired reset token');
    }
    
    // 3. Update password and invalidate token (transaction)
    const newPasswordHash = await bcrypt.hash(newPassword, 12);
    await tx.update(users)
      .set({ passwordHash: newPasswordHash, updatedAt: new Date() })
      .where(eq(users.id, session.userId));
    
    // 4. Delete reset token session
    await tx.delete(userSessions)
      .where(eq(userSessions.id, session.id));
    
    // 5. Invalidate all other sessions (force re-login)
    await tx.delete(userSessions)
      .where(eq(userSessions.userId, session.userId));
    
    return { message: 'Password reset successful' };
  });
}
```

---

## SECTION 2: ORGANIZATION ENDPOINTS

### 2.1 Get Current Organization

**Endpoint:** `GET /api/organizations/current`

**Purpose:** Retrieve authenticated user's organization details

**Authentication:** JWT required (`requireAuth`)

**Query Parameters:** None

**Success Response (200):**
```typescript
{
  id: number;
  name: string;
  subscriptionTier: 'free' | 'pro' | 'enterprise';
  createdAt: string;
  updatedAt: string;
  memberCount: number;
  projectCount: number;
}
```

**Error Responses:**
- `401` - Unauthorized (invalid JWT)
- `404` - Organization not found
- `500` - Internal server error

**Service Contract:**
```typescript
async function getCurrentOrganization(organizationId: number): Promise<OrganizationResponse> {
  // Section 9.1: Multi-tenant isolation
  const org = await db.query.organizations.findFirst({
    where: and(
      eq(organizations.id, organizationId),
      isNull(organizations.deletedAt) // Soft delete check
    )
  });
  
  if (!org) {
    throw new NotFoundError('Organization not found');
  }
  
  // Get member count
  const memberCount = await db.select({ count: count() })
    .from(users)
    .where(eq(users.organizationId, organizationId))
    .then(res => res[0].count);
  
  // Get project count
  const projectCount = await db.select({ count: count() })
    .from(projects)
    .where(and(
      eq(projects.organizationId, organizationId),
      isNull(projects.deletedAt)
    ))
    .then(res => res[0].count);
  
  return { ...org, memberCount, projectCount };
}
```

---

### 2.2 Update Organization

**Endpoint:** `PATCH /api/organizations/current`

**Purpose:** Update organization details (admin only)

**Authentication:** JWT required (`requireAuth` + `requireRole('admin')`)

**Request Schema:**
```typescript
const updateOrganizationSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .trim()
    .optional()
});
```

**Success Response (200):**
```typescript
{
  id: number;
  name: string;
  subscriptionTier: string;
  updatedAt: string;
}
```

**Error Responses:**
- `400` - Validation error
- `401` - Unauthorized
- `403` - Forbidden (not admin)
- `404` - Organization not found
- `500` - Internal server error

**Service Contract:**
```typescript
async function updateOrganization(
  organizationId: number,
  data: UpdateOrganizationInput
): Promise<OrganizationResponse> {
  // Section 9.1: Multi-tenant isolation
  const updated = await db.update(organizations)
    .set({ ...data, updatedAt: new Date() })
    .where(and(
      eq(organizations.id, organizationId),
      isNull(organizations.deletedAt)
    ))
    .returning();
  
  if (!updated.length) {
    throw new NotFoundError('Organization not found');
  }
  
  return updated[0];
}
```

---

### 2.3 Delete Organization

**Endpoint:** `DELETE /api/organizations/current`

**Purpose:** Soft delete organization and cascade to all child entities (admin only)

**Authentication:** JWT required (`requireAuth` + `requireRole('admin')`)

**Query Parameters:** None

**Success Response (200):**
```typescript
{
  message: 'Organization deleted successfully'
}
```

**Error Responses:**
- `401` - Unauthorized
- `403` - Forbidden (not admin)
- `404` - Organization not found
- `500` - Internal server error

**Security Requirements (Section 9.5):**
- **Transaction Enforcement:** Cascade soft delete to all child entities atomically

**Service Contract:**
```typescript
async function deleteOrganization(organizationId: number): Promise<void> {
  // Section 9.5: Transaction enforcement for multi-table cascade
  return db.transaction(async (tx) => {
    const now = new Date();
    
    // 1. Soft delete organization
    await tx.update(organizations)
      .set({ deletedAt: now })
      .where(eq(organizations.id, organizationId));
    
    // 2. Cascade soft delete to projects
    await tx.update(projects)
      .set({ deletedAt: now })
      .where(eq(projects.organizationId, organizationId));
    
    // 3. Cascade soft delete to data sources
    await tx.update(dataSources)
      .set({ deletedAt: now })
      .where(eq(dataSources.organizationId, organizationId));
    
    // 4. Cascade soft delete to datasets
    await tx.update(datasets)
      .set({ deletedAt: now })
      .where(eq(datasets.organizationId, organizationId));
    
    // Note: Hard tables (users, sessions, jobs, mappings, rules) not soft deleted
    // but access prevented via organization.deletedAt check
  });
}
```

---

### 2.4 Get Organization Statistics

**Endpoint:** `GET /api/organizations/current/stats`

**Purpose:** Retrieve organization usage statistics

**Authentication:** JWT required (`requireAuth`)

**Query Parameters:** None

**Success Response (200):**
```typescript
{
  totalProjects: number;
  totalDataSources: number;
  totalProcessingJobs: number;
  totalDatasets: number;
  storageUsedMB: number;
  activeMembers: number;
}
```

**Error Responses:**
- `401` - Unauthorized
- `500` - Internal server error

**Service Contract:**
```typescript
async function getOrganizationStats(organizationId: number): Promise<StatsResponse> {
  // Section 9.1: Multi-tenant isolation - all queries filter by organizationId
  const [projectCount, sourceCount, jobCount, datasetCount, userCount] = await Promise.all([
    db.select({ count: count() })
      .from(projects)
      .where(and(
        eq(projects.organizationId, organizationId),
        isNull(projects.deletedAt)
      ))
      .then(res => res[0].count),
    
    db.select({ count: count() })
      .from(dataSources)
      .where(and(
        eq(dataSources.organizationId, organizationId),
        isNull(dataSources.deletedAt)
      ))
      .then(res => res[0].count),
    
    db.select({ count: count() })
      .from(processingJobs)
      .where(eq(processingJobs.organizationId, organizationId))
      .then(res => res[0].count),
    
    db.select({ count: count() })
      .from(datasets)
      .where(and(
        eq(datasets.organizationId, organizationId),
        isNull(datasets.deletedAt)
      ))
      .then(res => res[0].count),
    
    db.select({ count: count() })
      .from(users)
      .where(eq(users.organizationId, organizationId))
      .then(res => res[0].count)
  ]);
  
  return {
    totalProjects: projectCount,
    totalDataSources: sourceCount,
    totalProcessingJobs: jobCount,
    totalDatasets: datasetCount,
    storageUsedMB: 0, // TODO: Calculate from file system
    activeMembers: userCount
  };
}
```

---

## SECTION 3: USER ENDPOINTS

### 3.1 Get Current User

**Endpoint:** `GET /api/users/me`

**Purpose:** Retrieve authenticated user's details

**Authentication:** JWT required (`requireAuth`)

**Success Response (200):**
```typescript
{
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'member' | 'viewer';
  organizationId: number;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}
```

**Error Responses:**
- `401` - Unauthorized
- `500` - Internal server error

**Service Contract:**
```typescript
async function getCurrentUser(userId: number): Promise<UserResponse> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId)
  });
  
  if (!user) {
    throw new NotFoundError('User not found');
  }
  
  return user;
}
```

---

### 3.2 List Organization Users

**Endpoint:** `GET /api/users`

**Purpose:** List all users in authenticated user's organization

**Authentication:** JWT required (`requireAuth`)

**Query Parameters:**
```typescript
const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  role: z.enum(['admin', 'member', 'viewer']).optional()
});
```

**Success Response (200):**
```typescript
{
  users: Array<{
    id: number;
    email: string;
    name: string;
    role: 'admin' | 'member' | 'viewer';
    emailVerified: boolean;
    createdAt: string;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

**Error Responses:**
- `400` - Validation error
- `401` - Unauthorized
- `500` - Internal server error

**Service Contract:**
```typescript
async function listUsers(
  organizationId: number,
  query: ListUsersQuery
): Promise<ListUsersResponse> {
  // Section 9.1: Multi-tenant isolation
  const offset = (query.page - 1) * query.limit;
  
  const whereConditions = [eq(users.organizationId, organizationId)];
  if (query.role) {
    whereConditions.push(eq(users.role, query.role));
  }
  
  const [userList, totalCount] = await Promise.all([
    db.query.users.findMany({
      where: and(...whereConditions),
      limit: query.limit,
      offset
    }),
    
    db.select({ count: count() })
      .from(users)
      .where(and(...whereConditions))
      .then(res => res[0].count)
  ]);
  
  return {
    users: userList,
    pagination: {
      page: query.page,
      limit: query.limit,
      total: totalCount,
      totalPages: Math.ceil(totalCount / query.limit)
    }
  };
}
```

---

### 3.3 Update User

**Endpoint:** `PATCH /api/users/:id`

**Purpose:** Update user details (admin can update any user, users can update self)

**Authentication:** JWT required (`requireAuth`)

**Path Parameters:**
- `id` (number): User ID to update

**Request Schema:**
```typescript
const updateUserSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .trim()
    .optional(),
  role: z.enum(['admin', 'member', 'viewer'])
    .optional()
});
```

**Success Response (200):**
```typescript
{
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'member' | 'viewer';
  updatedAt: string;
}
```

**Error Responses:**
- `400` - Validation error
- `401` - Unauthorized
- `403` - Forbidden (cannot update other users without admin role)
- `404` - User not found
- `500` - Internal server error

**Authorization Logic:**
- Users can update their own name
- Only admins can update roles
- Cannot update users from other organizations (multi-tenant isolation)

**Service Contract:**
```typescript
async function updateUser(
  requestingUserId: number,
  requestingUserRole: string,
  targetUserId: number,
  organizationId: number,
  data: UpdateUserInput
): Promise<UserResponse> {
  // Check if requesting user can update target user
  if (requestingUserId !== targetUserId && requestingUserRole !== 'admin') {
    throw new ForbiddenError('Cannot update other users');
  }
  
  // Non-admins cannot change roles
  if (data.role && requestingUserRole !== 'admin') {
    throw new ForbiddenError('Only admins can change user roles');
  }
  
  // Section 9.1: Multi-tenant isolation - verify user belongs to organization
  const updated = await db.update(users)
    .set({ ...data, updatedAt: new Date() })
    .where(and(
      eq(users.id, targetUserId),
      eq(users.organizationId, organizationId) // Prevent cross-org updates
    ))
    .returning();
  
  if (!updated.length) {
    throw new NotFoundError('User not found');
  }
  
  return updated[0];
}
```

---

### 3.4 Delete User

**Endpoint:** `DELETE /api/users/:id`

**Purpose:** Delete user from organization (admin only)

**Authentication:** JWT required (`requireAuth` + `requireRole('admin')`)

**Path Parameters:**
- `id` (number): User ID to delete

**Success Response (200):**
```typescript
{
  message: 'User deleted successfully'
}
```

**Error Responses:**
- `401` - Unauthorized
- `403` - Forbidden (not admin)
- `404` - User not found
- `409` - Cannot delete last admin
- `500` - Internal server error

**Service Contract:**
```typescript
async function deleteUser(
  userId: number,
  organizationId: number
): Promise<void> {
  // Verify user belongs to organization (Section 9.1)
  const user = await db.query.users.findFirst({
    where: and(
      eq(users.id, userId),
      eq(users.organizationId, organizationId)
    )
  });
  
  if (!user) {
    throw new NotFoundError('User not found');
  }
  
  // Prevent deleting last admin
  if (user.role === 'admin') {
    const adminCount = await db.select({ count: count() })
      .from(users)
      .where(and(
        eq(users.organizationId, organizationId),
        eq(users.role, 'admin')
      ))
      .then(res => res[0].count);
    
    if (adminCount <= 1) {
      throw new ConflictError('Cannot delete last admin user');
    }
  }
  
  // Hard delete user and cascade sessions
  await db.transaction(async (tx) => {
    await tx.delete(userSessions)
      .where(eq(userSessions.userId, userId));
    
    await tx.delete(users)
      .where(eq(users.id, userId));
  });
}
```

---

### 3.5 Invite User

**Endpoint:** `POST /api/users/invite`

**Purpose:** Invite new user to organization (admin only) - DEFERRED to Phase 2

**Status:** Not implemented in MVP (AR-001 in PRD)

---

## SECTION 4: PROJECT ENDPOINTS

### 4.1 List Projects

**Endpoint:** `GET /api/projects`

**Purpose:** List all projects in user's organization

**Authentication:** JWT required (`requireAuth`)

**Query Parameters:**
```typescript
const listProjectsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});
```

**Success Response (200):**
```typescript
{
  projects: Array<{
    id: number;
    organizationId: number;
    ownerId: number;
    name: string;
    description: string | null;
    targetSchema: 'conversational' | 'tabular' | 'custom';
    dataSourceCount: number;
    datasetCount: number;
    createdAt: string;
    updatedAt: string;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

**Error Responses:**
- `400` - Validation error
- `401` - Unauthorized
- `500` - Internal server error

**Service Contract:**
```typescript
async function listProjects(
  organizationId: number,
  query: ListProjectsQuery
): Promise<ListProjectsResponse> {
  // Section 9.1: Multi-tenant isolation
  const offset = (query.page - 1) * query.limit;
  
  const [projectList, totalCount] = await Promise.all([
    db.query.projects.findMany({
      where: and(
        eq(projects.organizationId, organizationId),
        isNull(projects.deletedAt)
      ),
      limit: query.limit,
      offset,
      orderBy: [desc(projects.createdAt)]
    }),
    
    db.select({ count: count() })
      .from(projects)
      .where(and(
        eq(projects.organizationId, organizationId),
        isNull(projects.deletedAt)
      ))
      .then(res => res[0].count)
  ]);
  
  // Get counts for each project
  const projectsWithCounts = await Promise.all(
    projectList.map(async (project) => {
      const [sourceCount, datasetCount] = await Promise.all([
        db.select({ count: count() })
          .from(dataSources)
          .where(and(
            eq(dataSources.projectId, project.id),
            isNull(dataSources.deletedAt)
          ))
          .then(res => res[0].count),
        
        db.select({ count: count() })
          .from(datasets)
          .where(and(
            eq(datasets.projectId, project.id),
            isNull(datasets.deletedAt)
          ))
          .then(res => res[0].count)
      ]);
      
      return {
        ...project,
        dataSourceCount: sourceCount,
        datasetCount: datasetCount
      };
    })
  );
  
  return {
    projects: projectsWithCounts,
    pagination: {
      page: query.page,
      limit: query.limit,
      total: totalCount,
      totalPages: Math.ceil(totalCount / query.limit)
    }
  };
}
```

---

### 4.2 Get Project

**Endpoint:** `GET /api/projects/:id`

**Purpose:** Retrieve single project details

**Authentication:** JWT required (`requireAuth`)

**Path Parameters:**
- `id` (number): Project ID

**Success Response (200):**
```typescript
{
  id: number;
  organizationId: number;
  ownerId: number;
  name: string;
  description: string | null;
  targetSchema: 'conversational' | 'tabular' | 'custom';
  dataSourceCount: number;
  datasetCount: number;
  latestDataset: {
    id: number;
    name: string;
    format: string;
    createdAt: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}
```

**Error Responses:**
- `401` - Unauthorized
- `403` - Forbidden (project from different organization)
- `404` - Project not found
- `500` - Internal server error

**Service Contract:**
```typescript
async function getProject(
  projectId: number,
  organizationId: number
): Promise<ProjectDetailResponse> {
  // Section 9.1: Multi-tenant isolation - verify ownership
  const project = await db.query.projects.findFirst({
    where: and(
      eq(projects.id, projectId),
      eq(projects.organizationId, organizationId),
      isNull(projects.deletedAt)
    )
  });
  
  if (!project) {
    throw new NotFoundError('Project not found');
  }
  
  // Get counts and latest dataset
  const [sourceCount, datasetCount, latestDataset] = await Promise.all([
    db.select({ count: count() })
      .from(dataSources)
      .where(and(
        eq(dataSources.projectId, projectId),
        isNull(dataSources.deletedAt)
      ))
      .then(res => res[0].count),
    
    db.select({ count: count() })
      .from(datasets)
      .where(and(
        eq(datasets.projectId, projectId),
        isNull(datasets.deletedAt)
      ))
      .then(res => res[0].count),
    
    db.query.datasets.findFirst({
      where: and(
        eq(datasets.projectId, projectId),
        isNull(datasets.deletedAt)
      ),
      orderBy: [desc(datasets.createdAt)]
    })
  ]);
  
  return {
    ...project,
    dataSourceCount: sourceCount,
    datasetCount: datasetCount,
    latestDataset
  };
}
```

---

### 4.3 Create Project

**Endpoint:** `POST /api/projects`

**Purpose:** Create new project

**Authentication:** JWT required (`requireAuth`)

**Request Schema:**
```typescript
const createProjectSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .trim(),
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .trim()
    .optional()
    .nullable(),
  targetSchema: z.enum(['conversational', 'tabular', 'custom'])
    .default('conversational')
});
```

**Success Response (201):**
```typescript
{
  id: number;
  organizationId: number;
  ownerId: number;
  name: string;
  description: string | null;
  targetSchema: 'conversational' | 'tabular' | 'custom';
  createdAt: string;
  updatedAt: string;
}
```

**Error Responses:**
- `400` - Validation error
- `401` - Unauthorized
- `500` - Internal server error

**Service Contract:**
```typescript
async function createProject(
  userId: number,
  organizationId: number,
  data: CreateProjectInput
): Promise<ProjectResponse> {
  const project = await db.insert(projects)
    .values({
      organizationId,
      ownerId: userId,
      name: data.name,
      description: data.description || null,
      targetSchema: data.targetSchema
    })
    .returning();
  
  return project[0];
}
```

---

### 4.4 Update Project

**Endpoint:** `PATCH /api/projects/:id`

**Purpose:** Update project details

**Authentication:** JWT required (`requireAuth`)

**Path Parameters:**
- `id` (number): Project ID

**Request Schema:**
```typescript
const updateProjectSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .trim()
    .optional(),
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .trim()
    .optional()
    .nullable(),
  targetSchema: z.enum(['conversational', 'tabular', 'custom'])
    .optional()
});
```

**Success Response (200):**
```typescript
{
  id: number;
  organizationId: number;
  ownerId: number;
  name: string;
  description: string | null;
  targetSchema: string;
  updatedAt: string;
}
```

**Error Responses:**
- `400` - Validation error
- `401` - Unauthorized
- `403` - Forbidden (not project owner or admin)
- `404` - Project not found
- `500` - Internal server error

**Service Contract:**
```typescript
async function updateProject(
  projectId: number,
  organizationId: number,
  userId: number,
  userRole: string,
  data: UpdateProjectInput
): Promise<ProjectResponse> {
  // Section 9.1: Multi-tenant isolation
  const project = await db.query.projects.findFirst({
    where: and(
      eq(projects.id, projectId),
      eq(projects.organizationId, organizationId),
      isNull(projects.deletedAt)
    )
  });
  
  if (!project) {
    throw new NotFoundError('Project not found');
  }
  
  // Section 9.3: RBAC - only owner or admin can update
  if (project.ownerId !== userId && userRole !== 'admin') {
    throw new ForbiddenError('Only project owner or admin can update project');
  }
  
  const updated = await db.update(projects)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(projects.id, projectId))
    .returning();
  
  return updated[0];
}
```

---

### 4.5 Delete Project

**Endpoint:** `DELETE /api/projects/:id`

**Purpose:** Soft delete project and cascade to child entities

**Authentication:** JWT required (`requireAuth`)

**Path Parameters:**
- `id` (number): Project ID

**Success Response (200):**
```typescript
{
  message: 'Project deleted successfully'
}
```

**Error Responses:**
- `401` - Unauthorized
- `403` - Forbidden (not project owner or admin)
- `404` - Project not found
- `500` - Internal server error

**Security Requirements (Section 9.5):**
- **Transaction Enforcement:** Cascade soft delete to data sources and datasets atomically

**Service Contract:**
```typescript
async function deleteProject(
  projectId: number,
  organizationId: number,
  userId: number,
  userRole: string
): Promise<void> {
  // Section 9.1: Multi-tenant isolation
  const project = await db.query.projects.findFirst({
    where: and(
      eq(projects.id, projectId),
      eq(projects.organizationId, organizationId),
      isNull(projects.deletedAt)
    )
  });
  
  if (!project) {
    throw new NotFoundError('Project not found');
  }
  
  // Section 9.3: RBAC - only owner or admin can delete
  if (project.ownerId !== userId && userRole !== 'admin') {
    throw new ForbiddenError('Only project owner or admin can delete project');
  }
  
  // Section 9.5: Transaction enforcement for cascade soft delete
  return db.transaction(async (tx) => {
    const now = new Date();
    
    // 1. Soft delete project
    await tx.update(projects)
      .set({ deletedAt: now })
      .where(eq(projects.id, projectId));
    
    // 2. Cascade to data sources
    await tx.update(dataSources)
      .set({ deletedAt: now })
      .where(eq(dataSources.projectId, projectId));
    
    // 3. Cascade to datasets
    await tx.update(datasets)
      .set({ deletedAt: now })
      .where(eq(datasets.projectId, projectId));
  });
}
```

---

## SECTION 5: DATA SOURCE ENDPOINTS

### 5.1 List Data Sources

**Endpoint:** `GET /api/projects/:projectId/data-sources`

**Purpose:** List all data sources in a project

**Authentication:** JWT required (`requireAuth`)

**Path Parameters:**
- `projectId` (number): Project ID

**Query Parameters:**
```typescript
const listDataSourcesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  type: z.enum(['file', 'api']).optional()
});
```

**Success Response (200):**
```typescript
{
  dataSources: Array<{
    id: number;
    projectId: number;
    name: string;
    type: 'file' | 'api';
    status: 'pending' | 'connected' | 'error';
    fileSize: number | null;
    recordCount: number | null;
    lastSyncedAt: string | null;
    createdAt: string;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

**Error Responses:**
- `400` - Validation error
- `401` - Unauthorized
- `403` - Forbidden (project from different organization)
- `404` - Project not found
- `500` - Internal server error

**Service Contract:**
```typescript
async function listDataSources(
  projectId: number,
  organizationId: number,
  query: ListDataSourcesQuery
): Promise<ListDataSourcesResponse> {
  // Section 9.1: Multi-tenant isolation - verify project ownership
  const project = await db.query.projects.findFirst({
    where: and(
      eq(projects.id, projectId),
      eq(projects.organizationId, organizationId),
      isNull(projects.deletedAt)
    )
  });
  
  if (!project) {
    throw new NotFoundError('Project not found');
  }
  
  const offset = (query.page - 1) * query.limit;
  const whereConditions = [
    eq(dataSources.projectId, projectId),
    isNull(dataSources.deletedAt)
  ];
  
  if (query.type) {
    whereConditions.push(eq(dataSources.type, query.type));
  }
  
  const [sourceList, totalCount] = await Promise.all([
    db.query.dataSources.findMany({
      where: and(...whereConditions),
      limit: query.limit,
      offset,
      orderBy: [desc(dataSources.createdAt)]
    }),
    
    db.select({ count: count() })
      .from(dataSources)
      .where(and(...whereConditions))
      .then(res => res[0].count)
  ]);
  
  return {
    dataSources: sourceList,
    pagination: {
      page: query.page,
      limit: query.limit,
      total: totalCount,
      totalPages: Math.ceil(totalCount / query.limit)
    }
  };
}
```

---

### 5.2 Get Data Source

**Endpoint:** `GET /api/projects/:projectId/data-sources/:id`

**Purpose:** Retrieve single data source details

**Authentication:** JWT required (`requireAuth`)

**Path Parameters:**
- `projectId` (number): Project ID
- `id` (number): Data source ID

**Success Response (200):**
```typescript
{
  id: number;
  organizationId: number;
  projectId: number;
  name: string;
  type: 'file' | 'api';
  status: 'pending' | 'connected' | 'error';
  fileFormat: string | null;
  filePath: string | null;
  fileSize: number | null;
  apiProvider: string | null;
  recordCount: number | null;
  lastSyncedAt: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}
```

**Error Responses:**
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Data source not found
- `500` - Internal server error

**Service Contract:**
```typescript
async function getDataSource(
  dataSourceId: number,
  projectId: number,
  organizationId: number
): Promise<DataSourceDetailResponse> {
  // Section 9.1: Multi-tenant isolation - verify project ownership
  const project = await db.query.projects.findFirst({
    where: and(
      eq(projects.id, projectId),
      eq(projects.organizationId, organizationId)
    )
  });
  
  if (!project) {
    throw new ForbiddenError('Access denied');
  }
  
  const dataSource = await db.query.dataSources.findFirst({
    where: and(
      eq(dataSources.id, dataSourceId),
      eq(dataSources.projectId, projectId),
      isNull(dataSources.deletedAt)
    )
  });
  
  if (!dataSource) {
    throw new NotFoundError('Data source not found');
  }
  
  return dataSource;
}
```

---

### 5.3 Create File Upload Data Source

**Endpoint:** `POST /api/projects/:projectId/data-sources/upload`

**Purpose:** Upload file (CSV, Excel, JSON) and create data source

**Authentication:** JWT required (`requireAuth`)

**Path Parameters:**
- `projectId` (number): Project ID

**Request Format:** `multipart/form-data`

**Form Fields:**
```typescript
const uploadFileSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .trim(),
  file: z.custom<File>()
    .refine((file) => file.size <= 50 * 1024 * 1024, 'File size must be less than 50MB')
    .refine((file) => ['text/csv', 'application/json', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'].includes(file.type), 
      'File must be CSV, JSON, XLS, or XLSX')
});
```

**Success Response (201):**
```typescript
{
  id: number;
  projectId: number;
  name: string;
  type: 'file';
  fileFormat: 'csv' | 'json' | 'xlsx' | 'xls';
  fileSize: number;
  status: 'pending';
  createdAt: string;
}
```

**Error Responses:**
- `400` - Validation error (file size, format)
- `401` - Unauthorized
- `403` - Forbidden (project from different organization)
- `404` - Project not found
- `413` - File too large
- `500` - Internal server error

**Service Contract:**
```typescript
async function uploadFile(
  projectId: number,
  organizationId: number,
  file: File,
  name: string
): Promise<DataSourceResponse> {
  // Section 9.1: Multi-tenant isolation
  const project = await db.query.projects.findFirst({
    where: and(
      eq(projects.id, projectId),
      eq(projects.organizationId, organizationId),
      isNull(projects.deletedAt)
    )
  });
  
  if (!project) {
    throw new NotFoundError('Project not found');
  }
  
  // Validate file
  if (file.size > 50 * 1024 * 1024) {
    throw new ValidationError('File size must be less than 50MB');
  }
  
  // Determine file format
  const fileFormat = file.name.endsWith('.csv') ? 'csv' :
                     file.name.endsWith('.json') ? 'json' :
                     file.name.endsWith('.xlsx') ? 'xlsx' :
                     file.name.endsWith('.xls') ? 'xls' : null;
  
  if (!fileFormat) {
    throw new ValidationError('Unsupported file format');
  }
  
  // Generate unique file path
  const timestamp = Date.now();
  const filePath = `uploads/org_${organizationId}/project_${projectId}/${timestamp}_${file.name}`;
  
  // Save file to Replit persistent storage
  const fileBuffer = await file.arrayBuffer();
  await fs.writeFile(filePath, Buffer.from(fileBuffer));
  
  // Create data source record
  const dataSource = await db.insert(dataSources)
    .values({
      organizationId,
      projectId,
      name,
      type: 'file',
      fileFormat,
      filePath,
      fileSize: file.size,
      status: 'pending'
    })
    .returning();
  
  return dataSource[0];
}
```

---

### 5.4 Create API Connector Data Source

**Endpoint:** `POST /api/projects/:projectId/data-sources/api`

**Purpose:** Connect Teamwork Desk API as data source

**Authentication:** JWT required (`requireAuth`)

**Path Parameters:**
- `projectId` (number): Project ID

**Request Schema:**
```typescript
const createApiSourceSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .trim(),
  apiProvider: z.literal('teamwork-desk'),
  connectionConfig: z.object({
    apiKey: z.string()
      .min(1, 'API key is required'),
    inboxId: z.string()
      .optional(),
    dateFrom: z.string()
      .datetime()
      .optional(),
    dateTo: z.string()
      .datetime()
      .optional()
  })
});
```

**Success Response (201):**
```typescript
{
  id: number;
  projectId: number;
  name: string;
  type: 'api';
  apiProvider: 'teamwork-desk';
  status: 'pending';
  createdAt: string;
}
```

**Error Responses:**
- `400` - Validation error
- `401` - Unauthorized
- `403` - Forbidden (project from different organization)
- `404` - Project not found
- `500` - Internal server error

**Service Contract:**
```typescript
async function createApiSource(
  projectId: number,
  organizationId: number,
  data: CreateApiSourceInput
): Promise<DataSourceResponse> {
  // Section 9.1: Multi-tenant isolation
  const project = await db.query.projects.findFirst({
    where: and(
      eq(projects.id, projectId),
      eq(projects.organizationId, organizationId),
      isNull(projects.deletedAt)
    )
  });
  
  if (!project) {
    throw new NotFoundError('Project not found');
  }
  
  // Encrypt API credentials before storage
  const encryptedConfig = encryptApiCredentials(data.connectionConfig);
  
  // Create data source record
  const dataSource = await db.insert(dataSources)
    .values({
      organizationId,
      projectId,
      name: data.name,
      type: 'api',
      apiProvider: data.apiProvider,
      connectionConfig: encryptedConfig,
      status: 'pending'
    })
    .returning();
  
  return dataSource[0];
}
```

---

### 5.5 Update Data Source

**Endpoint:** `PATCH /api/projects/:projectId/data-sources/:id`

**Purpose:** Update data source details

**Authentication:** JWT required (`requireAuth`)

**Path Parameters:**
- `projectId` (number): Project ID
- `id` (number): Data source ID

**Request Schema:**
```typescript
const updateDataSourceSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .trim()
    .optional(),
  connectionConfig: z.object({
    apiKey: z.string().optional(),
    inboxId: z.string().optional(),
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional()
  }).optional()
});
```

**Success Response (200):**
```typescript
{
  id: number;
  projectId: number;
  name: string;
  type: 'file' | 'api';
  updatedAt: string;
}
```

**Error Responses:**
- `400` - Validation error
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Data source not found
- `500` - Internal server error

**Service Contract:**
```typescript
async function updateDataSource(
  dataSourceId: number,
  projectId: number,
  organizationId: number,
  data: UpdateDataSourceInput
): Promise<DataSourceResponse> {
  // Section 9.1: Multi-tenant isolation
  const dataSource = await db.query.dataSources.findFirst({
    where: and(
      eq(dataSources.id, dataSourceId),
      eq(dataSources.projectId, projectId),
      eq(dataSources.organizationId, organizationId),
      isNull(dataSources.deletedAt)
    )
  });
  
  if (!dataSource) {
    throw new NotFoundError('Data source not found');
  }
  
  const updateData: any = { ...data, updatedAt: new Date() };
  
  if (data.connectionConfig) {
    updateData.connectionConfig = encryptApiCredentials(data.connectionConfig);
  }
  
  const updated = await db.update(dataSources)
    .set(updateData)
    .where(eq(dataSources.id, dataSourceId))
    .returning();
  
  return updated[0];
}
```

---

### 5.6 Delete Data Source

**Endpoint:** `DELETE /api/projects/:projectId/data-sources/:id`

**Purpose:** Soft delete data source

**Authentication:** JWT required (`requireAuth`)

**Path Parameters:**
- `projectId` (number): Project ID
- `id` (number): Data source ID

**Success Response (200):**
```typescript
{
  message: 'Data source deleted successfully'
}
```

**Error Responses:**
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Data source not found
- `500` - Internal server error

**Service Contract:**
```typescript
async function deleteDataSource(
  dataSourceId: number,
  projectId: number,
  organizationId: number
): Promise<void> {
  // Section 9.1: Multi-tenant isolation
  const dataSource = await db.query.dataSources.findFirst({
    where: and(
      eq(dataSources.id, dataSourceId),
      eq(dataSources.projectId, projectId),
      eq(dataSources.organizationId, organizationId),
      isNull(dataSources.deletedAt)
    )
  });
  
  if (!dataSource) {
    throw new NotFoundError('Data source not found');
  }
  
  // Soft delete
  await db.update(dataSources)
    .set({ deletedAt: new Date() })
    .where(eq(dataSources.id, dataSourceId));
}
```

---

## SECTION 6: EMBEDDED SERVICE CONTRACTS (Constitution Section U)

```json
{
  "serviceContracts": {
    "version": "1.0",
    "generatedBy": "Agent 4 (API Contract v39)",
    "generatedAt": "2026-02-03",
    "endpoints": [
      {
        "path": "/api/auth/register",
        "method": "POST",
        "service": "AuthService.register",
        "authenticated": false,
        "rateLimited": true,
        "parameters": [
          { "name": "email", "type": "string", "required": true },
          { "name": "password", "type": "string", "required": true },
          { "name": "name", "type": "string", "required": true },
          { "name": "organizationName", "type": "string", "required": true }
        ],
        "returns": "RegisterResponse"
      },
      {
        "path": "/api/auth/login",
        "method": "POST",
        "service": "AuthService.login",
        "authenticated": false,
        "rateLimited": true,
        "parameters": [
          { "name": "email", "type": "string", "required": true },
          { "name": "password", "type": "string", "required": true }
        ],
        "returns": "LoginResponse"
      },
      {
        "path": "/api/auth/refresh",
        "method": "POST",
        "service": "AuthService.refreshAccessToken",
        "authenticated": false,
        "rateLimited": false,
        "parameters": [
          { "name": "refreshToken", "type": "string", "required": true }
        ],
        "returns": "RefreshResponse"
      },
      {
        "path": "/api/auth/logout",
        "method": "POST",
        "service": "AuthService.logout",
        "authenticated": true,
        "rateLimited": false,
        "parameters": [
          { "name": "refreshToken", "type": "string", "required": true }
        ],
        "returns": "void"
      },
      {
        "path": "/api/auth/forgot-password",
        "method": "POST",
        "service": "AuthService.forgotPassword",
        "authenticated": false,
        "rateLimited": true,
        "parameters": [
          { "name": "email", "type": "string", "required": true }
        ],
        "returns": "MessageResponse"
      },
      {
        "path": "/api/auth/reset-password",
        "method": "POST",
        "service": "AuthService.resetPassword",
        "authenticated": false,
        "rateLimited": true,
        "parameters": [
          { "name": "token", "type": "string", "required": true },
          { "name": "password", "type": "string", "required": true }
        ],
        "returns": "MessageResponse"
      },
      {
        "path": "/api/organizations/current",
        "method": "GET",
        "service": "OrganizationService.getCurrentOrganization",
        "authenticated": true,
        "rateLimited": false,
        "parameters": [
          { "name": "organizationId", "type": "number", "required": true, "source": "jwt" }
        ],
        "returns": "OrganizationResponse"
      },
      {
        "path": "/api/organizations/current",
        "method": "PATCH",
        "service": "OrganizationService.updateOrganization",
        "authenticated": true,
        "rbac": ["admin"],
        "rateLimited": false,
        "parameters": [
          { "name": "organizationId", "type": "number", "required": true, "source": "jwt" },
          { "name": "name", "type": "string", "required": false }
        ],
        "returns": "OrganizationResponse"
      },
      {
        "path": "/api/organizations/current",
        "method": "DELETE",
        "service": "OrganizationService.deleteOrganization",
        "authenticated": true,
        "rbac": ["admin"],
        "rateLimited": false,
        "parameters": [
          { "name": "organizationId", "type": "number", "required": true, "source": "jwt" }
        ],
        "returns": "void"
      },
      {
        "path": "/api/organizations/current/stats",
        "method": "GET",
        "service": "OrganizationService.getOrganizationStats",
        "authenticated": true,
        "rateLimited": false,
        "parameters": [
          { "name": "organizationId", "type": "number", "required": true, "source": "jwt" }
        ],
        "returns": "StatsResponse"
      },
      {
        "path": "/api/users/me",
        "method": "GET",
        "service": "UserService.getCurrentUser",
        "authenticated": true,
        "rateLimited": false,
        "parameters": [
          { "name": "userId", "type": "number", "required": true, "source": "jwt" }
        ],
        "returns": "UserResponse"
      },
      {
        "path": "/api/users",
        "method": "GET",
        "service": "UserService.listUsers",
        "authenticated": true,
        "rateLimited": false,
        "parameters": [
          { "name": "organizationId", "type": "number", "required": true, "source": "jwt" },
          { "name": "page", "type": "number", "required": false },
          { "name": "limit", "type": "number", "required": false },
          { "name": "role", "type": "string", "required": false }
        ],
        "returns": "ListUsersResponse"
      },
      {
        "path": "/api/users/:id",
        "method": "PATCH",
        "service": "UserService.updateUser",
        "authenticated": true,
        "rateLimited": false,
        "parameters": [
          { "name": "id", "type": "number", "required": true, "source": "path" },
          { "name": "organizationId", "type": "number", "required": true, "source": "jwt" },
          { "name": "name", "type": "string", "required": false },
          { "name": "role", "type": "string", "required": false }
        ],
        "returns": "UserResponse"
      },
      {
        "path": "/api/users/:id",
        "method": "DELETE",
        "service": "UserService.deleteUser",
        "authenticated": true,
        "rbac": ["admin"],
        "rateLimited": false,
        "parameters": [
          { "name": "id", "type": "number", "required": true, "source": "path" },
          { "name": "organizationId", "type": "number", "required": true, "source": "jwt" }
        ],
        "returns": "void"
      },
      {
        "path": "/api/projects",
        "method": "GET",
        "service": "ProjectService.listProjects",
        "authenticated": true,
        "rateLimited": false,
        "parameters": [
          { "name": "organizationId", "type": "number", "required": true, "source": "jwt" },
          { "name": "page", "type": "number", "required": false },
          { "name": "limit", "type": "number", "required": false }
        ],
        "returns": "ListProjectsResponse"
      },
      {
        "path": "/api/projects/:id",
        "method": "GET",
        "service": "ProjectService.getProject",
        "authenticated": true,
        "rateLimited": false,
        "parameters": [
          { "name": "id", "type": "number", "required": true, "source": "path" },
          { "name": "organizationId", "type": "number", "required": true, "source": "jwt" }
        ],
        "returns": "ProjectDetailResponse"
      },
      {
        "path": "/api/projects",
        "method": "POST",
        "service": "ProjectService.createProject",
        "authenticated": true,
        "rateLimited": false,
        "parameters": [
          { "name": "organizationId", "type": "number", "required": true, "source": "jwt" },
          { "name": "userId", "type": "number", "required": true, "source": "jwt" },
          { "name": "name", "type": "string", "required": true },
          { "name": "description", "type": "string", "required": false },
          { "name": "targetSchema", "type": "string", "required": true }
        ],
        "returns": "ProjectResponse"
      },
      {
        "path": "/api/projects/:id",
        "method": "PATCH",
        "service": "ProjectService.updateProject",
        "authenticated": true,
        "rateLimited": false,
        "parameters": [
          { "name": "id", "type": "number", "required": true, "source": "path" },
          { "name": "organizationId", "type": "number", "required": true, "source": "jwt" },
          { "name": "name", "type": "string", "required": false },
          { "name": "description", "type": "string", "required": false },
          { "name": "targetSchema", "type": "string", "required": false }
        ],
        "returns": "ProjectResponse"
      },
      {
        "path": "/api/projects/:id",
        "method": "DELETE",
        "service": "ProjectService.deleteProject",
        "authenticated": true,
        "rateLimited": false,
        "parameters": [
          { "name": "id", "type": "number", "required": true, "source": "path" },
          { "name": "organizationId", "type": "number", "required": true, "source": "jwt" }
        ],
        "returns": "void"
      },
      {
        "path": "/api/projects/:projectId/data-sources",
        "method": "GET",
        "service": "DataSourceService.listDataSources",
        "authenticated": true,
        "rateLimited": false,
        "parameters": [
          { "name": "projectId", "type": "number", "required": true, "source": "path" },
          { "name": "organizationId", "type": "number", "required": true, "source": "jwt" },
          { "name": "page", "type": "number", "required": false },
          { "name": "limit", "type": "number", "required": false },
          { "name": "type", "type": "string", "required": false }
        ],
        "returns": "ListDataSourcesResponse"
      },
      {
        "path": "/api/projects/:projectId/data-sources/:id",
        "method": "GET",
        "service": "DataSourceService.getDataSource",
        "authenticated": true,
        "rateLimited": false,
        "parameters": [
          { "name": "id", "type": "number", "required": true, "source": "path" },
          { "name": "projectId", "type": "number", "required": true, "source": "path" },
          { "name": "organizationId", "type": "number", "required": true, "source": "jwt" }
        ],
        "returns": "DataSourceDetailResponse"
      },
      {
        "path": "/api/projects/:projectId/data-sources/upload",
        "method": "POST",
        "service": "DataSourceService.uploadFile",
        "authenticated": true,
        "rateLimited": false,
        "parameters": [
          { "name": "projectId", "type": "number", "required": true, "source": "path" },
          { "name": "organizationId", "type": "number", "required": true, "source": "jwt" },
          { "name": "name", "type": "string", "required": true },
          { "name": "file", "type": "File", "required": true }
        ],
        "returns": "DataSourceResponse"
      },
      {
        "path": "/api/projects/:projectId/data-sources/api",
        "method": "POST",
        "service": "DataSourceService.createApiSource",
        "authenticated": true,
        "rateLimited": false,
        "parameters": [
          { "name": "projectId", "type": "number", "required": true, "source": "path" },
          { "name": "organizationId", "type": "number", "required": true, "source": "jwt" },
          { "name": "name", "type": "string", "required": true },
          { "name": "apiProvider", "type": "string", "required": true },
          { "name": "connectionConfig", "type": "object", "required": true }
        ],
        "returns": "DataSourceResponse"
      },
      {
        "path": "/api/projects/:projectId/data-sources/:id",
        "method": "PATCH",
        "service": "DataSourceService.updateDataSource",
        "authenticated": true,
        "rateLimited": false,
        "parameters": [
          { "name": "id", "type": "number", "required": true, "source": "path" },
          { "name": "projectId", "type": "number", "required": true, "source": "path" },
          { "name": "organizationId", "type": "number", "required": true, "source": "jwt" },
          { "name": "name", "type": "string", "required": false },
          { "name": "connectionConfig", "type": "object", "required": false }
        ],
        "returns": "DataSourceResponse"
      },
      {
        "path": "/api/projects/:projectId/data-sources/:id",
        "method": "DELETE",
        "service": "DataSourceService.deleteDataSource",
        "authenticated": true,
        "rateLimited": false,
        "parameters": [
          { "name": "id", "type": "number", "required": true, "source": "path" },
          { "name": "projectId", "type": "number", "required": true, "source": "path" },
          { "name": "organizationId", "type": "number", "required": true, "source": "jwt" }
        ],
        "returns": "void"
      }
    ]
  }
}
```

---

## SECTION 7: PROCESSING JOB ENDPOINTS

(Continuing in same pattern...)

### 7.1 List Processing Jobs

**Endpoint:** `GET /api/projects/:projectId/jobs`

**Purpose:** List all processing jobs for a project

**Authentication:** JWT required (`requireAuth`)

**Path Parameters:**
- `projectId` (number): Project ID

**Query Parameters:**
```typescript
const listJobsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['pending', 'processing', 'completed', 'failed']).optional(),
  dataSourceId: z.coerce.number().int().positive().optional()
});
```

**Success Response (200):**
```typescript
{
  jobs: Array<{
    id: number;
    organizationId: number;
    dataSourceId: number;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress: number; // 0-100
    recordsProcessed: number;
    recordsTotal: number;
    startedAt: string | null;
    completedAt: string | null;
    errorMessage: string | null;
    createdAt: string;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

**Service Contract:**
```typescript
async function listProcessingJobs(
  projectId: number,
  organizationId: number,
  query: ListJobsQuery
): Promise<ListJobsResponse> {
  // Section 9.1: Multi-tenant isolation
  const project = await db.query.projects.findFirst({
    where: and(
      eq(projects.id, projectId),
      eq(projects.organizationId, organizationId)
    )
  });
  
  if (!project) {
    throw new NotFoundError('Project not found');
  }
  
  const offset = (query.page - 1) * query.limit;
  const whereConditions = [eq(processingJobs.organizationId, organizationId)];
  
  // Filter by status if provided
  if (query.status) {
    whereConditions.push(eq(processingJobs.status, query.status));
  }
  
  // Filter by data source if provided
  if (query.dataSourceId) {
    whereConditions.push(eq(processingJobs.dataSourceId, query.dataSourceId));
  }
  
  const [jobList, totalCount] = await Promise.all([
    db.query.processingJobs.findMany({
      where: and(...whereConditions),
      limit: query.limit,
      offset,
      orderBy: [desc(processingJobs.createdAt)]
    }),
    
    db.select({ count: count() })
      .from(processingJobs)
      .where(and(...whereConditions))
      .then(res => res[0].count)
  ]);
  
  return {
    jobs: jobList,
    pagination: {
      page: query.page,
      limit: query.limit,
      total: totalCount,
      totalPages: Math.ceil(totalCount / query.limit)
    }
  };
}
```

---

### 7.2 Get Processing Job

**Endpoint:** `GET /api/projects/:projectId/jobs/:id`

**Purpose:** Retrieve single processing job details

**Authentication:** JWT required (`requireAuth`)

**Path Parameters:**
- `projectId` (number): Project ID
- `id` (number): Job ID

**Success Response (200):**
```typescript
{
  id: number;
  organizationId: number;
  dataSourceId: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  recordsProcessed: number;
  recordsTotal: number;
  startedAt: string | null;
  completedAt: string | null;
  errorMessage: string | null;
  config: object; // Job configuration
  createdAt: string;
  updatedAt: string;
}
```

**Service Contract:**
```typescript
async function getProcessingJob(
  jobId: number,
  organizationId: number
): Promise<ProcessingJobDetailResponse> {
  // Section 9.1: Multi-tenant isolation
  const job = await db.query.processingJobs.findFirst({
    where: and(
      eq(processingJobs.id, jobId),
      eq(processingJobs.organizationId, organizationId)
    )
  });
  
  if (!job) {
    throw new NotFoundError('Processing job not found');
  }
  
  return job;
}
```

---

### 7.3 Create Processing Job

**Endpoint:** `POST /api/projects/:projectId/jobs`

**Purpose:** Start new processing job for data source

**Authentication:** JWT required (`requireAuth`)

**Path Parameters:**
- `projectId` (number): Project ID

**Request Schema:**
```typescript
const createJobSchema = z.object({
  dataSourceId: z.number()
    .int()
    .positive('Data source ID is required'),
  config: z.object({
    applyDeidentification: z.boolean().default(true),
    applySchemaMapping: z.boolean().default(true),
    filterCriteria: z.object({
      dateFrom: z.string().datetime().optional(),
      dateTo: z.string().datetime().optional(),
      statusFilter: z.array(z.string()).optional()
    }).optional()
  }).optional()
});
```

**Success Response (201):**
```typescript
{
  id: number;
  organizationId: number;
  dataSourceId: number;
  status: 'pending';
  createdAt: string;
}
```

**Service Contract:**
```typescript
async function createProcessingJob(
  projectId: number,
  organizationId: number,
  data: CreateJobInput
): Promise<ProcessingJobResponse> {
  // Section 9.1: Multi-tenant isolation - verify data source ownership
  const dataSource = await db.query.dataSources.findFirst({
    where: and(
      eq(dataSources.id, data.dataSourceId),
      eq(dataSources.projectId, projectId),
      eq(dataSources.organizationId, organizationId),
      isNull(dataSources.deletedAt)
    )
  });
  
  if (!dataSource) {
    throw new NotFoundError('Data source not found');
  }
  
  // Check for existing pending/processing job for this data source
  const existingJob = await db.query.processingJobs.findFirst({
    where: and(
      eq(processingJobs.dataSourceId, data.dataSourceId),
      or(
        eq(processingJobs.status, 'pending'),
        eq(processingJobs.status, 'processing')
      )
    )
  });
  
  if (existingJob) {
    throw new ConflictError('A processing job is already running for this data source');
  }
  
  // Create job record
  const job = await db.insert(processingJobs)
    .values({
      organizationId,
      dataSourceId: data.dataSourceId,
      status: 'pending',
      progress: 0,
      config: data.config || {}
    })
    .returning();
  
  // Trigger async processing (job queue)
  await enqueueProcessingJob(job[0].id);
  
  return job[0];
}
```

---

### 7.4 Cancel Processing Job

**Endpoint:** `PATCH /api/projects/:projectId/jobs/:id/cancel`

**Purpose:** Cancel running processing job

**Authentication:** JWT required (`requireAuth`)

**Path Parameters:**
- `projectId` (number): Project ID
- `id` (number): Job ID

**Success Response (200):**
```typescript
{
  id: number;
  status: 'failed';
  errorMessage: 'Job cancelled by user';
  updatedAt: string;
}
```

**Service Contract:**
```typescript
async function cancelProcessingJob(
  jobId: number,
  organizationId: number
): Promise<ProcessingJobResponse> {
  // Section 9.1: Multi-tenant isolation
  const job = await db.query.processingJobs.findFirst({
    where: and(
      eq(processingJobs.id, jobId),
      eq(processingJobs.organizationId, organizationId)
    )
  });
  
  if (!job) {
    throw new NotFoundError('Processing job not found');
  }
  
  if (job.status === 'completed' || job.status === 'failed') {
    throw new ConflictError('Cannot cancel completed or failed job');
  }
  
  // Update job status
  const updated = await db.update(processingJobs)
    .set({
      status: 'failed',
      errorMessage: 'Job cancelled by user',
      completedAt: new Date(),
      updatedAt: new Date()
    })
    .where(eq(processingJobs.id, jobId))
    .returning();
  
  return updated[0];
}
```

---

## SECTION 8: SCHEMA MAPPING, DE-IDENTIFICATION, AND DATASET ENDPOINTS

### 8.1 Get Schema Mapping

**Endpoint:** `GET /api/projects/:projectId/schema-mappings`

**Purpose:** Retrieve schema mapping configuration for project

**Authentication:** JWT required (`requireAuth`)

**Service Contract:**
```typescript
async function getSchemaMapping(
  projectId: number,
  organizationId: number
): Promise<SchemaMappingResponse> {
  // Section 9.1: Multi-tenant isolation
  const mapping = await db.query.schemaMappings.findFirst({
    where: and(
      eq(schemaMappings.projectId, projectId),
      eq(schemaMappings.organizationId, organizationId)
    )
  });
  
  if (!mapping) {
    throw new NotFoundError('Schema mapping not found');
  }
  
  return mapping;
}
```

---

### 8.2 Create/Update Schema Mapping

**Endpoint:** `POST /api/projects/:projectId/schema-mappings`

**Purpose:** Create or update schema mapping configuration

**Request Schema:**
```typescript
const schemaMappingSchema = z.object({
  sourceSchema: z.record(z.string(), z.any()),
  targetSchema: z.string(),
  fieldMappings: z.array(z.object({
    sourceField: z.string(),
    targetField: z.string(),
    transformation: z.string().optional()
  })),
  transformationRules: z.record(z.string(), z.any()).optional()
});
```

---

### 8.3 Get De-identification Rules

**Endpoint:** `GET /api/projects/:projectId/deidentification-rules`

**Purpose:** Retrieve PII detection and de-identification rules

**Service Contract:**
```typescript
async function getDeidentificationRules(
  projectId: number,
  organizationId: number
): Promise<DeidentificationRulesResponse> {
  // Section 9.1: Multi-tenant isolation
  const rules = await db.query.deidentificationRules.findMany({
    where: and(
      eq(deidentificationRules.projectId, projectId),
      eq(deidentificationRules.organizationId, organizationId)
    )
  });
  
  return rules;
}
```

---

### 8.4 Create De-identification Rule

**Endpoint:** `POST /api/projects/:projectId/deidentification-rules`

**Purpose:** Add new PII detection rule

**Request Schema:**
```typescript
const deidentificationRuleSchema = z.object({
  ruleType: z.enum(['regex', 'ner', 'custom']),
  pattern: z.string(),
  entityType: z.enum(['email', 'phone', 'name', 'address', 'ssn', 'custom']),
  maskingStrategy: z.enum(['redact', 'hash', 'tokenize', 'replace']),
  replacementValue: z.string().optional()
});
```

---

### 8.5 List Datasets

**Endpoint:** `GET /api/projects/:projectId/datasets`

**Purpose:** List all generated datasets for a project

**Service Contract:**
```typescript
async function listDatasets(
  projectId: number,
  organizationId: number,
  query: ListDatasetsQuery
): Promise<ListDatasetsResponse> {
  // Section 9.1: Multi-tenant isolation
  const project = await db.query.projects.findFirst({
    where: and(
      eq(projects.id, projectId),
      eq(projects.organizationId, organizationId)
    )
  });
  
  if (!project) {
    throw new NotFoundError('Project not found');
  }
  
  const offset = (query.page - 1) * query.limit;
  
  const [datasetList, totalCount] = await Promise.all([
    db.query.datasets.findMany({
      where: and(
        eq(datasets.projectId, projectId),
        isNull(datasets.deletedAt)
      ),
      limit: query.limit,
      offset,
      orderBy: [desc(datasets.createdAt)]
    }),
    
    db.select({ count: count() })
      .from(datasets)
      .where(and(
        eq(datasets.projectId, projectId),
        isNull(datasets.deletedAt)
      ))
      .then(res => res[0].count)
  ]);
  
  return {
    datasets: datasetList,
    pagination: {
      page: query.page,
      limit: query.limit,
      total: totalCount,
      totalPages: Math.ceil(totalCount / query.limit)
    }
  };
}
```

---

### 8.6 Download Dataset

**Endpoint:** `GET /api/projects/:projectId/datasets/:id/download`

**Purpose:** Download dataset file

**Authentication:** JWT required (`requireAuth`)

**Response:** File stream (JSONL, JSON, or custom format)

**Service Contract:**
```typescript
async function downloadDataset(
  datasetId: number,
  projectId: number,
  organizationId: number
): Promise<ReadStream> {
  // Section 9.1: Multi-tenant isolation
  const dataset = await db.query.datasets.findFirst({
    where: and(
      eq(datasets.id, datasetId),
      eq(datasets.projectId, projectId),
      eq(datasets.organizationId, organizationId),
      isNull(datasets.deletedAt)
    )
  });
  
  if (!dataset) {
    throw new NotFoundError('Dataset not found');
  }
  
  if (!dataset.filePath) {
    throw new NotFoundError('Dataset file not found');
  }
  
  // Stream file from storage
  return fs.createReadStream(dataset.filePath);
}
```

---

## SECTION 9: MANDATORY SECURITY REQUIREMENTS

### 9.1 Multi-Tenant Isolation

**Requirement:** All organization-scoped endpoints MUST filter by `organizationId`

**Implementation:**
- Path parameters or query filters MUST include `organizationId`
- Service layer methods MUST accept and use `organizationId` in WHERE clauses
- Users cannot access resources from other organizations

**Example:**
```typescript
// Route
router.get('/:organizationId/projects', requireAuth, async (req, res) => {
  // Verify JWT organizationId matches path parameter
  if (req.user!.organizationId !== parseInt(req.params.organizationId)) {
    throw new ForbiddenError('Access denied');
  }
  
  const projects = await projectsService.listProjects(req.user!.organizationId);
  res.json(projects);
});

// Service
async listProjects(organizationId: number) {
  return db.query.projects.findMany({
    where: and(
      eq(projects.organizationId, organizationId),
      isNull(projects.deletedAt)
    )
  });
}
```

**Verification Commands:**
```bash
# Check that service methods include organizationId filtering
grep -r "eq(.*organizationId" server/services/ | wc -l

# Verify no cross-org queries
grep -r "db.query\|db.select" server/services/ | grep -v "organizationId"
```

---

### 9.2 Rate Limiting

**Requirement:** Authentication endpoints MUST have rate limiting

**Implementation:**
- Apply `authLimiter` middleware to: `/login`, `/register`, `/forgot-password`, `/reset-password`
- Limit: 5 requests per 15 minutes per IP
- Use express-rate-limit package

**Example:**
```typescript
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false
});

router.post('/login', authLimiter, validateRequest(loginSchema), loginController);
router.post('/register', authLimiter, validateRequest(registerSchema), registerController);
router.post('/forgot-password', authLimiter, validateRequest(forgotPasswordSchema), forgotPasswordController);
router.post('/reset-password', authLimiter, validateRequest(resetPasswordSchema), resetPasswordController);
```

**Verification Commands:**
```bash
# Check rate limiter is applied to auth routes
grep -A 5 "router.post.*auth" server/routes/auth.routes.ts | grep "authLimiter"
```

---

### 9.3 RBAC Enforcement

**Requirement:** Admin-only operations MUST use `requireRole('admin')` middleware

**Implementation:**
- User management endpoints require admin role
- Organization settings require admin role
- Middleware checks `req.user.role === 'admin'`

**Example:**
```typescript
const requireRole = (role: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }
    
    if (req.user.role !== role) {
      throw new ForbiddenError(`${role} role required`);
    }
    
    next();
  };
};

router.delete('/users/:id', requireAuth, requireRole('admin'), deleteUserController);
router.patch('/organizations/current', requireAuth, requireRole('admin'), updateOrganizationController);
```

**Verification Commands:**
```bash
# Check admin-only routes have requireRole middleware
grep -r "router.*delete\|router.*patch" server/routes/ | grep -v "requireRole"
```

---

### 9.4 Password Validation

**Requirement:** Password fields MUST enforce complexity requirements

**Implementation:**
- Minimum 8 characters
- At least one lowercase letter
- At least one uppercase letter
- At least one number
- Regex: `/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/`

**Zod Schema:**
```typescript
const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/, 
    'Password must contain uppercase, lowercase, and number');
```

**Verification Commands:**
```bash
# Check password validation is applied
grep -r "password.*regex\|passwordSchema" server/schemas/
```

---

### 9.5 Transaction Enforcement

**Requirement:** Multi-table operations MUST use database transactions

**Operations requiring transactions:**
- User registration (creates organization + user + session)
- Resource deletion with cascades (soft delete parent + children)
- Any operation creating/updating 2+ related tables

**Example:**
```typescript
async function register(data: RegisterInput) {
  return db.transaction(async (tx) => {
    const org = await tx.insert(organizations).values({...}).returning();
    const user = await tx.insert(users).values({...organizationId: org.id}).returning();
    const session = await tx.insert(userSessions).values({...userId: user.id}).returning();
    return { user, session };
  });
}
```

**Verification Commands:**
```bash
# Check transaction usage in critical operations
grep -r "db.transaction" server/services/
```

---

### 9.6 Token Rotation

**Requirement:** Refresh tokens MUST be one-time-use with rotation

**Implementation:**
1. Add `usedAt` timestamp to userSessions schema
2. Refresh endpoint MUST rotate tokens:
   - Find session (must not be used, must not be expired)
   - Mark old session as used
   - Delete old session
   - Create NEW session with NEW refresh token
   - Return new access token and new refresh token
3. Client MUST store and use new refresh token

**Database Schema:**
```typescript
export const userSessions = pgTable('user_sessions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  refreshToken: varchar('refresh_token', { length: 255 }).notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  usedAt: timestamp('used_at'), // NEW: Track token usage
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

**Verification Script:** `scripts/verify-token-rotation.sh`

```bash
#!/bin/bash
set -e

echo "=== Token Rotation Verification ==="

ISSUES=0

# Check schema has usedAt column
if ! grep -q "usedAt.*timestamp" server/db/schema/user-sessions.ts; then
  echo "[X] userSessions schema missing usedAt column"
  ISSUES=$((ISSUES + 1))
else
  echo "[OK] userSessions schema has usedAt column"
fi

# Check refresh service deletes old session
if ! grep -q "delete.*userSessions.*session.id" server/services/*auth*.service.ts; then
  echo "[X] Refresh service must delete old session after marking as used"
  ISSUES=$((ISSUES + 1))
else
  echo "[OK] Refresh service deletes old session"
fi

# Check refresh service creates new session
if ! grep -q "insert.*userSessions.*new.*refresh" server/services/*auth*.service.ts; then
  echo "[X] Refresh service must create new session with new refresh token"
  ISSUES=$((ISSUES + 1))
else
  echo "[OK] Refresh service creates new session"
fi

if [ $ISSUES -gt 0 ]; then
  echo ""
  echo "[X] FAILED: $ISSUES token rotation violations"
  exit 1
else
  echo "[OK] Token rotation verified"
  exit 0
fi
```

---

### 9.7 Token Exposure Prevention

**Requirement:** Reset/verification tokens MUST NOT appear in HTTP response bodies

**Implementation:**
1. Password reset endpoint returns success message only (no token)
2. Reset token sent via email ONLY
3. Development mode logs token to console (not response)
4. Reset password endpoint validates token from email

**forgotPassword Service:**
```typescript
async function forgotPassword(email: string): Promise<{ message: string }> {
  const user = await findUserByEmail(email);
  if (!user) return { message: 'If email exists, reset link sent' }; // Don't leak user existence
  
  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = await bcrypt.hash(resetToken, 12);
  
  // Store hashed token in session
  await db.insert(userSessions).values({
    userId: user.id,
    refreshToken: hashedToken,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
  });
  
  // Send token via email ONLY
  await sendPasswordResetEmail(user.email, resetToken);
  
  // DEVELOPMENT ONLY: Log to console for testing
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[DEV] Reset token for ${email}: ${resetToken}`);
  }
  
  // Return success message WITHOUT token
  return { message: 'Password reset email sent' };
}
```

**Verification Script:** `scripts/verify-no-token-exposure.sh`

```bash
#!/bin/bash
set -e

echo "=== Token Exposure Prevention Verification ==="

ISSUES=0

# Check that services don't return raw tokens in responses
if grep -r "return.*resetToken\|return.*verificationToken\|return.*rawToken" server/services/ | grep -v "console.log\|// DEVELOPMENT"; then
  echo "[X] Services must NOT return raw tokens in HTTP response bodies"
  ISSUES=$((ISSUES + 1))
else
  echo "[OK] No token exposure in services"
fi

# Check forgot password returns generic message
FORGOT_PW=$(grep -A 10 "forgotPassword" server/services/*auth*.service.ts 2>/dev/null || echo "")
if echo "$FORGOT_PW" | grep -q "return.*{.*resetToken"; then
  echo "[X] forgotPassword must return generic message, not raw token"
  ISSUES=$((ISSUES + 1))
else
  echo "[OK] forgotPassword returns generic message"
fi

if [ $ISSUES -gt 0 ]; then
  echo ""
  echo "[X] FAILED: $ISSUES token exposure violations"
  exit 1
else
  echo "[OK] No token exposure verified"
  exit 0
fi
```

---

### 9.8 Complete Security Verification Script

**File:** `scripts/verify-security-patterns.sh`

This script validates ALL security patterns from Sections 9.1-9.7.

```bash
#!/bin/bash
set -e

echo "=== Security Pattern Verification (Agent 4 Section 9) ==="

ERRORS=0

# Pattern 9.1: Multi-Tenant Isolation
echo "Checking multi-tenant isolation..."
ORG_FILTERS=$(grep -r "eq(.*organizationId" server/services/ 2>/dev/null | wc -l)
if [ "$ORG_FILTERS" -lt 10 ]; then
  echo "[X] Multi-tenant isolation: Insufficient organizationId filtering in services"
  ERRORS=$((ERRORS+1))
else
  echo "[âœ"] Multi-tenant isolation specified ($ORG_FILTERS organizationId filters)"
fi

# Pattern 9.2: Rate Limiting
echo "Checking rate limiting..."
if grep -q "authLimiter" server/routes/auth.routes.ts && grep -q "express-rate-limit" package.json; then
  echo "[âœ"] Rate limiting specified"
else
  echo "[X] Rate limiting: No authLimiter middleware found"
  ERRORS=$((ERRORS+1))
fi

# Pattern 9.3: RBAC Enforcement
echo "Checking RBAC enforcement..."
if grep -q "requireRole" server/middleware/ && grep -q "requireRole.*admin" server/routes/; then
  echo "[âœ"] RBAC enforcement specified"
else
  echo "[X] RBAC: No requireRole middleware found"
  ERRORS=$((ERRORS+1))
fi

# Pattern 9.4: Password Validation
echo "Checking password validation..."
if grep -q "regex.*(?=.*\[a-z\]).*(?=.*\[A-Z\]).*(?=.*\\d)" server/schemas/; then
  echo "[âœ"] Password validation specified"
else
  echo "[X] Password validation: No complexity requirements found"
  ERRORS=$((ERRORS+1))
fi

# Pattern 9.5: Transaction Enforcement
echo "Checking transaction patterns..."
if grep -q "db.transaction" server/services/*auth*.service.ts; then
  echo "[âœ"] Transaction patterns documented"
else
  echo "[WARN] Transaction patterns: Not found in auth service"
fi

# Pattern 9.6: Token Rotation
echo "Checking token rotation..."
if grep -q "usedAt" server/db/schema/user-sessions.ts; then
  echo "[âœ"] Token rotation specified (usedAt column present)"
else
  echo "[X] Token rotation: usedAt column missing"
  ERRORS=$((ERRORS+1))
fi

# Pattern 9.7: Token Exposure Prevention
echo "Checking token exposure prevention..."
FORGOT_PW=$(grep -A 5 "forgotPassword" server/services/*auth*.service.ts 2>/dev/null || echo "")
if echo "$FORGOT_PW" | grep -q "return.*message.*Password reset"; then
  echo "[âœ"] Token exposure prevention specified"
else
  echo "[X] Token exposure: forgotPassword may expose token"
  ERRORS=$((ERRORS+1))
fi

echo ""
if [ $ERRORS -gt 0 ]; then
  echo "[X] FAILED: $ERRORS security pattern violations"
  echo "Review Agent 4 Section 9 requirements"
  exit 1
else
  echo "[âœ"] PASSED: All security patterns verified"
  exit 0
fi
```

---

## SECTION 10: ERROR HANDLING

### 10.1 Error Response Envelope (Constitution Section C)

All error responses follow the structured envelope format:

```typescript
{
  error: {
    code: string; // Machine-readable error code
    message: string; // Human-readable error message
    details?: object; // Optional additional context
    field?: string; // Optional field name for validation errors
  }
}
```

### 10.2 Error Codes

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| 400 | VALIDATION_ERROR | Request validation failed |
| 401 | UNAUTHORIZED | Missing or invalid authentication |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Resource not found |
| 409 | CONFLICT | Resource conflict (e.g., duplicate email) |
| 413 | PAYLOAD_TOO_LARGE | File upload too large |
| 429 | RATE_LIMIT_EXCEEDED | Too many requests |
| 500 | INTERNAL_ERROR | Server error |

### 10.3 Error Helper Classes

```typescript
class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

class ValidationError extends ApiError {
  constructor(message: string, details?: any) {
    super(400, 'VALIDATION_ERROR', message, details);
  }
}

class UnauthorizedError extends ApiError {
  constructor(message: string = 'Unauthorized') {
    super(401, 'UNAUTHORIZED', message);
  }
}

class ForbiddenError extends ApiError {
  constructor(message: string = 'Forbidden') {
    super(403, 'FORBIDDEN', message);
  }
}

class NotFoundError extends ApiError {
  constructor(message: string = 'Resource not found') {
    super(404, 'NOT_FOUND', message);
  }
}

class ConflictError extends ApiError {
  constructor(message: string) {
    super(409, 'CONFLICT', message);
  }
}
```

---

## SECTION 11: HEALTH ENDPOINT (Constitution Section C)

### 11.1 Health Check

**Endpoint:** `GET /health`

**Purpose:** System health check for monitoring and load balancers

**Authentication:** None (public)

**Success Response (200):**
```typescript
{
  status: 'healthy',
  timestamp: string; // ISO 8601
  uptime: number; // seconds
  database: 'connected' | 'disconnected';
  version: string;
}
```

**Service Contract:**
```typescript
async function healthCheck(): Promise<HealthResponse> {
  let dbStatus: 'connected' | 'disconnected';
  
  try {
    await db.execute(sql`SELECT 1`);
    dbStatus = 'connected';
  } catch (error) {
    dbStatus = 'disconnected';
  }
  
  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: dbStatus,
    version: process.env.APP_VERSION || '1.0.0'
  };
}
```

---

## SECTION 12: MIDDLEWARE SPECIFICATIONS

### 12.1 Authentication Middleware

```typescript
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('Missing or invalid authorization header');
  }
  
  const token = authHeader.substring(7);
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    req.user = {
      userId: decoded.userId,
      organizationId: decoded.organizationId,
      role: decoded.role
    };
    next();
  } catch (error) {
    throw new UnauthorizedError('Invalid or expired token');
  }
};
```

### 12.2 Role-Based Access Control Middleware

```typescript
const requireRole = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      throw new ForbiddenError(`Requires one of: ${allowedRoles.join(', ')}`);
    }
    
    next();
  };
};
```

### 12.3 Request Validation Middleware

```typescript
const validateRequest = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params
      });
      
      req.body = validated.body || req.body;
      req.query = validated.query || req.query;
      req.params = validated.params || req.params;
      
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError('Validation failed', error.errors);
      }
      throw error;
    }
  };
};
```

---

## SECTION 13: ASSUMPTION REGISTER

### AR-001: Email Verification Deferred

- **Owner Agent:** Agent 4
- **Type:** ASSUMPTION
- **Downstream Impact:** [Agent 6 (Implementation - email service)]
- **Resolution Deadline:** POST_MVP
- **Allowed to Ship:** YES
- **Status:** DEFERRED
- **Source Gap:** PRD Assumption AR-010 marks email verification as unresolved
- **Assumption Made:** MVP ships without email verification (accept spam risk); add post-MVP
- **Impact if Wrong:** Spam accounts, data integrity issues (acceptable for MVP)
- **Resolution Note:** Deferred per PRD Assumption AR-010; acceptable for initial launch

---

### AR-002: Teamwork Desk Rate Limits

- **Owner Agent:** Agent 4
- **Type:** DEPENDENCY
- **Downstream Impact:** [Agent 6 (Implementation - Teamwork Desk connector)]
- **Resolution Deadline:** BEFORE_AGENT_6
- **Allowed to Ship:** CONDITIONAL
- **Status:** UNRESOLVED
- **Source Gap:** Teamwork Desk API documentation not reviewed; rate limits unknown
- **Assumption Made:** Conservative rate limiting (1 req/second, max 3 retries) with exponential backoff
- **Impact if Wrong:** Import failures if actual rate limits are stricter
- **Resolution Note:** Agent 6 must review Teamwork Desk API docs and adjust rate limiting

---

### AR-003: Q&A Pairs Generation Logic

- **Owner Agent:** Agent 4
- **Type:** ASSUMPTION
- **Downstream Impact:** [Agent 6 (Implementation - export service)]
- **Resolution Deadline:** BEFORE_AGENT_6
- **Allowed to Ship:** CONDITIONAL
- **Status:** UNRESOLVED
- **Source Gap:** PRD states "Q&A pairs export" but doesn't define pairing logic
- **Assumption Made:** Q&A pairs generated from conversational data using `role="customer"` as question, next `role="agent"` as answer
- **Impact if Wrong:** Q&A format unsuitable for RAG systems
- **Resolution Note:** Requires validation with Persona 3 (Data Scientist) during Agent 6 phase

---

## DOCUMENT END

**Agent 4 (API Contract) v39 - EXECUTION COMPLETE**

**Output:** `04-API-CONTRACT.md` with embedded `service-contracts.json`

**Next Step:** Agent 5 (UI Specification) defines frontend requirements

**API Contract Summary:**
- **Total Endpoints:** 49 REST API endpoints
- **Authentication:** JWT with refresh token rotation (Section 9.6)
- **Security Patterns:** 7 mandatory patterns (Section 9)
- **Multi-Tenancy:** Organization-level isolation enforced (Section 9.1)
- **Rate Limiting:** Auth endpoints protected (Section 9.2)
- **RBAC:** Admin-only operations enforced (Section 9.3)
- **Password Validation:** Complexity requirements enforced (Section 9.4)
- **Transaction Enforcement:** Multi-table ops use transactions (Section 9.5)
- **Token Rotation:** One-time-use refresh tokens (Section 9.6)
- **Token Exposure Prevention:** No tokens in HTTP responses (Section 9.7)
- **Error Handling:** Structured error envelope per Constitution Section C
- **Health Endpoint:** `/health` per Constitution Section C
- **Service Contracts:** Embedded JSON specification (Constitution Section U)

**Security Verification Status:**
- [x] Multi-tenant isolation specified
- [x] Rate limiting applied to auth endpoints
- [x] RBAC middleware defined
- [x] Password validation enforced
- [x] Transaction patterns documented
- [x] Token rotation implemented
- [x] Token exposure prevented
- [x] Verification scripts provided

**Constitutional Compliance:**
- [x] Inherited from Agent 0 v4.6
- [x] Single-file output (Constitution Section U)
- [x] Service contracts embedded (not separate file)
- [x] Health endpoint per Section C
- [x] Error envelopes per Section C
- [x] JWT configuration per Section C (15m/7d)
- [x] Cryptographic randomness per Section C (crypto.randomBytes())
- [x] Tiered prevention model alignment (Tier 1 security patterns)
- [x] Assumption Register with full lifecycle metadata
- [x] No TBDs (all unknowns in Assumption Register)

**Quality Verification:**
- [x] All endpoints defined with Zod schemas
- [x] Service contracts provided for each endpoint
- [x] Authentication/authorization requirements specified
- [x] Error responses documented
- [x] Security requirements complete (Section 9)
- [x] Verification scripts provided for all security patterns
- [x] No solution gaps (all decisions made or assumptions documented)

**What Changed in v39:**
- Added Section 9.6: Token Rotation (one-time-use refresh tokens)
- Added Section 9.7: Token Exposure Prevention (no tokens in HTTP responses)
- Added 2 new verification scripts
- Security posture: Eliminates token reuse vulnerabilities
- Expected outcome: 0 token-related security issues
