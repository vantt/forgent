# Current link pass and helper rules — part 6

One replacement review request; entries 601–720 of section f. **120 entries**. Content and SYNC `2300d65571968bb3bcb80123a273272586e3f1db`; comparison base `980cb29312b8701f5ea639278f44e1a57a6e5c02`. [Single index](review-request-step10-index-2300d6557.md). Old requests packaged at `8d38b18ed` are superseded. No producer seed or verdict.

Current decision and current witness fields take precedence over explicitly preserved historical records. Every rebound row is pending; old reviewed fields occur only inside historical before records. A36 deep lists are in [A36](step10-sync2300-A36.json); all truth corrections, all partial carries and all unequal source/target rows require deep review.

## Entry f-601: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/proposals/coordination-capability-envelope.md",
  "line": 50,
  "label": "CoordinationSession contract",
  "legacy": "docs/architect/agent-coordination/contracts/coordination-session.md",
  "before": "../../architect/agent-coordination/contracts/coordination-session.md",
  "after": "../agent-coordination/history/retired-engine/files/contracts/coordination-session.md",
  "target": "docs/platform/agent-coordination/history/retired-engine/files/contracts/coordination-session.md",
  "anchor": null,
  "reason": "explicit-alias",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/agent-coordination/history/retired-engine/files/contracts/coordination-session.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-602: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/proposals/coordination-capability-envelope.md",
  "line": 51,
  "label": "Raw master-coordination prompt",
  "legacy": "docs/architect/agent-coordination/playbooks/prompts/master-coordinator.md",
  "before": "../../architect/agent-coordination/playbooks/prompts/master-coordinator.md",
  "after": "../agent-coordination/playbooks/prompts/master-coordinator.md",
  "target": "docs/platform/agent-coordination/playbooks/prompts/master-coordinator.md",
  "anchor": null,
  "reason": "specific-candidate",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/agent-coordination/playbooks/prompts/master-coordinator.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-603: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/proposals/coordination-capability-envelope.md",
  "line": 52,
  "label": "Architecture Advisory proposal",
  "legacy": "docs/architect/proposals/architecture-advisory-panel.md",
  "before": "../../architect/proposals/architecture-advisory-panel.md",
  "after": "architecture-advisory-panel.md",
  "target": "docs/platform/proposals/architecture-advisory-panel.md",
  "anchor": null,
  "reason": "explicit-alias",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/proposals/architecture-advisory-panel.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-604: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/proposals/coordination-capability-envelope.md",
  "line": 53,
  "label": "Plan Loop proposal",
  "legacy": "docs/architect/proposals/group-thinking-plan-loop.md",
  "before": "../../architect/proposals/group-thinking-plan-loop.md",
  "after": "../agent-coordination/history/proposals-redesigns/group-thinking-plan-loop.md",
  "target": "docs/platform/agent-coordination/history/proposals-redesigns/group-thinking-plan-loop.md",
  "anchor": null,
  "reason": "explicit-alias",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/agent-coordination/history/proposals-redesigns/group-thinking-plan-loop.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-605: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/proposals/coordination-capability-envelope.md",
  "line": 278,
  "label": "Routing Handoff Contract",
  "legacy": "docs/routing-handoff-contract.md",
  "before": "../../routing-handoff-contract.md",
  "after": "../runner/contracts/routing-handoff.md",
  "target": "docs/platform/runner/contracts/routing-handoff.md",
  "anchor": null,
  "reason": "explicit-alias",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/runner/contracts/routing-handoff.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-606: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/proposals/coordination-capability-envelope.md",
  "line": 415,
  "label": "Minimal Probe Contract",
  "legacy": "docs/architect/proposals/coordination-envelope-probe-contract.md",
  "before": "../../architect/proposals/coordination-envelope-probe-contract.md",
  "after": "coordination-envelope-probe-contract.md",
  "target": "docs/platform/proposals/coordination-envelope-probe-contract.md",
  "anchor": null,
  "reason": "explicit-alias",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/proposals/coordination-envelope-probe-contract.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-607: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/proposals/coordination-dispatch-contract.md",
  "line": 34,
  "label": "Dispatch Control Plane",
  "legacy": "docs/architect/agent-coordination/architecture/dispatch-control-plane.md",
  "before": "../../architect/agent-coordination/architecture/dispatch-control-plane.md",
  "after": "../agent-coordination/architecture/dispatch-control-plane.md",
  "target": "docs/platform/agent-coordination/architecture/dispatch-control-plane.md",
  "anchor": null,
  "reason": "specific-candidate",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/agent-coordination/architecture/dispatch-control-plane.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-608: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/proposals/coordination-dispatch-contract.md",
  "line": 35,
  "label": "Coordination capability envelope",
  "legacy": "docs/architect/proposals/coordination-capability-envelope.md",
  "before": "../../architect/proposals/coordination-capability-envelope.md",
  "after": "coordination-capability-envelope.md",
  "target": "docs/platform/proposals/coordination-capability-envelope.md",
  "anchor": null,
  "reason": "explicit-alias",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/proposals/coordination-capability-envelope.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-609: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/proposals/coordination-dispatch-contract.md",
  "line": 36,
  "label": "Worker/provider/control boundary",
  "legacy": "docs/architect/proposals/coordination-worker-provider-boundary.md",
  "before": "../../architect/proposals/coordination-worker-provider-boundary.md",
  "after": "coordination-worker-provider-boundary.md",
  "target": "docs/platform/proposals/coordination-worker-provider-boundary.md",
  "anchor": null,
  "reason": "explicit-alias",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/proposals/coordination-worker-provider-boundary.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-610: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/proposals/coordination-dispatch-contract.md",
  "line": 37,
  "label": "Progress",
  "legacy": "docs/architect/proposals/coordination-envelope-progress.md",
  "before": "../../architect/proposals/coordination-envelope-progress.md",
  "after": "../agent-coordination/history/proposals-redesigns/coordination-envelope-progress.md",
  "target": "docs/platform/agent-coordination/history/proposals-redesigns/coordination-envelope-progress.md",
  "anchor": null,
  "reason": "explicit-alias",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/agent-coordination/history/proposals-redesigns/coordination-envelope-progress.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-611: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/proposals/coordination-envelope-probe-contract.md",
  "line": 44,
  "label": "chat progress and next work",
  "legacy": "docs/architect/proposals/coordination-envelope-progress.md",
  "before": "../../architect/proposals/coordination-envelope-progress.md",
  "after": "../agent-coordination/history/proposals-redesigns/coordination-envelope-progress.md",
  "target": "docs/platform/agent-coordination/history/proposals-redesigns/coordination-envelope-progress.md",
  "anchor": null,
  "reason": "explicit-alias",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/agent-coordination/history/proposals-redesigns/coordination-envelope-progress.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-612: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/proposals/coordination-envelope-probe-contract.md",
  "line": 146,
  "label": "Worker/provider/control boundary sketch",
  "legacy": "docs/architect/proposals/coordination-worker-provider-boundary.md",
  "before": "../../architect/proposals/coordination-worker-provider-boundary.md",
  "after": "coordination-worker-provider-boundary.md",
  "target": "docs/platform/proposals/coordination-worker-provider-boundary.md",
  "anchor": null,
  "reason": "explicit-alias",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/proposals/coordination-worker-provider-boundary.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-613: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/proposals/coordination-worker-provider-boundary.md",
  "line": 34,
  "label": "Conceptual architecture",
  "legacy": "docs/architect/proposals/coordination-capability-envelope.md",
  "before": "../../architect/proposals/coordination-capability-envelope.md",
  "after": "coordination-capability-envelope.md",
  "target": "docs/platform/proposals/coordination-capability-envelope.md",
  "anchor": null,
  "reason": "explicit-alias",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/proposals/coordination-capability-envelope.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-614: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/proposals/coordination-worker-provider-boundary.md",
  "line": 35,
  "label": "Probe contract",
  "legacy": "docs/architect/proposals/coordination-envelope-probe-contract.md",
  "before": "../../architect/proposals/coordination-envelope-probe-contract.md",
  "after": "coordination-envelope-probe-contract.md",
  "target": "docs/platform/proposals/coordination-envelope-probe-contract.md",
  "anchor": null,
  "reason": "explicit-alias",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/proposals/coordination-envelope-probe-contract.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-615: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/proposals/coordination-worker-provider-boundary.md",
  "line": 36,
  "label": "Progress",
  "legacy": "docs/architect/proposals/coordination-envelope-progress.md",
  "before": "../../architect/proposals/coordination-envelope-progress.md",
  "after": "../agent-coordination/history/proposals-redesigns/coordination-envelope-progress.md",
  "target": "docs/platform/agent-coordination/history/proposals-redesigns/coordination-envelope-progress.md",
  "anchor": null,
  "reason": "explicit-alias",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/agent-coordination/history/proposals-redesigns/coordination-envelope-progress.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-616: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/proposals/coordination-worker-provider-boundary.md",
  "line": 37,
  "label": "Capability audit",
  "legacy": "docs/architect/agent-coordination/verification/coordination-envelope/capability-fit-2026-09-06.md",
  "before": "../../architect/agent-coordination/verification/coordination-envelope/capability-fit-2026-09-06.md",
  "after": "../agent-coordination/verification/coordination-envelope/capability-fit-2026-09-06.md",
  "target": "docs/platform/agent-coordination/verification/coordination-envelope/capability-fit-2026-09-06.md",
  "anchor": null,
  "reason": "explicit-alias",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/agent-coordination/verification/coordination-envelope/capability-fit-2026-09-06.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-617: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/proposals/coordination-worker-provider-boundary.md",
  "line": 38,
  "label": "Dispatch control plane",
  "legacy": "docs/architect/agent-coordination/architecture/dispatch-control-plane.md",
  "before": "../../architect/agent-coordination/architecture/dispatch-control-plane.md",
  "after": "../agent-coordination/architecture/dispatch-control-plane.md",
  "target": "docs/platform/agent-coordination/architecture/dispatch-control-plane.md",
  "anchor": null,
  "reason": "specific-candidate",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/agent-coordination/architecture/dispatch-control-plane.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-618: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/proposals/coordination-worker-provider-boundary.md",
  "line": 42,
  "label": "Dispatch & Execution control\nplane",
  "legacy": "docs/architect/agent-coordination/architecture/dispatch-control-plane.md",
  "before": "../../architect/agent-coordination/architecture/dispatch-control-plane.md",
  "after": "../agent-coordination/architecture/dispatch-control-plane.md",
  "target": "docs/platform/agent-coordination/architecture/dispatch-control-plane.md",
  "anchor": null,
  "reason": "specific-candidate",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/agent-coordination/architecture/dispatch-control-plane.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-619: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/proposals/coordination-worker-provider-boundary.md",
  "line": 76,
  "label": "raw result",
  "legacy": "docs/architect/agent-coordination/verification/coordination-envelope/proofs/2026-09-06-boundary/environment-result.json",
  "before": "../../architect/agent-coordination/verification/coordination-envelope/proofs/2026-09-06-boundary/environment-result.json",
  "after": "../agent-coordination/verification/coordination-envelope/proofs/2026-09-06-boundary/environment-result.json",
  "target": "docs/platform/agent-coordination/verification/coordination-envelope/proofs/2026-09-06-boundary/environment-result.json",
  "anchor": null,
  "reason": "explicit-alias",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/agent-coordination/verification/coordination-envelope/proofs/2026-09-06-boundary/environment-result.json",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-620: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/proposals/coordination-worker-provider-boundary.md",
  "line": 77,
  "label": "reproduction script",
  "legacy": "docs/architect/agent-coordination/verification/coordination-envelope/proofs/2026-09-06-boundary/environment.mjs",
  "before": "../../architect/agent-coordination/verification/coordination-envelope/proofs/2026-09-06-boundary/environment.mjs",
  "after": "../agent-coordination/verification/coordination-envelope/proofs/2026-09-06-boundary/environment.mjs",
  "target": "docs/platform/agent-coordination/verification/coordination-envelope/proofs/2026-09-06-boundary/environment.mjs",
  "anchor": null,
  "reason": "explicit-alias",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/agent-coordination/verification/coordination-envelope/proofs/2026-09-06-boundary/environment.mjs",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-621: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/proposals/step-09-group-thinking-substrate.md",
  "line": 43,
  "label": "CoordinationSession Contract",
  "legacy": "docs/architect/agent-coordination/contracts/coordination-session.md",
  "before": "../../architect/agent-coordination/contracts/coordination-session.md",
  "after": "../agent-coordination/history/retired-engine/files/contracts/coordination-session.md",
  "target": "docs/platform/agent-coordination/history/retired-engine/files/contracts/coordination-session.md",
  "anchor": null,
  "reason": "explicit-alias",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/agent-coordination/history/retired-engine/files/contracts/coordination-session.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-622: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/proposals/step-09-group-thinking-substrate.md",
  "line": 44,
  "label": "FlowDefinition Contract",
  "legacy": "docs/architect/agent-coordination/contracts/flow-definition.md",
  "before": "../../architect/agent-coordination/contracts/flow-definition.md",
  "after": "../agent-coordination/history/retired-engine/files/contracts/flow-definition.md",
  "target": "docs/platform/agent-coordination/history/retired-engine/files/contracts/flow-definition.md",
  "anchor": null,
  "reason": "explicit-alias",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/agent-coordination/history/retired-engine/files/contracts/flow-definition.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-623: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/proposals/step-09-group-thinking-substrate.md",
  "line": 57,
  "label": "Architecture Intent",
  "legacy": "docs/architect/architecture-intent.md",
  "before": "../../architect/architecture-intent.md",
  "after": "../system-architecture/architecture/architecture-intent.md",
  "target": "docs/platform/system-architecture/architecture/architecture-intent.md",
  "anchor": null,
  "reason": "explicit-alias",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/system-architecture/architecture/architecture-intent.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-624: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/proposals/step-09-group-thinking-substrate.md",
  "line": 58,
  "label": "Agent Coordination Intent Preservation Ledger",
  "legacy": "docs/architect/agent-coordination/intent-preservation-ledger.md",
  "before": "../../architect/agent-coordination/intent-preservation-ledger.md",
  "after": "../agent-coordination/history/retired-engine/legacy/intent-preservation-ledger.md",
  "target": "docs/platform/agent-coordination/history/retired-engine/legacy/intent-preservation-ledger.md",
  "anchor": null,
  "reason": "specific-candidate",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/agent-coordination/history/retired-engine/legacy/intent-preservation-ledger.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-625: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/proposals/step-09-group-thinking-substrate.md",
  "line": 59,
  "label": "Coordination Foundation Baseline",
  "legacy": "docs/architect/agent-coordination/architecture/coordination-foundation-baseline.md",
  "before": "../../architect/agent-coordination/architecture/coordination-foundation-baseline.md",
  "after": "../agent-coordination/history/retired-engine/files/architecture/coordination-foundation-baseline.md",
  "target": "docs/platform/agent-coordination/history/retired-engine/files/architecture/coordination-foundation-baseline.md",
  "anchor": null,
  "reason": "explicit-alias",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/agent-coordination/history/retired-engine/files/architecture/coordination-foundation-baseline.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-626: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/proposals/step-09-group-thinking-substrate.md",
  "line": 60,
  "label": "CoordinationSession Contract",
  "legacy": "docs/architect/agent-coordination/contracts/coordination-session.md",
  "before": "../../architect/agent-coordination/contracts/coordination-session.md",
  "after": "../agent-coordination/history/retired-engine/files/contracts/coordination-session.md",
  "target": "docs/platform/agent-coordination/history/retired-engine/files/contracts/coordination-session.md",
  "anchor": null,
  "reason": "explicit-alias",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/agent-coordination/history/retired-engine/files/contracts/coordination-session.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-627: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/proposals/step-09-group-thinking-substrate.md",
  "line": 61,
  "label": "FlowDefinition Contract",
  "legacy": "docs/architect/agent-coordination/contracts/flow-definition.md",
  "before": "../../architect/agent-coordination/contracts/flow-definition.md",
  "after": "../agent-coordination/history/retired-engine/files/contracts/flow-definition.md",
  "target": "docs/platform/agent-coordination/history/retired-engine/files/contracts/flow-definition.md",
  "anchor": null,
  "reason": "explicit-alias",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/agent-coordination/history/retired-engine/files/contracts/flow-definition.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-628: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/proposals/step-09-group-thinking-substrate.md",
  "line": 62,
  "label": "Team Communication Protocol V1",
  "legacy": "docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md",
  "before": "../../architect/agent-coordination/proposals/team-communication-protocol-v1.md",
  "after": "../agent-coordination/proposals/team-communication-protocol-v1.md",
  "target": "docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md",
  "anchor": null,
  "reason": "specific-candidate",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-629: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/proposals/step-09-group-thinking-substrate.md",
  "line": 63,
  "label": "Component Authority Boundary Map",
  "legacy": "docs/architect/proposals/component-authority-boundary-map.md",
  "before": "../../architect/proposals/component-authority-boundary-map.md",
  "after": "component-authority-boundary-map.md",
  "target": "docs/platform/proposals/component-authority-boundary-map.md",
  "anchor": null,
  "reason": "explicit-alias",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/proposals/component-authority-boundary-map.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-630: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/proposals/step-09-group-thinking-substrate.md",
  "line": 64,
  "label": "Step 10 Coding Domain Adoption",
  "legacy": "docs/architect/proposals/step-10-coding-domain-adoption.md",
  "before": "../../architect/proposals/step-10-coding-domain-adoption.md",
  "after": "step-10-coding-domain-adoption.md",
  "target": "docs/platform/proposals/step-10-coding-domain-adoption.md",
  "anchor": null,
  "reason": "explicit-alias",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/proposals/step-10-coding-domain-adoption.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-631: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/proposals/step-09-group-thinking-substrate.md",
  "line": 65,
  "label": "Step 09 MVP1/MVP2 group-thinking verification",
  "legacy": "docs/architect/agent-coordination/verification/step-09-group-thinking-mvp1-mvp2/index.md",
  "before": "../../architect/agent-coordination/verification/step-09-group-thinking-mvp1-mvp2/index.md",
  "after": "../agent-coordination/verification/step-09-group-thinking-mvp1-mvp2/index.md",
  "target": "docs/platform/agent-coordination/verification/step-09-group-thinking-mvp1-mvp2/index.md",
  "anchor": null,
  "reason": "explicit-alias",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/agent-coordination/verification/step-09-group-thinking-mvp1-mvp2/index.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-632: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/proposals/step-09-group-thinking-substrate.md",
  "line": 66,
  "label": "Step 09 MVP3-MVP5 verification",
  "legacy": "docs/architect/agent-coordination/verification/step-09-mvp3-to-mvp5/index.md",
  "before": "../../architect/agent-coordination/verification/step-09-mvp3-to-mvp5/index.md",
  "after": "../agent-coordination/verification/step-09-mvp3-to-mvp5/index.md",
  "target": "docs/platform/agent-coordination/verification/step-09-mvp3-to-mvp5/index.md",
  "anchor": null,
  "reason": "explicit-alias",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/agent-coordination/verification/step-09-mvp3-to-mvp5/index.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-633: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/proposals/step-09-group-thinking-substrate.md",
  "line": 67,
  "label": "MVP6+ Dogfood Handoff",
  "legacy": "docs/architect/agent-coordination/playbooks/mvp6-dogfood-handoff.md",
  "before": "../../architect/agent-coordination/playbooks/mvp6-dogfood-handoff.md",
  "after": "../agent-coordination/history/retired-engine/files/playbooks/mvp6-dogfood-handoff.md",
  "target": "docs/platform/agent-coordination/history/retired-engine/files/playbooks/mvp6-dogfood-handoff.md",
  "anchor": null,
  "reason": "explicit-alias",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/agent-coordination/history/retired-engine/files/playbooks/mvp6-dogfood-handoff.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-634: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/proposals/step-09-group-thinking-substrate.md",
  "line": 125,
  "label": "Architecture Intent",
  "legacy": "docs/architect/architecture-intent.md",
  "before": "../../architect/architecture-intent.md",
  "after": "../system-architecture/architecture/architecture-intent.md",
  "target": "docs/platform/system-architecture/architecture/architecture-intent.md",
  "anchor": null,
  "reason": "explicit-alias",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/system-architecture/architecture/architecture-intent.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-635: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/proposals/step-09-group-thinking-substrate.md",
  "line": 194,
  "label": "Master Multi-Agent Implementation Coordinator",
  "legacy": "docs/architect/agent-coordination/playbooks/prompts/master-coordinator.md",
  "before": "../../architect/agent-coordination/playbooks/prompts/master-coordinator.md",
  "after": "../agent-coordination/playbooks/prompts/master-coordinator.md",
  "target": "docs/platform/agent-coordination/playbooks/prompts/master-coordinator.md",
  "anchor": null,
  "reason": "specific-candidate",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/agent-coordination/playbooks/prompts/master-coordinator.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-636: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/proposals/step-09-group-thinking-substrate.md",
  "line": 196,
  "label": "Coordination Operating Harness",
  "legacy": "docs/architect/agent-coordination/playbooks/coordination-operating-harness.md",
  "before": "../../architect/agent-coordination/playbooks/coordination-operating-harness.md",
  "after": "../agent-coordination/playbooks/coordination-operating-harness.md",
  "target": "docs/platform/agent-coordination/playbooks/coordination-operating-harness.md",
  "anchor": null,
  "reason": "specific-candidate",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/agent-coordination/playbooks/coordination-operating-harness.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-637: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/proposals/step-09-group-thinking-substrate.md",
  "line": 566,
  "label": "Component Authority Boundary Map",
  "legacy": "docs/architect/proposals/component-authority-boundary-map.md",
  "before": "../../architect/proposals/component-authority-boundary-map.md",
  "after": "component-authority-boundary-map.md",
  "target": "docs/platform/proposals/component-authority-boundary-map.md",
  "anchor": null,
  "reason": "explicit-alias",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/proposals/component-authority-boundary-map.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-638: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/proposals/step-09-group-thinking-substrate.md",
  "line": 580,
  "label": "Step 10 Coding Domain Adoption",
  "legacy": "docs/architect/proposals/step-10-coding-domain-adoption.md",
  "before": "../../architect/proposals/step-10-coding-domain-adoption.md",
  "after": "step-10-coding-domain-adoption.md",
  "target": "docs/platform/proposals/step-10-coding-domain-adoption.md",
  "anchor": null,
  "reason": "explicit-alias",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/proposals/step-10-coding-domain-adoption.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-639: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/proposals/step-10-a0-coding-domain-boundary-facade-plan.md",
  "line": 35,
  "label": "Step 10 Coding Domain Adoption",
  "legacy": "docs/architect/proposals/step-10-coding-domain-adoption.md",
  "before": "../../architect/proposals/step-10-coding-domain-adoption.md",
  "after": "step-10-coding-domain-adoption.md",
  "target": "docs/platform/proposals/step-10-coding-domain-adoption.md",
  "anchor": null,
  "reason": "explicit-alias",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/proposals/step-10-coding-domain-adoption.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-640: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/proposals/step-10-a0-coding-domain-boundary-facade-plan.md",
  "line": 36,
  "label": "Architect Roadmap",
  "legacy": "docs/architect/roadmap.md",
  "before": "../../architect/roadmap.md",
  "after": "../system-architecture/architecture/roadmap.md",
  "target": "docs/platform/system-architecture/architecture/roadmap.md",
  "anchor": null,
  "reason": "explicit-alias",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/system-architecture/architecture/roadmap.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-641: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/proposals/step-10-a0-coding-domain-boundary-facade-plan.md",
  "line": 37,
  "label": "Workspace Topology Architecture",
  "legacy": "docs/architect/workspace-topology.md",
  "before": "../../architect/workspace-topology.md",
  "after": "../system-architecture/architecture/workspace-topology.md",
  "target": "docs/platform/system-architecture/architecture/workspace-topology.md",
  "anchor": null,
  "reason": "explicit-alias",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/system-architecture/architecture/workspace-topology.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-642: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/proposals/step-10-a0-coding-domain-boundary-facade-plan.md",
  "line": 38,
  "label": "Runtime Identity And Activation",
  "legacy": "docs/architect/packaging-distribution/runtime-identity-and-activation.md",
  "before": "../../architect/packaging-distribution/runtime-identity-and-activation.md",
  "after": "../packaging-distribution/architecture/runtime-identity-and-activation.md",
  "target": "docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md",
  "anchor": null,
  "reason": "specific-candidate",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-643: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/proposals/step-10-a0-coding-domain-boundary-facade-plan.md",
  "line": 39,
  "label": "System Vision: Trong Mem Ngoai Cung",
  "legacy": "docs/architect/system-vision-trong-mem-ngoai-cung.md",
  "before": "../../architect/system-vision-trong-mem-ngoai-cung.md",
  "after": "../system-architecture/architecture/system-vision-trong-mem-ngoai-cung.md",
  "target": "docs/platform/system-architecture/architecture/system-vision-trong-mem-ngoai-cung.md",
  "anchor": null,
  "reason": "explicit-alias",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/system-architecture/architecture/system-vision-trong-mem-ngoai-cung.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-644: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/proposals/step-10-coding-domain-adoption.md",
  "line": 72,
  "label": "Agent Coordination Vision",
  "legacy": "docs/architect/agent-coordination/vision.md",
  "before": "../../architect/agent-coordination/vision.md",
  "after": "../agent-coordination/vision.md",
  "target": "docs/platform/agent-coordination/vision.md",
  "anchor": null,
  "reason": "specific-candidate",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/agent-coordination/vision.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-645: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/proposals/step-10-coding-domain-adoption.md",
  "line": 239,
  "label": "Step 10 A0 - Coding Domain Boundary And Facade Plan",
  "legacy": "docs/architect/proposals/step-10-a0-coding-domain-boundary-facade-plan.md",
  "before": "../../architect/proposals/step-10-a0-coding-domain-boundary-facade-plan.md",
  "after": "step-10-a0-coding-domain-boundary-facade-plan.md",
  "target": "docs/platform/proposals/step-10-a0-coding-domain-boundary-facade-plan.md",
  "anchor": null,
  "reason": "explicit-alias",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/proposals/step-10-a0-coding-domain-boundary-facade-plan.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-646: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/proposals/step-10-coding-domain-adoption.md",
  "line": 353,
  "label": "Component Authority Boundary Map",
  "legacy": "docs/architect/proposals/component-authority-boundary-map.md",
  "before": "../../architect/proposals/component-authority-boundary-map.md",
  "after": "component-authority-boundary-map.md",
  "target": "docs/platform/proposals/component-authority-boundary-map.md",
  "anchor": null,
  "reason": "explicit-alias",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/proposals/component-authority-boundary-map.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-647: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/proposals/step-10-coding-domain-adoption.md",
  "line": 462,
  "label": "advisory §10",
  "legacy": "docs/architect/component-boundary/component-boundary-advisory.md",
  "before": "../../architect/component-boundary/component-boundary-advisory.md",
  "after": "../component-boundary.md",
  "target": "docs/platform/component-boundary.md",
  "anchor": null,
  "reason": "explicit-alias",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/component-boundary.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-648: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/proposals/step-10-coding-domain-adoption.md",
  "line": 584,
  "label": "Component Authority Boundary Map",
  "legacy": "docs/architect/proposals/component-authority-boundary-map.md",
  "before": "../../architect/proposals/component-authority-boundary-map.md",
  "after": "component-authority-boundary-map.md",
  "target": "docs/platform/proposals/component-authority-boundary-map.md",
  "anchor": null,
  "reason": "explicit-alias",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/proposals/component-authority-boundary-map.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-649: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md",
  "line": 34,
  "label": "Visibility And Herdr",
  "legacy": "docs/architect/agent-coordination/architecture/visibility-and-herdr.md",
  "before": "../../architect/agent-coordination/architecture/visibility-and-herdr.md",
  "after": "../agent-coordination/architecture/visibility-and-herdr.md",
  "target": "docs/platform/agent-coordination/architecture/visibility-and-herdr.md",
  "anchor": null,
  "reason": "specific-candidate",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/agent-coordination/architecture/visibility-and-herdr.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-650: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md",
  "line": 35,
  "label": "Dispatch Control Plane",
  "legacy": "docs/architect/agent-coordination/architecture/dispatch-control-plane.md",
  "before": "../../architect/agent-coordination/architecture/dispatch-control-plane.md",
  "after": "../agent-coordination/architecture/dispatch-control-plane.md",
  "target": "docs/platform/agent-coordination/architecture/dispatch-control-plane.md",
  "anchor": null,
  "reason": "specific-candidate",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/agent-coordination/architecture/dispatch-control-plane.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-651: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md",
  "line": 36,
  "label": "Coordination ↔ Dispatch contract",
  "legacy": "docs/architect/proposals/coordination-dispatch-contract.md",
  "before": "../../architect/proposals/coordination-dispatch-contract.md",
  "after": "coordination-dispatch-contract.md",
  "target": "docs/platform/proposals/coordination-dispatch-contract.md",
  "anchor": null,
  "reason": "explicit-alias",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/proposals/coordination-dispatch-contract.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-652: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md",
  "line": 37,
  "label": "Worker/provider/control boundary",
  "legacy": "docs/architect/proposals/coordination-worker-provider-boundary.md",
  "before": "../../architect/proposals/coordination-worker-provider-boundary.md",
  "after": "coordination-worker-provider-boundary.md",
  "target": "docs/platform/proposals/coordination-worker-provider-boundary.md",
  "anchor": null,
  "reason": "explicit-alias",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/proposals/coordination-worker-provider-boundary.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-653: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md",
  "line": 39,
  "label": "Brainstorm 2026-08-27 (superseded)",
  "legacy": "docs/architect/agent-coordination/history/brainstorms/agent-team-dispatch-and-herdr-stability-2026-08-27.md",
  "before": "../../architect/agent-coordination/history/brainstorms/agent-team-dispatch-and-herdr-stability-2026-08-27.md",
  "after": "../agent-coordination/history/brainstorms/agent-team-dispatch-and-herdr-stability-2026-08-27.md",
  "target": "docs/platform/agent-coordination/history/brainstorms/agent-team-dispatch-and-herdr-stability-2026-08-27.md",
  "anchor": null,
  "reason": "explicit-alias",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/agent-coordination/history/brainstorms/agent-team-dispatch-and-herdr-stability-2026-08-27.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-654: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md",
  "line": 517,
  "label": "permission-posture-findings",
  "legacy": "docs/architect/agent-coordination/verification/visibility-herdr/proofs/2026-09-06-isolation/permission-posture-findings.md",
  "before": "../../architect/agent-coordination/verification/visibility-herdr/proofs/2026-09-06-isolation/permission-posture-findings.md",
  "after": "../agent-coordination/verification/visibility-herdr/proofs/2026-09-06-isolation/permission-posture-findings.md",
  "target": "docs/platform/agent-coordination/verification/visibility-herdr/proofs/2026-09-06-isolation/permission-posture-findings.md",
  "anchor": null,
  "reason": "explicit-alias",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/agent-coordination/verification/visibility-herdr/proofs/2026-09-06-isolation/permission-posture-findings.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-655: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/runner/architecture/h-7af1f0242611.md",
  "line": 54,
  "label": "Dispatch Control Plane",
  "legacy": "docs/architect/agent-coordination/architecture/dispatch-control-plane.md",
  "before": "../../../architect/agent-coordination/architecture/dispatch-control-plane.md",
  "after": "../../agent-coordination/architecture/dispatch-control-plane.md",
  "target": "docs/platform/agent-coordination/architecture/dispatch-control-plane.md",
  "anchor": null,
  "reason": "specific-candidate",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/agent-coordination/architecture/dispatch-control-plane.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-656: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "line": 1561,
  "label": "confinement-authority.md §13.1",
  "legacy": "docs/specs/confinement-authority.md",
  "before": "../../../specs/confinement-authority.md",
  "after": "../../agent-confinement/spec.md",
  "target": "docs/platform/agent-confinement/spec.md",
  "anchor": null,
  "reason": "specific-candidate",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/agent-confinement/spec.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-657: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/system-architecture/architecture/architecture-intent.md",
  "line": 61,
  "label": "System Vision: Trong Mem Ngoai Cung",
  "legacy": "docs/architect/system-vision-trong-mem-ngoai-cung.md",
  "before": "../../../architect/system-vision-trong-mem-ngoai-cung.md",
  "after": "system-vision-trong-mem-ngoai-cung.md",
  "target": "docs/platform/system-architecture/architecture/system-vision-trong-mem-ngoai-cung.md",
  "anchor": null,
  "reason": "explicit-alias",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/system-architecture/architecture/system-vision-trong-mem-ngoai-cung.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-658: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/system-architecture/architecture/architecture-intent.md",
  "line": 699,
  "label": "Step 09 - Group Thinking Substrate",
  "legacy": "docs/architect/proposals/step-09-group-thinking-substrate.md",
  "before": "../../../architect/proposals/step-09-group-thinking-substrate.md",
  "after": "../../proposals/step-09-group-thinking-substrate.md",
  "target": "docs/platform/proposals/step-09-group-thinking-substrate.md",
  "anchor": null,
  "reason": "explicit-alias",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/proposals/step-09-group-thinking-substrate.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-659: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/system-architecture/architecture/workspace-topology-audit.md",
  "line": 29,
  "label": "workspace-topology.md",
  "legacy": "docs/architect/workspace-topology.md",
  "before": "../../../architect/workspace-topology.md",
  "after": "workspace-topology.md",
  "target": "docs/platform/system-architecture/architecture/workspace-topology.md",
  "anchor": null,
  "reason": "explicit-alias",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/system-architecture/architecture/workspace-topology.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-660: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/system-architecture/architecture/workspace-topology-roadmap.md",
  "line": 26,
  "label": "workspace-topology.md",
  "legacy": "docs/architect/workspace-topology.md",
  "before": "../../../architect/workspace-topology.md",
  "after": "workspace-topology.md",
  "target": "docs/platform/system-architecture/architecture/workspace-topology.md",
  "anchor": null,
  "reason": "explicit-alias",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/system-architecture/architecture/workspace-topology.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-661: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/system-architecture/architecture/workspace-topology-roadmap.md",
  "line": 31,
  "label": "workspace-topology.md",
  "legacy": "docs/architect/workspace-topology.md",
  "before": "../../../architect/workspace-topology.md",
  "after": "workspace-topology.md",
  "target": "docs/platform/system-architecture/architecture/workspace-topology.md",
  "anchor": null,
  "reason": "explicit-alias",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/system-architecture/architecture/workspace-topology.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-662: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/system-architecture/architecture/workspace-topology-roadmap.md",
  "line": 32,
  "label": "workspace-topology-audit.md",
  "legacy": "docs/architect/workspace-topology-audit.md",
  "before": "../../../architect/workspace-topology-audit.md",
  "after": "workspace-topology-audit.md",
  "target": "docs/platform/system-architecture/architecture/workspace-topology-audit.md",
  "anchor": null,
  "reason": "explicit-alias",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/system-architecture/architecture/workspace-topology-audit.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-663: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/system-architecture/architecture/workspace-topology.md",
  "line": 46,
  "label": "workspace-topology-audit.md",
  "legacy": "docs/architect/workspace-topology-audit.md",
  "before": "../../../architect/workspace-topology-audit.md",
  "after": "workspace-topology-audit.md",
  "target": "docs/platform/system-architecture/architecture/workspace-topology-audit.md",
  "anchor": null,
  "reason": "explicit-alias",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/system-architecture/architecture/workspace-topology-audit.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-664: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/system-architecture/architecture/workspace-topology.md",
  "line": 48,
  "label": "workspace-topology-roadmap.md",
  "legacy": "docs/architect/workspace-topology-roadmap.md",
  "before": "../../../architect/workspace-topology-roadmap.md",
  "after": "workspace-topology-roadmap.md",
  "target": "docs/platform/system-architecture/architecture/workspace-topology-roadmap.md",
  "anchor": null,
  "reason": "explicit-alias",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/system-architecture/architecture/workspace-topology-roadmap.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-665: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/vision.md",
  "line": 91,
  "label": "../doc-governance.md",
  "legacy": "docs/doc-governance.md",
  "before": "../doc-governance.md",
  "after": "governance.md",
  "target": "docs/platform/governance.md",
  "anchor": null,
  "reason": "explicit-alias",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/governance.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-666: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/vision.md",
  "line": 92,
  "label": "../platform-foundations.md",
  "legacy": "docs/platform-foundations.md",
  "before": "../platform-foundations.md",
  "after": "platform-foundations.md",
  "target": "docs/platform/platform-foundations.md",
  "anchor": null,
  "reason": "explicit-alias",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/platform-foundations.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-667: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/work-state/README.md",
  "line": 61,
  "label": "docs/work-item-lifecycle-vision.md",
  "legacy": "docs/work-item-lifecycle-vision.md",
  "before": "../../work-item-lifecycle-vision.md",
  "after": "../vision.md",
  "target": "docs/platform/vision.md",
  "anchor": null,
  "reason": "explicit-alias",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/vision.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-668: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/work-state/README.md",
  "line": 74,
  "label": "../../work-item-lifecycle-vision.md",
  "legacy": "docs/work-item-lifecycle-vision.md",
  "before": "../../work-item-lifecycle-vision.md",
  "after": "../vision.md",
  "target": "docs/platform/vision.md",
  "anchor": null,
  "reason": "explicit-alias",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/vision.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-669: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/work-state/spec.md",
  "line": 1204,
  "label": "docs/io-contract.md",
  "legacy": "docs/io-contract.md",
  "before": "../../io-contract.md",
  "after": "contracts/cli-io-contract.md",
  "target": "docs/platform/work-state/contracts/cli-io-contract.md",
  "anchor": null,
  "reason": "explicit-alias",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/work-state/contracts/cli-io-contract.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-670: explicit-source-relationship-classification

