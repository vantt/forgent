# Phase 3d result: BLOCKED, nothing changed

Phase `phase-03d-decide-a-dispatch.md` says, in its `Waits` section and in step 1, to stop as soon as the debt
file is still present, and to change nothing. Both hold, so no file was written and no row was edited.
`git status --short` is empty at the end of this run; the door row is byte-identical to HEAD.

Base: `207b6459d` (branch `component-authority-doors`, worktree `261121-2110-component-authority-doors-p3d`).

## Step 1: the file is not gone

| Check | Result |
|---|---|
| `test -f src/runner/dispatch/plan.mjs` | **present**, 696 lines, tracked at `HEAD:src/runner/dispatch/plan.mjs` = `8211b31e94f05e8d9f77841fefd6bd5682a198f9` |
| `git log -1 -- src/runner/dispatch/plan.mjs` | `82fe7f402 2026-11-22 refactor(execution): session-host tail modules become facades over the Execution door` |
| `git log --all --diff-filter=D -- src/runner/dispatch/plan.mjs \| wc -l` | `0` — never deleted on any branch, so there is no deleting commit and no last-SHA-after-deletion to record |

**Owning step.** The phase names phase 8 of `261122-2108-delete-dead-node-execution-closure` as the owner of this
deletion. That plan is still `status: draft` and its `blockedBy` names `261122-0118-heads-stable-and-able`, which
still reads `status: running`; its phase 8 row still reads `draft`. The phase's own `Waits` therefore has not
cleared: **the closure report that step 1 tells me to quote does not exist yet**
(`plans/261122-2108-delete-dead-node-execution-closure/reports/closure.md` — its phase 1 gate), and neither does
`reports/` under that plan at all. There was no owning step to name, only the owning phase.

## Second blocker: removing the debt entry alone turns this phase's own Verify red

I measured this rather than argue it, then restored the row (`git status` clean, 88/88 green again).

Editing only `packages/component-authority/model/doors/decide-a-dispatch.json` — the phase's whole write scope — to
drop `debt` fails two tests in `test/architecture.test.mjs`:

```
✖ every door row holds: patterns appear only in allowed or debt files, and no entry is stale
    '[decide a dispatch] src/runner/dispatch/plan.mjs:370 does the job outside its door'
✖ door check: the decider has one Rust owner and one declared Node twin
    TypeError: Cannot read properties of undefined (reading 'map')
      at test/architecture.test.mjs:2132:29
```

- `test/architecture.test.mjs:1972` requires every row pattern hit to land in an `allowed` or `debt` entry. With
  `debt` gone and `src/runner/dispatch/plan.mjs:370` (`purposeSeatOf`) still on disk, the hit has nowhere to land.
  This one clears the moment the file is deleted — it is a symptom of blocker 1, not a separate defect.
- `test/architecture.test.mjs:2132` (`assert.deepEqual(row.debt.map((e) => e.path), ['src/runner/dispatch/plan.mjs'])`)
  is a **synthetic** assertion over the row, independent of whether the file exists. It keeps failing after a
  correct deletion. It lives in `test/architecture.test.mjs`, which this phase may not write: the plan's phases table
  gives that file to phase 10 (`phase-10-land-checks.md`, "Door guard by primitive and aliases, counted, no debt"),
  where the whole `debt` mechanism is retired from the row and from its tests together.

So even with blocker 1 cleared, "step 2 only" cannot satisfy `Verify` ("no `debt` in the row", `node --test
test/architecture.test.mjs` green) inside this phase's write scope. Per the phase's rules I did not widen.

## Callers outside this phase's files

Named for whoever resumes this, since the phase instructs a stop on any outside caller. The phase's only writable
file is the row, so every one of these is outside it.

