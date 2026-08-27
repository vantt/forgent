---
type: explanation
title: Why fgOS keeps growing the same decision logic in more than one place
tags: [choke-point, claim, worktree, verify]
timestamp: 2026-07-29T07:01:26.000Z
source_capture_ids: [tsk-1ab, tsk-1ab-1, tsk-1ab-2]
framework: diataxis
mode: explanation
---
# Why fgOS keeps growing the same decision logic in more than one place

`tsk-53f` confirmed one instance of a pattern: claim + worktree-isolation
logic had drifted into 3 independent implementations (`take`/`pick` vs the
runner) before being unified into `claim-port.mjs`. `tsk-1ab` asked the
broader question: is that an isolated accident, or does fgOS keep doing
this? The answer, after reading every call site rather than trusting
name-similarity: both. Some "duplicates" are already correctly
centralized; a few real ones exist, and they share a shape.

## The shared shape

Every confirmed choke-point in this survey
(`docs/decisions/0022-fgos-choke-point-survey.md`) has the same anatomy:
a low-level primitive IS shared (the append-write door, `createWorktree`
itself, `claimWork`), but a higher-level *decision* sitting just above
that primitive — "is this eligible to claim," "is this tree clean," "what
baseRef and cleanup does this call need" — gets re-derived separately at
each call site instead of asked once through a shared gate.

That is precisely why the naive survey approach (grep for matching
function names, assume duplication) would have been wrong on 4 of the 7
original candidates: `runGoalCheck`, `assertValidDocType`, the
`docsRef`-validating `optionalField` helper, and the locked
`withEventsLock`/`appendEventLocked` write door are all *already* single,
shared primitives. The choke-points that are real live one layer above
the primitive, in the per-call-site judgment wrapped around it — not in
the primitive itself.

## The clearest case: `take` vs `pick`

`take` and `pick` both delegate the actual state write to the same
`claimWork` — tsk-53f's own fix. But each verb still asks its own
separate question first, "is this id allowed to be claimed right now,"
and answers it differently: `take` inherited the frontier-membership
guard as a hard check; `pick` had that guard deliberately removed so
clarify/decompose items could claim through it too. Both are *individually*
reasonable — but nothing forces them to stay reasonable together, and
`fgos-routing`'s own prose never noticed `pick`'s exception, so it still
tells a reader to use the verb that was never loosened.

## What this means for fixing them

None of the 3 confirmed choke-points were fixed as part of this survey —
by design (see `docs/reference/fgos-choke-point-ranked-priority.md`'s "No
fixes applied" close, and `tsk-53f`'s own precedent of splitting
discovery from repair). Each was filed as its own backlog item, title
prefixed `Choke-point:`, so the actual unification work can be scoped,
reviewed, and verified independently — the same discipline this survey
itself insisted every candidate pass before being counted as real.

## Related

- `docs/decisions/0022-fgos-choke-point-survey.md` — full candidate-by-candidate
  evidence.
- `docs/how-to/claim-a-clarify-or-decompose-stage-item.md` — the
  actionable fix for the `take`/`pick` case specifically.
- `docs/reference/fgos-choke-point-ranked-priority.md` — the ranked table.
- `plans/reports/choke-point-investigation-260728-1717-claim-worktree-report.md`
  (`tsk-53f`) — the original instance of this pattern.
