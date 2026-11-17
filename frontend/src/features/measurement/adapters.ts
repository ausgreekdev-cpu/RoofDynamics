/** Typed map adapter: Mapbox when token present, deterministic sandbox otherwise. */
import mapboxgl from 'mapbox-gl'
import { env } from '../../env'
import type { LonLat, MapAdapter } from './types'
import { PERTH_CENTER } from './types'

class SandboxMapAdapter implements MapAdapter {
  readonly name = 'sandbox' as const
  readonly hasToken = false
  fromPixel(x: number, y: number): LonLat {
    // Deterministic pseudo-geographic projection around Perth for offline demo.
    return {
      lon: PERTH_CENTER.lon + (x - 300) * 0.00005,
      lat: PERTH_CENTER.lat - (y - 200) * 0.00005,
    }
  }
}

class MapboxAdapter implements MapAdapter {
  readonly name = 'mapbox' as const
  readonly hasToken = true
  fromPixel(x: number, y: number): LonLat {
    // Pixel conversion requires a live map instance; handled in VectorEditor.
    return { lon: PERTH_CENTER.lon + x * 0.00001, lat: PERTH_CENTER.lat - y * 0.00001 }
  }
}

let instance: MapAdapter | null = null

export function getMapAdapter(): MapAdapter {
  if (instance) return instance
  instance = env.VITE_MAPBOX_TOKEN ? new MapboxAdapter() : new SandboxMapAdapter()
  return instance
}

export function isMapboxTokenConfigured(): boolean {
  return !!env.VITE_MAPBOX_TOKEN
}

export { mapboxgl }
