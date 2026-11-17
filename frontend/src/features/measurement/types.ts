import type { LonLat } from './area'

export type { LonLat }

export interface RoofPolygon {
  id: string
  label: string
  vertices: LonLat[]
  pitchDegrees: number
  planAreaSqm: number
  trueAreaSqm: number
}

export interface MapAdapter {
  readonly name: 'mapbox' | 'sandbox'
  readonly hasToken: boolean
  /** Convert a pixel click to lon/lat for the active viewport. */
  fromPixel(x: number, y: number): LonLat
}

export const PERTH_CENTER: LonLat = { lon: 115.8575, lat: -31.9523 }
