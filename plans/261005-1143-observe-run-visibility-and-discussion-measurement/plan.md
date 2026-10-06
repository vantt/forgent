---
title: "Observe sees every run, and measures discussions"
description: "One run definition and one lister per language for .fgos/assignments (nested unit-run ids), so Observe, show-run, inspection and the reconciler stop missing discussion runs; then the measurement discussion power needs: coverage subcommand, writer-owned unit summaries, stance/agreement sensor, eval store."
status: in-progress
priority: P1
effort: "~7d"
tags: [observe, metrics, run-result, discussion, measurement, contract, doctor]
created: 2026-10-05
blockedBy: []
blocks: [260930-0335-measure-runresult-classification-impact]
---

# Observe sees every run, and measures discussions

## Problem (verified 2026-10-05, corrected after red team)

Observe is blind to every run made by the execution core since 2026-10-01, and so are other readers.

| Fact | Evidence |
|---|---|
| `metrics runs --since=2026-09-01` = 887, `--since=2026-10-01` = **0**; 1146 `result.json` on disk (1028 top-level, 118+ nested) | staged host binary; `find .fgos/assignments -name result.json -path '*/runs/*'` |
| Execution-core runs live at `assignments/unit-run-<id>/<role>/<round>/runs/<NN>/`; the assignment id contains `/` | `.fgos/assignments/unit-run-1791193921045-86133024/producer/1/runs/01` |
| **Seven** readers enumerate the assignments tree; six assume it is flat | Rust `lib.rs:336-361`; `show-run.mjs` `findRunDir`; `runtime-inspection.mjs:69-81` `allRuns`; `visibility-session.mjs:234` `findRunningRuns` (also reads `dispatch-runs`); `operation-choice.mjs:109`; `assignment.mjs:150`; doctor check `registrations.mjs:569` (hardcodes `runs/01`); and `unit-run-history.mjs`, the one that already knows the nested layout |
| `fgos dispatch show-run <nested runId>` says `no run` | verified live |
| `findRunningRuns` misses nested runs, so a crashed nested panelist stays `running` forever (live bug outside Observe) | `visibility-session.mjs:234` |
| The nested layout is partly specified: `docs/specs/runner.md:1427` and `:3077`; the read contract `run-result.read.v1.json` still encodes the flat path | grep |
| Reader written 2026-09-29 (`120af6b3d`); nested layout arrived 2026-10-01 (`073c8b6fc`), whose only reader change accepted RunResult v4 (record version moved, record location did not) | `git log` |
| The smoke test pins "at least 1028 runs, exactly 103 classified" from an audit snapshot, so it stays green while Observe is blind | `packages/run-result/rust/tests/smoke_real_store.rs` |
| The `metrics case` journal cannot carry evals or decisions: harness is one of `fgos/cook-plan/plain`, verdict one of `usable/fixed/discarded`, one open case per project, `list` accepts only `--open` | `case_journal.rs:248, 266-268, 330`; `case.rs:41-44` |

Root cause: a result's **location and record shape** are implicit contracts each consumer re-derives (same family as the 2026-10-04 finding about two places guessing the report file name differently).

## What is a run (single definition, used by every reader)

- Walk `.fgos/assignments`. A directory named `runs` marks its parent as an assignment directory; the assignment id is the parent's path relative to `.fgos/assignments` (may contain `/`). `assignment.json` is **not** required (role/adapter are then null).
- A run directory is `<assignmentDir>/runs/<NN>/`. The walk **stops at `runs/`**: nothing inside a run directory (outbox, worker output, fixtures) is ever walked, so a worker cannot plant a run.
- Symlinks are never followed (skipped and counted `symlink`); depth is capped.
- A run directory is **observed** when its `result.json` is parseable, has `runId` and a settled timestamp. Otherwise it is skipped with a counted reason: `unparseable`, `no-run-id`, `no-timestamp`, `symlink`, `duplicate-run-id`, `depth`. The inline unit result written by `fgos run record` (`run.mjs:566-579`: has `unitRunId`, no `runId`) is skipped as `inline-record` here and picked up as a seat by the unit summary in phase 4.
- Node and Rust implement this rule separately and are tied together by one shared fixture, `test/fixtures/run-layout/expected.json`, read by both test suites.

## Outcome

1. A nested run is findable by `show-run`, listed by inspection, seen by the reconciler's running-run check, and counted by Observe; the rule is written once and enforced by a shared fixture.
2. A host subcommand `metrics coverage` and a doctor check `observe-run-coverage` fail when runs on disk and runs seen diverge, and say "old host" instead of failing when the host predates the rule.
3. Discussion measurement on that base: writer-owned unit summaries, `metrics discussions`, a passive stance and agreement sensor, and an `evals` store for rubric-scored comparisons.

