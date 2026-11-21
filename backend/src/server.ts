import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import http from 'http'
import { Server as SocketIOServer } from 'socket.io'
import { authenticateToken } from './middleware/auth'
import { requireTenant, TenantRequest } from './middleware/tenant'
import { prisma } from './lib/prisma'
import { lookupABN, isValidABN } from './utils/abnValidator'
import { env } from './env'
import { attachRole, requirePermission } from './server/auth'
import { getCache, rateLimit } from './server/cache'
import { getQueue } from './server/queues'
import { serve } from 'inngest/express'
import { inngest, functions, registerLocalWorkers } from './server/queues'
import { initSentry, isSentryEnabled, installSentryErrorHandler, requestLogger, errorCapture, collectMetrics } from './server/observability'

dotenv.config()

initSentry()
registerLocalWorkers()

const app = express()
const PORT = env.PORT

app.use(helmet())
app.use(cors({ origin: env.CLIENT_URL, credentials: true }))
app.use(express.json())
app.use(requestLogger)

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'roofdynamics-backend', timestamp: new Date().toISOString() })
})

// Inngest endpoint (signature-verified by Inngest, not our JWT)
// Public marketing lead capture (no auth) — free first report / quote requests
app.post('/api/public/leads', rateLimit(5, 3600), async (req, res) => {
  const { name, email, phone, suburb, message, source } = req.body || {}
  if (!name || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) {
    res.status(400).json({ error: 'valid name and email are required' })
    return
  }
  const parts = String(name).trim().split(/\s+/)
  const lead = await prisma.lead.create({
    data: {
      tenantId: 'tenant-1',
      firstName: parts[0],
      lastName: parts.slice(1).join(' ') || '-',
      email: String(email),
      phone: phone ? String(phone) : null,
      suburb: suburb ? String(suburb) : null,
      status: 'NEW',
      source: source || 'Marketing Site',
      notes: message ? String(message) : null,
    },
  })
  res.status(201).json({ id: lead.id, status: 'received' })
})

app.use('/api/inngest', serve({ client: inngest, functions }))

// Auth routes (public - no auth required)
import authRoutes from './routes/auth'
app.use('/api/auth', rateLimit(10, 900), authRoutes)

// Tenant scoping + auth middleware - apply to all protected /api routes
app.use('/api', authenticateToken, requireTenant, attachRole)

// Payroll routes (tenant-scoped, protected)
import payrollRoutes from './routes/payroll'
app.use('/api/payroll', payrollRoutes)

// WA statutory compliance (payment claims + building permits)
import complianceRoutes from './server/routes/compliance'
app.use('/api/compliance', complianceRoutes)

// Geospatial lookups + rate-limited ping
import geoRoutes from './server/routes/geo'
app.use('/api/geo', geoRoutes)
app.get('/api/system/ping', rateLimit(10, 60), (_req, res) => res.json({ pong: true }))

// Object storage (R2/S3 with sandbox fallback)
import storageRoutes from './server/routes/storage'
app.use('/api/storage', storageRoutes)

// Supplier catalog + Xactimate adapters
import supplierCatalogRoutes from './server/routes/supplierCatalog'
app.use('/api/integrations', supplierCatalogRoutes)

// Billing: tiers, credits, Stripe Connect deposits
import billingRoutes from './server/routes/billing'
app.use('/api/billing', billingRoutes)

// Sub-tasks + warranty vault (tenant-scoped)
import operationsRoutes from './server/routes/operations'
app.use('/api/operations', operationsRoutes)

// Typed B2B integration endpoints (financing, storm/hail)
import integrationRoutes from './server/routes/integrations'
app.use('/api/integrations', integrationRoutes)

// Project CSV batches (mount before /:id routes)
import batchRoutes from './server/routes/batches'
app.use('/api/projects', batchRoutes)

// Projects CRUD + audit trails (tenant-scoped, RBAC guarded in router)
import projectRoutes from './server/routes/projects'
app.use('/api/projects', projectRoutes)

// System status: active cache/queue adapters
app.get('/api/system/status', (_req, res) => {
  res.json({
    cache: getCache().name,
    queue: getQueue().name,
    mockIntegrations: env.ENABLE_MOCK_INTEGRATIONS,
    sentry: isSentryEnabled(),
    timestamp: new Date().toISOString(),
  })
})

app.get('/api/system/metrics', requirePermission('saas:read'), (_req, res) => {
  res.json({ ...collectMetrics(), logLevel: env.LOG_LEVEL })
})

// Emit a background job (typed event names only)
app.post('/api/queue/events', requirePermission('projects:write'), async (req: any, res) => {
  const { event, data } = req.body || {}
  const allowed = ['measurement/segmentation.requested', 'report/pdf.requested', 'projects/csv-batch.requested']
  if (!allowed.includes(event) || !data) {
    res.status(400).json({ error: 'Unknown event or missing data' })
    return
  }
  try {
    const result = await getQueue().send(event, data)
    res.json({ ...result, provider: getQueue().name })
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to enqueue' })
  }
})

// Session endpoint exposing validated auth provider + role
app.get('/api/auth/session', (req: any, res) => {
  res.json({
    userId: req.userId,
    email: req.userEmail,
    role: req.userRole,
    tenantId: req.tenantId,
    provider: req.authProvider || 'local',
  })
})

// ============================================================
// USERS (profile)
// ============================================================
app.get('/api/users/me', async (req: TenantRequest, res) => {
  const userId = (req as any).userId
  if (!userId || String(userId).startsWith('demo-')) {
    return res.json({
      id: userId || 'demo-user',
      tenantId: req.tenantId,
      email: (req as any).userEmail || 'demo@roofdynamics.com.au',
      name: 'Demo User',
      role: (req as any).userRole || 'admin',
    })
  }
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return res.status(404).json({ error: 'User not found' })
    res.json(user)
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Failed to load profile' })
  }
})

