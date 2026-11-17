'use client'

import React, { useState } from 'react'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Progress } from '../../components/ui/progress'
import { Badge } from '../../components/ui/badge'
import { Checkbox } from '../../components/ui/checkbox'
import { EMPTY_DRAFT, PROJECT_STATUSES, type ProjectDraft } from './types'
import { isCoastalSuburb } from '../../utils/roofBomCalculator'

interface ProjectWizardProps {
  onComplete: (draft: ProjectDraft) => Promise<void>
  onCancel?: () => void
}

const STEPS = ['Project', 'Site', 'Measurement', 'Review'] as const

export function ProjectWizard({ onComplete, onCancel }: ProjectWizardProps) {
  const [step, setStep] = useState(0)
  const [draft, setDraft] = useState<ProjectDraft>({ ...EMPTY_DRAFT })
  const [saving, setSaving] = useState(false)

  const set = <K extends keyof ProjectDraft>(key: K, value: ProjectDraft[K]) =>
    setDraft((prev) => ({ ...prev, [key]: value }))

  const coastal = isCoastalSuburb(draft.suburb) || draft.coastalZone
  const canAdvance =
    step === 0 ? !!draft.name.trim() && !!draft.customerName.trim()
      : step === 1 ? !!draft.suburb.trim()
        : true

  const handleNext = () => {
    if (step < STEPS.length - 1) setStep((s) => s + 1)
  }

  const handleFinish = async () => {
    setSaving(true)
    try {
      await onComplete({ ...draft, coastalZone: coastal })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>New Project — Step {step + 1} of {STEPS.length}</CardTitle>
        <Progress value={((step + 1) / STEPS.length) * 100} className="mt-2" />
        <div className="flex gap-2 pt-2">
          {STEPS.map((label, i) => (
            <Badge key={label} variant={i === step ? 'default' : i < step ? 'success' : 'outline'}>
              {label}
            </Badge>
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {step === 0 && (
          <>
            <div className="space-y-2">
              <Label htmlFor="p-name">Project name</Label>
              <Input id="p-name" value={draft.name} onChange={(e) => set('name', e.target.value)} placeholder="Fremantle Re-roof" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-customer">Customer name</Label>
              <Input id="p-customer" value={draft.customerName} onChange={(e) => set('customerName', e.target.value)} placeholder="James Wilson" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-email">Customer email</Label>
              <Input id="p-email" type="email" value={draft.customerEmail} onChange={(e) => set('customerEmail', e.target.value)} placeholder="james@example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-status">Status</Label>
              <select
                id="p-status"
                value={draft.status}
                onChange={(e) => set('status', e.target.value)}
                className="w-full h-9 rounded-md border border-[var(--input)] bg-[var(--background)] px-3 text-sm"
              >
                {PROJECT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <div className="space-y-2">
              <Label htmlFor="p-address">Address</Label>
              <Input id="p-address" value={draft.address} onChange={(e) => set('address', e.target.value)} placeholder="12 Beach St" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="p-suburb">Suburb</Label>
                <Input id="p-suburb" value={draft.suburb} onChange={(e) => set('suburb', e.target.value)} placeholder="Fremantle" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-postcode">Postcode</Label>
                <Input id="p-postcode" value={draft.postcode} onChange={(e) => set('postcode', e.target.value)} placeholder="6160" />
              </div>
            </div>
            {coastal && (
              <div className="p-3 rounded-lg bg-[var(--warning)]/10 border border-[var(--warning)]/30 text-sm text-[var(--warning)]">
                ⚠ Coastal zone detected — Colorbond Ultra + Stainless 316 fasteners required.
              </div>
            )}
            <div className="flex items-center gap-2">
              <Checkbox id="p-coastal" checked={draft.coastalZone} onCheckedChange={(v) => set('coastalZone', v === true)} />
              <Label htmlFor="p-coastal">Override: mark as coastal zone</Label>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="p-area">Plan area (m²)</Label>
                <Input id="p-area" type="number" value={draft.planArea} onChange={(e) => set('planArea', Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-pitch">Roof pitch (°)</Label>
                <Input id="p-pitch" type="number" value={draft.pitchDegrees} onChange={(e) => set('pitchDegrees', Number(e.target.value))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-notes">Notes</Label>
              <textarea
                id="p-notes"
                value={draft.notes}
                onChange={(e) => set('notes', e.target.value)}
                rows={4}
                className="w-full rounded-md border border-[var(--input)] bg-[var(--background)] px-3 py-2 text-sm"
              />
            </div>
          </>
        )}

        {step === 3 && (
          <div className="space-y-2 text-sm">
            <p><strong>Project:</strong> {draft.name}</p>
            <p><strong>Customer:</strong> {draft.customerName}</p>
            <p><strong>Site:</strong> {draft.address}, {draft.suburb} {draft.postcode}</p>
            <p><strong>Area:</strong> {draft.planArea} m² @ {draft.pitchDegrees}°</p>
            <p><strong>Coastal:</strong> {coastal ? 'Yes' : 'No'}</p>
          </div>
        )}

        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={() => (step === 0 ? onCancel?.() : setStep((s) => s - 1))}>
            {step === 0 ? 'Cancel' : 'Back'}
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={handleNext} disabled={!canAdvance}>Next</Button>
          ) : (
            <Button onClick={handleFinish} disabled={saving}>{saving ? 'Creating...' : 'Create Project'}</Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