## Non-goals

- No second store or index for runs; the walk is the single path.
- No gating of discussion behavior (dissent quota, forced counter-argument); Observe only observes.
- No decision ledger in this plan (see open questions).
- No migration or rewrite of historical runs.
- Friction producers stay in plan 260930; this plan unblocks its numbers.

## Decisions (revised after red team; recommendation applied, confirm in validation)

| # | Decision | Applied | Alternative and cost |
|---|---|---|---|
| D1 | Enumeration | The walk above (stop at `runs/`, no symlinks, no `assignment.json` requirement) | Run index file: second authority, needs a writer hook and backfill |
| D2 | Stance transport | Optional `stance` in the worker claim, read by the source from the settled `result.json.agentClaim` (already validated and hashed); **never** rejects a claim; options declared per question at `workflow start` (`--stance-options a\|b\|c`) or unit param | `STANCE:` line in report (the porting-log design): no contract change, but parses prose from a path that varies per seat |
| D3 | Discussion read model | The execution core **writes** `unit-summary.json` per unit (using the semantics of `unit-run-history.mjs`), a one-shot script backfills history; Rust only reads that file | Rust joins workflow events and rebuilds attempt rules: two implementations of the same rules, and the join is incomplete (`unit.scheduled` has no `unitRunId`, crashed units emit no `unit.complete`) |
| D4 | Eval storage | New Observe store `.fgos/observe/evals/<writerId>.jsonl`, `metrics eval record|list` | Overload `metrics case`: closed harness/verdict lists and one open case per project make that unworkable |

## Phases

| # | Phase | Effort | Depends | Status |
|---|---|---|---|---|
| 1 | [Run definition, Node lister, and the seven readers](./phase-01-layout-contract-and-run-lister.md) | 1.5d | — | in-progress (original source guard unmet) |
| 2 | [Rust run scan, `metrics coverage`, hermetic invariant](./phase-02-rust-run-source-and-coverage-invariant.md) | 1.25d | 1 (rule + fixture) | completed |
| 3 | [Doctor coverage check and rebaseline](./phase-03-doctor-coverage-check-and-rebaseline.md) | 0.75d | 1, 2 | completed |
| 4 | [Unit summaries and `metrics discussions`](./phase-04-unit-summaries-and-discussions.md) | 1.5d | 2 | completed |
| 5 | [Stance and agreement sensor](./phase-05-stance-and-agreement-sensor.md) | 1.25d | 4 | completed |
| 6 | [Eval store and rubric](./phase-06-eval-store-and-rubric.md) | 1d | 3 | in-progress (fair-comparison proof reopened) |

Phases 1–3 shipped first as the foundation; the owner explicitly authorized all phases on 2026-10-05. Phases 4–6 now execute under that go decision. Golden fixtures under `test/fixtures/observe/` use the real regeneration command; the measurement regeneration produced no fixture diff. No staging/commit is performed without a request.

## Acceptance (whole plan)

- [x] `fgos dispatch show-run <nested run id>` resolves today's panelist run `run_unit-run-1791219961331-276f364c/panelist-1/1_01`.
- [x] `findRunningRuns` reports a nested run with `run.json` and no `result.json` (real-shape regression and foundation dry-run).
- [x] Live `metrics coverage` matches independent Node counts exactly: forgentX 1199, mdview 90; observed + skipped = runDirsSeen, recentRuns 0.
- [x] `metrics runs --by=role --since=2026-10-05` lists panelist-N/synthesizer; exact Delphi-window roles and 30 runs are recorded.
- [x] `observe-run-coverage` passes with rebuilt host, degrades/pass with old host, fails against hidden-run fixture (foundation evidence).
- [x] Four mdview Delphi workflows include refusal zero seats and two fallback seats; 30 attempts = 30 Dispatch runs, distinct from 28 final seats.
- [x] Live three-seat panel gives three valid votes and hand/native agreement 1; no-options is unmeasured and malformed stance preserves passing seat (behavioral CLI regression).
- [ ] Independent current setups reuse the complete 2026-10-04 objective and have an audited isolated Opus judgment. Old records list but were only data-blind, solo consumed panel results and the question differed; corrected provenance is not new comparison proof.
- [ ] Acceptance repairs: full final npm/Rust suites and live CLI evidence verified after consumer defects are fixed; original baseline was 6,750 pass, zero fail with serial full selection. Specs, CHANGELOG, manifest and doctor rows updated; No component-boundary change.

