export async function register() {
  // Runs once per server instance (Node runtime) on startup.
  // We keep it best-effort so a DB issue doesn't prevent the app from starting.

  if (process.env.NEXT_RUNTIME === 'edge') return;

  // Run Prisma migrations on startup
  // Load dynamically to avoid Edge Runtime analysis
  try {
    const { runMigrations } = await import('./lib/prisma/runMigrations');
    await runMigrations();
  } catch (error: any) {
    // Silently fail if migrations module can't be loaded (e.g., in Edge Runtime)
    if (error?.message?.includes('Cannot find module') || error?.code === 'MODULE_NOT_FOUND') {
      // This is expected in Edge Runtime, so we ignore it
      return;
    }
    console.error('[migrations] Failed to load migrations module:', error.message);
  }

  // Sync topic configs
  if (process.env.SYNC_TOPICS_ON_START === 'false') return;

  try {
    const { syncTopicConfigs } = await import('./lib/xp/syncTopicConfigs');
    const result = await syncTopicConfigs();

    if (result?.success) {
      console.log(
        `[topic-sync] synced ${result.synced}/${result.total} topic configs`,
      );
    } else {
      console.error('[topic-sync] failed:', result?.error ?? result);
    }
  } catch (error: any) {
    // Don't crash the app if database is not available
    if (error?.code === 'P1001' || error?.message?.includes("Can't reach database")) {
      console.warn('[topic-sync] Database not available, skipping sync:', error.message);
    } else {
      console.error('[topic-sync] failed:', error);
    }
  }
}