app.put('/api/users/me', async (req: TenantRequest, res) => {
  const userId = (req as any).userId
  const { name, email } = req.body || {}
  if (!userId || String(userId).startsWith('demo-')) {
    // Demo/sandbox: echo back without DB persistence
    return res.json({
      id: userId || 'demo-user',
      tenantId: req.tenantId,
      email: email !== undefined ? email : ((req as any).userEmail || 'demo@roofdynamics.com.au'),
      name: name !== undefined ? name : 'Demo User',
      role: (req as any).userRole || 'admin',
    })
  }
  try {
    const data: any = {}
    if (name !== undefined) data.name = String(name)
    if (email !== undefined) data.email = String(email)
    const user = await prisma.user.update({ where: { id: userId }, data })
    res.json(user)
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Failed to update profile' })
  }
})

// ============================================================
// TENANTS
// ============================================================
app.get('/api/tenants/me', async (req: TenantRequest, res) => {
  const tenant = await prisma.tenant.findUnique({
    where: { id: req.tenantId! },
    include: {
      moduleEntitlements: true,
      _count: { select: { users: true, quotes: true, jobs: true, invoices: true } },
    },
  })
  res.json(tenant)
})

app.get('/api/tenants', async (_req, res) => {
  const tenants = await prisma.tenant.findMany({
    include: {
      moduleEntitlements: true,
      _count: { select: { users: true, quotes: true } },
    },
    orderBy: { id: 'asc' },
  })
  res.json(tenants)
})

app.put('/api/tenants/me', async (req: TenantRequest, res) => {
  const { name, abn, builderRegNumber, plumberLicence, primaryColour, isWhiteLabel, subscriptionTier } = req.body
  const tenant = await prisma.tenant.update({
    where: { id: req.tenantId! },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(abn !== undefined ? { abn } : {}),
      ...(builderRegNumber !== undefined ? { builderRegNumber } : {}),
      ...(plumberLicence !== undefined ? { plumberLicence } : {}),
      ...(primaryColour !== undefined ? { primaryColour } : {}),
      ...(isWhiteLabel !== undefined ? { isWhiteLabel } : {}),
      ...(subscriptionTier !== undefined ? { subscriptionTier: subscriptionTier as any } : {}),
    },
  })
  res.json(tenant)
})

// ============================================================
// SUBSCRIPTIONS & ENTITLEMENTS
// ============================================================
app.get('/api/subscriptions', async (req: TenantRequest, res) => {
  const subs = await prisma.subscription.findMany({
    where: { tenantId: req.tenantId! },
    orderBy: { createdAt: 'desc' },
  })
  res.json(subs)
})

app.post('/api/subscriptions', async (req: TenantRequest, res) => {
  const { tier, monthlyFee, startDate, endDate } = req.body
  const sub = await prisma.subscription.create({
    data: {
      tenantId: req.tenantId!,
      tier,
      monthlyFee: parseFloat(monthlyFee),
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
    },
  })
  res.json(sub)
})

app.get('/api/entitlements', async (req: TenantRequest, res) => {
  const ents = await prisma.moduleEntitlement.findMany({
    where: { tenantId: req.tenantId! },
  })
  res.json(ents)
})

app.patch('/api/entitlements/:moduleKey', async (req: TenantRequest, res) => {
  const { moduleKey } = req.params
  const { isEnabled, addOnPrice } = req.body
  const ent = await prisma.moduleEntitlement.upsert({
    where: { tenantId_moduleKey: { tenantId: req.tenantId!, moduleKey: moduleKey as any } },
    update: { isEnabled, addOnPrice: addOnPrice ? parseFloat(addOnPrice) : 0 },
    create: { tenantId: req.tenantId!, moduleKey: moduleKey as any, isEnabled: !!isEnabled, addOnPrice: addOnPrice ? parseFloat(addOnPrice) : 0 },
  })
  res.json(ent)
})

// ============================================================
// LEADS (CRM)
// ============================================================
app.get('/api/leads', async (req: TenantRequest, res) => {
  const leads = await prisma.lead.findMany({
    where: { tenantId: req.tenantId! },
    orderBy: { createdAt: 'desc' },
  })
  res.json(leads)
})

app.post('/api/leads', async (req: TenantRequest, res) => {
  const { firstName, lastName, email, phone, suburb, status, source, estimatedValue, notes } = req.body
  const lead = await prisma.lead.create({
    data: {
      tenantId: req.tenantId!,
      firstName,
      lastName,
      email,
      phone,
      suburb,
      status,
      source,
      estimatedValue: estimatedValue ? parseFloat(estimatedValue) : 0,
      notes,
    },
  })
  res.json(lead)
})

app.patch('/api/leads/:id', async (req: TenantRequest, res) => {
  const { id } = req.params
  const lead = await prisma.lead.update({
    where: { id },
    data: req.body,
  })
  res.json(lead)
})

// ============================================================
// QUOTES
// ============================================================
app.get('/api/quotes', async (req: TenantRequest, res) => {
  const quotes = await prisma.quote.findMany({
    where: { tenantId: req.tenantId! },
    include: { bomItems: true, lead: true, job: true },
    orderBy: { createdAt: 'desc' },
  })
  res.json(quotes)
})