```json
{
  "kind": "explicit-source-relationship-classification",
  "file": "docs/platform/README.md",
  "line": 32,
  "label": "../platform-foundations.md",
  "legacy": "docs/platform-foundations.md",
  "before": "../platform-foundations.md",
  "reason": "provenance/legacy-owner",
  "disposition": "retain-legacy-until-cutover"
}
```

## Entry f-671: explicit-source-relationship-classification

```json
{
  "kind": "explicit-source-relationship-classification",
  "file": "docs/platform/README.md",
  "line": 32,
  "label": "../work-item-lifecycle-vision.md",
  "legacy": "docs/work-item-lifecycle-vision.md",
  "before": "../work-item-lifecycle-vision.md",
  "reason": "provenance/legacy-owner",
  "disposition": "retain-legacy-until-cutover"
}
```

## Entry f-672: explicit-source-relationship-classification

```json
{
  "kind": "explicit-source-relationship-classification",
  "file": "docs/platform/README.md",
  "line": 33,
  "label": "../architect/agent-coordination/intent-preservation-ledger.md",
  "legacy": "docs/architect/agent-coordination/intent-preservation-ledger.md",
  "before": "../architect/agent-coordination/intent-preservation-ledger.md",
  "reason": "provenance/legacy-owner",
  "disposition": "retain-legacy-until-cutover"
}
```

