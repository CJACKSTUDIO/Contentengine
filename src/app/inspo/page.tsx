'use client'

import { motion } from 'framer-motion'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Search, Filter, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import PasteBar from '@/components/inspo/PasteBar'
import InspoCard from '@/components/inspo/InspoCard'
import AnalysisRail from '@/components/inspo/AnalysisRail'
import { inspoRowToView } from '@/lib/inspo-mapper'
import type { InspoVideo, InspoTier } from '@/lib/fixtures'
import type { InspoVideoRow, CommentIntentRow } from '@/lib/types'
import { cn } from '@/lib/cn'

const TIER_OPTIONS: { id: InspoTier | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'ultra-rare', label: '✨ Ultra Rare' },
  { id: 'magic', label: 'Magic' },
  { id: 'rare', label: 'Rare' },
  { id: 'common', label: 'Common' },
]

const SORT_OPTIONS = [
  { id: 'recent', label: 'Recently added' },
  { id: 'ltv',    label: 'Highest LTV' },
  { id: 'replay', label: 'Most replayed' },
] as const

type SortId = (typeof SORT_OPTIONS)[number]['id']

interface DetailState {
  video: InspoVideo
  loading: boolean
}

export default function InspoPage() {
  const [tier, setTier] = useState<InspoTier | 'all'>('all')
  const [sort, setSort] = useState<SortId>('recent')
  const [query, setQuery] = useState('')
  const [videos, setVideos] = useState<InspoVideo[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<DetailState | null>(null)

  /** Reload library list. */
  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (tier !== 'all') params.set('tier', tier)
      params.set('sort', sort)
      if (query.trim()) params.set('q', query.trim())
      const res = await fetch(`/api/inspo?${params.toString()}`, { cache: 'no-store' })
      const json = (await res.json()) as { videos: InspoVideoRow[] }
      setVideos((json.videos ?? []).map((r) => inspoRowToView(r, [])))
    } catch (err) {
      toast.error('Failed to load library', { description: (err as Error).message })
    } finally {
      setLoading(false)
    }
  }, [tier, sort, query])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh()
  }, [refresh])

  /** Hydrate detail rail (fetch comment intents alongside row). */
  const openDetail = useCallback(async (video: InspoVideo) => {
    setSelected({ video, loading: true })
    try {
      const res = await fetch(`/api/inspo/${video.id}`, { cache: 'no-store' })
      const json = (await res.json()) as {
        video: InspoVideoRow
        intents: CommentIntentRow[]
      }
      setSelected({ video: inspoRowToView(json.video, json.intents), loading: false })
    } catch {
      setSelected({ video, loading: false })
    }
  }, [])

  const filtered = useMemo(() => videos, [videos])

  return (
    <>
      <PasteBar onImported={refresh} />

      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-6 flex flex-wrap items-end justify-between gap-4"
      >
        <div>
          <span className="subtitle">Library · {videos.length} videos</span>
          <h2 className="h-section mt-1">Inspo corpus</h2>
        </div>

        <label className="flex h-10 w-[280px] items-center gap-2 rounded-xl border border-border-subtle bg-white/[0.03] px-3 text-[13px] text-text-secondary transition-colors focus-within:border-gold/40 focus-within:bg-white/[0.06]">
          <Search size={14} className="text-text-muted" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search title, channel, or pattern..."
            className="flex-1 bg-transparent text-text-primary placeholder:text-text-muted focus:outline-none"
          />
        </label>
      </motion.section>

      <section className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 rounded-xl border border-border-subtle bg-white/[0.03] p-1">
          <Filter size={14} className="ml-2 mr-1 text-text-muted" />
          {TIER_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setTier(opt.id)}
              className="relative rounded-lg px-3 py-1.5 text-[12.5px] font-semibold transition-colors"
              style={{
                color: tier === opt.id ? 'var(--text-primary)' : 'var(--text-secondary)',
              }}
            >
              {tier === opt.id && (
                <motion.span
                  layoutId="inspo-filter-active"
                  className="absolute inset-0 -z-10 rounded-lg bg-white/[0.06]"
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                />
              )}
              {opt.label}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-2 text-[12.5px] text-text-muted">
          <span>Sort by</span>
          <div className="flex items-center gap-1 rounded-xl border border-border-subtle bg-white/[0.03] p-1">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setSort(opt.id)}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-[12.5px] font-semibold transition-colors',
                  sort === opt.id
                    ? 'bg-white/[0.06] text-text-primary'
                    : 'text-text-secondary hover:text-text-primary',
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading && videos.length === 0 ? (
          <div className="col-span-full grid place-items-center py-16">
            <Loader2 size={20} className="animate-spin text-gold-bright" />
            <p className="mt-2 text-[13px] text-text-muted">Loading inspo library…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="card-elev col-span-full grid place-items-center p-12 text-center">
            <p className="text-[14px] text-text-secondary">
              No videos yet. Paste a TikTok, YouTube Shorts, or Instagram Reel URL above.
            </p>
          </div>
        ) : (
          filtered.map((video, i) => (
            <InspoCard
              key={video.id}
              video={video}
              delay={i * 0.04}
              onClick={() => openDetail(video)}
            />
          ))
        )}
      </section>

      <AnalysisRail
        video={selected?.video ?? null}
        onClose={() => setSelected(null)}
      />
    </>
  )
}
