'use client'

import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { Branding, ReportData } from './types'

const makeStyles = (colour: string) => StyleSheet.create({
  page: { padding: 40, fontSize: 10, color: '#0F172A' },
  header: { backgroundColor: colour, padding: 16, marginBottom: 20 },
  title: { fontSize: 22, color: '#FFFFFF', fontWeight: 'bold' },
  subtitle: { fontSize: 10, color: '#FFFFFF', marginTop: 4 },
  section: { marginBottom: 14 },
  label: { fontSize: 8, color: '#64748B', marginBottom: 2 },
  value: { fontSize: 12, fontWeight: 'bold' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  box: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 4, padding: 12, marginBottom: 10 },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, textAlign: 'center', fontSize: 8, color: '#94A3B8' },
  badge: { backgroundColor: colour, color: '#FFFFFF', padding: 6, borderRadius: 4, textAlign: 'center', marginTop: 10 },
})

export function ReportDocument({ report, branding }: { report: ReportData; branding: Branding }) {
  const s = makeStyles(branding.primaryColour)
  const m = report.measurement

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <Text style={s.title}>{branding.companyName}</Text>
          <Text style={s.subtitle}>ABN {branding.abn} · Builder Reg {branding.builderReg}</Text>
        </View>

        {report.type === 'measurement' && m && (
          <>
            <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 12 }}>Roof Measurement Report</Text>
            <View style={s.row}>
              <View><Text style={s.label}>Project</Text><Text style={s.value}>{m.projectName}</Text></View>
              <View><Text style={s.label}>Customer</Text><Text style={s.value}>{m.customerName}</Text></View>
            </View>
            <View style={s.box}>
              <View style={s.row}>
                <View><Text style={s.label}>Suburb</Text><Text style={s.value}>{m.suburb}</Text></View>
                <View><Text style={s.label}>Pitch</Text><Text style={s.value}>{m.pitchDegrees}°</Text></View>
              </View>
              <View style={s.row}>
                <View><Text style={s.label}>Plan area</Text><Text style={s.value}>{m.planArea.toFixed(1)} m²</Text></View>
                <View><Text style={s.label}>True area (+{(m.wastePercent).toFixed(0)}% waste)</Text><Text style={s.value}>{m.trueArea.toFixed(1)} m²</Text></View>
              </View>
              {m.coastalZone && <Text style={s.badge}>SEVERE MARINE ZONE — COLORBOND ULTRA REQUIRED</Text>}
            </View>
          </>
        )}

        {report.type === 'warranty' && (
          <>
            <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 12 }}>10-Year Workmanship Warranty Certificate</Text>
            <View style={s.box}>
              <Text style={s.label}>Customer</Text>
              <Text style={s.value}>{report.customerName || 'Customer'}</Text>
            </View>
            <View style={s.row}>
              <View><Text style={s.label}>Job Number</Text><Text style={s.value}>{report.jobNumber}</Text></View>
              <View><Text style={s.label}>Issued</Text><Text style={s.value}>{(report.generatedAt || '').slice(0, 10)}</Text></View>
            </View>
            <Text style={{ marginTop: 10 }}>This certificate covers defects in workmanship for 10 years from completion. Materials are covered by the manufacturer's warranty where applicable.</Text>
          </>
        )}

        {report.type === 'invoice' && (
          <>
            <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 12 }}>Tax Invoice</Text>
            <View style={s.row}>
              <View><Text style={s.label}>Customer</Text><Text style={s.value}>{report.customerName || 'Customer'}</Text></View>
              <View><Text style={s.label}>Job Number</Text><Text style={s.value}>{report.jobNumber}</Text></View>
            </View>
            <View style={s.box}>
              <Text>Total (inc GST): ${(report.amount || 0).toFixed(2)}</Text>
              <Text style={{ marginTop: 4 }}>GST included: ${((report.amount || 0) / 11).toFixed(2)}</Text>
            </View>
          </>
        )}

        <Text style={s.footer} fixed>{branding.footer}</Text>
      </Page>
    </Document>
  )
}
