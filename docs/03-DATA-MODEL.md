# Data Model Specification: Foundry
## Version 1.0

**Document ID:** 03-DATA-MODEL  
**Created:** 2026-02-01  
**Agent:** Agent 3 (Data Modeling v23)  
**Framework:** Agent Specification Framework v2.1  
**Constitution:** Inherited from Agent 0 v4.6  
**Status:** ACTIVE  
**Deployment Target:** Replit (PostgreSQL via Neon)

---

## INHERITED CONSTITUTION

This data model inherits **Agent 0: Agent Constitution v4.6**. Global rules are not restated here.

Reference Constitution for:
- Database driver selection (Section D: `pg` package)
- Cryptographic randomness for tokens (Section C)
- Error handling patterns (Section C)
- Health endpoint requirements (Section C)

Changes to global conventions require `AR-### CHANGE_REQUEST` in Assumption Register.

---

## EXECUTIVE SUMMARY

### Data Model Overview

This document specifies the complete database schema for Foundry, a multi-tenant SaaS platform for AI-ready dataset preparation. The data model supports:

- **Multi-Tenancy:** Organization-level data isolation via query filters (ADR-004)
- **Authentication:** User management with role-based access control
- **Data Processing:** File uploads, API connectors, batch processing jobs
- **Privacy Compliance:** PII detection/de-identification rule storage
- **Export Management:** Dataset versioning and export history

### Technology Stack

- **Database:** PostgreSQL 14+ via Neon managed service (Replit)
- **ORM:** Drizzle ORM with `pg` driver (ADR-002)
- **Migration Tool:** Drizzle Kit for schema migrations
- **Connection:** Connection pooling via `pg.Pool`

### Architecture References

| ADR | Decision | Impact on Data Model |
|-----|----------|---------------------|
| ADR-002 | Drizzle ORM | Schema definition using `drizzle-orm/pg-core` |
| ADR-003 | JWT Authentication | User sessions stored in database (refresh tokens) |
| ADR-004 | Query-Level Multi-Tenancy | All tenant data includes `organizationId` foreign key |
| ADR-008 | Cryptographic Randomness | Invitation tokens use `crypto.randomBytes(32)` |
| ADR-009 | PII De-identification | De-identification rules and detected PII stored |

---

## DATABASE TABLE SUMMARY

### Table Inventory

**Total Tables to Create:** 10 tables (Phase 1: 9 required, Phase 2: 1 deferred)

| Table Name | Column Count | Foreign Keys | Indexes | Soft Delete | Phase | Purpose |
|------------|-------------|--------------|---------|-------------|-------|---------|
| `organizations` | 6 | 0 | 1 (name) | Yes | 1 | Multi-tenant org container |
| `users` | 9 | 1 (organizationId) | 2 (email, organizationId) | No | 1 | User authentication & roles |
| `user_sessions` | 6 | 1 (userId) | 2 (refreshToken, userId) | No | 1 | JWT refresh token storage |
| `projects` | 8 | 2 (organizationId, ownerId) | 2 (organizationId, ownerId) | Yes | 1 | Data preparation projects |
| `data_sources` | 11 | 2 (organizationId, projectId) | 2 (projectId, type) | Yes | 1 | File uploads & API connectors |
| `processing_jobs` | 10 | 2 (organizationId, dataSourceId) | 3 (dataSourceId, status, organizationId) | No | 1 | Async batch processing jobs |
| `schema_mappings` | 9 | 2 (organizationId, projectId) | 1 (projectId) | No | 1 | Field mapping configurations |
| `deidentification_rules` | 10 | 2 (organizationId, projectId) | 1 (projectId) | No | 1 | PII detection & masking rules |
| `datasets` | 10 | 3 (organizationId, projectId, processingJobId) | 2 (projectId, processingJobId) | Yes | 1 | Processed output datasets |
| `invitations` | 9 | 1 (organizationId) | 2 (email, token) | No | 2 | Team member invitations (DEFERRED) |

**Phase 1 Total:** 9 tables, 14 foreign keys, 18 indexes  
**Phase 2 Total:** 1 table (invitations - deferred to post-MVP)

### Schema Verification Commands

After schema creation, run these commands to verify completeness:

```bash
# Verify table count (should be 9 for Phase 1)
ls server/db/schema/*.ts | wc -l

# Verify all tables exist in database
psql $DATABASE_URL -c "\dt" | grep -E "(organizations|users|user_sessions|projects|data_sources|processing_jobs|schema_mappings|deidentification_rules|datasets)" | wc -l

# Verify foreign key count (should be 14)
psql $DATABASE_URL -c "SELECT COUNT(*) FROM information_schema.table_constraints WHERE constraint_type='FOREIGN KEY' AND table_schema='public';"

# Verify index count (should be 18 + primary keys)
psql $DATABASE_URL -c "SELECT COUNT(*) FROM pg_indexes WHERE schemaname='public' AND indexname NOT LIKE '%_pkey';"

# Verify soft delete columns exist
psql $DATABASE_URL -c "SELECT table_name FROM information_schema.columns WHERE column_name='deleted_at' ORDER BY table_name;" | grep -E "(organizations|projects|data_sources|datasets)" | wc -l
```

**Expected Results:**
- Table count: 9
- Foreign keys: 14
- Indexes (excluding PKs): 18
- Soft delete tables: 4 (organizations, projects, data_sources, datasets)

---

## PHASE 1: CONCEPTUAL MODEL

### Entity Relationship Diagram (Mermaid)

