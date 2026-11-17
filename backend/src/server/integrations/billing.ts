/** Typed billing adapter: Stripe when configured, deterministic sandbox otherwise. */
import { env } from '../../env'
import type { Tier } from './billingTypes'

export interface CheckoutSession {
  id: string
  url: string
  amount: number
  currency: string
}

export interface BillingAdapter {
  readonly name: string
  readonly sandbox: boolean
  createCheckout(tier: Tier, tenantId: string): Promise<CheckoutSession>
  createConnectDeposit(amount: number, contractorId: string): Promise<{ transferId: string; amount: number }>
}

const TIER_PRICES: Record<Tier, number> = {
  STARTER: 7900,
  PRO_SAFETY: 19900,
  OPS_ERP: 39900,
  EMPIRE_ENTERPRISE_LEASE: 69900,
}

export class SandboxBillingAdapter implements BillingAdapter {
  readonly name = 'Stripe (Sandbox)'
  readonly sandbox = true

  async createCheckout(tier: Tier, tenantId: string): Promise<CheckoutSession> {
    return {
      id: `cs_sandbox_${tenantId}_${tier}`,
      url: `https://checkout.stripe.com/c/pay/cs_sandbox_${tier}`,
      amount: TIER_PRICES[tier],
      currency: 'aud',
    }
  }

  async createConnectDeposit(amount: number, contractorId: string) {
    return { transferId: `tr_sandbox_${contractorId}`, amount }
  }
}

export class LiveBillingAdapter implements BillingAdapter {
  readonly name = 'Stripe (Live)'
  readonly sandbox = false

  async createCheckout(_tier: Tier, _tenantId: string): Promise<CheckoutSession> {
    if (!env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY required')
    // Live transport requires a configured Stripe client + price IDs from dashboard.
    throw new Error('Live Stripe checkout not configured — see integrations README')
  }

  async createConnectDeposit(_amount: number, _contractorId: string): Promise<{ transferId: string; amount: number }> {
    if (!env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY required')
    throw new Error('Live Stripe Connect not configured — see integrations README')
  }
}

export function getBillingAdapter(): BillingAdapter {
  return env.ENABLE_MOCK_INTEGRATIONS || !env.STRIPE_SECRET_KEY
    ? new SandboxBillingAdapter()
    : new LiveBillingAdapter()
}
