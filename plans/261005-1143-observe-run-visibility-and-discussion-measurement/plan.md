---
title: "Observe sees every run, and measures discussions"
description: "One run definition and one lister per language for .fgos/assignments (nested unit-run ids), so Observe, show-run, inspection and the reconciler stop missing discussion runs; then the measurement discussion power needs: coverage subcommand, writer-owned unit summaries, stance/agreement sensor, eval store."
status: pending
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
| 1 | [Run definition, Node lister, and the seven readers](./phase-01-layout-contract-and-run-lister.md) | 1.5d | — | pending |
| 2 | [Rust run scan, `metrics coverage`, hermetic invariant](./phase-02-rust-run-source-and-coverage-invariant.md) | 1.25d | 1 (rule + fixture) | pending |
| 3 | [Doctor coverage check and rebaseline](./phase-03-doctor-coverage-check-and-rebaseline.md) | 0.75d | 1, 2 | pending |
| 4 | [Unit summaries and `metrics discussions`](./phase-04-unit-summaries-and-discussions.md) | 1.5d | 2 | deferred-decision |
| 5 | [Stance and agreement sensor](./phase-05-stance-and-agreement-sensor.md) | 1.25d | 4 | deferred-decision |
| 6 | [Eval store and rubric](./phase-06-eval-store-and-rubric.md) | 1d | 3 | deferred-decision |

Phases 1-3 are the foundation and ship first (they fix live defects). 4-6 only add measurement; per the validation session they are re-decided after the foundation lands. Golden fixtures under `test/fixtures/observe/` are regenerated in phases 2, 4, 5 and 6: do it one phase at a time, with the suite's real invocation, reading `git diff --stat` before staging.

## Acceptance (whole plan)

- [ ] `fgos dispatch show-run <nested run id>` resolves a run from today's discussion runs.
- [ ] `findRunningRuns` reports a nested run that has `run.json` and no `result.json` (test with the real shape).
- [ ] `metrics coverage` on this repo and on `/home/vantt/projects/mdview`: `runDirsSeen` equals the independent Node count (excluding runs changed in the last 60 s); `observed + skipped = runDirsSeen`.
- [ ] `metrics runs --by=role --since=2026-10-05` lists `panelist-N` and `synthesizer`.
- [ ] `fgos doctor` has `observe-run-coverage`: passes with a fixed host, reports degraded (passed) with the old staged host, fails against a fixture that hides a run.
- [ ] After backfill, `metrics discussions --since=2026-10-05` run from mdview lists the four Delphi runs of that day, including the policy-refusal run (zero seats) and a run with a fallback chain, and attempts total matches `metrics runs` for those runs.
- [ ] One live panel with `--stance-options` yields a stance per seat and a correct agreement ratio; a unit without options reads `unmeasured`; a malformed stance never fails a seat.
- [ ] Two eval records (two setups, same question, blind Opus judge) listable with `metrics eval list`.
- [ ] Full `npm test` and Rust `observe` + `run-result` suites green; spec, CHANGELOG, architecture manifest, doctor spec rows, command registry updated; `docs/platform/component-boundary.md` checked (note "No component-boundary change" or update).

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

## Open questions

- None blocking phases 1-3. Phases 4-6 need a go/no-go after phase 3, including whether the numbers from phase 3 change what discussion measurement is worth building.
- Is the inline `fgos run record` result meant to be an Observe run? Applied: no (skipped as `inline-record`), but it becomes a seat in the unit summary.
- Reconciler policy for the 4 nested orphans (run.json without result.json) once they become visible: confirm in phase 1 from the dry-run listing, not assumed.
