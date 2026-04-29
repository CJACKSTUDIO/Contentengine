import express, { type Request, type Response, type NextFunction } from 'express'
import { z } from 'zod'
import { ingest } from './ingest.js'

const PORT = Number(process.env.PORT ?? 8080)
const WORKER_TOKEN = process.env.WORKER_AUTH_TOKEN

if (!WORKER_TOKEN) {
  // Fail loud — this should never run unauthenticated.
  // eslint-disable-next-line no-console
  console.error('[worker] FATAL · WORKER_AUTH_TOKEN env var not set')
  process.exit(1)
}

const app = express()
app.use(express.json({ limit: '1mb' }))

// ── Auth middleware (bearer token) ─────────────────────────
function requireAuth(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization ?? ''
  const supplied = auth.replace(/^Bearer\s+/i, '').trim()
  if (!supplied || supplied !== WORKER_TOKEN) {
    res.status(401).json({ ok: false, error: 'Unauthorized' })
    return
  }
  next()
}

// ── Health (no auth — Railway needs to ping this) ──────────
app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'catjack-content-worker',
    version: process.env.RAILWAY_GIT_COMMIT_SHA?.slice(0, 7) ?? 'dev',
    uptime_seconds: Math.round(process.uptime()),
  })
})

// ── Ingest endpoint ────────────────────────────────────────
const IngestBody = z.object({
  url: z.string().url(),
  /** Optional Cloudinary folder override; defaults to catjack/studio/inspo. */
  folder: z.string().optional(),
})

app.post('/ingest', requireAuth, async (req, res) => {
  const parsed = IngestBody.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: parsed.error.message })
  }

  try {
    const result = await ingest({
      url: parsed.data.url,
      folder: parsed.data.folder ?? 'catjack/studio/inspo',
    })
    return res.json({ ok: true, ...result })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Ingest failed'
    // eslint-disable-next-line no-console
    console.error('[worker] ingest error:', message)
    return res.status(502).json({ ok: false, error: message })
  }
})

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  // eslint-disable-next-line no-console
  console.error('[worker] uncaught:', err)
  res.status(500).json({ ok: false, error: err.message })
})

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[worker] listening on :${PORT}`)
})
