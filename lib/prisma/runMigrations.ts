/**
 * Run Prisma migrations on startup
 * This file is loaded dynamically to avoid Edge Runtime analysis
 */

export async function runMigrations() {
  // This function runs only in Node.js runtime
  if (typeof process.versions.node === 'undefined') {
    return;
  }

  if (process.env.RUN_MIGRATIONS_ON_START === 'false') {
    return;
  }

  try {
    // Load Node.js modules
    const fs = require('fs');
    const path = require('path');
    const { execSync } = require('child_process');

    const migrationsPath = path.join(process.cwd(), 'prisma', 'migrations');
    const hasMigrations = fs.existsSync(migrationsPath);

    if (hasMigrations) {
      // Use migrate deploy if migrations exist (production approach)
      console.log('[migrations] Running Prisma migrations...');
      execSync('npx prisma migrate deploy --config ./prisma.config.ts', {
        stdio: 'inherit',
        env: process.env,
      });
      console.log('[migrations] Migrations completed successfully');
    } else {
      // Use db push if no migrations exist (development approach)
      console.log('[migrations] No migrations found, using db push...');
      execSync('npx prisma db push --config ./prisma.config.ts', {
        stdio: 'inherit',
        env: process.env,
      });
      console.log('[migrations] Database schema pushed successfully');
      console.warn(
        '[migrations] Consider creating migrations with: npm run prisma:migrate',
      );
    }
  } catch (error: any) {
    // Don't crash the app if migrations fail
    if (error?.code === 'P1001' || error?.message?.includes("Can't reach database")) {
      console.warn('[migrations] Database not available, skipping migrations:', error.message);
      return;
    }

    console.error('[migrations] Failed to run migrations:', error.message);
    // In development, try db push as fallback if migrate deploy failed
    if (process.env.NODE_ENV === 'development' && error?.status !== 0) {
      try {
        console.log('[migrations] Attempting db push as fallback...');
        const { execSync } = require('child_process');
        execSync('npx prisma db push --config ./prisma.config.ts', {
          stdio: 'inherit',
          env: process.env,
        });
        console.log('[migrations] Db push completed successfully');
      } catch (pushError: any) {
        console.error('[migrations] Db push also failed:', pushError.message);
      }
    }
  }
}
