---
type: context
title: "tsk-3ik-2 — closed pass-through, no code change"
---

# tsk-3ik-2 — closed pass-through

## Outcome

Closed as pass-through (human answer, `fgos answer tsk-3ik-2`): no code
change in this item's declared footprint (`src/intake/discovery.mjs`,
`src/intake/plan.mjs`, `src/intake/judge-executor.mjs`).

## Why

`judgeDiscovery`/`judgeDecompose` dispatch via `runJudgeExecutor` ->
`spawnAttempt` -> `spawnSync` (`src/intake/judge-executor.mjs`) — a bare
subprocess-spawn code path that never has live Agent/Task tool access,
whether invoked from a live session's own `fgos discover`/`fgos plan`
Bash call or the headless runner sweep. Wiring `decideCapacityDispatchMechanism`
(`tsk-3ik-1`) in at this level would only ever pass `hasLiveTaskAccess:
false`, which can mathematically never resolve to anything but
`cli-spawn` — a dead, unreachable branch, not real behavior.

`tsk-27y` (Phase 2, already delivered) already built the actual native
answer for these two capacities: a live session that already reasoned
about the item (`fgos-coding-exploring`, `fgos-coding-validating`) self-supplies its own
verdict via `fgos discover --verdict ...`/`fgos plan --verdict ...`,
bypassing `judgeDiscovery`/`judgeDecompose`'s subprocess spawn entirely.
Confirmed by reading `resolveDiscovery` (`discovery.mjs:522-578`):
`judgeDiscovery` is structurally unreachable once a `callerVerdict` is
supplied. That mechanism is already wired into `fgos-coding-exploring`'s and
`fgos-coding-validating`'s own `SKILL.md` Gate sections — nothing left to build
in this item's own declared scope.

## Reference

- `docs/how-to/wire-a-skill-through-the-native-vs-cli-spawn-dispatch-decision.md`
  (`tsk-3ik-4`) — this finding, documented as the durable convention record
  for future readers.
- `docs/history/caller-verdict-protocol-discover-decompose/CONTEXT.md`
  (`tsk-27y`) — the real native-answer mechanism for these two capacities.
