'use client'

import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown } from 'lucide-react'
import PatternCard from '@/components/intelligence/PatternCard'
import Heatmap from '@/components/intelligence/Heatmap'
import AttributionTable from '@/components/intelligence/AttributionTable'
import { risingPatterns, decayingPatterns } from '@/lib/fixtures'

export default function IntelligencePage() {
  return (
    <>
      {/* Page header */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-10"
      >
        <span className="subtitle">The moat · live</span>
        <h1
          className="mt-1 text-[40px] leading-[1.05] tracking-tight text-text-primary"
          style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 700 }}
        >
          Intelligence
        </h1>
        <p className="mt-2 max-w-[640px] text-[15px] leading-relaxed text-text-secondary">
          Every video you post — and every inspo you import — gets decomposed into structural
          patterns. The studio learns what wins for your audience, then conditions every
          generation on those proven structures.
        </p>
      </motion.section>

      {/* Rising / Decaying side-by-side */}
      <section className="mb-12 grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Rising */}
        <div>
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-gold-bright" />
            <span className="subtitle text-gold-bright">Rising</span>
            <span className="rounded-full bg-gold/15 px-2 py-0.5 text-[10.5px] font-bold text-gold-bright">
              {risingPatterns.length}
            </span>
          </div>
          <h2 className="h-section mb-4">What&apos;s working right now</h2>
          <div className="flex flex-col gap-3">
            {risingPatterns.map((p, i) => (
              <PatternCard key={p.id} pattern={p} variant="rising" delay={i * 0.05} />
            ))}
          </div>
        </div>

        {/* Decaying */}
        <div>
          <div className="mb-4 flex items-center gap-2">
            <TrendingDown size={16} className="text-red" />
            <span className="subtitle" style={{ color: 'var(--accent-red)' }}>
              Decaying
            </span>
            <span className="rounded-full bg-red/15 px-2 py-0.5 text-[10.5px] font-bold text-red">
              {decayingPatterns.length}
            </span>
          </div>
          <h2 className="h-section mb-4">What&apos;s losing steam</h2>
          <div className="flex flex-col gap-3">
            {decayingPatterns.map((p, i) => (
              <PatternCard key={p.id} pattern={p} variant="decaying" delay={i * 0.05} />
            ))}
          </div>
        </div>
      </section>

      <Heatmap />
      <AttributionTable />
    </>
  )
}
