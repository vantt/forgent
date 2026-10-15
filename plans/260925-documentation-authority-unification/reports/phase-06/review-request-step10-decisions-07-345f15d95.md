# Bounded re-review: decisions, part 7

Author session: `codex-session:unit-run-1792094246578-b2fbe39b@2026-10-16`
Packaged by: `codex-session:unit-run-1792094246578-b2fbe39b@2026-10-16`
Content pin / SYNC: `345f15d95663260976200be66d1b9a6c648bcd6d`
Comparison base: `4a18f35ff5d6a9b7a07e955bd64418282c6a91b2`
Entries: **11**, maximum120 per request.

[Single request index](review-request-step10-index-345f15d95.md). [A36 exact lists](step10-sync345-A36.json). This is one combined bounded request set for all changes at345f15d95 and the current package. Historical before records are witnesses, not current dispositions. Source authors and current row authors remain exact. No producer seed, draw or verdict is selected.

Every submitted manual claim gets digest recomputation, anchor and shard/pack equality checks and an ordinary verdict with a `deep` or `mechanical` note. All unequal source/target digests, partial carries and historical claims are deep. All explicitly marked re-anchor, link, rationale, L10-22, tool, content and accounting deltas are deep. The independent reviewer seeds at least 69/460 Weak-exact/Judgment rows, records seed/sample IDs, and deep-reads the whole pack if >3% of deep rows need rework. Existing truth samples and checkpoint obligations remain unchanged.

Only decisions/historical entries request claim verdicts. Anchors, rationale proofs, native tuples and other accounting entries request item-specific review; they do not create additional claim approvals. Entries marked `changed-review-application-confirmation` preserve existing committed ordinary approvals and request confirmation of exact application; packaging does not revoke or approve them. New/changed pending rows carry no old approval. The runner's package commit supplies the new predecessor shard and request files; immutable document/helper bytes are pinned above.

## Entry claim_0cf686172891ae94a83c1993dab8e1f5

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s10-systemic-native-predecessors.json",
  "collection": "registryGaps",
  "claimId": "claim_0cf686172891ae94a83c1993dab8e1f5",
  "authorSession": "codex-session:unit-run-1792094246578-b2fbe39b@2026-10-16",
  "before": null,
  "currentDecision": {
    "claimId": "claim_0cf686172891ae94a83c1993dab8e1f5",
    "sourcePath": "docs/platform/host-invocation-routing/contracts/legacy-payload.md",
    "sourceUnitDigest": "62d185bdf7449fb6b6664260598e25aebbbd33ef6f868b97809bab5c88b28d62",
    "claimKind": "specification",
    "disposition": "supersede",
    "targetOwner": "docs/platform/host-invocation-routing/contracts/legacy-payload.md",
    "targetAnchor": "unheaded-block-9",
    "targetUnitDigest": "14c1c0ac5e7be57002c04a3c0beed23bc3afcb963eb9f6ece2afe2dbcb29e015",
    "targetAncestry": [
      "Contract: Legacy Payload",
      "5. Related Files"
    ],
    "rationale": "A22/A31/L10-18b/L10-20: native predecessor from 19ca8de23 is superseded by the current same-section unit after authorized source/target link-cell restoration, sentence-order restoration or evolve code-line citation correction. Complete immutable before/after unit text and native successor identity are recorded in step10-sync345-predecessor-reconciliation.json; review the actual delta, not ordinal-anchor equality. Current successor remains candidate, no truth or cutover approval.",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792094246578-b2fbe39b@2026-10-16",
    "reviewNote": "Independent review pending at 345f15d95; no approval carried."
  },
  "native": {
    "kind": "identityGaps",
    "sourcePath": "docs/platform/host-invocation-routing/contracts/legacy-payload.md",
    "unitDigest": "0dba4bc4f30710e959b71aefedcd0fd89ffa8ea2a5f5fa690746a96b173e5ecd",
    "identityFingerprint": "0dba4bc4f30710e959b71aefedcd0fd89ffa8ea2a5f5fa690746a96b173e5ecd",
    "claimId": "claim_0cf686172891ae94a83c1993dab8e1f5",
    "sourceAnchor": "unheaded-block-9",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "62d185bdf7449fb6b6664260598e25aebbbd33ef6f868b97809bab5c88b28d62",
    "claimKind": "contract",
    "status": "future",
    "origin": "added-since-2300d65571968bb3bcb80123a273272586e3f1db",
    "identityStatus": "identity-gap",
    "gapReason": "edited unit whose anchor unheaded-block-9 is not a stable heading anchor"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-9",
      "githubAnchor": "unheaded-block-9",
      "stableAnchor": "unheaded-block-9",
      "title": "Unheaded block 9",
      "startLine": 55,
      "endLine": 60,
      "textDigest": "62d185bdf7449fb6b6664260598e25aebbbd33ef6f868b97809bab5c88b28d62",
      "sample": "| Relationship | File |\n| --- | --- |\n| legacy transition | [../../../architect/host-invocation-routing/legacy-cli-transition.md](../../../architect/host-invocation-routing/legacy-",
      "identityFingerprint": "0dba4bc4f30710e959b71aefedcd0fd89ffa8ea2a5f5fa690746a96b173e5ecd",
      "ancestry": [
        "Contract: Legacy Payload",
        "5. Related Files"
      ],
      "text": "| Relationship | File |\n| --- | --- |\n| legacy transition | [../../../architect/host-invocation-routing/legacy-cli-transition.md](../../../architect/host-invocation-routing/legacy-cli-transition.md) |\n| command route descriptor | [command-route-descriptor.md](command-route-descriptor.md) |\n| release manifest | [../../packaging-distribution/contracts/release-manifest.md](../../packaging-distribution/contracts/release-manifest.md) |\n| source transition | [../../../architect/host-invocation-routing/legacy-cli-transition.md](../../../architect/host-invocation-routing/legacy-cli-transition.md) |"
    }
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-9",
    "githubAnchor": "unheaded-block-9",
    "stableAnchor": "unheaded-block-9",
    "title": "Unheaded block 9",
    "startLine": 55,
    "endLine": 60,
    "textDigest": "14c1c0ac5e7be57002c04a3c0beed23bc3afcb963eb9f6ece2afe2dbcb29e015",
    "sample": "| Relationship | File |\n| --- | --- |\n| legacy transition | [../architecture/legacy-cli-transition.md](../architecture/legacy-cli-transition.md) |\n| command route descriptor | [com",
    "identityFingerprint": "913edc9e80d1c3a497adfc15d20f1635227059ed6a0ec1bd750488315ec1d578",
    "ancestry": [
      "Contract: Legacy Payload",
      "5. Related Files"
    ],
    "text": "| Relationship | File |\n| --- | --- |\n| legacy transition | [../architecture/legacy-cli-transition.md](../architecture/legacy-cli-transition.md) |\n| command route descriptor | [command-route-descriptor.md](command-route-descriptor.md) |\n| release manifest | [../../packaging-distribution/contracts/release-manifest.md](../../packaging-distribution/contracts/release-manifest.md) |\n| source transition | [../../../architect/host-invocation-routing/legacy-cli-transition.md](../../../architect/host-invocation-routing/legacy-cli-transition.md) |"
  },
  "classObservation": {
    "class": "Judgment",
    "reason": "no target digest match",
    "targetUnit": null
  },
  "sourceTargetDigestsUnequal": true,
  "mechanicalRequired": true,
  "deepRequired": true,
  "reviewScope": "Review current pending binding and rationale; no inherited approval.",
  "currentContentCommit": "345f15d95663260976200be66d1b9a6c648bcd6d",
  "entryId": "claim_0cf686172891ae94a83c1993dab8e1f5"
}
```

## Entry claim_a93bd8da295ccacefb41a101085b898e

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s10-systemic-native-predecessors.json",
  "collection": "registryGaps",
  "claimId": "claim_a93bd8da295ccacefb41a101085b898e",
  "authorSession": "codex-session:unit-run-1792094246578-b2fbe39b@2026-10-16",
  "before": null,
  "currentDecision": {
    "claimId": "claim_a93bd8da295ccacefb41a101085b898e",
    "sourcePath": "docs/platform/host-invocation-routing/verification/source-preservation-audit.md",
    "sourceUnitDigest": "6bad0fe97aa355df9cb36c5956d863ab1a101cfa982bdbe724e4224952c2cd04",
    "claimKind": "specification",
    "disposition": "supersede",
    "targetOwner": "docs/platform/host-invocation-routing/verification/source-preservation-audit.md",
    "targetAnchor": "unheaded-block-6",
    "targetUnitDigest": "bde5207b515b4be800ca245741a3c524e97067e3c96e39853879a1995d7c2ed0",
    "targetAncestry": [
      "Host Invocation Source Preservation Audit",
      "2. Source Coverage Matrix"
    ],
    "rationale": "A22/A31/L10-18b/L10-20: native predecessor from 19ca8de23 is superseded by the current same-section unit after authorized source/target link-cell restoration, sentence-order restoration or evolve code-line citation correction. Complete immutable before/after unit text and native successor identity are recorded in step10-sync345-predecessor-reconciliation.json; review the actual delta, not ordinal-anchor equality. Current successor remains candidate, no truth or cutover approval.",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792094246578-b2fbe39b@2026-10-16",
    "reviewNote": "Independent review pending at 345f15d95; no approval carried."
  },
  "native": {
    "kind": "identityGaps",
    "sourcePath": "docs/platform/host-invocation-routing/verification/source-preservation-audit.md",
    "unitDigest": "198f87b632109516af33d6ddd3dff7df85366114e65caa9a770fcf02d02cd880",
    "identityFingerprint": "198f87b632109516af33d6ddd3dff7df85366114e65caa9a770fcf02d02cd880",
    "claimId": "claim_a93bd8da295ccacefb41a101085b898e",
    "sourceAnchor": "unheaded-block-6",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "6bad0fe97aa355df9cb36c5956d863ab1a101cfa982bdbe724e4224952c2cd04",
    "claimKind": "verification",
    "status": "future",
    "origin": "added-since-2300d65571968bb3bcb80123a273272586e3f1db",
    "identityStatus": "identity-gap",
    "gapReason": "edited unit whose anchor unheaded-block-6 is not a stable heading anchor"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-6",
      "githubAnchor": "unheaded-block-6",
      "stableAnchor": "unheaded-block-6",
      "title": "Unheaded block 6",
      "startLine": 37,
      "endLine": 44,
      "textDigest": "6bad0fe97aa355df9cb36c5956d863ab1a101cfa982bdbe724e4224952c2cd04",
      "sample": "| Legacy source | Source content audited | Preservation target |\n| --- | --- | --- |\n| [documentation-standardization-plan.md](../../../architect/host-invocation-routing/documentat",
      "identityFingerprint": "198f87b632109516af33d6ddd3dff7df85366114e65caa9a770fcf02d02cd880",
      "ancestry": [
        "Host Invocation Source Preservation Audit",
        "2. Source Coverage Matrix"
      ],
      "text": "| Legacy source | Source content audited | Preservation target |\n| --- | --- | --- |\n| [documentation-standardization-plan.md](../../../architect/host-invocation-routing/documentation-standardization-plan.md) | Goal, non-goals, hard rules, source inventory requirement, target tree, status vocabulary, phase order, ledger requirement, old-doc redirect requirement, component-boundary check, validation requirement. | [../README.md](../README.md), [../intent-preservation-ledger.md](../intent-preservation-ledger.md), [../history/source-inventory.md](../history/source-inventory.md), this audit. |\n| [host-invocation-provider-routing.md](../../../architect/host-invocation-routing/host-invocation-provider-routing.md) | Architecture name, problem statement, canonical names, peer host use cases, core contracts, pure Router, `InvocationService`, two-stage authority, failure families, lifecycle record, human-input parking, physical placement, release boundaries, open questions. | [../vision.md](../vision.md), [../architecture/invocation-kernel.md](../architecture/invocation-kernel.md), [../architecture/host-use-cases.md](../architecture/host-use-cases.md), [../architecture/provider-routing.md](../architecture/provider-routing.md), [../contracts/operation-catalog.md](../contracts/operation-catalog.md), [../contracts/operation-provider.md](../contracts/operation-provider.md), [../contracts/operation-request-outcome.md](../contracts/operation-request-outcome.md), [implementation-alignment.md](implementation-alignment.md), ledger rows HI-I001 through HI-I019. |\n| [../architecture/external-provider-protocol.md](../architecture/external-provider-protocol.md) | Component class versus invocation mechanism, built-in/process/WASM protocol placement, JSON-RPC 2.0 semantics over length-prefixed stdio frames, static manifest discovery, registry/linker meaning, namespace and replacement rules. | [external-provider-protocol.md](../../../architect/host-invocation-routing/external-provider-protocol.md), [../contracts/component-protocol.md](../contracts/component-protocol.md), [../contracts/external-provider-manifest.md](../contracts/external-provider-manifest.md), [../architecture/provider-routing.md](../architecture/provider-routing.md), [r2-external-process-proof.md](r2-external-process-proof.md), ledger rows HI-I020 through HI-I024. |\n| [../architecture/legacy-cli-transition.md](../architecture/legacy-cli-transition.md) | Separate `LegacyCliPassthroughProvider` and `LegacySemanticProvider`, `legacy-node` identity, `bin/fgos.mjs` immovability, activation-manifest resolution, caller inventory, `CommandRouteDescriptor`, Rust parser ownership, `fgos.v1` presentation boundary, Rust host benefit/cost. | [legacy-cli-transition.md](../../../architect/host-invocation-routing/legacy-cli-transition.md), [../contracts/legacy-payload.md](../contracts/legacy-payload.md), [../contracts/command-route-descriptor.md](../contracts/command-route-descriptor.md), [compatibility-harness.md](compatibility-harness.md), [../history/host-invocation-baseline.md](../history/host-invocation-baseline.md), ledger rows HI-I025 through HI-I033. |\n| [../architecture/node-to-rust-migration.md](../architecture/node-to-rust-migration.md) | Chosen migration strategy, rejected migration options, R1/R2/R3 sequence, release readiness categories, component-boundary repetition rule, read-model-before-writer rule, writer migration constraints, Node removal gate, rollback rules, verification gate, remaining decisions. | [node-to-rust-component-migration.md](../../../architect/host-invocation-routing/node-to-rust-component-migration.md), [../architecture/release-boundaries.md](../architecture/release-boundaries.md), [r1-rust-host-proof.md](r1-rust-host-proof.md), [r2-external-process-proof.md](r2-external-process-proof.md), [r3-remote-peer-proof.md](r3-remote-peer-proof.md), [../history/host-invocation-baseline.md](../history/host-invocation-baseline.md), ledger rows HI-I034 through HI-I038. |\n| [rust-cli-and-proof-components-plan.md](../../../architect/host-invocation-routing/rust-cli-and-proof-components-plan.md) | Outcome, non-goals, settled choices, P0-P9 proof graph, test gates, rollback gates, risk controls, done criteria, remaining choices for target matrix, compatibility window, and preview versus stable. | [../architecture/release-boundaries.md](../architecture/release-boundaries.md), [compatibility-harness.md](compatibility-harness.md), [r1-rust-host-proof.md](r1-rust-host-proof.md), [r2-external-process-proof.md](r2-external-process-proof.md), [r3-remote-peer-proof.md](r3-remote-peer-proof.md), [implementation-alignment.md](implementation-alignment.md), ledger rows HI-I016 through HI-I019 and HI-I034 through HI-I038. |"
    }
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-6",
    "githubAnchor": "unheaded-block-6",
    "stableAnchor": "unheaded-block-6",
    "title": "Unheaded block 6",
    "startLine": 37,
    "endLine": 44,
    "textDigest": "bde5207b515b4be800ca245741a3c524e97067e3c96e39853879a1995d7c2ed0",
    "sample": "| Legacy source | Source content audited | Preservation target |\n| --- | --- | --- |\n| [documentation-standardization-plan.md](../../../architect/host-invocation-routing/documentat",
    "identityFingerprint": "19a8d964cf47ded25d697628a3e12b970092bb6a235e5d3249effa3bdf3e51de",
    "ancestry": [
      "Host Invocation Source Preservation Audit",
      "2. Source Coverage Matrix"
    ],
    "text": "| Legacy source | Source content audited | Preservation target |\n| --- | --- | --- |\n| [documentation-standardization-plan.md](../../../architect/host-invocation-routing/documentation-standardization-plan.md) | Goal, non-goals, hard rules, source inventory requirement, target tree, status vocabulary, phase order, ledger requirement, old-doc redirect requirement, component-boundary check, validation requirement. | [../README.md](../README.md), [../intent-preservation-ledger.md](../intent-preservation-ledger.md), [../history/source-inventory.md](../history/source-inventory.md), this audit. |\n| [host-invocation-provider-routing.md](../../../architect/host-invocation-routing/host-invocation-provider-routing.md) | Architecture name, problem statement, canonical names, peer host use cases, core contracts, pure Router, `InvocationService`, two-stage authority, failure families, lifecycle record, human-input parking, physical placement, release boundaries, open questions. | [../vision.md](../vision.md), [../architecture/invocation-kernel.md](../architecture/invocation-kernel.md), [../architecture/host-use-cases.md](../architecture/host-use-cases.md), [../architecture/provider-routing.md](../architecture/provider-routing.md), [../contracts/operation-catalog.md](../contracts/operation-catalog.md), [../contracts/operation-provider.md](../contracts/operation-provider.md), [../contracts/operation-request-outcome.md](../contracts/operation-request-outcome.md), [implementation-alignment.md](implementation-alignment.md), ledger rows HI-I001 through HI-I019. |\n| [external-provider-protocol.md](../../../architect/host-invocation-routing/external-provider-protocol.md) | Component class versus invocation mechanism, built-in/process/WASM protocol placement, JSON-RPC 2.0 semantics over length-prefixed stdio frames, static manifest discovery, registry/linker meaning, namespace and replacement rules. | [../architecture/external-provider-protocol.md](../architecture/external-provider-protocol.md), [../contracts/component-protocol.md](../contracts/component-protocol.md), [../contracts/external-provider-manifest.md](../contracts/external-provider-manifest.md), [../architecture/provider-routing.md](../architecture/provider-routing.md), [r2-external-process-proof.md](r2-external-process-proof.md), ledger rows HI-I020 through HI-I024. |\n| [legacy-cli-transition.md](../../../architect/host-invocation-routing/legacy-cli-transition.md) | Separate `LegacyCliPassthroughProvider` and `LegacySemanticProvider`, `legacy-node` identity, `bin/fgos.mjs` immovability, activation-manifest resolution, caller inventory, `CommandRouteDescriptor`, Rust parser ownership, `fgos.v1` presentation boundary, Rust host benefit/cost. | [../architecture/legacy-cli-transition.md](../architecture/legacy-cli-transition.md), [../contracts/legacy-payload.md](../contracts/legacy-payload.md), [../contracts/command-route-descriptor.md](../contracts/command-route-descriptor.md), [compatibility-harness.md](compatibility-harness.md), [../history/host-invocation-baseline.md](../history/host-invocation-baseline.md), ledger rows HI-I025 through HI-I033. |\n| [node-to-rust-component-migration.md](../../../architect/host-invocation-routing/node-to-rust-component-migration.md) | Chosen migration strategy, rejected migration options, R1/R2/R3 sequence, release readiness categories, component-boundary repetition rule, read-model-before-writer rule, writer migration constraints, Node removal gate, rollback rules, verification gate, remaining decisions. | [../architecture/node-to-rust-migration.md](../architecture/node-to-rust-migration.md), [../architecture/release-boundaries.md](../architecture/release-boundaries.md), [r1-rust-host-proof.md](r1-rust-host-proof.md), [r2-external-process-proof.md](r2-external-process-proof.md), [r3-remote-peer-proof.md](r3-remote-peer-proof.md), [../history/host-invocation-baseline.md](../history/host-invocation-baseline.md), ledger rows HI-I034 through HI-I038. |\n| [rust-cli-and-proof-components-plan.md](../../../architect/host-invocation-routing/rust-cli-and-proof-components-plan.md) | Outcome, non-goals, settled choices, P0-P9 proof graph, test gates, rollback gates, risk controls, done criteria, remaining choices for target matrix, compatibility window, and preview versus stable. | [../architecture/release-boundaries.md](../architecture/release-boundaries.md), [compatibility-harness.md](compatibility-harness.md), [r1-rust-host-proof.md](r1-rust-host-proof.md), [r2-external-process-proof.md](r2-external-process-proof.md), [r3-remote-peer-proof.md](r3-remote-peer-proof.md), [implementation-alignment.md](implementation-alignment.md), ledger rows HI-I016 through HI-I019 and HI-I034 through HI-I038. |"
  },
  "classObservation": {
    "class": "Judgment",
    "reason": "no target digest match",
    "targetUnit": null
  },
  "sourceTargetDigestsUnequal": true,
  "mechanicalRequired": true,
  "deepRequired": true,
  "reviewScope": "Review current pending binding and rationale; no inherited approval.",
  "currentContentCommit": "345f15d95663260976200be66d1b9a6c648bcd6d",
  "entryId": "claim_a93bd8da295ccacefb41a101085b898e"
}
```

