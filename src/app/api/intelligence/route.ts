import { NextResponse, type NextRequest } from 'next/server'
import { serviceClient } from '@/lib/supabase'
import type { Platform } from '@/lib/types'

/**
 * GET /api/intelligence
 *
 * One-shot endpoint that returns everything the Intelligence page
 * needs in a single round-trip:
 *   - rising:  top-N patterns trending up (7-day window)
 *   - decaying: bottom-N patterns trending down (7-day window)
 *   - heatmap: per-pattern × per-platform LTV grid (30-day window)
 *   - attribution: top videos with their pattern fingerprints
 *
 * Heavy lifting happens in the daily cron; this route just reads
 * the materialised tables.
 */
export async function GET(_req: NextRequest) {
  const supabase = serviceClient()

  // Pattern taxonomy (for joining names/categories onto perf rows).
  const { data: taxonomy } = await supabase
    .from('studio_inspo_patterns')
    .select('id, name, category, description')

  // 7-day window — used for rising/decaying.
  const { data: perf7 } = await supabase
    .from('studio_pattern_performance')
    .select('*')
    .eq('window_days', 7)

  // 30-day window — used for the heatmap.
  const { data: perf30 } = await supabase
    .from('studio_pattern_performance')
    .select('*')
    .eq('window_days', 30)

  // 8-week sparkline data.
  const sinceIso = new Date(Date.now() - 56 * 86_400_000).toISOString().slice(0, 10)
  const { data: evolution } = await supabase
    .from('studio_pattern_evolution')
    .select('pattern_id, platform, recorded_date, avg_ltv, sample_size')
    .gte('recorded_date', sinceIso)
    .order('recorded_date', { ascending: true })

  // Attribution: top inspo + posted videos by like_ratio in last 30 days.
  const since30Iso = new Date(Date.now() - 30 * 86_400_000).toISOString()
  const { data: topInspo } = await supabase
    .from('studio_inspo_videos')
    .select('id, title, channel, platform, like_ratio, views_text, patterns, thumbnail_url, imported_at')
    .gte('imported_at', since30Iso)
    .order('like_ratio', { ascending: false, nullsFirst: false })
    .limit(20)

  const tax = new Map((taxonomy ?? []).map((t) => [t.id, t]))

  // Aggregate sparkline per pattern (averaged across platforms).
  const sparklineByPattern = new Map<string, number[]>()
  for (const row of evolution ?? []) {
    const arr = sparklineByPattern.get(row.pattern_id) ?? []
    arr.push(Number(row.avg_ltv ?? 0) * 100)
    sparklineByPattern.set(row.pattern_id, arr)
  }

  // Build rising / decaying — average the 3 platforms per pattern, sort by delta.
  const byPattern = new Map<string, { sumDelta: number; sumSize: number; sumLtv: number; count: number; byPlatform: Record<Platform, number> }>()
  for (const row of perf7 ?? []) {
    const cur = byPattern.get(row.pattern_id) ?? {
      sumDelta: 0,
      sumSize: 0,
      sumLtv: 0,
      count: 0,
      byPlatform: { tiktok: 0, youtube: 0, instagram: 0 },
    }
    cur.sumDelta += Number(row.delta_pct ?? 0)
    cur.sumSize += row.sample_size ?? 0
    cur.sumLtv += Number(row.avg_ltv ?? 0)
    cur.count += 1
    cur.byPlatform[row.platform as Platform] = Number(row.avg_ltv ?? 0) * 100
    byPattern.set(row.pattern_id, cur)
  }

  const buildPattern = (id: string) => {
    const t = tax.get(id)
    const agg = byPattern.get(id)
    if (!t || !agg) return null
    const avgDelta = agg.sumDelta / agg.count
    const avgLtv = (agg.sumLtv / agg.count) * 100
    const spark = sparklineByPattern.get(id) ?? []
    return {
      id,
      name: t.name,
      category: t.category,
      delta7d: Number(avgDelta.toFixed(1)),
      sampleSize: agg.sumSize,
      avgLtv: Number(avgLtv.toFixed(2)),
      byPlatform: agg.byPlatform,
      sparkline: spark.length >= 2 ? spark.slice(-8) : [avgLtv, avgLtv],
      tagline: t.description ?? `${t.name} pattern.`,
    }
  }

  const allPatterns = [...byPattern.keys()]
    .map(buildPattern)
    .filter((p): p is NonNullable<ReturnType<typeof buildPattern>> => p !== null)

  const rising = [...allPatterns]
    .filter((p) => p.delta7d > 5)
    .sort((a, b) => b.delta7d - a.delta7d)
    .slice(0, 5)

  const decaying = [...allPatterns]
    .filter((p) => p.delta7d < -5)
    .sort((a, b) => a.delta7d - b.delta7d)
    .slice(0, 5)

  // Heatmap rows: every pattern in perf30 with its by-platform LTV.
  const heatmapByPattern = new Map<string, { byPlatform: Record<Platform, number> }>()
  for (const row of perf30 ?? []) {
    const cur = heatmapByPattern.get(row.pattern_id) ?? {
      byPlatform: { tiktok: 0, youtube: 0, instagram: 0 },
    }
    cur.byPlatform[row.platform as Platform] = Number(row.avg_ltv ?? 0) * 100
    heatmapByPattern.set(row.pattern_id, cur)
  }

  const heatmap = [...heatmapByPattern.entries()].map(([id, agg]) => {
    const t = tax.get(id)
    return {
      id,
      name: t?.name ?? id,
      category: t?.category ?? 'structure',
      byPlatform: agg.byPlatform,
    }
  })

  // Attribution table — derive rank.
  const attribution = (topInspo ?? []).map((row, i) => ({
    rank: i + 1,
    thumbnail: row.thumbnail_url ?? '',
    title: row.title ?? '(untitled)',
    platform: row.platform as Platform,
    views: row.views_text ?? '—',
    ltvPct: row.like_ratio != null ? Number((Number(row.like_ratio) * 100).toFixed(1)) : 0,
    patterns: row.patterns ?? [],
    publishedAt: new Date(row.imported_at).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }),
  }))

  return NextResponse.json({
    ok: true,
    rising,
    decaying,
    heatmap,
    attribution,
    counts: {
      patterns_with_data: byPattern.size,
      taxonomy_size: taxonomy?.length ?? 0,
    },
  })
}
