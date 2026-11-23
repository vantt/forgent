# Phase 3b result: close the Node tool-provider twin (door row `tool-lookup-by-capability`)

Status: BLOCKED

Summary: Nothing was changed. Step 1 says to confirm the debt file is gone and to stop if the closure plan kept it
alive. It is alive: `src/runner/dispatch/tool-providers.mjs` is still in the tree, the owning plan
`261122-2108-delete-dead-node-execution-closure` is still entirely `draft`, and its `reports/closure.md` does not
exist. Also, deleting the entry alone cannot pass the phase's Verify: a per-row test case hard-asserts the row's
`debt` entry, and that file is outside this phase's write scope.

Base: `207b6459d50f4c41ec3628fbed8fc1b277e5e2b2` (this worktree's HEAD; working tree clean at the end).

## The wait is not cleared

Phase 3b waits on phase 8 of `261122-2108-delete-dead-node-execution-closure`, which owns deleting
`src/runner/dispatch/tool-providers.mjs`. That wait is open:

| Evidence | Result |
|---|---|
| `test -f src/runner/dispatch/tool-providers.mjs` | present (6387 bytes) |
| `grep '^status:' plans/261122-2108-delete-dead-node-execution-closure/plan.md` | `status: draft` |
| phase rows marked `draft` in that plan | 10 of 10 |
| `plans/261122-2108-delete-dead-node-execution-closure/reports/closure.md` | does not exist (phase 1 has not run) |
| `git log --diff-filter=D -- 'src/runner/dispatch/*'` | no commit deletes it; last commit touching it is `1a3b03d5d` (2026-11-19) |

So step 1 ("Confirm the file is gone … If the closure plan kept it alive … stop and report the owning step") resolves
to: report the owning step and change nothing.

Owning step to report: **phase 8 (`phase-08-delete-source.md`) of `261122-2108-delete-dead-node-execution-closure`**,
"Delete the dead source; close the manifest rows; regenerate the census". Its step 2 is `git rm` of the dead table and
its step 3 closes the door rows those files belong to. It cannot start before its own phases 1-7 land.

## Second, independent blocker in the phase's own Verify

Even once the file were gone, writing only the row (`delete row.debt`) does **not** make the phase's Verify green.
I ran it, then restored the row:

```
node -e '... delete row.debt ...'    # simulate the phase's Step 2
node scripts/run-tests.mjs test/architecture.test.mjs
```
```
✖ every door row holds: patterns appear only in allowed or debt files, and no entry is stale
    [tool lookup by capability: …] src/runner/dispatch/tool-providers.mjs:15 does the job outside its door
✖ door check: the tool lookup row names tools.rs as the Rust owner and tool-providers.mjs as debt
    TypeError: Cannot read properties of undefined (reading 'map')
ℹ tests 88  pass 86  fail 2
```

Two distinct causes, both in `test/architecture.test.mjs`, which is **not** in this phase's files it may write
(the plan gives it to phases 2e and 10, plan.md waves note "`test/architecture.test.mjs` by 2e and then 10"):

1. `test/architecture.test.mjs:2180` `assert.deepEqual(row.debt.map((e) => e.path), ['src/runner/dispatch/tool-providers.mjs'])`.
   Dropping the entry dereferences `undefined` and throws. This is a hard-coded twin assertion, not a `checkDoors`
   rule.
2. With `debt` gone, `checkDoors` finds `src/runner/dispatch/tool-providers.mjs:15` matching the row's pattern
   `\bprobeTool\b`/`\bnormalizeCapability\b` set (line 15 is `return Array.isArray(executor?.for) ? executor.for : [];`
   inside `forEntriesOf`) **outside its door**. That is correct while the file exists: the row allows only
   `packages/execution/rust/src/tools.rs`. So the debt entry cannot be removed before the file is deleted — the row
   and the file must change in the same commit, exactly as CA-D2 requires, and the file's deletion belongs to the
   closure plan.

The phase's Verify can therefore only go green after the closure plan's phase 8 has deleted the file **and** this
phase is allowed to also retire the stale case at `test/architecture.test.mjs:2177-2181` in the same change.

## The twin is not dead by the closure plan's own method

Step 1 also asks whether the closure plan kept it alive. The plan's phase-01 method (seeds = files outside `test/` and
outside the three directories `src/runner/dispatch/`, `src/runner/execution/`, `src/run-supervisor/`; a file in those
directories is live only if a live seed reaches it) puts `tool-providers.mjs` in the **dead** set — as the row's debt
reason claims. However, `tool-providers.mjs` is not unreachable in the plain import graph:

