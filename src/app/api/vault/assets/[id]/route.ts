import { NextResponse, type NextRequest } from 'next/server'
import { serviceClient } from '@/lib/supabase'
import { deleteAsset } from '@/lib/cloudinary-server'
import type { ReferenceAssetRow } from '@/lib/types'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function DELETE(_req: NextRequest, ctx: RouteContext) {
  const { id } = await ctx.params
  const supabase = serviceClient()

  const { data: row, error: rErr } = await supabase
    .from('studio_reference_assets')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (rErr) return NextResponse.json({ ok: false, error: rErr.message }, { status: 500 })
  if (!row) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })

  const asset = row as ReferenceAssetRow
  const cloudinaryType = asset.type === 'audio' ? 'video' : asset.type
  // Best-effort Cloudinary cleanup; don't block delete if Cloudinary 404s.
  try {
    await deleteAsset(asset.cloudinary_public_id, cloudinaryType)
  } catch (err) {
    console.warn('[vault/delete] cloudinary cleanup failed:', err)
  }

  const { error: dErr } = await supabase
    .from('studio_reference_assets')
    .delete()
    .eq('id', id)
  if (dErr) return NextResponse.json({ ok: false, error: dErr.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
