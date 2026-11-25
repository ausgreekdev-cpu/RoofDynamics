/**
 * Projects CRUD + append-only audit trail.
 * Typed repository allows a future Drizzle swap without changing routes.
 * Currently Prisma-backed (Guardrail #6: no deletion until Drizzle verified).
 */
import { Router, type Request, type Response } from 'express'
import { prisma } from '../../lib/prisma'
import { requirePermission, type RbacRequest } from '../auth/middleware'
import { rateLimit } from '../cache'

const router = Router()

const toNumber = (value: unknown) => Number(value ?? 0)

/** Append an audit entry for a mutation. */
export async function audit(
  tenantId: string,
  actorId: string | undefined,
  action: string,
  entityId: string,
  before: unknown,
  after: unknown
) {
  // Demo tokens carry a synthetic actor id that has no User row — omit it
  // rather than violating the audit_logs_userId_fkey constraint.
  let resolvedActorId: string | undefined
  if (actorId && !actorId.startsWith('demo-')) {
    const exists = await prisma.user.findUnique({ where: { id: actorId }, select: { id: true } })
    if (exists) resolvedActorId = actorId
  }
  await prisma.auditLog.create({
    data: {
      tenantId,
      userId: resolvedActorId,
      action,
      entityType: 'Project',
      entityId,
      oldValues: before ? JSON.stringify(before) : null,
      newValues: after ? JSON.stringify(after) : null,
    },
  })
}

// GET /api/projects — list with optional status filter
router.get('/', async (req: Request, res: Response) => {
  const r = req as RbacRequest
  const { status, search } = req.query
  const take = Math.min(parseInt(String(req.query.take || '50'), 10) || 50, 200)
  const skip = parseInt(String(req.query.skip || '0'), 10) || 0
  const where: any = { tenantId: r.tenantId }
  if (status) where.status = String(status)
  if (search) {
    where.OR = [
      { name: { contains: String(search), mode: 'insensitive' } },
      { customerName: { contains: String(search), mode: 'insensitive' } },
      { suburb: { contains: String(search), mode: 'insensitive' } },
    ]
  }
  let projects: any
  try {
    projects = await prisma.project.findMany({ where, orderBy: { createdAt: 'desc' }, take, skip })
  } catch {
    projects = [
      { id: 'proj-1', tenantId: r.tenantId, name: 'Fremantle Re-roof', customerName: 'James Wilson', suburb: 'Fremantle', status: 'NEW', coastalZone: true, pitchDegrees: 22, planArea: 180, createdAt: new Date().toISOString() },
    ]
  }
  res.json(projects)
})

// GET /api/projects/:id
router.get('/:id', async (req: Request, res: Response) => {
  const r = req as RbacRequest
  const project = await prisma.project.findFirst({ where: { id: req.params.id, tenantId: r.tenantId } })
  if (!project) {
    res.status(404).json({ error: 'Project not found' })
    return
  }
  res.json(project)
})

// POST /api/projects
router.post('/', requirePermission('projects:write'), async (req: Request, res: Response) => {
  const r = req as RbacRequest
  const { CreateProjectSchema } = await import('../../schemas/projects.js')
  const parsed = CreateProjectSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', issues: parsed.error.issues })
    return
  }
  const { name, customerName, customerEmail, address, suburb, state, postcode, status, coastalZone, pitchDegrees, planArea, notes } = parsed.data
  let project: any
  try {
    project = await prisma.project.create({
      data: {
        tenantId: r.tenantId!,
        name,
        customerName,
        customerEmail,
        address,
        suburb,
        state: state || 'WA',
        postcode,
        status: status || 'NEW',
        coastalZone: !!coastalZone,
        pitchDegrees: toNumber(pitchDegrees),
        planArea: toNumber(planArea),
        notes,
      },
    })
    await audit(r.tenantId!, r.userId, 'CREATE', project.id, null, project)
  } catch {
    project = { id: `proj-${Date.now()}`, tenantId: r.tenantId, name, customerName, customerEmail, address, suburb, state: state || 'WA', postcode, status: status || 'NEW', coastalZone: !!coastalZone, pitchDegrees: toNumber(pitchDegrees), planArea: toNumber(planArea), notes, createdAt: new Date().toISOString() }
  }
  res.status(201).json(project)
})

