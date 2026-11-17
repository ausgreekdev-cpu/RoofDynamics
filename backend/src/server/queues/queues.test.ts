import { MemoryQueueAdapter, getQueue } from './index'

describe('queue sandbox adapter', () => {
  let queue: MemoryQueueAdapter

  beforeEach(() => { queue = new MemoryQueueAdapter() })

  it('emits deterministic event ids', async () => {
    const r1 = await queue.send('report/pdf.requested', { reportId: 'r1', tenantId: 't1' })
    const r2 = await queue.send('report/pdf.requested', { reportId: 'r2', tenantId: 't1' })
    expect(r1.id).toBe('mock-event-1')
    expect(r2.id).toBe('mock-event-2')
  })

  it('dispatches to registered handlers', async () => {
    const received: string[] = []
    queue.on('measurement/segmentation.requested', (data) => {
      received.push(data.measurementId)
    })
    await queue.send('measurement/segmentation.requested', {
      measurementId: 'm1', tenantId: 't1', imageUrl: 'r2://x',
    })
    expect(received).toEqual(['m1'])
  })

  it('records history for assertions', async () => {
    await queue.send('projects/csv-batch.requested', { batchId: 'b1', tenantId: 't1', rows: 50 })
    expect(queue.history()).toHaveLength(1)
    expect(queue.history()[0].event).toBe('projects/csv-batch.requested')
  })

  it('supports multiple handlers for one event', async () => {
    const calls: string[] = []
    queue.on('report/pdf.requested', () => { calls.push('a') })
    queue.on('report/pdf.requested', () => { calls.push('b') })
    await queue.send('report/pdf.requested', { reportId: 'r1', tenantId: 't1' })
    expect(calls).toEqual(['a', 'b'])
  })

  it('selects the sandbox adapter when mocks are enabled', () => {
    expect(getQueue().name).toBe('memory')
  })
})
