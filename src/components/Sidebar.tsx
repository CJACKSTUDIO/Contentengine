'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { ChevronsLeft, ChevronsRight } from 'lucide-react'
import { cn } from '@/lib/cn'
import { navItems } from '@/lib/nav'
import { img, logo } from '@/lib/cloudinary'
import { useSidebar } from '@/components/SidebarContext'

const LOGO_URL = img(logo, { w: 120 })

export default function Sidebar() {
  const pathname = usePathname()
  const { collapsed, toggle } = useSidebar()

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 flex h-dvh flex-col border-r border-border-subtle bg-deep transition-[width] duration-200',
        collapsed ? 'w-[68px]' : 'w-[240px]',
      )}
    >
      {/* Brand */}
      <div
        className={cn(
          'flex items-center gap-3 py-5',
          collapsed ? 'justify-center px-3' : 'px-4',
        )}
      >
        <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full ring-1 ring-gold/40">
          <Image
            src={LOGO_URL}
            alt="Catjack"
            fill
            sizes="36px"
            className="object-cover"
            unoptimized
            priority
          />
        </div>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, delay: 0.05 }}
            className="flex min-w-0 flex-col leading-tight"
          >
            <span
              className="truncate text-[15px] font-extrabold tracking-tight text-text-primary"
              style={{ fontFamily: 'var(--font-display), sans-serif' }}
            >
              Catjack Studio
            </span>
            <span className="subtitle truncate text-[10px]">Content Engine</span>
          </motion.div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2">
        <ul className="flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive =
              item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  data-active={isActive ? 'true' : 'false'}
                  className={cn(
                    'nav-underline group relative flex items-center gap-3 rounded-xl py-2.5 text-[13.5px] transition-all duration-200',
                    isActive
                      ? 'text-text-primary'
                      : 'text-text-secondary hover:bg-white/[0.03] hover:text-text-primary',
                    collapsed ? 'justify-center px-0' : 'px-3',
                  )}
                  title={item.label}
                >
                  {isActive && (
                    <motion.span
                      layoutId="nav-active-pill"
                      className="absolute inset-0 -z-10 rounded-xl"
                      style={{
                        background:
                          'linear-gradient(90deg, rgba(218,165,32,0.16) 0%, rgba(218,165,32,0.04) 100%)',
                        boxShadow: 'inset 2px 0 0 0 var(--accent-gold-bright)',
                      }}
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    />
                  )}
                  <item.Icon
                    size={18}
                    className={cn(
                      'shrink-0 transition-colors duration-200',
                      isActive ? 'text-gold-bright' : 'group-hover:text-gold-bright',
                    )}
                    strokeWidth={2}
                  />
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.18 }}
                      className="truncate font-semibold"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Footer — collapse toggle (always visible) */}
      <div className={cn('border-t border-border-subtle p-2', collapsed && 'px-1')}>
        <button
          type="button"
          onClick={toggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={cn(
            'flex w-full items-center gap-3 rounded-xl py-2 text-[12px] text-text-muted transition-colors hover:bg-white/[0.03] hover:text-text-secondary',
            collapsed ? 'justify-center px-0' : 'px-3',
          )}
        >
          {collapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
          {!collapsed && <span className="font-semibold">Collapse</span>}
        </button>
      </div>
    </aside>
  )
}
