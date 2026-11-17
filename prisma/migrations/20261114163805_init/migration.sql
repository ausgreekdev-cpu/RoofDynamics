-- CreateEnum
CREATE TYPE "SubscriptionTier" AS ENUM ('STARTER', 'PRO_SAFETY', 'OPS_ERP', 'EMPIRE_ENTERPRISE_LEASE');

-- CreateEnum
CREATE TYPE "ModuleKey" AS ENUM ('CRM_QUOTING', 'WMS_MRP', 'OPERATIONS_HRIS', 'WHS_SAFETY', 'EAM_FLEET', 'ACCOUNTING', 'PUBLIC_WEBSITE', 'AI_SOCIAL_AGENT', 'BI_EXECUTIVE', 'SAAS_SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'QUOTING', 'NEGOTIATION', 'WON', 'LOST');

-- CreateEnum
CREATE TYPE "QuoteStatus" AS ENUM ('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('PENDING', 'SCHEDULED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "InvoiceMilestone" AS ENUM ('DEPOSIT_10', 'MATERIALS_50', 'COMPLETION_40');

-- CreateEnum
CREATE TYPE "StockLocation" AS ENUM ('WELSHPOOL_MAIN_YARD', 'HILUX_UTE_1', 'ISUZU_TRUCK_2');

-- CreateEnum
CREATE TYPE "TicketType" AS ENUM ('WHITE_CARD', 'WORKING_AT_HEIGHTS', 'EWP', 'PLUMBING_LICENCE', 'BUILDER_REGISTRATION');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('VALID', 'EXPIRED', 'PENDING_RENEWAL');

-- CreateEnum
CREATE TYPE "AssetType" AS ENUM ('UTE', 'TRAILER', 'EDGE_PROTECTION_RAIL_KIT', 'NAIL_GUN', 'HARNESS', 'OTHER');

-- CreateEnum
CREATE TYPE "AssetStatus" AS ENUM ('ACTIVE', 'MAINTENANCE', 'RETIRED');

-- CreateEnum
CREATE TYPE "InspectionStatus" AS ENUM ('PASSED', 'FAILED', 'DUE', 'OVERDUE');

-- CreateEnum
CREATE TYPE "PayRunStatus" AS ENUM ('DRAFT', 'PROCESSED', 'PAID');

-- CreateEnum
CREATE TYPE "BASPeriod" AS ENUM ('Q1', 'Q2', 'Q3', 'Q4');

-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "abn" TEXT,
    "builderRegNumber" TEXT,
    "plumberLicence" TEXT,
    "primaryColour" TEXT NOT NULL DEFAULT '#0EA5E9',
    "subscriptionTier" "SubscriptionTier" NOT NULL DEFAULT 'STARTER',
    "monthlyLeaseFee" DECIMAL(65,30) NOT NULL DEFAULT 699.00,
    "isWhiteLabel" BOOLEAN NOT NULL DEFAULT false,
    "logoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "tier" "SubscriptionTier" NOT NULL,
    "monthlyFee" DECIMAL(65,30) NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "module_entitlements" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "moduleKey" "ModuleKey" NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "addOnPrice" DECIMAL(65,30) NOT NULL DEFAULT 0.00,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "module_entitlements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'staff',
    "avatarUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "suburb" TEXT,
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "source" TEXT,
    "estimatedValue" DECIMAL(65,30) NOT NULL DEFAULT 0.00,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotes" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "leadId" TEXT,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT,
    "customerPhone" TEXT,
    "customerAddress" TEXT,
    "customerSuburb" TEXT,
    "planArea" DECIMAL(65,30) NOT NULL DEFAULT 0.00,
    "pitchDegrees" DECIMAL(65,30) NOT NULL DEFAULT 0.00,
    "wastePercentage" DECIMAL(65,30) NOT NULL DEFAULT 7.00,
    "roofHeight" DECIMAL(65,30) NOT NULL DEFAULT 0.00,
    "isAsbestosRemoval" BOOLEAN NOT NULL DEFAULT false,
    "asbestosArea" DECIMAL(65,30) NOT NULL DEFAULT 0.00,
    "totalIncGst" DECIMAL(65,30) NOT NULL DEFAULT 0.00,
    "totalExGst" DECIMAL(65,30) NOT NULL DEFAULT 0.00,
    "gstAmount" DECIMAL(65,30) NOT NULL DEFAULT 0.00,
    "status" "QuoteStatus" NOT NULL DEFAULT 'DRAFT',
    "coastalZone" BOOLEAN NOT NULL DEFAULT false,
    "corrosionFlag" BOOLEAN NOT NULL DEFAULT false,
    "requiresBuilderReg" BOOLEAN NOT NULL DEFAULT false,
    "requiresPlumbingLic" BOOLEAN NOT NULL DEFAULT false,
    "requiresSWMS" BOOLEAN NOT NULL DEFAULT false,
    "compliancePassed" BOOLEAN NOT NULL DEFAULT false,
    "complianceNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),

    CONSTRAINT "quotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jobs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "jobNumber" TEXT NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'PENDING',
    "scheduledDate" TIMESTAMP(3),
    "completedDate" TIMESTAMP(3),
    "roofHeight" DECIMAL(65,30) NOT NULL DEFAULT 0.00,
    "isAsbestosRemoval" BOOLEAN NOT NULL DEFAULT false,
    "asbestosArea" DECIMAL(65,30) NOT NULL DEFAULT 0.00,
    "swmsSigned" BOOLEAN NOT NULL DEFAULT false,
    "edgeProtectionVerified" BOOLEAN NOT NULL DEFAULT false,
    "crewLeadId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bom_items" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "itemType" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "quantity" DECIMAL(65,30) NOT NULL,
    "unit" TEXT NOT NULL,
    "unitCost" DECIMAL(65,30) NOT NULL DEFAULT 0.00,
    "totalCost" DECIMAL(65,30) NOT NULL DEFAULT 0.00,
    "isCoastalGrade" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bom_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_items" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "location" "StockLocation" NOT NULL,
    "quantityOnHand" DECIMAL(65,30) NOT NULL DEFAULT 0.00,
    "quantityReserved" DECIMAL(65,30) NOT NULL DEFAULT 0.00,
    "reorderPoint" DECIMAL(65,30) NOT NULL DEFAULT 0.00,
    "unitCost" DECIMAL(65,30) NOT NULL DEFAULT 0.00,
    "supplier" TEXT,
    "warehouseLocationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warehouse_locations" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "warehouse_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_reservations" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "stockItemId" TEXT NOT NULL,
    "quantity" DECIMAL(65,30) NOT NULL,
    "reservedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "releasedAt" TIMESTAMP(3),

    CONSTRAINT "stock_reservations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crew_members" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "role" TEXT NOT NULL,
    "hireDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "hourlyRate" DECIMAL(65,30) NOT NULL DEFAULT 0.00,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crew_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crew_assignments" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "crewMemberId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crew_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hris_profiles" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "crewMemberId" TEXT NOT NULL,
    "whiteCardNumber" TEXT,
    "whiteCardExpiry" TIMESTAMP(3),
    "workingAtHeightsCert" TEXT,
    "workingAtHeightsExpiry" TIMESTAMP(3),
    "ewpCert" TEXT,
    "ewpExpiry" TIMESTAMP(3),
    "plumbingLicence" TEXT,
    "plumbingLicenceExpiry" TIMESTAMP(3),
    "builderReg" TEXT,
    "builderRegExpiry" TIMESTAMP(3),
    "kpiRating" DECIMAL(65,30) NOT NULL DEFAULT 0.00,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hris_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tickets" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "crewMemberId" TEXT NOT NULL,
    "ticketType" "TicketType" NOT NULL,
    "ticketNumber" TEXT NOT NULL,
    "status" "TicketStatus" NOT NULL DEFAULT 'VALID',
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "verifiedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "swms" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "roofHeight" DECIMAL(65,30) NOT NULL,
    "edgeProtectionRequired" BOOLEAN NOT NULL DEFAULT false,
    "edgeProtectionVerified" BOOLEAN NOT NULL DEFAULT false,
    "fallingFromHeightsSigned" BOOLEAN NOT NULL DEFAULT false,
    "signedBy" TEXT,
    "signedAt" TIMESTAMP(3),
    "asbestosRemoval" BOOLEAN NOT NULL DEFAULT false,
    "asbestosLicenceNumber" TEXT,
    "workSafeNotificationDate" TIMESTAMP(3),
    "tipReceiptUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "swms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "jobId" TEXT,
    "quoteId" TEXT,
    "invoiceNumber" TEXT NOT NULL,
    "milestone" "InvoiceMilestone",
    "amount" DECIMAL(65,30) NOT NULL,
    "gstAmount" DECIMAL(65,30) NOT NULL DEFAULT 0.00,
    "totalIncGst" DECIMAL(65,30) NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "dueDate" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "warrantyCertificateUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gst_ledger" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "gstCollected" DECIMAL(65,30) NOT NULL DEFAULT 0.00,
    "gstPaid" DECIMAL(65,30) NOT NULL DEFAULT 0.00,
    "period" "BASPeriod" NOT NULL,
    "year" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gst_ledger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bas_returns" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "period" "BASPeriod" NOT NULL,
    "year" INTEGER NOT NULL,
    "gstCollected" DECIMAL(65,30) NOT NULL DEFAULT 0.00,
    "gstPaid" DECIMAL(65,30) NOT NULL DEFAULT 0.00,
    "netGst" DECIMAL(65,30) NOT NULL DEFAULT 0.00,
    "filed" BOOLEAN NOT NULL DEFAULT false,
    "filedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bas_returns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tpar_records" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "contractorName" TEXT NOT NULL,
    "abn" TEXT NOT NULL,
    "abnValid" BOOLEAN NOT NULL DEFAULT false,
    "totalPayments" DECIMAL(65,30) NOT NULL DEFAULT 0.00,
    "financialYear" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tpar_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "assetType" "AssetType" NOT NULL,
    "name" TEXT NOT NULL,
    "serialNumber" TEXT,
    "status" "AssetStatus" NOT NULL DEFAULT 'ACTIVE',
    "location" "StockLocation",
    "assignedToId" TEXT,
    "purchaseDate" TIMESTAMP(3),
    "cost" DECIMAL(65,30) NOT NULL DEFAULT 0.00,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "harnesses" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "serialNumber" TEXT NOT NULL,
    "status" "AssetStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastInspectionDate" TIMESTAMP(3),
    "nextInspectionDue" TIMESTAMP(3),
    "assignedToId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "harnesses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_inspections" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "equipmentId" TEXT,
    "harnessId" TEXT,
    "inspectionType" TEXT NOT NULL,
    "status" "InspectionStatus" NOT NULL,
    "inspectionDate" TIMESTAMP(3) NOT NULL,
    "nextDueDate" TIMESTAMP(3) NOT NULL,
    "inspectorName" TEXT,
    "certificateUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asset_inspections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rfqs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "jobId" TEXT,
    "title" TEXT NOT NULL,
    "supplierName" TEXT NOT NULL,
    "supplierContact" TEXT,
    "bidAmount" DECIMAL(65,30),
    "leadTimeDays" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rfqs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rfq_items" (
    "id" TEXT NOT NULL,
    "rfqId" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "quantity" DECIMAL(65,30) NOT NULL,
    "unit" TEXT NOT NULL,
    "unitPrice" DECIMAL(65,30),
    "totalPrice" DECIMAL(65,30),

    CONSTRAINT "rfq_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_orders" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "rfqId" TEXT NOT NULL,
    "poNumber" TEXT NOT NULL,
    "supplierName" TEXT NOT NULL,
    "totalAmount" DECIMAL(65,30) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "purchase_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "oldValues" TEXT,
    "newValues" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "subscriptions_tenantId_idx" ON "subscriptions"("tenantId");

-- CreateIndex
CREATE INDEX "module_entitlements_tenantId_idx" ON "module_entitlements"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "module_entitlements_tenantId_moduleKey_key" ON "module_entitlements"("tenantId", "moduleKey");

-- CreateIndex
CREATE INDEX "users_tenantId_idx" ON "users"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "users_tenantId_email_key" ON "users"("tenantId", "email");

-- CreateIndex
CREATE INDEX "leads_tenantId_idx" ON "leads"("tenantId");

-- CreateIndex
CREATE INDEX "leads_status_idx" ON "leads"("status");

-- CreateIndex
CREATE INDEX "quotes_tenantId_idx" ON "quotes"("tenantId");

-- CreateIndex
CREATE INDEX "quotes_status_idx" ON "quotes"("status");

-- CreateIndex
CREATE INDEX "quotes_customerSuburb_idx" ON "quotes"("customerSuburb");

-- CreateIndex
CREATE UNIQUE INDEX "jobs_quoteId_key" ON "jobs"("quoteId");

-- CreateIndex
CREATE UNIQUE INDEX "jobs_jobNumber_key" ON "jobs"("jobNumber");

-- CreateIndex
CREATE INDEX "jobs_tenantId_idx" ON "jobs"("tenantId");

-- CreateIndex
CREATE INDEX "jobs_status_idx" ON "jobs"("status");

-- CreateIndex
CREATE INDEX "jobs_quoteId_idx" ON "jobs"("quoteId");

-- CreateIndex
CREATE INDEX "bom_items_tenantId_idx" ON "bom_items"("tenantId");

-- CreateIndex
CREATE INDEX "bom_items_quoteId_idx" ON "bom_items"("quoteId");

-- CreateIndex
CREATE INDEX "stock_items_tenantId_idx" ON "stock_items"("tenantId");

-- CreateIndex
CREATE INDEX "stock_items_sku_idx" ON "stock_items"("sku");

-- CreateIndex
CREATE INDEX "stock_items_location_idx" ON "stock_items"("location");

-- CreateIndex
CREATE INDEX "warehouse_locations_tenantId_idx" ON "warehouse_locations"("tenantId");

-- CreateIndex
CREATE INDEX "stock_reservations_tenantId_idx" ON "stock_reservations"("tenantId");

-- CreateIndex
CREATE INDEX "stock_reservations_jobId_idx" ON "stock_reservations"("jobId");

-- CreateIndex
CREATE INDEX "stock_reservations_stockItemId_idx" ON "stock_reservations"("stockItemId");

-- CreateIndex
CREATE INDEX "crew_members_tenantId_idx" ON "crew_members"("tenantId");

-- CreateIndex
CREATE INDEX "crew_assignments_tenantId_idx" ON "crew_assignments"("tenantId");

-- CreateIndex
CREATE INDEX "crew_assignments_jobId_idx" ON "crew_assignments"("jobId");

-- CreateIndex
CREATE INDEX "crew_assignments_crewMemberId_idx" ON "crew_assignments"("crewMemberId");

-- CreateIndex
CREATE UNIQUE INDEX "hris_profiles_crewMemberId_key" ON "hris_profiles"("crewMemberId");

-- CreateIndex
CREATE INDEX "hris_profiles_tenantId_idx" ON "hris_profiles"("tenantId");

-- CreateIndex
CREATE INDEX "tickets_tenantId_idx" ON "tickets"("tenantId");

-- CreateIndex
CREATE INDEX "tickets_crewMemberId_idx" ON "tickets"("crewMemberId");

-- CreateIndex
CREATE INDEX "tickets_ticketType_idx" ON "tickets"("ticketType");

-- CreateIndex
CREATE INDEX "tickets_status_idx" ON "tickets"("status");

-- CreateIndex
CREATE UNIQUE INDEX "swms_jobId_key" ON "swms"("jobId");

-- CreateIndex
CREATE INDEX "swms_tenantId_idx" ON "swms"("tenantId");

-- CreateIndex
CREATE INDEX "swms_jobId_idx" ON "swms"("jobId");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_invoiceNumber_key" ON "invoices"("invoiceNumber");

-- CreateIndex
CREATE INDEX "invoices_tenantId_idx" ON "invoices"("tenantId");

-- CreateIndex
CREATE INDEX "invoices_status_idx" ON "invoices"("status");

-- CreateIndex
CREATE INDEX "invoices_invoiceNumber_idx" ON "invoices"("invoiceNumber");

-- CreateIndex
CREATE INDEX "gst_ledger_tenantId_idx" ON "gst_ledger"("tenantId");

-- CreateIndex
CREATE INDEX "gst_ledger_period_idx" ON "gst_ledger"("period");

-- CreateIndex
CREATE INDEX "gst_ledger_year_idx" ON "gst_ledger"("year");

-- CreateIndex
CREATE INDEX "bas_returns_tenantId_idx" ON "bas_returns"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "bas_returns_tenantId_period_year_key" ON "bas_returns"("tenantId", "period", "year");

-- CreateIndex
CREATE INDEX "tpar_records_tenantId_idx" ON "tpar_records"("tenantId");

-- CreateIndex
CREATE INDEX "tpar_records_abn_idx" ON "tpar_records"("abn");

-- CreateIndex
CREATE INDEX "tpar_records_financialYear_idx" ON "tpar_records"("financialYear");

-- CreateIndex
CREATE INDEX "equipment_tenantId_idx" ON "equipment"("tenantId");

-- CreateIndex
CREATE INDEX "equipment_assetType_idx" ON "equipment"("assetType");

-- CreateIndex
CREATE INDEX "equipment_serialNumber_idx" ON "equipment"("serialNumber");

-- CreateIndex
CREATE UNIQUE INDEX "harnesses_serialNumber_key" ON "harnesses"("serialNumber");

-- CreateIndex
CREATE INDEX "harnesses_tenantId_idx" ON "harnesses"("tenantId");

-- CreateIndex
CREATE INDEX "harnesses_serialNumber_idx" ON "harnesses"("serialNumber");

-- CreateIndex
CREATE INDEX "harnesses_nextInspectionDue_idx" ON "harnesses"("nextInspectionDue");

-- CreateIndex
CREATE INDEX "asset_inspections_tenantId_idx" ON "asset_inspections"("tenantId");

-- CreateIndex
CREATE INDEX "asset_inspections_equipmentId_idx" ON "asset_inspections"("equipmentId");

-- CreateIndex
CREATE INDEX "asset_inspections_harnessId_idx" ON "asset_inspections"("harnessId");

-- CreateIndex
CREATE INDEX "asset_inspections_nextDueDate_idx" ON "asset_inspections"("nextDueDate");

-- CreateIndex
CREATE INDEX "rfqs_tenantId_idx" ON "rfqs"("tenantId");

-- CreateIndex
CREATE INDEX "rfqs_jobId_idx" ON "rfqs"("jobId");

-- CreateIndex
CREATE INDEX "rfqs_status_idx" ON "rfqs"("status");

-- CreateIndex
CREATE INDEX "rfq_items_rfqId_idx" ON "rfq_items"("rfqId");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_orders_rfqId_key" ON "purchase_orders"("rfqId");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_orders_poNumber_key" ON "purchase_orders"("poNumber");

-- CreateIndex
CREATE INDEX "purchase_orders_tenantId_idx" ON "purchase_orders"("tenantId");

-- CreateIndex
CREATE INDEX "purchase_orders_poNumber_idx" ON "purchase_orders"("poNumber");

-- CreateIndex
CREATE INDEX "purchase_orders_status_idx" ON "purchase_orders"("status");

-- CreateIndex
CREATE INDEX "audit_logs_tenantId_idx" ON "audit_logs"("tenantId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "module_entitlements" ADD CONSTRAINT "module_entitlements_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "quotes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_crewLeadId_fkey" FOREIGN KEY ("crewLeadId") REFERENCES "crew_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bom_items" ADD CONSTRAINT "bom_items_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bom_items" ADD CONSTRAINT "bom_items_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "quotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_items" ADD CONSTRAINT "stock_items_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_items" ADD CONSTRAINT "stock_items_warehouseLocationId_fkey" FOREIGN KEY ("warehouseLocationId") REFERENCES "warehouse_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warehouse_locations" ADD CONSTRAINT "warehouse_locations_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_reservations" ADD CONSTRAINT "stock_reservations_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_reservations" ADD CONSTRAINT "stock_reservations_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_reservations" ADD CONSTRAINT "stock_reservations_stockItemId_fkey" FOREIGN KEY ("stockItemId") REFERENCES "stock_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crew_members" ADD CONSTRAINT "crew_members_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crew_assignments" ADD CONSTRAINT "crew_assignments_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crew_assignments" ADD CONSTRAINT "crew_assignments_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crew_assignments" ADD CONSTRAINT "crew_assignments_crewMemberId_fkey" FOREIGN KEY ("crewMemberId") REFERENCES "crew_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hris_profiles" ADD CONSTRAINT "hris_profiles_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hris_profiles" ADD CONSTRAINT "hris_profiles_crewMemberId_fkey" FOREIGN KEY ("crewMemberId") REFERENCES "crew_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_crewMemberId_fkey" FOREIGN KEY ("crewMemberId") REFERENCES "crew_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "swms" ADD CONSTRAINT "swms_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "swms" ADD CONSTRAINT "swms_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "quotes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gst_ledger" ADD CONSTRAINT "gst_ledger_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gst_ledger" ADD CONSTRAINT "gst_ledger_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bas_returns" ADD CONSTRAINT "bas_returns_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tpar_records" ADD CONSTRAINT "tpar_records_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment" ADD CONSTRAINT "equipment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment" ADD CONSTRAINT "equipment_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "crew_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "harnesses" ADD CONSTRAINT "harnesses_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "harnesses" ADD CONSTRAINT "harnesses_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "crew_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_inspections" ADD CONSTRAINT "asset_inspections_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_inspections" ADD CONSTRAINT "asset_inspections_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "equipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_inspections" ADD CONSTRAINT "asset_inspections_harnessId_fkey" FOREIGN KEY ("harnessId") REFERENCES "harnesses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rfqs" ADD CONSTRAINT "rfqs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rfqs" ADD CONSTRAINT "rfqs_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rfq_items" ADD CONSTRAINT "rfq_items_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "rfqs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "rfqs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
