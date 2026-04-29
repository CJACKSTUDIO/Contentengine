import { serve } from 'inngest/next'
import { inngest } from '@/lib/inngest'
import { functions } from '@/lib/inngest-functions'

/**
 * Inngest webhook endpoint. The Inngest cloud calls this URL to:
 *   - introspect our function registry (GET)
 *   - invoke a function step (POST)
 *
 * Auth: handled by `inngest/next` using INNGEST_SIGNING_KEY (set via
 * Vercel env, sourced from 1Password). The serve helper validates
 * every incoming request signature.
 */
export const { GET, POST, PUT } = serve({
  client: inngest(),
  functions,
})
