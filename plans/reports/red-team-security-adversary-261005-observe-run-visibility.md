# Red Team (Security Adversary + Fact Checker): observe-run-visibility-and-discussion-measurement

Plan: `plans/261005-1143-observe-run-visibility-and-discussion-measurement/` (plan.md + phases 1-6)
Date: 2026-10-05. Read-only review; no source or plan edits.

## Fact-check sample (per phase)

| Phase | Claim | Verdict |
|---|---|---|
| plan | `lib.rs:336-361` reads only `assignments/<id>/runs/<NN>/` | TRUE (lib.rs:345-366) |
| plan | staged host `metrics runs --since=2026-10-01` = 0 | TRUE (re-run today: `"total": 0`) |
| plan | nested run at `unit-run-1791193921045-86133024/producer/1/runs/01` | TRUE |
| plan | 120af6b3d = 2026-09-29, 073c8b6fc = 2026-10-01 | TRUE |
| plan | smoke test pins 1028 / 103 | TRUE (smoke_real_store.rs:14,18) |
| plan | "17 files build .fgos/assignments paths" | FALSE: 15 files in `src/` |
| plan | "Three independent flat walkers" | INCOMPLETE: `src/runner/execution/unit-run-history.mjs:37-52` is a fourth (nested) walker, absent from the audit list |
| 1 | `listRuns` at `runtime-inspection.mjs:78-81` | FALSE symbol: function is `allRuns` (:69), loop at :79-80 |
| 1 | escape guard at `runtime-inspection.mjs:276-280` | Located at :280; it is lexical only (`isWithinDir`, :26-30) |
| 1 | 1099 assignment dirs | TRUE |
| 2 | role/adapter read from `assignment.json` | TRUE (lib.rs:401-411); but nested `result.json` already carries `role`, `adapter` |
| 2 | "skipped counts returned alongside observations" | Requires changing `ObservationSource` trait (observe `contract.rs:81-84`), not listed |
| 3 | observe checks at `registrations.mjs:5766-5780` | TRUE |
| 3 | `checks.test.mjs` id list at :129 | TRUE (:129-131) |
| 3 | `invokeHost` in `src/util/host-bin.mjs` | TRUE (:73) |
| 4 | workflow events at `src/workflow/runner.mjs:313` | FALSE: :313 is merge code; events at :377 and :400 |
| 4 | join via `unit.scheduled`/`unit.complete` by `unitRunId` | PARTIAL: `unit.scheduled` payload has no `unitRunId` (runner.mjs:377-382) |
| 4 | fallbacks as `<round>-fb<n>` | TRUE on mdview (`1-fb1`), matches unit-run-history.mjs:45 |
| 5 | claims at `<seat>/runs/<NN>/outbox/result-<N>.json` | PARTIAL: 47 nested runs have `outbox/result-1.json`, 15 use `worker-output/outbox/agent-result.json` |
| 5 | porting-log rows exist | TRUE (`docs/distillery/porting-log.md`) |
| 6 | `metrics case list --harness <name>` | FALSE: list accepts only `--open` (case.rs:41-44) |
| 6 | harness `decision`, verdicts `confirmed|revised|...` | FALSE: hardcoded enums (case_journal.rs:248, :330) |

