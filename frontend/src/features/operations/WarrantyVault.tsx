'use client'

import React, { useEffect, useState } from 'react'
import { api } from '../../services/api'
import { useToast } from '../../components/Toast'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Badge } from '../../components/ui/badge'

interface Warranty {
  id: string
  certificateNo: string
  documentType: string
  customerName: string
  projectName: string
  issuedAt: string
  expiresAt?: string
  pdfUrl?: string
}

export function WarrantyVault() {
  const toast = useToast()
  const [warranties, setWarranties] = useState<Warranty[]>([])
  const [form, setForm] = useState({ customer: '', project: '', expires: '' })

  const load = () => api.request<Warranty[]>('/operations/warranties').then(setWarranties).catch(() => setWarranties([]))
  useEffect(() => { load() }, [])

  const issue = async () => {
    if (!form.customer || !form.project) { toast.showToast('warning', 'Customer and project are required'); return }
    try {
      const created = await api.request<Warranty>('/operations/warranties', {
        method: 'POST',
        body: JSON.stringify({
          customerName: form.customer,
          projectName: form.project,
          expiresAt: form.expires || null,
        }),
      })
      toast.showToast('success', `Certificate ${created.certificateNo} issued`)
      setForm({ customer: '', project: '', expires: '' })
      load()
    } catch (err: any) {
      toast.showToast('error', err.message || 'Failed to issue warranty')
    }
  }

  return (
    <Card>
      <CardHeader><CardTitle>Warranty Vault ({warranties.length})</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 p-3 rounded-md border border-[var(--border)]">
          <div className="space-y-1">
            <Label htmlFor="w-customer">Customer</Label>
            <Input id="w-customer" value={form.customer} onChange={(e) => setForm({ ...form, customer: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="w-project">Project</Label>
            <Input id="w-project" value={form.project} onChange={(e) => setForm({ ...form, project: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="w-expires">Expires</Label>
            <Input id="w-expires" type="date" value={form.expires} onChange={(e) => setForm({ ...form, expires: e.target.value })} />
          </div>
          <div className="flex items-end"><Button onClick={issue} className="w-full">Issue Certificate</Button></div>
        </div>
        <div className="space-y-2">
          {warranties.map((w) => (
            <div key={w.id} className="flex items-center justify-between p-2 rounded-md border border-[var(--border)]">
              <div>
                <p className="text-sm font-medium">{w.certificateNo}</p>
                <p className="text-xs text-[var(--muted-foreground)]">{w.projectName} · {w.customerName}</p>
              </div>
              <Badge variant="success">{w.documentType.replace('_', ' ')}</Badge>
            </div>
          ))}
          {warranties.length === 0 && <p className="text-xs text-[var(--muted-foreground)]">No certificates issued yet.</p>}
        </div>
      </CardContent>
    </Card>
  )
}
