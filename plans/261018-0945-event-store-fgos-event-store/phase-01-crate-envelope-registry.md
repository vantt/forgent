# Phase 01: crate foundation, envelope, stream registry, baseline bench

- **Depends on:** nothing. Runs before Git 01 lands (no git access, D1).
- **Branches:** lane A `es/p01a-crate`, lane B `es/p01b-bench`; worktrees `.claude/worktrees/es-p01a`, `es-p01b`.
- **Model / effort:** lane A sonnet (advanced) with opus review, rigor critical (hash identity is permanent); 20h. Lane B sonnet; 4h.
- **Blocks:** phase 02.

## Context

- Spec §3 (one core, one crate), §5 (identities), §6 (envelope, canonical, `h`, v3 rule), §7 (registry rules 1-4), §8 (layout, non-git refusal), §17 (budget part (b) baseline).
- Legacy order and dedupe today: `src/state/replay.mjs:870-891`; legacy `h` is 16 hex of `JSON.stringify` in insertion order (`src/state/event-log.mjs:207-213`).
- Canonical JSON already exists twice (`packages/distribution/rust/src/verify.rs:45`, `packages/run-supervisor/rust/src/envelope.rs:19`); Q1, D5.

## Requirements

**Lane A**
1. Crate `fgos-event-store` at `packages/event-store/rust` (workspace member), no dependency on any consumer or on `fgos-git` yet (the port arrives in phase 03).
2. Canonical serialization per D5. Default (Q1 a): leaf crate `fgos-canonical-json` at `packages/canonical-json/rust` with no fgOS dependency; `fgos-run-supervisor` moves to it (keeping its integers-only check on top). `fgos-distribution` moves only after a test recomputes the digest of every manifest under the local release store (`<stateRoot>/releases/*/manifest.json`) and of float and non-BMP-key vectors and finds no change; otherwise it stays and the phase report opens an item (its serializer sorts UTF-8 bytes and prints `serde_json` numbers, `packages/distribution/rust/src/verify.rs:45-75`).
3. Envelope v4 type with every field of §6; `h` = full SHA-256 hex of the canonical line without `h`; `ts` validated as fixed-width `YYYY-MM-DDTHH:MM:SS.sssZ`; `seen` keys `"<origin>:<stream>"`, own stream omitted.
4. Batch commit marker type `{v: 4, kind: "batch-commit", origin, stream, firstSeq, lastSeq, count, sha256}`: canonical, no `h`, never an event.
5. `seal.json` types for kinds `seal`, `merge`, `legacy` (§10 table), canonical bytes and digest.
6. Legacy v3 rule: parse `{seq, ts, type, payload, v, src, h}` and baseline lines without `h`; identity `h` when present, else the raw line; never re-canonicalized. A port of the `(ts, file, seq)` order plus dedupe, byte-equal to `replay.mjs:870-891` on shared vectors. This Rust port is the **only** legacy-order implementation after phase 09 (reader prefix, export, pre-migration reads); every legacy event carries its provenance `{file, line}` so observe and doctor readers keep their `(file, seq)` keys.
7. Stream registry: schema `packages/event-store/contracts/stream-registry.schema.v1.json`; loader takes consumer contract files (`type`, `domain`, `schemaVersion`, `scope`, `sealOnWrite`); rules 1-4 of §7 enforced (`event-store-unregistered-type`, scope change refused, `work.*` and `decision` must be `project`). The store's own `store.promote` type is built in.
8. Identities: store id (random 128-bit, `store.json {v, storeId, machineId, createdAt, commonDir, commonDirDevIno}` written once with tmp, `fsync`, rename, `fsync` dir; a `commonDir`/`dev:ino` or `machineId` mismatch on open refuses `event-store-store-moved`, D19); machine id read order (git config value passed in by the caller, then `<stateRoot>/machine-id`), format `^[a-z0-9][a-z0-9-]{1,62}$`; minting lives in the setup fix (phase 07). Stream ids `project`, `project:<name>` (D9), `local`, `branch:<key>`; branch key slug rule.
9. Open-root layout type from an already resolved absolute common dir (`<common-dir>/fgos/events`): paths of §8 only; resolution itself is phase 06 (D4). A non-repository answer from the caller maps to `event-store-no-repository`.
10. Contracts in `packages/event-store/contracts/`: `envelope.v4.schema.json`, `batch-commit.v1.schema.json`, `seal.v1.schema.json`, `result-codes.v1.json` (every named error of the spec), `vectors/canonical-hash.v1.json` (inputs with expected bytes and `h`, including floats, unicode keys, nested payloads), `vectors/legacy-order.v1.json`.

**Lane B**
11. In-repo harness `scripts/event-store/v-spawn-bench.mjs` rebuilding V-SPAWN-01 (the original lived in `/tmp`): seed a fresh project under a given ext4 directory, run claim, move, settle at 1, 10, 20 sessions, 40 samples per row, report p50/p95 JSON. Read-only against the real checkout.
12. Record the part (b) baseline on ext4 on a main commit containing `a4b1278ae`, before any cutover code exists; write the result through `fgos convention path --kind report --type experiment --slug event-store-v-spawn-ext4-baseline`.

## Files

