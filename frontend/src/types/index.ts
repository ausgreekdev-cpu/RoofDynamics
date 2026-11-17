export type SubscriptionTier =
  | "STARTER"
  | "PRO_SAFETY"
  | "OPS_ERP"
  | "EMPIRE_ENTERPRISE_LEASE";

export type ModuleKey =
  | "CRM_QUOTING"
  | "WMS_MRP"
  | "OPERATIONS_HRIS"
  | "WHS_SAFETY"
  | "EAM_FLEET"
  | "ACCOUNTING"
  | "PUBLIC_WEBSITE"
  | "AI_SOCIAL_AGENT"
  | "BI_EXECUTIVE"
  | "SAAS_SUPER_ADMIN";

export type LeadStatus = "NEW" | "CONTACTED" | "QUOTING" | "NEGOTIATION" | "WON" | "LOST";
export type QuoteStatus = "DRAFT" | "SENT" | "ACCEPTED" | "REJECTED" | "EXPIRED";
export type JobStatus = "PENDING" | "SCHEDULED" | "IN_PROGRESS" | "ON_HOLD" | "COMPLETED" | "CANCELLED";
export type InvoiceStatus = "DRAFT" | "SENT" | "PAID" | "OVERDUE" | "CANCELLED";
export type InvoiceMilestone = "DEPOSIT_10" | "MATERIALS_50" | "COMPLETION_40";
export type StockLocation = "WELSHPOOL_MAIN_YARD" | "HILUX_UTE_1" | "ISUZU_TRUCK_2";
export type TicketType = "WHITE_CARD" | "WORKING_AT_HEIGHTS" | "EWP" | "PLUMBING_LICENCE" | "BUILDER_REGISTRATION";
export type TicketStatus = "VALID" | "EXPIRED" | "PENDING_RENEWAL";
export type AssetType = "UTE" | "TRAILER" | "EDGE_PROTECTION_RAIL_KIT" | "NAIL_GUN" | "HARNESS" | "OTHER";
export type AssetStatus = "ACTIVE" | "MAINTENANCE" | "RETIRED";
export type InspectionStatus = "PASSED" | "FAILED" | "DUE" | "OVERDUE";
export type BASPeriod = "Q1" | "Q2" | "Q3" | "Q4";

export interface Tenant {
  id: string;
  name: string;
  abn?: string;
  builderRegNumber?: string;
  plumberLicence?: string;
  primaryColour: string;
  subscriptionTier: SubscriptionTier;
  monthlyLeaseFee: number;
  isWhiteLabel: boolean;
  logoUrl?: string;
  createdAt: string;
  updatedAt: string;
  moduleEntitlements?: ModuleEntitlement[];
  _count?: {
    users: number;
    quotes: number;
    jobs: number;
    invoices: number;
  };
}

