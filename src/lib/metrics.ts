/**
 * Catjack Studio · Metrics ingest.
 *
 * Walks every studio_posted_videos row whose latest metric snapshot
 * is older than `staleHours`, refreshes per-platform stats, and
 * upserts a daily row into studio_video_metrics_daily. Snapshot day
 * is the recording UTC date — the (posted_video_id, recorded_date)
 * unique index makes re-runs idempotent.
 *
 * Sources:
 *   - YouTube Data API v3 — videos.list?part=statistics (+ analytics
 *     for retention if a refresh token is present; we degrade gracefully
 *     when only the public Data API key is available).
 *   - Postiz analytics — fallback for TikTok + Instagram. The exact
 *     payload schema depends on the integration, so we stash the raw
 *     response in `raw` and pull canonical fields where present.
 */

import { serviceClient } from './supabase'
import { postiz, PostizError } from './postiz'
import { env, optionalSecret } from './op'
import type { PostedVideoRow } from './types'

export interface MetricsRunResult {
  total: number
  refreshed: number
  failed: number
  errors: { posted_video_id: string; platform: string; error: string }[]
}

interface DailySnapshot {
  views: number
  likes: number
  comments: number
  shares: number
  avg_view_duration_seconds: number | null
  retention_curve: number[] | null
  raw: unknown
}

const TODAY = () => new Date().toISOString().slice(0, 10)

export async function runMetricsIngest(opts: { staleHours?: number } = {}): Promise<MetricsRunResult> {
  const staleHours = opts.staleHours ?? 6
  const supabase = serviceClient()
  const result: MetricsRunResult = { total: 0, refreshed: 0, failed: 0, errors: [] }

  // Pull every posted video — even old ones — so we keep daily history
  // accumulating. Cap to last 60 days to keep cost bounded; longer-tail
  // analysis happens in batch jobs not on the cron path.
  const cutoff = new Date(Date.now() - 60 * 86400_000).toISOString()
  const { data: posted, error } = await supabase
    .from('studio_posted_videos')
    .select('*')
    .gte('posted_at', cutoff)
    .order('posted_at', { ascending: false })
  if (error) throw new Error(`load posted_videos: ${error.message}`)

  result.total = (posted ?? []).length
  if (result.total === 0) return result

  // Skip rows whose latest snapshot is fresher than staleHours.
  const ids = (posted as PostedVideoRow[]).map((p) => p.id)
  const { data: latestRows } = await supabase
    .from('studio_video_metrics_daily')
    .select('posted_video_id, recorded_date, created_at')
    .in('posted_video_id', ids)
    .order('created_at', { ascending: false })

  const freshSet = new Set<string>()
  if (latestRows) {
    const seen = new Set<string>()
    for (const r of latestRows as { posted_video_id: string; created_at: string }[]) {
      if (seen.has(r.posted_video_id)) continue
      seen.add(r.posted_video_id)
      const ageHours = (Date.now() - new Date(r.created_at).getTime()) / 3600_000
      if (ageHours < staleHours) freshSet.add(r.posted_video_id)
    }
  }

  // Pull all metrics in parallel but bound the concurrency so we don't
  // hammer YouTube/Postiz at once. 4 in flight is safe.
  const queue = (posted as PostedVideoRow[]).filter((p) => !freshSet.has(p.id))
  const today = TODAY()
  const concurrency = 4
  for (let i = 0; i < queue.length; i += concurrency) {
    const slice = queue.slice(i, i + concurrency)
    await Promise.all(
      slice.map(async (row) => {
        try {
          const snap = await fetchSnapshot(row)
          if (!snap) return
          const { error: upErr } = await supabase
            .from('studio_video_metrics_daily')
            .upsert(
              {
                posted_video_id: row.id,
                recorded_date: today,
                views: snap.views,
                likes: snap.likes,
                comments: snap.comments,
                shares: snap.shares,
                avg_view_duration_seconds: snap.avg_view_duration_seconds,
                retention_curve: snap.retention_curve,
                raw: snap.raw,
              },
              { onConflict: 'posted_video_id,recorded_date' },
            )
          if (upErr) throw new Error(upErr.message)
          result.refreshed += 1
        } catch (err) {
          result.failed += 1
          result.errors.push({
            posted_video_id: row.id,
            platform: row.platform,
            error: err instanceof Error ? err.message : String(err),
          })
        }
      }),
    )
  }

  return result
}

async function fetchSnapshot(row: PostedVideoRow): Promise<DailySnapshot | null> {
  switch (row.platform) {
    case 'youtube':
      return fetchYouTubeSnapshot(row)
    case 'tiktok':
    case 'instagram':
      return fetchPostizSnapshot(row)
    default:
      return null
  }
}

interface YTStatsResponse {
  items?: { statistics?: { viewCount?: string; likeCount?: string; commentCount?: string } }[]
}

async function fetchYouTubeSnapshot(row: PostedVideoRow): Promise<DailySnapshot | null> {
  const apiKey = optionalSecret('YOUTUBE_DATA_API_KEY')
  if (!apiKey) {
    // Without an API key we fall through to Postiz analytics if Postiz
    // tracks the post; otherwise skip.
    return fetchPostizSnapshot(row)
  }
  const u = new URL('https://www.googleapis.com/youtube/v3/videos')
  u.searchParams.set('id', row.platform_post_id)
  u.searchParams.set('part', 'statistics')
  u.searchParams.set('key', apiKey)
  const res = await fetch(u.toString())
  if (!res.ok) throw new Error(`YouTube ${res.status}`)
  const json = (await res.json()) as YTStatsResponse
  const item = json.items?.[0]
  if (!item?.statistics) return null
  const s = item.statistics
  return {
    views: Number(s.viewCount ?? 0),
    likes: Number(s.likeCount ?? 0),
    comments: Number(s.commentCount ?? 0),
    shares: 0, // YouTube doesn't expose shares via Data API
    avg_view_duration_seconds: null,
    retention_curve: null,
    raw: json,
  }
}

interface PostizAnalyticsRaw {
  data?: {
    views?: number
    likes?: number
    comments?: number
    shares?: number
    play_count?: number
    impressions?: number
  }
}

async function fetchPostizSnapshot(row: PostedVideoRow): Promise<DailySnapshot | null> {
  // Skip silently if we never persisted a Postiz post id. (postedRow.platform_post_id
  // is the platform-native id; the Postiz post id is on the studio_drafts row.)
  const supabase = serviceClient()
  if (!row.draft_id) return null
  const { data: draft } = await supabase
    .from('studio_drafts')
    .select('postiz_post_id')
    .eq('id', row.draft_id)
    .maybeSingle()
  const postizId = draft?.postiz_post_id
  if (!postizId) return null

  // Sanity: ensure POSTIZ_API_KEY exists. env.postiz() throws if not.
  void env.postiz()

  let analytics: { data?: unknown }
  try {
    analytics = await postiz().getPostAnalytics(postizId)
  } catch (err) {
    if (err instanceof PostizError && err.status === 404) return null
    throw err
  }
  const raw = analytics as PostizAnalyticsRaw
  const d = raw.data ?? {}
  return {
    views: Number(d.views ?? d.play_count ?? d.impressions ?? 0),
    likes: Number(d.likes ?? 0),
    comments: Number(d.comments ?? 0),
    shares: Number(d.shares ?? 0),
    avg_view_duration_seconds: null,
    retention_curve: null,
    raw: analytics,
  }
}
