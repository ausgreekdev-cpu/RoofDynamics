'use client'

import React, { useMemo, useState } from 'react'
import { PDFViewer, PDFDownloadLink } from '@react-pdf/renderer'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Badge } from '../../components/ui/badge'
import { ReportDocument } from './ReportDocument'
import { buildReport, reportFilename, TEMPLATES } from './templates'
import { downloadEsx } from './esx'
import { DEFAULT_BRANDING, type Branding, type MeasurementReportData, type TemplateType } from './types'

interface ReportPreviewProps {
  measurement?: MeasurementReportData
  projectName?: string
}

export function ReportPreview({ measurement, projectName = 'report' }: ReportPreviewProps) {
  const [template, setTemplate] = useState<TemplateType>('measurement')
  const [branding, setBranding] = useState<Branding>({ ...DEFAULT_BRANDING })
  const [amount, setAmount] = useState('35000')

  const report = useMemo(
    () => buildReport(template, branding, measurement, { amount: Number(amount) || 0 }),
    [template, branding, measurement, amount]
  )

  const filename = reportFilename(template, projectName)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Report Studio — Live PDF Preview</CardTitle>
          <Badge variant="secondary">@react-pdf/renderer</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {TEMPLATES.map((t) => (
            <Button
              key={t.key}
              variant={template === t.key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTemplate(t.key)}
            >
              {t.label}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 rounded-md border border-[var(--border)]">
          <div className="space-y-2">
            <Label htmlFor="co-name">Company name</Label>
            <Input id="co-name" value={branding.companyName} onChange={(e) => setBranding({ ...branding, companyName: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="co-abn">ABN</Label>
            <Input id="co-abn" value={branding.abn} onChange={(e) => setBranding({ ...branding, abn: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="co-builder">Builder registration</Label>
            <Input id="co-builder" value={branding.builderReg} onChange={(e) => setBranding({ ...branding, builderReg: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="co-colour">Primary colour</Label>
            <div className="flex items-center gap-2">
              <input
                id="co-colour"
                type="color"
                value={branding.primaryColour}
                onChange={(e) => setBranding({ ...branding, primaryColour: e.target.value })}
                className="w-12 h-9 rounded border border-[var(--border)] bg-transparent cursor-pointer"
              />
              <span className="text-xs text-[var(--muted-foreground)]">{branding.primaryColour}</span>
            </div>
          </div>
          {template === 'invoice' && (
            <div className="space-y-2">
              <Label htmlFor="inv-amount">Amount (AUD)</Label>
              <Input id="inv-amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
          )}
        </div>

        <div className="h-[520px] rounded-md border border-[var(--border)] overflow-hidden bg-white">
          <PDFViewer width="100%" height="100%" showToolbar={false}>
            <ReportDocument report={report} branding={branding} />
          </PDFViewer>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <PDFDownloadLink
            document={<ReportDocument report={report} branding={branding} />}
            fileName={filename}
            className="inline-flex items-center justify-center rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90"
          >
            {({ loading }) => (loading ? 'Preparing PDF...' : `Download ${filename}`)}
          </PDFDownloadLink>
          {template === 'measurement' && measurement && (
            <Button
              variant="outline"
              onClick={() => downloadEsx(measurement, branding, filename.replace('.pdf', '.esx'))}
            >
              Export Xactimate .ESX
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
