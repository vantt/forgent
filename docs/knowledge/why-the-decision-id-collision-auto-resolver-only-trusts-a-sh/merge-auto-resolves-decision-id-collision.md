---
type: explanation
title: Why the decision-ID-collision auto-resolver only trusts a shared link target, not a shared id, to detect an edit dispute
tags: []
timestamp: 2026-07-30T00:35:06.723Z
source_capture_ids: [tsk-3mv-1]
framework: diataxis
mode: explanation
---
# Why the decision-ID-collision auto-resolver only trusts a shared link target, not a shared id, to detect an edit dispute

`mergeRunnerItemLocked` (`src/runner/merge.mjs`) now attempts one specific,
proven-real recovery before aborting a conflicted merge: the decision-ID
collision `docs/how-to/resolve-a-decision-id-collision-merge-conflict-on-approve.md`
already documents by hand (`tsk-66l`'s real occurrence). This traces the one
design decision in that implementation most likely to bite a future reader —
why the classifier's first version was wrong, and what the real fix was.

## The shape being auto-resolved

Two branches independently pick the same "next free" decision id and each
insert their own new row into `docs/decisions/0000-index.md` at the same
position, under two *different* files. `classifyDecisionIndexCollision`
recognizes this by requiring: the ONLY conflicted path is the index file,
every conflict hunk is a pure two-sided insertion (both sides non-empty, no
identical line shared), and every inserted line matches the index's own row
shape. When it matches, `autoResolveDecisionIndexCollision` renumbers the
incoming branch's colliding file(s) to the real next-free id (never
touching `HEAD`'s own numbering — `HEAD` is always treated as already-
authoritative, the same "find the real next-free ID from main" step the
how-to's step 2 already does by hand) and merges both rows into the index,
sorted numerically.

## The bug caught before it shipped: id-equality is not enough

The first version of the classifier checked only whether the two sides'
inserted rows referenced the *same 4-digit id number* to decide "this is a
collision, safe to auto-resolve." That is wrong, and dangerously so: a
**same-row edit dispute** — both branches independently changing the title
text of the *same existing* row (id `0021` in both, say) — produces exactly
the same superficial shape a real insertion collision does: two non-empty,
non-identical lines, both matching the row regex, both citing the same id.
An id-only check would have auto-"resolved" that dispute by keeping BOTH
edited versions as if they were two different decisions — silently
duplicating one decision under one id, exactly the "silently keeps wrong
content" failure the plan's risk map (`docs/history/tsk-3mv-merge-loop-
self-resolve/plan.md`, D1a's High-risk row) named as the reason this whole
item is `high-risk` mode, not `standard`.

The fix: compare the **link target** (the `(file.md)` half of each row,
not the `[NNNN]` half). A genuine insertion collision always links to two
different files — each side wrote its own new decision doc that happened to
land on the same next-free number. An edit dispute always links to the
*same* already-existing file on both sides, because a "row" is really just
a rendering of that one file's own entry. Any link target shared between
`oursLinks` and `theirsLinks`, at any hunk, now bails the whole
classification to `null` — the caller's only path from there is the
pre-existing abort-and-report `conflict` outcome, exactly as if this
feature had never been added.

Both shapes are pinned down by real, run tests in
`test/runner/merge.test.mjs` (`node --test test/runner/merge.test.mjs`, all
passing at commit time):
- a genuine collision (two different files, same next-free id) — resolves,
  renumbers, keeps both rows;
- a purely positional collision (two different files, two *different*
  ids that just happened to insert at the same line) — resolves without
  any renumbering;
- a same-row edit dispute (shared link target) — `classifyDecisionIndexCollision`
  returns `null`, `mergeRunnerItem` falls straight to `outcome: 'conflict'`,
  `HEAD` byte-for-byte unchanged;
- the same collision shape but with an *additional* unrelated conflict
  outside `docs/decisions/0000-index.md` — also never self-resolved, since
  the classifier requires the conflicted path set to be exactly one file.

## Why this trips Iron Law on its own merge

`src/runner/merge.mjs` matches the `src/runner/` prefix rule in
`src/evolve/iron-law.mjs`'s `MODULE_RULES` — this item's own diff requires
`--acknowledge-iron-law` from a real human operator before it can be
approved (RUL34/RUL37, `docs/specs/runner.md`; CONTEXT.md D2, unchanged and
unaffected by this item). That is treated as an expected cost, not a defect
to route around: the same test suite quoted above IS the failing-test-first
proof the human operator is expected to have already confirmed before
running that flag.

## The real outcome this synthesis traces to

> `{"id":"tsk-3mv-1","predicted":{"tier":"standard","deps":0,"priorVisits":0,"role":"session","branchHeadAtTake":"8e2afb2867477816e03d698b005b303b4626b0df"},"actual":{"outcome":"awaiting-approval","passed":true,"attempts":1,"errorClass":null,"aheadCount":1}}`
> — real `work.outcome` capture, id `tsk-3mv-1`

`return`'s own re-verify (`node --test test/runner/merge.test.mjs && npm
test`) passed on the first attempt — 45/45 in the targeted file, 1706/1711
(5 pre-existing skips, 0 fail) across the full suite.

## Related

- `docs/how-to/resolve-a-decision-id-collision-merge-conflict-on-approve.md`
  — the real, by-hand occurrence (`tsk-66l`) this item automates.
- `docs/history/tsk-3mv-merge-loop-self-resolve/CONTEXT.md` and `plan.md` —
  the locked decisions and risk map this item executed against, including
  the pinned "self-resolvable merge-conflict" boundary this doc's fix
  keeps honest.
- `tsk-3mv-2` — the sibling item covering the other, judgment-based half of
  D1 (`merge-loop` self-diagnosing `verify-fail-post-merge`).
- `docs/explanation/merge-idempotent-on-already-merged-branch.md` — the
  prior fix to this same file (`isAlreadyMerged`), the precedent this
  item's own "never skip the real check" discipline follows.
