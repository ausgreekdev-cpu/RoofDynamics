/** CSV batch parser + row validator for project imports. */
import Papa from 'papaparse'

export interface CsvProjectRow {
  name: string
  customerName: string
  customerEmail: string
  address: string
  suburb: string
  state: string
  postcode: string
  status: string
  coastalZone: boolean
  pitchDegrees: number
  planArea: number
  notes: string
}

export interface ParsedBatch {
  rows: CsvProjectRow[]
  errors: Array<{ row: number; message: string }>
}

const REQUIRED = ['name', 'customername'] as const

/** Parse a CSV string into validated project rows. */
export function parseProjectCsv(csv: string): ParsedBatch {
  const parsed = Papa.parse<Record<string, string>>(csv, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase().replace(/[\s_-]+/g, ''),
  })

  const errors: ParsedBatch['errors'] = []
  const rows: CsvProjectRow[] = []

  parsed.data.forEach((raw, index) => {
    const rowNumber = index + 2 // header is row 1
    const missing = REQUIRED.filter((key) => !String(raw[key] ?? '').trim())
    if (missing.length) {
      errors.push({ row: rowNumber, message: `Missing required: ${missing.join(', ')}` })
      return
    }
    rows.push({
      name: String(raw.name).trim(),
      customerName: String(raw.customername).trim(),
      customerEmail: String(raw.customeremail ?? '').trim(),
      address: String(raw.address ?? '').trim(),
      suburb: String(raw.suburb ?? '').trim(),
      state: String(raw.state ?? 'WA').trim().toUpperCase() || 'WA',
      postcode: String(raw.postcode ?? '').trim(),
      status: String(raw.status ?? 'NEW').trim().toUpperCase() || 'NEW',
      coastalZone: /^(true|1|yes)$/i.test(String(raw.coastalzone ?? '')),
      pitchDegrees: Number(raw.pitchdegrees ?? 22) || 22,
      planArea: Number(raw.planarea ?? 0) || 0,
      notes: String(raw.notes ?? '').trim(),
    })
  })

  parsed.errors.forEach((err) => {
    errors.push({ row: (err.row ?? 0) + 1, message: err.message })
  })

  return { rows, errors }
}