```mermaid
erDiagram
    ORGANIZATIONS ||--o{ USERS : contains
    ORGANIZATIONS ||--o{ PROJECTS : owns
    ORGANIZATIONS ||--o{ DATA_SOURCES : owns
    ORGANIZATIONS ||--o{ PROCESSING_JOBS : owns
    ORGANIZATIONS ||--o{ SCHEMA_MAPPINGS : owns
    ORGANIZATIONS ||--o{ DEIDENTIFICATION_RULES : owns
    ORGANIZATIONS ||--o{ DATASETS : owns
    
    USERS ||--o{ USER_SESSIONS : has
    USERS ||--o{ PROJECTS : creates
    
    PROJECTS ||--o{ DATA_SOURCES : contains
    PROJECTS ||--o{ SCHEMA_MAPPINGS : configures
    PROJECTS ||--o{ DEIDENTIFICATION_RULES : defines
    PROJECTS ||--o{ DATASETS : produces
    
    DATA_SOURCES ||--o{ PROCESSING_JOBS : triggers
    
    PROCESSING_JOBS ||--o{ DATASETS : generates
    
    ORGANIZATIONS {
        serial id PK
        text name
        text subscription_tier
        timestamp deleted_at
        timestamp created_at
        timestamp updated_at
    }
    
    USERS {
        serial id PK
        integer organization_id FK
        text email
        text password_hash
        text name
        text role
        boolean email_verified
        timestamp created_at
        timestamp updated_at
    }
    
    USER_SESSIONS {
        serial id PK
        integer user_id FK
        text refresh_token
        timestamp expires_at
        timestamp created_at
        timestamp updated_at
    }
    
    PROJECTS {
        serial id PK
        integer organization_id FK
        integer owner_id FK
        text name
        text description
        text target_schema
        timestamp deleted_at
        timestamp created_at
        timestamp updated_at
    }
    
    DATA_SOURCES {
        serial id PK
        integer organization_id FK
        integer project_id FK
        text name
        text type
        text file_path
        jsonb connection_config
        text status
        integer record_count
        timestamp deleted_at
        timestamp created_at
        timestamp updated_at
    }
    
    PROCESSING_JOBS {
        serial id PK
        integer organization_id FK
        integer data_source_id FK
        text type
        text status
        jsonb config
        integer processed_records
        integer failed_records
        text error_message
        timestamp created_at
        timestamp updated_at
    }
    
    SCHEMA_MAPPINGS {
        serial id PK
        integer organization_id FK
        integer project_id FK
        text source_schema
        text target_schema
        jsonb field_mappings
        jsonb transformation_rules
        timestamp created_at
        timestamp updated_at
    }
    
    DEIDENTIFICATION_RULES {
        serial id PK
        integer organization_id FK
        integer project_id FK
        text rule_name
        text pii_type
        text detection_method
        text masking_strategy
        jsonb rule_config
        timestamp created_at
        timestamp updated_at
    }
    
    DATASETS {
        serial id PK
        integer organization_id FK
        integer project_id FK
        integer processing_job_id FK
        text name
        text format
        text file_path
        integer record_count
        jsonb metadata
        timestamp deleted_at
        timestamp created_at
        timestamp updated_at
    }
```

### Domain Entities

#### Core Entities

**Organizations** (Multi-Tenant Container)
- Purpose: Top-level tenant isolation boundary
- Lifecycle: Created during signup, soft-deleted on account cancellation
- Relationships: Owns all user data (users, projects, data sources, datasets)

**Users** (Authentication & Authorization)
- Purpose: Individual user accounts with role-based permissions
- Lifecycle: Created during signup/invitation, never deleted (audit trail)
- Relationships: Belongs to one organization, creates projects, has sessions

**User Sessions** (JWT Refresh Token Storage)
- Purpose: Persistent refresh token storage for JWT authentication (ADR-003)
- Lifecycle: Created on login, deleted on logout/expiry
- Relationships: Belongs to one user

**Projects** (Data Preparation Workspace)
- Purpose: Container for data transformation workflows
- Lifecycle: Created by users, soft-deleted to preserve audit trail
- Relationships: Belongs to organization, owned by user, contains data sources and datasets

#### Data Processing Entities

**Data Sources** (Input Data Connections)
- Purpose: File uploads or API connectors (Teamwork Desk)
- Lifecycle: Created when file uploaded or API connected, soft-deleted when removed
- Relationships: Belongs to project, triggers processing jobs

**Processing Jobs** (Async Batch Processing)
- Purpose: Background tasks for data transformation, PII detection, export generation
- Lifecycle: Created when processing initiated, retained for audit (no delete)
- Relationships: Belongs to organization, processes data source, produces datasets

**Schema Mappings** (Field Transformation Config)
- Purpose: Configuration for mapping source fields to target schema
- Lifecycle: Created/updated during project configuration, deleted with project
- Relationships: Belongs to project, used by processing jobs

**De-identification Rules** (PII Masking Config)
- Purpose: Rules for detecting and masking PII (emails, names, phone numbers)
- Lifecycle: Created during project configuration, deleted with project
- Relationships: Belongs to project, used by processing jobs

**Datasets** (Processed Output)
- Purpose: Final AI-ready datasets after transformation and de-identification
- Lifecycle: Created by processing jobs, soft-deleted when user removes
- Relationships: Belongs to project, generated by processing job

---

## PHASE 2: NORMALIZATION ANALYSIS

### Normal Forms Compliance

**Third Normal Form (3NF) Target**

All tables designed to 3NF standards:
- **1NF:** All columns contain atomic values (no repeating groups)
- **2NF:** No partial dependencies (all non-key attributes depend on entire primary key)
- **3NF:** No transitive dependencies (non-key attributes independent of each other)

### Denormalization Decisions

**No Denormalization Required for MVP**

Given expected data volumes (<100K records per table, <20 concurrent users), no denormalization needed. All queries can be satisfied with indexed foreign key joins.

**Phase 2 Optimization Opportunities** (Post-MVP):
- Add `record_count` to `projects` (aggregate from data_sources)
- Add `last_processed_at` to `data_sources` (cache from processing_jobs)
- Add `dataset_count` to `projects` (aggregate from datasets)

**Justification for Not Denormalizing Now:**
- Premature optimization adds complexity
- Data volumes don't justify caching overhead
- Query performance acceptable with proper indexing

---

## PHASE 3: DRIZZLE ORM SCHEMA DEFINITION

### Schema File Organization

```
server/
└── db/
    ├── index.ts           # Database connection and exports
    ├── migrate.ts         # Migration runner script
    └── schema/
        ├── organizations.ts
        ├── users.ts
        ├── userSessions.ts
        ├── projects.ts
        ├── dataSources.ts
        ├── processingJobs.ts
        ├── schemaMappings.ts
        ├── deidentificationRules.ts
        └── datasets.ts
```

### Shared Conventions

```typescript
// server/db/schema/_conventions.ts
import { timestamp } from 'drizzle-orm/pg-core';

/**
 * Standard audit columns for all tables
 * Per Constitution: createdAt and updatedAt required
 */
export const auditColumns = {
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
};

/**
 * Soft delete column for entities requiring audit trail
 * null = active, timestamp = deleted
 */
export const softDeleteColumn = {
  deletedAt: timestamp('deleted_at'),
};
```

### Table Schemas

#### 1. Organizations Table

```typescript
// server/db/schema/organizations.ts
import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { auditColumns, softDeleteColumn } from './_conventions';

/**
 * Organizations table - Multi-tenant isolation boundary
 * Reference: ADR-004 (Query-level multi-tenancy)
 * Soft delete: YES (preserve audit trail on account cancellation)
 */
export const organizations = pgTable('organizations', {
  id: serial('id').primaryKey(),
  
  // Organization details
  name: text('name').notNull(),
  subscriptionTier: text('subscription_tier').notNull().default('free'), // 'free' | 'pro' | 'enterprise'
  
  // Lifecycle columns
  ...softDeleteColumn, // deletedAt for soft delete
  ...auditColumns,     // createdAt, updatedAt
});

// Type exports
export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;
```

#### 2. Users Table

