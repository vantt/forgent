---
type: how-to
title: How to claim an item that is still at stage `clarify` or `decompose`
tags: []
timestamp: 2026-07-29T03:25:44.000Z
source_capture_ids: [tsk-1ab-1, choke-point-take-vs-pick-claim-eligibility, tsk-65n]
---
# How to claim an item that is still at stage `clarify` or `decompose`

Use this when you need to start `fgos-coding-exploring` or `fgos-coding-planning` work on
an item that has not yet reached the frontier (`fgos ready`) — i.e. its
`stage` is `clarify` or `decompose`, not `executing`.

## Before you start

- You need the item's id (`fgos list` shows every item's `stage`).
- This applies to a fresh session about to do clarify/decompose work.
  Re-claiming an item whose claim was already released once is the separate
  case below.

## Steps

1. **Either `fgos take --id <id>` or `fgos pick --id <id>` works.** Both
   verbs' explicit `--id` branch accept an item outside the frontier — the
   choice is about worktree isolation, not eligibility:

   ```
   fgos take --role session --id <id>
   ```

   claims in place, on the main checkout, no worktree created. `fgos pick
   --id <id>` claims AND stands up the item's isolated `fgw/<id>` worktree
   in the same call. Pick `take` when you want to stay in the main
   checkout; pick `pick` when you want the isolated worktree.

2. **Either way, an unmet dependency or an open decomposed child still
   refuses the claim.** Stage never bypasses those two — only the
   `executing`-only stage gate is stage-independent for an explicit `--id`
   claim.

## Re-claiming after the claim is released at the `executing` boundary

A claim held through `clarify`/`decompose` is released back to `todo` the
moment the item reaches stage `executing` (`releaseClaimOnExecuting`, the
claim-lock §3b lifecycle) — including the common case where the session that
held it is still sitting in the item's worktree and wants to keep going.

**Use `fgos pick <id>` to re-claim.** It reattaches: same `fgw/<id>` branch,
and the same worktree if that checkout is still standing — clean or dirty,
untouched either way, uncommitted work included.

**Do not use `fgos take` for this.** It refuses, on purpose: the work lives
on `fgw/<id>`, but a main-checkout take would record `source: main` and a
`headAtTake` pointing at the main checkout's HEAD, which that work never
advances. The claim itself would look fine and the damage would only appear
later, as a `return` that refuses to believe any progress was made. The
refusal names `pick` so you don't have to remember why.

The older workaround — `fgos move <id> --to blocked --expect todo`, then
`fgos take`, to reach the branch-take path — is no longer needed. Avoid it:
outside a §3b release (after a reject, or a verify-fail park) that route
recomputes `branchHeadAtTake` to the branch's live tip, which is a
deliberate gate there, and using it as a re-claim shortcut resets the
baseline your earlier commits were measured against.

## Why this used to be one door only

`take` and `pick` both delegate the actual claim write to the same
`claimWork` (`src/runner/claim-port.mjs`, unified per `tsk-53f` D1) — but
each verb gated *before* that call with its own separate eligibility
check, and until `choke-point-take-vs-pick-claim-eligibility` fixed it, the
two checks disagreed for an item outside the frontier: `take --id <id>`
hard-rejected any `todo` item not in `readyWork()` (the frontier —
`executing`-stage-only by definition), while `pick --id <id>` had no such
check at all. `fgos-routing`'s own "Claim" section always told a reader to
`take --id <id>` for exactly the case that call rejected —
`plugins/fgOS/skills/cook/SKILL.md`'s "Known gap" section is the prior,
narrower workaround written before this was fixed.

