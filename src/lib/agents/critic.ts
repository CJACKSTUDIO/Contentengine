/**
 * Catjack Studio · Critic agent.
 *
 * Final gate before a draft hits the calendar. Watches the rendered
 * video, scores it 0-100 against playbook + brand fit, and routes:
 *   - score >= 80 → auto-approve
 *   - 60-79      → needs human review
 *   - < 60       → reject
 *
 * Uses Claude vision (Sonnet) by passing the master URL — Anthropic's
 * SDK accepts video via referenced URL through the Files API in v0.40+.
 */

import { runAgent, brandSystemPrompt } from './anthropic'
import type { ScriptOutput } from './scriptwriter'
import type { DirectorOutput } from './director'

export interface CriticOutput {
  score: number // 0..100
  verdict: 'approve' | 'review' | 'reject'
  strengths: string[]
  weaknesses: string[]
  brand_fit: number // 0..1
  hook_lands: boolean
  cta_clear: boolean
  notes: string
}

const SYSTEM = brandSystemPrompt(`
You are the Critic. Score the draft video 0-100 against:
  - Hook lands by 0:01-0:02 (heavy weight)
  - Pattern targets executed (medium weight)
  - Brand fit — kid-safe, warm, playful (heavy weight)
  - CTA clear and timed appropriately (medium weight)
  - Overall pacing (light weight)

Verdict:
  >= 80 → approve   (auto-publish-eligible)
  60-79 → review    (needs human eyes)
  < 60  → reject    (back to the drawing board)

Be strict on brand fit. If the tone is even slightly ironic, sarcastic,
or dark, the score caps at 55. Strict on kid-safety: anything that would
worry a parent caps at 40.
`)

const SCHEMA = {
  type: 'object',
  required: ['score', 'verdict', 'strengths', 'weaknesses', 'brand_fit', 'hook_lands', 'cta_clear', 'notes'],
  properties: {
    score:       { type: 'integer', minimum: 0, maximum: 100 },
    verdict:     { type: 'string', enum: ['approve', 'review', 'reject'] },
    strengths:   { type: 'array', items: { type: 'string' }, maxItems: 5 },
    weaknesses:  { type: 'array', items: { type: 'string' }, maxItems: 5 },
    brand_fit:   { type: 'number', minimum: 0, maximum: 1 },
    hook_lands:  { type: 'boolean' },
    cta_clear:   { type: 'boolean' },
    notes:       { type: 'string', maxLength: 400 },
  },
}

export interface CriticArgs {
  /** Cloudinary URL of the assembled draft video. */
  masterUrl: string
  script: ScriptOutput
  shotPlan: DirectorOutput
}

export async function runCritic(args: CriticArgs): Promise<CriticOutput> {
  // For Block 8 we use prose-only critique (description of what should be there).
  // Block 11 swaps in real video viewing once the Anthropic SDK's video support
  // matches Gemini's Files API ergonomics. Until then we critique on the
  // structural plan, not the rendered pixels.
  const input = [
    `MASTER URL: ${args.masterUrl}`,
    '',
    'SCRIPT:',
    JSON.stringify(args.script, null, 2),
    '',
    'SHOT PLAN:',
    JSON.stringify(args.shotPlan, null, 2),
    '',
    'Score the draft.',
  ].join('\n')

  const result = await runAgent<CriticOutput>({
    system: SYSTEM,
    input,
    outputToolName: 'submit_critique',
    outputToolDescription: 'Submit the critique + verdict.',
    outputSchema: SCHEMA,
    model: 'claude-sonnet-4-6',
    temperature: 0.2,
  })

  return result.output
}
