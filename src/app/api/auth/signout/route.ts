import { NextResponse } from 'next/server'
import { authedServerClient } from '@/lib/supabase-server'

export async function POST() {
  const supabase = await authedServerClient()
  await supabase.auth.signOut()
  return NextResponse.json({ ok: true })
}
