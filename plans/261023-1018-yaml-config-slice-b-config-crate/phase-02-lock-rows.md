# Phase 02: Lock rows `project-config` and `global-config`

Depends on 00 (the D4 trace). Runs in parallel with 03-08. Suggested executor: haiku for the edits, sonnet for the pin test. Shared file: the board lists `packages/holder-lock/contracts/lock-registry*.json` as shared with HARDEN T1 and DOC (D8: DOC adds an owner value and a row), so merge `origin/main` first and post the log line first.

## Context

Spec section 6 step 1: two new rows, `project-config` (scope repo) and `global-config` (scope machine, covering the global, accounts and token files), ranks set relative to `git` and `event-store`. The `repo-config` row is Git's (rank 80, owner `git`) and is not borrowed. D4 settles rank 80: held rank `>=` acquired is refused (`packages/holder-lock/rust/src/scope.rs:95-103`), so a config write may sit inside `main-checkout` (50), `event-seal` (58), `state` (60), `event-append` (70) and takes nothing under it; one transaction touches one source, so the two never nest.

## Files it may touch

- `packages/holder-lock/contracts/lock-registry.v1.json`: two rows, no new `ranks` entry (unless the phase-00 trace picked rank 85).
  - `project-config`: kind `mutex`, scope `repo`, rank 80, `v3Path` `<fgosDir>/locks/project-config.lock`, owner `config`, note "new lock, no v1 predecessor; serializes writes to `.fgos/config.yaml`".
  - `global-config`: kind `mutex`, scope `machine`, rank 80, `v3Path` `<lockRoot>/global-config.lock`, owner `config`, note names the three files it covers (global, accounts, token).
- `packages/holder-lock/contracts/lock-registry.schema.v1.json`: add `config` to the `owner` enum (one value). If DOC's change landed first, rebase onto theirs; both values coexist.
- `packages/config/rust/src/locks.rs`: constants `PROJECT_CONFIG`, `GLOBAL_CONFIG` (names), `RANK` (80) and a helper `scope_params(fgos_dir, lock_root)` returning the `BTreeMap` that `LockScope::acquire` wants. No acquire logic here (phase 10).
- `packages/config/rust/tests/lock_rows.rs`.
- `docs/platform/holder-lock/spec.md`: add `project-config` and `global-config` to the rank-80 leaves line (`:159`) and one dated line in "Lịch sử quyết định" (stating they are leaves and never nest).

## Steps

1. Re-read the registry and schema on `origin/main`; apply the two rows and the enum value.
2. `lock_rows.rs`, modelled on `packages/event-store/rust/tests/registry_rows.rs`: for each name, the row exists with the kind, scope, rank, owner and `v3Path` template the crate's constants say, and the rank's `ranks` entry lists the kind (`mutex`). This is the Rust pin: a registry edit that disagrees with the crate fails here.
3. `rank("project-config")` and `rank("global-config")` resolve through `fgos_holder_lock::scope::rank` (the registry loader), and a `LockScope` seeded with `main-checkout` can `assert_can_acquire` both while one seeded with `install` (rank 80) cannot: a two-line test pinning D4's reasoning rather than a comment.
4. Run the existing Node registry contract test (`node --test test/holder-lock/registry-contract.test.mjs`): it validates every row against the schema, so the new owner value and rows are covered by the existing proof; do not add a Node duplicate (design principle 8). `rg -n "owner" test/holder-lock/registry-contract.test.mjs` first: if a test enumerates owners by hand, extend that one assertion.
5. `docs/platform/holder-lock/spec.md` edits, then re-check the table line numbers.

## Owning proofs

| Behaviour | Proof |
|---|---|
| Registry rows have the shape the crate names | `tests/lock_rows.rs` (Rust owns names, ranks, paths) |
| Registry is valid against its schema, including the new owner | existing `test/holder-lock/registry-contract.test.mjs` (Node, unchanged) |
| Config lock may nest inside git/event locks, not inside another leaf | `tests/lock_rows.rs` rank-order case |

## Validation

`cargo test -p fgos-config --test lock_rows --jobs 4`; `cargo test -p fgos-holder-lock --jobs 4` (the registry is embedded with `include_str!`); `node --test test/holder-lock/registry-contract.test.mjs` run alone (never beside cargo).

## Risk

| Risk | L x I | Mitigation |
|---|---|---|
| Collision with HARDEN T1 / DOC edits to the same registry | M x M | log line first, merge before edit, two-row diff, rebase on conflict |
| A registry row without a `LOCK_FILES` entry in `src/setup/holder-lock-checks.mjs` makes doctor miss it | L x L | that file is Node and shared with HARDEN T1; the scan is optional per row (`cutOverLockFiles` filters on presence, `test/setup/holder-lock-checks.test.mjs:236`); listed as a Slice C follow-up |
| Rank 80 later needs to nest under another leaf | L x M | phase 00 trace; if it ever does, rank 85 is one `ranks` row and two `rank` values |

## Rollback

Revert the commit: registry, schema, `locks.rs`, the test and the two doc lines go together.
