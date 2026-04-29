import { NextResponse, type NextRequest } from 'next/server'
import { serviceClient } from '@/lib/supabase'
import { buildWeekSlots, isoWeekStart } from '@/lib/draft-mapper'
import type { DraftRow } from '@/lib/types'

/**
 * GET /api/drafts?week=YYYY-MM-DD
 *
 * Returns all 28 slot positions for the given week, with any saved
 * drafts overlaid. Defaults to the current ISO week if `week` is omitted.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const week = url.searchParams.get('week') ?? isoWeekStart()

  const { data, error } = await serviceClient()
    .from('studio_drafts')
    .select('*')
    .eq('week_start', week)
    .order('slot_day', { ascending: true })
    .order('slot_index', { ascending: true })

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  const slots = buildWeekSlots((data ?? []) as DraftRow[], week)
  return NextResponse.json({ ok: true, weekStart: week, slots })
}
