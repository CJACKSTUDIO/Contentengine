import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { serviceClient } from '@/lib/supabase'
import { uploadBuffer } from '@/lib/cloudinary-server'
import type { ReferenceAssetRow, AssetCategory } from '@/lib/types'

export const maxDuration = 60

const VALID_CATEGORIES: AssetCategory[] = [
  'characters',
  'worlds',
  'cards',
  'logos',
  'voice',
  'reactions',
]

/** Filename → 'image' | 'video' | 'audio' (best-effort by extension/mime). */
function detectType(file: File): 'image' | 'video' | 'audio' {
  const mime = file.type || ''
  if (mime.startsWith('image/')) return 'image'
  if (mime.startsWith('video/')) return 'video'
  if (mime.startsWith('audio/')) return 'audio'
  const name = (file.name || '').toLowerCase()
  if (/\.(png|jpe?g|webp|gif|avif)$/.test(name)) return 'image'
  if (/\.(mp4|mov|webm|m4v)$/.test(name)) return 'video'
  if (/\.(mp3|wav|m4a|aac|ogg)$/.test(name)) return 'audio'
  return 'image'
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 64) || 'asset'
}

/**
 * GET /api/vault/assets?category=characters
 *
 * List all reference assets, optionally filtered by category.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const category = url.searchParams.get('category')

  const supabase = serviceClient()
  let query = supabase
    .from('studio_reference_assets')
    .select('*')
    .order('uploaded_at', { ascending: false })

  if (category && VALID_CATEGORIES.includes(category as AssetCategory)) {
    query = query.eq('category', category)
  }

  const { data, error } = await query
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true, assets: (data ?? []) as ReferenceAssetRow[] })
}

const UploadFields = z.object({
  category: z.enum(VALID_CATEGORIES as [AssetCategory, ...AssetCategory[]]),
  title: z.string().min(1).max(120),
})

/**
 * POST /api/vault/assets
 *
 * multipart/form-data with: file, category, title.
 * Streams to Cloudinary under catjack/studio/vault/<category>/<slug>,
 * persists row in studio_reference_assets, returns the row.
 */
export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null)
  if (!form) {
    return NextResponse.json({ ok: false, error: 'Expected multipart/form-data' }, { status: 400 })
  }

  const fields = UploadFields.safeParse({
    category: form.get('category'),
    title: form.get('title'),
  })
  if (!fields.success) {
    return NextResponse.json({ ok: false, error: fields.error.message }, { status: 400 })
  }

  const file = form.get('file')
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ ok: false, error: 'Missing or empty file' }, { status: 400 })
  }

  const type = detectType(file)
  const buffer = Buffer.from(await file.arrayBuffer())
  const publicId = `${slugify(fields.data.title)}-${Date.now()}`

  let upload
  try {
    upload = await uploadBuffer({
      buffer,
      folder: `catjack/studio/vault/${fields.data.category}`,
      publicId,
      resourceType: type === 'audio' ? 'video' : type, // Cloudinary stores audio under "video"
    })
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Upload failed' },
      { status: 502 },
    )
  }

  const supabase = serviceClient()
  const { data, error } = await supabase
    .from('studio_reference_assets')
    .insert({
      category: fields.data.category,
      title: fields.data.title,
      cloudinary_public_id: upload.public_id,
      type,
    })
    .select('*')
    .single()

  if (error || !data) {
    return NextResponse.json(
      { ok: false, error: error?.message ?? 'Persist failed' },
      { status: 500 },
    )
  }

  return NextResponse.json({ ok: true, asset: data as ReferenceAssetRow }, { status: 201 })
}
