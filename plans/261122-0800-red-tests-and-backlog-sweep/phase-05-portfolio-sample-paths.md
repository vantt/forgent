# Phase 5: Remaining portfolio sample paths

Capability: `code:implement`.

## Inputs

- On base `645d43a6a`, `rg -n 'docs/backlog\.md|docs/discussions' --glob '!plans/**' --glob '!archive/**' --glob '!CHANGELOG.md'`.
- The kept-or-move rule. A reference that names the legacy layout on purpose stays. That covers the migrate verb
  `apps/fgos/src/wiring/migrate.rs`, the pre-migration reader `packages/supervision/rust/src/discussion_source.rs`
  and its test, the `doc-backlog-1` rule for the pointer file `docs/backlog.md` that still exists, recorded corpora
  under `packages/execution/contracts/corpus/` and `run-result/readers.json`, and verification proofs under
  `docs/**/verification/`. A reference that uses the old path as the live backlog location moves.

## Footprint

`test/scripts/check-decision-citation-drift.test.mjs`, `packages/durable-file/rust/tests/dir_replace.rs`,
`apps/fgos/tests/session_write_publish.rs`,
`plans/261122-0800-red-tests-and-backlog-sweep/reports/kept-legacy-references.md`.

## Steps

1. In the three files, apply the rule. `session_write_publish.rs` writes the backlog through `session write`, so
   it moves to `plans/backlog.md` (keep `plans/backlog/*` in its grant). `dir_replace.rs` uses the path as a sample
   file and moves for consistency. In `check-decision-citation-drift.test.mjs`, read what the drift checker scans.
   If it still scans `docs/backlog.md`, the fixture keeps it and the report says why.
2. Write `reports/kept-legacy-references.md`: one row per file still matched by the `rg` above, each with "kept:
   <reason>" or "handed to <plan>" (copy the rows of plan.md "Handed to other plans").

## Verify

`node scripts/run-tests.mjs test/scripts/check-decision-citation-drift.test.mjs`, `cargo test -p fgos-durable-file`
and `cargo test -p fgos --test session_write_publish` pass. The `rg` output matches the report row for row.

## Rollback

Revert the phase commit.
