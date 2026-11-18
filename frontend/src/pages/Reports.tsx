'use client'

import React from 'react'
import { FeatureGate } from '../components/FeatureGate'
import { RoleGuard } from '../features/auth'
import { ReportPreview } from '../features/reporting'

export default function Reports() {
  return (
    <FeatureGate moduleKey="BI_EXECUTIVE">
      <RoleGuard permission="reports:export">
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold">Report Studio</h1>
            <p className="text-sm text-[var(--muted-foreground)]">
              Live PDF preview with white-label branding templates and one-click download.
            </p>
          </div>
          <div data-tour="report-preview"><ReportPreview /></div>
        </div>
      </RoleGuard>
    </FeatureGate>
  )
}
