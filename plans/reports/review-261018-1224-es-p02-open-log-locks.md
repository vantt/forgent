# Review: Event Store phase 02 (open log, batch framing, recovery, lock rows)

- Branch `event-store/p02-open-log`, `d4bb2c8d1..b34e4060e`, read-only review.
- Contract: phase-02 plan; event-store spec §4, §8, §9, §10.1, §11 (in-gate bound); holder-lock spec §5-§7; model-check reports (C1, C2); design principles.
- Re-run here (private `CARGO_TARGET_DIR=.fgos/runtime/phase-target`): `cargo test --locked -p fgos-event-store -- --test-threads=1` 51 passed; `cargo clippy --locked -p fgos-event-store --all-targets -- -D warnings` clean; `node --test test/holder-lock/registry-contract.test.mjs` 22 passed. Full `npm test` and an ext4 crash run were not done (same gap as the phase-lead report).

## Verdict

Merge after fixing **H1**. C1 and C2 cannot recur on the paths they describe: the seq high-water mark is recovered from receipt, closed ranges, hint and committed active before any seq is assigned, and readers and recovery never fold or keep an unmarked batch. The lock rows, ranks and the in-process lock match the registry and spec. No git call or process spawn exists in `src/` (grep for `Command`/`spawn`/`rev-parse` finds nothing). Faults are injected through the `FileSystem` trait, with no env switches. No `unwrap`/panic sits on an I/O path; the two `unwrap`s (`append.rs:106`, `open_read.rs:51`) are guarded by a preceding `first()`/`is_empty()`.

## Spec checklist

| Rule | Status | Where |
|---|---|---|
| Validate before the lock | ok | `append.rs:141-161`; test `validation_precedes_lock_and_initialization` |
| Events + marker in one `write`, file fsync before ack, dir fsync on create | ok | `append.rs:187-248`; short write never acks (`one_batch_write_contains_marker…`) |
| Readers fold only marker-closed batches | ok | `open_read.rs:23-99`; `framing_prefixes.rs` checks every byte prefix, alone and after a committed batch, and a wrong-checksum marker |
| Recovery drops bytes after the **last** verifying marker | **deviates: H1** | `open_read.rs:23-25,88-93`, `append.rs:77-88` |
| hwm from `sealed.json`, closed, `hwm.json`, committed active; refuse gap/overlap/hint above all | ok, but ordered after truncation (H1) | `append.rs:89-114`; tests `high_water_recovers…`, `receipt_alone…`, `gaps_overlaps…` |
| Rotation: fsync active, rename, fsync `closed/` and stream dir, then `hwm.json` | ok | `rotate.rs:43-64`; ordered trace test plus SIGKILL at all 10 rotation points |
| Receipt durable before delete | not in this phase (phase 04); recovery honours the receipt | `append.rs:89-101` |
| Own read: active descriptor before `closed/` listing, ENOENT recorded, dedupe by `h` | ok | `open_read.rs:165-210` |
| In-gate bound returns `catch-up-required`, no git or spawn | ok (L4 is too strict) | `open_read.rs:212-238` |
| Lock ranks: append 70 allowed inside `state` 60, refused at held ≥70; seal 58 row registered | ok (L1) | `locks.rs:30-35`; `registry_rows.rs` |
| Kill tests really kill | ok: real child, `SIGKILL`, `signal()==9` asserted, at every append, truncation, rotation and hint point | `kill_append.rs:11-38` |
| 8-process concurrency | ok | `kill_append.rs:151` |
| DRY with `fgos-durable-file` | identity and dir sync reuse it; hwm replace does not (L2) | `identity.rs:175`, `fsio.rs:52-84` |

## Critical

None.

## High

**H1. Corruption in `active.jsonl` silently truncates acknowledged batches, and the hint check runs only after the truncation.**
`open_read.rs:23-25` + `:88-93`: in non-strict mode `decode` stops at the *first* batch that fails to verify (bad `h`, bad marker checksum, identity mismatch) and reports `committed_len` up to there. `append.rs:79-88` then truncates everything after that point. Later batches with valid markers go too. The spec allows truncating only "bytes … after the last commit marker that verifies" (§9 step 3), and §10 says "Nothing is truncated except an uncommitted batch".
- Failure: batches A (seq 1), B (seq 2), C (seq 3) are acked. A bit flip in B means the next append truncates B and C. `hwm.json` holds 2 (written by the recovery before C was appended), so the `hint > high` check at `append.rs:108-111` then refuses with `event-store-seq-recovery-conflict`. By then the bytes are already gone. Every later append and rotation refuses for good, and the acked events cannot be recovered. If only the last acked batch is damaged, the hint is behind, nothing refuses, and its seqs are handed out again with different `h`. The reader path (`read_own`/`read_in_gate`) also hides B and C without an error.
- Why a torn write cannot explain this: a crash or short write leaves only a *prefix* of one batch. A prefix can never contain a complete marker line. So a complete, newline-terminated line that parses as a `batch-commit` for this origin/stream anywhere after the stop point proves damage to acked data, not an unacked tail.
- Fix: (1) in `decode`, after the stop point, scan the remaining complete lines. If any of them deserializes as a `BatchCommit` (whether it verifies or not), return `EventStoreIntegrity` (or `…SeqRecoveryConflict`) in both modes rather than `break`. (2) In `recover`, compute the high-water mark and the `hint > high` check **before** `set_len`, and truncate only once every check has passed. (3) Add tests: a damaged middle batch followed by a valid batch, and a damaged event line inside the last complete batch. Both must refuse and leave the file byte-identical, as `a_verifying_marker_with_internal_sequence_overlap_refuses_instead_of_truncating` already does for the overlap case.

