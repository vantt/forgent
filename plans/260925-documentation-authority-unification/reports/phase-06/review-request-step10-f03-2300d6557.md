# Current link pass and helper rules — part 3

One replacement review request; entries 241–360 of section f. **120 entries**. Content and SYNC `2300d65571968bb3bcb80123a273272586e3f1db`; comparison base `980cb29312b8701f5ea639278f44e1a57a6e5c02`. [Single index](review-request-step10-index-2300d6557.md). Old requests packaged at `8d38b18ed` are superseded. No producer seed or verdict.

Current decision and current witness fields take precedence over explicitly preserved historical records. Every rebound row is pending; old reviewed fields occur only inside historical before records. A36 deep lists are in [A36](step10-sync2300-A36.json); all truth corrections, all partial carries and all unequal source/target rows require deep review.

## Entry f-241: link-241

```json
{
  "id": "link-241",
  "original": {
    "path": "docs/platform/proposals/component-authority-boundary-map.md",
    "inputLine": 521,
    "inputColumn": 80,
    "lineBeforeLinkPass": 521,
    "before": "[Component Boundary Advisory §9](../../architect/component-boundary/component-boundary-advisory.md#9-hexagonal-architecture-view)",
    "after": "[Component Boundary Advisory §9](../component-boundary.md#9-hexagonal-architecture-view)",
    "legacyPath": "docs/architect/component-boundary/component-boundary-advisory.md",
    "target": {
      "path": "docs/platform/component-boundary.md",
      "anchor": "9-hexagonal-architecture-view",
      "aliasId": "step10-whole-system-0233"
    },
    "portal": false,
    "area": "proposals",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/proposals/component-authority-boundary-map.md",
    "line": 521,
    "legacy": "docs/architect/component-boundary/component-boundary-advisory.md",
    "previous": "[Component Boundary Advisory §9](../component-boundary.md#9-hexagonal-architecture-view)",
    "now": "../../architect/component-boundary/component-boundary-advisory.md#9-hexagonal-architecture-view",
    "action": "restored-legacy",
    "reason": "provenance/legacy-owner",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../../architect/component-boundary/component-boundary-advisory.md#9-hexagonal-architecture-view",
  "interimDestination": "../component-boundary.md#9-hexagonal-architecture-view",
  "newDestination": "../../architect/component-boundary/component-boundary-advisory.md#9-hexagonal-architecture-view",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/architect/component-boundary/component-boundary-advisory.md",
    "anchor": "9-hexagonal-architecture-view",
    "resolves": true,
    "fileSHA256": "913cbbc9419fc059e5ce1dcaeb7d06d6d90d6e9d3ef45195c15cd59ff0359bf3"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/component-boundary/component-boundary-advisory.md",
    "action": "restored-legacy",
    "reason": "provenance/legacy-owner",
    "selfRestored": false,
    "portalRetargeted": false,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-242: link-242

```json
{
  "id": "link-242",
  "original": {
    "path": "docs/platform/proposals/component-authority-boundary-map.md",
    "inputLine": 521,
    "inputColumn": 466,
    "lineBeforeLinkPass": 521,
    "before": "[Dispatch Control Plane](../../architect/agent-coordination/architecture/dispatch-control-plane.md)",
    "after": "[Dispatch Control Plane](../agent-coordination/README.md)",
    "legacyPath": "docs/architect/agent-coordination/architecture/dispatch-control-plane.md",
    "target": {
      "path": "docs/platform/agent-coordination/README.md",
      "anchor": null,
      "aliasId": "step10-agent-coordination-0122"
    },
    "portal": false,
    "area": "proposals",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/proposals/component-authority-boundary-map.md",
    "line": 521,
    "legacy": "docs/architect/agent-coordination/architecture/dispatch-control-plane.md",
    "previous": "[Dispatch Control Plane](../agent-coordination/README.md)",
    "now": "../../architect/agent-coordination/architecture/dispatch-control-plane.md",
    "action": "restored-legacy",
    "reason": "provenance/legacy-owner",
    "selfBefore": false,
    "portalBefore": true
  },
  "oldDestination": "../../architect/agent-coordination/architecture/dispatch-control-plane.md",
  "interimDestination": "../agent-coordination/README.md",
  "newDestination": "../../architect/agent-coordination/architecture/dispatch-control-plane.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/architect/agent-coordination/architecture/dispatch-control-plane.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "e45f4c8937f1af62c856999cb8d8bc9c3e52b72d61b0d97e44025d1ab587a63c"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/agent-coordination/architecture/dispatch-control-plane.md",
    "action": "restored-legacy",
    "reason": "provenance/legacy-owner",
    "selfRestored": false,
    "portalRetargeted": false,
    "portalRestored": true,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-243: link-243

```json
{
  "id": "link-243",
  "original": {
    "path": "docs/platform/proposals/coordination-capability-envelope.md",
    "inputLine": 24,
    "inputColumn": 22,
    "lineBeforeLinkPass": 24,
    "before": "[original source](../../architect/proposals/coordination-capability-envelope.md)",
    "after": "[original source](coordination-capability-envelope.md)",
    "legacyPath": "docs/architect/proposals/coordination-capability-envelope.md",
    "target": {
      "path": "docs/platform/proposals/coordination-capability-envelope.md",
      "anchor": null,
      "aliasId": "step10-proposals-redesigns-0230"
    },
    "portal": false,
    "area": "proposals",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/proposals/coordination-capability-envelope.md",
    "line": 24,
    "legacy": "docs/architect/proposals/coordination-capability-envelope.md",
    "previous": "[original source](coordination-capability-envelope.md)",
    "now": "../../architect/proposals/coordination-capability-envelope.md",
    "action": "restored-legacy",
    "reason": "provenance/legacy-owner",
    "selfBefore": true,
    "portalBefore": false
  },
  "oldDestination": "../../architect/proposals/coordination-capability-envelope.md",
  "interimDestination": "coordination-capability-envelope.md",
  "newDestination": "../../architect/proposals/coordination-capability-envelope.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/architect/proposals/coordination-capability-envelope.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "98788f9d29c5cc9215a492a95513abfee6f22c5a95fda0c3c9136f9750676492"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/proposals/coordination-capability-envelope.md",
    "action": "restored-legacy",
    "reason": "provenance/legacy-owner",
    "selfRestored": true,
    "portalRetargeted": false,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-244: link-244

```json
{
  "id": "link-244",
  "original": {
    "path": "docs/platform/proposals/coordination-capability-envelope.md",
    "inputLine": 37,
    "inputColumn": 1,
    "lineBeforeLinkPass": 37,
    "before": "[Chat progress and handoff](../../architect/proposals/coordination-envelope-progress.md)",
    "after": "[Chat progress and handoff](../agent-coordination/history/proposals-redesigns/coordination-envelope-progress.md)",
    "legacyPath": "docs/architect/proposals/coordination-envelope-progress.md",
    "target": {
      "path": "docs/platform/agent-coordination/history/proposals-redesigns/coordination-envelope-progress.md",
      "anchor": null,
      "aliasId": "step10-proposals-redesigns-0402"
    },
    "portal": false,
    "area": "proposals",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/proposals/coordination-capability-envelope.md",
    "line": 37,
    "legacy": "docs/architect/proposals/coordination-envelope-progress.md",
    "previous": "[Chat progress and handoff](../agent-coordination/history/proposals-redesigns/coordination-envelope-progress.md)",
    "now": "../agent-coordination/history/proposals-redesigns/coordination-envelope-progress.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../../architect/proposals/coordination-envelope-progress.md",
  "interimDestination": "../agent-coordination/history/proposals-redesigns/coordination-envelope-progress.md",
  "newDestination": "../agent-coordination/history/proposals-redesigns/coordination-envelope-progress.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/agent-coordination/history/proposals-redesigns/coordination-envelope-progress.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "875a2f7fe2989d987c980470959b1e64219b5a455f9db401db98928241a1f865"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/proposals/coordination-envelope-progress.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfRestored": false,
    "portalRetargeted": false,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-245: link-245

```json
{
  "id": "link-245",
  "original": {
    "path": "docs/platform/proposals/coordination-capability-envelope.md",
    "inputLine": 39,
    "inputColumn": 49,
    "lineBeforeLinkPass": 39,
    "before": "[Runner spec](../../specs/runner.md)",
    "after": "[Runner spec](../runner/README.md)",
    "legacyPath": "docs/specs/runner.md",
    "target": {
      "path": "docs/platform/runner/README.md",
      "anchor": null,
      "aliasId": "step10-runner-0001"
    },
    "portal": false,
    "area": "proposals",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/proposals/coordination-capability-envelope.md",
    "line": 39,
    "legacy": "docs/specs/runner.md",
    "previous": "[Runner spec](../runner/README.md)",
    "now": "../runner/spec.md",
    "action": "retargeted-specific",
    "reason": "specific-candidate",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../../specs/runner.md",
  "interimDestination": "../runner/README.md",
  "newDestination": "../runner/spec.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/runner/spec.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "08e31cdc6154f86851fc7985b39ab4e1695be9bd46b5320517f4bccf48bfc69a"
  },
  "referentPreservation": {
    "declaredReferent": "docs/specs/runner.md",
    "action": "retargeted-specific",
    "reason": "specific-candidate",
    "selfRestored": false,
    "portalRetargeted": false,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-246: link-246

```json
{
  "id": "link-246",
  "original": {
    "path": "docs/platform/proposals/coordination-capability-envelope.md",
    "inputLine": 40,
    "inputColumn": 1,
    "lineBeforeLinkPass": 40,
    "before": "[Agent Coordination Vision](../../architect/agent-coordination/vision.md)",
    "after": "[Agent Coordination Vision](../agent-coordination/README.md)",
    "legacyPath": "docs/architect/agent-coordination/vision.md",
    "target": {
      "path": "docs/platform/agent-coordination/README.md",
      "anchor": null,
      "aliasId": "step10-agent-coordination-4330"
    },
    "portal": false,
    "area": "proposals",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/proposals/coordination-capability-envelope.md",
    "line": 40,
    "legacy": "docs/architect/agent-coordination/vision.md",
    "previous": "[Agent Coordination Vision](../agent-coordination/README.md)",
    "now": "../agent-coordination/vision.md",
    "action": "retargeted-specific",
    "reason": "specific-candidate",
    "selfBefore": false,
    "portalBefore": true
  },
  "oldDestination": "../../architect/agent-coordination/vision.md",
  "interimDestination": "../agent-coordination/README.md",
  "newDestination": "../agent-coordination/vision.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/agent-coordination/vision.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "15424581be04de19fc1a9b5477ddd42d7822ef1a434f1a5a867ffea5d7103bf6"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/agent-coordination/vision.md",
    "action": "retargeted-specific",
    "reason": "specific-candidate",
    "selfRestored": false,
    "portalRetargeted": true,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-247: link-247

```json
{
  "id": "link-247",
  "original": {
    "path": "docs/platform/proposals/coordination-capability-envelope.md",
    "inputLine": 41,
    "inputColumn": 1,
    "lineBeforeLinkPass": 41,
    "before": "[Intent Preservation Ledger](../../architect/agent-coordination/intent-preservation-ledger.md)",
    "after": "[Intent Preservation Ledger](../agent-coordination/README.md)",
    "legacyPath": "docs/architect/agent-coordination/intent-preservation-ledger.md",
    "target": {
      "path": "docs/platform/agent-coordination/README.md",
      "anchor": null,
      "aliasId": "step10-agent-coordination-1148"
    },
    "portal": false,
    "area": "proposals",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/proposals/coordination-capability-envelope.md",
    "line": 41,
    "legacy": "docs/architect/agent-coordination/intent-preservation-ledger.md",
    "previous": "[Intent Preservation Ledger](../agent-coordination/README.md)",
    "now": "../agent-coordination/history/retired-engine/legacy/intent-preservation-ledger.md",
    "action": "retargeted-specific",
    "reason": "specific-candidate",
    "selfBefore": false,
    "portalBefore": true
  },
  "oldDestination": "../../architect/agent-coordination/intent-preservation-ledger.md",
  "interimDestination": "../agent-coordination/README.md",
  "newDestination": "../agent-coordination/history/retired-engine/legacy/intent-preservation-ledger.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/agent-coordination/history/retired-engine/legacy/intent-preservation-ledger.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "60a61d421faa9cd83d7625c3068aedb604a5edd02f78840c82cd445ba64e919e"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/agent-coordination/intent-preservation-ledger.md",
    "action": "retargeted-specific",
    "reason": "specific-candidate",
    "selfRestored": false,
    "portalRetargeted": true,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-248: link-248

```json
{
  "id": "link-248",
  "original": {
    "path": "docs/platform/proposals/coordination-capability-envelope.md",
    "inputLine": 42,
    "inputColumn": 1,
    "lineBeforeLinkPass": 42,
    "before": "[System Vision: Trong Mem Ngoai Cung](../../architect/system-vision-trong-mem-ngoai-cung.md)",
    "after": "[System Vision: Trong Mem Ngoai Cung](../system-architecture/architecture/system-vision-trong-mem-ngoai-cung.md)",
    "legacyPath": "docs/architect/system-vision-trong-mem-ngoai-cung.md",
    "target": {
      "path": "docs/platform/system-architecture/architecture/system-vision-trong-mem-ngoai-cung.md",
      "anchor": null,
      "aliasId": "step10-whole-system-1321"
    },
    "portal": false,
    "area": "proposals",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/proposals/coordination-capability-envelope.md",
    "line": 42,
    "legacy": "docs/architect/system-vision-trong-mem-ngoai-cung.md",
    "previous": "[System Vision: Trong Mem Ngoai Cung](../system-architecture/architecture/system-vision-trong-mem-ngoai-cung.md)",
    "now": "../system-architecture/architecture/system-vision-trong-mem-ngoai-cung.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../../architect/system-vision-trong-mem-ngoai-cung.md",
  "interimDestination": "../system-architecture/architecture/system-vision-trong-mem-ngoai-cung.md",
  "newDestination": "../system-architecture/architecture/system-vision-trong-mem-ngoai-cung.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/system-architecture/architecture/system-vision-trong-mem-ngoai-cung.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "50099b7a34e0f160bb9d5a8bb56527531ef747a31cca021302eae981d9e05a99"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/system-vision-trong-mem-ngoai-cung.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfRestored": false,
    "portalRetargeted": false,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-249: link-249

```json
{
  "id": "link-249",
  "original": {
    "path": "docs/platform/proposals/coordination-capability-envelope.md",
    "inputLine": 48,
    "inputColumn": 3,
    "lineBeforeLinkPass": 48,
    "before": "[Foundation baseline](../../architect/agent-coordination/architecture/coordination-foundation-baseline.md)",
    "after": "[Foundation baseline](../agent-coordination/history/retired-engine/files/architecture/coordination-foundation-baseline.md)",
    "legacyPath": "docs/architect/agent-coordination/architecture/coordination-foundation-baseline.md",
    "target": {
      "path": "docs/platform/agent-coordination/history/retired-engine/files/architecture/coordination-foundation-baseline.md",
      "anchor": null,
      "aliasId": "step10-agent-coordination-0098"
    },
    "portal": false,
    "area": "proposals",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/proposals/coordination-capability-envelope.md",
    "line": 48,
    "legacy": "docs/architect/agent-coordination/architecture/coordination-foundation-baseline.md",
    "previous": "[Foundation baseline](../agent-coordination/history/retired-engine/files/architecture/coordination-foundation-baseline.md)",
    "now": "../agent-coordination/history/retired-engine/files/architecture/coordination-foundation-baseline.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../../architect/agent-coordination/architecture/coordination-foundation-baseline.md",
  "interimDestination": "../agent-coordination/history/retired-engine/files/architecture/coordination-foundation-baseline.md",
  "newDestination": "../agent-coordination/history/retired-engine/files/architecture/coordination-foundation-baseline.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/agent-coordination/history/retired-engine/files/architecture/coordination-foundation-baseline.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "337a8434c51b1e72aa0944e01c9db3daae5da16ca2ccd1995e4decfa148a99e9"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/agent-coordination/architecture/coordination-foundation-baseline.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfRestored": false,
    "portalRetargeted": false,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-250: link-250

```json
{
  "id": "link-250",
  "original": {
    "path": "docs/platform/proposals/coordination-capability-envelope.md",
    "inputLine": 49,
    "inputColumn": 3,
    "lineBeforeLinkPass": 49,
    "before": "[FlowDefinition contract](../../architect/agent-coordination/contracts/flow-definition.md)",
    "after": "[FlowDefinition contract](../agent-coordination/history/retired-engine/files/contracts/flow-definition.md)",
    "legacyPath": "docs/architect/agent-coordination/contracts/flow-definition.md",
    "target": {
      "path": "docs/platform/agent-coordination/history/retired-engine/files/contracts/flow-definition.md",
      "anchor": null,
      "aliasId": "step10-agent-coordination-0625"
    },
    "portal": false,
    "area": "proposals",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/proposals/coordination-capability-envelope.md",
    "line": 49,
    "legacy": "docs/architect/agent-coordination/contracts/flow-definition.md",
    "previous": "[FlowDefinition contract](../agent-coordination/history/retired-engine/files/contracts/flow-definition.md)",
    "now": "../agent-coordination/history/retired-engine/files/contracts/flow-definition.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../../architect/agent-coordination/contracts/flow-definition.md",
  "interimDestination": "../agent-coordination/history/retired-engine/files/contracts/flow-definition.md",
  "newDestination": "../agent-coordination/history/retired-engine/files/contracts/flow-definition.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/agent-coordination/history/retired-engine/files/contracts/flow-definition.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "e005edcfa74d8745286a261247ee5ab09193e34c90a3ef3cc3cd51a27e94378a"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/agent-coordination/contracts/flow-definition.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfRestored": false,
    "portalRetargeted": false,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-251: link-251

```json
{
  "id": "link-251",
  "original": {
    "path": "docs/platform/proposals/coordination-capability-envelope.md",
    "inputLine": 50,
    "inputColumn": 3,
    "lineBeforeLinkPass": 50,
    "before": "[CoordinationSession contract](../../architect/agent-coordination/contracts/coordination-session.md)",
    "after": "[CoordinationSession contract](../agent-coordination/history/retired-engine/files/contracts/coordination-session.md)",
    "legacyPath": "docs/architect/agent-coordination/contracts/coordination-session.md",
    "target": {
      "path": "docs/platform/agent-coordination/history/retired-engine/files/contracts/coordination-session.md",
      "anchor": null,
      "aliasId": "step10-agent-coordination-0510"
    },
    "portal": false,
    "area": "proposals",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/proposals/coordination-capability-envelope.md",
    "line": 50,
    "legacy": "docs/architect/agent-coordination/contracts/coordination-session.md",
    "previous": "[CoordinationSession contract](../agent-coordination/history/retired-engine/files/contracts/coordination-session.md)",
    "now": "../agent-coordination/history/retired-engine/files/contracts/coordination-session.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../../architect/agent-coordination/contracts/coordination-session.md",
  "interimDestination": "../agent-coordination/history/retired-engine/files/contracts/coordination-session.md",
  "newDestination": "../agent-coordination/history/retired-engine/files/contracts/coordination-session.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/agent-coordination/history/retired-engine/files/contracts/coordination-session.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "268af8311d9e1f0dc91579d75ba43174395362e5f33346a3911524cb00229064"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/agent-coordination/contracts/coordination-session.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfRestored": false,
    "portalRetargeted": false,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-252: link-252

```json
{
  "id": "link-252",
  "original": {
    "path": "docs/platform/proposals/coordination-capability-envelope.md",
    "inputLine": 51,
    "inputColumn": 3,
    "lineBeforeLinkPass": 51,
    "before": "[Raw master-coordination prompt](../../architect/agent-coordination/playbooks/prompts/master-coordinator.md)",
    "after": "[Raw master-coordination prompt](../agent-coordination/README.md)",
    "legacyPath": "docs/architect/agent-coordination/playbooks/prompts/master-coordinator.md",
    "target": {
      "path": "docs/platform/agent-coordination/README.md",
      "anchor": null,
      "aliasId": "step10-agent-coordination-1655"
    },
    "portal": false,
    "area": "proposals",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/proposals/coordination-capability-envelope.md",
    "line": 51,
    "legacy": "docs/architect/agent-coordination/playbooks/prompts/master-coordinator.md",
    "previous": "[Raw master-coordination prompt](../agent-coordination/README.md)",
    "now": "../agent-coordination/playbooks/prompts/master-coordinator.md",
    "action": "retargeted-specific",
    "reason": "specific-candidate",
    "selfBefore": false,
    "portalBefore": true
  },
  "oldDestination": "../../architect/agent-coordination/playbooks/prompts/master-coordinator.md",
  "interimDestination": "../agent-coordination/README.md",
  "newDestination": "../agent-coordination/playbooks/prompts/master-coordinator.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/agent-coordination/playbooks/prompts/master-coordinator.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "3cccc8cff795fe5b589c19f8aed2e9bc23594ead0aa39009dba1be0eb52b37e6"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/agent-coordination/playbooks/prompts/master-coordinator.md",
    "action": "retargeted-specific",
    "reason": "specific-candidate",
    "selfRestored": false,
    "portalRetargeted": true,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-253: link-253

```json
{
  "id": "link-253",
  "original": {
    "path": "docs/platform/proposals/coordination-capability-envelope.md",
    "inputLine": 52,
    "inputColumn": 3,
    "lineBeforeLinkPass": 52,
    "before": "[Architecture Advisory proposal](../../architect/proposals/architecture-advisory-panel.md)",
    "after": "[Architecture Advisory proposal](architecture-advisory-panel.md)",
    "legacyPath": "docs/architect/proposals/architecture-advisory-panel.md",
    "target": {
      "path": "docs/platform/proposals/architecture-advisory-panel.md",
      "anchor": null,
      "aliasId": "step10-proposals-redesigns-0010"
    },
    "portal": false,
    "area": "proposals",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/proposals/coordination-capability-envelope.md",
    "line": 52,
    "legacy": "docs/architect/proposals/architecture-advisory-panel.md",
    "previous": "[Architecture Advisory proposal](architecture-advisory-panel.md)",
    "now": "architecture-advisory-panel.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../../architect/proposals/architecture-advisory-panel.md",
  "interimDestination": "architecture-advisory-panel.md",
  "newDestination": "architecture-advisory-panel.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/proposals/architecture-advisory-panel.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "6d9ccca7be37d1174b1d122598a2003800fc816b9d6c45d8c2d08c3271c424c2"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/proposals/architecture-advisory-panel.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfRestored": false,
    "portalRetargeted": false,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-254: link-254

```json
{
  "id": "link-254",
  "original": {
    "path": "docs/platform/proposals/coordination-capability-envelope.md",
    "inputLine": 53,
    "inputColumn": 3,
    "lineBeforeLinkPass": 53,
    "before": "[Plan Loop proposal](../../architect/proposals/group-thinking-plan-loop.md)",
    "after": "[Plan Loop proposal](../agent-coordination/history/proposals-redesigns/group-thinking-plan-loop.md)",
    "legacyPath": "docs/architect/proposals/group-thinking-plan-loop.md",
    "target": {
      "path": "docs/platform/agent-coordination/history/proposals-redesigns/group-thinking-plan-loop.md",
      "anchor": null,
      "aliasId": "step10-proposals-redesigns-0468"
    },
    "portal": false,
    "area": "proposals",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/proposals/coordination-capability-envelope.md",
    "line": 53,
    "legacy": "docs/architect/proposals/group-thinking-plan-loop.md",
    "previous": "[Plan Loop proposal](../agent-coordination/history/proposals-redesigns/group-thinking-plan-loop.md)",
    "now": "../agent-coordination/history/proposals-redesigns/group-thinking-plan-loop.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../../architect/proposals/group-thinking-plan-loop.md",
  "interimDestination": "../agent-coordination/history/proposals-redesigns/group-thinking-plan-loop.md",
  "newDestination": "../agent-coordination/history/proposals-redesigns/group-thinking-plan-loop.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/agent-coordination/history/proposals-redesigns/group-thinking-plan-loop.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "c470ced668aab375c2b846672efce763561beb71f13867607b4de87b9b740ccc"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/proposals/group-thinking-plan-loop.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfRestored": false,
    "portalRetargeted": false,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-255: link-255

```json
{
  "id": "link-255",
  "original": {
    "path": "docs/platform/proposals/coordination-capability-envelope.md",
    "inputLine": 278,
    "inputColumn": 1,
    "lineBeforeLinkPass": 278,
    "before": "[Routing Handoff Contract](../../routing-handoff-contract.md)",
    "after": "[Routing Handoff Contract](../runner/contracts/routing-handoff.md)",
    "legacyPath": "docs/routing-handoff-contract.md",
    "target": {
      "path": "docs/platform/runner/contracts/routing-handoff.md",
      "anchor": null,
      "aliasId": "root-authorities-draft-0066"
    },
    "portal": false,
    "area": "proposals",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/proposals/coordination-capability-envelope.md",
    "line": 278,
    "legacy": "docs/routing-handoff-contract.md",
    "previous": "[Routing Handoff Contract](../runner/contracts/routing-handoff.md)",
    "now": "../runner/contracts/routing-handoff.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../../routing-handoff-contract.md",
  "interimDestination": "../runner/contracts/routing-handoff.md",
  "newDestination": "../runner/contracts/routing-handoff.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/runner/contracts/routing-handoff.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "97b9a2cb6f1bc3acad1ec1a882b32660fda06538e008d66d57a2029cb0ae325d"
  },
  "referentPreservation": {
    "declaredReferent": "docs/routing-handoff-contract.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfRestored": false,
    "portalRetargeted": false,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-256: link-256

```json
{
  "id": "link-256",
  "original": {
    "path": "docs/platform/proposals/coordination-capability-envelope.md",
    "inputLine": 415,
    "inputColumn": 5,
    "lineBeforeLinkPass": 415,
    "before": "[Minimal Probe Contract](../../architect/proposals/coordination-envelope-probe-contract.md)",
    "after": "[Minimal Probe Contract](coordination-envelope-probe-contract.md)",
    "legacyPath": "docs/architect/proposals/coordination-envelope-probe-contract.md",
    "target": {
      "path": "docs/platform/proposals/coordination-envelope-probe-contract.md",
      "anchor": null,
      "aliasId": "step10-proposals-redesigns-0373"
    },
    "portal": false,
    "area": "proposals",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/proposals/coordination-capability-envelope.md",
    "line": 415,
    "legacy": "docs/architect/proposals/coordination-envelope-probe-contract.md",
    "previous": "[Minimal Probe Contract](coordination-envelope-probe-contract.md)",
    "now": "coordination-envelope-probe-contract.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../../architect/proposals/coordination-envelope-probe-contract.md",
  "interimDestination": "coordination-envelope-probe-contract.md",
  "newDestination": "coordination-envelope-probe-contract.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/proposals/coordination-envelope-probe-contract.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "d294fc201b1ff9b73b18899b366e8e0366faaf3e2e910f3eeca7ca603569b24b"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/proposals/coordination-envelope-probe-contract.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfRestored": false,
    "portalRetargeted": false,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-257: link-257

```json
{
  "id": "link-257",
  "original": {
    "path": "docs/platform/proposals/coordination-dispatch-contract.md",
    "inputLine": 24,
    "inputColumn": 22,
    "lineBeforeLinkPass": 24,
    "before": "[original source](../../architect/proposals/coordination-dispatch-contract.md)",
    "after": "[original source](coordination-dispatch-contract.md)",
    "legacyPath": "docs/architect/proposals/coordination-dispatch-contract.md",
    "target": {
      "path": "docs/platform/proposals/coordination-dispatch-contract.md",
      "anchor": null,
      "aliasId": "step10-proposals-redesigns-0323"
    },
    "portal": false,
    "area": "proposals",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/proposals/coordination-dispatch-contract.md",
    "line": 24,
    "legacy": "docs/architect/proposals/coordination-dispatch-contract.md",
    "previous": "[original source](coordination-dispatch-contract.md)",
    "now": "../../architect/proposals/coordination-dispatch-contract.md",
    "action": "restored-legacy",
    "reason": "provenance/legacy-owner",
    "selfBefore": true,
    "portalBefore": false
  },
  "oldDestination": "../../architect/proposals/coordination-dispatch-contract.md",
  "interimDestination": "coordination-dispatch-contract.md",
  "newDestination": "../../architect/proposals/coordination-dispatch-contract.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/architect/proposals/coordination-dispatch-contract.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "e31ab35e8bdd5aafae298955519bfaa205dda2ea53f1e604e1e22e32276939d0"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/proposals/coordination-dispatch-contract.md",
    "action": "restored-legacy",
    "reason": "provenance/legacy-owner",
    "selfRestored": true,
    "portalRetargeted": false,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-258: link-258

```json
{
  "id": "link-258",
  "original": {
    "path": "docs/platform/proposals/coordination-dispatch-contract.md",
    "inputLine": 34,
    "inputColumn": 10,
    "lineBeforeLinkPass": 34,
    "before": "[Dispatch Control Plane](../../architect/agent-coordination/architecture/dispatch-control-plane.md)",
    "after": "[Dispatch Control Plane](../agent-coordination/README.md)",
    "legacyPath": "docs/architect/agent-coordination/architecture/dispatch-control-plane.md",
    "target": {
      "path": "docs/platform/agent-coordination/README.md",
      "anchor": null,
      "aliasId": "step10-agent-coordination-0122"
    },
    "portal": false,
    "area": "proposals",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/proposals/coordination-dispatch-contract.md",
    "line": 34,
    "legacy": "docs/architect/agent-coordination/architecture/dispatch-control-plane.md",
    "previous": "[Dispatch Control Plane](../agent-coordination/README.md)",
    "now": "../agent-coordination/architecture/dispatch-control-plane.md",
    "action": "retargeted-specific",
    "reason": "specific-candidate",
    "selfBefore": false,
    "portalBefore": true
  },
  "oldDestination": "../../architect/agent-coordination/architecture/dispatch-control-plane.md",
  "interimDestination": "../agent-coordination/README.md",
  "newDestination": "../agent-coordination/architecture/dispatch-control-plane.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/agent-coordination/architecture/dispatch-control-plane.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "29a94c3bac47c039b65b9ab0879e5867de4035fe6962b27d33cf4957e9d4574d"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/agent-coordination/architecture/dispatch-control-plane.md",
    "action": "retargeted-specific",
    "reason": "specific-candidate",
    "selfRestored": false,
    "portalRetargeted": true,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-259: link-259

```json
{
  "id": "link-259",
  "original": {
    "path": "docs/platform/proposals/coordination-dispatch-contract.md",
    "inputLine": 35,
    "inputColumn": 1,
    "lineBeforeLinkPass": 35,
    "before": "[Coordination capability envelope](../../architect/proposals/coordination-capability-envelope.md)",
    "after": "[Coordination capability envelope](coordination-capability-envelope.md)",
    "legacyPath": "docs/architect/proposals/coordination-capability-envelope.md",
    "target": {
      "path": "docs/platform/proposals/coordination-capability-envelope.md",
      "anchor": null,
      "aliasId": "step10-proposals-redesigns-0230"
    },
    "portal": false,
    "area": "proposals",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/proposals/coordination-dispatch-contract.md",
    "line": 35,
    "legacy": "docs/architect/proposals/coordination-capability-envelope.md",
    "previous": "[Coordination capability envelope](coordination-capability-envelope.md)",
    "now": "coordination-capability-envelope.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../../architect/proposals/coordination-capability-envelope.md",
  "interimDestination": "coordination-capability-envelope.md",
  "newDestination": "coordination-capability-envelope.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/proposals/coordination-capability-envelope.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "cb550ddf91b56b91cabac628285a1d8c224a3a93ac91c08dbbbe089bbaf7df13"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/proposals/coordination-capability-envelope.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfRestored": false,
    "portalRetargeted": false,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-260: link-260

```json
{
  "id": "link-260",
  "original": {
    "path": "docs/platform/proposals/coordination-dispatch-contract.md",
    "inputLine": 36,
    "inputColumn": 1,
    "lineBeforeLinkPass": 36,
    "before": "[Worker/provider/control boundary](../../architect/proposals/coordination-worker-provider-boundary.md)",
    "after": "[Worker/provider/control boundary](coordination-worker-provider-boundary.md)",
    "legacyPath": "docs/architect/proposals/coordination-worker-provider-boundary.md",
    "target": {
      "path": "docs/platform/proposals/coordination-worker-provider-boundary.md",
      "anchor": null,
      "aliasId": "step10-proposals-redesigns-0430"
    },
    "portal": false,
    "area": "proposals",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/proposals/coordination-dispatch-contract.md",
    "line": 36,
    "legacy": "docs/architect/proposals/coordination-worker-provider-boundary.md",
    "previous": "[Worker/provider/control boundary](coordination-worker-provider-boundary.md)",
    "now": "coordination-worker-provider-boundary.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../../architect/proposals/coordination-worker-provider-boundary.md",
  "interimDestination": "coordination-worker-provider-boundary.md",
  "newDestination": "coordination-worker-provider-boundary.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/proposals/coordination-worker-provider-boundary.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "0f7a5b0db1cf1cb22c22fd0d270306af2e34010c48e09a651d1764c1b7e226f9"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/proposals/coordination-worker-provider-boundary.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfRestored": false,
    "portalRetargeted": false,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-261: link-261

```json
{
  "id": "link-261",
  "original": {
    "path": "docs/platform/proposals/coordination-dispatch-contract.md",
    "inputLine": 37,
    "inputColumn": 1,
    "lineBeforeLinkPass": 37,
    "before": "[Progress](../../architect/proposals/coordination-envelope-progress.md)",
    "after": "[Progress](../agent-coordination/history/proposals-redesigns/coordination-envelope-progress.md)",
    "legacyPath": "docs/architect/proposals/coordination-envelope-progress.md",
    "target": {
      "path": "docs/platform/agent-coordination/history/proposals-redesigns/coordination-envelope-progress.md",
      "anchor": null,
      "aliasId": "step10-proposals-redesigns-0402"
    },
    "portal": false,
    "area": "proposals",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/proposals/coordination-dispatch-contract.md",
    "line": 37,
    "legacy": "docs/architect/proposals/coordination-envelope-progress.md",
    "previous": "[Progress](../agent-coordination/history/proposals-redesigns/coordination-envelope-progress.md)",
    "now": "../agent-coordination/history/proposals-redesigns/coordination-envelope-progress.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../../architect/proposals/coordination-envelope-progress.md",
  "interimDestination": "../agent-coordination/history/proposals-redesigns/coordination-envelope-progress.md",
  "newDestination": "../agent-coordination/history/proposals-redesigns/coordination-envelope-progress.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/agent-coordination/history/proposals-redesigns/coordination-envelope-progress.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "875a2f7fe2989d987c980470959b1e64219b5a455f9db401db98928241a1f865"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/proposals/coordination-envelope-progress.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfRestored": false,
    "portalRetargeted": false,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-262: link-262

```json
{
  "id": "link-262",
  "original": {
    "path": "docs/platform/proposals/coordination-envelope-probe-contract.md",
    "inputLine": 24,
    "inputColumn": 22,
    "lineBeforeLinkPass": 24,
    "before": "[original source](../../architect/proposals/coordination-envelope-probe-contract.md)",
    "after": "[original source](coordination-envelope-probe-contract.md)",
    "legacyPath": "docs/architect/proposals/coordination-envelope-probe-contract.md",
    "target": {
      "path": "docs/platform/proposals/coordination-envelope-probe-contract.md",
      "anchor": null,
      "aliasId": "step10-proposals-redesigns-0373"
    },
    "portal": false,
    "area": "proposals",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/proposals/coordination-envelope-probe-contract.md",
    "line": 24,
    "legacy": "docs/architect/proposals/coordination-envelope-probe-contract.md",
    "previous": "[original source](coordination-envelope-probe-contract.md)",
    "now": "../../architect/proposals/coordination-envelope-probe-contract.md",
    "action": "restored-legacy",
    "reason": "provenance/legacy-owner",
    "selfBefore": true,
    "portalBefore": false
  },
  "oldDestination": "../../architect/proposals/coordination-envelope-probe-contract.md",
  "interimDestination": "coordination-envelope-probe-contract.md",
  "newDestination": "../../architect/proposals/coordination-envelope-probe-contract.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/architect/proposals/coordination-envelope-probe-contract.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "676bc6b9b123411fd38aa75f022213035332048547ebca3bd805a82f3b8b5336"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/proposals/coordination-envelope-probe-contract.md",
    "action": "restored-legacy",
    "reason": "provenance/legacy-owner",
    "selfRestored": true,
    "portalRetargeted": false,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-263: link-263

```json
{
  "id": "link-263",
  "original": {
    "path": "docs/platform/proposals/coordination-envelope-probe-contract.md",
    "inputLine": 44,
    "inputColumn": 5,
    "lineBeforeLinkPass": 44,
    "before": "[chat progress and next work](../../architect/proposals/coordination-envelope-progress.md)",
    "after": "[chat progress and next work](../agent-coordination/history/proposals-redesigns/coordination-envelope-progress.md)",
    "legacyPath": "docs/architect/proposals/coordination-envelope-progress.md",
    "target": {
      "path": "docs/platform/agent-coordination/history/proposals-redesigns/coordination-envelope-progress.md",
      "anchor": null,
      "aliasId": "step10-proposals-redesigns-0402"
    },
    "portal": false,
    "area": "proposals",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/proposals/coordination-envelope-probe-contract.md",
    "line": 44,
    "legacy": "docs/architect/proposals/coordination-envelope-progress.md",
    "previous": "[chat progress and next work](../agent-coordination/history/proposals-redesigns/coordination-envelope-progress.md)",
    "now": "../agent-coordination/history/proposals-redesigns/coordination-envelope-progress.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../../architect/proposals/coordination-envelope-progress.md",
  "interimDestination": "../agent-coordination/history/proposals-redesigns/coordination-envelope-progress.md",
  "newDestination": "../agent-coordination/history/proposals-redesigns/coordination-envelope-progress.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/agent-coordination/history/proposals-redesigns/coordination-envelope-progress.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "875a2f7fe2989d987c980470959b1e64219b5a455f9db401db98928241a1f865"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/proposals/coordination-envelope-progress.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfRestored": false,
    "portalRetargeted": false,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-264: link-264

```json
{
  "id": "link-264",
  "original": {
    "path": "docs/platform/proposals/coordination-envelope-probe-contract.md",
    "inputLine": 146,
    "inputColumn": 12,
    "lineBeforeLinkPass": 146,
    "before": "[Worker/provider/control boundary sketch](../../architect/proposals/coordination-worker-provider-boundary.md)",
    "after": "[Worker/provider/control boundary sketch](coordination-worker-provider-boundary.md)",
    "legacyPath": "docs/architect/proposals/coordination-worker-provider-boundary.md",
    "target": {
      "path": "docs/platform/proposals/coordination-worker-provider-boundary.md",
      "anchor": null,
      "aliasId": "step10-proposals-redesigns-0430"
    },
    "portal": false,
    "area": "proposals",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/proposals/coordination-envelope-probe-contract.md",
    "line": 146,
    "legacy": "docs/architect/proposals/coordination-worker-provider-boundary.md",
    "previous": "[Worker/provider/control boundary sketch](coordination-worker-provider-boundary.md)",
    "now": "coordination-worker-provider-boundary.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../../architect/proposals/coordination-worker-provider-boundary.md",
  "interimDestination": "coordination-worker-provider-boundary.md",
  "newDestination": "coordination-worker-provider-boundary.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/proposals/coordination-worker-provider-boundary.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "0f7a5b0db1cf1cb22c22fd0d270306af2e34010c48e09a651d1764c1b7e226f9"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/proposals/coordination-worker-provider-boundary.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfRestored": false,
    "portalRetargeted": false,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-265: link-265

```json
{
  "id": "link-265",
  "original": {
    "path": "docs/platform/proposals/coordination-worker-provider-boundary.md",
    "inputLine": 24,
    "inputColumn": 22,
    "lineBeforeLinkPass": 24,
    "before": "[original source](../../architect/proposals/coordination-worker-provider-boundary.md)",
    "after": "[original source](coordination-worker-provider-boundary.md)",
    "legacyPath": "docs/architect/proposals/coordination-worker-provider-boundary.md",
    "target": {
      "path": "docs/platform/proposals/coordination-worker-provider-boundary.md",
      "anchor": null,
      "aliasId": "step10-proposals-redesigns-0430"
    },
    "portal": false,
    "area": "proposals",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/proposals/coordination-worker-provider-boundary.md",
    "line": 24,
    "legacy": "docs/architect/proposals/coordination-worker-provider-boundary.md",
    "previous": "[original source](coordination-worker-provider-boundary.md)",
    "now": "../../architect/proposals/coordination-worker-provider-boundary.md",
    "action": "restored-legacy",
    "reason": "provenance/legacy-owner",
    "selfBefore": true,
    "portalBefore": false
  },
  "oldDestination": "../../architect/proposals/coordination-worker-provider-boundary.md",
  "interimDestination": "coordination-worker-provider-boundary.md",
  "newDestination": "../../architect/proposals/coordination-worker-provider-boundary.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/architect/proposals/coordination-worker-provider-boundary.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "73266b42990980ecedc53ff3b950f65ab470264de03d66cafcf57ddb1336967d"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/proposals/coordination-worker-provider-boundary.md",
    "action": "restored-legacy",
    "reason": "provenance/legacy-owner",
    "selfRestored": true,
    "portalRetargeted": false,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-266: link-266

```json
{
  "id": "link-266",
  "original": {
    "path": "docs/platform/proposals/coordination-worker-provider-boundary.md",
    "inputLine": 34,
    "inputColumn": 10,
    "lineBeforeLinkPass": 34,
    "before": "[Conceptual architecture](../../architect/proposals/coordination-capability-envelope.md)",
    "after": "[Conceptual architecture](coordination-capability-envelope.md)",
    "legacyPath": "docs/architect/proposals/coordination-capability-envelope.md",
    "target": {
      "path": "docs/platform/proposals/coordination-capability-envelope.md",
      "anchor": null,
      "aliasId": "step10-proposals-redesigns-0230"
    },
    "portal": false,
    "area": "proposals",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/proposals/coordination-worker-provider-boundary.md",
    "line": 34,
    "legacy": "docs/architect/proposals/coordination-capability-envelope.md",
    "previous": "[Conceptual architecture](coordination-capability-envelope.md)",
    "now": "coordination-capability-envelope.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../../architect/proposals/coordination-capability-envelope.md",
  "interimDestination": "coordination-capability-envelope.md",
  "newDestination": "coordination-capability-envelope.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/proposals/coordination-capability-envelope.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "cb550ddf91b56b91cabac628285a1d8c224a3a93ac91c08dbbbe089bbaf7df13"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/proposals/coordination-capability-envelope.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfRestored": false,
    "portalRetargeted": false,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-267: link-267

```json
{
  "id": "link-267",
  "original": {
    "path": "docs/platform/proposals/coordination-worker-provider-boundary.md",
    "inputLine": 35,
    "inputColumn": 1,
    "lineBeforeLinkPass": 35,
    "before": "[Probe contract](../../architect/proposals/coordination-envelope-probe-contract.md)",
    "after": "[Probe contract](coordination-envelope-probe-contract.md)",
    "legacyPath": "docs/architect/proposals/coordination-envelope-probe-contract.md",
    "target": {
      "path": "docs/platform/proposals/coordination-envelope-probe-contract.md",
      "anchor": null,
      "aliasId": "step10-proposals-redesigns-0373"
    },
    "portal": false,
    "area": "proposals",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/proposals/coordination-worker-provider-boundary.md",
    "line": 35,
    "legacy": "docs/architect/proposals/coordination-envelope-probe-contract.md",
    "previous": "[Probe contract](coordination-envelope-probe-contract.md)",
    "now": "coordination-envelope-probe-contract.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../../architect/proposals/coordination-envelope-probe-contract.md",
  "interimDestination": "coordination-envelope-probe-contract.md",
  "newDestination": "coordination-envelope-probe-contract.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/proposals/coordination-envelope-probe-contract.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "d294fc201b1ff9b73b18899b366e8e0366faaf3e2e910f3eeca7ca603569b24b"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/proposals/coordination-envelope-probe-contract.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfRestored": false,
    "portalRetargeted": false,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-268: link-268

```json
{
  "id": "link-268",
  "original": {
    "path": "docs/platform/proposals/coordination-worker-provider-boundary.md",
    "inputLine": 36,
    "inputColumn": 1,
    "lineBeforeLinkPass": 36,
    "before": "[Progress](../../architect/proposals/coordination-envelope-progress.md)",
    "after": "[Progress](../agent-coordination/history/proposals-redesigns/coordination-envelope-progress.md)",
    "legacyPath": "docs/architect/proposals/coordination-envelope-progress.md",
    "target": {
      "path": "docs/platform/agent-coordination/history/proposals-redesigns/coordination-envelope-progress.md",
      "anchor": null,
      "aliasId": "step10-proposals-redesigns-0402"
    },
    "portal": false,
    "area": "proposals",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/proposals/coordination-worker-provider-boundary.md",
    "line": 36,
    "legacy": "docs/architect/proposals/coordination-envelope-progress.md",
    "previous": "[Progress](../agent-coordination/history/proposals-redesigns/coordination-envelope-progress.md)",
    "now": "../agent-coordination/history/proposals-redesigns/coordination-envelope-progress.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../../architect/proposals/coordination-envelope-progress.md",
  "interimDestination": "../agent-coordination/history/proposals-redesigns/coordination-envelope-progress.md",
  "newDestination": "../agent-coordination/history/proposals-redesigns/coordination-envelope-progress.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/agent-coordination/history/proposals-redesigns/coordination-envelope-progress.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "875a2f7fe2989d987c980470959b1e64219b5a455f9db401db98928241a1f865"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/proposals/coordination-envelope-progress.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfRestored": false,
    "portalRetargeted": false,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-269: link-269

```json
{
  "id": "link-269",
  "original": {
    "path": "docs/platform/proposals/coordination-worker-provider-boundary.md",
    "inputLine": 37,
    "inputColumn": 1,
    "lineBeforeLinkPass": 37,
    "before": "[Capability audit](../../architect/agent-coordination/verification/coordination-envelope/capability-fit-2026-09-06.md)",
    "after": "[Capability audit](../agent-coordination/verification/coordination-envelope/capability-fit-2026-09-06.md)",
    "legacyPath": "docs/architect/agent-coordination/verification/coordination-envelope/capability-fit-2026-09-06.md",
    "target": {
      "path": "docs/platform/agent-coordination/verification/coordination-envelope/capability-fit-2026-09-06.md",
      "anchor": null,
      "aliasId": "step10-agent-coordination-3861"
    },
    "portal": false,
    "area": "proposals",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/proposals/coordination-worker-provider-boundary.md",
    "line": 37,
    "legacy": "docs/architect/agent-coordination/verification/coordination-envelope/capability-fit-2026-09-06.md",
    "previous": "[Capability audit](../agent-coordination/verification/coordination-envelope/capability-fit-2026-09-06.md)",
    "now": "../agent-coordination/verification/coordination-envelope/capability-fit-2026-09-06.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../../architect/agent-coordination/verification/coordination-envelope/capability-fit-2026-09-06.md",
  "interimDestination": "../agent-coordination/verification/coordination-envelope/capability-fit-2026-09-06.md",
  "newDestination": "../agent-coordination/verification/coordination-envelope/capability-fit-2026-09-06.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/agent-coordination/verification/coordination-envelope/capability-fit-2026-09-06.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "464cbe24284b33c0ba1102e9be188afd44b696115322a9ce6a4301aefb681060"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/agent-coordination/verification/coordination-envelope/capability-fit-2026-09-06.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfRestored": false,
    "portalRetargeted": false,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-270: link-270

```json
{
  "id": "link-270",
  "original": {
    "path": "docs/platform/proposals/coordination-worker-provider-boundary.md",
    "inputLine": 38,
    "inputColumn": 1,
    "lineBeforeLinkPass": 38,
    "before": "[Dispatch control plane](../../architect/agent-coordination/architecture/dispatch-control-plane.md)",
    "after": "[Dispatch control plane](../agent-coordination/README.md)",
    "legacyPath": "docs/architect/agent-coordination/architecture/dispatch-control-plane.md",
    "target": {
      "path": "docs/platform/agent-coordination/README.md",
      "anchor": null,
      "aliasId": "step10-agent-coordination-0122"
    },
    "portal": false,
    "area": "proposals",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/proposals/coordination-worker-provider-boundary.md",
    "line": 38,
    "legacy": "docs/architect/agent-coordination/architecture/dispatch-control-plane.md",
    "previous": "[Dispatch control plane](../agent-coordination/README.md)",
    "now": "../agent-coordination/architecture/dispatch-control-plane.md",
    "action": "retargeted-specific",
    "reason": "specific-candidate",
    "selfBefore": false,
    "portalBefore": true
  },
  "oldDestination": "../../architect/agent-coordination/architecture/dispatch-control-plane.md",
  "interimDestination": "../agent-coordination/README.md",
  "newDestination": "../agent-coordination/architecture/dispatch-control-plane.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/agent-coordination/architecture/dispatch-control-plane.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "29a94c3bac47c039b65b9ab0879e5867de4035fe6962b27d33cf4957e9d4574d"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/agent-coordination/architecture/dispatch-control-plane.md",
    "action": "retargeted-specific",
    "reason": "specific-candidate",
    "selfRestored": false,
    "portalRetargeted": true,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-271: link-271

```json
{
  "id": "link-271",
  "original": {
    "path": "docs/platform/proposals/coordination-worker-provider-boundary.md",
    "inputLine": 76,
    "inputColumn": 28,
    "lineBeforeLinkPass": 76,
    "before": "[raw result](../../architect/agent-coordination/verification/coordination-envelope/proofs/2026-09-06-boundary/environment-result.json)",
    "after": "[raw result](../agent-coordination/verification/coordination-envelope/proofs/2026-09-06-boundary/environment-result.json)",
    "legacyPath": "docs/architect/agent-coordination/verification/coordination-envelope/proofs/2026-09-06-boundary/environment-result.json",
    "target": {
      "path": "docs/platform/agent-coordination/verification/coordination-envelope/proofs/2026-09-06-boundary/environment-result.json",
      "anchor": null,
      "aliasId": "step10-agent-coordination-3866"
    },
    "portal": false,
    "area": "proposals",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/proposals/coordination-worker-provider-boundary.md",
    "line": 76,
    "legacy": "docs/architect/agent-coordination/verification/coordination-envelope/proofs/2026-09-06-boundary/environment-result.json",
    "previous": "[raw result](../agent-coordination/verification/coordination-envelope/proofs/2026-09-06-boundary/environment-result.json)",
    "now": "../agent-coordination/verification/coordination-envelope/proofs/2026-09-06-boundary/environment-result.json",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../../architect/agent-coordination/verification/coordination-envelope/proofs/2026-09-06-boundary/environment-result.json",
  "interimDestination": "../agent-coordination/verification/coordination-envelope/proofs/2026-09-06-boundary/environment-result.json",
  "newDestination": "../agent-coordination/verification/coordination-envelope/proofs/2026-09-06-boundary/environment-result.json",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/agent-coordination/verification/coordination-envelope/proofs/2026-09-06-boundary/environment-result.json",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "9b8d3478c64d1b94770dfaf360b72ab29ac4945ae0d5a18c1de4779da6ea16b9"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/agent-coordination/verification/coordination-envelope/proofs/2026-09-06-boundary/environment-result.json",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfRestored": false,
    "portalRetargeted": false,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-272: link-272

```json
{
  "id": "link-272",
  "original": {
    "path": "docs/platform/proposals/coordination-worker-provider-boundary.md",
    "inputLine": 77,
    "inputColumn": 5,
    "lineBeforeLinkPass": 77,
    "before": "[reproduction script](../../architect/agent-coordination/verification/coordination-envelope/proofs/2026-09-06-boundary/environment.mjs)",
    "after": "[reproduction script](../agent-coordination/verification/coordination-envelope/proofs/2026-09-06-boundary/environment.mjs)",
    "legacyPath": "docs/architect/agent-coordination/verification/coordination-envelope/proofs/2026-09-06-boundary/environment.mjs",
    "target": {
      "path": "docs/platform/agent-coordination/verification/coordination-envelope/proofs/2026-09-06-boundary/environment.mjs",
      "anchor": null,
      "aliasId": "step10-agent-coordination-3867"
    },
    "portal": false,
    "area": "proposals",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/proposals/coordination-worker-provider-boundary.md",
    "line": 77,
    "legacy": "docs/architect/agent-coordination/verification/coordination-envelope/proofs/2026-09-06-boundary/environment.mjs",
    "previous": "[reproduction script](../agent-coordination/verification/coordination-envelope/proofs/2026-09-06-boundary/environment.mjs)",
    "now": "../agent-coordination/verification/coordination-envelope/proofs/2026-09-06-boundary/environment.mjs",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../../architect/agent-coordination/verification/coordination-envelope/proofs/2026-09-06-boundary/environment.mjs",
  "interimDestination": "../agent-coordination/verification/coordination-envelope/proofs/2026-09-06-boundary/environment.mjs",
  "newDestination": "../agent-coordination/verification/coordination-envelope/proofs/2026-09-06-boundary/environment.mjs",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/agent-coordination/verification/coordination-envelope/proofs/2026-09-06-boundary/environment.mjs",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "22e7c38d4e6c0b60c4855b1ae81f072649ee74c1ba3c9cc4c7ee51eb5d2598d1"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/agent-coordination/verification/coordination-envelope/proofs/2026-09-06-boundary/environment.mjs",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfRestored": false,
    "portalRetargeted": false,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-273: link-273

```json
{
  "id": "link-273",
  "original": {
    "path": "docs/platform/proposals/dispatch-control-plane-redesign.md",
    "inputLine": 24,
    "inputColumn": 22,
    "lineBeforeLinkPass": 24,
    "before": "[original source](../../architect/dispatch-control-plane-redesign.md)",
    "after": "[original source](dispatch-control-plane-redesign.md)",
    "legacyPath": "docs/architect/dispatch-control-plane-redesign.md",
    "target": {
      "path": "docs/platform/proposals/dispatch-control-plane-redesign.md",
      "anchor": null,
      "aliasId": "step10-whole-system-0431"
    },
    "portal": false,
    "area": "proposals",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/proposals/dispatch-control-plane-redesign.md",
    "line": 24,
    "legacy": "docs/architect/dispatch-control-plane-redesign.md",
    "previous": "[original source](dispatch-control-plane-redesign.md)",
    "now": "../../architect/dispatch-control-plane-redesign.md",
    "action": "restored-legacy",
    "reason": "provenance/legacy-owner",
    "selfBefore": true,
    "portalBefore": false
  },
  "oldDestination": "../../architect/dispatch-control-plane-redesign.md",
  "interimDestination": "dispatch-control-plane-redesign.md",
  "newDestination": "../../architect/dispatch-control-plane-redesign.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/architect/dispatch-control-plane-redesign.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "ee67263b92b3c9fed2a88995f5eab3bc7768e237de7022d62e1fe7de7c8ce42a"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/dispatch-control-plane-redesign.md",
    "action": "restored-legacy",
    "reason": "provenance/legacy-owner",
    "selfRestored": true,
    "portalRetargeted": false,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-274: link-274

```json
{
  "id": "link-274",
  "original": {
    "path": "docs/platform/proposals/doing-coordination-redesign.md",
    "inputLine": 24,
    "inputColumn": 22,
    "lineBeforeLinkPass": 24,
    "before": "[original source](../../architect/doing-coordination-redesign.md)",
    "after": "[original source](doing-coordination-redesign.md)",
    "legacyPath": "docs/architect/doing-coordination-redesign.md",
    "target": {
      "path": "docs/platform/proposals/doing-coordination-redesign.md",
      "anchor": null,
      "aliasId": "step10-whole-system-0784"
    },
    "portal": false,
    "area": "proposals",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/proposals/doing-coordination-redesign.md",
    "line": 24,
    "legacy": "docs/architect/doing-coordination-redesign.md",
    "previous": "[original source](doing-coordination-redesign.md)",
    "now": "../../architect/doing-coordination-redesign.md",
    "action": "restored-legacy",
    "reason": "provenance/legacy-owner",
    "selfBefore": true,
    "portalBefore": false
  },
  "oldDestination": "../../architect/doing-coordination-redesign.md",
  "interimDestination": "doing-coordination-redesign.md",
  "newDestination": "../../architect/doing-coordination-redesign.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/architect/doing-coordination-redesign.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "ffc69e6749b10612e6f98bbb165f6ba0b4f150cc104080e59e90edbb3fdb8798"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/doing-coordination-redesign.md",
    "action": "restored-legacy",
    "reason": "provenance/legacy-owner",
    "selfRestored": true,
    "portalRetargeted": false,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-275: link-275

```json
{
  "id": "link-275",
  "original": {
    "path": "docs/platform/proposals/knowledge-registry-redesign.md",
    "inputLine": 24,
    "inputColumn": 22,
    "lineBeforeLinkPass": 24,
    "before": "[original source](../../architect/knowledge-registry-redesign.md)",
    "after": "[original source](knowledge-registry-redesign.md)",
    "legacyPath": "docs/architect/knowledge-registry-redesign.md",
    "target": {
      "path": "docs/platform/proposals/knowledge-registry-redesign.md",
      "anchor": null,
      "aliasId": "step10-whole-system-1085"
    },
    "portal": false,
    "area": "proposals",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/proposals/knowledge-registry-redesign.md",
    "line": 24,
    "legacy": "docs/architect/knowledge-registry-redesign.md",
    "previous": "[original source](knowledge-registry-redesign.md)",
    "now": "../../architect/knowledge-registry-redesign.md",
    "action": "restored-legacy",
    "reason": "provenance/legacy-owner",
    "selfBefore": true,
    "portalBefore": false
  },
  "oldDestination": "../../architect/knowledge-registry-redesign.md",
  "interimDestination": "knowledge-registry-redesign.md",
  "newDestination": "../../architect/knowledge-registry-redesign.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/architect/knowledge-registry-redesign.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "e589e9af6fc3ca57d5fa39127a0bf9e6597c8b8af6e2c183595982ed71a87827"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/knowledge-registry-redesign.md",
    "action": "restored-legacy",
    "reason": "provenance/legacy-owner",
    "selfRestored": true,
    "portalRetargeted": false,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-276: link-276

```json
{
  "id": "link-276",
  "original": {
    "path": "docs/platform/proposals/step-09-group-thinking-substrate.md",
    "inputLine": 24,
    "inputColumn": 22,
    "lineBeforeLinkPass": 24,
    "before": "[original source](../../architect/proposals/step-09-group-thinking-substrate.md)",
    "after": "[original source](step-09-group-thinking-substrate.md)",
    "legacyPath": "docs/architect/proposals/step-09-group-thinking-substrate.md",
    "target": {
      "path": "docs/platform/proposals/step-09-group-thinking-substrate.md",
      "anchor": null,
      "aliasId": "step10-proposals-redesigns-0509"
    },
    "portal": false,
    "area": "proposals",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/proposals/step-09-group-thinking-substrate.md",
    "line": 24,
    "legacy": "docs/architect/proposals/step-09-group-thinking-substrate.md",
    "previous": "[original source](step-09-group-thinking-substrate.md)",
    "now": "../../architect/proposals/step-09-group-thinking-substrate.md",
    "action": "restored-legacy",
    "reason": "provenance/legacy-owner",
    "selfBefore": true,
    "portalBefore": false
  },
  "oldDestination": "../../architect/proposals/step-09-group-thinking-substrate.md",
  "interimDestination": "step-09-group-thinking-substrate.md",
  "newDestination": "../../architect/proposals/step-09-group-thinking-substrate.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/architect/proposals/step-09-group-thinking-substrate.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "c1dc2a2a03dc76402b83dc4cdacbf51f3693b17b8c3b9a8a8c9c286dfc3f9035"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/proposals/step-09-group-thinking-substrate.md",
    "action": "restored-legacy",
    "reason": "provenance/legacy-owner",
    "selfRestored": true,
    "portalRetargeted": false,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-277: link-277

```json
{
  "id": "link-277",
  "original": {
    "path": "docs/platform/proposals/step-09-group-thinking-substrate.md",
    "inputLine": 43,
    "inputColumn": 1,
    "lineBeforeLinkPass": 43,
    "before": "[CoordinationSession Contract](../../architect/agent-coordination/contracts/coordination-session.md)",
    "after": "[CoordinationSession Contract](../agent-coordination/history/retired-engine/files/contracts/coordination-session.md)",
    "legacyPath": "docs/architect/agent-coordination/contracts/coordination-session.md",
    "target": {
      "path": "docs/platform/agent-coordination/history/retired-engine/files/contracts/coordination-session.md",
      "anchor": null,
      "aliasId": "step10-agent-coordination-0510"
    },
    "portal": false,
    "area": "proposals",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/proposals/step-09-group-thinking-substrate.md",
    "line": 43,
    "legacy": "docs/architect/agent-coordination/contracts/coordination-session.md",
    "previous": "[CoordinationSession Contract](../agent-coordination/history/retired-engine/files/contracts/coordination-session.md)",
    "now": "../agent-coordination/history/retired-engine/files/contracts/coordination-session.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../../architect/agent-coordination/contracts/coordination-session.md",
  "interimDestination": "../agent-coordination/history/retired-engine/files/contracts/coordination-session.md",
  "newDestination": "../agent-coordination/history/retired-engine/files/contracts/coordination-session.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/agent-coordination/history/retired-engine/files/contracts/coordination-session.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "268af8311d9e1f0dc91579d75ba43174395362e5f33346a3911524cb00229064"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/agent-coordination/contracts/coordination-session.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfRestored": false,
    "portalRetargeted": false,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-278: link-278

```json
{
  "id": "link-278",
  "original": {
    "path": "docs/platform/proposals/step-09-group-thinking-substrate.md",
    "inputLine": 44,
    "inputColumn": 1,
    "lineBeforeLinkPass": 44,
    "before": "[FlowDefinition Contract](../../architect/agent-coordination/contracts/flow-definition.md)",
    "after": "[FlowDefinition Contract](../agent-coordination/history/retired-engine/files/contracts/flow-definition.md)",
    "legacyPath": "docs/architect/agent-coordination/contracts/flow-definition.md",
    "target": {
      "path": "docs/platform/agent-coordination/history/retired-engine/files/contracts/flow-definition.md",
      "anchor": null,
      "aliasId": "step10-agent-coordination-0625"
    },
    "portal": false,
    "area": "proposals",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/proposals/step-09-group-thinking-substrate.md",
    "line": 44,
    "legacy": "docs/architect/agent-coordination/contracts/flow-definition.md",
    "previous": "[FlowDefinition Contract](../agent-coordination/history/retired-engine/files/contracts/flow-definition.md)",
    "now": "../agent-coordination/history/retired-engine/files/contracts/flow-definition.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../../architect/agent-coordination/contracts/flow-definition.md",
  "interimDestination": "../agent-coordination/history/retired-engine/files/contracts/flow-definition.md",
  "newDestination": "../agent-coordination/history/retired-engine/files/contracts/flow-definition.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/agent-coordination/history/retired-engine/files/contracts/flow-definition.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "e005edcfa74d8745286a261247ee5ab09193e34c90a3ef3cc3cd51a27e94378a"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/agent-coordination/contracts/flow-definition.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfRestored": false,
    "portalRetargeted": false,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-279: link-279

```json
{
  "id": "link-279",
  "original": {
    "path": "docs/platform/proposals/step-09-group-thinking-substrate.md",
    "inputLine": 57,
    "inputColumn": 22,
    "lineBeforeLinkPass": 57,
    "before": "[Architecture Intent](../../architect/architecture-intent.md)",
    "after": "[Architecture Intent](../system-architecture/architecture/architecture-intent.md)",
    "legacyPath": "docs/architect/architecture-intent.md",
    "target": {
      "path": "docs/platform/system-architecture/architecture/architecture-intent.md",
      "anchor": null,
      "aliasId": "step10-whole-system-0013"
    },
    "portal": false,
    "area": "proposals",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/proposals/step-09-group-thinking-substrate.md",
    "line": 57,
    "legacy": "docs/architect/architecture-intent.md",
    "previous": "[Architecture Intent](../system-architecture/architecture/architecture-intent.md)",
    "now": "../system-architecture/architecture/architecture-intent.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../../architect/architecture-intent.md",
  "interimDestination": "../system-architecture/architecture/architecture-intent.md",
  "newDestination": "../system-architecture/architecture/architecture-intent.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/system-architecture/architecture/architecture-intent.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "988b824a980a3c2e57e348ebc3d026f21d6c71c7d83b82eabec0cbaf6f9417fe"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/architecture-intent.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfRestored": false,
    "portalRetargeted": false,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-280: link-280

```json
{
  "id": "link-280",
  "original": {
    "path": "docs/platform/proposals/step-09-group-thinking-substrate.md",
    "inputLine": 58,
    "inputColumn": 1,
    "lineBeforeLinkPass": 58,
    "before": "[Agent Coordination Intent Preservation Ledger](../../architect/agent-coordination/intent-preservation-ledger.md)",
    "after": "[Agent Coordination Intent Preservation Ledger](../agent-coordination/README.md)",
    "legacyPath": "docs/architect/agent-coordination/intent-preservation-ledger.md",
    "target": {
      "path": "docs/platform/agent-coordination/README.md",
      "anchor": null,
      "aliasId": "step10-agent-coordination-1148"
    },
    "portal": false,
    "area": "proposals",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/proposals/step-09-group-thinking-substrate.md",
    "line": 58,
    "legacy": "docs/architect/agent-coordination/intent-preservation-ledger.md",
    "previous": "[Agent Coordination Intent Preservation Ledger](../agent-coordination/README.md)",
    "now": "../agent-coordination/history/retired-engine/legacy/intent-preservation-ledger.md",
    "action": "retargeted-specific",
    "reason": "specific-candidate",
    "selfBefore": false,
    "portalBefore": true
  },
  "oldDestination": "../../architect/agent-coordination/intent-preservation-ledger.md",
  "interimDestination": "../agent-coordination/README.md",
  "newDestination": "../agent-coordination/history/retired-engine/legacy/intent-preservation-ledger.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/agent-coordination/history/retired-engine/legacy/intent-preservation-ledger.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "60a61d421faa9cd83d7625c3068aedb604a5edd02f78840c82cd445ba64e919e"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/agent-coordination/intent-preservation-ledger.md",
    "action": "retargeted-specific",
    "reason": "specific-candidate",
    "selfRestored": false,
    "portalRetargeted": true,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-281: link-281

```json
{
  "id": "link-281",
  "original": {
    "path": "docs/platform/proposals/step-09-group-thinking-substrate.md",
    "inputLine": 59,
    "inputColumn": 10,
    "lineBeforeLinkPass": 59,
    "before": "[Coordination Foundation Baseline](../../architect/agent-coordination/architecture/coordination-foundation-baseline.md)",
    "after": "[Coordination Foundation Baseline](../agent-coordination/history/retired-engine/files/architecture/coordination-foundation-baseline.md)",
    "legacyPath": "docs/architect/agent-coordination/architecture/coordination-foundation-baseline.md",
    "target": {
      "path": "docs/platform/agent-coordination/history/retired-engine/files/architecture/coordination-foundation-baseline.md",
      "anchor": null,
      "aliasId": "step10-agent-coordination-0098"
    },
    "portal": false,
    "area": "proposals",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/proposals/step-09-group-thinking-substrate.md",
    "line": 59,
    "legacy": "docs/architect/agent-coordination/architecture/coordination-foundation-baseline.md",
    "previous": "[Coordination Foundation Baseline](../agent-coordination/history/retired-engine/files/architecture/coordination-foundation-baseline.md)",
    "now": "../agent-coordination/history/retired-engine/files/architecture/coordination-foundation-baseline.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../../architect/agent-coordination/architecture/coordination-foundation-baseline.md",
  "interimDestination": "../agent-coordination/history/retired-engine/files/architecture/coordination-foundation-baseline.md",
  "newDestination": "../agent-coordination/history/retired-engine/files/architecture/coordination-foundation-baseline.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/agent-coordination/history/retired-engine/files/architecture/coordination-foundation-baseline.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "337a8434c51b1e72aa0944e01c9db3daae5da16ca2ccd1995e4decfa148a99e9"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/agent-coordination/architecture/coordination-foundation-baseline.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfRestored": false,
    "portalRetargeted": false,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-282: link-282

```json
{
  "id": "link-282",
  "original": {
    "path": "docs/platform/proposals/step-09-group-thinking-substrate.md",
    "inputLine": 60,
    "inputColumn": 1,
    "lineBeforeLinkPass": 60,
    "before": "[CoordinationSession Contract](../../architect/agent-coordination/contracts/coordination-session.md)",
    "after": "[CoordinationSession Contract](../agent-coordination/history/retired-engine/files/contracts/coordination-session.md)",
    "legacyPath": "docs/architect/agent-coordination/contracts/coordination-session.md",
    "target": {
      "path": "docs/platform/agent-coordination/history/retired-engine/files/contracts/coordination-session.md",
      "anchor": null,
      "aliasId": "step10-agent-coordination-0510"
    },
    "portal": false,
    "area": "proposals",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/proposals/step-09-group-thinking-substrate.md",
    "line": 60,
    "legacy": "docs/architect/agent-coordination/contracts/coordination-session.md",
    "previous": "[CoordinationSession Contract](../agent-coordination/history/retired-engine/files/contracts/coordination-session.md)",
    "now": "../agent-coordination/history/retired-engine/files/contracts/coordination-session.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../../architect/agent-coordination/contracts/coordination-session.md",
  "interimDestination": "../agent-coordination/history/retired-engine/files/contracts/coordination-session.md",
  "newDestination": "../agent-coordination/history/retired-engine/files/contracts/coordination-session.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/agent-coordination/history/retired-engine/files/contracts/coordination-session.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "268af8311d9e1f0dc91579d75ba43174395362e5f33346a3911524cb00229064"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/agent-coordination/contracts/coordination-session.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfRestored": false,
    "portalRetargeted": false,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-283: link-283

```json
{
  "id": "link-283",
  "original": {
    "path": "docs/platform/proposals/step-09-group-thinking-substrate.md",
    "inputLine": 61,
    "inputColumn": 1,
    "lineBeforeLinkPass": 61,
    "before": "[FlowDefinition Contract](../../architect/agent-coordination/contracts/flow-definition.md)",
    "after": "[FlowDefinition Contract](../agent-coordination/history/retired-engine/files/contracts/flow-definition.md)",
    "legacyPath": "docs/architect/agent-coordination/contracts/flow-definition.md",
    "target": {
      "path": "docs/platform/agent-coordination/history/retired-engine/files/contracts/flow-definition.md",
      "anchor": null,
      "aliasId": "step10-agent-coordination-0625"
    },
    "portal": false,
    "area": "proposals",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/proposals/step-09-group-thinking-substrate.md",
    "line": 61,
    "legacy": "docs/architect/agent-coordination/contracts/flow-definition.md",
    "previous": "[FlowDefinition Contract](../agent-coordination/history/retired-engine/files/contracts/flow-definition.md)",
    "now": "../agent-coordination/history/retired-engine/files/contracts/flow-definition.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../../architect/agent-coordination/contracts/flow-definition.md",
  "interimDestination": "../agent-coordination/history/retired-engine/files/contracts/flow-definition.md",
  "newDestination": "../agent-coordination/history/retired-engine/files/contracts/flow-definition.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/agent-coordination/history/retired-engine/files/contracts/flow-definition.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "e005edcfa74d8745286a261247ee5ab09193e34c90a3ef3cc3cd51a27e94378a"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/agent-coordination/contracts/flow-definition.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfRestored": false,
    "portalRetargeted": false,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-284: link-284

```json
{
  "id": "link-284",
  "original": {
    "path": "docs/platform/proposals/step-09-group-thinking-substrate.md",
    "inputLine": 62,
    "inputColumn": 1,
    "lineBeforeLinkPass": 62,
    "before": "[Team Communication Protocol V1](../../architect/agent-coordination/proposals/team-communication-protocol-v1.md)",
    "after": "[Team Communication Protocol V1](../agent-coordination/README.md)",
    "legacyPath": "docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md",
    "target": {
      "path": "docs/platform/agent-coordination/README.md",
      "anchor": null,
      "aliasId": "step10-agent-coordination-2563"
    },
    "portal": false,
    "area": "proposals",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/proposals/step-09-group-thinking-substrate.md",
    "line": 62,
    "legacy": "docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md",
    "previous": "[Team Communication Protocol V1](../agent-coordination/README.md)",
    "now": "../agent-coordination/proposals/team-communication-protocol-v1.md",
    "action": "retargeted-specific",
    "reason": "specific-candidate",
    "selfBefore": false,
    "portalBefore": true
  },
  "oldDestination": "../../architect/agent-coordination/proposals/team-communication-protocol-v1.md",
  "interimDestination": "../agent-coordination/README.md",
  "newDestination": "../agent-coordination/proposals/team-communication-protocol-v1.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "6283f064d761fc87f746031a2d12da027c06bbea5be85e5a45365ed8d2df4088"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md",
    "action": "retargeted-specific",
    "reason": "specific-candidate",
    "selfRestored": false,
    "portalRetargeted": true,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-285: link-285

```json
{
  "id": "link-285",
  "original": {
    "path": "docs/platform/proposals/step-09-group-thinking-substrate.md",
    "inputLine": 63,
    "inputColumn": 1,
    "lineBeforeLinkPass": 63,
    "before": "[Component Authority Boundary Map](../../architect/proposals/component-authority-boundary-map.md)",
    "after": "[Component Authority Boundary Map](component-authority-boundary-map.md)",
    "legacyPath": "docs/architect/proposals/component-authority-boundary-map.md",
    "target": {
      "path": "docs/platform/proposals/component-authority-boundary-map.md",
      "anchor": null,
      "aliasId": "step10-proposals-redesigns-0130"
    },
    "portal": false,
    "area": "proposals",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/proposals/step-09-group-thinking-substrate.md",
    "line": 63,
    "legacy": "docs/architect/proposals/component-authority-boundary-map.md",
    "previous": "[Component Authority Boundary Map](component-authority-boundary-map.md)",
    "now": "component-authority-boundary-map.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../../architect/proposals/component-authority-boundary-map.md",
  "interimDestination": "component-authority-boundary-map.md",
  "newDestination": "component-authority-boundary-map.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/proposals/component-authority-boundary-map.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "28fbac96515c3d8c9eea0cff912ac88a04bb616802c1581fb30fee7aeff2b500"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/proposals/component-authority-boundary-map.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfRestored": false,
    "portalRetargeted": false,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-286: link-286

```json
{
  "id": "link-286",
  "original": {
    "path": "docs/platform/proposals/step-09-group-thinking-substrate.md",
    "inputLine": 64,
    "inputColumn": 1,
    "lineBeforeLinkPass": 64,
    "before": "[Step 10 Coding Domain Adoption](../../architect/proposals/step-10-coding-domain-adoption.md)",
    "after": "[Step 10 Coding Domain Adoption](step-10-coding-domain-adoption.md)",
    "legacyPath": "docs/architect/proposals/step-10-coding-domain-adoption.md",
    "target": {
      "path": "docs/platform/proposals/step-10-coding-domain-adoption.md",
      "anchor": null,
      "aliasId": "step10-proposals-redesigns-0763"
    },
    "portal": false,
    "area": "proposals",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/proposals/step-09-group-thinking-substrate.md",
    "line": 64,
    "legacy": "docs/architect/proposals/step-10-coding-domain-adoption.md",
    "previous": "[Step 10 Coding Domain Adoption](step-10-coding-domain-adoption.md)",
    "now": "step-10-coding-domain-adoption.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../../architect/proposals/step-10-coding-domain-adoption.md",
  "interimDestination": "step-10-coding-domain-adoption.md",
  "newDestination": "step-10-coding-domain-adoption.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/proposals/step-10-coding-domain-adoption.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "7285d2a7d7ec8da851731f6215760640e31fbb226d869358708b8529a73e67f4"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/proposals/step-10-coding-domain-adoption.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfRestored": false,
    "portalRetargeted": false,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-287: link-287

```json
{
  "id": "link-287",
  "original": {
    "path": "docs/platform/proposals/step-09-group-thinking-substrate.md",
    "inputLine": 65,
    "inputColumn": 1,
    "lineBeforeLinkPass": 65,
    "before": "[Step 09 MVP1/MVP2 group-thinking verification](../../architect/agent-coordination/verification/step-09-group-thinking-mvp1-mvp2/index.md)",
    "after": "[Step 09 MVP1/MVP2 group-thinking verification](../agent-coordination/verification/step-09-group-thinking-mvp1-mvp2/index.md)",
    "legacyPath": "docs/architect/agent-coordination/verification/step-09-group-thinking-mvp1-mvp2/index.md",
    "target": {
      "path": "docs/platform/agent-coordination/verification/step-09-group-thinking-mvp1-mvp2/index.md",
      "anchor": null,
      "aliasId": "step10-agent-coordination-4223"
    },
    "portal": false,
    "area": "proposals",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/proposals/step-09-group-thinking-substrate.md",
    "line": 65,
    "legacy": "docs/architect/agent-coordination/verification/step-09-group-thinking-mvp1-mvp2/index.md",
    "previous": "[Step 09 MVP1/MVP2 group-thinking verification](../agent-coordination/verification/step-09-group-thinking-mvp1-mvp2/index.md)",
    "now": "../agent-coordination/verification/step-09-group-thinking-mvp1-mvp2/index.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../../architect/agent-coordination/verification/step-09-group-thinking-mvp1-mvp2/index.md",
  "interimDestination": "../agent-coordination/verification/step-09-group-thinking-mvp1-mvp2/index.md",
  "newDestination": "../agent-coordination/verification/step-09-group-thinking-mvp1-mvp2/index.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/agent-coordination/verification/step-09-group-thinking-mvp1-mvp2/index.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "5a49c8665a1eac9d782ce604e452bbbe84109eed54e3c1718b4d5bfa7d129865"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/agent-coordination/verification/step-09-group-thinking-mvp1-mvp2/index.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfRestored": false,
    "portalRetargeted": false,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-288: link-288

```json
{
  "id": "link-288",
  "original": {
    "path": "docs/platform/proposals/step-09-group-thinking-substrate.md",
    "inputLine": 66,
    "inputColumn": 1,
    "lineBeforeLinkPass": 66,
    "before": "[Step 09 MVP3-MVP5 verification](../../architect/agent-coordination/verification/step-09-mvp3-to-mvp5/index.md)",
    "after": "[Step 09 MVP3-MVP5 verification](../agent-coordination/verification/step-09-mvp3-to-mvp5/index.md)",
    "legacyPath": "docs/architect/agent-coordination/verification/step-09-mvp3-to-mvp5/index.md",
    "target": {
      "path": "docs/platform/agent-coordination/verification/step-09-mvp3-to-mvp5/index.md",
      "anchor": null,
      "aliasId": "step10-agent-coordination-4234"
    },
    "portal": false,
    "area": "proposals",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/proposals/step-09-group-thinking-substrate.md",
    "line": 66,
    "legacy": "docs/architect/agent-coordination/verification/step-09-mvp3-to-mvp5/index.md",
    "previous": "[Step 09 MVP3-MVP5 verification](../agent-coordination/verification/step-09-mvp3-to-mvp5/index.md)",
    "now": "../agent-coordination/verification/step-09-mvp3-to-mvp5/index.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../../architect/agent-coordination/verification/step-09-mvp3-to-mvp5/index.md",
  "interimDestination": "../agent-coordination/verification/step-09-mvp3-to-mvp5/index.md",
  "newDestination": "../agent-coordination/verification/step-09-mvp3-to-mvp5/index.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/agent-coordination/verification/step-09-mvp3-to-mvp5/index.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "f5cad6b1e3a53caca2ba7209dd1d78e9b8b836c551caeb3e1e7144ca96ab6600"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/agent-coordination/verification/step-09-mvp3-to-mvp5/index.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfRestored": false,
    "portalRetargeted": false,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-289: link-289

```json
{
  "id": "link-289",
  "original": {
    "path": "docs/platform/proposals/step-09-group-thinking-substrate.md",
    "inputLine": 67,
    "inputColumn": 1,
    "lineBeforeLinkPass": 67,
    "before": "[MVP6+ Dogfood Handoff](../../architect/agent-coordination/playbooks/mvp6-dogfood-handoff.md)",
    "after": "[MVP6+ Dogfood Handoff](../agent-coordination/history/retired-engine/files/playbooks/mvp6-dogfood-handoff.md)",
    "legacyPath": "docs/architect/agent-coordination/playbooks/mvp6-dogfood-handoff.md",
    "target": {
      "path": "docs/platform/agent-coordination/history/retired-engine/files/playbooks/mvp6-dogfood-handoff.md",
      "anchor": null,
      "aliasId": "step10-agent-coordination-1583"
    },
    "portal": false,
    "area": "proposals",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/proposals/step-09-group-thinking-substrate.md",
    "line": 67,
    "legacy": "docs/architect/agent-coordination/playbooks/mvp6-dogfood-handoff.md",
    "previous": "[MVP6+ Dogfood Handoff](../agent-coordination/history/retired-engine/files/playbooks/mvp6-dogfood-handoff.md)",
    "now": "../agent-coordination/history/retired-engine/files/playbooks/mvp6-dogfood-handoff.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../../architect/agent-coordination/playbooks/mvp6-dogfood-handoff.md",
  "interimDestination": "../agent-coordination/history/retired-engine/files/playbooks/mvp6-dogfood-handoff.md",
  "newDestination": "../agent-coordination/history/retired-engine/files/playbooks/mvp6-dogfood-handoff.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/agent-coordination/history/retired-engine/files/playbooks/mvp6-dogfood-handoff.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "4bcc7cbff043ba85e5b41f4e14f9954966c861a0f8f39259fb0050f4431cbc5d"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/agent-coordination/playbooks/mvp6-dogfood-handoff.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfRestored": false,
    "portalRetargeted": false,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-290: link-290

```json
{
  "id": "link-290",
  "original": {
    "path": "docs/platform/proposals/step-09-group-thinking-substrate.md",
    "inputLine": 125,
    "inputColumn": 1,
    "lineBeforeLinkPass": 125,
    "before": "[Architecture Intent](../../architect/architecture-intent.md)",
    "after": "[Architecture Intent](../system-architecture/architecture/architecture-intent.md)",
    "legacyPath": "docs/architect/architecture-intent.md",
    "target": {
      "path": "docs/platform/system-architecture/architecture/architecture-intent.md",
      "anchor": null,
      "aliasId": "step10-whole-system-0013"
    },
    "portal": false,
    "area": "proposals",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/proposals/step-09-group-thinking-substrate.md",
    "line": 125,
    "legacy": "docs/architect/architecture-intent.md",
    "previous": "[Architecture Intent](../system-architecture/architecture/architecture-intent.md)",
    "now": "../system-architecture/architecture/architecture-intent.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../../architect/architecture-intent.md",
  "interimDestination": "../system-architecture/architecture/architecture-intent.md",
  "newDestination": "../system-architecture/architecture/architecture-intent.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/system-architecture/architecture/architecture-intent.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "988b824a980a3c2e57e348ebc3d026f21d6c71c7d83b82eabec0cbaf6f9417fe"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/architecture-intent.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfRestored": false,
    "portalRetargeted": false,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-291: link-291

```json
{
  "id": "link-291",
  "original": {
    "path": "docs/platform/proposals/step-09-group-thinking-substrate.md",
    "inputLine": 194,
    "inputColumn": 1,
    "lineBeforeLinkPass": 194,
    "before": "[Master Multi-Agent Implementation Coordinator](../../architect/agent-coordination/playbooks/prompts/master-coordinator.md)",
    "after": "[Master Multi-Agent Implementation Coordinator](../agent-coordination/README.md)",
    "legacyPath": "docs/architect/agent-coordination/playbooks/prompts/master-coordinator.md",
    "target": {
      "path": "docs/platform/agent-coordination/README.md",
      "anchor": null,
      "aliasId": "step10-agent-coordination-1655"
    },
    "portal": false,
    "area": "proposals",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/proposals/step-09-group-thinking-substrate.md",
    "line": 194,
    "legacy": "docs/architect/agent-coordination/playbooks/prompts/master-coordinator.md",
    "previous": "[Master Multi-Agent Implementation Coordinator](../agent-coordination/README.md)",
    "now": "../agent-coordination/playbooks/prompts/master-coordinator.md",
    "action": "retargeted-specific",
    "reason": "specific-candidate",
    "selfBefore": false,
    "portalBefore": true
  },
  "oldDestination": "../../architect/agent-coordination/playbooks/prompts/master-coordinator.md",
  "interimDestination": "../agent-coordination/README.md",
  "newDestination": "../agent-coordination/playbooks/prompts/master-coordinator.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/agent-coordination/playbooks/prompts/master-coordinator.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "3cccc8cff795fe5b589c19f8aed2e9bc23594ead0aa39009dba1be0eb52b37e6"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/agent-coordination/playbooks/prompts/master-coordinator.md",
    "action": "retargeted-specific",
    "reason": "specific-candidate",
    "selfRestored": false,
    "portalRetargeted": true,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-292: link-292

```json
{
  "id": "link-292",
  "original": {
    "path": "docs/platform/proposals/step-09-group-thinking-substrate.md",
    "inputLine": 196,
    "inputColumn": 1,
    "lineBeforeLinkPass": 196,
    "before": "[Coordination Operating Harness](../../architect/agent-coordination/playbooks/coordination-operating-harness.md)",
    "after": "[Coordination Operating Harness](../agent-coordination/README.md)",
    "legacyPath": "docs/architect/agent-coordination/playbooks/coordination-operating-harness.md",
    "target": {
      "path": "docs/platform/agent-coordination/README.md",
      "anchor": null,
      "aliasId": "step10-agent-coordination-1488"
    },
    "portal": false,
    "area": "proposals",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/proposals/step-09-group-thinking-substrate.md",
    "line": 196,
    "legacy": "docs/architect/agent-coordination/playbooks/coordination-operating-harness.md",
    "previous": "[Coordination Operating Harness](../agent-coordination/README.md)",
    "now": "../agent-coordination/playbooks/coordination-operating-harness.md",
    "action": "retargeted-specific",
    "reason": "specific-candidate",
    "selfBefore": false,
    "portalBefore": true
  },
  "oldDestination": "../../architect/agent-coordination/playbooks/coordination-operating-harness.md",
  "interimDestination": "../agent-coordination/README.md",
  "newDestination": "../agent-coordination/playbooks/coordination-operating-harness.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/agent-coordination/playbooks/coordination-operating-harness.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "e8f78ba9a72e660df02eaf498231ecedd51826ada7a9b8f02b5ea234ceb2da66"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/agent-coordination/playbooks/coordination-operating-harness.md",
    "action": "retargeted-specific",
    "reason": "specific-candidate",
    "selfRestored": false,
    "portalRetargeted": true,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-293: link-293

```json
{
  "id": "link-293",
  "original": {
    "path": "docs/platform/proposals/step-09-group-thinking-substrate.md",
    "inputLine": 566,
    "inputColumn": 1,
    "lineBeforeLinkPass": 566,
    "before": "[Component Authority Boundary Map](../../architect/proposals/component-authority-boundary-map.md)",
    "after": "[Component Authority Boundary Map](component-authority-boundary-map.md)",
    "legacyPath": "docs/architect/proposals/component-authority-boundary-map.md",
    "target": {
      "path": "docs/platform/proposals/component-authority-boundary-map.md",
      "anchor": null,
      "aliasId": "step10-proposals-redesigns-0130"
    },
    "portal": false,
    "area": "proposals",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/proposals/step-09-group-thinking-substrate.md",
    "line": 566,
    "legacy": "docs/architect/proposals/component-authority-boundary-map.md",
    "previous": "[Component Authority Boundary Map](component-authority-boundary-map.md)",
    "now": "component-authority-boundary-map.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../../architect/proposals/component-authority-boundary-map.md",
  "interimDestination": "component-authority-boundary-map.md",
  "newDestination": "component-authority-boundary-map.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/proposals/component-authority-boundary-map.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "28fbac96515c3d8c9eea0cff912ac88a04bb616802c1581fb30fee7aeff2b500"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/proposals/component-authority-boundary-map.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfRestored": false,
    "portalRetargeted": false,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-294: link-294

```json
{
  "id": "link-294",
  "original": {
    "path": "docs/platform/proposals/step-09-group-thinking-substrate.md",
    "inputLine": 580,
    "inputColumn": 1,
    "lineBeforeLinkPass": 580,
    "before": "[Step 10 Coding Domain Adoption](../../architect/proposals/step-10-coding-domain-adoption.md)",
    "after": "[Step 10 Coding Domain Adoption](step-10-coding-domain-adoption.md)",
    "legacyPath": "docs/architect/proposals/step-10-coding-domain-adoption.md",
    "target": {
      "path": "docs/platform/proposals/step-10-coding-domain-adoption.md",
      "anchor": null,
      "aliasId": "step10-proposals-redesigns-0763"
    },
    "portal": false,
    "area": "proposals",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/proposals/step-09-group-thinking-substrate.md",
    "line": 580,
    "legacy": "docs/architect/proposals/step-10-coding-domain-adoption.md",
    "previous": "[Step 10 Coding Domain Adoption](step-10-coding-domain-adoption.md)",
    "now": "step-10-coding-domain-adoption.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../../architect/proposals/step-10-coding-domain-adoption.md",
  "interimDestination": "step-10-coding-domain-adoption.md",
  "newDestination": "step-10-coding-domain-adoption.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/proposals/step-10-coding-domain-adoption.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "7285d2a7d7ec8da851731f6215760640e31fbb226d869358708b8529a73e67f4"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/proposals/step-10-coding-domain-adoption.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfRestored": false,
    "portalRetargeted": false,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-295: link-295

```json
{
  "id": "link-295",
  "original": {
    "path": "docs/platform/proposals/step-10-a0-coding-domain-boundary-facade-plan.md",
    "inputLine": 24,
    "inputColumn": 22,
    "lineBeforeLinkPass": 24,
    "before": "[original source](../../architect/proposals/step-10-a0-coding-domain-boundary-facade-plan.md)",
    "after": "[original source](step-10-a0-coding-domain-boundary-facade-plan.md)",
    "legacyPath": "docs/architect/proposals/step-10-a0-coding-domain-boundary-facade-plan.md",
    "target": {
      "path": "docs/platform/proposals/step-10-a0-coding-domain-boundary-facade-plan.md",
      "anchor": null,
      "aliasId": "step10-proposals-redesigns-0608"
    },
    "portal": false,
    "area": "proposals",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/proposals/step-10-a0-coding-domain-boundary-facade-plan.md",
    "line": 24,
    "legacy": "docs/architect/proposals/step-10-a0-coding-domain-boundary-facade-plan.md",
    "previous": "[original source](step-10-a0-coding-domain-boundary-facade-plan.md)",
    "now": "../../architect/proposals/step-10-a0-coding-domain-boundary-facade-plan.md",
    "action": "restored-legacy",
    "reason": "provenance/legacy-owner",
    "selfBefore": true,
    "portalBefore": false
  },
  "oldDestination": "../../architect/proposals/step-10-a0-coding-domain-boundary-facade-plan.md",
  "interimDestination": "step-10-a0-coding-domain-boundary-facade-plan.md",
  "newDestination": "../../architect/proposals/step-10-a0-coding-domain-boundary-facade-plan.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/architect/proposals/step-10-a0-coding-domain-boundary-facade-plan.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "37a786733e0e9937cfb2584bdd332ec5b4eb6f7109fabf60d4979ad14f30c884"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/proposals/step-10-a0-coding-domain-boundary-facade-plan.md",
    "action": "restored-legacy",
    "reason": "provenance/legacy-owner",
    "selfRestored": true,
    "portalRetargeted": false,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-296: link-296

```json
{
  "id": "link-296",
  "original": {
    "path": "docs/platform/proposals/step-10-a0-coding-domain-boundary-facade-plan.md",
    "inputLine": 35,
    "inputColumn": 3,
    "lineBeforeLinkPass": 35,
    "before": "[Step 10 Coding Domain Adoption](../../architect/proposals/step-10-coding-domain-adoption.md)",
    "after": "[Step 10 Coding Domain Adoption](step-10-coding-domain-adoption.md)",
    "legacyPath": "docs/architect/proposals/step-10-coding-domain-adoption.md",
    "target": {
      "path": "docs/platform/proposals/step-10-coding-domain-adoption.md",
      "anchor": null,
      "aliasId": "step10-proposals-redesigns-0763"
    },
    "portal": false,
    "area": "proposals",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/proposals/step-10-a0-coding-domain-boundary-facade-plan.md",
    "line": 35,
    "legacy": "docs/architect/proposals/step-10-coding-domain-adoption.md",
    "previous": "[Step 10 Coding Domain Adoption](step-10-coding-domain-adoption.md)",
    "now": "step-10-coding-domain-adoption.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../../architect/proposals/step-10-coding-domain-adoption.md",
  "interimDestination": "step-10-coding-domain-adoption.md",
  "newDestination": "step-10-coding-domain-adoption.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/proposals/step-10-coding-domain-adoption.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "7285d2a7d7ec8da851731f6215760640e31fbb226d869358708b8529a73e67f4"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/proposals/step-10-coding-domain-adoption.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfRestored": false,
    "portalRetargeted": false,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-297: link-297

```json
{
  "id": "link-297",
  "original": {
    "path": "docs/platform/proposals/step-10-a0-coding-domain-boundary-facade-plan.md",
    "inputLine": 36,
    "inputColumn": 3,
    "lineBeforeLinkPass": 36,
    "before": "[Architect Roadmap](../../architect/roadmap.md)",
    "after": "[Architect Roadmap](../system-architecture/architecture/roadmap.md)",
    "legacyPath": "docs/architect/roadmap.md",
    "target": {
      "path": "docs/platform/system-architecture/architecture/roadmap.md",
      "anchor": null,
      "aliasId": "step10-whole-system-1283"
    },
    "portal": false,
    "area": "proposals",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/proposals/step-10-a0-coding-domain-boundary-facade-plan.md",
    "line": 36,
    "legacy": "docs/architect/roadmap.md",
    "previous": "[Architect Roadmap](../system-architecture/architecture/roadmap.md)",
    "now": "../system-architecture/architecture/roadmap.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../../architect/roadmap.md",
  "interimDestination": "../system-architecture/architecture/roadmap.md",
  "newDestination": "../system-architecture/architecture/roadmap.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/system-architecture/architecture/roadmap.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "b754ba350d11bb56d93912f42b3d1dec9fa2cef2d3e425fc0586f1a5f1517e8e"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/roadmap.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfRestored": false,
    "portalRetargeted": false,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-298: link-298

```json
{
  "id": "link-298",
  "original": {
    "path": "docs/platform/proposals/step-10-a0-coding-domain-boundary-facade-plan.md",
    "inputLine": 37,
    "inputColumn": 3,
    "lineBeforeLinkPass": 37,
    "before": "[Workspace Topology Architecture](../../architect/workspace-topology.md)",
    "after": "[Workspace Topology Architecture](../system-architecture/architecture/workspace-topology.md)",
    "legacyPath": "docs/architect/workspace-topology.md",
    "target": {
      "path": "docs/platform/system-architecture/architecture/workspace-topology.md",
      "anchor": null,
      "aliasId": "step10-whole-system-1458"
    },
    "portal": false,
    "area": "proposals",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/proposals/step-10-a0-coding-domain-boundary-facade-plan.md",
    "line": 37,
    "legacy": "docs/architect/workspace-topology.md",
    "previous": "[Workspace Topology Architecture](../system-architecture/architecture/workspace-topology.md)",
    "now": "../system-architecture/architecture/workspace-topology.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../../architect/workspace-topology.md",
  "interimDestination": "../system-architecture/architecture/workspace-topology.md",
  "newDestination": "../system-architecture/architecture/workspace-topology.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/system-architecture/architecture/workspace-topology.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "441108da9c93fa071b4065319c40562ab44d410b714fe0140252a26280a4c15e"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/workspace-topology.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfRestored": false,
    "portalRetargeted": false,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-299: link-299

```json
{
  "id": "link-299",
  "original": {
    "path": "docs/platform/proposals/step-10-a0-coding-domain-boundary-facade-plan.md",
    "inputLine": 38,
    "inputColumn": 3,
    "lineBeforeLinkPass": 38,
    "before": "[Runtime Identity And Activation](../../architect/packaging-distribution/runtime-identity-and-activation.md)",
    "after": "[Runtime Identity And Activation](../packaging-distribution/README.md)",
    "legacyPath": "docs/architect/packaging-distribution/runtime-identity-and-activation.md",
    "target": {
      "path": "docs/platform/packaging-distribution/README.md",
      "anchor": null,
      "aliasId": "step10-packaging-distribution-0173"
    },
    "portal": false,
    "area": "proposals",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/proposals/step-10-a0-coding-domain-boundary-facade-plan.md",
    "line": 38,
    "legacy": "docs/architect/packaging-distribution/runtime-identity-and-activation.md",
    "previous": "[Runtime Identity And Activation](../packaging-distribution/README.md)",
    "now": "../packaging-distribution/architecture/runtime-identity-and-activation.md",
    "action": "retargeted-specific",
    "reason": "specific-candidate",
    "selfBefore": false,
    "portalBefore": true
  },
  "oldDestination": "../../architect/packaging-distribution/runtime-identity-and-activation.md",
  "interimDestination": "../packaging-distribution/README.md",
  "newDestination": "../packaging-distribution/architecture/runtime-identity-and-activation.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "a8246d7c962bff0f4a2cbaa27526a42715fdf20a65504b6b92112e02f1a5056d"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/packaging-distribution/runtime-identity-and-activation.md",
    "action": "retargeted-specific",
    "reason": "specific-candidate",
    "selfRestored": false,
    "portalRetargeted": true,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-300: link-300

```json
{
  "id": "link-300",
  "original": {
    "path": "docs/platform/proposals/step-10-a0-coding-domain-boundary-facade-plan.md",
    "inputLine": 39,
    "inputColumn": 3,
    "lineBeforeLinkPass": 39,
    "before": "[System Vision: Trong Mem Ngoai Cung](../../architect/system-vision-trong-mem-ngoai-cung.md)",
    "after": "[System Vision: Trong Mem Ngoai Cung](../system-architecture/architecture/system-vision-trong-mem-ngoai-cung.md)",
    "legacyPath": "docs/architect/system-vision-trong-mem-ngoai-cung.md",
    "target": {
      "path": "docs/platform/system-architecture/architecture/system-vision-trong-mem-ngoai-cung.md",
      "anchor": null,
      "aliasId": "step10-whole-system-1321"
    },
    "portal": false,
    "area": "proposals",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/proposals/step-10-a0-coding-domain-boundary-facade-plan.md",
    "line": 39,
    "legacy": "docs/architect/system-vision-trong-mem-ngoai-cung.md",
    "previous": "[System Vision: Trong Mem Ngoai Cung](../system-architecture/architecture/system-vision-trong-mem-ngoai-cung.md)",
    "now": "../system-architecture/architecture/system-vision-trong-mem-ngoai-cung.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../../architect/system-vision-trong-mem-ngoai-cung.md",
  "interimDestination": "../system-architecture/architecture/system-vision-trong-mem-ngoai-cung.md",
  "newDestination": "../system-architecture/architecture/system-vision-trong-mem-ngoai-cung.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/system-architecture/architecture/system-vision-trong-mem-ngoai-cung.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "50099b7a34e0f160bb9d5a8bb56527531ef747a31cca021302eae981d9e05a99"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/system-vision-trong-mem-ngoai-cung.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfRestored": false,
    "portalRetargeted": false,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-301: link-301

```json
{
  "id": "link-301",
  "original": {
    "path": "docs/platform/proposals/step-10-coding-domain-adoption.md",
    "inputLine": 24,
    "inputColumn": 22,
    "lineBeforeLinkPass": 24,
    "before": "[original source](../../architect/proposals/step-10-coding-domain-adoption.md)",
    "after": "[original source](step-10-coding-domain-adoption.md)",
    "legacyPath": "docs/architect/proposals/step-10-coding-domain-adoption.md",
    "target": {
      "path": "docs/platform/proposals/step-10-coding-domain-adoption.md",
      "anchor": null,
      "aliasId": "step10-proposals-redesigns-0763"
    },
    "portal": false,
    "area": "proposals",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/proposals/step-10-coding-domain-adoption.md",
    "line": 24,
    "legacy": "docs/architect/proposals/step-10-coding-domain-adoption.md",
    "previous": "[original source](step-10-coding-domain-adoption.md)",
    "now": "../../architect/proposals/step-10-coding-domain-adoption.md",
    "action": "restored-legacy",
    "reason": "provenance/legacy-owner",
    "selfBefore": true,
    "portalBefore": false
  },
  "oldDestination": "../../architect/proposals/step-10-coding-domain-adoption.md",
  "interimDestination": "step-10-coding-domain-adoption.md",
  "newDestination": "../../architect/proposals/step-10-coding-domain-adoption.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/architect/proposals/step-10-coding-domain-adoption.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "cca8c3ce96f36e9485078ed21d67999904b333774e9093ab2e403d15ab9c51d3"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/proposals/step-10-coding-domain-adoption.md",
    "action": "restored-legacy",
    "reason": "provenance/legacy-owner",
    "selfRestored": true,
    "portalRetargeted": false,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-302: link-302

```json
{
  "id": "link-302",
  "original": {
    "path": "docs/platform/proposals/step-10-coding-domain-adoption.md",
    "inputLine": 72,
    "inputColumn": 1,
    "lineBeforeLinkPass": 72,
    "before": "[Agent Coordination Vision](../../architect/agent-coordination/vision.md)",
    "after": "[Agent Coordination Vision](../agent-coordination/README.md)",
    "legacyPath": "docs/architect/agent-coordination/vision.md",
    "target": {
      "path": "docs/platform/agent-coordination/README.md",
      "anchor": null,
      "aliasId": "step10-agent-coordination-4330"
    },
    "portal": false,
    "area": "proposals",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/proposals/step-10-coding-domain-adoption.md",
    "line": 72,
    "legacy": "docs/architect/agent-coordination/vision.md",
    "previous": "[Agent Coordination Vision](../agent-coordination/README.md)",
    "now": "../agent-coordination/vision.md",
    "action": "retargeted-specific",
    "reason": "specific-candidate",
    "selfBefore": false,
    "portalBefore": true
  },
  "oldDestination": "../../architect/agent-coordination/vision.md",
  "interimDestination": "../agent-coordination/README.md",
  "newDestination": "../agent-coordination/vision.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/agent-coordination/vision.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "15424581be04de19fc1a9b5477ddd42d7822ef1a434f1a5a867ffea5d7103bf6"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/agent-coordination/vision.md",
    "action": "retargeted-specific",
    "reason": "specific-candidate",
    "selfRestored": false,
    "portalRetargeted": true,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-303: link-303

```json
{
  "id": "link-303",
  "original": {
    "path": "docs/platform/proposals/step-10-coding-domain-adoption.md",
    "inputLine": 239,
    "inputColumn": 1,
    "lineBeforeLinkPass": 239,
    "before": "[Step 10 A0 - Coding Domain Boundary And Facade Plan](../../architect/proposals/step-10-a0-coding-domain-boundary-facade-plan.md)",
    "after": "[Step 10 A0 - Coding Domain Boundary And Facade Plan](step-10-a0-coding-domain-boundary-facade-plan.md)",
    "legacyPath": "docs/architect/proposals/step-10-a0-coding-domain-boundary-facade-plan.md",
    "target": {
      "path": "docs/platform/proposals/step-10-a0-coding-domain-boundary-facade-plan.md",
      "anchor": null,
      "aliasId": "step10-proposals-redesigns-0608"
    },
    "portal": false,
    "area": "proposals",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/proposals/step-10-coding-domain-adoption.md",
    "line": 239,
    "legacy": "docs/architect/proposals/step-10-a0-coding-domain-boundary-facade-plan.md",
    "previous": "[Step 10 A0 - Coding Domain Boundary And Facade Plan](step-10-a0-coding-domain-boundary-facade-plan.md)",
    "now": "step-10-a0-coding-domain-boundary-facade-plan.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../../architect/proposals/step-10-a0-coding-domain-boundary-facade-plan.md",
  "interimDestination": "step-10-a0-coding-domain-boundary-facade-plan.md",
  "newDestination": "step-10-a0-coding-domain-boundary-facade-plan.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/proposals/step-10-a0-coding-domain-boundary-facade-plan.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "4c421a90ae1c48bbbd6fef7e781010ed8aa2b26af8edc63f07ad2945c26ab46e"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/proposals/step-10-a0-coding-domain-boundary-facade-plan.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfRestored": false,
    "portalRetargeted": false,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-304: link-304

```json
{
  "id": "link-304",
  "original": {
    "path": "docs/platform/proposals/step-10-coding-domain-adoption.md",
    "inputLine": 353,
    "inputColumn": 1,
    "lineBeforeLinkPass": 353,
    "before": "[Component Authority Boundary Map](../../architect/proposals/component-authority-boundary-map.md)",
    "after": "[Component Authority Boundary Map](component-authority-boundary-map.md)",
    "legacyPath": "docs/architect/proposals/component-authority-boundary-map.md",
    "target": {
      "path": "docs/platform/proposals/component-authority-boundary-map.md",
      "anchor": null,
      "aliasId": "step10-proposals-redesigns-0130"
    },
    "portal": false,
    "area": "proposals",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/proposals/step-10-coding-domain-adoption.md",
    "line": 353,
    "legacy": "docs/architect/proposals/component-authority-boundary-map.md",
    "previous": "[Component Authority Boundary Map](component-authority-boundary-map.md)",
    "now": "component-authority-boundary-map.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../../architect/proposals/component-authority-boundary-map.md",
  "interimDestination": "component-authority-boundary-map.md",
  "newDestination": "component-authority-boundary-map.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/proposals/component-authority-boundary-map.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "28fbac96515c3d8c9eea0cff912ac88a04bb616802c1581fb30fee7aeff2b500"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/proposals/component-authority-boundary-map.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfRestored": false,
    "portalRetargeted": false,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-305: link-305

```json
{
  "id": "link-305",
  "original": {
    "path": "docs/platform/proposals/step-10-coding-domain-adoption.md",
    "inputLine": 462,
    "inputColumn": 2,
    "lineBeforeLinkPass": 462,
    "before": "[advisory §10](../../architect/component-boundary/component-boundary-advisory.md)",
    "after": "[advisory §10](../component-boundary.md)",
    "legacyPath": "docs/architect/component-boundary/component-boundary-advisory.md",
    "target": {
      "path": "docs/platform/component-boundary.md",
      "anchor": null,
      "aliasId": "step10-whole-system-0212"
    },
    "portal": false,
    "area": "proposals",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/proposals/step-10-coding-domain-adoption.md",
    "line": 462,
    "legacy": "docs/architect/component-boundary/component-boundary-advisory.md",
    "previous": "[advisory §10](../component-boundary.md)",
    "now": "../component-boundary.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../../architect/component-boundary/component-boundary-advisory.md",
  "interimDestination": "../component-boundary.md",
  "newDestination": "../component-boundary.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/component-boundary.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "384cf74c699ef5f6013c9f975dd056844184697bba58784d2ad9b2154ce51d4a"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/component-boundary/component-boundary-advisory.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfRestored": false,
    "portalRetargeted": false,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-306: link-306

```json
{
  "id": "link-306",
  "original": {
    "path": "docs/platform/proposals/step-10-coding-domain-adoption.md",
    "inputLine": 584,
    "inputColumn": 4,
    "lineBeforeLinkPass": 584,
    "before": "[Component Authority Boundary Map](../../architect/proposals/component-authority-boundary-map.md)",
    "after": "[Component Authority Boundary Map](component-authority-boundary-map.md)",
    "legacyPath": "docs/architect/proposals/component-authority-boundary-map.md",
    "target": {
      "path": "docs/platform/proposals/component-authority-boundary-map.md",
      "anchor": null,
      "aliasId": "step10-proposals-redesigns-0130"
    },
    "portal": false,
    "area": "proposals",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/proposals/step-10-coding-domain-adoption.md",
    "line": 584,
    "legacy": "docs/architect/proposals/component-authority-boundary-map.md",
    "previous": "[Component Authority Boundary Map](component-authority-boundary-map.md)",
    "now": "component-authority-boundary-map.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../../architect/proposals/component-authority-boundary-map.md",
  "interimDestination": "component-authority-boundary-map.md",
  "newDestination": "component-authority-boundary-map.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/proposals/component-authority-boundary-map.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "28fbac96515c3d8c9eea0cff912ac88a04bb616802c1581fb30fee7aeff2b500"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/proposals/component-authority-boundary-map.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfRestored": false,
    "portalRetargeted": false,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-307: link-307

```json
{
  "id": "link-307",
  "original": {
    "path": "docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md",
    "inputLine": 24,
    "inputColumn": 22,
    "lineBeforeLinkPass": 24,
    "before": "[original source](../../architect/proposals/visibility-and-interactive-contact-herdr-spawn.md)",
    "after": "[original source](visibility-and-interactive-contact-herdr-spawn.md)",
    "legacyPath": "docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md",
    "target": {
      "path": "docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md",
      "anchor": null,
      "aliasId": "step10-proposals-redesigns-0860"
    },
    "portal": false,
    "area": "proposals",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md",
    "line": 24,
    "legacy": "docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md",
    "previous": "[original source](visibility-and-interactive-contact-herdr-spawn.md)",
    "now": "../../architect/proposals/visibility-and-interactive-contact-herdr-spawn.md",
    "action": "restored-legacy",
    "reason": "provenance/legacy-owner",
    "selfBefore": true,
    "portalBefore": false
  },
  "oldDestination": "../../architect/proposals/visibility-and-interactive-contact-herdr-spawn.md",
  "interimDestination": "visibility-and-interactive-contact-herdr-spawn.md",
  "newDestination": "../../architect/proposals/visibility-and-interactive-contact-herdr-spawn.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "9c45a9383a65bd4ee40738dfb6c7de39549e4d5efe079525e8e20dfd55b2c4ec"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md",
    "action": "restored-legacy",
    "reason": "provenance/legacy-owner",
    "selfRestored": true,
    "portalRetargeted": false,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-308: link-308

```json
{
  "id": "link-308",
  "original": {
    "path": "docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md",
    "inputLine": 34,
    "inputColumn": 10,
    "lineBeforeLinkPass": 34,
    "before": "[Visibility And Herdr](../../architect/agent-coordination/architecture/visibility-and-herdr.md)",
    "after": "[Visibility And Herdr](../agent-coordination/README.md)",
    "legacyPath": "docs/architect/agent-coordination/architecture/visibility-and-herdr.md",
    "target": {
      "path": "docs/platform/agent-coordination/README.md",
      "anchor": null,
      "aliasId": "step10-agent-coordination-0407"
    },
    "portal": false,
    "area": "proposals",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md",
    "line": 34,
    "legacy": "docs/architect/agent-coordination/architecture/visibility-and-herdr.md",
    "previous": "[Visibility And Herdr](../agent-coordination/README.md)",
    "now": "../agent-coordination/architecture/visibility-and-herdr.md",
    "action": "retargeted-specific",
    "reason": "specific-candidate",
    "selfBefore": false,
    "portalBefore": true
  },
  "oldDestination": "../../architect/agent-coordination/architecture/visibility-and-herdr.md",
  "interimDestination": "../agent-coordination/README.md",
  "newDestination": "../agent-coordination/architecture/visibility-and-herdr.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/agent-coordination/architecture/visibility-and-herdr.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "d7189aa5fcfd50500457ac1fab647dc687b58303153703a1c530fa63c38126f9"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/agent-coordination/architecture/visibility-and-herdr.md",
    "action": "retargeted-specific",
    "reason": "specific-candidate",
    "selfRestored": false,
    "portalRetargeted": true,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-309: link-309

```json
{
  "id": "link-309",
  "original": {
    "path": "docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md",
    "inputLine": 35,
    "inputColumn": 1,
    "lineBeforeLinkPass": 35,
    "before": "[Dispatch Control Plane](../../architect/agent-coordination/architecture/dispatch-control-plane.md)",
    "after": "[Dispatch Control Plane](../agent-coordination/README.md)",
    "legacyPath": "docs/architect/agent-coordination/architecture/dispatch-control-plane.md",
    "target": {
      "path": "docs/platform/agent-coordination/README.md",
      "anchor": null,
      "aliasId": "step10-agent-coordination-0122"
    },
    "portal": false,
    "area": "proposals",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md",
    "line": 35,
    "legacy": "docs/architect/agent-coordination/architecture/dispatch-control-plane.md",
    "previous": "[Dispatch Control Plane](../agent-coordination/README.md)",
    "now": "../agent-coordination/architecture/dispatch-control-plane.md",
    "action": "retargeted-specific",
    "reason": "specific-candidate",
    "selfBefore": false,
    "portalBefore": true
  },
  "oldDestination": "../../architect/agent-coordination/architecture/dispatch-control-plane.md",
  "interimDestination": "../agent-coordination/README.md",
  "newDestination": "../agent-coordination/architecture/dispatch-control-plane.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/agent-coordination/architecture/dispatch-control-plane.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "29a94c3bac47c039b65b9ab0879e5867de4035fe6962b27d33cf4957e9d4574d"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/agent-coordination/architecture/dispatch-control-plane.md",
    "action": "retargeted-specific",
    "reason": "specific-candidate",
    "selfRestored": false,
    "portalRetargeted": true,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-310: link-310

```json
{
  "id": "link-310",
  "original": {
    "path": "docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md",
    "inputLine": 36,
    "inputColumn": 1,
    "lineBeforeLinkPass": 36,
    "before": "[Coordination ↔ Dispatch contract](../../architect/proposals/coordination-dispatch-contract.md)",
    "after": "[Coordination ↔ Dispatch contract](coordination-dispatch-contract.md)",
    "legacyPath": "docs/architect/proposals/coordination-dispatch-contract.md",
    "target": {
      "path": "docs/platform/proposals/coordination-dispatch-contract.md",
      "anchor": null,
      "aliasId": "step10-proposals-redesigns-0323"
    },
    "portal": false,
    "area": "proposals",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md",
    "line": 36,
    "legacy": "docs/architect/proposals/coordination-dispatch-contract.md",
    "previous": "[Coordination ↔ Dispatch contract](coordination-dispatch-contract.md)",
    "now": "coordination-dispatch-contract.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../../architect/proposals/coordination-dispatch-contract.md",
  "interimDestination": "coordination-dispatch-contract.md",
  "newDestination": "coordination-dispatch-contract.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/proposals/coordination-dispatch-contract.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "9b58b9d781eb2dfd2a67aa8e635e0b02a9beede172d38325adedd7bbd68aa402"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/proposals/coordination-dispatch-contract.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfRestored": false,
    "portalRetargeted": false,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-311: link-311

```json
{
  "id": "link-311",
  "original": {
    "path": "docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md",
    "inputLine": 37,
    "inputColumn": 1,
    "lineBeforeLinkPass": 37,
    "before": "[Worker/provider/control boundary](../../architect/proposals/coordination-worker-provider-boundary.md)",
    "after": "[Worker/provider/control boundary](coordination-worker-provider-boundary.md)",
    "legacyPath": "docs/architect/proposals/coordination-worker-provider-boundary.md",
    "target": {
      "path": "docs/platform/proposals/coordination-worker-provider-boundary.md",
      "anchor": null,
      "aliasId": "step10-proposals-redesigns-0430"
    },
    "portal": false,
    "area": "proposals",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md",
    "line": 37,
    "legacy": "docs/architect/proposals/coordination-worker-provider-boundary.md",
    "previous": "[Worker/provider/control boundary](coordination-worker-provider-boundary.md)",
    "now": "coordination-worker-provider-boundary.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../../architect/proposals/coordination-worker-provider-boundary.md",
  "interimDestination": "coordination-worker-provider-boundary.md",
  "newDestination": "coordination-worker-provider-boundary.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/proposals/coordination-worker-provider-boundary.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "0f7a5b0db1cf1cb22c22fd0d270306af2e34010c48e09a651d1764c1b7e226f9"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/proposals/coordination-worker-provider-boundary.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfRestored": false,
    "portalRetargeted": false,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-312: link-312

```json
{
  "id": "link-312",
  "original": {
    "path": "docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md",
    "inputLine": 39,
    "inputColumn": 1,
    "lineBeforeLinkPass": 39,
    "before": "[Brainstorm 2026-08-27 (superseded)](../../architect/agent-coordination/history/brainstorms/agent-team-dispatch-and-herdr-stability-2026-08-27.md)",
    "after": "[Brainstorm 2026-08-27 (superseded)](../agent-coordination/history/brainstorms/agent-team-dispatch-and-herdr-stability-2026-08-27.md)",
    "legacyPath": "docs/architect/agent-coordination/history/brainstorms/agent-team-dispatch-and-herdr-stability-2026-08-27.md",
    "target": {
      "path": "docs/platform/agent-coordination/history/brainstorms/agent-team-dispatch-and-herdr-stability-2026-08-27.md",
      "anchor": null,
      "aliasId": "step10-agent-coordination-1043"
    },
    "portal": false,
    "area": "proposals",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md",
    "line": 39,
    "legacy": "docs/architect/agent-coordination/history/brainstorms/agent-team-dispatch-and-herdr-stability-2026-08-27.md",
    "previous": "[Brainstorm 2026-08-27 (superseded)](../agent-coordination/history/brainstorms/agent-team-dispatch-and-herdr-stability-2026-08-27.md)",
    "now": "../agent-coordination/history/brainstorms/agent-team-dispatch-and-herdr-stability-2026-08-27.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../../architect/agent-coordination/history/brainstorms/agent-team-dispatch-and-herdr-stability-2026-08-27.md",
  "interimDestination": "../agent-coordination/history/brainstorms/agent-team-dispatch-and-herdr-stability-2026-08-27.md",
  "newDestination": "../agent-coordination/history/brainstorms/agent-team-dispatch-and-herdr-stability-2026-08-27.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/agent-coordination/history/brainstorms/agent-team-dispatch-and-herdr-stability-2026-08-27.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "4564427d37a3233680d8407090063b3f3d13552612fed95bd5bbf473be8a535c"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/agent-coordination/history/brainstorms/agent-team-dispatch-and-herdr-stability-2026-08-27.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfRestored": false,
    "portalRetargeted": false,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-313: link-313

```json
{
  "id": "link-313",
  "original": {
    "path": "docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md",
    "inputLine": 517,
    "inputColumn": 744,
    "lineBeforeLinkPass": 517,
    "before": "[permission-posture-findings](../../architect/agent-coordination/verification/visibility-herdr/proofs/2026-09-06-isolation/permission-posture-findings.md)",
    "after": "[permission-posture-findings](../agent-coordination/verification/visibility-herdr/proofs/2026-09-06-isolation/permission-posture-findings.md)",
    "legacyPath": "docs/architect/agent-coordination/verification/visibility-herdr/proofs/2026-09-06-isolation/permission-posture-findings.md",
    "target": {
      "path": "docs/platform/agent-coordination/verification/visibility-herdr/proofs/2026-09-06-isolation/permission-posture-findings.md",
      "anchor": null,
      "aliasId": "step10-agent-coordination-4299"
    },
    "portal": false,
    "area": "proposals",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md",
    "line": 517,
    "legacy": "docs/architect/agent-coordination/verification/visibility-herdr/proofs/2026-09-06-isolation/permission-posture-findings.md",
    "previous": "[permission-posture-findings](../agent-coordination/verification/visibility-herdr/proofs/2026-09-06-isolation/permission-posture-findings.md)",
    "now": "../agent-coordination/verification/visibility-herdr/proofs/2026-09-06-isolation/permission-posture-findings.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../../architect/agent-coordination/verification/visibility-herdr/proofs/2026-09-06-isolation/permission-posture-findings.md",
  "interimDestination": "../agent-coordination/verification/visibility-herdr/proofs/2026-09-06-isolation/permission-posture-findings.md",
  "newDestination": "../agent-coordination/verification/visibility-herdr/proofs/2026-09-06-isolation/permission-posture-findings.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/agent-coordination/verification/visibility-herdr/proofs/2026-09-06-isolation/permission-posture-findings.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "403c52c47968ec432897ac8ba23c4bf74769830266bd9fbc2000f7f742d2409b"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/agent-coordination/verification/visibility-herdr/proofs/2026-09-06-isolation/permission-posture-findings.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfRestored": false,
    "portalRetargeted": false,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-314: link-314

```json
{
  "id": "link-314",
  "original": {
    "path": "docs/platform/runner/architecture/h-7af1f0242611.md",
    "inputLine": 54,
    "inputColumn": 240,
    "lineBeforeLinkPass": 54,
    "before": "[Dispatch Control Plane](../../../architect/agent-coordination/architecture/dispatch-control-plane.md)",
    "after": "[Dispatch Control Plane](../../agent-coordination/README.md)",
    "legacyPath": "docs/architect/agent-coordination/architecture/dispatch-control-plane.md",
    "target": {
      "path": "docs/platform/agent-coordination/README.md",
      "anchor": null,
      "aliasId": "step10-agent-coordination-0122"
    },
    "portal": false,
    "area": "runner",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/runner/architecture/h-7af1f0242611.md",
    "line": 54,
    "legacy": "docs/architect/agent-coordination/architecture/dispatch-control-plane.md",
    "previous": "[Dispatch Control Plane](../../agent-coordination/README.md)",
    "now": "../../agent-coordination/architecture/dispatch-control-plane.md",
    "action": "retargeted-specific",
    "reason": "specific-candidate",
    "selfBefore": false,
    "portalBefore": true
  },
  "oldDestination": "../../../architect/agent-coordination/architecture/dispatch-control-plane.md",
  "interimDestination": "../../agent-coordination/README.md",
  "newDestination": "../../agent-coordination/architecture/dispatch-control-plane.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/agent-coordination/architecture/dispatch-control-plane.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "29a94c3bac47c039b65b9ab0879e5867de4035fe6962b27d33cf4957e9d4574d"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/agent-coordination/architecture/dispatch-control-plane.md",
    "action": "retargeted-specific",
    "reason": "specific-candidate",
    "selfRestored": false,
    "portalRetargeted": true,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-315: link-315

```json
{
  "id": "link-315",
  "original": {
    "path": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "inputLine": 1561,
    "inputColumn": 174,
    "lineBeforeLinkPass": 1561,
    "before": "[confinement-authority.md §13.1](../../../specs/confinement-authority.md)",
    "after": "[confinement-authority.md §13.1](../../agent-confinement/README.md)",
    "legacyPath": "docs/specs/confinement-authority.md",
    "target": {
      "path": "docs/platform/agent-confinement/README.md",
      "anchor": null,
      "aliasId": "step10-specs-0001"
    },
    "portal": false,
    "area": "runner",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "line": 1561,
    "legacy": "docs/specs/confinement-authority.md",
    "previous": "[confinement-authority.md §13.1](../../agent-confinement/README.md)",
    "now": "../../agent-confinement/spec.md",
    "action": "retargeted-specific",
    "reason": "specific-candidate",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../../../specs/confinement-authority.md",
  "interimDestination": "../../agent-confinement/README.md",
  "newDestination": "../../agent-confinement/spec.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/agent-confinement/spec.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "36c3552767fdf9acd5748cf5d85861091cdb48688fc9ee8cbe1117a2995b38b9"
  },
  "referentPreservation": {
    "declaredReferent": "docs/specs/confinement-authority.md",
    "action": "retargeted-specific",
    "reason": "specific-candidate",
    "selfRestored": false,
    "portalRetargeted": false,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-316: link-316

```json
{
  "id": "link-316",
  "original": {
    "path": "docs/platform/system-architecture/architecture/architecture-intent.md",
    "inputLine": 61,
    "inputColumn": 1,
    "lineBeforeLinkPass": 61,
    "before": "[System Vision: Trong Mem Ngoai Cung](../../../architect/system-vision-trong-mem-ngoai-cung.md)",
    "after": "[System Vision: Trong Mem Ngoai Cung](system-vision-trong-mem-ngoai-cung.md)",
    "legacyPath": "docs/architect/system-vision-trong-mem-ngoai-cung.md",
    "target": {
      "path": "docs/platform/system-architecture/architecture/system-vision-trong-mem-ngoai-cung.md",
      "anchor": null,
      "aliasId": "step10-whole-system-1321"
    },
    "portal": false,
    "area": "system-architecture",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/system-architecture/architecture/architecture-intent.md",
    "line": 61,
    "legacy": "docs/architect/system-vision-trong-mem-ngoai-cung.md",
    "previous": "[System Vision: Trong Mem Ngoai Cung](system-vision-trong-mem-ngoai-cung.md)",
    "now": "system-vision-trong-mem-ngoai-cung.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../../../architect/system-vision-trong-mem-ngoai-cung.md",
  "interimDestination": "system-vision-trong-mem-ngoai-cung.md",
  "newDestination": "system-vision-trong-mem-ngoai-cung.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/system-architecture/architecture/system-vision-trong-mem-ngoai-cung.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "50099b7a34e0f160bb9d5a8bb56527531ef747a31cca021302eae981d9e05a99"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/system-vision-trong-mem-ngoai-cung.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfRestored": false,
    "portalRetargeted": false,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-317: link-317

```json
{
  "id": "link-317",
  "original": {
    "path": "docs/platform/system-architecture/architecture/architecture-intent.md",
    "inputLine": 699,
    "inputColumn": 1,
    "lineBeforeLinkPass": 699,
    "before": "[Step 09 - Group Thinking Substrate](../../../architect/proposals/step-09-group-thinking-substrate.md)",
    "after": "[Step 09 - Group Thinking Substrate](../../proposals/step-09-group-thinking-substrate.md)",
    "legacyPath": "docs/architect/proposals/step-09-group-thinking-substrate.md",
    "target": {
      "path": "docs/platform/proposals/step-09-group-thinking-substrate.md",
      "anchor": null,
      "aliasId": "step10-proposals-redesigns-0509"
    },
    "portal": false,
    "area": "system-architecture",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/system-architecture/architecture/architecture-intent.md",
    "line": 699,
    "legacy": "docs/architect/proposals/step-09-group-thinking-substrate.md",
    "previous": "[Step 09 - Group Thinking Substrate](../../proposals/step-09-group-thinking-substrate.md)",
    "now": "../../proposals/step-09-group-thinking-substrate.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../../../architect/proposals/step-09-group-thinking-substrate.md",
  "interimDestination": "../../proposals/step-09-group-thinking-substrate.md",
  "newDestination": "../../proposals/step-09-group-thinking-substrate.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/proposals/step-09-group-thinking-substrate.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "002c0b30a6d7073a8ad136907b5462d1150abbafa841697028bfa1f0e64be41f"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/proposals/step-09-group-thinking-substrate.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfRestored": false,
    "portalRetargeted": false,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-318: link-318

```json
{
  "id": "link-318",
  "original": {
    "path": "docs/platform/system-architecture/architecture/workspace-topology-audit.md",
    "inputLine": 29,
    "inputColumn": 15,
    "lineBeforeLinkPass": 29,
    "before": "[workspace-topology.md](../../../architect/workspace-topology.md)",
    "after": "[workspace-topology.md](workspace-topology.md)",
    "legacyPath": "docs/architect/workspace-topology.md",
    "target": {
      "path": "docs/platform/system-architecture/architecture/workspace-topology.md",
      "anchor": null,
      "aliasId": "step10-whole-system-1458"
    },
    "portal": false,
    "area": "system-architecture",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/system-architecture/architecture/workspace-topology-audit.md",
    "line": 29,
    "legacy": "docs/architect/workspace-topology.md",
    "previous": "[workspace-topology.md](workspace-topology.md)",
    "now": "workspace-topology.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../../../architect/workspace-topology.md",
  "interimDestination": "workspace-topology.md",
  "newDestination": "workspace-topology.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/system-architecture/architecture/workspace-topology.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "441108da9c93fa071b4065319c40562ab44d410b714fe0140252a26280a4c15e"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/workspace-topology.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfRestored": false,
    "portalRetargeted": false,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-319: link-319

```json
{
  "id": "link-319",
  "original": {
    "path": "docs/platform/system-architecture/architecture/workspace-topology-roadmap.md",
    "inputLine": 26,
    "inputColumn": 36,
    "lineBeforeLinkPass": 26,
    "before": "[workspace-topology.md](../../../architect/workspace-topology.md)",
    "after": "[workspace-topology.md](workspace-topology.md)",
    "legacyPath": "docs/architect/workspace-topology.md",
    "target": {
      "path": "docs/platform/system-architecture/architecture/workspace-topology.md",
      "anchor": null,
      "aliasId": "step10-whole-system-1458"
    },
    "portal": false,
    "area": "system-architecture",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/system-architecture/architecture/workspace-topology-roadmap.md",
    "line": 26,
    "legacy": "docs/architect/workspace-topology.md",
    "previous": "[workspace-topology.md](workspace-topology.md)",
    "now": "workspace-topology.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../../../architect/workspace-topology.md",
  "interimDestination": "workspace-topology.md",
  "newDestination": "workspace-topology.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/system-architecture/architecture/workspace-topology.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "441108da9c93fa071b4065319c40562ab44d410b714fe0140252a26280a4c15e"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/workspace-topology.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfRestored": false,
    "portalRetargeted": false,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-320: link-320

```json
{
  "id": "link-320",
  "original": {
    "path": "docs/platform/system-architecture/architecture/workspace-topology-roadmap.md",
    "inputLine": 31,
    "inputColumn": 1,
    "lineBeforeLinkPass": 31,
    "before": "[workspace-topology.md](../../../architect/workspace-topology.md)",
    "after": "[workspace-topology.md](workspace-topology.md)",
    "legacyPath": "docs/architect/workspace-topology.md",
    "target": {
      "path": "docs/platform/system-architecture/architecture/workspace-topology.md",
      "anchor": null,
      "aliasId": "step10-whole-system-1458"
    },
    "portal": false,
    "area": "system-architecture",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/system-architecture/architecture/workspace-topology-roadmap.md",
    "line": 31,
    "legacy": "docs/architect/workspace-topology.md",
    "previous": "[workspace-topology.md](workspace-topology.md)",
    "now": "workspace-topology.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../../../architect/workspace-topology.md",
  "interimDestination": "workspace-topology.md",
  "newDestination": "workspace-topology.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/system-architecture/architecture/workspace-topology.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "441108da9c93fa071b4065319c40562ab44d410b714fe0140252a26280a4c15e"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/workspace-topology.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfRestored": false,
    "portalRetargeted": false,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-321: link-321

```json
{
  "id": "link-321",
  "original": {
    "path": "docs/platform/system-architecture/architecture/workspace-topology-roadmap.md",
    "inputLine": 32,
    "inputColumn": 1,
    "lineBeforeLinkPass": 32,
    "before": "[workspace-topology-audit.md](../../../architect/workspace-topology-audit.md)",
    "after": "[workspace-topology-audit.md](workspace-topology-audit.md)",
    "legacyPath": "docs/architect/workspace-topology-audit.md",
    "target": {
      "path": "docs/platform/system-architecture/architecture/workspace-topology-audit.md",
      "anchor": null,
      "aliasId": "step10-whole-system-1353"
    },
    "portal": false,
    "area": "system-architecture",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/system-architecture/architecture/workspace-topology-roadmap.md",
    "line": 32,
    "legacy": "docs/architect/workspace-topology-audit.md",
    "previous": "[workspace-topology-audit.md](workspace-topology-audit.md)",
    "now": "workspace-topology-audit.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../../../architect/workspace-topology-audit.md",
  "interimDestination": "workspace-topology-audit.md",
  "newDestination": "workspace-topology-audit.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/system-architecture/architecture/workspace-topology-audit.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "9ee4f29458ce8631cb9df0818b3d27ef17d715ea18f631248676e868ccd4f8c0"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/workspace-topology-audit.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfRestored": false,
    "portalRetargeted": false,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-322: link-322

```json
{
  "id": "link-322",
  "original": {
    "path": "docs/platform/system-architecture/architecture/workspace-topology.md",
    "inputLine": 46,
    "inputColumn": 3,
    "lineBeforeLinkPass": 46,
    "before": "[workspace-topology-audit.md](../../../architect/workspace-topology-audit.md)",
    "after": "[workspace-topology-audit.md](workspace-topology-audit.md)",
    "legacyPath": "docs/architect/workspace-topology-audit.md",
    "target": {
      "path": "docs/platform/system-architecture/architecture/workspace-topology-audit.md",
      "anchor": null,
      "aliasId": "step10-whole-system-1353"
    },
    "portal": false,
    "area": "system-architecture",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/system-architecture/architecture/workspace-topology.md",
    "line": 46,
    "legacy": "docs/architect/workspace-topology-audit.md",
    "previous": "[workspace-topology-audit.md](workspace-topology-audit.md)",
    "now": "workspace-topology-audit.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../../../architect/workspace-topology-audit.md",
  "interimDestination": "workspace-topology-audit.md",
  "newDestination": "workspace-topology-audit.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/system-architecture/architecture/workspace-topology-audit.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "9ee4f29458ce8631cb9df0818b3d27ef17d715ea18f631248676e868ccd4f8c0"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/workspace-topology-audit.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfRestored": false,
    "portalRetargeted": false,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-323: link-323

```json
{
  "id": "link-323",
  "original": {
    "path": "docs/platform/system-architecture/architecture/workspace-topology.md",
    "inputLine": 48,
    "inputColumn": 3,
    "lineBeforeLinkPass": 48,
    "before": "[workspace-topology-roadmap.md](../../../architect/workspace-topology-roadmap.md)",
    "after": "[workspace-topology-roadmap.md](workspace-topology-roadmap.md)",
    "legacyPath": "docs/architect/workspace-topology-roadmap.md",
    "target": {
      "path": "docs/platform/system-architecture/architecture/workspace-topology-roadmap.md",
      "anchor": null,
      "aliasId": "step10-whole-system-1409"
    },
    "portal": false,
    "area": "system-architecture",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/system-architecture/architecture/workspace-topology.md",
    "line": 48,
    "legacy": "docs/architect/workspace-topology-roadmap.md",
    "previous": "[workspace-topology-roadmap.md](workspace-topology-roadmap.md)",
    "now": "workspace-topology-roadmap.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../../../architect/workspace-topology-roadmap.md",
  "interimDestination": "workspace-topology-roadmap.md",
  "newDestination": "workspace-topology-roadmap.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/system-architecture/architecture/workspace-topology-roadmap.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "6ecd6c1b15d31fde295f8c16995661ed0d381b61dd926608c205c10449555577"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/workspace-topology-roadmap.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfRestored": false,
    "portalRetargeted": false,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-324: link-324

```json
{
  "id": "link-324",
  "original": {
    "path": "docs/platform/vision.md",
    "inputLine": 91,
    "inputColumn": 30,
    "lineBeforeLinkPass": 91,
    "before": "[../doc-governance.md](../doc-governance.md)",
    "after": "[../doc-governance.md](governance.md)",
    "legacyPath": "docs/doc-governance.md",
    "target": {
      "path": "docs/platform/governance.md",
      "anchor": null,
      "aliasId": "root-authorities-draft-0011"
    },
    "portal": false,
    "area": "platform-root",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/vision.md",
    "line": 91,
    "legacy": "docs/doc-governance.md",
    "previous": "[../doc-governance.md](governance.md)",
    "now": "governance.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../doc-governance.md",
  "interimDestination": "governance.md",
  "newDestination": "governance.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/governance.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "e46993268dd1af708a277904df42e1fb5c5fcce8809a56b30e5f958732563a82"
  },
  "referentPreservation": {
    "declaredReferent": "docs/doc-governance.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfRestored": false,
    "portalRetargeted": false,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-325: link-325

```json
{
  "id": "link-325",
  "original": {
    "path": "docs/platform/vision.md",
    "inputLine": 92,
    "inputColumn": 28,
    "lineBeforeLinkPass": 92,
    "before": "[../platform-foundations.md](../platform-foundations.md)",
    "after": "[../platform-foundations.md](platform-foundations.md)",
    "legacyPath": "docs/platform-foundations.md",
    "target": {
      "path": "docs/platform/platform-foundations.md",
      "anchor": null,
      "aliasId": "root-authorities-draft-0047"
    },
    "portal": false,
    "area": "platform-root",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/vision.md",
    "line": 92,
    "legacy": "docs/platform-foundations.md",
    "previous": "[../platform-foundations.md](platform-foundations.md)",
    "now": "platform-foundations.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../platform-foundations.md",
  "interimDestination": "platform-foundations.md",
  "newDestination": "platform-foundations.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/platform-foundations.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "1cfda337e23e4b5f8a5f1a6cf65346f553a1668c49888ab7b44df02595412223"
  },
  "referentPreservation": {
    "declaredReferent": "docs/platform-foundations.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfRestored": false,
    "portalRetargeted": false,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-326: link-326

```json
{
  "id": "link-326",
  "original": {
    "path": "docs/platform/work-state/architecture/implementation-pointers.md",
    "inputLine": 50,
    "inputColumn": 3,
    "lineBeforeLinkPass": 58,
    "before": "[Legacy source: docs/specs/work-state.md](../../../specs/work-state.md)",
    "after": "[Legacy source: docs/specs/work-state.md](../README.md)",
    "legacyPath": "docs/specs/work-state.md",
    "target": {
      "path": "docs/platform/work-state/README.md",
      "anchor": null,
      "aliasId": "root-authorities-draft-0073"
    },
    "portal": false,
    "area": "work-state",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/work-state/architecture/implementation-pointers.md",
    "line": 58,
    "legacy": "docs/specs/work-state.md",
    "previous": "[Legacy source: docs/specs/work-state.md](../README.md)",
    "now": "../../../specs/work-state.md",
    "action": "restored-legacy",
    "reason": "provenance/legacy-owner",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../../../specs/work-state.md",
  "interimDestination": "../README.md",
  "newDestination": "../../../specs/work-state.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/specs/work-state.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "aa7f9f1041531a918c58cdf5f41995a257c5ec8c353d4237a21096d24b60eef0"
  },
  "referentPreservation": {
    "declaredReferent": "docs/specs/work-state.md",
    "action": "restored-legacy",
    "reason": "provenance/legacy-owner",
    "selfRestored": false,
    "portalRetargeted": false,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-327: link-327

```json
{
  "id": "link-327",
  "original": {
    "path": "docs/platform/work-state/contracts/cli-io-contract.md",
    "inputLine": 430,
    "inputColumn": 3,
    "lineBeforeLinkPass": 438,
    "before": "[Legacy source: docs/specs/work-state.md](../../../specs/work-state.md)",
    "after": "[Legacy source: docs/specs/work-state.md](../README.md)",
    "legacyPath": "docs/specs/work-state.md",
    "target": {
      "path": "docs/platform/work-state/README.md",
      "anchor": null,
      "aliasId": "root-authorities-draft-0073"
    },
    "portal": false,
    "area": "work-state",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/work-state/contracts/cli-io-contract.md",
    "line": 438,
    "legacy": "docs/specs/work-state.md",
    "previous": "[Legacy source: docs/specs/work-state.md](../README.md)",
    "now": "../../../specs/work-state.md",
    "action": "restored-legacy",
    "reason": "provenance/legacy-owner",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../../../specs/work-state.md",
  "interimDestination": "../README.md",
  "newDestination": "../../../specs/work-state.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/specs/work-state.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "aa7f9f1041531a918c58cdf5f41995a257c5ec8c353d4237a21096d24b60eef0"
  },
  "referentPreservation": {
    "declaredReferent": "docs/specs/work-state.md",
    "action": "restored-legacy",
    "reason": "provenance/legacy-owner",
    "selfRestored": false,
    "portalRetargeted": false,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-328: link-328

```json
{
  "id": "link-328",
  "original": {
    "path": "docs/platform/work-state/contracts/cli-io-contract.md",
    "inputLine": 431,
    "inputColumn": 3,
    "lineBeforeLinkPass": 439,
    "before": "[Legacy source: docs/io-contract.md](../../../io-contract.md)",
    "after": "[Legacy source: docs/io-contract.md](cli-io-contract.md)",
    "legacyPath": "docs/io-contract.md",
    "target": {
      "path": "docs/platform/work-state/contracts/cli-io-contract.md",
      "anchor": null,
      "aliasId": "root-authorities-draft-0027"
    },
    "portal": false,
    "area": "work-state",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/work-state/contracts/cli-io-contract.md",
    "line": 439,
    "legacy": "docs/io-contract.md",
    "previous": "[Legacy source: docs/io-contract.md](cli-io-contract.md)",
    "now": "../../../io-contract.md",
    "action": "restored-legacy",
    "reason": "provenance/legacy-owner",
    "selfBefore": true,
    "portalBefore": false
  },
  "oldDestination": "../../../io-contract.md",
  "interimDestination": "cli-io-contract.md",
  "newDestination": "../../../io-contract.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/io-contract.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "a5ad416f2aa2337c7dc0bb3f65ec5b3f1149b0a9a9d6731f62edabea17ad4f94"
  },
  "referentPreservation": {
    "declaredReferent": "docs/io-contract.md",
    "action": "restored-legacy",
    "reason": "provenance/legacy-owner",
    "selfRestored": true,
    "portalRetargeted": false,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-329: link-329

```json
{
  "id": "link-329",
  "original": {
    "path": "docs/platform/work-state/spec.md",
    "inputLine": 1195,
    "inputColumn": 3,
    "lineBeforeLinkPass": 1203,
    "before": "[docs/specs/work-state.md](../../specs/work-state.md)",
    "after": "[docs/specs/work-state.md](README.md)",
    "legacyPath": "docs/specs/work-state.md",
    "target": {
      "path": "docs/platform/work-state/README.md",
      "anchor": null,
      "aliasId": "root-authorities-draft-0073"
    },
    "portal": false,
    "area": "work-state",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/work-state/spec.md",
    "line": 1203,
    "legacy": "docs/specs/work-state.md",
    "previous": "[docs/specs/work-state.md](README.md)",
    "now": "../../specs/work-state.md",
    "action": "restored-legacy",
    "reason": "self-link",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../../specs/work-state.md",
  "interimDestination": "README.md",
  "newDestination": "../../specs/work-state.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/specs/work-state.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "aa7f9f1041531a918c58cdf5f41995a257c5ec8c353d4237a21096d24b60eef0"
  },
  "referentPreservation": {
    "declaredReferent": "docs/specs/work-state.md",
    "action": "restored-legacy",
    "reason": "self-link",
    "selfRestored": false,
    "portalRetargeted": false,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-330: link-330

```json
{
  "id": "link-330",
  "original": {
    "path": "docs/platform/work-state/spec.md",
    "inputLine": 1196,
    "inputColumn": 3,
    "lineBeforeLinkPass": 1204,
    "before": "[docs/io-contract.md](../../io-contract.md)",
    "after": "[docs/io-contract.md](contracts/cli-io-contract.md)",
    "legacyPath": "docs/io-contract.md",
    "target": {
      "path": "docs/platform/work-state/contracts/cli-io-contract.md",
      "anchor": null,
      "aliasId": "root-authorities-draft-0027"
    },
    "portal": false,
    "area": "work-state",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/work-state/spec.md",
    "line": 1204,
    "legacy": "docs/io-contract.md",
    "previous": "[docs/io-contract.md](contracts/cli-io-contract.md)",
    "now": "contracts/cli-io-contract.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../../io-contract.md",
  "interimDestination": "contracts/cli-io-contract.md",
  "newDestination": "contracts/cli-io-contract.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/work-state/contracts/cli-io-contract.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "6429c273f0257b487708d9d6c126826b550b26d7ba97b1c929f8174bbc28de0c"
  },
  "referentPreservation": {
    "declaredReferent": "docs/io-contract.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfRestored": false,
    "portalRetargeted": false,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-331: link-331

```json
{
  "id": "link-331",
  "original": {
    "path": "docs/platform/README.md",
    "inputLine": 30,
    "inputColumn": 82,
    "lineBeforeLinkPass": 32,
    "before": "[../platform-foundations.md](../platform-foundations.md)",
    "after": "[../platform-foundations.md](platform-foundations.md)",
    "legacyPath": "docs/platform-foundations.md",
    "target": {
      "path": "docs/platform/platform-foundations.md",
      "anchor": null,
      "aliasId": "root-authorities-draft-0047"
    },
    "portal": true,
    "area": "platform-root",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/README.md",
    "line": 32,
    "legacy": "docs/platform-foundations.md",
    "previous": "[../platform-foundations.md](platform-foundations.md)",
    "now": "../platform-foundations.md",
    "action": "restored-legacy",
    "reason": "provenance/legacy-owner",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../platform-foundations.md",
  "interimDestination": "platform-foundations.md",
  "newDestination": "../platform-foundations.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform-foundations.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "22636a8d5d3314242428e7bad1e8f1196dec7548b17dc5c8b0d0ae15525e6fa4"
  },
  "referentPreservation": {
    "declaredReferent": "docs/platform-foundations.md",
    "action": "restored-legacy",
    "reason": "provenance/legacy-owner",
    "selfRestored": false,
    "portalRetargeted": false,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-332: link-332

```json
{
  "id": "link-332",
  "original": {
    "path": "docs/platform/README.md",
    "inputLine": 31,
    "inputColumn": 175,
    "lineBeforeLinkPass": 33,
    "before": "[../architect/agent-coordination/intent-preservation-ledger.md](../architect/agent-coordination/intent-preservation-ledger.md)",
    "after": "[../architect/agent-coordination/intent-preservation-ledger.md](agent-coordination/README.md)",
    "legacyPath": "docs/architect/agent-coordination/intent-preservation-ledger.md",
    "target": {
      "path": "docs/platform/agent-coordination/README.md",
      "anchor": null,
      "aliasId": "step10-agent-coordination-1148"
    },
    "portal": true,
    "area": "platform-root",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/README.md",
    "line": 33,
    "legacy": "docs/architect/agent-coordination/intent-preservation-ledger.md",
    "previous": "[../architect/agent-coordination/intent-preservation-ledger.md](agent-coordination/README.md)",
    "now": "../architect/agent-coordination/intent-preservation-ledger.md",
    "action": "restored-legacy",
    "reason": "provenance/legacy-owner",
    "selfBefore": false,
    "portalBefore": true
  },
  "oldDestination": "../architect/agent-coordination/intent-preservation-ledger.md",
  "interimDestination": "agent-coordination/README.md",
  "newDestination": "../architect/agent-coordination/intent-preservation-ledger.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/architect/agent-coordination/intent-preservation-ledger.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "1a0a6e7df11d09006c8679a467a85f0f8c0d8f0ad08bb11b3fbea6080b312db0"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/agent-coordination/intent-preservation-ledger.md",
    "action": "restored-legacy",
    "reason": "provenance/legacy-owner",
    "selfRestored": false,
    "portalRetargeted": false,
    "portalRestored": true,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-333: link-333

```json
{
  "id": "link-333",
  "original": {
    "path": "docs/platform/README.md",
    "inputLine": 32,
    "inputColumn": 96,
    "lineBeforeLinkPass": 34,
    "before": "[../platform-foundations.md](../platform-foundations.md)",
    "after": "[../platform-foundations.md](platform-foundations.md)",
    "legacyPath": "docs/platform-foundations.md",
    "target": {
      "path": "docs/platform/platform-foundations.md",
      "anchor": null,
      "aliasId": "root-authorities-draft-0047"
    },
    "portal": true,
    "area": "platform-root",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/README.md",
    "line": 34,
    "legacy": "docs/platform-foundations.md",
    "previous": "[../platform-foundations.md](platform-foundations.md)",
    "now": "../platform-foundations.md",
    "action": "restored-legacy",
    "reason": "provenance/legacy-owner",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../platform-foundations.md",
  "interimDestination": "platform-foundations.md",
  "newDestination": "../platform-foundations.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform-foundations.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "22636a8d5d3314242428e7bad1e8f1196dec7548b17dc5c8b0d0ae15525e6fa4"
  },
  "referentPreservation": {
    "declaredReferent": "docs/platform-foundations.md",
    "action": "restored-legacy",
    "reason": "provenance/legacy-owner",
    "selfRestored": false,
    "portalRetargeted": false,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-334: link-334

```json
{
  "id": "link-334",
  "original": {
    "path": "docs/platform/README.md",
    "inputLine": 33,
    "inputColumn": 80,
    "lineBeforeLinkPass": 35,
    "before": "[../architecture-map.md](../architecture-map.md)",
    "after": "[../architecture-map.md](architecture-map.md)",
    "legacyPath": "docs/architecture-map.md",
    "target": {
      "path": "docs/platform/architecture-map.md",
      "anchor": null,
      "aliasId": "step10-whole-system-1520"
    },
    "portal": true,
    "area": "platform-root",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/README.md",
    "line": 35,
    "legacy": "docs/architecture-map.md",
    "previous": "[../architecture-map.md](architecture-map.md)",
    "now": "../architecture-map.md",
    "action": "restored-legacy",
    "reason": "provenance/legacy-owner",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../architecture-map.md",
  "interimDestination": "architecture-map.md",
  "newDestination": "../architecture-map.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/architecture-map.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "d70414923eaeaf0dd34c4e260d4c4a8cf0cf58b517f417fb03a0c2b0fe74de9a"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architecture-map.md",
    "action": "restored-legacy",
    "reason": "provenance/legacy-owner",
    "selfRestored": false,
    "portalRetargeted": false,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-335: link-335

```json
{
  "id": "link-335",
  "original": {
    "path": "docs/platform/README.md",
    "inputLine": 35,
    "inputColumn": 76,
    "lineBeforeLinkPass": 37,
    "before": "[../routing-handoff-contract.md](../routing-handoff-contract.md)",
    "after": "[../routing-handoff-contract.md](runner/contracts/routing-handoff.md)",
    "legacyPath": "docs/routing-handoff-contract.md",
    "target": {
      "path": "docs/platform/runner/contracts/routing-handoff.md",
      "anchor": null,
      "aliasId": "root-authorities-draft-0066"
    },
    "portal": true,
    "area": "platform-root",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/README.md",
    "line": 37,
    "legacy": "docs/routing-handoff-contract.md",
    "previous": "[../routing-handoff-contract.md](runner/contracts/routing-handoff.md)",
    "now": "../routing-handoff-contract.md",
    "action": "restored-legacy",
    "reason": "provenance/legacy-owner",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../routing-handoff-contract.md",
  "interimDestination": "runner/contracts/routing-handoff.md",
  "newDestination": "../routing-handoff-contract.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/routing-handoff-contract.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "535dd0f61113aab54dcc9637c9f19ef5eb409a21fe515feddbae239a33ec1e81"
  },
  "referentPreservation": {
    "declaredReferent": "docs/routing-handoff-contract.md",
    "action": "restored-legacy",
    "reason": "provenance/legacy-owner",
    "selfRestored": false,
    "portalRetargeted": false,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-336: link-336

```json
{
  "id": "link-336",
  "original": {
    "path": "docs/platform/README.md",
    "inputLine": 43,
    "inputColumn": 14,
    "lineBeforeLinkPass": 45,
    "before": "[../specs/runner.md](../specs/runner.md)",
    "after": "[../specs/runner.md](runner/README.md)",
    "legacyPath": "docs/specs/runner.md",
    "target": {
      "path": "docs/platform/runner/README.md",
      "anchor": null,
      "aliasId": "step10-runner-0001"
    },
    "portal": true,
    "area": "platform-root",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/README.md",
    "line": 45,
    "legacy": "docs/specs/runner.md",
    "previous": "[../specs/runner.md](runner/README.md)",
    "now": "../specs/runner.md",
    "action": "restored-legacy",
    "reason": "provenance/legacy-owner",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../specs/runner.md",
  "interimDestination": "runner/README.md",
  "newDestination": "../specs/runner.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/specs/runner.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "aaa47cf8f918131a1da8970de3a957ac7761cd560a3f6bf6a22531163561694d"
  },
  "referentPreservation": {
    "declaredReferent": "docs/specs/runner.md",
    "action": "restored-legacy",
    "reason": "provenance/legacy-owner",
    "selfRestored": false,
    "portalRetargeted": false,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-337: link-337

```json
{
  "id": "link-337",
  "original": {
    "path": "docs/platform/README.md",
    "inputLine": 44,
    "inputColumn": 18,
    "lineBeforeLinkPass": 46,
    "before": "[../specs/work-state.md](../specs/work-state.md)",
    "after": "[../specs/work-state.md](work-state/README.md)",
    "legacyPath": "docs/specs/work-state.md",
    "target": {
      "path": "docs/platform/work-state/README.md",
      "anchor": null,
      "aliasId": "root-authorities-draft-0073"
    },
    "portal": true,
    "area": "platform-root",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/README.md",
    "line": 46,
    "legacy": "docs/specs/work-state.md",
    "previous": "[../specs/work-state.md](work-state/README.md)",
    "now": "../specs/work-state.md",
    "action": "restored-legacy",
    "reason": "provenance/legacy-owner",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../specs/work-state.md",
  "interimDestination": "work-state/README.md",
  "newDestination": "../specs/work-state.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/specs/work-state.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "aa7f9f1041531a918c58cdf5f41995a257c5ec8c353d4237a21096d24b60eef0"
  },
  "referentPreservation": {
    "declaredReferent": "docs/specs/work-state.md",
    "action": "restored-legacy",
    "reason": "provenance/legacy-owner",
    "selfRestored": false,
    "portalRetargeted": false,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-338: link-338

```json
{
  "id": "link-338",
  "original": {
    "path": "docs/platform/README.md",
    "inputLine": 45,
    "inputColumn": 134,
    "lineBeforeLinkPass": 47,
    "before": "[../specs/distribution.md](../specs/distribution.md)",
    "after": "[../specs/distribution.md](packaging-distribution/README.md)",
    "legacyPath": "docs/specs/distribution.md",
    "target": {
      "path": "docs/platform/packaging-distribution/README.md",
      "anchor": null,
      "aliasId": "step10-specs-0245"
    },
    "portal": true,
    "area": "platform-root",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/README.md",
    "line": 47,
    "legacy": "docs/specs/distribution.md",
    "previous": "[../specs/distribution.md](packaging-distribution/README.md)",
    "now": "../specs/distribution.md",
    "action": "restored-legacy",
    "reason": "provenance/legacy-owner",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../specs/distribution.md",
  "interimDestination": "packaging-distribution/README.md",
  "newDestination": "../specs/distribution.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/specs/distribution.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "2ef299b2024b6918d125df02042b9e3a157eacbb8afd10a91e028d7a19d36ae3"
  },
  "referentPreservation": {
    "declaredReferent": "docs/specs/distribution.md",
    "action": "restored-legacy",
    "reason": "provenance/legacy-owner",
    "selfRestored": false,
    "portalRetargeted": false,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-339: link-339

```json
{
  "id": "link-339",
  "original": {
    "path": "docs/platform/README.md",
    "inputLine": 66,
    "inputColumn": 74,
    "lineBeforeLinkPass": 68,
    "before": "[../transitional-switchboard.md](../transitional-switchboard.md)",
    "after": "[../transitional-switchboard.md](documentation/switchboard.md)",
    "legacyPath": "docs/transitional-switchboard.md",
    "target": {
      "path": "docs/platform/documentation/switchboard.md",
      "anchor": null,
      "aliasId": "root-authorities-draft-0310"
    },
    "portal": true,
    "area": "platform-root",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/README.md",
    "line": 68,
    "legacy": "docs/transitional-switchboard.md",
    "previous": "[../transitional-switchboard.md](documentation/switchboard.md)",
    "now": "documentation/switchboard.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../transitional-switchboard.md",
  "interimDestination": "documentation/switchboard.md",
  "newDestination": "documentation/switchboard.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/documentation/switchboard.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "f58542c47377976500986df9364802e7c4d58709467c93775dff1cb8fd2e9886"
  },
  "referentPreservation": {
    "declaredReferent": "docs/transitional-switchboard.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfRestored": false,
    "portalRetargeted": false,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-340: link-340

```json
{
  "id": "link-340",
  "original": {
    "path": "docs/platform/README.md",
    "inputLine": 78,
    "inputColumn": 18,
    "lineBeforeLinkPass": 80,
    "before": "[../doc-governance.md](../doc-governance.md)",
    "after": "[../doc-governance.md](governance.md)",
    "legacyPath": "docs/doc-governance.md",
    "target": {
      "path": "docs/platform/governance.md",
      "anchor": null,
      "aliasId": "root-authorities-draft-0011"
    },
    "portal": true,
    "area": "platform-root",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/README.md",
    "line": 80,
    "legacy": "docs/doc-governance.md",
    "previous": "[../doc-governance.md](governance.md)",
    "now": "governance.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../doc-governance.md",
  "interimDestination": "governance.md",
  "newDestination": "governance.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/governance.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "e46993268dd1af708a277904df42e1fb5c5fcce8809a56b30e5f958732563a82"
  },
  "referentPreservation": {
    "declaredReferent": "docs/doc-governance.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfRestored": false,
    "portalRetargeted": false,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-341: link-341

```json
{
  "id": "link-341",
  "original": {
    "path": "docs/platform/README.md",
    "inputLine": 79,
    "inputColumn": 40,
    "lineBeforeLinkPass": 81,
    "before": "[../transitional-switchboard.md](../transitional-switchboard.md)",
    "after": "[../transitional-switchboard.md](documentation/switchboard.md)",
    "legacyPath": "docs/transitional-switchboard.md",
    "target": {
      "path": "docs/platform/documentation/switchboard.md",
      "anchor": null,
      "aliasId": "root-authorities-draft-0310"
    },
    "portal": true,
    "area": "platform-root",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/README.md",
    "line": 81,
    "legacy": "docs/transitional-switchboard.md",
    "previous": "[../transitional-switchboard.md](documentation/switchboard.md)",
    "now": "documentation/switchboard.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../transitional-switchboard.md",
  "interimDestination": "documentation/switchboard.md",
  "newDestination": "documentation/switchboard.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/documentation/switchboard.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "f58542c47377976500986df9364802e7c4d58709467c93775dff1cb8fd2e9886"
  },
  "referentPreservation": {
    "declaredReferent": "docs/transitional-switchboard.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfRestored": false,
    "portalRetargeted": false,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-342: link-342

```json
{
  "id": "link-342",
  "original": {
    "path": "docs/platform/agent-coordination/README.md",
    "inputLine": 31,
    "inputColumn": 6,
    "lineBeforeLinkPass": 31,
    "before": "[the runner spec](../../specs/runner.md)",
    "after": "[the runner spec](../runner/README.md)",
    "legacyPath": "docs/specs/runner.md",
    "target": {
      "path": "docs/platform/runner/README.md",
      "anchor": null,
      "aliasId": "step10-runner-0001"
    },
    "portal": true,
    "area": "agent-coordination",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/agent-coordination/README.md",
    "line": 31,
    "legacy": "docs/specs/runner.md",
    "previous": "[the runner spec](../runner/README.md)",
    "now": "../runner/spec.md",
    "action": "retargeted-specific",
    "reason": "specific-candidate",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../../specs/runner.md",
  "interimDestination": "../runner/README.md",
  "newDestination": "../runner/spec.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/runner/spec.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "08e31cdc6154f86851fc7985b39ab4e1695be9bd46b5320517f4bccf48bfc69a"
  },
  "referentPreservation": {
    "declaredReferent": "docs/specs/runner.md",
    "action": "retargeted-specific",
    "reason": "specific-candidate",
    "selfRestored": false,
    "portalRetargeted": false,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-343: link-343

```json
{
  "id": "link-343",
  "original": {
    "path": "docs/platform/agent-coordination/proposals/README.md",
    "inputLine": 62,
    "inputColumn": 3,
    "lineBeforeLinkPass": 62,
    "before": "[Architecture Intent](../../../architect/architecture-intent.md)",
    "after": "[Architecture Intent](../../system-architecture/architecture/architecture-intent.md)",
    "legacyPath": "docs/architect/architecture-intent.md",
    "target": {
      "path": "docs/platform/system-architecture/architecture/architecture-intent.md",
      "anchor": null,
      "aliasId": "step10-whole-system-0013"
    },
    "portal": true,
    "area": "agent-coordination",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/agent-coordination/proposals/README.md",
    "line": 62,
    "legacy": "docs/architect/architecture-intent.md",
    "previous": "[Architecture Intent](../../system-architecture/architecture/architecture-intent.md)",
    "now": "../../system-architecture/architecture/architecture-intent.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../../../architect/architecture-intent.md",
  "interimDestination": "../../system-architecture/architecture/architecture-intent.md",
  "newDestination": "../../system-architecture/architecture/architecture-intent.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/system-architecture/architecture/architecture-intent.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "988b824a980a3c2e57e348ebc3d026f21d6c71c7d83b82eabec0cbaf6f9417fe"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/architecture-intent.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfRestored": false,
    "portalRetargeted": false,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-344: link-344

```json
{
  "id": "link-344",
  "original": {
    "path": "docs/platform/agent-coordination/proposals/README.md",
    "inputLine": 65,
    "inputColumn": 3,
    "lineBeforeLinkPass": 65,
    "before": "[Step 09: Group Thinking Substrate](../../../architect/proposals/step-09-group-thinking-substrate.md)",
    "after": "[Step 09: Group Thinking Substrate](../../proposals/step-09-group-thinking-substrate.md)",
    "legacyPath": "docs/architect/proposals/step-09-group-thinking-substrate.md",
    "target": {
      "path": "docs/platform/proposals/step-09-group-thinking-substrate.md",
      "anchor": null,
      "aliasId": "step10-proposals-redesigns-0509"
    },
    "portal": true,
    "area": "agent-coordination",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/agent-coordination/proposals/README.md",
    "line": 65,
    "legacy": "docs/architect/proposals/step-09-group-thinking-substrate.md",
    "previous": "[Step 09: Group Thinking Substrate](../../proposals/step-09-group-thinking-substrate.md)",
    "now": "../../proposals/step-09-group-thinking-substrate.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../../../architect/proposals/step-09-group-thinking-substrate.md",
  "interimDestination": "../../proposals/step-09-group-thinking-substrate.md",
  "newDestination": "../../proposals/step-09-group-thinking-substrate.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/proposals/step-09-group-thinking-substrate.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "002c0b30a6d7073a8ad136907b5462d1150abbafa841697028bfa1f0e64be41f"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/proposals/step-09-group-thinking-substrate.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfRestored": false,
    "portalRetargeted": false,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-345: link-345

```json
{
  "id": "link-345",
  "original": {
    "path": "docs/platform/agent-coordination/proposals/README.md",
    "inputLine": 68,
    "inputColumn": 3,
    "lineBeforeLinkPass": 68,
    "before": "[Step 10: Coding Domain Adoption Of The Coordination Foundation](../../../architect/proposals/step-10-coding-domain-adoption.md)",
    "after": "[Step 10: Coding Domain Adoption Of The Coordination Foundation](../../proposals/step-10-coding-domain-adoption.md)",
    "legacyPath": "docs/architect/proposals/step-10-coding-domain-adoption.md",
    "target": {
      "path": "docs/platform/proposals/step-10-coding-domain-adoption.md",
      "anchor": null,
      "aliasId": "step10-proposals-redesigns-0763"
    },
    "portal": true,
    "area": "agent-coordination",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/agent-coordination/proposals/README.md",
    "line": 68,
    "legacy": "docs/architect/proposals/step-10-coding-domain-adoption.md",
    "previous": "[Step 10: Coding Domain Adoption Of The Coordination Foundation](../../proposals/step-10-coding-domain-adoption.md)",
    "now": "../../proposals/step-10-coding-domain-adoption.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../../../architect/proposals/step-10-coding-domain-adoption.md",
  "interimDestination": "../../proposals/step-10-coding-domain-adoption.md",
  "newDestination": "../../proposals/step-10-coding-domain-adoption.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/proposals/step-10-coding-domain-adoption.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "7285d2a7d7ec8da851731f6215760640e31fbb226d869358708b8529a73e67f4"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/proposals/step-10-coding-domain-adoption.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfRestored": false,
    "portalRetargeted": false,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-346: link-346

```json
{
  "id": "link-346",
  "original": {
    "path": "docs/platform/agent-coordination/proposals/README.md",
    "inputLine": 72,
    "inputColumn": 3,
    "lineBeforeLinkPass": 72,
    "before": "[Component Authority Boundary Map](../../../architect/proposals/component-authority-boundary-map.md)",
    "after": "[Component Authority Boundary Map](../../proposals/component-authority-boundary-map.md)",
    "legacyPath": "docs/architect/proposals/component-authority-boundary-map.md",
    "target": {
      "path": "docs/platform/proposals/component-authority-boundary-map.md",
      "anchor": null,
      "aliasId": "step10-proposals-redesigns-0130"
    },
    "portal": true,
    "area": "agent-coordination",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/agent-coordination/proposals/README.md",
    "line": 72,
    "legacy": "docs/architect/proposals/component-authority-boundary-map.md",
    "previous": "[Component Authority Boundary Map](../../proposals/component-authority-boundary-map.md)",
    "now": "../../proposals/component-authority-boundary-map.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../../../architect/proposals/component-authority-boundary-map.md",
  "interimDestination": "../../proposals/component-authority-boundary-map.md",
  "newDestination": "../../proposals/component-authority-boundary-map.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/proposals/component-authority-boundary-map.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "28fbac96515c3d8c9eea0cff912ac88a04bb616802c1581fb30fee7aeff2b500"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/proposals/component-authority-boundary-map.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfRestored": false,
    "portalRetargeted": false,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-347: link-347

```json
{
  "id": "link-347",
  "original": {
    "path": "docs/platform/packaging-distribution/README.md",
    "inputLine": 203,
    "inputColumn": 27,
    "lineBeforeLinkPass": 203,
    "before": "[../../architect/component-boundary/README.md](../../architect/component-boundary/README.md)",
    "after": "[../../architect/component-boundary/README.md](../component-boundary.md)",
    "legacyPath": "docs/architect/component-boundary/README.md",
    "target": {
      "path": "docs/platform/component-boundary.md",
      "anchor": null,
      "aliasId": "step10-whole-system-0159"
    },
    "portal": true,
    "area": "packaging-distribution",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/packaging-distribution/README.md",
    "line": 203,
    "legacy": "docs/architect/component-boundary/README.md",
    "previous": "[../../architect/component-boundary/README.md](../component-boundary.md)",
    "now": "../component-boundary.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../../architect/component-boundary/README.md",
  "interimDestination": "../component-boundary.md",
  "newDestination": "../component-boundary.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/component-boundary.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "384cf74c699ef5f6013c9f975dd056844184697bba58784d2ad9b2154ce51d4a"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/component-boundary/README.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfRestored": false,
    "portalRetargeted": false,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-348: link-348

```json
{
  "id": "link-348",
  "original": {
    "path": "docs/platform/packaging-distribution/README.md",
    "inputLine": 250,
    "inputColumn": 4,
    "lineBeforeLinkPass": 250,
    "before": "[Workspace Topology Architecture](../../architect/workspace-topology.md)",
    "after": "[Workspace Topology Architecture](../system-architecture/architecture/workspace-topology.md)",
    "legacyPath": "docs/architect/workspace-topology.md",
    "target": {
      "path": "docs/platform/system-architecture/architecture/workspace-topology.md",
      "anchor": null,
      "aliasId": "step10-whole-system-1458"
    },
    "portal": true,
    "area": "packaging-distribution",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/packaging-distribution/README.md",
    "line": 250,
    "legacy": "docs/architect/workspace-topology.md",
    "previous": "[Workspace Topology Architecture](../system-architecture/architecture/workspace-topology.md)",
    "now": "../system-architecture/architecture/workspace-topology.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../../architect/workspace-topology.md",
  "interimDestination": "../system-architecture/architecture/workspace-topology.md",
  "newDestination": "../system-architecture/architecture/workspace-topology.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/system-architecture/architecture/workspace-topology.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "441108da9c93fa071b4065319c40562ab44d410b714fe0140252a26280a4c15e"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/workspace-topology.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfRestored": false,
    "portalRetargeted": false,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-349: link-349

```json
{
  "id": "link-349",
  "original": {
    "path": "docs/platform/packaging-distribution/README.md",
    "inputLine": 258,
    "inputColumn": 4,
    "lineBeforeLinkPass": 258,
    "before": "[Distribution Baseline And Scattered Spec Fragments](../../architect/packaging-distribution/history/distribution-baseline.md)",
    "after": "[Distribution Baseline And Scattered Spec Fragments](history/distribution-baseline.md)",
    "legacyPath": "docs/architect/packaging-distribution/history/distribution-baseline.md",
    "target": {
      "path": "docs/platform/packaging-distribution/history/distribution-baseline.md",
      "anchor": null,
      "aliasId": "step10-packaging-distribution-0057"
    },
    "portal": true,
    "area": "packaging-distribution",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/packaging-distribution/README.md",
    "line": 258,
    "legacy": "docs/architect/packaging-distribution/history/distribution-baseline.md",
    "previous": "[Distribution Baseline And Scattered Spec Fragments](history/distribution-baseline.md)",
    "now": "history/distribution-baseline.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../../architect/packaging-distribution/history/distribution-baseline.md",
  "interimDestination": "history/distribution-baseline.md",
  "newDestination": "history/distribution-baseline.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/packaging-distribution/history/distribution-baseline.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "770f949ac340a17c9d4236e6635ae679b872795e974c11d641b50c3029a4c977"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/packaging-distribution/history/distribution-baseline.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfRestored": false,
    "portalRetargeted": false,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-350: link-350

```json
{
  "id": "link-350",
  "original": {
    "path": "docs/platform/packaging-distribution/README.md",
    "inputLine": 270,
    "inputColumn": 43,
    "lineBeforeLinkPass": 270,
    "before": "[Workspace Topology Architecture](../../architect/workspace-topology.md)",
    "after": "[Workspace Topology Architecture](../system-architecture/architecture/workspace-topology.md)",
    "legacyPath": "docs/architect/workspace-topology.md",
    "target": {
      "path": "docs/platform/system-architecture/architecture/workspace-topology.md",
      "anchor": null,
      "aliasId": "step10-whole-system-1458"
    },
    "portal": true,
    "area": "packaging-distribution",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/packaging-distribution/README.md",
    "line": 270,
    "legacy": "docs/architect/workspace-topology.md",
    "previous": "[Workspace Topology Architecture](../system-architecture/architecture/workspace-topology.md)",
    "now": "../system-architecture/architecture/workspace-topology.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../../architect/workspace-topology.md",
  "interimDestination": "../system-architecture/architecture/workspace-topology.md",
  "newDestination": "../system-architecture/architecture/workspace-topology.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/system-architecture/architecture/workspace-topology.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "441108da9c93fa071b4065319c40562ab44d410b714fe0140252a26280a4c15e"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/workspace-topology.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfRestored": false,
    "portalRetargeted": false,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-351: link-351

```json
{
  "id": "link-351",
  "original": {
    "path": "docs/platform/packaging-distribution/README.md",
    "inputLine": 273,
    "inputColumn": 40,
    "lineBeforeLinkPass": 273,
    "before": "[Distribution Baseline And Scattered Spec Fragments](../../architect/packaging-distribution/history/distribution-baseline.md)",
    "after": "[Distribution Baseline And Scattered Spec Fragments](history/distribution-baseline.md)",
    "legacyPath": "docs/architect/packaging-distribution/history/distribution-baseline.md",
    "target": {
      "path": "docs/platform/packaging-distribution/history/distribution-baseline.md",
      "anchor": null,
      "aliasId": "step10-packaging-distribution-0057"
    },
    "portal": true,
    "area": "packaging-distribution",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/packaging-distribution/README.md",
    "line": 273,
    "legacy": "docs/architect/packaging-distribution/history/distribution-baseline.md",
    "previous": "[Distribution Baseline And Scattered Spec Fragments](history/distribution-baseline.md)",
    "now": "history/distribution-baseline.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../../architect/packaging-distribution/history/distribution-baseline.md",
  "interimDestination": "history/distribution-baseline.md",
  "newDestination": "history/distribution-baseline.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/packaging-distribution/history/distribution-baseline.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "770f949ac340a17c9d4236e6635ae679b872795e974c11d641b50c3029a4c977"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/packaging-distribution/history/distribution-baseline.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfRestored": false,
    "portalRetargeted": false,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-352: link-352

```json
{
  "id": "link-352",
  "original": {
    "path": "docs/platform/proposals/README.md",
    "inputLine": 24,
    "inputColumn": 22,
    "lineBeforeLinkPass": 24,
    "before": "[original source](../../architect/proposals/README.md)",
    "after": "[original source](README.md)",
    "legacyPath": "docs/architect/proposals/README.md",
    "target": {
      "path": "docs/platform/proposals/README.md",
      "anchor": null,
      "aliasId": "step10-proposals-redesigns-0001"
    },
    "portal": true,
    "area": "proposals",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/proposals/README.md",
    "line": 24,
    "legacy": "docs/architect/proposals/README.md",
    "previous": "[original source](README.md)",
    "now": "../../architect/proposals/README.md",
    "action": "restored-legacy",
    "reason": "provenance/legacy-owner",
    "selfBefore": true,
    "portalBefore": false
  },
  "oldDestination": "../../architect/proposals/README.md",
  "interimDestination": "README.md",
  "newDestination": "../../architect/proposals/README.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/architect/proposals/README.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "5a46dde7807e8ccbfac1dd8a3aae7045c9fc9c54cfdc4747b916d3212be42400"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/proposals/README.md",
    "action": "restored-legacy",
    "reason": "provenance/legacy-owner",
    "selfRestored": true,
    "portalRetargeted": false,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-353: link-353

```json
{
  "id": "link-353",
  "original": {
    "path": "docs/platform/proposals/README.md",
    "inputLine": 42,
    "inputColumn": 3,
    "lineBeforeLinkPass": 42,
    "before": "[Coordination Capability Envelope](../../architect/proposals/coordination-capability-envelope.md)",
    "after": "[Coordination Capability Envelope](coordination-capability-envelope.md)",
    "legacyPath": "docs/architect/proposals/coordination-capability-envelope.md",
    "target": {
      "path": "docs/platform/proposals/coordination-capability-envelope.md",
      "anchor": null,
      "aliasId": "step10-proposals-redesigns-0230"
    },
    "portal": true,
    "area": "proposals",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/proposals/README.md",
    "line": 42,
    "legacy": "docs/architect/proposals/coordination-capability-envelope.md",
    "previous": "[Coordination Capability Envelope](coordination-capability-envelope.md)",
    "now": "coordination-capability-envelope.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../../architect/proposals/coordination-capability-envelope.md",
  "interimDestination": "coordination-capability-envelope.md",
  "newDestination": "coordination-capability-envelope.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/proposals/coordination-capability-envelope.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "cb550ddf91b56b91cabac628285a1d8c224a3a93ac91c08dbbbe089bbaf7df13"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/proposals/coordination-capability-envelope.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfRestored": false,
    "portalRetargeted": false,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-354: link-354

```json
{
  "id": "link-354",
  "original": {
    "path": "docs/platform/proposals/README.md",
    "inputLine": 46,
    "inputColumn": 3,
    "lineBeforeLinkPass": 46,
    "before": "[Step 09: Group Thinking Substrate](../../architect/proposals/step-09-group-thinking-substrate.md)",
    "after": "[Step 09: Group Thinking Substrate](step-09-group-thinking-substrate.md)",
    "legacyPath": "docs/architect/proposals/step-09-group-thinking-substrate.md",
    "target": {
      "path": "docs/platform/proposals/step-09-group-thinking-substrate.md",
      "anchor": null,
      "aliasId": "step10-proposals-redesigns-0509"
    },
    "portal": true,
    "area": "proposals",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/proposals/README.md",
    "line": 46,
    "legacy": "docs/architect/proposals/step-09-group-thinking-substrate.md",
    "previous": "[Step 09: Group Thinking Substrate](step-09-group-thinking-substrate.md)",
    "now": "step-09-group-thinking-substrate.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../../architect/proposals/step-09-group-thinking-substrate.md",
  "interimDestination": "step-09-group-thinking-substrate.md",
  "newDestination": "step-09-group-thinking-substrate.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/proposals/step-09-group-thinking-substrate.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "002c0b30a6d7073a8ad136907b5462d1150abbafa841697028bfa1f0e64be41f"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/proposals/step-09-group-thinking-substrate.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfRestored": false,
    "portalRetargeted": false,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-355: link-355

```json
{
  "id": "link-355",
  "original": {
    "path": "docs/platform/proposals/README.md",
    "inputLine": 47,
    "inputColumn": 3,
    "lineBeforeLinkPass": 47,
    "before": "[Architecture Advisory Panel](../../architect/proposals/architecture-advisory-panel.md)",
    "after": "[Architecture Advisory Panel](architecture-advisory-panel.md)",
    "legacyPath": "docs/architect/proposals/architecture-advisory-panel.md",
    "target": {
      "path": "docs/platform/proposals/architecture-advisory-panel.md",
      "anchor": null,
      "aliasId": "step10-proposals-redesigns-0010"
    },
    "portal": true,
    "area": "proposals",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/proposals/README.md",
    "line": 47,
    "legacy": "docs/architect/proposals/architecture-advisory-panel.md",
    "previous": "[Architecture Advisory Panel](architecture-advisory-panel.md)",
    "now": "architecture-advisory-panel.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../../architect/proposals/architecture-advisory-panel.md",
  "interimDestination": "architecture-advisory-panel.md",
  "newDestination": "architecture-advisory-panel.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/proposals/architecture-advisory-panel.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "6d9ccca7be37d1174b1d122598a2003800fc816b9d6c45d8c2d08c3271c424c2"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/proposals/architecture-advisory-panel.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfRestored": false,
    "portalRetargeted": false,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-356: link-356

```json
{
  "id": "link-356",
  "original": {
    "path": "docs/platform/proposals/README.md",
    "inputLine": 51,
    "inputColumn": 3,
    "lineBeforeLinkPass": 51,
    "before": "[Step 10: Coding Domain Adoption Of The Coordination Foundation](../../architect/proposals/step-10-coding-domain-adoption.md)",
    "after": "[Step 10: Coding Domain Adoption Of The Coordination Foundation](step-10-coding-domain-adoption.md)",
    "legacyPath": "docs/architect/proposals/step-10-coding-domain-adoption.md",
    "target": {
      "path": "docs/platform/proposals/step-10-coding-domain-adoption.md",
      "anchor": null,
      "aliasId": "step10-proposals-redesigns-0763"
    },
    "portal": true,
    "area": "proposals",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/proposals/README.md",
    "line": 51,
    "legacy": "docs/architect/proposals/step-10-coding-domain-adoption.md",
    "previous": "[Step 10: Coding Domain Adoption Of The Coordination Foundation](step-10-coding-domain-adoption.md)",
    "now": "step-10-coding-domain-adoption.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../../architect/proposals/step-10-coding-domain-adoption.md",
  "interimDestination": "step-10-coding-domain-adoption.md",
  "newDestination": "step-10-coding-domain-adoption.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/proposals/step-10-coding-domain-adoption.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "7285d2a7d7ec8da851731f6215760640e31fbb226d869358708b8529a73e67f4"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/proposals/step-10-coding-domain-adoption.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfRestored": false,
    "portalRetargeted": false,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-357: link-357

```json
{
  "id": "link-357",
  "original": {
    "path": "docs/platform/proposals/README.md",
    "inputLine": 52,
    "inputColumn": 3,
    "lineBeforeLinkPass": 52,
    "before": "[Component Authority Boundary Map](../../architect/proposals/component-authority-boundary-map.md)",
    "after": "[Component Authority Boundary Map](component-authority-boundary-map.md)",
    "legacyPath": "docs/architect/proposals/component-authority-boundary-map.md",
    "target": {
      "path": "docs/platform/proposals/component-authority-boundary-map.md",
      "anchor": null,
      "aliasId": "step10-proposals-redesigns-0130"
    },
    "portal": true,
    "area": "proposals",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/proposals/README.md",
    "line": 52,
    "legacy": "docs/architect/proposals/component-authority-boundary-map.md",
    "previous": "[Component Authority Boundary Map](component-authority-boundary-map.md)",
    "now": "component-authority-boundary-map.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../../architect/proposals/component-authority-boundary-map.md",
  "interimDestination": "component-authority-boundary-map.md",
  "newDestination": "component-authority-boundary-map.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/proposals/component-authority-boundary-map.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "28fbac96515c3d8c9eea0cff912ac88a04bb616802c1581fb30fee7aeff2b500"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/proposals/component-authority-boundary-map.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfRestored": false,
    "portalRetargeted": false,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-358: link-358

```json
{
  "id": "link-358",
  "original": {
    "path": "docs/platform/proposals/README.md",
    "inputLine": 56,
    "inputColumn": 3,
    "lineBeforeLinkPass": 56,
    "before": "[Step 09 / Step 10 Replan Handoff Prompt](../../architect/proposals/step-09-step-10-replan-handoff-prompt.md)",
    "after": "[Step 09 / Step 10 Replan Handoff Prompt](../agent-coordination/history/proposals-redesigns/step-09-step-10-replan-handoff-prompt.md)",
    "legacyPath": "docs/architect/proposals/step-09-step-10-replan-handoff-prompt.md",
    "target": {
      "path": "docs/platform/agent-coordination/history/proposals-redesigns/step-09-step-10-replan-handoff-prompt.md",
      "anchor": null,
      "aliasId": "step10-proposals-redesigns-0603"
    },
    "portal": true,
    "area": "proposals",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/proposals/README.md",
    "line": 56,
    "legacy": "docs/architect/proposals/step-09-step-10-replan-handoff-prompt.md",
    "previous": "[Step 09 / Step 10 Replan Handoff Prompt](../agent-coordination/history/proposals-redesigns/step-09-step-10-replan-handoff-prompt.md)",
    "now": "../agent-coordination/history/proposals-redesigns/step-09-step-10-replan-handoff-prompt.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../../architect/proposals/step-09-step-10-replan-handoff-prompt.md",
  "interimDestination": "../agent-coordination/history/proposals-redesigns/step-09-step-10-replan-handoff-prompt.md",
  "newDestination": "../agent-coordination/history/proposals-redesigns/step-09-step-10-replan-handoff-prompt.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/agent-coordination/history/proposals-redesigns/step-09-step-10-replan-handoff-prompt.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "90f07b2fe30267ed4b0d86dfa7d1d38e69b62dcfe81195f05dcf4e1c17e66279"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/proposals/step-09-step-10-replan-handoff-prompt.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfRestored": false,
    "portalRetargeted": false,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-359: link-359

```json
{
  "id": "link-359",
  "original": {
    "path": "docs/platform/work-state/README.md",
    "inputLine": 26,
    "inputColumn": 132,
    "lineBeforeLinkPass": 34,
    "before": "[docs/specs/work-state.md](../../specs/work-state.md)",
    "after": "[docs/specs/work-state.md](README.md)",
    "legacyPath": "docs/specs/work-state.md",
    "target": {
      "path": "docs/platform/work-state/README.md",
      "anchor": null,
      "aliasId": "root-authorities-draft-0073"
    },
    "portal": true,
    "area": "work-state",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/work-state/README.md",
    "line": 34,
    "legacy": "docs/specs/work-state.md",
    "previous": "[docs/specs/work-state.md](README.md)",
    "now": "../../specs/work-state.md",
    "action": "restored-legacy",
    "reason": "provenance/legacy-owner",
    "selfBefore": true,
    "portalBefore": false
  },
  "oldDestination": "../../specs/work-state.md",
  "interimDestination": "README.md",
  "newDestination": "../../specs/work-state.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/specs/work-state.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "aa7f9f1041531a918c58cdf5f41995a257c5ec8c353d4237a21096d24b60eef0"
  },
  "referentPreservation": {
    "declaredReferent": "docs/specs/work-state.md",
    "action": "restored-legacy",
    "reason": "provenance/legacy-owner",
    "selfRestored": true,
    "portalRetargeted": false,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-360: link-360

```json
{
  "id": "link-360",
  "original": {
    "path": "docs/platform/work-state/README.md",
    "inputLine": 26,
    "inputColumn": 187,
    "lineBeforeLinkPass": 34,
    "before": "[docs/io-contract.md](../../io-contract.md)",
    "after": "[docs/io-contract.md](contracts/cli-io-contract.md)",
    "legacyPath": "docs/io-contract.md",
    "target": {
      "path": "docs/platform/work-state/contracts/cli-io-contract.md",
      "anchor": null,
      "aliasId": "root-authorities-draft-0027"
    },
    "portal": true,
    "area": "work-state",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/work-state/README.md",
    "line": 34,
    "legacy": "docs/io-contract.md",
    "previous": "[docs/io-contract.md](contracts/cli-io-contract.md)",
    "now": "../../io-contract.md",
    "action": "restored-legacy",
    "reason": "provenance/legacy-owner",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../../io-contract.md",
  "interimDestination": "contracts/cli-io-contract.md",
  "newDestination": "../../io-contract.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/io-contract.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "a5ad416f2aa2337c7dc0bb3f65ec5b3f1149b0a9a9d6731f62edabea17ad4f94"
  },
  "referentPreservation": {
    "declaredReferent": "docs/io-contract.md",
    "action": "restored-legacy",
    "reason": "provenance/legacy-owner",
    "selfRestored": false,
    "portalRetargeted": false,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

