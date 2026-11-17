/** Typed supplier catalog adapters (ABC Supply, Beacon) with sandbox mocks. */
import { env } from '../../env'

export interface SupplierProduct {
  sku: string
  name: string
  category: string
  unitPrice: number
  unit: string
  inStock: boolean
}

export interface SupplierAdapter {
  readonly name: string
  readonly sandbox: boolean
  listProducts(query?: string): Promise<SupplierProduct[]>
  checkPrice(sku: string, quantity: number): Promise<{ sku: string; unitPrice: number; total: number } | null>
}

const CATALOG: SupplierProduct[] = [
  { sku: 'CB-CORR', name: 'Colorbond Corrugated Sheet', category: 'Roofing', unitPrice: 32, unit: 'EA', inStock: true },
  { sku: 'CB-ULTRA', name: 'Colorbond Ultra Sheet (Coastal)', category: 'Roofing', unitPrice: 45, unit: 'EA', inStock: true },
  { sku: 'BATT-40', name: 'Topspan 40mm Batten', category: 'Structural', unitPrice: 8.5, unit: 'LF', inStock: true },
  { sku: 'ANTICON-60', name: 'Anticon 60mm Blanket', category: 'Insulation', unitPrice: 65, unit: 'EA', inStock: true },
  { sku: 'GUTTER-150', name: '150mm Quad Gutter', category: 'Roof Plumbing', unitPrice: 25, unit: 'LF', inStock: false },
]

export class SandboxSupplierAdapter implements SupplierAdapter {
  readonly name: string
  readonly sandbox = true
  constructor(label: string) { this.name = `${label} (Sandbox)` }

  async listProducts(query?: string): Promise<SupplierProduct[]> {
    if (!query) return CATALOG
    const q = query.toLowerCase()
    return CATALOG.filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))
  }

  async checkPrice(sku: string, quantity: number) {
    const product = CATALOG.find((p) => p.sku === sku)
    if (!product) return null
    return { sku, unitPrice: product.unitPrice, total: Math.round(product.unitPrice * quantity * 100) / 100 }
  }
}

export class LiveSupplierAdapter implements SupplierAdapter {
  readonly name: string
  readonly sandbox = false
  constructor(label: string) { this.name = `${label} (Live)` }

  async listProducts(): Promise<SupplierProduct[]> {
    if (!env.ENABLE_MOCK_INTEGRATIONS && !env.ABC_SUPPLY_API_KEY && !env.BEACON_API_KEY) {
      throw new Error('Supplier API credentials required for live catalog')
    }
    throw new Error('Live supplier transport not configured — see integrations README')
  }

  async checkPrice(): Promise<null> {
    throw new Error('Live supplier transport not configured — see integrations README')
  }
}

export function getSupplierAdapter(provider: 'abc' | 'beacon'): SupplierAdapter {
  const label = provider === 'abc' ? 'ABC Supply' : 'Beacon'
  const key = provider === 'abc' ? env.ABC_SUPPLY_API_KEY : env.BEACON_API_KEY
  return env.ENABLE_MOCK_INTEGRATIONS || !key
    ? new SandboxSupplierAdapter(label)
    : new LiveSupplierAdapter(label)
}