app.post('/api/quotes', async (req: TenantRequest, res) => {
  const quote = await prisma.quote.create({
    data: {
      tenantId: req.tenantId!,
      ...req.body,
      totalIncGst: req.body.totalIncGst ? parseFloat(req.body.totalIncGst) : 0,
      totalExGst: req.body.totalExGst ? parseFloat(req.body.totalExGst) : 0,
      gstAmount: req.body.gstAmount ? parseFloat(req.body.gstAmount) : 0,
      planArea: req.body.planArea ? parseFloat(req.body.planArea) : 0,
      pitchDegrees: req.body.pitchDegrees ? parseFloat(req.body.pitchDegrees) : 0,
      wastePercentage: req.body.wastePercentage ? parseFloat(req.body.wastePercentage) : 7,
      roofHeight: req.body.roofHeight ? parseFloat(req.body.roofHeight) : 0,
      asbestosArea: req.body.asbestosArea ? parseFloat(req.body.asbestosArea) : 0,
    },
  })
  res.json(quote)
})

app.patch('/api/quotes/:id', async (req: TenantRequest, res) => {
  const { id } = req.params
  const quote = await prisma.quote.update({
    where: { id },
    data: req.body,
  })

  // Broadcast real-time update
  if (req.body.status === 'ACCEPTED') {
    broadcastToTenant(req.tenantId!, 'quote:accepted', { quoteId: id, quote })
  }

  res.json(quote)
})

// ============================================================
// JOBS
// ============================================================
app.get('/api/jobs', async (req: TenantRequest, res) => {
  const jobs = await prisma.job.findMany({
    where: { tenantId: req.tenantId! },
    include: { quote: true, crewAssignmentJob: { include: { crewMember: true } }, stockReservations: true },
    orderBy: { createdAt: 'desc' },
  })
  res.json(jobs)
})

app.post('/api/jobs', async (req: TenantRequest, res) => {
  const { quoteId, jobNumber, scheduledDate, crewLeadId, notes } = req.body
  const job = await prisma.job.create({
    data: {
      tenantId: req.tenantId!,
      quoteId,
      jobNumber,
      scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
      crewLeadId,
      notes,
    },
    include: { quote: true },
  })
  res.json(job)
})

// Helper: auto-generate progress claim invoice for a job milestone
async function ensureMilestoneInvoice(jobId: string, quoteId: string, milestone: string, percent: number) {
  const existing = await prisma.invoice.findFirst({
    where: { tenantId: (await prisma.job.findUnique({ where: { id: jobId } }))!.tenantId, jobId, milestone: milestone as any },
  })
  if (existing) return null

  const quote = await prisma.quote.findUnique({ where: { id: quoteId } })
  if (!quote) return null

  const total = Number(quote.totalIncGst)
  const amount = Math.round(total * percent * 100) / 100
  const gstAmount = Math.round((amount / 11) * 100) / 100
  const num = `${milestone.split('_')[0]}-${jobId.substring(0, 6).toUpperCase()}`

  return prisma.invoice.create({
    data: {
      tenantId: quote.tenantId,
      jobId,
      quoteId,
      invoiceNumber: num,
      milestone: milestone as any,
      amount,
      gstAmount,
      totalIncGst: amount,
      status: 'DRAFT',
    },
  })
}

app.patch('/api/jobs/:id', async (req: TenantRequest, res) => {
  const { id } = req.params
  const before = await prisma.job.findUnique({ where: { id }, include: { quote: true } })
  const job = await prisma.job.update({
    where: { id },
    data: req.body,
  })

  const generated: string[] = []
  const newStatus = req.body.status

  // 50% Materials invoice when job starts
  if (newStatus === 'IN_PROGRESS' && before?.status !== 'IN_PROGRESS') {
    const inv = await ensureMilestoneInvoice(id, job.quoteId, 'MATERIALS_50', 0.5)
    if (inv) generated.push(inv.invoiceNumber)
  }

  // 40% Completion invoice + warranty when job completes
  if (newStatus === 'COMPLETED' && before?.status !== 'COMPLETED') {
    const inv = await ensureMilestoneInvoice(id, job.quoteId, 'COMPLETION_40', 0.4)
    if (inv) generated.push(inv.invoiceNumber)
    await prisma.job.update({ where: { id }, data: { completedDate: new Date() } })
  }

  broadcastToTenant(req.tenantId!, 'job:updated', { jobId: id, status: newStatus, generatedInvoices: generated })

  res.json({ ...job, generatedInvoices: generated })
})

// ============================================================
// BOM ITEMS
// ============================================================
app.get('/api/bom-items', async (req: TenantRequest, res) => {
  const { quoteId } = req.query
  const where: any = { tenantId: req.tenantId! }
  if (quoteId) where.quoteId = quoteId as string
  const items = await prisma.bOMItem.findMany({
    where,
    orderBy: { createdAt: 'asc' },
  })
  res.json(items)
})

app.post('/api/bom-items', async (req: TenantRequest, res) => {
  const item = await prisma.bOMItem.create({
    data: {
      tenantId: req.tenantId!,
      ...req.body,
      quantity: parseFloat(req.body.quantity),
      unitCost: req.body.unitCost ? parseFloat(req.body.unitCost) : 0,
      totalCost: req.body.totalCost ? parseFloat(req.body.totalCost) : 0,
    },
  })
  res.json(item)
})

// ============================================================
// STOCK ITEMS (WMS)
// ============================================================
app.get('/api/stock-items', async (req: TenantRequest, res) => {
  const { location } = req.query
  const where: any = { tenantId: req.tenantId! }
  if (location) where.location = location as any
  const items = await prisma.stockItem.findMany({
    where,
    orderBy: { name: 'asc' },
  })
  res.json(items)
})

