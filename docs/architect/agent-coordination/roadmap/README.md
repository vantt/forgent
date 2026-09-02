# Agent Coordination Roadmap

Document type: Index
Design status: N/A
Implementation: Partial
Last reviewed: 2026-09-01
Canonical for: implementation sequence only

## Tracks

- [Team Dispatch V1](team-dispatch-v1/README.md) records Steps 00-06 from baseline
  design through Work-attached adoption as rollout history.
- Steps 00-08 have been promoted into canonical architecture/contracts/ADRs
  where accepted. Their combined baseline is summarized in
  [Coordination Foundation Baseline](../architecture/coordination-foundation-baseline.md),
  with exact schemas in `contracts/`, rollout history in this roadmap, and
  evidence in `verification/`.
- [Step 09](../../proposals/step-09-coding-domain-adoption.md) (coding-domain
  adoption) is a discussion draft whose mutating half remains gated on
  coding-domain adoption proof and ADR-010 §5's work-isolation boundary.

Roadmap documents reference canonical vocabulary, architecture, and contracts.
They are not a source of new system definitions.

Implementation sequencing begins from the
[Agent Coordination Foundation Vision](../vision.md), then the
[Intent Preservation Ledger](../intent-preservation-ledger.md), then accepted
architecture/contracts/ADRs. A roadmap may not make optional Work or protocol
structure mandatory by implementation convenience.

Every new implementation phase must include an intent traceability section and
close with a deferral audit. The audit must state which preserved intentions
were implemented, remain `deferred-preserved`, were superseded by an explicit
decision, or were rejected by an explicit human decision.
