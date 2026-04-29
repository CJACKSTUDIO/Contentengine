/**
 * Catjack Studio · Railway content-worker client.
 *
 * Calls the yt-dlp + Cloudinary uploader running on Railway. Returns
 * structured ingest results that the inspo import flow persists to
 * Supabase + hands to the Gemini analyzer.
 *
 * The worker URL + bearer token both come from 1Password
 * (op://Catjack-world/RailwayWorker/{url,token}) at runtime.
 */

import { env } from './op'

export class WorkerError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'WorkerError'
    this.status = status
  }
}

export type WorkerPlatform = 'tiktok' | 'youtube' | 'instagram' | 'unknown'

export interface IngestedComment {
  id: string
  author: string | null
  text: string
  like_count: number | null
  timestamp: number | null
}

export interface IngestResult {
  platform: WorkerPlatform
  platform_video_id: string
  channel: string | null
  channel_id: string | null
  title: string | null
  description: string | null
  duration_seconds: number | null
  view_count: number | null
  like_count: number | null
  comment_count: number | null
  thumbnail: string | null
  /** Cloudinary URLs */
  master_url: string
  thumbnail_url: string
  comments: IngestedComment[]
  raw_meta: Record<string, unknown>
}

interface IngestArgs {
  url: string
  /** Override Cloudinary folder. Defaults to catjack/studio/inspo. */
  folder?: string
}

/** Lightweight reachability probe — no auth required. */
export async function workerHealth(): Promise<{
  ok: boolean
  service?: string
  version?: string
  uptimeSeconds?: number
}> {
  const cfg = env.railwayWorker()
  try {
    const res = await fetch(`${cfg.url}/health`, { cache: 'no-store' })
    if (!res.ok) return { ok: false }
    const data = (await res.json()) as {
      ok: boolean
      service: string
      version: string
      uptime_seconds: number
    }
    return {
      ok: data.ok,
      service: data.service,
      version: data.version,
      uptimeSeconds: data.uptime_seconds,
    }
  } catch {
    return { ok: false }
  }
}

/** Pull a public TikTok / YouTube / Reels video and upload to Cloudinary. */
export async function ingestUrl({ url, folder }: IngestArgs): Promise<IngestResult> {
  const cfg = env.railwayWorker()
  const res = await fetch(`${cfg.url}/ingest`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${cfg.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url, folder }),
  })

  let body: unknown = null
  const text = await res.text()
  if (text) {
    try {
      body = JSON.parse(text)
    } catch {
      body = text
    }
  }

  if (!res.ok) {
    const message =
      body && typeof body === 'object' && 'error' in body
        ? String((body as { error: unknown }).error)
        : `Worker ingest failed (${res.status})`
    throw new WorkerError(message, res.status)
  }

  // Worker returns { ok: true, ...IngestResult }; strip the ok flag.
  if (!body || typeof body !== 'object' || !('ok' in body)) {
    throw new WorkerError('Unexpected worker response shape', 502)
  }
  // Build a clean object so callers don't see the wrapper.
  const { ok: _ok, ...rest } = body as { ok: boolean } & IngestResult
  void _ok
  return rest as IngestResult
}
