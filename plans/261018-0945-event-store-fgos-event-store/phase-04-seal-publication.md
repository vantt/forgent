# Phase 04: seal through the Publication port

- **Depends on:** phase 03 merged (coverage walk, order); **Git 01 merged** (crate `fgos-git` with the Publication port). Coding may start on Git 01 lane A's pushed API stubs; validation needs the merged port (D1). M3 and M7 settled with the Git 01 lead before step 3.
- **Branch / worktree:** `es/p04-seal`, `.claude/worktrees/es-p04`.
- **Model / effort:** opus, rigor critical; 34h.
- **Blocks:** phase 05.

## Context

- Spec §7 (scopes and refs, promote commit), §10 (steps 1-3, commit kinds, chain invariant, crash table, invariants), §11 (reader versus seal), §16 (`sealOnWrite`), §23.2 items 1 (seal kill points) and 2 (reader-versus-seal stress).
- Git spec §4 (operations, namespace grants, CAS and pin order, required protocol rows 1-3); Git 01 interface ([phase 01](../261018-0914-git-component-fgos-git/phase-01-publication-port.md#interface-handed-to-the-event-store)): `write_blob`, `write_tree`, `write_commit`, `read_ref`, `read_object`, `compare_and_swap` returning `stale` with the actual tip; a lost CAS is retried only with a new operation id; `compare_and_swap` runs under the caller's `event-seal`.
- V-REF-01: plumbing seal 9 ms, one CAS winner of eight, refs survive gc ([report](../reports/experiment-261017-1527-event-store-git-ref-mechanics.md)).

## Requirements

1. **`seal(stream)` under `event-seal`** (58): `try` for opportunistic callers, wait for explicit ones. Calls phase 02's rotation (takes and releases `event-append`), then publishes each closed segment in `seq` order with no append lock held.
2. **Crashed CAS never blocks (D6, M3).** A pending PublicationCas of the own ref from a crashed attempt does not stop the seal: the sealer rereads the tip, reruns step 2.1 and continues with a fresh operation id (a CAS against a stale tip loses safely). Git resolves the old record as superseded once a later receipted CAS of the same ref exists (M3). A tip that is neither the expected nor the store's own receipt commit is still `event-store-ref-moved`.
2a. **Locks and callers.** `seal`, `sealAll` and `sealIfDue` take the caller's held ranks (D3) and refuse ≥ 58 or `state`.
2b. **WAL growth (M8).** A test seals 10,000 segments and records Git WAL operation directories, bytes, inodes and pins; with Git's compaction (M8) the count stays bounded; the numbers go to the phase report with a 30-day projection at the observed `sealOnWrite` rate.
3. **Verify (§10 step 2.1).** Hashes, markers, contiguity, `first = cover[(own origin, stream)] + 1` from phase 03's coverage walk starting at `sealed.json`'s `cover`/`certified` (or empty), `sealed.json.lastSeq` never above the walked value; gap stops `event-store-chain-gap`. One walk function serves seal and read.
4. **Objects (§10 step 2.2).** Blob `events.jsonl` = segment bytes unchanged; blob `seal.json` canonical; tree of exactly those two entries; commit with parents per the commit-kind table, author and committer `fgOS Event Store <event-store@fgos.invalid>`, message `fgos-events seal <origin>:<stream> <first>..<last>`, date per D6 (M7).
5. **CAS (§10 step 2.3).** `compare_and_swap(ref, expected (Absent or Oid), new, fresh operation id)`; `stale` → reread tip, rerun step 2.1; a tip that is not the store's own receipt commit means `event-store-ref-moved`: keep the segment, record it for doctor. Never retry with the stale expected value.
6. **Receipt (§10 step 2.4).** Read the ref back and the blob `<new>:events.jsonl`; both must match; write `sealed.json {lastSeq, commit, cover, certified}` durably (tmp, `fsync`, rename, `fsync` dir) with `lastSeq` kept apart from emitted coverage; certify `<new>` only when it and its ancestors are fully emitted with nothing deferred. Mismatch: `event-store-seal-mismatch`, delete nothing.
7. **Delete (§10 step 2.5).** Only after the durable receipt; then `fsync` the dir. Re-list `closed/` and repeat, bounded per call.
8. **Refs per scope (§7).** `project` streams → `refs/fgos/events/<machine-id>`; `branch:<key>` → `refs/fgos/branch-events/<machine-id>/<key>`; `local` → `refs/fgos/local-events/<machine-id>`. Promote: `promote(branchStream, throughSeq)` appends `store.promote {stream, throughSeq, tip}` to `project`; the seal commit carrying it gets the branch tip as second parent. Abandon: delete the branch ref (Git CAS to Absent) and the branch open log.
9. **Recovery (§10 crash table).** Every row handled by the next seal or sync with no doctor step; seven named crash points injected.
10. **API for triggers.** `sealIfDue(intervalSec)` (oldest unsealed age), `sealAll()`, and `oldestUnsealedAgeSec()` for status and doctor.

## Files

| Action | File |
|---|---|
| create | `packages/event-store/rust/src/{seal,publish,receipt,refs,promote}.rs`, `packages/event-store/rust/tests/{seal_crash_matrix,seal_cas_race,promote_commit,branch_local_refs,reader_seal_stress}.rs` |
| edit | `packages/event-store/rust/Cargo.toml` (dependency `fgos-git`), `packages/event-store/rust/src/lib.rs` |

## Steps

1. Settle M3 and M7 with the Git 01 lead; record the answer in the phase report.
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
- **Promote:** a seal commit carrying `store.promote` has two parents, the second the branch tip; abandon removes only the branch ref and log.
- **Reader-versus-seal stress (§23.2 item 2):** at least 10,000 seeded interleavings of appenders, two sealers, two readers, `merge` and promote commits, on the real crate; regression vectors C1 (rotation crash then append), C2 (every batch prefix) and C4 (unknown origin under a merge below a covered seal, cursor coverage from open logs or a rebuilt receipt). Invariants checked per run: no acked event lost, none counted twice, every walk terminates, coverage never covers an unread event. Seed and interleaving recorded for each failure.

## Risk

| Risk | L × I | Mitigation / signal and response |
|---|---|---|
| M3 or M8 not available in Git | Medium × High | Seals continue (requirement 2), but unresolved records block activation and rollback through Git C5 and the WAL grows. Phase 04 merges with the kill test showing the record resolved; ES-11 does not land until M8's bound is shown. Signal: pending ops in `git-operation-journal` after the kill test. |
| Walk cost at first seal on a large ref | Low × Medium | Certified pruning of phase 03; the first walk after a lost `sealed.json` is O(V+E) by design (§11). |
| Commit date collision makes two seals identical | Low × Low | Different `seal.json` (first/last) always differs; determinism only aids recovery. |

## Rollback

Dormant: revert the merge. Refs written by tests live in temporary repositories only.
