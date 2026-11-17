import type { QueueAdapter, QueueEventName, QueueEventPayloads } from './types'

type Handler = (data: any) => Promise<void> | void

/** Deterministic in-process event bus used when Inngest is not configured. */
export class MemoryQueueAdapter implements QueueAdapter {
  readonly name = 'memory' as const
  private handlers = new Map<QueueEventName, Handler[]>()
  private log: Array<{ event: QueueEventName; data: unknown }> = []
  private counter = 0

  async send<K extends QueueEventName>(event: K, data: QueueEventPayloads[K]): Promise<{ id: string }> {
    this.counter += 1
    const id = `mock-event-${this.counter}`
    this.log.push({ event, data })
    const handlers = this.handlers.get(event) || []
    // Deterministic async dispatch without timers
    await Promise.resolve()
    for (const handler of handlers) await handler(data)
    return { id }
  }

  on<K extends QueueEventName>(event: K, handler: (data: QueueEventPayloads[K]) => Promise<void> | void): void {
    const list = this.handlers.get(event) || []
    list.push(handler as Handler)
    this.handlers.set(event, list)
  }

  history(): Array<{ event: QueueEventName; data: unknown }> {
    return [...this.log]
  }
}
