/**
 * Catjack Studio · Calendar Planner agent.
 *
 * Takes the playbook + the upcoming week's calendar slots and produces
 * 28 distinct video briefs — one per slot. Each brief is a tight
 * description the Scriptwriter expands.
 */

import { runAgent, brandSystemPrompt } from './anthropic'
import type { Platform } from '../types'
import type { PlaybookEntry } from './pattern-miner'

export interface VideoBrief {
  slot_day: number // 0=Mon..6=Sun
  slot_index: number // 0..3
  platform: Platform
  theme: string // 1-line theme
  hook_idea: string // first 3 seconds
  pattern_targets: string[] // pattern_ids to lean on
  why: string // 1-line strategic note
}

export interface PlannerOutput {
  briefs: VideoBrief[]
  notes: string
}

const SYSTEM = brandSystemPrompt(`
You are the Calendar Planner. You produce 28 distinct briefs — one per
slot in the upcoming week (7 days × 4 slots: 7am, 12pm, 4pm, 8pm UTC).

Constraints:
  - Each brief MUST be different from every other brief that week.
  - Distribute platforms across the week so we don't post 28 TikToks in a row.
    Default mix: 16 TikTok, 8 YouTube Shorts, 4 Instagram Reels.
  - Lean on the playbook patterns; high-weight patterns appear in 2-3
    briefs, low-weight in at most 1.
  - Match slot timing to content type — early-morning slots stay calm,
    afternoon slots can be high-energy.
  - Avoid retired patterns entirely.
  - Keep hook_idea concrete (visual + audio cue), not abstract.
`)

const SCHEMA = {
  type: 'object',
  required: ['briefs', 'notes'],
  properties: {
    briefs: {
      type: 'array',
      minItems: 28,
      maxItems: 28,
      items: {
        type: 'object',
        required: ['slot_day', 'slot_index', 'platform', 'theme', 'hook_idea', 'pattern_targets', 'why'],
        properties: {
          slot_day:        { type: 'integer', minimum: 0, maximum: 6 },
          slot_index:      { type: 'integer', minimum: 0, maximum: 3 },
          platform:        { type: 'string', enum: ['tiktok', 'youtube', 'instagram'] },
          theme:           { type: 'string', maxLength: 200 },
          hook_idea:       { type: 'string', maxLength: 280 },
          pattern_targets: { type: 'array', items: { type: 'string' } },
          why:             { type: 'string', maxLength: 200 },
        },
      },
    },
    notes: { type: 'string', maxLength: 320 },
  },
}

export interface PlannerArgs {
  weekStart: string // ISO date (Monday)
  playbook: PlaybookEntry[]
  retired: string[]
  /** Optional weekly themes (e.g. "Easter week", "Magic World launch"). */
  weeklyTheme?: string
}

export async function runCalendarPlanner(args: PlannerArgs): Promise<PlannerOutput> {
  const input = [
    `WEEK START (Mon): ${args.weekStart}`,
    `WEEKLY THEME: ${args.weeklyTheme ?? '(none — default cadence)'}`,
    '',
    `PLAYBOOK (top ${args.playbook.length}):`,
    JSON.stringify(args.playbook, null, 2),
    '',
    `RETIRED PATTERNS (avoid):`,
    JSON.stringify(args.retired, null, 2),
    '',
    'Produce exactly 28 briefs — one per (slot_day, slot_index) pair where',
    'slot_day is 0=Mon..6=Sun and slot_index is 0..3 (7am, 12pm, 4pm, 8pm).',
  ].join('\n')

  const result = await runAgent<PlannerOutput>({
    system: SYSTEM,
    input,
    outputToolName: 'submit_calendar',
    outputToolDescription: 'Submit the 28-slot weekly calendar.',
    outputSchema: SCHEMA,
    model: 'claude-opus-4-7',
    temperature: 0.6,
    maxTokens: 8192,
  })

  return result.output
}
