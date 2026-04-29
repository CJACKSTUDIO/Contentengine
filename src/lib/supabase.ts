/**
 * Catjack Studio · Supabase clients.
 *
 * Two flavors:
 *   - serviceClient(): full RLS bypass via the service role. Use this in
 *     API routes + Inngest functions. Not safe for browser use.
 *   - browserClient(): anon key, suitable for client components if we
 *     ever need direct reads (we mostly go through API routes).
 *
 * Both lazily resolve secrets so importing this module does not crash
 * during the build phase if env vars aren't yet present.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { env } from './op'

let _service: SupabaseClient | null = null
let _browser: SupabaseClient | null = null

/** Service-role client — use only on the server. RLS bypassed. */
export function serviceClient(): SupabaseClient {
  if (_service) return _service
  const cfg = env.supabase()
  _service = createClient(cfg.url, cfg.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { 'X-Catjack-Studio': 'service' } },
  })
  return _service
}

/** Anon client — safe for the browser. */
export function browserClient(): SupabaseClient {
  if (_browser) return _browser
  const cfg = env.supabase()
  _browser = createClient(cfg.url, cfg.anonKey, {
    global: { headers: { 'X-Catjack-Studio': 'browser' } },
  })
  return _browser
}

/**
 * Run a small ping query so we know the connection works. Used by the
 * /api/health route to surface schema state in the UI.
 */
export async function pingSupabase(): Promise<{ ok: boolean; tablesPresent: number }> {
  const supabase = serviceClient()

  const expected = [
    'studio_inspo_videos',
    'studio_inspo_patterns',
    'studio_pattern_performance',
    'studio_pattern_evolution',
    'studio_drafts',
    'studio_posted_videos',
    'studio_video_metrics_daily',
    'studio_comment_intents',
    'studio_agent_runs',
    'studio_style_profiles',
    'studio_reference_assets',
    'studio_human_signals',
  ]

  let present = 0
  for (const table of expected) {
    // Cheap probe — returns 0 rows but proves the table exists + we have access.
    const { error } = await supabase.from(table).select('*', { head: true, count: 'exact' }).limit(0)
    if (!error) present++
  }

  return { ok: present === expected.length, tablesPresent: present }
}
