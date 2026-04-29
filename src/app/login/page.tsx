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
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
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
          <form onSubmit={handleSubmit} className="mt-6 space-y-3">
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
        )}

        <p className="mt-6 text-center text-[11.5px] text-text-muted">
          Single-operator studio · access by email allow-list
        </p>
      </div>
    </main>
  )
}
