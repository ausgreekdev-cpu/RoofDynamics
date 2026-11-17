'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Badge } from '../../components/ui/badge'
import { api } from '../../services/api'

interface StormEvent {
  id: string
  date: string
  suburb: string
  hailSizeMm: number
  windSpeedKmh: number
  severity: 'low' | 'moderate' | 'severe'
}

export function StormLookup() {
  const [suburb, setSuburb] = useState('Fremantle')
  const [events, setEvents] = useState<StormEvent[]>([])
  const [provider, setProvider] = useState('')
  const [loading, setLoading] = useState(false)

  const lookup = async () => {
    setLoading(true)
    try {
      const result = await api.request<{ events: StormEvent[]; provider: string }>(
        `/integrations/storm?suburb=${encodeURIComponent(suburb)}`
      )
      setEvents(result.events)
      setProvider(result.provider)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Storm / Hail Lookup</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="storm-suburb">Suburb</Label>
          <div className="flex gap-2">
            <Input id="storm-suburb" value={suburb} onChange={(e) => setSuburb(e.target.value)} />
            <Button onClick={lookup} disabled={loading}>{loading ? 'Searching...' : 'Search'}</Button>
          </div>
        </div>
        {provider && <p className="text-xs text-[var(--muted-foreground)]">Provider: {provider}</p>}
        <div className="space-y-2">
          {events.map((ev) => (
            <div key={ev.id} className="p-2 rounded border border-[var(--border)] flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{ev.suburb} · {ev.date}</p>
                <p className="text-xs text-[var(--muted-foreground)]">Hail {ev.hailSizeMm} mm · Wind {ev.windSpeedKmh} km/h</p>
              </div>
              <Badge variant={ev.severity === 'severe' ? 'destructive' : ev.severity === 'moderate' ? 'warning' : 'secondary'}>
                {ev.severity}
              </Badge>
            </div>
          ))}
          {events.length === 0 && !loading && (
            <p className="text-xs text-[var(--muted-foreground)]">No storm events recorded for this suburb.</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
