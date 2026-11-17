'use client'

import React from 'react'
import { FeatureGate } from '../components/FeatureGate'
import { RoleGuard } from '../features/auth'
import { BillingPanel } from '../features/billing'

export default function Billing() {
  return (
    <FeatureGate moduleKey="SAAS_SUPER_ADMIN">
      <RoleGuard permission="billing:manage">
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold">Billing & Credits</h1>
            <p className="text-sm text-[var(--muted-foreground)]">
              Subscription tiers, metered credit quotas and Stripe Connect contractor deposits.
            </p>
          </div>
          <BillingPanel />
        </div>
      </RoleGuard>
    </FeatureGate>
  )
}
