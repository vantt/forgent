# task-spec: compound-learn

domain: coding | status: retrospective | role: implementer | requires-skill: fgos-coding-compounding

## Input
- A `delivered` item that has entered `retrospective` (sweep, or manual).
- Its outcome record (predicted vs. actual: tier, dep count, kayout, goal
  check, commit count, visit count) and any friction entries logged
  during its life.

## Output
- A Diataxis-classified, evidence-quoted end-user document when the
  captured signal is real and reusable; otherwise a plain settlement to
  `cleanup` with nothing invented to pad a doc that has nothing to say.
- The docs index (`docs/enduser-docs-index.json`) regenerated when a doc
  is written.

## Gates
- None — this stage never asks a person; a capture with no real signal
  simply settles without a document.

## Verify-template
- N/A — this stage produces documentation, not a code artifact.

## Collaboration

| Trigger | Call | To | Reason | Bóng về mang |
|---|---|---|---|---|
| The captured signal's real audience/purpose is unclear from the item's own history | advise (async) | advisor | advise | classification the doc should use |
| No trigger matches | — synthesize (or settle with no doc) — | | | |
