import type { Request, Response, NextFunction } from 'express'
import { logger } from './logging'
import { captureException } from './sentry'

/** Log every request with method, path, status and duration. */
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now()
  res.on('finish', () => {
    logger.info('http.request', {
      method: req.method,
      path: req.originalUrl.split('?')[0],
      status: res.statusCode,
      durationMs: Date.now() - start,
      tenantId: (req as any).tenantId,
    })
  })
  next()
}

/** Capture uncaught route errors into Sentry, then delegate to Express. */
export function errorCapture(err: Error, req: Request, _res: Response, next: NextFunction) {
  logger.error('http.error', { message: err.message, path: req.originalUrl })
  captureException(err, { path: req.originalUrl, method: req.method })
  next(err)
}

/** Runtime metrics endpoint payload (no secrets). */
export function collectMetrics() {
  const mem = process.memoryUsage()
  return {
    uptimeSeconds: Math.round(process.uptime()),
    pid: process.pid,
    nodeVersion: process.version,
    memory: {
      rssMb: Math.round(mem.rss / 1024 / 1024),
      heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
      heapTotalMb: Math.round(mem.heapTotal / 1024 / 1024),
    },
    timestamp: new Date().toISOString(),
  }
}
