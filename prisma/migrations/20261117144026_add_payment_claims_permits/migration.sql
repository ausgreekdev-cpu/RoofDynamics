-- CreateTable
CREATE TABLE "payment_claims" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "jobId" TEXT,
    "invoiceId" TEXT,
    "claimNumber" TEXT NOT NULL,
    "claimantName" TEXT NOT NULL,
    "claimAmount" DECIMAL(65,30) NOT NULL,
    "servedDate" TIMESTAMP(3) NOT NULL,
    "responseDueDate" TIMESTAMP(3) NOT NULL,
    "respondedDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "noticeAttached" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_claims_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "building_permits" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "jobId" TEXT,
    "permitNumber" TEXT NOT NULL,
    "permitType" TEXT NOT NULL DEFAULT 'BA1',
    "lga" TEXT NOT NULL,
    "issuedDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "building_permits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "payment_claims_tenantId_idx" ON "payment_claims"("tenantId");

-- CreateIndex
CREATE INDEX "payment_claims_status_idx" ON "payment_claims"("status");

-- CreateIndex
CREATE INDEX "payment_claims_responseDueDate_idx" ON "payment_claims"("responseDueDate");

-- CreateIndex
CREATE INDEX "building_permits_tenantId_idx" ON "building_permits"("tenantId");

-- CreateIndex
CREATE INDEX "building_permits_permitNumber_idx" ON "building_permits"("permitNumber");

-- AddForeignKey
ALTER TABLE "payment_claims" ADD CONSTRAINT "payment_claims_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "building_permits" ADD CONSTRAINT "building_permits_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
