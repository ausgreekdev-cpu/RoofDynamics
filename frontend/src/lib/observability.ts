/**
 * Frontend Sentry initialization. No-op when VITE_SENTRY_DSN is not configured.
 * Safe for local dev and tests (Guardrail #3/#5).
 */
import * as Sentry from '@sentry/react'
import { env } from '../env'

let initialized = false

export function initFrontendSentry(): boolean {
  if (!env.VITE_SENTRY_DSN) return false
  if (initialized) return true
  Sentry.init({
    dsn: env.VITE_SENTRY_DSN,
    environment: env.MODE,
    release: 'roofdynamics@frontend',
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: env.PROD ? 0.2 : 1.0,
  })
  initialized = true
  return true
}

export function isFrontendSentryEnabled(): boolean {
  return initialized
}

export function captureFrontendError(error: unknown, context?: Record<string, unknown>): string | null {
  if (!initialized) return null
  return Sentry.captureException(error, context ? { extra: context } : undefined)
}
