---
type: how-to
title: How to wire a skill's dispatch of a executor or subTask through the native-vs-cli/spawn decision
tags: []
timestamp: 2026-08-03T14:00:00.000Z
source_capture_ids: [tsk-3ik, tsk-3ik-4]
---

# How to wire a skill's dispatch of a executor or subTask through the native-vs-cli/spawn decision

Use this when a skill is about to dispatch something that needs "soul"
(real judgment, not a mechanical check) — either a `executors.<id>`
config entry, or its own direct Agent/Task tool call for a subTask — and
you want that dispatch to follow the Native-First Dispatch Doctrine
(`docs/decisions/0026-vision-orchestrator-roottask-capacity-native-vs-cli-
spawn.md`) instead of hardcoding one mechanism.

## Before you start

- This assumes `src/runner/dispatch.mjs`'s `decideDispatchMechanism`/
  `decideExecutorDispatchMechanism` and the `decide <executorId>` CLI
  subcommand already exist (`tsk-3ik-1`) — this how-to is about wiring a
  *consumer* through the decision, not building the decision mechanism
  itself.

  `tsk-3ik-1` (commit `8ef69b8`) built exactly that: `decideDispatchMechanism`
  is pure and generic over executor/subTask targets, implementing Native-First
  Dispatch Doctrine rules 1/2/4; `decideExecutorDispatchMechanism` is the
  `executors.<id>`-specific convenience wrapper the `decide` CLI subcommand
  above calls. A new optional `executors.<id>.forceCliSpawn` boolean field
  implements rule 4's config-forces-cli/spawn exception. The build
  deliberately never touched `resolveExecutorConfig`'s own body — impact
  analysis confirmed CRITICAL blast radius (8 upstream symbols, 7 execution
  flows) on that function, so the new functions were built as standalone
  read-only siblings instead, verified by 126/126 green including every
  pre-existing `resolveExecutorCli` exact-shape test untouched.
- Read `docs/decisions/0026-...md`'s four rules first. This how-to only
  covers the mechanical wiring; it does not re-explain why native is
  preferred over cli/spawn when both are available.

## The decision, in one call

```bash
root=$(git rev-parse --path-format=absolute --git-common-dir | xargs dirname)
node "$root/src/runner/dispatch.mjs" decide <executorId> --has-live-task-access
```

Omit `--has-live-task-access` if you do not currently have the Agent/Task
tool in your own tool manifest — this is always a self-declaration by the
session actually running this command, never inferred from environment or
config (the same "the skill already self-knows its own tool manifest"
pattern this whole mechanism relies on — never probe for it, never guess).

Prints `{"mechanism": "native"|"cli-spawn"[, "agentType": "<name>"]}`.

- **`cli-spawn`** — dispatch exactly the way you already do today (`resolve
  <executorId>` + exec, or your own existing subTask-spawn path). Nothing
  changes for a `kind:"cli"` executor, a `kind:"task"` executor when you
  lack live Task access, or a executor whose config forces cli/spawn
  (`forceCliSpawn`).
- **`native`** — skip the exec/spawn path entirely. Call your own Agent/Task
  tool directly, passing the result's `agentType` as `subagent_type` and
  the same prompt your cli/spawn path would have used.

## Two consumer shapes this covers (per 0026's own vocabulary)

- **Executor-shaped** (a narrow functional helper, e.g. `judge-discovery`,
  `submit-assist-classify`) — the real, live pattern: follow
  `.claude/skills/_shared/executor-dispatch-fallback.md`'s Step B.5, added
  by `tsk-3ik-3`, which already wires this decision in for any skill
  pointing at that shared fragment. Do not re-implement the decision call
  inline in your own `SKILL.md` — point at the shared fragment the same
  way `fgos-submit-assist` already does.
- **subTask-shaped** (a live session invoking Agent/Task directly for a
  recursive rootTask — e.g. a future skill that spawns an `Explore` or
  `code-reviewer` subagent as part of a config-driven executor rather than
  a hardcoded choice) — no real consumer exists in this repo yet (scouted
  during `tsk-3ik`'s own `clarify` stage: zero hits for `Task(`/`Agent(`/
  `subagent_type` across `.claude/skills`/`plugins/fgOS/skills`). Wire it
  the same way once one exists: call `decide` before choosing whether to
  shell out to a executor's resolved command or invoke your own Task tool
  directly — never invent a second decision function.

