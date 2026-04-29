'use client'

import { motion } from 'framer-motion'
import { CheckCircle2, AlertCircle, XCircle, Clock, type LucideIcon } from 'lucide-react'
import { runHistory } from '@/lib/fixtures'

const STATUS: Record<string, { Icon: LucideIcon; color: string; label: string }> = {
  completed: { Icon: CheckCircle2, color: 'var(--accent-green)',    label: 'Completed' },
  partial:   { Icon: AlertCircle,  color: 'var(--accent-amber)',    label: 'Partial' },
  failed:    { Icon: XCircle,      color: 'var(--accent-red)',      label: 'Failed' },
}

export default function RunHistory() {
  return (
    <section>
      <div className="mb-5 flex items-end justify-between">
        <div>
          <span className="subtitle">Run history</span>
          <h2 className="h-section mt-1">Last 8 batches</h2>
        </div>
        <button
          type="button"
          className="text-[13px] font-semibold text-text-secondary transition-colors hover:text-gold-bright"
        >
          View all →
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="grid grid-cols-[1.5fr_120px_120px_100px_120px_120px] gap-x-3 border-b border-border-subtle px-5 py-3 text-[10.5px] uppercase tracking-[0.14em] text-text-muted">
          <span>Started</span>
          <span>Duration</span>
          <span>Trigger</span>
          <span className="text-right">Videos</span>
          <span className="text-right">Approved</span>
          <span className="text-right">Cost</span>
        </div>
        <div className="divide-y divide-border-subtle">
          {runHistory.map((run, i) => {
            const status = STATUS[run.status]
            return (
              <motion.div
                key={run.id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
                className="grid grid-cols-[1.5fr_120px_120px_100px_120px_120px] items-center gap-x-3 px-5 py-3 transition-colors hover:bg-white/[0.02]"
              >
                <div className="flex items-center gap-2.5">
                  <span style={{ color: status.color }}>
                    <status.Icon size={15} />
                  </span>
                  <div>
                    <div
                      className="text-[13px] text-text-primary"
                      style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 600 }}
                    >
                      {run.startedAt}
                    </div>
                    <div
                      className="text-[10.5px] text-text-muted"
                      style={{ color: status.color }}
                    >
                      {status.label}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[12.5px] text-text-secondary">
                  <Clock size={11} className="text-text-muted" />
                  <span style={{ fontFamily: 'var(--font-mono), monospace' }}>
                    {run.duration}
                  </span>
                </div>

                <span className="text-[12.5px] capitalize text-text-secondary">
                  {run.trigger}
                </span>

                <span
                  className="text-right text-[13px] text-text-primary"
                  style={{ fontFamily: 'var(--font-mono), monospace' }}
                >
                  {run.videosOut}
                </span>

                <span
                  className="text-right text-[13px] text-gold-bright"
                  style={{ fontFamily: 'var(--font-mono), monospace', fontWeight: 600 }}
                >
                  {run.approvedByCritic}/{run.videosOut}
                </span>

                <span
                  className="text-right text-[12.5px] text-text-secondary"
                  style={{ fontFamily: 'var(--font-mono), monospace' }}
                >
                  {run.cost}
                </span>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
