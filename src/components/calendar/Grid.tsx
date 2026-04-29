'use client'

import { motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import WeekHeader from './WeekHeader'
import DraftCard from './DraftCard'
import DetailRail from './DetailRail'
import { calendarSlots, DAY_LABELS, type DraftStatus } from '@/lib/fixtures'

const FILTER_TO_STATUS: Record<string, DraftStatus[] | null> = {
  All: null,
  Approved: ['approved', 'published'],
  'Needs review': ['needs_review'],
  Generating: ['generating'],
  Rejected: ['rejected'],
}

type FilterValue = 'All' | 'Approved' | 'Needs review' | 'Generating' | 'Rejected'

export default function Grid() {
  const [filter, setFilter] = useState<FilterValue>('All')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const filteredById = useMemo(() => {
    const allowed = FILTER_TO_STATUS[filter]
    if (!allowed) return new Set(calendarSlots.map((s) => s.id))
    return new Set(
      calendarSlots
        .filter((s) => allowed.includes(s.status))
        .map((s) => s.id),
    )
  }, [filter])

  const selected = selectedId
    ? calendarSlots.find((s) => s.id === selectedId) ?? null
    : null

  const handleApproveAll = () => {
    const eligible = calendarSlots.filter(
      (s) => typeof s.criticScore === 'number' && s.criticScore >= 80 && s.status !== 'published',
    )
    toast.success(`Approved ${eligible.length} drafts scoring ≥80`)
  }

  const handlePushToPostiz = () => {
    const approved = calendarSlots.filter((s) => s.status === 'approved')
    toast.success(`${approved.length} drafts pushed to Postiz`, {
      description: 'Scheduled across TikTok + YouTube · check the Postiz calendar to confirm',
    })
  }

  return (
    <>
      <WeekHeader
        filter={filter}
        onFilter={setFilter}
        onApproveAll={handleApproveAll}
        onPushToPostiz={handlePushToPostiz}
      />

      {/* Day headers */}
      <div className="mb-3 grid grid-cols-7 gap-3">
        {DAY_LABELS.map((day, i) => {
          const today = i === 2 // demo: Wed is today
          return (
            <div key={day} className="flex items-baseline justify-between px-1">
              <span
                className="text-[11px] uppercase tracking-[0.16em] text-text-muted"
                style={{ fontFamily: 'var(--font-display), sans-serif' }}
              >
                {day}
              </span>
              {today && (
                <span className="rounded-md bg-gold/15 px-1.5 py-0.5 text-[9.5px] font-bold text-gold-bright">
                  TODAY
                </span>
              )}
            </div>
          )
        })}
      </div>

      {/* 4 rows × 7 cols */}
      <div className="grid grid-cols-7 gap-3">
        {calendarSlots.map((slot, i) => {
          const isVisible = filteredById.has(slot.id)
          return (
            <motion.div
              key={slot.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{
                opacity: isVisible ? 1 : 0.18,
                y: 0,
                scale: isVisible ? 1 : 0.98,
              }}
              transition={{ duration: 0.32, delay: i * 0.012 }}
              style={{ pointerEvents: isVisible ? 'auto' : 'none' }}
            >
              <DraftCard
                draft={slot}
                onClick={() => setSelectedId(slot.id)}
                isSelected={selectedId === slot.id}
              />
            </motion.div>
          )
        })}
      </div>

      <DetailRail draft={selected} onClose={() => setSelectedId(null)} />
    </>
  )
}
