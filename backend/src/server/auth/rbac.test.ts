import type { Request, Response, NextFunction } from 'express'
import { can, normalizeRole, ROLE_PERMISSIONS } from './rbac'
import { requirePermission, requireRoles, attachRole, type RbacRequest } from './middleware'

describe('RBAC matrix', () => {
  it('grants owner every permission', () => {
    expect(can('owner', 'saas:admin')).toBe(true)
    expect(can('owner', 'billing:manage')).toBe(true)
    expect(can('owner', 'measurement:write')).toBe(true)
  })

  it('restricts SaaS admin to owner', () => {
    expect(can('admin', 'saas:admin')).toBe(false)
    expect(can('admin', 'saas:read')).toBe(true)
  })

  it('allows crew to sign SWMS but not export reports', () => {
    expect(can('crew', 'whs:sign')).toBe(true)
    expect(can('crew', 'reports:export')).toBe(false)
  })

  it('denies unknown or missing roles', () => {
    expect(can(undefined, 'projects:read')).toBe(false)
    expect(can('hacker', 'projects:read')).toBe(false)
  })

  it('normalizes invalid roles to staff', () => {
    expect(normalizeRole('wizard')).toBe('staff')
    expect(normalizeRole('OWNER')).toBe('staff')
    expect(normalizeRole('manager')).toBe('manager')
    expect(normalizeRole('developer')).toBe('developer')
  })

  it('defines exactly 8 roles', () => {
    expect(Object.keys(ROLE_PERMISSIONS)).toHaveLength(8)
  })
})

describe('RBAC middleware', () => {
  const mockRes = () => {
    const res: any = {}
    res.status = jest.fn().mockReturnValue(res)
    res.json = jest.fn().mockReturnValue(res)
    return res as Response
  }

  it('attaches normalized role from auth pipeline', () => {
    const req = { userRole: 'OWNER', authProvider: 'local' } as unknown as Request
    const next = jest.fn() as NextFunction
    attachRole(req, mockRes(), next)
    expect((req as RbacRequest).authRole).toBe('staff')
    expect(next).toHaveBeenCalled()
  })

  it('permits a request with the required permission', () => {
    const req = { authRole: 'owner' } as RbacRequest
    const next = jest.fn() as NextFunction
    requirePermission('saas:admin')(req as Request, mockRes(), next)
    expect(next).toHaveBeenCalled()
  })

  it('rejects a request lacking the permission with 403', () => {
    const req = { authRole: 'crew' } as RbacRequest
    const res = mockRes()
    const next = jest.fn() as NextFunction
    requirePermission('saas:admin')(req as Request, res, next)
    expect(res.status).toHaveBeenCalledWith(403)
    expect(next).not.toHaveBeenCalled()
  })

  it('rejects a wrong role with 403', () => {
    const req = { authRole: 'viewer' } as RbacRequest
    const res = mockRes()
    requireRoles('owner', 'admin')(req as Request, res, jest.fn())
    expect(res.status).toHaveBeenCalledWith(403)
  })
})
