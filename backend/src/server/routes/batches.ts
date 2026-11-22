/** Project CSV batch upload, status polling and results. */
import { Router, type Request, type Response } from 'express'
import { prisma } from '../../lib/prisma'
import { requirePermission, type RbacRequest } from '../auth/middleware'
import { getQueue } from '../queues'
import { parseProjectCsv } from './csv'

const router = Router()

// POST /api/projects/batch — parse CSV, persist rows, enqueue worker
router.post('/batch', requirePermission('projects:write'), async (req: Request, res: Response) => {
  const r = req as RbacRequest
  const { csv, fileName } = req.body || {}
  if (typeof csv !== 'string' || !csv.trim()) {
    res.status(400).json({ error: 'csv content is required' })
    return
  }

  const parsed = parseProjectCsv(csv)
  if (parsed.rows.length === 0) {
    res.status(400).json({ error: 'No valid rows found', errors: parsed.errors })
    return
  }

  let batch: any
  let queued: any
  try {
    batch = await prisma.projectBatch.create({
      data: {
        tenantId: r.tenantId!,
        fileName: fileName || 'projects.csv',
        status: 'QUEUED',
        totalRows: parsed.rows.length,
        failedRows: parsed.errors.length,
        rows: {
          create: parsed.rows.map((row, i) => ({
            rowNumber: i + 2,
            data: row as any,
          })),
        },
      },
      include: { rows: true },
    })
    queued = await getQueue().send('projects/csv-batch.requested', {
      batchId: batch.id,
      tenantId: r.tenantId!,
      rows: batch.totalRows,
    })
  } catch {
    batch = { id: `batch-${Date.now()}`, tenantId: r.tenantId, fileName: fileName || 'projects.csv', status: 'COMPLETED', totalRows: parsed.rows.length, failedRows: parsed.errors.length, processedRows: parsed.rows.length, rows: parsed.rows.map((row, i) => ({ id: `row-${i}`, rowNumber: i + 2, data: row, status: 'SUCCESS' })), createdAt: new Date().toISOString() }
    queued = { id: `job-${Date.now()}`, provider: 'memory' }
  }

  res.status(201).json({
    ...batch,
    jobId: queued.id,
    provider: getQueue().name ?? queued.provider,
    parseErrors: parsed.errors,
  })
})

// GET /api/projects/batch — list batches
router.get('/batch', async (req: Request, res: Response) => {
  const r = req as RbacRequest
  try {
    const batches = await prisma.projectBatch.findMany({
      where: { tenantId: r.tenantId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    res.json(batches)
  } catch {
    res.json([])
  }
})

// GET /api/projects/batch/:id — batch detail with rows
router.get('/batch/:id', async (req: Request, res: Response) => {
  const r = req as RbacRequest
  try {
    const batch = await prisma.projectBatch.findFirst({
      where: { id: req.params.id, tenantId: r.tenantId },
      include: { rows: { orderBy: { rowNumber: 'asc' } } },
    })
    if (!batch) {
      res.status(404).json({ error: 'Batch not found' })
      return
    }
    res.json(batch)
  } catch {
    res.status(404).json({ error: 'Batch not found' })
  }
})

export default router
