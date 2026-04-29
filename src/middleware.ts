import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

/**
 * Auth gate — every page route requires a valid Supabase session.
 *
 * Public exemptions:
 *   - /login + /auth/* + /api/auth/* (magic-link UI + callback)
 *   - /api/inngest (Inngest cloud calls this; signed via INNGEST_SIGNING_KEY)
 *   - /api/cron/* (Vercel cron — guarded by CRON_SECRET internally)
 *   - /api/health (readiness probe; safe to leak status booleans)
 *   - /favicon.ico, /_next/* (Next internals + static assets)
 *
 * If a single allowed-emails list is set via STUDIO_ALLOWED_EMAILS
 * (comma-separated), authenticated users not in the list are also
 * bounced to /login. Catjack is single-operator for now (Daniel).
 */
const PUBLIC_PATHS = [
  '/login',
  '/auth',
  '/api/auth',
  '/api/inngest',
  '/api/cron',
  '/api/health',
]

function isPublic(pathname: string): boolean {
  if (pathname === '/favicon.ico') return true
  if (pathname.startsWith('/_next/')) return true
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Allow-listed paths skip auth entirely.
  if (isPublic(pathname)) return NextResponse.next()

  const res = NextResponse.next({ request: { headers: req.headers } })

  const url = process.env.SUPABASE_URL
  const anonKey = process.env.SUPABASE_ANON_KEY
  if (!url || !anonKey) {
    // Fail open during build / preview when env not yet set.
    return res
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      get: (name: string) => req.cookies.get(name)?.value,
      set: (name: string, value: string, options: CookieOptions) => {
        res.cookies.set({ name, value, ...options })
      },
      remove: (name: string, options: CookieOptions) => {
        res.cookies.set({ name, value: '', ...options })
      },
    },
  })

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/login'
    redirectUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Optional allow-list check — single-operator hardening.
  const allowed = process.env.STUDIO_ALLOWED_EMAILS
  if (allowed && user.email) {
    const list = allowed.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean)
    if (list.length > 0 && !list.includes(user.email.toLowerCase())) {
      const redirectUrl = req.nextUrl.clone()
      redirectUrl.pathname = '/login'
      redirectUrl.searchParams.set('error', 'forbidden')
      return NextResponse.redirect(redirectUrl)
    }
  }

  return res
}

export const config = {
  matcher: [
    // Run on every request except static files. The function itself
    // decides whether to enforce auth based on PUBLIC_PATHS.
    '/((?!_next/static|_next/image|.*\\..*).*)',
  ],
}