## Entry f-673: explicit-source-relationship-classification

```json
{
  "kind": "explicit-source-relationship-classification",
  "file": "docs/platform/README.md",
  "line": 34,
  "label": "../platform-foundations.md",
  "legacy": "docs/platform-foundations.md",
  "before": "../platform-foundations.md",
  "reason": "provenance/legacy-owner",
  "disposition": "retain-legacy-until-cutover"
}
```

## Entry f-674: explicit-source-relationship-classification

```json
{
  "kind": "explicit-source-relationship-classification",
  "file": "docs/platform/README.md",
  "line": 35,
  "label": "../architecture-map.md",
  "legacy": "docs/architecture-map.md",
  "before": "../architecture-map.md",
  "reason": "provenance/legacy-owner",
  "disposition": "retain-legacy-until-cutover"
}
```

## Entry f-675: explicit-source-relationship-classification

```json
{
  "kind": "explicit-source-relationship-classification",
  "file": "docs/platform/README.md",
  "line": 37,
  "label": "../routing-handoff-contract.md",
  "legacy": "docs/routing-handoff-contract.md",
  "before": "../routing-handoff-contract.md",
  "reason": "provenance/legacy-owner",
  "disposition": "retain-legacy-until-cutover"
}
```

## Entry f-676: explicit-source-relationship-classification

