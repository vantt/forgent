# Phase 01 - Unit 1A Coordination Actions V1 Report

- Outcome: `passed`
- Next Unit Ready: `true` (ready for Unit 1B)
- Contract Version: `coordination-actions.v1`

## 1. Executive Summary

Unit 1A implements the read-only, versioned `coordination-actions.v1` projection layer. The implementation is split into a pure projector (`src/runner/coordination/actions-projector.mjs`) and a thin use-case adapter (`src/verbs/coordination/actions.mjs`). The projector is strictly pure, deterministic, performs zero I/O, contains no hardcoded protocol IDs or operation names, and enforces that identical session states yield identical action keys and digests.

## 2. Target Contract Payload Example

```json
{
  "contractVersion": "coordination-actions.v1",
  "coordinationId": "coord_fresh_1",
  "session": {
    "schemaVersion": "3",
    "status": "active",
    "phase": "running",
    "eventSeq": 3,
    "definitionRef": {
      "id": "generic.coordination-protocol.sample",
      "version": "1.0.0"
    },
    "definitionDigest": "sha256:1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
  },
  "snapshot": {
    "digest": "sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "actionSetDigest": "sha256:4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a"
  },
  "readyToClose": false,
  "blockers": [
    {
      "kind": "missing-quorum-actors",
      "blocking": true,
      "reason": "Quorum is missing required actor(s): worker"
    }
  ],
  "facts": {
    "visibilityWindows": [],
    "pendingDriverAuthorizations": [],
    "quorum": {
      "missing": ["worker"],
      "failed": []
    }
  },
  "actions": [
    {
      "kind": "dispatch-operation",
      "required": true,
      "target": {
        "nodeId": "step-1",
        "operationId": "op-produce",
        "actorId": "worker"
      },
      "requiredInputs": ["objective"],
      "optionalInputs": ["contextRefs", "constraints", "expectedOutputs"],
      "actionKey": "sha256:8f3c75d40134f0d3a5a76c8c49a37e192f9d6c342f5cb3776d6560ef73a985d8"
    }
  ]
}
```

## 3. Non-Policy Proof Obligations

1. **Mapping to Validated Request Shapes**: Every projected action (`dispatch-operation`, `authorize-and-dispatch`, `record-disposition`, `record-human-turn`, `close`) maps directly to existing validated request operations without inventing engine actions.
2. **Target Legality**: Actions reflect only valid declared bindings, unfulfilled quorum actors, or eligible failed assignments.
3. **No Hardcoded Protocol or Operation Names**: Verified by AST/source test asserting that strings like `review-candidate`, `revise-candidate`, `standalone-master-coordination-loop`, etc., do not exist anywhere in `actions-projector.mjs`.
4. **Shared Evaluators**: Reuses `legality-facts.mjs` for visibility, quorum, driver authorizations, and close blockers.
5. **Key Invalidation on Concurrent Event**: Proven by test showing that advancing `eventSeq` alters the `actionKey`.
6. **Schema Neutrality**: Schemas 1, 2, and 3 are described faithfully without schema reinterpretation.
7. **Read-Only / Pure Execution**: The projector performs no filesystem operations and does not mutate session or assignment stores.

Test Output:
```
✔ non-policy obligation 4: projector source contains no hardcoded protocol IDs or operation names (0.619085ms)
✔ fresh session projects required operation pending and driver authorization (5.677691ms)
✔ required operation settled and session ready to close exposes close action (0.33514ms)
✔ failed finding awaiting disposition projects required record-disposition action (0.662513ms)
✔ concurrent event invalidates previous actionKey (stale key proof) (0.383371ms)
✔ legacy schemas 1, 2, and 3 are cleanly described without reinterpretation (0.32281ms)
✔ use-case adapter showCoordinationActionsUseCase loads read-only session state (2.28517ms)
✔ parity: kernel-shaped assignment-created without operationId settles required op and projects close (0.50388ms)
✔ F1 regression: multi-operation with same actorId matches 1:1 and does not alias across operations (0.403248ms)
✔ F-02: record-human-turn is projected for any active session, regardless of protocol graph declarations (0.278917ms)
✔ F-01: visibility-window gated driver authorization is projected only when window is open (closed/open/failed-source parity with kernel) (0.417125ms)
✔ fan-out and link-contribution projection and non-policy obligation 1 request schema translation (1.159924ms)
ℹ tests 12
ℹ suites 0
ℹ pass 12
ℹ fail 0
```

## 4. Changed Files and Symbols

- `src/runner/coordination/actions-projector.mjs` (new module):
  - `ACTIONS_CONTRACT_VERSION`
  - `computeActionKey`
  - `computeActionSetDigest`
  - `computeSnapshotDigest`
  - `projectCoordinationActions`
- `src/verbs/coordination/actions.mjs` (new use-case adapter):
  - `showCoordinationActionsUseCase`
- `test/runner/coordination-actions-v1.test.mjs` (new test suite).

## 5. Public CLI Status

Per instructions, registering a new CLI sub-command (`fgos coordination status`) is deferred to Phase 2 to avoid scope expansion and keep the registered sub-verb set strictly aligned with the command registry. Cold callers can access the projection directly via `showCoordinationActionsUseCase` or `node src/verbs/coordination/actions.mjs <coordinationId>`.

## 6. Readiness for Unit 1B

The action projection contract and stable key generation are verified. Ready to proceed to **Unit 1B — Stale-action binding proof**.
