# Database Design & Integration

<cite>
**Referenced Files in This Document**
- [schema.prisma](file://prisma/schema.prisma)
- [prisma.ts](file://lib/prisma.ts)
- [runMigrations.ts](file://lib/prisma/runMigrations.ts)
- [prisma.config.ts](file://prisma.config.ts)
- [instrumentation.ts](file://instrumentation.ts)
- [authConfig.ts](file://lib/auth/authConfig.ts)
- [xpService.ts](file://lib/xp/xpService.ts)
- [syncTopicConfigs.ts](file://lib/xp/syncTopicConfigs.ts)
- [route.ts (tasks submit)](file://app/api/tasks/submit/route.ts)
- [route.ts (XP user)](file://app/api/xp/user/route.ts)
- [types/xp.ts](file://types/xp.ts)
- [README.md](file://README.md)
- [package.json](file://package.json)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Dependency Analysis](#dependency-analysis)
7. [Performance Considerations](#performance-considerations)
8. [Troubleshooting Guide](#troubleshooting-guide)
9. [Conclusion](#conclusion)
10. [Appendices](#appendices)

## Introduction
This document explains the database integration built with Prisma ORM and PostgreSQL, focusing on the entity relationship model, table schemas, data modeling decisions, and operational patterns. It covers how Prisma models map to TypeScript interfaces, repository-style service abstractions, transaction management, migration strategies, schema evolution, and performance considerations such as indexing and query optimization. It also outlines integration points with authentication and XP calculation APIs.

## Project Structure
The database layer centers around:
- Prisma schema defining models, enums, relations, and indexes
- A Prisma client configured with a PostgreSQL adapter and connection pooling
- Startup hooks that run migrations and synchronize topic configurations
- Services implementing XP and task submission logic with transactions
- API routes delegating to services and returning typed responses

```mermaid
graph TB
subgraph "Runtime"
INST["instrumentation.ts"]
PRISMA_CFG["prisma.config.ts"]
PRISMA_TS["lib/prisma.ts"]
RUN_MIGR["lib/prisma/runMigrations.ts"]
end
subgraph "Database"
SCHEMA["prisma/schema.prisma"]
end
subgraph "Application"
AUTH["lib/auth/authConfig.ts"]
SYNC["lib/xp/syncTopicConfigs.ts"]
XP["lib/xp/xpService.ts"]
API_TASK["app/api/tasks/submit/route.ts"]
API_XP["app/api/xp/user/route.ts"]
TYPES["types/xp.ts"]
end
INST --> RUN_MIGR
INST --> SYNC
PRISMA_CFG --> PRISMA_TS
PRISMA_TS --> AUTH
PRISMA_TS --> XP
XP --> API_TASK
XP --> API_XP
SCHEMA --> PRISMA_TS
```

**Diagram sources**
- [instrumentation.ts](file://instrumentation.ts#L1-L43)
- [prisma.config.ts](file://prisma.config.ts#L1-L19)
- [prisma.ts](file://lib/prisma.ts#L1-L29)
- [runMigrations.ts](file://lib/prisma/runMigrations.ts#L1-L69)
- [schema.prisma](file://prisma/schema.prisma#L1-L143)
- [authConfig.ts](file://lib/auth/authConfig.ts#L1-L83)
- [syncTopicConfigs.ts](file://lib/xp/syncTopicConfigs.ts#L1-L174)
- [xpService.ts](file://lib/xp/xpService.ts#L1-L795)
- [route.ts (tasks submit)](file://app/api/tasks/submit/route.ts#L1-L59)
- [route.ts (XP user)](file://app/api/xp/user/route.ts#L1-L41)
- [types/xp.ts](file://types/xp.ts#L1-L131)

**Section sources**
- [prisma.ts](file://lib/prisma.ts#L1-L29)
- [prisma.config.ts](file://prisma.config.ts#L1-L19)
- [schema.prisma](file://prisma/schema.prisma#L1-L143)
- [instrumentation.ts](file://instrumentation.ts#L1-L43)

## Core Components
- Prisma client with PostgreSQL adapter and connection pooling
- Migration runner that conditionally applies migrations or pushes schema
- XP service encapsulating business logic with Prisma transactions
- Topic configuration synchronization from content to database
- API routes delegating to services and returning typed responses

Key responsibilities:
- Client initialization and lifecycle management
- Schema evolution via migrations or db push
- Data consistency via transactions
- Typed interfaces bridging Prisma models and application types

**Section sources**
- [prisma.ts](file://lib/prisma.ts#L1-L29)
- [runMigrations.ts](file://lib/prisma/runMigrations.ts#L1-L69)
- [xpService.ts](file://lib/xp/xpService.ts#L1-L795)
- [syncTopicConfigs.ts](file://lib/xp/syncTopicConfigs.ts#L1-L174)
- [types/xp.ts](file://types/xp.ts#L1-L131)

## Architecture Overview
The system integrates Prisma ORM with Next.js runtime and API routes. Authentication uses NextAuth with Prisma adapter, while XP and task submission logic is encapsulated in a service layer that performs all database operations inside transactions.

```mermaid
sequenceDiagram
participant Client as "Client"
participant Route as "API Route"
participant Service as "XPService"
participant Prisma as "Prisma Client"
participant DB as "PostgreSQL"
Client->>Route : POST /api/tasks/submit
Route->>Route : auth()
Route->>Service : submitCorrectTask(userId, taskId, topicSlug, ...)
Service->>Prisma : $transaction(...)
Prisma->>DB : SELECT topicXpConfig WHERE topicSlug
Prisma->>DB : UPSERT/SELECT userTopicXp
Prisma->>DB : INSERT userTaskAttempt
Prisma->>DB : UPDATE userTopicXp
DB-->>Prisma : Transaction result
Prisma-->>Service : {xpResult, userXP}
Service-->>Route : Response payload
Route-->>Client : JSON response
```

**Diagram sources**
- [route.ts (tasks submit)](file://app/api/tasks/submit/route.ts#L1-L59)
- [xpService.ts](file://lib/xp/xpService.ts#L118-L293)
- [prisma.ts](file://lib/prisma.ts#L1-L29)

**Section sources**
- [authConfig.ts](file://lib/auth/authConfig.ts#L14-L14)
- [route.ts (tasks submit)](file://app/api/tasks/submit/route.ts#L1-L59)
- [xpService.ts](file://lib/xp/xpService.ts#L118-L293)

## Detailed Component Analysis

### Entity Relationship Model and Table Schemas
The schema defines five core tables with explicit mappings and indexes. Relationships are declared with foreign keys and cascading deletes.

```mermaid
erDiagram
User {
string id PK
string name
string email UK
timestamptz emailVerified
text image
enum role
timestamptz created_at
timestamptz updated_at
}
Account {
string id PK
string userId FK
string type
string provider
string providerAccountId
text refresh_token
text access_token
int expires_at
text token_type
text scope
text id_token
text session_state
timestamptz created_at
}
VerificationToken {
string identifier PK
timestamptz expires PK
string token PK
}
TopicXpConfig {
int id PK
string topicSlug UK
string topicTitle
string category
text description
string difficulty
int maxXp
int baseTaskXp
int dailyFullTasks
int dailyHalfTasks
decimal multiplierFull
decimal multiplierHalf
decimal multiplierLow
decimal multiplierEarly
int[] levelThresholds
decimal dailyXpDecay
decimal minXpPercent
int[] reviewIntervals
string[] tags
timestamptz created_at
timestamptz updated_at
}
UserTopicXp {
int id PK
string user_id FK
string topic_slug FK
int current_xp
int total_xp_earned
int level
timestamptz last_activity
int daily_tasks_count
date daily_tasks_date
int srs_stage
date next_review_date
date last_practiced_date
timestamptz created_at
}
UserTaskAttempt {
int id PK
string user_id FK
string task_id
string topic_slug FK
timestamptz completed_at
int xp_earned
bool is_correct
date next_review_date
int review_count
int mastery_level
}
User ||--o{ Account : "has"
User ||--o{ UserTopicXp : "tracked_by"
User ||--o{ UserTaskAttempt : "performed"
TopicXpConfig ||--o{ UserTopicXp : "defines"
TopicXpConfig ||--o{ UserTaskAttempt : "referenced_by"
```

Key modeling decisions:
- UUID primary keys for User and Account for secure external references
- Unique constraints on email and (provider, providerAccountId) for identity safety
- Indexes on frequently filtered columns (user/topic combinations, next review dates)
- Decimal precision for multipliers and decay factors to avoid rounding errors
- Arrays for tags and intervals to support flexible configuration

**Diagram sources**
- [schema.prisma](file://prisma/schema.prisma#L12-L143)

**Section sources**
- [schema.prisma](file://prisma/schema.prisma#L12-L143)

### Prisma Client Initialization and Adapter
The Prisma client is initialized with a PostgreSQL adapter backed by a connection pool. Environment variables configure host, port, user, password, and database name. The client is exported globally to avoid multiple instances and is configured with minimal logging.

```mermaid
flowchart TD
Start(["Initialize Prisma"]) --> Pool["Create pg.Pool from env vars"]
Pool --> Adapter["Create PrismaPg(adapter)"]
Adapter --> Client["new PrismaClient({ adapter, log })"]
Client --> Export["Export singleton prisma"]
Export --> Global["Store in globalThis for dev"]
```

**Diagram sources**
- [prisma.ts](file://lib/prisma.ts#L1-L29)

**Section sources**
- [prisma.ts](file://lib/prisma.ts#L1-L29)

### Migration Strategies and Schema Evolution
Schema evolution is handled at startup:
- Production: migrations deployed via migrate deploy
- Development: db push used when no migrations exist
- Fallback: on failure, db push is attempted in development
- Best-effort: failures are logged but do not crash the app

```mermaid
flowchart TD
A["Startup (Node runtime)"] --> B{"Has migrations dir?"}
B --> |Yes| C["npx prisma migrate deploy"]
B --> |No| D["npx prisma db push"]
C --> E["Success"]
D --> E
C --> F{"Error?"}
D --> F
F --> |Yes| G["Log warning"]
F --> |No| E
G --> H{"Development?"}
H --> |Yes| I["npx prisma db push (fallback)"]
H --> |No| J["Silently continue"]
I --> K["Log result"]
```

**Diagram sources**
- [runMigrations.ts](file://lib/prisma/runMigrations.ts#L1-L69)
- [instrumentation.ts](file://instrumentation.ts#L1-L43)

**Section sources**
- [runMigrations.ts](file://lib/prisma/runMigrations.ts#L1-L69)
- [instrumentation.ts](file://instrumentation.ts#L1-L43)

### Topic Configuration Synchronization
Topic configurations are synchronized from content files into TopicXpConfig during startup or on demand. Upserts ensure idempotent updates keyed by topicSlug.

```mermaid
sequenceDiagram
participant Boot as "instrumentation.ts"
participant Sync as "syncTopicConfigs.ts"
participant FS as "Filesystem"
participant DB as "PostgreSQL"
Boot->>Sync : syncTopicConfigs()
Sync->>FS : Read content/math/*/config.json
Sync->>DB : upsert topicXpConfig by topicSlug
DB-->>Sync : Upsert result
Sync-->>Boot : Summary stats
```

**Diagram sources**
- [instrumentation.ts](file://instrumentation.ts#L21-L42)
- [syncTopicConfigs.ts](file://lib/xp/syncTopicConfigs.ts#L1-L174)
- [schema.prisma](file://prisma/schema.prisma#L70-L97)

**Section sources**
- [README.md](file://README.md#L41-L49)
- [syncTopicConfigs.ts](file://lib/xp/syncTopicConfigs.ts#L1-L174)

### XP Service and Transaction Management
The XP service encapsulates XP calculations, SRS scheduling, and persistence. All writes are performed inside Prisma transactions to guarantee atomicity.

```mermaid
classDiagram
class XPService {
+getTopicConfig(topicSlug) TopicXPConfig?
+getUserTopicXP(userId, topicSlug) UserTopicXP?
+getUserAllTopicsXP(userId) UserTopicXP[]
+calculateXP(userId, taskId, topicSlug, ...) XPCalculationResult
+submitCorrectTask(userId, taskId, topicSlug, ...) XPCalculationResult
+saveTaskAttempt(userId, taskId, topicSlug, xpResult, isCorrect) UserTopicXP
+getTasksDueForReview(userId, topicSlug) TaskDueForReview[]
+getTopicStats(userId, topicSlug) Stats
+getTaskHistory(userId, taskId, topicSlug) UserTaskAttempt[]
+getCompletedTaskIds(userId, topicSlug) string[]
}
```

Key transactional operations:
- submitCorrectTask: reads config, ensures user topic XP exists, computes XP and SRS, persists attempt and updates user XP atomically
- saveTaskAttempt: creates or updates user XP and persists attempt in a single transaction

```mermaid
sequenceDiagram
participant API as "API Route"
participant Svc as "XPService"
participant Tx as "Prisma $transaction"
participant DB as "PostgreSQL"
API->>Svc : submitCorrectTask(userId, taskId, topicSlug, ...)
Svc->>Tx : Begin
Tx->>DB : SELECT topicXpConfig
Tx->>DB : SELECT/INSERT userTopicXp
Tx->>DB : INSERT userTaskAttempt
Tx->>DB : UPDATE userTopicXp
DB-->>Tx : Commit
Tx-->>Svc : {xpResult, userXP}
Svc-->>API : Response
```

**Diagram sources**
- [xpService.ts](file://lib/xp/xpService.ts#L118-L293)
- [route.ts (tasks submit)](file://app/api/tasks/submit/route.ts#L34-L47)

**Section sources**
- [xpService.ts](file://lib/xp/xpService.ts#L118-L293)
- [route.ts (tasks submit)](file://app/api/tasks/submit/route.ts#L1-L59)

### API Routes and Typed Interfaces
API routes delegate to services and return typed responses. TypeScript interfaces define the shape of requests, responses, and domain entities.

```mermaid
sequenceDiagram
participant Client as "Client"
participant Route as "GET /api/xp/user"
participant Svc as "XPService"
participant Types as "types/xp.ts"
Client->>Route : Request with topicSlug
Route->>Svc : getUserTopicXP, getTopicConfig, getCompletedTaskIds
Svc-->>Route : {userXP, topicConfig, completedTaskIds}
Route-->>Client : JSON {userXP, topicConfig, completedTaskIds}
```

**Diagram sources**
- [route.ts (XP user)](file://app/api/xp/user/route.ts#L1-L41)
- [types/xp.ts](file://types/xp.ts#L26-L131)
- [xpService.ts](file://lib/xp/xpService.ts#L313-L371)

**Section sources**
- [route.ts (XP user)](file://app/api/xp/user/route.ts#L1-L41)
- [types/xp.ts](file://types/xp.ts#L1-L131)

### Authentication Integration
NextAuth uses PrismaAdapter to persist sessions and user identities. The adapter leverages the same Prisma client, ensuring consistent database access.

```mermaid
sequenceDiagram
participant Client as "Browser"
participant NextAuth as "NextAuth"
participant Adapter as "PrismaAdapter"
participant Prisma as "Prisma Client"
participant DB as "PostgreSQL"
Client->>NextAuth : Sign in
NextAuth->>Adapter : Create user/session
Adapter->>Prisma : Upsert User/Account
Prisma->>DB : Persist records
DB-->>Prisma : OK
Prisma-->>Adapter : OK
Adapter-->>NextAuth : OK
NextAuth-->>Client : Session established
```

**Diagram sources**
- [authConfig.ts](file://lib/auth/authConfig.ts#L14-L14)
- [prisma.ts](file://lib/prisma.ts#L1-L29)

**Section sources**
- [authConfig.ts](file://lib/auth/authConfig.ts#L1-L83)

## Dependency Analysis
External dependencies relevant to database integration:
- @prisma/client and @prisma/adapter-pg for ORM and PostgreSQL adapter
- pg for connection pooling
- Prisma CLI for migrations and schema generation

```mermaid
graph LR
PJSON["package.json"] --> PC["@prisma/client"]
PJSON --> PP["@prisma/adapter-pg"]
PJSON --> PG["pg"]
PJSON --> PRISMA["prisma (CLI)"]
PRISMA --> CFG["prisma.config.ts"]
CFG --> SCHEMA["prisma/schema.prisma"]
PC --> LIBPRISMA["lib/prisma.ts"]
PP --> LIBPRISMA
PG --> LIBPRISMA
```

**Diagram sources**
- [package.json](file://package.json#L16-L43)
- [prisma.config.ts](file://prisma.config.ts#L1-L19)
- [schema.prisma](file://prisma/schema.prisma#L1-L143)
- [prisma.ts](file://lib/prisma.ts#L1-L29)

**Section sources**
- [package.json](file://package.json#L16-L43)

## Performance Considerations
Indexing strategy:
- Composite indexes on user-topic combinations for frequent joins
- Dedicated indexes on nextReviewDate for SRS scheduling queries
- Unique constraints on identity fields to enforce referential integrity efficiently

Query optimization:
- Use of include/select to limit fetched fields
- Aggregation queries for statistics
- Distinct and grouped queries to reduce result sets

Transaction management:
- Atomic updates for XP accumulation and SRS progression
- Upsert patterns to avoid race conditions

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
Common issues and mitigations:
- Database unreachable at startup: migrations are skipped with warnings; verify environment variables and connectivity
- Missing migrations: db push is used as a fallback in development; consider generating migrations for production
- Authentication failures: ensure PrismaAdapter is configured with the same client used elsewhere
- Slow SRS queries: confirm indexes exist on nextReviewDate and user/topic keys

Operational checks:
- Verify DATABASE_URL construction and environment variables
- Confirm Prisma client exports and global singleton behavior
- Validate API routes return proper status codes and error messages

**Section sources**
- [runMigrations.ts](file://lib/prisma/runMigrations.ts#L45-L67)
- [authConfig.ts](file://lib/auth/authConfig.ts#L14-L14)
- [schema.prisma](file://prisma/schema.prisma#L118-L141)

## Conclusion
The database integration leverages Prisma ORM with a PostgreSQL adapter, robust startup migrations, and a service-layer abstraction for XP and task operations. Transactions ensure data consistency, while indexes and careful query design support performance. The system balances flexibility (db push in development) with reliability (migrations in production) and provides clear typed interfaces between models and application logic.

[No sources needed since this section summarizes without analyzing specific files]

## Appendices

### Appendix A: Environment Variables
Required variables for database and authentication:
- Database: AUTH_DATABASE_HOST, AUTH_DATABASE_PORT, AUTH_DATABASE_NAME, AUTH_DATABASE_USER, AUTH_DATABASE_PASSWORD
- Authentication: AUTH_SECRET, provider-specific credentials
- Optional toggles: RUN_MIGRATIONS_ON_START, SYNC_TOPICS_ON_START

**Section sources**
- [README.md](file://README.md#L30-L39)
- [instrumentation.ts](file://instrumentation.ts#L12-L22)