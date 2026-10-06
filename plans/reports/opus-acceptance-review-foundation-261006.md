# Acceptance review: observe run visibility, phases 1-3 (foundation)

Date: 2026-10-06. Reviewer: independent acceptance review (read-only). Scope: phases 1-3 of
[plan.md](../261005-1143-observe-run-visibility-and-discussion-measurement/plan.md), uncommitted working tree.

## What I ran (read-only)

- `node --test` on `assignment-layout`, `dispatch-visibility-session`, `observe-doctor-checks`, `dispatch-recovery`, `dispatch-observe`: 86/86 pass. `registrations`, `checks`, `dispatch-runtime-inspect`, `dispatch-reconciliation`, `dispatch-reconciliation-import-graph`, `dispatch-worker-home`, `dispatch-r9-performance-cache`: 244/244 pass. I did not run `npm test`.
- `cargo test -p fgos-run-result -p fgos-observe`: 74 pass, exit 0.
- Host binary: `target/debug/fgos` (mtime 2026-10-06 00:25, newer than every changed Rust source). The default resolver picks the old staged release `sha256:a1ba0d…/bin/fgos`.
- Live forgentX `metrics coverage`: `runDirsSeen 1199, observed 223, skipped {no-timestamp: 925, unparseable: 51}, recentRuns 0`. 223+925+51 = 1199. An independent `find` pruned at `runs/` counts **1199** attempt dirs, 0 symlinks outside `runs/`, and 1148 `result.json` (so all 51 "unparseable" are actually missing `result.json`).
- Live mdview: `runDirsSeen 90 = find 90`. 83 observed, 6 `no-timestamp`, 1 `unparseable`. `--by=role --since=2026-10-05` lists panelist-1/2/3 and others.
- `checkObserveRunCoverage`: old staged host gives `{passed:true, degraded:true, "old host predates…"}` (the old host prints `unknown metrics subcommand "coverage"`, exit 4). Rebuilt host passes with 1199/1199 here and 90/90 in mdview.
- `node bin/fgos.mjs dispatch show-run 'run_unit-run-1791193921045-86133024/producer/1_01' --json` resolves, `settled: true`, nested runDir. The plan's panelist id `run_unit-run-1791219961331-276f364c/panelist-1/1_01` resolves only from mdview (it says "no run" in forgentX). The plan bullet does not name the project.

## Verdict per acceptance criterion (phases 1-3)

| Criterion (plan.md / phase files) | Verdict | Evidence |
|---|---|---|
| show-run resolves a nested run id | PASS | Live command above. `findRunDir` is in `src/runner/dispatch/assignment-layout.mjs:88-96`. show/watch/recover import it. |
| `findRunningRuns` reports a nested running run (real shape) | PASS | `visibility-session.mjs:234-265`. The test adds `unit-run-example/panelist-1/1/runs/01` running, a settled `-fb1`, a planted outbox run and a symlink. The fresh-heartbeat nested case is included. |
| Reconcile dry-run before/after recorded; nested-orphan policy decided | PASS (as recorded, not re-run) | `observe-run-layout-261005.md`: active ids went 5 to 9 with the same snapshot digest. The policy is recorded in plan.md's open questions. |
| Single run definition: stop at `runs/`, no symlink follow, depth cap, `assignment.json` optional | PASS | Node `assignment-layout.mjs:52-81`, Rust `lib.rs:426-575`. Both tests materialize `test/fixtures/run-layout/expected.json` (Node `test/runner/assignment-layout.test.mjs:11`, Rust `layout_fixture.rs:61` via `include_str!`). The planted outbox run, symlinked attempt and empty `runs` are all excluded. |
| Skip reasons counted (7) | PASS in Rust; **partial in Node** | Rust counts all 7. Node product code counts only `symlink`/`depth`. The other five are only approximated inside the Node test (`assignment-layout.test.mjs:42-49`) with different semantics. See M1. |
| Seven readers migrated or justified | PASS | runtime-inspection, show-run, visibility-session and the doctor binding check were migrated. operation-choice, assignment.mjs and unit-run-history are justified in the inventory. I also checked the other `'assignments'` joins (`cli.mjs:1294`, `assignment-runner.mjs:1267`, `run.mjs:140`): they are allocators or explicit-id paths, not enumerators. |
| Guard test with allow-list that fails for a new enumerator | **FAIL** | Not implemented. The phase-01 checkbox text was rewritten to claim a "prohibited" guard. No repo rule forbids it: grep of AGENTS.md, CLAUDE.md, `.claude/rules`, `domains/` and `~/.claude/rules` for "source-text"/"wiring test" finds nothing. See H2. |
| `metrics coverage` accounting `observed + skipped = runDirsSeen` | PASS | Live numbers above. `assert_accounting` runs in every Rust test. |
| Rust and Node produce the same run set from the shared fixture | PASS (directory set); UNPROVEN (observed set from Node product code) | Node has no observed-set implementation; see M1. |
| No test pins an audit count; no cargo test reads the live store | PASS | `smoke_real_store.rs` deleted. `layout_fixture.rs` uses temp dirs only. |
| `metrics runs --since=2026-10-01 > 0`; `--by=role` lists current roles | PASS | forgentX since 10-01 = 120. mdview by-role lists panelists. |
| Live coverage matches independent counts (1199 / 90) | PASS | Matches my independent `find` counts. |
| Doctor: passes with rebuilt host, degrades with old host, fails on a hidden-run fixture | PASS | Live, plus `test/setup/observe-doctor-checks.test.mjs` (hidden, tolerance, old-host, invalid accounting). |
| Doctor Node side reads directory names only (no JSON parsing) | PASS | `registrations.mjs:5781-5793` only does `lstat` on `result.json`. |
| Registry/docs rows | PASS | `docs/specs/distribution.md` row 7 has only the backticked id. Manifest row for `assignment-layout.mjs`. command-registry examples include `metrics coverage`. Contract text corrected. `registrations.test.mjs`/`checks.test.mjs` are green. |
| "Observe sees every run" (title / Outcome 1) | **FAIL as stated** | 925 of 1199 run dirs (77%) are invisible to every windowed metric. 706 of them have an owner-written settlement time available. See H1. |
| Full suite green | UNPROVEN by me | The lead owns `npm test`. |

