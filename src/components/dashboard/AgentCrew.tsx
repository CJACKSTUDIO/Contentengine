'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { img } from '@/lib/cloudinary'
import { agentCrew } from '@/lib/fixtures'
import { cn } from '@/lib/cn'

const statusStyle: Record<string, string> = {
  idle:     'pill-muted',
  running:  'pill-purple',
  thinking: 'pill-gold',
}

const statusLabel: Record<string, string> = {
  idle:     'Idle',
  running:  'Running',
  thinking: 'Thinking',
}

export default function AgentCrew() {
  return (
    <section className="mb-14">
      <div className="mb-6">
        <span className="subtitle">The crew</span>
        <h2 className="h-section mt-1">Five agents, one studio</h2>
        <p className="mt-1 text-[13.5px] text-text-secondary">
          Each agent has its own job. They run in parallel every Sunday and
          report back with traceable reasoning.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {agentCrew.map((agent, i) => (
          <motion.article
            key={agent.id}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: i * 0.06 }}
            className="card card-interactive group p-5"
          >
            {/* Mascot avatar */}
            <div className="relative h-20 w-20 overflow-visible">
              <div
                className={cn(
                  'absolute inset-0 -z-10 rounded-full blur-xl transition-opacity',
                  agent.status === 'running' ? 'bg-purple/40 opacity-60' :
                  agent.status === 'thinking' ? 'bg-gold/40 opacity-60' :
                  'bg-white/5 opacity-30',
                )}
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

            {/* Header */}
            <div className="mt-4 flex items-center justify-between">
              <h3
                className="text-[15px] text-text-primary"
                style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 600 }}
              >
                {agent.name}
              </h3>
              <span className={cn('pill', statusStyle[agent.status])}>
                {agent.status === 'running' && <span className="live-dot" />}
                {statusLabel[agent.status]}
              </span>
            </div>

            <p className="mt-1 text-[12.5px] leading-snug text-text-muted">{agent.role}</p>

            {/* Last decision */}
            <div className="mt-4 rounded-xl border border-border-subtle bg-deep p-3">
              <div className="text-[10px] uppercase tracking-[0.14em] text-text-muted">
                Last decision
              </div>
              <p className="mt-1.5 text-[12px] leading-relaxed text-text-secondary">
                {agent.lastDecision}
              </p>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  )
}
