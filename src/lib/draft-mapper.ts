/**
 * DraftRow (DB) → DraftSlot (UI) mapper.
 *
 * Keeps the calendar component blissfully unaware of the SQL schema.
 * Returned shape mirrors src/lib/fixtures.ts so existing components
 * keep working as we cut over from fixtures to live data.
 */

import type { DraftRow, AgentTraceEntry } from './types'
import type { DraftSlot, Platform } from './fixtures'

const SLOT_TIME_LABELS = ['7:00am', '12:00pm', '4:00pm', '8:00pm']
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function draftRowToSlot(row: DraftRow): DraftSlot {
  return {
    id: row.id,
    day: row.slot_day,
    slotIndex: row.slot_index,
    timeLabel: SLOT_TIME_LABELS[row.slot_index] ?? row.slot_time_label,
    status: row.status,
    platform: (row.platform ?? undefined) as Platform | undefined,
    thumbnail: row.thumbnail_url ?? undefined,
    title: row.title ?? undefined,
    hook: row.hook ?? undefined,
    patterns: row.patterns?.length ? row.patterns : undefined,
    criticScore: row.critic_score ?? undefined,
    brief: row.brief ?? undefined,
    captions: row.captions ?? undefined,
    agentTrace: (row.agent_trace ?? undefined) as
      | { agent: string; thought: string; t: string }[]
      | undefined,
  }
}

/**
 * Build all 28 slot positions for a week, overlaying any rows that
 * exist in the DB. Empty positions get a placeholder DraftSlot with
 * status='empty' and a synthetic id so React keys stay unique.
 */
export function buildWeekSlots(rows: DraftRow[], weekStart: string): DraftSlot[] {
  const byKey = new Map<string, DraftRow>()
  rows.forEach((r) => byKey.set(`${r.slot_day}-${r.slot_index}`, r))

  const slots: DraftSlot[] = []
  for (let day = 0; day < 7; day++) {
    for (let idx = 0; idx < 4; idx++) {
      const row = byKey.get(`${day}-${idx}`)
      if (row) {
        slots.push(draftRowToSlot(row))
      } else {
        slots.push({
          id: `empty-${weekStart}-${day}-${idx}`,
          day,
          slotIndex: idx,
          timeLabel: SLOT_TIME_LABELS[idx],
          status: 'empty',
        })
      }
    }
  }
  return slots
}

/** Format a Date as `YYYY-MM-DD` aligned to that ISO week's Monday (UTC). */
export function isoWeekStart(d: Date = new Date()): string {
  const utc = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
  const day = utc.getUTCDay() || 7
  if (day !== 1) utc.setUTCDate(utc.getUTCDate() - (day - 1))
  return utc.toISOString().slice(0, 10)
}

export { DAY_LABELS, SLOT_TIME_LABELS }
export type { AgentTraceEntry }