```json
{
  "kind": "explicit-source-relationship-classification",
  "file": "docs/platform/README.md",
  "line": 45,
  "label": "../specs/runner.md",
  "legacy": "docs/specs/runner.md",
  "before": "../specs/runner.md",
  "reason": "provenance/legacy-owner",
  "disposition": "retain-legacy-until-cutover"
}
```

## Entry f-677: explicit-source-relationship-classification

```json
{
  "kind": "explicit-source-relationship-classification",
  "file": "docs/platform/README.md",
  "line": 46,
  "label": "../specs/work-state.md",
  "legacy": "docs/specs/work-state.md",
  "before": "../specs/work-state.md",
  "reason": "provenance/legacy-owner",
  "disposition": "retain-legacy-until-cutover"
}
```

## Entry f-678: explicit-source-relationship-classification

```json
{
  "kind": "explicit-source-relationship-classification",
  "file": "docs/platform/README.md",
  "line": 47,
  "label": "../specs/distribution.md",
  "legacy": "docs/specs/distribution.md",
  "before": "../specs/distribution.md",
  "reason": "provenance/legacy-owner",
  "disposition": "retain-legacy-until-cutover"
}
```

## Entry f-679: explicit-source-relationship-classification

```json
{
  "kind": "explicit-source-relationship-classification",
  "file": "docs/platform/README.md",
  "line": 47,
  "label": "../distribution-vision.md",
  "legacy": "docs/distribution-vision.md",
  "before": "../distribution-vision.md",
  "reason": "provenance/legacy-owner",
  "disposition": "retain-legacy-until-cutover"
}
```

