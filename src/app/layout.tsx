import type { Metadata } from 'next'
import { Nunito, Fredoka, JetBrains_Mono } from 'next/font/google'
import { Toaster } from 'sonner'
import AppShell from '@/components/AppShell'
import { currentUser } from '@/lib/supabase-server'
import './globals.css'

const nunito = Nunito({
  variable: '--font-nunito',
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  display: 'swap',
})

const fredoka = Fredoka({
  variable: '--font-fredoka',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
})

const jetbrains = JetBrains_Mono({
  variable: '--font-jetbrains',
  subsets: ['latin'],
  weight: ['400', '600'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Catjack Studio',
  description: 'The content engine behind Catjack World.',
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Best-effort: read the session so the topbar can show the user's email.
  // currentUser() may throw at build time if env isn't set — swallow and render anonymously.
  let user: { id: string; email: string | null } | null = null
  try {
    user = await currentUser()
  } catch {
    user = null
  }
  return (
    <html
      lang="en"
      className={`${nunito.variable} ${fredoka.variable} ${jetbrains.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <AppShell user={user}>{children}</AppShell>
        <Toaster
          theme="dark"
          position="top-right"
          toastOptions={{
            style: {
              background: 'var(--bg-surface)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-subtle)',
              fontFamily: 'var(--font-nunito), sans-serif',
            },
          }}
        />
      </body>
    </html>
  )
}
