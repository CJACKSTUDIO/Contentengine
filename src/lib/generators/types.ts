/**
 * Generator interface — every concrete generator (Seedance, gpt-image-2,
 * Leonardo, Rive) implements this so the router can swap them
 * transparently. Each call returns a Cloudinary URL of the produced
 * asset, ready to feed the stitch step.
 */

export interface GeneratorInput {
  /** Generator-ready prompt from the Director agent. */
  prompt: string
  /** Cloudinary public_ids of reference assets to bind into the gen. */
  reference_assets: string[]
  /** Aesthetic notes from the Director, passed verbatim. */
  aesthetic_notes: string
  /** Per-shot duration in seconds (only honoured by video gens). */
  duration_seconds?: number
  /** Output resolution. Defaults to 1080×1920 (9:16 vertical). */
  width?: number
  height?: number
  /** Used to scope Cloudinary uploads under draft/<id>/<beat>. */
  draft_id: string
  beat_index: number
}

export interface GeneratorOutput {
  /** Cloudinary URL of the produced asset. */
  url: string
  /** "image" or "video" — drives how the stitch step treats it. */
  kind: 'image' | 'video'
  /** Generator that produced this output (post-fallback). */
  generator: string
  /** Total wall-clock duration including upload, in ms. */
  duration_ms: number
}

export interface Generator {
  /** Stable id matching the Director's enum. */
  id: 'seedance' | 'gpt-image-2' | 'leonardo' | 'rive'
  generate(input: GeneratorInput): Promise<GeneratorOutput>
}

/** What we throw when a generator gives up (router catches + falls back). */
export class GeneratorError extends Error {
  generator: string
  constructor(generator: string, message: string) {
    super(message)
    this.name = 'GeneratorError'
    this.generator = generator
  }
}
