/**
 * Catjack Studio · 1Password-backed secret resolver.
 *
 * Local dev:  start the studio with `op run -- npm run dev`. Each ref in
 *             op.env is resolved into the process env before Next.js starts,
 *             so by the time this code runs every secret is just a normal
 *             `process.env.OPENAI_API_KEY`.
 *
 * Vercel:     each secret is mirrored to a Vercel env var (one-time sync,
 *             handled at deploy). Same `process.env.X` pattern in prod.
 *
 * The wrapper around `process.env` here is intentional. It lets us:
 *   - fail loudly with a clear error if a secret is missing
 *   - centralize the canonical names so they don't drift across the codebase
 *   - log "secret X read by file Y" once per process for audit
 */

type SecretKey =
  | 'OPENAI_API_KEY'
  | 'GEMINI_API_KEY'
  | 'ELEVENLABS_API_KEY'
  | 'FAL_API_KEY'
  | 'LEONARDO_API_KEY'
  | 'POSTIZ_API_KEY'
  | 'ANTHROPIC_API_KEY'
  | 'CLOUDINARY_CLOUD_NAME'
  | 'CLOUDINARY_API_KEY'
  | 'CLOUDINARY_API_SECRET'
  | 'SUPABASE_URL'
  | 'SUPABASE_ANON_KEY'
  | 'SUPABASE_SERVICE_ROLE_KEY'
  | 'YOUTUBE_DATA_API_KEY'
  | 'YOUTUBE_REFRESH_TOKEN'
  | 'YOUTUBE_CLIENT_ID'
  | 'YOUTUBE_CLIENT_SECRET'
  | 'YOUTUBE_CHANNEL_ID'
  | 'INNGEST_EVENT_KEY'
  | 'INNGEST_SIGNING_KEY'
  | 'RAILWAY_WORKER_URL'
  | 'RAILWAY_WORKER_TOKEN'
  | 'CRON_SECRET'

const auditedReads = new Set<SecretKey>()

/**
 * Read a required secret from the environment. Throws with a clear error
 * if missing — never returns an empty string.
 */
export function secret(key: SecretKey): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(
      `[secret] Missing required env var: ${key}. ` +
        `Local dev: ensure 'op run -- npm run dev' is running. ` +
        `Production: ensure ${key} is set in Vercel project env vars.`,
    )
  }
  if (!auditedReads.has(key)) {
    auditedReads.add(key)
    if (process.env.NODE_ENV !== 'production') {
      // Quiet audit in dev — once per key per process.
      console.log(`[secret] read ${key}`)
    }
  }
  return value
}

/**
 * Read an optional secret. Returns undefined if missing — useful for
 * features that gracefully degrade (e.g. Anthropic before Block 8 is wired).
 */
export function optionalSecret(key: SecretKey): string | undefined {
  return process.env[key] || undefined
}

/**
 * Convenience accessors grouped by service. Use these in code so we
 * never type the literal env-var name twice.
 */
export const env = {
  supabase: () => ({
    url: secret('SUPABASE_URL'),
    anonKey: secret('SUPABASE_ANON_KEY'),
    serviceRoleKey: secret('SUPABASE_SERVICE_ROLE_KEY'),
  }),
  cloudinary: () => ({
    cloudName: secret('CLOUDINARY_CLOUD_NAME'),
    apiKey: secret('CLOUDINARY_API_KEY'),
    apiSecret: secret('CLOUDINARY_API_SECRET'),
  }),
  postiz:    () => secret('POSTIZ_API_KEY'),
  openai:    () => secret('OPENAI_API_KEY'),
  gemini:    () => secret('GEMINI_API_KEY'),
  anthropic: () => secret('ANTHROPIC_API_KEY'),
  eleven:    () => secret('ELEVENLABS_API_KEY'),
  fal:       () => secret('FAL_API_KEY'),
  leonardo:  () => secret('LEONARDO_API_KEY'),
  youtube:   () => ({
    dataApiKey:    optionalSecret('YOUTUBE_DATA_API_KEY'),
    refreshToken:  secret('YOUTUBE_REFRESH_TOKEN'),
    clientId:      secret('YOUTUBE_CLIENT_ID'),
    clientSecret:  secret('YOUTUBE_CLIENT_SECRET'),
    channelId:     secret('YOUTUBE_CHANNEL_ID'),
  }),
  inngest: () => ({
    eventKey:   secret('INNGEST_EVENT_KEY'),
    signingKey: secret('INNGEST_SIGNING_KEY'),
  }),
  railwayWorker: () => ({
    url:   secret('RAILWAY_WORKER_URL'),
    token: secret('RAILWAY_WORKER_TOKEN'),
  }),
}
