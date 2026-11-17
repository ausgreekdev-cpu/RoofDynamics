'use client'

import React from 'react'
import { FeatureGate } from '../components/FeatureGate'
import { RoleGuard } from '../features/auth'
import { ComplianceTracker } from '../features/compliance'

export default function Compliance() {
  return (
    <FeatureGate moduleKey="WHS_SAFETY">
      <RoleGuard permission="projects:read">
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold">WA Statutory Compliance</h1>
            <p className="text-sm text-[var(--muted-foreground)]">
              Security of Payment Act claims, 15-business-day countdowns and LGA building permits.
            </p>
          </div>
          <ComplianceTracker />
        </div>
      </RoleGuard>
    </FeatureGate>
  )
}
