/** Billing endpoints: tier checkout, credit quotas, Stripe Connect deposits. */
import { Router, type Request, type Response } from 'express'
import { prisma } from '../../lib/prisma'
import { requirePermission, type RbacRequest } from '../auth/middleware'
import { getBillingAdapter } from '../integrations/billing'
import { tierCredits, TIER_METADATA, type Tier } from '../integrations/billingTypes'

const router = Router()

// GET /api/billing/credits — current tenant credit balance/quota
router.get('/credits', async (req: Request, res: Response) => {
  const r = req as RbacRequest
  const tenant = await prisma.tenant.findUnique({ where: { id: r.tenantId } })
  const tier = (tenant?.subscriptionTier || 'STARTER') as Tier
  const quota = tierCredits(tier)
  // Deterministic usage derived from project count (demo); real usage would be metered.
  const used = await prisma.project.count({ where: { tenantId: r.tenantId } })
  res.json({ tier, quota, used, remaining: Math.max(0, quota - used), provider: getBillingAdapter().name })
})

// POST /api/billing/checkout — create a checkout session for a tier
router.post('/checkout', requirePermission('billing:manage'), async (req: Request, res: Response) => {
  const r = req as RbacRequest
  const { tier } = req.body || {}
  if (!tier || !(tier in TIER_METADATA)) {
    res.status(400).json({ error: 'Invalid tier' })
    return
  }
  try {
    const session = await getBillingAdapter().createCheckout(tier as Tier, r.tenantId!)
    res.json(session)
  } catch (err: any) {
    res.status(502).json({ error: err.message || 'Checkout unavailable' })
  }
})

// POST /api/billing/connect-deposit — Stripe Connect deposit to contractor
router.post('/connect-deposit', requirePermission('billing:manage'), async (req: Request, res: Response) => {
  const { amount, contractorId } = req.body || {}
  if (!amount || Number(amount) <= 0 || !contractorId) {
    res.status(400).json({ error: 'amount and contractorId are required' })
    return
  }
  try {
    const result = await getBillingAdapter().createConnectDeposit(Number(amount), String(contractorId))
    res.json({ ...result, provider: getBillingAdapter().name })
  } catch (err: any) {
    res.status(502).json({ error: err.message || 'Deposit unavailable' })
  }
})

export default router
