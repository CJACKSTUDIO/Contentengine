-- Block 11: ElevenLabs narration + Critic verdict columns.
-- Adds the fields the Inngest videoPipeline persists after the
-- Critic agent runs and the worker muxes narration onto the master.

alter table public.studio_drafts
  add column if not exists narration_url    text,
  add column if not exists critic_verdict   text
    check (critic_verdict is null or critic_verdict in ('approve','review','reject')),
  add column if not exists critic_notes     text;

create index if not exists idx_studio_drafts_critic_verdict
  on public.studio_drafts(critic_verdict)
  where critic_verdict is not null;
