# Phase report: claim ceiling inside state, main held only around the checkpoint (wave S, S3)

Status: DONE_WITH_CONCERNS (two unrelated red tests, pre-existing on the integration tip).

## Change (one commit `bbf7b7929`, `git show --stat`: claim-port.mjs + claim-capacity-race.test.mjs)
- `claimWork`: HEAD read once, outside every lock; that SHA is both `startSha` of a fresh worktree and `headAtTake`/`branchHeadAtTake` of the record.
- `withMainCheckout` now wraps only `checkpointMainFgos`. Read-only checks, stale-claim reclaim (public `releaseClaim`/`moveWork`) run lock-free.
- One `withMainState` transaction: fresh view + CAS on `expectedStatus`, **worker-slot ceiling** (`worker-slot-ceiling`, `occupied/ceiling` kept; stale-reclaim exemption kept), `acquireClaimTx`.
- Worktree created after, via `createClaimWorktree({scope, startSha})` (worktree-admin, outside state and main); failure → `releaseClaim`.
- Removed: local `git`/`gitAt`/`currentHead` helpers (use `worktree.mjs` `currentHead`/`resolveRefSha`), main-held ceiling check, repeated `currentHead` re-reads.
- GitNexus impact `claimWork`: LOW (claimItem → claimAndDispatch → runOnce only). Reused: `withMainState`, `acquireClaimTx`, `hasWorkerSlotRoom`, `addWorktree` path in `createClaimWorktree`.

## Evidence
- New `test/runner/claim-capacity-race.test.mjs` (3/3): 30 rounds, two real processes, ceiling 1 → exactly one claim, one `worker-slot-ceiling`; main + state free while `git worktree add` runs (post-checkout hook sleeps 1 s); claim record and worktree share the SHA read before a later main commit.
- Targeted run on phase branch: claim-port, fgos-claim, fgos-claim-2, runtime-coordination, hot-lock-known-exec-sites, identity-before-lock, worker-slots: 145/145. Same set + race + architecture on integration after merge: 175/175. Spawn-count test (one lookup per `readClaims`) green.
- Full `npm test` on phase branch (host built with private `CARGO_TARGET_DIR`): 8142 tests, 8051 pass, 2 fail, 14 skipped. Both failures also fail on the untouched integration tip: `check-decision-citation-drift` (ADR0055/ADR0003 glosses in docs/specs) and `skill-wrappers` projection (`.claude/skills/instruction-audit` missing). Neither touches claim code. On the integration tip a third fails (assembleSkills drift), also unrelated.
- take→return (20 items, real CLI, fixture repo; ms): 
  | conc | before take p50/p95 | after take p50/p95 | return p50/p95 before→after |
  |---|---|---|---|
  | 1 | 171/184 | 168/174 | 155/159 → 154/355 (one outlier) |
  | 10 | 521/756 | 417/519 | 374/425 → 381/430 |
  Concurrent take p95 −31%. Fixture is tiny (no 240 open claims), so the v-spawn-01 absolute numbers (p95 37 s at 20 sessions) are not comparable; direction matches (less serialization on main).

## Decisions
- Ceiling stays skipped when a stale-claim reclaim is eligible, as before; it now runs after the reclaim, inside the transaction.
- Branch/root-branch tips are read after the checkpoint (lock-free), not before it, because they depend on the item view.
- `baseRef` for leaf items still names the root branch (moving tip); only the fresh-branch case is pinned to the prefetched SHA.

## Concerns
- Two pre-existing red tests above (docs citation drift, skill wrapper projection) block a green full `npm test` on integration; owned by docs/skills lanes.

## Unresolved
- None.
