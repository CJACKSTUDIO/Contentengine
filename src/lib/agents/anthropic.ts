/**
 * Catjack Studio · Anthropic / Claude client.
 *
 * Single source of truth for Claude calls across all five agents.
 * The runAgent helper wraps a tool-use round trip so callers get
 * back fully-typed JSON without ever parsing model prose.
 *
 * Models we use:
 *   - claude-opus-4-7   — reasoning-heavy work (Scriptwriter, Pattern Miner)
 *   - claude-sonnet-4-6 — high-volume per-video work (Director, Critic, Curator)
 */

import Anthropic from '@anthropic-ai/sdk'
import { env } from '../op'

let _client: Anthropic | null = null
function client(): Anthropic {
  if (_client) return _client
  _client = new Anthropic({ apiKey: env.anthropic() })
  return _client
}

export type AgentModel = 'claude-opus-4-7' | 'claude-sonnet-4-6'

export interface RunAgentArgs<TOutput> {
  /** System prompt — defines the agent's role + constraints. */
  system: string
  /** User-facing input. Free-form text; pre-rendered context goes here. */
  input: string
  /** Name of the tool whose input shape == the agent's output shape. */
  outputToolName: string
  /** Short description shown to Claude. */
  outputToolDescription: string
  /** JSON schema that defines the output structure. */
  outputSchema: Record<string, unknown>
  model?: AgentModel
  /** Hard ceiling on tokens. Default 4096. */
  maxTokens?: number
  /** Lower for more deterministic output. Default 0.4. */
  temperature?: number
  /** Optional pre-validation cast. Throws if shape is wrong. */
  validate?: (raw: unknown) => TOutput
}

export interface AgentResult<TOutput> {
  output: TOutput
  /** Cost-tracking metadata for studio_agent_runs. */
  inputTokens: number
  outputTokens: number
  model: AgentModel
  /** Total duration in ms (incl. network). */
  durationMs: number
}

export async function runAgent<TOutput>(
  args: RunAgentArgs<TOutput>,
): Promise<AgentResult<TOutput>> {
  const startedAt = Date.now()
  const model = args.model ?? 'claude-sonnet-4-6'
  const maxTokens = args.maxTokens ?? 4096
  const temperature = args.temperature ?? 0.4

  const response = await client().messages.create({
    model,
    max_tokens: maxTokens,
    temperature,
    system: args.system,
    tool_choice: { type: 'tool', name: args.outputToolName },
    tools: [
      {
        name: args.outputToolName,
        description: args.outputToolDescription,
        input_schema: args.outputSchema as Anthropic.Tool.InputSchema,
      },
    ],
    messages: [{ role: 'user', content: args.input }],
  })

  const toolUse = response.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use',
  )

  if (!toolUse) {
    throw new Error(
      `[runAgent:${args.outputToolName}] Claude did not invoke the output tool. ` +
        `stop_reason=${response.stop_reason}`,
    )
  }

  const raw = toolUse.input as unknown
  const output = args.validate ? args.validate(raw) : (raw as TOutput)

  return {
    output,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
    model,
    durationMs: Date.now() - startedAt,
  }
}

/**
 * Compose a Claude system prompt block. Common preamble + role-specific
 * suffix so the brand voice stays consistent across agents.
 */
export function brandSystemPrompt(rolePrompt: string): string {
  return `You are an agent working inside Catjack Studio — a content engine
that generates short-form social videos for the Catjack World kids brand.
The audience is parents + kids ages 5-10. The brand voice is warm,
playful, and never ironic. Always favour clarity over cleverness.

When you call a tool, only return the structured output — never reasoning prose.
${rolePrompt.trim()}`.trim()
}