```typescript
// server/db/schema/users.ts
import { pgTable, serial, text, integer, boolean, timestamp, index } from 'drizzle-orm/pg-core';
import { organizations } from './organizations';
import { auditColumns } from './_conventions';

/**
 * Users table - Authentication and authorization
 * Reference: ADR-003 (JWT authentication)
 * Soft delete: NO (preserve audit trail, never delete user records)
 */
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  
  // Organization relationship (multi-tenant)
  organizationId: integer('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  
  // Authentication
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(), // bcrypt hash
  
  // Profile
  name: text('name'),
  
  // Authorization
  role: text('role').notNull().default('member'), // 'admin' | 'member' | 'viewer'
  
  // Email verification (AR-010)
  emailVerified: boolean('email_verified').notNull().default(false),
  
  // Lifecycle
  ...auditColumns,
}, (table) => ({
  // Index for authentication queries
  emailIdx: index('users_email_idx').on(table.email),
  // Index for organization filtering (multi-tenant queries)
  organizationIdx: index('users_organization_idx').on(table.organizationId),
}));

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type UserRole = 'admin' | 'member' | 'viewer';
```

#### 3. User Sessions Table

```typescript
// server/db/schema/userSessions.ts
import { pgTable, serial, integer, text, timestamp, index } from 'drizzle-orm/pg-core';
import { users } from './users';
import { auditColumns } from './_conventions';

/**
 * User Sessions table - JWT refresh token storage
 * Reference: ADR-003 (JWT with 15m access, 7d refresh tokens)
 * Soft delete: NO (hard delete on logout/expiry)
 */
export const userSessions = pgTable('user_sessions', {
  id: serial('id').primaryKey(),
  
  // User relationship
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  
  // Refresh token (cryptographically random per ADR-008)
  refreshToken: text('refresh_token').notNull().unique(),
  
  // Expiration (7 days per ADR-003)
  expiresAt: timestamp('expires_at').notNull(),
  
  // Lifecycle
  ...auditColumns,
}, (table) => ({
  // Index for token lookup during refresh
  refreshTokenIdx: index('sessions_refresh_token_idx').on(table.refreshToken),
  // Index for user session cleanup
  userIdx: index('sessions_user_idx').on(table.userId),
}));

// Type exports
export type UserSession = typeof userSessions.$inferSelect;
export type NewUserSession = typeof userSessions.$inferInsert;
```

#### 4. Projects Table

```typescript
// server/db/schema/projects.ts
import { pgTable, serial, integer, text, timestamp, index } from 'drizzle-orm/pg-core';
import { organizations } from './organizations';
import { users } from './users';
import { auditColumns, softDeleteColumn } from './_conventions';

/**
 * Projects table - Data preparation workspace
 * Reference: PRD Section 4.2 (Core Workflow)
 * Soft delete: YES (preserve audit trail, allow restore)
 */
export const projects = pgTable('projects', {
  id: serial('id').primaryKey(),
  
  // Multi-tenant relationships
  organizationId: integer('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  
  // Ownership (created by user)
  ownerId: integer('owner_id')
    .notNull()
    .references(() => users.id, { onDelete: 'restrict' }), // Prevent deleting user if they own projects
  
  // Project details
  name: text('name').notNull(),
  description: text('description'),
  
  // Target schema type for this project
  targetSchema: text('target_schema').notNull().default('conversational'), // 'conversational' | 'structured' | 'custom'
  
  // Lifecycle
  ...softDeleteColumn, // Soft delete to preserve audit trail
  ...auditColumns,
}, (table) => ({
  // Index for organization filtering (multi-tenant queries)
  organizationIdx: index('projects_organization_idx').on(table.organizationId),
  // Index for user's projects
  ownerIdx: index('projects_owner_idx').on(table.ownerId),
}));

// Type exports
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type TargetSchemaType = 'conversational' | 'structured' | 'custom';
```

#### 5. Data Sources Table

```typescript
// server/db/schema/dataSources.ts
import { pgTable, serial, integer, text, jsonb, timestamp, index } from 'drizzle-orm/pg-core';
import { organizations } from './organizations';
import { projects } from './projects';
import { auditColumns, softDeleteColumn } from './_conventions';

/**
 * Data Sources table - File uploads and API connectors
 * Reference: PRD Section 4.3 (Data Import)
 * Soft delete: YES (preserve import history)
 */
export const dataSources = pgTable('data_sources', {
  id: serial('id').primaryKey(),
  
  // Multi-tenant relationships
  organizationId: integer('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  
  projectId: integer('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  
  // Source details
  name: text('name').notNull(),
  type: text('type').notNull(), // 'file_upload' | 'teamwork_desk_api'
  
  // File upload specific (null for API sources)
  filePath: text('file_path'), // Relative path in Replit storage
  
  // API connector specific (null for file uploads)
  connectionConfig: jsonb('connection_config'), // { apiKey, domain, filters } for Teamwork Desk
  
  // Processing status
  status: text('status').notNull().default('pending'), // 'pending' | 'processing' | 'completed' | 'failed'
  
  // Metadata
  recordCount: integer('record_count'), // Total records imported
  
  // Lifecycle
  ...softDeleteColumn,
  ...auditColumns,
}, (table) => ({
  // Index for project's data sources
  projectIdx: index('data_sources_project_idx').on(table.projectId),
  // Index for filtering by type
  typeIdx: index('data_sources_type_idx').on(table.type),
}));

// Type exports
export type DataSource = typeof dataSources.$inferSelect;
export type NewDataSource = typeof dataSources.$inferInsert;
export type DataSourceType = 'file_upload' | 'teamwork_desk_api';
export type DataSourceStatus = 'pending' | 'processing' | 'completed' | 'failed';
```

#### 6. Processing Jobs Table

```typescript
// server/db/schema/processingJobs.ts
import { pgTable, serial, integer, text, jsonb, timestamp, index } from 'drizzle-orm/pg-core';
import { organizations } from './organizations';
import { dataSources } from './dataSources';
import { auditColumns } from './_conventions';

/**
 * Processing Jobs table - Async batch processing tasks
 * Reference: PRD Section 4.4 (Data Transformation Pipeline)
 * Soft delete: NO (retain for audit trail, processing history)
 */
export const processingJobs = pgTable('processing_jobs', {
  id: serial('id').primaryKey(),
  
  // Multi-tenant relationships
  organizationId: integer('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  
  dataSourceId: integer('data_source_id')
    .notNull()
    .references(() => dataSources.id, { onDelete: 'cascade' }),
  
  // Job details
  type: text('type').notNull(), // 'import' | 'pii_detection' | 'transformation' | 'export'
  status: text('status').notNull().default('pending'), // 'pending' | 'running' | 'completed' | 'failed'
  
  // Job configuration
  config: jsonb('config'), // Job-specific parameters
  
  // Processing metrics
  processedRecords: integer('processed_records').notNull().default(0),
  failedRecords: integer('failed_records').notNull().default(0),
  
  // Error tracking
  errorMessage: text('error_message'),
  
  // Lifecycle
  ...auditColumns,
}, (table) => ({
  // Index for data source's processing jobs
  dataSourceIdx: index('processing_jobs_data_source_idx').on(table.dataSourceId),
  // Index for filtering by status
  statusIdx: index('processing_jobs_status_idx').on(table.status),
  // Index for organization job history
  organizationIdx: index('processing_jobs_organization_idx').on(table.organizationId),
}));

// Type exports
export type ProcessingJob = typeof processingJobs.$inferSelect;
export type NewProcessingJob = typeof processingJobs.$inferInsert;
export type ProcessingJobType = 'import' | 'pii_detection' | 'transformation' | 'export';
export type ProcessingJobStatus = 'pending' | 'running' | 'completed' | 'failed';
```