## Entry claim_12b5a84382034e873673bfc9cb09734c

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s10-systemic-native-predecessors.json",
  "collection": "registryGaps",
  "claimId": "claim_12b5a84382034e873673bfc9cb09734c",
  "authorSession": "codex-session:unit-run-1792094246578-b2fbe39b@2026-10-16",
  "before": null,
  "currentDecision": {
    "claimId": "claim_12b5a84382034e873673bfc9cb09734c",
    "sourcePath": "docs/platform/runner/operations/h-51f5cd7279fd.md",
    "sourceUnitDigest": "25e5d283f7df610fc091c31b8ef48b747a8f5fa54530ff8b1b84a92da3887d09",
    "claimKind": "specification",
    "disposition": "supersede",
    "targetOwner": "docs/platform/runner/operations/h-51f5cd7279fd.md",
    "targetAnchor": "unheaded-block-2",
    "targetUnitDigest": "3fab723eb054be1c1007c12f347887b98f4d864a5ae24d84527fa3eca45e3446",
    "targetAncestry": [
      "Added in candidate: Runner Behaviors & Operations"
    ],
    "rationale": "A22/A31/L10-18b/L10-20: native predecessor from 19ca8de23 is superseded by the current same-section unit after authorized source/target link-cell restoration, sentence-order restoration or evolve code-line citation correction. Complete immutable before/after unit text and native successor identity are recorded in step10-sync345-predecessor-reconciliation.json; review the actual delta, not ordinal-anchor equality. Current successor remains candidate, no truth or cutover approval.",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792094246578-b2fbe39b@2026-10-16",
    "reviewNote": "Independent review pending at 345f15d95; no approval carried."
  },
  "native": {
    "kind": "identityGaps",
    "sourcePath": "docs/platform/runner/operations/h-51f5cd7279fd.md",
    "unitDigest": "bb571bdc5b2a0787d758c81f5782fa0bba43083bd0b064b5e9bf7674462ed15d",
    "identityFingerprint": "bb571bdc5b2a0787d758c81f5782fa0bba43083bd0b064b5e9bf7674462ed15d",
    "claimId": "claim_12b5a84382034e873673bfc9cb09734c",
    "sourceAnchor": "unheaded-block-2",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "25e5d283f7df610fc091c31b8ef48b747a8f5fa54530ff8b1b84a92da3887d09",
    "claimKind": "procedure",
    "status": "future",
    "identityStatus": "identity-gap",
    "gapReason": "edited unit whose anchor unheaded-block-2 is not a stable heading anchor"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-2",
      "githubAnchor": "unheaded-block-2",
      "stableAnchor": "unheaded-block-2",
      "title": "Unheaded block 2",
      "startLine": 23,
      "endLine": 23,
      "textDigest": "25e5d283f7df610fc091c31b8ef48b747a8f5fa54530ff8b1b84a92da3887d09",
      "sample": "> Added in candidate: Metadata and map-based placement scaffolding. Original source heading levels, ids and direct sections are retained. Known stale carried sentences; full truth ",
      "identityFingerprint": "bb571bdc5b2a0787d758c81f5782fa0bba43083bd0b064b5e9bf7674462ed15d",
      "ancestry": [
        "Added in candidate: Runner Behaviors & Operations"
      ],
      "text": "> Added in candidate: Metadata and map-based placement scaffolding. Original source heading levels, ids and direct sections are retained. Known stale carried sentences; full truth check owed at promotion. A19 carriage and explicit Lead A35 note preserve deleted-module, retired-corpus, moved-plan and runner.md:<line> text verbatim. Corrections in this candidate: A41 F-B: remove model-call denial (src/runner/loop.mjs:1641-1655); A41 F-B continuation: validation precedes plan resolution (src/runner/loop.mjs:1641-1678); A41 F-E: replace removed live tee with run capture (src/runner/loop.mjs:349-351; src/runner/loop.mjs:1110-1112; src/runner/loop.mjs:1150-1163); A41 F-E: item-log tail does not stream worker chunks (src/runner/loop.mjs:349-351; src/runner/loop.mjs:1150-1163); A41 F-G: Iron Law has no entropy-module rule (src/evolve/iron-law.mjs:20-45); A41 F-C: evolve/ranking is absent; remaining Gate A contract explicitly scoped to legacy (bin/fgos.mjs:4373-4380; bin/fgos.mjs:4640-4643); R9-5: remove decisions-placement boilerplate from non-decision carrier. The remaining Gate A evolve bullets describe the legacy contract, not a current shipped verb; full truth check owed at promotion."
    }
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-2",
    "githubAnchor": "unheaded-block-2",
    "stableAnchor": "unheaded-block-2",
    "title": "Unheaded block 2",
    "startLine": 23,
    "endLine": 23,
    "textDigest": "3fab723eb054be1c1007c12f347887b98f4d864a5ae24d84527fa3eca45e3446",
    "sample": "> Added in candidate: Metadata and map-based placement scaffolding. Original source heading levels, ids and direct sections are retained. Known stale carried sentences; full truth ",
    "identityFingerprint": "473a742d0cac3cdb2fb913303cbf13ab6fe2a0f8fcc70cb2ce8edbb13299f507",
    "ancestry": [
      "Added in candidate: Runner Behaviors & Operations"
    ],
    "text": "> Added in candidate: Metadata and map-based placement scaffolding. Original source heading levels, ids and direct sections are retained. Known stale carried sentences; full truth check owed at promotion. A19 carriage and explicit Lead A35 note preserve deleted-module, retired-corpus, moved-plan and runner.md:<line> text verbatim. Corrections in this candidate: A41 F-B: remove model-call denial (src/runner/loop.mjs:1641-1655); A41 F-B continuation: validation precedes plan resolution (src/runner/loop.mjs:1641-1678); A41 F-E: replace removed live tee with run capture (src/runner/loop.mjs:349-351; src/runner/loop.mjs:1110-1112; src/runner/loop.mjs:1150-1163); A41 F-E: item-log tail does not stream worker chunks (src/runner/loop.mjs:349-351; src/runner/loop.mjs:1150-1163); A41 F-G: Iron Law has no entropy-module rule (src/evolve/iron-law.mjs:20-45); A41 F-C: evolve/ranking is absent; remaining Gate A contract explicitly scoped to legacy (bin/fgos.mjs:4414-4417); R9-5: remove decisions-placement boilerplate from non-decision carrier. The remaining Gate A evolve bullets describe the legacy contract, not a current shipped verb; full truth check owed at promotion."
  },
  "classObservation": {
    "class": "Judgment",
    "reason": "no target digest match",
    "targetUnit": null
  },
  "sourceTargetDigestsUnequal": true,
  "mechanicalRequired": true,
  "deepRequired": true,
  "reviewScope": "Review current pending binding and rationale; no inherited approval.",
  "currentContentCommit": "345f15d95663260976200be66d1b9a6c648bcd6d",
  "entryId": "claim_12b5a84382034e873673bfc9cb09734c"
}
```

## Entry claim_08f9b4c140ce931a064c131c2bd4e014

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s10-systemic-native-predecessors.json",
  "collection": "registryGaps",
  "claimId": "claim_08f9b4c140ce931a064c131c2bd4e014",
  "authorSession": "codex-session:unit-run-1792094246578-b2fbe39b@2026-10-16",
  "before": null,
  "currentDecision": {
    "claimId": "claim_08f9b4c140ce931a064c131c2bd4e014",
    "sourcePath": "docs/platform/runner/operations/h-51f5cd7279fd.md",
    "sourceUnitDigest": "30bbabf9219560dd2744a98e42e43b53e9fbaf15c4282e68860a8682f2b63059",
    "claimKind": "specification",
    "disposition": "supersede",
    "targetOwner": "docs/platform/runner/operations/h-51f5cd7279fd.md",
    "targetAnchor": "unheaded-block-26",
    "targetUnitDigest": "0dce2b78b5d497ab9dbe1b9cc6d0d8a00ad2ff468b97fe5964c8e86464b0a3b2",
    "targetAncestry": [
      "Added in candidate: Runner Behaviors & Operations",
      "Behaviors & Operations",
      "Gate A — xếp hạng candidate, bắc cầu sang việc thật (evolve)"
    ],
    "rationale": "A22/A31/L10-18b/L10-20: native predecessor from 19ca8de23 is superseded by the current same-section unit after authorized source/target link-cell restoration, sentence-order restoration or evolve code-line citation correction. Complete immutable before/after unit text and native successor identity are recorded in step10-sync345-predecessor-reconciliation.json; review the actual delta, not ordinal-anchor equality. Current successor remains candidate, no truth or cutover approval.",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792094246578-b2fbe39b@2026-10-16",
    "reviewNote": "Independent review pending at 345f15d95; no approval carried."
  },
  "native": {
    "kind": "identityGaps",
    "sourcePath": "docs/platform/runner/operations/h-51f5cd7279fd.md",
    "unitDigest": "92766f188ccb99457e7d20d05483082de50a478b057e56d43490c8b5ad918147",
    "identityFingerprint": "92766f188ccb99457e7d20d05483082de50a478b057e56d43490c8b5ad918147",
    "claimId": "claim_08f9b4c140ce931a064c131c2bd4e014",
    "sourceAnchor": "unheaded-block-26",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "30bbabf9219560dd2744a98e42e43b53e9fbaf15c4282e68860a8682f2b63059",
    "claimKind": "procedure",
    "status": "future",
    "identityStatus": "identity-gap",
    "gapReason": "edited unit whose anchor unheaded-block-26 is not a stable heading anchor"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-26",
      "githubAnchor": "unheaded-block-26",
      "stableAnchor": "unheaded-block-26",
      "title": "Unheaded block 26",
      "startLine": 456,
      "endLine": 467,
      "textDigest": "30bbabf9219560dd2744a98e42e43b53e9fbaf15c4282e68860a8682f2b63059",
      "sample": "Added in candidate — A41/A42 correction: CLI hiện hành không có verb `evolve` (`bin/fgos.mjs:4373,4461`; `evolve --help` trả \"unknown verb\"). Module ranking đã bị xoá ở commit `120",
      "identityFingerprint": "92766f188ccb99457e7d20d05483082de50a478b057e56d43490c8b5ad918147",
      "ancestry": [
        "Added in candidate: Runner Behaviors & Operations",
        "Behaviors & Operations",
        "Gate A — xếp hạng candidate, bắc cầu sang việc thật (evolve)"
      ],
      "text": "Added in candidate — A41/A42 correction: CLI hiện hành không có verb `evolve` (`bin/fgos.mjs:4373,4461`; `evolve --help` trả \"unknown verb\"). Module ranking đã bị xoá ở commit `120af6b3d`. Đoạn dưới ghi lại hợp đồng Gate A trước khi bị gỡ, không xác nhận triển khai hiện hành; full truth check owed at promotion.\nBước vào trước đây của vòng tự cải thiện (self-improve loop, STR13 — CONTEXT.md):\nTheo hợp đồng cũ, fgOS xếp hạng chính friction chưa ngã-ngũ của nó thành\nmột danh sách candidate, người chọn đúng một hoặc dừng (Slice 1), rồi có thể\nbắc cầu candidate đã chọn sang một việc thật để runner thi công (Slice 3,\n`--submit`). Loop này chỉ nhắm vào chính `repo/src` của fgOS — không\nphải một tính năng mở cho host project ngoài — và chạy khi người gọi tay,\nkhông bao giờ là một nhánh tự động của vòng dispatch thường. Vòng khép\nkín đầy đủ: `evolve` (liệt kê) → `evolve --pick` (xem một candidate, đọc-thuần)\n→ `evolve --submit` (bắc cầu, HÀNH ĐỘNG GHI duy nhất của cả bề mặt evolve) →\nrunner dispatch việc mới như mọi việc khác → `review`/`approve` qua cổng duyệt\nPR nội bộ, với `approve` chạy thêm phán Iron Law (xem dưới) trước khi merge."
    }
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-26",
    "githubAnchor": "unheaded-block-26",
    "stableAnchor": "unheaded-block-26",
    "title": "Unheaded block 26",
    "startLine": 456,
    "endLine": 467,
    "textDigest": "0dce2b78b5d497ab9dbe1b9cc6d0d8a00ad2ff468b97fe5964c8e86464b0a3b2",
    "sample": "Added in candidate — A41/A42 correction: CLI hiện hành không có verb `evolve` (`bin/fgos.mjs:4415,4461`; `evolve --help` trả \"unknown verb\"). Module ranking đã bị xoá ở commit `120",
    "identityFingerprint": "7048efa94641c54ae38bef92f2da26de9fb17daf145246156e881bad9842679a",
    "ancestry": [
      "Added in candidate: Runner Behaviors & Operations",
      "Behaviors & Operations",
      "Gate A — xếp hạng candidate, bắc cầu sang việc thật (evolve)"
    ],
    "text": "Added in candidate — A41/A42 correction: CLI hiện hành không có verb `evolve` (`bin/fgos.mjs:4415,4461`; `evolve --help` trả \"unknown verb\"). Module ranking đã bị xoá ở commit `120af6b3d`. Đoạn dưới ghi lại hợp đồng Gate A trước khi bị gỡ, không xác nhận triển khai hiện hành; full truth check owed at promotion.\nBước vào trước đây của vòng tự cải thiện (self-improve loop, STR13 — CONTEXT.md):\nTheo hợp đồng cũ, fgOS xếp hạng chính friction chưa ngã-ngũ của nó thành\nmột danh sách candidate, người chọn đúng một hoặc dừng (Slice 1), rồi có thể\nbắc cầu candidate đã chọn sang một việc thật để runner thi công (Slice 3,\n`--submit`). Loop này chỉ nhắm vào chính `repo/src` của fgOS — không\nphải một tính năng mở cho host project ngoài — và chạy khi người gọi tay,\nkhông bao giờ là một nhánh tự động của vòng dispatch thường. Vòng khép\nkín đầy đủ: `evolve` (liệt kê) → `evolve --pick` (xem một candidate, đọc-thuần)\n→ `evolve --submit` (bắc cầu, HÀNH ĐỘNG GHI duy nhất của cả bề mặt evolve) →\nrunner dispatch việc mới như mọi việc khác → `review`/`approve` qua cổng duyệt\nPR nội bộ, với `approve` chạy thêm phán Iron Law (xem dưới) trước khi merge."
  },
  "classObservation": {
    "class": "Judgment",
    "reason": "no target digest match",
    "targetUnit": null
  },
  "sourceTargetDigestsUnequal": true,
  "mechanicalRequired": true,
  "deepRequired": true,
  "reviewScope": "Review current pending binding and rationale; no inherited approval.",
  "currentContentCommit": "345f15d95663260976200be66d1b9a6c648bcd6d",
  "entryId": "claim_08f9b4c140ce931a064c131c2bd4e014"
}
```

## Entry claim_e0fc704182450d959f8452cc09da5f20

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s10-systemic-native-predecessors.json",
  "collection": "registryGaps",
  "claimId": "claim_e0fc704182450d959f8452cc09da5f20",
  "authorSession": "codex-session:unit-run-1792094246578-b2fbe39b@2026-10-16",
  "before": null,
  "currentDecision": {
    "claimId": "claim_e0fc704182450d959f8452cc09da5f20",
    "sourcePath": "docs/platform/runner/subcomponents/h-02842f76ffd2/spec.md",
    "sourceUnitDigest": "fb31e222bd67854fd1f83cc81922b2000b03d972159a7c2b390a993e38177894",
    "claimKind": "specification",
    "disposition": "supersede",
    "targetOwner": "docs/platform/runner/subcomponents/h-02842f76ffd2/spec.md",
    "targetAnchor": "unheaded-block-3",
    "targetUnitDigest": "417a56fd2a82950722e3a35187fe79050d444a85b8b55a4106d3e45059fa1b39",
    "targetAncestry": [
      "Added in candidate: Runner Data Dictionary",
      "Data Dictionary"
    ],
    "rationale": "A22/A31/L10-18b/L10-20: native predecessor from 19ca8de23 is superseded by the current same-section unit after authorized source/target link-cell restoration, sentence-order restoration or evolve code-line citation correction. Complete immutable before/after unit text and native successor identity are recorded in step10-sync345-predecessor-reconciliation.json; review the actual delta, not ordinal-anchor equality. Current successor remains candidate, no truth or cutover approval.",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792094246578-b2fbe39b@2026-10-16",
    "reviewNote": "Independent review pending at 345f15d95; no approval carried."
  },
  "native": {
    "kind": "identityGaps",
    "sourcePath": "docs/platform/runner/subcomponents/h-02842f76ffd2/spec.md",
    "unitDigest": "1ca7543acf072f31c19fca298603e9aeddadef1e14335d8744fad52589b50a53",
    "identityFingerprint": "1ca7543acf072f31c19fca298603e9aeddadef1e14335d8744fad52589b50a53",
    "claimId": "claim_e0fc704182450d959f8452cc09da5f20",
    "sourceAnchor": "unheaded-block-3",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "fb31e222bd67854fd1f83cc81922b2000b03d972159a7c2b390a993e38177894",
    "claimKind": "specification",
    "status": "future",
    "identityStatus": "identity-gap",
    "gapReason": "edited unit whose anchor unheaded-block-3 is not a stable heading anchor"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-3",
      "githubAnchor": "unheaded-block-3",
      "stableAnchor": "unheaded-block-3",
      "title": "Unheaded block 3",
      "startLine": 27,
      "endLine": 41,
      "textDigest": "fb31e222bd67854fd1f83cc81922b2000b03d972159a7c2b390a993e38177894",
      "sample": "| # | Element | Meaning | Values | Required | Default |\n|---|-------|---------|--------|----------|---------|\n| 1 | Cấu hình runner (file committed ở gốc repo) | Chính sách thực th",
      "identityFingerprint": "1ca7543acf072f31c19fca298603e9aeddadef1e14335d8744fad52589b50a53",
      "ancestry": [
        "Added in candidate: Runner Data Dictionary",
        "Data Dictionary"
      ],
      "text": "| # | Element | Meaning | Values | Required | Default |\n|---|-------|---------|--------|----------|---------|\n| 1 | Cấu hình runner (file committed ở gốc repo) | Chính sách thực thi — LÀ CONFIG THỰC THI ĐƯỢC: ai sửa nó điều khiển tiến trình được spawn (đầu vào tin cậy) | `executor` — mẫu lệnh gọi trợ lý (thay thế `{prompt}`/`{model}` theo từng phần tử, không bao giờ qua shell), tùy chọn `adapter` (mặc định `cli-spawn`) · `executors` — catalog executor theo danh tính provider/cách gọi, không mang khẩu vị chất lượng · `modelPolicies` — bảng bắt buộc provider→tier→model với tier cung `nano|mini|standard|advanced|flagship|frontier` · `rigorToTier` — bảng bắt buộc ánh xạ đủ bốn mức cầu `low|standard|high|critical` sang tier cung · `capabilities.<name>.rigor` — sàn cầu tùy chọn, chỉ nâng; khối `capabilities.<name>.overrides` bị từ chối · `timeoutMs` — trần thời gian mặc định của một worker, tối đa 4h; một lượt chạy có thể xin thời gian riêng (RUL96 (one run may take its own timeout)) · `confinement`/`confinementPolicies` — chính sách giam giữ · `capabilities` — catalog lời hứa hành vi và binding executor/invocation | yes | tự sinh khi vắng mặt tại đường dẫn mặc định (không kèm `--config`); `fgos setup` điền `rigorToTier`, `fgos doctor` kiểm bảng này và các khoá placement đã retired; một `--config <path>` tường minh trỏ vào đường vắng mặt vẫn báo lỗi ngay (`fgos discover`/`plan`; `fgos-runner` không còn `--config`, RUL93 (the runner loop's worker and the fan-out batch run as one Unit run each)) |\n| 1b | Provider-capacity inventory/state (slice 1) | Pool account cho một provider agent CLI khi provider đó có quota/capacity theo account. Inventory là machine-local secret-bearing config, không phải project policy; state/lease/quarantine là runtime-local evidence. | Inventory chỉ đọc từ `~/.fgos/config.json` tại `runner.providers.<provider>.accounts.<accountId>`; account là keyed object, không phải array. Slice 1 hỗ trợ `openai-codex` account với `label?` và `credentialSource: { kind: \"codex-home\", home }`; nay mỗi account khai đúng một trong `credentialSource` (một store cho mọi CLI, kind `codex-home` hoặc `home-files`) hoặc `credentialSources` (một store cho mỗi CLI, key là tên lệnh `codex`/`pi`/`omp`/`agy`; RUL80 (account trước, CLI sau: một login store cho mỗi CLI)). Account entry bị từ chối nếu khai placement/runtime policy (`executor`, `capability`, `model`, `modelTier`, `mutation`, `confinement`, `tool`, `fallback`, `runtimeClass`, `providerRuntimes`, ...). Project-local `.fgos/config.json` bị từ chối nếu chứa `runner.providers.*.accounts`. State ở `~/.fgos/runtime/provider-capacity/state.json`, lock là thư mục `~/.fgos/runtime/provider-capacity/state-lock`. | no | vắng inventory nghĩa là mọi dispatch giữ hành vi cũ, không selection/lease |\n| 2 | Nhánh đề xuất | Không gian kết quả của một worker, tên mang tiền tố nhận diện `fgw/<id>` | — | — | — |\n| 3 | Bảng phục hồi | Lớp-lỗi → hành-động, máy đọc được | 14 lớp: `worker-spawn-fail`, `worker-timeout`, `verify-miss`, `verify-timeout`, `worktree-fail`, `corrupt-log`, `reject-returned`, `stale-doing`, `state-conflict`, `dispatch-in-flight`, `dispatch-depth-exceeded`, `provider-limit`, `worker-failed`, `no-executor` → hành động ∈ thử-lại (có trần) / đỗ-lại / dừng; lớp LẠ → dừng (an toàn trước) | — | — |\n| 4 | Bộ đếm chống-lặp (lifetime) | visitCount: số lần một việc vào `doing` TÍNH TỪ ĐẦU đời việc — dẫn xuất từ nhật ký sự kiện, không trường mới; dùng cho các bản ghi outcome/metric đã ship (KHÔNG dùng để chặn dispatch nữa — xem #4b) | — | — | — |\n| 4b | Ngân sách cổng chống-lặp (kể từ can thiệp người) | visitsSinceLastHumanEvent: số lần việc vào `doing` **ở stage executing** TÍNH TỪ sự kiện người CUỐI CÙNG của chính việc đó — đây là con số CỔNG dùng để chặn/park dispatch (thay `visitCount` ở vai trò này); một can thiệp người (xem trigger-set) đưa ngân sách về lại đủ 3 cho vòng kế tiếp. Executing-phase-only scoping (claim-lock): trước đây, pick/take chỉ mở frontier (executing-phase), nên counting mọi `todo→doing` move tương đương dispatch attempts. Claim-lock cho phép `pick` cầm stage khác — claim-release cycle ở các stage đầu vòng (`discovery`/`exploring`/`planning`, cộng tên di sản `decompose`) không được tính vào ngân sách executing-phase (per claim-lock code-review finding) | — | — | trần mặc định 3, dùng chung `MAX_VISITS` |\n| 5 | Cầu dao (breaker) | Số lần chấm-trượt liên tiếp trong MỘT lần chạy (bộ nhớ trong phiên, không dẫn xuất từ nhật ký — chủ đích, vì nhật ký không phân biệt người/máy ghi); trần mặc định 3, đếm RIÊNG cho từng việc dưới dispatch song song (một việc chấm-trượt không kéo cầu dao của việc khác). **Trơ trong `--once`:** một việc đỗ lại (park) tối đa sau `maxRetries` (mặc định 2) lần thử trong CÙNG một lượt `--once`, nên không bao giờ chạm trần 3 của cầu dao trong một lượt đơn — cầu dao chỉ có thể kéo khi có một cơ chế chia-sẻ/nhiều-lượt tích luỹ miss xuyên lượt (chưa xây, xem Open Gaps) | — | — | — |\n| 6 | Trần song song hai tầng | Giới hạn số việc chạy đồng thời trong một mẻ, đọc từ cấu hình committed | tầng 1 — số việc GỐC đồng thời; tầng 2 — số việc CON đồng thời trong MỖI gốc; mỗi lần nạp mẻ lấy `min(trần, số việc sẵn-sàng sau lọc quyền-sở-hữu-gốc)` | no (có mặc định) | 4 gốc × 4 con mỗi gốc |\n| 7 | Quyền sở-hữu gốc | Ai đang cầm mọi việc CON của một gốc trong MỘT lượt chạy — gắn lúc con đầu tiên của gốc được nhận, xả khi gốc xong; sống trong bộ nhớ của lượt chạy, KHÔNG bền qua lượt chạy khác/tiến trình khác | một định danh (per lượt chạy) | — | chưa-chủ |\n| 8 | Bản ghi output cục bộ (một file mỗi việc) | Lưu lại output của trợ lý cho MỌI lượt dispatch của một việc — đọc được sau khi console đã cuộn qua; không bao giờ vào cây committed. Trong lúc worker chạy, file nhận con trỏ tới capture của Unit run; khối output được nối sau khi run kết thúc | mỗi khối kết-cục: dấu thời gian, số lần thử, loại kết cục (đề xuất/quá-giờ/hỏng-spawn/…), output (khi trợ lý kịp sinh ra); con trỏ Unit run được ghi khi run được tạo | no (chỉ tồn tại sau lượt dispatch đầu tiên của việc) | — |\n| 9 | Candidate (former Gate A; Added in candidate: `evolve` removed in `120af6b3d`, `bin/fgos.mjs:4373`) | Một việc mang ít nhất một bản ghi friction chưa ngã-ngũ, xếp hạng làm ứng viên tự cải thiện — dẫn xuất TỪ friction đã ghi, không phải một bản ghi độc lập, không bền qua lần `evolve` khác | id, disposition, errorClass, layer, detail, attempts (tất cả lấy từ bản ghi friction MỚI NHẤT theo dấu thời gian của id đó khi id có nhiều bản ghi chưa ngã-ngũ), score (cộng dồn TOÀN BỘ bản ghi chưa ngã-ngũ của id đó, không chỉ bản mới nhất) | — | former derivation on `evolve`; no current CLI entry |\n| 10 | Phán quyết Iron Law (self-improve loop STR13 Slice 2/3) | Kết quả của phép tính hai-cửa (module + từ khóa) trên MỘT candidate fix — dẫn xuất thuần từ đầu vào truyền vào, không bền. Gọi từ bên trong `approve` nguồn `runner` (Cổng duyệt PR nội bộ), ngay trước bước kiểm cây sạch, cho MỌI đề xuất nguồn runner đang land LÊN TRUNK (thu hẹp về ranh giới trunk per `0032`) — xem \"Cổng duyệt PR nội bộ\" và \"Iron Law\" dưới, Business Rules RUL36 (former `evolve --submit` contract; Added in candidate: door removed in `120af6b3d`, `bin/fgos.mjs:4373`)/RUL37 (Iron Law hỏi ở đúng một ranh giới — trunk — cho mọi đề xuất nguồn runner tới đó)/RUL64 (`ironLaw.level` — key config riêng của cổng Iron Law, fail-closed về `ask`) | required (có/không cần chứng minh test-đỏ-trước), matchedFlags (danh sách từ khóa rủi ro nặng khớp trong mô tả fix), matchedModules (danh sách file khớp danh sách module minh họa) | — | required mặc định `false` khi cả hai phép thử đều không khớp |\n| 11 | Prompt template worker (STR49, `src/runner/prompt-templates/`) | Nội dung chữ nghĩa của `buildPrompt`, tách khỏi code sang file committed — sửa prompt là sửa MỘT file, không đụng code | `selectTemplate({kind, tier, domain})` — bảng luật cơ học, wildcard cuối luôn khớp (từ STR91: luật `domain: 'coding'` khớp TRƯỚC wildcard — domain vắng mặt hay không nhận diện được đều fold về `coding` giống mọi nơi khác trong hệ, không phải một fallback riêng — trỏ `worker-prompt-skill-pointer.txt`; mọi domain đã đăng ký khác `coding` (vd `synthetic`) vẫn rơi về wildcard, trỏ `worker-prompt-default.txt` như trước STR91) · `renderTemplate` — substitution `{placeholder}` string-replace thuần, không engine · `hashTemplate` — sha256 nội dung raw file, ghi kèm dispatch log (xem RUL44 (đã xây — STR49, `src/runner/prompt-templates.mjs`)) · template `worker-prompt-skill-pointer.txt` giữ đủ 6 mục cố định sẵn có, CHỈ thêm đúng một mục `# Agent skill` trỏ `SKILL.md` của domain đó — đường dẫn luôn resolve qua sổ đăng ký domain→skill (`skillForStage`, spec Work-State \"Mô hình domain\"), không bao giờ hardcode (xem RUL52 (luật template theo domain `coding` khớp trước wildcard; domain lạ/vắng mặt fold về `coding`)) | yes (một template mặc định luôn có) | `worker-prompt-default.txt`, `worker-prompt-skill-pointer.txt` |"
    }
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-3",
    "githubAnchor": "unheaded-block-3",
    "stableAnchor": "unheaded-block-3",
    "title": "Unheaded block 3",
    "startLine": 27,
    "endLine": 41,
    "textDigest": "417a56fd2a82950722e3a35187fe79050d444a85b8b55a4106d3e45059fa1b39",
    "sample": "| # | Element | Meaning | Values | Required | Default |\n|---|-------|---------|--------|----------|---------|\n| 1 | Cấu hình runner (file committed ở gốc repo) | Chính sách thực th",
    "identityFingerprint": "0914c63c64d8dc0b88c6efe72bb3ea06d590244d92fcdf2b30b79a6948b7177f",
    "ancestry": [
      "Added in candidate: Runner Data Dictionary",
      "Data Dictionary"
    ],
    "text": "| # | Element | Meaning | Values | Required | Default |\n|---|-------|---------|--------|----------|---------|\n| 1 | Cấu hình runner (file committed ở gốc repo) | Chính sách thực thi — LÀ CONFIG THỰC THI ĐƯỢC: ai sửa nó điều khiển tiến trình được spawn (đầu vào tin cậy) | `executor` — mẫu lệnh gọi trợ lý (thay thế `{prompt}`/`{model}` theo từng phần tử, không bao giờ qua shell), tùy chọn `adapter` (mặc định `cli-spawn`) · `executors` — catalog executor theo danh tính provider/cách gọi, không mang khẩu vị chất lượng · `modelPolicies` — bảng bắt buộc provider→tier→model với tier cung `nano|mini|standard|advanced|flagship|frontier` · `rigorToTier` — bảng bắt buộc ánh xạ đủ bốn mức cầu `low|standard|high|critical` sang tier cung · `capabilities.<name>.rigor` — sàn cầu tùy chọn, chỉ nâng; khối `capabilities.<name>.overrides` bị từ chối · `timeoutMs` — trần thời gian mặc định của một worker, tối đa 4h; một lượt chạy có thể xin thời gian riêng (RUL96 (one run may take its own timeout)) · `confinement`/`confinementPolicies` — chính sách giam giữ · `capabilities` — catalog lời hứa hành vi và binding executor/invocation | yes | tự sinh khi vắng mặt tại đường dẫn mặc định (không kèm `--config`); `fgos setup` điền `rigorToTier`, `fgos doctor` kiểm bảng này và các khoá placement đã retired; một `--config <path>` tường minh trỏ vào đường vắng mặt vẫn báo lỗi ngay (`fgos discover`/`plan`; `fgos-runner` không còn `--config`, RUL93 (the runner loop's worker and the fan-out batch run as one Unit run each)) |\n| 1b | Provider-capacity inventory/state (slice 1) | Pool account cho một provider agent CLI khi provider đó có quota/capacity theo account. Inventory là machine-local secret-bearing config, không phải project policy; state/lease/quarantine là runtime-local evidence. | Inventory chỉ đọc từ `~/.fgos/config.json` tại `runner.providers.<provider>.accounts.<accountId>`; account là keyed object, không phải array. Slice 1 hỗ trợ `openai-codex` account với `label?` và `credentialSource: { kind: \"codex-home\", home }`; nay mỗi account khai đúng một trong `credentialSource` (một store cho mọi CLI, kind `codex-home` hoặc `home-files`) hoặc `credentialSources` (một store cho mỗi CLI, key là tên lệnh `codex`/`pi`/`omp`/`agy`; RUL80 (account trước, CLI sau: một login store cho mỗi CLI)). Account entry bị từ chối nếu khai placement/runtime policy (`executor`, `capability`, `model`, `modelTier`, `mutation`, `confinement`, `tool`, `fallback`, `runtimeClass`, `providerRuntimes`, ...). Project-local `.fgos/config.json` bị từ chối nếu chứa `runner.providers.*.accounts`. State ở `~/.fgos/runtime/provider-capacity/state.json`, lock là thư mục `~/.fgos/runtime/provider-capacity/state-lock`. | no | vắng inventory nghĩa là mọi dispatch giữ hành vi cũ, không selection/lease |\n| 2 | Nhánh đề xuất | Không gian kết quả của một worker, tên mang tiền tố nhận diện `fgw/<id>` | — | — | — |\n| 3 | Bảng phục hồi | Lớp-lỗi → hành-động, máy đọc được | 14 lớp: `worker-spawn-fail`, `worker-timeout`, `verify-miss`, `verify-timeout`, `worktree-fail`, `corrupt-log`, `reject-returned`, `stale-doing`, `state-conflict`, `dispatch-in-flight`, `dispatch-depth-exceeded`, `provider-limit`, `worker-failed`, `no-executor` → hành động ∈ thử-lại (có trần) / đỗ-lại / dừng; lớp LẠ → dừng (an toàn trước) | — | — |\n| 4 | Bộ đếm chống-lặp (lifetime) | visitCount: số lần một việc vào `doing` TÍNH TỪ ĐẦU đời việc — dẫn xuất từ nhật ký sự kiện, không trường mới; dùng cho các bản ghi outcome/metric đã ship (KHÔNG dùng để chặn dispatch nữa — xem #4b) | — | — | — |\n| 4b | Ngân sách cổng chống-lặp (kể từ can thiệp người) | visitsSinceLastHumanEvent: số lần việc vào `doing` **ở stage executing** TÍNH TỪ sự kiện người CUỐI CÙNG của chính việc đó — đây là con số CỔNG dùng để chặn/park dispatch (thay `visitCount` ở vai trò này); một can thiệp người (xem trigger-set) đưa ngân sách về lại đủ 3 cho vòng kế tiếp. Executing-phase-only scoping (claim-lock): trước đây, pick/take chỉ mở frontier (executing-phase), nên counting mọi `todo→doing` move tương đương dispatch attempts. Claim-lock cho phép `pick` cầm stage khác — claim-release cycle ở các stage đầu vòng (`discovery`/`exploring`/`planning`, cộng tên di sản `decompose`) không được tính vào ngân sách executing-phase (per claim-lock code-review finding) | — | — | trần mặc định 3, dùng chung `MAX_VISITS` |\n| 5 | Cầu dao (breaker) | Số lần chấm-trượt liên tiếp trong MỘT lần chạy (bộ nhớ trong phiên, không dẫn xuất từ nhật ký — chủ đích, vì nhật ký không phân biệt người/máy ghi); trần mặc định 3, đếm RIÊNG cho từng việc dưới dispatch song song (một việc chấm-trượt không kéo cầu dao của việc khác). **Trơ trong `--once`:** một việc đỗ lại (park) tối đa sau `maxRetries` (mặc định 2) lần thử trong CÙNG một lượt `--once`, nên không bao giờ chạm trần 3 của cầu dao trong một lượt đơn — cầu dao chỉ có thể kéo khi có một cơ chế chia-sẻ/nhiều-lượt tích luỹ miss xuyên lượt (chưa xây, xem Open Gaps) | — | — | — |\n| 6 | Trần song song hai tầng | Giới hạn số việc chạy đồng thời trong một mẻ, đọc từ cấu hình committed | tầng 1 — số việc GỐC đồng thời; tầng 2 — số việc CON đồng thời trong MỖI gốc; mỗi lần nạp mẻ lấy `min(trần, số việc sẵn-sàng sau lọc quyền-sở-hữu-gốc)` | no (có mặc định) | 4 gốc × 4 con mỗi gốc |\n| 7 | Quyền sở-hữu gốc | Ai đang cầm mọi việc CON của một gốc trong MỘT lượt chạy — gắn lúc con đầu tiên của gốc được nhận, xả khi gốc xong; sống trong bộ nhớ của lượt chạy, KHÔNG bền qua lượt chạy khác/tiến trình khác | một định danh (per lượt chạy) | — | chưa-chủ |\n| 8 | Bản ghi output cục bộ (một file mỗi việc) | Lưu lại output của trợ lý cho MỌI lượt dispatch của một việc — đọc được sau khi console đã cuộn qua; không bao giờ vào cây committed. Trong lúc worker chạy, file nhận con trỏ tới capture của Unit run; khối output được nối sau khi run kết thúc | mỗi khối kết-cục: dấu thời gian, số lần thử, loại kết cục (đề xuất/quá-giờ/hỏng-spawn/…), output (khi trợ lý kịp sinh ra); con trỏ Unit run được ghi khi run được tạo | no (chỉ tồn tại sau lượt dispatch đầu tiên của việc) | — |\n| 9 | Candidate (former Gate A; Added in candidate: `evolve` removed in `120af6b3d`, `bin/fgos.mjs:4415`) | Một việc mang ít nhất một bản ghi friction chưa ngã-ngũ, xếp hạng làm ứng viên tự cải thiện — dẫn xuất TỪ friction đã ghi, không phải một bản ghi độc lập, không bền qua lần `evolve` khác | id, disposition, errorClass, layer, detail, attempts (tất cả lấy từ bản ghi friction MỚI NHẤT theo dấu thời gian của id đó khi id có nhiều bản ghi chưa ngã-ngũ), score (cộng dồn TOÀN BỘ bản ghi chưa ngã-ngũ của id đó, không chỉ bản mới nhất) | — | former derivation on `evolve`; no current CLI entry |\n| 10 | Phán quyết Iron Law (self-improve loop STR13 Slice 2/3) | Kết quả của phép tính hai-cửa (module + từ khóa) trên MỘT candidate fix — dẫn xuất thuần từ đầu vào truyền vào, không bền. Gọi từ bên trong `approve` nguồn `runner` (Cổng duyệt PR nội bộ), ngay trước bước kiểm cây sạch, cho MỌI đề xuất nguồn runner đang land LÊN TRUNK (thu hẹp về ranh giới trunk per `0032`) — xem \"Cổng duyệt PR nội bộ\" và \"Iron Law\" dưới, Business Rules RUL36 (former `evolve --submit` contract; Added in candidate: door removed in `120af6b3d`, `bin/fgos.mjs:4415`)/RUL37 (Iron Law hỏi ở đúng một ranh giới — trunk — cho mọi đề xuất nguồn runner tới đó)/RUL64 (`ironLaw.level` — key config riêng của cổng Iron Law, fail-closed về `ask`) | required (có/không cần chứng minh test-đỏ-trước), matchedFlags (danh sách từ khóa rủi ro nặng khớp trong mô tả fix), matchedModules (danh sách file khớp danh sách module minh họa) | — | required mặc định `false` khi cả hai phép thử đều không khớp |\n| 11 | Prompt template worker (STR49, `src/runner/prompt-templates/`) | Nội dung chữ nghĩa của `buildPrompt`, tách khỏi code sang file committed — sửa prompt là sửa MỘT file, không đụng code | `selectTemplate({kind, tier, domain})` — bảng luật cơ học, wildcard cuối luôn khớp (từ STR91: luật `domain: 'coding'` khớp TRƯỚC wildcard — domain vắng mặt hay không nhận diện được đều fold về `coding` giống mọi nơi khác trong hệ, không phải một fallback riêng — trỏ `worker-prompt-skill-pointer.txt`; mọi domain đã đăng ký khác `coding` (vd `synthetic`) vẫn rơi về wildcard, trỏ `worker-prompt-default.txt` như trước STR91) · `renderTemplate` — substitution `{placeholder}` string-replace thuần, không engine · `hashTemplate` — sha256 nội dung raw file, ghi kèm dispatch log (xem RUL44 (đã xây — STR49, `src/runner/prompt-templates.mjs`)) · template `worker-prompt-skill-pointer.txt` giữ đủ 6 mục cố định sẵn có, CHỈ thêm đúng một mục `# Agent skill` trỏ `SKILL.md` của domain đó — đường dẫn luôn resolve qua sổ đăng ký domain→skill (`skillForStage`, spec Work-State \"Mô hình domain\"), không bao giờ hardcode (xem RUL52 (luật template theo domain `coding` khớp trước wildcard; domain lạ/vắng mặt fold về `coding`)) | yes (một template mặc định luôn có) | `worker-prompt-default.txt`, `worker-prompt-skill-pointer.txt` |"
  },
  "classObservation": {
    "class": "Judgment",
    "reason": "no target digest match",
    "targetUnit": null
  },
  "sourceTargetDigestsUnequal": true,
  "mechanicalRequired": true,
  "deepRequired": true,
  "reviewScope": "Review current pending binding and rationale; no inherited approval.",
  "currentContentCommit": "345f15d95663260976200be66d1b9a6c648bcd6d",
  "entryId": "claim_e0fc704182450d959f8452cc09da5f20"
}
```

## Entry claim_8e43ff23542c1a2386d7ce3d2bf5e30d

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s10-systemic-native-predecessors.json",
  "collection": "registryGaps",
  "claimId": "claim_8e43ff23542c1a2386d7ce3d2bf5e30d",
  "authorSession": "codex-session:unit-run-1792094246578-b2fbe39b@2026-10-16",
  "before": null,
  "currentDecision": {
    "claimId": "claim_8e43ff23542c1a2386d7ce3d2bf5e30d",
    "sourcePath": "docs/platform/runner/subcomponents/h-37aced3896a8/spec.md",
    "sourceUnitDigest": "2e0561425f15bad2d92bbd21e6b7f837523159beb3b8de7fe250e67cbed1a27c",
    "claimKind": "specification",
    "disposition": "supersede",
    "targetOwner": "docs/platform/runner/subcomponents/h-37aced3896a8/spec.md",
    "targetAnchor": "unheaded-block-5",
    "targetUnitDigest": "b4abd2b685fe57f6a2616db1b22d4ddc28196279ade0c0307087370b59671964",
    "targetAncestry": [
      "Added in candidate: Runner Edge Cases Settled",
      "Edge Cases Settled"
    ],
    "rationale": "A22/A31/L10-18b/L10-20: native predecessor from 19ca8de23 is superseded by the current same-section unit after authorized source/target link-cell restoration, sentence-order restoration or evolve code-line citation correction. Complete immutable before/after unit text and native successor identity are recorded in step10-sync345-predecessor-reconciliation.json; review the actual delta, not ordinal-anchor equality. Current successor remains candidate, no truth or cutover approval.",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792094246578-b2fbe39b@2026-10-16",
    "reviewNote": "Independent review pending at 345f15d95; no approval carried."
  },
  "native": {
    "kind": "identityGaps",
    "sourcePath": "docs/platform/runner/subcomponents/h-37aced3896a8/spec.md",
    "unitDigest": "c90b5f330d6dd254af65accfda05eb8fa2c3454d7951cd3e3819469389e1848a",
    "identityFingerprint": "c90b5f330d6dd254af65accfda05eb8fa2c3454d7951cd3e3819469389e1848a",
    "claimId": "claim_8e43ff23542c1a2386d7ce3d2bf5e30d",
    "sourceAnchor": "unheaded-block-5",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "2e0561425f15bad2d92bbd21e6b7f837523159beb3b8de7fe250e67cbed1a27c",
    "claimKind": "specification",
    "status": "future",
    "identityStatus": "identity-gap",
    "gapReason": "edited unit whose anchor unheaded-block-5 is not a stable heading anchor"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-5",
      "githubAnchor": "unheaded-block-5",
      "stableAnchor": "unheaded-block-5",
      "title": "Unheaded block 5",
      "startLine": 74,
      "endLine": 75,
      "textDigest": "2e0561425f15bad2d92bbd21e6b7f837523159beb3b8de7fe250e67cbed1a27c",
      "sample": "- Added in candidate: historical e2e scenario for the former `evolve` door, removed in `120af6b3d` (`bin/fgos.mjs:4373`); no current e2e coverage claim. Vòng đủ tự-cải-thiện (self-",
      "identityFingerprint": "c90b5f330d6dd254af65accfda05eb8fa2c3454d7951cd3e3819469389e1848a",
      "ancestry": [
        "Added in candidate: Runner Edge Cases Settled",
        "Edge Cases Settled"
      ],
      "text": "- Added in candidate: historical e2e scenario for the former `evolve` door, removed in `120af6b3d` (`bin/fgos.mjs:4373`); no current e2e coverage claim. Vòng đủ tự-cải-thiện (self-improve loop STR13): một bản ghi friction chưa ngã-ngũ mang từ khóa rủi ro nặng → `evolve` (liệt kê, candidate hiện đủ trường) → `evolve --pick` (đọc-thuần, byte-compare nhật ký trước/sau xác nhận không sự kiện nào bị thêm) → `evolve --submit` (đúng một việc mới, mô tả mang từ khóa) → runner dispatch việc mới đó tới `awaiting-approval` → `review` (source: runner) → `approve` KHÔNG `--acknowledge-iron-law` (item không cha nên target là trunk, và `ironLaw.level` mặc định `ask` — từ chối cứng, nêu tên từ khóa khớp, HEAD không đổi, nhánh còn sống) → `approve --acknowledge-iron-law` (merge, verify xanh, `awaiting-approval → done`, settlement role human, nhánh/worktree dọn sạch) — chứng minh bằng e2e qua binary + git thật, mọi bước tự chạy trong CÙNG file, không dựa vào tham chiếu chéo sang test của cell khác. Hai điều kiện trong ngoặc là điều `0032` làm thành tường minh: cùng diff ấy trên một leaf land vào `fgw/<root>`, hoặc ở `ironLaw.level = \"warn\"`, không dừng ở bước từ chối.\n- `fgos discover <id>` gọi trên một thư mục dự án MỚI, chưa từng có cấu hình runner: không còn chết vì không đọc được cấu hình — cấu hình mặc định được tự viết tại đường mặc định, item đi tiếp vào phán làm-rõ thật (đậu `awaiting-human` khi phán không chắc, đúng fail-safe hiện có, KHÔNG phải một kết quả \"thành công\" trần trụi) — chứng minh bằng test thật qua binary, PATH của tiến trình phán bị thu hẹp có chủ đích để không gọi trợ lý thật nào trong lúc test. Một `--config` tường minh trỏ đường vắng mặt vẫn báo lỗi ngay như trước, không bao giờ được tự sinh thay (RUL48 (cấu hình runner tự sinh tại đường mặc định khi vắng mặt — không bao giờ đòi người tạo tay trước))."
    }
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-5",
    "githubAnchor": "unheaded-block-5",
    "stableAnchor": "unheaded-block-5",
    "title": "Unheaded block 5",
    "startLine": 74,
    "endLine": 75,
    "textDigest": "b4abd2b685fe57f6a2616db1b22d4ddc28196279ade0c0307087370b59671964",
    "sample": "- Added in candidate: historical e2e scenario for the former `evolve` door, removed in `120af6b3d` (`bin/fgos.mjs:4415`); no current e2e coverage claim. Vòng đủ tự-cải-thiện (self-",
    "identityFingerprint": "3b279daae8ac3113507608082fe12924d67854ff32a17c789a7514a915c808d9",
    "ancestry": [
      "Added in candidate: Runner Edge Cases Settled",
      "Edge Cases Settled"
    ],
    "text": "- Added in candidate: historical e2e scenario for the former `evolve` door, removed in `120af6b3d` (`bin/fgos.mjs:4415`); no current e2e coverage claim. Vòng đủ tự-cải-thiện (self-improve loop STR13): một bản ghi friction chưa ngã-ngũ mang từ khóa rủi ro nặng → `evolve` (liệt kê, candidate hiện đủ trường) → `evolve --pick` (đọc-thuần, byte-compare nhật ký trước/sau xác nhận không sự kiện nào bị thêm) → `evolve --submit` (đúng một việc mới, mô tả mang từ khóa) → runner dispatch việc mới đó tới `awaiting-approval` → `review` (source: runner) → `approve` KHÔNG `--acknowledge-iron-law` (item không cha nên target là trunk, và `ironLaw.level` mặc định `ask` — từ chối cứng, nêu tên từ khóa khớp, HEAD không đổi, nhánh còn sống) → `approve --acknowledge-iron-law` (merge, verify xanh, `awaiting-approval → done`, settlement role human, nhánh/worktree dọn sạch) — chứng minh bằng e2e qua binary + git thật, mọi bước tự chạy trong CÙNG file, không dựa vào tham chiếu chéo sang test của cell khác. Hai điều kiện trong ngoặc là điều `0032` làm thành tường minh: cùng diff ấy trên một leaf land vào `fgw/<root>`, hoặc ở `ironLaw.level = \"warn\"`, không dừng ở bước từ chối.\n- `fgos discover <id>` gọi trên một thư mục dự án MỚI, chưa từng có cấu hình runner: không còn chết vì không đọc được cấu hình — cấu hình mặc định được tự viết tại đường mặc định, item đi tiếp vào phán làm-rõ thật (đậu `awaiting-human` khi phán không chắc, đúng fail-safe hiện có, KHÔNG phải một kết quả \"thành công\" trần trụi) — chứng minh bằng test thật qua binary, PATH của tiến trình phán bị thu hẹp có chủ đích để không gọi trợ lý thật nào trong lúc test. Một `--config` tường minh trỏ đường vắng mặt vẫn báo lỗi ngay như trước, không bao giờ được tự sinh thay (RUL48 (cấu hình runner tự sinh tại đường mặc định khi vắng mặt — không bao giờ đòi người tạo tay trước))."
  },
  "classObservation": {
    "class": "Judgment",
    "reason": "no target digest match",
    "targetUnit": null
  },
  "sourceTargetDigestsUnequal": true,
  "mechanicalRequired": true,
  "deepRequired": true,
  "reviewScope": "Review current pending binding and rationale; no inherited approval.",
  "currentContentCommit": "345f15d95663260976200be66d1b9a6c648bcd6d",
  "entryId": "claim_8e43ff23542c1a2386d7ce3d2bf5e30d"
}
```

## Entry claim_5c067230bc1c324d3691dc880edb2578

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s10-systemic-native-predecessors.json",
  "collection": "registryGaps",
  "claimId": "claim_5c067230bc1c324d3691dc880edb2578",
  "authorSession": "codex-session:unit-run-1792094246578-b2fbe39b@2026-10-16",
  "before": null,
  "currentDecision": {
    "claimId": "claim_5c067230bc1c324d3691dc880edb2578",
    "sourcePath": "docs/platform/runner/subcomponents/h-6df5686d0d54/spec.md",
    "sourceUnitDigest": "69f0927ed54ab08aa5fc1e9f43beca35a3ad76e034a98945ea39674b4dc4cb2f",
    "claimKind": "specification",
    "disposition": "supersede",
    "targetOwner": "docs/platform/runner/subcomponents/h-6df5686d0d54/spec.md",
    "targetAnchor": "unheaded-block-3",
    "targetUnitDigest": "6ee82017c754d1ebcfed7fcd146851cdd954235737f350c0dbd70a9629516110",
    "targetAncestry": [
      "Added in candidate: Runner Actors & Access",
      "Actors & Access"
    ],
    "rationale": "A22/A31/L10-18b/L10-20: native predecessor from 19ca8de23 is superseded by the current same-section unit after authorized source/target link-cell restoration, sentence-order restoration or evolve code-line citation correction. Complete immutable before/after unit text and native successor identity are recorded in step10-sync345-predecessor-reconciliation.json; review the actual delta, not ordinal-anchor equality. Current successor remains candidate, no truth or cutover approval.",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792094246578-b2fbe39b@2026-10-16",
    "reviewNote": "Independent review pending at 345f15d95; no approval carried."
  },
  "native": {
    "kind": "identityGaps",
    "sourcePath": "docs/platform/runner/subcomponents/h-6df5686d0d54/spec.md",
    "unitDigest": "fd967629a032b84c19ae2dba33efd3e0e1ab99101d1b65feed38c468ee745e71",
    "identityFingerprint": "fd967629a032b84c19ae2dba33efd3e0e1ab99101d1b65feed38c468ee745e71",
    "claimId": "claim_5c067230bc1c324d3691dc880edb2578",
    "sourceAnchor": "unheaded-block-3",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "69f0927ed54ab08aa5fc1e9f43beca35a3ad76e034a98945ea39674b4dc4cb2f",
    "claimKind": "specification",
    "status": "future",
    "identityStatus": "identity-gap",
    "gapReason": "edited unit whose anchor unheaded-block-3 is not a stable heading anchor"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-3",
      "githubAnchor": "unheaded-block-3",
      "stableAnchor": "unheaded-block-3",
      "title": "Unheaded block 3",
      "startLine": 27,
      "endLine": 34,
      "textDigest": "69f0927ed54ab08aa5fc1e9f43beca35a3ad76e034a98945ea39674b4dc4cb2f",
      "sample": "| Capability | Người vận hành | Runner | Worker (trợ lý nền) |\n|---|---|---|---|\n| Khởi động vòng / duyệt đề xuất (merge → done) | ✓ | — | — |\n| Ghi trạng thái trong vòng dispatch ",
      "identityFingerprint": "fd967629a032b84c19ae2dba33efd3e0e1ab99101d1b65feed38c468ee745e71",
      "ancestry": [
        "Added in candidate: Runner Actors & Access",
        "Actors & Access"
      ],
      "text": "| Capability | Người vận hành | Runner | Worker (trợ lý nền) |\n|---|---|---|---|\n| Khởi động vòng / duyệt đề xuất (merge → done) | ✓ | — | — |\n| Ghi trạng thái trong vòng dispatch | — (ngoài vòng vẫn ghi tay được) | ✓ duy nhất, qua một cửa | — CẤM (bằng chỉ dẫn) |\n| Commit trong worktree/nhánh riêng | — | — | ✓ |\n| Sửa cây làm việc chính | ✓ | — | — CẤM (bằng chỉ dẫn + kết quả chỉ là đề xuất) |\n| Đồng bộ lại một việc đỗ vì gãy nhập (`catchup`) | ✓ | — | — |\n| Xếp hạng/xem candidate tự cải thiện (Gate A, former `evolve`; Added in candidate: door removed in `120af6b3d`, `bin/fgos.mjs:4373`) | Historical operator role | — | — |"
    }
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-3",
    "githubAnchor": "unheaded-block-3",
    "stableAnchor": "unheaded-block-3",
    "title": "Unheaded block 3",
    "startLine": 27,
    "endLine": 34,
    "textDigest": "6ee82017c754d1ebcfed7fcd146851cdd954235737f350c0dbd70a9629516110",
    "sample": "| Capability | Người vận hành | Runner | Worker (trợ lý nền) |\n|---|---|---|---|\n| Khởi động vòng / duyệt đề xuất (merge → done) | ✓ | — | — |\n| Ghi trạng thái trong vòng dispatch ",
    "identityFingerprint": "65e9d12b794043970ea57fb1eada15ebc11a3b012cc477e0d72235cf63224a47",
    "ancestry": [
      "Added in candidate: Runner Actors & Access",
      "Actors & Access"
    ],
    "text": "| Capability | Người vận hành | Runner | Worker (trợ lý nền) |\n|---|---|---|---|\n| Khởi động vòng / duyệt đề xuất (merge → done) | ✓ | — | — |\n| Ghi trạng thái trong vòng dispatch | — (ngoài vòng vẫn ghi tay được) | ✓ duy nhất, qua một cửa | — CẤM (bằng chỉ dẫn) |\n| Commit trong worktree/nhánh riêng | — | — | ✓ |\n| Sửa cây làm việc chính | ✓ | — | — CẤM (bằng chỉ dẫn + kết quả chỉ là đề xuất) |\n| Đồng bộ lại một việc đỗ vì gãy nhập (`catchup`) | ✓ | — | — |\n| Xếp hạng/xem candidate tự cải thiện (Gate A, former `evolve`; Added in candidate: door removed in `120af6b3d`, `bin/fgos.mjs:4415`) | Historical operator role | — | — |"
  },
  "classObservation": {
    "class": "Judgment",
    "reason": "no target digest match",
    "targetUnit": null
  },
  "sourceTargetDigestsUnequal": true,
  "mechanicalRequired": true,
  "deepRequired": true,
  "reviewScope": "Review current pending binding and rationale; no inherited approval.",
  "currentContentCommit": "345f15d95663260976200be66d1b9a6c648bcd6d",
  "entryId": "claim_5c067230bc1c324d3691dc880edb2578"
}
```

