import { NextResponse, type NextRequest } from 'next/server'
import { inngest } from '@/lib/inngest'

/**
 * POST /api/agents/run-now
 *
 * Manual trigger for the batch orchestrator. Used by the Agents page's
 * "Run batch now" button + the Dashboard hero CTA.
 *
 * Returns the Inngest event id so the UI can correlate the resulting
 * agent_runs row.
 */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { weekStart?: string }
  const ids = await inngest().send({
    name: 'studio/batch.manual.requested',
    data: {
      trigger: 'manual',
      weekStart: body.weekStart,
    },
  })

  return NextResponse.json({ ok: true, eventIds: ids.ids })
}
