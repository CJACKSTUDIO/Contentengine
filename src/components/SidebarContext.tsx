'use client'

import { createContext, useContext, useEffect, useState } from 'react'

interface SidebarState {
  collapsed: boolean
  toggle: () => void
  setCollapsed: (v: boolean) => void
}

const Ctx = createContext<SidebarState>({
  collapsed: false,
  toggle: () => {},
  setCollapsed: () => {},
})

const STORAGE_KEY = 'catjack-studio:sidebar-collapsed'

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)

  // Restore from localStorage on mount. The setState-in-effect rule
  // is overly strict for this hydration pattern.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const stored = window.localStorage.getItem(STORAGE_KEY)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (stored === '1') setCollapsed(true)
  }, [])

  // Persist when it changes.
  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(STORAGE_KEY, collapsed ? '1' : '0')
  }, [collapsed])

  return (
    <Ctx.Provider
      value={{ collapsed, toggle: () => setCollapsed((v) => !v), setCollapsed }}
    >
      {children}
    </Ctx.Provider>
  )
}

export function useSidebar() {
  return useContext(Ctx)
}
