/**
 * Catjack Studio · Pattern Miner agent.
 *
 * Reads pattern_performance + recent inspo + posted-video metrics,
 * produces a ranked weekly playbook the Scriptwriter conditions on.
 *
 * The deterministic miner (src/lib/pattern-miner.ts) computes raw stats.
 * This agent layers reasoning on top — *which* patterns to lean into
 * this week given seasonality, novelty, and brand fit.
 */

import { runAgent, brandSystemPrompt } from './anthropic'
import { serviceClient } from '../supabase'

export interface PlaybookEntry {
  pattern_id: string
  pattern_name: string
  rank: number // 1..10, 1 = strongest
  rationale: string
  use_for: string[] // hook | cta | structure | etc.
  weight: number // 0..1 how much to bias generations toward this pattern
}

export interface MinerOutput {
  playbook: PlaybookEntry[]
  retired: string[] // pattern_ids to deprioritise this week
  notes: string // 1-2 sentence weekly rationale
}

const SYSTEM = brandSystemPrompt(`
Your job is the weekly Pattern Miner. You decide which structural patterns
the studio should lean on for the upcoming Sunday batch.

You receive:
  - rolling 30-day pattern performance (avg LTV per pattern × platform)
  - rolling 7-day deltas (which patterns are rising / decaying)
  - the studio's currently posted video count + dates
  - any human-added context the user pinned to specific inspo videos

You return a top-10 playbook, ranked, with a brand-aware rationale per pick.
Bias toward Catjack-friendly patterns — favour clarity, big emotion, and
clear CTAs. Avoid ironic-tone or static-static patterns even if the numbers
look ok.

If a pattern is decaying, retire it for this week unless human context
explicitly says to keep it.
`)

const SCHEMA = {
  type: 'object',
  required: ['playbook', 'retired', 'notes'],
  properties: {
    playbook: {
      type: 'array',
      maxItems: 10,
      items: {
        type: 'object',
        required: ['pattern_id', 'pattern_name', 'rank', 'rationale', 'use_for', 'weight'],
        properties: {
          pattern_id:   { type: 'string' },
          pattern_name: { type: 'string' },
          rank:         { type: 'integer', minimum: 1, maximum: 10 },
          rationale:    { type: 'string', maxLength: 280 },
          use_for:      { type: 'array', items: { type: 'string' } },
          weight:       { type: 'number', minimum: 0, maximum: 1 },
        },
      },
    },
    retired: { type: 'array', items: { type: 'string' } },
    notes:   { type: 'string', maxLength: 320 },
  },
}

export async function runPatternMinerAgent(): Promise<MinerOutput> {
  const supabase = serviceClient()

  // 30-day perf snapshot (current).
  const { data: perf30 } = await supabase
    .from('studio_pattern_performance')
    .select('pattern_id, platform, sample_size, avg_ltv, delta_pct, trend')
    .eq('window_days', 30)

  // 7-day deltas.
  const { data: perf7 } = await supabase
    .from('studio_pattern_performance')
    .select('pattern_id, platform, sample_size, avg_ltv, delta_pct, trend')
    .eq('window_days', 7)

  // Pattern names.
  const { data: taxonomy } = await supabase
    .from('studio_inspo_patterns')
    .select('id, name, category, description')

  // Recent human-pinned context from inspo videos (last 60 days).
  const sinceIso = new Date(Date.now() - 60 * 86_400_000).toISOString()
  const { data: pinned } = await supabase
    .from('studio_inspo_videos')
    .select('title, channel, user_context, patterns')
    .gte('imported_at', sinceIso)
    .not('user_context', 'is', null)

  const input = [
    `30-DAY PATTERN PERFORMANCE (${perf30?.length ?? 0} rows):`,
    JSON.stringify(perf30 ?? [], null, 2),
    '',
    `7-DAY DELTAS (${perf7?.length ?? 0} rows):`,
    JSON.stringify(perf7 ?? [], null, 2),
    '',
    `PATTERN TAXONOMY (${taxonomy?.length ?? 0} rows):`,
    JSON.stringify(taxonomy ?? [], null, 2),
    '',
    `HUMAN CONTEXT ON RECENT INSPO (${pinned?.length ?? 0} entries):`,
    JSON.stringify(pinned ?? [], null, 2),
  ].join('\n')

  const result = await runAgent<MinerOutput>({
    system: SYSTEM,
    input,
    outputToolName: 'submit_playbook',
    outputToolDescription: 'Submit the ranked weekly playbook.',
    outputSchema: SCHEMA,
    model: 'claude-opus-4-7',
    temperature: 0.3,
  })

  return result.output
}
