/**
 * Demo fixtures — UI pass only. Marked for replacement in the backend pass.
 * Every shape here mirrors what the production schema will return so we
 * can swap one source for another without touching components.
 */

import { mascot } from './cloudinary'

export interface RecentWinner {
  id: string
  thumbnail: string
  title: string
  platform: 'tiktok' | 'youtube' | 'instagram'
  views: string
  ltvPct: number
  patterns: string[]
  publishedAt: string
}

export const recentWinners: RecentWinner[] = [
  {
    id: 'w1',
    thumbnail: mascot.jumpingForJoy,
    title: 'When Catjack pulls an Ultra Rare 😲',
    platform: 'tiktok',
    views: '2.4M',
    ltvPct: 5.8,
    patterns: ['big-emotion', '1.6cps', '0:08-CTA'],
    publishedAt: '3 days ago',
  },
  {
    id: 'w2',
    thumbnail: mascot.happyConfetti,
    title: 'Magic World ending — kids losing it',
    platform: 'youtube',
    views: '1.1M',
    ltvPct: 4.2,
    patterns: ['question-hook', 'face-zoom'],
    publishedAt: '5 days ago',
  },
  {
    id: 'w3',
    thumbnail: mascot.oneHandWave,
    title: 'Catjack vs the boss level',
    platform: 'tiktok',
    views: '870K',
    ltvPct: 3.9,
    patterns: ['action-open', '1.4cps'],
    publishedAt: '6 days ago',
  },
  {
    id: 'w4',
    thumbnail: mascot.pointing,
    title: '5 cards, 1 winner — pick yours',
    platform: 'tiktok',
    views: '640K',
    ltvPct: 3.7,
    patterns: ['interactive-prompt', 'split-frame'],
    publishedAt: '1 week ago',
  },
  {
    id: 'w5',
    thumbnail: mascot.shopping,
    title: 'Reaction: Leilani opens the rare pack',
    platform: 'youtube',
    views: '420K',
    ltvPct: 4.6,
    patterns: ['reaction-cam', 'unboxing'],
    publishedAt: '1 week ago',
  },
  {
    id: 'w6',
    thumbnail: mascot.chuffed,
    title: 'Forest world walkthrough secret',
    platform: 'instagram',
    views: '210K',
    ltvPct: 3.2,
    patterns: ['walkthrough', 'whisper-voice'],
    publishedAt: '9 days ago',
  },
]

export interface Agent {
  id: 'curator' | 'pattern-miner' | 'scriptwriter' | 'director' | 'critic'
  name: string
  role: string
  mascot: string
  status: 'idle' | 'running' | 'thinking'
  lastDecision: string
}

export const agentCrew: Agent[] = [
  {
    id: 'curator',
    name: 'Curator',
    role: 'Picks the best inspo + ranks the calendar',
    mascot: mascot.shopping,
    status: 'idle',
    lastDecision: 'Promoted "question-hook + face-zoom" pattern to top of playbook',
  },
  {
    id: 'pattern-miner',
    name: 'Pattern Miner',
    role: 'Extracts winning structures from the corpus',
    mascot: mascot.reading,
    status: 'thinking',
    lastDecision: 'Mining 14 new inspo videos — 3 rising patterns detected',
  },
  {
    id: 'scriptwriter',
    name: 'Scriptwriter',
    role: 'Composes scripts conditioned on the playbook',
    mascot: mascot.pointing,
    status: 'running',
    lastDecision: 'Drafting Wed 4pm slot — magic-world reveal beat',
  },
  {
    id: 'director',
    name: 'Director',
    role: 'Picks generators, sequences shots, manages aesthetics',
    mascot: mascot.oneHandWave,
    status: 'running',
    lastDecision: 'Routed shot 2 to Seedance · shot 3 to gpt-image-2',
  },
  {
    id: 'critic',
    name: 'Critic',
    role: 'Pre-screens drafts before your calendar review',
    mascot: mascot.notBothered,
    status: 'idle',
    lastDecision: 'Scored Tue 9am draft 84/100 — auto-approved',
  },
]

export interface PipelineStat {
  label: string
  value: string
  delta?: string
  trend?: 'up' | 'down' | 'flat'
  hint: string
}

export const weeklyStats: PipelineStat[] = [
  {
    label: 'Posted this week',
    value: '14',
    delta: '+3',
    trend: 'up',
    hint: 'across TikTok + YouTube Shorts',
  },
  {
    label: 'Avg engagement',
    value: '4.2%',
    delta: '+47%',
    trend: 'up',
    hint: 'vs. last week — like + comment + replay proxies',
  },
  {
    label: 'Top pattern',
    value: 'Question hook',
    delta: '5 wins',
    trend: 'up',
    hint: 'used in 5 of the 6 best-performing clips',
  },
  {
    label: 'Generating now',
    value: '2',
    hint: 'Director + Scriptwriter agents working',
  },
]

export interface ActivityEvent {
  id: string
  time: string
  type: 'published' | 'pattern' | 'review' | 'recovered'
  title: string
  detail: string
}

export const activityFeed: ActivityEvent[] = [
  {
    id: 'a1',
    time: '14m ago',
    type: 'published',
    title: 'Posted to TikTok',
    detail: '"When Catjack pulls an Ultra Rare" — went live · 2.4M views in 6h',
  },
  {
    id: 'a2',
    time: '2h ago',
    type: 'pattern',
    title: 'Pattern rising',
    detail: 'Face-zoom hooks +14% LTV this week — Curator auto-promoted',
  },
  {
    id: 'a3',
    time: '4h ago',
    type: 'review',
    title: '4 drafts ready for review',
    detail: 'Sun batch finished — 24 auto-approved, 4 flagged for your eyes',
  },
  {
    id: 'a4',
    time: '6h ago',
    type: 'recovered',
    title: 'Auto-recovered',
    detail: 'Seedance failed on slot 4 — Leonardo finished it in 22s',
  },
]

/* ─── Calendar fixtures ────────────────────────────────────── */

export type DraftStatus = 'empty' | 'generating' | 'needs_review' | 'approved' | 'published' | 'rejected'
export type Platform = 'tiktok' | 'youtube' | 'instagram'

