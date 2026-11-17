import { getStorageAdapter, SandboxStorageAdapter } from './storage'

describe('storage adapter sandbox', () => {
  it('selects sandbox when mocks enabled', () => {
    expect(getStorageAdapter()).toBeInstanceOf(SandboxStorageAdapter)
  })

  it('stores, retrieves URL and deletes objects', async () => {
    const adapter = new SandboxStorageAdapter()
    const result = await adapter.put('reports/test.pdf', Buffer.from('pdf'), 'application/pdf')
    expect(result.key).toBe('reports/test.pdf')
    expect(result.size).toBe(3)
    expect(result.url).toContain('sandbox://')
    expect(await adapter.getUrl('reports/test.pdf')).toContain('sandbox://')
    await adapter.delete('reports/test.pdf')
    expect(await adapter.getUrl('reports/test.pdf')).toBe('')
  })

  it('handles binary buffers', async () => {
    const adapter = new SandboxStorageAdapter()
    const bytes = new Uint8Array([1, 2, 3, 4])
    const result = await adapter.put('photos/a.jpg', bytes, 'image/jpeg')
    expect(result.size).toBe(4)
  })
})