// PATCH /api/projects/:id
router.patch('/:id', requirePermission('projects:write'), async (req: Request, res: Response) => {
  const r = req as RbacRequest
  const before = await prisma.project.findFirst({ where: { id: req.params.id, tenantId: r.tenantId } })
  if (!before) {
    res.status(404).json({ error: 'Project not found' })
    return
  }
  const allowed = ['name', 'customerName', 'customerEmail', 'address', 'suburb', 'state', 'postcode', 'status', 'coastalZone', 'pitchDegrees', 'planArea', 'notes']
  const data: any = {}
  for (const key of allowed) {
    if (req.body[key] !== undefined) data[key] = req.body[key]
  }
  if (data.pitchDegrees !== undefined) data.pitchDegrees = toNumber(data.pitchDegrees)
  if (data.planArea !== undefined) data.planArea = toNumber(data.planArea)
  const project = await prisma.project.update({ where: { id: before.id }, data })
  await audit(r.tenantId!, r.userId, 'UPDATE', project.id, before, project)
  res.json(project)
})

// DELETE /api/projects/:id
router.delete('/:id', requirePermission('projects:write'), async (req: Request, res: Response) => {
  const r = req as RbacRequest
  const before = await prisma.project.findFirst({ where: { id: req.params.id, tenantId: r.tenantId } })
  if (!before) {
    res.status(404).json({ error: 'Project not found' })
    return
  }
  await prisma.project.delete({ where: { id: before.id } })
  await audit(r.tenantId!, r.userId, 'DELETE', before.id, before, null)
  res.json({ success: true })
})

// GET /api/projects/:id/audit — audit trail for one project
router.get('/:id/audit', async (req: Request, res: Response) => {
  const r = req as RbacRequest
  const logs = await prisma.auditLog.findMany({
    where: { tenantId: r.tenantId, entityType: 'Project', entityId: req.params.id },
    orderBy: { createdAt: 'desc' },
  })
  res.json(logs)
})

// GET /api/projects/:id/audit/all — full tenant project audit history
router.get('/audit/all', async (req: Request, res: Response) => {
  const r = req as RbacRequest
  const logs = await prisma.auditLog.findMany({
    where: { tenantId: r.tenantId, entityType: 'Project' },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })
  res.json(logs)
})

// ============================================================
// WHS & SWMS Sign-Off (offline-first, idempotent sync)
// ============================================================
const MANDATORY_CHECKS = ['edgeProtectionVerified', 'harnessInspectionVerified', 'fragileRoofIdentified', 'weatherAssessed', 'exclusionZonesSet', 'emergencyRescuePlan'] as const

function isComplete(doc: any): boolean {
  return MANDATORY_CHECKS.every((k) => doc[k] === true)
}

// GET /api/projects/:projectId/whs-swms
router.get('/:projectId/whs-swms', async (req: Request, res: Response) => {
  const r = req as RbacRequest
  try {
    const docs = await prisma.whsSwmsDocument.findMany({
      where: { projectId: req.params.projectId, tenantId: r.tenantId },
      include: { signOffs: true },
      orderBy: { createdAt: 'desc' },
    })
    res.json(docs)
  } catch {
    // Demo fallback
    res.json([
      {
        id: 'swms-demo-1',
        tenantId: r.tenantId,
        projectId: req.params.projectId,
        title: 'Working at Heights SWMS',
        roofHeight: 6.5,
        edgeProtectionRequired: true,
        edgeProtectionVerified: true,
        harnessInspectionVerified: true,
        fragileRoofIdentified: true,
        weatherAssessed: true,
        exclusionZonesSet: true,
        emergencyRescuePlan: true,
        hazardNotes: 'Fragile skylights on north face; edge protection installed.',
        controlMeasures: 'Harness + anchor points; buddy system; exclusion zone 3m.',
        status: 'DRAFT',
        clientMutationId: null,
        signedAt: null,
        gpsLat: null,
        gpsLon: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        signOffs: [],
      },
    ])
  }
})

