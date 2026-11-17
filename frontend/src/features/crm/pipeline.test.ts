import { describe, it, expect } from 'vitest'
import { probabilityFor, weightedForecast, wonRevenue, canTransition, leadToDeal } from './pipeline'
import type { Deal } from './types'

const deals: Deal[] = [
  { id: '1', name: 'A', customerName: 'A', suburb: 'Fremantle', estimatedValue: 100, stage: 'NEW', probability: 0.1 },
  { id: '2', name: 'B', customerName: 'B', suburb: 'Midland', estimatedValue: 200, stage: 'WON', probability: 1 },
  { id: '3', name: 'C', customerName: 'C', suburb: 'Cottesloe', estimatedValue: 300, stage: 'LOST', probability: 0 },
]

describe('CRM pipeline', () => {
  it('maps stage probabilities', () => {
    expect(probabilityFor('NEW')).toBe(0.1)
    expect(probabilityFor('QUOTING')).toBe(0.5)
    expect(probabilityFor('WON')).toBe(1)
    expect(probabilityFor('LOST')).toBe(0)
  })

  it('computes weighted forecast', () => {
    expect(weightedForecast(deals)).toBeCloseTo(210, 5)
  })

  it('computes won revenue', () => {
    expect(wonRevenue(deals)).toBe(200)
  })

  it('allows forward and backward transitions', () => {
    expect(canTransition('NEW', 'CONTACTED')).toBe(true)
    expect(canTransition('QUOTING', 'NEGOTIATION')).toBe(true)
    expect(canTransition('NEGOTIATION', 'QUOTING')).toBe(true)
  })

  it('blocks invalid transitions', () => {
    expect(canTransition('NEW', 'WON')).toBe(false)
    expect(canTransition('WON', 'LOST')).toBe(false)
    expect(canTransition('LOST', 'WON')).toBe(false)
  })

  it('converts API leads into deals', () => {
    const deal = leadToDeal({ id: 'x', firstName: 'Jane', lastName: 'Doe', suburb: 'Fremantle', status: 'QUOTING', estimatedValue: 50000 })
    expect(deal.name).toBe('Jane Doe')
    expect(deal.stage).toBe('QUOTING')
    expect(deal.probability).toBe(0.5)
  })
})
