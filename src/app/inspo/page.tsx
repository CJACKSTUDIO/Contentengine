'use client'

import { motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { Search, Filter } from 'lucide-react'
import PasteBar from '@/components/inspo/PasteBar'
import InspoCard from '@/components/inspo/InspoCard'
import AnalysisRail from '@/components/inspo/AnalysisRail'
import { inspoLibrary, type InspoTier } from '@/lib/fixtures'
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

export default function InspoPage() {
  const [tier, setTier] = useState<InspoTier | 'all'>('all')
  const [sort, setSort] = useState<typeof SORT_OPTIONS[number]['id']>('recent')
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const selectedVideo = selectedId
    ? inspoLibrary.find((v) => v.id === selectedId) ?? null
    : null

  const filtered = useMemo(() => {
    let list = [...inspoLibrary]
    if (tier !== 'all') list = list.filter((v) => v.tier === tier)
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter(
        (v) =>
          v.title.toLowerCase().includes(q) ||
          v.channel.toLowerCase().includes(q) ||
          v.patterns.some((p) => p.toLowerCase().includes(q)),
      )
    }
    if (sort === 'ltv') list.sort((a, b) => b.likeRatio - a.likeRatio)
    else if (sort === 'replay') list.sort((a, b) => b.replayMentions - a.replayMentions)
    return list
  }, [tier, sort, query])

  return (
    <>
      <PasteBar />

      {/* Library header */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-6 flex flex-wrap items-end justify-between gap-4"
      >
        <div>
          <span className="subtitle">Library · {inspoLibrary.length} videos</span>
          <h2 className="h-section mt-1">Inspo corpus</h2>
        </div>

        {/* Search */}
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

      {/* Filters + sort */}
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

      {/* Grid */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((video, i) => (
          <InspoCard
            key={video.id}
            video={video}
            delay={i * 0.04}
            onClick={() => setSelectedId(video.id)}
          />
        ))}
      </section>

      <AnalysisRail video={selectedVideo} onClose={() => setSelectedId(null)} />

      {filtered.length === 0 && (
        <div className="card-elev mt-4 grid place-items-center p-12 text-center">
          <p className="text-[14px] text-text-secondary">No videos match your filters.</p>
          <button
            type="button"
            onClick={() => {
              setTier('all')
              setQuery('')
            }}
            className="mt-3 text-[13px] font-semibold text-gold-bright"
          >
            Reset filters →
          </button>
        </div>
      )}
    </>
  )
}
