export interface Project {
  id: string
  tenantId: string
  name: string
  customerName: string
  customerEmail?: string
  address?: string
  suburb?: string
  state: string
  postcode?: string
  status: string
  coastalZone: boolean
  pitchDegrees: number
  planArea: number
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface ProjectDraft {
  name: string
  customerName: string
  customerEmail: string
  address: string
  suburb: string
  state: string
  postcode: string
  status: string
  coastalZone: boolean
  pitchDegrees: number
  planArea: number
  notes: string
}

export interface AuditEntry {
  id: string
  tenantId: string
  userId?: string
  action: string
  entityType: string
  entityId: string
  oldValues?: string
  newValues?: string
  createdAt: string
}

export const EMPTY_DRAFT: ProjectDraft = {
  name: '',
  customerName: '',
  customerEmail: '',
  address: '',
  suburb: '',
  state: 'WA',
  postcode: '',
  status: 'NEW',
  coastalZone: false,
  pitchDegrees: 22,
  planArea: 0,
  notes: '',
}

export const PROJECT_STATUSES = ['NEW', 'QUOTING', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD', 'CANCELLED']
