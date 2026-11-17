import { env } from '../../env'
import { MemoryQueueAdapter } from './memory'
import { InngestQueueAdapter } from './inngest'
import type { QueueAdapter } from './types'

export type { QueueAdapter, QueueEventName, QueueEventPayloads } from './types'
export { MemoryQueueAdapter } from './memory'
export { InngestQueueAdapter, inngest } from './inngest'
export { functions, segmentationWorker, pdfCompileWorker, csvBatchWorker, processProjectBatch } from './functions'
export { registerLocalWorkers } from './localWorkers'

let instance: QueueAdapter | null = null

/** Select Inngest when configured and mocks disabled; otherwise sandbox. */
export function getQueue(): QueueAdapter {
  if (instance) return instance
  const useReal = !env.ENABLE_MOCK_INTEGRATIONS && !!env.INNGEST_EVENT_KEY
  instance = useReal ? new InngestQueueAdapter() : new MemoryQueueAdapter()
  return instance
}
