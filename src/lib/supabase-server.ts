/**
 * Catjack Studio · Server-side Supabase client with cookie auth.
 *
 * Reads/writes the Supabase auth cookie from Next's request context so
 * server components, route handlers, and middleware all share the same
 * session. Uses the anon key — RLS still applies.
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { env } from './op'

export async function authedServerClient() {
  const store = await cookies()
  const cfg = env.supabase()
  return createServerClient(cfg.url, cfg.anonKey, {
    cookies: {
      get(name: string) {
        return store.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        // In server components, set may be a no-op — that's OK because the
        // middleware refreshes cookies on each request. We swallow the error
        // here so SSR pages don't crash.
        try {
          store.set({ name, value, ...options })
        } catch {
          /* no-op */
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          store.set({ name, value: '', ...options })
        } catch {
          /* no-op */
        }
      },
    },
  })
}

/** Returns the current session user, or null if signed out. */
export async function currentUser(): Promise<{ id: string; email: string | null } | null> {
  const supabase = await authedServerClient()
  const { data } = await supabase.auth.getUser()
  if (!data.user) return null
  return { id: data.user.id, email: data.user.email ?? null }
}