app.post('/api/stock-items', async (req: TenantRequest, res) => {
  const item = await prisma.stockItem.create({
    data: {
      tenantId: req.tenantId!,
      ...req.body,
      quantityOnHand: parseFloat(req.body.quantityOnHand || 0),
      quantityReserved: parseFloat(req.body.quantityReserved || 0),
      reorderPoint: parseFloat(req.body.reorderPoint || 0),
      unitCost: parseFloat(req.body.unitCost || 0),
    },
  })
  res.json(item)
})

app.patch('/api/stock-items/:id', async (req: TenantRequest, res) => {
  const { id } = req.params
  const item = await prisma.stockItem.update({
    where: { id },
    data: req.body,
  })
  res.json(item)
})

// ============================================================
// STOCK RESERVATIONS
// ============================================================
app.get('/api/stock-reservations', async (req: TenantRequest, res) => {
  const { jobId } = req.query
  const where: any = { tenantId: req.tenantId! }
  if (jobId) where.jobId = jobId as string
  const reservations = await prisma.stockReservation.findMany({
    where,
    include: { stockItem: true },
    orderBy: { reservedAt: 'desc' },
  })
  res.json(reservations)
})

app.post('/api/stock-reservations', async (req: TenantRequest, res) => {
  const { jobId, stockItemId, quantity } = req.body
  const reservation = await prisma.stockReservation.create({
    data: {
      tenantId: req.tenantId!,
      jobId,
      stockItemId,
      quantity: parseFloat(quantity),
    },
  })
  // Update stock reserved quantity
  await prisma.stockItem.update({
    where: { id: stockItemId },
    data: { quantityReserved: { increment: parseFloat(quantity) } },
  })
  res.json(reservation)
})

// ============================================================
// CREW MEMBERS (HRIS)
// ============================================================
app.get('/api/crew', async (req: TenantRequest, res) => {
  const crew = await prisma.crewMember.findMany({
    where: { tenantId: req.tenantId!, isActive: true },
    include: { hrisProfile: true, tickets: true },
    orderBy: { firstName: 'asc' },
  })
  res.json(crew)
})

app.post('/api/crew', async (req: TenantRequest, res) => {
  const crew = await prisma.crewMember.create({
    data: {
      tenantId: req.tenantId!,
      ...req.body,
      hourlyRate: req.body.hourlyRate ? parseFloat(req.body.hourlyRate) : 0,
      hireDate: new Date(req.body.hireDate),
    },
  })
  res.json(crew)
})

// ============================================================
// HRIS PROFILES
// ============================================================
app.get('/api/hris', async (req: TenantRequest, res) => {
  const profiles = await prisma.hRISProfile.findMany({
    where: { tenantId: req.tenantId! },
    include: { crewMember: true },
    orderBy: { updatedAt: 'desc' },
  })
  res.json(profiles)
})

app.patch('/api/hris/:id', async (req: TenantRequest, res) => {
  const { id } = req.params
  const profile = await prisma.hRISProfile.update({
    where: { id },
    data: req.body,
  })
  res.json(profile)
})

// ============================================================
// TICKETS
// ============================================================
app.get('/api/tickets', async (req: TenantRequest, res) => {
  const tickets = await prisma.ticket.findMany({
    where: { tenantId: req.tenantId! },
    include: { crewMember: true },
    orderBy: { expiryDate: 'asc' },
  })
  res.json(tickets)
})

app.post('/api/tickets', async (req: TenantRequest, res) => {
  const ticket = await prisma.ticket.create({
    data: {
      tenantId: req.tenantId!,
      ...req.body,
      expiryDate: new Date(req.body.expiryDate),
    },
  })
  res.json(ticket)
})

// ============================================================
// SWMS
// ============================================================
app.get('/api/swms', async (req: TenantRequest, res) => {
  const swms = await prisma.sWMS.findMany({
    where: { tenantId: req.tenantId! },
    include: { job: true },
    orderBy: { createdAt: 'desc' },
  })
  res.json(swms)
})

app.post('/api/swms', async (req: TenantRequest, res) => {
  const swms = await prisma.sWMS.create({
    data: {
      tenantId: req.tenantId!,
      ...req.body,
      roofHeight: parseFloat(req.body.roofHeight),
      edgeProtectionRequired: req.body.edgeProtectionRequired === 'true' || req.body.edgeProtectionRequired === true,
      edgeProtectionVerified: req.body.edgeProtectionVerified === 'true' || req.body.edgeProtectionVerified === true,
      fallingFromHeightsSigned: req.body.fallingFromHeightsSigned === 'true' || req.body.fallingFromHeightsSigned === true,
      asbestosRemoval: req.body.asbestosRemoval === 'true' || req.body.asbestosRemoval === true,
      workSafeNotificationDate: req.body.workSafeNotificationDate ? new Date(req.body.workSafeNotificationDate) : null,
    },
  })
  res.json(swms)
})

app.patch('/api/swms/:id', async (req: TenantRequest, res) => {
  const { id } = req.params
  const swms = await prisma.sWMS.update({
    where: { id },
    data: req.body,
  })
  res.json(swms)
})

// ============================================================
// INVOICES (ACCOUNTING)
// ============================================================
app.get('/api/invoices', async (req: TenantRequest, res) => {
  const invoices = await prisma.invoice.findMany({
    where: { tenantId: req.tenantId! },
    include: { job: true, quote: true },
    orderBy: { createdAt: 'desc' },
  })
  res.json(invoices)
})

app.post('/api/invoices', async (req: TenantRequest, res) => {
  const invoice = await prisma.invoice.create({
    data: {
      tenantId: req.tenantId!,
      ...req.body,
      amount: parseFloat(req.body.amount),
      gstAmount: parseFloat(req.body.gstAmount || 0),
      totalIncGst: parseFloat(req.body.totalIncGst),
    },
  })
  res.json(invoice)
})

