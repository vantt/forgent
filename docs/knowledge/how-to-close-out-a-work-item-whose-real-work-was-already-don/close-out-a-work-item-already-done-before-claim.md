---
type: how-to
title: How to close out a work item whose real work was already done before this claim
tags: []
timestamp: 2026-07-30T08:39:01.707Z
source_capture_ids: [tsk-4on]
framework: diataxis
mode: how-to
---
# How to close out a work item whose real work was already done before this claim

Use this when `fgos return <id>` refuses with "branch has not advanced past
branchHeadAtTake" (or "HEAD has not advanced past headAtTake"), but the item
is genuinely finished — the work was committed on its branch/HEAD *before*
this particular claim happened, so there is structurally no room left for a
"new" commit.

## Why this happens

`fgos return <id>` requires the branch/HEAD to have advanced past
`branchHeadAtTake`/`headAtTake` — the value stamped at claim time — before it
runs verify and settles the item. This is a deliberate anti-cheat gate that
forces real new work between claim and return. It breaks for a legitimate
case:

> "an item whose real work was already fully committed on its branch
> *before* this particular claim happened (e.g. a parent item whose children
> are already `done`/`compound-learn` and whose merged content already sits
> on the parent's own branch from a prior session). `claimWork`
> (`src/runner/claim-port.mjs`) stamps `branchHeadAtTake`/`headAtTake` to the
> branch's live tip at claim time regardless, so there is structurally no
> room left for 'a new commit' — `return` refuses forever, even though the
> work is genuinely finished and verify would pass right now."
> — `docs/history/return-close-pre-done-work/CONTEXT.md`

Confirmed repro: a parent item with 4 children already `done`/`compound-learn`,
branch work completed in a prior session, re-picked, and an immediate
`return` refused with the same "branch has not advanced" error.

The old workaround — `fgos move <id> --to proposed` directly — bypasses
`return` entirely, so it never calls `addOutcome`: the item is left with
`actual: null` forever, permanently surfaced by `collectMissingOutcomeNag`.

## Steps

1. **Confirm the work is really already done, not just stuck.** Check the
   branch/HEAD content directly — if it already satisfies verify with zero
   new commits since claim, this is the right path. If verify would
   currently fail, this is not a "close it out" case; fix the real problem
   first.

2. **Run `return` with the escape-hatch flag:**

   ```
   fgos return <id> --no-new-commits-ok
   ```

   This skips *only* the "branch/HEAD has not advanced" refusal — verify
   still runs through the exact same path as a normal `return`. A pass
   settles the item to `awaiting-approval` (recording `actual.aheadCount:
   0`); a fail still parks it `doing -> blocked` with friction, exactly as
   an ordinary `return` would.

3. **If it refuses with "cannot use --no-new-commits-ok — this item was
   previously blocked by a failed verify"**, the flag is not for you: it
   only closes out work that was **never returned at all**. It can't rescue
   a retake that already failed verify once — that gate checks the item's
   entire outcome history, not just the current claim, and survives an
   intervening retake. Commit new work and retry `return` normally instead.

## Default behavior is unchanged

Without the flag, `return` refuses exactly as before — commit the work on
the branch before returning. The flag only exists to open a legitimate,
book-keeping-correct closing path for work that was genuinely finished
before the claim that's now trying to return it.

## Related

- `docs/history/return-close-pre-done-work/CONTEXT.md` and
  `plan.md` (`tsk-4on`) — the full locked-decision record and design
  rationale for this flag (D1: new flag, not an extension of the
  `claim-reclaim-branchhead-reset` marker mechanism; D2: gated on no prior
  `blocked` outcome; D3: covers both branch-sourced and main-sourced
  claims).
- `docs/how-to/diagnose-a-blocked-return-from-an-unrelated-verify-failure.md`
  — for the different case where `return` itself fails for an unrelated
  reason, not this "no room for a new commit" shape.
