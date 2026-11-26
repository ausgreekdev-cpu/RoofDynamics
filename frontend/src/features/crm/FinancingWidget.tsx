'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Badge } from '../../components/ui/badge'
import { api } from '../../services/api'

interface Quote {
  provider: string
  amount: number
  termMonths: number
  apr: number
  monthlyPayment: number
  approved: boolean
}

export function FinancingWidget() {
  const [amount, setAmount] = useState('35000')
  const [term, setTerm] = useState('36')
  const [score, setScore] = useState('720')
  const [quote, setQuote] = useState<Quote | null>(null)
  const [loading, setLoading] = useState(false)

  const getQuote = async () => {
    setLoading(true)
    try {
      const result = await api.request<Quote>('/integrations/financing/quote', {
        method: 'POST',
        body: JSON.stringify({ amount: Number(amount), termMonths: Number(term), creditScore: Number(score) }),
      })
      setQuote(result)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Financing Quote</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div className="space-y-1">
            <Label htmlFor="fin-amount">Amount</Label>
            <Input id="fin-amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="fin-term">Term (mo)</Label>
            <Input id="fin-term" type="number" value={term} onChange={(e) => setTerm(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="fin-score">Credit</Label>
            <Input id="fin-score" type="number" value={score} onChange={(e) => setScore(e.target.value)} />
          </div>
        </div>
        <Button onClick={getQuote} disabled={loading}>{loading ? 'Calculating...' : 'Get Financing Quote'}</Button>
        {quote && (
          <div className="p-3 rounded-md border border-[var(--border)] space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--muted-foreground)]">{quote.provider}</span>
              <Badge variant={quote.approved ? 'success' : 'destructive'}>{quote.approved ? 'Approved' : 'Declined'}</Badge>
            </div>
            <p className="text-lg font-bold">${quote.monthlyPayment.toFixed(2)}/mo</p>
            <p className="text-xs text-[var(--muted-foreground)]">{(quote.apr * 100).toFixed(2)}% APR · {quote.termMonths} months</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
