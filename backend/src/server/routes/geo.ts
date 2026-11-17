/** Geospatial lookup endpoints using the cache layer. */
import { Router, type Request, type Response } from 'express'
import { requirePermission } from '../auth/middleware'
import { cacheGeo, getCachedGeo, isCoastal, haversineMeters } from '../cache'
import { PERTH_COASTAL_POINTS } from '../db/geo'

const router = Router()

// POST /api/geo/coastal — cached coastal-zone check for a point
router.post('/coastal', requirePermission('projects:read'), async (req: Request, res: Response) => {
  const { lon, lat } = req.body || {}
  if (!Number.isFinite(Number(lon)) || !Number.isFinite(Number(lat))) {
    res.status(400).json({ error: 'lon and lat are required' })
    return
  }
  const point = { lon: Number(lon), lat: Number(lat) }
  const cached = await getCachedGeo<boolean>('coastal', point)
  if (cached) {
    res.json({ ...cached, provider: 'cache' })
    return
  }
  const result = await cacheGeo('coastal', point, isCoastal(point))
  res.json({ ...result, provider: 'compute' })
})

// GET /api/geo/coastal-points — reference points (for map overlays)
router.get('/coastal-points', async (_req: Request, res: Response) => {
  res.json(PERTH_COASTAL_POINTS)
})

// GET /api/geo/distance?fromLon&fromLat&toLon&toLat
router.get('/distance', async (req: Request, res: Response) => {
  const a = { lon: Number(req.query.fromLon), lat: Number(req.query.fromLat) }
  const b = { lon: Number(req.query.toLon), lat: Number(req.query.toLat) }
  if (!Number.isFinite(a.lon) || !Number.isFinite(a.lat) || !Number.isFinite(b.lon) || !Number.isFinite(b.lat)) {
    res.status(400).json({ error: 'Valid coordinates required' })
    return
  }
  res.json({ meters: Math.round(haversineMeters(a, b)) })
})

export default router
