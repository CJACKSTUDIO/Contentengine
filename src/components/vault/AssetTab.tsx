'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { Upload, Folder, Music, Video, Image as ImgIcon, Star, Loader2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { img } from '@/lib/cloudinary'
import { ASSET_CATEGORIES, type AssetCategory } from '@/lib/fixtures'
import { cn } from '@/lib/cn'
import { toast } from 'sonner'
import type { ReferenceAssetRow } from '@/lib/types'

const TYPE_ICON = {
  image: ImgIcon,
  video: Video,
  audio: Music,
}

function relativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime()
  const days = Math.floor(ms / 86400_000)
  if (days === 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 30) return `${days} days ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}

export default function AssetTab() {
  const [category, setCategory] = useState<AssetCategory | 'all'>('all')
  const [assets, setAssets] = useState<ReferenceAssetRow[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/vault/assets', { cache: 'no-store' })
      const json = await res.json()
      if (!json.ok) throw new Error(json.error ?? 'Failed to load assets')
      setAssets(json.assets as ReferenceAssetRow[])
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load assets')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: assets.length }
    for (const cat of ASSET_CATEGORIES) {
      c[cat.id] = assets.filter((a) => a.category === cat.id).length
    }
    return c
  }, [assets])

  const filtered = useMemo(() => {
    if (category === 'all') return assets
    return assets.filter((a) => a.category === category)
  }, [assets, category])

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return
    const targetCategory: AssetCategory = category === 'all' ? 'characters' : category
    setUploading(true)
    let ok = 0, failed = 0
    for (const file of Array.from(files)) {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('category', targetCategory)
      fd.append('title', file.name.replace(/\.[^.]+$/, ''))
      try {
        const res = await fetch('/api/vault/assets', { method: 'POST', body: fd })
        const json = await res.json().catch(() => ({}))
        if (res.ok && json.ok) ok++
        else { failed++; console.error('upload failed:', json.error) }
      } catch (err) {
        failed++
        console.error('upload threw:', err)
      }
    }
    setUploading(false)
    if (ok > 0) toast.success(`Uploaded ${ok} asset${ok === 1 ? '' : 's'} to ${targetCategory}`)
    if (failed > 0) toast.error(`${failed} upload${failed === 1 ? '' : 's'} failed`)
    void load()
  }, [category, load])

  return (
    <section className="grid grid-cols-[220px_1fr] gap-6">
      <aside className="card-elev h-fit p-2">
        <CategoryRow
          icon={<Folder size={14} />}
          label="All assets"
          count={counts.all}
          active={category === 'all'}
          onClick={() => setCategory('all')}
        />
        <div className="my-2 h-px bg-border-subtle" />
        {ASSET_CATEGORIES.map((c) => (
          <CategoryRow
            key={c.id}
            icon={<Folder size={14} />}
            label={c.label}
            count={counts[c.id] ?? 0}
            active={category === c.id}
            onClick={() => setCategory(c.id)}
          />
        ))}
      </aside>

      <div>
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            void handleFiles(e.dataTransfer.files)
          }}
          onClick={() => fileInputRef.current?.click()}
          className="mb-6 flex h-[140px] cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border-soft bg-white/[0.02] text-text-muted transition-colors hover:border-gold/40 hover:bg-white/[0.04]"
        >
          {uploading ? (
            <Loader2 size={20} className="animate-spin text-gold-bright" />
          ) : (
            <Upload size={20} className="text-gold-bright" />
          )}
          <p className="text-[14px] text-text-secondary">
            <span className="font-semibold text-text-primary">
              {uploading ? 'Uploading…' : 'Drop files'}
            </span>
            {!uploading && ' or click to upload'}
          </p>
          <p className="text-[11.5px] text-text-muted">
            PNG · JPG · MP4 · WAV · referenced by name across every generation
          </p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => void handleFiles(e.target.files)}
          />
        </div>

        {loading && assets.length === 0 ? (
          <p className="text-center text-[12px] text-text-muted">Loading vault…</p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-[12.5px] text-text-muted">
            No assets in this category yet.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {filtered.map((asset, i) => {
              const TypeIcon = TYPE_ICON[asset.type]
              const isImage = asset.type === 'image'
              return (
                <motion.div
                  key={asset.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.025 }}
                  whileHover={{ y: -2 }}
                  className="card group overflow-hidden text-left"
                >
                  <div className="relative aspect-square w-full overflow-hidden bg-elev">
                    {isImage ? (
                      <Image
                        src={img(asset.cloudinary_public_id, { w: 300 })}
                        alt=""
                        fill
                        unoptimized
                        sizes="200px"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-text-muted">
                        <TypeIcon size={28} />
                      </div>
                    )}
                    <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-void/80 via-transparent to-transparent" />
                    <span className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-md bg-void/70 text-text-primary backdrop-blur-md">
                      <TypeIcon size={12} />
                    </span>
                    {asset.usage_count > 30 && (
                      <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-md bg-void/70 px-1.5 py-0.5 text-[10px] font-bold text-gold-bright backdrop-blur-md">
                        <Star size={9} fill="currentColor" />
                        Hot
                      </span>
                    )}
                  </div>

                  <div className="p-3">
                    <h4
                      className="line-clamp-1 text-[13px] text-text-primary"
                      style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 600 }}
                    >
                      {asset.title}
                    </h4>
                    <div className="mt-1 flex items-center justify-between text-[10.5px] text-text-muted">
                      <span>{relativeTime(asset.uploaded_at)}</span>
                      <span style={{ fontFamily: 'var(--font-mono), monospace' }}>
                        {asset.usage_count} uses
                      </span>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}

function CategoryRow({
  icon,
  label,
  count,
  active,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  count: number
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px] transition-colors',
        active
          ? 'bg-white/[0.06] text-text-primary'
          : 'text-text-secondary hover:bg-white/[0.03] hover:text-text-primary',
      )}
    >
      <span className={cn(active ? 'text-gold-bright' : 'text-text-muted')}>{icon}</span>
      <span className="flex-1 text-left font-semibold">{label}</span>
      <span
        className="text-[10.5px] text-text-muted"
        style={{ fontFamily: 'var(--font-mono), monospace' }}
      >
        {count}
      </span>
    </button>
  )
}
