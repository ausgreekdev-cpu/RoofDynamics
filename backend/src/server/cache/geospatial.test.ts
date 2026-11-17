import { geoCacheKey, cacheGeo, getCachedGeo, haversineMeters, isCoastal, toWkt } from './geospatial'
import { MemoryCacheAdapter } from './memory'
import { getCache } from './index'

describe('geospatial cache', () => {
  it('builds stable keys from coordinates', () => {
    const key = geoCacheKey('coastal', { lon: 115.7507, lat: -32.0564 })
    expect(key).toBe('geo:coastal:115.75070:-32.05640')
    expect(key).toBe(geoCacheKey('coastal', { lon: 115.7507, lat: -32.0564 }))
  })

  it('caches and retrieves geographic values', async () => {
    const point = { lon: 115.75, lat: -32.05 }
    await cacheGeo('coastal', point, true)
    const cached = await getCachedGeo<boolean>('coastal', point)
    expect(cached?.value).toBe(true)
    expect(cached?.cached).toBe(true)
  })

  it('returns null for uncached points', async () => {
    expect(await getCachedGeo('coastal', { lon: 1, lat: 1 })).toBeNull()
  })

  it('computes haversine distance', () => {
    expect(haversineMeters({ lon: 0, lat: 0 }, { lon: 0, lat: 1 })).toBeCloseTo(111195, -2)
    expect(haversineMeters({ lon: 0, lat: 0 }, { lon: 0, lat: 0 })).toBe(0)
  })

  it('detects coastal points', () => {
    expect(isCoastal({ lon: 115.7507, lat: -32.0564 })).toBe(true)
    expect(isCoastal({ lon: 121, lat: -25 })).toBe(false)
  })

  it('emits WKT points', () => {
    expect(toWkt({ lon: 115.75, lat: -32.05 })).toBe('SRID=4326;POINT(115.75 -32.05)')
  })
})
