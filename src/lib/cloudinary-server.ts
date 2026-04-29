/**
 * Catjack Studio · Cloudinary server-side helpers.
 *
 * Wraps the Cloudinary SDK's upload_stream so callers don't have to
 * deal with the callback shape. Configures the SDK lazily on first use.
 */

import { v2 as cloudinary } from 'cloudinary'
import { env } from './op'

let _configured = false
function configure(): void {
  if (_configured) return
  const cfg = env.cloudinary()
  cloudinary.config({
    cloud_name: cfg.cloudName,
    api_key: cfg.apiKey,
    api_secret: cfg.apiSecret,
    secure: true,
  })
  _configured = true
}

export interface UploadInput {
  buffer: Buffer
  folder: string
  publicId?: string
  resourceType?: 'image' | 'video' | 'auto'
  overwrite?: boolean
}

export interface UploadResult {
  public_id: string
  secure_url: string
  resource_type: 'image' | 'video' | 'raw'
  format: string
  bytes: number
  width?: number
  height?: number
  duration?: number
}

export function uploadBuffer(input: UploadInput): Promise<UploadResult> {
  configure()
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: input.folder,
        public_id: input.publicId,
        resource_type: input.resourceType ?? 'auto',
        overwrite: input.overwrite ?? true,
      },
      (err, result) => {
        if (err || !result) return reject(err ?? new Error('upload failed'))
        resolve(result as UploadResult)
      },
    )
    stream.end(input.buffer)
  })
}

export async function deleteAsset(
  publicId: string,
  resourceType: 'image' | 'video' | 'raw' = 'image',
): Promise<void> {
  configure()
  await cloudinary.uploader.destroy(publicId, { resource_type: resourceType })
}
