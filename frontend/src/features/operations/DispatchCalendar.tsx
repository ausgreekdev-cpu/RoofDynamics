'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { api } from '../../services/api'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { crewLoad, jobsInWeek, toDispatchJob, weekOf } from './dispatch'
import type { DispatchJob } from './types'

export function DispatchCalendar() {
  const [jobs, setJobs] = useState<DispatchJob[]>([])
  const [week, setWeek] = useState(() => weekOf(new Date()))

  useEffect(() => {
    api.getJobs()
      .then((data) => setJobs(data.map(toDispatchJob)))
      .catch(() => setJobs([]))
  }, [])

  const weekJobs = useMemo(() => jobsInWeek(jobs, week), [jobs, week])
  const shiftWeek = (days: number) => {
    setWeek((prev) => prev.map((d) => {
      const next = new Date(d)
      next.setDate(d.getDate() + days)
      return next
    }))
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Crew Dispatch Calendar</CardTitle>
          <div className="flex items-center gap-2">
            <button className="text-xs text-[var(--primary)] hover:underline" onClick={() => shiftWeek(-7)}>Prev</button>
            <span className="text-xs text-[var(--muted-foreground)]">
              {week[0].toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })} – {week[6].toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
            </span>
            <button className="text-xs text-[var(--primary)] hover:underline" onClick={() => shiftWeek(7)}>Next</button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2 min-w-[700px]">
          {week.map((day) => {
            const iso = day.toISOString().slice(0, 10)
            const dayJobs = jobs.filter((j) => j.scheduledDate?.slice(0, 10) === iso)
            const isToday = iso === new Date().toISOString().slice(0, 10)
            return (
              <div key={iso} className={`min-h-[140px] p-2 rounded-md border ${isToday ? 'border-[var(--primary)] bg-[var(--primary)]/5' : 'border-[var(--border)]'}`}>
                <p className="text-[10px] uppercase text-[var(--muted-foreground)]">{day.toLocaleDateString('en-AU', { weekday: 'short' })}</p>
                <p className="text-sm font-bold mb-2">{day.getDate()}</p>
                <div className="space-y-1">
                  {dayJobs.map((j) => (
                    <div key={j.id} className="p-1.5 rounded bg-[var(--muted)] text-[10px]">
                      <p className="font-bold truncate">{j.jobNumber}</p>
                      <p className="truncate text-[var(--muted-foreground)]">{j.suburb || j.customerName}</p>
                    </div>
                  ))}
                  {dayJobs.length === 0 && <p className="text-[10px] text-[var(--muted-foreground)] text-center pt-4">—</p>}
                </div>
              </div>
            )
          })}
        </div>
        <p className="text-xs text-[var(--muted-foreground)] mt-3">{weekJobs.length} jobs scheduled this week</p>
      </CardContent>
    </Card>
  )
}
