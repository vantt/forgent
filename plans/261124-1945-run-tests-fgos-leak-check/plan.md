---
contract: plan-v1
title: "The leak check of run-tests judges only what the test run wrote"
status: draft
priority: P1
blockedBy: []
footprint:
  - scripts/run-tests.mjs
  - test/scripts/run-tests.test.mjs
  - test/helpers/fgos-write-witness.mjs
  - packages/git/contracts/mutation-census.v1.json
  - plans/261124-1945-run-tests-fgos-leak-check/
base: e402520442c7f124576f3403d6e8f380477b436c
source:
  - plans/discussions/ds-ti2vip43kp-run-tests-fgos-leak-check/DISCUSSION.md
  - p-s6te2445rb
  - plans/discussions/ds-lvxt3vde7k-land-gate-live-writes/DISCUSSION.md
  - p-427ymxp33q
created: 2026-11-24
---

# The leak check of run-tests judges only what the test run wrote

## Outcome

Phase 1 (done, `ee1d9ca00`) stopped the `.fgos` leak check in `scripts/run-tests.mjs`
failing on a fixed list of live runtime directories, after three lands went red with 0 test
failures. The list did not hold: on 2026-11-25, 9 of the last 30 land gate logs failed with
all 170 tests green, on writes into `runtime/watcher`, `runtime/head-tickets`,
`runtime/supervision`, `runtime/session-rotation`, `assignments/*` and `locks` (backlog
p-427ymxp33q). The owner widened the list by hand in `b4581336d` (`runtime`, `assignments`,
`locks`) as a stopgap.

Phase 2 replaces the list with attribution (discussion ds-lvxt3vde7k). The check fails a run
only for a `.fgos` path that a process of the test run itself wrote and that differs at the
end of the run from what it was when that process first touched it. A write by any other
session (a live head, the watcher, the land that runs the gate) into any `.fgos` path does
not fail the run; a file a test leaves in `.fgos` still does.

## Acceptance criteria

Phase 1's criteria are met (see Progress). Phase 2:

1. A write by another process into any `.fgos` path during a run (including
   `runtime/watcher/state.json`, `assignments/<run>/closed.json`, `locks/*`,
   `observe/friction/*` and a new top-level `other/`) leaves `fgosDiff.leaked` false and the
   status 0. Proof: the leak-check section of `test/scripts/run-tests.test.mjs`, where the
   other writer is a write that no witnessed test process made.
2. A file a test process writes and leaves in `.fgos`, in any path including the old
   stopgap ones (`runtime/`, `assignments/`, `locks/`), fails the run with status 1 and is
   named in the log; a file a test writes and removes again does not fail it. Proof: same
   section, driven through a real `node` child that loads the witness.
3. A run whose test processes left no witness record fails closed with status 1 and a
   message naming the witness, instead of passing with nothing attributed. Proof: same
   section.
4. One owning proof: the leak cases stay in the one existing leak-check section of
   `test/scripts/run-tests.test.mjs`; the stopgap test "the leak check ignores live runtime
   directories ..." is replaced, not kept beside the new cases.
5. `LIVE_FGOS_DIRS` is gone: `rg -n LIVE_FGOS_DIRS scripts test` prints nothing.
6. `node scripts/run-tests.mjs test/scripts/run-tests.test.mjs test/setup/git-mutation-census.test.mjs`
   exits 0, after the census is regenerated with
   `node scripts/git-one-door-scan.mjs --write-census`.

## Non-goals

- Changing which tests run, or the land gates (both discussions, Non-goals).
- Any env switch or flag that turns the check off (AGENTS.md, L5 question 5). The witness
  log path the runner hands its test processes is where the record goes, not a switch: a
  missing record fails the run.
- Attributing writes made outside Node's `fs` (the Rust host binary, a shell, the native
  addon); see Risks.
- Changing `SENSITIVE_FGOS_FILES` or the `allowedFgosMutations` parameter.

## Prior art

`git log -S'DERIVED_FGOS_FILES'` shows commit 7443ae2db added the one existing exemption,
`DERIVED_FGOS_FILES = {cache/state.json}`, passed as the default `allowedFgosMutations`.
This plan reuses the same door (the snapshot and diff in `scripts/run-tests.mjs`) and
extends it from one exact file to a fixed list of live directories. Because the owner's
list excludes all of `cache`, the single-file exemption becomes redundant and is retired
in the same change (L10): one exclusion list, not two.

