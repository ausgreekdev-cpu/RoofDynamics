import { describe, it, expect } from 'vitest'
import { planAreaSqm, pitchFactor, trueAreaSqm, containsPoint, isCoastalPolygon, type LonLat } from './area'

const SQUARE: LonLat[] = [
  { lon: 115.75, lat: -32.05 },
  { lon: 115.751, lat: -32.05 },
  { lon: 115.751, lat: -32.051 },
  { lon: 115.75, lat: -32.051 },
]

describe('measurement area math', () => {
  it('computes a plausible plan area for a ~100x110m square', () => {
    const area = planAreaSqm(SQUARE)
    expect(area).toBeGreaterThan(8000)
    expect(area).toBeLessThan(15000)
  })

  it('returns 0 for fewer than 3 vertices', () => {
    expect(planAreaSqm([])).toBe(0)
    expect(planAreaSqm(SQUARE.slice(0, 2))).toBe(0)
  })

  it('computes pitch factor', () => {
    expect(pitchFactor(0)).toBeCloseTo(1, 5)
    expect(pitchFactor(45)).toBeCloseTo(1.414, 2)
  })

  it('true area exceeds plan area', () => {
    const plan = planAreaSqm(SQUARE)
    expect(trueAreaSqm(SQUARE, 22)).toBeGreaterThan(plan)
    expect(trueAreaSqm(SQUARE, 22, 'hip_valley')).toBeGreaterThan(trueAreaSqm(SQUARE, 22, 'gable'))
  })

  it('detects points inside a polygon', () => {
    expect(containsPoint(SQUARE, { lon: 115.7505, lat: -32.0505 })).toBe(true)
    expect(containsPoint(SQUARE, { lon: 115.76, lat: -32.06 })).toBe(false)
  })

  it('detects a coastal suburb inside a polygon', () => {
    const fremantle: LonLat = { lon: 115.7507, lat: -32.0564 }
    const around: LonLat[] = [
      { lon: fremantle.lon - 0.002, lat: fremantle.lat - 0.002 },
      { lon: fremantle.lon + 0.002, lat: fremantle.lat - 0.002 },
      { lon: fremantle.lon + 0.002, lat: fremantle.lat + 0.002 },
      { lon: fremantle.lon - 0.002, lat: fremantle.lat + 0.002 },
    ]
    expect(isCoastalPolygon(around)).toBe(true)
  })
})
