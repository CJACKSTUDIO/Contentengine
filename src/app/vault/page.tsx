'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import AssetTab from '@/components/vault/AssetTab'
import StyleTab from '@/components/vault/StyleTab'
import { cn } from '@/lib/cn'

const TABS = [
  { id: 'assets', label: 'Reference Assets' },
  { id: 'styles', label: 'Style Profiles' },
] as const

type TabId = (typeof TABS)[number]['id']

export default function VaultPage() {
  const [tab, setTab] = useState<TabId>('assets')

  return (
    <>
      {/* Page header */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <span className="subtitle">Brand DNA</span>
        <h1
          className="mt-1 text-[40px] leading-[1.05] tracking-tight text-text-primary"
          style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 700 }}
        >
          Vault
        </h1>
        <p className="mt-2 max-w-[640px] text-[15px] leading-relaxed text-text-secondary">
          Every reference asset and named style profile the studio reaches for. The
          generator composes from this — keep what&apos;s on-brand here, drop what&apos;s not.
        </p>
      </motion.section>

      {/* Tabs */}
      <div className="mb-6 flex items-center gap-1 rounded-xl border border-border-subtle bg-white/[0.03] p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              'relative rounded-lg px-4 py-2 text-[13px] font-semibold transition-colors',
              tab === t.id ? 'text-text-primary' : 'text-text-secondary hover:text-text-primary',
            )}
            style={{ fontFamily: 'var(--font-display), sans-serif' }}
          >
            {tab === t.id && (
              <motion.span
                layoutId="vault-tab-active"
                className="absolute inset-0 -z-10 rounded-lg bg-white/[0.06]"
                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              />
            )}
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'assets' ? <AssetTab /> : <StyleTab />}
    </>
  )
}
