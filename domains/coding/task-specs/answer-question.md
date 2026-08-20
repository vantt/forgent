# task-spec: answer-question

domain: coding | role: advisor | reason: advise | authority: product-decisions | requires-skill: fgos-coding-exploring

## Input
- A question that has already passed the material/grounded/answerable
  filter — cites scout evidence, and the answer would actually change
  scope, behavior, data shape, or acceptance criteria.

## Output
- An answer, folded back into whatever artifact (`CONTEXT.md`, `plan.md`,
  the discovery verdict) the question came from, and recorded as a
  decision when it locks something durable.

## Gates
- None owned here — this task IS how several other tasks' own gates
  (`contextApprove`, `validateApprove`) resolve to a real answer instead
  of parking indefinitely.

## Verify-template
- N/A.

## Collaboration

| Trigger | Call | To | Reason | Bóng về mang |
|---|---|---|---|---|
| No trigger — no skill exists for this task today; its executor is a person via `fgos ask`/`answer`, and it makes no calls of its own | — | | | |
