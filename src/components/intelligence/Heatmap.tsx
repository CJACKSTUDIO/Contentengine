'use client'

import { motion } from 'framer-motion'
import { risingPatterns, decayingPatterns, type Platform } from '@/lib/fixtures'

const PLATFORMS: { id: Platform; label: string; color: string }[] = [
  { id: 'tiktok',    label: 'TikTok',    color: '#FF0050' },
  { id: 'youtube',   label: 'YouTube',   color: '#FF0000' },
  { id: 'instagram', label: 'Instagram', color: '#E1306C' },
]

const ALL_PATTERNS = [...risingPatterns, ...decayingPatterns]

/** Map a 0-6 LTV value to a color (red → amber → green via gold midpoint). */
function ltvColor(v: number): string {
  if (v >= 4.5) return 'rgba(218,165,32,0.85)'
  if (v >= 3.5) return 'rgba(245,197,66,0.7)'
  if (v >= 2.8) return 'rgba(245,158,11,0.55)'
  if (v >= 2.2) return 'rgba(239,68,68,0.45)'
  return 'rgba(239,68,68,0.7)'
}

export default function Heatmap() {
  return (
    <section className="mb-12">
      <div className="mb-5">
        <span className="subtitle">Platform performance</span>
        <h2 className="h-section mt-1">Heatmap</h2>
        <p className="mt-1 text-[13.5px] text-text-secondary">
          How each pattern performs per platform. Gold = top quartile · red = bottom.
        </p>
      </div>

      <div className="card overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-2 px-5 py-3 text-[10.5px] uppercase tracking-[0.14em] text-text-muted">
          <span>Pattern</span>
          {PLATFORMS.map((p) => (
            <span key={p.id} className="text-center" style={{ minWidth: 110 }}>
              {p.label}
            </span>
          ))}
        </div>
        <div className="divide-y divide-border-subtle">
          {ALL_PATTERNS.map((pattern, i) => (
            <motion.div
              key={pattern.id}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: i * 0.03 }}
              className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-x-2 px-5 py-3 transition-colors hover:bg-white/[0.02]"
            >
              <div className="min-w-0">
                <div
                  className="text-[13.5px] text-text-primary"
                  style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 600 }}
                >
                  {pattern.name}
                </div>
                <div className="text-[10.5px] uppercase tracking-[0.12em] text-text-muted">
                  {pattern.category}
                </div>
              </div>

              {PLATFORMS.map((p) => {
                const v = pattern.byPlatform[p.id]
                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-center"
                    style={{ minWidth: 110 }}
                  >
                    <div
                      className="grid h-9 w-[88px] place-items-center rounded-lg text-[12.5px] font-bold"
                      style={{
                        fontFamily: 'var(--font-mono), monospace',
                        background: ltvColor(v),
                        color: '#0E0E15',
                      }}
                    >
                      {v.toFixed(1)}%
                    </div>
                  </div>
                )
              })}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