- `src/runner/dispatch/config-twin.mjs:20` imports `forEntriesOf`;
- `src/runner/dispatch/resolve.mjs:15` imports `servedCapabilitiesOf`;
- `src/runner/dispatch/plan.mjs:12` imports `toolProvidersOf`;
- `test/helpers/executor-model-vectors.helper.mjs:21` imports `toolProvidersOf` and `unservedToolAbilityOf`, and is
  reached from `scripts/executor-model-vectors.mjs:59` (a non-test root).

Those helper facts (`toolProviders`, `unservedToolAbility`) back **34 of the vectors** in
`packages/execution/contracts/executor-model.v1.json`, which are replayed both by
`test/runner/dispatch/executor-model-vectors.test.mjs` (Node) and by
`packages/execution/rust/tests/golden_executor_model.rs` (Rust, `tool_providers`/`unserved_tool_ability`). The twin is
what the Node side of that replay still calls, so retiring it is a cut-over with vectors, not a dead-file delete —
and its callers `config-twin.mjs`, `resolve.mjs`, `plan.mjs`, `test/helpers/**`, `test/runner/dispatch/**`,
`scripts/executor-model-vectors.mjs`, `test/suite-baseline.json` and `packages/git/contracts/mutation-census.v1.json`
are all outside this phase's two-file write scope.

Note: that same helper is in the closure plan's own phase 7 footprint (`test/helpers/**`) and its stated constraint
"keep every exported name and shape of `test/helpers/executor-model-vectors.helper.mjs` unchanged". The closure plan
does not currently list `scripts/executor-model-vectors.mjs`, `test/suite-baseline.json` or
`packages/git/contracts/mutation-census.v1.json` for the tool-provider row, so even its phase 8 may not be able to
close this row as written. That is the closure plan's problem to solve, not this phase's.

## Files outside this phase's write scope that step 1/2 and Verify require

Named here rather than written, per "A caller outside this phase's files: stop … Do not widen":

- `src/runner/dispatch/tool-providers.mjs` — must be deleted by the closure plan's phase 8 (its `git rm` step).
- `src/runner/dispatch/config-twin.mjs`, `src/runner/dispatch/resolve.mjs`, `src/runner/dispatch/plan.mjs` — the
  three Node callers that must move to `packages/execution/rust/src/tools.rs` (or be deleted with their own rows:
  `derive-executor-facts`, `decide-a-dispatch`) in the same commit.
- `test/helpers/executor-model-vectors.helper.mjs` — the `toolProviders`/`unservedToolAbility` evaluators.
- `test/runner/dispatch/tool-providers.test.mjs` — the twin's owning proof.
- `test/architecture.test.mjs:2177-2181` — the hard-coded `row.debt` assertion that throws once `debt` is removed.
- `scripts/executor-model-vectors.mjs`, `test/suite-baseline.json`,
  `packages/git/contracts/mutation-census.v1.json` — the regenerate path, the baseline row and the census hash that
  name the path.
- `docs/platform/seat-binding/spec.md:505` — names `toolProvidersOf` in `tool-providers.mjs` as debt.

## Verify (as run)

- `node --test test/architecture.test.mjs` — **red on this worktree, for a reason unrelated to this row**:
  87/88 pass; the single failure is `A4 boundary guard: dispatch, execution, the dispatch barrel and src/workflow/**
  name no domain or Workflow step literal`, which fails with
  `git-addon-unavailable: addon not shipped on this channel: onboard this project with fgctl init` because this
  linked worktree has no `.fgos/installation/`. Run through the suite's own door
  (`node scripts/run-tests.mjs test/architecture.test.mjs`), which stages the addon, it is **88/88 green** on the
  unchanged row. Both routes are green for the row itself; the bare `node --test` form the phase names is not
  usable in this worktree.
