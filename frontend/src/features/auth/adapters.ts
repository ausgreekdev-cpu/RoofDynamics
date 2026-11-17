/**
 * Auth adapters. Supabase is used when both URL and anon key are configured;
 * otherwise the existing local JWT flow is preserved (Guardrail #6).
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { env } from '../../env'
import type { AuthAdapter, AuthSession, Role } from './types'

let supabaseClient: SupabaseClient | null = null

export function getSupabaseClient(): SupabaseClient | null {
  if (!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_ANON_KEY) return null
  if (!supabaseClient) {
    supabaseClient = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  }
  return supabaseClient
}

function mapRole(appMetadata: unknown, userMetadata: unknown): Role {
  const meta = (appMetadata && typeof appMetadata === 'object' ? appMetadata : {}) as Record<string, unknown>
  const fallback = (userMetadata && typeof userMetadata === 'object' ? userMetadata : {}) as Record<string, unknown>
  const raw = String(meta.role ?? fallback.role ?? 'staff')
  const valid: Role[] = ['owner', 'admin', 'manager', 'staff', 'crew', 'viewer']
  return (valid.includes(raw as Role) ? raw : 'staff') as Role
}

const supabaseAdapter: AuthAdapter = {
  name: 'supabase',
  async getSession() {
    const client = getSupabaseClient()
    if (!client) return null
    const { data } = await client.auth.getSession()
    const session = data.session
    if (!session) return null
    return {
      accessToken: session.access_token,
      userId: session.user.id,
      email: session.user.email,
      role: mapRole(session.user.app_metadata, session.user.user_metadata),
      tenantId: String((session.user.app_metadata as Record<string, unknown>)?.tenant_id ?? ''),
      provider: 'supabase',
    }
  },
  async signInWithPassword(email, password) {
    const client = getSupabaseClient()
    if (!client) throw new Error('Supabase is not configured')
    const { data, error } = await client.auth.signInWithPassword({ email, password })
    if (error) throw error
    if (!data.session) throw new Error('No session returned from Supabase')
    return {
      accessToken: data.session.access_token,
      userId: data.session.user.id,
      email: data.session.user.email,
      role: mapRole(data.session.user.app_metadata, data.session.user.user_metadata),
      tenantId: String((data.session.user.app_metadata as Record<string, unknown>)?.tenant_id ?? ''),
      provider: 'supabase',
    }
  },
  async signInWithOAuth(provider: 'google' | 'azure' | 'github') {
    const client = getSupabaseClient()
    if (!client) throw new Error('Supabase is not configured')
    const { error } = await client.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) throw error
  },
  async signOut() {
    const client = getSupabaseClient()
    if (client) await client.auth.signOut()
  },
}

const localAdapter: AuthAdapter = {
  name: 'local',
  async getSession() {
    const token = localStorage.getItem('rd_token')
    if (!token) return null
    const raw = localStorage.getItem('rd_tenant')
    let tenantId = ''
    let role: Role = 'staff'
    try {
      if (raw) {
        const parsed = JSON.parse(raw)
        tenantId = parsed.id ?? ''
      }
      const userRaw = localStorage.getItem('rd_user')
      if (userRaw) {
        const u = JSON.parse(userRaw)
        const r = String(u.role ?? 'staff')
        if (['owner', 'admin', 'manager', 'staff', 'crew', 'viewer'].includes(r)) role = r as Role
      }
    } catch {
      /* keep defaults */
    }
    return { accessToken: token, userId: 'local-user', role, tenantId, provider: 'local' }
  },
  async signInWithPassword(email, _password) {
    // Local demo sign-in is handled by Login.tsx against /api/auth/login.
    return {
      accessToken: localStorage.getItem('rd_token') || 'local-token',
      userId: 'local-user',
      email,
      role: 'admin',
      provider: 'local',
    }
  },
  async signInWithOAuth() {
    throw new Error('OAuth is only available with Supabase configured')
  },
  async signOut() {
    localStorage.removeItem('rd_token')
    localStorage.removeItem('rd_tenant')
    localStorage.removeItem('rd_tenant_id')
    localStorage.removeItem('rd_user')
  },
}

/** Select the configured adapter. Supabase wins when credentials exist. */
export function getAuthAdapter(): AuthAdapter {
  return getSupabaseClient() ? supabaseAdapter : localAdapter
}
