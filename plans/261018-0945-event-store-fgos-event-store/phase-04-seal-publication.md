# Phase 04: seal through the Publication port

- **Depends on:** phase 03 merged (coverage walk, order); **Git 01 merged** (crate `fgos-git` with the Publication port). Coding may start on Git 01 lane A's pushed API stubs; validation needs the merged port (D1). M7 settled with the Git 01 lead before step 3. **A1 is signed as D-ADR0058**; merge still waits for the review fixes and gates below.
- **Branch / worktree:** `es/p04-seal`, `.claude/worktrees/es-p04`.
- **Model / effort:** opus, rigor critical; 34h.
- **Blocks:** phase 05.

## Context

- Spec §7 (scopes and refs, promote commit), §10 (steps 1-3, commit kinds, chain invariant, crash table, invariants), §11 (reader versus seal), §16 (`sealOnWrite`), §23.2 items 1 (seal kill points) and 2 (reader-versus-seal stress).
- Git spec §4 (operations, namespace grants, CAS and pin order, required protocol rows 1-3); Git 01 interface ([phase 01](../261018-0914-git-component-fgos-git/phase-01-publication-port.md#interface-handed-to-the-event-store)): `write_blob`, `write_tree`, `write_commit`, `read_ref`, `read_object`, `compare_and_swap` returning `stale` with the actual tip; a lost CAS is retried only with a new operation id; `compare_and_swap` runs under the caller's `event-seal`.
- V-REF-01: plumbing seal 9 ms, one CAS winner of eight, refs survive gc ([report](../reports/experiment-261017-1527-event-store-git-ref-mechanics.md)).

## Requirements

1. **`seal(stream)` under `event-seal`** (58): `try` for opportunistic callers, wait for explicit ones. Calls phase 02's rotation (takes and releases `event-append`), then publishes each closed segment in `seq` order with no append lock held.
2. **Crashed CAS (D6, M3).** A1 is signed (D-ADR0058). A retry uses a fresh operation id and the tip read under `event-seal`; the old effect is never replayed. Identical publication recovers as `effectObservedOnly`; a later winning same-authority publication may close an old unknown attempt as `superseded` only under Git §10 rule 4a. Intent/Prepared chains close record-only under rule 4b. Authenticate interrupted own publications from retained segment bytes before treating them as crash recovery. Outside moves preserve the segment and report `event-store-ref-moved`. D6 dates use the last event's whole Unix second, clamped to zero, `+0000`, for both identities.
2a. **Locks and callers.** `seal`, `sealAll` and `sealIfDue` take the caller's held ranks (D3) and refuse ≥ 58 or `state`.
2b. **WAL growth (M8).** A test seals 10,000 segments and records Git WAL operation directories, bytes, inodes and pins; the active operation-directory and pin working set stays bounded and drains to zero, while the retained operation-id ledger grows linearly as required by Git §10. Record ledger entries/bytes separately. Project 30 days at an explicitly stated `sealOnWrite` workload assumption, never at the stress-loop throughput.
3. **Verify (§10 step 2.1).** Hashes, markers, contiguity, `first = cover[(own origin, stream)] + 1` from phase 03's coverage walk starting at `sealed.json`'s `cover`/`certified` (or empty), `sealed.json.lastSeq` never above the walked value; gap stops `event-store-chain-gap`. One walk function serves seal and read.
4. **Objects (§10 step 2.2).** Blob `events.jsonl` = segment bytes unchanged; blob `seal.json` canonical; tree of exactly those two entries; commit with parents per the commit-kind table, author and committer `fgOS Event Store <event-store@fgos.invalid>`, message `fgos-events seal <origin>:<stream> <first>..<last>`, date per D6 (M7).
5. **CAS (§10 step 2.3).** `compare_and_swap(ref, expected (Absent or Oid), new, fresh operation id)`; `stale` → reread tip, rerun step 2.1; a tip that is not the store's own receipt commit means `event-store-ref-moved`: keep the segment, record it for doctor. Never retry with the stale expected value.
6. **Receipt (§10 step 2.4).** Read the ref back and the blob `<new>:events.jsonl`; both must match; write `sealed.json {lastSeq, commit, cover, certified}` durably (tmp, `fsync`, rename, `fsync` dir) with `lastSeq` kept apart from emitted coverage; certify `<new>` only when it and its ancestors are fully emitted with nothing deferred. Mismatch: `event-store-seal-mismatch`, delete nothing.
7. **Delete (§10 step 2.5).** Only after the durable receipt; then `fsync` the dir. Re-list `closed/` and repeat, bounded per call.
8. **Refs per scope (§7).** `project` streams → `refs/fgos/events/<machine-id>`; `branch:<key>` → `refs/fgos/branch-events/<machine-id>/<key>`; `local` → `refs/fgos/local-events/<machine-id>`. Promote: `promote(branchStream, throughSeq)` appends `store.promote {stream, throughSeq, tip}` to `project`; the seal commit carrying it gets the branch tip as second parent. Abandon: delete the branch ref through Git 01's ref delete, `compare_and_swap(ref, expected = current tip, next = Absent, fresh operation id)` (Git phase 01 req 9), then the branch open log.
9. **Recovery (§10 crash table).** Every row handled by the next seal or sync with no doctor step; seven named crash points injected.
10. **API for triggers.** `sealIfDue(intervalSec)` (oldest unsealed age), `sealAll()`, and `oldestUnsealedAgeSec()` for status and doctor.


- **P02 review L5 — lost local receipt and hint.** Cross-check the own ref tip outside the Work gate when locally recovered high is zero and active starts at seq 1 on a stream with an existing ref. Rebuild coverage/receipt through the shared ref walk before allowing sequence reuse; test simultaneous loss of `sealed.json` and `hwm.json` after closed-segment deletion. A local zero must never silently restart a published stream.
- **P02 review L1 — enforce seal ownership.** Add `acquire_seal` refusing caller-held ranks ≥58 and the facade error `event-store-seal-under-state`. Require a typed `&SealGuard` for rotation so it is reachable only while event-seal is held; test rank refusal and guard lifetime.
- **P02 review L2/L3 — durable receipt and staging.** Use `fgos-durable-file::replace_durably` for `sealed.json`, preserving effect-aware errors. Never stage temporaries in `closed/`; it contains only validated immutable segment names.

## Files

| Action | File |
|---|---|
| create | `packages/event-store/rust/src/{seal,publish,receipt,refs,promote}.rs`, `packages/event-store/rust/tests/{seal_crash_matrix,seal_cas_race,promote_commit,branch_local_refs,reader_seal_stress}.rs` |
| edit | `packages/event-store/rust/Cargo.toml` (dependency `fgos-git`), `packages/event-store/rust/src/lib.rs` |

## Steps

1. Settle M7 with the Git 01 lead and record the owner's A1 decision (M3) in the phase report; without that decision the phase stops before step 7.
2. Commit objects and the commit-kind table; byte tests of `seal.json` and the tree.
3. CAS, receipt, delete; tip-moved handling.
4. Crash table with injected points; kill matrix part.
5. Branch, local and promote; abandon.
6. Stress harness and the C1, C2, C4 vectors.
7. Opus review; merge (dormant).

## Validation

```bash
cargo test --locked -p fgos-event-store -p fgos-git
cargo clippy -p fgos-event-store --all-targets -- -D warnings
```

Vectors (real temporary repositories, the real port, real locks):
- **Kill matrix part (§23.2 item 1):** SIGKILL after object write, after `update-ref`, after receipt, after delete, after delete before dir `fsync`: next seal recovers with no acked event lost or doubled; `seal-mismatch` when the published blob is altered.
- **CAS race:** two stores sharing a machine id seal concurrently into one bare-backed clone pair; one wins, the loser rereads and stops with `event-store-ref-moved` only when the tip is not its own.
- **Port contract:** HEAD, index and work tree unchanged after a seal from a linked worktree with `.git/index.lock` present; no hook runs (`reference-transaction` hook installed and silent).
- **Promote:** a seal commit carrying `store.promote` has two parents, the second the branch tip; abandon removes only the branch ref (exact-old CAS to `Absent`) and log.
- **Identical retry (signed spec, M3):** kill after the TargetAttempt and before the target rename; the next seal retries with a new operation id, publishes the same commit, and the old record ends `effectObservedOnly`; zero unresolved records in `git-operation-journal`. The non-identical case gets its vector only after A1 is decided.
- **Reader-versus-seal stress (§23.2 item 2):** at least 10,000 seeded interleavings of appenders, two sealers, two readers, `merge` and promote commits, on the real crate; regression vectors C1 (rotation crash then append), C2 (every batch prefix) and C4 (unknown origin under a merge below a covered seal, cursor coverage from open logs or a rebuilt receipt). Invariants checked per run: no acked event lost, none counted twice, every walk terminates, coverage never covers an unread event. Seed and interleaving recorded for each failure.

## Risk

| Risk | L × I | Mitigation / signal and response |
|---|---|---|
| Retained operation-id ledger growth (M8) or unresolved authority evidence | Medium × High | A1 is signed; pending records still need its authority/domain proof. Active operation directories and pins must drain; retained ids remain linear. WAL scan exposes capacity metrics, and ES04-M5-ledger-capacity tracks doctor integration and id-preserving rollup/sharding. |
| Walk cost at first seal on a large ref | Low × Medium | Certified pruning of phase 03; the first walk after a lost `sealed.json` is O(V+E) by design (§11). |
| Commit date collision makes two seals identical | Low × Low | Different `seal.json` (first/last) always differs; determinism only aids recovery. |

## Rollback

Dormant: revert the merge. Refs written by tests live in temporary repositories only.


## Unit 3 review disposition

H1: authenticate the first-parent unreceipted publication spine against this store's retained closed segment bytes, while preserving every sibling receipt's ancestry constraint. `sealAll` attempts every stream and aggregates failures. Real shared-ref SIGKILL regression seals the sibling first.

M1: rebuild a missing receipt through `reconcile_durable_history` before rotation even with an active/closed tail. M2: persist the offending ref observation and segment ranges, then durably retire the diagnostic only after successful publication has receipted those ranges.

M3: exact checkout-root commands are in the [unit 3 report](../reports/phase-lead-261018-2005-es-p04-u3-review-fixes.md#reproduce); no package script sets `CARGO_TARGET_DIR`. M4: the qualification uses eight independent real repositories and disjoint seed ranges, 1,250 schedules each (10,000 distinct schedules total), multiple firing points with seed-derived append counts, a waiting second sealer, two readers, promote/merge rounds inside the loop, and injected filesystem failures followed by recovery. The existing real-SIGKILL matrix remains the process-crash proof.

M5: **active working set bounded; retained id ledger linear** (Git §10 requires permanent id binding). `Wal::scan` exposes `ledger_entries`, `ledger_bytes`, and `ledger_capacity_warning` at 100,000 entries or 64 MiB. An incomplete scan remains incomplete evidence. The 30-day sizing assumption is 1,000 `sealOnWrite` publications/day (one Work event per publication, deliberately no batching), hence 30,000 receipts; use measured bytes/receipt for logical-byte sizing, plus at least one inode per receipt and filesystem block overhead. This is an assumed consumer workload, not an observed production rate.

**Named follow-up ES04-M5-ledger-capacity (Git/ES-09 integration owner):** wire these metrics and the capacity warning into `git-operation-journal` doctor output when the dormant crate is integrated; shard/roll up retained terminal receipts while preserving each operation-id/request-digest binding and outcome. No TTL deletion. Git spec §12 must document the ledger metrics/thresholds; main plan requirement 2b/criterion 8 and Event Store spec §21 must use the working-set/ledger distinction at landing. Those files and the doctor adapter are outside this unit's write grant.

Cheap lows: abandon refuses active/closed unsealed promotes; promote requires a previous project publication; stale abandon CAS compacts its terminal record; the seal stale path documents event-seal serialization; malformed age input returns an error. Civil-time extraction, the rotation context API, and cross-authority WAL admission remain coordinator follow-ups; cross-authority recovery must not silently bypass Git §10 rule 4a's same-authority requirement.


Unit 3 verification: 168 regular tests passed (two intentionally ignored); locked two-crate all-target clippy passed. Explicit qualification passed all 10,000 distinct schedules in 3,826.08 s. Eight complete final scans: 0 operation directories / pins / unresolved; 20,149 retained receipts, 6,548,173 logical bytes, 20,173 inodes / 24 directories, max receipt 325 bytes. At the stated 1,000-publications/day assumption, 30 days projects to 30,000 receipts and 9,749,625 logical bytes plus allocation overhead. See the unit 3 report for exact commands. Review/merge remains the coordinator's step 7.
