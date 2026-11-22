import { syncSupplierPrices, getSupplierPrices, getPriceForSku, clearSupplierPriceCache } from './supplierPriceCache'

describe('supplierPriceCache', () => {
  beforeEach(() => clearSupplierPriceCache())

  it('syncs sandbox catalog', async () => {
    const result = await syncSupplierPrices()
    expect(result.count).toBeGreaterThan(0)
    expect(getSupplierPrices().length).toBeGreaterThan(0)
  })

  it('returns price for known sku', async () => {
    await syncSupplierPrices()
    const entry = getPriceForSku('CB-CORR')
    expect(entry).not.toBeNull()
    expect(entry!.unitPrice).toBeGreaterThan(0)
  })

  it('returns null for unknown sku', async () => {
    await syncSupplierPrices()
    expect(getPriceForSku('NOPE')).toBeNull()
  })
})
