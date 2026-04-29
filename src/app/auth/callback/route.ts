import { NextResponse, type NextRequest } from 'next/server'
import { authedServerClient } from '@/lib/supabase-server'

/**
 * GET /auth/callback?code=...&next=...
 *
 * Handles Supabase magic-link redirects. Exchanges the URL `code` for
 * a session cookie, then bounces to `next` (or `/` by default).
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const next = url.searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await authedServerClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      const errUrl = req.nextUrl.clone()
      errUrl.pathname = '/login'
      errUrl.searchParams.set('error', error.message)
      return NextResponse.redirect(errUrl)
    }
  }

  const redirect = req.nextUrl.clone()
  redirect.pathname = next.startsWith('/') ? next : '/'
  redirect.search = ''
  return NextResponse.redirect(redirect)
}
