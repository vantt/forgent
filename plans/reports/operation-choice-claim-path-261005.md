# operation-choice claim path

## Readers of the worker claim/report path

- `src/runner/dispatch/settlement.mjs` (claim + report): uses `resolveRunWorkerArtifactPath`. Correct.
- `src/runner/dispatch/worker-artifacts.mjs` `findWorkerClaim`: looks at `<runDir>/outbox` then flat. It does not look under `worker-output/outbox`. Not changed: it is a separate resolver for the interactive-worker layout and was outside the files allowed; noted below.
- `src/runner/dispatch/assignment.mjs`, `effective-execution-contract.mjs`: write side (prompt and contract default). Correct.
- `src/runner/dispatch/run-result.mjs` (lines ~509, 619, 1257): messages and a path filter only, no path built.
- `src/runner/operation-choice.mjs`: three hand-built flat paths. Defect.
  - claim-bytes binding re-read (`runs/<n>/agent-result.json`)
  - evidence-floor `workerArtifacts` entry for the claim
  - report text fallback `<runDir>/agent-report.md` (used when no settle report set is recorded)

## Fix

`operation-choice.mjs` now resolves all three through `resolveRunWorkerArtifactPath` (already re-exported by `assignment-runner.mjs`, which this module already imports, so no new import edge). Flat layout keeps working because the resolver falls back to it.

## Tests

`test/runner/operation-choice.test.mjs`: the stored-result seed helper takes `claimInConfinedOutbox`.
- claim only under `worker-output/outbox` is consumable cross-pass (fails before the fix, passes after)
- same layout with the claim bytes edited after settle is still refused
- the existing flat-layout tests still pass

Run: operation-choice, effective-execution-contract, dispatch-reconciliation-import-graph, architecture suites: 203 pass.

## Concern

`findWorkerClaim` in `worker-artifacts.mjs` (used by reconciliation) still ignores `worker-output/outbox`; a crashed confined run that wrote its claim there would reconcile as if no claim existed. It is a different resolver and outside the files I may touch, so left for a follow-up.
