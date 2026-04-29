import { NextResponse, type NextRequest } from 'next/server'
import { runMetricsIngest } from '@/lib/metrics'
import { secret } from '@/lib/op'

export const maxDuration = 300

/**
 * POST /api/cron/ingest-metrics
 *
 * Daily Vercel cron — refreshes per-video metrics for everything
 * posted in the last 60 days. Cron secret guarded.
 */
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization') ?? ''
  const expected = `Bearer ${secret('CRON_SECRET')}`.trim()
  if (authHeader.trim() !== expected) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await runMetricsIngest()
    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    console.error('[ingest-metrics] failed:', err)
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 500 },
    )
  }
}

export async function GET(req: NextRequest) {
  return POST(req)
}
