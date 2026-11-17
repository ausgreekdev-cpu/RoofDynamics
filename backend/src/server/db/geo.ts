/**
 * PostGIS geometry helpers for aerial roof measurement.
 * All helpers use parameterized Drizzle `sql` templates (no string interpolation
 * of user input) and assume SRID 4326 (WGS84 lon/lat) for stored vertices.
 */
import { sql, type SQL } from 'drizzle-orm'

export interface LonLat {
  lon: number
  lat: number
}

/** Format a WGS84 point as an EWKT literal: SRID=4326;POINT(lon lat) */
export function pointWkt({ lon, lat }: LonLat): string {
  if (!Number.isFinite(lon) || !Number.isFinite(lat)) {
    throw new Error('pointWkt: lon and lat must be finite numbers')
  }
  return `SRID=4326;POINT(${lon} ${lat})`
}

/** Build a closed WKT polygon from an ordered ring of lon/lat vertices. */
export function polygonWkt(points: LonLat[]): string {
  if (points.length < 3) throw new Error('polygonWkt: at least 3 vertices are required')
  const ring = points.map((p) => `${p.lon} ${p.lat}`).join(', ')
  // Close the ring if the caller did not repeat the first vertex
  const first = points[0]
  const last = points[points.length - 1]
  const closed = first.lon === last.lon && first.lat === last.lat
    ? ring
    : `${ring}, ${first.lon} ${first.lat}`
  return `SRID=4326;POLYGON((${closed}))`
}

/** ST_GeomFromText expression from a WKT column/value. */
export function geomFromWkt(wkt: SQL | string): SQL {
  return sql`ST_GeomFromText(${wkt}, 4326)`
}

/** Compute plan-view area in square metres using the WGS84 geodesic (geography) cast. */
export function areaSqm(wkt: SQL | string): SQL {
  return sql`ST_Area(${geomFromWkt(wkt)}::geography)`
}

/** True roof area = plan area × pitch factor × (1 + waste). */
export function trueAreaSqm(wkt: SQL | string, pitchDegrees: SQL | number, waste: SQL | number): SQL {
  return sql`(
    ST_Area(${geomFromWkt(wkt)}::geography)
    * (1 / COS(RADIANS(${pitchDegrees})))
    * (1 + ${waste})
  )`
}

/** Distance in metres between two EWKT points. */
export function distanceMeters(a: string, b: string): SQL {
  return sql`ST_Distance(${a}::geography, ${b}::geography)`
}

/** Centroid of a polygon as WKT. */
export function centroidWkt(wkt: SQL | string): SQL {
  return sql`ST_AsText(ST_Centroid(${geomFromWkt(wkt)}))`
}

/** True when a point falls inside the polygon. */
export function pointInPolygon(point: string, polygon: SQL | string): SQL {
  return sql`ST_Within(${geomFromWkt(point)}, ${geomFromWkt(polygon)})`
}

/** Create the PostGIS extension if the database supports it. */
export function createPostGISExtension(): SQL {
  return sql`CREATE EXTENSION IF NOT EXISTS postgis`
}

/** Distance from a suburb centroid used for coastal-zone detection. */
export const PERTH_COASTAL_POINTS: Record<string, LonLat> = {
  Fremantle: { lon: 115.7507, lat: -32.0564 },
  Scarborough: { lon: 115.7595, lat: -31.8966 },
  Cottesloe: { lon: 115.7621, lat: -31.9891 },
  Hillarys: { lon: 115.7667, lat: -31.8194 },
  Rockingham: { lon: 115.7331, lat: -32.2747 },
}

/** Coastal zone if any known surf-side point is within 1km of the site. */
export function isCoastalExpression(sitePoint: string): SQL {
  const clauses = Object.values(PERTH_COASTAL_POINTS).map(
    (p) => sql`ST_Distance(${sitePoint}::geography, ${pointWkt(p)}::geography) <= 1000`
  )
  return sql.join(clauses, sql` OR `)
}
