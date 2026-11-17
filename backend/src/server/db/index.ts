/**
 * Drizzle client backed by postgres.js, using the validated DATABASE_URL.
 * Prisma client remains available in src/lib/prisma.ts until phase 1.4 verification.
 */
import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import { env } from '../../env'
import * as schema from './schema'

if (!env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required for the Drizzle database client. See .env.example.')
}

// Prisma-style `?schema=` params are not valid libpq settings — strip them.
const connectionUrl = env.DATABASE_URL.replace(/([?&])schema=[^&]*&?/, (match, prefix: string) =>
  prefix === '?' ? '?' : ''
).replace(/\?$/, '')

const client = postgres(connectionUrl, { max: 10 })

export const db = drizzle(client, { schema })
export { schema }
export type Database = typeof db
