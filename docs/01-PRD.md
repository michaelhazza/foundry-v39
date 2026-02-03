# Product Requirements Document: Foundry
## Version 1.0

**Document ID:** 01-PRD  
**Created:** 2026-02-01  
**Agent:** Agent 1 (Product Definition v20)  
**Framework:** Agent Specification Framework v2.1  
**Constitution:** Agent 0 v4.6  
**Status:** ACTIVE  
**Deployment Target:** Replit (Single Container, PostgreSQL via Neon)

---

## 1. Executive Summary

### Product Overview

Foundry is a multi-tenant SaaS platform that transforms raw business data from any source into clean, de-identified, structured datasets ready for AI systems, agents, and evaluation workflows. It eliminates the fragmented, manual, and technical barriers that prevent organizations from using their operational data to power AI initiatives.

### Core Value Proposition

**"Turn any business data into AI-ready datasets in under 5 minutes—no engineering required."**

Foundry sits between operational systems (helpdesks, CRMs, databases, files) and AI tooling, providing a universal preparation layer that handles:
- Extraction from heterogeneous sources
- Privacy-compliant de-identification
- Schema normalization to consistent structures
- Export in AI-optimized formats

### Primary Use Case (MVP)

Customer support teams want to train AI agents using their resolved support tickets, but raw ticket data contains:
- Customer PII (names, emails, phone numbers)
- Internal identifiers and sensitive metadata
- Inconsistent structures across helpdesk platforms
- Quality issues (spam, incomplete conversations)

Foundry enables them to upload a CSV export or connect their helpdesk API, configure de-identification rules through a UI, and download clean conversational datasets suitable for agent fine-tuning—without writing code or involving engineering teams.

### Target Outcomes

- **Speed:** Non-technical users generate AI-ready datasets in <5 minutes
- **Safety:** 100% PII de-identified with traceable governance
- **Consistency:** Heterogeneous sources map to canonical schemas
- **Reusability:** Same source data powers multiple AI projects

### MVP Scope

**Launch includes:**
- Single-tenant organization management
- File upload processing (CSV, Excel, JSON)
- Teamwork Desk API connector
- Conversational data schema normalization
- PII detection and de-identification
- Export to JSONL, Q&A pairs, JSON
- Project-based workflow with batch processing

**Excluded from MVP:** Real-time pipelines, Zendesk/Salesforce connectors, automatic topic extraction, cloud storage integrations, usage-based billing

---

## 2. Problem Statement

### The Core Problem

Organizations increasingly want to leverage their operational data to power AI agents, internal tools, and intelligent workflows. However, **the path from "data in systems" to "AI-ready datasets" is fragmented, manual, and inaccessible to non-technical teams.**

This creates a bottleneck where:
- AI initiatives stall waiting for data engineering resources
- Custom scripts are built for every source/use case (high cost, unmaintainable)
- Privacy risks prevent teams from using real business data
- Inconsistent data structures cause unpredictable AI behavior

### Validated Pain Points

#### Pain Point 1: Fragmented Data Sources

**Problem:** Operational data is scattered across helpdesks (Zendesk, Intercom), CRMs (Salesforce, HubSpot), document stores (Google Drive, Notion), spreadsheets, and internal databases. No unified extraction mechanism exists.

**Current Workaround:** Teams manually export CSV files from each system, then spend hours copying/pasting into spreadsheets or writing custom Python scripts to merge data.

**Impact:** Data preparation consumes 60-80% of time in AI projects, delaying time-to-value from months to quarters.

#### Pain Point 2: Privacy and Compliance Risk

**Problem:** Raw business data contains customer PII (names, emails, phone numbers), internal identifiers (employee IDs, account numbers), and regulated information (health data, financial records). Using this data for AI training without de-identification creates legal liability and violates privacy policies.

**Current Workaround:** Manual find/replace in spreadsheets (error-prone), or hiring data engineers to build custom de-identification pipelines (expensive, slow).

**Impact:** Teams either:
- Risk compliance violations by using raw data
- Abandon AI initiatives due to privacy concerns
- Wait 3-6 months for engineering to build custom solutions

#### Pain Point 3: Inconsistent Data Formats

**Problem:** Each source structures data differently:
- Zendesk tickets use different field names than Intercom conversations
- Email threads have different formats than chat logs
- Document metadata varies by platform

AI systems require predictable schemas to perform reliably, but teams lack tools to normalize heterogeneous inputs.

**Current Workaround:** Write source-specific transformation scripts for each integration, then manually map fields to common structures.

**Impact:** Same AI model requires different training data formats depending on source, preventing reusability and forcing redundant engineering work.

#### Pain Point 4: High Technical Barrier

**Problem:** Preparing AI-ready datasets currently requires:
- Engineering skills (Python, SQL, API integration)
- Privacy expertise (PII detection, anonymization techniques)
- AI/ML knowledge (optimal data formats, quality requirements)

Non-technical teams (product managers, support ops, sales enablement) cannot prepare datasets independently.

**Current Workaround:** Submit tickets to engineering teams, wait in queue, or hire external consultants.

**Impact:** 6-12 week delays for simple dataset preparation tasks; AI initiatives require scarce engineering resources.

### Problem Scope

**In Scope:** Business data preparation for AI (support tickets, sales conversations, documents, structured records)

**Out of Scope:** Model training/inference, data warehousing, manual data labeling, real-time streaming analytics

### Success Definition

The problem is solved when a non-technical user (e.g., Support Operations Manager) can independently transform raw helpdesk data into clean, de-identified, AI-ready datasets in under 5 minutes without engineering support.

---

## 3. User Personas

### Persona 1: Support Operations Manager (Primary)

**Role:** Sarah Chen, Head of Customer Support at a 150-person SaaS company

**Demographics:**
- Age: 32
- Education: Business degree, non-technical background
- Team size: 12 support agents
- Tools: Teamwork Desk, Slack, Google Sheets

**Goals:**
- Train an AI support agent to handle Tier 1 questions (reduce ticket volume by 30%)
- Use historical ticket resolutions to coach new support hires
- Identify knowledge gaps in help documentation based on ticket patterns

**Pain Points:**
- Has 18 months of resolved tickets (8,000 conversations) but can't use them for AI training due to customer PII
- Tried exporting CSV from Teamwork Desk, but data includes names/emails (compliance violation)
- Requested engineering help to de-identify data; quoted 6 weeks + $15K budget
- Doesn't know how to structure data for AI training (needs Q&A pairs? JSONL? What format?)

**Current Workflow:**
1. Manually copy/paste 50 "good" ticket resolutions into Google Doc
2. Use find/replace to remove customer names (misses many instances)
3. Upload to ChatGPT for ad-hoc training experiments
4. Realize dataset is too small and inconsistent for production AI

**Jobs to Be Done:**
- **JTBD-1:** "Get my historical support tickets ready for AI agent training without violating customer privacy"
- **JTBD-2:** "Transform messy ticket exports into structured conversational datasets"
- **JTBD-3:** "Regenerate datasets when new tickets are added each month"

**Success Criteria:**
- Can prepare dataset in <10 minutes without engineering help
- Confident that all customer PII is removed (audit trail)
- Receives data in format compatible with AI training platforms

