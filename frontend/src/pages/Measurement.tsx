'use client'

import React from 'react'
import { FeatureGate } from '../components/FeatureGate'
import { RoleGuard } from '../features/auth'
import { VectorEditor } from '../features/measurement'

export default function Measurement() {
  return (
    <FeatureGate moduleKey="CRM_QUOTING">
      <RoleGuard permission="measurement:write">
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold">Aerial Measurement</h1>
            <p className="text-sm text-[var(--muted-foreground)]">
              Draw roof planes, calculate plan and true area with WA pitch and waste factors.
            </p>
          </div>
          <div data-tour="measurement-canvas"><VectorEditor /></div>
        </div>
      </RoleGuard>
    </FeatureGate>
  )
}
