import { Redis } from '@upstash/redis'
import { Ratelimit } from '@upstash/ratelimit'
import type { CacheAdapter, RateLimitResult } from './types'
import { env } from '../../env'

/** Upstash Redis adapter for production caching & rate limiting. */
export class UpstashCacheAdapter implements CacheAdapter {
  readonly name = 'upstash' as const
  private redis: Redis
  private limiters = new Map<string, Ratelimit>()

  constructor() {
    if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
      throw new Error('Upstash REST URL and token are required')
    }
    this.redis = new Redis({
      url: env.UPSTASH_REDIS_REST_URL,
      token: env.UPSTASH_REDIS_REST_TOKEN,
    })
  }

  async get<T>(key: string): Promise<T | null> {
    return (await this.redis.get<T>(key)) ?? null
  }

  async set<T>(key: string, value: T, ttlSeconds = 60): Promise<void> {
    await this.redis.set(key, value, { ex: ttlSeconds })
  }

  async delete(key: string): Promise<void> {
    await this.redis.del(key)
  }

  async checkRateLimit(identifier: string, limit: number, windowSeconds: number): Promise<RateLimitResult> {
    const key = `rl:${identifier}:${limit}:${windowSeconds}`
    let limiter = this.limiters.get(key)
    if (!limiter) {
      limiter = new Ratelimit({
        redis: this.redis,
        limiter: Ratelimit.fixedWindow(limit, `${windowSeconds} s`),
        prefix: key,
      })
      this.limiters.set(key, limiter)
    }
    const result = await limiter.limit(identifier)
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
    }
  }

  async clear(): Promise<void> {
    // Upstash does not support wildcard DELETE safely in all tiers; no-op.
  }
}
