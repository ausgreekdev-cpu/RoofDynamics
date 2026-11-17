/**
 * Server-side Supabase Auth verification.
 * Uses the service-role key only when configured; otherwise returns null so the
 * existing local JWT flow continues (Guardrail #6 — no deletion until verified).
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { env } from '../../env'
import { normalizeRole, type Role } from './rbac'

let adminClient: SupabaseClient | null = null

export function getSupabaseAdmin(): SupabaseClient | null {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return null
  if (!adminClient) {
    adminClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  }
  return adminClient
}

export interface VerifiedIdentity {
  userId: string
  email?: string
  role: Role
  tenantId?: string
  provider: 'supabase'
}

/** Verify a Supabase access token and map app_metadata claims. */
export async function verifySupabaseToken(token: string): Promise<VerifiedIdentity | null> {
  const client = getSupabaseAdmin()
  if (!client) return null
  const { data, error } = await client.auth.getUser(token)
  if (error || !data.user) return null

  const meta = (data.user.app_metadata ?? {}) as Record<string, unknown>
  return {
    userId: data.user.id,
    email: data.user.email,
    role: normalizeRole(meta.role),
    tenantId: meta.tenant_id ? String(meta.tenant_id) : undefined,
    provider: 'supabase',
  }
}
