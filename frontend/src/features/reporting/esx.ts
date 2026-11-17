/**
 * Xactimate .ESX export — deterministic XML serializer.
 * ESX is a documented XML exchange format; no external API or invented package
 * is used (Guardrail #3). This emits a well-formed, standards-shaped document.
 */
import type { Branding, MeasurementReportData } from './types'

export interface EsxLineItem {
  code: string
  description: string
  quantity: number
  unit: string
  unitPrice: number
}

/** Escape XML special characters. */
export function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/** Derive ESX line items from a roof measurement. */
export function deriveEsxLineItems(m: MeasurementReportData): EsxLineItem[] {
  const sheets = Math.ceil(m.trueArea / 0.762)
  const battens = Math.ceil(m.trueArea / 0.9)
  const insulation = Math.ceil(m.trueArea / 15)
  const fasteners = Math.ceil(m.trueArea * 7)
  return [
    { code: 'ROOF-SHEET', description: 'Colorbond Corrugated Sheet', quantity: sheets, unit: 'EA', unitPrice: m.coastalZone ? 45 : 32 },
    { code: 'ROOF-BATTEN', description: 'Topspan 40mm Batten', quantity: battens, unit: 'LF', unitPrice: 8.5 },
    { code: 'ROOF-INSUL', description: 'Anticon 60mm Insulation', quantity: insulation, unit: 'EA', unitPrice: m.coastalZone ? 85 : 65 },
    { code: 'ROOF-FAST', description: 'Crest Screws with Neo Washers', quantity: fasteners, unit: 'EA', unitPrice: m.coastalZone ? 0.85 : 0.65 },
  ]
}

/** Serialize a measurement report to an Xactimate-shaped ESX XML string. */
export function toEsx(m: MeasurementReportData, branding: Branding): string {
  const items = deriveEsxLineItems(m)
  const date = (m.generatedAt || new Date().toISOString()).slice(0, 10)
  const lines = items.map((item, i) => {
    const total = (item.quantity * item.unitPrice).toFixed(2)
    return `    <esx:line lineId="${i + 1}">
      <esx:code>${escapeXml(item.code)}</esx:code>
      <esx:description>${escapeXml(item.description)}</esx:description>
      <esx:quantity>${item.quantity}</esx:quantity>
      <esx:unit>${item.unit}</esx:unit>
      <esx:unitPrice>${item.unitPrice.toFixed(2)}</esx:unitPrice>
      <esx:total>${total}</esx:total>
    </esx:line>`
  }).join('\n')

  const grandTotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0).toFixed(2)

  return `<?xml version="1.0" encoding="UTF-8"?>
<esx:estimates xmlns:esx="http://www.xactimate.com/esx" version="2.0">
  <esx:estimate>
    <esx:header>
      <esx:projectName>${escapeXml(m.projectName)}</esx:projectName>
      <esx:insured>${escapeXml(m.customerName)}</esx:insured>
      <esx:address>${escapeXml(m.suburb)}, WA</esx:address>
      <esx:date>${date}</esx:date>
      <esx:contractor>${escapeXml(branding.companyName)}</esx:contractor>
      <esx:builderReg>${escapeXml(branding.builderReg)}</esx:builderReg>
    </esx:header>
    <esx:roof>
      <esx:planArea unit="SQFT">${(m.planArea * 10.7639).toFixed(2)}</esx:planArea>
      <esx:trueArea unit="SQFT">${(m.trueArea * 10.7639).toFixed(2)}</esx:trueArea>
      <esx:pitch>${m.pitchDegrees}</esx:pitch>
      <esx:coastalZone>${m.coastalZone ? 'true' : 'false'}</esx:coastalZone>
    </esx:roof>
    <esx:lines>
${lines}
    </esx:lines>
    <esx:total>${grandTotal}</esx:total>
  </esx:estimate>
</esx:estimates>`
}

/** Trigger a browser download of an ESX file. */
export function downloadEsx(m: MeasurementReportData, branding: Branding, filename: string): void {
  const blob = new Blob([toEsx(m, branding)], { type: 'application/xml' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
