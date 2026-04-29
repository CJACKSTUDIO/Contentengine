/**
 * Seedance video generator (fal.ai).
 *
 * Used for any beat with motion. Submits a text-to-video request,
 * polls until done, downloads the resulting MP4, uploads to
 * Cloudinary under catjack/studio/drafts/<draft_id>/<beat_index>.
 */

import { fal } from '@fal-ai/client'
import { v2 as cloudinary } from 'cloudinary'
import { env } from '../op'
import type { Generator, GeneratorInput, GeneratorOutput } from './types'
import { GeneratorError } from './types'

let _configured = false
function configure() {
  if (_configured) return
  fal.config({ credentials: env.fal() })

  const cfg = env.cloudinary()
  cloudinary.config({
    cloud_name: cfg.cloudName,
    api_key: cfg.apiKey,
    api_secret: cfg.apiSecret,
    secure: true,
  })
  _configured = true
}

interface SeedanceResult {
  video?: { url: string }
  data?: { video?: { url: string } }
}

export const seedance: Generator = {
  id: 'seedance',
  async generate(input: GeneratorInput): Promise<GeneratorOutput> {
    configure()
    const startedAt = Date.now()

    const composedPrompt = composePrompt(input)
    // fal's Seedance API expects duration as a string enum (e.g. '5', '6').
    const duration = clampDuration(input.duration_seconds ?? 5)

    let url: string | null = null
    try {
      const result = (await fal.subscribe('fal-ai/bytedance/seedance/v1/pro/text-to-video', {
        input: {
          prompt: composedPrompt,
          duration,
          aspect_ratio: '9:16',
          resolution: '1080p',
        },
        logs: false,
      })) as SeedanceResult

      url = result?.video?.url ?? result?.data?.video?.url ?? null
    } catch (err) {
      throw new GeneratorError('seedance', `fal.subscribe failed: ${(err as Error).message}`)
    }

    if (!url) {
      throw new GeneratorError('seedance', 'Seedance returned no video URL')
    }

    // Mirror to Cloudinary so we own the asset + can stitch from a CDN
    // we trust for the rest of the pipeline.
    const upload = await cloudinary.uploader.upload(url, {
      resource_type: 'video',
      folder: `catjack/studio/drafts/${input.draft_id}`,
      public_id: `beat-${String(input.beat_index).padStart(2, '0')}`,
      overwrite: true,
    })

    return {
      url: upload.secure_url,
      kind: 'video',
      generator: 'seedance',
      duration_ms: Date.now() - startedAt,
    }
  },
}

type SeedanceDurationEnum = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11' | '12'

/** Snap to the nearest supported integer second [2..12]. */
function clampDuration(seconds: number): SeedanceDurationEnum {
  const clamped = Math.max(2, Math.min(12, Math.round(seconds)))
  return String(clamped) as SeedanceDurationEnum
}

/**
 * Compose the prompt for Seedance: Director's prompt + aesthetic
 * notes + reference asset hints. Seedance text-to-video doesn't take
 * reference images yet (not in v1 of fal's API), so we describe them
 * verbally in the prompt instead.
 */
function composePrompt(input: GeneratorInput): string {
  const parts = [input.prompt]
  if (input.aesthetic_notes) parts.push(`Aesthetic: ${input.aesthetic_notes}.`)
  if (input.reference_assets.length > 0) {
    parts.push(
      `Reference: ${input.reference_assets.length} brand reference(s) for character + world consistency.`,
    )
  }
  parts.push('Vertical 9:16. No subtitles. No watermarks.')
  return parts.join(' ')
}
