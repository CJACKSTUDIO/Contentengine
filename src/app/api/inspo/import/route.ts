import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { ingestUrl, WorkerError } from '@/lib/worker'
import { analyzeVideo, bucketComments } from '@/lib/gemini'
import { serviceClient } from '@/lib/supabase'
import { classifyTier, formatViewCount } from '@/lib/inspo-tier'
import type { InspoVideoRow } from '@/lib/types'

export const maxDuration = 300 // up to 5 min — yt-dlp + Gemini analysis can take a while

const Body = z.object({
  url: z.string().url(),
})

/**
 * POST /api/inspo/import
 *
 * Full pipeline: paste URL → Railway worker downloads + uploads to
 * Cloudinary → Gemini analyzes the master + buckets comments → row
 * persisted into studio_inspo_videos + studio_comment_intents.
 *
 * Returns the persisted row plus comment intent counts so the Studio
 * UI can hydrate the AnalysisRail without a second fetch.
 */
export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => ({}))
  const parsed = Body.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.message }, { status: 400 })
  }
  const { url } = parsed.data

  const supabase = serviceClient()

  // Skip if we've already imported this URL.
  const { data: existing } = await supabase
    .from('studio_inspo_videos')
    .select('*')
    .eq('url', url)
    .maybeSingle()
  if (existing) {
    return NextResponse.json({ ok: true, video: existing, deduped: true })
  }

  // 1. Download + upload via Railway worker.
  let ingest: Awaited<ReturnType<typeof ingestUrl>>
  try {
    ingest = await ingestUrl({ url })
  } catch (err) {
    const status = err instanceof WorkerError ? err.status : 502
    return NextResponse.json(
      { ok: false, stage: 'worker', error: (err as Error).message },
      { status },
    )
  }

  // 2. Run Gemini analysis + comment bucketing in parallel.
  const [analysis, intents] = await Promise.all([
    analyzeVideo(ingest.master_url).catch((err) => {
      console.error('[inspo/import] gemini.analyzeVideo failed:', err)
      return null
    }),
    bucketComments(ingest.comments).catch((err) => {
      console.error('[inspo/import] gemini.bucketComments failed:', err)
      return { buckets: [], replay_signal_count: 0 }
    }),
  ])

  const replayMentions = intents.replay_signal_count ?? 0

  const tier = classifyTier({
    views: ingest.view_count,
    like_count: ingest.like_count,
    comment_count: ingest.comment_count,
    replay_mentions: replayMentions,
  })

  const likeRatio =
    ingest.view_count && ingest.view_count > 0 && ingest.like_count
      ? Number((ingest.like_count / ingest.view_count).toFixed(4))
      : null

  // 3. Persist video row.
  const { data: inserted, error: insertErr } = await supabase
    .from('studio_inspo_videos')
    .insert({
      url,
      platform: ingest.platform === 'unknown' ? 'tiktok' : ingest.platform,
      platform_video_id: ingest.platform_video_id,
      channel: ingest.channel,
      channel_id: ingest.channel_id,
      title: ingest.title,
      thumbnail_url: ingest.thumbnail_url,
      master_url: ingest.master_url,
      duration_seconds: ingest.duration_seconds,
      views_text: formatViewCount(ingest.view_count),
      views_int: ingest.view_count,
      like_ratio: likeRatio,
      comments_text: formatViewCount(ingest.comment_count),
      shares_text: '—',
      replay_mentions: replayMentions,
      tier,
      analysis,
      patterns: analysis ? deriveTags(analysis.hookPattern) : [],
      top_pattern_confidence: analysis?.hookConfidence ?? null,
      user_context: null,
    })
    .select('*')
    .single<InspoVideoRow>()

  if (insertErr || !inserted) {
    return NextResponse.json(
      { ok: false, stage: 'db', error: insertErr?.message ?? 'insert failed' },
      { status: 500 },
    )
  }

  // 4. Persist comment intents.
  if (intents.buckets.length > 0) {
    const rows = intents.buckets.map((b) => ({
      inspo_video_id: inserted.id,
      bucket: b.bucket,
      count: b.count,
      example_quote: b.example_quote,
    }))
    const { error: bucketsErr } = await supabase
      .from('studio_comment_intents')
      .insert(rows)
    if (bucketsErr) {
      console.error('[inspo/import] failed to persist comment_intents:', bucketsErr)
    }
  }

  return NextResponse.json({
    ok: true,
    video: inserted,
    intents: intents.buckets,
    deduped: false,
  })
}

/** Split "big-emotion · face-zoom" into ['big-emotion', 'face-zoom']. */
function deriveTags(hookPattern: string | undefined): string[] {
  if (!hookPattern) return []
  return hookPattern
    .split(/[·,]/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
}