app.patch('/api/invoices/:id', async (req: TenantRequest, res) => {
  const { id } = req.params
  const invoice = await prisma.invoice.update({
    where: { id },
    data: req.body,
  })
  res.json(invoice)
})

// ============================================================
// GST LEDGER & BAS
// ============================================================
app.get('/api/gst-ledger', async (req: TenantRequest, res) => {
  const { period, year } = req.query
  const where: any = { tenantId: req.tenantId! }
  if (period) where.period = period as any
  if (year) where.year = parseInt(year as string)
  const ledger = await prisma.gSTLedger.findMany({
    where,
    include: { invoice: true },
    orderBy: { createdAt: 'desc' },
  })
  res.json(ledger)
})

app.post('/api/gst-ledger', async (req: TenantRequest, res) => {
  const { invoiceId, gstCollected, gstPaid, period, year } = req.body
  const entry = await prisma.gSTLedger.create({
    data: {
      tenantId: req.tenantId!,
      invoiceId,
      gstCollected: parseFloat(gstCollected || 0),
      gstPaid: parseFloat(gstPaid || 0),
      period: period as any,
      year: parseInt(year),
    },
  })
  res.json(entry)
})

app.delete('/api/gst-ledger/:id', async (req: TenantRequest, res) => {
  await prisma.gSTLedger.delete({ where: { id: req.params.id } })
  res.json({ success: true })
})

app.get('/api/bas-returns', async (req: TenantRequest, res) => {
  const returns = await prisma.bASReturn.findMany({
    where: { tenantId: req.tenantId! },
    orderBy: [{ year: 'desc' }, { period: 'desc' }],
  })
  res.json(returns)
})

// POST /api/bas-returns — Create a BAS return
app.post('/api/bas-returns', async (req: TenantRequest, res) => {
  const { period, year, gstCollected, gstPaid } = req.body
  const netGst = (gstCollected || 0) - (gstPaid || 0)
  const basReturn = await prisma.bASReturn.create({
    data: {
      tenantId: req.tenantId!,
      period: period as any,
      year: parseInt(year),
      gstCollected: parseFloat(gstCollected || 0),
      gstPaid: parseFloat(gstPaid || 0),
      netGst,
      filed: false,
    },
  })
  res.json(basReturn)
})

// PUT /api/bas-returns/:id — Update (file) a BAS return
app.put('/api/bas-returns/:id', async (req: TenantRequest, res) => {
  const { id } = req.params
  const { filed, filedAt } = req.body
  const basReturn = await prisma.bASReturn.update({
    where: { id },
    data: {
      filed: filed !== undefined ? filed : undefined,
      filedAt: filedAt ? new Date(filedAt) : undefined,
    },
  })
  res.json(basReturn)
})

// GET /api/bas-returns/compute — Compute BAS from GST ledger
app.get('/api/bas-returns/compute', async (req: TenantRequest, res) => {
  const { period, year } = req.query
  const p = (period as string) || 'Q1'
  const y = parseInt(year as string) || new Date().getFullYear()

  const ledger = await prisma.gSTLedger.findMany({
    where: { tenantId: req.tenantId!, period: p as any, year: y },
    include: { invoice: true },
  })

  const gstCollected = ledger.reduce((sum, l) => sum + Number(l.gstCollected), 0)
  const gstPaid = ledger.reduce((sum, l) => sum + Number(l.gstPaid), 0)
  const netGst = gstCollected - gstPaid

  // Also get total sales and purchases from invoices
  const invoices = await prisma.invoice.findMany({
    where: { tenantId: req.tenantId!, status: { in: ['PAID', 'SENT'] } },
  })
  const totalSales = invoices.reduce((sum, inv) => sum + Number(inv.totalIncGst), 0)
  const totalPurchases = invoices.reduce((sum, inv) => sum + Number(inv.amount) * 0.7, 0) // estimated

  res.json({
    period: p,
    year: y,
    gstCollected: Math.round(gstCollected * 100) / 100,
    gstPaid: Math.round(gstPaid * 100) / 100,
    netGst: Math.round(netGst * 100) / 100,
    totalSales: Math.round(totalSales * 100) / 100,
    totalPurchases: Math.round(totalPurchases * 100) / 100,
    invoiceCount: invoices.length,
    ledgerEntries: ledger.length,
  })
})

// ============================================================
// TPAR
// ============================================================
app.get('/api/tpar', async (req: TenantRequest, res) => {
  const { financialYear } = req.query
  const where: any = { tenantId: req.tenantId! }
  if (financialYear) where.financialYear = parseInt(financialYear as string)
  const records = await prisma.tPARRecord.findMany({
    where,
    orderBy: { contractorName: 'asc' },
  })
  res.json(records)
})

// GET /api/tpar/validate-abn/:abn — Validate an ABN (checksum + optional ABR lookup)
app.get('/api/tpar/validate-abn/:abn', async (req: TenantRequest, res) => {
  const result = await lookupABN(req.params.abn)
  res.json(result)
})

// POST /api/tpar/revalidate — Recompute abnValid for all TPAR records using real checksum
app.post('/api/tpar/revalidate', async (req: TenantRequest, res) => {
  const records = await prisma.tPARRecord.findMany({ where: { tenantId: req.tenantId! } })
  let updated = 0
  for (const record of records) {
    const valid = isValidABN(record.abn)
    if (valid !== record.abnValid) {
      await prisma.tPARRecord.update({ where: { id: record.id }, data: { abnValid: valid } })
      updated++
    }
  }
  res.json({ checked: records.length, updated })
})

