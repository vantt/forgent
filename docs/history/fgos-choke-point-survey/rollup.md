# Rollup: fgOS choke-point survey (tsk-1ab)

Both children of `tsk-1ab` are done and merged into `fgw/tsk-1ab`; this
rollup closes the parent's own record — `CONTEXT.md`/`plan.md` cover the
locked decisions and shape, this file covers what the two pieces of real
execution actually produced.

## What ran

- **`tsk-1ab-1`** (discover + confirm candidates) — done, merged. Wrote
  `docs/decisions/0022-fgos-choke-point-survey.md`'s `## Candidates`
  section and `docs/how-to/claim-a-clarify-or-decompose-stage-item.md`.
- **`tsk-1ab-2`** (rank + close) — done, merged. Added `## Ranked
  priority`/`## No fixes applied` to the same decision doc, plus
  `docs/reference/fgos-choke-point-ranked-priority.md`.

## What was found

3 choke-points confirmed real (call-site evidence, not name-similarity
guesses):

1. `take` vs `pick` disagree on claim eligibility for an item outside the
   frontier — the highest-risk, highest-frequency finding: it breaks
   `fgos-routing`'s own documented claim example.
2. `isWorkingTreeClean` reimplemented separately for `return` (subtree
   scope) and `approve` (whole-repo scope).
3. `createWorktree`'s 6 call sites each own `baseRef`/cleanup separately
   (re-verified `tsk-53f`'s original finding fresh, per **D2**).

4 candidates checked and ruled out (already centralized, confirmed by
reading the shared implementation): verify run/timeout, `docType`
validation, `docsRef` validation, low-level `events.jsonl` append.

## What got filed

Per **D2**/the item's own scope (discover + rank, never fix inline), the
3 confirmed choke-points were each filed as their own backlog item —
title-prefixed `Choke-point:` — once this session's actual audit work was
done:

- `choke-point-take-vs-pick-claim-eligibility` (risk: standard)
- `choke-point-workingtree-clean-duplication` (risk: standard)
- `choke-point-createworktree-callsite-wrapper` (risk: light)

Each carries `refs` pointing at `docs/decisions/0022-fgos-choke-point-survey.md`
plus the real file:line citations gathered during the survey, and a real
`verify` command (a `node --test` path an implementer creates as part of
the fix) — never a placeholder.

## Note on closing this item

Re-claiming `tsk-1ab` itself *after* both children had already merged
left `branchHeadAtTake` equal to `fgw/tsk-1ab`'s current HEAD — `return`'s
real-progress gate (branch must advance past the claim-time snapshot) had
nothing to check against, since all of this item's real work already
landed through the children's own merges. This file is that missing
real, non-fake commit: a genuine synthesis of what the two children
produced, not a filler commit made only to satisfy `return`. Whether
`return`'s gate should special-case a decompose-only parent whose work is
entirely delegated to children is a separate, smaller engine question —
left for whoever picks it up next, not solved here.
