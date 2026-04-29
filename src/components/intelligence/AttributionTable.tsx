'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { Eye } from 'lucide-react'
import { img } from '@/lib/cloudinary'
import { attributionTop20, type Platform } from '@/lib/fixtures'

const platformDot: Record<Platform, string> = {
  tiktok:    '#FF0050',
  youtube:   '#FF0000',
  instagram: '#E1306C',
}

export default function AttributionTable() {
  return (
    <section className="mb-12">
      <div className="mb-5 flex items-end justify-between">
        <div>
          <span className="subtitle">Top performers</span>
          <h2 className="h-section mt-1">Attribution</h2>
          <p className="mt-1 text-[13.5px] text-text-secondary">
            Top 10 of 20. Pattern column shows what each video leaned on.
          </p>
        </div>
        <button
          type="button"
          className="text-[13px] font-semibold text-text-secondary transition-colors hover:text-gold-bright"
        >
          Export CSV →
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="grid grid-cols-[40px_1fr_120px_100px_100px_220px] gap-x-3 border-b border-border-subtle px-5 py-3 text-[10.5px] uppercase tracking-[0.14em] text-text-muted">
          <span>#</span>
          <span>Title</span>
          <span>Platform</span>
          <span className="text-right">Views</span>
          <span className="text-right">LTV</span>
          <span>Patterns</span>
        </div>
        <div className="divide-y divide-border-subtle">
          {attributionTop20.map((row, i) => (
            <motion.div
              key={row.rank}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: i * 0.04 }}
              className="grid grid-cols-[40px_1fr_120px_100px_100px_220px] items-center gap-x-3 px-5 py-3 transition-colors hover:bg-white/[0.02]"
            >
              <span
                className="text-[14px] font-bold text-text-muted"
                style={{ fontFamily: 'var(--font-mono), monospace' }}
              >
                {String(row.rank).padStart(2, '0')}
              </span>

              <div className="flex min-w-0 items-center gap-3">
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md ring-1 ring-border-subtle">
                  <Image
                    src={img(row.thumbnail, { w: 80 })}
                    alt=""
                    fill
                    unoptimized
                    sizes="40px"
                    className="object-cover"
                    style={{ background: 'linear-gradient(135deg, rgba(127,119,221,0.18), rgba(218,165,32,0.18))' }}
                  />
                </div>
                <div className="min-w-0">
                  <div
                    className="truncate text-[13.5px] text-text-primary"
                    style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 600 }}
                  >
                    {row.title}
                  </div>
                  <div className="text-[10.5px] text-text-muted">{row.publishedAt}</div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: platformDot[row.platform], boxShadow: `0 0 6px ${platformDot[row.platform]}` }}
                />
                <span className="text-[12.5px] capitalize text-text-secondary">{row.platform}</span>
              </div>

              <div className="flex items-center justify-end gap-1 text-[12.5px] text-text-secondary">
                <Eye size={11} className="text-text-muted" />
                {row.views}
              </div>

              <div
                className="text-right text-[14px] font-bold text-gold-bright"
                style={{ fontFamily: 'var(--font-mono), monospace' }}
              >
                {row.ltvPct.toFixed(1)}%
              </div>

              <div className="flex flex-wrap gap-1">
                {row.patterns.slice(0, 2).map((p) => (
                  <span
                    key={p}
                    className="rounded-full border border-border-subtle bg-white/[0.04] px-1.5 py-0.5 text-[10.5px] font-semibold text-text-secondary"
                  >
                    {p}
                  </span>
                ))}
                {row.patterns.length > 2 && (
                  <span className="rounded-full border border-border-subtle bg-white/[0.04] px-1.5 py-0.5 text-[10.5px] font-semibold text-text-muted">
                    +{row.patterns.length - 2}
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
