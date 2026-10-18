# Phase 04: seal through the Publication port

- **Depends on:** phase 03 merged (coverage walk, order); **Git 01 merged** (crate `fgos-git` with the Publication port). Coding may start on Git 01 lane A's pushed API stubs; validation needs the merged port (D1). M7 settled with the Git 01 lead before step 3. **This phase cannot merge before the owner decides Git amendment A1 (M3)**; see requirement 2.
- **Branch / worktree:** `es/p04-seal`, `.claude/worktrees/es-p04`.
- **Model / effort:** opus, rigor critical; 34h.
- **Blocks:** phase 05.

## Context

- Spec §7 (scopes and refs, promote commit), §10 (steps 1-3, commit kinds, chain invariant, crash table, invariants), §11 (reader versus seal), §16 (`sealOnWrite`), §23.2 items 1 (seal kill points) and 2 (reader-versus-seal stress).
- Git spec §4 (operations, namespace grants, CAS and pin order, required protocol rows 1-3); Git 01 interface ([phase 01](../261018-0914-git-component-fgos-git/phase-01-publication-port.md#interface-handed-to-the-event-store)): `write_blob`, `write_tree`, `write_commit`, `read_ref`, `read_object`, `compare_and_swap` returning `stale` with the actual tip; a lost CAS is retried only with a new operation id; `compare_and_swap` runs under the caller's `event-seal`.
- V-REF-01: plumbing seal 9 ms, one CAS winner of eight, refs survive gc ([report](../reports/experiment-261017-1527-event-store-git-ref-mechanics.md)).

## Requirements

1. **`seal(stream)` under `event-seal`** (58): `try` for opportunistic callers, wait for explicit ones. Calls phase 02's rotation (takes and releases `event-append`), then publishes each closed segment in `seq` order with no append lock held.
2. **Crashed CAS (D6, M3), conditional on Git amendment A1.** Until the owner decides A1, this phase relies only on the signed Git spec: the seal commit is deterministic (D6, M7), so after a crashed PublicationCas of the own ref the sealer rereads the tip, reruns step 2.1 and retries with a fresh operation id, producing the same commit; Git's recovery of the old record, run while the ref is at that same `next`, closes it as terminal `effectObservedOnly` (Git spec §10 recovery row 3, Git phase 01 req 12). The kill test proves that case. A non-identical retry (for example a seal carrying `store.promote` after the branch tip moved, so the new `next` differs from the crashed one) leaves the old record unresolved under the signed text (recovery row 7, no terminal state); that case is **blocked pending A1** and is not implemented or claimed here. ES-04 does not merge before A1 is decided: if A1 is signed, the `superseded` path and its vectors are added before merge; if A1 is refused, the owner's answer names how the non-identical case is avoided (for example a promote seal that never retries with a different `next`) and that rule is added before merge. A tip that is neither the expected nor the store's own receipt commit is still `event-store-ref-moved`.
2a. **Locks and callers.** `seal`, `sealAll` and `sealIfDue` take the caller's held ranks (D3) and refuse ≥ 58 or `state`.
2b. **WAL growth (M8).** A test seals 10,000 segments and records Git WAL operation directories, bytes, inodes and pins; with Git's compaction (M8) the count stays bounded; the numbers go to the phase report with a 30-day projection at the observed `sealOnWrite` rate.
3. **Verify (§10 step 2.1).** Hashes, markers, contiguity, `first = cover[(own origin, stream)] + 1` from phase 03's coverage walk starting at `sealed.json`'s `cover`/`certified` (or empty), `sealed.json.lastSeq` never above the walked value; gap stops `event-store-chain-gap`. One walk function serves seal and read.
4. **Objects (§10 step 2.2).** Blob `events.jsonl` = segment bytes unchanged; blob `seal.json` canonical; tree of exactly those two entries; commit with parents per the commit-kind table, author and committer `fgOS Event Store <event-store@fgos.invalid>`, message `fgos-events seal <origin>:<stream> <first>..<last>`, date per D6 (M7).
5. **CAS (§10 step 2.3).** `compare_and_swap(ref, expected (Absent or Oid), new, fresh operation id)`; `stale` → reread tip, rerun step 2.1; a tip that is not the store's own receipt commit means `event-store-ref-moved`: keep the segment, record it for doctor. Never retry with the stale expected value.
6. **Receipt (§10 step 2.4).** Read the ref back and the blob `<new>:events.jsonl`; both must match; write `sealed.json {lastSeq, commit, cover, certified}` durably (tmp, `fsync`, rename, `fsync` dir) with `lastSeq` kept apart from emitted coverage; certify `<new>` only when it and its ancestors are fully emitted with nothing deferred. Mismatch: `event-store-seal-mismatch`, delete nothing.
7. **Delete (§10 step 2.5).** Only after the durable receipt; then `fsync` the dir. Re-list `closed/` and repeat, bounded per call.
8. **Refs per scope (§7).** `project` streams → `refs/fgos/events/<machine-id>`; `branch:<key>` → `refs/fgos/branch-events/<machine-id>/<key>`; `local` → `refs/fgos/local-events/<machine-id>`. Promote: `promote(branchStream, throughSeq)` appends `store.promote {stream, throughSeq, tip}` to `project`; the seal commit carrying it gets the branch tip as second parent. Abandon: delete the branch ref through Git 01's ref delete, `compare_and_swap(ref, expected = current tip, next = Absent, fresh operation id)` (Git phase 01 req 9), then the branch open log.
9. **Recovery (§10 crash table).** Every row handled by the next seal or sync with no doctor step; seven named crash points injected.
10. **API for triggers.** `sealIfDue(intervalSec)` (oldest unsealed age), `sealAll()`, and `oldestUnsealedAgeSec()` for status and doctor.

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
| A1 (M3) not decided or refused; M8 not available in Git | Medium × High | Without A1 only the identical-retry case resolves (`effectObservedOnly`); a non-identical retry would leave an unresolved record that blocks rollback through Git C5 and stays in doctor. Phase 04 does not merge until A1 is decided and the kill test shows every crashed record terminal; ES-11 does not land until M8's bound is shown. Signal: pending ops in `git-operation-journal` after the kill test. |
| Walk cost at first seal on a large ref | Low × Medium | Certified pruning of phase 03; the first walk after a lost `sealed.json` is O(V+E) by design (§11). |
| Commit date collision makes two seals identical | Low × Low | Different `seal.json` (first/last) always differs; determinism only aids recovery. |

## Rollback

Dormant: revert the merge. Refs written by tests live in temporary repositories only.
