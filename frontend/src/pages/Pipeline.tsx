'use client'

import React from 'react'
import { FeatureGate } from '../components/FeatureGate'
import { RoleGuard } from '../features/auth'
import { PipelineBoard, FinancingWidget, StormLookup } from '../features/crm'

export default function Pipeline() {
  return (
    <FeatureGate moduleKey="CRM_QUOTING">
      <RoleGuard permission="crm:manage">
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold">CRM Pipeline</h1>
            <p className="text-sm text-[var(--muted-foreground)]">
              Drag deals through stages, forecast revenue and e-sign offers.
            </p>
          </div>
          <div data-tour="pipeline-board"><PipelineBoard /></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FinancingWidget />
            <StormLookup />
          </div>
        </div>
      </RoleGuard>
    </FeatureGate>
  )
}
