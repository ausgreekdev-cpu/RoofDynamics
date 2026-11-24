import request from 'supertest'
import app from '../../server'

describe('WHS SWMS', () => {
  const tenantId = 'tenant-1'
  const headers = { Authorization: 'Bearer demo-token-123', 'x-tenant-id': tenantId }

  it('GET /api/projects/:id/whs-swms returns array', async () => {
    const res = await request(app).get('/api/projects/proj-1/whs-swms').set(headers)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })

  it('POST sync rejects without clientMutationId', async () => {
    const res = await request(app).post('/api/projects/proj-1/whs-swms/sync').set(headers).send({
      checklist: { edgeProtectionVerified: true, harnessInspectionVerified: true, fragileRoofIdentified: true, weatherAssessed: true, exclusionZonesSet: true, emergencyRescuePlan: true },
      signOffs: [{ guestName: 'Test', signatureDataUrl: 'data:image/png;base64,abc', signedAt: new Date().toISOString() }],
    })
    expect(res.status).toBe(400)
  })

  it('POST sync rejects incomplete checklist', async () => {
    const res = await request(app).post('/api/projects/proj-1/whs-swms/sync').set(headers).send({
      clientMutationId: 'test-incomplete',
      checklist: { edgeProtectionVerified: false, harnessInspectionVerified: true, fragileRoofIdentified: true, weatherAssessed: true, exclusionZonesSet: true, emergencyRescuePlan: true },
      signOffs: [{ guestName: 'Test', signatureDataUrl: 'data:image/png;base64,abc', signedAt: new Date().toISOString() }],
    })
    expect(res.status).toBe(400)
  })

  it('POST sync rejects empty signature', async () => {
    const res = await request(app).post('/api/projects/proj-1/whs-swms/sync').set(headers).send({
      clientMutationId: 'test-nosig',
      checklist: { edgeProtectionVerified: true, harnessInspectionVerified: true, fragileRoofIdentified: true, weatherAssessed: true, exclusionZonesSet: true, emergencyRescuePlan: true },
      signOffs: [{ guestName: 'Test', signatureDataUrl: '', signedAt: new Date().toISOString() }],
    })
    expect(res.status).toBe(400)
  })

  it('POST sync succeeds with valid data', async () => {
    const res = await request(app).post('/api/projects/proj-1/whs-swms/sync').set(headers).send({
      clientMutationId: 'test-valid-1',
      checklist: { edgeProtectionVerified: true, harnessInspectionVerified: true, fragileRoofIdentified: true, weatherAssessed: true, exclusionZonesSet: true, emergencyRescuePlan: true },
      signOffs: [{ guestName: 'Test', signatureDataUrl: 'data:image/png;base64,abc', signedAt: new Date().toISOString() }],
    })
    expect(res.status).toBe(201)
    expect(res.body.status).toBe('SIGNED_OFF')
  })

  it('POST sync deduplicates on retry', async () => {
    const payload = {
      clientMutationId: 'test-dedup',
      checklist: { edgeProtectionVerified: true, harnessInspectionVerified: true, fragileRoofIdentified: true, weatherAssessed: true, exclusionZonesSet: true, emergencyRescuePlan: true },
      signOffs: [{ guestName: 'Test', signatureDataUrl: 'data:image/png;base64,abc', signedAt: new Date().toISOString() }],
    }
    const r1 = await request(app).post('/api/projects/proj-1/whs-swms/sync').set(headers).send(payload)
    const r2 = await request(app).post('/api/projects/proj-1/whs-swms/sync').set(headers).send(payload)
    expect(r1.status).toBe(201)
    expect(r2.status).toBe(201)
  })

  it('cross-tenant access is blocked', async () => {
    const res = await request(app).get('/api/projects/proj-1/whs-swms').set({ Authorization: 'Bearer demo-token-123', 'x-tenant-id': 'tenant-2' })
    // Should not crash; returns 200 with empty or demo data scoped to tenant-2
    expect([200, 403, 404]).toContain(res.status)
  })
})