The fix (`bin/fgos.mjs`'s `take` case) made the explicit `--id` branch
check `isDepsAndLineageReady` (`src/state/frontier.mjs`) instead of full
frontier membership — deps-done and no-open-descendant still gate the
claim, exactly as before, but the `executing`-only stage requirement no
longer does, matching `pick`'s own already-established stance that stage
and status are independent axes (`fsm.mjs`) for an explicit, deliberate
claim.

## Real example

`tsk-1ab` was claimed via `pick tsk-1ab` while still at stage `clarify`
(no `--id` needed here since it was already the frontier-adjacent target
of an earlier `/fgOS:pick tsk-1ab` invocation). The claim event:

> `{"id":"tsk-1ab","from":"todo","to":"doing", ...}` — real claim event,
> seq 502, item stage `clarify` at claim time (confirmed via `fgos list`
> immediately after: `"stage": "clarify"`).

At the time, the same claim attempted with `fgos take --id tsk-1ab`
instead would have been rejected outright, since `tsk-1ab` was `todo` and
not yet in `readyWork()` — this is exactly the gap
`choke-point-take-vs-pick-claim-eligibility` closed.

## Resuming an item you already claimed

The "not to resuming an item you already claimed" caveat above described a
real gap: `pick <id>` re-claiming an item whose `fgw/<id>` branch (and often
a live worktree still checked out on it) already existed used to destroy or
refuse that live checkout instead of resuming it. `tsk-65n` closed this gap
directly in `pick`'s branch-reuse path, so `pick <id>` is now also the
correct re-claim door for an item you already worked on.

**When this comes up:** an item held at stage `decompose` is released back
to `status: todo` the moment it reaches stage `executing` (the "claim-lock
§3b release", `src/intake/plan.mjs`'s `releaseClaimOnExecuting`,
`docs/specs/runner.md:163-168`) — precisely so the same or another session
can claim it again for the executing phase on the same branch. Re-running
`pick <id>` at that point is the intended, routine door.

**What changed:** before this fix, going through `pick`'s existing
branch-reuse path force-removed the live checkout when it was clean, or
hard-refused with a data-loss error when it was dirty — either way it broke
a session still sitting in that worktree. Now, a claim whose `fgw/<id>`
checkout is still standing gets that same checkout back, untouched:

> REATTACH (tsk-65n): a claim whose `fgw/<id>` checkout is still standing
> gets that same checkout back, untouched. The case is routine rather than
> exotic — an item's claim is released back to `todo` the moment it reaches
> stage `executing`, and the session that held it then claims it again to
> do the work, from inside the very worktree the claim stands up.
> (`src/runner/worktree.mjs`'s `createClaimWorktree`/`reattachableCheckout`)

Cleanliness of the existing checkout does not matter for this path — nothing
is removed, so there is nothing to protect against by refusing a dirty tree.
A checkout with uncommitted work is exactly the session that most needs to
resume where it left off. (The reclaim data-loss guard that force-removes a
clean checkout or refuses a dirty one is untouched for every *other* caller
— runner dispatch and the merge-ephemeral worktree still get a fresh
directory on purpose, so a retry never builds on a previous attempt's
debris.)

**A related, separate refusal:** `take --id <id>` (as opposed to `pick
--id <id>`) still does not reattach — and now refuses outright, rather than
silently mis-claiming. If a `todo` item's `fgw/<id>` branch already exists,
`take` reports a non-zero-exit error naming `pick` as the correct door,
instead of quietly recording a `source: main` claim whose real work lives on
the branch (a mis-claim that used to only surface later as a confusing
`return` refusal, "HEAD has not advanced past headAtTake").

## Related

- `docs/decisions/0022-fgos-choke-point-survey.md` — the fuller survey this
  finding came out of (`tsk-1ab`), including two other confirmed
  choke-points (`isWorkingTreeClean` duplication, `createWorktree` call-site
  divergence) and candidates checked and ruled out.
- `test/cli/take-pick-claim-eligibility.test.mjs` — regression coverage
  locking in the fixed behavior (stage-independent explicit `--id` claim,
  deps/lineage guard preserved).
- `plans/reports/choke-point-investigation-260728-1717-claim-worktree-report.md`
  (`tsk-53f`) — the original claim/worktree-isolation choke-point this
  survey's D2 explicitly re-verified rather than reused.
- `docs/explanation/orphaned-worktree-reclaim-must-check-for-live-uncommitted-work.md`
  — the tsk-1os data-loss guard the resuming section above leaves fully
  intact for every reclaim caller other than the claim-isolate path.
- `docs/history/pick-reattach-live-worktree/CONTEXT.md` (`tsk-65n`) — the
  locked decisions behind the reattach fix, including why it lives in
  `createClaimWorktree` rather than `createWorktree` itself (so the
  runner's own retry path keeps getting a fresh worktree on purpose).
