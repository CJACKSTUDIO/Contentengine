/**
 * Catjack Studio · Curator agent.
 *
 * After all 28 drafts are scored, the Curator ranks them and assigns
 * the optimal posting slot per platform. Runs once at the end of the
 * batch — not per video.
 *
 * For Block 8 it's a deterministic ranker (no Claude call). The
 * agent-shaped wrapper keeps the API consistent so Block 12 (Postiz
 * publish) can plug in without code changes.
 */

import type { CriticOutput } from './critic'
import type { Platform } from '../types'

export interface CuratorScoredDraft {
  draft_id: string
  platform: Platform
  slot_day: number
  slot_index: number
  critic: CriticOutput
}

export interface CuratorRanked {
  draft_id: string
  rank: number // 1..N within batch
  scheduled_for: string // ISO timestamp
}

export interface CuratorOutput {
  ranked: CuratorRanked[]
  rejected: string[]
  notes: string
}

/**
 * Slot index → wall-clock time (UTC). Matches DraftSlot fixture.
 */
const SLOT_HOUR: Record<number, number> = { 0: 7, 1: 12, 2: 16, 3: 20 }

interface CuratorArgs {
  weekStart: string // ISO date (Mon)
  scored: CuratorScoredDraft[]
}

export function runCurator(args: CuratorArgs): CuratorOutput {
  const weekStart = new Date(`${args.weekStart}T00:00:00Z`)

  // Reject anything verdict='reject' outright.
  const accepted = args.scored.filter((s) => s.critic.verdict !== 'reject')
  const rejected = args.scored
    .filter((s) => s.critic.verdict === 'reject')
    .map((s) => s.draft_id)

  // Rank: score desc, then brand_fit desc, then hook_lands first.
  const sorted = [...accepted].sort((a, b) => {
    if (b.critic.score !== a.critic.score) return b.critic.score - a.critic.score
    if (b.critic.brand_fit !== a.critic.brand_fit)
      return b.critic.brand_fit - a.critic.brand_fit
    return Number(b.critic.hook_lands) - Number(a.critic.hook_lands)
  })

  const ranked = sorted.map((s, i) => {
    const slotDate = new Date(weekStart)
    slotDate.setUTCDate(weekStart.getUTCDate() + s.slot_day)
    slotDate.setUTCHours(SLOT_HOUR[s.slot_index] ?? 7, 0, 0, 0)
    return {
      draft_id: s.draft_id,
      rank: i + 1,
      scheduled_for: slotDate.toISOString(),
    }
  })

  return {
    ranked,
    rejected,
    notes: `Ranked ${ranked.length} accepted drafts; rejected ${rejected.length}.`,
  }
}
