# Research log — tsk-3of (wontfix worktree/branch reclaim gap)

## Round 1 — 2026-08-20

**Asked:** (1) does `status-fsm.mjs` `TRANSITIONS` really give `wontfix` zero
outgoing edges? (2) would adding a `wontfix -> cleanup` edge let a wontfix
item flow safely through the existing `cleanup` verb, or does that verb
assume things a wontfix item never has? (3) is there an existing
reclaim/prune mechanism, independent of the status-fsm, that a wontfix fix
could reuse or mirror?

**Checked / found:**

1. `src/state/status-fsm.mjs:156-169` — confirmed, `wontfix` has exactly
   three doors in (`blocked/todo/doing -> wontfix`) plus one more added
   later (`awaiting-human -> wontfix`, tsk-2ub), and **zero doors out**. This
   is explicit, intentional design (D3/D4 of `fsm-wontfix-terminal-status`),
   not an oversight.

   Crucially, `docs/explanation/fsm-refusal-messages-name-a-remedy-and-
   wontfix-gains-an-awaiting-human-door.md` records that a wider door set
   (including `wontfix -> cleanup`/`-> delivered`/`-> retrospective`/
   `-> done`) was **explicitly considered and rejected** (tsk-2ub D2):
   > "`delivered`/`retrospective`/`cleanup`/`done` are past-completion
   > states — the work already happened. `wontfix` means 'valid, never
   > going to be done' ... that doesn't semantically fit a state where the
   > work is already finished, and no real evidence in this item's own data
   > named a case needing those four."

   This is a locked, verified decision (review-audit-self-decision rules):
   tsk-3of's own proposed fix direction #1 ("add a wontfix -> cleanup
   transition to TRANSITIONS") directly conflicts with it and should not be
   silently reopened.

2. `src/state/cleanup-harness.mjs`'s `assessCleanupReadiness` (called by
   `bin/fgos.mjs`'s `case 'cleanup'`, line ~1516) gates on:
   - `checkCleanupTTLElapsed` — TTL anchored to the specific
     `retrospective -> cleanup` move event. A wontfix item never has one.
   - `checkRetrospectiveContent` — requires a real decision record or a
     `docType`+`docPath` outcome from retrospective. A wontfix item never
     ran retrospective, so this would almost always fail closed.
   - `checkMergeStillResolves` (worktree-backed domains) — checks the
     item's take/return sha is still an ancestor of `HEAD`/its root's
     branch. For a never-merged wontfix item this is either trivially true
     (take-time sha, already on main) or meaningless — not a real merge
     check either way.

   Confirms: even if the FSM edge existed, reusing the *same* `cleanup`
   verb for wontfix would be semantically wrong — its checks are built for
   the `delivered -> retrospective -> cleanup -> done` chain specifically.

3. `bin/fgos.mjs`'s `cleanup` case calls `cleanupMergedBranch(repoRoot,
   branch)` (`src/runner/merge.mjs:1336`) to do the actual deletion:
   `reclaimOrphanedCheckout` (worktree) + `git branch -D` (branch). This
   function is purely mechanical — no assertion that the branch was
   actually merged baked into it despite the name — so it is safely
   reusable by a wontfix-specific reclaim path too.

   `src/runner/loop.mjs`'s `startupReap` already runs a leftover-branch
   sweep (`listLeftovers`, ~line 440-461) independent of the FSM/cleanup
   verb: branches with `aheadCount === 0` get force-deleted; branches with
   commits ahead are explicitly **kept**, logged as "a proposal, never
   auto-deleted" — with no awareness of `wontfix` status at all. This is
   the exact site the 6 confirmed-orphaned wontfix worktrees fall through:
   they have real commits (`aheadCount > 0`), so this sweep keeps them
   forever, same as it would a live, still-open proposal branch.

**Cross-item finding (not a technical gap, a scope-coordination one):**
`docs/history/tsk-4dk-worktree-terminal-status-reclaim-gap/` — `tsk-4dk`
(currently also claimed, stage `discovery`) investigates a broader,
related problem: 305/317 `.claude/worktrees/` entries belong to
past-active items (221 retrospective, 41 delivered, 29 cleanup, 8 done, **6
wontfix** — the same 6 tsk-3of's own description cites), framed as
"execution gap (no cron running the existing retro/cleanup loops) vs.
structural throughput bottleneck" for the `delivered/retrospective/cleanup/
done` chain. That framing does NOT apply to wontfix's 6: per finding (1)
above, there is no verb/edge for wontfix to reach cleanup through in the
first place — scheduling a cron would not reclaim them. The two items are
not mutually exclusive (tsk-3of's fix stays needed regardless of tsk-4dk's
outcome), but a person should know about the overlap before either
proceeds further, to avoid a duplicated fix or scope confusion.

**Still open:** none blocking tsk-3of's own narrow scope (wontfix reclaim).
The tsk-4dk overlap is a coordination note, not a gap in tsk-3of's own
evidence.

**Verdict:** `clear`. Fix direction #1 (FSM edge) is foreclosed by a locked
decision; direction #2 (a dedicated, no-TTL-wait reclaim, extending
`startupReap`'s `listLeftovers` sweep in `loop.mjs` to also prune
`wontfix`-status branches/worktrees via the same `cleanupMergedBranch`
mechanics the real `cleanup` verb already uses) is evidenced as feasible
with no unresolved technical unknown. Verify: `node --test
test/runner/loop.test.mjs` (existing home for `startupReap`/
`listLeftovers` coverage).
