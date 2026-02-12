# Database Design

<cite>
**Referenced Files in This Document**
- [schema.prisma](file://prisma/schema.prisma)
- [prisma.ts](file://lib/prisma.ts)
- [runMigrations.ts](file://lib/prisma/runMigrations.ts)
- [prisma.config.ts](file://prisma.config.ts)
- [xpService.ts](file://lib/xp/xpService.ts)
- [xp.ts](file://types/xp.ts)
- [syncTopicConfigs.ts](file://lib/xp/syncTopicConfigs.ts)
- [route.ts](file://app/api/tasks/submit/route.ts)
- [route.ts](file://app/api/xp/user/route.ts)
- [authConfig.ts](file://lib/auth/authConfig.ts)
- [migration.sql](file://prisma/migrations/20260124205628_init/migration.sql)
</cite>

## Update Summary
**Changes Made**
- Enhanced Prisma-based database design with improved authentication integration using NextAuth PrismaAdapter
- Updated database connection management with PrismaPg adapter and connection pooling
- Improved session management with JWT strategy and enhanced user data handling
- Optimized migration deployment strategy with better fallback mechanisms
- Enhanced XP calculation service with comprehensive SRS scheduling and anti-grind mechanics
- Added comprehensive database connection management supporting both Supavisor and direct connections

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
This document describes the database design for the XP and task tracking system. It covers the Prisma schema, entity relationships, and data models for User, TopicXpConfig, UserTopicXp, and UserTaskAttempt. It also documents the migration strategy, seed/sync mechanism, data integrity rules, XP calculation model, task attempt tracking, progress persistence, indexing strategy, and performance considerations.

**Updated** Enhanced with Prisma-based database design featuring improved authentication integration, optimized database connection management, and comprehensive XP calculation services.

## Project Structure
The database layer is defined via Prisma schema and supported by:
- Prisma client configuration with PrismaPg adapter for PostgreSQL connection pooling
- NextAuth integration with PrismaAdapter for enhanced authentication and session management
- Migration orchestration on startup with dynamic loading and fallback mechanisms
- XP service implementing XP calculations, SRS scheduling, and progress updates
- API routes invoking the XP service with authenticated user context
- Topic configuration synchronization from content files

```mermaid
graph TB
subgraph "Authentication Layer"
Auth["NextAuth with PrismaAdapter<br/>lib/auth/authConfig.ts"]
Session["JWT Session Management<br/>60-day max age"]
Providers["OAuth Providers<br/>Google, GitHub, Facebook, Resend"]
end
subgraph "Application Layer"
API_Submit["API: Submit Task<br/>app/api/tasks/submit/route.ts"]
API_XP["API: Get User XP<br/>app/api/xp/user/route.ts"]
end
subgraph "Service Layer"
XP["XPService<br/>lib/xp/xpService.ts"]
Sync["Topic Config Sync<br/>lib/xp/syncTopicConfigs.ts"]
end
subgraph "Persistence Layer"
PrismaCfg["Prisma Client & Adapter<br/>lib/prisma.ts"]
Schema["Prisma Schema<br/>prisma/schema.prisma"]
Migrations["Migration Orchestrator<br/>lib/prisma/runMigrations.ts"]
Config["Prisma Config<br/>prisma.config.ts"]
MigrationSQL["Migration SQL<br/>prisma/migrations/20260124205628_init/migration.sql"]
end
Auth --> Session
Auth --> PrismaCfg
API_Submit --> XP
API_XP --> XP
XP --> PrismaCfg
Sync --> PrismaCfg
PrismaCfg --> Schema
Migrations --> PrismaCfg
Config --> PrismaCfg
PrismaCfg --> MigrationSQL
```

**Diagram sources**
- [authConfig.ts](file://lib/auth/authConfig.ts#L1-L83)
- [route.ts](file://app/api/tasks/submit/route.ts#L1-L67)
- [route.ts](file://app/api/xp/user/route.ts#L1-L41)
- [xpService.ts](file://lib/xp/xpService.ts#L1-L902)
- [syncTopicConfigs.ts](file://lib/xp/syncTopicConfigs.ts#L1-L174)
- [prisma.ts](file://lib/prisma.ts#L1-L26)
- [schema.prisma](file://prisma/schema.prisma#L1-L143)
- [runMigrations.ts](file://lib/prisma/runMigrations.ts#L1-L69)
- [prisma.config.ts](file://prisma.config.ts#L1-L19)
- [migration.sql](file://prisma/migrations/20260124205628_init/migration.sql#L1-L149)

**Section sources**
- [prisma.ts](file://lib/prisma.ts#L1-L26)
- [prisma.config.ts](file://prisma.config.ts#L1-L19)
- [runMigrations.ts](file://lib/prisma/runMigrations.ts#L1-L69)
- [schema.prisma](file://prisma/schema.prisma#L1-L143)
- [xpService.ts](file://lib/xp/xpService.ts#L1-L902)
- [route.ts](file://app/api/tasks/submit/route.ts#L1-L67)
- [route.ts](file://app/api/xp/user/route.ts#L1-L41)
- [authConfig.ts](file://lib/auth/authConfig.ts#L1-L83)
- [syncTopicConfigs.ts](file://lib/xp/syncTopicConfigs.ts#L1-L174)
- [migration.sql](file://prisma/migrations/20260124205628_init/migration.sql#L1-L149)

## Core Components
This section documents the four primary entities and their relationships, constraints, and mapped fields.

- User
  - Identity and profile attributes with timestamps
  - Relationships: one-to-many with UserTopicXp and UserTaskAttempt
  - Authentication integration: managed by NextAuth PrismaAdapter
  - Mapped table: users
- TopicXpConfig
  - Per-topic XP configuration including base XP, daily limits, multipliers, level thresholds, SRS intervals, and tags
  - Relationships: one-to-many with UserTopicXp and UserTaskAttempt
  - Unique constraint: topicSlug
  - Mapped table: topic_xp_config
- UserTopicXp
  - Tracks per-user progress per topic: current XP, total earned, level, daily counters, SRS stage, and review dates
  - Relationships: belongs to User and TopicXpConfig
  - Unique composite key: (userId, topicSlug)
  - Indexes: user, topic, nextReviewDate
  - Mapped table: user_topic_xp
- UserTaskAttempt
  - Records each task attempt: correctness, XP earned, SRS scheduling, and mastery level
  - Relationships: belongs to User and TopicXpConfig
  - Indexes: (userId, topicSlug), nextReviewDate
  - Mapped table: user_task_attempts

Key constraints and defaults:
- UUID primary keys for User and foreign keys for relations
- Unique constraints on topicSlug for TopicXpConfig and (userId, topicSlug) for UserTopicXp
- Default values for numeric and decimal fields in TopicXpConfig and UserTopicXp
- Cascade delete for user references in UserTopicXp and UserTaskAttempt

**Section sources**
- [schema.prisma](file://prisma/schema.prisma#L19-L34)
- [schema.prisma](file://prisma/schema.prisma#L70-L97)
- [schema.prisma](file://prisma/schema.prisma#L99-L122)
- [schema.prisma](file://prisma/schema.prisma#L124-L142)

## Architecture Overview
The database architecture centers around three core tables and their relationships. The XPService orchestrates XP calculations, SRS scheduling, and persistence within Prisma transactions. API routes delegate to XPService for task submission and XP retrieval. Authentication integrates with NextAuth using Prisma adapter, persisting sessions and user identities with JWT strategy and enhanced security.

**Updated** Enhanced with Prisma adapter pattern for PostgreSQL connection management, improved authentication integration, and optimized session handling.

```mermaid
erDiagram
USER {
uuid id PK
varchar name
varchar email UK
timestamptz emailVerified
text image
enum role
timestamptz created_at
timestamptz updated_at
}
ACCOUNT {
uuid id PK
uuid userId FK
varchar type
varchar provider
varchar providerAccountId UK
text refresh_token
text access_token
int expires_at
text token_type
text scope
text id_token
text session_state
timestamptz created_at
}
VERIFICATION_TOKEN {
varchar identifier
timestamptz expires
varchar token
}
TOPIC_XP_CONFIG {
int id PK
varchar topicSlug UK
varchar topicTitle
varchar category
text description
varchar difficulty
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
varchar[] tags
timestamptz created_at
timestamptz updated_at
}
USER_TOPIC_XP {
int id PK
uuid user_id FK
varchar topic_slug FK
int currentXp
int totalXpEarned
int level
timestamptz lastActivity
int dailyTasksCount
date dailyTasksDate
int srsStage
date nextReviewDate
date lastPracticedDate
timestamptz created_at
}
USER_TASK_ATTEMPT {
int id PK
uuid user_id FK
varchar task_id
varchar topic_slug FK
timestamptz completed_at
int xpEarned
boolean isCorrect
date nextReviewDate
int reviewCount
int masteryLevel
}
USER ||--o{ ACCOUNT : "has"
USER ||--o{ USER_TOPIC_XP : "has"
USER ||--o{ USER_TASK_ATTEMPT : "has"
ACCOUNT ||--|| USER : "belongs to"
TOPIC_XP_CONFIG ||--o{ USER_TOPIC_XP : "configures"
TOPIC_XP_CONFIG ||--o{ USER_TASK_ATTEMPT : "applies to"
```

**Diagram sources**
- [schema.prisma](file://prisma/schema.prisma#L19-L34)
- [schema.prisma](file://prisma/schema.prisma#L36-L68)
- [schema.prisma](file://prisma/schema.prisma#L70-L97)
- [schema.prisma](file://prisma/schema.prisma#L99-L122)
- [schema.prisma](file://prisma/schema.prisma#L124-L142)

## Detailed Component Analysis

### Prisma Schema and Mappings
- Provider and datasource: PostgreSQL configured via environment variables
- Enums: AuthRole mapped to database enum
- Models: User, Account, VerificationToken, TopicXpConfig, UserTopicXp, UserTaskAttempt
- Relations: User to UserTopicXp and UserTaskAttempt; TopicXpConfig to UserTopicXp and UserTaskAttempt
- Unique constraints: email on User; topicSlug on TopicXpConfig; composite (userId, topicSlug) on UserTopicXp
- Indexes: explicit indexes on UserTopicXp and UserTaskAttempt for performance-sensitive queries
- Enhanced Account model with OAuth token management for comprehensive authentication support

**Section sources**
- [schema.prisma](file://prisma/schema.prisma#L4-L10)
- [schema.prisma](file://prisma/schema.prisma#L12-L17)
- [schema.prisma](file://prisma/schema.prisma#L19-L34)
- [schema.prisma](file://prisma/schema.prisma#L36-L68)
- [schema.prisma](file://prisma/schema.prisma#L70-L97)
- [schema.prisma](file://prisma/schema.prisma#L99-L122)
- [schema.prisma](file://prisma/schema.prisma#L124-L142)

### XP Calculation Data Model
The XPService implements the XP calculation and SRS scheduling logic:
- Level computation from thresholds
- Daily XP multiplier based on task count within a day per topic
- SRS stage progression and next review date calculation
- Transactional updates to UserTopicXp and creation of UserTaskAttempt
- Support for task difficulty-based base XP or explicit base XP override
- Enhanced anti-grind mechanics with early practice penalties

**Updated** Enhanced with comprehensive SRS scheduling algorithm, anti-grind mechanics, improved XP calculation logic, and better session-aware operations.

```mermaid
sequenceDiagram
participant Client as "Client"
participant API as "Submit Task API"
participant Auth as "NextAuth Session"
participant Service as "XPService"
participant DB as "Prisma Client"
Client->>API : POST /api/tasks/submit {taskId, topicSlug, isCorrect, ...}
API->>Auth : auth()
Auth-->>API : {user : {id}}
API->>Service : submitCorrectTask(userId, taskId, topicSlug, baseXP, difficulty)
Service->>DB : transaction begin
Service->>DB : fetch TopicXpConfig
Service->>DB : upsert UserTopicXp (ensure record exists)
Service->>Service : compute daily multiplier and XP
Service->>Service : compute SRS stage and nextReviewDate
Service->>DB : create UserTaskAttempt
Service->>DB : update UserTopicXp (XP, level, counters, dates)
DB-->>Service : commit
Service-->>API : {xpResult, userXP}
API-->>Client : success response
```

**Diagram sources**
- [route.ts](file://app/api/tasks/submit/route.ts#L1-L67)
- [authConfig.ts](file://lib/auth/authConfig.ts#L1-L83)
- [xpService.ts](file://lib/xp/xpService.ts#L118-L293)

**Section sources**
- [xpService.ts](file://lib/xp/xpService.ts#L71-L106)
- [xpService.ts](file://lib/xp/xpService.ts#L118-L293)
- [xp.ts](file://types/xp.ts#L83-L96)

### Task Attempt Tracking and Progress Persistence
- UserTaskAttempt captures correctness, XP earned, SRS scheduling, and mastery level
- UserTopicXp persists current and total XP, level, daily counters, SRS stage, and review dates
- Both entities are indexed to support frequent queries:
  - UserTopicXp: user, topic, nextReviewDate
  - UserTaskAttempt: (user, topic), nextReviewDate

**Updated** Enhanced with improved task history tracking, completion statistics, SRS scheduling integration, and better session-aware data persistence.

```mermaid
flowchart TD
Start(["Task Submission"]) --> CheckAuth["Check Authentication"]
CheckAuth --> CheckCorrect{"isCorrect?"}
CheckCorrect --> |No| Reject["Reject attempt"]
CheckCorrect --> |Yes| LoadConfig["Load TopicXpConfig"]
LoadConfig --> UpsertProgress["Upsert UserTopicXp"]
UpsertProgress --> ComputeMulti["Compute Daily Multiplier"]
ComputeMulti --> CalcXP["Calculate XP Earned"]
CalcXP --> UpdateSRS["Update SRS Stage & Next Review Date"]
UpdateSRS --> CreateAttempt["Create UserTaskAttempt"]
CreateAttempt --> Persist["Persist Changes in Transaction"]
Persist --> Done(["Return Results"])
```

**Diagram sources**
- [xpService.ts](file://lib/xp/xpService.ts#L118-L293)
- [schema.prisma](file://prisma/schema.prisma#L118-L121)
- [schema.prisma](file://prisma/schema.prisma#L139-L141)

**Section sources**
- [xpService.ts](file://lib/xp/xpService.ts#L255-L286)
- [schema.prisma](file://prisma/schema.prisma#L124-L142)

### Database Migration Strategy
- Production approach: migrate deploy using Prisma migrations directory
- Development approach: db push when migrations directory does not exist
- Startup orchestration: dynamic import to avoid Edge Runtime issues
- Fallback behavior: logs warnings and attempts db push if migrate deploy fails due to connectivity
- Enhanced migration configuration supporting both Supavisor and direct database connections

**Updated** Enhanced with improved migration deployment strategy supporting both Supavisor (port 6543) and direct database connections (port 5432), with better fallback mechanisms.

```mermaid
flowchart TD
Start(["App Start"]) --> CheckRuntime{"Node.js runtime?"}
CheckRuntime --> |No| Skip["Skip migrations"]
CheckRuntime --> |Yes| CheckFlag{"RUN_MIGRATIONS_ON_START != false?"}
CheckFlag --> |No| Skip
CheckFlag --> |Yes| CheckMigrations{"migrations dir exists?"}
CheckMigrations --> |Yes| Deploy["npx prisma migrate deploy"]
CheckMigrations --> |No| Push["npx prisma db push"]
Deploy --> CheckConnectivity{"Database reachable?"}
CheckConnectivity --> |No| Fallback["Try db push as fallback"]
CheckConnectivity --> |Yes| Done(["Done"])
Fallback --> Done
```

**Diagram sources**
- [runMigrations.ts](file://lib/prisma/runMigrations.ts#L6-L68)

**Section sources**
- [runMigrations.ts](file://lib/prisma/runMigrations.ts#L1-L69)
- [prisma.config.ts](file://prisma.config.ts#L1-L19)

### Seed Data Management
- Topic configurations are synchronized from content files into TopicXpConfig
- syncTopicConfigs iterates over math topics, reads config.json, and upserts into the database
- loadTopicConfig and loadAllTopicConfigs support loading individual or bulk topic configs
- Enhanced error handling and individual topic sync failure reporting

**Updated** Enhanced with improved topic configuration synchronization, better error handling, and comprehensive sync result reporting.

```mermaid
sequenceDiagram
participant Boot as "Startup"
participant Sync as "syncTopicConfigs"
participant FS as "Filesystem"
participant DB as "Prisma Client"
Boot->>Sync : syncTopicConfigs()
Sync->>FS : readdir(content/math)
loop For each topic
Sync->>FS : readFile(config.json)
Sync->>DB : upsert TopicXpConfig
end
Sync-->>Boot : {success, synced, total, results}
```

**Diagram sources**
- [syncTopicConfigs.ts](file://lib/xp/syncTopicConfigs.ts#L10-L49)
- [syncTopicConfigs.ts](file://lib/xp/syncTopicConfigs.ts#L54-L130)

**Section sources**
- [syncTopicConfigs.ts](file://lib/xp/syncTopicConfigs.ts#L1-L174)

### Data Integrity Rules
- Foreign key constraints: UserTopicXp and UserTaskAttempt reference User and TopicXpConfig with cascade delete
- Unique constraints: email on User; topicSlug on TopicXpConfig; composite (userId, topicSlug) on UserTopicXp
- Defaults: numeric and decimal defaults in TopicXpConfig and UserTopicXp
- Enum mapping: AuthRole enum mapped to database enum
- Enhanced account management: unique provider/providerAccountId combinations for OAuth integration

**Section sources**
- [schema.prisma](file://prisma/schema.prisma#L55-L59)
- [schema.prisma](file://prisma/schema.prisma#L115-L115)
- [schema.prisma](file://prisma/schema.prisma#L137-L137)
- [schema.prisma](file://prisma/schema.prisma#L12-L17)
- [schema.prisma](file://prisma/schema.prisma#L57-L57)

### Database Connection Management
**New** Enhanced database connection architecture with Prisma adapter pattern for PostgreSQL and comprehensive connection pooling.

The application uses a sophisticated database connection management system:
- Prisma adapter pattern with custom PostgreSQL pool using PrismaPg
- Support for both Supavisor (port 6543) and direct database connections (port 5432)
- Environment-based configuration for different deployment scenarios
- Global singleton pattern for Prisma client instance management
- Connection pooling for improved performance and resource utilization

**Section sources**
- [prisma.ts](file://lib/prisma.ts#L1-L26)
- [prisma.config.ts](file://prisma.config.ts#L1-L19)

### Authentication Integration
**New** Enhanced authentication system with NextAuth PrismaAdapter and comprehensive session management.

The authentication system provides:
- NextAuth integration with PrismaAdapter for seamless user session management
- JWT strategy with 60-day session lifetime
- Multiple OAuth provider support: Google, GitHub, Facebook, and Resend
- Enhanced session callbacks for user ID propagation
- Google One Tap integration with custom authorization flow
- Secure session storage and user identity management

**Section sources**
- [authConfig.ts](file://lib/auth/authConfig.ts#L1-L83)

## Dependency Analysis
The following diagram shows module-level dependencies among the database-related components.

**Updated** Enhanced with improved dependency relationships reflecting the new Prisma adapter architecture and authentication integration.

```mermaid
graph LR
Schema["Prisma Schema<br/>prisma/schema.prisma"] --> Types["Type Definitions<br/>types/xp.ts"]
PrismaCfg["Prisma Client & Adapter<br/>lib/prisma.ts"] --> Schema
Auth["NextAuth PrismaAdapter<br/>lib/auth/authConfig.ts"] --> PrismaCfg
XPService["XPService<br/>lib/xp/xpService.ts"] --> PrismaCfg
XPService --> Types
APISubmit["API Submit Route<br/>app/api/tasks/submit/route.ts"] --> Auth
APISubmit --> XPService
APIXP["API XP Route<br/>app/api/xp/user/route.ts"] --> Auth
APIXP --> XPService
Sync["Sync Topic Configs<br/>lib/xp/syncTopicConfigs.ts"] --> PrismaCfg
Migrations["Run Migrations<br/>lib/prisma/runMigrations.ts"] --> PrismaCfg
PrismaConfig["Prisma Config<br/>prisma.config.ts"] --> PrismaCfg
MigrationSQL["Migration SQL<br/>prisma/migrations/20260124205628_init/migration.sql"] --> Schema
```

**Diagram sources**
- [schema.prisma](file://prisma/schema.prisma#L1-L143)
- [xp.ts](file://types/xp.ts#L1-L131)
- [prisma.ts](file://lib/prisma.ts#L1-L26)
- [authConfig.ts](file://lib/auth/authConfig.ts#L1-L83)
- [xpService.ts](file://lib/xp/xpService.ts#L1-L902)
- [route.ts](file://app/api/tasks/submit/route.ts#L1-L67)
- [route.ts](file://app/api/xp/user/route.ts#L1-L41)
- [syncTopicConfigs.ts](file://lib/xp/syncTopicConfigs.ts#L1-L174)
- [runMigrations.ts](file://lib/prisma/runMigrations.ts#L1-L69)
- [prisma.config.ts](file://prisma.config.ts#L1-L19)
- [migration.sql](file://prisma/migrations/20260124205628_init/migration.sql#L1-L149)

**Section sources**
- [prisma.ts](file://lib/prisma.ts#L1-L26)
- [prisma.config.ts](file://prisma.config.ts#L1-L19)
- [runMigrations.ts](file://lib/prisma/runMigrations.ts#L1-L69)
- [schema.prisma](file://prisma/schema.prisma#L1-L143)
- [xpService.ts](file://lib/xp/xpService.ts#L1-L902)
- [route.ts](file://app/api/tasks/submit/route.ts#L1-L67)
- [route.ts](file://app/api/xp/user/route.ts#L1-L41)
- [authConfig.ts](file://lib/auth/authConfig.ts#L1-L83)
- [syncTopicConfigs.ts](file://lib/xp/syncTopicConfigs.ts#L1-L174)
- [xp.ts](file://types/xp.ts#L1-L131)

## Performance Considerations
- Indexes
  - UserTopicXp: indexes on userId, topicSlug, and nextReviewDate to accelerate progress queries and SRS scheduling
  - UserTaskAttempt: indexes on (userId, topicSlug) and nextReviewDate to support due-for-review queries and grouping
- Transactions
  - XP updates are performed in a single Prisma transaction to maintain consistency and reduce contention
- Data types
  - Decimal fields for multipliers and decay factors preserve precision
  - Date vs timestamptz: nextReviewDate stored as date; timestamps stored as timestamptz for precise audit trails
- Query patterns
  - Frequent queries include due-for-review tasks, per-topic XP, and per-task history—indexes target these patterns
- Connection pooling
  - PrismaPg adapter uses a Node.js Postgres pool for efficient connection reuse
  - Enhanced connection management with Supavisor support for improved scalability
- Authentication performance
  - JWT strategy reduces database queries for session validation
  - PrismaAdapter caches user data for improved authentication performance

**Updated** Enhanced with improved connection pooling strategy, database optimization techniques, and authentication performance optimizations.

**Section sources**
- [schema.prisma](file://prisma/schema.prisma#L118-L121)
- [schema.prisma](file://prisma/schema.prisma#L139-L141)
- [prisma.ts](file://lib/prisma.ts#L1-L26)
- [xpService.ts](file://lib/xp/xpService.ts#L118-L293)
- [authConfig.ts](file://lib/auth/authConfig.ts#L19-L22)

## Troubleshooting Guide
- Migrations fail due to database unavailability
  - Behavior: warning logged and fallback to db push attempted in development
  - Resolution: ensure database connectivity or manually run migrations/db push
- Missing migrations directory
  - Behavior: db push used instead of migrate deploy
  - Resolution: initialize migrations or set RUN_MIGRATIONS_ON_START=false to skip
- Topic config synchronization errors
  - Behavior: individual topic sync failures reported; overall operation continues
  - Resolution: inspect content/config.json for malformed JSON or missing fields
- Authentication session issues
  - Behavior: NextAuth PrismaAdapter manages sessions; verify adapter configuration and environment variables
  - Resolution: confirm Prisma client initialization and DATABASE_URL
- Database connection issues
  - Behavior: Prisma adapter handles connection pooling; check connection string format
  - Resolution: verify DATABASE_URL format and network connectivity
- Supavisor connection problems
  - Behavior: Enhanced connection management supports both Supavisor and direct connections
  - Resolution: verify AUTH_DATABASE_PORT setting (6543 for Supavisor, 5432 for direct)
- Migration deployment failures
  - Behavior: Enhanced fallback mechanisms attempt db push if migrate deploy fails
  - Resolution: check database connectivity and retry migration deployment

**Updated** Enhanced with troubleshooting guidance for the new Prisma adapter architecture, database connection management, authentication integration, and migration deployment strategies.

**Section sources**
- [runMigrations.ts](file://lib/prisma/runMigrations.ts#L45-L67)
- [syncTopicConfigs.ts](file://lib/xp/syncTopicConfigs.ts#L28-L34)
- [authConfig.ts](file://lib/auth/authConfig.ts#L14-L14)
- [prisma.ts](file://lib/prisma.ts#L1-L26)
- [prisma.config.ts](file://prisma.config.ts#L16-L18)

## Conclusion
The database design supports a robust XP and SRS-driven learning system with clear entity relationships, enforced constraints, and targeted indexes. The XPService encapsulates the core logic for XP calculation, Anti-Grind, and SRS scheduling, while API routes integrate seamlessly with the service. Migration orchestration and topic configuration synchronization provide operational flexibility across environments. The enhanced authentication integration with NextAuth PrismaAdapter provides secure session management and user data handling.

**Updated** Enhanced with improved Prisma-based database design featuring sophisticated connection management, comprehensive authentication integration, migration deployment strategies, and comprehensive XP calculation services with optimized user data handling.

## Appendices

### API Endpoints and Data Contracts
- POST /api/tasks/submit
  - Request: TaskSubmissionRequest
  - Response: TaskSubmissionResponse
  - Authentication: Required (NextAuth session)
- GET /api/xp/user?topicSlug={slug}
  - Response: GETXpUserResponse
  - Authentication: Required (NextAuth session)

**Section sources**
- [route.ts](file://app/api/tasks/submit/route.ts#L1-L67)
- [route.ts](file://app/api/xp/user/route.ts#L1-L41)
- [xp.ts](file://types/xp.ts#L98-L131)

### Database Schema Evolution
**New** Enhanced database schema with improved Prisma integration, authentication support, and migration management.

The database schema has evolved to support:
- Prisma adapter pattern for PostgreSQL connection management with connection pooling
- Enhanced authentication integration with NextAuth PrismaAdapter
- Improved migration deployment with Supavisor and direct connection support
- Comprehensive OAuth account management with token storage
- Enhanced indexing strategy for SRS scheduling and XP tracking
- Comprehensive error handling and fallback mechanisms

**Section sources**
- [schema.prisma](file://prisma/schema.prisma#L1-L143)
- [migration.sql](file://prisma/migrations/20260124205628_init/migration.sql#L1-L149)
- [prisma.config.ts](file://prisma.config.ts#L1-L19)
- [authConfig.ts](file://lib/auth/authConfig.ts#L1-L83)