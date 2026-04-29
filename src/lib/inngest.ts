/**
 * Catjack Studio · Inngest client + function registry.
 *
 * The Inngest client is the bridge between our Vercel-deployed Next.js
 * app and the Inngest cloud orchestrator. We define functions (cron
 * triggers + event handlers) here and export them via the registry —
 * /api/inngest/route.ts mounts the registry so Inngest can introspect
 * + invoke each function.
 */

import { Inngest, type EventPayload } from 'inngest'
import { env } from './op'

// Define the typed event surface up front so callers get autocomplete.
export interface CatjackEvents {
  /** Manual trigger from the Studio "Run batch now" button. */
  'studio/batch.manual.requested': {
    data: { trigger: 'manual' | 'webhook'; weekStart?: string }
  }
  /** Sunday cron auto-trigger — fires from Inngest's schedule. */
  'studio/batch.cron.fired': {
    data: { weekStart: string }
  }
  /** Per-video brief produced by the Calendar Planner agent. */
  'studio/video.brief.ready': {
    data: {
      runId: string
      slot: { day: number; index: number; platform: string; timeLabel: string }
      brief: Record<string, unknown>
    }
  }
  /** A draft has finished generating and is ready for the Critic. */
  'studio/video.draft.ready': {
    data: { runId: string; draftId: string }
  }
  /** Inspo URL just imported — kicks off pattern remine async. */
  'studio/inspo.imported': {
    data: { videoId: string }
  }
  /** A reviewer (or auto-approve) requested publish for a single draft. */
  'studio/draft.publish.requested': {
    data: {
      draftId: string
      /** ISO timestamp; if absent we publish "now". */
      scheduledFor?: string
      /** If true, bypass critic floor. Default: respect critic verdict. */
      force?: boolean
      /** Who triggered: 'human' (UI) or 'auto' (critic auto-approve). */
      requestedBy: 'human' | 'auto'
    }
  }
}

let _client: Inngest | null = null

/**
 * Lazy singleton client. Resolves keys at first use so import-time
 * doesn't crash when secrets aren't yet set (e.g. during build).
 */
export function inngest(): Inngest {
  if (_client) return _client
  const cfg = env.inngest()
  _client = new Inngest({
    id: 'catjack-studio',
    name: 'Catjack Studio',
    eventKey: cfg.eventKey,
    signingKey: cfg.signingKey,
  })
  return _client
}

/** Re-export Inngest's EventPayload for callers that need it. */
export type { EventPayload }
