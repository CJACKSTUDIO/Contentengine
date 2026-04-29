import { NextResponse, type NextRequest } from 'next/server'
import { serviceClient } from '@/lib/supabase'
import type { InspoVideoRow } from '@/lib/types'

/**
 * GET /api/inspo
 *
 * List the inspo corpus. Filterable by tier, sortable by recency / LTV /
 * replay mentions. Backs the Inspo Library grid in the Studio.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const tier = searchParams.get('tier') // 'common' | 'rare' | 'magic' | 'ultra-rare' | null
  const sort = (searchParams.get('sort') ?? 'recent') as 'recent' | 'ltv' | 'replay'
  const limit = Math.min(Number(searchParams.get('limit') ?? 60), 200)
  const q = searchParams.get('q')?.trim()

  let query = serviceClient()
    .from('studio_inspo_videos')
    .select('*')
    .limit(limit)

  if (tier) query = query.eq('tier', tier)

  if (q) {
    // Search title + channel + patterns. Postgres `or` filter.
    const safe = q.replace(/[%,]/g, ' ').trim()
    query = query.or(
      `title.ilike.%${safe}%,channel.ilike.%${safe}%`,
    )
  }

  switch (sort) {
    case 'ltv':
      query = query.order('like_ratio', { ascending: false, nullsFirst: false })
      break
    case 'replay':
      query = query.order('replay_mentions', { ascending: false })
      break
    default:
      query = query.order('imported_at', { ascending: false })
  }

  const { data, error } = await query
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true, videos: (data ?? []) as InspoVideoRow[] })
}
