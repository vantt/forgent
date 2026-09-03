# Phase 02 - Driver Authorization Primitive

## Objective

Implement the smallest runtime/schema support for driver-authorized declared
operations: an operation may materialize only after a valid
`operation-authorized` session event and within binding/session bounds.

## Requirements

- **R1 Binding activation.** Add `activation.mode: required |
  driver-authorized` and `activation.maxInvocations` on the
  graph node-operation binding, not on reusable operation definitions.
- **R2 Authorization event.** Add append/replay validation for
  `operation-authorized` with `authorizationId`, `operationId`, `nodeId`,
  `targetActorId`, `invocationKey`, `authorizedBy`, `reason`,
  `grantedContextRefs`, optional `targetArtifactRef`, and timestamp.
- **R3 Assignment provenance.** Persist enough provenance on
  `assignment-created` or a companion event to reconstruct why the Assignment
  exists: operation id, node id, authorization id, invocation key, and context
  grant.
- **R4 Dispatch gate.** Declared operations with `activation.mode:
  driver-authorized` reject unless an unconsumed matching authorization exists.
- **R5 Idempotency.** `invocationKey` is consumed exactly once for the logical
  operation. Crash/resume must not double-dispatch it.
- **R6 Context grant.** The dispatched worker may receive only the context refs
  granted by authorization plus always-legal base session context. Hidden sibling
  outputs remain illegal.
- **R7 Bounds.** Binding caps narrow operation usage; they never widen
  `aggregateBounds.maxAssignments`, `aggregateBounds.maxRounds`,
  `maxConcurrency`, or terminal-session refusal.
- **R8 Driver authority.** Authorization/disposition writer identity must be
  tied to session driver/provenance root. `writerId` alone is not enough if the
  existing API cannot distinguish an arbitrary event writer from the driver.

## Files

Expected source/test/docs:

- `src/runner/definitions/schema.mjs`
- `src/runner/coordination/schema.mjs`
- `src/runner/coordination/store.mjs`
- `src/runner/coordination/replay.mjs`
- `src/runner/coordination/session-engine.mjs`
- `test/runner/flow-definition*.test.mjs`
- `test/runner/coordination*.test.mjs`
- accepted contracts touched in Phase 00 only for implementation alignment

Before editing any function/class/method, run the repository-required GitNexus
impact analysis when available and record blast radius in the cell trace.

## Tests First

Add failing tests for:

- unknown `activation.mode` rejects;
- `activation` on an operation template rejects or is ignored according to the
  accepted contract; the binding is authoritative;
- optional operation without authorization rejects;
- authorization for unknown node/operation/actor rejects;
- authorization after terminal session rejects;
- reused `invocationKey` rejects;
- binding `maxInvocations` rejects the N+1 dispatch;
- aggregate bounds still reject even when binding cap allows more;
- context outside `grantedContextRefs` rejects;
- crash/resume does not duplicate an already authorized/created Assignment.

Focused command:

```bash
FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test \
  'test/runner/flow-definition*.test.mjs' \
  'test/runner/coordination*.test.mjs'
```

Run the full test command before closing this phase.

## Proofs And Exit

- Driver-authorized operation cannot dispatch without a valid event.
- Authorization is replayable and idempotent.
- Existing required operation paths still work unchanged.
- Existing Step 08 fixtures and tests remain compatible.

## Risks / Rollback

Risk: adding a generic round system or dynamic topology while implementing
authorization. Keep the primitive narrow: it authorizes an already declared
operation binding. `requestRound` and `addSessionEdge` remain deferred.

