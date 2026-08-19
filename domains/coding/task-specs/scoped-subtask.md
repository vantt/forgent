# task-spec: scoped-subtask

domain: coding | role: helper | reason: assist | requires-skill: fgos-coding-implement

## Input
- A description of an independent piece of work, plus an explicit
  footprint that does NOT overlap the caller's own in-flight edits.

## Output
- The work product (code, diff, or research artifact matching what was
  asked) — never a claim of "done" without something concrete to hand
  back.

## Gates
- None.

## Verify-template
- Whatever the caller specified for this scoped piece; if none was given,
  the caller's own `verify` command re-run over the combined result.

## Collaboration

| Trigger | Call | To | Reason | Bóng về mang |
|---|---|---|---|---|
| A named library/pattern surfaces that cannot be resolved from context in hand | consult (sync) | researcher | consult | finding |
| No trigger matches | — do the scoped work and hand it back — | | | |
