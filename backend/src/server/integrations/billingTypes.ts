export type Tier = 'STARTER' | 'PRO_SAFETY' | 'OPS_ERP' | 'EMPIRE_ENTERPRISE_LEASE'

export const TIER_METADATA: Record<Tier, { label: string; priceCents: number; credits: number }> = {
  STARTER: { label: 'Starter', priceCents: 7900, credits: 10 },
  PRO_SAFETY: { label: 'Pro Safety', priceCents: 19900, credits: 50 },
  OPS_ERP: { label: 'Ops ERP', priceCents: 39900, credits: 150 },
  EMPIRE_ENTERPRISE_LEASE: { label: 'Empire Enterprise Lease', priceCents: 69900, credits: 999 },
}

export function tierCredits(tier: Tier): number {
  return TIER_METADATA[tier]?.credits ?? 0
}
