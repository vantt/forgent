# task-spec: lock-decisions

domain: coding | stage: exploring | role: implementer | requires-skill: fgos-coding-exploring

## Input
- An item at stage `exploring` (unclear discovery verdict) with `refs`.
- Any prior `judgeDiscovery` question already recorded (never re-asked).

## Output
- `docs/history/<feature>/CONTEXT.md`: feature boundary, a D-ID decisions
  table, pinned terms, scout evidence and citations, canonical references.
- The doc MUST end with a literal `## Outstanding questions` heading —
  `hasOpenItems` (`src/state/gate-bypass.mjs`) regexes this exact heading
  to decide whether the `contextApprove` gate below can auto-approve.
- Each locked decision also lands as a real `fgos decision --id <item>`
  call the moment it stabilizes — CONTEXT.md stays the source of truth,
  the decision call only makes its existence visible to machine readers.

## Gates
- `contextApprove` — auto-approves per `gate-bypass` level when the hard
  keyword floor is clear, the item's tier is covered, and
  `## Outstanding questions` reads `None`; otherwise asks the person once,
  batched, showing the locked decisions and the specific open question.

## Verify-template
- N/A — this stage produces a decision doc, not a code artifact.

## Collaboration

| Trigger | Call | To | Reason | Bóng về mang |
|---|---|---|---|---|
| A named library/API/concept the session cannot resolve from context surfaces mid-Socratic-lock | consult (sync) | researcher | consult | finding + clear/unclear |
| A candidate question passes material/grounded/answerable and cannot wait for the person to return later | advise (async) | advisor | advise | answer, locked as a new D-ID |
| No trigger matches | — pin as an assumption or defer to `shape-plan` — | | | |
