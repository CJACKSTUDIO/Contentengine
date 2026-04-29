/**
 * Catjack Studio · Pattern Miner.
 *
 * Computes pattern × platform × time-window aggregates by sweeping the
 * inspo + posted-video tables. Persists to studio_pattern_performance
 * (current state) and studio_pattern_evolution (daily snapshot).
 *
 * Designed to be idempotent — safe to re-run any number of times in
 * a day. Subsequent runs in the same day overwrite that day's
 * evolution snapshot rather than duplicating rows.
 */

import { serviceClient } from './supabase'
import type { Platform, PatternTrend } from './types'

const PLATFORMS: Platform[] = ['tiktok', 'youtube', 'instagram']
const WINDOWS = [7, 30, 90] as const

interface VideoSample {
  patterns: string[]
  platform: Platform
  ltv: number | null
  observed_at: string
}

interface PatternStat {
  pattern_id: string
  platform: Platform
  window_days: number
  sample_size: number
  avg_ltv: number
  delta_pct: number
  trend: PatternTrend
}

/**
 * Pull every inspo video + posted video, normalise into VideoSample[].
 * For inspo videos we use like_ratio as LTV; for posted we use the
 * latest daily metric snapshot.
 */
async function gatherSamples(): Promise<VideoSample[]> {
  const supabase = serviceClient()

  const inspo = await supabase
    .from('studio_inspo_videos')
    .select('platform, patterns, like_ratio, imported_at')

  const inspoSamples: VideoSample[] =
    inspo.data?.map((row) => ({
      patterns: row.patterns ?? [],
      platform: row.platform as Platform,
      ltv: row.like_ratio != null ? Number(row.like_ratio) * 100 : null,
      observed_at: row.imported_at,
    })) ?? []

  // Posted videos require a join with the latest metrics row. For v1,
  // pull both tables and reconcile in memory.
  const posted = await supabase
    .from('studio_posted_videos')
    .select('id, platform, patterns, posted_at')

  const postIds = (posted.data ?? []).map((p) => p.id)
  const metricsByPostId = new Map<string, number>()
  if (postIds.length > 0) {
    const metrics = await supabase
      .from('studio_video_metrics_daily')
      .select('posted_video_id, ltv_pct')
      .in('posted_video_id', postIds)
      .order('recorded_date', { ascending: false })
    if (metrics.data) {
      for (const m of metrics.data) {
        if (!metricsByPostId.has(m.posted_video_id) && m.ltv_pct != null) {
          metricsByPostId.set(m.posted_video_id, Number(m.ltv_pct) * 100)
        }
      }
    }
  }

  const postedSamples: VideoSample[] =
    posted.data?.map((row) => ({
      patterns: row.patterns ?? [],
      platform: row.platform as Platform,
      ltv: metricsByPostId.get(row.id) ?? null,
      observed_at: row.posted_at,
    })) ?? []

  return [...inspoSamples, ...postedSamples]
}

/** Compute mean of an array, ignoring nulls. Returns 0 if no values. */
function mean(values: (number | null)[]): number {
  let sum = 0
  let n = 0
  for (const v of values) {
    if (v != null) {
      sum += v
      n++
    }
  }
  return n === 0 ? 0 : sum / n
}

function trendOf(deltaPct: number): PatternTrend {
  if (deltaPct >= 8)  return 'rising'
  if (deltaPct <= -8) return 'decaying'
  return 'stable'
}

/**
 * Compute current-window vs prior-window stats for a pattern.
 * Window covers (now-windowDays .. now); prior covers (now-2*windowDays .. now-windowDays).
 */
function computeWindowStats(
  samples: VideoSample[],
  pattern: string,
  platform: Platform,
  windowDays: number,
  now: Date,
): Omit<PatternStat, 'pattern_id' | 'platform' | 'window_days'> {
  const windowMs = windowDays * 86_400_000
  const cutCurrent = now.getTime() - windowMs
  const cutPrior = cutCurrent - windowMs

  const inWindow = (s: VideoSample, lower: number, upper: number) => {
    const t = Date.parse(s.observed_at)
    return (
      t >= lower &&
      t < upper &&
      s.platform === platform &&
      s.patterns.includes(pattern)
    )
  }

  const current = samples.filter((s) => inWindow(s, cutCurrent, now.getTime()))
  const prior = samples.filter((s) => inWindow(s, cutPrior, cutCurrent))

  const avgCurrent = mean(current.map((s) => s.ltv))
  const avgPrior = mean(prior.map((s) => s.ltv))
  const deltaPct =
    avgPrior > 0 ? ((avgCurrent - avgPrior) / avgPrior) * 100 : avgCurrent > 0 ? 100 : 0

  return {
    sample_size: current.length,
    avg_ltv: Number((avgCurrent / 100).toFixed(4)), // store as fraction
    delta_pct: Number(deltaPct.toFixed(2)),
    trend: trendOf(deltaPct),
  }
}

/** Run a full mining pass. Returns the rows written. */
export async function runPatternMiner(): Promise<{
  perfRowsWritten: number
  evoRowsWritten: number
}> {
  const supabase = serviceClient()
  const samples = await gatherSamples()

  // Pull every pattern from the taxonomy so we cover the full space,
  // not just the ones currently on a video.
  const { data: patterns } = await supabase
    .from('studio_inspo_patterns')
    .select('id')
  const patternIds: string[] = (patterns ?? []).map((p) => p.id)

  const now = new Date()
  const today = now.toISOString().slice(0, 10) // ISO date for snapshot

  const perfRows: PatternStat[] = []
  const evoRows: {
    pattern_id: string
    platform: Platform
    recorded_date: string
    avg_ltv: number
    sample_size: number
  }[] = []

  for (const pattern of patternIds) {
    for (const platform of PLATFORMS) {
      for (const windowDays of WINDOWS) {
        const stats = computeWindowStats(samples, pattern, platform, windowDays, now)
        // Only persist meaningful rows (skip if zero samples in any window)
        if (stats.sample_size === 0) continue
        perfRows.push({
          pattern_id: pattern,
          platform,
          window_days: windowDays,
          ...stats,
        })

        // Daily evolution snapshot uses the 30-day window as the canonical metric.
        if (windowDays === 30) {
          evoRows.push({
            pattern_id: pattern,
            platform,
            recorded_date: today,
            avg_ltv: stats.avg_ltv,
            sample_size: stats.sample_size,
          })
        }
      }
    }
  }

  // Upsert performance rows. Conflict target = (pattern_id, platform, window_days)
  let perfWritten = 0
  if (perfRows.length > 0) {
    const { error, count } = await supabase
      .from('studio_pattern_performance')
      .upsert(perfRows, {
        onConflict: 'pattern_id,platform,window_days',
        count: 'exact',
      })
    if (error) throw error
    perfWritten = count ?? perfRows.length
  }

  // Upsert evolution rows (idempotent on date).
  let evoWritten = 0
  if (evoRows.length > 0) {
    const { error, count } = await supabase
      .from('studio_pattern_evolution')
      .upsert(evoRows, {
        onConflict: 'pattern_id,platform,recorded_date',
        count: 'exact',
      })
    if (error) throw error
    evoWritten = count ?? evoRows.length
  }

  return { perfRowsWritten: perfWritten, evoRowsWritten: evoWritten }
}