## Entry f-680: explicit-source-relationship-classification

```json
{
  "kind": "explicit-source-relationship-classification",
  "file": "docs/platform/component-boundary.md",
  "line": 46,
  "label": "../architect/component-boundary/README.md",
  "legacy": "docs/architect/component-boundary/README.md",
  "before": "../architect/component-boundary/README.md",
  "reason": "self-link",
  "disposition": "retain-legacy-until-cutover"
}
```

## Entry f-681: explicit-source-relationship-classification

```json
{
  "kind": "explicit-source-relationship-classification",
  "file": "docs/platform/component-boundary.md",
  "line": 47,
  "label": "../architect/component-boundary/component-boundary-advisory.md",
  "legacy": "docs/architect/component-boundary/component-boundary-advisory.md",
  "before": "../architect/component-boundary/component-boundary-advisory.md",
  "reason": "self-link",
  "disposition": "retain-legacy-until-cutover"
}
```

## Entry f-682: explicit-source-relationship-classification

```json
{
  "kind": "explicit-source-relationship-classification",
  "file": "docs/platform/component-boundary.md",
  "line": 70,
  "label": "../architect/component-boundary/component-boundary-advisory.md",
  "legacy": "docs/architect/component-boundary/component-boundary-advisory.md",
  "before": "../architect/component-boundary/component-boundary-advisory.md",
  "reason": "provenance/legacy-owner",
  "disposition": "retain-legacy-until-cutover"
}
```