app.post('/api/tpar', async (req: TenantRequest, res) => {
  const { contractorName, abn, totalPayments, financialYear } = req.body
  const validation = await lookupABN(abn || '')
  const abnClean = validation.abn
  const record = await prisma.tPARRecord.create({
    data: {
      tenantId: req.tenantId!,
      contractorName,
      abn: abnClean,
      abnValid: validation.isValid,
      totalPayments: parseFloat(totalPayments || 0),
      financialYear: parseInt(financialYear),
    },
  })
  res.json({ ...record, validation })
})

app.put('/api/tpar/:id', async (req: TenantRequest, res) => {
  const { id } = req.params
  const { contractorName, abn, totalPayments, financialYear } = req.body
  const validation = abn ? await lookupABN(abn) : null
  const abnClean = validation ? validation.abn : undefined
  const record = await prisma.tPARRecord.update({
    where: { id },
    data: {
      contractorName,
      abn: abnClean,
      abnValid: validation ? validation.isValid : undefined,
      totalPayments: totalPayments ? parseFloat(totalPayments) : undefined,
      financialYear: financialYear ? parseInt(financialYear) : undefined,
    },
  })
  res.json(validation ? { ...record, validation } : record)
})

app.delete('/api/tpar/:id', async (req: TenantRequest, res) => {
  await prisma.tPARRecord.delete({ where: { id: req.params.id } })
  res.json({ success: true })
})

// ============================================================
// EQUIPMENT & HARNESS (EAM)
// ============================================================
app.get('/api/equipment', async (req: TenantRequest, res) => {
  const equip = await prisma.equipment.findMany({
    where: { tenantId: req.tenantId! },
    include: { inspections: true, assignedTo: true },
    orderBy: { name: 'asc' },
  })
  res.json(equip)
})

app.post('/api/equipment', async (req: TenantRequest, res) => {
  const equip = await prisma.equipment.create({
    data: {
      tenantId: req.tenantId!,
      ...req.body,
      cost: req.body.cost ? parseFloat(req.body.cost) : 0,
      purchaseDate: req.body.purchaseDate ? new Date(req.body.purchaseDate) : null,
    },
  })
  res.json(equip)
})

app.get('/api/harnesses', async (req: TenantRequest, res) => {
  const harnesses = await prisma.harness.findMany({
    where: { tenantId: req.tenantId! },
    include: { inspections: true, assignedTo: true },
    orderBy: { nextInspectionDue: 'asc' },
  })
  res.json(harnesses)
})

app.post('/api/harnesses', async (req: TenantRequest, res) => {
  const harness = await prisma.harness.create({
    data: {
      tenantId: req.tenantId!,
      ...req.body,
      lastInspectionDate: req.body.lastInspectionDate ? new Date(req.body.lastInspectionDate) : null,
      nextInspectionDue: req.body.nextInspectionDue ? new Date(req.body.nextInspectionDue) : null,
    },
  })
  res.json(harness)
})

// ============================================================
// ASSET INSPECTIONS
// ============================================================
app.get('/api/inspections', async (req: TenantRequest, res) => {
  const inspections = await prisma.assetInspection.findMany({
    where: { tenantId: req.tenantId! },
    include: { equipment: true, harness: true },
    orderBy: { nextDueDate: 'asc' },
  })
  res.json(inspections)
})

app.post('/api/inspections', async (req: TenantRequest, res) => {
  const inspection = await prisma.assetInspection.create({
    data: {
      tenantId: req.tenantId!,
      ...req.body,
      inspectionDate: new Date(req.body.inspectionDate),
      nextDueDate: new Date(req.body.nextDueDate),
    },
  })
  res.json(inspection)
})

// ============================================================
// RFQ (SCM)
// ============================================================
app.get('/api/rfqs', async (req: TenantRequest, res) => {
  const rfqs = await prisma.rFQ.findMany({
    where: { tenantId: req.tenantId! },
    include: { items: true, job: true },
    orderBy: { createdAt: 'desc' },
  })
  res.json(rfqs)
})

app.post('/api/rfqs', async (req: TenantRequest, res) => {
  const { items, ...rfqData } = req.body
  const rfq = await prisma.rFQ.create({
    data: {
      tenantId: req.tenantId!,
      ...rfqData,
      items: items ? {
        create: items.map((item: any) => ({
          itemName: item.itemName,
          quantity: parseFloat(item.quantity),
          unit: item.unit,
          unitPrice: item.unitPrice ? parseFloat(item.unitPrice) : null,
          totalPrice: item.totalPrice ? parseFloat(item.totalPrice) : null,
        })),
      } : undefined,
    },
    include: { items: true },
  })
  res.json(rfq)
})

app.patch('/api/rfqs/:id', async (req: TenantRequest, res) => {
  const { id } = req.params
  const rfq = await prisma.rFQ.update({
    where: { id },
    data: req.body,
  })
  res.json(rfq)
})

// ============================================================
// PURCHASE ORDERS
// ============================================================
app.get('/api/purchase-orders', async (req: TenantRequest, res) => {
  const pos = await prisma.purchaseOrder.findMany({
    where: { tenantId: req.tenantId! },
    include: { rfq: true },
    orderBy: { createdAt: 'desc' },
  })
  res.json(pos)
})

app.post('/api/purchase-orders', async (req: TenantRequest, res) => {
  try {
    const { rfqId, poNumber, supplierName, totalAmount, status } = req.body
    if (!rfqId || !poNumber) {
      res.status(400).json({ error: 'rfqId and poNumber are required' })
      return
    }
    const rfq = await prisma.rFQ.findFirst({ where: { id: rfqId, tenantId: req.tenantId! } })
    if (!rfq) {
      res.status(404).json({ error: 'RFQ not found for this tenant' })
      return
    }
    const po = await prisma.purchaseOrder.create({
      data: {
        tenantId: req.tenantId!,
        rfqId,
        poNumber,
        supplierName: supplierName || rfq.supplierName,
        totalAmount: parseFloat(totalAmount || 0),
        status: status || 'draft',
      },
    })
    res.json(po)
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to create purchase order' })
  }
})

