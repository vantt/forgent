# plan.md — tsk-2lc: move never forwards --answer, awaiting-human -> wontfix unreachable

Mode: small

1 flag (existing covered behavior — `test/cli/fgos-move.test.mjs` already
covers `move`'s own flag-forwarding shape for `--reason`/`--expect`). No
CONTEXT.md: discovery verdict was clear, and the item's own description
was corrected in place (re-scoped, not reopened — the prior FSM-table gap
this item originally reported is already closed by tsk-2ub; this item's
remaining scope is the CLI wiring gap found live this session).

## Approach

**Chosen path:** add an optional `--answer` flag to `move`'s CLI case
(`bin/fgos.mjs`), forwarded to `moveWork` exactly the same way `--reason`
already is — `optionalField`, ignored by `transitionWork`
(`status-fsm.mjs`) for every edge that doesn't require it, required (and
validated) only for the edges that do (today: any exit from
`awaiting-human`).

**Alternatives rejected:**
- *Adding a dedicated `move --to wontfix --from-awaiting-human` sub-verb*
  — rejected, unnecessary surface; `--answer` is already the exact field
  name `transitionWork`/`answerAwaiting` use, and `move` already forwards
  `--reason` the identical optional-per-edge way.
- *Widening `fgos answer` to accept a `--to wontfix` override* — rejected,
  would blur `answer`'s own single-purpose contract (always resumes to
  `todo`/`doing` per `statusAtAsk`) and duplicate `move`'s job.

**Risk map:** Light — one optional flag added to an existing verb; every
existing `move` call without `--answer` is byte-identical (the field is
`undefined`, `transitionWork` only requires it when `from ===
'awaiting-human'`, unchanged from before this item).

**Impact-analysis posture:** `degraded` (GitNexus present but stale, same
posture recorded for tsk-2xj this session).

## Shape

- `bin/fgos.mjs`'s `move` case: add `const answer = optionalField(...)`
  and forward it in the `moveWork(...)` call.
- `test/cli/fgos-move.test.mjs`: two new tests — `move --to wontfix` from
  `awaiting-human` succeeds with `--answer`; still refuses (unchanged
  message) without one.

**Concrete cases to prove against:**
- Empty/boundary: `move` with no `--answer` on an edge that doesn't need
  one (e.g. `todo -> doing`) — byte-identical to before this item.
- Existing behavior that must not regress: every existing `move` test
  (delivered/awaiting-approval guards) stays green.
- The actual bug case: `awaiting-human -> wontfix` with `--answer`
  succeeds; without it, refuses with the same `"answer" is required`
  message `transitionWork` already produces.

## Split decision

No split.

## Outstanding questions

None
