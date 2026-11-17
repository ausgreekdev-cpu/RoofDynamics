import { describe, it, expect } from 'vitest'
import { calculateRoi, DEFAULT_ROI } from './roi'
import { BLOG_POSTS } from './blog'

describe('marketing ROI', () => {
  it('computes labour savings and ROI', () => {
    const result = calculateRoi(DEFAULT_ROI)
    expect(result.annualLabourSaving).toBe(120 * 4 * 45)
    expect(result.annualSoftwareCost).toBe(199 * 12)
    expect(result.netAnnualBenefit).toBe(120 * 4 * 45 - 199 * 12)
    expect(result.roiPercent).toBeGreaterThan(0)
  })

  it('handles zero software cost', () => {
    const result = calculateRoi({ ...DEFAULT_ROI, monthlySoftwareCost: 0 })
    expect(result.roiPercent).toBe(0)
  })

  it('caps payback at zero when no net benefit', () => {
    const result = calculateRoi({ ...DEFAULT_ROI, hoursSavedPerJob: 0 })
    expect(result.netAnnualBenefit).toBeLessThan(0)
    expect(result.paybackMonths).toBe(0)
  })

  it('has three MDX-style blog posts', () => {
    expect(BLOG_POSTS).toHaveLength(3)
    expect(BLOG_POSTS.every((p) => p.content.includes('#'))).toBe(true)
  })
})
