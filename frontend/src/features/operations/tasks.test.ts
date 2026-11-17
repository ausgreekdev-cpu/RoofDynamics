import { describe, it, expect } from 'vitest'
import { nextStatus, isOverdue, certificateNo } from './tasks'

describe('operations helpers', () => {
  it('cycles task status', () => {
    expect(nextStatus('PENDING')).toBe('IN_PROGRESS')
    expect(nextStatus('IN_PROGRESS')).toBe('COMPLETED')
    expect(nextStatus('COMPLETED')).toBe('PENDING')
  })

  it('detects overdue tasks', () => {
    const now = new Date('2026-11-17T00:00:00.000Z')
    expect(isOverdue('2026-11-16T00:00:00.000Z', now)).toBe(true)
    expect(isOverdue('2026-11-18T00:00:00.000Z', now)).toBe(false)
    expect(isOverdue(undefined, now)).toBe(false)
  })

  it('generates deterministic certificate numbers', () => {
    expect(certificateNo(123)).toBe('WTY-3F')
    expect(certificateNo(123)).toBe(certificateNo(123))
  })
})
