/**
 * WA statutory compliance endpoints:
 *  - Payment claims with 15-business-day Payment Schedule countdown
 *    (Security of Payment Act 2021 WA)
 *  - LGA Building Permits BA1/BA2 for ≥$20k structural work
 */
import { Router, type Request, type Response } from 'express'
import { prisma } from '../../lib/prisma'
import { requirePermission, type RbacRequest } from '../auth/middleware'

const router = Router()
const PAYMENT_SCHEDULE_BUSINESS_DAYS = 15

/** Add N business days (skip Sat/Sun) to a date. */
export function addBusinessDays(start: Date, days: number): Date {
  const result = new Date(start)
  let remaining = days
  while (remaining > 0) {
    result.setDate(result.getDate() + 1)
    const day = result.getDay()
    if (day !== 0 && day !== 6) remaining -= 1
  }
  return result
}

// ---- Payment Claims ----
router.get('/payment-claims', async (req: Request, res: Response) => {
  const r = req as RbacRequest
  try {
    const claims = await prisma.paymentClaim.findMany({
      where: { tenantId: r.tenantId },
      orderBy: { servedDate: 'desc' },
    })
    res.json(claims)
  } catch {
    res.json([])
  }
})

router.post('/payment-claims', requirePermission('billing:manage'), async (req: Request, res: Response) => {
  const r = req as RbacRequest
  const { jobId, invoiceId, claimNumber, claimantName, claimAmount, servedDate, noticeAttached } = req.body || {}
  if (!claimNumber || !claimantName || !claimAmount || !servedDate) {
    res.status(400).json({ error: 'claimNumber, claimantName, claimAmount and servedDate are required' })
    return
  }
  const served = new Date(servedDate)
  const claim = await prisma.paymentClaim.create({
    data: {
      tenantId: r.tenantId!,
      jobId, invoiceId,
      claimNumber, claimantName,
      claimAmount: parseFloat(claimAmount),
      servedDate: served,
      responseDueDate: addBusinessDays(served, PAYMENT_SCHEDULE_BUSINESS_DAYS),
      noticeAttached: !!noticeAttached,
    },
  })
  res.status(201).json(claim)
})

router.patch('/payment-claims/:id/respond', requirePermission('billing:manage'), async (req: Request, res: Response) => {
  const r = req as RbacRequest
  try {
    const claim = await prisma.paymentClaim.update({
      where: { id: req.params.id },
      data: { status: 'RESPONDED', respondedDate: new Date() },
    })
    res.json(claim)
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to record response' })
  }
})

/** Recompute overdue statuses (call from cron / dashboard load). */
router.post('/payment-claims/refresh-status', requirePermission('billing:manage'), async (req: Request, res: Response) => {
  const r = req as RbacRequest
  const now = new Date()
  try {
    const overdue = await prisma.paymentClaim.findMany({
      where: { tenantId: r.tenantId, status: 'PENDING', responseDueDate: { lt: now } },
    })
    for (const claim of overdue) {
      await prisma.paymentClaim.update({ where: { id: claim.id }, data: { status: 'OVERDUE' } })
    }
    res.json({ updated: overdue.length })
  } catch {
    res.json({ updated: 0 })
  }
})

// ---- Building Permits ----
router.get('/building-permits', async (req: Request, res: Response) => {
  const r = req as RbacRequest
  try {
    const permits = await prisma.buildingPermit.findMany({
      where: { tenantId: r.tenantId },
      orderBy: { createdAt: 'desc' },
    })
    res.json(permits)
  } catch {
    res.json([])
  }
})

router.post('/building-permits', requirePermission('projects:write'), async (req: Request, res: Response) => {
  const r = req as RbacRequest
  const { jobId, permitNumber, permitType, lga, issuedDate, expiryDate, status } = req.body || {}
  if (!permitNumber || !lga) {
    res.status(400).json({ error: 'permitNumber and lga are required' })
    return
  }
  const permit = await prisma.buildingPermit.create({
    data: {
      tenantId: r.tenantId!,
      jobId, permitNumber,
      permitType: permitType || 'BA1',
      lga,
      issuedDate: issuedDate ? new Date(issuedDate) : null,
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      status: status || 'PENDING',
    },
  })
  res.status(201).json(permit)
})

router.patch('/building-permits/:id', requirePermission('projects:write'), async (req: Request, res: Response) => {
  const r = req as RbacRequest
  const { status, issuedDate, expiryDate } = req.body || {}
  try {
    const permit = await prisma.buildingPermit.update({
      where: { id: req.params.id },
      data: {
        ...(status ? { status } : {}),
        ...(issuedDate ? { issuedDate: new Date(issuedDate) } : {}),
        ...(expiryDate ? { expiryDate: new Date(expiryDate) } : {}),
      },
    })
    res.json(permit)
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to update permit' })
  }
})

export default router
