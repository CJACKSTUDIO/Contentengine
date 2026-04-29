/**
 * Tier classifier for an inspo video.
 *
 * Rules-of-thumb based on observed engagement on viral kids/family
 * content. The Curator agent will refine these in Block 8 with
 * playbook-aware reasoning, but for the initial classification we
 * just use raw engagement signals.
 */

import type { InspoTier } from './types'

interface ClassifyArgs {
  views: number | null
  like_count: number | null
  comment_count: number | null
  replay_mentions: number | null
}

/** Compute like-to-view ratio in percent (e.g. 4.2 means 4.2%). */
function ltvPct(args: ClassifyArgs): number {
  if (!args.views || args.views < 1000 || !args.like_count) return 0
  return (args.like_count / args.views) * 100
}

export function classifyTier(args: ClassifyArgs): InspoTier {
  const ltv = ltvPct(args)
  const replays = args.replay_mentions ?? 0

  if (ltv >= 5.0 || replays >= 100) return 'ultra-rare'
  if (ltv >= 4.0 || replays >= 30) return 'magic'
  if (ltv >= 3.0 || replays >= 10) return 'rare'
  return 'common'
}

/** Format raw view count to display string ("12.4M", "870K"). */
export function formatViewCount(n: number | null | undefined): string {
  if (n == null) return '—'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}
