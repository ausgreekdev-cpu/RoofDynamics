import { describe, it, expect } from 'vitest'
import { buildMeasurementReport, buildReport, normaliseHex, reportFilename, TEMPLATES } from './templates'
import { DEFAULT_BRANDING } from './types'

describe('reporting templates', () => {
  it('exposes three templates', () => {
    expect(TEMPLATES.map((t) => t.key)).toEqual(['measurement', 'warranty', 'invoice'])
  })

  it('normalises hex colours with safe fallback', () => {
    expect(normaliseHex('#10B981')).toBe('#10B981')
    expect(normaliseHex('10b981')).toBe('#10b981')
    expect(normaliseHex('not-a-colour')).toBe('#0EA5E9')
  })

  it('builds a measurement report with pitch-adjusted true area', () => {
    const report = buildMeasurementReport({
      name: 'Fremantle Re-roof',
      customerName: 'James Wilson',
      suburb: 'Fremantle',
      planArea: 100,
      pitchDegrees: 0,
      coastalZone: true,
    })
    expect(report.planArea).toBe(100)
    expect(report.trueArea).toBeCloseTo(107, 5)
    expect(report.coastalZone).toBe(true)
  })

  it('composes a report payload', () => {
    const measurement = buildMeasurementReport({
      name: 'Test', customerName: 'Customer', suburb: 'Midland',
      planArea: 100, pitchDegrees: 22, coastalZone: false,
    })
    const report = buildReport('measurement', DEFAULT_BRANDING, measurement, { amount: 5000 })
    expect(report.type).toBe('measurement')
    expect(report.customerName).toBe('Customer')
    expect(report.amount).toBe(5000)
  })

  it('creates safe filenames', () => {
    expect(reportFilename('warranty', 'Fremantle Re-roof!')).toBe('warranty-fremantle-re-roof.pdf')
    expect(reportFilename('invoice', '')).toBe('invoice-report.pdf')
  })
})
