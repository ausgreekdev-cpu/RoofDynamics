'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../services/api'
import { useToast } from '../../components/Toast'
import { Card, CardContent } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog'
import { Input } from '../../components/ui/input'
import { STAGES, type Deal } from './types'
import { LeadSchema } from '../../schemas'
import { leadToDeal, probabilityFor, weightedForecast, wonRevenue, canTransition } from './pipeline'
import { OfferSigner } from './OfferSigner'

export function PipelineBoard() {
  const toast = useToast()
  const navigate = useNavigate()
  const [deals, setDeals] = useState<Deal[]>([])
  const [signing, setSigning] = useState<Deal | null>(null)
  const [newLeadOpen, setNewLeadOpen] = useState(false)
  const [newLead, setNewLead] = useState({ firstName: '', lastName: '', email: '', phone: '', suburb: '', estimatedValue: '' })

  useEffect(() => {
    api.getLeads()
      .then((leads) => setDeals(leads.map(leadToDeal)))
      .catch(() => setDeals([]))
  }, [])

  const forecast = useMemo(() => weightedForecast(deals), [deals])
  const won = useMemo(() => wonRevenue(deals), [deals])

  const move = async (deal: Deal, stage: Deal['stage']) => {
    if (!canTransition(deal.stage, stage)) {
      toast.showToast('warning', `Cannot move from ${deal.stage} to ${stage}`)
      return
    }
    const previous = deal.stage
    setDeals((prev) => prev.map((d) => (d.id === deal.id ? { ...d, stage, probability: probabilityFor(stage) } : d)))
    try {
      await api.updateLead(deal.id, { status: stage })
      toast.showToast('success', `${deal.name} moved to ${stage}`)
    } catch (err: unknown) {
      setDeals((prev) => prev.map((d) => (d.id === deal.id ? { ...d, stage: previous, probability: probabilityFor(previous) } : d)))
      toast.showToast('error', (err as Error)?.message || 'Failed to move deal')
    }
  }

  const createLead = async () => {
    const parsed = LeadSchema.safeParse(newLead)
    if (!parsed.success) {
      toast.showToast('error', parsed.error.issues[0]?.message || 'Invalid lead')
      return
    }
    try {
      const lead = await api.createLead({ ...parsed.data, status: 'NEW', source: 'manual', estimatedValue: Number(newLead.estimatedValue) || 0 })
      setDeals((prev) => [...prev, leadToDeal(lead as any)])
      setNewLeadOpen(false)
      setNewLead({ firstName: '', lastName: '', email: '', phone: '', suburb: '', estimatedValue: '' })
      toast.showToast('success', 'Lead created')
    } catch (err: unknown) {
      toast.showToast('error', (err as Error)?.message || 'Failed to create lead')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setNewLeadOpen(true)}>+ New Lead</Button>
      </div>
      <div className="grid grid-cols-2 gap-3 max-w-md">
        <Card><CardContent className="p-4">
          <p className="text-xs text-[var(--muted-foreground)]">Weighted forecast</p>
          <p className="text-lg font-bold">${forecast.toFixed(0)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-[var(--muted-foreground)]">Won revenue</p>
          <p className="text-lg font-bold text-[var(--success)]">${won.toFixed(0)}</p>
        </CardContent></Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {STAGES.map((stage) => {
          const stageDeals = deals.filter((d) => d.stage === stage)
          return (
            <div
              key={stage}
              className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-3 min-h-[200px]"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                const id = e.dataTransfer.getData('text/plain')
                const deal = deals.find((d) => d.id === id)
                if (deal) move(deal, stage)
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase text-[var(--muted-foreground)]">{stage}</span>
                <Badge variant="secondary">{stageDeals.length}</Badge>
              </div>
              <div className="space-y-2">
                {stageDeals.map((deal) => (
                  <div
                    key={deal.id}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData('text/plain', deal.id)}
                    className="p-2 rounded border border-[var(--border)] bg-[var(--background)] cursor-grab"
                  >
                    <a href={`/profile/lead/${deal.id}`} onClick={(e) => { e.preventDefault(); navigate(`/profile/lead/${deal.id}`) }} className="text-sm font-medium truncate text-[#0EA5E9] hover:underline">{deal.name}</a>
                    <p className="text-xs text-[var(--muted-foreground)]">{deal.suburb}</p>
                    <p className="text-xs font-bold mt-1">${deal.estimatedValue.toLocaleString()}</p>
                    {stage === 'NEGOTIATION' && (
                      <Button size="sm" variant="outline" className="mt-2 w-full" onClick={() => setSigning(deal)}>
                        E-Sign Offer
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {signing && (
        <OfferSigner
          deal={signing}
          onSigned={() => { move(signing, 'WON'); setSigning(null) }}
          onCancel={() => setSigning(null)}
        />
      )}

      <Dialog open={newLeadOpen} onOpenChange={setNewLeadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Lead</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="First name" value={newLead.firstName} onChange={(e) => setNewLead({ ...newLead, firstName: e.target.value })} />
              <Input placeholder="Last name" value={newLead.lastName} onChange={(e) => setNewLead({ ...newLead, lastName: e.target.value })} />
            </div>
            <Input type="email" placeholder="Email" value={newLead.email} onChange={(e) => setNewLead({ ...newLead, email: e.target.value })} />
            <Input placeholder="Phone" value={newLead.phone} onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })} />
            <Input placeholder="Suburb" value={newLead.suburb} onChange={(e) => setNewLead({ ...newLead, suburb: e.target.value })} />
            <Input type="number" placeholder="Estimated value" value={newLead.estimatedValue} onChange={(e) => setNewLead({ ...newLead, estimatedValue: e.target.value })} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewLeadOpen(false)}>Cancel</Button>
            <Button onClick={createLead}>Create Lead</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
