'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { Eye, Heart, MessageCircle, Repeat, Play } from 'lucide-react'
import { img } from '@/lib/cloudinary'
import type { InspoVideo, InspoTier } from '@/lib/fixtures'
import { cn } from '@/lib/cn'

const platformDot: Record<string, { color: string; label: string }> = {
  tiktok:    { color: '#FF0050', label: 'TikTok' },
  youtube:   { color: '#FF0000', label: 'YouTube' },
  instagram: { color: '#E1306C', label: 'Instagram' },
}

const tierStyle: Record<InspoTier, { ring: string; label: string; color: string }> = {
  common:        { ring: 'rgba(156,163,175,0.4)',   label: 'Common',     color: '#9CA3AF' },
  rare:          { ring: 'rgba(127,119,221,0.55)',  label: 'Rare',       color: '#7F77DD' },
  magic:         { ring: 'rgba(74,222,128,0.55)',   label: 'Magic',      color: '#4ADE80' },
  'ultra-rare':  { ring: 'rgba(245,197,66,0.7)',    label: '✨ Ultra Rare', color: '#F5C542' },
}

interface Props {
  video: InspoVideo
  delay?: number
  onClick?: () => void
}

export default function InspoCard({ video, delay = 0, onClick }: Props) {
  const platform = platformDot[video.platform]
  const tier = tierStyle[video.tier]

  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -3 }}
      className={cn(
        'card group relative overflow-hidden text-left',
      )}
      style={{
        boxShadow: video.tier === 'ultra-rare'
          ? `0 0 0 1px ${tier.ring}, 0 12px 32px rgba(245,197,66,0.16)`
          : undefined,
      }}
    >
      {/* Thumbnail */}
      <div
        className="relative aspect-[16/10] w-full overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${tier.color}33 0%, rgba(127,119,221,0.18) 100%)`,
        }}
      >
        <Image
          src={img(video.thumbnail, { w: 600 })}
          alt=""
          fill
          unoptimized
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-void/85 via-void/20 to-transparent" />

        {/* Platform pill */}
        <span
          className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wide backdrop-blur-md"
          style={{
            background: `${platform.color}26`,
            color: '#fff',
            border: `1px solid ${platform.color}66`,
          }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: platform.color, boxShadow: `0 0 6px ${platform.color}` }}
          />
          {platform.label}
        </span>

        {/* Tier pill */}
        <span
          className="absolute right-3 top-3 rounded-full px-2 py-0.5 text-[10px] font-bold backdrop-blur-md"
          style={{
            fontFamily: 'var(--font-display), sans-serif',
            background: `${tier.color}26`,
            color: tier.color,
            border: `1px solid ${tier.color}66`,
          }}
        >
          {tier.label}
        </span>

        {/* Duration */}
        <span
          className="absolute bottom-3 left-3 rounded-md bg-void/70 px-1.5 py-0.5 text-[10.5px] font-semibold text-white backdrop-blur-md"
          style={{ fontFamily: 'var(--font-mono), monospace' }}
        >
          {video.duration}
        </span>

        {/* Play hint */}
        <div className="pointer-events-none absolute inset-0 grid place-items-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-void/70 ring-1 ring-white/30 backdrop-blur-md">
            <Play size={16} className="text-white" fill="currentColor" />
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        <div className="text-[10.5px] uppercase tracking-[0.12em] text-text-muted">
          {video.channel} · {video.importedAt}
        </div>
        <h3
          className="mt-1.5 line-clamp-2 text-[14.5px] leading-snug text-text-primary"
          style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 600 }}
        >
          {video.title}
        </h3>

        {/* Stats row */}
        <div className="mt-3 grid grid-cols-4 gap-2">
          <Stat icon={<Eye size={11} />} label={video.views} />
          <Stat icon={<Heart size={11} />} label={`${video.likeRatio.toFixed(1)}%`} accent />
          <Stat icon={<MessageCircle size={11} />} label={video.comments} />
          <Stat icon={<Repeat size={11} />} label={String(video.replayMentions)} title="replay mentions in comments" />
        </div>

        {/* Why it won */}
        <p className="mt-3 line-clamp-2 text-[12px] leading-snug text-text-secondary">
          <span className="text-gold-bright">Why · </span>{video.whyItWon}
        </p>

        {/* Pattern tags */}
        <div className="mt-3 flex flex-wrap gap-1">
          {video.patterns.slice(0, 3).map((p) => (
            <span
              key={p}
              className="rounded-full border border-border-subtle bg-white/[0.04] px-1.5 py-0.5 text-[10.5px] font-semibold text-text-secondary"
            >
              {p}
            </span>
          ))}
          {video.patterns.length > 3 && (
            <span className="rounded-full border border-border-subtle bg-white/[0.04] px-1.5 py-0.5 text-[10.5px] font-semibold text-text-muted">
              +{video.patterns.length - 3}
            </span>
          )}
        </div>
      </div>
    </motion.button>
  )
}

function Stat({
  icon,
  label,
  accent,
  title,
}: {
  icon: React.ReactNode
  label: string
  accent?: boolean
  title?: string
}) {
  return (
    <div
      className="flex items-center gap-1 text-[11.5px]"
      title={title}
      style={{
        color: accent ? 'var(--accent-gold-bright)' : 'var(--text-muted)',
        fontFamily: 'var(--font-mono), monospace',
      }}
    >
      {icon}
      <span className="truncate">{label}</span>
    </div>
  )
}