Phase 2:

- Reused from phase 1 and `b4581336d`: the diff result shape
  (`{added, modified, deleted, leaked}` on `result.fgosDiff`) and its log lines. Retired:
  `LIVE_FGOS_DIRS` and the whole-store walk. With no exclusion list the walk would read
  every file twice; `.fgos` holds about 238,000 files on this machine, 153,000 under
  `runtime` and 72,000 under `assignments`.
- Reused as the pattern: `test/helpers/git-spawn-spy.mjs`, the per-process attribution this
  runner already has. `buildTestArgv` preloads it with `--import`; it spreads to child Node
  processes through `NODE_OPTIONS`, patches builtins and calls
  `module.syncBuiltinESMExports()` so named ESM imports see the patch, and appends JSONL to a
  log in the run's temp dir that `runSelectedTests` reads back. The witness is a second
  preload of the same shape, not a change to the spy: the spy watches spawns, the witness
  watches file writes.
- Rejected: running the tests against a store the live system does not write to (a mount
  namespace or overlay over `.fgos`). `unshare -rm` is refused with "Operation not
  permitted" in the confined sessions that run lands. Running the gate in another checkout
  would change the land gates (non-goal).

## Authority map

`fgos authority locate` returns no model row that owns `scripts/run-tests.mjs`: it is
repository test tooling, and the only top match is `runner` by name, which is the
execution runner, not this script. The change adds no component, door, contract or
decision kind; it replaces one constant inside an existing script, so the table has no
rows. The replacement inside the script: survivor `LIVE_FGOS_DIRS`; retired
`DERIVED_FGOS_FILES`, both in `scripts/run-tests.mjs`.

Phase 2: `fgos authority locate` for "a preload module that records which .fgos files the
test processes write during a run" returns only unrelated low-score doors
(`agent-hook-table`, `control-the-gateway-process`); test preloads have no row, like
`test/helpers/git-spawn-spy.mjs`. No component, door, contract or decision kind is added.
survivor: `test/helpers/fgos-write-witness.mjs` read back in `runSelectedTests`; retired:
`LIVE_FGOS_DIRS` and `snapshotFgos`'s whole-store walk in `scripts/run-tests.mjs`.

| New thing | Model row | Note |
|---|---|---|

## Phases

| id | title | depends-on | footprint | wave | status |
|---|---|---|---|---|---|
| 1 | [Skip live runtime directories in the leak check](phase-01-skip-live-runtime-dirs.md) | - | scripts/run-tests.mjs, test/scripts/run-tests.test.mjs | 1 | done |
| 2 | [Attribute .fgos writes to the test run](phase-02-attribute-fgos-writes-to-the-test-run.md) | 1 | scripts/run-tests.mjs, test/scripts/run-tests.test.mjs, test/helpers/fgos-write-witness.mjs, packages/git/contracts/mutation-census.v1.json | 2 | ready |

Phase 1: one phase, one wave: one constant, one walk filter and one test file.

Phase 2 is one phase: the witness, its reader and its proof land together (a reader without
the witness fails every run closed). No integration phase: there is one branch, and its
verify is the full gate for its footprint. The census is a generated hot file that other
plans also regenerate; the phase regenerates it last, on the rebased tree, and never
hand-merges it. The footprint adds one file to the three the discussion named: the witness
module, a new file the attribution needs; no other plan touches it. Checked with
`node scripts/plan-contract-check.mjs` and `fgos resource-check --plan`.

## Progress

- 2026-11-24 21:46: phase 1 parked (status stays `running`; the plan contract has no parked status). Worktree
  `/home/vantt/projects/forgent-worktrees/261124-1945-run-tests-fgos-leak-check-p01`
  (branch `run-tests-fgos-leak-check/p01`) was created. Implement unit ticket
  `c-1500-1795530727458` (unit run `unit-run-1795530727883-115cc050`, executor `gemini`,
  chosen by `dispatch decide --for code:implement`) stayed `running` through 12+ waits.
  Its run record shows `phase: admitted`, `delivery: not-sent`, empty stdout/stderr and no
  writes since 21:32:08, and the worktree has no changes. A restarted lead resumes it with
  `fgos request result c-1500-1795530727458` before starting a new unit.