## Entry claim_792117ae3e90dcc79bb2522f59773b89

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s10-systemic-native-predecessors.json",
  "collection": "registryGaps",
  "claimId": "claim_792117ae3e90dcc79bb2522f59773b89",
  "authorSession": "codex-session:unit-run-1792094246578-b2fbe39b@2026-10-16",
  "before": null,
  "currentDecision": {
    "claimId": "claim_792117ae3e90dcc79bb2522f59773b89",
    "sourcePath": "docs/platform/runner/subcomponents/h-ce5b9771a26a/spec.md",
    "sourceUnitDigest": "f88931593c55ac2afc6ae60cd52a96dda07aa2b673d169b001205b302ef544b4",
    "claimKind": "specification",
    "disposition": "supersede",
    "targetOwner": "docs/platform/runner/subcomponents/h-ce5b9771a26a/spec.md",
    "targetAnchor": "unheaded-block-2",
    "targetUnitDigest": "3405ed4f32704ce2e17c155d22d3366a75bdf88bc026b500d66ed59f11314445",
    "targetAncestry": [
      "Added in candidate: Runner Entry Points & Triggers"
    ],
    "rationale": "A22/A31/L10-18b/L10-20: native predecessor from 19ca8de23 is superseded by the current same-section unit after authorized source/target link-cell restoration, sentence-order restoration or evolve code-line citation correction. Complete immutable before/after unit text and native successor identity are recorded in step10-sync345-predecessor-reconciliation.json; review the actual delta, not ordinal-anchor equality. Current successor remains candidate, no truth or cutover approval.",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792094246578-b2fbe39b@2026-10-16",
    "reviewNote": "Independent review pending at 345f15d95; no approval carried."
  },
  "native": {
    "kind": "identityGaps",
    "sourcePath": "docs/platform/runner/subcomponents/h-ce5b9771a26a/spec.md",
    "unitDigest": "72890494ad1b330ec72e266fdbfe7a828fb2eeb69a7a9e24aa1af081dbd539f4",
    "identityFingerprint": "72890494ad1b330ec72e266fdbfe7a828fb2eeb69a7a9e24aa1af081dbd539f4",
    "claimId": "claim_792117ae3e90dcc79bb2522f59773b89",
    "sourceAnchor": "unheaded-block-2",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "f88931593c55ac2afc6ae60cd52a96dda07aa2b673d169b001205b302ef544b4",
    "claimKind": "specification",
    "status": "future",
    "identityStatus": "identity-gap",
    "gapReason": "edited unit whose anchor unheaded-block-2 is not a stable heading anchor"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-2",
      "githubAnchor": "unheaded-block-2",
      "stableAnchor": "unheaded-block-2",
      "title": "Unheaded block 2",
      "startLine": 23,
      "endLine": 23,
      "textDigest": "f88931593c55ac2afc6ae60cd52a96dda07aa2b673d169b001205b302ef544b4",
      "sample": "> Added in candidate: Metadata and map-based placement scaffolding. Original source heading levels, ids and direct sections are retained. Known stale carried sentences; full truth ",
      "identityFingerprint": "72890494ad1b330ec72e266fdbfe7a828fb2eeb69a7a9e24aa1af081dbd539f4",
      "ancestry": [
        "Added in candidate: Runner Entry Points & Triggers"
      ],
      "text": "> Added in candidate: Metadata and map-based placement scaffolding. Original source heading levels, ids and direct sections are retained. Known stale carried sentences; full truth check owed at promotion. A19 carriage and explicit Lead A35 note preserve deleted-module, retired-corpus, moved-plan and runner.md:<line> text verbatim. Corrections in this candidate: A41 F1: remove unavailable entry point (bin/fgos.mjs:4373-4380; bin/fgos.mjs:4640-4643); R9-5: remove decisions-placement boilerplate from non-decision carrier."
    }
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-2",
    "githubAnchor": "unheaded-block-2",
    "stableAnchor": "unheaded-block-2",
    "title": "Unheaded block 2",
    "startLine": 23,
    "endLine": 23,
    "textDigest": "3405ed4f32704ce2e17c155d22d3366a75bdf88bc026b500d66ed59f11314445",
    "sample": "> Added in candidate: Metadata and map-based placement scaffolding. Original source heading levels, ids and direct sections are retained. Known stale carried sentences; full truth ",
    "identityFingerprint": "331f8dde9ba29f91749828284b1560f567dcbed4f9fe3a1562c5224db7a65c92",
    "ancestry": [
      "Added in candidate: Runner Entry Points & Triggers"
    ],
    "text": "> Added in candidate: Metadata and map-based placement scaffolding. Original source heading levels, ids and direct sections are retained. Known stale carried sentences; full truth check owed at promotion. A19 carriage and explicit Lead A35 note preserve deleted-module, retired-corpus, moved-plan and runner.md:<line> text verbatim. Corrections in this candidate: A41 F1: remove unavailable entry point (bin/fgos.mjs:4414-4417); R9-5: remove decisions-placement boilerplate from non-decision carrier."
  },
  "classObservation": {
    "class": "Judgment",
    "reason": "no target digest match",
    "targetUnit": null
  },
  "sourceTargetDigestsUnequal": true,
  "mechanicalRequired": true,
  "deepRequired": true,
  "reviewScope": "Review current pending binding and rationale; no inherited approval.",
  "currentContentCommit": "345f15d95663260976200be66d1b9a6c648bcd6d",
  "entryId": "claim_792117ae3e90dcc79bb2522f59773b89"
}
```

## Entry claim_61244b0a84842a2771f7cdb493ebb699

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s10-systemic-native-predecessors.json",
  "collection": "registryGaps",
  "claimId": "claim_61244b0a84842a2771f7cdb493ebb699",
  "authorSession": "codex-session:unit-run-1792094246578-b2fbe39b@2026-10-16",
  "before": null,
  "currentDecision": {
    "claimId": "claim_61244b0a84842a2771f7cdb493ebb699",
    "sourcePath": "docs/platform/runner/subcomponents/h-f34e0d170d89/spec.md",
    "sourceUnitDigest": "ae0e268fad727f5deda17cf43d013aa1710f5cea2506fdd844809c3c8e98511f",
    "claimKind": "specification",
    "disposition": "supersede",
    "targetOwner": "docs/platform/runner/subcomponents/h-f34e0d170d89/spec.md",
    "targetAnchor": "unheaded-block-2",
    "targetUnitDigest": "35107e63035cafc34d5698a84f60bb1be49f6700d5e2ad14471d6de41ad86cca",
    "targetAncestry": [
      "Added in candidate: Runner Pointers (implementation)"
    ],
    "rationale": "A22/A31/L10-18b/L10-20: native predecessor from 19ca8de23 is superseded by the current same-section unit after authorized source/target link-cell restoration, sentence-order restoration or evolve code-line citation correction. Complete immutable before/after unit text and native successor identity are recorded in step10-sync345-predecessor-reconciliation.json; review the actual delta, not ordinal-anchor equality. Current successor remains candidate, no truth or cutover approval.",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792094246578-b2fbe39b@2026-10-16",
    "reviewNote": "Independent review pending at 345f15d95; no approval carried."
  },
  "native": {
    "kind": "identityGaps",
    "sourcePath": "docs/platform/runner/subcomponents/h-f34e0d170d89/spec.md",
    "unitDigest": "e632b7b484db16a9cc0c30263c5f46b3416fbbca676fcc99cd78f1b7090b68fe",
    "identityFingerprint": "e632b7b484db16a9cc0c30263c5f46b3416fbbca676fcc99cd78f1b7090b68fe",
    "claimId": "claim_61244b0a84842a2771f7cdb493ebb699",
    "sourceAnchor": "unheaded-block-2",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "ae0e268fad727f5deda17cf43d013aa1710f5cea2506fdd844809c3c8e98511f",
    "claimKind": "specification",
    "status": "future",
    "identityStatus": "identity-gap",
    "gapReason": "edited unit whose anchor unheaded-block-2 is not a stable heading anchor"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-2",
      "githubAnchor": "unheaded-block-2",
      "stableAnchor": "unheaded-block-2",
      "title": "Unheaded block 2",
      "startLine": 23,
      "endLine": 23,
      "textDigest": "ae0e268fad727f5deda17cf43d013aa1710f5cea2506fdd844809c3c8e98511f",
      "sample": "> Added in candidate: Metadata and map-based placement scaffolding. Original source heading levels, ids and direct sections are retained. Known stale carried sentences; full truth ",
      "identityFingerprint": "e632b7b484db16a9cc0c30263c5f46b3416fbbca676fcc99cd78f1b7090b68fe",
      "ancestry": [
        "Added in candidate: Runner Pointers (implementation)"
      ],
      "text": "> Added in candidate: Metadata and map-based placement scaffolding. Original source heading levels, ids and direct sections are retained. Known stale carried sentences; full truth check owed at promotion. A19 carriage and explicit Lead A35 note preserve deleted-module, retired-corpus, moved-plan and runner.md:<line> text verbatim. Corrections in this candidate: A41 F2: replace deleted entropy pointer (packages/observe/rust/src/metrics_cli/entropy.rs:1-8; packages/observe/rust/src/metrics_cli/entropy.rs:107-127); A41 F1: replace deleted ranking pointer (bin/fgos.mjs:4640-4643; bin/fgos.mjs:4373-4380); R9-5: remove decisions-placement boilerplate from non-decision carrier."
    }
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-2",
    "githubAnchor": "unheaded-block-2",
    "stableAnchor": "unheaded-block-2",
    "title": "Unheaded block 2",
    "startLine": 23,
    "endLine": 23,
    "textDigest": "35107e63035cafc34d5698a84f60bb1be49f6700d5e2ad14471d6de41ad86cca",
    "sample": "> Added in candidate: Metadata and map-based placement scaffolding. Original source heading levels, ids and direct sections are retained. Known stale carried sentences; full truth ",
    "identityFingerprint": "96946de13c0696253ab306030fc9e269d9aa56a4be5371ba9cbd92064a3badc8",
    "ancestry": [
      "Added in candidate: Runner Pointers (implementation)"
    ],
    "text": "> Added in candidate: Metadata and map-based placement scaffolding. Original source heading levels, ids and direct sections are retained. Known stale carried sentences; full truth check owed at promotion. A19 carriage and explicit Lead A35 note preserve deleted-module, retired-corpus, moved-plan and runner.md:<line> text verbatim. Corrections in this candidate: A41 F2: replace deleted entropy pointer (packages/observe/rust/src/metrics_cli/entropy.rs:1-8; packages/observe/rust/src/metrics_cli/entropy.rs:107-127); A41 F1: replace deleted ranking pointer (bin/fgos.mjs:4640-4643; bin/fgos.mjs:4415-4380); R9-5: remove decisions-placement boilerplate from non-decision carrier."
  },
  "classObservation": {
    "class": "Judgment",
    "reason": "no target digest match",
    "targetUnit": null
  },
  "sourceTargetDigestsUnequal": true,
  "mechanicalRequired": true,
  "deepRequired": true,
  "reviewScope": "Review current pending binding and rationale; no inherited approval.",
  "currentContentCommit": "345f15d95663260976200be66d1b9a6c648bcd6d",
  "entryId": "claim_61244b0a84842a2771f7cdb493ebb699"
}
```

