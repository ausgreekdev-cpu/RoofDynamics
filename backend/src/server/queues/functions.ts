/** Inngest worker functions for async AI, PDF and CSV workloads. */
import { inngest } from './inngest'
import { prisma } from '../../lib/prisma'
import { syncSupplierPrices } from '../services/supplierPriceCache'

export const segmentationWorker = inngest.createFunction(
  {
    id: 'ai-segmentation',
    name: 'AI Roof Segmentation',
    triggers: [{ event: 'measurement/segmentation.requested' }],
  },
  async ({ event, step }) => {
    const payload = event.data as { measurementId: string; tenantId: string; imageUrl?: string }
    await step.run('validate-input', async () => ({ ok: !!payload.measurementId }))
    // Real segmentation adapter lands in phase 2.3; deterministic result here.
    return { measurementId: payload.measurementId, status: 'queued', planes: 0 }
  }
)

export const pdfCompileWorker = inngest.createFunction(
  {
    id: 'pdf-compile',
    name: 'Report PDF Compile',
    triggers: [{ event: 'report/pdf.requested' }],
  },
  async ({ event, step }) => {
    const payload = event.data as { reportId: string; tenantId: string }
    await step.run('validate-input', async () => ({ ok: !!payload.reportId }))
    return { reportId: payload.reportId, status: 'queued' }
  }
)

/** Shared batch processor used by both Inngest and the memory sandbox. */
export async function processProjectBatch(batchId: string, tenantId: string) {
  const batch = await prisma.projectBatch.findFirst({ where: { id: batchId, tenantId } })
  if (!batch) throw new Error(`Batch ${batchId} not found`)

  await prisma.projectBatch.update({ where: { id: batchId }, data: { status: 'PROCESSING' } })
  const rows = await prisma.projectBatchRow.findMany({ where: { batchId } })

  let processed = 0
  let failed = 0
  for (const row of rows) {
    try {
      const data = row.data as Record<string, any>
      const project = await prisma.project.create({
        data: {
          tenantId,
          name: data.name,
          customerName: data.customerName,
          customerEmail: data.customerEmail || null,
          address: data.address || null,
          suburb: data.suburb || null,
          state: data.state || 'WA',
          postcode: data.postcode || null,
          status: data.status || 'NEW',
          coastalZone: !!data.coastalZone,
          pitchDegrees: Number(data.pitchDegrees) || 0,
          planArea: Number(data.planArea) || 0,
          notes: data.notes || null,
        },
      })
      await prisma.projectBatchRow.update({
        where: { id: row.id },
        data: { status: 'SUCCESS', projectId: project.id },
      })
      processed += 1
    } catch (err: any) {
      await prisma.projectBatchRow.update({
        where: { id: row.id },
        data: { status: 'FAILED', error: err.message || 'Unknown error' },
      })
      failed += 1
    }
  }

  await prisma.projectBatch.update({
    where: { id: batchId },
    data: { status: 'COMPLETED', processedRows: processed, failedRows: failed },
  })
  return { batchId, processed, failed, total: rows.length }
}

export const csvBatchWorker = inngest.createFunction(
  {
    id: 'csv-batch',
    name: 'Project CSV Batch',
    triggers: [{ event: 'projects/csv-batch.requested' }],
  },
  async ({ event, step }) => {
    const payload = event.data as { batchId: string; tenantId: string; rows: number }
    await step.run('validate-input', async () => ({ ok: payload.rows > 0 }))
    const result = await step.run('process-rows', async () =>
      processProjectBatch(payload.batchId, payload.tenantId)
    )
    return result
  }
)

export const supplierPriceSyncWorker = inngest.createFunction(
  {
    id: 'supplier-price-sync',
    name: 'Supplier Price Sync',
    triggers: [{ event: 'supplier/prices.sync.requested' }],
  },
  async ({ event, step }) => {
    const result = await step.run('sync-prices', async () => syncSupplierPrices())
    return result
  }
)

export const functions = [segmentationWorker, pdfCompileWorker, csvBatchWorker, supplierPriceSyncWorker]
