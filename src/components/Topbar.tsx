'use client'

import { usePathname } from 'next/navigation'
import { Search, Bell, ChevronRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/cn'
import { navItems } from '@/lib/nav'

function titleFor(pathname: string): string {
  const item = navItems.find((n) =>
    n.href === '/' ? pathname === '/' : pathname.startsWith(n.href),
  )
  return item?.label ?? 'Studio'
}

export default function Topbar() {
  const pathname = usePathname()
  const title = titleFor(pathname)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <motion.header
      initial={false}
      animate={{
        backgroundColor: scrolled
          ? 'rgba(7, 7, 12, 0.85)'
          : 'rgba(7, 7, 12, 0.4)',
        boxShadow: scrolled
          ? '0 1px 0 rgba(255, 255, 255, 0.06), 0 8px 24px rgba(0, 0, 0, 0.32)'
          : '0 1px 0 rgba(255, 255, 255, 0)',
      }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className={cn(
        'sticky top-0 z-30 flex h-[64px] items-center gap-4 border-b border-border-subtle px-6 backdrop-blur-xl',
      )}
    >
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[13px] text-text-muted">
        <span>Studio</span>
        <ChevronRight size={14} className="text-text-muted/60" />
        <motion.span
          key={title}
          initial={{ opacity: 0, x: -4 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
          className="text-text-primary"
          style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 600 }}
        >
          {title}
        </motion.span>
      </div>

      <div className="flex-1" />

      {/* Search */}
      <label className="flex h-9 w-[280px] items-center gap-2 rounded-xl border border-border-subtle bg-white/[0.03] px-3 text-[13px] text-text-secondary transition-colors focus-within:border-gold/40 focus-within:bg-white/[0.06]">
        <Search size={15} className="text-text-muted" />
        <input
          type="search"
          placeholder="Search drafts, patterns, inspo..."
          className="flex-1 bg-transparent text-text-primary placeholder:text-text-muted focus:outline-none"
        />
        <kbd
          className="rounded-md border border-border-subtle bg-deep px-1.5 py-0.5 text-[10px] text-text-muted"
          style={{ fontFamily: 'var(--font-mono), monospace' }}
        >
          ⌘K
        </kbd>
      </label>

      {/* Notifications */}
      <button
        type="button"
        className="relative grid h-9 w-9 place-items-center rounded-xl border border-border-subtle bg-white/[0.03] text-text-secondary transition-all duration-200 hover:border-gold/40 hover:bg-white/[0.06] hover:text-text-primary"
        aria-label="Notifications"
      >
        <Bell size={15} />
        <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-gold-bright ring-2 ring-void" />
      </button>

      {/* User pill */}
      <div className="flex h-9 items-center gap-2 rounded-xl border border-border-subtle bg-white/[0.03] pl-1.5 pr-3 transition-colors hover:border-gold/40">
        <div
          className="grid h-6 w-6 place-items-center rounded-full text-[11px] font-bold"
          style={{
            background: 'linear-gradient(135deg, var(--accent-gold) 0%, var(--accent-gold-bright) 100%)',
            color: '#0E0E15',
          }}
        >
          D
        </div>
        <span className="text-[13px] font-semibold text-text-primary">Daniel</span>
      </div>
    </motion.header>
  )
}
