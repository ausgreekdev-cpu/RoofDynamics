/** Wire deterministic sandbox handlers for background jobs. */
import { getQueue } from './index'
import { processProjectBatch } from './functions'

let registered = false

export function registerLocalWorkers(): void {
  if (registered) return
  const queue = getQueue()
  if (queue.name !== 'memory') return
  queue.on('projects/csv-batch.requested', async (data) => {
    await processProjectBatch(data.batchId, data.tenantId)
  })
  registered = true
}
