---
type: explanation
title: Why delivered events now record real merge provenance instead of being inferred
tags: [delivered, provenance, merge, events, iron-law]
source_capture_ids: [tsk-5dk]
authoritative_for: why fgOS started recording mergedSha and mergedInto on the delivered work.move event instead of inferring merge status from git ancestry
---
# Why delivered events now record real merge provenance instead of being inferred

`tsk-5dk`. Full root-cause analysis:
`plans/reports/root-cause-260812-2223-why-the-merge-audit-became-this-complex-report.md`.

## The measured gap

A scan of `.fgos/events.jsonl` found 352 `work.move → delivered`
transitions across 345 distinct items, and all 352 carried the exact
same payload shape — keys limited to `role`. Not one carried a merge
sha, a target branch name, or any other evidence. The practical
consequence: nothing in the system's own recorded data could tell a
real merge landed through `fgos approve` apart from a hand-run `fgos
move --to delivered` with nothing behind it.

This measured number is a snapshot (2026-08-12) that drifts with every
new delivery — the item's own description embeds the exact reproduction
script (scanning `.fgos/events.jsonl` for `work.move`/`to: delivered`
payload key shapes) specifically so a later reader re-measures rather
than trusts a stale count.

## This was the root cause of a recurring incident class, not a one-off

"Work reads `delivered` but never actually reached `main`" had already
happened at least three times: `tsk-4b2` (recovered by `tsk-13z`), then
`tsk-64h` and `tsk-2t5` together (recovered by `tsk-1l9`,
`docs/how-to/land-a-delivered-item-whose-branch-was-never-actually-merged.md`).
Each recovery was a one-off git-archaeology exercise, because there was
no recorded fact to check against — only inference.

## Why inferring from git ancestry, tried first, failed three separate ways

A same-session attempt to solve this by inference alone (rather than
recording new evidence) failed three rounds in a row, each round finding
a different false positive:

1. **"Branch not merged" does not mean "content lost."** The same
   content can have landed through a different path entirely.
2. **A merge commit has no patch-id.** `git rev-list --cherry-pick`
   structurally can never match a merge commit, so this approach counted
   every real merge as permanently not-landed.
3. **A branch can be many commits ahead with a tree identical to its
   fork point** — ahead in commit count while carrying nothing new at
   all.

These three traps are the reason inference from git state alone can
never be trustworthy for this question, and the reason this item exists
instead of a smaller "improve the drift check" fix.

## The fix: two halves, and a deliberate close-after-open ordering

**Half one — record the evidence.** `moveWork`
(`src/state/store.mjs:487`) already accepted an optional provenance
field list sharing one shape (`headAtTake`, `headAtReturn`,
`branchHeadAtTake`, `branchHeadAtReturn`). `mergedSha` and `mergedInto`
were added to that same shape — purely additive, no existing caller
broken — and both of `approve`'s call sites (`bin/fgos.mjs:2874` for the
local-merge path, `:3137` for the GitHub path) were wired to actually
pass them.

**Half two — close the back door, don't just add a new front door.**
`move --to delivered` now refuses when `fgw/<id>` exists and is not yet
reachable from trunk, unless an explicit override flag accompanies the
call *and* the reason is recorded to the decision log. The hand-run path
still exists for the genuinely legitimate case, but it stops being
silent.

## What this deliberately does not touch

- **No backfill of the 345 historical items.** Their real merge shas
  cannot be reconstructed reliably — branches get deleted, history gets
  rewritten — and a guessed sha is worse than an honest absence. This
  item scopes to new deliveries only.
- **The existing delivered-not-on-trunk check stays alive.** It is the
  only coverage that still applies to the historical data with no
  recorded sha. It can only be retired once every unresolved item
  actually carries one — not yet. A future reader should distinguish "no
  sha because historical" from "no sha because hand-typed" rather than
  treating both the same.
- **No change to the meaning of the existing provenance fields** —
  `mergedSha`/`mergedInto` are additive alongside `headAtTake`/
  `branchHeadAtReturn`, never a redefinition.
- **The GitHub transport path is untouched** beyond passing the two new
  fields at its one call site.

## The real payoff

"Has this actually reached `main`" changes from a git-ancestry inference
exercise — the exact kind of investigation `tsk-13z` and `tsk-1l9` each
had to redo by hand — into a direct lookup for every item delivered from
this point forward. Because `src/state/store.mjs` and `bin/fgos.mjs` are
both touched, this item cleared the Iron Law gate with failing-test-first
evidence written from the start, rather than assembled after the fact —
named explicitly in the item's own scope notes as the gap several of the
existing Iron Law evidence files (5 of 181 at the time) had themselves
already confessed to.

## Related

- `docs/how-to/land-a-delivered-item-whose-branch-was-never-actually-merged.md`
  — the recovery playbook for exactly the incident class this item's
  own root-cause fix prevents going forward
- `docs/explanation/why-fgos-added-sync-root-and-drift-detection.md` —
  the adjacent, still-needed drift-detection mechanism for the
  root-vs-main branch-tree case, a different failure mode from a bare
  hand-typed `delivered`
