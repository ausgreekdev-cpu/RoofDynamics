import { env } from '../../env'
import { MemoryCacheAdapter } from './memory'
import { UpstashCacheAdapter } from './redis'
import type { CacheAdapter } from './types'

export type { CacheAdapter, RateLimitResult } from './types'
export { MemoryCacheAdapter } from './memory'
export { UpstashCacheAdapter } from './redis'
export * from './geospatial'

let instance: CacheAdapter | null = null

/** Select Upstash when configured and mocks disabled; otherwise sandbox. */
export function getCache(): CacheAdapter {
  if (instance) return instance
  const useReal = !env.ENABLE_MOCK_INTEGRATIONS
    && !!env.UPSTASH_REDIS_REST_URL
    && !!env.UPSTASH_REDIS_REST_TOKEN
  instance = useReal ? new UpstashCacheAdapter() : new MemoryCacheAdapter()
  return instance
}

/** Express rate-limit middleware factory. */
export function rateLimit(limit: number, windowSeconds: number) {
  return async (req: any, res: any, next: () => void) => {
    const identifier = req.ip || req.headers['x-forwarded-for'] || 'unknown'
    const result = await getCache().checkRateLimit(String(identifier), limit, windowSeconds)
    res.setHeader('X-RateLimit-Limit', result.limit)
    res.setHeader('X-RateLimit-Remaining', result.remaining)
    if (!result.success) {
      res.status(429).json({ error: 'Too many requests', retryAfterMs: result.reset - Date.now() })
      return
    }
    next()
  }
}
