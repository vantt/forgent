---
type: how-to
title: How to claim an item that is still at stage `clarify` or `decompose`
tags: []
timestamp: 2026-07-29T03:25:44.000Z
source_capture_ids: [tsk-1ab-1, choke-point-take-vs-pick-claim-eligibility]
---
# How to claim an item that is still at stage `clarify` or `decompose`

Use this when you need to start `fgos-exploring` or `fgos-planning` work on
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