## Finding 1: The D1 walk rule lets a worker forge runs and hijack inspection of its own run
- **Severity:** Critical
- **Location:** plan.md "Decisions" D1; Phase 1 "Architecture"; Phase 2 "Architecture"
- **Flaw:** D1 says a run is "any `<dir>/runs/<NN>/` whose `<dir>` holds `assignment.json`, depth-bounded". It never says the walk stops at a run directory. Run directories contain worker-writable trees (`outbox/`, `worker-output/outbox/`), and workers already write arbitrary nested directories and symlinks there.
- **Failure scenario:** A panelist writes `outbox/x/assignment.json` plus `outbox/x/runs/01/{run.json,result.json}` copying its own `runId`. Phase 1's lister then reports two locations for the same run id. `inspectDispatchRuntime --run` returns `ambiguous` with `manual-required` and no `recoveryAuthority`, so the real run can no longer be recovered. `findRunDir` returns the first match, so `show-run` may display the forged run. Phase 2 counts the forged run in `metrics runs --by=executor/role`, which skews reliability numbers that people use to choose executors. Phase 3 doctor counts it too, so disk and observed stay "equal" and hide the forgery.
- **Evidence:** `.fgos/assignments/asgn_lead_claude_code_session_01wf12gbvmr5oq12bbjbyzwq_op_051/runs/01/outbox/audit-fixtures/release/payload/linked-evil.mjs -> ../../outside/evil.mjs` shows a worker-written dir tree plus a symlink inside an outbox. Outbox dirs reach depth 8 (`find -path '*/outbox/*' -type d`). Ambiguity branch: `src/runner/dispatch/runtime-inspection.mjs:276`. First-match: `src/verbs/dispatch/show-run.mjs:58-63`.
- **Suggested fix:** Make the rule structural, as `unit-run-history.mjs:45,52` already does. Flat ids are `^[^/]+$`. Nested ids are `unit-run-*/<role>/^\d+(-fb\d+)?$`. Attempts are `^\d+$`. Never descend below `runs/`. Add a test that plants `assignment.json` + `runs/01` inside an outbox and asserts it is not listed by Node, by Rust, or by doctor.

## Finding 2: Symlink semantics are undefined and already differ between the Rust and Node walkers
- **Severity:** High
- **Location:** Phase 1 "Requirements" and step 4 ("a symlink/escape id"); Phase 2 step 2 (`walk_runs`)
- **Flaw:** The only symlink test planned is for an id. Directory symlinks during the walk are not covered. Rust `Path::is_dir()` follows symlinks, while Node `Dirent.isDirectory()` does not. The guard the plan reuses is lexical (`path.resolve` + `startsWith`), so it cannot detect an escape through a symlink.
- **Failure scenario:** Suppose a symlinked directory sits under `.fgos/assignments` (for example `x -> /` or `x -> ../../other-project/.fgos/assignments`). The Rust `walk_runs` traverses outside the store up to the depth cap, reads foreign `result.json`/`assignment.json` and counts them. Node skips the same entry. The Phase 2 invariant (`observed == on_disk` against "an independent plain recursive count") and the Phase 3 doctor then disagree permanently. Phase 3's "never loosen the comparison" rule leaves no way out, and `metrics` can be made to walk `/`.
- **Evidence:** `packages/run-result/rust/src/lib.rs:356,362,377` (`is_dir()` follows links); `src/runner/dispatch/runtime-inspection.mjs:15` (Dirent, no follow); lexical guard at `runtime-inspection.mjs:26-30`.
- **Suggested fix:** State in the spec section: "symlinks are never followed; containment is checked with realpath". Use `symlink_metadata`/`file_type()` in Rust and Dirent in Node. Add one shared fixture with a dir symlink and a cycle, and run both language test suites against it.

