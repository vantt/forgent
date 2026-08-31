# Agent Coordination Proposals

Document type: Index
Design status: Discussion
Implementation: Partial
Last reviewed: 2026-08-31
Canonical for: nothing; proposals must be promoted into architecture/contracts/ADRs

All proposals are subordinate to the
[Agent Coordination Foundation Vision](../vision.md). They resolve open design
shape and may not reopen its accepted foundation boundaries implicitly.

## Active Proposals

1. [Dispatch Control Plane Redesign](dispatch-control-plane-redesign.md) contains
   the detailed target and implementation-era findings behind the canonical
   dispatch summary.
2. [Team Communication Protocol V1](team-communication-protocol-v1.md) proposes
   role-to-role message and operation doctrine.
3. [Step 07: CoordinationSession, AdhocTask, And Planning Boundary](step-07-coordination-session-adhoc-task.md)
   discusses optional session-local task graphs, dynamic/declared/domain-assisted
   planning, execution contracts, isolation, and Work boundaries.
4. [Step 08: Standalone Coordination And Optional Protocols](step-08-standalone-coordination-protocols.md)
   discusses agent-led standalone adoption plus optional reusable research,
   consult, brainstorm, debate, leader-worker, and peer flows.

## Promotion Rule

Approving a proposal means extracting:

- term changes into `vocabulary/`;
- durable boundaries into `architecture/`;
- exact behavior into `contracts/`;
- accepted choices and rejected alternatives into `decisions/`;
- implementation sequence into `roadmap/`.

Do not relabel an entire mixed proposal as canonical.
