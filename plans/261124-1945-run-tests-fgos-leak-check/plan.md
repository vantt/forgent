---
contract: plan-v1
title: "The leak check of run-tests judges only what the test run wrote"
status: done
lead: head:lead-forgent-261124-1945-run-te-f3bee
priority: P1
blockedBy: []
footprint:
  - scripts/run-tests.mjs
  - test/scripts/run-tests.test.mjs
  - scripts/lib/fgos-write-witness.mjs
  - test/scripts/full-suite-queue.test.mjs
  - test/scripts/test-select.test.mjs
  - test/scripts/run-test-canary.test.mjs
  - plans/261124-1945-run-tests-fgos-leak-check/
base: ab5b3b1bf700e4f092545905b2b8dc0bb6af6433
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
   exits 0 in the phase worktree with the census regenerated there for the run
   (`node scripts/git-one-door-scan.mjs --write-census`), and the branch carries no census
   edit: the land door regenerates it before its gates (`land.regenerate` in
   `.fgos/config.yaml`).

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
survivor: `scripts/lib/fgos-write-witness.mjs` read back in `runSelectedTests`; retired:
`LIVE_FGOS_DIRS` and `snapshotFgos`'s whole-store walk in `scripts/run-tests.mjs`.

| New thing | Model row | Note |
|---|---|---|

## Phases

| id | title | depends-on | footprint | wave | status |
|---|---|---|---|---|---|
| 1 | [Skip live runtime directories in the leak check](phase-01-skip-live-runtime-dirs.md) | - | scripts/run-tests.mjs, test/scripts/run-tests.test.mjs | 1 | done |
| 2 | [Attribute .fgos writes to the test run](phase-02-attribute-fgos-writes-to-the-test-run.md) | 1 | scripts/run-tests.mjs, test/scripts/run-tests.test.mjs, scripts/lib/fgos-write-witness.mjs, test/scripts/full-suite-queue.test.mjs, test/scripts/test-select.test.mjs, test/scripts/run-test-canary.test.mjs | 2 | done |

Phase 1: one phase, one wave: one constant, one walk filter and one test file.

Phase 2 is one phase: the witness, its reader and its proof land together (a reader without
the witness fails every run closed). No integration phase: there is one branch, and its
verify is the full gate for its footprint. The footprint adds one file to the two code files
the discussion named: the witness module, a new file the attribution needs. It lives in
`scripts/lib/`, next to the other preload `buildTestArgv` loads from there
(`scripts/lib/test-git-config-guard.mjs`), not in `test/helpers/`, which the running plan
`261122-2108-delete-dead-node-execution-closure` claims whole. The census the discussion
listed is left out of the footprint: the land door regenerates it (Risks). Checked with
`node scripts/plan-contract-check.mjs` and `fgos resource-check --plan`.

## Progress

- 2026-11-25 18:34: step 7 run by the unconfined `lead:SUPERVISOR` session with the four leads held idle (no run-tests,
  cargo, `node --test` or `fgos run` process). One full `npm test` on release 3beba73a (18:23:41 to 18:34:11) ended
  exit 1: 6675 tests, 6624 pass, 24 fail, 27 skipped; the failures are outside this plan (backlog p-5d2e1c9a names the
  umask 002 class, not checked one by one). The witness reported one change, a deleted `.fgos/runtime/dev-host/run-csuu1U`
  that is in neither whole-store walk, so the walk cannot name its writer (a per-invocation `fgos:dev` directory, pruned
  during the run). The throwaway walk (before 18:23:32, after 18:34:15) saw 12 added paths under `observe/records` and 5
  modified files (`cache/questions.json`, `logs/invocation-faults.jsonl`, `runtime/mailbox/mail-taken`,
  `runtime/watcher/state.json`, `runtime/test-suite-last-run.json`). The first four are written by the live watcher
  timer, its questions refresh and the mailbox take (the fault log shows one `watcher` and one `questions` entry about
  every three minutes inside the run, each citing the blocked remote transfer `remote-2197219-1794971807928534033-1`);
  the last is the runner's own record. No test-made change was seen by the walk and missed by the witness. Caveat for
  the proof point: "no live head writing" is not "no live writer", because the watcher and mailbox timers keep writing
  into `.fgos`; a walk compared with the witness on a tree with the timers running will always show them.

- 2026-11-25 18:10: owner answered q-dzh2ojhcvc "You paste the request into it". The supervisor typed the
  owed step 7 (full `npm test` with the witness against a throwaway whole-store walk, no code changes) into
  the unconfined `lead:SUPERVISOR` session (`claude-xonu@fg-server2`), under events `c5f179128332d27b` and
  `be5ecfc7302fff72`. That session writes the step 7 outcome as its own Progress line.

