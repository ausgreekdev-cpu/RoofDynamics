/** Pure CRM pipeline math — stage probabilities and weighted forecast. */
import type { Deal, PipelineStage } from './types'

export const STAGE_PROBABILITY: Record<PipelineStage, number> = {
  NEW: 0.1,
  CONTACTED: 0.25,
  QUOTING: 0.5,
  NEGOTIATION: 0.75,
  WON: 1,
  LOST: 0,
}

export function probabilityFor(stage: PipelineStage): number {
  return STAGE_PROBABILITY[stage] ?? 0
}

/** Weighted forecast value across open deals. */
export function weightedForecast(deals: Deal[]): number {
  return deals.reduce((sum, d) => sum + d.estimatedValue * probabilityFor(d.stage), 0)
}

/** Total value of won deals. */
export function wonRevenue(deals: Deal[]): number {
  return deals.filter((d) => d.stage === 'WON').reduce((s, d) => s + d.estimatedValue, 0)
}

/** Allowed forward transitions (backward moves always allowed). */
export const FORWARD_TRANSITIONS: Record<PipelineStage, PipelineStage[]> = {
  NEW: ['CONTACTED', 'LOST'],
  CONTACTED: ['QUOTING', 'LOST'],
  QUOTING: ['NEGOTIATION', 'WON', 'LOST'],
  NEGOTIATION: ['WON', 'LOST'],
  WON: [],
  LOST: [],
}

export function canTransition(from: PipelineStage, to: PipelineStage): boolean {
  if (from === to) return true
  if (FORWARD_TRANSITIONS[from]?.includes(to)) return true
  // Backward moves are always allowed for corrections
  const fromIdx = ['NEW', 'CONTACTED', 'QUOTING', 'NEGOTIATION', 'WON', 'LOST'].indexOf(from)
  const toIdx = ['NEW', 'CONTACTED', 'QUOTING', 'NEGOTIATION', 'WON', 'LOST'].indexOf(to)
  return toIdx < fromIdx && to !== 'WON'
}

/** Convert a Lead record from the API into a Deal. */
export function leadToDeal(lead: any): Deal {
  return {
    id: lead.id,
    name: `${lead.firstName} ${lead.lastName}`,
    customerName: `${lead.firstName} ${lead.lastName}`,
    suburb: lead.suburb || '',
    estimatedValue: Number(lead.estimatedValue || 0),
    stage: (lead.status || 'NEW') as PipelineStage,
    probability: probabilityFor((lead.status || 'NEW') as PipelineStage),
  }
}
