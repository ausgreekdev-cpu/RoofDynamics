import { getFinancingAdapter, SandboxFinancingAdapter } from './financing'
import { getStormAdapter, SandboxStormAdapter } from './storm'

describe('integration adapter sandbox', () => {
  it('selects sandbox adapters when mocks enabled', () => {
    expect(getFinancingAdapter()).toBeInstanceOf(SandboxFinancingAdapter)
    expect(getStormAdapter()).toBeInstanceOf(SandboxStormAdapter)
  })

  it('computes a financing payment with higher apr for lower credit', async () => {
    const adapter = new SandboxFinancingAdapter()
    const high = await adapter.quote({ amount: 10000, termMonths: 36, creditScore: 780 })
    const low = await adapter.quote({ amount: 10000, termMonths: 36, creditScore: 600 })
    expect(high.apr).toBeLessThan(low.apr)
    expect(high.monthlyPayment).toBeGreaterThan(0)
    expect(high.approved).toBe(true)
    expect(low.approved).toBe(false)
  })

  it('handles zero term safely', async () => {
    const quote = await new SandboxFinancingAdapter().quote({ amount: 5000, termMonths: 0 })
    expect(quote.termMonths).toBe(36)
  })

  it('returns deterministic storm events for a suburb', async () => {
    const adapter = new SandboxStormAdapter()
    const a = await adapter.lookup('Fremantle', '2026-01-01', '2026-12-31')
    const b = await adapter.lookup('Fremantle', '2026-01-01', '2026-12-31')
    expect(a).toEqual(b)
    expect(a.every((e) => e.suburb === 'Fremantle')).toBe(true)
  })
})
