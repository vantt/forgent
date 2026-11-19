# Phase 3: Coordination evidence kinds and the Observe prune door

## Inputs
`packages/observe/rust/src/record/` (`RecordDoor`, registry, declaration merge); `packages/supervision/rust/observe-kinds.json`;
`docs/platform/observe/spec.md` (record contract, shards, observe lock); decision SP-D7 (State vs Log; prune when the
finding it supports is settled, at most 30 days).

## Files it may write
`packages/observe/rust/**`, `packages/supervision/rust/observe-kinds.json`.

## Steps
1. Register `fgos.coordination.act` in `observe-kinds.json` with attributes `fgos.coordination.act` (handoff, chore, wake,
   ask, replace, tune, type, read), `fgos.coordination.from` and `fgos.coordination.to` (persona), `fgos.coordination.outcome`,
   subjects `session` and `event`, and a declaration field marking it prunable with `retention: 30d`.
2. Add a prune use case in `packages/observe/rust/src/record/store/` that works under the observe lock, per shard: a
   record is removable when its kind is prunable and (older than its retention, or its subject is named in a supplied
   list of settled references). Default is dry-run returning counts and ids; `apply` rewrites the shard atomically through
   the durable-file door. Records of other kinds and shard order are untouched.
3. Tests in the owning module: record through `RecordDoor`; dry-run removes nothing; apply removes only the eligible
   set; a non-prunable kind is never removed; a held lock fails open without partial writes.

## Verify
`cargo test -p fgos-observe` passes; `cargo test -p fgos-supervision` still passes (kinds file); clippy clean.

## Rollback
Revert the commit. Records already pruned stay gone, so the apply path is exercised only by tests until part 2 exposes it.
