'use client'

import Sidebar from '@/components/Sidebar'
import Topbar from '@/components/Topbar'
import { SidebarProvider, useSidebar } from '@/components/SidebarContext'
import { cn } from '@/lib/cn'

function ShellInner({ children }: { children: React.ReactNode }) {
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
        <Topbar />
        <main className="flex-1 px-4 py-6 sm:px-6 sm:py-7 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-[1280px]">{children}</div>
        </main>
      </div>
    </div>
  )
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <ShellInner>{children}</ShellInner>
    </SidebarProvider>
  )
}
