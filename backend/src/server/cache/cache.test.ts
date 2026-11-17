import { MemoryCacheAdapter, getCache } from './index'

describe('cache sandbox adapter', () => {
  let cache: MemoryCacheAdapter

  beforeEach(() => { cache = new MemoryCacheAdapter() })

  it('stores and retrieves values', async () => {
    await cache.set('quote:1', { total: 35000 }, 60)
    expect(await cache.get('quote:1')).toEqual({ total: 35000 })
  })

  it('expires values with zero TTL', async () => {
    await cache.set('temp', 'value', 0)
    expect(await cache.get('temp')).toBeNull()
  })

  it('deletes values', async () => {
    await cache.set('key', 'value', 60)
    await cache.delete('key')
    expect(await cache.get('key')).toBeNull()
  })

  it('allows requests under the limit', async () => {
    const r1 = await cache.checkRateLimit('ip-1', 2, 60)
    const r2 = await cache.checkRateLimit('ip-1', 2, 60)
    expect(r1.success).toBe(true)
    expect(r2.success).toBe(true)
    expect(r2.remaining).toBe(0)
  })

  it('blocks requests over the limit', async () => {
    await cache.checkRateLimit('ip-2', 1, 60)
    const blocked = await cache.checkRateLimit('ip-2', 1, 60)
    expect(blocked.success).toBe(false)
    expect(blocked.remaining).toBe(0)
  })

  it('isolates rate limits by identifier', async () => {
    await cache.checkRateLimit('a', 1, 60)
    const b = await cache.checkRateLimit('b', 1, 60)
    expect(b.success).toBe(true)
  })

  it('clears all state', async () => {
    await cache.set('key', 'value', 60)
    await cache.checkRateLimit('ip', 1, 60)
    await cache.clear()
    expect(cache.size()).toBe(0)
    expect((await cache.checkRateLimit('ip', 1, 60)).success).toBe(true)
  })

  it('selects the sandbox adapter when mocks are enabled', () => {
    expect(getCache().name).toBe('memory')
  })
})
