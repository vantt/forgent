# Phase 01 - DAG Session Declaration And Replay

## Goal

Introduce the schema-versioned, immutable declaration needed for a DAG session
to survive a fresh process without creating persisted node lifecycle state.

## Scope

- Define a versioned DAG declaration event/record with request fingerprint,
  node identity, display label, normalized step semantics, dependencies, and
  continuation policy.
- Write it atomically before first DAG node materialization.
- Extend replay to derive declared/pending/materialized/settled/refused/blocked
  facts only from declaration plus existing Assignment/Run/session evidence.
- Enforce migration behavior: new binary reads legacy sessions as non-DAG;
  old binary fails schema-new sessions clearly; no inferred backfill.
- Reject incompatible binary/worktree append before state mutation.

## Non-goals

- Do not schedule nodes, add request syntax, or change `show`/`chain` output
  beyond internal replay support.

## Verification

```sh
npm test -- test/runner/coordination-schema.test.mjs test/runner/coordination-store.test.mjs test/runner/coordination-replay.test.mjs
npm test
```

## Exit Criteria

- Declaration is immutable, hash/fingerprint verified on replay, and written
  before any Assignment event.
- Schema-new/old compatibility matrix from Phase 00 passes.
- Crash between declaration and first Assignment reconstructs pending nodes
  without inventing a task status.
