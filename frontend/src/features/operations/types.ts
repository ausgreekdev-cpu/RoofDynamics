export interface DispatchJob {
  id: string
  jobNumber: string
  status: string
  scheduledDate?: string
  suburb?: string
  customerName?: string
  crewLeadId?: string
  crewIds: string[]
}

export interface CrewResource {
  id: string
  name: string
  role: string
  hasWhiteCard: boolean
  hasHeightTicket: boolean
}

export interface SupplierPO {
  id: string
  poNumber: string
  supplierName: string
  totalAmount: number
  status: string
  createdAt: string
}
