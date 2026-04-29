'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { Upload, Folder, Music, Video, Image as ImgIcon, Star } from 'lucide-react'
import { useMemo, useState } from 'react'
import { img } from '@/lib/cloudinary'
import { referenceAssets, ASSET_CATEGORIES, type AssetCategory } from '@/lib/fixtures'
import { cn } from '@/lib/cn'
import { toast } from 'sonner'

const TYPE_ICON = {
  image: ImgIcon,
  video: Video,
  audio: Music,
}

export default function AssetTab() {
  const [category, setCategory] = useState<AssetCategory | 'all'>('all')

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: referenceAssets.length }
    for (const cat of ASSET_CATEGORIES) {
      c[cat.id] = referenceAssets.filter((a) => a.category === cat.id).length
    }
    return c
  }, [])

  const filtered = useMemo(() => {
    if (category === 'all') return referenceAssets
    return referenceAssets.filter((a) => a.category === category)
  }, [category])

  return (
    <section className="grid grid-cols-[220px_1fr] gap-6">
      {/* Sidebar — categories */}
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

      {/* Main */}
      <div>
        {/* Drag-drop upload zone */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            toast.info('Upload coming in backend pass')
          }}
          className="mb-6 flex h-[140px] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border-soft bg-white/[0.02] text-text-muted transition-colors hover:border-gold/40 hover:bg-white/[0.04]"
        >
          <Upload size={20} className="text-gold-bright" />
          <p className="text-[14px] text-text-secondary">
            <span className="font-semibold text-text-primary">Drop files</span> or click to upload
          </p>
          <p className="text-[11.5px] text-text-muted">
            PNG · JPG · MP4 · WAV · referenced by name across every generation
          </p>
        </div>

        {/* Asset grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((asset, i) => {
            const TypeIcon = TYPE_ICON[asset.type]
            return (
              <motion.button
                key={asset.id}
                type="button"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.025 }}
                whileHover={{ y: -2 }}
                className="card group overflow-hidden text-left"
              >
                <div className="relative aspect-square w-full overflow-hidden bg-elev">
                  <Image
                    src={img(asset.thumbnail, { w: 300 })}
                    alt=""
                    fill
                    unoptimized
                    sizes="200px"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    style={{ background: 'linear-gradient(135deg, rgba(127,119,221,0.18), rgba(218,165,32,0.18))' }}
                  />
                  <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-void/80 via-transparent to-transparent" />

                  {/* Type badge */}
                  <span className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-md bg-void/70 text-text-primary backdrop-blur-md">
                    <TypeIcon size={12} />
                  </span>

                  {/* Usage count */}
                  {asset.usedInGenerations > 30 && (
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
                    <span>{asset.uploadedAt}</span>
                    <span style={{ fontFamily: 'var(--font-mono), monospace' }}>
                      {asset.usedInGenerations} uses
                    </span>
                  </div>
                </div>
              </motion.button>
            )
          })}
        </div>
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
