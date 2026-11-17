/** Object-storage endpoints for PDFs and roof photos. */
import { Router, type Request, type Response } from 'express'
import { requirePermission } from '../auth/middleware'
import { getStorageAdapter } from '../storage/storage'

const router = Router()

// POST /api/storage/upload — base64 payload → object storage
router.post('/upload', requirePermission('projects:write'), async (req: Request, res: Response) => {
  const { key, dataUrl, contentType } = req.body || {}
  if (!key || !dataUrl) {
    res.status(400).json({ error: 'key and dataUrl are required' })
    return
  }
  try {
    const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl)
    const bytes = Buffer.from(match ? match[2] : String(dataUrl).replace(/^data:[^,]+,/, ''), 'base64')
    const result = await getStorageAdapter().put(String(key), bytes, String(contentType || match?.[1] || 'application/octet-stream'))
    res.json({ ...result, provider: getStorageAdapter().name })
  } catch (err: any) {
    res.status(502).json({ error: err.message || 'Upload failed' })
  }
})

// GET /api/storage/url?key=... — signed/public URL (query avoids slash parsing issues)
router.get('/url', async (req: Request, res: Response) => {
  const key = String(req.query.key || '')
  if (!key) { res.status(400).json({ error: 'key is required' }); return }
  try {
    const url = await getStorageAdapter().getUrl(key)
    res.json({ key, url, provider: getStorageAdapter().name })
  } catch (err: any) {
    res.status(502).json({ error: err.message || 'URL lookup failed' })
  }
})

// DELETE /api/storage?key=...
router.delete('/', requirePermission('projects:write'), async (req: Request, res: Response) => {
  const key = String(req.query.key || '')
  if (!key) { res.status(400).json({ error: 'key is required' }); return }
  try {
    await getStorageAdapter().delete(key)
    res.json({ success: true })
  } catch (err: any) {
    res.status(502).json({ error: err.message || 'Delete failed' })
  }
})

export default router
