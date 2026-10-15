# Header fills and deduplication — part 1

One replacement review request; entries 1–38 of section d. **38 entries**. Content and SYNC `2300d65571968bb3bcb80123a273272586e3f1db`; comparison base `980cb29312b8701f5ea639278f44e1a57a6e5c02`. [Single index](review-request-step10-index-2300d6557.md). Old requests packaged at `8d38b18ed` are superseded. No producer seed or verdict.

Current decision and current witness fields take precedence over explicitly preserved historical records. Every rebound row is pending; old reviewed fields occur only inside historical before records. A36 deep lists are in [A36](step10-sync2300-A36.json); all truth corrections, all partial carries and all unequal source/target rows require deep review.

## Entry d-001: docs/platform/architecture-map.md

```json
{
  "path": "docs/platform/architecture-map.md",
  "beforeSHA256": "19dcc976d77b0e25257069d01234691f66d25c2fd0e0b83b8f4bec92c62abad3",
  "afterSHA256": "adcf809da7f79b998f8f65c7f3ffc29e095d2fee7ab549699fc446f26cf40b5b",
  "headerFieldsAdded": {
    "Implementation": "Partial",
    "Provenance": "Promoted anchor from docs/architecture-map.md",
    "Writer type": "Original writer attribution not recorded; retained source provenance",
    "Canonical for": "Candidate scope: Route readers through the whole-system architecture map; authority follows transitional switchboard",
    "Use this when": "Route readers through the whole-system architecture map",
    "Do not use this for": "Authority beyond the declared scope or implementation truth without the cited verification",
    "Supersedes": "None; legacy sources remain in place during migration",
    "Superseded by": "None recorded"
  },
  "bodySHA256": "37aabc03694422886b65fa52c3d97af63a9c400d52a8a31b031ecc73b6070a38",
  "bodyUnchangedAtHeaderPass": true,
  "basis": {
    "Purpose": "Route readers through the whole-system architecture map",
    "Implementation status": "Partial",
    "Source type": "Promoted anchor from docs/architecture-map.md",
    "Last reviewed": "2026-09-13"
  },
  "reviewStatus": "pending",
  "finalContentCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
  "finalFileSHA256": "fb3f6e2da6cbe36758cd0889886e20221163012805c2dae3dffd1cb5465eab89",
  "fullBefore": "# Architecture Map\n\n```txt\nDocument type: Platform architecture map\nAudience: Human reviewer, architect, maintainer, agent\nPurpose: Route readers through the whole-system architecture map\nDesign status: Draft\nImplementation status: Partial\nCanonical: Yes, after review\nOwner: Platform documentation\nSource type: Promoted anchor from docs/architecture-map.md\nLast reviewed: 2026-09-13\nRelated:\n- docs/platform/README.md\n- docs/platform/component-boundary.md\n- docs/architecture-map.md\n```\n",
  "fullAfter": "# Architecture Map\n\n```txt\nDocument type: Platform architecture map\nAudience: Human reviewer, architect, maintainer, agent\nPurpose: Route readers through the whole-system architecture map\nDesign status: Draft\nCanonical: Yes, after review\nOwner: Platform documentation\nLast reviewed: 2026-09-13\nRelated:\n- docs/platform/README.md\n- docs/platform/component-boundary.md\n- docs/architecture-map.md\nImplementation: Partial\nProvenance: Promoted anchor from docs/architecture-map.md\nWriter type: Original writer attribution not recorded; retained source provenance\nCanonical for: Candidate scope: Route readers through the whole-system architecture map; authority follows transitional switchboard\nUse this when: Route readers through the whole-system architecture map\nDo not use this for: Authority beyond the declared scope or implementation truth without the cited verification\nSupersedes: None; legacy sources remain in place during migration\nSuperseded by: None recorded\n```\n",
  "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db"
}
```

## Entry d-002: docs/platform/component-boundary.md

