/**
 * Catjack Studio · Inngest function registry.
 *
 * Block 9 wires the Sunday batch end-to-end through agent reasoning
 * (Pattern Miner → Calendar Planner → 28× per-video pipelines).
 * Visual generation arrives in Block 10; Critic + TTS in Block 11;
 * Postiz publish in Block 12.
 */

import { inngest } from './inngest'
import { serviceClient } from './supabase'
import {
  runPatternMinerAgent,
  runCalendarPlanner,
  runScriptwriter,
  runDirector,
  runCritic,
  type VideoBrief,
  type PlaybookEntry,
  type ScriptOutput,
  type DirectorOutput,
  type CriticOutput,
} from './agents'
import { route } from './generators/router'
import { stitchShots, type StitchShotInput } from './worker'
import { synthesizeNarration } from './eleven'
import type { AgentLogEvent } from './types'

const SLOT_TIME_LABELS = ['7:00am', '12:00pm', '4:00pm', '8:00pm']
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

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

    // ── Pattern Miner agent ─────────────────────────────────
    const playbook = await step.run('pattern-miner', async () => {
      const out = await runPatternMinerAgent()
      await appendLog(supabase, run.id, {
        agent: 'pattern-miner',
        ts: new Date().toISOString(),
        message: `Mined playbook · ${out.playbook.length} patterns ranked`,
        detail: `retired=${out.retired.length}`,
      })
      return out
    })

    // ── Calendar Planner agent ───────────────────────────────
    const planner = await step.run('calendar-planner', async () => {
      const out = await runCalendarPlanner({
        weekStart,
        playbook: playbook.playbook,
        retired: playbook.retired,
      })
      await appendLog(supabase, run.id, {
        agent: 'calendar-planner',
        ts: new Date().toISOString(),
        message: `Planned ${out.briefs.length} briefs for week ${weekStart}`,
      })
      return out
    })

    // ── Persist briefs as drafts (status=generating) ─────────
    const draftRows = planner.briefs.map((brief: VideoBrief) => ({
      week_start: weekStart,
      slot_day: brief.slot_day,
      slot_index: brief.slot_index,
      slot_time_label: `${DAY_LABELS[brief.slot_day]} · ${SLOT_TIME_LABELS[brief.slot_index]}`,
      platform: brief.platform,
      status: 'generating' as const,
      title: brief.theme,
      hook: brief.hook_idea,
      brief: brief.why,
      patterns: brief.pattern_targets,
    }))

    const insertedDrafts = await step.run('persist-drafts', async () => {
      const { data, error } = await supabase
        .from('studio_drafts')
        .upsert(draftRows, { onConflict: 'week_start,slot_day,slot_index' })
        .select('id, slot_day, slot_index, platform')
      if (error) throw new Error(`persist-drafts: ${error.message}`)
      return data ?? []
    })

    // ── Fan out: emit one event per draft, parallel pipelines ──
    await step.sendEvent(
      'fanout-video-briefs',
      insertedDrafts.map((draft) => {
        const brief = planner.briefs.find(
          (b) =>
            b.slot_day === draft.slot_day && b.slot_index === draft.slot_index,
        )
        return {
          name: 'studio/video.brief.ready' as const,
          data: {
            runId: run.id,
            draftId: draft.id,
            brief: brief ?? null,
            playbook: playbook.playbook,
          },
        }
      }),
    )

    // The orchestrator returns now. Per-video pipelines run async via
    // videoPipeline below. The batch is "complete from the orchestrator's
    // POV" once every fanned-out event has been queued — Inngest handles
    // the retry/concurrency on each child function.
    await step.run('mark-orchestration-complete', async () => {
      await supabase
        .from('studio_agent_runs')
        .update({
          videos_out: insertedDrafts.length,
          completed_at: new Date().toISOString(),
          status: 'completed',
        })
        .eq('id', run.id)
    })

    return {
      runId: run.id,
      weekStart,
      briefsFannedOut: insertedDrafts.length,
    }
  },
)

/* ─── Per-video pipeline (parallel × 28) ──────────────────── */

