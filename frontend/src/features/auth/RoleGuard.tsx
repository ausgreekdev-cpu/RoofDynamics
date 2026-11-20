'use client'

import React from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { can, hasRole } from './rbac'
import type { Permission, Role } from './types'

interface RoleGuardProps {
  children: React.ReactNode
  /** Allowed roles (OR) */
  roles?: Role[]
  /** Required permission (AND with roles when both supplied) */
  permission?: Permission
  fallback?: React.ReactNode
}

/** Gate UI by role/permission using the current AuthContext user role. */
export function RoleGuard({ children, roles, permission, fallback = null }: RoleGuardProps) {
  const { user } = useAuth()
  const role = user?.role

  // Developers have platform-wide access.
  if (role === "developer") return <>{children}</>

  const roleOk = !roles || hasRole(role, roles)
  const permissionOk = !permission || can(role, permission)

  return roleOk && permissionOk ? <>{children}</> : <>{fallback}</>
}
