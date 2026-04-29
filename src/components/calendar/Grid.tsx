'use client'

import { motion } from 'framer-motion'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import WeekHeader from './WeekHeader'
import DraftCard from './DraftCard'
import DetailRail from './DetailRail'
import type { DraftSlot, DraftStatus } from '@/lib/fixtures'

const FILTER_TO_STATUS: Record<string, DraftStatus[] | null> = {
  All: null,
  Approved: ['approved', 'published'],
  'Needs review': ['needs_review'],
  Generating: ['generating'],
  Rejected: ['rejected'],
}

type FilterValue = 'All' | 'Approved' | 'Needs review' | 'Generating' | 'Rejected'

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function formatRange(weekStart: string): string {
  const [y, m, d] = weekStart.split('-').map(Number)
  const start = new Date(Date.UTC(y, m - 1, d))
  const end = new Date(start)
  end.setUTCDate(end.getUTCDate() + 6)
  return `${MONTHS[start.getUTCMonth()]} ${start.getUTCDate()} — ${MONTHS[end.getUTCMonth()]} ${end.getUTCDate()}`
}

export default function Grid() {
  const [filter, setFilter] = useState<FilterValue>('All')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [slots, setSlots] = useState<DraftSlot[]>([])
  const [weekStart, setWeekStart] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async (week?: string) => {
    setLoading(true)
    try {
      const qs = week ? `?week=${week}` : ''
      const res = await fetch(`/api/drafts${qs}`, { cache: 'no-store' })
      const json = await res.json()
      if (!json.ok) throw new Error(json.error ?? 'Failed to load drafts')
      setSlots(json.slots as DraftSlot[])
      setWeekStart(json.weekStart as string)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load drafts'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const filteredById = useMemo(() => {
    const allowed = FILTER_TO_STATUS[filter]
    if (!allowed) return new Set(slots.map((s) => s.id))
    return new Set(slots.filter((s) => allowed.includes(s.status)).map((s) => s.id))
  }, [filter, slots])

  const selected = selectedId
    ? slots.find((s) => s.id === selectedId) ?? null
    : null

  const handleApproveAll = async () => {
    const eligible = slots.filter(
      (s) => typeof s.criticScore === 'number' && s.criticScore >= 80 && s.status === 'needs_review',
    )
    if (eligible.length === 0) {
      toast.info('Nothing eligible · need score ≥ 80 and status = needs review')
      return
    }
    let ok = 0
    let failed = 0
    await Promise.all(
      eligible.map(async (s) => {
        try {
          const res = await fetch(`/api/drafts/${s.id}/approve`, { method: 'POST' })
          if (res.ok) ok++
          else failed++
        } catch {
          failed++
        }
      }),
    )
    if (ok > 0) toast.success(`Approved ${ok} draft${ok === 1 ? '' : 's'} · queued for Postiz`)
    if (failed > 0) toast.error(`${failed} approval${failed === 1 ? '' : 's'} failed`)
    void load(weekStart ?? undefined)
  }

  const handlePushToPostiz = () => {
    const approved = slots.filter((s) => s.status === 'approved')
    toast.info(
      approved.length
        ? `${approved.length} drafts already queued · check Postiz calendar`
        : 'Nothing approved yet — approve drafts first',
    )
  }

  const handleApproveOne = async (id: string) => {
    try {
      const res = await fetch(`/api/drafts/${id}/approve`, { method: 'POST' })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(json.error ?? 'Approve failed')
        return
      }
      toast.success('Approved · uploading to Postiz')
      setSelectedId(null)
      void load(weekStart ?? undefined)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Approve failed')
    }
  }

  const weekRange = weekStart ? formatRange(weekStart) : '—'

  return (
    <>
      <WeekHeader
        filter={filter}
        onFilter={setFilter}
        onApproveAll={handleApproveAll}
        onPushToPostiz={handlePushToPostiz}
        slots={slots}
        weekRange={weekRange}
      />

      <div className="mb-3 grid grid-cols-7 gap-3">
        {DAY_LABELS.map((day) => (
          <div key={day} className="flex items-baseline justify-between px-1">
            <span
              className="text-[11px] uppercase tracking-[0.16em] text-text-muted"
              style={{ fontFamily: 'var(--font-display), sans-serif' }}
            >
              {day}
            </span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-3">
        {slots.map((slot, i) => {
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

      {loading && (
        <p className="mt-6 text-center text-[12px] text-text-muted">Loading drafts…</p>
      )}

      <DetailRail
        draft={selected}
        onClose={() => setSelectedId(null)}
        onApprove={handleApproveOne}
      />
    </>
  )
}
