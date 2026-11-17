/** Typed object-storage adapter: Cloudflare R2 / AWS S3 with local sandbox. */
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { env } from '../../env'

export interface StoredObject {
  key: string
  url: string
  size: number
  contentType: string
}

export interface StorageAdapter {
  readonly name: string
  readonly sandbox: boolean
  put(key: string, body: Buffer | Uint8Array, contentType: string): Promise<StoredObject>
  getUrl(key: string): Promise<string>
  delete(key: string): Promise<void>
}

/** In-memory sandbox — returns a deterministic data-URL-shaped reference. */
export class SandboxStorageAdapter implements StorageAdapter {
  readonly name = 'Local Storage (Sandbox)'
  readonly sandbox = true
  private store = new Map<string, { body: Buffer; contentType: string }>()

  async put(key: string, body: Buffer | Uint8Array, contentType: string): Promise<StoredObject> {
    const buffer = Buffer.from(body)
    this.store.set(key, { body: buffer, contentType })
    return { key, url: `sandbox://${key}`, size: buffer.length, contentType }
  }

  async getUrl(key: string): Promise<string> {
    return this.store.has(key) ? `sandbox://${key}` : ''
  }

  async delete(key: string): Promise<void> { this.store.delete(key) }
}

/** R2/S3 adapter using the AWS SDK's S3-compatible API. */
export class S3StorageAdapter implements StorageAdapter {
  readonly name = 'Cloudflare R2 / S3 (Live)'
  readonly sandbox = false
  private client: S3Client
  private bucket: string
  private publicUrl?: string

  constructor() {
    const isR2 = !!env.R2_ACCOUNT_ID
    this.client = new S3Client({
      region: isR2 ? 'auto' : (env.AWS_REGION || 'us-east-1'),
      endpoint: isR2 ? `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com` : undefined,
      credentials: isR2
        ? { accessKeyId: env.R2_ACCESS_KEY_ID || '', secretAccessKey: env.R2_SECRET_ACCESS_KEY || '' }
        : { accessKeyId: env.AWS_ACCESS_KEY_ID || '', secretAccessKey: env.AWS_SECRET_ACCESS_KEY || '' },
    })
    this.bucket = env.R2_BUCKET || ''
    this.publicUrl = env.R2_PUBLIC_URL
  }

  async put(key: string, body: Buffer | Uint8Array, contentType: string): Promise<StoredObject> {
    if (!this.bucket) throw new Error('R2_BUCKET is required')
    await this.client.send(new PutObjectCommand({
      Bucket: this.bucket, Key: key, Body: body, ContentType: contentType,
    }))
    const url = this.publicUrl ? `${this.publicUrl.replace(/\/$/, '')}/${key}` : await this.getUrl(key)
    return { key, url, size: body.length, contentType }
  }

  async getUrl(key: string): Promise<string> {
    if (this.publicUrl) return `${this.publicUrl.replace(/\/$/, '')}/${key}`
    if (!this.bucket) throw new Error('R2_BUCKET is required')
    return getSignedUrl(this.client, new GetObjectCommand({ Bucket: this.bucket, Key: key }), { expiresIn: 3600 })
  }

  async delete(key: string): Promise<void> {
    if (!this.bucket) throw new Error('R2_BUCKET is required')
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }))
  }
}

let instance: StorageAdapter | null = null

export function getStorageAdapter(): StorageAdapter {
  if (instance) return instance
  const hasR2 = !!env.R2_ACCOUNT_ID && !!env.R2_ACCESS_KEY_ID && !!env.R2_SECRET_ACCESS_KEY && !!env.R2_BUCKET
  const hasS3 = !!env.AWS_ACCESS_KEY_ID && !!env.AWS_SECRET_ACCESS_KEY
  instance = env.ENABLE_MOCK_INTEGRATIONS || (!hasR2 && !hasS3)
    ? new SandboxStorageAdapter()
    : new S3StorageAdapter()
  return instance
}
