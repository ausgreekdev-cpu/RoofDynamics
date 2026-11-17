/** Financing adapter: deterministic sandbox (no live credentials required). */
import { env } from '../../env'
import type { FinancingAdapter, FinancingQuote } from './types'

export class SandboxFinancingAdapter implements FinancingAdapter {
  readonly name = 'GreenSky (Sandbox)'
  readonly sandbox = true

  async quote(data: { amount: number; termMonths: number; creditScore?: number }): Promise<FinancingQuote> {
    const score = data.creditScore ?? 720
    const apr = score >= 740 ? 0.069 : score >= 680 ? 0.099 : 0.149
    const months = Math.max(1, data.termMonths || 36)
    const monthlyRate = apr / 12
    const payment = data.amount * monthlyRate / (1 - Math.pow(1 + monthlyRate, -months))
    return {
      provider: this.name,
      amount: data.amount,
      termMonths: months,
      apr,
      monthlyPayment: Math.round(payment * 100) / 100,
      approved: score >= 640,
    }
  }
}

/** Live adapter placeholder — requires GREENSKY_API_KEY; fails loudly if called without it. */
export class LiveFinancingAdapter implements FinancingAdapter {
  readonly name = 'GreenSky (Live)'
  readonly sandbox = false

  async quote(_data: { amount: number; termMonths: number; creditScore?: number }): Promise<FinancingQuote> {
    if (!env.GREENSKY_API_KEY) {
      throw new Error('GREENSKY_API_KEY is required for live financing quotes')
    }
    // Live HTTP transport must be supplied by the partner integration contract;
    // never fabricate an endpoint. Until a signed contract exists, use sandbox.
    throw new Error('Live financing transport not configured — see integrations README')
  }
}

export function getFinancingAdapter(): FinancingAdapter {
  return env.ENABLE_MOCK_INTEGRATIONS || !env.GREENSKY_API_KEY
    ? new SandboxFinancingAdapter()
    : new LiveFinancingAdapter()
}