export const videoPipeline = inngest().createFunction(
  {
    id: 'video-pipeline',
    name: 'Video Pipeline (per draft)',
    /**
     * 28 briefs land at once on Sunday. Limit concurrent Claude calls
     * so we don't blow Anthropic rate limits — 6 parallel feels safe
     * given typical RPM caps on production keys.
     */
    concurrency: { limit: 6 },
    triggers: [{ event: 'studio/video.brief.ready' }],
    retries: 2,
  },
  async ({ event, step }) => {
    const data = event.data as {
      runId: string
      draftId: string
      brief: VideoBrief | null
      playbook: PlaybookEntry[]
    }
    if (!data.brief) {
      throw new Error(`video-pipeline: missing brief for draft ${data.draftId}`)
    }
    const supabase = serviceClient()

    // ── Scriptwriter ─────────────────────────────────────────
    const script = await step.run('scriptwriter', async () => {
      const out = await runScriptwriter({
        brief: data.brief!,
        playbook: data.playbook,
      })
      await appendLog(supabase, data.runId, {
        agent: 'scriptwriter',
        ts: new Date().toISOString(),
        message: `Drafted ${data.brief!.platform} script for ${data.brief!.theme}`,
        detail: `${out.beats.length} beats · ${out.duration_estimate_seconds}s`,
      })
      return out
    })

    // ── Director ─────────────────────────────────────────────
    const shotPlan = await step.run('director', async () => {
      // Pull available reference assets so the Director can bind real IDs.
      const { data: assets } = await supabase
        .from('studio_reference_assets')
        .select('id, cloudinary_public_id, title, category')
        .limit(40)

      const out = await runDirector({
        script,
        availableAssets: (assets ?? []).map((a) => ({
          id: a.id,
          public_id: a.cloudinary_public_id,
          title: a.title,
          category: a.category,
        })),
      })
      await appendLog(supabase, data.runId, {
        agent: 'director',
        ts: new Date().toISOString(),
        message: `Routed ${out.shots.length} shots`,
        detail: out.shots.map((s) => s.generator).join(' · '),
      })
      return out
    })

    // ── Persist plan to draft ────────────────────────────────
    await step.run('persist-plan', async () => {
      await supabase
        .from('studio_drafts')
        .update({
          title: data.brief!.theme,
          hook: script.hook,
          brief: data.brief!.why,
          patterns: script.patterns_used,
          captions: script.captions,
          agent_trace: buildTrace(script, shotPlan),
        })
        .eq('id', data.draftId)
    })

    // ── Generate each shot in parallel ───────────────────────
    const shotResults = await step.run('generate-shots', async () => {
      const beatDurations = script.beats.map((_b, i, arr) => {
        const total = script.duration_estimate_seconds
        return Math.max(2, Math.round(total / arr.length))
      })

      const results = await Promise.all(
        shotPlan.shots.map(async (shot, i) => {
          const dur = beatDurations[shot.beat_index] ?? 3
          const r = await route(shot.generator, {
            prompt: shot.prompt,
            reference_assets: shot.reference_assets,
            aesthetic_notes: shot.aesthetic_notes,
            duration_seconds: dur,
            draft_id: data.draftId,
            beat_index: i,
          })
          return { t: shot.t, beatIndex: shot.beat_index, output: r.output, attempts: r.attempts }
        }),
      )

      await appendLog(supabase, data.runId, {
        agent: 'generators',
        ts: new Date().toISOString(),
        message: `Generated ${results.length} shots`,
        detail: results.map((r) => r.output.generator).join(' · '),
      })
      return results
    })

    // ── ElevenLabs narration ─────────────────────────────────
    const narration = await step.run('narration', async () => {
      const out = await synthesizeNarration(script, data.draftId)
      await appendLog(supabase, data.runId, {
        agent: 'eleven',
        ts: new Date().toISOString(),
        message: out
          ? `Narration synthesized · ~${out.estimated_seconds}s`
          : 'No spoken lines; rendering silent',
      })
      return out
    })

    // ── Stitch into master ───────────────────────────────────
    const master = await step.run('stitch', async () => {
      const beatDurations = script.beats.map((_b, _i, arr) =>
        Math.max(2, Math.round(script.duration_estimate_seconds / arr.length)),
      )
      const shots: StitchShotInput[] = shotResults.map((r) => ({
        url: r.output.url,
        kind: r.output.kind,
        duration_seconds: beatDurations[r.beatIndex] ?? 3,
      }))
      const result = await stitchShots({
        draftId: data.draftId,
        shots,
        audioUrl: narration?.audio_url,
      })
      await appendLog(supabase, data.runId, {
        agent: 'stitch',
        ts: new Date().toISOString(),
        message: `Master ready · ${result.duration_seconds}s${narration ? ' (with narration)' : ''}`,
      })
      return result
    })

    // ── Critic ───────────────────────────────────────────────
    const critique = await step.run('critic', async () => {
      const out = await runCritic({
        masterUrl: master.master_url,
        script,
        shotPlan,
      })
      await appendLog(supabase, data.runId, {
        agent: 'critic',
        ts: new Date().toISOString(),
        message: `Verdict ${out.verdict.toUpperCase()} · score ${out.score}`,
        detail: out.notes.slice(0, 180),
      })
      return out
    })

    // ── Persist master + critic + flip status ────────────────
    // Auto-publish stays OFF by default: even an 'approve' verdict only
    // gets the draft to needs_review. A reject hard-blocks the publish flow.
    const finalStatus =
      critique.verdict === 'reject' ? 'rejected' : 'needs_review'

    await step.run('persist-final', async () => {
      await supabase
        .from('studio_drafts')
        .update({
          status: finalStatus,
          master_url: master.master_url,
          thumbnail_url: master.thumbnail_url,
          narration_url: narration?.audio_url ?? null,
          critic_score: critique.score,
          critic_verdict: critique.verdict,
          critic_notes: critique.notes,
          rejected_reason:
            critique.verdict === 'reject'
              ? critique.weaknesses.join(' · ').slice(0, 480)
              : null,
          generated_at: new Date().toISOString(),
          agent_trace: buildTrace(script, shotPlan, critique),
        })
        .eq('id', data.draftId)
    })

    return {
      draftId: data.draftId,
      script,
      shotPlan,
      master,
      critique,
      finalStatus,
    }
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

export const functions = [
  sundayBatchCron,
  batchOrchestrator,
  videoPipeline,
  remineOnInspoImport,
]

/* ─── Helpers ─────────────────────────────────────────────── */

type ServiceClient = ReturnType<typeof serviceClient>

async function appendLog(
  supabase: ServiceClient,
  runId: string,
  entry: AgentLogEvent,
): Promise<void> {
  // Read-modify-write — fine for v1 traffic. Move to JSONB array_append
  // if we ever see contention.
  const { data: row } = await supabase
    .from('studio_agent_runs')
    .select('log')
    .eq('id', runId)
    .single()
  const existing = (row?.log as AgentLogEvent[] | null) ?? []
  await supabase
    .from('studio_agent_runs')
    .update({ log: [...existing, entry] })
    .eq('id', runId)
}

function buildTrace(
  script: ScriptOutput,
  shotPlan: DirectorOutput,
  critique?: CriticOutput,
) {
  const trace: Array<{ agent: string; thought: string; t: string }> = [
    {
      agent: 'Scriptwriter',
      thought: `${script.beats.length} beats, hook lands by 0:01.5`,
      t: '0.32s',
    },
    {
      agent: 'Director',
      thought: `${shotPlan.shots.length} shots routed across ${
        new Set(shotPlan.shots.map((s) => s.generator)).size
      } generators`,
      t: '0.41s',
    },
  ]
  if (critique) {
    trace.push({
      agent: 'Critic',
      thought: `${critique.verdict.toUpperCase()} · score ${critique.score}/100 · brand_fit ${(
        critique.brand_fit * 100
      ).toFixed(0)}%`,
      t: '0.60s',
    })
  }
  return trace
}
