/** Typed auth contract — allows Supabase and local-JWT adapters (Guardrail #3). */
export type Role = 'owner' | 'admin' | 'manager' | 'staff' | 'crew' | 'viewer'

export type Permission =
  | 'projects:read'
  | 'projects:write'
  | 'measurement:read'
  | 'measurement:write'
  | 'reports:read'
  | 'reports:export'
  | 'crm:read'
  | 'crm:manage'
  | 'whs:sign'
  | 'fleet:manage'
  | 'operations:manage'
  | 'billing:read'
  | 'billing:manage'
  | 'saas:read'
  | 'saas:admin'

export interface AuthSession {
  accessToken: string
  userId: string
  email?: string
  role: Role
  tenantId?: string
  provider: 'supabase' | 'local'
}

export interface AuthAdapter {
  readonly name: 'supabase' | 'local'
  getSession(): Promise<AuthSession | null>
  signInWithPassword(email: string, password: string): Promise<AuthSession>
  signInWithOAuth(provider: 'google' | 'azure' | 'github'): Promise<void>
  signOut(): Promise<void>
}