#### 7. Schema Mappings Table

```typescript
// server/db/schema/schemaMappings.ts
import { pgTable, serial, integer, text, jsonb, timestamp, index } from 'drizzle-orm/pg-core';
import { organizations } from './organizations';
import { projects } from './projects';
import { auditColumns } from './_conventions';

/**
 * Schema Mappings table - Field transformation configuration
 * Reference: PRD Section 4.5 (Schema Configuration)
 * Soft delete: NO (deleted when project deleted via cascade)
 */
export const schemaMappings = pgTable('schema_mappings', {
  id: serial('id').primaryKey(),
  
  // Multi-tenant relationships
  organizationId: integer('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  
  projectId: integer('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  
  // Schema details
  sourceSchema: text('source_schema').notNull(), // Original field structure (e.g., 'zendesk_ticket')
  targetSchema: text('target_schema').notNull(), // Target schema type (e.g., 'conversational')
  
  // Field mapping configuration
  fieldMappings: jsonb('field_mappings').notNull(), // { sourceField: targetField } mappings
  
  // Transformation rules
  transformationRules: jsonb('transformation_rules'), // Custom transformation logic
  
  // Lifecycle
  ...auditColumns,
}, (table) => ({
  // Index for project's schema mappings
  projectIdx: index('schema_mappings_project_idx').on(table.projectId),
}));

// Type exports
export type SchemaMapping = typeof schemaMappings.$inferSelect;
export type NewSchemaMapping = typeof schemaMappings.$inferInsert;
```

#### 8. De-identification Rules Table

```typescript
// server/db/schema/deidentificationRules.ts
import { pgTable, serial, integer, text, jsonb, timestamp, index } from 'drizzle-orm/pg-core';
import { organizations } from './organizations';
import { projects } from './projects';
import { auditColumns } from './_conventions';

/**
 * De-identification Rules table - PII detection and masking configuration
 * Reference: ADR-009 (PII De-identification Strategy)
 * Soft delete: NO (deleted when project deleted via cascade)
 */
export const deidentificationRules = pgTable('deidentification_rules', {
  id: serial('id').primaryKey(),
  
  // Multi-tenant relationships
  organizationId: integer('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  
  projectId: integer('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  
  // Rule details
  ruleName: text('rule_name').notNull(),
  piiType: text('pii_type').notNull(), // 'email' | 'phone' | 'name' | 'ssn' | 'address' | 'credit_card'
  
  // Detection configuration
  detectionMethod: text('detection_method').notNull(), // 'regex' | 'nlp' | 'dictionary'
  
  // Masking strategy
  maskingStrategy: text('masking_strategy').notNull(), // 'redact' | 'hash' | 'tokenize' | 'generalize'
  
  // Rule-specific configuration
  ruleConfig: jsonb('rule_config'), // Regex patterns, NLP model config, etc.
  
  // Lifecycle
  ...auditColumns,
}, (table) => ({
  // Index for project's de-identification rules
  projectIdx: index('deidentification_rules_project_idx').on(table.projectId),
}));

// Type exports
export type DeidentificationRule = typeof deidentificationRules.$inferSelect;
export type NewDeidentificationRule = typeof deidentificationRules.$inferInsert;
export type PIIType = 'email' | 'phone' | 'name' | 'ssn' | 'address' | 'credit_card';
export type DetectionMethod = 'regex' | 'nlp' | 'dictionary';
export type MaskingStrategy = 'redact' | 'hash' | 'tokenize' | 'generalize';
```

#### 9. Datasets Table

```typescript
// server/db/schema/datasets.ts
import { pgTable, serial, integer, text, jsonb, timestamp, index } from 'drizzle-orm/pg-core';
import { organizations } from './organizations';
import { projects } from './projects';
import { processingJobs } from './processingJobs';
import { auditColumns, softDeleteColumn } from './_conventions';

/**
 * Datasets table - Processed AI-ready output
 * Reference: PRD Section 4.6 (Export & Download)
 * Soft delete: YES (allow restore, preserve export history)
 */
export const datasets = pgTable('datasets', {
  id: serial('id').primaryKey(),
  
  // Multi-tenant relationships
  organizationId: integer('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  
  projectId: integer('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  
  processingJobId: integer('processing_job_id')
    .notNull()
    .references(() => processingJobs.id, { onDelete: 'restrict' }), // Prevent deleting job if dataset exists
  
  // Dataset details
  name: text('name').notNull(),
  format: text('format').notNull(), // 'jsonl' | 'json' | 'csv' | 'qa_pairs'
  
  // File storage
  filePath: text('file_path').notNull(), // Relative path in Replit storage
  
  // Metadata
  recordCount: integer('record_count').notNull(),
  metadata: jsonb('metadata'), // Export config, quality metrics, etc.
  
  // Lifecycle
  ...softDeleteColumn,
  ...auditColumns,
}, (table) => ({
  // Index for project's datasets
  projectIdx: index('datasets_project_idx').on(table.projectId),
  // Index for processing job's datasets
  processingJobIdx: index('datasets_processing_job_idx').on(table.processingJobId),
}));

// Type exports
export type Dataset = typeof datasets.$inferSelect;
export type NewDataset = typeof datasets.$inferInsert;
export type DatasetFormat = 'jsonl' | 'json' | 'csv' | 'qa_pairs';
```

### Database Connection

```typescript
// server/db/index.ts
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';

// Import all schemas
import { organizations } from './schema/organizations';
import { users } from './schema/users';
import { userSessions } from './schema/userSessions';
import { projects } from './schema/projects';
import { dataSources } from './schema/dataSources';
import { processingJobs } from './schema/processingJobs';
import { schemaMappings } from './schema/schemaMappings';
import { deidentificationRules } from './schema/deidentificationRules';
import { datasets } from './schema/datasets';

/**
 * Database connection using pg driver (ADR-002)
 * Connection pooling configured per Constitution Section D
 */
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Connection pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Initialize Drizzle ORM
export const db = drizzle(pool);

// Export all schemas
export {
  organizations,
  users,
  userSessions,
  projects,
  dataSources,
  processingJobs,
  schemaMappings,
  deidentificationRules,
  datasets,
};

// Export connection pool for graceful shutdown
export { pool };
```

---

## PHASE 4: SEED DATA REQUIREMENTS

### Admin User Seeding

**[CRITICAL]** Per Agent 3 v22 specification, applications with authentication MUST include admin user seed data to prevent unusable deployments.

### Seed Data Script

