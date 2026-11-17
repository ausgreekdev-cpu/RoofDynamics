-- CreateTable
CREATE TABLE "project_batches" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "totalRows" INTEGER NOT NULL DEFAULT 0,
    "processedRows" INTEGER NOT NULL DEFAULT 0,
    "failedRows" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_batch_rows" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "rowNumber" INTEGER NOT NULL,
    "data" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "error" TEXT,
    "projectId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_batch_rows_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "project_batches_tenantId_idx" ON "project_batches"("tenantId");

-- CreateIndex
CREATE INDEX "project_batches_status_idx" ON "project_batches"("status");

-- CreateIndex
CREATE INDEX "project_batch_rows_batchId_idx" ON "project_batch_rows"("batchId");

-- AddForeignKey
ALTER TABLE "project_batches" ADD CONSTRAINT "project_batches_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_batch_rows" ADD CONSTRAINT "project_batch_rows_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "project_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