## How Rust changes are verified (important)

`fgos metrics ...` runs in the staged host under `~/.local/state/fgos/releases/<sha>/bin/fgos`, which does not change when the repo changes. Build with `cargo build -p fgos` and point `FGOS_HOST_BIN` at the result. The installed release keeps the old behavior until a release is cut. An old host is recognised **positively**: it has no `metrics coverage` (unknown subcommand, which `host-bin.mjs:94-104` reports) or the output lacks `layoutRule`.

## Cross-plan

- Blocks `260930-0335-measure-runresult-classification-impact` (pending): its "after" numbers come from the same `metrics runs`. Its `blockedBy` is set.
- `261005-1040-per-role-objective` and `261004-2110-panel-synthesizer-inputs` (completed) supply the role-task mechanism reused in phase 5.

## Red Team Review

### Session — 2026-10-05
Four Opus reviewers (security adversary, failure mode analyst, assumption destroyer, scope and complexity critic), reports under `plans/reports/red-team-*-261005-observe-run-visibility.md`. 39 findings collected, deduplicated to 15, all with file:line evidence; I spot-checked the case-journal rules, `findRunningRuns`, the `fgos run record` shape and the on-disk count myself. **Findings:** 15 (15 accepted, several with modification, 0 rejected). **Severity:** 5 Critical, 6 High, 4 Medium.

| # | Finding | Severity | Disposition | Applied to |
|---|---|---|---|---|
| 1 | Seven readers, not three; live `findRunningRuns` bug; guard test red on day one; behavior-changing consumers (reconcile, operation-choice) | Critical | Accept | Phase 1 |
| 2 | Three conflicting definitions of "a run"; `fgos run record` shape | Critical | Accept | plan.md, Phases 1, 2, 4 |
| 3 | Worker can forge runs (planted `assignment.json` in outbox); symlink rule absent | Critical | Accept | plan.md, Phases 1, 2 |
| 4 | Doctor cannot tell an old host from a broken one | Critical | Accept (positive detection via `metrics coverage`/`layoutRule`) | Phases 2, 3 |
| 5 | `metrics case` cannot host evals or decisions | Critical | Accept (D4 new store; ledger dropped) | Phase 6 |
| 6 | An invalid stance fails a seat; claim read from a path that varies | High | Accept (never refuse; read `agentClaim`) | Phase 5 |
| 7 | Stance options have no way in from yaml | High | Accept (`--stance-options`) | Phase 5 |
| 8 | Workflow join incomplete; rule duplication in Rust; boundary | High | Accept (D3 writer-owned summary) | Phase 4 |
| 9 | Live-store invariant test races and is gitignored in worktrees | High | Accept (hermetic test, live check only in doctor with tolerance) | Phases 2, 3 |
| 10 | Rust follows symlinks, Node does not | High | Accept | Phases 1, 2 |
| 11 | Direct path builders with `/` ids (`recover.mjs:228`, `operation-choice.mjs:701`, `worker-home.mjs:115`) | High | Accept (audit, fix if reproduced) | Phase 1 |
| 12 | `--by executor` cross-check cannot agree (seats vs attempts) | Medium | Accept | Phase 4 |
| 13 | Walk cost; "bound by window before reading JSON" impossible | Medium | Accept | Phase 2 |
| 14 | Wrong citations and "no spec" claim | Medium | Accept | plan.md, Phase 1 |
| 15 | Real-unit fixtures leak tokens; blind judge only a protocol; skip counts needed a trait change; shared golden regeneration | Medium | Accept | Phases 2, 4, 6 |

### Whole-Plan Consistency Sweep
Re-read `plan.md` and all six phase files after applying the findings; grepped for the retired terms (`listRuns`, `UnitRunSource`, `case close --score`, `decision ledger`, `three Delphi`, `17 files`, `no spec describes`, `walk is bounded by window`): none remain outside this table and the Problem table that cites them as corrected facts.

## Validation Log

### Session 1 — 2026-10-05
Verification pass skipped by rule: the red team already fact-checked every phase with file:line evidence (`## Red Team Review`). Interview, 3 questions; D3 and D4 were decided by the planner because one option clearly won on verified evidence (stated above), and the owner may overturn them.

| Question | Decision |
|---|---|
| Decision ledger inside this plan? | **Out of scope.** If needed later, build it on `docs/decisions` + `fgos decision-index`, not in Observe. |
| Stance transport (D2) | **Structured `stance` claim field + `--stance-options` on `workflow start`**, read from `result.json.agentClaim`; never refuses a seat. |
| Order | **Phases 1-3 first (about 3.5d). Phases 4-6 are re-decided after the foundation lands**, using the real numbers it produces. |

