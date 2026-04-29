'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { Play, Sparkles, AlertCircle } from 'lucide-react'
import { img } from '@/lib/cloudinary'
import type { DraftSlot } from '@/lib/fixtures'
import { cn } from '@/lib/cn'

const platformDot: Record<string, string> = {
  tiktok:    '#FF0050',
  youtube:   '#FF0000',
  instagram: '#E1306C',
}

const statusPill: Record<string, { className: string; label: string }> = {
  empty:        { className: 'pill-muted',  label: 'Empty' },
  generating:   { className: 'pill-purple', label: 'Generating' },
  needs_review: { className: 'pill-amber',  label: 'Review' },
  approved:     { className: 'pill-green',  label: 'Approved' },
  published:    { className: 'pill-gold',   label: 'Live' },
  rejected:     { className: 'pill-red',    label: 'Rejected' },
}

interface Props {
  draft: DraftSlot
  onClick: () => void
  isSelected?: boolean
}

export default function DraftCard({ draft, onClick, isSelected }: Props) {
  const status = statusPill[draft.status]

  if (draft.status === 'empty') {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'group relative flex aspect-[4/5] flex-col rounded-xl border border-dashed border-border-subtle bg-white/[0.015] p-3 text-left transition-all hover:border-gold/30 hover:bg-white/[0.04]',
        )}
      >
        <div className="text-[10px] uppercase tracking-[0.14em] text-text-muted">
          {draft.timeLabel}
        </div>
        <div className="flex flex-1 items-center justify-center">
          <Sparkles size={20} className="text-text-muted/50 transition-colors group-hover:text-gold" />
        </div>
        <div className="text-center text-[11px] text-text-muted/70">Slot open</div>
      </button>
    )
  }

  if (draft.status === 'generating') {
    return (
      <motion.button
        type="button"
        onClick={onClick}
        className="group relative flex aspect-[4/5] flex-col overflow-hidden rounded-xl border border-purple/30 bg-white/[0.03] p-3 text-left"
        animate={{
          boxShadow: [
            '0 0 0 0 rgba(127,119,221,0)',
            '0 0 0 4px rgba(127,119,221,0.16)',
            '0 0 0 0 rgba(127,119,221,0)',
          ],
        }}
        transition={{ duration: 2.4, repeat: Infinity }}
      >
        <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.14em] text-text-muted">
          <span>{draft.timeLabel}</span>
          <span className={cn('pill', status.className)}>
            <span className="live-dot" style={{ background: 'var(--accent-purple)' }} />
            {status.label}
          </span>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'linear' }}
            className="h-8 w-8 rounded-full border-2 border-purple/30 border-t-purple"
          />
        </div>
        <p className="line-clamp-2 text-[11.5px] leading-snug text-text-secondary">
          {draft.title ?? 'Generating...'}
        </p>
      </motion.button>
    )
  }

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.18 }}
      className={cn(
        'group relative flex aspect-[4/5] flex-col overflow-hidden rounded-xl border bg-white/[0.03] text-left transition-colors',
        isSelected
          ? 'border-gold/60 ring-2 ring-gold/30'
          : 'border-border-subtle hover:border-border-soft',
      )}
    >
      {/* Thumbnail */}
      <div className="relative h-[58%] w-full overflow-hidden">
        {draft.thumbnail && (
          <Image
            src={img(draft.thumbnail, { w: 400 })}
            alt=""
            fill
            unoptimized
            sizes="(min-width: 1024px) 14vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, rgba(127,119,221,0.18) 0%, rgba(218,165,32,0.18) 100%)',
            }}
          />
        )}
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-void/80 via-void/10 to-transparent" />

        {/* Platform dot */}
        {draft.platform && (
          <span
            className="absolute left-2 top-2 h-2 w-2 rounded-full"
            style={{
              background: platformDot[draft.platform],
              boxShadow: `0 0 8px ${platformDot[draft.platform]}`,
            }}
            title={draft.platform}
          />
        )}

        {/* Critic score */}
        {typeof draft.criticScore === 'number' && (
          <div className="absolute right-2 top-2">
            <div
              className="grid h-7 min-w-7 place-items-center rounded-md px-1.5 text-[11px] font-bold"
              style={{
                fontFamily: 'var(--font-mono), monospace',
                background:
                  draft.criticScore >= 80
                    ? 'rgba(218,165,32,0.92)'
                    : draft.criticScore >= 60
                      ? 'rgba(245,158,11,0.92)'
                      : 'rgba(239,68,68,0.92)',
                color: '#0E0E15',
                backdropFilter: 'blur(6px)',
              }}
            >
              {draft.criticScore}
            </div>
          </div>
        )}

        {/* Play hint on hover */}
        <div className="pointer-events-none absolute inset-0 grid place-items-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-void/70 ring-1 ring-white/30 backdrop-blur-md">
            <Play size={14} className="text-white" fill="currentColor" />
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-1.5 p-2.5">
        <div className="flex items-center justify-between gap-1.5">
          <span className="truncate text-[10px] uppercase tracking-[0.12em] text-text-muted">
            {draft.timeLabel}
          </span>
          <span className={cn('pill px-1.5 text-[9.5px]', status.className)} style={{ height: '18px' }}>
            {draft.status === 'needs_review' && <AlertCircle size={9} />}
            {status.label}
          </span>
        </div>

        <h4
          className="line-clamp-2 text-[12px] leading-snug text-text-primary"
          style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 600 }}
        >
          {draft.title}
        </h4>

        {draft.patterns && (
          <div className="mt-auto flex flex-wrap gap-1 pt-0.5">
            {draft.patterns.slice(0, 2).map((p) => (
              <span
                key={p}
                className="rounded-full border border-border-subtle bg-white/[0.04] px-1.5 py-0.5 text-[9.5px] font-semibold text-text-secondary"
              >
                {p}
              </span>
            ))}
            {draft.patterns.length > 2 && (
              <span className="rounded-full border border-border-subtle bg-white/[0.04] px-1.5 py-0.5 text-[9.5px] font-semibold text-text-muted">
                +{draft.patterns.length - 2}
              </span>
            )}
          </div>
        )}
      </div>
    </motion.button>
  )
}