- Syntax-only pre-check of the phase's edit: red (2 failures), as quoted above. Row restored; `git status` clean.

## Owning tests (named, per the phase's rules)

- Behaviour "which tool executors serve a capability, and whether each is there now" is owned by
  `test/runner/dispatch/tool-providers.test.mjs` (5 cases: `forEntriesOf` raw `for` read; `servedCapabilitiesOf`
  tool-only; `toolProvidersOf` cli by absolute path; `toolProvidersOf` mcp scanTarget missing/present/stale;
  unserved-ability vs label) — this is the Node copy's own proof, and it retires with the file.
- The survivor's own proof is `packages/execution/rust/src/tools.rs` `mod tests`
  (`the_posture_counts_each_tool_once_inactive_full_or_degraded`) plus the Rust replay of the same contract vectors in
  `packages/execution/rust/tests/golden_executor_model.rs` (`tool_providers`, `unserved_tool_ability`, asserting
  `replayed + later == vectors.len()`).
- The Node replay twin `test/runner/dispatch/executor-model-vectors.test.mjs` also covers the same vectors and must
  move with the helper.
- Door row checks: `test/architecture.test.mjs:1969` `every door row holds: …` and `:2177` `door check: the tool
  lookup row …`.

Per design principle 8, no new proof is needed here: the behaviour already has one owning proof at the lowest layer
that can observe it (the Rust crate + `golden_executor_model.rs`), and the Node cases are a twin that retires with the
twin. 34 vectors already exist for the cut-over; the 488d3ab28 "record vectors then replay" step is therefore already
satisfied by `executor-model.v1.json`, which is why the closure plan can delete rather than record.

## Deleted paths

None. The debt file is still present and was not touched.

- `src/runner/dispatch/tool-providers.mjs` — **not deleted by me**. Last SHA that had it: `1a3b03d5d6ce311403422e757c8c3c39bea16d46` (2026-11-19, "refactor(runner): move payload-root, stop-processes-inside and capability-config out of directories"). Created as a twin in `5a70452425494b388fd54f3e2cfd21306dfc71d8`.

## Spec decision-history line for phase 11

None. No decision was settled, because no retirement happened. When the closure plan's phase 8 lands the deletion,
the line for `docs/platform/seat-binding/spec.md` should read (draft, for phase 11 to place and finish):

> **D-ADR (door row `tool-lookup-by-capability` đóng).** `src/runner/dispatch/tool-providers.mjs` (twin của
> `packages/execution/rust/src/tools.rs`, tạo ở `5a7045242`) bị xoá ở `<closure-phase-8 SHA>`; lần cuối còn file là
> `1a3b03d5d`; hàng `doors/tool-lookup-by-capability.json` hết `debt`. 34 vector của
> `packages/execution/contracts/executor-model.v1.json` (`toolProviders`, `unservedToolAbility`) là bằng chứng
> cut-over, replay bởi `packages/execution/rust/tests/golden_executor_model.rs`.

## What would unblock this phase

1. `261122-2108-delete-dead-node-execution-closure` reaches `ready` → `running`, runs phases 1-7, and its phase 8
   deletes `src/runner/dispatch/tool-providers.mjs` together with its callers and its test.
2. This phase's "Files it may write" gains `test/architecture.test.mjs` (only the `:2177-2181` case), or that case is
   reassigned to phase 10 alongside the rest of the door guard, so removing the entry and retiring its assertion can
   land in one commit.
3. The closure plan's phase footprints gain `scripts/executor-model-vectors.mjs`, `test/suite-baseline.json` and
   `packages/git/contracts/mutation-census.v1.json` for this row, or those three are confirmed to need no change when
   the helper is rewired rather than deleted.

Status: BLOCKED
Summary: The debt file is not gone — the owning closure plan is wholly `draft` and its `closure.md` does not exist — and removing the entry alone fails Verify on a hard-coded assertion in `test/architecture.test.mjs`, outside this phase's write scope.
Concerns/Blockers: Owning step is phase 8 of `261122-2108-delete-dead-node-execution-closure`; the phase's own Verify additionally needs `test/architecture.test.mjs:2177-2181` in scope, and the row's `debt` cannot be dropped while the file still exists because `checkDoors` then reports it outside its door.