| Action | File |
|---|---|
| create | `packages/event-store/rust/**` (`Cargo.toml`, `src/{lib,envelope,canonical,legacy,registry,identity,layout,errors}.rs`, `tests/{vectors,legacy_parity}.rs`) |
| create | `packages/event-store/contracts/**` (schemas and vectors above) |
| create (Q1 a) | `packages/canonical-json/rust/**`; edit `packages/distribution/rust/src/verify.rs`, `packages/distribution/rust/Cargo.toml`, `packages/run-supervisor/rust/src/envelope.rs`, `packages/run-supervisor/rust/Cargo.toml` |
| edit | `Cargo.toml` (members), `Cargo.lock` |
| create | `test/event-store/legacy-order-parity.test.mjs` (proves today's Node `readAllEventsFromDir` order equals the frozen vectors; phase 09 deletes the Node function and retargets this test to the frozen vectors only, which the Rust port must still match) |
| create (lane B) | `scripts/event-store/v-spawn-bench.mjs` |

## Steps

1. Crate skeleton, member line, errors from `result-codes.v1.json`.
2. Canonical leaf (Q1) and the two caller moves; vectors.
3. Envelope, marker, seal types; vectors for `h`.
4. Legacy rule and order port; Node parity test on fixtures with equal `ts`, missing `src`, missing `h`, mixed v3 lines.
5. Registry loader and rule tests; identities and layout.
6. Lane B harness and the ext4 baseline report.
7. Opus review; merge to main (dormant).

## Validation

```bash
cargo test --locked -p fgos-event-store -p fgos-canonical-json -p fgos-distribution -p fgos-run-supervisor
cargo clippy -p fgos-event-store -p fgos-canonical-json --all-targets -- -D warnings
cargo fmt -p fgos-event-store -p fgos-canonical-json -- --check
node --test test/event-store/
env -u CLAUDE_CODE_SESSION_ID -u CODEX_THREAD_ID -u FGOS_SESSION_ID npm test
node scripts/event-store/v-spawn-bench.mjs --entry host --root .fgos/runtime/tmp/v-spawn-ext4/fixture --out .fgos/runtime/tmp/v-spawn-ext4/results.json   # lane B; root must be ext4
```

Success: vectors reproduce byte for byte in Rust; legacy order equals `replay.mjs` on every fixture; baseline report exists with the commit id and filesystem type.

## Risk

| Risk | L × I | Mitigation / signal and response |
|---|---|---|
| Canonical number form differs from Node JSON for a payload field | Medium × High | Vectors include floats, `-0`, large integers, unicode; a mismatch blocks merge; `h` is never computed in Node. |
| Moving two landed crates to the leaf breaks a golden test | Low × Medium | Their existing tests run in the same validation; any diff blocks merge. |
| Bench root is not ext4 | Low × Medium | Harness prints `stat -f` type and refuses tmpfs. |

## Rollback

Additive and dormant: revert the merge. The two moved callers return to their own serializers with the revert.

## Deferred one-door moves

These are explicit phase-01 exceptions to requirement 2; no consumer serializer changes in unit 3. This section is the scoped tracking record (backlog and program-board files are outside this assignment).

| Move | Blocker / trigger | Owner and delivery phase | Proof before completion |
|---|---|---|---|
| Run-supervisor adopts `fgos-canonical-json` with its existing integer/safe-range pre-walk | Running 6.3 lane owns `packages/run-supervisor`; wait until its edits land | Event Store integration lead, phase 02 prerequisite checkpoint after 6.3 releases ownership | Existing run-supervisor golden bytes/digests stay identical; unsafe/non-integer values remain refused; canonical leaf tests pass |
| Distribution adopts the leaf under a versioned digest contract | Q1 owner condition fails: float `1.0` and non-BMP key vectors change existing digest bytes. Existing distribution serializer stays | Distribution owner, separate digest-v2 migration phase after explicit digest-version approval; not part of Event Store phases 02–09 | Recompute every installed manifest digest and float/non-BMP vectors; prove old-version verification unchanged and new-version digest behavior explicit |

## Unit 3 integration handoff

- Review fixes: [unit 3 report](../reports/phase-lead-261018-1207-es-p01-u3-review-fixes.md).
- Baseline of record: [standard-door ext4 experiment](../reports/experiment-261018-1207-event-store-ext4-baseline-v-spawn.md); the earlier Node-payload measurement is retained there as historical raw evidence. Its old source-tree fixture/reproduce command and `scripts/event-store/baseline-ext4.json` are superseded.
- Phase 02 must hold the real `event-append` lock across recovery, `StoreIdentity::sweep_temps_under_append_lock`, initialization and append. The no-overwrite hard-link publish independently prevents racing initialization from replacing an identity; a 16-thread real-filesystem test proves one winner and identical returned ids.
- Life-long registry scope: phase 03's open/reader must call `Registry::validate_historical_scope` for every v4 event type/scope encountered in active, closed and sealed content before appending under a newly loaded registry. A registration is not evidence of its historical scope. Test: load `observe.trace` as local, persist an event, reopen with project registration and refuse `event-store-integrity`; repeat for sealed-only history. Unit 3 tests the reconciliation method across reconstructed registries; persistence/open integration belongs to phase 03.
- Branch key mapping: lowercase ASCII alphanumeric characters; collapse every other run into `-`, trim edges, truncate to 128 ASCII bytes, trim trailing `-`, refuse an empty result. The mapping can collide; callers use the resulting stream key consistently from first append.
- Stored v4 parse requires exactly the canonical record bytes plus one LF. Legacy raw lines remain unreformatted and verify their historical trailing-h suffix (no LF in that historical digest).
- Layout stream directories contain literal colons (`branch:x`, `project:porting`) on the supported Linux filesystem. Identity drivers now refuse non-Linux targets. Git resolution remains phase 06.
- Impact-analysis: inactive (zero registered providers). Package-scoped fmt replaces the phase-wide check because the unrelated pre-existing fgctl Windows test is unformatted (review L12); no out-of-scope formatter edits.
