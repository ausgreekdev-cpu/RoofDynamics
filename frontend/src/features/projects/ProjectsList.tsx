'use client'

import React, { useState } from 'react'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Card, CardContent } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog'
import { DataTable, type Column } from '../../components/DataTable'
import { useProjects } from './useProjects'
import { AuditTrail } from './AuditTrail'
import { ProjectWizard } from './ProjectWizard'
import type { Project } from './types'

export function ProjectsList() {
  const { projects, loading, error, create, remove } = useProjects()
  const [wizardOpen, setWizardOpen] = useState(false)
  const [auditId, setAuditId] = useState<string | null>(null)

  const columns: Column<Project>[] = [
    { key: 'name', header: 'Project', render: (p) => <span className="font-medium">{p.name}</span> },
    { key: 'customerName', header: 'Customer', render: (p) => <span className="text-[var(--muted-foreground)]">{p.customerName}</span> },
    { key: 'suburb', header: 'Suburb', render: (p) => p.suburb || '—' },
    {
      key: 'planArea', header: 'Area',
      render: (p) => `${Number(p.planArea || 0)} m²`,
      sortValue: (p) => Number(p.planArea || 0),
    },
    { key: 'status', header: 'Status', render: (p) => <Badge variant={p.status === 'COMPLETED' ? 'success' : p.status === 'CANCELLED' ? 'destructive' : 'secondary'}>{p.status}</Badge> },
    {
      key: 'coastalZone', header: 'Coastal',
      render: (p) => p.coastalZone ? <Badge variant="warning">Marine</Badge> : '—',
    },
    {
      key: 'actions', header: 'Actions', sortable: false,
      render: (p) => (
        <div className="flex gap-2">
          <button className="text-xs text-[var(--primary)] hover:underline" onClick={() => setAuditId(p.id)}>Audit</button>
          <button className="text-xs text-[var(--destructive)] hover:underline" onClick={async () => { if (confirm('Delete project?')) await remove(p.id) }}>Delete</button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Projects</h2>
        <Button onClick={() => setWizardOpen(true)}>New Project</Button>
      </div>

      {error && <p className="text-sm text-[var(--destructive)]">{error}</p>}

      {wizardOpen && (
        <Dialog open onOpenChange={setWizardOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Create Project</DialogTitle></DialogHeader>
            <ProjectWizard
              onComplete={async (draft) => { await create(draft); setWizardOpen(false) }}
              onCancel={() => setWizardOpen(false)}
            />
          </DialogContent>
        </Dialog>
      )}

      {auditId && (
        <Dialog open onOpenChange={() => setAuditId(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Audit Trail</DialogTitle></DialogHeader>
            <AuditTrail projectId={auditId} />
          </DialogContent>
        </Dialog>
      )}

      {loading ? (
        <Card><CardContent className="p-6"><p className="text-sm text-[var(--muted-foreground)]">Loading projects...</p></CardContent></Card>
      ) : (
        <DataTable data={projects} columns={columns} searchFields={['name', 'customerName', 'suburb']} emptyMessage="No projects yet — create one to get started." />
      )}
    </div>
  )
}
