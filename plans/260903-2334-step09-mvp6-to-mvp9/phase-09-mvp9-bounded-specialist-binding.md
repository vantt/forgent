# Phase 09 - MVP9 Bounded Specialist Binding

## Objective

Allow the external driver to recruit one previously unknown specialist identity
without arbitrary topology mutation or worker-owned recruitment.

## Candidate Contract

```text
topology.specialistSlots[]
  id
  role
  operationRefs[]
  requiredCapabilities[]
  allowedVisibilityWindows[]
  maxBindings
  maxAssignments

specialist-authorized
  specialistAuthorizationId
  slotId/specialistActorId/role/capabilities
  authorizedBy/reason/triggerEvidenceRefs/allowedContextRefs
  maxAssignments/expiresAfterRound/ts
```

## Cells

### P09.1 Slot Schema And Static Legality

- Restrict slots to CoordinationProtocol topology.
- Require declared roles, operations, capabilities, visibility windows, and
  positive narrowing caps.
- Reject explicit runtime edges and undeclared slot expansion.
- This schema preparation may start after MVP6, but cannot integrate before the
  MVP8 product gate.

### P09.2 Authorization, Binding, And Replay

- Serialize slot authorization against terminal transition and competing slot
  claims.
- Atomically record authorization and session-scoped actor binding before any
  Assignment is issued.
- Use existing `operation-authorized` for each specialist invocation.
- Expiry prevents future Assignments but never erases actor/event history.
- Replacement requires a new driver authorization and remains within slot and
  session caps.

### P09.3 Negative And Recovery Proof

- Reject worker/peer authorization, unknown slot, role/capability mismatch,
  second or over-cap binding, foreign context, over-cap Assignment, expired or
  terminal session, and slot use in isolation fixtures.
- Crash between authorization, actor binding, and Assignment creation resumes
  without duplicate actors or Assignments.
- Prove no `addSessionEdge`, topology overlay, Work, git, or coding mutation path
  is reachable.

## Exit

- Unknown specialist identity can fill a known bounded cognitive need.
- Topology class and operation legality remain predeclared.
- Workers may request but never authorize recruitment.
