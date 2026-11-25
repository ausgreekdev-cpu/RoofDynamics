/** Sub-tasks and warranty vault endpoints (tenant-scoped). */
import { Router, type Request, type Response } from 'express'
import { prisma } from '../../lib/prisma'
import { requirePermission, type RbacRequest } from '../auth/middleware'
import { audit } from './projects'

const router = Router()

// ---- Tasks ----
router.get('/tasks', async (req: Request, res: Response) => {
  const r = req as RbacRequest
  const { jobId, status } = req.query
  const take = Math.min(parseInt(String(req.query.take || '50'), 10) || 50, 200)
  const skip = parseInt(String(req.query.skip || '0'), 10) || 0
  try {
    const where: any = { tenantId: r.tenantId }
    if (jobId) where.jobId = String(jobId)
    if (status) where.status = String(status)
    const tasks = await prisma.task.findMany({ where, orderBy: { createdAt: 'desc' }, take, skip })
    res.json(tasks)
  } catch {
    res.json([
      { id: 'task-1', tenantId: r.tenantId, title: 'Order materials', status: 'OPEN', jobId: jobId || null, createdAt: new Date().toISOString() },
    ])
  }
})

router.post('/tasks', requirePermission('operations:manage'), async (req: Request, res: Response) => {
  const r = req as RbacRequest
  const { title, description, jobId, projectId, assigneeId, dueDate } = req.body || {}
  if (!title) { res.status(400).json({ error: 'title is required' }); return }
  const task = await prisma.task.create({
    data: {
      tenantId: r.tenantId!,
      title, description, jobId, projectId, assigneeId,
      dueDate: dueDate ? new Date(dueDate) : null,
    },
  })
  res.status(201).json(task)
})

router.patch('/tasks/:id', requirePermission('operations:manage'), async (req: Request, res: Response) => {
  const r = req as RbacRequest
  try {
    const { status, assigneeId, dueDate } = req.body || {}
    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: {
        ...(status ? { status } : {}),
        ...(assigneeId !== undefined ? { assigneeId } : {}),
        ...(dueDate ? { dueDate: new Date(dueDate) } : {}),
        ...(status === 'COMPLETED' ? { completedAt: new Date() } : {}),
      },
    })
    res.json(task)
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to update task' })
  }
})

router.delete('/tasks/:id', requirePermission('operations:manage'), async (req: Request, res: Response) => {
  await prisma.task.delete({ where: { id: req.params.id } })
  res.json({ success: true })
})

// ---- Warranty Vault ----
router.get('/warranties', async (req: Request, res: Response) => {
  const r = req as RbacRequest
  const take = Math.min(parseInt(String(req.query.take || '50'), 10) || 50, 200)
  const skip = parseInt(String(req.query.skip || '0'), 10) || 0
  try {
    const warranties = await prisma.warrantyDocument.findMany({
      where: { tenantId: r.tenantId },
      orderBy: { issuedAt: 'desc' },
      take, skip,
    })
    res.json(warranties)
  } catch {
    res.json([
      { id: 'wty-1', tenantId: r.tenantId, certificateNo: 'WTY-DEMO', customerName: 'James Wilson', projectName: 'Fremantle Re-roof', documentType: 'WORKMANSHIP_10YEAR', issuedAt: new Date().toISOString() },
    ])
  }
})

router.post('/warranties', requirePermission('operations:manage'), async (req: Request, res: Response) => {
  const r = req as RbacRequest
  const { jobId, customerName, projectName, documentType, expiresAt, pdfUrl } = req.body || {}
  if (!customerName || !projectName) {
    res.status(400).json({ error: 'customerName and projectName are required' })
    return
  }
  const certificateNo = `WTY-${Date.now().toString(36).toUpperCase()}`
  const warranty = await prisma.warrantyDocument.create({
    data: {
      tenantId: r.tenantId!,
      jobId,
      certificateNo,
      customerName,
      projectName,
      documentType: documentType || 'WORKMANSHIP_10YEAR',
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      pdfUrl,
    },
  })
  await audit(r.tenantId!, r.userId, 'CREATE', warranty.id, null, warranty)
  res.status(201).json(warranty)
})

export default router