```typescript
// scripts/seed-admin.ts
import { db } from '../server/db';
import { organizations, users } from '../server/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';

/**
 * Seed script for admin user creation
 * Reference: Agent 3 v22 (Seed Data Requirements)
 * 
 * Usage: npm run seed:admin
 */
async function seedAdminUser() {
  console.log('🌱 Starting admin user seed...');
  
  // Check if admin user already exists (idempotent)
  const existingAdmin = await db
    .select()
    .from(users)
    .where(eq(users.email, 'admin@foundry.local'))
    .limit(1);
  
  if (existingAdmin.length > 0) {
    console.log('✅ Admin user already exists. Skipping seed.');
    return;
  }
  
  // Create default organization
  const [organization] = await db
    .insert(organizations)
    .values({
      name: 'Default Organization',
      subscriptionTier: 'enterprise',
    })
    .returning();
  
  console.log(`✅ Created organization: ${organization.name} (ID: ${organization.id})`);
  
  // Generate secure password hash
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'; // Default for development
  const passwordHash = await bcrypt.hash(adminPassword, 10);
  
  // Create admin user
  const [adminUser] = await db
    .insert(users)
    .values({
      organizationId: organization.id,
      email: 'admin@foundry.local',
      passwordHash,
      name: 'Admin User',
      role: 'admin',
      emailVerified: true,
    })
    .returning();
  
  console.log(`✅ Created admin user: ${adminUser.email} (ID: ${adminUser.id})`);
  console.log('');
  console.log('📋 Admin Credentials:');
  console.log('   Email: admin@foundry.local');
  console.log(`   Password: ${adminPassword}`);
  console.log('');
  console.log('⚠️  IMPORTANT: Change the admin password after first login!');
  console.log('');
  
  process.exit(0);
}

seedAdminUser().catch((error) => {
  console.error('❌ Seed failed:', error);
  process.exit(1);
});
```

### Package.json Script

```json
{
  "scripts": {
    "seed:admin": "tsx scripts/seed-admin.ts"
  }
}
```

### Verification Commands

```bash
# Verify admin user exists
psql $DATABASE_URL -c "SELECT email, role FROM users WHERE role='admin';"

# Verify organization exists
psql $DATABASE_URL -c "SELECT name, subscription_tier FROM organizations;"

# Test admin login (manual)
# Use credentials: admin@foundry.local / admin123 (or ADMIN_PASSWORD env var)
```

---

## PHASE 5: SOFT DELETE CASCADE RULES

### Cascade Policy Table

When a parent entity is soft deleted (deletedAt set to timestamp), the following cascade behaviors apply:

| Parent Entity | Child Entities | Cascade Behavior | Implementation |
|---------------|----------------|------------------|----------------|
| `organizations` | `users`, `projects`, `data_sources`, `processing_jobs`, `schema_mappings`, `deidentification_rules`, `datasets` | CASCADE: Set deletedAt on soft-deletable children, hard delete others | Cascade soft deletes in transaction |
| `projects` | `data_sources`, `schema_mappings`, `deidentification_rules`, `datasets` | CASCADE: Set deletedAt on soft-deletable children | Cascade soft deletes in transaction |
| `data_sources` | `processing_jobs` | NO CASCADE: Jobs retained for audit | Processing jobs retained |

### Implementation Pattern: Organization Soft Delete

```typescript
// server/services/organizations.service.ts
import { db } from '../db';
import { organizations, projects, dataSources, datasets } from '../db/schema';
import { eq } from 'drizzle-orm';

/**
 * Soft delete organization with cascade to all child entities
 * Reference: Agent 3 v20 (Soft Delete Cascade Rules)
 */
async function softDeleteOrganization(orgId: number): Promise<void> {
  const now = new Date();
  
  await db.transaction(async (tx) => {
    // Soft delete organization
    await tx.update(organizations)
      .set({ deletedAt: now })
      .where(eq(organizations.id, orgId));
    
    // CASCADE: Soft delete all projects
    await tx.update(projects)
      .set({ deletedAt: now })
      .where(eq(projects.organizationId, orgId));
    
    // CASCADE: Soft delete all data sources
    await tx.update(dataSources)
      .set({ deletedAt: now })
      .where(eq(dataSources.organizationId, orgId));
    
    // CASCADE: Soft delete all datasets
    await tx.update(datasets)
      .set({ deletedAt: now })
      .where(eq(datasets.organizationId, orgId));
    
    // NOTE: users, schema_mappings, deidentification_rules, processing_jobs
    // are hard deleted via database cascade (onDelete: 'cascade')
  });
}
```

### Implementation Pattern: Project Soft Delete

```typescript
// server/services/projects.service.ts
import { db } from '../db';
import { projects, dataSources, datasets } from '../db/schema';
import { eq } from 'drizzle-orm';

/**
 * Soft delete project with cascade to child entities
 */
async function softDeleteProject(projectId: number): Promise<void> {
  const now = new Date();
  
  await db.transaction(async (tx) => {
    // Soft delete project
    await tx.update(projects)
      .set({ deletedAt: now })
      .where(eq(projects.id, projectId));
    
    // CASCADE: Soft delete all data sources
    await tx.update(dataSources)
      .set({ deletedAt: now })
      .where(eq(dataSources.projectId, projectId));
    
    // CASCADE: Soft delete all datasets
    await tx.update(datasets)
      .set({ deletedAt: now })
      .where(eq(datasets.projectId, projectId));
    
    // NOTE: schema_mappings and deidentification_rules
    // are hard deleted via database cascade (onDelete: 'cascade')
  });
}
```

### Query Pattern Requirements: Multi-Level Filtering

**[CRITICAL]** When querying child entities, MUST filter deletedAt at BOTH parent and child levels.

**Incorrect Query (Orphan Risk):**

```typescript
// ❌ WRONG - Returns data sources even if project is soft deleted
const dataSources = await db
  .select()
  .from(dataSources)
  .where(isNull(dataSources.deletedAt));
```

**Correct Query (Multi-Level Filter):**

```typescript
// ✅ CORRECT - Filters both data source AND parent project
import { and, eq, isNull } from 'drizzle-orm';

const activeDataSources = await db
  .select()
  .from(dataSources)
  .leftJoin(projects, eq(dataSources.projectId, projects.id))
  .where(
    and(
      isNull(dataSources.deletedAt),    // Data source not deleted
      isNull(projects.deletedAt)         // Parent project not deleted
    )
  );
```

**Example: Get Datasets with Multi-Level Filter**

```typescript
// ✅ CORRECT - Filter dataset, project, and organization
import { and, eq, isNull } from 'drizzle-orm';

const activeDatasets = await db
  .select()
  .from(datasets)
  .leftJoin(projects, eq(datasets.projectId, projects.id))
  .leftJoin(organizations, eq(projects.organizationId, organizations.id))
  .where(
    and(
      isNull(datasets.deletedAt),       // Dataset not deleted
      isNull(projects.deletedAt),       // Parent project not deleted
      isNull(organizations.deletedAt)   // Parent organization not deleted
    )
  );
```

---

## PHASE 6: INDEXING STRATEGY

### Index Specifications