## Findings

### Critical

None.

### High

**H1. 925 real runs are dropped as `no-timestamp`, although 706 of them carry an owner-written settlement time. The owner was given a false either/or.**

- Evidence: `lib.rs:550-558` requires `settledAt`/`timestamp` *in `result.json`*. Live: `metrics runs --since=2026-09-01` = **223**, where the pre-change host reported 887. The rebaseline report frames the choice as "use `assignment.json.createdAt` (fictional) or drop" (`observe-rebaseline-261005.md`, "Timestamp decision").
- But every one of the 925 records has `runId`, `executorId` and `status`. Their sibling `run.json` has a real `settledAt` in **706** cases and `startedAt` in the other **219** (my scan of all 925). The dispatch owner writes `run.json.settledAt` at settle time (`detached-run-supervisor.mjs:460,523…`). That is not assignment creation.
- Failure scenario: anyone reading `metrics runs`/`harness`/`entropy` for Aug-Sep 2026 sees 75% fewer runs than exist. Executor reliability numbers for that period rest on 223 runs. The doctor check cannot catch this because it compares `runDirsSeen`, not `observed`. The CHANGELOG says nothing about `metrics runs` totals dropping, which is a user-visible change.
- This was an explicit owner decision, so I am not reversing it. I am presenting it for re-decision because it was made without this option. Options:
  - (a) Keep strict as now: 223 observed, history invisible.
  - (b) Fall back to `run.json.settledAt` from the same run dir, which is owner-written and settle-time: 929 observed. The 219 records with only `startedAt` stay `no-timestamp`.
  - (c) Do (b) and also add a distinct `ts-source` attr so windowed metrics can exclude fallback timestamps.
- Recommendation: (b) or (c). Both still satisfy "never manufacture a settlement time". Either way, add a CHANGELOG line about the total change.

**H2. The phase-1 guard test was dropped and the plan checkbox was rewritten to fit. An existing exact-closure assertion was deleted instead of updated.**

- The plan required (phase 1, step 7) "an allow-list of known direct enumerators, each with a reason … fails for any new enumerator". It is not implemented. The justification ("session policy forbids source-text/wiring tests") is not in any repo or global rule file I could find.
- Separately, `test/runner/dispatch-reconciliation-import-graph.test.mjs` lost its "strongest proof" exact transitive-closure assertion (−20 lines). The fix needed only one new line for `assignment-layout.mjs`. Removing it means any future import into the reconcile/planner graph, a trust-sensitive mutation path, goes unnoticed. That breaks the repo rule "Fix regressions instead of weakening tests" (`.claude/rules/primary-workflow.md`).
- Fix: restore the closure assertion with `src/runner/dispatch/assignment-layout.mjs` added. Then either implement the enumerator guard or have the owner explicitly waive it. Do not leave a self-rewritten checkbox.

### Medium

**M1. "Node and Rust implement the same rule" holds only for the directory half.**

- Node product code (`assignment-layout.mjs`) has no observed/skip admission. The fixture's `skipped` map is asserted in Rust (`layout_fixture.rs:128-130`), but Node only asserts `{symlink}` (`assignment-layout.test.mjs:40`).
- The Node test's own approximation differs from Rust:
  - It uses `Date.parse` validity where Rust uses a non-empty string, so `settledAt: "garbage"` is observed by Rust and rejected by the test.
  - It dedups with a `Set`, so `duplicate-run-id` is never actually checked.
  - It never distinguishes `inline-record` from `no-run-id`.
