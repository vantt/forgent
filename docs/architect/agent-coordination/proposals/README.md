# Agent Coordination Proposals

Document type: Index
Design status: Discussion
Implementation: Partial
Last reviewed: 2026-08-31
Canonical for: nothing; proposals must be promoted into architecture/contracts/ADRs

## Active Proposals

1. [Dispatch Control Plane Redesign](dispatch-control-plane-redesign.md) contains
   the detailed target and implementation-era findings behind the canonical
   dispatch summary.
2. [Team Communication Protocol V1](team-communication-protocol-v1.md) proposes
   role-to-role message and operation doctrine.
3. [Step 07: CoordinationSession And AdhocTask](step-07-coordination-session-adhoc-task.md)
   discusses session-local task graphs, planning materialization, isolation, and
   Work boundaries.
4. [Step 08: Standalone Coordination Protocols](step-08-standalone-coordination-protocols.md)
   discusses research, consult, brainstorm, debate, leader-worker, and peer flows.

## Promotion Rule

Approving a proposal means extracting:

- term changes into `vocabulary/`;
- durable boundaries into `architecture/`;
- exact behavior into `contracts/`;
- accepted choices and rejected alternatives into `decisions/`;
- implementation sequence into `roadmap/`.

Do not relabel an entire mixed proposal as canonical.
