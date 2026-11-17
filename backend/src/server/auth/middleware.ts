import type { Request, Response, NextFunction } from 'express'
import type { TenantRequest } from '../../middleware/tenant'
import { can, normalizeRole, type Permission, type Role } from './rbac'

export interface RbacRequest extends TenantRequest {
  authRole?: Role
  authProvider?: 'supabase' | 'local'
}

/** Attach a role to the request from the auth pipeline (Express middleware). */
export function attachRole(req: Request, _res: Response, next: NextFunction) {
  const r = req as RbacRequest
  const source = req as Request & { userRole?: string; authProvider?: 'supabase' | 'local' }
  r.authRole = normalizeRole(source.userRole)
  r.authProvider = source.authProvider || 'local'
  next()
}

/** Explicit role attach (useful in unit tests or custom pipelines). */
export function withRole(role: string | undefined, provider: 'supabase' | 'local') {
  return (req: Request, _res: Response, next: NextFunction) => {
    const r = req as RbacRequest
    r.authRole = normalizeRole(role)
    r.authProvider = provider
    next()
  }
}

/** Require one of the given roles. */
export function requireRoles(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const r = req as RbacRequest
    if (!r.authRole || !roles.includes(r.authRole)) {
      res.status(403).json({ error: 'Insufficient role', required: roles })
      return
    }
    next()
  }
}

/** Require a specific permission from the RBAC matrix. */
export function requirePermission(permission: Permission) {
  return (req: Request, res: Response, next: NextFunction) => {
    const r = req as RbacRequest
    if (!can(r.authRole, permission)) {
      res.status(403).json({ error: 'Insufficient permission', required: permission })
      return
    }
    next()
  }
}