- Today only Rust consumes admission, so the impact is latent. Either put the claim in the spec/contract as "directory rule shared; admission is Rust-only", or move the Node approximation into product code and assert the fixture's full `skipped` map.

**M2. Doctor tolerance does not cover a new run dir created between the host scan and the Node scan.**

- `registrations.mjs:5787-5796`: tolerance is `max(recent result.json mtimes, host recentRuns)`. A freshly admitted attempt dir has no `result.json` yet.
- Scenario: a dispatch admits `runs/02` during the roughly 0.7 s host scan (measured 717-772 ms). Node then counts N+1, the host N, recent = 0, and the check fails with "host shortfall" during normal fan-out activity.
- The plan's own rule ("never widen tolerance") will push people to rerun. Fix: count attempt dirs whose directory or `run.json` mtime is within 60 s, or run the Node scan first and allow only `host >= node`.

**M3. Doctor failure "example paths" are not the hidden runs.**

- `registrations.mjs:5797` prints `layout.runs.slice(0, 3)`, the first three runs lexically, whatever the host saw. The plan required "example paths the Node side can name" for the shortfall.
- With counts only, the operator gets misleading paths. Either have the host emit its dir list or hash, or label the field "sample candidates", not shortfall examples.

**M4. `unparseable` is used for "no result.json yet".**

- `lib.rs:509-514`: a missing `result.json` (running or crashed attempt) is counted as `unparseable`. Live, all 51 forgentX "unparseable" are missing files, and 0 are corrupt.
- An operator reading `metrics coverage` will look for 51 corrupt files. The contract text admits it, but the plan's reason list has no such reason. Add `no-result` (contract `run-result.read.v1.json` and fixture `expected.json`) so corrupt files stay distinguishable.

**M5. The "worker cannot plant a run" claim is overstated.**

- Stop-at-`runs/` closes the outbox vector only. The red-team's structural id rule (security Finding 1: flat `^[^/]+$`, nested `unit-run-*/<role>/<round>(-fbN)?`) was not adopted.
- A worker with ordinary repo write access (confinement is metadata-only for most executors) can create `.fgos/assignments/aaa/runs/01/run.json` carrying another run's `runId`. `findRunDir` returns the lexically first match (`assignment-layout.mjs:90-94`), so `show-run`/`watch`/`recover` act on the forged dir. Rust keeps the first valid one, so Observe counts the forgery and skips the real run as `duplicate-run-id`.
- The CHANGELOG line "worker outboxes and symlinks cannot plant extra runs" is accurate only for outboxes. Either adopt the structural id rule or scope the claim to outboxes in the spec and CHANGELOG.

### Low

- `degraded: true` on the check result is consumed by nothing in the doctor runner. The only signal is the message text. Precedent `registrations.mjs:1310` (tsk-3oa2) chose `passed:false` for degraded postures.
- Any symlink *file* in a walked assignment dir (for example a symlinked `assignment.json`) increments `runDirsSeen` and `symlink`, though it is not a run dir. Node and Rust agree, so no false failure, but the count no longer matches `find`-style counts. There are 0 such symlinks live today.
- A `runs` dir directly under `.fgos/assignments` yields `assignmentId ""` in both languages.
- Scope drift: `scripts/lib/test-file-watchdog.mjs` plus `test/scripts/run-tests.test.mjs` (+174/−35) are outside the plan. They are justified as a suite-gate fix and recorded in the report and CHANGELOG. Acceptable, but they deserve their own commit.

## Red-team Critical/High items in phase 1-3 scope

| Red-team item | Status in code |
|---|---|
| Seven readers / live `findRunningRuns` bug | Fixed |
| Three definitions of a run | Fixed for directories; admission is Rust-only (M1) |
| Worker forges runs | Outbox fixed; structural rule not adopted (M5) |
| Old host undetectable | Fixed, verified live |
| Live-store test racy/vacuous | Fixed (smoke deleted); doctor race partly open (M2) |
| Rust follows symlinks | Fixed (`symlink_metadata`/`file_type`), shared fixture |
| Path builders with `/` ids | `recover.mjs` fixed with realpath guard; `operation-choice.mjs:701` left with justification; worker-home reproduced as safe and tested |

## Overall verdict

**ACCEPT WITH FIXES.** The foundation mechanics are correct and verified live (1199/1199, 90/90, old-host degrade, nested show-run and reconciler). Before calling it done:

- restore the deleted closure assertion (H2);
- take the guard waiver to the owner (H2);
- re-decide the timestamp policy with the `run.json.settledAt` option (H1).

## Unresolved questions

- Did the owner know about `run.json.settledAt` when approving strict timestamps? If yes, H1 becomes informational plus the missing CHANGELOG line.
- Which rule actually forbade the source guard? If it came from session instructions, the owner should confirm the waiver in plan.md rather than the implementer.
