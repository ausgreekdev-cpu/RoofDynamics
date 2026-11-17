/** Pure template helpers — unit-testable without PDF rendering. */
import type { Branding, MeasurementReportData, ReportData, TemplateType } from './types'

export const TEMPLATES: Array<{ key: TemplateType; label: string; description: string }> = [
  { key: 'measurement', label: 'Measurement Report', description: 'Roof area, pitch and coastal zone analysis' },
  { key: 'warranty', label: 'Warranty Certificate', description: '10-year workmanship & Bluescope warranty' },
  { key: 'invoice', label: 'Tax Invoice', description: 'Progress claim with GST breakdown' },
]

/** Convert a hex colour to the nearest safe PDF colour (accepts #RRGGBB). */
export function normaliseHex(hex: string): string {
  const match = /^#?([0-9a-fA-F]{6})$/.exec(hex.trim())
  return match ? `#${match[1]}` : '#0EA5E9'
}

/** Build a default measurement report from a project. */
export function buildMeasurementReport(data: {
  name: string
  customerName: string
  suburb: string
  planArea: number
  pitchDegrees: number
  coastalZone: boolean
}): MeasurementReportData {
  const pitchFactor = 1 / Math.cos((data.pitchDegrees * Math.PI) / 180)
  return {
    projectName: data.name,
    customerName: data.customerName,
    suburb: data.suburb,
    planArea: data.planArea,
    trueArea: data.planArea * pitchFactor * 1.07,
    pitchDegrees: data.pitchDegrees,
    wastePercent: 7,
    coastalZone: data.coastalZone,
    generatedAt: new Date().toISOString(),
  }
}

/** Compose the full report payload for a template selection. */
export function buildReport(
  type: TemplateType,
  branding: Branding,
  measurement?: MeasurementReportData,
  extras?: Partial<ReportData>
): ReportData {
  return {
    type,
    measurement,
    customerName: extras?.customerName || measurement?.customerName || '',
    jobNumber: extras?.jobNumber || 'JOB-001',
    amount: extras?.amount || 0,
    generatedAt: new Date().toISOString(),
  }
}

/** Filename-safe slug for exports. */
export function reportFilename(type: TemplateType, projectName: string): string {
  const slug = projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'report'
  return `${type}-${slug}.pdf`
}
