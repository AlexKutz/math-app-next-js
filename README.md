## Create .env

Generate AUTH_SECRET `openssl rand -base64 32`

```
NEXTAUTH_URL="http://localhost:3000"

EMAIL_FROM=""
EMAIL_SERVER_HOST=""
EMAIL_SERVER_PORT=""
EMAIL_SERVER_USER=""
EMAIL_SERVER_PASSWORD=""

# Google OAuth Configuration
AUTH_GOOGLE_ID=""
NEXT_PUBLIC_GOOGLE_CLIENT_ID=""
AUTH_GOOGLE_SECRET=""

# GitHub OAuth Configuration
AUTH_GITHUB_ID=""
AUTH_GITHUB_SECRET=""

# Facebook OAuth Configuration
AUTH_FACEBOOK_ID=""
AUTH_FACEBOOK_SECRET=""

# JWT Secret for Authentication
AUTH_SECRET=""

# PostgreSQL Database Configuration
AUTH_DATABASE_HOST=""
AUTH_DATABASE_PORT=""
AUTH_DATABASE_NAME=""
AUTH_DATABASE_USER=""
AUTH_DATABASE_PASSWORD=""

AUTH_RESEND_KEY=""
AUTH_RESEND_FROM="auth@mail.alexkutz.xyz"
```

## Topic config sync on startup

On server startup (Node runtime), the app automatically syncs all `content/math/*/config.json` files into Postgres table `topic_xp_config` (upsert by `topic_slug`).

To disable this behavior (e.g. for local work without a DB), set:

```
SYNC_TOPICS_ON_START=false
```