## Entry f-683: explicit-source-relationship-classification

```json
{
  "kind": "explicit-source-relationship-classification",
  "file": "docs/platform/component-boundary.md",
  "line": 71,
  "label": "../specs/runner.md",
  "legacy": "docs/specs/runner.md",
  "before": "../specs/runner.md",
  "reason": "provenance/legacy-owner",
  "disposition": "retain-legacy-until-cutover"
}
```

## Entry f-684: explicit-source-relationship-classification

```json
{
  "kind": "explicit-source-relationship-classification",
  "file": "docs/platform/component-boundary.md",
  "line": 72,
  "label": "../specs/runner.md",
  "legacy": "docs/specs/runner.md",
  "before": "../specs/runner.md",
  "reason": "provenance/legacy-owner",
  "disposition": "retain-legacy-until-cutover"
}
```

## Entry f-685: explicit-source-relationship-classification

```json
{
  "kind": "explicit-source-relationship-classification",
  "file": "docs/platform/component-boundary.md",
  "line": 73,
  "label": "../specs/runner.md",
  "legacy": "docs/specs/runner.md",
  "before": "../specs/runner.md",
  "reason": "provenance/legacy-owner",
  "disposition": "retain-legacy-until-cutover"
}
```

## Entry f-686: explicit-source-relationship-classification

```json
{
  "kind": "explicit-source-relationship-classification",
  "file": "docs/platform/component-boundary.md",
  "line": 74,
  "label": "../specs/herdr-web-dashboard.md",
  "legacy": "docs/specs/herdr-web-dashboard.md",
  "before": "../specs/herdr-web-dashboard.md",
  "reason": "provenance/legacy-owner",
  "disposition": "retain-legacy-until-cutover"
}
```

## Entry f-687: explicit-source-relationship-classification

```json
{
  "kind": "explicit-source-relationship-classification",
  "file": "docs/platform/component-boundary.md",
  "line": 75,
  "label": "../specs/herdr-web-dashboard.md",
  "legacy": "docs/specs/herdr-web-dashboard.md",
  "before": "../specs/herdr-web-dashboard.md",
  "reason": "provenance/legacy-owner",
  "disposition": "retain-legacy-until-cutover"
}
```

## Entry f-688: explicit-source-relationship-classification

```json
{
  "kind": "explicit-source-relationship-classification",
  "file": "docs/platform/component-boundary.md",
  "line": 76,
  "label": "../specs/confinement-authority.md",
  "legacy": "docs/specs/confinement-authority.md",
  "before": "../specs/confinement-authority.md",
  "reason": "provenance/legacy-owner",
  "disposition": "retain-legacy-until-cutover"
}
```

## Entry f-689: explicit-source-relationship-classification

```json
{
  "kind": "explicit-source-relationship-classification",
  "file": "docs/platform/component-boundary.md",
  "line": 77,
  "label": "../architect/agent-coordination/architecture/evidence-and-results.md",
  "legacy": "docs/architect/agent-coordination/architecture/evidence-and-results.md",
  "before": "../architect/agent-coordination/architecture/evidence-and-results.md",
  "reason": "provenance/legacy-owner",
  "disposition": "retain-legacy-until-cutover"
}
```

