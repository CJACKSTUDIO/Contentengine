-- ═══════════════════════════════════════════════════════════════
--   Catjack Studio · Schema v1
--
--   Twelve tables that power every surface in the studio. Same
--   Postgres instance as the Catjack kids app (project ref
--   fygwxxmdwsprfjtnqwib) but namespaced cleanly — none of these
--   names collide with the app's existing tables.
--
--   RLS strategy for v1: service-role-only via API routes. The
--   studio is a single-operator tool. Public select is enabled
--   only on truly public surfaces (none yet).
-- ═══════════════════════════════════════════════════════════════

-- ─── 1. inspo_videos ─────────────────────────────────────────
-- Imported videos from TikTok / YouTube / Reels that we mine for
-- structural patterns. Populated by /api/inspo/import.
create table if not exists public.studio_inspo_videos (
  id                       uuid primary key default gen_random_uuid(),
  url                      text unique not null,
  platform                 text not null check (platform in ('tiktok', 'youtube', 'instagram')),
  platform_video_id        text not null,
  channel                  text,
  channel_id               text,
  title                    text,
  thumbnail_url            text,            -- Cloudinary
  master_url               text,            -- Cloudinary master MP4
  duration_seconds         int,
  views_text               text,
  views_int                bigint,
  like_ratio               numeric(5,4),
  comments_text            text,
  shares_text              text,
  replay_mentions          int default 0,   -- inferred from comment NLP
  tier                     text check (tier in ('common','rare','magic','ultra-rare')),
  analysis                 jsonb,           -- Gemini multimodal extract
  patterns                 text[] default '{}',
  top_pattern_confidence   numeric(3,2),
  user_context             text,            -- human-added context
  imported_by              uuid,            -- auth.users
  imported_at              timestamptz default now(),
  updated_at               timestamptz default now()
);
create index if not exists idx_studio_inspo_videos_imported on public.studio_inspo_videos(imported_at desc);
create index if not exists idx_studio_inspo_videos_platform on public.studio_inspo_videos(platform);
create index if not exists idx_studio_inspo_videos_tier on public.studio_inspo_videos(tier);
create index if not exists idx_studio_inspo_videos_patterns on public.studio_inspo_videos using gin (patterns);

-- ─── 2. inspo_patterns (taxonomy) ────────────────────────────
-- Stable IDs for every pattern we track. Read-mostly.
create table if not exists public.studio_inspo_patterns (
  id            text primary key,                            -- e.g. 'question-hook', 'face-zoom-0:01'
  name          text not null,
  category      text not null check (category in ('hook','pacing','visual','audio','cta','structure')),
  description   text,
  created_at    timestamptz default now()
);

