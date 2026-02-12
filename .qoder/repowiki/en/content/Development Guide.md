# Development Guide

<cite>
**Referenced Files in This Document**
- [README.md](file://README.md)
- [package.json](file://package.json)
- [tsconfig.json](file://tsconfig.json)
- [eslint.config.mjs](file://eslint.config.mjs)
- [postcss.config.mjs](file://postcss.config.mjs)
- [next.config.ts](file://next.config.ts)
- [prisma/schema.prisma](file://prisma/schema.prisma)
- [prisma.config.ts](file://prisma.config.ts)
- [lib/prisma/runMigrations.ts](file://lib/prisma/runMigrations.ts)
- [lib/xp/syncTopicConfigs.ts](file://lib/xp/syncTopicConfigs.ts)
- [instrumentation.ts](file://instrumentation.ts)
- [lib/auth/authConfig.ts](file://lib/auth/authConfig.ts)
- [app/layout.tsx](file://app/layout.tsx)
- [app/globals.css](file://app/globals.css)
- [app/typography.css](file://app/typography.css)
- [components/providers/SessionWrapper.tsx](file://components/providers/SessionWrapper.tsx)
- [.prettierrc](file://.prettierrc)
- [proxy.ts](file://proxy.ts)
- [database/supabase-project/docker-compose.yml](file://database/supabase-project/docker-compose.yml)
- [database/supabase-project/dev/docker-compose.dev.yml](file://database/supabase-project/dev/docker-compose.dev.yml)
- [database/supabase-project/reset.sh](file://database/supabase-project/reset.sh)
- [database/supabase-project/utils/db-passwd.sh](file://database/supabase-project/utils/db-passwd.sh)
- [database/supabase-project/utils/generate-keys.sh](file://database/supabase-project/utils/generate-keys.sh)
- [database/supabase-project/dev/data.sql](file://database/supabase-project/dev/data.sql)
- [database/supabase-project/volumes/db/jwt.sql](file://database/supabase-project/volumes/db/jwt.sql)
- [database/supabase-project/volumes/db/roles.sql](file://database/supabase-project/volumes/db/roles.sql)
- [database/supabase-project/snippet-launch-supabase-docker.md](file://database/supabase-project/snippet-launch-supabase-docker.md)
- [database/supabase-project/versions.md](file://database/supabase-project/versions.md)
- [database/supabase-project/.env](file://database/supabase-project/.env)
- [database/supabase-project/README.md](file://database/supabase-project/README.md)
</cite>

## Update Summary
**Changes Made**
- Updated environment configuration section to reflect the comprehensive 131-line .env file with Supabase self-hosted deployment settings
- Enhanced Docker-based development environment documentation with detailed environment variable management
- Added comprehensive coverage of Supavisor pooler configuration, API proxy settings, authentication, Studio dashboard, Functions, and logging configurations
- Updated security considerations to address production-ready environment setup requirements
- Expanded troubleshooting section with specific guidance for environment variable configuration

## Table of Contents
1. [Introduction](#introduction)
2. [Prerequisites](#prerequisites)
3. [Development Setup](#development-setup)
4. [Project Structure](#project-structure)
5. [Core Components](#core-components)
6. [Architecture Overview](#architecture-overview)
7. [Docker-Based Development Environment](#docker-based-development-environment)
8. [Comprehensive Environment Configuration](#comprehensive-environment-configuration)
9. [Supabase Container Orchestration](#supabase-container-orchestration)
10. [Helper Scripts and Utilities](#helper-scripts-and-utilities)
11. [Development Best Practices](#development-best-practices)
12. [Detailed Component Analysis](#detailed-component-analysis)
13. [Dependency Analysis](#dependency-analysis)
14. [Performance Considerations](#performance-considerations)
15. [Troubleshooting Guide](#troubleshooting-guide)
16. [Conclusion](#conclusion)
17. [Appendices](#appendices)

## Introduction
This development guide provides a comprehensive overview of the local development setup, build configuration, code quality standards, and deployment preparation for the Math App Next.js project. The guide covers TypeScript configuration, ESLint rules, PostCSS/Tailwind setup, Prisma development workflow, and npm script usage. It includes extensive coverage of the new Docker-based development workflow with comprehensive Supabase setup, helper scripts for password generation and API key creation, reset functionality, and detailed development environment configuration with 131 lines of production-ready environment variables.

## Prerequisites
Before starting development, ensure you have the following tools installed:

- **Bun**: Version 1.0 or higher for fast JavaScript runtime and package management
- **Docker**: Container orchestration platform for local development
- **Git**: Version control system for repository management

These prerequisites enable the complete development workflow including Docker-based Supabase services, Bun package management, and Git version control.

**Section sources**
- [README.md](file://README.md#L3-L8)

## Development Setup

### Step 1: Clone the Repository
```bash
git clone <repository-url>
cd math-app-next-js
```

### Step 2: Install Dependencies
```bash
bun install
```

### Step 3: Start the Database (Supabase) - Local Development
```bash
cd database/supabase-project
docker compose up -d
cd ../..
```

This will start:
- PostgreSQL on port `5432` (direct connection)
- Supavisor (connection pooler) on port `6543` (pooled connection)
- Supabase Studio dashboard on port `8000`

Access Supabase Studio: http://localhost:8000/

### Step 4: Configure Environment Variables
**Updated** The project now uses a comprehensive environment configuration system with detailed .env file management.

1. **Copy the Supabase environment template**:
   ```bash
   cd database/supabase-project
   cp .env .env.backup  # Backup existing configuration
   ```

2. **Generate comprehensive Supabase credentials**:
   ```bash
   ./utils/generate-keys.sh
   ```

3. **Configure authentication providers**:
   - Generate `AUTH_SECRET` using OpenSSL
   - Set up Google Cloud Console OAuth credentials
   - Configure GitHub, Facebook, and Resend authentication providers

4. **Set up database connections**:
   - Configure `DATABASE_URL` for Prisma
   - Set up `DIRECT_URL` for migrations (port 5432)
   - Configure `AUTH_DATABASE_*` variables for NextAuth

**Section sources**
- [README.md](file://README.md#L9-L94)
- [database/supabase-project/.env](file://database/supabase-project/.env#L1-L131)
- [database/supabase-project/utils/generate-keys.sh](file://database/supabase-project/utils/generate-keys.sh#L1-L120)

### Step 5: Apply Schema to Database (Prisma)
Run Prisma migrations to create the database schema:
```bash
bun prisma:generate
bun prisma:migrate
```

Or push the schema without migrations:
```bash
bun prisma:generate
bun prisma:push
```

### Step 6: Start the Development Server
```bash
bun dev
```

The application will be available at http://localhost:3000

**Section sources**
- [README.md](file://README.md#L9-L94)

## Project Structure
The project follows a Next.js app directory structure with app/, components/, lib/, prisma/, content/, and types/ organized by feature and responsibility. The development environment includes a comprehensive Docker-based setup with Supabase services orchestrated through docker-compose.yml and development-specific configurations in dev/docker-compose.dev.yml.

**Updated** The database directory is intentionally excluded from TypeScript compilation to improve build performance and maintainability. The comprehensive .env file provides production-ready configuration for all Supabase services.

```mermaid
graph TB
subgraph "Docker Development Environment"
COMPOSE["docker-compose.yml"]
DEV_COMPOSE["dev/docker-compose.dev.yml"]
RESET_SCRIPT["reset.sh"]
DB_PASSWD["utils/db-passwd.sh"]
GEN_KEYS["utils/generate-keys.sh"]
ENV_FILE["database/supabase-project/.env<br/>131 Lines of Configuration"]
end
subgraph "App Layer"
LAYOUT["app/layout.tsx"]
GLOBALS["app/globals.css"]
TYPOGRAPHY["app/typography.css"]
end
subgraph "Components"
SESSION_WRAPPER["components/providers/SessionWrapper.tsx"]
end
subgraph "Libraries"
AUTH_CONFIG["lib/auth/authConfig.ts"]
RUN_MIGRATIONS["lib/prisma/runMigrations.ts"]
SYNC_TOPIC["lib/xp/syncTopicConfigs.ts"]
INSTRUMENTATION["instrumentation.ts"]
end
subgraph "Prisma"
SCHEMA["prisma/schema.prisma"]
PRISMA_CONFIG["prisma.config.ts"]
end
subgraph "Tooling"
PKG["package.json"]
TSCONFIG["tsconfig.json"]
ESLINT["eslint.config.mjs"]
POSTCSS["postcss.config.mjs"]
NEXTCONF["next.config.ts"]
PRETTIER[".prettierrc"]
end
COMPOSE --> DEV_COMPOSE
DEV_COMPOSE --> RESET_SCRIPT
RESET_SCRIPT --> DB_PASSWD
RESET_SCRIPT --> GEN_KEYS
ENV_FILE --> COMPOSE
LAYOUT --> SESSION_WRAPPER
SESSION_WRAPPER --> AUTH_CONFIG
INSTRUMENTATION --> RUN_MIGRATIONS
INSTRUMENTATION --> SYNC_TOPIC
RUN_MIGRATIONS --> PRISMA_CONFIG
SYNC_TOPIC --> SCHEMA
PKG --> ESLINT
PKG --> POSTCSS
PKG --> NEXTCONF
PKG --> TSCONFIG
```

**Diagram sources**
- [database/supabase-project/docker-compose.yml](file://database/supabase-project/docker-compose.yml#L1-L538)
- [database/supabase-project/dev/docker-compose.dev.yml](file://database/supabase-project/dev/docker-compose.dev.yml#L1-L45)
- [database/supabase-project/reset.sh](file://database/supabase-project/reset.sh#L1-L77)
- [database/supabase-project/utils/db-passwd.sh](file://database/supabase-project/utils/db-passwd.sh#L1-L158)
- [database/supabase-project/utils/generate-keys.sh](file://database/supabase-project/utils/generate-keys.sh#L1-L120)
- [database/supabase-project/.env](file://database/supabase-project/.env#L1-L131)
- [app/layout.tsx](file://app/layout.tsx#L1-L46)
- [components/providers/SessionWrapper.tsx](file://components/providers/SessionWrapper.tsx#L1-L11)
- [lib/auth/authConfig.ts](file://lib/auth/authConfig.ts#L1-L83)
- [instrumentation.ts](file://instrumentation.ts#L1-L44)
- [lib/prisma/runMigrations.ts](file://lib/prisma/runMigrations.ts#L1-L69)
- [lib/xp/syncTopicConfigs.ts](file://lib/xp/syncTopicConfigs.ts#L1-L174)
- [prisma/schema.prisma](file://prisma/schema.prisma#L1-L143)
- [prisma.config.ts](file://prisma.config.ts#L1-L19)
- [package.json](file://package.json#L1-L63)
- [tsconfig.json](file://tsconfig.json#L1-L35)
- [eslint.config.mjs](file://eslint.config.mjs#L1-L24)
- [postcss.config.mjs](file://postcss.config.mjs#L1-L8)
- [next.config.ts](file://next.config.ts#L1-L10)
- [.prettierrc](file://.prettierrc)

**Section sources**
- [README.md](file://README.md#L169-L178)
- [database/supabase-project/docker-compose.yml](file://database/supabase-project/docker-compose.yml#L1-L538)
- [database/supabase-project/dev/docker-compose.dev.yml](file://database/supabase-project/dev/docker-compose.dev.yml#L1-L45)
- [database/supabase-project/reset.sh](file://database/supabase-project/reset.sh#L1-L77)
- [database/supabase-project/utils/db-passwd.sh](file://database/supabase-project/utils/db-passwd.sh#L1-L158)
- [database/supabase-project/utils/generate-keys.sh](file://database/supabase-project/utils/generate-keys.sh#L1-L120)
- [database/supabase-project/.env](file://database/supabase-project/.env#L1-L131)

## Core Components
- **Docker Development Environment**: Comprehensive container orchestration with Supabase services including Studio, Kong API gateway, GoTrue auth, PostgREST, Realtime, Storage, and Analytics.
- **TypeScript Configuration**: Strict compilation, ESNext modules, bundler resolution, isolated modules, and JSX transform configured via tsconfig.json. The database directory is excluded from compilation for improved performance.
- **ESLint Configuration**: Extends Next.js core-web-vitals and TypeScript configs, overrides defaults, and disables explicit any rule.
- **PostCSS/Tailwind**: Tailwind PostCSS plugin enabled; CSS imports and theme tokens defined in app/globals.css and app/typography.css.
- **Next.js Configuration**: Remote image pattern for Google avatar images configured.
- **Prisma Configuration**: Dynamic datasource URL from environment variables, migrations path, and schema location.
- **Instrumentation Hooks**: Startup migration runner and topic config sync executed once per server instance.
- **Comprehensive Environment Management**: 131-line .env file providing production-ready configuration for all Supabase services including secrets, database, pooler, API proxy, authentication, Studio, Functions, and logging.

**Section sources**
- [database/supabase-project/docker-compose.yml](file://database/supabase-project/docker-compose.yml#L1-L538)
- [tsconfig.json](file://tsconfig.json#L1-L35)
- [eslint.config.mjs](file://eslint.config.mjs#L1-L24)
- [postcss.config.mjs](file://postcss.config.mjs#L1-L8)
- [next.config.ts](file://next.config.ts#L1-L10)
- [prisma.config.ts](file://prisma.config.ts#L1-L19)
- [instrumentation.ts](file://instrumentation.ts#L1-L44)
- [database/supabase-project/.env](file://database/supabase-project/.env#L1-L131)

## Architecture Overview
The development stack integrates Next.js app routing, React components, NextAuth for authentication, Prisma for data modeling and migrations, and Tailwind CSS for styling. The new Docker-based architecture provides a complete Supabase development environment with containerized services, while the runtime initialization ensures database migrations and topic synchronization occur on server startup, while middleware enforces protected routes.

```mermaid
graph TB
CLIENT["Browser"]
NEXT["Next.js App Router"]
LAYOUT["Root Layout<br/>Session & Theme Providers"]
MW["Middleware<br/>Protected Routes"]
AUTH["NextAuth Handlers"]
PRISMA["Prisma Client"]
DB["PostgreSQL"]
DOCKER["Docker Container<br/>Supabase Services"]
COMPOSE["docker-compose.yml<br/>Service Orchestration"]
ENV["Comprehensive .env<br/>131 Lines Configuration"]
COMPOSE --> DB
ENV --> COMPOSE
CLIENT --> NEXT
NEXT --> LAYOUT
NEXT --> MW
LAYOUT --> AUTH
AUTH --> PRISMA
PRISMA --> DB
MW --> AUTH
```

**Diagram sources**
- [app/layout.tsx](file://app/layout.tsx#L1-L46)
- [components/providers/SessionWrapper.tsx](file://components/providers/SessionWrapper.tsx#L1-L11)
- [lib/auth/authConfig.ts](file://lib/auth/authConfig.ts#L1-L83)
- [proxy.ts](file://proxy.ts#L1-L25)
- [lib/prisma/runMigrations.ts](file://lib/prisma/runMigrations.ts#L1-L69)
- [prisma/schema.prisma](file://prisma/schema.prisma#L1-L143)
- [database/supabase-project/docker-compose.yml](file://database/supabase-project/docker-compose.yml#L1-L538)
- [database/supabase-project/.env](file://database/supabase-project/.env#L1-L131)

## Docker-Based Development Environment

### Container Orchestration Overview
The project includes a comprehensive Docker-based development environment managed through docker-compose.yml. This setup provides a complete Supabase development stack with all necessary services running in isolated containers.

### Service Dependencies and Health Checks
The Docker composition defines 15+ interconnected services with health checks and proper dependency chains:
- **Studio**: Web-based database management interface
- **Kong**: API gateway and reverse proxy
- **GoTrue**: Authentication service
- **PostgREST**: RESTful API for PostgreSQL
- **Realtime**: Real-time messaging service
- **Storage**: Object storage service
- **Analytics**: Logflare analytics backend
- **Database**: PostgreSQL with custom configurations
- **Edge Functions**: Serverless function execution
- **Mail Server**: Development email testing

### Development-Specific Configuration
The dev/docker-compose.dev.yml extends the base configuration with:
- Live reload capabilities for Studio development
- Mailcatcher service for email testing
- Development database with seed data
- Port mappings for local development access

**Section sources**
- [database/supabase-project/docker-compose.yml](file://database/supabase-project/docker-compose.yml#L1-L538)
- [database/supabase-project/dev/docker-compose.dev.yml](file://database/supabase-project/dev/docker-compose.dev.yml#L1-L45)

## Comprehensive Environment Configuration

### Production-Ready .env Structure
The project now features a comprehensive 131-line .env file that provides complete configuration for all Supabase self-hosted services. This environment file is organized into logical sections for easy management and security.

### Secret Management
Critical security components include:
- **Database Passwords**: `POSTGRES_PASSWORD` for PostgreSQL authentication
- **JWT Secrets**: `JWT_SECRET` for JSON Web Token signing
- **API Keys**: `ANON_KEY` and `SERVICE_ROLE_KEY` for Supabase authentication
- **Dashboard Credentials**: `DASHBOARD_USERNAME` and `DASHBOARD_PASSWORD` for Studio access
- **Encryption Keys**: `VAULT_ENC_KEY` and `PG_META_CRYPTO_KEY` for secure data handling

### Database Configuration
The environment supports flexible database configurations:
- **Connection Parameters**: Host, port, database name, and credentials
- **Pooler Settings**: Supavisor connection pooling with configurable limits
- **Direct vs Pooled Connections**: Separate URLs for migrations (direct) and application (pooled)

### Supavisor Pooler Configuration
Advanced connection pooling settings:
- **Transaction Pooling**: `POOLER_PROXY_PORT_TRANSACTION` for pooled connections
- **Pool Size Limits**: `POOLER_DEFAULT_POOL_SIZE` and `POOLER_DB_POOL_SIZE`
- **Client Connection Limits**: `POOLER_MAX_CLIENT_CONN` for traffic management
- **Tenant Isolation**: `POOLER_TENANT_ID` for multi-tenant scenarios

### API Proxy and Services
Comprehensive API configuration:
- **Kong Ports**: `KONG_HTTP_PORT` and `KONG_HTTPS_PORT` for API gateway
- **PostgREST Schemas**: `PGRST_DB_SCHEMAS` for database schema exposure
- **Service URLs**: `API_EXTERNAL_URL` and `SUPABASE_PUBLIC_URL` for service discovery

### Authentication and Security
Multi-provider authentication setup:
- **Provider Credentials**: Google, GitHub, Facebook, and Resend authentication
- **Email Configuration**: SMTP settings for email-based authentication
- **Security Policies**: Signup restrictions, auto-confirm settings, and expiration controls

### Studio and Functions
Development environment configuration:
- **Studio Settings**: Organization and project defaults
- **Image Processing**: `IMGPROXY_ENABLE_WEBP_DETECTION` for optimized images
- **Function Security**: `FUNCTIONS_VERIFY_JWT` for function authentication
- **Analytics Integration**: `LOGFLARE_*` tokens for observability

### Logging and Monitoring
Comprehensive logging setup:
- **Logflare Tokens**: Public and private access tokens for analytics
- **Docker Socket**: `DOCKER_SOCKET_LOCATION` for container monitoring
- **Cloud Integration**: `GOOGLE_PROJECT_ID` and `GOOGLE_PROJECT_NUMBER` for cloud services

**Section sources**
- [database/supabase-project/.env](file://database/supabase-project/.env#L1-L131)
- [database/supabase-project/README.md](file://database/supabase-project/README.md#L69-L84)

## Supabase Container Orchestration

### Service Architecture
The Supabase ecosystem consists of tightly integrated microservices that work together to provide a complete backend-as-a-service platform:

```mermaid
graph TB
subgraph "Supabase Service Layer"
STUDIO["Studio<br/>Web Interface"]
KONG["Kong API Gateway"]
GOTRUE["GoTrue Auth"]
POSTGREST["PostgREST"]
REALTIME["Realtime"]
STORAGE["Storage"]
ANALYTICS["Analytics"]
DB["PostgreSQL"]
ENDPOINTS["API Endpoints"]
end
subgraph "Development Tools"
MAIL["Mailcatcher"]
META["Meta API"]
IMGPROXY["Imgproxy"]
VECTOR["Vector Logs"]
POOLER["Supavisor Pooler"]
end
STUDIO --> KONG
KONG --> GOTRUE
KONG --> POSTGREST
KONG --> REALTIME
KONG --> STORAGE
GOTRUE --> DB
POSTGREST --> DB
REALTIME --> DB
STORAGE --> DB
ANALYTICS --> DB
MAIL --> GOTRUE
META --> DB
IMGPROXY --> STORAGE
VECTOR --> ANALYTICS
POOLER --> DB
```

**Diagram sources**
- [database/supabase-project/docker-compose.yml](file://database/supabase-project/docker-compose.yml#L12-L538)

### Database Initialization and Security
The database setup includes comprehensive security configurations:
- Custom JWT settings applied during initialization
- Role-based access control with specific passwords
- Realtime publication setup for streaming data
- Storage bucket configuration for avatar management

**Section sources**
- [database/supabase-project/volumes/db/jwt.sql](file://database/supabase-project/volumes/db/jwt.sql#L1-L6)
- [database/supabase-project/volumes/db/roles.sql](file://database/supabase-project/volumes/db/roles.sql#L1-L9)
- [database/supabase-project/dev/data.sql](file://database/supabase-project/dev/data.sql#L1-L49)

## Helper Scripts and Utilities

### Password Generation Script
The db-passwd.sh script provides automated password management for Supabase database users:
- Generates secure random passwords using OpenSSL
- Updates multiple database roles simultaneously
- Handles analytics backend connection string updates
- Includes interactive confirmation prompts

### API Key Generation Script
The generate-keys.sh script creates comprehensive authentication credentials:
- JWT secrets with cryptographic strength
- Anonymous and service role keys
- Dashboard and analytics tokens
- Database and administrative credentials

### Reset Functionality
The reset.sh script provides complete environment cleanup:
- Stops and removes all containers and volumes
- Cleans bind-mounted directories
- Resets .env file to default configuration
- Includes safety confirmations for destructive operations

**Section sources**
- [database/supabase-project/utils/db-passwd.sh](file://database/supabase-project/utils/db-passwd.sh#L1-L158)
- [database/supabase-project/utils/generate-keys.sh](file://database/supabase-project/utils/generate-keys.sh#L1-L120)
- [database/supabase-project/reset.sh](file://database/supabase-project/reset.sh#L1-L77)

## Development Best Practices

### Docker Development Workflow
- Use docker compose up for initial setup and development
- Leverage dev/docker-compose.dev.yml for enhanced development experience
- Utilize helper scripts for environment management
- Follow proper container lifecycle management

### Environment Management
- Maintain separate .env files for different environments
- Use generate-keys.sh for initial credential setup
- Regularly update passwords with db-passwd.sh
- Monitor container health and logs

### Database Development
- Use development database with seed data for local testing
- Implement proper role-based access control
- Test Realtime functionality with proper publication setup
- Validate Storage bucket configurations

### Security Considerations
- **Production-Ready**: The comprehensive .env file is designed for production use
- **Secret Rotation**: Regularly update secrets using the provided scripts
- **Network Security**: Review and adjust CORS settings for production
- **Backup Procedures**: Implement proper backup strategies before updates

## Detailed Component Analysis

### TypeScript Configuration
- Compiler options emphasize strictness, modern JS features, and Next.js-specific plugins.
- Path aliases simplify imports using @/.
- Incremental builds and isolated modules improve DX and performance.
- **Updated** The database directory is excluded from compilation to improve build performance and maintainability.

**Section sources**
- [tsconfig.json](file://tsconfig.json#L1-L35)

### ESLint Configuration
- Uses Next.js recommended configs for core web vitals and TypeScript.
- Overrides default ignores to include generated types and app sources.
- Disables explicit any rule to balance safety and developer velocity.

**Section sources**
- [eslint.config.mjs](file://eslint.config.mjs#L1-L24)

### PostCSS and Tailwind Setup
- Tailwind PostCSS plugin is enabled via postcss.config.mjs.
- Global CSS imports Tailwind directives and typography styles.
- Dark mode variant and theme tokens are defined in app/globals.css.

**Section sources**
- [postcss.config.mjs](file://postcss.config.mjs#L1-L8)
- [app/globals.css](file://app/globals.css#L1-L14)
- [app/typography.css](file://app/typography.css#L1-L11)

### Next.js Configuration
- Remote image patterns allow Google avatar images for authenticated users.
- Ensures safe external image loading for auth-related avatars.

**Section sources**
- [next.config.ts](file://next.config.ts#L1-L10)

### Prisma Development Workflow
- Schema defines enums, models, relations, and indexes for users, accounts, verification tokens, topic XP configurations, user-topic XP, and user task attempts.
- Prisma config constructs DATABASE_URL from environment variables and sets schema and migrations paths.
- Migration runner dynamically executes either migrate deploy (production) or db push (development) with graceful fallbacks and warnings.
- Topic config sync reads content configs and upserts into the database, logging successes and failures.

```mermaid
sequenceDiagram
participant Server as "Server Runtime"
participant Instrumentation as "instrumentation.ts"
participant Migrator as "runMigrations.ts"
participant PrismaCLI as "Prisma CLI"
participant DB as "PostgreSQL"
Server->>Instrumentation : "register()"
Instrumentation->>Migrator : "runMigrations()"
alt "Migrations exist"
Migrator->>PrismaCLI : "migrate deploy"
PrismaCLI->>DB : "Apply migrations"
else "No migrations"
Migrator->>PrismaCLI : "db push"
PrismaCLI->>DB : "Push schema"
end
```

**Diagram sources**
- [instrumentation.ts](file://instrumentation.ts#L1-L44)
- [lib/prisma/runMigrations.ts](file://lib/prisma/runMigrations.ts#L1-L69)
- [prisma.config.ts](file://prisma.config.ts#L1-L19)

**Section sources**
- [prisma/schema.prisma](file://prisma/schema.prisma#L1-L143)
- [prisma.config.ts](file://prisma.config.ts#L1-L19)
- [lib/prisma/runMigrations.ts](file://lib/prisma/runMigrations.ts#L1-L69)
- [lib/xp/syncTopicConfigs.ts](file://lib/xp/syncTopicConfigs.ts#L1-L174)

### Authentication and Session Management
- NextAuth configuration integrates Prisma adapter, JWT sessions, and multiple providers (Google, GitHub, Resend, Facebook).
- Session wrapper provides client-side session context with configurable refetch behavior.
- Middleware protects dashboard routes and redirects unauthenticated users to the login page.

```mermaid
sequenceDiagram
participant Client as "Client"
participant MW as "proxy.ts"
participant Auth as "NextAuth"
participant Session as "SessionWrapper"
participant Layout as "Root Layout"
Client->>MW : "Access /dashboard"
MW->>Auth : "getSession()"
alt "Unauthenticated"
MW-->>Client : "Redirect to login with referer"
else "Authenticated"
MW-->>Client : "Allow"
Client->>Layout : "Render"
Layout->>Session : "Wrap children"
Session-->>Client : "Provide session context"
end
```

**Diagram sources**
- [proxy.ts](file://proxy.ts#L1-L25)
- [lib/auth/authConfig.ts](file://lib/auth/authConfig.ts#L1-L83)
- [components/providers/SessionWrapper.tsx](file://components/providers/SessionWrapper.tsx#L1-L11)
- [app/layout.tsx](file://app/layout.tsx#L1-L46)

**Section sources**
- [lib/auth/authConfig.ts](file://lib/auth/authConfig.ts#L1-L83)
- [components/providers/SessionWrapper.tsx](file://components/providers/SessionWrapper.tsx#L1-L11)
- [proxy.ts](file://proxy.ts#L1-L25)

### Content and Topic Configuration Sync
- Topic configs are loaded from content/math/*/config.json and upserted into the database.
- Supports incremental updates and optional fields with null handling.
- Provides helpers to load individual or all topic configs.

**Section sources**
- [lib/xp/syncTopicConfigs.ts](file://lib/xp/syncTopicConfigs.ts#L1-L174)

## Dependency Analysis
The project's development dependencies include TypeScript, ESLint, Prettier, Tailwind CSS, and Sass. The Docker environment adds comprehensive container orchestration dependencies. Scripts orchestrate development, building, linting, Prisma operations, and Docker container management. Runtime dependencies include Next.js, NextAuth, Prisma client, and Firebase.

```mermaid
graph LR
PKG["package.json"]
ESLINT["eslint.config.mjs"]
TSCONFIG["tsconfig.json"]
POSTCSS["postcss.config.mjs"]
NEXTCONF["next.config.ts"]
PRISMA_CFG["prisma.config.ts"]
SCHEMA["prisma/schema.prisma"]
DOCKER["docker-compose.yml"]
DEV_COMPOSE["dev/docker-compose.dev.yml"]
RESET["reset.sh"]
DB_PASSWD["utils/db-passwd.sh"]
GEN_KEYS["utils/generate-keys.sh"]
ENV["database/supabase-project/.env<br/>131 Lines"]
PKG --> ESLINT
PKG --> TSCONFIG
PKG --> POSTCSS
PKG --> NEXTCONF
PKG --> PRISMA_CFG
PRISMA_CFG --> SCHEMA
DOCKER --> DEV_COMPOSE
DEV_COMPOSE --> RESET
RESET --> DB_PASSWD
RESET --> GEN_KEYS
ENV --> DOCKER
```

**Diagram sources**
- [package.json](file://package.json#L1-L63)
- [eslint.config.mjs](file://eslint.config.mjs#L1-L24)
- [tsconfig.json](file://tsconfig.json#L1-L35)
- [postcss.config.mjs](file://postcss.config.mjs#L1-L8)
- [next.config.ts](file://next.config.ts#L1-L10)
- [prisma.config.ts](file://prisma.config.ts#L1-L19)
- [prisma/schema.prisma](file://prisma/schema.prisma#L1-L143)
- [database/supabase-project/docker-compose.yml](file://database/supabase-project/docker-compose.yml#L1-L538)
- [database/supabase-project/dev/docker-compose.dev.yml](file://database/supabase-project/dev/docker-compose.dev.yml#L1-L45)
- [database/supabase-project/reset.sh](file://database/supabase-project/reset.sh#L1-L77)
- [database/supabase-project/utils/db-passwd.sh](file://database/supabase-project/utils/db-passwd.sh#L1-L158)
- [database/supabase-project/utils/generate-keys.sh](file://database/supabase-project/utils/generate-keys.sh#L1-L120)
- [database/supabase-project/.env](file://database/supabase-project/.env#L1-L131)

**Section sources**
- [package.json](file://package.json#L1-L63)

## Performance Considerations
- Use incremental TypeScript builds and isolated modules to speed up type checking during development.
- **Updated** The database directory is excluded from TypeScript compilation to improve build performance and reduce unnecessary file processing.
- Prefer migrate deploy over db push in production for deterministic schema evolution.
- Keep middleware minimal and cacheable where appropriate to reduce overhead.
- Leverage Next.js static generation and ISR for content-heavy pages.
- Optimize image loading with Next.js Image component and configured remote patterns.
- Use development compose files for hot reloading and live updates during development.
- **Updated** The comprehensive environment configuration enables optimal performance tuning through Supavisor pooler settings and connection pooling.

## Troubleshooting Guide
- Prisma migrations fail silently in Edge runtime: The instrumentation guard prevents migration execution in edge runtime and logs warnings.
- Database unreachable during startup: Both instrumentation and migration runner handle database errors gracefully and log warnings.
- Topic sync fails: Errors are caught and logged; check content/config.json validity and database connectivity.
- Authentication redirect loops: Verify middleware matcher and session provider configuration.
- Docker container startup failures: Check health checks and service dependencies in docker-compose.yml.
- Database connection issues: Verify POSTGRES_PASSWORD and connection string configurations.
- Service port conflicts: Review port mappings in docker-compose.dev.yml and adjust as needed.
- Environment variable issues: Use generate-keys.sh to regenerate credentials and verify .env file integrity.
- Google One Tap authentication not working: Check environment variables, verify origins, clear cookies, check console errors, wait for propagation.
- Migration errors: Use DIRECT_URL for migrations instead of pooled connection.
- **Updated** Environment configuration errors: Verify all 131 lines of .env file are properly set, especially security-critical variables like JWT_SECRET and database passwords.

**Section sources**
- [instrumentation.ts](file://instrumentation.ts#L1-L44)
- [lib/prisma/runMigrations.ts](file://lib/prisma/runMigrations.ts#L1-L69)
- [lib/xp/syncTopicConfigs.ts](file://lib/xp/syncTopicConfigs.ts#L1-L174)
- [proxy.ts](file://proxy.ts#L1-L25)
- [database/supabase-project/docker-compose.yml](file://database/supabase-project/docker-compose.yml#L1-L538)
- [database/supabase-project/utils/generate-keys.sh](file://database/supabase-project/utils/generate-keys.sh#L1-L120)
- [README.md](file://README.md#L144-L168)
- [database/supabase-project/.env](file://database/supabase-project/.env#L1-L131)

## Conclusion
This guide consolidates local development setup, configuration, and operational workflows for the Math App Next.js project, including comprehensive Docker-based development with Supabase services. The new comprehensive environment configuration provides production-ready settings for all aspects of the Supabase ecosystem. By following the documented practices—TypeScript strictness, ESLint rules, PostCSS/Tailwind integration, Prisma migrations, NextAuth integration, Docker container orchestration, and comprehensive environment management—you can maintain a robust, scalable, and contributor-friendly development environment with full backend-as-a-service functionality.

## Appendices

### Local Development Setup
- Install dependencies and run the development server using the scripts defined in package.json.
- Configure environment variables for authentication providers and database connection as required by prisma.config.ts and lib/auth/authConfig.ts.
- For Docker-based development, ensure Docker Desktop is installed and run `docker compose up -d` from the database/supabase-project directory.
- Use helper scripts for initial setup: `./utils/generate-keys.sh` for credentials and `./reset.sh` for environment cleanup.
- **Updated** Review and customize the comprehensive .env file with all 131 configuration lines for production-ready development.

**Section sources**
- [package.json](file://package.json#L1-L63)
- [prisma.config.ts](file://prisma.config.ts#L1-L19)
- [lib/auth/authConfig.ts](file://lib/auth/authConfig.ts#L1-L83)
- [database/supabase-project/utils/generate-keys.sh](file://database/supabase-project/utils/generate-keys.sh#L1-L120)
- [database/supabase-project/reset.sh](file://database/supabase-project/reset.sh#L1-L77)
- [database/supabase-project/.env](file://database/supabase-project/.env#L1-L131)

### Docker Development Environment
- Navigate to database/supabase-project and run `docker compose up -d` to start all Supabase services.
- Use `docker compose -f docker-compose.yml -f ./dev/docker-compose.dev.yml up` for development with hot reload.
- Access Supabase Studio at http://localhost:8000 and Kong API gateway at http://localhost:8000.
- Monitor container health with `docker compose ps` and view logs with `docker compose logs -f`.
- **Updated** The comprehensive environment configuration ensures all services are properly configured with the 131-line .env file.

**Section sources**
- [database/supabase-project/docker-compose.yml](file://database/supabase-project/docker-compose.yml#L1-L538)
- [database/supabase-project/dev/docker-compose.dev.yml](file://database/supabase-project/dev/docker-compose.dev.yml#L1-L45)
- [database/supabase-project/snippet-launch-supabase-docker.md](file://database/supabase-project/snippet-launch-supabase-docker.md#L1-L3)
- [database/supabase-project/.env](file://database/supabase-project/.env#L1-L131)

### Build and Deployment Preparation
- Use the build script to compile the Next.js application.
- Ensure Prisma migrations are applied in production using migrate deploy or db push depending on environment.
- Validate linting and formatting with ESLint and Prettier before committing.
- For Docker deployments, use the production docker-compose.yml without development overrides.
- **Updated** Prepare production deployment with comprehensive environment configuration from the .env file.

**Section sources**
- [package.json](file://package.json#L1-L63)
- [lib/prisma/runMigrations.ts](file://lib/prisma/runMigrations.ts#L1-L69)
- [eslint.config.mjs](file://eslint.config.mjs#L1-L24)
- [.prettierrc](file://.prettierrc)
- [database/supabase-project/docker-compose.yml](file://database/supabase-project/docker-compose.yml#L1-L538)
- [database/supabase-project/.env](file://database/supabase-project/.env#L1-L131)

### Code Quality Standards
- Enforce strict TypeScript compilation and disable explicit any to improve type safety.
- Use ESLint Next.js recommended configs and override ignores as needed.
- Apply Prettier with Tailwind plugin for consistent formatting.
- Include Docker Compose files in linting configuration for infrastructure code.

**Section sources**
- [tsconfig.json](file://tsconfig.json#L1-L35)
- [eslint.config.mjs](file://eslint.config.mjs#L1-L24)
- [.prettierrc](file://.prettierrc)

### Testing Strategies
- Unit test components and utilities under components/, lib/, and types/.
- Integration tests can validate middleware behavior and authentication flows.
- Snapshot testing for styled components leveraging Tailwind variants.
- Test Docker environment setup with container health checks and service availability.
- Validate database initialization scripts and role configurations.
- **Updated** Test comprehensive environment configuration with all 131 environment variables properly set.

### Debugging Techniques
- Use console logging in instrumentation and migration runner to trace startup issues.
- Enable verbose logging for Prisma client and NextAuth to inspect requests and responses.
- Inspect browser network tab for authentication redirects and middleware rewrites.
- Use Docker logs with `docker compose logs -f` to debug container issues.
- Monitor service health with `docker compose ps` and individual service logs.
- Validate environment variables with `docker compose exec db env` for database container.
- **Updated** Debug environment configuration issues using the comprehensive .env file structure.

### Environment Management
- Use generate-keys.sh to create initial authentication credentials.
- Run reset.sh with `-y` flag for automated environment cleanup.
- Update passwords regularly using db-passwd.sh for security compliance.
- Monitor image versions with versions.md for upgrade planning.
- **Updated** Manage comprehensive environment configuration through the 131-line .env file with proper security practices.

**Section sources**
- [database/supabase-project/utils/generate-keys.sh](file://database/supabase-project/utils/generate-keys.sh#L1-L120)
- [database/supabase-project/reset.sh](file://database/supabase-project/reset.sh#L1-L77)
- [database/supabase-project/utils/db-passwd.sh](file://database/supabase-project/utils/db-passwd.sh#L1-L158)
- [database/supabase-project/versions.md](file://database/supabase-project/versions.md#L1-L84)
- [database/supabase-project/.env](file://database/supabase-project/.env#L1-L131)

### Topic Config Sync on Startup
On server startup, the app automatically syncs all `content/math/*/config.json` files into the `topic_xp_config` PostgreSQL table (upsert by `topic_slug`).

To disable this behavior (e.g., for local work without a DB):
```env
SYNC_TOPICS_ON_START=false
```

**Section sources**
- [README.md](file://README.md#L96-L105)
- [instrumentation.ts](file://instrumentation.ts#L21-L22)

### Useful Commands
#### Database Management
```bash
# Open Prisma Studio (database GUI)
bun prisma:studio

# Generate Prisma Client
bun prisma:generate

# Create and apply migrations
bun prisma:migrate

# Push schema changes without migrations
bun prisma:push

# Deploy migrations (production)
bun prisma:migrate:deploy
```

#### Docker Commands
```bash
# Start Supabase containers
cd database/supabase-project
docker compose up -d

# Stop containers
docker compose down

# View logs
docker compose logs -f

# Restart containers
docker compose restart
```

#### Environment Management
```bash
# Generate comprehensive Supabase credentials
cd database/supabase-project
./utils/generate-keys.sh

# Update database passwords
./utils/db-passwd.sh

# Reset environment to defaults
./reset.sh
```

**Section sources**
- [README.md](file://README.md#L106-L143)
- [package.json](file://package.json#L5-L16)
- [database/supabase-project/utils/generate-keys.sh](file://database/supabase-project/utils/generate-keys.sh#L1-L120)
- [database/supabase-project/utils/db-passwd.sh](file://database/supabase-project/utils/db-passwd.sh#L1-L158)
- [database/supabase-project/reset.sh](file://database/supabase-project/reset.sh#L1-L77)