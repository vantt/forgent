---
contract: plan-v1
title: "The land door finishes or recovers its own half-done work"
status: running
lead: head:lead-forgent-261125-1558-land-d-ea1cc
base: a5e9f9b40052194d625012f4d2c24cf21a2189ec
priority: P1
blockedBy: []
footprint:
  - plans/261125-1558-land-door-recovers-half-done-work/**
  - packages/supervision/rust/src/land.rs
  - packages/supervision/rust/tests/land.rs
  - packages/git/rust/src/inspect.rs
  - packages/git/rust/src/incidents.rs
  - packages/git/rust/src/recovery.rs
  - packages/git/rust/src/land.rs
  - packages/git/rust/src/refs.rs
  - packages/git/rust/src/scoped_commit.rs
  - packages/git/rust/tests/land_push_catch_up.rs
  - packages/git/rust/tests/incidents.rs
  - packages/identity/rust/src/directory.rs
  - packages/identity/rust/tests/directory.rs
  - docs/platform/git/spec.md
  - docs/platform/identity/spec.md
source:
  - plans/discussions/ds-d4d2sp5qg2-land-door-recovers-half-done-work/DISCUSSION.md
  - p-q2dn2cnzlq
  - p-o4juyw2ntg
  - plans/261121-0747-land-door-hygiene/plan.md
created: 2026-11-25
---

# The land door finishes or recovers its own half-done work

## Outcome

A land or head write that dies between its local commit and its push no longer blocks every later land:
the next land (or head write) on the same target finishes the push of that commit itself, so local main is
never left ahead of origin by the land door. A Git chain whose writer is a bare pid with no session id
(the shape every secretary, shaper and some supervisor lands have) is settled by `fgos git recover` once
that pid is proven dead from OS state, with the recoverer recorded and no `FGOS_SESSION_ID` borrowing;
its retained candidate worktree is freed, so dead writers no longer hold tens of GB.

## Cause (read from code at base ebd19c364; phase 1 confirms it against the journal)

- **Row p-q2dn2cnzlq.** Door: the paths land `land_paths` in `packages/supervision/rust/src/land.rs`
  (head `session write` reaches the same function through `apps/fgos/src/wiring/session_write_publish.rs`).
  Step: between `scoped_commit` (local commit on main) and `push_local`. The prior plan made a *rejected*
  push undo its commit, but a process that dies after the commit, or a push whose answer is lost, leaves the
  commit on local main by design ("that commit stays, named, for the next land's sync to find"). The next
  land's `sync_target` then sees local ahead of origin and refuses `land-target-ahead` instead of finishing
  it. A confined head cannot push by hand (`.git` read-only), so only an unconfined session could unblock.
- **Row p-o4juyw2ntg.** `recover_git_operations` (`packages/git/rust/src/incidents.rs`) settles a pending
  chain only as its own writer (`reconcile_operation` with the caller's writer; every kind refuses
  `*-authority-mismatch` otherwise) and frees another writer's finished Land only when
  `writer_is_dead` proves it. That proof, `fgos_identity::directory::session_proven_dead`, needs an
  Identity directory row; a bare pid writer (`WriterId::Pid`, written as the decimal pid) never has one,
  so it is never proven dead and every chain it started is kept forever (9 candidates, 46 GB, 2026-11-25).

## Prior art

Reused: `undo_unpublished_commit` and the rejected-push retry (plan 261121-0747-land-door-hygiene, done),
`push_local`, `sync_target`'s merge-slot custody, `release_dead_writer_land`, the `writer_is_dead`
parameter already threaded through `recover_git_operations` and the Node addon, `fgos_process::facts::judge`
(absent or zombie pid is `Dead`), and `land-abandoned-writer-mismatch` naming `fgos git recover`.
Missing: (1) any step that finishes an orphaned land-door commit; (2) a dead proof for a bare pid writer;
(3) recovery of a *pending* chain of a proven-dead writer (only finished Land chains had it);
(4) a `kept` message that names the door instead of "only its writer can recover it".
The prior plan's claim "`fgos git recover` by another writer already clears" a dead writer's chain held only
for session writers Identity knows; this plan closes the pid case it missed.

## Acceptance criteria

1. `cargo test -p fgos-supervision --test land` passes a test where a paths land's commit is left on local
   main unpushed (the land stops after `scoped_commit`), then a second writer's paths land succeeds with no
   hand push, and origin/main holds both commits.
2. The same test file proves a commit on local main that no land-door chain made (a by-hand commit) still
   refuses `land-target-ahead` and is never pushed.
3. `cargo test -p fgos-identity --test directory` proves a bare pid writer whose pid is absent is proven
   dead, and a live pid (any start time) is not.
4. `cargo test -p fgos-git --test incidents` proves: a pending Land, ScopedCommit and main-checkout catch-up
   chain of a proven-dead pid writer is settled by another writer's recover, the journal records the
   recoverer, and a land refused `land-abandoned-writer-mismatch` before it succeeds after it; a live
   writer's chain is still kept.
5. `fgos git status` / recover text for a kept chain names `fgos git recover` and says why it was kept
   (writer alive, or not provable), checked in `packages/git/rust/src/incidents.rs` unit tests.
6. `npm test` and `cargo test --workspace` green on the merged tree; one `CHANGELOG.md` `[Unreleased]` line per
   row, landed as phase 4 says (the file is held by running plan 261124-0004 today).
7. The cause report `plans/261125-1558-land-door-recovers-half-done-work/reports/cause.md` names the door and
   step for each of the three 2026-11-25 incidents from the journal.

## Non-goals

- A commit on main that no land-door chain made (owner by-hand commits): it stays refused, unchanged.
- Making secretary/shaper lands carry `FGOS_SESSION_ID`: the recovery door makes it unnecessary; a separate
  row if wanted.
- Letting a confined head run `fgos git recover`, or making `fgos git status` readable from a confined
  session (it fails `git-floor-probe-failed: Read-only file system` there today): separate item.
- Proving dead a pid that is alive under a reused number, or across a reboot: kept, as today.
- Any new verb, flag or lock.

## Authority map

| New thing | Model row | Note |
|---|---|---|
| Catch-up pushes an unpublished land-door commit instead of refusing | `supervision` (component) | extends `sync_target`; survivor: `sync_target`; retired: the `land-target-ahead` refusal for land-door commits in `packages/supervision/rust/src/land.rs` |
| Read: which journaled ScopedCommit chain made a commit on main | `git` (component) | method on `GitDriver` in `inspect.rs`; no new door |
| Bare pid writer proven dead from OS state | `identity` (component) | extends `session_proven_dead`; survivor: `session_proven_dead`; retired: nothing (same callers in `apps/fgos/src/wiring/git_incidents.rs` and `packages/git/node-addon/src/git.rs`) |
| Recover settles a pending chain of a proven-dead writer, recording the recoverer | `compose-git-status-and-recovery` (door) | extends `recover_git_operations`; survivor: `recover_git_operations` |

## Phases

| id | title | depends-on | footprint | wave | status |
|---|---|---|---|---|---|
| 1 | [Catch-up finishes an unpublished land-door commit](phase-01-catch-up-finishes-unpublished-commit.md) | - | packages/supervision/rust/src/land.rs, packages/supervision/rust/tests/land.rs, packages/git/rust/src/inspect.rs, plans/261125-1558-land-door-recovers-half-done-work/reports/ | 1 | ready |
| 2 | [A bare pid writer is proven dead from OS state](phase-02-pid-writer-proven-dead.md) | - | packages/identity/rust/src/directory.rs, packages/identity/rust/tests/directory.rs | 1 | ready |
| 3 | [Recover settles a dead writer's pending chains](phase-03-recover-dead-writer-chains.md) | - | packages/git/rust/src/incidents.rs, packages/git/rust/src/recovery.rs, packages/git/rust/src/land.rs, packages/git/rust/src/refs.rs, packages/git/rust/src/scoped_commit.rs, packages/git/rust/tests/incidents.rs | 1 | ready |
| 4 | [Integrate, docs and changelog](phase-04-integrate-docs-changelog.md) | 1, 2, 3 | packages/git/rust/tests/land_push_catch_up.rs, docs/platform/git/spec.md, docs/platform/identity/spec.md | 2 | ready |

Each phase dispatches with capability `code:implement`. Phases 1-3 have disjoint footprints and run at once;
phase 3 takes `writer_is_dead` as the parameter it already is, so its fixtures inject the proof and do not wait
on phase 2. Phase 4 merges, runs the full gate, and owns the shared docs.

Cross-plan overlap, resolved by narrowing: `packages/git/contracts/mutation-census.v1.json` (running plan
261122-2108) is left out, since recovery adds no new mutation, only a recorder on an existing one; if phase 3
finds the census must change, it stops `BLOCKED` for the lead. `CHANGELOG.md` (running plan 261124-0004,
phases 6 and 7 left) is left out; phase 4 writes the lines to `reports/changelog-lines.md`, and the lead adds
`CHANGELOG.md` to this plan's footprint and lands the lines once 261124-0004 is done. Checked with
`node scripts/plan-contract-check.mjs --plan plans/261125-1558-land-door-recovers-half-done-work`.

Order (from the discussion): admit after the backlog-index and shaper-worktree plans; needs a free lead slot.

## Owner questions

None. The design choices (push the orphan rather than undo it; absent pid as the only bare-pid dead proof)
are settled by the evidence above: undoing would leave the orphan's paths dirty in the main checkout, which
itself refuses other lands, and a live pid cannot be told apart from a reused one without a recorded start time.

## Risks and rollback

- Pushing a commit that is not the land door's (owner hand commit): guarded by journal provenance; a commit
  with no ScopedCommit chain of the land-door binding is never pushed (acceptance 2).
- A compacted chain whose provenance cannot be read: catch-up keeps today's refusal; phase 1 reports how often.
- Pushing a commit while its own writer is still mid-land: impossible under the merge slot, which the
  original land holds from commit through push.
- Dead-proof false positive on pid reuse: a live pid is never proven dead (acceptance 3).
- Rollback: `git revert` of each phase's commit; no data format changes beyond the recoverer field in the journal
  record, which older readers must ignore (phase 3 checks the WAL's `deny_unknown_fields` before choosing a field).
