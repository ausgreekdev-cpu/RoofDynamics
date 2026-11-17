import { describe, it, expect } from 'vitest'
import { initFrontendSentry, isFrontendSentryEnabled, captureFrontendError } from './observability'

describe('frontend observability', () => {
  it('is a no-op without a Sentry DSN', () => {
    expect(initFrontendSentry()).toBe(false)
    expect(isFrontendSentryEnabled()).toBe(false)
  })

  it('capture helper is safe when disabled', () => {
    expect(captureFrontendError(new Error('test'))).toBeNull()
  })
})