export interface DraftSlot {
  id: string
  /** 0 = Mon, 6 = Sun */
  day: number
  /** 0..3 — slot index within the day */
  slotIndex: number
  /** Display label for the slot's posting time */
  timeLabel: string
  status: DraftStatus
  platform?: Platform
  thumbnail?: string
  title?: string
  hook?: string
  patterns?: string[]
  criticScore?: number
  /** Briefing line for the agent reasoning trace */
  brief?: string
  captions?: Record<Platform, string>
  agentTrace?: { agent: string; thought: string; t: string }[]
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const
const TIME_LABELS = ['7:00am', '12:00pm', '4:00pm', '8:00pm'] as const

/** Build all 28 slots for the week, then overlay the hand-crafted drafts. */
function buildWeek(): DraftSlot[] {
  const slots: DraftSlot[] = []
  for (let d = 0; d < 7; d++) {
    for (let s = 0; s < 4; s++) {
      slots.push({
        id: `${d}-${s}`,
        day: d,
        slotIndex: s,
        timeLabel: `${DAY_LABELS[d]} · ${TIME_LABELS[s]}`,
        status: 'empty',
      })
    }
  }
  for (const d of seededDrafts) {
    const idx = d.day * 4 + d.slotIndex
    slots[idx] = { ...slots[idx], ...d }
  }
  return slots
}

/** Required-fields shape for hand-crafted seed entries. */
type SeedDraft = Pick<DraftSlot, 'id' | 'day' | 'slotIndex' | 'status'> & Partial<DraftSlot>

/** 12 hand-crafted drafts — distributed across the week with realistic variety. */
const seededDrafts: SeedDraft[] = [
  {
    id: '0-0',
    day: 0, slotIndex: 0,
    status: 'published',
    platform: 'tiktok',
    thumbnail: mascot.jumpingForJoy,
    title: 'When Catjack pulls Ultra Rare',
    hook: 'Big-emotion face zoom + sparkle burst',
    patterns: ['big-emotion', 'face-zoom', '0:01-text'],
    criticScore: 92,
    brief: 'Open on Catjack mid-gasp. 4-frame sparkle. Ultra-rare reveal at 0:03.',
    captions: {
      tiktok: 'NO WAY 🤯 #catjack #unboxing #ultrarare',
      youtube: 'When Catjack pulls his rarest card #shorts',
      instagram: 'You won\'t believe what just happened ✨',
    },
    agentTrace: [
      { agent: 'Scriptwriter', thought: 'Question-hook opener + sparkle reveal at peak emotion beat', t: '0.32s' },
      { agent: 'Director', thought: 'Routed sparkle frame to Seedance, base art to gpt-image-2', t: '0.41s' },
      { agent: 'Critic', thought: 'Score 92 — strong hook, clean CTA at 0:08, on-brand', t: '0.18s' },
    ],
  },
  {
    id: '0-2',
    day: 0, slotIndex: 2,
    status: 'approved',
    platform: 'youtube',
    thumbnail: mascot.pointing,
    title: 'Magic World — Level 5 secret',
    hook: 'Pointing tease + dotted path reveal',
    patterns: ['walkthrough', 'whisper-voice', 'reveal-beat'],
    criticScore: 86,
    brief: 'Catjack points off-screen. Camera pans. Hidden door opens.',
    captions: {
      tiktok: 'There\'s a SECRET door in Magic World 🔐',
      youtube: 'Catjack found the hidden Magic World level',
      instagram: 'POV: you discover the secret 🔮',
    },
    agentTrace: [
      { agent: 'Scriptwriter', thought: 'Walkthrough pattern, whisper voice for intimacy', t: '0.28s' },
      { agent: 'Director', thought: 'Long reveal pan = Seedance, no still gen needed', t: '0.34s' },
      { agent: 'Critic', thought: 'Score 86 — strong, slightly slow at 0:06', t: '0.21s' },
    ],
  },
  {
    id: '1-1',
    day: 1, slotIndex: 1,
    status: 'needs_review',
    platform: 'tiktok',
    thumbnail: mascot.shopping,
    title: 'Reaction — opening 5 packs at once',
    hook: 'Shopping bag explosion frame',
    patterns: ['unboxing', 'multi-cam', '1.6cps'],
    criticScore: 71,
    brief: '5 card packs spill from bag, slow-mo reveal of contents.',
    captions: {
      tiktok: '5 packs at once 🤯 which one\'s yours?',
      youtube: 'Catjack opens 5 mystery packs in 60s',
      instagram: 'Five packs. One winner. ✨',
    },
    agentTrace: [
      { agent: 'Scriptwriter', thought: 'Multi-pack opening = high replay potential', t: '0.30s' },
      { agent: 'Director', thought: 'Spill frame on Seedance, contents via Leonardo for crispness', t: '0.45s' },
      { agent: 'Critic', thought: 'Score 71 — pacing inconsistent at 0:04, flagged', t: '0.22s' },
    ],
  },
  {
    id: '1-3',
    day: 1, slotIndex: 3,
    status: 'approved',
    platform: 'tiktok',
    thumbnail: mascot.oneHandWave,
    title: 'Tuesday memory match — 30s challenge',
    hook: 'Wave intro into split-screen game',
    patterns: ['interactive-prompt', 'split-frame', 'countdown'],
    criticScore: 88,
    brief: 'Open on wave, split frame: timer left, board right. Beat the kid\'s record.',
    captions: {
      tiktok: 'Beat my memory record in 30 sec ⏰',
      youtube: 'Memory Match speedrun · 30s challenge',
      instagram: 'Can you beat 30 seconds? ⏱️',
    },
    agentTrace: [
      { agent: 'Scriptwriter', thought: 'Interactive prompt + countdown = strong reply rate', t: '0.27s' },
      { agent: 'Director', thought: 'Split-frame composite via gpt-image-2', t: '0.31s' },
      { agent: 'Critic', thought: 'Score 88 — clean structure, on-brand CTA', t: '0.19s' },
    ],
  },
  {
    id: '2-0',
    day: 2, slotIndex: 0,
    status: 'generating',
    platform: 'youtube',
    title: 'Wed morning — story beat',
    hook: 'Gen in progress · Director routing shots',
    patterns: ['story-beat', 'reveal'],
    brief: 'Catjack discovers an ancient map in the Forest world.',
  },
  {
    id: '2-2',
    day: 2, slotIndex: 2,
    status: 'approved',
    platform: 'instagram',
    thumbnail: mascot.chuffed,
    title: 'Mid-week win compilation',
    hook: 'Chuffed reaction stitched across 3 wins',
    patterns: ['compilation', 'big-emotion', 'cuts-1.4cps'],
    criticScore: 81,
    brief: 'Three quick wins, gold sheen between cuts.',
    captions: {
      tiktok: 'Three wins. One mood. 🥹',
      youtube: 'Wednesday wins 🥹',
      instagram: 'My week so far ✨ #wins',
    },
    agentTrace: [
      { agent: 'Scriptwriter', thought: 'Compilation pattern, gold-sheen transitions', t: '0.26s' },
      { agent: 'Director', thought: 'All 3 clips already in vault, no gen needed', t: '0.12s' },
      { agent: 'Critic', thought: 'Score 81 — solid. Could use stronger hook at 0:00', t: '0.22s' },
    ],
  },
  {
    id: '3-1',
    day: 3, slotIndex: 1,
    status: 'needs_review',
    platform: 'tiktok',
    thumbnail: mascot.notBothered,
    title: 'When the boss level is unfair',
    hook: 'Not-bothered pose + ironic narration',
    patterns: ['ironic-tone', 'narration-led', 'long-cut'],
    criticScore: 64,
    brief: 'Static Catjack, sarcastic VO over chaotic gameplay footage.',
    captions: {
      tiktok: 'me when the boss level cheats 😐',
      youtube: 'Boss level reactions every kid gets',
      instagram: 'Some levels just hit different 😑',
    },
    agentTrace: [
      { agent: 'Scriptwriter', thought: 'Ironic tone is risky for kid audience — flag', t: '0.41s' },
      { agent: 'Director', thought: 'Static + VO works, no heavy gen', t: '0.15s' },
      { agent: 'Critic', thought: 'Score 64 — tone borderline, needs your eyes', t: '0.28s' },
    ],
  },
  {
    id: '3-3',
    day: 3, slotIndex: 3,
    status: 'approved',
    platform: 'youtube',
    thumbnail: mascot.reading,
    title: 'Quiz: which world matches your mood?',
    hook: 'Reading pose + 4-option visual quiz',
    patterns: ['quiz-pattern', 'option-overlay', 'cta-prompt'],
    criticScore: 89,
    brief: 'Reading Catjack overlay 4 worlds, viewer picks.',
    captions: {
      tiktok: 'Pick your world ✨ which one are you?',
      youtube: 'Which Catjack World are you? · Quiz #shorts',
      instagram: 'Which world matches your vibe? 🔮',
    },
    agentTrace: [
      { agent: 'Scriptwriter', thought: 'Quiz pattern → high reply + share rate', t: '0.24s' },
      { agent: 'Director', thought: '4-option overlay via gpt-image-2 + reading still', t: '0.36s' },
      { agent: 'Critic', thought: 'Score 89 — playbook hit', t: '0.18s' },
    ],
  },
  {
    id: '4-1',
    day: 4, slotIndex: 1,
    status: 'rejected',
    platform: 'tiktok',
    thumbnail: mascot.sleepy,
    title: 'Friday wind-down · sleepy mode',
    hook: 'Sleepy + lo-fi loop',
    patterns: ['mood-piece', 'low-energy'],
    criticScore: 38,
    brief: 'Slow lo-fi clip, no clear CTA.',
    captions: {
      tiktok: 'wind down with us 🛌',
      youtube: 'Catjack winds down · friday loop',
      instagram: 'soft fridays 🛌',
    },
    agentTrace: [
      { agent: 'Scriptwriter', thought: 'Mood-only — no hook, no CTA', t: '0.22s' },
      { agent: 'Director', thought: 'Single static, looped', t: '0.10s' },
      { agent: 'Critic', thought: 'Score 38 — rejected. No hook, no replay incentive', t: '0.14s' },
    ],
  },
  {
    id: '4-3',
    day: 4, slotIndex: 3,
    status: 'approved',
    platform: 'tiktok',
    thumbnail: mascot.happyConfetti,
    title: 'Friday card drop celebration',
    hook: 'Confetti pose + 3 ultra-rare reveals',
    patterns: ['big-emotion', 'gold-sheen', '0:01-text'],
    criticScore: 94,
    brief: 'Confetti burst, gold sheen between 3 ultra-rare cards.',
    captions: {
      tiktok: 'FRIDAY DROP 🎉 three ultra-rares??',
      youtube: 'Friday card drop · 3 ultra rares 🎉 #shorts',
      instagram: 'Friday looks like this 🎉✨',
    },
    agentTrace: [
      { agent: 'Scriptwriter', thought: 'Friday-specific energy + 3-card reveal = playbook gold', t: '0.25s' },
      { agent: 'Director', thought: 'Gold sheen via Rive transition, cards from vault', t: '0.32s' },
      { agent: 'Critic', thought: 'Score 94 — top of the week', t: '0.16s' },
    ],
  },
  {
    id: '5-2',
    day: 5, slotIndex: 2,
    status: 'approved',
    platform: 'youtube',
    thumbnail: mascot.pointing,
    title: 'Saturday tutorial — quiz mode tips',
    hook: 'Pointing intro + 3 tip beats',
    patterns: ['tutorial', 'list-3', 'paced-narration'],
    criticScore: 83,
    brief: 'Three quick tips for nailing quiz mode, paced VO.',
    captions: {
      tiktok: '3 quiz tips that actually work 🧠',
      youtube: '3 tips to crush Catjack quiz mode #shorts',
      instagram: '3 tips — save this 🧠',
    },
    agentTrace: [
      { agent: 'Scriptwriter', thought: 'List-3 = high save rate', t: '0.27s' },
      { agent: 'Director', thought: 'Pointing still + 3 numbered overlays', t: '0.29s' },
      { agent: 'Critic', thought: 'Score 83 — solid tutorial structure', t: '0.20s' },
    ],
  },
  {
    id: '6-2',
    day: 6, slotIndex: 2,
    status: 'needs_review',
    platform: 'instagram',
    thumbnail: mascot.happyHandsUp,
    title: 'Sunday week-recap',
    hook: 'Hands-up celebration + week stats',
    patterns: ['recap', 'stats-overlay', 'celebration'],
    criticScore: 76,
    brief: 'Recap the week\'s wins with stat overlays.',
    captions: {
      tiktok: 'this week was UNREAL 🎉',
      youtube: 'Catjack week recap 🎉',
      instagram: 'this week\'s wins ✨ tap for details',
    },
    agentTrace: [
      { agent: 'Scriptwriter', thought: 'Recap pattern, hands-up energy', t: '0.24s' },
      { agent: 'Director', thought: 'Stat overlays via gpt-image-2 — high text density', t: '0.42s' },
      { agent: 'Critic', thought: 'Score 76 — text density borderline at 0:04, flagged', t: '0.25s' },
    ],
  },
]

export const calendarSlots: DraftSlot[] = buildWeek()
export { DAY_LABELS, TIME_LABELS }

/* ─── Intelligence fixtures ────────────────────────────────── */

export interface PatternRow {
  id: string
  name: string
  category: 'hook' | 'pacing' | 'visual' | 'audio' | 'cta' | 'structure'
  /** Relative effectiveness vs baseline (-100 to +100) */
  delta7d: number
  /** Sample size in last 30 days */
  sampleSize: number
  /** Avg engagement rate when present */
  avgLtv: number
  /** Per-platform avg LTV */
  byPlatform: Record<Platform, number>
  /** 8-week sparkline values */
  sparkline: number[]
  /** Plain-English tagline shown on the card */
  tagline: string
}

export const risingPatterns: PatternRow[] = [
  {
    id: 'p_question_hook',
    name: 'Question hook',
    category: 'hook',
    delta7d: 47,
    sampleSize: 28,
    avgLtv: 4.6,
    byPlatform: { tiktok: 5.1, youtube: 3.8, instagram: 4.2 },
    sparkline: [2.1, 2.4, 2.8, 3.2, 3.5, 3.8, 4.2, 4.6],
    tagline: 'Open with a direct question. +47% LTV vs week prior.',
  },
  {
    id: 'p_face_zoom',
    name: 'Face-zoom 0:01',
    category: 'visual',
    delta7d: 32,
    sampleSize: 24,
    avgLtv: 4.1,
    byPlatform: { tiktok: 4.8, youtube: 3.4, instagram: 3.9 },
    sparkline: [2.4, 2.6, 2.8, 3.0, 3.4, 3.6, 3.9, 4.1],
    tagline: 'Tight reaction zoom in the first second.',
  },
  {
    id: 'p_gold_sheen',
    name: 'Gold sheen transition',
    category: 'visual',
    delta7d: 28,
    sampleSize: 18,
    avgLtv: 3.9,
    byPlatform: { tiktok: 4.2, youtube: 3.5, instagram: 3.7 },
    sparkline: [2.6, 2.7, 2.9, 3.1, 3.3, 3.5, 3.7, 3.9],
    tagline: 'Brand-on transition between cuts. Pure Catjack signal.',
  },
  {
    id: 'p_interactive',
    name: 'Interactive prompt',
    category: 'cta',
    delta7d: 22,
    sampleSize: 14,
    avgLtv: 3.7,
    byPlatform: { tiktok: 4.0, youtube: 3.2, instagram: 3.6 },
    sparkline: [2.8, 2.9, 3.0, 3.2, 3.3, 3.5, 3.6, 3.7],
    tagline: 'Pick-an-option overlay. Drives reply + share.',
  },
  {
    id: 'p_cuts_15',
    name: '1.5+ cuts/sec opener',
    category: 'pacing',
    delta7d: 18,
    sampleSize: 22,
    avgLtv: 3.5,
    byPlatform: { tiktok: 3.8, youtube: 3.0, instagram: 3.4 },
    sparkline: [2.7, 2.8, 2.9, 3.0, 3.2, 3.3, 3.4, 3.5],
    tagline: 'Faster cuts in first 5s. Holds short attention spans.',
  },
]

export const decayingPatterns: PatternRow[] = [
  {
    id: 'p_long_intro',
    name: 'Long brand intro',
    category: 'structure',
    delta7d: -38,
    sampleSize: 12,
    avgLtv: 1.8,
    byPlatform: { tiktok: 1.4, youtube: 2.4, instagram: 1.6 },
    sparkline: [3.6, 3.4, 3.0, 2.7, 2.4, 2.1, 1.9, 1.8],
    tagline: 'Logo + name in first 3s. Skips up by 38%.',
  },
  {
    id: 'p_static_open',
    name: 'Static open',
    category: 'pacing',
    delta7d: -27,
    sampleSize: 9,
    avgLtv: 2.0,
    byPlatform: { tiktok: 1.6, youtube: 2.6, instagram: 1.8 },
    sparkline: [3.2, 3.0, 2.8, 2.6, 2.4, 2.2, 2.1, 2.0],
    tagline: 'No movement at 0:00. Audience scrolls past.',
  },
  {
    id: 'p_text_only',
    name: 'Text-only narration',
    category: 'audio',
    delta7d: -19,
    sampleSize: 7,
    avgLtv: 2.3,
    byPlatform: { tiktok: 2.0, youtube: 2.8, instagram: 2.1 },
    sparkline: [3.1, 3.0, 2.9, 2.7, 2.6, 2.5, 2.4, 2.3],
    tagline: 'Silent + on-screen text. Loses to voice-led.',
  },
  {
    id: 'p_dense_text',
    name: 'Dense overlay text',
    category: 'visual',
    delta7d: -15,
    sampleSize: 11,
    avgLtv: 2.5,
    byPlatform: { tiktok: 2.2, youtube: 3.0, instagram: 2.3 },
    sparkline: [3.0, 2.9, 2.8, 2.8, 2.7, 2.6, 2.5, 2.5],
    tagline: '3+ lines on screen. Eye fatigue.',
  },
]

export interface AttributionRow {
  rank: number
  thumbnail: string
  title: string
  platform: Platform
  views: string
  ltvPct: number
  patterns: string[]
  publishedAt: string
}

export const attributionTop20: AttributionRow[] = [
  { rank: 1,  thumbnail: mascot.jumpingForJoy, title: 'When Catjack pulls Ultra Rare', platform: 'tiktok',  views: '2.4M', ltvPct: 5.8, patterns: ['question-hook', 'face-zoom', '0:01-text'],     publishedAt: 'Apr 25' },
  { rank: 2,  thumbnail: mascot.happyConfetti, title: 'Friday card drop · 3 ultra-rares',   platform: 'tiktok',  views: '1.8M', ltvPct: 5.4, patterns: ['big-emotion', 'gold-sheen'],                publishedAt: 'Apr 25' },
  { rank: 3,  thumbnail: mascot.happyHandsUp,  title: 'Magic World ending · kids reaction', platform: 'youtube', views: '1.1M', ltvPct: 4.6, patterns: ['question-hook', 'face-zoom'],              publishedAt: 'Apr 23' },
  { rank: 4,  thumbnail: mascot.shopping,      title: 'Reaction · Leilani opens 5 packs',   platform: 'youtube', views: '870K', ltvPct: 4.4, patterns: ['unboxing', 'multi-cam'],                   publishedAt: 'Apr 22' },
  { rank: 5,  thumbnail: mascot.oneHandWave,   title: 'Memory match speedrun · 30s',         platform: 'tiktok',  views: '740K', ltvPct: 4.2, patterns: ['interactive-prompt', 'split-frame'],       publishedAt: 'Apr 21' },
  { rank: 6,  thumbnail: mascot.pointing,      title: 'Pick your world · which one are you?', platform: 'tiktok', views: '640K', ltvPct: 4.0, patterns: ['interactive-prompt', 'option-overlay'],   publishedAt: 'Apr 20' },
  { rank: 7,  thumbnail: mascot.chuffed,       title: 'Mid-week win compilation',            platform: 'instagram', views: '420K', ltvPct: 3.9, patterns: ['compilation', 'big-emotion'],         publishedAt: 'Apr 19' },
  { rank: 8,  thumbnail: mascot.reading,       title: '3 quiz tips that actually work',      platform: 'youtube', views: '310K', ltvPct: 3.7, patterns: ['list-3', 'tutorial'],                    publishedAt: 'Apr 18' },
  { rank: 9,  thumbnail: mascot.happyHandsUp,  title: 'Sunday week recap',                   platform: 'instagram', views: '210K', ltvPct: 3.4, patterns: ['recap', 'stats-overlay'],            publishedAt: 'Apr 17' },
  { rank: 10, thumbnail: mascot.notBothered,   title: 'When the boss level cheats',          platform: 'tiktok',  views: '180K', ltvPct: 3.0, patterns: ['ironic-tone', 'narration-led'],          publishedAt: 'Apr 16' },
]

/* ─── Inspo Library fixtures ──────────────────────────────── */

export type InspoTier = 'common' | 'rare' | 'magic' | 'ultra-rare'

/** Structured metrics that Gemini extracts for every analyzed video. */
export interface VideoAnalysis {
  hookSeconds: string
  hookPattern: string
  hookConfidence: number
  cutsPerSecOpen: number
  cutsPerSecRest: number
  onScreenText: { t: string; text: string; style: string }[]
  ctaTiming: string
  ctaWording: string
  audioStyle: string
  musicGenre: string
  subjectCloseUpPct: number
  peakBeatTimestamp: string
  transcript: { t: string; text: string }[]
}

export interface CommentIntent {
  bucket: string
  count: number
  example: string
}

export interface InspoVideo {
  id: string
  thumbnail: string
  title: string
  channel: string
  platform: Platform
  views: string
  likeRatio: number
  comments: string
  shares: string
  replayMentions: number
  /** Top-line "why it won" line from the Gemini extract */
  whyItWon: string
  patterns: string[]
  tier: InspoTier
  duration: string
  importedAt: string
  /** 0..1 confidence for the strongest pattern */
  topPatternConfidence: number
  /** Structured analysis (Gemini multimodal extract) */
  analysis?: VideoAnalysis
  /** Top comment intents (NLP-grouped) */
  commentIntents?: CommentIntent[]
  /** Free-text context the human added for the AI */
  userContext?: string
}

export const inspoLibrary: InspoVideo[] = [
  {
    id: 'i1',
    thumbnail: mascot.jumpingForJoy,
    title: 'Kid pulls 1-of-1 Charizard, dad cries',
    channel: '@kidpullsrare',
    platform: 'tiktok',
    views: '12.4M',
    likeRatio: 5.8,
    comments: '47.2k',
    shares: '184k',
    replayMentions: 184,
    whyItWon: 'Wide-eyed face fills frame at 0:00, audible gasp at 0:02, single-card reveal at 0:04.',
    patterns: ['big-emotion', 'face-zoom', '0:01-text', 'reaction-cam'],
    tier: 'ultra-rare',
    duration: '0:18',
    importedAt: '2 days ago',
    topPatternConfidence: 0.92,
    analysis: {
      hookSeconds: '0:00–0:03',
      hookPattern: 'big-emotion · face-zoom',
      hookConfidence: 0.92,
      cutsPerSecOpen: 1.6,
      cutsPerSecRest: 0.5,
      onScreenText: [
        { t: '0:00.4', text: 'NO WAY',          style: 'huge yellow shake' },
        { t: '0:04.1', text: '1 of 1',          style: 'gold framed' },
        { t: '0:14.2', text: 'FOLLOW FOR PT 2', style: 'subtle bottom' },
      ],
      ctaTiming: '0:14.2',
      ctaWording: 'Follow for Part 2',
      audioStyle: 'narration + ambient + gasp',
      musicGenre: 'silence with diegetic gasps',
      subjectCloseUpPct: 78,
      peakBeatTimestamp: '0:05.4',
      transcript: [
        { t: '0:00', text: 'Wait, no way...' },
        { t: '0:01', text: 'Is that — IS THAT —' },
        { t: '0:03', text: 'A 1 OF 1??' },
        { t: '0:08', text: 'I can\'t — dad come look' },
        { t: '0:14', text: 'Follow for part 2 we open the rest' },
      ],
    },
    commentIntents: [
      { bucket: 'Replay-watch mentions', count: 184, example: '"keep coming back to this 😭"' },
      { bucket: 'Tagging friends',       count: 412, example: '"@sarah you HAVE to see this"' },
      { bucket: 'Wants Part 2',          count: 287, example: '"DROP PART 2 NOW PLS"' },
      { bucket: 'Asking how-to',         count: 94,  example: '"where do you buy these packs??"' },
    ],
    userContext: 'The gasp timing (0:02) is what makes this work — without it the face-zoom is just a static. Always pair big-emotion with diegetic audio.',
  },
  {
    id: 'i2',
    thumbnail: mascot.happyConfetti,
    title: 'POV: you complete the rainbow set',
    channel: '@cardcollectorpro',
    platform: 'tiktok',
    views: '8.7M',
    likeRatio: 5.2,
    comments: '21k',
    shares: '94k',
    replayMentions: 92,
    whyItWon: 'Tight 1.6 cuts/sec for first 5s, gold sheen between cards, completion frame at 0:09.',
    patterns: ['gold-sheen', '1.6cps', 'completion-beat'],
    tier: 'ultra-rare',
    duration: '0:14',
    importedAt: '3 days ago',
    topPatternConfidence: 0.89,
  },
  {
    id: 'i3',
    thumbnail: mascot.shopping,
    title: '5 mystery packs in 60 seconds',
    channel: '@unboxkid',
    platform: 'youtube',
    views: '4.2M',
    likeRatio: 4.7,
    comments: '18k',
    shares: '62k',
    replayMentions: 58,
    whyItWon: 'Multi-pack opening with predictable beat structure. Replay-mentions cluster around "wait, watch this part".',
    patterns: ['unboxing', 'multi-cam', 'list-5', 'paced-narration'],
    tier: 'magic',
    duration: '0:54',
    importedAt: '4 days ago',
    topPatternConfidence: 0.84,
  },
  {
    id: 'i4',
    thumbnail: mascot.pointing,
    title: 'Pick A or B — most kids get it wrong',
    channel: '@quizmaster',
    platform: 'tiktok',
    views: '3.1M',
    likeRatio: 4.4,
    comments: '52k',
    shares: '38k',
    replayMentions: 41,
    whyItWon: 'Interactive prompt forces engagement. Comment count is unusually high — quiz pattern is replicable.',
    patterns: ['interactive-prompt', 'a-vs-b', 'option-overlay'],
    tier: 'magic',
    duration: '0:22',
    importedAt: '4 days ago',
    topPatternConfidence: 0.86,
  },
  {
    id: 'i5',
    thumbnail: mascot.oneHandWave,
    title: 'My memory match speedrun · 22 sec',
    channel: '@memorylegend',
    platform: 'tiktok',
    views: '2.8M',
    likeRatio: 4.1,
    comments: '14k',
    shares: '29k',
    replayMentions: 38,
    whyItWon: 'Split-frame: timer + board. Strong replay because viewers verify the time themselves.',
    patterns: ['split-frame', 'countdown', 'verify-prompt'],
    tier: 'magic',
    duration: '0:25',
    importedAt: '5 days ago',
    topPatternConfidence: 0.81,
  },
  {
    id: 'i6',
    thumbnail: mascot.chuffed,
    title: 'Three wins in 7 seconds',
    channel: '@dailywins',
    platform: 'instagram',
    views: '1.6M',
    likeRatio: 3.9,
    comments: '8.2k',
    shares: '14k',
    replayMentions: 22,
    whyItWon: 'Compilation pattern with gold-sheen transitions. Saves > shares because viewers want to revisit.',
    patterns: ['compilation', 'gold-sheen', 'list-3'],
    tier: 'rare',
    duration: '0:09',
    importedAt: '5 days ago',
    topPatternConfidence: 0.78,
  },
  {
    id: 'i7',
    thumbnail: mascot.reading,
    title: '3 quiz tricks every 8-year-old should know',
    channel: '@learnmore',
    platform: 'youtube',
    views: '1.4M',
    likeRatio: 3.7,
    comments: '6.1k',
    shares: '11k',
    replayMentions: 17,
    whyItWon: 'List-3 + tutorial format. High save rate — saves index strongly with replay-watch.',
    patterns: ['tutorial', 'list-3', 'paced-narration'],
    tier: 'rare',
    duration: '0:48',
    importedAt: '6 days ago',
    topPatternConfidence: 0.79,
  },
  {
    id: 'i8',
    thumbnail: mascot.happyHandsUp,
    title: 'Catjack-style win celebration trend',
    channel: '@trendwatcher',
    platform: 'tiktok',
    views: '980K',
    likeRatio: 3.4,
    comments: '4.4k',
    shares: '6.2k',
    replayMentions: 12,
    whyItWon: 'Hands-up celebration is a trending pose. Joinable trend with Catjack mascot fit.',
    patterns: ['big-emotion', 'trend-format', 'on-brand-pose'],
    tier: 'rare',
    duration: '0:11',
    importedAt: '1 week ago',
    topPatternConfidence: 0.74,
  },
  {
    id: 'i9',
    thumbnail: mascot.notBothered,
    title: 'Boss level reactions every kid gets',
    channel: '@gamingreact',
    platform: 'tiktok',
    views: '720K',
    likeRatio: 3.2,
    comments: '3.8k',
    shares: '5.1k',
    replayMentions: 8,
    whyItWon: 'Ironic deadpan over chaotic gameplay. Tone is borderline for kids — flag for review.',
    patterns: ['ironic-tone', 'narration-led', 'static-static'],
    tier: 'common',
    duration: '0:19',
    importedAt: '1 week ago',
    topPatternConfidence: 0.69,
  },
  {
    id: 'i10',
    thumbnail: mascot.pointing,
    title: 'Forest world walkthrough · secret door',
    channel: '@walkthroughking',
    platform: 'youtube',
    views: '640K',
    likeRatio: 3.0,
    comments: '2.9k',
    shares: '4.8k',
    replayMentions: 11,
    whyItWon: 'Whisper voice + slow reveal pan. Builds anticipation, holds attention through 0:08 reveal.',
    patterns: ['walkthrough', 'whisper-voice', 'reveal-beat'],
    tier: 'common',
    duration: '0:36',
    importedAt: '1 week ago',
    topPatternConfidence: 0.72,
  },
  {
    id: 'i11',
    thumbnail: mascot.shopping,
    title: 'Unboxing 12 vintage Pokemon packs',
    channel: '@vintagepacks',
    platform: 'youtube',
    views: '510K',
    likeRatio: 2.8,
    comments: '2.1k',
    shares: '3.3k',
    replayMentions: 6,
    whyItWon: 'Long-form unboxing. Replay value comes from "wait, what was the second pack?" comments.',
    patterns: ['unboxing', 'long-form', 'list-12'],
    tier: 'common',
    duration: '4:22',
    importedAt: '8 days ago',
    topPatternConfidence: 0.65,
  },
  {
    id: 'i12',
    thumbnail: mascot.happyConfetti,
    title: 'When you complete the WHOLE binder',
    channel: '@bindergoals',
    platform: 'instagram',
    views: '480K',
    likeRatio: 4.2,
    comments: '3.6k',
    shares: '5.9k',
    replayMentions: 19,
    whyItWon: 'Celebration moment + binder reveal. Strong saves (people want to remember the goal).',
    patterns: ['celebration', 'reveal-beat', 'goal-frame'],
    tier: 'rare',
    duration: '0:13',
    importedAt: '8 days ago',
    topPatternConfidence: 0.76,
  },
  {
    id: 'i13',
    thumbnail: mascot.sleepy,
    title: 'Wind-down Sunday · lo-fi loop',
    channel: '@chillkids',
    platform: 'youtube',
    views: '280K',
    likeRatio: 2.4,
    comments: '1.1k',
    shares: '1.4k',
    replayMentions: 3,
    whyItWon: 'Mood piece with loop structure. Low replay-mentions — informational only, low priority pattern.',
    patterns: ['mood-piece', 'lo-fi', 'loop-structure'],
    tier: 'common',
    duration: '1:02',
    importedAt: '10 days ago',
    topPatternConfidence: 0.58,
  },
  {
    id: 'i14',
    thumbnail: mascot.oneHandWave,
    title: 'Hi friends · weekly mailbag',
    channel: '@hifrans',
    platform: 'youtube',
    views: '210K',
    likeRatio: 3.6,
    comments: '4.2k',
    shares: '2.1k',
    replayMentions: 14,
    whyItWon: 'Direct address + weekly cadence. Builds parasocial rapport — useful for series content.',
    patterns: ['direct-address', 'weekly-cadence', 'parasocial'],
    tier: 'rare',
    duration: '2:14',
    importedAt: '12 days ago',
    topPatternConfidence: 0.71,
  },
  {
    id: 'i15',
    thumbnail: mascot.chuffed,
    title: 'When the trade actually works out',
    channel: '@tradehouse',
    platform: 'tiktok',
    views: '160K',
    likeRatio: 3.3,
    comments: '1.8k',
    shares: '2.4k',
    replayMentions: 9,
    whyItWon: 'Before/after structure. Strong "I knew it" replay-mentions. Repeatable for any reveal.',
    patterns: ['before-after', 'reveal-beat', 'satisfying-beat'],
    tier: 'rare',
    duration: '0:16',
    importedAt: '14 days ago',
    topPatternConfidence: 0.77,
  },
]

/* ─── Vault fixtures ──────────────────────────────────────── */

export type AssetCategory = 'characters' | 'worlds' | 'cards' | 'logos' | 'voice' | 'reactions'

export interface ReferenceAsset {
  id: string
  category: AssetCategory
  title: string
  thumbnail: string
  type: 'image' | 'video' | 'audio'
  usedInGenerations: number
  uploadedAt: string
}

export const referenceAssets: ReferenceAsset[] = [
  { id: 'r1',  category: 'characters', title: 'Catjack hero pose',     thumbnail: mascot.jumpingForJoy, type: 'image', usedInGenerations: 47, uploadedAt: '2 days ago' },
  { id: 'r2',  category: 'characters', title: 'Catjack reading',        thumbnail: mascot.reading,       type: 'image', usedInGenerations: 31, uploadedAt: '4 days ago' },
  { id: 'r3',  category: 'characters', title: 'Catjack pointing',       thumbnail: mascot.pointing,      type: 'image', usedInGenerations: 22, uploadedAt: '5 days ago' },
  { id: 'r4',  category: 'characters', title: 'Catjack waving',         thumbnail: mascot.oneHandWave,   type: 'image', usedInGenerations: 18, uploadedAt: '6 days ago' },
  { id: 'r5',  category: 'characters', title: 'Catjack shopping',       thumbnail: mascot.shopping,      type: 'image', usedInGenerations: 15, uploadedAt: '6 days ago' },
  { id: 'r6',  category: 'characters', title: 'Catjack chuffed',        thumbnail: mascot.chuffed,       type: 'image', usedInGenerations: 14, uploadedAt: '7 days ago' },
  { id: 'r7',  category: 'characters', title: 'Catjack confetti',       thumbnail: mascot.happyConfetti, type: 'image', usedInGenerations: 12, uploadedAt: '8 days ago' },
  { id: 'r8',  category: 'characters', title: 'Catjack hands up',       thumbnail: mascot.happyHandsUp,  type: 'image', usedInGenerations: 11, uploadedAt: '8 days ago' },
  { id: 'r9',  category: 'characters', title: 'Catjack not bothered',   thumbnail: mascot.notBothered,   type: 'image', usedInGenerations: 7,  uploadedAt: '10 days ago' },
  { id: 'r10', category: 'characters', title: 'Catjack sleepy',         thumbnail: mascot.sleepy,        type: 'image', usedInGenerations: 5,  uploadedAt: '10 days ago' },
  { id: 'r11', category: 'worlds',     title: 'Magic World hero bg',    thumbnail: mascot.jumpingForJoy, type: 'image', usedInGenerations: 28, uploadedAt: '3 days ago' },
  { id: 'r12', category: 'worlds',     title: 'Forest World pan',       thumbnail: mascot.pointing,      type: 'video', usedInGenerations: 14, uploadedAt: '5 days ago' },
  { id: 'r13', category: 'worlds',     title: 'Ocean World establishing', thumbnail: mascot.shopping,    type: 'image', usedInGenerations: 11, uploadedAt: '7 days ago' },
  { id: 'r14', category: 'cards',      title: 'Card back · master',     thumbnail: mascot.reading,       type: 'image', usedInGenerations: 89, uploadedAt: '14 days ago' },
  { id: 'r15', category: 'cards',      title: 'Ultra-rare frame',       thumbnail: mascot.happyConfetti, type: 'image', usedInGenerations: 19, uploadedAt: '12 days ago' },
  { id: 'r16', category: 'logos',      title: 'Catjack wordmark · gold', thumbnail: mascot.oneHandWave,   type: 'image', usedInGenerations: 56, uploadedAt: '21 days ago' },
  { id: 'r17', category: 'voice',      title: 'Leilani voice ref · 30s', thumbnail: mascot.chuffed,      type: 'audio', usedInGenerations: 8,  uploadedAt: '6 days ago' },
  { id: 'r18', category: 'voice',      title: 'Brand narration tone',   thumbnail: mascot.reading,       type: 'audio', usedInGenerations: 23, uploadedAt: '14 days ago' },
  { id: 'r19', category: 'reactions',  title: 'Pull reaction · raw',     thumbnail: mascot.jumpingForJoy, type: 'video', usedInGenerations: 6,  uploadedAt: '2 days ago' },
  { id: 'r20', category: 'reactions',  title: 'Boss-fight reaction',    thumbnail: mascot.notBothered,   type: 'video', usedInGenerations: 4,  uploadedAt: '5 days ago' },
]

export interface StyleProfile {
  id: string
  name: string
  hint: string
  thumbnail: string
  promptFragment: string
  refAssets: number
  usedInGenerations: number
  accentColor: string
}

export const styleProfiles: StyleProfile[] = [
  {
    id: 'sp_magic',
    name: 'Magic World energy',
    hint: 'Sparkle particles, deep purples, gold rim light.',
    thumbnail: mascot.jumpingForJoy,
    promptFragment: 'Cinematic magical-world aesthetic. Deep purples, sparkle dust, gold rim light. Mid-shot Catjack centered, reaction frame at peak emotion beat. 1.5 cuts/sec for first 5s.',
    refAssets: 6,
    usedInGenerations: 38,
    accentColor: '#7F77DD',
  },
  {
    id: 'sp_ocean',
    name: 'Ocean adventure',
    hint: 'Cyan + teal gradients, water particles, calm pacing.',
    thumbnail: mascot.shopping,
    promptFragment: 'Underwater adventure feel. Cyan and teal gradients, soft water particles, calmer pacing (1.0 cuts/sec). Catjack as observer, reveal at 0:06.',
    refAssets: 4,
    usedInGenerations: 22,
    accentColor: '#22D3EE',
  },
  {
    id: 'sp_card_reveal',
    name: 'Card reveal hype',
    hint: 'Gold sheen, big-emotion hook, sparkle burst.',
    thumbnail: mascot.happyConfetti,
    promptFragment: 'Card-pull energy. Open with face zoom + sparkle burst at 0:01. Gold sheen transition. Card reveal at peak. CTA at 0:08.',
    refAssets: 5,
    usedInGenerations: 41,
    accentColor: '#F5C542',
  },
  {
    id: 'sp_quiz_friendly',
    name: 'Quiz tutor friendly',
    hint: 'Warm tones, list-3 structure, on-screen text.',
    thumbnail: mascot.reading,
    promptFragment: 'Friendly tutor tone. Warm color palette. List-3 structure with numbered overlays. Paced narration. Saveable format.',
    refAssets: 3,
    usedInGenerations: 16,
    accentColor: '#4ADE80',
  },
]

export const ASSET_CATEGORIES: { id: AssetCategory; label: string }[] = [
  { id: 'characters', label: 'Characters' },
  { id: 'worlds',     label: 'Worlds' },
  { id: 'cards',      label: 'Cards' },
  { id: 'logos',      label: 'Logos' },
  { id: 'voice',      label: 'Voice' },
  { id: 'reactions',  label: 'Reactions' },
]

/* ─── Agent activity stream + run history ─────────────────── */

export interface AgentEvent {
  id: string
  agent: Agent['id']
  agentName: string
  ts: string
  /** Plain-English thought / decision */
  message: string
  /** Optional structured payload string (e.g. selected generator) */
  detail?: string
}

export const liveActivity: AgentEvent[] = [
  { id: 'ev1', agent: 'director',     agentName: 'Director',     ts: '0:01.42', message: 'Routed shot 2 to Seedance · motion-heavy hook brief',                          detail: 'gen=seedance' },
  { id: 'ev2', agent: 'scriptwriter', agentName: 'Scriptwriter', ts: '0:01.20', message: 'Writing Wed 4pm · magic-world reveal beat',                                    detail: 'pattern=question-hook' },
  { id: 'ev3', agent: 'critic',       agentName: 'Critic',       ts: '0:00.58', message: 'Scored Tue 9am draft 84/100 — auto-approved',                                  detail: 'score=84' },
  { id: 'ev4', agent: 'pattern-miner',agentName: 'Pattern Miner',ts: '0:00.31', message: 'Detected rising pattern: face-zoom-0:01 (+14%)',                               detail: 'confidence=0.81' },
  { id: 'ev5', agent: 'curator',      agentName: 'Curator',      ts: '0:00.12', message: 'Pruned 3 patterns from playbook — sample size below threshold',                detail: 'pruned=3' },
  { id: 'ev6', agent: 'director',     agentName: 'Director',     ts: '0:00.08', message: 'Director chose Leonardo for slot 4 fallback — Seedance returned 5xx',         detail: 'gen=leonardo · retry=2' },
  { id: 'ev7', agent: 'scriptwriter', agentName: 'Scriptwriter', ts: '0:00.04', message: 'Reading reference video · "Kid pulls 1-of-1 Charizard"',                       detail: 'inspo=i1' },
]

export interface RunRecord {
  id: string
  startedAt: string
  duration: string
  trigger: 'cron' | 'manual'
  videosOut: number
  approvedByCritic: number
  cost: string
  status: 'completed' | 'partial' | 'failed'
}

export const runHistory: RunRecord[] = [
  { id: 'r1', startedAt: 'Sun · Apr 27 · 02:00 UTC', duration: '52m 18s', trigger: 'cron',   videosOut: 28, approvedByCritic: 24, cost: '$8.42', status: 'completed' },
  { id: 'r2', startedAt: 'Wed · Apr 23 · 14:12 UTC', duration: '6m 02s',  trigger: 'manual', videosOut: 4,  approvedByCritic: 4,  cost: '$1.18', status: 'completed' },
  { id: 'r3', startedAt: 'Sun · Apr 20 · 02:00 UTC', duration: '58m 41s', trigger: 'cron',   videosOut: 28, approvedByCritic: 22, cost: '$9.04', status: 'completed' },
  { id: 'r4', startedAt: 'Sun · Apr 13 · 02:00 UTC', duration: '47m 12s', trigger: 'cron',   videosOut: 27, approvedByCritic: 21, cost: '$8.18', status: 'partial'   },
  { id: 'r5', startedAt: 'Wed · Apr 10 · 11:08 UTC', duration: '4m 38s',  trigger: 'manual', videosOut: 2,  approvedByCritic: 2,  cost: '$0.61', status: 'completed' },
  { id: 'r6', startedAt: 'Sun · Apr 06 · 02:00 UTC', duration: '54m 09s', trigger: 'cron',   videosOut: 28, approvedByCritic: 23, cost: '$8.74', status: 'completed' },
  { id: 'r7', startedAt: 'Sun · Mar 30 · 02:00 UTC', duration: '49m 51s', trigger: 'cron',   videosOut: 28, approvedByCritic: 25, cost: '$8.62', status: 'completed' },
  { id: 'r8', startedAt: 'Sun · Mar 23 · 02:00 UTC', duration: '12m 04s', trigger: 'cron',   videosOut: 6,  approvedByCritic: 0,  cost: '$1.92', status: 'failed'    },
]

/* ─── Settings fixtures ────────────────────────────────────── */

export interface ConnectionStatus {
  id: string
  name: string
  category: 'social' | 'ai' | 'storage' | 'data'
  status: 'connected' | 'warning' | 'disconnected'
  detail: string
  lastChecked: string
}

export const connections: ConnectionStatus[] = [
  { id: 'c1',  name: 'Postiz · TikTok',     category: 'social',  status: 'connected',    detail: 'cat jack · @catjackkids',                lastChecked: 'just now' },
  { id: 'c2',  name: 'Postiz · YouTube',    category: 'social',  status: 'connected',    detail: 'catjackkids · OAuth refresh OK',          lastChecked: 'just now' },
  { id: 'c3',  name: 'Postiz · Instagram',  category: 'social',  status: 'disconnected', detail: 'Not yet linked',                          lastChecked: '—' },
  { id: 'c4',  name: 'OpenAI',              category: 'ai',      status: 'connected',    detail: 'gpt-image-2, TTS, GPT-4 · usage 38%',     lastChecked: '12m ago' },
  { id: 'c5',  name: 'Gemini',              category: 'ai',      status: 'connected',    detail: 'gemini-2.5-pro · 14M tokens this month',  lastChecked: '2h ago' },
  { id: 'c6',  name: 'ElevenLabs',          category: 'ai',      status: 'connected',    detail: 'Starter plan · 4 voices · 38% used',      lastChecked: '4h ago' },
  { id: 'c7',  name: 'fal.ai · Seedance',   category: 'ai',      status: 'connected',    detail: 'Seedance 2.0 · video gen',                lastChecked: '1h ago' },
  { id: 'c8',  name: 'Leonardo',            category: 'ai',      status: 'connected',    detail: 'Phoenix model · still gen fallback',      lastChecked: '6h ago' },
  { id: 'c9',  name: 'Cloudinary',          category: 'storage', status: 'connected',    detail: 'dot2wsqmd · 4.2GB / 25GB',                 lastChecked: 'just now' },
  { id: 'c10', name: 'Supabase',            category: 'data',    status: 'connected',    detail: 'fygwxxmdwsprfjtnqwib · all migrations ✓', lastChecked: 'just now' },
  { id: 'c11', name: 'YouTube Analytics',   category: 'data',    status: 'warning',      detail: 'OAuth token expires in 6 days',           lastChecked: '20m ago' },
  { id: 'c12', name: '1Password vault',     category: 'data',    status: 'connected',    detail: 'Catjack-world · service account active',  lastChecked: 'just now' },
]

export interface ScheduleSlot {
  day: string
  postsPerDay: number
  preferredTimes: string[]
}

export const scheduleConfig: ScheduleSlot[] = [
  { day: 'Mon', postsPerDay: 4, preferredTimes: ['7:00am', '12:00pm', '4:00pm', '8:00pm'] },
  { day: 'Tue', postsPerDay: 4, preferredTimes: ['7:00am', '12:00pm', '4:00pm', '8:00pm'] },
  { day: 'Wed', postsPerDay: 4, preferredTimes: ['7:00am', '12:00pm', '4:00pm', '8:00pm'] },
  { day: 'Thu', postsPerDay: 4, preferredTimes: ['7:00am', '12:00pm', '4:00pm', '8:00pm'] },
  { day: 'Fri', postsPerDay: 4, preferredTimes: ['7:00am', '12:00pm', '4:00pm', '8:00pm'] },
  { day: 'Sat', postsPerDay: 4, preferredTimes: ['7:00am', '12:00pm', '4:00pm', '8:00pm'] },
  { day: 'Sun', postsPerDay: 4, preferredTimes: ['7:00am', '12:00pm', '4:00pm', '8:00pm'] },
]

export interface TeamMember {
  id: string
  name: string
  email: string
  role: 'Owner' | 'Editor' | 'Reviewer'
  initial: string
  color: string
}

export const teamMembers: TeamMember[] = [
  { id: 'tm1', name: 'Daniel Diyepriye',      email: 'danieldiyepriye@gmail.com',     role: 'Owner',    initial: 'D', color: '#DAA520' },
]

