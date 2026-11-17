import { Inngest } from 'inngest'
import { env } from '../../env'
import type { QueueAdapter, QueueEventName, QueueEventPayloads } from './types'

export const inngest = new Inngest({
  id: 'roofdynamics',
  eventKey: env.INNGEST_EVENT_KEY || undefined,
  isDev: env.INNGEST_DEV,
})

/** Production adapter backed by Inngest. */
export class InngestQueueAdapter implements QueueAdapter {
  readonly name = 'inngest' as const
  private log: Array<{ event: QueueEventName; data: unknown }> = []

  async send<K extends QueueEventName>(event: K, data: QueueEventPayloads[K]): Promise<{ id: string }> {
    const result = await inngest.send({ name: event, data })
    this.log.push({ event, data })
    const id = Array.isArray(result) ? String(result[0]?.id ?? '') : String((result as any)?.id ?? '')
    return { id }
  }

  on<K extends QueueEventName>(_event: K, _handler: (data: QueueEventPayloads[K]) => Promise<void> | void): void {
    // Handlers are declared as Inngest functions (see functions.ts), not here.
  }

  history(): Array<{ event: QueueEventName; data: unknown }> {
    return [...this.log]
  }
}
