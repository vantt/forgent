# Research: tsk-4gc — driving loop Step 6 skips resync when status is already 'doing'

## Round 1 (2026-08-20, discovery stage, via fgos-researching)

**Asked:** Verify the root cause and proposed fix claimed in tsk-4gc's
description: that `fgos-coding-driving`'s `references/loop-mechanics.md`
Step 6 skips re-claiming/resyncing when an item's `status` is already
`doing`, bypassing `resyncClaimWorktree` (`src/runner/worktree.mjs:825`),
and that the fix ("call resyncClaimWorktree, or re-invoke `fgos pick`,
which already does it") is safe and correct.

**Checked (repo, all hits — nothing needed externally):**

1. `plugins/fgOS/skills/fgos-coding-driving/references/loop-mechanics.md`
   Step 6 (current text, already read directly in this session as part of
   orienting the driving loop for this same item — this is the item's own
   subject matter, not a separate research target): when `status` is
   already `doing`, the step says "skip claiming and proceed straight to
   Step 7 — the session is assumed to already be inside the claimed
   worktree in that case" — no call of any kind back into `fgos pick` or a
   resync primitive on this branch.

2. `src/runner/worktree.mjs:825` — `resyncClaimWorktree(repoRoot,
   worktreePath, branch)` exists, exported. Its doc (line ~1014-1033,
   attached to `createClaimWorktree`) states it resyncs a reattached
   checkout to the branch's current tip "when that's provably safe" —
   citing `tsk-2cd` by name as the item that added this exact mechanism
   ("the branch may have advanced past this checkout via a child merge
   while this worktree sat claimed-but-anchored; see that function's own
   doc for why 'untouched' was the bug, not the fix").

3. `src/runner/worktree.mjs:1035-1046` — `createClaimWorktree`: when the
   item's `fgw/<id>` branch already exists and a live checkout is found via
   `reattachableCheckout`, it calls `resyncClaimWorktree(repoRoot, existing,
   branch)` before returning `{ path: existing, branch, reused: true }`.
   This is the exact "reattach path" the item's description names, and it
   already wires the resync in — this is the same mechanism `fgos pick`
   goes through.

4. `src/runner/claim-port.mjs:211-215` — `isPotentialStaleClaimReclaim`
   exists: `isolate && item.status === 'doing' && (item.claimRole ===
   'human' || item.claimRole === 'session') && (actor === 'session' ||
   actor === 'human') && isReclaimEligible(...)`. The surrounding comment
   (lines 196-210) states explicitly: "a stale-claim reclaim (below)
   re-claims an item that is ALREADY `doing` — occupancy is unchanged
   before and after ... which is precisely the situation a person
   reclaiming a stale claim is trying to clear." This exists specifically
   to let `pick`/`take` be re-invoked on a `status:doing` item without
   tripping the worker-slot ceiling gate.

5. `docs/history/root-worktree-drift-after-child-merge/CONTEXT.md`
   (tsk-2cd, status: `done`) — the item that shipped 1-4 above. Its own D1
   confirms the *class* of root cause (a merged child's `git branch -f`
   ref-move advances the branch in the shared `.git` dir without touching
   any other worktree checked out on that branch, so `git rev-parse HEAD`
   looks current while the index/working files stay stale) and its own
   "Outstanding questions deferred to planning" explicitly names *both*
   candidate guard placements as still open at that item's own
   planning time: "`fgos pick`'s `reused:true` reattach path vs the start
   of `fgos-coding-implement` (or both)". Only the first (`fgos pick`'s
   own reattach path, in code) was actually wired — confirmed by grepping
   `plugins/fgOS/skills/fgos-coding-implement/` for `resync|ancestor|drift`:
   zero hits, no such guard exists there.

**Found:** All three claims in tsk-4gc's description are independently
confirmed true by direct repo evidence, with file:line citations above.
The underlying resync mechanism (tsk-2cd) is real, already shipped, and
already proven safe to invoke on an already-`doing` item (evidence 4) —
it is a live, exercised path (`fgos pick`'s CLI-level idempotent reattach),
not a hypothetical one. The gap tsk-4gc reports is real and precisely
located: `fgos-coding-driving`'s own Step 6 prose is the one call site
that still assumes "status already doing" means "worktree is fine, skip
entirely" — the other candidate placement tsk-2cd's own planning left open
(a guard at the start of `fgos-coding-implement`) was never built either,
so today NEITHER of tsk-2cd's two candidate placements protects a re-driven
session against this drift; only the CLI-level `fgos pick` reattach path
(evidence 3) carries the fix, and Step 6 is exactly the site that has a
now-known-safe way to reach it (re-invoke `fgos pick <id>`, evidence 4)
and currently declines to.

**Still open (implementation choice, not a fact question):** whether the
fix re-invokes `fgos pick <id>` unconditionally on every Step 6 pass
where `status == 'doing'` and this is the first Implement invocation of
the drive (cheapest, reuses the already-proven CLI path), or instead
calls `resyncClaimWorktree` directly from the loop's own bash (skips a
subprocess but needs a new CLI surface, since `resyncClaimWorktree` is
not currently exposed as its own `fgos` verb — grepped `bin/fgos.mjs` for
`resyncClaimWorktree`, zero hits). This is a planning-stage decision, not
a discovery-stage ambiguity — both options are real and both close the
gap; picking between them needs no further evidence.

**Verdict:** clear.

## Round 2 (2026-08-20, validating stage reality-gate FAIL, direct read)

**Trigger:** `fgos-coding-validating`'s reality gate FAILed on Repo fit —
plan.md's original Phase 1 ("re-invoke `fgos pick <id>`") does not
actually reach `resyncClaimWorktree` for the live-continuous-drive case
that matters most.

**Checked (repo, direct read):**

1. `src/runner/claim-liveness.mjs:112-117` — `isReclaimEligible(repoRoot,
   id, claimRole, ...)` requires `now - activityAt > thresholdMs`, and for
   `claimRole !== 'runner'` (covers `'session'`, our case) `thresholdMs =
   thresholds.humanMs = 24 * 60 * 60 * 1000` (`src/state/graph-metrics.mjs:485`
   — 24 hours). No same-session/same-actor exemption exists anywhere in
   this check — it is purely a worktree-activity-age signal.
2. `src/runner/claim-port.mjs:289-326` — the stale-claim-reclaim block
   that releases-then-reclaims a `status:doing` item only fires when
   `isReclaimEligible` returns true. When it does not (the ordinary case
   for a live, continuously-driven item — minutes since last activity, far
   under 24h), execution falls through to `claim-port.mjs:331-339`'s
   ordinary `moveWork(dir, { id, to: 'doing', expectedStatus: 'todo', ...
   })` — which throws an FSM conflict error, since the item's real status
   is `doing`, not `todo`. Confirmed no earlier branch in `claimWork`
   (read from its own top, `claim-port.mjs:96`) special-cases "already
   own this live claim, just resync" — there is no such shortcut.
3. **Conclusion: the original Phase 1 mechanism is wrong for the exact
   scenario this item targets** (a continuous drive re-entering its own
   recently-active claim within the same session, the tsk-17h/fan-out
   shape) — it would throw a conflict error instead of resyncing.
4. Found a better existing mechanism instead: `fgos resync-worktree`
   (`bin/fgos.mjs:3906`, wired to `resyncWorktree` at
   `src/runner/worktree.mjs:902`) is an ALREADY-EXISTING, ALREADY-SHIPPED
   CLI verb, purpose-built for precisely this failure class — its own doc
   comment (`worktree.mjs:885-901`, tsk-1d7) names the exact cause: "a
   worktree whose branch ref was force-moved from outside (e.g.
   `approve`'s leaf->root merge) while this worktree still holds
   files/index at the OLD tree" — this is verbatim the tsk-17h repro. It
   takes NO item id and touches NO claim/CAS state at all — pure
   git-worktree-plus-branch repair, so `isReclaimEligible`/`moveWork`
   never enter the picture, closing the exact gap that broke the
   `fgos pick`-based mechanism. Its own CLI shape
   (`bin/fgos.mjs:3906-3910`) is designed to run from inside the stale
   worktree with no flags at all (`--path` defaults to `process.cwd()`,
   `--branch` defaults to the worktree's own current branch via
   `git symbolic-ref`) — exactly the position Step 6 is already in when
   `status == 'doing'` (the session is already inside the item's claimed
   worktree). No-op fast path confirmed: returns `{resynced: false,
   reason: 'already-in-sync'}` when already current
   (`worktree.mjs:939-941`).
5. Existing test coverage confirmed real, not assumed:
   `test/runner/worktree.test.mjs:852-` (`resyncWorktree` unit tests,
   including the already-in-sync no-op and the moved-branch-tip
   reapply/refuse cases) and `test/e2e/resync-worktree-bare-invocation.test.mjs`
   (the exact bare/no-flags CLI shape this fix reuses).

**Found:** the fix should call the existing `fgos resync-worktree --dir
"$root"` verb (bare invocation, no `--path`/`--branch` needed — the
session is already sitting in the worktree) instead of re-invoking
`fgos pick`. This is simpler than both the original plan (broken) and the
rejected new-CLI-verb alternative from Round 1 (unnecessary — the right
verb already exists). `fgos pick`'s own reattach/resync path
(`resyncClaimWorktree`, evidence from Round 1) remains correct and
unchanged for its own case (a fresh claim/reclaim through the pull door);
it is simply not the mechanism Step 6 should reach for on an
already-live, already-`doing` claim.

**Verdict:** clear.
