'use client'

import Image from 'next/image'
import { AnimatePresence, motion } from 'framer-motion'
import { X, Play, Check, Edit3, RotateCw, Ban, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { img } from '@/lib/cloudinary'
import type { DraftSlot, Platform } from '@/lib/fixtures'
import { cn } from '@/lib/cn'

interface Props {
  draft: DraftSlot | null
  onClose: () => void
}

const PLATFORM_LABEL: Record<Platform, string> = {
  tiktok:    'TikTok',
  youtube:   'YouTube',
  instagram: 'Instagram',
}

export default function DetailRail({ draft, onClose }: Props) {
  return (
    <AnimatePresence>
      {draft && (
        <>
          {/* Backdrop */}
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            aria-label="Close"
            className="fixed inset-0 z-40 bg-void/60 backdrop-blur-sm"
          />

          {/* Rail */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 38 }}
            className="fixed right-0 top-0 z-50 flex h-dvh w-full max-w-[520px] flex-col border-l border-border-subtle bg-deep"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border-subtle px-6 py-4">
              <div>
                <span className="subtitle">{draft.timeLabel}</span>
                <h2
                  className="mt-1 text-[18px] leading-tight text-text-primary"
                  style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 600 }}
                >
                  {draft.title ?? 'Empty slot'}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="grid h-9 w-9 place-items-center rounded-xl border border-border-subtle bg-white/[0.03] text-text-secondary transition-colors hover:bg-white/[0.06] hover:text-text-primary"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body — scroll */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {/* Video preview */}
              {draft.thumbnail && (
                <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl border border-border-subtle bg-elev">
                  <Image
                    src={img(draft.thumbnail, { w: 800 })}
                    alt=""
                    fill
                    unoptimized
                    sizes="500px"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-void/85 via-void/20 to-transparent" />
                  <button
                    type="button"
                    className="absolute inset-0 grid place-items-center text-white"
                    aria-label="Play preview"
                  >
                    <div className="grid h-14 w-14 place-items-center rounded-full bg-void/70 ring-1 ring-white/30 backdrop-blur-md transition-transform hover:scale-110">
                      <Play size={20} fill="currentColor" />
                    </div>
                  </button>

                  {typeof draft.criticScore === 'number' && (
                    <div className="absolute left-3 top-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-void/70 px-3 py-1.5 backdrop-blur-md">
                      <span className="subtitle text-[10px] tracking-[0.16em]">Critic</span>
                      <span
                        className="text-[14px] font-bold text-text-primary"
                        style={{ fontFamily: 'var(--font-mono), monospace' }}
                      >
                        {draft.criticScore}
                        <span className="text-text-muted">/100</span>
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Hook */}
              {draft.hook && (
                <div className="mt-5">
                  <span className="subtitle">Hook</span>
                  <p className="mt-1 text-[14px] leading-snug text-text-primary">{draft.hook}</p>
                </div>
              )}

              {/* Brief */}
              {draft.brief && (
                <div className="mt-4 rounded-xl border border-border-subtle bg-white/[0.02] p-4">
                  <span className="subtitle">Brief</span>
                  <p className="mt-1 text-[13.5px] leading-relaxed text-text-secondary">{draft.brief}</p>
                </div>
              )}

              {/* Patterns */}
              {draft.patterns && (
                <div className="mt-5">
                  <span className="subtitle">Patterns leaning on</span>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {draft.patterns.map((p) => (
                      <span key={p} className="pill pill-purple">
                        <Sparkles size={11} />
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Captions per platform */}
              {draft.captions && (
                <div className="mt-5">
                  <span className="subtitle">Captions</span>
                  <div className="mt-2 space-y-2">
                    {(Object.entries(draft.captions) as [Platform, string][]).map(([platform, text]) => (
                      <div
                        key={platform}
                        className="rounded-xl border border-border-subtle bg-white/[0.02] p-3"
                      >
                        <div className="text-[10px] uppercase tracking-[0.12em] text-text-muted">
                          {PLATFORM_LABEL[platform]}
                        </div>
                        <p className="mt-1 text-[13px] leading-relaxed text-text-primary">{text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Agent trace */}
              {draft.agentTrace && (
                <div className="mt-5">
                  <span className="subtitle">Agent trace</span>
                  <ul className="mt-2 space-y-2">
                    {draft.agentTrace.map((t, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-3 rounded-xl border border-border-subtle bg-white/[0.02] p-3"
                      >
                        <span
                          className="shrink-0 rounded-md bg-purple/20 px-2 py-0.5 text-[10.5px] font-bold text-purple"
                          style={{ fontFamily: 'var(--font-display), sans-serif' }}
                        >
                          {t.agent}
                        </span>
                        <p className="flex-1 text-[12.5px] leading-snug text-text-secondary">{t.thought}</p>
                        <span
                          className="shrink-0 text-[10px] text-text-muted"
                          style={{ fontFamily: 'var(--font-mono), monospace' }}
                        >
                          {t.t}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Footer actions */}
            <div className="grid grid-cols-2 gap-2 border-t border-border-subtle bg-deep p-4">
              <ActionButton
                icon={<Check size={15} />}
                label="Approve"
                tone="gold"
                onClick={() => {
                  toast.success(`Approved · ${draft.timeLabel}`)
                  onClose()
                }}
              />
              <ActionButton
                icon={<Edit3 size={15} />}
                label="Edit"
                tone="ghost"
                onClick={() => toast.info('Editor coming in backend pass')}
              />
              <ActionButton
                icon={<RotateCw size={15} />}
                label="Regenerate"
                tone="ghost"
                onClick={() => toast.info('Regenerating · 3 alternatives in 30s')}
              />
              <ActionButton
                icon={<Ban size={15} />}
                label="Reject"
                tone="ghost-red"
                onClick={() => {
                  toast.error(`Rejected · ${draft.timeLabel}`)
                  onClose()
                }}
              />
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

function ActionButton({
  icon,
  label,
  tone,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  tone: 'gold' | 'ghost' | 'ghost-red'
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex h-11 items-center justify-center gap-2 rounded-xl text-[13.5px] font-semibold transition-all',
        tone === 'gold' && 'btn-gold !h-11',
        tone === 'ghost' && 'border border-border-soft bg-white/[0.03] text-text-primary hover:border-gold/40 hover:bg-white/[0.06]',
        tone === 'ghost-red' && 'border border-red/30 bg-red/5 text-red hover:bg-red/10',
      )}
      style={{ fontFamily: 'var(--font-display), sans-serif' }}
    >
      {icon}
      {label}
    </button>
  )
}
