import { defineConfig } from 'drizzle-kit'
import dotenv from 'dotenv'

dotenv.config()

export default defineConfig({
  schema: './src/server/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    // Prisma-style `?schema=` is not a valid libpq parameter for postgres.js.
    url: (process.env.DATABASE_URL || '')
      .replace(/([?&])schema=[^&]*&?/, (_m, p: string) => (p === '?' ? '?' : ''))
      .replace(/\?$/, ''),
  },
  verbose: true,
  strict: true,
})