## Finding 3: Making `/` legal in assignment ids while leaving direct path builders unguarded
- **Severity:** High
- **Location:** Phase 1 "Related Code Files" ("A file that builds one path from a known id is not an enumerator and stays"); Phase 1 step 2
- **Flaw:** D1 turns slash-bearing ids into the official contract and spreads them through inspect, show-run and recover output. The audit only touches enumerators. Builders that join an id taken from disk or from a RunResult stay unguarded, and some of them perform destructive or trust-bearing operations. The audit also misses the fourth walker.
- **Failure scenario:** `recover.mjs:228` unlinks `assignments/<assignmentId>/dispatch.claim` with no containment check. `operation-choice.mjs:701` reads `assignment.json` from `lastRunResult.assignmentId`, and RunResult is an unvalidated on-disk file. An id such as `../../x` or `a/../../..` passes as an "id that may contain `/`". In addition, `worker-home.mjs:115` builds `mkdtemp(path.join(baseDir, \`worker-${runId}-\`))`. With nested run ids (`run_unit-run-X/producer/1_01`) this points into a non-existent subdirectory, which is a slash bug of exactly the kind the audit's "stays" rule classifies away. `handoff-refs.mjs:118-119` applies a different, stricter rule (`dirname === assignmentsDir`), so the repo would end up with three containment rules.
- **Evidence:** `src/verbs/dispatch/recover.mjs:228`; `src/runner/operation-choice.mjs:701`; `src/runner/dispatch/cli.mjs:1110-1111`; `src/runner/dispatch/assignment-runner.mjs:1285`; `src/runner/dispatch/worker-home.mjs:115`; `src/runner/execution/handoff-refs.mjs:118-119`; `src/runner/execution/unit-run-history.mjs:37-52`.
- **Suggested fix:** Have the layout module export `assignmentDir(id)` with segment validation: no empty, `.` or `..` segments, no absolute ids, plus realpath containment. Require every path builder found in the audit to use it, not only enumerators. Add `unit-run-history.mjs` to the audit and the guard test. Classify every place a run id is used to build a path (`worker-home.mjs:115`).

## Finding 4: The stance sensor reads raw, mutable, symlink-able worker files at a guessed path, ignoring the validated claim
- **Severity:** High
- **Location:** Phase 5 "Architecture" ("reads claims from `<seat>/runs/<NN>/outbox/result-<N>.json`"); Phase 5 "Requirements" (choice is one of declared options)
- **Flaw:** (a) The claim location is decided per run by the effective contract. Hard-coding one path re-creates this plan's own root cause, an implicit location contract. (b) The outbox file is untrusted, stays writable after settlement, and may be a symlink. (c) The validated claim is already frozen into `result.json` (`agentClaim`, `claimSha256`). (d) The Node validator has no unit context, so membership of `choice` in the declared options cannot be enforced there. Step 2 only tests the type.
- **Failure scenario:** 15 of 122 nested runs here keep their claim at `worker-output/outbox/agent-result.json`, so their stances read as missing and inflate `stancesMissing`. A seat or a later process rewrites `outbox/result-1.json` after settlement, or replaces it with a symlink to another seat's claim, and the recorded agreement changes after the fact. Rust `File::open` follows the link. A `choice` outside the declared options is counted as a group, which can tip `genuineSplit`.
- **Evidence:** `src/runner/dispatch/assignment.mjs:884-885` (`effectiveContract.resultClaim.path ?? runDir/agent-result.json`); `src/runner/dispatch/agent-result-claim-contract.mjs:52-88` (no options context); `result.json` keys include `agentClaim`, `claimSha256` (`unit-run-1791193921045-86133024/producer/1/runs/01/result.json`); outbox symlink evidence as in Finding 1.
- **Suggested fix:** Read the stance only from `result.json.agentClaim.stance`, which is settled and hashed. Validate `choice` against the options recorded in `unit.json` at read time, and put out-of-set values in an `invalid` bucket rather than a group. Never open files under `outbox/`.