| Table | Index Name | Columns | Type | Purpose |
|-------|-----------|---------|------|---------|
| `users` | `users_email_idx` | email | B-tree | Authentication lookup |
| `users` | `users_organization_idx` | organizationId | B-tree | Multi-tenant filtering |
| `user_sessions` | `sessions_refresh_token_idx` | refreshToken | B-tree | Token refresh lookup |
| `user_sessions` | `sessions_user_idx` | userId | B-tree | User session cleanup |
| `projects` | `projects_organization_idx` | organizationId | B-tree | Multi-tenant filtering |
| `projects` | `projects_owner_idx` | ownerId | B-tree | User's projects |
| `data_sources` | `data_sources_project_idx` | projectId | B-tree | Project's data sources |
| `data_sources` | `data_sources_type_idx` | type | B-tree | Filter by source type |
| `processing_jobs` | `processing_jobs_data_source_idx` | dataSourceId | B-tree | Data source's jobs |
| `processing_jobs` | `processing_jobs_status_idx` | status | B-tree | Filter by job status |
| `processing_jobs` | `processing_jobs_organization_idx` | organizationId | B-tree | Organization job history |
| `schema_mappings` | `schema_mappings_project_idx` | projectId | B-tree | Project's mappings |
| `deidentification_rules` | `deidentification_rules_project_idx` | projectId | B-tree | Project's rules |
| `datasets` | `datasets_project_idx` | projectId | B-tree | Project's datasets |
| `datasets` | `datasets_processing_job_idx` | processingJobId | B-tree | Job's datasets |

### Query Performance Guidelines

**Expected Query Patterns:**

1. **User Authentication:** `SELECT * FROM users WHERE email = ?` → `users_email_idx`
2. **Organization Data:** `SELECT * FROM projects WHERE organizationId = ?` → `projects_organization_idx`
3. **User's Projects:** `SELECT * FROM projects WHERE ownerId = ?` → `projects_owner_idx`
4. **Project's Data Sources:** `SELECT * FROM data_sources WHERE projectId = ?` → `data_sources_project_idx`
5. **Running Jobs:** `SELECT * FROM processing_jobs WHERE status = 'running'` → `processing_jobs_status_idx`

**Performance Targets:**

- Authentication queries: <10ms
- Multi-tenant filtering: <50ms
- Project data retrieval: <100ms
- Export generation: <5s for 10K records

### Indexing Verification

```bash
# Verify all indexes exist
psql $DATABASE_URL -c "SELECT schemaname, tablename, indexname FROM pg_indexes WHERE schemaname='public' ORDER BY tablename, indexname;"

# Check index usage (after load testing)
psql $DATABASE_URL -c "SELECT schemaname, tablename, indexname, idx_scan FROM pg_stat_user_indexes WHERE schemaname='public' ORDER BY idx_scan DESC;"
```

---

## PHASE 7: MIGRATION STRATEGY

### Migration Tool: Drizzle Kit

```typescript
// drizzle.config.ts
import type { Config } from 'drizzle-kit';

export default {
  schema: './server/db/schema/*.ts',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
} satisfies Config;
```

### Migration Scripts

```json
// package.json
{
  "scripts": {
    "db:generate": "drizzle-kit generate:pg",
    "db:migrate": "tsx server/db/migrate.ts",
    "db:studio": "drizzle-kit studio"
  }
}
```

### Migration Runner

```typescript
// server/db/migrate.ts
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';

/**
 * Migration runner for Drizzle migrations
 * Usage: npm run db:migrate
 */
async function runMigrations() {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const db = drizzle(pool);

  console.log('Running migrations...');
  
  await migrate(db, { migrationsFolder: './drizzle' });
  
  console.log('Migrations complete!');
  
  await pool.end();
}

runMigrations().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
```

### Migration Workflow

```bash
# 1. Generate migration from schema changes
npm run db:generate

# 2. Review generated SQL in drizzle/ directory

# 3. Run migration
npm run db:migrate

# 4. Verify schema
npm run db:studio
```

### Rollback Strategy

**Forward-Only Migrations (Recommended for MVP)**

- No automatic rollbacks
- Create new migration to revert changes
- Maintain audit trail of all schema changes

**Example Rollback Migration:**

```typescript
// drizzle/0002_rollback_example.sql
-- Rollback for 0001_add_column migration
ALTER TABLE projects DROP COLUMN IF EXISTS new_column;
```

---

## PHASE 8: QUERY PATTERNS

### Multi-Tenant Query Patterns

**[CRITICAL]** All queries MUST filter by organizationId (ADR-004)

```typescript
// Get user's projects (multi-tenant filter)
import { db } from './db';
import { projects } from './db/schema';
import { eq, and, isNull } from 'drizzle-orm';

const userProjects = await db
  .select()
  .from(projects)
  .where(
    and(
      eq(projects.organizationId, currentUser.organizationId),
      eq(projects.ownerId, currentUser.id),
      isNull(projects.deletedAt) // Exclude soft-deleted
    )
  );
```

### Soft Delete Query Patterns

```typescript
// Get active data sources with project join
const activeDataSources = await db
  .select()
  .from(dataSources)
  .leftJoin(projects, eq(dataSources.projectId, projects.id))
  .where(
    and(
      eq(dataSources.organizationId, orgId),
      isNull(dataSources.deletedAt),
      isNull(projects.deletedAt) // Multi-level filter
    )
  );
```

### Pagination Pattern

```typescript
// Paginated project list
const page = 1;
const limit = 20;
const offset = (page - 1) * limit;

const paginatedProjects = await db
  .select()
  .from(projects)
  .where(
    and(
      eq(projects.organizationId, orgId),
      isNull(projects.deletedAt)
    )
  )
  .limit(limit)
  .offset(offset)
  .orderBy(projects.createdAt);
```

### N+1 Prevention Pattern

```typescript
// ❌ BAD: N+1 query pattern (fetches data sources in loop)
const projects = await db.select().from(projects);
for (const project of projects) {
  project.dataSources = await db.select().from(dataSources).where(eq(dataSources.projectId, project.id));
}

// ✅ GOOD: Single query with JOIN
const projectsWithDataSources = await db
  .select()
  .from(projects)
  .leftJoin(dataSources, eq(dataSources.projectId, projects.id))
  .where(
    and(
      eq(projects.organizationId, orgId),
      isNull(projects.deletedAt),
      isNull(dataSources.deletedAt)
    )
  );

// Group results in application code
const grouped = projectsWithDataSources.reduce((acc, row) => {
  const projectId = row.projects.id;
  if (!acc[projectId]) {
    acc[projectId] = { ...row.projects, dataSources: [] };
  }
  if (row.data_sources) {
    acc[projectId].dataSources.push(row.data_sources);
  }
  return acc;
}, {} as Record<number, Project & { dataSources: DataSource[] }>);
```

### Complex Query Example: Dataset Export

