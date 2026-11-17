import { describe, it, expect } from 'vitest'
import { isDispatchable, crewLoad, weekOf, jobsInWeek, toDispatchJob } from './dispatch'
import type { DispatchJob, CrewResource } from './types'

const crew: CrewResource = { id: 'c1', name: 'John', role: 'Lead', hasWhiteCard: true, hasHeightTicket: true }

const job: DispatchJob = {
  id: 'j1', jobNumber: 'JOB-1', status: 'SCHEDULED',
  scheduledDate: '2026-11-17T08:00:00.000Z', suburb: 'Fremantle',
  customerName: 'A', crewLeadId: 'c1', crewIds: ['c1'],
}

describe('operations dispatch', () => {
  it('gates dispatch on both certifications', () => {
    expect(isDispatchable(crew)).toBe(true)
    expect(isDispatchable({ ...crew, hasWhiteCard: false })).toBe(false)
    expect(isDispatchable({ ...crew, hasHeightTicket: false })).toBe(false)
  })

  it('counts crew load for a date', () => {
    expect(crewLoad([job], 'c1', '2026-11-17')).toBe(1)
    expect(crewLoad([job], 'c1', '2026-11-18')).toBe(0)
    expect(crewLoad([job], 'c2', '2026-11-17')).toBe(0)
  })

  it('builds a 7-day week starting Monday', () => {
    const week = weekOf(new Date('2026-11-19T12:00:00.000Z'))
    expect(week).toHaveLength(7)
    expect(week[0].getDay()).toBe(1)
  })

  it('filters jobs within a week', () => {
    const week = weekOf(new Date('2026-11-17T12:00:00.000Z'))
    expect(jobsInWeek([job], week)).toHaveLength(1)
  })

  it('maps raw API jobs into dispatch jobs with unique crew ids', () => {
    const mapped = toDispatchJob({
      id: 'j2', jobNumber: 'JOB-2', status: 'PENDING', scheduledDate: null,
      crewLeadId: 'c1',
      crewAssignmentJob: [{ crewMemberId: 'c1' }, { crewMemberId: 'c2' }],
      quote: { customerSuburb: 'Midland', customerName: 'B' },
    })
    expect(mapped.crewIds).toEqual(['c1', 'c2'])
    expect(mapped.suburb).toBe('Midland')
  })
})
