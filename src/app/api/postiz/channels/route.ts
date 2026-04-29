import { NextResponse } from 'next/server'
import { postiz, PostizError } from '@/lib/postiz'

/**
 * GET /api/postiz/channels
 *
 * Returns the live list of social channels connected to the Postiz workspace.
 * Used by the Settings page health card and the Calendar's draft scheduler
 * to discover which platforms are eligible for a given draft.
 */
export async function GET() {
  try {
    const channels = await postiz().listIntegrations()
    return NextResponse.json({
      ok: true,
      count: channels.length,
      channels: channels.map((c) => ({
        id: c.id,
        platform: c.identifier,
        name: c.name,
        profile: c.profile,
        picture: c.picture,
        disabled: c.disabled,
      })),
    })
  } catch (err) {
    const status = err instanceof PostizError ? err.status : 500
    const message = (err as Error).message ?? 'Failed to reach Postiz'
    return NextResponse.json({ ok: false, error: message }, { status })
  }
}
