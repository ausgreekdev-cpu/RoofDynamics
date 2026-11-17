import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../env'
import { verifySupabaseToken } from '../server/auth/supabase'
import { normalizeRole } from '../server/auth/rbac'

export interface AuthRequest extends Request {
  userId?: string
  tenantId?: string
  userEmail?: string
  userRole?: string
  authProvider?: 'supabase' | 'local'
}

const JWT_SECRET = env.JWT_SECRET

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    res.status(401).json({ error: 'Access token required' })
    return
  }

  // Demo mode: accept demo tokens (local fallback preserved)
  if (token.startsWith('demo-token-')) {
    const tenantId = (req.headers['x-tenant-id'] as string) || 'tenant-1'
    req.userId = 'demo-user'
    req.tenantId = tenantId
    req.userEmail = 'demo@roofdynamics.com.au'
    req.userRole = 'admin'
    req.authProvider = 'local'
    next()
    return
  }

  // Supabase JWT when configured
  const identity = await verifySupabaseToken(token)
  if (identity) {
    req.userId = identity.userId
    req.tenantId = identity.tenantId || (req.headers['x-tenant-id'] as string)
    req.userEmail = identity.email
    req.userRole = identity.role
    req.authProvider = 'supabase'
    next()
    return
  }

  // Local JWT fallback — existing behavior, unchanged
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      res.status(403).json({ error: 'Invalid or expired token' })
      return
    }

    const payload = user as {
      userId: string
      tenantId: string
      email: string
      role: string
    }

    req.userId = payload.userId
    req.tenantId = payload.tenantId
    req.userEmail = payload.email
    req.userRole = normalizeRole(payload.role)
    req.authProvider = 'local'

    next()
  })
}

export const generateToken = (payload: {
  userId: string
  tenantId: string
  email: string
  role: string
}): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}
