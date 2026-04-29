/**
 * OpenAI gpt-image-2 generator.
 *
 * Used for hero stills with on-screen text — gpt-image-2 renders
 * legible text and crisp UI overlays in a way Seedance still
 * struggles with. Output is a PNG; the stitch step turns each PNG
 * into a 2-3 second video segment.
 */

import OpenAI from 'openai'
import { v2 as cloudinary } from 'cloudinary'
import { env } from '../op'
import type { Generator, GeneratorInput, GeneratorOutput } from './types'
import { GeneratorError } from './types'

let _client: OpenAI | null = null
let _cloudinaryConfigured = false

function client(): OpenAI {
  if (_client) return _client
  _client = new OpenAI({ apiKey: env.openai() })
  return _client
}

function configureCloudinary() {
  if (_cloudinaryConfigured) return
  const cfg = env.cloudinary()
  cloudinary.config({
    cloud_name: cfg.cloudName,
    api_key: cfg.apiKey,
    api_secret: cfg.apiSecret,
    secure: true,
  })
  _cloudinaryConfigured = true
}

export const gptImage: Generator = {
  id: 'gpt-image-2',
  async generate(input: GeneratorInput): Promise<GeneratorOutput> {
    configureCloudinary()
    const startedAt = Date.now()

    const composedPrompt = composePrompt(input)
    const size = pickSize(input.width, input.height)

    let b64: string | null = null
    try {
      const result = await client().images.generate({
        model: 'gpt-image-2',
        prompt: composedPrompt,
        size,
        quality: 'high',
        n: 1,
      })
      b64 = result.data?.[0]?.b64_json ?? null
    } catch (err) {
      throw new GeneratorError('gpt-image-2', `openai.images.generate: ${(err as Error).message}`)
    }
    if (!b64) {
      throw new GeneratorError('gpt-image-2', 'No image data returned')
    }

    const buf = Buffer.from(b64, 'base64')
    const upload = await new Promise<{ secure_url: string }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'image',
          folder: `catjack/studio/drafts/${input.draft_id}`,
          public_id: `beat-${String(input.beat_index).padStart(2, '0')}`,
          overwrite: true,
        },
        (err: Error | undefined, result: { secure_url: string } | undefined) => {
          if (err || !result) reject(err ?? new Error('upload failed'))
          else resolve({ secure_url: result.secure_url })
        },
      )
      stream.end(buf)
    })

    return {
      url: upload.secure_url,
      kind: 'image',
      generator: 'gpt-image-2',
      duration_ms: Date.now() - startedAt,
    }
  },
}

/**
 * Map our 9:16 default to the closest gpt-image-2 supported size.
 * As of 2026 the model accepts 1024×1024 / 1024×1536 / 1536×1024 / 2048×2048.
 * For vertical 9:16 we pick 1024×1536 (closest aspect). Stitch resizes.
 */
function pickSize(w?: number, h?: number): '1024x1024' | '1024x1536' | '1536x1024' {
  if (w && h && w > h) return '1536x1024'
  if (w && h && w === h) return '1024x1024'
  return '1024x1536'
}

function composePrompt(input: GeneratorInput): string {
  const parts = [input.prompt]
  if (input.aesthetic_notes) parts.push(`Style: ${input.aesthetic_notes}.`)
  parts.push('Centered subject. Vertical 9:16 composition. Clean readable on-screen text.')
  return parts.join(' ')
}
