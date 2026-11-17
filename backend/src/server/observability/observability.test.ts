import type { Request, Response, NextFunction } from 'express'
import { initSentry, isSentryEnabled, captureException, captureMessage, flushSentry } from './sentry'
import { collectMetrics, requestLogger, errorCapture } from './middleware'

describe('observability', () => {
  it('does not initialize Sentry without a DSN', () => {
    expect(initSentry()).toBe(false)
    expect(isSentryEnabled()).toBe(false)
  })

  it('capture helpers are safe no-ops when disabled', async () => {
    expect(captureException(new Error('test'))).toBeNull()
    expect(captureMessage('test')).toBeNull()
    expect(await flushSentry()).toBe(false)
  })

  it('collects runtime metrics', () => {
    const metrics = collectMetrics()
    expect(metrics.uptimeSeconds).toBeGreaterThanOrEqual(0)
    expect(metrics.pid).toBe(process.pid)
    expect(metrics.nodeVersion).toMatch(/^v\d+/)
    expect(metrics.memory.rssMb).toBeGreaterThan(0)
    expect(metrics.timestamp).toMatch(/Z$/)
  })

  it('request logger delegates to next', () => {
    const req = { method: 'GET', originalUrl: '/api/health', headers: {} } as unknown as Request
    const res: any = { on: jest.fn(), statusCode: 200 }
    const next = jest.fn() as NextFunction
    requestLogger(req, res as Response, next)
    expect(next).toHaveBeenCalled()
    expect(res.on).toHaveBeenCalledWith('finish', expect.any(Function))
  })

  it('error capture logs and delegates to Express', () => {
    const req = { originalUrl: '/api/x', method: 'POST' } as Request
    const next = jest.fn() as NextFunction
    errorCapture(new Error('boom'), req, {} as Response, next)
    expect(next).toHaveBeenCalledWith(expect.any(Error))
  })
})
