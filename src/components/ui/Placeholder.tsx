'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import { img, mascot } from '@/lib/cloudinary'

const MASCOT = img(mascot.reading, { w: 400 })

interface PlaceholderProps {
  title: string
  stage: number
  description: string
}

export default function Placeholder({ title, stage, description }: PlaceholderProps) {
  return (
    <div className="relative -mx-8 -mt-8 overflow-hidden">
      {/* Cinematic gold glow at top */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[460px]"
        style={{
          background:
            'radial-gradient(ellipse 60% 80% at 50% 0%, rgba(245,197,66,0.16) 0%, rgba(127,119,221,0.08) 45%, rgba(7,7,12,0) 100%)',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative grid place-items-center px-8 py-32"
      >
        <div className="card flex max-w-[640px] flex-col items-center gap-6 p-12 text-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5, type: 'spring' }}
            className="relative h-32 w-32"
          >
            <Image
              src={MASCOT}
              alt=""
              fill
              sizes="128px"
              className="object-contain drop-shadow-[0_8px_24px_rgba(218,165,32,0.25)]"
              unoptimized
              priority
            />
          </motion.div>

          <span className="subtitle">Stage {stage} · Coming up</span>

          <h1
            className="text-[44px] leading-[1.05] tracking-tight text-text-primary"
            style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 700 }}
          >
            {title}
          </h1>

          <p className="max-w-[460px] text-[15.5px] leading-relaxed text-text-secondary">
            {description}
          </p>
        </div>
      </motion.div>
    </div>
  )
}
