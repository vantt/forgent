# judgeDiscovery/judgeDecompose wired through agent-executor capacities — locked decisions

Item: `tsk-2yp`. Cluster: `tsk-64p` (agent-executor: capacity-aware backend
dispatch). Depends on `tsk-62v` (the capacity mechanism itself, done,
`docs/history/agent-executor-capacity-dispatch/CONTEXT.md`). Related sibling
proof: `tsk-5l2` (domain 2, `fgos-submit-assist`'s classify step) — this item
is the highest-frequency headless consumer (`judge-executor.mjs`, called by
`fgos discover`/`fgos plan` on every clarify/decompose pass), not yet
wired.

## Feature boundary

`judge-executor.mjs`'s `runJudgeExecutor` (called by `judgeDiscovery` and
`judgeDecompose`) always hardcoded `tier: 'judge'`, never resolving
`capacities.<id>`. Wire `capacityId`/`fgosDir` through the whole chain
(`spawnAttempt` -> `runBoundedAttempts` -> `runRetryingExecutor` ->
`runJudgeExecutor`), reusing `resolveExecutorCommand`'s existing
`capacities.<id>` > `executors.<tier>` > `executor` precedence (tsk-62v) —
no new mechanism.

## Locked decisions

- **Capacity ids**: `judge-discovery` (from `judgeDiscovery`) and
  `judge-decompose` (from `judgeDecompose`) — hardcoded per call site, not
  caller-configurable, mirroring `submit-assist-classify`'s own
  hardcoded-id precedent.
- **`fgosDir` threaded too** (not just `capacityId`): both `resolveDiscovery`
  and `resolveDecompose` already have `dir` (the `.fgos/` dir) in scope at
  their own `judgeDiscovery`/`judgeDecompose` call sites, so passing it
  through costs nothing extra and gets a `kind: "cli"` capacity the same
  tool-registry presence check `spawnWorker` (domain 1) already has —
  a misconfigured capacity fails with a named, actionable error instead of a
  bare spawn ENOENT.
- **No `.fgos-runner.json` capacity entries added by this item**: every
  field is optional and additive — omitting `capacities.judge-discovery`/
  `capacities.judge-decompose` falls through to `executors.judge` (Claude)
  exactly as before. An operator opts in later, same as
  `submit-assist-classify`'s own rollout.
- **No test coverage exists for a skill's own runtime branching** (per
  `docs/how-to/wire-a-skills-classify-step-through-an-agent-executor-capacity.md`'s
  documented ceiling) — moot here, since this item's consumer is a headless
  function (`runJudgeExecutor`), not a prose skill; ordinary unit tests
  cover the new precedence/propagation directly
  (`test/intake/judge-executor.test.mjs`).

## Verification

Full suite (`npm test`): 2112 pass, 0 fail, 5 pre-existing skips (baseline
before this item: 2108 pass). New tests added:
`test/intake/judge-executor.test.mjs` — capacity resolves ahead of
`executors.judge`, falls through when no matching entry, `RunnerConfigError`
propagates for an unregistered `kind: "cli"` capacity when `fgosDir` is
given, and the presence check is skipped byte-identical when `fgosDir` is
omitted.

## Process note (deviation from the normal claim flow)

Implementation landed directly on `main` (commit `77c951f`) during a
research+discuss session, not through `fgos pick`'s isolated `fgw/tsk-2yp`
worktree. This item is being synced through `discover`/`decompose`/
`take`/`return --no-new-commits-ok`/`approve` after the fact so `stage` and
`status` reflect what already happened, using `return`'s existing
"work already done before this claim" escape hatch (tsk-4on) rather than a
raw `status`-only edit — a raw edit would leave `stage` permanently stuck at
`clarify` while `status` read `done`, an internally inconsistent record.