| Caller | Kind | Notes |
|---|---|---|
| `src/runner/dispatch/assignment-runner.mjs:57` | src importer | `import { compileDispatchPlan, launchPinOf } from './plan.mjs';`. Dead by the closure plan's own graph method (reachable only from `session-attempt.mjs`, itself reachable only from tests). Expected to go with the same closure deletion, not by this phase. |
| `test/runner/dispatch.test.mjs:25` | test importer | also in closure phase 2's file list |
| `test/runner/dispatch-plan-policy.test.mjs:5` | test importer | also in closure phase 2's file list |
| `test/runner/dispatch-policy-baseline-snapshot.test.mjs:23` | test importer | also in closure phase 2's file list |
| `test/runner/dispatch-governance-provider-denylist.test.mjs:15` | test importer | also in closure phase 2's file list |
| `test/runner/assignment-dispatch.test.mjs:19` | test importer | in closure phase 4's file list |
| `test/runner/dead-vocabulary-guard.test.mjs:185` | test importer | in closure phase 5's file list |
| `test/state/work-size-rigor.test.mjs:20` | test importer | one of the two this phase's `Waits` names; in closure phase 6's file list |
| `test/setup/capability-catalog-doctrine.test.mjs:14` | test importer | the other one this phase's `Waits` names; in closure phase 6's file list |
| `test/architecture.test.mjs:1139, 1273, 1274` | pinned literal allowlist | `'work'` type name allowed only for this path; the allowlist entry itself is in phase 10's file |
| `test/architecture.test.mjs:2108, 2132, 2137, 2226` | door-check assertions | assert on this path/row; phase 10's file |
| `packages/component-authority/model/contracts.json:281` | model evidence list | `agent-coordination` contract still lists it as evidence; no phase of this plan lists that file |
| `packages/component-authority/model/doors/choose-an-executor-from-a-capability-s-prefer-only-in-the-seat-binding-crate-ask-bind.json` | another row's job string | its `job` names `purposeSeatOf in src/runner/dispatch/plan.mjs` |
| `packages/component-authority/model/doors/the-node-bind-facade-has-only-its-named-callers.json` | another row's allowed entry | names the path as an allowed `bind` facade caller |
| `packages/component-authority/model/doors/the-purpose-chooser-outside-bind.json` | another row's job string | names `purposeSeatOf in src/runner/dispatch/plan.mjs` |
| `apps/fgos/src/wiring/unit_run_host/dispatch_plan.rs:2`, `packages/execution/rust/src/decide.rs:5` | Rust comments | cite the path as prior art; not imports |
| `packages/git/contracts/mutation-census.v1.json:1572` | census hash | regenerated by the closure plan's step 5 |

The four `doors/*.json` and `contracts.json` entries are the ones no retirement phase in this plan lists. Three of
them are other rows' `job` strings, which phase 10 rewrites as part of the debt sweep; `contracts.json:281` is not
claimed by any phase.

## Verify

Ran, on a clean tree, against this checkout's staged dev host
(`FGOS_HOST_BIN`/`FGOS_ACTIVE_RELEASE_PATH`/`FGOS_ACTIVE_MANIFEST_PATH` from
`scripts/lib/git-addon-stage.mjs#ensureGitAddon`, the same environment `scripts/run-tests.mjs` gives every test
process — without it the run dies at `git-addon-not-shipped` because this linked worktree has no `.fgos`):

```
node --test test/architecture.test.mjs   →  tests 88, pass 88, fail 0
```

Green, but it proves nothing about this phase: the row still carries its `debt`, so the phase's second Verify clause
("no `debt` in the row") fails by inspection and the first is green only because nothing changed.

**Owning tests named.** `test/architecture.test.mjs:2129` "door check: the decider has one Rust owner and one
declared Node twin" is the test that owns this row's shape (allowed = `packages/execution/rust/src/decide.rs`,
`debt` = the Node twin, `retiredBy` starting `p-24xw2cwdvo`), and `test/architecture.test.mjs:1972` inside "every
door row holds" owns the no-hit-outside-a-door behaviour. The behaviour the deleted copy gives its callers is owned
on the survivor side by `packages/execution/rust/src/decide.rs` (its `purpose_seat`/`purpose_seat_of` and
`packages/execution/rust/tests/golden_decide.rs`), and the closure plan's phases 2-7 own the traffic of the nine
test importers.

## Deleted paths

None. Nothing was deleted, so there is no last SHA to record for a deletion.

Last SHA that still *has* the file, for whatever commit eventually deletes it: blob
`8211b31e94f05e8d9f77841fefd6bd5682a198f9`, last tree touched by commit `82fe7f402`.

## Decision-history line for phase 11

None. No copy was deleted and no row changed, so phase 11 has nothing to place in
`docs/platform/component-authority/spec.md`'s "Lịch sử quyết định". The line lands when the deletion does.

## Rollback

Nothing to roll back — no file was written.

Status: BLOCKED
Summary: `src/runner/dispatch/plan.mjs` is still present (696 lines, 0 deletions ever, blob 8211b31e9), so step 1 stops the phase; and dropping the row's `debt` alone cannot satisfy Verify because `test/architecture.test.mjs:2132` pins the debt entry and that file belongs to phase 10.
Concerns/Blockers: The phase was dispatched before its `Waits` cleared — `261122-2108-delete-dead-node-execution-closure` is still `draft` (blockedBy `261122-0118-heads-stable-and-able`, `running`) and has no `reports/closure.md`, so there is no closure report to quote an owning step from. Needs either (a) reschedule after closure phase 8 lands, or (b) a phase-definition change widening this phase to `test/architecture.test.mjs` — which collides with phase 10's footprint, so (a) is the honest order.
