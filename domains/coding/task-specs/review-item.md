# task-spec: review-item

domain: coding | role: reviewer | reason: review | requires-skill: fgos-coding-validating

## Input
- A diff and its own `verify` result, for an item that has reached the
  executing-stage `review` edge (`return` → `awaiting-approval`, or a
  direct `handoff --reason review`).

## Output
- A verdict (approve / reject) and, on reject, findings specific enough
  for the implementer to act on without a follow-up round — never a bare
  "looks off".

## Gates
- None owned here — the outer approve/merge gate (CTR005, hard, D5) is a
  separate mechanism this task's verdict feeds into, never replaces.

## Verify-template
- N/A — this task judges an existing verify result, it does not design a
  new one.

## Collaboration

| Trigger | Call | To | Reason | Bóng về mang |
|---|---|---|---|---|
| A pattern/precedent in the diff needs a fact this reviewer cannot resolve from context in hand | consult (sync) | researcher | consult | finding |
| A finding touches product scope, not implementation correctness | advise (async) | advisor | advise | answer, folded into the review verdict |
| No trigger matches | — render the verdict — | | | |

Multiple executors may claim this task-spec (a human via the approve
verb, `/code-review`, or a future reviewer-agent whose `claims` names it)
— the contract above is what all of them owe, regardless of who holds it.
