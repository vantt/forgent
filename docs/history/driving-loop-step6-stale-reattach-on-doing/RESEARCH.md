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