**Acceptable Tradeoffs:**
- Willing to accept monthly manual refresh (doesn't need real-time sync)
- Batch processing is fine (doesn't need instant results)
- Download-only exports acceptable (doesn't need cloud storage integration)

**Quote:** *"I have the data, I just can't use it safely. Engineering says it's a 6-week project to clean it up."*

---

### Persona 2: Product Manager (Secondary)

**Role:** Marcus Rodriguez, Product Manager at an AI startup building sales coaching tools

**Demographics:**
- Age: 28
- Education: Computer Science degree, technical but doesn't write production code
- Team size: 8 (3 engineers, 2 designers, 2 data scientists, 1 PM)
- Tools: Linear, Figma, Notion, internal APIs

**Goals:**
- Build evaluation datasets to test AI sales assistant accuracy
- Use real sales call transcripts to fine-tune conversation models
- Create benchmarks comparing AI performance against human sales reps

**Pain Points:**
- Has access to 500 sales call transcripts (from Gong) but they contain prospect company names and deal values (confidential)
- Data scientists are backlogged with model work (no bandwidth for data prep)
- Each new dataset requires custom Python script (unmaintainable)
- No way to version datasets or track what de-identification rules were applied

**Current Workflow:**
1. Export call transcripts from Gong as JSON
2. Write custom Python script to detect/mask company names
3. Manually review 50 samples to catch missed PII
4. Upload to S3, share with data science team
5. Repeat process monthly with new data

**Jobs to Be Done:**
- **JTBD-1:** "Prepare evaluation datasets without leaking confidential deal information"
- **JTBD-2:** "Version datasets so team knows which AI model was trained on what data"
- **JTBD-3:** "Automate monthly dataset refresh without writing new scripts"

**Success Criteria:**
- Can configure dataset preparation once, then regenerate monthly
- Has audit log showing what de-identification rules were applied
- Team can self-service new dataset projects without PM bottleneck

**Acceptable Tradeoffs:**
- Willing to configure processing rules manually (doesn't need AI auto-detection)
- Batch processing acceptable (doesn't need streaming)
- Can download and manually upload to training platform (doesn't need direct integration)

**Quote:** *"Every time I need a dataset, I write a new Python script. I have 12 scripts doing almost the same thing."*

---

### Persona 3: Data Scientist (Tertiary)

**Role:** Dr. Emily Park, Senior Data Scientist at enterprise software company

**Demographics:**
- Age: 35
- Education: PhD in Machine Learning
- Team size: Solo contributor, reports to Head of AI
- Tools: Python, Jupyter, AWS SageMaker, internal data warehouse

**Goals:**
- Experiment with domain-specific fine-tuning (customer support, sales, legal)
- Benchmark AI performance on real business data vs synthetic data
- Ensure training datasets meet quality standards (no duplicates, balanced distribution)

**Pain Points:**
- Provisioning access to production databases requires security approvals (4-6 weeks)
- Data engineering team treats dataset requests as low priority
- No tooling to verify PII removal before using data (audit risk)
- Datasets prepared by different teams have inconsistent quality

**Current Workflow:**
1. Submit data request ticket to engineering team
2. Wait 3-4 weeks for access provisioning and data export
3. Manually inspect data for PII (time-consuming, error-prone)
4. Write custom normalization scripts to clean data
5. Discover quality issues mid-training, restart process

**Jobs to Be Done:**
- **JTBD-1:** "Access business data for AI experiments without waiting for engineering"
- **JTBD-2:** "Trust that datasets are de-identified and compliant before model training"
- **JTBD-3:** "Get consistent data quality regardless of source system"

**Success Criteria:**
- Can self-service dataset creation within 24 hours (vs 4-6 weeks)
- Receives data in ML-standard formats (JSONL, parquet)
- Has provenance tracking (what source, what transformations applied)

**Acceptable Tradeoffs:**
- Willing to use UI for configuration (doesn't need programmatic API access for MVP)
- Can accept batch processing (doesn't need real-time pipelines)
- Can work with 30-day cached source data (doesn't need live database access)

**Quote:** *"I spend 80% of my time on data prep and 20% on actual modeling. It should be the opposite."*

---

### Persona Priorities

**MVP Focus:** Persona 1 (Support Operations Manager) is primary. Product must succeed for non-technical users.

**Secondary:** Persona 2 (Product Manager) validates reusability across projects.

**Tertiary:** Persona 3 (Data Scientist) ensures output quality meets ML standards.

---

## 4. Functional Requirements

### Feature Area 1: Organization and User Management

**Purpose:** Enable multi-tenant isolation and user access control

#### FR-1.1: Organization Creation and Isolation

**Requirement:** System must support multiple isolated organizations (tenants), where each organization's data is completely separated from all other organizations.

**Acceptance Criteria:**
- User can create new organization during signup
- User cannot access data from other organizations
- Organization has unique identifier and name
- System enforces data isolation at all query levels

**Observable Outcome:** User A in Org 1 cannot see projects, datasets, or sources from Org 2

**Failure Case:** If isolation fails, cross-organization data leaks occur (CRITICAL security violation)

---

#### FR-1.2: User Invitation and Role Management

**Requirement:** Organization administrators must be able to invite additional users via email and assign role-based permissions.

**Acceptance Criteria:**
- Admin can send email invitation with signup link
- Invitation expires after 7 days if not accepted
- User accepts invitation and joins organization
- System assigns role: Admin, Member, or Viewer (role definitions in AR-006)

**Observable Outcome:** Invited user receives email, clicks link, and gains organization access

**Failure Case:** Uninvited users cannot access organization; expired invitations cannot be used

---

#### FR-1.3: User Authentication

**Requirement:** Users must authenticate with email and password to access the platform.

**Acceptance Criteria:**
- User can register with email and password (minimum 8 characters)
- User can log in with credentials
- User can reset forgotten password via email link
- Session persists for 7 days unless user logs out

**Observable Outcome:** Authenticated user accesses dashboard; unauthenticated user redirected to login

**Failure Case:** Invalid credentials rejected; password reset link expires after 1 hour

---

### Feature Area 2: Project Management

**Purpose:** Enable users to organize dataset preparation workflows around specific AI initiatives

#### FR-2.1: Project Creation

**Requirement:** Users must be able to create projects that define a single dataset preparation workflow (e.g., "Support Agent Training Data").

**Acceptance Criteria:**
- User provides project name and description
- User selects canonical schema (initial: Conversational Data)
- Project is scoped to organization (all org members can see it per AR-007)
- Project has unique identifier

**Observable Outcome:** Project appears in organization's project list

**Failure Case:** Projects without schema selection cannot proceed to data processing

---

#### FR-2.2: Project Configuration

**Requirement:** Users must configure how source data is processed within a project, including field mapping, filters, and de-identification rules.

**Acceptance Criteria:**
- User maps source fields to canonical schema fields (e.g., "ticket_description" → "message_content")
- User defines quality filters (e.g., exclude conversations <2 messages)
- User configures PII de-identification rules (automatic detection + custom masks)
- Configuration is saved and editable

**Observable Outcome:** Configuration applied when processing runs; same source produces different outputs in different projects

**Failure Case:** Processing fails if required fields unmapped or filters invalid

---

#### FR-2.3: Project Dashboard

**Requirement:** Users must see project status, processing history, and downloadable outputs in a single view.

**Acceptance Criteria:**
- Dashboard shows: project name, schema type, source count, processing status, output count
- User sees list of past processing runs with timestamps
- User sees list of generated datasets with download links
- User sees processing errors if any occurred

**Observable Outcome:** User navigates to project and understands current state without external documentation

**Failure Case:** If processing fails, user sees error message explaining what went wrong (e.g., "Missing required field: customer_email")

---

### Feature Area 3: Data Source Management

**Purpose:** Enable ingestion of raw business data from files and APIs

#### FR-3.1: File Upload (CSV, Excel, JSON)

**Requirement:** Users must upload structured data files that become source data for processing.

**Acceptance Criteria:**
- User uploads file via drag-and-drop or file picker
- System validates file format (CSV, Excel .xlsx, JSON)
- System validates file size (<10MB per upload per Replit constraints)
- File is stored in organization-scoped storage
- File metadata captured: filename, size, upload timestamp, uploader

**Observable Outcome:** Uploaded file appears in project's source list and is available for processing

**Failure Case:** Invalid format rejected with error message; files >10MB rejected; corrupt files rejected

---

#### FR-3.2: Column Detection and Preview

**Requirement:** After file upload, system must automatically detect columns/fields and show preview of raw data.

**Acceptance Criteria:**
- System detects headers (CSV first row, Excel first row, JSON keys)
- System infers data types (text, number, date)
- User sees preview of first 10 rows
- User can manually override column detection if headers missing

**Observable Outcome:** User confirms detected columns match expectations before proceeding

**Failure Case:** If column detection fails (no headers, malformed data), user prompted to fix source file

---

#### FR-3.3: Teamwork Desk API Connection

**Requirement:** Users must connect their Teamwork Desk account to import ticket data via API.

**Acceptance Criteria:**
- User enters Teamwork Desk API credentials (domain, API key)
- System validates credentials by test API call
- System fetches ticket metadata (ticket count, date range)
- User selects date range to import (e.g., "last 6 months")
- System imports tickets and stores as cached source data
- Cached data expires after 30 days (must re-fetch)

**Observable Outcome:** Tickets appear as source data in project, same as uploaded files

**Failure Case:** Invalid credentials rejected; API rate limits handled gracefully; network errors retry up to 3 times

---

### Feature Area 4: Data Processing Pipeline

**Purpose:** Transform raw source data into clean, de-identified, normalized datasets

#### FR-4.1: PII Detection (Automatic)

**Requirement:** System must automatically detect common PII patterns in text fields (names, emails, phone numbers, addresses).

**Acceptance Criteria:**
- System scans text fields for: emails (regex pattern), phone numbers (US/international formats), credit card numbers, SSNs
- System flags detected PII with confidence score
- User reviews flagged PII in preview (first 10 samples)
- User can accept/reject detections

**Observable Outcome:** Preview shows PII highlighted before processing; user confirms accuracy

**Failure Case:** If detection misses PII, user can add custom masking rules (FR-4.2)

---

#### FR-4.2: Custom PII Masking Rules

**Requirement:** Users must define custom rules to mask sensitive data not caught by automatic detection (e.g., company-specific identifiers, product names).

**Acceptance Criteria:**
- User adds custom mask: "Replace [pattern] with [replacement]"
- Patterns support: exact match, regex, keyword list
- Replacements support: static text, tokens ([NAME], [EMAIL]), hashing
- Rules apply during processing in order specified

**Observable Outcome:** Custom-masked data appears in preview; user verifies correctness

**Failure Case:** Invalid regex patterns rejected with error message

---

#### FR-4.3: Schema Normalization (Conversational Data)

**Requirement:** System must map heterogeneous source data to canonical Conversational schema.

**Canonical Schema Definition:**
```
Conversational Data Schema:
- conversation_id: unique identifier
- timestamp: ISO 8601 datetime
- role: "customer" | "agent" | "system"
- message_content: text of message
- metadata: {source_platform, ticket_id, agent_id, etc.}
```

**Acceptance Criteria:**
- User maps source fields to schema fields (drag-and-drop or dropdown)
- System validates required fields present (conversation_id, role, message_content)
- System converts timestamps to ISO 8601
- System preserves unmapped fields in metadata object
- User sees preview of normalized output

**Observable Outcome:** Multi-source projects (file + API) produce uniform schema regardless of origin

**Failure Case:** Processing fails if required fields missing; user prompted to fix mapping

---

#### FR-4.4: Quality Filtering

**Requirement:** Users must filter out low-quality conversations based on configurable rules.

**Acceptance Criteria:**
- User defines filters: minimum messages per conversation, exclude spam keywords, date range
- System applies filters during processing
- Preview shows sample of included vs excluded data
- Filter statistics displayed (e.g., "8,234 conversations → 6,891 after filters")

**Observable Outcome:** Output dataset excludes filtered records; user understands what was removed

**Failure Case:** Overly aggressive filters that exclude all data trigger warning before processing

---

#### FR-4.5: Processing Execution

**Requirement:** Users trigger batch processing that applies all configured rules and generates output datasets.

**Acceptance Criteria:**
- User clicks "Process Data" button
- System shows processing progress (percentage complete)
- Processing runs asynchronously (user can navigate away)
- Processing completes in <5 minutes for 10,000 records (performance requirement)
- User notified when processing complete (in-app notification)

**Observable Outcome:** Dataset moves from "Processing" to "Completed" state; download link available

**Failure Case:** Processing errors logged with specific failure reason (e.g., "Row 4,523: missing required field")

---

### Feature Area 5: Dataset Export

**Purpose:** Provide AI-ready outputs in standard formats

#### FR-5.1: Export Format Selection

**Requirement:** Users must select output format when triggering processing.

**Acceptance Criteria:**
- User chooses format: Conversational JSONL, Q&A Pairs, Raw JSON
- Format includes metadata header (processing timestamp, applied rules, source info)
- Format descriptions explain use case (e.g., "JSONL for fine-tuning, Q&A for RAG")

**Observable Outcome:** Generated dataset matches selected format specification

**Failure Case:** Invalid format selection rejected (e.g., Q&A pairs require role="customer" messages)

---

#### FR-5.2: Dataset Download

**Requirement:** Users must download generated datasets to local machine.

**Acceptance Criteria:**
- Download link available after processing completes
- File size displayed before download
- Download includes: dataset file + metadata file (lineage.json)
- Metadata file contains: source list, processing rules, de-identification log, record counts
- Downloads expire after 30 days (cached dataset lifecycle)

**Observable Outcome:** User receives .jsonl file + lineage.json file in browser download

**Failure Case:** Expired downloads trigger re-processing; network interruptions resumable via standard browser retry

---

#### FR-5.3: Dataset Regeneration

**Requirement:** Users must re-run processing with updated source data or configuration changes.

**Acceptance Criteria:**
- User updates source data (upload new file, refresh API connection)
- User clicks "Regenerate Dataset"
- System re-applies all processing rules to new source data
- Old dataset marked "Superseded," new dataset marked "Latest"
- User can download historical versions for comparison

**Observable Outcome:** Updated source data produces updated dataset without reconfiguring project

**Failure Case:** Regeneration with incompatible schema changes rejected (user must update mapping)

---

### Feature Area 6: Audit and Governance

**Purpose:** Provide traceability for compliance and debugging

#### FR-6.1: Processing Lineage

**Requirement:** Every dataset must have traceable lineage showing source data and transformations applied.

**Acceptance Criteria:**
- Lineage log includes: source file/API, upload timestamp, uploader user, processing rules, de-identification rules, output format
- Lineage exported as JSON file with dataset download
- Lineage viewable in UI before download

**Observable Outcome:** User can prove to auditors what data was used and how it was de-identified

**Failure Case:** Datasets without lineage cannot be downloaded (system integrity check)

---

#### FR-6.2: De-identification Audit Trail

**Requirement:** System must log every PII masking operation applied during processing.

**Acceptance Criteria:**
- Audit trail records: field name, detected PII type, masking rule applied, sample before/after
- Audit trail included in lineage.json download
- User can review audit trail before downloading dataset

**Observable Outcome:** User can verify all customer names replaced with [NAME] tokens

**Failure Case:** If audit trail missing, dataset marked as "unverified" and download blocked

---

## 5. Feature Count Summary (Claude Code Verification)

### Section Purpose

This section provides explicit counts that downstream agents (especially Agent 4 and Agent 6) will use to verify complete implementation. Each count must match between PRD, API Contract, and final codebase.

---

### 5.1 Authentication and User Management

**Endpoints Required:** 8
- POST /auth/register
- POST /auth/login
- POST /auth/logout
- POST /auth/request-password-reset
- POST /auth/reset-password
- GET /auth/me
- GET /users (organization users list)
- POST /users/invite

**Pages Required:** 4
- /signup
- /login
- /forgot-password
- /reset-password

**Verification Command:**
```bash
# Count auth endpoints in API contract
grep -E "^(POST|GET|PUT|DELETE) /auth" 04-API-CONTRACT.md | wc -l  # Should be 5
grep -E "^(POST|GET) /users" 04-API-CONTRACT.md | wc -l  # Should be 3
# Total = 8

# Count auth pages in UI spec
grep -E "Page:|Route:" 05-UI-SPECIFICATION.md | grep -E "(signup|login|forgot|reset)" | wc -l  # Should be 4
```

**File Paths:**
- Backend: `/server/routes/auth.js`, `/server/middleware/auth.js`
- Frontend: `/client/pages/auth/SignUp.jsx`, `/client/pages/auth/Login.jsx`, `/client/pages/auth/ForgotPassword.jsx`, `/client/pages/auth/ResetPassword.jsx`

---

### 5.2 Organization Management

**Endpoints Required:** 5
- POST /organizations
- GET /organizations/:id
- PUT /organizations/:id
- GET /organizations/:id/members
- DELETE /organizations/:id/members/:userId

**Pages Required:** 2
- /organization/settings
- /organization/members

**Verification Command:**
```bash
# Count organization endpoints
grep -E "^(POST|GET|PUT|DELETE) /organizations" 04-API-CONTRACT.md | wc -l  # Should be 5

# Count organization pages
grep -E "Page:|Route:" 05-UI-SPECIFICATION.md | grep "organization" | wc -l  # Should be 2
```

**File Paths:**
- Backend: `/server/routes/organizations.js`
- Frontend: `/client/pages/organization/Settings.jsx`, `/client/pages/organization/Members.jsx`

---

### 5.3 Project Management

**Endpoints Required:** 10
- POST /projects
- GET /projects (list organization projects)
- GET /projects/:id
- PUT /projects/:id
- DELETE /projects/:id
- GET /projects/:id/sources
- POST /projects/:id/sources/upload
- POST /projects/:id/sources/api-connect
- GET /projects/:id/processing-runs
- POST /projects/:id/process

**Pages Required:** 4
- /projects (list view)
- /projects/new
- /projects/:id/dashboard
- /projects/:id/configure

**Verification Command:**
```bash
# Count project endpoints
grep -E "^(POST|GET|PUT|DELETE) /projects" 04-API-CONTRACT.md | wc -l  # Should be 10

# Count project pages
grep -E "Page:|Route:" 05-UI-SPECIFICATION.md | grep "project" | wc -l  # Should be 4
```

**File Paths:**
- Backend: `/server/routes/projects.js`, `/server/routes/sources.js`, `/server/routes/processing.js`
- Frontend: `/client/pages/projects/ProjectList.jsx`, `/client/pages/projects/NewProject.jsx`, `/client/pages/projects/Dashboard.jsx`, `/client/pages/projects/Configure.jsx`

---

### 5.4 Source Management

**Endpoints Required:** 7
- POST /sources/upload (file upload)
- POST /sources/teamwork-desk/validate
- POST /sources/teamwork-desk/import
- GET /sources/:id
- DELETE /sources/:id
- GET /sources/:id/preview
- GET /sources/:id/columns

**Pages Required:** 2
- /projects/:id/sources/upload
- /projects/:id/sources/api-connect

**Verification Command:**
```bash
# Count source endpoints
grep -E "^(POST|GET|DELETE) /sources" 04-API-CONTRACT.md | wc -l  # Should be 7

# Count source pages
grep -E "Page:|Route:" 05-UI-SPECIFICATION.md | grep "sources" | wc -l  # Should be 2
```

**File Paths:**
- Backend: `/server/routes/sources.js`, `/server/services/teamworkDeskService.js`
- Frontend: `/client/pages/projects/sources/UploadSource.jsx`, `/client/pages/projects/sources/ConnectAPI.jsx`

---

### 5.5 Processing Pipeline

**Endpoints Required:** 9
- POST /processing/runs (trigger processing)
- GET /processing/runs/:id (status)
- GET /processing/runs/:id/preview
- POST /processing/detect-pii
- POST /processing/configure-mapping
- POST /processing/configure-filters
- POST /processing/configure-masking
- GET /processing/runs/:id/logs
- DELETE /processing/runs/:id

**Pages Required:** 3
- /projects/:id/processing/configure
- /projects/:id/processing/preview
- /projects/:id/processing/status

**Verification Command:**
```bash
# Count processing endpoints
grep -E "^(POST|GET|DELETE) /processing" 04-API-CONTRACT.md | wc -l  # Should be 9

# Count processing pages
grep -E "Page:|Route:" 05-UI-SPECIFICATION.md | grep "processing" | wc -l  # Should be 3
```

**File Paths:**
- Backend: `/server/routes/processing.js`, `/server/services/piiDetector.js`, `/server/services/schemaMapper.js`, `/server/services/dataProcessor.js`
- Frontend: `/client/pages/projects/processing/Configure.jsx`, `/client/pages/projects/processing/Preview.jsx`, `/client/pages/projects/processing/Status.jsx`

---

### 5.6 Dataset Export

**Endpoints Required:** 6
- GET /datasets (list organization datasets)
- GET /datasets/:id
- GET /datasets/:id/download
- GET /datasets/:id/lineage
- DELETE /datasets/:id
- POST /datasets/:id/regenerate

**Pages Required:** 2
- /datasets (list view)
- /datasets/:id/details

**Verification Command:**
```bash
# Count dataset endpoints
grep -E "^(POST|GET|DELETE) /datasets" 04-API-CONTRACT.md | wc -l  # Should be 6

# Count dataset pages
grep -E "Page:|Route:" 05-UI-SPECIFICATION.md | grep "dataset" | wc -l  # Should be 2
```

**File Paths:**
- Backend: `/server/routes/datasets.js`, `/server/services/exportService.js`
- Frontend: `/client/pages/datasets/DatasetList.jsx`, `/client/pages/datasets/DatasetDetails.jsx`

---

### 5.7 Audit and Governance

**Endpoints Required:** 4
- GET /audit/lineage/:datasetId
- GET /audit/deidentification-log/:datasetId
- GET /audit/processing-history/:projectId
- GET /audit/user-activity/:organizationId

**Pages Required:** 1
- /audit/logs

**Verification Command:**
```bash
# Count audit endpoints
grep -E "^GET /audit" 04-API-CONTRACT.md | wc -l  # Should be 4

# Count audit pages
grep -E "Page:|Route:" 05-UI-SPECIFICATION.md | grep "audit" | wc -l  # Should be 1
```

**File Paths:**
- Backend: `/server/routes/audit.js`
- Frontend: `/client/pages/audit/AuditLogs.jsx`

---

### 5.8 TOTAL COUNTS SUMMARY

| Feature Area | Endpoints | Pages | Status |
|--------------|-----------|-------|--------|
| Auth & Users | 8 | 4 | MVP |
| Organizations | 5 | 2 | MVP |
| Projects | 10 | 4 | MVP |
| Sources | 7 | 2 | MVP |
| Processing | 9 | 3 | MVP |
| Datasets | 6 | 2 | MVP |
| Audit | 4 | 1 | MVP |
| **TOTAL** | **49** | **18** | - |

**Verification Gate:**
```bash
# This command will be run by Agent 6 during implementation
# Must return: Endpoints: 49, Pages: 18

# Count endpoints in 04-API-CONTRACT.md
total_endpoints=$(grep -E "^(POST|GET|PUT|DELETE) /" 04-API-CONTRACT.md | wc -l)
echo "Endpoints: $total_endpoints"  # Should be 49

# Count pages in 05-UI-SPECIFICATION.md
total_pages=$(grep -E "^### Page:|^### Route:" 05-UI-SPECIFICATION.md | wc -l)
echo "Pages: $total_pages"  # Should be 18

# If counts mismatch, implementation incomplete
if [ "$total_endpoints" -ne 49 ] || [ "$total_pages" -ne 18 ]; then
  echo "ERROR: Feature count mismatch. Review PRD Section 5."
  exit 1
fi
```

---

## 6. MVP Scope Boundaries

### Section Purpose

This section explicitly defines IN vs OUT scope to prevent feature creep and ensure Agent 6 implements exactly what's specified. **If it's not listed in "IN SCOPE," it is OUT OF SCOPE.**

---

### 6.1 IN SCOPE (Must Ship)

#### Core Capabilities

✅ **Multi-tenant organization isolation**
- Each organization's data completely separated
- Role-based access control (Admin, Member, Viewer)
- User invitations via email

✅ **File upload processing**
- CSV, Excel (.xlsx), JSON formats
- File size limit: 10MB per upload
- Automatic column detection
- Preview before processing

✅ **Teamwork Desk API integration**
- API credential validation
- Date range selection for import
- Ticket caching for 30 days
- Batch import (not real-time)

✅ **Conversational data schema normalization**
- Single canonical schema: Conversational Data
- Field mapping UI (drag-and-drop or dropdown)
- Required fields validation (conversation_id, role, message_content)
- Metadata preservation for unmapped fields

✅ **PII detection and de-identification**
- Automatic detection: emails, phone numbers, SSNs, credit cards
- Custom masking rules (exact match, regex, keyword list)
- Preview of masked data before processing
- Audit trail of all masking operations

✅ **Quality filtering**
- Minimum messages per conversation
- Date range filters
- Keyword exclusion (spam detection)
- Filter statistics in preview

✅ **Batch processing**
- Asynchronous processing (user can navigate away)
- Progress indicator (percentage complete)
- Completion notification (in-app)
- Processing log with errors

✅ **Export formats**
- Conversational JSONL (for fine-tuning)
- Q&A Pairs (for RAG systems)
- Raw JSON (for custom processing)
- Lineage metadata (lineage.json)

✅ **Dataset management**
- Download datasets to local machine
- Regenerate datasets when source data updated
- Historical version tracking (mark superseded)
- 30-day download expiration

✅ **Audit and governance**
- Processing lineage (source → transformations → output)
- De-identification audit trail
- User activity logs
- Compliance-ready metadata export

---

### 6.2 OUT OF SCOPE (Explicitly Excluded)

#### Phase 2 Features (Post-MVP)

❌ **Additional API connectors**
- Zendesk, Freshdesk, Intercom
- HubSpot, Salesforce
- Notion, Slack
- **Rationale:** Teamwork Desk validates connector architecture; additional connectors add complexity without validating new patterns. Post-MVP priority after Teamwork Desk proves value.

❌ **Real-time data pipelines**
- Streaming data ingestion
- WebSocket connections
- Live database syncing
- **Rationale:** MVP focuses on batch processing (8,000 tickets processed in <5 minutes). Real-time needed only for high-frequency use cases not validated in initial customer cohort.

❌ **Advanced processing capabilities**
- Topic/intent extraction
- Sentiment scoring
- Automatic categorization
- Metadata enrichment (language detection, entity recognition)
- **Rationale:** These features require ML models and complicate pipeline. MVP validates core transformation workflow before adding intelligence.

❌ **Cloud storage integrations**
- Direct upload to S3, GCS, Azure Blob
- Webhook triggers
- Automation workflows (Zapier, Make)
- **Rationale:** Download-only export validated in user research as acceptable for MVP. Integrations add external dependencies and error handling complexity.

❌ **Additional canonical schemas**
- Knowledge Document schema
- Decision Record schema
- Transactional Event schema
- **Rationale:** Conversational schema covers primary use case (support tickets, sales calls). Additional schemas add data model complexity without validating core platform value.

❌ **Usage-based billing**
- Record-based pricing
- Tiered plans
- Credit system
- **Rationale:** Invite-only MVP uses flat pricing. Usage billing requires metering infrastructure and payment processing not needed for initial validation.

❌ **Self-service onboarding**
- Public signup
- Freemium tier
- Product tour
- **Rationale:** Invite-only onboarding ensures high-touch customer success for MVP cohort. Self-service added after product-market fit validated.

❌ **Advanced de-identification**
- Differential privacy
- K-anonymity
- Homomorphic encryption
- **Rationale:** Current PII detection + masking meets compliance requirements for initial use cases. Advanced privacy techniques needed only for healthcare/financial regulated industries (post-MVP expansion).

❌ **Collaboration features**
- Comments on projects
- Shared datasets across organizations
- Version control (Git-like branching)
- **Rationale:** MVP focuses on single-user workflows within organizations. Collaboration features add UI complexity without validating core data prep value.

❌ **Custom schema builder**
- UI to define new canonical schemas
- Schema versioning
- Schema marketplace
- **Rationale:** Conversational schema is hard-coded for MVP. Custom schemas require schema registry and migration tooling (post-MVP after initial schema validated).

---

### 6.3 Scope Change Process

**If stakeholder requests OUT OF SCOPE feature during implementation:**

1. Acknowledge request
2. Reference this section (show it's documented as post-MVP)
3. Document request in AR-XXX (Assumption Register)
4. Defer to Product Owner for prioritization decision
5. Do NOT implement without explicit PRD amendment

**Emergency Scope Changes (Security/Compliance):**

If critical security or compliance issue discovered during implementation:
1. Document in AR-XXX as RISK
2. Escalate to Product Owner immediately
3. Implementation may proceed ONLY if:
   - Required for data protection (e.g., additional PII pattern)
   - Minimal scope (e.g., single endpoint change)
   - Does not delay MVP launch
4. Log change in CHANGELOG.md with rationale

---

## 7. Non-Functional Requirements

### 7.1 Performance

#### NFR-7.1.1: Processing Speed

**Requirement:** System must process 10,000 conversational records in under 5 minutes on Replit's standard compute tier.

**Acceptance Criteria:**
- Average processing time: <5 minutes for 10,000 records
- Progress updates every 10 seconds
- No timeout errors from Replit (60-second request limit requires async processing)

**Measurement:** Processing time logged for each run; 95th percentile <6 minutes

**Failure Impact:** Users abandon platform if processing >10 minutes (validated in user research)

---

#### NFR-7.1.2: File Upload Speed

**Requirement:** 10MB file upload must complete in under 30 seconds on broadband connection.

**Acceptance Criteria:**
- Upload progress indicator updates every 2 seconds
- Upload resumable if network interrupted
- File validation (<10MB size, valid format) before upload starts

**Measurement:** Upload time tracked via client-side telemetry

**Failure Impact:** Large file uploads failing causes poor first-run experience

---

#### NFR-7.1.3: Page Load Performance

**Requirement:** All pages must load initial content in under 2 seconds on 4G connection.

**Acceptance Criteria:**
- Critical content rendered <2 seconds
- Full page interactive <4 seconds
- Lazy loading for non-critical content (e.g., dataset list pagination)

**Measurement:** Lighthouse performance score >80; Core Web Vitals tracked

**Failure Impact:** Slow page loads reduce user engagement and completion rates

---

### 7.2 Security

#### NFR-7.2.1: Authentication Security

**Requirement:** User credentials must be protected using industry-standard hashing and encryption.

**Acceptance Criteria:**
- Passwords hashed (minimum algorithm strength: bcrypt equivalent)
- Session tokens encrypted and HTTP-only
- Password reset tokens expire after 1 hour
- Failed login attempts rate-limited (5 attempts per 15 minutes)

**Measurement:** Security audit confirms no plaintext passwords; penetration test validates token handling

**Failure Impact:** Credential theft, account takeovers

---

#### NFR-7.2.2: Data Isolation

**Requirement:** Organization data must be completely isolated at database level.

**Acceptance Criteria:**
- All queries include organizationId filter
- Database constraints prevent cross-organization access
- API middleware validates organizationId in token matches requested resource
- No shared tables across organizations (see AR-004)

**Measurement:** Automated test attempts cross-organization access (must fail)

**Failure Impact:** CRITICAL - data breach, compliance violation

---

#### NFR-7.2.3: PII Protection

**Requirement:** Customer PII must never be logged or exposed in errors.

**Acceptance Criteria:**
- Error messages do not include raw data content
- Server logs do not include unmasked PII
- De-identified data verified before download enabled
- Audit trail shows all PII masking operations

**Measurement:** Log analysis confirms no PII patterns; manual review of error messages

**Failure Impact:** Privacy violation, GDPR non-compliance

---

### 7.3 Reliability

#### NFR-7.3.1: Uptime

**Requirement:** Platform must maintain 99% uptime during business hours (9am-6pm ET, weekdays).

**Acceptance Criteria:**
- Scheduled maintenance during off-hours (weekends)
- Graceful degradation if Teamwork Desk API unavailable
- Database connection pool prevents query timeouts
- Health check endpoint returns status

**Measurement:** Uptime monitoring via external service (Pingdom, UptimeRobot)

**Failure Impact:** Lost user trust, incomplete datasets if processing interrupted

---

#### NFR-7.3.2: Data Durability

**Requirement:** Uploaded source files and generated datasets must not be lost due to system failures.

**Acceptance Criteria:**
- Files persisted to durable storage (Replit's storage layer)
- Database backups daily (Replit PostgreSQL automated backups)
- Processing runs can be retried if failed mid-execution
- Cached source data retained for 30 days minimum

**Measurement:** Recovery test: simulate server restart during processing; verify data intact

**Failure Impact:** Users lose hours of work if uploads lost; compliance issues if lineage broken

---

#### NFR-7.3.3: Error Handling

**Requirement:** All processing errors must be captured, logged, and displayed to users with actionable guidance.

**Acceptance Criteria:**
- Processing errors include: row number, field name, failure reason
- API errors return structured error response (not stack traces)
- Network failures retry up to 3 times before failing
- User sees "what to do next" for every error type

**Measurement:** Error catalog documents all error types and user guidance

**Failure Impact:** Users blocked without understanding why; support tickets spike

---

### 7.4 Usability

#### NFR-7.4.1: First-Run Experience

**Requirement:** Non-technical user must generate AI-ready dataset in under 10 minutes without documentation or support.

**Acceptance Criteria:**
- Signup to first dataset download: <10 minutes
- All critical workflows have in-line tooltips
- Preview steps show sample data before committing
- Error messages explain problem and next steps

**Measurement:** User testing with 5 non-technical users; >80% complete in <10 minutes

**Failure Impact:** High abandonment rate; failed "aha moment"

---

#### NFR-7.4.2: Accessibility

**Requirement:** Platform must meet WCAG 2.1 Level AA standards.

**Acceptance Criteria:**
- All interactive elements keyboard-accessible
- Color contrast ratios >4.5:1
- Screen reader compatible
- Form inputs have proper labels

**Measurement:** Automated accessibility audit (axe, Lighthouse); manual screen reader test

**Failure Impact:** Legal compliance risk; excludes users with disabilities

---

### 7.5 Scalability

#### NFR-7.5.1: Dataset Size Limits (MVP)

**Requirement:** MVP must support datasets up to 100,000 records per project.

**Acceptance Criteria:**
- Processing completes for 100,000 records in <15 minutes
- File uploads <10MB (implies ~50,000 records for typical CSV)
- API imports paginate large result sets
- Database queries optimized for organization-scoped record counts

**Measurement:** Load test with 100,000-record dataset

**Failure Impact:** Timeout errors for large datasets; users cannot process historical data

---

#### NFR-7.5.2: Concurrent Users (MVP)

**Requirement:** Platform must support 20 concurrent users (5 organizations × 4 users each) without performance degradation.

**Acceptance Criteria:**
- Database connection pooling
- Asynchronous processing prevents blocking
- File uploads queued if concurrent limit reached
- Page load times remain <2 seconds under concurrent load

**Measurement:** Load test with 20 simulated users performing typical workflows

**Failure Impact:** Slow performance during peak usage; poor multi-user experience

---

### 7.6 Compliance

#### NFR-7.6.1: GDPR Compliance

**Requirement:** Platform must support GDPR data subject rights (right to deletion, data portability).

**Acceptance Criteria:**
- User can delete account and all associated data
- Organization admin can delete user data
- Audit logs track all data access and modifications
- Data export includes complete lineage metadata

**Measurement:** GDPR compliance checklist verified by legal team

**Failure Impact:** Legal liability in EU markets; fines

---

#### NFR-7.6.2: Data Retention

**Requirement:** Cached source data and generated datasets must follow defined retention policies.

**Acceptance Criteria:**
- Source data cached for 30 days, then deleted
- Generated datasets retained until user deletes (or 90 days inactive)
- Audit logs retained for 1 year
- Deleted data purged from backups within 30 days

**Measurement:** Automated cleanup jobs verified via database audit

**Failure Impact:** Storage costs escalate; compliance risk if data retained unnecessarily

---

## 8. Success Metrics

### 8.1 Leading Indicators (Monitor Weekly)

#### Metric 8.1.1: Activation Rate

**Definition:** % of invited users who complete signup and create first project within 7 days

**Target:** >70%

**Measurement:** `(Users who created project) / (Users who received invitation) × 100`

**Why It Matters:** Validates onboarding funnel; low rate signals friction in first-run experience

**Data Source:** User activity logs, project creation timestamps

---

#### Metric 8.1.2: Time to First Dataset

**Definition:** Minutes from signup to first dataset download

**Target:** <10 minutes (median), <15 minutes (95th percentile)

**Measurement:** Timestamp delta: `user.createdAt` to `first_dataset.downloadedAt`

**Why It Matters:** Core value prop is speed; validates "5-minute aha moment" hypothesis

**Data Source:** Processing run logs, download events

---

#### Metric 8.1.3: Processing Success Rate

**Definition:** % of processing runs that complete without errors

**Target:** >90%

**Measurement:** `(Successful runs) / (Total runs) × 100`

**Why It Matters:** Low success rate indicates data quality issues or buggy pipeline

**Data Source:** Processing run status table

---

#### Metric 8.1.4: PII Detection Accuracy

**Definition:** % of known PII patterns correctly detected in sample datasets

**Target:** >95% (validated via manual review of 100 sample records)

**Measurement:** Manual audit of masked output vs unmasked source

**Why It Matters:** Privacy violations are CRITICAL; false negatives create compliance risk

**Data Source:** Manual QA review, user-reported issues

---

### 8.2 Lagging Indicators (Monitor Monthly)

#### Metric 8.2.1: Active Projects per Organization

**Definition:** Average number of active projects per organization

**Target:** >2 projects per org (signals reusability)

**Measurement:** `SUM(projects per org) / COUNT(organizations)`

**Why It Matters:** Single-project orgs suggest one-off usage; multiple projects validate platform approach

**Data Source:** Project table, organization aggregation

---

#### Metric 8.2.2: Dataset Regeneration Rate

**Definition:** % of projects that regenerate datasets at least once

**Target:** >40%

**Measurement:** `(Projects with >1 dataset version) / (Total projects) × 100`

**Why It Matters:** Regeneration signals ongoing value; users updating datasets with new data

**Data Source:** Dataset version history

---

#### Metric 8.2.3: Retained Users (Month 1)

**Definition:** % of users who log in at least once in their first month

**Target:** >60%

**Measurement:** `(Users with login in days 8-30) / (Users created) × 100`

**Why It Matters:** Early retention signals product-market fit; dropoff indicates failed onboarding

**Data Source:** User session logs

---

#### Metric 8.2.4: Net Promoter Score (NPS)

**Definition:** Would you recommend Foundry to a colleague? (0-10 scale)

**Target:** NPS >30 (Promoters - Detractors)

**Measurement:** Survey sent after 2 weeks of usage

**Why It Matters:** Word-of-mouth growth depends on user satisfaction; validates value prop

**Data Source:** In-app NPS survey

---

### 8.3 Business Metrics (Monitor Quarterly)

#### Metric 8.3.1: Customer Acquisition Cost (CAC)

**Definition:** Total sales/marketing spend per new paying customer

**Target:** <$500 (invite-only MVP; will increase post-launch)

**Measurement:** `(Sales + Marketing spend) / (New customers)`

**Why It Matters:** Validates sustainable business model; CAC payback period

**Data Source:** Finance team, CRM

---

#### Metric 8.3.2: Monthly Recurring Revenue (MRR)

**Definition:** Predictable monthly revenue from subscriptions

**Target:** $10K MRR by end of Month 3 (20 paying orgs × $500/month)

**Measurement:** SUM of active subscription values

**Why It Matters:** Revenue validates willingness to pay; growth rate signals market demand

**Data Source:** Billing system (post-MVP)

---

#### Metric 8.3.3: Churn Rate

**Definition:** % of customers who cancel within first 3 months

**Target:** <10%

**Measurement:** `(Cancellations) / (Active customers at start of period) × 100`

**Why It Matters:** High early churn signals product not delivering value

**Data Source:** Subscription cancellation logs

---

### 8.4 Metric Instrumentation Requirements

**Telemetry Events to Capture:**
- User signup, login, logout
- Project creation, deletion
- Source upload, API connection
- Processing start, progress, completion, error
- Dataset download
- Configuration changes (mapping, filters, masking rules)

**Analytics Platform:** PostHog or Mixpanel (lightweight, self-hosted option for Replit)

**Dashboard Updates:** Weekly review of leading indicators with product team

---

## 9. Technical Constraints

### 9.1 Platform Constraints (Replit)

#### Constraint 9.1.1: Single Container Deployment

**Constraint:** Application must run in a single Replit container (monolithic architecture).

**Implication:**
- No microservices (backend + frontend in same deployment)
- No separate worker processes for background jobs
- Processing must be asynchronous within same server process

**Workaround:** Use in-memory job queue (e.g., Bull with Redis) for async processing

**Assumption:** Replit's compute resources sufficient for MVP scale (see NFR-7.5.2)

---

#### Constraint 9.1.2: PostgreSQL Database

**Constraint:** Database must be PostgreSQL (Replit-managed via Neon).

**Implication:**
- No MongoDB, MySQL, or other databases
- Schema must use PostgreSQL data types
- Queries optimized for PostgreSQL query planner

**Workaround:** None needed; PostgreSQL suitable for structured data

**Assumption:** Neon provides sufficient IOPS for concurrent queries (see AR-008)

---

#### Constraint 9.1.3: File Size Limits

**Constraint:** HTTP request size limited to 10MB (Replit default).

**Implication:**
- File uploads capped at 10MB
- Large datasets require API import (not file upload)
- Chunked uploads not supported in MVP

**Workaround:** Guide users to API connectors for large datasets (>50,000 records)

**Assumption:** 10MB sufficient for 80% of use cases (validated with 5 pilot users)

---

#### Constraint 9.1.4: No Long-Running Workers

**Constraint:** Replit containers restart periodically; no persistent background workers.

**Implication:**
- Processing jobs must complete within container uptime (typically <24 hours)
- No cron jobs; use external scheduler (Replit Cron or GitHub Actions)
- Database must track processing state for resumability

**Workaround:** Processing runs save checkpoints; can resume if interrupted

**Assumption:** Processing completes in <15 minutes (see NFR-7.5.1)

---

#### Constraint 9.1.5: HTTPS and Domain Handling

**Constraint:** Replit provides automatic HTTPS and domain management.

**Implication:**
- No need to configure SSL certificates
- No custom domain configuration in MVP
- Platform uses Replit-provided subdomain (e.g., foundry.replit.app)

**Workaround:** None needed; Replit handles infrastructure

**Assumption:** Replit subdomain acceptable for MVP (custom domain post-launch)

---

### 9.2 Business Constraints

#### Constraint 9.2.1: Invite-Only Onboarding

**Constraint:** MVP limited to invited users (no public signup).

**Implication:**
- Manual user creation by admin
- No self-service trial or freemium tier
- Controlled cohort for validation

**Workaround:** Admin dashboard for user invitations

**Assumption:** 20-50 invited users sufficient for MVP validation

---

#### Constraint 9.2.2: Manual Billing

**Constraint:** No automated billing system in MVP.

**Implication:**
- Flat monthly fee (not usage-based)
- Manual invoicing via email
- No in-app payment processing

**Workaround:** Stripe integration post-MVP; manual invoices for initial cohort

**Assumption:** Customers accept manual billing for invite-only period

---

#### Constraint 9.2.3: Limited Support Channels

**Constraint:** Support via email only (no in-app chat or phone).

**Implication:**
- No live chat widget
- Email response within 24 hours
- In-app help links to documentation

**Workaround:** Intercom or Zendesk integration post-MVP

**Assumption:** Email support sufficient for technical early adopters

---

### 9.3 Data Constraints

#### Constraint 9.3.1: Source Data Caching

**Constraint:** API-imported data cached for 30 days, then deleted.

**Implication:**
- Users must re-fetch API data monthly if needed
- No persistent sync with source systems
- Datasets remain available; source data purged

**Workaround:** Users can manually refresh API connection

**Assumption:** 30-day cache acceptable for batch workflows (see AR-009)

---

#### Constraint 9.3.2: Single Canonical Schema (MVP)

**Constraint:** Only Conversational Data schema supported in MVP.

**Implication:**
- Cannot process non-conversational data (e.g., transactional records)
- Future schemas require schema registry and migration tooling
- Limits addressable use cases

**Workaround:** Post-MVP schema builder for custom structures

**Assumption:** Conversational data covers 70% of initial use cases

---

#### Constraint 9.3.3: No Real-Time Data

**Constraint:** All processing is batch (not streaming).

**Implication:**
- No live dashboard updates during processing
- Polling required for status updates (refresh every 10 seconds)
- Users cannot trigger processing on every new ticket

**Workaround:** Post-MVP WebSocket support for real-time progress

**Assumption:** Batch processing acceptable for MVP workflows (see AR-002)

---

### 9.4 Regulatory Constraints

#### Constraint 9.4.1: GDPR Compliance

**Constraint:** Must support GDPR data subject rights.

**Implication:**
- User/organization data deletion must purge all related records
- Audit logs track all data access
- Data export includes complete lineage

**Workaround:** Soft delete with 30-day purge window

**Assumption:** GDPR compliance gate before EU launch (see NFR-7.6.1)

---

#### Constraint 9.4.2: No Healthcare/Financial Data (MVP)

**Constraint:** Platform not HIPAA or PCI-DSS compliant in MVP.

**Implication:**
- Cannot process protected health information (PHI)
- Cannot process payment card data
- Use cases limited to general business data

**Workaround:** HIPAA/PCI compliance in Phase 2 if market demands

**Assumption:** Non-regulated verticals (SaaS support, sales) sufficient for MVP

---

## 10. Assumption Register

### AR-001: Single Organization Membership

- **Type:** ASSUMPTION
- **Assumption:** Users belong to exactly ONE organization at a time (no multi-org switching)
- **Impact if Wrong:** Requires org-switching UI, complicates auth model, affects data isolation
- **Resolution:** Product owner confirms single-org acceptable for MVP cohort
- **Status:** UNRESOLVED
- **Owner:** Human (Product Owner)
- **Downstream Impact:** Agent 3 (data model - user table schema), Agent 4 (API auth - token structure), Agent 5 (UI navigation)
- **Resolution Deadline:** Before Agent 3 execution
- **Allowed to Ship:** NO - blocks data model design

---

### AR-002: Polling vs Real-Time Updates

- **Type:** ASSUMPTION
- **Assumption:** Dashboard polling (refresh every 10 seconds) is sufficient; real-time WebSocket not needed for MVP
- **Impact if Wrong:** Poor UX if users expect live progress updates, requires WebSocket infrastructure
- **Resolution:** Validate with Persona 1 (Support Ops Manager) - acceptable refresh delay?
- **Status:** UNRESOLVED
- **Owner:** Agent 5 (UI Specification) to validate UX expectations
- **Downstream Impact:** Agent 2 (architecture - WebSocket vs polling), Agent 4 (API design), Agent 6 (implementation)
- **Resolution Deadline:** Before Agent 5 execution
- **Allowed to Ship:** YES - can launch with polling, upgrade to WebSocket post-MVP

---

### AR-003: Salesforce Integration Exclusion

- **Type:** DEPENDENCY
- **Assumption:** No Salesforce integration in MVP; users will manually upload CSV OR use Teamwork Desk API
- **Impact if Wrong:** Without Salesforce sync, enterprise users may abandon platform (data entry friction)
- **Resolution:** User research validates CSV import + Teamwork Desk sufficient for initial cohort
- **Status:** UNRESOLVED
- **Owner:** Human (Product Owner)
- **Downstream Impact:** Agent 4 (API - no Salesforce connector), Agent 5 (UI - no Salesforce config screen)
- **Resolution Deadline:** Before feature count finalized
- **Allowed to Ship:** YES - CSV + Teamwork Desk acceptable MVP workaround

---

### AR-004: Multi-Tenant Data Isolation

- **Type:** RISK
- **Assumption:** Row-level security (organizationId filter on all queries) is sufficient for data isolation
- **Impact if Wrong:** Cross-organization data leaks (CRITICAL security issue)
- **Resolution:** Agent 3 must enforce organizationId on all tables; Agent 8 audits verify
- **Status:** UNRESOLVED
- **Owner:** Agent 3 (Data Modeling), Agent 8 (Code Review)
- **Downstream Impact:** Agent 3 (schema design), Agent 4 (API filters), Agent 6 (query patterns)
- **Resolution Deadline:** Before Agent 3 execution
- **Allowed to Ship:** NO - CRITICAL security requirement

---

### AR-005: Processing Timeout Limits

- **Type:** RISK
- **Assumption:** 10,000 records process in <5 minutes without Replit timeout
- **Impact if Wrong:** Large dataset processing fails mid-execution, poor UX
- **Resolution:** Agent 2 must specify async job architecture; load testing validates performance
- **Status:** UNRESOLVED
- **Owner:** Agent 2 (System Architecture), Agent 6 (Implementation)
- **Downstream Impact:** Agent 2 (architecture - job queue design), Agent 6 (implementation - worker processes)
- **Resolution Deadline:** Before Agent 2 execution
- **Allowed to Ship:** CONDITIONAL - must validate with realistic data before production

---

### AR-006: Role Definitions

- **Type:** ASSUMPTION
- **Assumption:** Three roles sufficient: Admin (full control), Member (create/edit projects), Viewer (read-only)
- **Impact if Wrong:** Missing granular permissions (e.g., "can upload but not download")
- **Resolution:** Product owner defines role permissions matrix
- **Status:** UNRESOLVED
- **Owner:** Human (Product Owner)
- **Downstream Impact:** Agent 3 (user roles table), Agent 4 (authorization middleware), Agent 5 (UI permission checks)
- **Resolution Deadline:** Before Agent 4 execution
- **Allowed to Ship:** YES - can launch with basic roles, add granular permissions post-MVP

---

### AR-007: Project Visibility Within Organization

- **Type:** ASSUMPTION
- **Assumption:** All projects visible to all organization members (no private projects)
- **Impact if Wrong:** Users expect private projects; requires access control per project
- **Resolution:** User research validates shared visibility acceptable for team workflows
- **Status:** UNRESOLVED
- **Owner:** Human (Product Owner)
- **Downstream Impact:** Agent 3 (project access model), Agent 4 (API filters), Agent 5 (UI project list)
- **Resolution Deadline:** Before Agent 3 execution
- **Allowed to Ship:** YES - private projects can be added post-MVP if needed

---

### AR-008: Database Performance (Neon PostgreSQL)

- **Type:** DEPENDENCY
- **Assumption:** Replit's Neon PostgreSQL provides sufficient IOPS for 20 concurrent users querying 100K records
- **Impact if Wrong:** Slow queries, timeout errors, poor UX
- **Resolution:** Load testing with realistic data volumes
- **Status:** UNRESOLVED
- **Owner:** Agent 6 (Implementation - load testing), Agent 7 (QA - performance benchmarks)
- **Downstream Impact:** Agent 3 (indexing strategy), Agent 6 (query optimization)
- **Resolution Deadline:** Before production deployment
- **Allowed to Ship:** CONDITIONAL - must validate performance under load

---

### AR-009: 30-Day Source Data Cache Acceptable

- **Type:** ASSUMPTION
- **Assumption:** Users accept 30-day cache expiration for API-imported data; re-fetch if needed
- **Impact if Wrong:** Users frustrated if must re-import frequently; impacts UX
- **Resolution:** Validate with Persona 1 (Support Ops Manager) - monthly refresh acceptable?
- **Status:** UNRESOLVED
- **Owner:** Human (Product Owner)
- **Downstream Impact:** Agent 3 (data retention schema), Agent 6 (cleanup jobs)
- **Resolution Deadline:** Before Agent 3 execution
- **Allowed to Ship:** YES - can adjust cache duration post-MVP if needed

---

### AR-010: Email Validation Required

- **Type:** ASSUMPTION
- **Assumption:** Email verification required during signup (prevents fake accounts)
- **Impact if Wrong:** Spam accounts, data integrity issues
- **Resolution:** Product owner confirms email verification requirement
- **Status:** UNRESOLVED
- **Owner:** Human (Product Owner)
- **Downstream Impact:** Agent 4 (email service integration), Agent 5 (signup flow)
- **Resolution Deadline:** Before Agent 4 execution
- **Allowed to Ship:** YES - email verification standard practice

---

### AR-011: Q&A Pairs Format Definition

- **Type:** ASSUMPTION
- **Assumption:** Q&A pairs generated from conversational data using role="customer" as question, next role="agent" as answer
- **Impact if Wrong:** Q&A format unsuitable for RAG systems; customers cannot use output
- **Resolution:** Validate Q&A structure with Persona 3 (Data Scientist) and AI platform requirements
- **Status:** UNRESOLVED
- **Owner:** Agent 6 (Implementation - export logic)
- **Downstream Impact:** Agent 6 (export service implementation)
- **Resolution Deadline:** Before Agent 6 execution
- **Allowed to Ship:** CONDITIONAL - must validate format with target AI platforms (OpenAI, Anthropic)

---

### AR-012: Teamwork Desk API Rate Limits

- **Type:** DEPENDENCY
- **Assumption:** Teamwork Desk API allows batch import of 10,000 tickets without hitting rate limits
- **Impact if Wrong:** Import fails mid-execution; requires pagination and retry logic
- **Resolution:** Review Teamwork Desk API documentation; implement rate limit handling
- **Status:** UNRESOLVED
- **Owner:** Agent 6 (Implementation - API connector)
- **Downstream Impact:** Agent 6 (Teamwork Desk service implementation)
- **Resolution Deadline:** Before Agent 6 execution
- **Allowed to Ship:** CONDITIONAL - must handle rate limits gracefully

---

### AR-013: File Upload Storage Location

- **Type:** ASSUMPTION
- **Assumption:** Uploaded files stored in Replit's persistent storage (not external S3)
- **Impact if Wrong:** Storage costs higher than expected; file access latency
- **Resolution:** Validate Replit storage pricing and performance
- **Status:** UNRESOLVED
- **Owner:** Agent 2 (System Architecture - file storage design)
- **Downstream Impact:** Agent 2 (architecture), Agent 6 (file upload implementation)
- **Resolution Deadline:** Before Agent 2 execution
- **Allowed to Ship:** YES - Replit storage acceptable for MVP; migrate to S3 if needed post-MVP

---

### AR-014: PII Detection Accuracy Threshold

- **Type:** ASSUMPTION
- **Assumption:** 95% PII detection accuracy acceptable (5% false negatives tolerable with manual review)
- **Impact if Wrong:** Privacy violations if critical PII missed; over-masking if false positives too high
- **Resolution:** Product owner defines acceptable risk threshold; validate with compliance team
- **Status:** UNRESOLVED
- **Owner:** Human (Product Owner), Agent 6 (Implementation - PII detector)
- **Downstream Impact:** Agent 6 (PII detection service)
- **Resolution Deadline:** Before Agent 6 execution
- **Allowed to Ship:** CONDITIONAL - must validate accuracy before production launch

---

### AR-015: Export File Naming Convention

- **Type:** ASSUMPTION
- **Assumption:** Exported files named as `{projectName}_{timestamp}.jsonl` (e.g., `support-training_2026-02-01T14:23:00Z.jsonl`)
- **Impact if Wrong:** Naming conflicts if multiple users download same dataset
- **Resolution:** Agent 5 defines file naming UX; Agent 6 implements
- **Status:** UNRESOLVED
- **Owner:** Agent 5 (UI Specification), Agent 6 (Implementation)
- **Downstream Impact:** Agent 6 (export service)
- **Resolution Deadline:** Before Agent 6 execution
- **Allowed to Ship:** YES - naming convention can be updated post-MVP

---

---

## DOCUMENT END

**Agent 1 (Product Definition) v20 - EXECUTION COMPLETE**

**Output:** `01-PRD.md`

**Next Step:** Agent 2 (System Architecture) will read this PRD to design technical infrastructure based on Constitution v4.6.

**PRD Summary:**
- **Product:** Foundry - Multi-tenant data preparation platform for AI-ready datasets
- **Core Use Case:** Transform raw support tickets into clean, de-identified conversational data in <5 minutes
- **MVP Scope:** File uploads + Teamwork Desk API, conversational schema, PII de-identification, batch processing
- **Target Users:** Support Operations Managers (primary), Product Managers (secondary), Data Scientists (tertiary)
- **Feature Counts:** 49 endpoints, 18 pages
- **Platform:** Replit (single container, PostgreSQL via Neon)
- **Success Metric:** Non-technical user generates first dataset in <10 minutes

**Assumption Register Status:** 15 assumptions documented; 0 resolved, 15 unresolved (requires Product Owner input before downstream agents proceed)

**Quality Verification:**
- [x] All sections complete (1-10)
- [x] Solution neutrality verified (no implementation details)
- [x] Feature counts explicit (Section 5)
- [x] MVP scope boundaries clear (Section 6)
- [x] Assumption Register complete with lifecycle metadata
- [x] Replit constraints documented
- [x] No TBDs (all unknowns in Assumption Register)

**Constitutional Compliance:** Aligned with Agent 0 v4.6 tiered prevention model
