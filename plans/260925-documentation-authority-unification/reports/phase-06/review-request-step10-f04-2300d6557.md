# Current link pass and helper rules — part 4

One replacement review request; entries 361–480 of section f. **120 entries**. Content and SYNC `2300d65571968bb3bcb80123a273272586e3f1db`; comparison base `980cb29312b8701f5ea639278f44e1a57a6e5c02`. [Single index](review-request-step10-index-2300d6557.md). Old requests packaged at `8d38b18ed` are superseded. No producer seed or verdict.

Current decision and current witness fields take precedence over explicitly preserved historical records. Every rebound row is pending; old reviewed fields occur only inside historical before records. A36 deep lists are in [A36](step10-sync2300-A36.json); all truth corrections, all partial carries and all unequal source/target rows require deep review.

## Entry f-361: link-361

```json
{
  "id": "link-361",
  "original": {
    "path": "docs/platform/work-state/README.md",
    "inputLine": 32,
    "inputColumn": 35,
    "lineBeforeLinkPass": 40,
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
    "line": 40,
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

## Entry f-362: link-362

```json
{
  "id": "link-362",
  "original": {
    "path": "docs/platform/work-state/README.md",
    "inputLine": 32,
    "inputColumn": 90,
    "lineBeforeLinkPass": 40,
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
    "line": 40,
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

## Entry f-363: link-363

```json
{
  "id": "link-363",
  "original": {
    "path": "docs/platform/work-state/README.md",
    "inputLine": 51,
    "inputColumn": 30,
    "lineBeforeLinkPass": 59,
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
    "line": 59,
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

## Entry f-364: link-364

```json
{
  "id": "link-364",
  "original": {
    "path": "docs/platform/work-state/README.md",
    "inputLine": 51,
    "inputColumn": 85,
    "lineBeforeLinkPass": 59,
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
    "line": 59,
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

## Entry f-365: link-365

```json
{
  "id": "link-365",
  "original": {
    "path": "docs/platform/work-state/README.md",
    "inputLine": 64,
    "inputColumn": 18,
    "lineBeforeLinkPass": 72,
    "before": "[../../specs/work-state.md](../../specs/work-state.md)",
    "after": "[../../specs/work-state.md](README.md)",
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
    "line": 72,
    "legacy": "docs/specs/work-state.md",
    "previous": "[../../specs/work-state.md](README.md)",
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

## Entry f-366: link-366

```json
{
  "id": "link-366",
  "original": {
    "path": "docs/platform/work-state/README.md",
    "inputLine": 65,
    "inputColumn": 18,
    "lineBeforeLinkPass": 73,
    "before": "[../../io-contract.md](../../io-contract.md)",
    "after": "[../../io-contract.md](contracts/cli-io-contract.md)",
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
    "line": 73,
    "legacy": "docs/io-contract.md",
    "previous": "[../../io-contract.md](contracts/cli-io-contract.md)",
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

## Entry f-367: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/README.md",
  "line": 68,
  "label": "../transitional-switchboard.md",
  "legacy": "docs/transitional-switchboard.md",
  "before": "../transitional-switchboard.md",
  "after": "documentation/switchboard.md",
  "target": "docs/platform/documentation/switchboard.md",
  "anchor": null,
  "reason": "explicit-alias",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/documentation/switchboard.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-368: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/README.md",
  "line": 80,
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

## Entry f-369: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/README.md",
  "line": 81,
  "label": "../transitional-switchboard.md",
  "legacy": "docs/transitional-switchboard.md",
  "before": "../transitional-switchboard.md",
  "after": "documentation/switchboard.md",
  "target": "docs/platform/documentation/switchboard.md",
  "anchor": null,
  "reason": "explicit-alias",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/documentation/switchboard.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-370: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/agent-coordination/README.md",
  "line": 31,
  "label": "the runner spec",
  "legacy": "docs/specs/runner.md",
  "before": "../../specs/runner.md",
  "after": "../runner/spec.md",
  "target": "docs/platform/runner/spec.md",
  "anchor": null,
  "reason": "specific-candidate",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/runner/spec.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-371: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/agent-coordination/architecture/evidence-and-results.md",
  "line": 78,
  "label": "runner spec",
  "legacy": "docs/specs/runner.md",
  "before": "../../../specs/runner.md",
  "after": "../../runner/spec.md",
  "target": "docs/platform/runner/spec.md",
  "anchor": null,
  "reason": "specific-candidate",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/runner/spec.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-372: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/agent-coordination/architecture/runtime-recovery-design.md",
  "line": 199,
  "label": "runner spec",
  "legacy": "docs/specs/runner.md",
  "before": "../../../specs/runner.md",
  "after": "../../runner/spec.md",
  "target": "docs/platform/runner/spec.md",
  "anchor": null,
  "reason": "specific-candidate",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/runner/spec.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-373: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/agent-coordination/architecture/work-integration.md",
  "line": 86,
  "label": "runner spec",
  "legacy": "docs/specs/runner.md",
  "before": "../../../specs/runner.md",
  "after": "../../runner/spec.md",
  "target": "docs/platform/runner/spec.md",
  "anchor": null,
  "reason": "specific-candidate",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/runner/spec.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-374: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/agent-coordination/decisions/ADR-003-assignment-run-runresult-separation.md",
  "line": 23,
  "label": "the runner spec",
  "legacy": "docs/specs/runner.md",
  "before": "../../../specs/runner.md",
  "after": "../../runner/spec.md",
  "target": "docs/platform/runner/spec.md",
  "anchor": null,
  "reason": "specific-candidate",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/runner/spec.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-375: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/agent-coordination/decisions/ADR-005-herdr-visibility-only.md",
  "line": 23,
  "label": "the runner spec",
  "legacy": "docs/specs/runner.md",
  "before": "../../../specs/runner.md",
  "after": "../../runner/spec.md",
  "target": "docs/platform/runner/spec.md",
  "anchor": null,
  "reason": "specific-candidate",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/runner/spec.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-376: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/agent-coordination/proposals/README.md",
  "line": 62,
  "label": "Architecture Intent",
  "legacy": "docs/architect/architecture-intent.md",
  "before": "../../../architect/architecture-intent.md",
  "after": "../../system-architecture/architecture/architecture-intent.md",
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

## Entry f-377: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/agent-coordination/proposals/README.md",
  "line": 65,
  "label": "Step 09: Group Thinking Substrate",
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

## Entry f-378: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/agent-coordination/proposals/README.md",
  "line": 68,
  "label": "Step 10: Coding Domain Adoption Of The Coordination Foundation",
  "legacy": "docs/architect/proposals/step-10-coding-domain-adoption.md",
  "before": "../../../architect/proposals/step-10-coding-domain-adoption.md",
  "after": "../../proposals/step-10-coding-domain-adoption.md",
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

## Entry f-379: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/agent-coordination/proposals/README.md",
  "line": 72,
  "label": "Component Authority Boundary Map",
  "legacy": "docs/architect/proposals/component-authority-boundary-map.md",
  "before": "../../../architect/proposals/component-authority-boundary-map.md",
  "after": "../../proposals/component-authority-boundary-map.md",
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

## Entry f-380: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/agent-coordination/spec.md",
  "line": 24,
  "label": "the runner spec",
  "legacy": "docs/specs/runner.md",
  "before": "../../specs/runner.md",
  "after": "../runner/spec.md",
  "target": "docs/platform/runner/spec.md",
  "anchor": null,
  "reason": "specific-candidate",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/runner/spec.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-381: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/agent-coordination/spec.md",
  "line": 37,
  "label": "docs/specs/runner.md",
  "legacy": "docs/specs/runner.md",
  "before": "../../specs/runner.md",
  "after": "../runner/spec.md",
  "target": "docs/platform/runner/spec.md",
  "anchor": null,
  "reason": "specific-candidate",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/runner/spec.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-382: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/agent-coordination/spec.md",
  "line": 42,
  "label": "the runner spec",
  "legacy": "docs/specs/runner.md",
  "before": "../../specs/runner.md",
  "after": "../runner/spec.md",
  "target": "docs/platform/runner/spec.md",
  "anchor": null,
  "reason": "specific-candidate",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/runner/spec.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-383: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/agent-coordination/spec.md",
  "line": 75,
  "label": "docs/specs/runner.md",
  "legacy": "docs/specs/runner.md",
  "before": "../../specs/runner.md",
  "after": "../runner/spec.md",
  "target": "docs/platform/runner/spec.md",
  "anchor": null,
  "reason": "specific-candidate",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/runner/spec.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-384: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/agent-coordination/spec.md",
  "line": 79,
  "label": "Runner spec",
  "legacy": "docs/specs/runner.md",
  "before": "../../specs/runner.md",
  "after": "../runner/spec.md",
  "target": "docs/platform/runner/spec.md",
  "anchor": null,
  "reason": "specific-candidate",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/runner/spec.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-385: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/agent-coordination/spec.md",
  "line": 90,
  "label": "confinement-authority spec",
  "legacy": "docs/specs/confinement-authority.md",
  "before": "../../specs/confinement-authority.md",
  "after": "../agent-confinement/spec.md",
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

## Entry f-386: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/agent-coordination/spec.md",
  "line": 100,
  "label": "the current owner",
  "legacy": "docs/specs/runner.md",
  "before": "../../specs/runner.md",
  "after": "../runner/spec.md",
  "target": "docs/platform/runner/spec.md",
  "anchor": null,
  "reason": "specific-candidate",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/runner/spec.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-387: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/agent-coordination/spec.md",
  "line": 107,
  "label": "runner spec",
  "legacy": "docs/specs/runner.md",
  "before": "../../specs/runner.md",
  "after": "../runner/spec.md",
  "target": "docs/platform/runner/spec.md",
  "anchor": null,
  "reason": "specific-candidate",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/runner/spec.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-388: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/agent-coordination/vision.md",
  "line": 356,
  "label": "the runner spec",
  "legacy": "docs/specs/runner.md",
  "before": "../../specs/runner.md",
  "after": "../runner/spec.md",
  "target": "docs/platform/runner/spec.md",
  "anchor": null,
  "reason": "specific-candidate",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/runner/spec.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-389: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/architecture-map.md",
  "line": 102,
  "label": "0012",
  "legacy": "docs/specs/work-state.md",
  "before": "../specs/work-state.md#0012-mô-hình-đồ-thị-cạnh-định-kiểu-hợp-nhất-thay-thế-depsparent-tách-rời",
  "after": "work-state/decisions/retired-decision-history.md#8-adr-0012-unified-typed-edge-graph-model",
  "target": "docs/platform/work-state/decisions/retired-decision-history.md",
  "anchor": "8-adr-0012-unified-typed-edge-graph-model",
  "reason": "explicit-alias",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/work-state/decisions/retired-decision-history.md",
    "anchor": "8-adr-0012-unified-typed-edge-graph-model",
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-390: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/architecture-map.md",
  "line": 104,
  "label": "0013",
  "legacy": "docs/specs/work-state.md",
  "before": "../specs/work-state.md#0013-kênh-báo-cáo-không-ghi-workerrunner-cho-discovered-from",
  "after": "work-state/decisions/retired-decision-history.md#9-adr-0013-report-not-write-channel-for-discovered-from",
  "target": "docs/platform/work-state/decisions/retired-decision-history.md",
  "anchor": "9-adr-0013-report-not-write-channel-for-discovered-from",
  "reason": "explicit-alias",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/work-state/decisions/retired-decision-history.md",
    "anchor": "9-adr-0013-report-not-write-channel-for-discovered-from",
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-391: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/architecture-map.md",
  "line": 128,
  "label": "0012",
  "legacy": "docs/specs/work-state.md",
  "before": "../specs/work-state.md#0012-mô-hình-đồ-thị-cạnh-định-kiểu-hợp-nhất-thay-thế-depsparent-tách-rời",
  "after": "work-state/decisions/retired-decision-history.md#8-adr-0012-unified-typed-edge-graph-model",
  "target": "docs/platform/work-state/decisions/retired-decision-history.md",
  "anchor": "8-adr-0012-unified-typed-edge-graph-model",
  "reason": "explicit-alias",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/work-state/decisions/retired-decision-history.md",
    "anchor": "8-adr-0012-unified-typed-edge-graph-model",
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-392: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/architecture-map.md",
  "line": 142,
  "label": "0013",
  "legacy": "docs/specs/work-state.md",
  "before": "../specs/work-state.md#0013-kênh-báo-cáo-không-ghi-workerrunner-cho-discovered-from",
  "after": "work-state/decisions/retired-decision-history.md#9-adr-0013-report-not-write-channel-for-discovered-from",
  "target": "docs/platform/work-state/decisions/retired-decision-history.md",
  "anchor": "9-adr-0013-report-not-write-channel-for-discovered-from",
  "reason": "explicit-alias",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/work-state/decisions/retired-decision-history.md",
    "anchor": "9-adr-0013-report-not-write-channel-for-discovered-from",
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-393: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/component-boundary.md",
  "line": 48,
  "label": "../architect/proposals/component-authority-boundary-map.md",
  "legacy": "docs/architect/proposals/component-authority-boundary-map.md",
  "before": "../architect/proposals/component-authority-boundary-map.md",
  "after": "proposals/component-authority-boundary-map.md",
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

## Entry f-394: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/component-boundary.md",
  "line": 98,
  "label": "../architect/proposals/component-authority-boundary-map.md",
  "legacy": "docs/architect/proposals/component-authority-boundary-map.md",
  "before": "../architect/proposals/component-authority-boundary-map.md",
  "after": "proposals/component-authority-boundary-map.md",
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

## Entry f-395: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/component-boundary.md",
  "line": 100,
  "label": "../specs/observe.md",
  "legacy": "docs/specs/observe.md",
  "before": "../specs/observe.md",
  "after": "observe/spec.md",
  "target": "docs/platform/observe/spec.md",
  "anchor": null,
  "reason": "specific-candidate",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/observe/spec.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-396: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/component-boundary.md",
  "line": 113,
  "label": "Architecture Map",
  "legacy": "docs/architecture-map.md",
  "before": "../architecture-map.md",
  "after": "architecture-map.md",
  "target": "docs/platform/architecture-map.md",
  "anchor": null,
  "reason": "explicit-alias",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/architecture-map.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-397: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/component-boundary.md",
  "line": 113,
  "label": "System Overview",
  "legacy": "docs/specs/system-overview.md",
  "before": "../specs/system-overview.md",
  "after": "system-overview/spec.md",
  "target": "docs/platform/system-overview/spec.md",
  "anchor": null,
  "reason": "explicit-alias",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/system-overview/spec.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-398: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/component-boundary.md",
  "line": 113,
  "label": "Platform Foundations",
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

## Entry f-399: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/component-boundary.md",
  "line": 113,
  "label": "Domainization Architecture",
  "legacy": "docs/architect/domainization/README.md",
  "before": "../architect/domainization/README.md",
  "after": "domainization/architecture/domainization.md",
  "target": "docs/platform/domainization/architecture/domainization.md",
  "anchor": null,
  "reason": "explicit-alias",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/domainization/architecture/domainization.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-400: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/component-boundary.md",
  "line": 113,
  "label": "Agent Coordination Foundation Vision",
  "legacy": "docs/architect/agent-coordination/vision.md",
  "before": "../architect/agent-coordination/vision.md",
  "after": "agent-coordination/vision.md",
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

## Entry f-401: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/component-boundary.md",
  "line": 113,
  "label": "Concept Relationships",
  "legacy": "docs/architect/agent-coordination/vocabulary/concept-relationships.md",
  "before": "../architect/agent-coordination/vocabulary/concept-relationships.md",
  "after": "agent-coordination/vocabulary/concept-relationships.md",
  "target": "docs/platform/agent-coordination/vocabulary/concept-relationships.md",
  "anchor": null,
  "reason": "specific-candidate",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/agent-coordination/vocabulary/concept-relationships.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-402: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/component-boundary.md",
  "line": 113,
  "label": "Dispatch Control Plane",
  "legacy": "docs/architect/agent-coordination/architecture/dispatch-control-plane.md",
  "before": "../architect/agent-coordination/architecture/dispatch-control-plane.md",
  "after": "agent-coordination/architecture/dispatch-control-plane.md",
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

## Entry f-403: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/component-boundary.md",
  "line": 113,
  "label": "Protocol Model",
  "legacy": "docs/architect/agent-coordination/architecture/protocol-model.md",
  "before": "../architect/agent-coordination/architecture/protocol-model.md",
  "after": "agent-coordination/architecture/protocol-model.md",
  "target": "docs/platform/agent-coordination/architecture/protocol-model.md",
  "anchor": null,
  "reason": "specific-candidate",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/agent-coordination/architecture/protocol-model.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-404: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/component-boundary.md",
  "line": 113,
  "label": "CoordinationSession Contract",
  "legacy": "docs/architect/agent-coordination/contracts/coordination-session.md",
  "before": "../architect/agent-coordination/contracts/coordination-session.md",
  "after": "agent-coordination/history/retired-engine/files/contracts/coordination-session.md",
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

## Entry f-405: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/component-boundary.md",
  "line": 113,
  "label": "FlowDefinition Contract",
  "legacy": "docs/architect/agent-coordination/contracts/flow-definition.md",
  "before": "../architect/agent-coordination/contracts/flow-definition.md",
  "after": "agent-coordination/history/retired-engine/files/contracts/flow-definition.md",
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

## Entry f-406: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/component-boundary.md",
  "line": 245,
  "label": "Work-State Spec",
  "legacy": "docs/specs/work-state.md",
  "before": "../specs/work-state.md",
  "after": "work-state/spec.md",
  "target": "docs/platform/work-state/spec.md",
  "anchor": null,
  "reason": "specific-candidate",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/work-state/spec.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-407: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/component-boundary.md",
  "line": 245,
  "label": "Work Item Lifecycle Vision",
  "legacy": "docs/work-item-lifecycle-vision.md",
  "before": "../work-item-lifecycle-vision.md",
  "after": "vision.md",
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

## Entry f-408: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/component-boundary.md",
  "line": 245,
  "label": "System Overview",
  "legacy": "docs/specs/system-overview.md",
  "before": "../specs/system-overview.md",
  "after": "system-overview/spec.md",
  "target": "docs/platform/system-overview/spec.md",
  "anchor": null,
  "reason": "explicit-alias",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/system-overview/spec.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-409: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/component-boundary.md",
  "line": 246,
  "label": "Runner Spec",
  "legacy": "docs/specs/runner.md",
  "before": "../specs/runner.md",
  "after": "runner/spec.md",
  "target": "docs/platform/runner/spec.md",
  "anchor": null,
  "reason": "specific-candidate",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/runner/spec.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-410: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/component-boundary.md",
  "line": 247,
  "label": "Runner Spec",
  "legacy": "docs/specs/runner.md",
  "before": "../specs/runner.md",
  "after": "runner/spec.md",
  "target": "docs/platform/runner/spec.md",
  "anchor": null,
  "reason": "specific-candidate",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/runner/spec.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-411: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/component-boundary.md",
  "line": 247,
  "label": "Dispatch Control Plane",
  "legacy": "docs/architect/agent-coordination/architecture/dispatch-control-plane.md",
  "before": "../architect/agent-coordination/architecture/dispatch-control-plane.md",
  "after": "agent-coordination/architecture/dispatch-control-plane.md",
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

## Entry f-412: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/component-boundary.md",
  "line": 247,
  "label": "Assignment/Run/RunResult Contract",
  "legacy": "docs/architect/agent-coordination/contracts/assignment-run-runresult.md",
  "before": "../architect/agent-coordination/contracts/assignment-run-runresult.md",
  "after": "agent-coordination/contracts/assignment-run-runresult.md",
  "target": "docs/platform/agent-coordination/contracts/assignment-run-runresult.md",
  "anchor": null,
  "reason": "specific-candidate",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/agent-coordination/contracts/assignment-run-runresult.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-413: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/component-boundary.md",
  "line": 248,
  "label": "Evidence And Results",
  "legacy": "docs/architect/agent-coordination/architecture/evidence-and-results.md",
  "before": "../architect/agent-coordination/architecture/evidence-and-results.md",
  "after": "agent-coordination/architecture/evidence-and-results.md",
  "target": "docs/platform/agent-coordination/architecture/evidence-and-results.md",
  "anchor": null,
  "reason": "specific-candidate",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/agent-coordination/architecture/evidence-and-results.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-414: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/component-boundary.md",
  "line": 248,
  "label": "Assignment/Run/RunResult Contract",
  "legacy": "docs/architect/agent-coordination/contracts/assignment-run-runresult.md",
  "before": "../architect/agent-coordination/contracts/assignment-run-runresult.md",
  "after": "agent-coordination/contracts/assignment-run-runresult.md",
  "target": "docs/platform/agent-coordination/contracts/assignment-run-runresult.md",
  "anchor": null,
  "reason": "specific-candidate",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/agent-coordination/contracts/assignment-run-runresult.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-415: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/component-boundary.md",
  "line": 248,
  "label": "Runner Spec",
  "legacy": "docs/specs/runner.md",
  "before": "../specs/runner.md",
  "after": "runner/spec.md",
  "target": "docs/platform/runner/spec.md",
  "anchor": null,
  "reason": "specific-candidate",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/runner/spec.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-416: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/component-boundary.md",
  "line": 249,
  "label": "Domainization Architecture",
  "legacy": "docs/architect/domainization/README.md",
  "before": "../architect/domainization/README.md",
  "after": "domainization/architecture/domainization.md",
  "target": "docs/platform/domainization/architecture/domainization.md",
  "anchor": null,
  "reason": "explicit-alias",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/domainization/architecture/domainization.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-417: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/component-boundary.md",
  "line": 249,
  "label": "System Overview",
  "legacy": "docs/specs/system-overview.md",
  "before": "../specs/system-overview.md",
  "after": "system-overview/spec.md",
  "target": "docs/platform/system-overview/spec.md",
  "anchor": null,
  "reason": "explicit-alias",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/system-overview/spec.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-418: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/component-boundary.md",
  "line": 249,
  "label": "Work Item Lifecycle Vision",
  "legacy": "docs/work-item-lifecycle-vision.md",
  "before": "../work-item-lifecycle-vision.md",
  "after": "vision.md",
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

## Entry f-419: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/component-boundary.md",
  "line": 250,
  "label": "fgOS Plugin Spec",
  "legacy": "docs/specs/fgos-plugin.md",
  "before": "../specs/fgos-plugin.md",
  "after": "claude-plugin/spec.md",
  "target": "docs/platform/claude-plugin/spec.md",
  "anchor": null,
  "reason": "explicit-alias",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/claude-plugin/spec.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-420: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/component-boundary.md",
  "line": 250,
  "label": "Herdr Web Dashboard Spec",
  "legacy": "docs/specs/herdr-web-dashboard.md",
  "before": "../specs/herdr-web-dashboard.md",
  "after": "herdr-web-dashboard/spec.md",
  "target": "docs/platform/herdr-web-dashboard/spec.md",
  "anchor": null,
  "reason": "explicit-alias",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/herdr-web-dashboard/spec.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-421: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/component-boundary.md",
  "line": 250,
  "label": "Visibility And Herdr",
  "legacy": "docs/architect/agent-coordination/architecture/visibility-and-herdr.md",
  "before": "../architect/agent-coordination/architecture/visibility-and-herdr.md",
  "after": "agent-coordination/architecture/visibility-and-herdr.md",
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

## Entry f-422: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/component-boundary.md",
  "line": 250,
  "label": "IO Contract",
  "legacy": "docs/io-contract.md",
  "before": "../io-contract.md",
  "after": "work-state/contracts/cli-io-contract.md",
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

## Entry f-423: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/component-boundary.md",
  "line": 251,
  "label": "Distribution Spec",
  "legacy": "docs/specs/distribution.md",
  "before": "../specs/distribution.md",
  "after": "packaging-distribution/spec.md",
  "target": "docs/platform/packaging-distribution/spec.md",
  "anchor": null,
  "reason": "specific-candidate",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/packaging-distribution/spec.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-424: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/component-boundary.md",
  "line": 251,
  "label": "Distribution Vision",
  "legacy": "docs/distribution-vision.md",
  "before": "../distribution-vision.md",
  "after": "packaging-distribution/history/distribution-vision.md",
  "target": "docs/platform/packaging-distribution/history/distribution-vision.md",
  "anchor": null,
  "reason": "explicit-alias",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/packaging-distribution/history/distribution-vision.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-425: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/component-boundary.md",
  "line": 252,
  "label": "System Overview",
  "legacy": "docs/specs/system-overview.md",
  "before": "../specs/system-overview.md",
  "after": "system-overview/spec.md",
  "target": "docs/platform/system-overview/spec.md",
  "anchor": null,
  "reason": "explicit-alias",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/system-overview/spec.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-426: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/component-boundary.md",
  "line": 395,
  "label": "Workflow Stage Operation Contract",
  "legacy": "docs/architect/agent-coordination/contracts/workflow-stage-operation.md",
  "before": "../architect/agent-coordination/contracts/workflow-stage-operation.md",
  "after": "agent-coordination/contracts/workflow-stage-operation.md",
  "target": "docs/platform/agent-coordination/contracts/workflow-stage-operation.md",
  "anchor": null,
  "reason": "specific-candidate",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/agent-coordination/contracts/workflow-stage-operation.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-427: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/component-boundary.md",
  "line": 396,
  "label": "FlowDefinition Contract",
  "legacy": "docs/architect/agent-coordination/contracts/flow-definition.md",
  "before": "../architect/agent-coordination/contracts/flow-definition.md",
  "after": "agent-coordination/history/retired-engine/files/contracts/flow-definition.md",
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

## Entry f-428: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/component-boundary.md",
  "line": 397,
  "label": "CoordinationSession Contract",
  "legacy": "docs/architect/agent-coordination/contracts/coordination-session.md",
  "before": "../architect/agent-coordination/contracts/coordination-session.md",
  "after": "agent-coordination/history/retired-engine/files/contracts/coordination-session.md",
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

## Entry f-429: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/component-boundary.md",
  "line": 398,
  "label": "Assignment, Run, And RunResult Contract",
  "legacy": "docs/architect/agent-coordination/contracts/assignment-run-runresult.md",
  "before": "../architect/agent-coordination/contracts/assignment-run-runresult.md",
  "after": "agent-coordination/contracts/assignment-run-runresult.md",
  "target": "docs/platform/agent-coordination/contracts/assignment-run-runresult.md",
  "anchor": null,
  "reason": "specific-candidate",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/agent-coordination/contracts/assignment-run-runresult.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-430: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/component-boundary.md",
  "line": 399,
  "label": "Assignment, Run, And RunResult Contract",
  "legacy": "docs/architect/agent-coordination/contracts/assignment-run-runresult.md",
  "before": "../architect/agent-coordination/contracts/assignment-run-runresult.md",
  "after": "agent-coordination/contracts/assignment-run-runresult.md",
  "target": "docs/platform/agent-coordination/contracts/assignment-run-runresult.md",
  "anchor": null,
  "reason": "specific-candidate",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/agent-coordination/contracts/assignment-run-runresult.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-431: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/component-boundary.md",
  "line": 400,
  "label": "Assignment, Run, And RunResult Contract",
  "legacy": "docs/architect/agent-coordination/contracts/assignment-run-runresult.md",
  "before": "../architect/agent-coordination/contracts/assignment-run-runresult.md",
  "after": "agent-coordination/contracts/assignment-run-runresult.md",
  "target": "docs/platform/agent-coordination/contracts/assignment-run-runresult.md",
  "anchor": null,
  "reason": "specific-candidate",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/agent-coordination/contracts/assignment-run-runresult.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-432: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/component-boundary.md",
  "line": 401,
  "label": "Dispatch Control Plane",
  "legacy": "docs/architect/agent-coordination/architecture/dispatch-control-plane.md",
  "before": "../architect/agent-coordination/architecture/dispatch-control-plane.md",
  "after": "agent-coordination/architecture/dispatch-control-plane.md",
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

## Entry f-433: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/component-boundary.md",
  "line": 402,
  "label": "Evidence And Result Architecture",
  "legacy": "docs/architect/agent-coordination/architecture/evidence-and-results.md",
  "before": "../architect/agent-coordination/architecture/evidence-and-results.md",
  "after": "agent-coordination/architecture/evidence-and-results.md",
  "target": "docs/platform/agent-coordination/architecture/evidence-and-results.md",
  "anchor": null,
  "reason": "specific-candidate",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/agent-coordination/architecture/evidence-and-results.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-434: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/component-boundary.md",
  "line": 403,
  "label": "Work Integration Boundaries",
  "legacy": "docs/architect/agent-coordination/architecture/work-integration.md",
  "before": "../architect/agent-coordination/architecture/work-integration.md",
  "after": "agent-coordination/architecture/work-integration.md",
  "target": "docs/platform/agent-coordination/architecture/work-integration.md",
  "anchor": null,
  "reason": "specific-candidate",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/agent-coordination/architecture/work-integration.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-435: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/component-boundary.md",
  "line": 405,
  "label": "ADR-007 Domain Harness Seam",
  "legacy": "docs/architect/agent-coordination/decisions/ADR-007-domain-harness-seam-and-non-driving-inline-evidence.md",
  "before": "../architect/agent-coordination/decisions/ADR-007-domain-harness-seam-and-non-driving-inline-evidence.md",
  "after": "agent-coordination/decisions/ADR-007-domain-harness-seam-and-non-driving-inline-evidence.md",
  "target": "docs/platform/agent-coordination/decisions/ADR-007-domain-harness-seam-and-non-driving-inline-evidence.md",
  "anchor": null,
  "reason": "specific-candidate",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/agent-coordination/decisions/ADR-007-domain-harness-seam-and-non-driving-inline-evidence.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-436: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/component-boundary.md",
  "line": 1177,
  "label": "Domainization Architecture",
  "legacy": "docs/architect/domainization/README.md",
  "before": "../architect/domainization/README.md",
  "after": "domainization/architecture/domainization.md",
  "target": "docs/platform/domainization/architecture/domainization.md",
  "anchor": null,
  "reason": "explicit-alias",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/domainization/architecture/domainization.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-437: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/component-boundary.md",
  "line": 1187,
  "label": "Host Invocation And Provider Routing",
  "legacy": "docs/architect/host-invocation-routing/host-invocation-provider-routing.md",
  "before": "../architect/host-invocation-routing/host-invocation-provider-routing.md",
  "after": "host-invocation-routing/spec.md",
  "target": "docs/platform/host-invocation-routing/spec.md",
  "anchor": null,
  "reason": "specific-candidate",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/host-invocation-routing/spec.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-438: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/component-boundary.md",
  "line": 1188,
  "label": "Node To Rust Component Migration",
  "legacy": "docs/architect/host-invocation-routing/node-to-rust-component-migration.md",
  "before": "../architect/host-invocation-routing/node-to-rust-component-migration.md",
  "after": "host-invocation-routing/architecture/node-to-rust-migration.md",
  "target": "docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md",
  "anchor": null,
  "reason": "specific-candidate",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-439: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/component-boundary.md",
  "line": 1189,
  "label": "Packaging And Distribution Architecture",
  "legacy": "docs/architect/packaging-distribution/README.md",
  "before": "../architect/packaging-distribution/README.md",
  "after": "packaging-distribution/README.md",
  "target": "docs/platform/packaging-distribution/README.md",
  "anchor": null,
  "reason": "explicit-alias",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/packaging-distribution/README.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-440: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/component-boundary.md",
  "line": 1268,
  "label": "Domainization Architecture",
  "legacy": "docs/architect/domainization/README.md",
  "before": "../architect/domainization/README.md",
  "after": "domainization/architecture/domainization.md",
  "target": "docs/platform/domainization/architecture/domainization.md",
  "anchor": null,
  "reason": "explicit-alias",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/domainization/architecture/domainization.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-441: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/component-boundary.md",
  "line": 1289,
  "label": "host-invocation-provider-routing.md",
  "legacy": "docs/architect/host-invocation-routing/host-invocation-provider-routing.md",
  "before": "../architect/host-invocation-routing/host-invocation-provider-routing.md",
  "after": "host-invocation-routing/spec.md",
  "target": "docs/platform/host-invocation-routing/spec.md",
  "anchor": null,
  "reason": "specific-candidate",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/host-invocation-routing/spec.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-442: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/component-boundary.md",
  "line": 1302,
  "label": "node-to-rust-component-migration.md",
  "legacy": "docs/architect/host-invocation-routing/node-to-rust-component-migration.md",
  "before": "../architect/host-invocation-routing/node-to-rust-component-migration.md",
  "after": "host-invocation-routing/architecture/node-to-rust-migration.md",
  "target": "docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md",
  "anchor": null,
  "reason": "specific-candidate",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-443: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/component-boundary.md",
  "line": 1362,
  "label": "Architecture Map",
  "legacy": "docs/architecture-map.md",
  "before": "../architecture-map.md",
  "after": "architecture-map.md",
  "target": "docs/platform/architecture-map.md",
  "anchor": null,
  "reason": "explicit-alias",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/architecture-map.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-444: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/component-boundary.md",
  "line": 1364,
  "label": "System Overview",
  "legacy": "docs/specs/system-overview.md",
  "before": "../specs/system-overview.md",
  "after": "system-overview/spec.md",
  "target": "docs/platform/system-overview/spec.md",
  "anchor": null,
  "reason": "explicit-alias",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/system-overview/spec.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-445: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/component-boundary.md",
  "line": 1366,
  "label": "Platform Foundations",
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

## Entry f-446: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/component-boundary.md",
  "line": 1368,
  "label": "Work Item Lifecycle Vision",
  "legacy": "docs/work-item-lifecycle-vision.md",
  "before": "../work-item-lifecycle-vision.md",
  "after": "vision.md",
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

## Entry f-447: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/component-boundary.md",
  "line": 1370,
  "label": "Distribution Vision",
  "legacy": "docs/distribution-vision.md",
  "before": "../distribution-vision.md",
  "after": "packaging-distribution/history/distribution-vision.md",
  "target": "docs/platform/packaging-distribution/history/distribution-vision.md",
  "anchor": null,
  "reason": "explicit-alias",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/packaging-distribution/history/distribution-vision.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-448: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/component-boundary.md",
  "line": 1372,
  "label": "Domainization Architecture",
  "legacy": "docs/architect/domainization/README.md",
  "before": "../architect/domainization/README.md",
  "after": "domainization/architecture/domainization.md",
  "target": "docs/platform/domainization/architecture/domainization.md",
  "anchor": null,
  "reason": "explicit-alias",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/domainization/architecture/domainization.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-449: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/component-boundary.md",
  "line": 1378,
  "label": "Agent Coordination Portal",
  "legacy": "docs/architect/agent-coordination/README.md",
  "before": "../architect/agent-coordination/README.md",
  "after": "agent-coordination/README.md",
  "target": "docs/platform/agent-coordination/README.md",
  "anchor": null,
  "reason": "explicit-alias",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/agent-coordination/README.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-450: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/component-boundary.md",
  "line": 1380,
  "label": "Agent Coordination Foundation Vision",
  "legacy": "docs/architect/agent-coordination/vision.md",
  "before": "../architect/agent-coordination/vision.md",
  "after": "agent-coordination/vision.md",
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

## Entry f-451: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/component-boundary.md",
  "line": 1382,
  "label": "System Context",
  "legacy": "docs/architect/agent-coordination/architecture/system-context.md",
  "before": "../architect/agent-coordination/architecture/system-context.md",
  "after": "agent-coordination/history/retired-engine/legacy/architecture/system-context.md",
  "target": "docs/platform/agent-coordination/history/retired-engine/legacy/architecture/system-context.md",
  "anchor": null,
  "reason": "specific-candidate",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/agent-coordination/history/retired-engine/legacy/architecture/system-context.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-452: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/component-boundary.md",
  "line": 1384,
  "label": "Runtime Model",
  "legacy": "docs/architect/agent-coordination/architecture/runtime-model.md",
  "before": "../architect/agent-coordination/architecture/runtime-model.md",
  "after": "agent-coordination/architecture/runtime-model.md",
  "target": "docs/platform/agent-coordination/architecture/runtime-model.md",
  "anchor": null,
  "reason": "specific-candidate",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/agent-coordination/architecture/runtime-model.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-453: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/component-boundary.md",
  "line": 1386,
  "label": "Dispatch Control Plane",
  "legacy": "docs/architect/agent-coordination/architecture/dispatch-control-plane.md",
  "before": "../architect/agent-coordination/architecture/dispatch-control-plane.md",
  "after": "agent-coordination/architecture/dispatch-control-plane.md",
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

## Entry f-454: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/component-boundary.md",
  "line": 1388,
  "label": "Evidence And Results",
  "legacy": "docs/architect/agent-coordination/architecture/evidence-and-results.md",
  "before": "../architect/agent-coordination/architecture/evidence-and-results.md",
  "after": "agent-coordination/architecture/evidence-and-results.md",
  "target": "docs/platform/agent-coordination/architecture/evidence-and-results.md",
  "anchor": null,
  "reason": "specific-candidate",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/agent-coordination/architecture/evidence-and-results.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-455: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/component-boundary.md",
  "line": 1390,
  "label": "Work Integration",
  "legacy": "docs/architect/agent-coordination/architecture/work-integration.md",
  "before": "../architect/agent-coordination/architecture/work-integration.md",
  "after": "agent-coordination/architecture/work-integration.md",
  "target": "docs/platform/agent-coordination/architecture/work-integration.md",
  "anchor": null,
  "reason": "specific-candidate",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/agent-coordination/architecture/work-integration.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-456: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/documentation/operations/portals/docs-portal.md",
  "line": 28,
  "label": "doc-governance.md",
  "legacy": "docs/doc-governance.md",
  "before": "../../../../doc-governance.md",
  "after": "../../../governance.md",
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

## Entry f-457: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/documentation/operations/portals/docs-portal.md",
  "line": 55,
  "label": "doc-governance.md",
  "legacy": "docs/doc-governance.md",
  "before": "../../../../doc-governance.md",
  "after": "../../../governance.md",
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

## Entry f-458: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/documentation/switchboard.md",
  "line": 115,
  "label": "docs/doc-governance.md",
  "legacy": "docs/doc-governance.md",
  "before": "../../doc-governance.md",
  "after": "../governance.md",
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

## Entry f-459: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/domainization/architecture/domainization.md",
  "line": 32,
  "label": "Component Boundary Advisory",
  "legacy": "docs/architect/component-boundary/component-boundary-advisory.md",
  "before": "../../../architect/component-boundary/component-boundary-advisory.md",
  "after": "../../component-boundary.md",
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

## Entry f-460: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/domainization/architecture/domainization.md",
  "line": 32,
  "label": "System Overview",
  "legacy": "docs/specs/system-overview.md",
  "before": "../../../specs/system-overview.md",
  "after": "../../system-overview/spec.md",
  "target": "docs/platform/system-overview/spec.md",
  "anchor": null,
  "reason": "explicit-alias",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/system-overview/spec.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-461: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/domainization/architecture/domainization.md",
  "line": 32,
  "label": "Work Item Lifecycle Vision",
  "legacy": "docs/work-item-lifecycle-vision.md",
  "before": "../../../work-item-lifecycle-vision.md",
  "after": "../../vision.md",
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

## Entry f-462: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/domainization/architecture/domainization.md",
  "line": 32,
  "label": "Work-State Spec",
  "legacy": "docs/specs/work-state.md",
  "before": "../../../specs/work-state.md",
  "after": "../../work-state/spec.md",
  "target": "docs/platform/work-state/spec.md",
  "anchor": null,
  "reason": "specific-candidate",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/work-state/spec.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-463: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/domainization/architecture/domainization.md",
  "line": 50,
  "label": "Component Boundary Advisory",
  "legacy": "docs/architect/component-boundary/component-boundary-advisory.md",
  "before": "../../../architect/component-boundary/component-boundary-advisory.md",
  "after": "../../component-boundary.md",
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

## Entry f-464: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/governance.md",
  "line": 457,
  "label": "transitional-switchboard.md",
  "legacy": "docs/transitional-switchboard.md",
  "before": "../transitional-switchboard.md",
  "after": "documentation/switchboard.md",
  "target": "docs/platform/documentation/switchboard.md",
  "anchor": null,
  "reason": "explicit-alias",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/documentation/switchboard.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-465: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/governance.md",
  "line": 471,
  "label": "README.md",
  "legacy": "docs/README.md",
  "before": "../README.md",
  "after": "documentation/operations/portals/docs-portal.md",
  "target": "docs/platform/documentation/operations/portals/docs-portal.md",
  "anchor": null,
  "reason": "explicit-alias",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/documentation/operations/portals/docs-portal.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-466: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/governance.md",
  "line": 473,
  "label": "transitional-switchboard.md",
  "legacy": "docs/transitional-switchboard.md",
  "before": "../transitional-switchboard.md",
  "after": "documentation/switchboard.md",
  "target": "docs/platform/documentation/switchboard.md",
  "anchor": null,
  "reason": "explicit-alias",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/documentation/switchboard.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-467: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/governance.md",
  "line": 476,
  "label": "architect/documentation-system-design.md",
  "legacy": "docs/architect/documentation-system-design.md",
  "before": "../architect/documentation-system-design.md",
  "after": "documentation/architecture/documentation-system-design.md",
  "target": "docs/platform/documentation/architecture/documentation-system-design.md",
  "anchor": null,
  "reason": "explicit-alias",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/documentation/architecture/documentation-system-design.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-468: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/host-invocation-routing/architecture/host-use-cases.md",
  "line": 42,
  "label": "old architecture §10",
  "legacy": "docs/architect/host-invocation-routing/host-invocation-provider-routing.md",
  "before": "../../../architect/host-invocation-routing/host-invocation-provider-routing.md#10-release-boundaries",
  "after": "../spec.md#10-release-boundaries",
  "target": "docs/platform/host-invocation-routing/spec.md",
  "anchor": "10-release-boundaries",
  "reason": "explicit-alias",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/host-invocation-routing/spec.md",
    "anchor": "10-release-boundaries",
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-469: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/host-invocation-routing/architecture/host-use-cases.md",
  "line": 54,
  "label": "../../../architect/host-invocation-routing/host-invocation-provider-routing.md",
  "legacy": "docs/architect/host-invocation-routing/host-invocation-provider-routing.md",
  "before": "../../../architect/host-invocation-routing/host-invocation-provider-routing.md",
  "after": "../spec.md",
  "target": "docs/platform/host-invocation-routing/spec.md",
  "anchor": null,
  "reason": "specific-candidate",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/host-invocation-routing/spec.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-470: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/host-invocation-routing/architecture/invocation-kernel.md",
  "line": 57,
  "label": "../../../architect/host-invocation-routing/host-invocation-provider-routing.md",
  "legacy": "docs/architect/host-invocation-routing/host-invocation-provider-routing.md",
  "before": "../../../architect/host-invocation-routing/host-invocation-provider-routing.md",
  "after": "../spec.md",
  "target": "docs/platform/host-invocation-routing/spec.md",
  "anchor": null,
  "reason": "specific-candidate",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/host-invocation-routing/spec.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-471: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md",
  "line": 106,
  "label": "Repo Layout Vision",
  "legacy": "docs/architect/component-boundary/repo-layout-vision.md",
  "before": "../../../architect/component-boundary/repo-layout-vision.md",
  "after": "../../component-boundary.md",
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

## Entry f-472: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md",
  "line": 108,
  "label": "Runtime Identity And Activation",
  "legacy": "docs/architect/packaging-distribution/runtime-identity-and-activation.md",
  "before": "../../../architect/packaging-distribution/runtime-identity-and-activation.md",
  "after": "../../packaging-distribution/architecture/runtime-identity-and-activation.md",
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

## Entry f-473: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md",
  "line": 166,
  "label": "Runtime Identity And Activation",
  "legacy": "docs/architect/packaging-distribution/runtime-identity-and-activation.md",
  "before": "../../../architect/packaging-distribution/runtime-identity-and-activation.md",
  "after": "../../packaging-distribution/architecture/runtime-identity-and-activation.md",
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

## Entry f-474: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md",
  "line": 50,
  "label": "Observe Spec",
  "legacy": "docs/specs/observe.md",
  "before": "../../../specs/observe.md",
  "after": "../../observe/spec.md",
  "target": "docs/platform/observe/spec.md",
  "anchor": null,
  "reason": "specific-candidate",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/observe/spec.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-475: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md",
  "line": 229,
  "label": "Runtime Identity And Activation",
  "legacy": "docs/architect/packaging-distribution/runtime-identity-and-activation.md",
  "before": "../../../architect/packaging-distribution/runtime-identity-and-activation.md",
  "after": "../../packaging-distribution/architecture/runtime-identity-and-activation.md",
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

## Entry f-476: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md",
  "line": 310,
  "label": "Future Constraints",
  "legacy": "docs/architect/packaging-distribution/future-constraints.md",
  "before": "../../../architect/packaging-distribution/future-constraints.md",
  "after": "../../packaging-distribution/architecture/future-constraints.md",
  "target": "docs/platform/packaging-distribution/architecture/future-constraints.md",
  "anchor": null,
  "reason": "explicit-alias",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/packaging-distribution/architecture/future-constraints.md",
    "anchor": null,
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-477: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md",
  "line": 406,
  "label": "Runtime Identity And Activation",
  "legacy": "docs/architect/packaging-distribution/runtime-identity-and-activation.md",
  "before": "../../../architect/packaging-distribution/runtime-identity-and-activation.md",
  "after": "../../packaging-distribution/architecture/runtime-identity-and-activation.md",
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

## Entry f-478: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md",
  "line": 444,
  "label": "Runtime Identity And Activation",
  "legacy": "docs/architect/packaging-distribution/runtime-identity-and-activation.md",
  "before": "../../../architect/packaging-distribution/runtime-identity-and-activation.md",
  "after": "../../packaging-distribution/architecture/runtime-identity-and-activation.md",
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

## Entry f-479: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/host-invocation-routing/architecture/provider-routing.md",
  "line": 52,
  "label": "old architecture §6",
  "legacy": "docs/architect/host-invocation-routing/host-invocation-provider-routing.md",
  "before": "../../../architect/host-invocation-routing/host-invocation-provider-routing.md#6-router-pure-and-invocationservice-pipeline",
  "after": "../spec.md#6-router-pure-and-invocationservice-pipeline",
  "target": "docs/platform/host-invocation-routing/spec.md",
  "anchor": "6-router-pure-and-invocationservice-pipeline",
  "reason": "explicit-alias",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/host-invocation-routing/spec.md",
    "anchor": "6-router-pure-and-invocationservice-pipeline",
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

## Entry f-480: correction-helper-edit

```json
{
  "kind": "correction-helper-edit",
  "file": "docs/platform/host-invocation-routing/architecture/provider-routing.md",
  "line": 53,
  "label": "external provider protocol §5",
  "legacy": "docs/architect/host-invocation-routing/external-provider-protocol.md",
  "before": "../../../architect/host-invocation-routing/external-provider-protocol.md#5-namespace-rules",
  "after": "external-provider-protocol.md#5-namespace-rules",
  "target": "docs/platform/host-invocation-routing/architecture/external-provider-protocol.md",
  "anchor": "5-namespace-rules",
  "reason": "explicit-alias",
  "resolution": {
    "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
    "path": "docs/platform/host-invocation-routing/architecture/external-provider-protocol.md",
    "anchor": "5-namespace-rules",
    "resolves": true
  },
  "independentSemanticReviewRequired": true
}
```

