/** Pure credit-quota helpers. */
import type { Tier } from './types'

export const TIER_QUOTA: Record<Tier, number> = {
  STARTER: 10,
  PRO_SAFETY: 50,
  OPS_ERP: 150,
  EMPIRE_ENTERPRISE_LEASE: 999,
}

export function quotaFor(tier: string): number {
  return TIER_QUOTA[tier as Tier] ?? TIER_QUOTA.STARTER
}

export function usagePercent(used: number, quota: number): number {
  if (quota <= 0) return 100
  return Math.min(100, Math.round((used / quota) * 100))
}

export function canConsume(used: number, quota: number): boolean {
  return used < quota
}