-- Seed the v1 taxonomy
insert into public.studio_inspo_patterns (id, name, category, description) values
  ('question-hook',    'Question hook',          'hook',    'Open with a direct question to the viewer.'),
  ('face-zoom',        'Face-zoom 0:01',         'visual',  'Tight reaction zoom in the first second.'),
  ('big-emotion',      'Big emotion hook',       'hook',    'Wide-eyed gasp/celebration in opening frame.'),
  ('action-open',      'Action opener',          'hook',    'Movement-led first frame, no static beat.'),
  ('mystery-open',     'Mystery / tease',        'hook',    'Withhold subject for a beat to bait curiosity.'),
  ('gold-sheen',       'Gold sheen transition',  'visual',  'Brand-on transition between cuts.'),
  ('split-frame',      'Split frame',            'visual',  'Two-pane composition for compare/contrast.'),
  ('1.5cps',           '1.5+ cuts/sec opener',   'pacing',  'Faster cuts in first 5 seconds.'),
  ('1.6cps',           '1.6+ cuts/sec opener',   'pacing',  'Even faster opening pace.'),
  ('paced-narration',  'Paced narration',        'audio',   'Narration carries structure, breath beats.'),
  ('whisper-voice',    'Whisper voice',          'audio',   'Low-volume intimate narration.'),
  ('narration-led',    'Narration-led',          'audio',   'VO drives, visuals are illustrative.'),
  ('ironic-tone',      'Ironic tone',            'audio',   'Deadpan/sarcastic delivery — kid-borderline.'),
  ('interactive-prompt','Interactive prompt',    'cta',     'Asks viewer to pick / vote / save.'),
  ('a-vs-b',           'A vs B',                 'cta',     'Two-option chooser overlay.'),
  ('option-overlay',   'Option overlay',         'cta',     'Picker UI overlaid on the video.'),
  ('cta-prompt',       'CTA prompt',             'cta',     '"Comment X if you saw it" style.'),
  ('list-3',           'List of 3',              'structure','Tutorial/recap with three beats.'),
  ('list-5',           'List of 5',              'structure','Five-item structure.'),
  ('list-12',          'List of 12',             'structure','Long-form list opener.'),
  ('compilation',      'Compilation',            'structure','Stitched clips on a theme.'),
  ('tutorial',         'Tutorial',               'structure','How-to format.'),
  ('walkthrough',      'Walkthrough',            'structure','Guided pan/exploration.'),
  ('reveal-beat',      'Reveal beat',            'structure','Held tension into a payoff frame.'),
  ('completion-beat',  'Completion beat',        'structure','Goal-met moment with celebration.'),
  ('countdown',        'Countdown',              'structure','Visible timer drives urgency.'),
  ('story-beat',       'Story beat',             'structure','Narrative micro-arc.'),
  ('recap',            'Recap',                  'structure','Looking-back format.'),
  ('long-form',        'Long form',              'structure','>2min, deep-dive.'),
  ('mood-piece',       'Mood piece',             'structure','Atmosphere over narrative.'),
  ('lo-fi',            'Lo-fi loop',             'audio',   'Calm looping music.'),
  ('on-brand-pose',    'On-brand pose',          'visual',  'Catjack mascot in canonical stance.'),
  ('reaction-cam',     'Reaction cam',           'visual',  'Subject reacts to off-screen content.'),
  ('unboxing',         'Unboxing',               'structure','Open-and-reveal product format.'),
  ('multi-cam',        'Multi-cam',              'visual',  'Cuts between multiple angles.'),
  ('verify-prompt',    'Verify prompt',          'cta',     '"Pause and check" beats viewer engagement.'),
  ('static-static',    'Static-static',          'pacing',  'No motion / no cuts opening — kills attention.'),
  ('long-cut',         'Long cut',               'pacing',  'Single 8s+ shot, slow.'),
  ('trend-format',     'Trend format',           'structure','Joinable trend / template.'),
  ('before-after',     'Before / after',         'structure','Setup → payoff structure.'),
  ('satisfying-beat',  'Satisfying beat',        'structure','Tension → release moment.'),
  ('direct-address',   'Direct address',         'audio',   '"Hi friends" parasocial open.'),
  ('weekly-cadence',   'Weekly cadence',         'structure','Recurring series rhythm.'),
  ('parasocial',       'Parasocial',             'structure','Builds personal viewer rapport.'),
  ('celebration',      'Celebration',            'visual',  'Confetti / hands-up / cheer frame.'),
  ('goal-frame',       'Goal frame',             'structure','Visible target the viewer roots for.'),
  ('stats-overlay',    'Stats overlay',          'visual',  'Numbers/data layered on visuals.'),
  ('0:01-text',        'On-screen text 0:01',    'visual',  'Hook text appears in first second.'),
  ('quiz-pattern',     'Quiz pattern',           'structure','Question + options + reveal.')
on conflict (id) do nothing;

-- ─── 3. pattern_performance ──────────────────────────────────
-- Aggregate metrics per pattern × platform × time-window. The
-- pattern miner cron writes to this. Intelligence dashboard reads.
create table if not exists public.studio_pattern_performance (
  id              uuid primary key default gen_random_uuid(),
  pattern_id      text not null references public.studio_inspo_patterns(id) on delete cascade,
  platform        text not null check (platform in ('tiktok','youtube','instagram')),
  window_days     int not null check (window_days in (7, 30, 90)),
  sample_size     int not null default 0,
  avg_ltv         numeric(5,4) default 0,
  delta_pct       numeric(5,2) default 0,
  trend           text check (trend in ('rising','stable','decaying')),
  updated_at      timestamptz default now(),
  unique (pattern_id, platform, window_days)
);
create index if not exists idx_studio_pattern_perf_lookup on public.studio_pattern_performance(pattern_id, platform);
create index if not exists idx_studio_pattern_perf_trend on public.studio_pattern_performance(trend, delta_pct desc);

-- ─── 4. pattern_evolution ────────────────────────────────────
-- Daily snapshots so we can render evolution sparklines.
create table if not exists public.studio_pattern_evolution (
  id              bigserial primary key,
  pattern_id      text not null references public.studio_inspo_patterns(id) on delete cascade,
  platform        text not null,
  recorded_date   date not null,
  avg_ltv         numeric(5,4),
  sample_size     int,
  unique (pattern_id, platform, recorded_date)
);
create index if not exists idx_studio_pattern_evo on public.studio_pattern_evolution(pattern_id, recorded_date desc);

