'use client'

import React, { useMemo, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Badge } from '../../components/ui/badge'
import { calculateRoi, DEFAULT_ROI, type RoiInputs } from './roi'

export function ROICalculator() {
  const [inputs, setInputs] = useState<RoiInputs>({ ...DEFAULT_ROI })
  const result = useMemo(() => calculateRoi(inputs), [inputs])
  const set = (key: keyof RoiInputs, value: number) => setInputs((p) => ({ ...p, [key]: value }))

  return (
    <Card>
      <CardHeader><CardTitle>ROI Calculator</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="roi-jobs">Jobs per year</Label>
            <Input id="roi-jobs" type="number" value={inputs.annualJobs} onChange={(e) => set('annualJobs', Number(e.target.value))} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="roi-value">Avg job value</Label>
            <Input id="roi-value" type="number" value={inputs.avgJobValue} onChange={(e) => set('avgJobValue', Number(e.target.value))} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="roi-hours">Hours saved / job</Label>
            <Input id="roi-hours" type="number" value={inputs.hoursSavedPerJob} onChange={(e) => set('hoursSavedPerJob', Number(e.target.value))} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="roi-cost">Hourly cost</Label>
            <Input id="roi-cost" type="number" value={inputs.hourlyCost} onChange={(e) => set('hourlyCost', Number(e.target.value))} />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-md border border-[var(--border)]">
          <div>
            <p className="text-xs text-[var(--muted-foreground)]">Annual saving</p>
            <p className="text-lg font-bold text-[var(--success)]">${result.annualLabourSaving.toFixed(0)}</p>
          </div>
          <div>
            <p className="text-xs text-[var(--muted-foreground)]">ROI</p>
            <p className="text-lg font-bold">{result.roiPercent.toFixed(0)}%</p>
          </div>
          <div>
            <p className="text-xs text-[var(--muted-foreground)]">Payback</p>
            <p className="text-lg font-bold">{result.paybackMonths} mo</p>
          </div>
        </div>
        <Badge variant="secondary">Based on ${result.annualRevenue.toFixed(0)} annual revenue</Badge>
      </CardContent>
    </Card>
  )
}

export { ReactMarkdown }
