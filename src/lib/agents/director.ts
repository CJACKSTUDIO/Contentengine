/**
 * Catjack Studio · Director agent.
 *
 * Per-video. Takes a script + reference assets, outputs a shot plan:
 *   - which generator to use per shot (Seedance / gpt-image-2 / Leonardo / Rive)
 *   - aesthetic notes per shot
 *   - reference asset bindings
 *   - audio plan (narration vs music vs silence)
 *
 * Block 10 picks up the shot plan and dispatches the generators.
 */

import { runAgent, brandSystemPrompt } from './anthropic'
import type { ScriptOutput, ScriptBeat } from './scriptwriter'

export type Generator = 'seedance' | 'gpt-image-2' | 'leonardo' | 'rive'

export interface DirectorShot {
  t: string
  generator: Generator
  prompt: string // generator-ready prompt
  reference_assets: string[] // public_ids from studio_reference_assets
  aesthetic_notes: string
  beat_index: number // points back to ScriptOutput.beats[i]
}

export interface DirectorOutput {
  shots: DirectorShot[]
  audio_plan: {
    narration: boolean
    music_genre?: string
    sfx?: string[]
  }
  style_profile_id?: string // optional pinned profile
}

const SYSTEM = brandSystemPrompt(`
You are the Director. Given a script + the available reference assets,
sequence the shots and pick a generator per shot.

Generator selection rules:
  - seedance:    motion-heavy, character animation, atmospheric backdrops, transitions
  - gpt-image-2: still hero shots with on-screen text rendered cleanly, UI overlays
  - leonardo:    high-detail product/card/object stills (cards, packs, props)
  - rive:        looping animations, gold-sheen transitions, micro-interactions

Constraints:
  - Always use Seedance for any beat that requires motion across >0.5s.
  - Use gpt-image-2 for any beat with rendered on-screen text > 4 words.
  - Reference assets must come from the provided list — never invent IDs.
  - Aesthetic notes should reference the brand: "deep purples + gold rim light",
    "soft cyan teal", etc. Not generic.
`)

const SCHEMA = {
  type: 'object',
  required: ['shots', 'audio_plan'],
  properties: {
    shots: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        required: ['t', 'generator', 'prompt', 'reference_assets', 'aesthetic_notes', 'beat_index'],
        properties: {
          t: { type: 'string' },
          generator: { type: 'string', enum: ['seedance', 'gpt-image-2', 'leonardo', 'rive'] },
          prompt: { type: 'string', maxLength: 1200 },
          reference_assets: { type: 'array', items: { type: 'string' } },
          aesthetic_notes: { type: 'string', maxLength: 240 },
          beat_index: { type: 'integer', minimum: 0 },
        },
      },
    },
    audio_plan: {
      type: 'object',
      required: ['narration'],
      properties: {
        narration:   { type: 'boolean' },
        music_genre: { type: 'string', maxLength: 80 },
        sfx:         { type: 'array', items: { type: 'string' } },
      },
    },
    style_profile_id: { type: 'string' },
  },
}

export interface DirectorArgs {
  script: ScriptOutput
  /** Reference assets available to bind into shots. */
  availableAssets: { id: string; public_id: string; title: string; category: string }[]
  /** Optional named style profile to bias the look. */
  stylePromptFragment?: string
}

export async function runDirector(args: DirectorArgs): Promise<DirectorOutput> {
  const input = [
    'SCRIPT:',
    JSON.stringify(
      {
        hook: args.script.hook,
        beats: args.script.beats.map((b: ScriptBeat, i: number) => ({ index: i, ...b })),
        cta: args.script.cta,
        duration: args.script.duration_estimate_seconds,
      },
      null,
      2,
    ),
    '',
    `AVAILABLE REFERENCE ASSETS (${args.availableAssets.length}):`,
    JSON.stringify(args.availableAssets, null, 2),
    '',
    args.stylePromptFragment ? `PINNED STYLE FRAGMENT:\n${args.stylePromptFragment}` : '',
    '',
    'Produce the shot plan.',
  ].join('\n')

  const result = await runAgent<DirectorOutput>({
    system: SYSTEM,
    input,
    outputToolName: 'submit_shot_plan',
    outputToolDescription: 'Submit the per-shot generator plan.',
    outputSchema: SCHEMA,
    model: 'claude-sonnet-4-6',
    temperature: 0.4,
  })

  return result.output
}
