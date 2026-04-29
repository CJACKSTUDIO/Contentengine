'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  Sparkles,
  CalendarClock,
  TrendingUp,
  Library,
  Inbox,
  Settings as SettingsIcon,
  Send,
  Bot,
  Wand2,
  AlertTriangle,
} from 'lucide-react'

const SECTIONS = [
  {
    icon: Inbox,
    title: 'Inspo',
    body:
      'Paste a TikTok / YouTube / Reels URL. The Railway worker (yt-dlp + ffmpeg) downloads + uploads to Cloudinary, Gemini analyzes the video, and the Pattern Miner re-mines after a 30s debounce so wins propagate back into next week\'s plan.',
    href: '/inspo',
  },
  {
    icon: TrendingUp,
    title: 'Intelligence',
    body:
      'Live read of the Pattern Miner — every named pattern × platform × window. Rising/decaying flags drive what the Calendar Planner emphasizes in next Sunday\'s batch.',
    href: '/intelligence',
  },
  {
    icon: CalendarClock,
    title: 'Calendar',
    body:
      'The 28-slot week. Sunday at 02:00 UTC the orchestrator fans out: Pattern Miner → Calendar Planner → 28 parallel pipelines (Scriptwriter → Director → Generators → ElevenLabs → Stitch → Critic). Approve to publish through Postiz.',
    href: '/calendar',
  },
  {
    icon: Bot,
    title: 'Agents',
    body:
      'Trace every agent run. Six agents: Pattern Miner, Calendar Planner, Scriptwriter, Director, Critic, Curator. Each emits structured JSON via Claude tool-use; logs land in studio_agent_runs.',
    href: '/agents',
  },
  {
    icon: Library,
    title: 'Vault',
    body:
      'Reference assets (characters, worlds, cards, voice samples) and named style profiles. The Director reaches for these when planning shots — keep what\'s on-brand here.',
    href: '/vault',
  },
  {
    icon: SettingsIcon,
    title: 'Settings',
    body:
      'Postiz channel health, Cloudinary state, Supabase health. Cron status. Ingest-metrics + mine-patterns run daily at 04/05 UTC.',
    href: '/settings',
  },
]

const CYCLES = [
  {
    when: '02:00 UTC Sunday',
    what: 'sundayBatchCron emits studio/batch.cron.fired',
    why: 'Kicks off the weekly 28-slot plan',
  },
  {
    when: '02:01 UTC Sunday',
    what: 'batchOrchestrator runs Pattern Miner → Calendar Planner → fans out 28 video.brief.ready events',
    why: 'Each brief becomes one parallel videoPipeline run (concurrency 6)',
  },
  {
    when: '~02:05 UTC Sunday onward',
    what: 'videoPipeline: Scriptwriter → Director → 4–6 generators in parallel → Eleven narration → Stitch → Critic',
    why: 'Master lands in Cloudinary; row flips to needs_review (auto-publish stays OFF)',
  },
  {
    when: '04:00 UTC daily',
    what: 'mine-patterns cron · pattern × platform × window aggregates',
    why: 'Feeds the next plan with rising / decaying flags',
  },
  {
    when: '05:00 UTC daily',
    what: 'ingest-metrics cron · YouTube Data API + Postiz analytics',
    why: 'Daily snapshot per posted video — fuels pattern performance',
  },
]

const FAILSAFES = [
  'Critic verdict reject → status=rejected. The publishDraft function refuses unless force=true is passed.',
  'Auto-publish OFF: even verdict=approve only flips to needs_review. A human must hit Approve.',
  'Generator router: Seedance fails → gpt-image-2 fallback. Both fail → the videoPipeline retries up to 2× then surfaces the error in studio_agent_runs.log.',
  'All cron + worker endpoints are bearer-token guarded. Auth layer requires email magic link + (optional) STUDIO_ALLOWED_EMAILS allow-list.',
]

export default function HelpPage() {
  return (
    <>
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-10"
      >
        <span className="subtitle">How the studio runs</span>
        <h1
          className="mt-1 text-[40px] leading-[1.05] tracking-tight text-text-primary"
          style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 700 }}
        >
          Operator handbook
        </h1>
        <p className="mt-2 max-w-[720px] text-[15px] leading-relaxed text-text-secondary">
          One page for what each surface does, when the cron fires, and which rails keep
          the agents from pushing trash to the calendar.
        </p>
      </motion.section>

      {/* Sections */}
      <section className="mb-12 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {SECTIONS.map(({ icon: Icon, title, body, href }, i) => (
          <motion.div
            key={title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.04 }}
            whileHover={{ y: -2 }}
            className="card p-5"
          >
            <div className="mb-3 flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-gold/15 text-gold-bright">
                <Icon size={15} />
              </span>
              <h3
                className="text-[15px] text-text-primary"
                style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 700 }}
              >
                {title}
              </h3>
            </div>
            <p className="text-[13px] leading-relaxed text-text-secondary">{body}</p>
            <Link
              href={href}
              className="mt-3 inline-block text-[12px] font-semibold text-gold-bright hover:underline"
            >
              Open →
            </Link>
          </motion.div>
        ))}
      </section>

      {/* Cycle */}
      <section className="mb-12">
        <div className="mb-4 flex items-center gap-2">
          <Wand2 size={16} className="text-gold-bright" />
          <h2 className="h-section">Weekly cycle</h2>
        </div>
        <ol className="space-y-2">
          {CYCLES.map((c, i) => (
            <li
              key={i}
              className="grid grid-cols-[160px_1fr_1fr] gap-4 rounded-xl border border-border-subtle bg-white/[0.02] p-4"
            >
              <span
                className="text-[12px] text-text-muted"
                style={{ fontFamily: 'var(--font-mono), monospace' }}
              >
                {c.when}
              </span>
              <span className="text-[13px] text-text-primary">{c.what}</span>
              <span className="text-[12.5px] text-text-secondary">{c.why}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* Failsafes */}
      <section className="mb-12">
        <div className="mb-4 flex items-center gap-2">
          <AlertTriangle size={16} className="text-gold-bright" />
          <h2 className="h-section">Failsafes</h2>
        </div>
        <ul className="space-y-2">
          {FAILSAFES.map((f, i) => (
            <li
              key={i}
              className="flex items-start gap-3 rounded-xl border border-border-subtle bg-white/[0.02] p-4 text-[13px] leading-relaxed text-text-secondary"
            >
              <Sparkles size={14} className="mt-0.5 shrink-0 text-gold-bright" />
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* CTA */}
      <section className="mb-12 rounded-2xl border border-border-subtle bg-gradient-to-br from-gold/5 via-transparent to-purple/10 p-6">
        <div className="flex items-center gap-3">
          <Send size={16} className="text-gold-bright" />
          <h2
            className="text-[18px] text-text-primary"
            style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 700 }}
          >
            Ship a draft now
          </h2>
        </div>
        <p className="mt-2 max-w-[520px] text-[13px] leading-relaxed text-text-secondary">
          Open the calendar, click any draft scoring ≥80, then Approve. The publishDraft
          Inngest function will upload to Postiz and schedule it on the matching channel.
        </p>
        <Link
          href="/calendar"
          className="btn-gold mt-4 inline-flex h-10 items-center gap-2"
        >
          Open the calendar →
        </Link>
      </section>
    </>
  )
}
