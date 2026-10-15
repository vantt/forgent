# Current link pass and helper rules — part 1

One replacement review request; entries 1–120 of section f. **120 entries**. Content and SYNC `2300d65571968bb3bcb80123a273272586e3f1db`; comparison base `980cb29312b8701f5ea639278f44e1a57a6e5c02`. [Single index](review-request-step10-index-2300d6557.md). Old requests packaged at `8d38b18ed` are superseded. No producer seed or verdict.

Current decision and current witness fields take precedence over explicitly preserved historical records. Every rebound row is pending; old reviewed fields occur only inside historical before records. A36 deep lists are in [A36](step10-sync2300-A36.json); all truth corrections, all partial carries and all unequal source/target rows require deep review.

## Entry f-001: link-001

```json
{
  "id": "link-001",
  "original": {
    "path": "docs/platform/agent-coordination/architecture/evidence-and-results.md",
    "inputLine": 78,
    "inputColumn": 42,
    "lineBeforeLinkPass": 78,
    "before": "[runner spec](../../../specs/runner.md)",
    "after": "[runner spec](../../runner/README.md)",
    "legacyPath": "docs/specs/runner.md",
    "target": {
      "path": "docs/platform/runner/README.md",
      "anchor": null,
      "aliasId": "step10-runner-0001"
    },
    "portal": false,
    "area": "agent-coordination",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/agent-coordination/architecture/evidence-and-results.md",
    "line": 78,
    "legacy": "docs/specs/runner.md",
    "previous": "[runner spec](../../runner/README.md)",
    "now": "../../runner/spec.md",
    "action": "retargeted-specific",
    "reason": "specific-candidate",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../../../specs/runner.md",
  "interimDestination": "../../runner/README.md",
  "newDestination": "../../runner/spec.md",
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

## Entry f-002: link-002

```json
{
  "id": "link-002",
  "original": {
    "path": "docs/platform/agent-coordination/architecture/runtime-recovery-design.md",
    "inputLine": 199,
    "inputColumn": 42,
    "lineBeforeLinkPass": 199,
    "before": "[runner spec](../../../specs/runner.md)",
    "after": "[runner spec](../../runner/README.md)",
    "legacyPath": "docs/specs/runner.md",
    "target": {
      "path": "docs/platform/runner/README.md",
      "anchor": null,
      "aliasId": "step10-runner-0001"
    },
    "portal": false,
    "area": "agent-coordination",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/agent-coordination/architecture/runtime-recovery-design.md",
    "line": 199,
    "legacy": "docs/specs/runner.md",
    "previous": "[runner spec](../../runner/README.md)",
    "now": "../../runner/spec.md",
    "action": "retargeted-specific",
    "reason": "specific-candidate",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../../../specs/runner.md",
  "interimDestination": "../../runner/README.md",
  "newDestination": "../../runner/spec.md",
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

## Entry f-003: link-003

```json
{
  "id": "link-003",
  "original": {
    "path": "docs/platform/agent-coordination/architecture/work-integration.md",
    "inputLine": 86,
    "inputColumn": 41,
    "lineBeforeLinkPass": 86,
    "before": "[runner spec](../../../specs/runner.md)",
    "after": "[runner spec](../../runner/README.md)",
    "legacyPath": "docs/specs/runner.md",
    "target": {
      "path": "docs/platform/runner/README.md",
      "anchor": null,
      "aliasId": "step10-runner-0001"
    },
    "portal": false,
    "area": "agent-coordination",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/agent-coordination/architecture/work-integration.md",
    "line": 86,
    "legacy": "docs/specs/runner.md",
    "previous": "[runner spec](../../runner/README.md)",
    "now": "../../runner/spec.md",
    "action": "retargeted-specific",
    "reason": "specific-candidate",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../../../specs/runner.md",
  "interimDestination": "../../runner/README.md",
  "newDestination": "../../runner/spec.md",
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

## Entry f-004: link-004

```json
{
  "id": "link-004",
  "original": {
    "path": "docs/platform/agent-coordination/decisions/ADR-003-assignment-run-runresult-separation.md",
    "inputLine": 23,
    "inputColumn": 171,
    "lineBeforeLinkPass": 23,
    "before": "[the runner spec](../../../specs/runner.md)",
    "after": "[the runner spec](../../runner/README.md)",
    "legacyPath": "docs/specs/runner.md",
    "target": {
      "path": "docs/platform/runner/README.md",
      "anchor": null,
      "aliasId": "step10-runner-0001"
    },
    "portal": false,
    "area": "agent-coordination",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/agent-coordination/decisions/ADR-003-assignment-run-runresult-separation.md",
    "line": 23,
    "legacy": "docs/specs/runner.md",
    "previous": "[the runner spec](../../runner/README.md)",
    "now": "../../runner/spec.md",
    "action": "retargeted-specific",
    "reason": "specific-candidate",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../../../specs/runner.md",
  "interimDestination": "../../runner/README.md",
  "newDestination": "../../runner/spec.md",
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

## Entry f-005: link-005

```json
{
  "id": "link-005",
  "original": {
    "path": "docs/platform/agent-coordination/decisions/ADR-005-herdr-visibility-only.md",
    "inputLine": 23,
    "inputColumn": 171,
    "lineBeforeLinkPass": 23,
    "before": "[the runner spec](../../../specs/runner.md)",
    "after": "[the runner spec](../../runner/README.md)",
    "legacyPath": "docs/specs/runner.md",
    "target": {
      "path": "docs/platform/runner/README.md",
      "anchor": null,
      "aliasId": "step10-runner-0001"
    },
    "portal": false,
    "area": "agent-coordination",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/agent-coordination/decisions/ADR-005-herdr-visibility-only.md",
    "line": 23,
    "legacy": "docs/specs/runner.md",
    "previous": "[the runner spec](../../runner/README.md)",
    "now": "../../runner/spec.md",
    "action": "retargeted-specific",
    "reason": "specific-candidate",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../../../specs/runner.md",
  "interimDestination": "../../runner/README.md",
  "newDestination": "../../runner/spec.md",
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

## Entry f-006: link-006

```json
{
  "id": "link-006",
  "original": {
    "path": "docs/platform/agent-coordination/spec.md",
    "inputLine": 24,
    "inputColumn": 122,
    "lineBeforeLinkPass": 24,
    "before": "[the runner spec](../../specs/runner.md)",
    "after": "[the runner spec](../runner/README.md)",
    "legacyPath": "docs/specs/runner.md",
    "target": {
      "path": "docs/platform/runner/README.md",
      "anchor": null,
      "aliasId": "step10-runner-0001"
    },
    "portal": false,
    "area": "agent-coordination",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/agent-coordination/spec.md",
    "line": 24,
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

## Entry f-007: link-007

```json
{
  "id": "link-007",
  "original": {
    "path": "docs/platform/agent-coordination/spec.md",
    "inputLine": 37,
    "inputColumn": 27,
    "lineBeforeLinkPass": 37,
    "before": "[docs/specs/runner.md](../../specs/runner.md)",
    "after": "[docs/specs/runner.md](../runner/README.md)",
    "legacyPath": "docs/specs/runner.md",
    "target": {
      "path": "docs/platform/runner/README.md",
      "anchor": null,
      "aliasId": "step10-runner-0001"
    },
    "portal": false,
    "area": "agent-coordination",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/agent-coordination/spec.md",
    "line": 37,
    "legacy": "docs/specs/runner.md",
    "previous": "[docs/specs/runner.md](../runner/README.md)",
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

## Entry f-008: link-008

```json
{
  "id": "link-008",
  "original": {
    "path": "docs/platform/agent-coordination/spec.md",
    "inputLine": 42,
    "inputColumn": 38,
    "lineBeforeLinkPass": 42,
    "before": "[the runner spec](../../specs/runner.md)",
    "after": "[the runner spec](../runner/README.md)",
    "legacyPath": "docs/specs/runner.md",
    "target": {
      "path": "docs/platform/runner/README.md",
      "anchor": null,
      "aliasId": "step10-runner-0001"
    },
    "portal": false,
    "area": "agent-coordination",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/agent-coordination/spec.md",
    "line": 42,
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

## Entry f-009: link-009

```json
{
  "id": "link-009",
  "original": {
    "path": "docs/platform/agent-coordination/spec.md",
    "inputLine": 75,
    "inputColumn": 51,
    "lineBeforeLinkPass": 75,
    "before": "[docs/specs/runner.md](../../specs/runner.md)",
    "after": "[docs/specs/runner.md](../runner/README.md)",
    "legacyPath": "docs/specs/runner.md",
    "target": {
      "path": "docs/platform/runner/README.md",
      "anchor": null,
      "aliasId": "step10-runner-0001"
    },
    "portal": false,
    "area": "agent-coordination",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/agent-coordination/spec.md",
    "line": 75,
    "legacy": "docs/specs/runner.md",
    "previous": "[docs/specs/runner.md](../runner/README.md)",
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

## Entry f-010: link-010

```json
{
  "id": "link-010",
  "original": {
    "path": "docs/platform/agent-coordination/spec.md",
    "inputLine": 79,
    "inputColumn": 23,
    "lineBeforeLinkPass": 79,
    "before": "[Runner spec](../../specs/runner.md)",
    "after": "[Runner spec](../runner/README.md)",
    "legacyPath": "docs/specs/runner.md",
    "target": {
      "path": "docs/platform/runner/README.md",
      "anchor": null,
      "aliasId": "step10-runner-0001"
    },
    "portal": false,
    "area": "agent-coordination",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/agent-coordination/spec.md",
    "line": 79,
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

## Entry f-011: link-011

```json
{
  "id": "link-011",
  "original": {
    "path": "docs/platform/agent-coordination/spec.md",
    "inputLine": 90,
    "inputColumn": 27,
    "lineBeforeLinkPass": 90,
    "before": "[confinement-authority spec](../../specs/confinement-authority.md)",
    "after": "[confinement-authority spec](../agent-confinement/README.md)",
    "legacyPath": "docs/specs/confinement-authority.md",
    "target": {
      "path": "docs/platform/agent-confinement/README.md",
      "anchor": null,
      "aliasId": "step10-specs-0001"
    },
    "portal": false,
    "area": "agent-coordination",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/agent-coordination/spec.md",
    "line": 90,
    "legacy": "docs/specs/confinement-authority.md",
    "previous": "[confinement-authority spec](../agent-confinement/README.md)",
    "now": "../agent-confinement/spec.md",
    "action": "retargeted-specific",
    "reason": "specific-candidate",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../../specs/confinement-authority.md",
  "interimDestination": "../agent-confinement/README.md",
  "newDestination": "../agent-confinement/spec.md",
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

## Entry f-012: link-012

```json
{
  "id": "link-012",
  "original": {
    "path": "docs/platform/agent-coordination/spec.md",
    "inputLine": 100,
    "inputColumn": 149,
    "lineBeforeLinkPass": 100,
    "before": "[the current owner](../../specs/runner.md)",
    "after": "[the current owner](../runner/README.md)",
    "legacyPath": "docs/specs/runner.md",
    "target": {
      "path": "docs/platform/runner/README.md",
      "anchor": null,
      "aliasId": "step10-runner-0001"
    },
    "portal": false,
    "area": "agent-coordination",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/agent-coordination/spec.md",
    "line": 100,
    "legacy": "docs/specs/runner.md",
    "previous": "[the current owner](../runner/README.md)",
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

## Entry f-013: link-013

```json
{
  "id": "link-013",
  "original": {
    "path": "docs/platform/agent-coordination/spec.md",
    "inputLine": 107,
    "inputColumn": 19,
    "lineBeforeLinkPass": 107,
    "before": "[runner spec](../../specs/runner.md)",
    "after": "[runner spec](../runner/README.md)",
    "legacyPath": "docs/specs/runner.md",
    "target": {
      "path": "docs/platform/runner/README.md",
      "anchor": null,
      "aliasId": "step10-runner-0001"
    },
    "portal": false,
    "area": "agent-coordination",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/agent-coordination/spec.md",
    "line": 107,
    "legacy": "docs/specs/runner.md",
    "previous": "[runner spec](../runner/README.md)",
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

## Entry f-014: link-014

```json
{
  "id": "link-014",
  "original": {
    "path": "docs/platform/agent-coordination/vision.md",
    "inputLine": 356,
    "inputColumn": 4,
    "lineBeforeLinkPass": 356,
    "before": "[the runner spec](../../specs/runner.md)",
    "after": "[the runner spec](../runner/README.md)",
    "legacyPath": "docs/specs/runner.md",
    "target": {
      "path": "docs/platform/runner/README.md",
      "anchor": null,
      "aliasId": "step10-runner-0001"
    },
    "portal": false,
    "area": "agent-coordination",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/agent-coordination/vision.md",
    "line": 356,
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

## Entry f-015: link-015

```json
{
  "id": "link-015",
  "original": {
    "path": "docs/platform/architecture-map.md",
    "inputLine": 94,
    "inputColumn": 1,
    "lineBeforeLinkPass": 102,
    "before": "[0012](../specs/work-state.md#0012-mô-hình-đồ-thị-cạnh-định-kiểu-hợp-nhất-thay-thế-depsparent-tách-rời)",
    "after": "[0012](work-state/decisions/retired-decision-history.md#8-adr-0012-unified-typed-edge-graph-model)",
    "legacyPath": "docs/specs/work-state.md",
    "target": {
      "path": "docs/platform/work-state/decisions/retired-decision-history.md",
      "anchor": "8-adr-0012-unified-typed-edge-graph-model",
      "aliasId": "root-authorities-draft-0143"
    },
    "portal": false,
    "area": "platform-root",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/architecture-map.md",
    "line": 102,
    "legacy": "docs/specs/work-state.md",
    "previous": "[0012](work-state/decisions/retired-decision-history.md#8-adr-0012-unified-typed-edge-graph-model)",
    "now": "work-state/decisions/retired-decision-history.md#8-adr-0012-unified-typed-edge-graph-model",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../specs/work-state.md#0012-mô-hình-đồ-thị-cạnh-định-kiểu-hợp-nhất-thay-thế-depsparent-tách-rời",
  "interimDestination": "work-state/decisions/retired-decision-history.md#8-adr-0012-unified-typed-edge-graph-model",
  "newDestination": "work-state/decisions/retired-decision-history.md#8-adr-0012-unified-typed-edge-graph-model",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/work-state/decisions/retired-decision-history.md",
    "anchor": "8-adr-0012-unified-typed-edge-graph-model",
    "resolves": true,
    "fileSHA256": "c52067753829ec020f3e536710cbc0016330fde3fadc89c4962e353e5860125f"
  },
  "referentPreservation": {
    "declaredReferent": "docs/specs/work-state.md",
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

## Entry f-016: link-016

```json
{
  "id": "link-016",
  "original": {
    "path": "docs/platform/architecture-map.md",
    "inputLine": 96,
    "inputColumn": 1,
    "lineBeforeLinkPass": 104,
    "before": "[0013](../specs/work-state.md#0013-kênh-báo-cáo-không-ghi-workerrunner-cho-discovered-from)",
    "after": "[0013](work-state/decisions/retired-decision-history.md#9-adr-0013-report-not-write-channel-for-discovered-from)",
    "legacyPath": "docs/specs/work-state.md",
    "target": {
      "path": "docs/platform/work-state/decisions/retired-decision-history.md",
      "anchor": "9-adr-0013-report-not-write-channel-for-discovered-from",
      "aliasId": "root-authorities-draft-0147"
    },
    "portal": false,
    "area": "platform-root",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/architecture-map.md",
    "line": 104,
    "legacy": "docs/specs/work-state.md",
    "previous": "[0013](work-state/decisions/retired-decision-history.md#9-adr-0013-report-not-write-channel-for-discovered-from)",
    "now": "work-state/decisions/retired-decision-history.md#9-adr-0013-report-not-write-channel-for-discovered-from",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../specs/work-state.md#0013-kênh-báo-cáo-không-ghi-workerrunner-cho-discovered-from",
  "interimDestination": "work-state/decisions/retired-decision-history.md#9-adr-0013-report-not-write-channel-for-discovered-from",
  "newDestination": "work-state/decisions/retired-decision-history.md#9-adr-0013-report-not-write-channel-for-discovered-from",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/work-state/decisions/retired-decision-history.md",
    "anchor": "9-adr-0013-report-not-write-channel-for-discovered-from",
    "resolves": true,
    "fileSHA256": "c52067753829ec020f3e536710cbc0016330fde3fadc89c4962e353e5860125f"
  },
  "referentPreservation": {
    "declaredReferent": "docs/specs/work-state.md",
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

## Entry f-017: link-017

```json
{
  "id": "link-017",
  "original": {
    "path": "docs/platform/architecture-map.md",
    "inputLine": 120,
    "inputColumn": 35,
    "lineBeforeLinkPass": 128,
    "before": "[0012](../specs/work-state.md#0012-mô-hình-đồ-thị-cạnh-định-kiểu-hợp-nhất-thay-thế-depsparent-tách-rời)",
    "after": "[0012](work-state/decisions/retired-decision-history.md#8-adr-0012-unified-typed-edge-graph-model)",
    "legacyPath": "docs/specs/work-state.md",
    "target": {
      "path": "docs/platform/work-state/decisions/retired-decision-history.md",
      "anchor": "8-adr-0012-unified-typed-edge-graph-model",
      "aliasId": "root-authorities-draft-0143"
    },
    "portal": false,
    "area": "platform-root",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/architecture-map.md",
    "line": 128,
    "legacy": "docs/specs/work-state.md",
    "previous": "[0012](work-state/decisions/retired-decision-history.md#8-adr-0012-unified-typed-edge-graph-model)",
    "now": "work-state/decisions/retired-decision-history.md#8-adr-0012-unified-typed-edge-graph-model",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../specs/work-state.md#0012-mô-hình-đồ-thị-cạnh-định-kiểu-hợp-nhất-thay-thế-depsparent-tách-rời",
  "interimDestination": "work-state/decisions/retired-decision-history.md#8-adr-0012-unified-typed-edge-graph-model",
  "newDestination": "work-state/decisions/retired-decision-history.md#8-adr-0012-unified-typed-edge-graph-model",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/work-state/decisions/retired-decision-history.md",
    "anchor": "8-adr-0012-unified-typed-edge-graph-model",
    "resolves": true,
    "fileSHA256": "c52067753829ec020f3e536710cbc0016330fde3fadc89c4962e353e5860125f"
  },
  "referentPreservation": {
    "declaredReferent": "docs/specs/work-state.md",
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

## Entry f-018: link-018

```json
{
  "id": "link-018",
  "original": {
    "path": "docs/platform/architecture-map.md",
    "inputLine": 134,
    "inputColumn": 35,
    "lineBeforeLinkPass": 142,
    "before": "[0013](../specs/work-state.md#0013-kênh-báo-cáo-không-ghi-workerrunner-cho-discovered-from)",
    "after": "[0013](work-state/decisions/retired-decision-history.md#9-adr-0013-report-not-write-channel-for-discovered-from)",
    "legacyPath": "docs/specs/work-state.md",
    "target": {
      "path": "docs/platform/work-state/decisions/retired-decision-history.md",
      "anchor": "9-adr-0013-report-not-write-channel-for-discovered-from",
      "aliasId": "root-authorities-draft-0147"
    },
    "portal": false,
    "area": "platform-root",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/architecture-map.md",
    "line": 142,
    "legacy": "docs/specs/work-state.md",
    "previous": "[0013](work-state/decisions/retired-decision-history.md#9-adr-0013-report-not-write-channel-for-discovered-from)",
    "now": "work-state/decisions/retired-decision-history.md#9-adr-0013-report-not-write-channel-for-discovered-from",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../specs/work-state.md#0013-kênh-báo-cáo-không-ghi-workerrunner-cho-discovered-from",
  "interimDestination": "work-state/decisions/retired-decision-history.md#9-adr-0013-report-not-write-channel-for-discovered-from",
  "newDestination": "work-state/decisions/retired-decision-history.md#9-adr-0013-report-not-write-channel-for-discovered-from",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/work-state/decisions/retired-decision-history.md",
    "anchor": "9-adr-0013-report-not-write-channel-for-discovered-from",
    "resolves": true,
    "fileSHA256": "c52067753829ec020f3e536710cbc0016330fde3fadc89c4962e353e5860125f"
  },
  "referentPreservation": {
    "declaredReferent": "docs/specs/work-state.md",
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

## Entry f-019: link-019

```json
{
  "id": "link-019",
  "original": {
    "path": "docs/platform/component-boundary.md",
    "inputLine": 38,
    "inputColumn": 3,
    "lineBeforeLinkPass": 46,
    "before": "[../architect/component-boundary/README.md](../architect/component-boundary/README.md)",
    "after": "[../architect/component-boundary/README.md](component-boundary.md)",
    "legacyPath": "docs/architect/component-boundary/README.md",
    "target": {
      "path": "docs/platform/component-boundary.md",
      "anchor": null,
      "aliasId": "step10-whole-system-0159"
    },
    "portal": false,
    "area": "platform-root",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/component-boundary.md",
    "line": 46,
    "legacy": "docs/architect/component-boundary/README.md",
    "previous": "[../architect/component-boundary/README.md](component-boundary.md)",
    "now": "../architect/component-boundary/README.md",
    "action": "restored-legacy",
    "reason": "self-link",
    "selfBefore": true,
    "portalBefore": false
  },
  "oldDestination": "../architect/component-boundary/README.md",
  "interimDestination": "component-boundary.md",
  "newDestination": "../architect/component-boundary/README.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/architect/component-boundary/README.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "710ede7ac06e2e248e6948feeb878cda6b34c65e79085cee6a2a0e7b894c4ab6"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/component-boundary/README.md",
    "action": "restored-legacy",
    "reason": "self-link",
    "selfRestored": true,
    "portalRetargeted": false,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-020: link-020

```json
{
  "id": "link-020",
  "original": {
    "path": "docs/platform/component-boundary.md",
    "inputLine": 39,
    "inputColumn": 3,
    "lineBeforeLinkPass": 47,
    "before": "[../architect/component-boundary/component-boundary-advisory.md](../architect/component-boundary/component-boundary-advisory.md)",
    "after": "[../architect/component-boundary/component-boundary-advisory.md](component-boundary.md)",
    "legacyPath": "docs/architect/component-boundary/component-boundary-advisory.md",
    "target": {
      "path": "docs/platform/component-boundary.md",
      "anchor": null,
      "aliasId": "step10-whole-system-0212"
    },
    "portal": false,
    "area": "platform-root",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/component-boundary.md",
    "line": 47,
    "legacy": "docs/architect/component-boundary/component-boundary-advisory.md",
    "previous": "[../architect/component-boundary/component-boundary-advisory.md](component-boundary.md)",
    "now": "../architect/component-boundary/component-boundary-advisory.md",
    "action": "restored-legacy",
    "reason": "self-link",
    "selfBefore": true,
    "portalBefore": false
  },
  "oldDestination": "../architect/component-boundary/component-boundary-advisory.md",
  "interimDestination": "component-boundary.md",
  "newDestination": "../architect/component-boundary/component-boundary-advisory.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/architect/component-boundary/component-boundary-advisory.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "913cbbc9419fc059e5ce1dcaeb7d06d6d90d6e9d3ef45195c15cd59ff0359bf3"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/component-boundary/component-boundary-advisory.md",
    "action": "restored-legacy",
    "reason": "self-link",
    "selfRestored": true,
    "portalRetargeted": false,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-021: link-021

```json
{
  "id": "link-021",
  "original": {
    "path": "docs/platform/component-boundary.md",
    "inputLine": 40,
    "inputColumn": 3,
    "lineBeforeLinkPass": 48,
    "before": "[../architect/proposals/component-authority-boundary-map.md](../architect/proposals/component-authority-boundary-map.md)",
    "after": "[../architect/proposals/component-authority-boundary-map.md](proposals/component-authority-boundary-map.md)",
    "legacyPath": "docs/architect/proposals/component-authority-boundary-map.md",
    "target": {
      "path": "docs/platform/proposals/component-authority-boundary-map.md",
      "anchor": null,
      "aliasId": "step10-proposals-redesigns-0130"
    },
    "portal": false,
    "area": "platform-root",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/component-boundary.md",
    "line": 48,
    "legacy": "docs/architect/proposals/component-authority-boundary-map.md",
    "previous": "[../architect/proposals/component-authority-boundary-map.md](proposals/component-authority-boundary-map.md)",
    "now": "proposals/component-authority-boundary-map.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../architect/proposals/component-authority-boundary-map.md",
  "interimDestination": "proposals/component-authority-boundary-map.md",
  "newDestination": "proposals/component-authority-boundary-map.md",
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

## Entry f-022: link-022

```json
{
  "id": "link-022",
  "original": {
    "path": "docs/platform/component-boundary.md",
    "inputLine": 62,
    "inputColumn": 280,
    "lineBeforeLinkPass": 70,
    "before": "[../architect/component-boundary/component-boundary-advisory.md](../architect/component-boundary/component-boundary-advisory.md)",
    "after": "[../architect/component-boundary/component-boundary-advisory.md](component-boundary.md)",
    "legacyPath": "docs/architect/component-boundary/component-boundary-advisory.md",
    "target": {
      "path": "docs/platform/component-boundary.md",
      "anchor": null,
      "aliasId": "step10-whole-system-0212"
    },
    "portal": false,
    "area": "platform-root",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/component-boundary.md",
    "line": 70,
    "legacy": "docs/architect/component-boundary/component-boundary-advisory.md",
    "previous": "[../architect/component-boundary/component-boundary-advisory.md](component-boundary.md)",
    "now": "../architect/component-boundary/component-boundary-advisory.md",
    "action": "restored-legacy",
    "reason": "provenance/legacy-owner",
    "selfBefore": true,
    "portalBefore": false
  },
  "oldDestination": "../architect/component-boundary/component-boundary-advisory.md",
  "interimDestination": "component-boundary.md",
  "newDestination": "../architect/component-boundary/component-boundary-advisory.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/architect/component-boundary/component-boundary-advisory.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "913cbbc9419fc059e5ce1dcaeb7d06d6d90d6e9d3ef45195c15cd59ff0359bf3"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/component-boundary/component-boundary-advisory.md",
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

## Entry f-023: link-023

```json
{
  "id": "link-023",
  "original": {
    "path": "docs/platform/component-boundary.md",
    "inputLine": 63,
    "inputColumn": 221,
    "lineBeforeLinkPass": 71,
    "before": "[../specs/runner.md](../specs/runner.md)",
    "after": "[../specs/runner.md](runner/README.md)",
    "legacyPath": "docs/specs/runner.md",
    "target": {
      "path": "docs/platform/runner/README.md",
      "anchor": null,
      "aliasId": "step10-runner-0001"
    },
    "portal": false,
    "area": "platform-root",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/component-boundary.md",
    "line": 71,
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

## Entry f-024: link-024

```json
{
  "id": "link-024",
  "original": {
    "path": "docs/platform/component-boundary.md",
    "inputLine": 64,
    "inputColumn": 435,
    "lineBeforeLinkPass": 72,
    "before": "[../specs/runner.md](../specs/runner.md)",
    "after": "[../specs/runner.md](runner/README.md)",
    "legacyPath": "docs/specs/runner.md",
    "target": {
      "path": "docs/platform/runner/README.md",
      "anchor": null,
      "aliasId": "step10-runner-0001"
    },
    "portal": false,
    "area": "platform-root",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/component-boundary.md",
    "line": 72,
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

## Entry f-025: link-025

```json
{
  "id": "link-025",
  "original": {
    "path": "docs/platform/component-boundary.md",
    "inputLine": 65,
    "inputColumn": 208,
    "lineBeforeLinkPass": 73,
    "before": "[../specs/runner.md](../specs/runner.md)",
    "after": "[../specs/runner.md](runner/README.md)",
    "legacyPath": "docs/specs/runner.md",
    "target": {
      "path": "docs/platform/runner/README.md",
      "anchor": null,
      "aliasId": "step10-runner-0001"
    },
    "portal": false,
    "area": "platform-root",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/component-boundary.md",
    "line": 73,
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

## Entry f-026: link-026

```json
{
  "id": "link-026",
  "original": {
    "path": "docs/platform/component-boundary.md",
    "inputLine": 66,
    "inputColumn": 226,
    "lineBeforeLinkPass": 74,
    "before": "[../specs/herdr-web-dashboard.md](../specs/herdr-web-dashboard.md)",
    "after": "[../specs/herdr-web-dashboard.md](herdr-web-dashboard/spec.md)",
    "legacyPath": "docs/specs/herdr-web-dashboard.md",
    "target": {
      "path": "docs/platform/herdr-web-dashboard/spec.md",
      "anchor": null,
      "aliasId": "step10-specs-0328"
    },
    "portal": false,
    "area": "platform-root",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/component-boundary.md",
    "line": 74,
    "legacy": "docs/specs/herdr-web-dashboard.md",
    "previous": "[../specs/herdr-web-dashboard.md](herdr-web-dashboard/spec.md)",
    "now": "../specs/herdr-web-dashboard.md",
    "action": "restored-legacy",
    "reason": "provenance/legacy-owner",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../specs/herdr-web-dashboard.md",
  "interimDestination": "herdr-web-dashboard/spec.md",
  "newDestination": "../specs/herdr-web-dashboard.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/specs/herdr-web-dashboard.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "a1c2c500b8cbd573b965fc94ee80d3730237a07ac8f83547d0eda8a5c2e66a1d"
  },
  "referentPreservation": {
    "declaredReferent": "docs/specs/herdr-web-dashboard.md",
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

## Entry f-027: link-027

```json
{
  "id": "link-027",
  "original": {
    "path": "docs/platform/component-boundary.md",
    "inputLine": 67,
    "inputColumn": 559,
    "lineBeforeLinkPass": 75,
    "before": "[../specs/herdr-web-dashboard.md](../specs/herdr-web-dashboard.md)",
    "after": "[../specs/herdr-web-dashboard.md](herdr-web-dashboard/spec.md)",
    "legacyPath": "docs/specs/herdr-web-dashboard.md",
    "target": {
      "path": "docs/platform/herdr-web-dashboard/spec.md",
      "anchor": null,
      "aliasId": "step10-specs-0328"
    },
    "portal": false,
    "area": "platform-root",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/component-boundary.md",
    "line": 75,
    "legacy": "docs/specs/herdr-web-dashboard.md",
    "previous": "[../specs/herdr-web-dashboard.md](herdr-web-dashboard/spec.md)",
    "now": "../specs/herdr-web-dashboard.md",
    "action": "restored-legacy",
    "reason": "provenance/legacy-owner",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../specs/herdr-web-dashboard.md",
  "interimDestination": "herdr-web-dashboard/spec.md",
  "newDestination": "../specs/herdr-web-dashboard.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/specs/herdr-web-dashboard.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "a1c2c500b8cbd573b965fc94ee80d3730237a07ac8f83547d0eda8a5c2e66a1d"
  },
  "referentPreservation": {
    "declaredReferent": "docs/specs/herdr-web-dashboard.md",
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

## Entry f-028: link-028

```json
{
  "id": "link-028",
  "original": {
    "path": "docs/platform/component-boundary.md",
    "inputLine": 68,
    "inputColumn": 446,
    "lineBeforeLinkPass": 76,
    "before": "[../specs/confinement-authority.md](../specs/confinement-authority.md)",
    "after": "[../specs/confinement-authority.md](agent-confinement/README.md)",
    "legacyPath": "docs/specs/confinement-authority.md",
    "target": {
      "path": "docs/platform/agent-confinement/README.md",
      "anchor": null,
      "aliasId": "step10-specs-0001"
    },
    "portal": false,
    "area": "platform-root",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/component-boundary.md",
    "line": 76,
    "legacy": "docs/specs/confinement-authority.md",
    "previous": "[../specs/confinement-authority.md](agent-confinement/README.md)",
    "now": "../specs/confinement-authority.md",
    "action": "restored-legacy",
    "reason": "provenance/legacy-owner",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../specs/confinement-authority.md",
  "interimDestination": "agent-confinement/README.md",
  "newDestination": "../specs/confinement-authority.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/specs/confinement-authority.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "98f10ba191b729edbe2bfbec7a6ade8047466146ef470345688e6f9f6b9456d6"
  },
  "referentPreservation": {
    "declaredReferent": "docs/specs/confinement-authority.md",
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

## Entry f-029: link-029

```json
{
  "id": "link-029",
  "original": {
    "path": "docs/platform/component-boundary.md",
    "inputLine": 69,
    "inputColumn": 85,
    "lineBeforeLinkPass": 77,
    "before": "[../architect/agent-coordination/architecture/evidence-and-results.md](../architect/agent-coordination/architecture/evidence-and-results.md)",
    "after": "[../architect/agent-coordination/architecture/evidence-and-results.md](agent-coordination/README.md)",
    "legacyPath": "docs/architect/agent-coordination/architecture/evidence-and-results.md",
    "target": {
      "path": "docs/platform/agent-coordination/README.md",
      "anchor": null,
      "aliasId": "step10-agent-coordination-0173"
    },
    "portal": false,
    "area": "platform-root",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/component-boundary.md",
    "line": 77,
    "legacy": "docs/architect/agent-coordination/architecture/evidence-and-results.md",
    "previous": "[../architect/agent-coordination/architecture/evidence-and-results.md](agent-coordination/README.md)",
    "now": "../architect/agent-coordination/architecture/evidence-and-results.md",
    "action": "restored-legacy",
    "reason": "provenance/legacy-owner",
    "selfBefore": false,
    "portalBefore": true
  },
  "oldDestination": "../architect/agent-coordination/architecture/evidence-and-results.md",
  "interimDestination": "agent-coordination/README.md",
  "newDestination": "../architect/agent-coordination/architecture/evidence-and-results.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/architect/agent-coordination/architecture/evidence-and-results.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "2b0ef96800305165cba68664df0bc8ad38ffbace4a3482cb8570f79fbd930fb0"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/agent-coordination/architecture/evidence-and-results.md",
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

## Entry f-030: link-030

```json
{
  "id": "link-030",
  "original": {
    "path": "docs/platform/component-boundary.md",
    "inputLine": 74,
    "inputColumn": 199,
    "lineBeforeLinkPass": 82,
    "before": "[../specs/observe.md](../specs/observe.md)",
    "after": "[../specs/observe.md](observe/README.md)",
    "legacyPath": "docs/specs/observe.md",
    "target": {
      "path": "docs/platform/observe/README.md",
      "anchor": null,
      "aliasId": "step10-specs-0373"
    },
    "portal": false,
    "area": "platform-root",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/component-boundary.md",
    "line": 82,
    "legacy": "docs/specs/observe.md",
    "previous": "[../specs/observe.md](observe/README.md)",
    "now": "../specs/observe.md",
    "action": "restored-legacy",
    "reason": "provenance/legacy-owner",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../specs/observe.md",
  "interimDestination": "observe/README.md",
  "newDestination": "../specs/observe.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/specs/observe.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "f367b7dbe06df621ddc178e6fd7d1f610483e1504dec324fb1dfd49c97ee5272"
  },
  "referentPreservation": {
    "declaredReferent": "docs/specs/observe.md",
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

## Entry f-031: link-031

```json
{
  "id": "link-031",
  "original": {
    "path": "docs/platform/component-boundary.md",
    "inputLine": 89,
    "inputColumn": 40,
    "lineBeforeLinkPass": 97,
    "before": "[../architect/component-boundary/component-boundary-advisory.md](../architect/component-boundary/component-boundary-advisory.md)",
    "after": "[../architect/component-boundary/component-boundary-advisory.md](component-boundary.md)",
    "legacyPath": "docs/architect/component-boundary/component-boundary-advisory.md",
    "target": {
      "path": "docs/platform/component-boundary.md",
      "anchor": null,
      "aliasId": "step10-whole-system-0212"
    },
    "portal": false,
    "area": "platform-root",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/component-boundary.md",
    "line": 97,
    "legacy": "docs/architect/component-boundary/component-boundary-advisory.md",
    "previous": "[../architect/component-boundary/component-boundary-advisory.md](component-boundary.md)",
    "now": "../architect/component-boundary/component-boundary-advisory.md",
    "action": "restored-legacy",
    "reason": "self-link",
    "selfBefore": true,
    "portalBefore": false
  },
  "oldDestination": "../architect/component-boundary/component-boundary-advisory.md",
  "interimDestination": "component-boundary.md",
  "newDestination": "../architect/component-boundary/component-boundary-advisory.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/architect/component-boundary/component-boundary-advisory.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "913cbbc9419fc059e5ce1dcaeb7d06d6d90d6e9d3ef45195c15cd59ff0359bf3"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/component-boundary/component-boundary-advisory.md",
    "action": "restored-legacy",
    "reason": "self-link",
    "selfRestored": true,
    "portalRetargeted": false,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-032: link-032

```json
{
  "id": "link-032",
  "original": {
    "path": "docs/platform/component-boundary.md",
    "inputLine": 90,
    "inputColumn": 25,
    "lineBeforeLinkPass": 98,
    "before": "[../architect/proposals/component-authority-boundary-map.md](../architect/proposals/component-authority-boundary-map.md)",
    "after": "[../architect/proposals/component-authority-boundary-map.md](proposals/component-authority-boundary-map.md)",
    "legacyPath": "docs/architect/proposals/component-authority-boundary-map.md",
    "target": {
      "path": "docs/platform/proposals/component-authority-boundary-map.md",
      "anchor": null,
      "aliasId": "step10-proposals-redesigns-0130"
    },
    "portal": false,
    "area": "platform-root",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/component-boundary.md",
    "line": 98,
    "legacy": "docs/architect/proposals/component-authority-boundary-map.md",
    "previous": "[../architect/proposals/component-authority-boundary-map.md](proposals/component-authority-boundary-map.md)",
    "now": "proposals/component-authority-boundary-map.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../architect/proposals/component-authority-boundary-map.md",
  "interimDestination": "proposals/component-authority-boundary-map.md",
  "newDestination": "proposals/component-authority-boundary-map.md",
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

## Entry f-033: link-033

```json
{
  "id": "link-033",
  "original": {
    "path": "docs/platform/component-boundary.md",
    "inputLine": 92,
    "inputColumn": 23,
    "lineBeforeLinkPass": 100,
    "before": "[../specs/observe.md](../specs/observe.md)",
    "after": "[../specs/observe.md](observe/README.md)",
    "legacyPath": "docs/specs/observe.md",
    "target": {
      "path": "docs/platform/observe/README.md",
      "anchor": null,
      "aliasId": "step10-specs-0373"
    },
    "portal": false,
    "area": "platform-root",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/component-boundary.md",
    "line": 100,
    "legacy": "docs/specs/observe.md",
    "previous": "[../specs/observe.md](observe/README.md)",
    "now": "observe/spec.md",
    "action": "retargeted-specific",
    "reason": "specific-candidate",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../specs/observe.md",
  "interimDestination": "observe/README.md",
  "newDestination": "observe/spec.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/observe/spec.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "7d5af39a688b9d58aa850508da571871f0a2fc1d5be5ccdb74d6466d5d7b5e71"
  },
  "referentPreservation": {
    "declaredReferent": "docs/specs/observe.md",
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

## Entry f-034: link-034

```json
{
  "id": "link-034",
  "original": {
    "path": "docs/platform/component-boundary.md",
    "inputLine": 105,
    "inputColumn": 10,
    "lineBeforeLinkPass": 113,
    "before": "[Architecture Map](../architecture-map.md)",
    "after": "[Architecture Map](architecture-map.md)",
    "legacyPath": "docs/architecture-map.md",
    "target": {
      "path": "docs/platform/architecture-map.md",
      "anchor": null,
      "aliasId": "step10-whole-system-1520"
    },
    "portal": false,
    "area": "platform-root",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/component-boundary.md",
    "line": 113,
    "legacy": "docs/architecture-map.md",
    "previous": "[Architecture Map](architecture-map.md)",
    "now": "architecture-map.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../architecture-map.md",
  "interimDestination": "architecture-map.md",
  "newDestination": "architecture-map.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/architecture-map.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "fb3f6e2da6cbe36758cd0889886e20221163012805c2dae3dffd1cb5465eab89"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architecture-map.md",
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

## Entry f-035: link-035

```json
{
  "id": "link-035",
  "original": {
    "path": "docs/platform/component-boundary.md",
    "inputLine": 105,
    "inputColumn": 54,
    "lineBeforeLinkPass": 113,
    "before": "[System Overview](../specs/system-overview.md)",
    "after": "[System Overview](system-overview/spec.md)",
    "legacyPath": "docs/specs/system-overview.md",
    "target": {
      "path": "docs/platform/system-overview/spec.md",
      "anchor": null,
      "aliasId": "step10-specs-0399"
    },
    "portal": false,
    "area": "platform-root",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/component-boundary.md",
    "line": 113,
    "legacy": "docs/specs/system-overview.md",
    "previous": "[System Overview](system-overview/spec.md)",
    "now": "system-overview/spec.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../specs/system-overview.md",
  "interimDestination": "system-overview/spec.md",
  "newDestination": "system-overview/spec.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/system-overview/spec.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "b027026ae37327e96ce572c9a06fdaebf7d5146625c1abeb10b3bdcb033b0e54"
  },
  "referentPreservation": {
    "declaredReferent": "docs/specs/system-overview.md",
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

## Entry f-036: link-036

```json
{
  "id": "link-036",
  "original": {
    "path": "docs/platform/component-boundary.md",
    "inputLine": 105,
    "inputColumn": 102,
    "lineBeforeLinkPass": 113,
    "before": "[Platform Foundations](../platform-foundations.md)",
    "after": "[Platform Foundations](platform-foundations.md)",
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
    "file": "docs/platform/component-boundary.md",
    "line": 113,
    "legacy": "docs/platform-foundations.md",
    "previous": "[Platform Foundations](platform-foundations.md)",
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

## Entry f-037: link-037

```json
{
  "id": "link-037",
  "original": {
    "path": "docs/platform/component-boundary.md",
    "inputLine": 105,
    "inputColumn": 154,
    "lineBeforeLinkPass": 113,
    "before": "[Domainization Architecture](../architect/domainization/README.md)",
    "after": "[Domainization Architecture](domainization/architecture/domainization.md)",
    "legacyPath": "docs/architect/domainization/README.md",
    "target": {
      "path": "docs/platform/domainization/architecture/domainization.md",
      "anchor": null,
      "aliasId": "step10-whole-system-1018"
    },
    "portal": false,
    "area": "platform-root",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/component-boundary.md",
    "line": 113,
    "legacy": "docs/architect/domainization/README.md",
    "previous": "[Domainization Architecture](domainization/architecture/domainization.md)",
    "now": "domainization/architecture/domainization.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../architect/domainization/README.md",
  "interimDestination": "domainization/architecture/domainization.md",
  "newDestination": "domainization/architecture/domainization.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/domainization/architecture/domainization.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "286644bd4a86e60c872cb890bb73d3aa05da605364e0dfc4c87831a79e9fd1cb"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/domainization/README.md",
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

## Entry f-038: link-038

```json
{
  "id": "link-038",
  "original": {
    "path": "docs/platform/component-boundary.md",
    "inputLine": 105,
    "inputColumn": 222,
    "lineBeforeLinkPass": 113,
    "before": "[Agent Coordination Foundation Vision](../architect/agent-coordination/vision.md)",
    "after": "[Agent Coordination Foundation Vision](agent-coordination/README.md)",
    "legacyPath": "docs/architect/agent-coordination/vision.md",
    "target": {
      "path": "docs/platform/agent-coordination/README.md",
      "anchor": null,
      "aliasId": "step10-agent-coordination-4330"
    },
    "portal": false,
    "area": "platform-root",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/component-boundary.md",
    "line": 113,
    "legacy": "docs/architect/agent-coordination/vision.md",
    "previous": "[Agent Coordination Foundation Vision](agent-coordination/README.md)",
    "now": "agent-coordination/vision.md",
    "action": "retargeted-specific",
    "reason": "specific-candidate",
    "selfBefore": false,
    "portalBefore": true
  },
  "oldDestination": "../architect/agent-coordination/vision.md",
  "interimDestination": "agent-coordination/README.md",
  "newDestination": "agent-coordination/vision.md",
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

## Entry f-039: link-039

```json
{
  "id": "link-039",
  "original": {
    "path": "docs/platform/component-boundary.md",
    "inputLine": 105,
    "inputColumn": 305,
    "lineBeforeLinkPass": 113,
    "before": "[Concept Relationships](../architect/agent-coordination/vocabulary/concept-relationships.md)",
    "after": "[Concept Relationships](agent-coordination/README.md)",
    "legacyPath": "docs/architect/agent-coordination/vocabulary/concept-relationships.md",
    "target": {
      "path": "docs/platform/agent-coordination/README.md",
      "anchor": null,
      "aliasId": "step10-agent-coordination-4541"
    },
    "portal": false,
    "area": "platform-root",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/component-boundary.md",
    "line": 113,
    "legacy": "docs/architect/agent-coordination/vocabulary/concept-relationships.md",
    "previous": "[Concept Relationships](agent-coordination/README.md)",
    "now": "agent-coordination/vocabulary/concept-relationships.md",
    "action": "retargeted-specific",
    "reason": "specific-candidate",
    "selfBefore": false,
    "portalBefore": true
  },
  "oldDestination": "../architect/agent-coordination/vocabulary/concept-relationships.md",
  "interimDestination": "agent-coordination/README.md",
  "newDestination": "agent-coordination/vocabulary/concept-relationships.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/agent-coordination/vocabulary/concept-relationships.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "5a9156c115ce392be1bed0cb8288b7c38625c437b0e9a21de171037e85de4e11"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/agent-coordination/vocabulary/concept-relationships.md",
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

## Entry f-040: link-040

```json
{
  "id": "link-040",
  "original": {
    "path": "docs/platform/component-boundary.md",
    "inputLine": 105,
    "inputColumn": 399,
    "lineBeforeLinkPass": 113,
    "before": "[Dispatch Control Plane](../architect/agent-coordination/architecture/dispatch-control-plane.md)",
    "after": "[Dispatch Control Plane](agent-coordination/README.md)",
    "legacyPath": "docs/architect/agent-coordination/architecture/dispatch-control-plane.md",
    "target": {
      "path": "docs/platform/agent-coordination/README.md",
      "anchor": null,
      "aliasId": "step10-agent-coordination-0122"
    },
    "portal": false,
    "area": "platform-root",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/component-boundary.md",
    "line": 113,
    "legacy": "docs/architect/agent-coordination/architecture/dispatch-control-plane.md",
    "previous": "[Dispatch Control Plane](agent-coordination/README.md)",
    "now": "agent-coordination/architecture/dispatch-control-plane.md",
    "action": "retargeted-specific",
    "reason": "specific-candidate",
    "selfBefore": false,
    "portalBefore": true
  },
  "oldDestination": "../architect/agent-coordination/architecture/dispatch-control-plane.md",
  "interimDestination": "agent-coordination/README.md",
  "newDestination": "agent-coordination/architecture/dispatch-control-plane.md",
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

## Entry f-041: link-041

```json
{
  "id": "link-041",
  "original": {
    "path": "docs/platform/component-boundary.md",
    "inputLine": 105,
    "inputColumn": 497,
    "lineBeforeLinkPass": 113,
    "before": "[Protocol Model](../architect/agent-coordination/architecture/protocol-model.md)",
    "after": "[Protocol Model](agent-coordination/README.md)",
    "legacyPath": "docs/architect/agent-coordination/architecture/protocol-model.md",
    "target": {
      "path": "docs/platform/agent-coordination/README.md",
      "anchor": null,
      "aliasId": "step10-agent-coordination-0260"
    },
    "portal": false,
    "area": "platform-root",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/component-boundary.md",
    "line": 113,
    "legacy": "docs/architect/agent-coordination/architecture/protocol-model.md",
    "previous": "[Protocol Model](agent-coordination/README.md)",
    "now": "agent-coordination/architecture/protocol-model.md",
    "action": "retargeted-specific",
    "reason": "specific-candidate",
    "selfBefore": false,
    "portalBefore": true
  },
  "oldDestination": "../architect/agent-coordination/architecture/protocol-model.md",
  "interimDestination": "agent-coordination/README.md",
  "newDestination": "agent-coordination/architecture/protocol-model.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/agent-coordination/architecture/protocol-model.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "726b5d36a7a0ee13be3b795cacf856be63394b0e4d42481ef1f1641a6d840967"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/agent-coordination/architecture/protocol-model.md",
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

## Entry f-042: link-042

```json
{
  "id": "link-042",
  "original": {
    "path": "docs/platform/component-boundary.md",
    "inputLine": 105,
    "inputColumn": 579,
    "lineBeforeLinkPass": 113,
    "before": "[CoordinationSession Contract](../architect/agent-coordination/contracts/coordination-session.md)",
    "after": "[CoordinationSession Contract](agent-coordination/history/retired-engine/files/contracts/coordination-session.md)",
    "legacyPath": "docs/architect/agent-coordination/contracts/coordination-session.md",
    "target": {
      "path": "docs/platform/agent-coordination/history/retired-engine/files/contracts/coordination-session.md",
      "anchor": null,
      "aliasId": "step10-agent-coordination-0510"
    },
    "portal": false,
    "area": "platform-root",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/component-boundary.md",
    "line": 113,
    "legacy": "docs/architect/agent-coordination/contracts/coordination-session.md",
    "previous": "[CoordinationSession Contract](agent-coordination/history/retired-engine/files/contracts/coordination-session.md)",
    "now": "agent-coordination/history/retired-engine/files/contracts/coordination-session.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../architect/agent-coordination/contracts/coordination-session.md",
  "interimDestination": "agent-coordination/history/retired-engine/files/contracts/coordination-session.md",
  "newDestination": "agent-coordination/history/retired-engine/files/contracts/coordination-session.md",
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

## Entry f-043: link-043

```json
{
  "id": "link-043",
  "original": {
    "path": "docs/platform/component-boundary.md",
    "inputLine": 105,
    "inputColumn": 678,
    "lineBeforeLinkPass": 113,
    "before": "[FlowDefinition Contract](../architect/agent-coordination/contracts/flow-definition.md)",
    "after": "[FlowDefinition Contract](agent-coordination/history/retired-engine/files/contracts/flow-definition.md)",
    "legacyPath": "docs/architect/agent-coordination/contracts/flow-definition.md",
    "target": {
      "path": "docs/platform/agent-coordination/history/retired-engine/files/contracts/flow-definition.md",
      "anchor": null,
      "aliasId": "step10-agent-coordination-0625"
    },
    "portal": false,
    "area": "platform-root",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/component-boundary.md",
    "line": 113,
    "legacy": "docs/architect/agent-coordination/contracts/flow-definition.md",
    "previous": "[FlowDefinition Contract](agent-coordination/history/retired-engine/files/contracts/flow-definition.md)",
    "now": "agent-coordination/history/retired-engine/files/contracts/flow-definition.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../architect/agent-coordination/contracts/flow-definition.md",
  "interimDestination": "agent-coordination/history/retired-engine/files/contracts/flow-definition.md",
  "newDestination": "agent-coordination/history/retired-engine/files/contracts/flow-definition.md",
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

## Entry f-044: link-044

```json
{
  "id": "link-044",
  "original": {
    "path": "docs/platform/component-boundary.md",
    "inputLine": 237,
    "inputColumn": 433,
    "lineBeforeLinkPass": 245,
    "before": "[Work-State Spec](../specs/work-state.md)",
    "after": "[Work-State Spec](work-state/README.md)",
    "legacyPath": "docs/specs/work-state.md",
    "target": {
      "path": "docs/platform/work-state/README.md",
      "anchor": null,
      "aliasId": "root-authorities-draft-0073"
    },
    "portal": false,
    "area": "platform-root",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/component-boundary.md",
    "line": 245,
    "legacy": "docs/specs/work-state.md",
    "previous": "[Work-State Spec](work-state/README.md)",
    "now": "work-state/spec.md",
    "action": "retargeted-specific",
    "reason": "specific-candidate",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../specs/work-state.md",
  "interimDestination": "work-state/README.md",
  "newDestination": "work-state/spec.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/work-state/spec.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "e808b4e41f7dda3a1d5b3bee51999f1c4920a7716bee17f8535311f4f70bf15f"
  },
  "referentPreservation": {
    "declaredReferent": "docs/specs/work-state.md",
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

## Entry f-045: link-045

```json
{
  "id": "link-045",
  "original": {
    "path": "docs/platform/component-boundary.md",
    "inputLine": 237,
    "inputColumn": 540,
    "lineBeforeLinkPass": 245,
    "before": "[System Overview](../specs/system-overview.md)",
    "after": "[System Overview](system-overview/spec.md)",
    "legacyPath": "docs/specs/system-overview.md",
    "target": {
      "path": "docs/platform/system-overview/spec.md",
      "anchor": null,
      "aliasId": "step10-specs-0399"
    },
    "portal": false,
    "area": "platform-root",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/component-boundary.md",
    "line": 245,
    "legacy": "docs/specs/system-overview.md",
    "previous": "[System Overview](system-overview/spec.md)",
    "now": "system-overview/spec.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../specs/system-overview.md",
  "interimDestination": "system-overview/spec.md",
  "newDestination": "system-overview/spec.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/system-overview/spec.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "b027026ae37327e96ce572c9a06fdaebf7d5146625c1abeb10b3bdcb033b0e54"
  },
  "referentPreservation": {
    "declaredReferent": "docs/specs/system-overview.md",
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

## Entry f-046: link-046

```json
{
  "id": "link-046",
  "original": {
    "path": "docs/platform/component-boundary.md",
    "inputLine": 238,
    "inputColumn": 350,
    "lineBeforeLinkPass": 246,
    "before": "[Runner Spec](../specs/runner.md)",
    "after": "[Runner Spec](runner/README.md)",
    "legacyPath": "docs/specs/runner.md",
    "target": {
      "path": "docs/platform/runner/README.md",
      "anchor": null,
      "aliasId": "step10-runner-0001"
    },
    "portal": false,
    "area": "platform-root",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/component-boundary.md",
    "line": 246,
    "legacy": "docs/specs/runner.md",
    "previous": "[Runner Spec](runner/README.md)",
    "now": "runner/spec.md",
    "action": "retargeted-specific",
    "reason": "specific-candidate",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../specs/runner.md",
  "interimDestination": "runner/README.md",
  "newDestination": "runner/spec.md",
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

## Entry f-047: link-047

```json
{
  "id": "link-047",
  "original": {
    "path": "docs/platform/component-boundary.md",
    "inputLine": 239,
    "inputColumn": 312,
    "lineBeforeLinkPass": 247,
    "before": "[Runner Spec](../specs/runner.md)",
    "after": "[Runner Spec](runner/README.md)",
    "legacyPath": "docs/specs/runner.md",
    "target": {
      "path": "docs/platform/runner/README.md",
      "anchor": null,
      "aliasId": "step10-runner-0001"
    },
    "portal": false,
    "area": "platform-root",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/component-boundary.md",
    "line": 247,
    "legacy": "docs/specs/runner.md",
    "previous": "[Runner Spec](runner/README.md)",
    "now": "runner/spec.md",
    "action": "retargeted-specific",
    "reason": "specific-candidate",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../specs/runner.md",
  "interimDestination": "runner/README.md",
  "newDestination": "runner/spec.md",
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

## Entry f-048: link-048

```json
{
  "id": "link-048",
  "original": {
    "path": "docs/platform/component-boundary.md",
    "inputLine": 239,
    "inputColumn": 347,
    "lineBeforeLinkPass": 247,
    "before": "[Dispatch Control Plane](../architect/agent-coordination/architecture/dispatch-control-plane.md)",
    "after": "[Dispatch Control Plane](agent-coordination/README.md)",
    "legacyPath": "docs/architect/agent-coordination/architecture/dispatch-control-plane.md",
    "target": {
      "path": "docs/platform/agent-coordination/README.md",
      "anchor": null,
      "aliasId": "step10-agent-coordination-0122"
    },
    "portal": false,
    "area": "platform-root",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/component-boundary.md",
    "line": 247,
    "legacy": "docs/architect/agent-coordination/architecture/dispatch-control-plane.md",
    "previous": "[Dispatch Control Plane](agent-coordination/README.md)",
    "now": "agent-coordination/architecture/dispatch-control-plane.md",
    "action": "retargeted-specific",
    "reason": "specific-candidate",
    "selfBefore": false,
    "portalBefore": true
  },
  "oldDestination": "../architect/agent-coordination/architecture/dispatch-control-plane.md",
  "interimDestination": "agent-coordination/README.md",
  "newDestination": "agent-coordination/architecture/dispatch-control-plane.md",
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

## Entry f-049: link-049

```json
{
  "id": "link-049",
  "original": {
    "path": "docs/platform/component-boundary.md",
    "inputLine": 239,
    "inputColumn": 445,
    "lineBeforeLinkPass": 247,
    "before": "[Assignment/Run/RunResult Contract](../architect/agent-coordination/contracts/assignment-run-runresult.md)",
    "after": "[Assignment/Run/RunResult Contract](agent-coordination/README.md)",
    "legacyPath": "docs/architect/agent-coordination/contracts/assignment-run-runresult.md",
    "target": {
      "path": "docs/platform/agent-coordination/README.md",
      "anchor": null,
      "aliasId": "step10-agent-coordination-0457"
    },
    "portal": false,
    "area": "platform-root",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/component-boundary.md",
    "line": 247,
    "legacy": "docs/architect/agent-coordination/contracts/assignment-run-runresult.md",
    "previous": "[Assignment/Run/RunResult Contract](agent-coordination/README.md)",
    "now": "agent-coordination/contracts/assignment-run-runresult.md",
    "action": "retargeted-specific",
    "reason": "specific-candidate",
    "selfBefore": false,
    "portalBefore": true
  },
  "oldDestination": "../architect/agent-coordination/contracts/assignment-run-runresult.md",
  "interimDestination": "agent-coordination/README.md",
  "newDestination": "agent-coordination/contracts/assignment-run-runresult.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/agent-coordination/contracts/assignment-run-runresult.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "535f6be79291bd2e15602a338e67157296c078e74034450d1a075d7148683f3d"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/agent-coordination/contracts/assignment-run-runresult.md",
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

## Entry f-050: link-050

```json
{
  "id": "link-050",
  "original": {
    "path": "docs/platform/component-boundary.md",
    "inputLine": 240,
    "inputColumn": 321,
    "lineBeforeLinkPass": 248,
    "before": "[Evidence And Results](../architect/agent-coordination/architecture/evidence-and-results.md)",
    "after": "[Evidence And Results](agent-coordination/README.md)",
    "legacyPath": "docs/architect/agent-coordination/architecture/evidence-and-results.md",
    "target": {
      "path": "docs/platform/agent-coordination/README.md",
      "anchor": null,
      "aliasId": "step10-agent-coordination-0173"
    },
    "portal": false,
    "area": "platform-root",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/component-boundary.md",
    "line": 248,
    "legacy": "docs/architect/agent-coordination/architecture/evidence-and-results.md",
    "previous": "[Evidence And Results](agent-coordination/README.md)",
    "now": "agent-coordination/architecture/evidence-and-results.md",
    "action": "retargeted-specific",
    "reason": "specific-candidate",
    "selfBefore": false,
    "portalBefore": true
  },
  "oldDestination": "../architect/agent-coordination/architecture/evidence-and-results.md",
  "interimDestination": "agent-coordination/README.md",
  "newDestination": "agent-coordination/architecture/evidence-and-results.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/agent-coordination/architecture/evidence-and-results.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "916fe71f475cad3e19f137283017d3c732912354051e5b526a2ee4fff744a346"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/agent-coordination/architecture/evidence-and-results.md",
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

## Entry f-051: link-051

```json
{
  "id": "link-051",
  "original": {
    "path": "docs/platform/component-boundary.md",
    "inputLine": 240,
    "inputColumn": 415,
    "lineBeforeLinkPass": 248,
    "before": "[Assignment/Run/RunResult Contract](../architect/agent-coordination/contracts/assignment-run-runresult.md)",
    "after": "[Assignment/Run/RunResult Contract](agent-coordination/README.md)",
    "legacyPath": "docs/architect/agent-coordination/contracts/assignment-run-runresult.md",
    "target": {
      "path": "docs/platform/agent-coordination/README.md",
      "anchor": null,
      "aliasId": "step10-agent-coordination-0457"
    },
    "portal": false,
    "area": "platform-root",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/component-boundary.md",
    "line": 248,
    "legacy": "docs/architect/agent-coordination/contracts/assignment-run-runresult.md",
    "previous": "[Assignment/Run/RunResult Contract](agent-coordination/README.md)",
    "now": "agent-coordination/contracts/assignment-run-runresult.md",
    "action": "retargeted-specific",
    "reason": "specific-candidate",
    "selfBefore": false,
    "portalBefore": true
  },
  "oldDestination": "../architect/agent-coordination/contracts/assignment-run-runresult.md",
  "interimDestination": "agent-coordination/README.md",
  "newDestination": "agent-coordination/contracts/assignment-run-runresult.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/agent-coordination/contracts/assignment-run-runresult.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "535f6be79291bd2e15602a338e67157296c078e74034450d1a075d7148683f3d"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/agent-coordination/contracts/assignment-run-runresult.md",
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

## Entry f-052: link-052

```json
{
  "id": "link-052",
  "original": {
    "path": "docs/platform/component-boundary.md",
    "inputLine": 240,
    "inputColumn": 523,
    "lineBeforeLinkPass": 248,
    "before": "[Runner Spec](../specs/runner.md)",
    "after": "[Runner Spec](runner/README.md)",
    "legacyPath": "docs/specs/runner.md",
    "target": {
      "path": "docs/platform/runner/README.md",
      "anchor": null,
      "aliasId": "step10-runner-0001"
    },
    "portal": false,
    "area": "platform-root",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/component-boundary.md",
    "line": 248,
    "legacy": "docs/specs/runner.md",
    "previous": "[Runner Spec](runner/README.md)",
    "now": "runner/spec.md",
    "action": "retargeted-specific",
    "reason": "specific-candidate",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../specs/runner.md",
  "interimDestination": "runner/README.md",
  "newDestination": "runner/spec.md",
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

## Entry f-053: link-053

```json
{
  "id": "link-053",
  "original": {
    "path": "docs/platform/component-boundary.md",
    "inputLine": 241,
    "inputColumn": 406,
    "lineBeforeLinkPass": 249,
    "before": "[Domainization Architecture](../architect/domainization/README.md)",
    "after": "[Domainization Architecture](domainization/architecture/domainization.md)",
    "legacyPath": "docs/architect/domainization/README.md",
    "target": {
      "path": "docs/platform/domainization/architecture/domainization.md",
      "anchor": null,
      "aliasId": "step10-whole-system-1018"
    },
    "portal": false,
    "area": "platform-root",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/component-boundary.md",
    "line": 249,
    "legacy": "docs/architect/domainization/README.md",
    "previous": "[Domainization Architecture](domainization/architecture/domainization.md)",
    "now": "domainization/architecture/domainization.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../architect/domainization/README.md",
  "interimDestination": "domainization/architecture/domainization.md",
  "newDestination": "domainization/architecture/domainization.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/domainization/architecture/domainization.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "286644bd4a86e60c872cb890bb73d3aa05da605364e0dfc4c87831a79e9fd1cb"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/domainization/README.md",
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

## Entry f-054: link-054

```json
{
  "id": "link-054",
  "original": {
    "path": "docs/platform/component-boundary.md",
    "inputLine": 241,
    "inputColumn": 474,
    "lineBeforeLinkPass": 249,
    "before": "[System Overview](../specs/system-overview.md)",
    "after": "[System Overview](system-overview/spec.md)",
    "legacyPath": "docs/specs/system-overview.md",
    "target": {
      "path": "docs/platform/system-overview/spec.md",
      "anchor": null,
      "aliasId": "step10-specs-0399"
    },
    "portal": false,
    "area": "platform-root",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/component-boundary.md",
    "line": 249,
    "legacy": "docs/specs/system-overview.md",
    "previous": "[System Overview](system-overview/spec.md)",
    "now": "system-overview/spec.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../specs/system-overview.md",
  "interimDestination": "system-overview/spec.md",
  "newDestination": "system-overview/spec.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/system-overview/spec.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "b027026ae37327e96ce572c9a06fdaebf7d5146625c1abeb10b3bdcb033b0e54"
  },
  "referentPreservation": {
    "declaredReferent": "docs/specs/system-overview.md",
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

## Entry f-055: link-055

```json
{
  "id": "link-055",
  "original": {
    "path": "docs/platform/component-boundary.md",
    "inputLine": 242,
    "inputColumn": 337,
    "lineBeforeLinkPass": 250,
    "before": "[fgOS Plugin Spec](../specs/fgos-plugin.md)",
    "after": "[fgOS Plugin Spec](claude-plugin/spec.md)",
    "legacyPath": "docs/specs/fgos-plugin.md",
    "target": {
      "path": "docs/platform/claude-plugin/spec.md",
      "anchor": null,
      "aliasId": "step10-specs-0282"
    },
    "portal": false,
    "area": "platform-root",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/component-boundary.md",
    "line": 250,
    "legacy": "docs/specs/fgos-plugin.md",
    "previous": "[fgOS Plugin Spec](claude-plugin/spec.md)",
    "now": "claude-plugin/spec.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../specs/fgos-plugin.md",
  "interimDestination": "claude-plugin/spec.md",
  "newDestination": "claude-plugin/spec.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/claude-plugin/spec.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "428f4043212d8b0fc7e635957f956db9be01549b6ddc9c9228cf5a79da8007bb"
  },
  "referentPreservation": {
    "declaredReferent": "docs/specs/fgos-plugin.md",
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

## Entry f-056: link-056

```json
{
  "id": "link-056",
  "original": {
    "path": "docs/platform/component-boundary.md",
    "inputLine": 242,
    "inputColumn": 382,
    "lineBeforeLinkPass": 250,
    "before": "[Herdr Web Dashboard Spec](../specs/herdr-web-dashboard.md)",
    "after": "[Herdr Web Dashboard Spec](herdr-web-dashboard/spec.md)",
    "legacyPath": "docs/specs/herdr-web-dashboard.md",
    "target": {
      "path": "docs/platform/herdr-web-dashboard/spec.md",
      "anchor": null,
      "aliasId": "step10-specs-0328"
    },
    "portal": false,
    "area": "platform-root",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/component-boundary.md",
    "line": 250,
    "legacy": "docs/specs/herdr-web-dashboard.md",
    "previous": "[Herdr Web Dashboard Spec](herdr-web-dashboard/spec.md)",
    "now": "herdr-web-dashboard/spec.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../specs/herdr-web-dashboard.md",
  "interimDestination": "herdr-web-dashboard/spec.md",
  "newDestination": "herdr-web-dashboard/spec.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/herdr-web-dashboard/spec.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "7b5fe48ff585963bfbfc903ac1aa840fa7db58a80a51d72d8cbf73008d9cff80"
  },
  "referentPreservation": {
    "declaredReferent": "docs/specs/herdr-web-dashboard.md",
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

## Entry f-057: link-057

```json
{
  "id": "link-057",
  "original": {
    "path": "docs/platform/component-boundary.md",
    "inputLine": 242,
    "inputColumn": 443,
    "lineBeforeLinkPass": 250,
    "before": "[Visibility And Herdr](../architect/agent-coordination/architecture/visibility-and-herdr.md)",
    "after": "[Visibility And Herdr](agent-coordination/README.md)",
    "legacyPath": "docs/architect/agent-coordination/architecture/visibility-and-herdr.md",
    "target": {
      "path": "docs/platform/agent-coordination/README.md",
      "anchor": null,
      "aliasId": "step10-agent-coordination-0407"
    },
    "portal": false,
    "area": "platform-root",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/component-boundary.md",
    "line": 250,
    "legacy": "docs/architect/agent-coordination/architecture/visibility-and-herdr.md",
    "previous": "[Visibility And Herdr](agent-coordination/README.md)",
    "now": "agent-coordination/architecture/visibility-and-herdr.md",
    "action": "retargeted-specific",
    "reason": "specific-candidate",
    "selfBefore": false,
    "portalBefore": true
  },
  "oldDestination": "../architect/agent-coordination/architecture/visibility-and-herdr.md",
  "interimDestination": "agent-coordination/README.md",
  "newDestination": "agent-coordination/architecture/visibility-and-herdr.md",
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

## Entry f-058: link-058

```json
{
  "id": "link-058",
  "original": {
    "path": "docs/platform/component-boundary.md",
    "inputLine": 242,
    "inputColumn": 537,
    "lineBeforeLinkPass": 250,
    "before": "[IO Contract](../io-contract.md)",
    "after": "[IO Contract](work-state/contracts/cli-io-contract.md)",
    "legacyPath": "docs/io-contract.md",
    "target": {
      "path": "docs/platform/work-state/contracts/cli-io-contract.md",
      "anchor": null,
      "aliasId": "root-authorities-draft-0027"
    },
    "portal": false,
    "area": "platform-root",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/component-boundary.md",
    "line": 250,
    "legacy": "docs/io-contract.md",
    "previous": "[IO Contract](work-state/contracts/cli-io-contract.md)",
    "now": "work-state/contracts/cli-io-contract.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../io-contract.md",
  "interimDestination": "work-state/contracts/cli-io-contract.md",
  "newDestination": "work-state/contracts/cli-io-contract.md",
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

## Entry f-059: link-059

```json
{
  "id": "link-059",
  "original": {
    "path": "docs/platform/component-boundary.md",
    "inputLine": 243,
    "inputColumn": 301,
    "lineBeforeLinkPass": 251,
    "before": "[Distribution Spec](../specs/distribution.md)",
    "after": "[Distribution Spec](packaging-distribution/README.md)",
    "legacyPath": "docs/specs/distribution.md",
    "target": {
      "path": "docs/platform/packaging-distribution/README.md",
      "anchor": null,
      "aliasId": "step10-specs-0245"
    },
    "portal": false,
    "area": "platform-root",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/component-boundary.md",
    "line": 251,
    "legacy": "docs/specs/distribution.md",
    "previous": "[Distribution Spec](packaging-distribution/README.md)",
    "now": "packaging-distribution/spec.md",
    "action": "retargeted-specific",
    "reason": "specific-candidate",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../specs/distribution.md",
  "interimDestination": "packaging-distribution/README.md",
  "newDestination": "packaging-distribution/spec.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/packaging-distribution/spec.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "3bc9692ff3b975d3c5f2206240f3b2a6f2dd12785996522e91b3be8c4c86ba4c"
  },
  "referentPreservation": {
    "declaredReferent": "docs/specs/distribution.md",
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

## Entry f-060: link-060

```json
{
  "id": "link-060",
  "original": {
    "path": "docs/platform/component-boundary.md",
    "inputLine": 244,
    "inputColumn": 439,
    "lineBeforeLinkPass": 252,
    "before": "[System Overview](../specs/system-overview.md)",
    "after": "[System Overview](system-overview/spec.md)",
    "legacyPath": "docs/specs/system-overview.md",
    "target": {
      "path": "docs/platform/system-overview/spec.md",
      "anchor": null,
      "aliasId": "step10-specs-0399"
    },
    "portal": false,
    "area": "platform-root",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/component-boundary.md",
    "line": 252,
    "legacy": "docs/specs/system-overview.md",
    "previous": "[System Overview](system-overview/spec.md)",
    "now": "system-overview/spec.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../specs/system-overview.md",
  "interimDestination": "system-overview/spec.md",
  "newDestination": "system-overview/spec.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/system-overview/spec.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "b027026ae37327e96ce572c9a06fdaebf7d5146625c1abeb10b3bdcb033b0e54"
  },
  "referentPreservation": {
    "declaredReferent": "docs/specs/system-overview.md",
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

## Entry f-061: link-061

```json
{
  "id": "link-061",
  "original": {
    "path": "docs/platform/component-boundary.md",
    "inputLine": 387,
    "inputColumn": 3,
    "lineBeforeLinkPass": 395,
    "before": "[Workflow Stage Operation Contract](../architect/agent-coordination/contracts/workflow-stage-operation.md)",
    "after": "[Workflow Stage Operation Contract](agent-coordination/README.md)",
    "legacyPath": "docs/architect/agent-coordination/contracts/workflow-stage-operation.md",
    "target": {
      "path": "docs/platform/agent-coordination/README.md",
      "anchor": null,
      "aliasId": "step10-agent-coordination-0697"
    },
    "portal": false,
    "area": "platform-root",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/component-boundary.md",
    "line": 395,
    "legacy": "docs/architect/agent-coordination/contracts/workflow-stage-operation.md",
    "previous": "[Workflow Stage Operation Contract](agent-coordination/README.md)",
    "now": "agent-coordination/contracts/workflow-stage-operation.md",
    "action": "retargeted-specific",
    "reason": "specific-candidate",
    "selfBefore": false,
    "portalBefore": true
  },
  "oldDestination": "../architect/agent-coordination/contracts/workflow-stage-operation.md",
  "interimDestination": "agent-coordination/README.md",
  "newDestination": "agent-coordination/contracts/workflow-stage-operation.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/agent-coordination/contracts/workflow-stage-operation.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "47228521c9c5c777a888ee5995300f8c44e4e1a7bd2906f03ee0616f7fa5a171"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/agent-coordination/contracts/workflow-stage-operation.md",
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

## Entry f-062: link-062

```json
{
  "id": "link-062",
  "original": {
    "path": "docs/platform/component-boundary.md",
    "inputLine": 388,
    "inputColumn": 3,
    "lineBeforeLinkPass": 396,
    "before": "[FlowDefinition Contract](../architect/agent-coordination/contracts/flow-definition.md)",
    "after": "[FlowDefinition Contract](agent-coordination/history/retired-engine/files/contracts/flow-definition.md)",
    "legacyPath": "docs/architect/agent-coordination/contracts/flow-definition.md",
    "target": {
      "path": "docs/platform/agent-coordination/history/retired-engine/files/contracts/flow-definition.md",
      "anchor": null,
      "aliasId": "step10-agent-coordination-0625"
    },
    "portal": false,
    "area": "platform-root",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/component-boundary.md",
    "line": 396,
    "legacy": "docs/architect/agent-coordination/contracts/flow-definition.md",
    "previous": "[FlowDefinition Contract](agent-coordination/history/retired-engine/files/contracts/flow-definition.md)",
    "now": "agent-coordination/history/retired-engine/files/contracts/flow-definition.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../architect/agent-coordination/contracts/flow-definition.md",
  "interimDestination": "agent-coordination/history/retired-engine/files/contracts/flow-definition.md",
  "newDestination": "agent-coordination/history/retired-engine/files/contracts/flow-definition.md",
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

## Entry f-063: link-063

```json
{
  "id": "link-063",
  "original": {
    "path": "docs/platform/component-boundary.md",
    "inputLine": 389,
    "inputColumn": 3,
    "lineBeforeLinkPass": 397,
    "before": "[CoordinationSession Contract](../architect/agent-coordination/contracts/coordination-session.md)",
    "after": "[CoordinationSession Contract](agent-coordination/history/retired-engine/files/contracts/coordination-session.md)",
    "legacyPath": "docs/architect/agent-coordination/contracts/coordination-session.md",
    "target": {
      "path": "docs/platform/agent-coordination/history/retired-engine/files/contracts/coordination-session.md",
      "anchor": null,
      "aliasId": "step10-agent-coordination-0510"
    },
    "portal": false,
    "area": "platform-root",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/component-boundary.md",
    "line": 397,
    "legacy": "docs/architect/agent-coordination/contracts/coordination-session.md",
    "previous": "[CoordinationSession Contract](agent-coordination/history/retired-engine/files/contracts/coordination-session.md)",
    "now": "agent-coordination/history/retired-engine/files/contracts/coordination-session.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../architect/agent-coordination/contracts/coordination-session.md",
  "interimDestination": "agent-coordination/history/retired-engine/files/contracts/coordination-session.md",
  "newDestination": "agent-coordination/history/retired-engine/files/contracts/coordination-session.md",
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

## Entry f-064: link-064

```json
{
  "id": "link-064",
  "original": {
    "path": "docs/platform/component-boundary.md",
    "inputLine": 390,
    "inputColumn": 25,
    "lineBeforeLinkPass": 398,
    "before": "[Assignment, Run, And RunResult Contract](../architect/agent-coordination/contracts/assignment-run-runresult.md)",
    "after": "[Assignment, Run, And RunResult Contract](agent-coordination/README.md)",
    "legacyPath": "docs/architect/agent-coordination/contracts/assignment-run-runresult.md",
    "target": {
      "path": "docs/platform/agent-coordination/README.md",
      "anchor": null,
      "aliasId": "step10-agent-coordination-0457"
    },
    "portal": false,
    "area": "platform-root",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/component-boundary.md",
    "line": 398,
    "legacy": "docs/architect/agent-coordination/contracts/assignment-run-runresult.md",
    "previous": "[Assignment, Run, And RunResult Contract](agent-coordination/README.md)",
    "now": "agent-coordination/contracts/assignment-run-runresult.md",
    "action": "retargeted-specific",
    "reason": "specific-candidate",
    "selfBefore": false,
    "portalBefore": true
  },
  "oldDestination": "../architect/agent-coordination/contracts/assignment-run-runresult.md",
  "interimDestination": "agent-coordination/README.md",
  "newDestination": "agent-coordination/contracts/assignment-run-runresult.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/agent-coordination/contracts/assignment-run-runresult.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "535f6be79291bd2e15602a338e67157296c078e74034450d1a075d7148683f3d"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/agent-coordination/contracts/assignment-run-runresult.md",
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

## Entry f-065: link-065

```json
{
  "id": "link-065",
  "original": {
    "path": "docs/platform/component-boundary.md",
    "inputLine": 391,
    "inputColumn": 18,
    "lineBeforeLinkPass": 399,
    "before": "[Assignment, Run, And RunResult Contract](../architect/agent-coordination/contracts/assignment-run-runresult.md)",
    "after": "[Assignment, Run, And RunResult Contract](agent-coordination/README.md)",
    "legacyPath": "docs/architect/agent-coordination/contracts/assignment-run-runresult.md",
    "target": {
      "path": "docs/platform/agent-coordination/README.md",
      "anchor": null,
      "aliasId": "step10-agent-coordination-0457"
    },
    "portal": false,
    "area": "platform-root",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/component-boundary.md",
    "line": 399,
    "legacy": "docs/architect/agent-coordination/contracts/assignment-run-runresult.md",
    "previous": "[Assignment, Run, And RunResult Contract](agent-coordination/README.md)",
    "now": "agent-coordination/contracts/assignment-run-runresult.md",
    "action": "retargeted-specific",
    "reason": "specific-candidate",
    "selfBefore": false,
    "portalBefore": true
  },
  "oldDestination": "../architect/agent-coordination/contracts/assignment-run-runresult.md",
  "interimDestination": "agent-coordination/README.md",
  "newDestination": "agent-coordination/contracts/assignment-run-runresult.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/agent-coordination/contracts/assignment-run-runresult.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "535f6be79291bd2e15602a338e67157296c078e74034450d1a075d7148683f3d"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/agent-coordination/contracts/assignment-run-runresult.md",
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

## Entry f-066: link-066

```json
{
  "id": "link-066",
  "original": {
    "path": "docs/platform/component-boundary.md",
    "inputLine": 392,
    "inputColumn": 40,
    "lineBeforeLinkPass": 400,
    "before": "[Assignment, Run, And RunResult Contract](../architect/agent-coordination/contracts/assignment-run-runresult.md)",
    "after": "[Assignment, Run, And RunResult Contract](agent-coordination/README.md)",
    "legacyPath": "docs/architect/agent-coordination/contracts/assignment-run-runresult.md",
    "target": {
      "path": "docs/platform/agent-coordination/README.md",
      "anchor": null,
      "aliasId": "step10-agent-coordination-0457"
    },
    "portal": false,
    "area": "platform-root",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/component-boundary.md",
    "line": 400,
    "legacy": "docs/architect/agent-coordination/contracts/assignment-run-runresult.md",
    "previous": "[Assignment, Run, And RunResult Contract](agent-coordination/README.md)",
    "now": "agent-coordination/contracts/assignment-run-runresult.md",
    "action": "retargeted-specific",
    "reason": "specific-candidate",
    "selfBefore": false,
    "portalBefore": true
  },
  "oldDestination": "../architect/agent-coordination/contracts/assignment-run-runresult.md",
  "interimDestination": "agent-coordination/README.md",
  "newDestination": "agent-coordination/contracts/assignment-run-runresult.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/agent-coordination/contracts/assignment-run-runresult.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "535f6be79291bd2e15602a338e67157296c078e74034450d1a075d7148683f3d"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/agent-coordination/contracts/assignment-run-runresult.md",
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

## Entry f-067: link-067

```json
{
  "id": "link-067",
  "original": {
    "path": "docs/platform/component-boundary.md",
    "inputLine": 393,
    "inputColumn": 3,
    "lineBeforeLinkPass": 401,
    "before": "[Dispatch Control Plane](../architect/agent-coordination/architecture/dispatch-control-plane.md)",
    "after": "[Dispatch Control Plane](agent-coordination/README.md)",
    "legacyPath": "docs/architect/agent-coordination/architecture/dispatch-control-plane.md",
    "target": {
      "path": "docs/platform/agent-coordination/README.md",
      "anchor": null,
      "aliasId": "step10-agent-coordination-0122"
    },
    "portal": false,
    "area": "platform-root",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/component-boundary.md",
    "line": 401,
    "legacy": "docs/architect/agent-coordination/architecture/dispatch-control-plane.md",
    "previous": "[Dispatch Control Plane](agent-coordination/README.md)",
    "now": "agent-coordination/architecture/dispatch-control-plane.md",
    "action": "retargeted-specific",
    "reason": "specific-candidate",
    "selfBefore": false,
    "portalBefore": true
  },
  "oldDestination": "../architect/agent-coordination/architecture/dispatch-control-plane.md",
  "interimDestination": "agent-coordination/README.md",
  "newDestination": "agent-coordination/architecture/dispatch-control-plane.md",
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

## Entry f-068: link-068

```json
{
  "id": "link-068",
  "original": {
    "path": "docs/platform/component-boundary.md",
    "inputLine": 394,
    "inputColumn": 3,
    "lineBeforeLinkPass": 402,
    "before": "[Evidence And Result Architecture](../architect/agent-coordination/architecture/evidence-and-results.md)",
    "after": "[Evidence And Result Architecture](agent-coordination/README.md)",
    "legacyPath": "docs/architect/agent-coordination/architecture/evidence-and-results.md",
    "target": {
      "path": "docs/platform/agent-coordination/README.md",
      "anchor": null,
      "aliasId": "step10-agent-coordination-0173"
    },
    "portal": false,
    "area": "platform-root",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/component-boundary.md",
    "line": 402,
    "legacy": "docs/architect/agent-coordination/architecture/evidence-and-results.md",
    "previous": "[Evidence And Result Architecture](agent-coordination/README.md)",
    "now": "agent-coordination/architecture/evidence-and-results.md",
    "action": "retargeted-specific",
    "reason": "specific-candidate",
    "selfBefore": false,
    "portalBefore": true
  },
  "oldDestination": "../architect/agent-coordination/architecture/evidence-and-results.md",
  "interimDestination": "agent-coordination/README.md",
  "newDestination": "agent-coordination/architecture/evidence-and-results.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/agent-coordination/architecture/evidence-and-results.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "916fe71f475cad3e19f137283017d3c732912354051e5b526a2ee4fff744a346"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/agent-coordination/architecture/evidence-and-results.md",
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

## Entry f-069: link-069

```json
{
  "id": "link-069",
  "original": {
    "path": "docs/platform/component-boundary.md",
    "inputLine": 395,
    "inputColumn": 3,
    "lineBeforeLinkPass": 403,
    "before": "[Work Integration Boundaries](../architect/agent-coordination/architecture/work-integration.md)",
    "after": "[Work Integration Boundaries](agent-coordination/README.md)",
    "legacyPath": "docs/architect/agent-coordination/architecture/work-integration.md",
    "target": {
      "path": "docs/platform/agent-coordination/README.md",
      "anchor": null,
      "aliasId": "step10-agent-coordination-0431"
    },
    "portal": false,
    "area": "platform-root",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/component-boundary.md",
    "line": 403,
    "legacy": "docs/architect/agent-coordination/architecture/work-integration.md",
    "previous": "[Work Integration Boundaries](agent-coordination/README.md)",
    "now": "agent-coordination/architecture/work-integration.md",
    "action": "retargeted-specific",
    "reason": "specific-candidate",
    "selfBefore": false,
    "portalBefore": true
  },
  "oldDestination": "../architect/agent-coordination/architecture/work-integration.md",
  "interimDestination": "agent-coordination/README.md",
  "newDestination": "agent-coordination/architecture/work-integration.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/agent-coordination/architecture/work-integration.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "12741378ece5a65b7d8c01bbb3e98eb568ab7ca2514018f08733700c0220c05d"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/agent-coordination/architecture/work-integration.md",
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

## Entry f-070: link-070

```json
{
  "id": "link-070",
  "original": {
    "path": "docs/platform/component-boundary.md",
    "inputLine": 396,
    "inputColumn": 3,
    "lineBeforeLinkPass": 404,
    "before": "[Visibility And Herdr](../architect/agent-coordination/architecture/visibility-and-herdr.md)",
    "after": "[Visibility And Herdr](agent-coordination/README.md)",
    "legacyPath": "docs/architect/agent-coordination/architecture/visibility-and-herdr.md",
    "target": {
      "path": "docs/platform/agent-coordination/README.md",
      "anchor": null,
      "aliasId": "step10-agent-coordination-0407"
    },
    "portal": false,
    "area": "platform-root",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/component-boundary.md",
    "line": 404,
    "legacy": "docs/architect/agent-coordination/architecture/visibility-and-herdr.md",
    "previous": "[Visibility And Herdr](agent-coordination/README.md)",
    "now": "../architect/agent-coordination/architecture/visibility-and-herdr.md",
    "action": "restored-legacy",
    "reason": "provenance/legacy-owner",
    "selfBefore": false,
    "portalBefore": true
  },
  "oldDestination": "../architect/agent-coordination/architecture/visibility-and-herdr.md",
  "interimDestination": "agent-coordination/README.md",
  "newDestination": "../architect/agent-coordination/architecture/visibility-and-herdr.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/architect/agent-coordination/architecture/visibility-and-herdr.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "c9d4a00a8c0c37ed09202a0e9545a6ab33c5645338aa51ba3256ba4f55fb4dd8"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/agent-coordination/architecture/visibility-and-herdr.md",
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

## Entry f-071: link-071

```json
{
  "id": "link-071",
  "original": {
    "path": "docs/platform/component-boundary.md",
    "inputLine": 397,
    "inputColumn": 3,
    "lineBeforeLinkPass": 405,
    "before": "[ADR-007 Domain Harness Seam](../architect/agent-coordination/decisions/ADR-007-domain-harness-seam-and-non-driving-inline-evidence.md)",
    "after": "[ADR-007 Domain Harness Seam](agent-coordination/README.md)",
    "legacyPath": "docs/architect/agent-coordination/decisions/ADR-007-domain-harness-seam-and-non-driving-inline-evidence.md",
    "target": {
      "path": "docs/platform/agent-coordination/README.md",
      "anchor": null,
      "aliasId": "step10-agent-coordination-0772"
    },
    "portal": false,
    "area": "platform-root",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/component-boundary.md",
    "line": 405,
    "legacy": "docs/architect/agent-coordination/decisions/ADR-007-domain-harness-seam-and-non-driving-inline-evidence.md",
    "previous": "[ADR-007 Domain Harness Seam](agent-coordination/README.md)",
    "now": "agent-coordination/decisions/ADR-007-domain-harness-seam-and-non-driving-inline-evidence.md",
    "action": "retargeted-specific",
    "reason": "specific-candidate",
    "selfBefore": false,
    "portalBefore": true
  },
  "oldDestination": "../architect/agent-coordination/decisions/ADR-007-domain-harness-seam-and-non-driving-inline-evidence.md",
  "interimDestination": "agent-coordination/README.md",
  "newDestination": "agent-coordination/decisions/ADR-007-domain-harness-seam-and-non-driving-inline-evidence.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/agent-coordination/decisions/ADR-007-domain-harness-seam-and-non-driving-inline-evidence.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "7304aaaffd81ebf4dd9ebc580f171330c03e0cb2596835e04b24e630a41e2cd6"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/agent-coordination/decisions/ADR-007-domain-harness-seam-and-non-driving-inline-evidence.md",
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

## Entry f-072: link-072

```json
{
  "id": "link-072",
  "original": {
    "path": "docs/platform/component-boundary.md",
    "inputLine": 440,
    "inputColumn": 298,
    "lineBeforeLinkPass": 448,
    "before": "[Dispatch Control Plane](../architect/agent-coordination/architecture/dispatch-control-plane.md)",
    "after": "[Dispatch Control Plane](agent-coordination/README.md)",
    "legacyPath": "docs/architect/agent-coordination/architecture/dispatch-control-plane.md",
    "target": {
      "path": "docs/platform/agent-coordination/README.md",
      "anchor": null,
      "aliasId": "step10-agent-coordination-0122"
    },
    "portal": false,
    "area": "platform-root",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/component-boundary.md",
    "line": 448,
    "legacy": "docs/architect/agent-coordination/architecture/dispatch-control-plane.md",
    "previous": "[Dispatch Control Plane](agent-coordination/README.md)",
    "now": "../architect/agent-coordination/architecture/dispatch-control-plane.md",
    "action": "restored-legacy",
    "reason": "provenance/legacy-owner",
    "selfBefore": false,
    "portalBefore": true
  },
  "oldDestination": "../architect/agent-coordination/architecture/dispatch-control-plane.md",
  "interimDestination": "agent-coordination/README.md",
  "newDestination": "../architect/agent-coordination/architecture/dispatch-control-plane.md",
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

## Entry f-073: link-073

```json
{
  "id": "link-073",
  "original": {
    "path": "docs/platform/component-boundary.md",
    "inputLine": 1169,
    "inputColumn": 1,
    "lineBeforeLinkPass": 1177,
    "before": "[Domainization Architecture](../architect/domainization/README.md)",
    "after": "[Domainization Architecture](domainization/architecture/domainization.md)",
    "legacyPath": "docs/architect/domainization/README.md",
    "target": {
      "path": "docs/platform/domainization/architecture/domainization.md",
      "anchor": null,
      "aliasId": "step10-whole-system-1018"
    },
    "portal": false,
    "area": "platform-root",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/component-boundary.md",
    "line": 1177,
    "legacy": "docs/architect/domainization/README.md",
    "previous": "[Domainization Architecture](domainization/architecture/domainization.md)",
    "now": "domainization/architecture/domainization.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../architect/domainization/README.md",
  "interimDestination": "domainization/architecture/domainization.md",
  "newDestination": "domainization/architecture/domainization.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/domainization/architecture/domainization.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "286644bd4a86e60c872cb890bb73d3aa05da605364e0dfc4c87831a79e9fd1cb"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/domainization/README.md",
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

## Entry f-074: link-074

```json
{
  "id": "link-074",
  "original": {
    "path": "docs/platform/component-boundary.md",
    "inputLine": 1177,
    "inputColumn": 4,
    "lineBeforeLinkPass": 1185,
    "before": "[Component Boundary Advisory](../architect/component-boundary/component-boundary-advisory.md)",
    "after": "[Component Boundary Advisory](component-boundary.md)",
    "legacyPath": "docs/architect/component-boundary/component-boundary-advisory.md",
    "target": {
      "path": "docs/platform/component-boundary.md",
      "anchor": null,
      "aliasId": "step10-whole-system-0212"
    },
    "portal": false,
    "area": "platform-root",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/component-boundary.md",
    "line": 1185,
    "legacy": "docs/architect/component-boundary/component-boundary-advisory.md",
    "previous": "[Component Boundary Advisory](component-boundary.md)",
    "now": "../architect/component-boundary/component-boundary-advisory.md",
    "action": "restored-legacy",
    "reason": "self-link",
    "selfBefore": true,
    "portalBefore": false
  },
  "oldDestination": "../architect/component-boundary/component-boundary-advisory.md",
  "interimDestination": "component-boundary.md",
  "newDestination": "../architect/component-boundary/component-boundary-advisory.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/architect/component-boundary/component-boundary-advisory.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "913cbbc9419fc059e5ce1dcaeb7d06d6d90d6e9d3ef45195c15cd59ff0359bf3"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/component-boundary/component-boundary-advisory.md",
    "action": "restored-legacy",
    "reason": "self-link",
    "selfRestored": true,
    "portalRetargeted": false,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-075: link-075

```json
{
  "id": "link-075",
  "original": {
    "path": "docs/platform/component-boundary.md",
    "inputLine": 1178,
    "inputColumn": 4,
    "lineBeforeLinkPass": 1186,
    "before": "[Repo Layout Vision](../architect/component-boundary/repo-layout-vision.md)",
    "after": "[Repo Layout Vision](component-boundary.md)",
    "legacyPath": "docs/architect/component-boundary/repo-layout-vision.md",
    "target": {
      "path": "docs/platform/component-boundary.md",
      "anchor": null,
      "aliasId": "step10-whole-system-0379"
    },
    "portal": false,
    "area": "platform-root",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/component-boundary.md",
    "line": 1186,
    "legacy": "docs/architect/component-boundary/repo-layout-vision.md",
    "previous": "[Repo Layout Vision](component-boundary.md)",
    "now": "../architect/component-boundary/repo-layout-vision.md",
    "action": "restored-legacy",
    "reason": "self-link",
    "selfBefore": true,
    "portalBefore": false
  },
  "oldDestination": "../architect/component-boundary/repo-layout-vision.md",
  "interimDestination": "component-boundary.md",
  "newDestination": "../architect/component-boundary/repo-layout-vision.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/architect/component-boundary/repo-layout-vision.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "07691b34374b874752010a5585020635cb3ff396c1719594a4b1980e2318e314"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/component-boundary/repo-layout-vision.md",
    "action": "restored-legacy",
    "reason": "self-link",
    "selfRestored": true,
    "portalRetargeted": false,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-076: link-076

```json
{
  "id": "link-076",
  "original": {
    "path": "docs/platform/component-boundary.md",
    "inputLine": 1179,
    "inputColumn": 4,
    "lineBeforeLinkPass": 1187,
    "before": "[Host Invocation And Provider Routing](../architect/host-invocation-routing/host-invocation-provider-routing.md)",
    "after": "[Host Invocation And Provider Routing](host-invocation-routing/README.md)",
    "legacyPath": "docs/architect/host-invocation-routing/host-invocation-provider-routing.md",
    "target": {
      "path": "docs/platform/host-invocation-routing/README.md",
      "anchor": null,
      "aliasId": "host-invocation-draft-037"
    },
    "portal": false,
    "area": "platform-root",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/component-boundary.md",
    "line": 1187,
    "legacy": "docs/architect/host-invocation-routing/host-invocation-provider-routing.md",
    "previous": "[Host Invocation And Provider Routing](host-invocation-routing/README.md)",
    "now": "host-invocation-routing/spec.md",
    "action": "retargeted-specific",
    "reason": "specific-candidate",
    "selfBefore": false,
    "portalBefore": true
  },
  "oldDestination": "../architect/host-invocation-routing/host-invocation-provider-routing.md",
  "interimDestination": "host-invocation-routing/README.md",
  "newDestination": "host-invocation-routing/spec.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/host-invocation-routing/spec.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "7aaaa030b242b19a0bd4f0f9a8faac74d50b8b6a86c7817a73e7bc2f1848243f"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/host-invocation-routing/host-invocation-provider-routing.md",
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

## Entry f-077: link-077

```json
{
  "id": "link-077",
  "original": {
    "path": "docs/platform/component-boundary.md",
    "inputLine": 1180,
    "inputColumn": 4,
    "lineBeforeLinkPass": 1188,
    "before": "[Node To Rust Component Migration](../architect/host-invocation-routing/node-to-rust-component-migration.md)",
    "after": "[Node To Rust Component Migration](host-invocation-routing/README.md)",
    "legacyPath": "docs/architect/host-invocation-routing/node-to-rust-component-migration.md",
    "target": {
      "path": "docs/platform/host-invocation-routing/README.md",
      "anchor": null,
      "aliasId": "host-invocation-draft-061"
    },
    "portal": false,
    "area": "platform-root",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/component-boundary.md",
    "line": 1188,
    "legacy": "docs/architect/host-invocation-routing/node-to-rust-component-migration.md",
    "previous": "[Node To Rust Component Migration](host-invocation-routing/README.md)",
    "now": "host-invocation-routing/architecture/node-to-rust-migration.md",
    "action": "retargeted-specific",
    "reason": "specific-candidate",
    "selfBefore": false,
    "portalBefore": true
  },
  "oldDestination": "../architect/host-invocation-routing/node-to-rust-component-migration.md",
  "interimDestination": "host-invocation-routing/README.md",
  "newDestination": "host-invocation-routing/architecture/node-to-rust-migration.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "91460b8da411b883b18710d3f886eb521945a01af50779d4abd217b8976e63d7"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/host-invocation-routing/node-to-rust-component-migration.md",
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

## Entry f-078: link-078

```json
{
  "id": "link-078",
  "original": {
    "path": "docs/platform/component-boundary.md",
    "inputLine": 1181,
    "inputColumn": 4,
    "lineBeforeLinkPass": 1189,
    "before": "[Packaging And Distribution Architecture](../architect/packaging-distribution/README.md)",
    "after": "[Packaging And Distribution Architecture](packaging-distribution/README.md)",
    "legacyPath": "docs/architect/packaging-distribution/README.md",
    "target": {
      "path": "docs/platform/packaging-distribution/README.md",
      "anchor": null,
      "aliasId": "step10-packaging-distribution-0001"
    },
    "portal": false,
    "area": "platform-root",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/component-boundary.md",
    "line": 1189,
    "legacy": "docs/architect/packaging-distribution/README.md",
    "previous": "[Packaging And Distribution Architecture](packaging-distribution/README.md)",
    "now": "packaging-distribution/README.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../architect/packaging-distribution/README.md",
  "interimDestination": "packaging-distribution/README.md",
  "newDestination": "packaging-distribution/README.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/packaging-distribution/README.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "caf463dc73fa1ac4881f8d2462dc66edaeb81026260a4635a8d0cdd557e57a78"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/packaging-distribution/README.md",
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

## Entry f-079: link-079

```json
{
  "id": "link-079",
  "original": {
    "path": "docs/platform/component-boundary.md",
    "inputLine": 1238,
    "inputColumn": 1,
    "lineBeforeLinkPass": 1246,
    "before": "[component-boundary-advisory.md](../architect/component-boundary/component-boundary-advisory.md)",
    "after": "[component-boundary-advisory.md](component-boundary.md)",
    "legacyPath": "docs/architect/component-boundary/component-boundary-advisory.md",
    "target": {
      "path": "docs/platform/component-boundary.md",
      "anchor": null,
      "aliasId": "step10-whole-system-0212"
    },
    "portal": false,
    "area": "platform-root",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/component-boundary.md",
    "line": 1246,
    "legacy": "docs/architect/component-boundary/component-boundary-advisory.md",
    "previous": "[component-boundary-advisory.md](component-boundary.md)",
    "now": "../architect/component-boundary/component-boundary-advisory.md",
    "action": "restored-legacy",
    "reason": "self-link",
    "selfBefore": true,
    "portalBefore": false
  },
  "oldDestination": "../architect/component-boundary/component-boundary-advisory.md",
  "interimDestination": "component-boundary.md",
  "newDestination": "../architect/component-boundary/component-boundary-advisory.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/architect/component-boundary/component-boundary-advisory.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "913cbbc9419fc059e5ce1dcaeb7d06d6d90d6e9d3ef45195c15cd59ff0359bf3"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/component-boundary/component-boundary-advisory.md",
    "action": "restored-legacy",
    "reason": "self-link",
    "selfRestored": true,
    "portalRetargeted": false,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-080: link-080

```json
{
  "id": "link-080",
  "original": {
    "path": "docs/platform/component-boundary.md",
    "inputLine": 1260,
    "inputColumn": 1,
    "lineBeforeLinkPass": 1268,
    "before": "[Domainization Architecture](../architect/domainization/README.md)",
    "after": "[Domainization Architecture](domainization/architecture/domainization.md)",
    "legacyPath": "docs/architect/domainization/README.md",
    "target": {
      "path": "docs/platform/domainization/architecture/domainization.md",
      "anchor": null,
      "aliasId": "step10-whole-system-1018"
    },
    "portal": false,
    "area": "platform-root",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/component-boundary.md",
    "line": 1268,
    "legacy": "docs/architect/domainization/README.md",
    "previous": "[Domainization Architecture](domainization/architecture/domainization.md)",
    "now": "domainization/architecture/domainization.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../architect/domainization/README.md",
  "interimDestination": "domainization/architecture/domainization.md",
  "newDestination": "domainization/architecture/domainization.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/domainization/architecture/domainization.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "286644bd4a86e60c872cb890bb73d3aa05da605364e0dfc4c87831a79e9fd1cb"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/domainization/README.md",
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

## Entry f-081: link-081

```json
{
  "id": "link-081",
  "original": {
    "path": "docs/platform/component-boundary.md",
    "inputLine": 1264,
    "inputColumn": 1,
    "lineBeforeLinkPass": 1272,
    "before": "[repo-layout-vision.md](../architect/component-boundary/repo-layout-vision.md)",
    "after": "[repo-layout-vision.md](component-boundary.md)",
    "legacyPath": "docs/architect/component-boundary/repo-layout-vision.md",
    "target": {
      "path": "docs/platform/component-boundary.md",
      "anchor": null,
      "aliasId": "step10-whole-system-0379"
    },
    "portal": false,
    "area": "platform-root",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/component-boundary.md",
    "line": 1272,
    "legacy": "docs/architect/component-boundary/repo-layout-vision.md",
    "previous": "[repo-layout-vision.md](component-boundary.md)",
    "now": "../architect/component-boundary/repo-layout-vision.md",
    "action": "restored-legacy",
    "reason": "self-link",
    "selfBefore": true,
    "portalBefore": false
  },
  "oldDestination": "../architect/component-boundary/repo-layout-vision.md",
  "interimDestination": "component-boundary.md",
  "newDestination": "../architect/component-boundary/repo-layout-vision.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/architect/component-boundary/repo-layout-vision.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "07691b34374b874752010a5585020635cb3ff396c1719594a4b1980e2318e314"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/component-boundary/repo-layout-vision.md",
    "action": "restored-legacy",
    "reason": "self-link",
    "selfRestored": true,
    "portalRetargeted": false,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-082: link-082

```json
{
  "id": "link-082",
  "original": {
    "path": "docs/platform/component-boundary.md",
    "inputLine": 1281,
    "inputColumn": 1,
    "lineBeforeLinkPass": 1289,
    "before": "[host-invocation-provider-routing.md](../architect/host-invocation-routing/host-invocation-provider-routing.md)",
    "after": "[host-invocation-provider-routing.md](host-invocation-routing/README.md)",
    "legacyPath": "docs/architect/host-invocation-routing/host-invocation-provider-routing.md",
    "target": {
      "path": "docs/platform/host-invocation-routing/README.md",
      "anchor": null,
      "aliasId": "host-invocation-draft-037"
    },
    "portal": false,
    "area": "platform-root",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/component-boundary.md",
    "line": 1289,
    "legacy": "docs/architect/host-invocation-routing/host-invocation-provider-routing.md",
    "previous": "[host-invocation-provider-routing.md](host-invocation-routing/README.md)",
    "now": "host-invocation-routing/spec.md",
    "action": "retargeted-specific",
    "reason": "specific-candidate",
    "selfBefore": false,
    "portalBefore": true
  },
  "oldDestination": "../architect/host-invocation-routing/host-invocation-provider-routing.md",
  "interimDestination": "host-invocation-routing/README.md",
  "newDestination": "host-invocation-routing/spec.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/host-invocation-routing/spec.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "7aaaa030b242b19a0bd4f0f9a8faac74d50b8b6a86c7817a73e7bc2f1848243f"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/host-invocation-routing/host-invocation-provider-routing.md",
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

## Entry f-083: link-083

```json
{
  "id": "link-083",
  "original": {
    "path": "docs/platform/component-boundary.md",
    "inputLine": 1294,
    "inputColumn": 1,
    "lineBeforeLinkPass": 1302,
    "before": "[node-to-rust-component-migration.md](../architect/host-invocation-routing/node-to-rust-component-migration.md)",
    "after": "[node-to-rust-component-migration.md](host-invocation-routing/README.md)",
    "legacyPath": "docs/architect/host-invocation-routing/node-to-rust-component-migration.md",
    "target": {
      "path": "docs/platform/host-invocation-routing/README.md",
      "anchor": null,
      "aliasId": "host-invocation-draft-061"
    },
    "portal": false,
    "area": "platform-root",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/component-boundary.md",
    "line": 1302,
    "legacy": "docs/architect/host-invocation-routing/node-to-rust-component-migration.md",
    "previous": "[node-to-rust-component-migration.md](host-invocation-routing/README.md)",
    "now": "host-invocation-routing/architecture/node-to-rust-migration.md",
    "action": "retargeted-specific",
    "reason": "specific-candidate",
    "selfBefore": false,
    "portalBefore": true
  },
  "oldDestination": "../architect/host-invocation-routing/node-to-rust-component-migration.md",
  "interimDestination": "host-invocation-routing/README.md",
  "newDestination": "host-invocation-routing/architecture/node-to-rust-migration.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "91460b8da411b883b18710d3f886eb521945a01af50779d4abd217b8976e63d7"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/host-invocation-routing/node-to-rust-component-migration.md",
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

## Entry f-084: link-084

```json
{
  "id": "link-084",
  "original": {
    "path": "docs/platform/component-boundary.md",
    "inputLine": 1354,
    "inputColumn": 3,
    "lineBeforeLinkPass": 1362,
    "before": "[Architecture Map](../architecture-map.md)",
    "after": "[Architecture Map](architecture-map.md)",
    "legacyPath": "docs/architecture-map.md",
    "target": {
      "path": "docs/platform/architecture-map.md",
      "anchor": null,
      "aliasId": "step10-whole-system-1520"
    },
    "portal": false,
    "area": "platform-root",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/component-boundary.md",
    "line": 1362,
    "legacy": "docs/architecture-map.md",
    "previous": "[Architecture Map](architecture-map.md)",
    "now": "architecture-map.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../architecture-map.md",
  "interimDestination": "architecture-map.md",
  "newDestination": "architecture-map.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/architecture-map.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "fb3f6e2da6cbe36758cd0889886e20221163012805c2dae3dffd1cb5465eab89"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architecture-map.md",
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

## Entry f-085: link-085

```json
{
  "id": "link-085",
  "original": {
    "path": "docs/platform/component-boundary.md",
    "inputLine": 1356,
    "inputColumn": 3,
    "lineBeforeLinkPass": 1364,
    "before": "[System Overview](../specs/system-overview.md)",
    "after": "[System Overview](system-overview/spec.md)",
    "legacyPath": "docs/specs/system-overview.md",
    "target": {
      "path": "docs/platform/system-overview/spec.md",
      "anchor": null,
      "aliasId": "step10-specs-0399"
    },
    "portal": false,
    "area": "platform-root",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/component-boundary.md",
    "line": 1364,
    "legacy": "docs/specs/system-overview.md",
    "previous": "[System Overview](system-overview/spec.md)",
    "now": "system-overview/spec.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../specs/system-overview.md",
  "interimDestination": "system-overview/spec.md",
  "newDestination": "system-overview/spec.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/system-overview/spec.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "b027026ae37327e96ce572c9a06fdaebf7d5146625c1abeb10b3bdcb033b0e54"
  },
  "referentPreservation": {
    "declaredReferent": "docs/specs/system-overview.md",
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

## Entry f-086: link-086

```json
{
  "id": "link-086",
  "original": {
    "path": "docs/platform/component-boundary.md",
    "inputLine": 1358,
    "inputColumn": 3,
    "lineBeforeLinkPass": 1366,
    "before": "[Platform Foundations](../platform-foundations.md)",
    "after": "[Platform Foundations](platform-foundations.md)",
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
    "file": "docs/platform/component-boundary.md",
    "line": 1366,
    "legacy": "docs/platform-foundations.md",
    "previous": "[Platform Foundations](platform-foundations.md)",
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

## Entry f-087: link-087

```json
{
  "id": "link-087",
  "original": {
    "path": "docs/platform/component-boundary.md",
    "inputLine": 1364,
    "inputColumn": 3,
    "lineBeforeLinkPass": 1372,
    "before": "[Domainization Architecture](../architect/domainization/README.md)",
    "after": "[Domainization Architecture](domainization/architecture/domainization.md)",
    "legacyPath": "docs/architect/domainization/README.md",
    "target": {
      "path": "docs/platform/domainization/architecture/domainization.md",
      "anchor": null,
      "aliasId": "step10-whole-system-1018"
    },
    "portal": false,
    "area": "platform-root",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/component-boundary.md",
    "line": 1372,
    "legacy": "docs/architect/domainization/README.md",
    "previous": "[Domainization Architecture](domainization/architecture/domainization.md)",
    "now": "domainization/architecture/domainization.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../architect/domainization/README.md",
  "interimDestination": "domainization/architecture/domainization.md",
  "newDestination": "domainization/architecture/domainization.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/domainization/architecture/domainization.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "286644bd4a86e60c872cb890bb73d3aa05da605364e0dfc4c87831a79e9fd1cb"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/domainization/README.md",
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

## Entry f-088: link-088

```json
{
  "id": "link-088",
  "original": {
    "path": "docs/platform/component-boundary.md",
    "inputLine": 1370,
    "inputColumn": 3,
    "lineBeforeLinkPass": 1378,
    "before": "[Agent Coordination Portal](../architect/agent-coordination/README.md)",
    "after": "[Agent Coordination Portal](agent-coordination/README.md)",
    "legacyPath": "docs/architect/agent-coordination/README.md",
    "target": {
      "path": "docs/platform/agent-coordination/README.md",
      "anchor": null,
      "aliasId": "step10-agent-coordination-0001"
    },
    "portal": false,
    "area": "platform-root",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/component-boundary.md",
    "line": 1378,
    "legacy": "docs/architect/agent-coordination/README.md",
    "previous": "[Agent Coordination Portal](agent-coordination/README.md)",
    "now": "agent-coordination/README.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../architect/agent-coordination/README.md",
  "interimDestination": "agent-coordination/README.md",
  "newDestination": "agent-coordination/README.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/agent-coordination/README.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "a0a5aa8e1899e97ef1f250c1c4365f9735709dd2e1f17a80a684f9acaf7c99f0"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/agent-coordination/README.md",
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

## Entry f-089: link-089

```json
{
  "id": "link-089",
  "original": {
    "path": "docs/platform/component-boundary.md",
    "inputLine": 1372,
    "inputColumn": 3,
    "lineBeforeLinkPass": 1380,
    "before": "[Agent Coordination Foundation Vision](../architect/agent-coordination/vision.md)",
    "after": "[Agent Coordination Foundation Vision](agent-coordination/README.md)",
    "legacyPath": "docs/architect/agent-coordination/vision.md",
    "target": {
      "path": "docs/platform/agent-coordination/README.md",
      "anchor": null,
      "aliasId": "step10-agent-coordination-4330"
    },
    "portal": false,
    "area": "platform-root",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/component-boundary.md",
    "line": 1380,
    "legacy": "docs/architect/agent-coordination/vision.md",
    "previous": "[Agent Coordination Foundation Vision](agent-coordination/README.md)",
    "now": "agent-coordination/vision.md",
    "action": "retargeted-specific",
    "reason": "specific-candidate",
    "selfBefore": false,
    "portalBefore": true
  },
  "oldDestination": "../architect/agent-coordination/vision.md",
  "interimDestination": "agent-coordination/README.md",
  "newDestination": "agent-coordination/vision.md",
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

## Entry f-090: link-090

```json
{
  "id": "link-090",
  "original": {
    "path": "docs/platform/component-boundary.md",
    "inputLine": 1374,
    "inputColumn": 3,
    "lineBeforeLinkPass": 1382,
    "before": "[System Context](../architect/agent-coordination/architecture/system-context.md)",
    "after": "[System Context](agent-coordination/README.md)",
    "legacyPath": "docs/architect/agent-coordination/architecture/system-context.md",
    "target": {
      "path": "docs/platform/agent-coordination/README.md",
      "anchor": null,
      "aliasId": "step10-agent-coordination-0391"
    },
    "portal": false,
    "area": "platform-root",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/component-boundary.md",
    "line": 1382,
    "legacy": "docs/architect/agent-coordination/architecture/system-context.md",
    "previous": "[System Context](agent-coordination/README.md)",
    "now": "agent-coordination/history/retired-engine/legacy/architecture/system-context.md",
    "action": "retargeted-specific",
    "reason": "specific-candidate",
    "selfBefore": false,
    "portalBefore": true
  },
  "oldDestination": "../architect/agent-coordination/architecture/system-context.md",
  "interimDestination": "agent-coordination/README.md",
  "newDestination": "agent-coordination/history/retired-engine/legacy/architecture/system-context.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/agent-coordination/history/retired-engine/legacy/architecture/system-context.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "faa90b316286f190e01a800ad9a2c27cd5d9e1aeb8d22adaebaaf727f62a09ea"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/agent-coordination/architecture/system-context.md",
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

## Entry f-091: link-091

```json
{
  "id": "link-091",
  "original": {
    "path": "docs/platform/component-boundary.md",
    "inputLine": 1376,
    "inputColumn": 3,
    "lineBeforeLinkPass": 1384,
    "before": "[Runtime Model](../architect/agent-coordination/architecture/runtime-model.md)",
    "after": "[Runtime Model](agent-coordination/README.md)",
    "legacyPath": "docs/architect/agent-coordination/architecture/runtime-model.md",
    "target": {
      "path": "docs/platform/agent-coordination/README.md",
      "anchor": null,
      "aliasId": "step10-agent-coordination-0328"
    },
    "portal": false,
    "area": "platform-root",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/component-boundary.md",
    "line": 1384,
    "legacy": "docs/architect/agent-coordination/architecture/runtime-model.md",
    "previous": "[Runtime Model](agent-coordination/README.md)",
    "now": "agent-coordination/architecture/runtime-model.md",
    "action": "retargeted-specific",
    "reason": "specific-candidate",
    "selfBefore": false,
    "portalBefore": true
  },
  "oldDestination": "../architect/agent-coordination/architecture/runtime-model.md",
  "interimDestination": "agent-coordination/README.md",
  "newDestination": "agent-coordination/architecture/runtime-model.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/agent-coordination/architecture/runtime-model.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "bb7d7f863fa4168f636b4e1fe9a6c914c06fdda3f2b39adfa3840189c1e69f90"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/agent-coordination/architecture/runtime-model.md",
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

## Entry f-092: link-092

```json
{
  "id": "link-092",
  "original": {
    "path": "docs/platform/component-boundary.md",
    "inputLine": 1378,
    "inputColumn": 3,
    "lineBeforeLinkPass": 1386,
    "before": "[Dispatch Control Plane](../architect/agent-coordination/architecture/dispatch-control-plane.md)",
    "after": "[Dispatch Control Plane](agent-coordination/README.md)",
    "legacyPath": "docs/architect/agent-coordination/architecture/dispatch-control-plane.md",
    "target": {
      "path": "docs/platform/agent-coordination/README.md",
      "anchor": null,
      "aliasId": "step10-agent-coordination-0122"
    },
    "portal": false,
    "area": "platform-root",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/component-boundary.md",
    "line": 1386,
    "legacy": "docs/architect/agent-coordination/architecture/dispatch-control-plane.md",
    "previous": "[Dispatch Control Plane](agent-coordination/README.md)",
    "now": "agent-coordination/architecture/dispatch-control-plane.md",
    "action": "retargeted-specific",
    "reason": "specific-candidate",
    "selfBefore": false,
    "portalBefore": true
  },
  "oldDestination": "../architect/agent-coordination/architecture/dispatch-control-plane.md",
  "interimDestination": "agent-coordination/README.md",
  "newDestination": "agent-coordination/architecture/dispatch-control-plane.md",
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

## Entry f-093: link-093

```json
{
  "id": "link-093",
  "original": {
    "path": "docs/platform/component-boundary.md",
    "inputLine": 1380,
    "inputColumn": 3,
    "lineBeforeLinkPass": 1388,
    "before": "[Evidence And Results](../architect/agent-coordination/architecture/evidence-and-results.md)",
    "after": "[Evidence And Results](agent-coordination/README.md)",
    "legacyPath": "docs/architect/agent-coordination/architecture/evidence-and-results.md",
    "target": {
      "path": "docs/platform/agent-coordination/README.md",
      "anchor": null,
      "aliasId": "step10-agent-coordination-0173"
    },
    "portal": false,
    "area": "platform-root",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/component-boundary.md",
    "line": 1388,
    "legacy": "docs/architect/agent-coordination/architecture/evidence-and-results.md",
    "previous": "[Evidence And Results](agent-coordination/README.md)",
    "now": "agent-coordination/architecture/evidence-and-results.md",
    "action": "retargeted-specific",
    "reason": "specific-candidate",
    "selfBefore": false,
    "portalBefore": true
  },
  "oldDestination": "../architect/agent-coordination/architecture/evidence-and-results.md",
  "interimDestination": "agent-coordination/README.md",
  "newDestination": "agent-coordination/architecture/evidence-and-results.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/agent-coordination/architecture/evidence-and-results.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "916fe71f475cad3e19f137283017d3c732912354051e5b526a2ee4fff744a346"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/agent-coordination/architecture/evidence-and-results.md",
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

## Entry f-094: link-094

```json
{
  "id": "link-094",
  "original": {
    "path": "docs/platform/component-boundary.md",
    "inputLine": 1382,
    "inputColumn": 3,
    "lineBeforeLinkPass": 1390,
    "before": "[Work Integration](../architect/agent-coordination/architecture/work-integration.md)",
    "after": "[Work Integration](agent-coordination/README.md)",
    "legacyPath": "docs/architect/agent-coordination/architecture/work-integration.md",
    "target": {
      "path": "docs/platform/agent-coordination/README.md",
      "anchor": null,
      "aliasId": "step10-agent-coordination-0431"
    },
    "portal": false,
    "area": "platform-root",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/component-boundary.md",
    "line": 1390,
    "legacy": "docs/architect/agent-coordination/architecture/work-integration.md",
    "previous": "[Work Integration](agent-coordination/README.md)",
    "now": "agent-coordination/architecture/work-integration.md",
    "action": "retargeted-specific",
    "reason": "specific-candidate",
    "selfBefore": false,
    "portalBefore": true
  },
  "oldDestination": "../architect/agent-coordination/architecture/work-integration.md",
  "interimDestination": "agent-coordination/README.md",
  "newDestination": "agent-coordination/architecture/work-integration.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/agent-coordination/architecture/work-integration.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "12741378ece5a65b7d8c01bbb3e98eb568ab7ca2514018f08733700c0220c05d"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/agent-coordination/architecture/work-integration.md",
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

## Entry f-095: link-095

```json
{
  "id": "link-095",
  "original": {
    "path": "docs/platform/documentation/architecture/documentation-system-design.md",
    "inputLine": 24,
    "inputColumn": 22,
    "lineBeforeLinkPass": 24,
    "before": "[original source](../../../architect/documentation-system-design.md)",
    "after": "[original source](documentation-system-design.md)",
    "legacyPath": "docs/architect/documentation-system-design.md",
    "target": {
      "path": "docs/platform/documentation/architecture/documentation-system-design.md",
      "anchor": null,
      "aliasId": "step10-whole-system-0439"
    },
    "portal": false,
    "area": "documentation",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/documentation/architecture/documentation-system-design.md",
    "line": 24,
    "legacy": "docs/architect/documentation-system-design.md",
    "previous": "[original source](documentation-system-design.md)",
    "now": "../../../architect/documentation-system-design.md",
    "action": "restored-legacy",
    "reason": "provenance/legacy-owner",
    "selfBefore": true,
    "portalBefore": false
  },
  "oldDestination": "../../../architect/documentation-system-design.md",
  "interimDestination": "documentation-system-design.md",
  "newDestination": "../../../architect/documentation-system-design.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/architect/documentation-system-design.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "959d8a9327ceb9744d85a3e83d026a6523fae3f195794fe96761905e96147fc5"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/documentation-system-design.md",
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

## Entry f-096: link-096

```json
{
  "id": "link-096",
  "original": {
    "path": "docs/platform/documentation/operations/portals/docs-portal.md",
    "inputLine": 28,
    "inputColumn": 25,
    "lineBeforeLinkPass": 28,
    "before": "[doc-governance.md](../../../../doc-governance.md)",
    "after": "[doc-governance.md](../../../governance.md)",
    "legacyPath": "docs/doc-governance.md",
    "target": {
      "path": "docs/platform/governance.md",
      "anchor": null,
      "aliasId": "root-authorities-draft-0011"
    },
    "portal": false,
    "area": "documentation",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/documentation/operations/portals/docs-portal.md",
    "line": 28,
    "legacy": "docs/doc-governance.md",
    "previous": "[doc-governance.md](../../../governance.md)",
    "now": "../../../governance.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../../../../doc-governance.md",
  "interimDestination": "../../../governance.md",
  "newDestination": "../../../governance.md",
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

## Entry f-097: link-097

```json
{
  "id": "link-097",
  "original": {
    "path": "docs/platform/documentation/operations/portals/docs-portal.md",
    "inputLine": 55,
    "inputColumn": 34,
    "lineBeforeLinkPass": 55,
    "before": "[doc-governance.md](../../../../doc-governance.md)",
    "after": "[doc-governance.md](../../../governance.md)",
    "legacyPath": "docs/doc-governance.md",
    "target": {
      "path": "docs/platform/governance.md",
      "anchor": null,
      "aliasId": "root-authorities-draft-0011"
    },
    "portal": false,
    "area": "documentation",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/documentation/operations/portals/docs-portal.md",
    "line": 55,
    "legacy": "docs/doc-governance.md",
    "previous": "[doc-governance.md](../../../governance.md)",
    "now": "../../../governance.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../../../../doc-governance.md",
  "interimDestination": "../../../governance.md",
  "newDestination": "../../../governance.md",
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

## Entry f-098: link-098

```json
{
  "id": "link-098",
  "original": {
    "path": "docs/platform/documentation/switchboard.md",
    "inputLine": 115,
    "inputColumn": 30,
    "lineBeforeLinkPass": 115,
    "before": "[docs/doc-governance.md](../../doc-governance.md)",
    "after": "[docs/doc-governance.md](../governance.md)",
    "legacyPath": "docs/doc-governance.md",
    "target": {
      "path": "docs/platform/governance.md",
      "anchor": null,
      "aliasId": "root-authorities-draft-0011"
    },
    "portal": false,
    "area": "documentation",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/documentation/switchboard.md",
    "line": 115,
    "legacy": "docs/doc-governance.md",
    "previous": "[docs/doc-governance.md](../governance.md)",
    "now": "../governance.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../../doc-governance.md",
  "interimDestination": "../governance.md",
  "newDestination": "../governance.md",
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

## Entry f-099: link-099

```json
{
  "id": "link-099",
  "original": {
    "path": "docs/platform/domainization/architecture/domainization.md",
    "inputLine": 24,
    "inputColumn": 22,
    "lineBeforeLinkPass": 24,
    "before": "[original source](../../../architect/domainization/README.md)",
    "after": "[original source](domainization.md)",
    "legacyPath": "docs/architect/domainization/README.md",
    "target": {
      "path": "docs/platform/domainization/architecture/domainization.md",
      "anchor": null,
      "aliasId": "step10-whole-system-1018"
    },
    "portal": false,
    "area": "domainization",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/domainization/architecture/domainization.md",
    "line": 24,
    "legacy": "docs/architect/domainization/README.md",
    "previous": "[original source](domainization.md)",
    "now": "../../../architect/domainization/README.md",
    "action": "restored-legacy",
    "reason": "provenance/legacy-owner",
    "selfBefore": true,
    "portalBefore": false
  },
  "oldDestination": "../../../architect/domainization/README.md",
  "interimDestination": "domainization.md",
  "newDestination": "../../../architect/domainization/README.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/architect/domainization/README.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "bf4126c6b5fa6cc77d983800e778e669e0d8a664709df5ef8e89b2f73c013de0"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/domainization/README.md",
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

## Entry f-100: link-100

```json
{
  "id": "link-100",
  "original": {
    "path": "docs/platform/domainization/architecture/domainization.md",
    "inputLine": 32,
    "inputColumn": 10,
    "lineBeforeLinkPass": 32,
    "before": "[Component Boundary Advisory](../../../architect/component-boundary/component-boundary-advisory.md)",
    "after": "[Component Boundary Advisory](../../component-boundary.md)",
    "legacyPath": "docs/architect/component-boundary/component-boundary-advisory.md",
    "target": {
      "path": "docs/platform/component-boundary.md",
      "anchor": null,
      "aliasId": "step10-whole-system-0212"
    },
    "portal": false,
    "area": "domainization",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/domainization/architecture/domainization.md",
    "line": 32,
    "legacy": "docs/architect/component-boundary/component-boundary-advisory.md",
    "previous": "[Component Boundary Advisory](../../component-boundary.md)",
    "now": "../../component-boundary.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../../../architect/component-boundary/component-boundary-advisory.md",
  "interimDestination": "../../component-boundary.md",
  "newDestination": "../../component-boundary.md",
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

## Entry f-101: link-101

```json
{
  "id": "link-101",
  "original": {
    "path": "docs/platform/domainization/architecture/domainization.md",
    "inputLine": 32,
    "inputColumn": 111,
    "lineBeforeLinkPass": 32,
    "before": "[System Overview](../../../specs/system-overview.md)",
    "after": "[System Overview](../../system-overview/spec.md)",
    "legacyPath": "docs/specs/system-overview.md",
    "target": {
      "path": "docs/platform/system-overview/spec.md",
      "anchor": null,
      "aliasId": "step10-specs-0399"
    },
    "portal": false,
    "area": "domainization",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/domainization/architecture/domainization.md",
    "line": 32,
    "legacy": "docs/specs/system-overview.md",
    "previous": "[System Overview](../../system-overview/spec.md)",
    "now": "../../system-overview/spec.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../../../specs/system-overview.md",
  "interimDestination": "../../system-overview/spec.md",
  "newDestination": "../../system-overview/spec.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/system-overview/spec.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "b027026ae37327e96ce572c9a06fdaebf7d5146625c1abeb10b3bdcb033b0e54"
  },
  "referentPreservation": {
    "declaredReferent": "docs/specs/system-overview.md",
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

## Entry f-102: link-102

```json
{
  "id": "link-102",
  "original": {
    "path": "docs/platform/domainization/architecture/domainization.md",
    "inputLine": 32,
    "inputColumn": 235,
    "lineBeforeLinkPass": 32,
    "before": "[Work-State Spec](../../../specs/work-state.md)",
    "after": "[Work-State Spec](../../work-state/README.md)",
    "legacyPath": "docs/specs/work-state.md",
    "target": {
      "path": "docs/platform/work-state/README.md",
      "anchor": null,
      "aliasId": "root-authorities-draft-0073"
    },
    "portal": false,
    "area": "domainization",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/domainization/architecture/domainization.md",
    "line": 32,
    "legacy": "docs/specs/work-state.md",
    "previous": "[Work-State Spec](../../work-state/README.md)",
    "now": "../../work-state/spec.md",
    "action": "retargeted-specific",
    "reason": "specific-candidate",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../../../specs/work-state.md",
  "interimDestination": "../../work-state/README.md",
  "newDestination": "../../work-state/spec.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/work-state/spec.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "e808b4e41f7dda3a1d5b3bee51999f1c4920a7716bee17f8535311f4f70bf15f"
  },
  "referentPreservation": {
    "declaredReferent": "docs/specs/work-state.md",
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

## Entry f-103: link-103

```json
{
  "id": "link-103",
  "original": {
    "path": "docs/platform/domainization/architecture/domainization.md",
    "inputLine": 50,
    "inputColumn": 21,
    "lineBeforeLinkPass": 50,
    "before": "[Component Boundary Advisory](../../../architect/component-boundary/component-boundary-advisory.md)",
    "after": "[Component Boundary Advisory](../../component-boundary.md)",
    "legacyPath": "docs/architect/component-boundary/component-boundary-advisory.md",
    "target": {
      "path": "docs/platform/component-boundary.md",
      "anchor": null,
      "aliasId": "step10-whole-system-0212"
    },
    "portal": false,
    "area": "domainization",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/domainization/architecture/domainization.md",
    "line": 50,
    "legacy": "docs/architect/component-boundary/component-boundary-advisory.md",
    "previous": "[Component Boundary Advisory](../../component-boundary.md)",
    "now": "../../component-boundary.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../../../architect/component-boundary/component-boundary-advisory.md",
  "interimDestination": "../../component-boundary.md",
  "newDestination": "../../component-boundary.md",
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

## Entry f-104: link-104

```json
{
  "id": "link-104",
  "original": {
    "path": "docs/platform/governance.md",
    "inputLine": 457,
    "inputColumn": 43,
    "lineBeforeLinkPass": 457,
    "before": "[transitional-switchboard.md](../transitional-switchboard.md)",
    "after": "[transitional-switchboard.md](documentation/switchboard.md)",
    "legacyPath": "docs/transitional-switchboard.md",
    "target": {
      "path": "docs/platform/documentation/switchboard.md",
      "anchor": null,
      "aliasId": "root-authorities-draft-0310"
    },
    "portal": false,
    "area": "platform-root",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/governance.md",
    "line": 457,
    "legacy": "docs/transitional-switchboard.md",
    "previous": "[transitional-switchboard.md](documentation/switchboard.md)",
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

## Entry f-105: link-105

```json
{
  "id": "link-105",
  "original": {
    "path": "docs/platform/governance.md",
    "inputLine": 471,
    "inputColumn": 26,
    "lineBeforeLinkPass": 471,
    "before": "[README.md](../README.md)",
    "after": "[README.md](documentation/operations/portals/docs-portal.md)",
    "legacyPath": "docs/README.md",
    "target": {
      "path": "docs/platform/documentation/operations/portals/docs-portal.md",
      "anchor": null,
      "aliasId": "root-authorities-draft-0060"
    },
    "portal": false,
    "area": "platform-root",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/governance.md",
    "line": 471,
    "legacy": "docs/README.md",
    "previous": "[README.md](documentation/operations/portals/docs-portal.md)",
    "now": "documentation/operations/portals/docs-portal.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../README.md",
  "interimDestination": "documentation/operations/portals/docs-portal.md",
  "newDestination": "documentation/operations/portals/docs-portal.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/documentation/operations/portals/docs-portal.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "001a90b4a3a001d513a0457394b4b8a69320ee2a4865b0b0561bd4d1da39a997"
  },
  "referentPreservation": {
    "declaredReferent": "docs/README.md",
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

## Entry f-106: link-106

```json
{
  "id": "link-106",
  "original": {
    "path": "docs/platform/governance.md",
    "inputLine": 473,
    "inputColumn": 40,
    "lineBeforeLinkPass": 473,
    "before": "[transitional-switchboard.md](../transitional-switchboard.md)",
    "after": "[transitional-switchboard.md](documentation/switchboard.md)",
    "legacyPath": "docs/transitional-switchboard.md",
    "target": {
      "path": "docs/platform/documentation/switchboard.md",
      "anchor": null,
      "aliasId": "root-authorities-draft-0310"
    },
    "portal": false,
    "area": "platform-root",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/governance.md",
    "line": 473,
    "legacy": "docs/transitional-switchboard.md",
    "previous": "[transitional-switchboard.md](documentation/switchboard.md)",
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

## Entry f-107: link-107

```json
{
  "id": "link-107",
  "original": {
    "path": "docs/platform/governance.md",
    "inputLine": 476,
    "inputColumn": 30,
    "lineBeforeLinkPass": 476,
    "before": "[architect/documentation-system-design.md](../architect/documentation-system-design.md)",
    "after": "[architect/documentation-system-design.md](documentation/architecture/documentation-system-design.md)",
    "legacyPath": "docs/architect/documentation-system-design.md",
    "target": {
      "path": "docs/platform/documentation/architecture/documentation-system-design.md",
      "anchor": null,
      "aliasId": "step10-whole-system-0439"
    },
    "portal": false,
    "area": "platform-root",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/governance.md",
    "line": 476,
    "legacy": "docs/architect/documentation-system-design.md",
    "previous": "[architect/documentation-system-design.md](documentation/architecture/documentation-system-design.md)",
    "now": "documentation/architecture/documentation-system-design.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../architect/documentation-system-design.md",
  "interimDestination": "documentation/architecture/documentation-system-design.md",
  "newDestination": "documentation/architecture/documentation-system-design.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/documentation/architecture/documentation-system-design.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "004bb912d6e4e132ac65a486c8b209e4b5e33c89fd19032c23738679743d842b"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/documentation-system-design.md",
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

## Entry f-108: link-108

```json
{
  "id": "link-108",
  "original": {
    "path": "docs/platform/host-invocation-routing/architecture/external-provider-protocol.md",
    "inputLine": 35,
    "inputColumn": 94,
    "lineBeforeLinkPass": 43,
    "before": "[source protocol §3](../../../architect/host-invocation-routing/external-provider-protocol.md#3-component-protocol)",
    "after": "[source protocol §3](external-provider-protocol.md#3-component-protocol)",
    "legacyPath": "docs/architect/host-invocation-routing/external-provider-protocol.md",
    "target": {
      "path": "docs/platform/host-invocation-routing/architecture/external-provider-protocol.md",
      "anchor": "3-component-protocol",
      "aliasId": "host-invocation-draft-033"
    },
    "portal": false,
    "area": "host-invocation-routing",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/host-invocation-routing/architecture/external-provider-protocol.md",
    "line": 43,
    "legacy": "docs/architect/host-invocation-routing/external-provider-protocol.md",
    "previous": "[source protocol §3](external-provider-protocol.md#3-component-protocol)",
    "now": "../../../architect/host-invocation-routing/external-provider-protocol.md#3-component-protocol",
    "action": "restored-legacy",
    "reason": "provenance/legacy-owner",
    "selfBefore": true,
    "portalBefore": false
  },
  "oldDestination": "../../../architect/host-invocation-routing/external-provider-protocol.md#3-component-protocol",
  "interimDestination": "external-provider-protocol.md#3-component-protocol",
  "newDestination": "../../../architect/host-invocation-routing/external-provider-protocol.md#3-component-protocol",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/architect/host-invocation-routing/external-provider-protocol.md",
    "anchor": "3-component-protocol",
    "resolves": true,
    "fileSHA256": "eb969b8dbb4520b4794887ee98da6c0aa6ab8b799d30647720cfe2ab0b0a260d"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/host-invocation-routing/external-provider-protocol.md",
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

## Entry f-109: link-109

```json
{
  "id": "link-109",
  "original": {
    "path": "docs/platform/host-invocation-routing/architecture/external-provider-protocol.md",
    "inputLine": 36,
    "inputColumn": 87,
    "lineBeforeLinkPass": 44,
    "before": "[source protocol §4](../../../architect/host-invocation-routing/external-provider-protocol.md#4-plugin-registry-linker)",
    "after": "[source protocol §4](external-provider-protocol.md#4-plugin-registry-linker)",
    "legacyPath": "docs/architect/host-invocation-routing/external-provider-protocol.md",
    "target": {
      "path": "docs/platform/host-invocation-routing/architecture/external-provider-protocol.md",
      "anchor": "4-plugin-registry-linker",
      "aliasId": "host-invocation-draft-034"
    },
    "portal": false,
    "area": "host-invocation-routing",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/host-invocation-routing/architecture/external-provider-protocol.md",
    "line": 44,
    "legacy": "docs/architect/host-invocation-routing/external-provider-protocol.md",
    "previous": "[source protocol §4](external-provider-protocol.md#4-plugin-registry-linker)",
    "now": "../../../architect/host-invocation-routing/external-provider-protocol.md#4-plugin-registry-linker",
    "action": "restored-legacy",
    "reason": "provenance/legacy-owner",
    "selfBefore": true,
    "portalBefore": false
  },
  "oldDestination": "../../../architect/host-invocation-routing/external-provider-protocol.md#4-plugin-registry-linker",
  "interimDestination": "external-provider-protocol.md#4-plugin-registry-linker",
  "newDestination": "../../../architect/host-invocation-routing/external-provider-protocol.md#4-plugin-registry-linker",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/architect/host-invocation-routing/external-provider-protocol.md",
    "anchor": "4-plugin-registry-linker",
    "resolves": true,
    "fileSHA256": "eb969b8dbb4520b4794887ee98da6c0aa6ab8b799d30647720cfe2ab0b0a260d"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/host-invocation-routing/external-provider-protocol.md",
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

## Entry f-110: link-110

```json
{
  "id": "link-110",
  "original": {
    "path": "docs/platform/host-invocation-routing/architecture/external-provider-protocol.md",
    "inputLine": 46,
    "inputColumn": 21,
    "lineBeforeLinkPass": 54,
    "before": "[../../../architect/host-invocation-routing/external-provider-protocol.md](../../../architect/host-invocation-routing/external-provider-protocol.md)",
    "after": "[../../../architect/host-invocation-routing/external-provider-protocol.md](../README.md)",
    "legacyPath": "docs/architect/host-invocation-routing/external-provider-protocol.md",
    "target": {
      "path": "docs/platform/host-invocation-routing/README.md",
      "anchor": null,
      "aliasId": "host-invocation-draft-026"
    },
    "portal": false,
    "area": "host-invocation-routing",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/host-invocation-routing/architecture/external-provider-protocol.md",
    "line": 54,
    "legacy": "docs/architect/host-invocation-routing/external-provider-protocol.md",
    "previous": "[../../../architect/host-invocation-routing/external-provider-protocol.md](../README.md)",
    "now": "../../../architect/host-invocation-routing/external-provider-protocol.md",
    "action": "restored-legacy",
    "reason": "provenance/legacy-owner",
    "selfBefore": false,
    "portalBefore": true
  },
  "oldDestination": "../../../architect/host-invocation-routing/external-provider-protocol.md",
  "interimDestination": "../README.md",
  "newDestination": "../../../architect/host-invocation-routing/external-provider-protocol.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/architect/host-invocation-routing/external-provider-protocol.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "eb969b8dbb4520b4794887ee98da6c0aa6ab8b799d30647720cfe2ab0b0a260d"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/host-invocation-routing/external-provider-protocol.md",
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

## Entry f-111: link-111

```json
{
  "id": "link-111",
  "original": {
    "path": "docs/platform/host-invocation-routing/architecture/host-use-cases.md",
    "inputLine": 34,
    "inputColumn": 77,
    "lineBeforeLinkPass": 42,
    "before": "[old architecture §10](../../../architect/host-invocation-routing/host-invocation-provider-routing.md#10-release-boundaries)",
    "after": "[old architecture §10](../spec.md#10-release-boundaries)",
    "legacyPath": "docs/architect/host-invocation-routing/host-invocation-provider-routing.md",
    "target": {
      "path": "docs/platform/host-invocation-routing/spec.md",
      "anchor": "10-release-boundaries",
      "aliasId": "host-invocation-draft-049"
    },
    "portal": false,
    "area": "host-invocation-routing",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/host-invocation-routing/architecture/host-use-cases.md",
    "line": 42,
    "legacy": "docs/architect/host-invocation-routing/host-invocation-provider-routing.md",
    "previous": "[old architecture §10](../spec.md#10-release-boundaries)",
    "now": "../spec.md#10-release-boundaries",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../../../architect/host-invocation-routing/host-invocation-provider-routing.md#10-release-boundaries",
  "interimDestination": "../spec.md#10-release-boundaries",
  "newDestination": "../spec.md#10-release-boundaries",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/host-invocation-routing/spec.md",
    "anchor": "10-release-boundaries",
    "resolves": true,
    "fileSHA256": "7aaaa030b242b19a0bd4f0f9a8faac74d50b8b6a86c7817a73e7bc2f1848243f"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/host-invocation-routing/host-invocation-provider-routing.md",
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

## Entry f-112: link-112

```json
{
  "id": "link-112",
  "original": {
    "path": "docs/platform/host-invocation-routing/architecture/host-use-cases.md",
    "inputLine": 46,
    "inputColumn": 25,
    "lineBeforeLinkPass": 54,
    "before": "[../../../architect/host-invocation-routing/host-invocation-provider-routing.md](../../../architect/host-invocation-routing/host-invocation-provider-routing.md)",
    "after": "[../../../architect/host-invocation-routing/host-invocation-provider-routing.md](../README.md)",
    "legacyPath": "docs/architect/host-invocation-routing/host-invocation-provider-routing.md",
    "target": {
      "path": "docs/platform/host-invocation-routing/README.md",
      "anchor": null,
      "aliasId": "host-invocation-draft-037"
    },
    "portal": false,
    "area": "host-invocation-routing",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/host-invocation-routing/architecture/host-use-cases.md",
    "line": 54,
    "legacy": "docs/architect/host-invocation-routing/host-invocation-provider-routing.md",
    "previous": "[../../../architect/host-invocation-routing/host-invocation-provider-routing.md](../README.md)",
    "now": "../spec.md",
    "action": "retargeted-specific",
    "reason": "specific-candidate",
    "selfBefore": false,
    "portalBefore": true
  },
  "oldDestination": "../../../architect/host-invocation-routing/host-invocation-provider-routing.md",
  "interimDestination": "../README.md",
  "newDestination": "../spec.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/host-invocation-routing/spec.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "7aaaa030b242b19a0bd4f0f9a8faac74d50b8b6a86c7817a73e7bc2f1848243f"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/host-invocation-routing/host-invocation-provider-routing.md",
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

## Entry f-113: link-113

```json
{
  "id": "link-113",
  "original": {
    "path": "docs/platform/host-invocation-routing/architecture/invocation-kernel.md",
    "inputLine": 49,
    "inputColumn": 25,
    "lineBeforeLinkPass": 57,
    "before": "[../../../architect/host-invocation-routing/host-invocation-provider-routing.md](../../../architect/host-invocation-routing/host-invocation-provider-routing.md)",
    "after": "[../../../architect/host-invocation-routing/host-invocation-provider-routing.md](../README.md)",
    "legacyPath": "docs/architect/host-invocation-routing/host-invocation-provider-routing.md",
    "target": {
      "path": "docs/platform/host-invocation-routing/README.md",
      "anchor": null,
      "aliasId": "host-invocation-draft-037"
    },
    "portal": false,
    "area": "host-invocation-routing",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/host-invocation-routing/architecture/invocation-kernel.md",
    "line": 57,
    "legacy": "docs/architect/host-invocation-routing/host-invocation-provider-routing.md",
    "previous": "[../../../architect/host-invocation-routing/host-invocation-provider-routing.md](../README.md)",
    "now": "../spec.md",
    "action": "retargeted-specific",
    "reason": "specific-candidate",
    "selfBefore": false,
    "portalBefore": true
  },
  "oldDestination": "../../../architect/host-invocation-routing/host-invocation-provider-routing.md",
  "interimDestination": "../README.md",
  "newDestination": "../spec.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/host-invocation-routing/spec.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "7aaaa030b242b19a0bd4f0f9a8faac74d50b8b6a86c7817a73e7bc2f1848243f"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/host-invocation-routing/host-invocation-provider-routing.md",
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

## Entry f-114: link-114

```json
{
  "id": "link-114",
  "original": {
    "path": "docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md",
    "inputLine": 36,
    "inputColumn": 78,
    "lineBeforeLinkPass": 44,
    "before": "[source transition §1](../../../architect/host-invocation-routing/legacy-cli-transition.md#1-two-distinct-adapters)",
    "after": "[source transition §1](legacy-cli-transition.md#1-two-distinct-adapters)",
    "legacyPath": "docs/architect/host-invocation-routing/legacy-cli-transition.md",
    "target": {
      "path": "docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md",
      "anchor": "1-two-distinct-adapters",
      "aliasId": "host-invocation-draft-055"
    },
    "portal": false,
    "area": "host-invocation-routing",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md",
    "line": 44,
    "legacy": "docs/architect/host-invocation-routing/legacy-cli-transition.md",
    "previous": "[source transition §1](legacy-cli-transition.md#1-two-distinct-adapters)",
    "now": "../../../architect/host-invocation-routing/legacy-cli-transition.md#1-two-distinct-adapters",
    "action": "restored-legacy",
    "reason": "self-link",
    "selfBefore": true,
    "portalBefore": false
  },
  "oldDestination": "../../../architect/host-invocation-routing/legacy-cli-transition.md#1-two-distinct-adapters",
  "interimDestination": "legacy-cli-transition.md#1-two-distinct-adapters",
  "newDestination": "../../../architect/host-invocation-routing/legacy-cli-transition.md#1-two-distinct-adapters",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/architect/host-invocation-routing/legacy-cli-transition.md",
    "anchor": "1-two-distinct-adapters",
    "resolves": true,
    "fileSHA256": "90e6dcd22a5729f513b3104b5f2113d9fad57e677a8485b6b2452183b8f97a67"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/host-invocation-routing/legacy-cli-transition.md",
    "action": "restored-legacy",
    "reason": "self-link",
    "selfRestored": true,
    "portalRetargeted": false,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-115: link-115

```json
{
  "id": "link-115",
  "original": {
    "path": "docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md",
    "inputLine": 37,
    "inputColumn": 65,
    "lineBeforeLinkPass": 45,
    "before": "[source transition §4](../../../architect/host-invocation-routing/legacy-cli-transition.md#4-public-presentation-versus-semantic-outcome)",
    "after": "[source transition §4](legacy-cli-transition.md#4-public-presentation-versus-semantic-outcome)",
    "legacyPath": "docs/architect/host-invocation-routing/legacy-cli-transition.md",
    "target": {
      "path": "docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md",
      "anchor": "4-public-presentation-versus-semantic-outcome",
      "aliasId": "host-invocation-draft-058"
    },
    "portal": false,
    "area": "host-invocation-routing",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md",
    "line": 45,
    "legacy": "docs/architect/host-invocation-routing/legacy-cli-transition.md",
    "previous": "[source transition §4](legacy-cli-transition.md#4-public-presentation-versus-semantic-outcome)",
    "now": "../../../architect/host-invocation-routing/legacy-cli-transition.md#4-public-presentation-versus-semantic-outcome",
    "action": "restored-legacy",
    "reason": "self-link",
    "selfBefore": true,
    "portalBefore": false
  },
  "oldDestination": "../../../architect/host-invocation-routing/legacy-cli-transition.md#4-public-presentation-versus-semantic-outcome",
  "interimDestination": "legacy-cli-transition.md#4-public-presentation-versus-semantic-outcome",
  "newDestination": "../../../architect/host-invocation-routing/legacy-cli-transition.md#4-public-presentation-versus-semantic-outcome",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/architect/host-invocation-routing/legacy-cli-transition.md",
    "anchor": "4-public-presentation-versus-semantic-outcome",
    "resolves": true,
    "fileSHA256": "90e6dcd22a5729f513b3104b5f2113d9fad57e677a8485b6b2452183b8f97a67"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/host-invocation-routing/legacy-cli-transition.md",
    "action": "restored-legacy",
    "reason": "self-link",
    "selfRestored": true,
    "portalRetargeted": false,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-116: link-116

```json
{
  "id": "link-116",
  "original": {
    "path": "docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md",
    "inputLine": 46,
    "inputColumn": 23,
    "lineBeforeLinkPass": 54,
    "before": "[../../../architect/host-invocation-routing/legacy-cli-transition.md](../../../architect/host-invocation-routing/legacy-cli-transition.md)",
    "after": "[../../../architect/host-invocation-routing/legacy-cli-transition.md](../README.md)",
    "legacyPath": "docs/architect/host-invocation-routing/legacy-cli-transition.md",
    "target": {
      "path": "docs/platform/host-invocation-routing/README.md",
      "anchor": null,
      "aliasId": "host-invocation-draft-052"
    },
    "portal": false,
    "area": "host-invocation-routing",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md",
    "line": 54,
    "legacy": "docs/architect/host-invocation-routing/legacy-cli-transition.md",
    "previous": "[../../../architect/host-invocation-routing/legacy-cli-transition.md](../README.md)",
    "now": "../../../architect/host-invocation-routing/legacy-cli-transition.md",
    "action": "restored-legacy",
    "reason": "self-link",
    "selfBefore": false,
    "portalBefore": true
  },
  "oldDestination": "../../../architect/host-invocation-routing/legacy-cli-transition.md",
  "interimDestination": "../README.md",
  "newDestination": "../../../architect/host-invocation-routing/legacy-cli-transition.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/architect/host-invocation-routing/legacy-cli-transition.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "90e6dcd22a5729f513b3104b5f2113d9fad57e677a8485b6b2452183b8f97a67"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/host-invocation-routing/legacy-cli-transition.md",
    "action": "restored-legacy",
    "reason": "self-link",
    "selfRestored": false,
    "portalRetargeted": false,
    "portalRestored": true,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

## Entry f-117: link-117

```json
{
  "id": "link-117",
  "original": {
    "path": "docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md",
    "inputLine": 98,
    "inputColumn": 316,
    "lineBeforeLinkPass": 106,
    "before": "[Repo Layout Vision](../../../architect/component-boundary/repo-layout-vision.md)",
    "after": "[Repo Layout Vision](../../component-boundary.md)",
    "legacyPath": "docs/architect/component-boundary/repo-layout-vision.md",
    "target": {
      "path": "docs/platform/component-boundary.md",
      "anchor": null,
      "aliasId": "step10-whole-system-0379"
    },
    "portal": false,
    "area": "host-invocation-routing",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md",
    "line": 106,
    "legacy": "docs/architect/component-boundary/repo-layout-vision.md",
    "previous": "[Repo Layout Vision](../../component-boundary.md)",
    "now": "../../component-boundary.md",
    "action": "unchanged-candidate",
    "reason": "explicit-alias",
    "selfBefore": false,
    "portalBefore": false
  },
  "oldDestination": "../../../architect/component-boundary/repo-layout-vision.md",
  "interimDestination": "../../component-boundary.md",
  "newDestination": "../../component-boundary.md",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/component-boundary.md",
    "anchor": null,
    "resolves": true,
    "fileSHA256": "384cf74c699ef5f6013c9f975dd056844184697bba58784d2ad9b2154ce51d4a"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/component-boundary/repo-layout-vision.md",
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

## Entry f-118: link-118

```json
{
  "id": "link-118",
  "original": {
    "path": "docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md",
    "inputLine": 100,
    "inputColumn": 588,
    "lineBeforeLinkPass": 108,
    "before": "[Runtime Identity And Activation](../../../architect/packaging-distribution/runtime-identity-and-activation.md)",
    "after": "[Runtime Identity And Activation](../../packaging-distribution/README.md)",
    "legacyPath": "docs/architect/packaging-distribution/runtime-identity-and-activation.md",
    "target": {
      "path": "docs/platform/packaging-distribution/README.md",
      "anchor": null,
      "aliasId": "step10-packaging-distribution-0173"
    },
    "portal": false,
    "area": "host-invocation-routing",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md",
    "line": 108,
    "legacy": "docs/architect/packaging-distribution/runtime-identity-and-activation.md",
    "previous": "[Runtime Identity And Activation](../../packaging-distribution/README.md)",
    "now": "../../packaging-distribution/architecture/runtime-identity-and-activation.md",
    "action": "retargeted-specific",
    "reason": "specific-candidate",
    "selfBefore": false,
    "portalBefore": true
  },
  "oldDestination": "../../../architect/packaging-distribution/runtime-identity-and-activation.md",
  "interimDestination": "../../packaging-distribution/README.md",
  "newDestination": "../../packaging-distribution/architecture/runtime-identity-and-activation.md",
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

## Entry f-119: link-119

```json
{
  "id": "link-119",
  "original": {
    "path": "docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md",
    "inputLine": 158,
    "inputColumn": 3,
    "lineBeforeLinkPass": 166,
    "before": "[Runtime Identity And Activation](../../../architect/packaging-distribution/runtime-identity-and-activation.md)",
    "after": "[Runtime Identity And Activation](../../packaging-distribution/README.md)",
    "legacyPath": "docs/architect/packaging-distribution/runtime-identity-and-activation.md",
    "target": {
      "path": "docs/platform/packaging-distribution/README.md",
      "anchor": null,
      "aliasId": "step10-packaging-distribution-0173"
    },
    "portal": false,
    "area": "host-invocation-routing",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md",
    "line": 166,
    "legacy": "docs/architect/packaging-distribution/runtime-identity-and-activation.md",
    "previous": "[Runtime Identity And Activation](../../packaging-distribution/README.md)",
    "now": "../../packaging-distribution/architecture/runtime-identity-and-activation.md",
    "action": "retargeted-specific",
    "reason": "specific-candidate",
    "selfBefore": false,
    "portalBefore": true
  },
  "oldDestination": "../../../architect/packaging-distribution/runtime-identity-and-activation.md",
  "interimDestination": "../../packaging-distribution/README.md",
  "newDestination": "../../packaging-distribution/architecture/runtime-identity-and-activation.md",
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

## Entry f-120: link-120

```json
{
  "id": "link-120",
  "original": {
    "path": "docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md",
    "inputLine": 39,
    "inputColumn": 58,
    "lineBeforeLinkPass": 47,
    "before": "[source migration §2](../../../architect/host-invocation-routing/node-to-rust-component-migration.md#2-options-considered)",
    "after": "[source migration §2](node-to-rust-migration.md#2-options-considered)",
    "legacyPath": "docs/architect/host-invocation-routing/node-to-rust-component-migration.md",
    "target": {
      "path": "docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md",
      "anchor": "2-options-considered",
      "aliasId": "host-invocation-draft-065"
    },
    "portal": false,
    "area": "host-invocation-routing",
    "reviewStatus": "pending"
  },
  "correction": {
    "file": "docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md",
    "line": 47,
    "legacy": "docs/architect/host-invocation-routing/node-to-rust-component-migration.md",
    "previous": "[source migration §2](node-to-rust-migration.md#2-options-considered)",
    "now": "../../../architect/host-invocation-routing/node-to-rust-component-migration.md#2-options-considered",
    "action": "restored-legacy",
    "reason": "self-link",
    "selfBefore": true,
    "portalBefore": false
  },
  "oldDestination": "../../../architect/host-invocation-routing/node-to-rust-component-migration.md#2-options-considered",
  "interimDestination": "node-to-rust-migration.md#2-options-considered",
  "newDestination": "../../../architect/host-invocation-routing/node-to-rust-component-migration.md#2-options-considered",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/architect/host-invocation-routing/node-to-rust-component-migration.md",
    "anchor": "2-options-considered",
    "resolves": true,
    "fileSHA256": "17103ea9eeaf6ca68869a37e44dca6cb8cc128ae315ef914bde71950f05d20b7"
  },
  "referentPreservation": {
    "declaredReferent": "docs/architect/host-invocation-routing/node-to-rust-component-migration.md",
    "action": "restored-legacy",
    "reason": "self-link",
    "selfRestored": true,
    "portalRetargeted": false,
    "portalRestored": false,
    "independentSemanticReviewRequired": true,
    "note": "The final rule and explicit action preserve the declared source/self relationship or route its referent to the specific candidate. Resolution does not certify semantics."
  }
}
```

