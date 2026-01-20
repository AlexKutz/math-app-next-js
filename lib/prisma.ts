import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Create a connection pool for Prisma adapter
const pool = new Pool({
  host: process.env.AUTH_DATABASE_HOST,
  port: Number(process.env.AUTH_DATABASE_PORT),
  user: process.env.AUTH_DATABASE_USER,
  password: process.env.AUTH_DATABASE_PASSWORD,
  database: process.env.AUTH_DATABASE_NAME,
});

const adapter = new PrismaPg(pool);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    // log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    log: ['error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