## Entry claim_09ce5c9968f21e0b39b0f23170433a9b

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s10-systemic-native-predecessors.json",
  "collection": "registryGaps",
  "claimId": "claim_09ce5c9968f21e0b39b0f23170433a9b",
  "authorSession": "codex-session:unit-run-1792094246578-b2fbe39b@2026-10-16",
  "before": null,
  "currentDecision": {
    "claimId": "claim_09ce5c9968f21e0b39b0f23170433a9b",
    "sourcePath": "docs/platform/runner/subcomponents/h-f34e0d170d89/spec.md",
    "sourceUnitDigest": "eb280e498fa6fc523bdcb534532de95023a5a82ec1ffaa2be5f5f36a4e618891",
    "claimKind": "specification",
    "disposition": "supersede",
    "targetOwner": "docs/platform/runner/subcomponents/h-f34e0d170d89/spec.md",
    "targetAnchor": "unheaded-block-3",
    "targetUnitDigest": "853cf58afec64a9d7b507305bfadf959cf0f88ef17e3b90b199a85bf3ed71c43",
    "targetAncestry": [
      "Added in candidate: Runner Pointers (implementation)",
      "Pointers (implementation)"
    ],
    "rationale": "A22/A31/L10-18b/L10-20: native predecessor from 19ca8de23 is superseded by the current same-section unit after authorized source/target link-cell restoration, sentence-order restoration or evolve code-line citation correction. Complete immutable before/after unit text and native successor identity are recorded in step10-sync345-predecessor-reconciliation.json; review the actual delta, not ordinal-anchor equality. Current successor remains candidate, no truth or cutover approval.",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792094246578-b2fbe39b@2026-10-16",
    "reviewNote": "Independent review pending at 345f15d95; no approval carried."
  },
  "native": {
    "kind": "identityGaps",
    "sourcePath": "docs/platform/runner/subcomponents/h-f34e0d170d89/spec.md",
    "unitDigest": "12393aae26ef8da7160d239d3fd7530f9702e3b61f6112180771296affd15475",
    "identityFingerprint": "12393aae26ef8da7160d239d3fd7530f9702e3b61f6112180771296affd15475",
    "claimId": "claim_09ce5c9968f21e0b39b0f23170433a9b",
    "sourceAnchor": "unheaded-block-3",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "eb280e498fa6fc523bdcb534532de95023a5a82ec1ffaa2be5f5f36a4e618891",
    "claimKind": "specification",
    "status": "future",
    "identityStatus": "identity-gap",
    "gapReason": "edited unit whose anchor unheaded-block-3 is not a stable heading anchor"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-3",
      "githubAnchor": "unheaded-block-3",
      "stableAnchor": "unheaded-block-3",
      "title": "Unheaded block 3",
      "startLine": 27,
      "endLine": 77,
      "textDigest": "eb280e498fa6fc523bdcb534532de95023a5a82ec1ffaa2be5f5f36a4e618891",
      "sample": "- `bin/fgos-runner.mjs` — CLI (--once/--dry-run/--watch/--poll-ms — str7-str8-priority-intent; `--config` bỏ ở RUL93 (the runner loop's worker and the fan-out batch run as one Unit",
      "identityFingerprint": "12393aae26ef8da7160d239d3fd7530f9702e3b61f6112180771296affd15475",
      "ancestry": [
        "Added in candidate: Runner Pointers (implementation)",
        "Pointers (implementation)"
      ],
      "text": "- `bin/fgos-runner.mjs` — CLI (--once/--dry-run/--watch/--poll-ms — str7-str8-priority-intent; `--config` bỏ ở RUL93 (the runner loop's worker and the fan-out batch run as one Unit run each)), exit theo phạm trù; nhánh `--watch` đăng ký `SIGINT`/`SIGTERM` lên một `AbortController` chung TRƯỚC khi gọi `runWatch`, tín hiệu thứ hai buộc `process.exit(130)`; hàm `printResult` (dùng chung giữa `--once` và `onCycle` của `--watch`) nay bọc `result` (trừ `exitCode`) qua `wrapEnvelope` (`src/state/envelope.mjs`, cùng hàm `bin/fgos.mjs` dùng) và in JSON một dòng — không `JSON.stringify(..., null, 2)` như `fgos.mjs` — vì `--watch` phát nhiều phong bì nối tiếp theo thời gian (per str46-io-contract, xem RUL61 (kết-cục cuối của `fgos-runner` nay bọc cùng phong bì máy-đọc `fgos.v1` như mọi verb)); exit-code prose ở đầu file trỏ về `src/state/store.mjs`'s `EXIT_CODES` + `src/runner/loop.mjs`'s `EXIT_BUSY` thay vì tự liệt lại bảng\n- `src/runner/loop.mjs` — vòng + startup reap (SKIP claim `human`/`session` — xem \"Gặt-lại lúc khởi động\") + khoá liên-tiến-trình `.fgos/runner.lock` (busy exit 6); NGAY SAU reap, TRƯỚC vòng dispatch: (1) quét mọi item `stage==='discovery' && status==='todo'` (không đọc `item.mode`), dựng worktree tạm + `spawnWorker` với `stage: 'discovery'` cho từng item, đọc khối phán quyết trong output của worker rồi gọi `resolveDiscovery` (`src/intake/discovery.mjs`) với chính verdict đó, truyền `'runner'` — nhánh không có commit nào, hoặc không đọc được verdict, thì item được để nguyên tại chỗ cho lượt sau; (2) đọc lại view tươi rồi quét mọi item ở `stageForStep(domain,'Divide')` (`planning`) CỘNG tên di sản `decompose`, với `status==='todo'`, và gọi `resolvePlan` (`src/intake/plan.mjs`) cho từng item, cùng truyền `'runner'` — không kèm verdict, nên nó chỉ cho đi thẳng khi `plan.md` của item khai mode `tiny`/`small`, còn lại no-op an toàn; cùng lượt chạy có thể chaining cả hai sweep trên một item vừa rời `discovery`; ghi bản outcome dự đoán tại claim + thực tế ở cả hai lối ra cuối (thành đề xuất, hoặc đỗ/dừng) qua `addOutcome` của store; mọi `moveWork` runner tự gọi (claim/propose/park) truyền `role:'runner'`; gọi `runGoalCheck` (từ `goal-check.mjs`, không còn tự triển khai) cho cả proof lúc dispatch lẫn proof lúc gặt-lại; ngay trước khi spawn worker, đọc lại view TƯƠI qua `listWork(dir)` rồi truyền `feedback: {answer: view.gates?.[item.id]?.answer, reason: view.work?.[item.id]?.reason}` vào `spawnWorker` (per worker-execution STR33 / 396d9d9e, xem RUL23 (phản hồi người threading vào prompt worker)); `dispatch.mjs` — prompt/config/spawn (argv-only, spawnSync timeout; caveat grandchild SIGTERM ghi trong doc comment) + `resolveExecutorCommand`/`resolveTierModel` (dùng chung cho mọi lượt spawn worker, kể cả lượt dispatch nghiên-cứu — không còn call site nào cho một lời gọi model phán lồng bên trong engine); `buildPrompt(work, feedback?)` dựng 5 section cố định (Goal, Description, Worktree boundary, Expected proof, Constraints — hợp đồng test pin presence) cộng mục `# Human feedback` TÙY CHỌN khi `feedback.answer`/`feedback.reason` có mặt (nguyên văn, xem RUL23 (phản hồi người threading vào prompt worker)); `description` là `work.description` nguyên văn, degrade \"(không có)\" khi vắng (per discovery-context STR30); `spawnWorker(work, cfg, cwd, opts)` nhận `opts.feedback` truyền xuống `buildPrompt`; `worktree.mjs` — lifecycle + reclaimOrphanedCheckout + `detectTrunk(repoRoot)`/`isMainWorktree(repoRoot)` (dời từ `merge.mjs` sang đây per tsk-49i — cả hai là danh tính worktree/nhánh, không mang ngữ nghĩa nội dung merge; dời đi cũng cắt luôn import vòng `merge.mjs` ↔ `worktree.mjs`) + `createBranchRef(repoRoot, id, opts)` (tạo `fgw/<id>` chỉ-là-ref, không worktree, idempotent) + `createWorktree`'s `opts.baseRef` (fork worktree mới từ một ref chỉ định thay vì HEAD hiện tại — dùng cho con fork từ tip nhánh gốc); `recovery.mjs` — 8 lớp; `anti-loop.mjs` — `visitCount` (lifetime, dùng cho outcome/metric) + `visitsSinceLastHumanEvent(events, id)` (ngân sách CỔNG, per-item, reset trên `role==='human'` mang `answer` hoặc `reason`, xem RUL29 (cổng chống-lặp reset theo can thiệp người cuối cùng của chính việc)) + breaker; `loop.mjs`'s gate (cả nhánh dry-run đơn lẻ lẫn nhánh lọc `overLimit` của batch dispatch dưới) gọi `visitsSinceLastHumanEvent`, không còn `visitCount`, để quyết park; `createMissBreaker` nay PER-ITEM (Map theo id, `consecutiveMissesFor(itemId)`; `consecutiveMisses` getter cũ giữ nguyên qua một khóa sentinel tương thích ngược, per fan-out-parallel-5). `runOnce`'s vòng dispatch nay là pool-loop batch (cell fan-out-parallel-8): đọc TOÀN BỘ `readyWork(dir)`, lọc qua `root-affinity.mjs`'s `steerFrontier`, nhóm theo gốc và cắt còn tối đa `parallel.maxRoots × parallel.maxLeavesPerRoot` (đọc từ `.fgos/config.json`'s `runner` section, mặc định 4×4 khi vắng khối `parallel`), claim từng việc bên trong callback của `write-queue.mjs`'s `enqueue` (bắt buộc — giải-và-ghi phải cùng một giao dịch hàng đợi để giữ đúng chứng minh chống-tranh-giành), rồi dispatch cả mẻ đồng thời qua `Promise.allSettled`; mỗi việc claim xong xác định LEAF hay ROOT qua `state/frontier.mjs`'s `resolveRoot(view, id)` — leaf: `createBranchRef(repoRoot, rootId, {baseRef:'main'})` rồi `createWorktree(repoRoot, item.id, {worktreeDir, baseRef: branchNameFor(rootId)})`; root: `createWorktree` không đổi, tự nhiên tái dùng nhánh đã có nếu tồn tại. Mẻ xong → đọc lại `readyWork` tươi, lặp tới khi không còn việc đang chạy VÀ không còn việc sẵn-sàng; `runOnce` trả `{outcome, dispatched, parked, reap, exitCode}` thay vì kết quả một item\n- `src/runner/loop.mjs`'s `parseDiscoveredBlocks(output)` + `captureDiscoveredWork(...)` — kênh báo việc-phát-hiện (xem \"Báo việc-phát-hiện từ trợ lý\" trên, RUL45 (báo việc-phát-hiện của trợ lý: đúng một lần mỗi lượt, fail-safe, có trần + chống trùng)): tách mọi khối lồng `fgos-discovered` (JSON, chỉ cần `title` khác rỗng) khỏi output đã thu của trợ lý, fail-safe (thân JSON hỏng/thiếu `title`/không phải object đều bị bỏ qua, không throw); gọi đúng MỘT LẦN trong `finally` bọc vòng thử lại của `dispatchClaimedItem`, tại kết cục cuối (không gọi lại giữa các lần thử nội bộ); mỗi khối hợp lệ đi qua `write-queue.mjs`'s `enqueue` (cùng cửa ghi tuần tự) — bên trong đó: cắt còn tối đa `DISCOVERY_CAP` (=20) khối trước khi lặp (phần dư log rồi bỏ), rồi với mỗi khối: quét view hiện hành tìm item có `discoveredFrom` khớp item đang thi công VÀ tên khớp sau khi chuẩn hoá (trim + hạ chữ) — khớp thì log rồi bỏ qua (không tạo); không khớp mới gọi `generateId`/`classify`/`addWork` (đóng dấu `discoveredFrom: item.id`, và stage vào-vòng của domain — `discovery` cho `coding`); `dispatch.mjs`'s văn bản prompt worker mô tả kênh khối lồng này cho trợ lý (nguyên tắc \"chỉ báo, không tự ghi\" — trợ lý vẫn không bao giờ được gọi `fgos`/đụng `.fgos/`); `sanitizeTitleForLog(title)` (S11, review-fix P3) — gộp khoảng trắng/xuống dòng + cắt 120 ký tự (kèm dấu `…` khi cắt), gọi tại đúng hai điểm `log` có nội suy `block.title` bên trong `captureDiscoveredWork`; KHÔNG áp dụng lên trường `title` truyền vào `addWork`\n- `src/runner/goal-check.mjs` — hàm goal-check dùng chung DUY NHẤT (`runGoalCheck(item, cwd, timeoutMs)`): chạy `item.verify` qua shell tại `cwd`, phán chỉ bằng exit status — trích xuất từ `loop.mjs` (stage-decompose S2-pull) để cả vòng tự hành LẪN cửa pull `fgos return` (spec Work-State) gọi đúng một bản logic, không bao giờ hai bản song song\n- `src/runner/frozen-judge.mjs` (STR63, domain layer thuần — không fs/git) — `FROZEN_JUDGE_PATTERNS` (bê nguyên từ frozen-judge của bee, bỏ mục `.bee/config.json` không áp dụng) + `frozenJudgeHits(changedFiles, footprint)`: chấm file đã đổi khớp nhóm nhạy cảm (test/CI/lockfile/manifest) NGOÀI `footprint` đã khai — khớp exact-path, không prefix/glob. `bin/fgos.mjs`'s `changedFilesSince(cwd, from, to)` (`git diff --name-only`, cạnh `commitsSince`) cấp input; gọi trong `return` khi `check.passed`, xem RUL60 (`return` mang thêm khuyến nghị frozen-judge — advisory, không bao giờ chặn)\n- `src/intake/discovery.mjs` — xem Pointers spec Work-State (module dùng chung giữa runner và verb `discover`); verb `discover` (phiên sống) truyền `'session'`; verdict đủ rõ `moveStage` tới `planning` (bỏ qua `exploring`), verdict chưa đủ rõ `moveStage` tới `exploring` RỒI đậu `awaiting-human` mang câu hỏi (hai cửa ghi rời nhau — `stage` và `status` không giẫm nhau); một đề xuất `verify` còn phải qua một vòng kiểm cú pháp độc lập trước khi được ghi, bất đồng thì cũng đậu chờ người. `judgeDiscovery` (lời gọi phán lồng cũ) đã NGHỈ HƯU: engine luôn cần một verdict do người gọi đưa vào — worker của quét nghiên-cứu, hay phiên sống gọi `fgos discover --verdict` — thiếu verdict thì role `runner` no-op an toàn, role khác báo lỗi rõ ràng\n- `src/intake/plan.mjs` (đổi tên từ `decompose.mjs`) — xem Pointers spec Work-State (module dùng chung giữa runner và verb `plan` khi item ở stage `planning`, hoặc còn ở tên di sản `decompose`); verb `plan` (phiên sống) truyền `'session'`; `resolvePlan` cũng là chỗ nhả claim `doing→todo` khi gốc sang `executing` (claim-lock §3b)\n- `src/runner/prompt-templates/worker-prompt-discovery.txt` — mẫu prompt riêng của lượt dispatch nghiên-cứu, chọn bởi luật `{domain:'coding', stage:'discovery'}` trong `selectTemplate` (`src/runner/prompt-templates.mjs`); mọi lời gọi không truyền `stage` giữ nguyên hành vi cũ, không bị luật này chen trước. (Helper thử-lại `src/intake/judge-executor.mjs` của bản trước đã bị xoá cùng lúc `judgeDiscovery`/`judgeDecompose` nghỉ hưu — không còn lời gọi model phán lồng nào để thử lại.)\n- `packages/observe/rust/src/metrics_cli/entropy.rs` — handler hiện hành cho `fgos metrics entropy`, tính score/parts và delta từ snapshot; `src/report/entropy.mjs` và CLI `check` cũ đã bị xoá.\n- `.fgos/config.json`'s `runner` section (tsk-5vf; tsk-5hv xoá hẳn fallback về file flat legacy cũ — đây giờ là nguồn config DUY NHẤT, `fgos setup` là verb thực hiện move thật) — config committed (executor template + `modelPolicies.claude` nano/haiku, standard/sonnet, frontier/opus [tsk-5tm, thay `models` phẳng cũ; 6-tier vocab từ 2026-09-17] + timeoutMs); `executor.args` mang `--permission-mode acceptEdits`, không còn quyền git — runner commit thay worker (0052) (quyền TỐI THIỂU, xem RUL6 (consumer rẽ nhánh theo mã thoát phạm trù, không bao giờ theo thông điệp)); khối `parallel` TÙY CHỌN — `maxRoots`/`maxLeavesPerRoot` (Data Dictionary #6, mặc định trong-code 4/4 khi khối vắng mặt, mọi config cũ vẫn chạy không cần sửa); `src/runner/dispatch.mjs`'s `ensureRunnerConfigForDir(dir)` — shared-file-aware: tại đường MẶC ĐỊNH (không `--config`) vắng file, gọi `detectAssistantCli` (quét PATH thuần, không spawn — `KNOWN_ASSISTANT_CLI_NAMES`) rồi viết `DEFAULT_RUNNER_CONFIG` với executor từ `SUPPORTED_EXECUTOR_TEMPLATES[detected]` khi trợ lý dò được có mẫu đã kiểm chứng (hôm nay chỉ `claude`, y hệt `DEFAULT_RUNNER_CONFIG.executor`), hoặc executor placeholder tự-báo-lỗi khi không (RUL48b) — rồi mới nạp, kèm một dòng thông báo tên file + executor được chọn (RUL48 (cấu hình runner tự sinh tại đường mặc định khi vắng mặt — không bao giờ đòi người tạo tay trước)); `bin/fgos.mjs`'s verb `discover` và `bin/fgos-runner.mjs`'s vòng chính đều gọi `ensureRunnerConfigForDir` cho nhánh đường mặc định, `loadRunnerConfig` thẳng cho nhánh `--config` tường minh của `discover` (`fgos-runner` chỉ còn đường mặc định, RUL93 (the runner loop's worker and the fan-out batch run as one Unit run each)); đọc qua `mergeWithGlobalConfig` trước khi tách phần `runner` (project luôn thắng `~/.fgos/config.json` theo key, tsk-5vf)\n- `src/runner/dispatch/write-scope.mjs` — matcher duy nhất của phạm vi ghi (RUL84 (one write-scope matcher)): chuẩn hoá `writes`, nở `runner.generatedPaths`, `matchesWriteScope`/`partitionPaths` cho runner commit, settlement và Workflow.\n- `src/workflow/units-source.mjs` — `translateUnitsToWorkflow`: dịch units file của `fgos workflow start --units` thành Workflow tạm, mỗi Unit một step (RUL89 (workflow start --units)).\n- `src/runner/execution/account-pin.mjs` — ghim account (RUL91 (a person may pin the provider account of a unit run)): `resolveAccountPin` (bind() gọi), `runnerConfigForBinding` (inventory thu hẹp cho dispatch), `assertPinnedAccountsUsable` (quarantine trước unit run/resume), `capacityProviderOf`.\n- `src/runner/execution/partial-writes.mjs` — `worktreeSnapshot`/`writesSince`: baseline của seat ghi và phép so sau provider-limit (RUL92 (a writing seat is not run again over its own partial writes)).\n- `src/runner/execution/unit-sync.mjs` — sync base của Unit (RUL97 (a Unit may sync a base ref first)): `seedSync` (resolve ref trước khi unit run tồn tại), `runPendingSync`, `assertSyncResumable`, `syncBrief`, `commitRoundWithSync`; git tin cậy nằm ở `commit-unit-work.mjs` (`startSyncMerge`/`finishSyncMerge`/`syncMergeState`).\n- `src/runner/work-dispatch.mjs` — cửa của tầng Work vào runUnit (RUL93 (the runner loop's worker and the fan-out batch run as one Unit run each)): `workUnitFor`/`workUnitIdFor` (Unit từ Work item), `spawnWorker` (chạy Unit, ánh xạ outcome sang recovery matrix, cờ `resumable`); `src/runner/fanout-batch.mjs` — fan-out batch trên runUnit.\n- `src/runner/operation-choice.mjs` — driver của Work (RUL94 (a Work driver step runs as a Unit)): `chooseStageOperation`, `executeDriverOperationChoice` chạy operation qua `runUnit`, walker `findLatestAssignmentRunResult` đọc verdict ở cả hai layout và so plan theo `rel` + digest; `digestPinnedInputs` (`src/runner/dispatch/assignment-runner.mjs`) băm pin lúc launch.\n- `src/runner/dispatch/run-timeout.mjs` — sàn/trần thời gian của một lượt chạy (RUL96 (one run may take its own timeout)): `RUN_TIMEOUT_MIN_MS`, `RUN_TIMEOUT_MAX_MS`, `runTimeoutProblem`; leaf không import, đọc bởi `config.mjs` (`parseRunTimeout`, `assertRunTimeoutMs`), reaper confinement, khoá dispatch và `src/workflow/definition.mjs`.\n- `src/runner/write-queue.mjs` — cửa ghi tuần tự thuần (không import fs/store): `createWriteQueue({onCommit})`'s `enqueue(fn)` chạy đúng MỘT giao dịch async trọn vẹn tại một thời điểm, theo thứ tự nộp FIFO, bất kể số điểm `await` bên trong; một giao dịch throw/reject không chặn hàng đợi cho giao dịch sau; hiện thực in-process của \"cửa ghi\"; `onCommit` (TÙY CHỌN, str7-str8-priority-intent) — callback gọi đúng một lần trên MỖI giao dịch thành công (không bao giờ trên giao dịch reject), tự bọc try/catch riêng nên một callback lỗi không bao giờ làm gãy hàng đợi; `createWriteQueue` không tham số giữ hành vi y hệt trước khi `onCommit` tồn tại\n- `src/runner/loop.mjs`'s `runWatch(options)` (str7-str8-priority-intent) — vòng cầm-giao bền, xem \"Vòng cầm-giao bền (--watch)\" trên; ghép `runOnce` KHÔNG ĐỔI làm hộp đen, gọi lặp lại; MỘT `createWriteQueue({onCommit})` + MỘT `createMissBreaker` được tạo trước vòng lặp và dùng CHUNG xuyên mọi lượt (không tạo lại mỗi lượt — điểm đúng-sai cốt lõi cho cầu dao tích lũy per RUL53 (`--watch` — vòng cầm-giao bền, dừng chỉ khi có tín hiệu tường minh)); một cờ đóng (closure boolean) do `onCommit` set, kiểm tra SAU khi mỗi lượt `runOnce` trả về (không phải một listener chờ sự kiện — mọi giao dịch cửa-ghi trong sản phẩm đều nằm TRONG một lượt `runOnce` đã await xong, nên một thiết kế lắng-nghe-sau sẽ không bao giờ bắt được tín hiệu, đã bị loại per quyết định d3445024); lượt không ghi gì chờ qua `node:timers/promises`'s `setTimeout(ms, null, {signal})` — hủy được ngay khi `AbortSignal` bắn, không rò timer/listener vì không có listener nào để rò; một `runOnce` throw bị bọc try/catch, báo qua `options.onCycle`, KHÔNG BAO GIỜ thoát ra ngoài làm gãy vòng lặp\n- `src/state/frontier.mjs` — `resolveRoot(view, id)` (đi ngược `parent` tới đỉnh, có bảo vệ chu trình); ở `state/` chứ không ở `runner/root-affinity.mjs` như trước (tsk-49i) vì chính `state/` cũng cần cùng phép đi ngược đó, và việc import ngược sang `runner/` là một trong các cạnh làm hai thư mục phụ thuộc vòng\n- `src/runner/root-affinity.mjs` — quyền-sở-hữu-gốc thuần (không fs/child_process): `createOwnershipStore` (Map rootId→identity, sống trong bộ nhớ một `runOnce`, không bao giờ ghi bền); `claimRoot(store, view, id, ownerIdentity)` — quyết định THUẦN (không tự ghi), người gọi áp dụng bên trong `write-queue`; `steerFrontier(readyItems, view, store, ownerIdentity)` — lọc tập sẵn-sàng còn lại việc mà gốc chưa-chủ hoặc thuộc về chính danh tính này\n- `src/state/store.mjs` `readRawEvents` — accessor chỉ-đọc cho anti-loop (decision 14396a5c); `addOutcome` — cửa ghi outcome (mẫu `addDecision`); `moveStage`/`addDiscovery` — cửa ghi đổi-stage/bản-ghi-discovery (xem spec Work-State); `moveWork` gắn `role` post-transition + compose bài học câu-6 khi `to==='done'` (xem Pointers spec Work-State); `moveWork` cũng nhận `headAtTake` cộng-thêm tùy chọn — chỉ cửa pull `take` truyền, runner không bao giờ truyền nên không đổi hành vi claim của chính nó; cùng khuôn, nhận `headAtReturn` — chỉ `return` truyền (per pr-lifecycle)\n- `bin/fgos.mjs` verb `take`/`return` — cửa pull giao–nhận việc ngoài vòng runner, `return` gọi thẳng `runGoalCheck` ở trên (xem spec Work-State \"Cửa pull giao–nhận việc\" cho hợp đồng đầy đủ); `take` nay CŨNG chấp nhận một item `blocked` mang nhánh `fgw/<id>` sống (`branchExists`, `worktree.mjs`) qua cạnh `blocked→doing`, ghi `branchHeadAtTake` thay vì `headAtTake`; `return` kiểm `item.branchHeadAtTake` TRƯỚC MỌI guard main-based — nguồn-nhánh verify trong worktree tạm detached tại SHA nhánh (`git worktree add --detach`, dọn trong `finally`), ghi `branchHeadAtReturn`, không bao giờ `headAtReturn` (RUL30 (cửa người-hoàn-tất một đề xuất nguồn-nhánh bị đỗ — mở rộng take/return, không verb mới), xem spec Work-State \"Cửa pull giao–nhận việc\")\n- `src/runner/merge.mjs` — cỗ máy cơ chế của cổng duyệt (per pr-lifecycle / 1359ab5e), tách khỏi CLI cùng khuôn `worktree.mjs`/`goal-check.mjs`: `classifySource` (runner/pull/legacy — nhánh sống qua `worktree.mjs`'s `branchExists`, hay cặp `headAtTake`+`headAtReturn`, hay không cả hai); `reviewDiff(repoRoot, item, opts)` (diff theo nguồn + cảnh báo degrade trung thực; `opts.trunk` TÙY CHỌN mặc định `'main'`, per fan-out-parallel — cây nhánh tích hợp truyền nhánh của gốc cho một đề xuất con); `mergeRunnerItem` (`git merge --no-commit --no-ff` → verify trên staged tree qua `runGoalCheck` → renew/check lock ownership synchronously → commit-hoặc-abort, spike-proven; mất lock ở bước kiểm tra cuối trả `lock-lost-mid-merge` và KHÔNG abort merge state vì tree đó có thể thuộc chủ lock mới; target-agnostic — người gọi checkout đúng nhánh đích trước, cây chính cho gốc hoặc nhánh của gốc cho con); `cleanupMergedBranch` (dọn nhánh/worktree sau merge sạch, best-effort); `changedFiles(repoRoot, item, opts)` (STR13 Slice 3) — mirror hóa cơ chế phân giải trunk/nhánh của `reviewDiff` nhưng chạy `git diff --name-only` thay vì `git diff`, trả mảng path đã đổi; nguồn khác `runner` trả mảng rỗng (Iron Law approve-side chỉ soi đề xuất nguồn runner); dùng bởi `approve` để nạp `filesChanged` cho `classifyIronLaw`. KHÔNG BAO GIỜ ghi `.fgos/` trực tiếp — mọi chuyển trạng thái (`awaiting-approval→done`/`awaiting-approval→blocked`) vẫn ở `bin/fgos.mjs` qua `store.mjs`. Manifest layer (`docs/architecture-manifest.json`): infra\n- `src/verbs/merge/*.mjs` (tầng `use-case`, tsk-49i) — logic nghiệp vụ của cả 7 verb cụm merge: `merge.mjs` (`mergeList`/`mergeNext`), `approve.mjs`, `review.mjs`, `sync-root.mjs`, `catchup.mjs`, `reject.mjs`, `promote-to-component.mjs`. `bin/fgos.mjs` cho 7 verb này chỉ còn parse args, tính `repoRoot` theo chính sách RIÊNG của từng verb (`--trust-dir` gate cho approve/sync-root/promote-to-component; `path.dirname(dir)` vô điều kiện cho catchup, tsk-5vl; `process.cwd` thô cho drift của `merge list`/`merge next`), rồi gọi một hàm use-case. `merge next` gọi thẳng `approveUseCase`/`syncRootUseCase` (same-rank, hợp lệ) thay cho đệ quy `runVerb` cũ, và option của hai verb đó được `parseMergeClusterOptions` dựng MỘT lần rồi truyền nguyên khối — thay cho việc forward raw `flags`\n- `bin/fgos.mjs` verb `review`/`approve`/`reject` — cổng duyệt PR nội bộ, bề mặt CLI của cổng duyệt một-cửa (xem \"Cổng duyệt PR nội bộ\" trên cho hợp đồng đầy đủ); `review`/`approve` nay leaf-vs-root-aware qua `state/frontier.mjs`'s `resolveRoot(view, id)`: một đề xuất con gọi `reviewDiff(..., {trunk: branchNameFor(rootId)})` và `approve` nhập vào một worktree ephemeral checkout trên `fgw/<rootId>` (không phải cây chính của người vận hành) rồi dọn nhánh con đó TỪ CHÍNH worktree ephemeral đó (`git branch -d` chỉ thành công từ checkout đã thật sự chứa merge); một đề xuất gốc từng có con (`view.work` có item nào `parent===id`) mà nhập-vào-cây-chính gãy mang lý do `integration-drift` riêng cộng dấu vết `main@<sha hiện tại>` trong chi tiết friction, thay vì lý do gãy-nhập thường; gốc không con giữ nguyên hành vi/lý do cũ, không đổi\n- `src/runner/github-adapter.mjs` (github-adapter, layer infra) — vận chuyển GitHub thuần: `createGitHubPR`/`viewGitHubPRStatus`/`mergeGitHubPR` shell ra `gh` CLI thật (không gọi thẳng HTTP API), `classifyGhFailure` (thuần, không tiến trình con) ánh xạ một lời gọi `gh` gãy sang một lý do — khớp trên nội dung stderr (vd `HTTP 401`/`Bad credentials`), KHÔNG dựa vào mã thoát tài liệu hoá (mã 4) vì bằng chứng thật không khớp tài liệu; `viewGitHubPRStatus` chờ-lặp (poll) khi trường sẵn-sàng-merge của GitHub trả về \"chưa rõ\" (tính bất đồng bộ phía GitHub), có trần thời gian, không bao giờ treo vĩnh viễn — trần này truyền được qua `opts.pollTimeoutMs`, và `review --github --pr` (github-adapter) gọi với `pollTimeoutMs: 0` để buộc đúng MỘT lời gọi `gh` vì phép hỏi thăm đó chỉ cần `closed`/`mergedAt`, không liên quan tới trường sẵn-sàng-merge đang chờ-lặp. KHÔNG import `merge.mjs`/`bin/fgos.mjs`, không tự chạy verify cục bộ nào (verify vẫn ở cây làm việc cục bộ).\n- `bin/fgos.mjs` verb `review --github [--pr <n>]` / `approve --github --pr <n>` — bề mặt CLI của vận chuyển GitHub (xem \"Cổng duyệt qua GitHub\" trên cho hợp đồng đầy đủ): đọc biến môi trường ghi đè lệnh `gh` (chỉ dùng khi kiểm thử tiêm một `gh` giả qua tiến trình con thật; sản xuất luôn dùng `gh` thật trên PATH); thăm dò nhánh đã có upstream chưa bằng một tiến trình con git thuần (không dùng lại helper ném lỗi sẵn có của file — helper đó đúng cho các bước git khác nhưng sai ngữ nghĩa cho một phép thăm dò vốn kỳ vọng gãy ở lần đầu); nhánh `--github` của `approve` chạy SAU phán Iron Law (chặn CHUNG cho mọi nguồn `runner`, hoisted lên trước cả nhánh `--github` — review-20260718-self-improve-loop f01, sửa một lỗ hổng bỏ-qua-gate thật) nhưng vẫn TRƯỚC (không đi qua) phép kiểm cây-sạch của đường cục bộ — `isMainTreeClean` chỉ có ý nghĩa cho một merge cục bộ làm bẩn cây, một merge phía GitHub không đụng cây cục bộ nên không cần; nhánh `--pr` của `review --github` (github-adapter) chèn NGAY SAU guard nguồn `runner` sẵn có, TRƯỚC bước đẩy-nhánh-rồi-mở-PR, nên áp dụng cho MỌI lời gọi `--github` bất kể có `--pr` hay không.\n- `bin/fgos.mjs` verb `catchup <id>` — đồng bộ lại một việc `blocked` (xem \"Đồng bộ lại một việc đỗ (catch-up)\" trên): tiền điều kiện chấp nhận lý do đỗ ∈ {`merge-conflict`, `verify-fail-post-merge`, `verify-timeout-post-merge`, `integration-drift`, `merge-failed-unclassified`, `merge-blocked-other-item`, `lock-lost-mid-merge`, `main-checkout-dirty-mid-merge`} (`main-checkout-dirty-mid-merge`: cổng duyệt gốc→`main` kiểm cây sạch hai lần — trước khi mở worktree CAS, và lại lần nữa dưới `main-checkout.lock` ngay trước `update-ref`, đóng khe hở giữa hai lần đó; lần hai dính bẩn thì không `update-ref`/không đồng bộ cây, trả `blocked` với lý do này, cùng hình dạng \"chưa chạm gì, thử lại được\" như `lock-lost-mid-merge`) (tsk-18a một lần `git merge --no-commit --no-ff` gãy mà KHÔNG tạo `MERGE_HEAD` — không phải xung đột văn bản thật — nên catchup coi là ứng viên thử lại tốt nhất, vì lần gãy này rất có thể chỉ do điều kiện nhất thời; tsk-4hj `merge-blocked-other-item` — `MERGE_HEAD` đã có sẵn TRƯỚC lần merge này, thuộc về một việc KHÁC đang nhập dở, cũng là ứng viên thử lại tốt vì việc kia rồi sẽ xong hoặc bị hủy) và nhánh riêng của việc còn tồn tại (`branchExists`); đích = `branchNameFor(resolveRoot(view,id))` nếu là con, `'main'` nếu là gốc/độc lập; mở worktree ephemeral trên chính nhánh của việc, `git merge-base --is-ancestor <đích> HEAD` TRƯỚC khi nhập → nhánh đã chứa đích rồi (exit 0) → bỏ hẳn merge lẫn commit (merge sẽ là no-op, `git commit` sau đó chết vì \"nothing to commit\" và việc kẹt `blocked` vĩnh viễn), vẫn chạy `runGoalCheck` thật trên cây hiện có → đỏ → giữ nguyên `blocked`, KHÔNG gọi `git merge --abort` (không có merge nào đang chạy) → xanh → `moveWork(..., to:'awaiting-approval')` với `outcome: 'already-caught-up'`, không tạo commit nào; chưa chứa đích (exit 1) → `git merge --no-commit --no-ff <đích>` → xung đột thật → `git merge --abort` + giữ nguyên `blocked`; sạch → `runGoalCheck` trên cây đã stage TRƯỚC khi commit → đỏ → `git merge --abort` + giữ nguyên `blocked`; xanh → commit rồi `moveWork(..., to:'awaiting-approval', expectedStatus:'blocked')` — cạnh, không `reason`, không qua `doing` (spike `.bee/spikes/fan-out-parallel/catchup-real-conflict-probe.sh` chứng minh trước khi build cell); một sự-kiện merge THỰC HIỆN TRỰC TIẾP trong verb này (không gọi `mergeRunnerItem` — hướng nhập của catch-up ngược với `mergeRunnerItem`, đích nhập VÀO nhánh của việc chứ không phải nhánh của việc nhập vào đích)\n- `src/evolve/candidates.mjs` đã bị xoá; CLI hiện hành không có verb `evolve`, và `rankCandidates` chỉ còn được nhắc trong comment của entrypoint.\n- `bin/fgos.mjs` verb `evolve` — Added in candidate: former CLI contract, removed in `120af6b3d`; current CLI rejects `evolve` (`bin/fgos.mjs:4373`). Historical description of Gate A (xem \"Gate A — xếp hạng candidate, bắc cầu sang việc thật (evolve)\" trên cho hợp đồng đầy đủ): `evolve`/`evolve --pick <id>` hai bước đọc-thuần, KHÔNG BAO GIỜ stdin tương tác — không `--pick` thì liệt kê, `--pick <id>` thì in bản ghi friction đầy đủ của đúng id đó, tái dùng formatter friction sẵn có của `check` (`formatFrictionSection`, không formatter mới); `evolve --submit <id>` (STR13 Slice 3) soạn mô tả từ candidate rồi gọi `submitWork` (cùng cửa `fgos submit` dùng) — hành động ghi duy nhất của bề mặt này. Đọc view qua `listWork(dir)` DUY NHẤT — không bao giờ `rebuild`/`refreshView`/`initStore`.\n- `src/intake/risk-keywords.mjs` — nguồn duy nhất của `HEAVY_KEYWORDS` (self-improve loop STR13 Slice 2): 34 từ khóa (21 gốc chuyển từ `classify.mjs` + 13 thêm, nhóm hệ thống ngoài/bỏ kiểm tra/kiểm toán). Manifest layer: kernel (tầng sâu nhất — `classify.mjs` tầng use-case và `iron-law.mjs` tầng domain đều import hợp lệ từ đây; `iron-law.mjs` KHÔNG BAO GIỜ import thẳng từ `classify.mjs` — chiều ngược, vi phạm luật một-chiều-xuống của `architecture.test.mjs`).\n- `src/evolve/iron-law.mjs` — phán quyết Iron Law (self-improve loop STR13 Slice 2, xem \"Iron Law — phân loại rủi ro của một candidate fix\" trên cho hợp đồng đầy đủ): thuần (`classifyIronLaw({filesChanged, description})`), không fs/Date/network, import `HEAVY_KEYWORDS` từ `risk-keywords.mjs`. Manifest layer: domain. Call site: ba chỗ trong `bin/fgos.mjs`, tất cả nguồn `runner` và tất cả chỉ ở ranh giới trunk (per `0032`) — `approve` (ngay trước bước kiểm cây sạch, STR13 Slice 3), pre-check thuần của `merge next`, và `sync-root`. Ba bản gọi giữ nguyên hình dạng lặp có chủ đích: `approve`/`merge next` phân biệt bằng `resolveRoot`, `sync-root` bằng `!item.parent` (RUL37 (Iron Law hỏi ở đúng một ranh giới — trunk — cho mọi đề xuất nguồn runner tới đó)).\n- `src/runner/worker-log.mjs` — cửa ghi DUY NHẤT cho bản ghi output cục bộ (`.fgos/logs/<id>.log`, per worker-dispatch-log) — tách khỏi `store.mjs` vì đây là văn bản tự do (output trợ lý), khác nhật ký sự kiện có cấu trúc của `store.mjs`; `appendWorkerLog(dir, workId, entry)` nối thêm một khối, không bao giờ đè; field vắng mặt (vd không tier/model/output khi lỗi không phải của trợ lý) render mà không throw. `loop.mjs`'s `dispatchClaimedItem` gọi nó ở hai điểm: ngay sau trợ lý chạy xong (trước goal-check — bắt cả đề xuất lẫn chấm-trượt), và trong nhánh bắt lỗi mang `errorClass` (quá-giờ/hỏng-spawn/hỏng-worktree). Thư mục `.fgos/logs/` được git-ignore (không bao giờ vào cây committed) — khác `.fgos/events.jsonl` (committed, là truth) và giống `.fgos/state.json` (view cục bộ). `store.mjs`'s cửa ghi duy nhất (`events.jsonl`+`state.json`) không đổi phạm vi — bản ghi output là một cửa RIÊNG, không đi qua `moveWork`/`appendEvent`. Manifest layer (`docs/architecture-manifest.json`): infra.\n- `domains/coding/AGENTS.md`'s `## fgOS Workflow` section — điểm vào của lớp hướng dẫn (P50): trỏ một phiên mới mở tới `.claude/skills/fgos-routing/SKILL.md`\n- `.claude/skills/fgos-routing/SKILL.md` + `.agents/skills/fgos-routing/SKILL.md` (mirror byte-identical) — entry skill, đọc `stage` của item rồi trỏ tới đúng skill giai đoạn kế tiếp\n- `.claude/skills/fgos-coding-discovering/SKILL.md` + `.agents/` mirror — skill `nghiên-cứu` (stage `discovery`, pha máy-một-mình)\n- `.claude/skills/fgos-coding-exploring/SKILL.md` + `.agents/` mirror — skill `làm-rõ` (stage `exploring`, pha máy+người)\n- `.claude/skills/fgos-coding-planning/SKILL.md` + `.agents/` mirror — skill `chia-việc` (nửa đầu stage `planning`; cũng là skill mà tên stage di sản `decompose` trỏ tới)\n- `.claude/skills/fgos-coding-validating/SKILL.md` + `.agents/` mirror — skill `thẩm-định` (nửa cuối stage `planning`, gác cạnh `planning→executing`) — KHÔNG có ô riêng nào trong bảng stage→skill: nó chạy như pha thứ hai của chính `fgos-coding-planning`\n- `.claude/skills/fgos-coding-implement/SKILL.md` + `.agents/` mirror — skill `thi-công` (stage `executing`, domain `coding` — str89-fgos-domain-skills)\n- `src/state/domain-registry.mjs` + Workflow của domain (`steps[].skill`, `skillForStep(domain, step)`) (str89-fgos-domain-skills) — skill ứng với mỗi bước nằm trong Workflow, xem spec Work-State \"Mô hình domain\"\n- `src/state/work.mjs` field `docsRef` (optional, xem spec Work-State Data Dictionary #23) — con trỏ tới `docs/history/<feature>/` của tính năng đã tạo ra item, dùng bởi lớp hướng dẫn để tìm CONTEXT.md/plan.md liên quan khi cần\n- `docs/history/p50-workflow-induct/reports/p50-workflow-induct-6.md` — bằng chứng vận hành thật đầy đủ của case-study (lịch sử verb từng lệnh, kèm phát hiện lồng-phiên ở Open Gaps)\n- `docs/routing-handoff-contract.md` — hợp đồng handoff + ranh giới tin cậy\n- `src/runner/main-checkout-lock.mjs` (STR65) — `acquireMainCheckoutLock(dir, {identity, ttlMs, now})`/`releaseMainCheckoutLock(dir)`: khóa tạo-nguyên-tử `wx` + đòi-lại-pid-chết, độc lập với ba khóa anh em (`runner.lock`/`sessions.lock`/`events.lock`, không import chung, xem lineage note ở `src/state/events.mjs`); `identity` nhận số nguyên (pid thật, kiểm sống qua tín hiệu 0) HOẶC chuỗi (danh tính phiên, không kiểm sống được); TỰ-NHẬN-DIỆN: danh tính khóa hiện có trùng đúng danh tính người gọi → luôn ACQUIRED (refresh), bất kể ttlMs/sống-chết — đây là \"chính phiên này tiếp tục\", không phải một chủ cạnh tranh; danh tính KHÁC: mọi writer ghi `ttlMs` của chính nó vào record và người tranh xét record theo `ttlMs` ĐÓ, không bao giờ theo `ttlMs` của mình — số nguyên: pid sống VÀ còn trong ttl; chuỗi: chỉ xét độ mới (không có gì để kiểm sống); record cũ không có `ttlMs` nhận cửa sổ của writer cũ (chuỗi phiên do hook cũ ghi: `HOOK_TTL_MS` 20 s; pid: `DEFAULT_TTL_MS` 3 phút), mọi ttl bị chặn ở trần một run (4 h); nội dung khóa hỏng/không phân tích được → AMBIGUOUS (không bao giờ coi là rảnh hay đang giữ); record có trường `v` (giao thức khóa mới hơn) hoặc marker `.fgos/runtime/locks/<tên khóa>/protocol.json` khác `{writer:1}` (một quyết định marker cho mọi cửa: acquire kiểm TRƯỚC khi ghi và kiểm lại sau acquire, `inspectMainCheckoutLock` kiểm trước nhánh \"không có file\", `forceReclaimAmbiguousLock` kiểm trước mọi sửa, hook và Rust `lock.rs` dùng cùng luật) → HELD với `reason: unsupported-protocol`; record có `v` kể cả khi mang đủ `pid`/`ts` không bao giờ bị dọn/làm mới/release (kể cả closure của một hold cũ và `releaseMainCheckoutLock`), `fgos unlock` từ chối và không bao giờ báo `cleared:true`. Writer tự acquire của checkpoint (`acquiringMainCheckoutWriter`) dùng `allowSelfRecognition: false` để không tái nhập hold của một operation khác cùng pid. Checkpoint `.fgos` (`runOpportunisticMainCheckoutChecks`) chạy trọn add → commit → reset-khi-lỗi trong mutex này: mutex thuộc tầng runner nên checkpoint (tầng kernel) nhận `mainCheckoutWriter` từ caller: caller đã giữ (claim, merge không slot) truyền `heldMainCheckoutWriter(pid)`, caller chỉ giữ merge slot truyền `acquiringMainCheckoutWriter(dir)` (acquire rồi nhả ngay, bị giữ thì bỏ lượt); không có writer thì checkpoint không commit. Manifest layer: infra.\n- `src/util/session-identity.mjs` (STR65; ở `src/runner/` cho tới tsk-49i — dời sang `util/` để `state/store.mjs` không phải import ngược sang `runner/`) — `resolveWriterIdentity(fgosDir, {env, pid, execFile})` → `{id, source}`: ưu tiên `FGOS_SESSION_ID`/`CLAUDE_CODE_SESSION_ID` làm `id` chuỗi; registry `<fgosDir>/sessions.json` chỉ ĐỐI CHIẾU giá trị đó, không bao giờ tự cấp một danh tính — khớp một `row.sessionId` → `source: 'registry'`, không khớp → `source: 'env'` (không có luật khớp theo thư mục hay pid của row, per str46-io-contract). Vắng cả hai biến môi trường (hoặc giá trị sai charset) thì đi ngược tối đa 3 tầng tiến trình cha (shell ra `ps -o ppid=`, dừng sớm ở pid 1 hoặc lỗi `ps`) lấy một pid số làm `id`, `source: 'pid'` — suy đoán tốt-nhất cho terminal tay gõ (xem Open Gaps); `ps` không gọi được ngay ở tầng đầu → `id` lui về pid của chính người gọi, `source: 'unresolved'` thay vì treo/ném lỗi (`unresolved` là nhãn xuất xứ, không phải danh tính vắng mặt — giá trị `id` không đổi, per str46-io-contract). Manifest layer: kernel.\n- `.githooks/pre-commit` (STR65) — hook git-native (không phải verb fgOS, không phải cấu hình riêng công cụ trợ lý nào — xem \"Khóa hoạt động cây chính\" trên cho hợp đồng đầy đủ): giải thư mục gốc worktree bằng `path.resolve(__dirname, '..')` (KHÔNG gọi `git rev-parse --show-toplevel` — biến môi trường `GIT_DIR` mà git tự đặt khi hook chạy TRONG một git worktree làm lời gọi đó trả sai thư mục gốc, xác nhận thật bằng tái tạo có chủ đích trước khi vá); sau các guard `.fgos`/root-file/nhánh `fgw/*`, đọc `.fgos/main-checkout.lock` MỘT lần qua `inspectMainCheckoutLock` (không acquire, không chờ — git đã giữ `index.lock` khi hook chạy): pid trong `FGOS_MAIN_LOCK_HOLDER_PID` khớp holder sống → commit của fgOS, bỏ qua đèn; holder pid số khác còn sống, giao thức khóa lạ, hoặc khóa hỏng → từ chối. Rồi `resolveWriterIdentity()` và đèn hoạt động `src/runner/main-checkout-activity.mjs` (`.fgos/runtime/main-checkout-activity.json`): writer khác trong `windowMs` → từ chối; còn lại ghi đèn cuối hook với `windowMs` = `HOOK_TTL_MS` 20 s (đè được qua `FGOS_MAIN_CHECKOUT_LOCK_TTL_MS`); từ chối → in thông điệp bằng thời gian + trỏ `docs/how-to-parallel-lanes.md`, thoát khác 0.\n- `scripts/install-git-hooks.mjs` (STR65) — wire `core.hooksPath` về `.githooks` khi checkout có git thật (dev clone); vắng git (cài như dependency qua `npm install <github-url>`, không giữ lại git — xem `docs/specs/distribution.md`) thì thoát 0 im lặng, không throw; gọi qua `prepare` lifecycle script của `package.json` — chạy tự động sau `npm install` trên một clone mới, không cần bước cài tay riêng.\n- Test: `test/runner/*` (gồm `test/runner/merge.test.mjs` — unit `classifySource`/`reviewDiff`/`mergeRunnerItem`/`cleanupMergedBranch`; `test/runner/write-queue.test.mjs` — chứng minh serialize thật qua marker enter/exit không xen kẽ; `test/runner/root-affinity.test.mjs` — resolveRoot/claimRoot/steerFrontier, khuôn race 2-tác-nhân đã spike-proven; `test/runner/goal-check.test.mjs` — mới, real-fake-executor) + `test/e2e/runner-loop.test.mjs` (executor giả, repo git tạm, bao gồm 3 kịch bản stage-discovery — dispatch worker thật rồi phán quyết đủ rõ đẩy item sang `planning`, phán quyết chưa đủ rõ đẩy sang `exploring` + đậu chờ người, worker sập thì item đứng yên tại `discovery`/`todo` — cộng các kịch bản stage-clarify/stage-decompose còn lại, nay khẳng định `--once` KHÔNG tự phán ở hai tên stage đó: pass-through, chia-con-chặn-frontier, cần-người + 1 kịch bản S2-pull: `take` người + `fgos-runner --once` song song không giẫm + `return` xanh + kịch bản con fork từ tip nhánh gốc) + `test/e2e/pr-gate.test.mjs` (4 kịch bản thật qua binary + git: runner item full loop review→approve→merge→done, merge conflict thật với tree nguyên vẹn sau abort, pull-door item full loop, reject pull-door giữ commit làm lịch sử) + `test/cli/fgos.test.mjs` (unit CLI cho `take`/`return`/`review`/`approve`/`reject`/`catchup`: frontier-head claim, CAS conflict, dirty-tree/HEAD-chưa-tiến refusal, verify xanh/đỏ, main-never-holds-broken-merge cho cả conflict lẫn verify-fail, legacy degrade, leaf-vs-root branch targeting, integration-drift reason, catch-up sạch/xung-đột-thật/lý-do-không-áp-dụng-được) + `test/state/replay.test.mjs` (fold `claimRole`/`headAtTake`/`headAtReturn`) + `test/state/fsm.test.mjs` (cạnh `blocked→awaiting-approval`) + `test/report/entropy.test.mjs` (entropy thuần) + kịch bản chồng-lấn-thật hai việc song song trong `test/runner/loop.test.mjs` (peak-concurrency counter, không phải suy luận thời gian tường) + `test/runner/worker-log.test.mjs` (mới — create/append, nối-không-đè qua nhiều lần thử, degrade không throw khi field vắng) + `test/runner/frozen-judge.test.mjs` (STR63 — unit `frozenJudgeHits`, mọi rule + exact-path footprint match) + benchmark ngoài suite `docs/history/phase-3-compound-learning/reports/f4-benchmark.md` (F4, real binaries, expected-delta khai trước run); 1380 test toàn suite tính tới STR63 (`cd repo && npm test`, số cũ 637 đã trôi qua nhiều feature trước đó — không phải drift do cell này)"
    }
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-3",
    "githubAnchor": "unheaded-block-3",
    "stableAnchor": "unheaded-block-3",
    "title": "Unheaded block 3",
    "startLine": 27,
    "endLine": 77,
    "textDigest": "853cf58afec64a9d7b507305bfadf959cf0f88ef17e3b90b199a85bf3ed71c43",
    "sample": "- `bin/fgos-runner.mjs` — CLI (--once/--dry-run/--watch/--poll-ms — str7-str8-priority-intent; `--config` bỏ ở RUL93 (the runner loop's worker and the fan-out batch run as one Unit",
    "identityFingerprint": "e893d87fa54e4b018e43829b1af2cfd85d40811e6dfad96ed0054babeac675cf",
    "ancestry": [
      "Added in candidate: Runner Pointers (implementation)",
      "Pointers (implementation)"
    ],
    "text": "- `bin/fgos-runner.mjs` — CLI (--once/--dry-run/--watch/--poll-ms — str7-str8-priority-intent; `--config` bỏ ở RUL93 (the runner loop's worker and the fan-out batch run as one Unit run each)), exit theo phạm trù; nhánh `--watch` đăng ký `SIGINT`/`SIGTERM` lên một `AbortController` chung TRƯỚC khi gọi `runWatch`, tín hiệu thứ hai buộc `process.exit(130)`; hàm `printResult` (dùng chung giữa `--once` và `onCycle` của `--watch`) nay bọc `result` (trừ `exitCode`) qua `wrapEnvelope` (`src/state/envelope.mjs`, cùng hàm `bin/fgos.mjs` dùng) và in JSON một dòng — không `JSON.stringify(..., null, 2)` như `fgos.mjs` — vì `--watch` phát nhiều phong bì nối tiếp theo thời gian (per str46-io-contract, xem RUL61 (kết-cục cuối của `fgos-runner` nay bọc cùng phong bì máy-đọc `fgos.v1` như mọi verb)); exit-code prose ở đầu file trỏ về `src/state/store.mjs`'s `EXIT_CODES` + `src/runner/loop.mjs`'s `EXIT_BUSY` thay vì tự liệt lại bảng\n- `src/runner/loop.mjs` — vòng + startup reap (SKIP claim `human`/`session` — xem \"Gặt-lại lúc khởi động\") + khoá liên-tiến-trình `.fgos/runner.lock` (busy exit 6); NGAY SAU reap, TRƯỚC vòng dispatch: (1) quét mọi item `stage==='discovery' && status==='todo'` (không đọc `item.mode`), dựng worktree tạm + `spawnWorker` với `stage: 'discovery'` cho từng item, đọc khối phán quyết trong output của worker rồi gọi `resolveDiscovery` (`src/intake/discovery.mjs`) với chính verdict đó, truyền `'runner'` — nhánh không có commit nào, hoặc không đọc được verdict, thì item được để nguyên tại chỗ cho lượt sau; (2) đọc lại view tươi rồi quét mọi item ở `stageForStep(domain,'Divide')` (`planning`) CỘNG tên di sản `decompose`, với `status==='todo'`, và gọi `resolvePlan` (`src/intake/plan.mjs`) cho từng item, cùng truyền `'runner'` — không kèm verdict, nên nó chỉ cho đi thẳng khi `plan.md` của item khai mode `tiny`/`small`, còn lại no-op an toàn; cùng lượt chạy có thể chaining cả hai sweep trên một item vừa rời `discovery`; ghi bản outcome dự đoán tại claim + thực tế ở cả hai lối ra cuối (thành đề xuất, hoặc đỗ/dừng) qua `addOutcome` của store; mọi `moveWork` runner tự gọi (claim/propose/park) truyền `role:'runner'`; gọi `runGoalCheck` (từ `goal-check.mjs`, không còn tự triển khai) cho cả proof lúc dispatch lẫn proof lúc gặt-lại; ngay trước khi spawn worker, đọc lại view TƯƠI qua `listWork(dir)` rồi truyền `feedback: {answer: view.gates?.[item.id]?.answer, reason: view.work?.[item.id]?.reason}` vào `spawnWorker` (per worker-execution STR33 / 396d9d9e, xem RUL23 (phản hồi người threading vào prompt worker)); `dispatch.mjs` — prompt/config/spawn (argv-only, spawnSync timeout; caveat grandchild SIGTERM ghi trong doc comment) + `resolveExecutorCommand`/`resolveTierModel` (dùng chung cho mọi lượt spawn worker, kể cả lượt dispatch nghiên-cứu — không còn call site nào cho một lời gọi model phán lồng bên trong engine); `buildPrompt(work, feedback?)` dựng 5 section cố định (Goal, Description, Worktree boundary, Expected proof, Constraints — hợp đồng test pin presence) cộng mục `# Human feedback` TÙY CHỌN khi `feedback.answer`/`feedback.reason` có mặt (nguyên văn, xem RUL23 (phản hồi người threading vào prompt worker)); `description` là `work.description` nguyên văn, degrade \"(không có)\" khi vắng (per discovery-context STR30); `spawnWorker(work, cfg, cwd, opts)` nhận `opts.feedback` truyền xuống `buildPrompt`; `worktree.mjs` — lifecycle + reclaimOrphanedCheckout + `detectTrunk(repoRoot)`/`isMainWorktree(repoRoot)` (dời từ `merge.mjs` sang đây per tsk-49i — cả hai là danh tính worktree/nhánh, không mang ngữ nghĩa nội dung merge; dời đi cũng cắt luôn import vòng `merge.mjs` ↔ `worktree.mjs`) + `createBranchRef(repoRoot, id, opts)` (tạo `fgw/<id>` chỉ-là-ref, không worktree, idempotent) + `createWorktree`'s `opts.baseRef` (fork worktree mới từ một ref chỉ định thay vì HEAD hiện tại — dùng cho con fork từ tip nhánh gốc); `recovery.mjs` — 8 lớp; `anti-loop.mjs` — `visitCount` (lifetime, dùng cho outcome/metric) + `visitsSinceLastHumanEvent(events, id)` (ngân sách CỔNG, per-item, reset trên `role==='human'` mang `answer` hoặc `reason`, xem RUL29 (cổng chống-lặp reset theo can thiệp người cuối cùng của chính việc)) + breaker; `loop.mjs`'s gate (cả nhánh dry-run đơn lẻ lẫn nhánh lọc `overLimit` của batch dispatch dưới) gọi `visitsSinceLastHumanEvent`, không còn `visitCount`, để quyết park; `createMissBreaker` nay PER-ITEM (Map theo id, `consecutiveMissesFor(itemId)`; `consecutiveMisses` getter cũ giữ nguyên qua một khóa sentinel tương thích ngược, per fan-out-parallel-5). `runOnce`'s vòng dispatch nay là pool-loop batch (cell fan-out-parallel-8): đọc TOÀN BỘ `readyWork(dir)`, lọc qua `root-affinity.mjs`'s `steerFrontier`, nhóm theo gốc và cắt còn tối đa `parallel.maxRoots × parallel.maxLeavesPerRoot` (đọc từ `.fgos/config.json`'s `runner` section, mặc định 4×4 khi vắng khối `parallel`), claim từng việc bên trong callback của `write-queue.mjs`'s `enqueue` (bắt buộc — giải-và-ghi phải cùng một giao dịch hàng đợi để giữ đúng chứng minh chống-tranh-giành), rồi dispatch cả mẻ đồng thời qua `Promise.allSettled`; mỗi việc claim xong xác định LEAF hay ROOT qua `state/frontier.mjs`'s `resolveRoot(view, id)` — leaf: `createBranchRef(repoRoot, rootId, {baseRef:'main'})` rồi `createWorktree(repoRoot, item.id, {worktreeDir, baseRef: branchNameFor(rootId)})`; root: `createWorktree` không đổi, tự nhiên tái dùng nhánh đã có nếu tồn tại. Mẻ xong → đọc lại `readyWork` tươi, lặp tới khi không còn việc đang chạy VÀ không còn việc sẵn-sàng; `runOnce` trả `{outcome, dispatched, parked, reap, exitCode}` thay vì kết quả một item\n- `src/runner/loop.mjs`'s `parseDiscoveredBlocks(output)` + `captureDiscoveredWork(...)` — kênh báo việc-phát-hiện (xem \"Báo việc-phát-hiện từ trợ lý\" trên, RUL45 (báo việc-phát-hiện của trợ lý: đúng một lần mỗi lượt, fail-safe, có trần + chống trùng)): tách mọi khối lồng `fgos-discovered` (JSON, chỉ cần `title` khác rỗng) khỏi output đã thu của trợ lý, fail-safe (thân JSON hỏng/thiếu `title`/không phải object đều bị bỏ qua, không throw); gọi đúng MỘT LẦN trong `finally` bọc vòng thử lại của `dispatchClaimedItem`, tại kết cục cuối (không gọi lại giữa các lần thử nội bộ); mỗi khối hợp lệ đi qua `write-queue.mjs`'s `enqueue` (cùng cửa ghi tuần tự) — bên trong đó: cắt còn tối đa `DISCOVERY_CAP` (=20) khối trước khi lặp (phần dư log rồi bỏ), rồi với mỗi khối: quét view hiện hành tìm item có `discoveredFrom` khớp item đang thi công VÀ tên khớp sau khi chuẩn hoá (trim + hạ chữ) — khớp thì log rồi bỏ qua (không tạo); không khớp mới gọi `generateId`/`classify`/`addWork` (đóng dấu `discoveredFrom: item.id`, và stage vào-vòng của domain — `discovery` cho `coding`); `dispatch.mjs`'s văn bản prompt worker mô tả kênh khối lồng này cho trợ lý (nguyên tắc \"chỉ báo, không tự ghi\" — trợ lý vẫn không bao giờ được gọi `fgos`/đụng `.fgos/`); `sanitizeTitleForLog(title)` (S11, review-fix P3) — gộp khoảng trắng/xuống dòng + cắt 120 ký tự (kèm dấu `…` khi cắt), gọi tại đúng hai điểm `log` có nội suy `block.title` bên trong `captureDiscoveredWork`; KHÔNG áp dụng lên trường `title` truyền vào `addWork`\n- `src/runner/goal-check.mjs` — hàm goal-check dùng chung DUY NHẤT (`runGoalCheck(item, cwd, timeoutMs)`): chạy `item.verify` qua shell tại `cwd`, phán chỉ bằng exit status — trích xuất từ `loop.mjs` (stage-decompose S2-pull) để cả vòng tự hành LẪN cửa pull `fgos return` (spec Work-State) gọi đúng một bản logic, không bao giờ hai bản song song\n- `src/runner/frozen-judge.mjs` (STR63, domain layer thuần — không fs/git) — `FROZEN_JUDGE_PATTERNS` (bê nguyên từ frozen-judge của bee, bỏ mục `.bee/config.json` không áp dụng) + `frozenJudgeHits(changedFiles, footprint)`: chấm file đã đổi khớp nhóm nhạy cảm (test/CI/lockfile/manifest) NGOÀI `footprint` đã khai — khớp exact-path, không prefix/glob. `bin/fgos.mjs`'s `changedFilesSince(cwd, from, to)` (`git diff --name-only`, cạnh `commitsSince`) cấp input; gọi trong `return` khi `check.passed`, xem RUL60 (`return` mang thêm khuyến nghị frozen-judge — advisory, không bao giờ chặn)\n- `src/intake/discovery.mjs` — xem Pointers spec Work-State (module dùng chung giữa runner và verb `discover`); verb `discover` (phiên sống) truyền `'session'`; verdict đủ rõ `moveStage` tới `planning` (bỏ qua `exploring`), verdict chưa đủ rõ `moveStage` tới `exploring` RỒI đậu `awaiting-human` mang câu hỏi (hai cửa ghi rời nhau — `stage` và `status` không giẫm nhau); một đề xuất `verify` còn phải qua một vòng kiểm cú pháp độc lập trước khi được ghi, bất đồng thì cũng đậu chờ người. `judgeDiscovery` (lời gọi phán lồng cũ) đã NGHỈ HƯU: engine luôn cần một verdict do người gọi đưa vào — worker của quét nghiên-cứu, hay phiên sống gọi `fgos discover --verdict` — thiếu verdict thì role `runner` no-op an toàn, role khác báo lỗi rõ ràng\n- `src/intake/plan.mjs` (đổi tên từ `decompose.mjs`) — xem Pointers spec Work-State (module dùng chung giữa runner và verb `plan` khi item ở stage `planning`, hoặc còn ở tên di sản `decompose`); verb `plan` (phiên sống) truyền `'session'`; `resolvePlan` cũng là chỗ nhả claim `doing→todo` khi gốc sang `executing` (claim-lock §3b)\n- `src/runner/prompt-templates/worker-prompt-discovery.txt` — mẫu prompt riêng của lượt dispatch nghiên-cứu, chọn bởi luật `{domain:'coding', stage:'discovery'}` trong `selectTemplate` (`src/runner/prompt-templates.mjs`); mọi lời gọi không truyền `stage` giữ nguyên hành vi cũ, không bị luật này chen trước. (Helper thử-lại `src/intake/judge-executor.mjs` của bản trước đã bị xoá cùng lúc `judgeDiscovery`/`judgeDecompose` nghỉ hưu — không còn lời gọi model phán lồng nào để thử lại.)\n- `packages/observe/rust/src/metrics_cli/entropy.rs` — handler hiện hành cho `fgos metrics entropy`, tính score/parts và delta từ snapshot; `src/report/entropy.mjs` và CLI `check` cũ đã bị xoá.\n- `.fgos/config.json`'s `runner` section (tsk-5vf; tsk-5hv xoá hẳn fallback về file flat legacy cũ — đây giờ là nguồn config DUY NHẤT, `fgos setup` là verb thực hiện move thật) — config committed (executor template + `modelPolicies.claude` nano/haiku, standard/sonnet, frontier/opus [tsk-5tm, thay `models` phẳng cũ; 6-tier vocab từ 2026-09-17] + timeoutMs); `executor.args` mang `--permission-mode acceptEdits`, không còn quyền git — runner commit thay worker (0052) (quyền TỐI THIỂU, xem RUL6 (consumer rẽ nhánh theo mã thoát phạm trù, không bao giờ theo thông điệp)); khối `parallel` TÙY CHỌN — `maxRoots`/`maxLeavesPerRoot` (Data Dictionary #6, mặc định trong-code 4/4 khi khối vắng mặt, mọi config cũ vẫn chạy không cần sửa); `src/runner/dispatch.mjs`'s `ensureRunnerConfigForDir(dir)` — shared-file-aware: tại đường MẶC ĐỊNH (không `--config`) vắng file, gọi `detectAssistantCli` (quét PATH thuần, không spawn — `KNOWN_ASSISTANT_CLI_NAMES`) rồi viết `DEFAULT_RUNNER_CONFIG` với executor từ `SUPPORTED_EXECUTOR_TEMPLATES[detected]` khi trợ lý dò được có mẫu đã kiểm chứng (hôm nay chỉ `claude`, y hệt `DEFAULT_RUNNER_CONFIG.executor`), hoặc executor placeholder tự-báo-lỗi khi không (RUL48b) — rồi mới nạp, kèm một dòng thông báo tên file + executor được chọn (RUL48 (cấu hình runner tự sinh tại đường mặc định khi vắng mặt — không bao giờ đòi người tạo tay trước)); `bin/fgos.mjs`'s verb `discover` và `bin/fgos-runner.mjs`'s vòng chính đều gọi `ensureRunnerConfigForDir` cho nhánh đường mặc định, `loadRunnerConfig` thẳng cho nhánh `--config` tường minh của `discover` (`fgos-runner` chỉ còn đường mặc định, RUL93 (the runner loop's worker and the fan-out batch run as one Unit run each)); đọc qua `mergeWithGlobalConfig` trước khi tách phần `runner` (project luôn thắng `~/.fgos/config.json` theo key, tsk-5vf)\n- `src/runner/dispatch/write-scope.mjs` — matcher duy nhất của phạm vi ghi (RUL84 (one write-scope matcher)): chuẩn hoá `writes`, nở `runner.generatedPaths`, `matchesWriteScope`/`partitionPaths` cho runner commit, settlement và Workflow.\n- `src/workflow/units-source.mjs` — `translateUnitsToWorkflow`: dịch units file của `fgos workflow start --units` thành Workflow tạm, mỗi Unit một step (RUL89 (workflow start --units)).\n- `src/runner/execution/account-pin.mjs` — ghim account (RUL91 (a person may pin the provider account of a unit run)): `resolveAccountPin` (bind() gọi), `runnerConfigForBinding` (inventory thu hẹp cho dispatch), `assertPinnedAccountsUsable` (quarantine trước unit run/resume), `capacityProviderOf`.\n- `src/runner/execution/partial-writes.mjs` — `worktreeSnapshot`/`writesSince`: baseline của seat ghi và phép so sau provider-limit (RUL92 (a writing seat is not run again over its own partial writes)).\n- `src/runner/execution/unit-sync.mjs` — sync base của Unit (RUL97 (a Unit may sync a base ref first)): `seedSync` (resolve ref trước khi unit run tồn tại), `runPendingSync`, `assertSyncResumable`, `syncBrief`, `commitRoundWithSync`; git tin cậy nằm ở `commit-unit-work.mjs` (`startSyncMerge`/`finishSyncMerge`/`syncMergeState`).\n- `src/runner/work-dispatch.mjs` — cửa của tầng Work vào runUnit (RUL93 (the runner loop's worker and the fan-out batch run as one Unit run each)): `workUnitFor`/`workUnitIdFor` (Unit từ Work item), `spawnWorker` (chạy Unit, ánh xạ outcome sang recovery matrix, cờ `resumable`); `src/runner/fanout-batch.mjs` — fan-out batch trên runUnit.\n- `src/runner/operation-choice.mjs` — driver của Work (RUL94 (a Work driver step runs as a Unit)): `chooseStageOperation`, `executeDriverOperationChoice` chạy operation qua `runUnit`, walker `findLatestAssignmentRunResult` đọc verdict ở cả hai layout và so plan theo `rel` + digest; `digestPinnedInputs` (`src/runner/dispatch/assignment-runner.mjs`) băm pin lúc launch.\n- `src/runner/dispatch/run-timeout.mjs` — sàn/trần thời gian của một lượt chạy (RUL96 (one run may take its own timeout)): `RUN_TIMEOUT_MIN_MS`, `RUN_TIMEOUT_MAX_MS`, `runTimeoutProblem`; leaf không import, đọc bởi `config.mjs` (`parseRunTimeout`, `assertRunTimeoutMs`), reaper confinement, khoá dispatch và `src/workflow/definition.mjs`.\n- `src/runner/write-queue.mjs` — cửa ghi tuần tự thuần (không import fs/store): `createWriteQueue({onCommit})`'s `enqueue(fn)` chạy đúng MỘT giao dịch async trọn vẹn tại một thời điểm, theo thứ tự nộp FIFO, bất kể số điểm `await` bên trong; một giao dịch throw/reject không chặn hàng đợi cho giao dịch sau; hiện thực in-process của \"cửa ghi\"; `onCommit` (TÙY CHỌN, str7-str8-priority-intent) — callback gọi đúng một lần trên MỖI giao dịch thành công (không bao giờ trên giao dịch reject), tự bọc try/catch riêng nên một callback lỗi không bao giờ làm gãy hàng đợi; `createWriteQueue` không tham số giữ hành vi y hệt trước khi `onCommit` tồn tại\n- `src/runner/loop.mjs`'s `runWatch(options)` (str7-str8-priority-intent) — vòng cầm-giao bền, xem \"Vòng cầm-giao bền (--watch)\" trên; ghép `runOnce` KHÔNG ĐỔI làm hộp đen, gọi lặp lại; MỘT `createWriteQueue({onCommit})` + MỘT `createMissBreaker` được tạo trước vòng lặp và dùng CHUNG xuyên mọi lượt (không tạo lại mỗi lượt — điểm đúng-sai cốt lõi cho cầu dao tích lũy per RUL53 (`--watch` — vòng cầm-giao bền, dừng chỉ khi có tín hiệu tường minh)); một cờ đóng (closure boolean) do `onCommit` set, kiểm tra SAU khi mỗi lượt `runOnce` trả về (không phải một listener chờ sự kiện — mọi giao dịch cửa-ghi trong sản phẩm đều nằm TRONG một lượt `runOnce` đã await xong, nên một thiết kế lắng-nghe-sau sẽ không bao giờ bắt được tín hiệu, đã bị loại per quyết định d3445024); lượt không ghi gì chờ qua `node:timers/promises`'s `setTimeout(ms, null, {signal})` — hủy được ngay khi `AbortSignal` bắn, không rò timer/listener vì không có listener nào để rò; một `runOnce` throw bị bọc try/catch, báo qua `options.onCycle`, KHÔNG BAO GIỜ thoát ra ngoài làm gãy vòng lặp\n- `src/state/frontier.mjs` — `resolveRoot(view, id)` (đi ngược `parent` tới đỉnh, có bảo vệ chu trình); ở `state/` chứ không ở `runner/root-affinity.mjs` như trước (tsk-49i) vì chính `state/` cũng cần cùng phép đi ngược đó, và việc import ngược sang `runner/` là một trong các cạnh làm hai thư mục phụ thuộc vòng\n- `src/runner/root-affinity.mjs` — quyền-sở-hữu-gốc thuần (không fs/child_process): `createOwnershipStore` (Map rootId→identity, sống trong bộ nhớ một `runOnce`, không bao giờ ghi bền); `claimRoot(store, view, id, ownerIdentity)` — quyết định THUẦN (không tự ghi), người gọi áp dụng bên trong `write-queue`; `steerFrontier(readyItems, view, store, ownerIdentity)` — lọc tập sẵn-sàng còn lại việc mà gốc chưa-chủ hoặc thuộc về chính danh tính này\n- `src/state/store.mjs` `readRawEvents` — accessor chỉ-đọc cho anti-loop (decision 14396a5c); `addOutcome` — cửa ghi outcome (mẫu `addDecision`); `moveStage`/`addDiscovery` — cửa ghi đổi-stage/bản-ghi-discovery (xem spec Work-State); `moveWork` gắn `role` post-transition + compose bài học câu-6 khi `to==='done'` (xem Pointers spec Work-State); `moveWork` cũng nhận `headAtTake` cộng-thêm tùy chọn — chỉ cửa pull `take` truyền, runner không bao giờ truyền nên không đổi hành vi claim của chính nó; cùng khuôn, nhận `headAtReturn` — chỉ `return` truyền (per pr-lifecycle)\n- `bin/fgos.mjs` verb `take`/`return` — cửa pull giao–nhận việc ngoài vòng runner, `return` gọi thẳng `runGoalCheck` ở trên (xem spec Work-State \"Cửa pull giao–nhận việc\" cho hợp đồng đầy đủ); `take` nay CŨNG chấp nhận một item `blocked` mang nhánh `fgw/<id>` sống (`branchExists`, `worktree.mjs`) qua cạnh `blocked→doing`, ghi `branchHeadAtTake` thay vì `headAtTake`; `return` kiểm `item.branchHeadAtTake` TRƯỚC MỌI guard main-based — nguồn-nhánh verify trong worktree tạm detached tại SHA nhánh (`git worktree add --detach`, dọn trong `finally`), ghi `branchHeadAtReturn`, không bao giờ `headAtReturn` (RUL30 (cửa người-hoàn-tất một đề xuất nguồn-nhánh bị đỗ — mở rộng take/return, không verb mới), xem spec Work-State \"Cửa pull giao–nhận việc\")\n- `src/runner/merge.mjs` — cỗ máy cơ chế của cổng duyệt (per pr-lifecycle / 1359ab5e), tách khỏi CLI cùng khuôn `worktree.mjs`/`goal-check.mjs`: `classifySource` (runner/pull/legacy — nhánh sống qua `worktree.mjs`'s `branchExists`, hay cặp `headAtTake`+`headAtReturn`, hay không cả hai); `reviewDiff(repoRoot, item, opts)` (diff theo nguồn + cảnh báo degrade trung thực; `opts.trunk` TÙY CHỌN mặc định `'main'`, per fan-out-parallel — cây nhánh tích hợp truyền nhánh của gốc cho một đề xuất con); `mergeRunnerItem` (`git merge --no-commit --no-ff` → verify trên staged tree qua `runGoalCheck` → renew/check lock ownership synchronously → commit-hoặc-abort, spike-proven; mất lock ở bước kiểm tra cuối trả `lock-lost-mid-merge` và KHÔNG abort merge state vì tree đó có thể thuộc chủ lock mới; target-agnostic — người gọi checkout đúng nhánh đích trước, cây chính cho gốc hoặc nhánh của gốc cho con); `cleanupMergedBranch` (dọn nhánh/worktree sau merge sạch, best-effort); `changedFiles(repoRoot, item, opts)` (STR13 Slice 3) — mirror hóa cơ chế phân giải trunk/nhánh của `reviewDiff` nhưng chạy `git diff --name-only` thay vì `git diff`, trả mảng path đã đổi; nguồn khác `runner` trả mảng rỗng (Iron Law approve-side chỉ soi đề xuất nguồn runner); dùng bởi `approve` để nạp `filesChanged` cho `classifyIronLaw`. KHÔNG BAO GIỜ ghi `.fgos/` trực tiếp — mọi chuyển trạng thái (`awaiting-approval→done`/`awaiting-approval→blocked`) vẫn ở `bin/fgos.mjs` qua `store.mjs`. Manifest layer (`docs/architecture-manifest.json`): infra\n- `src/verbs/merge/*.mjs` (tầng `use-case`, tsk-49i) — logic nghiệp vụ của cả 7 verb cụm merge: `merge.mjs` (`mergeList`/`mergeNext`), `approve.mjs`, `review.mjs`, `sync-root.mjs`, `catchup.mjs`, `reject.mjs`, `promote-to-component.mjs`. `bin/fgos.mjs` cho 7 verb này chỉ còn parse args, tính `repoRoot` theo chính sách RIÊNG của từng verb (`--trust-dir` gate cho approve/sync-root/promote-to-component; `path.dirname(dir)` vô điều kiện cho catchup, tsk-5vl; `process.cwd` thô cho drift của `merge list`/`merge next`), rồi gọi một hàm use-case. `merge next` gọi thẳng `approveUseCase`/`syncRootUseCase` (same-rank, hợp lệ) thay cho đệ quy `runVerb` cũ, và option của hai verb đó được `parseMergeClusterOptions` dựng MỘT lần rồi truyền nguyên khối — thay cho việc forward raw `flags`\n- `bin/fgos.mjs` verb `review`/`approve`/`reject` — cổng duyệt PR nội bộ, bề mặt CLI của cổng duyệt một-cửa (xem \"Cổng duyệt PR nội bộ\" trên cho hợp đồng đầy đủ); `review`/`approve` nay leaf-vs-root-aware qua `state/frontier.mjs`'s `resolveRoot(view, id)`: một đề xuất con gọi `reviewDiff(..., {trunk: branchNameFor(rootId)})` và `approve` nhập vào một worktree ephemeral checkout trên `fgw/<rootId>` (không phải cây chính của người vận hành) rồi dọn nhánh con đó TỪ CHÍNH worktree ephemeral đó (`git branch -d` chỉ thành công từ checkout đã thật sự chứa merge); một đề xuất gốc từng có con (`view.work` có item nào `parent===id`) mà nhập-vào-cây-chính gãy mang lý do `integration-drift` riêng cộng dấu vết `main@<sha hiện tại>` trong chi tiết friction, thay vì lý do gãy-nhập thường; gốc không con giữ nguyên hành vi/lý do cũ, không đổi\n- `src/runner/github-adapter.mjs` (github-adapter, layer infra) — vận chuyển GitHub thuần: `createGitHubPR`/`viewGitHubPRStatus`/`mergeGitHubPR` shell ra `gh` CLI thật (không gọi thẳng HTTP API), `classifyGhFailure` (thuần, không tiến trình con) ánh xạ một lời gọi `gh` gãy sang một lý do — khớp trên nội dung stderr (vd `HTTP 401`/`Bad credentials`), KHÔNG dựa vào mã thoát tài liệu hoá (mã 4) vì bằng chứng thật không khớp tài liệu; `viewGitHubPRStatus` chờ-lặp (poll) khi trường sẵn-sàng-merge của GitHub trả về \"chưa rõ\" (tính bất đồng bộ phía GitHub), có trần thời gian, không bao giờ treo vĩnh viễn — trần này truyền được qua `opts.pollTimeoutMs`, và `review --github --pr` (github-adapter) gọi với `pollTimeoutMs: 0` để buộc đúng MỘT lời gọi `gh` vì phép hỏi thăm đó chỉ cần `closed`/`mergedAt`, không liên quan tới trường sẵn-sàng-merge đang chờ-lặp. KHÔNG import `merge.mjs`/`bin/fgos.mjs`, không tự chạy verify cục bộ nào (verify vẫn ở cây làm việc cục bộ).\n- `bin/fgos.mjs` verb `review --github [--pr <n>]` / `approve --github --pr <n>` — bề mặt CLI của vận chuyển GitHub (xem \"Cổng duyệt qua GitHub\" trên cho hợp đồng đầy đủ): đọc biến môi trường ghi đè lệnh `gh` (chỉ dùng khi kiểm thử tiêm một `gh` giả qua tiến trình con thật; sản xuất luôn dùng `gh` thật trên PATH); thăm dò nhánh đã có upstream chưa bằng một tiến trình con git thuần (không dùng lại helper ném lỗi sẵn có của file — helper đó đúng cho các bước git khác nhưng sai ngữ nghĩa cho một phép thăm dò vốn kỳ vọng gãy ở lần đầu); nhánh `--github` của `approve` chạy SAU phán Iron Law (chặn CHUNG cho mọi nguồn `runner`, hoisted lên trước cả nhánh `--github` — review-20260718-self-improve-loop f01, sửa một lỗ hổng bỏ-qua-gate thật) nhưng vẫn TRƯỚC (không đi qua) phép kiểm cây-sạch của đường cục bộ — `isMainTreeClean` chỉ có ý nghĩa cho một merge cục bộ làm bẩn cây, một merge phía GitHub không đụng cây cục bộ nên không cần; nhánh `--pr` của `review --github` (github-adapter) chèn NGAY SAU guard nguồn `runner` sẵn có, TRƯỚC bước đẩy-nhánh-rồi-mở-PR, nên áp dụng cho MỌI lời gọi `--github` bất kể có `--pr` hay không.\n- `bin/fgos.mjs` verb `catchup <id>` — đồng bộ lại một việc `blocked` (xem \"Đồng bộ lại một việc đỗ (catch-up)\" trên): tiền điều kiện chấp nhận lý do đỗ ∈ {`merge-conflict`, `verify-fail-post-merge`, `verify-timeout-post-merge`, `integration-drift`, `merge-failed-unclassified`, `merge-blocked-other-item`, `lock-lost-mid-merge`, `main-checkout-dirty-mid-merge`} (`main-checkout-dirty-mid-merge`: cổng duyệt gốc→`main` kiểm cây sạch hai lần — trước khi mở worktree CAS, và lại lần nữa dưới `main-checkout.lock` ngay trước `update-ref`, đóng khe hở giữa hai lần đó; lần hai dính bẩn thì không `update-ref`/không đồng bộ cây, trả `blocked` với lý do này, cùng hình dạng \"chưa chạm gì, thử lại được\" như `lock-lost-mid-merge`) (tsk-18a một lần `git merge --no-commit --no-ff` gãy mà KHÔNG tạo `MERGE_HEAD` — không phải xung đột văn bản thật — nên catchup coi là ứng viên thử lại tốt nhất, vì lần gãy này rất có thể chỉ do điều kiện nhất thời; tsk-4hj `merge-blocked-other-item` — `MERGE_HEAD` đã có sẵn TRƯỚC lần merge này, thuộc về một việc KHÁC đang nhập dở, cũng là ứng viên thử lại tốt vì việc kia rồi sẽ xong hoặc bị hủy) và nhánh riêng của việc còn tồn tại (`branchExists`); đích = `branchNameFor(resolveRoot(view,id))` nếu là con, `'main'` nếu là gốc/độc lập; mở worktree ephemeral trên chính nhánh của việc, `git merge-base --is-ancestor <đích> HEAD` TRƯỚC khi nhập → nhánh đã chứa đích rồi (exit 0) → bỏ hẳn merge lẫn commit (merge sẽ là no-op, `git commit` sau đó chết vì \"nothing to commit\" và việc kẹt `blocked` vĩnh viễn), vẫn chạy `runGoalCheck` thật trên cây hiện có → đỏ → giữ nguyên `blocked`, KHÔNG gọi `git merge --abort` (không có merge nào đang chạy) → xanh → `moveWork(..., to:'awaiting-approval')` với `outcome: 'already-caught-up'`, không tạo commit nào; chưa chứa đích (exit 1) → `git merge --no-commit --no-ff <đích>` → xung đột thật → `git merge --abort` + giữ nguyên `blocked`; sạch → `runGoalCheck` trên cây đã stage TRƯỚC khi commit → đỏ → `git merge --abort` + giữ nguyên `blocked`; xanh → commit rồi `moveWork(..., to:'awaiting-approval', expectedStatus:'blocked')` — cạnh, không `reason`, không qua `doing` (spike `.bee/spikes/fan-out-parallel/catchup-real-conflict-probe.sh` chứng minh trước khi build cell); một sự-kiện merge THỰC HIỆN TRỰC TIẾP trong verb này (không gọi `mergeRunnerItem` — hướng nhập của catch-up ngược với `mergeRunnerItem`, đích nhập VÀO nhánh của việc chứ không phải nhánh của việc nhập vào đích)\n- `src/evolve/candidates.mjs` đã bị xoá; CLI hiện hành không có verb `evolve`, và `rankCandidates` chỉ còn được nhắc trong comment của entrypoint.\n- `bin/fgos.mjs` verb `evolve` — Added in candidate: former CLI contract, removed in `120af6b3d`; current CLI rejects `evolve` (`bin/fgos.mjs:4415`). Historical description of Gate A (xem \"Gate A — xếp hạng candidate, bắc cầu sang việc thật (evolve)\" trên cho hợp đồng đầy đủ): `evolve`/`evolve --pick <id>` hai bước đọc-thuần, KHÔNG BAO GIỜ stdin tương tác — không `--pick` thì liệt kê, `--pick <id>` thì in bản ghi friction đầy đủ của đúng id đó, tái dùng formatter friction sẵn có của `check` (`formatFrictionSection`, không formatter mới); `evolve --submit <id>` (STR13 Slice 3) soạn mô tả từ candidate rồi gọi `submitWork` (cùng cửa `fgos submit` dùng) — hành động ghi duy nhất của bề mặt này. Đọc view qua `listWork(dir)` DUY NHẤT — không bao giờ `rebuild`/`refreshView`/`initStore`.\n- `src/intake/risk-keywords.mjs` — nguồn duy nhất của `HEAVY_KEYWORDS` (self-improve loop STR13 Slice 2): 34 từ khóa (21 gốc chuyển từ `classify.mjs` + 13 thêm, nhóm hệ thống ngoài/bỏ kiểm tra/kiểm toán). Manifest layer: kernel (tầng sâu nhất — `classify.mjs` tầng use-case và `iron-law.mjs` tầng domain đều import hợp lệ từ đây; `iron-law.mjs` KHÔNG BAO GIỜ import thẳng từ `classify.mjs` — chiều ngược, vi phạm luật một-chiều-xuống của `architecture.test.mjs`).\n- `src/evolve/iron-law.mjs` — phán quyết Iron Law (self-improve loop STR13 Slice 2, xem \"Iron Law — phân loại rủi ro của một candidate fix\" trên cho hợp đồng đầy đủ): thuần (`classifyIronLaw({filesChanged, description})`), không fs/Date/network, import `HEAVY_KEYWORDS` từ `risk-keywords.mjs`. Manifest layer: domain. Call site: ba chỗ trong `bin/fgos.mjs`, tất cả nguồn `runner` và tất cả chỉ ở ranh giới trunk (per `0032`) — `approve` (ngay trước bước kiểm cây sạch, STR13 Slice 3), pre-check thuần của `merge next`, và `sync-root`. Ba bản gọi giữ nguyên hình dạng lặp có chủ đích: `approve`/`merge next` phân biệt bằng `resolveRoot`, `sync-root` bằng `!item.parent` (RUL37 (Iron Law hỏi ở đúng một ranh giới — trunk — cho mọi đề xuất nguồn runner tới đó)).\n- `src/runner/worker-log.mjs` — cửa ghi DUY NHẤT cho bản ghi output cục bộ (`.fgos/logs/<id>.log`, per worker-dispatch-log) — tách khỏi `store.mjs` vì đây là văn bản tự do (output trợ lý), khác nhật ký sự kiện có cấu trúc của `store.mjs`; `appendWorkerLog(dir, workId, entry)` nối thêm một khối, không bao giờ đè; field vắng mặt (vd không tier/model/output khi lỗi không phải của trợ lý) render mà không throw. `loop.mjs`'s `dispatchClaimedItem` gọi nó ở hai điểm: ngay sau trợ lý chạy xong (trước goal-check — bắt cả đề xuất lẫn chấm-trượt), và trong nhánh bắt lỗi mang `errorClass` (quá-giờ/hỏng-spawn/hỏng-worktree). Thư mục `.fgos/logs/` được git-ignore (không bao giờ vào cây committed) — khác `.fgos/events.jsonl` (committed, là truth) và giống `.fgos/state.json` (view cục bộ). `store.mjs`'s cửa ghi duy nhất (`events.jsonl`+`state.json`) không đổi phạm vi — bản ghi output là một cửa RIÊNG, không đi qua `moveWork`/`appendEvent`. Manifest layer (`docs/architecture-manifest.json`): infra.\n- `domains/coding/AGENTS.md`'s `## fgOS Workflow` section — điểm vào của lớp hướng dẫn (P50): trỏ một phiên mới mở tới `.claude/skills/fgos-routing/SKILL.md`\n- `.claude/skills/fgos-routing/SKILL.md` + `.agents/skills/fgos-routing/SKILL.md` (mirror byte-identical) — entry skill, đọc `stage` của item rồi trỏ tới đúng skill giai đoạn kế tiếp\n- `.claude/skills/fgos-coding-discovering/SKILL.md` + `.agents/` mirror — skill `nghiên-cứu` (stage `discovery`, pha máy-một-mình)\n- `.claude/skills/fgos-coding-exploring/SKILL.md` + `.agents/` mirror — skill `làm-rõ` (stage `exploring`, pha máy+người)\n- `.claude/skills/fgos-coding-planning/SKILL.md` + `.agents/` mirror — skill `chia-việc` (nửa đầu stage `planning`; cũng là skill mà tên stage di sản `decompose` trỏ tới)\n- `.claude/skills/fgos-coding-validating/SKILL.md` + `.agents/` mirror — skill `thẩm-định` (nửa cuối stage `planning`, gác cạnh `planning→executing`) — KHÔNG có ô riêng nào trong bảng stage→skill: nó chạy như pha thứ hai của chính `fgos-coding-planning`\n- `.claude/skills/fgos-coding-implement/SKILL.md` + `.agents/` mirror — skill `thi-công` (stage `executing`, domain `coding` — str89-fgos-domain-skills)\n- `src/state/domain-registry.mjs` + Workflow của domain (`steps[].skill`, `skillForStep(domain, step)`) (str89-fgos-domain-skills) — skill ứng với mỗi bước nằm trong Workflow, xem spec Work-State \"Mô hình domain\"\n- `src/state/work.mjs` field `docsRef` (optional, xem spec Work-State Data Dictionary #23) — con trỏ tới `docs/history/<feature>/` của tính năng đã tạo ra item, dùng bởi lớp hướng dẫn để tìm CONTEXT.md/plan.md liên quan khi cần\n- `docs/history/p50-workflow-induct/reports/p50-workflow-induct-6.md` — bằng chứng vận hành thật đầy đủ của case-study (lịch sử verb từng lệnh, kèm phát hiện lồng-phiên ở Open Gaps)\n- `docs/routing-handoff-contract.md` — hợp đồng handoff + ranh giới tin cậy\n- `src/runner/main-checkout-lock.mjs` (STR65) — `acquireMainCheckoutLock(dir, {identity, ttlMs, now})`/`releaseMainCheckoutLock(dir)`: khóa tạo-nguyên-tử `wx` + đòi-lại-pid-chết, độc lập với ba khóa anh em (`runner.lock`/`sessions.lock`/`events.lock`, không import chung, xem lineage note ở `src/state/events.mjs`); `identity` nhận số nguyên (pid thật, kiểm sống qua tín hiệu 0) HOẶC chuỗi (danh tính phiên, không kiểm sống được); TỰ-NHẬN-DIỆN: danh tính khóa hiện có trùng đúng danh tính người gọi → luôn ACQUIRED (refresh), bất kể ttlMs/sống-chết — đây là \"chính phiên này tiếp tục\", không phải một chủ cạnh tranh; danh tính KHÁC: mọi writer ghi `ttlMs` của chính nó vào record và người tranh xét record theo `ttlMs` ĐÓ, không bao giờ theo `ttlMs` của mình — số nguyên: pid sống VÀ còn trong ttl; chuỗi: chỉ xét độ mới (không có gì để kiểm sống); record cũ không có `ttlMs` nhận cửa sổ của writer cũ (chuỗi phiên do hook cũ ghi: `HOOK_TTL_MS` 20 s; pid: `DEFAULT_TTL_MS` 3 phút), mọi ttl bị chặn ở trần một run (4 h); nội dung khóa hỏng/không phân tích được → AMBIGUOUS (không bao giờ coi là rảnh hay đang giữ); record có trường `v` (giao thức khóa mới hơn) hoặc marker `.fgos/runtime/locks/<tên khóa>/protocol.json` khác `{writer:1}` (một quyết định marker cho mọi cửa: acquire kiểm TRƯỚC khi ghi và kiểm lại sau acquire, `inspectMainCheckoutLock` kiểm trước nhánh \"không có file\", `forceReclaimAmbiguousLock` kiểm trước mọi sửa, hook và Rust `lock.rs` dùng cùng luật) → HELD với `reason: unsupported-protocol`; record có `v` kể cả khi mang đủ `pid`/`ts` không bao giờ bị dọn/làm mới/release (kể cả closure của một hold cũ và `releaseMainCheckoutLock`), `fgos unlock` từ chối và không bao giờ báo `cleared:true`. Writer tự acquire của checkpoint (`acquiringMainCheckoutWriter`) dùng `allowSelfRecognition: false` để không tái nhập hold của một operation khác cùng pid. Checkpoint `.fgos` (`runOpportunisticMainCheckoutChecks`) chạy trọn add → commit → reset-khi-lỗi trong mutex này: mutex thuộc tầng runner nên checkpoint (tầng kernel) nhận `mainCheckoutWriter` từ caller: caller đã giữ (claim, merge không slot) truyền `heldMainCheckoutWriter(pid)`, caller chỉ giữ merge slot truyền `acquiringMainCheckoutWriter(dir)` (acquire rồi nhả ngay, bị giữ thì bỏ lượt); không có writer thì checkpoint không commit. Manifest layer: infra.\n- `src/util/session-identity.mjs` (STR65; ở `src/runner/` cho tới tsk-49i — dời sang `util/` để `state/store.mjs` không phải import ngược sang `runner/`) — `resolveWriterIdentity(fgosDir, {env, pid, execFile})` → `{id, source}`: ưu tiên `FGOS_SESSION_ID`/`CLAUDE_CODE_SESSION_ID` làm `id` chuỗi; registry `<fgosDir>/sessions.json` chỉ ĐỐI CHIẾU giá trị đó, không bao giờ tự cấp một danh tính — khớp một `row.sessionId` → `source: 'registry'`, không khớp → `source: 'env'` (không có luật khớp theo thư mục hay pid của row, per str46-io-contract). Vắng cả hai biến môi trường (hoặc giá trị sai charset) thì đi ngược tối đa 3 tầng tiến trình cha (shell ra `ps -o ppid=`, dừng sớm ở pid 1 hoặc lỗi `ps`) lấy một pid số làm `id`, `source: 'pid'` — suy đoán tốt-nhất cho terminal tay gõ (xem Open Gaps); `ps` không gọi được ngay ở tầng đầu → `id` lui về pid của chính người gọi, `source: 'unresolved'` thay vì treo/ném lỗi (`unresolved` là nhãn xuất xứ, không phải danh tính vắng mặt — giá trị `id` không đổi, per str46-io-contract). Manifest layer: kernel.\n- `.githooks/pre-commit` (STR65) — hook git-native (không phải verb fgOS, không phải cấu hình riêng công cụ trợ lý nào — xem \"Khóa hoạt động cây chính\" trên cho hợp đồng đầy đủ): giải thư mục gốc worktree bằng `path.resolve(__dirname, '..')` (KHÔNG gọi `git rev-parse --show-toplevel` — biến môi trường `GIT_DIR` mà git tự đặt khi hook chạy TRONG một git worktree làm lời gọi đó trả sai thư mục gốc, xác nhận thật bằng tái tạo có chủ đích trước khi vá); sau các guard `.fgos`/root-file/nhánh `fgw/*`, đọc `.fgos/main-checkout.lock` MỘT lần qua `inspectMainCheckoutLock` (không acquire, không chờ — git đã giữ `index.lock` khi hook chạy): pid trong `FGOS_MAIN_LOCK_HOLDER_PID` khớp holder sống → commit của fgOS, bỏ qua đèn; holder pid số khác còn sống, giao thức khóa lạ, hoặc khóa hỏng → từ chối. Rồi `resolveWriterIdentity()` và đèn hoạt động `src/runner/main-checkout-activity.mjs` (`.fgos/runtime/main-checkout-activity.json`): writer khác trong `windowMs` → từ chối; còn lại ghi đèn cuối hook với `windowMs` = `HOOK_TTL_MS` 20 s (đè được qua `FGOS_MAIN_CHECKOUT_LOCK_TTL_MS`); từ chối → in thông điệp bằng thời gian + trỏ `docs/how-to-parallel-lanes.md`, thoát khác 0.\n- `scripts/install-git-hooks.mjs` (STR65) — wire `core.hooksPath` về `.githooks` khi checkout có git thật (dev clone); vắng git (cài như dependency qua `npm install <github-url>`, không giữ lại git — xem `docs/specs/distribution.md`) thì thoát 0 im lặng, không throw; gọi qua `prepare` lifecycle script của `package.json` — chạy tự động sau `npm install` trên một clone mới, không cần bước cài tay riêng.\n- Test: `test/runner/*` (gồm `test/runner/merge.test.mjs` — unit `classifySource`/`reviewDiff`/`mergeRunnerItem`/`cleanupMergedBranch`; `test/runner/write-queue.test.mjs` — chứng minh serialize thật qua marker enter/exit không xen kẽ; `test/runner/root-affinity.test.mjs` — resolveRoot/claimRoot/steerFrontier, khuôn race 2-tác-nhân đã spike-proven; `test/runner/goal-check.test.mjs` — mới, real-fake-executor) + `test/e2e/runner-loop.test.mjs` (executor giả, repo git tạm, bao gồm 3 kịch bản stage-discovery — dispatch worker thật rồi phán quyết đủ rõ đẩy item sang `planning`, phán quyết chưa đủ rõ đẩy sang `exploring` + đậu chờ người, worker sập thì item đứng yên tại `discovery`/`todo` — cộng các kịch bản stage-clarify/stage-decompose còn lại, nay khẳng định `--once` KHÔNG tự phán ở hai tên stage đó: pass-through, chia-con-chặn-frontier, cần-người + 1 kịch bản S2-pull: `take` người + `fgos-runner --once` song song không giẫm + `return` xanh + kịch bản con fork từ tip nhánh gốc) + `test/e2e/pr-gate.test.mjs` (4 kịch bản thật qua binary + git: runner item full loop review→approve→merge→done, merge conflict thật với tree nguyên vẹn sau abort, pull-door item full loop, reject pull-door giữ commit làm lịch sử) + `test/cli/fgos.test.mjs` (unit CLI cho `take`/`return`/`review`/`approve`/`reject`/`catchup`: frontier-head claim, CAS conflict, dirty-tree/HEAD-chưa-tiến refusal, verify xanh/đỏ, main-never-holds-broken-merge cho cả conflict lẫn verify-fail, legacy degrade, leaf-vs-root branch targeting, integration-drift reason, catch-up sạch/xung-đột-thật/lý-do-không-áp-dụng-được) + `test/state/replay.test.mjs` (fold `claimRole`/`headAtTake`/`headAtReturn`) + `test/state/fsm.test.mjs` (cạnh `blocked→awaiting-approval`) + `test/report/entropy.test.mjs` (entropy thuần) + kịch bản chồng-lấn-thật hai việc song song trong `test/runner/loop.test.mjs` (peak-concurrency counter, không phải suy luận thời gian tường) + `test/runner/worker-log.test.mjs` (mới — create/append, nối-không-đè qua nhiều lần thử, degrade không throw khi field vắng) + `test/runner/frozen-judge.test.mjs` (STR63 — unit `frozenJudgeHits`, mọi rule + exact-path footprint match) + benchmark ngoài suite `docs/history/phase-3-compound-learning/reports/f4-benchmark.md` (F4, real binaries, expected-delta khai trước run); 1380 test toàn suite tính tới STR63 (`cd repo && npm test`, số cũ 637 đã trôi qua nhiều feature trước đó — không phải drift do cell này)"
  },
  "classObservation": {
    "class": "Judgment",
    "reason": "no target digest match",
    "targetUnit": null
  },
  "sourceTargetDigestsUnequal": true,
  "mechanicalRequired": true,
  "deepRequired": true,
  "reviewScope": "Review current pending binding and rationale; no inherited approval.",
  "currentContentCommit": "345f15d95663260976200be66d1b9a6c648bcd6d",
  "entryId": "claim_09ce5c9968f21e0b39b0f23170433a9b"
}
```

## Entry claim_cb4a2f19d067a329bce233f6e2252729

```json
{
  "kind": "pending-manual-decision",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s10-systemic-native-predecessors.json",
  "collection": "registryGaps",
  "claimId": "claim_cb4a2f19d067a329bce233f6e2252729",
  "authorSession": "codex-session:unit-run-1792094246578-b2fbe39b@2026-10-16",
  "before": null,
  "currentDecision": {
    "claimId": "claim_cb4a2f19d067a329bce233f6e2252729",
    "sourcePath": "docs/platform/work-state/README.md",
    "sourceUnitDigest": "4452faaea1546e83431eedbc99837a462b2ddce67c1466025d0e3fc185020898",
    "claimKind": "specification",
    "disposition": "supersede",
    "targetOwner": "docs/platform/work-state/README.md",
    "targetAnchor": "unheaded-block-7",
    "targetUnitDigest": "4ec367b6fb47b2dc7705caa2b3ae458f74136f697291ee505a2e884233efd793",
    "targetAncestry": [
      "Work State",
      "4. Legacy Source Pointers"
    ],
    "rationale": "A22/A31/L10-18b/L10-20: native predecessor from 19ca8de23 is superseded by the current same-section unit after authorized source/target link-cell restoration, sentence-order restoration or evolve code-line citation correction. Complete immutable before/after unit text and native successor identity are recorded in step10-sync345-predecessor-reconciliation.json; review the actual delta, not ordinal-anchor equality. Current successor remains candidate, no truth or cutover approval.",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792094246578-b2fbe39b@2026-10-16",
    "reviewNote": "Independent review pending at 345f15d95; no approval carried."
  },
  "native": {
    "kind": "identityGaps",
    "sourcePath": "docs/platform/work-state/README.md",
    "unitDigest": "539cd77ea5a440f5840290f12690f6f2ec8bcb2c730ab83663a7c80111bff937",
    "identityFingerprint": "539cd77ea5a440f5840290f12690f6f2ec8bcb2c730ab83663a7c80111bff937",
    "claimId": "claim_cb4a2f19d067a329bce233f6e2252729",
    "sourceAnchor": "unheaded-block-7",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "4452faaea1546e83431eedbc99837a462b2ddce67c1466025d0e3fc185020898",
    "claimKind": "navigation",
    "status": "future",
    "origin": "added-since-2300d65571968bb3bcb80123a273272586e3f1db",
    "identityStatus": "identity-gap",
    "gapReason": "edited unit whose anchor unheaded-block-7 is not a stable heading anchor"
  },
  "sourceWitness": {
    "commit": "19ca8de23908e161c34c91626e41041b7813167c",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-7",
      "githubAnchor": "unheaded-block-7",
      "stableAnchor": "unheaded-block-7",
      "title": "Unheaded block 7",
      "startLine": 61,
      "endLine": 61,
      "textDigest": "4452faaea1546e83431eedbc99837a462b2ddce67c1466025d0e3fc185020898",
      "sample": "A third retained source, [vision.md](../vision.md), is not covered by this candidate area. It belongs to the platform vision candidate [docs/work-item-lifecycle-vision.md](../../wo",
      "identityFingerprint": "539cd77ea5a440f5840290f12690f6f2ec8bcb2c730ab83663a7c80111bff937",
      "ancestry": [
        "Work State",
        "4. Legacy Source Pointers"
      ],
      "text": "A third retained source, [vision.md](../vision.md), is not covered by this candidate area. It belongs to the platform vision candidate [docs/work-item-lifecycle-vision.md](../../work-item-lifecycle-vision.md)."
    }
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-7",
    "githubAnchor": "unheaded-block-7",
    "stableAnchor": "unheaded-block-7",
    "title": "Unheaded block 7",
    "startLine": 61,
    "endLine": 61,
    "textDigest": "4ec367b6fb47b2dc7705caa2b3ae458f74136f697291ee505a2e884233efd793",
    "sample": "A third retained source, [docs/work-item-lifecycle-vision.md](../../work-item-lifecycle-vision.md), is not covered by this candidate area. It belongs to the platform vision candida",
    "identityFingerprint": "1afd98da3c2363e451b0b07fdcfa2293b3ce4491facfd9b03e16530230474b37",
    "ancestry": [
      "Work State",
      "4. Legacy Source Pointers"
    ],
    "text": "A third retained source, [docs/work-item-lifecycle-vision.md](../../work-item-lifecycle-vision.md), is not covered by this candidate area. It belongs to the platform vision candidate [vision.md](../vision.md)."
  },
  "classObservation": {
    "class": "Judgment",
    "reason": "no target digest match",
    "targetUnit": null
  },
  "sourceTargetDigestsUnequal": true,
  "mechanicalRequired": true,
  "deepRequired": true,
  "reviewScope": "Review current pending binding and rationale; no inherited approval.",
  "currentContentCommit": "345f15d95663260976200be66d1b9a6c648bcd6d",
  "entryId": "claim_cb4a2f19d067a329bce233f6e2252729"
}
```

