import { Request, Response, NextFunction } from 'express'
import { prisma } from '../lib/prisma'

export interface TenantRequest extends Request {
  tenantId?: string
  userId?: string
}

export const requireTenant = async (
  req: TenantRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const tenantId = req.headers['x-tenant-id'] as string || req.tenantId

  if (!tenantId) {
    res.status(400).json({ error: 'Tenant ID is required' })
    return
  }

  // Verify tenant exists
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { id: true, name: true, subscriptionTier: true, isWhiteLabel: true },
  })

  if (!tenant) {
    res.status(404).json({ error: 'Tenant not found' })
    return
  }

  req.tenantId = tenantId
  next()
}

export const getTenantEntitlements = async (tenantId: string) => {
  return prisma.moduleEntitlement.findMany({
    where: { tenantId },
    select: { moduleKey: true, isEnabled: true, addOnPrice: true },
  })
}
