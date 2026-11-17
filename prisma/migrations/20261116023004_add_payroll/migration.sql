-- CreateTable
CREATE TABLE "pay_runs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "status" "PayRunStatus" NOT NULL DEFAULT 'DRAFT',
    "totalOTE" DECIMAL(65,30) NOT NULL DEFAULT 0.00,
    "totalSuper" DECIMAL(65,30) NOT NULL DEFAULT 0.00,
    "totalPayg" DECIMAL(65,30) NOT NULL DEFAULT 0.00,
    "totalMyLeave" DECIMAL(65,30) NOT NULL DEFAULT 0.00,
    "totalNetPay" DECIMAL(65,30) NOT NULL DEFAULT 0.00,
    "lineCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "processedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),

    CONSTRAINT "pay_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pay_run_lines" (
    "id" TEXT NOT NULL,
    "payRunId" TEXT NOT NULL,
    "crewMemberId" TEXT NOT NULL,
    "hoursWorked" DECIMAL(65,30) NOT NULL,
    "hourlyRate" DECIMAL(65,30) NOT NULL,
    "ote" DECIMAL(65,30) NOT NULL,
    "superGuarantee" DECIMAL(65,30) NOT NULL,
    "paygWithholding" DECIMAL(65,30) NOT NULL,
    "myLeaveLevy" DECIMAL(65,30) NOT NULL,
    "netPay" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pay_run_lines_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pay_runs_tenantId_idx" ON "pay_runs"("tenantId");

-- CreateIndex
CREATE INDEX "pay_runs_status_idx" ON "pay_runs"("status");

-- CreateIndex
CREATE INDEX "pay_runs_periodStart_idx" ON "pay_runs"("periodStart");

-- CreateIndex
CREATE INDEX "pay_run_lines_payRunId_idx" ON "pay_run_lines"("payRunId");

-- CreateIndex
CREATE INDEX "pay_run_lines_crewMemberId_idx" ON "pay_run_lines"("crewMemberId");

-- AddForeignKey
ALTER TABLE "pay_runs" ADD CONSTRAINT "pay_runs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pay_run_lines" ADD CONSTRAINT "pay_run_lines_payRunId_fkey" FOREIGN KEY ("payRunId") REFERENCES "pay_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pay_run_lines" ADD CONSTRAINT "pay_run_lines_crewMemberId_fkey" FOREIGN KEY ("crewMemberId") REFERENCES "crew_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
