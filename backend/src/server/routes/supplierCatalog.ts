/** Supplier catalog + Xactimate estimate endpoints (typed adapters). */
import { Router, type Request, type Response } from 'express'
import { requirePermission } from '../auth/middleware'
import { getSupplierAdapter, getXactimateAdapter } from '../integrations'

const router = Router()

router.get('/suppliers/:provider/products', requirePermission('crm:read'), async (req: Request, res: Response) => {
  const provider = req.params.provider as 'abc' | 'beacon'
  if (!['abc', 'beacon'].includes(provider)) {
    res.status(400).json({ error: 'Unknown supplier provider' })
    return
  }
  try {
    const adapter = getSupplierAdapter(provider)
    const products = await adapter.listProducts(req.query.q ? String(req.query.q) : undefined)
    res.json({ provider: adapter.name, sandbox: adapter.sandbox, products })
  } catch (err: any) {
    res.status(502).json({ error: err.message || 'Supplier catalog unavailable' })
  }
})

router.post('/suppliers/:provider/price', requirePermission('crm:read'), async (req: Request, res: Response) => {
  const provider = req.params.provider as 'abc' | 'beacon'
  if (!['abc', 'beacon'].includes(provider)) {
    res.status(400).json({ error: 'Unknown supplier provider' })
    return
  }
  const { sku, quantity } = req.body || {}
  if (!sku || !quantity) { res.status(400).json({ error: 'sku and quantity required' }); return }
  try {
    const adapter = getSupplierAdapter(provider)
    const price = await adapter.checkPrice(String(sku), Number(quantity))
    res.json(price ?? { error: 'SKU not found' })
  } catch (err: any) {
    res.status(502).json({ error: err.message || 'Price lookup unavailable' })
  }
})

router.post('/xactimate/estimate', requirePermission('reports:export'), async (req: Request, res: Response) => {
  const { reference } = req.body || {}
  if (!reference) { res.status(400).json({ error: 'reference required' }); return }
  try {
    const adapter = getXactimateAdapter()
    const estimate = await adapter.createEstimate(String(reference))
    res.json({ ...estimate, provider: adapter.name })
  } catch (err: any) {
    res.status(502).json({ error: err.message || 'Estimate unavailable' })
  }
})

export default router
