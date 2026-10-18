# Phase 02: open log, batch framing, recovery, lock rows

- **Depends on:** phase 01 merged. No Git code needed. The registry edit lands after Git 01 lane B's registry change (land second rebases).
- **Branch / worktree:** `es/p02-open-log`, `.claude/worktrees/es-p02`.
- **Model / effort:** opus, rigor critical; 26h.
- **Blocks:** phase 03.

## Context

- Spec §4 (two rows, ranks, consequences), §8 (layout, guarantee, refusals), §9 (append steps 1-7, ack point, framing, one log per stream), §10 step 1 (rotation, the part under `event-append`), §11 steps 1-2 and the in-gate bound, §23.2 items 1 (append and rotation kill points) and 2 (C1, C2 vectors).
- Holder-lock: in-process `acquire` (`packages/holder-lock/rust/src/port.rs:457`), `guarantee` (`:784`); registry rows and ranks map (`packages/holder-lock/contracts/lock-registry.v1.json`); Node template resolver for `<fgosDir>` etc. (holder-lock spec §7).
- Corrected model check: C1 and C2 witnesses ([report](../reports/experiment-261017-1545-event-store-model-recheck-corrected.md)).

## Requirements

1. **Lock rows (D3).** Registry rows `event-seal` (mutex, repo, rank 58, `v3Path` `<eventOpenRoot>/locks/event-seal.lock`, `v1Shape: null`, `v1Path: null`, fence `none`, owner `event-store`) and `event-append` (mutex, repo, rank 70, same template and nulls); ranks map entries `58` and `70`; schema (`lock-registry.schema.v1.json:40` required list, `:52` owner enum) gains owner `event-store`, with a schema test. No Node code takes these locks, so `src/holder-lock/registry.mjs` is not changed (it throws `lock-not-node-owned` for rows Node never resolves); the template is documented only. A contract test pins the crate's lock names, ranks and paths to these rows (`tests/registry_rows.rs`).
2. **Locks in process.** `event-append` through `port::acquire` with `Wait` blocking and a bounded timeout; released before any git call (§4). The lock directory is created 0700 by the setup-fix body (phase 07), which `migrate` also runs (D8); the crate refuses a missing or wider-mode dir with `event-store-lock-dir-invalid`.
3. **Guarantee.** `guarantee(<eventOpenRoot>/locks)`; level `none` refuses `event-store-unsupported-filesystem`; the level is reported to callers for `status` and doctor.
4. **Append (§9).** Steps 1-7 exactly: validation before the lock; under `event-append` drop bytes after the last verifying marker and `fsync`; recover the high-water mark from `sealed.json` `lastSeq`, every closed segment, `hwm.json` and committed `active` lines, with no git call; refuse gap, overlap above the receipt, or `hwm.json` above every location with `event-store-seq-recovery-conflict`; rewrite a behind `hwm.json` durably; `stale-cursor` on an own-stream cursor mismatch; one `write` of event lines plus marker, then `fsync` the file, and the directory when the file was created; return `{origin, stream, firstSeq, lastSeq, h[]}`.
5. **Rotation (§10 step 1).** Under `event-append`: recovery, then `fsync` active, rename to `closed/<first>-<last>.jsonl`, `fsync` `closed/` and the stream dir, write `hwm.json` durably. Exposed as a crate function used by phase 03.
6. **Own-stream read (§11 steps 1-2).** Read `active` through one opened descriptor, fold only marker-closed batches; list `closed/` and tolerate `ENOENT`; verify `h`, markers, contiguity; dedupe by `h`.
7. **In-gate bound.** A read mode that runs only steps 1-2 and returns `catch-up-required` when the cursor's own-stream `seq` is below what `active` and `closed` hold. No git call and no spawn in this mode.
8. **Fault points for tests.** An injected filesystem trait with named kill points (after write, after file fsync, after rename, before `hwm.json`), used by tests only through the trait, never an env switch.

## Files

| Action | File |
|---|---|
| create | `packages/event-store/rust/src/{append,rotate,open_read,locks,fsio}.rs`, `packages/event-store/rust/tests/{append_recovery,kill_append,registry_rows,framing_prefixes}.rs` |
| edit | `packages/holder-lock/contracts/lock-registry.v1.json`, `packages/holder-lock/contracts/lock-registry.schema.v1.json`, `test/holder-lock/registry-contract.test.mjs` |
| edit | `docs/platform/holder-lock/spec.md` (§6 rank table rows 58 and 70, §7 template list) |

## Steps

1. Registry rows, schema, contract tests (Node and Rust).
2. Append with recovery and framing; unit tests for every recovery source and refusal.
3. Rotation and its crash rows.
4. Own-stream read and in-gate bound.
5. Kill tests and byte-prefix tests; opus review; merge (dormant).

## Validation

```bash
cargo test --locked -p fgos-event-store -p fgos-holder-lock
cargo clippy -p fgos-event-store --all-targets -- -D warnings
node --test test/holder-lock/registry-contract.test.mjs test/holder-lock/fences-rust-locks.test.mjs
env -u CLAUDE_CODE_SESSION_ID -u CODEX_THREAD_ID -u FGOS_SESSION_ID npm test
```

Vectors (real files, real holder-lock locks, child processes killed with SIGKILL at injected points, no sleeps):
- **C1:** crash between rotation rename and `hwm.json`, then a new append assigns `lastSeq + 1`, never a reused `seq`; receipt 2, closed 3..4, active 5 gives high-water mark 5; gap, overlap, hint above every location refuse.
- **C2:** every byte prefix of a three-event batch (and a suffix prefix after a committed batch, and a marker with a wrong checksum) folds nothing of that batch; the next append truncates it.
- **Kill matrix part:** during append write, after `fsync`, during rotation, between rename and `hwm.json`: no acked event lost, none doubled, no `seq` twice, recovery automatic on the next append.
- Concurrency: 8 processes appending to one stream produce contiguous `seq` with no duplicate.
- Guarantee `none` refused: the level reaches the crate through the filesystem trait of requirement 8, so the refusal path is tested without an NFS mount; the real `guarantee` call is covered on ext4 and tmpfs.

## Risk

| Risk | L × I | Mitigation / signal and response |
|---|---|---|
| `fsync` cost on ext4 breaks part (a) of the budget | Medium × High | Measured in phase 09 at 20 sessions; one `write` and one `fsync` per batch by design; a miss reopens the budget with the owner, never drops `fsync`. |
| Registry file conflict with Git 01 | High × Low | Rebase; contract tests catch a lost row. |
| Truncation of an uncommitted batch races a reader | Low × High | Readers never fold unmarked lines (C2 proof); truncation only under `event-append`. |

## Rollback

Dormant crate code: revert the merge. Removing the two registry rows is safe while no production code takes them.
