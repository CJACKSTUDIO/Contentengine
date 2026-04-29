'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { Play, Settings2 } from 'lucide-react'
import { toast } from 'sonner'
import LiveFeed from '@/components/agents/LiveFeed'
import RunHistory from '@/components/agents/RunHistory'
import { agentCrew } from '@/lib/fixtures'
import { img } from '@/lib/cloudinary'
import { cn } from '@/lib/cn'

const STATUS_STYLE: Record<string, { pill: string; auraOpacity: number; aura: string }> = {
  idle:     { pill: 'pill-muted',  auraOpacity: 0.0,  aura: 'rgba(255,255,255,0.05)' },
  running:  { pill: 'pill-purple', auraOpacity: 0.6, aura: 'rgba(127,119,221,0.5)' },
  thinking: { pill: 'pill-gold',   auraOpacity: 0.6, aura: 'rgba(245,197,66,0.5)' },
}

export default function AgentsPage() {
  return (
    <>
      {/* Page header */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-10"
      >
        <span className="subtitle">The crew · live</span>
        <div className="mt-1 flex items-end justify-between gap-4">
          <div>
            <h1
              className="text-[40px] leading-[1.05] tracking-tight text-text-primary"
              style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 700 }}
            >
              Agents
            </h1>
            <p className="mt-2 max-w-[640px] text-[15px] leading-relaxed text-text-secondary">
              Five specialized agents run in parallel every Sunday. Trace what each one decided,
              override prompts, or trigger manual runs. Transparency is the trust system.
            </p>
          </div>
          <button
            type="button"
            onClick={() => toast.success('Triggered manual batch · 4 videos in 6m est.')}
            className="btn-gold"
          >
            <Play size={14} fill="currentColor" />
            Run batch now
          </button>
        </div>
      </motion.section>

      {/* Agent cards */}
      <section className="mb-10">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {agentCrew.map((agent, i) => {
            const s = STATUS_STYLE[agent.status]
            return (
              <motion.article
                key={agent.id}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: i * 0.06 }}
                whileHover={{ y: -2 }}
                className="card group p-5"
              >
                {/* Avatar with aura */}
                <div className="relative h-20 w-20">
                  <div
                    className="absolute inset-0 -z-10 rounded-full blur-xl transition-opacity"
                    style={{ background: s.aura, opacity: s.auraOpacity }}
                  />
                  <Image
                    src={img(agent.mascot, { w: 200 })}
                    alt={agent.name}
                    fill
                    unoptimized
                    sizes="80px"
                    className="object-contain transition-transform duration-300 group-hover:scale-110"
                  />
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <h3
                    className="text-[15px] text-text-primary"
                    style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 600 }}
                  >
                    {agent.name}
                  </h3>
                  <span className={cn('pill', s.pill)}>
                    {agent.status === 'running' && <span className="live-dot" />}
                    {agent.status === 'thinking' && <span className="live-dot" style={{ background: 'var(--accent-gold-bright)' }} />}
                    {agent.status[0].toUpperCase() + agent.status.slice(1)}
                  </span>
                </div>

                <p className="mt-1 text-[12.5px] leading-snug text-text-muted">
                  {agent.role}
                </p>

                <div className="mt-4 rounded-xl border border-border-subtle bg-deep p-3">
                  <div className="text-[10px] uppercase tracking-[0.14em] text-text-muted">
                    Last decision
                  </div>
                  <p className="mt-1.5 line-clamp-3 text-[12px] leading-relaxed text-text-secondary">
                    {agent.lastDecision}
                  </p>
                </div>

                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => toast.info(`${agent.name} run triggered · trace will appear in feed`)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border-subtle bg-white/[0.03] px-2 py-1.5 text-[11.5px] font-semibold text-text-secondary transition-colors hover:border-gold/30 hover:bg-white/[0.06] hover:text-text-primary"
                  >
                    <Play size={11} />
                    Run
                  </button>
                  <button
                    type="button"
                    onClick={() => toast.info('Prompt editor coming in backend pass')}
                    className="grid h-8 w-8 place-items-center rounded-lg border border-border-subtle bg-white/[0.03] text-text-secondary transition-colors hover:border-gold/30 hover:bg-white/[0.06] hover:text-text-primary"
                    aria-label="Edit prompt"
                  >
                    <Settings2 size={12} />
                  </button>
                </div>
              </motion.article>
            )
          })}
        </div>
      </section>

      {/* Live feed */}
      <section className="mb-10">
        <LiveFeed />
      </section>

      {/* Run history */}
      <RunHistory />
    </>
  )
}
