'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { api } from '../../services/api'
import { useToast } from '../../components/Toast'
import { Card, CardContent } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { STAGES, type Deal } from './types'
import { leadToDeal, probabilityFor, weightedForecast, wonRevenue, canTransition } from './pipeline'
import { OfferSigner } from './OfferSigner'

export function PipelineBoard() {
  const toast = useToast()
  const [deals, setDeals] = useState<Deal[]>([])
  const [signing, setSigning] = useState<Deal | null>(null)

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
    } catch (err: any) {
      setDeals((prev) => prev.map((d) => (d.id === deal.id ? { ...d, stage: previous, probability: probabilityFor(previous) } : d)))
      toast.showToast('error', err.message || 'Failed to move deal')
    }
  }

  return (
    <div className="space-y-4">
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
                    <p className="text-sm font-medium truncate">{deal.name}</p>
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
    </div>
  )
}
