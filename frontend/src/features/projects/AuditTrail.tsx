'use client'

import React, { useEffect, useState } from 'react'
import { Badge } from '../../components/ui/badge'
import { projectsApi } from './api'
import type { AuditEntry } from './types'

export function AuditTrail({ projectId }: { projectId: string }) {
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    projectsApi.audit(projectId)
      .then((data) => { if (active) setEntries(data) })
      .catch(() => { if (active) setEntries([]) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [projectId])

  if (loading) return <p className="text-sm text-[var(--muted-foreground)]">Loading audit trail...</p>
  if (entries.length === 0) return <p className="text-sm text-[var(--muted-foreground)]">No audit entries yet.</p>

  return (
    <div className="space-y-3">
      {entries.map((entry) => (
        <div key={entry.id} className="flex items-start gap-3 p-3 rounded-md border border-[var(--border)]">
          <Badge variant={entry.action === 'DELETE' ? 'destructive' : entry.action === 'CREATE' ? 'success' : 'secondary'}>
            {entry.action}
          </Badge>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-[var(--muted-foreground)]">
              {new Date(entry.createdAt).toLocaleString()}
            </p>
            {entry.newValues && (
              <p className="text-xs truncate mt-1">{entry.newValues}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
