'use client'

import { motion } from 'framer-motion'
import { Send, TrendingUp, Eye, ShieldCheck, type LucideIcon } from 'lucide-react'
import { activityFeed } from '@/lib/fixtures'
import { cn } from '@/lib/cn'

const iconFor: Record<string, { Icon: LucideIcon; tint: string }> = {
  published: { Icon: Send,        tint: 'text-green' },
  pattern:   { Icon: TrendingUp,  tint: 'text-gold-bright' },
  review:    { Icon: Eye,         tint: 'text-purple' },
  recovered: { Icon: ShieldCheck, tint: 'text-amber' },
}

export default function ActivityFeed() {
  return (
    <section className="mb-14">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <span className="subtitle">Since you last looked</span>
          <h2 className="h-section mt-1">Activity</h2>
        </div>
        <button
          type="button"
          className="text-[13px] font-semibold text-text-secondary transition-colors hover:text-gold-bright"
        >
          Mark all seen →
        </button>
      </div>

      <div className="card-elev divide-y divide-border-subtle">
        {activityFeed.map((event, i) => {
          const { Icon, tint } = iconFor[event.type]
          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35, delay: i * 0.05 }}
              className="group flex items-start gap-4 p-5 transition-colors hover:bg-white/[0.02]"
            >
              <div
                className={cn(
                  'grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-border-subtle bg-deep',
                  tint,
                )}
              >
                <Icon size={16} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-3">
                  <h4
                    className="text-[14px] text-text-primary"
                    style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 600 }}
                  >
                    {event.title}
                  </h4>
                  <span className="shrink-0 text-[11.5px] text-text-muted">{event.time}</span>
                </div>
                <p className="mt-1 text-[13px] leading-relaxed text-text-secondary">
                  {event.detail}
                </p>
              </div>
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}
