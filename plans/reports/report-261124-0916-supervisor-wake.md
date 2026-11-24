# Supervisor wake, 2026-11-24 09:16 +07

At the start, one owner question was open: q-ozu6l2ioxa, which asks who applies the secretary rotation config change. It is still unanswered, and no plan waits on it.

- **e2a50f27b2385b12 (session-no-result).** Unit unit-run-1795486347325-3b832697 is a 12b unit of the lead. It settled `pass` with the claim "follow resolve_program in the one-door census scan". Only the token usage was missing (`transcript-not-found`). No action was needed.
- **682fc7e89842807a (session-no-result).** Unit unit-run-1795486429811-bdd18612 is also a 12b unit of the lead. It settled `pass` with the claim "rename the resolve_program match variable to resolverCall". Only the token usage was missing. No action was needed.

Running plans: only 261121-2110-component-authority-doors is running. Its lead is live and busy. The 12a review found one regression and a missing `--workspace-only` flag, which the lead is fixing on the p12b branch before it lands 12a and 12b together. It is now verifying 12b step 2.

Admission: no plan is admissible. One of 3 leads is in use and 4 lanes are free, so no lead was started.

## Open questions

- q-ozu6l2ioxa: who applies the secretary rotation config change.
- Unit results keep missing their token usage (`transcript-not-found`): the runner does not find the producer transcript. If it recurs, it is worth a backlog item through the secretary.
