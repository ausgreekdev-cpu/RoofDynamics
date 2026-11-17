'use client'

import React, { useEffect, useState } from 'react'
import { api } from '../../services/api'
import { useToast } from '../../components/Toast'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Badge } from '../../components/ui/badge'
import { Progress } from '../../components/ui/progress'
import { TIERS, type CreditStatus, type Tier, type CheckoutSession } from './types'
import { usagePercent, quotaFor } from './quota'

export function BillingPanel() {
  const toast = useToast()
  const [credits, setCredits] = useState<CreditStatus | null>(null)
  const [checkoutTier, setCheckoutTier] = useState<Tier | null>(null)
  const [deposit, setDeposit] = useState({ amount: '', contractor: '' })

  const load = () => api.request<CreditStatus>('/billing/credits').then(setCredits).catch(() => setCredits(null))
  useEffect(() => { load() }, [])

  const checkout = async (tier: Tier) => {
    setCheckoutTier(tier)
    try {
      const session = await api.request<CheckoutSession>('/billing/checkout', {
        method: 'POST',
        body: JSON.stringify({ tier }),
      })
      toast.showToast('info', `Checkout ${session.id} — $${(session.amount / 100).toFixed(2)}`)
    } catch (err: any) {
      toast.showToast('error', err.message || 'Checkout failed')
    } finally {
      setCheckoutTier(null)
    }
  }

  const connectDeposit = async () => {
    if (!deposit.amount || !deposit.contractor) {
      toast.showToast('warning', 'Amount and contractor are required')
      return
    }
    try {
      const result = await api.request<{ transferId: string }>('/billing/connect-deposit', {
        method: 'POST',
        body: JSON.stringify({ amount: Number(deposit.amount), contractorId: deposit.contractor }),
      })
      toast.showToast('success', `Deposit ${result.transferId} created`)
      setDeposit({ amount: '', contractor: '' })
    } catch (err: any) {
      toast.showToast('error', err.message || 'Deposit failed')
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Credits & Quota</CardTitle>
            {credits && <Badge variant="secondary">{credits.provider}</Badge>}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {credits ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm">Tier: <strong>{credits.tier}</strong></span>
                <span className="text-sm">{credits.used} / {credits.quota} used</span>
              </div>
              <Progress value={usagePercent(credits.used, credits.quota)} />
              <p className="text-xs text-[var(--muted-foreground)]">{credits.remaining} credits remaining</p>
            </>
          ) : (
            <p className="text-sm text-[var(--muted-foreground)]">Unable to load credit status.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Subscription Tiers</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {TIERS.map((tier) => (
              <div key={tier} className="p-3 rounded-md border border-[var(--border)] space-y-2">
                <p className="text-sm font-bold">{tier.replace(/_/g, ' ')}</p>
                <p className="text-xs text-[var(--muted-foreground)]">{quotaFor(tier)} credits/mo</p>
                <Button size="sm" className="w-full" onClick={() => checkout(tier)} disabled={checkoutTier === tier}>
                  {checkoutTier === tier ? 'Loading...' : 'Upgrade'}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Stripe Connect Deposit</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <div className="space-y-1">
              <Label htmlFor="dep-amount">Amount (AUD)</Label>
              <Input id="dep-amount" type="number" value={deposit.amount} onChange={(e) => setDeposit({ ...deposit, amount: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="dep-contractor">Contractor ID</Label>
              <Input id="dep-contractor" value={deposit.contractor} onChange={(e) => setDeposit({ ...deposit, contractor: e.target.value })} placeholder="acct_xxx" />
            </div>
            <div className="flex items-end"><Button onClick={connectDeposit} className="w-full">Send Deposit</Button></div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
