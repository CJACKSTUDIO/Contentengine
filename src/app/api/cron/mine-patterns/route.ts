import { NextResponse, type NextRequest } from 'next/server'
import { runPatternMiner } from '@/lib/pattern-miner'
import { secret } from '@/lib/op'

export const maxDuration = 120

/**
 * POST /api/cron/mine-patterns
 *
 * Daily Vercel cron. Re-mines pattern × platform × window aggregates
 * across the corpus. Auth via Vercel cron secret to keep the endpoint
 * private.
 */
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization') ?? ''
  const expected = `Bearer ${secret('CRON_SECRET')}`.trim()
  if (authHeader.trim() !== expected) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await runPatternMiner()
    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    console.error('[mine-patterns] failed:', err)
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 500 },
    )
  }
}

// Vercel sends GET for cron triggers in some configurations; mirror.
export async function GET(req: NextRequest) {
  return POST(req)
}
