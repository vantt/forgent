# task-spec: resolve-question

domain: coding | role: researcher | reason: consult | requires-skill: fgos-researching

## Input
- ONE question, already narrowed by the caller — never a broad "look
  around and tell me about X". A vague question is the caller's own
  scoping failure, not something this task fixes by guessing.

## Output
- A grounded finding plus a `clear`/`unclear` verdict. Never a decision —
  research finds facts, it does not decide what to do with them. If the
  question turns out to require a product judgment rather than a fact,
  the verdict is `unclear` and the caller escalates via `advise` instead.

## Gates
- None.

## Verify-template
- N/A.

## Collaboration

| Trigger | Call | To | Reason | Bóng về mang |
|---|---|---|---|---|
| No trigger — this task never calls out; escalation of an unresolved question is the CALLER's job, not this one's | — | | | |