- 2026-11-24 21:55: the gemini unit settled `pass` at 21:48 with commit `91ce789b5`, which
  also carried out-of-scope sandbox workarounds (git-addon reuse, a `/var/tmp` fallback). Fix
  unit `c-4812-1795531733577` (claude) committed `07965d1f2`, and the branch diff is now only
  the phase's change. Review (general-purpose reviewer, dispatch `in-process`): no blocking
  findings, and AC1-AC3 plus every phase step are met. Not fixable through the land door: the
  branch has two commits (rollback = revert both), and neither message records that the
  `cache/other.json` failure case was retired on purpose because the owner's list excludes all
  of `cache`. This note records it. The lead could not run the verify itself: its sandbox
  cannot write `target/`.
- 2026-11-24 21:55: land of `run-tests-fgos-leak-check/p01` blocked. `fgos land` refuses
  `main-checkout-dirty-overlap` on
  `plans/discussions/ds-ubqlutna6r-domain-agnostic-item-component/DISCUSSION.md`, which a
  shaper is editing uncommitted in the main checkout. Main has moved on since the branch base
  `1d742126f`. `fgos run --sync main` through the request route drops `--sync`, so the lead
  cannot catch the branch up to main. Needs the shaper to land its discussion, or a sync of
  the branch by the supervisor; then retry
  `fgos land run-tests-fgos-leak-check/p01 --test test/scripts/run-tests.test.mjs`.

- 2026-11-24 22:00: phase 1 done. Branch `run-tests-fgos-leak-check/p01` landed as main
  `ee1d9ca00` (ticket `c-9444-1795532219301`, after transient `merge-slot-busy`,
  `land-target-changed` and a `main-checkout-dirty-overlap` that cleared once the shaper
  landed its discussion). Land gates passed, including
  `node scripts/run-tests.mjs ... test/scripts/run-tests.test.mjs` (AC1-AC3). The door removed
  the phase worktree; none kept. Plan done.

## Owner questions

- **q-3rhc6lroqc, who repairs the backlog index files: answered "Secretary repairs them"** (owner,
  2026-11-24 22:32). The secretary repairs the backlog index files; this plan does not.

## Risks and rollback

Phase 1 (kept for history; its first risk is removed by phase 2):

- **A real leak into an excluded directory now passes.** A test that writes into
  `cache`, `logs`, `observe/records`, `runtime/land` or `runtime/mailbox` of the real
  checkout is no longer caught. This is the trade the owner chose; the existing test
  "tolerates a rewrite of the derived state view but still fails other cache changes"
  loses its second half (`cache/other.json` failing) because that behavior is removed by
  the owner's list, not weakened. Phase 2 removes the exclusions, so a test's own write
  there fails again.
- **Rollback:** revert the phase's single commit.

Phase 2:

- **Writes the witness cannot see (medium).** The witness sees file calls made through
  Node's `fs` in a test file process or a Node child that inherits `NODE_OPTIONS`. It does
  not see the Rust host binary, a shell, a child handed an env without `NODE_OPTIONS`, or
  the native addon writing from inside a Node process. A test that leaks into the real
  `.fgos` only that way now passes, where phase 1's walk caught it outside the excluded
  directories. Proof point for validating, run once by the phase (step 7): on a tree with no
  live heads writing, run the full suite with the witness and with the old whole-store walk
  side by side (a throwaway local script, not committed), and compare. A test-made change the
  walk saw and the witness missed is named in Progress, and the phase stops and reports it
  rather than landing a check that misses a known leak; none found is recorded as the
  evidence. Extending attribution to the Rust host is a later backlog item, outside this
  footprint.
- **A test and a live head touch the same path.** The witness records the path's state at
  the test's first touch; if a live head changes it later too, the run fails on a path the
  test did write. The test wrote into the real `.fgos`, so the failure is right.
- **Fail closed.** The test file process always loads the witness through `--import`, so a
  run with test files and no witness record means the preload broke; the run fails with a
  message naming the witness rather than passing with nothing attributed.
- **Census conflicts.** `packages/git/contracts/mutation-census.v1.json` is regenerated by
  every plan that touches `scripts/`; a land that meets a newer census regenerates it on the
  rebased tree, never merges it by hand.
- **Rollback:** revert the phase 2 commit(s); the stopgap list from `b4581336d` returns with
  them. Regenerate the census on the reverted tree.

## Outstanding questions

None
