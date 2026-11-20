/** Server-side RBAC matrix — authoritative. Mirrored in frontend/src/features/auth/rbac.ts. */
export type Role = 'developer' | 'owner' | 'admin' | 'manager' | 'staff' | 'crew' | 'viewer'

export type Permission =
  | 'projects:read' | 'projects:write'
  | 'measurement:read' | 'measurement:write'
  | 'reports:read' | 'reports:export'
  | 'crm:read' | 'crm:manage'
  | 'whs:sign' | 'fleet:manage' | 'operations:manage'
  | 'billing:read' | 'billing:manage'
  | 'saas:read' | 'saas:admin'
  | 'dev:tools'
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  developer: ['projects:read', 'projects:write', 'measurement:read', 'measurement:write',
    'reports:read', 'reports:export', 'crm:read', 'crm:manage', 'whs:sign',
    'fleet:manage', 'operations:manage', 'billing:read', 'billing:manage',
    'saas:read', 'saas:admin', 'dev:tools'],
  owner: ['projects:read', 'projects:write', 'measurement:read', 'measurement:write',
    'reports:read', 'reports:export', 'crm:read', 'crm:manage', 'whs:sign',
    'fleet:manage', 'operations:manage', 'billing:read', 'billing:manage', 'saas:read', 'saas:admin'],
  admin: ['projects:read', 'projects:write', 'measurement:read', 'measurement:write',
    'reports:read', 'reports:export', 'crm:read', 'crm:manage', 'whs:sign',
    'fleet:manage', 'operations:manage', 'billing:read', 'billing:manage', 'saas:read'],
  manager: ['projects:read', 'projects:write', 'measurement:read', 'measurement:write',
    'reports:read', 'crm:read', 'crm:manage', 'whs:sign', 'fleet:manage', 'operations:manage'],
  staff: ['projects:read', 'measurement:read', 'reports:read', 'crm:read'],
  crew: ['projects:read', 'measurement:read', 'whs:sign'],
  viewer: ['projects:read', 'measurement:read', 'reports:read'],
}

export function can(role: string | undefined, permission: Permission): boolean {
  if (!role) return false
  const grants = ROLE_PERMISSIONS[role as Role]
  if (!grants) return false
  return grants.includes(permission)
}

export function normalizeRole(raw: unknown): Role {
  const value = String(raw ?? 'staff')
  const valid: Role[] = ['developer', 'owner', 'admin', 'manager', 'staff', 'crew', 'viewer']
  return (valid.includes(value as Role) ? value : 'staff') as Role
}
