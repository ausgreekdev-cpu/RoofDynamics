/** Storm/hail lookup adapter: deterministic sandbox + NOAA-shaped live contract. */
import { env } from '../../env'
import type { StormEvent, StormLookupAdapter } from './types'

export class SandboxStormAdapter implements StormLookupAdapter {
  readonly name = 'NOAA Storm Events (Sandbox)'
  readonly sandbox = true

  async lookup(suburb: string, from: string, to: string): Promise<StormEvent[]> {
    // Deterministic hash of suburb produces repeatable demo events.
    const seed = suburb.split('').reduce((s, c) => s + c.charCodeAt(0), 0)
    const count = seed % 3
    return Array.from({ length: count }, (_, i) => {
      const hail = 10 + ((seed + i * 7) % 60)
      const wind = 40 + ((seed + i * 13) % 70)
      return {
        id: `storm-${seed}-${i}`,
        date: from || new Date().toISOString().slice(0, 10),
        suburb,
        hailSizeMm: hail,
        windSpeedKmh: wind,
        severity: hail > 50 || wind > 90 ? 'severe' : hail > 25 || wind > 65 ? 'moderate' : 'low',
      }
    })
  }
}

export class LiveStormAdapter implements StormLookupAdapter {
  readonly name = 'NOAA Storm Events (Live)'
  readonly sandbox = false

  async lookup(_suburb: string, _from: string, _to: string): Promise<StormEvent[]> {
    if (!env.NOAA_API_KEY) throw new Error('NOAA_API_KEY is required for live storm lookup')
    // Live transport requires an approved data contract; never fabricate URLs.
    throw new Error('Live storm lookup transport not configured — see integrations README')
  }
}

export function getStormAdapter(): StormLookupAdapter {
  return env.ENABLE_MOCK_INTEGRATIONS || !env.NOAA_API_KEY
    ? new SandboxStormAdapter()
    : new LiveStormAdapter()
}
