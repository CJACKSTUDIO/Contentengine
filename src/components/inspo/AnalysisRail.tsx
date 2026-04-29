'use client'

import Image from 'next/image'
import { AnimatePresence, motion } from 'framer-motion'
import {
  X, Play, Eye, Heart, MessageCircle, Repeat, Save, Sparkles,
  Clock, Type, Volume2, Crosshair, Zap, Captions, ExternalLink,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { img } from '@/lib/cloudinary'
import type { InspoVideo, Platform } from '@/lib/fixtures'

const PLATFORM_LABEL: Record<Platform, string> = {
  tiktok:    'TikTok',
  youtube:   'YouTube',
  instagram: 'Instagram',
}

const PLATFORM_COLOR: Record<Platform, string> = {
  tiktok:    '#FF0050',
  youtube:   '#FF0000',
  instagram: '#E1306C',
}

interface Props {
  video: InspoVideo | null
  onClose: () => void
}

export default function AnalysisRail({ video, onClose }: Props) {
  const [contextText, setContextText] = useState('')
  const [contextSaved, setContextSaved] = useState(false)

  // Reset/load context whenever a different video is opened
  useEffect(() => {
    if (video) {
      setContextText(video.userContext ?? '')
      setContextSaved(false)
    }
  }, [video])

  const handleSaveContext = () => {
    setContextSaved(true)
    toast.success('Context saved', {
      description: 'AI will read this on next playbook mining run.',
    })
  }

  return (
    <AnimatePresence>
      {video && (
        <>
          {/* Backdrop */}
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            aria-label="Close"
            className="fixed inset-0 z-40 bg-void/60 backdrop-blur-sm"
          />

          {/* Rail */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 38 }}
            className="fixed right-0 top-0 z-50 flex h-dvh w-full max-w-[640px] flex-col border-l border-border-subtle bg-deep"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border-subtle px-6 py-4">
              <div className="min-w-0">
                <span className="subtitle">{video.channel} · {video.importedAt}</span>
                <h2
                  className="mt-1 line-clamp-1 text-[18px] leading-tight text-text-primary"
                  style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 600 }}
                >
                  {video.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="ml-3 grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-border-subtle bg-white/[0.03] text-text-secondary transition-colors hover:bg-white/[0.06] hover:text-text-primary"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body — scroll */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {/* ── Video preview ── */}
              <section>
                <div className="subtitle mb-2 flex items-center gap-1.5">
                  <Play size={11} fill="currentColor" />
                  Source video
                </div>
                <div
                  className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-border-subtle bg-elev"
                  style={{
                    background: `linear-gradient(135deg, ${PLATFORM_COLOR[video.platform]}26 0%, rgba(127,119,221,0.18) 100%)`,
                  }}
                >
                  <Image
                    src={img(video.thumbnail, { w: 1000 })}
                    alt=""
                    fill
                    unoptimized
                    sizes="640px"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-void/85 via-void/15 to-transparent" />

                  <button
                    type="button"
                    className="absolute inset-0 grid place-items-center text-white"
                    aria-label="Play preview"
                  >
                    <div className="grid h-14 w-14 place-items-center rounded-full bg-void/70 ring-1 ring-white/30 backdrop-blur-md transition-transform hover:scale-110">
                      <Play size={20} fill="currentColor" />
                    </div>
                  </button>

                  {/* Platform pill */}
                  <span
                    className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wide backdrop-blur-md"
                    style={{
                      background: `${PLATFORM_COLOR[video.platform]}33`,
                      color: '#fff',
                      border: `1px solid ${PLATFORM_COLOR[video.platform]}66`,
                    }}
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{
                        background: PLATFORM_COLOR[video.platform],
                        boxShadow: `0 0 6px ${PLATFORM_COLOR[video.platform]}`,
                      }}
                    />
                    {PLATFORM_LABEL[video.platform]}
                  </span>

                  {/* Duration */}
                  <span
                    className="absolute bottom-3 right-3 rounded-md bg-void/70 px-2 py-1 text-[11px] font-semibold text-white backdrop-blur-md"
                    style={{ fontFamily: 'var(--font-mono), monospace' }}
                  >
                    {video.duration}
                  </span>
                </div>

                {/* Open original */}
                <button
                  type="button"
                  className="mt-3 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-gold-bright transition-colors hover:text-gold"
                >
                  <ExternalLink size={12} />
                  Open original on {PLATFORM_LABEL[video.platform]}
                </button>
              </section>

              {/* ── Engagement metrics ── */}
              <section className="mt-6">
                <div className="subtitle mb-2 flex items-center gap-1.5">
                  <Eye size={11} />
                  Engagement signals
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <Metric icon={<Eye size={11} />}            label="Views"      value={video.views} />
                  <Metric icon={<Heart size={11} />}          label="Like rate"  value={`${video.likeRatio.toFixed(1)}%`} accent />
                  <Metric icon={<MessageCircle size={11} />}  label="Comments"   value={video.comments} />
                  <Metric icon={<Repeat size={11} />}         label="Replays"    value={String(video.replayMentions)} hint="proxy from comment NLP" />
                </div>
              </section>

              {/* ── Structured analysis (the AI's eye) ── */}
              {video.analysis && (
                <section className="mt-6">
                  <div className="subtitle mb-2 flex items-center gap-1.5">
                    <Sparkles size={11} className="text-gold-bright" />
                    What the AI sees
                  </div>

                  <div className="card-elev divide-y divide-border-subtle overflow-hidden">
                    <AnalysisRow icon={<Zap size={13} />}      label="Hook"          chip={video.analysis.hookPattern}   sub={`${video.analysis.hookSeconds} · confidence ${(video.analysis.hookConfidence * 100).toFixed(0)}%`} />
                    <AnalysisRow icon={<Clock size={13} />}    label="Pacing"        chip={`${video.analysis.cutsPerSecOpen} cps`} sub={`open · drops to ${video.analysis.cutsPerSecRest} cps after 0:05`} />
                    <AnalysisRow icon={<Crosshair size={13} />} label="Subject framing" chip={`${video.analysis.subjectCloseUpPct}% close-up`} sub={`peak emotional beat at ${video.analysis.peakBeatTimestamp}`} />
                    <AnalysisRow icon={<Volume2 size={13} />}  label="Audio"         chip={video.analysis.audioStyle}    sub={video.analysis.musicGenre} />
                    <AnalysisRow icon={<Captions size={13} />} label="CTA"           chip={video.analysis.ctaWording}    sub={`appears at ${video.analysis.ctaTiming}`} />

                    {/* On-screen text timeline */}
                    <div className="px-4 py-3">
                      <div className="flex items-center gap-2 text-[12px]">
                        <Type size={13} className="text-gold-bright" />
                        <span
                          className="text-text-primary"
                          style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 600 }}
                        >
                          On-screen text
                        </span>
                        <span
                          className="ml-1 rounded-full bg-white/[0.06] px-1.5 py-0.5 text-[10px] font-bold text-text-secondary"
                          style={{ fontFamily: 'var(--font-mono), monospace' }}
                        >
                          {video.analysis.onScreenText.length}
                        </span>
                      </div>
                      <ul className="mt-2 space-y-1.5">
                        {video.analysis.onScreenText.map((entry, i) => (
                          <li
                            key={i}
                            className="flex items-center gap-3 rounded-lg border border-border-subtle bg-white/[0.02] px-2.5 py-1.5"
                          >
                            <span
                              className="shrink-0 text-[10.5px] text-text-muted"
                              style={{ fontFamily: 'var(--font-mono), monospace' }}
                            >
                              {entry.t}
                            </span>
                            <span className="flex-1 text-[12.5px] font-semibold text-text-primary">
                              "{entry.text}"
                            </span>
                            <span className="text-[10.5px] text-text-muted">{entry.style}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Transcript */}
                    <details className="px-4 py-3">
                      <summary className="cursor-pointer list-none text-[12px] font-semibold text-text-secondary transition-colors hover:text-text-primary">
                        + Transcript ({video.analysis.transcript.length} lines)
                      </summary>
                      <ul className="mt-2 space-y-1">
                        {video.analysis.transcript.map((t, i) => (
                          <li key={i} className="flex gap-2 text-[12px]">
                            <span
                              className="shrink-0 text-text-muted"
                              style={{ fontFamily: 'var(--font-mono), monospace' }}
                            >
                              {t.t}
                            </span>
                            <span className="flex-1 text-text-secondary">{t.text}</span>
                          </li>
                        ))}
                      </ul>
                    </details>
                  </div>
                </section>
              )}

              {/* ── Comment intents ── */}
              {video.commentIntents && (
                <section className="mt-6">
                  <div className="subtitle mb-2 flex items-center gap-1.5">
                    <MessageCircle size={11} />
                    Comment intent buckets
                  </div>
                  <ul className="space-y-2">
                    {video.commentIntents.map((c) => (
                      <li
                        key={c.bucket}
                        className="rounded-xl border border-border-subtle bg-white/[0.02] p-3"
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className="text-[13px] text-text-primary"
                            style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 600 }}
                          >
                            {c.bucket}
                          </span>
                          <span
                            className="rounded-md bg-gold/15 px-1.5 py-0.5 text-[11px] font-bold text-gold-bright"
                            style={{ fontFamily: 'var(--font-mono), monospace' }}
                          >
                            {c.count}
                          </span>
                        </div>
                        <p className="mt-1 text-[12px] italic text-text-secondary">{c.example}</p>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* ── Pattern tags ── */}
              <section className="mt-6">
                <div className="subtitle mb-2">Patterns extracted</div>
                <div className="flex flex-wrap gap-1.5">
                  {video.patterns.map((p) => (
                    <span key={p} className="pill pill-purple">
                      <Sparkles size={11} />
                      {p}
                    </span>
                  ))}
                </div>
              </section>

              {/* ── Your context (sends to AI) ── */}
              <section className="mt-6">
                <div className="subtitle mb-2 flex items-center gap-1.5">
                  <Sparkles size={11} className="text-gold-bright" />
                  Your context · for the AI
                </div>
                <p className="mb-3 text-[12px] leading-relaxed text-text-secondary">
                  Anything you noticed that the analyzer might miss. This text is fed to the
                  Pattern Miner + Scriptwriter agents next time they reference this video.
                </p>

                <textarea
                  value={contextText}
                  onChange={(e) => {
                    setContextText(e.target.value)
                    setContextSaved(false)
                  }}
                  placeholder="e.g. 'The gasp timing at 0:02 is what makes this work. Without it, the face zoom is just a static — always pair big-emotion with diegetic audio.'"
                  rows={5}
                  className="w-full resize-y rounded-xl border border-border-subtle bg-white/[0.02] p-3 text-[13px] leading-relaxed text-text-primary placeholder:text-text-muted focus:border-gold/40 focus:bg-white/[0.04] focus:outline-none"
                />

                {/* Suggested prompts */}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {[
                    'The hook works because…',
                    'Don\'t replicate this for kids…',
                    'Pair this pattern with…',
                    'Tone is borderline because…',
                    'Music timing is the key…',
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => {
                        setContextText((prev) => (prev ? `${prev.trim()} ${suggestion}` : suggestion))
                        setContextSaved(false)
                      }}
                      className="rounded-full border border-border-subtle bg-white/[0.03] px-2.5 py-1 text-[10.5px] font-semibold text-text-secondary transition-colors hover:border-gold/30 hover:text-text-primary"
                    >
                      + {suggestion}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleSaveContext}
                  disabled={!contextText.trim() || contextSaved}
                  className="btn-gold mt-4 h-11 w-full disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Save size={14} />
                  {contextSaved ? 'Saved · feeds next agent run' : 'Save context'}
                </button>
              </section>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

function Metric({
  icon,
  label,
  value,
  accent,
  hint,
}: {
  icon: React.ReactNode
  label: string
  value: string
  accent?: boolean
  hint?: string
}) {
  return (
    <div className="rounded-xl border border-border-subtle bg-white/[0.02] p-3" title={hint}>
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-[0.12em] text-text-muted">
        {icon}
        {label}
      </div>
      <div
        className={`mt-1 text-[16px] leading-none ${accent ? 'text-gold-bright' : 'text-text-primary'}`}
        style={{ fontFamily: 'var(--font-mono), monospace', fontWeight: 600 }}
      >
        {value}
      </div>
    </div>
  )
}

function AnalysisRow({
  icon,
  label,
  chip,
  sub,
}: {
  icon: React.ReactNode
  label: string
  chip: string
  sub?: string
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span className="shrink-0 text-gold-bright">{icon}</span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span
            className="text-[12px] text-text-primary"
            style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 600 }}
          >
            {label}
          </span>
          <span className="rounded-md bg-white/[0.06] px-1.5 py-0.5 text-[10.5px] font-semibold text-text-primary">
            {chip}
          </span>
        </div>
        {sub && <div className="mt-0.5 text-[11px] text-text-muted">{sub}</div>}
      </div>
    </div>
  )
}
