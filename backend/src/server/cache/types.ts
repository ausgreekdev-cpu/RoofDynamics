/** Typed cache contract with deterministic sandbox fallback (Guardrail #3). */
export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

export interface CacheAdapter {
  readonly name: 'upstash' | 'memory'
  get<T>(key: string): Promise<T | null>
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>
  delete(key: string): Promise<void>
  checkRateLimit(identifier: string, limit: number, windowSeconds: number): Promise<RateLimitResult>
  clear(): Promise<void>
}
