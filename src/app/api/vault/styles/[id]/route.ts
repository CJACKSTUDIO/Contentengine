import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { serviceClient } from '@/lib/supabase'
import type { StyleProfileRow } from '@/lib/types'

interface RouteContext {
  params: Promise<{ id: string }>
}

const HEX = /^#[0-9a-fA-F]{6}$/
const PatchBody = z.object({
  name: z.string().min(1).max(80).optional(),
  hint: z.string().max(240).nullable().optional(),
  prompt_fragment: z.string().min(1).max(2000).optional(),
  accent_color: z.string().regex(HEX).nullable().optional(),
  thumbnail_url: z.string().url().nullable().optional(),
  ref_asset_ids: z.array(z.string().uuid()).max(50).optional(),
})

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  const { id } = await ctx.params
  const parsed = PatchBody.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.message }, { status: 400 })
  }

  if (Object.keys(parsed.data).length === 0) {
    return NextResponse.json({ ok: false, error: 'Empty patch body' }, { status: 400 })
  }

  const { data, error } = await serviceClient()
    .from('studio_style_profiles')
    .update(parsed.data)
    .eq('id', id)
    .select('*')
    .single()

  if (error || !data) {
    return NextResponse.json(
      { ok: false, error: error?.message ?? 'Update failed' },
      { status: 500 },
    )
  }
  return NextResponse.json({ ok: true, profile: data as StyleProfileRow })
}

export async function DELETE(_req: NextRequest, ctx: RouteContext) {
  const { id } = await ctx.params
  const { error } = await serviceClient()
    .from('studio_style_profiles')
    .delete()
    .eq('id', id)
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
