/**
 * Sentry initialization + capture helpers.
 * No-op when SENTRY_DSN is not configured (sandbox-safe, Guardrail #3).
 */
import * as Sentry from '@sentry/node'
import { env } from '../../env'

let initialized = false

export function initSentry(): boolean {
  if (!env.SENTRY_DSN) return false
  if (initialized) return true
  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    release: process.env.APP_VERSION || 'roofdynamics@dev',
    tracesSampleRate: env.NODE_ENV === 'production' ? 0.2 : 1.0,
    enabled: true,
  })
  initialized = true
  return true
}

export function isSentryEnabled(): boolean {
  return initialized
}

export function captureException(error: unknown, context?: Record<string, unknown>): string | null {
  if (!initialized) return null
  return Sentry.captureException(error, context ? { extra: context } : undefined)
}

export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info'): string | null {
  if (!initialized) return null
  return Sentry.captureMessage(message, level)
}

export async function flushSentry(timeoutMs = 2000): Promise<boolean> {
  if (!initialized) return false
  return Sentry.flush(timeoutMs)
}

/** Register Sentry's Express error handler on an app (when enabled). */
export function installSentryErrorHandler(app: unknown): boolean {
  if (!initialized) return false
  Sentry.setupExpressErrorHandler(app as Parameters<typeof Sentry.setupExpressErrorHandler>[0])
  return true
}
