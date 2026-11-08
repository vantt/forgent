# HARDEN T6 P17 settle wins: lead report

Landed 7ffd0a0e5 (red), 6b45c34c5 (fix), 43004ac0e (board). OPC merge on 814054856 (pre-rebase).

- Rule: `applySettle` appends a real settle when the only earlier settles of the reservation are `not-started`; a second `not-started` or second real settle is still dropped; unbind runs only when no settle was on the ledger before.
- Red evidence (old code): three of four new runtime cases failed (release then real settle; pending file; second settle unbinds a newer binding). The "real settle first" case passed on old code (already safe). The projection fold case passed on old code (fold assigns); it pins the behaviour.
- Gate: focused set 174 pass / 0 fail (case-runtime, case-projection, admission-port, verbs, bindings, conductor-case, runner-resume, architecture, doc-health, citation-drift); git-one-door scan 0 undeclared, census regenerated (payload digest and case-runtime digest only); full npm test on the tree with phases 16 and 17: 1 fail, the known V7n addendum; no run-tests ERROR lines.
- Spec line RUL-WF-37 is written at wave close.
