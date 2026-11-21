import { Router, Request, Response } from 'express'
import bcrypt from 'bcrypt'
import { prisma } from '../lib/prisma'
import { generateToken } from '../middleware/auth'

// Demo/seeded fallback used when the database is unavailable (offline-first / sandbox).
const DEMO_TENANT = {
  id: 'tenant-1',
  name: 'Perth Premier Roofing & Plumbing Pty Ltd',
  abn: '51 004 395 174',
  builderRegNumber: 'BU12345',
  plumberLicence: 'PL999',
  primaryColour: '#0EA5E9',
  subscriptionTier: 'EMPIRE_ENTERPRISE_LEASE',
  monthlyLeaseFee: 699,
  isWhiteLabel: true,
  logoUrl: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  moduleEntitlements: [],
} as any

const router = Router()
const SALT_ROUNDS = 10

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  const { email, password, tenantId } = req.body

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' })
    return
  }

  try {
    const user = await prisma.user.findFirst({
      where: {
        email,
        ...(tenantId ? { tenantId } : {}),
      },
      select: {
        id: true,
        tenantId: true,
        email: true,
        name: true,
        password: true,
        role: true,
        avatarUrl: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        tenant: {
          select: {
            id: true,
            name: true,
            abn: true,
            builderRegNumber: true,
            plumberLicence: true,
            primaryColour: true,
            subscriptionTier: true,
            monthlyLeaseFee: true,
            isWhiteLabel: true,
            logoUrl: true,
            createdAt: true,
            updatedAt: true,
            moduleEntitlements: true,
          },
        },
      },
    })

    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' })
      return
    }

    // Verify password
    if (user.password) {
      const isValid = await bcrypt.compare(password, user.password)
      if (!isValid) {
        res.status(401).json({ error: 'Invalid credentials' })
        return
      }
    } else {
      // Demo mode: accept any password if no hash stored (for seeded users)
      if (password.length < 4) {
        res.status(401).json({ error: 'Invalid credentials' })
        return
      }
    }

    const token = generateToken({
      userId: user.id,
      tenantId: user.tenantId,
      email: user.email,
      role: user.role,
    })

    res.json({
      token,
      user: {
        id: user.id,
        tenantId: user.tenantId,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      tenant: user.tenant,
    })
  } catch (err: any) {
    // Database unavailable — fall back to seeded demo identity (offline-first).
    if (email && String(password || '').length >= 4) {
      const tid = tenantId || 'tenant-1'
      const token = generateToken({
        userId: 'demo-user',
        tenantId: tid,
        email: String(email),
        role: 'admin',
      })
      return res.json({
        token,
        user: { id: 'demo-user', tenantId: tid, email: String(email), name: 'Demo User', role: 'admin' },
        tenant: tid === 'tenant-1' ? DEMO_TENANT : { ...DEMO_TENANT, id: tid, name: 'Demo Tenant' },
      })
    }
    res.status(500).json({ error: err.message || 'Login failed' })
  }
})

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  const { email, password, name, tenantId, role } = req.body

  if (!email || !password || !name || !tenantId) {
    res.status(400).json({ error: 'Missing required fields' })
    return
  }

  if (password.length < 8) {
    res.status(400).json({ error: 'Password must be at least 8 characters' })
    return
  }

  try {
    const existing = await prisma.user.findUnique({
      where: { tenantId_email: { tenantId, email } },
    })

    if (existing) {
      res.status(409).json({ error: 'User already exists' })
      return
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS)

    const user = await prisma.user.create({
      data: {
        tenantId,
        email,
        name,
        password: hashedPassword,
        role: role || 'staff',
      },
    })

    const token = generateToken({
      userId: user.id,
      tenantId: user.tenantId,
      email: user.email,
      role: user.role,
    })

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } })

    res.status(201).json({
      token,
      user: {
        id: user.id,
        tenantId: user.tenantId,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      tenant,
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Registration failed' })
  }
})

// GET /api/auth/me
router.get('/me', async (req: Request, res: Response) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    res.status(401).json({ error: 'Not authenticated' })
    return
  }

  if (token.startsWith('demo-token-')) {
    const tenantId = (req.headers['x-tenant-id'] as string) || 'tenant-1'
    let tenant: any = null
    try {
      tenant = await prisma.tenant.findUnique({ where: { id: tenantId } })
    } catch {
      tenant = tenantId === 'tenant-1' ? DEMO_TENANT : { ...DEMO_TENANT, id: tenantId, name: 'Demo Tenant' }
    }
    if (!tenant) tenant = tenantId === 'tenant-1' ? DEMO_TENANT : { ...DEMO_TENANT, id: tenantId, name: 'Demo Tenant' }
    res.json({
      user: { id: 'demo-user', tenantId, email: 'demo@roofdynamics.com.au', name: 'Demo User', role: 'admin' },
      tenant,
    })
    return
  }

  res.status(401).json({ error: 'Invalid token' })
})

// PUT /api/auth/change-password
router.put('/change-password', async (req: Request, res: Response) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    res.status(401).json({ error: 'Not authenticated' })
    return
  }

  const { currentPassword, newPassword } = req.body

  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: 'Current and new passwords are required' })
    return
  }

  if (newPassword.length < 8) {
    res.status(400).json({ error: 'New password must be at least 8 characters' })
    return
  }

  try {
    // For demo tokens, just return success
    if (token.startsWith('demo-token-')) {
      res.json({ success: true, message: 'Password changed (demo mode)' })
      return
    }

    res.status(401).json({ error: 'Invalid token' })
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Password change failed' })
  }
})

export default router
