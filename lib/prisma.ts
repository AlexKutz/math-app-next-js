import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

// 1. Connect to Supavisor (Port 6543)
const connectionString = `${process.env.DATABASE_URL}`

// 2. Create the connection pool
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)

// 3. Create the Prisma Client using the adapter
// Note: We use 'adapter' instead of 'datasourceUrl'
const prismaClientSingleton = () => {
  return new PrismaClient({ adapter })
}

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof prismaClientSingleton> | undefined
}

const prisma = globalForPrisma.prisma ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma