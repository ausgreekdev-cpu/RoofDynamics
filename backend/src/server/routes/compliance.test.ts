import { addBusinessDays } from './compliance'

describe('addBusinessDays — SOP Act 2021 (WA)', () => {
  it('adds 15 business days skipping weekends', () => {
    // Friday 2026-11-20 + 15 business days = Friday 2026-12-11
    const result = addBusinessDays(new Date('2026-11-20T00:00:00.000Z'), 15)
    expect(result.toISOString().slice(0, 10)).toBe('2026-12-11')
  })

  it('skips Saturday and Sunday starts', () => {
    // Saturday 2026-11-21 + 1 business day = Monday 2026-11-23
    const result = addBusinessDays(new Date('2026-11-21T00:00:00.000Z'), 1)
    expect(result.toISOString().slice(0, 10)).toBe('2026-11-23')
  })

  it('handles zero days', () => {
    const result = addBusinessDays(new Date('2026-11-17T00:00:00.000Z'), 0)
    expect(result.toISOString().slice(0, 10)).toBe('2026-11-17')
  })
})
