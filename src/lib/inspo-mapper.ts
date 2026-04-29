/**
 * Map a Supabase row → the camelCase shape the UI components already
 * consume (InspoVideo from src/lib/fixtures.ts).
 *
 * Lets the UI stay stable while the backend replaces fixtures with
 * real DB data. When we generate Supabase types in a follow-up, this
 * mapper is the seam to delete.
 */

import { mascot } from './cloudinary'
import type { InspoVideoRow, CommentIntentRow, VideoAnalysisJson } from './types'
import type { InspoVideo, CommentIntent } from './fixtures'

const PLACEHOLDER_THUMBS = [
  mascot.jumpingForJoy,
  mascot.happyConfetti,
  mascot.shopping,
  mascot.pointing,
  mascot.oneHandWave,
  mascot.chuffed,
  mascot.reading,
] as const

/** Pick a fallback thumbnail from the Cloudinary library when none ingested. */
function fallbackThumb(seed: string): string {
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0
  return PLACEHOLDER_THUMBS[Math.abs(hash) % PLACEHOLDER_THUMBS.length]
}

/** "12.4M views · 18s ago" style relative time. */
function relativeTime(iso: string): string {
  const seconds = Math.max(1, Math.floor((Date.now() - Date.parse(iso)) / 1000))
  if (seconds < 60)        return `${seconds}s ago`
  if (seconds < 3600)      return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86_400)    return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 604_800)   return `${Math.floor(seconds / 86_400)} days ago`
  if (seconds < 2_592_000) return `${Math.floor(seconds / 604_800)} weeks ago`
  return `${Math.floor(seconds / 2_592_000)} months ago`
}

/** Format duration_seconds → "0:18". */
function formatDuration(s: number | null): string {
  if (!s || s < 1) return '0:00'
  const m = Math.floor(s / 60)
  const sec = String(s % 60).padStart(2, '0')
  return `${m}:${sec}`
}

export function inspoRowToView(
  row: InspoVideoRow,
  intents: CommentIntentRow[] = [],
): InspoVideo {
  const channel = row.channel ?? '@unknown'
  const a: VideoAnalysisJson | null = row.analysis ?? null

  return {
    id: row.id,
    thumbnail: row.thumbnail_url ?? fallbackThumb(row.id),
    title: row.title ?? '(untitled)',
    channel,
    platform: row.platform,
    views: row.views_text ?? '—',
    likeRatio: row.like_ratio != null ? Number((row.like_ratio * 100).toFixed(1)) : 0,
    comments: row.comments_text ?? '—',
    shares: row.shares_text ?? '—',
    replayMentions: row.replay_mentions,
    whyItWon: a?.hookPattern
      ? `${a.hookSeconds} · ${a.hookPattern}. Cuts ${a.cutsPerSecOpen}cps open, drops to ${a.cutsPerSecRest}cps. CTA "${a.ctaWording}" at ${a.ctaTiming}.`
      : 'Imported — analysis pending.',
    patterns: row.patterns,
    tier: row.tier ?? 'common',
    duration: formatDuration(row.duration_seconds),
    importedAt: relativeTime(row.imported_at),
    topPatternConfidence: row.top_pattern_confidence ?? 0,
    analysis: a ?? undefined,
    commentIntents: intents.map<CommentIntent>((i) => ({
      bucket: i.bucket,
      count: i.count,
      example: i.example_quote ?? '',
    })),
    userContext: row.user_context ?? undefined,
  }
}
