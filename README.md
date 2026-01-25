# Math App - Next.js

## Prerequisites

- [Bun](https://bun.sh/) (v1.0 or higher)
- [Docker](https://www.docker.com/) and Docker Compose
- [Git](https://git-scm.com/)

## Development Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd math-app-next-js
```

### 2. Install Dependencies

```bash
bun install
```

### 3. Start the Database (Supabase) (for local development)

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

### 4. Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Generate an `AUTH_SECRET`:
   ```bash
   openssl rand -base64 32
   ```

### 5. Set Up Google Cloud Console (for Google One Tap and Oauth2)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google+ API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure OAuth consent screen:
   - User Type: External (for testing) or Internal
   - Add authorized domains
   - Add test users if needed
6. Create OAuth 2.0 Client ID:
   - Application type: **Web application**
   - **Authorized JavaScript origins**:
     - `http://localhost:3000`
     - `http://localhost`
   - **Authorized redirect URIs**:
     - `http://localhost:3000/api/auth/callback/google`
7. Copy the **Client ID** and **Client Secret** to your `.env` file

**IMPORTANT:** Both `AUTH_GOOGLE_ID` and `NEXT_PUBLIC_GOOGLE_CLIENT_ID` must have the **same value**.

### 6. Apply schema to db (Prisma)

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

### 7. Start the Development Server

```bash
bun dev
```

The application will be available at http://localhost:3000

## Topic Config Sync on Startup

On server startup, the app automatically syncs all `content/math/*/config.json` files into the `topic_xp_config` PostgreSQL table (upsert by `topic_slug`).

To disable this behavior (e.g., for local work without a DB):

```env
SYNC_TOPICS_ON_START=false
```

## Useful Commands

### Database Management

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

### Docker Commands

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

## Troubleshooting

### Google One Tap Authentication Not Working

1. **Check environment variables**: Ensure `AUTH_GOOGLE_ID` and `NEXT_PUBLIC_GOOGLE_CLIENT_ID` match
2. **Verify origins**: Confirm `http://localhost:3000` is in Google Cloud Console authorized origins
3. **Clear cookies**: Google One Tap has aggressive cooldowns; try incognito mode
4. **Check console errors**: Look for CORS or FedCM errors in browser DevTools
5. **Wait for propagation**: OAuth changes can take 5-10 minutes to apply

### Database Connection Issues

1. Ensure Docker containers are running: `docker ps`
2. Check if ports 5432 and 6543 are available
3. Verify `DATABASE_URL` matches your Supabase configuration
4. Try direct connection with `DIRECT_URL` for troubleshooting

### Migration Errors

Use `DIRECT_URL` for migrations instead of pooled connection:
```bash
# Ensure DIRECT_URL is set in .env
bun prisma:migrate
```

## Project Structure

- `/app` - Next.js App Router pages and API routes
- `/components` - React components
- `/content` - MDX lesson content and task definitions
- `/lib` - Utility functions and services
- `/prisma` - Database schema and migrations
- `/database/supabase-project` - Supabase Docker configuration

## License