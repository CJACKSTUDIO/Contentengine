/**
 * Catjack Studio · Inngest function registry.
 *
 * Block 7 ships function shells. Reasoning bodies arrive in:
 *   - Block 8 (Pattern Miner + Calendar Planner agents)
 *   - Block 9 (Scriptwriter + Director per-video)
 *   - Block 10 (Visual generation routing)
 *   - Block 11 (ElevenLabs TTS + Critic)
 *   - Block 12 (Postiz publish)
 *
 * Every function logs to studio_agent_runs so the Agents page has
 * live trace data even before the agents do real reasoning.
 */

import { inngest } from './inngest'
import { serviceClient } from './supabase'

/* ─── Sunday cron trigger ──────────────────────────────────── */

export const sundayBatchCron = inngest().createFunction(
  {
    id: 'sunday-batch-cron',
    name: 'Sunday Batch Cron',
    triggers: [{ cron: '0 2 * * 0' }],
  },
  async ({ step }) => {
    const weekStart = await step.run('compute-week-start', () => {
      const d = new Date()
      const day = d.getUTCDay()
      const daysToMonday = (8 - day) % 7 || 7
      d.setUTCDate(d.getUTCDate() + daysToMonday)
      d.setUTCHours(0, 0, 0, 0)
      return d.toISOString().slice(0, 10)
    })

    await step.sendEvent('emit-batch-trigger', {
      name: 'studio/batch.cron.fired',
      data: { weekStart },
    })

    return { weekStart, triggered: true }
  },
)

/* ─── Batch orchestrator (cron + manual share this body) ──── */

export const batchOrchestrator = inngest().createFunction(
  {
    id: 'batch-orchestrator',
    name: 'Batch Orchestrator',
    concurrency: { limit: 1 },
    triggers: [
      { event: 'studio/batch.cron.fired' },
      { event: 'studio/batch.manual.requested' },
    ],
  },
  async ({ event, step, runId }) => {
    const data = event.data as { weekStart?: string; trigger?: string }
    const weekStart =
      data.weekStart ?? new Date().toISOString().slice(0, 10)
    const trigger =
      data.trigger ??
      (event.name === 'studio/batch.cron.fired' ? 'cron' : 'manual')

    const supabase = serviceClient()

    const run = await step.run('open-agent-run', async () => {
      const { data: row, error } = await supabase
        .from('studio_agent_runs')
        .insert({
          run_type: 'sunday-batch',
          triggered_by: trigger === 'cron' ? 'cron' : 'manual',
          status: 'running',
          inngest_run_id: runId,
          log: [
            {
              agent: 'orchestrator',
              ts: new Date().toISOString(),
              message: 'Batch orchestrator started',
              detail: `weekStart=${weekStart}`,
            },
          ],
        })
        .select('id')
        .single()
      if (error || !row) throw new Error(`open-agent-run: ${error?.message}`)
      return row
    })

    // Block 7 stops here — Block 8 wires Pattern Miner + Calendar Planner.
    await step.run('placeholder-block-8-handoff', async () => ({
      note: 'Block 8 will continue from here',
      runId,
      weekStart,
    }))

    await step.run('close-agent-run', async () => {
      await supabase
        .from('studio_agent_runs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', run.id)
    })

    return { runId: run.id, weekStart, status: 'completed' }
  },
)

/* ─── Inspo-imported event handler ────────────────────────── */

export const remineOnInspoImport = inngest().createFunction(
  {
    id: 'remine-on-inspo-import',
    name: 'Remine on inspo import',
    triggers: [{ event: 'studio/inspo.imported' }],
  },
  async ({ step }) => {
    await step.sleep('debounce', '30s')
    return { debounced: true }
  },
)

/* ─── Registry ────────────────────────────────────────────── */

export const functions = [sundayBatchCron, batchOrchestrator, remineOnInspoImport]
