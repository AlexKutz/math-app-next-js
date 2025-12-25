import { Pool } from 'pg'

export const pool = new Pool({
  host: process.env.AUTH_DATABASE_HOST,
  port: Number(process.env.AUTH_DATABASE_PORT),
  user: process.env.AUTH_DATABASE_USER,
  password: process.env.AUTH_DATABASE_PASSWORD,
  database: process.env.AUTH_DATABASE_NAME,
})
