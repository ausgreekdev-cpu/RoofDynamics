import { describe, it, expect } from 'vitest'
import { escapeXml, deriveEsxLineItems, toEsx } from './esx'
import { DEFAULT_BRANDING } from './types'
import type { MeasurementReportData } from './types'

const MEASUREMENT: MeasurementReportData = {
  projectName: 'Fremantle Re-roof',
  customerName: 'James Wilson',
  suburb: 'Fremantle',
  planArea: 100,
  trueArea: 150,
  pitchDegrees: 22,
  wastePercent: 7,
  coastalZone: true,
  generatedAt: '2026-11-17T00:00:00.000Z',
}

describe('Xactimate ESX export', () => {
  it('escapes XML special characters', () => {
    expect(escapeXml('A & B <roof> "x"')).toBe('A &amp; B &lt;roof&gt; &quot;x&quot;')
  })

  it('derives 4 BOM line items from the measurement', () => {
    const items = deriveEsxLineItems(MEASUREMENT)
    expect(items).toHaveLength(4)
    expect(items.map((i) => i.code)).toEqual(['ROOF-SHEET', 'ROOF-BATTEN', 'ROOF-INSUL', 'ROOF-FAST'])
  })

  it('uses coastal pricing for coastal zones', () => {
    const items = deriveEsxLineItems(MEASUREMENT)
    expect(items[0].unitPrice).toBe(45)
    const inland = deriveEsxLineItems({ ...MEASUREMENT, coastalZone: false })
    expect(inland[0].unitPrice).toBe(32)
  })

  it('produces well-formed ESX XML with required sections', () => {
    const xml = toEsx(MEASUREMENT, DEFAULT_BRANDING)
    expect(xml).toContain('<?xml version="1.0"')
    expect(xml).toContain('<esx:estimates')
    expect(xml).toContain('<esx:projectName>Fremantle Re-roof</esx:projectName>')
    expect(xml).toContain('<esx:coastalZone>true</esx:coastalZone>')
    expect(xml).toContain('<esx:lines>')
    expect(xml).toContain('</esx:estimates>')
    expect(xml.match(/<esx:line /g)).toHaveLength(4)
  })

  it('escapes project names containing special characters', () => {
    const xml = toEsx({ ...MEASUREMENT, projectName: 'A & B <roof>' }, DEFAULT_BRANDING)
    expect(xml).toContain('A &amp; B &lt;roof&gt;')
    expect(xml).not.toContain('A & B <roof>')
  })

  it('includes a computed grand total', () => {
    const xml = toEsx(MEASUREMENT, DEFAULT_BRANDING)
    expect(xml).toContain('<esx:total>')
  })
})
