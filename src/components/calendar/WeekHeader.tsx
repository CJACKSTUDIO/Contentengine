'use client'

import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Filter, CheckCheck, Send } from 'lucide-react'
import { calendarSlots } from '@/lib/fixtures'
import { useMemo } from 'react'

const FILTER_OPTIONS = ['All', 'Approved', 'Needs review', 'Generating', 'Rejected'] as const

interface Props {
  filter: (typeof FILTER_OPTIONS)[number]
  onFilter: (f: (typeof FILTER_OPTIONS)[number]) => void
  onApproveAll: () => void
  onPushToPostiz: () => void
}

export default function WeekHeader({ filter, onFilter, onApproveAll, onPushToPostiz }: Props) {
  const stats = useMemo(() => {
    let approved = 0, review = 0, generating = 0
    for (const s of calendarSlots) {
      if (s.status === 'approved') approved++
      else if (s.status === 'needs_review') review++
      else if (s.status === 'generating') generating++
    }
    return { approved, review, generating }
  }, [])

  return (
    <section className="mb-8">
      {/* Title + week navigator */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="subtitle">Sunday batch · 28 slots</span>
          <h1
            className="mt-1 text-[40px] leading-[1.05] tracking-tight text-text-primary"
            style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 700 }}
          >
            This week
          </h1>
          <p className="mt-1 text-[13.5px] text-text-secondary">
            Apr 28 – May 4 · {stats.approved} approved · {stats.review} need review · {stats.generating} generating
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-xl border border-border-subtle bg-white/[0.03] text-text-secondary transition-colors hover:bg-white/[0.06] hover:text-text-primary"
            aria-label="Previous week"
          >
            <ChevronLeft size={16} />
          </button>
          <div
            className="flex h-10 items-center rounded-xl border border-border-subtle bg-white/[0.03] px-4 text-[13px] font-semibold text-text-primary"
            style={{ fontFamily: 'var(--font-display), sans-serif' }}
          >
            Apr 28 — May 4
          </div>
          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-xl border border-border-subtle bg-white/[0.03] text-text-secondary transition-colors hover:bg-white/[0.06] hover:text-text-primary"
            aria-label="Next week"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Filters + bulk actions */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 rounded-xl border border-border-subtle bg-white/[0.03] p-1">
          <Filter size={14} className="ml-2 mr-1 text-text-muted" />
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => onFilter(opt)}
              className="relative rounded-lg px-3 py-1.5 text-[12.5px] font-semibold transition-colors"
              style={{
                color: filter === opt ? 'var(--text-primary)' : 'var(--text-secondary)',
              }}
            >
              {filter === opt && (
                <motion.span
                  layoutId="filter-active"
                  className="absolute inset-0 -z-10 rounded-lg bg-white/[0.06]"
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                />
              )}
              {opt}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        <button
          type="button"
          onClick={onApproveAll}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-border-subtle bg-white/[0.03] px-4 text-[13px] font-semibold text-text-primary transition-colors hover:border-gold/40 hover:bg-white/[0.06]"
        >
          <CheckCheck size={14} className="text-gold-bright" />
          Approve all ≥80
        </button>

        <button
          type="button"
          onClick={onPushToPostiz}
          className="btn-gold h-10"
        >
          <Send size={14} />
          Push to Postiz
        </button>
      </div>
    </section>
  )
}
