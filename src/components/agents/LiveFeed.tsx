'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Pause, Play, Activity } from 'lucide-react'
import { useState } from 'react'
import { liveActivity } from '@/lib/fixtures'

const AGENT_ACCENT: Record<string, string> = {
  curator:        '#7F77DD',
  'pattern-miner': '#22D3EE',
  scriptwriter:   '#F5C542',
  director:       '#4ADE80',
  critic:         '#F59E0B',
}

export default function LiveFeed() {
  const [paused, setPaused] = useState(false)

  return (
    <section className="card-elev p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity size={14} className="text-gold-bright" />
          <span className="subtitle">Live activity</span>
          {!paused && (
            <span className="ml-1 inline-flex items-center gap-1.5 text-[11px] text-green">
              <span className="live-dot" />
              streaming
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setPaused(!paused)}
          className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border-subtle bg-white/[0.03] px-2.5 text-[11.5px] font-semibold text-text-secondary transition-colors hover:bg-white/[0.06] hover:text-text-primary"
        >
          {paused ? <Play size={11} /> : <Pause size={11} />}
          {paused ? 'Resume' : 'Pause'}
        </button>
      </div>

      <ul className="space-y-2">
        <AnimatePresence>
          {liveActivity.map((event, i) => (
            <motion.li
              key={event.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className="flex items-start gap-3 rounded-lg border border-border-subtle bg-white/[0.02] p-3 transition-colors hover:bg-white/[0.04]"
            >
              <span
                className="shrink-0 rounded-md px-2 py-1 text-[10.5px] font-bold"
                style={{
                  fontFamily: 'var(--font-display), sans-serif',
                  background: `${AGENT_ACCENT[event.agent]}1f`,
                  color: AGENT_ACCENT[event.agent],
                  border: `1px solid ${AGENT_ACCENT[event.agent]}40`,
                }}
              >
                {event.agentName}
              </span>
              <p className="flex-1 text-[12.5px] leading-snug text-text-secondary">
                {event.message}
              </p>
              {event.detail && (
                <span
                  className="hidden shrink-0 text-[10.5px] text-text-muted sm:inline"
                  style={{ fontFamily: 'var(--font-mono), monospace' }}
                >
                  {event.detail}
                </span>
              )}
              <span
                className="shrink-0 text-[10.5px] text-text-muted"
                style={{ fontFamily: 'var(--font-mono), monospace' }}
              >
                {event.ts}
              </span>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </section>
  )
}
