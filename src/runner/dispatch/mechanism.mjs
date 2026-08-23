// dispatch/mechanism.mjs — in-process / out-of-process / unavailable (D7,
// tsk-2uf-1): `decideDispatchMechanism` (Native-First Dispatch Doctrine
// rules 1/2/4, pure over three caller-supplied booleans) and
// `decideExecutorDispatchMechanism` (the `executors.<id>`-specific
// convenience over it, D-ADR0033: config wins over `hasLiveTaskAccess` for
// a cli-spawn-shaped executor — unchanged by this split). Split out of the
// former `src/runner/dispatch.mjs` (2204 lines, 6 concerns in one file) —
// pure move, no behavior change; `src/runner/dispatch.mjs` re-exports every
// name below unchanged as a barrel. See `docs/history/dispatch-activation-
// and-handoff-redesign/CONTEXT.md` D7 for the split rationale.

import { resolveExecutorAndOverrides } from './resolve.mjs';

/**
 * Native-First Dispatch Doctrine rules 1/2/4 (`docs/decisions/0026-vision-
 * orchestrator-roottask-executor-native-vs-cli-spawn.md`), as one pure
 * decision — tsk-3ik-1, Phase 4's own shared helper. Deliberately generic
 * over BOTH dispatch targets the doctrine names (a `executors.<id>`
 * executor, or a live session's own direct subTask/Task-tool call) — this
 * function never reads `cfg`/config itself, only the three booleans any
 * caller for either target shape can derive on its own:
 *
 * - `hasNativeMechanism` — does this target have a real native-dispatch
 *   mechanism at all (a executor declaring `kind:"task"`; a subTask the
 *   caller could invoke via its own Agent/Task tool)? Rule 1: a mechanical
 *   target with no such mechanism always cli/spawns, unconditionally.
 * - `hasLiveTaskAccess` — does the CALLING session already have live
 *   Agent/Task tool access right now? Never inferred here (no environment
 *   probing, no heuristic) — the caller self-declares this, the same
 *   "the skill already self-knows its own tool manifest" pattern
 *   `tsk-3sw`'s own design already named.
 * - `forceCliSpawn` — rule 4's valid config-forces-cli/spawn exception
 *   (isolation: a separate process/worktree/cwd needed for its own sake) —
 *   wins over native even when both above are true.
 *
 * Rule 3 (cross-provider) is never this function's own concern: a caller
 * only reaches this decision once it already knows the target is
 * same-provider — a cross-provider target always cli/spawns via the
 * existing `allowCrossProvider` governance (`resolveExecutorConfig` above),
 * with no native-vs-cli/spawn choice left to make.
 */
export function decideDispatchMechanism({ hasNativeMechanism, hasLiveTaskAccess, forceCliSpawn } = {}) {
  if (!hasNativeMechanism) return 'out-of-process';
  if (forceCliSpawn) return 'out-of-process';
  return hasLiveTaskAccess ? 'in-process' : 'out-of-process';
}

/**
 * `executors.<id>`-specific convenience over `decideDispatchMechanism`
 * above (tsk-3ik-1): derives `hasNativeMechanism` (`executor.kind ===
 * "agent"`, D5 tsk-in1-4 — was `"task"` before `kind` split into the
 * `agent`/`tool` BAN CHAT axis) and `forceCliSpawn` (`executor.forceCliSpawn`)
 * from `resolveExecutorAndOverrides(cfg, executorId).executor` (D4,
 * `docs/history/capability-capacity-remodel/CONTEXT.md` — the same shared
 * resolver `resolveExecutorConfig` now uses too), without calling or
 * mutating `resolveExecutorConfig` itself — this stays a read-only
 * sibling, never a second entry into the
 * CRITICAL-blast-radius resolve path (confirmed via
 * `impact({target: "resolveExecutorConfig", direction: "upstream"})`: 6
 * upstream symbols, 3 execution flows, HIGH risk, re-run at tsk-in1-4
 * time). `hasLiveTaskAccess` is never derived here either — same
 * caller-self-declares contract as `decideDispatchMechanism` itself.
 *
 * Cli-spawn-shaped executors bypass `hasLiveTaskAccess` entirely (D1,
 * 2026-08-16 user decision, `docs/decisions/0033-...md`, narrowing `0026`
 * rule 2): a executor that declares its own `command`/`adapter`, or a
 * `invocations[].via === "cli"` entry — the same shape test
 * `resolveExecutorConfig`'s own `resolvedViaAgentType`/`cliInvocation`
 * logic already uses, not a new heuristic — names a real, explicitly
 * configured, out-of-process target (e.g. `agy`). Honoring it as
 * `in-process` used to mean silently substituting the caller's own Task
 * tool for that target instead of ever running it; `0026` rule 2's own
 * stated rationale ("avoid a blind soul re-deriving what a live soul
 * already knows") never applied to this case — it is not re-derivation,
 * it is routing to a genuinely different, operator-configured backend. A
 * executor that is agentType-shaped only (no command of its own, e.g.
 * `judge-discovery: {kind:'agent', agentType:'judge'}`) keeps today's
 * `hasLiveTaskAccess`-gated behavior unchanged: resolving it in-process
 * already means honoring the configured target (Task tool with that
 * `agentType`), so `0026` rule 2's reasoning still holds there.
 */
export function decideExecutorDispatchMechanism(cfg, executorId, { hasLiveTaskAccess = false } = {}) {
  const executor = executorId ? resolveExecutorAndOverrides(cfg, executorId).executor : undefined;
  const isCliSpawnShaped = Boolean(
    executor
      && (executor.command
        || executor.adapter
        || (Array.isArray(executor.invocations) && executor.invocations.some((inv) => inv.via === 'cli'))),
  );
  if (isCliSpawnShaped) return 'out-of-process';
  return decideDispatchMechanism({
    hasNativeMechanism: Boolean(executor && executor.kind === 'agent'),
    hasLiveTaskAccess,
    forceCliSpawn: Boolean(executor && executor.forceCliSpawn === true),
  });
}
