'use client'

import React, { useState } from 'react'
import { api } from '../../services/api'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Badge } from '../../components/ui/badge'

export function FreeReportForm() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', suburb: '', message: '' })
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('sending')
    try {
      await api.request('/public/leads', {
        method: 'POST',
        body: JSON.stringify({ ...form, source: 'Free First Report' }),
      })
      setStatus('done')
    } catch {
      setStatus('error')
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Get Your Free First Report</CardTitle>
          <Badge variant="success">Free</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {status === 'done' ? (
          <div className="p-4 rounded-md bg-[var(--success)]/10 text-[var(--success)]">
            <p className="font-bold">Request received!</p>
            <p className="text-sm mt-1">We'll be in touch within 24 hours.</p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="fr-name">Name</Label>
              <Input id="fr-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="fr-email">Email</Label>
              <Input id="fr-email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="fr-phone">Phone</Label>
                <Input id="fr-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="fr-suburb">Suburb</Label>
                <Input id="fr-suburb" value={form.suburb} onChange={(e) => setForm({ ...form, suburb: e.target.value })} />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={status === 'sending'}>
              {status === 'sending' ? 'Sending...' : 'Get Free Report'}
            </Button>
            {status === 'error' && <p className="text-xs text-[var(--destructive)]">Something went wrong. Try again.</p>}
          </form>
        )}
      </CardContent>
    </Card>
  )
}
