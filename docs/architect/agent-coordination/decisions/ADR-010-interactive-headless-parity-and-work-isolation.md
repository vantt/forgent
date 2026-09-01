# ADR-010: Interactive/Headless Capability Parity As An Intended Future Property, And Domain-Owned Work Isolation

Document type: ADR
Design status: Accepted
Implementation: Not started
Last reviewed: 2026-09-01
Canonical for: the interactive-first rollout sequencing intention and the boundary keeping merge/Work-transition authority out of `src/runner/coordination/**`
Related: [Vision V-008/V-012](../vision.md), [Work Integration](../architecture/work-integration.md), [ADR-001](ADR-001-work-lifecycle-authority.md), [ADR-008](ADR-008-coordination-session-and-mission-deferral.md), [Intent Preservation Ledger AC-I008/AC-I009](../intent-preservation-ledger.md)

## Context

The 2026-08-31 Step 07 decision fixed only an *order* — interactive plus
CLI-spawn execution first, headless/herdr-spawn after — not a claim that both
modes must ship with identical capability on day one
(`plans/260831-1637-step07-inline-assignment-mvp/plan.md:74-82`). The
2026-09-01 Step 08 checkpoint separately records target capability *parity*
as an original human-confirmed intention: interactive and headless should
expose the same Agent Coordination capabilities and semantic contracts over
time, differing only in visibility/operator presence, with interactive
shipping first so a maintainer can observe and correct real agent behavior
before it runs unattended (pre-plan review finding M5c raised this as an open
question; the 2026-09-01 checkpoint records the maintainer's resolution;
ledger entry AC-I008).

Separately, the accepted boundary that Work lifecycle mutation belongs only to
Work engine verbs (ADR-001) and that a domain harness — not the coordination
core — owns isolation, resource-conflict, branch, and merge authority
(`architecture/work-integration.md`) must hold as CoordinationSession and
FlowDefinition are promoted to canonical status. Step 08's first live proofs
are read-only; nothing in this phase grants coordination code merge or Work-
transition capability (ledger entry AC-I009).

## Decision

1. **Interactive ships first for explicit observation.** The first
   CoordinationSession live proofs run interactively — operator-attached,
   explicitly observable — so agent behavior can be corrected before it runs
   unattended.
2. **Headless is a later invocation of the same engine, not a second one.**
   When headless operation is built, it invokes the same
   CoordinationSession/protocol/dispatch/Assignment/Run/RunResult/evidence/
   recovery contracts interactive operation uses. Visibility and operator
   presence are the intended difference between the two modes; neither mode
   gets a private contract, recovery model, or evidence model the other
   lacks.
3. **Target capability parity is an intended future property, not a shipped
   V1 guarantee.** No phase may introduce an interactive-only or
   headless-only coordination capability without naming the gap explicitly.
   Telemetry for unattended headless observation and continuous improvement
   is `deferred-preserved` (AC-I008) and does not justify weakening execution
   truth or creating a second, headless-specific execution path in the
   interim.
4. **Domain-owned Work isolation is preserved.** No coordination code path —
   specifically nothing under `src/runner/coordination/**` once that module
   exists — gains merge authority, branch-management authority, or Work
   status/stage-transition authority. Two mutating actors may never run
   concurrently in one worktree. A CoordinationSession's ledger may record
   references to domain-provisioned workspace/isolation context (for
   auditability), but it cannot invent isolation policy, claim resources, or
   perform a merge itself; that remains the domain harness's and Work
   engine's authority, per [Work Integration](../architecture/work-integration.md)
   and ADR-001.
5. **Work-attached mutation stays a stop gate.** Standalone Step 08 proofs
   remain read-only until a coding-domain live proof demonstrates resource-
   conflict detection, worktree/branch isolation, merge ownership, recovery,
   and Work-transition authority under real concurrent load. This decision
   does not authorize Work-attached mutating coordination; it only states the
   boundary such a future proof must respect.

## Consequences

- A future headless implementation phase has an explicit target (parity) and
  an explicit non-blocker (telemetry) to plan against, rather than an
  ambiguous "later" with no acceptance shape.
- Reviewers can check any Step 08 phase against a concrete rule: does this
  add a capability only one operating mode can reach, and if so, is that gap
  named?
- `src/runner/coordination/**`, when it is created in Phase 01+, inherits a
  hard negative constraint from day one: no merge/Work-transition API, ever,
  regardless of how CoordinationSession's own runtime evolves.
- Work-attached mutating coordination remains explicitly deferred rather than
  silently possible once a session ledger exists.

## Rejected Alternatives

- **Require simultaneous interactive/headless delivery in V1.** Rejected:
  the 2026-08-31 order decision fixes sequencing, not simultaneity; forcing
  both modes to ship together would either delay the interactive observation
  proof the maintainer explicitly wants first, or ship headless before its
  behavior has been observed and corrected.
- **Treat mechanism parity as fully out of scope / unrecorded.** Rejected
  (finding M5c reconciliation): parity is a human-confirmed intention, even
  though full simultaneous capability is not required now; recording it as
  `deferred-preserved` prevents a later phase from silently deciding headless
  never needs to match interactive.
- **Let a Work-attached CoordinationSession perform its own merge/isolation
  handling for convenience.** Rejected: this would duplicate Work
  stage/status/approval/merge state in a second runtime, which
  `architecture/work-integration.md`'s Core Invariant already forbids, and
  would preclude the coding-domain live proof this ADR requires before any
  Work-attached mutation is allowed at all.