// ============================================================
// AUDIT LOGS
// ============================================================
app.get('/api/audit-logs', async (req: TenantRequest, res) => {
  const logs = await prisma.auditLog.findMany({
    where: { tenantId: req.tenantId! },
    include: { user: true },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })
  res.json(logs)
})

// ============================================================
// DASHBOARD / BI SUMMARY
// ============================================================
app.get('/api/dashboard/summary', async (req: TenantRequest, res) => {
  const [quotes, jobs, invoices, stockItems] = await Promise.all([
    prisma.quote.count({ where: { tenantId: req.tenantId! } }),
    prisma.job.count({ where: { tenantId: req.tenantId! } }),
    prisma.invoice.aggregate({
      where: { tenantId: req.tenantId!, status: 'PAID' },
      _sum: { totalIncGst: true },
    }),
    prisma.stockItem.findMany({ where: { tenantId: req.tenantId! } }),
  ])

  const lowStock = stockItems.filter(
    (item) => Number(item.quantityOnHand) <= Number(item.reorderPoint)
  ).length

  res.json({
    totalQuotes: quotes,
    totalJobs: jobs,
    totalRevenue: invoices._sum.totalIncGst || 0,
    lowStockCount: lowStock,
  })
})

// ============================================================
// JOB PHOTOS (WHS before/after)
// ============================================================
app.get('/api/photos', async (req: TenantRequest, res) => {
  const { jobId, category } = req.query
  const where: any = { tenantId: req.tenantId! }
  if (jobId) where.jobId = jobId as string
  if (category) where.category = category as string
  const photos = await prisma.jobPhoto.findMany({
    where,
    select: { id: true, tenantId: true, jobId: true, category: true, fileName: true, mimeType: true, sizeBytes: true, uploadedBy: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  })
  res.json(photos)
})

app.get('/api/photos/:id/data', async (req: TenantRequest, res) => {
  const photo = await prisma.jobPhoto.findUnique({ where: { id: req.params.id } })
  if (!photo) {
    res.status(404).json({ error: 'Photo not found' })
    return
  }
  res.json({ dataUrl: photo.dataUrl, mimeType: photo.mimeType, fileName: photo.fileName })
})

app.post('/api/photos', async (req: TenantRequest, res) => {
  const { jobId, category, fileName, mimeType, dataUrl, uploadedBy } = req.body
  if (!jobId || !dataUrl) {
    res.status(400).json({ error: 'jobId and dataUrl are required' })
    return
  }
  // Estimate size from base64
  const sizeBytes = Math.round((dataUrl.length * 3) / 4)
  const photo = await prisma.jobPhoto.create({
    data: {
      tenantId: req.tenantId!,
      jobId,
      category: category || 'before',
      fileName: fileName || 'photo.jpg',
      mimeType: mimeType || 'image/jpeg',
      sizeBytes,
      dataUrl,
      uploadedBy,
    },
    select: { id: true, tenantId: true, jobId: true, category: true, fileName: true, mimeType: true, sizeBytes: true, uploadedBy: true, createdAt: true },
  })
  res.json(photo)
})

app.delete('/api/photos/:id', requirePermission('projects:write'), async (req: TenantRequest, res) => {
  await prisma.jobPhoto.delete({ where: { id: req.params.id } })
  res.json({ success: true })
})

// ============================================================
// USERS
// ============================================================
app.get('/api/users', requirePermission('saas:read'), async (req: TenantRequest, res) => {
  const users = await prisma.user.findMany({
    where: { tenantId: req.tenantId! },
    select: { id: true, tenantId: true, email: true, name: true, role: true, avatarUrl: true, isActive: true, createdAt: true, updatedAt: true },
    orderBy: { name: 'asc' },
  })
  res.json(users)
})

app.post('/api/users', requirePermission('saas:admin'), async (req: TenantRequest, res) => {
  const { email, name, role, password } = req.body
  const user = await prisma.user.create({
    data: { tenantId: req.tenantId!, email, name, role: role || 'staff', password: password || null },
    select: { id: true, tenantId: true, email: true, name: true, role: true, avatarUrl: true, isActive: true },
  })
  res.json(user)
})

app.put('/api/users/:id', async (req: TenantRequest, res) => {
  const { email, name, role, isActive, avatarUrl } = req.body
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { email, name, role, isActive, avatarUrl },
    select: { id: true, tenantId: true, email: true, name: true, role: true, avatarUrl: true, isActive: true },
  })
  res.json(user)
})

app.delete('/api/users/:id', async (req: TenantRequest, res) => {
  await prisma.user.delete({ where: { id: req.params.id } })
  res.json({ success: true })
})

// ============================================================
// CREW ASSIGNMENTS
// ============================================================
app.get('/api/crew-assignments', async (req: TenantRequest, res) => {
  const { jobId } = req.query
  const where: any = { tenantId: req.tenantId! }
  if (jobId) where.jobId = jobId as string
  const assignments = await prisma.crewAssignment.findMany({
    where,
    include: { crewMember: true },
    orderBy: { assignedAt: 'desc' },
  })
  res.json(assignments)
})

app.post('/api/crew-assignments', async (req: TenantRequest, res) => {
  const { jobId, crewMemberId } = req.body
  const assignment = await prisma.crewAssignment.create({
    data: { tenantId: req.tenantId!, jobId, crewMemberId },
    include: { crewMember: true },
  })
  res.json(assignment)
})

