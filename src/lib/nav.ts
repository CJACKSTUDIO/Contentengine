import {
  LayoutDashboard,
  Calendar,
  Brain,
  Sparkles,
  Library,
  Bot,
  Settings,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  href: string
  label: string
  Icon: LucideIcon
  /** Stage number this surface ships in (used for placeholder copy) */
  stage: number
}

export const navItems: NavItem[] = [
  { href: '/',             label: 'Dashboard',    Icon: LayoutDashboard, stage: 5 },
  { href: '/calendar',     label: 'Calendar',     Icon: Calendar,        stage: 2 },
  { href: '/intelligence', label: 'Intelligence', Icon: Brain,           stage: 3 },
  { href: '/inspo',        label: 'Inspo',        Icon: Sparkles,        stage: 4 },
  { href: '/vault',        label: 'Vault',        Icon: Library,         stage: 6 },
  { href: '/agents',       label: 'Agents',       Icon: Bot,             stage: 7 },
  { href: '/settings',     label: 'Settings',     Icon: Settings,        stage: 8 },
]
