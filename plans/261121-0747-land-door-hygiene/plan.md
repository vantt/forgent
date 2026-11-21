---
contract: plan-v1
title: "A land leaves no candidate behind and a paths land never leaves main ahead"
status: done
lead: lead:LANDDOOR
base: ec34f897a3fce57fd986a92b0b2803f41d6253ab
priority: P1
blockedBy: []
footprint:
  - plans/261121-0747-land-door-hygiene/**
  - packages/supervision/rust/src/land.rs
  - packages/supervision/rust/tests/land.rs
  - packages/git/rust/src/land.rs
  - packages/git/rust/tests/**
  - packages/git/contracts/mutation-census.v1.json
  - docs/platform/git/spec.md
  - CHANGELOG.md
source:
  - p-yqanenewb4
  - p-q2dn2cnzlq
created: 2026-11-21
---

# A land leaves no candidate behind and a paths land never leaves main ahead

## Outcome
A successful `fgos land <branch>` releases its candidate worktree; a paths land or head write whose push is cleanly rejected leaves local main where it was and retries from a fresh sync.

## Cause (proven)
- Row 1: `drive()` in packages/supervision/rust/src/land.rs ends a published land with `live.take()` and never calls `acknowledge_land`, so the terminal chain stays retained with its ~5G worktree. 17 candidates were on disk, most from healthy lands. The old Node `landRunnerItem` acknowledged `delivered`.
- Row 2: journal chain session-write-2468259-1795220001179566290-4 holds a RemotePush outcome `rejected` (non-fast-forward) at 07:13. `land_paths` commits locally, `push_local` is rejected because another machine pushed after the sync, and the door returns land-paths-push-rejected with the commit left on local main; every later catch-up answers land-target-ahead.
- A dead writer's pre-attempt chain blocks prepare by design (land-abandoned-writer-mismatch, tested); `fgos git recover` by another writer already clears it. Only the message is wrong.

## Prior art reused
`acknowledge_land`, `release_dead_writer_land`, `fgos git recover`/`status` retainedLand, the branch land RemoteMoved retry. SafeRestore was tried first and cannot go backward without discarding the main checkout's other local changes (restore-target-not-descendant). Added: `undo_unpublished_commit`, the one door that moves the main checkout's branch back.

## Non-goals
No new verb, no change to the floor probe (a full disk only fails it when the record is stale after a release; described in the report).

## Acceptance criteria
1. After a successful branch land the candidate worktree is gone and the chain is not in retainedLand.
2. A paths land whose push is rejected ends with local main at its previous tip, or on origin after a retry; a later land succeeds with no hand push.
3. land-abandoned-writer-mismatch names `fgos git recover`.

## Phases

| id | title | depends-on | footprint | wave | status |
|---|---|---|---|---|---|
| 1 | Successful land releases its candidate | - | packages/supervision/rust/src/land.rs, packages/supervision/rust/tests/land.rs | 1 | done |
| 2 | Paths land undoes its rejected commit and retries | 1 | packages/supervision/rust/src/land.rs, packages/git/rust/src/land.rs, tests, census, spec | 2 | done |

## Owner questions
None open. The supervisor allowed the undo door when landing paths through the branch candidate proved large.

## Risks and rollback
- Risk: acknowledging after publish fails on a held lock; it is non-fatal and recover mops up. Rollback: git revert.

## Overlap note
Any overlap error with a running plan is the known checker-versus-admission mismatch (backlog p-pcfbembv6e); work-data-model also lists land.rs, so rebase before landing.