## Entry f-690: explicit-source-relationship-classification

```json
{
  "kind": "explicit-source-relationship-classification",
  "file": "docs/platform/component-boundary.md",
  "line": 82,
  "label": "../specs/observe.md",
  "legacy": "docs/specs/observe.md",
  "before": "../specs/observe.md",
  "reason": "provenance/legacy-owner",
  "disposition": "retain-legacy-until-cutover"
}
```

## Entry f-691: explicit-source-relationship-classification

```json
{
  "kind": "explicit-source-relationship-classification",
  "file": "docs/platform/component-boundary.md",
  "line": 97,
  "label": "../architect/component-boundary/component-boundary-advisory.md",
  "legacy": "docs/architect/component-boundary/component-boundary-advisory.md",
  "before": "../architect/component-boundary/component-boundary-advisory.md",
  "reason": "self-link",
  "disposition": "retain-legacy-until-cutover"
}
```

## Entry f-692: explicit-source-relationship-classification

```json
{
  "kind": "explicit-source-relationship-classification",
  "file": "docs/platform/component-boundary.md",
  "line": 404,
  "label": "Visibility And Herdr",
  "legacy": "docs/architect/agent-coordination/architecture/visibility-and-herdr.md",
  "before": "../architect/agent-coordination/architecture/visibility-and-herdr.md",
  "reason": "provenance/legacy-owner",
  "disposition": "retain-legacy-until-cutover"
}
```

## Entry f-693: explicit-source-relationship-classification

```json
{
  "kind": "explicit-source-relationship-classification",
  "file": "docs/platform/component-boundary.md",
  "line": 448,
  "label": "Dispatch Control Plane",
  "legacy": "docs/architect/agent-coordination/architecture/dispatch-control-plane.md",
  "before": "../architect/agent-coordination/architecture/dispatch-control-plane.md",
  "reason": "provenance/legacy-owner",
  "disposition": "retain-legacy-until-cutover"
}
```

## Entry f-694: explicit-source-relationship-classification

```json
{
  "kind": "explicit-source-relationship-classification",
  "file": "docs/platform/component-boundary.md",
  "line": 1185,
  "label": "Component Boundary Advisory",
  "legacy": "docs/architect/component-boundary/component-boundary-advisory.md",
  "before": "../architect/component-boundary/component-boundary-advisory.md",
  "reason": "self-link",
  "disposition": "retain-legacy-until-cutover"
}
```

## Entry f-695: explicit-source-relationship-classification

```json
{
  "kind": "explicit-source-relationship-classification",
  "file": "docs/platform/component-boundary.md",
  "line": 1186,
  "label": "Repo Layout Vision",
  "legacy": "docs/architect/component-boundary/repo-layout-vision.md",
  "before": "../architect/component-boundary/repo-layout-vision.md",
  "reason": "self-link",
  "disposition": "retain-legacy-until-cutover"
}
```

## Entry f-696: explicit-source-relationship-classification

```json
{
  "kind": "explicit-source-relationship-classification",
  "file": "docs/platform/component-boundary.md",
  "line": 1246,
  "label": "component-boundary-advisory.md",
  "legacy": "docs/architect/component-boundary/component-boundary-advisory.md",
  "before": "../architect/component-boundary/component-boundary-advisory.md",
  "reason": "self-link",
  "disposition": "retain-legacy-until-cutover"
}
```

## Entry f-697: explicit-source-relationship-classification

```json
{
  "kind": "explicit-source-relationship-classification",
  "file": "docs/platform/component-boundary.md",
  "line": 1272,
  "label": "repo-layout-vision.md",
  "legacy": "docs/architect/component-boundary/repo-layout-vision.md",
  "before": "../architect/component-boundary/repo-layout-vision.md",
  "reason": "self-link",
  "disposition": "retain-legacy-until-cutover"
}
```

## Entry f-698: explicit-source-relationship-classification

```json
{
  "kind": "explicit-source-relationship-classification",
  "file": "docs/platform/documentation/architecture/documentation-system-design.md",
  "line": 24,
  "label": "original source",
  "legacy": "docs/architect/documentation-system-design.md",
  "before": "../../../architect/documentation-system-design.md",
  "reason": "provenance/legacy-owner",
  "disposition": "retain-legacy-until-cutover"
}
```

## Entry f-699: explicit-source-relationship-classification

```json
{
  "kind": "explicit-source-relationship-classification",
  "file": "docs/platform/domainization/architecture/domainization.md",
  "line": 24,
  "label": "original source",
  "legacy": "docs/architect/domainization/README.md",
  "before": "../../../architect/domainization/README.md",
  "reason": "provenance/legacy-owner",
  "disposition": "retain-legacy-until-cutover"
}
```

## Entry f-700: explicit-source-relationship-classification

```json
{
  "kind": "explicit-source-relationship-classification",
  "file": "docs/platform/host-invocation-routing/architecture/external-provider-protocol.md",
  "line": 43,
  "label": "source protocol §3",
  "legacy": "docs/architect/host-invocation-routing/external-provider-protocol.md",
  "before": "../../../architect/host-invocation-routing/external-provider-protocol.md#3-component-protocol",
  "reason": "provenance/legacy-owner",
  "disposition": "retain-legacy-until-cutover"
}
```

## Entry f-701: explicit-source-relationship-classification

```json
{
  "kind": "explicit-source-relationship-classification",
  "file": "docs/platform/host-invocation-routing/architecture/external-provider-protocol.md",
  "line": 44,
  "label": "source protocol §4",
  "legacy": "docs/architect/host-invocation-routing/external-provider-protocol.md",
  "before": "../../../architect/host-invocation-routing/external-provider-protocol.md#4-plugin-registry-linker",
  "reason": "provenance/legacy-owner",
  "disposition": "retain-legacy-until-cutover"
}
```

## Entry f-702: explicit-source-relationship-classification

```json
{
  "kind": "explicit-source-relationship-classification",
  "file": "docs/platform/host-invocation-routing/architecture/external-provider-protocol.md",
  "line": 54,
  "label": "../../../architect/host-invocation-routing/external-provider-protocol.md",
  "legacy": "docs/architect/host-invocation-routing/external-provider-protocol.md",
  "before": "../../../architect/host-invocation-routing/external-provider-protocol.md",
  "reason": "provenance/legacy-owner",
  "disposition": "retain-legacy-until-cutover"
}
```

## Entry f-703: explicit-source-relationship-classification

```json
{
  "kind": "explicit-source-relationship-classification",
  "file": "docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md",
  "line": 44,
  "label": "source transition §1",
  "legacy": "docs/architect/host-invocation-routing/legacy-cli-transition.md",
  "before": "../../../architect/host-invocation-routing/legacy-cli-transition.md#1-two-distinct-adapters",
  "reason": "self-link",
  "disposition": "retain-legacy-until-cutover"
}
```

## Entry f-704: explicit-source-relationship-classification

```json
{
  "kind": "explicit-source-relationship-classification",
  "file": "docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md",
  "line": 45,
  "label": "source transition §4",
  "legacy": "docs/architect/host-invocation-routing/legacy-cli-transition.md",
  "before": "../../../architect/host-invocation-routing/legacy-cli-transition.md#4-public-presentation-versus-semantic-outcome",
  "reason": "self-link",
  "disposition": "retain-legacy-until-cutover"
}
```

## Entry f-705: explicit-source-relationship-classification

```json
{
  "kind": "explicit-source-relationship-classification",
  "file": "docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md",
  "line": 54,
  "label": "../../../architect/host-invocation-routing/legacy-cli-transition.md",
  "legacy": "docs/architect/host-invocation-routing/legacy-cli-transition.md",
  "before": "../../../architect/host-invocation-routing/legacy-cli-transition.md",
  "reason": "self-link",
  "disposition": "retain-legacy-until-cutover"
}
```