## Finding 5: "Host too old → degraded" cannot be detected; the old host answers successfully with a wrong number
- **Severity:** High
- **Location:** Phase 3 "Requirements" (second bullet); plan.md "How Rust changes are verified"
- **Flaw:** The staged host does not fail. It returns `total: 0` (since 10-01) or 887 with exit 0. `invokeHost` only reports a version problem when stderr says "unknown ... subcommand". No capability marker is planned, so the check cannot tell "old host" from "regressed host".
- **Failure scenario:** Two outcomes are possible. If implemented literally, doctor goes red on every machine running the installed release, including mdview, until a release is cut, which contradicts the "never a false failure" requirement. If someone adds a heuristic such as "observed < disk → maybe old host → degrade", the check fails open and hides the exact regression it exists to catch. There is also a root mismatch: `invokeHost` always passes `--dir <main checkout root>`, so doctor run from a worktree compares the host's main-root count with the Node count of whatever root doctor resolved.
- **Evidence:** staged host run today: `{"data":{"total":0,...}}` exit 0; `src/util/host-bin.mjs:81-82` (forces `--dir mainRoot`), `:94-100` (only an unknown-subcommand error maps to mismatch); host has no `--version` verb ("unknown verb \"--version\"").
- **Suggested fix:** Have the fixed host emit an explicit marker, for example `data.coverage: {walker: "nested-v1", onDisk, skipped}` in `metrics runs`. Doctor degrades only when the marker is absent and fails on any shortfall when it is present. Count on disk with the same `mainRoot` that `invokeHost` uses.

## Finding 6: Phase 6 misdescribes the case mechanism; the decision ledger would lock every case in the repo
- **Severity:** High
- **Location:** Phase 6 "Requirements" (harness `decision`, verdict vocabulary, `list --harness`), step 4 (open a decision case reviewed "at a named date"); plan.md D4 ("additive")
- **Flaw:** Four of the plan's assumptions do not match the code. Harness is a closed enum `fgos|cook-plan|plain`. Verdict is a closed enum `usable|fixed|discarded`. `list` takes only `--open`. Only one case may be open per project at a time. Supporting the plan therefore needs enum changes, which are not additive. On top of that, a decision case left open until its review date blocks every other `case open`.
- **Failure scenario:** Step 4 opens the D1 decision case and leaves it open for weeks. The two A/B cases and plan 260930's measurement cases then fail with `AlreadyOpen`. `.fgos/observe/cases` is not ignored, so once committed the open case propagates to every worktree and branch. On the integrity side, the reader accepts any well-formed line with no range check, so a hand-edited or merged tracked shard with `scores: {"x": 99}` or a self-declared `judge: "opus"` is listed as real. Only the writer validates (step 2).
- **Evidence:** `packages/observe/rust/src/case_journal.rs:248` (harness enum), `:330` (verdict enum), `:266-268` (single open case), `:161` (read path: serde parse only); `packages/observe/rust/src/metrics_cli/case.rs:41-44` (`list` only `--open`); `git check-ignore .fgos/observe/cases/a.jsonl` → not ignored.
- **Suggested fix:** Close a decision case right away with the prediction recorded and reopen it for review under a new name, or model decisions as a separate shard. Do not hold an open case. List the enum changes explicitly in D4. Validate `scores` ranges at read time and skip or flag out-of-range lines.

## Finding 7: The "blind judge" is a protocol paragraph, not isolation
- **Severity:** Medium
- **Location:** Phase 6 "Requirements" ("blind-judge protocol (judge never sees the source)"), step 4
- **Flaw:** Blind isolation in fgOS comes from `hostRead: blind`, which hides only assignments, workflow-runs, dispatch-runs, the herdr socket and the confinement temp root. The places where Phase 6 records which setup produced which output stay readable: `.fgos/observe/cases` (case `task`/name text), `plans/reports/` (the prior run named files `ab-council-*`/`ab-fgos-*`), and the how-to doc itself.
- **Failure scenario:** An Opus judge running in the repo cwd lists `.fgos/observe/cases/*.jsonl` or `plans/reports/council-lens-experiment-261004/outputs/`, sees which setup is which, and the "blind" scores carry source bias. A score is recorded as blind when it was not.
- **Evidence:** `src/runner/dispatch/confinement/resources.mjs:26-32` (BLIND_HIDDEN_ROOTS); `plans/reports/council-lens-experiment-261004/outputs/ab-council-chairman-verdict.md`, `ab-fgos-panelist-1.md`.
- **Suggested fix:** Dispatch the judge with `hostRead: blind` and hand it the outputs as copies with neutral names (A/B, assignment randomized and recorded only after scoring). Add `.fgos/observe` to the hidden roots for judge runs, or judge in a scratch cwd. Record `judge` from the actual dispatch's run id, not from a free-text flag.

