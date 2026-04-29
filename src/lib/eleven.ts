/**
 * Catjack Studio · ElevenLabs narration synthesis.
 *
 * Takes the Scriptwriter's beats[i].voice lines, joins them with
 * appropriate pauses, sends to ElevenLabs TTS, uploads the resulting
 * MP3 to Cloudinary. The worker /stitch endpoint then muxes that
 * audio onto the silent video master.
 *
 * Voice is currently a stock ElevenLabs voice (Adam — warm + neutral).
 * Block 14 swaps in a Catjack-branded voice clone if the user uploads
 * a reference recording.
 */

import { v2 as cloudinary } from 'cloudinary'
import { env } from './op'
import type { ScriptOutput } from './agents'

const TTS_BASE_URL = 'https://api.elevenlabs.io/v1'
const DEFAULT_VOICE_ID = 'pNInz6obpgDQGcFmaJgB' // Adam — stock warm-neutral
const DEFAULT_MODEL = 'eleven_turbo_v2_5'

let _cloudinaryConfigured = false
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

export interface NarrationResult {
  /** Cloudinary URL of the rendered narration MP3. */
  audio_url: string
  /** Wall-clock duration in ms (best-effort estimate from char count). */
  estimated_seconds: number
}

/**
 * Compose the script's voice lines into a single narration take and
 * synthesize. Returns null if the script has no spoken lines (in which
 * case the stitch step uses silence).
 */
export async function synthesizeNarration(
  script: ScriptOutput,
  draftId: string,
  voiceId: string = DEFAULT_VOICE_ID,
): Promise<NarrationResult | null> {
  configureCloudinary()

  // Join voice lines with sentence-end pauses (commas keep flow intact).
  const lines = script.beats
    .map((b) => b.voice?.trim())
    .filter((v): v is string => Boolean(v && v.length > 0))

  if (lines.length === 0) return null

  const text = lines.join(' ... ').slice(0, 4500) // ElevenLabs char cap

  const apiKey = env.eleven()
  const res = await fetch(`${TTS_BASE_URL}/text-to-speech/${voiceId}/stream`, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
      Accept: 'audio/mpeg',
    },
    body: JSON.stringify({
      text,
      model_id: DEFAULT_MODEL,
      voice_settings: {
        stability: 0.6,
        similarity_boost: 0.75,
        style: 0.3,
        use_speaker_boost: true,
      },
    }),
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`ElevenLabs ${res.status}: ${detail.slice(0, 240)}`)
  }
  const audioBuffer = Buffer.from(await res.arrayBuffer())

  // Upload to Cloudinary as a video resource (audio counts as video for CDN).
  const upload = await new Promise<{ secure_url: string }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'video',
        folder: `catjack/studio/drafts/${draftId}`,
        public_id: 'narration',
        overwrite: true,
      },
      (err: Error | undefined, result: { secure_url: string } | undefined) => {
        if (err || !result) reject(err ?? new Error('upload failed'))
        else resolve({ secure_url: result.secure_url })
      },
    )
    stream.end(audioBuffer)
  })

  // ElevenLabs Turbo speaks ~150 wpm; estimate from char count.
  const estimatedSeconds = Math.max(3, Math.round(text.length / 18))

  return {
    audio_url: upload.secure_url,
    estimated_seconds: estimatedSeconds,
  }
}
