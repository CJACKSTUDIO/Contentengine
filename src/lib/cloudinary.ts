/**
 * Catjack Cloudinary asset library.
 * Single source of truth for image URLs so we never hard-code the same
 * mascot URL twice. All assets live under cloud `dot2wsqmd`.
 */

const CLOUD = 'dot2wsqmd'

/** Build a Cloudinary image URL with sensible defaults (auto format/quality). */
export function img(publicId: string, opts: { w?: number; h?: number; bg?: 'remove' | null } = {}): string {
  const t = ['f_auto', 'q_auto']
  if (opts.w) t.push(`w_${opts.w}`)
  if (opts.h) t.push(`h_${opts.h}`)
  if (opts.bg === 'remove') t.unshift('e_background_removal')
  return `https://res.cloudinary.com/${CLOUD}/image/upload/${t.join(',')}/${publicId}`
}

/** Build a video URL. */
export function vid(publicId: string, opts: { w?: number } = {}): string {
  const t = ['f_auto', 'q_auto']
  if (opts.w) t.push(`w_${opts.w}`)
  return `https://res.cloudinary.com/${CLOUD}/video/upload/${t.join(',')}/${publicId}.mp4`
}

/** Catjack mascot poses we know exist in the kids app. */
export const mascot = {
  happyHandsUp:    'happyhandsup_u9ju9w',
  chuffed:         'chuffed_u1ebpc',
  jumpingForJoy:   'jumpingforjoy_vmjmh9',
  oneHandWave:     'Onehandwave_mp55nc',
  pointing:        'pointing_budbm3',
  reading:         'Reading_jwae9e',
  shopping:        'Shopping_uc8yxz',
  happyConfetti:   'happyconfetti_g3piyx',
  notBothered:     'not_bothered_wfb5ki',
  sleepy:          'sleepy_t4wskb',
} as const

/** Brand wordmark / logo. */
export const logo = '103_jqdvlh'

/** Hero atmosphere — used on Dashboard hero. We layer a static brand image
 *  for the video poster + use the mascot for foreground. The actual hero
 *  video gets swapped in once the real Seedance master lands. */
export const heroPoster = 'catjack/backgrounds/auth-bg-v2'

/** Card backs / sample frames pulled from the kids app's Cloudinary. */
export const cardBack = 'back-catjack'

/* ───── Server-side upload helpers ─────
 *
 * The Studio uploads:
 *   - inspo masters (yt-dlp output) → catjack/studio/inspo/{video_id}
 *   - generated drafts (Seedance/etc.) → catjack/studio/drafts/{draft_id}/{shot}
 *   - reference assets (vault) → catjack/studio/vault/{category}/{slug}
 *
 * We sign uploads server-side using the secret API key so the browser
 * never sees the credential.
 */

import crypto from 'node:crypto'

interface UploadSignatureInput {
  folder: string
  publicId?: string
  resourceType?: 'image' | 'video' | 'auto'
}

/**
 * Build a signed upload payload. Returns everything the client needs to
 * POST a file directly to Cloudinary's upload endpoint.
 */
export function signUpload(
  input: UploadSignatureInput,
  cfg: { cloudName: string; apiKey: string; apiSecret: string },
): {
  url: string
  signature: string
  timestamp: number
  apiKey: string
  folder: string
  publicId?: string
} {
  const timestamp = Math.floor(Date.now() / 1000)
  const params: Record<string, string> = {
    folder: input.folder,
    timestamp: String(timestamp),
  }
  if (input.publicId) params.public_id = input.publicId

  const toSign = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&')

  const signature = crypto
    .createHash('sha1')
    .update(toSign + cfg.apiSecret)
    .digest('hex')

  const resourceType = input.resourceType ?? 'auto'
  return {
    url: `https://api.cloudinary.com/v1_1/${cfg.cloudName}/${resourceType}/upload`,
    signature,
    timestamp,
    apiKey: cfg.apiKey,
    folder: input.folder,
    publicId: input.publicId,
  }
}