app.delete('/api/crew-assignments/:id', async (req: TenantRequest, res) => {
  await prisma.crewAssignment.delete({ where: { id: req.params.id } })
  res.json({ success: true })
})

// ============================================================
// WAREHOUSE LOCATIONS
// ============================================================
app.get('/api/warehouse-locations', async (req: TenantRequest, res) => {
  const locations = await prisma.warehouseLocation.findMany({
    where: { tenantId: req.tenantId! },
    include: { stockItems: true },
    orderBy: { name: 'asc' },
  })
  res.json(locations)
})

app.post('/api/warehouse-locations', async (req: TenantRequest, res) => {
  const { name, address } = req.body
  const location = await prisma.warehouseLocation.create({
    data: { tenantId: req.tenantId!, name, address },
  })
  res.json(location)
})

app.put('/api/warehouse-locations/:id', async (req: TenantRequest, res) => {
  const { name, address, isActive } = req.body
  const location = await prisma.warehouseLocation.update({
    where: { id: req.params.id },
    data: { name, address, isActive },
  })
  res.json(location)
})

app.delete('/api/warehouse-locations/:id', async (req: TenantRequest, res) => {
  await prisma.warehouseLocation.delete({ where: { id: req.params.id } })
  res.json({ success: true })
})

// ============================================================
// ADDITIONAL CRUD: BOM items, stock reservations, equipment, harnesses, inspections, POs
// ============================================================
app.put('/api/bom-items/:id', async (req: TenantRequest, res) => {
  const { quantity, unitCost, totalCost, itemName } = req.body
  const item = await prisma.bOMItem.update({
    where: { id: req.params.id },
    data: {
      ...(quantity !== undefined ? { quantity: parseFloat(quantity) } : {}),
      ...(unitCost !== undefined ? { unitCost: parseFloat(unitCost) } : {}),
      ...(totalCost !== undefined ? { totalCost: parseFloat(totalCost) } : {}),
      ...(itemName !== undefined ? { itemName } : {}),
    },
  })
  res.json(item)
})

app.delete('/api/bom-items/:id', async (req: TenantRequest, res) => {
  await prisma.bOMItem.delete({ where: { id: req.params.id } })
  res.json({ success: true })
})

app.delete('/api/stock-reservations/:id', async (req: TenantRequest, res) => {
  const reservation = await prisma.stockReservation.findUnique({ where: { id: req.params.id } })
  if (reservation) {
    await prisma.stockItem.update({
      where: { id: reservation.stockItemId },
      data: { quantityReserved: { decrement: Number(reservation.quantity) } },
    })
  }
  await prisma.stockReservation.delete({ where: { id: req.params.id } })
  res.json({ success: true })
})

app.put('/api/equipment/:id', async (req: TenantRequest, res) => {
  const equip = await prisma.equipment.update({ where: { id: req.params.id }, data: req.body })
  res.json(equip)
})

app.delete('/api/equipment/:id', async (req: TenantRequest, res) => {
  await prisma.equipment.delete({ where: { id: req.params.id } })
  res.json({ success: true })
})

app.put('/api/harnesses/:id', async (req: TenantRequest, res) => {
  const { nextInspectionDue, lastInspectionDate, status } = req.body
  const harness = await prisma.harness.update({
    where: { id: req.params.id },
    data: {
      ...(nextInspectionDue ? { nextInspectionDue: new Date(nextInspectionDue) } : {}),
      ...(lastInspectionDate ? { lastInspectionDate: new Date(lastInspectionDate) } : {}),
      ...(status ? { status } : {}),
    },
  })
  res.json(harness)
})

app.delete('/api/harnesses/:id', async (req: TenantRequest, res) => {
  await prisma.harness.delete({ where: { id: req.params.id } })
  res.json({ success: true })
})

app.delete('/api/inspections/:id', async (req: TenantRequest, res) => {
  await prisma.assetInspection.delete({ where: { id: req.params.id } })
  res.json({ success: true })
})

app.put('/api/purchase-orders/:id', async (req: TenantRequest, res) => {
  const po = await prisma.purchaseOrder.update({ where: { id: req.params.id }, data: req.body })
  res.json(po)
})

app.delete('/api/purchase-orders/:id', async (req: TenantRequest, res) => {
  await prisma.purchaseOrder.delete({ where: { id: req.params.id } })
  res.json({ success: true })
})

// Capture errors to Sentry before the final Express handler
installSentryErrorHandler(app)
app.use(errorCapture)

// Error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err)
  res.status(500).json({ error: err.message || 'Internal server error' })
})

// Create HTTP server for Socket.io
const server = http.createServer(app)

// Socket.io setup for real-time updates
let io: SocketIOServer | null = null
if (process.env.NODE_ENV !== 'test') {
  io = new SocketIOServer(server, {
    cors: {
      origin: env.CLIENT_URL,
      methods: ['GET', 'POST'],
    },
  })

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id)

    socket.on('join-tenant', (tenantId: string) => {
      socket.join(`tenant:${tenantId}`)
      console.log(`Socket ${socket.id} joined tenant ${tenantId}`)
    })

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id)
    })
  })

  // Export io for use in routes
  ;(app as any).io = io
}

// Broadcast function for real-time updates
export function broadcastToTenant(tenantId: string, event: string, data: any) {
  if (io) {
    io.to(`tenant:${tenantId}`).emit(event, data)
  }
}

if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    console.log(`RoofDynamics Backend running on http://localhost:${PORT}`)
    console.log(`WebSocket server ready on ws://localhost:${PORT}`)
  })
}

export default app
export { io }
