'use client'

import { usePathname } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import Topbar from '@/components/Topbar'
import { SidebarProvider, useSidebar } from '@/components/SidebarContext'
import { cn } from '@/lib/cn'

interface ShellUser {
  email: string | null
}

function ShellInner({ children, user }: { children: React.ReactNode; user?: ShellUser | null }) {
  const { collapsed } = useSidebar()
  return (
    <div className="min-h-dvh bg-void">
      <Sidebar />
      <div
        className={cn(
          'flex min-h-dvh flex-col transition-[margin] duration-200',
          collapsed ? 'ml-[68px]' : 'ml-[240px]',
        )}
      >
        <Topbar user={user ?? undefined} />
        <main className="flex-1 px-4 py-6 sm:px-6 sm:py-7 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-[1280px]">{children}</div>
        </main>
      </div>
    </div>
  )
}

const BARE_PATH_PREFIXES = ['/login', '/auth']

export default function AppShell({
  children,
  user,
}: {
  children: React.ReactNode
  user?: ShellUser | null
}) {
  const pathname = usePathname()
  const bare = BARE_PATH_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))

  if (bare) {
    // Login + auth callback render fullscreen, no chrome.
    return <>{children}</>
  }

  return (
    <SidebarProvider>
      <ShellInner user={user}>{children}</ShellInner>
    </SidebarProvider>
  )
}