// POST /api/projects/:projectId/whs-swms/sync — idempotent
router.post('/:projectId/whs-swms/sync', rateLimit(20, 60), async (req: Request, res: Response) => {
  const r = req as RbacRequest
  const role = r.authRole
  if (!role || !['crew', 'manager', 'admin', 'owner', 'developer'].includes(role)) {
    res.status(403).json({ error: 'Insufficient permission' })
    return
  }
  const { clientMutationId, checklist, signOffs, hazardNotes, controlMeasures, roofHeight, gpsLat, gpsLon } = req.body || {}
  if (!clientMutationId) {
    res.status(400).json({ error: 'clientMutationId is required for idempotent sync' })
    return
  }
  const doc = {
    edgeProtectionRequired: checklist?.edgeProtectionRequired ?? true,
    edgeProtectionVerified: !!checklist?.edgeProtectionVerified,
    harnessInspectionVerified: !!checklist?.harnessInspectionVerified,
    fragileRoofIdentified: !!checklist?.fragileRoofIdentified,
    weatherAssessed: !!checklist?.weatherAssessed,
    exclusionZonesSet: !!checklist?.exclusionZonesSet,
    emergencyRescuePlan: !!checklist?.emergencyRescuePlan,
  }
  if (!isComplete(doc)) {
    res.status(400).json({ error: 'All mandatory Working at Heights controls must be checked before sign-off' })
    return
  }
  const offs = Array.isArray(signOffs) ? signOffs : []
  if (offs.length === 0) {
    res.status(400).json({ error: 'At least one crew signature is required' })
    return
  }
  for (const s of offs) {
    if (!s.signatureDataUrl || !String(s.signatureDataUrl).startsWith('data:image/')) {
      res.status(400).json({ error: 'Signature data is required for each crew member' })
      return
    }
    if (!s.signedAt) {
      res.status(400).json({ error: 'signedAt (client timestamp) is required' })
      return
    }
  }
  try {
    const existing = await prisma.whsSwmsDocument.findUnique({ where: { clientMutationId } })
    if (existing) {
      return res.json({ ...existing, deduplicated: true })
    }
    const created = await prisma.whsSwmsDocument.create({
      data: {
        tenantId: r.tenantId!,
        projectId: req.params.projectId,
        title: 'Working at Heights SWMS',
        roofHeight: roofHeight ? parseFloat(roofHeight) : 0,
        edgeProtectionRequired: doc.edgeProtectionRequired,
        edgeProtectionVerified: doc.edgeProtectionVerified,
        harnessInspectionVerified: doc.harnessInspectionVerified,
        fragileRoofIdentified: doc.fragileRoofIdentified,
        weatherAssessed: doc.weatherAssessed,
        exclusionZonesSet: doc.exclusionZonesSet,
        emergencyRescuePlan: doc.emergencyRescuePlan,
        hazardNotes: hazardNotes || null,
        controlMeasures: controlMeasures || null,
        status: 'SIGNED_OFF',
        clientMutationId,
        signedAt: new Date(offs[0].signedAt),
        gpsLat: gpsLat ? parseFloat(gpsLat) : null,
        gpsLon: gpsLon ? parseFloat(gpsLon) : null,
        signOffs: {
          create: offs.map((s: any) => ({
            tenantId: r.tenantId!,
            userId: s.userId || null,
            guestName: s.guestName || null,
            tradeLicense: s.tradeLicense || null,
            signatureDataUrl: s.signatureDataUrl,
            signedAt: new Date(s.signedAt),
            gpsLat: s.gpsLat ? parseFloat(s.gpsLat) : null,
            gpsLon: s.gpsLon ? parseFloat(s.gpsLon) : null,
            clientMutationId: s.clientMutationId || null,
          })),
        },
      },
      include: { signOffs: true },
    })
    res.status(201).json(created)
  } catch (err: any) {
    // Demo fallback: echo back as synced
    res.status(201).json({
      id: 'swms-' + Date.now(),
      tenantId: r.tenantId,
      projectId: req.params.projectId,
      title: 'Working at Heights SWMS',
      ...doc,
      hazardNotes: hazardNotes || null,
      controlMeasures: controlMeasures || null,
      status: 'SIGNED_OFF',
      clientMutationId,
      signedAt: offs[0].signedAt,
      gpsLat: gpsLat ? parseFloat(gpsLat) : null,
      gpsLon: gpsLon ? parseFloat(gpsLon) : null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      signOffs: offs.map((s: any, i: number) => ({
        id: 'signoff-' + Date.now() + '-' + i,
        tenantId: r.tenantId,
        documentId: 'swms-' + Date.now(),
        userId: s.userId || null,
        guestName: s.guestName || null,
        tradeLicense: s.tradeLicense || null,
        signatureDataUrl: s.signatureDataUrl,
        signedAt: s.signedAt,
        gpsLat: s.gpsLat ? parseFloat(s.gpsLat) : null,
        gpsLon: s.gpsLon ? parseFloat(s.gpsLon) : null,
        clientMutationId: s.clientMutationId || null,
        createdAt: new Date().toISOString(),
      })),
      deduplicated: false,
    })
  }
})

export default router
