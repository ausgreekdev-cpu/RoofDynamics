/**
 * Centralized runtime environment validation (Guardrail #5).
 * Every variable consumed by the backend is declared here with a Zod schema.
 * Future-service variables are optional so development never breaks; see
 * .env.example for documented comments describing each variable.
 */
import { z } from 'zod'
import dotenv from 'dotenv'

dotenv.config()

const boolFromString = z
  .union([z.boolean(), z.enum(['true', 'false', '1', '0'])])
  .transform((v) => v === true || v === 'true' || v === '1')

const optionalUrl = z.string().url().optional()

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Core (currently used)
  DATABASE_URL: optionalUrl,
  JWT_SECRET: z.string().min(1).default('roofdynamics-dev-secret-change-in-production'),
  ACCESS_TOKEN_EXPIRY: z.string().default('15m'),
  REFRESH_TOKEN_EXPIRY: z.string().default('7d'),
  PORT: z.coerce.number().int().min(1).max(65535).default(5000),
  CLIENT_URL: z.string().url().default('http://localhost:5173'),
  AI_LLM_ENDPOINT: optionalUrl,
  AI_API_KEY: z.string().default(''),
  ABR_GUID: z.string().default(''),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),

  // Observability (phase 1.7)
  SENTRY_DSN: optionalUrl,

  // Supabase Auth (phase 1.5)
  SUPABASE_URL: optionalUrl,
  SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),

  // Cache & queues (phase 1.6)
  UPSTASH_REDIS_REST_URL: optionalUrl,
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  INNGEST_EVENT_KEY: z.string().optional(),
  INNGEST_SIGNING_KEY: z.string().optional(),
  INNGEST_DEV: boolFromString.default(false),

  // Object storage / maps (phases 3.6, 2.3)
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET: z.string().optional(),
  R2_PUBLIC_URL: optionalUrl,
  AWS_REGION: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  MAPBOX_TOKEN: z.string().optional(),

  // Billing (phase 3.5)
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PUBLISHABLE_KEY: z.string().optional(),

  // B2B integration credentials (phase 3.2) — optional; sandbox used when absent
  GREENSKY_API_KEY: z.string().optional(),
  NOAA_API_KEY: z.string().optional(),
  ABC_SUPPLY_API_KEY: z.string().optional(),
  BEACON_API_KEY: z.string().optional(),
  XACTIMATE_API_KEY: z.string().optional(),

  // Integration sandbox toggle (phase 4.1)
  ENABLE_MOCK_INTEGRATIONS: boolFromString.default(true),
})

export type ServerEnv = z.infer<typeof schema>

function parseEnvironment(): ServerEnv {
  const raw = {
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL,
    JWT_SECRET: process.env.JWT_SECRET,
    PORT: process.env.PORT,
    CLIENT_URL: process.env.CLIENT_URL,
    AI_LLM_ENDPOINT: process.env.AI_LLM_ENDPOINT,
    AI_API_KEY: process.env.AI_API_KEY,
    ABR_GUID: process.env.ABR_GUID,
    LOG_LEVEL: process.env.LOG_LEVEL,
    SENTRY_DSN: process.env.SENTRY_DSN,
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    INNGEST_EVENT_KEY: process.env.INNGEST_EVENT_KEY,
    INNGEST_SIGNING_KEY: process.env.INNGEST_SIGNING_KEY,
    INNGEST_DEV: process.env.INNGEST_DEV,
    R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID,
    R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
    R2_BUCKET: process.env.R2_BUCKET,
    R2_PUBLIC_URL: process.env.R2_PUBLIC_URL,
    AWS_REGION: process.env.AWS_REGION,
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    MAPBOX_TOKEN: process.env.MAPBOX_TOKEN,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY,
    GREENSKY_API_KEY: process.env.GREENSKY_API_KEY,
    NOAA_API_KEY: process.env.NOAA_API_KEY,
    ABC_SUPPLY_API_KEY: process.env.ABC_SUPPLY_API_KEY,
    BEACON_API_KEY: process.env.BEACON_API_KEY,
    XACTIMATE_API_KEY: process.env.XACTIMATE_API_KEY,
    ENABLE_MOCK_INTEGRATIONS: process.env.ENABLE_MOCK_INTEGRATIONS,
  }

  const result = schema.safeParse(raw)
  if (result.success) return result.data

  const details = result.error.issues
    .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
    .join('\n')
  throw new Error(`Invalid backend environment variables:\n${details}\nSee .env.example for guidance.`)
}

export const env = parseEnvironment()

/** Production readiness check — call explicitly at deploy time, not in dev/tests. */
export function assertProductionEnv(): void {
  const required: Array<keyof ServerEnv> = [
    'DATABASE_URL',
    'JWT_SECRET',
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
  ]
  const missing = required.filter((key) => !env[key])
  if (missing.length > 0) {
    throw new Error(`Missing required production environment variables: ${missing.join(', ')}`)
  }
}