```typescript
// Get dataset with full lineage (project, data source, processing job)
import { eq } from 'drizzle-orm';

const datasetWithLineage = await db
  .select()
  .from(datasets)
  .leftJoin(projects, eq(datasets.projectId, projects.id))
  .leftJoin(processingJobs, eq(datasets.processingJobId, processingJobs.id))
  .leftJoin(dataSources, eq(processingJobs.dataSourceId, dataSources.id))
  .where(eq(datasets.id, datasetId))
  .limit(1);

// Result includes: dataset, project, processingJob, dataSource
```

---

## PHASE 9: MULTI-TENANT ISOLATION

### Organization-Level Filtering

**[CRITICAL]** Per ADR-004, multi-tenancy enforced via query-level filtering.

**Enforcement Pattern:**

```typescript
// server/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to add organizationId to all requests
 * Reference: ADR-004 (Query-level multi-tenancy)
 */
export function enforceOrganization(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // Add organizationId to request context
  req.organizationId = req.user.organizationId;
  
  next();
}
```

### Data Isolation Verification

```typescript
// server/services/projects.service.ts

/**
 * Get project by ID with organization check
 * Prevents cross-tenant data access
 */
async function getProject(projectId: number, organizationId: number): Promise<Project | null> {
  const [project] = await db
    .select()
    .from(projects)
    .where(
      and(
        eq(projects.id, projectId),
        eq(projects.organizationId, organizationId), // CRITICAL: Organization filter
        isNull(projects.deletedAt)
      )
    )
    .limit(1);
  
  return project || null;
}
```

### Cross-Tenant Prevention Rules

**[CRITICAL] Never Use ID-Only Queries**

```typescript
// ❌ WRONG - Allows cross-tenant access
const project = await db
  .select()
  .from(projects)
  .where(eq(projects.id, projectId));

// ✅ CORRECT - Organization filter prevents cross-tenant access
const project = await db
  .select()
  .from(projects)
  .where(
    and(
      eq(projects.id, projectId),
      eq(projects.organizationId, currentUser.organizationId)
    )
  );
```

---

## PHASE 10: VALIDATION & CONSTRAINTS

### Database-Level Constraints

```typescript
// Field-level constraints already defined in schemas:
// - NOT NULL: Critical fields (name, email, organizationId)
// - UNIQUE: Unique identifiers (email, refreshToken)
// - DEFAULT: Status fields, timestamps, roles
// - FOREIGN KEY: Referential integrity with cascade rules
```

### Application-Level Validation

```typescript
// server/validators/user.validator.ts
import { z } from 'zod';

/**
 * User creation validation schema
 * Reference: AR-010 (Email validation required)
 */
export const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required').optional(),
  role: z.enum(['admin', 'member', 'viewer']).default('member'),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  role: z.enum(['admin', 'member', 'viewer']).optional(),
});
```

### Data Integrity Rules

| Rule | Enforcement | Purpose |
|------|-------------|---------|
| Email uniqueness | Database UNIQUE constraint | Prevent duplicate accounts |
| Organization cascade | Foreign key onDelete: 'cascade' | Clean up orphaned data |
| Project ownership | Foreign key onDelete: 'restrict' | Prevent deleting users with projects |
| Soft delete integrity | Application-level cascade | Maintain audit trail |
| Multi-tenant isolation | Query-level organizationId filter | Prevent cross-tenant access |

---

## ASSUMPTION REGISTER

### AR-001: Role Permissions Matrix

- **Owner Agent:** Agent 3
- **Type:** DEPENDENCY
- **Downstream Impact:** [Agent 4 (API - authorization middleware), Agent 5 (UI - role-based UI), Agent 7 (QA - permission testing)]
- **Resolution Deadline:** BEFORE_AGENT_4
- **Allowed to Ship:** YES
- **Status:** UNRESOLVED
- **Source Gap:** PRD AR-006 states three roles (admin, member, viewer) but doesn't define granular permissions
- **Assumption Made:** Basic three-role system with hierarchical permissions:
  - Admin: Full control (create/edit/delete organizations, projects, users)
  - Member: Create/edit projects, data sources, exports (no user management)
  - Viewer: Read-only access to projects and datasets
- **Impact if Wrong:** Need to add granular permission system (e.g., "can upload but not download")
- **Resolution Note:** Product owner must define exact permission matrix before Agent 4 implements authorization middleware

---

### AR-002: Project Visibility Scope

- **Owner Agent:** Agent 3
- **Type:** ASSUMPTION
- **Downstream Impact:** [Agent 4 (API - project list filtering), Agent 5 (UI - project visibility)]
- **Resolution Deadline:** BEFORE_AGENT_4
- **Allowed to Ship:** YES
- **Status:** UNRESOLVED
- **Source Gap:** PRD AR-007 mentions shared visibility but doesn't specify if users can see all org projects or only owned projects
- **Assumption Made:** All organization members can view all projects within their organization (no private projects in MVP)
- **Impact if Wrong:** Need to add `visibility` column to projects table ('public' | 'private') and project access control table
- **Resolution Note:** User research validates if shared visibility is acceptable for team workflows

---

### AR-003: Data Source Cache Duration

- **Owner Agent:** Agent 3
- **Type:** ASSUMPTION
- **Downstream Impact:** [Agent 6 (Implementation - cleanup jobs), Agent 7 (QA - data retention testing)]
- **Resolution Deadline:** BEFORE_AGENT_6
- **Allowed to Ship:** YES
- **Status:** UNRESOLVED
- **Source Gap:** PRD AR-009 assumes 30-day cache but doesn't specify cleanup strategy for Replit's ephemeral filesystem
- **Assumption Made:** File paths in `data_sources.filePath` and `datasets.filePath` point to Replit persistent storage (not ephemeral `/tmp`). Files older than 30 days are eligible for cleanup but database records retained.
- **Impact if Wrong:** Files disappear on Replit restart; need external storage (S3)
- **Resolution Note:** Validate Replit persistent storage behavior; implement cleanup job if storage limits reached

---

### AR-004: PII Detection Accuracy Threshold

- **Owner Agent:** Agent 3
- **Type:** DEPENDENCY
- **Downstream Impact:** [Agent 6 (Implementation - PII detector service)]
- **Resolution Deadline:** BEFORE_AGENT_6
- **Allowed to Ship:** CONDITIONAL
- **Status:** UNRESOLVED
- **Source Gap:** PRD AR-014 mentions 95% accuracy but doesn't specify how to measure or enforce
- **Assumption Made:** PII detection rules in `deidentification_rules` table use regex/NLP methods. Detection results (matched PII instances) stored in `processing_jobs.config` for audit. Manual review required before final export.
- **Impact if Wrong:** Privacy violations if critical PII missed; over-masking if false positives too high
- **Resolution Note:** Must validate accuracy with test dataset before production launch. Agent 6 implements detection metrics in processing jobs.

---

### AR-005: Export File Naming Convention

