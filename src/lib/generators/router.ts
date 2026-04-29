/**
 * Generator router. Dispatches a shot to the requested generator,
 * falls back through a sensible chain on failure.
 *
 * Fallback chains (per primary):
 *   seedance      → leonardo (image still) → gpt-image-2
 *   gpt-image-2   → leonardo → seedance (1s clip)
 *   leonardo      → gpt-image-2 → seedance
 *   rive          → cloudinary lookup → gpt-image-2
 *
 * For Block 10 we ship Seedance + gpt-image-2 as the only real
 * generators. The Leonardo + Rive shells fall through to one of
 * those automatically until Block 14 lights them up.
 */

import { seedance } from './seedance'
import { gptImage } from './gpt-image'
import type { Generator, GeneratorInput, GeneratorOutput } from './types'
import { GeneratorError } from './types'

const REGISTRY: Record<string, Generator> = {
  seedance: seedance,
  'gpt-image-2': gptImage,
  // leonardo + rive added in later blocks. For now they alias.
  leonardo: gptImage,
  rive: gptImage,
}

const FALLBACK_CHAIN: Record<string, string[]> = {
  seedance:      ['seedance', 'gpt-image-2'],
  'gpt-image-2': ['gpt-image-2', 'seedance'],
  leonardo:      ['gpt-image-2', 'seedance'],
  rive:          ['gpt-image-2', 'seedance'],
}

export interface RouteResult {
  output: GeneratorOutput
  /** Which generators were tried in order. */
  attempts: { generator: string; ok: boolean; error?: string }[]
}

export async function route(
  preferred: 'seedance' | 'gpt-image-2' | 'leonardo' | 'rive',
  input: GeneratorInput,
): Promise<RouteResult> {
  const chain = FALLBACK_CHAIN[preferred] ?? ['seedance']
  const attempts: RouteResult['attempts'] = []

  for (const id of chain) {
    const gen = REGISTRY[id]
    if (!gen) {
      attempts.push({ generator: id, ok: false, error: 'Generator not registered' })
      continue
    }
    try {
      const output = await gen.generate(input)
      attempts.push({ generator: id, ok: true })
      return { output, attempts }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      attempts.push({ generator: id, ok: false, error: msg })
      // eslint-disable-next-line no-console
      console.warn(`[router] ${id} failed for draft ${input.draft_id} beat ${input.beat_index}: ${msg}`)
    }
  }

  throw new GeneratorError(
    preferred,
    `All generators in chain failed: ${attempts.map((a) => `${a.generator}:${a.error ?? 'ok'}`).join(' / ')}`,
  )
}
