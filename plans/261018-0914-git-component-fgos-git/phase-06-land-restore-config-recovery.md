# Phase 06: Land, SafeRestore, RepositoryConfig, Recovery

- **Depends on:** phases 02 (scope, Refs), 03 (Worktree, candidate worktrees), 05 (ScopedCommit, Sync, hook context).
- **Branch / worktree:** `git/p06-land`, `.claude/worktrees/git-p06`.
- **Model / effort:** opus, rigor critical; 32h.

## Context

- Spec §9 (Land steps 1-6, honest verification, M4 consumer settlement contract), §5 R30 Land row (20 → 40 → release → 40 + 50; a request holding 30 or anything above 20 is refused), §10 Land graph and recovery table (including interrupted `read-tree`), §11 native locks and SafeRestore, §3 SafeRestore (`reapplyLocalDelta`), RepositoryConfig, Recovery; §16 overrides G-080, G-081, G-095, G-098/G-099/G-102, G-113, G-141-G-147, G-175, G-234.
- Owner decision Q7 / D-ADR0042: own-file-set clean gate, non-overlapping dirty paths tolerated, lagging checkout reported.
- Current Land writers (moved in phase 07): `src/runner/merge.mjs` (slot `:752`, main `:764`, `:1401`, `:1599`, `:1721`), `src/workflow/integrate.mjs:116-169`, `src/runner/promote-engine.mjs:33`, `:82`.

## Requirements

1. **Land prepare:** reserve merge-slot 20 for the target ref; refuse a request whose held ranks include 30 or anything above 20 with `lock-order-violation` before any effect; inspect true topology, source/target, the target checkout's status, index and `MERGE_HEAD`; reject foreign state. Under 40 create a detached operation candidate worktree, release 40, merge or squash from the pinned target (squash = real one-parent commit; merge = exact target/source parents). A conflict aborts the candidate only. Consumer-declared candidate bytes (non-event `.fgos`, decision renumbering) are applied as declared input, never as Git meaning. Pin candidate and bases (`refs/fgos/git-operations/<id>/...`).
2. **Verification binding:** the consumer verifies outside every Git lock and returns evidence bound to source, target, candidate OIDs and tree digest. Git refuses publish on missing evidence, digest mismatch or a dirty candidate (`write-tree` differs from the candidate commit tree). Git never claims tests ran.
3. **Land publish:** reacquire 40 then 50; revalidate target, source, evidence and candidate; run the own-file-set clean gate (union of committed diff and declared footprint, normalized; whole-repo scope for land, subtree scope for return; `.fgos` never counts; fail-safe to every non-`.fgos` path when the set is absent; a staged rename blocks when either half is own) and return `main-checkout-dirty-mid-merge` without moving the ref when it fails; refuse publication into a foreign linked checkout; durable prepared and pins, then TargetAttempt, then exact-old target CAS. When the main checkout holds the target, the winner runs non-destructive `read-tree -m -u HEAD` under 50; non-overlapping dirty paths leave the checkout lagging, recorded in the receipt. Read back ref, tree and index; durable receipt; release; the consumer records `mergedSha`/`mergedInto` by operation id.
4. **Land recover:** every Land row of the §10 recovery table, including the interrupted `read-tree` (files at next, index old, `index.lock` present: no retry; complete only from recorded per-path fingerprints, else `recovery-required`).
5. **Settlement contract (M4):** the receipt carries `operationId` and `consumerSettlement: notOwnedByGit`; a repeated Land request with the same operation id returns the established receipt and never lands twice. A contract test documents what Work must do (unique `(repoIdentity, operationId, settlementKind)`, query before retry); Work and Event Store confirm the mechanism (§18 item 9) in their own plans.
6. **SafeRestore** `preview`/`apply`/`recover`: full locked status, target commit and ancestry checks, then a durable binary, untracked and mode-preserving snapshot before any destructive effect; producer worktree under the verified lease (no lock taken), main checkout under 50. `apply` with `reapplyLocalDelta` restores to the new tip and re-applies the captured delta to index and tree; a failed reapply keeps the snapshot and returns `recovery-required`. No retry reset/clean discards producer writes.
7. **Native lock repair (§11):** quarantine only an exact owned dead-child artifact under the corresponding exclusion with operation identity and immediate inode/state recheck; preserve contents; unknown external locks need inspected repair, never force; no `/proc` write as an ownership test.
8. **RepositoryConfig** `ensureHooks`, `removeOwnedHooksConfig` (fetch mapping exists from phase 01) under `repo-config` 80: absolute owned `core.hooksPath` when the slot is empty, custom paths preserved, missing enforcement diagnosed, provenance recorded; exact-old value check as the effect guard.
9. **Recovery port completion:** `inspectOperation`, `listPending`, `reconcile` for every payload kind (`RefUpdate`, `RefDelete`, `Land`, `ScopedCommit`, `Sync`, `WorktreeCreate`, `WorktreeMove`, `WorktreeRemove`, `Restore`, `ConfigChange`, `RemoteTransfer`, `PublicationCas`). Recovery takes the interrupted operation's locks, then `recovery` 80 last, released before any state 60 settlement. A supervisor recovery lock never substitutes for resource authority. Compaction keeps request digest and terminal receipt.
10. **GitHub adapter contract:** API merge stays in the GitHub adapter under consumer authorization; timeout is outcome-unknown until queried; any local mutation it needs goes through these ports. The code move is phase 07.

