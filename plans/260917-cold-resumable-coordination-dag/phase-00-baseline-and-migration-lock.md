# Phase 00 - Baseline And Migration Lock

## Goal

Create the reproducible baseline and write the exact schema/migration matrix
before changing persistence. This cell produces evidence and tests only; it
does not activate DAG mode.

## Scope

- Record current CoordinationSession schema versions, readers, writers, replay
  behavior, and all `show`/`chain` schema failure paths.
- Add focused characterization tests for legacy sequential sessions and current
  unknown/newer schema behavior.
- Record exact `npm test` baseline at the track base commit, including literal
  failing test names.
- Add a migration matrix covering old binary/new session, new binary/old
  session, new binary/new session, and a mixed-worktree append attempt.

## Non-goals

- Do not add a new schema version, event kind, request field, scheduler, or
  consumer behavior.

## Likely Files

- `src/runner/coordination/{schema,store,replay}.mjs`
- `src/verbs/coordination/{run,show,chain}.mjs`
- `test/runner/coordination-{schema,replay,store}.test.mjs`
- `test/verbs/coordination-{chain,run-driver-steps}.test.mjs`
- `docs/architect/agent-coordination/verification/cold-resumable-coordination-dag/p00.md`

## Verification

```sh
npm test -- test/runner/coordination-schema.test.mjs test/runner/coordination-replay.test.mjs test/runner/coordination-store.test.mjs test/verbs/coordination-chain.test.mjs test/verbs/coordination-run-driver-steps.test.mjs
npm test
```

## Exit Criteria

- Baseline record names exact known failures and base SHA.
- Characterization tests prove legacy requests remain sequential and schema
  errors fail closed rather than silently degrading.
- Migration matrix is cited by every later phase.
