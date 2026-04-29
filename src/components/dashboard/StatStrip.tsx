'use client'

import { motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import { weeklyStats } from '@/lib/fixtures'

export default function StatStrip() {
  return (
    <section className="mb-14">
      <div className="mb-6 flex items-baseline justify-between">
        <div>
          <span className="subtitle">This Week · Live</span>
          <h2 className="h-section mt-1">Pulse</h2>
        </div>
        <button
          type="button"
          className="text-[13px] font-semibold text-text-secondary transition-colors hover:text-gold-bright"
        >
          See breakdown →
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {weeklyStats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.06 }}
            className="card card-interactive p-5"
          >
            <div className="flex items-center justify-between text-[12px] text-text-muted">
              <span>{stat.label}</span>
              {stat.trend === 'up' && (
                <span className="pill pill-green">
                  <ArrowUpRight size={11} />
                  {stat.delta}
                </span>
              )}
            </div>
            <div
              className="mt-3 text-[34px] leading-none tracking-tight text-text-primary"
              style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 700 }}
            >
              {stat.value}
            </div>
            <p className="mt-2 text-[12.5px] leading-snug text-text-muted">{stat.hint}</p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
