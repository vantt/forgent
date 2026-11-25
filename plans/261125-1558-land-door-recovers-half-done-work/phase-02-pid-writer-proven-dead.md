# Phase 2: A bare pid writer is proven dead from OS state

Capability: `code:implement`. Source row: p-o4juyw2ntg.

## Inputs

- `plan.md` of this directory.
- `packages/identity/rust/src/directory.rs`: `session_proven_dead` (line ~626) and `scan`.
- `packages/identity/rust/src/resolve.rs` (read only): `WriterId::Pid` is written as the decimal pid.
- `packages/process/rust/src/facts.rs` (read only): `judge` — absent or zombie is `Dead`; live without a recorded
  start time is `Unknown`.
- Callers (read only, unchanged signature): `apps/fgos/src/wiring/git_incidents.rs::writer_is_dead`,
  `packages/git/node-addon/src/git.rs`.

## Footprint

- `packages/identity/rust/src/directory.rs`
- `packages/identity/rust/tests/directory.rs`

## Steps

1. Extend `session_proven_dead`: when no directory row carries `id` and `id` is a bare decimal pid (the
   `WriterId::Pid` form, nothing else), judge `Record { pid, ..default }` with the given `judge`; proven dead
   only on `Verdict::Dead`. A row that exists keeps today's rule; a session-shaped id with no row stays not proven.
2. Keep the signature, so both callers get the proof with no change.
3. Update the function's doc comment: what counts as proof for each writer shape.
4. Extend the existing `session_proven_dead` test in `packages/identity/rust/tests/directory.rs` (line ~1901)
   with an injected judge: absent pid proven dead; live pid not proven; `"0"`, `"12ab"`, and a session id with
   no row not proven.

## Verify

```bash
cargo test -p fgos-identity --test directory
```

Pass: green, new cases present.

## Rollback

`git revert` the phase commit.
