# Lead report: status accounts for every run

- Landed `66567ab26` (+ board/plan row `537c07271`) on main.
- `statusWorkflow` always returns `seatProviders` (rows from the existing result bindings; empty until a seat finishes and for conductor cases). No new state.
- Red first: both units-runner assertions failed without the change, pass with it.
- Gates: focused set 214 pass after rebase; full npm test 8602 pass, 1 fail = known V7n addendum; no run-tests ERROR lines; one-door census regenerated (3 line-number shifts), undeclared 0.
- Not done: smoke on an activated release (`fgos workflow status <preset run>`), needs COOK activation of main.
