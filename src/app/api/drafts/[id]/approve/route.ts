import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { serviceClient } from '@/lib/supabase'
import { inngest } from '@/lib/inngest'

interface RouteContext {
  params: Promise<{ id: string }>
}

const Body = z.object({
  /** ISO timestamp; if omitted, publish "now". */
  scheduled_for: z.string().datetime().optional(),
  /** Override Critic 'reject' verdict. Default false. */
  force: z.boolean().optional(),
})

/**
 * POST /api/drafts/:id/approve
 *
 * Marks a needs_review draft as approved and emits a publish event for
 * the Inngest publishDraft function to upload + schedule via Postiz.
 *
 * The actual upload happens async — the route returns 202 immediately.
 */
export async function POST(req: NextRequest, ctx: RouteContext) {
  const { id } = await ctx.params

  const parsed = Body.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.message },
      { status: 400 },
    )
  }

  const supabase = serviceClient()
  const { data: draft, error } = await supabase
    .from('studio_drafts')
    .select('id, status, master_url, platform, critic_verdict')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }
  if (!draft) {
    return NextResponse.json({ ok: false, error: 'Draft not found' }, { status: 404 })
  }
  if (!draft.master_url) {
    return NextResponse.json(
      { ok: false, error: 'Draft has no rendered master yet' },
      { status: 409 },
    )
  }
  if (draft.status === 'published') {
    return NextResponse.json(
      { ok: false, error: 'Draft already published' },
      { status: 409 },
    )
  }
  if (draft.critic_verdict === 'reject' && !parsed.data.force) {
    return NextResponse.json(
      {
        ok: false,
        error:
          'Critic rejected this draft. Pass force=true to publish anyway.',
      },
      { status: 409 },
    )
  }

  // Flip to approved synchronously so the UI updates instantly.
  const now = new Date().toISOString()
  await supabase
    .from('studio_drafts')
    .update({
      status: 'approved',
      approved_at: now,
    })
    .eq('id', id)

  await inngest().send({
    name: 'studio/draft.publish.requested',
    data: {
      draftId: id,
      scheduledFor: parsed.data.scheduled_for,
      force: parsed.data.force ?? false,
      requestedBy: 'human',
    },
  })

  return NextResponse.json(
    { ok: true, draftId: id, queued: true },
    { status: 202 },
  )
}
