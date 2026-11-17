'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Progress } from '../../components/ui/progress'
import { api } from '../../services/api'
import { useToast } from '../../components/Toast'
import { useProjects } from './useProjects'

interface BatchResponse {
  id: string
  fileName: string
  status: string
  totalRows: number
  processedRows: number
  failedRows: number
  jobId: string
  provider: string
  parseErrors?: Array<{ row: number; message: string }>
}

interface BatchDetail extends BatchResponse {
  rows: Array<{ id: string; rowNumber: number; status: string; error?: string; projectId?: string }>
}

const SAMPLE = `name,customerName,address,suburb,state,postcode,planArea,pitchDegrees,coastalZone
Fremantle Re-roof,James Wilson,12 Beach St,Fremantle,WA,6160,180,22,true
Midland Restoration,Sarah Davis,45 High St,Midland,WA,6056,150,18,false`

export function BatchImport() {
  const toast = useToast()
  const { refresh } = useProjects()
  const [csv, setCsv] = useState(SAMPLE)
  const [fileName, setFileName] = useState('projects.csv')
  const [busy, setBusy] = useState(false)
  const [batch, setBatch] = useState<BatchResponse | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!batch || batch.status === 'COMPLETED' || batch.status === 'FAILED') return
    const timer = setInterval(async () => {
      try {
        const detail = await api.request<BatchDetail>(`/projects/batch/${batch.id}`)
        setBatch((prev) => (prev ? { ...prev, ...detail } : detail))
        if (detail.status === 'COMPLETED' || detail.status === 'FAILED') {
          clearInterval(timer)
          refresh()
          toast.showToast('success', `Batch complete: ${detail.processedRows} imported, ${detail.failedRows} failed`)
        }
      } catch {
        clearInterval(timer)
      }
    }, 1200)
    return () => clearInterval(timer)
  }, [batch?.id, batch?.status])

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = () => setCsv(String(reader.result || ''))
    reader.readAsText(file)
  }

  const handleUpload = async () => {
    setBusy(true)
    try {
      const result = await api.request<BatchResponse>('/projects/batch', {
        method: 'POST',
        body: JSON.stringify({ csv, fileName }),
      })
      setBatch(result)
      toast.showToast('info', `Batch queued via ${result.provider}`)
    } catch (err: any) {
      toast.showToast('error', err.message || 'Batch upload failed')
    } finally {
      setBusy(false)
    }
  }

  const lineCount = csv.trim() ? csv.trim().split('\n').length - 1 : 0
  const progress = batch && batch.totalRows > 0
    ? Math.round((batch.processedRows / batch.totalRows) * 100)
    : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Batch Project Import</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={handleFile}
          />
          <Button variant="outline" onClick={() => fileRef.current?.click()}>Choose CSV file</Button>
          <span className="text-xs text-[var(--muted-foreground)]">{fileName}</span>
        </div>

        <textarea
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
          rows={8}
          className="w-full rounded-md border border-[var(--input)] bg-[var(--background)] px-3 py-2 font-mono text-xs"
          placeholder="name,customerName,address,suburb,..."
        />

        <div className="flex items-center justify-between">
          <span className="text-xs text-[var(--muted-foreground)]">{lineCount} data rows detected</span>
          <Button onClick={handleUpload} disabled={busy || lineCount === 0}>
            {busy ? 'Uploading...' : 'Queue Import'}
          </Button>
        </div>

        {batch && (
          <div className="space-y-2 p-3 rounded-md border border-[var(--border)]">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{batch.fileName}</span>
              <Badge variant={batch.status === 'COMPLETED' ? 'success' : batch.status === 'FAILED' ? 'destructive' : 'secondary'}>
                {batch.status}
              </Badge>
            </div>
            <Progress value={progress} />
            <p className="text-xs text-[var(--muted-foreground)]">
              {batch.processedRows}/{batch.totalRows} processed · {batch.failedRows} failed · job {batch.jobId}
            </p>
            {batch.parseErrors && batch.parseErrors.length > 0 && (
              <div className="space-y-1">
                {batch.parseErrors.slice(0, 5).map((err, i) => (
                  <p key={i} className="text-xs text-[var(--warning)]">Row {err.row}: {err.message}</p>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
