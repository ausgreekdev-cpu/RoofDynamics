import { getBillingAdapter, SandboxBillingAdapter } from './billing'
import { tierCredits, TIER_METADATA } from './billingTypes'

describe('billing adapter sandbox', () => {
  it('selects sandbox when mocks enabled', () => {
    expect(getBillingAdapter()).toBeInstanceOf(SandboxBillingAdapter)
  })

  it('creates a checkout session with tier pricing', async () => {
    const session = await new SandboxBillingAdapter().createCheckout('OPS_ERP', 'tenant-1')
    expect(session.amount).toBe(TIER_METADATA.OPS_ERP.priceCents)
    expect(session.url).toContain('checkout.stripe.com')
  })

  it('creates a connect deposit', async () => {
    const result = await new SandboxBillingAdapter().createConnectDeposit(5000, 'acct_123')
    expect(result.amount).toBe(5000)
    expect(result.transferId).toContain('acct_123')
  })

  it('maps tier credits', () => {
    expect(tierCredits('STARTER')).toBe(10)
    expect(tierCredits('EMPIRE_ENTERPRISE_LEASE')).toBe(999)
  })
})
