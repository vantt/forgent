# Phase 3: Recover settles a dead writer's pending chains

Capability: `code:implement`. Source row: p-o4juyw2ntg.

## Inputs

- `plan.md` of this directory.
- `packages/git/rust/src/incidents.rs`: `recover_git_operations`, `free_retained_land`, `kept_text`,
  `AUTHORITY_MISMATCH_CAUSES`.
- `packages/git/rust/src/recovery.rs`: `reconcile_operation` and the per-kind recoveries it calls.
- `packages/git/rust/src/land.rs`: `recover_land`, the main-checkout catch-up recovery (`ref-authority-mismatch`
  near line 1536), `release_dead_writer_land`, the prepare loop that refuses `land-abandoned-writer-mismatch`.
- `packages/git/rust/src/refs.rs` (`ref-authority-mismatch` near line 1218), `packages/git/rust/src/scoped_commit.rs`
  (`commit-authority-mismatch`).
- `packages/git/rust/src/wal.rs` (read only): `Intent` and phase records use `deny_unknown_fields`.
- `packages/git/rust/tests/incidents.rs` and `packages/git/rust/tests/land_push_catch_up.rs::recover` for fixtures.

## Footprint

- `packages/git/rust/src/incidents.rs`, `recovery.rs`, `land.rs`, `refs.rs`, `scoped_commit.rs`
- `packages/git/rust/tests/incidents.rs`

## Steps

1. In `recover_git_operations`, for each pending recoverable chain whose writer is not the caller: if
   `writer_is_dead(chain writer)` holds, reconcile it with the chain's writer as the authority and the caller
   as the recorder; otherwise keep it as today. A chain of the caller's own writer is unchanged.
2. Thread the recorder through `reconcile_operation` so each kind's writer check accepts "chain writer, proven
   dead, recovered by X" and nothing weaker. Change the signature once and move every caller (L10); do not add
   a second entry point.
3. Record who recovered: the settling record carries the recoverer. Before choosing the field, check how old
   readers treat it under `deny_unknown_fields`; if adding a field would break a reader of an older release,
   record the recoverer in the outcome's existing free-text/diagnostic slot instead, and say which in the commit.
   Do not edit `packages/git/contracts/mutation-census.v1.json` (running plan 261122-2108 holds it); if a
   census change turns out to be required, stop `BLOCKED` and name it.
4. `free_retained_land` already frees a dead writer's finished Land: leave it; it now also frees pid writers
   through phase 2's proof.
5. `kept_text`: for an authority-mismatch kept chain, say "writer <w> is alive or not provably dead; once it is
   gone, `fgos git recover` settles it", and drop "only its writer can recover it".
6. Tests in `packages/git/rust/tests/incidents.rs` with an injected `writer_is_dead`:
   - a pending Land (pre-attempt), a ScopedCommit, and a main-checkout catch-up chain of a dead writer are
     recovered by another writer, and the record names the recoverer;
   - a land refused `land-abandoned-writer-mismatch` succeeds after that recover;
   - a live writer's chain is kept with the new text.

## Verify

```bash
cargo test -p fgos-git --test incidents
cargo test -p fgos-git --lib incidents
cargo test -p fgos-git --test recovery_matrix
```

Pass: all green, new cases present.

## Rollback

`git revert` the phase commit. If a recoverer field was added to the journal, the revert is safe only before any
release that writes it is activated; otherwise keep the reader change and revert the writer.
