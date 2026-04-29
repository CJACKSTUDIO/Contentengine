'use client'

import { Link, Sparkles, Plus } from 'lucide-react'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

export default function PasteBar() {
  const [url, setUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) return
    setSubmitting(true)
    toast.success('Analyzing video', {
      description: '~30 seconds. You\'ll see it appear in the library when done.',
    })
    setTimeout(() => {
      setSubmitting(false)
      setUrl('')
    }, 1200)
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative mb-10 overflow-hidden"
    >
      {/* Subtle gold ambience */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(ellipse 50% 70% at 50% 0%, rgba(245,197,66,0.12) 0%, rgba(127,119,221,0.06) 40%, transparent 100%)',
        }}
      />

      <div className="card-elev p-7">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-gold-bright" />
          <span className="subtitle">Add inspo</span>
        </div>
        <h1
          className="mt-2 text-[28px] leading-tight tracking-tight text-text-primary"
          style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 700 }}
        >
          Paste a winning video — Gemini decomposes the structure.
        </h1>
        <p className="mt-1 text-[13.5px] text-text-secondary">
          TikTok, YouTube Shorts, or Instagram Reels. Hook, pacing, on-screen text, comment intent — all extracted in ~30s.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-5 flex flex-col gap-2 sm:flex-row"
        >
          <label className="flex h-14 flex-1 items-center gap-3 rounded-xl border border-border-subtle bg-white/[0.03] px-4 text-[14px] text-text-secondary transition-colors focus-within:border-gold/50 focus-within:bg-white/[0.06]">
            <Link size={16} className="text-text-muted" />
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://tiktok.com/...   |   https://youtube.com/shorts/..."
              className="flex-1 bg-transparent text-text-primary placeholder:text-text-muted focus:outline-none"
            />
          </label>
          <button
            type="submit"
            disabled={!url.trim() || submitting}
            className="btn-gold h-14 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Plus size={16} />
            {submitting ? 'Queued...' : 'Analyze'}
          </button>
        </form>

        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-[12px] text-text-muted">
          <span>Examples that work:</span>
          {[
            'tiktok.com/@user/video/1234',
            'youtube.com/shorts/abcd',
            'instagram.com/reel/efgh',
          ].map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => setUrl(`https://${ex}`)}
              className="rounded-full border border-border-subtle bg-white/[0.03] px-2.5 py-1 text-[10.5px] font-semibold transition-colors hover:border-gold/30 hover:text-text-primary"
              style={{ fontFamily: 'var(--font-mono), monospace' }}
            >
              {ex}
            </button>
          ))}
        </div>
      </div>
    </motion.section>
  )
}
