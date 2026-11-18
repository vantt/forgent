# Phase 15 — Driving measures as definitions

The driving measures are the driving layer's own definitions (OM-D5). Observe gets no code change. The proof lives in
the composition root, because only there are the run and plan sources wired. The Observe crate boundary
(`boundary_test.rs`) stays intact.

## Inputs
- Prototype spec §13.3: `origin/plan-supervisor-prototype:plans/reports/spec-261116-1042-plan-supervisor.md`.
- The prototype's computation: `origin/plan-supervisor-prototype:tools/plan-supervisor/scripts/plan-board.mjs:431-525`.
- Trial values to compare against: `plans/261117-1430-portfolio-driving-draft/reports/trial-261117-1705-solo-driving-trial.md`
  § Measures.
- OM-D6 (which measures have sources), OM-D13/OM-D14 (question events come from the question component).
- Phases 7, 8 and 11.

## Footprint
`domains/coding/observe/**`, `apps/fgos/tests/driving_definitions.rs`, `test/fixtures/observe/driving/**`.

## Steps
1. Add definitions under `domains/coding/observe/definitions/`:
   - `plan-lead-time`: from `ready` to `done`, read from `fgos.plan.status`.
   - `phase-time`: the span sum of `fgos.run.attempt`, by phase ref.
   - `plan-tokens`: by plan, provider, account and model.
   - `plan-failure-rate`.
   - `m1-completion`: from `fgos.plan.status`.
   - `m2-lead-time-split`:
     - worker time is the union of passing attempts;
     - failed runs are the non-pass attempts;
     - re-check is from the producer end to the `fgos.unit.verify` end;
     - owner wait `requires: [fgos.question.asked, fgos.question.answered]`, so it reports `unmeasured` until the
       question component declares and emits those kinds.
   - `m3-interventions`: requires the question kinds, in the same way.
   - `m7-first-pass`: the `fgos.unit.verify` outcome of round 1 per phase.
   - `m4-scope-fidelity`, `m5-plan-defects`, `m6-detection-latency`: `requires` kinds that are not declared yet, so
     they report `unmeasured`. Each reason names its backlog row, opened in phase 16.
2. Fixture: a plan with three phases, its runs, verify records and status history. Every definition gives the expected
   numbers or `unmeasured`.

## Verify
- `cargo test -p fgos --test driving_definitions` passes.
- Live: `npm run fgos:dev -- metrics query --def domains/coding/observe/definitions --dir /home/vantt/projects/forgent`.

## Rollback
Revert the phase commit.
