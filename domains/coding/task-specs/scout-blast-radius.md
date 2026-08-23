# task-spec: scout-blast-radius

domain: coding | role: researcher | reason: consult | requires-skill: fgos-researching

## Input
- A symbol, file, or change description whose downstream impact needs
  naming before an edit.

## Output
- A list of direct callers, affected processes, and a risk read. When
  the impact-analysis capability posture (`CLAUDE.md`'s gate) is
  `degraded` or `inactive`, the output says so plainly and backs its
  claims with a direct `rg` cross-check instead of trusting a possibly
  stale graph silently.

## Gates
- None.

## Verify-template
- N/A.

## Collaboration

| Trigger | Call | To | Reason | Bóng về mang |
|---|---|---|---|---|
| No trigger — a pure lookup, never calls out | — | | | |
