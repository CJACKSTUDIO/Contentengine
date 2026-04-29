'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, Loader2 } from 'lucide-react'
import PatternCard from '@/components/intelligence/PatternCard'
import Heatmap from '@/components/intelligence/Heatmap'
import AttributionTable from '@/components/intelligence/AttributionTable'
import type { PatternRow, AttributionRow } from '@/lib/fixtures'

interface ApiResponse {
  ok: boolean
  rising: PatternRow[]
  decaying: PatternRow[]
  heatmap: { id: string; name: string; category: string; byPlatform: PatternRow['byPlatform'] }[]
  attribution: AttributionRow[]
  counts: { patterns_with_data: number; taxonomy_size: number }
}

export default function IntelligencePage() {
  const [data, setData] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/intelligence', { cache: 'no-store' })
        const json = (await res.json()) as ApiResponse
        if (!cancelled) {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setData(json)
        }
      } finally {
        if (!cancelled) {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setLoading(false)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const rising = data?.rising ?? []
  const decaying = data?.decaying ?? []
  const hasData = !loading && (rising.length > 0 || decaying.length > 0)

  return (
    <>
      {/* Page header */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-10"
      >
        <span className="subtitle">The moat · live</span>
        <h1
          className="mt-1 text-[40px] leading-[1.05] tracking-tight text-text-primary"
          style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 700 }}
        >
          Intelligence
        </h1>
        <p className="mt-2 max-w-[640px] text-[15px] leading-relaxed text-text-secondary">
          Every video you post — and every inspo you import — gets decomposed into structural
          patterns. The studio learns what wins for your audience, then conditions every
          generation on those proven structures.
        </p>
      </motion.section>

      {loading && (
        <div className="grid place-items-center py-20">
          <Loader2 size={20} className="animate-spin text-gold-bright" />
          <p className="mt-2 text-[13px] text-text-muted">Loading playbook…</p>
        </div>
      )}

      {!loading && !hasData && (
        <div className="card-elev grid place-items-center p-12 text-center">
          <p className="text-[14px] text-text-secondary">
            No pattern data yet. Import 10+ inspo videos and the daily miner will start
            surfacing what&apos;s working.
          </p>
          <a
            href="/inspo"
            className="mt-3 text-[13px] font-semibold text-gold-bright transition-colors hover:underline"
          >
            Add inspo →
          </a>
        </div>
      )}

      {hasData && (
        <>
          {/* Rising / Decaying */}
          <section className="mb-12 grid grid-cols-1 gap-8 lg:grid-cols-2">
            <div>
              <div className="mb-4 flex items-center gap-2">
                <TrendingUp size={16} className="text-gold-bright" />
                <span className="subtitle text-gold-bright">Rising</span>
                <span className="rounded-full bg-gold/15 px-2 py-0.5 text-[10.5px] font-bold text-gold-bright">
                  {rising.length}
                </span>
              </div>
              <h2 className="h-section mb-4">What&apos;s working right now</h2>
              <div className="flex flex-col gap-3">
                {rising.length === 0 ? (
                  <p className="text-[13px] text-text-muted">
                    No rising patterns this week — corpus needs more recent data.
                  </p>
                ) : (
                  rising.map((p, i) => (
                    <PatternCard key={p.id} pattern={p} variant="rising" delay={i * 0.05} />
                  ))
                )}
              </div>
            </div>

            <div>
              <div className="mb-4 flex items-center gap-2">
                <TrendingDown size={16} className="text-red" />
                <span className="subtitle" style={{ color: 'var(--accent-red)' }}>
                  Decaying
                </span>
                <span className="rounded-full bg-red/15 px-2 py-0.5 text-[10.5px] font-bold text-red">
                  {decaying.length}
                </span>
              </div>
              <h2 className="h-section mb-4">What&apos;s losing steam</h2>
              <div className="flex flex-col gap-3">
                {decaying.length === 0 ? (
                  <p className="text-[13px] text-text-muted">
                    Nothing decaying — every pattern is holding or improving.
                  </p>
                ) : (
                  decaying.map((p, i) => (
                    <PatternCard key={p.id} pattern={p} variant="decaying" delay={i * 0.05} />
                  ))
                )}
              </div>
            </div>
          </section>

          <Heatmap />
          <AttributionTable />
        </>
      )}
    </>
  )
}
