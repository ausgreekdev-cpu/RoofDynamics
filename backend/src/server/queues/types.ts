/** Typed background-job contract with deterministic sandbox fallback. */
export type QueueEventName =
  | 'measurement/segmentation.requested'
  | 'report/pdf.requested'
  | 'projects/csv-batch.requested'

export interface QueueEventPayloads {
  'measurement/segmentation.requested': { measurementId: string; tenantId: string; imageUrl?: string }
  'report/pdf.requested': { reportId: string; tenantId: string }
  'projects/csv-batch.requested': { batchId: string; tenantId: string; rows: number }
}

export interface QueueAdapter {
  readonly name: 'inngest' | 'memory'
  send<K extends QueueEventName>(event: K, data: QueueEventPayloads[K]): Promise<{ id: string }>
  on<K extends QueueEventName>(event: K, handler: (data: QueueEventPayloads[K]) => Promise<void> | void): void
  history(): Array<{ event: QueueEventName; data: unknown }>
}