## Why judge-discovery/judge-decompose are NOT wired through `decide` (tsk-3ik-2's real finding)

`judgeDiscovery`/`judgeDecompose` (`src/intake/discovery.mjs`,
`src/intake/plan.mjs`) dispatch via `runJudgeExecutor` ->
`spawnAttempt` -> `spawnSync` (`src/intake/judge-executor.mjs`) — a bare
subprocess-spawn code path that never has live Agent/Task tool access,
whether invoked from a live session's own `fgos discover`/`fgos plan`
Bash call or the headless runner sweep. Calling `decide` there would only
ever pass `hasLiveTaskAccess: false`, which can never resolve to anything
but `cli-spawn` — a dead branch, not real wiring.

The actual "native" answer for these two executors is `tsk-27y`'s
caller-supplied-verdict mechanism: a live session that already reasoned
about the item (`fgos-coding-exploring`, `fgos-coding-validating`) self-supplies its own
verdict via `fgos discover --verdict ...`/`fgos plan --verdict ...`,
bypassing `judgeDiscovery`/`judgeDecompose`'s subprocess spawn entirely for
that invocation. That mechanism is a different, already-built path — not
`decide`-shaped — and it is already wired into `fgos-coding-exploring`'s and
`fgos-coding-validating`'s own `SKILL.md` Gate sections. Do not try to route
`judgeDiscovery`/`judgeDecompose` through `decide` — there is nothing for
it to decide in that code path.

## Why this covers direct Task-tool calls too, not just `executors.<id>`

Before any of the wiring above was built, the parent item (`tsk-3ik`)
locked why the scope had to be broad rather than narrowed to
executor-shaped helpers:

> Scope is **broad**, not narrowed to executor-shaped helpers: the shared
> decision protocol must govern BOTH `executors.<id>` config-driven
> dispatch AND any skill's direct Agent/Task-tool subTask calls, not just
> the former. Reason (user, verbatim intent): doing this lets fgOS
> flexibly use many different models across ALL its tools, not just the
> fgOS-specific executor mechanism — the payoff is model flexibility for
> every dispatch path, not just the narrow judge/classify helpers.

At the time this was locked, scouting fgOS's own skill catalog
(`.claude/skills/`, `plugins/fgOS/skills/`) found **zero** existing
direct Task/Agent-tool call sites (`rg "Task\(|Agent\(|subagent_type"`)
— so the "direct-call" half of this doctrine has no existing code to
retrofit. It establishes the mandatory-consult convention any *future*
direct-dispatch skill must follow (this how-to's own subTask-shaped
section above), not a rewrite of dozens of existing files:

> Full scope is "wire everything": every real existing `executors.<id>`
> consumer, AND every direct Task/Agent-tool call site in fgOS's own
> skill catalog, migrates onto the shared decision protocol... The
> `executors.<id>` half has three real, already-wired consumers to
> migrate.

This item also built the **first real native-Task-dispatch branch**
itself — the doctrine's own phase table had implied the pattern would
already be "proven on two separate real cases" (`tsk-27y`'s engine-verb
case, `tsk-53h`'s skill-facing-helper case) before this phase started,
but scouting `tsk-53h`'s actual landed diff showed it only ever extracted
`fgos-submit-assist`'s pre-existing cli/spawn wiring — it never built a
native branch. This item is where that proof actually happens.

## Related

- `docs/decisions/0026-vision-orchestrator-roottask-capacity-native-vs-cli-spawn.md`
  — Native-First Dispatch Doctrine, the four rules this decision implements.
- `docs/history/native-first-dispatch-doctrine-phase-4-unify-capacity-and-task-dispatch/CONTEXT.md`
  / `plan.md` — `tsk-3ik`'s own locked decisions and shape, including the
  scout evidence behind the "no real subTask-shaped consumer exists yet"
  claim above.
- `docs/history/tsk-3ik-1/iron-law-evidence.md` — where `decideDispatchMechanism`/
  `decideExecutorDispatchMechanism`/`decide` were built and proven.
- `docs/history/tsk-3ik-3/iron-law-evidence.md` — the one real, live executor-shaped
  wiring (`.claude/skills/_shared/executor-dispatch-fallback.md`'s Step B.5).
- `docs/how-to/wire-a-skills-classify-step-through-an-agent-executor-executor.md`
  — the older how-to this one complements: that one covers wiring a skill
  through the executor mechanism at all; this one covers the native-vs-
  cli/spawn choice once wired.
