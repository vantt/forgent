# plan — context-md-enforcement-scope (tsk-47e)

## Mode

**tiny** — 0 flags apply (no auth, no authorization, no data-model change,
no audit/security surface, no external system, no public-contract change,
no cross-platform concern, no existing covered behavior touched, no weak
proof area, single domain). The entire deliverable is the decision doc
itself (`CONTEXT.md`), already written and committed — no code changes.

## Approach

None needed beyond what `fgos-coding-exploring` already produced. `CONTEXT.md`
(D1-D4) is the full deliverable this item promises (per its own
description: "KHÔNG code trước khi chốt phạm vi" / verify checks only the
doc's shape + `npm test` staying green). No files touched other than the
decision doc and one doc addendum (`docs/explanation/fgos-capture-points-
and-the-why-gap.md`, tsk-42i's gap note, already committed in the same
commit).

Impact-analysis capability gate (`fgos tool query --capability
impact-analysis --status present`): 1 provider, `gitnexus`, `present` →
posture **full**. Not actually load-bearing here since no code/symbol is
touched — recorded for completeness per this skill's own rule.

## Proof point

- `npm test` stays green (no code changed, so this is a smoke check, not a
  new-behavior proof).
- The verify command already on the item (`docs/history/context-md-
  enforcement-scope/CONTEXT.md` exists, has `## Locked decisions`, a
  `D<N>` row, mentions clarify/decompose, mentions hard/soft/block/warn) —
  all satisfied, confirmed by direct read of the committed file.

## Split

None — one honest piece, already done. No children.

## Assumptions

- The follow-up item (D4: writing the actual precondition-check code) is
  out of this item's scope entirely, not an unproven assumption inside
  it — it is explicitly deferred in `CONTEXT.md` itself, not silently
  smuggled into this plan.