```json
{
  "path": "docs/platform/component-boundary.md",
  "beforeSHA256": "16c70676490df514a56a57bba3b66f88ac8acafa889de9920d6612bc086d93b9",
  "afterSHA256": "3ca20ac68f40a51902853545dc8ca7a527c35790ffcb21035970668103950e9b",
  "headerFieldsAdded": {
    "Implementation": "Partial",
    "Provenance": "Promoted anchor for docs/architect/component-boundary/**",
    "Writer type": "Original writer attribution not recorded; retained source provenance",
    "Canonical for": "Candidate scope: Track the whole-system component and authority boundary map; authority follows transitional switchboard",
    "Use this when": "Track the whole-system component and authority boundary map",
    "Do not use this for": "Authority beyond the declared scope or implementation truth without the cited verification",
    "Supersedes": "None; legacy sources remain in place during migration",
    "Superseded by": "None recorded"
  },
  "bodySHA256": "d9f16f6465679955f7a626036e7c81194d1a16ea7a53e91e107b6357f8fb7df3",
  "bodyUnchangedAtHeaderPass": true,
  "basis": {
    "Purpose": "Track the whole-system component and authority boundary map",
    "Implementation status": "Partial",
    "Source type": "Promoted anchor for docs/architect/component-boundary/**",
    "Last reviewed": "2026-10-04"
  },
  "reviewStatus": "pending",
  "finalContentCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
  "finalFileSHA256": "384cf74c699ef5f6013c9f975dd056844184697bba58784d2ad9b2154ce51d4a",
  "fullBefore": "# Component Boundary\n\n```txt\nDocument type: Platform architecture anchor\nAudience: Human reviewer, architect, maintainer, design-shaping agent\nPurpose: Track the whole-system component and authority boundary map\nDesign status: Draft\nImplementation status: Partial\nCanonical: Yes, after review\nOwner: Platform documentation\nSource type: Promoted anchor for docs/architect/component-boundary/**\nLast reviewed: 2026-10-04\nRelated:\n- docs/architect/component-boundary/README.md\n- docs/architect/component-boundary/component-boundary-advisory.md\n- docs/architect/proposals/component-authority-boundary-map.md\n- docs/platform/README.md\n```\n",
  "fullAfter": "# Component Boundary\n\n```txt\nDocument type: Platform architecture anchor\nAudience: Human reviewer, architect, maintainer, design-shaping agent\nPurpose: Track the whole-system component and authority boundary map\nDesign status: Draft\nCanonical: Yes, after review\nOwner: Platform documentation\nLast reviewed: 2026-10-04\nRelated:\n- docs/architect/component-boundary/README.md\n- docs/architect/component-boundary/component-boundary-advisory.md\n- docs/architect/proposals/component-authority-boundary-map.md\n- docs/platform/README.md\nImplementation: Partial\nProvenance: Promoted anchor for docs/architect/component-boundary/**\nWriter type: Original writer attribution not recorded; retained source provenance\nCanonical for: Candidate scope: Track the whole-system component and authority boundary map; authority follows transitional switchboard\nUse this when: Track the whole-system component and authority boundary map\nDo not use this for: Authority beyond the declared scope or implementation truth without the cited verification\nSupersedes: None; legacy sources remain in place during migration\nSuperseded by: None recorded\n```\n",
  "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db"
}
```

## Entry d-003: docs/platform/convention/spec.md

```json
{
  "path": "docs/platform/convention/spec.md",
  "beforeSHA256": "ce58ee5ab16696335be7cbe7b5be46449eca2799b4eb5266aa0b13a4276424a6",
  "afterSHA256": "25fa546ea01bc6c1077dc13ada0b22f67c2ed8187137247d5d21d75a6f26c851",
  "headerFieldsAdded": {
    "Implementation": "Implemented",
    "Provenance": "Existing convention specification and its Related references; metadata completion under L10-9",
    "Writer type": "Original writer attribution not recorded; retained source provenance",
    "Canonical for": "Candidate scope: Define the executable source of truth for fgOS names and repository-relative placement; authority follows transitional switchboard",
    "Use this when": "Define the executable source of truth for fgOS names and repository-relative placement",
    "Do not use this for": "Authority beyond the declared scope or implementation truth without the cited verification",
    "Supersedes": "None; legacy sources remain in place during migration",
    "Superseded by": "None recorded"
  },
  "bodySHA256": "0e8ee85d61c86b1245e61494a8cc622c2a215874791a5eb7c7bef3107f0929df",
  "bodyUnchangedAtHeaderPass": true,
  "basis": {
    "Purpose": "Define the executable source of truth for fgOS names and repository-relative placement",
    "Implementation status": "Implemented",
    "Last reviewed": "2026-10-10"
  },
  "reviewStatus": "pending",
  "finalContentCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
  "finalFileSHA256": "17dceaa007bfb1e1223cdb3cf7bfdad214a251b066bb464950e9ba925f06467b",
  "fullBefore": "# Convention Component Specification\n\n```txt\nDocument type: BA-grade area specification\nAudience: Human reviewer, maintainer, implementation agent, tool author\nPurpose: Define the executable source of truth for fgOS names and repository-relative placement\nDesign status: Accepted\nImplementation status: Implemented\nCanonical: Yes\nOwner: Convention component\nSource: packages/convention/rust\nContracts: packages/convention/contracts/\nLast reviewed: 2026-10-10\nRelated:\n- docs/platform/component-boundary.md\n- docs/platform/host-invocation-routing/contracts/operation-catalog.md\n- docs/io-contract.md\n```\n",
  "fullAfter": "# Convention Component Specification\n\n```txt\nDocument type: BA-grade area specification\nAudience: Human reviewer, maintainer, implementation agent, tool author\nPurpose: Define the executable source of truth for fgOS names and repository-relative placement\nDesign status: Accepted\nCanonical: Yes\nOwner: Convention component\nSource: packages/convention/rust\nContracts: packages/convention/contracts/\nLast reviewed: 2026-10-10\nRelated:\n- docs/platform/component-boundary.md\n- docs/platform/host-invocation-routing/contracts/operation-catalog.md\n- docs/io-contract.md\nImplementation: Implemented\nProvenance: Existing convention specification and its Related references; metadata completion under L10-9\nWriter type: Original writer attribution not recorded; retained source provenance\nCanonical for: Candidate scope: Define the executable source of truth for fgOS names and repository-relative placement; authority follows transitional switchboard\nUse this when: Define the executable source of truth for fgOS names and repository-relative placement\nDo not use this for: Authority beyond the declared scope or implementation truth without the cited verification\nSupersedes: None; legacy sources remain in place during migration\nSuperseded by: None recorded\n```\n",
  "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db"
}
```

## Entry d-004: docs/platform/host-invocation-routing/architecture/external-provider-protocol.md

```json
{
  "path": "docs/platform/host-invocation-routing/architecture/external-provider-protocol.md",
  "beforeSHA256": "c6696b9b64fd9bbb71e12070640d060a4f1ed6492773457955f9df979412bee9",
  "afterSHA256": "46c56b74a516c1d1d319055266a26f45604824dd56322b49c49eb7b869516d04",
  "headerFieldsAdded": {
    "Implementation": "External process implemented preview; WASM/provider ecosystem planned",
    "Provenance": "Promoted from docs/architect/host-invocation-routing/external-provider-protocol.md",
    "Writer type": "Original writer attribution not recorded; retained source provenance",
    "Canonical for": "Candidate scope: Define the preview architecture for external process providers and future WASM/provider-ecosystem work; authority follows transitional switchboard",
    "Use this when": "Define the preview architecture for external process providers and future WASM/provider-ecosystem work",
    "Do not use this for": "Authority beyond the declared scope or implementation truth without the cited verification",
    "Supersedes": "None; legacy sources remain in place during migration",
    "Superseded by": "None recorded"
  },
  "bodySHA256": "f66644924adac511fc5f40c4878c0a3741647eeb01df1a7ae3fab81f09960a40",
  "bodyUnchangedAtHeaderPass": true,
  "basis": {
    "Purpose": "Define the preview architecture for external process providers and future WASM/provider-ecosystem work",
    "Implementation status": "External process implemented preview; WASM/provider ecosystem planned",
    "Source type": "Promoted from docs/architect/host-invocation-routing/external-provider-protocol.md",
    "Last reviewed": "2026-09-18"
  },
  "reviewStatus": "pending",
  "finalContentCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
  "finalFileSHA256": "e6f0c282eb6fcafe142d61b199dee5f6f8ad80fb9cd7ed1f317dbf70701a9111",
  "fullBefore": "# Architecture: External Provider Protocol\n\n```txt\nDocument type: Architecture\nAudience: Human reviewer, architect, maintainer, implementation agent\nPurpose: Define the preview architecture for external process providers and future WASM/provider-ecosystem work\nDesign status: Draft\nImplementation status: External process implemented preview; WASM/provider ecosystem planned\nCanonical: Yes, after review\nOwner: Host invocation\nSource type: Promoted from docs/architect/host-invocation-routing/external-provider-protocol.md\nLast reviewed: 2026-09-18\nRelated:\n- docs/platform/host-invocation-routing/contracts/component-protocol.md\n- docs/platform/host-invocation-routing/contracts/external-provider-manifest.md\n- docs/platform/host-invocation-routing/verification/r2-external-process-proof.md\n```\n",
  "fullAfter": "# Architecture: External Provider Protocol\n\n```txt\nDocument type: Architecture\nAudience: Human reviewer, architect, maintainer, implementation agent\nPurpose: Define the preview architecture for external process providers and future WASM/provider-ecosystem work\nDesign status: Draft\nCanonical: Yes, after review\nOwner: Host invocation\nLast reviewed: 2026-09-18\nRelated:\n- docs/platform/host-invocation-routing/contracts/component-protocol.md\n- docs/platform/host-invocation-routing/contracts/external-provider-manifest.md\n- docs/platform/host-invocation-routing/verification/r2-external-process-proof.md\nImplementation: External process implemented preview; WASM/provider ecosystem planned\nProvenance: Promoted from docs/architect/host-invocation-routing/external-provider-protocol.md\nWriter type: Original writer attribution not recorded; retained source provenance\nCanonical for: Candidate scope: Define the preview architecture for external process providers and future WASM/provider-ecosystem work; authority follows transitional switchboard\nUse this when: Define the preview architecture for external process providers and future WASM/provider-ecosystem work\nDo not use this for: Authority beyond the declared scope or implementation truth without the cited verification\nSupersedes: None; legacy sources remain in place during migration\nSuperseded by: None recorded\n```\n",
  "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db"
}
```

## Entry d-005: docs/platform/host-invocation-routing/architecture/host-use-cases.md

```json
{
  "path": "docs/platform/host-invocation-routing/architecture/host-use-cases.md",
  "beforeSHA256": "b54adc926555da030df92e1e1c90c339f10ba4152a17a3486df06a4a0ca7927a",
  "afterSHA256": "d3d5e017ddc028598dc77a29133cee6b41fb199ed898cd65c5c50e6e35dc0a8b",
  "headerFieldsAdded": {
    "Implementation": "Accepted; R3 remote peer implemented preview for distribution.build.show",
    "Provenance": "Promoted from docs/architect/host-invocation-routing/host-invocation-provider-routing.md",
    "Writer type": "Original writer attribution not recorded; retained source provenance",
    "Canonical for": "Candidate scope: Define CLI, remote, chat, and future hosts as peer invocation surfaces; authority follows transitional switchboard",
    "Use this when": "Define CLI, remote, chat, and future hosts as peer invocation surfaces",
    "Do not use this for": "Authority beyond the declared scope or implementation truth without the cited verification",
    "Supersedes": "None; legacy sources remain in place during migration",
    "Superseded by": "None recorded"
  },
  "bodySHA256": "18a69f896a0c67678c18dcb43fe4114a8a89a91c549528f440f02602bb5ce73e",
  "bodyUnchangedAtHeaderPass": true,
  "basis": {
    "Purpose": "Define CLI, remote, chat, and future hosts as peer invocation surfaces",
    "Implementation status": "Accepted; R3 remote peer implemented preview for distribution.build.show",
    "Source type": "Promoted from docs/architect/host-invocation-routing/host-invocation-provider-routing.md",
    "Last reviewed": "2026-09-18"
  },
  "reviewStatus": "pending",
  "finalContentCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
  "finalFileSHA256": "ca0ba1f6eb58df60c305a8340de487444bfe610563afb510f72073075fe0cf95",
  "fullBefore": "# Architecture: Host Use Cases\n\n```txt\nDocument type: Architecture\nAudience: Human reviewer, architect, maintainer, implementation agent\nPurpose: Define CLI, remote, chat, and future hosts as peer invocation surfaces\nDesign status: Draft\nImplementation status: Accepted; R3 remote peer implemented preview for distribution.build.show\nCanonical: Yes, after review\nOwner: Host invocation\nSource type: Promoted from docs/architect/host-invocation-routing/host-invocation-provider-routing.md\nLast reviewed: 2026-09-18\nRelated:\n- docs/platform/host-invocation-routing/architecture/invocation-kernel.md\n- docs/platform/host-invocation-routing/verification/r3-remote-peer-proof.md\n```\n",
  "fullAfter": "# Architecture: Host Use Cases\n\n```txt\nDocument type: Architecture\nAudience: Human reviewer, architect, maintainer, implementation agent\nPurpose: Define CLI, remote, chat, and future hosts as peer invocation surfaces\nDesign status: Draft\nCanonical: Yes, after review\nOwner: Host invocation\nLast reviewed: 2026-09-18\nRelated:\n- docs/platform/host-invocation-routing/architecture/invocation-kernel.md\n- docs/platform/host-invocation-routing/verification/r3-remote-peer-proof.md\nImplementation: Accepted; R3 remote peer implemented preview for distribution.build.show\nProvenance: Promoted from docs/architect/host-invocation-routing/host-invocation-provider-routing.md\nWriter type: Original writer attribution not recorded; retained source provenance\nCanonical for: Candidate scope: Define CLI, remote, chat, and future hosts as peer invocation surfaces; authority follows transitional switchboard\nUse this when: Define CLI, remote, chat, and future hosts as peer invocation surfaces\nDo not use this for: Authority beyond the declared scope or implementation truth without the cited verification\nSupersedes: None; legacy sources remain in place during migration\nSuperseded by: None recorded\n```\n",
  "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db"
}
```

## Entry d-006: docs/platform/host-invocation-routing/architecture/invocation-kernel.md

```json
{
  "path": "docs/platform/host-invocation-routing/architecture/invocation-kernel.md",
  "beforeSHA256": "64b03ea5fb9b59818d280d73a724d9e7c888065938337bcb85d7ebc077079930",
  "afterSHA256": "aa5dca6626fe6c22d7a511cb77e750c24aa8d9e4d8112a8d698439f5e1fd7c73",
  "headerFieldsAdded": {
    "Implementation": "Current partial",
    "Provenance": "Promoted from docs/architect/host-invocation-routing/host-invocation-provider-routing.md",
    "Writer type": "Original writer attribution not recorded; retained source provenance",
    "Canonical for": "Candidate scope: Define the target semantic invocation kernel and lifecycle shape; authority follows transitional switchboard",
    "Use this when": "Define the target semantic invocation kernel and lifecycle shape",
    "Do not use this for": "Authority beyond the declared scope or implementation truth without the cited verification",
    "Supersedes": "None; legacy sources remain in place during migration",
    "Superseded by": "None recorded"
  },
  "bodySHA256": "bdfbe69359c9b192d90322b6622eacfdf2d36573f3e5049734a21f456d213caf",
  "bodyUnchangedAtHeaderPass": true,
  "basis": {
    "Purpose": "Define the target semantic invocation kernel and lifecycle shape",
    "Implementation status": "Current partial",
    "Source type": "Promoted from docs/architect/host-invocation-routing/host-invocation-provider-routing.md",
    "Last reviewed": "2026-09-18"
  },
  "reviewStatus": "pending",
  "finalContentCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
  "finalFileSHA256": "66429fe57a292c8c901ce559cc90694411d951539e4a1deb2774ec3dbf9dfdc1",
  "fullBefore": "# Architecture: Invocation Kernel\n\n```txt\nDocument type: Architecture\nAudience: Human reviewer, architect, maintainer, implementation agent\nPurpose: Define the target semantic invocation kernel and lifecycle shape\nDesign status: Draft\nImplementation status: Current partial\nCanonical: Yes, after review\nOwner: Host invocation\nSource type: Promoted from docs/architect/host-invocation-routing/host-invocation-provider-routing.md\nLast reviewed: 2026-09-18\nRelated:\n- docs/platform/host-invocation-routing/contracts/operation-request-outcome.md\n- docs/platform/host-invocation-routing/contracts/operation-provider.md\n- docs/platform/host-invocation-routing/verification/implementation-alignment.md\n```\n\nAdded in candidate — checked route snapshot (2026-10-13): `packages/host-runtime/contracts/command-routes.json` has 75 selectors: 70 `legacy-cli` and five native (`convention`, `friction`, `gate-bypass`, `metrics`, `version`). This recount supersedes current-count wording; dated proof records remain historical.\n",
  "fullAfter": "# Architecture: Invocation Kernel\n\n```txt\nDocument type: Architecture\nAudience: Human reviewer, architect, maintainer, implementation agent\nPurpose: Define the target semantic invocation kernel and lifecycle shape\nDesign status: Draft\nCanonical: Yes, after review\nOwner: Host invocation\nLast reviewed: 2026-09-18\nRelated:\n- docs/platform/host-invocation-routing/contracts/operation-request-outcome.md\n- docs/platform/host-invocation-routing/contracts/operation-provider.md\n- docs/platform/host-invocation-routing/verification/implementation-alignment.md\nImplementation: Current partial\nProvenance: Promoted from docs/architect/host-invocation-routing/host-invocation-provider-routing.md\nWriter type: Original writer attribution not recorded; retained source provenance\nCanonical for: Candidate scope: Define the target semantic invocation kernel and lifecycle shape; authority follows transitional switchboard\nUse this when: Define the target semantic invocation kernel and lifecycle shape\nDo not use this for: Authority beyond the declared scope or implementation truth without the cited verification\nSupersedes: None; legacy sources remain in place during migration\nSuperseded by: None recorded\n```\n\nAdded in candidate — checked route snapshot (2026-10-13): `packages/host-runtime/contracts/command-routes.json` has 75 selectors: 70 `legacy-cli` and five native (`convention`, `friction`, `gate-bypass`, `metrics`, `version`). This recount supersedes current-count wording; dated proof records remain historical.\n",
  "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db"
}
```

## Entry d-007: docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md

```json
{
  "path": "docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md",
  "beforeSHA256": "bed5a1a058b6975cfc1cd9186170a22b88c0fab8c1ba7244d13f00bab8d316b9",
  "afterSHA256": "f1a54f924687213bf65b1ba96c4cfe39684de9ef89ea4891e1c3f2e12145b2ce",
  "headerFieldsAdded": {
    "Implementation": "Implemented preview with legacy-current payload behavior",
    "Provenance": "Promoted from docs/architect/host-invocation-routing/legacy-cli-transition.md",
    "Writer type": "Original writer attribution not recorded; retained source provenance",
    "Canonical for": "Candidate scope: Define the transitional Node CLI lane and semantic Node bridge boundary; authority follows transitional switchboard",
    "Use this when": "Define the transitional Node CLI lane and semantic Node bridge boundary",
    "Do not use this for": "Authority beyond the declared scope or implementation truth without the cited verification",
    "Supersedes": "None; legacy sources remain in place during migration",
    "Superseded by": "None recorded"
  },
  "bodySHA256": "cbe06e0a4c11cab0de247ce770e74d3d623e35a63f5e2ee8227bd9caff938567",
  "bodyUnchangedAtHeaderPass": true,
  "basis": {
    "Purpose": "Define the transitional Node CLI lane and semantic Node bridge boundary",
    "Implementation status": "Implemented preview with legacy-current payload behavior",
    "Source type": "Promoted from docs/architect/host-invocation-routing/legacy-cli-transition.md",
    "Last reviewed": "2026-09-18"
  },
  "reviewStatus": "pending",
  "finalContentCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
  "finalFileSHA256": "c1ea1d373905b1b414d4ecafe9e80c0afb89232d956758b8dcde5b451da75d7d",
  "fullBefore": "# Architecture: Legacy CLI Transition\n\n```txt\nDocument type: Architecture\nAudience: Human reviewer, architect, maintainer, implementation agent\nPurpose: Define the transitional Node CLI lane and semantic Node bridge boundary\nDesign status: Draft\nImplementation status: Implemented preview with legacy-current payload behavior\nCanonical: Yes, after review\nOwner: Host invocation\nSource type: Promoted from docs/architect/host-invocation-routing/legacy-cli-transition.md\nLast reviewed: 2026-09-18\nRelated:\n- docs/platform/host-invocation-routing/contracts/command-route-descriptor.md\n- docs/platform/host-invocation-routing/contracts/legacy-payload.md\n- docs/platform/host-invocation-routing/verification/compatibility-harness.md\n```\n",
  "fullAfter": "# Architecture: Legacy CLI Transition\n\n```txt\nDocument type: Architecture\nAudience: Human reviewer, architect, maintainer, implementation agent\nPurpose: Define the transitional Node CLI lane and semantic Node bridge boundary\nDesign status: Draft\nCanonical: Yes, after review\nOwner: Host invocation\nLast reviewed: 2026-09-18\nRelated:\n- docs/platform/host-invocation-routing/contracts/command-route-descriptor.md\n- docs/platform/host-invocation-routing/contracts/legacy-payload.md\n- docs/platform/host-invocation-routing/verification/compatibility-harness.md\nImplementation: Implemented preview with legacy-current payload behavior\nProvenance: Promoted from docs/architect/host-invocation-routing/legacy-cli-transition.md\nWriter type: Original writer attribution not recorded; retained source provenance\nCanonical for: Candidate scope: Define the transitional Node CLI lane and semantic Node bridge boundary; authority follows transitional switchboard\nUse this when: Define the transitional Node CLI lane and semantic Node bridge boundary\nDo not use this for: Authority beyond the declared scope or implementation truth without the cited verification\nSupersedes: None; legacy sources remain in place during migration\nSuperseded by: None recorded\n```\n",
  "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db"
}
```

## Entry d-008: docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md

```json
{
  "path": "docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md",
  "beforeSHA256": "bc0a292df192ec7ee1dbc217feed5057de129e55e02beaaf60dd4dd6edabdb37",
  "afterSHA256": "ac098210d47957870221b864c6dd712d86c8eb3ccc6ad9604f9f1594089ed14e",
  "headerFieldsAdded": {
    "Implementation": "R1/R2/R3 implemented preview plus remaining component migrations",
    "Provenance": "Promoted from docs/architect/host-invocation-routing/node-to-rust-component-migration.md",
    "Writer type": "Original writer attribution not recorded; retained source provenance",
    "Canonical for": "Candidate scope: Preserve the selected Node-to-Rust migration sequence and constraints; authority follows transitional switchboard",
    "Use this when": "Preserve the selected Node-to-Rust migration sequence and constraints",
    "Do not use this for": "Authority beyond the declared scope or implementation truth without the cited verification",
    "Supersedes": "None; legacy sources remain in place during migration",
    "Superseded by": "None recorded"
  },
  "bodySHA256": "6fc27ce58023ffcc119a07b2f9187f3f837777b46898b8b1092cbed815e8e895",
  "bodyUnchangedAtHeaderPass": true,
  "basis": {
    "Purpose": "Preserve the selected Node-to-Rust migration sequence and constraints",
    "Implementation status": "R1/R2/R3 implemented preview plus remaining component migrations",
    "Source type": "Promoted from docs/architect/host-invocation-routing/node-to-rust-component-migration.md",
    "Last reviewed": "2026-09-18"
  },
  "reviewStatus": "pending",
  "finalContentCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
  "finalFileSHA256": "91460b8da411b883b18710d3f886eb521945a01af50779d4abd217b8976e63d7",
  "fullBefore": "# Architecture: Node To Rust Migration\n\n```txt\nDocument type: Architecture\nAudience: Human reviewer, architect, maintainer, implementation agent\nPurpose: Preserve the selected Node-to-Rust migration sequence and constraints\nDesign status: Draft\nImplementation status: R1/R2/R3 implemented preview plus remaining component migrations\nCanonical: Yes, after review\nOwner: Host invocation\nSource type: Promoted from docs/architect/host-invocation-routing/node-to-rust-component-migration.md\nLast reviewed: 2026-09-18\nRelated:\n- docs/platform/host-invocation-routing/architecture/release-boundaries.md\n- docs/platform/host-invocation-routing/verification/r1-rust-host-proof.md\n```\n",
  "fullAfter": "# Architecture: Node To Rust Migration\n\n```txt\nDocument type: Architecture\nAudience: Human reviewer, architect, maintainer, implementation agent\nPurpose: Preserve the selected Node-to-Rust migration sequence and constraints\nDesign status: Draft\nCanonical: Yes, after review\nOwner: Host invocation\nLast reviewed: 2026-09-18\nRelated:\n- docs/platform/host-invocation-routing/architecture/release-boundaries.md\n- docs/platform/host-invocation-routing/verification/r1-rust-host-proof.md\nImplementation: R1/R2/R3 implemented preview plus remaining component migrations\nProvenance: Promoted from docs/architect/host-invocation-routing/node-to-rust-component-migration.md\nWriter type: Original writer attribution not recorded; retained source provenance\nCanonical for: Candidate scope: Preserve the selected Node-to-Rust migration sequence and constraints; authority follows transitional switchboard\nUse this when: Preserve the selected Node-to-Rust migration sequence and constraints\nDo not use this for: Authority beyond the declared scope or implementation truth without the cited verification\nSupersedes: None; legacy sources remain in place during migration\nSuperseded by: None recorded\n```\n",
  "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db"
}
```

## Entry d-009: docs/platform/host-invocation-routing/architecture/provider-routing.md

```json
{
  "path": "docs/platform/host-invocation-routing/architecture/provider-routing.md",
  "beforeSHA256": "2f7020661b7b1fd8fa2a32da4222a9af166c1c83d72ce7acb86212c754b5df50",
  "afterSHA256": "910d37e751e777294abe00844e51d8517b0651f9f81cd84712abf5b9928d9d6e",
  "headerFieldsAdded": {
    "Implementation": "Current partial",
    "Provenance": "Promoted from docs/architect/host-invocation-routing/host-invocation-provider-routing.md and external-provider-protocol.md",
    "Writer type": "Original writer attribution not recorded; retained source provenance",
    "Canonical for": "Candidate scope: Define provider selection, registry snapshot, replacement, and authority gates; authority follows transitional switchboard",
    "Use this when": "Define provider selection, registry snapshot, replacement, and authority gates",
    "Do not use this for": "Authority beyond the declared scope or implementation truth without the cited verification",
    "Supersedes": "None; legacy sources remain in place during migration",
    "Superseded by": "None recorded"
  },
  "bodySHA256": "7f4da2de5262691549edd9b3d8cc385c43b1e4a954127e63a08096675851436f",
  "bodyUnchangedAtHeaderPass": true,
  "basis": {
    "Purpose": "Define provider selection, registry snapshot, replacement, and authority gates",
    "Implementation status": "Current partial",
    "Source type": "Promoted from docs/architect/host-invocation-routing/host-invocation-provider-routing.md and external-provider-protocol.md",
    "Last reviewed": "2026-09-15"
  },
  "reviewStatus": "pending",
  "finalContentCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
  "finalFileSHA256": "f2b02a515813484093009ccf01d08c6dbcb3c24a58bcb56a0590a997cdd90628",
  "fullBefore": "# Architecture: Provider Routing\n\n```txt\nDocument type: Architecture\nAudience: Human reviewer, architect, maintainer, implementation agent\nPurpose: Define provider selection, registry snapshot, replacement, and authority gates\nDesign status: Draft\nImplementation status: Current partial\nCanonical: Yes, after review\nOwner: Host invocation\nSource type: Promoted from docs/architect/host-invocation-routing/host-invocation-provider-routing.md and external-provider-protocol.md\nLast reviewed: 2026-09-15\nRelated:\n- docs/platform/host-invocation-routing/contracts/operation-catalog.md\n- docs/platform/host-invocation-routing/contracts/operation-provider.md\n- docs/platform/host-invocation-routing/contracts/external-provider-manifest.md\n```\n",
  "fullAfter": "# Architecture: Provider Routing\n\n```txt\nDocument type: Architecture\nAudience: Human reviewer, architect, maintainer, implementation agent\nPurpose: Define provider selection, registry snapshot, replacement, and authority gates\nDesign status: Draft\nCanonical: Yes, after review\nOwner: Host invocation\nLast reviewed: 2026-09-15\nRelated:\n- docs/platform/host-invocation-routing/contracts/operation-catalog.md\n- docs/platform/host-invocation-routing/contracts/operation-provider.md\n- docs/platform/host-invocation-routing/contracts/external-provider-manifest.md\nImplementation: Current partial\nProvenance: Promoted from docs/architect/host-invocation-routing/host-invocation-provider-routing.md and external-provider-protocol.md\nWriter type: Original writer attribution not recorded; retained source provenance\nCanonical for: Candidate scope: Define provider selection, registry snapshot, replacement, and authority gates; authority follows transitional switchboard\nUse this when: Define provider selection, registry snapshot, replacement, and authority gates\nDo not use this for: Authority beyond the declared scope or implementation truth without the cited verification\nSupersedes: None; legacy sources remain in place during migration\nSuperseded by: None recorded\n```\n",
  "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db"
}
```

## Entry d-010: docs/platform/host-invocation-routing/architecture/release-boundaries.md

```json
{
  "path": "docs/platform/host-invocation-routing/architecture/release-boundaries.md",
  "beforeSHA256": "3a021a8335b612e3b9af7a30f341172ffe3778997474abe94206fbc0d5e9cc20",
  "afterSHA256": "156f36f38ea5f7671b511fa62e3e8ce352feff11f26a17c39c202fb705e8630c",
  "headerFieldsAdded": {
    "Implementation": "R1/R2/R3 implemented preview plus current partial route migration",
    "Provenance": "Promoted from docs/architect/host-invocation-routing/host-invocation-provider-routing.md and rust-cli-and-proof-components-plan.md",
    "Writer type": "Original writer attribution not recorded; retained source provenance",
    "Canonical for": "Candidate scope: Define R1, R2, R3, and later proof boundaries for host invocation; authority follows transitional switchboard",
    "Use this when": "Define R1, R2, R3, and later proof boundaries for host invocation",
    "Do not use this for": "Authority beyond the declared scope or implementation truth without the cited verification",
    "Supersedes": "None; legacy sources remain in place during migration",
    "Superseded by": "None recorded"
  },
  "bodySHA256": "6300317a9811aa10079f72710e88b48a193f069c403e735a84d2497813c27df0",
  "bodyUnchangedAtHeaderPass": true,
  "basis": {
    "Purpose": "Define R1, R2, R3, and later proof boundaries for host invocation",
    "Implementation status": "R1/R2/R3 implemented preview plus current partial route migration",
    "Source type": "Promoted from docs/architect/host-invocation-routing/host-invocation-provider-routing.md and rust-cli-and-proof-components-plan.md",
    "Last reviewed": "2026-09-21"
  },
  "reviewStatus": "pending",
  "finalContentCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
  "finalFileSHA256": "0af4412ae604e24467388ef1c4e388da0cd93c6d41b3d1b0f74faaeee281827e",
  "fullBefore": "# Architecture: Release Boundaries\n\n```txt\nDocument type: Architecture\nAudience: Human reviewer, architect, maintainer, implementation agent\nPurpose: Define R1, R2, R3, and later proof boundaries for host invocation\nDesign status: Draft\nImplementation status: R1/R2/R3 implemented preview plus current partial route migration\nCanonical: Yes, after review\nOwner: Host invocation\nSource type: Promoted from docs/architect/host-invocation-routing/host-invocation-provider-routing.md and rust-cli-and-proof-components-plan.md\nLast reviewed: 2026-09-21\nRelated:\n- docs/platform/host-invocation-routing/verification/r1-rust-host-proof.md\n- docs/platform/host-invocation-routing/verification/r2-external-process-proof.md\n- docs/platform/host-invocation-routing/verification/r3-remote-peer-proof.md\n```\n\nAdded in candidate — checked route snapshot (2026-10-13): `packages/host-runtime/contracts/command-routes.json` has 75 selectors: 70 `legacy-cli` and five native (`convention`, `friction`, `gate-bypass`, `metrics`, `version`). This recount supersedes current-count wording; dated proof records remain historical.\n",
  "fullAfter": "# Architecture: Release Boundaries\n\n```txt\nDocument type: Architecture\nAudience: Human reviewer, architect, maintainer, implementation agent\nPurpose: Define R1, R2, R3, and later proof boundaries for host invocation\nDesign status: Draft\nCanonical: Yes, after review\nOwner: Host invocation\nLast reviewed: 2026-09-21\nRelated:\n- docs/platform/host-invocation-routing/verification/r1-rust-host-proof.md\n- docs/platform/host-invocation-routing/verification/r2-external-process-proof.md\n- docs/platform/host-invocation-routing/verification/r3-remote-peer-proof.md\nImplementation: R1/R2/R3 implemented preview plus current partial route migration\nProvenance: Promoted from docs/architect/host-invocation-routing/host-invocation-provider-routing.md and rust-cli-and-proof-components-plan.md\nWriter type: Original writer attribution not recorded; retained source provenance\nCanonical for: Candidate scope: Define R1, R2, R3, and later proof boundaries for host invocation; authority follows transitional switchboard\nUse this when: Define R1, R2, R3, and later proof boundaries for host invocation\nDo not use this for: Authority beyond the declared scope or implementation truth without the cited verification\nSupersedes: None; legacy sources remain in place during migration\nSuperseded by: None recorded\n```\n\nAdded in candidate — checked route snapshot (2026-10-13): `packages/host-runtime/contracts/command-routes.json` has 75 selectors: 70 `legacy-cli` and five native (`convention`, `friction`, `gate-bypass`, `metrics`, `version`). This recount supersedes current-count wording; dated proof records remain historical.\n",
  "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db"
}
```

## Entry d-011: docs/platform/host-invocation-routing/contracts/command-route-descriptor.md

```json
{
  "path": "docs/platform/host-invocation-routing/contracts/command-route-descriptor.md",
  "beforeSHA256": "05ef5644dc45256e6bf8f667752bbbcc2b15e27353424e0abb39da819618a893",
  "afterSHA256": "05d15b56ecab08822045c3d8c294eef385c51e192fbfc6bcd7cbd3f4e9cc3534",
  "headerFieldsAdded": {
    "Implementation": "Current partial",
    "Provenance": "Promoted from docs/architect/host-invocation-routing/legacy-cli-transition.md",
    "Writer type": "Original writer attribution not recorded; retained source provenance",
    "Canonical for": "Candidate scope: Define per-selector native versus legacy CLI routing and repair ownership; authority follows transitional switchboard",
    "Use this when": "Define per-selector native versus legacy CLI routing and repair ownership",
    "Do not use this for": "Authority beyond the declared scope or implementation truth without the cited verification",
    "Supersedes": "None; legacy sources remain in place during migration",
    "Superseded by": "None recorded"
  },
  "bodySHA256": "933713e34b099be2cdb4b3e7e57a9bc591fa5ae72423363e95da104e9e6b88d8",
  "bodyUnchangedAtHeaderPass": true,
  "basis": {
    "Purpose": "Define per-selector native versus legacy CLI routing and repair ownership",
    "Implementation status": "Current partial",
    "Source type": "Promoted from docs/architect/host-invocation-routing/legacy-cli-transition.md",
    "Last reviewed": "2026-09-18"
  },
  "reviewStatus": "pending",
  "finalContentCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
  "finalFileSHA256": "aba85b7f20eab828165bfaea494c77c4a526bea3db511d51276401443de07b54",
  "fullBefore": "# Contract: Command Route Descriptor\n\n```txt\nDocument type: Contract\nAudience: Human reviewer, architect, maintainer, implementation agent\nPurpose: Define per-selector native versus legacy CLI routing and repair ownership\nDesign status: Draft\nImplementation status: Current partial\nCanonical: Yes, after review\nOwner: Host invocation\nSource type: Promoted from docs/architect/host-invocation-routing/legacy-cli-transition.md\nLast reviewed: 2026-09-18\nRelated:\n- docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md\n- docs/platform/host-invocation-routing/verification/compatibility-harness.md\n```\n\nAdded in candidate — checked route snapshot (2026-10-13): `packages/host-runtime/contracts/command-routes.json` has 75 selectors: 70 `legacy-cli` and five native (`convention`, `friction`, `gate-bypass`, `metrics`, `version`). This recount supersedes current-count wording; dated proof records remain historical.\n",
  "fullAfter": "# Contract: Command Route Descriptor\n\n```txt\nDocument type: Contract\nAudience: Human reviewer, architect, maintainer, implementation agent\nPurpose: Define per-selector native versus legacy CLI routing and repair ownership\nDesign status: Draft\nCanonical: Yes, after review\nOwner: Host invocation\nLast reviewed: 2026-09-18\nRelated:\n- docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md\n- docs/platform/host-invocation-routing/verification/compatibility-harness.md\nImplementation: Current partial\nProvenance: Promoted from docs/architect/host-invocation-routing/legacy-cli-transition.md\nWriter type: Original writer attribution not recorded; retained source provenance\nCanonical for: Candidate scope: Define per-selector native versus legacy CLI routing and repair ownership; authority follows transitional switchboard\nUse this when: Define per-selector native versus legacy CLI routing and repair ownership\nDo not use this for: Authority beyond the declared scope or implementation truth without the cited verification\nSupersedes: None; legacy sources remain in place during migration\nSuperseded by: None recorded\n```\n\nAdded in candidate — checked route snapshot (2026-10-13): `packages/host-runtime/contracts/command-routes.json` has 75 selectors: 70 `legacy-cli` and five native (`convention`, `friction`, `gate-bypass`, `metrics`, `version`). This recount supersedes current-count wording; dated proof records remain historical.\n",
  "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db"
}
```

## Entry d-012: docs/platform/host-invocation-routing/contracts/component-protocol.md

```json
{
  "path": "docs/platform/host-invocation-routing/contracts/component-protocol.md",
  "beforeSHA256": "39c7a77ccdc4c2704b6a105f4f0d239e95779c5d9e07f6af804522c57e7be7f4",
  "afterSHA256": "564c98d1e27a7724bd47d79bc2be566bc1b4c763fcd50847244a312bdbd866ef",
  "headerFieldsAdded": {
    "Implementation": "Implemented preview",
    "Provenance": "Promoted from docs/architect/host-invocation-routing/external-provider-protocol.md",
    "Writer type": "Original writer attribution not recorded; retained source provenance",
    "Canonical for": "Candidate scope: Define the preview external process provider wire boundary and future component protocol rules; authority follows transitional switchboard",
    "Use this when": "Define the preview external process provider wire boundary and future component protocol rules",
    "Do not use this for": "Authority beyond the declared scope or implementation truth without the cited verification",
    "Supersedes": "None; legacy sources remain in place during migration",
    "Superseded by": "None recorded"
  },
  "bodySHA256": "401c2d277672d66cd2d1a5c0fd7c73381aa8fbff4f1e78e6882bd3797aa03e1b",
  "bodyUnchangedAtHeaderPass": true,
  "basis": {
    "Purpose": "Define the preview external process provider wire boundary and future component protocol rules",
    "Implementation status": "Implemented preview",
    "Source type": "Promoted from docs/architect/host-invocation-routing/external-provider-protocol.md",
    "Last reviewed": "2026-09-18"
  },
  "reviewStatus": "pending",
  "finalContentCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
  "finalFileSHA256": "f889864fced64aa82321f1362fecfcf499e61606a192f2177332dce534d26c19",
  "fullBefore": "# Contract: Component Protocol\n\n```txt\nDocument type: Contract\nAudience: Human reviewer, architect, maintainer, implementation agent\nPurpose: Define the preview external process provider wire boundary and future component protocol rules\nDesign status: Draft\nImplementation status: Implemented preview\nCanonical: Yes, after review\nOwner: Host invocation\nSource type: Promoted from docs/architect/host-invocation-routing/external-provider-protocol.md\nLast reviewed: 2026-09-18\nRelated:\n- docs/platform/host-invocation-routing/architecture/external-provider-protocol.md\n- docs/platform/host-invocation-routing/verification/r2-external-process-proof.md\n```\n",
  "fullAfter": "# Contract: Component Protocol\n\n```txt\nDocument type: Contract\nAudience: Human reviewer, architect, maintainer, implementation agent\nPurpose: Define the preview external process provider wire boundary and future component protocol rules\nDesign status: Draft\nCanonical: Yes, after review\nOwner: Host invocation\nLast reviewed: 2026-09-18\nRelated:\n- docs/platform/host-invocation-routing/architecture/external-provider-protocol.md\n- docs/platform/host-invocation-routing/verification/r2-external-process-proof.md\nImplementation: Implemented preview\nProvenance: Promoted from docs/architect/host-invocation-routing/external-provider-protocol.md\nWriter type: Original writer attribution not recorded; retained source provenance\nCanonical for: Candidate scope: Define the preview external process provider wire boundary and future component protocol rules; authority follows transitional switchboard\nUse this when: Define the preview external process provider wire boundary and future component protocol rules\nDo not use this for: Authority beyond the declared scope or implementation truth without the cited verification\nSupersedes: None; legacy sources remain in place during migration\nSuperseded by: None recorded\n```\n",
  "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db"
}
```

## Entry d-013: docs/platform/host-invocation-routing/contracts/external-provider-manifest.md

```json
{
  "path": "docs/platform/host-invocation-routing/contracts/external-provider-manifest.md",
  "beforeSHA256": "6e83b3e3f272bedd55d66b72a3162a324303cf0fe1f65de9076551c1bd75c627",
  "afterSHA256": "7f2d2dff1f82985478ed8f9d1049557cb880abc86d437c3f71a565f61f738404",
  "headerFieldsAdded": {
    "Implementation": "Implemented preview",
    "Provenance": "Promoted from docs/architect/host-invocation-routing/external-provider-protocol.md",
    "Writer type": "Original writer attribution not recorded; retained source provenance",
    "Canonical for": "Candidate scope: Define static provider manifest discovery, namespace rules, and replacement policy; authority follows transitional switchboard",
    "Use this when": "Define static provider manifest discovery, namespace rules, and replacement policy",
    "Do not use this for": "Authority beyond the declared scope or implementation truth without the cited verification",
    "Supersedes": "None; legacy sources remain in place during migration",
    "Superseded by": "None recorded"
  },
  "bodySHA256": "43c079954010edfe29dab0f242c511f5d6b4205bab4a8e4e7b50a4f391c7769c",
  "bodyUnchangedAtHeaderPass": true,
  "basis": {
    "Purpose": "Define static provider manifest discovery, namespace rules, and replacement policy",
    "Implementation status": "Implemented preview",
    "Source type": "Promoted from docs/architect/host-invocation-routing/external-provider-protocol.md",
    "Last reviewed": "2026-09-18"
  },
  "reviewStatus": "pending",
  "finalContentCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
  "finalFileSHA256": "19a69423f450586e21e98f5c932dcb5c1520ab1ccee370ccc0dcac14b2815714",
  "fullBefore": "# Contract: External Provider Manifest\n\n```txt\nDocument type: Contract\nAudience: Human reviewer, architect, maintainer, implementation agent\nPurpose: Define static provider manifest discovery, namespace rules, and replacement policy\nDesign status: Draft\nImplementation status: Implemented preview\nCanonical: Yes, after review\nOwner: Host invocation\nSource type: Promoted from docs/architect/host-invocation-routing/external-provider-protocol.md\nLast reviewed: 2026-09-18\nRelated:\n- docs/platform/host-invocation-routing/architecture/external-provider-protocol.md\n- docs/platform/host-invocation-routing/contracts/component-protocol.md\n```\n",
  "fullAfter": "# Contract: External Provider Manifest\n\n```txt\nDocument type: Contract\nAudience: Human reviewer, architect, maintainer, implementation agent\nPurpose: Define static provider manifest discovery, namespace rules, and replacement policy\nDesign status: Draft\nCanonical: Yes, after review\nOwner: Host invocation\nLast reviewed: 2026-09-18\nRelated:\n- docs/platform/host-invocation-routing/architecture/external-provider-protocol.md\n- docs/platform/host-invocation-routing/contracts/component-protocol.md\nImplementation: Implemented preview\nProvenance: Promoted from docs/architect/host-invocation-routing/external-provider-protocol.md\nWriter type: Original writer attribution not recorded; retained source provenance\nCanonical for: Candidate scope: Define static provider manifest discovery, namespace rules, and replacement policy; authority follows transitional switchboard\nUse this when: Define static provider manifest discovery, namespace rules, and replacement policy\nDo not use this for: Authority beyond the declared scope or implementation truth without the cited verification\nSupersedes: None; legacy sources remain in place during migration\nSuperseded by: None recorded\n```\n",
  "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db"
}
```

## Entry d-014: docs/platform/host-invocation-routing/contracts/legacy-payload.md

```json
{
  "path": "docs/platform/host-invocation-routing/contracts/legacy-payload.md",
  "beforeSHA256": "6210a5a5e8c109281b235843c868f00d14f3cab9ed628db66322f5dc4131d272",
  "afterSHA256": "92e4aa5890df6020a75f3772f97668dd1d2130d049c91780f695c2e0b20a25c6",
  "headerFieldsAdded": {
    "Implementation": "Legacy-current plus implemented-preview release manifest binding",
    "Provenance": "Promoted from docs/architect/host-invocation-routing/legacy-cli-transition.md",
    "Writer type": "Original writer attribution not recorded; retained source provenance",
    "Canonical for": "Candidate scope: Define legacy Node payload identity, source location, release placement, and compatibility boundaries; authority follows transitional switchboard",
    "Use this when": "Define legacy Node payload identity, source location, release placement, and compatibility boundaries",
    "Do not use this for": "Authority beyond the declared scope or implementation truth without the cited verification",
    "Supersedes": "None; legacy sources remain in place during migration",
    "Superseded by": "None recorded"
  },
  "bodySHA256": "33c8c6b2324929baead66438d26a8040902a23d85cc9f8455015419988fcef8b",
  "bodyUnchangedAtHeaderPass": true,
  "basis": {
    "Purpose": "Define legacy Node payload identity, source location, release placement, and compatibility boundaries",
    "Implementation status": "Legacy-current plus implemented-preview release manifest binding",
    "Source type": "Promoted from docs/architect/host-invocation-routing/legacy-cli-transition.md",
    "Last reviewed": "2026-09-18"
  },
  "reviewStatus": "pending",
  "finalContentCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
  "finalFileSHA256": "e0643764b4626ea7b707479354eaf5361f7725d2bc7b3085f161429b9f1f033f",
  "fullBefore": "# Contract: Legacy Payload\n\n```txt\nDocument type: Contract\nAudience: Human reviewer, architect, maintainer, implementation agent\nPurpose: Define legacy Node payload identity, source location, release placement, and compatibility boundaries\nDesign status: Draft\nImplementation status: Legacy-current plus implemented-preview release manifest binding\nCanonical: Yes, after review\nOwner: Host invocation\nSource type: Promoted from docs/architect/host-invocation-routing/legacy-cli-transition.md\nLast reviewed: 2026-09-18\nRelated:\n- docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md\n- docs/platform/host-invocation-routing/contracts/command-route-descriptor.md\n- docs/platform/packaging-distribution/contracts/release-manifest.md\n```\n",
  "fullAfter": "# Contract: Legacy Payload\n\n```txt\nDocument type: Contract\nAudience: Human reviewer, architect, maintainer, implementation agent\nPurpose: Define legacy Node payload identity, source location, release placement, and compatibility boundaries\nDesign status: Draft\nCanonical: Yes, after review\nOwner: Host invocation\nLast reviewed: 2026-09-18\nRelated:\n- docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md\n- docs/platform/host-invocation-routing/contracts/command-route-descriptor.md\n- docs/platform/packaging-distribution/contracts/release-manifest.md\nImplementation: Legacy-current plus implemented-preview release manifest binding\nProvenance: Promoted from docs/architect/host-invocation-routing/legacy-cli-transition.md\nWriter type: Original writer attribution not recorded; retained source provenance\nCanonical for: Candidate scope: Define legacy Node payload identity, source location, release placement, and compatibility boundaries; authority follows transitional switchboard\nUse this when: Define legacy Node payload identity, source location, release placement, and compatibility boundaries\nDo not use this for: Authority beyond the declared scope or implementation truth without the cited verification\nSupersedes: None; legacy sources remain in place during migration\nSuperseded by: None recorded\n```\n",
  "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db"
}
```

## Entry d-015: docs/platform/host-invocation-routing/contracts/operation-catalog.md

```json
{
  "path": "docs/platform/host-invocation-routing/contracts/operation-catalog.md",
  "beforeSHA256": "f9bf2d39c408707eed4838b86500d39b5b1757461b69bcb514560ca24e6c41ef",
  "afterSHA256": "bb6b8d5827e202c3876069de0829f12ee9d5826e50eb25bd96914f5cabce1e57",
  "headerFieldsAdded": {
    "Implementation": "Current partial",
    "Provenance": "Promoted from docs/architect/host-invocation-routing/host-invocation-provider-routing.md",
    "Writer type": "Original writer attribution not recorded; retained source provenance",
    "Canonical for": "Candidate scope: Define operation identity, descriptors, catalog authorship, and version matching; authority follows transitional switchboard",
    "Use this when": "Define operation identity, descriptors, catalog authorship, and version matching",
    "Do not use this for": "Authority beyond the declared scope or implementation truth without the cited verification",
    "Supersedes": "None; legacy sources remain in place during migration",
    "Superseded by": "None recorded"
  },
  "bodySHA256": "6be44e36e93e743e1d06838a870621835720651efd61d6bc244837852202bf14",
  "bodyUnchangedAtHeaderPass": true,
  "basis": {
    "Purpose": "Define operation identity, descriptors, catalog authorship, and version matching",
    "Implementation status": "Current partial",
    "Source type": "Promoted from docs/architect/host-invocation-routing/host-invocation-provider-routing.md",
    "Last reviewed": "2026-09-18"
  },
  "reviewStatus": "pending",
  "finalContentCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
  "finalFileSHA256": "d4dde671c6ff5fc219a495cd83f26df8f95d6e0e19ffaa407232df6a7718b161",
  "fullBefore": "# Contract: Operation Catalog\n\n```txt\nDocument type: Contract\nAudience: Human reviewer, architect, maintainer, implementation agent\nPurpose: Define operation identity, descriptors, catalog authorship, and version matching\nDesign status: Draft\nImplementation status: Current partial\nCanonical: Yes, after review\nOwner: Host invocation\nSource type: Promoted from docs/architect/host-invocation-routing/host-invocation-provider-routing.md\nLast reviewed: 2026-09-18\nRelated:\n- docs/platform/host-invocation-routing/architecture/provider-routing.md\n- docs/platform/host-invocation-routing/verification/implementation-alignment.md\n```\n",
  "fullAfter": "# Contract: Operation Catalog\n\n```txt\nDocument type: Contract\nAudience: Human reviewer, architect, maintainer, implementation agent\nPurpose: Define operation identity, descriptors, catalog authorship, and version matching\nDesign status: Draft\nCanonical: Yes, after review\nOwner: Host invocation\nLast reviewed: 2026-09-18\nRelated:\n- docs/platform/host-invocation-routing/architecture/provider-routing.md\n- docs/platform/host-invocation-routing/verification/implementation-alignment.md\nImplementation: Current partial\nProvenance: Promoted from docs/architect/host-invocation-routing/host-invocation-provider-routing.md\nWriter type: Original writer attribution not recorded; retained source provenance\nCanonical for: Candidate scope: Define operation identity, descriptors, catalog authorship, and version matching; authority follows transitional switchboard\nUse this when: Define operation identity, descriptors, catalog authorship, and version matching\nDo not use this for: Authority beyond the declared scope or implementation truth without the cited verification\nSupersedes: None; legacy sources remain in place during migration\nSuperseded by: None recorded\n```\n",
  "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db"
}
```

## Entry d-016: docs/platform/host-invocation-routing/contracts/operation-provider.md

```json
{
  "path": "docs/platform/host-invocation-routing/contracts/operation-provider.md",
  "beforeSHA256": "c24d5b5cdc749a6fb14b56d480e67f37f6a9a3e028f1dfcfdeeb6cb0ef3a1ef6",
  "afterSHA256": "04543488a39f82da5228a932313aa381eb3dab358df074387492c5eeb252b84c",
  "headerFieldsAdded": {
    "Implementation": "Current partial",
    "Provenance": "Promoted from docs/architect/host-invocation-routing/host-invocation-provider-routing.md",
    "Writer type": "Original writer attribution not recorded; retained source provenance",
    "Canonical for": "Candidate scope: Define provider descriptors, provider invocation, control, and events; authority follows transitional switchboard",
    "Use this when": "Define provider descriptors, provider invocation, control, and events",
    "Do not use this for": "Authority beyond the declared scope or implementation truth without the cited verification",
    "Supersedes": "None; legacy sources remain in place during migration",
    "Superseded by": "None recorded"
  },
  "bodySHA256": "9575ad127cbf18e2b5463d988aa16f1fd413679ddcb2467c47e06396f7cb425f",
  "bodyUnchangedAtHeaderPass": true,
  "basis": {
    "Purpose": "Define provider descriptors, provider invocation, control, and events",
    "Implementation status": "Current partial",
    "Source type": "Promoted from docs/architect/host-invocation-routing/host-invocation-provider-routing.md",
    "Last reviewed": "2026-09-18"
  },
  "reviewStatus": "pending",
  "finalContentCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
  "finalFileSHA256": "a0627e1f394730024382a9d1c220c1a75f7e32fb6d60a1f98615b678289c2ef5",
  "fullBefore": "# Contract: Operation Provider\n\n```txt\nDocument type: Contract\nAudience: Human reviewer, architect, maintainer, implementation agent\nPurpose: Define provider descriptors, provider invocation, control, and events\nDesign status: Draft\nImplementation status: Current partial\nCanonical: Yes, after review\nOwner: Host invocation\nSource type: Promoted from docs/architect/host-invocation-routing/host-invocation-provider-routing.md\nLast reviewed: 2026-09-18\nRelated:\n- docs/platform/host-invocation-routing/architecture/invocation-kernel.md\n- docs/platform/host-invocation-routing/architecture/provider-routing.md\n```\n",
  "fullAfter": "# Contract: Operation Provider\n\n```txt\nDocument type: Contract\nAudience: Human reviewer, architect, maintainer, implementation agent\nPurpose: Define provider descriptors, provider invocation, control, and events\nDesign status: Draft\nCanonical: Yes, after review\nOwner: Host invocation\nLast reviewed: 2026-09-18\nRelated:\n- docs/platform/host-invocation-routing/architecture/invocation-kernel.md\n- docs/platform/host-invocation-routing/architecture/provider-routing.md\nImplementation: Current partial\nProvenance: Promoted from docs/architect/host-invocation-routing/host-invocation-provider-routing.md\nWriter type: Original writer attribution not recorded; retained source provenance\nCanonical for: Candidate scope: Define provider descriptors, provider invocation, control, and events; authority follows transitional switchboard\nUse this when: Define provider descriptors, provider invocation, control, and events\nDo not use this for: Authority beyond the declared scope or implementation truth without the cited verification\nSupersedes: None; legacy sources remain in place during migration\nSuperseded by: None recorded\n```\n",
  "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db"
}
```

## Entry d-017: docs/platform/host-invocation-routing/contracts/operation-request-outcome.md

```json
{
  "path": "docs/platform/host-invocation-routing/contracts/operation-request-outcome.md",
  "beforeSHA256": "575948d31413753f0172ef6d3ac7aea2ceeb0334211cec34f7ed1cc13ed39482",
  "afterSHA256": "2003bd2174606dc1b644eccdcaa7ed2716c0ae4124cdcaea2966a3d58cba9b39",
  "headerFieldsAdded": {
    "Implementation": "Current partial",
    "Provenance": "Promoted from docs/architect/host-invocation-routing/host-invocation-provider-routing.md",
    "Writer type": "Original writer attribution not recorded; retained source provenance",
    "Canonical for": "Candidate scope: Define HostInvocation, OperationRequest, ContractRef, ProviderOutcome, ProviderError, and lifecycle outcomes; authority follows transitional switchboard",
    "Use this when": "Define HostInvocation, OperationRequest, ContractRef, ProviderOutcome, ProviderError, and lifecycle outcomes",
    "Do not use this for": "Authority beyond the declared scope or implementation truth without the cited verification",
    "Supersedes": "None; legacy sources remain in place during migration",
    "Superseded by": "None recorded"
  },
  "bodySHA256": "e3b77029d874dfc8640bd7b24a943f8528e10c863b47ea895633a4340559bc3c",
  "bodyUnchangedAtHeaderPass": true,
  "basis": {
    "Purpose": "Define HostInvocation, OperationRequest, ContractRef, ProviderOutcome, ProviderError, and lifecycle outcomes",
    "Implementation status": "Current partial",
    "Source type": "Promoted from docs/architect/host-invocation-routing/host-invocation-provider-routing.md",
    "Last reviewed": "2026-09-18"
  },
  "reviewStatus": "pending",
  "finalContentCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
  "finalFileSHA256": "9e6ed36df5d3692236d99517f12c618bc9b7596e196c02ab1fea3c2a928d950f",
  "fullBefore": "# Contract: Operation Request And Outcome\n\n```txt\nDocument type: Contract\nAudience: Human reviewer, architect, maintainer, implementation agent\nPurpose: Define HostInvocation, OperationRequest, ContractRef, ProviderOutcome, ProviderError, and lifecycle outcomes\nDesign status: Draft\nImplementation status: Current partial\nCanonical: Yes, after review\nOwner: Host invocation\nSource type: Promoted from docs/architect/host-invocation-routing/host-invocation-provider-routing.md\nLast reviewed: 2026-09-18\nRelated:\n- docs/platform/host-invocation-routing/architecture/invocation-kernel.md\n- docs/platform/host-invocation-routing/contracts/component-protocol.md\n```\n",
  "fullAfter": "# Contract: Operation Request And Outcome\n\n```txt\nDocument type: Contract\nAudience: Human reviewer, architect, maintainer, implementation agent\nPurpose: Define HostInvocation, OperationRequest, ContractRef, ProviderOutcome, ProviderError, and lifecycle outcomes\nDesign status: Draft\nCanonical: Yes, after review\nOwner: Host invocation\nLast reviewed: 2026-09-18\nRelated:\n- docs/platform/host-invocation-routing/architecture/invocation-kernel.md\n- docs/platform/host-invocation-routing/contracts/component-protocol.md\nImplementation: Current partial\nProvenance: Promoted from docs/architect/host-invocation-routing/host-invocation-provider-routing.md\nWriter type: Original writer attribution not recorded; retained source provenance\nCanonical for: Candidate scope: Define HostInvocation, OperationRequest, ContractRef, ProviderOutcome, ProviderError, and lifecycle outcomes; authority follows transitional switchboard\nUse this when: Define HostInvocation, OperationRequest, ContractRef, ProviderOutcome, ProviderError, and lifecycle outcomes\nDo not use this for: Authority beyond the declared scope or implementation truth without the cited verification\nSupersedes: None; legacy sources remain in place during migration\nSuperseded by: None recorded\n```\n",
  "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db"
}
```

## Entry d-018: docs/platform/host-invocation-routing/intent-preservation-ledger.md

```json
{
  "path": "docs/platform/host-invocation-routing/intent-preservation-ledger.md",
  "beforeSHA256": "19ea939648aa05b4e97b82e87f2f894a3c6286e70c969e43d68d21c74f2170e8",
  "afterSHA256": "f0da24ad81d5ca3621a7788d1c7a15734e06ee929a7cc42943f0ae9167429115",
  "headerFieldsAdded": {
    "Implementation": "Active",
    "Provenance": "Migrated from docs/architect/host-invocation-routing/**",
    "Writer type": "Original writer attribution not recorded; retained source provenance",
    "Canonical for": "Candidate scope: Preserve host-invocation design and migration intent while documentation and implementation move in slices; authority follows transitional switchboard",
    "Use this when": "Preserve host-invocation design and migration intent while documentation and implementation move in slices",
    "Do not use this for": "Authority beyond the declared scope or implementation truth without the cited verification",
    "Supersedes": "None; legacy sources remain in place during migration",
    "Superseded by": "None recorded"
  },
  "bodySHA256": "65493b7a7ac23201cdf7bfcc5f9bdb6f809a3939501965ce38255b0838d77129",
  "bodyUnchangedAtHeaderPass": true,
  "basis": {
    "Purpose": "Preserve host-invocation design and migration intent while documentation and implementation move in slices",
    "Implementation status": "Active",
    "Source type": "Migrated from docs/architect/host-invocation-routing/**",
    "Last reviewed": "2026-09-14"
  },
  "reviewStatus": "pending",
  "finalContentCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
  "finalFileSHA256": "840ee2c54ee5eca11fdd61aea006db4887eeb4d308fbcae3de004253671e2735",
  "fullBefore": "# Host Invocation Intent Preservation Ledger\n\n```txt\nDocument type: Intent preservation ledger\nAudience: Human reviewer, architect, maintainer, implementation agent\nPurpose: Preserve host-invocation design and migration intent while documentation and implementation move in slices\nDesign status: Draft\nImplementation status: Active\nCanonical: Yes, after review\nOwner: Host invocation\nSource type: Migrated from docs/architect/host-invocation-routing/**\nLast reviewed: 2026-09-14\nRelated:\n- docs/platform/host-invocation-routing/vision.md\n- docs/platform/host-invocation-routing/spec.md\n- docs/platform/host-invocation-routing/verification/implementation-alignment.md\n- docs/platform/host-invocation-routing/history/source-inventory.md\n- docs/platform/host-invocation-routing/verification/source-preservation-audit.md\n- docs/platform/host-invocation-routing/decisions/README.md\n```\n\nAdded in candidate — checked route snapshot (2026-10-13): `packages/host-runtime/contracts/command-routes.json` has 75 selectors: 70 `legacy-cli` and five native (`convention`, `friction`, `gate-bypass`, `metrics`, `version`). This recount supersedes current-count wording; dated proof records remain historical.\n",
  "fullAfter": "# Host Invocation Intent Preservation Ledger\n\n```txt\nDocument type: Intent preservation ledger\nAudience: Human reviewer, architect, maintainer, implementation agent\nPurpose: Preserve host-invocation design and migration intent while documentation and implementation move in slices\nDesign status: Draft\nCanonical: Yes, after review\nOwner: Host invocation\nLast reviewed: 2026-09-14\nRelated:\n- docs/platform/host-invocation-routing/vision.md\n- docs/platform/host-invocation-routing/spec.md\n- docs/platform/host-invocation-routing/verification/implementation-alignment.md\n- docs/platform/host-invocation-routing/history/source-inventory.md\n- docs/platform/host-invocation-routing/verification/source-preservation-audit.md\n- docs/platform/host-invocation-routing/decisions/README.md\nImplementation: Active\nProvenance: Migrated from docs/architect/host-invocation-routing/**\nWriter type: Original writer attribution not recorded; retained source provenance\nCanonical for: Candidate scope: Preserve host-invocation design and migration intent while documentation and implementation move in slices; authority follows transitional switchboard\nUse this when: Preserve host-invocation design and migration intent while documentation and implementation move in slices\nDo not use this for: Authority beyond the declared scope or implementation truth without the cited verification\nSupersedes: None; legacy sources remain in place during migration\nSuperseded by: None recorded\n```\n\nAdded in candidate — checked route snapshot (2026-10-13): `packages/host-runtime/contracts/command-routes.json` has 75 selectors: 70 `legacy-cli` and five native (`convention`, `friction`, `gate-bypass`, `metrics`, `version`). This recount supersedes current-count wording; dated proof records remain historical.\n",
  "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db"
}
```

## Entry d-019: docs/platform/host-invocation-routing/spec.md

```json
{
  "path": "docs/platform/host-invocation-routing/spec.md",
  "beforeSHA256": "67e0d029b6f3317608f0ed6e7874216b01a5c880db351f0834bb163e1434799c",
  "afterSHA256": "04b3f4d0aa256eabd0f7fc8f3de8a1e5687a8b932164f1016babe9f39d6f3fb2",
  "headerFieldsAdded": {
    "Implementation": "R1/R2/R3 implemented preview plus partial route migration",
    "Provenance": "Promoted from docs/architect/host-invocation-routing/**",
    "Writer type": "Original writer attribution not recorded; retained source provenance",
    "Canonical for": "Candidate scope: State current and transition-state behavior for fgOS host invocation; authority follows transitional switchboard",
    "Use this when": "State current and transition-state behavior for fgOS host invocation",
    "Do not use this for": "Authority beyond the declared scope or implementation truth without the cited verification",
    "Supersedes": "None; legacy sources remain in place during migration",
    "Superseded by": "None recorded"
  },
  "bodySHA256": "e26a123940b8d47862a94274ae3517b27cc2bc49756edfe2217fba85c0704543",
  "bodyUnchangedAtHeaderPass": true,
  "basis": {
    "Purpose": "State current and transition-state behavior for fgOS host invocation",
    "Implementation status": "R1/R2/R3 implemented preview plus partial route migration",
    "Source type": "Promoted from docs/architect/host-invocation-routing/**",
    "Last reviewed": "2026-09-18"
  },
  "reviewStatus": "pending",
  "finalContentCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
  "finalFileSHA256": "7aaaa030b242b19a0bd4f0f9a8faac74d50b8b6a86c7817a73e7bc2f1848243f",
  "fullBefore": "# Spec: Host Invocation\n\n```txt\nDocument type: Area spec\nAudience: Human reviewer, architect, maintainer, implementation agent\nPurpose: State current and transition-state behavior for fgOS host invocation\nDesign status: Draft\nImplementation status: R1/R2/R3 implemented preview plus partial route migration\nCanonical: Yes, after review\nOwner: Host invocation\nSource type: Promoted from docs/architect/host-invocation-routing/**\nLast reviewed: 2026-09-18\nRelated:\n- docs/platform/host-invocation-routing/README.md\n- docs/platform/host-invocation-routing/intent-preservation-ledger.md\n- docs/platform/host-invocation-routing/verification/implementation-alignment.md\n```\n\nAdded in candidate — checked route snapshot (2026-10-13): `packages/host-runtime/contracts/command-routes.json` has 75 selectors: 70 `legacy-cli` and five native (`convention`, `friction`, `gate-bypass`, `metrics`, `version`). This recount supersedes current-count wording; dated proof records remain historical.\n",
  "fullAfter": "# Spec: Host Invocation\n\n```txt\nDocument type: Area spec\nAudience: Human reviewer, architect, maintainer, implementation agent\nPurpose: State current and transition-state behavior for fgOS host invocation\nDesign status: Draft\nCanonical: Yes, after review\nOwner: Host invocation\nLast reviewed: 2026-09-18\nRelated:\n- docs/platform/host-invocation-routing/README.md\n- docs/platform/host-invocation-routing/intent-preservation-ledger.md\n- docs/platform/host-invocation-routing/verification/implementation-alignment.md\nImplementation: R1/R2/R3 implemented preview plus partial route migration\nProvenance: Promoted from docs/architect/host-invocation-routing/**\nWriter type: Original writer attribution not recorded; retained source provenance\nCanonical for: Candidate scope: State current and transition-state behavior for fgOS host invocation; authority follows transitional switchboard\nUse this when: State current and transition-state behavior for fgOS host invocation\nDo not use this for: Authority beyond the declared scope or implementation truth without the cited verification\nSupersedes: None; legacy sources remain in place during migration\nSuperseded by: None recorded\n```\n\nAdded in candidate — checked route snapshot (2026-10-13): `packages/host-runtime/contracts/command-routes.json` has 75 selectors: 70 `legacy-cli` and five native (`convention`, `friction`, `gate-bypass`, `metrics`, `version`). This recount supersedes current-count wording; dated proof records remain historical.\n",
  "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db"
}
```

## Entry d-020: docs/platform/host-invocation-routing/verification/compatibility-harness.md

```json
{
  "path": "docs/platform/host-invocation-routing/verification/compatibility-harness.md",
  "beforeSHA256": "57e693d8130de7d32af879f65ed17e53c38ad1f5219dddc802ba25f9262c49bc",
  "afterSHA256": "a0b30d7a8f45adba76b1005f3fdf318d87efb1b1fcc134402070716a2c6b068a",
  "headerFieldsAdded": {
    "Implementation": "Current harness plus R2/R3 preview extensions",
    "Provenance": "Promoted from docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md",
    "Writer type": "Original writer attribution not recorded; retained source provenance",
    "Canonical for": "Candidate scope: Preserve the planned Node/Rust compatibility harness requirements; authority follows transitional switchboard",
    "Use this when": "Preserve the planned Node/Rust compatibility harness requirements",
    "Do not use this for": "Authority beyond the declared scope or implementation truth without the cited verification",
    "Supersedes": "None; legacy sources remain in place during migration",
    "Superseded by": "None recorded"
  },
  "bodySHA256": "6b498df39f0bece15a9ecb9ead5757b0d79bc41a385ed0e0c05258b3f070987b",
  "bodyUnchangedAtHeaderPass": true,
  "basis": {
    "Purpose": "Preserve the planned Node/Rust compatibility harness requirements",
    "Implementation status": "Current harness plus R2/R3 preview extensions",
    "Source type": "Promoted from docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md",
    "Last reviewed": "2026-09-18"
  },
  "reviewStatus": "pending",
  "finalContentCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
  "finalFileSHA256": "3ad35ed17bef6906c256494a1881218408d52ed5eec2fda561014d7dd4a9f602",
  "fullBefore": "# Verification: Compatibility Harness\n\n```txt\nDocument type: Verification\nAudience: Human reviewer, architect, maintainer, implementation agent\nPurpose: Preserve the planned Node/Rust compatibility harness requirements\nDesign status: Draft\nImplementation status: Current harness plus R2/R3 preview extensions\nCanonical: Yes, after review\nOwner: Host invocation\nSource type: Promoted from docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md\nLast reviewed: 2026-09-18\nRelated:\n- docs/platform/host-invocation-routing/contracts/command-route-descriptor.md\n- docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md\n```\n",
  "fullAfter": "# Verification: Compatibility Harness\n\n```txt\nDocument type: Verification\nAudience: Human reviewer, architect, maintainer, implementation agent\nPurpose: Preserve the planned Node/Rust compatibility harness requirements\nDesign status: Draft\nCanonical: Yes, after review\nOwner: Host invocation\nLast reviewed: 2026-09-18\nRelated:\n- docs/platform/host-invocation-routing/contracts/command-route-descriptor.md\n- docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md\nImplementation: Current harness plus R2/R3 preview extensions\nProvenance: Promoted from docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md\nWriter type: Original writer attribution not recorded; retained source provenance\nCanonical for: Candidate scope: Preserve the planned Node/Rust compatibility harness requirements; authority follows transitional switchboard\nUse this when: Preserve the planned Node/Rust compatibility harness requirements\nDo not use this for: Authority beyond the declared scope or implementation truth without the cited verification\nSupersedes: None; legacy sources remain in place during migration\nSuperseded by: None recorded\n```\n",
  "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db"
}
```

## Entry d-021: docs/platform/host-invocation-routing/verification/implementation-alignment.md

```json
{
  "path": "docs/platform/host-invocation-routing/verification/implementation-alignment.md",
  "beforeSHA256": "59a4ee0383c26af63e9430b8440bd8c22a81a1de0dfc32efb7ba82dc8d9689e7",
  "afterSHA256": "569dad62ce174f21ce9207ffe06a9cc7c7211dc650513420d9e2581190607d13",
  "headerFieldsAdded": {
    "Implementation": "Preview installed/default proof plus current route-migration and R3 remote peer implemented preview snapshot",
    "Provenance": "Created from documentation migration scan plus 2026-09-14 code scan of Rust host/runtime paths",
    "Writer type": "Original writer attribution not recorded; retained source provenance",
    "Canonical for": "Candidate scope: Track implementation status for host-invocation design claims; authority follows transitional switchboard",
    "Use this when": "Track implementation status for host-invocation design claims",
    "Do not use this for": "Authority beyond the declared scope or implementation truth without the cited verification",
    "Supersedes": "None; legacy sources remain in place during migration",
    "Superseded by": "None recorded"
  },
  "bodySHA256": "566b1976d97255965323adf29e8861a11b006ad991b62d32fbf0a13ee19b51c3",
  "bodyUnchangedAtHeaderPass": true,
  "basis": {
    "Purpose": "Track implementation status for host-invocation design claims",
    "Implementation status": "Preview installed/default proof plus current route-migration and R3 remote peer implemented preview snapshot",
    "Source type": "Created from documentation migration scan plus 2026-09-14 code scan of Rust host/runtime paths",
    "Last reviewed": "2026-09-18"
  },
  "reviewStatus": "pending",
  "finalContentCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
  "finalFileSHA256": "c3f31468ab486cf548fdd942ceb5fb0743a2abf476fb3820784a6f62c8b1a448",
  "fullBefore": "# Verification: Implementation Alignment\n\n```txt\nDocument type: Verification\nAudience: Human reviewer, architect, maintainer, implementation agent\nPurpose: Track implementation status for host-invocation design claims\nDesign status: Draft\nImplementation status: Preview installed/default proof plus current route-migration and R3 remote peer implemented preview snapshot\nCanonical: Yes, after review\nOwner: Host invocation\nSource type: Created from documentation migration scan plus 2026-09-14 code scan of Rust host/runtime paths\nLast reviewed: 2026-09-18\nRelated:\n- docs/platform/host-invocation-routing/README.md\n- docs/platform/host-invocation-routing/spec.md\n- docs/platform/host-invocation-routing/intent-preservation-ledger.md\n```\n\nAdded in candidate — checked route snapshot (2026-10-13): `packages/host-runtime/contracts/command-routes.json` has 75 selectors: 70 `legacy-cli` and five native (`convention`, `friction`, `gate-bypass`, `metrics`, `version`). This recount supersedes current-count wording; dated proof records remain historical.\n",
  "fullAfter": "# Verification: Implementation Alignment\n\n```txt\nDocument type: Verification\nAudience: Human reviewer, architect, maintainer, implementation agent\nPurpose: Track implementation status for host-invocation design claims\nDesign status: Draft\nCanonical: Yes, after review\nOwner: Host invocation\nLast reviewed: 2026-09-18\nRelated:\n- docs/platform/host-invocation-routing/README.md\n- docs/platform/host-invocation-routing/spec.md\n- docs/platform/host-invocation-routing/intent-preservation-ledger.md\nImplementation: Preview installed/default proof plus current route-migration and R3 remote peer implemented preview snapshot\nProvenance: Created from documentation migration scan plus 2026-09-14 code scan of Rust host/runtime paths\nWriter type: Original writer attribution not recorded; retained source provenance\nCanonical for: Candidate scope: Track implementation status for host-invocation design claims; authority follows transitional switchboard\nUse this when: Track implementation status for host-invocation design claims\nDo not use this for: Authority beyond the declared scope or implementation truth without the cited verification\nSupersedes: None; legacy sources remain in place during migration\nSuperseded by: None recorded\n```\n\nAdded in candidate — checked route snapshot (2026-10-13): `packages/host-runtime/contracts/command-routes.json` has 75 selectors: 70 `legacy-cli` and five native (`convention`, `friction`, `gate-bypass`, `metrics`, `version`). This recount supersedes current-count wording; dated proof records remain historical.\n",
  "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db"
}
```

## Entry d-022: docs/platform/host-invocation-routing/verification/r1-rust-host-proof.md

```json
{
  "path": "docs/platform/host-invocation-routing/verification/r1-rust-host-proof.md",
  "beforeSHA256": "d97afecf2a64681f02aa9fd715f459dae4ea688aa39c0f22d044ac37501c472a",
  "afterSHA256": "d19bcd12bf14ef8e8bfe025428255b561f5eb45b2f9258a5371b19c89efd234a",
  "headerFieldsAdded": {
    "Implementation": "Published preview installed/default proof plus open stable graduation",
    "Provenance": "Promoted from docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md",
    "Writer type": "Original writer attribution not recorded; retained source provenance",
    "Canonical for": "Candidate scope: Preserve the proof gate for the distributable Rust CLI host; authority follows transitional switchboard",
    "Use this when": "Preserve the proof gate for the distributable Rust CLI host",
    "Do not use this for": "Authority beyond the declared scope or implementation truth without the cited verification",
    "Supersedes": "None; legacy sources remain in place during migration",
    "Superseded by": "None recorded"
  },
  "bodySHA256": "a16fe891b735c510fa6ebaada7e09a61c9eb8acf60b4b04287249306be7ec811",
  "bodyUnchangedAtHeaderPass": true,
  "basis": {
    "Purpose": "Preserve the proof gate for the distributable Rust CLI host",
    "Implementation status": "Published preview installed/default proof plus open stable graduation",
    "Source type": "Promoted from docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md",
    "Last reviewed": "2026-09-21"
  },
  "reviewStatus": "pending",
  "finalContentCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
  "finalFileSHA256": "157d141e16ac31a0789e210d34f03640d55e93670466a62140ced11bce71354a",
  "fullBefore": "# Verification: R1 Rust Host Proof\n\n```txt\nDocument type: Verification\nAudience: Human reviewer, architect, maintainer, implementation agent\nPurpose: Preserve the proof gate for the distributable Rust CLI host\nDesign status: Draft\nImplementation status: Published preview installed/default proof plus open stable graduation\nCanonical: Yes, after review\nOwner: Host invocation\nSource type: Promoted from docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md\nLast reviewed: 2026-09-21\nRelated:\n- docs/platform/host-invocation-routing/architecture/release-boundaries.md\n- docs/platform/host-invocation-routing/verification/compatibility-harness.md\n```\n\nAdded in candidate — checked route snapshot (2026-10-13): `packages/host-runtime/contracts/command-routes.json` has 75 selectors: 70 `legacy-cli` and five native (`convention`, `friction`, `gate-bypass`, `metrics`, `version`). This recount supersedes current-count wording; dated proof records remain historical.\n",
  "fullAfter": "# Verification: R1 Rust Host Proof\n\n```txt\nDocument type: Verification\nAudience: Human reviewer, architect, maintainer, implementation agent\nPurpose: Preserve the proof gate for the distributable Rust CLI host\nDesign status: Draft\nCanonical: Yes, after review\nOwner: Host invocation\nLast reviewed: 2026-09-21\nRelated:\n- docs/platform/host-invocation-routing/architecture/release-boundaries.md\n- docs/platform/host-invocation-routing/verification/compatibility-harness.md\nImplementation: Published preview installed/default proof plus open stable graduation\nProvenance: Promoted from docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md\nWriter type: Original writer attribution not recorded; retained source provenance\nCanonical for: Candidate scope: Preserve the proof gate for the distributable Rust CLI host; authority follows transitional switchboard\nUse this when: Preserve the proof gate for the distributable Rust CLI host\nDo not use this for: Authority beyond the declared scope or implementation truth without the cited verification\nSupersedes: None; legacy sources remain in place during migration\nSuperseded by: None recorded\n```\n\nAdded in candidate — checked route snapshot (2026-10-13): `packages/host-runtime/contracts/command-routes.json` has 75 selectors: 70 `legacy-cli` and five native (`convention`, `friction`, `gate-bypass`, `metrics`, `version`). This recount supersedes current-count wording; dated proof records remain historical.\n",
  "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db"
}
```

## Entry d-023: docs/platform/host-invocation-routing/verification/r2-external-process-proof.md

```json
{
  "path": "docs/platform/host-invocation-routing/verification/r2-external-process-proof.md",
  "beforeSHA256": "cf866186d80f2b9c8bbb5b35a83cf14d70bde9bdda8c8627a03d0e6fb199fe1f",
  "afterSHA256": "cd03753f4bb478d7b1ce4e9dc2abd98bdbcf77ca9aa163f6944973d9ad629832",
  "headerFieldsAdded": {
    "Implementation": "Implemented preview (R2-P0 through R2-P5 closed 2026-09-15; R3, marketplace, signatures, and production WASM remain future work)",
    "Provenance": "Promoted from docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md",
    "Writer type": "Original writer attribution not recorded; retained source provenance",
    "Canonical for": "Candidate scope: Preserve the proof gate for external process provider preview; authority follows transitional switchboard",
    "Use this when": "Preserve the proof gate for external process provider preview",
    "Do not use this for": "Authority beyond the declared scope or implementation truth without the cited verification",
    "Supersedes": "None; legacy sources remain in place during migration",
    "Superseded by": "None recorded"
  },
  "bodySHA256": "aac186bb87eacbbcd0a1adce8e60ecada3f653de249cce0e0cdd452b0f64d195",
  "bodyUnchangedAtHeaderPass": true,
  "basis": {
    "Purpose": "Preserve the proof gate for external process provider preview",
    "Implementation status": "Implemented preview (R2-P0 through R2-P5 closed 2026-09-15; R3, marketplace, signatures, and production WASM remain future work)",
    "Source type": "Promoted from docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md",
    "Last reviewed": "2026-09-15"
  },
  "reviewStatus": "pending",
  "finalContentCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
  "finalFileSHA256": "39d6decae3821643eb265c643c3a8115af0c8d4e3ad613c43dacaef9606872fe",
  "fullBefore": "# Verification: R2 External Process Proof\n\n```txt\nDocument type: Verification\nAudience: Human reviewer, architect, maintainer, implementation agent\nPurpose: Preserve the proof gate for external process provider preview\nDesign status: Draft\nImplementation status: Implemented preview (R2-P0 through R2-P5 closed 2026-09-15; R3, marketplace, signatures, and production WASM remain future work)\nCanonical: Yes, after review\nOwner: Host invocation\nSource type: Promoted from docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md\nLast reviewed: 2026-09-15\nRelated:\n- docs/platform/host-invocation-routing/contracts/component-protocol.md\n- docs/platform/host-invocation-routing/contracts/external-provider-manifest.md\n```\n\nAdded in candidate — checked route snapshot (2026-10-13): `packages/host-runtime/contracts/command-routes.json` has 75 selectors: 70 `legacy-cli` and five native (`convention`, `friction`, `gate-bypass`, `metrics`, `version`). This recount supersedes current-count wording; dated proof records remain historical.\n",
  "fullAfter": "# Verification: R2 External Process Proof\n\n```txt\nDocument type: Verification\nAudience: Human reviewer, architect, maintainer, implementation agent\nPurpose: Preserve the proof gate for external process provider preview\nDesign status: Draft\nCanonical: Yes, after review\nOwner: Host invocation\nLast reviewed: 2026-09-15\nRelated:\n- docs/platform/host-invocation-routing/contracts/component-protocol.md\n- docs/platform/host-invocation-routing/contracts/external-provider-manifest.md\nImplementation: Implemented preview (R2-P0 through R2-P5 closed 2026-09-15; R3, marketplace, signatures, and production WASM remain future work)\nProvenance: Promoted from docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md\nWriter type: Original writer attribution not recorded; retained source provenance\nCanonical for: Candidate scope: Preserve the proof gate for external process provider preview; authority follows transitional switchboard\nUse this when: Preserve the proof gate for external process provider preview\nDo not use this for: Authority beyond the declared scope or implementation truth without the cited verification\nSupersedes: None; legacy sources remain in place during migration\nSuperseded by: None recorded\n```\n\nAdded in candidate — checked route snapshot (2026-10-13): `packages/host-runtime/contracts/command-routes.json` has 75 selectors: 70 `legacy-cli` and five native (`convention`, `friction`, `gate-bypass`, `metrics`, `version`). This recount supersedes current-count wording; dated proof records remain historical.\n",
  "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db"
}
```

## Entry d-024: docs/platform/host-invocation-routing/verification/r3-remote-peer-proof.md

```json
{
  "path": "docs/platform/host-invocation-routing/verification/r3-remote-peer-proof.md",
  "beforeSHA256": "a082d00c31d0301643ffd1ae3880e058cbcdd99fa169ef8525309faa7f5d6d3f",
  "afterSHA256": "a26956b7b4545a91f1923fa8cb78b13d5b5de055684e0bf2effa4a3b11d01f18",
  "headerFieldsAdded": {
    "Implementation": "Implemented preview (R3-P0 frozen; R3-P1 adapter implemented preview; R3-P2/P3 route and proof closed; R3-P4 inventory recorded)",
    "Provenance": "Promoted from docs/architect/host-invocation-routing/node-to-rust-component-migration.md and rust-cli-and-proof-components-plan.md",
    "Writer type": "Original writer attribution not recorded; retained source provenance",
    "Canonical for": "Candidate scope: Preserve the proof gate for production remote peer adoption; authority follows transitional switchboard",
    "Use this when": "Preserve the proof gate for production remote peer adoption",
    "Do not use this for": "Authority beyond the declared scope or implementation truth without the cited verification",
    "Supersedes": "None; legacy sources remain in place during migration",
    "Superseded by": "None recorded"
  },
  "bodySHA256": "74c576579ee2522a2ca476345c047e9492de0dcf79b15ad0ad3c63009b6e7c45",
  "bodyUnchangedAtHeaderPass": true,
  "basis": {
    "Purpose": "Preserve the proof gate for production remote peer adoption",
    "Implementation status": "Implemented preview (R3-P0 frozen; R3-P1 adapter implemented preview; R3-P2/P3 route and proof closed; R3-P4 inventory recorded)",
    "Source type": "Promoted from docs/architect/host-invocation-routing/node-to-rust-component-migration.md and rust-cli-and-proof-components-plan.md",
    "Last reviewed": "2026-09-18"
  },
  "reviewStatus": "pending",
  "finalContentCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
  "finalFileSHA256": "500d9375f407f1f77b61f3b58c10451f6732194024d6ee07e2de807e57371acf",
  "fullBefore": "# Verification: R3 Remote Peer Proof\n\n```txt\nDocument type: Verification\nAudience: Human reviewer, architect, maintainer, implementation agent\nPurpose: Preserve the proof gate for production remote peer adoption\nDesign status: Draft\nImplementation status: Implemented preview (R3-P0 frozen; R3-P1 adapter implemented preview; R3-P2/P3 route and proof closed; R3-P4 inventory recorded)\nCanonical: Yes, after review\nOwner: Host invocation\nSource type: Promoted from docs/architect/host-invocation-routing/node-to-rust-component-migration.md and rust-cli-and-proof-components-plan.md\nLast reviewed: 2026-09-18\nRelated:\n- docs/platform/host-invocation-routing/architecture/host-use-cases.md\n- docs/platform/host-invocation-routing/architecture/release-boundaries.md\n```\n",
  "fullAfter": "# Verification: R3 Remote Peer Proof\n\n```txt\nDocument type: Verification\nAudience: Human reviewer, architect, maintainer, implementation agent\nPurpose: Preserve the proof gate for production remote peer adoption\nDesign status: Draft\nCanonical: Yes, after review\nOwner: Host invocation\nLast reviewed: 2026-09-18\nRelated:\n- docs/platform/host-invocation-routing/architecture/host-use-cases.md\n- docs/platform/host-invocation-routing/architecture/release-boundaries.md\nImplementation: Implemented preview (R3-P0 frozen; R3-P1 adapter implemented preview; R3-P2/P3 route and proof closed; R3-P4 inventory recorded)\nProvenance: Promoted from docs/architect/host-invocation-routing/node-to-rust-component-migration.md and rust-cli-and-proof-components-plan.md\nWriter type: Original writer attribution not recorded; retained source provenance\nCanonical for: Candidate scope: Preserve the proof gate for production remote peer adoption; authority follows transitional switchboard\nUse this when: Preserve the proof gate for production remote peer adoption\nDo not use this for: Authority beyond the declared scope or implementation truth without the cited verification\nSupersedes: None; legacy sources remain in place during migration\nSuperseded by: None recorded\n```\n",
  "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db"
}
```

## Entry d-025: docs/platform/host-invocation-routing/verification/source-preservation-audit.md

```json
{
  "path": "docs/platform/host-invocation-routing/verification/source-preservation-audit.md",
  "beforeSHA256": "48161a13b8b7bb6547a2014aa411aab00fca5ec9acfa0c60d8f1cf207683ffef",
  "afterSHA256": "273ba39d0c76c9f3cfb25b1e8af07288a82bc7750d866a954a434417f97f52c7",
  "headerFieldsAdded": {
    "Implementation": "Historical migration snapshot plus R2/R3 status deltas",
    "Provenance": "Audit over docs/architect/host-invocation-routing/** and docs/platform/host-invocation-routing/**",
    "Writer type": "Original writer attribution not recorded; retained source provenance",
    "Canonical for": "Candidate scope: Prove that old host-invocation source details were classified and preserved during migration; authority follows transitional switchboard",
    "Use this when": "Prove that old host-invocation source details were classified and preserved during migration",
    "Do not use this for": "Authority beyond the declared scope or implementation truth without the cited verification",
    "Supersedes": "None; legacy sources remain in place during migration",
    "Superseded by": "None recorded"
  },
  "bodySHA256": "e92260777c306bc8d81c6c37c9534e3045659fd4ff2f5830619d57ddaf8f37a9",
  "bodyUnchangedAtHeaderPass": true,
  "basis": {
    "Purpose": "Prove that old host-invocation source details were classified and preserved during migration",
    "Implementation status": "Historical migration snapshot plus R2/R3 status deltas",
    "Source type": "Audit over docs/architect/host-invocation-routing/** and docs/platform/host-invocation-routing/**",
    "Last reviewed": "2026-09-18"
  },
  "reviewStatus": "pending",
  "finalContentCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
  "finalFileSHA256": "dcbc8699b3cb7e1e1115e8188f2a75a13544e4f7af127313fa2466d54893f251",
  "fullBefore": "# Host Invocation Source Preservation Audit\n\n```txt\nDocument type: Verification audit\nAudience: Human reviewer, architect, maintainer, documentation agent\nPurpose: Prove that old host-invocation source details were classified and preserved during migration\nDesign status: Draft\nImplementation status: Historical migration snapshot plus R2/R3 status deltas\nCanonical: Yes, after review\nOwner: Host invocation\nSource type: Audit over docs/architect/host-invocation-routing/** and docs/platform/host-invocation-routing/**\nLast reviewed: 2026-09-18\nRelated:\n- docs/platform/host-invocation-routing/intent-preservation-ledger.md\n- docs/platform/host-invocation-routing/history/source-inventory.md\n- docs/platform/host-invocation-routing/verification/implementation-alignment.md\n```\n\nAdded in candidate — checked route snapshot (2026-10-13): `packages/host-runtime/contracts/command-routes.json` has 75 selectors: 70 `legacy-cli` and five native (`convention`, `friction`, `gate-bypass`, `metrics`, `version`). This recount supersedes current-count wording; dated proof records remain historical.\n",
  "fullAfter": "# Host Invocation Source Preservation Audit\n\n```txt\nDocument type: Verification audit\nAudience: Human reviewer, architect, maintainer, documentation agent\nPurpose: Prove that old host-invocation source details were classified and preserved during migration\nDesign status: Draft\nCanonical: Yes, after review\nOwner: Host invocation\nLast reviewed: 2026-09-18\nRelated:\n- docs/platform/host-invocation-routing/intent-preservation-ledger.md\n- docs/platform/host-invocation-routing/history/source-inventory.md\n- docs/platform/host-invocation-routing/verification/implementation-alignment.md\nImplementation: Historical migration snapshot plus R2/R3 status deltas\nProvenance: Audit over docs/architect/host-invocation-routing/** and docs/platform/host-invocation-routing/**\nWriter type: Original writer attribution not recorded; retained source provenance\nCanonical for: Candidate scope: Prove that old host-invocation source details were classified and preserved during migration; authority follows transitional switchboard\nUse this when: Prove that old host-invocation source details were classified and preserved during migration\nDo not use this for: Authority beyond the declared scope or implementation truth without the cited verification\nSupersedes: None; legacy sources remain in place during migration\nSuperseded by: None recorded\n```\n\nAdded in candidate — checked route snapshot (2026-10-13): `packages/host-runtime/contracts/command-routes.json` has 75 selectors: 70 `legacy-cli` and five native (`convention`, `friction`, `gate-bypass`, `metrics`, `version`). This recount supersedes current-count wording; dated proof records remain historical.\n",
  "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db"
}
```

## Entry d-026: docs/platform/host-invocation-routing/vision.md

```json
{
  "path": "docs/platform/host-invocation-routing/vision.md",
  "beforeSHA256": "0e3950d4d0ce937e43007b365f8a978780f4b97dafad3f5bd97071349380f04a",
  "afterSHA256": "1eb3ccd0446f2d65f21de2e146ffca7d80d8a37bd5dedba79243d21a11f7b17c",
  "headerFieldsAdded": {
    "Implementation": "Partial",
    "Provenance": "Promoted from docs/architect/host-invocation-routing/host-invocation-provider-routing.md and node-to-rust-component-migration.md",
    "Writer type": "Original writer attribution not recorded; retained source provenance",
    "Canonical for": "Candidate scope: Preserve the durable direction for fgOS host invocation and provider routing; authority follows transitional switchboard",
    "Use this when": "Preserve the durable direction for fgOS host invocation and provider routing",
    "Do not use this for": "Authority beyond the declared scope or implementation truth without the cited verification",
    "Supersedes": "None; legacy sources remain in place during migration",
    "Superseded by": "None recorded"
  },
  "bodySHA256": "c90198b01bde36f4624ab5705e7ea92819c3000635ea9093eb43ca93ab7240f0",
  "bodyUnchangedAtHeaderPass": true,
  "basis": {
    "Purpose": "Preserve the durable direction for fgOS host invocation and provider routing",
    "Implementation status": "Partial",
    "Source type": "Promoted from docs/architect/host-invocation-routing/host-invocation-provider-routing.md and node-to-rust-component-migration.md",
    "Last reviewed": "2026-09-14"
  },
  "reviewStatus": "pending",
  "finalContentCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
  "finalFileSHA256": "7ca768c79e83e84a41bd36200ba92e9996e3e96ffaa20e6ae3a197c2f1ac977d",
  "fullBefore": "# Host Invocation Vision\n\n```txt\nDocument type: Vision\nAudience: Human reviewer, architect, maintainer, implementation agent\nPurpose: Preserve the durable direction for fgOS host invocation and provider routing\nDesign status: Draft\nImplementation status: Partial\nCanonical: Yes, after review\nOwner: Platform documentation\nSource type: Promoted from docs/architect/host-invocation-routing/host-invocation-provider-routing.md and node-to-rust-component-migration.md\nLast reviewed: 2026-09-14\nRelated:\n- docs/platform/host-invocation-routing/README.md\n- docs/platform/host-invocation-routing/intent-preservation-ledger.md\n- docs/platform/host-invocation-routing/spec.md\n- docs/platform/host-invocation-routing/architecture/invocation-kernel.md\n```\n",
  "fullAfter": "# Host Invocation Vision\n\n```txt\nDocument type: Vision\nAudience: Human reviewer, architect, maintainer, implementation agent\nPurpose: Preserve the durable direction for fgOS host invocation and provider routing\nDesign status: Draft\nCanonical: Yes, after review\nOwner: Platform documentation\nLast reviewed: 2026-09-14\nRelated:\n- docs/platform/host-invocation-routing/README.md\n- docs/platform/host-invocation-routing/intent-preservation-ledger.md\n- docs/platform/host-invocation-routing/spec.md\n- docs/platform/host-invocation-routing/architecture/invocation-kernel.md\nImplementation: Partial\nProvenance: Promoted from docs/architect/host-invocation-routing/host-invocation-provider-routing.md and node-to-rust-component-migration.md\nWriter type: Original writer attribution not recorded; retained source provenance\nCanonical for: Candidate scope: Preserve the durable direction for fgOS host invocation and provider routing; authority follows transitional switchboard\nUse this when: Preserve the durable direction for fgOS host invocation and provider routing\nDo not use this for: Authority beyond the declared scope or implementation truth without the cited verification\nSupersedes: None; legacy sources remain in place during migration\nSuperseded by: None recorded\n```\n",
  "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db"
}
```

## Entry d-027: docs/platform/intent-preservation-ledger.md

```json
{
  "path": "docs/platform/intent-preservation-ledger.md",
  "beforeSHA256": "1a714ec716759f8aedf62e3bcdf24c15b6d0586769b7e665189c5a612636fca7",
  "afterSHA256": "15bf765681039496cd6a2fcfe1941d10989cea1f39770dbd32b54f193c222a12",
  "headerFieldsAdded": {
    "Implementation": "Partial",
    "Provenance": "Promoted from documentation-system discussion and existing area ledgers",
    "Writer type": "Original writer attribution not recorded; retained source provenance",
    "Canonical for": "Candidate scope: Preserve full platform intent across simplified implementation slices; authority follows transitional switchboard",
    "Use this when": "Preserve full platform intent across simplified implementation slices",
    "Do not use this for": "Authority beyond the declared scope or implementation truth without the cited verification",
    "Supersedes": "None; legacy sources remain in place during migration",
    "Superseded by": "None recorded"
  },
  "bodySHA256": "453950c264f9eb1266a55a29bf2ce0b729872a5a163f445e92e6f4b114944f6c",
  "bodyUnchangedAtHeaderPass": true,
  "basis": {
    "Purpose": "Preserve full platform intent across simplified implementation slices",
    "Implementation status": "Partial",
    "Source type": "Promoted from documentation-system discussion and existing area ledgers",
    "Last reviewed": "2026-09-25"
  },
  "reviewStatus": "pending",
  "finalContentCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
  "finalFileSHA256": "e5ad0a0575c903a523bfec990e1801c7eddedaf68376dc350f20fdc57fbf28e9",
  "fullBefore": "# Platform Intent Preservation Ledger\n\n```txt\nDocument type: Intent preservation ledger\nAudience: Human reviewer, architect, maintainer, agent\nPurpose: Preserve full platform intent across simplified implementation slices\nDesign status: Draft\nImplementation status: Partial\nCanonical: Proposed preservation surface; requires explicit acceptance\nOwner: Platform documentation\nSource type: Promoted from documentation-system discussion and existing area ledgers\nLast reviewed: 2026-09-25\nRelated:\n- docs/platform/vision.md\n- docs/platform/platform-foundations.md\n- docs/platform/component-boundary.md\n- docs/doc-governance.md\n```\n",
  "fullAfter": "# Platform Intent Preservation Ledger\n\n```txt\nDocument type: Intent preservation ledger\nAudience: Human reviewer, architect, maintainer, agent\nPurpose: Preserve full platform intent across simplified implementation slices\nDesign status: Draft\nCanonical: Proposed preservation surface; requires explicit acceptance\nOwner: Platform documentation\nLast reviewed: 2026-09-25\nRelated:\n- docs/platform/vision.md\n- docs/platform/platform-foundations.md\n- docs/platform/component-boundary.md\n- docs/doc-governance.md\nImplementation: Partial\nProvenance: Promoted from documentation-system discussion and existing area ledgers\nWriter type: Original writer attribution not recorded; retained source provenance\nCanonical for: Candidate scope: Preserve full platform intent across simplified implementation slices; authority follows transitional switchboard\nUse this when: Preserve full platform intent across simplified implementation slices\nDo not use this for: Authority beyond the declared scope or implementation truth without the cited verification\nSupersedes: None; legacy sources remain in place during migration\nSuperseded by: None recorded\n```\n",
  "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db"
}
```

## Entry d-028: docs/platform/work-state/architecture/implementation-pointers.md

```json
{
  "path": "docs/platform/work-state/architecture/implementation-pointers.md",
  "beforeSHA256": "75e105a5e11e3f4dfdb1d1dfbd2c0cafcf8d6289a2d65f1cc0e7a0656267cab7",
  "afterSHA256": "5b8b4d25f4b5526f3228d36433d426eb99f5ba5717e427207bac17b65f9bd244",
  "headerFieldsAdded": {
    "Implementation": "Carried source material; current implementation truth unverified",
    "Provenance": "Retained work-state candidate carriage from docs/specs/work-state.md; existing Related references retained",
    "Writer type": "Original writer attribution not recorded; retained source provenance",
    "Canonical for": "Candidate scope: Module-to-responsibility pointers for the work state engine implementation; authority follows transitional switchboard",
    "Use this when": "Module-to-responsibility pointers for the work state engine implementation",
    "Do not use this for": "Authority beyond the declared scope or implementation truth without the cited verification",
    "Supersedes": "None; legacy sources remain in place during migration",
    "Superseded by": "None recorded"
  },
  "bodySHA256": "2f47ec8453f9d8be87518fa37e180d3e6be5ba00b7f2223599a8cdc3274c6753",
  "bodyUnchangedAtHeaderPass": true,
  "basis": {
    "Purpose": "Module-to-responsibility pointers for the work state engine implementation.",
    "Last reviewed": "2026-10-06"
  },
  "reviewStatus": "pending",
  "finalContentCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
  "finalFileSHA256": "5b8b4d25f4b5526f3228d36433d426eb99f5ba5717e427207bac17b65f9bd244",
  "fullBefore": "# Work State Implementation Pointers\n\n```txt\nDocument type: Architecture\nAudience: Human reviewer, architect, maintainer, implementation agent\nPurpose: Module-to-responsibility pointers for the work state engine implementation.\nDesign status: Candidate\nLast reviewed: 2026-10-06\nRelated:\n- docs/platform/work-state/README.md\n- docs/platform/work-state/spec.md\n- docs/specs/work-state.md\n```\n",
  "fullAfter": "# Work State Implementation Pointers\n\n```txt\nDocument type: Architecture\nAudience: Human reviewer, architect, maintainer, implementation agent\nPurpose: Module-to-responsibility pointers for the work state engine implementation.\nDesign status: Candidate\nLast reviewed: 2026-10-06\nRelated:\n- docs/platform/work-state/README.md\n- docs/platform/work-state/spec.md\n- docs/specs/work-state.md\nImplementation: Carried source material; current implementation truth unverified\nProvenance: Retained work-state candidate carriage from docs/specs/work-state.md; existing Related references retained\nWriter type: Original writer attribution not recorded; retained source provenance\nCanonical for: Candidate scope: Module-to-responsibility pointers for the work state engine implementation; authority follows transitional switchboard\nUse this when: Module-to-responsibility pointers for the work state engine implementation\nDo not use this for: Authority beyond the declared scope or implementation truth without the cited verification\nSupersedes: None; legacy sources remain in place during migration\nSuperseded by: None recorded\n```\n",
  "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db"
}
```

## Entry d-029: docs/platform/work-state/contracts/cli-io-contract.md

```json
{
  "path": "docs/platform/work-state/contracts/cli-io-contract.md",
  "beforeSHA256": "1226302831032c9f18ce9520be648bbc94540eb5f8dbc0ca25495526a83f1daa",
  "afterSHA256": "6429c273f0257b487708d9d6c126826b550b26d7ba97b1c929f8174bbc28de0c",
  "headerFieldsAdded": {
    "Implementation": "Carried source material; current implementation truth unverified",
    "Provenance": "Retained work-state candidate carriage from docs/specs/work-state.md and docs/io-contract.md; existing Related references retained",
    "Writer type": "Original writer attribution not recorded; retained source provenance",
    "Canonical for": "Candidate scope: Owns the input and output contract of the fgOS CLI door and the stdout surface of fgos-runner: writer identity, envelope, exit codes, pagination, verb manifest and version tokens; authority follows transitional switchboard",
    "Use this when": "Owns the input and output contract of the fgOS CLI door and the stdout surface of fgos-runner: writer identity, envelope, exit codes, pagination, verb manifest and version tokens",
    "Do not use this for": "Authority beyond the declared scope or implementation truth without the cited verification",
    "Supersedes": "None; legacy sources remain in place during migration",
    "Superseded by": "None recorded"
  },
  "bodySHA256": "fb8abb70e401be31c2f59ceac55464b195ee0b06515bbeaf52cc4b1fdf2b1baa",
  "bodyUnchangedAtHeaderPass": true,
  "basis": {
    "Purpose": "Owns the input and output contract of the fgOS CLI door and the stdout surface of fgos-runner: writer identity, envelope, exit codes, pagination, verb manifest and version tokens.",
    "Last reviewed": "2026-10-06"
  },
  "reviewStatus": "pending",
  "finalContentCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
  "finalFileSHA256": "6429c273f0257b487708d9d6c126826b550b26d7ba97b1c929f8174bbc28de0c",
  "fullBefore": "# CLI I/O Contract\n\n```txt\nDocument type: Contract\nAudience: Human reviewer, architect, maintainer, implementation agent\nPurpose: Owns the input and output contract of the fgOS CLI door and the stdout surface of fgos-runner: writer identity, envelope, exit codes, pagination, verb manifest and version tokens.\nDesign status: Candidate\nLast reviewed: 2026-10-06\nAdded in candidate: the headings Single Write Door, Writer Source Trust Levels, Writer Resolution Rules, Caller Role, Error Path Is Not Enveloped, Runner Stdout Envelope, Recognizing A Real Envelope and Entry Fields And Effect Axes subdivide sections of the sources that have no heading of their own; the text under them is carried from the sources.\nRelated:\n- docs/platform/work-state/README.md\n- docs/platform/work-state/spec.md\n- docs/platform/work-state/decisions/retired-decision-history.md\n- docs/specs/work-state.md\n- docs/io-contract.md\n```\n",
  "fullAfter": "# CLI I/O Contract\n\n```txt\nDocument type: Contract\nAudience: Human reviewer, architect, maintainer, implementation agent\nPurpose: Owns the input and output contract of the fgOS CLI door and the stdout surface of fgos-runner: writer identity, envelope, exit codes, pagination, verb manifest and version tokens.\nDesign status: Candidate\nLast reviewed: 2026-10-06\nAdded in candidate: the headings Single Write Door, Writer Source Trust Levels, Writer Resolution Rules, Caller Role, Error Path Is Not Enveloped, Runner Stdout Envelope, Recognizing A Real Envelope and Entry Fields And Effect Axes subdivide sections of the sources that have no heading of their own; the text under them is carried from the sources.\nRelated:\n- docs/platform/work-state/README.md\n- docs/platform/work-state/spec.md\n- docs/platform/work-state/decisions/retired-decision-history.md\n- docs/specs/work-state.md\n- docs/io-contract.md\nImplementation: Carried source material; current implementation truth unverified\nProvenance: Retained work-state candidate carriage from docs/specs/work-state.md and docs/io-contract.md; existing Related references retained\nWriter type: Original writer attribution not recorded; retained source provenance\nCanonical for: Candidate scope: Owns the input and output contract of the fgOS CLI door and the stdout surface of fgos-runner: writer identity, envelope, exit codes, pagination, verb manifest and version tokens; authority follows transitional switchboard\nUse this when: Owns the input and output contract of the fgOS CLI door and the stdout surface of fgos-runner: writer identity, envelope, exit codes, pagination, verb manifest and version tokens\nDo not use this for: Authority beyond the declared scope or implementation truth without the cited verification\nSupersedes: None; legacy sources remain in place during migration\nSuperseded by: None recorded\n```\n",
  "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db"
}
```

## Entry d-030: docs/platform/work-state/decisions/retired-decision-history.md

```json
{
  "path": "docs/platform/work-state/decisions/retired-decision-history.md",
  "beforeSHA256": "6627bc6db0e7e27ea2fca7d06f7c76b521c6f0e109036625c1291997e2df913c",
  "afterSHA256": "c52067753829ec020f3e536710cbc0016330fde3fadc89c4962e353e5860125f",
  "headerFieldsAdded": {
    "Implementation": "Carried source material; current implementation truth unverified",
    "Provenance": "Retained work-state candidate carriage from docs/specs/work-state.md; existing Related references retained",
    "Writer type": "Original writer attribution not recorded; retained source provenance",
    "Canonical for": "None; historical evidence",
    "Use this when": "Hold the retired architecture decision records (ADR 0002 to 0032) of the work state area, relocated verbatim from the legacy work-state spec",
    "Do not use this for": "Authority beyond the declared scope or implementation truth without the cited verification",
    "Supersedes": "None; legacy sources remain in place during migration",
    "Superseded by": "None recorded"
  },
  "bodySHA256": "9a94253f74046ddc0f5b0890a6c876d9735410d75c049178ec0ff98a9dd29fdf",
  "bodyUnchangedAtHeaderPass": true,
  "basis": {
    "Purpose": "Hold the retired architecture decision records (ADR 0002 to 0032) of the work state area, relocated verbatim from the legacy work-state spec",
    "Last reviewed": "2026-10-06"
  },
  "reviewStatus": "pending",
  "finalContentCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
  "finalFileSHA256": "c52067753829ec020f3e536710cbc0016330fde3fadc89c4962e353e5860125f",
  "fullBefore": "# Retired Decision History: Work State\n\n```txt\nDocument type: Decision\nAudience: Human reviewer, architect, maintainer, implementation agent\nPurpose: Hold the retired architecture decision records (ADR 0002 to 0032) of the work state area, relocated verbatim from the legacy work-state spec\nDesign status: Candidate\nLast reviewed: 2026-10-06\nRelated:\n- docs/platform/work-state/README.md\n- docs/platform/work-state/spec.md\n- docs/platform/work-state/history/multi-role-harness-distill-record.md\n```\n",
  "fullAfter": "# Retired Decision History: Work State\n\n```txt\nDocument type: Decision\nAudience: Human reviewer, architect, maintainer, implementation agent\nPurpose: Hold the retired architecture decision records (ADR 0002 to 0032) of the work state area, relocated verbatim from the legacy work-state spec\nDesign status: Candidate\nLast reviewed: 2026-10-06\nRelated:\n- docs/platform/work-state/README.md\n- docs/platform/work-state/spec.md\n- docs/platform/work-state/history/multi-role-harness-distill-record.md\nImplementation: Carried source material; current implementation truth unverified\nProvenance: Retained work-state candidate carriage from docs/specs/work-state.md; existing Related references retained\nWriter type: Original writer attribution not recorded; retained source provenance\nCanonical for: None; historical evidence\nUse this when: Hold the retired architecture decision records (ADR 0002 to 0032) of the work state area, relocated verbatim from the legacy work-state spec\nDo not use this for: Authority beyond the declared scope or implementation truth without the cited verification\nSupersedes: None; legacy sources remain in place during migration\nSuperseded by: None recorded\n```\n",
  "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db"
}
```

## Entry d-031: docs/platform/work-state/spec.md

```json
{
  "path": "docs/platform/work-state/spec.md",
  "beforeSHA256": "c92192d5763be108278c861e58ec03daf4946b0bc981fc570d183f588dd04bb4",
  "afterSHA256": "bb00e9d755a3f69a8c7cf411337c644bc7193a80b254481b65ab19df96ea8caf",
  "headerFieldsAdded": {
    "Implementation": "Carried source material; current implementation truth unverified",
    "Provenance": "Retained work-state candidate carriage from docs/specs/work-state.md; existing Related references retained",
    "Writer type": "Original writer attribution not recorded; retained source provenance",
    "Canonical for": "Candidate scope: Own the observable behavior, state model, records, stages, verbs and rules of the work state area; authority follows transitional switchboard",
    "Use this when": "Own the observable behavior, state model, records, stages, verbs and rules of the work state area",
    "Do not use this for": "Authority beyond the declared scope or implementation truth without the cited verification",
    "Supersedes": "None; legacy sources remain in place during migration",
    "Superseded by": "None recorded"
  },
  "bodySHA256": "264a7a86e80780c996d9c7462adc45714d2b3b005ad1f9b7fc04bcfb3c893fc6",
  "bodyUnchangedAtHeaderPass": true,
  "basis": {
    "Purpose": "Own the observable behavior, state model, records, stages, verbs and rules of the work state area.",
    "Last reviewed": "2026-10-06"
  },
  "reviewStatus": "pending",
  "finalContentCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
  "finalFileSHA256": "e808b4e41f7dda3a1d5b3bee51999f1c4920a7716bee17f8535311f4f70bf15f",
  "fullBefore": "# Work State Specification\n\n```txt\nDocument type: Spec\nAudience: Human reviewer, architect, maintainer, implementation agent\nPurpose: Own the observable behavior, state model, records, stages, verbs and rules of the work state area.\nDesign status: Candidate\nLast reviewed: 2026-10-06\nRelated:\n- docs/platform/work-state/README.md\n- docs/platform/work-state/contracts/cli-io-contract.md\n- docs/platform/work-state/architecture/implementation-pointers.md\n- docs/platform/work-state/decisions/retired-decision-history.md\n- docs/platform/work-state/history/multi-role-harness-distill-record.md\n- docs/specs/work-state.md\n- docs/io-contract.md\n```\n",
  "fullAfter": "# Work State Specification\n\n```txt\nDocument type: Spec\nAudience: Human reviewer, architect, maintainer, implementation agent\nPurpose: Own the observable behavior, state model, records, stages, verbs and rules of the work state area.\nDesign status: Candidate\nLast reviewed: 2026-10-06\nRelated:\n- docs/platform/work-state/README.md\n- docs/platform/work-state/contracts/cli-io-contract.md\n- docs/platform/work-state/architecture/implementation-pointers.md\n- docs/platform/work-state/decisions/retired-decision-history.md\n- docs/platform/work-state/history/multi-role-harness-distill-record.md\n- docs/specs/work-state.md\n- docs/io-contract.md\nImplementation: Carried source material; current implementation truth unverified\nProvenance: Retained work-state candidate carriage from docs/specs/work-state.md; existing Related references retained\nWriter type: Original writer attribution not recorded; retained source provenance\nCanonical for: Candidate scope: Own the observable behavior, state model, records, stages, verbs and rules of the work state area; authority follows transitional switchboard\nUse this when: Own the observable behavior, state model, records, stages, verbs and rules of the work state area\nDo not use this for: Authority beyond the declared scope or implementation truth without the cited verification\nSupersedes: None; legacy sources remain in place during migration\nSuperseded by: None recorded\n```\n",
  "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db"
}
```

## Entry d-032: docs/platform/README.md

```json
{
  "path": "docs/platform/README.md",
  "beforeSHA256": "7ec050aacc3c0b42a7830c9d42b0bcae09a4d9cd0c1e4a90432d819d6fc4a2c7",
  "afterSHA256": "75bec7aaaa0cc75886b8bd16a354590c15b97efaeaf614ef8703aa8035c5ee7a",
  "headerFieldsAdded": {
    "Supersedes": "None; legacy sources remain in place during migration",
    "Superseded by": "None recorded"
  },
  "bodySHA256": "64bbafabda24849faf922afb78248c661e74f6ded8ead82b4d27254be727ac97",
  "bodyUnchangedAtHeaderPass": true,
  "basis": {
    "Purpose": "Route readers through platform-wide and area-specific fgOS docs",
    "Last reviewed": "2026-09-25"
  },
  "reviewStatus": "pending",
  "finalContentCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
  "finalFileSHA256": "6e743173617ff1ea81a23cc3fe9af065ebf1f21624b7d61529906c54b33ef7f5",
  "fullBefore": "# Platform Documentation\n\n```txt\nDocument type: Platform portal\nAudience: Human reviewer, architect, maintainer, agent\nPurpose: Route readers through platform-wide and area-specific fgOS docs\nDesign status: Accepted\nImplementation: Partial\nProvenance: Promoted from documentation-system redesign\nWriter type: Human + agent coauthor\nCanonical for: Platform documentation entry and area registry\nUse this when: You need to understand or change fgOS platform behavior or design\nDo not use this for: User-facing task guidance or generated indexes\nLast reviewed: 2026-09-25\nRelated:\n- `docs/doc-governance.md`\n- `docs/transitional-switchboard.md`\n- `docs/reading-map.md`\n```\n\nThis is the portal for fgOS platform documentation.\n",
  "fullAfter": "# Platform Documentation\n\n```txt\nDocument type: Platform portal\nAudience: Human reviewer, architect, maintainer, agent\nPurpose: Route readers through platform-wide and area-specific fgOS docs\nDesign status: Accepted\nImplementation: Partial\nProvenance: Promoted from documentation-system redesign\nWriter type: Human + agent coauthor\nCanonical for: Platform documentation entry and area registry\nUse this when: You need to understand or change fgOS platform behavior or design\nDo not use this for: User-facing task guidance or generated indexes\nLast reviewed: 2026-09-25\nRelated:\n- `docs/doc-governance.md`\n- `docs/transitional-switchboard.md`\n- `docs/reading-map.md`\nSupersedes: None; legacy sources remain in place during migration\nSuperseded by: None recorded\n```\n\nThis is the portal for fgOS platform documentation.\n",
  "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db"
}
```

## Entry d-033: docs/platform/host-invocation-routing/architecture/README.md

```json
{
  "path": "docs/platform/host-invocation-routing/architecture/README.md",
  "beforeSHA256": "6c553e47f749c222c04f3f852bbedacbe4241a94a03129d3fa192272a72bccd8",
  "afterSHA256": "66133d7e048a61679bae919bd3b69baa002775d28400b38e6561076e930db0ed",
  "headerFieldsAdded": {
    "Implementation": "R1/R2/R3 implemented preview plus future host/component migrations",
    "Provenance": "Promoted from docs/architect/host-invocation-routing/**",
    "Writer type": "Original writer attribution not recorded; retained source provenance",
    "Canonical for": "Candidate scope: Route readers through accepted and planned host-invocation architecture; authority follows transitional switchboard",
    "Use this when": "Route readers through accepted and planned host-invocation architecture",
    "Do not use this for": "Authority beyond the declared scope or implementation truth without the cited verification",
    "Supersedes": "None; legacy sources remain in place during migration",
    "Superseded by": "None recorded"
  },
  "bodySHA256": "61a7ebfdd74da1e0770b4ad9444219b0b6721d776ef901c5b8a5961d0f898c3a",
  "bodyUnchangedAtHeaderPass": true,
  "basis": {
    "Purpose": "Route readers through accepted and planned host-invocation architecture",
    "Implementation status": "R1/R2/R3 implemented preview plus future host/component migrations",
    "Source type": "Promoted from docs/architect/host-invocation-routing/**",
    "Last reviewed": "2026-09-18"
  },
  "reviewStatus": "pending",
  "finalContentCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
  "finalFileSHA256": "de479c0ab0d3790d4d9150c07c9b5ae1ef77149bf42bbedc77e5813352ac8488",
  "fullBefore": "# Host Invocation Architecture\n\n```txt\nDocument type: Architecture index\nAudience: Human reviewer, architect, maintainer, implementation agent\nPurpose: Route readers through accepted and planned host-invocation architecture\nDesign status: Draft\nImplementation status: R1/R2/R3 implemented preview plus future host/component migrations\nCanonical: Yes, after review\nOwner: Host invocation\nSource type: Promoted from docs/architect/host-invocation-routing/**\nLast reviewed: 2026-09-18\nRelated:\n- docs/platform/host-invocation-routing/README.md\n- docs/platform/host-invocation-routing/vision.md\n- docs/platform/host-invocation-routing/verification/implementation-alignment.md\n```\n",
  "fullAfter": "# Host Invocation Architecture\n\n```txt\nDocument type: Architecture index\nAudience: Human reviewer, architect, maintainer, implementation agent\nPurpose: Route readers through accepted and planned host-invocation architecture\nDesign status: Draft\nCanonical: Yes, after review\nOwner: Host invocation\nLast reviewed: 2026-09-18\nRelated:\n- docs/platform/host-invocation-routing/README.md\n- docs/platform/host-invocation-routing/vision.md\n- docs/platform/host-invocation-routing/verification/implementation-alignment.md\nImplementation: R1/R2/R3 implemented preview plus future host/component migrations\nProvenance: Promoted from docs/architect/host-invocation-routing/**\nWriter type: Original writer attribution not recorded; retained source provenance\nCanonical for: Candidate scope: Route readers through accepted and planned host-invocation architecture; authority follows transitional switchboard\nUse this when: Route readers through accepted and planned host-invocation architecture\nDo not use this for: Authority beyond the declared scope or implementation truth without the cited verification\nSupersedes: None; legacy sources remain in place during migration\nSuperseded by: None recorded\n```\n",
  "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db"
}
```

## Entry d-034: docs/platform/host-invocation-routing/contracts/README.md

```json
{
  "path": "docs/platform/host-invocation-routing/contracts/README.md",
  "beforeSHA256": "78dc6c19680d7d7b919790ec03b5a6049c0128048089c391fcddbe783948ef97",
  "afterSHA256": "c462d7f39540123fac55338eb2b2e99bce5fa949ded2d35ca7c422dd529c2d1a",
  "headerFieldsAdded": {
    "Implementation": "Current partial plus implemented preview provider protocol",
    "Provenance": "Promoted from docs/architect/host-invocation-routing/**",
    "Writer type": "Original writer attribution not recorded; retained source provenance",
    "Canonical for": "Candidate scope: Route readers through host-invocation contracts and distinguish target contracts from current implementation; authority follows transitional switchboard",
    "Use this when": "Route readers through host-invocation contracts and distinguish target contracts from current implementation",
    "Do not use this for": "Authority beyond the declared scope or implementation truth without the cited verification",
    "Supersedes": "None; legacy sources remain in place during migration",
    "Superseded by": "None recorded"
  },
  "bodySHA256": "4a3025c3d710cc41fcb44a0c07b55be48ca536a00704eab005ac27469f0db2a9",
  "bodyUnchangedAtHeaderPass": true,
  "basis": {
    "Purpose": "Route readers through host-invocation contracts and distinguish target contracts from current implementation",
    "Implementation status": "Current partial plus implemented preview provider protocol",
    "Source type": "Promoted from docs/architect/host-invocation-routing/**",
    "Last reviewed": "2026-09-18"
  },
  "reviewStatus": "pending",
  "finalContentCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
  "finalFileSHA256": "0d83c8d9b228d20578073982749a5d1a9a83d695007ef9927f78e9fd5d065617",
  "fullBefore": "# Host Invocation Contracts\n\n```txt\nDocument type: Contract index\nAudience: Human reviewer, architect, maintainer, implementation agent\nPurpose: Route readers through host-invocation contracts and distinguish target contracts from current implementation\nDesign status: Draft\nImplementation status: Current partial plus implemented preview provider protocol\nCanonical: Yes, after review\nOwner: Host invocation\nSource type: Promoted from docs/architect/host-invocation-routing/**\nLast reviewed: 2026-09-18\nRelated:\n- docs/platform/host-invocation-routing/README.md\n- docs/platform/host-invocation-routing/verification/implementation-alignment.md\n```\n",
  "fullAfter": "# Host Invocation Contracts\n\n```txt\nDocument type: Contract index\nAudience: Human reviewer, architect, maintainer, implementation agent\nPurpose: Route readers through host-invocation contracts and distinguish target contracts from current implementation\nDesign status: Draft\nCanonical: Yes, after review\nOwner: Host invocation\nLast reviewed: 2026-09-18\nRelated:\n- docs/platform/host-invocation-routing/README.md\n- docs/platform/host-invocation-routing/verification/implementation-alignment.md\nImplementation: Current partial plus implemented preview provider protocol\nProvenance: Promoted from docs/architect/host-invocation-routing/**\nWriter type: Original writer attribution not recorded; retained source provenance\nCanonical for: Candidate scope: Route readers through host-invocation contracts and distinguish target contracts from current implementation; authority follows transitional switchboard\nUse this when: Route readers through host-invocation contracts and distinguish target contracts from current implementation\nDo not use this for: Authority beyond the declared scope or implementation truth without the cited verification\nSupersedes: None; legacy sources remain in place during migration\nSuperseded by: None recorded\n```\n",
  "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db"
}
```

## Entry d-035: docs/platform/host-invocation-routing/decisions/README.md

```json
{
  "path": "docs/platform/host-invocation-routing/decisions/README.md",
  "beforeSHA256": "719cb95807671f5ba243233b6e26f4fac7a43bb9845ea2b35681c19dba4bb537",
  "afterSHA256": "1ce94f22965f9739bbc13558b2c0e8086ef16ce045c015c5831296a431f0036d",
  "headerFieldsAdded": {
    "Implementation": "Active",
    "Provenance": "Created during host-invocation documentation migration",
    "Writer type": "Original writer attribution not recorded; retained source provenance",
    "Canonical for": "Candidate scope: Route readers to accepted host-invocation decisions and keep future ADRs separate from vision and preservation records; authority follows transitional switchboard",
    "Use this when": "Route readers to accepted host-invocation decisions and keep future ADRs separate from vision and preservation records",
    "Do not use this for": "Authority beyond the declared scope or implementation truth without the cited verification",
    "Supersedes": "None; legacy sources remain in place during migration",
    "Superseded by": "None recorded"
  },
  "bodySHA256": "e61097f9300c7f23163780efef35ff60561f7a0455947e0f9a97fdfbac19051a",
  "bodyUnchangedAtHeaderPass": true,
  "basis": {
    "Purpose": "Route readers to accepted host-invocation decisions and keep future ADRs separate from vision and preservation records",
    "Implementation status": "Active",
    "Source type": "Created during host-invocation documentation migration",
    "Last reviewed": "2026-09-14"
  },
  "reviewStatus": "pending",
  "finalContentCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
  "finalFileSHA256": "f9c61bff1d4eb68373a99de76522ffafb033f93736022bb8d26c3cdb0a7b1ada",
  "fullBefore": "# Host Invocation Decisions\n\n```txt\nDocument type: Decisions index\nAudience: Human reviewer, architect, maintainer, implementation agent\nPurpose: Route readers to accepted host-invocation decisions and keep future ADRs separate from vision and preservation records\nDesign status: Draft\nImplementation status: Active\nCanonical: Yes, after review\nOwner: Host invocation\nSource type: Created during host-invocation documentation migration\nLast reviewed: 2026-09-14\nRelated:\n- docs/platform/host-invocation-routing/README.md\n- docs/platform/host-invocation-routing/vision.md\n- docs/platform/host-invocation-routing/intent-preservation-ledger.md\n- docs/platform/host-invocation-routing/verification/implementation-alignment.md\n```\n",
  "fullAfter": "# Host Invocation Decisions\n\n```txt\nDocument type: Decisions index\nAudience: Human reviewer, architect, maintainer, implementation agent\nPurpose: Route readers to accepted host-invocation decisions and keep future ADRs separate from vision and preservation records\nDesign status: Draft\nCanonical: Yes, after review\nOwner: Host invocation\nLast reviewed: 2026-09-14\nRelated:\n- docs/platform/host-invocation-routing/README.md\n- docs/platform/host-invocation-routing/vision.md\n- docs/platform/host-invocation-routing/intent-preservation-ledger.md\n- docs/platform/host-invocation-routing/verification/implementation-alignment.md\nImplementation: Active\nProvenance: Created during host-invocation documentation migration\nWriter type: Original writer attribution not recorded; retained source provenance\nCanonical for: Candidate scope: Route readers to accepted host-invocation decisions and keep future ADRs separate from vision and preservation records; authority follows transitional switchboard\nUse this when: Route readers to accepted host-invocation decisions and keep future ADRs separate from vision and preservation records\nDo not use this for: Authority beyond the declared scope or implementation truth without the cited verification\nSupersedes: None; legacy sources remain in place during migration\nSuperseded by: None recorded\n```\n",
  "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db"
}
```

## Entry d-036: docs/platform/host-invocation-routing/verification/README.md

```json
{
  "path": "docs/platform/host-invocation-routing/verification/README.md",
  "beforeSHA256": "fb9438f8e9845804cfe10f18efc2e1e4f805d7ed3d5e562e0c029a74afad4509",
  "afterSHA256": "7248c7f090f456a835b38133b4d1492a6a952a30035dd68fbedec07ec9b4f0da",
  "headerFieldsAdded": {
    "Implementation": "Active",
    "Provenance": "Created during host-invocation documentation migration",
    "Writer type": "Original writer attribution not recorded; retained source provenance",
    "Canonical for": "Candidate scope: Route readers to host-invocation implementation alignment and proof records; authority follows transitional switchboard",
    "Use this when": "Route readers to host-invocation implementation alignment and proof records",
    "Do not use this for": "Authority beyond the declared scope or implementation truth without the cited verification",
    "Supersedes": "None; legacy sources remain in place during migration",
    "Superseded by": "None recorded"
  },
  "bodySHA256": "518f1a8a9e4adc89257f97e955b432ee810cf44ec76350b028c449d6ea1dd982",
  "bodyUnchangedAtHeaderPass": true,
  "basis": {
    "Purpose": "Route readers to host-invocation implementation alignment and proof records",
    "Implementation status": "Active",
    "Source type": "Created during host-invocation documentation migration",
    "Last reviewed": "2026-09-18"
  },
  "reviewStatus": "pending",
  "finalContentCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
  "finalFileSHA256": "195ac902e325e8391ba2988de36025649158c77f2483f5307cf6d3813a0fb9ba",
  "fullBefore": "# Host Invocation Verification\n\n```txt\nDocument type: Verification index\nAudience: Human reviewer, architect, maintainer, implementation agent\nPurpose: Route readers to host-invocation implementation alignment and proof records\nDesign status: Draft\nImplementation status: Active\nCanonical: Yes, after review\nOwner: Host invocation\nSource type: Created during host-invocation documentation migration\nLast reviewed: 2026-09-18\nRelated:\n- docs/platform/host-invocation-routing/verification/implementation-alignment.md\n- docs/platform/host-invocation-routing/verification/compatibility-harness.md\n- docs/platform/host-invocation-routing/verification/source-preservation-audit.md\n```\n",
  "fullAfter": "# Host Invocation Verification\n\n```txt\nDocument type: Verification index\nAudience: Human reviewer, architect, maintainer, implementation agent\nPurpose: Route readers to host-invocation implementation alignment and proof records\nDesign status: Draft\nCanonical: Yes, after review\nOwner: Host invocation\nLast reviewed: 2026-09-18\nRelated:\n- docs/platform/host-invocation-routing/verification/implementation-alignment.md\n- docs/platform/host-invocation-routing/verification/compatibility-harness.md\n- docs/platform/host-invocation-routing/verification/source-preservation-audit.md\nImplementation: Active\nProvenance: Created during host-invocation documentation migration\nWriter type: Original writer attribution not recorded; retained source provenance\nCanonical for: Candidate scope: Route readers to host-invocation implementation alignment and proof records; authority follows transitional switchboard\nUse this when: Route readers to host-invocation implementation alignment and proof records\nDo not use this for: Authority beyond the declared scope or implementation truth without the cited verification\nSupersedes: None; legacy sources remain in place during migration\nSuperseded by: None recorded\n```\n",
  "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db"
}
```

## Entry d-037: docs/platform/work-state/README.md

```json
{
  "path": "docs/platform/work-state/README.md",
  "beforeSHA256": "5c56bdd0a47f6158fce19fede669305222eb2c85dbc34f792fd15b54288f9fc8",
  "afterSHA256": "e8a20f75d1f5b625bb78842bf80dc804af65d1458468e46d579a28c50de2afb7",
  "headerFieldsAdded": {
    "Implementation": "Carried source material; current implementation truth unverified",
    "Provenance": "Retained work-state candidate carriage from docs/specs/work-state.md; existing Related references retained",
    "Writer type": "Original writer attribution not recorded; retained source provenance",
    "Canonical for": "Candidate scope: Route readers through the candidate documents of the work state area and point to the legacy sources they are drawn from; authority follows transitional switchboard",
    "Use this when": "Route readers through the candidate documents of the work state area and point to the legacy sources they are drawn from",
    "Do not use this for": "Authority beyond the declared scope or implementation truth without the cited verification",
    "Supersedes": "None; legacy sources remain in place during migration",
    "Superseded by": "None recorded"
  },
  "bodySHA256": "c3b12a5036f160507b670aa55319c64035cb68b78047f1261e43ffd5cca6491a",
  "bodyUnchangedAtHeaderPass": true,
  "basis": {
    "Purpose": "Route readers through the candidate documents of the work state area and point to the legacy sources they are drawn from",
    "Last reviewed": "2026-10-06"
  },
  "reviewStatus": "pending",
  "finalContentCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
  "finalFileSHA256": "a33a93a555781e34c9576af6d6cb2b86fbdf62b258a2874265023b597d5e0a76",
  "fullBefore": "# Work State\n\n```txt\nDocument type: Area portal\nAudience: Human reviewer, architect, maintainer, implementation agent\nPurpose: Route readers through the candidate documents of the work state area and point to the legacy sources they are drawn from\nDesign status: Candidate\nLast reviewed: 2026-10-06\nRelated:\n- docs/platform/work-state/README.md\n- docs/platform/work-state/spec.md\n- docs/platform/work-state/contracts/cli-io-contract.md\n- docs/platform/work-state/architecture/implementation-pointers.md\n- docs/platform/work-state/decisions/retired-decision-history.md\n- docs/platform/work-state/history/multi-role-harness-distill-record.md\n- docs/specs/work-state.md\n- docs/io-contract.md\n- docs/work-item-lifecycle-vision.md\n- docs/platform/vision.md\n```\n",
  "fullAfter": "# Work State\n\n```txt\nDocument type: Area portal\nAudience: Human reviewer, architect, maintainer, implementation agent\nPurpose: Route readers through the candidate documents of the work state area and point to the legacy sources they are drawn from\nDesign status: Candidate\nLast reviewed: 2026-10-06\nRelated:\n- docs/platform/work-state/README.md\n- docs/platform/work-state/spec.md\n- docs/platform/work-state/contracts/cli-io-contract.md\n- docs/platform/work-state/architecture/implementation-pointers.md\n- docs/platform/work-state/decisions/retired-decision-history.md\n- docs/platform/work-state/history/multi-role-harness-distill-record.md\n- docs/specs/work-state.md\n- docs/io-contract.md\n- docs/work-item-lifecycle-vision.md\n- docs/platform/vision.md\nImplementation: Carried source material; current implementation truth unverified\nProvenance: Retained work-state candidate carriage from docs/specs/work-state.md; existing Related references retained\nWriter type: Original writer attribution not recorded; retained source provenance\nCanonical for: Candidate scope: Route readers through the candidate documents of the work state area and point to the legacy sources they are drawn from; authority follows transitional switchboard\nUse this when: Route readers through the candidate documents of the work state area and point to the legacy sources they are drawn from\nDo not use this for: Authority beyond the declared scope or implementation truth without the cited verification\nSupersedes: None; legacy sources remain in place during migration\nSuperseded by: None recorded\n```\n",
  "contentCommit": "2300d65571968bb3bcb80123a273272586e3f1db"
}
```

## Entry d-038: header-synonym-deduplication

```json
{
  "0": {
    "path": "docs/platform/architecture-map.md",
    "removed": [
      "Implementation status: Partial",
      "Source type: Promoted anchor from docs/architecture-map.md"
    ],
    "retainedFields": [
      "Implementation",
      "Provenance"
    ]
  },
  "1": {
    "path": "docs/platform/component-boundary.md",
    "removed": [
      "Implementation status: Partial",
      "Source type: Promoted anchor for docs/architect/component-boundary/**"
    ],
    "retainedFields": [
      "Implementation",
      "Provenance"
    ]
  },
  "2": {
    "path": "docs/platform/convention/spec.md",
    "removed": [
      "Implementation status: Implemented"
    ],
    "retainedFields": [
      "Implementation",
      "Provenance"
    ]
  },
  "3": {
    "path": "docs/platform/host-invocation-routing/architecture/external-provider-protocol.md",
    "removed": [
      "Implementation status: External process implemented preview; WASM/provider ecosystem planned",
      "Source type: Promoted from docs/architect/host-invocation-routing/external-provider-protocol.md"
    ],
    "retainedFields": [
      "Implementation",
      "Provenance"
    ]
  },
  "4": {
    "path": "docs/platform/host-invocation-routing/architecture/host-use-cases.md",
    "removed": [
      "Implementation status: Accepted; R3 remote peer implemented preview for distribution.build.show",
      "Source type: Promoted from docs/architect/host-invocation-routing/host-invocation-provider-routing.md"
    ],
    "retainedFields": [
      "Implementation",
      "Provenance"
    ]
  },
  "5": {
    "path": "docs/platform/host-invocation-routing/architecture/invocation-kernel.md",
    "removed": [
      "Implementation status: Current partial",
      "Source type: Promoted from docs/architect/host-invocation-routing/host-invocation-provider-routing.md"
    ],
    "retainedFields": [
      "Implementation",
      "Provenance"
    ]
  },
  "6": {
    "path": "docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md",
    "removed": [
      "Implementation status: Implemented preview with legacy-current payload behavior",
      "Source type: Promoted from docs/architect/host-invocation-routing/legacy-cli-transition.md"
    ],
    "retainedFields": [
      "Implementation",
      "Provenance"
    ]
  },
  "7": {
    "path": "docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md",
    "removed": [
      "Implementation status: R1/R2/R3 implemented preview plus remaining component migrations",
      "Source type: Promoted from docs/architect/host-invocation-routing/node-to-rust-component-migration.md"
    ],
    "retainedFields": [
      "Implementation",
      "Provenance"
    ]
  },
  "8": {
    "path": "docs/platform/host-invocation-routing/architecture/provider-routing.md",
    "removed": [
      "Implementation status: Current partial",
      "Source type: Promoted from docs/architect/host-invocation-routing/host-invocation-provider-routing.md and external-provider-protocol.md"
    ],
    "retainedFields": [
      "Implementation",
      "Provenance"
    ]
  },
  "9": {
    "path": "docs/platform/host-invocation-routing/architecture/release-boundaries.md",
    "removed": [
      "Implementation status: R1/R2/R3 implemented preview plus current partial route migration",
      "Source type: Promoted from docs/architect/host-invocation-routing/host-invocation-provider-routing.md and rust-cli-and-proof-components-plan.md"
    ],
    "retainedFields": [
      "Implementation",
      "Provenance"
    ]
  },
  "10": {
    "path": "docs/platform/host-invocation-routing/contracts/command-route-descriptor.md",
    "removed": [
      "Implementation status: Current partial",
      "Source type: Promoted from docs/architect/host-invocation-routing/legacy-cli-transition.md"
    ],
    "retainedFields": [
      "Implementation",
      "Provenance"
    ]
  },
  "11": {
    "path": "docs/platform/host-invocation-routing/contracts/component-protocol.md",
    "removed": [
      "Implementation status: Implemented preview",
      "Source type: Promoted from docs/architect/host-invocation-routing/external-provider-protocol.md"
    ],
    "retainedFields": [
      "Implementation",
      "Provenance"
    ]
  },
  "12": {
    "path": "docs/platform/host-invocation-routing/contracts/external-provider-manifest.md",
    "removed": [
      "Implementation status: Implemented preview",
      "Source type: Promoted from docs/architect/host-invocation-routing/external-provider-protocol.md"
    ],
    "retainedFields": [
      "Implementation",
      "Provenance"
    ]
  },
  "13": {
    "path": "docs/platform/host-invocation-routing/contracts/legacy-payload.md",
    "removed": [
      "Implementation status: Legacy-current plus implemented-preview release manifest binding",
      "Source type: Promoted from docs/architect/host-invocation-routing/legacy-cli-transition.md"
    ],
    "retainedFields": [
      "Implementation",
      "Provenance"
    ]
  },
  "14": {
    "path": "docs/platform/host-invocation-routing/contracts/operation-catalog.md",
    "removed": [
      "Implementation status: Current partial",
      "Source type: Promoted from docs/architect/host-invocation-routing/host-invocation-provider-routing.md"
    ],
    "retainedFields": [
      "Implementation",
      "Provenance"
    ]
  },
  "15": {
    "path": "docs/platform/host-invocation-routing/contracts/operation-provider.md",
    "removed": [
      "Implementation status: Current partial",
      "Source type: Promoted from docs/architect/host-invocation-routing/host-invocation-provider-routing.md"
    ],
    "retainedFields": [
      "Implementation",
      "Provenance"
    ]
  },
  "16": {
    "path": "docs/platform/host-invocation-routing/contracts/operation-request-outcome.md",
    "removed": [
      "Implementation status: Current partial",
      "Source type: Promoted from docs/architect/host-invocation-routing/host-invocation-provider-routing.md"
    ],
    "retainedFields": [
      "Implementation",
      "Provenance"
    ]
  },
  "17": {
    "path": "docs/platform/host-invocation-routing/intent-preservation-ledger.md",
    "removed": [
      "Implementation status: Active",
      "Source type: Migrated from docs/architect/host-invocation-routing/**"
    ],
    "retainedFields": [
      "Implementation",
      "Provenance"
    ]
  },
  "18": {
    "path": "docs/platform/host-invocation-routing/spec.md",
    "removed": [
      "Implementation status: R1/R2/R3 implemented preview plus partial route migration",
      "Source type: Promoted from docs/architect/host-invocation-routing/**"
    ],
    "retainedFields": [
      "Implementation",
      "Provenance"
    ]
  },
  "19": {
    "path": "docs/platform/host-invocation-routing/verification/compatibility-harness.md",
    "removed": [
      "Implementation status: Current harness plus R2/R3 preview extensions",
      "Source type: Promoted from docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md"
    ],
    "retainedFields": [
      "Implementation",
      "Provenance"
    ]
  },
  "20": {
    "path": "docs/platform/host-invocation-routing/verification/implementation-alignment.md",
    "removed": [
      "Implementation status: Preview installed/default proof plus current route-migration and R3 remote peer implemented preview snapshot",
      "Source type: Created from documentation migration scan plus 2026-09-14 code scan of Rust host/runtime paths"
    ],
    "retainedFields": [
      "Implementation",
      "Provenance"
    ]
  },
  "21": {
    "path": "docs/platform/host-invocation-routing/verification/r1-rust-host-proof.md",
    "removed": [
      "Implementation status: Published preview installed/default proof plus open stable graduation",
      "Source type: Promoted from docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md"
    ],
    "retainedFields": [
      "Implementation",
      "Provenance"
    ]
  },
  "22": {
    "path": "docs/platform/host-invocation-routing/verification/r2-external-process-proof.md",
    "removed": [
      "Implementation status: Implemented preview (R2-P0 through R2-P5 closed 2026-09-15; R3, marketplace, signatures, and production WASM remain future work)",
      "Source type: Promoted from docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md"
    ],
    "retainedFields": [
      "Implementation",
      "Provenance"
    ]
  },
  "23": {
    "path": "docs/platform/host-invocation-routing/verification/r3-remote-peer-proof.md",
    "removed": [
      "Implementation status: Implemented preview (R3-P0 frozen; R3-P1 adapter implemented preview; R3-P2/P3 route and proof closed; R3-P4 inventory recorded)",
      "Source type: Promoted from docs/architect/host-invocation-routing/node-to-rust-component-migration.md and rust-cli-and-proof-components-plan.md"
    ],
    "retainedFields": [
      "Implementation",
      "Provenance"
    ]
  },
  "24": {
    "path": "docs/platform/host-invocation-routing/verification/source-preservation-audit.md",
    "removed": [
      "Implementation status: Historical migration snapshot plus R2/R3 status deltas",
      "Source type: Audit over docs/architect/host-invocation-routing/** and docs/platform/host-invocation-routing/**"
    ],
    "retainedFields": [
      "Implementation",
      "Provenance"
    ]
  },
  "25": {
    "path": "docs/platform/host-invocation-routing/vision.md",
    "removed": [
      "Implementation status: Partial",
      "Source type: Promoted from docs/architect/host-invocation-routing/host-invocation-provider-routing.md and node-to-rust-component-migration.md"
    ],
    "retainedFields": [
      "Implementation",
      "Provenance"
    ]
  },
  "26": {
    "path": "docs/platform/intent-preservation-ledger.md",
    "removed": [
      "Implementation status: Partial",
      "Source type: Promoted from documentation-system discussion and existing area ledgers"
    ],
    "retainedFields": [
      "Implementation",
      "Provenance"
    ]
  },
  "27": {
    "path": "docs/platform/host-invocation-routing/architecture/README.md",
    "removed": [
      "Implementation status: R1/R2/R3 implemented preview plus future host/component migrations",
      "Source type: Promoted from docs/architect/host-invocation-routing/**"
    ],
    "retainedFields": [
      "Implementation",
      "Provenance"
    ]
  },
  "28": {
    "path": "docs/platform/host-invocation-routing/contracts/README.md",
    "removed": [
      "Implementation status: Current partial plus implemented preview provider protocol",
      "Source type: Promoted from docs/architect/host-invocation-routing/**"
    ],
    "retainedFields": [
      "Implementation",
      "Provenance"
    ]
  },
  "29": {
    "path": "docs/platform/host-invocation-routing/decisions/README.md",
    "removed": [
      "Implementation status: Active",
      "Source type: Created during host-invocation documentation migration"
    ],
    "retainedFields": [
      "Implementation",
      "Provenance"
    ]
  },
  "30": {
    "path": "docs/platform/host-invocation-routing/verification/README.md",
    "removed": [
      "Implementation status: Active",
      "Source type: Created during host-invocation documentation migration"
    ],
    "retainedFields": [
      "Implementation",
      "Provenance"
    ]
  },
  "kind": "header-synonym-deduplication"
}
```