-- ─── 5. drafts ───────────────────────────────────────────────
-- Generated video drafts in the calendar. One row per slot.
create table if not exists public.studio_drafts (
  id                  uuid primary key default gen_random_uuid(),
  week_start          date not null,                     -- Monday of the week
  slot_day            int not null check (slot_day between 0 and 6),
  slot_index          int not null check (slot_index between 0 and 3),
  slot_time_label     text not null,                     -- e.g. 'Mon · 7:00am'
  scheduled_for       timestamptz,                       -- absolute publish time
  platform            text check (platform in ('tiktok','youtube','instagram')),
  status              text not null default 'empty' check (status in ('empty','generating','needs_review','approved','published','rejected')),
  title               text,
  hook                text,
  brief               text,
  patterns            text[] default '{}',
  captions            jsonb,                             -- per-platform caption variants
  thumbnail_url       text,
  master_url          text,
  critic_score        int check (critic_score is null or critic_score between 0 and 100),
  agent_trace         jsonb,
  generation_attempts jsonb default '[]'::jsonb,
  generated_at        timestamptz,
  approved_at         timestamptz,
  approved_by         uuid,
  rejected_reason     text,
  postiz_post_id      text,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now(),
  unique (week_start, slot_day, slot_index)
);
create index if not exists idx_studio_drafts_week on public.studio_drafts(week_start);
create index if not exists idx_studio_drafts_status on public.studio_drafts(status, week_start);

-- ─── 6. posted_videos ────────────────────────────────────────
-- Anything the studio has actually published, plus manual posts
-- backfilled from the channel.
create table if not exists public.studio_posted_videos (
  id                 uuid primary key default gen_random_uuid(),
  draft_id           uuid references public.studio_drafts(id) on delete set null,
  platform           text not null check (platform in ('tiktok','youtube','instagram')),
  platform_post_id   text not null,
  platform_url       text,
  thumbnail_url      text,
  master_url         text,
  title              text,
  caption            text,
  patterns           text[] default '{}',
  posted_at          timestamptz not null,
  updated_at         timestamptz default now(),
  unique (platform, platform_post_id)
);
create index if not exists idx_studio_posted_recent on public.studio_posted_videos(posted_at desc);

-- ─── 7. video_metrics_daily ──────────────────────────────────
-- Daily snapshot per posted video. Backfilled by metrics cron.
create table if not exists public.studio_video_metrics_daily (
  id                          bigserial primary key,
  posted_video_id             uuid not null references public.studio_posted_videos(id) on delete cascade,
  recorded_date               date not null,
  views                       bigint default 0,
  likes                       bigint default 0,
  comments                    bigint default 0,
  shares                      bigint default 0,
  avg_view_duration_seconds   numeric,
  retention_curve             jsonb,                    -- 100-bucket array, owner-only data
  ltv_pct                     numeric(5,4),
  raw                         jsonb,                    -- full provider payload for replay
  created_at                  timestamptz default now(),
  unique (posted_video_id, recorded_date)
);
create index if not exists idx_studio_metrics_daily on public.studio_video_metrics_daily(posted_video_id, recorded_date desc);

-- ─── 8. comment_intents ──────────────────────────────────────
-- NLP-grouped comments per video (inspo or posted).
create table if not exists public.studio_comment_intents (
  id                bigserial primary key,
  inspo_video_id    uuid references public.studio_inspo_videos(id) on delete cascade,
  posted_video_id   uuid references public.studio_posted_videos(id) on delete cascade,
  bucket            text not null,
  count             int not null default 0,
  example_quote     text,
  created_at        timestamptz default now(),
  check (
    (inspo_video_id is not null and posted_video_id is null)
    or
    (inspo_video_id is null and posted_video_id is not null)
  )
);
create index if not exists idx_studio_comment_intents_inspo on public.studio_comment_intents(inspo_video_id);
create index if not exists idx_studio_comment_intents_posted on public.studio_comment_intents(posted_video_id);

