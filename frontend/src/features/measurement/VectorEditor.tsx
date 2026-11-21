'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { getMapAdapter } from './adapters'
import { planAreaSqm, trueAreaSqm, type LonLat } from './area'
import { Roof3DViewer } from './Roof3DViewer'
import { calculateRoofBOM } from '../../utils/roofBomCalculator'
import { buildKml, downloadKml } from './kml'
import { isCoastalPolygon } from './area'
import { capturePhoto as captureNativePhoto } from '../../services/nativeCamera'
import { getCurrentPosition } from '../../services/nativeGeo'
import { haptic, hapticNotification } from '../../services/nativeHaptics'
import { isNative } from '../../services/nativeBridge'
import type { RoofPolygon } from './types'

const VIEW_W = 600
const VIEW_H = 400
const STORAGE_KEY = 'rd_measurement_session'

interface SessionState {
  siteLocation: LonLat | null
  polygons: RoofPolygon[]
  pitch: number
  roofType: 'gable' | 'hip_valley'
  photos: string[]
}

function loadSession(): SessionState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as SessionState
  } catch {
    // ignore corrupt state
  }
  return null
}

export function VectorEditor() {
  const adapter = getMapAdapter()
  const initial = loadSession()
  const [draft, setDraft] = useState<LonLat[]>([])
  const [polygons, setPolygons] = useState<RoofPolygon[]>(initial?.polygons ?? [])
  const [pitch, setPitch] = useState(initial?.pitch ?? 22)
  const [roofType, setRoofType] = useState<'gable' | 'hip_valley'>(initial?.roofType ?? 'gable')
  const [siteLocation, setSiteLocation] = useState<LonLat | null>(initial?.siteLocation ?? null)
  const [photos, setPhotos] = useState<string[]>(initial?.photos ?? [])
  const [gpsStatus, setGpsStatus] = useState<string | null>(null)
  const [capturing, setCapturing] = useState(false)

  // Persist to localStorage (offline-first) whenever state changes.
  useEffect(() => {
    const state: SessionState = { siteLocation, polygons, pitch, roofType, photos }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // ignore quota errors
    }
  }, [siteLocation, polygons, pitch, roofType, photos])

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

  const closePolygon = useCallback(() => {
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
    void haptic('medium')
  }, [draft, pitch, polygons.length, roofType])

  const undoLastVertex = () => {
    setDraft((prev) => (prev.length ? prev.slice(0, -1) : prev))
    void haptic('light')
  }

  const deletePolygon = (id: string) => {
    setPolygons((prev) => prev.filter((p) => p.id !== id))
    void haptic('light')
  }

  const clearAll = () => {
    if (!confirm('Clear all measured planes, photos and site location?')) return
    setDraft([])
    setPolygons([])
    setPhotos([])
    setSiteLocation(null)
    void hapticNotification('warning')
  }

  const totals = useMemo(() => ({
    plan: polygons.reduce((s, p) => s + p.planAreaSqm, 0),
    true: polygons.reduce((s, p) => s + p.trueAreaSqm, 0),
  }), [polygons])

  const bom = useMemo(() => {
    if (totals.true <= 0) return null
    return calculateRoofBOM({
      planArea: totals.plan,
      pitchDegrees: pitch,
      wastePercentage: roofType === 'hip_valley' ? 0.12 : 0.07,
      roofType,
      suburb: undefined,
    })
  }, [totals.plan, totals.true, pitch, roofType])

  const captureGps = async () => {
    setGpsStatus('Locating…')
    const result = await getCurrentPosition()
    if (!result.ok) {
      setGpsStatus(result.error)
      await hapticNotification('warning')
      return
    }
    const pos = result.position
    setSiteLocation({ lon: pos.longitude, lat: pos.latitude })
    setGpsStatus(`GPS ${pos.latitude.toFixed(5)}, ${pos.longitude.toFixed(5)} (±${Math.round(pos.accuracy)}m)`)
    await hapticNotification('success')
  }

  const capturePhoto = async () => {
    setCapturing(true)
    try {
      const photo = await captureNativePhoto()
      if (!photo) {
        await hapticNotification('warning')
        return
      }
      setPhotos((prev) => [...prev, photo.dataUrl])
      await hapticNotification('success')
    } finally {
      setCapturing(false)
    }
  }

  const exportJson = () => {
    const payload = {
      siteLocation,
      pitch,
      roofType,
      polygons,
      totals,
      photos: photos.length,
      exportedAt: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `roof-measurement-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
    void hapticNotification('success')
  }

  const exportKml = () => {
    const kml = buildKml({ polygons, siteLocation, pitch, roofType })
    downloadKml(kml)
    void hapticNotification('success')
  }

  const pointsString = (pts: LonLat[]) => pts.map((p) => {
    const { x, y } = toSvg(p)
    return `${x},${y}`
  }).join(' ')

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle>Aerial Roof Measurement</CardTitle>
          <Badge variant={adapter.hasToken ? 'default' : 'secondary'}>
            {adapter.name === 'mapbox' ? 'Mapbox GL' : 'Sandbox Editor'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Site location */}
        <div className="flex flex-wrap items-center gap-2 p-2 rounded-md border border-[var(--border)] bg-[#0A192F]/40">
          <span className="text-xs text-[var(--muted-foreground)]">Site location:</span>
          {siteLocation ? (
            <span className="text-xs font-mono text-[#10B981]">
              {siteLocation.lat.toFixed(5)}, {siteLocation.lon.toFixed(5)}
            </span>
          ) : (
            <span className="text-xs text-[#64748B]">Not captured</span>
          )}
          <Button size="sm" variant="outline" onClick={captureGps}>
            📍 {isNative() ? 'Use GPS' : 'Capture location'}
          </Button>
          {gpsStatus && <span className="text-[10px] text-[#94A3B8]">{gpsStatus}</span>}
        </div>

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
              {isCoastalPolygon(p.vertices) && (
                <text x={toSvg(p.vertices[0]).x} y={toSvg(p.vertices[0]).y - 8} fontSize="11" fill="#FCA5A5">Coastal</text>
              )}
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

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={closePolygon} disabled={draft.length < 3}>Close polygon</Button>
          <Button variant="ghost" onClick={undoLastVertex} disabled={draft.length === 0}>Undo point</Button>
          <Button variant="ghost" onClick={() => setDraft([])} disabled={draft.length === 0}>Clear draft</Button>
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
              <div key={p.id} className="flex items-center justify-between p-2 rounded border border-[var(--border)] text-sm gap-2">
                <div className="min-w-0">
                  <div className="font-medium truncate">{p.label}</div>
                  <div className="text-xs text-[var(--muted-foreground)]">
                    {p.planAreaSqm.toFixed(1)} m² → {p.trueAreaSqm.toFixed(1)} m²
                    {isCoastalPolygon(p.vertices) && <span className="ml-2 text-[#FCA5A5]">· Coastal zone</span>}
                  </div>
                </div>
                <Button size="sm" variant="ghost" onClick={() => deletePolygon(p.id)}>Delete</Button>
              </div>
            ))}
          </div>
        )}

        {/* Roof photos */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold">Roof photos ({photos.length})</span>
            <Button size="sm" variant="outline" onClick={capturePhoto} disabled={capturing}>
              {capturing ? 'Capturing…' : (isNative() ? '📷 Take photo' : '📷 Capture')}
            </Button>
          </div>
          {photos.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {photos.map((p, i) => (
                <img key={i} src={p} alt={`roof-${i}`} className="w-full h-20 object-cover rounded border border-[var(--border)]" />
              ))}
            </div>
          )}
        </div>

        {/* BOM summary */}
        {bom && (
          <div className="space-y-2 p-3 rounded-md border border-[var(--border)] bg-[#0A192F]/40">
            <p className="text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wide">BOM estimate (from measurement)</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>Sheets (Custom Orb)</div><div className="text-right font-bold">{bom.sheets}</div>
              <div>Battens (stock lengths)</div><div className="text-right font-bold">{bom.battenStockLengths}</div>
              <div>Insulation rolls</div><div className="text-right font-bold">{bom.insulationRolls}</div>
              <div>Fasteners</div><div className="text-right font-bold">{bom.fasteners}</div>
              {bom.coastalSuburb && <div className="col-span-2 text-xs text-[#FCA5A5]">Coastal corrosion upgrade (AS/NZS 2728) applies</div>}
              {bom.bushfireProne && <div className="col-span-2 text-xs text-[#FCA5A5]">BAL-{bom.balRating} bushfire items required</div>}
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={exportJson} disabled={polygons.length === 0}>Export JSON</Button>
          <Button variant="outline" onClick={exportKml} disabled={polygons.length === 0}>Export to Google Earth (KML)</Button>
          <Button variant="ghost" onClick={clearAll} disabled={polygons.length === 0 && photos.length === 0 && !siteLocation}>Clear all</Button>
        </div>

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
