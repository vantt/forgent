# Phase 11 — Driving measures as definitions

The measures are the driving layer's own definitions (OM-D5). Observe gets no code change.

## Inputs
- Prototype spec §13.3 (the seven measures): `origin/plan-supervisor-prototype:plans/reports/spec-261116-1042-plan-supervisor.md`.
- How the prototype computed them: `origin/plan-supervisor-prototype:tools/plan-supervisor/scripts/plan-board.mjs:431-525`.
- Trial values to sanity-check against:
  `plans/261117-1430-portfolio-driving-draft/reports/trial-261117-1705-solo-driving-trial.md` § Measures.
- OM-D6 (which measures have sources) and OM-D11 (question events come later).
- Phases 4, 6 and 8.

## Footprint
`domains/coding/observe/**`, `test/fixtures/observe/driving/**`, `packages/observe/rust/tests/driving_definitions.rs`.

## Steps
1. Write definitions under `domains/coding/observe/definitions/`:
   - `plan-lead-time`: from `ready` to `done`, read from `fgos.plan.status`.
   - `phase-time`: the span sum of `fgos.run.attempt`, grouped by the `phase` ref.
   - `plan-tokens`: token sums by plan, provider, account and model.
   - `plan-failure-rate`: `fgos.outcome` by provider, account and model.
   - `m1-completion`: from `fgos.plan.status`, plus case milestones when they exist.
   - `m2-lead-time-split`:
     - worker time is the union of passing attempts;
     - failed runs are the non-pass attempts;
     - re-check is from the producer end to the verify end;
     - owner wait is `unmeasured: question events not produced yet`.
   - `m3-interventions`: `unmeasured`, for the same reason.
   - `m7-first-pass`: the verify outcome of the first round per phase.
   - `m4-scope-fidelity`, `m5-plan-defects` and `m6-detection-latency`: each `unmeasured`, with a named reason pointing
     at its backlog row (phase 12).
2. Fixture: a plan with three phases, runs, verify records and a status history. Each definition gives the expected
   numbers.

## Verify
`cargo test -p fgos-observe --test driving_definitions` is green. Live:
`npm run fgos:dev -- metrics query --def domains/coding/observe/definitions/plan-lead-time.query.json --dir /home/vantt/projects/forgent`.

## Rollback
Revert the phase commit.
