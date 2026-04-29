import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { serviceClient } from '@/lib/supabase'
import type { StyleProfileRow } from '@/lib/types'

/**
 * GET /api/vault/styles
 *
 * Returns every style profile, ordered by usage_count desc so the
 * Director sees the most-used profiles first when picking style.
 */
export async function GET() {
  const { data, error } = await serviceClient()
    .from('studio_style_profiles')
    .select('*')
    .order('usage_count', { ascending: false })
    .order('updated_at', { ascending: false })

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true, profiles: (data ?? []) as StyleProfileRow[] })
}

const HEX = /^#[0-9a-fA-F]{6}$/
const CreateBody = z.object({
  name: z.string().min(1).max(80),
  hint: z.string().max(240).optional().nullable(),
  prompt_fragment: z.string().min(1).max(2000),
  accent_color: z.string().regex(HEX).optional().nullable(),
  thumbnail_url: z.string().url().optional().nullable(),
  ref_asset_ids: z.array(z.string().uuid()).max(50).optional(),
})

/**
 * POST /api/vault/styles
 *
 * Create a new style profile. Used by the "New profile" button.
 */
export async function POST(req: NextRequest) {
  const parsed = CreateBody.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.message }, { status: 400 })
  }

  const { data, error } = await serviceClient()
    .from('studio_style_profiles')
    .insert({
      name: parsed.data.name,
      hint: parsed.data.hint ?? null,
      prompt_fragment: parsed.data.prompt_fragment,
      accent_color: parsed.data.accent_color ?? null,
      thumbnail_url: parsed.data.thumbnail_url ?? null,
      ref_asset_ids: parsed.data.ref_asset_ids ?? [],
    })
    .select('*')
    .single()

  if (error || !data) {
    return NextResponse.json(
      { ok: false, error: error?.message ?? 'Insert failed' },
      { status: 500 },
    )
  }
  return NextResponse.json({ ok: true, profile: data as StyleProfileRow }, { status: 201 })
}
