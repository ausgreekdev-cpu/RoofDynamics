/** Typed integration endpoints with sandbox adapters. */
import { Router, type Request, type Response } from 'express'
import { requirePermission } from '../auth/middleware'
import { getFinancingAdapter, getStormAdapter } from '../integrations'

const router = Router()

router.post('/financing/quote', requirePermission('crm:read'), async (req: Request, res: Response) => {
  const { amount, termMonths, creditScore } = req.body || {}
  if (!amount || Number(amount) <= 0) {
    res.status(400).json({ error: 'amount is required' })
    return
  }
  try {
    const quote = await getFinancingAdapter().quote({
      amount: Number(amount),
      termMonths: Number(termMonths) || 36,
      creditScore: creditScore ? Number(creditScore) : undefined,
    })
    res.json(quote)
  } catch (err: any) {
    res.status(502).json({ error: err.message || 'Financing provider unavailable' })
  }
})

router.get('/storm', requirePermission('crm:read'), async (req: Request, res: Response) => {
  const { suburb, from, to } = req.query
  if (!suburb) {
    res.status(400).json({ error: 'suburb is required' })
    return
  }
  try {
    const events = await getStormAdapter().lookup(
      String(suburb),
      from ? String(from) : '',
      to ? String(to) : ''
    )
    res.json({ suburb: String(suburb), events, provider: getStormAdapter().name, sandbox: getStormAdapter().sandbox })
  } catch (err: any) {
    res.status(502).json({ error: err.message || 'Storm lookup unavailable' })
  }
})

export default router
