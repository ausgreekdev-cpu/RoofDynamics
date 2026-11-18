/**
 * Centralized runtime environment validation (Guardrail #5).
 * Vite exposes client variables through import.meta.env. All client-side
 * variables are declared here with Zod schemas. See .env.example for comments.
 */
import { z } from 'zod'

const boolFromString = z
  .union([z.boolean(), z.enum(['true', 'false', '1', '0'])])
  .transform((v) => v === true || v === 'true' || v === '1')

const schema = z.object({
  DEV: z.boolean().default(false),
  PROD: z.boolean().default(false),
  MODE: z.string().default('production'),

  // Core (currently used)
  VITE_API_BASE: z.string().default('/api'),
  VITE_AI_LLM_ENDPOINT: z.string().url().optional(),
  VITE_AI_API_KEY: z.string().default(''),

  // Auth (phase 1.5)
  VITE_SUPABASE_URL: z.string().url().optional(),
  VITE_SUPABASE_ANON_KEY: z.string().optional(),

  // Maps & 3D (phases 2.3, 2.4)
  VITE_MAPBOX_TOKEN: z.string().optional(),

  // Observability & billing (phases 1.7, 3.5)
  VITE_SENTRY_DSN: z.string().url().optional(),
  VITE_STRIPE_PUBLISHABLE_KEY: z.string().optional(),

  // Storage (phase 3.6)
  VITE_R2_PUBLIC_URL: z.string().url().optional(),

  // Notification providers + integration sandbox (phases 3.2, 4.1)
  VITE_EMAIL_PROVIDER: z.enum(['mock', 'resend', 'sendgrid']).default('mock'),
  VITE_SMS_PROVIDER: z.enum(['mock', 'twilio']).default('mock'),
  VITE_ENABLE_MOCK_INTEGRATIONS: boolFromString.default(true),

  // Serve the API from the deterministic local sandbox when no backend is
  // deployed (production demo). Local dev keeps talking to the real API.
  VITE_USE_SANDBOX_API: boolFromString.default(false),
})

export type ClientEnv = z.infer<typeof schema>

function parseEnvironment(): ClientEnv {
  // Vite statically replaces import.meta.env.* — read defensively.
  const meta = (import.meta as any).env ?? {}
  const raw = {
    DEV: meta.DEV,
    PROD: meta.PROD,
    MODE: meta.MODE,
    VITE_API_BASE: meta.VITE_API_BASE,
    VITE_AI_LLM_ENDPOINT: meta.VITE_AI_LLM_ENDPOINT || undefined,
    VITE_AI_API_KEY: meta.VITE_AI_API_KEY,
    VITE_SUPABASE_URL: meta.VITE_SUPABASE_URL || undefined,
    VITE_SUPABASE_ANON_KEY: meta.VITE_SUPABASE_ANON_KEY,
    VITE_MAPBOX_TOKEN: meta.VITE_MAPBOX_TOKEN,
    VITE_SENTRY_DSN: meta.VITE_SENTRY_DSN || undefined,
    VITE_STRIPE_PUBLISHABLE_KEY: meta.VITE_STRIPE_PUBLISHABLE_KEY,
    VITE_R2_PUBLIC_URL: meta.VITE_R2_PUBLIC_URL || undefined,
    VITE_EMAIL_PROVIDER: meta.VITE_EMAIL_PROVIDER,
    VITE_SMS_PROVIDER: meta.VITE_SMS_PROVIDER,
    VITE_ENABLE_MOCK_INTEGRATIONS: meta.VITE_ENABLE_MOCK_INTEGRATIONS,
    VITE_USE_SANDBOX_API: meta.VITE_USE_SANDBOX_API,
  }

  const result = schema.safeParse(raw)
  if (result.success) return result.data

  // Never crash the client on a bad env value — log and fall back to schema defaults.
  console.error('[env] Invalid client environment variables:', result.error.issues)
  return schema.parse({})
}

export const env = parseEnvironment()
