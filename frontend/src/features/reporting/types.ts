export type TemplateType = 'measurement' | 'warranty' | 'invoice'

export interface Branding {
  companyName: string
  abn: string
  builderReg: string
  primaryColour: string
  footer: string
}

export interface MeasurementReportData {
  projectName: string
  customerName: string
  suburb: string
  planArea: number
  trueArea: number
  pitchDegrees: number
  wastePercent: number
  coastalZone: boolean
  generatedAt: string
}

export interface ReportData {
  type: TemplateType
  measurement?: MeasurementReportData
  customerName?: string
  jobNumber?: string
  amount?: number
  generatedAt?: string
}

export const DEFAULT_BRANDING: Branding = {
  companyName: 'Perth Premier Roofing & Plumbing Pty Ltd',
  abn: '51 004 395 174',
  builderReg: 'BU12345',
  primaryColour: '#0EA5E9',
  footer: 'RoofDynamics — Powered by AusGreek Developments',
}