## Entry f-706: explicit-source-relationship-classification

```json
{
  "kind": "explicit-source-relationship-classification",
  "file": "docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md",
  "line": 47,
  "label": "source migration §2",
  "legacy": "docs/architect/host-invocation-routing/node-to-rust-component-migration.md",
  "before": "../../../architect/host-invocation-routing/node-to-rust-component-migration.md#2-options-considered",
  "reason": "self-link",
  "disposition": "retain-legacy-until-cutover"
}
```

## Entry f-707: explicit-source-relationship-classification

```json
{
  "kind": "explicit-source-relationship-classification",
  "file": "docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md",
  "line": 48,
  "label": "source migration §10",
  "legacy": "docs/architect/host-invocation-routing/node-to-rust-component-migration.md",
  "before": "../../../architect/host-invocation-routing/node-to-rust-component-migration.md#10-migrate-read-models-before-writers",
  "reason": "self-link",
  "disposition": "retain-legacy-until-cutover"
}
```

## Entry f-708: explicit-source-relationship-classification

```json
{
  "kind": "explicit-source-relationship-classification",
  "file": "docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md",
  "line": 49,
  "label": "source migration §11",
  "legacy": "docs/architect/host-invocation-routing/node-to-rust-component-migration.md",
  "before": "../../../architect/host-invocation-routing/node-to-rust-component-migration.md#11-migrate-state-writing-components",
  "reason": "self-link",
  "disposition": "retain-legacy-until-cutover"
}
```

## Entry f-709: explicit-source-relationship-classification

```json
{
  "kind": "explicit-source-relationship-classification",
  "file": "docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md",
  "line": 58,
  "label": "../../../architect/host-invocation-routing/node-to-rust-component-migration.md",
  "legacy": "docs/architect/host-invocation-routing/node-to-rust-component-migration.md",
  "before": "../../../architect/host-invocation-routing/node-to-rust-component-migration.md",
  "reason": "self-link",
  "disposition": "retain-legacy-until-cutover"
}
```

## Entry f-710: explicit-source-relationship-classification

```json
{
  "kind": "explicit-source-relationship-classification",
  "file": "docs/platform/host-invocation-routing/contracts/component-protocol.md",
  "line": 46,
  "label": "source protocol §3",
  "legacy": "docs/architect/host-invocation-routing/external-provider-protocol.md",
  "before": "../../../architect/host-invocation-routing/external-provider-protocol.md#3-component-protocol",
  "reason": "provenance/legacy-owner",
  "disposition": "retain-legacy-until-cutover"
}
```

## Entry f-711: explicit-source-relationship-classification

```json
{
  "kind": "explicit-source-relationship-classification",
  "file": "docs/platform/host-invocation-routing/contracts/external-provider-manifest.md",
  "line": 44,
  "label": "source protocol §4",
  "legacy": "docs/architect/host-invocation-routing/external-provider-protocol.md",
  "before": "../../../architect/host-invocation-routing/external-provider-protocol.md#4-plugin-registry-linker",
  "reason": "provenance/legacy-owner",
  "disposition": "retain-legacy-until-cutover"
}
```

## Entry f-712: explicit-source-relationship-classification

```json
{
  "kind": "explicit-source-relationship-classification",
  "file": "docs/platform/host-invocation-routing/contracts/external-provider-manifest.md",
  "line": 45,
  "label": "source protocol §4",
  "legacy": "docs/architect/host-invocation-routing/external-provider-protocol.md",
  "before": "../../../architect/host-invocation-routing/external-provider-protocol.md#4-plugin-registry-linker",
  "reason": "provenance/legacy-owner",
  "disposition": "retain-legacy-until-cutover"
}
```

## Entry f-713: explicit-source-relationship-classification

```json
{
  "kind": "explicit-source-relationship-classification",
  "file": "docs/platform/host-invocation-routing/intent-preservation-ledger.md",
  "line": 69,
  "label": "host-invocation-provider-routing.md",
  "legacy": "docs/architect/host-invocation-routing/host-invocation-provider-routing.md",
  "before": "../../architect/host-invocation-routing/host-invocation-provider-routing.md#3-canonical-names",
  "reason": "provenance/legacy-owner",
  "disposition": "retain-legacy-until-cutover"
}
```

## Entry f-714: explicit-source-relationship-classification

```json
{
  "kind": "explicit-source-relationship-classification",
  "file": "docs/platform/host-invocation-routing/verification/source-preservation-audit.md",
  "line": 42,
  "label": "host-invocation-provider-routing.md",
  "legacy": "docs/architect/host-invocation-routing/host-invocation-provider-routing.md",
  "before": "../../../architect/host-invocation-routing/host-invocation-provider-routing.md",
  "reason": "provenance/legacy-owner",
  "disposition": "retain-legacy-until-cutover"
}
```

## Entry f-715: explicit-source-relationship-classification

```json
{
  "kind": "explicit-source-relationship-classification",
  "file": "docs/platform/proposals/README.md",
  "line": 24,
  "label": "original source",
  "legacy": "docs/architect/proposals/README.md",
  "before": "../../architect/proposals/README.md",
  "reason": "provenance/legacy-owner",
  "disposition": "retain-legacy-until-cutover"
}
```

## Entry f-716: explicit-source-relationship-classification

```json
{
  "kind": "explicit-source-relationship-classification",
  "file": "docs/platform/proposals/architecture-advisory-panel.md",
  "line": 24,
  "label": "original source",
  "legacy": "docs/architect/proposals/architecture-advisory-panel.md",
  "before": "../../architect/proposals/architecture-advisory-panel.md",
  "reason": "provenance/legacy-owner",
  "disposition": "retain-legacy-until-cutover"
}
```

## Entry f-717: explicit-source-relationship-classification

```json
{
  "kind": "explicit-source-relationship-classification",
  "file": "docs/platform/proposals/component-authority-boundary-map.md",
  "line": 24,
  "label": "original source",
  "legacy": "docs/architect/proposals/component-authority-boundary-map.md",
  "before": "../../architect/proposals/component-authority-boundary-map.md",
  "reason": "provenance/legacy-owner",
  "disposition": "retain-legacy-until-cutover"
}
```

## Entry f-718: explicit-source-relationship-classification

```json
{
  "kind": "explicit-source-relationship-classification",
  "file": "docs/platform/proposals/component-authority-boundary-map.md",
  "line": 216,
  "label": "Dispatch Control Plane",
  "legacy": "docs/architect/agent-coordination/architecture/dispatch-control-plane.md",
  "before": "../../architect/agent-coordination/architecture/dispatch-control-plane.md",
  "reason": "provenance/legacy-owner",
  "disposition": "retain-legacy-until-cutover"
}
```

## Entry f-719: explicit-source-relationship-classification

```json
{
  "kind": "explicit-source-relationship-classification",
  "file": "docs/platform/proposals/component-authority-boundary-map.md",
  "line": 521,
  "label": "Component Boundary Advisory §9",
  "legacy": "docs/architect/component-boundary/component-boundary-advisory.md",
  "before": "../../architect/component-boundary/component-boundary-advisory.md#9-hexagonal-architecture-view",
  "reason": "provenance/legacy-owner",
  "disposition": "retain-legacy-until-cutover"
}
```

## Entry f-720: explicit-source-relationship-classification

```json
{
  "kind": "explicit-source-relationship-classification",
  "file": "docs/platform/proposals/component-authority-boundary-map.md",
  "line": 521,
  "label": "Dispatch Control Plane",
  "legacy": "docs/architect/agent-coordination/architecture/dispatch-control-plane.md",
  "before": "../../architect/agent-coordination/architecture/dispatch-control-plane.md",
  "reason": "provenance/legacy-owner",
  "disposition": "retain-legacy-until-cutover"
}
```