-- ─── 9. agent_runs ───────────────────────────────────────────
-- Record of every Inngest function run. Powers Agents page.
create table if not exists public.studio_agent_runs (
  id                  uuid primary key default gen_random_uuid(),
  run_type            text not null,                   -- 'sunday-batch' | 'manual-trigger' | 'single-agent'
  triggered_by        text not null check (triggered_by in ('cron','manual','webhook')),
  agent_id            text,                            -- 'curator' | ... | 'all'
  status              text not null default 'running' check (status in ('running','completed','partial','failed')),
  started_at          timestamptz default now(),
  completed_at        timestamptz,
  duration_ms         int,
  videos_out          int default 0,
  approved_by_critic  int default 0,
  cost_usd            numeric(10,4),
  inngest_run_id      text,
  log                 jsonb default '[]'::jsonb
);
create index if not exists idx_studio_agent_runs_recent on public.studio_agent_runs(started_at desc);
create index if not exists idx_studio_agent_runs_status on public.studio_agent_runs(status, started_at desc);

-- ─── 10. style_profiles ──────────────────────────────────────
-- Composable brand DNA profiles.
create table if not exists public.studio_style_profiles (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  hint              text,
  thumbnail_url     text,
  prompt_fragment   text not null,
  accent_color      text,
  ref_asset_ids     uuid[] default '{}',
  usage_count       int default 0,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

-- ─── 11. reference_assets ────────────────────────────────────
-- Vault items — characters, worlds, cards, voice, reactions.
create table if not exists public.studio_reference_assets (
  id                      uuid primary key default gen_random_uuid(),
  category                text not null check (category in ('characters','worlds','cards','logos','voice','reactions')),
  title                   text not null,
  cloudinary_public_id    text not null,
  type                    text not null check (type in ('image','video','audio')),
  usage_count             int default 0,
  uploaded_by             uuid,
  uploaded_at             timestamptz default now()
);
create index if not exists idx_studio_assets_category on public.studio_reference_assets(category, uploaded_at desc);

-- ─── 12. human_signals ───────────────────────────────────────
-- Every approve/reject/edit event so the system learns from
-- corrections + confirmations.
create table if not exists public.studio_human_signals (
  id              bigserial primary key,
  draft_id        uuid not null references public.studio_drafts(id) on delete cascade,
  signal_type     text not null check (signal_type in ('approved','rejected','edited','regenerated')),
  before_state    jsonb,
  after_state     jsonb,
  reason          text,
  user_id         uuid,
  recorded_at     timestamptz default now()
);
create index if not exists idx_studio_human_signals_draft on public.studio_human_signals(draft_id, recorded_at desc);

-- ─── updated_at touch trigger ────────────────────────────────
create or replace function public.studio_touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_studio_inspo_videos_updated_at on public.studio_inspo_videos;
create trigger trg_studio_inspo_videos_updated_at
  before update on public.studio_inspo_videos
  for each row execute function public.studio_touch_updated_at();

drop trigger if exists trg_studio_drafts_updated_at on public.studio_drafts;
create trigger trg_studio_drafts_updated_at
  before update on public.studio_drafts
  for each row execute function public.studio_touch_updated_at();

drop trigger if exists trg_studio_style_profiles_updated_at on public.studio_style_profiles;
create trigger trg_studio_style_profiles_updated_at
  before update on public.studio_style_profiles
  for each row execute function public.studio_touch_updated_at();

-- ─── RLS ─────────────────────────────────────────────────────
-- v1 strategy: service-role-only writes/reads via API routes.
-- Enable RLS on every table; default policy = service_role full access.

alter table public.studio_inspo_videos          enable row level security;
alter table public.studio_inspo_patterns        enable row level security;
alter table public.studio_pattern_performance   enable row level security;
alter table public.studio_pattern_evolution     enable row level security;
alter table public.studio_drafts                enable row level security;
alter table public.studio_posted_videos         enable row level security;
alter table public.studio_video_metrics_daily   enable row level security;
alter table public.studio_comment_intents       enable row level security;
alter table public.studio_agent_runs            enable row level security;
alter table public.studio_style_profiles        enable row level security;
alter table public.studio_reference_assets      enable row level security;
alter table public.studio_human_signals         enable row level security;

do $$
declare
  t text;
begin
  for t in
    select unnest(array[
      'studio_inspo_videos',
      'studio_inspo_patterns',
      'studio_pattern_performance',
      'studio_pattern_evolution',
      'studio_drafts',
      'studio_posted_videos',
      'studio_video_metrics_daily',
      'studio_comment_intents',
      'studio_agent_runs',
      'studio_style_profiles',
      'studio_reference_assets',
      'studio_human_signals'
    ])
  loop
    execute format(
      'create policy if not exists %I on public.%I for all to service_role using (true) with check (true);',
      'service_role_full_access_' || t,
      t
    );
  end loop;
end $$;
