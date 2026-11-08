# Lead report: T6 P08 Execution Core seams

## What changed
- `unit-run-start.mjs`: a writing run takes the worktree custody before `port.admit` (standalone writes still check the binding first); a refused admission releases it through the existing run scope. A pin that only Workflow-origin overrides set and no seat takes lets the unit run unpinned; any other pin keeps the refusal.
- `handoff-refs.mjs` / `unit-run-history.mjs`: `resolveUnitRunRef` reads only the wanted seat through new `readSeatHistory` (shares `settledRounds` with `readUnitRunHistory`). Deviation: exported `readSeatHistory` instead of bare `readSeatDirectory`, so the final-round filter is not duplicated.
- `case-admission.mjs`: `admitProposal` is 49 lines over six pure guards (entry, MUST rows, write scope, binding, frame, route) in the original violation order; the unread `bindings` output is gone.

## Red to green
- `run-case-admission.test.mjs`: custody held at admit and a held worktree refused with no port call (was admit then settle `not-started`): red before reorder, green after. New: refused admission leaves custody free.
- `run-provider-failover.test.mjs` (owns the "applies to no seat" refusal and its fixture): Workflow-origin pin passes the door, the same pin from the command line is refused; red without the door change.
- `handoff-refs.test.mjs`: only the wanted seat's `result.json` is read; red before.

## Retired
- `case-admission.test.mjs`: two `bindings` assertions (create/have); behaviour removed, binding answers are still proven there by admit/refuse, binding derivation stays with `case-admission-port.test.mjs`.

## Size
src +125/-103 (net +22, budget -20: the guide split adds six function headers and shared args; `admitProposal` itself -115), tests +45/-11.

## Gate
Focused list from the phase plus architecture, doc-health, citation-drift, every test naming a changed module: 295 pass. One-door scan 0 undeclared, census regenerated. Full suite: 8562 pass, 3 fail: the known V7n addendum and two provider-capacity lock tests that pass alone (known load flake).

## For other phases
- The unscoped Workflow fallback override in `unit-handoff.mjs` still has no `origin: 'workflow'`; the owner of that file adds it with the dry-bind deletion. Until then that pin is refused at the door as before.
