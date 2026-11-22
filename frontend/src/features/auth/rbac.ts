/** Client-side RBAC permission matrix. Mirrors backend/src/server/auth/rbac.ts. */
import type { Permission, Role } from './types'

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  developer: [
    'projects:read', 'projects:write', 'measurement:read', 'measurement:write',
    'reports:read', 'reports:export', 'crm:read', 'crm:manage', 'whs:sign',
    'fleet:manage', 'operations:manage', 'billing:read', 'billing:manage',
    'saas:read', 'saas:admin', 'dev:tools',
  ],
  owner: [
    'projects:read', 'projects:write', 'measurement:read', 'measurement:write',
    'reports:read', 'reports:export', 'crm:read', 'crm:manage', 'whs:sign',
    'fleet:manage', 'operations:manage', 'billing:read', 'billing:manage',
    'saas:read', 'saas:admin',
  ],
  admin: [
    'projects:read', 'projects:write', 'measurement:read', 'measurement:write',
    'reports:read', 'reports:export', 'crm:read', 'crm:manage', 'whs:sign',
    'fleet:manage', 'operations:manage', 'billing:read', 'billing:manage', 'saas:read',
  ],
  manager: [
    'projects:read', 'projects:write', 'measurement:read', 'measurement:write',
    'reports:read', 'crm:read', 'crm:manage', 'whs:sign', 'fleet:manage',
    'operations:manage',
  ],
  staff: ['projects:read', 'measurement:read', 'reports:read', 'crm:read'],
  crew: ['projects:read', 'measurement:read', 'whs:sign'],
  viewer: ['projects:read', 'measurement:read', 'reports:read'],
  customer: ['projects:read', 'reports:read'],
}

export function can(role: string | undefined, permission: Permission): boolean {
  if (!role) return false
  const grants = ROLE_PERMISSIONS[role as Role]
  if (!grants) return false
  return (grants as string[]).includes('*') || grants.includes(permission)
}

export function hasRole(role: string | undefined, roles: Role[]): boolean {
  return !!role && roles.includes(role as Role)
}
