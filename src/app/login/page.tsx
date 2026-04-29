'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Mail, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { browserClient } from '@/lib/supabase'

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const params = useSearchParams()
  const next = params.get('next') ?? '/'
  const initialError = params.get('error') === 'forbidden'
    ? 'That email is not on the studio allow-list.'
    : null

  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error' | 'google'>('idle')
  const [error, setError] = useState<string | null>(initialError)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setStatus('sending')
    setError(null)

    const supabase = browserClient()
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    })

    if (error) {
      setStatus('error')
      setError(error.message)
      return
    }
    setStatus('sent')
  }

  const handleGoogle = async () => {
    setStatus('google')
    setError(null)
    const supabase = browserClient()
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    })
    if (error) {
      setStatus('error')
      setError(error.message)
    }
    // On success the browser is already navigating to Google — nothing else to do.
  }

  return (
    <main className="grid min-h-dvh place-items-center bg-deep px-6">
      <div className="card-elev w-full max-w-[400px] p-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <span className="subtitle">Catjack Studio</span>
        <h1
          className="mt-1 text-[28px] leading-tight text-text-primary"
          style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 700 }}
        >
          Sign in
        </h1>
        <p className="mt-2 text-[13.5px] text-text-secondary">
          Enter your email to get a magic link. No password required.
        </p>

        {status === 'sent' ? (
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-green-500/30 bg-green-500/5 p-4">
            <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-green-400" />
            <div>
              <p className="text-[13.5px] font-semibold text-text-primary">
                Check your inbox
              </p>
              <p className="mt-1 text-[12.5px] text-text-secondary">
                We sent a magic link to <span className="text-text-primary">{email}</span>.
                Click it to sign in.
              </p>
            </div>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={handleGoogle}
              disabled={status === 'google'}
              className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-border-subtle bg-white text-[14px] font-semibold text-[#0E0E15] transition-colors hover:bg-[#f4f4f7] disabled:opacity-50"
            >
              {status === 'google' ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC04" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83C6.71 7.31 9.14 5.38 12 5.38z"/>
                </svg>
              )}
              Continue with Google
            </button>

            <div className="my-5 flex items-center gap-3 text-[10.5px] uppercase tracking-[0.18em] text-text-muted">
              <span className="h-px flex-1 bg-border-subtle" />
              or email
              <span className="h-px flex-1 bg-border-subtle" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
            <label className="block">
              <span className="subtitle">Email</span>
              <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-border-subtle bg-void/30 px-3 py-2 focus-within:border-gold/50">
                <Mail size={14} className="text-text-muted" />
                <input
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@catjack.app"
                  className="flex-1 bg-transparent text-[13.5px] text-text-primary outline-none"
                />
              </div>
            </label>

            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-red/30 bg-red/5 p-3 text-[12.5px] text-red">
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={status === 'sending' || !email}
              className="btn-gold mt-2 inline-flex h-11 w-full items-center justify-center gap-2 disabled:opacity-50"
            >
              {status === 'sending' ? <Loader2 size={14} className="animate-spin" /> : null}
              Send magic link
            </button>
            </form>
          </>
        )}

        <p className="mt-6 text-center text-[11.5px] text-text-muted">
          Single-operator studio · access by email allow-list
        </p>
      </div>
    </main>
  )
}
