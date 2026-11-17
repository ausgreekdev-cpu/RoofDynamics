/** Geospatial caching helpers — cache suburb lookups and coastal checks. */
import { getCache } from './index'
import { pointWkt, PERTH_COASTAL_POINTS, type LonLat } from '../db/geo'

export interface CachedGeoResult<T> {
  value: T
  cached: boolean
  key: string
}

/** Stable cache key from a lon/lat rounded to ~11m precision. */
export function geoCacheKey(prefix: string, point: LonLat): string {
  return `geo:${prefix}:${point.lon.toFixed(5)}:${point.lat.toFixed(5)}`
}

/** Cache a value by geographic point. */
export async function cacheGeo<T>(prefix: string, point: LonLat, value: T, ttlSeconds = 3600): Promise<CachedGeoResult<T>> {
  const key = geoCacheKey(prefix, point)
  await getCache().set(key, value, ttlSeconds)
  return { value, cached: false, key }
}

/** Retrieve a cached value by geographic point. */
export async function getCachedGeo<T>(prefix: string, point: LonLat): Promise<CachedGeoResult<T> | null> {
  const key = geoCacheKey(prefix, point)
  const value = await getCache().get<T>(key)
  return value === null ? null : { value, cached: true, key }
}

/** Determine coastal zone from cached Suburb centroid distances (haversine). */
export function haversineMeters(a: LonLat, b: LonLat): number {
  const R = 6371000
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLon = toRad(b.lon - a.lon)
  const h = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

/** Coastal if any known surf-side point is within 1km. */
export function isCoastal(point: LonLat): boolean {
  return Object.values(PERTH_COASTAL_POINTS).some((p) => haversineMeters(point, p) <= 1000)
}

/** WKT representation for spatial queries. */
export function toWkt(point: LonLat): string { return pointWkt(point) }
