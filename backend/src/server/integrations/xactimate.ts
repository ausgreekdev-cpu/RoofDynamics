/** Xactimate integration adapter (sandbox by default). ESX generation lives client-side. */
import { env } from '../../env'

export interface XactimateEstimate {
  id: string
  status: 'DRAFT' | 'SUBMITTED'
  lineItems: number
}

export interface XactimateAdapter {
  readonly name: string
  readonly sandbox: boolean
  createEstimate(reference: string): Promise<XactimateEstimate>
}

export class SandboxXactimateAdapter implements XactimateAdapter {
  readonly name = 'Xactimate (Sandbox)'
  readonly sandbox = true
  async createEstimate(reference: string): Promise<XactimateEstimate> {
    return { id: `esx_${reference}`, status: 'DRAFT', lineItems: 4 }
  }
}

export class LiveXactimateAdapter implements XactimateAdapter {
  readonly name = 'Xactimate (Live)'
  readonly sandbox = false
  async createEstimate(): Promise<XactimateEstimate> {
    if (!env.XACTIMATE_API_KEY) throw new Error('XACTIMATE_API_KEY required')
    throw new Error('Live Xactimate transport not configured — see integrations README')
  }
}

export function getXactimateAdapter(): XactimateAdapter {
  return env.ENABLE_MOCK_INTEGRATIONS || !env.XACTIMATE_API_KEY
    ? new SandboxXactimateAdapter()
    : new LiveXactimateAdapter()
}
