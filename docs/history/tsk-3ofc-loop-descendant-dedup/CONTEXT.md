# CONTEXT.md — tsk-3ofc

## Feature boundary

`src/runner/loop.mjs`'s `hasStillNeededDescendant` (line 345) and
`src/state/frontier.mjs`'s `hasOpenDescendant` (line 314) both answer
"does this item have an open/still-needed descendant", but over
different resolved-status sets. The item originally proposed deleting
`hasStillNeededDescendant` and replacing its one call site
(`loop.mjs:457`) with `hasOpenDescendant`, on the claim the two are
semantically identical. Discovery-stage research
(`docs/history/tsk-3ofc-loop-descendant-dedup/RESEARCH.md`, round 1)
found that claim false: the two functions disagree on whether a
descendant sitting in `delivered`/`retrospective`/`cleanup` counts as
"still needed" — exactly the range behind a prior real incident
(tsk-577's 14-item false-positive block). `loop.mjs:331-343`'s own
docstring already says outright: "Do not consolidate this with
`hasOpenDescendant` — the two intentionally answer different
questions."

This item is now scoped down to: add an explicit, bidirectional
cross-reference comment between the two functions, so a future reader
scanning either one sees immediately that a lookalike exists elsewhere
and why they are not merged. No behavior change, no function deletion,
no call-site edit.

## Locked decisions

| D-ID | Quyết định |
|---|---|
| D1 | scope this item down to a comment-only cross-reference between loop.mjs's hasStillNeededDescendant and frontier.mjs's hasOpenDescendant, not the described function consolidation |

## Pinned terms

- **"still needed" (loop.mjs sense)** — a descendant whose `status` is
  anything other than `done`/`wontfix`. Broader than "open" below;
  includes `delivered`/`retrospective`/`cleanup`.
- **"open" (frontier.mjs sense, `isResolvedStatus`)** — a descendant
  whose `status` is not in `{delivered, retrospective, cleanup, done}`
  and is not canceled (`wontfix`). Narrower than "still needed" above.

## Scout evidence

- `src/runner/loop.mjs:86` — already imports `hasOpenDescendant`,
  `indexChildrenByParent` from `../state/frontier.mjs` (used elsewhere
  in the same file, `loop.mjs:443,448`, for the wontfix-branch-reclaim
  guard added by tsk-3of).
- `src/runner/loop.mjs:331-343` — the docstring above
  `hasStillNeededDescendant` already documents the divergence and
  explicitly warns against consolidating; this item's cross-reference
  comment reinforces this existing warning at the `frontier.mjs` side
  too, where no such pointer currently exists.
- `src/runner/loop.mjs:345-352` — `hasStillNeededDescendant`
  definition; its only call site repo-wide is `loop.mjs:457`
  (`startupReap`'s orphan-branch-pruning pass).
- `src/state/frontier.mjs:314-326` — `hasOpenDescendant` definition;
  `src/state/frontier.mjs:244,259-270` — `TAIL_RESOLVED_STATUSES`,
  `isCanceledStatus`, `isResolvedStatus`, the status sets that make the
  two functions diverge.
- `docs/history/wontfix-worktree-branch-reclaim/plan.md:86-91` —
  confirms `hasStillNeededDescendant` is load-bearing inside
  `startupReap`, adjacent to tsk-3of's own wontfix-branch-reclaim guard.
- Impact-analysis capability posture: `full` (GitNexus registered and
  `present`, `fgos tool query --capability impact-analysis --status
  present` returned one provider). Informational only — this is a
  two-line comment addition touching no call sites, so impact-analysis
  evidence is not load-bearing for this item's verify/test scope.

## Canonical references

- `docs/history/tsk-3ofc-loop-descendant-dedup/RESEARCH.md` — full
  discovery-stage research round establishing the divergence.

## Outstanding questions

None
