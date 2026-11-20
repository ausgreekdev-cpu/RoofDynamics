import { describe, it, expect } from 'vitest'
import { can, hasRole, ROLE_PERMISSIONS } from './rbac'

describe('client RBAC', () => {
  it('uses the same role set as the server', () => {
    expect(Object.keys(ROLE_PERMISSIONS)).toEqual([
      'developer', 'owner', 'admin', 'manager', 'staff', 'crew', 'viewer',
    ])
  })

  it('checks permissions', () => {
    expect(can('owner', 'saas:admin')).toBe(true)
    expect(can('staff', 'measurement:write')).toBe(false)
    expect(can('crew', 'whs:sign')).toBe(true)
    expect(can('viewer', 'projects:read')).toBe(true)
  })

  it('checks roles', () => {
    expect(hasRole('admin', ['owner', 'admin'])).toBe(true)
    expect(hasRole('crew', ['owner', 'admin'])).toBe(false)
    expect(hasRole(undefined, ['owner'])).toBe(false)
  })
})
