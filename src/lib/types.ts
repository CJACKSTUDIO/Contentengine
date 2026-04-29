/**
 * Database row types — mirrors the SQL schema in
 * supabase/migrations/001_studio_schema.sql.
 *
 * Hand-maintained for v1 (Supabase generated types is a follow-up).
 * Each interface uses snake_case to match column names so we can
 * drop a row directly into the type without remapping.
 */

export type Platform = 'tiktok' | 'youtube' | 'instagram'
export type DraftStatus =
  | 'empty'
  | 'generating'
  | 'needs_review'
  | 'approved'
  | 'published'
  | 'rejected'
export type PatternCategory = 'hook' | 'pacing' | 'visual' | 'audio' | 'cta' | 'structure'
export type AssetCategory =
  | 'characters'
  | 'worlds'
  | 'cards'
  | 'logos'
  | 'voice'
  | 'reactions'
export type PatternTrend = 'rising' | 'stable' | 'decaying'
export type InspoTier = 'common' | 'rare' | 'magic' | 'ultra-rare'

export interface InspoVideoRow {
  id: string
  url: string
  platform: Platform
  platform_video_id: string
  channel: string | null
  channel_id: string | null
  title: string | null
  thumbnail_url: string | null
  master_url: string | null
  duration_seconds: number | null
  views_text: string | null
  views_int: number | null
  like_ratio: number | null
  comments_text: string | null
  shares_text: string | null
  replay_mentions: number
  tier: InspoTier | null
  analysis: VideoAnalysisJson | null
  patterns: string[]
  top_pattern_confidence: number | null
  user_context: string | null
  imported_by: string | null
  imported_at: string
  updated_at: string
}

/** Shape of inspo_videos.analysis — produced by Gemini. */
export interface VideoAnalysisJson {
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

export interface InspoPatternRow {
  id: string
  name: string
  category: PatternCategory
  description: string | null
  created_at: string
}

export interface PatternPerformanceRow {
  id: string
  pattern_id: string
  platform: Platform
  window_days: 7 | 30 | 90
  sample_size: number
  avg_ltv: number
  delta_pct: number
  trend: PatternTrend | null
  updated_at: string
}

export interface PatternEvolutionRow {
  id: number
  pattern_id: string
  platform: Platform
  recorded_date: string // ISO date
  avg_ltv: number | null
  sample_size: number | null
}

export interface DraftRow {
  id: string
  week_start: string // ISO date
  slot_day: 0 | 1 | 2 | 3 | 4 | 5 | 6
  slot_index: 0 | 1 | 2 | 3
  slot_time_label: string
  scheduled_for: string | null
  platform: Platform | null
  status: DraftStatus
  title: string | null
  hook: string | null
  brief: string | null
  patterns: string[]
  captions: Record<Platform, string> | null
  thumbnail_url: string | null
  master_url: string | null
  critic_score: number | null
  agent_trace: AgentTraceEntry[] | null
  generation_attempts: GenerationAttempt[]
  generated_at: string | null
  approved_at: string | null
  approved_by: string | null
  rejected_reason: string | null
  postiz_post_id: string | null
  created_at: string
  updated_at: string
}

export interface AgentTraceEntry {
  agent: 'curator' | 'pattern-miner' | 'scriptwriter' | 'director' | 'critic'
  thought: string
  t: string // duration like "0.42s"
}

export interface GenerationAttempt {
  generator: 'seedance' | 'gpt-image-2' | 'leonardo' | 'rive'
  attempt: number
  status: 'queued' | 'running' | 'success' | 'failed'
  started_at: string
  finished_at?: string
  asset_url?: string
  error?: string
}

export interface PostedVideoRow {
  id: string
  draft_id: string | null
  platform: Platform
  platform_post_id: string
  platform_url: string | null
  thumbnail_url: string | null
  master_url: string | null
  title: string | null
  caption: string | null
  patterns: string[]
  posted_at: string
  updated_at: string
}

export interface VideoMetricsDailyRow {
  id: number
  posted_video_id: string
  recorded_date: string
  views: number
  likes: number
  comments: number
  shares: number
  avg_view_duration_seconds: number | null
  retention_curve: number[] | null
  ltv_pct: number | null
  raw: unknown
  created_at: string
}

export interface CommentIntentRow {
  id: number
  inspo_video_id: string | null
  posted_video_id: string | null
  bucket: string
  count: number
  example_quote: string | null
  created_at: string
}

export interface AgentRunRow {
  id: string
  run_type: 'sunday-batch' | 'manual-trigger' | 'single-agent'
  triggered_by: 'cron' | 'manual' | 'webhook'
  agent_id: string | null
  status: 'running' | 'completed' | 'partial' | 'failed'
  started_at: string
  completed_at: string | null
  duration_ms: number | null
  videos_out: number
  approved_by_critic: number
  cost_usd: number | null
  inngest_run_id: string | null
  log: AgentLogEvent[]
}

export interface AgentLogEvent {
  agent: string
  ts: string
  message: string
  detail?: string
}

export interface StyleProfileRow {
  id: string
  name: string
  hint: string | null
  thumbnail_url: string | null
  prompt_fragment: string
  accent_color: string | null
  ref_asset_ids: string[]
  usage_count: number
  created_at: string
  updated_at: string
}

export interface ReferenceAssetRow {
  id: string
  category: AssetCategory
  title: string
  cloudinary_public_id: string
  type: 'image' | 'video' | 'audio'
  usage_count: number
  uploaded_by: string | null
  uploaded_at: string
}

export interface HumanSignalRow {
  id: number
  draft_id: string
  signal_type: 'approved' | 'rejected' | 'edited' | 'regenerated'
  before_state: unknown
  after_state: unknown
  reason: string | null
  user_id: string | null
  recorded_at: string
}

/** Convenience union — every studio-owned table. */
export type StudioTable =
  | 'studio_inspo_videos'
  | 'studio_inspo_patterns'
  | 'studio_pattern_performance'
  | 'studio_pattern_evolution'
  | 'studio_drafts'
  | 'studio_posted_videos'
  | 'studio_video_metrics_daily'
  | 'studio_comment_intents'
  | 'studio_agent_runs'
  | 'studio_style_profiles'
  | 'studio_reference_assets'
  | 'studio_human_signals'
