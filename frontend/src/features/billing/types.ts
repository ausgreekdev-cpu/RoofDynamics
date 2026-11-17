export type Tier = 'STARTER' | 'PRO_SAFETY' | 'OPS_ERP' | 'EMPIRE_ENTERPRISE_LEASE'

export const TIERS: Tier[] = ['STARTER', 'PRO_SAFETY', 'OPS_ERP', 'EMPIRE_ENTERPRISE_LEASE']

export interface CreditStatus {
  tier: Tier
  quota: number
  used: number
  remaining: number
  provider: string
}

export interface CheckoutSession {
  id: string
  url: string
  amount: number
  currency: string
}
