'use client'

import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown } from 'lucide-react'
import type { PatternRow } from '@/lib/fixtures'
import { cn } from '@/lib/cn'

interface Props {
  pattern: PatternRow
  variant: 'rising' | 'decaying'
  delay?: number
  onClick?: () => void
  selected?: boolean
}

export default function PatternCard({ pattern, variant, delay = 0, onClick, selected }: Props) {
  const isRising = variant === 'rising'
  const accent = isRising ? 'var(--accent-gold-bright)' : 'var(--accent-red)'

  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -2 }}
      className={cn(
        'card card-interactive relative w-full overflow-hidden p-5 text-left',
        selected && (isRising ? 'border-gold/50 ring-1 ring-gold/30' : 'border-red/40 ring-1 ring-red/20'),
      )}
    >
      {/* accent stripe */}
      <span
        aria-hidden
        className="absolute left-0 top-0 h-full w-[3px]"
        style={{ background: accent }}
      />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className="rounded-md px-1.5 py-0.5 text-[10px] uppercase tracking-[0.12em]"
              style={{
                fontFamily: 'var(--font-display), sans-serif',
                background: isRising ? 'rgba(218,165,32,0.12)' : 'rgba(239,68,68,0.12)',
                color: isRising ? 'var(--accent-gold-bright)' : 'var(--accent-red)',
                fontWeight: 600,
              }}
            >
              {pattern.category}
            </span>
            <span className="text-[10.5px] text-text-muted">
              {pattern.sampleSize} samples · 30d
            </span>
          </div>

          <h3
            className="mt-2 text-[18px] leading-tight text-text-primary"
            style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 700 }}
          >
            {pattern.name}
          </h3>
        </div>

        {/* Delta */}
        <div
          className="flex shrink-0 items-center gap-1 rounded-lg px-2 py-1"
          style={{
            background: isRising ? 'rgba(74,222,128,0.12)' : 'rgba(239,68,68,0.12)',
            border: `1px solid ${isRising ? 'rgba(74,222,128,0.3)' : 'rgba(239,68,68,0.3)'}`,
          }}
        >
          {isRising ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          <span
            className="text-[12px] font-bold"
            style={{
              fontFamily: 'var(--font-mono), monospace',
              color: isRising ? 'var(--accent-green)' : 'var(--accent-red)',
            }}
          >
            {pattern.delta7d > 0 ? '+' : ''}{pattern.delta7d}%
          </span>
        </div>
      </div>

      <p className="mt-3 text-[13px] leading-relaxed text-text-secondary">
        {pattern.tagline}
      </p>

      {/* Sparkline + LTV */}
      <div className="mt-4 flex items-end justify-between gap-3">
        <Sparkline values={pattern.sparkline} accent={accent} />
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-[0.14em] text-text-muted">Avg LTV</div>
          <div
            className="text-[20px] leading-none text-text-primary"
            style={{ fontFamily: 'var(--font-mono), monospace', fontWeight: 600 }}
          >
            {pattern.avgLtv.toFixed(1)}<span className="text-text-muted">%</span>
          </div>
        </div>
      </div>
    </motion.button>
  )
}

function Sparkline({ values, accent }: { values: number[]; accent: string }) {
  const W = 110
  const H = 32
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = Math.max(0.001, max - min)
  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * W
      const y = H - ((v - min) / range) * H
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <defs>
        <linearGradient id={`spark-${accent}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={accent} stopOpacity="0.5" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={`0,${H} ${points} ${W},${H}`}
        fill={`url(#spark-${accent})`}
      />
      <polyline
        points={points}
        fill="none"
        stroke={accent}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
