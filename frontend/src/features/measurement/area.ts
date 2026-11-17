/** Turf.js-based roof measurement math (plan area, true area, coastal detection). */
import { area, booleanPointInPolygon, point, polygon } from '@turf/turf'

export interface LonLat { lon: number; lat: number }

const WASTE_GABLE = 0.07
const WASTE_HIP = 0.12

/** Plan-view area in square metres from a lon/lat ring. */
export function planAreaSqm(vertices: LonLat[]): number {
  if (vertices.length < 3) return 0
  const coords = [...vertices]
  const first = coords[0]
  const last = coords[coords.length - 1]
  if (first.lon !== last.lon || first.lat !== last.lat) coords.push(first)
  const poly = polygon([[
    [coords[0].lon, coords[0].lat] as [number, number],
    ...coords.slice(1).map((c) => [c.lon, c.lat] as [number, number]),
  ]])
  return area(poly)
}

/** Pitch multiplier: 1 / cos(pitchDegrees) */
export function pitchFactor(pitchDegrees: number): number {
  return 1 / Math.cos((pitchDegrees * Math.PI) / 180)
}

/** True roof area = plan area × pitch factor × (1 + waste). */
export function trueAreaSqm(vertices: LonLat[], pitchDegrees: number, roofType: 'gable' | 'hip_valley' = 'gable'): number {
  const waste = roofType === 'hip_valley' ? WASTE_HIP : WASTE_GABLE
  return planAreaSqm(vertices) * pitchFactor(pitchDegrees) * (1 + waste)
}

export function containsPoint(vertices: LonLat[], target: LonLat): boolean {
  if (vertices.length < 3) return false
  const coords = [...vertices]
  coords.push(coords[0])
  const poly = polygon([[
    [coords[0].lon, coords[0].lat] as [number, number],
    ...coords.slice(1).map((c) => [c.lon, c.lat] as [number, number]),
  ]])
  return booleanPointInPolygon(point([target.lon, target.lat]), poly)
}

export const PERTH_COASTAL_POINTS: Record<string, LonLat> = {
  Fremantle: { lon: 115.7507, lat: -32.0564 },
  Scarborough: { lon: 115.7595, lat: -31.8966 },
  Cottesloe: { lon: 115.7621, lat: -31.9891 },
  Hillarys: { lon: 115.7667, lat: -31.8194 },
  Rockingham: { lon: 115.7331, lat: -32.2747 },
}

/** Coastal zone if any known surf-side point is inside the roof polygon. */
export function isCoastalPolygon(vertices: LonLat[]): boolean {
  return Object.values(PERTH_COASTAL_POINTS).some((p) => containsPoint(vertices, p))
}
