---
type: explanation
title: Why /fgOS:discover claims via fgos pick instead of fgos take
tags: [discover, worktree, claim-timing, fgos-coding-driving, branch-isolation]
timestamp: 2026-08-20T00:00:00.000Z
source_capture_ids: [tsk-20p]
authoritative_for: fgos-discover claim-via-pick-not-take
---

# Why `/fgOS:discover` claims via `fgos pick` instead of `fgos take`

`tsk-20p` is the item that fixed `/fgOS:discover`'s own step 2 claim
mechanism: it used to claim an item via `fgos take --role session`, which
only flips `status` to `doing` and never creates or enters a worktree. So
when `fgos-coding-exploring` wrote and committed its own `CONTEXT.md`
during a `discover`-driven session, that commit landed directly on the
main checkout — no `fgw/<id>` branch existed yet to receive it.

## The same bug class, a separate flow, deliberately not conflated

This is the same defect class already fixed twice elsewhere the same day —
`fgos-coding-shaping` (`tsk-5qs`, `6abea4bc`) and `/fgOS:cook`
(`tsk-hes`, see `docs/explanation/fgos-cook-worktree-claim-before-drive.md`)
— but `/fgOS:discover` is its own separate launcher/flow with its own item,
not folded into either sibling fix. The person driving this work was
explicit about keeping the three scoped separately rather than generalizing
into one wider change, per `tsk-20p`'s own plan.md: *"Leave `discover`
as-is, only fix `cook`/`shaping` — rejected per the user's own explicit
direction: `discover` is its own flow with its own item... separate from
`tsk-hes` (cook) and `tsk-5qs` (shaping, already shipped)."*

## The fix: `fgos pick` + `EnterWorktree`, not `fgos take` plus a fallback

`plugins/fgOS/skills/discover/SKILL.md`'s step 2 replaced its
`fgos take --role session` call (and the branch-already-exists fallback
paragraph that used to sit alongside it) with a direct `fgos pick
$ARGUMENTS --dir "$root"` call, then `EnterWorktree` into the returned
`data.worktree.path` — the same pattern `/fgOS:pick`'s own steps 2/4
already use. The plan's own reasoning for not doing this as two separate
calls (`take` then a bolted-on worktree-entry step) is direct: *"`pick`
already does claim+worktree atomically; splitting it into two calls
duplicates what `pick` is for, and reintroduces the exact
branch-already-exists fallback logic `pick` itself already handles
internally"* — confirmed live in the same session, where a second `pick`
call on an already-branched item returned `worktree.reused: true` rather
than erroring. Step 3 (dispatch through `fgos-coding-driving`) needed no
change: the driver's own claim-timing rule already skips claiming again
once it sees `status: doing`.

## Concrete effect

A fresh `/fgOS:discover <id>` call on a `todo` item now ends up inside that
item's own `fgw/<id>` worktree before `fgos-coding-discovering`/
`fgos-coding-exploring` ever writes a file — so an `unclear` discovery
verdict's `CONTEXT.md` commit lands on `fgw/<id>`, never on `main`.
Re-running `/fgOS:discover` on an item already claimed by the same session
(`status: doing`) does not re-claim or error, matching the driver's
existing claim-timing contract.

## Outcome

Landed `awaiting-approval`, light tier, first attempt, ahead by 2 commits,
no friction recorded. `fgos graph --json` confirmed the item sat in its own
size-1 component (no deps, no children) — not on any critical path, hence
`tiny` mode with no split. Verify followed the two-sided skill-prose shape:
`npm test && grep -q "fgos pick $ARGUMENTS --dir" ... && ! grep -q "fgos
take $ARGUMENTS --role session --dir" ...`.

---

**Source:** `docs/history/fgos-discover-claim-via-pick/plan.md`; work-item
capture via `fgos check tsk-20p`.
