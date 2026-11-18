# Phase 02: StoreError leaf moves to T0

Wave 2. Depends on 1. Capability `code:implement`. Effort 0.25d. Removes exception E1 (phase 01 F1).

## Context

`StoreError` already lives in an import-free leaf, `src/state/store-error.mjs`, but its directory is tier 7, so
`src/runner/worktree.mjs` (T2) still imports upward, and the A4 guard needs an allowlist entry for it. A second copy
of the same class sits in `src/runner/dispatch/cli.mjs:10`.

## Requirements

- `git mv src/state/store-error.mjs src/util/store-error.mjs` (tier 0 by directory; content unchanged except the
  header path).
- Every importer moves to the new path in the same commit, no re-export left at the old path: `src/state/store.mjs`
  (import line; its public re-export of `StoreError`/`categoryOf` for Work callers stays as is), `bin/fgos.mjs`,
  `src/runner/main-checkout-reset-guard.mjs`, `test/cli/exit-code-table.test.mjs`,
  `test/observe/invocation-fault-log.test.mjs`, `test/architecture.test.mjs:1658` (`ENTRY_LEAF_IMPORTS` names the path `../src/state/store-error.mjs`; required edit).
- `src/runner/worktree.mjs` imports `StoreError` from `../util/store-error.mjs`, not from `../state/store.mjs`.
- `src/runner/dispatch/cli.mjs` deletes its local `class StoreError` and imports the leaf (A4 allows `src/util`).
- Manifest: delete the `tierExceptions` row `worktree.mjs -> store.mjs`, and rename the `files` layer-map key
  `src/state/store-error.mjs` to `src/util/store-error.mjs` (layer stays `kernel`).
- Regenerate the Git mutation census (`node scripts/git-one-door-scan.mjs --write-census`) and commit it with the
  phase (plan section "Generated files").
- `test/architecture.test.mjs`: delete the `WORK_LAYER_EDGE_ALLOWLIST` entry. The constant is then empty; delete it,
  its `continue` check and the "each allowed edge still exists" loop (`:913-917`, `:934`, `:978-985`), since the
  mechanism has no member left (retiring code of a removed mechanism, design principle 8). The A4 tests themselves
  stay and keep their titles.

## Proof

Owning proof: the tier rule test and the A4 guard tests in `test/architecture.test.mjs`. No new test: the behaviour
"T2 imports nothing above T2" is owned by the tier rule; the class's behaviour by `test/cli/exit-code-table.test.mjs`.

## Validation

- `node --test test/architecture.test.mjs test/cli/exit-code-table.test.mjs test/observe/invocation-fault-log.test.mjs`
  through the repo test runner.
- `git grep -n "state/store-error" -- src bin test scripts` is empty; `git grep -n "class StoreError" -- src` lists
  only `src/util/store-error.mjs`.
- `git diff --stat` shows no unexpected deletion.

## Risk and rollback

Low: a move plus import edits. Rollback: revert the commit.
