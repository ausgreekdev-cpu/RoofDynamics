import type { CacheAdapter, RateLimitResult } from './types'

interface Entry { value: unknown; expiresAt: number }

/** Deterministic in-memory sandbox used when Upstash is not configured. */
export class MemoryCacheAdapter implements CacheAdapter {
  readonly name = 'memory' as const
  private store = new Map<string, Entry>()
  private rateLimits = new Map<string, { count: number; reset: number }>()

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key)
    if (!entry) return null
    if (entry.expiresAt <= Date.now()) {
      this.store.delete(key)
      return null
    }
    return entry.value as T
  }

  async set<T>(key: string, value: T, ttlSeconds = 60): Promise<void> {
    this.store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 })
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key)
  }

  async checkRateLimit(identifier: string, limit: number, windowSeconds: number): Promise<RateLimitResult> {
    const now = Date.now()
    const reset = now + windowSeconds * 1000
    const current = this.rateLimits.get(identifier)
    if (!current || current.reset < now) {
      this.rateLimits.set(identifier, { count: 1, reset })
      return { success: true, limit, remaining: limit - 1, reset }
    }
    if (current.count >= limit) {
      return { success: false, limit, remaining: 0, reset: current.reset }
    }
    current.count += 1
    return { success: true, limit, remaining: limit - current.count, reset: current.reset }
  }

  async clear(): Promise<void> {
    this.store.clear()
    this.rateLimits.clear()
  }

  size(): number { return this.store.size }
}
