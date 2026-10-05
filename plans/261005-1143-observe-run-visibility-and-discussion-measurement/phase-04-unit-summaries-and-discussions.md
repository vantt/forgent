---
phase: 4
title: "Unit summaries and metrics discussions"
status: pending
priority: P2
effort: "1.5d"
dependencies: [2]
---

# Phase 4: Unit summaries and `metrics discussions`

## Overview

Observe knows runs but not discussions. The execution core, which owns unit semantics, writes a `unit-summary.json` per unit; a one-shot script backfills history; Observe reads only that file and shows per-workflow and per-seat reliability in `metrics discussions`. No workflow-event join and no second copy of the attempt rules in Rust (D3).

## Requirements

- Functional: `unit-summary.json` in each unit directory: `{ contract, unitRunId, workflow: {runId, stepId, unitId} | null, pattern, capability, outcome, startedAt, settledAt, seats: [{ role, final, attempts: [{ assignmentId, runId, executor, provider, persona, model, outcome, fallbackFrom }] }], inline }`; `final` is the winning attempt by the rules already in `unit-run-history.mjs` (latest fallback wins, outcome mapping).
- Functional: written when a unit ends, including when it throws or is refused (policy refusal gives zero seats), so crashed units are not orphaned.
- Functional: the workflow runner passes `{runId, stepId, unitId}` into the unit at creation (recorded in `unit.json`), so the link is written by its owner, not reconstructed from events (`unit.scheduled` carries no `unitRunId`, crashed units emit no `unit.complete`: `src/workflow/runner.mjs:377-408`).
- Functional: `metrics discussions [--since] [--by workflow|executor|persona]`: unit runs, pass rate, seats failed, fallback rate, median duration, and `attempts` (all attempts) next to `seats` (final attempts).
- Functional: the inline unit result (`fgos run record`, no `runId`) appears as a seat with `inline: true`.
- Non-functional: read-only on the Observe side; backfill idempotent and safe to rerun.

## Architecture

Writer side (Node): a small function next to `unit-run-history.mjs` builds the summary from the unit directory using that module's rules; the execution core calls it at unit end; `scripts/backfill-unit-summaries.mjs` calls the same function over existing `unit-run-*` directories (a script, not a new verb, until a second use appears). Reader side (Rust): `UnitSummarySource` in the `run-result` crate reads `unit-summary.json` against a read contract `packages/run-result/contracts/unit-summary.read.v1.json`, emits observations `source: "unit-summary"`, kind `unit.settled`, subject kind `run` with id `unit-run:<id>` (the subject enum is closed, so the prefix keeps unit ids distinct from run ids; documented in the observation notes); wired in `apps/fgos/src/wiring/metrics_sources.rs`. Boundary: reading a documented file the owner writes is not owning workflow state; check `docs/platform/component-boundary.md` §3 and record "No component-boundary change" or update.

## Related Code Files

- Create: `src/runner/execution/unit-summary.mjs` (+ test), `scripts/backfill-unit-summaries.mjs`, `packages/run-result/rust/src/unit_summary.rs`, `packages/run-result/contracts/unit-summary.read.v1.json`, `packages/observe/rust/src/metrics_cli/discussions.rs`.
- Modify: `src/runner/execution/run.mjs` (unit end; around :524 and the record path :566-579), `src/workflow/runner.mjs` (pass workflow link into the unit, :377-408), `apps/fgos/src/wiring/metrics_sources.rs`, `packages/observe/rust/src/metrics_cli/mod.rs`, `src/cli/command-registry.mjs`, `docs/specs/observe.md`, `docs/specs/runner.md`, `docs/architecture-manifest.json`, `CHANGELOG.md`.
- Check: `src/runner/execution/unit-run-history.mjs` (reuse, do not duplicate).

## Implementation Steps

1. Prior-art: read `unit-run-history.mjs` fully; list the rules to reuse; read real `unit.json` and `unit-run-*` trees in mdview for the shapes (not from memory).
2. Writer function and tests: complete unit, fallback seat, failed seat, policy refusal (zero seats), unit with no workflow, inline record.
3. Hook it at unit end (all exits) and make the workflow runner pass its link.
4. Backfill script with dry-run; run it on mdview and this repo; spot-check three summaries by hand against the directories.
5. Rust source, read contract, `metrics discussions`; hermetic fixtures with **synthetic** units (no real `controlToken`, `protected/`, provider logs, absolute home paths or private discussion text; a test scans fixture files for those markers).
6. Live: from mdview, `metrics discussions --since=2026-10-05` lists the four Delphi runs of that day, including the policy-refusal run (zero seats) and a run with a fallback chain; `attempts` total equals `metrics runs` total for those units.
7. Spec, CHANGELOG, manifest, boundary note.

## Success Criteria

- [ ] After backfill, mdview's four 2026-10-05 Delphi runs appear with seats, executors, fallbacks and outcome.
- [ ] Cross-check: unit-run `attempts` equals the unit-run share of `metrics runs` (not `seats`).
- [ ] A unit that throws still gets a summary.
- [ ] No second implementation of the attempt rules exists in Rust.

## Risk Assessment

- Summary drift from the unit directory: summary is derived, never authoritative; backfill can regenerate; a doctor-style check is not added until drift is seen.
- Unit end has several exits (success, refusal, throw, resume): test each, a missed exit is the main defect class here.
- Signal it broke: unit directories without a summary after phase completion; response: the writer hook, not the reader.