## Medium

**M1. Each append costs about six fsyncs and a full re-verify of all unsealed data, against the plan's "one `write` and one `fsync` per batch".**
- `append.rs:118-125` `prepare_stream` runs `create_dir_all` and then fsyncs `closed/`, the stream dir and the open root on every append.
- `append.rs:112-114`: append never updates `hwm.json`, so the hint is always behind by the previous batch. Every recovery therefore runs `write_hwm` (tmp fsync, rename, dir fsync, `fsio.rs:52-84`). Rotation then writes it again even when it is already equal (`rotate.rs:63`).
- `append.rs:91-93` reads and fully decodes every closed segment (SHA-256 of every event and marker) on each append. `append.rs:77-78` does the same for the whole active file. All of this runs under `event-append` and inside the Work gate. The cost grows with unsealed volume, which works against the §17 latency budget that phase 09 measures (plan risk table, row 1).
- Fix: fsync `closed/` and the open root only when `create_dir_all` actually created them (stat first). Keep one stream-dir fsync while an existing `active.jsonl` has not been confirmed durable by this process: today the per-append stream-dir fsync is what covers a predecessor that created `active.jsonl` and was killed before its dir fsync, so do not drop it blindly. Rewrite `hwm.json` only when it is below the closed/receipt maximum (active is self-describing, and the hint exists for the rotation-crash window), and skip it in rotation when it already equals `high`. Take closed ranges from validated filenames plus a strict check on the newest segment, or cache verification by (name, size, mtime), and leave full verification to seal (§10 step 2.1). The phase-09 measurement decides whether this is needed, but the fsync count should be fixed before then.

## Low

**L1. Seal-side rank rules are not yet enforced.** `SEAL_NAME`/`SEAL_RANK` exist (`locks.rs:10-12`) with no acquire path, and `rotate()` (`rotate.rs:21-35`) does not check that `event-seal` (58) is held. That is fine for a dormant crate, since §10 seal belongs to phase 04. Phase 04 must add `acquire_seal` with refusal at held ≥58 and the facade's `event-store-seal-under-state`, and should make `rotate` reachable only under the seal guard (for example by taking a `&SealGuard` parameter, as `recover` takes `&AppendGuard`).

**L2. `write_hwm` re-implements an atomic replace next to `fgos-durable-file`.** `fsio.rs:52-84` hand-rolls tmp, fsync, rename, dir fsync. Phase 04 needs the same for `sealed.json` ("tmp, fsync, rename, fsync dir"). Add `replace_durably(dir, name, bytes)` to `fgos-durable-file` (with the same `O_NOFOLLOW` and error-effect reporting as `install_once`) and use it for both, per design principle 1. Also, the comment at `fsio.rs:62` ("Refuse symlinked temporaries") sits on `mode(0o600)`; `create_new` is what actually refuses.

**L3. Local garbage permanently refuses appends.** An unparseable `hwm.json` (`append.rs:57-67` → conflict) or any stray file in `closed/` (`open_read.rs:127-131` → `invalid`) blocks every append and rotation, and nothing tells the operator which file is to blame. `hwm.json` is only a hint, so an unparseable one could be treated as absent and rewritten, while a stray `closed/` entry should name the path in the error. Phase 04 must not stage temporaries inside `closed/`.

**L4. `read_in_gate` returns `catch-up-required` on any vanished segment** (`open_read.rs:231`), even one whose range is entirely ≤ `cursor_seq`. That is the normal steady state when a concurrent seal deletes an already-folded segment, so the gate bounces for nothing. Fix: refuse only when a vanished segment's `last > cursor_seq`. The range is already parsed in `segments()`, so keep it in `vanished`.

**L5. Simultaneous loss of `sealed.json` and `hwm.json` after closed segments are deleted lets seq restart at 1 undetected locally.** This follows from the spec, which says a lost receipt is rebuilt only on a detected conflict. Phase 03/04 (ref walk on seal) should also cross-check the own ref tip against a locally recovered high of 0 when `active` starts at seq 1 on a stream that has a ref. Informational for this phase.

**L6. Test and evidence gaps.** There is no test for H1. The real-write SIGKILL test samples 5 prefixes (`kill_append.rs:68`); the in-process test covers every byte prefix, which is enough for C2. Mutation and kill evidence exists on tmpfs only, ext4 was not run, and the full `npm test` was not run. The phase-lead report says so.

## Not findings (checked)

- C1: receipt 2 / closed 3-4 / active 5 → next seq 6. Covered by tests, and by SIGKILL between rename and `hwm.json` with a forced stale hint (`kill_append.rs:122-149`).
- C2: every byte prefix of a 3-event batch, alone and after a committed batch, is never folded and is truncated by the next append. A wrong-checksum marker is never folded.
- Registry rows match the plan exactly (mutex, repo, 58/70, `<eventOpenRoot>/locks/<name>.lock`, null legacy fields, fence `none`, owner `event-store`), and the Rust test pins names, ranks and paths. The schema owner enum and the holder-lock spec rank table (58 and 70 rows, template paragraph) are updated.
- `install_once` reuse in `identity.rs:175`. The sweep of `.durable-file-<pid>-<seq>.tmp` runs only under the append lock, which also encloses initialization.
- `held_ranks` is self-declared by the caller. That is acceptable per §4, because the facade passes its `LockScope`.

Status: DONE_WITH_CONCERNS
Summary: One High (corruption in active truncates acked batches before the hint check) and one Medium (per-append fsync and re-verify cost) need fixing before merge. C1/C2, lock ranks, kill and prefix tests otherwise hold.
