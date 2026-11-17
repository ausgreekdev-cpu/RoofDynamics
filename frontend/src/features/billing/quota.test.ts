import { describe, it, expect } from 'vitest'
import { quotaFor, usagePercent, canConsume } from './quota'

describe('billing quota', () => {
  it('maps tier quotas', () => {
    expect(quotaFor('STARTER')).toBe(10)
    expect(quotaFor('EMPIRE_ENTERPRISE_LEASE')).toBe(999)
    expect(quotaFor('UNKNOWN')).toBe(10)
  })

  it('computes usage percent with cap', () => {
    expect(usagePercent(5, 10)).toBe(50)
    expect(usagePercent(20, 10)).toBe(100)
    expect(usagePercent(1, 0)).toBe(100)
  })

  it('checks consumption', () => {
    expect(canConsume(9, 10)).toBe(true)
    expect(canConsume(10, 10)).toBe(false)
  })
})
