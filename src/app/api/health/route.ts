import { NextResponse } from 'next/server'
import { pingSupabase } from '@/lib/supabase'
import { optionalSecret } from '@/lib/op'
import { postiz } from '@/lib/postiz'

/**
 * GET /api/health
 *
 * Smoke-check every plumbing layer. Used during build/CI to verify a
 * deployment isn't missing secrets, and exposed so the studio's Settings
 * page can light up green/red dots per integration.
 *
 * Each check is best-effort and never throws — partial outages produce
 * a 200 with detail, only catastrophic failures yield a 500.
 */
export async function GET() {
  const checks: Record<string, { ok: boolean; detail?: string }> = {}

  // Supabase + schema presence
  try {
    const r = await pingSupabase()
    checks.supabase = {
      ok: r.ok,
      detail: r.ok
        ? `${r.tablesPresent}/12 studio tables present`
        : `${r.tablesPresent}/12 studio tables present — apply 001_studio_schema.sql`,
    }
  } catch (err) {
    checks.supabase = { ok: false, detail: (err as Error).message }
  }

  // Postiz reachability + channel state
  try {
    const channels = await postiz().listIntegrations()
    const active = channels.filter((c) => !c.disabled)
    checks.postiz = {
      ok: active.length > 0,
      detail:
        active.length > 0
          ? `${active.length} active channel(s): ${active.map((c) => c.identifier).join(', ')}`
          : 'No active channels — connect at least one in Postiz dashboard',
    }
  } catch (err) {
    checks.postiz = { ok: false, detail: (err as Error).message }
  }

  // Secret presence (no values exposed — only whether they're set)
  const secretChecks: { key: string; required: boolean }[] = [
    { key: 'OPENAI_API_KEY',           required: true },
    { key: 'GEMINI_API_KEY',           required: true },
    { key: 'ELEVENLABS_API_KEY',       required: true },
    { key: 'FAL_API_KEY',              required: true },
    { key: 'LEONARDO_API_KEY',         required: false },
    { key: 'POSTIZ_API_KEY',           required: true },
    { key: 'ANTHROPIC_API_KEY',        required: false }, // Block 8
    { key: 'CLOUDINARY_CLOUD_NAME',    required: true },
    { key: 'CLOUDINARY_API_KEY',       required: true },
    { key: 'CLOUDINARY_API_SECRET',    required: true },
    { key: 'YOUTUBE_REFRESH_TOKEN',    required: true },
    { key: 'YOUTUBE_CHANNEL_ID',       required: true },
    { key: 'INNGEST_EVENT_KEY',        required: false }, // Block 7
    { key: 'INNGEST_SIGNING_KEY',      required: false }, // Block 7
    { key: 'RAILWAY_WORKER_URL',       required: false }, // Block 3
    { key: 'RAILWAY_WORKER_TOKEN',     required: false }, // Block 3
  ]

  let secretsMissingRequired = 0
  for (const s of secretChecks) {
    const present = !!optionalSecret(s.key as never)
    if (s.required && !present) secretsMissingRequired++
  }
  checks.secrets = {
    ok: secretsMissingRequired === 0,
    detail:
      secretsMissingRequired === 0
        ? 'All required secrets resolved from 1Password'
        : `${secretsMissingRequired} required secret(s) missing`,
  }

  // Aggregate
  const overallOk = Object.values(checks).every((c) => c.ok)

  return NextResponse.json({
    ok: overallOk,
    checks,
    timestamp: new Date().toISOString(),
  })
}
