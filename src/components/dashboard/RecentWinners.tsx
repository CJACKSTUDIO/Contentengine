'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { Eye, Heart, Play } from 'lucide-react'
import { img } from '@/lib/cloudinary'
import { recentWinners } from '@/lib/fixtures'
import { cn } from '@/lib/cn'

const platformLabel: Record<string, { color: string; label: string }> = {
  tiktok:    { color: '#FF0050', label: 'TikTok' },
  youtube:   { color: '#FF0000', label: 'YouTube' },
  instagram: { color: '#E1306C', label: 'Instagram' },
}

export default function RecentWinners() {
  return (
    <section className="mb-14">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <span className="subtitle">Top of the week</span>
          <h2 className="h-section mt-1">Recent winners</h2>
          <p className="mt-1 text-[13.5px] text-text-secondary">
            Top-performing posts in the last 7 days. Click any card to drill into the patterns that drove it.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {recentWinners.map((w, i) => {
          const platform = platformLabel[w.platform]
          return (
            <motion.article
              key={w.id}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -4 }}
              className="card group cursor-pointer overflow-hidden"
            >
              {/* Thumbnail */}
              <div className="relative aspect-[16/10] w-full overflow-hidden">
                <Image
                  src={img(w.thumbnail, { w: 600 })}
                  alt=""
                  fill
                  unoptimized
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(127,119,221,0.18) 0%, rgba(218,165,32,0.18) 100%)',
                  }}
                />

                {/* Gradient veil for legibility */}
                <div
                  aria-hidden
                  className="absolute inset-0 bg-gradient-to-t from-void/80 via-void/20 to-transparent"
                />

                {/* Platform pill top-left */}
                <span
                  className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wide"
                  style={{
                    background: `${platform.color}1f`,
                    color: '#fff',
                    border: `1px solid ${platform.color}66`,
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: platform.color, boxShadow: `0 0 8px ${platform.color}` }}
                  />
                  {platform.label}
                </span>

                {/* Play hint on hover */}
                <div className="pointer-events-none absolute inset-0 grid place-items-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <div className="grid h-12 w-12 place-items-center rounded-full bg-void/70 ring-1 ring-white/30 backdrop-blur-md">
                    <Play size={18} className="text-white" fill="currentColor" />
                  </div>
                </div>

                {/* LTV badge bottom-right */}
                <span className="absolute bottom-3 right-3 pill pill-gold">
                  <Heart size={11} />
                  {w.ltvPct.toFixed(1)}%
                </span>
              </div>

              {/* Body */}
              <div className="p-4">
                <h3
                  className="line-clamp-2 text-[14.5px] leading-snug text-text-primary"
                  style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 600 }}
                >
                  {w.title}
                </h3>

                <div className="mt-3 flex items-center gap-2 text-[12px] text-text-muted">
                  <Eye size={12} />
                  <span>{w.views}</span>
                  <span className="text-text-muted/40">·</span>
                  <span>{w.publishedAt}</span>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {w.patterns.map((p) => (
                    <span
                      key={p}
                      className={cn(
                        'pill pill-purple text-[10.5px]',
                      )}
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            </motion.article>
          )
        })}
      </div>
    </section>
  )
}