## Finding 8: "Fixture built from a copy of three real units (scrubbed)" will commit run secrets and private text
- **Severity:** Medium
- **Location:** Phase 4 "Related Code Files" (hermetic fixture from real units); Phase 2 step 3 (fixtures)
- **Flaw:** "Scrubbed" is never defined. Real unit directories contain a fencing `controlToken` in `result.json`, `protected/secrets`, `protected/launch-envelope.json`, provider `stdout.log`/`stderr.log`, `inputs/` copies of other seats' reports, and `unit.json` objectives with absolute home paths. Test fixtures are git-tracked, and the source repo for the fixtures is mdview, another project.
- **Failure scenario:** Someone runs a `cp -r` of three mdview units into `packages/run-result/rust/tests/fixtures/` with partial scrubbing. Provider logs, the other project's private discussion text, control tokens, and protected launch envelopes end up in the fgOS git history permanently.
- **Evidence:** `src/runner/dispatch/run-lock.mjs:340` (`controlToken: crypto.randomUUID()`, persisted in `result.json`, which has the `controlToken` key); run dir listing shows `protected/secrets`, `protected/launch-envelope.json`, `stdout.log`; `unit-run-1791193921045-86133024/unit.json` objective embeds `/home/vantt/projects/forgentX/.fgos/assignments/...`.
- **Suggested fix:** Build fixtures from an allow-list: `unit.json` bindings only, `assignment.json` {role, round, binding}, and `result.json` {runId, settledAt, executorId, role, classification, agentClaim.stance}. Never copy `protected/`, logs or `inputs/`. Add a test that fails if any fixture contains `controlToken`, `protected`, or `/home/`.

## Finding 9: Phase 4/2 boundary and join claims are wrong in ways that hide units
- **Severity:** Medium
- **Location:** Phase 4 "Requirements" (unit id from `unit.scheduled`/`unit.complete`); Phase 4 step 1 (`runner.mjs:313`); Phase 2 "Architecture" (skipped counts "returned alongside observations")
- **Flaw:** `unit.scheduled` carries no `unitRunId`. Only `unit.complete` does, so a unit that crashed or is still in flight (the failure case the plan most wants to see) cannot be linked to its workflow and appears as workflow null. Phase 2's coverage counts need a change to the shared `ObservationSource` trait, which three sources implement and which the plan does not list. The cited line `runner.mjs:313` is merge code, not the event types.
- **Failure scenario:** The failed mdview Delphi run in acceptance item 5 is reported as an orphan unit with no workflow. The Phase 2 implementer either breaks the trait for `ClaudeTranscriptsSource`/`WorkSource` or drops the skipped counts quietly, and the "not silent" requirement is lost.
- **Evidence:** `src/workflow/runner.mjs:377-382` (`unit.scheduled` payload: stepId, unitId, worktree only), `:400-405` (`unit.complete` with `unitRunId`); `packages/observe/rust/src/contract.rs:81-84`; `apps/fgos/src/wiring/metrics_sources.rs` (three sources).
- **Suggested fix:** Join on `unit.json` (which already holds the unit and step identity) rather than on scheduled events, or add `unitRunId` to `unit.complete` only and state the in-flight gap. Declare the trait change (for example a `coverage()` method with a default impl) in Phase 2's file list.

## Unresolved questions

- Is `worker-home.mjs:115` reachable for nested runs today (a claude executor in a unit)? If it is, nested claude seats already fail at `mkdtemp`. That is a live bug outside this plan's scope, but the Phase 1 audit should file it.
- Do any automated decisions (executor selection, quotas) consume `metrics runs --by=executor`? If they do, Finding 1 rises from skewed reporting to steering dispatch.
