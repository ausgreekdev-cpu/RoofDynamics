import { getSupplierAdapter } from '../integrations/suppliers'
import fs from 'node:fs'
import path from 'node:path'

export interface PriceEntry {
  sku: string
  name: string
  category: string
  unitPrice: number
  unit: string
  inStock: boolean
  provider: string
  syncedAt: string
}

const CACHE_FILE = path.join(process.cwd(), 'data', 'supplier-prices.json')

let cache: PriceEntry[] = []
let loaded = false

function load() {
  if (loaded) return
  loaded = true
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const raw = fs.readFileSync(CACHE_FILE, 'utf8')
      cache = JSON.parse(raw)
    }
  } catch {
    cache = []
  }
}

function persist() {
  try {
    const dir = path.dirname(CACHE_FILE)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2))
  } catch {
    // ignore persistence errors in sandbox
  }
}

export async function syncSupplierPrices(): Promise<{ count: number; providers: string[] }> {
  load()
  const providers = ['abc', 'beacon'] as const
  const synced: PriceEntry[] = []
  const now = new Date().toISOString()
  for (const p of providers) {
    try {
      const adapter = getSupplierAdapter(p)
      const products = await adapter.listProducts()
      for (const prod of products) {
        synced.push({
          sku: prod.sku,
          name: prod.name,
          category: prod.category,
          unitPrice: prod.unitPrice,
          unit: prod.unit,
          inStock: prod.inStock,
          provider: adapter.name,
          syncedAt: now,
        })
      }
    } catch {
      // provider unavailable; skip
    }
  }
  // Merge: keep latest per sku
  const map = new Map<string, PriceEntry>()
  for (const e of cache) map.set(e.sku, e)
  for (const e of synced) map.set(e.sku, e)
  cache = Array.from(map.values())
  persist()
  return { count: synced.length, providers: providers.map(String) }
}

export function getSupplierPrices(): PriceEntry[] {
  load()
  return cache
}

export function getPriceForSku(sku: string): PriceEntry | null {
  load()
  return cache.find((e) => e.sku === sku) || null
}

export function clearSupplierPriceCache() {
  cache = []
  loaded = true
  try {
    if (fs.existsSync(CACHE_FILE)) fs.unlinkSync(CACHE_FILE)
  } catch {
    // ignore
  }
}
