/** Typed contracts for B2B integrations (Guardrail #3: no invented APIs). */
export interface FinancingQuote {
  provider: string
  amount: number
  termMonths: number
  apr: number
  monthlyPayment: number
  approved: boolean
}

export interface FinancingAdapter {
  readonly name: string
  readonly sandbox: boolean
  quote(data: { amount: number; termMonths: number; creditScore?: number }): Promise<FinancingQuote>
}

export interface StormEvent {
  id: string
  date: string
  suburb: string
  hailSizeMm: number
  windSpeedKmh: number
  severity: 'low' | 'moderate' | 'severe'
}

export interface StormLookupAdapter {
  readonly name: string
  readonly sandbox: boolean
  lookup(suburb: string, from: string, to: string): Promise<StormEvent[]>
}
