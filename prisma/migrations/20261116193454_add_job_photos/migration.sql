-- CreateTable
CREATE TABLE "job_photos" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'before',
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "dataUrl" TEXT NOT NULL,
    "uploadedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_photos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "job_photos_tenantId_idx" ON "job_photos"("tenantId");

-- CreateIndex
CREATE INDEX "job_photos_jobId_idx" ON "job_photos"("jobId");

-- CreateIndex
CREATE INDEX "job_photos_category_idx" ON "job_photos"("category");

-- AddForeignKey
ALTER TABLE "job_photos" ADD CONSTRAINT "job_photos_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_photos" ADD CONSTRAINT "job_photos_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
