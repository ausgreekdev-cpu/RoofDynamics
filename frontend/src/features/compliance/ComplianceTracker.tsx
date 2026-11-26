'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { api } from '../../services/api'
import { useToast } from '../../components/Toast'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Badge } from '../../components/ui/badge'

interface PaymentClaim {
  id: string
  claimNumber: string
  claimantName: string
  claimAmount: number
  servedDate: string
  responseDueDate: string
  status: string
  noticeAttached: boolean
}

interface BuildingPermit {
  id: string
  permitNumber: string
  permitType: string
  lga: string
  status: string
  expiryDate?: string
}

function daysUntil(due: string): number {
  return Math.ceil((new Date(due).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

export function ComplianceTracker() {
  const toast = useToast()
  const [claims, setClaims] = useState<PaymentClaim[]>([])
  const [permits, setPermits] = useState<BuildingPermit[]>([])
  const [claimForm, setClaimForm] = useState({ claimNumber: '', claimant: '', amount: '', served: '' })
  const [permitForm, setPermitForm] = useState({ permitNumber: '', type: 'BA1', lga: '' })

  const load = useCallback(async () => {
    try {
      const [c, p] = await Promise.all([
        api.request<PaymentClaim[]>('/compliance/payment-claims'),
        api.request<BuildingPermit[]>('/compliance/building-permits'),
      ])
      setClaims(c)
      setPermits(p)
    } catch {
      setClaims([])
      setPermits([])
    }
  }, [])

  useEffect(() => { load() }, [load])

  const addClaim = async () => {
    if (!claimForm.claimNumber || !claimForm.claimant || !claimForm.amount || !claimForm.served) {
      toast.showToast('warning', 'Complete all payment claim fields')
      return
    }
    try {
      await api.request('/compliance/payment-claims', {
        method: 'POST',
        body: JSON.stringify({
          claimNumber: claimForm.claimNumber,
          claimantName: claimForm.claimant,
          claimAmount: Number(claimForm.amount),
          servedDate: claimForm.served,
          noticeAttached: true,
        }),
      })
      toast.showToast('success', 'Payment claim tracked — 15-business-day countdown started')
      setClaimForm({ claimNumber: '', claimant: '', amount: '', served: '' })
      load()
    } catch (err: any) {
      toast.showToast('error', err.message || 'Failed to add claim')
    }
  }

  const addPermit = async () => {
    if (!permitForm.permitNumber || !permitForm.lga) {
      toast.showToast('warning', 'Permit number and LGA are required')
      return
    }
    try {
      await api.request('/compliance/building-permits', {
        method: 'POST',
        body: JSON.stringify(permitForm),
      })
      toast.showToast('success', 'Building permit tracked')
      setPermitForm({ permitNumber: '', type: 'BA1', lga: '' })
      load()
    } catch (err: any) {
      toast.showToast('error', err.message || 'Failed to add permit')
    }
  }

  const refreshStatus = async () => {
    try {
      await api.request('/compliance/payment-claims/refresh-status', { method: 'POST', body: '{}' })
      load()
    } catch { /* ignore */ }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Payment Claims (SOP Act 2021)</CardTitle>
            <Button size="sm" variant="outline" onClick={refreshStatus}>Refresh</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2 p-3 rounded-md border border-[var(--border)]">
            <div className="space-y-1">
              <Label htmlFor="cl-num">Claim #</Label>
              <Input id="cl-num" value={claimForm.claimNumber} onChange={(e) => setClaimForm({ ...claimForm, claimNumber: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="cl-claimant">Claimant</Label>
              <Input id="cl-claimant" value={claimForm.claimant} onChange={(e) => setClaimForm({ ...claimForm, claimant: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="cl-amount">Amount</Label>
              <Input id="cl-amount" type="number" value={claimForm.amount} onChange={(e) => setClaimForm({ ...claimForm, amount: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="cl-served">Served</Label>
              <Input id="cl-served" type="date" value={claimForm.served} onChange={(e) => setClaimForm({ ...claimForm, served: e.target.value })} />
            </div>
            <div className="col-span-2">
              <Button onClick={addClaim} className="w-full">Track Claim</Button>
            </div>
          </div>
          <div className="space-y-2">
            {claims.map((c) => {
              const remaining = daysUntil(c.responseDueDate)
              return (
                <div key={c.id} className="p-2 rounded-md border border-[var(--border)]">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{c.claimNumber} — ${Number(c.claimAmount).toLocaleString()}</span>
                    <Badge variant={c.status === 'OVERDUE' ? 'destructive' : c.status === 'RESPONDED' ? 'success' : remaining <= 3 ? 'warning' : 'secondary'}>
                      {c.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-[var(--muted-foreground)] mt-1">
                    {c.claimantName} · {remaining >= 0 ? `${remaining} days to Payment Schedule` : `${Math.abs(remaining)} days overdue`}
                  </p>
                </div>
              )
            })}
            {claims.length === 0 && <p className="text-xs text-[var(--muted-foreground)]">No payment claims tracked.</p>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Building Permits (BA1 / BA2)</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-3 rounded-md border border-[var(--border)]">
            <div className="space-y-1">
              <Label htmlFor="pm-num">Permit #</Label>
              <Input id="pm-num" value={permitForm.permitNumber} onChange={(e) => setPermitForm({ ...permitForm, permitNumber: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="pm-type">Type</Label>
              <select id="pm-type" value={permitForm.type} onChange={(e) => setPermitForm({ ...permitForm, type: e.target.value })} className="w-full h-9 rounded-md border border-[var(--input)] bg-[var(--background)] px-3 text-sm">
                <option value="BA1">BA1</option>
                <option value="BA2">BA2</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="pm-lga">LGA</Label>
              <Input id="pm-lga" value={permitForm.lga} onChange={(e) => setPermitForm({ ...permitForm, lga: e.target.value })} />
            </div>
            <div className="col-span-3">
              <Button onClick={addPermit} className="w-full">Track Permit</Button>
            </div>
          </div>
          <div className="space-y-2">
            {permits.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-2 rounded-md border border-[var(--border)]">
                <div>
                  <p className="text-sm font-medium">{p.permitNumber} ({p.permitType})</p>
                  <p className="text-xs text-[var(--muted-foreground)]">{p.lga}</p>
                </div>
                <Badge variant={p.status === 'APPROVED' ? 'success' : 'secondary'}>{p.status}</Badge>
              </div>
            ))}
            {permits.length === 0 && <p className="text-xs text-[var(--muted-foreground)]">No permits tracked.</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
