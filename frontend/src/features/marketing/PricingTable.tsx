'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { TIERS } from '../billing/types'
import { quotaFor } from '../billing/quota'

const FEATURES: Record<string, string[]> = {
  STARTER: ['CRM & Quoting', 'Public Website', '10 credits/mo'],
  PRO_SAFETY: ['All Starter', 'WHS Safety', 'EAM Fleet', '50 credits/mo'],
  OPS_ERP: ['All Pro', 'WMS/MRP', 'HRIS & Payroll', '150 credits/mo'],
  EMPIRE_ENTERPRISE_LEASE: ['All Modules', '4 AI Agents', 'White-Label', '999 credits/mo'],
}

const PRICES: Record<string, number> = {
  STARTER: 79, PRO_SAFETY: 199, OPS_ERP: 399, EMPIRE_ENTERPRISE_LEASE: 699,
}

export function PricingTable() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {TIERS.map((tier) => (
        <Card key={tier} className={tier === 'OPS_ERP' ? 'border-[var(--primary)]' : ''}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{tier.replace(/_/g, ' ')}</CardTitle>
              {tier === 'OPS_ERP' && <Badge>Popular</Badge>}
            </div>
            <p className="text-2xl font-bold">${PRICES[tier]}<span className="text-xs text-[var(--muted-foreground)]">/mo</span></p>
          </CardHeader>
          <CardContent className="space-y-3">
            <ul className="space-y-1 text-xs text-[var(--muted-foreground)]">
              {FEATURES[tier].map((f) => <li key={f}>✓ {f}</li>)}
            </ul>
            <Button variant={tier === 'OPS_ERP' ? 'default' : 'outline'} className="w-full">Choose {tier.split('_')[0]}</Button>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
