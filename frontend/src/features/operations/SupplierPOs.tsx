'use client'

import React, { useEffect, useState } from 'react'
import { api } from '../../services/api'
import { useToast } from '../../components/Toast'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Badge } from '../../components/ui/badge'
import type { SupplierPO } from './types'

export function SupplierPOs() {
  const toast = useToast()
  const [pos, setPos] = useState<SupplierPO[]>([])
  const [rfqs, setRfqs] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ supplier: '', amount: '', rfqId: '' })

  const load = () => {
    api.getPurchaseOrders().then((d) => setPos(d)).catch(() => setPos([]))
    api.getRFQs().then((d) => setRfqs(d)).catch(() => setRfqs([]))
  }
  useEffect(() => { load() }, [])

  const create = async () => {
    if (!form.rfqId || !form.amount) {
      toast.showToast('warning', 'Select an RFQ and enter an amount')
      return
    }
    try {
      await api.createPurchaseOrder({
        rfqId: form.rfqId,
        poNumber: `PO-${Date.now().toString().slice(-6)}`,
        supplierName: form.supplier,
        totalAmount: Number(form.amount),
        status: 'draft',
      })
      toast.showToast('success', `PO created for ${form.supplier}`)
      setForm({ supplier: '', amount: '', rfqId: '' })
      setShowForm(false)
      load()
    } catch (err: any) {
      toast.showToast('error', err.message || 'Failed to create PO')
    }
  }

  const total = pos.reduce((s, p) => s + Number(p.totalAmount || 0), 0)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Supplier Purchase Orders</CardTitle>
          <Button size="sm" onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancel' : 'New PO'}</Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {showForm && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 p-3 rounded-md border border-[var(--border)]">
            <div className="space-y-1">
              <Label htmlFor="po-rfq">Source RFQ</Label>
              <select
                id="po-rfq"
                value={form.rfqId}
                onChange={(e) => {
                  const rfq = rfqs.find((r) => r.id === e.target.value)
                  setForm({ ...form, rfqId: e.target.value, supplier: rfq?.supplierName || '' })
                }}
                className="w-full h-9 rounded-md border border-[var(--input)] bg-[var(--background)] px-3 text-sm"
              >
                <option value="">Select an RFQ...</option>
                {rfqs.map((r) => (
                  <option key={r.id} value={r.id}>{r.title} — {r.supplierName}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="po-amount">Amount</Label>
              <Input id="po-amount" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            </div>
            <div className="flex items-end">
              <Button onClick={create} className="w-full">Create PO</Button>
            </div>
          </div>
        )}

        <p className="text-xs text-[var(--muted-foreground)]">{pos.length} orders · ${total.toFixed(2)} total</p>
        <div className="space-y-2">
          {pos.map((po) => (
            <div key={po.id} className="flex items-center justify-between p-2 rounded-md border border-[var(--border)]">
              <div>
                <p className="text-sm font-medium">{po.poNumber}</p>
                <p className="text-xs text-[var(--muted-foreground)]">{po.supplierName}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold">${Number(po.totalAmount).toLocaleString()}</p>
                <Badge variant={po.status === 'received' ? 'success' : 'secondary'}>{po.status}</Badge>
              </div>
            </div>
          ))}
          {pos.length === 0 && <p className="text-xs text-[var(--muted-foreground)]">No purchase orders yet.</p>}
        </div>
      </CardContent>
    </Card>
  )
}
