## Create .env

Generate AUTH_SECRET `openssl rand -base64 32`

## Topic config sync on startup

On server startup (Node runtime), the app automatically syncs all `content/math/*/config.json` files into Postgres table `topic_xp_config` (upsert by `topic_slug`).

To disable this behavior (e.g. for local work without a DB), set:

```
SYNC_TOPICS_ON_START=false
```

http://localhost:8000/ - supabase dashboard

bun prisma:studio to inspect database