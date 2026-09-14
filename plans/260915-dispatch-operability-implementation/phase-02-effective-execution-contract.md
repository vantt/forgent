# I02 - Effective Execution Contract

**Capability:** `code:implement`, `code:test`
**Status:** planned

## Goal

Persist a secret-free effective execution contract before launch, render the
same contract into the worker brief/prompt, and make it available to later
inspection.

## File Lease

Primary lease:

- `src/runner/dispatch/assignment-runner.mjs`
- `src/runner/dispatch/plan.mjs`
- `src/runner/dispatch/assignment-policy.mjs`
- `src/runner/dispatch/execution-contract.mjs`
- `src/runner/dispatch/assignment-normalizer.mjs`
- `test/runner/assignment-runresult.test.mjs`
- `test/runner/execution-contract.test.mjs`
- `test/runner/assignment-policy.test.mjs`

Expected new file:

- `src/runner/dispatch/effective-execution-contract.mjs`
- `test/runner/effective-execution-contract.test.mjs`

## Work

1. Build a pure projection from Assignment, DispatchPlan, resolved executor
   policy, cwd/main-checkout posture, timeout limits, confinement profile, and
   result-claim path.
2. Persist it under the run directory before worker launch, for example
   `effective-execution-contract.json`.
3. Include the same secret-free projection or a stable summary in the worker
   prompt/brief.
4. Ensure the projection is honest about requested vs enforced permissions.
   Do not label shell/tool restrictions as enforced unless confinement or the
   adapter actually enforces them.
5. Record digest/provenance links to `dispatch-plan.json` and resolved config.

## Acceptance

- The contract file exists before the executor is spawned.
- It contains no secrets and no raw env token values.
- It records assignment id, run id, mutation, cwd/write scope, main checkout,
  executor id, adapter family, limits, result claim path, and permission
  enforcement posture.
- The prompt/brief and persisted contract agree on claim path, mutation, and
  limits.
- If a production path drops a required field between DispatchPlan and adapter,
  a test fails.

## Required Tests

- `node --test test/runner/effective-execution-contract.test.mjs`
- `node --test test/runner/assignment-runresult.test.mjs`
- `node --test test/runner/execution-contract.test.mjs`

Add at least one production-door fixture using `executeAssignment`, not only a
pure projection test.
