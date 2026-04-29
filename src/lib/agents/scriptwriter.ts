/**
 * Catjack Studio · Scriptwriter agent.
 *
 * Per-video. Takes a brief + the playbook context, outputs a script
 * the Director can shoot from: hook line, beats, on-screen text plan,
 * narration, CTA, plus per-platform caption variants.
 */

import { runAgent, brandSystemPrompt } from './anthropic'
import type { Platform } from '../types'
import type { VideoBrief } from './calendar-planner'
import type { PlaybookEntry } from './pattern-miner'

export interface ScriptBeat {
  t: string // timestamp like "0:00" or "0:02.4"
  visual: string // what's on screen
  voice?: string // optional VO line
  on_screen_text?: { text: string; style: string }
}

export interface ScriptOutput {
  hook: string // verbatim opening line + cue
  beats: ScriptBeat[]
  cta: { t: string; wording: string }
  duration_estimate_seconds: number
  captions: Record<Platform, string>
  patterns_used: string[] // pattern_ids actually leaned on
}

const SYSTEM = brandSystemPrompt(`
You are the Scriptwriter. Given a brief + playbook, write a tight
short-form video script the Director can shoot in 8-25 seconds.

Constraints:
  - Hook lands inside the first 1.5 seconds. State it as both visual + audio cue.
  - 3-7 beats total. Each beat is a single shot.
  - On-screen text is sparse — never more than 6 words at once.
  - Brand voice: warm, playful, kid-safe. NEVER ironic. NEVER sarcastic.
  - CTA fires between 0:06-0:10. Make it concrete ("Pick yours" not "Engage").
  - Caption variants per platform: TikTok punchy, YouTube descriptive, Instagram aesthetic.
  - patterns_used must be a subset of the brief's pattern_targets.
`)

const SCHEMA = {
  type: 'object',
  required: ['hook', 'beats', 'cta', 'duration_estimate_seconds', 'captions', 'patterns_used'],
  properties: {
    hook: { type: 'string', maxLength: 240 },
    beats: {
      type: 'array',
      minItems: 3,
      maxItems: 7,
      items: {
        type: 'object',
        required: ['t', 'visual'],
        properties: {
          t: { type: 'string' },
          visual: { type: 'string', maxLength: 280 },
          voice: { type: 'string', maxLength: 200 },
          on_screen_text: {
            type: 'object',
            required: ['text', 'style'],
            properties: {
              text:  { type: 'string', maxLength: 60 },
              style: { type: 'string', maxLength: 60 },
            },
          },
        },
      },
    },
    cta: {
      type: 'object',
      required: ['t', 'wording'],
      properties: {
        t:       { type: 'string' },
        wording: { type: 'string', maxLength: 80 },
      },
    },
    duration_estimate_seconds: { type: 'number', minimum: 5, maximum: 60 },
    captions: {
      type: 'object',
      required: ['tiktok', 'youtube', 'instagram'],
      properties: {
        tiktok:    { type: 'string', maxLength: 280 },
        youtube:   { type: 'string', maxLength: 280 },
        instagram: { type: 'string', maxLength: 280 },
      },
    },
    patterns_used: { type: 'array', items: { type: 'string' } },
  },
}

export interface ScriptwriterArgs {
  brief: VideoBrief
  playbook: PlaybookEntry[]
}

export async function runScriptwriter(args: ScriptwriterArgs): Promise<ScriptOutput> {
  const relevantPlaybook = args.playbook.filter((p) =>
    args.brief.pattern_targets.includes(p.pattern_id),
  )

  const input = [
    'BRIEF:',
    JSON.stringify(args.brief, null, 2),
    '',
    'RELEVANT PLAYBOOK PATTERNS:',
    JSON.stringify(relevantPlaybook, null, 2),
    '',
    'Write the script.',
  ].join('\n')

  const result = await runAgent<ScriptOutput>({
    system: SYSTEM,
    input,
    outputToolName: 'submit_script',
    outputToolDescription: 'Submit the finished script.',
    outputSchema: SCHEMA,
    model: 'claude-opus-4-7',
    temperature: 0.7,
  })

  return result.output
}