- **Owner Agent:** Agent 3
- **Type:** ASSUMPTION
- **Downstream Impact:** [Agent 6 (Implementation - export service)]
- **Resolution Deadline:** BEFORE_AGENT_6
- **Allowed to Ship:** YES
- **Status:** UNRESOLVED
- **Source Gap:** PRD AR-015 suggests `{projectName}_{timestamp}.jsonl` but doesn't specify if database stores original filename or generated path
- **Assumption Made:** `datasets.name` stores user-friendly name, `datasets.filePath` stores generated filename with timestamp (e.g., `datasets/org_1/project_5/dataset_123_2026-02-01T14:23:00Z.jsonl`)
- **Impact if Wrong:** Naming conflicts if multiple users download same dataset simultaneously
- **Resolution Note:** Agent 6 implements file storage service with atomic filename generation

---

### AR-006: Teamwork Desk API Rate Limits

- **Owner Agent:** Agent 3
- **Type:** DEPENDENCY
- **Downstream Impact:** [Agent 6 (Implementation - Teamwork Desk connector)]
- **Resolution Deadline:** BEFORE_AGENT_6
- **Allowed to Ship:** CONDITIONAL
- **Status:** UNRESOLVED
- **Source Gap:** PRD AR-012 mentions rate limits but doesn't specify how to store rate limit state
- **Assumption Made:** `data_sources.connectionConfig` stores API credentials. Rate limit state NOT stored in database (handled in-memory during import). If import fails due to rate limit, `processing_jobs.errorMessage` records reason.
- **Impact if Wrong:** Import fails mid-execution without retry; need rate limit tracking table
- **Resolution Note:** Agent 6 reviews Teamwork Desk API docs and implements exponential backoff retry logic

---

### AR-007: Schema Mapping Complexity

- **Owner Agent:** Agent 3
- **Type:** ASSUMPTION
- **Downstream Impact:** [Agent 4 (API - schema config endpoints), Agent 6 (Implementation - transformation engine)]
- **Resolution Deadline:** BEFORE_AGENT_4
- **Allowed to Ship:** YES
- **Status:** UNRESOLVED
- **Source Gap:** PRD describes conversational schema but doesn't specify if custom transformations (e.g., date formatting, string manipulation) are required
- **Assumption Made:** `schema_mappings.transformationRules` stores simple field mapping only (no complex logic). Custom transformations deferred to Phase 2.
- **Impact if Wrong:** Users need custom transformations (e.g., "extract domain from email"); need transformation DSL or code execution
- **Resolution Note:** Validate with Persona 1 if simple field mapping is sufficient for MVP

---

### AR-008: Processing Job Concurrency

- **Owner Agent:** Agent 3
- **Type:** CONSTRAINT
- **Downstream Impact:** [Agent 6 (Implementation - job queue)]
- **Resolution Deadline:** BEFORE_AGENT_6
- **Allowed to Ship:** CONDITIONAL
- **Status:** UNRESOLVED
- **Source Gap:** PRD mentions batch processing but doesn't specify concurrency limits
- **Assumption Made:** `processing_jobs.status` tracks job state. Only one job per data source can run at a time (prevent duplicate processing). Concurrency limit: 5 concurrent jobs per organization.
- **Impact if Wrong:** Database contention if too many concurrent jobs; slow processing if limit too low
- **Resolution Note:** Load testing with Agent 7 validates concurrency limits; adjust based on Replit resource constraints

---

### AR-009: Soft Delete Restoration Flow

- **Owner Agent:** Agent 3
- **Type:** ASSUMPTION
- **Downstream Impact:** [Agent 4 (API - restore endpoints), Agent 5 (UI - restore action)]
- **Resolution Deadline:** BEFORE_AGENT_4
- **Allowed to Ship:** YES
- **Status:** UNRESOLVED
- **Source Gap:** Data model includes soft delete but PRD doesn't specify restoration user flow
- **Assumption Made:** Soft-deleted entities can be restored by setting `deletedAt = NULL`. Restoring parent (e.g., project) does NOT automatically restore children (e.g., data sources) - user must restore children explicitly.
- **Impact if Wrong:** Users expect cascade restore; need complex restoration logic
- **Resolution Note:** Product owner defines restoration behavior; Agent 5 designs UI for restoration workflow

---

### AR-010: Organization Deletion Constraints

- **Owner Agent:** Agent 3
- **Type:** ASSUMPTION
- **Downstream Impact:** [Agent 4 (API - organization deletion), Agent 6 (Implementation - cleanup)]
- **Resolution Deadline:** BEFORE_AGENT_4
- **Allowed to Ship:** YES
- **Status:** UNRESOLVED
- **Source Gap:** PRD doesn't specify constraints on organization deletion (e.g., must delete all projects first?)
- **Assumption Made:** Organization can be soft deleted with active projects/data. All child entities cascade soft delete. Hard deletion forbidden (use soft delete only).
- **Impact if Wrong:** Users lose access to active projects unexpectedly; need confirmation workflow
- **Resolution Note:** Agent 4 implements deletion API with confirmation requirement; Agent 5 designs multi-step deletion UI

---

## DOCUMENT END

**Agent 3 (Data Modeling) v23 - EXECUTION COMPLETE**

**Output:** `03-DATA-MODEL.md`

**Next Step:** Agent 4 (API Contract) will read this data model to design REST API endpoints and request/response schemas.

**Data Model Summary:**
- **Tables:** 10 total (9 required Phase 1, 1 deferred Phase 2)
- **Foreign Keys:** 14 relationships
- **Indexes:** 18 indexes for query optimization
- **Soft Delete:** 4 tables (organizations, projects, data_sources, datasets)
- **Multi-Tenant Enforcement:** Organization-level query filtering (ADR-004)
- **ORM:** Drizzle ORM with `pg` driver (ADR-002)
- **Seed Data:** Admin user creation script included (Agent 3 v22 requirement)

**Schema Verification Status:**
- [x] Table count: 9 (Phase 1)
- [x] Foreign key relationships defined
- [x] Indexes specified for all critical queries
- [x] Soft delete cascade rules documented
- [x] Multi-level filtering patterns provided
- [x] Seed data script included
- [x] Verification commands provided

**ADR References:**
- ADR-002: Drizzle ORM schema definitions
- ADR-003: User sessions for JWT refresh tokens
- ADR-004: Organization-level multi-tenant filtering
- ADR-008: Cryptographic randomness for refresh tokens
- ADR-009: PII de-identification rule storage

**Assumption Register Status:** 10 assumptions documented; 0 resolved, 10 unresolved (requires Product Owner and Agent 4/6 input)

**Constitutional Compliance:** Aligned with Agent 0 v4.6 tiered prevention model

**Quality Verification:**
- [x] All phases complete (1-10)
- [x] ADR references for all architecture decisions
- [x] Soft delete cascade rules specified (GAP-DATA-001 fix)
- [x] Multi-level filtering patterns documented
- [x] Database Table Summary with explicit counts
- [x] Schema Verification Commands provided
- [x] Seed data requirements with admin user script
- [x] No TBDs (all unknowns in Assumption Register)
- [x] Drizzle ORM conventions followed
- [x] Query patterns optimized for Replit PostgreSQL
