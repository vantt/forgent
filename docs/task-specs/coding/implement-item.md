# task-spec: implement-item

domain: coding | stage: executing | position: implementer

## Input
- `plan.md`, already validated (`READY`/`READY WITH CONSTRAINTS`).
- `CONTEXT.md`'s locked D-IDs.
- A clean worktree on `fgw/<id>`, claim held.

## Output
- Code (and test) changes matching the plan's own file list, one commit
  (or a small coherent sequence) on `fgw/<id>`.
- The item's own `verify` command running green.

## Gates
- Soft: `executing → planning` (re-plan) — re-crossable, but the reason
  must be recorded (D5).
- Hard: `approve`/`merge` into main (CTR005) — one-way; rework after this
  point is a new item, never a reopen.

## Verify-template
- The item's own `verify` field, a real runnable command (`npm test`, or
  a narrower scoped command for a tiny/small item) — never a placeholder
  at return time.

## Collaboration

| Trigger | Call | To | Reason | Bóng về mang |
|---|---|---|---|---|
| A named library/API/pattern surfaces mid-implementation that cannot be resolved from context in hand | consult (sync) | researcher | consult | finding |
| An independent scoped subtask exists whose footprint does not touch the file(s) currently being edited | assist (sync) | helper | assist | work product + diff |
| `verify` is green, or the change touches a HIGH-risk area | review (async) | reviewer | review | verdict + findings |
| A product decision outside the locked D-IDs is needed, and the question passes material/grounded/answerable | advise (async) | human-advisor | advise | answer, recorded as a decision |
| No trigger matches | — continue implementing — | | | |
