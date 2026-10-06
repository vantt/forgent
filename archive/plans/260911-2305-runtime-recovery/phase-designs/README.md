# Phase Design Pack

Each phase design is implementation-input, not implementation authorization.
Every document names one mutation owner, ports, adapters, normal/crash paths,
typed outcomes and executable proof. The architecture lock remains the parent
authority.

The simplicity constraint and deletion tests live in
[`../simplicity-and-complexity-budget.md`](../simplicity-and-complexity-budget.md).

The latest audit result is recorded in
[`../design-audit-final.md`](../design-audit-final.md).

Exact Node-first schemas and typed outcomes are in
[`../implementation-contract-catalog.md`](../implementation-contract-catalog.md).
The local `cli-spawn` profile's detailed contract is
[`cli-spawn-local-contract.md`](cli-spawn-local-contract.md).

| Phase | Design | Depends on | Status |
|---|---|---|---|
| S1/P01 | [run-admission-and-fencing.md](run-admission-and-fencing.md) | S0 | design approved |
| S2/shared | [confinement-adapter-contract.md](confinement-adapter-contract.md) | S1 + Confinement Authority | design ready; shared prepared invocation seam for cli-spawn and herdr-spawn |
| S2/P02L | [cli-spawn-reconciliation.md](cli-spawn-reconciliation.md) + [cli-spawn-local-contract.md](cli-spawn-local-contract.md) | S1 | design ready; human hold; default adapter/core |
| S2/P02H | [launch-reconciliation.md](launch-reconciliation.md) | S1, P02L lifecycle | architecture ready; worker-command seam required; human hold; Herdr starts Authority-prepared bwrap command; replacement gated |
| S3/P03 | [fallback-and-effect-boundary.md](fallback-and-effect-boundary.md) | S1, S2 contract | pre-delivery ready; post-delivery gated |
| S4/P04-P05 | [read-evaluator-and-planner.md](read-evaluator-and-planner.md) | S1 | design approved |
| S4/P05S | [session-recovery-door.md](session-recovery-door.md) | P01, P04, P05 | design approved |
| S5/P07 | [continuation-and-transfer.md](continuation-and-transfer.md) | engine backlog, S1-S4 | capability gated |
| P06 | [writable-takeover.md](writable-takeover.md) | S2, S4 | disabled profile |
| P08 | [closeout-and-capability-matrix.md](closeout-and-capability-matrix.md) | core accepted phases | pending evidence |
