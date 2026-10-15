# Link repoints — part 2

One review request; entry 121–240 of section f (366 total). Content pin `aecdc30aad0ffd65a2956ff642c4be9410686ede`; comparison base `980cb29312b8701f5ea639278f44e1a57a6e5c02`. See [single request index](review-request-step10-index-aecdc30aa.md). This part contains **120 entries**.

Independent review required. No producer-selected seed or verdict. The JSON sidecar carries the same complete entries.

Each row shows old/new destination, native committed target-resolution result, unchanged label and exact alias-origin/target proof. Check destination semantics independently for every entry. Preserved fences, 41 historical referents and nine queued links are documented in the execution artifact; no inline-code or non-doc consumer edits.

## Entry f-121: link-121

```json
{
  "id": "link-121",
  "path": "docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md",
  "inputLine": 40,
  "inputColumn": 53,
  "lineBeforeLinkPass": 48,
  "before": "[source migration §10](../../../architect/host-invocation-routing/node-to-rust-component-migration.md#10-migrate-read-models-before-writers)",
  "after": "[source migration §10](node-to-rust-migration.md#10-migrate-read-models-before-writers)",
  "legacyPath": "docs/architect/host-invocation-routing/node-to-rust-component-migration.md",
  "target": {
    "path": "docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md",
    "anchor": "10-migrate-read-models-before-writers",
    "aliasId": "host-invocation-draft-082"
  },
  "portal": false,
  "area": "host-invocation-routing",
  "reviewStatus": "pending",
  "oldDestination": "../../../architect/host-invocation-routing/node-to-rust-component-migration.md#10-migrate-read-models-before-writers",
  "newDestination": "node-to-rust-migration.md#10-migrate-read-models-before-writers",
  "alias": {
    "fromPath": "docs/architect/host-invocation-routing/node-to-rust-component-migration.md#10-migrate-read-models-before-writers",
    "toOwner": "docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md",
    "toAnchor": "10-migrate-read-models-before-writers",
    "kind": "split",
    "evidenceRef": "plans/260925-documentation-authority-unification/reports/phase-06/review-3-rework-source.md",
    "immutableRefs": [],
    "recordedAt": "2026-10-13",
    "aliasId": "host-invocation-draft-082"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 2,
    "title": "10. Migrate Read Models Before Writers",
    "anchor": "10-migrate-read-models-before-writers",
    "githubAnchor": "10-migrate-read-models-before-writers",
    "stableAnchor": "h-90c1ea8c17d9",
    "startLine": 329,
    "endLine": 329,
    "textDigest": "225088240c21859fc36ee71b02c32151f4f19e37a2a17e8539b159561d58f15c",
    "sample": "10. Migrate Read Models Before Writers",
    "sectionPayloadDigest": "c3bf16d84748ff23219b3698da7d6e6ca069c51d4c9e5f686b736b1e99759386",
    "followingBlockDigest": "6820b1ee737ed435ba7664d9983109eb53e943e0c582ca530f2350152cbb475b",
    "identityFingerprint": "716e1bd8edba58043bda80863ea679a6e6580ce041acd0cb4fd3366000fdd35e",
    "ancestry": [
      "Node To Rust Component Migration"
    ],
    "text": "## 10. Migrate Read Models Before Writers",
    "sectionText": "## 10. Migrate Read Models Before Writers\n\nThe next meaningful proof after the small operations should be a Work Lifecycle\nread-side component, potentially the dependencies needed by `ready`.\n\nSequence it internally:\n\n1. event/schema decode fixtures;\n2. deterministic replay fixtures;\n3. domain/stage projection fixtures;\n4. frontier calculation fixtures;\n5. effective claim overlay;\n6. CLI `ready` parity and pagination;\n7. remote semantic parity.\n\nThis creates reusable Rust read models before any event writer moves."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 4,
    "title": "10. Migrate Read Models Before Writers",
    "anchor": "10-migrate-read-models-before-writers",
    "githubAnchor": "10-migrate-read-models-before-writers",
    "stableAnchor": "h-75cabcfa13fc",
    "startLine": 356,
    "endLine": 356,
    "textDigest": "5ae126eab3838fb0b18c1226734b38c22b3674d2b370d9c47193602a09990c6d",
    "sample": "10. Migrate Read Models Before Writers",
    "sectionPayloadDigest": "815d54242da7d57b452a2cf1f0f5d500f63a6ed15a0802a400996349f92605da",
    "followingBlockDigest": "6820b1ee737ed435ba7664d9983109eb53e943e0c582ca530f2350152cbb475b",
    "identityFingerprint": "7e2fd1d7d3739f840464d5e220c90a2d0cd27af492b33457ff226ea65232e728",
    "ancestry": [
      "Architecture: Node To Rust Migration",
      "Retained selected source material",
      "Node To Rust Component Migration"
    ],
    "text": "#### 10. Migrate Read Models Before Writers",
    "sectionText": "#### 10. Migrate Read Models Before Writers\n\nThe next meaningful proof after the small operations should be a Work Lifecycle\nread-side component, potentially the dependencies needed by `ready`.\n\n\nAdded in candidate: this retained source detail is carried verbatim in [the dropped-014 restoration](../contracts/component-protocol.md#restored-per-component-repeat-procedure).\n\n\n\nThis creates reusable Rust read models before any event writer moves."
  }
}
```

## Entry f-122: link-122

```json
{
  "id": "link-122",
  "path": "docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md",
  "inputLine": 41,
  "inputColumn": 79,
  "lineBeforeLinkPass": 49,
  "before": "[source migration §11](../../../architect/host-invocation-routing/node-to-rust-component-migration.md#11-migrate-state-writing-components)",
  "after": "[source migration §11](node-to-rust-migration.md#11-migrate-state-writing-components)",
  "legacyPath": "docs/architect/host-invocation-routing/node-to-rust-component-migration.md",
  "target": {
    "path": "docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md",
    "anchor": "11-migrate-state-writing-components",
    "aliasId": "host-invocation-draft-083"
  },
  "portal": false,
  "area": "host-invocation-routing",
  "reviewStatus": "pending",
  "oldDestination": "../../../architect/host-invocation-routing/node-to-rust-component-migration.md#11-migrate-state-writing-components",
  "newDestination": "node-to-rust-migration.md#11-migrate-state-writing-components",
  "alias": {
    "fromPath": "docs/architect/host-invocation-routing/node-to-rust-component-migration.md#11-migrate-state-writing-components",
    "toOwner": "docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md",
    "toAnchor": "11-migrate-state-writing-components",
    "kind": "redirected",
    "evidenceRef": "plans/260925-documentation-authority-unification/reports/phase-06/review-3-checkpoint-host-invocation.md",
    "immutableRefs": [],
    "recordedAt": "2026-10-13",
    "aliasId": "host-invocation-draft-083"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 2,
    "title": "11. Migrate State-Writing Components",
    "anchor": "11-migrate-state-writing-components",
    "githubAnchor": "11-migrate-state-writing-components",
    "stableAnchor": "h-61d508d249e9",
    "startLine": 346,
    "endLine": 346,
    "textDigest": "7b1dc142c1f821dc4df9a0cd4f133f31177a6fdd0e040b29e0790abc84052e8e",
    "sample": "11. Migrate State-Writing Components",
    "sectionPayloadDigest": "455e0e9c54bcd83f4b2c52a5516651b61ee7f833faa8e62d51c263e53b528925",
    "followingBlockDigest": "e9835473d73b6c3d47fc137e6ebad193fac1001c314b59ee4e75761ca18a79cd",
    "identityFingerprint": "560def2bc673961b5f5c1629fc55aa3d2a618481255dc3c72f319d7d86ac9742",
    "ancestry": [
      "Node To Rust Component Migration"
    ],
    "text": "## 11. Migrate State-Writing Components",
    "sectionText": "## 11. Migrate State-Writing Components\n\nMove a writer only when all of these are explicit and tested:\n\n- sole authority owner;\n- event/schema version compatibility;\n- lock and concurrency behavior;\n- atomicity and fsync/rename expectations;\n- idempotency and retry policy;\n- crash recovery and partial-write detection;\n- typed error/exit mapping;\n- Node/Rust mutual exclusion during cutover;\n- rollback compatibility with events written by Rust.\n\nNever dual-run a write for shadow comparison. Use fixtures, isolated temp stores,\nand replay equivalence instead."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 4,
    "title": "11. Migrate State-Writing Components",
    "anchor": "11-migrate-state-writing-components",
    "githubAnchor": "11-migrate-state-writing-components",
    "stableAnchor": "h-c4a5f73945e0",
    "startLine": 368,
    "endLine": 368,
    "textDigest": "fbaf5adba0aee1a34d0aab03504ce7a9044da100bdd2645d33a3a9836970fbc8",
    "sample": "11. Migrate State-Writing Components",
    "sectionPayloadDigest": "455e0e9c54bcd83f4b2c52a5516651b61ee7f833faa8e62d51c263e53b528925",
    "followingBlockDigest": "e9835473d73b6c3d47fc137e6ebad193fac1001c314b59ee4e75761ca18a79cd",
    "identityFingerprint": "9aaed1c1f85d746e611ea4deb0d0b66143ca06d71c91fccedd2fc7c9efd744ef",
    "ancestry": [
      "Architecture: Node To Rust Migration",
      "Retained selected source material",
      "Node To Rust Component Migration"
    ],
    "text": "#### 11. Migrate State-Writing Components",
    "sectionText": "#### 11. Migrate State-Writing Components\n\nMove a writer only when all of these are explicit and tested:\n\n- sole authority owner;\n- event/schema version compatibility;\n- lock and concurrency behavior;\n- atomicity and fsync/rename expectations;\n- idempotency and retry policy;\n- crash recovery and partial-write detection;\n- typed error/exit mapping;\n- Node/Rust mutual exclusion during cutover;\n- rollback compatibility with events written by Rust.\n\nNever dual-run a write for shadow comparison. Use fixtures, isolated temp stores,\nand replay equivalence instead."
  }
}
```

## Entry f-123: link-123

```json
{
  "id": "link-123",
  "path": "docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md",
  "inputLine": 42,
  "inputColumn": 72,
  "lineBeforeLinkPass": 50,
  "before": "[Observe Spec](../../../specs/observe.md)",
  "after": "[Observe Spec](../../observe/README.md)",
  "legacyPath": "docs/specs/observe.md",
  "target": {
    "path": "docs/platform/observe/README.md",
    "anchor": null,
    "aliasId": "step10-specs-0373"
  },
  "portal": false,
  "area": "host-invocation-routing",
  "reviewStatus": "pending",
  "oldDestination": "../../../specs/observe.md",
  "newDestination": "../../observe/README.md",
  "alias": {
    "aliasId": "step10-specs-0373",
    "fromPath": "docs/specs/observe.md",
    "toOwner": "docs/platform/observe/README.md",
    "toAnchor": null,
    "kind": "moved",
    "evidenceRef": "plans/260925-documentation-authority-unification/ledger/area-map-specs-ui.md",
    "immutableRefs": [],
    "recordedAt": "2026-10-15"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Observe Component Specification",
    "anchor": "observe-component-specification",
    "githubAnchor": "observe-component-specification",
    "stableAnchor": "h-e15937e32017",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "53e7d20d4f0fc326b73efbd72dcbb66009bc65ec37e130c0e2178c948161adf8",
    "sample": "Observe Component Specification",
    "sectionPayloadDigest": "b268929538ae29dad4d30bcab03673684209ffaad00be9cf4e111374c1827513",
    "followingBlockDigest": "b268929538ae29dad4d30bcab03673684209ffaad00be9cf4e111374c1827513",
    "identityFingerprint": "6f1ce064167409e7df5541430247bfda4416db861dd56cdf955fe6010f6010b7",
    "ancestry": [],
    "text": "# Observe Component Specification",
    "sectionText": "# Observe Component Specification\n\nDocument type: BA-grade area specification\nOwnership: `packages/observe/rust` (`fgos-observe`)\nSubstrate stores: `.fgos/observe/<store>/<writerId>.jsonl`"
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "observe candidate area",
    "anchor": "observe-candidate-area",
    "githubAnchor": "observe-candidate-area",
    "stableAnchor": "h-3520c64ca4db",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "77465e0e15db88b5d1d8dac1ce1231ba1d216f68a2eb5858cf37ec73421909f3",
    "sample": "observe candidate area",
    "sectionPayloadDigest": "28515103f653ff9341358199e0d0ffa4021304a97ac3acaa4212ed9a52b952c4",
    "followingBlockDigest": "aa596f84e9889b939fb625d75af7ba2528f6c8ce1ee38e71f91a200d65f086a7",
    "identityFingerprint": "f99924749a626fc50b7b53e2d2a9b37a322878af33646511aeb3b1f269a3f95f",
    "ancestry": [],
    "text": "# observe candidate area",
    "sectionText": "# observe candidate area\n\n```txt\nDocument type: Area portal\nAudience: Documentation migration reviewer, maintainer, agent\nPurpose: Preserve mapped legacy content for independent conservation review\nDesign status: Candidate\nImplementation: Carriage only; current implementation truth is not certified\nProvenance: docs/specs/observe.md at 111adc51fd047d99121fd9d076eb4794c87045a4\nWriter type: Agent draft writer\nCanonical: No\nCanonical for: None; candidate only\nUse this when: Reviewing carriage, placement and source conservation\nDo not use this for: Current canonical authority or implemented-behavior proof\nLast reviewed: Not independently reviewed; authored 2026-10-15\nRelated:\n- docs/specs/observe.md\nSupersedes: None; candidate only\nSuperseded by: None\n```\n\n> Added in candidate: Candidate metadata and placement scaffolding. This reading portal is new navigation, not a new component or authority. Legacy authority remains unchanged; source wording is preserved for conservation, including known stale assertions."
  }
}
```

## Entry f-124: link-124

```json
{
  "id": "link-124",
  "path": "docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md",
  "inputLine": 50,
  "inputColumn": 22,
  "lineBeforeLinkPass": 58,
  "before": "[../../../architect/host-invocation-routing/node-to-rust-component-migration.md](../../../architect/host-invocation-routing/node-to-rust-component-migration.md)",
  "after": "[../../../architect/host-invocation-routing/node-to-rust-component-migration.md](../README.md)",
  "legacyPath": "docs/architect/host-invocation-routing/node-to-rust-component-migration.md",
  "target": {
    "path": "docs/platform/host-invocation-routing/README.md",
    "anchor": null,
    "aliasId": "host-invocation-draft-061"
  },
  "portal": false,
  "area": "host-invocation-routing",
  "reviewStatus": "pending",
  "oldDestination": "../../../architect/host-invocation-routing/node-to-rust-component-migration.md",
  "newDestination": "../README.md",
  "alias": {
    "fromPath": "docs/architect/host-invocation-routing/node-to-rust-component-migration.md",
    "toOwner": "docs/platform/host-invocation-routing/README.md",
    "toAnchor": null,
    "kind": "redirected",
    "evidenceRef": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
    "immutableRefs": [],
    "recordedAt": "2026-10-13",
    "aliasId": "host-invocation-draft-061"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Node To Rust Component Migration",
    "anchor": "node-to-rust-component-migration",
    "githubAnchor": "node-to-rust-component-migration",
    "stableAnchor": "h-b4de1922ccc4",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "24e0aa773ffabc724acf02f1b1c6f96aaedfc26582081dd323103b4146ef3621",
    "sample": "Node To Rust Component Migration",
    "sectionPayloadDigest": "56cf264d990b67f6fdd7c1c1bd0b4ce4891014bece3dad995ef381e4c7eeb164",
    "followingBlockDigest": "206fd476551e3bbbbdc0ebf45aa95e5254c49d31e21e9fc83de16d91ee3f0731",
    "identityFingerprint": "b481481ac015aebf2e03ff1aae8b1710e4f2eddaf4606b848d0690c68bab5ec1",
    "ancestry": [],
    "text": "# Node To Rust Component Migration",
    "sectionText": "# Node To Rust Component Migration\n\n**Status:** Selected migration direction, not an implementation plan.\n**Date:** 2026-09-01.\n**Revised:** 2026-09-10 (see\nplans/reports/architecture-review-260910-1537-host-invocation-provider-routing-design-review.md).\n**Selected direction (2026-09-03; revised 2026-09-04, 2026-09-10):** ship the\ndistributable Rust `fgos` CLI host in R1, with every unmigrated selector\nresolved by the CLI adapter to the legacy-cli lane and exec'd straight to the\nNode payload, never entering the kernel; prove external process providers in\nR2 and the production remote peer in R3; then replace semantic operations one\ncomponent at a time with native Rust providers.\n**Source:** Product-owner planning and follow-up component-boundary discussion.\n\nThis document discusses only migration options, ordering, transition stages,\ncutover, and rollback. The stable host model, peer CLI/remote host use cases,\nOperation Provider Router, provider mechanics, protocols, plugin registry,\nauthority, and technical tradeoffs live in\n[Host Invocation And Provider Routing Architecture](./host-invocation-provider-routing.md).\nComponent ownership, authority boundaries, and the physical placement compass\nfor files/crates/components live in\n[fgOS Component Boundary Advisory](../component-boundary/component-boundary-advisory.md);\nevery native migration slice must read it before choosing where a provider or\ncomponent module lives.\nThe executable work breakdown lives in\n[Rust Host And Proof Providers Implementation Plan](./rust-cli-and-proof-components-plan.md)."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Host Invocation",
    "anchor": "host-invocation",
    "githubAnchor": "host-invocation",
    "stableAnchor": "h-9674073175c5",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "cc682e1a901b39ba480c2a95282077b85597b0d8ee6aa24bd7dcd71c8de20739",
    "sample": "Host Invocation",
    "sectionPayloadDigest": "4906b85c6c780d8a9dcf4b69f592806ac5301cf33aa4d638e0c88c98046f9e9e",
    "followingBlockDigest": "4906b85c6c780d8a9dcf4b69f592806ac5301cf33aa4d638e0c88c98046f9e9e",
    "identityFingerprint": "2f2cd30c374c59bab51ddaebeadfb9338d8540794673fcc6fc53dfc281b37d78",
    "ancestry": [],
    "text": "# Host Invocation",
    "sectionText": "# Host Invocation\n\n```txt\nDocument type: Area portal\nAudience: Human reviewer, architect, maintainer, implementation agent\nPurpose: Route readers through fgOS host invocation, provider routing, legacy CLI transition, and external provider docs\nDesign status: Draft\nImplementation status: R1/R2/R3 implemented preview plus partial route migration\nCanonical: Yes, after review\nOwner: Platform documentation\nSource type: Promoted from docs/architect/host-invocation-routing/**\nLast reviewed: 2026-09-18\nImplementation: Existing dated R1/R2/R3 preview records; candidate carriage and current truth await independent checkpoint review\nProvenance: Six pinned legacy sources and the frozen Host Invocation area map; retained policy is non-authority history\nWriter type: Agent\nCanonical for: Promoted area navigation only; candidate document claims are not promoted by this edit\nUse this when: Finding the host invocation contract, selected migration direction and its proof boundaries\nDo not use this for: Selecting or installing a runtime, certifying current route counts, or treating dated plans as shipped code\nSupersedes: None; legacy source authority remains unchanged during candidate transformation\nSuperseded by: None\nRelated:\n- docs/platform/host-invocation-routing/vision.md\n- docs/platform/host-invocation-routing/intent-preservation-ledger.md\n- docs/platform/host-invocation-routing/spec.md\n- docs/platform/host-invocation-routing/roadmap.md\n- docs/platform/host-invocation-routing/architecture/invocation-kernel.md\n- docs/platform/host-invocation-routing/architecture/provider-routing.md\n- docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md\n- docs/platform/host-invocation-routing/contracts/operation-request-outcome.md\n- docs/platform/host-invocation-routing/contracts/command-route-descriptor.md\n- docs/platform/host-invocation-routing/verification/implementation-alignment.md\n- docs/platform/host-invocation-routing/history/source-inventory.md\n- docs/platform/host-invocation-routing/verification/source-preservation-audit.md\n- docs/platform/host-invocation-routing/decisions/README.md\n```"
  }
}
```

## Entry f-125: link-125

```json
{
  "id": "link-125",
  "path": "docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md",
  "inputLine": 221,
  "inputColumn": 4,
  "lineBeforeLinkPass": 229,
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
  "reviewStatus": "pending",
  "oldDestination": "../../../architect/packaging-distribution/runtime-identity-and-activation.md",
  "newDestination": "../../packaging-distribution/README.md",
  "alias": {
    "aliasId": "step10-packaging-distribution-0173",
    "fromPath": "docs/architect/packaging-distribution/runtime-identity-and-activation.md",
    "toOwner": "docs/platform/packaging-distribution/README.md",
    "toAnchor": null,
    "kind": "moved",
    "evidenceRef": "plans/260925-documentation-authority-unification/ledger/area-map-packaging-distribution.md",
    "immutableRefs": [],
    "recordedAt": "2026-10-15"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Runtime Identity And Activation",
    "anchor": "runtime-identity-and-activation",
    "githubAnchor": "runtime-identity-and-activation",
    "stableAnchor": "h-4495eac03a0d",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "b0443ae563d60b4c86e1a73c3187615831c3cd8c21cd015488f9e2695a68ac96",
    "sample": "Runtime Identity And Activation",
    "sectionPayloadDigest": "21e896a473b555bbdfa05d0bb9c442cc3aac543bfd21a6a2f74833a27378cf2e",
    "followingBlockDigest": "10091961d72f5052ef0355d73033bdd6e6653df594f6393e50c3e6155bdc0cce",
    "identityFingerprint": "3300d5f2048d641eec60f696285aa4e10335cbe07f08473a7722ed511dc9e2e5",
    "ancestry": [],
    "text": "# Runtime Identity And Activation",
    "sectionText": "# Runtime Identity And Activation\n\n```txt\nLegacy status: Promoted architecture/contract source\nPromoted to:\n- docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md\n- docs/platform/packaging-distribution/contracts/release-manifest.md\n- docs/platform/packaging-distribution/contracts/activation-binding.md\n- docs/platform/packaging-distribution/contracts/distribution-pin.md\nCurrent reader entry: docs/platform/packaging-distribution/README.md\nUse this legacy file for: Source detail until contract extraction is complete\nDo not use this legacy file for: Current implementation status without checking implementation alignment\nLast reviewed: 2026-09-13\n```\n\n> Status: historical redirect. The active promoted runtime docs are\n> [runtime-identity-and-activation.md](../../platform/packaging-distribution/architecture/runtime-identity-and-activation.md),\n> [repository-runtime-layout.md](../../platform/packaging-distribution/contracts/repository-runtime-layout.md),\n> [release-manifest.md](../../platform/packaging-distribution/contracts/release-manifest.md),\n> [activation-binding.md](../../platform/packaging-distribution/contracts/activation-binding.md),\n> [distribution-pin.md](../../platform/packaging-distribution/contracts/distribution-pin.md),\n> and [fgctl-and-local-fgos.md](../../platform/packaging-distribution/architecture/fgctl-and-local-fgos.md).\n> Keep this file only as detailed source context.\n\n**Status:** Historical architecture contract draft.\n**Date:** 2026-09-04.\n**Scope:** Project-local fgOS runtime identity, release records, per-workspace\nactivation binding, pinning, drift, rollback, quarantine, and the minimum\ncommand boundary needed for packaging/distribution and the Rust `fgos` CLI.\n\nThis document was the first contract draft before promotion into\n`docs/platform/packaging-distribution/**`. It deliberately kept shared\ngateway/web as a future constraint, not active delivery scope."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Packaging-Distribution",
    "anchor": "packaging-distribution",
    "githubAnchor": "packaging-distribution",
    "stableAnchor": "h-1afc4b2f4e45",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "19e5e05abf531948c54037d55341d63daf7e1a062c251385fd0744ce382d3d26",
    "sample": "Packaging-Distribution",
    "sectionPayloadDigest": "a4a861e4a929e4736d0173ccf2771dfa399e00097cadcf6875d30c8598d57cf7",
    "followingBlockDigest": "a4a861e4a929e4736d0173ccf2771dfa399e00097cadcf6875d30c8598d57cf7",
    "identityFingerprint": "b081e84a2821799ef3f35b3656452ed95b36b563ba76fc87957f39ab635a51c8",
    "ancestry": [],
    "text": "# Packaging-Distribution",
    "sectionText": "# Packaging-Distribution\n\n```txt\nDocument type: Area portal\nAudience: Human reviewer, maintainer, architecture collaborator, implementation agent\nPurpose: Route readers through fgOS packaging, install, runtime activation, doctor/repair, and release docs\nDesign status: Draft\nImplementation status: Implemented preview plus tracked partials\nCanonical: Yes, after review\nOwner: Platform documentation\nSource type: Promoted from docs/specs/distribution.md, docs/distribution-vision.md, and docs/architect/packaging-distribution/**\nLast reviewed: 2026-09-18\nRelated:\n- docs/platform/packaging-distribution/vision.md\n- docs/platform/packaging-distribution/spec.md\n- docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md\n- docs/platform/packaging-distribution/contracts/repository-runtime-layout.md\n- docs/platform/packaging-distribution/contracts/setup-doctor-registry.md\n- docs/platform/packaging-distribution/contracts/instruction-composition-and-projection.md\n- docs/platform/packaging-distribution/contracts/skill-package-distribution.md\n- docs/platform/packaging-distribution/verification/implementation-alignment.md\n- docs/platform/packaging-distribution/verification/source-preservation-audit.md\n- docs/platform/packaging-distribution/code-panel-rollout-plan.md\nImplementation: Original section-specific implementation statements retained; carriage is pending independent review\nProvenance: Existing area document plus source-detail carriage at 77830ba77eb05991d95b005919776ee6254e833b\nWriter type: Human + agent coauthor\nCanonical for: The topic stated by this document, subject to the unchanged switchboard route and independent review\nUse this when: Reading this area topic and its retained design details\nDo not use this for: Claiming a truth review or an authority cutover from carriage alone\nSupersedes: No authority transition in this carriage pass\nSuperseded by: None recorded\n```"
  }
}
```

## Entry f-126: link-126

```json
{
  "id": "link-126",
  "path": "docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md",
  "inputLine": 302,
  "inputColumn": 2,
  "lineBeforeLinkPass": 310,
  "before": "[Future Constraints](../../../architect/packaging-distribution/future-constraints.md)",
  "after": "[Future Constraints](../../packaging-distribution/architecture/future-constraints.md)",
  "legacyPath": "docs/architect/packaging-distribution/future-constraints.md",
  "target": {
    "path": "docs/platform/packaging-distribution/architecture/future-constraints.md",
    "anchor": null,
    "aliasId": "step10-packaging-distribution-0031"
  },
  "portal": false,
  "area": "host-invocation-routing",
  "reviewStatus": "pending",
  "oldDestination": "../../../architect/packaging-distribution/future-constraints.md",
  "newDestination": "../../packaging-distribution/architecture/future-constraints.md",
  "alias": {
    "aliasId": "step10-packaging-distribution-0031",
    "fromPath": "docs/architect/packaging-distribution/future-constraints.md",
    "toOwner": "docs/platform/packaging-distribution/architecture/future-constraints.md",
    "toAnchor": null,
    "kind": "moved",
    "evidenceRef": "plans/260925-documentation-authority-unification/ledger/area-map-packaging-distribution.md",
    "immutableRefs": [],
    "recordedAt": "2026-10-15"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Future Constraints: Shared Gateway, Adapter, And Substrate",
    "anchor": "future-constraints-shared-gateway-adapter-and-substrate",
    "githubAnchor": "future-constraints-shared-gateway-adapter-and-substrate",
    "stableAnchor": "h-3c7b788d9413",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "8e8989079b3334c4b5f18b4d65d6170587d5ce58237c13d594696555b676ce23",
    "sample": "Future Constraints: Shared Gateway, Adapter, And Substrate",
    "sectionPayloadDigest": "db766abc51ea4be4a49546700704f911d302d67abf73eb2bb7d169d763edc5f9",
    "followingBlockDigest": "b1987634dd036c1680d0e450860fe7bc03dd35cc7039c120e83068cae5a3fefb",
    "identityFingerprint": "12ccc2c626845f51bc691a54f2e98aef6ebda66a1d2921ada717dc241131e585",
    "ancestry": [],
    "text": "# Future Constraints: Shared Gateway, Adapter, And Substrate",
    "sectionText": "# Future Constraints: Shared Gateway, Adapter, And Substrate\n\n```txt\nLegacy status: Promoted architecture source\nPromoted to: docs/platform/packaging-distribution/architecture/future-constraints.md\nCurrent reader entry: docs/platform/packaging-distribution/README.md\nUse this legacy file for: Original future-constraints source\nDo not use this legacy file for: Current canonical navigation\nLast reviewed: 2026-09-13\n```\n\n> Status: historical redirect. The active promoted future-constraints document is\n> [docs/platform/packaging-distribution/architecture/future-constraints.md](../../platform/packaging-distribution/architecture/future-constraints.md).\n> Keep this file only as discussion-era source context.\n\n**Status:** Historical future-constraints source, not active delivery scope.\n**Date:** 2026-09-04.\n\nThe promoted delivery target is packaging/distribution correctness and Rust\n`fgos` CLI readiness. Shared web/gateway and MCP/substrate work should still\nnot be implemented from this historical file. The active constraint text lives\nin [docs/platform/packaging-distribution/architecture/future-constraints.md](../../platform/packaging-distribution/architecture/future-constraints.md)."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Future Constraints",
    "anchor": "future-constraints",
    "githubAnchor": "future-constraints",
    "stableAnchor": "h-cb9610a3a58e",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "2911b40f830853fafd27cf1d816738ad181d1f49643aeedbea88e29a8a572e7a",
    "sample": "Future Constraints",
    "sectionPayloadDigest": "49c8b79cd9a353442793d9d6cfe82424ad1d6b660613801eedd956fa09560661",
    "followingBlockDigest": "49c8b79cd9a353442793d9d6cfe82424ad1d6b660613801eedd956fa09560661",
    "identityFingerprint": "6d8d7500edfd533ec9e64eb4a6a2883b6fbf3c223f66402339d8bdf1cc75c8e4",
    "ancestry": [],
    "text": "# Future Constraints",
    "sectionText": "# Future Constraints\n\n```txt\nDocument type: Architecture\nAudience: Architect, maintainer, implementation agent\nPurpose: Preserve future constraints that packaging-distribution must not block\nDesign status: Draft\nImplementation status: Planned\nCanonical: Yes, after review\nOwner: Platform documentation\nSource type: Promoted from docs/architect/packaging-distribution/future-constraints.md\nLast reviewed: 2026-09-13\nRelated:\n- docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md\nImplementation: Original section-specific implementation statements retained; carriage is pending independent review\nProvenance: Existing area document plus source-detail carriage at 77830ba77eb05991d95b005919776ee6254e833b\nWriter type: Human + agent coauthor\nCanonical for: The topic stated by this document, subject to the unchanged switchboard route and independent review\nUse this when: Reading this area topic and its retained design details\nDo not use this for: Claiming a truth review or an authority cutover from carriage alone\nSupersedes: No authority transition in this carriage pass\nSuperseded by: None recorded\n```"
  }
}
```

## Entry f-127: link-127

```json
{
  "id": "link-127",
  "path": "docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md",
  "inputLine": 398,
  "inputColumn": 1,
  "lineBeforeLinkPass": 406,
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
  "reviewStatus": "pending",
  "oldDestination": "../../../architect/packaging-distribution/runtime-identity-and-activation.md",
  "newDestination": "../../packaging-distribution/README.md",
  "alias": {
    "aliasId": "step10-packaging-distribution-0173",
    "fromPath": "docs/architect/packaging-distribution/runtime-identity-and-activation.md",
    "toOwner": "docs/platform/packaging-distribution/README.md",
    "toAnchor": null,
    "kind": "moved",
    "evidenceRef": "plans/260925-documentation-authority-unification/ledger/area-map-packaging-distribution.md",
    "immutableRefs": [],
    "recordedAt": "2026-10-15"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Runtime Identity And Activation",
    "anchor": "runtime-identity-and-activation",
    "githubAnchor": "runtime-identity-and-activation",
    "stableAnchor": "h-4495eac03a0d",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "b0443ae563d60b4c86e1a73c3187615831c3cd8c21cd015488f9e2695a68ac96",
    "sample": "Runtime Identity And Activation",
    "sectionPayloadDigest": "21e896a473b555bbdfa05d0bb9c442cc3aac543bfd21a6a2f74833a27378cf2e",
    "followingBlockDigest": "10091961d72f5052ef0355d73033bdd6e6653df594f6393e50c3e6155bdc0cce",
    "identityFingerprint": "3300d5f2048d641eec60f696285aa4e10335cbe07f08473a7722ed511dc9e2e5",
    "ancestry": [],
    "text": "# Runtime Identity And Activation",
    "sectionText": "# Runtime Identity And Activation\n\n```txt\nLegacy status: Promoted architecture/contract source\nPromoted to:\n- docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md\n- docs/platform/packaging-distribution/contracts/release-manifest.md\n- docs/platform/packaging-distribution/contracts/activation-binding.md\n- docs/platform/packaging-distribution/contracts/distribution-pin.md\nCurrent reader entry: docs/platform/packaging-distribution/README.md\nUse this legacy file for: Source detail until contract extraction is complete\nDo not use this legacy file for: Current implementation status without checking implementation alignment\nLast reviewed: 2026-09-13\n```\n\n> Status: historical redirect. The active promoted runtime docs are\n> [runtime-identity-and-activation.md](../../platform/packaging-distribution/architecture/runtime-identity-and-activation.md),\n> [repository-runtime-layout.md](../../platform/packaging-distribution/contracts/repository-runtime-layout.md),\n> [release-manifest.md](../../platform/packaging-distribution/contracts/release-manifest.md),\n> [activation-binding.md](../../platform/packaging-distribution/contracts/activation-binding.md),\n> [distribution-pin.md](../../platform/packaging-distribution/contracts/distribution-pin.md),\n> and [fgctl-and-local-fgos.md](../../platform/packaging-distribution/architecture/fgctl-and-local-fgos.md).\n> Keep this file only as detailed source context.\n\n**Status:** Historical architecture contract draft.\n**Date:** 2026-09-04.\n**Scope:** Project-local fgOS runtime identity, release records, per-workspace\nactivation binding, pinning, drift, rollback, quarantine, and the minimum\ncommand boundary needed for packaging/distribution and the Rust `fgos` CLI.\n\nThis document was the first contract draft before promotion into\n`docs/platform/packaging-distribution/**`. It deliberately kept shared\ngateway/web as a future constraint, not active delivery scope."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Packaging-Distribution",
    "anchor": "packaging-distribution",
    "githubAnchor": "packaging-distribution",
    "stableAnchor": "h-1afc4b2f4e45",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "19e5e05abf531948c54037d55341d63daf7e1a062c251385fd0744ce382d3d26",
    "sample": "Packaging-Distribution",
    "sectionPayloadDigest": "a4a861e4a929e4736d0173ccf2771dfa399e00097cadcf6875d30c8598d57cf7",
    "followingBlockDigest": "a4a861e4a929e4736d0173ccf2771dfa399e00097cadcf6875d30c8598d57cf7",
    "identityFingerprint": "b081e84a2821799ef3f35b3656452ed95b36b563ba76fc87957f39ab635a51c8",
    "ancestry": [],
    "text": "# Packaging-Distribution",
    "sectionText": "# Packaging-Distribution\n\n```txt\nDocument type: Area portal\nAudience: Human reviewer, maintainer, architecture collaborator, implementation agent\nPurpose: Route readers through fgOS packaging, install, runtime activation, doctor/repair, and release docs\nDesign status: Draft\nImplementation status: Implemented preview plus tracked partials\nCanonical: Yes, after review\nOwner: Platform documentation\nSource type: Promoted from docs/specs/distribution.md, docs/distribution-vision.md, and docs/architect/packaging-distribution/**\nLast reviewed: 2026-09-18\nRelated:\n- docs/platform/packaging-distribution/vision.md\n- docs/platform/packaging-distribution/spec.md\n- docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md\n- docs/platform/packaging-distribution/contracts/repository-runtime-layout.md\n- docs/platform/packaging-distribution/contracts/setup-doctor-registry.md\n- docs/platform/packaging-distribution/contracts/instruction-composition-and-projection.md\n- docs/platform/packaging-distribution/contracts/skill-package-distribution.md\n- docs/platform/packaging-distribution/verification/implementation-alignment.md\n- docs/platform/packaging-distribution/verification/source-preservation-audit.md\n- docs/platform/packaging-distribution/code-panel-rollout-plan.md\nImplementation: Original section-specific implementation statements retained; carriage is pending independent review\nProvenance: Existing area document plus source-detail carriage at 77830ba77eb05991d95b005919776ee6254e833b\nWriter type: Human + agent coauthor\nCanonical for: The topic stated by this document, subject to the unchanged switchboard route and independent review\nUse this when: Reading this area topic and its retained design details\nDo not use this for: Claiming a truth review or an authority cutover from carriage alone\nSupersedes: No authority transition in this carriage pass\nSuperseded by: None recorded\n```"
  }
}
```

## Entry f-128: link-128

```json
{
  "id": "link-128",
  "path": "docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md",
  "inputLine": 436,
  "inputColumn": 1,
  "lineBeforeLinkPass": 444,
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
  "reviewStatus": "pending",
  "oldDestination": "../../../architect/packaging-distribution/runtime-identity-and-activation.md",
  "newDestination": "../../packaging-distribution/README.md",
  "alias": {
    "aliasId": "step10-packaging-distribution-0173",
    "fromPath": "docs/architect/packaging-distribution/runtime-identity-and-activation.md",
    "toOwner": "docs/platform/packaging-distribution/README.md",
    "toAnchor": null,
    "kind": "moved",
    "evidenceRef": "plans/260925-documentation-authority-unification/ledger/area-map-packaging-distribution.md",
    "immutableRefs": [],
    "recordedAt": "2026-10-15"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Runtime Identity And Activation",
    "anchor": "runtime-identity-and-activation",
    "githubAnchor": "runtime-identity-and-activation",
    "stableAnchor": "h-4495eac03a0d",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "b0443ae563d60b4c86e1a73c3187615831c3cd8c21cd015488f9e2695a68ac96",
    "sample": "Runtime Identity And Activation",
    "sectionPayloadDigest": "21e896a473b555bbdfa05d0bb9c442cc3aac543bfd21a6a2f74833a27378cf2e",
    "followingBlockDigest": "10091961d72f5052ef0355d73033bdd6e6653df594f6393e50c3e6155bdc0cce",
    "identityFingerprint": "3300d5f2048d641eec60f696285aa4e10335cbe07f08473a7722ed511dc9e2e5",
    "ancestry": [],
    "text": "# Runtime Identity And Activation",
    "sectionText": "# Runtime Identity And Activation\n\n```txt\nLegacy status: Promoted architecture/contract source\nPromoted to:\n- docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md\n- docs/platform/packaging-distribution/contracts/release-manifest.md\n- docs/platform/packaging-distribution/contracts/activation-binding.md\n- docs/platform/packaging-distribution/contracts/distribution-pin.md\nCurrent reader entry: docs/platform/packaging-distribution/README.md\nUse this legacy file for: Source detail until contract extraction is complete\nDo not use this legacy file for: Current implementation status without checking implementation alignment\nLast reviewed: 2026-09-13\n```\n\n> Status: historical redirect. The active promoted runtime docs are\n> [runtime-identity-and-activation.md](../../platform/packaging-distribution/architecture/runtime-identity-and-activation.md),\n> [repository-runtime-layout.md](../../platform/packaging-distribution/contracts/repository-runtime-layout.md),\n> [release-manifest.md](../../platform/packaging-distribution/contracts/release-manifest.md),\n> [activation-binding.md](../../platform/packaging-distribution/contracts/activation-binding.md),\n> [distribution-pin.md](../../platform/packaging-distribution/contracts/distribution-pin.md),\n> and [fgctl-and-local-fgos.md](../../platform/packaging-distribution/architecture/fgctl-and-local-fgos.md).\n> Keep this file only as detailed source context.\n\n**Status:** Historical architecture contract draft.\n**Date:** 2026-09-04.\n**Scope:** Project-local fgOS runtime identity, release records, per-workspace\nactivation binding, pinning, drift, rollback, quarantine, and the minimum\ncommand boundary needed for packaging/distribution and the Rust `fgos` CLI.\n\nThis document was the first contract draft before promotion into\n`docs/platform/packaging-distribution/**`. It deliberately kept shared\ngateway/web as a future constraint, not active delivery scope."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Packaging-Distribution",
    "anchor": "packaging-distribution",
    "githubAnchor": "packaging-distribution",
    "stableAnchor": "h-1afc4b2f4e45",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "19e5e05abf531948c54037d55341d63daf7e1a062c251385fd0744ce382d3d26",
    "sample": "Packaging-Distribution",
    "sectionPayloadDigest": "a4a861e4a929e4736d0173ccf2771dfa399e00097cadcf6875d30c8598d57cf7",
    "followingBlockDigest": "a4a861e4a929e4736d0173ccf2771dfa399e00097cadcf6875d30c8598d57cf7",
    "identityFingerprint": "b081e84a2821799ef3f35b3656452ed95b36b563ba76fc87957f39ab635a51c8",
    "ancestry": [],
    "text": "# Packaging-Distribution",
    "sectionText": "# Packaging-Distribution\n\n```txt\nDocument type: Area portal\nAudience: Human reviewer, maintainer, architecture collaborator, implementation agent\nPurpose: Route readers through fgOS packaging, install, runtime activation, doctor/repair, and release docs\nDesign status: Draft\nImplementation status: Implemented preview plus tracked partials\nCanonical: Yes, after review\nOwner: Platform documentation\nSource type: Promoted from docs/specs/distribution.md, docs/distribution-vision.md, and docs/architect/packaging-distribution/**\nLast reviewed: 2026-09-18\nRelated:\n- docs/platform/packaging-distribution/vision.md\n- docs/platform/packaging-distribution/spec.md\n- docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md\n- docs/platform/packaging-distribution/contracts/repository-runtime-layout.md\n- docs/platform/packaging-distribution/contracts/setup-doctor-registry.md\n- docs/platform/packaging-distribution/contracts/instruction-composition-and-projection.md\n- docs/platform/packaging-distribution/contracts/skill-package-distribution.md\n- docs/platform/packaging-distribution/verification/implementation-alignment.md\n- docs/platform/packaging-distribution/verification/source-preservation-audit.md\n- docs/platform/packaging-distribution/code-panel-rollout-plan.md\nImplementation: Original section-specific implementation statements retained; carriage is pending independent review\nProvenance: Existing area document plus source-detail carriage at 77830ba77eb05991d95b005919776ee6254e833b\nWriter type: Human + agent coauthor\nCanonical for: The topic stated by this document, subject to the unchanged switchboard route and independent review\nUse this when: Reading this area topic and its retained design details\nDo not use this for: Claiming a truth review or an authority cutover from carriage alone\nSupersedes: No authority transition in this carriage pass\nSuperseded by: None recorded\n```"
  }
}
```

## Entry f-129: link-129

```json
{
  "id": "link-129",
  "path": "docs/platform/host-invocation-routing/architecture/provider-routing.md",
  "inputLine": 44,
  "inputColumn": 57,
  "lineBeforeLinkPass": 52,
  "before": "[old architecture §6](../../../architect/host-invocation-routing/host-invocation-provider-routing.md#6-router-pure-and-invocationservice-pipeline)",
  "after": "[old architecture §6](../spec.md#6-router-pure-and-invocationservice-pipeline)",
  "legacyPath": "docs/architect/host-invocation-routing/host-invocation-provider-routing.md",
  "target": {
    "path": "docs/platform/host-invocation-routing/spec.md",
    "anchor": "6-router-pure-and-invocationservice-pipeline",
    "aliasId": "host-invocation-draft-045"
  },
  "portal": false,
  "area": "host-invocation-routing",
  "reviewStatus": "pending",
  "oldDestination": "../../../architect/host-invocation-routing/host-invocation-provider-routing.md#6-router-pure-and-invocationservice-pipeline",
  "newDestination": "../spec.md#6-router-pure-and-invocationservice-pipeline",
  "alias": {
    "fromPath": "docs/architect/host-invocation-routing/host-invocation-provider-routing.md#6-router-pure-and-invocationservice-pipeline",
    "toOwner": "docs/platform/host-invocation-routing/spec.md",
    "toAnchor": "6-router-pure-and-invocationservice-pipeline",
    "kind": "redirected",
    "evidenceRef": "plans/260925-documentation-authority-unification/reports/phase-06/review-3-checkpoint-host-invocation.md",
    "immutableRefs": [],
    "recordedAt": "2026-10-13",
    "aliasId": "host-invocation-draft-045"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 2,
    "title": "6. Router (Pure) And InvocationService (Pipeline)",
    "anchor": "6-router-pure-and-invocationservice-pipeline",
    "githubAnchor": "6-router-pure-and-invocationservice-pipeline",
    "stableAnchor": "h-7d75c0c28ebf",
    "startLine": 117,
    "endLine": 117,
    "textDigest": "2b5639358c92726e5b5a6b4a026602f7a4c8612ddd57ac3492dc99aa63aaddb4",
    "sample": "6. Router (Pure) And InvocationService (Pipeline)",
    "sectionPayloadDigest": "d83d66c5007dc479b20066ba38d500122ce5d5e6944321738a51fc16c338c526",
    "followingBlockDigest": "15ddbb3e2c82e8c6e736ad16375407257c80854147570b36c4c0558af516004d",
    "identityFingerprint": "b5bf92f6d347d1286e7aca293efc85ccf318bbf7c57251aefa0fdaa2a4b515ea",
    "ancestry": [
      "Host Invocation And Provider Routing Architecture"
    ],
    "text": "## 6. Router (Pure) And InvocationService (Pipeline)",
    "sectionText": "## 6. Router (Pure) And InvocationService (Pipeline)\n\n**Router** — no I/O, no async, no invocation, no failure normalization, no reporting:\n\n```txt\nRouter: (OperationId, request/outcome contract versions, host kind,\n         invocation mode, project policy, RegistrySnapshot)\n        -> Result<ProviderDescriptor, SelectionRefused>\n```\n\nIt reads the `RegistrySnapshot`, matches operation/mode/host/compatible contract versions, applies an explicit binding or named replacement policy, and fails closed on ambiguity or incompatibility. It never parses CLI/HTTP input, admits, grants, holds domain policy, lets a provider reach another by recursively spawning `fgos`, or renders a response.\n\n**`InvocationService`** owns the pipeline and is the only thing that invokes a provider:\n\n```txt\nreceived -> admit -> Router.select -> grant -> invoke(adapter)\n         -> normalize transport failure -> record lifecycle\n```\n\n`admit`/`grant` are the two authority stages (§7); `invoke` calls the granted `OperationProvider` with deadline/cancellation/trace context; `normalize` maps adapter-specific transport failures onto the closed `ProviderError` families (§8) without changing semantic errors; `record` emits the lifecycle record (§8) and reports which provider/registry fingerprint served the call.\n\nNumeric priority, registration order, and last-writer-wins are not selection policy — a binding names one provider, a replacement names the provider it replaces plus the authorizing policy; otherwise duplicates are ambiguous and linking fails. `RegistrySnapshot` is immutable per invocation: assembled once at the composition root from const tables in R1; from R2 a long-running host may build and atomically publish a new snapshot between invocations, never half-relinked.\n\n```rust\npub trait OperationProvider: Send + Sync {\n    fn descriptor(&self) -> &ProviderDescriptor;\n    fn invoke<'a>(\n        &'a self, invocation: &'a HostInvocation, request: OperationRequest,\n        control: InvocationControl, events: &'a dyn EventSink,\n    ) -> Pin<Box<dyn Future<Output = Result<ProviderOutcome, ProviderError>> + Send + 'a>>;\n}\n```"
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 4,
    "title": "6. Router (Pure) And InvocationService (Pipeline)",
    "anchor": "6-router-pure-and-invocationservice-pipeline",
    "githubAnchor": "6-router-pure-and-invocationservice-pipeline",
    "stableAnchor": "h-92af94f72930",
    "startLine": 227,
    "endLine": 227,
    "textDigest": "2dba885d70e033192de131b5a7702704022fd189b6a7ee69c1423a6329329a9b",
    "sample": "6. Router (Pure) And InvocationService (Pipeline)",
    "sectionPayloadDigest": "d83d66c5007dc479b20066ba38d500122ce5d5e6944321738a51fc16c338c526",
    "followingBlockDigest": "15ddbb3e2c82e8c6e736ad16375407257c80854147570b36c4c0558af516004d",
    "identityFingerprint": "bd784aa86b0dc0bbee12e70385290e6d955cb3445e886a8fe3ebfc51a1e108de",
    "ancestry": [
      "Spec: Host Invocation",
      "Retained selected source material",
      "Host Invocation And Provider Routing Architecture"
    ],
    "text": "#### 6. Router (Pure) And InvocationService (Pipeline)",
    "sectionText": "#### 6. Router (Pure) And InvocationService (Pipeline)\n\n**Router** — no I/O, no async, no invocation, no failure normalization, no reporting:\n\n```txt\nRouter: (OperationId, request/outcome contract versions, host kind,\n         invocation mode, project policy, RegistrySnapshot)\n        -> Result<ProviderDescriptor, SelectionRefused>\n```\n\nIt reads the `RegistrySnapshot`, matches operation/mode/host/compatible contract versions, applies an explicit binding or named replacement policy, and fails closed on ambiguity or incompatibility. It never parses CLI/HTTP input, admits, grants, holds domain policy, lets a provider reach another by recursively spawning `fgos`, or renders a response.\n\n**`InvocationService`** owns the pipeline and is the only thing that invokes a provider:\n\n```txt\nreceived -> admit -> Router.select -> grant -> invoke(adapter)\n         -> normalize transport failure -> record lifecycle\n```\n\n`admit`/`grant` are the two authority stages (§7); `invoke` calls the granted `OperationProvider` with deadline/cancellation/trace context; `normalize` maps adapter-specific transport failures onto the closed `ProviderError` families (§8) without changing semantic errors; `record` emits the lifecycle record (§8) and reports which provider/registry fingerprint served the call.\n\nNumeric priority, registration order, and last-writer-wins are not selection policy — a binding names one provider, a replacement names the provider it replaces plus the authorizing policy; otherwise duplicates are ambiguous and linking fails. `RegistrySnapshot` is immutable per invocation: assembled once at the composition root from const tables in R1; from R2 a long-running host may build and atomically publish a new snapshot between invocations, never half-relinked.\n\n```rust\npub trait OperationProvider: Send + Sync {\n    fn descriptor(&self) -> &ProviderDescriptor;\n    fn invoke<'a>(\n        &'a self, invocation: &'a HostInvocation, request: OperationRequest,\n        control: InvocationControl, events: &'a dyn EventSink,\n    ) -> Pin<Box<dyn Future<Output = Result<ProviderOutcome, ProviderError>> + Send + 'a>>;\n}\n```"
  }
}
```

## Entry f-130: link-130

```json
{
  "id": "link-130",
  "path": "docs/platform/host-invocation-routing/architecture/provider-routing.md",
  "inputLine": 45,
  "inputColumn": 71,
  "lineBeforeLinkPass": 53,
  "before": "[external provider protocol §5](../../../architect/host-invocation-routing/external-provider-protocol.md#5-namespace-rules)",
  "after": "[external provider protocol §5](external-provider-protocol.md#5-namespace-rules)",
  "legacyPath": "docs/architect/host-invocation-routing/external-provider-protocol.md",
  "target": {
    "path": "docs/platform/host-invocation-routing/architecture/external-provider-protocol.md",
    "anchor": "5-namespace-rules",
    "aliasId": "host-invocation-draft-035"
  },
  "portal": false,
  "area": "host-invocation-routing",
  "reviewStatus": "pending",
  "oldDestination": "../../../architect/host-invocation-routing/external-provider-protocol.md#5-namespace-rules",
  "newDestination": "external-provider-protocol.md#5-namespace-rules",
  "alias": {
    "fromPath": "docs/architect/host-invocation-routing/external-provider-protocol.md#5-namespace-rules",
    "toOwner": "docs/platform/host-invocation-routing/architecture/external-provider-protocol.md",
    "toAnchor": "5-namespace-rules",
    "kind": "redirected",
    "evidenceRef": "plans/260925-documentation-authority-unification/reports/phase-06/review-3-checkpoint-host-invocation.md",
    "immutableRefs": [],
    "recordedAt": "2026-10-13",
    "aliasId": "host-invocation-draft-035"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 2,
    "title": "5. Namespace Rules",
    "anchor": "5-namespace-rules",
    "githubAnchor": "5-namespace-rules",
    "stableAnchor": "h-002715bb14ac",
    "startLine": 130,
    "endLine": 130,
    "textDigest": "7d972ac75372926db5e2916b8d733e5500bfb4a38d96dcc3feec0ae3e64bc9b0",
    "sample": "5. Namespace Rules",
    "sectionPayloadDigest": "001e773b95334e7e189ef5b08832f7313597267ea7f9dafbc72f66238cdf7b12",
    "followingBlockDigest": "001e773b95334e7e189ef5b08832f7313597267ea7f9dafbc72f66238cdf7b12",
    "identityFingerprint": "38b16fb8760299508e395e40a1077c4ae2607640bb4faf483ed36cbaeaa78c69",
    "ancestry": [
      "External Provider Protocol"
    ],
    "text": "## 5. Namespace Rules",
    "sectionText": "## 5. Namespace Rules\n\nThe safe ecosystem default: core operation and command namespaces are reserved; plugins add vendor-scoped operations, e.g. `acme.deploy.release`; plugins may implement extension points explicitly published by a built-in component; `.fgos` writes, Git mutation, process execution, network, secrets, and host callbacks require explicit capability grants; unknown capability requests and ambiguous claims fail closed. The provider manifest is never an authority source — caller admission and selected-provider grant (kernel contract §7) apply identically here."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 4,
    "title": "5. Namespace Rules",
    "anchor": "5-namespace-rules",
    "githubAnchor": "5-namespace-rules",
    "stableAnchor": "h-7d76fa7dbfac",
    "startLine": 177,
    "endLine": 177,
    "textDigest": "763a41cf732027644c6ca6b857805d54dc8f24c0ec838703193131b580325417",
    "sample": "5. Namespace Rules",
    "sectionPayloadDigest": "001e773b95334e7e189ef5b08832f7313597267ea7f9dafbc72f66238cdf7b12",
    "followingBlockDigest": "001e773b95334e7e189ef5b08832f7313597267ea7f9dafbc72f66238cdf7b12",
    "identityFingerprint": "3eaee3c76e38c6e48df5e5ccaf365b8b0d682d3344da86dd6fb6c2273cc55752",
    "ancestry": [
      "Architecture: External Provider Protocol",
      "Retained selected source material",
      "External Provider Protocol"
    ],
    "text": "#### 5. Namespace Rules",
    "sectionText": "#### 5. Namespace Rules\n\nThe safe ecosystem default: core operation and command namespaces are reserved; plugins add vendor-scoped operations, e.g. `acme.deploy.release`; plugins may implement extension points explicitly published by a built-in component; `.fgos` writes, Git mutation, process execution, network, secrets, and host callbacks require explicit capability grants; unknown capability requests and ambiguous claims fail closed. The provider manifest is never an authority source — caller admission and selected-provider grant (kernel contract §7) apply identically here."
  }
}
```

## Entry f-131: link-131

```json
{
  "id": "link-131",
  "path": "docs/platform/host-invocation-routing/architecture/provider-routing.md",
  "inputLine": 46,
  "inputColumn": 66,
  "lineBeforeLinkPass": 54,
  "before": "[old architecture §7](../../../architect/host-invocation-routing/host-invocation-provider-routing.md#7-authority-two-stage)",
  "after": "[old architecture §7](../spec.md#7-authority-two-stage)",
  "legacyPath": "docs/architect/host-invocation-routing/host-invocation-provider-routing.md",
  "target": {
    "path": "docs/platform/host-invocation-routing/spec.md",
    "anchor": "7-authority-two-stage",
    "aliasId": "host-invocation-draft-046"
  },
  "portal": false,
  "area": "host-invocation-routing",
  "reviewStatus": "pending",
  "oldDestination": "../../../architect/host-invocation-routing/host-invocation-provider-routing.md#7-authority-two-stage",
  "newDestination": "../spec.md#7-authority-two-stage",
  "alias": {
    "fromPath": "docs/architect/host-invocation-routing/host-invocation-provider-routing.md#7-authority-two-stage",
    "toOwner": "docs/platform/host-invocation-routing/spec.md",
    "toAnchor": "7-authority-two-stage",
    "kind": "redirected",
    "evidenceRef": "plans/260925-documentation-authority-unification/reports/phase-06/review-3-checkpoint-host-invocation.md",
    "immutableRefs": [],
    "recordedAt": "2026-10-13",
    "aliasId": "host-invocation-draft-046"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 2,
    "title": "7. Authority (Two-Stage)",
    "anchor": "7-authority-two-stage",
    "githubAnchor": "7-authority-two-stage",
    "stableAnchor": "h-a30c08f4c5a3",
    "startLine": 150,
    "endLine": 150,
    "textDigest": "543ae5581d173a41bfebde23dbddd26f17c2a2de0952df1504724175feadf330",
    "sample": "7. Authority (Two-Stage)",
    "sectionPayloadDigest": "411ea8652513c249fff158fbf6bf0db21464ef85deb6d19adf15cc65df3c0807",
    "followingBlockDigest": "2928695057f7d3fe48b36607d329a6e28781eb4dd6293ea07781262aed245bd6",
    "identityFingerprint": "4d0fa2c148ec7716b04a6b0cab2be2f68f8d7f855a1cf5f8323db20d8b2dfdb8",
    "ancestry": [
      "Host Invocation And Provider Routing Architecture"
    ],
    "text": "## 7. Authority (Two-Stage)",
    "sectionText": "## 7. Authority (Two-Stage)\n\nCore operation/command namespaces are reserved; plugins add vendor-scoped operations (`acme.deploy.release`) and implement published extension points only; `.fgos` writes, Git mutation, process/network/secret access require explicit capability grants; unknown or ambiguous claims fail closed. **Configuration can never replace a built-in provider** — closed as \"prohibit,\" not open. Rollback of a native operation in R1–R2 is a release rollback through `fgctl` (the previous release still ships both the native provider and the Node payload during the observation window), never a runtime provider-selection swap.\n\nThe provider manifest is never an authority source:\n\n1. **Caller admission** (before routing): principal, operation, project policy, requested context, host surface.\n2. **Selected-provider grant** (after routing): intersects the admitted action with the operation's capability policy and the provider's requested capabilities.\n\nThe provider receives only the resulting least-privilege grant via `InvocationControl`, identically for every host — a single pre-selection gate cannot evaluate the selected provider's identity, trust, or capability request.\n\nSelecting a different provider never silently transfers authority — a replacement returns a result or proof; the existing authority owner still applies transitions and writes state, for built-in, legacy, and external providers alike. Work Lifecycle remains the only owner of Work transitions; Run Result Evaluation may compute confidence without choosing the next status; Dispatch may execute an approved assignment without inventing its operation; an external manifest claim never grants `.fgos`, Git, process, network, or secret access."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 4,
    "title": "7. Authority (Two-Stage)",
    "anchor": "7-authority-two-stage",
    "githubAnchor": "7-authority-two-stage",
    "stableAnchor": "h-c859c99b1f37",
    "startLine": 260,
    "endLine": 260,
    "textDigest": "a891e9040923a775f70635493ff6bb5aa31107a805143c37bf35ac97bc34ab9b",
    "sample": "7. Authority (Two-Stage)",
    "sectionPayloadDigest": "411ea8652513c249fff158fbf6bf0db21464ef85deb6d19adf15cc65df3c0807",
    "followingBlockDigest": "2928695057f7d3fe48b36607d329a6e28781eb4dd6293ea07781262aed245bd6",
    "identityFingerprint": "df7c43a483ca428611cd5bc0da61724fde55ceb6a15f31d45ce2c4058a2299c2",
    "ancestry": [
      "Spec: Host Invocation",
      "Retained selected source material",
      "Host Invocation And Provider Routing Architecture"
    ],
    "text": "#### 7. Authority (Two-Stage)",
    "sectionText": "#### 7. Authority (Two-Stage)\n\nCore operation/command namespaces are reserved; plugins add vendor-scoped operations (`acme.deploy.release`) and implement published extension points only; `.fgos` writes, Git mutation, process/network/secret access require explicit capability grants; unknown or ambiguous claims fail closed. **Configuration can never replace a built-in provider** — closed as \"prohibit,\" not open. Rollback of a native operation in R1–R2 is a release rollback through `fgctl` (the previous release still ships both the native provider and the Node payload during the observation window), never a runtime provider-selection swap.\n\nThe provider manifest is never an authority source:\n\n1. **Caller admission** (before routing): principal, operation, project policy, requested context, host surface.\n2. **Selected-provider grant** (after routing): intersects the admitted action with the operation's capability policy and the provider's requested capabilities.\n\nThe provider receives only the resulting least-privilege grant via `InvocationControl`, identically for every host — a single pre-selection gate cannot evaluate the selected provider's identity, trust, or capability request.\n\nSelecting a different provider never silently transfers authority — a replacement returns a result or proof; the existing authority owner still applies transitions and writes state, for built-in, legacy, and external providers alike. Work Lifecycle remains the only owner of Work transitions; Run Result Evaluation may compute confidence without choosing the next status; Dispatch may execute an approved assignment without inventing its operation; an external manifest claim never grants `.fgos`, Git, process, network, or secret access."
  }
}
```

## Entry f-132: link-132

```json
{
  "id": "link-132",
  "path": "docs/platform/host-invocation-routing/architecture/provider-routing.md",
  "inputLine": 55,
  "inputColumn": 25,
  "lineBeforeLinkPass": 63,
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
  "reviewStatus": "pending",
  "oldDestination": "../../../architect/host-invocation-routing/host-invocation-provider-routing.md",
  "newDestination": "../README.md",
  "alias": {
    "fromPath": "docs/architect/host-invocation-routing/host-invocation-provider-routing.md",
    "toOwner": "docs/platform/host-invocation-routing/README.md",
    "toAnchor": null,
    "kind": "redirected",
    "evidenceRef": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
    "immutableRefs": [],
    "recordedAt": "2026-10-13",
    "aliasId": "host-invocation-draft-037"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Host Invocation And Provider Routing Architecture",
    "anchor": "host-invocation-and-provider-routing-architecture",
    "githubAnchor": "host-invocation-and-provider-routing-architecture",
    "stableAnchor": "h-699de63b2a62",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "05b7c0f19374f9f956c217241c508227641d20b1c4221b348777f23611b6e7df",
    "sample": "Host Invocation And Provider Routing Architecture",
    "sectionPayloadDigest": "797624eb16ce2d9c44b3fdb73c1a8aab61651fa8d134d55a3e8d05c6e32f1f65",
    "followingBlockDigest": "b5d90a2f82ebb7b1b4cc9fb4d388233e24a26f68be6ed5ee2990b783e1a36a62",
    "identityFingerprint": "2d3ca53446822aa5d2922de7b0280861ec0662ed278325b22c3a3c9a8c9183c8",
    "ancestry": [],
    "text": "# Host Invocation And Provider Routing Architecture",
    "sectionText": "# Host Invocation And Provider Routing Architecture\n\n**Status:** Vision / architecture advisory, not a locked platform law and not an implementation plan.\n**Date:** 2026-09-10.\n**Revised:** per [architecture-review-260910-1537-host-invocation-provider-routing-design-review.md](../../../plans/reports/architecture-review-260910-1537-host-invocation-provider-routing-design-review.md).\n**Source:** Product-owner component-boundary and Node-to-Rust migration discussion.\n\nThis is the **kernel contract**: the permanent invocation/routing boundary every fgOS host uses, independent of transport (CLI, remote, chat) and provider mechanism (built-in, legacy Node, external process, WASM). Ecosystem plugin mechanics: [External Provider Protocol](./external-provider-protocol.md). Transitional Node CLI lane: [Legacy CLI Transition](./legacy-cli-transition.md). Both depend on this document. Migration staging and first proof: [Node To Rust Component Migration](./node-to-rust-component-migration.md), [Rust Host And Proof Providers Implementation Plan](./rust-cli-and-proof-components-plan.md)."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Host Invocation",
    "anchor": "host-invocation",
    "githubAnchor": "host-invocation",
    "stableAnchor": "h-9674073175c5",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "cc682e1a901b39ba480c2a95282077b85597b0d8ee6aa24bd7dcd71c8de20739",
    "sample": "Host Invocation",
    "sectionPayloadDigest": "4906b85c6c780d8a9dcf4b69f592806ac5301cf33aa4d638e0c88c98046f9e9e",
    "followingBlockDigest": "4906b85c6c780d8a9dcf4b69f592806ac5301cf33aa4d638e0c88c98046f9e9e",
    "identityFingerprint": "2f2cd30c374c59bab51ddaebeadfb9338d8540794673fcc6fc53dfc281b37d78",
    "ancestry": [],
    "text": "# Host Invocation",
    "sectionText": "# Host Invocation\n\n```txt\nDocument type: Area portal\nAudience: Human reviewer, architect, maintainer, implementation agent\nPurpose: Route readers through fgOS host invocation, provider routing, legacy CLI transition, and external provider docs\nDesign status: Draft\nImplementation status: R1/R2/R3 implemented preview plus partial route migration\nCanonical: Yes, after review\nOwner: Platform documentation\nSource type: Promoted from docs/architect/host-invocation-routing/**\nLast reviewed: 2026-09-18\nImplementation: Existing dated R1/R2/R3 preview records; candidate carriage and current truth await independent checkpoint review\nProvenance: Six pinned legacy sources and the frozen Host Invocation area map; retained policy is non-authority history\nWriter type: Agent\nCanonical for: Promoted area navigation only; candidate document claims are not promoted by this edit\nUse this when: Finding the host invocation contract, selected migration direction and its proof boundaries\nDo not use this for: Selecting or installing a runtime, certifying current route counts, or treating dated plans as shipped code\nSupersedes: None; legacy source authority remains unchanged during candidate transformation\nSuperseded by: None\nRelated:\n- docs/platform/host-invocation-routing/vision.md\n- docs/platform/host-invocation-routing/intent-preservation-ledger.md\n- docs/platform/host-invocation-routing/spec.md\n- docs/platform/host-invocation-routing/roadmap.md\n- docs/platform/host-invocation-routing/architecture/invocation-kernel.md\n- docs/platform/host-invocation-routing/architecture/provider-routing.md\n- docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md\n- docs/platform/host-invocation-routing/contracts/operation-request-outcome.md\n- docs/platform/host-invocation-routing/contracts/command-route-descriptor.md\n- docs/platform/host-invocation-routing/verification/implementation-alignment.md\n- docs/platform/host-invocation-routing/history/source-inventory.md\n- docs/platform/host-invocation-routing/verification/source-preservation-audit.md\n- docs/platform/host-invocation-routing/decisions/README.md\n```"
  }
}
```

## Entry f-133: link-133

```json
{
  "id": "link-133",
  "path": "docs/platform/host-invocation-routing/architecture/release-boundaries.md",
  "inputLine": 42,
  "inputColumn": 108,
  "lineBeforeLinkPass": 50,
  "before": "[source plan §18](../../../architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#18-definition-of-done)",
  "after": "[source plan §18](../roadmap.md#18-definition-of-done)",
  "legacyPath": "docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md",
  "target": {
    "path": "docs/platform/host-invocation-routing/roadmap.md",
    "anchor": "18-definition-of-done",
    "aliasId": "host-invocation-draft-135"
  },
  "portal": false,
  "area": "host-invocation-routing",
  "reviewStatus": "pending",
  "oldDestination": "../../../architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#18-definition-of-done",
  "newDestination": "../roadmap.md#18-definition-of-done",
  "alias": {
    "fromPath": "docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#18-definition-of-done",
    "toOwner": "docs/platform/host-invocation-routing/roadmap.md",
    "toAnchor": "18-definition-of-done",
    "kind": "redirected",
    "evidenceRef": "plans/260925-documentation-authority-unification/reports/phase-06/review-3-checkpoint-host-invocation.md",
    "immutableRefs": [],
    "recordedAt": "2026-10-13",
    "aliasId": "host-invocation-draft-135"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 2,
    "title": "18. Definition Of Done",
    "anchor": "18-definition-of-done",
    "githubAnchor": "18-definition-of-done",
    "stableAnchor": "h-d10550f78750",
    "startLine": 646,
    "endLine": 646,
    "textDigest": "fb1f2858cb6dd6e403e3756018cd1c13f2c1e8f8bd966245eac9cbd0cb2d3114",
    "sample": "18. Definition Of Done",
    "sectionPayloadDigest": "d23a0b885629b56566368f82f5dbbe4510c96a9ffb153df11a95a6a4d70b22dc",
    "followingBlockDigest": "d23a0b885629b56566368f82f5dbbe4510c96a9ffb153df11a95a6a4d70b22dc",
    "identityFingerprint": "14e12b5bc80875f0387621372330a603948e32d5117f2afe0aa5a5b751e9367e",
    "ancestry": [
      "Rust Host And Proof Providers Implementation Plan"
    ],
    "text": "## 18. Definition Of Done",
    "sectionText": "## 18. Definition Of Done\n\n1. R1 installs Rust on every approved target while every unmigrated selector\n   preserves Node behavior.\n2. `version` is typed, native, compatible, and proven not to spawn Node.\n3. Init/doctor diagnoses every new binary, payload, config, registry, and\n   integrity dependency.\n4. External install, upgrade, rollback, and uninstall reproduce via `fgctl`\n   without Rust toolchain or lifecycle build.\n5. R2 process conformance passes positive and fail-closed cases.\n6. R3 has a production gateway route using the semantic path with no CLI API.\n7. `npm test`, workspace tests, and independent Herdr tests are green at their\n   owning gates.\n8. Architecture owns contracts/trade-offs, migration owns sequence policy, and\n   this file contains no competing technical design.\n9. A stranger starting at `docs/specs/reading-map.md` can reproduce each proof\n   and identify every rollback point."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 4,
    "title": "18. Definition Of Done",
    "anchor": "18-definition-of-done",
    "githubAnchor": "18-definition-of-done",
    "stableAnchor": "h-c5903ed6fa19",
    "startLine": 940,
    "endLine": 940,
    "textDigest": "8f9ef6eaaf6eef497068e95e5952435661519fecc02f32ab25265c1a9ee458e9",
    "sample": "18. Definition Of Done",
    "sectionPayloadDigest": "d23a0b885629b56566368f82f5dbbe4510c96a9ffb153df11a95a6a4d70b22dc",
    "followingBlockDigest": "d23a0b885629b56566368f82f5dbbe4510c96a9ffb153df11a95a6a4d70b22dc",
    "identityFingerprint": "2353af3bc674c06ba7ec08ab1798b13852c421625b8d8f5d8eaad8ae3f90b49f",
    "ancestry": [
      "Host Invocation Routing Roadmap",
      "Retained selected source material",
      "Rust Host And Proof Providers Implementation Plan"
    ],
    "text": "#### 18. Definition Of Done",
    "sectionText": "#### 18. Definition Of Done\n\n1. R1 installs Rust on every approved target while every unmigrated selector\n   preserves Node behavior.\n2. `version` is typed, native, compatible, and proven not to spawn Node.\n3. Init/doctor diagnoses every new binary, payload, config, registry, and\n   integrity dependency.\n4. External install, upgrade, rollback, and uninstall reproduce via `fgctl`\n   without Rust toolchain or lifecycle build.\n5. R2 process conformance passes positive and fail-closed cases.\n6. R3 has a production gateway route using the semantic path with no CLI API.\n7. `npm test`, workspace tests, and independent Herdr tests are green at their\n   owning gates.\n8. Architecture owns contracts/trade-offs, migration owns sequence policy, and\n   this file contains no competing technical design.\n9. A stranger starting at `docs/specs/reading-map.md` can reproduce each proof\n   and identify every rollback point."
  }
}
```

## Entry f-134: link-134

```json
{
  "id": "link-134",
  "path": "docs/platform/host-invocation-routing/architecture/release-boundaries.md",
  "inputLine": 43,
  "inputColumn": 67,
  "lineBeforeLinkPass": 51,
  "before": "[source plan §1](../../../architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#1-outcome)",
  "after": "[source plan §1](../roadmap.md#1-outcome)",
  "legacyPath": "docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md",
  "target": {
    "path": "docs/platform/host-invocation-routing/roadmap.md",
    "anchor": "1-outcome",
    "aliasId": "host-invocation-draft-091"
  },
  "portal": false,
  "area": "host-invocation-routing",
  "reviewStatus": "pending",
  "oldDestination": "../../../architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#1-outcome",
  "newDestination": "../roadmap.md#1-outcome",
  "alias": {
    "fromPath": "docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#1-outcome",
    "toOwner": "docs/platform/host-invocation-routing/roadmap.md",
    "toAnchor": "1-outcome",
    "kind": "redirected",
    "evidenceRef": "plans/260925-documentation-authority-unification/reports/phase-06/review-3-checkpoint-host-invocation.md",
    "immutableRefs": [],
    "recordedAt": "2026-10-13",
    "aliasId": "host-invocation-draft-091"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 2,
    "title": "1. Outcome",
    "anchor": "1-outcome",
    "githubAnchor": "1-outcome",
    "stableAnchor": "h-ebe13b29d58f",
    "startLine": 30,
    "endLine": 30,
    "textDigest": "a52bf71926ba86864841950d31e08bbde00004c9bc6845dd0724e46e221aabd3",
    "sample": "1. Outcome",
    "sectionPayloadDigest": "2e3f32b01af828b3bf16cde0829b1e51792fcfc4a0fd529a68ff001e13cb6aef",
    "followingBlockDigest": "62f374c5546f8bcbc6881ebbeb92e06b217c31d4229c8e8c862cf1de45532120",
    "identityFingerprint": "cbfe387879b3286a389f46e4494b365578d0901026fe5671a7cb0bb14b9c0018",
    "ancestry": [
      "Rust Host And Proof Providers Implementation Plan"
    ],
    "text": "## 1. Outcome",
    "sectionText": "## 1. Outcome\n\nExecution is complete in three independently shippable releases:\n\n1. **R1 — distributable Rust CLI host:** installed `fgos` is Rust; every\n   unmigrated CLI invocation transparently reaches Node; `version` is native;\n   install, init/doctor, upgrade, rollback, and uninstall are reproducible\n   (install/upgrade/rollback/uninstall via `fgctl`; init/doctor local, under\n   the active identity — `runtime-identity-and-activation.md` §12).\n2. **R2 — external process preview:** one vendor fixture proves the framed\n   process protocol and fail-closed provider path without expanding into a full\n   plugin marketplace.\n3. **R3 — production remote peer:** at least one native gateway route calls the\n   shared invocation service directly; migrated routes neither shell through\n   CLI nor parse `fgos.v1` internally.\n\nR1 is useful without R2 or R3. R2 and R3 may start after the R1 runtime kernel\nis stable, but neither delays the R1 installed-entry flip."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 4,
    "title": "1. Outcome",
    "anchor": "1-outcome",
    "githubAnchor": "1-outcome",
    "stableAnchor": "h-5f812793bbda",
    "startLine": 353,
    "endLine": 353,
    "textDigest": "ad9b4e99d6581b16517683d837d5fecceac1b9568add86aeb1da837e31cb01c3",
    "sample": "1. Outcome",
    "sectionPayloadDigest": "2e3f32b01af828b3bf16cde0829b1e51792fcfc4a0fd529a68ff001e13cb6aef",
    "followingBlockDigest": "62f374c5546f8bcbc6881ebbeb92e06b217c31d4229c8e8c862cf1de45532120",
    "identityFingerprint": "8d3868c38ca2fedc4f6c5637592149289f2dce156364e36b7360e90cf275e084",
    "ancestry": [
      "Host Invocation Routing Roadmap",
      "Retained selected source material",
      "Rust Host And Proof Providers Implementation Plan"
    ],
    "text": "#### 1. Outcome",
    "sectionText": "#### 1. Outcome\n\nExecution is complete in three independently shippable releases:\n\n1. **R1 — distributable Rust CLI host:** installed `fgos` is Rust; every\n   unmigrated CLI invocation transparently reaches Node; `version` is native;\n   install, init/doctor, upgrade, rollback, and uninstall are reproducible\n   (install/upgrade/rollback/uninstall via `fgctl`; init/doctor local, under\n   the active identity — `runtime-identity-and-activation.md` §12).\n2. **R2 — external process preview:** one vendor fixture proves the framed\n   process protocol and fail-closed provider path without expanding into a full\n   plugin marketplace.\n3. **R3 — production remote peer:** at least one native gateway route calls the\n   shared invocation service directly; migrated routes neither shell through\n   CLI nor parse `fgos.v1` internally.\n\nR1 is useful without R2 or R3. R2 and R3 may start after the R1 runtime kernel\nis stable, but neither delays the R1 installed-entry flip."
  }
}
```

## Entry f-135: link-135

```json
{
  "id": "link-135",
  "path": "docs/platform/host-invocation-routing/architecture/release-boundaries.md",
  "inputLine": 54,
  "inputColumn": 17,
  "lineBeforeLinkPass": 62,
  "before": "[../../../architect/host-invocation-routing/rust-cli-and-proof-components-plan.md](../../../architect/host-invocation-routing/rust-cli-and-proof-components-plan.md)",
  "after": "[../../../architect/host-invocation-routing/rust-cli-and-proof-components-plan.md](../README.md)",
  "legacyPath": "docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md",
  "target": {
    "path": "docs/platform/host-invocation-routing/README.md",
    "anchor": null,
    "aliasId": "host-invocation-draft-088"
  },
  "portal": false,
  "area": "host-invocation-routing",
  "reviewStatus": "pending",
  "oldDestination": "../../../architect/host-invocation-routing/rust-cli-and-proof-components-plan.md",
  "newDestination": "../README.md",
  "alias": {
    "fromPath": "docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md",
    "toOwner": "docs/platform/host-invocation-routing/README.md",
    "toAnchor": null,
    "kind": "redirected",
    "evidenceRef": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
    "immutableRefs": [],
    "recordedAt": "2026-10-13",
    "aliasId": "host-invocation-draft-088"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Rust Host And Proof Providers Implementation Plan",
    "anchor": "rust-host-and-proof-providers-implementation-plan",
    "githubAnchor": "rust-host-and-proof-providers-implementation-plan",
    "stableAnchor": "h-7d1211de80c1",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "78b93c88e219b1c9d3ba3ff1613c6e755272edd193032b9b104c9fed980d340e",
    "sample": "Rust Host And Proof Providers Implementation Plan",
    "sectionPayloadDigest": "c5f05efd1ef3cd806a723b0bb4ebaf3f2e570267d8c3596ef90bb5655a0b9f31",
    "followingBlockDigest": "bbf58c843d81479697f50cb65c3a1570f2aa9b42bc6222cbbbdb153ad2ce0e02",
    "identityFingerprint": "dbc40c8c218fa48a2d6a07e5b78e9742987c5dfe3997e472f0fc93bf685ad3c0",
    "ancestry": [],
    "text": "# Rust Host And Proof Providers Implementation Plan",
    "sectionText": "# Rust Host And Proof Providers Implementation Plan\n\n**Status:** Proposed execution plan; blocked only by the remaining §3 decisions\n(target matrix, preview-vs-stable, compatibility-window duration) and the\npackaging stream's `fgctl` walking skeleton (§4, node `PK`).\n**Date:** 2026-09-04.\n**Revised:** 2026-09-10 (see plans/reports/architecture-review-260910-1537-host-invocation-provider-routing-design-review.md).\n**Architecture:** [Host Invocation And Provider Routing](./host-invocation-provider-routing.md).\n**Migration strategy:** [Node To Rust Component Migration](./node-to-rust-component-migration.md).\n**Component placement:** [fgOS Component Boundary Advisory](../component-boundary/component-boundary-advisory.md).\n**Distribution/activation authority:** [Runtime Identity And Activation](../packaging-distribution/runtime-identity-and-activation.md); this plan consumes that stream's walking skeleton, it does not redefine install/activation.\n\nThis document contains execution order, deliverables, gates, verification, and\nrollback. Semantic contracts, provider lifecycle, authority, framing, registry\nrules, compatibility modes, and technical trade-offs are owned by the\narchitecture document and are intentionally not redefined here."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Host Invocation",
    "anchor": "host-invocation",
    "githubAnchor": "host-invocation",
    "stableAnchor": "h-9674073175c5",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "cc682e1a901b39ba480c2a95282077b85597b0d8ee6aa24bd7dcd71c8de20739",
    "sample": "Host Invocation",
    "sectionPayloadDigest": "4906b85c6c780d8a9dcf4b69f592806ac5301cf33aa4d638e0c88c98046f9e9e",
    "followingBlockDigest": "4906b85c6c780d8a9dcf4b69f592806ac5301cf33aa4d638e0c88c98046f9e9e",
    "identityFingerprint": "2f2cd30c374c59bab51ddaebeadfb9338d8540794673fcc6fc53dfc281b37d78",
    "ancestry": [],
    "text": "# Host Invocation",
    "sectionText": "# Host Invocation\n\n```txt\nDocument type: Area portal\nAudience: Human reviewer, architect, maintainer, implementation agent\nPurpose: Route readers through fgOS host invocation, provider routing, legacy CLI transition, and external provider docs\nDesign status: Draft\nImplementation status: R1/R2/R3 implemented preview plus partial route migration\nCanonical: Yes, after review\nOwner: Platform documentation\nSource type: Promoted from docs/architect/host-invocation-routing/**\nLast reviewed: 2026-09-18\nImplementation: Existing dated R1/R2/R3 preview records; candidate carriage and current truth await independent checkpoint review\nProvenance: Six pinned legacy sources and the frozen Host Invocation area map; retained policy is non-authority history\nWriter type: Agent\nCanonical for: Promoted area navigation only; candidate document claims are not promoted by this edit\nUse this when: Finding the host invocation contract, selected migration direction and its proof boundaries\nDo not use this for: Selecting or installing a runtime, certifying current route counts, or treating dated plans as shipped code\nSupersedes: None; legacy source authority remains unchanged during candidate transformation\nSuperseded by: None\nRelated:\n- docs/platform/host-invocation-routing/vision.md\n- docs/platform/host-invocation-routing/intent-preservation-ledger.md\n- docs/platform/host-invocation-routing/spec.md\n- docs/platform/host-invocation-routing/roadmap.md\n- docs/platform/host-invocation-routing/architecture/invocation-kernel.md\n- docs/platform/host-invocation-routing/architecture/provider-routing.md\n- docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md\n- docs/platform/host-invocation-routing/contracts/operation-request-outcome.md\n- docs/platform/host-invocation-routing/contracts/command-route-descriptor.md\n- docs/platform/host-invocation-routing/verification/implementation-alignment.md\n- docs/platform/host-invocation-routing/history/source-inventory.md\n- docs/platform/host-invocation-routing/verification/source-preservation-audit.md\n- docs/platform/host-invocation-routing/decisions/README.md\n```"
  }
}
```

## Entry f-136: link-136

```json
{
  "id": "link-136",
  "path": "docs/platform/host-invocation-routing/architecture/release-boundaries.md",
  "inputLine": 183,
  "inputColumn": 346,
  "lineBeforeLinkPass": 191,
  "before": "[the retained component-boundary advisory](../../../architect/component-boundary/component-boundary-advisory.md)",
  "after": "[the retained component-boundary advisory](../../component-boundary.md)",
  "legacyPath": "docs/architect/component-boundary/component-boundary-advisory.md",
  "target": {
    "path": "docs/platform/component-boundary.md",
    "anchor": null,
    "aliasId": "step10-whole-system-0212"
  },
  "portal": false,
  "area": "host-invocation-routing",
  "reviewStatus": "pending",
  "oldDestination": "../../../architect/component-boundary/component-boundary-advisory.md",
  "newDestination": "../../component-boundary.md",
  "alias": {
    "aliasId": "step10-whole-system-0212",
    "fromPath": "docs/architect/component-boundary/component-boundary-advisory.md",
    "toOwner": "docs/platform/component-boundary.md",
    "toAnchor": null,
    "kind": "moved",
    "evidenceRef": "plans/260925-documentation-authority-unification/ledger/area-map-whole-system-architecture.md",
    "immutableRefs": [],
    "recordedAt": "2026-10-15"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "fgOS Component Boundary Advisory",
    "anchor": "fgos-component-boundary-advisory",
    "githubAnchor": "fgos-component-boundary-advisory",
    "stableAnchor": "h-b4d08c193f5a",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "60a53b2e9e95066e9c8aed269a5c87e08f4fdc622d280e3cefcdcf196d1fd66c",
    "sample": "fgOS Component Boundary Advisory",
    "sectionPayloadDigest": "67a1060f9c3ca588a89d2f10b4d096a4bc75c70e03c7276a0aceb30b7f1357d3",
    "followingBlockDigest": "67a1060f9c3ca588a89d2f10b4d096a4bc75c70e03c7276a0aceb30b7f1357d3",
    "identityFingerprint": "37f24753f0eb60feca5ec11df430074eb5675925d327f6ec177abb26891f8f3b",
    "ancestry": [],
    "text": "# fgOS Component Boundary Advisory",
    "sectionText": "# fgOS Component Boundary Advisory\n\nDocument type: Proposal\nDesign status: Discussion / Visionary advisory\nImplementation: N/A\nLast reviewed: 2026-09-01\nCanonical for: nothing; architectural advisory only\nRelated: [Architecture Map](../../architecture-map.md), [System Overview](../../specs/system-overview.md), [Platform Foundations](../../platform-foundations.md), [Domainization Architecture](../domainization/README.md), [Agent Coordination Foundation Vision](../agent-coordination/vision.md), [Concept Relationships](../agent-coordination/vocabulary/concept-relationships.md), [Dispatch Control Plane](../agent-coordination/architecture/dispatch-control-plane.md), [Protocol Model](../agent-coordination/architecture/protocol-model.md), [CoordinationSession Contract](../agent-coordination/contracts/coordination-session.md), [FlowDefinition Contract](../agent-coordination/contracts/flow-definition.md)"
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Component Boundary",
    "anchor": "component-boundary",
    "githubAnchor": "component-boundary",
    "stableAnchor": "h-065adbde00f9",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "725363f18a5458e00b5f7d577e388c99e8f694d6d53f8b93f66fdc5bd2e7bf64",
    "sample": "Component Boundary",
    "sectionPayloadDigest": "28c0f7b6df2717722556d20d85b1eeb533abfc9c055931f92cdd60a7038c3866",
    "followingBlockDigest": "28c0f7b6df2717722556d20d85b1eeb533abfc9c055931f92cdd60a7038c3866",
    "identityFingerprint": "02f5448c9fd944090a0aed56b7e677026868ce524756c7058041d87759a2dd5e",
    "ancestry": [],
    "text": "# Component Boundary",
    "sectionText": "# Component Boundary\n\n```txt\nDocument type: Platform architecture anchor\nAudience: Human reviewer, architect, maintainer, design-shaping agent\nPurpose: Track the whole-system component and authority boundary map\nDesign status: Draft\nImplementation status: Partial\nCanonical: Yes, after review\nOwner: Platform documentation\nSource type: Promoted anchor for docs/architect/component-boundary/**\nLast reviewed: 2026-10-04\nRelated:\n- docs/architect/component-boundary/README.md\n- docs/architect/component-boundary/component-boundary-advisory.md\n- docs/architect/proposals/component-authority-boundary-map.md\n- docs/platform/README.md\nImplementation: Partial\nProvenance: Promoted anchor for docs/architect/component-boundary/**\nWriter type: Original writer attribution not recorded; retained source provenance\nCanonical for: Candidate scope: Track the whole-system component and authority boundary map; authority follows transitional switchboard\nUse this when: Track the whole-system component and authority boundary map\nDo not use this for: Authority beyond the declared scope or implementation truth without the cited verification\nSupersedes: None; legacy sources remain in place during migration\nSuperseded by: None recorded\n```"
  }
}
```

## Entry f-137: link-137

```json
{
  "id": "link-137",
  "path": "docs/platform/host-invocation-routing/contracts/component-protocol.md",
  "inputLine": 38,
  "inputColumn": 88,
  "lineBeforeLinkPass": 46,
  "before": "[source protocol §3](../../../architect/host-invocation-routing/external-provider-protocol.md#3-component-protocol)",
  "after": "[source protocol §3](../architecture/external-provider-protocol.md#3-component-protocol)",
  "legacyPath": "docs/architect/host-invocation-routing/external-provider-protocol.md",
  "target": {
    "path": "docs/platform/host-invocation-routing/architecture/external-provider-protocol.md",
    "anchor": "3-component-protocol",
    "aliasId": "host-invocation-draft-033"
  },
  "portal": false,
  "area": "host-invocation-routing",
  "reviewStatus": "pending",
  "oldDestination": "../../../architect/host-invocation-routing/external-provider-protocol.md#3-component-protocol",
  "newDestination": "../architecture/external-provider-protocol.md#3-component-protocol",
  "alias": {
    "fromPath": "docs/architect/host-invocation-routing/external-provider-protocol.md#3-component-protocol",
    "toOwner": "docs/platform/host-invocation-routing/architecture/external-provider-protocol.md",
    "toAnchor": "3-component-protocol",
    "kind": "split",
    "evidenceRef": "plans/260925-documentation-authority-unification/reports/phase-06/review-3-rework-source.md",
    "immutableRefs": [],
    "recordedAt": "2026-10-13",
    "aliasId": "host-invocation-draft-033"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 2,
    "title": "3. Component Protocol",
    "anchor": "3-component-protocol",
    "githubAnchor": "3-component-protocol",
    "stableAnchor": "h-3d2776445484",
    "startLine": 72,
    "endLine": 72,
    "textDigest": "4788de97424c5b1035cf2384d427ef5a7694dfbae3af9c94f73cf5dcf4420ea6",
    "sample": "3. Component Protocol",
    "sectionPayloadDigest": "e71acdcc9325f5470c9e8b393d1115b8e47c2bf44fd5397ead27703eb1193a99",
    "followingBlockDigest": "aa5e4116035d0b11d423c86594b2b314f62685ed66d610c53e45cd409a2f4999",
    "identityFingerprint": "53de331d0d46a89817008914533b3e4804ad4f3b82c21ef2d39df86cf130c572",
    "ancestry": [
      "External Provider Protocol"
    ],
    "text": "## 3. Component Protocol",
    "sectionText": "## 3. Component Protocol\n\nThe semantic component protocol is versioned independently from public host protocols — `fgos.component.v1`, distinct from CLI `fgos.v1` and any remote API version. It carries: operation identity and protocol/schema version range; request ID and optional parent/correlation ID; typed request, result, and error payloads; deadline, cancellation, progress, and events where supported; capability context granted by the host; provider identity and diagnostics needed for tracing.\n\nFor process plugins, version one uses JSON-RPC 2.0 semantics over 4-byte big-endian length-prefixed UTF-8 JSON frames on stdio. Newline-delimited JSON is not the contract: a length prefix gives one enforceable maximum-frame boundary and does not make embedded or future formatted content ambiguous. Stdout is protocol only; logs go to stderr or a declared log notification.\n\nThe host starts a process only after static manifest selection. Its first exchange confirms provider identity, accepted manifest digest, component protocol range, supported operation/contract pairs, and concurrency limit. Discovery never depends on this handshake; a mismatch terminates the provider and fails closed.\n\nOne connection obeys these lifecycle rules:\n\n- request IDs are unique per connection;\n- responses may complete out of order only when concurrency greater than one was negotiated;\n- requests, frames, and event queues are bounded to provide backpressure;\n- cancellation sends a protocol notification, waits a bounded grace period, then terminates the provider process if necessary;\n- cancellation acknowledgement does not claim semantic side effects were rolled back;\n- a crash after dispatch yields completion-unknown unless the operation's idempotency contract and key explicitly permit retry;\n- a one-shot CLI may own one process for its lifetime; a gateway may pool or persist connections under the adapter's health/restart policy.\n\nThe semantic contract stays transport-neutral: a future binary codec or local socket transport may replace framing without renaming the operation.\n\n`EncodedMessage` is the wire representation used only at this boundary — never inside the kernel:\n\n```rust\npub struct EncodedMessage {\n    pub contract_id: ContractId,\n    pub version: ContractVersion,\n    pub content_type: ContentType,\n    pub bytes: Bytes,\n}\n```"
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 4,
    "title": "3. Component Protocol",
    "anchor": "3-component-protocol",
    "githubAnchor": "3-component-protocol",
    "stableAnchor": "h-3dad5d9344c9",
    "startLine": 124,
    "endLine": 124,
    "textDigest": "7cf43dd0dccf83e356b760c88da2576ecb1eb4cf9219caaf09a95ff12d2fd5a8",
    "sample": "3. Component Protocol",
    "sectionPayloadDigest": "9229fc3e7df43971e02ec720977cd9190fbe3882ca9fccf689e332f62945383f",
    "followingBlockDigest": "aa5e4116035d0b11d423c86594b2b314f62685ed66d610c53e45cd409a2f4999",
    "identityFingerprint": "66a04939a685fc3010a2080c0cb9533bcd069a467d36909a42099855075ce9e0",
    "ancestry": [
      "Architecture: External Provider Protocol",
      "Retained selected source material",
      "External Provider Protocol"
    ],
    "text": "#### 3. Component Protocol",
    "sectionText": "#### 3. Component Protocol\n\nThe semantic component protocol is versioned independently from public host protocols — `fgos.component.v1`, distinct from CLI `fgos.v1` and any remote API version. It carries: operation identity and protocol/schema version range; request ID and optional parent/correlation ID; typed request, result, and error payloads; deadline, cancellation, progress, and events where supported; capability context granted by the host; provider identity and diagnostics needed for tracing.\n\nFor process plugins, version one uses JSON-RPC 2.0 semantics over 4-byte big-endian length-prefixed UTF-8 JSON frames on stdio. Newline-delimited JSON is not the contract: a length prefix gives one enforceable maximum-frame boundary and does not make embedded or future formatted content ambiguous. Stdout is protocol only; logs go to stderr or a declared log notification.\n\nThe host starts a process only after static manifest selection. Its first exchange confirms provider identity, accepted manifest digest, component protocol range, supported operation/contract pairs, and concurrency limit. Discovery never depends on this handshake; a mismatch terminates the provider and fails closed.\n\nOne connection obeys these lifecycle rules:\n\n- request IDs are unique per connection;\n- responses may complete out of order only when concurrency greater than one was negotiated;\n- requests, frames, and event queues are bounded to provide backpressure;\n- cancellation sends a protocol notification, waits a bounded grace period, then terminates the provider process if necessary;\n- cancellation acknowledgement does not claim semantic side effects were rolled back;\n- a crash after dispatch yields completion-unknown unless the operation's idempotency contract and key explicitly permit retry;\n- a one-shot CLI may own one process for its lifetime; a gateway may pool or persist connections under the adapter's health/restart policy.\n\n\nAdded in candidate: this retained source detail is carried verbatim in [the dropped-007 restoration](../contracts/component-protocol.md#restored-semantic-contract-stays-transport-neutral).\n\n\n`EncodedMessage` is the wire representation used only at this boundary — never inside the kernel:\n\n```rust\npub struct EncodedMessage {\n    pub contract_id: ContractId,\n    pub version: ContractVersion,\n    pub content_type: ContentType,\n    pub bytes: Bytes,\n}\n```"
  }
}
```

## Entry f-138: link-138

```json
{
  "id": "link-138",
  "path": "docs/platform/host-invocation-routing/contracts/component-protocol.md",
  "inputLine": 320,
  "inputColumn": 173,
  "lineBeforeLinkPass": 328,
  "before": "[the retained component-boundary advisory](../../../architect/component-boundary/component-boundary-advisory.md)",
  "after": "[the retained component-boundary advisory](../../component-boundary.md)",
  "legacyPath": "docs/architect/component-boundary/component-boundary-advisory.md",
  "target": {
    "path": "docs/platform/component-boundary.md",
    "anchor": null,
    "aliasId": "step10-whole-system-0212"
  },
  "portal": false,
  "area": "host-invocation-routing",
  "reviewStatus": "pending",
  "oldDestination": "../../../architect/component-boundary/component-boundary-advisory.md",
  "newDestination": "../../component-boundary.md",
  "alias": {
    "aliasId": "step10-whole-system-0212",
    "fromPath": "docs/architect/component-boundary/component-boundary-advisory.md",
    "toOwner": "docs/platform/component-boundary.md",
    "toAnchor": null,
    "kind": "moved",
    "evidenceRef": "plans/260925-documentation-authority-unification/ledger/area-map-whole-system-architecture.md",
    "immutableRefs": [],
    "recordedAt": "2026-10-15"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "fgOS Component Boundary Advisory",
    "anchor": "fgos-component-boundary-advisory",
    "githubAnchor": "fgos-component-boundary-advisory",
    "stableAnchor": "h-b4d08c193f5a",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "60a53b2e9e95066e9c8aed269a5c87e08f4fdc622d280e3cefcdcf196d1fd66c",
    "sample": "fgOS Component Boundary Advisory",
    "sectionPayloadDigest": "67a1060f9c3ca588a89d2f10b4d096a4bc75c70e03c7276a0aceb30b7f1357d3",
    "followingBlockDigest": "67a1060f9c3ca588a89d2f10b4d096a4bc75c70e03c7276a0aceb30b7f1357d3",
    "identityFingerprint": "37f24753f0eb60feca5ec11df430074eb5675925d327f6ec177abb26891f8f3b",
    "ancestry": [],
    "text": "# fgOS Component Boundary Advisory",
    "sectionText": "# fgOS Component Boundary Advisory\n\nDocument type: Proposal\nDesign status: Discussion / Visionary advisory\nImplementation: N/A\nLast reviewed: 2026-09-01\nCanonical for: nothing; architectural advisory only\nRelated: [Architecture Map](../../architecture-map.md), [System Overview](../../specs/system-overview.md), [Platform Foundations](../../platform-foundations.md), [Domainization Architecture](../domainization/README.md), [Agent Coordination Foundation Vision](../agent-coordination/vision.md), [Concept Relationships](../agent-coordination/vocabulary/concept-relationships.md), [Dispatch Control Plane](../agent-coordination/architecture/dispatch-control-plane.md), [Protocol Model](../agent-coordination/architecture/protocol-model.md), [CoordinationSession Contract](../agent-coordination/contracts/coordination-session.md), [FlowDefinition Contract](../agent-coordination/contracts/flow-definition.md)"
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Component Boundary",
    "anchor": "component-boundary",
    "githubAnchor": "component-boundary",
    "stableAnchor": "h-065adbde00f9",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "725363f18a5458e00b5f7d577e388c99e8f694d6d53f8b93f66fdc5bd2e7bf64",
    "sample": "Component Boundary",
    "sectionPayloadDigest": "28c0f7b6df2717722556d20d85b1eeb533abfc9c055931f92cdd60a7038c3866",
    "followingBlockDigest": "28c0f7b6df2717722556d20d85b1eeb533abfc9c055931f92cdd60a7038c3866",
    "identityFingerprint": "02f5448c9fd944090a0aed56b7e677026868ce524756c7058041d87759a2dd5e",
    "ancestry": [],
    "text": "# Component Boundary",
    "sectionText": "# Component Boundary\n\n```txt\nDocument type: Platform architecture anchor\nAudience: Human reviewer, architect, maintainer, design-shaping agent\nPurpose: Track the whole-system component and authority boundary map\nDesign status: Draft\nImplementation status: Partial\nCanonical: Yes, after review\nOwner: Platform documentation\nSource type: Promoted anchor for docs/architect/component-boundary/**\nLast reviewed: 2026-10-04\nRelated:\n- docs/architect/component-boundary/README.md\n- docs/architect/component-boundary/component-boundary-advisory.md\n- docs/architect/proposals/component-authority-boundary-map.md\n- docs/platform/README.md\nImplementation: Partial\nProvenance: Promoted anchor for docs/architect/component-boundary/**\nWriter type: Original writer attribution not recorded; retained source provenance\nCanonical for: Candidate scope: Track the whole-system component and authority boundary map; authority follows transitional switchboard\nUse this when: Track the whole-system component and authority boundary map\nDo not use this for: Authority beyond the declared scope or implementation truth without the cited verification\nSupersedes: None; legacy sources remain in place during migration\nSuperseded by: None recorded\n```"
  }
}
```

## Entry f-139: link-139

```json
{
  "id": "link-139",
  "path": "docs/platform/host-invocation-routing/contracts/external-provider-manifest.md",
  "inputLine": 36,
  "inputColumn": 69,
  "lineBeforeLinkPass": 44,
  "before": "[source protocol §4](../../../architect/host-invocation-routing/external-provider-protocol.md#4-plugin-registry-linker)",
  "after": "[source protocol §4](../architecture/external-provider-protocol.md#4-plugin-registry-linker)",
  "legacyPath": "docs/architect/host-invocation-routing/external-provider-protocol.md",
  "target": {
    "path": "docs/platform/host-invocation-routing/architecture/external-provider-protocol.md",
    "anchor": "4-plugin-registry-linker",
    "aliasId": "host-invocation-draft-034"
  },
  "portal": false,
  "area": "host-invocation-routing",
  "reviewStatus": "pending",
  "oldDestination": "../../../architect/host-invocation-routing/external-provider-protocol.md#4-plugin-registry-linker",
  "newDestination": "../architecture/external-provider-protocol.md#4-plugin-registry-linker",
  "alias": {
    "fromPath": "docs/architect/host-invocation-routing/external-provider-protocol.md#4-plugin-registry-linker",
    "toOwner": "docs/platform/host-invocation-routing/architecture/external-provider-protocol.md",
    "toAnchor": "4-plugin-registry-linker",
    "kind": "split",
    "evidenceRef": "plans/260925-documentation-authority-unification/reports/phase-06/review-3-rework-source.md",
    "immutableRefs": [],
    "recordedAt": "2026-10-13",
    "aliasId": "host-invocation-draft-034"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 2,
    "title": "4. Plugin Registry Linker",
    "anchor": "4-plugin-registry-linker",
    "githubAnchor": "4-plugin-registry-linker",
    "stableAnchor": "h-a2b565e6393b",
    "startLine": 103,
    "endLine": 103,
    "textDigest": "f26fe2980e00f599ee3395a67dd57972d0ef8371bf0219fde39bb7f44b353a4c",
    "sample": "4. Plugin Registry Linker",
    "sectionPayloadDigest": "06294fe91566f87f10d33546b570a4cbe4335fe0ad139d6165aa976a6d84d5f5",
    "followingBlockDigest": "db002cc2af859f74874068b3e2db12c43f8dfe07276a1d602e1169446d3e88a8",
    "identityFingerprint": "6812f2d8bc7a159b057e63ed8d7aa6c0d1ce836de739e58e4015751f5bedd0c4",
    "ancestry": [
      "External Provider Protocol"
    ],
    "text": "## 4. Plugin Registry Linker",
    "sectionText": "## 4. Plugin Registry Linker\n\nExternal discovery is data-first: the host scans a static manifest and never executes unknown provider code merely to discover what it claims.\n\nA `manifest.yaml` provider declaration declares at least: plugin ID, version, publisher, and component protocol range; provided `OperationId` values or named extension points; request/result schema references; invocation mechanism and executable/module location; requested host capabilities; platform compatibility and integrity metadata; health and post-selection `describe` operations.\n\n`manifest.yaml` is the one canonical filename for authored, static provider declarations. Its `kind` field distinguishes the declaration shape (`fgos.component`, `fgos.plugin`, `fgos.domain`, ...); every kind shares `manifestVersion`, `id`, `version`, `provides`, `requires`, `capabilities` before kind-specific fields are validated.\n\n**Registry** names only the host's derived runtime index (and its lock/cache), never another authored file. Discovery scans `manifest.yaml`, validates by `kind`, then links accepted claims into the provider registry.\n\nThe registry linker: scans configured global and project plugin locations; parses and validates manifests without running the provider; verifies compatibility, provider presence, and integrity policy; resolves IDs, namespace claims, precedence, and explicit replacements; emits a deterministic derived lock/cache for help, introspection, dispatch, init, and doctor; starts a selected provider and uses `describe` only to confirm it matches the accepted manifest.\n\nIts complete input/output physics:\n\n```txt\nauthored OperationCatalog\n+ built-in provider descriptors\n+ transitional CLI-compatibility bindings\n+ validated external manifest declarations\n+ explicit global/project enable-disable-replacement policy\n  -> immutable RegistrySnapshot + source fingerprint\n```\n\nAuthored catalogs, manifests, and policy are durable inputs; the linked registry lock/cache is rebuildable derived state — it records host version and source fingerprint, is replaced atomically, and is ignored/rebuilt when stale or corrupt. A cache never outranks its authored sources. This is a compiler only in the linking/validation sense; it does not compile plugin source or the `fgos` host binary.\n\nProject configuration overrides global configuration values, but duplicate operation claims do not silently use last-writer-wins — override precedence is not authority precedence. Ambiguity fails closed unless an explicit replacement policy names both the selected provider and the provider being replaced. Configuration can never replace a **built-in** provider (see the kernel contract's Authority section); a replacement policy only ever governs the external/plugin surface this linker discovers."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 4,
    "title": "4. Plugin Registry Linker",
    "anchor": "4-plugin-registry-linker",
    "githubAnchor": "4-plugin-registry-linker",
    "stableAnchor": "h-d847f1c4439f",
    "startLine": 157,
    "endLine": 157,
    "textDigest": "cda1c088745776953a5144a0548869d897c54e9f69dcd512de6ad8359b99ed32",
    "sample": "4. Plugin Registry Linker",
    "sectionPayloadDigest": "a208fa4696f2121b98ebf8f7320e53cf3d1820b288e3a466a8e1b65a88eb636d",
    "followingBlockDigest": "db002cc2af859f74874068b3e2db12c43f8dfe07276a1d602e1169446d3e88a8",
    "identityFingerprint": "e4237eb9a37385b91dd638586cc130db172170f5db48f402d26c015a0a883cee",
    "ancestry": [
      "Architecture: External Provider Protocol",
      "Retained selected source material",
      "External Provider Protocol"
    ],
    "text": "#### 4. Plugin Registry Linker",
    "sectionText": "#### 4. Plugin Registry Linker\n\nExternal discovery is data-first: the host scans a static manifest and never executes unknown provider code merely to discover what it claims.\n\nA `manifest.yaml` provider declaration declares at least: plugin ID, version, publisher, and component protocol range; provided `OperationId` values or named extension points; request/result schema references; invocation mechanism and executable/module location; requested host capabilities; platform compatibility and integrity metadata; health and post-selection `describe` operations.\n\n`manifest.yaml` is the one canonical filename for authored, static provider declarations. Its `kind` field distinguishes the declaration shape (`fgos.component`, `fgos.plugin`, `fgos.domain`, ...); every kind shares `manifestVersion`, `id`, `version`, `provides`, `requires`, `capabilities` before kind-specific fields are validated.\n\n**Registry** names only the host's derived runtime index (and its lock/cache), never another authored file. Discovery scans `manifest.yaml`, validates by `kind`, then links accepted claims into the provider registry.\n\n\nAdded in candidate: this retained source detail is carried verbatim in [the dropped-008 restoration](../verification/compatibility-harness.md#restored-registry-linker-procedure-and-its-input-output-formula).\n\n\n\n\nAuthored catalogs, manifests, and policy are durable inputs; the linked registry lock/cache is rebuildable derived state — it records host version and source fingerprint, is replaced atomically, and is ignored/rebuilt when stale or corrupt. A cache never outranks its authored sources. This is a compiler only in the linking/validation sense; it does not compile plugin source or the `fgos` host binary.\n\nProject configuration overrides global configuration values, but duplicate operation claims do not silently use last-writer-wins — override precedence is not authority precedence. Ambiguity fails closed unless an explicit replacement policy names both the selected provider and the provider being replaced. Configuration can never replace a **built-in** provider (see the kernel contract's Authority section); a replacement policy only ever governs the external/plugin surface this linker discovers."
  }
}
```

## Entry f-140: link-140

```json
{
  "id": "link-140",
  "path": "docs/platform/host-invocation-routing/contracts/external-provider-manifest.md",
  "inputLine": 37,
  "inputColumn": 68,
  "lineBeforeLinkPass": 45,
  "before": "[source protocol §4](../../../architect/host-invocation-routing/external-provider-protocol.md#4-plugin-registry-linker)",
  "after": "[source protocol §4](../architecture/external-provider-protocol.md#4-plugin-registry-linker)",
  "legacyPath": "docs/architect/host-invocation-routing/external-provider-protocol.md",
  "target": {
    "path": "docs/platform/host-invocation-routing/architecture/external-provider-protocol.md",
    "anchor": "4-plugin-registry-linker",
    "aliasId": "host-invocation-draft-034"
  },
  "portal": false,
  "area": "host-invocation-routing",
  "reviewStatus": "pending",
  "oldDestination": "../../../architect/host-invocation-routing/external-provider-protocol.md#4-plugin-registry-linker",
  "newDestination": "../architecture/external-provider-protocol.md#4-plugin-registry-linker",
  "alias": {
    "fromPath": "docs/architect/host-invocation-routing/external-provider-protocol.md#4-plugin-registry-linker",
    "toOwner": "docs/platform/host-invocation-routing/architecture/external-provider-protocol.md",
    "toAnchor": "4-plugin-registry-linker",
    "kind": "split",
    "evidenceRef": "plans/260925-documentation-authority-unification/reports/phase-06/review-3-rework-source.md",
    "immutableRefs": [],
    "recordedAt": "2026-10-13",
    "aliasId": "host-invocation-draft-034"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 2,
    "title": "4. Plugin Registry Linker",
    "anchor": "4-plugin-registry-linker",
    "githubAnchor": "4-plugin-registry-linker",
    "stableAnchor": "h-a2b565e6393b",
    "startLine": 103,
    "endLine": 103,
    "textDigest": "f26fe2980e00f599ee3395a67dd57972d0ef8371bf0219fde39bb7f44b353a4c",
    "sample": "4. Plugin Registry Linker",
    "sectionPayloadDigest": "06294fe91566f87f10d33546b570a4cbe4335fe0ad139d6165aa976a6d84d5f5",
    "followingBlockDigest": "db002cc2af859f74874068b3e2db12c43f8dfe07276a1d602e1169446d3e88a8",
    "identityFingerprint": "6812f2d8bc7a159b057e63ed8d7aa6c0d1ce836de739e58e4015751f5bedd0c4",
    "ancestry": [
      "External Provider Protocol"
    ],
    "text": "## 4. Plugin Registry Linker",
    "sectionText": "## 4. Plugin Registry Linker\n\nExternal discovery is data-first: the host scans a static manifest and never executes unknown provider code merely to discover what it claims.\n\nA `manifest.yaml` provider declaration declares at least: plugin ID, version, publisher, and component protocol range; provided `OperationId` values or named extension points; request/result schema references; invocation mechanism and executable/module location; requested host capabilities; platform compatibility and integrity metadata; health and post-selection `describe` operations.\n\n`manifest.yaml` is the one canonical filename for authored, static provider declarations. Its `kind` field distinguishes the declaration shape (`fgos.component`, `fgos.plugin`, `fgos.domain`, ...); every kind shares `manifestVersion`, `id`, `version`, `provides`, `requires`, `capabilities` before kind-specific fields are validated.\n\n**Registry** names only the host's derived runtime index (and its lock/cache), never another authored file. Discovery scans `manifest.yaml`, validates by `kind`, then links accepted claims into the provider registry.\n\nThe registry linker: scans configured global and project plugin locations; parses and validates manifests without running the provider; verifies compatibility, provider presence, and integrity policy; resolves IDs, namespace claims, precedence, and explicit replacements; emits a deterministic derived lock/cache for help, introspection, dispatch, init, and doctor; starts a selected provider and uses `describe` only to confirm it matches the accepted manifest.\n\nIts complete input/output physics:\n\n```txt\nauthored OperationCatalog\n+ built-in provider descriptors\n+ transitional CLI-compatibility bindings\n+ validated external manifest declarations\n+ explicit global/project enable-disable-replacement policy\n  -> immutable RegistrySnapshot + source fingerprint\n```\n\nAuthored catalogs, manifests, and policy are durable inputs; the linked registry lock/cache is rebuildable derived state — it records host version and source fingerprint, is replaced atomically, and is ignored/rebuilt when stale or corrupt. A cache never outranks its authored sources. This is a compiler only in the linking/validation sense; it does not compile plugin source or the `fgos` host binary.\n\nProject configuration overrides global configuration values, but duplicate operation claims do not silently use last-writer-wins — override precedence is not authority precedence. Ambiguity fails closed unless an explicit replacement policy names both the selected provider and the provider being replaced. Configuration can never replace a **built-in** provider (see the kernel contract's Authority section); a replacement policy only ever governs the external/plugin surface this linker discovers."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 4,
    "title": "4. Plugin Registry Linker",
    "anchor": "4-plugin-registry-linker",
    "githubAnchor": "4-plugin-registry-linker",
    "stableAnchor": "h-d847f1c4439f",
    "startLine": 157,
    "endLine": 157,
    "textDigest": "cda1c088745776953a5144a0548869d897c54e9f69dcd512de6ad8359b99ed32",
    "sample": "4. Plugin Registry Linker",
    "sectionPayloadDigest": "a208fa4696f2121b98ebf8f7320e53cf3d1820b288e3a466a8e1b65a88eb636d",
    "followingBlockDigest": "db002cc2af859f74874068b3e2db12c43f8dfe07276a1d602e1169446d3e88a8",
    "identityFingerprint": "e4237eb9a37385b91dd638586cc130db172170f5db48f402d26c015a0a883cee",
    "ancestry": [
      "Architecture: External Provider Protocol",
      "Retained selected source material",
      "External Provider Protocol"
    ],
    "text": "#### 4. Plugin Registry Linker",
    "sectionText": "#### 4. Plugin Registry Linker\n\nExternal discovery is data-first: the host scans a static manifest and never executes unknown provider code merely to discover what it claims.\n\nA `manifest.yaml` provider declaration declares at least: plugin ID, version, publisher, and component protocol range; provided `OperationId` values or named extension points; request/result schema references; invocation mechanism and executable/module location; requested host capabilities; platform compatibility and integrity metadata; health and post-selection `describe` operations.\n\n`manifest.yaml` is the one canonical filename for authored, static provider declarations. Its `kind` field distinguishes the declaration shape (`fgos.component`, `fgos.plugin`, `fgos.domain`, ...); every kind shares `manifestVersion`, `id`, `version`, `provides`, `requires`, `capabilities` before kind-specific fields are validated.\n\n**Registry** names only the host's derived runtime index (and its lock/cache), never another authored file. Discovery scans `manifest.yaml`, validates by `kind`, then links accepted claims into the provider registry.\n\n\nAdded in candidate: this retained source detail is carried verbatim in [the dropped-008 restoration](../verification/compatibility-harness.md#restored-registry-linker-procedure-and-its-input-output-formula).\n\n\n\n\nAuthored catalogs, manifests, and policy are durable inputs; the linked registry lock/cache is rebuildable derived state — it records host version and source fingerprint, is replaced atomically, and is ignored/rebuilt when stale or corrupt. A cache never outranks its authored sources. This is a compiler only in the linking/validation sense; it does not compile plugin source or the `fgos` host binary.\n\nProject configuration overrides global configuration values, but duplicate operation claims do not silently use last-writer-wins — override precedence is not authority precedence. Ambiguity fails closed unless an explicit replacement policy names both the selected provider and the provider being replaced. Configuration can never replace a **built-in** provider (see the kernel contract's Authority section); a replacement policy only ever governs the external/plugin surface this linker discovers."
  }
}
```

## Entry f-141: link-141

```json
{
  "id": "link-141",
  "path": "docs/platform/host-invocation-routing/contracts/legacy-payload.md",
  "inputLine": 54,
  "inputColumn": 23,
  "lineBeforeLinkPass": 62,
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
  "reviewStatus": "pending",
  "oldDestination": "../../../architect/host-invocation-routing/legacy-cli-transition.md",
  "newDestination": "../README.md",
  "alias": {
    "fromPath": "docs/architect/host-invocation-routing/legacy-cli-transition.md",
    "toOwner": "docs/platform/host-invocation-routing/README.md",
    "toAnchor": null,
    "kind": "redirected",
    "evidenceRef": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
    "immutableRefs": [],
    "recordedAt": "2026-10-13",
    "aliasId": "host-invocation-draft-052"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Legacy CLI Transition",
    "anchor": "legacy-cli-transition",
    "githubAnchor": "legacy-cli-transition",
    "stableAnchor": "h-dc70efc6804e",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "882786e83f6fcf97ec9230a8eb8cac4c050823310061348dd3d85cb609dbe329",
    "sample": "Legacy CLI Transition",
    "sectionPayloadDigest": "7b54ed05cfd159ebb37eed166b94ffa4c76aac3e113078bbef9683d49d647156",
    "followingBlockDigest": "ab6730b94dcd1c31dcc6afb6fffd7a83d53310f5850673f5663db952bd87f5c1",
    "identityFingerprint": "e597222ce0b65b2a68602b1aa4d9351bbfc26ee04ae227cc7b2c97817eefcd3a",
    "ancestry": [],
    "text": "# Legacy CLI Transition",
    "sectionText": "# Legacy CLI Transition\n\n**Status:** Vision / architecture advisory, not a locked platform law and not an implementation plan.\n**Date:** 2026-09-10.\n**Revised:** per [architecture-review-260910-1537-host-invocation-provider-routing-design-review.md](../../../plans/reports/architecture-review-260910-1537-host-invocation-provider-routing-design-review.md).\n\nThis document depends on the kernel contract in [Host Invocation And Provider Routing](./host-invocation-provider-routing.md) — read it first, in particular \"Transitional CLI Lane\" under §4 and `CommandRouteDescriptor` in the §3 name table. The kernel has exactly one input (`OperationRequest`) and one output (`ProviderOutcome`); everything in this document is CLI-adapter-local scaffolding that disappears once Node migration completes. Nothing here introduces a second kernel input or output type — the legacy lane never reaches the Router or `InvocationService` at all (see §1 below)."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Host Invocation",
    "anchor": "host-invocation",
    "githubAnchor": "host-invocation",
    "stableAnchor": "h-9674073175c5",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "cc682e1a901b39ba480c2a95282077b85597b0d8ee6aa24bd7dcd71c8de20739",
    "sample": "Host Invocation",
    "sectionPayloadDigest": "4906b85c6c780d8a9dcf4b69f592806ac5301cf33aa4d638e0c88c98046f9e9e",
    "followingBlockDigest": "4906b85c6c780d8a9dcf4b69f592806ac5301cf33aa4d638e0c88c98046f9e9e",
    "identityFingerprint": "2f2cd30c374c59bab51ddaebeadfb9338d8540794673fcc6fc53dfc281b37d78",
    "ancestry": [],
    "text": "# Host Invocation",
    "sectionText": "# Host Invocation\n\n```txt\nDocument type: Area portal\nAudience: Human reviewer, architect, maintainer, implementation agent\nPurpose: Route readers through fgOS host invocation, provider routing, legacy CLI transition, and external provider docs\nDesign status: Draft\nImplementation status: R1/R2/R3 implemented preview plus partial route migration\nCanonical: Yes, after review\nOwner: Platform documentation\nSource type: Promoted from docs/architect/host-invocation-routing/**\nLast reviewed: 2026-09-18\nImplementation: Existing dated R1/R2/R3 preview records; candidate carriage and current truth await independent checkpoint review\nProvenance: Six pinned legacy sources and the frozen Host Invocation area map; retained policy is non-authority history\nWriter type: Agent\nCanonical for: Promoted area navigation only; candidate document claims are not promoted by this edit\nUse this when: Finding the host invocation contract, selected migration direction and its proof boundaries\nDo not use this for: Selecting or installing a runtime, certifying current route counts, or treating dated plans as shipped code\nSupersedes: None; legacy source authority remains unchanged during candidate transformation\nSuperseded by: None\nRelated:\n- docs/platform/host-invocation-routing/vision.md\n- docs/platform/host-invocation-routing/intent-preservation-ledger.md\n- docs/platform/host-invocation-routing/spec.md\n- docs/platform/host-invocation-routing/roadmap.md\n- docs/platform/host-invocation-routing/architecture/invocation-kernel.md\n- docs/platform/host-invocation-routing/architecture/provider-routing.md\n- docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md\n- docs/platform/host-invocation-routing/contracts/operation-request-outcome.md\n- docs/platform/host-invocation-routing/contracts/command-route-descriptor.md\n- docs/platform/host-invocation-routing/verification/implementation-alignment.md\n- docs/platform/host-invocation-routing/history/source-inventory.md\n- docs/platform/host-invocation-routing/verification/source-preservation-audit.md\n- docs/platform/host-invocation-routing/decisions/README.md\n```"
  }
}
```

## Entry f-142: link-142

```json
{
  "id": "link-142",
  "path": "docs/platform/host-invocation-routing/contracts/operation-catalog.md",
  "inputLine": 39,
  "inputColumn": 25,
  "lineBeforeLinkPass": 47,
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
  "reviewStatus": "pending",
  "oldDestination": "../../../architect/host-invocation-routing/host-invocation-provider-routing.md",
  "newDestination": "../README.md",
  "alias": {
    "fromPath": "docs/architect/host-invocation-routing/host-invocation-provider-routing.md",
    "toOwner": "docs/platform/host-invocation-routing/README.md",
    "toAnchor": null,
    "kind": "redirected",
    "evidenceRef": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
    "immutableRefs": [],
    "recordedAt": "2026-10-13",
    "aliasId": "host-invocation-draft-037"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Host Invocation And Provider Routing Architecture",
    "anchor": "host-invocation-and-provider-routing-architecture",
    "githubAnchor": "host-invocation-and-provider-routing-architecture",
    "stableAnchor": "h-699de63b2a62",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "05b7c0f19374f9f956c217241c508227641d20b1c4221b348777f23611b6e7df",
    "sample": "Host Invocation And Provider Routing Architecture",
    "sectionPayloadDigest": "797624eb16ce2d9c44b3fdb73c1a8aab61651fa8d134d55a3e8d05c6e32f1f65",
    "followingBlockDigest": "b5d90a2f82ebb7b1b4cc9fb4d388233e24a26f68be6ed5ee2990b783e1a36a62",
    "identityFingerprint": "2d3ca53446822aa5d2922de7b0280861ec0662ed278325b22c3a3c9a8c9183c8",
    "ancestry": [],
    "text": "# Host Invocation And Provider Routing Architecture",
    "sectionText": "# Host Invocation And Provider Routing Architecture\n\n**Status:** Vision / architecture advisory, not a locked platform law and not an implementation plan.\n**Date:** 2026-09-10.\n**Revised:** per [architecture-review-260910-1537-host-invocation-provider-routing-design-review.md](../../../plans/reports/architecture-review-260910-1537-host-invocation-provider-routing-design-review.md).\n**Source:** Product-owner component-boundary and Node-to-Rust migration discussion.\n\nThis is the **kernel contract**: the permanent invocation/routing boundary every fgOS host uses, independent of transport (CLI, remote, chat) and provider mechanism (built-in, legacy Node, external process, WASM). Ecosystem plugin mechanics: [External Provider Protocol](./external-provider-protocol.md). Transitional Node CLI lane: [Legacy CLI Transition](./legacy-cli-transition.md). Both depend on this document. Migration staging and first proof: [Node To Rust Component Migration](./node-to-rust-component-migration.md), [Rust Host And Proof Providers Implementation Plan](./rust-cli-and-proof-components-plan.md)."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Host Invocation",
    "anchor": "host-invocation",
    "githubAnchor": "host-invocation",
    "stableAnchor": "h-9674073175c5",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "cc682e1a901b39ba480c2a95282077b85597b0d8ee6aa24bd7dcd71c8de20739",
    "sample": "Host Invocation",
    "sectionPayloadDigest": "4906b85c6c780d8a9dcf4b69f592806ac5301cf33aa4d638e0c88c98046f9e9e",
    "followingBlockDigest": "4906b85c6c780d8a9dcf4b69f592806ac5301cf33aa4d638e0c88c98046f9e9e",
    "identityFingerprint": "2f2cd30c374c59bab51ddaebeadfb9338d8540794673fcc6fc53dfc281b37d78",
    "ancestry": [],
    "text": "# Host Invocation",
    "sectionText": "# Host Invocation\n\n```txt\nDocument type: Area portal\nAudience: Human reviewer, architect, maintainer, implementation agent\nPurpose: Route readers through fgOS host invocation, provider routing, legacy CLI transition, and external provider docs\nDesign status: Draft\nImplementation status: R1/R2/R3 implemented preview plus partial route migration\nCanonical: Yes, after review\nOwner: Platform documentation\nSource type: Promoted from docs/architect/host-invocation-routing/**\nLast reviewed: 2026-09-18\nImplementation: Existing dated R1/R2/R3 preview records; candidate carriage and current truth await independent checkpoint review\nProvenance: Six pinned legacy sources and the frozen Host Invocation area map; retained policy is non-authority history\nWriter type: Agent\nCanonical for: Promoted area navigation only; candidate document claims are not promoted by this edit\nUse this when: Finding the host invocation contract, selected migration direction and its proof boundaries\nDo not use this for: Selecting or installing a runtime, certifying current route counts, or treating dated plans as shipped code\nSupersedes: None; legacy source authority remains unchanged during candidate transformation\nSuperseded by: None\nRelated:\n- docs/platform/host-invocation-routing/vision.md\n- docs/platform/host-invocation-routing/intent-preservation-ledger.md\n- docs/platform/host-invocation-routing/spec.md\n- docs/platform/host-invocation-routing/roadmap.md\n- docs/platform/host-invocation-routing/architecture/invocation-kernel.md\n- docs/platform/host-invocation-routing/architecture/provider-routing.md\n- docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md\n- docs/platform/host-invocation-routing/contracts/operation-request-outcome.md\n- docs/platform/host-invocation-routing/contracts/command-route-descriptor.md\n- docs/platform/host-invocation-routing/verification/implementation-alignment.md\n- docs/platform/host-invocation-routing/history/source-inventory.md\n- docs/platform/host-invocation-routing/verification/source-preservation-audit.md\n- docs/platform/host-invocation-routing/decisions/README.md\n```"
  }
}
```

## Entry f-143: link-143

```json
{
  "id": "link-143",
  "path": "docs/platform/host-invocation-routing/contracts/operation-request-outcome.md",
  "inputLine": 51,
  "inputColumn": 25,
  "lineBeforeLinkPass": 59,
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
  "reviewStatus": "pending",
  "oldDestination": "../../../architect/host-invocation-routing/host-invocation-provider-routing.md",
  "newDestination": "../README.md",
  "alias": {
    "fromPath": "docs/architect/host-invocation-routing/host-invocation-provider-routing.md",
    "toOwner": "docs/platform/host-invocation-routing/README.md",
    "toAnchor": null,
    "kind": "redirected",
    "evidenceRef": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
    "immutableRefs": [],
    "recordedAt": "2026-10-13",
    "aliasId": "host-invocation-draft-037"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Host Invocation And Provider Routing Architecture",
    "anchor": "host-invocation-and-provider-routing-architecture",
    "githubAnchor": "host-invocation-and-provider-routing-architecture",
    "stableAnchor": "h-699de63b2a62",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "05b7c0f19374f9f956c217241c508227641d20b1c4221b348777f23611b6e7df",
    "sample": "Host Invocation And Provider Routing Architecture",
    "sectionPayloadDigest": "797624eb16ce2d9c44b3fdb73c1a8aab61651fa8d134d55a3e8d05c6e32f1f65",
    "followingBlockDigest": "b5d90a2f82ebb7b1b4cc9fb4d388233e24a26f68be6ed5ee2990b783e1a36a62",
    "identityFingerprint": "2d3ca53446822aa5d2922de7b0280861ec0662ed278325b22c3a3c9a8c9183c8",
    "ancestry": [],
    "text": "# Host Invocation And Provider Routing Architecture",
    "sectionText": "# Host Invocation And Provider Routing Architecture\n\n**Status:** Vision / architecture advisory, not a locked platform law and not an implementation plan.\n**Date:** 2026-09-10.\n**Revised:** per [architecture-review-260910-1537-host-invocation-provider-routing-design-review.md](../../../plans/reports/architecture-review-260910-1537-host-invocation-provider-routing-design-review.md).\n**Source:** Product-owner component-boundary and Node-to-Rust migration discussion.\n\nThis is the **kernel contract**: the permanent invocation/routing boundary every fgOS host uses, independent of transport (CLI, remote, chat) and provider mechanism (built-in, legacy Node, external process, WASM). Ecosystem plugin mechanics: [External Provider Protocol](./external-provider-protocol.md). Transitional Node CLI lane: [Legacy CLI Transition](./legacy-cli-transition.md). Both depend on this document. Migration staging and first proof: [Node To Rust Component Migration](./node-to-rust-component-migration.md), [Rust Host And Proof Providers Implementation Plan](./rust-cli-and-proof-components-plan.md)."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Host Invocation",
    "anchor": "host-invocation",
    "githubAnchor": "host-invocation",
    "stableAnchor": "h-9674073175c5",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "cc682e1a901b39ba480c2a95282077b85597b0d8ee6aa24bd7dcd71c8de20739",
    "sample": "Host Invocation",
    "sectionPayloadDigest": "4906b85c6c780d8a9dcf4b69f592806ac5301cf33aa4d638e0c88c98046f9e9e",
    "followingBlockDigest": "4906b85c6c780d8a9dcf4b69f592806ac5301cf33aa4d638e0c88c98046f9e9e",
    "identityFingerprint": "2f2cd30c374c59bab51ddaebeadfb9338d8540794673fcc6fc53dfc281b37d78",
    "ancestry": [],
    "text": "# Host Invocation",
    "sectionText": "# Host Invocation\n\n```txt\nDocument type: Area portal\nAudience: Human reviewer, architect, maintainer, implementation agent\nPurpose: Route readers through fgOS host invocation, provider routing, legacy CLI transition, and external provider docs\nDesign status: Draft\nImplementation status: R1/R2/R3 implemented preview plus partial route migration\nCanonical: Yes, after review\nOwner: Platform documentation\nSource type: Promoted from docs/architect/host-invocation-routing/**\nLast reviewed: 2026-09-18\nImplementation: Existing dated R1/R2/R3 preview records; candidate carriage and current truth await independent checkpoint review\nProvenance: Six pinned legacy sources and the frozen Host Invocation area map; retained policy is non-authority history\nWriter type: Agent\nCanonical for: Promoted area navigation only; candidate document claims are not promoted by this edit\nUse this when: Finding the host invocation contract, selected migration direction and its proof boundaries\nDo not use this for: Selecting or installing a runtime, certifying current route counts, or treating dated plans as shipped code\nSupersedes: None; legacy source authority remains unchanged during candidate transformation\nSuperseded by: None\nRelated:\n- docs/platform/host-invocation-routing/vision.md\n- docs/platform/host-invocation-routing/intent-preservation-ledger.md\n- docs/platform/host-invocation-routing/spec.md\n- docs/platform/host-invocation-routing/roadmap.md\n- docs/platform/host-invocation-routing/architecture/invocation-kernel.md\n- docs/platform/host-invocation-routing/architecture/provider-routing.md\n- docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md\n- docs/platform/host-invocation-routing/contracts/operation-request-outcome.md\n- docs/platform/host-invocation-routing/contracts/command-route-descriptor.md\n- docs/platform/host-invocation-routing/verification/implementation-alignment.md\n- docs/platform/host-invocation-routing/history/source-inventory.md\n- docs/platform/host-invocation-routing/verification/source-preservation-audit.md\n- docs/platform/host-invocation-routing/decisions/README.md\n```"
  }
}
```

## Entry f-144: link-144

```json
{
  "id": "link-144",
  "path": "docs/platform/host-invocation-routing/intent-preservation-ledger.md",
  "inputLine": 57,
  "inputColumn": 160,
  "lineBeforeLinkPass": 65,
  "before": "[host-invocation-provider-routing.md](../../architect/host-invocation-routing/host-invocation-provider-routing.md#1-architecture-name)",
  "after": "[host-invocation-provider-routing.md](spec.md#1-architecture-name)",
  "legacyPath": "docs/architect/host-invocation-routing/host-invocation-provider-routing.md",
  "target": {
    "path": "docs/platform/host-invocation-routing/spec.md",
    "anchor": "1-architecture-name",
    "aliasId": "host-invocation-draft-040"
  },
  "portal": false,
  "area": "host-invocation-routing",
  "reviewStatus": "pending",
  "oldDestination": "../../architect/host-invocation-routing/host-invocation-provider-routing.md#1-architecture-name",
  "newDestination": "spec.md#1-architecture-name",
  "alias": {
    "fromPath": "docs/architect/host-invocation-routing/host-invocation-provider-routing.md#1-architecture-name",
    "toOwner": "docs/platform/host-invocation-routing/spec.md",
    "toAnchor": "1-architecture-name",
    "kind": "redirected",
    "evidenceRef": "plans/260925-documentation-authority-unification/reports/phase-06/review-3-checkpoint-host-invocation.md",
    "immutableRefs": [],
    "recordedAt": "2026-10-13",
    "aliasId": "host-invocation-draft-040"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 2,
    "title": "1. Architecture Name",
    "anchor": "1-architecture-name",
    "githubAnchor": "1-architecture-name",
    "stableAnchor": "h-9f14f30aa349",
    "startLine": 24,
    "endLine": 24,
    "textDigest": "a80f155cfc7bd450fd26fa382e9db7e023ba947d2b2f060ccc8ecf63cd060a87",
    "sample": "1. Architecture Name",
    "sectionPayloadDigest": "878f2de87f1215fe19329730f8eac7bdc9036b9f23e6717a76531f3b31629927",
    "followingBlockDigest": "32916e9588f39ae68a35a1ff0999655fc82b1f34310657518907f22b5a03390b",
    "identityFingerprint": "39134397968d85f019feaddf251f4414b8a167a0df428517e551a936210cf76f",
    "ancestry": [
      "Host Invocation And Provider Routing Architecture"
    ],
    "text": "## 1. Architecture Name",
    "sectionText": "## 1. Architecture Name\n\nNamed **Host Invocation And Provider Routing**; central component the **Operation Provider Router**. `Component Router` is avoided — not every component is a dispatchable provider. `Command Router` is avoided — commands are only a CLI projection of semantic operations.\n\n```txt\nhost invocation  -> a transport-specific host use case admits/normalizes a request\nprovider routing -> the Operation Provider Router selects an implementation\n```"
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 4,
    "title": "1. Architecture Name",
    "anchor": "1-architecture-name",
    "githubAnchor": "1-architecture-name",
    "stableAnchor": "h-f666dc439857",
    "startLine": 132,
    "endLine": 132,
    "textDigest": "66ff0f743ebf9bcd10d95e173c199df6d211da40584d531fe47d2f496f964fd4",
    "sample": "1. Architecture Name",
    "sectionPayloadDigest": "878f2de87f1215fe19329730f8eac7bdc9036b9f23e6717a76531f3b31629927",
    "followingBlockDigest": "32916e9588f39ae68a35a1ff0999655fc82b1f34310657518907f22b5a03390b",
    "identityFingerprint": "efaf45af51df92e205e6c3024e804991b0b790ac7f78acc0a04042c20ed4c2e8",
    "ancestry": [
      "Spec: Host Invocation",
      "Retained selected source material",
      "Host Invocation And Provider Routing Architecture"
    ],
    "text": "#### 1. Architecture Name",
    "sectionText": "#### 1. Architecture Name\n\nNamed **Host Invocation And Provider Routing**; central component the **Operation Provider Router**. `Component Router` is avoided — not every component is a dispatchable provider. `Command Router` is avoided — commands are only a CLI projection of semantic operations.\n\n```txt\nhost invocation  -> a transport-specific host use case admits/normalizes a request\nprovider routing -> the Operation Provider Router selects an implementation\n```"
  }
}
```

## Entry f-145: link-145

```json
{
  "id": "link-145",
  "path": "docs/platform/host-invocation-routing/intent-preservation-ledger.md",
  "inputLine": 58,
  "inputColumn": 138,
  "lineBeforeLinkPass": 66,
  "before": "[host-invocation-provider-routing.md](../../architect/host-invocation-routing/host-invocation-provider-routing.md#1-architecture-name)",
  "after": "[host-invocation-provider-routing.md](spec.md#1-architecture-name)",
  "legacyPath": "docs/architect/host-invocation-routing/host-invocation-provider-routing.md",
  "target": {
    "path": "docs/platform/host-invocation-routing/spec.md",
    "anchor": "1-architecture-name",
    "aliasId": "host-invocation-draft-040"
  },
  "portal": false,
  "area": "host-invocation-routing",
  "reviewStatus": "pending",
  "oldDestination": "../../architect/host-invocation-routing/host-invocation-provider-routing.md#1-architecture-name",
  "newDestination": "spec.md#1-architecture-name",
  "alias": {
    "fromPath": "docs/architect/host-invocation-routing/host-invocation-provider-routing.md#1-architecture-name",
    "toOwner": "docs/platform/host-invocation-routing/spec.md",
    "toAnchor": "1-architecture-name",
    "kind": "redirected",
    "evidenceRef": "plans/260925-documentation-authority-unification/reports/phase-06/review-3-checkpoint-host-invocation.md",
    "immutableRefs": [],
    "recordedAt": "2026-10-13",
    "aliasId": "host-invocation-draft-040"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 2,
    "title": "1. Architecture Name",
    "anchor": "1-architecture-name",
    "githubAnchor": "1-architecture-name",
    "stableAnchor": "h-9f14f30aa349",
    "startLine": 24,
    "endLine": 24,
    "textDigest": "a80f155cfc7bd450fd26fa382e9db7e023ba947d2b2f060ccc8ecf63cd060a87",
    "sample": "1. Architecture Name",
    "sectionPayloadDigest": "878f2de87f1215fe19329730f8eac7bdc9036b9f23e6717a76531f3b31629927",
    "followingBlockDigest": "32916e9588f39ae68a35a1ff0999655fc82b1f34310657518907f22b5a03390b",
    "identityFingerprint": "39134397968d85f019feaddf251f4414b8a167a0df428517e551a936210cf76f",
    "ancestry": [
      "Host Invocation And Provider Routing Architecture"
    ],
    "text": "## 1. Architecture Name",
    "sectionText": "## 1. Architecture Name\n\nNamed **Host Invocation And Provider Routing**; central component the **Operation Provider Router**. `Component Router` is avoided — not every component is a dispatchable provider. `Command Router` is avoided — commands are only a CLI projection of semantic operations.\n\n```txt\nhost invocation  -> a transport-specific host use case admits/normalizes a request\nprovider routing -> the Operation Provider Router selects an implementation\n```"
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 4,
    "title": "1. Architecture Name",
    "anchor": "1-architecture-name",
    "githubAnchor": "1-architecture-name",
    "stableAnchor": "h-f666dc439857",
    "startLine": 132,
    "endLine": 132,
    "textDigest": "66ff0f743ebf9bcd10d95e173c199df6d211da40584d531fe47d2f496f964fd4",
    "sample": "1. Architecture Name",
    "sectionPayloadDigest": "878f2de87f1215fe19329730f8eac7bdc9036b9f23e6717a76531f3b31629927",
    "followingBlockDigest": "32916e9588f39ae68a35a1ff0999655fc82b1f34310657518907f22b5a03390b",
    "identityFingerprint": "efaf45af51df92e205e6c3024e804991b0b790ac7f78acc0a04042c20ed4c2e8",
    "ancestry": [
      "Spec: Host Invocation",
      "Retained selected source material",
      "Host Invocation And Provider Routing Architecture"
    ],
    "text": "#### 1. Architecture Name",
    "sectionText": "#### 1. Architecture Name\n\nNamed **Host Invocation And Provider Routing**; central component the **Operation Provider Router**. `Component Router` is avoided — not every component is a dispatchable provider. `Command Router` is avoided — commands are only a CLI projection of semantic operations.\n\n```txt\nhost invocation  -> a transport-specific host use case admits/normalizes a request\nprovider routing -> the Operation Provider Router selects an implementation\n```"
  }
}
```

## Entry f-146: link-146

```json
{
  "id": "link-146",
  "path": "docs/platform/host-invocation-routing/intent-preservation-ledger.md",
  "inputLine": 59,
  "inputColumn": 116,
  "lineBeforeLinkPass": 67,
  "before": "[host-invocation-provider-routing.md](../../architect/host-invocation-routing/host-invocation-provider-routing.md#4-peer-host-use-cases)",
  "after": "[host-invocation-provider-routing.md](spec.md#4-peer-host-use-cases)",
  "legacyPath": "docs/architect/host-invocation-routing/host-invocation-provider-routing.md",
  "target": {
    "path": "docs/platform/host-invocation-routing/spec.md",
    "anchor": "4-peer-host-use-cases",
    "aliasId": "host-invocation-draft-043"
  },
  "portal": false,
  "area": "host-invocation-routing",
  "reviewStatus": "pending",
  "oldDestination": "../../architect/host-invocation-routing/host-invocation-provider-routing.md#4-peer-host-use-cases",
  "newDestination": "spec.md#4-peer-host-use-cases",
  "alias": {
    "fromPath": "docs/architect/host-invocation-routing/host-invocation-provider-routing.md#4-peer-host-use-cases",
    "toOwner": "docs/platform/host-invocation-routing/spec.md",
    "toAnchor": "4-peer-host-use-cases",
    "kind": "redirected",
    "evidenceRef": "plans/260925-documentation-authority-unification/reports/phase-06/review-3-checkpoint-host-invocation.md",
    "immutableRefs": [],
    "recordedAt": "2026-10-13",
    "aliasId": "host-invocation-draft-043"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 2,
    "title": "4. Peer Host Use Cases",
    "anchor": "4-peer-host-use-cases",
    "githubAnchor": "4-peer-host-use-cases",
    "stableAnchor": "h-7c373f0a2a9f",
    "startLine": 61,
    "endLine": 61,
    "textDigest": "4977027e6986b231fccb7e38119ec13b321878e4cdbbd54ecf31e65b7ddfaceb",
    "sample": "4. Peer Host Use Cases",
    "sectionPayloadDigest": "354d72395b65c45f9b6f3bcf626c7f76f4532bda9948d03bf76bd76779c4acfe",
    "followingBlockDigest": "1bca3e6e539055095d6f4343ce2ebd8cbf2a038e2c180124c6c231edbd8b9015",
    "identityFingerprint": "9904e61bc51e1f4f9a97f6f03ef06b39c72341f98f99041d625874f31ef23597",
    "ancestry": [
      "Host Invocation And Provider Routing Architecture"
    ],
    "text": "## 4. Peer Host Use Cases",
    "sectionText": "## 4. Peer Host Use Cases\n\n`cli-host-use-case`, `remote-host-use-case`, and `chat-host-use-case` are peers; none wraps, shells out to, or calls through another.\n\n```mermaid\nflowchart LR\n    CLI[CLI adapter] --> LOOKUP[CommandRouteDescriptor lookup]\n    LOOKUP -. legacy-cli: exec Node payload .-> NODE[Node payload]\n    LOOKUP --> CH[cli-host-use-case]\n    REM[REST / MCP adapter] --> RH[remote-host-use-case]\n    CHAT[Chat adapter] --> HH[chat-host-use-case]\n    CH --> REQ[OperationRequest]\n    RH --> REQ\n    HH --> REQ\n    REQ --> INV[InvocationService: admit]\n    INV --> ROUTER[Router: select]\n    ROUTER --> GRANT[InvocationService: grant + invoke]\n    GRANT --> PROV[BuiltIn / LegacySemantic / External process / WASM]\n    PROV --> OUT[ProviderOutcome]\n    OUT --> PRES[CLI / Remote / Chat presenter]\n```\n\nThe dashed lookup/direct-exec arrow to \"Node payload\" is the only non-`OperationRequest`/`ProviderOutcome` path and never touches `InvocationService` or the router — see \"Transitional CLI Lane\" below.\n\n| Host use case | Owns | Never does |\n|---|---|---|\n| `cli-host-use-case` | CLI options; verb -> `OperationId`; terminal stdio; `fgos.v1`/exit-code presentation; `CommandRouteDescriptor` lookup. | Own an operation's implementation; define the plugin ABI. |\n| `remote-host-use-case` | Remote caller context; REST/MCP method -> `OperationId`; deadlines/disconnect/stream lifecycle; response projection. | Invoke the CLI; parse argv; treat `fgos.v1`/HTTP as an internal API; spawn `bin/fgos.mjs`. |\n| `chat-host-use-case` | Chat caller/session context; intent -> `OperationId`; clarification/progress/interruption; response projection. | Invoke the CLI/remote host; parse argv; treat `fgos.v1`/HTTP as an internal API. |\n\nR3's remote peer is the project-local gateway (current herdr, same release) — §10 has the future shared-gateway constraint.\n\n**Shared boundary:** all three projectors build the same `HostInvocation`/`OperationRequest` and call one `InvocationService` — deliberate reuse, not wrapping; presenters stay separate per transport. Peer status does not require one OS process — separate binaries each compose the same host-runtime crate rather than calling another host.\n\n**Transitional CLI lane:** the legacy Node lane lives in the CLI adapter, not the kernel — the kernel has exactly one input/output pair. The CLI adapter looks up `CommandRouteDescriptor[selector]`: `legacy-cli` execs the Node payload directly (argv preserved, inherited stdin/cwd/env, signal forwarding, one invocation record) without building an `OperationRequest`; `native` builds one and calls `InvocationService`. Mechanics: [Legacy CLI Transition](./legacy-cli-transition.md)."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 4,
    "title": "4. Peer Host Use Cases",
    "anchor": "4-peer-host-use-cases",
    "githubAnchor": "4-peer-host-use-cases",
    "stableAnchor": "h-6505093273bd",
    "startLine": 169,
    "endLine": 169,
    "textDigest": "3011b3a88498fb5caf898dfe71c9febab1761b5ffcc9ab728f0bc01373d61108",
    "sample": "4. Peer Host Use Cases",
    "sectionPayloadDigest": "9afbd42d078ad794e2752e9ea595bb41fdc89354ed79e5752c4601fa03a8ac93",
    "followingBlockDigest": "1bca3e6e539055095d6f4343ce2ebd8cbf2a038e2c180124c6c231edbd8b9015",
    "identityFingerprint": "f85ae05c941acb5cfb565d3c4d9393e8a1efbe176cca83bd4e0f4bde1c5e2b5b",
    "ancestry": [
      "Spec: Host Invocation",
      "Retained selected source material",
      "Host Invocation And Provider Routing Architecture"
    ],
    "text": "#### 4. Peer Host Use Cases",
    "sectionText": "#### 4. Peer Host Use Cases\n\n`cli-host-use-case`, `remote-host-use-case`, and `chat-host-use-case` are peers; none wraps, shells out to, or calls through another.\n\n```mermaid\nflowchart LR\n    CLI[CLI adapter] --> LOOKUP[CommandRouteDescriptor lookup]\n    LOOKUP -. legacy-cli: exec Node payload .-> NODE[Node payload]\n    LOOKUP --> CH[cli-host-use-case]\n    REM[REST / MCP adapter] --> RH[remote-host-use-case]\n    CHAT[Chat adapter] --> HH[chat-host-use-case]\n    CH --> REQ[OperationRequest]\n    RH --> REQ\n    HH --> REQ\n    REQ --> INV[InvocationService: admit]\n    INV --> ROUTER[Router: select]\n    ROUTER --> GRANT[InvocationService: grant + invoke]\n    GRANT --> PROV[BuiltIn / LegacySemantic / External process / WASM]\n    PROV --> OUT[ProviderOutcome]\n    OUT --> PRES[CLI / Remote / Chat presenter]\n```\n\nThe dashed lookup/direct-exec arrow to \"Node payload\" is the only non-`OperationRequest`/`ProviderOutcome` path and never touches `InvocationService` or the router — see \"Transitional CLI Lane\" below.\n\n| Host use case | Owns | Never does |\n|---|---|---|\n| `cli-host-use-case` | CLI options; verb -> `OperationId`; terminal stdio; `fgos.v1`/exit-code presentation; `CommandRouteDescriptor` lookup. | Own an operation's implementation; define the plugin ABI. |\n| `remote-host-use-case` | Remote caller context; REST/MCP method -> `OperationId`; deadlines/disconnect/stream lifecycle; response projection. | Invoke the CLI; parse argv; treat `fgos.v1`/HTTP as an internal API; spawn `bin/fgos.mjs`. |\n| `chat-host-use-case` | Chat caller/session context; intent -> `OperationId`; clarification/progress/interruption; response projection. | Invoke the CLI/remote host; parse argv; treat `fgos.v1`/HTTP as an internal API. |\n\nR3's remote peer is the project-local gateway (current herdr, same release) — §10 has the future shared-gateway constraint.\n\n**Shared boundary:** all three projectors build the same `HostInvocation`/`OperationRequest` and call one `InvocationService` — deliberate reuse, not wrapping; presenters stay separate per transport. Peer status does not require one OS process — separate binaries each compose the same host-runtime crate rather than calling another host.\n\n**Transitional CLI lane:** the legacy Node lane lives in the CLI adapter, not the kernel — the kernel has exactly one input/output pair. The CLI adapter looks up `CommandRouteDescriptor[selector]`: `legacy-cli` execs the Node payload directly (argv preserved, inherited stdin/cwd/env, signal forwarding, one invocation record) without building an `OperationRequest`; `native` builds one and calls `InvocationService`. Mechanics: [Legacy CLI Transition](architecture/legacy-cli-transition.md)."
  }
}
```

## Entry f-147: link-147

```json
{
  "id": "link-147",
  "path": "docs/platform/host-invocation-routing/intent-preservation-ledger.md",
  "inputLine": 60,
  "inputColumn": 141,
  "lineBeforeLinkPass": 68,
  "before": "[host-invocation-provider-routing.md](../../architect/host-invocation-routing/host-invocation-provider-routing.md#4-peer-host-use-cases)",
  "after": "[host-invocation-provider-routing.md](spec.md#4-peer-host-use-cases)",
  "legacyPath": "docs/architect/host-invocation-routing/host-invocation-provider-routing.md",
  "target": {
    "path": "docs/platform/host-invocation-routing/spec.md",
    "anchor": "4-peer-host-use-cases",
    "aliasId": "host-invocation-draft-043"
  },
  "portal": false,
  "area": "host-invocation-routing",
  "reviewStatus": "pending",
  "oldDestination": "../../architect/host-invocation-routing/host-invocation-provider-routing.md#4-peer-host-use-cases",
  "newDestination": "spec.md#4-peer-host-use-cases",
  "alias": {
    "fromPath": "docs/architect/host-invocation-routing/host-invocation-provider-routing.md#4-peer-host-use-cases",
    "toOwner": "docs/platform/host-invocation-routing/spec.md",
    "toAnchor": "4-peer-host-use-cases",
    "kind": "redirected",
    "evidenceRef": "plans/260925-documentation-authority-unification/reports/phase-06/review-3-checkpoint-host-invocation.md",
    "immutableRefs": [],
    "recordedAt": "2026-10-13",
    "aliasId": "host-invocation-draft-043"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 2,
    "title": "4. Peer Host Use Cases",
    "anchor": "4-peer-host-use-cases",
    "githubAnchor": "4-peer-host-use-cases",
    "stableAnchor": "h-7c373f0a2a9f",
    "startLine": 61,
    "endLine": 61,
    "textDigest": "4977027e6986b231fccb7e38119ec13b321878e4cdbbd54ecf31e65b7ddfaceb",
    "sample": "4. Peer Host Use Cases",
    "sectionPayloadDigest": "354d72395b65c45f9b6f3bcf626c7f76f4532bda9948d03bf76bd76779c4acfe",
    "followingBlockDigest": "1bca3e6e539055095d6f4343ce2ebd8cbf2a038e2c180124c6c231edbd8b9015",
    "identityFingerprint": "9904e61bc51e1f4f9a97f6f03ef06b39c72341f98f99041d625874f31ef23597",
    "ancestry": [
      "Host Invocation And Provider Routing Architecture"
    ],
    "text": "## 4. Peer Host Use Cases",
    "sectionText": "## 4. Peer Host Use Cases\n\n`cli-host-use-case`, `remote-host-use-case`, and `chat-host-use-case` are peers; none wraps, shells out to, or calls through another.\n\n```mermaid\nflowchart LR\n    CLI[CLI adapter] --> LOOKUP[CommandRouteDescriptor lookup]\n    LOOKUP -. legacy-cli: exec Node payload .-> NODE[Node payload]\n    LOOKUP --> CH[cli-host-use-case]\n    REM[REST / MCP adapter] --> RH[remote-host-use-case]\n    CHAT[Chat adapter] --> HH[chat-host-use-case]\n    CH --> REQ[OperationRequest]\n    RH --> REQ\n    HH --> REQ\n    REQ --> INV[InvocationService: admit]\n    INV --> ROUTER[Router: select]\n    ROUTER --> GRANT[InvocationService: grant + invoke]\n    GRANT --> PROV[BuiltIn / LegacySemantic / External process / WASM]\n    PROV --> OUT[ProviderOutcome]\n    OUT --> PRES[CLI / Remote / Chat presenter]\n```\n\nThe dashed lookup/direct-exec arrow to \"Node payload\" is the only non-`OperationRequest`/`ProviderOutcome` path and never touches `InvocationService` or the router — see \"Transitional CLI Lane\" below.\n\n| Host use case | Owns | Never does |\n|---|---|---|\n| `cli-host-use-case` | CLI options; verb -> `OperationId`; terminal stdio; `fgos.v1`/exit-code presentation; `CommandRouteDescriptor` lookup. | Own an operation's implementation; define the plugin ABI. |\n| `remote-host-use-case` | Remote caller context; REST/MCP method -> `OperationId`; deadlines/disconnect/stream lifecycle; response projection. | Invoke the CLI; parse argv; treat `fgos.v1`/HTTP as an internal API; spawn `bin/fgos.mjs`. |\n| `chat-host-use-case` | Chat caller/session context; intent -> `OperationId`; clarification/progress/interruption; response projection. | Invoke the CLI/remote host; parse argv; treat `fgos.v1`/HTTP as an internal API. |\n\nR3's remote peer is the project-local gateway (current herdr, same release) — §10 has the future shared-gateway constraint.\n\n**Shared boundary:** all three projectors build the same `HostInvocation`/`OperationRequest` and call one `InvocationService` — deliberate reuse, not wrapping; presenters stay separate per transport. Peer status does not require one OS process — separate binaries each compose the same host-runtime crate rather than calling another host.\n\n**Transitional CLI lane:** the legacy Node lane lives in the CLI adapter, not the kernel — the kernel has exactly one input/output pair. The CLI adapter looks up `CommandRouteDescriptor[selector]`: `legacy-cli` execs the Node payload directly (argv preserved, inherited stdin/cwd/env, signal forwarding, one invocation record) without building an `OperationRequest`; `native` builds one and calls `InvocationService`. Mechanics: [Legacy CLI Transition](./legacy-cli-transition.md)."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 4,
    "title": "4. Peer Host Use Cases",
    "anchor": "4-peer-host-use-cases",
    "githubAnchor": "4-peer-host-use-cases",
    "stableAnchor": "h-6505093273bd",
    "startLine": 169,
    "endLine": 169,
    "textDigest": "3011b3a88498fb5caf898dfe71c9febab1761b5ffcc9ab728f0bc01373d61108",
    "sample": "4. Peer Host Use Cases",
    "sectionPayloadDigest": "9afbd42d078ad794e2752e9ea595bb41fdc89354ed79e5752c4601fa03a8ac93",
    "followingBlockDigest": "1bca3e6e539055095d6f4343ce2ebd8cbf2a038e2c180124c6c231edbd8b9015",
    "identityFingerprint": "f85ae05c941acb5cfb565d3c4d9393e8a1efbe176cca83bd4e0f4bde1c5e2b5b",
    "ancestry": [
      "Spec: Host Invocation",
      "Retained selected source material",
      "Host Invocation And Provider Routing Architecture"
    ],
    "text": "#### 4. Peer Host Use Cases",
    "sectionText": "#### 4. Peer Host Use Cases\n\n`cli-host-use-case`, `remote-host-use-case`, and `chat-host-use-case` are peers; none wraps, shells out to, or calls through another.\n\n```mermaid\nflowchart LR\n    CLI[CLI adapter] --> LOOKUP[CommandRouteDescriptor lookup]\n    LOOKUP -. legacy-cli: exec Node payload .-> NODE[Node payload]\n    LOOKUP --> CH[cli-host-use-case]\n    REM[REST / MCP adapter] --> RH[remote-host-use-case]\n    CHAT[Chat adapter] --> HH[chat-host-use-case]\n    CH --> REQ[OperationRequest]\n    RH --> REQ\n    HH --> REQ\n    REQ --> INV[InvocationService: admit]\n    INV --> ROUTER[Router: select]\n    ROUTER --> GRANT[InvocationService: grant + invoke]\n    GRANT --> PROV[BuiltIn / LegacySemantic / External process / WASM]\n    PROV --> OUT[ProviderOutcome]\n    OUT --> PRES[CLI / Remote / Chat presenter]\n```\n\nThe dashed lookup/direct-exec arrow to \"Node payload\" is the only non-`OperationRequest`/`ProviderOutcome` path and never touches `InvocationService` or the router — see \"Transitional CLI Lane\" below.\n\n| Host use case | Owns | Never does |\n|---|---|---|\n| `cli-host-use-case` | CLI options; verb -> `OperationId`; terminal stdio; `fgos.v1`/exit-code presentation; `CommandRouteDescriptor` lookup. | Own an operation's implementation; define the plugin ABI. |\n| `remote-host-use-case` | Remote caller context; REST/MCP method -> `OperationId`; deadlines/disconnect/stream lifecycle; response projection. | Invoke the CLI; parse argv; treat `fgos.v1`/HTTP as an internal API; spawn `bin/fgos.mjs`. |\n| `chat-host-use-case` | Chat caller/session context; intent -> `OperationId`; clarification/progress/interruption; response projection. | Invoke the CLI/remote host; parse argv; treat `fgos.v1`/HTTP as an internal API. |\n\nR3's remote peer is the project-local gateway (current herdr, same release) — §10 has the future shared-gateway constraint.\n\n**Shared boundary:** all three projectors build the same `HostInvocation`/`OperationRequest` and call one `InvocationService` — deliberate reuse, not wrapping; presenters stay separate per transport. Peer status does not require one OS process — separate binaries each compose the same host-runtime crate rather than calling another host.\n\n**Transitional CLI lane:** the legacy Node lane lives in the CLI adapter, not the kernel — the kernel has exactly one input/output pair. The CLI adapter looks up `CommandRouteDescriptor[selector]`: `legacy-cli` execs the Node payload directly (argv preserved, inherited stdin/cwd/env, signal forwarding, one invocation record) without building an `OperationRequest`; `native` builds one and calls `InvocationService`. Mechanics: [Legacy CLI Transition](architecture/legacy-cli-transition.md)."
  }
}
```

## Entry f-148: link-148

```json
{
  "id": "link-148",
  "path": "docs/platform/host-invocation-routing/intent-preservation-ledger.md",
  "inputLine": 60,
  "inputColumn": 279,
  "lineBeforeLinkPass": 68,
  "before": "[legacy-cli-transition.md](../../architect/host-invocation-routing/legacy-cli-transition.md#1-two-distinct-adapters)",
  "after": "[legacy-cli-transition.md](architecture/legacy-cli-transition.md#1-two-distinct-adapters)",
  "legacyPath": "docs/architect/host-invocation-routing/legacy-cli-transition.md",
  "target": {
    "path": "docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md",
    "anchor": "1-two-distinct-adapters",
    "aliasId": "host-invocation-draft-055"
  },
  "portal": false,
  "area": "host-invocation-routing",
  "reviewStatus": "pending",
  "oldDestination": "../../architect/host-invocation-routing/legacy-cli-transition.md#1-two-distinct-adapters",
  "newDestination": "architecture/legacy-cli-transition.md#1-two-distinct-adapters",
  "alias": {
    "fromPath": "docs/architect/host-invocation-routing/legacy-cli-transition.md#1-two-distinct-adapters",
    "toOwner": "docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md",
    "toAnchor": "1-two-distinct-adapters",
    "kind": "split",
    "evidenceRef": "plans/260925-documentation-authority-unification/reports/phase-06/review-3-rework-source.md",
    "immutableRefs": [],
    "recordedAt": "2026-10-13",
    "aliasId": "host-invocation-draft-055"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 2,
    "title": "1. Two Distinct Adapters",
    "anchor": "1-two-distinct-adapters",
    "githubAnchor": "1-two-distinct-adapters",
    "stableAnchor": "h-3b77f5ee1116",
    "startLine": 20,
    "endLine": 20,
    "textDigest": "fee7e29c8f6886025098180b705008f43d5a3198943485c0256f5645b9cdc0fd",
    "sample": "1. Two Distinct Adapters",
    "sectionPayloadDigest": "7a781dca80d86a7816255fbc133dc57bf26194a856d63d70a7856972c45a1185",
    "followingBlockDigest": "070eef9281dcde7aac4cd065ac319c4eb601c82df284dce49286419ad23ec684",
    "identityFingerprint": "6ceb8083a826909eee8f7e9f476596b25f66f436bd9af2d3d1ebb0f01ccd973b",
    "ancestry": [
      "Legacy CLI Transition"
    ],
    "text": "## 1. Two Distinct Adapters",
    "sectionText": "## 1. Two Distinct Adapters\n\nNode transition needs two adapters with different contracts. Treating them as one provider would create the false impression that captured CLI output is a semantic result.\n\n**`LegacyCliPassthroughProvider`** — CLI-only. Receives preserved `OsString` argv, inherited stdin, cwd/environment, and signal context; returns pre-rendered stdout/stderr bytes plus process exit/signal termination. It never returns `ProviderOutcome` and is never reachable from remote or chat hosts. This is the only adapter most legacy commands need: the CLI adapter looks up `CommandRouteDescriptor[selector]`, and for `route_kind == legacy-cli` execs the Node payload directly (argv preserved, signal forwarding) and writes one invocation record through the shared recorder — without ever building an `OperationRequest` or calling `InvocationService`/Router.\n\n**`LegacySemanticProvider`** — receives and returns real versioned semantic contracts (`OperationRequest`/`ProviderOutcome`). Its Node bridge calls an extracted Node use case directly, never `bin/fgos.mjs` and never an envelope parser. It can serve any admitted host and is introduced per operation only when a non-CLI host needs Node behavior before the native provider exists. Unlike the passthrough, this adapter *is* a normal `OperationProvider` participant in the kernel pipeline (admit -> select -> grant -> invoke -> normalize -> record) — it is \"legacy\" only in that its implementation still calls into Node.\n\nCapturing stdout/stderr in a supervised child improves CLI cancellation and tracing but remains passthrough presentation; it never becomes the bridge used by a remote host.\n\nBoth adapters delegate a complete use case. A host must not split one state transaction between native and legacy providers unless a component contract already defines locking, atomicity, recovery, and authority at that boundary.\n\nThe adapters resolve the legacy payload relative to the installed host, never from the caller's cwd, and invoke the Node entry/bridge directly rather than spawning `fgos` recursively. The CLI parent forwards termination consistently; Unix signal equivalence and Windows process-tree behavior are explicit target-specific compatibility tests, not an undocumented `exit.code()` guess."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 4,
    "title": "1. Two Distinct Adapters",
    "anchor": "1-two-distinct-adapters",
    "githubAnchor": "1-two-distinct-adapters",
    "stableAnchor": "h-25d9e376a2ff",
    "startLine": 80,
    "endLine": 80,
    "textDigest": "49afb148ce5b49502adacce9e063c07b40e58fb0981db00e6b2d9048a726d90d",
    "sample": "1. Two Distinct Adapters",
    "sectionPayloadDigest": "58a6459f9e8bf0faa05025f675179c86a73fcd6fb2fe89d8d61152829e9b941a",
    "followingBlockDigest": "070eef9281dcde7aac4cd065ac319c4eb601c82df284dce49286419ad23ec684",
    "identityFingerprint": "7b7f0308b090718c036390dcdbe7306f91e83ec1c294866ae1eb69fb26e8c233",
    "ancestry": [
      "Architecture: Legacy CLI Transition",
      "Retained selected source material",
      "Legacy CLI Transition"
    ],
    "text": "#### 1. Two Distinct Adapters",
    "sectionText": "#### 1. Two Distinct Adapters\n\nNode transition needs two adapters with different contracts. Treating them as one provider would create the false impression that captured CLI output is a semantic result.\n\n**`LegacyCliPassthroughProvider`** — CLI-only. Receives preserved `OsString` argv, inherited stdin, cwd/environment, and signal context; returns pre-rendered stdout/stderr bytes plus process exit/signal termination. It never returns `ProviderOutcome` and is never reachable from remote or chat hosts. This is the only adapter most legacy commands need: the CLI adapter looks up `CommandRouteDescriptor[selector]`, and for `route_kind == legacy-cli` execs the Node payload directly (argv preserved, signal forwarding) and writes one invocation record through the shared recorder — without ever building an `OperationRequest` or calling `InvocationService`/Router.\n\n**`LegacySemanticProvider`** — receives and returns real versioned semantic contracts (`OperationRequest`/`ProviderOutcome`). Its Node bridge calls an extracted Node use case directly, never `bin/fgos.mjs` and never an envelope parser. It can serve any admitted host and is introduced per operation only when a non-CLI host needs Node behavior before the native provider exists. Unlike the passthrough, this adapter *is* a normal `OperationProvider` participant in the kernel pipeline (admit -> select -> grant -> invoke -> normalize -> record) — it is \"legacy\" only in that its implementation still calls into Node.\n\nCapturing stdout/stderr in a supervised child improves CLI cancellation and tracing but remains passthrough presentation; it never becomes the bridge used by a remote host.\n\n\nAdded in candidate: this retained source detail is carried verbatim in [the dropped-009 restoration](../contracts/component-protocol.md#restored-both-adapters-delegate-a-complete-use-case).\n\n\nThe adapters resolve the legacy payload relative to the installed host, never from the caller's cwd, and invoke the Node entry/bridge directly rather than spawning `fgos` recursively. The CLI parent forwards termination consistently; Unix signal equivalence and Windows process-tree behavior are explicit target-specific compatibility tests, not an undocumented `exit.code()` guess."
  }
}
```

## Entry f-149: link-149

```json
{
  "id": "link-149",
  "path": "docs/platform/host-invocation-routing/intent-preservation-ledger.md",
  "inputLine": 61,
  "inputColumn": 363,
  "lineBeforeLinkPass": 69,
  "before": "[host-invocation-provider-routing.md](../../architect/host-invocation-routing/host-invocation-provider-routing.md#3-canonical-names)",
  "after": "[host-invocation-provider-routing.md](spec.md#3-canonical-names)",
  "legacyPath": "docs/architect/host-invocation-routing/host-invocation-provider-routing.md",
  "target": {
    "path": "docs/platform/host-invocation-routing/spec.md",
    "anchor": "3-canonical-names",
    "aliasId": "host-invocation-draft-042"
  },
  "portal": false,
  "area": "host-invocation-routing",
  "reviewStatus": "pending",
  "oldDestination": "../../architect/host-invocation-routing/host-invocation-provider-routing.md#3-canonical-names",
  "newDestination": "spec.md#3-canonical-names",
  "alias": {
    "fromPath": "docs/architect/host-invocation-routing/host-invocation-provider-routing.md#3-canonical-names",
    "toOwner": "docs/platform/host-invocation-routing/spec.md",
    "toAnchor": "3-canonical-names",
    "kind": "redirected",
    "evidenceRef": "plans/260925-documentation-authority-unification/reports/phase-06/review-3-checkpoint-host-invocation.md",
    "immutableRefs": [],
    "recordedAt": "2026-10-13",
    "aliasId": "host-invocation-draft-042"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 2,
    "title": "3. Canonical Names",
    "anchor": "3-canonical-names",
    "githubAnchor": "3-canonical-names",
    "stableAnchor": "h-348360c723de",
    "startLine": 37,
    "endLine": 37,
    "textDigest": "c70328cafef9fa54fd388ac372c0d624d2efe52fc94007e0cce106d896065a78",
    "sample": "3. Canonical Names",
    "sectionPayloadDigest": "fd4d2c6e84ea5095ae6cdfbda4001a9c7bb8414271880c637b604910b88bdb13",
    "followingBlockDigest": "061cc20a9f12cb32b8977768d432e50b03d608b2d8dc70666ad4935d4b6596a7",
    "identityFingerprint": "d63f7c738ce273196530201af757cbee4da3437d8a8c379986cb9ece27ef8f40",
    "ancestry": [
      "Host Invocation And Provider Routing Architecture"
    ],
    "text": "## 3. Canonical Names",
    "sectionText": "## 3. Canonical Names\n\nOne name per concept; no alias appears anywhere in this document or its two companions.\n\n| Name | What it is |\n|---|---|\n| `OperationId` | Stable semantic identifier, independent of CLI/REST/MCP spelling (§5). |\n| `HostInvocation` | Host/caller context (identity, deadline, cancellation, tracing) admitted before routing (§5). |\n| `OperationRequest` | `OperationId` + `ContractRef` + typed semantic input (§5). |\n| `ContractRef` | `{id, version}` that always travels with a request/outcome (§5). |\n| `ProviderOutcome` | Typed, `ContractRef`-identified result plus typed error, events, evidence, diagnostics (§5). |\n| `ProviderError` | Closed failure family a provider call can terminate with (§7). |\n| `OperationProvider` | Trait: `descriptor()` + `invoke(...)` (§6). |\n| `ProviderDescriptor` | Identity, component class, mechanism, contract versions, allowed hosts/modes, capabilities, `lifecycle`, replacement, concurrency, health (§5). |\n| `OperationDescriptor` | One catalog entry: operation id, owning component, contracts, effect, idempotency, authority policy, allowed hosts, streaming (§5). |\n| `OperationCatalog` | Authority-bearing inventory of `OperationDescriptor`s, authored by owning components (§5). |\n| `RegistrySnapshot` | Immutable linked provider registry for one invocation (§5, §6). |\n| Router | Pure selection function: inputs -> one `ProviderDescriptor` or a refusal (§6). |\n| `InvocationService` | Pipeline: admit -> select -> grant -> invoke -> normalize -> record (§6). |\n| `InvocationControl` | Deadline, cancellation token, granted capabilities passed to a provider call (§6). |\n| `EventSink` | Progress/event/diagnostic sink passed to a provider call (§6). |\n| `CommandRouteDescriptor` | Per-CLI-selector `legacy-cli`/`native` record, owned by the CLI adapter — [Legacy CLI Transition](./legacy-cli-transition.md). |\n| `ConfigPort` | Port a provider receives resolved configuration/context through; never a second global file read (§5). |"
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 4,
    "title": "3. Canonical Names",
    "anchor": "3-canonical-names",
    "githubAnchor": "3-canonical-names",
    "stableAnchor": "h-e2315d89f566",
    "startLine": 145,
    "endLine": 145,
    "textDigest": "e693cea8e2a83825a8ca763ea11d4f8be69a4bf03db817a28be952f7eae8fd93",
    "sample": "3. Canonical Names",
    "sectionPayloadDigest": "90860ad106b8e65986388cef27f205e375c2623a2d31eb82599ae523b8049191",
    "followingBlockDigest": "061cc20a9f12cb32b8977768d432e50b03d608b2d8dc70666ad4935d4b6596a7",
    "identityFingerprint": "97c7d9575d65c4cce83e10555cbb17597b8b039d83fd50c1183e47d491f45c68",
    "ancestry": [
      "Spec: Host Invocation",
      "Retained selected source material",
      "Host Invocation And Provider Routing Architecture"
    ],
    "text": "#### 3. Canonical Names",
    "sectionText": "#### 3. Canonical Names\n\nOne name per concept; no alias appears anywhere in this document or its two companions.\n\n| Name | What it is |\n|---|---|\n| `OperationId` | Stable semantic identifier, independent of CLI/REST/MCP spelling (§5). |\n| `HostInvocation` | Host/caller context (identity, deadline, cancellation, tracing) admitted before routing (§5). |\n| `OperationRequest` | `OperationId` + `ContractRef` + typed semantic input (§5). |\n| `ContractRef` | `{id, version}` that always travels with a request/outcome (§5). |\n| `ProviderOutcome` | Typed, `ContractRef`-identified result plus typed error, events, evidence, diagnostics (§5). |\n| `ProviderError` | Closed failure family a provider call can terminate with (§7). |\n| `OperationProvider` | Trait: `descriptor()` + `invoke(...)` (§6). |\n| `ProviderDescriptor` | Identity, component class, mechanism, contract versions, allowed hosts/modes, capabilities, `lifecycle`, replacement, concurrency, health (§5). |\n| `OperationDescriptor` | One catalog entry: operation id, owning component, contracts, effect, idempotency, authority policy, allowed hosts, streaming (§5). |\n| `OperationCatalog` | Authority-bearing inventory of `OperationDescriptor`s, authored by owning components (§5). |\n| `RegistrySnapshot` | Immutable linked provider registry for one invocation (§5, §6). |\n| Router | Pure selection function: inputs -> one `ProviderDescriptor` or a refusal (§6). |\n| `InvocationService` | Pipeline: admit -> select -> grant -> invoke -> normalize -> record (§6). |\n| `InvocationControl` | Deadline, cancellation token, granted capabilities passed to a provider call (§6). |\n| `EventSink` | Progress/event/diagnostic sink passed to a provider call (§6). |\n| `CommandRouteDescriptor` | Per-CLI-selector `legacy-cli`/`native` record, owned by the CLI adapter — [Legacy CLI Transition](architecture/legacy-cli-transition.md). |\n| `ConfigPort` | Port a provider receives resolved configuration/context through; never a second global file read (§5). |"
  }
}
```

## Entry f-150: link-150

```json
{
  "id": "link-150",
  "path": "docs/platform/host-invocation-routing/intent-preservation-ledger.md",
  "inputLine": 62,
  "inputColumn": 100,
  "lineBeforeLinkPass": 70,
  "before": "[host-invocation-provider-routing.md](../../architect/host-invocation-routing/host-invocation-provider-routing.md#5-core-contracts)",
  "after": "[host-invocation-provider-routing.md](spec.md#5-core-contracts)",
  "legacyPath": "docs/architect/host-invocation-routing/host-invocation-provider-routing.md",
  "target": {
    "path": "docs/platform/host-invocation-routing/spec.md",
    "anchor": "5-core-contracts",
    "aliasId": "host-invocation-draft-044"
  },
  "portal": false,
  "area": "host-invocation-routing",
  "reviewStatus": "pending",
  "oldDestination": "../../architect/host-invocation-routing/host-invocation-provider-routing.md#5-core-contracts",
  "newDestination": "spec.md#5-core-contracts",
  "alias": {
    "fromPath": "docs/architect/host-invocation-routing/host-invocation-provider-routing.md#5-core-contracts",
    "toOwner": "docs/platform/host-invocation-routing/spec.md",
    "toAnchor": "5-core-contracts",
    "kind": "split",
    "evidenceRef": "plans/260925-documentation-authority-unification/reports/phase-06/review-3-rework-source.md",
    "immutableRefs": [],
    "recordedAt": "2026-10-13",
    "aliasId": "host-invocation-draft-044"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 2,
    "title": "5. Core Contracts",
    "anchor": "5-core-contracts",
    "githubAnchor": "5-core-contracts",
    "stableAnchor": "h-9d08dad38bf5",
    "startLine": 97,
    "endLine": 97,
    "textDigest": "5e7c2c60dfed54dc9ebb433881669fc2e31db27fbf1cf90aef988969b14fd6e3",
    "sample": "5. Core Contracts",
    "sectionPayloadDigest": "c867fc71a65cc817c0c2ab8cdc6c6e8ac02ac0f12d580d7ee921dce648aa5848",
    "followingBlockDigest": "86cb21687de69958f80760e385f227f908f68738f5a4a6c9f60f260e4d16d18e",
    "identityFingerprint": "3868b34f662121cb8d4f0afce84ab7e66499ddaef842b266f0effe0ba83a8f4b",
    "ancestry": [
      "Host Invocation And Provider Routing Architecture"
    ],
    "text": "## 5. Core Contracts",
    "sectionText": "## 5. Core Contracts\n\nThe name table (§3) says what each type is; this adds the rules it has no room for.\n\n**`OperationId`** — `<component>.<object-type>.<action>[.<variant>]`. `<component>` owns authority; `<object-type>` is singular (`work.item.list` still names `WorkItem`); `<action>` is a small verb set (`create`, `submit`, `show`, `claim`, `approve`, `run`, ...). E.g. `work.item.submit`, `distribution.build.show`. Each host owns its own projection — CLI verbs, REST paths, MCP names, chat intents are not `OperationId`s unless explicitly mapped; REST may keep plural URLs (`GET /work-items` -> `work.item.list`). Not suffixed for a compatible field addition (see versioning below).\n\n**`HostInvocation`** — host kind is an **open string** (`\"cli\" | \"remote\" | \"chat\"`, not a closed enum every future host must exist in R1).\n\n**`OperationRequest`** = `{ operation: OperationId, contract: ContractRef, input: Box<dyn Any + Send> }` — typed per contract; a built-in downcasts `input` directly, never through a decode step.\n\n**No serialization for built-in providers** — the semantic contract is schema + version (`ContractRef`), but in-process representation is typed Rust through `OperationProvider`. `EncodedMessage` (contract id, version, content type, bytes) exists only at the external-process/WASM boundary ([External Provider Protocol](./external-provider-protocol.md)), never as a kernel type. Raw `OsString` argv is never a semantic `OperationRequest` — it stays inside the CLI adapter's transitional lane.\n\n**`ProviderOutcome`** — not a nested `fgos.v1` envelope or HTTP response; the presenter owns public projection; diagnostics travel through the trace/evidence sink, never silently on compatibility stdout/stderr. Human-in-the-loop rule: §8.\n\n**`ProviderDescriptor` / `ConfigPort`** — `lifecycle` is `singleton | per-invocation | pooled`. Invocation mechanism is an **open string** (`\"builtin\" | \"legacy-node\" | \"external-process\" | \"wasm\"`), not a closed enum. `\"legacy-node\"` names `LegacySemanticProvider`: a normal `OperationProvider` whose implementation still calls an extracted Node use case, introduced per operation only when a non-CLI host needs it before the native provider exists ([Legacy CLI Transition](./legacy-cli-transition.md) §1) — distinct from the CLI adapter's exec lane, which is not a provider at all. A provider receives resolved config/context through `ConfigPort` and never reads a second global config file itself.\n\n**`OperationDescriptor` / `OperationCatalog`** — authored by owning components, never inferred from CLI commands or provider manifests. Fields: operation id, owning component id, request/outcome contracts, effect (`read | write | external`), idempotency (`none | keyed | safe`), authority policy id, allowed host kinds, streaming mode. The CLI command registry stays authority for CLI help/grammar and maps selectors into catalogued operations; a registry entry alone cannot create an operation. **R1 simplicity:** one native operation (`distribution.build.show`), so `OperationCatalog` is a `const` array and `RegistrySnapshot` is assembled once at the host's composition root (`apps/fgos`) from const tables via a pure `build_snapshot(catalog, providers, fingerprint)` — the kernel crate never depends on a provider crate, and there is no catalog system, linker, cache, or manifest scan in R1 (§10).\n\n**Contract versioning:** request/outcome contracts version independently; linking picks one exact version pair from the host/provider range intersection — no runtime \"best effort\" coercion. An incompatible change gets a new operation variant or major contract version per the owning component's policy; adapters may perform an explicit registered upgrade/downgrade transform, recorded in diagnostics — the router never reshapes payloads implicitly."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 4,
    "title": "5. Core Contracts",
    "anchor": "5-core-contracts",
    "githubAnchor": "5-core-contracts",
    "stableAnchor": "h-20533ea15b2b",
    "startLine": 205,
    "endLine": 205,
    "textDigest": "9274b7dd1e623096538871b0934d940c5311b7dac7f87b98e8f3bbe9cbdf0e79",
    "sample": "5. Core Contracts",
    "sectionPayloadDigest": "599761c6d3a1318c0a0f3bac6eec2b4d274af62b08831d38129471f913f7da58",
    "followingBlockDigest": "86cb21687de69958f80760e385f227f908f68738f5a4a6c9f60f260e4d16d18e",
    "identityFingerprint": "a920610fbd9c39cf0b7a9f2baba84f180fe9699dfdb462a8a7da7d83cb651f81",
    "ancestry": [
      "Spec: Host Invocation",
      "Retained selected source material",
      "Host Invocation And Provider Routing Architecture"
    ],
    "text": "#### 5. Core Contracts",
    "sectionText": "#### 5. Core Contracts\n\nThe name table (§3) says what each type is; this adds the rules it has no room for.\n\n**`OperationId`** — `<component>.<object-type>.<action>[.<variant>]`. `<component>` owns authority; `<object-type>` is singular (`work.item.list` still names `WorkItem`); `<action>` is a small verb set (`create`, `submit`, `show`, `claim`, `approve`, `run`, ...). E.g. `work.item.submit`, `distribution.build.show`. Each host owns its own projection — CLI verbs, REST paths, MCP names, chat intents are not `OperationId`s unless explicitly mapped; REST may keep plural URLs (`GET /work-items` -> `work.item.list`). Not suffixed for a compatible field addition (see versioning below).\n\n**`HostInvocation`** — host kind is an **open string** (`\"cli\" | \"remote\" | \"chat\"`, not a closed enum every future host must exist in R1).\n\n**`OperationRequest`** = `{ operation: OperationId, contract: ContractRef, input: Box<dyn Any + Send> }` — typed per contract; a built-in downcasts `input` directly, never through a decode step.\n\n**No serialization for built-in providers** — the semantic contract is schema + version (`ContractRef`), but in-process representation is typed Rust through `OperationProvider`. `EncodedMessage` (contract id, version, content type, bytes) exists only at the external-process/WASM boundary ([External Provider Protocol](architecture/external-provider-protocol.md)), never as a kernel type. Raw `OsString` argv is never a semantic `OperationRequest` — it stays inside the CLI adapter's transitional lane.\n\n**`ProviderOutcome`** — not a nested `fgos.v1` envelope or HTTP response; the presenter owns public projection; diagnostics travel through the trace/evidence sink, never silently on compatibility stdout/stderr. Human-in-the-loop rule: §8.\n\n**`ProviderDescriptor` / `ConfigPort`** — `lifecycle` is `singleton | per-invocation | pooled`. Invocation mechanism is an **open string** (`\"builtin\" | \"legacy-node\" | \"external-process\" | \"wasm\"`), not a closed enum. `\"legacy-node\"` names `LegacySemanticProvider`: a normal `OperationProvider` whose implementation still calls an extracted Node use case, introduced per operation only when a non-CLI host needs it before the native provider exists ([Legacy CLI Transition](architecture/legacy-cli-transition.md) §1) — distinct from the CLI adapter's exec lane, which is not a provider at all. A provider receives resolved config/context through `ConfigPort` and never reads a second global config file itself.\n\n**`OperationDescriptor` / `OperationCatalog`** — authored by owning components, never inferred from CLI commands or provider manifests. Fields: operation id, owning component id, request/outcome contracts, effect (`read | write | external`), idempotency (`none | keyed | safe`), authority policy id, allowed host kinds, streaming mode. The CLI command registry stays authority for CLI help/grammar and maps selectors into catalogued operations; a registry entry alone cannot create an operation. **R1 simplicity:** one native operation (`distribution.build.show`), so `OperationCatalog` is a `const` array and `RegistrySnapshot` is assembled once at the host's composition root (`apps/fgos`) from const tables via a pure `build_snapshot(catalog, providers, fingerprint)` — the kernel crate never depends on a provider crate, and there is no catalog system, linker, cache, or manifest scan in R1 (§10).\n\n\nAdded in candidate: this retained source detail is carried verbatim in [the dropped-002 restoration](contracts/component-protocol.md#restored-contract-versioning)."
  }
}
```

## Entry f-151: link-151

```json
{
  "id": "link-151",
  "path": "docs/platform/host-invocation-routing/intent-preservation-ledger.md",
  "inputLine": 63,
  "inputColumn": 129,
  "lineBeforeLinkPass": 71,
  "before": "[host-invocation-provider-routing.md](../../architect/host-invocation-routing/host-invocation-provider-routing.md#5-core-contracts)",
  "after": "[host-invocation-provider-routing.md](spec.md#5-core-contracts)",
  "legacyPath": "docs/architect/host-invocation-routing/host-invocation-provider-routing.md",
  "target": {
    "path": "docs/platform/host-invocation-routing/spec.md",
    "anchor": "5-core-contracts",
    "aliasId": "host-invocation-draft-044"
  },
  "portal": false,
  "area": "host-invocation-routing",
  "reviewStatus": "pending",
  "oldDestination": "../../architect/host-invocation-routing/host-invocation-provider-routing.md#5-core-contracts",
  "newDestination": "spec.md#5-core-contracts",
  "alias": {
    "fromPath": "docs/architect/host-invocation-routing/host-invocation-provider-routing.md#5-core-contracts",
    "toOwner": "docs/platform/host-invocation-routing/spec.md",
    "toAnchor": "5-core-contracts",
    "kind": "split",
    "evidenceRef": "plans/260925-documentation-authority-unification/reports/phase-06/review-3-rework-source.md",
    "immutableRefs": [],
    "recordedAt": "2026-10-13",
    "aliasId": "host-invocation-draft-044"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 2,
    "title": "5. Core Contracts",
    "anchor": "5-core-contracts",
    "githubAnchor": "5-core-contracts",
    "stableAnchor": "h-9d08dad38bf5",
    "startLine": 97,
    "endLine": 97,
    "textDigest": "5e7c2c60dfed54dc9ebb433881669fc2e31db27fbf1cf90aef988969b14fd6e3",
    "sample": "5. Core Contracts",
    "sectionPayloadDigest": "c867fc71a65cc817c0c2ab8cdc6c6e8ac02ac0f12d580d7ee921dce648aa5848",
    "followingBlockDigest": "86cb21687de69958f80760e385f227f908f68738f5a4a6c9f60f260e4d16d18e",
    "identityFingerprint": "3868b34f662121cb8d4f0afce84ab7e66499ddaef842b266f0effe0ba83a8f4b",
    "ancestry": [
      "Host Invocation And Provider Routing Architecture"
    ],
    "text": "## 5. Core Contracts",
    "sectionText": "## 5. Core Contracts\n\nThe name table (§3) says what each type is; this adds the rules it has no room for.\n\n**`OperationId`** — `<component>.<object-type>.<action>[.<variant>]`. `<component>` owns authority; `<object-type>` is singular (`work.item.list` still names `WorkItem`); `<action>` is a small verb set (`create`, `submit`, `show`, `claim`, `approve`, `run`, ...). E.g. `work.item.submit`, `distribution.build.show`. Each host owns its own projection — CLI verbs, REST paths, MCP names, chat intents are not `OperationId`s unless explicitly mapped; REST may keep plural URLs (`GET /work-items` -> `work.item.list`). Not suffixed for a compatible field addition (see versioning below).\n\n**`HostInvocation`** — host kind is an **open string** (`\"cli\" | \"remote\" | \"chat\"`, not a closed enum every future host must exist in R1).\n\n**`OperationRequest`** = `{ operation: OperationId, contract: ContractRef, input: Box<dyn Any + Send> }` — typed per contract; a built-in downcasts `input` directly, never through a decode step.\n\n**No serialization for built-in providers** — the semantic contract is schema + version (`ContractRef`), but in-process representation is typed Rust through `OperationProvider`. `EncodedMessage` (contract id, version, content type, bytes) exists only at the external-process/WASM boundary ([External Provider Protocol](./external-provider-protocol.md)), never as a kernel type. Raw `OsString` argv is never a semantic `OperationRequest` — it stays inside the CLI adapter's transitional lane.\n\n**`ProviderOutcome`** — not a nested `fgos.v1` envelope or HTTP response; the presenter owns public projection; diagnostics travel through the trace/evidence sink, never silently on compatibility stdout/stderr. Human-in-the-loop rule: §8.\n\n**`ProviderDescriptor` / `ConfigPort`** — `lifecycle` is `singleton | per-invocation | pooled`. Invocation mechanism is an **open string** (`\"builtin\" | \"legacy-node\" | \"external-process\" | \"wasm\"`), not a closed enum. `\"legacy-node\"` names `LegacySemanticProvider`: a normal `OperationProvider` whose implementation still calls an extracted Node use case, introduced per operation only when a non-CLI host needs it before the native provider exists ([Legacy CLI Transition](./legacy-cli-transition.md) §1) — distinct from the CLI adapter's exec lane, which is not a provider at all. A provider receives resolved config/context through `ConfigPort` and never reads a second global config file itself.\n\n**`OperationDescriptor` / `OperationCatalog`** — authored by owning components, never inferred from CLI commands or provider manifests. Fields: operation id, owning component id, request/outcome contracts, effect (`read | write | external`), idempotency (`none | keyed | safe`), authority policy id, allowed host kinds, streaming mode. The CLI command registry stays authority for CLI help/grammar and maps selectors into catalogued operations; a registry entry alone cannot create an operation. **R1 simplicity:** one native operation (`distribution.build.show`), so `OperationCatalog` is a `const` array and `RegistrySnapshot` is assembled once at the host's composition root (`apps/fgos`) from const tables via a pure `build_snapshot(catalog, providers, fingerprint)` — the kernel crate never depends on a provider crate, and there is no catalog system, linker, cache, or manifest scan in R1 (§10).\n\n**Contract versioning:** request/outcome contracts version independently; linking picks one exact version pair from the host/provider range intersection — no runtime \"best effort\" coercion. An incompatible change gets a new operation variant or major contract version per the owning component's policy; adapters may perform an explicit registered upgrade/downgrade transform, recorded in diagnostics — the router never reshapes payloads implicitly."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 4,
    "title": "5. Core Contracts",
    "anchor": "5-core-contracts",
    "githubAnchor": "5-core-contracts",
    "stableAnchor": "h-20533ea15b2b",
    "startLine": 205,
    "endLine": 205,
    "textDigest": "9274b7dd1e623096538871b0934d940c5311b7dac7f87b98e8f3bbe9cbdf0e79",
    "sample": "5. Core Contracts",
    "sectionPayloadDigest": "599761c6d3a1318c0a0f3bac6eec2b4d274af62b08831d38129471f913f7da58",
    "followingBlockDigest": "86cb21687de69958f80760e385f227f908f68738f5a4a6c9f60f260e4d16d18e",
    "identityFingerprint": "a920610fbd9c39cf0b7a9f2baba84f180fe9699dfdb462a8a7da7d83cb651f81",
    "ancestry": [
      "Spec: Host Invocation",
      "Retained selected source material",
      "Host Invocation And Provider Routing Architecture"
    ],
    "text": "#### 5. Core Contracts",
    "sectionText": "#### 5. Core Contracts\n\nThe name table (§3) says what each type is; this adds the rules it has no room for.\n\n**`OperationId`** — `<component>.<object-type>.<action>[.<variant>]`. `<component>` owns authority; `<object-type>` is singular (`work.item.list` still names `WorkItem`); `<action>` is a small verb set (`create`, `submit`, `show`, `claim`, `approve`, `run`, ...). E.g. `work.item.submit`, `distribution.build.show`. Each host owns its own projection — CLI verbs, REST paths, MCP names, chat intents are not `OperationId`s unless explicitly mapped; REST may keep plural URLs (`GET /work-items` -> `work.item.list`). Not suffixed for a compatible field addition (see versioning below).\n\n**`HostInvocation`** — host kind is an **open string** (`\"cli\" | \"remote\" | \"chat\"`, not a closed enum every future host must exist in R1).\n\n**`OperationRequest`** = `{ operation: OperationId, contract: ContractRef, input: Box<dyn Any + Send> }` — typed per contract; a built-in downcasts `input` directly, never through a decode step.\n\n**No serialization for built-in providers** — the semantic contract is schema + version (`ContractRef`), but in-process representation is typed Rust through `OperationProvider`. `EncodedMessage` (contract id, version, content type, bytes) exists only at the external-process/WASM boundary ([External Provider Protocol](architecture/external-provider-protocol.md)), never as a kernel type. Raw `OsString` argv is never a semantic `OperationRequest` — it stays inside the CLI adapter's transitional lane.\n\n**`ProviderOutcome`** — not a nested `fgos.v1` envelope or HTTP response; the presenter owns public projection; diagnostics travel through the trace/evidence sink, never silently on compatibility stdout/stderr. Human-in-the-loop rule: §8.\n\n**`ProviderDescriptor` / `ConfigPort`** — `lifecycle` is `singleton | per-invocation | pooled`. Invocation mechanism is an **open string** (`\"builtin\" | \"legacy-node\" | \"external-process\" | \"wasm\"`), not a closed enum. `\"legacy-node\"` names `LegacySemanticProvider`: a normal `OperationProvider` whose implementation still calls an extracted Node use case, introduced per operation only when a non-CLI host needs it before the native provider exists ([Legacy CLI Transition](architecture/legacy-cli-transition.md) §1) — distinct from the CLI adapter's exec lane, which is not a provider at all. A provider receives resolved config/context through `ConfigPort` and never reads a second global config file itself.\n\n**`OperationDescriptor` / `OperationCatalog`** — authored by owning components, never inferred from CLI commands or provider manifests. Fields: operation id, owning component id, request/outcome contracts, effect (`read | write | external`), idempotency (`none | keyed | safe`), authority policy id, allowed host kinds, streaming mode. The CLI command registry stays authority for CLI help/grammar and maps selectors into catalogued operations; a registry entry alone cannot create an operation. **R1 simplicity:** one native operation (`distribution.build.show`), so `OperationCatalog` is a `const` array and `RegistrySnapshot` is assembled once at the host's composition root (`apps/fgos`) from const tables via a pure `build_snapshot(catalog, providers, fingerprint)` — the kernel crate never depends on a provider crate, and there is no catalog system, linker, cache, or manifest scan in R1 (§10).\n\n\nAdded in candidate: this retained source detail is carried verbatim in [the dropped-002 restoration](contracts/component-protocol.md#restored-contract-versioning)."
  }
}
```

## Entry f-152: link-152

```json
{
  "id": "link-152",
  "path": "docs/platform/host-invocation-routing/intent-preservation-ledger.md",
  "inputLine": 63,
  "inputColumn": 262,
  "lineBeforeLinkPass": 71,
  "before": "[external-provider-protocol.md](../../architect/host-invocation-routing/external-provider-protocol.md#3-component-protocol)",
  "after": "[external-provider-protocol.md](architecture/external-provider-protocol.md#3-component-protocol)",
  "legacyPath": "docs/architect/host-invocation-routing/external-provider-protocol.md",
  "target": {
    "path": "docs/platform/host-invocation-routing/architecture/external-provider-protocol.md",
    "anchor": "3-component-protocol",
    "aliasId": "host-invocation-draft-033"
  },
  "portal": false,
  "area": "host-invocation-routing",
  "reviewStatus": "pending",
  "oldDestination": "../../architect/host-invocation-routing/external-provider-protocol.md#3-component-protocol",
  "newDestination": "architecture/external-provider-protocol.md#3-component-protocol",
  "alias": {
    "fromPath": "docs/architect/host-invocation-routing/external-provider-protocol.md#3-component-protocol",
    "toOwner": "docs/platform/host-invocation-routing/architecture/external-provider-protocol.md",
    "toAnchor": "3-component-protocol",
    "kind": "split",
    "evidenceRef": "plans/260925-documentation-authority-unification/reports/phase-06/review-3-rework-source.md",
    "immutableRefs": [],
    "recordedAt": "2026-10-13",
    "aliasId": "host-invocation-draft-033"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 2,
    "title": "3. Component Protocol",
    "anchor": "3-component-protocol",
    "githubAnchor": "3-component-protocol",
    "stableAnchor": "h-3d2776445484",
    "startLine": 72,
    "endLine": 72,
    "textDigest": "4788de97424c5b1035cf2384d427ef5a7694dfbae3af9c94f73cf5dcf4420ea6",
    "sample": "3. Component Protocol",
    "sectionPayloadDigest": "e71acdcc9325f5470c9e8b393d1115b8e47c2bf44fd5397ead27703eb1193a99",
    "followingBlockDigest": "aa5e4116035d0b11d423c86594b2b314f62685ed66d610c53e45cd409a2f4999",
    "identityFingerprint": "53de331d0d46a89817008914533b3e4804ad4f3b82c21ef2d39df86cf130c572",
    "ancestry": [
      "External Provider Protocol"
    ],
    "text": "## 3. Component Protocol",
    "sectionText": "## 3. Component Protocol\n\nThe semantic component protocol is versioned independently from public host protocols — `fgos.component.v1`, distinct from CLI `fgos.v1` and any remote API version. It carries: operation identity and protocol/schema version range; request ID and optional parent/correlation ID; typed request, result, and error payloads; deadline, cancellation, progress, and events where supported; capability context granted by the host; provider identity and diagnostics needed for tracing.\n\nFor process plugins, version one uses JSON-RPC 2.0 semantics over 4-byte big-endian length-prefixed UTF-8 JSON frames on stdio. Newline-delimited JSON is not the contract: a length prefix gives one enforceable maximum-frame boundary and does not make embedded or future formatted content ambiguous. Stdout is protocol only; logs go to stderr or a declared log notification.\n\nThe host starts a process only after static manifest selection. Its first exchange confirms provider identity, accepted manifest digest, component protocol range, supported operation/contract pairs, and concurrency limit. Discovery never depends on this handshake; a mismatch terminates the provider and fails closed.\n\nOne connection obeys these lifecycle rules:\n\n- request IDs are unique per connection;\n- responses may complete out of order only when concurrency greater than one was negotiated;\n- requests, frames, and event queues are bounded to provide backpressure;\n- cancellation sends a protocol notification, waits a bounded grace period, then terminates the provider process if necessary;\n- cancellation acknowledgement does not claim semantic side effects were rolled back;\n- a crash after dispatch yields completion-unknown unless the operation's idempotency contract and key explicitly permit retry;\n- a one-shot CLI may own one process for its lifetime; a gateway may pool or persist connections under the adapter's health/restart policy.\n\nThe semantic contract stays transport-neutral: a future binary codec or local socket transport may replace framing without renaming the operation.\n\n`EncodedMessage` is the wire representation used only at this boundary — never inside the kernel:\n\n```rust\npub struct EncodedMessage {\n    pub contract_id: ContractId,\n    pub version: ContractVersion,\n    pub content_type: ContentType,\n    pub bytes: Bytes,\n}\n```"
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 4,
    "title": "3. Component Protocol",
    "anchor": "3-component-protocol",
    "githubAnchor": "3-component-protocol",
    "stableAnchor": "h-3dad5d9344c9",
    "startLine": 124,
    "endLine": 124,
    "textDigest": "7cf43dd0dccf83e356b760c88da2576ecb1eb4cf9219caaf09a95ff12d2fd5a8",
    "sample": "3. Component Protocol",
    "sectionPayloadDigest": "9229fc3e7df43971e02ec720977cd9190fbe3882ca9fccf689e332f62945383f",
    "followingBlockDigest": "aa5e4116035d0b11d423c86594b2b314f62685ed66d610c53e45cd409a2f4999",
    "identityFingerprint": "66a04939a685fc3010a2080c0cb9533bcd069a467d36909a42099855075ce9e0",
    "ancestry": [
      "Architecture: External Provider Protocol",
      "Retained selected source material",
      "External Provider Protocol"
    ],
    "text": "#### 3. Component Protocol",
    "sectionText": "#### 3. Component Protocol\n\nThe semantic component protocol is versioned independently from public host protocols — `fgos.component.v1`, distinct from CLI `fgos.v1` and any remote API version. It carries: operation identity and protocol/schema version range; request ID and optional parent/correlation ID; typed request, result, and error payloads; deadline, cancellation, progress, and events where supported; capability context granted by the host; provider identity and diagnostics needed for tracing.\n\nFor process plugins, version one uses JSON-RPC 2.0 semantics over 4-byte big-endian length-prefixed UTF-8 JSON frames on stdio. Newline-delimited JSON is not the contract: a length prefix gives one enforceable maximum-frame boundary and does not make embedded or future formatted content ambiguous. Stdout is protocol only; logs go to stderr or a declared log notification.\n\nThe host starts a process only after static manifest selection. Its first exchange confirms provider identity, accepted manifest digest, component protocol range, supported operation/contract pairs, and concurrency limit. Discovery never depends on this handshake; a mismatch terminates the provider and fails closed.\n\nOne connection obeys these lifecycle rules:\n\n- request IDs are unique per connection;\n- responses may complete out of order only when concurrency greater than one was negotiated;\n- requests, frames, and event queues are bounded to provide backpressure;\n- cancellation sends a protocol notification, waits a bounded grace period, then terminates the provider process if necessary;\n- cancellation acknowledgement does not claim semantic side effects were rolled back;\n- a crash after dispatch yields completion-unknown unless the operation's idempotency contract and key explicitly permit retry;\n- a one-shot CLI may own one process for its lifetime; a gateway may pool or persist connections under the adapter's health/restart policy.\n\n\nAdded in candidate: this retained source detail is carried verbatim in [the dropped-007 restoration](../contracts/component-protocol.md#restored-semantic-contract-stays-transport-neutral).\n\n\n`EncodedMessage` is the wire representation used only at this boundary — never inside the kernel:\n\n```rust\npub struct EncodedMessage {\n    pub contract_id: ContractId,\n    pub version: ContractVersion,\n    pub content_type: ContentType,\n    pub bytes: Bytes,\n}\n```"
  }
}
```

## Entry f-153: link-153

```json
{
  "id": "link-153",
  "path": "docs/platform/host-invocation-routing/intent-preservation-ledger.md",
  "inputLine": 64,
  "inputColumn": 130,
  "lineBeforeLinkPass": 72,
  "before": "[host-invocation-provider-routing.md](../../architect/host-invocation-routing/host-invocation-provider-routing.md#5-core-contracts)",
  "after": "[host-invocation-provider-routing.md](spec.md#5-core-contracts)",
  "legacyPath": "docs/architect/host-invocation-routing/host-invocation-provider-routing.md",
  "target": {
    "path": "docs/platform/host-invocation-routing/spec.md",
    "anchor": "5-core-contracts",
    "aliasId": "host-invocation-draft-044"
  },
  "portal": false,
  "area": "host-invocation-routing",
  "reviewStatus": "pending",
  "oldDestination": "../../architect/host-invocation-routing/host-invocation-provider-routing.md#5-core-contracts",
  "newDestination": "spec.md#5-core-contracts",
  "alias": {
    "fromPath": "docs/architect/host-invocation-routing/host-invocation-provider-routing.md#5-core-contracts",
    "toOwner": "docs/platform/host-invocation-routing/spec.md",
    "toAnchor": "5-core-contracts",
    "kind": "split",
    "evidenceRef": "plans/260925-documentation-authority-unification/reports/phase-06/review-3-rework-source.md",
    "immutableRefs": [],
    "recordedAt": "2026-10-13",
    "aliasId": "host-invocation-draft-044"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 2,
    "title": "5. Core Contracts",
    "anchor": "5-core-contracts",
    "githubAnchor": "5-core-contracts",
    "stableAnchor": "h-9d08dad38bf5",
    "startLine": 97,
    "endLine": 97,
    "textDigest": "5e7c2c60dfed54dc9ebb433881669fc2e31db27fbf1cf90aef988969b14fd6e3",
    "sample": "5. Core Contracts",
    "sectionPayloadDigest": "c867fc71a65cc817c0c2ab8cdc6c6e8ac02ac0f12d580d7ee921dce648aa5848",
    "followingBlockDigest": "86cb21687de69958f80760e385f227f908f68738f5a4a6c9f60f260e4d16d18e",
    "identityFingerprint": "3868b34f662121cb8d4f0afce84ab7e66499ddaef842b266f0effe0ba83a8f4b",
    "ancestry": [
      "Host Invocation And Provider Routing Architecture"
    ],
    "text": "## 5. Core Contracts",
    "sectionText": "## 5. Core Contracts\n\nThe name table (§3) says what each type is; this adds the rules it has no room for.\n\n**`OperationId`** — `<component>.<object-type>.<action>[.<variant>]`. `<component>` owns authority; `<object-type>` is singular (`work.item.list` still names `WorkItem`); `<action>` is a small verb set (`create`, `submit`, `show`, `claim`, `approve`, `run`, ...). E.g. `work.item.submit`, `distribution.build.show`. Each host owns its own projection — CLI verbs, REST paths, MCP names, chat intents are not `OperationId`s unless explicitly mapped; REST may keep plural URLs (`GET /work-items` -> `work.item.list`). Not suffixed for a compatible field addition (see versioning below).\n\n**`HostInvocation`** — host kind is an **open string** (`\"cli\" | \"remote\" | \"chat\"`, not a closed enum every future host must exist in R1).\n\n**`OperationRequest`** = `{ operation: OperationId, contract: ContractRef, input: Box<dyn Any + Send> }` — typed per contract; a built-in downcasts `input` directly, never through a decode step.\n\n**No serialization for built-in providers** — the semantic contract is schema + version (`ContractRef`), but in-process representation is typed Rust through `OperationProvider`. `EncodedMessage` (contract id, version, content type, bytes) exists only at the external-process/WASM boundary ([External Provider Protocol](./external-provider-protocol.md)), never as a kernel type. Raw `OsString` argv is never a semantic `OperationRequest` — it stays inside the CLI adapter's transitional lane.\n\n**`ProviderOutcome`** — not a nested `fgos.v1` envelope or HTTP response; the presenter owns public projection; diagnostics travel through the trace/evidence sink, never silently on compatibility stdout/stderr. Human-in-the-loop rule: §8.\n\n**`ProviderDescriptor` / `ConfigPort`** — `lifecycle` is `singleton | per-invocation | pooled`. Invocation mechanism is an **open string** (`\"builtin\" | \"legacy-node\" | \"external-process\" | \"wasm\"`), not a closed enum. `\"legacy-node\"` names `LegacySemanticProvider`: a normal `OperationProvider` whose implementation still calls an extracted Node use case, introduced per operation only when a non-CLI host needs it before the native provider exists ([Legacy CLI Transition](./legacy-cli-transition.md) §1) — distinct from the CLI adapter's exec lane, which is not a provider at all. A provider receives resolved config/context through `ConfigPort` and never reads a second global config file itself.\n\n**`OperationDescriptor` / `OperationCatalog`** — authored by owning components, never inferred from CLI commands or provider manifests. Fields: operation id, owning component id, request/outcome contracts, effect (`read | write | external`), idempotency (`none | keyed | safe`), authority policy id, allowed host kinds, streaming mode. The CLI command registry stays authority for CLI help/grammar and maps selectors into catalogued operations; a registry entry alone cannot create an operation. **R1 simplicity:** one native operation (`distribution.build.show`), so `OperationCatalog` is a `const` array and `RegistrySnapshot` is assembled once at the host's composition root (`apps/fgos`) from const tables via a pure `build_snapshot(catalog, providers, fingerprint)` — the kernel crate never depends on a provider crate, and there is no catalog system, linker, cache, or manifest scan in R1 (§10).\n\n**Contract versioning:** request/outcome contracts version independently; linking picks one exact version pair from the host/provider range intersection — no runtime \"best effort\" coercion. An incompatible change gets a new operation variant or major contract version per the owning component's policy; adapters may perform an explicit registered upgrade/downgrade transform, recorded in diagnostics — the router never reshapes payloads implicitly."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 4,
    "title": "5. Core Contracts",
    "anchor": "5-core-contracts",
    "githubAnchor": "5-core-contracts",
    "stableAnchor": "h-20533ea15b2b",
    "startLine": 205,
    "endLine": 205,
    "textDigest": "9274b7dd1e623096538871b0934d940c5311b7dac7f87b98e8f3bbe9cbdf0e79",
    "sample": "5. Core Contracts",
    "sectionPayloadDigest": "599761c6d3a1318c0a0f3bac6eec2b4d274af62b08831d38129471f913f7da58",
    "followingBlockDigest": "86cb21687de69958f80760e385f227f908f68738f5a4a6c9f60f260e4d16d18e",
    "identityFingerprint": "a920610fbd9c39cf0b7a9f2baba84f180fe9699dfdb462a8a7da7d83cb651f81",
    "ancestry": [
      "Spec: Host Invocation",
      "Retained selected source material",
      "Host Invocation And Provider Routing Architecture"
    ],
    "text": "#### 5. Core Contracts",
    "sectionText": "#### 5. Core Contracts\n\nThe name table (§3) says what each type is; this adds the rules it has no room for.\n\n**`OperationId`** — `<component>.<object-type>.<action>[.<variant>]`. `<component>` owns authority; `<object-type>` is singular (`work.item.list` still names `WorkItem`); `<action>` is a small verb set (`create`, `submit`, `show`, `claim`, `approve`, `run`, ...). E.g. `work.item.submit`, `distribution.build.show`. Each host owns its own projection — CLI verbs, REST paths, MCP names, chat intents are not `OperationId`s unless explicitly mapped; REST may keep plural URLs (`GET /work-items` -> `work.item.list`). Not suffixed for a compatible field addition (see versioning below).\n\n**`HostInvocation`** — host kind is an **open string** (`\"cli\" | \"remote\" | \"chat\"`, not a closed enum every future host must exist in R1).\n\n**`OperationRequest`** = `{ operation: OperationId, contract: ContractRef, input: Box<dyn Any + Send> }` — typed per contract; a built-in downcasts `input` directly, never through a decode step.\n\n**No serialization for built-in providers** — the semantic contract is schema + version (`ContractRef`), but in-process representation is typed Rust through `OperationProvider`. `EncodedMessage` (contract id, version, content type, bytes) exists only at the external-process/WASM boundary ([External Provider Protocol](architecture/external-provider-protocol.md)), never as a kernel type. Raw `OsString` argv is never a semantic `OperationRequest` — it stays inside the CLI adapter's transitional lane.\n\n**`ProviderOutcome`** — not a nested `fgos.v1` envelope or HTTP response; the presenter owns public projection; diagnostics travel through the trace/evidence sink, never silently on compatibility stdout/stderr. Human-in-the-loop rule: §8.\n\n**`ProviderDescriptor` / `ConfigPort`** — `lifecycle` is `singleton | per-invocation | pooled`. Invocation mechanism is an **open string** (`\"builtin\" | \"legacy-node\" | \"external-process\" | \"wasm\"`), not a closed enum. `\"legacy-node\"` names `LegacySemanticProvider`: a normal `OperationProvider` whose implementation still calls an extracted Node use case, introduced per operation only when a non-CLI host needs it before the native provider exists ([Legacy CLI Transition](architecture/legacy-cli-transition.md) §1) — distinct from the CLI adapter's exec lane, which is not a provider at all. A provider receives resolved config/context through `ConfigPort` and never reads a second global config file itself.\n\n**`OperationDescriptor` / `OperationCatalog`** — authored by owning components, never inferred from CLI commands or provider manifests. Fields: operation id, owning component id, request/outcome contracts, effect (`read | write | external`), idempotency (`none | keyed | safe`), authority policy id, allowed host kinds, streaming mode. The CLI command registry stays authority for CLI help/grammar and maps selectors into catalogued operations; a registry entry alone cannot create an operation. **R1 simplicity:** one native operation (`distribution.build.show`), so `OperationCatalog` is a `const` array and `RegistrySnapshot` is assembled once at the host's composition root (`apps/fgos`) from const tables via a pure `build_snapshot(catalog, providers, fingerprint)` — the kernel crate never depends on a provider crate, and there is no catalog system, linker, cache, or manifest scan in R1 (§10).\n\n\nAdded in candidate: this retained source detail is carried verbatim in [the dropped-002 restoration](contracts/component-protocol.md#restored-contract-versioning)."
  }
}
```

## Entry f-154: link-154

```json
{
  "id": "link-154",
  "path": "docs/platform/host-invocation-routing/intent-preservation-ledger.md",
  "inputLine": 65,
  "inputColumn": 119,
  "lineBeforeLinkPass": 73,
  "before": "[host-invocation-provider-routing.md](../../architect/host-invocation-routing/host-invocation-provider-routing.md#6-router-pure-and-invocationservice-pipeline)",
  "after": "[host-invocation-provider-routing.md](spec.md#6-router-pure-and-invocationservice-pipeline)",
  "legacyPath": "docs/architect/host-invocation-routing/host-invocation-provider-routing.md",
  "target": {
    "path": "docs/platform/host-invocation-routing/spec.md",
    "anchor": "6-router-pure-and-invocationservice-pipeline",
    "aliasId": "host-invocation-draft-045"
  },
  "portal": false,
  "area": "host-invocation-routing",
  "reviewStatus": "pending",
  "oldDestination": "../../architect/host-invocation-routing/host-invocation-provider-routing.md#6-router-pure-and-invocationservice-pipeline",
  "newDestination": "spec.md#6-router-pure-and-invocationservice-pipeline",
  "alias": {
    "fromPath": "docs/architect/host-invocation-routing/host-invocation-provider-routing.md#6-router-pure-and-invocationservice-pipeline",
    "toOwner": "docs/platform/host-invocation-routing/spec.md",
    "toAnchor": "6-router-pure-and-invocationservice-pipeline",
    "kind": "redirected",
    "evidenceRef": "plans/260925-documentation-authority-unification/reports/phase-06/review-3-checkpoint-host-invocation.md",
    "immutableRefs": [],
    "recordedAt": "2026-10-13",
    "aliasId": "host-invocation-draft-045"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 2,
    "title": "6. Router (Pure) And InvocationService (Pipeline)",
    "anchor": "6-router-pure-and-invocationservice-pipeline",
    "githubAnchor": "6-router-pure-and-invocationservice-pipeline",
    "stableAnchor": "h-7d75c0c28ebf",
    "startLine": 117,
    "endLine": 117,
    "textDigest": "2b5639358c92726e5b5a6b4a026602f7a4c8612ddd57ac3492dc99aa63aaddb4",
    "sample": "6. Router (Pure) And InvocationService (Pipeline)",
    "sectionPayloadDigest": "d83d66c5007dc479b20066ba38d500122ce5d5e6944321738a51fc16c338c526",
    "followingBlockDigest": "15ddbb3e2c82e8c6e736ad16375407257c80854147570b36c4c0558af516004d",
    "identityFingerprint": "b5bf92f6d347d1286e7aca293efc85ccf318bbf7c57251aefa0fdaa2a4b515ea",
    "ancestry": [
      "Host Invocation And Provider Routing Architecture"
    ],
    "text": "## 6. Router (Pure) And InvocationService (Pipeline)",
    "sectionText": "## 6. Router (Pure) And InvocationService (Pipeline)\n\n**Router** — no I/O, no async, no invocation, no failure normalization, no reporting:\n\n```txt\nRouter: (OperationId, request/outcome contract versions, host kind,\n         invocation mode, project policy, RegistrySnapshot)\n        -> Result<ProviderDescriptor, SelectionRefused>\n```\n\nIt reads the `RegistrySnapshot`, matches operation/mode/host/compatible contract versions, applies an explicit binding or named replacement policy, and fails closed on ambiguity or incompatibility. It never parses CLI/HTTP input, admits, grants, holds domain policy, lets a provider reach another by recursively spawning `fgos`, or renders a response.\n\n**`InvocationService`** owns the pipeline and is the only thing that invokes a provider:\n\n```txt\nreceived -> admit -> Router.select -> grant -> invoke(adapter)\n         -> normalize transport failure -> record lifecycle\n```\n\n`admit`/`grant` are the two authority stages (§7); `invoke` calls the granted `OperationProvider` with deadline/cancellation/trace context; `normalize` maps adapter-specific transport failures onto the closed `ProviderError` families (§8) without changing semantic errors; `record` emits the lifecycle record (§8) and reports which provider/registry fingerprint served the call.\n\nNumeric priority, registration order, and last-writer-wins are not selection policy — a binding names one provider, a replacement names the provider it replaces plus the authorizing policy; otherwise duplicates are ambiguous and linking fails. `RegistrySnapshot` is immutable per invocation: assembled once at the composition root from const tables in R1; from R2 a long-running host may build and atomically publish a new snapshot between invocations, never half-relinked.\n\n```rust\npub trait OperationProvider: Send + Sync {\n    fn descriptor(&self) -> &ProviderDescriptor;\n    fn invoke<'a>(\n        &'a self, invocation: &'a HostInvocation, request: OperationRequest,\n        control: InvocationControl, events: &'a dyn EventSink,\n    ) -> Pin<Box<dyn Future<Output = Result<ProviderOutcome, ProviderError>> + Send + 'a>>;\n}\n```"
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 4,
    "title": "6. Router (Pure) And InvocationService (Pipeline)",
    "anchor": "6-router-pure-and-invocationservice-pipeline",
    "githubAnchor": "6-router-pure-and-invocationservice-pipeline",
    "stableAnchor": "h-92af94f72930",
    "startLine": 227,
    "endLine": 227,
    "textDigest": "2dba885d70e033192de131b5a7702704022fd189b6a7ee69c1423a6329329a9b",
    "sample": "6. Router (Pure) And InvocationService (Pipeline)",
    "sectionPayloadDigest": "d83d66c5007dc479b20066ba38d500122ce5d5e6944321738a51fc16c338c526",
    "followingBlockDigest": "15ddbb3e2c82e8c6e736ad16375407257c80854147570b36c4c0558af516004d",
    "identityFingerprint": "bd784aa86b0dc0bbee12e70385290e6d955cb3445e886a8fe3ebfc51a1e108de",
    "ancestry": [
      "Spec: Host Invocation",
      "Retained selected source material",
      "Host Invocation And Provider Routing Architecture"
    ],
    "text": "#### 6. Router (Pure) And InvocationService (Pipeline)",
    "sectionText": "#### 6. Router (Pure) And InvocationService (Pipeline)\n\n**Router** — no I/O, no async, no invocation, no failure normalization, no reporting:\n\n```txt\nRouter: (OperationId, request/outcome contract versions, host kind,\n         invocation mode, project policy, RegistrySnapshot)\n        -> Result<ProviderDescriptor, SelectionRefused>\n```\n\nIt reads the `RegistrySnapshot`, matches operation/mode/host/compatible contract versions, applies an explicit binding or named replacement policy, and fails closed on ambiguity or incompatibility. It never parses CLI/HTTP input, admits, grants, holds domain policy, lets a provider reach another by recursively spawning `fgos`, or renders a response.\n\n**`InvocationService`** owns the pipeline and is the only thing that invokes a provider:\n\n```txt\nreceived -> admit -> Router.select -> grant -> invoke(adapter)\n         -> normalize transport failure -> record lifecycle\n```\n\n`admit`/`grant` are the two authority stages (§7); `invoke` calls the granted `OperationProvider` with deadline/cancellation/trace context; `normalize` maps adapter-specific transport failures onto the closed `ProviderError` families (§8) without changing semantic errors; `record` emits the lifecycle record (§8) and reports which provider/registry fingerprint served the call.\n\nNumeric priority, registration order, and last-writer-wins are not selection policy — a binding names one provider, a replacement names the provider it replaces plus the authorizing policy; otherwise duplicates are ambiguous and linking fails. `RegistrySnapshot` is immutable per invocation: assembled once at the composition root from const tables in R1; from R2 a long-running host may build and atomically publish a new snapshot between invocations, never half-relinked.\n\n```rust\npub trait OperationProvider: Send + Sync {\n    fn descriptor(&self) -> &ProviderDescriptor;\n    fn invoke<'a>(\n        &'a self, invocation: &'a HostInvocation, request: OperationRequest,\n        control: InvocationControl, events: &'a dyn EventSink,\n    ) -> Pin<Box<dyn Future<Output = Result<ProviderOutcome, ProviderError>> + Send + 'a>>;\n}\n```"
  }
}
```

## Entry f-155: link-155

```json
{
  "id": "link-155",
  "path": "docs/platform/host-invocation-routing/intent-preservation-ledger.md",
  "inputLine": 66,
  "inputColumn": 116,
  "lineBeforeLinkPass": 74,
  "before": "[host-invocation-provider-routing.md](../../architect/host-invocation-routing/host-invocation-provider-routing.md#7-authority-two-stage)",
  "after": "[host-invocation-provider-routing.md](spec.md#7-authority-two-stage)",
  "legacyPath": "docs/architect/host-invocation-routing/host-invocation-provider-routing.md",
  "target": {
    "path": "docs/platform/host-invocation-routing/spec.md",
    "anchor": "7-authority-two-stage",
    "aliasId": "host-invocation-draft-046"
  },
  "portal": false,
  "area": "host-invocation-routing",
  "reviewStatus": "pending",
  "oldDestination": "../../architect/host-invocation-routing/host-invocation-provider-routing.md#7-authority-two-stage",
  "newDestination": "spec.md#7-authority-two-stage",
  "alias": {
    "fromPath": "docs/architect/host-invocation-routing/host-invocation-provider-routing.md#7-authority-two-stage",
    "toOwner": "docs/platform/host-invocation-routing/spec.md",
    "toAnchor": "7-authority-two-stage",
    "kind": "redirected",
    "evidenceRef": "plans/260925-documentation-authority-unification/reports/phase-06/review-3-checkpoint-host-invocation.md",
    "immutableRefs": [],
    "recordedAt": "2026-10-13",
    "aliasId": "host-invocation-draft-046"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 2,
    "title": "7. Authority (Two-Stage)",
    "anchor": "7-authority-two-stage",
    "githubAnchor": "7-authority-two-stage",
    "stableAnchor": "h-a30c08f4c5a3",
    "startLine": 150,
    "endLine": 150,
    "textDigest": "543ae5581d173a41bfebde23dbddd26f17c2a2de0952df1504724175feadf330",
    "sample": "7. Authority (Two-Stage)",
    "sectionPayloadDigest": "411ea8652513c249fff158fbf6bf0db21464ef85deb6d19adf15cc65df3c0807",
    "followingBlockDigest": "2928695057f7d3fe48b36607d329a6e28781eb4dd6293ea07781262aed245bd6",
    "identityFingerprint": "4d0fa2c148ec7716b04a6b0cab2be2f68f8d7f855a1cf5f8323db20d8b2dfdb8",
    "ancestry": [
      "Host Invocation And Provider Routing Architecture"
    ],
    "text": "## 7. Authority (Two-Stage)",
    "sectionText": "## 7. Authority (Two-Stage)\n\nCore operation/command namespaces are reserved; plugins add vendor-scoped operations (`acme.deploy.release`) and implement published extension points only; `.fgos` writes, Git mutation, process/network/secret access require explicit capability grants; unknown or ambiguous claims fail closed. **Configuration can never replace a built-in provider** — closed as \"prohibit,\" not open. Rollback of a native operation in R1–R2 is a release rollback through `fgctl` (the previous release still ships both the native provider and the Node payload during the observation window), never a runtime provider-selection swap.\n\nThe provider manifest is never an authority source:\n\n1. **Caller admission** (before routing): principal, operation, project policy, requested context, host surface.\n2. **Selected-provider grant** (after routing): intersects the admitted action with the operation's capability policy and the provider's requested capabilities.\n\nThe provider receives only the resulting least-privilege grant via `InvocationControl`, identically for every host — a single pre-selection gate cannot evaluate the selected provider's identity, trust, or capability request.\n\nSelecting a different provider never silently transfers authority — a replacement returns a result or proof; the existing authority owner still applies transitions and writes state, for built-in, legacy, and external providers alike. Work Lifecycle remains the only owner of Work transitions; Run Result Evaluation may compute confidence without choosing the next status; Dispatch may execute an approved assignment without inventing its operation; an external manifest claim never grants `.fgos`, Git, process, network, or secret access."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 4,
    "title": "7. Authority (Two-Stage)",
    "anchor": "7-authority-two-stage",
    "githubAnchor": "7-authority-two-stage",
    "stableAnchor": "h-c859c99b1f37",
    "startLine": 260,
    "endLine": 260,
    "textDigest": "a891e9040923a775f70635493ff6bb5aa31107a805143c37bf35ac97bc34ab9b",
    "sample": "7. Authority (Two-Stage)",
    "sectionPayloadDigest": "411ea8652513c249fff158fbf6bf0db21464ef85deb6d19adf15cc65df3c0807",
    "followingBlockDigest": "2928695057f7d3fe48b36607d329a6e28781eb4dd6293ea07781262aed245bd6",
    "identityFingerprint": "df7c43a483ca428611cd5bc0da61724fde55ceb6a15f31d45ce2c4058a2299c2",
    "ancestry": [
      "Spec: Host Invocation",
      "Retained selected source material",
      "Host Invocation And Provider Routing Architecture"
    ],
    "text": "#### 7. Authority (Two-Stage)",
    "sectionText": "#### 7. Authority (Two-Stage)\n\nCore operation/command namespaces are reserved; plugins add vendor-scoped operations (`acme.deploy.release`) and implement published extension points only; `.fgos` writes, Git mutation, process/network/secret access require explicit capability grants; unknown or ambiguous claims fail closed. **Configuration can never replace a built-in provider** — closed as \"prohibit,\" not open. Rollback of a native operation in R1–R2 is a release rollback through `fgctl` (the previous release still ships both the native provider and the Node payload during the observation window), never a runtime provider-selection swap.\n\nThe provider manifest is never an authority source:\n\n1. **Caller admission** (before routing): principal, operation, project policy, requested context, host surface.\n2. **Selected-provider grant** (after routing): intersects the admitted action with the operation's capability policy and the provider's requested capabilities.\n\nThe provider receives only the resulting least-privilege grant via `InvocationControl`, identically for every host — a single pre-selection gate cannot evaluate the selected provider's identity, trust, or capability request.\n\nSelecting a different provider never silently transfers authority — a replacement returns a result or proof; the existing authority owner still applies transitions and writes state, for built-in, legacy, and external providers alike. Work Lifecycle remains the only owner of Work transitions; Run Result Evaluation may compute confidence without choosing the next status; Dispatch may execute an approved assignment without inventing its operation; an external manifest claim never grants `.fgos`, Git, process, network, or secret access."
  }
}
```

## Entry f-156: link-156

```json
{
  "id": "link-156",
  "path": "docs/platform/host-invocation-routing/intent-preservation-ledger.md",
  "inputLine": 67,
  "inputColumn": 139,
  "lineBeforeLinkPass": 75,
  "before": "[host-invocation-provider-routing.md](../../architect/host-invocation-routing/host-invocation-provider-routing.md#7-authority-two-stage)",
  "after": "[host-invocation-provider-routing.md](spec.md#7-authority-two-stage)",
  "legacyPath": "docs/architect/host-invocation-routing/host-invocation-provider-routing.md",
  "target": {
    "path": "docs/platform/host-invocation-routing/spec.md",
    "anchor": "7-authority-two-stage",
    "aliasId": "host-invocation-draft-046"
  },
  "portal": false,
  "area": "host-invocation-routing",
  "reviewStatus": "pending",
  "oldDestination": "../../architect/host-invocation-routing/host-invocation-provider-routing.md#7-authority-two-stage",
  "newDestination": "spec.md#7-authority-two-stage",
  "alias": {
    "fromPath": "docs/architect/host-invocation-routing/host-invocation-provider-routing.md#7-authority-two-stage",
    "toOwner": "docs/platform/host-invocation-routing/spec.md",
    "toAnchor": "7-authority-two-stage",
    "kind": "redirected",
    "evidenceRef": "plans/260925-documentation-authority-unification/reports/phase-06/review-3-checkpoint-host-invocation.md",
    "immutableRefs": [],
    "recordedAt": "2026-10-13",
    "aliasId": "host-invocation-draft-046"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 2,
    "title": "7. Authority (Two-Stage)",
    "anchor": "7-authority-two-stage",
    "githubAnchor": "7-authority-two-stage",
    "stableAnchor": "h-a30c08f4c5a3",
    "startLine": 150,
    "endLine": 150,
    "textDigest": "543ae5581d173a41bfebde23dbddd26f17c2a2de0952df1504724175feadf330",
    "sample": "7. Authority (Two-Stage)",
    "sectionPayloadDigest": "411ea8652513c249fff158fbf6bf0db21464ef85deb6d19adf15cc65df3c0807",
    "followingBlockDigest": "2928695057f7d3fe48b36607d329a6e28781eb4dd6293ea07781262aed245bd6",
    "identityFingerprint": "4d0fa2c148ec7716b04a6b0cab2be2f68f8d7f855a1cf5f8323db20d8b2dfdb8",
    "ancestry": [
      "Host Invocation And Provider Routing Architecture"
    ],
    "text": "## 7. Authority (Two-Stage)",
    "sectionText": "## 7. Authority (Two-Stage)\n\nCore operation/command namespaces are reserved; plugins add vendor-scoped operations (`acme.deploy.release`) and implement published extension points only; `.fgos` writes, Git mutation, process/network/secret access require explicit capability grants; unknown or ambiguous claims fail closed. **Configuration can never replace a built-in provider** — closed as \"prohibit,\" not open. Rollback of a native operation in R1–R2 is a release rollback through `fgctl` (the previous release still ships both the native provider and the Node payload during the observation window), never a runtime provider-selection swap.\n\nThe provider manifest is never an authority source:\n\n1. **Caller admission** (before routing): principal, operation, project policy, requested context, host surface.\n2. **Selected-provider grant** (after routing): intersects the admitted action with the operation's capability policy and the provider's requested capabilities.\n\nThe provider receives only the resulting least-privilege grant via `InvocationControl`, identically for every host — a single pre-selection gate cannot evaluate the selected provider's identity, trust, or capability request.\n\nSelecting a different provider never silently transfers authority — a replacement returns a result or proof; the existing authority owner still applies transitions and writes state, for built-in, legacy, and external providers alike. Work Lifecycle remains the only owner of Work transitions; Run Result Evaluation may compute confidence without choosing the next status; Dispatch may execute an approved assignment without inventing its operation; an external manifest claim never grants `.fgos`, Git, process, network, or secret access."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 4,
    "title": "7. Authority (Two-Stage)",
    "anchor": "7-authority-two-stage",
    "githubAnchor": "7-authority-two-stage",
    "stableAnchor": "h-c859c99b1f37",
    "startLine": 260,
    "endLine": 260,
    "textDigest": "a891e9040923a775f70635493ff6bb5aa31107a805143c37bf35ac97bc34ab9b",
    "sample": "7. Authority (Two-Stage)",
    "sectionPayloadDigest": "411ea8652513c249fff158fbf6bf0db21464ef85deb6d19adf15cc65df3c0807",
    "followingBlockDigest": "2928695057f7d3fe48b36607d329a6e28781eb4dd6293ea07781262aed245bd6",
    "identityFingerprint": "df7c43a483ca428611cd5bc0da61724fde55ceb6a15f31d45ce2c4058a2299c2",
    "ancestry": [
      "Spec: Host Invocation",
      "Retained selected source material",
      "Host Invocation And Provider Routing Architecture"
    ],
    "text": "#### 7. Authority (Two-Stage)",
    "sectionText": "#### 7. Authority (Two-Stage)\n\nCore operation/command namespaces are reserved; plugins add vendor-scoped operations (`acme.deploy.release`) and implement published extension points only; `.fgos` writes, Git mutation, process/network/secret access require explicit capability grants; unknown or ambiguous claims fail closed. **Configuration can never replace a built-in provider** — closed as \"prohibit,\" not open. Rollback of a native operation in R1–R2 is a release rollback through `fgctl` (the previous release still ships both the native provider and the Node payload during the observation window), never a runtime provider-selection swap.\n\nThe provider manifest is never an authority source:\n\n1. **Caller admission** (before routing): principal, operation, project policy, requested context, host surface.\n2. **Selected-provider grant** (after routing): intersects the admitted action with the operation's capability policy and the provider's requested capabilities.\n\nThe provider receives only the resulting least-privilege grant via `InvocationControl`, identically for every host — a single pre-selection gate cannot evaluate the selected provider's identity, trust, or capability request.\n\nSelecting a different provider never silently transfers authority — a replacement returns a result or proof; the existing authority owner still applies transitions and writes state, for built-in, legacy, and external providers alike. Work Lifecycle remains the only owner of Work transitions; Run Result Evaluation may compute confidence without choosing the next status; Dispatch may execute an approved assignment without inventing its operation; an external manifest claim never grants `.fgos`, Git, process, network, or secret access."
  }
}
```

## Entry f-157: link-157

```json
{
  "id": "link-157",
  "path": "docs/platform/host-invocation-routing/intent-preservation-ledger.md",
  "inputLine": 67,
  "inputColumn": 277,
  "lineBeforeLinkPass": 75,
  "before": "[node-to-rust-component-migration.md](../../architect/host-invocation-routing/node-to-rust-component-migration.md#13-rollback-rules)",
  "after": "[node-to-rust-component-migration.md](architecture/node-to-rust-migration.md#13-rollback-rules)",
  "legacyPath": "docs/architect/host-invocation-routing/node-to-rust-component-migration.md",
  "target": {
    "path": "docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md",
    "anchor": "13-rollback-rules",
    "aliasId": "host-invocation-draft-085"
  },
  "portal": false,
  "area": "host-invocation-routing",
  "reviewStatus": "pending",
  "oldDestination": "../../architect/host-invocation-routing/node-to-rust-component-migration.md#13-rollback-rules",
  "newDestination": "architecture/node-to-rust-migration.md#13-rollback-rules",
  "alias": {
    "fromPath": "docs/architect/host-invocation-routing/node-to-rust-component-migration.md#13-rollback-rules",
    "toOwner": "docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md",
    "toAnchor": "13-rollback-rules",
    "kind": "split",
    "evidenceRef": "plans/260925-documentation-authority-unification/reports/phase-06/review-3-rework-source.md",
    "immutableRefs": [],
    "recordedAt": "2026-10-13",
    "aliasId": "host-invocation-draft-085"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 2,
    "title": "13. Rollback Rules",
    "anchor": "13-rollback-rules",
    "githubAnchor": "13-rollback-rules",
    "stableAnchor": "h-dac01ef40cd5",
    "startLine": 377,
    "endLine": 377,
    "textDigest": "30245265d7fc653884caff4a90018addd38af26a0e29f35223b0f4fcd4ecdd20",
    "sample": "13. Rollback Rules",
    "sectionPayloadDigest": "52162dd152f9897fd45adc7eeb79965fe3fd781741875fd3e7d6a8c8b301d7e1",
    "followingBlockDigest": "c2f9416ff4f07d2fbc185f80b1f40d65db10883a380e805cabf3482c5dad8bdb",
    "identityFingerprint": "3d3f1c9ec90ce5f764080a04541d668da1d2670775f63f9ab56f68e37845aec0",
    "ancestry": [
      "Node To Rust Component Migration"
    ],
    "text": "## 13. Rollback Rules",
    "sectionText": "## 13. Rollback Rules\n\nConfig can never replace a built-in provider (host doc open question 2 closed\nas \"prohibit\"). A provider binding is not a runtime-selectable switch, so\nrollback of a native operation in R1–R2 is a release rollback through `fgctl`:\n`ActivationRecord.previousArtifactDigest` + the preserved release directory +\na state-schema compatibility check (see\n[Runtime Identity And Activation](../packaging-distribution/runtime-identity-and-activation.md)\n§11). The previous release still contains both the native provider and the\nNode payload during the operation's observation window, so a release rollback\nrestores the legacy path without restoring the old outer executable by hand.\n\n- Keep legacy and native implementations side by side only for the observation\n  window of their operation.\n- Never delete a Node writer before proving it can read/recover state last\n  written by the Rust implementation, or explicitly declaring the cutover\n  irreversible with migration evidence.\n- Remove rollback code per component after its window; do not accumulate a\n  permanent second implementation tree."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 4,
    "title": "13. Rollback Rules",
    "anchor": "13-rollback-rules",
    "githubAnchor": "13-rollback-rules",
    "stableAnchor": "h-1ea43b8728d2",
    "startLine": 399,
    "endLine": 399,
    "textDigest": "78a99221daab969a51e4fb5d7d337a8e13cdd4d50590c657a267874982cf1134",
    "sample": "13. Rollback Rules",
    "sectionPayloadDigest": "5f9fe6ca7ed2dd68353d1bf9b614d122f787fafc3fba0cd41ba9e005fed257e7",
    "followingBlockDigest": "29c578de76b95abaecf05f7695411e6e1adf794307e6df6c347d098b4dbf6a72",
    "identityFingerprint": "fdb93f8d787873006c0044ea3899df5dd14edcd4f2500d5011bad1567fc3170d",
    "ancestry": [
      "Architecture: Node To Rust Migration",
      "Retained selected source material",
      "Node To Rust Component Migration"
    ],
    "text": "#### 13. Rollback Rules",
    "sectionText": "#### 13. Rollback Rules\n\nConfig can never replace a built-in provider (host doc open question 2 closed\nas \"prohibit\"). A provider binding is not a runtime-selectable switch, so\nrollback of a native operation in R1–R2 is a release rollback through `fgctl`:\n`ActivationRecord.previousArtifactDigest` + the preserved release directory +\na state-schema compatibility check (see\n[Runtime Identity And Activation](../../packaging-distribution/README.md)\n§11). The previous release still contains both the native provider and the\nNode payload during the operation's observation window, so a release rollback\nrestores the legacy path without restoring the old outer executable by hand.\n\n\nAdded in candidate: this retained source detail is carried verbatim in [the dropped-015 restoration](../contracts/component-protocol.md#restored-rollback-bullets)."
  }
}
```

## Entry f-158: link-158

```json
{
  "id": "link-158",
  "path": "docs/platform/host-invocation-routing/intent-preservation-ledger.md",
  "inputLine": 68,
  "inputColumn": 103,
  "lineBeforeLinkPass": 76,
  "before": "[host-invocation-provider-routing.md](../../architect/host-invocation-routing/host-invocation-provider-routing.md#8-failure-cancellation-lifecycle-and-human-input)",
  "after": "[host-invocation-provider-routing.md](spec.md#8-failure-cancellation-lifecycle-and-human-input)",
  "legacyPath": "docs/architect/host-invocation-routing/host-invocation-provider-routing.md",
  "target": {
    "path": "docs/platform/host-invocation-routing/spec.md",
    "anchor": "8-failure-cancellation-lifecycle-and-human-input",
    "aliasId": "host-invocation-draft-047"
  },
  "portal": false,
  "area": "host-invocation-routing",
  "reviewStatus": "pending",
  "oldDestination": "../../architect/host-invocation-routing/host-invocation-provider-routing.md#8-failure-cancellation-lifecycle-and-human-input",
  "newDestination": "spec.md#8-failure-cancellation-lifecycle-and-human-input",
  "alias": {
    "fromPath": "docs/architect/host-invocation-routing/host-invocation-provider-routing.md#8-failure-cancellation-lifecycle-and-human-input",
    "toOwner": "docs/platform/host-invocation-routing/spec.md",
    "toAnchor": "8-failure-cancellation-lifecycle-and-human-input",
    "kind": "split",
    "evidenceRef": "plans/260925-documentation-authority-unification/reports/phase-06/review-3-rework-source.md",
    "immutableRefs": [],
    "recordedAt": "2026-10-13",
    "aliasId": "host-invocation-draft-047"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 2,
    "title": "8. Failure, Cancellation, Lifecycle, And Human Input",
    "anchor": "8-failure-cancellation-lifecycle-and-human-input",
    "githubAnchor": "8-failure-cancellation-lifecycle-and-human-input",
    "stableAnchor": "h-a136c9138d1f",
    "startLine": 163,
    "endLine": 163,
    "textDigest": "7a639345a5670ebb3cd24fd27a72fb08467d57f4667517fbd47f51d35b9bb224",
    "sample": "8. Failure, Cancellation, Lifecycle, And Human Input",
    "sectionPayloadDigest": "10fd3245265492235016efbe525b8d9659ccd0f9954f884c3eb0acaa3aa25a32",
    "followingBlockDigest": "57b360fb2f5eca6c39e0789d26807cd21d768ecf49004ae6946c79460e18be15",
    "identityFingerprint": "ddf352ff8ccb2862b427dad4756b12f0799c375068843baa0e71b572e918a0df",
    "ancestry": [
      "Host Invocation And Provider Routing Architecture"
    ],
    "text": "## 8. Failure, Cancellation, Lifecycle, And Human Input",
    "sectionText": "## 8. Failure, Cancellation, Lifecycle, And Human Input\n\nClosed failure families, common across every invocation mechanism:\n\n- semantic validation, precondition, conflict, not-found;\n- caller admission denied, selected-provider capability denied;\n- no binding, ambiguous binding, incompatible contract;\n- provider unavailable, protocol violation, provider crash;\n- deadline exceeded, caller cancelled, completion unknown.\n\nEach host presenter maps these onto its own contract (`fgos.v1`/exit codes, REST/MCP response, chat result); `InvocationService` preserves invocation/provider IDs so projections correlate without scraping output. Transport adapters never turn a provider crash into a semantic failure or infer success from partial output. A remote disconnect cancels through the same invocation context as a CLI interrupt; a crash never authorizes an automatic replay of a non-idempotent operation. The provider port is asynchronous from v1 — deadlines, cancellation, progress, and backpressure are already runtime requirements, so deferring async would change the ABI at the first real remote/process integration.\n\n```txt\nreceived -> admitted | admission-refused\n         -> selected | selection-refused\n         -> granted | grant-refused\n         -> dispatched\n         -> succeeded | semantic-failed | cancelled | deadline-exceeded\n                       | provider-failed | completion-unknown\n```\n\nExactly one terminal record is emitted; `dispatched` is the point after which a transport loss may be completion-unknown, and a late response after cancellation/deadline is diagnostic evidence, not a second terminal truth. Records carry invocation/parent-correlation ID, contract versions, registry fingerprint, provider ID, host kind, timing, terminal family, evidence references — never secrets or capability material.\n\nFor idempotency-keyed operations the key lives in the owning operation contract and is stable across an authorized retry; the router never invents one. Read-only does not imply retry-safe when the provider has external effects — the catalog's declared idempotency decides.\n\n**Human input:** a provider never blocks waiting for a person. It returns a `parked` `ProviderOutcome`; the host or work lifecycle re-invokes later. No provider is ever given a mid-invocation callback to solicit input."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 4,
    "title": "8. Failure, Cancellation, Lifecycle, And Human Input",
    "anchor": "8-failure-cancellation-lifecycle-and-human-input",
    "githubAnchor": "8-failure-cancellation-lifecycle-and-human-input",
    "stableAnchor": "h-2e5dbf661756",
    "startLine": 273,
    "endLine": 273,
    "textDigest": "a3fd2fb5bbb38608bae7071b5f0571cbcccb756e34449544f509d1d40fc8fdc6",
    "sample": "8. Failure, Cancellation, Lifecycle, And Human Input",
    "sectionPayloadDigest": "a6182701fc2342bc0cfb57af9d3938f78825c17dd9dd88234371c35e325eb6d2",
    "followingBlockDigest": "57b360fb2f5eca6c39e0789d26807cd21d768ecf49004ae6946c79460e18be15",
    "identityFingerprint": "38d1a84904eef01fab2fcb4720ba8c8f5d843ef4095bc8c7dce8de631557220b",
    "ancestry": [
      "Spec: Host Invocation",
      "Retained selected source material",
      "Host Invocation And Provider Routing Architecture"
    ],
    "text": "#### 8. Failure, Cancellation, Lifecycle, And Human Input",
    "sectionText": "#### 8. Failure, Cancellation, Lifecycle, And Human Input\n\nClosed failure families, common across every invocation mechanism:\n\n- semantic validation, precondition, conflict, not-found;\n- caller admission denied, selected-provider capability denied;\n- no binding, ambiguous binding, incompatible contract;\n- provider unavailable, protocol violation, provider crash;\n- deadline exceeded, caller cancelled, completion unknown.\n\nEach host presenter maps these onto its own contract (`fgos.v1`/exit codes, REST/MCP response, chat result); `InvocationService` preserves invocation/provider IDs so projections correlate without scraping output. Transport adapters never turn a provider crash into a semantic failure or infer success from partial output. A remote disconnect cancels through the same invocation context as a CLI interrupt; a crash never authorizes an automatic replay of a non-idempotent operation. The provider port is asynchronous from v1 — deadlines, cancellation, progress, and backpressure are already runtime requirements, so deferring async would change the ABI at the first real remote/process integration.\n\n\nAdded in candidate: this retained source detail is carried verbatim in [the dropped-003 restoration](contracts/component-protocol.md#restored-lifecycle-state-chain-received-admitted-refused-selected-refused-granted-refused-dispatched-te).\n\n\nExactly one terminal record is emitted; `dispatched` is the point after which a transport loss may be completion-unknown, and a late response after cancellation/deadline is diagnostic evidence, not a second terminal truth. Records carry invocation/parent-correlation ID, contract versions, registry fingerprint, provider ID, host kind, timing, terminal family, evidence references — never secrets or capability material.\n\n\nAdded in candidate: this retained source detail is carried verbatim in [the dropped-002 restoration](contracts/component-protocol.md#restored-contract-versioning).\n\n\n**Human input:** a provider never blocks waiting for a person. It returns a `parked` `ProviderOutcome`; the host or work lifecycle re-invokes later. No provider is ever given a mid-invocation callback to solicit input."
  }
}
```

## Entry f-159: link-159

```json
{
  "id": "link-159",
  "path": "docs/platform/host-invocation-routing/intent-preservation-ledger.md",
  "inputLine": 69,
  "inputColumn": 149,
  "lineBeforeLinkPass": 77,
  "before": "[host-invocation-provider-routing.md](../../architect/host-invocation-routing/host-invocation-provider-routing.md#8-failure-cancellation-lifecycle-and-human-input)",
  "after": "[host-invocation-provider-routing.md](spec.md#8-failure-cancellation-lifecycle-and-human-input)",
  "legacyPath": "docs/architect/host-invocation-routing/host-invocation-provider-routing.md",
  "target": {
    "path": "docs/platform/host-invocation-routing/spec.md",
    "anchor": "8-failure-cancellation-lifecycle-and-human-input",
    "aliasId": "host-invocation-draft-047"
  },
  "portal": false,
  "area": "host-invocation-routing",
  "reviewStatus": "pending",
  "oldDestination": "../../architect/host-invocation-routing/host-invocation-provider-routing.md#8-failure-cancellation-lifecycle-and-human-input",
  "newDestination": "spec.md#8-failure-cancellation-lifecycle-and-human-input",
  "alias": {
    "fromPath": "docs/architect/host-invocation-routing/host-invocation-provider-routing.md#8-failure-cancellation-lifecycle-and-human-input",
    "toOwner": "docs/platform/host-invocation-routing/spec.md",
    "toAnchor": "8-failure-cancellation-lifecycle-and-human-input",
    "kind": "split",
    "evidenceRef": "plans/260925-documentation-authority-unification/reports/phase-06/review-3-rework-source.md",
    "immutableRefs": [],
    "recordedAt": "2026-10-13",
    "aliasId": "host-invocation-draft-047"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 2,
    "title": "8. Failure, Cancellation, Lifecycle, And Human Input",
    "anchor": "8-failure-cancellation-lifecycle-and-human-input",
    "githubAnchor": "8-failure-cancellation-lifecycle-and-human-input",
    "stableAnchor": "h-a136c9138d1f",
    "startLine": 163,
    "endLine": 163,
    "textDigest": "7a639345a5670ebb3cd24fd27a72fb08467d57f4667517fbd47f51d35b9bb224",
    "sample": "8. Failure, Cancellation, Lifecycle, And Human Input",
    "sectionPayloadDigest": "10fd3245265492235016efbe525b8d9659ccd0f9954f884c3eb0acaa3aa25a32",
    "followingBlockDigest": "57b360fb2f5eca6c39e0789d26807cd21d768ecf49004ae6946c79460e18be15",
    "identityFingerprint": "ddf352ff8ccb2862b427dad4756b12f0799c375068843baa0e71b572e918a0df",
    "ancestry": [
      "Host Invocation And Provider Routing Architecture"
    ],
    "text": "## 8. Failure, Cancellation, Lifecycle, And Human Input",
    "sectionText": "## 8. Failure, Cancellation, Lifecycle, And Human Input\n\nClosed failure families, common across every invocation mechanism:\n\n- semantic validation, precondition, conflict, not-found;\n- caller admission denied, selected-provider capability denied;\n- no binding, ambiguous binding, incompatible contract;\n- provider unavailable, protocol violation, provider crash;\n- deadline exceeded, caller cancelled, completion unknown.\n\nEach host presenter maps these onto its own contract (`fgos.v1`/exit codes, REST/MCP response, chat result); `InvocationService` preserves invocation/provider IDs so projections correlate without scraping output. Transport adapters never turn a provider crash into a semantic failure or infer success from partial output. A remote disconnect cancels through the same invocation context as a CLI interrupt; a crash never authorizes an automatic replay of a non-idempotent operation. The provider port is asynchronous from v1 — deadlines, cancellation, progress, and backpressure are already runtime requirements, so deferring async would change the ABI at the first real remote/process integration.\n\n```txt\nreceived -> admitted | admission-refused\n         -> selected | selection-refused\n         -> granted | grant-refused\n         -> dispatched\n         -> succeeded | semantic-failed | cancelled | deadline-exceeded\n                       | provider-failed | completion-unknown\n```\n\nExactly one terminal record is emitted; `dispatched` is the point after which a transport loss may be completion-unknown, and a late response after cancellation/deadline is diagnostic evidence, not a second terminal truth. Records carry invocation/parent-correlation ID, contract versions, registry fingerprint, provider ID, host kind, timing, terminal family, evidence references — never secrets or capability material.\n\nFor idempotency-keyed operations the key lives in the owning operation contract and is stable across an authorized retry; the router never invents one. Read-only does not imply retry-safe when the provider has external effects — the catalog's declared idempotency decides.\n\n**Human input:** a provider never blocks waiting for a person. It returns a `parked` `ProviderOutcome`; the host or work lifecycle re-invokes later. No provider is ever given a mid-invocation callback to solicit input."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 4,
    "title": "8. Failure, Cancellation, Lifecycle, And Human Input",
    "anchor": "8-failure-cancellation-lifecycle-and-human-input",
    "githubAnchor": "8-failure-cancellation-lifecycle-and-human-input",
    "stableAnchor": "h-2e5dbf661756",
    "startLine": 273,
    "endLine": 273,
    "textDigest": "a3fd2fb5bbb38608bae7071b5f0571cbcccb756e34449544f509d1d40fc8fdc6",
    "sample": "8. Failure, Cancellation, Lifecycle, And Human Input",
    "sectionPayloadDigest": "a6182701fc2342bc0cfb57af9d3938f78825c17dd9dd88234371c35e325eb6d2",
    "followingBlockDigest": "57b360fb2f5eca6c39e0789d26807cd21d768ecf49004ae6946c79460e18be15",
    "identityFingerprint": "38d1a84904eef01fab2fcb4720ba8c8f5d843ef4095bc8c7dce8de631557220b",
    "ancestry": [
      "Spec: Host Invocation",
      "Retained selected source material",
      "Host Invocation And Provider Routing Architecture"
    ],
    "text": "#### 8. Failure, Cancellation, Lifecycle, And Human Input",
    "sectionText": "#### 8. Failure, Cancellation, Lifecycle, And Human Input\n\nClosed failure families, common across every invocation mechanism:\n\n- semantic validation, precondition, conflict, not-found;\n- caller admission denied, selected-provider capability denied;\n- no binding, ambiguous binding, incompatible contract;\n- provider unavailable, protocol violation, provider crash;\n- deadline exceeded, caller cancelled, completion unknown.\n\nEach host presenter maps these onto its own contract (`fgos.v1`/exit codes, REST/MCP response, chat result); `InvocationService` preserves invocation/provider IDs so projections correlate without scraping output. Transport adapters never turn a provider crash into a semantic failure or infer success from partial output. A remote disconnect cancels through the same invocation context as a CLI interrupt; a crash never authorizes an automatic replay of a non-idempotent operation. The provider port is asynchronous from v1 — deadlines, cancellation, progress, and backpressure are already runtime requirements, so deferring async would change the ABI at the first real remote/process integration.\n\n\nAdded in candidate: this retained source detail is carried verbatim in [the dropped-003 restoration](contracts/component-protocol.md#restored-lifecycle-state-chain-received-admitted-refused-selected-refused-granted-refused-dispatched-te).\n\n\nExactly one terminal record is emitted; `dispatched` is the point after which a transport loss may be completion-unknown, and a late response after cancellation/deadline is diagnostic evidence, not a second terminal truth. Records carry invocation/parent-correlation ID, contract versions, registry fingerprint, provider ID, host kind, timing, terminal family, evidence references — never secrets or capability material.\n\n\nAdded in candidate: this retained source detail is carried verbatim in [the dropped-002 restoration](contracts/component-protocol.md#restored-contract-versioning).\n\n\n**Human input:** a provider never blocks waiting for a person. It returns a `parked` `ProviderOutcome`; the host or work lifecycle re-invokes later. No provider is ever given a mid-invocation callback to solicit input."
  }
}
```

## Entry f-160: link-160

```json
{
  "id": "link-160",
  "path": "docs/platform/host-invocation-routing/intent-preservation-ledger.md",
  "inputLine": 70,
  "inputColumn": 84,
  "lineBeforeLinkPass": 78,
  "before": "[host-invocation-provider-routing.md](../../architect/host-invocation-routing/host-invocation-provider-routing.md#8-failure-cancellation-lifecycle-and-human-input)",
  "after": "[host-invocation-provider-routing.md](spec.md#8-failure-cancellation-lifecycle-and-human-input)",
  "legacyPath": "docs/architect/host-invocation-routing/host-invocation-provider-routing.md",
  "target": {
    "path": "docs/platform/host-invocation-routing/spec.md",
    "anchor": "8-failure-cancellation-lifecycle-and-human-input",
    "aliasId": "host-invocation-draft-047"
  },
  "portal": false,
  "area": "host-invocation-routing",
  "reviewStatus": "pending",
  "oldDestination": "../../architect/host-invocation-routing/host-invocation-provider-routing.md#8-failure-cancellation-lifecycle-and-human-input",
  "newDestination": "spec.md#8-failure-cancellation-lifecycle-and-human-input",
  "alias": {
    "fromPath": "docs/architect/host-invocation-routing/host-invocation-provider-routing.md#8-failure-cancellation-lifecycle-and-human-input",
    "toOwner": "docs/platform/host-invocation-routing/spec.md",
    "toAnchor": "8-failure-cancellation-lifecycle-and-human-input",
    "kind": "split",
    "evidenceRef": "plans/260925-documentation-authority-unification/reports/phase-06/review-3-rework-source.md",
    "immutableRefs": [],
    "recordedAt": "2026-10-13",
    "aliasId": "host-invocation-draft-047"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 2,
    "title": "8. Failure, Cancellation, Lifecycle, And Human Input",
    "anchor": "8-failure-cancellation-lifecycle-and-human-input",
    "githubAnchor": "8-failure-cancellation-lifecycle-and-human-input",
    "stableAnchor": "h-a136c9138d1f",
    "startLine": 163,
    "endLine": 163,
    "textDigest": "7a639345a5670ebb3cd24fd27a72fb08467d57f4667517fbd47f51d35b9bb224",
    "sample": "8. Failure, Cancellation, Lifecycle, And Human Input",
    "sectionPayloadDigest": "10fd3245265492235016efbe525b8d9659ccd0f9954f884c3eb0acaa3aa25a32",
    "followingBlockDigest": "57b360fb2f5eca6c39e0789d26807cd21d768ecf49004ae6946c79460e18be15",
    "identityFingerprint": "ddf352ff8ccb2862b427dad4756b12f0799c375068843baa0e71b572e918a0df",
    "ancestry": [
      "Host Invocation And Provider Routing Architecture"
    ],
    "text": "## 8. Failure, Cancellation, Lifecycle, And Human Input",
    "sectionText": "## 8. Failure, Cancellation, Lifecycle, And Human Input\n\nClosed failure families, common across every invocation mechanism:\n\n- semantic validation, precondition, conflict, not-found;\n- caller admission denied, selected-provider capability denied;\n- no binding, ambiguous binding, incompatible contract;\n- provider unavailable, protocol violation, provider crash;\n- deadline exceeded, caller cancelled, completion unknown.\n\nEach host presenter maps these onto its own contract (`fgos.v1`/exit codes, REST/MCP response, chat result); `InvocationService` preserves invocation/provider IDs so projections correlate without scraping output. Transport adapters never turn a provider crash into a semantic failure or infer success from partial output. A remote disconnect cancels through the same invocation context as a CLI interrupt; a crash never authorizes an automatic replay of a non-idempotent operation. The provider port is asynchronous from v1 — deadlines, cancellation, progress, and backpressure are already runtime requirements, so deferring async would change the ABI at the first real remote/process integration.\n\n```txt\nreceived -> admitted | admission-refused\n         -> selected | selection-refused\n         -> granted | grant-refused\n         -> dispatched\n         -> succeeded | semantic-failed | cancelled | deadline-exceeded\n                       | provider-failed | completion-unknown\n```\n\nExactly one terminal record is emitted; `dispatched` is the point after which a transport loss may be completion-unknown, and a late response after cancellation/deadline is diagnostic evidence, not a second terminal truth. Records carry invocation/parent-correlation ID, contract versions, registry fingerprint, provider ID, host kind, timing, terminal family, evidence references — never secrets or capability material.\n\nFor idempotency-keyed operations the key lives in the owning operation contract and is stable across an authorized retry; the router never invents one. Read-only does not imply retry-safe when the provider has external effects — the catalog's declared idempotency decides.\n\n**Human input:** a provider never blocks waiting for a person. It returns a `parked` `ProviderOutcome`; the host or work lifecycle re-invokes later. No provider is ever given a mid-invocation callback to solicit input."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 4,
    "title": "8. Failure, Cancellation, Lifecycle, And Human Input",
    "anchor": "8-failure-cancellation-lifecycle-and-human-input",
    "githubAnchor": "8-failure-cancellation-lifecycle-and-human-input",
    "stableAnchor": "h-2e5dbf661756",
    "startLine": 273,
    "endLine": 273,
    "textDigest": "a3fd2fb5bbb38608bae7071b5f0571cbcccb756e34449544f509d1d40fc8fdc6",
    "sample": "8. Failure, Cancellation, Lifecycle, And Human Input",
    "sectionPayloadDigest": "a6182701fc2342bc0cfb57af9d3938f78825c17dd9dd88234371c35e325eb6d2",
    "followingBlockDigest": "57b360fb2f5eca6c39e0789d26807cd21d768ecf49004ae6946c79460e18be15",
    "identityFingerprint": "38d1a84904eef01fab2fcb4720ba8c8f5d843ef4095bc8c7dce8de631557220b",
    "ancestry": [
      "Spec: Host Invocation",
      "Retained selected source material",
      "Host Invocation And Provider Routing Architecture"
    ],
    "text": "#### 8. Failure, Cancellation, Lifecycle, And Human Input",
    "sectionText": "#### 8. Failure, Cancellation, Lifecycle, And Human Input\n\nClosed failure families, common across every invocation mechanism:\n\n- semantic validation, precondition, conflict, not-found;\n- caller admission denied, selected-provider capability denied;\n- no binding, ambiguous binding, incompatible contract;\n- provider unavailable, protocol violation, provider crash;\n- deadline exceeded, caller cancelled, completion unknown.\n\nEach host presenter maps these onto its own contract (`fgos.v1`/exit codes, REST/MCP response, chat result); `InvocationService` preserves invocation/provider IDs so projections correlate without scraping output. Transport adapters never turn a provider crash into a semantic failure or infer success from partial output. A remote disconnect cancels through the same invocation context as a CLI interrupt; a crash never authorizes an automatic replay of a non-idempotent operation. The provider port is asynchronous from v1 — deadlines, cancellation, progress, and backpressure are already runtime requirements, so deferring async would change the ABI at the first real remote/process integration.\n\n\nAdded in candidate: this retained source detail is carried verbatim in [the dropped-003 restoration](contracts/component-protocol.md#restored-lifecycle-state-chain-received-admitted-refused-selected-refused-granted-refused-dispatched-te).\n\n\nExactly one terminal record is emitted; `dispatched` is the point after which a transport loss may be completion-unknown, and a late response after cancellation/deadline is diagnostic evidence, not a second terminal truth. Records carry invocation/parent-correlation ID, contract versions, registry fingerprint, provider ID, host kind, timing, terminal family, evidence references — never secrets or capability material.\n\n\nAdded in candidate: this retained source detail is carried verbatim in [the dropped-002 restoration](contracts/component-protocol.md#restored-contract-versioning).\n\n\n**Human input:** a provider never blocks waiting for a person. It returns a `parked` `ProviderOutcome`; the host or work lifecycle re-invokes later. No provider is ever given a mid-invocation callback to solicit input."
  }
}
```

## Entry f-161: link-161

```json
{
  "id": "link-161",
  "path": "docs/platform/host-invocation-routing/intent-preservation-ledger.md",
  "inputLine": 70,
  "inputColumn": 249,
  "lineBeforeLinkPass": 78,
  "before": "[node-to-rust-component-migration.md](../../architect/host-invocation-routing/node-to-rust-component-migration.md#9-repeat-by-component-boundary)",
  "after": "[node-to-rust-component-migration.md](architecture/node-to-rust-migration.md#9-repeat-by-component-boundary)",
  "legacyPath": "docs/architect/host-invocation-routing/node-to-rust-component-migration.md",
  "target": {
    "path": "docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md",
    "anchor": "9-repeat-by-component-boundary",
    "aliasId": "host-invocation-draft-081"
  },
  "portal": false,
  "area": "host-invocation-routing",
  "reviewStatus": "pending",
  "oldDestination": "../../architect/host-invocation-routing/node-to-rust-component-migration.md#9-repeat-by-component-boundary",
  "newDestination": "architecture/node-to-rust-migration.md#9-repeat-by-component-boundary",
  "alias": {
    "fromPath": "docs/architect/host-invocation-routing/node-to-rust-component-migration.md#9-repeat-by-component-boundary",
    "toOwner": "docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md",
    "toAnchor": "9-repeat-by-component-boundary",
    "kind": "split",
    "evidenceRef": "plans/260925-documentation-authority-unification/reports/phase-06/review-3-rework-source.md",
    "immutableRefs": [],
    "recordedAt": "2026-10-13",
    "aliasId": "host-invocation-draft-081"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 2,
    "title": "9. Repeat By Component Boundary",
    "anchor": "9-repeat-by-component-boundary",
    "githubAnchor": "9-repeat-by-component-boundary",
    "stableAnchor": "h-50e1a5e5c610",
    "startLine": 303,
    "endLine": 303,
    "textDigest": "d1c2fad49a5087903461482aaa9dbb0b96c53baa6db717e0546f8b185552307f",
    "sample": "9. Repeat By Component Boundary",
    "sectionPayloadDigest": "3bd0d07e7c8bd44962dcbab7a0479af9a3b22ddf0208a1ae81e3fdf4221408f4",
    "followingBlockDigest": "79c90b13578b11cbdf28fc7face8f0233b2a18f29356d12b4e874c89d706e952",
    "identityFingerprint": "8fc9a0b059f467fd22e276b64deea49abedfdab94744e2344088ac777bb91a21",
    "ancestry": [
      "Node To Rust Component Migration"
    ],
    "text": "## 9. Repeat By Component Boundary",
    "sectionText": "## 9. Repeat By Component Boundary\n\nFor each subsequent component:\n\n1. Read\n   [fgOS Component Boundary Advisory](../component-boundary/component-boundary-advisory.md)\n   and name responsibility, semantic operations, authority, state, side\n   effects, component class, and physical placement.\n2. Select a complete operation/use-case boundary rather than private helpers.\n3. Capture current Node behavior as shared fixtures.\n4. Extract only the Node boundary needed for this migration slice.\n5. Implement the corresponding native Rust provider.\n6. Run both providers against the same semantic fixtures.\n7. Shadow only side-effect-free reads.\n8. Switch the operation from legacy to native after parity proof.\n9. Observe the rollback window.\n10. Remove the Node implementation in a later cleanup change.\n\nNear-thin read-only operations come before complex write owners. File size alone\ndoes not choose order.\n\nA native provider never blocks waiting for a person. An operation that needs\nhuman input returns a `parked` outcome and is re-invoked by the work\nlifecycle, not by a provider-side wait. This must hold before any\n`ask`/`answer`-shaped operation migrates."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 4,
    "title": "9. Repeat By Component Boundary",
    "anchor": "9-repeat-by-component-boundary",
    "githubAnchor": "9-repeat-by-component-boundary",
    "stableAnchor": "h-bae121ca3e54",
    "startLine": 341,
    "endLine": 341,
    "textDigest": "ef6d9f08943bdc073dcf957c969015d6821b081aeb08b90898f0f1024dd2319e",
    "sample": "9. Repeat By Component Boundary",
    "sectionPayloadDigest": "f1ec3a7a632d5203e8af415779a1a90b61d4e3a7e7b797a6a0aa7e9088c24349",
    "followingBlockDigest": "8fd9f660c71f26f5134efb4d9cebe6d3f2cd253694c0b6572c6faa7b6dca998f",
    "identityFingerprint": "0a47f3421600dc0f9d9ce6a9414af436b1b3954383d88f240db32031bee7ef6b",
    "ancestry": [
      "Architecture: Node To Rust Migration",
      "Retained selected source material",
      "Node To Rust Component Migration"
    ],
    "text": "#### 9. Repeat By Component Boundary",
    "sectionText": "#### 9. Repeat By Component Boundary\n\n\nAdded in candidate: this retained source detail is carried verbatim in [the dropped-014 restoration](../contracts/component-protocol.md#restored-per-component-repeat-procedure).\n\n\n\nNear-thin read-only operations come before complex write owners. File size alone\ndoes not choose order.\n\nA native provider never blocks waiting for a person. An operation that needs\nhuman input returns a `parked` outcome and is re-invoked by the work\nlifecycle, not by a provider-side wait. This must hold before any\n`ask`/`answer`-shaped operation migrates."
  }
}
```

## Entry f-162: link-162

```json
{
  "id": "link-162",
  "path": "docs/platform/host-invocation-routing/intent-preservation-ledger.md",
  "inputLine": 71,
  "inputColumn": 125,
  "lineBeforeLinkPass": 79,
  "before": "[host-invocation-provider-routing.md](../../architect/host-invocation-routing/host-invocation-provider-routing.md#9-physical-placement)",
  "after": "[host-invocation-provider-routing.md](spec.md#9-physical-placement)",
  "legacyPath": "docs/architect/host-invocation-routing/host-invocation-provider-routing.md",
  "target": {
    "path": "docs/platform/host-invocation-routing/spec.md",
    "anchor": "9-physical-placement",
    "aliasId": "host-invocation-draft-048"
  },
  "portal": false,
  "area": "host-invocation-routing",
  "reviewStatus": "pending",
  "oldDestination": "../../architect/host-invocation-routing/host-invocation-provider-routing.md#9-physical-placement",
  "newDestination": "spec.md#9-physical-placement",
  "alias": {
    "fromPath": "docs/architect/host-invocation-routing/host-invocation-provider-routing.md#9-physical-placement",
    "toOwner": "docs/platform/host-invocation-routing/spec.md",
    "toAnchor": "9-physical-placement",
    "kind": "split",
    "evidenceRef": "plans/260925-documentation-authority-unification/reports/phase-06/review-3-rework-source.md",
    "immutableRefs": [],
    "recordedAt": "2026-10-13",
    "aliasId": "host-invocation-draft-048"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 2,
    "title": "9. Physical Placement",
    "anchor": "9-physical-placement",
    "githubAnchor": "9-physical-placement",
    "stableAnchor": "h-734ef9c7c806",
    "startLine": 190,
    "endLine": 190,
    "textDigest": "26dedcce46fdb8fba749ce8ecb56418bbc45624ad00c28a2a355647221c73a35",
    "sample": "9. Physical Placement",
    "sectionPayloadDigest": "86f63d6a668a01cf29b981c04f573fe6b18a2ad20f3a3e948e53004b8d9bb7ed",
    "followingBlockDigest": "c840292ccea938c3cf06ce6a02184761ebb3e3e8c6929420be628a793adced07",
    "identityFingerprint": "025318b6bff39c21f35236b4ec2d2418b6fac8017fa62a96f2cbcfe9bd846fd3",
    "ancestry": [
      "Host Invocation And Provider Routing Architecture"
    ],
    "text": "## 9. Physical Placement",
    "sectionText": "## 9. Physical Placement\n\nThe public command name stays `fgos` — runtime identity is the release digest, not the name, and every skill, hook, plugin, and Herdr call already targets `fgos <verb>`. `fgctl` is a separate bootstrap binary, not a renamed `fgos`. Crate names are kebab-case with an `fgos-` prefix; modules are snake_case.\n\n```txt\nCargo.toml                           # workspace root; herdr-plugin/ excluded in R1\napps/\n  fgos/                              # crate `fgos`, binary `fgos` — thin CLI adapter\n    src/cli_projector.rs             # argv -> OperationRequest\n    src/cli_presenter.rs             # ProviderOutcome -> fgos.v1 / exit code\n    src/legacy_exec.rs               # CommandRouteDescriptor lookup + Node payload exec\n  gateway/                           # later: thin REST/MCP/remote adapter (repo-layout-vision)\n\npackages/\n  host-runtime/rust/                 # crate `fgos-host-runtime` — the kernel\n    src/contracts.rs                 # OperationId, HostInvocation, OperationRequest, ProviderOutcome, ...\n    src/operation_provider_router.rs\n    src/invocation_service.rs\n    src/authority_gate.rs\n    src/providers/builtin.rs\n    src/remote_host_use_case.rs      # R3\n    src/chat_host_use_case.rs        # later\n    src/registry_linker.rs           # R2\n    src/providers/{external_process,external_wasm}.rs   # R2+\n  distribution/rust/                 # crate `fgos-distribution` — owns distribution.build.show\n  component-protocol/{rust,node}/    # R2: EncodedMessage, framed protocol\n\nbin/fgos.mjs, src/, scripts/, core/ ...   # the Node payload, unmoved (Legacy CLI Transition §2)\n```\n\nR1 is three crates: `fgos`, `fgos-host-runtime`, `fgos-distribution`. The legacy exec lane is a module inside `apps/fgos`, not a crate, because it is CLI-adapter-local (§4). `component-protocol` waits for R2 (only an external-process adapter needs `EncodedMessage`). Extract further crates only when pressure is real. Neither app owns provider selection; neither host use case imports another; every host feeds the shared authority/router/contracts layer, and provider adapters depend on component protocols, not host presentation. A component is not created merely because one proof verb is convenient (`gate-bypass` stays under its settled authority, not a manufactured `gate-policy` component).\n\nDistribution selects and activates the trusted runtime (`fgctl`: acquire/stage/verify/activate/upgrade/rollback); host invocation routes inside the activated runtime. Packaging-distribution owns the onboarding command vocabulary: local `fgos init` adopts a workspace under the active identity on first use, `fgos doctor --fix` performs every later registered repair, and the target architecture has no separate `setup` verb. See [Runtime Identity And Activation](../packaging-distribution/runtime-identity-and-activation.md)."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 4,
    "title": "9. Physical Placement",
    "anchor": "9-physical-placement",
    "githubAnchor": "9-physical-placement",
    "stableAnchor": "h-776b284096e9",
    "startLine": 297,
    "endLine": 297,
    "textDigest": "0f09d5374dc9921483fc2894bc4489678d1c3661c9758e0d20a192b984179476",
    "sample": "9. Physical Placement",
    "sectionPayloadDigest": "0789a3e8021eec1872c3cd5653a2fd3ddd4c9cbc7cfafff7847cf967b037cd7c",
    "followingBlockDigest": "c840292ccea938c3cf06ce6a02184761ebb3e3e8c6929420be628a793adced07",
    "identityFingerprint": "e698946eb4cc29f3393e669b85d4a877c4b436058a75df5463f6b59f79199c77",
    "ancestry": [
      "Spec: Host Invocation",
      "Retained selected source material",
      "Host Invocation And Provider Routing Architecture"
    ],
    "text": "#### 9. Physical Placement",
    "sectionText": "#### 9. Physical Placement\n\nThe public command name stays `fgos` — runtime identity is the release digest, not the name, and every skill, hook, plugin, and Herdr call already targets `fgos <verb>`. `fgctl` is a separate bootstrap binary, not a renamed `fgos`. Crate names are kebab-case with an `fgos-` prefix; modules are snake_case.\n\n\nAdded in candidate: this retained source detail is carried verbatim in [the dropped-004 restoration](architecture/release-boundaries.md#restored-physical-placement-layout-tree).\n\n\nR1 is three crates: `fgos`, `fgos-host-runtime`, `fgos-distribution`. The legacy exec lane is a module inside `apps/fgos`, not a crate, because it is CLI-adapter-local (§4). `component-protocol` waits for R2 (only an external-process adapter needs `EncodedMessage`). Extract further crates only when pressure is real. Neither app owns provider selection; neither host use case imports another; every host feeds the shared authority/router/contracts layer, and provider adapters depend on component protocols, not host presentation. A component is not created merely because one proof verb is convenient (`gate-bypass` stays under its settled authority, not a manufactured `gate-policy` component).\n\nDistribution selects and activates the trusted runtime (`fgctl`: acquire/stage/verify/activate/upgrade/rollback); host invocation routes inside the activated runtime. Packaging-distribution owns the onboarding command vocabulary: local `fgos init` adopts a workspace under the active identity on first use, `fgos doctor --fix` performs every later registered repair, and the target architecture has no separate `setup` verb. See [Runtime Identity And Activation](../packaging-distribution/README.md)."
  }
}
```

## Entry f-163: link-163

```json
{
  "id": "link-163",
  "path": "docs/platform/host-invocation-routing/intent-preservation-ledger.md",
  "inputLine": 72,
  "inputColumn": 120,
  "lineBeforeLinkPass": 80,
  "before": "[host-invocation-provider-routing.md](../../architect/host-invocation-routing/host-invocation-provider-routing.md#9-physical-placement)",
  "after": "[host-invocation-provider-routing.md](spec.md#9-physical-placement)",
  "legacyPath": "docs/architect/host-invocation-routing/host-invocation-provider-routing.md",
  "target": {
    "path": "docs/platform/host-invocation-routing/spec.md",
    "anchor": "9-physical-placement",
    "aliasId": "host-invocation-draft-048"
  },
  "portal": false,
  "area": "host-invocation-routing",
  "reviewStatus": "pending",
  "oldDestination": "../../architect/host-invocation-routing/host-invocation-provider-routing.md#9-physical-placement",
  "newDestination": "spec.md#9-physical-placement",
  "alias": {
    "fromPath": "docs/architect/host-invocation-routing/host-invocation-provider-routing.md#9-physical-placement",
    "toOwner": "docs/platform/host-invocation-routing/spec.md",
    "toAnchor": "9-physical-placement",
    "kind": "split",
    "evidenceRef": "plans/260925-documentation-authority-unification/reports/phase-06/review-3-rework-source.md",
    "immutableRefs": [],
    "recordedAt": "2026-10-13",
    "aliasId": "host-invocation-draft-048"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 2,
    "title": "9. Physical Placement",
    "anchor": "9-physical-placement",
    "githubAnchor": "9-physical-placement",
    "stableAnchor": "h-734ef9c7c806",
    "startLine": 190,
    "endLine": 190,
    "textDigest": "26dedcce46fdb8fba749ce8ecb56418bbc45624ad00c28a2a355647221c73a35",
    "sample": "9. Physical Placement",
    "sectionPayloadDigest": "86f63d6a668a01cf29b981c04f573fe6b18a2ad20f3a3e948e53004b8d9bb7ed",
    "followingBlockDigest": "c840292ccea938c3cf06ce6a02184761ebb3e3e8c6929420be628a793adced07",
    "identityFingerprint": "025318b6bff39c21f35236b4ec2d2418b6fac8017fa62a96f2cbcfe9bd846fd3",
    "ancestry": [
      "Host Invocation And Provider Routing Architecture"
    ],
    "text": "## 9. Physical Placement",
    "sectionText": "## 9. Physical Placement\n\nThe public command name stays `fgos` — runtime identity is the release digest, not the name, and every skill, hook, plugin, and Herdr call already targets `fgos <verb>`. `fgctl` is a separate bootstrap binary, not a renamed `fgos`. Crate names are kebab-case with an `fgos-` prefix; modules are snake_case.\n\n```txt\nCargo.toml                           # workspace root; herdr-plugin/ excluded in R1\napps/\n  fgos/                              # crate `fgos`, binary `fgos` — thin CLI adapter\n    src/cli_projector.rs             # argv -> OperationRequest\n    src/cli_presenter.rs             # ProviderOutcome -> fgos.v1 / exit code\n    src/legacy_exec.rs               # CommandRouteDescriptor lookup + Node payload exec\n  gateway/                           # later: thin REST/MCP/remote adapter (repo-layout-vision)\n\npackages/\n  host-runtime/rust/                 # crate `fgos-host-runtime` — the kernel\n    src/contracts.rs                 # OperationId, HostInvocation, OperationRequest, ProviderOutcome, ...\n    src/operation_provider_router.rs\n    src/invocation_service.rs\n    src/authority_gate.rs\n    src/providers/builtin.rs\n    src/remote_host_use_case.rs      # R3\n    src/chat_host_use_case.rs        # later\n    src/registry_linker.rs           # R2\n    src/providers/{external_process,external_wasm}.rs   # R2+\n  distribution/rust/                 # crate `fgos-distribution` — owns distribution.build.show\n  component-protocol/{rust,node}/    # R2: EncodedMessage, framed protocol\n\nbin/fgos.mjs, src/, scripts/, core/ ...   # the Node payload, unmoved (Legacy CLI Transition §2)\n```\n\nR1 is three crates: `fgos`, `fgos-host-runtime`, `fgos-distribution`. The legacy exec lane is a module inside `apps/fgos`, not a crate, because it is CLI-adapter-local (§4). `component-protocol` waits for R2 (only an external-process adapter needs `EncodedMessage`). Extract further crates only when pressure is real. Neither app owns provider selection; neither host use case imports another; every host feeds the shared authority/router/contracts layer, and provider adapters depend on component protocols, not host presentation. A component is not created merely because one proof verb is convenient (`gate-bypass` stays under its settled authority, not a manufactured `gate-policy` component).\n\nDistribution selects and activates the trusted runtime (`fgctl`: acquire/stage/verify/activate/upgrade/rollback); host invocation routes inside the activated runtime. Packaging-distribution owns the onboarding command vocabulary: local `fgos init` adopts a workspace under the active identity on first use, `fgos doctor --fix` performs every later registered repair, and the target architecture has no separate `setup` verb. See [Runtime Identity And Activation](../packaging-distribution/runtime-identity-and-activation.md)."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 4,
    "title": "9. Physical Placement",
    "anchor": "9-physical-placement",
    "githubAnchor": "9-physical-placement",
    "stableAnchor": "h-776b284096e9",
    "startLine": 297,
    "endLine": 297,
    "textDigest": "0f09d5374dc9921483fc2894bc4489678d1c3661c9758e0d20a192b984179476",
    "sample": "9. Physical Placement",
    "sectionPayloadDigest": "0789a3e8021eec1872c3cd5653a2fd3ddd4c9cbc7cfafff7847cf967b037cd7c",
    "followingBlockDigest": "c840292ccea938c3cf06ce6a02184761ebb3e3e8c6929420be628a793adced07",
    "identityFingerprint": "e698946eb4cc29f3393e669b85d4a877c4b436058a75df5463f6b59f79199c77",
    "ancestry": [
      "Spec: Host Invocation",
      "Retained selected source material",
      "Host Invocation And Provider Routing Architecture"
    ],
    "text": "#### 9. Physical Placement",
    "sectionText": "#### 9. Physical Placement\n\nThe public command name stays `fgos` — runtime identity is the release digest, not the name, and every skill, hook, plugin, and Herdr call already targets `fgos <verb>`. `fgctl` is a separate bootstrap binary, not a renamed `fgos`. Crate names are kebab-case with an `fgos-` prefix; modules are snake_case.\n\n\nAdded in candidate: this retained source detail is carried verbatim in [the dropped-004 restoration](architecture/release-boundaries.md#restored-physical-placement-layout-tree).\n\n\nR1 is three crates: `fgos`, `fgos-host-runtime`, `fgos-distribution`. The legacy exec lane is a module inside `apps/fgos`, not a crate, because it is CLI-adapter-local (§4). `component-protocol` waits for R2 (only an external-process adapter needs `EncodedMessage`). Extract further crates only when pressure is real. Neither app owns provider selection; neither host use case imports another; every host feeds the shared authority/router/contracts layer, and provider adapters depend on component protocols, not host presentation. A component is not created merely because one proof verb is convenient (`gate-bypass` stays under its settled authority, not a manufactured `gate-policy` component).\n\nDistribution selects and activates the trusted runtime (`fgctl`: acquire/stage/verify/activate/upgrade/rollback); host invocation routes inside the activated runtime. Packaging-distribution owns the onboarding command vocabulary: local `fgos init` adopts a workspace under the active identity on first use, `fgos doctor --fix` performs every later registered repair, and the target architecture has no separate `setup` verb. See [Runtime Identity And Activation](../packaging-distribution/README.md)."
  }
}
```

## Entry f-164: link-164

```json
{
  "id": "link-164",
  "path": "docs/platform/host-invocation-routing/intent-preservation-ledger.md",
  "inputLine": 72,
  "inputColumn": 257,
  "lineBeforeLinkPass": 80,
  "before": "[rust-cli-and-proof-components-plan.md](../../architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#7-p2-rust-workspace-and-generated-inputs)",
  "after": "[rust-cli-and-proof-components-plan.md](roadmap.md#7-p2-rust-workspace-and-generated-inputs)",
  "legacyPath": "docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md",
  "target": {
    "path": "docs/platform/host-invocation-routing/roadmap.md",
    "anchor": "7-p2-rust-workspace-and-generated-inputs",
    "aliasId": "host-invocation-draft-106"
  },
  "portal": false,
  "area": "host-invocation-routing",
  "reviewStatus": "pending",
  "oldDestination": "../../architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#7-p2-rust-workspace-and-generated-inputs",
  "newDestination": "roadmap.md#7-p2-rust-workspace-and-generated-inputs",
  "alias": {
    "fromPath": "docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#7-p2-rust-workspace-and-generated-inputs",
    "toOwner": "docs/platform/host-invocation-routing/roadmap.md",
    "toAnchor": "7-p2-rust-workspace-and-generated-inputs",
    "kind": "redirected",
    "evidenceRef": "plans/260925-documentation-authority-unification/reports/phase-06/review-3-checkpoint-host-invocation.md",
    "immutableRefs": [],
    "recordedAt": "2026-10-13",
    "aliasId": "host-invocation-draft-106"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 2,
    "title": "7. P2 — Rust Workspace And Generated Inputs",
    "anchor": "7-p2-rust-workspace-and-generated-inputs",
    "githubAnchor": "7-p2-rust-workspace-and-generated-inputs",
    "stableAnchor": "h-8ad91885ebdc",
    "startLine": 248,
    "endLine": 248,
    "textDigest": "f15b9252c05cadc58c8d51e9e3279590d0635eb1be16d081f1ff96cca5b65c6e",
    "sample": "7. P2 — Rust Workspace And Generated Inputs",
    "sectionPayloadDigest": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "followingBlockDigest": null,
    "identityFingerprint": "090de0eebc5b32bf19322b79a834a551489284a23b0ab7631da97a21460f3f57",
    "ancestry": [
      "Rust Host And Proof Providers Implementation Plan"
    ],
    "text": "## 7. P2 — Rust Workspace And Generated Inputs",
    "sectionText": "## 7. P2 — Rust Workspace And Generated Inputs"
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 4,
    "title": "7. P2 — Rust Workspace And Generated Inputs",
    "anchor": "7-p2-rust-workspace-and-generated-inputs",
    "githubAnchor": "7-p2-rust-workspace-and-generated-inputs",
    "stableAnchor": "h-f76a8ab2e83a",
    "startLine": 565,
    "endLine": 565,
    "textDigest": "ee06cf77d949024a6d2d4a3bf9fb063aea66552f206f01a7da0e8f6811a6cb7e",
    "sample": "7. P2 — Rust Workspace And Generated Inputs",
    "sectionPayloadDigest": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "followingBlockDigest": null,
    "identityFingerprint": "74e7298f21a201270d4040f576b197b119971a2a69cdfe1cdf4f7290e93adca7",
    "ancestry": [
      "Host Invocation Routing Roadmap",
      "Retained selected source material",
      "Rust Host And Proof Providers Implementation Plan"
    ],
    "text": "#### 7. P2 — Rust Workspace And Generated Inputs",
    "sectionText": "#### 7. P2 — Rust Workspace And Generated Inputs"
  }
}
```

## Entry f-165: link-165

```json
{
  "id": "link-165",
  "path": "docs/platform/host-invocation-routing/intent-preservation-ledger.md",
  "inputLine": 73,
  "inputColumn": 109,
  "lineBeforeLinkPass": 81,
  "before": "[host-invocation-provider-routing.md](../../architect/host-invocation-routing/host-invocation-provider-routing.md#10-release-boundaries)",
  "after": "[host-invocation-provider-routing.md](spec.md#10-release-boundaries)",
  "legacyPath": "docs/architect/host-invocation-routing/host-invocation-provider-routing.md",
  "target": {
    "path": "docs/platform/host-invocation-routing/spec.md",
    "anchor": "10-release-boundaries",
    "aliasId": "host-invocation-draft-049"
  },
  "portal": false,
  "area": "host-invocation-routing",
  "reviewStatus": "pending",
  "oldDestination": "../../architect/host-invocation-routing/host-invocation-provider-routing.md#10-release-boundaries",
  "newDestination": "spec.md#10-release-boundaries",
  "alias": {
    "fromPath": "docs/architect/host-invocation-routing/host-invocation-provider-routing.md#10-release-boundaries",
    "toOwner": "docs/platform/host-invocation-routing/spec.md",
    "toAnchor": "10-release-boundaries",
    "kind": "redirected",
    "evidenceRef": "plans/260925-documentation-authority-unification/reports/phase-06/review-3-checkpoint-host-invocation.md",
    "immutableRefs": [],
    "recordedAt": "2026-10-13",
    "aliasId": "host-invocation-draft-049"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 2,
    "title": "10. Release Boundaries",
    "anchor": "10-release-boundaries",
    "githubAnchor": "10-release-boundaries",
    "stableAnchor": "h-8507d4ace985",
    "startLine": 224,
    "endLine": 224,
    "textDigest": "c48eca15b23e8496772b6fbb159bc890d0ded8c971463b51e0d4ce7d8bef1ad3",
    "sample": "10. Release Boundaries",
    "sectionPayloadDigest": "44d4c049f1ed952187401b3f858ac0fe2f6ed5ed780eb340856846c1df035994",
    "followingBlockDigest": "06049bca0768ee38177380fc223b8f0f517614d31d6f48803d16871c90ce9382",
    "identityFingerprint": "4e8d7a05586cc4fa50dc45e563514d6400ddc70be4add9be126c8a7c1c79d257",
    "ancestry": [
      "Host Invocation And Provider Routing Architecture"
    ],
    "text": "## 10. Release Boundaries",
    "sectionText": "## 10. Release Boundaries\n\n| Release | Required architecture slice | Explicitly not a gate |\n|---|---|---|\n| R1 — distributable Rust CLI host | Invocation kernel; `const` `OperationCatalog` / `RegistrySnapshot` assembled once at the composition root; two-stage authority; transitional CLI lane in the CLI adapter; native `distribution.build.show`; `fgctl`-driven install/activate/rollback proof. | External ecosystem discovery, WASM, chat, production gateway migration, a `setup` verb. |\n| R2 — external process preview | Process protocol, supervision, fixture conformance, static manifest validation; one-shot CLI loads the derived cache by fingerprint, rebuilds only on mismatch; explicit test/dev roots. | Core replacement, signatures/marketplace, WASM. |\n| R3 — production remote peer | Remote projector/presenter, native route adoption, per-operation Node semantic bridge only where needed; remote peer is the **project-local gateway** (current herdr, same release) composing the host-runtime crate in-process. | Parsing CLI envelopes as internal API; a future **shared multi-project gateway**, which never links a project runtime in-process and instead reaches it through the out-of-process Project Runtime Adapter ([Future Constraints](../packaging-distribution/future-constraints.md) §2) — itself a `remote-host-use-case` adapter inside the project runtime. |\n\nChat is a valid future peer but does not gate R1/R2 until a real chat adapter and its admission/interruption/presentation contracts exist. \"Ship the Rust host\" means a reproducible artifact, target matrix, `fgctl` install/activation coverage, external-project install test, and named rollback channel — passing repository tests alone is a candidate, not a shipped host."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 4,
    "title": "10. Release Boundaries",
    "anchor": "10-release-boundaries",
    "githubAnchor": "10-release-boundaries",
    "stableAnchor": "h-0083005219e1",
    "startLine": 309,
    "endLine": 309,
    "textDigest": "34d9daf13e1ea386e1b5b693f5c126739d63adb992af91721b898e792490361a",
    "sample": "10. Release Boundaries",
    "sectionPayloadDigest": "490a47eeb30fb2694a7220cdce9a14b7a4130ce3597920c5c923706d305c40d8",
    "followingBlockDigest": "967a235d033516997ebf0f52a71ae3875df102a5dd106af58e40486c80475b31",
    "identityFingerprint": "06e3f73c5e86d946459da5f827c28d9242c72199cc269685738960efdfeeda9f",
    "ancestry": [
      "Spec: Host Invocation",
      "Retained selected source material",
      "Host Invocation And Provider Routing Architecture"
    ],
    "text": "#### 10. Release Boundaries",
    "sectionText": "#### 10. Release Boundaries\n\n| Release | Required architecture slice | Explicitly not a gate |\n|---|---|---|\n| R1 — distributable Rust CLI host | Invocation kernel; `const` `OperationCatalog` / `RegistrySnapshot` assembled once at the composition root; two-stage authority; transitional CLI lane in the CLI adapter; native `distribution.build.show`; `fgctl`-driven install/activate/rollback proof. | External ecosystem discovery, WASM, chat, production gateway migration, a `setup` verb. |\n| R2 — external process preview | Process protocol, supervision, fixture conformance, static manifest validation; one-shot CLI loads the derived cache by fingerprint, rebuilds only on mismatch; explicit test/dev roots. | Core replacement, signatures/marketplace, WASM. |\n| R3 — production remote peer | Remote projector/presenter, native route adoption, per-operation Node semantic bridge only where needed; remote peer is the **project-local gateway** (current herdr, same release) composing the host-runtime crate in-process. | Parsing CLI envelopes as internal API; a future **shared multi-project gateway**, which never links a project runtime in-process and instead reaches it through the out-of-process Project Runtime Adapter ([Future Constraints](../packaging-distribution/architecture/future-constraints.md) §2) — itself a `remote-host-use-case` adapter inside the project runtime. |\n\nChat is a valid future peer but does not gate R1/R2 until a real chat adapter and its admission/interruption/presentation contracts exist. \"Ship the Rust host\" means a reproducible artifact, target matrix, `fgctl` install/activation coverage, external-project install test, and named rollback channel — passing repository tests alone is a candidate, not a shipped host."
  }
}
```

## Entry f-166: link-166

```json
{
  "id": "link-166",
  "path": "docs/platform/host-invocation-routing/intent-preservation-ledger.md",
  "inputLine": 73,
  "inputColumn": 247,
  "lineBeforeLinkPass": 81,
  "before": "[rust-cli-and-proof-components-plan.md](../../architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#1-outcome)",
  "after": "[rust-cli-and-proof-components-plan.md](roadmap.md#1-outcome)",
  "legacyPath": "docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md",
  "target": {
    "path": "docs/platform/host-invocation-routing/roadmap.md",
    "anchor": "1-outcome",
    "aliasId": "host-invocation-draft-091"
  },
  "portal": false,
  "area": "host-invocation-routing",
  "reviewStatus": "pending",
  "oldDestination": "../../architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#1-outcome",
  "newDestination": "roadmap.md#1-outcome",
  "alias": {
    "fromPath": "docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#1-outcome",
    "toOwner": "docs/platform/host-invocation-routing/roadmap.md",
    "toAnchor": "1-outcome",
    "kind": "redirected",
    "evidenceRef": "plans/260925-documentation-authority-unification/reports/phase-06/review-3-checkpoint-host-invocation.md",
    "immutableRefs": [],
    "recordedAt": "2026-10-13",
    "aliasId": "host-invocation-draft-091"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 2,
    "title": "1. Outcome",
    "anchor": "1-outcome",
    "githubAnchor": "1-outcome",
    "stableAnchor": "h-ebe13b29d58f",
    "startLine": 30,
    "endLine": 30,
    "textDigest": "a52bf71926ba86864841950d31e08bbde00004c9bc6845dd0724e46e221aabd3",
    "sample": "1. Outcome",
    "sectionPayloadDigest": "2e3f32b01af828b3bf16cde0829b1e51792fcfc4a0fd529a68ff001e13cb6aef",
    "followingBlockDigest": "62f374c5546f8bcbc6881ebbeb92e06b217c31d4229c8e8c862cf1de45532120",
    "identityFingerprint": "cbfe387879b3286a389f46e4494b365578d0901026fe5671a7cb0bb14b9c0018",
    "ancestry": [
      "Rust Host And Proof Providers Implementation Plan"
    ],
    "text": "## 1. Outcome",
    "sectionText": "## 1. Outcome\n\nExecution is complete in three independently shippable releases:\n\n1. **R1 — distributable Rust CLI host:** installed `fgos` is Rust; every\n   unmigrated CLI invocation transparently reaches Node; `version` is native;\n   install, init/doctor, upgrade, rollback, and uninstall are reproducible\n   (install/upgrade/rollback/uninstall via `fgctl`; init/doctor local, under\n   the active identity — `runtime-identity-and-activation.md` §12).\n2. **R2 — external process preview:** one vendor fixture proves the framed\n   process protocol and fail-closed provider path without expanding into a full\n   plugin marketplace.\n3. **R3 — production remote peer:** at least one native gateway route calls the\n   shared invocation service directly; migrated routes neither shell through\n   CLI nor parse `fgos.v1` internally.\n\nR1 is useful without R2 or R3. R2 and R3 may start after the R1 runtime kernel\nis stable, but neither delays the R1 installed-entry flip."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 4,
    "title": "1. Outcome",
    "anchor": "1-outcome",
    "githubAnchor": "1-outcome",
    "stableAnchor": "h-5f812793bbda",
    "startLine": 353,
    "endLine": 353,
    "textDigest": "ad9b4e99d6581b16517683d837d5fecceac1b9568add86aeb1da837e31cb01c3",
    "sample": "1. Outcome",
    "sectionPayloadDigest": "2e3f32b01af828b3bf16cde0829b1e51792fcfc4a0fd529a68ff001e13cb6aef",
    "followingBlockDigest": "62f374c5546f8bcbc6881ebbeb92e06b217c31d4229c8e8c862cf1de45532120",
    "identityFingerprint": "8d3868c38ca2fedc4f6c5637592149289f2dce156364e36b7360e90cf275e084",
    "ancestry": [
      "Host Invocation Routing Roadmap",
      "Retained selected source material",
      "Rust Host And Proof Providers Implementation Plan"
    ],
    "text": "#### 1. Outcome",
    "sectionText": "#### 1. Outcome\n\nExecution is complete in three independently shippable releases:\n\n1. **R1 — distributable Rust CLI host:** installed `fgos` is Rust; every\n   unmigrated CLI invocation transparently reaches Node; `version` is native;\n   install, init/doctor, upgrade, rollback, and uninstall are reproducible\n   (install/upgrade/rollback/uninstall via `fgctl`; init/doctor local, under\n   the active identity — `runtime-identity-and-activation.md` §12).\n2. **R2 — external process preview:** one vendor fixture proves the framed\n   process protocol and fail-closed provider path without expanding into a full\n   plugin marketplace.\n3. **R3 — production remote peer:** at least one native gateway route calls the\n   shared invocation service directly; migrated routes neither shell through\n   CLI nor parse `fgos.v1` internally.\n\nR1 is useful without R2 or R3. R2 and R3 may start after the R1 runtime kernel\nis stable, but neither delays the R1 installed-entry flip."
  }
}
```

## Entry f-167: link-167

```json
{
  "id": "link-167",
  "path": "docs/platform/host-invocation-routing/intent-preservation-ledger.md",
  "inputLine": 74,
  "inputColumn": 101,
  "lineBeforeLinkPass": 82,
  "before": "[host-invocation-provider-routing.md](../../architect/host-invocation-routing/host-invocation-provider-routing.md#10-release-boundaries)",
  "after": "[host-invocation-provider-routing.md](spec.md#10-release-boundaries)",
  "legacyPath": "docs/architect/host-invocation-routing/host-invocation-provider-routing.md",
  "target": {
    "path": "docs/platform/host-invocation-routing/spec.md",
    "anchor": "10-release-boundaries",
    "aliasId": "host-invocation-draft-049"
  },
  "portal": false,
  "area": "host-invocation-routing",
  "reviewStatus": "pending",
  "oldDestination": "../../architect/host-invocation-routing/host-invocation-provider-routing.md#10-release-boundaries",
  "newDestination": "spec.md#10-release-boundaries",
  "alias": {
    "fromPath": "docs/architect/host-invocation-routing/host-invocation-provider-routing.md#10-release-boundaries",
    "toOwner": "docs/platform/host-invocation-routing/spec.md",
    "toAnchor": "10-release-boundaries",
    "kind": "redirected",
    "evidenceRef": "plans/260925-documentation-authority-unification/reports/phase-06/review-3-checkpoint-host-invocation.md",
    "immutableRefs": [],
    "recordedAt": "2026-10-13",
    "aliasId": "host-invocation-draft-049"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 2,
    "title": "10. Release Boundaries",
    "anchor": "10-release-boundaries",
    "githubAnchor": "10-release-boundaries",
    "stableAnchor": "h-8507d4ace985",
    "startLine": 224,
    "endLine": 224,
    "textDigest": "c48eca15b23e8496772b6fbb159bc890d0ded8c971463b51e0d4ce7d8bef1ad3",
    "sample": "10. Release Boundaries",
    "sectionPayloadDigest": "44d4c049f1ed952187401b3f858ac0fe2f6ed5ed780eb340856846c1df035994",
    "followingBlockDigest": "06049bca0768ee38177380fc223b8f0f517614d31d6f48803d16871c90ce9382",
    "identityFingerprint": "4e8d7a05586cc4fa50dc45e563514d6400ddc70be4add9be126c8a7c1c79d257",
    "ancestry": [
      "Host Invocation And Provider Routing Architecture"
    ],
    "text": "## 10. Release Boundaries",
    "sectionText": "## 10. Release Boundaries\n\n| Release | Required architecture slice | Explicitly not a gate |\n|---|---|---|\n| R1 — distributable Rust CLI host | Invocation kernel; `const` `OperationCatalog` / `RegistrySnapshot` assembled once at the composition root; two-stage authority; transitional CLI lane in the CLI adapter; native `distribution.build.show`; `fgctl`-driven install/activate/rollback proof. | External ecosystem discovery, WASM, chat, production gateway migration, a `setup` verb. |\n| R2 — external process preview | Process protocol, supervision, fixture conformance, static manifest validation; one-shot CLI loads the derived cache by fingerprint, rebuilds only on mismatch; explicit test/dev roots. | Core replacement, signatures/marketplace, WASM. |\n| R3 — production remote peer | Remote projector/presenter, native route adoption, per-operation Node semantic bridge only where needed; remote peer is the **project-local gateway** (current herdr, same release) composing the host-runtime crate in-process. | Parsing CLI envelopes as internal API; a future **shared multi-project gateway**, which never links a project runtime in-process and instead reaches it through the out-of-process Project Runtime Adapter ([Future Constraints](../packaging-distribution/future-constraints.md) §2) — itself a `remote-host-use-case` adapter inside the project runtime. |\n\nChat is a valid future peer but does not gate R1/R2 until a real chat adapter and its admission/interruption/presentation contracts exist. \"Ship the Rust host\" means a reproducible artifact, target matrix, `fgctl` install/activation coverage, external-project install test, and named rollback channel — passing repository tests alone is a candidate, not a shipped host."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 4,
    "title": "10. Release Boundaries",
    "anchor": "10-release-boundaries",
    "githubAnchor": "10-release-boundaries",
    "stableAnchor": "h-0083005219e1",
    "startLine": 309,
    "endLine": 309,
    "textDigest": "34d9daf13e1ea386e1b5b693f5c126739d63adb992af91721b898e792490361a",
    "sample": "10. Release Boundaries",
    "sectionPayloadDigest": "490a47eeb30fb2694a7220cdce9a14b7a4130ce3597920c5c923706d305c40d8",
    "followingBlockDigest": "967a235d033516997ebf0f52a71ae3875df102a5dd106af58e40486c80475b31",
    "identityFingerprint": "06e3f73c5e86d946459da5f827c28d9242c72199cc269685738960efdfeeda9f",
    "ancestry": [
      "Spec: Host Invocation",
      "Retained selected source material",
      "Host Invocation And Provider Routing Architecture"
    ],
    "text": "#### 10. Release Boundaries",
    "sectionText": "#### 10. Release Boundaries\n\n| Release | Required architecture slice | Explicitly not a gate |\n|---|---|---|\n| R1 — distributable Rust CLI host | Invocation kernel; `const` `OperationCatalog` / `RegistrySnapshot` assembled once at the composition root; two-stage authority; transitional CLI lane in the CLI adapter; native `distribution.build.show`; `fgctl`-driven install/activate/rollback proof. | External ecosystem discovery, WASM, chat, production gateway migration, a `setup` verb. |\n| R2 — external process preview | Process protocol, supervision, fixture conformance, static manifest validation; one-shot CLI loads the derived cache by fingerprint, rebuilds only on mismatch; explicit test/dev roots. | Core replacement, signatures/marketplace, WASM. |\n| R3 — production remote peer | Remote projector/presenter, native route adoption, per-operation Node semantic bridge only where needed; remote peer is the **project-local gateway** (current herdr, same release) composing the host-runtime crate in-process. | Parsing CLI envelopes as internal API; a future **shared multi-project gateway**, which never links a project runtime in-process and instead reaches it through the out-of-process Project Runtime Adapter ([Future Constraints](../packaging-distribution/architecture/future-constraints.md) §2) — itself a `remote-host-use-case` adapter inside the project runtime. |\n\nChat is a valid future peer but does not gate R1/R2 until a real chat adapter and its admission/interruption/presentation contracts exist. \"Ship the Rust host\" means a reproducible artifact, target matrix, `fgctl` install/activation coverage, external-project install test, and named rollback channel — passing repository tests alone is a candidate, not a shipped host."
  }
}
```

## Entry f-168: link-168

```json
{
  "id": "link-168",
  "path": "docs/platform/host-invocation-routing/intent-preservation-ledger.md",
  "inputLine": 74,
  "inputColumn": 239,
  "lineBeforeLinkPass": 82,
  "before": "[rust-cli-and-proof-components-plan.md](../../architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#12-p7-external-process-provider-preview)",
  "after": "[rust-cli-and-proof-components-plan.md](roadmap.md#12-p7-external-process-provider-preview)",
  "legacyPath": "docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md",
  "target": {
    "path": "docs/platform/host-invocation-routing/roadmap.md",
    "anchor": "12-p7-external-process-provider-preview",
    "aliasId": "host-invocation-draft-125"
  },
  "portal": false,
  "area": "host-invocation-routing",
  "reviewStatus": "pending",
  "oldDestination": "../../architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#12-p7-external-process-provider-preview",
  "newDestination": "roadmap.md#12-p7-external-process-provider-preview",
  "alias": {
    "fromPath": "docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#12-p7-external-process-provider-preview",
    "toOwner": "docs/platform/host-invocation-routing/roadmap.md",
    "toAnchor": "12-p7-external-process-provider-preview",
    "kind": "redirected",
    "evidenceRef": "plans/260925-documentation-authority-unification/reports/phase-06/review-3-checkpoint-host-invocation.md",
    "immutableRefs": [],
    "recordedAt": "2026-10-13",
    "aliasId": "host-invocation-draft-125"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 2,
    "title": "12. P7 — External Process Provider Preview",
    "anchor": "12-p7-external-process-provider-preview",
    "githubAnchor": "12-p7-external-process-provider-preview",
    "stableAnchor": "h-c33448dce60c",
    "startLine": 506,
    "endLine": 506,
    "textDigest": "d50f37288d0382c6657976b3da57089233d680ba8ebd7f0c735754367433d7d9",
    "sample": "12. P7 — External Process Provider Preview",
    "sectionPayloadDigest": "045ef706aafe96262b3c3b9a2abc194e7d24c45f2d11a37fd7f5885afd67f795",
    "followingBlockDigest": "045ef706aafe96262b3c3b9a2abc194e7d24c45f2d11a37fd7f5885afd67f795",
    "identityFingerprint": "affc09c5e6509af6ff2c1c3a3d86d0a4effb7687c69ec94c48587651bae1f034",
    "ancestry": [
      "Rust Host And Proof Providers Implementation Plan"
    ],
    "text": "## 12. P7 — External Process Provider Preview",
    "sectionText": "## 12. P7 — External Process Provider Preview\n\nSee [External Provider Protocol](./external-provider-protocol.md) for the\nwire-format/handshake contract this section proves against. This is also\nwhere `EncodedMessage` bytes are introduced — built-in providers (P3, P5)\nnever carry them."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 4,
    "title": "12. P7 — External Process Provider Preview",
    "anchor": "12-p7-external-process-provider-preview",
    "githubAnchor": "12-p7-external-process-provider-preview",
    "stableAnchor": "h-037f27ec9e7e",
    "startLine": 823,
    "endLine": 823,
    "textDigest": "a21ecc56e46e790a2a240817aa76c9577ece85fe2b484afe0bcc7707da752c57",
    "sample": "12. P7 — External Process Provider Preview",
    "sectionPayloadDigest": "18c7e8073dd6c5fd6cd05822b630c50d44660275f1aac3ae8cafc2dd270c0798",
    "followingBlockDigest": "18c7e8073dd6c5fd6cd05822b630c50d44660275f1aac3ae8cafc2dd270c0798",
    "identityFingerprint": "bfc4db7ae27f3e7c306432f649b9ca285d09a4fd81966bec9c02a8f316191326",
    "ancestry": [
      "Host Invocation Routing Roadmap",
      "Retained selected source material",
      "Rust Host And Proof Providers Implementation Plan"
    ],
    "text": "#### 12. P7 — External Process Provider Preview",
    "sectionText": "#### 12. P7 — External Process Provider Preview\n\nSee [External Provider Protocol](architecture/external-provider-protocol.md) for the\nwire-format/handshake contract this section proves against. This is also\nwhere `EncodedMessage` bytes are introduced — built-in providers (P3, P5)\nnever carry them."
  }
}
```

## Entry f-169: link-169

```json
{
  "id": "link-169",
  "path": "docs/platform/host-invocation-routing/intent-preservation-ledger.md",
  "inputLine": 75,
  "inputColumn": 123,
  "lineBeforeLinkPass": 83,
  "before": "[host-invocation-provider-routing.md](../../architect/host-invocation-routing/host-invocation-provider-routing.md#10-release-boundaries)",
  "after": "[host-invocation-provider-routing.md](spec.md#10-release-boundaries)",
  "legacyPath": "docs/architect/host-invocation-routing/host-invocation-provider-routing.md",
  "target": {
    "path": "docs/platform/host-invocation-routing/spec.md",
    "anchor": "10-release-boundaries",
    "aliasId": "host-invocation-draft-049"
  },
  "portal": false,
  "area": "host-invocation-routing",
  "reviewStatus": "pending",
  "oldDestination": "../../architect/host-invocation-routing/host-invocation-provider-routing.md#10-release-boundaries",
  "newDestination": "spec.md#10-release-boundaries",
  "alias": {
    "fromPath": "docs/architect/host-invocation-routing/host-invocation-provider-routing.md#10-release-boundaries",
    "toOwner": "docs/platform/host-invocation-routing/spec.md",
    "toAnchor": "10-release-boundaries",
    "kind": "redirected",
    "evidenceRef": "plans/260925-documentation-authority-unification/reports/phase-06/review-3-checkpoint-host-invocation.md",
    "immutableRefs": [],
    "recordedAt": "2026-10-13",
    "aliasId": "host-invocation-draft-049"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 2,
    "title": "10. Release Boundaries",
    "anchor": "10-release-boundaries",
    "githubAnchor": "10-release-boundaries",
    "stableAnchor": "h-8507d4ace985",
    "startLine": 224,
    "endLine": 224,
    "textDigest": "c48eca15b23e8496772b6fbb159bc890d0ded8c971463b51e0d4ce7d8bef1ad3",
    "sample": "10. Release Boundaries",
    "sectionPayloadDigest": "44d4c049f1ed952187401b3f858ac0fe2f6ed5ed780eb340856846c1df035994",
    "followingBlockDigest": "06049bca0768ee38177380fc223b8f0f517614d31d6f48803d16871c90ce9382",
    "identityFingerprint": "4e8d7a05586cc4fa50dc45e563514d6400ddc70be4add9be126c8a7c1c79d257",
    "ancestry": [
      "Host Invocation And Provider Routing Architecture"
    ],
    "text": "## 10. Release Boundaries",
    "sectionText": "## 10. Release Boundaries\n\n| Release | Required architecture slice | Explicitly not a gate |\n|---|---|---|\n| R1 — distributable Rust CLI host | Invocation kernel; `const` `OperationCatalog` / `RegistrySnapshot` assembled once at the composition root; two-stage authority; transitional CLI lane in the CLI adapter; native `distribution.build.show`; `fgctl`-driven install/activate/rollback proof. | External ecosystem discovery, WASM, chat, production gateway migration, a `setup` verb. |\n| R2 — external process preview | Process protocol, supervision, fixture conformance, static manifest validation; one-shot CLI loads the derived cache by fingerprint, rebuilds only on mismatch; explicit test/dev roots. | Core replacement, signatures/marketplace, WASM. |\n| R3 — production remote peer | Remote projector/presenter, native route adoption, per-operation Node semantic bridge only where needed; remote peer is the **project-local gateway** (current herdr, same release) composing the host-runtime crate in-process. | Parsing CLI envelopes as internal API; a future **shared multi-project gateway**, which never links a project runtime in-process and instead reaches it through the out-of-process Project Runtime Adapter ([Future Constraints](../packaging-distribution/future-constraints.md) §2) — itself a `remote-host-use-case` adapter inside the project runtime. |\n\nChat is a valid future peer but does not gate R1/R2 until a real chat adapter and its admission/interruption/presentation contracts exist. \"Ship the Rust host\" means a reproducible artifact, target matrix, `fgctl` install/activation coverage, external-project install test, and named rollback channel — passing repository tests alone is a candidate, not a shipped host."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 4,
    "title": "10. Release Boundaries",
    "anchor": "10-release-boundaries",
    "githubAnchor": "10-release-boundaries",
    "stableAnchor": "h-0083005219e1",
    "startLine": 309,
    "endLine": 309,
    "textDigest": "34d9daf13e1ea386e1b5b693f5c126739d63adb992af91721b898e792490361a",
    "sample": "10. Release Boundaries",
    "sectionPayloadDigest": "490a47eeb30fb2694a7220cdce9a14b7a4130ce3597920c5c923706d305c40d8",
    "followingBlockDigest": "967a235d033516997ebf0f52a71ae3875df102a5dd106af58e40486c80475b31",
    "identityFingerprint": "06e3f73c5e86d946459da5f827c28d9242c72199cc269685738960efdfeeda9f",
    "ancestry": [
      "Spec: Host Invocation",
      "Retained selected source material",
      "Host Invocation And Provider Routing Architecture"
    ],
    "text": "#### 10. Release Boundaries",
    "sectionText": "#### 10. Release Boundaries\n\n| Release | Required architecture slice | Explicitly not a gate |\n|---|---|---|\n| R1 — distributable Rust CLI host | Invocation kernel; `const` `OperationCatalog` / `RegistrySnapshot` assembled once at the composition root; two-stage authority; transitional CLI lane in the CLI adapter; native `distribution.build.show`; `fgctl`-driven install/activate/rollback proof. | External ecosystem discovery, WASM, chat, production gateway migration, a `setup` verb. |\n| R2 — external process preview | Process protocol, supervision, fixture conformance, static manifest validation; one-shot CLI loads the derived cache by fingerprint, rebuilds only on mismatch; explicit test/dev roots. | Core replacement, signatures/marketplace, WASM. |\n| R3 — production remote peer | Remote projector/presenter, native route adoption, per-operation Node semantic bridge only where needed; remote peer is the **project-local gateway** (current herdr, same release) composing the host-runtime crate in-process. | Parsing CLI envelopes as internal API; a future **shared multi-project gateway**, which never links a project runtime in-process and instead reaches it through the out-of-process Project Runtime Adapter ([Future Constraints](../packaging-distribution/architecture/future-constraints.md) §2) — itself a `remote-host-use-case` adapter inside the project runtime. |\n\nChat is a valid future peer but does not gate R1/R2 until a real chat adapter and its admission/interruption/presentation contracts exist. \"Ship the Rust host\" means a reproducible artifact, target matrix, `fgctl` install/activation coverage, external-project install test, and named rollback channel — passing repository tests alone is a candidate, not a shipped host."
  }
}
```

## Entry f-170: link-170

```json
{
  "id": "link-170",
  "path": "docs/platform/host-invocation-routing/intent-preservation-ledger.md",
  "inputLine": 75,
  "inputColumn": 261,
  "lineBeforeLinkPass": 83,
  "before": "[node-to-rust-component-migration.md](../../architect/host-invocation-routing/node-to-rust-component-migration.md#7-release-r3-production-remote-host)",
  "after": "[node-to-rust-component-migration.md](architecture/node-to-rust-migration.md#7-release-r3-production-remote-host)",
  "legacyPath": "docs/architect/host-invocation-routing/node-to-rust-component-migration.md",
  "target": {
    "path": "docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md",
    "anchor": "7-release-r3-production-remote-host",
    "aliasId": "host-invocation-draft-077"
  },
  "portal": false,
  "area": "host-invocation-routing",
  "reviewStatus": "pending",
  "oldDestination": "../../architect/host-invocation-routing/node-to-rust-component-migration.md#7-release-r3-production-remote-host",
  "newDestination": "architecture/node-to-rust-migration.md#7-release-r3-production-remote-host",
  "alias": {
    "fromPath": "docs/architect/host-invocation-routing/node-to-rust-component-migration.md#7-release-r3-production-remote-host",
    "toOwner": "docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md",
    "toAnchor": "7-release-r3-production-remote-host",
    "kind": "redirected",
    "evidenceRef": "plans/260925-documentation-authority-unification/reports/phase-06/review-3-checkpoint-host-invocation.md",
    "immutableRefs": [],
    "recordedAt": "2026-10-13",
    "aliasId": "host-invocation-draft-077"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 2,
    "title": "7. Release R3: Production Remote Host",
    "anchor": "7-release-r3-production-remote-host",
    "githubAnchor": "7-release-r3-production-remote-host",
    "stableAnchor": "h-0f1909ddb7e8",
    "startLine": 249,
    "endLine": 249,
    "textDigest": "5a78d1358fc89e9c80f1663df94a6a23576ecbfce74b0919165780ba30631c28",
    "sample": "7. Release R3: Production Remote Host",
    "sectionPayloadDigest": "94985a088e4f6e985cd137934986d45c887048385675ed20a7929b6f76f323de",
    "followingBlockDigest": "bbacd120b9de0eefd96aaa65455310c2edb40450eea9c106e3acad5aeda669c1",
    "identityFingerprint": "f59a1dcd08c1621ec7699e59b65aeff8fb70863cba092f8e0ebc2d72ad600120",
    "ancestry": [
      "Node To Rust Component Migration"
    ],
    "text": "## 7. Release R3: Production Remote Host",
    "sectionText": "## 7. Release R3: Production Remote Host\n\nAdopt the common invocation service route by route:\n\n1. inventory current gateway routes by semantic operation and side effect;\n2. replace `VerbGateway` for one native read with a remote projector and\n   presenter calling the shared invocation service;\n3. keep REST/MCP authentication and transport presentation in the gateway;\n4. for a route that must remain on Node, build a real per-operation Node\n   semantic bridge or leave that route on the old chokepoint during its named\n   rollback window;\n5. never parse `fgos.v1` or captured CLI stdout as the remote internal API;\n6. delete the CLI-shelling chokepoint after no route uses it.\n\nCaptured/supervised legacy CLI output is not a semantic provider outcome and\ncannot serve this stage. This stage gets a separate blast-radius review because\nthe current Herdr crate combines gateway, TUI, Axum, MCP, auth, and web concerns.\n\nThe production remote host in R3 is the project-local gateway (the current\nHerdr crate, released alongside the runtime) composing the host-runtime crate\nin-process. A future shared multi-project gateway is a different component: it\nreaches a selected project runtime only through the out-of-process Project\nRuntime Adapter\n([Future Constraints](../packaging-distribution/future-constraints.md) §2),\nnever by loading a project runtime in-process itself.\n\nChat becomes a peer host only when a real chat adapter and its own contracts\nexist. Host extensibility is preserved meanwhile; a speculative chat proof is\nnot a release gate."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 4,
    "title": "7. Release R3: Production Remote Host",
    "anchor": "7-release-r3-production-remote-host",
    "githubAnchor": "7-release-r3-production-remote-host",
    "stableAnchor": "h-1fb2da0ad773",
    "startLine": 287,
    "endLine": 287,
    "textDigest": "3af677c73a0ae4c0cea9baf8630281a1b4cb3752f62091e95441b41508677a74",
    "sample": "7. Release R3: Production Remote Host",
    "sectionPayloadDigest": "5edc8a96f9f8997d3c97ae5ca771d22ff557adb3656280f5e500ef874df6c32d",
    "followingBlockDigest": "bbacd120b9de0eefd96aaa65455310c2edb40450eea9c106e3acad5aeda669c1",
    "identityFingerprint": "100c43be4e9c2820f8c2c07052e73bc639f29058011c89f45b7e04fced270d06",
    "ancestry": [
      "Architecture: Node To Rust Migration",
      "Retained selected source material",
      "Node To Rust Component Migration"
    ],
    "text": "#### 7. Release R3: Production Remote Host",
    "sectionText": "#### 7. Release R3: Production Remote Host\n\nAdopt the common invocation service route by route:\n\n1. inventory current gateway routes by semantic operation and side effect;\n2. replace `VerbGateway` for one native read with a remote projector and\n   presenter calling the shared invocation service;\n3. keep REST/MCP authentication and transport presentation in the gateway;\n4. for a route that must remain on Node, build a real per-operation Node\n   semantic bridge or leave that route on the old chokepoint during its named\n   rollback window;\n5. never parse `fgos.v1` or captured CLI stdout as the remote internal API;\n6. delete the CLI-shelling chokepoint after no route uses it.\n\nCaptured/supervised legacy CLI output is not a semantic provider outcome and\ncannot serve this stage. This stage gets a separate blast-radius review because\nthe current Herdr crate combines gateway, TUI, Axum, MCP, auth, and web concerns.\n\nThe production remote host in R3 is the project-local gateway (the current\nHerdr crate, released alongside the runtime) composing the host-runtime crate\nin-process. A future shared multi-project gateway is a different component: it\nreaches a selected project runtime only through the out-of-process Project\nRuntime Adapter\n([Future Constraints](../../packaging-distribution/architecture/future-constraints.md) §2),\nnever by loading a project runtime in-process itself.\n\nChat becomes a peer host only when a real chat adapter and its own contracts\nexist. Host extensibility is preserved meanwhile; a speculative chat proof is\nnot a release gate."
  }
}
```

## Entry f-171: link-171

```json
{
  "id": "link-171",
  "path": "docs/platform/host-invocation-routing/intent-preservation-ledger.md",
  "inputLine": 76,
  "inputColumn": 75,
  "lineBeforeLinkPass": 84,
  "before": "[external-provider-protocol.md](../../architect/host-invocation-routing/external-provider-protocol.md#1-component-classes)",
  "after": "[external-provider-protocol.md](architecture/external-provider-protocol.md#1-component-classes)",
  "legacyPath": "docs/architect/host-invocation-routing/external-provider-protocol.md",
  "target": {
    "path": "docs/platform/host-invocation-routing/architecture/external-provider-protocol.md",
    "anchor": "1-component-classes",
    "aliasId": "host-invocation-draft-029"
  },
  "portal": false,
  "area": "host-invocation-routing",
  "reviewStatus": "pending",
  "oldDestination": "../../architect/host-invocation-routing/external-provider-protocol.md#1-component-classes",
  "newDestination": "architecture/external-provider-protocol.md#1-component-classes",
  "alias": {
    "fromPath": "docs/architect/host-invocation-routing/external-provider-protocol.md#1-component-classes",
    "toOwner": "docs/platform/host-invocation-routing/architecture/external-provider-protocol.md",
    "toAnchor": "1-component-classes",
    "kind": "split",
    "evidenceRef": "plans/260925-documentation-authority-unification/reports/phase-06/review-3-rework-source.md",
    "immutableRefs": [],
    "recordedAt": "2026-10-13",
    "aliasId": "host-invocation-draft-029"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 2,
    "title": "1. Component Classes",
    "anchor": "1-component-classes",
    "githubAnchor": "1-component-classes",
    "stableAnchor": "h-92b1177d769e",
    "startLine": 19,
    "endLine": 19,
    "textDigest": "a180ac1d80159115a4f336ae648d311a92f7b2a09de392544c38273cf1ffa34f",
    "sample": "1. Component Classes",
    "sectionPayloadDigest": "8adadf227979ecf0a54d96cab2259780060c0fa23948ad666b793ab01a624598",
    "followingBlockDigest": "8feb0186702101ea68fd7ddb663ad2b16f0d35b809cfb9759cca4702a7453499",
    "identityFingerprint": "9edfeae9f410e74e0390e98144b4a500d9be0d0e821db1b273d647ec20bdfc60",
    "ancestry": [
      "External Provider Protocol"
    ],
    "text": "## 1. Component Classes",
    "sectionText": "## 1. Component Classes\n\nInvocation mechanism describes how an implementation is invoked. It does not describe the product nature, release ownership, or authority posture of the component being invoked — that is a separate axis, **component class**:\n\n```txt\ncomponent class    -> who owns/releases/configures the component\ninvocation mechanism -> how the selected provider is invoked at runtime\n```\n\nA `ProviderDescriptor` therefore declares both: component class (core, packaged extension, or user plugin) and invocation mechanism (built-in, legacy node, external process, or external WASM).\n\n**Core component** — required for a useful fgOS release; owned by fgOS, released atomically with the host, normally statically linked once migrated. Not optional and not replaceable by default; may expose extension points, but a plugin implementing one does not become the authority owner of the core component. Examples: Work Lifecycle, Host Invocation, authority gating, provider routing, DispatchPlan selection, Assignment/Run/RunResult contracts, init/doctor health.\n\n**Packaged extension** — owned and shipped by fgOS but not required for a minimum useful release; may be enabled/disabled/omitted by configuration, edition, or environment. Follows fgOS release discipline, compatibility policy, init/doctor registration, docs, tests. More trustworthy than a user plugin because fgOS ships it, but disabling it must not corrupt core state or block boot. Examples: optional domain packages, optional coordination protocol packs, optional Herdr/dashboard surfaces.\n\n**User plugin** — supplied, installed, upgraded, removed outside the fgOS release train; never assumed present, never compiled into the host. Discovered from manifests, linked into the derived registry, granted only explicit capabilities. May add vendor-scoped operations or implement published extension points; owns no core namespace, authority, init/doctor invariant, or ambient access merely by manifest claim.\n\n| Component class | Common invocation mechanism | Notes |\n|---|---|---|\n| Core component | Built-in after migration; LegacyNode during transition | Required, fgOS-owned, atomically released. |\n| Packaged extension | Built-in, ExternalProcess, or ExternalWasm | fgOS-owned but optional; install/init/doctor aware. |\n| User plugin | ExternalProcess or ExternalWasm | User-owned, independently installed; manifest-linked and capability-gated. |\n\nThis classification blocks two mistakes: treating every statically linked implementation as architecturally core, and treating every out-of-process implementation as a user plugin. Packaging and authority follow component class; runtime calling details follow invocation mechanism."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 4,
    "title": "1. Component Classes",
    "anchor": "1-component-classes",
    "githubAnchor": "1-component-classes",
    "stableAnchor": "h-a0d4fc3e1720",
    "startLine": 79,
    "endLine": 79,
    "textDigest": "fd51d86a3880f7da70c7e5791d50dfb1af4cd414023a70d924a3606a319e252f",
    "sample": "1. Component Classes",
    "sectionPayloadDigest": "673a29b5ec914514271f5b49a4bcaa4a501242b6360ba75ce40c62f92ba8c574",
    "followingBlockDigest": "8feb0186702101ea68fd7ddb663ad2b16f0d35b809cfb9759cca4702a7453499",
    "identityFingerprint": "d9df4cb372fde103375a8e65a9faba3a5e73b267e88b9c4b0f42d28479e9d6f8",
    "ancestry": [
      "Architecture: External Provider Protocol",
      "Retained selected source material",
      "External Provider Protocol"
    ],
    "text": "#### 1. Component Classes",
    "sectionText": "#### 1. Component Classes\n\nInvocation mechanism describes how an implementation is invoked. It does not describe the product nature, release ownership, or authority posture of the component being invoked — that is a separate axis, **component class**:\n\n```txt\ncomponent class    -> who owns/releases/configures the component\ninvocation mechanism -> how the selected provider is invoked at runtime\n```\n\nA `ProviderDescriptor` therefore declares both: component class (core, packaged extension, or user plugin) and invocation mechanism (built-in, legacy node, external process, or external WASM).\n\n\nAdded in candidate: this retained source detail is carried verbatim in [the dropped-005 restoration](release-boundaries.md#restored-class-definitions).\n\n\n\n**User plugin** — supplied, installed, upgraded, removed outside the fgOS release train; never assumed present, never compiled into the host. Discovered from manifests, linked into the derived registry, granted only explicit capabilities. May add vendor-scoped operations or implement published extension points; owns no core namespace, authority, init/doctor invariant, or ambient access merely by manifest claim."
  }
}
```

## Entry f-172: link-172

```json
{
  "id": "link-172",
  "path": "docs/platform/host-invocation-routing/intent-preservation-ledger.md",
  "inputLine": 77,
  "inputColumn": 134,
  "lineBeforeLinkPass": 85,
  "before": "[external-provider-protocol.md](../../architect/host-invocation-routing/external-provider-protocol.md#3-component-protocol)",
  "after": "[external-provider-protocol.md](architecture/external-provider-protocol.md#3-component-protocol)",
  "legacyPath": "docs/architect/host-invocation-routing/external-provider-protocol.md",
  "target": {
    "path": "docs/platform/host-invocation-routing/architecture/external-provider-protocol.md",
    "anchor": "3-component-protocol",
    "aliasId": "host-invocation-draft-033"
  },
  "portal": false,
  "area": "host-invocation-routing",
  "reviewStatus": "pending",
  "oldDestination": "../../architect/host-invocation-routing/external-provider-protocol.md#3-component-protocol",
  "newDestination": "architecture/external-provider-protocol.md#3-component-protocol",
  "alias": {
    "fromPath": "docs/architect/host-invocation-routing/external-provider-protocol.md#3-component-protocol",
    "toOwner": "docs/platform/host-invocation-routing/architecture/external-provider-protocol.md",
    "toAnchor": "3-component-protocol",
    "kind": "split",
    "evidenceRef": "plans/260925-documentation-authority-unification/reports/phase-06/review-3-rework-source.md",
    "immutableRefs": [],
    "recordedAt": "2026-10-13",
    "aliasId": "host-invocation-draft-033"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 2,
    "title": "3. Component Protocol",
    "anchor": "3-component-protocol",
    "githubAnchor": "3-component-protocol",
    "stableAnchor": "h-3d2776445484",
    "startLine": 72,
    "endLine": 72,
    "textDigest": "4788de97424c5b1035cf2384d427ef5a7694dfbae3af9c94f73cf5dcf4420ea6",
    "sample": "3. Component Protocol",
    "sectionPayloadDigest": "e71acdcc9325f5470c9e8b393d1115b8e47c2bf44fd5397ead27703eb1193a99",
    "followingBlockDigest": "aa5e4116035d0b11d423c86594b2b314f62685ed66d610c53e45cd409a2f4999",
    "identityFingerprint": "53de331d0d46a89817008914533b3e4804ad4f3b82c21ef2d39df86cf130c572",
    "ancestry": [
      "External Provider Protocol"
    ],
    "text": "## 3. Component Protocol",
    "sectionText": "## 3. Component Protocol\n\nThe semantic component protocol is versioned independently from public host protocols — `fgos.component.v1`, distinct from CLI `fgos.v1` and any remote API version. It carries: operation identity and protocol/schema version range; request ID and optional parent/correlation ID; typed request, result, and error payloads; deadline, cancellation, progress, and events where supported; capability context granted by the host; provider identity and diagnostics needed for tracing.\n\nFor process plugins, version one uses JSON-RPC 2.0 semantics over 4-byte big-endian length-prefixed UTF-8 JSON frames on stdio. Newline-delimited JSON is not the contract: a length prefix gives one enforceable maximum-frame boundary and does not make embedded or future formatted content ambiguous. Stdout is protocol only; logs go to stderr or a declared log notification.\n\nThe host starts a process only after static manifest selection. Its first exchange confirms provider identity, accepted manifest digest, component protocol range, supported operation/contract pairs, and concurrency limit. Discovery never depends on this handshake; a mismatch terminates the provider and fails closed.\n\nOne connection obeys these lifecycle rules:\n\n- request IDs are unique per connection;\n- responses may complete out of order only when concurrency greater than one was negotiated;\n- requests, frames, and event queues are bounded to provide backpressure;\n- cancellation sends a protocol notification, waits a bounded grace period, then terminates the provider process if necessary;\n- cancellation acknowledgement does not claim semantic side effects were rolled back;\n- a crash after dispatch yields completion-unknown unless the operation's idempotency contract and key explicitly permit retry;\n- a one-shot CLI may own one process for its lifetime; a gateway may pool or persist connections under the adapter's health/restart policy.\n\nThe semantic contract stays transport-neutral: a future binary codec or local socket transport may replace framing without renaming the operation.\n\n`EncodedMessage` is the wire representation used only at this boundary — never inside the kernel:\n\n```rust\npub struct EncodedMessage {\n    pub contract_id: ContractId,\n    pub version: ContractVersion,\n    pub content_type: ContentType,\n    pub bytes: Bytes,\n}\n```"
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 4,
    "title": "3. Component Protocol",
    "anchor": "3-component-protocol",
    "githubAnchor": "3-component-protocol",
    "stableAnchor": "h-3dad5d9344c9",
    "startLine": 124,
    "endLine": 124,
    "textDigest": "7cf43dd0dccf83e356b760c88da2576ecb1eb4cf9219caaf09a95ff12d2fd5a8",
    "sample": "3. Component Protocol",
    "sectionPayloadDigest": "9229fc3e7df43971e02ec720977cd9190fbe3882ca9fccf689e332f62945383f",
    "followingBlockDigest": "aa5e4116035d0b11d423c86594b2b314f62685ed66d610c53e45cd409a2f4999",
    "identityFingerprint": "66a04939a685fc3010a2080c0cb9533bcd069a467d36909a42099855075ce9e0",
    "ancestry": [
      "Architecture: External Provider Protocol",
      "Retained selected source material",
      "External Provider Protocol"
    ],
    "text": "#### 3. Component Protocol",
    "sectionText": "#### 3. Component Protocol\n\nThe semantic component protocol is versioned independently from public host protocols — `fgos.component.v1`, distinct from CLI `fgos.v1` and any remote API version. It carries: operation identity and protocol/schema version range; request ID and optional parent/correlation ID; typed request, result, and error payloads; deadline, cancellation, progress, and events where supported; capability context granted by the host; provider identity and diagnostics needed for tracing.\n\nFor process plugins, version one uses JSON-RPC 2.0 semantics over 4-byte big-endian length-prefixed UTF-8 JSON frames on stdio. Newline-delimited JSON is not the contract: a length prefix gives one enforceable maximum-frame boundary and does not make embedded or future formatted content ambiguous. Stdout is protocol only; logs go to stderr or a declared log notification.\n\nThe host starts a process only after static manifest selection. Its first exchange confirms provider identity, accepted manifest digest, component protocol range, supported operation/contract pairs, and concurrency limit. Discovery never depends on this handshake; a mismatch terminates the provider and fails closed.\n\nOne connection obeys these lifecycle rules:\n\n- request IDs are unique per connection;\n- responses may complete out of order only when concurrency greater than one was negotiated;\n- requests, frames, and event queues are bounded to provide backpressure;\n- cancellation sends a protocol notification, waits a bounded grace period, then terminates the provider process if necessary;\n- cancellation acknowledgement does not claim semantic side effects were rolled back;\n- a crash after dispatch yields completion-unknown unless the operation's idempotency contract and key explicitly permit retry;\n- a one-shot CLI may own one process for its lifetime; a gateway may pool or persist connections under the adapter's health/restart policy.\n\n\nAdded in candidate: this retained source detail is carried verbatim in [the dropped-007 restoration](../contracts/component-protocol.md#restored-semantic-contract-stays-transport-neutral).\n\n\n`EncodedMessage` is the wire representation used only at this boundary — never inside the kernel:\n\n```rust\npub struct EncodedMessage {\n    pub contract_id: ContractId,\n    pub version: ContractVersion,\n    pub content_type: ContentType,\n    pub bytes: Bytes,\n}\n```"
  }
}
```

## Entry f-173: link-173

```json
{
  "id": "link-173",
  "path": "docs/platform/host-invocation-routing/intent-preservation-ledger.md",
  "inputLine": 78,
  "inputColumn": 124,
  "lineBeforeLinkPass": 86,
  "before": "[external-provider-protocol.md](../../architect/host-invocation-routing/external-provider-protocol.md#4-plugin-registry-linker)",
  "after": "[external-provider-protocol.md](architecture/external-provider-protocol.md#4-plugin-registry-linker)",
  "legacyPath": "docs/architect/host-invocation-routing/external-provider-protocol.md",
  "target": {
    "path": "docs/platform/host-invocation-routing/architecture/external-provider-protocol.md",
    "anchor": "4-plugin-registry-linker",
    "aliasId": "host-invocation-draft-034"
  },
  "portal": false,
  "area": "host-invocation-routing",
  "reviewStatus": "pending",
  "oldDestination": "../../architect/host-invocation-routing/external-provider-protocol.md#4-plugin-registry-linker",
  "newDestination": "architecture/external-provider-protocol.md#4-plugin-registry-linker",
  "alias": {
    "fromPath": "docs/architect/host-invocation-routing/external-provider-protocol.md#4-plugin-registry-linker",
    "toOwner": "docs/platform/host-invocation-routing/architecture/external-provider-protocol.md",
    "toAnchor": "4-plugin-registry-linker",
    "kind": "split",
    "evidenceRef": "plans/260925-documentation-authority-unification/reports/phase-06/review-3-rework-source.md",
    "immutableRefs": [],
    "recordedAt": "2026-10-13",
    "aliasId": "host-invocation-draft-034"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 2,
    "title": "4. Plugin Registry Linker",
    "anchor": "4-plugin-registry-linker",
    "githubAnchor": "4-plugin-registry-linker",
    "stableAnchor": "h-a2b565e6393b",
    "startLine": 103,
    "endLine": 103,
    "textDigest": "f26fe2980e00f599ee3395a67dd57972d0ef8371bf0219fde39bb7f44b353a4c",
    "sample": "4. Plugin Registry Linker",
    "sectionPayloadDigest": "06294fe91566f87f10d33546b570a4cbe4335fe0ad139d6165aa976a6d84d5f5",
    "followingBlockDigest": "db002cc2af859f74874068b3e2db12c43f8dfe07276a1d602e1169446d3e88a8",
    "identityFingerprint": "6812f2d8bc7a159b057e63ed8d7aa6c0d1ce836de739e58e4015751f5bedd0c4",
    "ancestry": [
      "External Provider Protocol"
    ],
    "text": "## 4. Plugin Registry Linker",
    "sectionText": "## 4. Plugin Registry Linker\n\nExternal discovery is data-first: the host scans a static manifest and never executes unknown provider code merely to discover what it claims.\n\nA `manifest.yaml` provider declaration declares at least: plugin ID, version, publisher, and component protocol range; provided `OperationId` values or named extension points; request/result schema references; invocation mechanism and executable/module location; requested host capabilities; platform compatibility and integrity metadata; health and post-selection `describe` operations.\n\n`manifest.yaml` is the one canonical filename for authored, static provider declarations. Its `kind` field distinguishes the declaration shape (`fgos.component`, `fgos.plugin`, `fgos.domain`, ...); every kind shares `manifestVersion`, `id`, `version`, `provides`, `requires`, `capabilities` before kind-specific fields are validated.\n\n**Registry** names only the host's derived runtime index (and its lock/cache), never another authored file. Discovery scans `manifest.yaml`, validates by `kind`, then links accepted claims into the provider registry.\n\nThe registry linker: scans configured global and project plugin locations; parses and validates manifests without running the provider; verifies compatibility, provider presence, and integrity policy; resolves IDs, namespace claims, precedence, and explicit replacements; emits a deterministic derived lock/cache for help, introspection, dispatch, init, and doctor; starts a selected provider and uses `describe` only to confirm it matches the accepted manifest.\n\nIts complete input/output physics:\n\n```txt\nauthored OperationCatalog\n+ built-in provider descriptors\n+ transitional CLI-compatibility bindings\n+ validated external manifest declarations\n+ explicit global/project enable-disable-replacement policy\n  -> immutable RegistrySnapshot + source fingerprint\n```\n\nAuthored catalogs, manifests, and policy are durable inputs; the linked registry lock/cache is rebuildable derived state — it records host version and source fingerprint, is replaced atomically, and is ignored/rebuilt when stale or corrupt. A cache never outranks its authored sources. This is a compiler only in the linking/validation sense; it does not compile plugin source or the `fgos` host binary.\n\nProject configuration overrides global configuration values, but duplicate operation claims do not silently use last-writer-wins — override precedence is not authority precedence. Ambiguity fails closed unless an explicit replacement policy names both the selected provider and the provider being replaced. Configuration can never replace a **built-in** provider (see the kernel contract's Authority section); a replacement policy only ever governs the external/plugin surface this linker discovers."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 4,
    "title": "4. Plugin Registry Linker",
    "anchor": "4-plugin-registry-linker",
    "githubAnchor": "4-plugin-registry-linker",
    "stableAnchor": "h-d847f1c4439f",
    "startLine": 157,
    "endLine": 157,
    "textDigest": "cda1c088745776953a5144a0548869d897c54e9f69dcd512de6ad8359b99ed32",
    "sample": "4. Plugin Registry Linker",
    "sectionPayloadDigest": "a208fa4696f2121b98ebf8f7320e53cf3d1820b288e3a466a8e1b65a88eb636d",
    "followingBlockDigest": "db002cc2af859f74874068b3e2db12c43f8dfe07276a1d602e1169446d3e88a8",
    "identityFingerprint": "e4237eb9a37385b91dd638586cc130db172170f5db48f402d26c015a0a883cee",
    "ancestry": [
      "Architecture: External Provider Protocol",
      "Retained selected source material",
      "External Provider Protocol"
    ],
    "text": "#### 4. Plugin Registry Linker",
    "sectionText": "#### 4. Plugin Registry Linker\n\nExternal discovery is data-first: the host scans a static manifest and never executes unknown provider code merely to discover what it claims.\n\nA `manifest.yaml` provider declaration declares at least: plugin ID, version, publisher, and component protocol range; provided `OperationId` values or named extension points; request/result schema references; invocation mechanism and executable/module location; requested host capabilities; platform compatibility and integrity metadata; health and post-selection `describe` operations.\n\n`manifest.yaml` is the one canonical filename for authored, static provider declarations. Its `kind` field distinguishes the declaration shape (`fgos.component`, `fgos.plugin`, `fgos.domain`, ...); every kind shares `manifestVersion`, `id`, `version`, `provides`, `requires`, `capabilities` before kind-specific fields are validated.\n\n**Registry** names only the host's derived runtime index (and its lock/cache), never another authored file. Discovery scans `manifest.yaml`, validates by `kind`, then links accepted claims into the provider registry.\n\n\nAdded in candidate: this retained source detail is carried verbatim in [the dropped-008 restoration](../verification/compatibility-harness.md#restored-registry-linker-procedure-and-its-input-output-formula).\n\n\n\n\nAuthored catalogs, manifests, and policy are durable inputs; the linked registry lock/cache is rebuildable derived state — it records host version and source fingerprint, is replaced atomically, and is ignored/rebuilt when stale or corrupt. A cache never outranks its authored sources. This is a compiler only in the linking/validation sense; it does not compile plugin source or the `fgos` host binary.\n\nProject configuration overrides global configuration values, but duplicate operation claims do not silently use last-writer-wins — override precedence is not authority precedence. Ambiguity fails closed unless an explicit replacement policy names both the selected provider and the provider being replaced. Configuration can never replace a **built-in** provider (see the kernel contract's Authority section); a replacement policy only ever governs the external/plugin surface this linker discovers."
  }
}
```

## Entry f-174: link-174

```json
{
  "id": "link-174",
  "path": "docs/platform/host-invocation-routing/intent-preservation-ledger.md",
  "inputLine": 79,
  "inputColumn": 127,
  "lineBeforeLinkPass": 87,
  "before": "[external-provider-protocol.md](../../architect/host-invocation-routing/external-provider-protocol.md#4-plugin-registry-linker)",
  "after": "[external-provider-protocol.md](architecture/external-provider-protocol.md#4-plugin-registry-linker)",
  "legacyPath": "docs/architect/host-invocation-routing/external-provider-protocol.md",
  "target": {
    "path": "docs/platform/host-invocation-routing/architecture/external-provider-protocol.md",
    "anchor": "4-plugin-registry-linker",
    "aliasId": "host-invocation-draft-034"
  },
  "portal": false,
  "area": "host-invocation-routing",
  "reviewStatus": "pending",
  "oldDestination": "../../architect/host-invocation-routing/external-provider-protocol.md#4-plugin-registry-linker",
  "newDestination": "architecture/external-provider-protocol.md#4-plugin-registry-linker",
  "alias": {
    "fromPath": "docs/architect/host-invocation-routing/external-provider-protocol.md#4-plugin-registry-linker",
    "toOwner": "docs/platform/host-invocation-routing/architecture/external-provider-protocol.md",
    "toAnchor": "4-plugin-registry-linker",
    "kind": "split",
    "evidenceRef": "plans/260925-documentation-authority-unification/reports/phase-06/review-3-rework-source.md",
    "immutableRefs": [],
    "recordedAt": "2026-10-13",
    "aliasId": "host-invocation-draft-034"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 2,
    "title": "4. Plugin Registry Linker",
    "anchor": "4-plugin-registry-linker",
    "githubAnchor": "4-plugin-registry-linker",
    "stableAnchor": "h-a2b565e6393b",
    "startLine": 103,
    "endLine": 103,
    "textDigest": "f26fe2980e00f599ee3395a67dd57972d0ef8371bf0219fde39bb7f44b353a4c",
    "sample": "4. Plugin Registry Linker",
    "sectionPayloadDigest": "06294fe91566f87f10d33546b570a4cbe4335fe0ad139d6165aa976a6d84d5f5",
    "followingBlockDigest": "db002cc2af859f74874068b3e2db12c43f8dfe07276a1d602e1169446d3e88a8",
    "identityFingerprint": "6812f2d8bc7a159b057e63ed8d7aa6c0d1ce836de739e58e4015751f5bedd0c4",
    "ancestry": [
      "External Provider Protocol"
    ],
    "text": "## 4. Plugin Registry Linker",
    "sectionText": "## 4. Plugin Registry Linker\n\nExternal discovery is data-first: the host scans a static manifest and never executes unknown provider code merely to discover what it claims.\n\nA `manifest.yaml` provider declaration declares at least: plugin ID, version, publisher, and component protocol range; provided `OperationId` values or named extension points; request/result schema references; invocation mechanism and executable/module location; requested host capabilities; platform compatibility and integrity metadata; health and post-selection `describe` operations.\n\n`manifest.yaml` is the one canonical filename for authored, static provider declarations. Its `kind` field distinguishes the declaration shape (`fgos.component`, `fgos.plugin`, `fgos.domain`, ...); every kind shares `manifestVersion`, `id`, `version`, `provides`, `requires`, `capabilities` before kind-specific fields are validated.\n\n**Registry** names only the host's derived runtime index (and its lock/cache), never another authored file. Discovery scans `manifest.yaml`, validates by `kind`, then links accepted claims into the provider registry.\n\nThe registry linker: scans configured global and project plugin locations; parses and validates manifests without running the provider; verifies compatibility, provider presence, and integrity policy; resolves IDs, namespace claims, precedence, and explicit replacements; emits a deterministic derived lock/cache for help, introspection, dispatch, init, and doctor; starts a selected provider and uses `describe` only to confirm it matches the accepted manifest.\n\nIts complete input/output physics:\n\n```txt\nauthored OperationCatalog\n+ built-in provider descriptors\n+ transitional CLI-compatibility bindings\n+ validated external manifest declarations\n+ explicit global/project enable-disable-replacement policy\n  -> immutable RegistrySnapshot + source fingerprint\n```\n\nAuthored catalogs, manifests, and policy are durable inputs; the linked registry lock/cache is rebuildable derived state — it records host version and source fingerprint, is replaced atomically, and is ignored/rebuilt when stale or corrupt. A cache never outranks its authored sources. This is a compiler only in the linking/validation sense; it does not compile plugin source or the `fgos` host binary.\n\nProject configuration overrides global configuration values, but duplicate operation claims do not silently use last-writer-wins — override precedence is not authority precedence. Ambiguity fails closed unless an explicit replacement policy names both the selected provider and the provider being replaced. Configuration can never replace a **built-in** provider (see the kernel contract's Authority section); a replacement policy only ever governs the external/plugin surface this linker discovers."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 4,
    "title": "4. Plugin Registry Linker",
    "anchor": "4-plugin-registry-linker",
    "githubAnchor": "4-plugin-registry-linker",
    "stableAnchor": "h-d847f1c4439f",
    "startLine": 157,
    "endLine": 157,
    "textDigest": "cda1c088745776953a5144a0548869d897c54e9f69dcd512de6ad8359b99ed32",
    "sample": "4. Plugin Registry Linker",
    "sectionPayloadDigest": "a208fa4696f2121b98ebf8f7320e53cf3d1820b288e3a466a8e1b65a88eb636d",
    "followingBlockDigest": "db002cc2af859f74874068b3e2db12c43f8dfe07276a1d602e1169446d3e88a8",
    "identityFingerprint": "e4237eb9a37385b91dd638586cc130db172170f5db48f402d26c015a0a883cee",
    "ancestry": [
      "Architecture: External Provider Protocol",
      "Retained selected source material",
      "External Provider Protocol"
    ],
    "text": "#### 4. Plugin Registry Linker",
    "sectionText": "#### 4. Plugin Registry Linker\n\nExternal discovery is data-first: the host scans a static manifest and never executes unknown provider code merely to discover what it claims.\n\nA `manifest.yaml` provider declaration declares at least: plugin ID, version, publisher, and component protocol range; provided `OperationId` values or named extension points; request/result schema references; invocation mechanism and executable/module location; requested host capabilities; platform compatibility and integrity metadata; health and post-selection `describe` operations.\n\n`manifest.yaml` is the one canonical filename for authored, static provider declarations. Its `kind` field distinguishes the declaration shape (`fgos.component`, `fgos.plugin`, `fgos.domain`, ...); every kind shares `manifestVersion`, `id`, `version`, `provides`, `requires`, `capabilities` before kind-specific fields are validated.\n\n**Registry** names only the host's derived runtime index (and its lock/cache), never another authored file. Discovery scans `manifest.yaml`, validates by `kind`, then links accepted claims into the provider registry.\n\n\nAdded in candidate: this retained source detail is carried verbatim in [the dropped-008 restoration](../verification/compatibility-harness.md#restored-registry-linker-procedure-and-its-input-output-formula).\n\n\n\n\nAuthored catalogs, manifests, and policy are durable inputs; the linked registry lock/cache is rebuildable derived state — it records host version and source fingerprint, is replaced atomically, and is ignored/rebuilt when stale or corrupt. A cache never outranks its authored sources. This is a compiler only in the linking/validation sense; it does not compile plugin source or the `fgos` host binary.\n\nProject configuration overrides global configuration values, but duplicate operation claims do not silently use last-writer-wins — override precedence is not authority precedence. Ambiguity fails closed unless an explicit replacement policy names both the selected provider and the provider being replaced. Configuration can never replace a **built-in** provider (see the kernel contract's Authority section); a replacement policy only ever governs the external/plugin surface this linker discovers."
  }
}
```

## Entry f-175: link-175

```json
{
  "id": "link-175",
  "path": "docs/platform/host-invocation-routing/intent-preservation-ledger.md",
  "inputLine": 80,
  "inputColumn": 145,
  "lineBeforeLinkPass": 88,
  "before": "[external-provider-protocol.md](../../architect/host-invocation-routing/external-provider-protocol.md#5-namespace-rules)",
  "after": "[external-provider-protocol.md](architecture/external-provider-protocol.md#5-namespace-rules)",
  "legacyPath": "docs/architect/host-invocation-routing/external-provider-protocol.md",
  "target": {
    "path": "docs/platform/host-invocation-routing/architecture/external-provider-protocol.md",
    "anchor": "5-namespace-rules",
    "aliasId": "host-invocation-draft-035"
  },
  "portal": false,
  "area": "host-invocation-routing",
  "reviewStatus": "pending",
  "oldDestination": "../../architect/host-invocation-routing/external-provider-protocol.md#5-namespace-rules",
  "newDestination": "architecture/external-provider-protocol.md#5-namespace-rules",
  "alias": {
    "fromPath": "docs/architect/host-invocation-routing/external-provider-protocol.md#5-namespace-rules",
    "toOwner": "docs/platform/host-invocation-routing/architecture/external-provider-protocol.md",
    "toAnchor": "5-namespace-rules",
    "kind": "redirected",
    "evidenceRef": "plans/260925-documentation-authority-unification/reports/phase-06/review-3-checkpoint-host-invocation.md",
    "immutableRefs": [],
    "recordedAt": "2026-10-13",
    "aliasId": "host-invocation-draft-035"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 2,
    "title": "5. Namespace Rules",
    "anchor": "5-namespace-rules",
    "githubAnchor": "5-namespace-rules",
    "stableAnchor": "h-002715bb14ac",
    "startLine": 130,
    "endLine": 130,
    "textDigest": "7d972ac75372926db5e2916b8d733e5500bfb4a38d96dcc3feec0ae3e64bc9b0",
    "sample": "5. Namespace Rules",
    "sectionPayloadDigest": "001e773b95334e7e189ef5b08832f7313597267ea7f9dafbc72f66238cdf7b12",
    "followingBlockDigest": "001e773b95334e7e189ef5b08832f7313597267ea7f9dafbc72f66238cdf7b12",
    "identityFingerprint": "38b16fb8760299508e395e40a1077c4ae2607640bb4faf483ed36cbaeaa78c69",
    "ancestry": [
      "External Provider Protocol"
    ],
    "text": "## 5. Namespace Rules",
    "sectionText": "## 5. Namespace Rules\n\nThe safe ecosystem default: core operation and command namespaces are reserved; plugins add vendor-scoped operations, e.g. `acme.deploy.release`; plugins may implement extension points explicitly published by a built-in component; `.fgos` writes, Git mutation, process execution, network, secrets, and host callbacks require explicit capability grants; unknown capability requests and ambiguous claims fail closed. The provider manifest is never an authority source — caller admission and selected-provider grant (kernel contract §7) apply identically here."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 4,
    "title": "5. Namespace Rules",
    "anchor": "5-namespace-rules",
    "githubAnchor": "5-namespace-rules",
    "stableAnchor": "h-7d76fa7dbfac",
    "startLine": 177,
    "endLine": 177,
    "textDigest": "763a41cf732027644c6ca6b857805d54dc8f24c0ec838703193131b580325417",
    "sample": "5. Namespace Rules",
    "sectionPayloadDigest": "001e773b95334e7e189ef5b08832f7313597267ea7f9dafbc72f66238cdf7b12",
    "followingBlockDigest": "001e773b95334e7e189ef5b08832f7313597267ea7f9dafbc72f66238cdf7b12",
    "identityFingerprint": "3eaee3c76e38c6e48df5e5ccaf365b8b0d682d3344da86dd6fb6c2273cc55752",
    "ancestry": [
      "Architecture: External Provider Protocol",
      "Retained selected source material",
      "External Provider Protocol"
    ],
    "text": "#### 5. Namespace Rules",
    "sectionText": "#### 5. Namespace Rules\n\nThe safe ecosystem default: core operation and command namespaces are reserved; plugins add vendor-scoped operations, e.g. `acme.deploy.release`; plugins may implement extension points explicitly published by a built-in component; `.fgos` writes, Git mutation, process execution, network, secrets, and host callbacks require explicit capability grants; unknown capability requests and ambiguous claims fail closed. The provider manifest is never an authority source — caller admission and selected-provider grant (kernel contract §7) apply identically here."
  }
}
```

## Entry f-176: link-176

```json
{
  "id": "link-176",
  "path": "docs/platform/host-invocation-routing/intent-preservation-ledger.md",
  "inputLine": 81,
  "inputColumn": 123,
  "lineBeforeLinkPass": 89,
  "before": "[legacy-cli-transition.md](../../architect/host-invocation-routing/legacy-cli-transition.md#1-two-distinct-adapters)",
  "after": "[legacy-cli-transition.md](architecture/legacy-cli-transition.md#1-two-distinct-adapters)",
  "legacyPath": "docs/architect/host-invocation-routing/legacy-cli-transition.md",
  "target": {
    "path": "docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md",
    "anchor": "1-two-distinct-adapters",
    "aliasId": "host-invocation-draft-055"
  },
  "portal": false,
  "area": "host-invocation-routing",
  "reviewStatus": "pending",
  "oldDestination": "../../architect/host-invocation-routing/legacy-cli-transition.md#1-two-distinct-adapters",
  "newDestination": "architecture/legacy-cli-transition.md#1-two-distinct-adapters",
  "alias": {
    "fromPath": "docs/architect/host-invocation-routing/legacy-cli-transition.md#1-two-distinct-adapters",
    "toOwner": "docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md",
    "toAnchor": "1-two-distinct-adapters",
    "kind": "split",
    "evidenceRef": "plans/260925-documentation-authority-unification/reports/phase-06/review-3-rework-source.md",
    "immutableRefs": [],
    "recordedAt": "2026-10-13",
    "aliasId": "host-invocation-draft-055"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 2,
    "title": "1. Two Distinct Adapters",
    "anchor": "1-two-distinct-adapters",
    "githubAnchor": "1-two-distinct-adapters",
    "stableAnchor": "h-3b77f5ee1116",
    "startLine": 20,
    "endLine": 20,
    "textDigest": "fee7e29c8f6886025098180b705008f43d5a3198943485c0256f5645b9cdc0fd",
    "sample": "1. Two Distinct Adapters",
    "sectionPayloadDigest": "7a781dca80d86a7816255fbc133dc57bf26194a856d63d70a7856972c45a1185",
    "followingBlockDigest": "070eef9281dcde7aac4cd065ac319c4eb601c82df284dce49286419ad23ec684",
    "identityFingerprint": "6ceb8083a826909eee8f7e9f476596b25f66f436bd9af2d3d1ebb0f01ccd973b",
    "ancestry": [
      "Legacy CLI Transition"
    ],
    "text": "## 1. Two Distinct Adapters",
    "sectionText": "## 1. Two Distinct Adapters\n\nNode transition needs two adapters with different contracts. Treating them as one provider would create the false impression that captured CLI output is a semantic result.\n\n**`LegacyCliPassthroughProvider`** — CLI-only. Receives preserved `OsString` argv, inherited stdin, cwd/environment, and signal context; returns pre-rendered stdout/stderr bytes plus process exit/signal termination. It never returns `ProviderOutcome` and is never reachable from remote or chat hosts. This is the only adapter most legacy commands need: the CLI adapter looks up `CommandRouteDescriptor[selector]`, and for `route_kind == legacy-cli` execs the Node payload directly (argv preserved, signal forwarding) and writes one invocation record through the shared recorder — without ever building an `OperationRequest` or calling `InvocationService`/Router.\n\n**`LegacySemanticProvider`** — receives and returns real versioned semantic contracts (`OperationRequest`/`ProviderOutcome`). Its Node bridge calls an extracted Node use case directly, never `bin/fgos.mjs` and never an envelope parser. It can serve any admitted host and is introduced per operation only when a non-CLI host needs Node behavior before the native provider exists. Unlike the passthrough, this adapter *is* a normal `OperationProvider` participant in the kernel pipeline (admit -> select -> grant -> invoke -> normalize -> record) — it is \"legacy\" only in that its implementation still calls into Node.\n\nCapturing stdout/stderr in a supervised child improves CLI cancellation and tracing but remains passthrough presentation; it never becomes the bridge used by a remote host.\n\nBoth adapters delegate a complete use case. A host must not split one state transaction between native and legacy providers unless a component contract already defines locking, atomicity, recovery, and authority at that boundary.\n\nThe adapters resolve the legacy payload relative to the installed host, never from the caller's cwd, and invoke the Node entry/bridge directly rather than spawning `fgos` recursively. The CLI parent forwards termination consistently; Unix signal equivalence and Windows process-tree behavior are explicit target-specific compatibility tests, not an undocumented `exit.code()` guess."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 4,
    "title": "1. Two Distinct Adapters",
    "anchor": "1-two-distinct-adapters",
    "githubAnchor": "1-two-distinct-adapters",
    "stableAnchor": "h-25d9e376a2ff",
    "startLine": 80,
    "endLine": 80,
    "textDigest": "49afb148ce5b49502adacce9e063c07b40e58fb0981db00e6b2d9048a726d90d",
    "sample": "1. Two Distinct Adapters",
    "sectionPayloadDigest": "58a6459f9e8bf0faa05025f675179c86a73fcd6fb2fe89d8d61152829e9b941a",
    "followingBlockDigest": "070eef9281dcde7aac4cd065ac319c4eb601c82df284dce49286419ad23ec684",
    "identityFingerprint": "7b7f0308b090718c036390dcdbe7306f91e83ec1c294866ae1eb69fb26e8c233",
    "ancestry": [
      "Architecture: Legacy CLI Transition",
      "Retained selected source material",
      "Legacy CLI Transition"
    ],
    "text": "#### 1. Two Distinct Adapters",
    "sectionText": "#### 1. Two Distinct Adapters\n\nNode transition needs two adapters with different contracts. Treating them as one provider would create the false impression that captured CLI output is a semantic result.\n\n**`LegacyCliPassthroughProvider`** — CLI-only. Receives preserved `OsString` argv, inherited stdin, cwd/environment, and signal context; returns pre-rendered stdout/stderr bytes plus process exit/signal termination. It never returns `ProviderOutcome` and is never reachable from remote or chat hosts. This is the only adapter most legacy commands need: the CLI adapter looks up `CommandRouteDescriptor[selector]`, and for `route_kind == legacy-cli` execs the Node payload directly (argv preserved, signal forwarding) and writes one invocation record through the shared recorder — without ever building an `OperationRequest` or calling `InvocationService`/Router.\n\n**`LegacySemanticProvider`** — receives and returns real versioned semantic contracts (`OperationRequest`/`ProviderOutcome`). Its Node bridge calls an extracted Node use case directly, never `bin/fgos.mjs` and never an envelope parser. It can serve any admitted host and is introduced per operation only when a non-CLI host needs Node behavior before the native provider exists. Unlike the passthrough, this adapter *is* a normal `OperationProvider` participant in the kernel pipeline (admit -> select -> grant -> invoke -> normalize -> record) — it is \"legacy\" only in that its implementation still calls into Node.\n\nCapturing stdout/stderr in a supervised child improves CLI cancellation and tracing but remains passthrough presentation; it never becomes the bridge used by a remote host.\n\n\nAdded in candidate: this retained source detail is carried verbatim in [the dropped-009 restoration](../contracts/component-protocol.md#restored-both-adapters-delegate-a-complete-use-case).\n\n\nThe adapters resolve the legacy payload relative to the installed host, never from the caller's cwd, and invoke the Node entry/bridge directly rather than spawning `fgos` recursively. The CLI parent forwards termination consistently; Unix signal equivalence and Windows process-tree behavior are explicit target-specific compatibility tests, not an undocumented `exit.code()` guess."
  }
}
```

## Entry f-177: link-177

```json
{
  "id": "link-177",
  "path": "docs/platform/host-invocation-routing/intent-preservation-ledger.md",
  "inputLine": 82,
  "inputColumn": 111,
  "lineBeforeLinkPass": 90,
  "before": "[legacy-cli-transition.md](../../architect/host-invocation-routing/legacy-cli-transition.md#2-legacy-payload-identity-ownership-and-repair-path)",
  "after": "[legacy-cli-transition.md](architecture/legacy-cli-transition.md#2-legacy-payload-identity-ownership-and-repair-path)",
  "legacyPath": "docs/architect/host-invocation-routing/legacy-cli-transition.md",
  "target": {
    "path": "docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md",
    "anchor": "2-legacy-payload-identity-ownership-and-repair-path",
    "aliasId": "host-invocation-draft-056"
  },
  "portal": false,
  "area": "host-invocation-routing",
  "reviewStatus": "pending",
  "oldDestination": "../../architect/host-invocation-routing/legacy-cli-transition.md#2-legacy-payload-identity-ownership-and-repair-path",
  "newDestination": "architecture/legacy-cli-transition.md#2-legacy-payload-identity-ownership-and-repair-path",
  "alias": {
    "fromPath": "docs/architect/host-invocation-routing/legacy-cli-transition.md#2-legacy-payload-identity-ownership-and-repair-path",
    "toOwner": "docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md",
    "toAnchor": "2-legacy-payload-identity-ownership-and-repair-path",
    "kind": "split",
    "evidenceRef": "plans/260925-documentation-authority-unification/reports/phase-06/review-3-rework-source.md",
    "immutableRefs": [],
    "recordedAt": "2026-10-13",
    "aliasId": "host-invocation-draft-056"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 2,
    "title": "2. Legacy Payload Identity, Ownership, And Repair Path",
    "anchor": "2-legacy-payload-identity-ownership-and-repair-path",
    "githubAnchor": "2-legacy-payload-identity-ownership-and-repair-path",
    "stableAnchor": "h-161656a0cd5d",
    "startLine": 34,
    "endLine": 34,
    "textDigest": "e9f472117d68d8c826f9f9b15946883a24addeedf3c298765032fc081f37cb2d",
    "sample": "2. Legacy Payload Identity, Ownership, And Repair Path",
    "sectionPayloadDigest": "5501641da4f536faa95f668b83b823fbe275c8919184266fa6f4017cfe6b3f39",
    "followingBlockDigest": "3254fda9f7179fc52f68274cf803c9cfe550a6ea9f66d975cd3438100aaf804a",
    "identityFingerprint": "fb7cc258dc05206d132fc94bb086f94b7c0cd11df20059cbcbe90b86c5a65e59",
    "ancestry": [
      "Legacy CLI Transition"
    ],
    "text": "## 2. Legacy Payload Identity, Ownership, And Repair Path",
    "sectionText": "## 2. Legacy Payload Identity, Ownership, And Repair Path\n\nThree things are separated that the name `bin/fgos.mjs` currently conflates:\n\n| | Today | After R1 |\n|---|---|---|\n| Public name people type | `fgos` → Node | `fgos` → Rust host (workspace shim / PATH) |\n| Payload identity the Rust host execs | none | `legacy-node` — the release manifest's `components.legacyNode` and the `legacy_payload` field of every `legacy-cli` `CommandRouteDescriptor` |\n| File location | `bin/fgos.mjs` at the repo root | unchanged |\n\n**The Node program is not relocated and not renamed in the source tree** (decided 2026-09-10). `bin/fgos.mjs` computes its package root from its own file location and imports `../src/...` relatively, so moving the entry alone breaks it, and moving the whole Node package would decide the Node-side repo layout that [Repo Layout Vision](../component-boundary/repo-layout-vision.md) §7 deliberately defers (and would mislabel `src/state`, `src/runner` — which `fgos-runner` keeps using — as \"legacy\"). The payload is therefore the current npm package exactly as `package.json` `files` defines it, staged whole by the release builder under the manifest's `components.legacyNode.root` (`libexec/legacy-node/` in a staged release) with the same relative layout as the source tree — zero import changes, `bin/fgos.mjs` and `bin/fgos-runner.mjs` both inside it. The identity is renamed (`legacy-node`), the file is not; a filesystem rename happens only when the payload is deleted.\n\nThe public `fgos` executable is the platform Rust host. It resolves the legacy payload as `join(activeReleasePath, components.legacyNode.root, components.legacyNode.entry)` read from the activation binding's manifest — never from `PATH`, never from the caller's cwd, never as an alternate package-manager `bin` entry, and never hardcoded. A `dev:<rev>` source activation declares `root: \".\"`, `entry: \"bin/fgos.mjs\"`, `entries.fgos: \"target/release/fgos\"`; a staged release declares `root: \"libexec/legacy-node\"`, `entries.fgos: \"bin/fgos\"`. One mechanism serves dogfood and production ([Runtime Identity And Activation](../packaging-distribution/runtime-identity-and-activation.md) §5).\n\n`package.json` `bin.fgos` is removed (or pointed at the workspace shim) when the Rust host becomes the installed default; `bin.fgos-runner` stays until the runner migrates. A header in `bin/fgos.mjs` and the root `AGENTS.md` state the ownership rule for editors already at that path.\n\n**Callers of the old path.** A grep for `bin/fgos.mjs` finds ~150 hits; only ~9 are real call sites, all of them variants of \"where is `fgos`?\": the shell function's tier-1 (`scripts/fgos-shell-integration.sh`), Herdr's three `Command::new(\"node\")` sites (`fgos.rs`, `gateway.rs`, `main.rs`), the dispatch CLI path (`src/runner/dispatch/cli.mjs`), the iron-law footprint matcher (`src/evolve/iron-law.mjs`), the doctor reachability check (`src/setup/registrations.mjs`), the plugin-skill fallback (`core/skills/_shared/fgos-cli-fallback.md` — the single source the ~20 `.agents`/`plugins` copies render from), and `package.json` `bin`. The fix is not a substitution: add one **tier 0 = workspace shim `.fgos/installation/bin/fgos`** to the single resolver each runtime already has (`src/setup/bin-discovery.mjs` for Node, the shell function for shells, one `resolve_fgos` for Herdr) and make the nine sites use it, with the old `node bin/fgos.mjs` path kept only as the fallback for a project that has not run `fgctl init`. The ~75 Node tests that spawn `bin/fgos.mjs` directly stay as they are — they test the Node payload's behavior with the Node payload. Comments are not callers.\n\nEvery selector has exactly one generated `CommandRouteDescriptor`, derived from the Node command registry plus checked migration annotations. Its minimum fields:\n\n```txt\nselector               # canonical command/subcommand selector\nroute_kind             # legacy-cli | native\noperation_id           # required only for native semantic routing\nlegacy_payload         # required only for legacy-cli; named payload identity\nowner_path             # canonical implementation boundary to edit\ncompatibility_tests    # named parity/vector suites required for a repair\n```\n\n`legacy-cli` means the Node payload owns argument parsing and behavior; the Rust host must only recognize the checked selector and preserve the remaining `OsString` argv. `native` means the typed provider owns the operation and the legacy implementation is retained only as an explicitly bounded rollback oracle. A descriptor may not name both paths as active, and an unlisted selector fails the build rather than choosing a fallback.\n\nThe descriptor is both the routing input and the contributor repair map. A repository-local `scripts/explain-command-route.mjs <selector>` reads the same checked artifact and prints route kind, owner path, payload identity, and required compatibility suites. CI rejects a descriptor whose owner or required proof is missing, drift between the Node registry and descriptor, a direct production spawn of the private payload outside `LegacyCliPassthroughProvider` (test fixtures excepted), or a legacy payload removal before its compatibility binding is removed.\n\n**Rollback:** configuration can never replace a built-in provider (kernel contract §7), and there is no runtime provider-selection swap to roll back a native operation. Rollback of a native operation in R1–R2 is a **release rollback through `fgctl`** — the previous release still ships both the native provider and the Node payload during the observation window. There is no \"roll back by changing provider selection\" mechanism; none is promised anywhere in this stack."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 4,
    "title": "2. Legacy Payload Identity, Ownership, And Repair Path",
    "anchor": "2-legacy-payload-identity-ownership-and-repair-path",
    "githubAnchor": "2-legacy-payload-identity-ownership-and-repair-path",
    "stableAnchor": "h-3e28cdecf4b0",
    "startLine": 96,
    "endLine": 96,
    "textDigest": "262d60a7d2ac5ef767de9363fece691019731c14389d464a3095f9bfc7f9d302",
    "sample": "2. Legacy Payload Identity, Ownership, And Repair Path",
    "sectionPayloadDigest": "64db4a88b997dee57c72b0e56664b7a4ca4d1b6c5b44ff83aa8f024db7533166",
    "followingBlockDigest": "3254fda9f7179fc52f68274cf803c9cfe550a6ea9f66d975cd3438100aaf804a",
    "identityFingerprint": "bded858f5c446adfc156b09ac2a1a4863915ed027611a2807e297258290a0609",
    "ancestry": [
      "Architecture: Legacy CLI Transition",
      "Retained selected source material",
      "Legacy CLI Transition"
    ],
    "text": "#### 2. Legacy Payload Identity, Ownership, And Repair Path",
    "sectionText": "#### 2. Legacy Payload Identity, Ownership, And Repair Path\n\nThree things are separated that the name `bin/fgos.mjs` currently conflates:\n\n| | Today | After R1 |\n|---|---|---|\n| Public name people type | `fgos` → Node | `fgos` → Rust host (workspace shim / PATH) |\n| Payload identity the Rust host execs | none | `legacy-node` — the release manifest's `components.legacyNode` and the `legacy_payload` field of every `legacy-cli` `CommandRouteDescriptor` |\n| File location | `bin/fgos.mjs` at the repo root | unchanged |\n\n**The Node program is not relocated and not renamed in the source tree** (decided 2026-09-10). `bin/fgos.mjs` computes its package root from its own file location and imports `../src/...` relatively, so moving the entry alone breaks it, and moving the whole Node package would decide the Node-side repo layout that [Repo Layout Vision](../../component-boundary.md) §7 deliberately defers (and would mislabel `src/state`, `src/runner` — which `fgos-runner` keeps using — as \"legacy\"). The payload is therefore the current npm package exactly as `package.json` `files` defines it, staged whole by the release builder under the manifest's `components.legacyNode.root` (`libexec/legacy-node/` in a staged release) with the same relative layout as the source tree — zero import changes, `bin/fgos.mjs` and `bin/fgos-runner.mjs` both inside it. The identity is renamed (`legacy-node`), the file is not; a filesystem rename happens only when the payload is deleted.\n\nThe public `fgos` executable is the platform Rust host. It resolves the legacy payload as `join(activeReleasePath, components.legacyNode.root, components.legacyNode.entry)` read from the activation binding's manifest — never from `PATH`, never from the caller's cwd, never as an alternate package-manager `bin` entry, and never hardcoded. A `dev:<rev>` source activation declares `root: \".\"`, `entry: \"bin/fgos.mjs\"`, `entries.fgos: \"target/release/fgos\"`; a staged release declares `root: \"libexec/legacy-node\"`, `entries.fgos: \"bin/fgos\"`. One mechanism serves dogfood and production ([Runtime Identity And Activation](../../packaging-distribution/README.md) §5).\n\nAdded in candidate — checked resolver status (2026-10-13): the preceding activation-binding paragraph is retained selected design. `apps/fgos/src/legacy_exec.rs:69-154` selects the release root from explicit release/dev environment bindings or executable-relative manifest discovery, then verifies the manifest and confined entry. The target identity status in spec.md remains `accepted-not-implemented`; checked resolver behavior does not certify the entire target contract. The ownership rule remains never from PATH, never from caller cwd, never as an alternate package-manager bin entry, and never hardcoded.\n\nAdded in candidate: this retained source detail is carried verbatim in [the dropped-010 restoration](release-boundaries.md#restored-package-json-bin-fgos-removed-pointed-at-workspace-shim-at-default-flip-bin-fgos-runner-stays-ownership-hea).\n\n\n**Callers of the old path.** A grep for `bin/fgos.mjs` finds ~150 hits; only ~9 are real call sites, all of them variants of \"where is `fgos`?\": the shell function's tier-1 (`scripts/fgos-shell-integration.sh`), Herdr's three `Command::new(\"node\")` sites (`fgos.rs`, `gateway.rs`, `main.rs`), the dispatch CLI path (`src/runner/dispatch/cli.mjs`), the iron-law footprint matcher (`src/evolve/iron-law.mjs`), the doctor reachability check (`src/setup/registrations.mjs`), the plugin-skill fallback (`core/skills/_shared/fgos-cli-fallback.md` — the single source the ~20 `.agents`/`plugins` copies render from), and `package.json` `bin`. The fix is not a substitution: add one **tier 0 = workspace shim `.fgos/installation/bin/fgos`** to the single resolver each runtime already has (`src/setup/bin-discovery.mjs` for Node, the shell function for shells, one `resolve_fgos` for Herdr) and make the nine sites use it, with the old `node bin/fgos.mjs` path kept only as the fallback for a project that has not run `fgctl init`. The ~75 Node tests that spawn `bin/fgos.mjs` directly stay as they are — they test the Node payload's behavior with the Node payload. Comments are not callers.\n\nEvery selector has exactly one generated `CommandRouteDescriptor`, derived from the Node command registry plus checked migration annotations. Its minimum fields:\n\n```txt\nselector               # canonical command/subcommand selector\nroute_kind             # legacy-cli | native\noperation_id           # required only for native semantic routing\nlegacy_payload         # required only for legacy-cli; named payload identity\nowner_path             # canonical implementation boundary to edit\ncompatibility_tests    # named parity/vector suites required for a repair\n```\n\n`legacy-cli` means the Node payload owns argument parsing and behavior; the Rust host must only recognize the checked selector and preserve the remaining `OsString` argv. `native` means the typed provider owns the operation and the legacy implementation is retained only as an explicitly bounded rollback oracle. A descriptor may not name both paths as active, and an unlisted selector fails the build rather than choosing a fallback.\n\nThe descriptor is both the routing input and the contributor repair map. A repository-local `scripts/explain-command-route.mjs <selector>` reads the same checked artifact and prints route kind, owner path, payload identity, and required compatibility suites. CI rejects a descriptor whose owner or required proof is missing, drift between the Node registry and descriptor, a direct production spawn of the private payload outside `LegacyCliPassthroughProvider` (test fixtures excepted), or a legacy payload removal before its compatibility binding is removed.\n\n**Rollback:** configuration can never replace a built-in provider (kernel contract §7), and there is no runtime provider-selection swap to roll back a native operation. Rollback of a native operation in R1–R2 is a **release rollback through `fgctl`** — the previous release still ships both the native provider and the Node payload during the observation window. There is no \"roll back by changing provider selection\" mechanism; none is promised anywhere in this stack."
  }
}
```

## Entry f-178: link-178

```json
{
  "id": "link-178",
  "path": "docs/platform/host-invocation-routing/intent-preservation-ledger.md",
  "inputLine": 83,
  "inputColumn": 222,
  "lineBeforeLinkPass": 91,
  "before": "[legacy-cli-transition.md](../../architect/host-invocation-routing/legacy-cli-transition.md#2-legacy-payload-identity-ownership-and-repair-path)",
  "after": "[legacy-cli-transition.md](architecture/legacy-cli-transition.md#2-legacy-payload-identity-ownership-and-repair-path)",
  "legacyPath": "docs/architect/host-invocation-routing/legacy-cli-transition.md",
  "target": {
    "path": "docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md",
    "anchor": "2-legacy-payload-identity-ownership-and-repair-path",
    "aliasId": "host-invocation-draft-056"
  },
  "portal": false,
  "area": "host-invocation-routing",
  "reviewStatus": "pending",
  "oldDestination": "../../architect/host-invocation-routing/legacy-cli-transition.md#2-legacy-payload-identity-ownership-and-repair-path",
  "newDestination": "architecture/legacy-cli-transition.md#2-legacy-payload-identity-ownership-and-repair-path",
  "alias": {
    "fromPath": "docs/architect/host-invocation-routing/legacy-cli-transition.md#2-legacy-payload-identity-ownership-and-repair-path",
    "toOwner": "docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md",
    "toAnchor": "2-legacy-payload-identity-ownership-and-repair-path",
    "kind": "split",
    "evidenceRef": "plans/260925-documentation-authority-unification/reports/phase-06/review-3-rework-source.md",
    "immutableRefs": [],
    "recordedAt": "2026-10-13",
    "aliasId": "host-invocation-draft-056"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 2,
    "title": "2. Legacy Payload Identity, Ownership, And Repair Path",
    "anchor": "2-legacy-payload-identity-ownership-and-repair-path",
    "githubAnchor": "2-legacy-payload-identity-ownership-and-repair-path",
    "stableAnchor": "h-161656a0cd5d",
    "startLine": 34,
    "endLine": 34,
    "textDigest": "e9f472117d68d8c826f9f9b15946883a24addeedf3c298765032fc081f37cb2d",
    "sample": "2. Legacy Payload Identity, Ownership, And Repair Path",
    "sectionPayloadDigest": "5501641da4f536faa95f668b83b823fbe275c8919184266fa6f4017cfe6b3f39",
    "followingBlockDigest": "3254fda9f7179fc52f68274cf803c9cfe550a6ea9f66d975cd3438100aaf804a",
    "identityFingerprint": "fb7cc258dc05206d132fc94bb086f94b7c0cd11df20059cbcbe90b86c5a65e59",
    "ancestry": [
      "Legacy CLI Transition"
    ],
    "text": "## 2. Legacy Payload Identity, Ownership, And Repair Path",
    "sectionText": "## 2. Legacy Payload Identity, Ownership, And Repair Path\n\nThree things are separated that the name `bin/fgos.mjs` currently conflates:\n\n| | Today | After R1 |\n|---|---|---|\n| Public name people type | `fgos` → Node | `fgos` → Rust host (workspace shim / PATH) |\n| Payload identity the Rust host execs | none | `legacy-node` — the release manifest's `components.legacyNode` and the `legacy_payload` field of every `legacy-cli` `CommandRouteDescriptor` |\n| File location | `bin/fgos.mjs` at the repo root | unchanged |\n\n**The Node program is not relocated and not renamed in the source tree** (decided 2026-09-10). `bin/fgos.mjs` computes its package root from its own file location and imports `../src/...` relatively, so moving the entry alone breaks it, and moving the whole Node package would decide the Node-side repo layout that [Repo Layout Vision](../component-boundary/repo-layout-vision.md) §7 deliberately defers (and would mislabel `src/state`, `src/runner` — which `fgos-runner` keeps using — as \"legacy\"). The payload is therefore the current npm package exactly as `package.json` `files` defines it, staged whole by the release builder under the manifest's `components.legacyNode.root` (`libexec/legacy-node/` in a staged release) with the same relative layout as the source tree — zero import changes, `bin/fgos.mjs` and `bin/fgos-runner.mjs` both inside it. The identity is renamed (`legacy-node`), the file is not; a filesystem rename happens only when the payload is deleted.\n\nThe public `fgos` executable is the platform Rust host. It resolves the legacy payload as `join(activeReleasePath, components.legacyNode.root, components.legacyNode.entry)` read from the activation binding's manifest — never from `PATH`, never from the caller's cwd, never as an alternate package-manager `bin` entry, and never hardcoded. A `dev:<rev>` source activation declares `root: \".\"`, `entry: \"bin/fgos.mjs\"`, `entries.fgos: \"target/release/fgos\"`; a staged release declares `root: \"libexec/legacy-node\"`, `entries.fgos: \"bin/fgos\"`. One mechanism serves dogfood and production ([Runtime Identity And Activation](../packaging-distribution/runtime-identity-and-activation.md) §5).\n\n`package.json` `bin.fgos` is removed (or pointed at the workspace shim) when the Rust host becomes the installed default; `bin.fgos-runner` stays until the runner migrates. A header in `bin/fgos.mjs` and the root `AGENTS.md` state the ownership rule for editors already at that path.\n\n**Callers of the old path.** A grep for `bin/fgos.mjs` finds ~150 hits; only ~9 are real call sites, all of them variants of \"where is `fgos`?\": the shell function's tier-1 (`scripts/fgos-shell-integration.sh`), Herdr's three `Command::new(\"node\")` sites (`fgos.rs`, `gateway.rs`, `main.rs`), the dispatch CLI path (`src/runner/dispatch/cli.mjs`), the iron-law footprint matcher (`src/evolve/iron-law.mjs`), the doctor reachability check (`src/setup/registrations.mjs`), the plugin-skill fallback (`core/skills/_shared/fgos-cli-fallback.md` — the single source the ~20 `.agents`/`plugins` copies render from), and `package.json` `bin`. The fix is not a substitution: add one **tier 0 = workspace shim `.fgos/installation/bin/fgos`** to the single resolver each runtime already has (`src/setup/bin-discovery.mjs` for Node, the shell function for shells, one `resolve_fgos` for Herdr) and make the nine sites use it, with the old `node bin/fgos.mjs` path kept only as the fallback for a project that has not run `fgctl init`. The ~75 Node tests that spawn `bin/fgos.mjs` directly stay as they are — they test the Node payload's behavior with the Node payload. Comments are not callers.\n\nEvery selector has exactly one generated `CommandRouteDescriptor`, derived from the Node command registry plus checked migration annotations. Its minimum fields:\n\n```txt\nselector               # canonical command/subcommand selector\nroute_kind             # legacy-cli | native\noperation_id           # required only for native semantic routing\nlegacy_payload         # required only for legacy-cli; named payload identity\nowner_path             # canonical implementation boundary to edit\ncompatibility_tests    # named parity/vector suites required for a repair\n```\n\n`legacy-cli` means the Node payload owns argument parsing and behavior; the Rust host must only recognize the checked selector and preserve the remaining `OsString` argv. `native` means the typed provider owns the operation and the legacy implementation is retained only as an explicitly bounded rollback oracle. A descriptor may not name both paths as active, and an unlisted selector fails the build rather than choosing a fallback.\n\nThe descriptor is both the routing input and the contributor repair map. A repository-local `scripts/explain-command-route.mjs <selector>` reads the same checked artifact and prints route kind, owner path, payload identity, and required compatibility suites. CI rejects a descriptor whose owner or required proof is missing, drift between the Node registry and descriptor, a direct production spawn of the private payload outside `LegacyCliPassthroughProvider` (test fixtures excepted), or a legacy payload removal before its compatibility binding is removed.\n\n**Rollback:** configuration can never replace a built-in provider (kernel contract §7), and there is no runtime provider-selection swap to roll back a native operation. Rollback of a native operation in R1–R2 is a **release rollback through `fgctl`** — the previous release still ships both the native provider and the Node payload during the observation window. There is no \"roll back by changing provider selection\" mechanism; none is promised anywhere in this stack."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 4,
    "title": "2. Legacy Payload Identity, Ownership, And Repair Path",
    "anchor": "2-legacy-payload-identity-ownership-and-repair-path",
    "githubAnchor": "2-legacy-payload-identity-ownership-and-repair-path",
    "stableAnchor": "h-3e28cdecf4b0",
    "startLine": 96,
    "endLine": 96,
    "textDigest": "262d60a7d2ac5ef767de9363fece691019731c14389d464a3095f9bfc7f9d302",
    "sample": "2. Legacy Payload Identity, Ownership, And Repair Path",
    "sectionPayloadDigest": "64db4a88b997dee57c72b0e56664b7a4ca4d1b6c5b44ff83aa8f024db7533166",
    "followingBlockDigest": "3254fda9f7179fc52f68274cf803c9cfe550a6ea9f66d975cd3438100aaf804a",
    "identityFingerprint": "bded858f5c446adfc156b09ac2a1a4863915ed027611a2807e297258290a0609",
    "ancestry": [
      "Architecture: Legacy CLI Transition",
      "Retained selected source material",
      "Legacy CLI Transition"
    ],
    "text": "#### 2. Legacy Payload Identity, Ownership, And Repair Path",
    "sectionText": "#### 2. Legacy Payload Identity, Ownership, And Repair Path\n\nThree things are separated that the name `bin/fgos.mjs` currently conflates:\n\n| | Today | After R1 |\n|---|---|---|\n| Public name people type | `fgos` → Node | `fgos` → Rust host (workspace shim / PATH) |\n| Payload identity the Rust host execs | none | `legacy-node` — the release manifest's `components.legacyNode` and the `legacy_payload` field of every `legacy-cli` `CommandRouteDescriptor` |\n| File location | `bin/fgos.mjs` at the repo root | unchanged |\n\n**The Node program is not relocated and not renamed in the source tree** (decided 2026-09-10). `bin/fgos.mjs` computes its package root from its own file location and imports `../src/...` relatively, so moving the entry alone breaks it, and moving the whole Node package would decide the Node-side repo layout that [Repo Layout Vision](../../component-boundary.md) §7 deliberately defers (and would mislabel `src/state`, `src/runner` — which `fgos-runner` keeps using — as \"legacy\"). The payload is therefore the current npm package exactly as `package.json` `files` defines it, staged whole by the release builder under the manifest's `components.legacyNode.root` (`libexec/legacy-node/` in a staged release) with the same relative layout as the source tree — zero import changes, `bin/fgos.mjs` and `bin/fgos-runner.mjs` both inside it. The identity is renamed (`legacy-node`), the file is not; a filesystem rename happens only when the payload is deleted.\n\nThe public `fgos` executable is the platform Rust host. It resolves the legacy payload as `join(activeReleasePath, components.legacyNode.root, components.legacyNode.entry)` read from the activation binding's manifest — never from `PATH`, never from the caller's cwd, never as an alternate package-manager `bin` entry, and never hardcoded. A `dev:<rev>` source activation declares `root: \".\"`, `entry: \"bin/fgos.mjs\"`, `entries.fgos: \"target/release/fgos\"`; a staged release declares `root: \"libexec/legacy-node\"`, `entries.fgos: \"bin/fgos\"`. One mechanism serves dogfood and production ([Runtime Identity And Activation](../../packaging-distribution/README.md) §5).\n\nAdded in candidate — checked resolver status (2026-10-13): the preceding activation-binding paragraph is retained selected design. `apps/fgos/src/legacy_exec.rs:69-154` selects the release root from explicit release/dev environment bindings or executable-relative manifest discovery, then verifies the manifest and confined entry. The target identity status in spec.md remains `accepted-not-implemented`; checked resolver behavior does not certify the entire target contract. The ownership rule remains never from PATH, never from caller cwd, never as an alternate package-manager bin entry, and never hardcoded.\n\nAdded in candidate: this retained source detail is carried verbatim in [the dropped-010 restoration](release-boundaries.md#restored-package-json-bin-fgos-removed-pointed-at-workspace-shim-at-default-flip-bin-fgos-runner-stays-ownership-hea).\n\n\n**Callers of the old path.** A grep for `bin/fgos.mjs` finds ~150 hits; only ~9 are real call sites, all of them variants of \"where is `fgos`?\": the shell function's tier-1 (`scripts/fgos-shell-integration.sh`), Herdr's three `Command::new(\"node\")` sites (`fgos.rs`, `gateway.rs`, `main.rs`), the dispatch CLI path (`src/runner/dispatch/cli.mjs`), the iron-law footprint matcher (`src/evolve/iron-law.mjs`), the doctor reachability check (`src/setup/registrations.mjs`), the plugin-skill fallback (`core/skills/_shared/fgos-cli-fallback.md` — the single source the ~20 `.agents`/`plugins` copies render from), and `package.json` `bin`. The fix is not a substitution: add one **tier 0 = workspace shim `.fgos/installation/bin/fgos`** to the single resolver each runtime already has (`src/setup/bin-discovery.mjs` for Node, the shell function for shells, one `resolve_fgos` for Herdr) and make the nine sites use it, with the old `node bin/fgos.mjs` path kept only as the fallback for a project that has not run `fgctl init`. The ~75 Node tests that spawn `bin/fgos.mjs` directly stay as they are — they test the Node payload's behavior with the Node payload. Comments are not callers.\n\nEvery selector has exactly one generated `CommandRouteDescriptor`, derived from the Node command registry plus checked migration annotations. Its minimum fields:\n\n```txt\nselector               # canonical command/subcommand selector\nroute_kind             # legacy-cli | native\noperation_id           # required only for native semantic routing\nlegacy_payload         # required only for legacy-cli; named payload identity\nowner_path             # canonical implementation boundary to edit\ncompatibility_tests    # named parity/vector suites required for a repair\n```\n\n`legacy-cli` means the Node payload owns argument parsing and behavior; the Rust host must only recognize the checked selector and preserve the remaining `OsString` argv. `native` means the typed provider owns the operation and the legacy implementation is retained only as an explicitly bounded rollback oracle. A descriptor may not name both paths as active, and an unlisted selector fails the build rather than choosing a fallback.\n\nThe descriptor is both the routing input and the contributor repair map. A repository-local `scripts/explain-command-route.mjs <selector>` reads the same checked artifact and prints route kind, owner path, payload identity, and required compatibility suites. CI rejects a descriptor whose owner or required proof is missing, drift between the Node registry and descriptor, a direct production spawn of the private payload outside `LegacyCliPassthroughProvider` (test fixtures excepted), or a legacy payload removal before its compatibility binding is removed.\n\n**Rollback:** configuration can never replace a built-in provider (kernel contract §7), and there is no runtime provider-selection swap to roll back a native operation. Rollback of a native operation in R1–R2 is a **release rollback through `fgctl`** — the previous release still ships both the native provider and the Node payload during the observation window. There is no \"roll back by changing provider selection\" mechanism; none is promised anywhere in this stack."
  }
}
```

## Entry f-179: link-179

```json
{
  "id": "link-179",
  "path": "docs/platform/host-invocation-routing/intent-preservation-ledger.md",
  "inputLine": 84,
  "inputColumn": 123,
  "lineBeforeLinkPass": 92,
  "before": "[legacy-cli-transition.md](../../architect/host-invocation-routing/legacy-cli-transition.md#2-legacy-payload-identity-ownership-and-repair-path)",
  "after": "[legacy-cli-transition.md](architecture/legacy-cli-transition.md#2-legacy-payload-identity-ownership-and-repair-path)",
  "legacyPath": "docs/architect/host-invocation-routing/legacy-cli-transition.md",
  "target": {
    "path": "docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md",
    "anchor": "2-legacy-payload-identity-ownership-and-repair-path",
    "aliasId": "host-invocation-draft-056"
  },
  "portal": false,
  "area": "host-invocation-routing",
  "reviewStatus": "pending",
  "oldDestination": "../../architect/host-invocation-routing/legacy-cli-transition.md#2-legacy-payload-identity-ownership-and-repair-path",
  "newDestination": "architecture/legacy-cli-transition.md#2-legacy-payload-identity-ownership-and-repair-path",
  "alias": {
    "fromPath": "docs/architect/host-invocation-routing/legacy-cli-transition.md#2-legacy-payload-identity-ownership-and-repair-path",
    "toOwner": "docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md",
    "toAnchor": "2-legacy-payload-identity-ownership-and-repair-path",
    "kind": "split",
    "evidenceRef": "plans/260925-documentation-authority-unification/reports/phase-06/review-3-rework-source.md",
    "immutableRefs": [],
    "recordedAt": "2026-10-13",
    "aliasId": "host-invocation-draft-056"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 2,
    "title": "2. Legacy Payload Identity, Ownership, And Repair Path",
    "anchor": "2-legacy-payload-identity-ownership-and-repair-path",
    "githubAnchor": "2-legacy-payload-identity-ownership-and-repair-path",
    "stableAnchor": "h-161656a0cd5d",
    "startLine": 34,
    "endLine": 34,
    "textDigest": "e9f472117d68d8c826f9f9b15946883a24addeedf3c298765032fc081f37cb2d",
    "sample": "2. Legacy Payload Identity, Ownership, And Repair Path",
    "sectionPayloadDigest": "5501641da4f536faa95f668b83b823fbe275c8919184266fa6f4017cfe6b3f39",
    "followingBlockDigest": "3254fda9f7179fc52f68274cf803c9cfe550a6ea9f66d975cd3438100aaf804a",
    "identityFingerprint": "fb7cc258dc05206d132fc94bb086f94b7c0cd11df20059cbcbe90b86c5a65e59",
    "ancestry": [
      "Legacy CLI Transition"
    ],
    "text": "## 2. Legacy Payload Identity, Ownership, And Repair Path",
    "sectionText": "## 2. Legacy Payload Identity, Ownership, And Repair Path\n\nThree things are separated that the name `bin/fgos.mjs` currently conflates:\n\n| | Today | After R1 |\n|---|---|---|\n| Public name people type | `fgos` → Node | `fgos` → Rust host (workspace shim / PATH) |\n| Payload identity the Rust host execs | none | `legacy-node` — the release manifest's `components.legacyNode` and the `legacy_payload` field of every `legacy-cli` `CommandRouteDescriptor` |\n| File location | `bin/fgos.mjs` at the repo root | unchanged |\n\n**The Node program is not relocated and not renamed in the source tree** (decided 2026-09-10). `bin/fgos.mjs` computes its package root from its own file location and imports `../src/...` relatively, so moving the entry alone breaks it, and moving the whole Node package would decide the Node-side repo layout that [Repo Layout Vision](../component-boundary/repo-layout-vision.md) §7 deliberately defers (and would mislabel `src/state`, `src/runner` — which `fgos-runner` keeps using — as \"legacy\"). The payload is therefore the current npm package exactly as `package.json` `files` defines it, staged whole by the release builder under the manifest's `components.legacyNode.root` (`libexec/legacy-node/` in a staged release) with the same relative layout as the source tree — zero import changes, `bin/fgos.mjs` and `bin/fgos-runner.mjs` both inside it. The identity is renamed (`legacy-node`), the file is not; a filesystem rename happens only when the payload is deleted.\n\nThe public `fgos` executable is the platform Rust host. It resolves the legacy payload as `join(activeReleasePath, components.legacyNode.root, components.legacyNode.entry)` read from the activation binding's manifest — never from `PATH`, never from the caller's cwd, never as an alternate package-manager `bin` entry, and never hardcoded. A `dev:<rev>` source activation declares `root: \".\"`, `entry: \"bin/fgos.mjs\"`, `entries.fgos: \"target/release/fgos\"`; a staged release declares `root: \"libexec/legacy-node\"`, `entries.fgos: \"bin/fgos\"`. One mechanism serves dogfood and production ([Runtime Identity And Activation](../packaging-distribution/runtime-identity-and-activation.md) §5).\n\n`package.json` `bin.fgos` is removed (or pointed at the workspace shim) when the Rust host becomes the installed default; `bin.fgos-runner` stays until the runner migrates. A header in `bin/fgos.mjs` and the root `AGENTS.md` state the ownership rule for editors already at that path.\n\n**Callers of the old path.** A grep for `bin/fgos.mjs` finds ~150 hits; only ~9 are real call sites, all of them variants of \"where is `fgos`?\": the shell function's tier-1 (`scripts/fgos-shell-integration.sh`), Herdr's three `Command::new(\"node\")` sites (`fgos.rs`, `gateway.rs`, `main.rs`), the dispatch CLI path (`src/runner/dispatch/cli.mjs`), the iron-law footprint matcher (`src/evolve/iron-law.mjs`), the doctor reachability check (`src/setup/registrations.mjs`), the plugin-skill fallback (`core/skills/_shared/fgos-cli-fallback.md` — the single source the ~20 `.agents`/`plugins` copies render from), and `package.json` `bin`. The fix is not a substitution: add one **tier 0 = workspace shim `.fgos/installation/bin/fgos`** to the single resolver each runtime already has (`src/setup/bin-discovery.mjs` for Node, the shell function for shells, one `resolve_fgos` for Herdr) and make the nine sites use it, with the old `node bin/fgos.mjs` path kept only as the fallback for a project that has not run `fgctl init`. The ~75 Node tests that spawn `bin/fgos.mjs` directly stay as they are — they test the Node payload's behavior with the Node payload. Comments are not callers.\n\nEvery selector has exactly one generated `CommandRouteDescriptor`, derived from the Node command registry plus checked migration annotations. Its minimum fields:\n\n```txt\nselector               # canonical command/subcommand selector\nroute_kind             # legacy-cli | native\noperation_id           # required only for native semantic routing\nlegacy_payload         # required only for legacy-cli; named payload identity\nowner_path             # canonical implementation boundary to edit\ncompatibility_tests    # named parity/vector suites required for a repair\n```\n\n`legacy-cli` means the Node payload owns argument parsing and behavior; the Rust host must only recognize the checked selector and preserve the remaining `OsString` argv. `native` means the typed provider owns the operation and the legacy implementation is retained only as an explicitly bounded rollback oracle. A descriptor may not name both paths as active, and an unlisted selector fails the build rather than choosing a fallback.\n\nThe descriptor is both the routing input and the contributor repair map. A repository-local `scripts/explain-command-route.mjs <selector>` reads the same checked artifact and prints route kind, owner path, payload identity, and required compatibility suites. CI rejects a descriptor whose owner or required proof is missing, drift between the Node registry and descriptor, a direct production spawn of the private payload outside `LegacyCliPassthroughProvider` (test fixtures excepted), or a legacy payload removal before its compatibility binding is removed.\n\n**Rollback:** configuration can never replace a built-in provider (kernel contract §7), and there is no runtime provider-selection swap to roll back a native operation. Rollback of a native operation in R1–R2 is a **release rollback through `fgctl`** — the previous release still ships both the native provider and the Node payload during the observation window. There is no \"roll back by changing provider selection\" mechanism; none is promised anywhere in this stack."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 4,
    "title": "2. Legacy Payload Identity, Ownership, And Repair Path",
    "anchor": "2-legacy-payload-identity-ownership-and-repair-path",
    "githubAnchor": "2-legacy-payload-identity-ownership-and-repair-path",
    "stableAnchor": "h-3e28cdecf4b0",
    "startLine": 96,
    "endLine": 96,
    "textDigest": "262d60a7d2ac5ef767de9363fece691019731c14389d464a3095f9bfc7f9d302",
    "sample": "2. Legacy Payload Identity, Ownership, And Repair Path",
    "sectionPayloadDigest": "64db4a88b997dee57c72b0e56664b7a4ca4d1b6c5b44ff83aa8f024db7533166",
    "followingBlockDigest": "3254fda9f7179fc52f68274cf803c9cfe550a6ea9f66d975cd3438100aaf804a",
    "identityFingerprint": "bded858f5c446adfc156b09ac2a1a4863915ed027611a2807e297258290a0609",
    "ancestry": [
      "Architecture: Legacy CLI Transition",
      "Retained selected source material",
      "Legacy CLI Transition"
    ],
    "text": "#### 2. Legacy Payload Identity, Ownership, And Repair Path",
    "sectionText": "#### 2. Legacy Payload Identity, Ownership, And Repair Path\n\nThree things are separated that the name `bin/fgos.mjs` currently conflates:\n\n| | Today | After R1 |\n|---|---|---|\n| Public name people type | `fgos` → Node | `fgos` → Rust host (workspace shim / PATH) |\n| Payload identity the Rust host execs | none | `legacy-node` — the release manifest's `components.legacyNode` and the `legacy_payload` field of every `legacy-cli` `CommandRouteDescriptor` |\n| File location | `bin/fgos.mjs` at the repo root | unchanged |\n\n**The Node program is not relocated and not renamed in the source tree** (decided 2026-09-10). `bin/fgos.mjs` computes its package root from its own file location and imports `../src/...` relatively, so moving the entry alone breaks it, and moving the whole Node package would decide the Node-side repo layout that [Repo Layout Vision](../../component-boundary.md) §7 deliberately defers (and would mislabel `src/state`, `src/runner` — which `fgos-runner` keeps using — as \"legacy\"). The payload is therefore the current npm package exactly as `package.json` `files` defines it, staged whole by the release builder under the manifest's `components.legacyNode.root` (`libexec/legacy-node/` in a staged release) with the same relative layout as the source tree — zero import changes, `bin/fgos.mjs` and `bin/fgos-runner.mjs` both inside it. The identity is renamed (`legacy-node`), the file is not; a filesystem rename happens only when the payload is deleted.\n\nThe public `fgos` executable is the platform Rust host. It resolves the legacy payload as `join(activeReleasePath, components.legacyNode.root, components.legacyNode.entry)` read from the activation binding's manifest — never from `PATH`, never from the caller's cwd, never as an alternate package-manager `bin` entry, and never hardcoded. A `dev:<rev>` source activation declares `root: \".\"`, `entry: \"bin/fgos.mjs\"`, `entries.fgos: \"target/release/fgos\"`; a staged release declares `root: \"libexec/legacy-node\"`, `entries.fgos: \"bin/fgos\"`. One mechanism serves dogfood and production ([Runtime Identity And Activation](../../packaging-distribution/README.md) §5).\n\nAdded in candidate — checked resolver status (2026-10-13): the preceding activation-binding paragraph is retained selected design. `apps/fgos/src/legacy_exec.rs:69-154` selects the release root from explicit release/dev environment bindings or executable-relative manifest discovery, then verifies the manifest and confined entry. The target identity status in spec.md remains `accepted-not-implemented`; checked resolver behavior does not certify the entire target contract. The ownership rule remains never from PATH, never from caller cwd, never as an alternate package-manager bin entry, and never hardcoded.\n\nAdded in candidate: this retained source detail is carried verbatim in [the dropped-010 restoration](release-boundaries.md#restored-package-json-bin-fgos-removed-pointed-at-workspace-shim-at-default-flip-bin-fgos-runner-stays-ownership-hea).\n\n\n**Callers of the old path.** A grep for `bin/fgos.mjs` finds ~150 hits; only ~9 are real call sites, all of them variants of \"where is `fgos`?\": the shell function's tier-1 (`scripts/fgos-shell-integration.sh`), Herdr's three `Command::new(\"node\")` sites (`fgos.rs`, `gateway.rs`, `main.rs`), the dispatch CLI path (`src/runner/dispatch/cli.mjs`), the iron-law footprint matcher (`src/evolve/iron-law.mjs`), the doctor reachability check (`src/setup/registrations.mjs`), the plugin-skill fallback (`core/skills/_shared/fgos-cli-fallback.md` — the single source the ~20 `.agents`/`plugins` copies render from), and `package.json` `bin`. The fix is not a substitution: add one **tier 0 = workspace shim `.fgos/installation/bin/fgos`** to the single resolver each runtime already has (`src/setup/bin-discovery.mjs` for Node, the shell function for shells, one `resolve_fgos` for Herdr) and make the nine sites use it, with the old `node bin/fgos.mjs` path kept only as the fallback for a project that has not run `fgctl init`. The ~75 Node tests that spawn `bin/fgos.mjs` directly stay as they are — they test the Node payload's behavior with the Node payload. Comments are not callers.\n\nEvery selector has exactly one generated `CommandRouteDescriptor`, derived from the Node command registry plus checked migration annotations. Its minimum fields:\n\n```txt\nselector               # canonical command/subcommand selector\nroute_kind             # legacy-cli | native\noperation_id           # required only for native semantic routing\nlegacy_payload         # required only for legacy-cli; named payload identity\nowner_path             # canonical implementation boundary to edit\ncompatibility_tests    # named parity/vector suites required for a repair\n```\n\n`legacy-cli` means the Node payload owns argument parsing and behavior; the Rust host must only recognize the checked selector and preserve the remaining `OsString` argv. `native` means the typed provider owns the operation and the legacy implementation is retained only as an explicitly bounded rollback oracle. A descriptor may not name both paths as active, and an unlisted selector fails the build rather than choosing a fallback.\n\nThe descriptor is both the routing input and the contributor repair map. A repository-local `scripts/explain-command-route.mjs <selector>` reads the same checked artifact and prints route kind, owner path, payload identity, and required compatibility suites. CI rejects a descriptor whose owner or required proof is missing, drift between the Node registry and descriptor, a direct production spawn of the private payload outside `LegacyCliPassthroughProvider` (test fixtures excepted), or a legacy payload removal before its compatibility binding is removed.\n\n**Rollback:** configuration can never replace a built-in provider (kernel contract §7), and there is no runtime provider-selection swap to roll back a native operation. Rollback of a native operation in R1–R2 is a **release rollback through `fgctl`** — the previous release still ships both the native provider and the Node payload during the observation window. There is no \"roll back by changing provider selection\" mechanism; none is promised anywhere in this stack."
  }
}
```

## Entry f-180: link-180

```json
{
  "id": "link-180",
  "path": "docs/platform/host-invocation-routing/intent-preservation-ledger.md",
  "inputLine": 84,
  "inputColumn": 269,
  "lineBeforeLinkPass": 92,
  "before": "[rust-cli-and-proof-components-plan.md](../../architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#5-p0-lock-release-inputs-and-baseline-inventory)",
  "after": "[rust-cli-and-proof-components-plan.md](roadmap.md#5-p0-lock-release-inputs-and-baseline-inventory)",
  "legacyPath": "docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md",
  "target": {
    "path": "docs/platform/host-invocation-routing/roadmap.md",
    "anchor": "5-p0-lock-release-inputs-and-baseline-inventory",
    "aliasId": "host-invocation-draft-095"
  },
  "portal": false,
  "area": "host-invocation-routing",
  "reviewStatus": "pending",
  "oldDestination": "../../architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#5-p0-lock-release-inputs-and-baseline-inventory",
  "newDestination": "roadmap.md#5-p0-lock-release-inputs-and-baseline-inventory",
  "alias": {
    "fromPath": "docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#5-p0-lock-release-inputs-and-baseline-inventory",
    "toOwner": "docs/platform/host-invocation-routing/roadmap.md",
    "toAnchor": "5-p0-lock-release-inputs-and-baseline-inventory",
    "kind": "redirected",
    "evidenceRef": "plans/260925-documentation-authority-unification/reports/phase-06/review-3-checkpoint-host-invocation.md",
    "immutableRefs": [],
    "recordedAt": "2026-10-13",
    "aliasId": "host-invocation-draft-095"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 2,
    "title": "5. P0 — Lock Release Inputs And Baseline Inventory",
    "anchor": "5-p0-lock-release-inputs-and-baseline-inventory",
    "githubAnchor": "5-p0-lock-release-inputs-and-baseline-inventory",
    "stableAnchor": "h-04d5d38467f0",
    "startLine": 120,
    "endLine": 120,
    "textDigest": "c39268c2a3a49a989f4b2eba3e8d3b005f5110904ff40ce6fb8253bf71ee9e9d",
    "sample": "5. P0 — Lock Release Inputs And Baseline Inventory",
    "sectionPayloadDigest": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "followingBlockDigest": null,
    "identityFingerprint": "5c5efbab459eae4a927a8b7e938b38c341617da237ff46aacca5e641dd178c7a",
    "ancestry": [
      "Rust Host And Proof Providers Implementation Plan"
    ],
    "text": "## 5. P0 — Lock Release Inputs And Baseline Inventory",
    "sectionText": "## 5. P0 — Lock Release Inputs And Baseline Inventory"
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 4,
    "title": "5. P0 — Lock Release Inputs And Baseline Inventory",
    "anchor": "5-p0-lock-release-inputs-and-baseline-inventory",
    "githubAnchor": "5-p0-lock-release-inputs-and-baseline-inventory",
    "stableAnchor": "h-1c7d73dc6906",
    "startLine": 445,
    "endLine": 445,
    "textDigest": "fb32895c69e4681212012ff918d2ffb8ae84e040099861bc020dd6e627a37d1b",
    "sample": "5. P0 — Lock Release Inputs And Baseline Inventory",
    "sectionPayloadDigest": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "followingBlockDigest": null,
    "identityFingerprint": "26568ff109c8d9f2439c980e8d110c79d0793d237708e90606fbd0704173976d",
    "ancestry": [
      "Host Invocation Routing Roadmap",
      "Retained selected source material",
      "Rust Host And Proof Providers Implementation Plan"
    ],
    "text": "#### 5. P0 — Lock Release Inputs And Baseline Inventory",
    "sectionText": "#### 5. P0 — Lock Release Inputs And Baseline Inventory"
  }
}
```

## Entry f-181: link-181

```json
{
  "id": "link-181",
  "path": "docs/platform/host-invocation-routing/intent-preservation-ledger.md",
  "inputLine": 85,
  "inputColumn": 131,
  "lineBeforeLinkPass": 93,
  "before": "[legacy-cli-transition.md](../../architect/host-invocation-routing/legacy-cli-transition.md#2-legacy-payload-identity-ownership-and-repair-path)",
  "after": "[legacy-cli-transition.md](architecture/legacy-cli-transition.md#2-legacy-payload-identity-ownership-and-repair-path)",
  "legacyPath": "docs/architect/host-invocation-routing/legacy-cli-transition.md",
  "target": {
    "path": "docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md",
    "anchor": "2-legacy-payload-identity-ownership-and-repair-path",
    "aliasId": "host-invocation-draft-056"
  },
  "portal": false,
  "area": "host-invocation-routing",
  "reviewStatus": "pending",
  "oldDestination": "../../architect/host-invocation-routing/legacy-cli-transition.md#2-legacy-payload-identity-ownership-and-repair-path",
  "newDestination": "architecture/legacy-cli-transition.md#2-legacy-payload-identity-ownership-and-repair-path",
  "alias": {
    "fromPath": "docs/architect/host-invocation-routing/legacy-cli-transition.md#2-legacy-payload-identity-ownership-and-repair-path",
    "toOwner": "docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md",
    "toAnchor": "2-legacy-payload-identity-ownership-and-repair-path",
    "kind": "split",
    "evidenceRef": "plans/260925-documentation-authority-unification/reports/phase-06/review-3-rework-source.md",
    "immutableRefs": [],
    "recordedAt": "2026-10-13",
    "aliasId": "host-invocation-draft-056"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 2,
    "title": "2. Legacy Payload Identity, Ownership, And Repair Path",
    "anchor": "2-legacy-payload-identity-ownership-and-repair-path",
    "githubAnchor": "2-legacy-payload-identity-ownership-and-repair-path",
    "stableAnchor": "h-161656a0cd5d",
    "startLine": 34,
    "endLine": 34,
    "textDigest": "e9f472117d68d8c826f9f9b15946883a24addeedf3c298765032fc081f37cb2d",
    "sample": "2. Legacy Payload Identity, Ownership, And Repair Path",
    "sectionPayloadDigest": "5501641da4f536faa95f668b83b823fbe275c8919184266fa6f4017cfe6b3f39",
    "followingBlockDigest": "3254fda9f7179fc52f68274cf803c9cfe550a6ea9f66d975cd3438100aaf804a",
    "identityFingerprint": "fb7cc258dc05206d132fc94bb086f94b7c0cd11df20059cbcbe90b86c5a65e59",
    "ancestry": [
      "Legacy CLI Transition"
    ],
    "text": "## 2. Legacy Payload Identity, Ownership, And Repair Path",
    "sectionText": "## 2. Legacy Payload Identity, Ownership, And Repair Path\n\nThree things are separated that the name `bin/fgos.mjs` currently conflates:\n\n| | Today | After R1 |\n|---|---|---|\n| Public name people type | `fgos` → Node | `fgos` → Rust host (workspace shim / PATH) |\n| Payload identity the Rust host execs | none | `legacy-node` — the release manifest's `components.legacyNode` and the `legacy_payload` field of every `legacy-cli` `CommandRouteDescriptor` |\n| File location | `bin/fgos.mjs` at the repo root | unchanged |\n\n**The Node program is not relocated and not renamed in the source tree** (decided 2026-09-10). `bin/fgos.mjs` computes its package root from its own file location and imports `../src/...` relatively, so moving the entry alone breaks it, and moving the whole Node package would decide the Node-side repo layout that [Repo Layout Vision](../component-boundary/repo-layout-vision.md) §7 deliberately defers (and would mislabel `src/state`, `src/runner` — which `fgos-runner` keeps using — as \"legacy\"). The payload is therefore the current npm package exactly as `package.json` `files` defines it, staged whole by the release builder under the manifest's `components.legacyNode.root` (`libexec/legacy-node/` in a staged release) with the same relative layout as the source tree — zero import changes, `bin/fgos.mjs` and `bin/fgos-runner.mjs` both inside it. The identity is renamed (`legacy-node`), the file is not; a filesystem rename happens only when the payload is deleted.\n\nThe public `fgos` executable is the platform Rust host. It resolves the legacy payload as `join(activeReleasePath, components.legacyNode.root, components.legacyNode.entry)` read from the activation binding's manifest — never from `PATH`, never from the caller's cwd, never as an alternate package-manager `bin` entry, and never hardcoded. A `dev:<rev>` source activation declares `root: \".\"`, `entry: \"bin/fgos.mjs\"`, `entries.fgos: \"target/release/fgos\"`; a staged release declares `root: \"libexec/legacy-node\"`, `entries.fgos: \"bin/fgos\"`. One mechanism serves dogfood and production ([Runtime Identity And Activation](../packaging-distribution/runtime-identity-and-activation.md) §5).\n\n`package.json` `bin.fgos` is removed (or pointed at the workspace shim) when the Rust host becomes the installed default; `bin.fgos-runner` stays until the runner migrates. A header in `bin/fgos.mjs` and the root `AGENTS.md` state the ownership rule for editors already at that path.\n\n**Callers of the old path.** A grep for `bin/fgos.mjs` finds ~150 hits; only ~9 are real call sites, all of them variants of \"where is `fgos`?\": the shell function's tier-1 (`scripts/fgos-shell-integration.sh`), Herdr's three `Command::new(\"node\")` sites (`fgos.rs`, `gateway.rs`, `main.rs`), the dispatch CLI path (`src/runner/dispatch/cli.mjs`), the iron-law footprint matcher (`src/evolve/iron-law.mjs`), the doctor reachability check (`src/setup/registrations.mjs`), the plugin-skill fallback (`core/skills/_shared/fgos-cli-fallback.md` — the single source the ~20 `.agents`/`plugins` copies render from), and `package.json` `bin`. The fix is not a substitution: add one **tier 0 = workspace shim `.fgos/installation/bin/fgos`** to the single resolver each runtime already has (`src/setup/bin-discovery.mjs` for Node, the shell function for shells, one `resolve_fgos` for Herdr) and make the nine sites use it, with the old `node bin/fgos.mjs` path kept only as the fallback for a project that has not run `fgctl init`. The ~75 Node tests that spawn `bin/fgos.mjs` directly stay as they are — they test the Node payload's behavior with the Node payload. Comments are not callers.\n\nEvery selector has exactly one generated `CommandRouteDescriptor`, derived from the Node command registry plus checked migration annotations. Its minimum fields:\n\n```txt\nselector               # canonical command/subcommand selector\nroute_kind             # legacy-cli | native\noperation_id           # required only for native semantic routing\nlegacy_payload         # required only for legacy-cli; named payload identity\nowner_path             # canonical implementation boundary to edit\ncompatibility_tests    # named parity/vector suites required for a repair\n```\n\n`legacy-cli` means the Node payload owns argument parsing and behavior; the Rust host must only recognize the checked selector and preserve the remaining `OsString` argv. `native` means the typed provider owns the operation and the legacy implementation is retained only as an explicitly bounded rollback oracle. A descriptor may not name both paths as active, and an unlisted selector fails the build rather than choosing a fallback.\n\nThe descriptor is both the routing input and the contributor repair map. A repository-local `scripts/explain-command-route.mjs <selector>` reads the same checked artifact and prints route kind, owner path, payload identity, and required compatibility suites. CI rejects a descriptor whose owner or required proof is missing, drift between the Node registry and descriptor, a direct production spawn of the private payload outside `LegacyCliPassthroughProvider` (test fixtures excepted), or a legacy payload removal before its compatibility binding is removed.\n\n**Rollback:** configuration can never replace a built-in provider (kernel contract §7), and there is no runtime provider-selection swap to roll back a native operation. Rollback of a native operation in R1–R2 is a **release rollback through `fgctl`** — the previous release still ships both the native provider and the Node payload during the observation window. There is no \"roll back by changing provider selection\" mechanism; none is promised anywhere in this stack."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 4,
    "title": "2. Legacy Payload Identity, Ownership, And Repair Path",
    "anchor": "2-legacy-payload-identity-ownership-and-repair-path",
    "githubAnchor": "2-legacy-payload-identity-ownership-and-repair-path",
    "stableAnchor": "h-3e28cdecf4b0",
    "startLine": 96,
    "endLine": 96,
    "textDigest": "262d60a7d2ac5ef767de9363fece691019731c14389d464a3095f9bfc7f9d302",
    "sample": "2. Legacy Payload Identity, Ownership, And Repair Path",
    "sectionPayloadDigest": "64db4a88b997dee57c72b0e56664b7a4ca4d1b6c5b44ff83aa8f024db7533166",
    "followingBlockDigest": "3254fda9f7179fc52f68274cf803c9cfe550a6ea9f66d975cd3438100aaf804a",
    "identityFingerprint": "bded858f5c446adfc156b09ac2a1a4863915ed027611a2807e297258290a0609",
    "ancestry": [
      "Architecture: Legacy CLI Transition",
      "Retained selected source material",
      "Legacy CLI Transition"
    ],
    "text": "#### 2. Legacy Payload Identity, Ownership, And Repair Path",
    "sectionText": "#### 2. Legacy Payload Identity, Ownership, And Repair Path\n\nThree things are separated that the name `bin/fgos.mjs` currently conflates:\n\n| | Today | After R1 |\n|---|---|---|\n| Public name people type | `fgos` → Node | `fgos` → Rust host (workspace shim / PATH) |\n| Payload identity the Rust host execs | none | `legacy-node` — the release manifest's `components.legacyNode` and the `legacy_payload` field of every `legacy-cli` `CommandRouteDescriptor` |\n| File location | `bin/fgos.mjs` at the repo root | unchanged |\n\n**The Node program is not relocated and not renamed in the source tree** (decided 2026-09-10). `bin/fgos.mjs` computes its package root from its own file location and imports `../src/...` relatively, so moving the entry alone breaks it, and moving the whole Node package would decide the Node-side repo layout that [Repo Layout Vision](../../component-boundary.md) §7 deliberately defers (and would mislabel `src/state`, `src/runner` — which `fgos-runner` keeps using — as \"legacy\"). The payload is therefore the current npm package exactly as `package.json` `files` defines it, staged whole by the release builder under the manifest's `components.legacyNode.root` (`libexec/legacy-node/` in a staged release) with the same relative layout as the source tree — zero import changes, `bin/fgos.mjs` and `bin/fgos-runner.mjs` both inside it. The identity is renamed (`legacy-node`), the file is not; a filesystem rename happens only when the payload is deleted.\n\nThe public `fgos` executable is the platform Rust host. It resolves the legacy payload as `join(activeReleasePath, components.legacyNode.root, components.legacyNode.entry)` read from the activation binding's manifest — never from `PATH`, never from the caller's cwd, never as an alternate package-manager `bin` entry, and never hardcoded. A `dev:<rev>` source activation declares `root: \".\"`, `entry: \"bin/fgos.mjs\"`, `entries.fgos: \"target/release/fgos\"`; a staged release declares `root: \"libexec/legacy-node\"`, `entries.fgos: \"bin/fgos\"`. One mechanism serves dogfood and production ([Runtime Identity And Activation](../../packaging-distribution/README.md) §5).\n\nAdded in candidate — checked resolver status (2026-10-13): the preceding activation-binding paragraph is retained selected design. `apps/fgos/src/legacy_exec.rs:69-154` selects the release root from explicit release/dev environment bindings or executable-relative manifest discovery, then verifies the manifest and confined entry. The target identity status in spec.md remains `accepted-not-implemented`; checked resolver behavior does not certify the entire target contract. The ownership rule remains never from PATH, never from caller cwd, never as an alternate package-manager bin entry, and never hardcoded.\n\nAdded in candidate: this retained source detail is carried verbatim in [the dropped-010 restoration](release-boundaries.md#restored-package-json-bin-fgos-removed-pointed-at-workspace-shim-at-default-flip-bin-fgos-runner-stays-ownership-hea).\n\n\n**Callers of the old path.** A grep for `bin/fgos.mjs` finds ~150 hits; only ~9 are real call sites, all of them variants of \"where is `fgos`?\": the shell function's tier-1 (`scripts/fgos-shell-integration.sh`), Herdr's three `Command::new(\"node\")` sites (`fgos.rs`, `gateway.rs`, `main.rs`), the dispatch CLI path (`src/runner/dispatch/cli.mjs`), the iron-law footprint matcher (`src/evolve/iron-law.mjs`), the doctor reachability check (`src/setup/registrations.mjs`), the plugin-skill fallback (`core/skills/_shared/fgos-cli-fallback.md` — the single source the ~20 `.agents`/`plugins` copies render from), and `package.json` `bin`. The fix is not a substitution: add one **tier 0 = workspace shim `.fgos/installation/bin/fgos`** to the single resolver each runtime already has (`src/setup/bin-discovery.mjs` for Node, the shell function for shells, one `resolve_fgos` for Herdr) and make the nine sites use it, with the old `node bin/fgos.mjs` path kept only as the fallback for a project that has not run `fgctl init`. The ~75 Node tests that spawn `bin/fgos.mjs` directly stay as they are — they test the Node payload's behavior with the Node payload. Comments are not callers.\n\nEvery selector has exactly one generated `CommandRouteDescriptor`, derived from the Node command registry plus checked migration annotations. Its minimum fields:\n\n```txt\nselector               # canonical command/subcommand selector\nroute_kind             # legacy-cli | native\noperation_id           # required only for native semantic routing\nlegacy_payload         # required only for legacy-cli; named payload identity\nowner_path             # canonical implementation boundary to edit\ncompatibility_tests    # named parity/vector suites required for a repair\n```\n\n`legacy-cli` means the Node payload owns argument parsing and behavior; the Rust host must only recognize the checked selector and preserve the remaining `OsString` argv. `native` means the typed provider owns the operation and the legacy implementation is retained only as an explicitly bounded rollback oracle. A descriptor may not name both paths as active, and an unlisted selector fails the build rather than choosing a fallback.\n\nThe descriptor is both the routing input and the contributor repair map. A repository-local `scripts/explain-command-route.mjs <selector>` reads the same checked artifact and prints route kind, owner path, payload identity, and required compatibility suites. CI rejects a descriptor whose owner or required proof is missing, drift between the Node registry and descriptor, a direct production spawn of the private payload outside `LegacyCliPassthroughProvider` (test fixtures excepted), or a legacy payload removal before its compatibility binding is removed.\n\n**Rollback:** configuration can never replace a built-in provider (kernel contract §7), and there is no runtime provider-selection swap to roll back a native operation. Rollback of a native operation in R1–R2 is a **release rollback through `fgctl`** — the previous release still ships both the native provider and the Node payload during the observation window. There is no \"roll back by changing provider selection\" mechanism; none is promised anywhere in this stack."
  }
}
```

## Entry f-182: link-182

```json
{
  "id": "link-182",
  "path": "docs/platform/host-invocation-routing/intent-preservation-ledger.md",
  "inputLine": 85,
  "inputColumn": 277,
  "lineBeforeLinkPass": 93,
  "before": "[rust-cli-and-proof-components-plan.md](../../architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#6-p1-compatibility-harness)",
  "after": "[rust-cli-and-proof-components-plan.md](roadmap.md#6-p1-compatibility-harness)",
  "legacyPath": "docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md",
  "target": {
    "path": "docs/platform/host-invocation-routing/roadmap.md",
    "anchor": "6-p1-compatibility-harness",
    "aliasId": "host-invocation-draft-100"
  },
  "portal": false,
  "area": "host-invocation-routing",
  "reviewStatus": "pending",
  "oldDestination": "../../architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#6-p1-compatibility-harness",
  "newDestination": "roadmap.md#6-p1-compatibility-harness",
  "alias": {
    "fromPath": "docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#6-p1-compatibility-harness",
    "toOwner": "docs/platform/host-invocation-routing/roadmap.md",
    "toAnchor": "6-p1-compatibility-harness",
    "kind": "redirected",
    "evidenceRef": "plans/260925-documentation-authority-unification/reports/phase-06/review-3-rework-source.md",
    "immutableRefs": [],
    "recordedAt": "2026-10-13",
    "aliasId": "host-invocation-draft-100"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 2,
    "title": "6. P1 — Compatibility Harness",
    "anchor": "6-p1-compatibility-harness",
    "githubAnchor": "6-p1-compatibility-harness",
    "stableAnchor": "h-cc8f6fc653ae",
    "startLine": 187,
    "endLine": 187,
    "textDigest": "42627a79ae9e2ad3cdd87a461aedfab3e1a4bc6c1ccb6396b6d62e3811e2dedd",
    "sample": "6. P1 — Compatibility Harness",
    "sectionPayloadDigest": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "followingBlockDigest": null,
    "identityFingerprint": "37676a51e0e644913c45c098380d35d6fdb4ea6fa4d24be44036a6501d196b1a",
    "ancestry": [
      "Rust Host And Proof Providers Implementation Plan"
    ],
    "text": "## 6. P1 — Compatibility Harness",
    "sectionText": "## 6. P1 — Compatibility Harness"
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 4,
    "title": "6. P1 — Compatibility Harness",
    "anchor": "6-p1-compatibility-harness",
    "githubAnchor": "6-p1-compatibility-harness",
    "stableAnchor": "h-d532b16f9920",
    "startLine": 512,
    "endLine": 512,
    "textDigest": "8fe73175caed647b1eb18bd5241b3974b2614d3b132fb87c0a1a00ec7c2be8d1",
    "sample": "6. P1 — Compatibility Harness",
    "sectionPayloadDigest": "bccca9c9838cfef883fd7e6574fa338f73bdb61a60f9370c90e6630c79ab1faa",
    "followingBlockDigest": "ee740aab553abbb9f8cd9f97bd45c2162cdc6f5e96b2cf21ee0ce0dd57671c4d",
    "identityFingerprint": "1761b7d7d312d20455fcd2ea9618fc74a1ff5e147fa63d3a083d18e1f4fbaba5",
    "ancestry": [
      "Host Invocation Routing Roadmap",
      "Retained selected source material",
      "Rust Host And Proof Providers Implementation Plan"
    ],
    "text": "#### 6. P1 — Compatibility Harness",
    "sectionText": "#### 6. P1 — Compatibility Harness\n\n\nAdded in candidate: this retained source detail is carried verbatim in [the dropped-016 restoration](contracts/component-protocol.md#restored-p1-compatibility-harness).\n\n\n\nAdded in candidate: this retained source detail is carried verbatim in [the dropped-016 restoration](contracts/component-protocol.md#restored-p1-compatibility-harness)."
  }
}
```

## Entry f-183: link-183

```json
{
  "id": "link-183",
  "path": "docs/platform/host-invocation-routing/intent-preservation-ledger.md",
  "inputLine": 86,
  "inputColumn": 116,
  "lineBeforeLinkPass": 94,
  "before": "[legacy-cli-transition.md](../../architect/host-invocation-routing/legacy-cli-transition.md#4-public-presentation-versus-semantic-outcome)",
  "after": "[legacy-cli-transition.md](architecture/legacy-cli-transition.md#4-public-presentation-versus-semantic-outcome)",
  "legacyPath": "docs/architect/host-invocation-routing/legacy-cli-transition.md",
  "target": {
    "path": "docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md",
    "anchor": "4-public-presentation-versus-semantic-outcome",
    "aliasId": "host-invocation-draft-058"
  },
  "portal": false,
  "area": "host-invocation-routing",
  "reviewStatus": "pending",
  "oldDestination": "../../architect/host-invocation-routing/legacy-cli-transition.md#4-public-presentation-versus-semantic-outcome",
  "newDestination": "architecture/legacy-cli-transition.md#4-public-presentation-versus-semantic-outcome",
  "alias": {
    "fromPath": "docs/architect/host-invocation-routing/legacy-cli-transition.md#4-public-presentation-versus-semantic-outcome",
    "toOwner": "docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md",
    "toAnchor": "4-public-presentation-versus-semantic-outcome",
    "kind": "redirected",
    "evidenceRef": "plans/260925-documentation-authority-unification/reports/phase-06/review-3-checkpoint-host-invocation.md",
    "immutableRefs": [],
    "recordedAt": "2026-10-13",
    "aliasId": "host-invocation-draft-058"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 2,
    "title": "4. Public Presentation Versus Semantic Outcome",
    "anchor": "4-public-presentation-versus-semantic-outcome",
    "githubAnchor": "4-public-presentation-versus-semantic-outcome",
    "stableAnchor": "h-602ee0e69241",
    "startLine": 77,
    "endLine": 77,
    "textDigest": "57513242fdb0616787a7659501ec2149ef3a0a4508c9cb2bc5ef1a9df20f5eaf",
    "sample": "4. Public Presentation Versus Semantic Outcome",
    "sectionPayloadDigest": "2d82621f36f7459b04ff11fd65b473e4a41c4e1b5e2001f412c64128c570a549",
    "followingBlockDigest": "e7f17313cf29b200e52c2db52e8ec9b8e4c4817230753bff368004d73c705581",
    "identityFingerprint": "32a4c96bd1a215fe02712233ce1305ff07ceb089f7b4545ec239dce76b8f222b",
    "ancestry": [
      "Legacy CLI Transition"
    ],
    "text": "## 4. Public Presentation Versus Semantic Outcome",
    "sectionText": "## 4. Public Presentation Versus Semantic Outcome\n\n`fgos.v1` belongs to the CLI presenter, not to the provider protocol. Likewise, HTTP status and MCP tool results belong to the remote presenter.\n\nNative providers return `ProviderOutcome`; the calling presenter wraps it once. Transparent legacy output (from `LegacyCliPassthroughProvider`) is already a public presentation and passes through unchanged — it must never be parsed and wrapped in a second `fgos.v1` envelope.\n\nCurrent `fgos.v1` hashes compact `JSON.stringify(data)` bytes but prints the final envelope using two-space pretty JSON. Cross-runtime compatibility tests therefore separate: semantic data equality, compact hash input, hash output, envelope order/pretty rendering, timestamp shape, trailing newline, stdout/stderr, and exit/signal mapping.\n\nGolden vectors are necessary but not sufficient. A Node-generated differential corpus covers object insertion order, integer limits, negative zero, floating exponent formatting, Unicode/control characters, nested arrays/maps, null and booleans. Timestamp values are checked for shape/range rather than equality. Generic byte parity is not inferred from the narrow `version` payload."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 4,
    "title": "4. Public Presentation Versus Semantic Outcome",
    "anchor": "4-public-presentation-versus-semantic-outcome",
    "githubAnchor": "4-public-presentation-versus-semantic-outcome",
    "stableAnchor": "h-13a165d05f6a",
    "startLine": 144,
    "endLine": 144,
    "textDigest": "473968087ec285fd9d193b0923a596d450369f2e7cbb96ec911555b5638d7c59",
    "sample": "4. Public Presentation Versus Semantic Outcome",
    "sectionPayloadDigest": "2d82621f36f7459b04ff11fd65b473e4a41c4e1b5e2001f412c64128c570a549",
    "followingBlockDigest": "e7f17313cf29b200e52c2db52e8ec9b8e4c4817230753bff368004d73c705581",
    "identityFingerprint": "88fc110f894c464f2334fcaaf202ed6f41c2f54bdc3c828b6698c73bae8a9841",
    "ancestry": [
      "Architecture: Legacy CLI Transition",
      "Retained selected source material",
      "Legacy CLI Transition"
    ],
    "text": "#### 4. Public Presentation Versus Semantic Outcome",
    "sectionText": "#### 4. Public Presentation Versus Semantic Outcome\n\n`fgos.v1` belongs to the CLI presenter, not to the provider protocol. Likewise, HTTP status and MCP tool results belong to the remote presenter.\n\nNative providers return `ProviderOutcome`; the calling presenter wraps it once. Transparent legacy output (from `LegacyCliPassthroughProvider`) is already a public presentation and passes through unchanged — it must never be parsed and wrapped in a second `fgos.v1` envelope.\n\nCurrent `fgos.v1` hashes compact `JSON.stringify(data)` bytes but prints the final envelope using two-space pretty JSON. Cross-runtime compatibility tests therefore separate: semantic data equality, compact hash input, hash output, envelope order/pretty rendering, timestamp shape, trailing newline, stdout/stderr, and exit/signal mapping.\n\nGolden vectors are necessary but not sufficient. A Node-generated differential corpus covers object insertion order, integer limits, negative zero, floating exponent formatting, Unicode/control characters, nested arrays/maps, null and booleans. Timestamp values are checked for shape/range rather than equality. Generic byte parity is not inferred from the narrow `version` payload."
  }
}
```

## Entry f-184: link-184

```json
{
  "id": "link-184",
  "path": "docs/platform/host-invocation-routing/intent-preservation-ledger.md",
  "inputLine": 87,
  "inputColumn": 109,
  "lineBeforeLinkPass": 95,
  "before": "[node-to-rust-component-migration.md](../../architect/host-invocation-routing/node-to-rust-component-migration.md#2-options-considered)",
  "after": "[node-to-rust-component-migration.md](architecture/node-to-rust-migration.md#2-options-considered)",
  "legacyPath": "docs/architect/host-invocation-routing/node-to-rust-component-migration.md",
  "target": {
    "path": "docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md",
    "anchor": "2-options-considered",
    "aliasId": "host-invocation-draft-065"
  },
  "portal": false,
  "area": "host-invocation-routing",
  "reviewStatus": "pending",
  "oldDestination": "../../architect/host-invocation-routing/node-to-rust-component-migration.md#2-options-considered",
  "newDestination": "architecture/node-to-rust-migration.md#2-options-considered",
  "alias": {
    "fromPath": "docs/architect/host-invocation-routing/node-to-rust-component-migration.md#2-options-considered",
    "toOwner": "docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md",
    "toAnchor": "2-options-considered",
    "kind": "redirected",
    "evidenceRef": "plans/260925-documentation-authority-unification/reports/phase-06/review-3-checkpoint-host-invocation.md",
    "immutableRefs": [],
    "recordedAt": "2026-10-13",
    "aliasId": "host-invocation-draft-065"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 2,
    "title": "2. Options Considered",
    "anchor": "2-options-considered",
    "githubAnchor": "2-options-considered",
    "stableAnchor": "h-ab03989db188",
    "startLine": 65,
    "endLine": 65,
    "textDigest": "895d0cb403741694da25bfbd6b5aa8d239d66598874938a844c09c4ac34741d2",
    "sample": "2. Options Considered",
    "sectionPayloadDigest": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "followingBlockDigest": null,
    "identityFingerprint": "da5ab0054b428fae1789faf0ef1958811169ba974a768273f2802ac06d9485cf",
    "ancestry": [
      "Node To Rust Component Migration"
    ],
    "text": "## 2. Options Considered",
    "sectionText": "## 2. Options Considered"
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 4,
    "title": "2. Options Considered",
    "anchor": "2-options-considered",
    "githubAnchor": "2-options-considered",
    "stableAnchor": "h-80670b41c916",
    "startLine": 120,
    "endLine": 120,
    "textDigest": "8ce24c6fb96b7dafb0e17d325f8b0f408d9cc0eca0ebc05185073bd066f86498",
    "sample": "2. Options Considered",
    "sectionPayloadDigest": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "followingBlockDigest": null,
    "identityFingerprint": "f60a10cf33c2c705dab43cc1c0dae8e25bd2895d91a93eda6db89381e5bb6300",
    "ancestry": [
      "Architecture: Node To Rust Migration",
      "Retained selected source material",
      "Node To Rust Component Migration"
    ],
    "text": "#### 2. Options Considered",
    "sectionText": "#### 2. Options Considered"
  }
}
```

## Entry f-185: link-185

```json
{
  "id": "link-185",
  "path": "docs/platform/host-invocation-routing/intent-preservation-ledger.md",
  "inputLine": 88,
  "inputColumn": 108,
  "lineBeforeLinkPass": 96,
  "before": "[node-to-rust-component-migration.md](../../architect/host-invocation-routing/node-to-rust-component-migration.md#4-current-migration-readiness)",
  "after": "[node-to-rust-component-migration.md](architecture/node-to-rust-migration.md#4-current-migration-readiness)",
  "legacyPath": "docs/architect/host-invocation-routing/node-to-rust-component-migration.md",
  "target": {
    "path": "docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md",
    "anchor": "4-current-migration-readiness",
    "aliasId": "host-invocation-draft-071"
  },
  "portal": false,
  "area": "host-invocation-routing",
  "reviewStatus": "pending",
  "oldDestination": "../../architect/host-invocation-routing/node-to-rust-component-migration.md#4-current-migration-readiness",
  "newDestination": "architecture/node-to-rust-migration.md#4-current-migration-readiness",
  "alias": {
    "fromPath": "docs/architect/host-invocation-routing/node-to-rust-component-migration.md#4-current-migration-readiness",
    "toOwner": "docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md",
    "toAnchor": "4-current-migration-readiness",
    "kind": "redirected",
    "evidenceRef": "plans/260925-documentation-authority-unification/reports/phase-06/review-3-checkpoint-host-invocation.md",
    "immutableRefs": [],
    "recordedAt": "2026-10-13",
    "aliasId": "host-invocation-draft-071"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 2,
    "title": "4. Current Migration Readiness",
    "anchor": "4-current-migration-readiness",
    "githubAnchor": "4-current-migration-readiness",
    "stableAnchor": "h-59dbe2935522",
    "startLine": 131,
    "endLine": 131,
    "textDigest": "9c3b81a227227dd12f0d1971a045d6ac33bc42bdd76659841b809f82c0113df5",
    "sample": "4. Current Migration Readiness",
    "sectionPayloadDigest": "8b5a966733683eab6df2f76c6271d3236bf5d50ac2d9149c4c35f66260f6fa64",
    "followingBlockDigest": "8b5a966733683eab6df2f76c6271d3236bf5d50ac2d9149c4c35f66260f6fa64",
    "identityFingerprint": "c1a2d23a78da301f940bec10f792954a2e8c2fb44658f2e88e1044b1f478d587",
    "ancestry": [
      "Node To Rust Component Migration"
    ],
    "text": "## 4. Current Migration Readiness",
    "sectionText": "## 4. Current Migration Readiness\n\nThe current CLI thinness is an ordering signal, not a prerequisite to refactor\nall Node code first."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 4,
    "title": "4. Current Migration Readiness",
    "anchor": "4-current-migration-readiness",
    "githubAnchor": "4-current-migration-readiness",
    "stableAnchor": "h-2de3f6ff57e1",
    "startLine": 169,
    "endLine": 169,
    "textDigest": "39a41a4c6c09a1bfd0e86ed2aa0c5a65d2075dcccbfa6976d162e060ef0bbd11",
    "sample": "4. Current Migration Readiness",
    "sectionPayloadDigest": "8b5a966733683eab6df2f76c6271d3236bf5d50ac2d9149c4c35f66260f6fa64",
    "followingBlockDigest": "8b5a966733683eab6df2f76c6271d3236bf5d50ac2d9149c4c35f66260f6fa64",
    "identityFingerprint": "0a1bd4b9993e532c7af850abafda4bd5f6a6661125bdeff4264c3263c3aaa2c1",
    "ancestry": [
      "Architecture: Node To Rust Migration",
      "Retained selected source material",
      "Node To Rust Component Migration"
    ],
    "text": "#### 4. Current Migration Readiness",
    "sectionText": "#### 4. Current Migration Readiness\n\nThe current CLI thinness is an ordering signal, not a prerequisite to refactor\nall Node code first."
  }
}
```

## Entry f-186: link-186

```json
{
  "id": "link-186",
  "path": "docs/platform/host-invocation-routing/intent-preservation-ledger.md",
  "inputLine": 89,
  "inputColumn": 208,
  "lineBeforeLinkPass": 97,
  "before": "[node-to-rust-component-migration.md](../../architect/host-invocation-routing/node-to-rust-component-migration.md#5-release-r1-distributable-rust-cli-host)",
  "after": "[node-to-rust-component-migration.md](architecture/node-to-rust-migration.md#5-release-r1-distributable-rust-cli-host)",
  "legacyPath": "docs/architect/host-invocation-routing/node-to-rust-component-migration.md",
  "target": {
    "path": "docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md",
    "anchor": "5-release-r1-distributable-rust-cli-host",
    "aliasId": "host-invocation-draft-075"
  },
  "portal": false,
  "area": "host-invocation-routing",
  "reviewStatus": "pending",
  "oldDestination": "../../architect/host-invocation-routing/node-to-rust-component-migration.md#5-release-r1-distributable-rust-cli-host",
  "newDestination": "architecture/node-to-rust-migration.md#5-release-r1-distributable-rust-cli-host",
  "alias": {
    "fromPath": "docs/architect/host-invocation-routing/node-to-rust-component-migration.md#5-release-r1-distributable-rust-cli-host",
    "toOwner": "docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md",
    "toAnchor": "5-release-r1-distributable-rust-cli-host",
    "kind": "redirected",
    "evidenceRef": "plans/260925-documentation-authority-unification/reports/phase-06/review-3-checkpoint-host-invocation.md",
    "immutableRefs": [],
    "recordedAt": "2026-10-13",
    "aliasId": "host-invocation-draft-075"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 2,
    "title": "5. Release R1: Distributable Rust CLI Host",
    "anchor": "5-release-r1-distributable-rust-cli-host",
    "githubAnchor": "5-release-r1-distributable-rust-cli-host",
    "stableAnchor": "h-02c23b075627",
    "startLine": 179,
    "endLine": 179,
    "textDigest": "cf9af2c3f99440dfa212024724d08854223f02a30f7458ed22e4c41fd78c7a03",
    "sample": "5. Release R1: Distributable Rust CLI Host",
    "sectionPayloadDigest": "7758fab54473b885eea25e2e33833defff69b4e1a7e74c3e58c6eb46892d5bee",
    "followingBlockDigest": "e0bdf8b949ac84b4d4faf18c322218a41b80baf59b0475b813fbbc4e38e704a1",
    "identityFingerprint": "befd5356db24c23b6ea8e56b6cc7ebbeb595dfbceebc88d551b968556ef35080",
    "ancestry": [
      "Node To Rust Component Migration"
    ],
    "text": "## 5. Release R1: Distributable Rust CLI Host",
    "sectionText": "## 5. Release R1: Distributable Rust CLI Host\n\nR1 is the smallest honest meaning of “ship the Rust host”. It is not merely a\nbinary that passes repository tests. The installed product entry becomes Rust,\nall unmigrated CLI selectors retain transparent whole-invocation Node\ncompatibility, `fgos-runner` remains a separately proven Node public entry, and\n`version` proves one typed built-in operation.\n\nThe migration order is:\n\n1. adopt the packaging stream's settled install/activation/rollback contract\n   (`fgctl` + release store + workspace activation binding; see\n   [Runtime Identity And Activation](../packaging-distribution/runtime-identity-and-activation.md)\n   §11–§13); confirm the supported target matrix;\n2. name the Node payload `legacy-node` in the release manifest\n   (`components.legacyNode.root`/`entry`) without moving or renaming any file;\n   add the ownership header to `bin/fgos.mjs` and the root `AGENTS.md` note;\n3. freeze executable Node compatibility evidence and the checked command-route\n   descriptor, including the owner and test suite for every selector;\n4. land the Rust invocation kernel with immutable static bindings and the\n   two-stage authority path;\n5. wire the CLI adapter to read the checked `CommandRouteDescriptor` for every\n   current selector: a `legacy-cli` selector execs straight to the Node\n   payload with argv preserved, never entering `InvocationService`; only a\n   `native` selector builds an `OperationRequest`. See\n   [Legacy CLI Transition](./legacy-cli-transition.md);\n6. migrate `version` to native `distribution.build.show`;\n7. prove the install/activation/rollback contract through `fgctl init` on an\n   external temp project from a staged release, followed by the active\n   runtime's `fgos init` → `doctor --fix` → `doctor`, on every supported\n   target;\n8. flip the installed default only after the compatibility and distribution\n   gates pass.\n\nExternal-process discovery, WASM, chat, and production gateway adoption do not\nblock R1. They prove later parts of the permanent architecture without delaying\nthe first usable release.\n\nExit condition: every existing CLI invocation still reaches Node unchanged (via\nthe CLI adapter's legacy-cli exec lane) or an explicitly native provider,\n`version` creates no Node process, and the proof runs through `fgctl init` on\nan external temp project from a staged release, followed by the active\nruntime's `fgos init` → `doctor --fix` → `doctor`, with the previous release\nremaining a named rollback channel through `fgctl`. For every legacy selector,\n`explain-command-route` identifies the canonical Node owner and required\nparity suite; no contributor must infer ownership from a stale `bin/fgos.mjs`\nreference. The activated Rust host, legacy payload, and Node runner always\ncome from one versioned release artifact; no release mixes them across\nversions."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 4,
    "title": "5. Release R1: Distributable Rust CLI Host",
    "anchor": "5-release-r1-distributable-rust-cli-host",
    "githubAnchor": "5-release-r1-distributable-rust-cli-host",
    "stableAnchor": "h-37e990d45423",
    "startLine": 217,
    "endLine": 217,
    "textDigest": "47e3cabcaa8b4bb6f1864e8ae6bf689bf3ada1214b57d3701ca45b6408ef911c",
    "sample": "5. Release R1: Distributable Rust CLI Host",
    "sectionPayloadDigest": "950beec19a2e5b253100ae3ff653fcdc694c32ca8f3ba001ca1c5d47c5271b2d",
    "followingBlockDigest": "e0bdf8b949ac84b4d4faf18c322218a41b80baf59b0475b813fbbc4e38e704a1",
    "identityFingerprint": "7f98eb8728992b9ec8beacc6c50d1a88918390b61eb2c1bdc84cc4e8ee908636",
    "ancestry": [
      "Architecture: Node To Rust Migration",
      "Retained selected source material",
      "Node To Rust Component Migration"
    ],
    "text": "#### 5. Release R1: Distributable Rust CLI Host",
    "sectionText": "#### 5. Release R1: Distributable Rust CLI Host\n\nR1 is the smallest honest meaning of “ship the Rust host”. It is not merely a\nbinary that passes repository tests. The installed product entry becomes Rust,\nall unmigrated CLI selectors retain transparent whole-invocation Node\ncompatibility, `fgos-runner` remains a separately proven Node public entry, and\n`version` proves one typed built-in operation.\n\nThe migration order is:\n\n1. adopt the packaging stream's settled install/activation/rollback contract\n   (`fgctl` + release store + workspace activation binding; see\n   [Runtime Identity And Activation](../../packaging-distribution/README.md)\n   §11–§13); confirm the supported target matrix;\n2. name the Node payload `legacy-node` in the release manifest\n   (`components.legacyNode.root`/`entry`) without moving or renaming any file;\n   add the ownership header to `bin/fgos.mjs` and the root `AGENTS.md` note;\n3. freeze executable Node compatibility evidence and the checked command-route\n   descriptor, including the owner and test suite for every selector;\n4. land the Rust invocation kernel with immutable static bindings and the\n   two-stage authority path;\n5. wire the CLI adapter to read the checked `CommandRouteDescriptor` for every\n   current selector: a `legacy-cli` selector execs straight to the Node\n   payload with argv preserved, never entering `InvocationService`; only a\n   `native` selector builds an `OperationRequest`. See\n   [Legacy CLI Transition](legacy-cli-transition.md);\n6. migrate `version` to native `distribution.build.show`;\n7. prove the install/activation/rollback contract through `fgctl init` on an\n   external temp project from a staged release, followed by the active\n   runtime's `fgos init` → `doctor --fix` → `doctor`, on every supported\n   target;\n8. flip the installed default only after the compatibility and distribution\n   gates pass.\n\nExternal-process discovery, WASM, chat, and production gateway adoption do not\nblock R1. They prove later parts of the permanent architecture without delaying\nthe first usable release.\n\nExit condition: every existing CLI invocation still reaches Node unchanged (via\nthe CLI adapter's legacy-cli exec lane) or an explicitly native provider,\n`version` creates no Node process, and the proof runs through `fgctl init` on\nan external temp project from a staged release, followed by the active\nruntime's `fgos init` → `doctor --fix` → `doctor`, with the previous release\nremaining a named rollback channel through `fgctl`. For every legacy selector,\n`explain-command-route` identifies the canonical Node owner and required\nparity suite; no contributor must infer ownership from a stale `bin/fgos.mjs`\nreference. The activated Rust host, legacy payload, and Node runner always\ncome from one versioned release artifact; no release mixes them across\nversions."
  }
}
```

## Entry f-187: link-187

```json
{
  "id": "link-187",
  "path": "docs/platform/host-invocation-routing/intent-preservation-ledger.md",
  "inputLine": 90,
  "inputColumn": 110,
  "lineBeforeLinkPass": 98,
  "before": "[node-to-rust-component-migration.md](../../architect/host-invocation-routing/node-to-rust-component-migration.md#8-migrate-the-next-small-read-only-proof)",
  "after": "[node-to-rust-component-migration.md](architecture/node-to-rust-migration.md#8-migrate-the-next-small-read-only-proof)",
  "legacyPath": "docs/architect/host-invocation-routing/node-to-rust-component-migration.md",
  "target": {
    "path": "docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md",
    "anchor": "8-migrate-the-next-small-read-only-proof",
    "aliasId": "host-invocation-draft-078"
  },
  "portal": false,
  "area": "host-invocation-routing",
  "reviewStatus": "pending",
  "oldDestination": "../../architect/host-invocation-routing/node-to-rust-component-migration.md#8-migrate-the-next-small-read-only-proof",
  "newDestination": "architecture/node-to-rust-migration.md#8-migrate-the-next-small-read-only-proof",
  "alias": {
    "fromPath": "docs/architect/host-invocation-routing/node-to-rust-component-migration.md#8-migrate-the-next-small-read-only-proof",
    "toOwner": "docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md",
    "toAnchor": "8-migrate-the-next-small-read-only-proof",
    "kind": "redirected",
    "evidenceRef": "plans/260925-documentation-authority-unification/reports/phase-06/review-3-checkpoint-host-invocation.md",
    "immutableRefs": [],
    "recordedAt": "2026-10-13",
    "aliasId": "host-invocation-draft-078"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 2,
    "title": "8. Migrate The Next Small Read-Only Proof",
    "anchor": "8-migrate-the-next-small-read-only-proof",
    "githubAnchor": "8-migrate-the-next-small-read-only-proof",
    "stableAnchor": "h-63fc69d4f3a1",
    "startLine": 279,
    "endLine": 279,
    "textDigest": "d38e66402682d6fc341f91b7d1936d2eef1c524ffec2d9ff4d5f8df7e9de3814",
    "sample": "8. Migrate The Next Small Read-Only Proof",
    "sectionPayloadDigest": "7ea0f46cc6d8e9f8af96458a6ad783a36d99b491544cd136562c5c13422b8fc0",
    "followingBlockDigest": "7ea0f46cc6d8e9f8af96458a6ad783a36d99b491544cd136562c5c13422b8fc0",
    "identityFingerprint": "d8e60345ec53840428e7e680bb1692192a4bd31bcab2309ee2be0c3fba487f60",
    "ancestry": [
      "Node To Rust Component Migration"
    ],
    "text": "## 8. Migrate The Next Small Read-Only Proof",
    "sectionText": "## 8. Migrate The Next Small Read-Only Proof\n\nMigrate one more read-only operation before touching state writes."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 4,
    "title": "8. Migrate The Next Small Read-Only Proof",
    "anchor": "8-migrate-the-next-small-read-only-proof",
    "githubAnchor": "8-migrate-the-next-small-read-only-proof",
    "stableAnchor": "h-31261121a610",
    "startLine": 317,
    "endLine": 317,
    "textDigest": "8cd7c8970f107cfb238877ae8d75459f42bbe1add0a35a6bd9aed5545975deb1",
    "sample": "8. Migrate The Next Small Read-Only Proof",
    "sectionPayloadDigest": "7ea0f46cc6d8e9f8af96458a6ad783a36d99b491544cd136562c5c13422b8fc0",
    "followingBlockDigest": "7ea0f46cc6d8e9f8af96458a6ad783a36d99b491544cd136562c5c13422b8fc0",
    "identityFingerprint": "3a5ea1a8a5dbf7aaf9e15c0bc3c01f6b3a7169214fda657fe1e850edc5233a67",
    "ancestry": [
      "Architecture: Node To Rust Migration",
      "Retained selected source material",
      "Node To Rust Component Migration"
    ],
    "text": "#### 8. Migrate The Next Small Read-Only Proof",
    "sectionText": "#### 8. Migrate The Next Small Read-Only Proof\n\nMigrate one more read-only operation before touching state writes."
  }
}
```

## Entry f-188: link-188

```json
{
  "id": "link-188",
  "path": "docs/platform/host-invocation-routing/intent-preservation-ledger.md",
  "inputLine": 90,
  "inputColumn": 267,
  "lineBeforeLinkPass": 98,
  "before": "[rust-cli-and-proof-components-plan.md](../../architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#14-p9-next-native-read)",
  "after": "[rust-cli-and-proof-components-plan.md](roadmap.md#14-p9-next-native-read)",
  "legacyPath": "docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md",
  "target": {
    "path": "docs/platform/host-invocation-routing/roadmap.md",
    "anchor": "14-p9-next-native-read",
    "aliasId": "host-invocation-draft-131"
  },
  "portal": false,
  "area": "host-invocation-routing",
  "reviewStatus": "pending",
  "oldDestination": "../../architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#14-p9-next-native-read",
  "newDestination": "roadmap.md#14-p9-next-native-read",
  "alias": {
    "fromPath": "docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#14-p9-next-native-read",
    "toOwner": "docs/platform/host-invocation-routing/roadmap.md",
    "toAnchor": "14-p9-next-native-read",
    "kind": "redirected",
    "evidenceRef": "plans/260925-documentation-authority-unification/reports/phase-06/review-3-rework-source.md",
    "immutableRefs": [],
    "recordedAt": "2026-10-13",
    "aliasId": "host-invocation-draft-131"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 2,
    "title": "14. P9 — Next Native Read",
    "anchor": "14-p9-next-native-read",
    "githubAnchor": "14-p9-next-native-read",
    "stableAnchor": "h-31d647c3cc7f",
    "startLine": 564,
    "endLine": 564,
    "textDigest": "7c6a82426019f1aa6755e520878d99ca6e41571b6fbce753322deac3160408c7",
    "sample": "14. P9 — Next Native Read",
    "sectionPayloadDigest": "54fed9e16fe589c0e433e2fd0d99752b51015c72030b439f8a22144477e32985",
    "followingBlockDigest": "fe1cd3e68c4ddee018f5eda3345a1819ed8d9adf9bb3cea05dee81f865824b5b",
    "identityFingerprint": "cc2ecbd19ba206f9590e03c59209b902ea8affb22f81ff2453c2a1b9a331d066",
    "ancestry": [
      "Rust Host And Proof Providers Implementation Plan"
    ],
    "text": "## 14. P9 — Next Native Read",
    "sectionText": "## 14. P9 — Next Native Read\n\n`gate-bypass` is a candidate, not a pre-created component. Confirm authority\nand placement first. If selected: freeze precedence/malformed fixtures; port\nonly the read; consume resolved project context; prove zero writes and zero Node\nspawn; flip binding separately from Node deletion. If ownership stays unclear,\nchoose another settled read instead of inventing a component boundary.\n\nThe provider never blocks on human input; a `parked` outcome is the only\nallowed response when human input is needed (matches `ask`/awaiting-human;\n\"Release con người\" law). This applies to P9 and to any later native\nmigration slice.\n\n```sh\nnode --test test/rust-host/gate-bypass-parity.test.mjs\ncargo test --workspace\n```"
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 4,
    "title": "14. P9 — Next Native Read",
    "anchor": "14-p9-next-native-read",
    "githubAnchor": "14-p9-next-native-read",
    "stableAnchor": "h-2f5ee5ea7319",
    "startLine": 881,
    "endLine": 881,
    "textDigest": "ac492f613b9b733b46f8f0e566ea4f839961ee30f3a1dafd97b61be903af14f7",
    "sample": "14. P9 — Next Native Read",
    "sectionPayloadDigest": "47bf55ec0d3c924b25054e6cbc6ed23b0170b04f1584382f97602305b27589f6",
    "followingBlockDigest": "fe1cd3e68c4ddee018f5eda3345a1819ed8d9adf9bb3cea05dee81f865824b5b",
    "identityFingerprint": "2bbdcf9dfb6157811bfc96483f41b4e6704a44c6891d59d3f502f728a97d1e0b",
    "ancestry": [
      "Host Invocation Routing Roadmap",
      "Retained selected source material",
      "Rust Host And Proof Providers Implementation Plan"
    ],
    "text": "#### 14. P9 — Next Native Read",
    "sectionText": "#### 14. P9 — Next Native Read\n\n`gate-bypass` is a candidate, not a pre-created component. Confirm authority\nand placement first. If selected: freeze precedence/malformed fixtures; port\nonly the read; consume resolved project context; prove zero writes and zero Node\nspawn; flip binding separately from Node deletion. If ownership stays unclear,\nchoose another settled read instead of inventing a component boundary.\n\nThe provider never blocks on human input; a `parked` outcome is the only\nallowed response when human input is needed (matches `ask`/awaiting-human;\n\"Release con người\" law). This applies to P9 and to any later native\nmigration slice.\n\n```sh\nnode --test test/rust-host/gate-bypass-parity.test.mjs\ncargo test --workspace\n```\n\n\nAdded in candidate: this retained source detail is carried verbatim in [the dropped-017 restoration](verification/compatibility-harness.md#restored-test-and-review-gates-table).\n\n\n\nAdded in candidate: this retained source detail is carried verbatim in [the dropped-017 restoration](verification/compatibility-harness.md#restored-test-and-review-gates-table)."
  }
}
```

## Entry f-189: link-189

```json
{
  "id": "link-189",
  "path": "docs/platform/host-invocation-routing/intent-preservation-ledger.md",
  "inputLine": 91,
  "inputColumn": 201,
  "lineBeforeLinkPass": 99,
  "before": "[node-to-rust-component-migration.md](../../architect/host-invocation-routing/node-to-rust-component-migration.md#10-migrate-read-models-before-writers)",
  "after": "[node-to-rust-component-migration.md](architecture/node-to-rust-migration.md#10-migrate-read-models-before-writers)",
  "legacyPath": "docs/architect/host-invocation-routing/node-to-rust-component-migration.md",
  "target": {
    "path": "docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md",
    "anchor": "10-migrate-read-models-before-writers",
    "aliasId": "host-invocation-draft-082"
  },
  "portal": false,
  "area": "host-invocation-routing",
  "reviewStatus": "pending",
  "oldDestination": "../../architect/host-invocation-routing/node-to-rust-component-migration.md#10-migrate-read-models-before-writers",
  "newDestination": "architecture/node-to-rust-migration.md#10-migrate-read-models-before-writers",
  "alias": {
    "fromPath": "docs/architect/host-invocation-routing/node-to-rust-component-migration.md#10-migrate-read-models-before-writers",
    "toOwner": "docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md",
    "toAnchor": "10-migrate-read-models-before-writers",
    "kind": "split",
    "evidenceRef": "plans/260925-documentation-authority-unification/reports/phase-06/review-3-rework-source.md",
    "immutableRefs": [],
    "recordedAt": "2026-10-13",
    "aliasId": "host-invocation-draft-082"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 2,
    "title": "10. Migrate Read Models Before Writers",
    "anchor": "10-migrate-read-models-before-writers",
    "githubAnchor": "10-migrate-read-models-before-writers",
    "stableAnchor": "h-90c1ea8c17d9",
    "startLine": 329,
    "endLine": 329,
    "textDigest": "225088240c21859fc36ee71b02c32151f4f19e37a2a17e8539b159561d58f15c",
    "sample": "10. Migrate Read Models Before Writers",
    "sectionPayloadDigest": "c3bf16d84748ff23219b3698da7d6e6ca069c51d4c9e5f686b736b1e99759386",
    "followingBlockDigest": "6820b1ee737ed435ba7664d9983109eb53e943e0c582ca530f2350152cbb475b",
    "identityFingerprint": "716e1bd8edba58043bda80863ea679a6e6580ce041acd0cb4fd3366000fdd35e",
    "ancestry": [
      "Node To Rust Component Migration"
    ],
    "text": "## 10. Migrate Read Models Before Writers",
    "sectionText": "## 10. Migrate Read Models Before Writers\n\nThe next meaningful proof after the small operations should be a Work Lifecycle\nread-side component, potentially the dependencies needed by `ready`.\n\nSequence it internally:\n\n1. event/schema decode fixtures;\n2. deterministic replay fixtures;\n3. domain/stage projection fixtures;\n4. frontier calculation fixtures;\n5. effective claim overlay;\n6. CLI `ready` parity and pagination;\n7. remote semantic parity.\n\nThis creates reusable Rust read models before any event writer moves."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 4,
    "title": "10. Migrate Read Models Before Writers",
    "anchor": "10-migrate-read-models-before-writers",
    "githubAnchor": "10-migrate-read-models-before-writers",
    "stableAnchor": "h-75cabcfa13fc",
    "startLine": 356,
    "endLine": 356,
    "textDigest": "5ae126eab3838fb0b18c1226734b38c22b3674d2b370d9c47193602a09990c6d",
    "sample": "10. Migrate Read Models Before Writers",
    "sectionPayloadDigest": "815d54242da7d57b452a2cf1f0f5d500f63a6ed15a0802a400996349f92605da",
    "followingBlockDigest": "6820b1ee737ed435ba7664d9983109eb53e943e0c582ca530f2350152cbb475b",
    "identityFingerprint": "7e2fd1d7d3739f840464d5e220c90a2d0cd27af492b33457ff226ea65232e728",
    "ancestry": [
      "Architecture: Node To Rust Migration",
      "Retained selected source material",
      "Node To Rust Component Migration"
    ],
    "text": "#### 10. Migrate Read Models Before Writers",
    "sectionText": "#### 10. Migrate Read Models Before Writers\n\nThe next meaningful proof after the small operations should be a Work Lifecycle\nread-side component, potentially the dependencies needed by `ready`.\n\n\nAdded in candidate: this retained source detail is carried verbatim in [the dropped-014 restoration](../contracts/component-protocol.md#restored-per-component-repeat-procedure).\n\n\n\nThis creates reusable Rust read models before any event writer moves."
  }
}
```

## Entry f-190: link-190

```json
{
  "id": "link-190",
  "path": "docs/platform/host-invocation-routing/intent-preservation-ledger.md",
  "inputLine": 91,
  "inputColumn": 355,
  "lineBeforeLinkPass": 99,
  "before": "[node-to-rust-component-migration.md](../../architect/host-invocation-routing/node-to-rust-component-migration.md#11-migrate-state-writing-components)",
  "after": "[node-to-rust-component-migration.md](architecture/node-to-rust-migration.md#11-migrate-state-writing-components)",
  "legacyPath": "docs/architect/host-invocation-routing/node-to-rust-component-migration.md",
  "target": {
    "path": "docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md",
    "anchor": "11-migrate-state-writing-components",
    "aliasId": "host-invocation-draft-083"
  },
  "portal": false,
  "area": "host-invocation-routing",
  "reviewStatus": "pending",
  "oldDestination": "../../architect/host-invocation-routing/node-to-rust-component-migration.md#11-migrate-state-writing-components",
  "newDestination": "architecture/node-to-rust-migration.md#11-migrate-state-writing-components",
  "alias": {
    "fromPath": "docs/architect/host-invocation-routing/node-to-rust-component-migration.md#11-migrate-state-writing-components",
    "toOwner": "docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md",
    "toAnchor": "11-migrate-state-writing-components",
    "kind": "redirected",
    "evidenceRef": "plans/260925-documentation-authority-unification/reports/phase-06/review-3-checkpoint-host-invocation.md",
    "immutableRefs": [],
    "recordedAt": "2026-10-13",
    "aliasId": "host-invocation-draft-083"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 2,
    "title": "11. Migrate State-Writing Components",
    "anchor": "11-migrate-state-writing-components",
    "githubAnchor": "11-migrate-state-writing-components",
    "stableAnchor": "h-61d508d249e9",
    "startLine": 346,
    "endLine": 346,
    "textDigest": "7b1dc142c1f821dc4df9a0cd4f133f31177a6fdd0e040b29e0790abc84052e8e",
    "sample": "11. Migrate State-Writing Components",
    "sectionPayloadDigest": "455e0e9c54bcd83f4b2c52a5516651b61ee7f833faa8e62d51c263e53b528925",
    "followingBlockDigest": "e9835473d73b6c3d47fc137e6ebad193fac1001c314b59ee4e75761ca18a79cd",
    "identityFingerprint": "560def2bc673961b5f5c1629fc55aa3d2a618481255dc3c72f319d7d86ac9742",
    "ancestry": [
      "Node To Rust Component Migration"
    ],
    "text": "## 11. Migrate State-Writing Components",
    "sectionText": "## 11. Migrate State-Writing Components\n\nMove a writer only when all of these are explicit and tested:\n\n- sole authority owner;\n- event/schema version compatibility;\n- lock and concurrency behavior;\n- atomicity and fsync/rename expectations;\n- idempotency and retry policy;\n- crash recovery and partial-write detection;\n- typed error/exit mapping;\n- Node/Rust mutual exclusion during cutover;\n- rollback compatibility with events written by Rust.\n\nNever dual-run a write for shadow comparison. Use fixtures, isolated temp stores,\nand replay equivalence instead."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 4,
    "title": "11. Migrate State-Writing Components",
    "anchor": "11-migrate-state-writing-components",
    "githubAnchor": "11-migrate-state-writing-components",
    "stableAnchor": "h-c4a5f73945e0",
    "startLine": 368,
    "endLine": 368,
    "textDigest": "fbaf5adba0aee1a34d0aab03504ce7a9044da100bdd2645d33a3a9836970fbc8",
    "sample": "11. Migrate State-Writing Components",
    "sectionPayloadDigest": "455e0e9c54bcd83f4b2c52a5516651b61ee7f833faa8e62d51c263e53b528925",
    "followingBlockDigest": "e9835473d73b6c3d47fc137e6ebad193fac1001c314b59ee4e75761ca18a79cd",
    "identityFingerprint": "9aaed1c1f85d746e611ea4deb0d0b66143ca06d71c91fccedd2fc7c9efd744ef",
    "ancestry": [
      "Architecture: Node To Rust Migration",
      "Retained selected source material",
      "Node To Rust Component Migration"
    ],
    "text": "#### 11. Migrate State-Writing Components",
    "sectionText": "#### 11. Migrate State-Writing Components\n\nMove a writer only when all of these are explicit and tested:\n\n- sole authority owner;\n- event/schema version compatibility;\n- lock and concurrency behavior;\n- atomicity and fsync/rename expectations;\n- idempotency and retry policy;\n- crash recovery and partial-write detection;\n- typed error/exit mapping;\n- Node/Rust mutual exclusion during cutover;\n- rollback compatibility with events written by Rust.\n\nNever dual-run a write for shadow comparison. Use fixtures, isolated temp stores,\nand replay equivalence instead."
  }
}
```

## Entry f-191: link-191

```json
{
  "id": "link-191",
  "path": "docs/platform/host-invocation-routing/intent-preservation-ledger.md",
  "inputLine": 92,
  "inputColumn": 175,
  "lineBeforeLinkPass": 100,
  "before": "[node-to-rust-component-migration.md](../../architect/host-invocation-routing/node-to-rust-component-migration.md#12-remove-node)",
  "after": "[node-to-rust-component-migration.md](architecture/node-to-rust-migration.md#12-remove-node)",
  "legacyPath": "docs/architect/host-invocation-routing/node-to-rust-component-migration.md",
  "target": {
    "path": "docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md",
    "anchor": "12-remove-node",
    "aliasId": "host-invocation-draft-084"
  },
  "portal": false,
  "area": "host-invocation-routing",
  "reviewStatus": "pending",
  "oldDestination": "../../architect/host-invocation-routing/node-to-rust-component-migration.md#12-remove-node",
  "newDestination": "architecture/node-to-rust-migration.md#12-remove-node",
  "alias": {
    "fromPath": "docs/architect/host-invocation-routing/node-to-rust-component-migration.md#12-remove-node",
    "toOwner": "docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md",
    "toAnchor": "12-remove-node",
    "kind": "redirected",
    "evidenceRef": "plans/260925-documentation-authority-unification/reports/phase-06/review-3-checkpoint-host-invocation.md",
    "immutableRefs": [],
    "recordedAt": "2026-10-13",
    "aliasId": "host-invocation-draft-084"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 2,
    "title": "12. Remove Node",
    "anchor": "12-remove-node",
    "githubAnchor": "12-remove-node",
    "stableAnchor": "h-1de35bb889fa",
    "startLine": 363,
    "endLine": 363,
    "textDigest": "5be3e11ab7d00af886f2e923efb0224755556f083f20b155c1d9f9da09424e65",
    "sample": "12. Remove Node",
    "sectionPayloadDigest": "39c434d8d52bd59e07e2897e6872e161995b2d34a9a4ccb7bb4957e6cee18d53",
    "followingBlockDigest": "a305db81df6b4bd98349cee02770979561b9ef1565f0cc079b37cd0d94c610fd",
    "identityFingerprint": "3fe4e9f6bbf1783ebbbd86a7d2f82789c9a653de54a2b7f9a1ea219b4492273c",
    "ancestry": [
      "Node To Rust Component Migration"
    ],
    "text": "## 12. Remove Node",
    "sectionText": "## 12. Remove Node\n\nRemove the Node runtime/payload only when:\n\n- no built-in operation routes to the legacy provider;\n- all events written by the final Node version replay correctly in Rust;\n- all public commands and supported hosts pass contract tests;\n- `init`/`doctor` reports no remaining legacy dependency;\n- release rollback no longer depends on shipping Node;\n- obsolete Node facades, manifests, test adapters, and distribution entries are\n  removed in the same cleanup series.\n\nNode removal is a consequence of zero remaining routes, not a calendar target."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 4,
    "title": "12. Remove Node",
    "anchor": "12-remove-node",
    "githubAnchor": "12-remove-node",
    "stableAnchor": "h-c86d8fae403b",
    "startLine": 385,
    "endLine": 385,
    "textDigest": "bac6daca617b6cbaed9052877cd4874069be3f7203a17df5c964b899570e2906",
    "sample": "12. Remove Node",
    "sectionPayloadDigest": "39c434d8d52bd59e07e2897e6872e161995b2d34a9a4ccb7bb4957e6cee18d53",
    "followingBlockDigest": "a305db81df6b4bd98349cee02770979561b9ef1565f0cc079b37cd0d94c610fd",
    "identityFingerprint": "940390c93eaae2bdf330d943faab8ad57a1152d669c4921f602b23a747c560c7",
    "ancestry": [
      "Architecture: Node To Rust Migration",
      "Retained selected source material",
      "Node To Rust Component Migration"
    ],
    "text": "#### 12. Remove Node",
    "sectionText": "#### 12. Remove Node\n\nRemove the Node runtime/payload only when:\n\n- no built-in operation routes to the legacy provider;\n- all events written by the final Node version replay correctly in Rust;\n- all public commands and supported hosts pass contract tests;\n- `init`/`doctor` reports no remaining legacy dependency;\n- release rollback no longer depends on shipping Node;\n- obsolete Node facades, manifests, test adapters, and distribution entries are\n  removed in the same cleanup series.\n\nNode removal is a consequence of zero remaining routes, not a calendar target."
  }
}
```

## Entry f-192: link-192

```json
{
  "id": "link-192",
  "path": "docs/platform/host-invocation-routing/intent-preservation-ledger.md",
  "inputLine": 93,
  "inputColumn": 107,
  "lineBeforeLinkPass": 101,
  "before": "[rust-cli-and-proof-components-plan.md](../../architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#4-delivery-graph)",
  "after": "[rust-cli-and-proof-components-plan.md](roadmap.md#4-delivery-graph)",
  "legacyPath": "docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md",
  "target": {
    "path": "docs/platform/host-invocation-routing/roadmap.md",
    "anchor": "4-delivery-graph",
    "aliasId": "host-invocation-draft-094"
  },
  "portal": false,
  "area": "host-invocation-routing",
  "reviewStatus": "pending",
  "oldDestination": "../../architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#4-delivery-graph",
  "newDestination": "roadmap.md#4-delivery-graph",
  "alias": {
    "fromPath": "docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#4-delivery-graph",
    "toOwner": "docs/platform/host-invocation-routing/roadmap.md",
    "toAnchor": "4-delivery-graph",
    "kind": "redirected",
    "evidenceRef": "plans/260925-documentation-authority-unification/reports/phase-06/review-3-checkpoint-host-invocation.md",
    "immutableRefs": [],
    "recordedAt": "2026-10-13",
    "aliasId": "host-invocation-draft-094"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 2,
    "title": "4. Delivery Graph",
    "anchor": "4-delivery-graph",
    "githubAnchor": "4-delivery-graph",
    "stableAnchor": "h-bff32828b313",
    "startLine": 94,
    "endLine": 94,
    "textDigest": "cfe2388a62b1e42664956e653662871865aaf9cac7d00e58772e2dd9be72d6a7",
    "sample": "4. Delivery Graph",
    "sectionPayloadDigest": "666ee127ceb66f05847eaec94b298d44ac4d0f8405737d0c5251bd5fd18f7b94",
    "followingBlockDigest": "4fdba7fda591e7a2a96599a07ec8a0e894999319ea4447ca991bbcf170042340",
    "identityFingerprint": "1ccc08e4b659218373f5dedb2165975e60a827c2705152919f3bcce7fa8a07ae",
    "ancestry": [
      "Rust Host And Proof Providers Implementation Plan"
    ],
    "text": "## 4. Delivery Graph",
    "sectionText": "## 4. Delivery Graph\n\n```mermaid\nflowchart LR\n    P0[P0 decisions + inventory] --> P1[P1 compatibility harness]\n    P0 --> P2[P2 workspace + artifacts]\n    P1 --> P3[P3 invocation kernel]\n    P2 --> P3\n    P3 --> P4[P4 CLI adapter legacy exec]\n    P3 --> P5[P5 native version]\n    P4 --> P6[P6 distribution + flip]\n    P5 --> P6\n    PK[\"PK: fgctl walking skeleton (packaging stream)\"] --> P6\n    P3 --> P7[P7 external process preview]\n    P5 --> P8[P8 remote native route]\n    P6 --> P9[P9 next native read]\n```\n\nP7 does not block P8 when the first production remote route is native\n`distribution.build.show`.\n\n`PK` is delivered by the packaging stream's own plan\n(`docs/architect/packaging-distribution/`), not this plan; this plan only\nconsumes its interface (see the P0 deliverable in §5 below). `PK` is an\nexternal dependency node, not a new P-package — P-numbering stays P0–P9."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 4,
    "title": "4. Delivery Graph",
    "anchor": "4-delivery-graph",
    "githubAnchor": "4-delivery-graph",
    "stableAnchor": "h-e162b7468710",
    "startLine": 419,
    "endLine": 419,
    "textDigest": "1e40fe54cbe91ed469eb7b4747455577f81714b6113437d781dcf53d687258d4",
    "sample": "4. Delivery Graph",
    "sectionPayloadDigest": "666ee127ceb66f05847eaec94b298d44ac4d0f8405737d0c5251bd5fd18f7b94",
    "followingBlockDigest": "4fdba7fda591e7a2a96599a07ec8a0e894999319ea4447ca991bbcf170042340",
    "identityFingerprint": "92dde8ea615243ebaa616c372158a7408ada064b8d6985ce6d416e0e96d13dbc",
    "ancestry": [
      "Host Invocation Routing Roadmap",
      "Retained selected source material",
      "Rust Host And Proof Providers Implementation Plan"
    ],
    "text": "#### 4. Delivery Graph",
    "sectionText": "#### 4. Delivery Graph\n\n```mermaid\nflowchart LR\n    P0[P0 decisions + inventory] --> P1[P1 compatibility harness]\n    P0 --> P2[P2 workspace + artifacts]\n    P1 --> P3[P3 invocation kernel]\n    P2 --> P3\n    P3 --> P4[P4 CLI adapter legacy exec]\n    P3 --> P5[P5 native version]\n    P4 --> P6[P6 distribution + flip]\n    P5 --> P6\n    PK[\"PK: fgctl walking skeleton (packaging stream)\"] --> P6\n    P3 --> P7[P7 external process preview]\n    P5 --> P8[P8 remote native route]\n    P6 --> P9[P9 next native read]\n```\n\nP7 does not block P8 when the first production remote route is native\n`distribution.build.show`.\n\n`PK` is delivered by the packaging stream's own plan\n(`docs/architect/packaging-distribution/`), not this plan; this plan only\nconsumes its interface (see the P0 deliverable in §5 below). `PK` is an\nexternal dependency node, not a new P-package — P-numbering stays P0–P9."
  }
}
```

## Entry f-193: link-193

```json
{
  "id": "link-193",
  "path": "docs/platform/host-invocation-routing/intent-preservation-ledger.md",
  "inputLine": 94,
  "inputColumn": 111,
  "lineBeforeLinkPass": 102,
  "before": "[rust-cli-and-proof-components-plan.md](../../architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#3-decisions-required-before-r1-execution)",
  "after": "[rust-cli-and-proof-components-plan.md](roadmap.md#3-decisions-required-before-r1-execution)",
  "legacyPath": "docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md",
  "target": {
    "path": "docs/platform/host-invocation-routing/roadmap.md",
    "anchor": "3-decisions-required-before-r1-execution",
    "aliasId": "host-invocation-draft-093"
  },
  "portal": false,
  "area": "host-invocation-routing",
  "reviewStatus": "pending",
  "oldDestination": "../../architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#3-decisions-required-before-r1-execution",
  "newDestination": "roadmap.md#3-decisions-required-before-r1-execution",
  "alias": {
    "fromPath": "docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#3-decisions-required-before-r1-execution",
    "toOwner": "docs/platform/host-invocation-routing/roadmap.md",
    "toAnchor": "3-decisions-required-before-r1-execution",
    "kind": "redirected",
    "evidenceRef": "plans/260925-documentation-authority-unification/reports/phase-06/review-3-rework-source.md",
    "immutableRefs": [],
    "recordedAt": "2026-10-13",
    "aliasId": "host-invocation-draft-093"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 2,
    "title": "3. Decisions Required Before R1 Execution",
    "anchor": "3-decisions-required-before-r1-execution",
    "githubAnchor": "3-decisions-required-before-r1-execution",
    "stableAnchor": "h-5083d23d68fd",
    "startLine": 61,
    "endLine": 61,
    "textDigest": "2c11291e0dae8db873ecf306d203f0d2daeee2ad5b89e686468faa7d185a77e8",
    "sample": "3. Decisions Required Before R1 Execution",
    "sectionPayloadDigest": "993b4be43b7c60a4f4fc7d355a13e8b1fe774f1962ac79913790e4188075aeb2",
    "followingBlockDigest": "32ffceba26aa0249afd1beeb73ab684f5afe328719c0a1c14b43a244f3dab9e8",
    "identityFingerprint": "0636291f9e5d9409b0fd7d1078567a2a4b61d69d2c9733486c4eb076e6e63ec0",
    "ancestry": [
      "Rust Host And Proof Providers Implementation Plan"
    ],
    "text": "## 3. Decisions Required Before R1 Execution",
    "sectionText": "## 3. Decisions Required Before R1 Execution\n\nThese are product/release inputs, not implementation details to guess:\n\n1. supported R1 target matrix;\n2. ~~native archive publication and installation mechanism~~ — settled, see\n   `runtime-identity-and-activation.md` §13 (`fgctl` Rust bootstrap; local\n   path/tarball/GitHub release asset acquisition sources) and §5\n   (content-addressed release store, release tree manifest);\n3. ~~upgrade and rollback channel~~ — settled, see\n   `runtime-identity-and-activation.md` §11 (`fgctl upgrade`/`fgctl repair`\n   pipeline; rollback via `ActivationRecord.previousArtifactDigest` plus the\n   preserved release directory). Compatibility-window duration remains open\n   (carried forward as decision 6 below);\n4. ~~release artifact naming and integrity/checksum policy~~ — settled, see\n   `runtime-identity-and-activation.md` §5 (release tree manifest digest\n   identity, not archive digest) and §11 (quarantine on digest mismatch);\n5. whether the first public R1 is preview or immediate stable default;\n6. compatibility-window duration for R1's Node fallback (§16).\n\nDecision \"whether setup/doctor may ever select or download an upgrade\" is\nclosed: **never**. `fgctl` owns acquisition/upgrade/rollback; local `fgos\ninit` and `fgos doctor --fix` never select or download a release\n(`runtime-identity-and-activation.md` §12, Command Authority Matrix). There is\nno `setup` verb — see the P0 deliverable on inventorying `fgos setup` callers\n(§5).\n\nRecord decisions 1, 5, and 6 in the packaging stream\n(`docs/architect/packaging-distribution/`), which owns install/activation;\n`docs/specs/distribution.md` is regenerated from it later. Local P1–P5 work\nmay proceed; the public entry flip (P6) may not infer these decisions and also\ndepends on the packaging stream's `fgctl` walking skeleton (§4, node `PK`)."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 4,
    "title": "3. Decisions Required Before R1 Execution",
    "anchor": "3-decisions-required-before-r1-execution",
    "githubAnchor": "3-decisions-required-before-r1-execution",
    "stableAnchor": "h-0b76139217b6",
    "startLine": 384,
    "endLine": 384,
    "textDigest": "cbf26e495828da2b590d1d6c244b2cf4cec5fe12f6694b754861a23bb3f8eb72",
    "sample": "3. Decisions Required Before R1 Execution",
    "sectionPayloadDigest": "691bf0f0da9dde0b3dd3d43db3c9cbf7e45c238e2ea4ea76842e03ec3f28f874",
    "followingBlockDigest": "32ffceba26aa0249afd1beeb73ab684f5afe328719c0a1c14b43a244f3dab9e8",
    "identityFingerprint": "de1505c38c1ea36c4f8164a7e23f22d7ee53f9fded410617590a2a665a4bf4c9",
    "ancestry": [
      "Host Invocation Routing Roadmap",
      "Retained selected source material",
      "Rust Host And Proof Providers Implementation Plan"
    ],
    "text": "#### 3. Decisions Required Before R1 Execution",
    "sectionText": "#### 3. Decisions Required Before R1 Execution\n\nThese are product/release inputs, not implementation details to guess:\n\n1. supported R1 target matrix;\n2. ~~native archive publication and installation mechanism~~ — settled, see\n   `runtime-identity-and-activation.md` §13 (`fgctl` Rust bootstrap; local\n   path/tarball/GitHub release asset acquisition sources) and §5\n   (content-addressed release store, release tree manifest);\n3. ~~upgrade and rollback channel~~ — settled, see\n   `runtime-identity-and-activation.md` §11 (`fgctl upgrade`/`fgctl repair`\n   pipeline; rollback via `ActivationRecord.previousArtifactDigest` plus the\n   preserved release directory). Compatibility-window duration remains open\n   (carried forward as decision 6 below);\n4. ~~release artifact naming and integrity/checksum policy~~ — settled, see\n   `runtime-identity-and-activation.md` §5 (release tree manifest digest\n   identity, not archive digest) and §11 (quarantine on digest mismatch);\n5. whether the first public R1 is preview or immediate stable default;\n6. compatibility-window duration for R1's Node fallback (§16).\n\nDecision \"whether setup/doctor may ever select or download an upgrade\" is\nclosed: **never**. `fgctl` owns acquisition/upgrade/rollback; local `fgos\ninit` and `fgos doctor --fix` never select or download a release\n(`runtime-identity-and-activation.md` §12, Command Authority Matrix). There is\nno `setup` verb — see the P0 deliverable on inventorying `fgos setup` callers\n(§5).\n\nAdded in candidate — checked status (2026-10-13): the preceding no-setup sentence is retained historical design wording. `setup` still exists as a legacy compatibility command (`src/cli/command-registry.mjs:1439-1441`, `bin/fgos.mjs:3774`); its compatibility window has not been retired. This note supersedes that sentence as a present-status assertion.\n\nRecord decisions 1, 5, and 6 in the packaging stream\n(`docs/architect/packaging-distribution/`), which owns install/activation;\n`docs/specs/distribution.md` is regenerated from it later. Local P1–P5 work\nmay proceed; the public entry flip (P6) may not infer these decisions and also\ndepends on the packaging stream's `fgctl` walking skeleton (§4, node `PK`)."
  }
}
```

## Entry f-194: link-194

```json
{
  "id": "link-194",
  "path": "docs/platform/host-invocation-routing/roadmap.md",
  "inputLine": 332,
  "inputColumn": 26,
  "lineBeforeLinkPass": 332,
  "before": "[fgOS Component Boundary Advisory](../../architect/component-boundary/component-boundary-advisory.md)",
  "after": "[fgOS Component Boundary Advisory](../component-boundary.md)",
  "legacyPath": "docs/architect/component-boundary/component-boundary-advisory.md",
  "target": {
    "path": "docs/platform/component-boundary.md",
    "anchor": null,
    "aliasId": "step10-whole-system-0212"
  },
  "portal": false,
  "area": "host-invocation-routing",
  "reviewStatus": "pending",
  "oldDestination": "../../architect/component-boundary/component-boundary-advisory.md",
  "newDestination": "../component-boundary.md",
  "alias": {
    "aliasId": "step10-whole-system-0212",
    "fromPath": "docs/architect/component-boundary/component-boundary-advisory.md",
    "toOwner": "docs/platform/component-boundary.md",
    "toAnchor": null,
    "kind": "moved",
    "evidenceRef": "plans/260925-documentation-authority-unification/ledger/area-map-whole-system-architecture.md",
    "immutableRefs": [],
    "recordedAt": "2026-10-15"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "fgOS Component Boundary Advisory",
    "anchor": "fgos-component-boundary-advisory",
    "githubAnchor": "fgos-component-boundary-advisory",
    "stableAnchor": "h-b4d08c193f5a",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "60a53b2e9e95066e9c8aed269a5c87e08f4fdc622d280e3cefcdcf196d1fd66c",
    "sample": "fgOS Component Boundary Advisory",
    "sectionPayloadDigest": "67a1060f9c3ca588a89d2f10b4d096a4bc75c70e03c7276a0aceb30b7f1357d3",
    "followingBlockDigest": "67a1060f9c3ca588a89d2f10b4d096a4bc75c70e03c7276a0aceb30b7f1357d3",
    "identityFingerprint": "37f24753f0eb60feca5ec11df430074eb5675925d327f6ec177abb26891f8f3b",
    "ancestry": [],
    "text": "# fgOS Component Boundary Advisory",
    "sectionText": "# fgOS Component Boundary Advisory\n\nDocument type: Proposal\nDesign status: Discussion / Visionary advisory\nImplementation: N/A\nLast reviewed: 2026-09-01\nCanonical for: nothing; architectural advisory only\nRelated: [Architecture Map](../../architecture-map.md), [System Overview](../../specs/system-overview.md), [Platform Foundations](../../platform-foundations.md), [Domainization Architecture](../domainization/README.md), [Agent Coordination Foundation Vision](../agent-coordination/vision.md), [Concept Relationships](../agent-coordination/vocabulary/concept-relationships.md), [Dispatch Control Plane](../agent-coordination/architecture/dispatch-control-plane.md), [Protocol Model](../agent-coordination/architecture/protocol-model.md), [CoordinationSession Contract](../agent-coordination/contracts/coordination-session.md), [FlowDefinition Contract](../agent-coordination/contracts/flow-definition.md)"
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Component Boundary",
    "anchor": "component-boundary",
    "githubAnchor": "component-boundary",
    "stableAnchor": "h-065adbde00f9",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "725363f18a5458e00b5f7d577e388c99e8f694d6d53f8b93f66fdc5bd2e7bf64",
    "sample": "Component Boundary",
    "sectionPayloadDigest": "28c0f7b6df2717722556d20d85b1eeb533abfc9c055931f92cdd60a7038c3866",
    "followingBlockDigest": "28c0f7b6df2717722556d20d85b1eeb533abfc9c055931f92cdd60a7038c3866",
    "identityFingerprint": "02f5448c9fd944090a0aed56b7e677026868ce524756c7058041d87759a2dd5e",
    "ancestry": [],
    "text": "# Component Boundary",
    "sectionText": "# Component Boundary\n\n```txt\nDocument type: Platform architecture anchor\nAudience: Human reviewer, architect, maintainer, design-shaping agent\nPurpose: Track the whole-system component and authority boundary map\nDesign status: Draft\nImplementation status: Partial\nCanonical: Yes, after review\nOwner: Platform documentation\nSource type: Promoted anchor for docs/architect/component-boundary/**\nLast reviewed: 2026-10-04\nRelated:\n- docs/architect/component-boundary/README.md\n- docs/architect/component-boundary/component-boundary-advisory.md\n- docs/architect/proposals/component-authority-boundary-map.md\n- docs/platform/README.md\nImplementation: Partial\nProvenance: Promoted anchor for docs/architect/component-boundary/**\nWriter type: Original writer attribution not recorded; retained source provenance\nCanonical for: Candidate scope: Track the whole-system component and authority boundary map; authority follows transitional switchboard\nUse this when: Track the whole-system component and authority boundary map\nDo not use this for: Authority beyond the declared scope or implementation truth without the cited verification\nSupersedes: None; legacy sources remain in place during migration\nSuperseded by: None recorded\n```"
  }
}
```

## Entry f-195: link-195

```json
{
  "id": "link-195",
  "path": "docs/platform/host-invocation-routing/roadmap.md",
  "inputLine": 333,
  "inputColumn": 40,
  "lineBeforeLinkPass": 333,
  "before": "[Runtime Identity And Activation](../../architect/packaging-distribution/runtime-identity-and-activation.md)",
  "after": "[Runtime Identity And Activation](../packaging-distribution/README.md)",
  "legacyPath": "docs/architect/packaging-distribution/runtime-identity-and-activation.md",
  "target": {
    "path": "docs/platform/packaging-distribution/README.md",
    "anchor": null,
    "aliasId": "step10-packaging-distribution-0173"
  },
  "portal": false,
  "area": "host-invocation-routing",
  "reviewStatus": "pending",
  "oldDestination": "../../architect/packaging-distribution/runtime-identity-and-activation.md",
  "newDestination": "../packaging-distribution/README.md",
  "alias": {
    "aliasId": "step10-packaging-distribution-0173",
    "fromPath": "docs/architect/packaging-distribution/runtime-identity-and-activation.md",
    "toOwner": "docs/platform/packaging-distribution/README.md",
    "toAnchor": null,
    "kind": "moved",
    "evidenceRef": "plans/260925-documentation-authority-unification/ledger/area-map-packaging-distribution.md",
    "immutableRefs": [],
    "recordedAt": "2026-10-15"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Runtime Identity And Activation",
    "anchor": "runtime-identity-and-activation",
    "githubAnchor": "runtime-identity-and-activation",
    "stableAnchor": "h-4495eac03a0d",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "b0443ae563d60b4c86e1a73c3187615831c3cd8c21cd015488f9e2695a68ac96",
    "sample": "Runtime Identity And Activation",
    "sectionPayloadDigest": "21e896a473b555bbdfa05d0bb9c442cc3aac543bfd21a6a2f74833a27378cf2e",
    "followingBlockDigest": "10091961d72f5052ef0355d73033bdd6e6653df594f6393e50c3e6155bdc0cce",
    "identityFingerprint": "3300d5f2048d641eec60f696285aa4e10335cbe07f08473a7722ed511dc9e2e5",
    "ancestry": [],
    "text": "# Runtime Identity And Activation",
    "sectionText": "# Runtime Identity And Activation\n\n```txt\nLegacy status: Promoted architecture/contract source\nPromoted to:\n- docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md\n- docs/platform/packaging-distribution/contracts/release-manifest.md\n- docs/platform/packaging-distribution/contracts/activation-binding.md\n- docs/platform/packaging-distribution/contracts/distribution-pin.md\nCurrent reader entry: docs/platform/packaging-distribution/README.md\nUse this legacy file for: Source detail until contract extraction is complete\nDo not use this legacy file for: Current implementation status without checking implementation alignment\nLast reviewed: 2026-09-13\n```\n\n> Status: historical redirect. The active promoted runtime docs are\n> [runtime-identity-and-activation.md](../../platform/packaging-distribution/architecture/runtime-identity-and-activation.md),\n> [repository-runtime-layout.md](../../platform/packaging-distribution/contracts/repository-runtime-layout.md),\n> [release-manifest.md](../../platform/packaging-distribution/contracts/release-manifest.md),\n> [activation-binding.md](../../platform/packaging-distribution/contracts/activation-binding.md),\n> [distribution-pin.md](../../platform/packaging-distribution/contracts/distribution-pin.md),\n> and [fgctl-and-local-fgos.md](../../platform/packaging-distribution/architecture/fgctl-and-local-fgos.md).\n> Keep this file only as detailed source context.\n\n**Status:** Historical architecture contract draft.\n**Date:** 2026-09-04.\n**Scope:** Project-local fgOS runtime identity, release records, per-workspace\nactivation binding, pinning, drift, rollback, quarantine, and the minimum\ncommand boundary needed for packaging/distribution and the Rust `fgos` CLI.\n\nThis document was the first contract draft before promotion into\n`docs/platform/packaging-distribution/**`. It deliberately kept shared\ngateway/web as a future constraint, not active delivery scope."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Packaging-Distribution",
    "anchor": "packaging-distribution",
    "githubAnchor": "packaging-distribution",
    "stableAnchor": "h-1afc4b2f4e45",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "19e5e05abf531948c54037d55341d63daf7e1a062c251385fd0744ce382d3d26",
    "sample": "Packaging-Distribution",
    "sectionPayloadDigest": "a4a861e4a929e4736d0173ccf2771dfa399e00097cadcf6875d30c8598d57cf7",
    "followingBlockDigest": "a4a861e4a929e4736d0173ccf2771dfa399e00097cadcf6875d30c8598d57cf7",
    "identityFingerprint": "b081e84a2821799ef3f35b3656452ed95b36b563ba76fc87957f39ab635a51c8",
    "ancestry": [],
    "text": "# Packaging-Distribution",
    "sectionText": "# Packaging-Distribution\n\n```txt\nDocument type: Area portal\nAudience: Human reviewer, maintainer, architecture collaborator, implementation agent\nPurpose: Route readers through fgOS packaging, install, runtime activation, doctor/repair, and release docs\nDesign status: Draft\nImplementation status: Implemented preview plus tracked partials\nCanonical: Yes, after review\nOwner: Platform documentation\nSource type: Promoted from docs/specs/distribution.md, docs/distribution-vision.md, and docs/architect/packaging-distribution/**\nLast reviewed: 2026-09-18\nRelated:\n- docs/platform/packaging-distribution/vision.md\n- docs/platform/packaging-distribution/spec.md\n- docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md\n- docs/platform/packaging-distribution/contracts/repository-runtime-layout.md\n- docs/platform/packaging-distribution/contracts/setup-doctor-registry.md\n- docs/platform/packaging-distribution/contracts/instruction-composition-and-projection.md\n- docs/platform/packaging-distribution/contracts/skill-package-distribution.md\n- docs/platform/packaging-distribution/verification/implementation-alignment.md\n- docs/platform/packaging-distribution/verification/source-preservation-audit.md\n- docs/platform/packaging-distribution/code-panel-rollout-plan.md\nImplementation: Original section-specific implementation statements retained; carriage is pending independent review\nProvenance: Existing area document plus source-detail carriage at 77830ba77eb05991d95b005919776ee6254e833b\nWriter type: Human + agent coauthor\nCanonical for: The topic stated by this document, subject to the unchanged switchboard route and independent review\nUse this when: Reading this area topic and its retained design details\nDo not use this for: Claiming a truth review or an authority cutover from carriage alone\nSupersedes: No authority transition in this carriage pass\nSuperseded by: None recorded\n```"
  }
}
```

## Entry f-196: link-196

```json
{
  "id": "link-196",
  "path": "docs/platform/host-invocation-routing/spec.md",
  "inputLine": 299,
  "inputColumn": 430,
  "lineBeforeLinkPass": 307,
  "before": "[Runtime Identity And Activation](../../architect/packaging-distribution/runtime-identity-and-activation.md)",
  "after": "[Runtime Identity And Activation](../packaging-distribution/README.md)",
  "legacyPath": "docs/architect/packaging-distribution/runtime-identity-and-activation.md",
  "target": {
    "path": "docs/platform/packaging-distribution/README.md",
    "anchor": null,
    "aliasId": "step10-packaging-distribution-0173"
  },
  "portal": false,
  "area": "host-invocation-routing",
  "reviewStatus": "pending",
  "oldDestination": "../../architect/packaging-distribution/runtime-identity-and-activation.md",
  "newDestination": "../packaging-distribution/README.md",
  "alias": {
    "aliasId": "step10-packaging-distribution-0173",
    "fromPath": "docs/architect/packaging-distribution/runtime-identity-and-activation.md",
    "toOwner": "docs/platform/packaging-distribution/README.md",
    "toAnchor": null,
    "kind": "moved",
    "evidenceRef": "plans/260925-documentation-authority-unification/ledger/area-map-packaging-distribution.md",
    "immutableRefs": [],
    "recordedAt": "2026-10-15"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Runtime Identity And Activation",
    "anchor": "runtime-identity-and-activation",
    "githubAnchor": "runtime-identity-and-activation",
    "stableAnchor": "h-4495eac03a0d",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "b0443ae563d60b4c86e1a73c3187615831c3cd8c21cd015488f9e2695a68ac96",
    "sample": "Runtime Identity And Activation",
    "sectionPayloadDigest": "21e896a473b555bbdfa05d0bb9c442cc3aac543bfd21a6a2f74833a27378cf2e",
    "followingBlockDigest": "10091961d72f5052ef0355d73033bdd6e6653df594f6393e50c3e6155bdc0cce",
    "identityFingerprint": "3300d5f2048d641eec60f696285aa4e10335cbe07f08473a7722ed511dc9e2e5",
    "ancestry": [],
    "text": "# Runtime Identity And Activation",
    "sectionText": "# Runtime Identity And Activation\n\n```txt\nLegacy status: Promoted architecture/contract source\nPromoted to:\n- docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md\n- docs/platform/packaging-distribution/contracts/release-manifest.md\n- docs/platform/packaging-distribution/contracts/activation-binding.md\n- docs/platform/packaging-distribution/contracts/distribution-pin.md\nCurrent reader entry: docs/platform/packaging-distribution/README.md\nUse this legacy file for: Source detail until contract extraction is complete\nDo not use this legacy file for: Current implementation status without checking implementation alignment\nLast reviewed: 2026-09-13\n```\n\n> Status: historical redirect. The active promoted runtime docs are\n> [runtime-identity-and-activation.md](../../platform/packaging-distribution/architecture/runtime-identity-and-activation.md),\n> [repository-runtime-layout.md](../../platform/packaging-distribution/contracts/repository-runtime-layout.md),\n> [release-manifest.md](../../platform/packaging-distribution/contracts/release-manifest.md),\n> [activation-binding.md](../../platform/packaging-distribution/contracts/activation-binding.md),\n> [distribution-pin.md](../../platform/packaging-distribution/contracts/distribution-pin.md),\n> and [fgctl-and-local-fgos.md](../../platform/packaging-distribution/architecture/fgctl-and-local-fgos.md).\n> Keep this file only as detailed source context.\n\n**Status:** Historical architecture contract draft.\n**Date:** 2026-09-04.\n**Scope:** Project-local fgOS runtime identity, release records, per-workspace\nactivation binding, pinning, drift, rollback, quarantine, and the minimum\ncommand boundary needed for packaging/distribution and the Rust `fgos` CLI.\n\nThis document was the first contract draft before promotion into\n`docs/platform/packaging-distribution/**`. It deliberately kept shared\ngateway/web as a future constraint, not active delivery scope."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Packaging-Distribution",
    "anchor": "packaging-distribution",
    "githubAnchor": "packaging-distribution",
    "stableAnchor": "h-1afc4b2f4e45",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "19e5e05abf531948c54037d55341d63daf7e1a062c251385fd0744ce382d3d26",
    "sample": "Packaging-Distribution",
    "sectionPayloadDigest": "a4a861e4a929e4736d0173ccf2771dfa399e00097cadcf6875d30c8598d57cf7",
    "followingBlockDigest": "a4a861e4a929e4736d0173ccf2771dfa399e00097cadcf6875d30c8598d57cf7",
    "identityFingerprint": "b081e84a2821799ef3f35b3656452ed95b36b563ba76fc87957f39ab635a51c8",
    "ancestry": [],
    "text": "# Packaging-Distribution",
    "sectionText": "# Packaging-Distribution\n\n```txt\nDocument type: Area portal\nAudience: Human reviewer, maintainer, architecture collaborator, implementation agent\nPurpose: Route readers through fgOS packaging, install, runtime activation, doctor/repair, and release docs\nDesign status: Draft\nImplementation status: Implemented preview plus tracked partials\nCanonical: Yes, after review\nOwner: Platform documentation\nSource type: Promoted from docs/specs/distribution.md, docs/distribution-vision.md, and docs/architect/packaging-distribution/**\nLast reviewed: 2026-09-18\nRelated:\n- docs/platform/packaging-distribution/vision.md\n- docs/platform/packaging-distribution/spec.md\n- docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md\n- docs/platform/packaging-distribution/contracts/repository-runtime-layout.md\n- docs/platform/packaging-distribution/contracts/setup-doctor-registry.md\n- docs/platform/packaging-distribution/contracts/instruction-composition-and-projection.md\n- docs/platform/packaging-distribution/contracts/skill-package-distribution.md\n- docs/platform/packaging-distribution/verification/implementation-alignment.md\n- docs/platform/packaging-distribution/verification/source-preservation-audit.md\n- docs/platform/packaging-distribution/code-panel-rollout-plan.md\nImplementation: Original section-specific implementation statements retained; carriage is pending independent review\nProvenance: Existing area document plus source-detail carriage at 77830ba77eb05991d95b005919776ee6254e833b\nWriter type: Human + agent coauthor\nCanonical for: The topic stated by this document, subject to the unchanged switchboard route and independent review\nUse this when: Reading this area topic and its retained design details\nDo not use this for: Claiming a truth review or an authority cutover from carriage alone\nSupersedes: No authority transition in this carriage pass\nSuperseded by: None recorded\n```"
  }
}
```

## Entry f-197: link-197

```json
{
  "id": "link-197",
  "path": "docs/platform/host-invocation-routing/spec.md",
  "inputLine": 307,
  "inputColumn": 464,
  "lineBeforeLinkPass": 315,
  "before": "[Future Constraints](../../architect/packaging-distribution/future-constraints.md)",
  "after": "[Future Constraints](../packaging-distribution/architecture/future-constraints.md)",
  "legacyPath": "docs/architect/packaging-distribution/future-constraints.md",
  "target": {
    "path": "docs/platform/packaging-distribution/architecture/future-constraints.md",
    "anchor": null,
    "aliasId": "step10-packaging-distribution-0031"
  },
  "portal": false,
  "area": "host-invocation-routing",
  "reviewStatus": "pending",
  "oldDestination": "../../architect/packaging-distribution/future-constraints.md",
  "newDestination": "../packaging-distribution/architecture/future-constraints.md",
  "alias": {
    "aliasId": "step10-packaging-distribution-0031",
    "fromPath": "docs/architect/packaging-distribution/future-constraints.md",
    "toOwner": "docs/platform/packaging-distribution/architecture/future-constraints.md",
    "toAnchor": null,
    "kind": "moved",
    "evidenceRef": "plans/260925-documentation-authority-unification/ledger/area-map-packaging-distribution.md",
    "immutableRefs": [],
    "recordedAt": "2026-10-15"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Future Constraints: Shared Gateway, Adapter, And Substrate",
    "anchor": "future-constraints-shared-gateway-adapter-and-substrate",
    "githubAnchor": "future-constraints-shared-gateway-adapter-and-substrate",
    "stableAnchor": "h-3c7b788d9413",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "8e8989079b3334c4b5f18b4d65d6170587d5ce58237c13d594696555b676ce23",
    "sample": "Future Constraints: Shared Gateway, Adapter, And Substrate",
    "sectionPayloadDigest": "db766abc51ea4be4a49546700704f911d302d67abf73eb2bb7d169d763edc5f9",
    "followingBlockDigest": "b1987634dd036c1680d0e450860fe7bc03dd35cc7039c120e83068cae5a3fefb",
    "identityFingerprint": "12ccc2c626845f51bc691a54f2e98aef6ebda66a1d2921ada717dc241131e585",
    "ancestry": [],
    "text": "# Future Constraints: Shared Gateway, Adapter, And Substrate",
    "sectionText": "# Future Constraints: Shared Gateway, Adapter, And Substrate\n\n```txt\nLegacy status: Promoted architecture source\nPromoted to: docs/platform/packaging-distribution/architecture/future-constraints.md\nCurrent reader entry: docs/platform/packaging-distribution/README.md\nUse this legacy file for: Original future-constraints source\nDo not use this legacy file for: Current canonical navigation\nLast reviewed: 2026-09-13\n```\n\n> Status: historical redirect. The active promoted future-constraints document is\n> [docs/platform/packaging-distribution/architecture/future-constraints.md](../../platform/packaging-distribution/architecture/future-constraints.md).\n> Keep this file only as discussion-era source context.\n\n**Status:** Historical future-constraints source, not active delivery scope.\n**Date:** 2026-09-04.\n\nThe promoted delivery target is packaging/distribution correctness and Rust\n`fgos` CLI readiness. Shared web/gateway and MCP/substrate work should still\nnot be implemented from this historical file. The active constraint text lives\nin [docs/platform/packaging-distribution/architecture/future-constraints.md](../../platform/packaging-distribution/architecture/future-constraints.md)."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Future Constraints",
    "anchor": "future-constraints",
    "githubAnchor": "future-constraints",
    "stableAnchor": "h-cb9610a3a58e",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "2911b40f830853fafd27cf1d816738ad181d1f49643aeedbea88e29a8a572e7a",
    "sample": "Future Constraints",
    "sectionPayloadDigest": "49c8b79cd9a353442793d9d6cfe82424ad1d6b660613801eedd956fa09560661",
    "followingBlockDigest": "49c8b79cd9a353442793d9d6cfe82424ad1d6b660613801eedd956fa09560661",
    "identityFingerprint": "6d8d7500edfd533ec9e64eb4a6a2883b6fbf3c223f66402339d8bdf1cc75c8e4",
    "ancestry": [],
    "text": "# Future Constraints",
    "sectionText": "# Future Constraints\n\n```txt\nDocument type: Architecture\nAudience: Architect, maintainer, implementation agent\nPurpose: Preserve future constraints that packaging-distribution must not block\nDesign status: Draft\nImplementation status: Planned\nCanonical: Yes, after review\nOwner: Platform documentation\nSource type: Promoted from docs/architect/packaging-distribution/future-constraints.md\nLast reviewed: 2026-09-13\nRelated:\n- docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md\nImplementation: Original section-specific implementation statements retained; carriage is pending independent review\nProvenance: Existing area document plus source-detail carriage at 77830ba77eb05991d95b005919776ee6254e833b\nWriter type: Human + agent coauthor\nCanonical for: The topic stated by this document, subject to the unchanged switchboard route and independent review\nUse this when: Reading this area topic and its retained design details\nDo not use this for: Claiming a truth review or an authority cutover from carriage alone\nSupersedes: No authority transition in this carriage pass\nSuperseded by: None recorded\n```"
  }
}
```

## Entry f-198: link-198

```json
{
  "id": "link-198",
  "path": "docs/platform/host-invocation-routing/spec.md",
  "inputLine": 319,
  "inputColumn": 90,
  "lineBeforeLinkPass": 327,
  "before": "[Runtime Identity And Activation](../../architect/packaging-distribution/runtime-identity-and-activation.md)",
  "after": "[Runtime Identity And Activation](../packaging-distribution/README.md)",
  "legacyPath": "docs/architect/packaging-distribution/runtime-identity-and-activation.md",
  "target": {
    "path": "docs/platform/packaging-distribution/README.md",
    "anchor": null,
    "aliasId": "step10-packaging-distribution-0173"
  },
  "portal": false,
  "area": "host-invocation-routing",
  "reviewStatus": "pending",
  "oldDestination": "../../architect/packaging-distribution/runtime-identity-and-activation.md",
  "newDestination": "../packaging-distribution/README.md",
  "alias": {
    "aliasId": "step10-packaging-distribution-0173",
    "fromPath": "docs/architect/packaging-distribution/runtime-identity-and-activation.md",
    "toOwner": "docs/platform/packaging-distribution/README.md",
    "toAnchor": null,
    "kind": "moved",
    "evidenceRef": "plans/260925-documentation-authority-unification/ledger/area-map-packaging-distribution.md",
    "immutableRefs": [],
    "recordedAt": "2026-10-15"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Runtime Identity And Activation",
    "anchor": "runtime-identity-and-activation",
    "githubAnchor": "runtime-identity-and-activation",
    "stableAnchor": "h-4495eac03a0d",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "b0443ae563d60b4c86e1a73c3187615831c3cd8c21cd015488f9e2695a68ac96",
    "sample": "Runtime Identity And Activation",
    "sectionPayloadDigest": "21e896a473b555bbdfa05d0bb9c442cc3aac543bfd21a6a2f74833a27378cf2e",
    "followingBlockDigest": "10091961d72f5052ef0355d73033bdd6e6653df594f6393e50c3e6155bdc0cce",
    "identityFingerprint": "3300d5f2048d641eec60f696285aa4e10335cbe07f08473a7722ed511dc9e2e5",
    "ancestry": [],
    "text": "# Runtime Identity And Activation",
    "sectionText": "# Runtime Identity And Activation\n\n```txt\nLegacy status: Promoted architecture/contract source\nPromoted to:\n- docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md\n- docs/platform/packaging-distribution/contracts/release-manifest.md\n- docs/platform/packaging-distribution/contracts/activation-binding.md\n- docs/platform/packaging-distribution/contracts/distribution-pin.md\nCurrent reader entry: docs/platform/packaging-distribution/README.md\nUse this legacy file for: Source detail until contract extraction is complete\nDo not use this legacy file for: Current implementation status without checking implementation alignment\nLast reviewed: 2026-09-13\n```\n\n> Status: historical redirect. The active promoted runtime docs are\n> [runtime-identity-and-activation.md](../../platform/packaging-distribution/architecture/runtime-identity-and-activation.md),\n> [repository-runtime-layout.md](../../platform/packaging-distribution/contracts/repository-runtime-layout.md),\n> [release-manifest.md](../../platform/packaging-distribution/contracts/release-manifest.md),\n> [activation-binding.md](../../platform/packaging-distribution/contracts/activation-binding.md),\n> [distribution-pin.md](../../platform/packaging-distribution/contracts/distribution-pin.md),\n> and [fgctl-and-local-fgos.md](../../platform/packaging-distribution/architecture/fgctl-and-local-fgos.md).\n> Keep this file only as detailed source context.\n\n**Status:** Historical architecture contract draft.\n**Date:** 2026-09-04.\n**Scope:** Project-local fgOS runtime identity, release records, per-workspace\nactivation binding, pinning, drift, rollback, quarantine, and the minimum\ncommand boundary needed for packaging/distribution and the Rust `fgos` CLI.\n\nThis document was the first contract draft before promotion into\n`docs/platform/packaging-distribution/**`. It deliberately kept shared\ngateway/web as a future constraint, not active delivery scope."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Packaging-Distribution",
    "anchor": "packaging-distribution",
    "githubAnchor": "packaging-distribution",
    "stableAnchor": "h-1afc4b2f4e45",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "19e5e05abf531948c54037d55341d63daf7e1a062c251385fd0744ce382d3d26",
    "sample": "Packaging-Distribution",
    "sectionPayloadDigest": "a4a861e4a929e4736d0173ccf2771dfa399e00097cadcf6875d30c8598d57cf7",
    "followingBlockDigest": "a4a861e4a929e4736d0173ccf2771dfa399e00097cadcf6875d30c8598d57cf7",
    "identityFingerprint": "b081e84a2821799ef3f35b3656452ed95b36b563ba76fc87957f39ab635a51c8",
    "ancestry": [],
    "text": "# Packaging-Distribution",
    "sectionText": "# Packaging-Distribution\n\n```txt\nDocument type: Area portal\nAudience: Human reviewer, maintainer, architecture collaborator, implementation agent\nPurpose: Route readers through fgOS packaging, install, runtime activation, doctor/repair, and release docs\nDesign status: Draft\nImplementation status: Implemented preview plus tracked partials\nCanonical: Yes, after review\nOwner: Platform documentation\nSource type: Promoted from docs/specs/distribution.md, docs/distribution-vision.md, and docs/architect/packaging-distribution/**\nLast reviewed: 2026-09-18\nRelated:\n- docs/platform/packaging-distribution/vision.md\n- docs/platform/packaging-distribution/spec.md\n- docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md\n- docs/platform/packaging-distribution/contracts/repository-runtime-layout.md\n- docs/platform/packaging-distribution/contracts/setup-doctor-registry.md\n- docs/platform/packaging-distribution/contracts/instruction-composition-and-projection.md\n- docs/platform/packaging-distribution/contracts/skill-package-distribution.md\n- docs/platform/packaging-distribution/verification/implementation-alignment.md\n- docs/platform/packaging-distribution/verification/source-preservation-audit.md\n- docs/platform/packaging-distribution/code-panel-rollout-plan.md\nImplementation: Original section-specific implementation statements retained; carriage is pending independent review\nProvenance: Existing area document plus source-detail carriage at 77830ba77eb05991d95b005919776ee6254e833b\nWriter type: Human + agent coauthor\nCanonical for: The topic stated by this document, subject to the unchanged switchboard route and independent review\nUse this when: Reading this area topic and its retained design details\nDo not use this for: Claiming a truth review or an authority cutover from carriage alone\nSupersedes: No authority transition in this carriage pass\nSuperseded by: None recorded\n```"
  }
}
```

## Entry f-199: link-199

```json
{
  "id": "link-199",
  "path": "docs/platform/host-invocation-routing/spec.md",
  "inputLine": 327,
  "inputColumn": 3,
  "lineBeforeLinkPass": 335,
  "before": "[Component Boundary Advisory](../../architect/component-boundary/component-boundary-advisory.md)",
  "after": "[Component Boundary Advisory](../component-boundary.md)",
  "legacyPath": "docs/architect/component-boundary/component-boundary-advisory.md",
  "target": {
    "path": "docs/platform/component-boundary.md",
    "anchor": null,
    "aliasId": "step10-whole-system-0212"
  },
  "portal": false,
  "area": "host-invocation-routing",
  "reviewStatus": "pending",
  "oldDestination": "../../architect/component-boundary/component-boundary-advisory.md",
  "newDestination": "../component-boundary.md",
  "alias": {
    "aliasId": "step10-whole-system-0212",
    "fromPath": "docs/architect/component-boundary/component-boundary-advisory.md",
    "toOwner": "docs/platform/component-boundary.md",
    "toAnchor": null,
    "kind": "moved",
    "evidenceRef": "plans/260925-documentation-authority-unification/ledger/area-map-whole-system-architecture.md",
    "immutableRefs": [],
    "recordedAt": "2026-10-15"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "fgOS Component Boundary Advisory",
    "anchor": "fgos-component-boundary-advisory",
    "githubAnchor": "fgos-component-boundary-advisory",
    "stableAnchor": "h-b4d08c193f5a",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "60a53b2e9e95066e9c8aed269a5c87e08f4fdc622d280e3cefcdcf196d1fd66c",
    "sample": "fgOS Component Boundary Advisory",
    "sectionPayloadDigest": "67a1060f9c3ca588a89d2f10b4d096a4bc75c70e03c7276a0aceb30b7f1357d3",
    "followingBlockDigest": "67a1060f9c3ca588a89d2f10b4d096a4bc75c70e03c7276a0aceb30b7f1357d3",
    "identityFingerprint": "37f24753f0eb60feca5ec11df430074eb5675925d327f6ec177abb26891f8f3b",
    "ancestry": [],
    "text": "# fgOS Component Boundary Advisory",
    "sectionText": "# fgOS Component Boundary Advisory\n\nDocument type: Proposal\nDesign status: Discussion / Visionary advisory\nImplementation: N/A\nLast reviewed: 2026-09-01\nCanonical for: nothing; architectural advisory only\nRelated: [Architecture Map](../../architecture-map.md), [System Overview](../../specs/system-overview.md), [Platform Foundations](../../platform-foundations.md), [Domainization Architecture](../domainization/README.md), [Agent Coordination Foundation Vision](../agent-coordination/vision.md), [Concept Relationships](../agent-coordination/vocabulary/concept-relationships.md), [Dispatch Control Plane](../agent-coordination/architecture/dispatch-control-plane.md), [Protocol Model](../agent-coordination/architecture/protocol-model.md), [CoordinationSession Contract](../agent-coordination/contracts/coordination-session.md), [FlowDefinition Contract](../agent-coordination/contracts/flow-definition.md)"
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Component Boundary",
    "anchor": "component-boundary",
    "githubAnchor": "component-boundary",
    "stableAnchor": "h-065adbde00f9",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "725363f18a5458e00b5f7d577e388c99e8f694d6d53f8b93f66fdc5bd2e7bf64",
    "sample": "Component Boundary",
    "sectionPayloadDigest": "28c0f7b6df2717722556d20d85b1eeb533abfc9c055931f92cdd60a7038c3866",
    "followingBlockDigest": "28c0f7b6df2717722556d20d85b1eeb533abfc9c055931f92cdd60a7038c3866",
    "identityFingerprint": "02f5448c9fd944090a0aed56b7e677026868ce524756c7058041d87759a2dd5e",
    "ancestry": [],
    "text": "# Component Boundary",
    "sectionText": "# Component Boundary\n\n```txt\nDocument type: Platform architecture anchor\nAudience: Human reviewer, architect, maintainer, design-shaping agent\nPurpose: Track the whole-system component and authority boundary map\nDesign status: Draft\nImplementation status: Partial\nCanonical: Yes, after review\nOwner: Platform documentation\nSource type: Promoted anchor for docs/architect/component-boundary/**\nLast reviewed: 2026-10-04\nRelated:\n- docs/architect/component-boundary/README.md\n- docs/architect/component-boundary/component-boundary-advisory.md\n- docs/architect/proposals/component-authority-boundary-map.md\n- docs/platform/README.md\nImplementation: Partial\nProvenance: Promoted anchor for docs/architect/component-boundary/**\nWriter type: Original writer attribution not recorded; retained source provenance\nCanonical for: Candidate scope: Track the whole-system component and authority boundary map; authority follows transitional switchboard\nUse this when: Track the whole-system component and authority boundary map\nDo not use this for: Authority beyond the declared scope or implementation truth without the cited verification\nSupersedes: None; legacy sources remain in place during migration\nSuperseded by: None recorded\n```"
  }
}
```

## Entry f-200: link-200

```json
{
  "id": "link-200",
  "path": "docs/platform/host-invocation-routing/spec.md",
  "inputLine": 328,
  "inputColumn": 3,
  "lineBeforeLinkPass": 336,
  "before": "[Runtime Identity And Activation](../../architect/packaging-distribution/runtime-identity-and-activation.md)",
  "after": "[Runtime Identity And Activation](../packaging-distribution/README.md)",
  "legacyPath": "docs/architect/packaging-distribution/runtime-identity-and-activation.md",
  "target": {
    "path": "docs/platform/packaging-distribution/README.md",
    "anchor": null,
    "aliasId": "step10-packaging-distribution-0173"
  },
  "portal": false,
  "area": "host-invocation-routing",
  "reviewStatus": "pending",
  "oldDestination": "../../architect/packaging-distribution/runtime-identity-and-activation.md",
  "newDestination": "../packaging-distribution/README.md",
  "alias": {
    "aliasId": "step10-packaging-distribution-0173",
    "fromPath": "docs/architect/packaging-distribution/runtime-identity-and-activation.md",
    "toOwner": "docs/platform/packaging-distribution/README.md",
    "toAnchor": null,
    "kind": "moved",
    "evidenceRef": "plans/260925-documentation-authority-unification/ledger/area-map-packaging-distribution.md",
    "immutableRefs": [],
    "recordedAt": "2026-10-15"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Runtime Identity And Activation",
    "anchor": "runtime-identity-and-activation",
    "githubAnchor": "runtime-identity-and-activation",
    "stableAnchor": "h-4495eac03a0d",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "b0443ae563d60b4c86e1a73c3187615831c3cd8c21cd015488f9e2695a68ac96",
    "sample": "Runtime Identity And Activation",
    "sectionPayloadDigest": "21e896a473b555bbdfa05d0bb9c442cc3aac543bfd21a6a2f74833a27378cf2e",
    "followingBlockDigest": "10091961d72f5052ef0355d73033bdd6e6653df594f6393e50c3e6155bdc0cce",
    "identityFingerprint": "3300d5f2048d641eec60f696285aa4e10335cbe07f08473a7722ed511dc9e2e5",
    "ancestry": [],
    "text": "# Runtime Identity And Activation",
    "sectionText": "# Runtime Identity And Activation\n\n```txt\nLegacy status: Promoted architecture/contract source\nPromoted to:\n- docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md\n- docs/platform/packaging-distribution/contracts/release-manifest.md\n- docs/platform/packaging-distribution/contracts/activation-binding.md\n- docs/platform/packaging-distribution/contracts/distribution-pin.md\nCurrent reader entry: docs/platform/packaging-distribution/README.md\nUse this legacy file for: Source detail until contract extraction is complete\nDo not use this legacy file for: Current implementation status without checking implementation alignment\nLast reviewed: 2026-09-13\n```\n\n> Status: historical redirect. The active promoted runtime docs are\n> [runtime-identity-and-activation.md](../../platform/packaging-distribution/architecture/runtime-identity-and-activation.md),\n> [repository-runtime-layout.md](../../platform/packaging-distribution/contracts/repository-runtime-layout.md),\n> [release-manifest.md](../../platform/packaging-distribution/contracts/release-manifest.md),\n> [activation-binding.md](../../platform/packaging-distribution/contracts/activation-binding.md),\n> [distribution-pin.md](../../platform/packaging-distribution/contracts/distribution-pin.md),\n> and [fgctl-and-local-fgos.md](../../platform/packaging-distribution/architecture/fgctl-and-local-fgos.md).\n> Keep this file only as detailed source context.\n\n**Status:** Historical architecture contract draft.\n**Date:** 2026-09-04.\n**Scope:** Project-local fgOS runtime identity, release records, per-workspace\nactivation binding, pinning, drift, rollback, quarantine, and the minimum\ncommand boundary needed for packaging/distribution and the Rust `fgos` CLI.\n\nThis document was the first contract draft before promotion into\n`docs/platform/packaging-distribution/**`. It deliberately kept shared\ngateway/web as a future constraint, not active delivery scope."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Packaging-Distribution",
    "anchor": "packaging-distribution",
    "githubAnchor": "packaging-distribution",
    "stableAnchor": "h-1afc4b2f4e45",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "19e5e05abf531948c54037d55341d63daf7e1a062c251385fd0744ce382d3d26",
    "sample": "Packaging-Distribution",
    "sectionPayloadDigest": "a4a861e4a929e4736d0173ccf2771dfa399e00097cadcf6875d30c8598d57cf7",
    "followingBlockDigest": "a4a861e4a929e4736d0173ccf2771dfa399e00097cadcf6875d30c8598d57cf7",
    "identityFingerprint": "b081e84a2821799ef3f35b3656452ed95b36b563ba76fc87957f39ab635a51c8",
    "ancestry": [],
    "text": "# Packaging-Distribution",
    "sectionText": "# Packaging-Distribution\n\n```txt\nDocument type: Area portal\nAudience: Human reviewer, maintainer, architecture collaborator, implementation agent\nPurpose: Route readers through fgOS packaging, install, runtime activation, doctor/repair, and release docs\nDesign status: Draft\nImplementation status: Implemented preview plus tracked partials\nCanonical: Yes, after review\nOwner: Platform documentation\nSource type: Promoted from docs/specs/distribution.md, docs/distribution-vision.md, and docs/architect/packaging-distribution/**\nLast reviewed: 2026-09-18\nRelated:\n- docs/platform/packaging-distribution/vision.md\n- docs/platform/packaging-distribution/spec.md\n- docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md\n- docs/platform/packaging-distribution/contracts/repository-runtime-layout.md\n- docs/platform/packaging-distribution/contracts/setup-doctor-registry.md\n- docs/platform/packaging-distribution/contracts/instruction-composition-and-projection.md\n- docs/platform/packaging-distribution/contracts/skill-package-distribution.md\n- docs/platform/packaging-distribution/verification/implementation-alignment.md\n- docs/platform/packaging-distribution/verification/source-preservation-audit.md\n- docs/platform/packaging-distribution/code-panel-rollout-plan.md\nImplementation: Original section-specific implementation statements retained; carriage is pending independent review\nProvenance: Existing area document plus source-detail carriage at 77830ba77eb05991d95b005919776ee6254e833b\nWriter type: Human + agent coauthor\nCanonical for: The topic stated by this document, subject to the unchanged switchboard route and independent review\nUse this when: Reading this area topic and its retained design details\nDo not use this for: Claiming a truth review or an authority cutover from carriage alone\nSupersedes: No authority transition in this carriage pass\nSuperseded by: None recorded\n```"
  }
}
```

## Entry f-201: link-201

```json
{
  "id": "link-201",
  "path": "docs/platform/host-invocation-routing/verification/compatibility-harness.md",
  "inputLine": 46,
  "inputColumn": 17,
  "lineBeforeLinkPass": 54,
  "before": "[../../../architect/host-invocation-routing/rust-cli-and-proof-components-plan.md](../../../architect/host-invocation-routing/rust-cli-and-proof-components-plan.md)",
  "after": "[../../../architect/host-invocation-routing/rust-cli-and-proof-components-plan.md](../README.md)",
  "legacyPath": "docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md",
  "target": {
    "path": "docs/platform/host-invocation-routing/README.md",
    "anchor": null,
    "aliasId": "host-invocation-draft-088"
  },
  "portal": false,
  "area": "host-invocation-routing",
  "reviewStatus": "pending",
  "oldDestination": "../../../architect/host-invocation-routing/rust-cli-and-proof-components-plan.md",
  "newDestination": "../README.md",
  "alias": {
    "fromPath": "docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md",
    "toOwner": "docs/platform/host-invocation-routing/README.md",
    "toAnchor": null,
    "kind": "redirected",
    "evidenceRef": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
    "immutableRefs": [],
    "recordedAt": "2026-10-13",
    "aliasId": "host-invocation-draft-088"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Rust Host And Proof Providers Implementation Plan",
    "anchor": "rust-host-and-proof-providers-implementation-plan",
    "githubAnchor": "rust-host-and-proof-providers-implementation-plan",
    "stableAnchor": "h-7d1211de80c1",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "78b93c88e219b1c9d3ba3ff1613c6e755272edd193032b9b104c9fed980d340e",
    "sample": "Rust Host And Proof Providers Implementation Plan",
    "sectionPayloadDigest": "c5f05efd1ef3cd806a723b0bb4ebaf3f2e570267d8c3596ef90bb5655a0b9f31",
    "followingBlockDigest": "bbf58c843d81479697f50cb65c3a1570f2aa9b42bc6222cbbbdb153ad2ce0e02",
    "identityFingerprint": "dbc40c8c218fa48a2d6a07e5b78e9742987c5dfe3997e472f0fc93bf685ad3c0",
    "ancestry": [],
    "text": "# Rust Host And Proof Providers Implementation Plan",
    "sectionText": "# Rust Host And Proof Providers Implementation Plan\n\n**Status:** Proposed execution plan; blocked only by the remaining §3 decisions\n(target matrix, preview-vs-stable, compatibility-window duration) and the\npackaging stream's `fgctl` walking skeleton (§4, node `PK`).\n**Date:** 2026-09-04.\n**Revised:** 2026-09-10 (see plans/reports/architecture-review-260910-1537-host-invocation-provider-routing-design-review.md).\n**Architecture:** [Host Invocation And Provider Routing](./host-invocation-provider-routing.md).\n**Migration strategy:** [Node To Rust Component Migration](./node-to-rust-component-migration.md).\n**Component placement:** [fgOS Component Boundary Advisory](../component-boundary/component-boundary-advisory.md).\n**Distribution/activation authority:** [Runtime Identity And Activation](../packaging-distribution/runtime-identity-and-activation.md); this plan consumes that stream's walking skeleton, it does not redefine install/activation.\n\nThis document contains execution order, deliverables, gates, verification, and\nrollback. Semantic contracts, provider lifecycle, authority, framing, registry\nrules, compatibility modes, and technical trade-offs are owned by the\narchitecture document and are intentionally not redefined here."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Host Invocation",
    "anchor": "host-invocation",
    "githubAnchor": "host-invocation",
    "stableAnchor": "h-9674073175c5",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "cc682e1a901b39ba480c2a95282077b85597b0d8ee6aa24bd7dcd71c8de20739",
    "sample": "Host Invocation",
    "sectionPayloadDigest": "4906b85c6c780d8a9dcf4b69f592806ac5301cf33aa4d638e0c88c98046f9e9e",
    "followingBlockDigest": "4906b85c6c780d8a9dcf4b69f592806ac5301cf33aa4d638e0c88c98046f9e9e",
    "identityFingerprint": "2f2cd30c374c59bab51ddaebeadfb9338d8540794673fcc6fc53dfc281b37d78",
    "ancestry": [],
    "text": "# Host Invocation",
    "sectionText": "# Host Invocation\n\n```txt\nDocument type: Area portal\nAudience: Human reviewer, architect, maintainer, implementation agent\nPurpose: Route readers through fgOS host invocation, provider routing, legacy CLI transition, and external provider docs\nDesign status: Draft\nImplementation status: R1/R2/R3 implemented preview plus partial route migration\nCanonical: Yes, after review\nOwner: Platform documentation\nSource type: Promoted from docs/architect/host-invocation-routing/**\nLast reviewed: 2026-09-18\nImplementation: Existing dated R1/R2/R3 preview records; candidate carriage and current truth await independent checkpoint review\nProvenance: Six pinned legacy sources and the frozen Host Invocation area map; retained policy is non-authority history\nWriter type: Agent\nCanonical for: Promoted area navigation only; candidate document claims are not promoted by this edit\nUse this when: Finding the host invocation contract, selected migration direction and its proof boundaries\nDo not use this for: Selecting or installing a runtime, certifying current route counts, or treating dated plans as shipped code\nSupersedes: None; legacy source authority remains unchanged during candidate transformation\nSuperseded by: None\nRelated:\n- docs/platform/host-invocation-routing/vision.md\n- docs/platform/host-invocation-routing/intent-preservation-ledger.md\n- docs/platform/host-invocation-routing/spec.md\n- docs/platform/host-invocation-routing/roadmap.md\n- docs/platform/host-invocation-routing/architecture/invocation-kernel.md\n- docs/platform/host-invocation-routing/architecture/provider-routing.md\n- docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md\n- docs/platform/host-invocation-routing/contracts/operation-request-outcome.md\n- docs/platform/host-invocation-routing/contracts/command-route-descriptor.md\n- docs/platform/host-invocation-routing/verification/implementation-alignment.md\n- docs/platform/host-invocation-routing/history/source-inventory.md\n- docs/platform/host-invocation-routing/verification/source-preservation-audit.md\n- docs/platform/host-invocation-routing/decisions/README.md\n```"
  }
}
```

## Entry f-202: link-202

```json
{
  "id": "link-202",
  "path": "docs/platform/host-invocation-routing/verification/r1-rust-host-proof.md",
  "inputLine": 86,
  "inputColumn": 17,
  "lineBeforeLinkPass": 94,
  "before": "[../../../architect/host-invocation-routing/rust-cli-and-proof-components-plan.md](../../../architect/host-invocation-routing/rust-cli-and-proof-components-plan.md)",
  "after": "[../../../architect/host-invocation-routing/rust-cli-and-proof-components-plan.md](../README.md)",
  "legacyPath": "docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md",
  "target": {
    "path": "docs/platform/host-invocation-routing/README.md",
    "anchor": null,
    "aliasId": "host-invocation-draft-088"
  },
  "portal": false,
  "area": "host-invocation-routing",
  "reviewStatus": "pending",
  "oldDestination": "../../../architect/host-invocation-routing/rust-cli-and-proof-components-plan.md",
  "newDestination": "../README.md",
  "alias": {
    "fromPath": "docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md",
    "toOwner": "docs/platform/host-invocation-routing/README.md",
    "toAnchor": null,
    "kind": "redirected",
    "evidenceRef": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
    "immutableRefs": [],
    "recordedAt": "2026-10-13",
    "aliasId": "host-invocation-draft-088"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Rust Host And Proof Providers Implementation Plan",
    "anchor": "rust-host-and-proof-providers-implementation-plan",
    "githubAnchor": "rust-host-and-proof-providers-implementation-plan",
    "stableAnchor": "h-7d1211de80c1",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "78b93c88e219b1c9d3ba3ff1613c6e755272edd193032b9b104c9fed980d340e",
    "sample": "Rust Host And Proof Providers Implementation Plan",
    "sectionPayloadDigest": "c5f05efd1ef3cd806a723b0bb4ebaf3f2e570267d8c3596ef90bb5655a0b9f31",
    "followingBlockDigest": "bbf58c843d81479697f50cb65c3a1570f2aa9b42bc6222cbbbdb153ad2ce0e02",
    "identityFingerprint": "dbc40c8c218fa48a2d6a07e5b78e9742987c5dfe3997e472f0fc93bf685ad3c0",
    "ancestry": [],
    "text": "# Rust Host And Proof Providers Implementation Plan",
    "sectionText": "# Rust Host And Proof Providers Implementation Plan\n\n**Status:** Proposed execution plan; blocked only by the remaining §3 decisions\n(target matrix, preview-vs-stable, compatibility-window duration) and the\npackaging stream's `fgctl` walking skeleton (§4, node `PK`).\n**Date:** 2026-09-04.\n**Revised:** 2026-09-10 (see plans/reports/architecture-review-260910-1537-host-invocation-provider-routing-design-review.md).\n**Architecture:** [Host Invocation And Provider Routing](./host-invocation-provider-routing.md).\n**Migration strategy:** [Node To Rust Component Migration](./node-to-rust-component-migration.md).\n**Component placement:** [fgOS Component Boundary Advisory](../component-boundary/component-boundary-advisory.md).\n**Distribution/activation authority:** [Runtime Identity And Activation](../packaging-distribution/runtime-identity-and-activation.md); this plan consumes that stream's walking skeleton, it does not redefine install/activation.\n\nThis document contains execution order, deliverables, gates, verification, and\nrollback. Semantic contracts, provider lifecycle, authority, framing, registry\nrules, compatibility modes, and technical trade-offs are owned by the\narchitecture document and are intentionally not redefined here."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Host Invocation",
    "anchor": "host-invocation",
    "githubAnchor": "host-invocation",
    "stableAnchor": "h-9674073175c5",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "cc682e1a901b39ba480c2a95282077b85597b0d8ee6aa24bd7dcd71c8de20739",
    "sample": "Host Invocation",
    "sectionPayloadDigest": "4906b85c6c780d8a9dcf4b69f592806ac5301cf33aa4d638e0c88c98046f9e9e",
    "followingBlockDigest": "4906b85c6c780d8a9dcf4b69f592806ac5301cf33aa4d638e0c88c98046f9e9e",
    "identityFingerprint": "2f2cd30c374c59bab51ddaebeadfb9338d8540794673fcc6fc53dfc281b37d78",
    "ancestry": [],
    "text": "# Host Invocation",
    "sectionText": "# Host Invocation\n\n```txt\nDocument type: Area portal\nAudience: Human reviewer, architect, maintainer, implementation agent\nPurpose: Route readers through fgOS host invocation, provider routing, legacy CLI transition, and external provider docs\nDesign status: Draft\nImplementation status: R1/R2/R3 implemented preview plus partial route migration\nCanonical: Yes, after review\nOwner: Platform documentation\nSource type: Promoted from docs/architect/host-invocation-routing/**\nLast reviewed: 2026-09-18\nImplementation: Existing dated R1/R2/R3 preview records; candidate carriage and current truth await independent checkpoint review\nProvenance: Six pinned legacy sources and the frozen Host Invocation area map; retained policy is non-authority history\nWriter type: Agent\nCanonical for: Promoted area navigation only; candidate document claims are not promoted by this edit\nUse this when: Finding the host invocation contract, selected migration direction and its proof boundaries\nDo not use this for: Selecting or installing a runtime, certifying current route counts, or treating dated plans as shipped code\nSupersedes: None; legacy source authority remains unchanged during candidate transformation\nSuperseded by: None\nRelated:\n- docs/platform/host-invocation-routing/vision.md\n- docs/platform/host-invocation-routing/intent-preservation-ledger.md\n- docs/platform/host-invocation-routing/spec.md\n- docs/platform/host-invocation-routing/roadmap.md\n- docs/platform/host-invocation-routing/architecture/invocation-kernel.md\n- docs/platform/host-invocation-routing/architecture/provider-routing.md\n- docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md\n- docs/platform/host-invocation-routing/contracts/operation-request-outcome.md\n- docs/platform/host-invocation-routing/contracts/command-route-descriptor.md\n- docs/platform/host-invocation-routing/verification/implementation-alignment.md\n- docs/platform/host-invocation-routing/history/source-inventory.md\n- docs/platform/host-invocation-routing/verification/source-preservation-audit.md\n- docs/platform/host-invocation-routing/decisions/README.md\n```"
  }
}
```

## Entry f-203: link-203

```json
{
  "id": "link-203",
  "path": "docs/platform/host-invocation-routing/verification/r2-external-process-proof.md",
  "inputLine": 99,
  "inputColumn": 17,
  "lineBeforeLinkPass": 107,
  "before": "[../../../architect/host-invocation-routing/rust-cli-and-proof-components-plan.md](../../../architect/host-invocation-routing/rust-cli-and-proof-components-plan.md)",
  "after": "[../../../architect/host-invocation-routing/rust-cli-and-proof-components-plan.md](../README.md)",
  "legacyPath": "docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md",
  "target": {
    "path": "docs/platform/host-invocation-routing/README.md",
    "anchor": null,
    "aliasId": "host-invocation-draft-088"
  },
  "portal": false,
  "area": "host-invocation-routing",
  "reviewStatus": "pending",
  "oldDestination": "../../../architect/host-invocation-routing/rust-cli-and-proof-components-plan.md",
  "newDestination": "../README.md",
  "alias": {
    "fromPath": "docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md",
    "toOwner": "docs/platform/host-invocation-routing/README.md",
    "toAnchor": null,
    "kind": "redirected",
    "evidenceRef": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
    "immutableRefs": [],
    "recordedAt": "2026-10-13",
    "aliasId": "host-invocation-draft-088"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Rust Host And Proof Providers Implementation Plan",
    "anchor": "rust-host-and-proof-providers-implementation-plan",
    "githubAnchor": "rust-host-and-proof-providers-implementation-plan",
    "stableAnchor": "h-7d1211de80c1",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "78b93c88e219b1c9d3ba3ff1613c6e755272edd193032b9b104c9fed980d340e",
    "sample": "Rust Host And Proof Providers Implementation Plan",
    "sectionPayloadDigest": "c5f05efd1ef3cd806a723b0bb4ebaf3f2e570267d8c3596ef90bb5655a0b9f31",
    "followingBlockDigest": "bbf58c843d81479697f50cb65c3a1570f2aa9b42bc6222cbbbdb153ad2ce0e02",
    "identityFingerprint": "dbc40c8c218fa48a2d6a07e5b78e9742987c5dfe3997e472f0fc93bf685ad3c0",
    "ancestry": [],
    "text": "# Rust Host And Proof Providers Implementation Plan",
    "sectionText": "# Rust Host And Proof Providers Implementation Plan\n\n**Status:** Proposed execution plan; blocked only by the remaining §3 decisions\n(target matrix, preview-vs-stable, compatibility-window duration) and the\npackaging stream's `fgctl` walking skeleton (§4, node `PK`).\n**Date:** 2026-09-04.\n**Revised:** 2026-09-10 (see plans/reports/architecture-review-260910-1537-host-invocation-provider-routing-design-review.md).\n**Architecture:** [Host Invocation And Provider Routing](./host-invocation-provider-routing.md).\n**Migration strategy:** [Node To Rust Component Migration](./node-to-rust-component-migration.md).\n**Component placement:** [fgOS Component Boundary Advisory](../component-boundary/component-boundary-advisory.md).\n**Distribution/activation authority:** [Runtime Identity And Activation](../packaging-distribution/runtime-identity-and-activation.md); this plan consumes that stream's walking skeleton, it does not redefine install/activation.\n\nThis document contains execution order, deliverables, gates, verification, and\nrollback. Semantic contracts, provider lifecycle, authority, framing, registry\nrules, compatibility modes, and technical trade-offs are owned by the\narchitecture document and are intentionally not redefined here."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Host Invocation",
    "anchor": "host-invocation",
    "githubAnchor": "host-invocation",
    "stableAnchor": "h-9674073175c5",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "cc682e1a901b39ba480c2a95282077b85597b0d8ee6aa24bd7dcd71c8de20739",
    "sample": "Host Invocation",
    "sectionPayloadDigest": "4906b85c6c780d8a9dcf4b69f592806ac5301cf33aa4d638e0c88c98046f9e9e",
    "followingBlockDigest": "4906b85c6c780d8a9dcf4b69f592806ac5301cf33aa4d638e0c88c98046f9e9e",
    "identityFingerprint": "2f2cd30c374c59bab51ddaebeadfb9338d8540794673fcc6fc53dfc281b37d78",
    "ancestry": [],
    "text": "# Host Invocation",
    "sectionText": "# Host Invocation\n\n```txt\nDocument type: Area portal\nAudience: Human reviewer, architect, maintainer, implementation agent\nPurpose: Route readers through fgOS host invocation, provider routing, legacy CLI transition, and external provider docs\nDesign status: Draft\nImplementation status: R1/R2/R3 implemented preview plus partial route migration\nCanonical: Yes, after review\nOwner: Platform documentation\nSource type: Promoted from docs/architect/host-invocation-routing/**\nLast reviewed: 2026-09-18\nImplementation: Existing dated R1/R2/R3 preview records; candidate carriage and current truth await independent checkpoint review\nProvenance: Six pinned legacy sources and the frozen Host Invocation area map; retained policy is non-authority history\nWriter type: Agent\nCanonical for: Promoted area navigation only; candidate document claims are not promoted by this edit\nUse this when: Finding the host invocation contract, selected migration direction and its proof boundaries\nDo not use this for: Selecting or installing a runtime, certifying current route counts, or treating dated plans as shipped code\nSupersedes: None; legacy source authority remains unchanged during candidate transformation\nSuperseded by: None\nRelated:\n- docs/platform/host-invocation-routing/vision.md\n- docs/platform/host-invocation-routing/intent-preservation-ledger.md\n- docs/platform/host-invocation-routing/spec.md\n- docs/platform/host-invocation-routing/roadmap.md\n- docs/platform/host-invocation-routing/architecture/invocation-kernel.md\n- docs/platform/host-invocation-routing/architecture/provider-routing.md\n- docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md\n- docs/platform/host-invocation-routing/contracts/operation-request-outcome.md\n- docs/platform/host-invocation-routing/contracts/command-route-descriptor.md\n- docs/platform/host-invocation-routing/verification/implementation-alignment.md\n- docs/platform/host-invocation-routing/history/source-inventory.md\n- docs/platform/host-invocation-routing/verification/source-preservation-audit.md\n- docs/platform/host-invocation-routing/decisions/README.md\n```"
  }
}
```

## Entry f-204: link-204

```json
{
  "id": "link-204",
  "path": "docs/platform/host-invocation-routing/verification/r3-remote-peer-proof.md",
  "inputLine": 106,
  "inputColumn": 22,
  "lineBeforeLinkPass": 114,
  "before": "[../../../architect/host-invocation-routing/node-to-rust-component-migration.md](../../../architect/host-invocation-routing/node-to-rust-component-migration.md)",
  "after": "[../../../architect/host-invocation-routing/node-to-rust-component-migration.md](../README.md)",
  "legacyPath": "docs/architect/host-invocation-routing/node-to-rust-component-migration.md",
  "target": {
    "path": "docs/platform/host-invocation-routing/README.md",
    "anchor": null,
    "aliasId": "host-invocation-draft-061"
  },
  "portal": false,
  "area": "host-invocation-routing",
  "reviewStatus": "pending",
  "oldDestination": "../../../architect/host-invocation-routing/node-to-rust-component-migration.md",
  "newDestination": "../README.md",
  "alias": {
    "fromPath": "docs/architect/host-invocation-routing/node-to-rust-component-migration.md",
    "toOwner": "docs/platform/host-invocation-routing/README.md",
    "toAnchor": null,
    "kind": "redirected",
    "evidenceRef": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
    "immutableRefs": [],
    "recordedAt": "2026-10-13",
    "aliasId": "host-invocation-draft-061"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Node To Rust Component Migration",
    "anchor": "node-to-rust-component-migration",
    "githubAnchor": "node-to-rust-component-migration",
    "stableAnchor": "h-b4de1922ccc4",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "24e0aa773ffabc724acf02f1b1c6f96aaedfc26582081dd323103b4146ef3621",
    "sample": "Node To Rust Component Migration",
    "sectionPayloadDigest": "56cf264d990b67f6fdd7c1c1bd0b4ce4891014bece3dad995ef381e4c7eeb164",
    "followingBlockDigest": "206fd476551e3bbbbdc0ebf45aa95e5254c49d31e21e9fc83de16d91ee3f0731",
    "identityFingerprint": "b481481ac015aebf2e03ff1aae8b1710e4f2eddaf4606b848d0690c68bab5ec1",
    "ancestry": [],
    "text": "# Node To Rust Component Migration",
    "sectionText": "# Node To Rust Component Migration\n\n**Status:** Selected migration direction, not an implementation plan.\n**Date:** 2026-09-01.\n**Revised:** 2026-09-10 (see\nplans/reports/architecture-review-260910-1537-host-invocation-provider-routing-design-review.md).\n**Selected direction (2026-09-03; revised 2026-09-04, 2026-09-10):** ship the\ndistributable Rust `fgos` CLI host in R1, with every unmigrated selector\nresolved by the CLI adapter to the legacy-cli lane and exec'd straight to the\nNode payload, never entering the kernel; prove external process providers in\nR2 and the production remote peer in R3; then replace semantic operations one\ncomponent at a time with native Rust providers.\n**Source:** Product-owner planning and follow-up component-boundary discussion.\n\nThis document discusses only migration options, ordering, transition stages,\ncutover, and rollback. The stable host model, peer CLI/remote host use cases,\nOperation Provider Router, provider mechanics, protocols, plugin registry,\nauthority, and technical tradeoffs live in\n[Host Invocation And Provider Routing Architecture](./host-invocation-provider-routing.md).\nComponent ownership, authority boundaries, and the physical placement compass\nfor files/crates/components live in\n[fgOS Component Boundary Advisory](../component-boundary/component-boundary-advisory.md);\nevery native migration slice must read it before choosing where a provider or\ncomponent module lives.\nThe executable work breakdown lives in\n[Rust Host And Proof Providers Implementation Plan](./rust-cli-and-proof-components-plan.md)."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Host Invocation",
    "anchor": "host-invocation",
    "githubAnchor": "host-invocation",
    "stableAnchor": "h-9674073175c5",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "cc682e1a901b39ba480c2a95282077b85597b0d8ee6aa24bd7dcd71c8de20739",
    "sample": "Host Invocation",
    "sectionPayloadDigest": "4906b85c6c780d8a9dcf4b69f592806ac5301cf33aa4d638e0c88c98046f9e9e",
    "followingBlockDigest": "4906b85c6c780d8a9dcf4b69f592806ac5301cf33aa4d638e0c88c98046f9e9e",
    "identityFingerprint": "2f2cd30c374c59bab51ddaebeadfb9338d8540794673fcc6fc53dfc281b37d78",
    "ancestry": [],
    "text": "# Host Invocation",
    "sectionText": "# Host Invocation\n\n```txt\nDocument type: Area portal\nAudience: Human reviewer, architect, maintainer, implementation agent\nPurpose: Route readers through fgOS host invocation, provider routing, legacy CLI transition, and external provider docs\nDesign status: Draft\nImplementation status: R1/R2/R3 implemented preview plus partial route migration\nCanonical: Yes, after review\nOwner: Platform documentation\nSource type: Promoted from docs/architect/host-invocation-routing/**\nLast reviewed: 2026-09-18\nImplementation: Existing dated R1/R2/R3 preview records; candidate carriage and current truth await independent checkpoint review\nProvenance: Six pinned legacy sources and the frozen Host Invocation area map; retained policy is non-authority history\nWriter type: Agent\nCanonical for: Promoted area navigation only; candidate document claims are not promoted by this edit\nUse this when: Finding the host invocation contract, selected migration direction and its proof boundaries\nDo not use this for: Selecting or installing a runtime, certifying current route counts, or treating dated plans as shipped code\nSupersedes: None; legacy source authority remains unchanged during candidate transformation\nSuperseded by: None\nRelated:\n- docs/platform/host-invocation-routing/vision.md\n- docs/platform/host-invocation-routing/intent-preservation-ledger.md\n- docs/platform/host-invocation-routing/spec.md\n- docs/platform/host-invocation-routing/roadmap.md\n- docs/platform/host-invocation-routing/architecture/invocation-kernel.md\n- docs/platform/host-invocation-routing/architecture/provider-routing.md\n- docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md\n- docs/platform/host-invocation-routing/contracts/operation-request-outcome.md\n- docs/platform/host-invocation-routing/contracts/command-route-descriptor.md\n- docs/platform/host-invocation-routing/verification/implementation-alignment.md\n- docs/platform/host-invocation-routing/history/source-inventory.md\n- docs/platform/host-invocation-routing/verification/source-preservation-audit.md\n- docs/platform/host-invocation-routing/decisions/README.md\n```"
  }
}
```

## Entry f-205: link-205

```json
{
  "id": "link-205",
  "path": "docs/platform/host-invocation-routing/verification/source-preservation-audit.md",
  "inputLine": 33,
  "inputColumn": 3,
  "lineBeforeLinkPass": 41,
  "before": "[documentation-standardization-plan.md](../../../architect/host-invocation-routing/documentation-standardization-plan.md)",
  "after": "[documentation-standardization-plan.md](../history/documentation-migration/documentation-standardization-plan.md)",
  "legacyPath": "docs/architect/host-invocation-routing/documentation-standardization-plan.md",
  "target": {
    "path": "docs/platform/host-invocation-routing/history/documentation-migration/documentation-standardization-plan.md",
    "anchor": null,
    "aliasId": "host-invocation-draft-001"
  },
  "portal": false,
  "area": "host-invocation-routing",
  "reviewStatus": "pending",
  "oldDestination": "../../../architect/host-invocation-routing/documentation-standardization-plan.md",
  "newDestination": "../history/documentation-migration/documentation-standardization-plan.md",
  "alias": {
    "fromPath": "docs/architect/host-invocation-routing/documentation-standardization-plan.md",
    "toOwner": "docs/platform/host-invocation-routing/history/documentation-migration/documentation-standardization-plan.md",
    "toAnchor": null,
    "kind": "moved",
    "evidenceRef": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
    "immutableRefs": [],
    "recordedAt": "2026-10-13",
    "aliasId": "host-invocation-draft-001"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Host Invocation Documentation Standardization Plan",
    "anchor": "host-invocation-documentation-standardization-plan",
    "githubAnchor": "host-invocation-documentation-standardization-plan",
    "stableAnchor": "h-795da8958fcf",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "a5469bceb71112e077f2a3eb604cb87f62cf6f05cf3ac70cdabae9da0b16ce66",
    "sample": "Host Invocation Documentation Standardization Plan",
    "sectionPayloadDigest": "cfd447aea1555afc888a2bcd54c15309f2428d56fa0462a390fd087c43dd0832",
    "followingBlockDigest": "7085816e2b2ae42f8622be1184f7a993c05da4cdb240bd092f4befa68d682a15",
    "identityFingerprint": "fa6af110ee765277db80c27f0a7b19e535775e87328a30e032424465db0ef672",
    "ancestry": [],
    "text": "# Host Invocation Documentation Standardization Plan",
    "sectionText": "# Host Invocation Documentation Standardization Plan\n\n```txt\nDocument type: Migration plan\nAudience: Human reviewer, architect, documentation agent, implementation agent\nPurpose: Plan the rewrite of host-invocation docs into the new documentation system without losing settled legacy detail\nDesign status: Draft\nImplementation: Not started\nProvenance: Created from documentation-system discussion and scan of existing host-invocation / agent-coordination docs\nWriter type: Human + agent coauthor\nCanonical for: Planning the host-invocation documentation migration only\nUse this when: Rewriting or reviewing host-invocation docs under the new docs/platform structure\nDo not use this for: Current runtime behavior, accepted architecture authority, or implementation truth\nLast reviewed: 2026-09-14\nRelated:\n- docs/doc-governance.md\n- docs/platform/README.md\n- docs/platform/component-boundary.md\n- docs/architect/host-invocation-routing/host-invocation-provider-routing.md\n- docs/architect/agent-coordination/intent-preservation-ledger.md\n```\n\nThis plan exists because the packaging-distribution rewrite exposed a real\nfailure mode: a new, clearer document shape can accidentally drop technical or\narchitectural details that were already settled in older docs."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Retired Documentation Migration Plan",
    "anchor": "retired-documentation-migration-plan",
    "githubAnchor": "retired-documentation-migration-plan",
    "stableAnchor": "h-da5dbff5e00f",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "7705d61887d7f4bbbb75ffd7f528df162aabcb5de3e87cf419e9ad359ced1aa4",
    "sample": "Retired Documentation Migration Plan",
    "sectionPayloadDigest": "af80117764a4a660e55f77b2a102e9fb10610066fa3ac56253a60573095cb1dd",
    "followingBlockDigest": "af80117764a4a660e55f77b2a102e9fb10610066fa3ac56253a60573095cb1dd",
    "identityFingerprint": "80b5aaf9e9bcba1fe2722fd5703e044b8b5fd08c26885afab1264527e68a5929",
    "ancestry": [],
    "text": "# Retired Documentation Migration Plan",
    "sectionText": "# Retired Documentation Migration Plan\n\n```txt\nDocument type: History\nAudience: Reviewer, maintainer, history reader\nPurpose: Retain the retired area documentation policy and migration plan verbatim as non-authority history\nDesign status: Draft\nLast reviewed: Pending independent conservation review\nRelated: docs/platform/host-invocation-routing/README.md\nProvenance: docs/architect/host-invocation-routing/documentation-standardization-plan.md at 83d757f4d693ae13d3fd50e0a454fb95c78f1ff4\n```"
  }
}
```

## Entry f-206: link-206

```json
{
  "id": "link-206",
  "path": "docs/platform/host-invocation-routing/verification/source-preservation-audit.md",
  "inputLine": 34,
  "inputColumn": 3,
  "lineBeforeLinkPass": 42,
  "before": "[host-invocation-provider-routing.md](../../../architect/host-invocation-routing/host-invocation-provider-routing.md)",
  "after": "[host-invocation-provider-routing.md](../README.md)",
  "legacyPath": "docs/architect/host-invocation-routing/host-invocation-provider-routing.md",
  "target": {
    "path": "docs/platform/host-invocation-routing/README.md",
    "anchor": null,
    "aliasId": "host-invocation-draft-037"
  },
  "portal": false,
  "area": "host-invocation-routing",
  "reviewStatus": "pending",
  "oldDestination": "../../../architect/host-invocation-routing/host-invocation-provider-routing.md",
  "newDestination": "../README.md",
  "alias": {
    "fromPath": "docs/architect/host-invocation-routing/host-invocation-provider-routing.md",
    "toOwner": "docs/platform/host-invocation-routing/README.md",
    "toAnchor": null,
    "kind": "redirected",
    "evidenceRef": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
    "immutableRefs": [],
    "recordedAt": "2026-10-13",
    "aliasId": "host-invocation-draft-037"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Host Invocation And Provider Routing Architecture",
    "anchor": "host-invocation-and-provider-routing-architecture",
    "githubAnchor": "host-invocation-and-provider-routing-architecture",
    "stableAnchor": "h-699de63b2a62",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "05b7c0f19374f9f956c217241c508227641d20b1c4221b348777f23611b6e7df",
    "sample": "Host Invocation And Provider Routing Architecture",
    "sectionPayloadDigest": "797624eb16ce2d9c44b3fdb73c1a8aab61651fa8d134d55a3e8d05c6e32f1f65",
    "followingBlockDigest": "b5d90a2f82ebb7b1b4cc9fb4d388233e24a26f68be6ed5ee2990b783e1a36a62",
    "identityFingerprint": "2d3ca53446822aa5d2922de7b0280861ec0662ed278325b22c3a3c9a8c9183c8",
    "ancestry": [],
    "text": "# Host Invocation And Provider Routing Architecture",
    "sectionText": "# Host Invocation And Provider Routing Architecture\n\n**Status:** Vision / architecture advisory, not a locked platform law and not an implementation plan.\n**Date:** 2026-09-10.\n**Revised:** per [architecture-review-260910-1537-host-invocation-provider-routing-design-review.md](../../../plans/reports/architecture-review-260910-1537-host-invocation-provider-routing-design-review.md).\n**Source:** Product-owner component-boundary and Node-to-Rust migration discussion.\n\nThis is the **kernel contract**: the permanent invocation/routing boundary every fgOS host uses, independent of transport (CLI, remote, chat) and provider mechanism (built-in, legacy Node, external process, WASM). Ecosystem plugin mechanics: [External Provider Protocol](./external-provider-protocol.md). Transitional Node CLI lane: [Legacy CLI Transition](./legacy-cli-transition.md). Both depend on this document. Migration staging and first proof: [Node To Rust Component Migration](./node-to-rust-component-migration.md), [Rust Host And Proof Providers Implementation Plan](./rust-cli-and-proof-components-plan.md)."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Host Invocation",
    "anchor": "host-invocation",
    "githubAnchor": "host-invocation",
    "stableAnchor": "h-9674073175c5",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "cc682e1a901b39ba480c2a95282077b85597b0d8ee6aa24bd7dcd71c8de20739",
    "sample": "Host Invocation",
    "sectionPayloadDigest": "4906b85c6c780d8a9dcf4b69f592806ac5301cf33aa4d638e0c88c98046f9e9e",
    "followingBlockDigest": "4906b85c6c780d8a9dcf4b69f592806ac5301cf33aa4d638e0c88c98046f9e9e",
    "identityFingerprint": "2f2cd30c374c59bab51ddaebeadfb9338d8540794673fcc6fc53dfc281b37d78",
    "ancestry": [],
    "text": "# Host Invocation",
    "sectionText": "# Host Invocation\n\n```txt\nDocument type: Area portal\nAudience: Human reviewer, architect, maintainer, implementation agent\nPurpose: Route readers through fgOS host invocation, provider routing, legacy CLI transition, and external provider docs\nDesign status: Draft\nImplementation status: R1/R2/R3 implemented preview plus partial route migration\nCanonical: Yes, after review\nOwner: Platform documentation\nSource type: Promoted from docs/architect/host-invocation-routing/**\nLast reviewed: 2026-09-18\nImplementation: Existing dated R1/R2/R3 preview records; candidate carriage and current truth await independent checkpoint review\nProvenance: Six pinned legacy sources and the frozen Host Invocation area map; retained policy is non-authority history\nWriter type: Agent\nCanonical for: Promoted area navigation only; candidate document claims are not promoted by this edit\nUse this when: Finding the host invocation contract, selected migration direction and its proof boundaries\nDo not use this for: Selecting or installing a runtime, certifying current route counts, or treating dated plans as shipped code\nSupersedes: None; legacy source authority remains unchanged during candidate transformation\nSuperseded by: None\nRelated:\n- docs/platform/host-invocation-routing/vision.md\n- docs/platform/host-invocation-routing/intent-preservation-ledger.md\n- docs/platform/host-invocation-routing/spec.md\n- docs/platform/host-invocation-routing/roadmap.md\n- docs/platform/host-invocation-routing/architecture/invocation-kernel.md\n- docs/platform/host-invocation-routing/architecture/provider-routing.md\n- docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md\n- docs/platform/host-invocation-routing/contracts/operation-request-outcome.md\n- docs/platform/host-invocation-routing/contracts/command-route-descriptor.md\n- docs/platform/host-invocation-routing/verification/implementation-alignment.md\n- docs/platform/host-invocation-routing/history/source-inventory.md\n- docs/platform/host-invocation-routing/verification/source-preservation-audit.md\n- docs/platform/host-invocation-routing/decisions/README.md\n```"
  }
}
```

## Entry f-207: link-207

```json
{
  "id": "link-207",
  "path": "docs/platform/host-invocation-routing/verification/source-preservation-audit.md",
  "inputLine": 35,
  "inputColumn": 3,
  "lineBeforeLinkPass": 43,
  "before": "[external-provider-protocol.md](../../../architect/host-invocation-routing/external-provider-protocol.md)",
  "after": "[external-provider-protocol.md](../README.md)",
  "legacyPath": "docs/architect/host-invocation-routing/external-provider-protocol.md",
  "target": {
    "path": "docs/platform/host-invocation-routing/README.md",
    "anchor": null,
    "aliasId": "host-invocation-draft-026"
  },
  "portal": false,
  "area": "host-invocation-routing",
  "reviewStatus": "pending",
  "oldDestination": "../../../architect/host-invocation-routing/external-provider-protocol.md",
  "newDestination": "../README.md",
  "alias": {
    "fromPath": "docs/architect/host-invocation-routing/external-provider-protocol.md",
    "toOwner": "docs/platform/host-invocation-routing/README.md",
    "toAnchor": null,
    "kind": "redirected",
    "evidenceRef": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
    "immutableRefs": [],
    "recordedAt": "2026-10-13",
    "aliasId": "host-invocation-draft-026"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "External Provider Protocol",
    "anchor": "external-provider-protocol",
    "githubAnchor": "external-provider-protocol",
    "stableAnchor": "h-68c01c1d2777",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "f85ccab90dedc3cbc516243044e189fc2dee638bd9b4a3ba6cbc057a739a9ac8",
    "sample": "External Provider Protocol",
    "sectionPayloadDigest": "b350f69d5e37894f50da3d3fe34073d9709f581d17dcaf972f8c1aae1745e7f6",
    "followingBlockDigest": "ab6730b94dcd1c31dcc6afb6fffd7a83d53310f5850673f5663db952bd87f5c1",
    "identityFingerprint": "c89837a09eb5766bcca5aaac2b7cafb99a456e36e310e49f2e921cac3ebfd06d",
    "ancestry": [],
    "text": "# External Provider Protocol",
    "sectionText": "# External Provider Protocol\n\n**Status:** Vision / architecture advisory, not a locked platform law and not an implementation plan.\n**Date:** 2026-09-10.\n**Revised:** per [architecture-review-260910-1537-host-invocation-provider-routing-design-review.md](../../../plans/reports/architecture-review-260910-1537-host-invocation-provider-routing-design-review.md).\n\nThis document depends on the kernel contract in [Host Invocation And Provider Routing](./host-invocation-provider-routing.md) — read it first for `OperationId`, `OperationRequest`, `ProviderOutcome`, `ProviderDescriptor`, `OperationProvider`, `RegistrySnapshot`, the Router, and `InvocationService`. This document covers everything specific to a provider that lives outside a statically linked Rust crate: component classes (who owns/releases it), invocation mechanisms (how it is reached), the wire protocol, and the plugin registry linker that turns manifests into a `RegistrySnapshot`."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Host Invocation",
    "anchor": "host-invocation",
    "githubAnchor": "host-invocation",
    "stableAnchor": "h-9674073175c5",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "cc682e1a901b39ba480c2a95282077b85597b0d8ee6aa24bd7dcd71c8de20739",
    "sample": "Host Invocation",
    "sectionPayloadDigest": "4906b85c6c780d8a9dcf4b69f592806ac5301cf33aa4d638e0c88c98046f9e9e",
    "followingBlockDigest": "4906b85c6c780d8a9dcf4b69f592806ac5301cf33aa4d638e0c88c98046f9e9e",
    "identityFingerprint": "2f2cd30c374c59bab51ddaebeadfb9338d8540794673fcc6fc53dfc281b37d78",
    "ancestry": [],
    "text": "# Host Invocation",
    "sectionText": "# Host Invocation\n\n```txt\nDocument type: Area portal\nAudience: Human reviewer, architect, maintainer, implementation agent\nPurpose: Route readers through fgOS host invocation, provider routing, legacy CLI transition, and external provider docs\nDesign status: Draft\nImplementation status: R1/R2/R3 implemented preview plus partial route migration\nCanonical: Yes, after review\nOwner: Platform documentation\nSource type: Promoted from docs/architect/host-invocation-routing/**\nLast reviewed: 2026-09-18\nImplementation: Existing dated R1/R2/R3 preview records; candidate carriage and current truth await independent checkpoint review\nProvenance: Six pinned legacy sources and the frozen Host Invocation area map; retained policy is non-authority history\nWriter type: Agent\nCanonical for: Promoted area navigation only; candidate document claims are not promoted by this edit\nUse this when: Finding the host invocation contract, selected migration direction and its proof boundaries\nDo not use this for: Selecting or installing a runtime, certifying current route counts, or treating dated plans as shipped code\nSupersedes: None; legacy source authority remains unchanged during candidate transformation\nSuperseded by: None\nRelated:\n- docs/platform/host-invocation-routing/vision.md\n- docs/platform/host-invocation-routing/intent-preservation-ledger.md\n- docs/platform/host-invocation-routing/spec.md\n- docs/platform/host-invocation-routing/roadmap.md\n- docs/platform/host-invocation-routing/architecture/invocation-kernel.md\n- docs/platform/host-invocation-routing/architecture/provider-routing.md\n- docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md\n- docs/platform/host-invocation-routing/contracts/operation-request-outcome.md\n- docs/platform/host-invocation-routing/contracts/command-route-descriptor.md\n- docs/platform/host-invocation-routing/verification/implementation-alignment.md\n- docs/platform/host-invocation-routing/history/source-inventory.md\n- docs/platform/host-invocation-routing/verification/source-preservation-audit.md\n- docs/platform/host-invocation-routing/decisions/README.md\n```"
  }
}
```

## Entry f-208: link-208

```json
{
  "id": "link-208",
  "path": "docs/platform/host-invocation-routing/verification/source-preservation-audit.md",
  "inputLine": 36,
  "inputColumn": 3,
  "lineBeforeLinkPass": 44,
  "before": "[legacy-cli-transition.md](../../../architect/host-invocation-routing/legacy-cli-transition.md)",
  "after": "[legacy-cli-transition.md](../README.md)",
  "legacyPath": "docs/architect/host-invocation-routing/legacy-cli-transition.md",
  "target": {
    "path": "docs/platform/host-invocation-routing/README.md",
    "anchor": null,
    "aliasId": "host-invocation-draft-052"
  },
  "portal": false,
  "area": "host-invocation-routing",
  "reviewStatus": "pending",
  "oldDestination": "../../../architect/host-invocation-routing/legacy-cli-transition.md",
  "newDestination": "../README.md",
  "alias": {
    "fromPath": "docs/architect/host-invocation-routing/legacy-cli-transition.md",
    "toOwner": "docs/platform/host-invocation-routing/README.md",
    "toAnchor": null,
    "kind": "redirected",
    "evidenceRef": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
    "immutableRefs": [],
    "recordedAt": "2026-10-13",
    "aliasId": "host-invocation-draft-052"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Legacy CLI Transition",
    "anchor": "legacy-cli-transition",
    "githubAnchor": "legacy-cli-transition",
    "stableAnchor": "h-dc70efc6804e",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "882786e83f6fcf97ec9230a8eb8cac4c050823310061348dd3d85cb609dbe329",
    "sample": "Legacy CLI Transition",
    "sectionPayloadDigest": "7b54ed05cfd159ebb37eed166b94ffa4c76aac3e113078bbef9683d49d647156",
    "followingBlockDigest": "ab6730b94dcd1c31dcc6afb6fffd7a83d53310f5850673f5663db952bd87f5c1",
    "identityFingerprint": "e597222ce0b65b2a68602b1aa4d9351bbfc26ee04ae227cc7b2c97817eefcd3a",
    "ancestry": [],
    "text": "# Legacy CLI Transition",
    "sectionText": "# Legacy CLI Transition\n\n**Status:** Vision / architecture advisory, not a locked platform law and not an implementation plan.\n**Date:** 2026-09-10.\n**Revised:** per [architecture-review-260910-1537-host-invocation-provider-routing-design-review.md](../../../plans/reports/architecture-review-260910-1537-host-invocation-provider-routing-design-review.md).\n\nThis document depends on the kernel contract in [Host Invocation And Provider Routing](./host-invocation-provider-routing.md) — read it first, in particular \"Transitional CLI Lane\" under §4 and `CommandRouteDescriptor` in the §3 name table. The kernel has exactly one input (`OperationRequest`) and one output (`ProviderOutcome`); everything in this document is CLI-adapter-local scaffolding that disappears once Node migration completes. Nothing here introduces a second kernel input or output type — the legacy lane never reaches the Router or `InvocationService` at all (see §1 below)."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Host Invocation",
    "anchor": "host-invocation",
    "githubAnchor": "host-invocation",
    "stableAnchor": "h-9674073175c5",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "cc682e1a901b39ba480c2a95282077b85597b0d8ee6aa24bd7dcd71c8de20739",
    "sample": "Host Invocation",
    "sectionPayloadDigest": "4906b85c6c780d8a9dcf4b69f592806ac5301cf33aa4d638e0c88c98046f9e9e",
    "followingBlockDigest": "4906b85c6c780d8a9dcf4b69f592806ac5301cf33aa4d638e0c88c98046f9e9e",
    "identityFingerprint": "2f2cd30c374c59bab51ddaebeadfb9338d8540794673fcc6fc53dfc281b37d78",
    "ancestry": [],
    "text": "# Host Invocation",
    "sectionText": "# Host Invocation\n\n```txt\nDocument type: Area portal\nAudience: Human reviewer, architect, maintainer, implementation agent\nPurpose: Route readers through fgOS host invocation, provider routing, legacy CLI transition, and external provider docs\nDesign status: Draft\nImplementation status: R1/R2/R3 implemented preview plus partial route migration\nCanonical: Yes, after review\nOwner: Platform documentation\nSource type: Promoted from docs/architect/host-invocation-routing/**\nLast reviewed: 2026-09-18\nImplementation: Existing dated R1/R2/R3 preview records; candidate carriage and current truth await independent checkpoint review\nProvenance: Six pinned legacy sources and the frozen Host Invocation area map; retained policy is non-authority history\nWriter type: Agent\nCanonical for: Promoted area navigation only; candidate document claims are not promoted by this edit\nUse this when: Finding the host invocation contract, selected migration direction and its proof boundaries\nDo not use this for: Selecting or installing a runtime, certifying current route counts, or treating dated plans as shipped code\nSupersedes: None; legacy source authority remains unchanged during candidate transformation\nSuperseded by: None\nRelated:\n- docs/platform/host-invocation-routing/vision.md\n- docs/platform/host-invocation-routing/intent-preservation-ledger.md\n- docs/platform/host-invocation-routing/spec.md\n- docs/platform/host-invocation-routing/roadmap.md\n- docs/platform/host-invocation-routing/architecture/invocation-kernel.md\n- docs/platform/host-invocation-routing/architecture/provider-routing.md\n- docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md\n- docs/platform/host-invocation-routing/contracts/operation-request-outcome.md\n- docs/platform/host-invocation-routing/contracts/command-route-descriptor.md\n- docs/platform/host-invocation-routing/verification/implementation-alignment.md\n- docs/platform/host-invocation-routing/history/source-inventory.md\n- docs/platform/host-invocation-routing/verification/source-preservation-audit.md\n- docs/platform/host-invocation-routing/decisions/README.md\n```"
  }
}
```

## Entry f-209: link-209

```json
{
  "id": "link-209",
  "path": "docs/platform/host-invocation-routing/verification/source-preservation-audit.md",
  "inputLine": 37,
  "inputColumn": 3,
  "lineBeforeLinkPass": 45,
  "before": "[node-to-rust-component-migration.md](../../../architect/host-invocation-routing/node-to-rust-component-migration.md)",
  "after": "[node-to-rust-component-migration.md](../README.md)",
  "legacyPath": "docs/architect/host-invocation-routing/node-to-rust-component-migration.md",
  "target": {
    "path": "docs/platform/host-invocation-routing/README.md",
    "anchor": null,
    "aliasId": "host-invocation-draft-061"
  },
  "portal": false,
  "area": "host-invocation-routing",
  "reviewStatus": "pending",
  "oldDestination": "../../../architect/host-invocation-routing/node-to-rust-component-migration.md",
  "newDestination": "../README.md",
  "alias": {
    "fromPath": "docs/architect/host-invocation-routing/node-to-rust-component-migration.md",
    "toOwner": "docs/platform/host-invocation-routing/README.md",
    "toAnchor": null,
    "kind": "redirected",
    "evidenceRef": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
    "immutableRefs": [],
    "recordedAt": "2026-10-13",
    "aliasId": "host-invocation-draft-061"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Node To Rust Component Migration",
    "anchor": "node-to-rust-component-migration",
    "githubAnchor": "node-to-rust-component-migration",
    "stableAnchor": "h-b4de1922ccc4",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "24e0aa773ffabc724acf02f1b1c6f96aaedfc26582081dd323103b4146ef3621",
    "sample": "Node To Rust Component Migration",
    "sectionPayloadDigest": "56cf264d990b67f6fdd7c1c1bd0b4ce4891014bece3dad995ef381e4c7eeb164",
    "followingBlockDigest": "206fd476551e3bbbbdc0ebf45aa95e5254c49d31e21e9fc83de16d91ee3f0731",
    "identityFingerprint": "b481481ac015aebf2e03ff1aae8b1710e4f2eddaf4606b848d0690c68bab5ec1",
    "ancestry": [],
    "text": "# Node To Rust Component Migration",
    "sectionText": "# Node To Rust Component Migration\n\n**Status:** Selected migration direction, not an implementation plan.\n**Date:** 2026-09-01.\n**Revised:** 2026-09-10 (see\nplans/reports/architecture-review-260910-1537-host-invocation-provider-routing-design-review.md).\n**Selected direction (2026-09-03; revised 2026-09-04, 2026-09-10):** ship the\ndistributable Rust `fgos` CLI host in R1, with every unmigrated selector\nresolved by the CLI adapter to the legacy-cli lane and exec'd straight to the\nNode payload, never entering the kernel; prove external process providers in\nR2 and the production remote peer in R3; then replace semantic operations one\ncomponent at a time with native Rust providers.\n**Source:** Product-owner planning and follow-up component-boundary discussion.\n\nThis document discusses only migration options, ordering, transition stages,\ncutover, and rollback. The stable host model, peer CLI/remote host use cases,\nOperation Provider Router, provider mechanics, protocols, plugin registry,\nauthority, and technical tradeoffs live in\n[Host Invocation And Provider Routing Architecture](./host-invocation-provider-routing.md).\nComponent ownership, authority boundaries, and the physical placement compass\nfor files/crates/components live in\n[fgOS Component Boundary Advisory](../component-boundary/component-boundary-advisory.md);\nevery native migration slice must read it before choosing where a provider or\ncomponent module lives.\nThe executable work breakdown lives in\n[Rust Host And Proof Providers Implementation Plan](./rust-cli-and-proof-components-plan.md)."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Host Invocation",
    "anchor": "host-invocation",
    "githubAnchor": "host-invocation",
    "stableAnchor": "h-9674073175c5",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "cc682e1a901b39ba480c2a95282077b85597b0d8ee6aa24bd7dcd71c8de20739",
    "sample": "Host Invocation",
    "sectionPayloadDigest": "4906b85c6c780d8a9dcf4b69f592806ac5301cf33aa4d638e0c88c98046f9e9e",
    "followingBlockDigest": "4906b85c6c780d8a9dcf4b69f592806ac5301cf33aa4d638e0c88c98046f9e9e",
    "identityFingerprint": "2f2cd30c374c59bab51ddaebeadfb9338d8540794673fcc6fc53dfc281b37d78",
    "ancestry": [],
    "text": "# Host Invocation",
    "sectionText": "# Host Invocation\n\n```txt\nDocument type: Area portal\nAudience: Human reviewer, architect, maintainer, implementation agent\nPurpose: Route readers through fgOS host invocation, provider routing, legacy CLI transition, and external provider docs\nDesign status: Draft\nImplementation status: R1/R2/R3 implemented preview plus partial route migration\nCanonical: Yes, after review\nOwner: Platform documentation\nSource type: Promoted from docs/architect/host-invocation-routing/**\nLast reviewed: 2026-09-18\nImplementation: Existing dated R1/R2/R3 preview records; candidate carriage and current truth await independent checkpoint review\nProvenance: Six pinned legacy sources and the frozen Host Invocation area map; retained policy is non-authority history\nWriter type: Agent\nCanonical for: Promoted area navigation only; candidate document claims are not promoted by this edit\nUse this when: Finding the host invocation contract, selected migration direction and its proof boundaries\nDo not use this for: Selecting or installing a runtime, certifying current route counts, or treating dated plans as shipped code\nSupersedes: None; legacy source authority remains unchanged during candidate transformation\nSuperseded by: None\nRelated:\n- docs/platform/host-invocation-routing/vision.md\n- docs/platform/host-invocation-routing/intent-preservation-ledger.md\n- docs/platform/host-invocation-routing/spec.md\n- docs/platform/host-invocation-routing/roadmap.md\n- docs/platform/host-invocation-routing/architecture/invocation-kernel.md\n- docs/platform/host-invocation-routing/architecture/provider-routing.md\n- docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md\n- docs/platform/host-invocation-routing/contracts/operation-request-outcome.md\n- docs/platform/host-invocation-routing/contracts/command-route-descriptor.md\n- docs/platform/host-invocation-routing/verification/implementation-alignment.md\n- docs/platform/host-invocation-routing/history/source-inventory.md\n- docs/platform/host-invocation-routing/verification/source-preservation-audit.md\n- docs/platform/host-invocation-routing/decisions/README.md\n```"
  }
}
```

## Entry f-210: link-210

```json
{
  "id": "link-210",
  "path": "docs/platform/host-invocation-routing/verification/source-preservation-audit.md",
  "inputLine": 38,
  "inputColumn": 3,
  "lineBeforeLinkPass": 46,
  "before": "[rust-cli-and-proof-components-plan.md](../../../architect/host-invocation-routing/rust-cli-and-proof-components-plan.md)",
  "after": "[rust-cli-and-proof-components-plan.md](../README.md)",
  "legacyPath": "docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md",
  "target": {
    "path": "docs/platform/host-invocation-routing/README.md",
    "anchor": null,
    "aliasId": "host-invocation-draft-088"
  },
  "portal": false,
  "area": "host-invocation-routing",
  "reviewStatus": "pending",
  "oldDestination": "../../../architect/host-invocation-routing/rust-cli-and-proof-components-plan.md",
  "newDestination": "../README.md",
  "alias": {
    "fromPath": "docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md",
    "toOwner": "docs/platform/host-invocation-routing/README.md",
    "toAnchor": null,
    "kind": "redirected",
    "evidenceRef": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
    "immutableRefs": [],
    "recordedAt": "2026-10-13",
    "aliasId": "host-invocation-draft-088"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Rust Host And Proof Providers Implementation Plan",
    "anchor": "rust-host-and-proof-providers-implementation-plan",
    "githubAnchor": "rust-host-and-proof-providers-implementation-plan",
    "stableAnchor": "h-7d1211de80c1",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "78b93c88e219b1c9d3ba3ff1613c6e755272edd193032b9b104c9fed980d340e",
    "sample": "Rust Host And Proof Providers Implementation Plan",
    "sectionPayloadDigest": "c5f05efd1ef3cd806a723b0bb4ebaf3f2e570267d8c3596ef90bb5655a0b9f31",
    "followingBlockDigest": "bbf58c843d81479697f50cb65c3a1570f2aa9b42bc6222cbbbdb153ad2ce0e02",
    "identityFingerprint": "dbc40c8c218fa48a2d6a07e5b78e9742987c5dfe3997e472f0fc93bf685ad3c0",
    "ancestry": [],
    "text": "# Rust Host And Proof Providers Implementation Plan",
    "sectionText": "# Rust Host And Proof Providers Implementation Plan\n\n**Status:** Proposed execution plan; blocked only by the remaining §3 decisions\n(target matrix, preview-vs-stable, compatibility-window duration) and the\npackaging stream's `fgctl` walking skeleton (§4, node `PK`).\n**Date:** 2026-09-04.\n**Revised:** 2026-09-10 (see plans/reports/architecture-review-260910-1537-host-invocation-provider-routing-design-review.md).\n**Architecture:** [Host Invocation And Provider Routing](./host-invocation-provider-routing.md).\n**Migration strategy:** [Node To Rust Component Migration](./node-to-rust-component-migration.md).\n**Component placement:** [fgOS Component Boundary Advisory](../component-boundary/component-boundary-advisory.md).\n**Distribution/activation authority:** [Runtime Identity And Activation](../packaging-distribution/runtime-identity-and-activation.md); this plan consumes that stream's walking skeleton, it does not redefine install/activation.\n\nThis document contains execution order, deliverables, gates, verification, and\nrollback. Semantic contracts, provider lifecycle, authority, framing, registry\nrules, compatibility modes, and technical trade-offs are owned by the\narchitecture document and are intentionally not redefined here."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Host Invocation",
    "anchor": "host-invocation",
    "githubAnchor": "host-invocation",
    "stableAnchor": "h-9674073175c5",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "cc682e1a901b39ba480c2a95282077b85597b0d8ee6aa24bd7dcd71c8de20739",
    "sample": "Host Invocation",
    "sectionPayloadDigest": "4906b85c6c780d8a9dcf4b69f592806ac5301cf33aa4d638e0c88c98046f9e9e",
    "followingBlockDigest": "4906b85c6c780d8a9dcf4b69f592806ac5301cf33aa4d638e0c88c98046f9e9e",
    "identityFingerprint": "2f2cd30c374c59bab51ddaebeadfb9338d8540794673fcc6fc53dfc281b37d78",
    "ancestry": [],
    "text": "# Host Invocation",
    "sectionText": "# Host Invocation\n\n```txt\nDocument type: Area portal\nAudience: Human reviewer, architect, maintainer, implementation agent\nPurpose: Route readers through fgOS host invocation, provider routing, legacy CLI transition, and external provider docs\nDesign status: Draft\nImplementation status: R1/R2/R3 implemented preview plus partial route migration\nCanonical: Yes, after review\nOwner: Platform documentation\nSource type: Promoted from docs/architect/host-invocation-routing/**\nLast reviewed: 2026-09-18\nImplementation: Existing dated R1/R2/R3 preview records; candidate carriage and current truth await independent checkpoint review\nProvenance: Six pinned legacy sources and the frozen Host Invocation area map; retained policy is non-authority history\nWriter type: Agent\nCanonical for: Promoted area navigation only; candidate document claims are not promoted by this edit\nUse this when: Finding the host invocation contract, selected migration direction and its proof boundaries\nDo not use this for: Selecting or installing a runtime, certifying current route counts, or treating dated plans as shipped code\nSupersedes: None; legacy source authority remains unchanged during candidate transformation\nSuperseded by: None\nRelated:\n- docs/platform/host-invocation-routing/vision.md\n- docs/platform/host-invocation-routing/intent-preservation-ledger.md\n- docs/platform/host-invocation-routing/spec.md\n- docs/platform/host-invocation-routing/roadmap.md\n- docs/platform/host-invocation-routing/architecture/invocation-kernel.md\n- docs/platform/host-invocation-routing/architecture/provider-routing.md\n- docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md\n- docs/platform/host-invocation-routing/contracts/operation-request-outcome.md\n- docs/platform/host-invocation-routing/contracts/command-route-descriptor.md\n- docs/platform/host-invocation-routing/verification/implementation-alignment.md\n- docs/platform/host-invocation-routing/history/source-inventory.md\n- docs/platform/host-invocation-routing/verification/source-preservation-audit.md\n- docs/platform/host-invocation-routing/decisions/README.md\n```"
  }
}
```

## Entry f-211: link-211

```json
{
  "id": "link-211",
  "path": "docs/platform/host-invocation-routing/vision.md",
  "inputLine": 57,
  "inputColumn": 129,
  "lineBeforeLinkPass": 65,
  "before": "[host-invocation-provider-routing.md](../../architect/host-invocation-routing/host-invocation-provider-routing.md)",
  "after": "[host-invocation-provider-routing.md](README.md)",
  "legacyPath": "docs/architect/host-invocation-routing/host-invocation-provider-routing.md",
  "target": {
    "path": "docs/platform/host-invocation-routing/README.md",
    "anchor": null,
    "aliasId": "host-invocation-draft-037"
  },
  "portal": false,
  "area": "host-invocation-routing",
  "reviewStatus": "pending",
  "oldDestination": "../../architect/host-invocation-routing/host-invocation-provider-routing.md",
  "newDestination": "README.md",
  "alias": {
    "fromPath": "docs/architect/host-invocation-routing/host-invocation-provider-routing.md",
    "toOwner": "docs/platform/host-invocation-routing/README.md",
    "toAnchor": null,
    "kind": "redirected",
    "evidenceRef": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
    "immutableRefs": [],
    "recordedAt": "2026-10-13",
    "aliasId": "host-invocation-draft-037"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Host Invocation And Provider Routing Architecture",
    "anchor": "host-invocation-and-provider-routing-architecture",
    "githubAnchor": "host-invocation-and-provider-routing-architecture",
    "stableAnchor": "h-699de63b2a62",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "05b7c0f19374f9f956c217241c508227641d20b1c4221b348777f23611b6e7df",
    "sample": "Host Invocation And Provider Routing Architecture",
    "sectionPayloadDigest": "797624eb16ce2d9c44b3fdb73c1a8aab61651fa8d134d55a3e8d05c6e32f1f65",
    "followingBlockDigest": "b5d90a2f82ebb7b1b4cc9fb4d388233e24a26f68be6ed5ee2990b783e1a36a62",
    "identityFingerprint": "2d3ca53446822aa5d2922de7b0280861ec0662ed278325b22c3a3c9a8c9183c8",
    "ancestry": [],
    "text": "# Host Invocation And Provider Routing Architecture",
    "sectionText": "# Host Invocation And Provider Routing Architecture\n\n**Status:** Vision / architecture advisory, not a locked platform law and not an implementation plan.\n**Date:** 2026-09-10.\n**Revised:** per [architecture-review-260910-1537-host-invocation-provider-routing-design-review.md](../../../plans/reports/architecture-review-260910-1537-host-invocation-provider-routing-design-review.md).\n**Source:** Product-owner component-boundary and Node-to-Rust migration discussion.\n\nThis is the **kernel contract**: the permanent invocation/routing boundary every fgOS host uses, independent of transport (CLI, remote, chat) and provider mechanism (built-in, legacy Node, external process, WASM). Ecosystem plugin mechanics: [External Provider Protocol](./external-provider-protocol.md). Transitional Node CLI lane: [Legacy CLI Transition](./legacy-cli-transition.md). Both depend on this document. Migration staging and first proof: [Node To Rust Component Migration](./node-to-rust-component-migration.md), [Rust Host And Proof Providers Implementation Plan](./rust-cli-and-proof-components-plan.md)."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Host Invocation",
    "anchor": "host-invocation",
    "githubAnchor": "host-invocation",
    "stableAnchor": "h-9674073175c5",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "cc682e1a901b39ba480c2a95282077b85597b0d8ee6aa24bd7dcd71c8de20739",
    "sample": "Host Invocation",
    "sectionPayloadDigest": "4906b85c6c780d8a9dcf4b69f592806ac5301cf33aa4d638e0c88c98046f9e9e",
    "followingBlockDigest": "4906b85c6c780d8a9dcf4b69f592806ac5301cf33aa4d638e0c88c98046f9e9e",
    "identityFingerprint": "2f2cd30c374c59bab51ddaebeadfb9338d8540794673fcc6fc53dfc281b37d78",
    "ancestry": [],
    "text": "# Host Invocation",
    "sectionText": "# Host Invocation\n\n```txt\nDocument type: Area portal\nAudience: Human reviewer, architect, maintainer, implementation agent\nPurpose: Route readers through fgOS host invocation, provider routing, legacy CLI transition, and external provider docs\nDesign status: Draft\nImplementation status: R1/R2/R3 implemented preview plus partial route migration\nCanonical: Yes, after review\nOwner: Platform documentation\nSource type: Promoted from docs/architect/host-invocation-routing/**\nLast reviewed: 2026-09-18\nImplementation: Existing dated R1/R2/R3 preview records; candidate carriage and current truth await independent checkpoint review\nProvenance: Six pinned legacy sources and the frozen Host Invocation area map; retained policy is non-authority history\nWriter type: Agent\nCanonical for: Promoted area navigation only; candidate document claims are not promoted by this edit\nUse this when: Finding the host invocation contract, selected migration direction and its proof boundaries\nDo not use this for: Selecting or installing a runtime, certifying current route counts, or treating dated plans as shipped code\nSupersedes: None; legacy source authority remains unchanged during candidate transformation\nSuperseded by: None\nRelated:\n- docs/platform/host-invocation-routing/vision.md\n- docs/platform/host-invocation-routing/intent-preservation-ledger.md\n- docs/platform/host-invocation-routing/spec.md\n- docs/platform/host-invocation-routing/roadmap.md\n- docs/platform/host-invocation-routing/architecture/invocation-kernel.md\n- docs/platform/host-invocation-routing/architecture/provider-routing.md\n- docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md\n- docs/platform/host-invocation-routing/contracts/operation-request-outcome.md\n- docs/platform/host-invocation-routing/contracts/command-route-descriptor.md\n- docs/platform/host-invocation-routing/verification/implementation-alignment.md\n- docs/platform/host-invocation-routing/history/source-inventory.md\n- docs/platform/host-invocation-routing/verification/source-preservation-audit.md\n- docs/platform/host-invocation-routing/decisions/README.md\n```"
  }
}
```

## Entry f-212: link-212

```json
{
  "id": "link-212",
  "path": "docs/platform/host-invocation-routing/vision.md",
  "inputLine": 58,
  "inputColumn": 186,
  "lineBeforeLinkPass": 66,
  "before": "[legacy-cli-transition.md](../../architect/host-invocation-routing/legacy-cli-transition.md)",
  "after": "[legacy-cli-transition.md](README.md)",
  "legacyPath": "docs/architect/host-invocation-routing/legacy-cli-transition.md",
  "target": {
    "path": "docs/platform/host-invocation-routing/README.md",
    "anchor": null,
    "aliasId": "host-invocation-draft-052"
  },
  "portal": false,
  "area": "host-invocation-routing",
  "reviewStatus": "pending",
  "oldDestination": "../../architect/host-invocation-routing/legacy-cli-transition.md",
  "newDestination": "README.md",
  "alias": {
    "fromPath": "docs/architect/host-invocation-routing/legacy-cli-transition.md",
    "toOwner": "docs/platform/host-invocation-routing/README.md",
    "toAnchor": null,
    "kind": "redirected",
    "evidenceRef": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
    "immutableRefs": [],
    "recordedAt": "2026-10-13",
    "aliasId": "host-invocation-draft-052"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Legacy CLI Transition",
    "anchor": "legacy-cli-transition",
    "githubAnchor": "legacy-cli-transition",
    "stableAnchor": "h-dc70efc6804e",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "882786e83f6fcf97ec9230a8eb8cac4c050823310061348dd3d85cb609dbe329",
    "sample": "Legacy CLI Transition",
    "sectionPayloadDigest": "7b54ed05cfd159ebb37eed166b94ffa4c76aac3e113078bbef9683d49d647156",
    "followingBlockDigest": "ab6730b94dcd1c31dcc6afb6fffd7a83d53310f5850673f5663db952bd87f5c1",
    "identityFingerprint": "e597222ce0b65b2a68602b1aa4d9351bbfc26ee04ae227cc7b2c97817eefcd3a",
    "ancestry": [],
    "text": "# Legacy CLI Transition",
    "sectionText": "# Legacy CLI Transition\n\n**Status:** Vision / architecture advisory, not a locked platform law and not an implementation plan.\n**Date:** 2026-09-10.\n**Revised:** per [architecture-review-260910-1537-host-invocation-provider-routing-design-review.md](../../../plans/reports/architecture-review-260910-1537-host-invocation-provider-routing-design-review.md).\n\nThis document depends on the kernel contract in [Host Invocation And Provider Routing](./host-invocation-provider-routing.md) — read it first, in particular \"Transitional CLI Lane\" under §4 and `CommandRouteDescriptor` in the §3 name table. The kernel has exactly one input (`OperationRequest`) and one output (`ProviderOutcome`); everything in this document is CLI-adapter-local scaffolding that disappears once Node migration completes. Nothing here introduces a second kernel input or output type — the legacy lane never reaches the Router or `InvocationService` at all (see §1 below)."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Host Invocation",
    "anchor": "host-invocation",
    "githubAnchor": "host-invocation",
    "stableAnchor": "h-9674073175c5",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "cc682e1a901b39ba480c2a95282077b85597b0d8ee6aa24bd7dcd71c8de20739",
    "sample": "Host Invocation",
    "sectionPayloadDigest": "4906b85c6c780d8a9dcf4b69f592806ac5301cf33aa4d638e0c88c98046f9e9e",
    "followingBlockDigest": "4906b85c6c780d8a9dcf4b69f592806ac5301cf33aa4d638e0c88c98046f9e9e",
    "identityFingerprint": "2f2cd30c374c59bab51ddaebeadfb9338d8540794673fcc6fc53dfc281b37d78",
    "ancestry": [],
    "text": "# Host Invocation",
    "sectionText": "# Host Invocation\n\n```txt\nDocument type: Area portal\nAudience: Human reviewer, architect, maintainer, implementation agent\nPurpose: Route readers through fgOS host invocation, provider routing, legacy CLI transition, and external provider docs\nDesign status: Draft\nImplementation status: R1/R2/R3 implemented preview plus partial route migration\nCanonical: Yes, after review\nOwner: Platform documentation\nSource type: Promoted from docs/architect/host-invocation-routing/**\nLast reviewed: 2026-09-18\nImplementation: Existing dated R1/R2/R3 preview records; candidate carriage and current truth await independent checkpoint review\nProvenance: Six pinned legacy sources and the frozen Host Invocation area map; retained policy is non-authority history\nWriter type: Agent\nCanonical for: Promoted area navigation only; candidate document claims are not promoted by this edit\nUse this when: Finding the host invocation contract, selected migration direction and its proof boundaries\nDo not use this for: Selecting or installing a runtime, certifying current route counts, or treating dated plans as shipped code\nSupersedes: None; legacy source authority remains unchanged during candidate transformation\nSuperseded by: None\nRelated:\n- docs/platform/host-invocation-routing/vision.md\n- docs/platform/host-invocation-routing/intent-preservation-ledger.md\n- docs/platform/host-invocation-routing/spec.md\n- docs/platform/host-invocation-routing/roadmap.md\n- docs/platform/host-invocation-routing/architecture/invocation-kernel.md\n- docs/platform/host-invocation-routing/architecture/provider-routing.md\n- docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md\n- docs/platform/host-invocation-routing/contracts/operation-request-outcome.md\n- docs/platform/host-invocation-routing/contracts/command-route-descriptor.md\n- docs/platform/host-invocation-routing/verification/implementation-alignment.md\n- docs/platform/host-invocation-routing/history/source-inventory.md\n- docs/platform/host-invocation-routing/verification/source-preservation-audit.md\n- docs/platform/host-invocation-routing/decisions/README.md\n```"
  }
}
```

## Entry f-213: link-213

```json
{
  "id": "link-213",
  "path": "docs/platform/host-invocation-routing/vision.md",
  "inputLine": 59,
  "inputColumn": 145,
  "lineBeforeLinkPass": 67,
  "before": "[external-provider-protocol.md](../../architect/host-invocation-routing/external-provider-protocol.md)",
  "after": "[external-provider-protocol.md](README.md)",
  "legacyPath": "docs/architect/host-invocation-routing/external-provider-protocol.md",
  "target": {
    "path": "docs/platform/host-invocation-routing/README.md",
    "anchor": null,
    "aliasId": "host-invocation-draft-026"
  },
  "portal": false,
  "area": "host-invocation-routing",
  "reviewStatus": "pending",
  "oldDestination": "../../architect/host-invocation-routing/external-provider-protocol.md",
  "newDestination": "README.md",
  "alias": {
    "fromPath": "docs/architect/host-invocation-routing/external-provider-protocol.md",
    "toOwner": "docs/platform/host-invocation-routing/README.md",
    "toAnchor": null,
    "kind": "redirected",
    "evidenceRef": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
    "immutableRefs": [],
    "recordedAt": "2026-10-13",
    "aliasId": "host-invocation-draft-026"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "External Provider Protocol",
    "anchor": "external-provider-protocol",
    "githubAnchor": "external-provider-protocol",
    "stableAnchor": "h-68c01c1d2777",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "f85ccab90dedc3cbc516243044e189fc2dee638bd9b4a3ba6cbc057a739a9ac8",
    "sample": "External Provider Protocol",
    "sectionPayloadDigest": "b350f69d5e37894f50da3d3fe34073d9709f581d17dcaf972f8c1aae1745e7f6",
    "followingBlockDigest": "ab6730b94dcd1c31dcc6afb6fffd7a83d53310f5850673f5663db952bd87f5c1",
    "identityFingerprint": "c89837a09eb5766bcca5aaac2b7cafb99a456e36e310e49f2e921cac3ebfd06d",
    "ancestry": [],
    "text": "# External Provider Protocol",
    "sectionText": "# External Provider Protocol\n\n**Status:** Vision / architecture advisory, not a locked platform law and not an implementation plan.\n**Date:** 2026-09-10.\n**Revised:** per [architecture-review-260910-1537-host-invocation-provider-routing-design-review.md](../../../plans/reports/architecture-review-260910-1537-host-invocation-provider-routing-design-review.md).\n\nThis document depends on the kernel contract in [Host Invocation And Provider Routing](./host-invocation-provider-routing.md) — read it first for `OperationId`, `OperationRequest`, `ProviderOutcome`, `ProviderDescriptor`, `OperationProvider`, `RegistrySnapshot`, the Router, and `InvocationService`. This document covers everything specific to a provider that lives outside a statically linked Rust crate: component classes (who owns/releases it), invocation mechanisms (how it is reached), the wire protocol, and the plugin registry linker that turns manifests into a `RegistrySnapshot`."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Host Invocation",
    "anchor": "host-invocation",
    "githubAnchor": "host-invocation",
    "stableAnchor": "h-9674073175c5",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "cc682e1a901b39ba480c2a95282077b85597b0d8ee6aa24bd7dcd71c8de20739",
    "sample": "Host Invocation",
    "sectionPayloadDigest": "4906b85c6c780d8a9dcf4b69f592806ac5301cf33aa4d638e0c88c98046f9e9e",
    "followingBlockDigest": "4906b85c6c780d8a9dcf4b69f592806ac5301cf33aa4d638e0c88c98046f9e9e",
    "identityFingerprint": "2f2cd30c374c59bab51ddaebeadfb9338d8540794673fcc6fc53dfc281b37d78",
    "ancestry": [],
    "text": "# Host Invocation",
    "sectionText": "# Host Invocation\n\n```txt\nDocument type: Area portal\nAudience: Human reviewer, architect, maintainer, implementation agent\nPurpose: Route readers through fgOS host invocation, provider routing, legacy CLI transition, and external provider docs\nDesign status: Draft\nImplementation status: R1/R2/R3 implemented preview plus partial route migration\nCanonical: Yes, after review\nOwner: Platform documentation\nSource type: Promoted from docs/architect/host-invocation-routing/**\nLast reviewed: 2026-09-18\nImplementation: Existing dated R1/R2/R3 preview records; candidate carriage and current truth await independent checkpoint review\nProvenance: Six pinned legacy sources and the frozen Host Invocation area map; retained policy is non-authority history\nWriter type: Agent\nCanonical for: Promoted area navigation only; candidate document claims are not promoted by this edit\nUse this when: Finding the host invocation contract, selected migration direction and its proof boundaries\nDo not use this for: Selecting or installing a runtime, certifying current route counts, or treating dated plans as shipped code\nSupersedes: None; legacy source authority remains unchanged during candidate transformation\nSuperseded by: None\nRelated:\n- docs/platform/host-invocation-routing/vision.md\n- docs/platform/host-invocation-routing/intent-preservation-ledger.md\n- docs/platform/host-invocation-routing/spec.md\n- docs/platform/host-invocation-routing/roadmap.md\n- docs/platform/host-invocation-routing/architecture/invocation-kernel.md\n- docs/platform/host-invocation-routing/architecture/provider-routing.md\n- docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md\n- docs/platform/host-invocation-routing/contracts/operation-request-outcome.md\n- docs/platform/host-invocation-routing/contracts/command-route-descriptor.md\n- docs/platform/host-invocation-routing/verification/implementation-alignment.md\n- docs/platform/host-invocation-routing/history/source-inventory.md\n- docs/platform/host-invocation-routing/verification/source-preservation-audit.md\n- docs/platform/host-invocation-routing/decisions/README.md\n```"
  }
}
```

## Entry f-214: link-214

```json
{
  "id": "link-214",
  "path": "docs/platform/host-invocation-routing/vision.md",
  "inputLine": 60,
  "inputColumn": 149,
  "lineBeforeLinkPass": 68,
  "before": "[node-to-rust-component-migration.md](../../architect/host-invocation-routing/node-to-rust-component-migration.md)",
  "after": "[node-to-rust-component-migration.md](README.md)",
  "legacyPath": "docs/architect/host-invocation-routing/node-to-rust-component-migration.md",
  "target": {
    "path": "docs/platform/host-invocation-routing/README.md",
    "anchor": null,
    "aliasId": "host-invocation-draft-061"
  },
  "portal": false,
  "area": "host-invocation-routing",
  "reviewStatus": "pending",
  "oldDestination": "../../architect/host-invocation-routing/node-to-rust-component-migration.md",
  "newDestination": "README.md",
  "alias": {
    "fromPath": "docs/architect/host-invocation-routing/node-to-rust-component-migration.md",
    "toOwner": "docs/platform/host-invocation-routing/README.md",
    "toAnchor": null,
    "kind": "redirected",
    "evidenceRef": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
    "immutableRefs": [],
    "recordedAt": "2026-10-13",
    "aliasId": "host-invocation-draft-061"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Node To Rust Component Migration",
    "anchor": "node-to-rust-component-migration",
    "githubAnchor": "node-to-rust-component-migration",
    "stableAnchor": "h-b4de1922ccc4",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "24e0aa773ffabc724acf02f1b1c6f96aaedfc26582081dd323103b4146ef3621",
    "sample": "Node To Rust Component Migration",
    "sectionPayloadDigest": "56cf264d990b67f6fdd7c1c1bd0b4ce4891014bece3dad995ef381e4c7eeb164",
    "followingBlockDigest": "206fd476551e3bbbbdc0ebf45aa95e5254c49d31e21e9fc83de16d91ee3f0731",
    "identityFingerprint": "b481481ac015aebf2e03ff1aae8b1710e4f2eddaf4606b848d0690c68bab5ec1",
    "ancestry": [],
    "text": "# Node To Rust Component Migration",
    "sectionText": "# Node To Rust Component Migration\n\n**Status:** Selected migration direction, not an implementation plan.\n**Date:** 2026-09-01.\n**Revised:** 2026-09-10 (see\nplans/reports/architecture-review-260910-1537-host-invocation-provider-routing-design-review.md).\n**Selected direction (2026-09-03; revised 2026-09-04, 2026-09-10):** ship the\ndistributable Rust `fgos` CLI host in R1, with every unmigrated selector\nresolved by the CLI adapter to the legacy-cli lane and exec'd straight to the\nNode payload, never entering the kernel; prove external process providers in\nR2 and the production remote peer in R3; then replace semantic operations one\ncomponent at a time with native Rust providers.\n**Source:** Product-owner planning and follow-up component-boundary discussion.\n\nThis document discusses only migration options, ordering, transition stages,\ncutover, and rollback. The stable host model, peer CLI/remote host use cases,\nOperation Provider Router, provider mechanics, protocols, plugin registry,\nauthority, and technical tradeoffs live in\n[Host Invocation And Provider Routing Architecture](./host-invocation-provider-routing.md).\nComponent ownership, authority boundaries, and the physical placement compass\nfor files/crates/components live in\n[fgOS Component Boundary Advisory](../component-boundary/component-boundary-advisory.md);\nevery native migration slice must read it before choosing where a provider or\ncomponent module lives.\nThe executable work breakdown lives in\n[Rust Host And Proof Providers Implementation Plan](./rust-cli-and-proof-components-plan.md)."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Host Invocation",
    "anchor": "host-invocation",
    "githubAnchor": "host-invocation",
    "stableAnchor": "h-9674073175c5",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "cc682e1a901b39ba480c2a95282077b85597b0d8ee6aa24bd7dcd71c8de20739",
    "sample": "Host Invocation",
    "sectionPayloadDigest": "4906b85c6c780d8a9dcf4b69f592806ac5301cf33aa4d638e0c88c98046f9e9e",
    "followingBlockDigest": "4906b85c6c780d8a9dcf4b69f592806ac5301cf33aa4d638e0c88c98046f9e9e",
    "identityFingerprint": "2f2cd30c374c59bab51ddaebeadfb9338d8540794673fcc6fc53dfc281b37d78",
    "ancestry": [],
    "text": "# Host Invocation",
    "sectionText": "# Host Invocation\n\n```txt\nDocument type: Area portal\nAudience: Human reviewer, architect, maintainer, implementation agent\nPurpose: Route readers through fgOS host invocation, provider routing, legacy CLI transition, and external provider docs\nDesign status: Draft\nImplementation status: R1/R2/R3 implemented preview plus partial route migration\nCanonical: Yes, after review\nOwner: Platform documentation\nSource type: Promoted from docs/architect/host-invocation-routing/**\nLast reviewed: 2026-09-18\nImplementation: Existing dated R1/R2/R3 preview records; candidate carriage and current truth await independent checkpoint review\nProvenance: Six pinned legacy sources and the frozen Host Invocation area map; retained policy is non-authority history\nWriter type: Agent\nCanonical for: Promoted area navigation only; candidate document claims are not promoted by this edit\nUse this when: Finding the host invocation contract, selected migration direction and its proof boundaries\nDo not use this for: Selecting or installing a runtime, certifying current route counts, or treating dated plans as shipped code\nSupersedes: None; legacy source authority remains unchanged during candidate transformation\nSuperseded by: None\nRelated:\n- docs/platform/host-invocation-routing/vision.md\n- docs/platform/host-invocation-routing/intent-preservation-ledger.md\n- docs/platform/host-invocation-routing/spec.md\n- docs/platform/host-invocation-routing/roadmap.md\n- docs/platform/host-invocation-routing/architecture/invocation-kernel.md\n- docs/platform/host-invocation-routing/architecture/provider-routing.md\n- docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md\n- docs/platform/host-invocation-routing/contracts/operation-request-outcome.md\n- docs/platform/host-invocation-routing/contracts/command-route-descriptor.md\n- docs/platform/host-invocation-routing/verification/implementation-alignment.md\n- docs/platform/host-invocation-routing/history/source-inventory.md\n- docs/platform/host-invocation-routing/verification/source-preservation-audit.md\n- docs/platform/host-invocation-routing/decisions/README.md\n```"
  }
}
```

## Entry f-215: link-215

```json
{
  "id": "link-215",
  "path": "docs/platform/host-invocation-routing/vision.md",
  "inputLine": 71,
  "inputColumn": 25,
  "lineBeforeLinkPass": 79,
  "before": "[../../architect/host-invocation-routing/host-invocation-provider-routing.md](../../architect/host-invocation-routing/host-invocation-provider-routing.md)",
  "after": "[../../architect/host-invocation-routing/host-invocation-provider-routing.md](README.md)",
  "legacyPath": "docs/architect/host-invocation-routing/host-invocation-provider-routing.md",
  "target": {
    "path": "docs/platform/host-invocation-routing/README.md",
    "anchor": null,
    "aliasId": "host-invocation-draft-037"
  },
  "portal": false,
  "area": "host-invocation-routing",
  "reviewStatus": "pending",
  "oldDestination": "../../architect/host-invocation-routing/host-invocation-provider-routing.md",
  "newDestination": "README.md",
  "alias": {
    "fromPath": "docs/architect/host-invocation-routing/host-invocation-provider-routing.md",
    "toOwner": "docs/platform/host-invocation-routing/README.md",
    "toAnchor": null,
    "kind": "redirected",
    "evidenceRef": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
    "immutableRefs": [],
    "recordedAt": "2026-10-13",
    "aliasId": "host-invocation-draft-037"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Host Invocation And Provider Routing Architecture",
    "anchor": "host-invocation-and-provider-routing-architecture",
    "githubAnchor": "host-invocation-and-provider-routing-architecture",
    "stableAnchor": "h-699de63b2a62",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "05b7c0f19374f9f956c217241c508227641d20b1c4221b348777f23611b6e7df",
    "sample": "Host Invocation And Provider Routing Architecture",
    "sectionPayloadDigest": "797624eb16ce2d9c44b3fdb73c1a8aab61651fa8d134d55a3e8d05c6e32f1f65",
    "followingBlockDigest": "b5d90a2f82ebb7b1b4cc9fb4d388233e24a26f68be6ed5ee2990b783e1a36a62",
    "identityFingerprint": "2d3ca53446822aa5d2922de7b0280861ec0662ed278325b22c3a3c9a8c9183c8",
    "ancestry": [],
    "text": "# Host Invocation And Provider Routing Architecture",
    "sectionText": "# Host Invocation And Provider Routing Architecture\n\n**Status:** Vision / architecture advisory, not a locked platform law and not an implementation plan.\n**Date:** 2026-09-10.\n**Revised:** per [architecture-review-260910-1537-host-invocation-provider-routing-design-review.md](../../../plans/reports/architecture-review-260910-1537-host-invocation-provider-routing-design-review.md).\n**Source:** Product-owner component-boundary and Node-to-Rust migration discussion.\n\nThis is the **kernel contract**: the permanent invocation/routing boundary every fgOS host uses, independent of transport (CLI, remote, chat) and provider mechanism (built-in, legacy Node, external process, WASM). Ecosystem plugin mechanics: [External Provider Protocol](./external-provider-protocol.md). Transitional Node CLI lane: [Legacy CLI Transition](./legacy-cli-transition.md). Both depend on this document. Migration staging and first proof: [Node To Rust Component Migration](./node-to-rust-component-migration.md), [Rust Host And Proof Providers Implementation Plan](./rust-cli-and-proof-components-plan.md)."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Host Invocation",
    "anchor": "host-invocation",
    "githubAnchor": "host-invocation",
    "stableAnchor": "h-9674073175c5",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "cc682e1a901b39ba480c2a95282077b85597b0d8ee6aa24bd7dcd71c8de20739",
    "sample": "Host Invocation",
    "sectionPayloadDigest": "4906b85c6c780d8a9dcf4b69f592806ac5301cf33aa4d638e0c88c98046f9e9e",
    "followingBlockDigest": "4906b85c6c780d8a9dcf4b69f592806ac5301cf33aa4d638e0c88c98046f9e9e",
    "identityFingerprint": "2f2cd30c374c59bab51ddaebeadfb9338d8540794673fcc6fc53dfc281b37d78",
    "ancestry": [],
    "text": "# Host Invocation",
    "sectionText": "# Host Invocation\n\n```txt\nDocument type: Area portal\nAudience: Human reviewer, architect, maintainer, implementation agent\nPurpose: Route readers through fgOS host invocation, provider routing, legacy CLI transition, and external provider docs\nDesign status: Draft\nImplementation status: R1/R2/R3 implemented preview plus partial route migration\nCanonical: Yes, after review\nOwner: Platform documentation\nSource type: Promoted from docs/architect/host-invocation-routing/**\nLast reviewed: 2026-09-18\nImplementation: Existing dated R1/R2/R3 preview records; candidate carriage and current truth await independent checkpoint review\nProvenance: Six pinned legacy sources and the frozen Host Invocation area map; retained policy is non-authority history\nWriter type: Agent\nCanonical for: Promoted area navigation only; candidate document claims are not promoted by this edit\nUse this when: Finding the host invocation contract, selected migration direction and its proof boundaries\nDo not use this for: Selecting or installing a runtime, certifying current route counts, or treating dated plans as shipped code\nSupersedes: None; legacy source authority remains unchanged during candidate transformation\nSuperseded by: None\nRelated:\n- docs/platform/host-invocation-routing/vision.md\n- docs/platform/host-invocation-routing/intent-preservation-ledger.md\n- docs/platform/host-invocation-routing/spec.md\n- docs/platform/host-invocation-routing/roadmap.md\n- docs/platform/host-invocation-routing/architecture/invocation-kernel.md\n- docs/platform/host-invocation-routing/architecture/provider-routing.md\n- docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md\n- docs/platform/host-invocation-routing/contracts/operation-request-outcome.md\n- docs/platform/host-invocation-routing/contracts/command-route-descriptor.md\n- docs/platform/host-invocation-routing/verification/implementation-alignment.md\n- docs/platform/host-invocation-routing/history/source-inventory.md\n- docs/platform/host-invocation-routing/verification/source-preservation-audit.md\n- docs/platform/host-invocation-routing/decisions/README.md\n```"
  }
}
```

## Entry f-216: link-216

```json
{
  "id": "link-216",
  "path": "docs/platform/host-invocation-routing/vision.md",
  "inputLine": 72,
  "inputColumn": 31,
  "lineBeforeLinkPass": 80,
  "before": "[../../architect/host-invocation-routing/node-to-rust-component-migration.md](../../architect/host-invocation-routing/node-to-rust-component-migration.md)",
  "after": "[../../architect/host-invocation-routing/node-to-rust-component-migration.md](README.md)",
  "legacyPath": "docs/architect/host-invocation-routing/node-to-rust-component-migration.md",
  "target": {
    "path": "docs/platform/host-invocation-routing/README.md",
    "anchor": null,
    "aliasId": "host-invocation-draft-061"
  },
  "portal": false,
  "area": "host-invocation-routing",
  "reviewStatus": "pending",
  "oldDestination": "../../architect/host-invocation-routing/node-to-rust-component-migration.md",
  "newDestination": "README.md",
  "alias": {
    "fromPath": "docs/architect/host-invocation-routing/node-to-rust-component-migration.md",
    "toOwner": "docs/platform/host-invocation-routing/README.md",
    "toAnchor": null,
    "kind": "redirected",
    "evidenceRef": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
    "immutableRefs": [],
    "recordedAt": "2026-10-13",
    "aliasId": "host-invocation-draft-061"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Node To Rust Component Migration",
    "anchor": "node-to-rust-component-migration",
    "githubAnchor": "node-to-rust-component-migration",
    "stableAnchor": "h-b4de1922ccc4",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "24e0aa773ffabc724acf02f1b1c6f96aaedfc26582081dd323103b4146ef3621",
    "sample": "Node To Rust Component Migration",
    "sectionPayloadDigest": "56cf264d990b67f6fdd7c1c1bd0b4ce4891014bece3dad995ef381e4c7eeb164",
    "followingBlockDigest": "206fd476551e3bbbbdc0ebf45aa95e5254c49d31e21e9fc83de16d91ee3f0731",
    "identityFingerprint": "b481481ac015aebf2e03ff1aae8b1710e4f2eddaf4606b848d0690c68bab5ec1",
    "ancestry": [],
    "text": "# Node To Rust Component Migration",
    "sectionText": "# Node To Rust Component Migration\n\n**Status:** Selected migration direction, not an implementation plan.\n**Date:** 2026-09-01.\n**Revised:** 2026-09-10 (see\nplans/reports/architecture-review-260910-1537-host-invocation-provider-routing-design-review.md).\n**Selected direction (2026-09-03; revised 2026-09-04, 2026-09-10):** ship the\ndistributable Rust `fgos` CLI host in R1, with every unmigrated selector\nresolved by the CLI adapter to the legacy-cli lane and exec'd straight to the\nNode payload, never entering the kernel; prove external process providers in\nR2 and the production remote peer in R3; then replace semantic operations one\ncomponent at a time with native Rust providers.\n**Source:** Product-owner planning and follow-up component-boundary discussion.\n\nThis document discusses only migration options, ordering, transition stages,\ncutover, and rollback. The stable host model, peer CLI/remote host use cases,\nOperation Provider Router, provider mechanics, protocols, plugin registry,\nauthority, and technical tradeoffs live in\n[Host Invocation And Provider Routing Architecture](./host-invocation-provider-routing.md).\nComponent ownership, authority boundaries, and the physical placement compass\nfor files/crates/components live in\n[fgOS Component Boundary Advisory](../component-boundary/component-boundary-advisory.md);\nevery native migration slice must read it before choosing where a provider or\ncomponent module lives.\nThe executable work breakdown lives in\n[Rust Host And Proof Providers Implementation Plan](./rust-cli-and-proof-components-plan.md)."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Host Invocation",
    "anchor": "host-invocation",
    "githubAnchor": "host-invocation",
    "stableAnchor": "h-9674073175c5",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "cc682e1a901b39ba480c2a95282077b85597b0d8ee6aa24bd7dcd71c8de20739",
    "sample": "Host Invocation",
    "sectionPayloadDigest": "4906b85c6c780d8a9dcf4b69f592806ac5301cf33aa4d638e0c88c98046f9e9e",
    "followingBlockDigest": "4906b85c6c780d8a9dcf4b69f592806ac5301cf33aa4d638e0c88c98046f9e9e",
    "identityFingerprint": "2f2cd30c374c59bab51ddaebeadfb9338d8540794673fcc6fc53dfc281b37d78",
    "ancestry": [],
    "text": "# Host Invocation",
    "sectionText": "# Host Invocation\n\n```txt\nDocument type: Area portal\nAudience: Human reviewer, architect, maintainer, implementation agent\nPurpose: Route readers through fgOS host invocation, provider routing, legacy CLI transition, and external provider docs\nDesign status: Draft\nImplementation status: R1/R2/R3 implemented preview plus partial route migration\nCanonical: Yes, after review\nOwner: Platform documentation\nSource type: Promoted from docs/architect/host-invocation-routing/**\nLast reviewed: 2026-09-18\nImplementation: Existing dated R1/R2/R3 preview records; candidate carriage and current truth await independent checkpoint review\nProvenance: Six pinned legacy sources and the frozen Host Invocation area map; retained policy is non-authority history\nWriter type: Agent\nCanonical for: Promoted area navigation only; candidate document claims are not promoted by this edit\nUse this when: Finding the host invocation contract, selected migration direction and its proof boundaries\nDo not use this for: Selecting or installing a runtime, certifying current route counts, or treating dated plans as shipped code\nSupersedes: None; legacy source authority remains unchanged during candidate transformation\nSuperseded by: None\nRelated:\n- docs/platform/host-invocation-routing/vision.md\n- docs/platform/host-invocation-routing/intent-preservation-ledger.md\n- docs/platform/host-invocation-routing/spec.md\n- docs/platform/host-invocation-routing/roadmap.md\n- docs/platform/host-invocation-routing/architecture/invocation-kernel.md\n- docs/platform/host-invocation-routing/architecture/provider-routing.md\n- docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md\n- docs/platform/host-invocation-routing/contracts/operation-request-outcome.md\n- docs/platform/host-invocation-routing/contracts/command-route-descriptor.md\n- docs/platform/host-invocation-routing/verification/implementation-alignment.md\n- docs/platform/host-invocation-routing/history/source-inventory.md\n- docs/platform/host-invocation-routing/verification/source-preservation-audit.md\n- docs/platform/host-invocation-routing/decisions/README.md\n```"
  }
}
```

## Entry f-217: link-217

```json
{
  "id": "link-217",
  "path": "docs/platform/intent-preservation-ledger.md",
  "inputLine": 105,
  "inputColumn": 30,
  "lineBeforeLinkPass": 113,
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
  "reviewStatus": "pending",
  "oldDestination": "../doc-governance.md",
  "newDestination": "governance.md",
  "alias": {
    "aliasId": "root-authorities-draft-0011",
    "fromPath": "docs/doc-governance.md",
    "toOwner": "docs/platform/governance.md",
    "toAnchor": null,
    "kind": "moved",
    "evidenceRef": "plans/260925-documentation-authority-unification/ledger/decisions/s5-root-authorities-governance.json",
    "immutableRefs": [],
    "recordedAt": "2026-10-14"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Documentation Governance",
    "anchor": "documentation-governance",
    "githubAnchor": "documentation-governance",
    "stableAnchor": "h-86a533c4595e",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "d702209b131672004adc49e0e765c5353dacb79a43724efd3784c986e8c0cf79",
    "sample": "Documentation Governance",
    "sectionPayloadDigest": "21e741643f7a066fc083445659d6b3c6dace44f70fa9d114de58eedbe497aa4b",
    "followingBlockDigest": "b48e019bdbe6a6cf2115fc285a9ade82a35dff5f4f39c9c35389e6e9ee389434",
    "identityFingerprint": "53287154d82a7695fc31b275a799fa8372779e293931ce3c7ba0b769503463c7",
    "ancestry": [],
    "text": "# Documentation Governance",
    "sectionText": "# Documentation Governance\n\n```txt\nDocument type: Governance\nAudience: Human reviewer, architect, maintainer, agent\nPurpose: Define fgOS documentation types, authority, lifecycle, provenance, and placement\nDesign status: Accepted\nImplementation: Partial\nProvenance: Promoted from `docs/architect/documentation-system-design.md`\nWriter type: Human + agent coauthor\nCanonical for: fgOS documentation governance\nUse this when: Creating, reviewing, moving, or promoting maintained documentation\nDo not use this for: Current product behavior or implementation detail\nLast reviewed: 2026-09-25\nRelated:\n- `docs/reading-map.md`\n- `docs/transitional-switchboard.md`\n- `docs/platform/migration-authoring-rules.md`\n- `docs/platform/README.md`\n- `docs/architect/documentation-system-design.md`\n```\n\nThis document is the governance contract for maintained fgOS documentation.\nIt defines how docs declare authority, where they belong, and how temporary\ndiscussion becomes canonical knowledge."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Documentation Governance",
    "anchor": "documentation-governance",
    "githubAnchor": "documentation-governance",
    "stableAnchor": "h-86a533c4595e",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "38407e0d70604515c0eddfa82f938d448c34e27a0f78a2fad539f0752508763e",
    "sample": "Documentation Governance",
    "sectionPayloadDigest": "a557f9a75a0ae9bcbf54f971a8243dbf43239ecd64d78e8a2253b2f38f003e1c",
    "followingBlockDigest": "1bdf22f366a423941250211f62e5003e55ddb5430a2b6578a2faa9f6c5b027cd",
    "identityFingerprint": "06c68286ea11820370e21032190982acd24a6e8a2db2591053b1a57533b4a2a8",
    "ancestry": [],
    "text": "# Documentation Governance",
    "sectionText": "# Documentation Governance\n\n```txt\nDocument type: Governance\nAudience: Human reviewer, architect, maintainer, agent\nPurpose: Preserve the root documentation-governance contract as candidate material\nDesign status: Candidate\nImplementation: Partial; conservation review pending, current truth unverified\nProvenance: docs/doc-governance.md at d900d6151c58114cd9d0f8ef519f91daa8b4ded5\nWriter type: Agent draft writer\nCanonical: No\nCanonical for: Candidate documentation-governance contract; no authority cutover\nUse this when: Reviewing conservation of the root documentation-governance source\nDo not use this for: Replacing the current legacy governance authority or certifying implementation\nLast reviewed: 2026-10-14\nRelated:\n- docs/doc-governance.md\n- docs/reading-map.md\n- docs/platform/README.md\nSupersedes: None; candidate only\nSuperseded by: None\n```\n\nThis document is the governance contract for maintained fgOS documentation.\nIt defines how docs declare authority, where they belong, and how temporary\ndiscussion becomes canonical knowledge."
  }
}
```

## Entry f-218: link-218

```json
{
  "id": "link-218",
  "path": "docs/platform/migration-authoring-rules.md",
  "inputLine": 30,
  "inputColumn": 4,
  "lineBeforeLinkPass": 30,
  "before": "[docs/transitional-switchboard.md](../transitional-switchboard.md)",
  "after": "[docs/transitional-switchboard.md](documentation/switchboard.md)",
  "legacyPath": "docs/transitional-switchboard.md",
  "target": {
    "path": "docs/platform/documentation/switchboard.md",
    "anchor": null,
    "aliasId": "root-authorities-draft-0310"
  },
  "portal": false,
  "area": "platform-root",
  "reviewStatus": "pending",
  "oldDestination": "../transitional-switchboard.md",
  "newDestination": "documentation/switchboard.md",
  "alias": {
    "aliasId": "root-authorities-draft-0310",
    "fromPath": "docs/transitional-switchboard.md",
    "toOwner": "docs/platform/documentation/switchboard.md",
    "toAnchor": null,
    "kind": "moved",
    "evidenceRef": "plans/260925-documentation-authority-unification/ledger/decisions/s5-root-mapped-conservation.json",
    "immutableRefs": [],
    "recordedAt": "2026-10-14"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Transitional Documentation Authority Switchboard",
    "anchor": "transitional-documentation-authority-switchboard",
    "githubAnchor": "transitional-documentation-authority-switchboard",
    "stableAnchor": "h-6bd27b0ffa37",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "05ceed4ea474ac2fd15e0186a6f6faa0d394870ce824c7f8a84b88974375d321",
    "sample": "Transitional Documentation Authority Switchboard",
    "sectionPayloadDigest": "b1cc5f1bfca941ed696898b04d1332ef83789f02af8685b80ffca4017d503170",
    "followingBlockDigest": "e2a02e8c8c3ff5d5c3158d08d6bf3c32aef0f5b60664e06c16851f36a9de1be5",
    "identityFingerprint": "a3cc34a6adb8532731580318635dd13fd7c0bc97bfce5b26bbff74f2859007b2",
    "ancestry": [],
    "text": "# Transitional Documentation Authority Switchboard",
    "sectionText": "# Transitional Documentation Authority Switchboard\n\n```txt\nDocument type: Transitional switchboard\nAudience: Human reviewer, architect, maintainer, implementer, agent\nPurpose: Provide an explicit, non-speculative authority routing switchboard during documentation unification\nDesign status: Accepted (Phase 01)\nImplementation: Implemented (Phase 01)\nProvenance: Derived from plans/260925-documentation-authority-unification/current-authority-map-2026-09-25.md\nWriter type: Human + agent coauthor\nCanonical for: Platform documentation authority routing during transition\nUse this when: You need to know which document owns a platform claim during migration\nDo not use this for: Full future engine architecture or post-cutover canonical topology\nLast reviewed: 2026-09-25\nRelated:\n- `docs/reading-map.md`\n- `docs/platform/README.md`\n- `docs/doc-governance.md`\n- `docs/platform/migration-authoring-rules.md`\n- `plans/260925-documentation-authority-unification/plan.md`\n```\n\nThis switchboard is the operative authority router for repository-local platform\ndocumentation during the active unification migration. It stops authority split\nand reader guesswork before atomic cutover."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Transitional Documentation Authority Switchboard",
    "anchor": "transitional-documentation-authority-switchboard",
    "githubAnchor": "transitional-documentation-authority-switchboard",
    "stableAnchor": "h-6bd27b0ffa37",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "2790415a3398e7cee880cffffbc071ce70b7586af14923879403a93316c5252b",
    "sample": "Transitional Documentation Authority Switchboard",
    "sectionPayloadDigest": "f9a689bf93c3ac8ecb3dba637636dabab95ebe759eb50e1317843bb0d95327c5",
    "followingBlockDigest": "5af8a344acdd9744124ceb78cb7fd96d723bb33a5fc7010976f9213995c6d6c2",
    "identityFingerprint": "bb5bfb9abd4a2643400e58b14138c18b1954b7d46ef24b406c9dedbfad0d860a",
    "ancestry": [],
    "text": "# Transitional Documentation Authority Switchboard",
    "sectionText": "# Transitional Documentation Authority Switchboard\n\n```txt\nDocument type: Switchboard doc\nAudience: Documentation migration reviewer, maintainer, agent\nPurpose: Preserve the mapped source as candidate material for conservation review\nDesign status: Candidate\nImplementation: Historical source retained; current truth not certified\nProvenance: docs/transitional-switchboard.md at ad2ca83e245bbd76c0d275cc30366457b26c8df3\nWriter type: Agent draft writer\nCanonical: No\nCanonical for: None; candidate only\nUse this when: Reviewing conservation of the mapped legacy source\nDo not use this for: Current canonical authority or proof of implemented behavior\nLast reviewed: 2026-10-14\nRelated:\n- docs/transitional-switchboard.md\nSupersedes: None; candidate only\nSuperseded by: None\n```\n\nThis switchboard is the operative authority router for repository-local platform\ndocumentation during the active unification migration. It stops authority split\nand reader guesswork before atomic cutover."
  }
}
```

## Entry f-219: link-219

```json
{
  "id": "link-219",
  "path": "docs/platform/migration-authoring-rules.md",
  "inputLine": 90,
  "inputColumn": 27,
  "lineBeforeLinkPass": 90,
  "before": "[docs/transitional-switchboard.md](../transitional-switchboard.md)",
  "after": "[docs/transitional-switchboard.md](documentation/switchboard.md)",
  "legacyPath": "docs/transitional-switchboard.md",
  "target": {
    "path": "docs/platform/documentation/switchboard.md",
    "anchor": null,
    "aliasId": "root-authorities-draft-0310"
  },
  "portal": false,
  "area": "platform-root",
  "reviewStatus": "pending",
  "oldDestination": "../transitional-switchboard.md",
  "newDestination": "documentation/switchboard.md",
  "alias": {
    "aliasId": "root-authorities-draft-0310",
    "fromPath": "docs/transitional-switchboard.md",
    "toOwner": "docs/platform/documentation/switchboard.md",
    "toAnchor": null,
    "kind": "moved",
    "evidenceRef": "plans/260925-documentation-authority-unification/ledger/decisions/s5-root-mapped-conservation.json",
    "immutableRefs": [],
    "recordedAt": "2026-10-14"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Transitional Documentation Authority Switchboard",
    "anchor": "transitional-documentation-authority-switchboard",
    "githubAnchor": "transitional-documentation-authority-switchboard",
    "stableAnchor": "h-6bd27b0ffa37",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "05ceed4ea474ac2fd15e0186a6f6faa0d394870ce824c7f8a84b88974375d321",
    "sample": "Transitional Documentation Authority Switchboard",
    "sectionPayloadDigest": "b1cc5f1bfca941ed696898b04d1332ef83789f02af8685b80ffca4017d503170",
    "followingBlockDigest": "e2a02e8c8c3ff5d5c3158d08d6bf3c32aef0f5b60664e06c16851f36a9de1be5",
    "identityFingerprint": "a3cc34a6adb8532731580318635dd13fd7c0bc97bfce5b26bbff74f2859007b2",
    "ancestry": [],
    "text": "# Transitional Documentation Authority Switchboard",
    "sectionText": "# Transitional Documentation Authority Switchboard\n\n```txt\nDocument type: Transitional switchboard\nAudience: Human reviewer, architect, maintainer, implementer, agent\nPurpose: Provide an explicit, non-speculative authority routing switchboard during documentation unification\nDesign status: Accepted (Phase 01)\nImplementation: Implemented (Phase 01)\nProvenance: Derived from plans/260925-documentation-authority-unification/current-authority-map-2026-09-25.md\nWriter type: Human + agent coauthor\nCanonical for: Platform documentation authority routing during transition\nUse this when: You need to know which document owns a platform claim during migration\nDo not use this for: Full future engine architecture or post-cutover canonical topology\nLast reviewed: 2026-09-25\nRelated:\n- `docs/reading-map.md`\n- `docs/platform/README.md`\n- `docs/doc-governance.md`\n- `docs/platform/migration-authoring-rules.md`\n- `plans/260925-documentation-authority-unification/plan.md`\n```\n\nThis switchboard is the operative authority router for repository-local platform\ndocumentation during the active unification migration. It stops authority split\nand reader guesswork before atomic cutover."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Transitional Documentation Authority Switchboard",
    "anchor": "transitional-documentation-authority-switchboard",
    "githubAnchor": "transitional-documentation-authority-switchboard",
    "stableAnchor": "h-6bd27b0ffa37",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "2790415a3398e7cee880cffffbc071ce70b7586af14923879403a93316c5252b",
    "sample": "Transitional Documentation Authority Switchboard",
    "sectionPayloadDigest": "f9a689bf93c3ac8ecb3dba637636dabab95ebe759eb50e1317843bb0d95327c5",
    "followingBlockDigest": "5af8a344acdd9744124ceb78cb7fd96d723bb33a5fc7010976f9213995c6d6c2",
    "identityFingerprint": "bb5bfb9abd4a2643400e58b14138c18b1954b7d46ef24b406c9dedbfad0d860a",
    "ancestry": [],
    "text": "# Transitional Documentation Authority Switchboard",
    "sectionText": "# Transitional Documentation Authority Switchboard\n\n```txt\nDocument type: Switchboard doc\nAudience: Documentation migration reviewer, maintainer, agent\nPurpose: Preserve the mapped source as candidate material for conservation review\nDesign status: Candidate\nImplementation: Historical source retained; current truth not certified\nProvenance: docs/transitional-switchboard.md at ad2ca83e245bbd76c0d275cc30366457b26c8df3\nWriter type: Agent draft writer\nCanonical: No\nCanonical for: None; candidate only\nUse this when: Reviewing conservation of the mapped legacy source\nDo not use this for: Current canonical authority or proof of implemented behavior\nLast reviewed: 2026-10-14\nRelated:\n- docs/transitional-switchboard.md\nSupersedes: None; candidate only\nSuperseded by: None\n```\n\nThis switchboard is the operative authority router for repository-local platform\ndocumentation during the active unification migration. It stops authority split\nand reader guesswork before atomic cutover."
  }
}
```

## Entry f-220: link-220

```json
{
  "id": "link-220",
  "path": "docs/platform/migration-authoring-rules.md",
  "inputLine": 91,
  "inputColumn": 30,
  "lineBeforeLinkPass": 91,
  "before": "[docs/doc-governance.md](../doc-governance.md)",
  "after": "[docs/doc-governance.md](governance.md)",
  "legacyPath": "docs/doc-governance.md",
  "target": {
    "path": "docs/platform/governance.md",
    "anchor": null,
    "aliasId": "root-authorities-draft-0011"
  },
  "portal": false,
  "area": "platform-root",
  "reviewStatus": "pending",
  "oldDestination": "../doc-governance.md",
  "newDestination": "governance.md",
  "alias": {
    "aliasId": "root-authorities-draft-0011",
    "fromPath": "docs/doc-governance.md",
    "toOwner": "docs/platform/governance.md",
    "toAnchor": null,
    "kind": "moved",
    "evidenceRef": "plans/260925-documentation-authority-unification/ledger/decisions/s5-root-authorities-governance.json",
    "immutableRefs": [],
    "recordedAt": "2026-10-14"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Documentation Governance",
    "anchor": "documentation-governance",
    "githubAnchor": "documentation-governance",
    "stableAnchor": "h-86a533c4595e",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "d702209b131672004adc49e0e765c5353dacb79a43724efd3784c986e8c0cf79",
    "sample": "Documentation Governance",
    "sectionPayloadDigest": "21e741643f7a066fc083445659d6b3c6dace44f70fa9d114de58eedbe497aa4b",
    "followingBlockDigest": "b48e019bdbe6a6cf2115fc285a9ade82a35dff5f4f39c9c35389e6e9ee389434",
    "identityFingerprint": "53287154d82a7695fc31b275a799fa8372779e293931ce3c7ba0b769503463c7",
    "ancestry": [],
    "text": "# Documentation Governance",
    "sectionText": "# Documentation Governance\n\n```txt\nDocument type: Governance\nAudience: Human reviewer, architect, maintainer, agent\nPurpose: Define fgOS documentation types, authority, lifecycle, provenance, and placement\nDesign status: Accepted\nImplementation: Partial\nProvenance: Promoted from `docs/architect/documentation-system-design.md`\nWriter type: Human + agent coauthor\nCanonical for: fgOS documentation governance\nUse this when: Creating, reviewing, moving, or promoting maintained documentation\nDo not use this for: Current product behavior or implementation detail\nLast reviewed: 2026-09-25\nRelated:\n- `docs/reading-map.md`\n- `docs/transitional-switchboard.md`\n- `docs/platform/migration-authoring-rules.md`\n- `docs/platform/README.md`\n- `docs/architect/documentation-system-design.md`\n```\n\nThis document is the governance contract for maintained fgOS documentation.\nIt defines how docs declare authority, where they belong, and how temporary\ndiscussion becomes canonical knowledge."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Documentation Governance",
    "anchor": "documentation-governance",
    "githubAnchor": "documentation-governance",
    "stableAnchor": "h-86a533c4595e",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "38407e0d70604515c0eddfa82f938d448c34e27a0f78a2fad539f0752508763e",
    "sample": "Documentation Governance",
    "sectionPayloadDigest": "a557f9a75a0ae9bcbf54f971a8243dbf43239ecd64d78e8a2253b2f38f003e1c",
    "followingBlockDigest": "1bdf22f366a423941250211f62e5003e55ddb5430a2b6578a2faa9f6c5b027cd",
    "identityFingerprint": "06c68286ea11820370e21032190982acd24a6e8a2db2591053b1a57533b4a2a8",
    "ancestry": [],
    "text": "# Documentation Governance",
    "sectionText": "# Documentation Governance\n\n```txt\nDocument type: Governance\nAudience: Human reviewer, architect, maintainer, agent\nPurpose: Preserve the root documentation-governance contract as candidate material\nDesign status: Candidate\nImplementation: Partial; conservation review pending, current truth unverified\nProvenance: docs/doc-governance.md at d900d6151c58114cd9d0f8ef519f91daa8b4ded5\nWriter type: Agent draft writer\nCanonical: No\nCanonical for: Candidate documentation-governance contract; no authority cutover\nUse this when: Reviewing conservation of the root documentation-governance source\nDo not use this for: Replacing the current legacy governance authority or certifying implementation\nLast reviewed: 2026-10-14\nRelated:\n- docs/doc-governance.md\n- docs/reading-map.md\n- docs/platform/README.md\nSupersedes: None; candidate only\nSuperseded by: None\n```\n\nThis document is the governance contract for maintained fgOS documentation.\nIt defines how docs declare authority, where they belong, and how temporary\ndiscussion becomes canonical knowledge."
  }
}
```

## Entry f-221: link-221

```json
{
  "id": "link-221",
  "path": "docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md",
  "inputLine": 181,
  "inputColumn": 9,
  "lineBeforeLinkPass": 181,
  "before": "[Workspace Topology Architecture](../../../architect/workspace-topology.md)",
  "after": "[Workspace Topology Architecture](../../system-architecture/architecture/workspace-topology.md)",
  "legacyPath": "docs/architect/workspace-topology.md",
  "target": {
    "path": "docs/platform/system-architecture/architecture/workspace-topology.md",
    "anchor": null,
    "aliasId": "step10-whole-system-1458"
  },
  "portal": false,
  "area": "packaging-distribution",
  "reviewStatus": "pending",
  "oldDestination": "../../../architect/workspace-topology.md",
  "newDestination": "../../system-architecture/architecture/workspace-topology.md",
  "alias": {
    "aliasId": "step10-whole-system-1458",
    "fromPath": "docs/architect/workspace-topology.md",
    "toOwner": "docs/platform/system-architecture/architecture/workspace-topology.md",
    "toAnchor": null,
    "kind": "moved",
    "evidenceRef": "plans/260925-documentation-authority-unification/ledger/area-map-whole-system-architecture.md",
    "immutableRefs": [],
    "recordedAt": "2026-10-15"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Workspace Topology Architecture",
    "anchor": "workspace-topology-architecture",
    "githubAnchor": "workspace-topology-architecture",
    "stableAnchor": "h-3a1ca6729e9e",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "dbbddecaa7d55c08594bb562576db34a91215ebbd035781a1dba012b2812b85c",
    "sample": "Workspace Topology Architecture",
    "sectionPayloadDigest": "37b316d4277bcfb5e539d55a628a4d80e113dea875b8ed5c3c6d53b0cc94c4d0",
    "followingBlockDigest": "23dfefb7d31af758f7248261a875778d05dc6fc597cb9090750673f0400f8343",
    "identityFingerprint": "3cc6c555fe3d946fca427d1e9faf9fe5228381f7ccd72aa4eaa9b701d22ad2cc",
    "ancestry": [],
    "text": "# Workspace Topology Architecture",
    "sectionText": "# Workspace Topology Architecture\n\n**Status:** Architecture contract draft; pending decision on durable work-history\nplacement.\n**Date:** 2026-09-04.\n**Scope:** Identity, state ownership, root resolution, and mutation authority for\nfgOS in single-workspace and isolated-worktree modes.\n\nThis document is the topology contract. It defines the primitive every\npackaging, work-state, coding-domain, runtime-coordination, config/init/doctor,\nand future host-surface design must use:\n\n```txt\nTopologyContext = resolved identities + typed roots + granted capabilities\n```\n\nNo business/workflow module should infer \"main root\", \"cwd root\", or a `.fgos`\npath directly. It should receive a `TopologyContext` and use the typed root or\ncapability named by that context.\n\nCompanion documents:\n\n- [workspace-topology-audit.md](workspace-topology-audit.md) records current\n  codebase evidence and gaps.\n- [workspace-topology-roadmap.md](workspace-topology-roadmap.md) records\n  decision order and migration slices."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Workspace Topology Architecture",
    "anchor": "workspace-topology-architecture",
    "githubAnchor": "workspace-topology-architecture",
    "stableAnchor": "h-3a1ca6729e9e",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "e4b7e9f4c86adc2fb2e428bf09cfd932181928fd2db840a5aeb61b6a23d3d7fc",
    "sample": "Workspace Topology Architecture",
    "sectionPayloadDigest": "8acebd4a817fa367f1dde221cee7a7c6d334b6e0c8d0e073aebdac6bdf2f6cdd",
    "followingBlockDigest": "e44eb7add5cc37f535199ac750be110dd7e016fcab5900b300da62673e7f921f",
    "identityFingerprint": "ac387e2020eb7d8eac0657ecaa5c39932d2974a11417dc0661c975c354027425",
    "ancestry": [],
    "text": "# Workspace Topology Architecture",
    "sectionText": "# Workspace Topology Architecture\n\n```txt\nDocument type: Architecture\nAudience: Human reviewer, architect, maintainer, agent\nPurpose: Preserve the complete workspace-topology.md source at its frozen-map candidate owner\nDesign status: Candidate\nImplementation: Partial — inherited source qualifications; not independently truth-verified\nProvenance: docs/architect/workspace-topology.md at 69dd3ee7fd84bc5e93fe9c75d63622d4f5aa8539 (blob 0513cd70c080c546bb009a253adab60dbb5d43f1)\nWriter type: Agent carriage; independent review pending\nCanonical for: Nothing until promotion; current source remains docs/architect/workspace-topology.md\nUse this when: Reviewing whole-system candidate carriage and placement\nDo not use this for: Inferring implementation, promotion or superseding source authority\nLast reviewed: Pending independent review\nRelated:\n- docs/architect/workspace-topology.md\n- docs/platform/component-boundary.md\n- docs/platform/architecture-map.md\nSupersedes: None — candidate only\nSuperseded by: None\n```\n\nAdded in candidate: migration metadata and physical link rebasing. Original source metadata, dates, design limits and historic claims below are provenance, not fresh review. Current truth is unverified; A28 requires sampled truth review at this checkpoint and full truth review at promotion.\n\n\n**Status:** Architecture contract draft; pending decision on durable work-history\nplacement.\n**Date:** 2026-09-04.\n**Scope:** Identity, state ownership, root resolution, and mutation authority for\nfgOS in single-workspace and isolated-worktree modes.\n\nThis document is the topology contract. It defines the primitive every\npackaging, work-state, coding-domain, runtime-coordination, config/init/doctor,\nand future host-surface design must use:\n\n```txt\nTopologyContext = resolved identities + typed roots + granted capabilities\n```\n\nNo business/workflow module should infer \"main root\", \"cwd root\", or a `.fgos`\npath directly. It should receive a `TopologyContext` and use the typed root or\ncapability named by that context.\n\nCompanion documents:\n\n- [workspace-topology-audit.md](workspace-topology-audit.md) records current\n  codebase evidence and gaps.\n- [workspace-topology-roadmap.md](workspace-topology-roadmap.md) records\n  decision order and migration slices."
  }
}
```

## Entry f-222: link-222

```json
{
  "id": "link-222",
  "path": "docs/platform/packaging-distribution/contracts/release-manifest.md",
  "inputLine": 220,
  "inputColumn": 153,
  "lineBeforeLinkPass": 220,
  "before": "[Legacy CLI Transition](../../../architect/host-invocation-routing/legacy-cli-transition.md)",
  "after": "[Legacy CLI Transition](../../host-invocation-routing/README.md)",
  "legacyPath": "docs/architect/host-invocation-routing/legacy-cli-transition.md",
  "target": {
    "path": "docs/platform/host-invocation-routing/README.md",
    "anchor": null,
    "aliasId": "host-invocation-draft-052"
  },
  "portal": false,
  "area": "packaging-distribution",
  "reviewStatus": "pending",
  "oldDestination": "../../../architect/host-invocation-routing/legacy-cli-transition.md",
  "newDestination": "../../host-invocation-routing/README.md",
  "alias": {
    "fromPath": "docs/architect/host-invocation-routing/legacy-cli-transition.md",
    "toOwner": "docs/platform/host-invocation-routing/README.md",
    "toAnchor": null,
    "kind": "redirected",
    "evidenceRef": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
    "immutableRefs": [],
    "recordedAt": "2026-10-13",
    "aliasId": "host-invocation-draft-052"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Legacy CLI Transition",
    "anchor": "legacy-cli-transition",
    "githubAnchor": "legacy-cli-transition",
    "stableAnchor": "h-dc70efc6804e",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "882786e83f6fcf97ec9230a8eb8cac4c050823310061348dd3d85cb609dbe329",
    "sample": "Legacy CLI Transition",
    "sectionPayloadDigest": "7b54ed05cfd159ebb37eed166b94ffa4c76aac3e113078bbef9683d49d647156",
    "followingBlockDigest": "ab6730b94dcd1c31dcc6afb6fffd7a83d53310f5850673f5663db952bd87f5c1",
    "identityFingerprint": "e597222ce0b65b2a68602b1aa4d9351bbfc26ee04ae227cc7b2c97817eefcd3a",
    "ancestry": [],
    "text": "# Legacy CLI Transition",
    "sectionText": "# Legacy CLI Transition\n\n**Status:** Vision / architecture advisory, not a locked platform law and not an implementation plan.\n**Date:** 2026-09-10.\n**Revised:** per [architecture-review-260910-1537-host-invocation-provider-routing-design-review.md](../../../plans/reports/architecture-review-260910-1537-host-invocation-provider-routing-design-review.md).\n\nThis document depends on the kernel contract in [Host Invocation And Provider Routing](./host-invocation-provider-routing.md) — read it first, in particular \"Transitional CLI Lane\" under §4 and `CommandRouteDescriptor` in the §3 name table. The kernel has exactly one input (`OperationRequest`) and one output (`ProviderOutcome`); everything in this document is CLI-adapter-local scaffolding that disappears once Node migration completes. Nothing here introduces a second kernel input or output type — the legacy lane never reaches the Router or `InvocationService` at all (see §1 below)."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Host Invocation",
    "anchor": "host-invocation",
    "githubAnchor": "host-invocation",
    "stableAnchor": "h-9674073175c5",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "cc682e1a901b39ba480c2a95282077b85597b0d8ee6aa24bd7dcd71c8de20739",
    "sample": "Host Invocation",
    "sectionPayloadDigest": "4906b85c6c780d8a9dcf4b69f592806ac5301cf33aa4d638e0c88c98046f9e9e",
    "followingBlockDigest": "4906b85c6c780d8a9dcf4b69f592806ac5301cf33aa4d638e0c88c98046f9e9e",
    "identityFingerprint": "2f2cd30c374c59bab51ddaebeadfb9338d8540794673fcc6fc53dfc281b37d78",
    "ancestry": [],
    "text": "# Host Invocation",
    "sectionText": "# Host Invocation\n\n```txt\nDocument type: Area portal\nAudience: Human reviewer, architect, maintainer, implementation agent\nPurpose: Route readers through fgOS host invocation, provider routing, legacy CLI transition, and external provider docs\nDesign status: Draft\nImplementation status: R1/R2/R3 implemented preview plus partial route migration\nCanonical: Yes, after review\nOwner: Platform documentation\nSource type: Promoted from docs/architect/host-invocation-routing/**\nLast reviewed: 2026-09-18\nImplementation: Existing dated R1/R2/R3 preview records; candidate carriage and current truth await independent checkpoint review\nProvenance: Six pinned legacy sources and the frozen Host Invocation area map; retained policy is non-authority history\nWriter type: Agent\nCanonical for: Promoted area navigation only; candidate document claims are not promoted by this edit\nUse this when: Finding the host invocation contract, selected migration direction and its proof boundaries\nDo not use this for: Selecting or installing a runtime, certifying current route counts, or treating dated plans as shipped code\nSupersedes: None; legacy source authority remains unchanged during candidate transformation\nSuperseded by: None\nRelated:\n- docs/platform/host-invocation-routing/vision.md\n- docs/platform/host-invocation-routing/intent-preservation-ledger.md\n- docs/platform/host-invocation-routing/spec.md\n- docs/platform/host-invocation-routing/roadmap.md\n- docs/platform/host-invocation-routing/architecture/invocation-kernel.md\n- docs/platform/host-invocation-routing/architecture/provider-routing.md\n- docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md\n- docs/platform/host-invocation-routing/contracts/operation-request-outcome.md\n- docs/platform/host-invocation-routing/contracts/command-route-descriptor.md\n- docs/platform/host-invocation-routing/verification/implementation-alignment.md\n- docs/platform/host-invocation-routing/history/source-inventory.md\n- docs/platform/host-invocation-routing/verification/source-preservation-audit.md\n- docs/platform/host-invocation-routing/decisions/README.md\n```"
  }
}
```

## Entry f-223: link-223

```json
{
  "id": "link-223",
  "path": "docs/platform/packaging-distribution/contracts/repository-runtime-layout.md",
  "inputLine": 194,
  "inputColumn": 1,
  "lineBeforeLinkPass": 194,
  "before": "[Workspace Topology Architecture](../../../architect/workspace-topology.md)",
  "after": "[Workspace Topology Architecture](../../system-architecture/architecture/workspace-topology.md)",
  "legacyPath": "docs/architect/workspace-topology.md",
  "target": {
    "path": "docs/platform/system-architecture/architecture/workspace-topology.md",
    "anchor": null,
    "aliasId": "step10-whole-system-1458"
  },
  "portal": false,
  "area": "packaging-distribution",
  "reviewStatus": "pending",
  "oldDestination": "../../../architect/workspace-topology.md",
  "newDestination": "../../system-architecture/architecture/workspace-topology.md",
  "alias": {
    "aliasId": "step10-whole-system-1458",
    "fromPath": "docs/architect/workspace-topology.md",
    "toOwner": "docs/platform/system-architecture/architecture/workspace-topology.md",
    "toAnchor": null,
    "kind": "moved",
    "evidenceRef": "plans/260925-documentation-authority-unification/ledger/area-map-whole-system-architecture.md",
    "immutableRefs": [],
    "recordedAt": "2026-10-15"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Workspace Topology Architecture",
    "anchor": "workspace-topology-architecture",
    "githubAnchor": "workspace-topology-architecture",
    "stableAnchor": "h-3a1ca6729e9e",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "dbbddecaa7d55c08594bb562576db34a91215ebbd035781a1dba012b2812b85c",
    "sample": "Workspace Topology Architecture",
    "sectionPayloadDigest": "37b316d4277bcfb5e539d55a628a4d80e113dea875b8ed5c3c6d53b0cc94c4d0",
    "followingBlockDigest": "23dfefb7d31af758f7248261a875778d05dc6fc597cb9090750673f0400f8343",
    "identityFingerprint": "3cc6c555fe3d946fca427d1e9faf9fe5228381f7ccd72aa4eaa9b701d22ad2cc",
    "ancestry": [],
    "text": "# Workspace Topology Architecture",
    "sectionText": "# Workspace Topology Architecture\n\n**Status:** Architecture contract draft; pending decision on durable work-history\nplacement.\n**Date:** 2026-09-04.\n**Scope:** Identity, state ownership, root resolution, and mutation authority for\nfgOS in single-workspace and isolated-worktree modes.\n\nThis document is the topology contract. It defines the primitive every\npackaging, work-state, coding-domain, runtime-coordination, config/init/doctor,\nand future host-surface design must use:\n\n```txt\nTopologyContext = resolved identities + typed roots + granted capabilities\n```\n\nNo business/workflow module should infer \"main root\", \"cwd root\", or a `.fgos`\npath directly. It should receive a `TopologyContext` and use the typed root or\ncapability named by that context.\n\nCompanion documents:\n\n- [workspace-topology-audit.md](workspace-topology-audit.md) records current\n  codebase evidence and gaps.\n- [workspace-topology-roadmap.md](workspace-topology-roadmap.md) records\n  decision order and migration slices."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Workspace Topology Architecture",
    "anchor": "workspace-topology-architecture",
    "githubAnchor": "workspace-topology-architecture",
    "stableAnchor": "h-3a1ca6729e9e",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "e4b7e9f4c86adc2fb2e428bf09cfd932181928fd2db840a5aeb61b6a23d3d7fc",
    "sample": "Workspace Topology Architecture",
    "sectionPayloadDigest": "8acebd4a817fa367f1dde221cee7a7c6d334b6e0c8d0e073aebdac6bdf2f6cdd",
    "followingBlockDigest": "e44eb7add5cc37f535199ac750be110dd7e016fcab5900b300da62673e7f921f",
    "identityFingerprint": "ac387e2020eb7d8eac0657ecaa5c39932d2974a11417dc0661c975c354027425",
    "ancestry": [],
    "text": "# Workspace Topology Architecture",
    "sectionText": "# Workspace Topology Architecture\n\n```txt\nDocument type: Architecture\nAudience: Human reviewer, architect, maintainer, agent\nPurpose: Preserve the complete workspace-topology.md source at its frozen-map candidate owner\nDesign status: Candidate\nImplementation: Partial — inherited source qualifications; not independently truth-verified\nProvenance: docs/architect/workspace-topology.md at 69dd3ee7fd84bc5e93fe9c75d63622d4f5aa8539 (blob 0513cd70c080c546bb009a253adab60dbb5d43f1)\nWriter type: Agent carriage; independent review pending\nCanonical for: Nothing until promotion; current source remains docs/architect/workspace-topology.md\nUse this when: Reviewing whole-system candidate carriage and placement\nDo not use this for: Inferring implementation, promotion or superseding source authority\nLast reviewed: Pending independent review\nRelated:\n- docs/architect/workspace-topology.md\n- docs/platform/component-boundary.md\n- docs/platform/architecture-map.md\nSupersedes: None — candidate only\nSuperseded by: None\n```\n\nAdded in candidate: migration metadata and physical link rebasing. Original source metadata, dates, design limits and historic claims below are provenance, not fresh review. Current truth is unverified; A28 requires sampled truth review at this checkpoint and full truth review at promotion.\n\n\n**Status:** Architecture contract draft; pending decision on durable work-history\nplacement.\n**Date:** 2026-09-04.\n**Scope:** Identity, state ownership, root resolution, and mutation authority for\nfgOS in single-workspace and isolated-worktree modes.\n\nThis document is the topology contract. It defines the primitive every\npackaging, work-state, coding-domain, runtime-coordination, config/init/doctor,\nand future host-surface design must use:\n\n```txt\nTopologyContext = resolved identities + typed roots + granted capabilities\n```\n\nNo business/workflow module should infer \"main root\", \"cwd root\", or a `.fgos`\npath directly. It should receive a `TopologyContext` and use the typed root or\ncapability named by that context.\n\nCompanion documents:\n\n- [workspace-topology-audit.md](workspace-topology-audit.md) records current\n  codebase evidence and gaps.\n- [workspace-topology-roadmap.md](workspace-topology-roadmap.md) records\n  decision order and migration slices."
  }
}
```

## Entry f-224: link-224

```json
{
  "id": "link-224",
  "path": "docs/platform/packaging-distribution/contracts/repository-runtime-layout.md",
  "inputLine": 261,
  "inputColumn": 3,
  "lineBeforeLinkPass": 261,
  "before": "[Workspace Topology Architecture](../../../architect/workspace-topology.md)",
  "after": "[Workspace Topology Architecture](../../system-architecture/architecture/workspace-topology.md)",
  "legacyPath": "docs/architect/workspace-topology.md",
  "target": {
    "path": "docs/platform/system-architecture/architecture/workspace-topology.md",
    "anchor": null,
    "aliasId": "step10-whole-system-1458"
  },
  "portal": false,
  "area": "packaging-distribution",
  "reviewStatus": "pending",
  "oldDestination": "../../../architect/workspace-topology.md",
  "newDestination": "../../system-architecture/architecture/workspace-topology.md",
  "alias": {
    "aliasId": "step10-whole-system-1458",
    "fromPath": "docs/architect/workspace-topology.md",
    "toOwner": "docs/platform/system-architecture/architecture/workspace-topology.md",
    "toAnchor": null,
    "kind": "moved",
    "evidenceRef": "plans/260925-documentation-authority-unification/ledger/area-map-whole-system-architecture.md",
    "immutableRefs": [],
    "recordedAt": "2026-10-15"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Workspace Topology Architecture",
    "anchor": "workspace-topology-architecture",
    "githubAnchor": "workspace-topology-architecture",
    "stableAnchor": "h-3a1ca6729e9e",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "dbbddecaa7d55c08594bb562576db34a91215ebbd035781a1dba012b2812b85c",
    "sample": "Workspace Topology Architecture",
    "sectionPayloadDigest": "37b316d4277bcfb5e539d55a628a4d80e113dea875b8ed5c3c6d53b0cc94c4d0",
    "followingBlockDigest": "23dfefb7d31af758f7248261a875778d05dc6fc597cb9090750673f0400f8343",
    "identityFingerprint": "3cc6c555fe3d946fca427d1e9faf9fe5228381f7ccd72aa4eaa9b701d22ad2cc",
    "ancestry": [],
    "text": "# Workspace Topology Architecture",
    "sectionText": "# Workspace Topology Architecture\n\n**Status:** Architecture contract draft; pending decision on durable work-history\nplacement.\n**Date:** 2026-09-04.\n**Scope:** Identity, state ownership, root resolution, and mutation authority for\nfgOS in single-workspace and isolated-worktree modes.\n\nThis document is the topology contract. It defines the primitive every\npackaging, work-state, coding-domain, runtime-coordination, config/init/doctor,\nand future host-surface design must use:\n\n```txt\nTopologyContext = resolved identities + typed roots + granted capabilities\n```\n\nNo business/workflow module should infer \"main root\", \"cwd root\", or a `.fgos`\npath directly. It should receive a `TopologyContext` and use the typed root or\ncapability named by that context.\n\nCompanion documents:\n\n- [workspace-topology-audit.md](workspace-topology-audit.md) records current\n  codebase evidence and gaps.\n- [workspace-topology-roadmap.md](workspace-topology-roadmap.md) records\n  decision order and migration slices."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Workspace Topology Architecture",
    "anchor": "workspace-topology-architecture",
    "githubAnchor": "workspace-topology-architecture",
    "stableAnchor": "h-3a1ca6729e9e",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "e4b7e9f4c86adc2fb2e428bf09cfd932181928fd2db840a5aeb61b6a23d3d7fc",
    "sample": "Workspace Topology Architecture",
    "sectionPayloadDigest": "8acebd4a817fa367f1dde221cee7a7c6d334b6e0c8d0e073aebdac6bdf2f6cdd",
    "followingBlockDigest": "e44eb7add5cc37f535199ac750be110dd7e016fcab5900b300da62673e7f921f",
    "identityFingerprint": "ac387e2020eb7d8eac0657ecaa5c39932d2974a11417dc0661c975c354027425",
    "ancestry": [],
    "text": "# Workspace Topology Architecture",
    "sectionText": "# Workspace Topology Architecture\n\n```txt\nDocument type: Architecture\nAudience: Human reviewer, architect, maintainer, agent\nPurpose: Preserve the complete workspace-topology.md source at its frozen-map candidate owner\nDesign status: Candidate\nImplementation: Partial — inherited source qualifications; not independently truth-verified\nProvenance: docs/architect/workspace-topology.md at 69dd3ee7fd84bc5e93fe9c75d63622d4f5aa8539 (blob 0513cd70c080c546bb009a253adab60dbb5d43f1)\nWriter type: Agent carriage; independent review pending\nCanonical for: Nothing until promotion; current source remains docs/architect/workspace-topology.md\nUse this when: Reviewing whole-system candidate carriage and placement\nDo not use this for: Inferring implementation, promotion or superseding source authority\nLast reviewed: Pending independent review\nRelated:\n- docs/architect/workspace-topology.md\n- docs/platform/component-boundary.md\n- docs/platform/architecture-map.md\nSupersedes: None — candidate only\nSuperseded by: None\n```\n\nAdded in candidate: migration metadata and physical link rebasing. Original source metadata, dates, design limits and historic claims below are provenance, not fresh review. Current truth is unverified; A28 requires sampled truth review at this checkpoint and full truth review at promotion.\n\n\n**Status:** Architecture contract draft; pending decision on durable work-history\nplacement.\n**Date:** 2026-09-04.\n**Scope:** Identity, state ownership, root resolution, and mutation authority for\nfgOS in single-workspace and isolated-worktree modes.\n\nThis document is the topology contract. It defines the primitive every\npackaging, work-state, coding-domain, runtime-coordination, config/init/doctor,\nand future host-surface design must use:\n\n```txt\nTopologyContext = resolved identities + typed roots + granted capabilities\n```\n\nNo business/workflow module should infer \"main root\", \"cwd root\", or a `.fgos`\npath directly. It should receive a `TopologyContext` and use the typed root or\ncapability named by that context.\n\nCompanion documents:\n\n- [workspace-topology-audit.md](workspace-topology-audit.md) records current\n  codebase evidence and gaps.\n- [workspace-topology-roadmap.md](workspace-topology-roadmap.md) records\n  decision order and migration slices."
  }
}
```

## Entry f-225: link-225

```json
{
  "id": "link-225",
  "path": "docs/platform/packaging-distribution/spec.md",
  "inputLine": 319,
  "inputColumn": 1,
  "lineBeforeLinkPass": 319,
  "before": "[Workspace Topology Architecture](../../architect/workspace-topology.md)",
  "after": "[Workspace Topology Architecture](../system-architecture/architecture/workspace-topology.md)",
  "legacyPath": "docs/architect/workspace-topology.md",
  "target": {
    "path": "docs/platform/system-architecture/architecture/workspace-topology.md",
    "anchor": null,
    "aliasId": "step10-whole-system-1458"
  },
  "portal": false,
  "area": "packaging-distribution",
  "reviewStatus": "pending",
  "oldDestination": "../../architect/workspace-topology.md",
  "newDestination": "../system-architecture/architecture/workspace-topology.md",
  "alias": {
    "aliasId": "step10-whole-system-1458",
    "fromPath": "docs/architect/workspace-topology.md",
    "toOwner": "docs/platform/system-architecture/architecture/workspace-topology.md",
    "toAnchor": null,
    "kind": "moved",
    "evidenceRef": "plans/260925-documentation-authority-unification/ledger/area-map-whole-system-architecture.md",
    "immutableRefs": [],
    "recordedAt": "2026-10-15"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Workspace Topology Architecture",
    "anchor": "workspace-topology-architecture",
    "githubAnchor": "workspace-topology-architecture",
    "stableAnchor": "h-3a1ca6729e9e",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "dbbddecaa7d55c08594bb562576db34a91215ebbd035781a1dba012b2812b85c",
    "sample": "Workspace Topology Architecture",
    "sectionPayloadDigest": "37b316d4277bcfb5e539d55a628a4d80e113dea875b8ed5c3c6d53b0cc94c4d0",
    "followingBlockDigest": "23dfefb7d31af758f7248261a875778d05dc6fc597cb9090750673f0400f8343",
    "identityFingerprint": "3cc6c555fe3d946fca427d1e9faf9fe5228381f7ccd72aa4eaa9b701d22ad2cc",
    "ancestry": [],
    "text": "# Workspace Topology Architecture",
    "sectionText": "# Workspace Topology Architecture\n\n**Status:** Architecture contract draft; pending decision on durable work-history\nplacement.\n**Date:** 2026-09-04.\n**Scope:** Identity, state ownership, root resolution, and mutation authority for\nfgOS in single-workspace and isolated-worktree modes.\n\nThis document is the topology contract. It defines the primitive every\npackaging, work-state, coding-domain, runtime-coordination, config/init/doctor,\nand future host-surface design must use:\n\n```txt\nTopologyContext = resolved identities + typed roots + granted capabilities\n```\n\nNo business/workflow module should infer \"main root\", \"cwd root\", or a `.fgos`\npath directly. It should receive a `TopologyContext` and use the typed root or\ncapability named by that context.\n\nCompanion documents:\n\n- [workspace-topology-audit.md](workspace-topology-audit.md) records current\n  codebase evidence and gaps.\n- [workspace-topology-roadmap.md](workspace-topology-roadmap.md) records\n  decision order and migration slices."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Workspace Topology Architecture",
    "anchor": "workspace-topology-architecture",
    "githubAnchor": "workspace-topology-architecture",
    "stableAnchor": "h-3a1ca6729e9e",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "e4b7e9f4c86adc2fb2e428bf09cfd932181928fd2db840a5aeb61b6a23d3d7fc",
    "sample": "Workspace Topology Architecture",
    "sectionPayloadDigest": "8acebd4a817fa367f1dde221cee7a7c6d334b6e0c8d0e073aebdac6bdf2f6cdd",
    "followingBlockDigest": "e44eb7add5cc37f535199ac750be110dd7e016fcab5900b300da62673e7f921f",
    "identityFingerprint": "ac387e2020eb7d8eac0657ecaa5c39932d2974a11417dc0661c975c354027425",
    "ancestry": [],
    "text": "# Workspace Topology Architecture",
    "sectionText": "# Workspace Topology Architecture\n\n```txt\nDocument type: Architecture\nAudience: Human reviewer, architect, maintainer, agent\nPurpose: Preserve the complete workspace-topology.md source at its frozen-map candidate owner\nDesign status: Candidate\nImplementation: Partial — inherited source qualifications; not independently truth-verified\nProvenance: docs/architect/workspace-topology.md at 69dd3ee7fd84bc5e93fe9c75d63622d4f5aa8539 (blob 0513cd70c080c546bb009a253adab60dbb5d43f1)\nWriter type: Agent carriage; independent review pending\nCanonical for: Nothing until promotion; current source remains docs/architect/workspace-topology.md\nUse this when: Reviewing whole-system candidate carriage and placement\nDo not use this for: Inferring implementation, promotion or superseding source authority\nLast reviewed: Pending independent review\nRelated:\n- docs/architect/workspace-topology.md\n- docs/platform/component-boundary.md\n- docs/platform/architecture-map.md\nSupersedes: None — candidate only\nSuperseded by: None\n```\n\nAdded in candidate: migration metadata and physical link rebasing. Original source metadata, dates, design limits and historic claims below are provenance, not fresh review. Current truth is unverified; A28 requires sampled truth review at this checkpoint and full truth review at promotion.\n\n\n**Status:** Architecture contract draft; pending decision on durable work-history\nplacement.\n**Date:** 2026-09-04.\n**Scope:** Identity, state ownership, root resolution, and mutation authority for\nfgOS in single-workspace and isolated-worktree modes.\n\nThis document is the topology contract. It defines the primitive every\npackaging, work-state, coding-domain, runtime-coordination, config/init/doctor,\nand future host-surface design must use:\n\n```txt\nTopologyContext = resolved identities + typed roots + granted capabilities\n```\n\nNo business/workflow module should infer \"main root\", \"cwd root\", or a `.fgos`\npath directly. It should receive a `TopologyContext` and use the typed root or\ncapability named by that context.\n\nCompanion documents:\n\n- [workspace-topology-audit.md](workspace-topology-audit.md) records current\n  codebase evidence and gaps.\n- [workspace-topology-roadmap.md](workspace-topology-roadmap.md) records\n  decision order and migration slices."
  }
}
```

## Entry f-226: link-226

```json
{
  "id": "link-226",
  "path": "docs/platform/packaging-distribution/spec.md",
  "inputLine": 439,
  "inputColumn": 3,
  "lineBeforeLinkPass": 439,
  "before": "[docs/architect/workspace-topology.md](../../architect/workspace-topology.md)",
  "after": "[docs/architect/workspace-topology.md](../system-architecture/architecture/workspace-topology.md)",
  "legacyPath": "docs/architect/workspace-topology.md",
  "target": {
    "path": "docs/platform/system-architecture/architecture/workspace-topology.md",
    "anchor": null,
    "aliasId": "step10-whole-system-1458"
  },
  "portal": false,
  "area": "packaging-distribution",
  "reviewStatus": "pending",
  "oldDestination": "../../architect/workspace-topology.md",
  "newDestination": "../system-architecture/architecture/workspace-topology.md",
  "alias": {
    "aliasId": "step10-whole-system-1458",
    "fromPath": "docs/architect/workspace-topology.md",
    "toOwner": "docs/platform/system-architecture/architecture/workspace-topology.md",
    "toAnchor": null,
    "kind": "moved",
    "evidenceRef": "plans/260925-documentation-authority-unification/ledger/area-map-whole-system-architecture.md",
    "immutableRefs": [],
    "recordedAt": "2026-10-15"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Workspace Topology Architecture",
    "anchor": "workspace-topology-architecture",
    "githubAnchor": "workspace-topology-architecture",
    "stableAnchor": "h-3a1ca6729e9e",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "dbbddecaa7d55c08594bb562576db34a91215ebbd035781a1dba012b2812b85c",
    "sample": "Workspace Topology Architecture",
    "sectionPayloadDigest": "37b316d4277bcfb5e539d55a628a4d80e113dea875b8ed5c3c6d53b0cc94c4d0",
    "followingBlockDigest": "23dfefb7d31af758f7248261a875778d05dc6fc597cb9090750673f0400f8343",
    "identityFingerprint": "3cc6c555fe3d946fca427d1e9faf9fe5228381f7ccd72aa4eaa9b701d22ad2cc",
    "ancestry": [],
    "text": "# Workspace Topology Architecture",
    "sectionText": "# Workspace Topology Architecture\n\n**Status:** Architecture contract draft; pending decision on durable work-history\nplacement.\n**Date:** 2026-09-04.\n**Scope:** Identity, state ownership, root resolution, and mutation authority for\nfgOS in single-workspace and isolated-worktree modes.\n\nThis document is the topology contract. It defines the primitive every\npackaging, work-state, coding-domain, runtime-coordination, config/init/doctor,\nand future host-surface design must use:\n\n```txt\nTopologyContext = resolved identities + typed roots + granted capabilities\n```\n\nNo business/workflow module should infer \"main root\", \"cwd root\", or a `.fgos`\npath directly. It should receive a `TopologyContext` and use the typed root or\ncapability named by that context.\n\nCompanion documents:\n\n- [workspace-topology-audit.md](workspace-topology-audit.md) records current\n  codebase evidence and gaps.\n- [workspace-topology-roadmap.md](workspace-topology-roadmap.md) records\n  decision order and migration slices."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Workspace Topology Architecture",
    "anchor": "workspace-topology-architecture",
    "githubAnchor": "workspace-topology-architecture",
    "stableAnchor": "h-3a1ca6729e9e",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "e4b7e9f4c86adc2fb2e428bf09cfd932181928fd2db840a5aeb61b6a23d3d7fc",
    "sample": "Workspace Topology Architecture",
    "sectionPayloadDigest": "8acebd4a817fa367f1dde221cee7a7c6d334b6e0c8d0e073aebdac6bdf2f6cdd",
    "followingBlockDigest": "e44eb7add5cc37f535199ac750be110dd7e016fcab5900b300da62673e7f921f",
    "identityFingerprint": "ac387e2020eb7d8eac0657ecaa5c39932d2974a11417dc0661c975c354027425",
    "ancestry": [],
    "text": "# Workspace Topology Architecture",
    "sectionText": "# Workspace Topology Architecture\n\n```txt\nDocument type: Architecture\nAudience: Human reviewer, architect, maintainer, agent\nPurpose: Preserve the complete workspace-topology.md source at its frozen-map candidate owner\nDesign status: Candidate\nImplementation: Partial — inherited source qualifications; not independently truth-verified\nProvenance: docs/architect/workspace-topology.md at 69dd3ee7fd84bc5e93fe9c75d63622d4f5aa8539 (blob 0513cd70c080c546bb009a253adab60dbb5d43f1)\nWriter type: Agent carriage; independent review pending\nCanonical for: Nothing until promotion; current source remains docs/architect/workspace-topology.md\nUse this when: Reviewing whole-system candidate carriage and placement\nDo not use this for: Inferring implementation, promotion or superseding source authority\nLast reviewed: Pending independent review\nRelated:\n- docs/architect/workspace-topology.md\n- docs/platform/component-boundary.md\n- docs/platform/architecture-map.md\nSupersedes: None — candidate only\nSuperseded by: None\n```\n\nAdded in candidate: migration metadata and physical link rebasing. Original source metadata, dates, design limits and historic claims below are provenance, not fresh review. Current truth is unverified; A28 requires sampled truth review at this checkpoint and full truth review at promotion.\n\n\n**Status:** Architecture contract draft; pending decision on durable work-history\nplacement.\n**Date:** 2026-09-04.\n**Scope:** Identity, state ownership, root resolution, and mutation authority for\nfgOS in single-workspace and isolated-worktree modes.\n\nThis document is the topology contract. It defines the primitive every\npackaging, work-state, coding-domain, runtime-coordination, config/init/doctor,\nand future host-surface design must use:\n\n```txt\nTopologyContext = resolved identities + typed roots + granted capabilities\n```\n\nNo business/workflow module should infer \"main root\", \"cwd root\", or a `.fgos`\npath directly. It should receive a `TopologyContext` and use the typed root or\ncapability named by that context.\n\nCompanion documents:\n\n- [workspace-topology-audit.md](workspace-topology-audit.md) records current\n  codebase evidence and gaps.\n- [workspace-topology-roadmap.md](workspace-topology-roadmap.md) records\n  decision order and migration slices."
  }
}
```

## Entry f-227: link-227

```json
{
  "id": "link-227",
  "path": "docs/platform/packaging-distribution/spec.md",
  "inputLine": 450,
  "inputColumn": 1,
  "lineBeforeLinkPass": 450,
  "before": "[Workspace Topology Architecture](../../architect/workspace-topology.md)",
  "after": "[Workspace Topology Architecture](../system-architecture/architecture/workspace-topology.md)",
  "legacyPath": "docs/architect/workspace-topology.md",
  "target": {
    "path": "docs/platform/system-architecture/architecture/workspace-topology.md",
    "anchor": null,
    "aliasId": "step10-whole-system-1458"
  },
  "portal": false,
  "area": "packaging-distribution",
  "reviewStatus": "pending",
  "oldDestination": "../../architect/workspace-topology.md",
  "newDestination": "../system-architecture/architecture/workspace-topology.md",
  "alias": {
    "aliasId": "step10-whole-system-1458",
    "fromPath": "docs/architect/workspace-topology.md",
    "toOwner": "docs/platform/system-architecture/architecture/workspace-topology.md",
    "toAnchor": null,
    "kind": "moved",
    "evidenceRef": "plans/260925-documentation-authority-unification/ledger/area-map-whole-system-architecture.md",
    "immutableRefs": [],
    "recordedAt": "2026-10-15"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Workspace Topology Architecture",
    "anchor": "workspace-topology-architecture",
    "githubAnchor": "workspace-topology-architecture",
    "stableAnchor": "h-3a1ca6729e9e",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "dbbddecaa7d55c08594bb562576db34a91215ebbd035781a1dba012b2812b85c",
    "sample": "Workspace Topology Architecture",
    "sectionPayloadDigest": "37b316d4277bcfb5e539d55a628a4d80e113dea875b8ed5c3c6d53b0cc94c4d0",
    "followingBlockDigest": "23dfefb7d31af758f7248261a875778d05dc6fc597cb9090750673f0400f8343",
    "identityFingerprint": "3cc6c555fe3d946fca427d1e9faf9fe5228381f7ccd72aa4eaa9b701d22ad2cc",
    "ancestry": [],
    "text": "# Workspace Topology Architecture",
    "sectionText": "# Workspace Topology Architecture\n\n**Status:** Architecture contract draft; pending decision on durable work-history\nplacement.\n**Date:** 2026-09-04.\n**Scope:** Identity, state ownership, root resolution, and mutation authority for\nfgOS in single-workspace and isolated-worktree modes.\n\nThis document is the topology contract. It defines the primitive every\npackaging, work-state, coding-domain, runtime-coordination, config/init/doctor,\nand future host-surface design must use:\n\n```txt\nTopologyContext = resolved identities + typed roots + granted capabilities\n```\n\nNo business/workflow module should infer \"main root\", \"cwd root\", or a `.fgos`\npath directly. It should receive a `TopologyContext` and use the typed root or\ncapability named by that context.\n\nCompanion documents:\n\n- [workspace-topology-audit.md](workspace-topology-audit.md) records current\n  codebase evidence and gaps.\n- [workspace-topology-roadmap.md](workspace-topology-roadmap.md) records\n  decision order and migration slices."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Workspace Topology Architecture",
    "anchor": "workspace-topology-architecture",
    "githubAnchor": "workspace-topology-architecture",
    "stableAnchor": "h-3a1ca6729e9e",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "e4b7e9f4c86adc2fb2e428bf09cfd932181928fd2db840a5aeb61b6a23d3d7fc",
    "sample": "Workspace Topology Architecture",
    "sectionPayloadDigest": "8acebd4a817fa367f1dde221cee7a7c6d334b6e0c8d0e073aebdac6bdf2f6cdd",
    "followingBlockDigest": "e44eb7add5cc37f535199ac750be110dd7e016fcab5900b300da62673e7f921f",
    "identityFingerprint": "ac387e2020eb7d8eac0657ecaa5c39932d2974a11417dc0661c975c354027425",
    "ancestry": [],
    "text": "# Workspace Topology Architecture",
    "sectionText": "# Workspace Topology Architecture\n\n```txt\nDocument type: Architecture\nAudience: Human reviewer, architect, maintainer, agent\nPurpose: Preserve the complete workspace-topology.md source at its frozen-map candidate owner\nDesign status: Candidate\nImplementation: Partial — inherited source qualifications; not independently truth-verified\nProvenance: docs/architect/workspace-topology.md at 69dd3ee7fd84bc5e93fe9c75d63622d4f5aa8539 (blob 0513cd70c080c546bb009a253adab60dbb5d43f1)\nWriter type: Agent carriage; independent review pending\nCanonical for: Nothing until promotion; current source remains docs/architect/workspace-topology.md\nUse this when: Reviewing whole-system candidate carriage and placement\nDo not use this for: Inferring implementation, promotion or superseding source authority\nLast reviewed: Pending independent review\nRelated:\n- docs/architect/workspace-topology.md\n- docs/platform/component-boundary.md\n- docs/platform/architecture-map.md\nSupersedes: None — candidate only\nSuperseded by: None\n```\n\nAdded in candidate: migration metadata and physical link rebasing. Original source metadata, dates, design limits and historic claims below are provenance, not fresh review. Current truth is unverified; A28 requires sampled truth review at this checkpoint and full truth review at promotion.\n\n\n**Status:** Architecture contract draft; pending decision on durable work-history\nplacement.\n**Date:** 2026-09-04.\n**Scope:** Identity, state ownership, root resolution, and mutation authority for\nfgOS in single-workspace and isolated-worktree modes.\n\nThis document is the topology contract. It defines the primitive every\npackaging, work-state, coding-domain, runtime-coordination, config/init/doctor,\nand future host-surface design must use:\n\n```txt\nTopologyContext = resolved identities + typed roots + granted capabilities\n```\n\nNo business/workflow module should infer \"main root\", \"cwd root\", or a `.fgos`\npath directly. It should receive a `TopologyContext` and use the typed root or\ncapability named by that context.\n\nCompanion documents:\n\n- [workspace-topology-audit.md](workspace-topology-audit.md) records current\n  codebase evidence and gaps.\n- [workspace-topology-roadmap.md](workspace-topology-roadmap.md) records\n  decision order and migration slices."
  }
}
```

## Entry f-228: link-228

```json
{
  "id": "link-228",
  "path": "docs/platform/proposals/architecture-advisory-panel.md",
  "inputLine": 24,
  "inputColumn": 22,
  "lineBeforeLinkPass": 24,
  "before": "[original source](../../architect/proposals/architecture-advisory-panel.md)",
  "after": "[original source](architecture-advisory-panel.md)",
  "legacyPath": "docs/architect/proposals/architecture-advisory-panel.md",
  "target": {
    "path": "docs/platform/proposals/architecture-advisory-panel.md",
    "anchor": null,
    "aliasId": "step10-proposals-redesigns-0010"
  },
  "portal": false,
  "area": "proposals",
  "reviewStatus": "pending",
  "oldDestination": "../../architect/proposals/architecture-advisory-panel.md",
  "newDestination": "architecture-advisory-panel.md",
  "alias": {
    "aliasId": "step10-proposals-redesigns-0010",
    "fromPath": "docs/architect/proposals/architecture-advisory-panel.md",
    "toOwner": "docs/platform/proposals/architecture-advisory-panel.md",
    "toAnchor": null,
    "kind": "moved",
    "evidenceRef": "plans/260925-documentation-authority-unification/ledger/area-map-proposals-redesigns.md",
    "immutableRefs": [],
    "recordedAt": "2026-10-15"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Architecture Advisory Panel",
    "anchor": "architecture-advisory-panel",
    "githubAnchor": "architecture-advisory-panel",
    "stableAnchor": "h-328634c737cd",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "aef9241c6773a4fee5177cccf3d4f1288dde72d533970dc7ca230f4dd117bdf6",
    "sample": "Architecture Advisory Panel",
    "sectionPayloadDigest": "b189fc44dd6ed083d979ddd2eb8f36020d29ddc0b8de1041963a371ac1273668",
    "followingBlockDigest": "c796df6a48fa21294a1a724666c204188abbbbe42284ff7e382030c3746b6b5d",
    "identityFingerprint": "d6a79770d8e016a4234254df8f9276d73ab48bf2e2ddcc5eec3985408b45fa14",
    "ancestry": [],
    "text": "# Architecture Advisory Panel",
    "sectionText": "# Architecture Advisory Panel\n\nDocument type: Proposal\nDesign status: Discussion\nImplementation: Not started\nLast reviewed: 2026-09-05\nCanonical for: nothing until explicitly accepted and promoted\n\nScope: define the next natural Group Thinking use case after the coding-focused\n`fgos-code-panel`: a bounded advisory panel that can understand an initially\nclear or unclear software-system problem, investigate before asking a person,\ndevelop and challenge architecture alternatives, explain its recommendation,\nand remain available for a decision dialogue without taking decision authority\nfrom the person.\n\nRelated:\n[Step 09 Group Thinking Substrate](step-09-group-thinking-substrate.md),\n[Agent Coordination Vision](../agent-coordination/vision.md),\n[CoordinationSession Contract](../agent-coordination/contracts/coordination-session.md),\n[FlowDefinition Contract](../agent-coordination/contracts/flow-definition.md),\n[Group Thinking user guide](../../how-to/use-fgos-group-thinking.md), and\n[`fgos-code-panel`](../../../.agents/skills/fgos-code-panel/SKILL.md).\n\nImplementation plan:\n[Architecture Advisory Panel execution track](../../../plans/260905-architecture-advisory-panel/plan.md)."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Architecture Advisory Panel",
    "anchor": "architecture-advisory-panel",
    "githubAnchor": "architecture-advisory-panel",
    "stableAnchor": "h-328634c737cd",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "e7448aaac301af577b2157d8e86e6bdbba67e65d887d8424707085dfb91d2a37",
    "sample": "Architecture Advisory Panel",
    "sectionPayloadDigest": "3202145b580105568f8ed40b5fc7f9366c42dc974363b06ecf5fd7281e0bbe02",
    "followingBlockDigest": "0ae2c71bbe853b9fd217590bbc61b6c43096600dfa547f82fdec85250ef04ab9",
    "identityFingerprint": "9172a0f2d69010c9827e03dd852cfc65aaa12dcfecf49ae201f74e27acbbf8fa",
    "ancestry": [],
    "text": "# Architecture Advisory Panel",
    "sectionText": "# Architecture Advisory Panel\n\n```txt\nDocument type: Proposal\nAudience: Human reviewer, architect, maintainer, agent\nPurpose: Preserve mapped source text for independent conservation review\nDesign status: Candidate\nImplementation: Source snapshot retained; current implementation truth not certified\nProvenance: docs/architect/proposals/architecture-advisory-panel.md at fb046210539cbcbe8ca1dab254763f5e78c573d2; blob 9bb16cb08aef516e20efd07e896890f7eb7b3e1f\nWriter type: Agent draft writer\nCanonical: No\nCanonical for: Nothing; non-canonical candidate conservation carrier\nUse this when: Reviewing source carriage, placement, intent and provenance\nDo not use this for: Current authority, implementation proof or cutover approval\nLast reviewed: Pending independent review\nRelated:\n- docs/architect/proposals/architecture-advisory-panel.md\nSupersedes: None; legacy source remains intact\nSuperseded by: None\n```\n\nAdded in candidate: Candidate proposal for the architecture-advisory use case, now served by core/workflows/architecture-advisory.yaml and core/skills/fgos-architecture-panel/SKILL.md. The original protocol was removed in 2180b4e72; its source Not started header is preserved as dated metadata. Original source metadata and text follow. Physical relative-link destinations alone are rebased to the same repository paths. Units with inherited missing links are preserved as literal fenced source text, without substituting another design or changing any assertion. Source metadata is provenance, not candidate authority.\n\nSource relationship: [original source](architecture-advisory-panel.md).\n\n\nDocument type: Proposal\nDesign status: Discussion\nImplementation: Not started\nLast reviewed: 2026-09-05\nCanonical for: nothing until explicitly accepted and promoted\n\nScope: define the next natural Group Thinking use case after the coding-focused\n`fgos-code-panel`: a bounded advisory panel that can understand an initially\nclear or unclear software-system problem, investigate before asking a person,\ndevelop and challenge architecture alternatives, explain its recommendation,\nand remain available for a decision dialogue without taking decision authority\nfrom the person.\n\n````markdown\nRelated:\n[Step 09 Group Thinking Substrate](step-09-group-thinking-substrate.md),\n[Agent Coordination Vision](../agent-coordination/vision.md),\n[CoordinationSession Contract](../agent-coordination/contracts/coordination-session.md),\n[FlowDefinition Contract](../agent-coordination/contracts/flow-definition.md),\n[Group Thinking user guide](../../how-to/use-fgos-group-thinking.md), and\n[`fgos-code-panel`](../../../.agents/skills/fgos-code-panel/SKILL.md).\n````\n\n\n````markdown\nImplementation plan:\n[Architecture Advisory Panel execution track](../../../plans/260905-architecture-advisory-panel/plan.md).\n````"
  }
}
```

## Entry f-229: link-229

```json
{
  "id": "link-229",
  "path": "docs/platform/proposals/architecture-advisory-panel.md",
  "inputLine": 59,
  "inputColumn": 25,
  "lineBeforeLinkPass": 59,
  "before": "[Coordination Capability Envelope](../../architect/proposals/coordination-capability-envelope.md)",
  "after": "[Coordination Capability Envelope](coordination-capability-envelope.md)",
  "legacyPath": "docs/architect/proposals/coordination-capability-envelope.md",
  "target": {
    "path": "docs/platform/proposals/coordination-capability-envelope.md",
    "anchor": null,
    "aliasId": "step10-proposals-redesigns-0230"
  },
  "portal": false,
  "area": "proposals",
  "reviewStatus": "pending",
  "oldDestination": "../../architect/proposals/coordination-capability-envelope.md",
  "newDestination": "coordination-capability-envelope.md",
  "alias": {
    "aliasId": "step10-proposals-redesigns-0230",
    "fromPath": "docs/architect/proposals/coordination-capability-envelope.md",
    "toOwner": "docs/platform/proposals/coordination-capability-envelope.md",
    "toAnchor": null,
    "kind": "moved",
    "evidenceRef": "plans/260925-documentation-authority-unification/ledger/area-map-proposals-redesigns.md",
    "immutableRefs": [],
    "recordedAt": "2026-10-15"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Agent Coordination — Capability Envelope và Coordinator-Owned Deliberation",
    "anchor": "agent-coordination-capability-envelope-và-coordinator-owned-deliberation",
    "githubAnchor": "agent-coordination-capability-envelope-và-coordinator-owned-deliberation",
    "stableAnchor": "h-393c56c93707",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "9f5435e86966d369799bacf179050534948e66a37db38f3a0dd6bfef8d86600e",
    "sample": "Agent Coordination — Capability Envelope và Coordinator-Owned Deliberation",
    "sectionPayloadDigest": "65e84dabdefc8287c7ff891acdc44ce6b361ea1a35022289a8436279450f3ae2",
    "followingBlockDigest": "65e84dabdefc8287c7ff891acdc44ce6b361ea1a35022289a8436279450f3ae2",
    "identityFingerprint": "50a1e53241f6d90c3112e81e6d36d58d504dbe38188e4ebe9eba7d198f594261",
    "ancestry": [],
    "text": "# Agent Coordination — Capability Envelope và Coordinator-Owned Deliberation",
    "sectionText": "# Agent Coordination — Capability Envelope và Coordinator-Owned Deliberation\n\nDocument type: Proposal\nDesign status: Discussion\nImplementation: Not started for the proposed architecture; existing substrate is partially implemented\nLast reviewed: 2026-09-06\nCanonical for: nothing until explicitly accepted and promoted\nState class: State — current conceptual recommendation; independent review remains historical evidence"
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Agent Coordination — Capability Envelope và Coordinator-Owned Deliberation",
    "anchor": "agent-coordination-capability-envelope-và-coordinator-owned-deliberation",
    "githubAnchor": "agent-coordination-capability-envelope-và-coordinator-owned-deliberation",
    "stableAnchor": "h-393c56c93707",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "1691499bfcc170b63032e1425cca6313ee074c0bfe79c80b6afd1cd6545ff583",
    "sample": "Agent Coordination — Capability Envelope và Coordinator-Owned Deliberation",
    "sectionPayloadDigest": "eeafb1602560739661656b1ac70c7e8e0088067dbef349a9c26a4e8775007d90",
    "followingBlockDigest": "dba7324811b753bc41ecd8386e4e574d8b2df4166d6de9a73f3d490aa2c6a892",
    "identityFingerprint": "55447f398baa5498054164797e18aef8820a152490571fa03171434977886f74",
    "ancestry": [],
    "text": "# Agent Coordination — Capability Envelope và Coordinator-Owned Deliberation",
    "sectionText": "# Agent Coordination — Capability Envelope và Coordinator-Owned Deliberation\n\n```txt\nDocument type: Proposal\nAudience: Human reviewer, architect, maintainer, agent\nPurpose: Preserve mapped source text for independent conservation review\nDesign status: Candidate\nImplementation: Source snapshot retained; current implementation truth not certified\nProvenance: docs/architect/proposals/coordination-capability-envelope.md at fb046210539cbcbe8ca1dab254763f5e78c573d2; blob d4ac1a3f53574846f15b7a46a6062f0080a0e4e6\nWriter type: Agent draft writer\nCanonical: No\nCanonical for: Nothing; non-canonical candidate conservation carrier\nUse this when: Reviewing source carriage, placement, intent and provenance\nDo not use this for: Current authority, implementation proof or cutover approval\nLast reviewed: Pending independent review\nRelated:\n- docs/architect/proposals/coordination-capability-envelope.md\nSupersedes: None; legacy source remains intact\nSuperseded by: None\n```\n\nAdded in candidate: Candidate alternative recommendation using the surviving Assignment/Run execution substrate. The session engine cited by the source was removed in 2180b4e72; this envelope recommendation remains unaccepted. Original source metadata and text follow. Physical relative-link destinations alone are rebased to the same repository paths. Units with inherited missing links are preserved as literal fenced source text, without substituting another design or changing any assertion. Source metadata is provenance, not candidate authority.\n\nSource relationship: [original source](coordination-capability-envelope.md).\n\n\nDocument type: Proposal\nDesign status: Discussion\nImplementation: Not started for the proposed architecture; existing substrate is partially implemented\nLast reviewed: 2026-09-06\nCanonical for: nothing until explicitly accepted and promoted\nState class: State — current conceptual recommendation; independent review remains historical evidence"
  }
}
```

## Entry f-230: link-230

```json
{
  "id": "link-230",
  "path": "docs/platform/proposals/component-authority-boundary-map.md",
  "inputLine": 24,
  "inputColumn": 22,
  "lineBeforeLinkPass": 24,
  "before": "[original source](../../architect/proposals/component-authority-boundary-map.md)",
  "after": "[original source](component-authority-boundary-map.md)",
  "legacyPath": "docs/architect/proposals/component-authority-boundary-map.md",
  "target": {
    "path": "docs/platform/proposals/component-authority-boundary-map.md",
    "anchor": null,
    "aliasId": "step10-proposals-redesigns-0130"
  },
  "portal": false,
  "area": "proposals",
  "reviewStatus": "pending",
  "oldDestination": "../../architect/proposals/component-authority-boundary-map.md",
  "newDestination": "component-authority-boundary-map.md",
  "alias": {
    "aliasId": "step10-proposals-redesigns-0130",
    "fromPath": "docs/architect/proposals/component-authority-boundary-map.md",
    "toOwner": "docs/platform/proposals/component-authority-boundary-map.md",
    "toAnchor": null,
    "kind": "moved",
    "evidenceRef": "plans/260925-documentation-authority-unification/ledger/area-map-proposals-redesigns.md",
    "immutableRefs": [],
    "recordedAt": "2026-10-15"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Component Authority Boundary Map",
    "anchor": "component-authority-boundary-map",
    "githubAnchor": "component-authority-boundary-map",
    "stableAnchor": "h-b63ba0b08ef7",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "2e1bf1c32aef1b208e6145a9016e75a6c3cdc39dbc2f7124cb23ec012a4f2872",
    "sample": "Component Authority Boundary Map",
    "sectionPayloadDigest": "f803e72921b475b1a1c7d6e813238314618a3f97d8e7e975223cd9674ab5f37c",
    "followingBlockDigest": "f803e72921b475b1a1c7d6e813238314618a3f97d8e7e975223cd9674ab5f37c",
    "identityFingerprint": "f29334ed0acf79f63084db3bc67c773f422bd096b7fe475b53b77b314ea41cd9",
    "ancestry": [],
    "text": "# Component Authority Boundary Map",
    "sectionText": "# Component Authority Boundary Map\n\nDocument type: Proposal artifact\nDesign status: Draft / architect-level discussion\nImplementation: Not started\nLast reviewed: 2026-09-02\nCanonical for: nothing until promoted or replaced by an accepted boundary document\nRelated: [Step 09 Group Thinking Substrate](step-09-group-thinking-substrate.md), [Step 10 Coding Domain Adoption](step-10-coding-domain-adoption.md), [Agent Coordination Vision](../agent-coordination/vision.md), [Intent Preservation Ledger](../agent-coordination/intent-preservation-ledger.md), [Architecture Intent](../architecture-intent.md), [Component Boundary Advisory](../component-boundary/component-boundary-advisory.md), [Repo Layout Vision](../component-boundary/repo-layout-vision.md), [Host Invocation And Provider Routing](../host-invocation-routing/host-invocation-provider-routing.md), [Node To Rust Component Migration](../host-invocation-routing/node-to-rust-component-migration.md)"
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Component Authority Boundary Map",
    "anchor": "component-authority-boundary-map",
    "githubAnchor": "component-authority-boundary-map",
    "stableAnchor": "h-b63ba0b08ef7",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "ea76b5f02344271149099a664a5f178492877996d5e5b0b3c6f548533cd8829b",
    "sample": "Component Authority Boundary Map",
    "sectionPayloadDigest": "f7aec02b4a0d5b517bda6c4d1d4602f025565171d88ac253042f71b6eb5b599b",
    "followingBlockDigest": "44af44d95a1b9708d2ce46e0d0b0b294c7063a53456ac8c2fcee7e2377ecb155",
    "identityFingerprint": "fc7f71adf1cf39a1afef06167dc43153462532a6cd24d06bd0ee4bd77cf9b7b4",
    "ancestry": [],
    "text": "# Component Authority Boundary Map",
    "sectionText": "# Component Authority Boundary Map\n\n```txt\nDocument type: Proposal\nAudience: Human reviewer, architect, maintainer, agent\nPurpose: Preserve mapped source text for independent conservation review\nDesign status: Candidate\nImplementation: Source snapshot retained; current implementation truth not certified\nProvenance: docs/architect/proposals/component-authority-boundary-map.md at fb046210539cbcbe8ca1dab254763f5e78c573d2; blob 2f1d0c94a40f1426c0d6b221abb35b379deb9ba7\nWriter type: Agent draft writer\nCanonical: No\nCanonical for: Nothing; non-canonical candidate conservation carrier\nUse this when: Reviewing source carriage, placement, intent and provenance\nDo not use this for: Current authority, implementation proof or cutover approval\nLast reviewed: Pending independent review\nRelated:\n- docs/architect/proposals/component-authority-boundary-map.md\nSupersedes: None; legacy source remains intact\nSuperseded by: None\n```\n\nAdded in candidate: Candidate carriage; Keep map proposal. No component-boundary change; no promotion of draft ports or ownership. Original source metadata and text follow. Physical relative-link destinations alone are rebased to the same repository paths. Units with inherited missing links are preserved as literal fenced source text, without substituting another design or changing any assertion. Source metadata is provenance, not candidate authority.\n\nSource relationship: [original source](component-authority-boundary-map.md).\n\n\nDocument type: Proposal artifact\nDesign status: Draft / architect-level discussion\nImplementation: Not started\nLast reviewed: 2026-09-02\nCanonical for: nothing until promoted or replaced by an accepted boundary document\nRelated: [Step 09 Group Thinking Substrate](step-09-group-thinking-substrate.md), [Step 10 Coding Domain Adoption](step-10-coding-domain-adoption.md), [Agent Coordination Vision](../agent-coordination/README.md), [Intent Preservation Ledger](../agent-coordination/README.md), [Architecture Intent](../system-architecture/architecture/architecture-intent.md), [Component Boundary Advisory](../component-boundary.md), [Repo Layout Vision](../component-boundary.md), [Host Invocation And Provider Routing](../host-invocation-routing/README.md), [Node To Rust Component Migration](../host-invocation-routing/README.md)"
  }
}
```

## Entry f-231: link-231

```json
{
  "id": "link-231",
  "path": "docs/platform/proposals/component-authority-boundary-map.md",
  "inputLine": 32,
  "inputColumn": 10,
  "lineBeforeLinkPass": 32,
  "before": "[Step 09 Group Thinking Substrate](../../architect/proposals/step-09-group-thinking-substrate.md)",
  "after": "[Step 09 Group Thinking Substrate](step-09-group-thinking-substrate.md)",
  "legacyPath": "docs/architect/proposals/step-09-group-thinking-substrate.md",
  "target": {
    "path": "docs/platform/proposals/step-09-group-thinking-substrate.md",
    "anchor": null,
    "aliasId": "step10-proposals-redesigns-0509"
  },
  "portal": false,
  "area": "proposals",
  "reviewStatus": "pending",
  "oldDestination": "../../architect/proposals/step-09-group-thinking-substrate.md",
  "newDestination": "step-09-group-thinking-substrate.md",
  "alias": {
    "aliasId": "step10-proposals-redesigns-0509",
    "fromPath": "docs/architect/proposals/step-09-group-thinking-substrate.md",
    "toOwner": "docs/platform/proposals/step-09-group-thinking-substrate.md",
    "toAnchor": null,
    "kind": "moved",
    "evidenceRef": "plans/260925-documentation-authority-unification/ledger/area-map-proposals-redesigns.md",
    "immutableRefs": [],
    "recordedAt": "2026-10-15"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Step 09 - Group Thinking Substrate",
    "anchor": "step-09---group-thinking-substrate",
    "githubAnchor": "step-09---group-thinking-substrate",
    "stableAnchor": "h-ffa3aff143e5",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "4704ac59101e08fe8aaeb92ea9ac4d855c6ba41023b8e11344b39ccc2f56a65e",
    "sample": "Step 09 - Group Thinking Substrate",
    "sectionPayloadDigest": "1431475be682a3f667bcebbf2ff00ded1f9ce35668fe219959af7f98b8969017",
    "followingBlockDigest": "e255b7e73d3d36b05a2a2b3ffa7e65220deb77f04b8c39a036a5ead6482e7374",
    "identityFingerprint": "6ea7f8f85f29ebe898cfb95027397bc8c806d5e8458b91a1ce39248698004f64",
    "ancestry": [],
    "text": "# Step 09 - Group Thinking Substrate",
    "sectionText": "# Step 09 - Group Thinking Substrate\n\nDocument type: Proposal\nDesign status: Accepted for the implemented slice (MVP0-9 plus the Post-MVP9\nAcceptance Layer); Discussion for every item this document still names as\ndeferred (vote/rank tally/weighted scoring/convergence, anonymization,\npartial-window exceptions, aggregate transformation, cross-session grants,\n`addSessionEdge`/arbitrary topology overlays, driver handoff, persistent\norganization membership, peer-invited specialists — none of these are\nimplemented or claimed by any cell in this track).\nImplementation: MVP0-5 implemented per `step-09-group-thinking-mvp1-mvp2`\n(MVP1/MVP2) and `step-09-mvp3-to-mvp5` (MVP3-MVP5). MVP6-9 (§8.1's own\n\"Locked MVP6-MVP9 Shape\") plus the Post-MVP9 Acceptance Layer (§8.2: the\nGroup-Thinking Protocol Pack, three conformance-proven protocol\ndefinitions, and the `fgos-group-thinking` skill) implemented and closed by\n`step-09-mvp6-to-mvp9` (Phases 00/06/07/08/09/10, including the\nuser-authorized P10-KERNEL-FIX quorum fix) — see that track's own\nverification index for the full per-phase evidence trail and the\n[CoordinationSession Contract](../agent-coordination/contracts/coordination-session.md)/\n[FlowDefinition Contract](../agent-coordination/contracts/flow-definition.md)\nfor the promoted contract text, each with its own named limitations.\nLast reviewed: 2026-09-04\nCanonical for: nothing until explicitly accepted; the implemented MVP0-9 +\nPost-MVP9 Acceptance Layer slice is canonical only through the\nCoordinationSession/FlowDefinition contracts it was promoted into, above —\nthis proposal document itself never becomes canonical by implementation\nalone\nOriginal date: 2026-09-02\nScope: preserve and narrow the next Agent Coordination design frontier after\nStep 08: make fgOS able to express richer group-thinking and problem-solving\ncollaboration patterns without weakening the isolation-heavy fixtures already\nproved by Step 08.\nIntent traceability: [Architecture Intent](../architecture-intent.md),\n[Agent Coordination Intent Preservation Ledger](../agent-coordination/intent-preservation-ledger.md)\nRelated: [Coordination Foundation Baseline](../agent-coordination/architecture/coordination-foundation-baseline.md),\n[CoordinationSession Contract](../agent-coordination/contracts/coordination-session.md),\n[FlowDefinition Contract](../agent-coordination/contracts/flow-definition.md),\n[Team Communication Protocol V1](../agent-coordination/proposals/team-communication-protocol-v1.md),\n[Component Authority Boundary Map](component-authority-boundary-map.md),\n[Step 10 Coding Domain Adoption](step-10-coding-domain-adoption.md),\n[Step 09 MVP1/MVP2 group-thinking verification](../agent-coordination/verification/step-09-group-thinking-mvp1-mvp2/index.md),\n[Step 09 MVP3-MVP5 verification](../agent-coordination/verification/step-09-mvp3-to-mvp5/index.md),\n[MVP6+ Dogfood Handoff](../agent-coordination/playbooks/mvp6-dogfood-handoff.md)\n\nImplementation note (updated by `step-09-mvp6-to-mvp9`'s own closing cell,\nP10.10 — Step 09 is now closed): MVP1-MVP5 promoted starting Phase 00 — see\n`step-09-group-thinking-mvp1-mvp2` (MVP1/MVP2) and `step-09-mvp3-to-mvp5`\n(MVP3-MVP5: recheck lineage/disposition hardening, a thin CLI launcher,\nintentional role-tier dispatch policy, and session resume). MVP6 visibility\nwindows, MVP7 aggregation rules, MVP8 deliberation memory, and MVP9\ndynamic specialist pull-in — §8.1's own \"Locked MVP6-MVP9 Shape\" — are now\nIMPLEMENTED AND PROVEN, along with the Post-MVP9 Acceptance Layer (§8.2):\nthe Group-Thinking Protocol Pack, three real, conformance-proven protocol\ndefinitions (RFC-Review-Lite, Nominal-Group-Lite, Delphi-Feedback-Lite),\nand the `fgos-group-thinking` skill — see\n`docs/architect/agent-coordination/verification/step-09-mvp6-to-mvp9/index.md`\nfor the full evidence trail and the CoordinationSession/FlowDefinition\ncontracts for the promoted text. This document still does not authorize\nany runtime/schema change beyond what those contracts now accept — every\nitem this document names elsewhere as deferred (§8.1's per-MVP \"remain\ndeferred\" clauses; §15 \"Explicitly Not Proposed\") is STILL deferred, not\nimplemented by this track: no vote/rank tally/weighted scoring/convergence\nsemantics, no anonymization, no partial-window exceptions, no aggregate\ntransformation, no cross-session grants, no `addSessionEdge`/arbitrary\ntopology overlay, no driver handoff, no persistent organization\nmembership, no peer-invited specialists. It exists so a future deferred\nslice does not narrow the original intent into only the currently\nconvenient fixture."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Step 09 - Group Thinking Substrate",
    "anchor": "step-09---group-thinking-substrate",
    "githubAnchor": "step-09---group-thinking-substrate",
    "stableAnchor": "h-ffa3aff143e5",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "96585078e961d44eda9b2c8a7eb1c6143fc19ba767e1d9af2bd9b4c134cb0852",
    "sample": "Step 09 - Group Thinking Substrate",
    "sectionPayloadDigest": "904c96d4029b99fb2f893f2b923181b9fa4cf71ccf6fd39b95b6a9a845877e28",
    "followingBlockDigest": "da3fc860df9919ceeb8426506ae9e64240eb21939a7308626955ec712ceabb48",
    "identityFingerprint": "cd8d5975448466bb31e7de4336bb934cef856448c54605624a6f162b828966f5",
    "ancestry": [],
    "text": "# Step 09 - Group Thinking Substrate",
    "sectionText": "# Step 09 - Group Thinking Substrate\n\n```txt\nDocument type: Proposal\nAudience: Human reviewer, architect, maintainer, agent\nPurpose: Preserve mapped source text for independent conservation review\nDesign status: Candidate\nImplementation: Source snapshot retained; current implementation truth not certified\nProvenance: docs/architect/proposals/step-09-group-thinking-substrate.md at fb046210539cbcbe8ca1dab254763f5e78c573d2; blob 0fe7e01a53cbed52b8557571136450f8533aeaea\nWriter type: Agent draft writer\nCanonical: No\nCanonical for: Nothing; non-canonical candidate conservation carrier\nUse this when: Reviewing source carriage, placement, intent and provenance\nDo not use this for: Current authority, implementation proof or cutover approval\nLast reviewed: Pending independent review\nRelated:\n- docs/architect/proposals/step-09-group-thinking-substrate.md\nSupersedes: None; legacy source remains intact\nSuperseded by: None\n```\n\nAdded in candidate: Candidate proposal retaining deferred capabilities referenced by docs/how-to/use-fgos-group-thinking.md:196–200. Current group-thinking guidance uses Workflows/presets; the old pack was removed in 2180b4e72. Source implementation and deferred-status statements remain dated metadata. Original source metadata and text follow. Physical relative-link destinations alone are rebased to the same repository paths. Units with inherited missing links are preserved as literal fenced source text, without substituting another design or changing any assertion. Source metadata is provenance, not candidate authority.\n\nSource relationship: [original source](step-09-group-thinking-substrate.md).\n\n\nDocument type: Proposal\nDesign status: Accepted for the implemented slice (MVP0-9 plus the Post-MVP9\nAcceptance Layer); Discussion for every item this document still names as\ndeferred (vote/rank tally/weighted scoring/convergence, anonymization,\npartial-window exceptions, aggregate transformation, cross-session grants,\n`addSessionEdge`/arbitrary topology overlays, driver handoff, persistent\norganization membership, peer-invited specialists — none of these are\nimplemented or claimed by any cell in this track).\nImplementation: MVP0-5 implemented per `step-09-group-thinking-mvp1-mvp2`\n(MVP1/MVP2) and `step-09-mvp3-to-mvp5` (MVP3-MVP5). MVP6-9 (§8.1's own\n\"Locked MVP6-MVP9 Shape\") plus the Post-MVP9 Acceptance Layer (§8.2: the\nGroup-Thinking Protocol Pack, three conformance-proven protocol\ndefinitions, and the `fgos-group-thinking` skill) implemented and closed by\n`step-09-mvp6-to-mvp9` (Phases 00/06/07/08/09/10, including the\nuser-authorized P10-KERNEL-FIX quorum fix) — see that track's own\nverification index for the full per-phase evidence trail and the\n[CoordinationSession Contract](../agent-coordination/history/retired-engine/files/contracts/coordination-session.md)/\n[FlowDefinition Contract](../agent-coordination/history/retired-engine/files/contracts/flow-definition.md)\nfor the promoted contract text, each with its own named limitations.\nLast reviewed: 2026-09-04\nCanonical for: nothing until explicitly accepted; the implemented MVP0-9 +\nPost-MVP9 Acceptance Layer slice is canonical only through the\nCoordinationSession/FlowDefinition contracts it was promoted into, above —\nthis proposal document itself never becomes canonical by implementation\nalone\nOriginal date: 2026-09-02\nScope: preserve and narrow the next Agent Coordination design frontier after\nStep 08: make fgOS able to express richer group-thinking and problem-solving\ncollaboration patterns without weakening the isolation-heavy fixtures already\nproved by Step 08.\nIntent traceability: [Architecture Intent](../system-architecture/architecture/architecture-intent.md),\n[Agent Coordination Intent Preservation Ledger](../agent-coordination/README.md)\nRelated: [Coordination Foundation Baseline](../agent-coordination/history/retired-engine/files/architecture/coordination-foundation-baseline.md),\n[CoordinationSession Contract](../agent-coordination/history/retired-engine/files/contracts/coordination-session.md),\n[FlowDefinition Contract](../agent-coordination/history/retired-engine/files/contracts/flow-definition.md),\n[Team Communication Protocol V1](../agent-coordination/README.md),\n[Component Authority Boundary Map](component-authority-boundary-map.md),\n[Step 10 Coding Domain Adoption](step-10-coding-domain-adoption.md),\n[Step 09 MVP1/MVP2 group-thinking verification](../agent-coordination/verification/step-09-group-thinking-mvp1-mvp2/index.md),\n[Step 09 MVP3-MVP5 verification](../agent-coordination/verification/step-09-mvp3-to-mvp5/index.md),\n[MVP6+ Dogfood Handoff](../agent-coordination/history/retired-engine/files/playbooks/mvp6-dogfood-handoff.md)\n\nImplementation note (updated by `step-09-mvp6-to-mvp9`'s own closing cell,\nP10.10 — Step 09 is now closed): MVP1-MVP5 promoted starting Phase 00 — see\n`step-09-group-thinking-mvp1-mvp2` (MVP1/MVP2) and `step-09-mvp3-to-mvp5`\n(MVP3-MVP5: recheck lineage/disposition hardening, a thin CLI launcher,\nintentional role-tier dispatch policy, and session resume). MVP6 visibility\nwindows, MVP7 aggregation rules, MVP8 deliberation memory, and MVP9\ndynamic specialist pull-in — §8.1's own \"Locked MVP6-MVP9 Shape\" — are now\nIMPLEMENTED AND PROVEN, along with the Post-MVP9 Acceptance Layer (§8.2):\nthe Group-Thinking Protocol Pack, three real, conformance-proven protocol\ndefinitions (RFC-Review-Lite, Nominal-Group-Lite, Delphi-Feedback-Lite),\nand the `fgos-group-thinking` skill — see\n`docs/architect/agent-coordination/verification/step-09-mvp6-to-mvp9/index.md`\nfor the full evidence trail and the CoordinationSession/FlowDefinition\ncontracts for the promoted text. This document still does not authorize\nany runtime/schema change beyond what those contracts now accept — every\nitem this document names elsewhere as deferred (§8.1's per-MVP \"remain\ndeferred\" clauses; §15 \"Explicitly Not Proposed\") is STILL deferred, not\nimplemented by this track: no vote/rank tally/weighted scoring/convergence\nsemantics, no anonymization, no partial-window exceptions, no aggregate\ntransformation, no cross-session grants, no `addSessionEdge`/arbitrary\ntopology overlay, no driver handoff, no persistent organization\nmembership, no peer-invited specialists. It exists so a future deferred\nslice does not narrow the original intent into only the currently\nconvenient fixture."
  }
}
```

## Entry f-232: link-232

```json
{
  "id": "link-232",
  "path": "docs/platform/proposals/component-authority-boundary-map.md",
  "inputLine": 32,
  "inputColumn": 109,
  "lineBeforeLinkPass": 32,
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
  "reviewStatus": "pending",
  "oldDestination": "../../architect/proposals/step-10-coding-domain-adoption.md",
  "newDestination": "step-10-coding-domain-adoption.md",
  "alias": {
    "aliasId": "step10-proposals-redesigns-0763",
    "fromPath": "docs/architect/proposals/step-10-coding-domain-adoption.md",
    "toOwner": "docs/platform/proposals/step-10-coding-domain-adoption.md",
    "toAnchor": null,
    "kind": "moved",
    "evidenceRef": "plans/260925-documentation-authority-unification/ledger/area-map-proposals-redesigns.md",
    "immutableRefs": [],
    "recordedAt": "2026-10-15"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Step 10 - Coding Domain Adoption Of The Coordination Foundation",
    "anchor": "step-10---coding-domain-adoption-of-the-coordination-foundation",
    "githubAnchor": "step-10---coding-domain-adoption-of-the-coordination-foundation",
    "stableAnchor": "h-7eff7eef034a",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "6b10f57a58673f82671fa342322f06086aae34c350691e0fb73e0434cfc37a5c",
    "sample": "Step 10 - Coding Domain Adoption Of The Coordination Foundation",
    "sectionPayloadDigest": "d89dc00b1a074a2bb2f9d50d474846f1e2c7b380eb5f5dcc768917b19011b48e",
    "followingBlockDigest": "dd7759c61f9fda0ed9be4e4fab7eed143c6a6967c591f523b48a584800d9f5b7",
    "identityFingerprint": "d044c2eecc3a30a22e38abf5144ebcb5cbd2594370793438a479351bd07691ac",
    "ancestry": [],
    "text": "# Step 10 - Coding Domain Adoption Of The Coordination Foundation",
    "sectionText": "# Step 10 - Coding Domain Adoption Of The Coordination Foundation\n\nDocument type: Proposal\nDesign status: Discussion\nImplementation: Not started\nLast reviewed: 2026-09-04\nCanonical for: nothing until explicitly accepted\nOriginal date: 2026-09-02\nScope: capture the discussion about bringing the existing coding domain onto\nthe Agent Coordination foundation after Step 09's group-thinking substrate\ndirection is settled — which parts are normalization of duplicate mechanisms,\nwhich parts are new foundation capability the coding domain genuinely needs,\nthe seams between them, and a candidate step sequence — without opening the\nWork-attached mutation gate before the proof ADR-010 §5 requires\nIntent traceability: [Agent Coordination Intent Preservation Ledger](../agent-coordination/intent-preservation-ledger.md),\nentries AC-I005, AC-I008, AC-I009; Vision V-012 (two unlike consumers)\nRelated: [Step 09 Group Thinking Substrate](step-09-group-thinking-substrate.md),\n[Step 10 A0 Coding Domain Boundary And Facade Plan](step-10-a0-coding-domain-boundary-facade-plan.md),\n[Agent Coordination Vision](../agent-coordination/vision.md),\n[ADR-007](../agent-coordination/decisions/ADR-007-domain-harness-seam-and-non-driving-inline-evidence.md),\n[ADR-010](../agent-coordination/decisions/ADR-010-interactive-headless-parity-and-work-isolation.md),\n[Work Integration](../agent-coordination/architecture/work-integration.md),\n[Component Boundary Advisory](../component-boundary/component-boundary-advisory.md),\n[Step 08 plan](../../../plans/260901-1542-step08-standalone-coordination/plan.md),\n[Architecture Intent](../architecture-intent.md),\n[Component Authority Boundary Map](component-authority-boundary-map.md)\n\nImplementation note: nothing in this proposal is implemented. Step 08 has\nclosed all 8 phases. Step 09 now names the standalone group-thinking substrate\ntrack; this Step 10 proposal must consume that substrate rather than reshape it\naround coding-specific needs. This document records the coding-domain adoption\ndiscussion so the next track does not have to be reconstructed from chat\nhistory."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Step 10 - Coding Domain Adoption Of The Coordination Foundation",
    "anchor": "step-10---coding-domain-adoption-of-the-coordination-foundation",
    "githubAnchor": "step-10---coding-domain-adoption-of-the-coordination-foundation",
    "stableAnchor": "h-7eff7eef034a",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "0f62bfc397e8c3151ffac4d9ae7849d7222516c0708ba4c41a649c7c560251ce",
    "sample": "Step 10 - Coding Domain Adoption Of The Coordination Foundation",
    "sectionPayloadDigest": "b2ec3148650c367697f6996796cf2c1d1da7795140c7d117fbf9b09e9f911d4b",
    "followingBlockDigest": "a3a7427f984245d3a73aa3a4398fb8475bac5639a0bc999d72ad0d0a3b707919",
    "identityFingerprint": "414640da3bfab25f424841d484cab513f5189973cb1d30c6d58e68d4620a2d7c",
    "ancestry": [],
    "text": "# Step 10 - Coding Domain Adoption Of The Coordination Foundation",
    "sectionText": "# Step 10 - Coding Domain Adoption Of The Coordination Foundation\n\n```txt\nDocument type: Proposal\nAudience: Human reviewer, architect, maintainer, agent\nPurpose: Preserve mapped source text for independent conservation review\nDesign status: Candidate\nImplementation: Source snapshot retained; current implementation truth not certified\nProvenance: docs/architect/proposals/step-10-coding-domain-adoption.md at fb046210539cbcbe8ca1dab254763f5e78c573d2; blob 211d40d63ddc4e5e5cc1a7661c3d4f234189904b\nWriter type: Agent draft writer\nCanonical: No\nCanonical for: Nothing; non-canonical candidate conservation carrier\nUse this when: Reviewing source carriage, placement, intent and provenance\nDo not use this for: Current authority, implementation proof or cutover approval\nLast reviewed: Pending independent review\nRelated:\n- docs/architect/proposals/step-10-coding-domain-adoption.md\nSupersedes: None; legacy source remains intact\nSuperseded by: None\n```\n\nAdded in candidate: Candidate carriage; Keep map proposal; surviving adoption intent is not retired with the old CoordinationSession implementation. Stale foundation assumptions remain for promotion truth review. Original source metadata and text follow. Physical relative-link destinations alone are rebased to the same repository paths. Units with inherited missing links are preserved as literal fenced source text, without substituting another design or changing any assertion. Source metadata is provenance, not candidate authority.\n\nSource relationship: [original source](step-10-coding-domain-adoption.md).\n\n\n````markdown\nDocument type: Proposal\nDesign status: Discussion\nImplementation: Not started\nLast reviewed: 2026-09-04\nCanonical for: nothing until explicitly accepted\nOriginal date: 2026-09-02\nScope: capture the discussion about bringing the existing coding domain onto\nthe Agent Coordination foundation after Step 09's group-thinking substrate\ndirection is settled — which parts are normalization of duplicate mechanisms,\nwhich parts are new foundation capability the coding domain genuinely needs,\nthe seams between them, and a candidate step sequence — without opening the\nWork-attached mutation gate before the proof ADR-010 §5 requires\nIntent traceability: [Agent Coordination Intent Preservation Ledger](../agent-coordination/intent-preservation-ledger.md),\nentries AC-I005, AC-I008, AC-I009; Vision V-012 (two unlike consumers)\nRelated: [Step 09 Group Thinking Substrate](step-09-group-thinking-substrate.md),\n[Step 10 A0 Coding Domain Boundary And Facade Plan](step-10-a0-coding-domain-boundary-facade-plan.md),\n[Agent Coordination Vision](../agent-coordination/vision.md),\n[ADR-007](../agent-coordination/decisions/ADR-007-domain-harness-seam-and-non-driving-inline-evidence.md),\n[ADR-010](../agent-coordination/decisions/ADR-010-interactive-headless-parity-and-work-isolation.md),\n[Work Integration](../agent-coordination/architecture/work-integration.md),\n[Component Boundary Advisory](../component-boundary/component-boundary-advisory.md),\n[Step 08 plan](../../../plans/260901-1542-step08-standalone-coordination/plan.md),\n[Architecture Intent](../architecture-intent.md),\n[Component Authority Boundary Map](component-authority-boundary-map.md)\n````\n\n\nImplementation note: nothing in this proposal is implemented. Step 08 has\nclosed all 8 phases. Step 09 now names the standalone group-thinking substrate\ntrack; this Step 10 proposal must consume that substrate rather than reshape it\naround coding-specific needs. This document records the coding-domain adoption\ndiscussion so the next track does not have to be reconstructed from chat\nhistory."
  }
}
```

## Entry f-233: link-233

```json
{
  "id": "link-233",
  "path": "docs/platform/proposals/component-authority-boundary-map.md",
  "inputLine": 32,
  "inputColumn": 204,
  "lineBeforeLinkPass": 32,
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
  "reviewStatus": "pending",
  "oldDestination": "../../architect/agent-coordination/vision.md",
  "newDestination": "../agent-coordination/README.md",
  "alias": {
    "aliasId": "step10-agent-coordination-4330",
    "fromPath": "docs/architect/agent-coordination/vision.md",
    "toOwner": "docs/platform/agent-coordination/README.md",
    "toAnchor": null,
    "kind": "moved",
    "evidenceRef": "plans/260925-documentation-authority-unification/ledger/area-map-agent-coordination.md",
    "immutableRefs": [],
    "recordedAt": "2026-10-15"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Agent Coordination Foundation Vision",
    "anchor": "agent-coordination-foundation-vision",
    "githubAnchor": "agent-coordination-foundation-vision",
    "stableAnchor": "h-0c4b7de40cf9",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "a17021f00f099a1c526d7992100c291c5e87ef730e08e67fe9c7e676d914b06f",
    "sample": "Agent Coordination Foundation Vision",
    "sectionPayloadDigest": "662e5a6e5bc6b6b06efa77c5a417a9b4f9026a266fe08687e5af1d6368ef9387",
    "followingBlockDigest": "662e5a6e5bc6b6b06efa77c5a417a9b4f9026a266fe08687e5af1d6368ef9387",
    "identityFingerprint": "8780ee83bdd1c94bb4a5f7ee882007349967f98fd812309c6be1612930199c6b",
    "ancestry": [],
    "text": "# Agent Coordination Foundation Vision",
    "sectionText": "# Agent Coordination Foundation Vision\n\nDocument type: Vision\nDesign status: Accepted\nImplementation: Partial\nLast reviewed: 2026-09-01\nCanonical for: product identity, foundation boundaries, optional structure, and domain augmentation"
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Agent Coordination",
    "anchor": "agent-coordination",
    "githubAnchor": "agent-coordination",
    "stableAnchor": "h-ff2e72466c2b",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "17d5a6c9b3fa624b613a1755e1cbc14730df9e0c9bae9692a0bd2eaa382cdd9c",
    "sample": "Agent Coordination",
    "sectionPayloadDigest": "83519bf08c839b916bab4035985de5fe8621084d0bd81a719f5359f94c4054f1",
    "followingBlockDigest": "83519bf08c839b916bab4035985de5fe8621084d0bd81a719f5359f94c4054f1",
    "identityFingerprint": "943cb32f25bfeaa0983eea18a15b86c2e7ad1a9f714d9c00f691cb00ddc91f11",
    "ancestry": [],
    "text": "# Agent Coordination",
    "sectionText": "# Agent Coordination\n\n```txt\nDocument type: Area Portal\nAudience: Human reviewer, maintainer and implementation agent\nPurpose: Route current execution to its owners and retain historical evidence\nDesign status: Accepted\nImplementation: Current-owner navigation; former coordination engine retired\nProvenance: Owner A16 whole-area reframe; complete classified input retained in history/retired-engine/files\nWriter type: Human + agent coauthor\nCanonical for: Area navigation, not runtime schema or old engine status\nUse this when: Locating current execution owners or historical coordination claims\nDo not use this for: Reinstating the retired CoordinationSession engine\nLast reviewed: Pending independent whole-area review\nRelated:\n- docs/specs/runner.md\n- docs/platform/agent-coordination/spec.md\n- docs/platform/agent-coordination/history/retired-engine/README.md\nSupersedes: Stale current-state framing only; no old claim is dropped\nSuperseded by: None\nAdded in candidate: Current-owner routing and retirement framing\n```"
  }
}
```

## Entry f-234: link-234

```json
{
  "id": "link-234",
  "path": "docs/platform/proposals/component-authority-boundary-map.md",
  "inputLine": 32,
  "inputColumn": 279,
  "lineBeforeLinkPass": 32,
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
  "reviewStatus": "pending",
  "oldDestination": "../../architect/agent-coordination/intent-preservation-ledger.md",
  "newDestination": "../agent-coordination/README.md",
  "alias": {
    "aliasId": "step10-agent-coordination-1148",
    "fromPath": "docs/architect/agent-coordination/intent-preservation-ledger.md",
    "toOwner": "docs/platform/agent-coordination/README.md",
    "toAnchor": null,
    "kind": "moved",
    "evidenceRef": "plans/260925-documentation-authority-unification/ledger/area-map-agent-coordination.md",
    "immutableRefs": [],
    "recordedAt": "2026-10-15"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Agent Coordination Intent Preservation Ledger",
    "anchor": "agent-coordination-intent-preservation-ledger",
    "githubAnchor": "agent-coordination-intent-preservation-ledger",
    "stableAnchor": "h-41e20c08921e",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "169e9ae80f9041a6adab8f3630f86e8e6deb179c38aa9ba8c89e0ff73f6e2b18",
    "sample": "Agent Coordination Intent Preservation Ledger",
    "sectionPayloadDigest": "ccf35af56b1bfa469d68047ac708db5b56cf1beab353cce79e116b35f9f46f0f",
    "followingBlockDigest": "ccf35af56b1bfa469d68047ac708db5b56cf1beab353cce79e116b35f9f46f0f",
    "identityFingerprint": "1732d5d60fc95d4e9c4ac1e030fb1681fffc655158caa61e2acfff882f9faa9f",
    "ancestry": [],
    "text": "# Agent Coordination Intent Preservation Ledger",
    "sectionText": "# Agent Coordination Intent Preservation Ledger\n\nDocument type: Index\nDesign status: N/A\nImplementation: Active\nLast reviewed: 2026-09-04\nCanonical for: traceability of explicitly preserved intent, not architecture or runtime contracts"
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Agent Coordination",
    "anchor": "agent-coordination",
    "githubAnchor": "agent-coordination",
    "stableAnchor": "h-ff2e72466c2b",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "17d5a6c9b3fa624b613a1755e1cbc14730df9e0c9bae9692a0bd2eaa382cdd9c",
    "sample": "Agent Coordination",
    "sectionPayloadDigest": "83519bf08c839b916bab4035985de5fe8621084d0bd81a719f5359f94c4054f1",
    "followingBlockDigest": "83519bf08c839b916bab4035985de5fe8621084d0bd81a719f5359f94c4054f1",
    "identityFingerprint": "943cb32f25bfeaa0983eea18a15b86c2e7ad1a9f714d9c00f691cb00ddc91f11",
    "ancestry": [],
    "text": "# Agent Coordination",
    "sectionText": "# Agent Coordination\n\n```txt\nDocument type: Area Portal\nAudience: Human reviewer, maintainer and implementation agent\nPurpose: Route current execution to its owners and retain historical evidence\nDesign status: Accepted\nImplementation: Current-owner navigation; former coordination engine retired\nProvenance: Owner A16 whole-area reframe; complete classified input retained in history/retired-engine/files\nWriter type: Human + agent coauthor\nCanonical for: Area navigation, not runtime schema or old engine status\nUse this when: Locating current execution owners or historical coordination claims\nDo not use this for: Reinstating the retired CoordinationSession engine\nLast reviewed: Pending independent whole-area review\nRelated:\n- docs/specs/runner.md\n- docs/platform/agent-coordination/spec.md\n- docs/platform/agent-coordination/history/retired-engine/README.md\nSupersedes: Stale current-state framing only; no old claim is dropped\nSuperseded by: None\nAdded in candidate: Current-owner routing and retirement framing\n```"
  }
}
```

## Entry f-235: link-235

```json
{
  "id": "link-235",
  "path": "docs/platform/proposals/component-authority-boundary-map.md",
  "inputLine": 32,
  "inputColumn": 375,
  "lineBeforeLinkPass": 32,
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
  "reviewStatus": "pending",
  "oldDestination": "../../architect/architecture-intent.md",
  "newDestination": "../system-architecture/architecture/architecture-intent.md",
  "alias": {
    "aliasId": "step10-whole-system-0013",
    "fromPath": "docs/architect/architecture-intent.md",
    "toOwner": "docs/platform/system-architecture/architecture/architecture-intent.md",
    "toAnchor": null,
    "kind": "moved",
    "evidenceRef": "plans/260925-documentation-authority-unification/ledger/area-map-whole-system-architecture.md",
    "immutableRefs": [],
    "recordedAt": "2026-10-15"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Architecture Intent",
    "anchor": "architecture-intent",
    "githubAnchor": "architecture-intent",
    "stableAnchor": "h-54fb567096a4",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "51d156b77e7dbc6b40844fff270b863f55c365fd99958247bf1fb4f04f625029",
    "sample": "Architecture Intent",
    "sectionPayloadDigest": "8e4a880b951f42bd928b5f8e7ddccef9f7218b3e562a03678cdfc197c66f385f",
    "followingBlockDigest": "89980185b9b90c27237044de3915744226d6fcb87c0978d360ff2ca4a917338e",
    "identityFingerprint": "505a468ca0ac7e039a7826f4eed3762b4e61e6146b33acf8ead743dc0c82fe70",
    "ancestry": [],
    "text": "# Architecture Intent",
    "sectionText": "# Architecture Intent\n\nDocument type: Architecture intention / discussion\nDesign status: Discussion\nImplementation: Not started\nLast reviewed: 2026-09-05\nCanonical for: nothing until explicitly accepted\n\nScope: preserve architecture-wide design intent across deferred capabilities,\nso later implementation plans can narrow scope safely without accidentally\nturning \"not yet\" into \"not part of the design.\"\n\nActive thread: widen fgOS coordination so it can support common\ngroup-thinking/problem-solving patterns, including but not limited to code\nreview loops, without weakening the already-proven isolation-heavy\n`group-cognition-framework.yaml`.\n\nRelated:\n- `docs/architect/system-vision-trong-mem-ngoai-cung.md`\n- `docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md`\n- `docs/architect/proposals/step-09-group-thinking-substrate.md`\n- `docs/architect/proposals/step-10-coding-domain-adoption.md`\n- `docs/architect/proposals/component-authority-boundary-map.md`\n- `docs/architect/agent-coordination/intent-preservation-ledger.md`\n\nThis is a discussion document. It does not accept a design, does not change\nruntime behavior, and does not authorize implementation."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Architecture Intent",
    "anchor": "architecture-intent",
    "githubAnchor": "architecture-intent",
    "stableAnchor": "h-54fb567096a4",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "d7bb7fa4b1504be17487727f8b328500ed25326a783b607b055369186514dd73",
    "sample": "Architecture Intent",
    "sectionPayloadDigest": "8a82d0a64260785781850bcf240c3e88bfd10df15bf897657daf3e18c96162cc",
    "followingBlockDigest": "29832c476e0e8af9e461a1d23df4767e64382135d014ec3b3160de320e645d6d",
    "identityFingerprint": "1a407019b6b2e6110a94036c75a57843b4b1b97123a444903910e5e23e30ff51",
    "ancestry": [],
    "text": "# Architecture Intent",
    "sectionText": "# Architecture Intent\n\n```txt\nDocument type: Architecture\nAudience: Human reviewer, architect, maintainer, agent\nPurpose: Preserve the complete architecture-intent.md source at its frozen-map candidate owner\nDesign status: Candidate\nImplementation: Partial — inherited source qualifications; not independently truth-verified\nProvenance: docs/architect/architecture-intent.md at 69dd3ee7fd84bc5e93fe9c75d63622d4f5aa8539 (blob e72b0e930345e01bca1b97c81fd7a528092cd098)\nWriter type: Agent carriage; independent review pending\nCanonical for: Nothing until promotion; current source remains docs/architect/architecture-intent.md\nUse this when: Reviewing whole-system candidate carriage and placement\nDo not use this for: Inferring implementation, promotion or superseding source authority\nLast reviewed: Pending independent review\nRelated:\n- docs/architect/architecture-intent.md\n- docs/platform/component-boundary.md\n- docs/platform/architecture-map.md\nSupersedes: None — candidate only\nSuperseded by: None\n```\n\nAdded in candidate: migration metadata and physical link rebasing. Original source metadata, dates, design limits and historic claims below are provenance, not fresh review. Current truth is unverified; A28 requires sampled truth review at this checkpoint and full truth review at promotion.\n\n\nDocument type: Architecture intention / discussion\nDesign status: Discussion\nImplementation: Not started\nLast reviewed: 2026-09-05\nCanonical for: nothing until explicitly accepted\n\nScope: preserve architecture-wide design intent across deferred capabilities,\nso later implementation plans can narrow scope safely without accidentally\nturning \"not yet\" into \"not part of the design.\"\n\nActive thread: widen fgOS coordination so it can support common\ngroup-thinking/problem-solving patterns, including but not limited to code\nreview loops, without weakening the already-proven isolation-heavy\n`group-cognition-framework.yaml`.\n\nRelated:\n- `docs/architect/system-vision-trong-mem-ngoai-cung.md`\n- `docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md`\n- `docs/architect/proposals/step-09-group-thinking-substrate.md`\n- `docs/architect/proposals/step-10-coding-domain-adoption.md`\n- `docs/architect/proposals/component-authority-boundary-map.md`\n- `docs/architect/agent-coordination/intent-preservation-ledger.md`\n\nThis is a discussion document. It does not accept a design, does not change\nruntime behavior, and does not authorize implementation."
  }
}
```

## Entry f-236: link-236

```json
{
  "id": "link-236",
  "path": "docs/platform/proposals/component-authority-boundary-map.md",
  "inputLine": 32,
  "inputColumn": 438,
  "lineBeforeLinkPass": 32,
  "before": "[Component Boundary Advisory](../../architect/component-boundary/component-boundary-advisory.md)",
  "after": "[Component Boundary Advisory](../component-boundary.md)",
  "legacyPath": "docs/architect/component-boundary/component-boundary-advisory.md",
  "target": {
    "path": "docs/platform/component-boundary.md",
    "anchor": null,
    "aliasId": "step10-whole-system-0212"
  },
  "portal": false,
  "area": "proposals",
  "reviewStatus": "pending",
  "oldDestination": "../../architect/component-boundary/component-boundary-advisory.md",
  "newDestination": "../component-boundary.md",
  "alias": {
    "aliasId": "step10-whole-system-0212",
    "fromPath": "docs/architect/component-boundary/component-boundary-advisory.md",
    "toOwner": "docs/platform/component-boundary.md",
    "toAnchor": null,
    "kind": "moved",
    "evidenceRef": "plans/260925-documentation-authority-unification/ledger/area-map-whole-system-architecture.md",
    "immutableRefs": [],
    "recordedAt": "2026-10-15"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "fgOS Component Boundary Advisory",
    "anchor": "fgos-component-boundary-advisory",
    "githubAnchor": "fgos-component-boundary-advisory",
    "stableAnchor": "h-b4d08c193f5a",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "60a53b2e9e95066e9c8aed269a5c87e08f4fdc622d280e3cefcdcf196d1fd66c",
    "sample": "fgOS Component Boundary Advisory",
    "sectionPayloadDigest": "67a1060f9c3ca588a89d2f10b4d096a4bc75c70e03c7276a0aceb30b7f1357d3",
    "followingBlockDigest": "67a1060f9c3ca588a89d2f10b4d096a4bc75c70e03c7276a0aceb30b7f1357d3",
    "identityFingerprint": "37f24753f0eb60feca5ec11df430074eb5675925d327f6ec177abb26891f8f3b",
    "ancestry": [],
    "text": "# fgOS Component Boundary Advisory",
    "sectionText": "# fgOS Component Boundary Advisory\n\nDocument type: Proposal\nDesign status: Discussion / Visionary advisory\nImplementation: N/A\nLast reviewed: 2026-09-01\nCanonical for: nothing; architectural advisory only\nRelated: [Architecture Map](../../architecture-map.md), [System Overview](../../specs/system-overview.md), [Platform Foundations](../../platform-foundations.md), [Domainization Architecture](../domainization/README.md), [Agent Coordination Foundation Vision](../agent-coordination/vision.md), [Concept Relationships](../agent-coordination/vocabulary/concept-relationships.md), [Dispatch Control Plane](../agent-coordination/architecture/dispatch-control-plane.md), [Protocol Model](../agent-coordination/architecture/protocol-model.md), [CoordinationSession Contract](../agent-coordination/contracts/coordination-session.md), [FlowDefinition Contract](../agent-coordination/contracts/flow-definition.md)"
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Component Boundary",
    "anchor": "component-boundary",
    "githubAnchor": "component-boundary",
    "stableAnchor": "h-065adbde00f9",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "725363f18a5458e00b5f7d577e388c99e8f694d6d53f8b93f66fdc5bd2e7bf64",
    "sample": "Component Boundary",
    "sectionPayloadDigest": "28c0f7b6df2717722556d20d85b1eeb533abfc9c055931f92cdd60a7038c3866",
    "followingBlockDigest": "28c0f7b6df2717722556d20d85b1eeb533abfc9c055931f92cdd60a7038c3866",
    "identityFingerprint": "02f5448c9fd944090a0aed56b7e677026868ce524756c7058041d87759a2dd5e",
    "ancestry": [],
    "text": "# Component Boundary",
    "sectionText": "# Component Boundary\n\n```txt\nDocument type: Platform architecture anchor\nAudience: Human reviewer, architect, maintainer, design-shaping agent\nPurpose: Track the whole-system component and authority boundary map\nDesign status: Draft\nImplementation status: Partial\nCanonical: Yes, after review\nOwner: Platform documentation\nSource type: Promoted anchor for docs/architect/component-boundary/**\nLast reviewed: 2026-10-04\nRelated:\n- docs/architect/component-boundary/README.md\n- docs/architect/component-boundary/component-boundary-advisory.md\n- docs/architect/proposals/component-authority-boundary-map.md\n- docs/platform/README.md\nImplementation: Partial\nProvenance: Promoted anchor for docs/architect/component-boundary/**\nWriter type: Original writer attribution not recorded; retained source provenance\nCanonical for: Candidate scope: Track the whole-system component and authority boundary map; authority follows transitional switchboard\nUse this when: Track the whole-system component and authority boundary map\nDo not use this for: Authority beyond the declared scope or implementation truth without the cited verification\nSupersedes: None; legacy sources remain in place during migration\nSuperseded by: None recorded\n```"
  }
}
```

## Entry f-237: link-237

```json
{
  "id": "link-237",
  "path": "docs/platform/proposals/component-authority-boundary-map.md",
  "inputLine": 32,
  "inputColumn": 536,
  "lineBeforeLinkPass": 32,
  "before": "[Repo Layout Vision](../../architect/component-boundary/repo-layout-vision.md)",
  "after": "[Repo Layout Vision](../component-boundary.md)",
  "legacyPath": "docs/architect/component-boundary/repo-layout-vision.md",
  "target": {
    "path": "docs/platform/component-boundary.md",
    "anchor": null,
    "aliasId": "step10-whole-system-0379"
  },
  "portal": false,
  "area": "proposals",
  "reviewStatus": "pending",
  "oldDestination": "../../architect/component-boundary/repo-layout-vision.md",
  "newDestination": "../component-boundary.md",
  "alias": {
    "aliasId": "step10-whole-system-0379",
    "fromPath": "docs/architect/component-boundary/repo-layout-vision.md",
    "toOwner": "docs/platform/component-boundary.md",
    "toAnchor": null,
    "kind": "moved",
    "evidenceRef": "plans/260925-documentation-authority-unification/ledger/area-map-whole-system-architecture.md",
    "immutableRefs": [],
    "recordedAt": "2026-10-15"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Repo Layout Vision: Apps And Packages",
    "anchor": "repo-layout-vision-apps-and-packages",
    "githubAnchor": "repo-layout-vision-apps-and-packages",
    "stableAnchor": "h-89764af40de7",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "9ae78c3cca831de53cf961ce318559c75696fcdb80fda15ce8b72cf99b6c85e3",
    "sample": "Repo Layout Vision: Apps And Packages",
    "sectionPayloadDigest": "9863e96b046d97214dfa5ba66d599e4e58f9dc54432f63ef1e6ff7300759d6b9",
    "followingBlockDigest": "600bc69a0d8c5cdc1971c2d0be88c8a834718567f57aad21da8a8bb2da8a4865",
    "identityFingerprint": "9b72c90819f03cc5005689efa60cf64dec065b6c5f9e93e5ee03ff6e956d64b0",
    "ancestry": [],
    "text": "# Repo Layout Vision: Apps And Packages",
    "sectionText": "# Repo Layout Vision: Apps And Packages\n\n**Status:** Vision / direction, not a locked platform law and not a full spec.\n**Date:** 2026-08-26.\n**Source:** Product-owner direction.\n\nThis document records a physical repo-layout direction for separating thin\nentrypoints from reusable implementation packages. It does not change runtime\nbehavior by itself.\n\nThe locked target in this document is the Rust/web slice around\n`herdr-plugin/`. The Node side is intentionally left for a later discussion."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Component Boundary",
    "anchor": "component-boundary",
    "githubAnchor": "component-boundary",
    "stableAnchor": "h-065adbde00f9",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "725363f18a5458e00b5f7d577e388c99e8f694d6d53f8b93f66fdc5bd2e7bf64",
    "sample": "Component Boundary",
    "sectionPayloadDigest": "28c0f7b6df2717722556d20d85b1eeb533abfc9c055931f92cdd60a7038c3866",
    "followingBlockDigest": "28c0f7b6df2717722556d20d85b1eeb533abfc9c055931f92cdd60a7038c3866",
    "identityFingerprint": "02f5448c9fd944090a0aed56b7e677026868ce524756c7058041d87759a2dd5e",
    "ancestry": [],
    "text": "# Component Boundary",
    "sectionText": "# Component Boundary\n\n```txt\nDocument type: Platform architecture anchor\nAudience: Human reviewer, architect, maintainer, design-shaping agent\nPurpose: Track the whole-system component and authority boundary map\nDesign status: Draft\nImplementation status: Partial\nCanonical: Yes, after review\nOwner: Platform documentation\nSource type: Promoted anchor for docs/architect/component-boundary/**\nLast reviewed: 2026-10-04\nRelated:\n- docs/architect/component-boundary/README.md\n- docs/architect/component-boundary/component-boundary-advisory.md\n- docs/architect/proposals/component-authority-boundary-map.md\n- docs/platform/README.md\nImplementation: Partial\nProvenance: Promoted anchor for docs/architect/component-boundary/**\nWriter type: Original writer attribution not recorded; retained source provenance\nCanonical for: Candidate scope: Track the whole-system component and authority boundary map; authority follows transitional switchboard\nUse this when: Track the whole-system component and authority boundary map\nDo not use this for: Authority beyond the declared scope or implementation truth without the cited verification\nSupersedes: None; legacy sources remain in place during migration\nSuperseded by: None recorded\n```"
  }
}
```

## Entry f-238: link-238

```json
{
  "id": "link-238",
  "path": "docs/platform/proposals/component-authority-boundary-map.md",
  "inputLine": 32,
  "inputColumn": 616,
  "lineBeforeLinkPass": 32,
  "before": "[Host Invocation And Provider Routing](../../architect/host-invocation-routing/host-invocation-provider-routing.md)",
  "after": "[Host Invocation And Provider Routing](../host-invocation-routing/README.md)",
  "legacyPath": "docs/architect/host-invocation-routing/host-invocation-provider-routing.md",
  "target": {
    "path": "docs/platform/host-invocation-routing/README.md",
    "anchor": null,
    "aliasId": "host-invocation-draft-037"
  },
  "portal": false,
  "area": "proposals",
  "reviewStatus": "pending",
  "oldDestination": "../../architect/host-invocation-routing/host-invocation-provider-routing.md",
  "newDestination": "../host-invocation-routing/README.md",
  "alias": {
    "fromPath": "docs/architect/host-invocation-routing/host-invocation-provider-routing.md",
    "toOwner": "docs/platform/host-invocation-routing/README.md",
    "toAnchor": null,
    "kind": "redirected",
    "evidenceRef": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
    "immutableRefs": [],
    "recordedAt": "2026-10-13",
    "aliasId": "host-invocation-draft-037"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Host Invocation And Provider Routing Architecture",
    "anchor": "host-invocation-and-provider-routing-architecture",
    "githubAnchor": "host-invocation-and-provider-routing-architecture",
    "stableAnchor": "h-699de63b2a62",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "05b7c0f19374f9f956c217241c508227641d20b1c4221b348777f23611b6e7df",
    "sample": "Host Invocation And Provider Routing Architecture",
    "sectionPayloadDigest": "797624eb16ce2d9c44b3fdb73c1a8aab61651fa8d134d55a3e8d05c6e32f1f65",
    "followingBlockDigest": "b5d90a2f82ebb7b1b4cc9fb4d388233e24a26f68be6ed5ee2990b783e1a36a62",
    "identityFingerprint": "2d3ca53446822aa5d2922de7b0280861ec0662ed278325b22c3a3c9a8c9183c8",
    "ancestry": [],
    "text": "# Host Invocation And Provider Routing Architecture",
    "sectionText": "# Host Invocation And Provider Routing Architecture\n\n**Status:** Vision / architecture advisory, not a locked platform law and not an implementation plan.\n**Date:** 2026-09-10.\n**Revised:** per [architecture-review-260910-1537-host-invocation-provider-routing-design-review.md](../../../plans/reports/architecture-review-260910-1537-host-invocation-provider-routing-design-review.md).\n**Source:** Product-owner component-boundary and Node-to-Rust migration discussion.\n\nThis is the **kernel contract**: the permanent invocation/routing boundary every fgOS host uses, independent of transport (CLI, remote, chat) and provider mechanism (built-in, legacy Node, external process, WASM). Ecosystem plugin mechanics: [External Provider Protocol](./external-provider-protocol.md). Transitional Node CLI lane: [Legacy CLI Transition](./legacy-cli-transition.md). Both depend on this document. Migration staging and first proof: [Node To Rust Component Migration](./node-to-rust-component-migration.md), [Rust Host And Proof Providers Implementation Plan](./rust-cli-and-proof-components-plan.md)."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Host Invocation",
    "anchor": "host-invocation",
    "githubAnchor": "host-invocation",
    "stableAnchor": "h-9674073175c5",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "cc682e1a901b39ba480c2a95282077b85597b0d8ee6aa24bd7dcd71c8de20739",
    "sample": "Host Invocation",
    "sectionPayloadDigest": "4906b85c6c780d8a9dcf4b69f592806ac5301cf33aa4d638e0c88c98046f9e9e",
    "followingBlockDigest": "4906b85c6c780d8a9dcf4b69f592806ac5301cf33aa4d638e0c88c98046f9e9e",
    "identityFingerprint": "2f2cd30c374c59bab51ddaebeadfb9338d8540794673fcc6fc53dfc281b37d78",
    "ancestry": [],
    "text": "# Host Invocation",
    "sectionText": "# Host Invocation\n\n```txt\nDocument type: Area portal\nAudience: Human reviewer, architect, maintainer, implementation agent\nPurpose: Route readers through fgOS host invocation, provider routing, legacy CLI transition, and external provider docs\nDesign status: Draft\nImplementation status: R1/R2/R3 implemented preview plus partial route migration\nCanonical: Yes, after review\nOwner: Platform documentation\nSource type: Promoted from docs/architect/host-invocation-routing/**\nLast reviewed: 2026-09-18\nImplementation: Existing dated R1/R2/R3 preview records; candidate carriage and current truth await independent checkpoint review\nProvenance: Six pinned legacy sources and the frozen Host Invocation area map; retained policy is non-authority history\nWriter type: Agent\nCanonical for: Promoted area navigation only; candidate document claims are not promoted by this edit\nUse this when: Finding the host invocation contract, selected migration direction and its proof boundaries\nDo not use this for: Selecting or installing a runtime, certifying current route counts, or treating dated plans as shipped code\nSupersedes: None; legacy source authority remains unchanged during candidate transformation\nSuperseded by: None\nRelated:\n- docs/platform/host-invocation-routing/vision.md\n- docs/platform/host-invocation-routing/intent-preservation-ledger.md\n- docs/platform/host-invocation-routing/spec.md\n- docs/platform/host-invocation-routing/roadmap.md\n- docs/platform/host-invocation-routing/architecture/invocation-kernel.md\n- docs/platform/host-invocation-routing/architecture/provider-routing.md\n- docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md\n- docs/platform/host-invocation-routing/contracts/operation-request-outcome.md\n- docs/platform/host-invocation-routing/contracts/command-route-descriptor.md\n- docs/platform/host-invocation-routing/verification/implementation-alignment.md\n- docs/platform/host-invocation-routing/history/source-inventory.md\n- docs/platform/host-invocation-routing/verification/source-preservation-audit.md\n- docs/platform/host-invocation-routing/decisions/README.md\n```"
  }
}
```

## Entry f-239: link-239

```json
{
  "id": "link-239",
  "path": "docs/platform/proposals/component-authority-boundary-map.md",
  "inputLine": 32,
  "inputColumn": 733,
  "lineBeforeLinkPass": 32,
  "before": "[Node To Rust Component Migration](../../architect/host-invocation-routing/node-to-rust-component-migration.md)",
  "after": "[Node To Rust Component Migration](../host-invocation-routing/README.md)",
  "legacyPath": "docs/architect/host-invocation-routing/node-to-rust-component-migration.md",
  "target": {
    "path": "docs/platform/host-invocation-routing/README.md",
    "anchor": null,
    "aliasId": "host-invocation-draft-061"
  },
  "portal": false,
  "area": "proposals",
  "reviewStatus": "pending",
  "oldDestination": "../../architect/host-invocation-routing/node-to-rust-component-migration.md",
  "newDestination": "../host-invocation-routing/README.md",
  "alias": {
    "fromPath": "docs/architect/host-invocation-routing/node-to-rust-component-migration.md",
    "toOwner": "docs/platform/host-invocation-routing/README.md",
    "toAnchor": null,
    "kind": "redirected",
    "evidenceRef": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
    "immutableRefs": [],
    "recordedAt": "2026-10-13",
    "aliasId": "host-invocation-draft-061"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Node To Rust Component Migration",
    "anchor": "node-to-rust-component-migration",
    "githubAnchor": "node-to-rust-component-migration",
    "stableAnchor": "h-b4de1922ccc4",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "24e0aa773ffabc724acf02f1b1c6f96aaedfc26582081dd323103b4146ef3621",
    "sample": "Node To Rust Component Migration",
    "sectionPayloadDigest": "56cf264d990b67f6fdd7c1c1bd0b4ce4891014bece3dad995ef381e4c7eeb164",
    "followingBlockDigest": "206fd476551e3bbbbdc0ebf45aa95e5254c49d31e21e9fc83de16d91ee3f0731",
    "identityFingerprint": "b481481ac015aebf2e03ff1aae8b1710e4f2eddaf4606b848d0690c68bab5ec1",
    "ancestry": [],
    "text": "# Node To Rust Component Migration",
    "sectionText": "# Node To Rust Component Migration\n\n**Status:** Selected migration direction, not an implementation plan.\n**Date:** 2026-09-01.\n**Revised:** 2026-09-10 (see\nplans/reports/architecture-review-260910-1537-host-invocation-provider-routing-design-review.md).\n**Selected direction (2026-09-03; revised 2026-09-04, 2026-09-10):** ship the\ndistributable Rust `fgos` CLI host in R1, with every unmigrated selector\nresolved by the CLI adapter to the legacy-cli lane and exec'd straight to the\nNode payload, never entering the kernel; prove external process providers in\nR2 and the production remote peer in R3; then replace semantic operations one\ncomponent at a time with native Rust providers.\n**Source:** Product-owner planning and follow-up component-boundary discussion.\n\nThis document discusses only migration options, ordering, transition stages,\ncutover, and rollback. The stable host model, peer CLI/remote host use cases,\nOperation Provider Router, provider mechanics, protocols, plugin registry,\nauthority, and technical tradeoffs live in\n[Host Invocation And Provider Routing Architecture](./host-invocation-provider-routing.md).\nComponent ownership, authority boundaries, and the physical placement compass\nfor files/crates/components live in\n[fgOS Component Boundary Advisory](../component-boundary/component-boundary-advisory.md);\nevery native migration slice must read it before choosing where a provider or\ncomponent module lives.\nThe executable work breakdown lives in\n[Rust Host And Proof Providers Implementation Plan](./rust-cli-and-proof-components-plan.md)."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Host Invocation",
    "anchor": "host-invocation",
    "githubAnchor": "host-invocation",
    "stableAnchor": "h-9674073175c5",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "cc682e1a901b39ba480c2a95282077b85597b0d8ee6aa24bd7dcd71c8de20739",
    "sample": "Host Invocation",
    "sectionPayloadDigest": "4906b85c6c780d8a9dcf4b69f592806ac5301cf33aa4d638e0c88c98046f9e9e",
    "followingBlockDigest": "4906b85c6c780d8a9dcf4b69f592806ac5301cf33aa4d638e0c88c98046f9e9e",
    "identityFingerprint": "2f2cd30c374c59bab51ddaebeadfb9338d8540794673fcc6fc53dfc281b37d78",
    "ancestry": [],
    "text": "# Host Invocation",
    "sectionText": "# Host Invocation\n\n```txt\nDocument type: Area portal\nAudience: Human reviewer, architect, maintainer, implementation agent\nPurpose: Route readers through fgOS host invocation, provider routing, legacy CLI transition, and external provider docs\nDesign status: Draft\nImplementation status: R1/R2/R3 implemented preview plus partial route migration\nCanonical: Yes, after review\nOwner: Platform documentation\nSource type: Promoted from docs/architect/host-invocation-routing/**\nLast reviewed: 2026-09-18\nImplementation: Existing dated R1/R2/R3 preview records; candidate carriage and current truth await independent checkpoint review\nProvenance: Six pinned legacy sources and the frozen Host Invocation area map; retained policy is non-authority history\nWriter type: Agent\nCanonical for: Promoted area navigation only; candidate document claims are not promoted by this edit\nUse this when: Finding the host invocation contract, selected migration direction and its proof boundaries\nDo not use this for: Selecting or installing a runtime, certifying current route counts, or treating dated plans as shipped code\nSupersedes: None; legacy source authority remains unchanged during candidate transformation\nSuperseded by: None\nRelated:\n- docs/platform/host-invocation-routing/vision.md\n- docs/platform/host-invocation-routing/intent-preservation-ledger.md\n- docs/platform/host-invocation-routing/spec.md\n- docs/platform/host-invocation-routing/roadmap.md\n- docs/platform/host-invocation-routing/architecture/invocation-kernel.md\n- docs/platform/host-invocation-routing/architecture/provider-routing.md\n- docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md\n- docs/platform/host-invocation-routing/contracts/operation-request-outcome.md\n- docs/platform/host-invocation-routing/contracts/command-route-descriptor.md\n- docs/platform/host-invocation-routing/verification/implementation-alignment.md\n- docs/platform/host-invocation-routing/history/source-inventory.md\n- docs/platform/host-invocation-routing/verification/source-preservation-audit.md\n- docs/platform/host-invocation-routing/decisions/README.md\n```"
  }
}
```

## Entry f-240: link-240

```json
{
  "id": "link-240",
  "path": "docs/platform/proposals/component-authority-boundary-map.md",
  "inputLine": 216,
  "inputColumn": 445,
  "lineBeforeLinkPass": 216,
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
  "reviewStatus": "pending",
  "oldDestination": "../../architect/agent-coordination/architecture/dispatch-control-plane.md",
  "newDestination": "../agent-coordination/README.md",
  "alias": {
    "aliasId": "step10-agent-coordination-0122",
    "fromPath": "docs/architect/agent-coordination/architecture/dispatch-control-plane.md",
    "toOwner": "docs/platform/agent-coordination/README.md",
    "toAnchor": null,
    "kind": "moved",
    "evidenceRef": "plans/260925-documentation-authority-unification/ledger/area-map-agent-coordination.md",
    "immutableRefs": [],
    "recordedAt": "2026-10-15"
  },
  "resolution": {
    "atCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "newTargetResolves": true
  },
  "referentPreservation": {
    "unchangedLabel": true,
    "exactDraftAliasTarget": true,
    "aliasOriginEqualsOldResolvedPath": true,
    "mechanicalKeepsDeclaredReferent": true,
    "scope": "The same labelled referent follows its explicit legacy-to-candidate alias. Independently review the destination meaning; path existence alone is not truth approval."
  },
  "oldReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Dispatch Control Plane",
    "anchor": "dispatch-control-plane",
    "githubAnchor": "dispatch-control-plane",
    "stableAnchor": "h-e1823391e919",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "41485cfa0919ccd3df938e263bcb58c691441e44ffd2a8b0c95cdf420b26907a",
    "sample": "Dispatch Control Plane",
    "sectionPayloadDigest": "499a5a50fe95625581f0fc0b503d81d94e741d457cdcc793507fe7b54162f95b",
    "followingBlockDigest": "96fe226220a3c7bd81ef26ff305cb7134f6b6fa87763c839b88741fa53f44367",
    "identityFingerprint": "82259953603a6477d8aa49b81d4fe38cfc1880a00367a70ce6575738b9e36893",
    "ancestry": [],
    "text": "# Dispatch Control Plane",
    "sectionText": "# Dispatch Control Plane\n\n> Migration status: This document is a legacy/current source for\n> `docs/platform/agent-coordination/architecture/dispatch-control-plane.md`. Do not edit divergent design\n> claims here without also updating the target doc or migration inventory.\n\nDocument type: Architecture\nDesign status: Accepted\nImplementation: Partial\nLast reviewed: 2026-09-09\nCanonical for: dispatch responsibility and governance boundaries; the\nDispatchRequest, PolicyPatch, and DispatchPlan contracts; component-internal\nownership and forbidden dependencies for the Dispatch And Execution Engine.\nRelated: [Component Boundary Advisory](../../component-boundary/component-boundary-advisory.md)\n(discussion-only), [Component Authority Boundary Map](../../proposals/component-authority-boundary-map.md)\n(draft), [FlowDefinition Contract](../contracts/flow-definition.md),\n[Workflow Stage Operation Contract](../contracts/workflow-stage-operation.md),\n[Assignment/Run/RunResult Contract](../contracts/assignment-run-runresult.md),\n[Dispatch Core Contract Normalization plan](../../../history/dispatch-core-contract-normalization/plan.md)"
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Agent Coordination",
    "anchor": "agent-coordination",
    "githubAnchor": "agent-coordination",
    "stableAnchor": "h-ff2e72466c2b",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "17d5a6c9b3fa624b613a1755e1cbc14730df9e0c9bae9692a0bd2eaa382cdd9c",
    "sample": "Agent Coordination",
    "sectionPayloadDigest": "83519bf08c839b916bab4035985de5fe8621084d0bd81a719f5359f94c4054f1",
    "followingBlockDigest": "83519bf08c839b916bab4035985de5fe8621084d0bd81a719f5359f94c4054f1",
    "identityFingerprint": "943cb32f25bfeaa0983eea18a15b86c2e7ad1a9f714d9c00f691cb00ddc91f11",
    "ancestry": [],
    "text": "# Agent Coordination",
    "sectionText": "# Agent Coordination\n\n```txt\nDocument type: Area Portal\nAudience: Human reviewer, maintainer and implementation agent\nPurpose: Route current execution to its owners and retain historical evidence\nDesign status: Accepted\nImplementation: Current-owner navigation; former coordination engine retired\nProvenance: Owner A16 whole-area reframe; complete classified input retained in history/retired-engine/files\nWriter type: Human + agent coauthor\nCanonical for: Area navigation, not runtime schema or old engine status\nUse this when: Locating current execution owners or historical coordination claims\nDo not use this for: Reinstating the retired CoordinationSession engine\nLast reviewed: Pending independent whole-area review\nRelated:\n- docs/specs/runner.md\n- docs/platform/agent-coordination/spec.md\n- docs/platform/agent-coordination/history/retired-engine/README.md\nSupersedes: Stale current-state framing only; no old claim is dropped\nSuperseded by: None\nAdded in candidate: Current-owner routing and retirement framing\n```"
  }
}
```