## Files

| Action | File |
|---|---|
| create | `packages/git/rust/src/{land,restore,config,recovery}.rs`, `packages/git/node-addon/src/git/{land,restore,config,recovery}.rs`, `src/git/{land,restore,config,recovery}.mjs` (and their `mod`/re-export lines) |
| create | `test/git/land.test.mjs`, `test/git/land-recovery.test.mjs`, `test/git/safe-restore.test.mjs`, `test/git/repository-config.test.mjs`, `test/git/recovery.test.mjs`, `packages/git/rust/tests/land_crash_matrix.rs` |
| edit | `docs/platform/git/spec.md` status line |

## Steps

1. Land prepare and candidate under 20/40 with pins.
2. Verification binding and publish under 40/50 with the clean gate, TargetAttempt, CAS, `read-tree`, receipt.
3. Land recovery rows and the crash matrix (kill at every WAL, pin, CAS, index, tree and receipt boundary).
4. SafeRestore with snapshots and `reapplyLocalDelta`.
5. Native lock repair.
6. RepositoryConfig hooks operations.
7. Recovery port for every payload; idempotent reconcile.
8. Code review unit (opus); merge to main (dormant until phase 07).

## Validation

```bash
cargo test -p fgos-git -p fgos-node-addon
cargo clippy -p fgos-git -p fgos-node-addon --all-targets -- -D warnings
node --test test/git/land.test.mjs test/git/land-recovery.test.mjs test/git/safe-restore.test.mjs test/git/repository-config.test.mjs test/git/recovery.test.mjs test/runner/land-vs-manual-commit.test.mjs
env -u CLAUDE_CODE_SESSION_ID -u CODEX_THREAD_ID -u FGOS_SESSION_ID FGOS_HOST_BIN=<p06 build> npm test
```

Vectors: **V-LAND** checked-out, unattached and foreign-attached targets; dirty index, `MERGE_HEAD`; ref races; real squash and merge parents; a same-target process stays refused for the whole verify while the slot is held; **V-VERIFY** digest bound, verifier or hook changes the tree, mismatch refuses (never marked passed by tree equality alone); **V-CRASH (land, restore)** every boundary, binary, untracked and user edits preserved, uncertain locks preserved; **V-ORDER** Node → addon → Rust → hook ladder, land request carrying 30 refused, no hook waits on 55; **V-CLEAN (native locks, post-land delete)**; **V-PARITY (land)** real merged OID, event timing unchanged for consumers; **M4 on the implementation** same operation id never lands twice; **E2 (index/tree)**.

## Risk

| Risk | L × I | Mitigation / signal and response |
|---|---|---|
| Land conflicts with the event-file sweep still in `merge.mjs` | Certain until the Event Store cutover | Replacement Land never sweeps event files; it has no caller before phase 07, which waits for the cutover (spec §12). |
| Clean gate differs from today's behaviour | Medium × Medium | V-PARITY on the existing `land-vs-manual-commit` fixtures; G-098/G-102 tests kept. |
| `read-tree` interruption leaves a lagging checkout | Low × Medium | Receipt reports `checkout: recoveryRequired`; doctor shows it; no blind reset. |

## Rollback

Dormant until phase 07: revert the merge.