export interface ModuleEntitlement {
  id: string;
  tenantId: string;
  moduleKey: ModuleKey;
  isEnabled: boolean;
  addOnPrice: number;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  tenantId: string;
  email: string;
  name: string;
  role: string;
  avatarUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Lead {
  id: string;
  tenantId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  suburb?: string;
  status: LeadStatus;
  source?: string;
  estimatedValue: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Quote {
  id: string;
  tenantId: string;
  leadId?: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAddress?: string;
  customerSuburb?: string;
  planArea: number;
  pitchDegrees: number;
  wastePercentage: number;
  roofHeight: number;
  isAsbestosRemoval: boolean;
  asbestosArea: number;
  totalIncGst: number;
  totalExGst: number;
  gstAmount: number;
  status: QuoteStatus;
  coastalZone: boolean;
  corrosionFlag: boolean;
  requiresBuilderReg: boolean;
  requiresPlumbingLic: boolean;
  requiresSWMS: boolean;
  compliancePassed: boolean;
  complianceNotes?: string;
  createdAt: string;
  updatedAt: string;
  acceptedAt?: string;
  bomItems?: BOMItem[];
  lead?: Lead;
  job?: Job;
}

export interface Job {
  id: string;
  tenantId: string;
  quoteId: string;
  jobNumber: string;
  status: JobStatus;
  scheduledDate?: string;
  completedDate?: string;
  roofHeight: number;
  isAsbestosRemoval: boolean;
  asbestosArea: number;
  swmsSigned: boolean;
  edgeProtectionVerified: boolean;
  crewLeadId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  quote?: Quote;
  crewAssignments?: CrewAssignment[];
  stockReservations?: StockReservation[];
  invoices?: Invoice[];
}

export interface BOMItem {
  id: string;
  tenantId: string;
  quoteId: string;
  itemType: string;
  itemName: string;
  quantity: number;
  unit: string;
  unitCost: number;
  totalCost: number;
  isCoastalGrade: boolean;
  createdAt: string;
}

export interface StockItem {
  id: string;
  tenantId: string;
  sku: string;
  name: string;
  description?: string;
  location: StockLocation;
  quantityOnHand: number;
  quantityReserved: number;
  reorderPoint: number;
  unitCost: number;
  supplier?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WarehouseLocation {
  id: string;
  tenantId: string;
  name: string;
  address?: string;
  isActive: boolean;
  createdAt: string;
}

export interface StockReservation {
  id: string;
  tenantId: string;
  jobId: string;
  stockItemId: string;
  quantity: number;
  reservedAt: string;
  releasedAt?: string;
  stockItem?: StockItem;
}

export interface CrewMember {
  id: string;
  tenantId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  role: string;
  hireDate: string;
  isActive: boolean;
  hourlyRate: number;
  createdAt: string;
  updatedAt: string;
  hrisProfile?: HRISProfile;
  tickets?: Ticket[];
}

export interface CrewAssignment {
  id: string;
  tenantId: string;
  jobId: string;
  crewMemberId: string;
  assignedAt: string;
  crewMember?: CrewMember;
}

export interface HRISProfile {
  id: string;
  tenantId: string;
  crewMemberId: string;
  whiteCardNumber?: string;
  whiteCardExpiry?: string;
  workingAtHeightsCert?: string;
  workingAtHeightsExpiry?: string;
  ewpCert?: string;
  ewpExpiry?: string;
  plumbingLicence?: string;
  plumbingLicenceExpiry?: string;
  builderReg?: string;
  builderRegExpiry?: string;
  kpiRating: number;
  createdAt: string;
  updatedAt: string;
  crewMember?: CrewMember;
}

export interface Ticket {
  id: string;
  tenantId: string;
  crewMemberId: string;
  ticketType: TicketType;
  ticketNumber: string;
  status: TicketStatus;
  expiryDate: string;
  verifiedAt?: string;
  verifiedBy?: string;
  createdAt: string;
  updatedAt: string;
  crewMember?: CrewMember;
}

export interface SWMS {
  id: string;
  tenantId: string;
  jobId: string;
  title: string;
  roofHeight: number;
  edgeProtectionRequired: boolean;
  edgeProtectionVerified: boolean;
  fallingFromHeightsSigned: boolean;
  signedBy?: string;
  signedAt?: string;
  asbestosRemoval: boolean;
  asbestosLicenceNumber?: string;
  workSafeNotificationDate?: string;
  tipReceiptUrl?: string;
  createdAt: string;
  updatedAt: string;
  job?: Job;
}

export interface Invoice {
  id: string;
  tenantId: string;
  jobId?: string;
  quoteId?: string;
  invoiceNumber: string;
  milestone?: InvoiceMilestone;
  amount: number;
  gstAmount: number;
  totalIncGst: number;
  status: InvoiceStatus;
  dueDate?: string;
  paidAt?: string;
  warrantyCertificateUrl?: string;
  createdAt: string;
  updatedAt: string;
  job?: Job;
  quote?: Quote;
}

export interface GSTLedger {
  id: string;
  tenantId: string;
  invoiceId: string;
  gstCollected: number;
  gstPaid: number;
  period: BASPeriod;
  year: number;
  createdAt: string;
  invoice?: Invoice;
}

export interface BASReturn {
  id: string;
  tenantId: string;
  period: BASPeriod;
  year: number;
  gstCollected: number;
  gstPaid: number;
  netGst: number;
  filed: boolean;
  filedAt?: string;
  createdAt: string;
}

export interface TPARRecord {
  id: string;
  tenantId: string;
  contractorName: string;
  abn: string;
  abnValid: boolean;
  totalPayments: number;
  financialYear: number;
  createdAt: string;
  updatedAt: string;
}

export interface Equipment {
  id: string;
  tenantId: string;
  assetType: AssetType;
  name: string;
  serialNumber?: string;
  status: AssetStatus;
  location?: StockLocation;
  assignedToId?: string;
  purchaseDate?: string;
  cost: number;
  createdAt: string;
  updatedAt: string;
  assignedTo?: CrewMember;
  inspections?: AssetInspection[];
}

export interface Harness {
  id: string;
  tenantId: string;
  name: string;
  serialNumber: string;
  status: AssetStatus;
  lastInspectionDate?: string;
  nextInspectionDue?: string;
  assignedToId?: string;
  createdAt: string;
  updatedAt: string;
  assignedTo?: CrewMember;
  inspections?: AssetInspection[];
}

export interface AssetInspection {
  id: string;
  tenantId: string;
  equipmentId?: string;
  harnessId?: string;
  inspectionType: string;
  status: InspectionStatus;
  inspectionDate: string;
  nextDueDate: string;
  inspectorName?: string;
  certificateUrl?: string;
  notes?: string;
  createdAt: string;
  equipment?: Equipment;
  harness?: Harness;
}

export interface RFQ {
  id: string;
  tenantId: string;
  jobId?: string;
  title: string;
  supplierName: string;
  supplierContact?: string;
  bidAmount?: number;
  leadTimeDays?: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  items?: RFQItem[];
  job?: Job;
}

export interface RFQItem {
  id: string;
  rfqId: string;
  itemName: string;
  quantity: number;
  unit: string;
  unitPrice?: number;
  totalPrice?: number;
}

export interface PurchaseOrder {
  id: string;
  tenantId: string;
  rfqId: string;
  poNumber: string;
  supplierName: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  rfq?: RFQ;
}

export interface AuditLog {
  id: string;
  tenantId: string;
  userId?: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValues?: string;
  newValues?: string;
  createdAt: string;
  user?: User;
}

export interface DashboardSummary {
  totalQuotes: number;
  totalJobs: number;
  totalRevenue: number;
  lowStockCount: number;
}

export interface AuthState {
  user: User | null;
  tenant: Tenant | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string, user: User, tenant: Tenant) => void;
  logout: () => void;
  setTenant: (tenant: Tenant) => void;
}

export interface BOMResult {
  sheets: number;
  battenLinealMetres: number;
  battenStockLengths: number;
  insulationRolls: number;
  fasteners: number;
  totalArea: number;
  pitchFactor: number;
  coastalGrade: boolean;
  items: Array<{
    itemType: string;
    itemName: string;
    quantity: number;
    unit: string;
    unitCost: number;
    totalCost: number;
    isCoastalGrade: boolean;
  }>;
}