Propagation: phases 4-6 carry status `deferred-decision` in the table below; D2 text and Non-goals already match; no other phase text changes.

### Whole-Plan Consistency Sweep
Re-read `plan.md` and all six phases after this session. No unresolved contradictions: the ledger appears only as a non-goal and in this log; D2/D3/D4 wording is the same in `plan.md` and phases 4-6; efforts add to about 7d total, 3.5d for the foundation.

### Foundation execution — 2026-10-05

Phases 1–3 implementation was executed in parallel where independent, followed
by shared-fixture regression checks, rebuilt-host smoke in forgentX/mdview,
complete doctor invocations, a depth-mutation check, and independent review.
Evidence and actual metrics: [rebaseline](../reports/observe-rebaseline-261005.md).

The live count decrease exposed the timestamp-policy tradeoff. The owner stated
that backward compatibility is unnecessary and asked for the best policy:
retain result-owned `settledAt`/`timestamp`, never use assignment creation as a
fictional settlement time. Historical records without a result timestamp remain
visible as counted `no-timestamp` skips, and pre-fix snapshots are incomparable.
Current writers already emit settlement time; no history migration was applied.

Phase 2 criteria are checked. Phase 1's proposed permanent source-text guard is
not implemented because session test policy forbids source-text/wiring tests;
the inventory and behavioral tests supply its reachable evidence. The first
authoritative suite's watchdog failure was diagnosed with captured real-process
evidence: timeout publication raced process-tree kill and parent cleanup. After
publishing evidence before kill, the full rerun passed: 6,730 pass, zero fail,
eight skipped, 65 todo. Phase 3's suite gate is satisfied. Phases 4–6 remain
deferred by the validated gate and were not implemented.

### Measurement go — resumed execution

The owner explicitly requested “làm hết tất cả phase đi” after re-invoking
`ak:cook --auto --parallel`. This supersedes the phases 4–6 deferral gate:
implement unit summaries/discussions, passive stance/agreement and eval storage
with their live acceptance scenarios. No behavior gate or decision ledger is
added. The strict timestamp decision and completed foundation evidence remain.

### Measurement evidence

[`observe-discussion-measurement-261005.md`](../reports/observe-discussion-measurement-261005.md) records live backfill, four Delphi runs, stance panel, two current setups, blind Opus scores and actual eval shards. Both compared setups scored 7/10; no ranking/gate is inferred from one question. Integrated Rust 74 tests/build and focused Node 55 tests pass; independent writer/reader re-reviews approved all corrections. No component-boundary change, no history rewrite, no staging/commit.

Final full-suite verification passed with the unchanged test selection: `FGOS_HOST_BIN=target/debug/fgos npm test -- --test-concurrency=1`, 6,823 tests / 6,750 pass / zero fail / eight skip / 65 todo (artifact://270). The default parallel run had one existing live-Herdr attestation failure; the actual-gateway diagnostic and complete serial suite both passed, without narrowing/skipping or changing fail-closed/deadlines. [Diagnostic limits](../reports/observe-herdr-acceptance-diagnostic-261005.json) retain the default failure and label contention as an unproven hypothesis.

### Independent acceptance — reopened 2026-10-06

The three Opus acceptance reports returned **ACCEPT WITH FIXES**: passing tests did not prove every reachable measurement/lifecycle boundary. [Acceptance repair ledger](../reports/observe-acceptance-fixes-261006.md) tracks all findings, commits, exercised evidence and non-fixes. The original source-enumerator guard criterion is restored unchecked; the runtime test prohibition is not represented as a repository law or owner waiver.

The owner confirmed in the current conversation that the 2026-10-05 all-phase request was real. For timestamp policy the owner emphasized accuracy, stability, speed and simplicity, with no compatibility requirement; the repair chooses actual settlement fields only: result `settledAt`/`timestamp`, then sibling `run.json.settledAt`, never started/created time as completion. Implementation and final verification are pending.


## Open questions

- Measurement go resolved: the owner requested every phase; no further go/no-go is pending.
- Is the inline `fgos run record` result meant to be an Observe run? Applied: no (skipped as `inline-record`), but it becomes a seat in the unit summary.
- Reconciler policy confirmed by the phase 1 dry-run: the four nested producer runs without a result have the same authority as flat running runs. The main-checkout inspection moves from five to nine active run ids; the existing fail-closed cwd-lock guard must refuse mutation while any remain active. No automatic cleanup, retry, exemption or recovery was performed. Evidence: [layout inventory and dry-run](../reports/observe-run-layout-261005.md).
