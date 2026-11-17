export type PipelineStage = 'NEW' | 'CONTACTED' | 'QUOTING' | 'NEGOTIATION' | 'WON' | 'LOST'

export interface Deal {
  id: string
  name: string
  customerName: string
  suburb: string
  estimatedValue: number
  stage: PipelineStage
  probability: number
  signed?: boolean
}

export interface SignatureRecord {
  id: string
  dealId: string
  signerName: string
  dataUrl: string
  signedAt: string
}

export const STAGES: PipelineStage[] = ['NEW', 'CONTACTED', 'QUOTING', 'NEGOTIATION', 'WON', 'LOST']
