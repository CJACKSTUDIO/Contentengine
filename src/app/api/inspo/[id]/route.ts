import { NextResponse, type NextRequest } from 'next/server'
import { serviceClient } from '@/lib/supabase'
import type { InspoVideoRow, CommentIntentRow } from '@/lib/types'

interface RouteContext {
  params: Promise<{ id: string }>
}

/**
 * GET /api/inspo/:id
 *
 * Returns a single inspo row plus its comment intent buckets — exactly
 * what the AnalysisRail needs in one round-trip.
 */
export async function GET(_req: NextRequest, ctx: RouteContext) {
  const { id } = await ctx.params
  const supabase = serviceClient()

  const [{ data: video, error: vErr }, { data: intents, error: iErr }] =
    await Promise.all([
      supabase.from('studio_inspo_videos').select('*').eq('id', id).maybeSingle(),
      supabase.from('studio_comment_intents').select('*').eq('inspo_video_id', id),
    ])

  if (vErr) {
    return NextResponse.json({ ok: false, error: vErr.message }, { status: 500 })
  }
  if (!video) {
    return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })
  }
  if (iErr) {
    console.error('[inspo/:id] intents fetch failed:', iErr)
  }

  return NextResponse.json({
    ok: true,
    video: video as InspoVideoRow,
    intents: (intents ?? []) as CommentIntentRow[],
  })
}

/**
 * PATCH /api/inspo/:id
 *
 * Currently only used to update user_context. Anything the human spotted
 * that the analyzer should weight in next mining run.
 */
export async function PATCH(req: NextRequest, ctx: RouteContext) {
  const { id } = await ctx.params
  const body = (await req.json().catch(() => ({}))) as {
    user_context?: string | null
  }

  if (typeof body.user_context !== 'string' && body.user_context !== null) {
    return NextResponse.json(
      { ok: false, error: 'user_context must be a string or null' },
      { status: 400 },
    )
  }

  const { data, error } = await serviceClient()
    .from('studio_inspo_videos')
    .update({ user_context: body.user_context })
    .eq('id', id)
    .select('id, user_context, updated_at')
    .single()

  if (error || !data) {
    return NextResponse.json(
      { ok: false, error: error?.message ?? 'Update failed' },
      { status: 500 },
    )
  }
  return NextResponse.json({ ok: true, video: data })
}
