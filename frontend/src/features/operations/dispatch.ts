/** Pure dispatch helpers — certification gating and crew load. */
import type { CrewResource, DispatchJob } from './types'

/** Crew member is dispatchable only with both White Card and Working-at-Heights. */
export function isDispatchable(crew: CrewResource): boolean {
  return crew.hasWhiteCard && crew.hasHeightTicket
}

/** Count jobs assigned to a crew member on a given date. */
export function crewLoad(jobs: DispatchJob[], crewId: string, date: string): number {
  return jobs.filter((j) => j.scheduledDate?.slice(0, 10) === date && j.crewIds.includes(crewId)).length
}

/** Build a Mon–Sun week starting from the Monday of the given date. */
export function weekOf(date: Date): Date[] {
  const monday = new Date(date)
  monday.setDate(date.getDate() - ((date.getDay() + 6) % 7))
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

/** Jobs scheduled within a week (by ISO date string). */
export function jobsInWeek(jobs: DispatchJob[], week: Date[]): DispatchJob[] {
  const days = week.map((d) => d.toISOString().slice(0, 10))
  return jobs.filter((j) => j.scheduledDate && days.includes(j.scheduledDate.slice(0, 10)))
}

/** Map raw API job + assignments into a DispatchJob (tolerant of missing data). */
export function toDispatchJob(raw: any): DispatchJob {
  return {
    id: raw.id,
    jobNumber: raw.jobNumber,
    status: raw.status,
    scheduledDate: raw.scheduledDate,
    suburb: raw.quote?.customerSuburb,
    customerName: raw.quote?.customerName,
    crewLeadId: raw.crewLeadId,
    crewIds: [
      ...(raw.crewLeadId ? [raw.crewLeadId] : []),
      ...(raw.crewAssignmentJob || []).map((a: any) => a.crewMemberId),
    ].filter((v, i, arr) => arr.indexOf(v) === i),
  }
}
