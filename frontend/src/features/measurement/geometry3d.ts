/** Pure geometry helpers for the Three.js roof viewer (WebGL-free, unit-testable). */
import type { LonLat } from './area'

export interface RoofMeshData {
  /** Flat triangle vertices [x,y,z, ...] in scene units. */
  positions: number[]
  width: number
  depth: number
  ridgeHeight: number
  pitchDegrees: number
}

/** Approximate metres-per-degree at Perth latitude. */
export const METRES_PER_DEGREE_LAT = 111_320
export const METRES_PER_DEGREE_LON = 111_320 * Math.cos((-31.95 * Math.PI) / 180)

/** Convert lon/lat vertices to local XY metres centred on the bounding box. */
export function toLocalMetres(vertices: LonLat[]): Array<{ x: number; y: number }> {
  if (vertices.length === 0) return []
  const xs = vertices.map((v) => v.lon * METRES_PER_DEGREE_LON)
  const ys = vertices.map((v) => v.lat * METRES_PER_DEGREE_LAT)
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2
  const cy = (Math.min(...ys) + Math.max(...ys)) / 2
  return vertices.map((v) => ({
    x: v.lon * METRES_PER_DEGREE_LON - cx,
    y: v.lat * METRES_PER_DEGREE_LAT - cy,
  }))
}

/** Ridge height for a gable roof of given span and pitch. */
export function ridgeHeight(spanMetres: number, pitchDegrees: number): number {
  return (spanMetres / 2) * Math.tan((pitchDegrees * Math.PI) / 180)
}

/** Build positions for a two-plane gable roof as two quads (triangulated). */
export function buildGableMesh(
  spanMetres: number,
  depthMetres: number,
  pitchDegrees: number
): RoofMeshData {
  const h = ridgeHeight(spanMetres, pitchDegrees)
  const hw = spanMetres / 2
  const hd = depthMetres / 2
  // Left slope: (-hw,0) to (0,h); right slope: (0,h) to (hw,0)
  const positions = [
    -hw, 0, -hd, 0, h, -hd, -hw, 0, hd,
    -hw, 0, hd, 0, h, -hd, 0, h, hd,
    0, h, -hd, hw, 0, -hd, 0, h, hd,
    0, h, hd, hw, 0, -hd, hw, 0, hd,
  ]
  return { positions, width: spanMetres, depth: depthMetres, ridgeHeight: h, pitchDegrees }
}

/** Normalize scene units so large roofs fit a reasonable camera distance. */
export function sceneScale(spanMetres: number): number {
  return spanMetres > 0 ? 10 / spanMetres : 1
}
