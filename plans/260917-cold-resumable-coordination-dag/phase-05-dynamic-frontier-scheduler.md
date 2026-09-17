# Phase 05 - Dynamic Frontier Scheduler

## Goal

Dispatch a declared, cold-resumable read-only DAG through existing individual
operation/ledger doors with a dynamic frontier and no new execution path.

## Scope

- Add a scheduler compiler/executor at the coordination request boundary.
- Admit ready individual nodes while respecting derived dependencies and the
  existing session cap; use `Promise.race`/settlement-driven frontier updates,
  not static waves or polling.
- Produce immutable request-order response entries with scheduler outcomes
  `settled | refused | blocked | deferred`, original error evidence, resumed
  facts, and overlap groups.
- Continue independent siblings after allowed refusal; block only descendants.
- Do not close on deferred/refused/blocked nodes; respect cancellation,
  terminal transitions, retry/replacement races, and integrity throw rules.
- Keep non-DAG requests on the exact legacy sequential interpreter.

## Verification

```sh
npm test -- test/verbs/coordination-run-driver-steps.test.mjs test/runner/coordination-recovery-and-quorum.test.mjs test/runner/coordination-r5-hard-budgets.test.mjs test/runner/coordination-driver-authorization.test.mjs test/runner/coordination-r7-work-isolation.test.mjs
npm test
```

## Exit Criteria

- Barrier-clock proof demonstrates `produce -> {review, red-team}` overlap.
- Diamond, cancellation, retry/replacement, partial-policy, no-progress, and
  integrity-after-sibling-settlement cases preserve contracts.
- DAG operations never bypass Assignment/Run/RunResult or legacy executor
  policy/evidence doors.
