# Phase 00 - Unit 0D Shared Legality Facts Report

- Outcome: `passed`
- Next Unit Ready: `true` (ready for Unit 1A)

## 1. Executive Summary

Unit 0D extracts the minimum pure legality facts boundary (`src/runner/coordination/legality-facts.mjs`) shared by current status views (`show`, `chain`) and the upcoming read-only action projector (`Unit 1A`). The layer adheres strictly to hex/pure evaluator principles: zero filesystem I/O, zero state mutation, zero event append, zero hardcoded protocol/operation IDs, and zero driver judgment.

## 2. Shared Legality Facts Boundary

Target Shape:
```text
validated manifest + replayed events/state + immutable definition snapshot
  -> pure coordination legality facts
```

### Fact Mapping: Authoritative Evaluators & Consumers

| Legality Fact | Authoritative Logic / Source | Extracted Function | Consumers |
|---|---|---|---|
| **Driver-Authorized Bindings** | `graph.nodes[].operations[].activation.mode === 'driver-authorized'` | `collectDriverAuthorizedBindings`, `evaluateDriverAuthorizedBindings` | `showCoordinationUseCase`, `chainCoordinationUseCase`, `coordination-actions.v1` |
| **Required Bindings** | `graph.nodes[].operations[].activation.mode !== 'driver-authorized'` | `collectRequiredBindings` | `coordination-actions.v1` |
| **Specialist Slots State** | `spec.profile.topology.specialistSlots[]` + replayed authorizations | `evaluateSpecialistSlots` | `showCoordinationUseCase`, `coordination-actions.v1` |
| **Visibility Windows State** | `spec.profile.topology.visibilityWindows[]` + settled operations | `evaluateVisibilityWindows` | `coordination-actions.v1` |
| **Close Prerequisites & Blockers** | Quorum classification, pending authorizations, required aggregations, active status | `evaluateClosePrerequisites` | `coordination-actions.v1`, close command pre-checks |
| **Master Legality Facts** | Composite pure evaluation | `evaluateLegalityFacts` | `coordination-actions.v1` |

## 3. Behavior and Refactor Proofs

1. **Purity Guard**: `test/runner/coordination-legality-facts.test.mjs` verifies that `legality-facts.mjs` contains no imports of `fs`, `child_process`, `net`, `http`, or write-store mutators.
2. **Semantic Equivalence & Kernel Parity**:
   - `session-engine.mjs` delegates `deriveVisibilityWindowState` directly to pure `evaluateVisibilityWindowState` in `legality-facts.mjs` with disk-read callbacks.
   - `showCoordinationUseCase` consumes pure `evaluateDriverAuthorizedBindings` and `evaluateSpecialistSlots`.
   - All 14 tests in `test/runner/coordination-legality-facts.test.mjs` pass cleanly (including multi-actor same operation, actor replacement, visibility window gating with real fixtures, causal remediation chains, and mutation-sensitive negative tests).
   - All 57 tests across `test/cli/coordination.test.mjs` and `test/verbs/coordination-chain.test.mjs` pass cleanly without regression.
   - All 24 tests across `test/runner/coordination-visibility-window*.test.mjs` and `test/runner/coordination-recheck-discharge.test.mjs` pass cleanly.

Test Output (`test/runner/coordination-legality-facts.test.mjs`):
```
✔ purity guard: legality-facts.mjs contains no filesystem, child_process, network or write-store imports (1.005822ms)
✔ collectDriverAuthorizedBindings and collectRequiredBindings correctly partition graph operations (0.574986ms)
✔ evaluateDriverAuthorizedBindings classifies pending vs authorized without side-effects (0.151258ms)
✔ evaluateSpecialistSlots reports bound vs available slots (0.13585ms)
✔ evaluateVisibilityWindows computes open vs closed status from settled operation ids (0.588234ms)
✔ evaluateClosePrerequisites correctly flags blockers (0.22436ms)
✔ evaluateLegalityFacts master pure evaluation is robust across session kinds (0.308445ms)
✔ evaluateClosePrerequisites respects partialPolicy.allowedOmissions and minimumActors (0.15012ms)
✔ evaluateLegalityFacts settles required bindings from kernel-shaped assignment-created events without operationId (0.152643ms)
✔ kernel parity: multi-actor same operation, actor replacement, and visibility window with real gated fixture (46.03357ms)
✔ kernel parity: accepted finding -> remediation -> recheck causal chain with real master loop fixture (18.042574ms)
✔ kernel parity: aggregation absent vs non-consensus vs consensus with real rfc fixture (18.634503ms)
✔ kernel parity: terminal session blocks close (0.154455ms)
✔ mutation-sensitive negative test: deliberate rule perturbation fails parity (19.850133ms)
ℹ tests 14
ℹ suites 0
ℹ pass 14
ℹ fail 0
```

## 4. Changed Files and Symbols

- `src/runner/coordination/legality-facts.mjs`:
  - `protocolOperationStamp`
  - `buildActorReplacementMap`
  - `declaredOperationBindingActors`
  - `resolveDeclaredOperationActor`
  - `actorGatingOperationIds`
  - `assignmentServesOperation`
  - `classifyOperationAssignment`
  - `hasAcceptedDispositionRemediation`
  - `resolveRecheckDischarge`
  - `resolveBindingOutcome`
  - `resolveOperationOutcome`
  - `evaluateVisibilityWindowState`
  - `evaluateVisibilityWindows`
  - `evaluateClosePrerequisites`
  - `evaluateLegalityFacts`
- `src/runner/coordination/session-engine.mjs`:
  - Refactored `deriveVisibilityWindowState` to delegate to `evaluateVisibilityWindowState` from `legality-facts.mjs`.
- `test/runner/coordination-legality-facts.test.mjs`:
  - Comprehensive kernel parity and mutation-sensitive test suite.

## 5. Residual Risks

- None identified. Kernel runtime and projection legality logic share a single authoritative pure evaluator.

## 6. Readiness for Unit 1A

The pure evaluator foundation is established and verified against the runtime kernel. Ready to proceed to **Unit 1A — Read-only `coordination-actions.v1`**.
