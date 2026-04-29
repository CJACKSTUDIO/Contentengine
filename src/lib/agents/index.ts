/**
 * Catjack Studio · Agent registry.
 *
 * The five (technically six) agents the studio runs. Block 9-11 wire
 * them into the Inngest batch orchestrator.
 */

export { runPatternMinerAgent } from './pattern-miner'
export type { MinerOutput, PlaybookEntry } from './pattern-miner'

export { runCalendarPlanner } from './calendar-planner'
export type { PlannerOutput, VideoBrief, PlannerArgs } from './calendar-planner'

export { runScriptwriter } from './scriptwriter'
export type { ScriptOutput, ScriptBeat, ScriptwriterArgs } from './scriptwriter'

export { runDirector } from './director'
export type { DirectorOutput, DirectorShot, DirectorArgs, Generator } from './director'

export { runCritic } from './critic'
export type { CriticOutput, CriticArgs } from './critic'

export { runCurator } from './curator'
export type { CuratorOutput, CuratorRanked, CuratorScoredDraft } from './curator'

export { runAgent, brandSystemPrompt } from './anthropic'
export type { AgentResult, AgentModel } from './anthropic'
