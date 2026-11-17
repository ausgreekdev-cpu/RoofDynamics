'use client'

import React from 'react'
import { FeatureGate } from '../components/FeatureGate'
import { RoleGuard } from '../features/auth'
import { DispatchCalendar, SupplierPOs, SubTasks, WarrantyVault } from '../features/operations'

export default function Operations() {
  return (
    <FeatureGate moduleKey="OPERATIONS_HRIS">
      <RoleGuard permission="operations:manage">
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold">Operations Dispatch</h1>
            <p className="text-sm text-[var(--muted-foreground)]">
              Weekly crew dispatch calendar and supplier purchase orders.
            </p>
          </div>
          <DispatchCalendar />
          <SupplierPOs />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SubTasks />
            <WarrantyVault />
          </div>
        </div>
      </RoleGuard>
    </FeatureGate>
  )
}
