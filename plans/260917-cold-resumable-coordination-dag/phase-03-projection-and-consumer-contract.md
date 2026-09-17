# Phase 03 - Projection And Consumer Contract

## Goal

Make DAG declaration and derived outcome facts cold-readable and unambiguous to
CLI, headless, `show`, `chain`, plan-loop, and code-panel consumers.

## Scope

- Define distinct names/fields for `sessionStatus`, `sessionPhase`,
  `schedulerOutcome`, and `runResultStatus`; preserve legacy fields with
  explicit compatibility semantics.
- Extend `show` and `chain` with DAG node identity/label, dependency state,
  outcome, blocked-by provenance, resume/continuation action, and schema mode.
- Render `legacy-non-dag` and `unsupported-newer-schema` explicitly; neither
  appears as a normal resumable DAG active cell.
- Define overlap metadata as a group with canonical cwd and affected peer node
  ids, not a lone boolean caveat.
- Update headless result projection without introducing a second engine door.

## Verification

```sh
npm test -- test/verbs/coordination-chain.test.mjs test/cli/coordination.test.mjs test/runner/coordination-headless-adapter-identity.test.mjs test/verbs/coordination-run-driver-steps.test.mjs
npm test
```

## Exit Criteria

- Fresh `show`/`chain` can reconstruct an interrupted DAG declaration and its
  derived pending/blocked/deferred facts.
- A consumer can never confuse a failed RunResult with scheduler `blocked` or
  a terminal session status.
