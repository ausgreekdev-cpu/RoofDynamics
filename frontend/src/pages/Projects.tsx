'use client'

import React, { useState } from 'react'
import { FeatureGate } from '../components/FeatureGate'
import { RoleGuard } from '../features/auth'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { ProjectsList, BatchImport } from '../features/projects'

export default function Projects() {
  const [tab, setTab] = useState('all')

  return (
    <FeatureGate moduleKey="CRM_QUOTING">
      <RoleGuard permission="projects:read">
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold">Projects</h1>
            <p className="text-sm text-[var(--muted-foreground)]">
              Guided project creation, full CRUD, audit trail and CSV batch imports.
            </p>
          </div>
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="all">All Projects</TabsTrigger>
              <TabsTrigger value="import">Batch Import</TabsTrigger>
            </TabsList>
            <TabsContent value="all"><ProjectsList /></TabsContent>
            <TabsContent value="import"><BatchImport /></TabsContent>
          </Tabs>
        </div>
      </RoleGuard>
    </FeatureGate>
  )
}
