'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { Sparkles, Play, Calendar } from 'lucide-react'
import { img, mascot } from '@/lib/cloudinary'

const HERO_POSTER = img('catjack/backgrounds/auth-bg-v2', { w: 1920 })
const MASCOT_HERO = img(mascot.jumpingForJoy, { w: 600 })

export default function Hero() {
  return (
    <section className="relative isolate -mx-8 -mt-8 mb-12 overflow-hidden">
      {/* Background — poster image with cinematic veil */}
      <div className="absolute inset-0 -z-20">
        <Image
          src={HERO_POSTER}
          alt=""
          fill
          priority
          unoptimized
          className="object-cover"
          sizes="100vw"
        />
      </div>
      <div className="absolute inset-0 -z-10 hero-veil" />

      {/* Soft gold lensflare top-right + purple bottom-left */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 h-[420px] w-[420px] rounded-full opacity-50"
        style={{
          background:
            'radial-gradient(circle, rgba(245,197,66,0.35) 0%, rgba(245,197,66,0) 65%)',
          filter: 'blur(40px)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -left-24 h-[480px] w-[480px] rounded-full opacity-40"
        style={{
          background:
            'radial-gradient(circle, rgba(127,119,221,0.4) 0%, rgba(127,119,221,0) 65%)',
          filter: 'blur(50px)',
        }}
      />

      <div className="relative grid min-h-[560px] grid-cols-12 items-end gap-8 px-8 pb-20 pt-32">
        {/* Headline column */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="col-span-12 lg:col-span-7"
        >
          <span className="subtitle inline-flex items-center gap-2">
            <Sparkles size={12} className="text-gold-bright" />
            Sunday Batch · Auto-Pilot
          </span>

          <h1 className="h-hero mt-4">
            Where intelligence
            <br />
            meets motion.
          </h1>

          <p className="mt-6 max-w-[540px] text-[16.5px] leading-relaxed text-text-secondary">
            One Sunday run, twenty-eight videos generated, every clip conditioned
            on what your audience actually rewards. Catjack Studio is the
            content engine your hire never stops.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <button type="button" className="btn-gold">
              <Play size={16} fill="currentColor" />
              Start Sunday Batch
            </button>
            <button type="button" className="btn-ghost">
              <Calendar size={16} />
              Open Calendar
            </button>
          </div>

          {/* Trust strip */}
          <div className="mt-10 flex flex-wrap items-center gap-6 text-[12.5px] text-text-muted">
            <div className="flex items-center gap-2">
              <span className="live-dot" />
              <span>2 agents working now</span>
            </div>
            <div className="hidden h-3 w-px bg-border-subtle md:block" />
            <span>Last batch · 24 auto-approved · 4 flagged</span>
            <div className="hidden h-3 w-px bg-border-subtle md:block" />
            <span>Next run · Sunday 02:00 UTC</span>
          </div>
        </motion.div>

        {/* Mascot column */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85, rotate: -4 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="relative col-span-12 hidden h-[420px] lg:col-span-5 lg:block"
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
            className="relative h-full w-full"
          >
            <Image
              src={MASCOT_HERO}
              alt="Catjack celebrating"
              fill
              priority
              unoptimized
              className="object-contain drop-shadow-[0_24px_48px_rgba(218,165,32,0.32)]"
              sizes="(min-width: 1024px) 40vw, 60vw"
            />
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
