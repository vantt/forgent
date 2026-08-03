---
type: how-to
title: How to wire a skill's dispatch of a capacity or subTask through the native-vs-cli/spawn decision
tags: []
timestamp: 2026-08-03T14:00:00.000Z
source_capture_ids: [tsk-3ik-4]
---

# How to wire a skill's dispatch of a capacity or subTask through the native-vs-cli/spawn decision

Use this when a skill is about to dispatch something that needs "soul"
(real judgment, not a mechanical check) — either a `capacities.<id>`
config entry, or its own direct Agent/Task tool call for a subTask — and
you want that dispatch to follow the Native-First Dispatch Doctrine
(`docs/decisions/0026-vision-orchestrator-roottask-capacity-native-vs-cli-
spawn.md`) instead of hardcoding one mechanism.

## Before you start

- This assumes `src/runner/dispatch.mjs`'s `decideDispatchMechanism`/
  `decideCapacityDispatchMechanism` and the `decide <capacityId>` CLI
  subcommand already exist (`tsk-3ik-1`) — this how-to is about wiring a
  *consumer* through the decision, not building the decision mechanism
  itself.
- Read `docs/decisions/0026-...md`'s four rules first. This how-to only
  covers the mechanical wiring; it does not re-explain why native is
  preferred over cli/spawn when both are available.

## The decision, in one call

```bash
root=$(git rev-parse --path-format=absolute --git-common-dir | xargs dirname)
node "$root/src/runner/dispatch.mjs" decide <capacityId> --has-live-task-access
```

Omit `--has-live-task-access` if you do not currently have the Agent/Task
tool in your own tool manifest — this is always a self-declaration by the
session actually running this command, never inferred from environment or
config (the same "the skill already self-knows its own tool manifest"
pattern this whole mechanism relies on — never probe for it, never guess).

Prints `{"mechanism": "native"|"cli-spawn"[, "agentType": "<name>"]}`.

- **`cli-spawn`** — dispatch exactly the way you already do today (`resolve
  <capacityId>` + exec, or your own existing subTask-spawn path). Nothing
  changes for a `kind:"cli"` capacity, a `kind:"task"` capacity when you
  lack live Task access, or a capacity whose config forces cli/spawn
  (`forceCliSpawn`).
- **`native`** — skip the exec/spawn path entirely. Call your own Agent/Task
  tool directly, passing the result's `agentType` as `subagent_type` and
  the same prompt your cli/spawn path would have used.

## Two consumer shapes this covers (per 0026's own vocabulary)

- **Capacity-shaped** (a narrow functional helper, e.g. `judge-discovery`,
  `submit-assist-classify`) — the real, live pattern: follow
  `.claude/skills/_shared/capacity-dispatch-fallback.md`'s Step B.5, added
  by `tsk-3ik-3`, which already wires this decision in for any skill
  pointing at that shared fragment. Do not re-implement the decision call
  inline in your own `SKILL.md` — point at the shared fragment the same
  way `fgos-submit-assist` already does.
- **subTask-shaped** (a live session invoking Agent/Task directly for a
  recursive rootTask — e.g. a future skill that spawns an `Explore` or
  `code-reviewer` subagent as part of a config-driven capacity rather than
  a hardcoded choice) — no real consumer exists in this repo yet (scouted
  during `tsk-3ik`'s own `clarify` stage: zero hits for `Task(`/`Agent(`/
  `subagent_type` across `.claude/skills`/`plugins/fgOS/skills`). Wire it
  the same way once one exists: call `decide` before choosing whether to
  shell out to a capacity's resolved command or invoke your own Task tool
  directly — never invent a second decision function.

## Why judge-discovery/judge-decompose are NOT wired through `decide` (tsk-3ik-2's real finding)

`judgeDiscovery`/`judgeDecompose` (`src/intake/discovery.mjs`,
`src/intake/decompose.mjs`) dispatch via `runJudgeExecutor` ->
`spawnAttempt` -> `spawnSync` (`src/intake/judge-executor.mjs`) — a bare
subprocess-spawn code path that never has live Agent/Task tool access,
whether invoked from a live session's own `fgos discover`/`fgos decompose`
Bash call or the headless runner sweep. Calling `decide` there would only
ever pass `hasLiveTaskAccess: false`, which can never resolve to anything
but `cli-spawn` — a dead branch, not real wiring.

The actual "native" answer for these two capacities is `tsk-27y`'s
caller-supplied-verdict mechanism: a live session that already reasoned
about the item (`fgos-exploring`, `fgos-validating`) self-supplies its own
verdict via `fgos discover --verdict ...`/`fgos decompose --verdict ...`,
bypassing `judgeDiscovery`/`judgeDecompose`'s subprocess spawn entirely for
that invocation. That mechanism is a different, already-built path — not
`decide`-shaped — and it is already wired into `fgos-exploring`'s and
`fgos-validating`'s own `SKILL.md` Gate sections. Do not try to route
`judgeDiscovery`/`judgeDecompose` through `decide` — there is nothing for
it to decide in that code path.

## Related

- `docs/decisions/0026-vision-orchestrator-roottask-capacity-native-vs-cli-spawn.md`
  — Native-First Dispatch Doctrine, the four rules this decision implements.
- `docs/history/native-first-dispatch-doctrine-phase-4-unify-capacity-and-task-dispatch/CONTEXT.md`
  / `plan.md` — `tsk-3ik`'s own locked decisions and shape, including the
  scout evidence behind the "no real subTask-shaped consumer exists yet"
  claim above.
- `docs/history/tsk-3ik-1/iron-law-evidence.md` — where `decideDispatchMechanism`/
  `decideCapacityDispatchMechanism`/`decide` were built and proven.
- `docs/history/tsk-3ik-3/iron-law-evidence.md` — the one real, live capacity-shaped
  wiring (`.claude/skills/_shared/capacity-dispatch-fallback.md`'s Step B.5).
- `docs/how-to/wire-a-skills-classify-step-through-an-agent-executor-capacity.md`
  — the older how-to this one complements: that one covers wiring a skill
  through the capacity mechanism at all; this one covers the native-vs-
  cli/spawn choice once wired.