- 2026-11-25 15:10: phase 2 done; plan done. Branch `run-tests-fgos-leak-check/p02s` (commits
  `ffcf08a35` witness and reader, `5f44a1cb2` review fixes: whole-store root, recursive mkdir
  ancestors, late stray writes, empty added directories, fail-closed logging) landed as main
  `9306c5df7` (ticket `c-38193-1795592028795`). Land gates passed, among them the census test and
  `test/scripts/run-test-canary.test.mjs`; `rg LIVE_FGOS_DIRS` is empty (AC1-AC6). The door
  removed the p02s worktree. Review: reviewer findings 1-7 were fixed by unit `c-32672-1795591114959`
  before the land. Step 7 is weak, not done: the verification unit `c-2670-1795593697937` could not
  run `npm test` or a subset, because run-tests takes `~/.local/state/fgos/locks/full-suite.lock`
  first and that path is read-only in unit sandboxes (EROFS), so no test ran. The only evidence is
  the 13:30 subset walk (0 `.fgos` changes the witness missed). The full-suite walk-vs-witness
  comparison is handed to the supervisor. The carry patch is removed. Worktrees kept and handed to
  the supervisor: `-p02` (superseded uncommitted copy of the change) and `-p02r` (clean, merged).

- 2026-11-25 13:45: owner answered q-4aalqblcof "Widen footprint by the three files" (acked). A lead's
  paths land refuses a footprint change (`footprint-change-refused`), so phase 2 stays parked (status
  `running`) until the supervisor or a planner lands this edit to `footprint:` in one `fgos land --paths`
  commit of this `plan.md`: add `test/scripts/full-suite-queue.test.mjs`, `test/scripts/test-select.test.mjs`
  and `test/scripts/run-test-canary.test.mjs`, and the same three paths to phase 2's footprint cell in the
  phase table. No other change. No running plan claims these files. Once it lands, the lead runs one fix unit
  in the existing p02 worktree that wraps those files' fake spawns like `asWitnessedSpawn` (no assertion
  changes, no switch), then the reviewer, the owed step 7 (full `npm test` comparison) and the land. The p02
  worktree still holds the uncommitted change; the census there is restored. Supervisor event raised.

- 2026-11-25 13:30: phase 2 parked on owner question q-4aalqblcof (status stays `running`). Worktree
  `/home/vantt/projects/forgent-worktrees/261124-1945-run-tests-fgos-leak-check-p02` (branch
  `run-tests-fgos-leak-check/p02`) holds the uncommitted implementation from unit ticket
  `c-1448-1795586714512` (claude, unit run `unit-run-1795586714970-56f99249`, outcome `blocked`):
  the witness module, the reader replacing `LIVE_FGOS_DIRS`, and the AC1-AC3 leak cases, which pass;
  `rg LIVE_FGOS_DIRS` is empty. Blocker: fail-closed (AC3) fails 7 cases in three files outside the
  footprint that call `runTests` with a fake spawn that never loads the witness
  (`test/scripts/full-suite-queue.test.mjs`, `test-select.test.mjs`, `run-test-canary.test.mjs`); the
  question asks to widen the footprint by them. Step 7 is weak: a whole-store walk around a broad
  subset run saw 0 `.fgos` changes the witness missed, but the full `npm test` could not run in the
  unit sandbox (full-suite lock unwritable) and is still owed. The regenerated census is still
  modified in the worktree: neither the unit nor the lead could restore it (read-only git dir); it
  must be restored before the next unit. Not reviewed yet: review follows the fix unit.

- 2026-11-25 13:10: owner answered q-zw4htizjz2. Footprint narrowed (census dropped, witness
  at `scripts/lib/fgos-write-witness.mjs`); plan set `ready` for admission.

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

- **q-4aalqblcof, the three fake-spawn test files outside the footprint: answered "Widen footprint by
  the three files"** (owner, 2026-11-25 13:36). Allows adding exactly `test/scripts/full-suite-queue.test.mjs`,
  `test/scripts/test-select.test.mjs` and `test/scripts/run-test-canary.test.mjs` to the footprint, and a fix
  unit that edits only their fake spawns so they write the witness load line. Forbids any other footprint
  change, changing those tests' assertions, or any flag or env switch that skips the leak check. AC3
  (fail closed) stays as planned.
- **q-3rhc6lroqc, who repairs the backlog index files: answered "Secretary repairs them"** (owner,
  2026-11-24 22:32). The secretary repairs the backlog index files; this plan does not.
- **q-zw4htizjz2, the census footprint clash: answered "Exempt regenerated census"** (owner,
  2026-11-25 12:54). The exemption is its own plan,
  [261125-1259-plan-check-regenerated-census](../261125-1259-plan-check-regenerated-census/plan.md)
  (backlog p-qvgaqip4tj). This plan does not wait for it: the census came out of the footprint
  because the land door already regenerates it (Risks), and the witness moved from
  `test/helpers/` to `scripts/lib/`, because the running dead-node plan also claims
  `test/helpers/**`, a clash the exemption alone would not have cleared. Phase 2's mechanism is
  unchanged; only its file path and census step changed.

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
- **Census.** The branch never commits `packages/git/contracts/mutation-census.v1.json`. The
  land door regenerates it in the candidate before its gates run (`land.regenerate` in
  `.fgos/config.yaml`; `packages/supervision/rust/src/land.rs`: a regenerated file is exempt
  only through the regeneration the land performs), so a census edit on the branch would be
  refused `land-outside-footprint`. The phase regenerates it in its worktree only to run the
  census test, then restores it.
- **Rollback:** revert the phase 2 commit(s); the stopgap list from `b4581336d` returns with
  them. The land of the revert regenerates the census.

## Outstanding questions

None.
