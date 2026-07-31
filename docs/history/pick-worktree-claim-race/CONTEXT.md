# pick worktree-creation-failure claim race (tsk-4m0) — CONTEXT

## Feature boundary

`fgos pick` (and any other `isolate:true` claim through `claimWork` in
`src/runner/claim-port.mjs`) commits the `todo -> doing` claim via
`moveWork` durably before it calls `createClaimWorktree`. If worktree
creation then fails for any reason, the item is left stuck in `doing`
with no branch/worktree and — per `startupReap`'s own by-design exclusion
of human/session claims (`src/runner/loop.mjs:344`) — no automatic
recovery path.

This item's boundary: fix the claim-time ordering so a worktree-creation
failure never leaves an item orphaned in `doing`, and document the manual
recovery steps for whatever residual failure modes remain outside that
fix (e.g. the git binary itself being unavailable). It does not touch
`take` (`isolate:false`, never calls `createClaimWorktree`) and does not
touch `startupReap`'s policy of skipping human/session claims.

## The incident

Reproduced live on `tsk-f31`: a second `fgos pick tsk-f31` attempt
(branch already existed, so the reused-branch path) failed with
`spawnSync git ENOENT` from inside `createWorktree`'s `git worktree add`
call — the exact worktree the session was sitting in was deleted as a
side effect (working directory disappeared mid-session, shell
auto-recovered to a parent dir).

No data loss: `fgw/tsk-f31` was fully intact (`git log` showed all 5 real
commits). Matches the shape of a prior, different incident
(`docs/explanation/orphaned-worktree-reclaim-must-check-for-live-uncommitted-work.md`,
decision 0018, item `tsk-1wd`, 2026-07-28) — a different trigger
(`approve`'s leaf-merge reclaim path calling `reclaimOrphanedCheckout`
force-remove) but the identical resulting shape: a step commits before a
worktree operation, and a failure in between orphans state with no
automatic recovery.

Workaround used at the time (undocumented, improvised): retrying
`fgos pick tsk-f31` hit a SECOND, different error —
`transitionWork: expected status todo but found doing` — because pick's
retry path unconditionally expects `todo` and has no branch for
"already doing, mine, no live worktree." Recovery required manually
running `git worktree add <path> fgw/tsk-f31` plus manually `rm -rf`ing
the checked-out `.fgos/` to match ADR0020's convention (`createWorktree`
normally does this itself).

## Locked decisions

| D-ID | Decision |
|------|----------|
| D1 | Fix direction is **auto-revert**: `claimWork` rolls the item's status back to its pre-claim value (`todo`, or the prior status for a branch-take) if `createClaimWorktree` throws, before the error propagates to the caller. A failed claim looks like it never happened — the caller sees a clean failure and can retry with ordinary `todo` semantics. This also resolves the second observed error (`transitionWork: expected status todo but found doing`) for free, since status is already `todo` again by the time a retry runs — no separate retry-path branch needed. |
| D2 | This item ships a manual-recovery how-to doc regardless of the D1 code fix landing, matching this repo's existing convention for documenting known-gap workarounds (e.g. `docs/how-to/recover-a-blocked-merge-conflict-when-catchup-cannot-reconcile-it.md`). The auto-revert narrows *when* manual recovery is needed but cannot eliminate every failure mode — e.g. the git binary itself being unavailable at the moment of revert. |
| D3 | `startupReap`'s blanket skip of human/session claims (`src/runner/loop.mjs:344`, intentional — avoids reaping an active claim out from under a live human/session worker) stays **out of scope**. This item only fixes the claim-time race inside `claim-port.mjs`/`worktree.mjs`; it does not propose changing reap policy. |

## Pinned terms

- **"Orphaned in doing"** — an item whose `status` is `doing` but which
  has no live branch/worktree corresponding to that claim, and no
  automatic path back to a claimable state.
- **"Auto-revert"** (D1) — `claimWork` itself undoing its own `moveWork`
  claim synchronously, inside the same call, when the subsequent
  worktree-creation step fails — not a later out-of-band reap.

## Scout evidence

- `src/runner/claim-port.mjs:130-134` — comment at the `baseRef`
  computation confirms: "moveWork(to:'doing') runs and durably commits
  BEFORE createClaimWorktree runs, so any failure in the
  worktree-creation step... orphans the item in doing with no
  branch/worktree and no automatic recovery."
- `src/runner/claim-port.mjs:211-254` — `claimWork`'s actual sequence:
  `moveWork` (line 211) commits the claim; `createClaimWorktree` (line
  250) runs afterward, inside the same `try` but with no `catch` that
  reverts the `moveWork` already committed.
- `src/runner/worktree.mjs:376-387` — `createClaimWorktree` already has a
  REATTACH path (tsk-65n) for a *live* checkout still standing from a
  prior claim, but nothing for "claimed, but worktree creation itself
  just failed."
- `src/runner/loop.mjs:329-385` (`startupReap`) — line 344:
  `if (item.claimRole === 'human' || item.claimRole === 'session')
  continue;` — reap only reclaims a claim the runner itself made and
  crashed on, by design (D3 above keeps this untouched).
- `bin/fgos.mjs:1527-1617` — confirms `take` uses `isolate: false` (no
  worktree creation, so this race can't hit it) and `pick` uses
  `isolate: true` (the only path that calls `createClaimWorktree`).
- `docs/explanation/orphaned-worktree-reclaim-must-check-for-live-uncommitted-work.md`
  — prior, differently-triggered incident with the identical
  commit-before-worktree-op shape; cited for pattern, not reused code.

## Deferred to planning

- Exact revert mechanism: whether `claimWork` calls `moveWork` a second
  time (`doing -> todo`, or back to the branch-take's prior status) inside
  a `catch`/`finally` around `createClaimWorktree`, or whether the revert
  needs a dedicated helper; how the revert interacts with the
  already-written `addOutcome` predicted-outcome record (line 222-234)
  written between the two calls.
- Whether the revert should also fire for `isBranchTake`'s `blocked ->
  doing` claim (revert to `blocked`), not just the `todo -> doing` case —
  the incident was reproduced on the `todo` path, but the same ordering
  bug exists on the `blocked` branch-take path too.
- How to test this without relying on the same `spawnSync git ENOENT`
  trigger (likely: inject a `createClaimWorktree` failure directly in a
  unit test rather than trying to reproduce the cwd-deletion race).
- Location, filename, and exact content of the D2 how-to doc (likely
  `docs/how-to/`, following the cited precedent's naming pattern).

## Outstanding questions

None — D1/D2/D3 above are the full set of product decisions needed
before shaping.
