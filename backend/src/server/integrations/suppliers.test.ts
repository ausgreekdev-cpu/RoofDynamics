import { getSupplierAdapter, SandboxSupplierAdapter } from './suppliers'
import { getXactimateAdapter, SandboxXactimateAdapter } from './xactimate'

describe('supplier + Xactimate adapters', () => {
  it('selects sandbox adapters', () => {
    expect(getSupplierAdapter('abc')).toBeInstanceOf(SandboxSupplierAdapter)
    expect(getSupplierAdapter('beacon')).toBeInstanceOf(SandboxSupplierAdapter)
    expect(getXactimateAdapter()).toBeInstanceOf(SandboxXactimateAdapter)
  })

  it('lists and filters the sandbox product catalog', async () => {
    const adapter = new SandboxSupplierAdapter('ABC Supply')
    const all = await adapter.listProducts()
    expect(all.length).toBeGreaterThan(3)
    const filtered = await adapter.listProducts('colorbond')
    expect(filtered.length).toBe(2)
  })

  it('checks supplier prices', async () => {
    const price = await new SandboxSupplierAdapter('Beacon').checkPrice('CB-CORR', 10)
    expect(price?.total).toBe(320)
    expect(await new SandboxSupplierAdapter('Beacon').checkPrice('NOPE', 1)).toBeNull()
  })

  it('creates a sandbox Xactimate estimate', async () => {
    const estimate = await new SandboxXactimateAdapter().createEstimate('JOB-1')
    expect(estimate.status).toBe('DRAFT')
    expect(estimate.lineItems).toBe(4)
  })
})
