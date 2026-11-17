'use client'

import React, { useMemo, useState } from 'react'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { getMapAdapter } from './adapters'
import { planAreaSqm, trueAreaSqm, type LonLat } from './area'
import { Roof3DViewer } from './Roof3DViewer'
import type { RoofPolygon } from './types'

const VIEW_W = 600
const VIEW_H = 400

export function VectorEditor() {
  const adapter = getMapAdapter()
  const [draft, setDraft] = useState<LonLat[]>([])
  const [polygons, setPolygons] = useState<RoofPolygon[]>([])
  const [pitch, setPitch] = useState(22)
  const [roofType, setRoofType] = useState<'gable' | 'hip_valley'>('gable')

  const toSvg = (p: LonLat) => ({
    x: ((p.lon - 115.8575) / 0.00005) + 300,
    y: ((-(p.lat + 31.9523)) / 0.00005) + 200,
  })

  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * VIEW_W
    const y = ((e.clientY - rect.top) / rect.height) * VIEW_H
    setDraft((prev) => [...prev, adapter.fromPixel(x, y)])
  }

  const closePolygon = () => {
    if (draft.length < 3) return
    const polygon: RoofPolygon = {
      id: `poly-${Date.now()}`,
      label: `Roof plane ${polygons.length + 1}`,
      vertices: draft,
      pitchDegrees: pitch,
      planAreaSqm: planAreaSqm(draft),
      trueAreaSqm: trueAreaSqm(draft, pitch, roofType),
    }
    setPolygons((prev) => [...prev, polygon])
    setDraft([])
  }

  const totals = useMemo(() => ({
    plan: polygons.reduce((s, p) => s + p.planAreaSqm, 0),
    true: polygons.reduce((s, p) => s + p.trueAreaSqm, 0),
  }), [polygons])

  const pointsString = (pts: LonLat[]) => pts.map((p) => {
    const { x, y } = toSvg(p)
    return `${x},${y}`
  }).join(' ')

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Aerial Roof Measurement</CardTitle>
          <Badge variant={adapter.hasToken ? 'default' : 'secondary'}>
            {adapter.name === 'mapbox' ? 'Mapbox GL' : 'Sandbox Editor'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="pitch">Roof pitch (°)</Label>
            <Input id="pitch" type="number" value={pitch} onChange={(e) => setPitch(Number(e.target.value))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="roofType">Roof type</Label>
            <select
              id="roofType"
              value={roofType}
              onChange={(e) => setRoofType(e.target.value as 'gable' | 'hip_valley')}
              className="w-full h-9 rounded-md border border-[var(--input)] bg-[var(--background)] px-3 text-sm"
            >
              <option value="gable">Gable</option>
              <option value="hip_valley">Hip / Valley</option>
            </select>
          </div>
        </div>

        <svg
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          className="w-full rounded-md border border-[var(--border)] bg-[#0A192F] cursor-crosshair"
          onClick={handleClick}
          role="img"
          aria-label="Roof measurement canvas"
        >
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1E293B" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width={VIEW_W} height={VIEW_H} fill="url(#grid)" />
          {polygons.map((p) => (
            <g key={p.id}>
              <polygon points={pointsString(p.vertices)} fill="#0EA5E9" fillOpacity={0.25} stroke="#0EA5E9" strokeWidth={2} />
            </g>
          ))}
          {draft.length > 0 && (
            <>
              <polyline points={pointsString(draft)} fill="none" stroke="#10B981" strokeWidth={2} />
              {draft.map((p, i) => {
                const { x, y } = toSvg(p)
                return <circle key={i} cx={x} cy={y} r={4} fill="#10B981" />
              })}
            </>
          )}
        </svg>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={closePolygon} disabled={draft.length < 3}>Close polygon</Button>
          <Button variant="ghost" onClick={() => setDraft([])} disabled={draft.length === 0}>Undo draft</Button>
          <span className="text-xs text-[var(--muted-foreground)]">{draft.length} vertices in draft</span>
        </div>

        <div className="grid grid-cols-2 gap-3 p-3 rounded-md border border-[var(--border)]">
          <div>
            <p className="text-xs text-[var(--muted-foreground)]">Total plan area</p>
            <p className="text-lg font-bold">{totals.plan.toFixed(1)} m²</p>
          </div>
          <div>
            <p className="text-xs text-[var(--muted-foreground)]">Total true area</p>
            <p className="text-lg font-bold text-[var(--primary)]">{totals.true.toFixed(1)} m²</p>
          </div>
        </div>

        {polygons.length > 0 && (
          <div className="space-y-2">
            {polygons.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-2 rounded border border-[var(--border)] text-sm">
                <span>{p.label}</span>
                <span className="text-[var(--muted-foreground)]">{p.planAreaSqm.toFixed(1)} m² → {p.trueAreaSqm.toFixed(1)} m²</span>
              </div>
            ))}
          </div>
        )}

        {polygons.length > 0 && (
          <Roof3DViewer
            vertices={polygons[0].vertices}
            pitchDegrees={pitch}
            onPitchChange={setPitch}
          />
        )}
      </CardContent>
    </Card>
  )
}
