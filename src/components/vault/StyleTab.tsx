'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { Plus, Wand2 } from 'lucide-react'
import { img } from '@/lib/cloudinary'
import { styleProfiles } from '@/lib/fixtures'
import { toast } from 'sonner'

export default function StyleTab() {
  return (
    <section>
      {/* Header */}
      <div className="mb-6 flex items-end justify-between">
        <div>
          <span className="subtitle">{styleProfiles.length} profiles</span>
          <h2 className="h-section mt-1">Composable brand DNA</h2>
          <p className="mt-1 max-w-[640px] text-[13.5px] text-text-secondary">
            Each style profile bundles a prompt fragment + reference assets + tone notes. Mix and match
            them when generating — the studio composes prompts automatically.
          </p>
        </div>
        <button
          type="button"
          onClick={() => toast.info('Profile editor coming in backend pass')}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-border-subtle bg-white/[0.03] px-4 text-[13px] font-semibold text-text-primary transition-colors hover:border-gold/40 hover:bg-white/[0.06]"
        >
          <Plus size={14} className="text-gold-bright" />
          New profile
        </button>
      </div>

      {/* Profile cards */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {styleProfiles.map((profile, i) => (
          <motion.article
            key={profile.id}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.06 }}
            whileHover={{ y: -2 }}
            className="card group overflow-hidden"
          >
            <div className="grid grid-cols-[160px_1fr]">
              {/* Visual */}
              <div
                className="relative aspect-square overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${profile.accentColor}33 0%, rgba(7,7,12,0.4) 100%)`,
                }}
              >
                <Image
                  src={img(profile.thumbnail, { w: 320 })}
                  alt=""
                  fill
                  unoptimized
                  sizes="160px"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-void/40" />
                {/* Accent ring */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0"
                  style={{ boxShadow: `inset 0 0 0 2px ${profile.accentColor}66` }}
                />
              </div>

              {/* Body */}
              <div className="flex flex-col p-5">
                <h3
                  className="text-[18px] leading-tight text-text-primary"
                  style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 700 }}
                >
                  {profile.name}
                </h3>
                <p className="mt-1 text-[13px] text-text-secondary">{profile.hint}</p>

                {/* Prompt fragment preview */}
                <div className="mt-4 rounded-lg border border-border-subtle bg-void/30 p-3">
                  <div className="mb-1.5 flex items-center gap-1.5">
                    <Wand2 size={11} className="text-gold-bright" />
                    <span className="subtitle text-[10px]">Prompt fragment</span>
                  </div>
                  <p
                    className="line-clamp-3 text-[12px] leading-snug text-text-secondary"
                    style={{ fontFamily: 'var(--font-mono), monospace' }}
                  >
                    {profile.promptFragment}
                  </p>
                </div>

                {/* Footer stats */}
                <div className="mt-auto flex items-center justify-between pt-4 text-[11.5px] text-text-muted">
                  <span>
                    <span
                      className="text-text-primary"
                      style={{ fontFamily: 'var(--font-mono), monospace', fontWeight: 600 }}
                    >
                      {profile.refAssets}
                    </span>{' '}
                    refs ·{' '}
                    <span
                      className="text-text-primary"
                      style={{ fontFamily: 'var(--font-mono), monospace', fontWeight: 600 }}
                    >
                      {profile.usedInGenerations}
                    </span>{' '}
                    uses
                  </span>
                  <button
                    type="button"
                    onClick={() => toast.info('Profile editor coming in backend pass')}
                    className="font-semibold text-gold-bright hover:underline"
                  >
                    Edit →
                  </button>
                </div>
              </div>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  )
}
