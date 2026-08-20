# task-spec: fix-verify-red

domain: coding | stage: executing | role: implementer | requires-skill: fgos-coding-implement

## Input
- A `return` attempt whose `verify` command failed — the real failure
  output.

## Output
- Either the code fixed so `verify` passes for real, or (never both at
  once) the `verify` command itself corrected if it was proving the wrong
  thing — never a loosened test just to make it pass.

## Gates
- None new — this task feeds back into `implement-item`'s own gates.

## Verify-template
- The item's own `verify`, unchanged unless the command itself was wrong.

## Collaboration

| Trigger | Call | To | Reason | Bóng về mang |
|---|---|---|---|---|
| The failure implicates a pattern/library the session does not understand | consult (sync) | researcher | consult | finding |
| Root cause is not provable from the failure output alone (bug-workflow's own rule: prove the cause before changing behavior) | advise (async) | advisor | advise | answer or scope clarification |
| No trigger matches | — fix and re-run verify — | | | |
