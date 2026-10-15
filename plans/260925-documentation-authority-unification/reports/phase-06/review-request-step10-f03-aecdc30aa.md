# Link repoints — part 3

One review request; entry 241–360 of section f (366 total). Content pin `aecdc30aad0ffd65a2956ff642c4be9410686ede`; comparison base `980cb29312b8701f5ea639278f44e1a57a6e5c02`. See [single request index](review-request-step10-index-aecdc30aa.md). This part contains **120 entries**.

Independent review required. No producer-selected seed or verdict. The JSON sidecar carries the same complete entries.

Each row shows old/new destination, native committed target-resolution result, unchanged label and exact alias-origin/target proof. Check destination semantics independently for every entry. Preserved fences, 41 historical referents and nine queued links are documented in the execution artifact; no inline-code or non-doc consumer edits.

## Entry f-241: link-241

```json
{
  "id": "link-241",
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
  "reviewStatus": "pending",
  "oldDestination": "../../architect/component-boundary/component-boundary-advisory.md#9-hexagonal-architecture-view",
  "newDestination": "../component-boundary.md#9-hexagonal-architecture-view",
  "alias": {
    "aliasId": "step10-whole-system-0233",
    "fromPath": "docs/architect/component-boundary/component-boundary-advisory.md#9-hexagonal-architecture-view",
    "toOwner": "docs/platform/component-boundary.md",
    "toAnchor": "9-hexagonal-architecture-view",
    "kind": "redirected",
    "evidenceRef": "plans/260925-documentation-authority-unification/ledger/decisions/s6-whole-system-component-component-boundary-advisory.json",
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
    "level": 2,
    "title": "9. Hexagonal Architecture View",
    "anchor": "9-hexagonal-architecture-view",
    "githubAnchor": "9-hexagonal-architecture-view",
    "stableAnchor": "h-16e519f5d4c8",
    "startLine": 350,
    "endLine": 350,
    "textDigest": "fdf071494f5b3e8e4f6a0e21fe9eed5d5c3ee9dea294c1ba4b81099acea3a0fe",
    "sample": "9. Hexagonal Architecture View",
    "sectionPayloadDigest": "522206db4d5f028589bd95cf8c94e91d845864a0ece067a1adc3a421cc6e2792",
    "followingBlockDigest": "54e18a3af732fb59e7231c7192c3fe8667a4d705cc22e073d4b68b414e938f60",
    "identityFingerprint": "e34f581a950c7f9ba6f6084e9bd5af0d335d877635b0f98553359599f1cfdc71",
    "ancestry": [
      "fgOS Component Boundary Advisory"
    ],
    "text": "## 9. Hexagonal Architecture View",
    "sectionText": "## 9. Hexagonal Architecture View\n\nThe system model should stay independent from concrete storage, transport,\nexecutor, and UI choices.\n\nCore model candidates, grouped by owning component:\n\n```txt\nWork Lifecycle Engine:\n  Work\n  Work identity/status/stage/claim/context/document state\n\nAgent Coordination Engine:\n  CoordinationSession\n  AdhocTask\n  Assignment\n  Synthesis\n\nDispatch And Execution Engine:\n  DispatchPlan\n  Run\n\nRun Result Evaluator:\n  RunResult\n  Evidence\n  ArtifactRef\n\nDomain Components And Extension Layer:\n  FlowDefinition normalized model\n  PolicyPatch\n  TaskSpec / Skill references\n  domain workflow definitions\n```\n\nThis replaces the flatter mental model:\n\n```txt\nCoordinationSession\nAdhocTask\nAssignment\nDispatchPlan\nRun\nRunResult\nEvidence\nSynthesis\nPolicyPatch\nFlowDefinition normalized model\n```\n\nPort candidates, grouped by owning component:\n\n```txt\nWork Lifecycle Engine:\n  WorkLifecyclePort\n  OccupancyPort\n\nAgent Coordination Engine:\n  SessionStorePort\n  AssignmentStorePort\n  TeamCognitionPort\n  WorkContextPort\n\nDispatch And Execution Engine:\n  DispatchResolverPort   (superseded in naming by DispatchRuntimePort,\n                          [Component Authority Boundary Map §13](../proposals/component-authority-boundary-map.md#13-draft-ports);\n                          same candidate facade, not two live ports)\n  RunStorePort\n  ExecutorAdapterPort\n\nRun Result Evaluator:\n  EvidenceCollectorPort\n  ResultNormalizerPort\n  ArtifactStorePort\n\nDomain Components And Extension Layer:\n  DefinitionLoaderPort\n  DomainHarnessPort\n  ProtocolPackagePort\n  PolicyProviderPort\n  EvidencePolicyPort\n\nHost And Surface Layer:\n  VisibilityPort\n  CommandSurfacePort\n  ApiSurfacePort\n\nShared infrastructure:\n  ClockPort\n  IdGeneratorPort\n  FilesystemPort\n```\n\nAdapter candidates:\n\n```txt\nYAML Workflow loader\nWorkflow definition loader\ncoding-domain harness\nCLI spawn adapter\nHerdr spawn adapter\nMCP adapter\nAPI adapter\nlocal .fgos file store\nGit evidence collector\ntest command evidence collector\nWork engine verb adapter\n```\n\nThis split makes replacement easier. For example, dispatch governance,\nFlowDefinition validation, session DAG scheduling, Run supervision, or evidence\ncollection could move to Rust without requiring protocol packages or Skills to\nmove with them."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 4,
    "title": "9. Hexagonal Architecture View",
    "anchor": "9-hexagonal-architecture-view",
    "githubAnchor": "9-hexagonal-architecture-view",
    "stableAnchor": "h-32c1e55dd7f2",
    "startLine": 455,
    "endLine": 455,
    "textDigest": "c1190693935a61dea5a142fa3fa5a70a8bdcfbc27602869ca46286b551d79ee6",
    "sample": "9. Hexagonal Architecture View",
    "sectionPayloadDigest": "54c4fd53ba1e4ea3424d8c910f6249d9a7039f8b914100b00758b97c5419159d",
    "followingBlockDigest": "54e18a3af732fb59e7231c7192c3fe8667a4d705cc22e073d4b68b414e938f60",
    "identityFingerprint": "bf237f3bcff748a49f994d62c97e48fb94efe882481b3c2567cc8434ad3a6662",
    "ancestry": [
      "Component Boundary",
      "Added in candidate: component-boundary-advisory source carriage",
      "fgOS Component Boundary Advisory"
    ],
    "text": "#### 9. Hexagonal Architecture View",
    "sectionText": "#### 9. Hexagonal Architecture View\n\nThe system model should stay independent from concrete storage, transport,\nexecutor, and UI choices.\n\nCore model candidates, grouped by owning component:\n\n```txt\nWork Lifecycle Engine:\n  Work\n  Work identity/status/stage/claim/context/document state\n\nAgent Coordination Engine:\n  CoordinationSession\n  AdhocTask\n  Assignment\n  Synthesis\n\nDispatch And Execution Engine:\n  DispatchPlan\n  Run\n\nRun Result Evaluator:\n  RunResult\n  Evidence\n  ArtifactRef\n\nDomain Components And Extension Layer:\n  FlowDefinition normalized model\n  PolicyPatch\n  TaskSpec / Skill references\n  domain workflow definitions\n```\n\nThis replaces the flatter mental model:\n\n```txt\nCoordinationSession\nAdhocTask\nAssignment\nDispatchPlan\nRun\nRunResult\nEvidence\nSynthesis\nPolicyPatch\nFlowDefinition normalized model\n```\n\nPort candidates, grouped by owning component:\n\n```txt\nWork Lifecycle Engine:\n  WorkLifecyclePort\n  OccupancyPort\n\nAgent Coordination Engine:\n  SessionStorePort\n  AssignmentStorePort\n  TeamCognitionPort\n  WorkContextPort\n\nDispatch And Execution Engine:\n  DispatchResolverPort   (superseded in naming by DispatchRuntimePort,\n                          [Component Authority Boundary Map §13](../architect/proposals/component-authority-boundary-map.md#13-draft-ports);\n                          same candidate facade, not two live ports)\n  RunStorePort\n  ExecutorAdapterPort\n\nRun Result Evaluator:\n  EvidenceCollectorPort\n  ResultNormalizerPort\n  ArtifactStorePort\n\nDomain Components And Extension Layer:\n  DefinitionLoaderPort\n  DomainHarnessPort\n  ProtocolPackagePort\n  PolicyProviderPort\n  EvidencePolicyPort\n\nHost And Surface Layer:\n  VisibilityPort\n  CommandSurfacePort\n  ApiSurfacePort\n\nShared infrastructure:\n  ClockPort\n  IdGeneratorPort\n  FilesystemPort\n```\n\nAdapter candidates:\n\n```txt\nYAML Workflow loader\nWorkflow definition loader\ncoding-domain harness\nCLI spawn adapter\nHerdr spawn adapter\nMCP adapter\nAPI adapter\nlocal .fgos file store\nGit evidence collector\ntest command evidence collector\nWork engine verb adapter\n```\n\nThis split makes replacement easier. For example, dispatch governance,\nFlowDefinition validation, session DAG scheduling, Run supervision, or evidence\ncollection could move to Rust without requiring protocol packages or Skills to\nmove with them."
  }
}
```

## Entry f-242: link-242

```json
{
  "id": "link-242",
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

## Entry f-243: link-243

```json
{
  "id": "link-243",
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

## Entry f-244: link-244

```json
{
  "id": "link-244",
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
  "reviewStatus": "pending",
  "oldDestination": "../../architect/proposals/coordination-envelope-progress.md",
  "newDestination": "../agent-coordination/history/proposals-redesigns/coordination-envelope-progress.md",
  "alias": {
    "aliasId": "step10-proposals-redesigns-0402",
    "fromPath": "docs/architect/proposals/coordination-envelope-progress.md",
    "toOwner": "docs/platform/agent-coordination/history/proposals-redesigns/coordination-envelope-progress.md",
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
    "title": "Coordination Envelope — Chat Progress and Next Work",
    "anchor": "coordination-envelope-chat-progress-and-next-work",
    "githubAnchor": "coordination-envelope-chat-progress-and-next-work",
    "stableAnchor": "h-d52f09d94cb3",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "1133b2428390c1781442953ecfa4cde1ee5f500fabf0cd583c8adc68f7323d44",
    "sample": "Coordination Envelope — Chat Progress and Next Work",
    "sectionPayloadDigest": "7812af5eaf05e2e42542fbe7727120c1ebfb24430b66cdaefc8c40697a3edfaa",
    "followingBlockDigest": "7812af5eaf05e2e42542fbe7727120c1ebfb24430b66cdaefc8c40697a3edfaa",
    "identityFingerprint": "1a73a687f9897966fadc842a8e5fd41c706da67cf86488a8f0cf62477283ebc7",
    "ancestry": [],
    "text": "# Coordination Envelope — Chat Progress and Next Work",
    "sectionText": "# Coordination Envelope — Chat Progress and Next Work\n\nDocument type: Index\nDesign status: Discussion\nImplementation: Active — conceptual review and probe preparation only\nLast reviewed: 2026-09-06\nCanonical for: progress and handoff of this advisory/probe-preparation conversation only\nState class: State — update to current reality; linked reviews/results retain their own history"
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Coordination Envelope — Chat Progress and Next Work",
    "anchor": "coordination-envelope-chat-progress-and-next-work",
    "githubAnchor": "coordination-envelope-chat-progress-and-next-work",
    "stableAnchor": "h-d52f09d94cb3",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "0682b65449b63a0fb0d54428707b21b4d3504818e46eaa60de034d1d40056072",
    "sample": "Coordination Envelope — Chat Progress and Next Work",
    "sectionPayloadDigest": "bd54299ca980fad512e981fa99e8bfcc7a7e76b98b664cc7a6be8191a049aab2",
    "followingBlockDigest": "589a3d68a25ff10843f8075d43feaf569a90fc83b27392375ee5417d9c7cc377",
    "identityFingerprint": "0106dbf1872cbf5bace285cbd7ee09a0f207876668af36ab07380042d8ab4aae",
    "ancestry": [],
    "text": "# Coordination Envelope — Chat Progress and Next Work",
    "sectionText": "# Coordination Envelope — Chat Progress and Next Work\n\n```txt\nDocument type: History\nAudience: Human reviewer, architect, maintainer, agent\nPurpose: Preserve historical source text for independent conservation review\nDesign status: Candidate\nImplementation: Source snapshot retained; current implementation truth not certified\nProvenance: docs/architect/proposals/coordination-envelope-progress.md at fb046210539cbcbe8ca1dab254763f5e78c573d2; blob 40132546e70e23fed654bf5d4cc84ea86ac3cd2b\nWriter type: Agent draft writer\nCanonical: No\nCanonical for: Nothing; non-canonical candidate conservation carrier\nUse this when: Reviewing source carriage, placement, intent and provenance\nDo not use this for: Current authority, implementation proof or cutover approval\nLast reviewed: Pending independent review\nRelated:\n- docs/architect/proposals/coordination-envelope-progress.md\nSupersedes: None; legacy source remains intact\nSuperseded by: None\n```\n\nAdded in candidate: Historical snapshot; Archive the dated handoff with provenance. Shared terms in code are not a consumer of this chat state; nothing is deleted or silently marked complete. Original source metadata and text follow. Physical relative-link destinations alone are rebased to the same repository paths. Units with inherited missing links are preserved as literal fenced source text, without substituting another design or changing any assertion. Source metadata is provenance, not candidate authority.\n\nSource relationship: [original source](../../../../architect/proposals/coordination-envelope-progress.md).\n\n\nDocument type: Index\nDesign status: Discussion\nImplementation: Active — conceptual review and probe preparation only\nLast reviewed: 2026-09-06\nCanonical for: progress and handoff of this advisory/probe-preparation conversation only\nState class: State — update to current reality; linked reviews/results retain their own history"
  }
}
```

## Entry f-245: link-245

```json
{
  "id": "link-245",
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
  "reviewStatus": "pending",
  "oldDestination": "../../specs/runner.md",
  "newDestination": "../runner/README.md",
  "alias": {
    "aliasId": "step10-runner-0001",
    "fromPath": "docs/specs/runner.md",
    "toOwner": "docs/platform/runner/README.md",
    "toAnchor": null,
    "kind": "moved",
    "evidenceRef": "plans/260925-documentation-authority-unification/ledger/area-map-runner.md",
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
    "title": "Spec: Runner (vòng tự hành)",
    "anchor": "spec-runner-vòng-tự-hành",
    "githubAnchor": "spec-runner-vòng-tự-hành",
    "stableAnchor": "h-cf32145a0715",
    "startLine": 9,
    "endLine": 9,
    "textDigest": "a86d867279b4935bdfdfe419a3121f088ead4fe51ea0a62fbfec1da3949cb54c",
    "sample": "Spec: Runner (vòng tự hành)",
    "sectionPayloadDigest": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "followingBlockDigest": null,
    "identityFingerprint": "3cd6fbc17111343773fbdc31c12203474377a0dd3fd697308c6eb7fdf0326213",
    "ancestry": [],
    "text": "# Spec: Runner (vòng tự hành)",
    "sectionText": "# Spec: Runner (vòng tự hành)"
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Runner candidate area",
    "anchor": "runner-candidate-area",
    "githubAnchor": "runner-candidate-area",
    "stableAnchor": "h-e8e77031d058",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "8f85b4fcfa3a55a15633d9bd933117e32d41e496e35fb45ad7a780bb2731523b",
    "sample": "Runner candidate area",
    "sectionPayloadDigest": "92292e684fce34bd22e97057edac9d97e78396dbb0aa0d67a4f0a646236e7454",
    "followingBlockDigest": "0dd22b80ce69d32f5ee9bf0591f3ced11c75d6d57d9708804636fe54a052f741",
    "identityFingerprint": "12241bc94c247eee42a98c1040e13ebca7149de17c49b63b3047210ca2daf1b5",
    "ancestry": [],
    "text": "# Runner candidate area",
    "sectionText": "# Runner candidate area\n\n\n```txt\nDocument type: Area portal\nAudience: Documentation migration reviewer, maintainer, agent\nPurpose: Preserve frozen-map runner content for independent conservation review\nDesign status: Candidate\nImplementation: Carriage only; implementation truth not certified\nProvenance: docs/specs/runner.md at 63fa6f15266f45c881f610235e0be8d61ff07120; blob ddfa78cc7183cf1f7db8ee64d2339653a0aa0023\nWriter type: Agent draft writer\nCanonical: No\nCanonical for: None; candidate only\nUse this when: Reviewing runner carriage, placement and conservation\nDo not use this for: Canonical behavior, source retirement or current truth proof\nLast reviewed: Not independently reviewed; authored 2026-10-15\nRelated:\n- docs/specs/runner.md\nSupersedes: None; legacy authority retained\nSuperseded by: None\n```\n\n> Added in candidate: Metadata and map-based placement scaffolding. This is Added in candidate navigation only; no component or authority change. Known stale carried sentences; full truth check owed at promotion. A19 carriage and explicit Lead A35 note preserve deleted-module, retired-corpus, moved-plan and runner.md:<line> text verbatim."
  }
}
```

## Entry f-246: link-246

```json
{
  "id": "link-246",
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

## Entry f-247: link-247

```json
{
  "id": "link-247",
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

## Entry f-248: link-248

```json
{
  "id": "link-248",
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
  "reviewStatus": "pending",
  "oldDestination": "../../architect/system-vision-trong-mem-ngoai-cung.md",
  "newDestination": "../system-architecture/architecture/system-vision-trong-mem-ngoai-cung.md",
  "alias": {
    "aliasId": "step10-whole-system-1321",
    "fromPath": "docs/architect/system-vision-trong-mem-ngoai-cung.md",
    "toOwner": "docs/platform/system-architecture/architecture/system-vision-trong-mem-ngoai-cung.md",
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
    "title": "System Vision: Trong Mem Ngoai Cung",
    "anchor": "system-vision-trong-mem-ngoai-cung",
    "githubAnchor": "system-vision-trong-mem-ngoai-cung",
    "stableAnchor": "h-ab626936e74c",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "3c6cade55629a91704628da7ada07f43360fff62bcc6e8d1c23abae9ddce8d81",
    "sample": "System Vision: Trong Mem Ngoai Cung",
    "sectionPayloadDigest": "2d38a8b85750e2ad698eb5bada7baa91dea80b0d4f430179ebde5f51b9cb27d6",
    "followingBlockDigest": "2d38a8b85750e2ad698eb5bada7baa91dea80b0d4f430179ebde5f51b9cb27d6",
    "identityFingerprint": "5dc61095ac85b2912668b7704cb41868ec284b170af45f305a0ec1174fc8b496",
    "ancestry": [],
    "text": "# System Vision: Trong Mem Ngoai Cung",
    "sectionText": "# System Vision: Trong Mem Ngoai Cung\n\nDocument type: System-wide architecture vision\nDesign status: Guiding vision\nImplementation: Cross-cutting\nLast reviewed: 2026-09-05\nCanonical for: balancing hard runtime contracts with adaptive agent soul/prose/skill across fgOS"
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "System Vision: Trong Mem Ngoai Cung",
    "anchor": "system-vision-trong-mem-ngoai-cung",
    "githubAnchor": "system-vision-trong-mem-ngoai-cung",
    "stableAnchor": "h-ab626936e74c",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "ed8092dd2b9cd330bc467efd0472a61b70765f53bbaeab1087126c74beff1e28",
    "sample": "System Vision: Trong Mem Ngoai Cung",
    "sectionPayloadDigest": "bc7fd2bfd14a8acc8ac1b376269d2435989d8a96a91f782f625321ccb2dba5cb",
    "followingBlockDigest": "c0c113ba85ee7b2d4de003e40d27463f653fe08013463bb68aa5830df5015113",
    "identityFingerprint": "306b00634acd7d63939a1b1d49aef9b2d6f1dfb657d8094d07617964196f4048",
    "ancestry": [],
    "text": "# System Vision: Trong Mem Ngoai Cung",
    "sectionText": "# System Vision: Trong Mem Ngoai Cung\n\n```txt\nDocument type: Architecture\nAudience: Human reviewer, architect, maintainer, agent\nPurpose: Preserve the complete system-vision-trong-mem-ngoai-cung.md source at its frozen-map candidate owner\nDesign status: Candidate\nImplementation: Partial — inherited source qualifications; not independently truth-verified\nProvenance: docs/architect/system-vision-trong-mem-ngoai-cung.md at 69dd3ee7fd84bc5e93fe9c75d63622d4f5aa8539 (blob 473dd8f1f28f4573194c47ca787973c52cc65756)\nWriter type: Agent carriage; independent review pending\nCanonical for: Nothing until promotion; current source remains docs/architect/system-vision-trong-mem-ngoai-cung.md\nUse this when: Reviewing whole-system candidate carriage and placement\nDo not use this for: Inferring implementation, promotion or superseding source authority\nLast reviewed: Pending independent review\nRelated:\n- docs/architect/system-vision-trong-mem-ngoai-cung.md\n- docs/platform/component-boundary.md\n- docs/platform/architecture-map.md\nSupersedes: None — candidate only\nSuperseded by: None\n```\n\nAdded in candidate: migration metadata and physical link rebasing. Original source metadata, dates, design limits and historic claims below are provenance, not fresh review. Current truth is unverified; A28 requires sampled truth review at this checkpoint and full truth review at promotion.\n\n\nDocument type: System-wide architecture vision\nDesign status: Guiding vision\nImplementation: Cross-cutting\nLast reviewed: 2026-09-05\nCanonical for: balancing hard runtime contracts with adaptive agent soul/prose/skill across fgOS"
  }
}
```

## Entry f-249: link-249

```json
{
  "id": "link-249",
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
  "reviewStatus": "pending",
  "oldDestination": "../../architect/agent-coordination/architecture/coordination-foundation-baseline.md",
  "newDestination": "../agent-coordination/history/retired-engine/files/architecture/coordination-foundation-baseline.md",
  "alias": {
    "aliasId": "step10-agent-coordination-0098",
    "fromPath": "docs/architect/agent-coordination/architecture/coordination-foundation-baseline.md",
    "toOwner": "docs/platform/agent-coordination/history/retired-engine/files/architecture/coordination-foundation-baseline.md",
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
    "title": "Coordination Foundation Baseline",
    "anchor": "coordination-foundation-baseline",
    "githubAnchor": "coordination-foundation-baseline",
    "stableAnchor": "h-411a0133793c",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "e8f3e2d74f0541105654691057c17e6c57cd5a4d743bcd5ce1dd109909b39d18",
    "sample": "Coordination Foundation Baseline",
    "sectionPayloadDigest": "b69d6b2c677072d312204fff37ac00bc18d678356f0f56624deb9c0b27036c2a",
    "followingBlockDigest": "e25b7c8632d90031ba6b859abcd567a84844a749a37031774ce215c4e43c49db",
    "identityFingerprint": "d5d89fa494404a8b382756c64ef3132fcd2ef8ffb0d544c21b2ac345c88195da",
    "ancestry": [],
    "text": "# Coordination Foundation Baseline",
    "sectionText": "# Coordination Foundation Baseline\n\n> Migration status: This document is a legacy/current source for\n> `docs/platform/agent-coordination/architecture/coordination-foundation-baseline.md`. Do not edit divergent design\n> claims here without also updating the target doc or migration inventory.\n\nDocument type: Architecture\nDesign status: Accepted\nImplementation: Implemented for Steps 00-08 delivered surface; deferred items named below\nLast reviewed: 2026-09-03\nCanonical for: accepted Step 00-08 Agent Coordination foundation shape after promotion from roadmap/proposal history\n\nRelated: [Vision](../vision.md), [Runtime Model](runtime-model.md),\n[Protocol Model](protocol-model.md), [Work Integration](work-integration.md),\n[CoordinationSession Contract](../contracts/coordination-session.md),\n[FlowDefinition Contract](../contracts/flow-definition.md),\n[Team Dispatch V1 roadmap history](../roadmap/team-dispatch-v1/README.md),\n[Step 07 proposal history](../proposals/step-07-coordination-session-adhoc-task.md),\n[Step 08 proposal history](../proposals/step-08-standalone-coordination-protocols.md),\n[Team Dispatch V1 verification](../verification/team-dispatch-v1/index.md),\n[Step 08 verification](../verification/step-08-standalone-coordination/index.md),\n[Step 09 MVP1/MVP2 group-thinking verification](../verification/step-09-group-thinking-mvp1-mvp2/index.md)"
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Historical File: Coordination Foundation Baseline",
    "anchor": "historical-file-coordination-foundation-baseline",
    "githubAnchor": "historical-file-coordination-foundation-baseline",
    "stableAnchor": "h-502380625596",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "6b347969444f54c85fa7f39c270bf00f72d1cfb7636cc71f95427fba5c087a0e",
    "sample": "Historical File: Coordination Foundation Baseline",
    "sectionPayloadDigest": "beb26baa1de7102c499d9884c283f5bdab295e78171d9869e7c0604bfef708f4",
    "followingBlockDigest": "0328a4159b96e7785423acf6190622310c55a14fa9b0fbcee0c9f8f748bbe1e9",
    "identityFingerprint": "ddeb3880578fe867f58056d45300aba834dab791fd18e0aea3009efe6f60ad95",
    "ancestry": [],
    "text": "# Historical File: Coordination Foundation Baseline",
    "sectionText": "# Historical File: Coordination Foundation Baseline\n\n```txt\nDocument type: History\nAudience: Human reviewer, maintainer and documentation agent\nPurpose: Preserve the complete classified input as non-authority historical evidence\nDesign status: Candidate\nImplementation: Historical snapshot; not current implementation or authority\nProvenance: docs/platform/agent-coordination/architecture/coordination-foundation-baseline.md at d23045c2de83e3508fda8fd2580b43ece2e1e046; SHA256 2a7c083b0635c1a7679b9a5c3a3337e9c4b44cc3e3ae6ce5e5987ae9ca640b24\nWriter type: Documentation maintainer\nCanonical for: Historical evidence only; no current authority\nUse this when: Auditing original claims or section-level retirement\nDo not use this for: Current runtime behaviour, accepted proposals or executable routing\nLast reviewed: Pending independent whole-area review\nRelated:\n- docs/platform/agent-coordination/README.md\n- docs/specs/runner.md\nSupersedes: None; this is an exact historical carrier\nSuperseded by: Current execution ownership in docs/specs/runner.md\nAdded in candidate: Historical framing only; literal file bytes are unchanged\n```\n\nThe coordination engine was retired in `2180b4e72701bb090288af8fe8021008d9d42079`; see `docs/specs/runner.md` **CoordinationSession (Lịch sử — đã thu hồi per P4; thay bằng CollaborationPattern & Workflow runner)**. Original statuses and instructions below are dated evidence, not current claims."
  }
}
```

## Entry f-250: link-250

```json
{
  "id": "link-250",
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
  "reviewStatus": "pending",
  "oldDestination": "../../architect/agent-coordination/contracts/flow-definition.md",
  "newDestination": "../agent-coordination/history/retired-engine/files/contracts/flow-definition.md",
  "alias": {
    "aliasId": "step10-agent-coordination-0625",
    "fromPath": "docs/architect/agent-coordination/contracts/flow-definition.md",
    "toOwner": "docs/platform/agent-coordination/history/retired-engine/files/contracts/flow-definition.md",
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
    "title": "FlowDefinition And Profile Schema Contract",
    "anchor": "flowdefinition-and-profile-schema-contract",
    "githubAnchor": "flowdefinition-and-profile-schema-contract",
    "stableAnchor": "h-20a02acd7873",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "2c1a34c5814b7255a6ab21ee02d53b7b89b4d874ba9b1702399ab736ea3995d8",
    "sample": "FlowDefinition And Profile Schema Contract",
    "sectionPayloadDigest": "3c17336e2c054d57a956bf0cbb986ff099f632da1bb93ee20fb81e4420b366c0",
    "followingBlockDigest": "aed80f3336da674cfe568d14041d150b01c76372c7ea0c20464994166fc62258",
    "identityFingerprint": "4bdc624157452d055a9c5a803497c42112b1d1d6616b539a819d3f8521e2eb77",
    "ancestry": [],
    "text": "# FlowDefinition And Profile Schema Contract",
    "sectionText": "# FlowDefinition And Profile Schema Contract\n\n> Migration status: This document is a legacy/current source for\n> `docs/platform/agent-coordination/contracts/flow-definition.md`. Do not edit divergent design\n> claims here without also updating the target doc or migration inventory.\n\nDocument type: Contract\nDesign status: Accepted\nImplementation: Implemented (`src/runner/definitions/{schema,workflow-adapter,protocol-loader}.mjs`,\nStep 08 Phase 02; Workflow-profile projection additive at zero diff to\n`src/state/workflow-stage-graphs.mjs`; CoordinationProtocol-profile fixtures\nship in `core/coordination-protocols/` and are discoverable from a real\nexternal consuming project, proven live at P07.2 R6. Full per-phase trace:\n`docs/architect/agent-coordination/verification/step-08-standalone-coordination/index.md`.\nPhase 00 (Step 09): driver-authorized optional operations, disposition,\nrecheck-vs-retry contract text accepted — implemented across\n`step-09-group-thinking-mvp1-mvp2` Phases 01-03 (the `activation` schema\nfield, `standalone-master-coordination-loop.yaml`'s real\n`driver-authorized` bindings) and `step-09-mvp3-to-mvp5` Phase 03\n(`policy.rigor` role-tier separation for the same fixture's operations; migrated from the original field name in tier/rigor consolidation Phase 2).\nFull per-phase trace:\n`docs/architect/agent-coordination/verification/step-09-mvp3-to-mvp5/index.md`.\nPhase 06 (Step 09 MVP6): `spec.profile.topology.visibilityWindows[]` and\n`graph.nodes[].operations[].contextAccess.visibilityWindowRef` accepted and\nimplemented — schema/validation in `src/runner/definitions/schema.mjs`\n(P06.1), runtime derivation and grant enforcement in\n`src/runner/coordination/session-engine.mjs`\n(`deriveVisibilityWindowState`, P06.2 plus four fix rounds), proved against\nthe committed opt-in fixture\n`core/coordination-protocols/independent-research-fan-out-fan-in-gated.yaml`\n(P06.3, `test/runner/coordination-visibility-window-fixture.test.mjs`).\nPromoted with the named limitations in Visibility Windows below, not\nwithout them.\nPhase 07 (Step 09 MVP7): `spec.profile.completion.aggregation` accepted and\nimplemented — schema/validation in `src/runner/definitions/schema.mjs` and\nthe runtime validation door in\n`src/runner/coordination/session-engine.mjs` (P07.3), enforced at the request\ndoor in `src/verbs/coordination/run.mjs` (P07.4). Promoted with the named\nlimitations in `completion.aggregation` below and in the CoordinationSession\ncontract's own Evidence-Preserving Aggregation section, not without them.\nPhase 08 (Step 09 MVP8): `spec.operations[].contributions.allowedTypes[]`\naccepted and implemented — schema/validation in\n`src/runner/definitions/schema.mjs` (P08.3), consumed by\n`linkSessionContribution`'s real (non-vacuous) operation/type narrowing in\n`src/runner/coordination/session-engine.mjs`, proved against three committed\nopt-in fixtures under `core/coordination-protocols/deliberation-*-chain.yaml`\n(P08.3). See the CoordinationSession contract's own Deliberation\nContribution Ledger section for the runtime half.\nPhase 09 (Step 09 MVP9): `spec.profile.topology.specialistSlots[]` and\n`graph.nodes[].operations[].specialistSlotRef` accepted and implemented —\nschema/validation in `src/runner/definitions/schema.mjs` (P09.1, plus a Wave\n4 fix round closing slot-id disjointness and role/operation consistency\ngaps), runtime authorization/binding/dispatch resolution in\n`src/runner/coordination/{session-engine,store,replay}.mjs` (P09.2, 1 HIGH\nfixed — see the CoordinationSession contract's own Specialist Slot Binding\nsection), negative/crash-recovery/structural-absence proof in\n`test/runner/{coordination-specialist-binding,coordination-r7-work-isolation}.test.mjs`\n(P09.3, closing Phase 09). Promoted with the named limitations in Specialist\nSlots below and in the CoordinationSession contract's own Specialist Slot\nBinding section, not without them.\nPhase 10 (Step 09 external acceptance, closing Step 09): three new, real\nCoordinationProtocol FlowDefinitions\n(`core/coordination-protocols/group-thinking-{rfc-review-lite,\nnominal-group-lite,delphi-feedback-lite}.yaml`) exercising the MVP6-MVP9\nmechanisms above through no protocol-specific kernel branch (P10.2-P10.4),\nregistered and proven reachable through a real external Group-Thinking\nProtocol Pack (P10.1/P10.5-P10.9) — see the CoordinationSession contract's\nown Group-Thinking Protocol Pack section for the pack-layer semantics. No\nnew FlowDefinition schema field added by Phase 10; one Forbidden Fields\nSummary table row added below, closing a pre-existing contract-text gap\n(`policy.preferExecutor` illegal on a portable definition) named by P10.2's\nown Reviewer.\nFull per-phase trace:\n`docs/architect/agent-coordination/verification/step-09-mvp6-to-mvp9/index.md`.)\nLast reviewed: 2026-09-04\nCanonical for: the FlowDefinition IR schema, the Workflow/CoordinationProtocol profile discriminator, the operation primitive, and PolicyPatch provenance\nRelated: [ADR-009](../decisions/ADR-009-flow-definition-shared-ir-and-typed-profiles.md), [Protocol Model](../architecture/protocol-model.md), [Workflow Stage Operation Contract](workflow-stage-operation.md), [CoordinationSession Contract](coordination-session.md)"
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Historical File: FlowDefinition And Profile Schema Contract",
    "anchor": "historical-file-flowdefinition-and-profile-schema-contract",
    "githubAnchor": "historical-file-flowdefinition-and-profile-schema-contract",
    "stableAnchor": "h-6444298120d4",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "ff00e828d5ea4a7c36af3abca5d8a4461f7cec01efa8de6d3b750ab0a599def7",
    "sample": "Historical File: FlowDefinition And Profile Schema Contract",
    "sectionPayloadDigest": "822f1c19f24c76a90bd445f3875c0f63087e3553e516eebfc628d2eb8e350fc9",
    "followingBlockDigest": "bed733f1061e986160cfed8758eec0ac33e7fe27fa5355af74ab659df21d67fb",
    "identityFingerprint": "648f886760f2da71e6466da87bdc80b51f10c71546f9b0ffff57d19830fbc22f",
    "ancestry": [],
    "text": "# Historical File: FlowDefinition And Profile Schema Contract",
    "sectionText": "# Historical File: FlowDefinition And Profile Schema Contract\n\n```txt\nDocument type: History\nAudience: Human reviewer, maintainer and documentation agent\nPurpose: Preserve the complete classified input as non-authority historical evidence\nDesign status: Candidate\nImplementation: Historical snapshot; not current implementation or authority\nProvenance: docs/platform/agent-coordination/contracts/flow-definition.md at d23045c2de83e3508fda8fd2580b43ece2e1e046; SHA256 54d5c541879c9c2d48b2125cd702f12d9831389f84009d332190bc86ef7e18c8\nWriter type: Documentation maintainer\nCanonical for: Historical evidence only; no current authority\nUse this when: Auditing original claims or section-level retirement\nDo not use this for: Current runtime behaviour, accepted proposals or executable routing\nLast reviewed: Pending independent whole-area review\nRelated:\n- docs/platform/agent-coordination/README.md\n- docs/specs/runner.md\nSupersedes: None; this is an exact historical carrier\nSuperseded by: Current execution ownership in docs/specs/runner.md\nAdded in candidate: Historical framing only; literal file bytes are unchanged\n```\n\nThe coordination engine was retired in `2180b4e72701bb090288af8fe8021008d9d42079`; see `docs/specs/runner.md` **CoordinationSession (Lịch sử — đã thu hồi per P4; thay bằng CollaborationPattern & Workflow runner)**. Original statuses and instructions below are dated evidence, not current claims."
  }
}
```

## Entry f-251: link-251

```json
{
  "id": "link-251",
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
  "reviewStatus": "pending",
  "oldDestination": "../../architect/agent-coordination/contracts/coordination-session.md",
  "newDestination": "../agent-coordination/history/retired-engine/files/contracts/coordination-session.md",
  "alias": {
    "aliasId": "step10-agent-coordination-0510",
    "fromPath": "docs/architect/agent-coordination/contracts/coordination-session.md",
    "toOwner": "docs/platform/agent-coordination/history/retired-engine/files/contracts/coordination-session.md",
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
    "title": "CoordinationSession Persistence And Recovery Contract",
    "anchor": "coordinationsession-persistence-and-recovery-contract",
    "githubAnchor": "coordinationsession-persistence-and-recovery-contract",
    "stableAnchor": "h-e612164009be",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "b64af06e61cf1ed7fa26e45c00728ea6273b6e9ca554d80f83bfa9859167bd3f",
    "sample": "CoordinationSession Persistence And Recovery Contract",
    "sectionPayloadDigest": "40065e2c529054c83afd96eb1304d6358289f1bc9cd4ab25c22a9ddcc3fb9ed8",
    "followingBlockDigest": "e051e0a01933ba68da53b5cc015f445282af2cc553142832f8bf5a10331e4ee2",
    "identityFingerprint": "ca7c168434334acb7d86a1c432fb2d9a8f3452202fd12dbc0ca49d154a16cd0c",
    "ancestry": [],
    "text": "# CoordinationSession Persistence And Recovery Contract",
    "sectionText": "# CoordinationSession Persistence And Recovery Contract\n\n> Migration status: This document is a legacy/current source for\n> `docs/platform/agent-coordination/contracts/coordination-session.md`. Do not edit divergent design\n> claims here without also updating the target doc or migration inventory.\n\nDocument type: Contract\nDesign status: Accepted\nImplementation: Implemented (Phase 01 R1-R8: manifest/event store, direct\nmission-lite cutover, shared engine, dynamic consult, crash-safe idempotent\nresume; Phase 03: declared-protocol dispatch on the same engine; Phase 04:\nresearch fan-out/fan-in on the same session bounds; Phase 06 R1-R4: quorum/\npartial policy, retry/replacement, crash recovery, cancellation; Phase 06\nR5-R8: uniform hard-budget enforcement across every dispatch path,\n`coordinationId` path-traversal charset validation, write-time\nforeign-evidence rejection, work-isolation static export-surface check;\nPhase 07: public CLI (`fgos coordination run/show`) and headless adapter\nboth invoking this store through the one shared engine, capability parity\nlive-proved — `src/runner/coordination/{schema,store,replay,session-engine}.mjs`,\n`src/verbs/coordination/{schema,run,show}.mjs`,\n`src/runner/coordination/headless-adapter.mjs`. Full per-phase trace:\n`docs/architect/agent-coordination/verification/step-08-standalone-coordination/index.md`.\nPhase 00 (Step 09): driver-authorized optional operations, disposition,\nrecheck-vs-retry contract text accepted — implemented across\n`step-09-group-thinking-mvp1-mvp2` Phases 01-03 (recheck-as-new-Assignment,\n`driver-disposition-recorded`, live no-Work standalone proof) and\n`step-09-mvp3-to-mvp5` Phases 00-04 (disposition ref session-ownership\nenforcement, a thin CLI launcher, intentional role-tier dispatch policy,\nand session resume through the same request door, with a foreign-writerId\nresume-hijack path closed). Full per-phase trace:\n`docs/architect/agent-coordination/verification/step-09-mvp3-to-mvp5/index.md`.\nDogfood handoff for MVP6+:\n`docs/architect/agent-coordination/playbooks/mvp6-dogfood-handoff.md`.\nPhase 07 (Step 09 MVP7): the `aggregation-validated` event, its write door,\nits replay refusals, and `closeSessionByQuorum`'s refuse-only aggregation\ninput accepted and implemented —\n`src/runner/coordination/{schema,store,replay,session-engine}.mjs` (P07.3),\nenforced at the request door and rendered by `show` in\n`src/verbs/coordination/{run,show}.mjs` (P07.4). Promoted with the named\nlimitations in Evidence-Preserving Aggregation below, not without them.\nPhase 08 (Step 09 MVP8): the `deliberation-contribution-linked` event, its\nraw and mediated write doors, its replay reconstruction and refusals, the\nderived open/resolved contribution views, and the `contribution:` ref\nnamespace on `driver-disposition-recorded` accepted and implemented —\n`src/runner/coordination/{schema,store,replay,session-engine}.mjs` (P08.2),\n`src/runner/deliberation/schema.mjs` (P08.1, called never forked), method-\nshaped proof against three real fixtures under `core/coordination-protocols/`\n(P08.3). Promoted with the named limitations in Deliberation Contribution\nLedger below, not without them.\nPhase 09 (Step 09 MVP9): the `specialist-authorized` event, its atomic\nauthorize-and-bind write door, its replay reconstruction, and the\n`specialistSlotRef` node-operation binding resolution against currently-live\nspecialist bindings accepted and implemented —\n`src/runner/coordination/{schema,store,replay,session-engine}.mjs` (P09.2,\n1 HIGH fixed: authorization expiry was gated on a caller-suppliable `round`\nthat the one real production caller never forwarded, closed by deriving the\nsession's current round internally from replayed `assignment-created`\nevents), `src/runner/definitions/schema.mjs` (P09.1, the\n`topology.specialistSlots[]` schema — see the\n[FlowDefinition Contract](flow-definition.md#specialist-slots-phase-09-step-09-mvp9)),\nnegative/crash-recovery/structural-absence proof\n(`test/runner/{coordination-specialist-binding,coordination-r7-work-isolation}.test.mjs`,\nP09.3, closing Phase 09). Promoted with the named limitations in Specialist\nSlot Binding below, not without them.\nPhase 10 (Step 09 external acceptance, closing Step 09): the multi-operation\nquorum-completion rule (`classifySessionQuorum`/`closeSessionByQuorum`,\n`session-engine.mjs`, P10-KERNEL-FIX, user-authorized) and the\nGroup-Thinking Protocol Pack (`core/protocol-packs/group-thinking.json`,\n`src/verbs/coordination/group-thinking-pack.mjs`, three registered\nprotocols, P10.1-P10.9) accepted and implemented, including the pack\nrequest door's fifth step kind (`contribution`, forwarding into\n`linkSessionContribution`) and two resolution-failure crash fixes in\n`src/verbs/coordination/run.mjs` (P10.10, closing the track). Promoted with\nthe named limitations in Multi-Operation Quorum Completion and\nGroup-Thinking Protocol Pack below, not without them. Full per-phase trace:\n`docs/architect/agent-coordination/verification/step-09-mvp6-to-mvp9/index.md`.\nPhase 03.1 (Architecture Advisory Panel track, P02.1's BL4 row): the\n`human-turn-recorded` event, its write door (`recordHumanTurn`), its replay\nre-validation, the `human-turn:` ref namespace on\n`driver-disposition-recorded`, and the `human-turn` request-step type\naccepted and implemented —\n`src/runner/coordination/{schema,store,replay}.mjs`,\n`src/verbs/coordination/{schema,run,show}.mjs`. Promoted with the named\nlimitation in Human Turn Provenance below (T6, same-privilege-level\nfabrication, cannot be closed in-process), not without it. Full trace:\n`docs/architect/agent-coordination/verification/architecture-advisory-panel/proofs/P03.1/doer-report.md`.)\nLast reviewed: 2026-09-06\nCanonical for: CoordinationSession manifest/event schema, storage layout, session-to-Assignment membership, and recovery rules\nRelated: [ADR-008](../decisions/ADR-008-coordination-session-and-mission-deferral.md), [Assignment, Run, And RunResult Contract](assignment-run-runresult.md), [Runtime Model](../architecture/runtime-model.md), [Work Integration](../architecture/work-integration.md)"
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Historical File: CoordinationSession Persistence And Recovery Contract",
    "anchor": "historical-file-coordinationsession-persistence-and-recovery-contract",
    "githubAnchor": "historical-file-coordinationsession-persistence-and-recovery-contract",
    "stableAnchor": "h-97ffcc5e7a4e",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "1e82456808db9b6906d5ad89c679a332d59efa4b56d90ee02c549b53c908e4c7",
    "sample": "Historical File: CoordinationSession Persistence And Recovery Contract",
    "sectionPayloadDigest": "96ccb65ccea490065b1592d697e4414bfa5436c78a8fe69a5764019a0161218a",
    "followingBlockDigest": "3f555c14e4947b2d468789d747a0ee9f73663f247f44a5792fc3d36c006c50bb",
    "identityFingerprint": "b3f4f18a2c09d99adcdc4a9fe8e026511ea47e55acb0f03cf32a3e59f09250fc",
    "ancestry": [],
    "text": "# Historical File: CoordinationSession Persistence And Recovery Contract",
    "sectionText": "# Historical File: CoordinationSession Persistence And Recovery Contract\n\n```txt\nDocument type: History\nAudience: Human reviewer, maintainer and documentation agent\nPurpose: Preserve the complete classified input as non-authority historical evidence\nDesign status: Candidate\nImplementation: Historical snapshot; not current implementation or authority\nProvenance: docs/platform/agent-coordination/contracts/coordination-session.md at d23045c2de83e3508fda8fd2580b43ece2e1e046; SHA256 38bfc02b54d412ba0a412f778c147915fac6305dbfaac1e05ff8f363eff20601\nWriter type: Documentation maintainer\nCanonical for: Historical evidence only; no current authority\nUse this when: Auditing original claims or section-level retirement\nDo not use this for: Current runtime behaviour, accepted proposals or executable routing\nLast reviewed: Pending independent whole-area review\nRelated:\n- docs/platform/agent-coordination/README.md\n- docs/specs/runner.md\nSupersedes: None; this is an exact historical carrier\nSuperseded by: Current execution ownership in docs/specs/runner.md\nAdded in candidate: Historical framing only; literal file bytes are unchanged\n```\n\nThe coordination engine was retired in `2180b4e72701bb090288af8fe8021008d9d42079`; see `docs/specs/runner.md` **CoordinationSession (Lịch sử — đã thu hồi per P4; thay bằng CollaborationPattern & Workflow runner)**. Original statuses and instructions below are dated evidence, not current claims."
  }
}
```

## Entry f-252: link-252

```json
{
  "id": "link-252",
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
  "reviewStatus": "pending",
  "oldDestination": "../../architect/agent-coordination/playbooks/prompts/master-coordinator.md",
  "newDestination": "../agent-coordination/README.md",
  "alias": {
    "aliasId": "step10-agent-coordination-1655",
    "fromPath": "docs/architect/agent-coordination/playbooks/prompts/master-coordinator.md",
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
    "title": "Master Multi-Agent Implementation Coordinator Prompt",
    "anchor": "master-multi-agent-implementation-coordinator-prompt",
    "githubAnchor": "master-multi-agent-implementation-coordinator-prompt",
    "stableAnchor": "h-47a3e31e661d",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "05871550173fffc54a71b08fd35306b6f500a510f238887552fb7f3af420bd6d",
    "sample": "Master Multi-Agent Implementation Coordinator Prompt",
    "sectionPayloadDigest": "0079c677563098897ce208988476c5baceb31b70344eb91a0f287fa93952a93b",
    "followingBlockDigest": "2f5584ae9b3b1792f75ad76a526b6d5a525b29af27a62d13742884b865180a4b",
    "identityFingerprint": "db20c7fca96f0cc50c4f8ffe9e938d5b0489c00c552b582c2957a339a0787792",
    "ancestry": [],
    "text": "# Master Multi-Agent Implementation Coordinator Prompt",
    "sectionText": "# Master Multi-Agent Implementation Coordinator Prompt\n\n> Migration status: This document is a legacy/current source for\n> `docs/platform/agent-coordination/playbooks/prompts/master-coordinator.md`. Do not edit divergent design\n> claims here without also updating the target doc or migration inventory.\n\nDocument type: Playbook\nDesign status: N/A\nImplementation: Active\nLast reviewed: 2026-08-31\nCanonical for: one-entry manual bootstrap prompt for multi-agent implementation"
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

## Entry f-253: link-253

```json
{
  "id": "link-253",
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

## Entry f-254: link-254

```json
{
  "id": "link-254",
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
  "reviewStatus": "pending",
  "oldDestination": "../../architect/proposals/group-thinking-plan-loop.md",
  "newDestination": "../agent-coordination/history/proposals-redesigns/group-thinking-plan-loop.md",
  "alias": {
    "aliasId": "step10-proposals-redesigns-0468",
    "fromPath": "docs/architect/proposals/group-thinking-plan-loop.md",
    "toOwner": "docs/platform/agent-coordination/history/proposals-redesigns/group-thinking-plan-loop.md",
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
    "title": "Group-Thinking Plan Loop — Design Proposal",
    "anchor": "group-thinking-plan-loop-design-proposal",
    "githubAnchor": "group-thinking-plan-loop-design-proposal",
    "stableAnchor": "h-92c18983550b",
    "startLine": 11,
    "endLine": 11,
    "textDigest": "557b60e1b974df88aeb8037d7a609e6a95d861f61717a38b733cbef5b5d2a9e5",
    "sample": "Group-Thinking Plan Loop — Design Proposal",
    "sectionPayloadDigest": "06023f111df1cee5156382cfc7b3c09978ebc960290ce2a2a56151e22b7c6bd4",
    "followingBlockDigest": "e41eea3137a22cb93910d0159763b715d73776cd73f0bc5aa885b5077d850d84",
    "identityFingerprint": "d8efc02d96ab5a7cabf8385371e6a8e0444bbc4d8e95603dd7f1a53086c153f9",
    "ancestry": [],
    "text": "# Group-Thinking Plan Loop — Design Proposal",
    "sectionText": "# Group-Thinking Plan Loop — Design Proposal\n\nDocument type: Proposal\nDesign status: Discussion\nImplementation: Not started\nLast reviewed: 2026-09-04\nCanonical for: the design decision this proposal's own plan\n(`plans/260904-2329-group-thinking-plan-loop/`) executes against; not yet an\naccepted contract.\n\nRelated: [Master Multi-Agent Implementation Coordinator](../agent-coordination/playbooks/prompts/master-coordinator.md),\n[MVP6+ Dogfood Handoff](../agent-coordination/playbooks/mvp6-dogfood-handoff.md),\n[CoordinationSession Contract](../agent-coordination/contracts/coordination-session.md),\n[Step 09 Group Thinking Substrate](step-09-group-thinking-substrate.md),\n[`docs/how-to/run-a-coordination-session.md`](../../how-to/run-a-coordination-session.md),\n[`docs/how-to/use-fgos-group-thinking.md`](../../how-to/use-fgos-group-thinking.md)"
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Group-Thinking Plan Loop — Design Proposal",
    "anchor": "group-thinking-plan-loop-design-proposal",
    "githubAnchor": "group-thinking-plan-loop-design-proposal",
    "stableAnchor": "h-4b35dec49687",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "8d26cba45b46736a30545b7839d0a9b51357acf8f5eb242695ed944f81d10353",
    "sample": "Group-Thinking Plan Loop — Design Proposal",
    "sectionPayloadDigest": "a9b859e75fb125637b2b4db870e53eae5044d2861448c2624932ba6891502ac1",
    "followingBlockDigest": "a682a4c33d80d503f5196ca2fa115d80d958d322900de8a61e97bacd6f826739",
    "identityFingerprint": "7be62a0db8acabde35205bb584631e3252e9f4ebaa90063dedd21c716255cd67",
    "ancestry": [],
    "text": "# Group-Thinking Plan Loop — Design Proposal",
    "sectionText": "# Group-Thinking Plan Loop — Design Proposal\n\n```txt\nDocument type: History\nAudience: Human reviewer, architect, maintainer, agent\nPurpose: Preserve historical source text for independent conservation review\nDesign status: Candidate\nImplementation: Source snapshot retained; current implementation truth not certified\nProvenance: docs/architect/proposals/group-thinking-plan-loop.md at fb046210539cbcbe8ca1dab254763f5e78c573d2; blob 4df6e977ab05371234ac550da29fa3d8da553f2a\nWriter type: Agent draft writer\nCanonical: No\nCanonical for: Nothing; non-canonical candidate conservation carrier\nUse this when: Reviewing source carriage, placement, intent and provenance\nDo not use this for: Current authority, implementation proof or cutover approval\nLast reviewed: Pending independent review\nRelated:\n- docs/architect/proposals/group-thinking-plan-loop.md\nSupersedes: None; legacy source remains intact\nSuperseded by: None\n```\n\nAdded in candidate: Historical snapshot; Archive that retired mechanism, retaining its explicit external-coordinator constraints as historical intent. Current plan-loop skills do not revive the retired session engine. Not started is stale and remains verbatim. Original source metadata and text follow. Physical relative-link destinations alone are rebased to the same repository paths. Units with inherited missing links are preserved as literal fenced source text, without substituting another design or changing any assertion. Source metadata is provenance, not candidate authority.\n\nSource relationship: [original source](../../../../architect/proposals/group-thinking-plan-loop.md).\n\n````markdown\n---\nname: group-thinking-plan-loop\ndescription: >-\n  Design proposal for a Work-independent, multi-cell/multi-phase\n  implementation-coordination mechanism built on the CoordinationSession\n  substrate (group-thinking pack), reproducing master-coordinator.md's own\n  Doer/Reviewer/Red-Team/Fixer loop with real, replayable evidence and\n  genuine per-role provider diversity.\n---\n````\n\n\n\nDocument type: Proposal\nDesign status: Discussion\nImplementation: Not started\nLast reviewed: 2026-09-04\nCanonical for: the design decision this proposal's own plan\n(`plans/260904-2329-group-thinking-plan-loop/`) executes against; not yet an\naccepted contract.\n\nRelated: [Master Multi-Agent Implementation Coordinator](../../../../architect/agent-coordination/playbooks/prompts/master-coordinator.md),\n[MVP6+ Dogfood Handoff](../../../../architect/agent-coordination/playbooks/mvp6-dogfood-handoff.md),\n[CoordinationSession Contract](../../../../architect/agent-coordination/contracts/coordination-session.md),\n[Step 09 Group Thinking Substrate](../../../../architect/proposals/step-09-group-thinking-substrate.md),\n[`docs/how-to/run-a-coordination-session.md`](../../../../how-to/run-a-coordination-session.md),\n[`docs/how-to/use-fgos-group-thinking.md`](../../../../how-to/use-fgos-group-thinking.md)"
  }
}
```

## Entry f-255: link-255

```json
{
  "id": "link-255",
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
  "reviewStatus": "pending",
  "oldDestination": "../../routing-handoff-contract.md",
  "newDestination": "../runner/contracts/routing-handoff.md",
  "alias": {
    "aliasId": "root-authorities-draft-0066",
    "fromPath": "docs/routing-handoff-contract.md",
    "toOwner": "docs/platform/runner/contracts/routing-handoff.md",
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
    "title": "Routing Handoff Contract — fgos-runner",
    "anchor": "routing-handoff-contract-fgos-runner",
    "githubAnchor": "routing-handoff-contract-fgos-runner",
    "stableAnchor": "h-c9955a9d3eec",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "8f61f45a3a22860498899b29f2bf0eeb07569c9a31ad502bf91292748ba8411a",
    "sample": "Routing Handoff Contract — fgos-runner",
    "sectionPayloadDigest": "509c09f8d9c5d789b48446cbc179231de7fa268133ade3900676a574f08732b9",
    "followingBlockDigest": "509c09f8d9c5d789b48446cbc179231de7fa268133ade3900676a574f08732b9",
    "identityFingerprint": "06f6a748d60693f65ddb820d8be808bfcb51069584514c84d7b23860fe492ed5",
    "ancestry": [],
    "text": "# Routing Handoff Contract — fgos-runner",
    "sectionText": "# Routing Handoff Contract — fgos-runner\n\nContract chuyển việc **agent ↔ agent trong chain** cho vòng lặp runner (Phase\n2, epic E3). Theo luật routing-theo-audience (`docs/platform-foundations.md`\nL4, D-ID `14ebeea9`): agent↔agent trong chain dùng **prose-handoff tường\nminh**, không JSON contract — LLM đọc prose tốt hơn parse JSON. Tài liệu này\nlà bản chốt bằng văn xuôi của contract đó cho runner cụ thể; không phải code\nruntime mới (chỉ prose + bảng)."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Routing Handoff Contract — fgos-runner",
    "anchor": "routing-handoff-contract-fgos-runner",
    "githubAnchor": "routing-handoff-contract-fgos-runner",
    "stableAnchor": "h-c9955a9d3eec",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "8a4633a098112bd85e3e30b3926de510983a1a6b5470193e311d1b0dea3b4348",
    "sample": "Routing Handoff Contract — fgos-runner",
    "sectionPayloadDigest": "e5a5e092bb246aeabc0406f30769b066d30452b4a8dbdb8c8044e70644f6b158",
    "followingBlockDigest": "2cf8b2804c543a24a8069e49f7298d2469fabb5efa38f475bfeb6782000fab7f",
    "identityFingerprint": "d45d4b80def8a3e66972203c7df464213ead01eed9ce940f52a5ee0338048be2",
    "ancestry": [],
    "text": "# Routing Handoff Contract — fgos-runner",
    "sectionText": "# Routing Handoff Contract — fgos-runner\n\n```txt\nDocument type: Contract\nAudience: Documentation migration reviewer, maintainer, agent\nPurpose: Preserve the mapped source as candidate material for conservation review\nDesign status: Candidate\nImplementation: Historical source retained; current truth not certified\nProvenance: docs/routing-handoff-contract.md at ad2ca83e245bbd76c0d275cc30366457b26c8df3\nWriter type: Agent draft writer\nCanonical: No\nCanonical for: None; candidate only\nUse this when: Reviewing conservation of the mapped legacy source\nDo not use this for: Current canonical authority or proof of implemented behavior\nLast reviewed: 2026-10-14\nRelated:\n- docs/routing-handoff-contract.md\nSupersedes: None; candidate only\nSuperseded by: None\n```\n\nContract chuyển việc **agent ↔ agent trong chain** cho vòng lặp runner (Phase\n2, epic E3). Theo luật routing-theo-audience (`docs/platform-foundations.md`\nL4, D-ID `14ebeea9`): agent↔agent trong chain dùng **prose-handoff tường\nminh**, không JSON contract — LLM đọc prose tốt hơn parse JSON. Tài liệu này\nlà bản chốt bằng văn xuôi của contract đó cho runner cụ thể; không phải code\nruntime mới (chỉ prose + bảng)."
  }
}
```

## Entry f-256: link-256

```json
{
  "id": "link-256",
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
  "reviewStatus": "pending",
  "oldDestination": "../../architect/proposals/coordination-envelope-probe-contract.md",
  "newDestination": "coordination-envelope-probe-contract.md",
  "alias": {
    "aliasId": "step10-proposals-redesigns-0373",
    "fromPath": "docs/architect/proposals/coordination-envelope-probe-contract.md",
    "toOwner": "docs/platform/proposals/coordination-envelope-probe-contract.md",
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
    "title": "Coordination Envelope — Minimal Probe Contract",
    "anchor": "coordination-envelope-minimal-probe-contract",
    "githubAnchor": "coordination-envelope-minimal-probe-contract",
    "stableAnchor": "h-78dcaf6d0cec",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "8c76171338f06c9d0f6acc6d85970beb6670faaaf86d454e8564ce49d9ce6174",
    "sample": "Coordination Envelope — Minimal Probe Contract",
    "sectionPayloadDigest": "7c151679bcf00642a62d724bd270a733013b86ab9692d1ed2f09bb0919b850f9",
    "followingBlockDigest": "79ef95bf62eb1ef673f0fb24add061315932b03844edfdcde9ced357c7f52f49",
    "identityFingerprint": "492c67797182375a477dc8cddb03384a9cf8ba88a91dd71ed4d40c3ec6e7b2df",
    "ancestry": [],
    "text": "# Coordination Envelope — Minimal Probe Contract",
    "sectionText": "# Coordination Envelope — Minimal Probe Contract\n\nDocument type: Proposal\nDesign status: Proposed\nImplementation: Not started\nLast reviewed: 2026-09-06\nCanonical for: nothing; bounded experiment specification, not a production contract\nState class: State\n\nRelated: [Conceptual architecture](coordination-capability-envelope.md),\n[Advisory execution plan](../../../plans/260905-architecture-advisory-panel/plan.md),\n[Advisory current cell](../agent-coordination/verification/architecture-advisory-panel/current-cell.md),\n[Advisory evidence index](../agent-coordination/verification/architecture-advisory-panel/index.md)."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Coordination Envelope — Minimal Probe Contract",
    "anchor": "coordination-envelope-minimal-probe-contract",
    "githubAnchor": "coordination-envelope-minimal-probe-contract",
    "stableAnchor": "h-78dcaf6d0cec",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "73c9b2b1727e37484c19f4f10f937ac217f02f3ac74c7d8f6005e0d43a5c799a",
    "sample": "Coordination Envelope — Minimal Probe Contract",
    "sectionPayloadDigest": "201b771da3ebb5b4d6e4e8ac2754dadb43c63e803709fd8a66ae373422285a2e",
    "followingBlockDigest": "e0dad9aaad66288763d79c8a8de3fa8fe8fe162eb21a38e3e0ab02eab2c4781b",
    "identityFingerprint": "6a15ef2d25718f747bafe8bf13982bcf6c374a9ce2006dbec69c59c866225198",
    "ancestry": [],
    "text": "# Coordination Envelope — Minimal Probe Contract",
    "sectionText": "# Coordination Envelope — Minimal Probe Contract\n\n```txt\nDocument type: Proposal\nAudience: Human reviewer, architect, maintainer, agent\nPurpose: Preserve mapped source text for independent conservation review\nDesign status: Candidate\nImplementation: Source snapshot retained; current implementation truth not certified\nProvenance: docs/architect/proposals/coordination-envelope-probe-contract.md at fb046210539cbcbe8ca1dab254763f5e78c573d2; blob 4dab0986384d5f813e8a502e817c9b78cd5ba716\nWriter type: Agent draft writer\nCanonical: No\nCanonical for: Nothing; non-canonical candidate conservation carrier\nUse this when: Reviewing source carriage, placement, intent and provenance\nDo not use this for: Current authority, implementation proof or cutover approval\nLast reviewed: Pending independent review\nRelated:\n- docs/architect/proposals/coordination-envelope-probe-contract.md\nSupersedes: None; legacy source remains intact\nSuperseded by: None\n```\n\nAdded in candidate: Candidate probe contract at the mapped proposals path, cited by coordination-capability-envelope.md and coordination-worker-provider-boundary.md. Execution remains unproven; the source gap observations are dated. Original source metadata and text follow. Physical relative-link destinations alone are rebased to the same repository paths. Units with inherited missing links are preserved as literal fenced source text, without substituting another design or changing any assertion. Source metadata is provenance, not candidate authority.\n\nSource relationship: [original source](coordination-envelope-probe-contract.md).\n\n\nDocument type: Proposal\nDesign status: Proposed\nImplementation: Not started\nLast reviewed: 2026-09-06\nCanonical for: nothing; bounded experiment specification, not a production contract\nState class: State\n\n````markdown\nRelated: [Conceptual architecture](coordination-capability-envelope.md),\n[Advisory execution plan](../../../plans/260905-architecture-advisory-panel/plan.md),\n[Advisory current cell](../agent-coordination/verification/architecture-advisory-panel/current-cell.md),\n[Advisory evidence index](../agent-coordination/verification/architecture-advisory-panel/index.md).\n````"
  }
}
```

## Entry f-257: link-257

```json
{
  "id": "link-257",
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
  "reviewStatus": "pending",
  "oldDestination": "../../architect/proposals/coordination-dispatch-contract.md",
  "newDestination": "coordination-dispatch-contract.md",
  "alias": {
    "aliasId": "step10-proposals-redesigns-0323",
    "fromPath": "docs/architect/proposals/coordination-dispatch-contract.md",
    "toOwner": "docs/platform/proposals/coordination-dispatch-contract.md",
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
    "title": "Coordination ↔ Dispatch & Execution Contract",
    "anchor": "coordination-dispatch-execution-contract",
    "githubAnchor": "coordination-dispatch-execution-contract",
    "stableAnchor": "h-8c937b84f370",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "42436466f569b9645c8f9c31dbead2426e207f0156f0a63aa7f74c8d7e5b51cf",
    "sample": "Coordination ↔ Dispatch & Execution Contract",
    "sectionPayloadDigest": "fe0aad6fb51708684bf3e9ebb90e2c0b11e5b93e848a1b780860c69206a6f28a",
    "followingBlockDigest": "f9e3d3073004e198e33b6d4b18e7e2d7421415706f66f829df647b48503000da",
    "identityFingerprint": "be84ea1fd034aaa7259e0e7d55a4a935472bd5e87bd4c536dc66eea2ef287f69",
    "ancestry": [],
    "text": "# Coordination ↔ Dispatch & Execution Contract",
    "sectionText": "# Coordination ↔ Dispatch & Execution Contract\n\nDocument type: Proposal\nDesign status: Discussion\nImplementation: Existing dispatch substrate; proposed coordination seam not yet accepted\nLast reviewed: 2026-09-06\nCanonical for: nothing until accepted; conceptual boundary for the current architecture review\nState class: State\n\nRelated: [Dispatch Control Plane](../agent-coordination/architecture/dispatch-control-plane.md),\n[Coordination capability envelope](coordination-capability-envelope.md),\n[Worker/provider/control boundary](coordination-worker-provider-boundary.md),\n[Progress](coordination-envelope-progress.md)."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Coordination ↔ Dispatch & Execution Contract",
    "anchor": "coordination-dispatch-execution-contract",
    "githubAnchor": "coordination-dispatch-execution-contract",
    "stableAnchor": "h-8c937b84f370",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "82e90ef583401448e13d3d31ef8d3282808450b97089263c660247a492214e75",
    "sample": "Coordination ↔ Dispatch & Execution Contract",
    "sectionPayloadDigest": "a3f9648489144deecc71ee4deb75ae9a717171ee7e156925fe1d5e686353f81d",
    "followingBlockDigest": "49d69a9eea4551d05b4a05f26df4c2bd68bbbff54d5d70427c21efaf9b94e0a1",
    "identityFingerprint": "fcd810007e0a80e0a3e35f13c614de95dddea752f298de4cb9cb6f1fa51e2bf8",
    "ancestry": [],
    "text": "# Coordination ↔ Dispatch & Execution Contract",
    "sectionText": "# Coordination ↔ Dispatch & Execution Contract\n\n```txt\nDocument type: Proposal\nAudience: Human reviewer, architect, maintainer, agent\nPurpose: Preserve mapped source text for independent conservation review\nDesign status: Candidate\nImplementation: Source snapshot retained; current implementation truth not certified\nProvenance: docs/architect/proposals/coordination-dispatch-contract.md at fb046210539cbcbe8ca1dab254763f5e78c573d2; blob 80c315d884fdf211c752f0c53d43a459d4935092\nWriter type: Agent draft writer\nCanonical: No\nCanonical for: Nothing; non-canonical candidate conservation carrier\nUse this when: Reviewing source carriage, placement, intent and provenance\nDo not use this for: Current authority, implementation proof or cutover approval\nLast reviewed: Pending independent review\nRelated:\n- docs/architect/proposals/coordination-dispatch-contract.md\nSupersedes: None; legacy source remains intact\nSuperseded by: None\n```\n\nAdded in candidate: Candidate carriage; Keep the map proposal conservatively: the shared dispatch boundary survives. No acceptance of its unbuilt coordinator-facing contract or historical observations as current truth. Original source metadata and text follow. Physical relative-link destinations alone are rebased to the same repository paths. Units with inherited missing links are preserved as literal fenced source text, without substituting another design or changing any assertion. Source metadata is provenance, not candidate authority.\n\nSource relationship: [original source](coordination-dispatch-contract.md).\n\n\nDocument type: Proposal\nDesign status: Discussion\nImplementation: Existing dispatch substrate; proposed coordination seam not yet accepted\nLast reviewed: 2026-09-06\nCanonical for: nothing until accepted; conceptual boundary for the current architecture review\nState class: State\n\nRelated: [Dispatch Control Plane](../agent-coordination/README.md),\n[Coordination capability envelope](coordination-capability-envelope.md),\n[Worker/provider/control boundary](coordination-worker-provider-boundary.md),\n[Progress](../agent-coordination/history/proposals-redesigns/coordination-envelope-progress.md)."
  }
}
```

## Entry f-258: link-258

```json
{
  "id": "link-258",
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

## Entry f-259: link-259

```json
{
  "id": "link-259",
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

## Entry f-260: link-260

```json
{
  "id": "link-260",
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
  "reviewStatus": "pending",
  "oldDestination": "../../architect/proposals/coordination-worker-provider-boundary.md",
  "newDestination": "coordination-worker-provider-boundary.md",
  "alias": {
    "aliasId": "step10-proposals-redesigns-0430",
    "fromPath": "docs/architect/proposals/coordination-worker-provider-boundary.md",
    "toOwner": "docs/platform/proposals/coordination-worker-provider-boundary.md",
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
    "title": "Coordination Envelope — Worker, Provider, and Control Boundary",
    "anchor": "coordination-envelope-worker-provider-and-control-boundary",
    "githubAnchor": "coordination-envelope-worker-provider-and-control-boundary",
    "stableAnchor": "h-9d3c2430fefc",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "024edf570bf63f77e5d5ae17ff9740b8dcef0913d2f886e3f90fbaf931b4e0fd",
    "sample": "Coordination Envelope — Worker, Provider, and Control Boundary",
    "sectionPayloadDigest": "8c2fd961d0778d0279d252c010b89f11959075a2944d848f4735cb743166355d",
    "followingBlockDigest": "bcaba1cea1679c359ea6b781b34fd3641659d2f49df0b91380843c8b8f87bbb1",
    "identityFingerprint": "38ccb5161c6d22e0835fd4f9309477546bf8e5176141a8be3318ee7f902785ef",
    "ancestry": [],
    "text": "# Coordination Envelope — Worker, Provider, and Control Boundary",
    "sectionText": "# Coordination Envelope — Worker, Provider, and Control Boundary\n\nDocument type: Proposal\nDesign status: Discussion\nImplementation: Not started; supporting OS-only probes exist\nLast reviewed: 2026-09-06\nCanonical for: nothing until accepted; minimum boundary sketch before a live probe\nState class: State\n\nRelated: [Conceptual architecture](coordination-capability-envelope.md),\n[Probe contract](coordination-envelope-probe-contract.md),\n[Progress](coordination-envelope-progress.md),\n[Capability audit](../agent-coordination/verification/coordination-envelope/capability-fit-2026-09-06.md),\n[Dispatch control plane](../agent-coordination/architecture/dispatch-control-plane.md)."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Coordination Envelope — Worker, Provider, and Control Boundary",
    "anchor": "coordination-envelope-worker-provider-and-control-boundary",
    "githubAnchor": "coordination-envelope-worker-provider-and-control-boundary",
    "stableAnchor": "h-9d3c2430fefc",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "a3af59cfe684b859097c56dc9d60c9047b985f2b53aa22ba74790eb6a727fae9",
    "sample": "Coordination Envelope — Worker, Provider, and Control Boundary",
    "sectionPayloadDigest": "fe59e4f4739487bfe32f8c9669f79b58202ce692c19903c3a4475588437e2bd8",
    "followingBlockDigest": "09882c677ec1c579968be1dbb4b7f17fd3f8e361531d2ca667b52973565915a7",
    "identityFingerprint": "949b97a33bd74b850a06c487ffdcbd1ece217d2383f50e26efa75d267e26861a",
    "ancestry": [],
    "text": "# Coordination Envelope — Worker, Provider, and Control Boundary",
    "sectionText": "# Coordination Envelope — Worker, Provider, and Control Boundary\n\n```txt\nDocument type: Proposal\nAudience: Human reviewer, architect, maintainer, agent\nPurpose: Preserve mapped source text for independent conservation review\nDesign status: Candidate\nImplementation: Source snapshot retained; current implementation truth not certified\nProvenance: docs/architect/proposals/coordination-worker-provider-boundary.md at fb046210539cbcbe8ca1dab254763f5e78c573d2; blob fae58710ab56c7e418f472c6cd318d27eb8e2258\nWriter type: Agent draft writer\nCanonical: No\nCanonical for: Nothing; non-canonical candidate conservation carrier\nUse this when: Reviewing source carriage, placement, intent and provenance\nDo not use this for: Current authority, implementation proof or cutover approval\nLast reviewed: Pending independent review\nRelated:\n- docs/architect/proposals/coordination-worker-provider-boundary.md\nSupersedes: None; legacy source remains intact\nSuperseded by: None\n```\n\nAdded in candidate: Candidate carriage; Keep map proposal in full. Supporting OS probes and private HOME are not full implementation; retain Not started statement as source metadata. Original source metadata and text follow. Physical relative-link destinations alone are rebased to the same repository paths. Units with inherited missing links are preserved as literal fenced source text, without substituting another design or changing any assertion. Source metadata is provenance, not candidate authority.\n\nSource relationship: [original source](coordination-worker-provider-boundary.md).\n\n\nDocument type: Proposal\nDesign status: Discussion\nImplementation: Not started; supporting OS-only probes exist\nLast reviewed: 2026-09-06\nCanonical for: nothing until accepted; minimum boundary sketch before a live probe\nState class: State\n\nRelated: [Conceptual architecture](coordination-capability-envelope.md),\n[Probe contract](coordination-envelope-probe-contract.md),\n[Progress](../agent-coordination/history/proposals-redesigns/coordination-envelope-progress.md),\n[Capability audit](../agent-coordination/verification/coordination-envelope/capability-fit-2026-09-06.md),\n[Dispatch control plane](../agent-coordination/README.md)."
  }
}
```

## Entry f-261: link-261

```json
{
  "id": "link-261",
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
  "reviewStatus": "pending",
  "oldDestination": "../../architect/proposals/coordination-envelope-progress.md",
  "newDestination": "../agent-coordination/history/proposals-redesigns/coordination-envelope-progress.md",
  "alias": {
    "aliasId": "step10-proposals-redesigns-0402",
    "fromPath": "docs/architect/proposals/coordination-envelope-progress.md",
    "toOwner": "docs/platform/agent-coordination/history/proposals-redesigns/coordination-envelope-progress.md",
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
    "title": "Coordination Envelope — Chat Progress and Next Work",
    "anchor": "coordination-envelope-chat-progress-and-next-work",
    "githubAnchor": "coordination-envelope-chat-progress-and-next-work",
    "stableAnchor": "h-d52f09d94cb3",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "1133b2428390c1781442953ecfa4cde1ee5f500fabf0cd583c8adc68f7323d44",
    "sample": "Coordination Envelope — Chat Progress and Next Work",
    "sectionPayloadDigest": "7812af5eaf05e2e42542fbe7727120c1ebfb24430b66cdaefc8c40697a3edfaa",
    "followingBlockDigest": "7812af5eaf05e2e42542fbe7727120c1ebfb24430b66cdaefc8c40697a3edfaa",
    "identityFingerprint": "1a73a687f9897966fadc842a8e5fd41c706da67cf86488a8f0cf62477283ebc7",
    "ancestry": [],
    "text": "# Coordination Envelope — Chat Progress and Next Work",
    "sectionText": "# Coordination Envelope — Chat Progress and Next Work\n\nDocument type: Index\nDesign status: Discussion\nImplementation: Active — conceptual review and probe preparation only\nLast reviewed: 2026-09-06\nCanonical for: progress and handoff of this advisory/probe-preparation conversation only\nState class: State — update to current reality; linked reviews/results retain their own history"
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Coordination Envelope — Chat Progress and Next Work",
    "anchor": "coordination-envelope-chat-progress-and-next-work",
    "githubAnchor": "coordination-envelope-chat-progress-and-next-work",
    "stableAnchor": "h-d52f09d94cb3",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "0682b65449b63a0fb0d54428707b21b4d3504818e46eaa60de034d1d40056072",
    "sample": "Coordination Envelope — Chat Progress and Next Work",
    "sectionPayloadDigest": "bd54299ca980fad512e981fa99e8bfcc7a7e76b98b664cc7a6be8191a049aab2",
    "followingBlockDigest": "589a3d68a25ff10843f8075d43feaf569a90fc83b27392375ee5417d9c7cc377",
    "identityFingerprint": "0106dbf1872cbf5bace285cbd7ee09a0f207876668af36ab07380042d8ab4aae",
    "ancestry": [],
    "text": "# Coordination Envelope — Chat Progress and Next Work",
    "sectionText": "# Coordination Envelope — Chat Progress and Next Work\n\n```txt\nDocument type: History\nAudience: Human reviewer, architect, maintainer, agent\nPurpose: Preserve historical source text for independent conservation review\nDesign status: Candidate\nImplementation: Source snapshot retained; current implementation truth not certified\nProvenance: docs/architect/proposals/coordination-envelope-progress.md at fb046210539cbcbe8ca1dab254763f5e78c573d2; blob 40132546e70e23fed654bf5d4cc84ea86ac3cd2b\nWriter type: Agent draft writer\nCanonical: No\nCanonical for: Nothing; non-canonical candidate conservation carrier\nUse this when: Reviewing source carriage, placement, intent and provenance\nDo not use this for: Current authority, implementation proof or cutover approval\nLast reviewed: Pending independent review\nRelated:\n- docs/architect/proposals/coordination-envelope-progress.md\nSupersedes: None; legacy source remains intact\nSuperseded by: None\n```\n\nAdded in candidate: Historical snapshot; Archive the dated handoff with provenance. Shared terms in code are not a consumer of this chat state; nothing is deleted or silently marked complete. Original source metadata and text follow. Physical relative-link destinations alone are rebased to the same repository paths. Units with inherited missing links are preserved as literal fenced source text, without substituting another design or changing any assertion. Source metadata is provenance, not candidate authority.\n\nSource relationship: [original source](../../../../architect/proposals/coordination-envelope-progress.md).\n\n\nDocument type: Index\nDesign status: Discussion\nImplementation: Active — conceptual review and probe preparation only\nLast reviewed: 2026-09-06\nCanonical for: progress and handoff of this advisory/probe-preparation conversation only\nState class: State — update to current reality; linked reviews/results retain their own history"
  }
}
```

## Entry f-262: link-262

```json
{
  "id": "link-262",
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
  "reviewStatus": "pending",
  "oldDestination": "../../architect/proposals/coordination-envelope-probe-contract.md",
  "newDestination": "coordination-envelope-probe-contract.md",
  "alias": {
    "aliasId": "step10-proposals-redesigns-0373",
    "fromPath": "docs/architect/proposals/coordination-envelope-probe-contract.md",
    "toOwner": "docs/platform/proposals/coordination-envelope-probe-contract.md",
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
    "title": "Coordination Envelope — Minimal Probe Contract",
    "anchor": "coordination-envelope-minimal-probe-contract",
    "githubAnchor": "coordination-envelope-minimal-probe-contract",
    "stableAnchor": "h-78dcaf6d0cec",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "8c76171338f06c9d0f6acc6d85970beb6670faaaf86d454e8564ce49d9ce6174",
    "sample": "Coordination Envelope — Minimal Probe Contract",
    "sectionPayloadDigest": "7c151679bcf00642a62d724bd270a733013b86ab9692d1ed2f09bb0919b850f9",
    "followingBlockDigest": "79ef95bf62eb1ef673f0fb24add061315932b03844edfdcde9ced357c7f52f49",
    "identityFingerprint": "492c67797182375a477dc8cddb03384a9cf8ba88a91dd71ed4d40c3ec6e7b2df",
    "ancestry": [],
    "text": "# Coordination Envelope — Minimal Probe Contract",
    "sectionText": "# Coordination Envelope — Minimal Probe Contract\n\nDocument type: Proposal\nDesign status: Proposed\nImplementation: Not started\nLast reviewed: 2026-09-06\nCanonical for: nothing; bounded experiment specification, not a production contract\nState class: State\n\nRelated: [Conceptual architecture](coordination-capability-envelope.md),\n[Advisory execution plan](../../../plans/260905-architecture-advisory-panel/plan.md),\n[Advisory current cell](../agent-coordination/verification/architecture-advisory-panel/current-cell.md),\n[Advisory evidence index](../agent-coordination/verification/architecture-advisory-panel/index.md)."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Coordination Envelope — Minimal Probe Contract",
    "anchor": "coordination-envelope-minimal-probe-contract",
    "githubAnchor": "coordination-envelope-minimal-probe-contract",
    "stableAnchor": "h-78dcaf6d0cec",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "73c9b2b1727e37484c19f4f10f937ac217f02f3ac74c7d8f6005e0d43a5c799a",
    "sample": "Coordination Envelope — Minimal Probe Contract",
    "sectionPayloadDigest": "201b771da3ebb5b4d6e4e8ac2754dadb43c63e803709fd8a66ae373422285a2e",
    "followingBlockDigest": "e0dad9aaad66288763d79c8a8de3fa8fe8fe162eb21a38e3e0ab02eab2c4781b",
    "identityFingerprint": "6a15ef2d25718f747bafe8bf13982bcf6c374a9ce2006dbec69c59c866225198",
    "ancestry": [],
    "text": "# Coordination Envelope — Minimal Probe Contract",
    "sectionText": "# Coordination Envelope — Minimal Probe Contract\n\n```txt\nDocument type: Proposal\nAudience: Human reviewer, architect, maintainer, agent\nPurpose: Preserve mapped source text for independent conservation review\nDesign status: Candidate\nImplementation: Source snapshot retained; current implementation truth not certified\nProvenance: docs/architect/proposals/coordination-envelope-probe-contract.md at fb046210539cbcbe8ca1dab254763f5e78c573d2; blob 4dab0986384d5f813e8a502e817c9b78cd5ba716\nWriter type: Agent draft writer\nCanonical: No\nCanonical for: Nothing; non-canonical candidate conservation carrier\nUse this when: Reviewing source carriage, placement, intent and provenance\nDo not use this for: Current authority, implementation proof or cutover approval\nLast reviewed: Pending independent review\nRelated:\n- docs/architect/proposals/coordination-envelope-probe-contract.md\nSupersedes: None; legacy source remains intact\nSuperseded by: None\n```\n\nAdded in candidate: Candidate probe contract at the mapped proposals path, cited by coordination-capability-envelope.md and coordination-worker-provider-boundary.md. Execution remains unproven; the source gap observations are dated. Original source metadata and text follow. Physical relative-link destinations alone are rebased to the same repository paths. Units with inherited missing links are preserved as literal fenced source text, without substituting another design or changing any assertion. Source metadata is provenance, not candidate authority.\n\nSource relationship: [original source](coordination-envelope-probe-contract.md).\n\n\nDocument type: Proposal\nDesign status: Proposed\nImplementation: Not started\nLast reviewed: 2026-09-06\nCanonical for: nothing; bounded experiment specification, not a production contract\nState class: State\n\n````markdown\nRelated: [Conceptual architecture](coordination-capability-envelope.md),\n[Advisory execution plan](../../../plans/260905-architecture-advisory-panel/plan.md),\n[Advisory current cell](../agent-coordination/verification/architecture-advisory-panel/current-cell.md),\n[Advisory evidence index](../agent-coordination/verification/architecture-advisory-panel/index.md).\n````"
  }
}
```

## Entry f-263: link-263

```json
{
  "id": "link-263",
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
  "reviewStatus": "pending",
  "oldDestination": "../../architect/proposals/coordination-envelope-progress.md",
  "newDestination": "../agent-coordination/history/proposals-redesigns/coordination-envelope-progress.md",
  "alias": {
    "aliasId": "step10-proposals-redesigns-0402",
    "fromPath": "docs/architect/proposals/coordination-envelope-progress.md",
    "toOwner": "docs/platform/agent-coordination/history/proposals-redesigns/coordination-envelope-progress.md",
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
    "title": "Coordination Envelope — Chat Progress and Next Work",
    "anchor": "coordination-envelope-chat-progress-and-next-work",
    "githubAnchor": "coordination-envelope-chat-progress-and-next-work",
    "stableAnchor": "h-d52f09d94cb3",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "1133b2428390c1781442953ecfa4cde1ee5f500fabf0cd583c8adc68f7323d44",
    "sample": "Coordination Envelope — Chat Progress and Next Work",
    "sectionPayloadDigest": "7812af5eaf05e2e42542fbe7727120c1ebfb24430b66cdaefc8c40697a3edfaa",
    "followingBlockDigest": "7812af5eaf05e2e42542fbe7727120c1ebfb24430b66cdaefc8c40697a3edfaa",
    "identityFingerprint": "1a73a687f9897966fadc842a8e5fd41c706da67cf86488a8f0cf62477283ebc7",
    "ancestry": [],
    "text": "# Coordination Envelope — Chat Progress and Next Work",
    "sectionText": "# Coordination Envelope — Chat Progress and Next Work\n\nDocument type: Index\nDesign status: Discussion\nImplementation: Active — conceptual review and probe preparation only\nLast reviewed: 2026-09-06\nCanonical for: progress and handoff of this advisory/probe-preparation conversation only\nState class: State — update to current reality; linked reviews/results retain their own history"
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Coordination Envelope — Chat Progress and Next Work",
    "anchor": "coordination-envelope-chat-progress-and-next-work",
    "githubAnchor": "coordination-envelope-chat-progress-and-next-work",
    "stableAnchor": "h-d52f09d94cb3",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "0682b65449b63a0fb0d54428707b21b4d3504818e46eaa60de034d1d40056072",
    "sample": "Coordination Envelope — Chat Progress and Next Work",
    "sectionPayloadDigest": "bd54299ca980fad512e981fa99e8bfcc7a7e76b98b664cc7a6be8191a049aab2",
    "followingBlockDigest": "589a3d68a25ff10843f8075d43feaf569a90fc83b27392375ee5417d9c7cc377",
    "identityFingerprint": "0106dbf1872cbf5bace285cbd7ee09a0f207876668af36ab07380042d8ab4aae",
    "ancestry": [],
    "text": "# Coordination Envelope — Chat Progress and Next Work",
    "sectionText": "# Coordination Envelope — Chat Progress and Next Work\n\n```txt\nDocument type: History\nAudience: Human reviewer, architect, maintainer, agent\nPurpose: Preserve historical source text for independent conservation review\nDesign status: Candidate\nImplementation: Source snapshot retained; current implementation truth not certified\nProvenance: docs/architect/proposals/coordination-envelope-progress.md at fb046210539cbcbe8ca1dab254763f5e78c573d2; blob 40132546e70e23fed654bf5d4cc84ea86ac3cd2b\nWriter type: Agent draft writer\nCanonical: No\nCanonical for: Nothing; non-canonical candidate conservation carrier\nUse this when: Reviewing source carriage, placement, intent and provenance\nDo not use this for: Current authority, implementation proof or cutover approval\nLast reviewed: Pending independent review\nRelated:\n- docs/architect/proposals/coordination-envelope-progress.md\nSupersedes: None; legacy source remains intact\nSuperseded by: None\n```\n\nAdded in candidate: Historical snapshot; Archive the dated handoff with provenance. Shared terms in code are not a consumer of this chat state; nothing is deleted or silently marked complete. Original source metadata and text follow. Physical relative-link destinations alone are rebased to the same repository paths. Units with inherited missing links are preserved as literal fenced source text, without substituting another design or changing any assertion. Source metadata is provenance, not candidate authority.\n\nSource relationship: [original source](../../../../architect/proposals/coordination-envelope-progress.md).\n\n\nDocument type: Index\nDesign status: Discussion\nImplementation: Active — conceptual review and probe preparation only\nLast reviewed: 2026-09-06\nCanonical for: progress and handoff of this advisory/probe-preparation conversation only\nState class: State — update to current reality; linked reviews/results retain their own history"
  }
}
```

## Entry f-264: link-264

```json
{
  "id": "link-264",
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
  "reviewStatus": "pending",
  "oldDestination": "../../architect/proposals/coordination-worker-provider-boundary.md",
  "newDestination": "coordination-worker-provider-boundary.md",
  "alias": {
    "aliasId": "step10-proposals-redesigns-0430",
    "fromPath": "docs/architect/proposals/coordination-worker-provider-boundary.md",
    "toOwner": "docs/platform/proposals/coordination-worker-provider-boundary.md",
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
    "title": "Coordination Envelope — Worker, Provider, and Control Boundary",
    "anchor": "coordination-envelope-worker-provider-and-control-boundary",
    "githubAnchor": "coordination-envelope-worker-provider-and-control-boundary",
    "stableAnchor": "h-9d3c2430fefc",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "024edf570bf63f77e5d5ae17ff9740b8dcef0913d2f886e3f90fbaf931b4e0fd",
    "sample": "Coordination Envelope — Worker, Provider, and Control Boundary",
    "sectionPayloadDigest": "8c2fd961d0778d0279d252c010b89f11959075a2944d848f4735cb743166355d",
    "followingBlockDigest": "bcaba1cea1679c359ea6b781b34fd3641659d2f49df0b91380843c8b8f87bbb1",
    "identityFingerprint": "38ccb5161c6d22e0835fd4f9309477546bf8e5176141a8be3318ee7f902785ef",
    "ancestry": [],
    "text": "# Coordination Envelope — Worker, Provider, and Control Boundary",
    "sectionText": "# Coordination Envelope — Worker, Provider, and Control Boundary\n\nDocument type: Proposal\nDesign status: Discussion\nImplementation: Not started; supporting OS-only probes exist\nLast reviewed: 2026-09-06\nCanonical for: nothing until accepted; minimum boundary sketch before a live probe\nState class: State\n\nRelated: [Conceptual architecture](coordination-capability-envelope.md),\n[Probe contract](coordination-envelope-probe-contract.md),\n[Progress](coordination-envelope-progress.md),\n[Capability audit](../agent-coordination/verification/coordination-envelope/capability-fit-2026-09-06.md),\n[Dispatch control plane](../agent-coordination/architecture/dispatch-control-plane.md)."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Coordination Envelope — Worker, Provider, and Control Boundary",
    "anchor": "coordination-envelope-worker-provider-and-control-boundary",
    "githubAnchor": "coordination-envelope-worker-provider-and-control-boundary",
    "stableAnchor": "h-9d3c2430fefc",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "a3af59cfe684b859097c56dc9d60c9047b985f2b53aa22ba74790eb6a727fae9",
    "sample": "Coordination Envelope — Worker, Provider, and Control Boundary",
    "sectionPayloadDigest": "fe59e4f4739487bfe32f8c9669f79b58202ce692c19903c3a4475588437e2bd8",
    "followingBlockDigest": "09882c677ec1c579968be1dbb4b7f17fd3f8e361531d2ca667b52973565915a7",
    "identityFingerprint": "949b97a33bd74b850a06c487ffdcbd1ece217d2383f50e26efa75d267e26861a",
    "ancestry": [],
    "text": "# Coordination Envelope — Worker, Provider, and Control Boundary",
    "sectionText": "# Coordination Envelope — Worker, Provider, and Control Boundary\n\n```txt\nDocument type: Proposal\nAudience: Human reviewer, architect, maintainer, agent\nPurpose: Preserve mapped source text for independent conservation review\nDesign status: Candidate\nImplementation: Source snapshot retained; current implementation truth not certified\nProvenance: docs/architect/proposals/coordination-worker-provider-boundary.md at fb046210539cbcbe8ca1dab254763f5e78c573d2; blob fae58710ab56c7e418f472c6cd318d27eb8e2258\nWriter type: Agent draft writer\nCanonical: No\nCanonical for: Nothing; non-canonical candidate conservation carrier\nUse this when: Reviewing source carriage, placement, intent and provenance\nDo not use this for: Current authority, implementation proof or cutover approval\nLast reviewed: Pending independent review\nRelated:\n- docs/architect/proposals/coordination-worker-provider-boundary.md\nSupersedes: None; legacy source remains intact\nSuperseded by: None\n```\n\nAdded in candidate: Candidate carriage; Keep map proposal in full. Supporting OS probes and private HOME are not full implementation; retain Not started statement as source metadata. Original source metadata and text follow. Physical relative-link destinations alone are rebased to the same repository paths. Units with inherited missing links are preserved as literal fenced source text, without substituting another design or changing any assertion. Source metadata is provenance, not candidate authority.\n\nSource relationship: [original source](coordination-worker-provider-boundary.md).\n\n\nDocument type: Proposal\nDesign status: Discussion\nImplementation: Not started; supporting OS-only probes exist\nLast reviewed: 2026-09-06\nCanonical for: nothing until accepted; minimum boundary sketch before a live probe\nState class: State\n\nRelated: [Conceptual architecture](coordination-capability-envelope.md),\n[Probe contract](coordination-envelope-probe-contract.md),\n[Progress](../agent-coordination/history/proposals-redesigns/coordination-envelope-progress.md),\n[Capability audit](../agent-coordination/verification/coordination-envelope/capability-fit-2026-09-06.md),\n[Dispatch control plane](../agent-coordination/README.md)."
  }
}
```

## Entry f-265: link-265

```json
{
  "id": "link-265",
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
  "reviewStatus": "pending",
  "oldDestination": "../../architect/proposals/coordination-worker-provider-boundary.md",
  "newDestination": "coordination-worker-provider-boundary.md",
  "alias": {
    "aliasId": "step10-proposals-redesigns-0430",
    "fromPath": "docs/architect/proposals/coordination-worker-provider-boundary.md",
    "toOwner": "docs/platform/proposals/coordination-worker-provider-boundary.md",
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
    "title": "Coordination Envelope — Worker, Provider, and Control Boundary",
    "anchor": "coordination-envelope-worker-provider-and-control-boundary",
    "githubAnchor": "coordination-envelope-worker-provider-and-control-boundary",
    "stableAnchor": "h-9d3c2430fefc",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "024edf570bf63f77e5d5ae17ff9740b8dcef0913d2f886e3f90fbaf931b4e0fd",
    "sample": "Coordination Envelope — Worker, Provider, and Control Boundary",
    "sectionPayloadDigest": "8c2fd961d0778d0279d252c010b89f11959075a2944d848f4735cb743166355d",
    "followingBlockDigest": "bcaba1cea1679c359ea6b781b34fd3641659d2f49df0b91380843c8b8f87bbb1",
    "identityFingerprint": "38ccb5161c6d22e0835fd4f9309477546bf8e5176141a8be3318ee7f902785ef",
    "ancestry": [],
    "text": "# Coordination Envelope — Worker, Provider, and Control Boundary",
    "sectionText": "# Coordination Envelope — Worker, Provider, and Control Boundary\n\nDocument type: Proposal\nDesign status: Discussion\nImplementation: Not started; supporting OS-only probes exist\nLast reviewed: 2026-09-06\nCanonical for: nothing until accepted; minimum boundary sketch before a live probe\nState class: State\n\nRelated: [Conceptual architecture](coordination-capability-envelope.md),\n[Probe contract](coordination-envelope-probe-contract.md),\n[Progress](coordination-envelope-progress.md),\n[Capability audit](../agent-coordination/verification/coordination-envelope/capability-fit-2026-09-06.md),\n[Dispatch control plane](../agent-coordination/architecture/dispatch-control-plane.md)."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Coordination Envelope — Worker, Provider, and Control Boundary",
    "anchor": "coordination-envelope-worker-provider-and-control-boundary",
    "githubAnchor": "coordination-envelope-worker-provider-and-control-boundary",
    "stableAnchor": "h-9d3c2430fefc",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "a3af59cfe684b859097c56dc9d60c9047b985f2b53aa22ba74790eb6a727fae9",
    "sample": "Coordination Envelope — Worker, Provider, and Control Boundary",
    "sectionPayloadDigest": "fe59e4f4739487bfe32f8c9669f79b58202ce692c19903c3a4475588437e2bd8",
    "followingBlockDigest": "09882c677ec1c579968be1dbb4b7f17fd3f8e361531d2ca667b52973565915a7",
    "identityFingerprint": "949b97a33bd74b850a06c487ffdcbd1ece217d2383f50e26efa75d267e26861a",
    "ancestry": [],
    "text": "# Coordination Envelope — Worker, Provider, and Control Boundary",
    "sectionText": "# Coordination Envelope — Worker, Provider, and Control Boundary\n\n```txt\nDocument type: Proposal\nAudience: Human reviewer, architect, maintainer, agent\nPurpose: Preserve mapped source text for independent conservation review\nDesign status: Candidate\nImplementation: Source snapshot retained; current implementation truth not certified\nProvenance: docs/architect/proposals/coordination-worker-provider-boundary.md at fb046210539cbcbe8ca1dab254763f5e78c573d2; blob fae58710ab56c7e418f472c6cd318d27eb8e2258\nWriter type: Agent draft writer\nCanonical: No\nCanonical for: Nothing; non-canonical candidate conservation carrier\nUse this when: Reviewing source carriage, placement, intent and provenance\nDo not use this for: Current authority, implementation proof or cutover approval\nLast reviewed: Pending independent review\nRelated:\n- docs/architect/proposals/coordination-worker-provider-boundary.md\nSupersedes: None; legacy source remains intact\nSuperseded by: None\n```\n\nAdded in candidate: Candidate carriage; Keep map proposal in full. Supporting OS probes and private HOME are not full implementation; retain Not started statement as source metadata. Original source metadata and text follow. Physical relative-link destinations alone are rebased to the same repository paths. Units with inherited missing links are preserved as literal fenced source text, without substituting another design or changing any assertion. Source metadata is provenance, not candidate authority.\n\nSource relationship: [original source](coordination-worker-provider-boundary.md).\n\n\nDocument type: Proposal\nDesign status: Discussion\nImplementation: Not started; supporting OS-only probes exist\nLast reviewed: 2026-09-06\nCanonical for: nothing until accepted; minimum boundary sketch before a live probe\nState class: State\n\nRelated: [Conceptual architecture](coordination-capability-envelope.md),\n[Probe contract](coordination-envelope-probe-contract.md),\n[Progress](../agent-coordination/history/proposals-redesigns/coordination-envelope-progress.md),\n[Capability audit](../agent-coordination/verification/coordination-envelope/capability-fit-2026-09-06.md),\n[Dispatch control plane](../agent-coordination/README.md)."
  }
}
```

## Entry f-266: link-266

```json
{
  "id": "link-266",
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

## Entry f-267: link-267

```json
{
  "id": "link-267",
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
  "reviewStatus": "pending",
  "oldDestination": "../../architect/proposals/coordination-envelope-probe-contract.md",
  "newDestination": "coordination-envelope-probe-contract.md",
  "alias": {
    "aliasId": "step10-proposals-redesigns-0373",
    "fromPath": "docs/architect/proposals/coordination-envelope-probe-contract.md",
    "toOwner": "docs/platform/proposals/coordination-envelope-probe-contract.md",
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
    "title": "Coordination Envelope — Minimal Probe Contract",
    "anchor": "coordination-envelope-minimal-probe-contract",
    "githubAnchor": "coordination-envelope-minimal-probe-contract",
    "stableAnchor": "h-78dcaf6d0cec",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "8c76171338f06c9d0f6acc6d85970beb6670faaaf86d454e8564ce49d9ce6174",
    "sample": "Coordination Envelope — Minimal Probe Contract",
    "sectionPayloadDigest": "7c151679bcf00642a62d724bd270a733013b86ab9692d1ed2f09bb0919b850f9",
    "followingBlockDigest": "79ef95bf62eb1ef673f0fb24add061315932b03844edfdcde9ced357c7f52f49",
    "identityFingerprint": "492c67797182375a477dc8cddb03384a9cf8ba88a91dd71ed4d40c3ec6e7b2df",
    "ancestry": [],
    "text": "# Coordination Envelope — Minimal Probe Contract",
    "sectionText": "# Coordination Envelope — Minimal Probe Contract\n\nDocument type: Proposal\nDesign status: Proposed\nImplementation: Not started\nLast reviewed: 2026-09-06\nCanonical for: nothing; bounded experiment specification, not a production contract\nState class: State\n\nRelated: [Conceptual architecture](coordination-capability-envelope.md),\n[Advisory execution plan](../../../plans/260905-architecture-advisory-panel/plan.md),\n[Advisory current cell](../agent-coordination/verification/architecture-advisory-panel/current-cell.md),\n[Advisory evidence index](../agent-coordination/verification/architecture-advisory-panel/index.md)."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Coordination Envelope — Minimal Probe Contract",
    "anchor": "coordination-envelope-minimal-probe-contract",
    "githubAnchor": "coordination-envelope-minimal-probe-contract",
    "stableAnchor": "h-78dcaf6d0cec",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "73c9b2b1727e37484c19f4f10f937ac217f02f3ac74c7d8f6005e0d43a5c799a",
    "sample": "Coordination Envelope — Minimal Probe Contract",
    "sectionPayloadDigest": "201b771da3ebb5b4d6e4e8ac2754dadb43c63e803709fd8a66ae373422285a2e",
    "followingBlockDigest": "e0dad9aaad66288763d79c8a8de3fa8fe8fe162eb21a38e3e0ab02eab2c4781b",
    "identityFingerprint": "6a15ef2d25718f747bafe8bf13982bcf6c374a9ce2006dbec69c59c866225198",
    "ancestry": [],
    "text": "# Coordination Envelope — Minimal Probe Contract",
    "sectionText": "# Coordination Envelope — Minimal Probe Contract\n\n```txt\nDocument type: Proposal\nAudience: Human reviewer, architect, maintainer, agent\nPurpose: Preserve mapped source text for independent conservation review\nDesign status: Candidate\nImplementation: Source snapshot retained; current implementation truth not certified\nProvenance: docs/architect/proposals/coordination-envelope-probe-contract.md at fb046210539cbcbe8ca1dab254763f5e78c573d2; blob 4dab0986384d5f813e8a502e817c9b78cd5ba716\nWriter type: Agent draft writer\nCanonical: No\nCanonical for: Nothing; non-canonical candidate conservation carrier\nUse this when: Reviewing source carriage, placement, intent and provenance\nDo not use this for: Current authority, implementation proof or cutover approval\nLast reviewed: Pending independent review\nRelated:\n- docs/architect/proposals/coordination-envelope-probe-contract.md\nSupersedes: None; legacy source remains intact\nSuperseded by: None\n```\n\nAdded in candidate: Candidate probe contract at the mapped proposals path, cited by coordination-capability-envelope.md and coordination-worker-provider-boundary.md. Execution remains unproven; the source gap observations are dated. Original source metadata and text follow. Physical relative-link destinations alone are rebased to the same repository paths. Units with inherited missing links are preserved as literal fenced source text, without substituting another design or changing any assertion. Source metadata is provenance, not candidate authority.\n\nSource relationship: [original source](coordination-envelope-probe-contract.md).\n\n\nDocument type: Proposal\nDesign status: Proposed\nImplementation: Not started\nLast reviewed: 2026-09-06\nCanonical for: nothing; bounded experiment specification, not a production contract\nState class: State\n\n````markdown\nRelated: [Conceptual architecture](coordination-capability-envelope.md),\n[Advisory execution plan](../../../plans/260905-architecture-advisory-panel/plan.md),\n[Advisory current cell](../agent-coordination/verification/architecture-advisory-panel/current-cell.md),\n[Advisory evidence index](../agent-coordination/verification/architecture-advisory-panel/index.md).\n````"
  }
}
```

## Entry f-268: link-268

```json
{
  "id": "link-268",
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
  "reviewStatus": "pending",
  "oldDestination": "../../architect/proposals/coordination-envelope-progress.md",
  "newDestination": "../agent-coordination/history/proposals-redesigns/coordination-envelope-progress.md",
  "alias": {
    "aliasId": "step10-proposals-redesigns-0402",
    "fromPath": "docs/architect/proposals/coordination-envelope-progress.md",
    "toOwner": "docs/platform/agent-coordination/history/proposals-redesigns/coordination-envelope-progress.md",
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
    "title": "Coordination Envelope — Chat Progress and Next Work",
    "anchor": "coordination-envelope-chat-progress-and-next-work",
    "githubAnchor": "coordination-envelope-chat-progress-and-next-work",
    "stableAnchor": "h-d52f09d94cb3",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "1133b2428390c1781442953ecfa4cde1ee5f500fabf0cd583c8adc68f7323d44",
    "sample": "Coordination Envelope — Chat Progress and Next Work",
    "sectionPayloadDigest": "7812af5eaf05e2e42542fbe7727120c1ebfb24430b66cdaefc8c40697a3edfaa",
    "followingBlockDigest": "7812af5eaf05e2e42542fbe7727120c1ebfb24430b66cdaefc8c40697a3edfaa",
    "identityFingerprint": "1a73a687f9897966fadc842a8e5fd41c706da67cf86488a8f0cf62477283ebc7",
    "ancestry": [],
    "text": "# Coordination Envelope — Chat Progress and Next Work",
    "sectionText": "# Coordination Envelope — Chat Progress and Next Work\n\nDocument type: Index\nDesign status: Discussion\nImplementation: Active — conceptual review and probe preparation only\nLast reviewed: 2026-09-06\nCanonical for: progress and handoff of this advisory/probe-preparation conversation only\nState class: State — update to current reality; linked reviews/results retain their own history"
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Coordination Envelope — Chat Progress and Next Work",
    "anchor": "coordination-envelope-chat-progress-and-next-work",
    "githubAnchor": "coordination-envelope-chat-progress-and-next-work",
    "stableAnchor": "h-d52f09d94cb3",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "0682b65449b63a0fb0d54428707b21b4d3504818e46eaa60de034d1d40056072",
    "sample": "Coordination Envelope — Chat Progress and Next Work",
    "sectionPayloadDigest": "bd54299ca980fad512e981fa99e8bfcc7a7e76b98b664cc7a6be8191a049aab2",
    "followingBlockDigest": "589a3d68a25ff10843f8075d43feaf569a90fc83b27392375ee5417d9c7cc377",
    "identityFingerprint": "0106dbf1872cbf5bace285cbd7ee09a0f207876668af36ab07380042d8ab4aae",
    "ancestry": [],
    "text": "# Coordination Envelope — Chat Progress and Next Work",
    "sectionText": "# Coordination Envelope — Chat Progress and Next Work\n\n```txt\nDocument type: History\nAudience: Human reviewer, architect, maintainer, agent\nPurpose: Preserve historical source text for independent conservation review\nDesign status: Candidate\nImplementation: Source snapshot retained; current implementation truth not certified\nProvenance: docs/architect/proposals/coordination-envelope-progress.md at fb046210539cbcbe8ca1dab254763f5e78c573d2; blob 40132546e70e23fed654bf5d4cc84ea86ac3cd2b\nWriter type: Agent draft writer\nCanonical: No\nCanonical for: Nothing; non-canonical candidate conservation carrier\nUse this when: Reviewing source carriage, placement, intent and provenance\nDo not use this for: Current authority, implementation proof or cutover approval\nLast reviewed: Pending independent review\nRelated:\n- docs/architect/proposals/coordination-envelope-progress.md\nSupersedes: None; legacy source remains intact\nSuperseded by: None\n```\n\nAdded in candidate: Historical snapshot; Archive the dated handoff with provenance. Shared terms in code are not a consumer of this chat state; nothing is deleted or silently marked complete. Original source metadata and text follow. Physical relative-link destinations alone are rebased to the same repository paths. Units with inherited missing links are preserved as literal fenced source text, without substituting another design or changing any assertion. Source metadata is provenance, not candidate authority.\n\nSource relationship: [original source](../../../../architect/proposals/coordination-envelope-progress.md).\n\n\nDocument type: Index\nDesign status: Discussion\nImplementation: Active — conceptual review and probe preparation only\nLast reviewed: 2026-09-06\nCanonical for: progress and handoff of this advisory/probe-preparation conversation only\nState class: State — update to current reality; linked reviews/results retain their own history"
  }
}
```

## Entry f-269: link-269

```json
{
  "id": "link-269",
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
  "reviewStatus": "pending",
  "oldDestination": "../../architect/agent-coordination/verification/coordination-envelope/capability-fit-2026-09-06.md",
  "newDestination": "../agent-coordination/verification/coordination-envelope/capability-fit-2026-09-06.md",
  "alias": {
    "aliasId": "step10-agent-coordination-3861",
    "fromPath": "docs/architect/agent-coordination/verification/coordination-envelope/capability-fit-2026-09-06.md",
    "toOwner": "docs/platform/agent-coordination/verification/coordination-envelope/capability-fit-2026-09-06.md",
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
    "title": "Coordination Envelope — Capability Fit, 2026-09-06",
    "anchor": "coordination-envelope-capability-fit-2026-09-06",
    "githubAnchor": "coordination-envelope-capability-fit-2026-09-06",
    "stableAnchor": "h-0f7bc08f1455",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "f6a94f3d3140abef70c03d7a4d3ef6471fa95c3f5d7a0fee0665fb522da0ef88",
    "sample": "Coordination Envelope — Capability Fit, 2026-09-06",
    "sectionPayloadDigest": "dd38ff94814f99a5d116edb8d27aea8cc3eda0d83d371cb934671fa1b99920a2",
    "followingBlockDigest": "22f8ca1389e5d30e6d0aedfcc8df10ca03fb1b901788e80fa87faba65b2f63ab",
    "identityFingerprint": "68f3e5b7d9410fc2f1d6fad3ac9614aa323fb51662ba249f5ef5de1edeaec744",
    "ancestry": [],
    "text": "# Coordination Envelope — Capability Fit, 2026-09-06",
    "sectionText": "# Coordination Envelope — Capability Fit, 2026-09-06\n\nDocument type: Verification\nDesign status: N/A\nImplementation: Partial — static audit and no-provider probes completed\nLast reviewed: 2026-09-06\nCanonical for: evidence of this bounded audit only, not accepted architecture\nState class: Log — historical findings for this run; later runs append separate reports\n\nRelated: [Probe contract](../../../proposals/coordination-envelope-probe-contract.md),\n[Progress](../../../proposals/coordination-envelope-progress.md)."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Coordination Envelope — Capability Fit, 2026-09-06",
    "anchor": "coordination-envelope-capability-fit-2026-09-06",
    "githubAnchor": "coordination-envelope-capability-fit-2026-09-06",
    "stableAnchor": "h-0f7bc08f1455",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "f6a94f3d3140abef70c03d7a4d3ef6471fa95c3f5d7a0fee0665fb522da0ef88",
    "sample": "Coordination Envelope — Capability Fit, 2026-09-06",
    "sectionPayloadDigest": "dd38ff94814f99a5d116edb8d27aea8cc3eda0d83d371cb934671fa1b99920a2",
    "followingBlockDigest": "22f8ca1389e5d30e6d0aedfcc8df10ca03fb1b901788e80fa87faba65b2f63ab",
    "identityFingerprint": "68f3e5b7d9410fc2f1d6fad3ac9614aa323fb51662ba249f5ef5de1edeaec744",
    "ancestry": [],
    "text": "# Coordination Envelope — Capability Fit, 2026-09-06",
    "sectionText": "# Coordination Envelope — Capability Fit, 2026-09-06\n\nDocument type: Verification\nDesign status: N/A\nImplementation: Partial — static audit and no-provider probes completed\nLast reviewed: 2026-09-06\nCanonical for: evidence of this bounded audit only, not accepted architecture\nState class: Log — historical findings for this run; later runs append separate reports\n\nRelated: [Probe contract](../../../proposals/coordination-envelope-probe-contract.md),\n[Progress](../../../proposals/coordination-envelope-progress.md)."
  }
}
```

## Entry f-270: link-270

```json
{
  "id": "link-270",
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

## Entry f-271: link-271

```json
{
  "id": "link-271",
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
  "reviewStatus": "pending",
  "oldDestination": "../../architect/agent-coordination/verification/coordination-envelope/proofs/2026-09-06-boundary/environment-result.json",
  "newDestination": "../agent-coordination/verification/coordination-envelope/proofs/2026-09-06-boundary/environment-result.json",
  "alias": {
    "aliasId": "step10-agent-coordination-3866",
    "fromPath": "docs/architect/agent-coordination/verification/coordination-envelope/proofs/2026-09-06-boundary/environment-result.json",
    "toOwner": "docs/platform/agent-coordination/verification/coordination-envelope/proofs/2026-09-06-boundary/environment-result.json",
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
  "oldReferent": null,
  "newReferent": null
}
```

## Entry f-272: link-272

```json
{
  "id": "link-272",
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
  "reviewStatus": "pending",
  "oldDestination": "../../architect/agent-coordination/verification/coordination-envelope/proofs/2026-09-06-boundary/environment.mjs",
  "newDestination": "../agent-coordination/verification/coordination-envelope/proofs/2026-09-06-boundary/environment.mjs",
  "alias": {
    "aliasId": "step10-agent-coordination-3867",
    "fromPath": "docs/architect/agent-coordination/verification/coordination-envelope/proofs/2026-09-06-boundary/environment.mjs",
    "toOwner": "docs/platform/agent-coordination/verification/coordination-envelope/proofs/2026-09-06-boundary/environment.mjs",
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
  "oldReferent": null,
  "newReferent": null
}
```

## Entry f-273: link-273

```json
{
  "id": "link-273",
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
  "reviewStatus": "pending",
  "oldDestination": "../../architect/dispatch-control-plane-redesign.md",
  "newDestination": "dispatch-control-plane-redesign.md",
  "alias": {
    "aliasId": "step10-whole-system-0431",
    "fromPath": "docs/architect/dispatch-control-plane-redesign.md",
    "toOwner": "docs/platform/proposals/dispatch-control-plane-redesign.md",
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
    "title": "Dispatch Control Plane Redesign",
    "anchor": "dispatch-control-plane-redesign",
    "githubAnchor": "dispatch-control-plane-redesign",
    "stableAnchor": "h-636c56850bf7",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "7b5d3df68b88c26058760be3ed0d7f21c05f84e1512a07212d26e953156fc154",
    "sample": "Dispatch Control Plane Redesign",
    "sectionPayloadDigest": "737c7cd0db5bd457c5405181782808ae51e2575f2d2b5a410e5f47cd694cd794",
    "followingBlockDigest": "d891da2b56463e363072ea6815fdf78455428b7587d7cdfa630a8feac814d025",
    "identityFingerprint": "63b4f77863f4b3dd3c1d549ea1643b2fa7a7ac0fabf67a692fac40b3e8082572",
    "ancestry": [],
    "text": "# Dispatch Control Plane Redesign",
    "sectionText": "# Dispatch Control Plane Redesign\n\nCanonical architecture moved to:\n\n`docs/architect/agent-coordination/architecture/dispatch-control-plane.md`\n\nThe unresolved redesign source is retained at:\n\n`docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md`\n\nFor the full related architecture set, start at:\n\n`docs/architect/agent-coordination/README.md`"
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Dispatch Control Plane Redesign",
    "anchor": "dispatch-control-plane-redesign",
    "githubAnchor": "dispatch-control-plane-redesign",
    "stableAnchor": "h-636c56850bf7",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "6924296b706081656a42acc59abe25bfe820b928e4091bc63cc9e8df1a8b0069",
    "sample": "Dispatch Control Plane Redesign",
    "sectionPayloadDigest": "78d233c32bbde30b3865e00291ec9fa3ab76b3bc802a1a0459208e2e9019134e",
    "followingBlockDigest": "66b7f7fa97b94e51a52d4c7156ed7480300db1128359cf609e1245a3f5348a3b",
    "identityFingerprint": "f6699fb49619ca219df1e72498f764df2043d502c57d2acab8e7f01fef964719",
    "ancestry": [],
    "text": "# Dispatch Control Plane Redesign",
    "sectionText": "# Dispatch Control Plane Redesign\n\n```txt\nDocument type: Proposal\nAudience: Human reviewer, architect, maintainer, agent\nPurpose: Preserve mapped source text for independent conservation review\nDesign status: Candidate\nImplementation: Source snapshot retained; current implementation truth not certified\nProvenance: docs/architect/dispatch-control-plane-redesign.md at fb046210539cbcbe8ca1dab254763f5e78c573d2; blob 6d66e789fbe1fdf433d1c9a72d8ab3de32b0f8b1\nWriter type: Agent draft writer\nCanonical: No\nCanonical for: Nothing; non-canonical candidate conservation carrier\nUse this when: Reviewing source carriage, placement, intent and provenance\nDo not use this for: Current authority, implementation proof or cutover approval\nLast reviewed: Pending independent review\nRelated:\n- docs/architect/dispatch-control-plane-redesign.md\nSupersedes: None; legacy source remains intact\nSuperseded by: None\n```\n\nAdded in candidate: Candidate pointer at the mapped proposals path; the full proposal is at docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md. The three inline-code legacy paths are retained pending cutover. Original source metadata and text follow. Physical relative-link destinations alone are rebased to the same repository paths. Units with inherited missing links are preserved as literal fenced source text, without substituting another design or changing any assertion. Source metadata is provenance, not candidate authority.\n\nSource relationship: [original source](dispatch-control-plane-redesign.md).\n\n\nCanonical architecture moved to:\n\n`docs/architect/agent-coordination/architecture/dispatch-control-plane.md`\n\nThe unresolved redesign source is retained at:\n\n`docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md`\n\nFor the full related architecture set, start at:\n\n`docs/architect/agent-coordination/README.md`"
  }
}
```

## Entry f-274: link-274

```json
{
  "id": "link-274",
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
  "reviewStatus": "pending",
  "oldDestination": "../../architect/doing-coordination-redesign.md",
  "newDestination": "doing-coordination-redesign.md",
  "alias": {
    "aliasId": "step10-whole-system-0784",
    "fromPath": "docs/architect/doing-coordination-redesign.md",
    "toOwner": "docs/platform/proposals/doing-coordination-redesign.md",
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
    "title": "Doing Coordination Redesign",
    "anchor": "doing-coordination-redesign",
    "githubAnchor": "doing-coordination-redesign",
    "stableAnchor": "h-42df17fb3f49",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "8066fd6a83a2f2acf588dad72619b8c4676ede3e398cf176b7bda3868349c394",
    "sample": "Doing Coordination Redesign",
    "sectionPayloadDigest": "cae7a3a33fa91b2f40d24e356223870d8afbc7fbb3c91eaebbce1c46ae1a8dd5",
    "followingBlockDigest": "cae7a3a33fa91b2f40d24e356223870d8afbc7fbb3c91eaebbce1c46ae1a8dd5",
    "identityFingerprint": "aefcb615df17e11ea21a831a230bfed1b7c657af57d6ed436206a1495e9baa56",
    "ancestry": [],
    "text": "# Doing Coordination Redesign",
    "sectionText": "# Doing Coordination Redesign\n\nStatus: partially implemented — shipped via tsk-40m (mergedInto main,\nmergedSha 401a2282ee381b5c2831e6f4d7538e834ada6503); §17 review checklist\nre-audited 2026-08-26 (tsk-1sl) against real `src/` state — all 14 §15\nAcceptance Criteria confirmed pass with cited evidence, zero unclassified\nhit. Known gap found live during that same audit, tracked separately as\ntsk-1ht: §16.3's own \"Settlement after durable revision drift fails or\ngoes through explicit reconcile\" only has the fail half implemented —\n`settleClaim` (src/state/store.mjs) has no reconcile path, so `fgos\nreturn` refuses for any claimed item edited mid-lifecycle (a routine,\nexpected pattern for `fgos-coding-planning`/`fgos-coding-discovering`),\neven when the same claim-holder made every edit. Reproduced live, not\ntheoretical.\nDate: 2026-08-25\nScope: fgOS work-item claim, coordination, durable event history, effective status views\nHistory: original design/implementation context lives at\ndocs/history/runtime-claim-doing-separation/ (CONTEXT.md/plan.md/RESEARCH.md);\nthat CONTEXT.md's own SUPERSEDED banner points back here for anything it\nstill locks (D1-D6), consistent with this file remaining the live spec."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Doing Coordination Redesign",
    "anchor": "doing-coordination-redesign",
    "githubAnchor": "doing-coordination-redesign",
    "stableAnchor": "h-42df17fb3f49",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "ef91148598cf3feecd511dc70a828bde34157e4025332bf7963cdd0b7c885b28",
    "sample": "Doing Coordination Redesign",
    "sectionPayloadDigest": "63258cd8dbeebdddfec93202e03088c37f69b2f27cf09bf336ba7eb218b39e4c",
    "followingBlockDigest": "615cc2b890314b0b86546a373b8034227a29671e5eddff3faa9f1bdb08956bbb",
    "identityFingerprint": "573a0f1359f0e38b9ac1d485ad81c6b3eba3bafee33271783f67da9c4c7cf445",
    "ancestry": [],
    "text": "# Doing Coordination Redesign",
    "sectionText": "# Doing Coordination Redesign\n\n```txt\nDocument type: Proposal\nAudience: Human reviewer, architect, maintainer, agent\nPurpose: Preserve mapped source text for independent conservation review\nDesign status: Candidate\nImplementation: Source snapshot retained; current implementation truth not certified\nProvenance: docs/architect/doing-coordination-redesign.md at fb046210539cbcbe8ca1dab254763f5e78c573d2; blob d2f91b320e5dbb30d68c94895936bdc739860516\nWriter type: Agent draft writer\nCanonical: No\nCanonical for: Nothing; non-canonical candidate conservation carrier\nUse this when: Reviewing source carriage, placement, intent and provenance\nDo not use this for: Current authority, implementation proof or cutover approval\nLast reviewed: Pending independent review\nRelated:\n- docs/architect/doing-coordination-redesign.md\nSupersedes: None; legacy source remains intact\nSuperseded by: None\n```\n\nAdded in candidate: Candidate carriage; Retain proposal kind at the map target; source gap/header are dated claims, not newly certified current behavior. Original source metadata and text follow. Physical relative-link destinations alone are rebased to the same repository paths. Units with inherited missing links are preserved as literal fenced source text, without substituting another design or changing any assertion. Source metadata is provenance, not candidate authority.\n\nSource relationship: [original source](doing-coordination-redesign.md).\n\n\nStatus: partially implemented — shipped via tsk-40m (mergedInto main,\nmergedSha 401a2282ee381b5c2831e6f4d7538e834ada6503); §17 review checklist\nre-audited 2026-08-26 (tsk-1sl) against real `src/` state — all 14 §15\nAcceptance Criteria confirmed pass with cited evidence, zero unclassified\nhit. Known gap found live during that same audit, tracked separately as\ntsk-1ht: §16.3's own \"Settlement after durable revision drift fails or\ngoes through explicit reconcile\" only has the fail half implemented —\n`settleClaim` (src/state/store.mjs) has no reconcile path, so `fgos\nreturn` refuses for any claimed item edited mid-lifecycle (a routine,\nexpected pattern for `fgos-coding-planning`/`fgos-coding-discovering`),\neven when the same claim-holder made every edit. Reproduced live, not\ntheoretical.\nDate: 2026-08-25\nScope: fgOS work-item claim, coordination, durable event history, effective status views\nHistory: original design/implementation context lives at\ndocs/history/runtime-claim-doing-separation/ (CONTEXT.md/plan.md/RESEARCH.md);\nthat CONTEXT.md's own SUPERSEDED banner points back here for anything it\nstill locks (D1-D6), consistent with this file remaining the live spec."
  }
}
```

## Entry f-275: link-275

```json
{
  "id": "link-275",
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
  "reviewStatus": "pending",
  "oldDestination": "../../architect/knowledge-registry-redesign.md",
  "newDestination": "knowledge-registry-redesign.md",
  "alias": {
    "aliasId": "step10-whole-system-1085",
    "fromPath": "docs/architect/knowledge-registry-redesign.md",
    "toOwner": "docs/platform/proposals/knowledge-registry-redesign.md",
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
    "title": "Knowledge Registry Redesign",
    "anchor": "knowledge-registry-redesign",
    "githubAnchor": "knowledge-registry-redesign",
    "stableAnchor": "h-3777dbb1fa76",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "cc375c4be5acee5826f56134d7ba92e21e6e55e338798fa15f1aa49f03a3c213",
    "sample": "Knowledge Registry Redesign",
    "sectionPayloadDigest": "8684029c4fe3bdd0c4bac84787e353e7f8be55e005f360bef1fd55ea47429d2c",
    "followingBlockDigest": "8684029c4fe3bdd0c4bac84787e353e7f8be55e005f360bef1fd55ea47429d2c",
    "identityFingerprint": "b5b82f9bb84e2ca40979d8d7e74f5963de8e4e265e09d1ad4a8c662d6d297152",
    "ancestry": [],
    "text": "# Knowledge Registry Redesign",
    "sectionText": "# Knowledge Registry Redesign\n\nStatus: design target\nDate: 2026-08-25\nScope: retrospective knowledge, end-user document identity, topic/doc registry, source linkage, migration, and harness enforcement"
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Knowledge Registry Redesign",
    "anchor": "knowledge-registry-redesign",
    "githubAnchor": "knowledge-registry-redesign",
    "stableAnchor": "h-3777dbb1fa76",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "09587ae01698cf5dc29441d01db34335ea71554b2e41ed8d9b217c0ccff2c827",
    "sample": "Knowledge Registry Redesign",
    "sectionPayloadDigest": "97f4ba3df5c7151585c96a72ae0d43f504cc659f69ac991e7303dba93a72a198",
    "followingBlockDigest": "9e4c17b6c249285c1ce02405dd2d682523b3601f08e55461cbb09fc17f9ca9dd",
    "identityFingerprint": "05bc0a341af70c3a88ca8d9677c34eb6222e9e5667b9500bea7ce57bc54d7e55",
    "ancestry": [],
    "text": "# Knowledge Registry Redesign",
    "sectionText": "# Knowledge Registry Redesign\n\n```txt\nDocument type: Proposal\nAudience: Human reviewer, architect, maintainer, agent\nPurpose: Preserve mapped source text for independent conservation review\nDesign status: Candidate\nImplementation: Source snapshot retained; current implementation truth not certified\nProvenance: docs/architect/knowledge-registry-redesign.md at fb046210539cbcbe8ca1dab254763f5e78c573d2; blob ace04a2ddb00e44cf28f39f1f9cfd20d37362d75\nWriter type: Agent draft writer\nCanonical: No\nCanonical for: Nothing; non-canonical candidate conservation carrier\nUse this when: Reviewing source carriage, placement, intent and provenance\nDo not use this for: Current authority, implementation proof or cutover approval\nLast reviewed: Pending independent review\nRelated:\n- docs/architect/knowledge-registry-redesign.md\nSupersedes: None; legacy source remains intact\nSuperseded by: None\n```\n\nAdded in candidate: Candidate carriage; implementation alone does not promote a design. Full truth remains owed at promotion. Physical relative-link destinations are rebased to the same repository paths. Two section 17 pointers are corrected under A19: the current knowledge skill is `domains/coding/skills/fgos-coding-knowledge/SKILL.md`, and the advisor report is `plans/reports/for-external-advisor-260825-1209-doc-identity-axis-topic-registry-design-report.md`. Other source wording and source metadata are retained; source metadata is provenance, not candidate authority.\n\nSource relationship: [original source](knowledge-registry-redesign.md).\n\n\nStatus: design target\nDate: 2026-08-25\nScope: retrospective knowledge, end-user document identity, topic/doc registry, source linkage, migration, and harness enforcement"
  }
}
```

## Entry f-276: link-276

```json
{
  "id": "link-276",
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

## Entry f-277: link-277

```json
{
  "id": "link-277",
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
  "reviewStatus": "pending",
  "oldDestination": "../../architect/agent-coordination/contracts/coordination-session.md",
  "newDestination": "../agent-coordination/history/retired-engine/files/contracts/coordination-session.md",
  "alias": {
    "aliasId": "step10-agent-coordination-0510",
    "fromPath": "docs/architect/agent-coordination/contracts/coordination-session.md",
    "toOwner": "docs/platform/agent-coordination/history/retired-engine/files/contracts/coordination-session.md",
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
    "title": "CoordinationSession Persistence And Recovery Contract",
    "anchor": "coordinationsession-persistence-and-recovery-contract",
    "githubAnchor": "coordinationsession-persistence-and-recovery-contract",
    "stableAnchor": "h-e612164009be",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "b64af06e61cf1ed7fa26e45c00728ea6273b6e9ca554d80f83bfa9859167bd3f",
    "sample": "CoordinationSession Persistence And Recovery Contract",
    "sectionPayloadDigest": "40065e2c529054c83afd96eb1304d6358289f1bc9cd4ab25c22a9ddcc3fb9ed8",
    "followingBlockDigest": "e051e0a01933ba68da53b5cc015f445282af2cc553142832f8bf5a10331e4ee2",
    "identityFingerprint": "ca7c168434334acb7d86a1c432fb2d9a8f3452202fd12dbc0ca49d154a16cd0c",
    "ancestry": [],
    "text": "# CoordinationSession Persistence And Recovery Contract",
    "sectionText": "# CoordinationSession Persistence And Recovery Contract\n\n> Migration status: This document is a legacy/current source for\n> `docs/platform/agent-coordination/contracts/coordination-session.md`. Do not edit divergent design\n> claims here without also updating the target doc or migration inventory.\n\nDocument type: Contract\nDesign status: Accepted\nImplementation: Implemented (Phase 01 R1-R8: manifest/event store, direct\nmission-lite cutover, shared engine, dynamic consult, crash-safe idempotent\nresume; Phase 03: declared-protocol dispatch on the same engine; Phase 04:\nresearch fan-out/fan-in on the same session bounds; Phase 06 R1-R4: quorum/\npartial policy, retry/replacement, crash recovery, cancellation; Phase 06\nR5-R8: uniform hard-budget enforcement across every dispatch path,\n`coordinationId` path-traversal charset validation, write-time\nforeign-evidence rejection, work-isolation static export-surface check;\nPhase 07: public CLI (`fgos coordination run/show`) and headless adapter\nboth invoking this store through the one shared engine, capability parity\nlive-proved — `src/runner/coordination/{schema,store,replay,session-engine}.mjs`,\n`src/verbs/coordination/{schema,run,show}.mjs`,\n`src/runner/coordination/headless-adapter.mjs`. Full per-phase trace:\n`docs/architect/agent-coordination/verification/step-08-standalone-coordination/index.md`.\nPhase 00 (Step 09): driver-authorized optional operations, disposition,\nrecheck-vs-retry contract text accepted — implemented across\n`step-09-group-thinking-mvp1-mvp2` Phases 01-03 (recheck-as-new-Assignment,\n`driver-disposition-recorded`, live no-Work standalone proof) and\n`step-09-mvp3-to-mvp5` Phases 00-04 (disposition ref session-ownership\nenforcement, a thin CLI launcher, intentional role-tier dispatch policy,\nand session resume through the same request door, with a foreign-writerId\nresume-hijack path closed). Full per-phase trace:\n`docs/architect/agent-coordination/verification/step-09-mvp3-to-mvp5/index.md`.\nDogfood handoff for MVP6+:\n`docs/architect/agent-coordination/playbooks/mvp6-dogfood-handoff.md`.\nPhase 07 (Step 09 MVP7): the `aggregation-validated` event, its write door,\nits replay refusals, and `closeSessionByQuorum`'s refuse-only aggregation\ninput accepted and implemented —\n`src/runner/coordination/{schema,store,replay,session-engine}.mjs` (P07.3),\nenforced at the request door and rendered by `show` in\n`src/verbs/coordination/{run,show}.mjs` (P07.4). Promoted with the named\nlimitations in Evidence-Preserving Aggregation below, not without them.\nPhase 08 (Step 09 MVP8): the `deliberation-contribution-linked` event, its\nraw and mediated write doors, its replay reconstruction and refusals, the\nderived open/resolved contribution views, and the `contribution:` ref\nnamespace on `driver-disposition-recorded` accepted and implemented —\n`src/runner/coordination/{schema,store,replay,session-engine}.mjs` (P08.2),\n`src/runner/deliberation/schema.mjs` (P08.1, called never forked), method-\nshaped proof against three real fixtures under `core/coordination-protocols/`\n(P08.3). Promoted with the named limitations in Deliberation Contribution\nLedger below, not without them.\nPhase 09 (Step 09 MVP9): the `specialist-authorized` event, its atomic\nauthorize-and-bind write door, its replay reconstruction, and the\n`specialistSlotRef` node-operation binding resolution against currently-live\nspecialist bindings accepted and implemented —\n`src/runner/coordination/{schema,store,replay,session-engine}.mjs` (P09.2,\n1 HIGH fixed: authorization expiry was gated on a caller-suppliable `round`\nthat the one real production caller never forwarded, closed by deriving the\nsession's current round internally from replayed `assignment-created`\nevents), `src/runner/definitions/schema.mjs` (P09.1, the\n`topology.specialistSlots[]` schema — see the\n[FlowDefinition Contract](flow-definition.md#specialist-slots-phase-09-step-09-mvp9)),\nnegative/crash-recovery/structural-absence proof\n(`test/runner/{coordination-specialist-binding,coordination-r7-work-isolation}.test.mjs`,\nP09.3, closing Phase 09). Promoted with the named limitations in Specialist\nSlot Binding below, not without them.\nPhase 10 (Step 09 external acceptance, closing Step 09): the multi-operation\nquorum-completion rule (`classifySessionQuorum`/`closeSessionByQuorum`,\n`session-engine.mjs`, P10-KERNEL-FIX, user-authorized) and the\nGroup-Thinking Protocol Pack (`core/protocol-packs/group-thinking.json`,\n`src/verbs/coordination/group-thinking-pack.mjs`, three registered\nprotocols, P10.1-P10.9) accepted and implemented, including the pack\nrequest door's fifth step kind (`contribution`, forwarding into\n`linkSessionContribution`) and two resolution-failure crash fixes in\n`src/verbs/coordination/run.mjs` (P10.10, closing the track). Promoted with\nthe named limitations in Multi-Operation Quorum Completion and\nGroup-Thinking Protocol Pack below, not without them. Full per-phase trace:\n`docs/architect/agent-coordination/verification/step-09-mvp6-to-mvp9/index.md`.\nPhase 03.1 (Architecture Advisory Panel track, P02.1's BL4 row): the\n`human-turn-recorded` event, its write door (`recordHumanTurn`), its replay\nre-validation, the `human-turn:` ref namespace on\n`driver-disposition-recorded`, and the `human-turn` request-step type\naccepted and implemented —\n`src/runner/coordination/{schema,store,replay}.mjs`,\n`src/verbs/coordination/{schema,run,show}.mjs`. Promoted with the named\nlimitation in Human Turn Provenance below (T6, same-privilege-level\nfabrication, cannot be closed in-process), not without it. Full trace:\n`docs/architect/agent-coordination/verification/architecture-advisory-panel/proofs/P03.1/doer-report.md`.)\nLast reviewed: 2026-09-06\nCanonical for: CoordinationSession manifest/event schema, storage layout, session-to-Assignment membership, and recovery rules\nRelated: [ADR-008](../decisions/ADR-008-coordination-session-and-mission-deferral.md), [Assignment, Run, And RunResult Contract](assignment-run-runresult.md), [Runtime Model](../architecture/runtime-model.md), [Work Integration](../architecture/work-integration.md)"
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Historical File: CoordinationSession Persistence And Recovery Contract",
    "anchor": "historical-file-coordinationsession-persistence-and-recovery-contract",
    "githubAnchor": "historical-file-coordinationsession-persistence-and-recovery-contract",
    "stableAnchor": "h-97ffcc5e7a4e",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "1e82456808db9b6906d5ad89c679a332d59efa4b56d90ee02c549b53c908e4c7",
    "sample": "Historical File: CoordinationSession Persistence And Recovery Contract",
    "sectionPayloadDigest": "96ccb65ccea490065b1592d697e4414bfa5436c78a8fe69a5764019a0161218a",
    "followingBlockDigest": "3f555c14e4947b2d468789d747a0ee9f73663f247f44a5792fc3d36c006c50bb",
    "identityFingerprint": "b3f4f18a2c09d99adcdc4a9fe8e026511ea47e55acb0f03cf32a3e59f09250fc",
    "ancestry": [],
    "text": "# Historical File: CoordinationSession Persistence And Recovery Contract",
    "sectionText": "# Historical File: CoordinationSession Persistence And Recovery Contract\n\n```txt\nDocument type: History\nAudience: Human reviewer, maintainer and documentation agent\nPurpose: Preserve the complete classified input as non-authority historical evidence\nDesign status: Candidate\nImplementation: Historical snapshot; not current implementation or authority\nProvenance: docs/platform/agent-coordination/contracts/coordination-session.md at d23045c2de83e3508fda8fd2580b43ece2e1e046; SHA256 38bfc02b54d412ba0a412f778c147915fac6305dbfaac1e05ff8f363eff20601\nWriter type: Documentation maintainer\nCanonical for: Historical evidence only; no current authority\nUse this when: Auditing original claims or section-level retirement\nDo not use this for: Current runtime behaviour, accepted proposals or executable routing\nLast reviewed: Pending independent whole-area review\nRelated:\n- docs/platform/agent-coordination/README.md\n- docs/specs/runner.md\nSupersedes: None; this is an exact historical carrier\nSuperseded by: Current execution ownership in docs/specs/runner.md\nAdded in candidate: Historical framing only; literal file bytes are unchanged\n```\n\nThe coordination engine was retired in `2180b4e72701bb090288af8fe8021008d9d42079`; see `docs/specs/runner.md` **CoordinationSession (Lịch sử — đã thu hồi per P4; thay bằng CollaborationPattern & Workflow runner)**. Original statuses and instructions below are dated evidence, not current claims."
  }
}
```

## Entry f-278: link-278

```json
{
  "id": "link-278",
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
  "reviewStatus": "pending",
  "oldDestination": "../../architect/agent-coordination/contracts/flow-definition.md",
  "newDestination": "../agent-coordination/history/retired-engine/files/contracts/flow-definition.md",
  "alias": {
    "aliasId": "step10-agent-coordination-0625",
    "fromPath": "docs/architect/agent-coordination/contracts/flow-definition.md",
    "toOwner": "docs/platform/agent-coordination/history/retired-engine/files/contracts/flow-definition.md",
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
    "title": "FlowDefinition And Profile Schema Contract",
    "anchor": "flowdefinition-and-profile-schema-contract",
    "githubAnchor": "flowdefinition-and-profile-schema-contract",
    "stableAnchor": "h-20a02acd7873",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "2c1a34c5814b7255a6ab21ee02d53b7b89b4d874ba9b1702399ab736ea3995d8",
    "sample": "FlowDefinition And Profile Schema Contract",
    "sectionPayloadDigest": "3c17336e2c054d57a956bf0cbb986ff099f632da1bb93ee20fb81e4420b366c0",
    "followingBlockDigest": "aed80f3336da674cfe568d14041d150b01c76372c7ea0c20464994166fc62258",
    "identityFingerprint": "4bdc624157452d055a9c5a803497c42112b1d1d6616b539a819d3f8521e2eb77",
    "ancestry": [],
    "text": "# FlowDefinition And Profile Schema Contract",
    "sectionText": "# FlowDefinition And Profile Schema Contract\n\n> Migration status: This document is a legacy/current source for\n> `docs/platform/agent-coordination/contracts/flow-definition.md`. Do not edit divergent design\n> claims here without also updating the target doc or migration inventory.\n\nDocument type: Contract\nDesign status: Accepted\nImplementation: Implemented (`src/runner/definitions/{schema,workflow-adapter,protocol-loader}.mjs`,\nStep 08 Phase 02; Workflow-profile projection additive at zero diff to\n`src/state/workflow-stage-graphs.mjs`; CoordinationProtocol-profile fixtures\nship in `core/coordination-protocols/` and are discoverable from a real\nexternal consuming project, proven live at P07.2 R6. Full per-phase trace:\n`docs/architect/agent-coordination/verification/step-08-standalone-coordination/index.md`.\nPhase 00 (Step 09): driver-authorized optional operations, disposition,\nrecheck-vs-retry contract text accepted — implemented across\n`step-09-group-thinking-mvp1-mvp2` Phases 01-03 (the `activation` schema\nfield, `standalone-master-coordination-loop.yaml`'s real\n`driver-authorized` bindings) and `step-09-mvp3-to-mvp5` Phase 03\n(`policy.rigor` role-tier separation for the same fixture's operations; migrated from the original field name in tier/rigor consolidation Phase 2).\nFull per-phase trace:\n`docs/architect/agent-coordination/verification/step-09-mvp3-to-mvp5/index.md`.\nPhase 06 (Step 09 MVP6): `spec.profile.topology.visibilityWindows[]` and\n`graph.nodes[].operations[].contextAccess.visibilityWindowRef` accepted and\nimplemented — schema/validation in `src/runner/definitions/schema.mjs`\n(P06.1), runtime derivation and grant enforcement in\n`src/runner/coordination/session-engine.mjs`\n(`deriveVisibilityWindowState`, P06.2 plus four fix rounds), proved against\nthe committed opt-in fixture\n`core/coordination-protocols/independent-research-fan-out-fan-in-gated.yaml`\n(P06.3, `test/runner/coordination-visibility-window-fixture.test.mjs`).\nPromoted with the named limitations in Visibility Windows below, not\nwithout them.\nPhase 07 (Step 09 MVP7): `spec.profile.completion.aggregation` accepted and\nimplemented — schema/validation in `src/runner/definitions/schema.mjs` and\nthe runtime validation door in\n`src/runner/coordination/session-engine.mjs` (P07.3), enforced at the request\ndoor in `src/verbs/coordination/run.mjs` (P07.4). Promoted with the named\nlimitations in `completion.aggregation` below and in the CoordinationSession\ncontract's own Evidence-Preserving Aggregation section, not without them.\nPhase 08 (Step 09 MVP8): `spec.operations[].contributions.allowedTypes[]`\naccepted and implemented — schema/validation in\n`src/runner/definitions/schema.mjs` (P08.3), consumed by\n`linkSessionContribution`'s real (non-vacuous) operation/type narrowing in\n`src/runner/coordination/session-engine.mjs`, proved against three committed\nopt-in fixtures under `core/coordination-protocols/deliberation-*-chain.yaml`\n(P08.3). See the CoordinationSession contract's own Deliberation\nContribution Ledger section for the runtime half.\nPhase 09 (Step 09 MVP9): `spec.profile.topology.specialistSlots[]` and\n`graph.nodes[].operations[].specialistSlotRef` accepted and implemented —\nschema/validation in `src/runner/definitions/schema.mjs` (P09.1, plus a Wave\n4 fix round closing slot-id disjointness and role/operation consistency\ngaps), runtime authorization/binding/dispatch resolution in\n`src/runner/coordination/{session-engine,store,replay}.mjs` (P09.2, 1 HIGH\nfixed — see the CoordinationSession contract's own Specialist Slot Binding\nsection), negative/crash-recovery/structural-absence proof in\n`test/runner/{coordination-specialist-binding,coordination-r7-work-isolation}.test.mjs`\n(P09.3, closing Phase 09). Promoted with the named limitations in Specialist\nSlots below and in the CoordinationSession contract's own Specialist Slot\nBinding section, not without them.\nPhase 10 (Step 09 external acceptance, closing Step 09): three new, real\nCoordinationProtocol FlowDefinitions\n(`core/coordination-protocols/group-thinking-{rfc-review-lite,\nnominal-group-lite,delphi-feedback-lite}.yaml`) exercising the MVP6-MVP9\nmechanisms above through no protocol-specific kernel branch (P10.2-P10.4),\nregistered and proven reachable through a real external Group-Thinking\nProtocol Pack (P10.1/P10.5-P10.9) — see the CoordinationSession contract's\nown Group-Thinking Protocol Pack section for the pack-layer semantics. No\nnew FlowDefinition schema field added by Phase 10; one Forbidden Fields\nSummary table row added below, closing a pre-existing contract-text gap\n(`policy.preferExecutor` illegal on a portable definition) named by P10.2's\nown Reviewer.\nFull per-phase trace:\n`docs/architect/agent-coordination/verification/step-09-mvp6-to-mvp9/index.md`.)\nLast reviewed: 2026-09-04\nCanonical for: the FlowDefinition IR schema, the Workflow/CoordinationProtocol profile discriminator, the operation primitive, and PolicyPatch provenance\nRelated: [ADR-009](../decisions/ADR-009-flow-definition-shared-ir-and-typed-profiles.md), [Protocol Model](../architecture/protocol-model.md), [Workflow Stage Operation Contract](workflow-stage-operation.md), [CoordinationSession Contract](coordination-session.md)"
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Historical File: FlowDefinition And Profile Schema Contract",
    "anchor": "historical-file-flowdefinition-and-profile-schema-contract",
    "githubAnchor": "historical-file-flowdefinition-and-profile-schema-contract",
    "stableAnchor": "h-6444298120d4",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "ff00e828d5ea4a7c36af3abca5d8a4461f7cec01efa8de6d3b750ab0a599def7",
    "sample": "Historical File: FlowDefinition And Profile Schema Contract",
    "sectionPayloadDigest": "822f1c19f24c76a90bd445f3875c0f63087e3553e516eebfc628d2eb8e350fc9",
    "followingBlockDigest": "bed733f1061e986160cfed8758eec0ac33e7fe27fa5355af74ab659df21d67fb",
    "identityFingerprint": "648f886760f2da71e6466da87bdc80b51f10c71546f9b0ffff57d19830fbc22f",
    "ancestry": [],
    "text": "# Historical File: FlowDefinition And Profile Schema Contract",
    "sectionText": "# Historical File: FlowDefinition And Profile Schema Contract\n\n```txt\nDocument type: History\nAudience: Human reviewer, maintainer and documentation agent\nPurpose: Preserve the complete classified input as non-authority historical evidence\nDesign status: Candidate\nImplementation: Historical snapshot; not current implementation or authority\nProvenance: docs/platform/agent-coordination/contracts/flow-definition.md at d23045c2de83e3508fda8fd2580b43ece2e1e046; SHA256 54d5c541879c9c2d48b2125cd702f12d9831389f84009d332190bc86ef7e18c8\nWriter type: Documentation maintainer\nCanonical for: Historical evidence only; no current authority\nUse this when: Auditing original claims or section-level retirement\nDo not use this for: Current runtime behaviour, accepted proposals or executable routing\nLast reviewed: Pending independent whole-area review\nRelated:\n- docs/platform/agent-coordination/README.md\n- docs/specs/runner.md\nSupersedes: None; this is an exact historical carrier\nSuperseded by: Current execution ownership in docs/specs/runner.md\nAdded in candidate: Historical framing only; literal file bytes are unchanged\n```\n\nThe coordination engine was retired in `2180b4e72701bb090288af8fe8021008d9d42079`; see `docs/specs/runner.md` **CoordinationSession (Lịch sử — đã thu hồi per P4; thay bằng CollaborationPattern & Workflow runner)**. Original statuses and instructions below are dated evidence, not current claims."
  }
}
```

## Entry f-279: link-279

```json
{
  "id": "link-279",
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

## Entry f-280: link-280

```json
{
  "id": "link-280",
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

## Entry f-281: link-281

```json
{
  "id": "link-281",
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
  "reviewStatus": "pending",
  "oldDestination": "../../architect/agent-coordination/architecture/coordination-foundation-baseline.md",
  "newDestination": "../agent-coordination/history/retired-engine/files/architecture/coordination-foundation-baseline.md",
  "alias": {
    "aliasId": "step10-agent-coordination-0098",
    "fromPath": "docs/architect/agent-coordination/architecture/coordination-foundation-baseline.md",
    "toOwner": "docs/platform/agent-coordination/history/retired-engine/files/architecture/coordination-foundation-baseline.md",
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
    "title": "Coordination Foundation Baseline",
    "anchor": "coordination-foundation-baseline",
    "githubAnchor": "coordination-foundation-baseline",
    "stableAnchor": "h-411a0133793c",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "e8f3e2d74f0541105654691057c17e6c57cd5a4d743bcd5ce1dd109909b39d18",
    "sample": "Coordination Foundation Baseline",
    "sectionPayloadDigest": "b69d6b2c677072d312204fff37ac00bc18d678356f0f56624deb9c0b27036c2a",
    "followingBlockDigest": "e25b7c8632d90031ba6b859abcd567a84844a749a37031774ce215c4e43c49db",
    "identityFingerprint": "d5d89fa494404a8b382756c64ef3132fcd2ef8ffb0d544c21b2ac345c88195da",
    "ancestry": [],
    "text": "# Coordination Foundation Baseline",
    "sectionText": "# Coordination Foundation Baseline\n\n> Migration status: This document is a legacy/current source for\n> `docs/platform/agent-coordination/architecture/coordination-foundation-baseline.md`. Do not edit divergent design\n> claims here without also updating the target doc or migration inventory.\n\nDocument type: Architecture\nDesign status: Accepted\nImplementation: Implemented for Steps 00-08 delivered surface; deferred items named below\nLast reviewed: 2026-09-03\nCanonical for: accepted Step 00-08 Agent Coordination foundation shape after promotion from roadmap/proposal history\n\nRelated: [Vision](../vision.md), [Runtime Model](runtime-model.md),\n[Protocol Model](protocol-model.md), [Work Integration](work-integration.md),\n[CoordinationSession Contract](../contracts/coordination-session.md),\n[FlowDefinition Contract](../contracts/flow-definition.md),\n[Team Dispatch V1 roadmap history](../roadmap/team-dispatch-v1/README.md),\n[Step 07 proposal history](../proposals/step-07-coordination-session-adhoc-task.md),\n[Step 08 proposal history](../proposals/step-08-standalone-coordination-protocols.md),\n[Team Dispatch V1 verification](../verification/team-dispatch-v1/index.md),\n[Step 08 verification](../verification/step-08-standalone-coordination/index.md),\n[Step 09 MVP1/MVP2 group-thinking verification](../verification/step-09-group-thinking-mvp1-mvp2/index.md)"
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Historical File: Coordination Foundation Baseline",
    "anchor": "historical-file-coordination-foundation-baseline",
    "githubAnchor": "historical-file-coordination-foundation-baseline",
    "stableAnchor": "h-502380625596",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "6b347969444f54c85fa7f39c270bf00f72d1cfb7636cc71f95427fba5c087a0e",
    "sample": "Historical File: Coordination Foundation Baseline",
    "sectionPayloadDigest": "beb26baa1de7102c499d9884c283f5bdab295e78171d9869e7c0604bfef708f4",
    "followingBlockDigest": "0328a4159b96e7785423acf6190622310c55a14fa9b0fbcee0c9f8f748bbe1e9",
    "identityFingerprint": "ddeb3880578fe867f58056d45300aba834dab791fd18e0aea3009efe6f60ad95",
    "ancestry": [],
    "text": "# Historical File: Coordination Foundation Baseline",
    "sectionText": "# Historical File: Coordination Foundation Baseline\n\n```txt\nDocument type: History\nAudience: Human reviewer, maintainer and documentation agent\nPurpose: Preserve the complete classified input as non-authority historical evidence\nDesign status: Candidate\nImplementation: Historical snapshot; not current implementation or authority\nProvenance: docs/platform/agent-coordination/architecture/coordination-foundation-baseline.md at d23045c2de83e3508fda8fd2580b43ece2e1e046; SHA256 2a7c083b0635c1a7679b9a5c3a3337e9c4b44cc3e3ae6ce5e5987ae9ca640b24\nWriter type: Documentation maintainer\nCanonical for: Historical evidence only; no current authority\nUse this when: Auditing original claims or section-level retirement\nDo not use this for: Current runtime behaviour, accepted proposals or executable routing\nLast reviewed: Pending independent whole-area review\nRelated:\n- docs/platform/agent-coordination/README.md\n- docs/specs/runner.md\nSupersedes: None; this is an exact historical carrier\nSuperseded by: Current execution ownership in docs/specs/runner.md\nAdded in candidate: Historical framing only; literal file bytes are unchanged\n```\n\nThe coordination engine was retired in `2180b4e72701bb090288af8fe8021008d9d42079`; see `docs/specs/runner.md` **CoordinationSession (Lịch sử — đã thu hồi per P4; thay bằng CollaborationPattern & Workflow runner)**. Original statuses and instructions below are dated evidence, not current claims."
  }
}
```

## Entry f-282: link-282

```json
{
  "id": "link-282",
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
  "reviewStatus": "pending",
  "oldDestination": "../../architect/agent-coordination/contracts/coordination-session.md",
  "newDestination": "../agent-coordination/history/retired-engine/files/contracts/coordination-session.md",
  "alias": {
    "aliasId": "step10-agent-coordination-0510",
    "fromPath": "docs/architect/agent-coordination/contracts/coordination-session.md",
    "toOwner": "docs/platform/agent-coordination/history/retired-engine/files/contracts/coordination-session.md",
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
    "title": "CoordinationSession Persistence And Recovery Contract",
    "anchor": "coordinationsession-persistence-and-recovery-contract",
    "githubAnchor": "coordinationsession-persistence-and-recovery-contract",
    "stableAnchor": "h-e612164009be",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "b64af06e61cf1ed7fa26e45c00728ea6273b6e9ca554d80f83bfa9859167bd3f",
    "sample": "CoordinationSession Persistence And Recovery Contract",
    "sectionPayloadDigest": "40065e2c529054c83afd96eb1304d6358289f1bc9cd4ab25c22a9ddcc3fb9ed8",
    "followingBlockDigest": "e051e0a01933ba68da53b5cc015f445282af2cc553142832f8bf5a10331e4ee2",
    "identityFingerprint": "ca7c168434334acb7d86a1c432fb2d9a8f3452202fd12dbc0ca49d154a16cd0c",
    "ancestry": [],
    "text": "# CoordinationSession Persistence And Recovery Contract",
    "sectionText": "# CoordinationSession Persistence And Recovery Contract\n\n> Migration status: This document is a legacy/current source for\n> `docs/platform/agent-coordination/contracts/coordination-session.md`. Do not edit divergent design\n> claims here without also updating the target doc or migration inventory.\n\nDocument type: Contract\nDesign status: Accepted\nImplementation: Implemented (Phase 01 R1-R8: manifest/event store, direct\nmission-lite cutover, shared engine, dynamic consult, crash-safe idempotent\nresume; Phase 03: declared-protocol dispatch on the same engine; Phase 04:\nresearch fan-out/fan-in on the same session bounds; Phase 06 R1-R4: quorum/\npartial policy, retry/replacement, crash recovery, cancellation; Phase 06\nR5-R8: uniform hard-budget enforcement across every dispatch path,\n`coordinationId` path-traversal charset validation, write-time\nforeign-evidence rejection, work-isolation static export-surface check;\nPhase 07: public CLI (`fgos coordination run/show`) and headless adapter\nboth invoking this store through the one shared engine, capability parity\nlive-proved — `src/runner/coordination/{schema,store,replay,session-engine}.mjs`,\n`src/verbs/coordination/{schema,run,show}.mjs`,\n`src/runner/coordination/headless-adapter.mjs`. Full per-phase trace:\n`docs/architect/agent-coordination/verification/step-08-standalone-coordination/index.md`.\nPhase 00 (Step 09): driver-authorized optional operations, disposition,\nrecheck-vs-retry contract text accepted — implemented across\n`step-09-group-thinking-mvp1-mvp2` Phases 01-03 (recheck-as-new-Assignment,\n`driver-disposition-recorded`, live no-Work standalone proof) and\n`step-09-mvp3-to-mvp5` Phases 00-04 (disposition ref session-ownership\nenforcement, a thin CLI launcher, intentional role-tier dispatch policy,\nand session resume through the same request door, with a foreign-writerId\nresume-hijack path closed). Full per-phase trace:\n`docs/architect/agent-coordination/verification/step-09-mvp3-to-mvp5/index.md`.\nDogfood handoff for MVP6+:\n`docs/architect/agent-coordination/playbooks/mvp6-dogfood-handoff.md`.\nPhase 07 (Step 09 MVP7): the `aggregation-validated` event, its write door,\nits replay refusals, and `closeSessionByQuorum`'s refuse-only aggregation\ninput accepted and implemented —\n`src/runner/coordination/{schema,store,replay,session-engine}.mjs` (P07.3),\nenforced at the request door and rendered by `show` in\n`src/verbs/coordination/{run,show}.mjs` (P07.4). Promoted with the named\nlimitations in Evidence-Preserving Aggregation below, not without them.\nPhase 08 (Step 09 MVP8): the `deliberation-contribution-linked` event, its\nraw and mediated write doors, its replay reconstruction and refusals, the\nderived open/resolved contribution views, and the `contribution:` ref\nnamespace on `driver-disposition-recorded` accepted and implemented —\n`src/runner/coordination/{schema,store,replay,session-engine}.mjs` (P08.2),\n`src/runner/deliberation/schema.mjs` (P08.1, called never forked), method-\nshaped proof against three real fixtures under `core/coordination-protocols/`\n(P08.3). Promoted with the named limitations in Deliberation Contribution\nLedger below, not without them.\nPhase 09 (Step 09 MVP9): the `specialist-authorized` event, its atomic\nauthorize-and-bind write door, its replay reconstruction, and the\n`specialistSlotRef` node-operation binding resolution against currently-live\nspecialist bindings accepted and implemented —\n`src/runner/coordination/{schema,store,replay,session-engine}.mjs` (P09.2,\n1 HIGH fixed: authorization expiry was gated on a caller-suppliable `round`\nthat the one real production caller never forwarded, closed by deriving the\nsession's current round internally from replayed `assignment-created`\nevents), `src/runner/definitions/schema.mjs` (P09.1, the\n`topology.specialistSlots[]` schema — see the\n[FlowDefinition Contract](flow-definition.md#specialist-slots-phase-09-step-09-mvp9)),\nnegative/crash-recovery/structural-absence proof\n(`test/runner/{coordination-specialist-binding,coordination-r7-work-isolation}.test.mjs`,\nP09.3, closing Phase 09). Promoted with the named limitations in Specialist\nSlot Binding below, not without them.\nPhase 10 (Step 09 external acceptance, closing Step 09): the multi-operation\nquorum-completion rule (`classifySessionQuorum`/`closeSessionByQuorum`,\n`session-engine.mjs`, P10-KERNEL-FIX, user-authorized) and the\nGroup-Thinking Protocol Pack (`core/protocol-packs/group-thinking.json`,\n`src/verbs/coordination/group-thinking-pack.mjs`, three registered\nprotocols, P10.1-P10.9) accepted and implemented, including the pack\nrequest door's fifth step kind (`contribution`, forwarding into\n`linkSessionContribution`) and two resolution-failure crash fixes in\n`src/verbs/coordination/run.mjs` (P10.10, closing the track). Promoted with\nthe named limitations in Multi-Operation Quorum Completion and\nGroup-Thinking Protocol Pack below, not without them. Full per-phase trace:\n`docs/architect/agent-coordination/verification/step-09-mvp6-to-mvp9/index.md`.\nPhase 03.1 (Architecture Advisory Panel track, P02.1's BL4 row): the\n`human-turn-recorded` event, its write door (`recordHumanTurn`), its replay\nre-validation, the `human-turn:` ref namespace on\n`driver-disposition-recorded`, and the `human-turn` request-step type\naccepted and implemented —\n`src/runner/coordination/{schema,store,replay}.mjs`,\n`src/verbs/coordination/{schema,run,show}.mjs`. Promoted with the named\nlimitation in Human Turn Provenance below (T6, same-privilege-level\nfabrication, cannot be closed in-process), not without it. Full trace:\n`docs/architect/agent-coordination/verification/architecture-advisory-panel/proofs/P03.1/doer-report.md`.)\nLast reviewed: 2026-09-06\nCanonical for: CoordinationSession manifest/event schema, storage layout, session-to-Assignment membership, and recovery rules\nRelated: [ADR-008](../decisions/ADR-008-coordination-session-and-mission-deferral.md), [Assignment, Run, And RunResult Contract](assignment-run-runresult.md), [Runtime Model](../architecture/runtime-model.md), [Work Integration](../architecture/work-integration.md)"
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Historical File: CoordinationSession Persistence And Recovery Contract",
    "anchor": "historical-file-coordinationsession-persistence-and-recovery-contract",
    "githubAnchor": "historical-file-coordinationsession-persistence-and-recovery-contract",
    "stableAnchor": "h-97ffcc5e7a4e",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "1e82456808db9b6906d5ad89c679a332d59efa4b56d90ee02c549b53c908e4c7",
    "sample": "Historical File: CoordinationSession Persistence And Recovery Contract",
    "sectionPayloadDigest": "96ccb65ccea490065b1592d697e4414bfa5436c78a8fe69a5764019a0161218a",
    "followingBlockDigest": "3f555c14e4947b2d468789d747a0ee9f73663f247f44a5792fc3d36c006c50bb",
    "identityFingerprint": "b3f4f18a2c09d99adcdc4a9fe8e026511ea47e55acb0f03cf32a3e59f09250fc",
    "ancestry": [],
    "text": "# Historical File: CoordinationSession Persistence And Recovery Contract",
    "sectionText": "# Historical File: CoordinationSession Persistence And Recovery Contract\n\n```txt\nDocument type: History\nAudience: Human reviewer, maintainer and documentation agent\nPurpose: Preserve the complete classified input as non-authority historical evidence\nDesign status: Candidate\nImplementation: Historical snapshot; not current implementation or authority\nProvenance: docs/platform/agent-coordination/contracts/coordination-session.md at d23045c2de83e3508fda8fd2580b43ece2e1e046; SHA256 38bfc02b54d412ba0a412f778c147915fac6305dbfaac1e05ff8f363eff20601\nWriter type: Documentation maintainer\nCanonical for: Historical evidence only; no current authority\nUse this when: Auditing original claims or section-level retirement\nDo not use this for: Current runtime behaviour, accepted proposals or executable routing\nLast reviewed: Pending independent whole-area review\nRelated:\n- docs/platform/agent-coordination/README.md\n- docs/specs/runner.md\nSupersedes: None; this is an exact historical carrier\nSuperseded by: Current execution ownership in docs/specs/runner.md\nAdded in candidate: Historical framing only; literal file bytes are unchanged\n```\n\nThe coordination engine was retired in `2180b4e72701bb090288af8fe8021008d9d42079`; see `docs/specs/runner.md` **CoordinationSession (Lịch sử — đã thu hồi per P4; thay bằng CollaborationPattern & Workflow runner)**. Original statuses and instructions below are dated evidence, not current claims."
  }
}
```

## Entry f-283: link-283

```json
{
  "id": "link-283",
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
  "reviewStatus": "pending",
  "oldDestination": "../../architect/agent-coordination/contracts/flow-definition.md",
  "newDestination": "../agent-coordination/history/retired-engine/files/contracts/flow-definition.md",
  "alias": {
    "aliasId": "step10-agent-coordination-0625",
    "fromPath": "docs/architect/agent-coordination/contracts/flow-definition.md",
    "toOwner": "docs/platform/agent-coordination/history/retired-engine/files/contracts/flow-definition.md",
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
    "title": "FlowDefinition And Profile Schema Contract",
    "anchor": "flowdefinition-and-profile-schema-contract",
    "githubAnchor": "flowdefinition-and-profile-schema-contract",
    "stableAnchor": "h-20a02acd7873",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "2c1a34c5814b7255a6ab21ee02d53b7b89b4d874ba9b1702399ab736ea3995d8",
    "sample": "FlowDefinition And Profile Schema Contract",
    "sectionPayloadDigest": "3c17336e2c054d57a956bf0cbb986ff099f632da1bb93ee20fb81e4420b366c0",
    "followingBlockDigest": "aed80f3336da674cfe568d14041d150b01c76372c7ea0c20464994166fc62258",
    "identityFingerprint": "4bdc624157452d055a9c5a803497c42112b1d1d6616b539a819d3f8521e2eb77",
    "ancestry": [],
    "text": "# FlowDefinition And Profile Schema Contract",
    "sectionText": "# FlowDefinition And Profile Schema Contract\n\n> Migration status: This document is a legacy/current source for\n> `docs/platform/agent-coordination/contracts/flow-definition.md`. Do not edit divergent design\n> claims here without also updating the target doc or migration inventory.\n\nDocument type: Contract\nDesign status: Accepted\nImplementation: Implemented (`src/runner/definitions/{schema,workflow-adapter,protocol-loader}.mjs`,\nStep 08 Phase 02; Workflow-profile projection additive at zero diff to\n`src/state/workflow-stage-graphs.mjs`; CoordinationProtocol-profile fixtures\nship in `core/coordination-protocols/` and are discoverable from a real\nexternal consuming project, proven live at P07.2 R6. Full per-phase trace:\n`docs/architect/agent-coordination/verification/step-08-standalone-coordination/index.md`.\nPhase 00 (Step 09): driver-authorized optional operations, disposition,\nrecheck-vs-retry contract text accepted — implemented across\n`step-09-group-thinking-mvp1-mvp2` Phases 01-03 (the `activation` schema\nfield, `standalone-master-coordination-loop.yaml`'s real\n`driver-authorized` bindings) and `step-09-mvp3-to-mvp5` Phase 03\n(`policy.rigor` role-tier separation for the same fixture's operations; migrated from the original field name in tier/rigor consolidation Phase 2).\nFull per-phase trace:\n`docs/architect/agent-coordination/verification/step-09-mvp3-to-mvp5/index.md`.\nPhase 06 (Step 09 MVP6): `spec.profile.topology.visibilityWindows[]` and\n`graph.nodes[].operations[].contextAccess.visibilityWindowRef` accepted and\nimplemented — schema/validation in `src/runner/definitions/schema.mjs`\n(P06.1), runtime derivation and grant enforcement in\n`src/runner/coordination/session-engine.mjs`\n(`deriveVisibilityWindowState`, P06.2 plus four fix rounds), proved against\nthe committed opt-in fixture\n`core/coordination-protocols/independent-research-fan-out-fan-in-gated.yaml`\n(P06.3, `test/runner/coordination-visibility-window-fixture.test.mjs`).\nPromoted with the named limitations in Visibility Windows below, not\nwithout them.\nPhase 07 (Step 09 MVP7): `spec.profile.completion.aggregation` accepted and\nimplemented — schema/validation in `src/runner/definitions/schema.mjs` and\nthe runtime validation door in\n`src/runner/coordination/session-engine.mjs` (P07.3), enforced at the request\ndoor in `src/verbs/coordination/run.mjs` (P07.4). Promoted with the named\nlimitations in `completion.aggregation` below and in the CoordinationSession\ncontract's own Evidence-Preserving Aggregation section, not without them.\nPhase 08 (Step 09 MVP8): `spec.operations[].contributions.allowedTypes[]`\naccepted and implemented — schema/validation in\n`src/runner/definitions/schema.mjs` (P08.3), consumed by\n`linkSessionContribution`'s real (non-vacuous) operation/type narrowing in\n`src/runner/coordination/session-engine.mjs`, proved against three committed\nopt-in fixtures under `core/coordination-protocols/deliberation-*-chain.yaml`\n(P08.3). See the CoordinationSession contract's own Deliberation\nContribution Ledger section for the runtime half.\nPhase 09 (Step 09 MVP9): `spec.profile.topology.specialistSlots[]` and\n`graph.nodes[].operations[].specialistSlotRef` accepted and implemented —\nschema/validation in `src/runner/definitions/schema.mjs` (P09.1, plus a Wave\n4 fix round closing slot-id disjointness and role/operation consistency\ngaps), runtime authorization/binding/dispatch resolution in\n`src/runner/coordination/{session-engine,store,replay}.mjs` (P09.2, 1 HIGH\nfixed — see the CoordinationSession contract's own Specialist Slot Binding\nsection), negative/crash-recovery/structural-absence proof in\n`test/runner/{coordination-specialist-binding,coordination-r7-work-isolation}.test.mjs`\n(P09.3, closing Phase 09). Promoted with the named limitations in Specialist\nSlots below and in the CoordinationSession contract's own Specialist Slot\nBinding section, not without them.\nPhase 10 (Step 09 external acceptance, closing Step 09): three new, real\nCoordinationProtocol FlowDefinitions\n(`core/coordination-protocols/group-thinking-{rfc-review-lite,\nnominal-group-lite,delphi-feedback-lite}.yaml`) exercising the MVP6-MVP9\nmechanisms above through no protocol-specific kernel branch (P10.2-P10.4),\nregistered and proven reachable through a real external Group-Thinking\nProtocol Pack (P10.1/P10.5-P10.9) — see the CoordinationSession contract's\nown Group-Thinking Protocol Pack section for the pack-layer semantics. No\nnew FlowDefinition schema field added by Phase 10; one Forbidden Fields\nSummary table row added below, closing a pre-existing contract-text gap\n(`policy.preferExecutor` illegal on a portable definition) named by P10.2's\nown Reviewer.\nFull per-phase trace:\n`docs/architect/agent-coordination/verification/step-09-mvp6-to-mvp9/index.md`.)\nLast reviewed: 2026-09-04\nCanonical for: the FlowDefinition IR schema, the Workflow/CoordinationProtocol profile discriminator, the operation primitive, and PolicyPatch provenance\nRelated: [ADR-009](../decisions/ADR-009-flow-definition-shared-ir-and-typed-profiles.md), [Protocol Model](../architecture/protocol-model.md), [Workflow Stage Operation Contract](workflow-stage-operation.md), [CoordinationSession Contract](coordination-session.md)"
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Historical File: FlowDefinition And Profile Schema Contract",
    "anchor": "historical-file-flowdefinition-and-profile-schema-contract",
    "githubAnchor": "historical-file-flowdefinition-and-profile-schema-contract",
    "stableAnchor": "h-6444298120d4",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "ff00e828d5ea4a7c36af3abca5d8a4461f7cec01efa8de6d3b750ab0a599def7",
    "sample": "Historical File: FlowDefinition And Profile Schema Contract",
    "sectionPayloadDigest": "822f1c19f24c76a90bd445f3875c0f63087e3553e516eebfc628d2eb8e350fc9",
    "followingBlockDigest": "bed733f1061e986160cfed8758eec0ac33e7fe27fa5355af74ab659df21d67fb",
    "identityFingerprint": "648f886760f2da71e6466da87bdc80b51f10c71546f9b0ffff57d19830fbc22f",
    "ancestry": [],
    "text": "# Historical File: FlowDefinition And Profile Schema Contract",
    "sectionText": "# Historical File: FlowDefinition And Profile Schema Contract\n\n```txt\nDocument type: History\nAudience: Human reviewer, maintainer and documentation agent\nPurpose: Preserve the complete classified input as non-authority historical evidence\nDesign status: Candidate\nImplementation: Historical snapshot; not current implementation or authority\nProvenance: docs/platform/agent-coordination/contracts/flow-definition.md at d23045c2de83e3508fda8fd2580b43ece2e1e046; SHA256 54d5c541879c9c2d48b2125cd702f12d9831389f84009d332190bc86ef7e18c8\nWriter type: Documentation maintainer\nCanonical for: Historical evidence only; no current authority\nUse this when: Auditing original claims or section-level retirement\nDo not use this for: Current runtime behaviour, accepted proposals or executable routing\nLast reviewed: Pending independent whole-area review\nRelated:\n- docs/platform/agent-coordination/README.md\n- docs/specs/runner.md\nSupersedes: None; this is an exact historical carrier\nSuperseded by: Current execution ownership in docs/specs/runner.md\nAdded in candidate: Historical framing only; literal file bytes are unchanged\n```\n\nThe coordination engine was retired in `2180b4e72701bb090288af8fe8021008d9d42079`; see `docs/specs/runner.md` **CoordinationSession (Lịch sử — đã thu hồi per P4; thay bằng CollaborationPattern & Workflow runner)**. Original statuses and instructions below are dated evidence, not current claims."
  }
}
```

## Entry f-284: link-284

```json
{
  "id": "link-284",
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
  "reviewStatus": "pending",
  "oldDestination": "../../architect/agent-coordination/proposals/team-communication-protocol-v1.md",
  "newDestination": "../agent-coordination/README.md",
  "alias": {
    "aliasId": "step10-agent-coordination-2563",
    "fromPath": "docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md",
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
    "title": "Team Communication Protocol V1",
    "anchor": "team-communication-protocol-v1",
    "githubAnchor": "team-communication-protocol-v1",
    "stableAnchor": "h-0e03651156e2",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "ef871dde37b4bbd6b5c3eebb68c086cc444629fee18930e26347af9c4c985ee9",
    "sample": "Team Communication Protocol V1",
    "sectionPayloadDigest": "a558d40c53b00d87f055de7c6054fdb72c2dfef6853d270ce2272163b3fc47ec",
    "followingBlockDigest": "4220bad0dc59218cce7c4c6953b6d2da1d93a4bb209f11fa855a298546f96816",
    "identityFingerprint": "9fd90e29e70ba409cbe2c08c966db0ee5bdfc251b4197b6383f2c4fa0c247998",
    "ancestry": [],
    "text": "# Team Communication Protocol V1",
    "sectionText": "# Team Communication Protocol V1\n\n> Migration status: This document is a legacy/current source for\n> `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md`. Do not edit divergent design\n> claims here without also updating the target doc or migration inventory.\n\nDocument type: Proposal\nDesign status: Proposed\nImplementation: Partial\nLast reviewed: 2026-08-31\nCanonical for: nothing until communication contracts are accepted\nOriginal date: 2026-08-28\nScope: role-to-role communication inside coding-domain stage protocols, Work-attached assignments, RunResult evidence, and standalone read-only coordination"
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

## Entry f-285: link-285

```json
{
  "id": "link-285",
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

## Entry f-286: link-286

```json
{
  "id": "link-286",
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

## Entry f-287: link-287

```json
{
  "id": "link-287",
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
  "reviewStatus": "pending",
  "oldDestination": "../../architect/agent-coordination/verification/step-09-group-thinking-mvp1-mvp2/index.md",
  "newDestination": "../agent-coordination/verification/step-09-group-thinking-mvp1-mvp2/index.md",
  "alias": {
    "aliasId": "step10-agent-coordination-4223",
    "fromPath": "docs/architect/agent-coordination/verification/step-09-group-thinking-mvp1-mvp2/index.md",
    "toOwner": "docs/platform/agent-coordination/verification/step-09-group-thinking-mvp1-mvp2/index.md",
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
    "title": "Track: step-09-group-thinking-mvp1-mvp2",
    "anchor": "track-step-09-group-thinking-mvp1-mvp2",
    "githubAnchor": "track-step-09-group-thinking-mvp1-mvp2",
    "stableAnchor": "h-3a8100597f81",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "8bd76e357278c6bdb03e44291dd46970d6bfe6b6f0fa5b4431c6f8982d3f3cd6",
    "sample": "Track: step-09-group-thinking-mvp1-mvp2",
    "sectionPayloadDigest": "c971eb205692469a8282ba9f0607c4f43d7ca2f1b1786cbc65f2d97a801d8c6d",
    "followingBlockDigest": "c971eb205692469a8282ba9f0607c4f43d7ca2f1b1786cbc65f2d97a801d8c6d",
    "identityFingerprint": "36247f766c3285ae59da72ffa0e2efa8b4c3958940e8fb568af6a78e71b921d9",
    "ancestry": [],
    "text": "# Track: step-09-group-thinking-mvp1-mvp2",
    "sectionText": "# Track: step-09-group-thinking-mvp1-mvp2\n\nPlan: `plans/260903-0004-step09-group-thinking-mvp1-mvp2/plan.md`\nBranch: `step-09-group-thinking-mvp1-mvp2`\nBase ref: `cd5ddeb9` (recorded after two preservation commits landed\npre-existing uncommitted prep work found in the working tree at track start —\nsee \"Preservation Commits\" below — not the literal commit the branch was cut\nfrom, `cf63f28c`; this keeps every cell's `BASE_REF..HEAD` diff clean going\nforward instead of always including the large pre-existing docs rewrite)\nTest command: `FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test 'test/**/*.test.mjs'`"
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Track: step-09-group-thinking-mvp1-mvp2",
    "anchor": "track-step-09-group-thinking-mvp1-mvp2",
    "githubAnchor": "track-step-09-group-thinking-mvp1-mvp2",
    "stableAnchor": "h-3a8100597f81",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "8bd76e357278c6bdb03e44291dd46970d6bfe6b6f0fa5b4431c6f8982d3f3cd6",
    "sample": "Track: step-09-group-thinking-mvp1-mvp2",
    "sectionPayloadDigest": "c971eb205692469a8282ba9f0607c4f43d7ca2f1b1786cbc65f2d97a801d8c6d",
    "followingBlockDigest": "c971eb205692469a8282ba9f0607c4f43d7ca2f1b1786cbc65f2d97a801d8c6d",
    "identityFingerprint": "36247f766c3285ae59da72ffa0e2efa8b4c3958940e8fb568af6a78e71b921d9",
    "ancestry": [],
    "text": "# Track: step-09-group-thinking-mvp1-mvp2",
    "sectionText": "# Track: step-09-group-thinking-mvp1-mvp2\n\nPlan: `plans/260903-0004-step09-group-thinking-mvp1-mvp2/plan.md`\nBranch: `step-09-group-thinking-mvp1-mvp2`\nBase ref: `cd5ddeb9` (recorded after two preservation commits landed\npre-existing uncommitted prep work found in the working tree at track start —\nsee \"Preservation Commits\" below — not the literal commit the branch was cut\nfrom, `cf63f28c`; this keeps every cell's `BASE_REF..HEAD` diff clean going\nforward instead of always including the large pre-existing docs rewrite)\nTest command: `FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test 'test/**/*.test.mjs'`"
  }
}
```

## Entry f-288: link-288

```json
{
  "id": "link-288",
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
  "reviewStatus": "pending",
  "oldDestination": "../../architect/agent-coordination/verification/step-09-mvp3-to-mvp5/index.md",
  "newDestination": "../agent-coordination/verification/step-09-mvp3-to-mvp5/index.md",
  "alias": {
    "aliasId": "step10-agent-coordination-4234",
    "fromPath": "docs/architect/agent-coordination/verification/step-09-mvp3-to-mvp5/index.md",
    "toOwner": "docs/platform/agent-coordination/verification/step-09-mvp3-to-mvp5/index.md",
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
    "title": "Track: step-09-mvp3-to-mvp5",
    "anchor": "track-step-09-mvp3-to-mvp5",
    "githubAnchor": "track-step-09-mvp3-to-mvp5",
    "stableAnchor": "h-f8471bcc752a",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "5e9a937f094a75a8b5815f8fefa454d2bdd85ab4e219f0f4f261cc5a089f09a8",
    "sample": "Track: step-09-mvp3-to-mvp5",
    "sectionPayloadDigest": "46d1449dd2fe960b69b8a86bd5961bbf00d73d054150e1c3c9ca36a1c2d84be0",
    "followingBlockDigest": "46d1449dd2fe960b69b8a86bd5961bbf00d73d054150e1c3c9ca36a1c2d84be0",
    "identityFingerprint": "244b6f803c71060575779efdc4135ea48ef34ce4f6e6ecc3d12c48ab7123ff68",
    "ancestry": [],
    "text": "# Track: step-09-mvp3-to-mvp5",
    "sectionText": "# Track: step-09-mvp3-to-mvp5\n\nPlan: `plans/260903-1049-step09-mvp3-to-mvp5/plan.md`\nBranch: `step-09-mvp3-to-mvp5`\nBase ref: `52a1db76` (HEAD of `main` at track start; `main` had just absorbed\nthe closed `step-09-group-thinking-mvp1-mvp2` track via merge commit\n`52a1db76` itself)\nTest command: `FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test 'test/**/*.test.mjs'`"
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Track: step-09-mvp3-to-mvp5",
    "anchor": "track-step-09-mvp3-to-mvp5",
    "githubAnchor": "track-step-09-mvp3-to-mvp5",
    "stableAnchor": "h-f8471bcc752a",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "5e9a937f094a75a8b5815f8fefa454d2bdd85ab4e219f0f4f261cc5a089f09a8",
    "sample": "Track: step-09-mvp3-to-mvp5",
    "sectionPayloadDigest": "46d1449dd2fe960b69b8a86bd5961bbf00d73d054150e1c3c9ca36a1c2d84be0",
    "followingBlockDigest": "46d1449dd2fe960b69b8a86bd5961bbf00d73d054150e1c3c9ca36a1c2d84be0",
    "identityFingerprint": "244b6f803c71060575779efdc4135ea48ef34ce4f6e6ecc3d12c48ab7123ff68",
    "ancestry": [],
    "text": "# Track: step-09-mvp3-to-mvp5",
    "sectionText": "# Track: step-09-mvp3-to-mvp5\n\nPlan: `plans/260903-1049-step09-mvp3-to-mvp5/plan.md`\nBranch: `step-09-mvp3-to-mvp5`\nBase ref: `52a1db76` (HEAD of `main` at track start; `main` had just absorbed\nthe closed `step-09-group-thinking-mvp1-mvp2` track via merge commit\n`52a1db76` itself)\nTest command: `FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test 'test/**/*.test.mjs'`"
  }
}
```

## Entry f-289: link-289

```json
{
  "id": "link-289",
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
  "reviewStatus": "pending",
  "oldDestination": "../../architect/agent-coordination/playbooks/mvp6-dogfood-handoff.md",
  "newDestination": "../agent-coordination/history/retired-engine/files/playbooks/mvp6-dogfood-handoff.md",
  "alias": {
    "aliasId": "step10-agent-coordination-1583",
    "fromPath": "docs/architect/agent-coordination/playbooks/mvp6-dogfood-handoff.md",
    "toOwner": "docs/platform/agent-coordination/history/retired-engine/files/playbooks/mvp6-dogfood-handoff.md",
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
    "title": "MVP6+ Dogfood Handoff",
    "anchor": "mvp6-dogfood-handoff",
    "githubAnchor": "mvp6-dogfood-handoff",
    "stableAnchor": "h-5817c474caa6",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "d634d0eb9027b626c653e57833837f5540ee47d57eec91bd0b4998dbd36ecd6f",
    "sample": "MVP6+ Dogfood Handoff",
    "sectionPayloadDigest": "46adb53dcd00a4759478888ac20bb36b818100f2b8bba470e1e729b320eee900",
    "followingBlockDigest": "754e7a0312e964e75ac2f8f05ee1baec0ac742a83c57752c20871ccb006d88f7",
    "identityFingerprint": "f49725539ff3ddc7e7263f86a957c4b85afafea8b0656b3126c2f20c60bc9793",
    "ancestry": [],
    "text": "# MVP6+ Dogfood Handoff",
    "sectionText": "# MVP6+ Dogfood Handoff\n\n> Migration status: This document is a legacy/current source for\n> `docs/platform/agent-coordination/playbooks/mvp6-dogfood-handoff.md`. Do not edit divergent design\n> claims here without also updating the target doc or migration inventory.\n\nDocument type: Playbook\nDesign status: N/A (records a real, already-proven runtime path; invents nothing)\nImplementation: Active for MVP3-MVP5 (produce/review/red-team/revise/recheck/close, resume); visibility windows/aggregation rules/deliberation memory/dynamic specialist pull-in are NOT implemented (see \"Future Expansion\" below)\nLast reviewed: 2026-09-03\nCanonical for: how a maintainer starts MVP6+ dogfooding (Agent Coordination coordinating its own plan/artifact review loops) through the real runtime/surface path — not a new design, not a runtime dependency\n\nRelated: [Coordination Operating Harness](coordination-operating-harness.md),\n[Master Multi-Agent Implementation Coordinator](prompts/master-coordinator.md),\n[Coordination Foundation Baseline](../architecture/coordination-foundation-baseline.md),\n[CoordinationSession Contract](../contracts/coordination-session.md),\n[FlowDefinition Contract](../contracts/flow-definition.md),\n[Thin Launcher Surface Readiness](../verification/step-09-group-thinking-mvp1-mvp2/thin-launcher-surface-readiness.md),\n[Step 09 MVP3-MVP5 verification index](../verification/step-09-mvp3-to-mvp5/index.md),\n[`docs/how-to/run-a-coordination-session.md`](../../../how-to/run-a-coordination-session.md),\n[Step 09 Group Thinking Substrate proposal](../../proposals/step-09-group-thinking-substrate.md)"
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Historical File: MVP6+ Dogfood Handoff",
    "anchor": "historical-file-mvp6-dogfood-handoff",
    "githubAnchor": "historical-file-mvp6-dogfood-handoff",
    "stableAnchor": "h-648b114298e3",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "8af73671c038b87cfdc04260c7768ccdd8854c6cd30779c34e4cbce11310b6c3",
    "sample": "Historical File: MVP6+ Dogfood Handoff",
    "sectionPayloadDigest": "79fc724f432c9fceab9ef302e601ed288de3ad6c6fefbe60a063f275bb327583",
    "followingBlockDigest": "fd8c937f239abcd9210893fb68ec2d1eef4dbe0535c5c7753bee2a04fa70c8e5",
    "identityFingerprint": "4e102b623a84c658e3ff2ec4cc1d2b111d5aa827d38d90836a603594e164ecb8",
    "ancestry": [],
    "text": "# Historical File: MVP6+ Dogfood Handoff",
    "sectionText": "# Historical File: MVP6+ Dogfood Handoff\n\n```txt\nDocument type: History\nAudience: Human reviewer, maintainer and documentation agent\nPurpose: Preserve the complete classified input as non-authority historical evidence\nDesign status: Candidate\nImplementation: Historical snapshot; not current implementation or authority\nProvenance: docs/platform/agent-coordination/playbooks/mvp6-dogfood-handoff.md at d23045c2de83e3508fda8fd2580b43ece2e1e046; SHA256 ce9a316aed566a1402b920541fedb34c06a382aa67681f4a5a3ac6f71d54c1ec\nWriter type: Documentation maintainer\nCanonical for: Historical evidence only; no current authority\nUse this when: Auditing original claims or section-level retirement\nDo not use this for: Current runtime behaviour, accepted proposals or executable routing\nLast reviewed: Pending independent whole-area review\nRelated:\n- docs/platform/agent-coordination/README.md\n- docs/specs/runner.md\nSupersedes: None; this is an exact historical carrier\nSuperseded by: Current execution ownership in docs/specs/runner.md\nAdded in candidate: Historical framing only; literal file bytes are unchanged\n```\n\nThe coordination engine was retired in `2180b4e72701bb090288af8fe8021008d9d42079`; see `docs/specs/runner.md` **CoordinationSession (Lịch sử — đã thu hồi per P4; thay bằng CollaborationPattern & Workflow runner)**. Original statuses and instructions below are dated evidence, not current claims."
  }
}
```

## Entry f-290: link-290

```json
{
  "id": "link-290",
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

## Entry f-291: link-291

```json
{
  "id": "link-291",
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
  "reviewStatus": "pending",
  "oldDestination": "../../architect/agent-coordination/playbooks/prompts/master-coordinator.md",
  "newDestination": "../agent-coordination/README.md",
  "alias": {
    "aliasId": "step10-agent-coordination-1655",
    "fromPath": "docs/architect/agent-coordination/playbooks/prompts/master-coordinator.md",
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
    "title": "Master Multi-Agent Implementation Coordinator Prompt",
    "anchor": "master-multi-agent-implementation-coordinator-prompt",
    "githubAnchor": "master-multi-agent-implementation-coordinator-prompt",
    "stableAnchor": "h-47a3e31e661d",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "05871550173fffc54a71b08fd35306b6f500a510f238887552fb7f3af420bd6d",
    "sample": "Master Multi-Agent Implementation Coordinator Prompt",
    "sectionPayloadDigest": "0079c677563098897ce208988476c5baceb31b70344eb91a0f287fa93952a93b",
    "followingBlockDigest": "2f5584ae9b3b1792f75ad76a526b6d5a525b29af27a62d13742884b865180a4b",
    "identityFingerprint": "db20c7fca96f0cc50c4f8ffe9e938d5b0489c00c552b582c2957a339a0787792",
    "ancestry": [],
    "text": "# Master Multi-Agent Implementation Coordinator Prompt",
    "sectionText": "# Master Multi-Agent Implementation Coordinator Prompt\n\n> Migration status: This document is a legacy/current source for\n> `docs/platform/agent-coordination/playbooks/prompts/master-coordinator.md`. Do not edit divergent design\n> claims here without also updating the target doc or migration inventory.\n\nDocument type: Playbook\nDesign status: N/A\nImplementation: Active\nLast reviewed: 2026-08-31\nCanonical for: one-entry manual bootstrap prompt for multi-agent implementation"
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

## Entry f-292: link-292

```json
{
  "id": "link-292",
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
  "reviewStatus": "pending",
  "oldDestination": "../../architect/agent-coordination/playbooks/coordination-operating-harness.md",
  "newDestination": "../agent-coordination/README.md",
  "alias": {
    "aliasId": "step10-agent-coordination-1488",
    "fromPath": "docs/architect/agent-coordination/playbooks/coordination-operating-harness.md",
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
    "title": "Coordination Operating Harness",
    "anchor": "coordination-operating-harness",
    "githubAnchor": "coordination-operating-harness",
    "stableAnchor": "h-888e48b4f300",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "0c32fc0a03dfcf4b5c5c98e5e6b941cadf4ae2648764e21fcb74ac7adaa0c2e5",
    "sample": "Coordination Operating Harness",
    "sectionPayloadDigest": "7a13a5116e4a441a55ef34abf2650826d8e7cc8019c65efa1ae2dac3e915fc84",
    "followingBlockDigest": "a382ce1072924fc1c1225ca4a2759acc9748a9b11ed780b438583fb91c809b82",
    "identityFingerprint": "dad5d9f065315e0f14b4fd7897f7d1137f589933ad8409cd0a8e61a468f9629b",
    "ancestry": [],
    "text": "# Coordination Operating Harness",
    "sectionText": "# Coordination Operating Harness\n\n> Migration status: This document is a legacy/current source for\n> `docs/platform/agent-coordination/playbooks/coordination-operating-harness.md`. Do not edit divergent design\n> claims here without also updating the target doc or migration inventory.\n\nDocument type: Playbook\nDesign status: N/A\nImplementation: Active\nLast reviewed: 2026-08-31\nCanonical for: coordinator/doer/reviewer/red-team operating procedure only\nOriginal date: 2026-08-31\nScope: make multi-agent implementation itself disciplined before mission-lite: coordinator/doer/reviewer/red-team roles, current-cell contracts, traceability matrix, token budget, review gates, and live proof capture"
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

## Entry f-293: link-293

```json
{
  "id": "link-293",
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

## Entry f-294: link-294

```json
{
  "id": "link-294",
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

## Entry f-295: link-295

```json
{
  "id": "link-295",
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
  "reviewStatus": "pending",
  "oldDestination": "../../architect/proposals/step-10-a0-coding-domain-boundary-facade-plan.md",
  "newDestination": "step-10-a0-coding-domain-boundary-facade-plan.md",
  "alias": {
    "aliasId": "step10-proposals-redesigns-0608",
    "fromPath": "docs/architect/proposals/step-10-a0-coding-domain-boundary-facade-plan.md",
    "toOwner": "docs/platform/proposals/step-10-a0-coding-domain-boundary-facade-plan.md",
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
    "title": "Step 10 A0 - Coding Domain Boundary And Facade Plan",
    "anchor": "step-10-a0---coding-domain-boundary-and-facade-plan",
    "githubAnchor": "step-10-a0---coding-domain-boundary-and-facade-plan",
    "stableAnchor": "h-b363c0eb493a",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "44ecb4cfb929e8cd6881bf44b2d603520efeecfe51f40e91c4c0c3b6280ba42e",
    "sample": "Step 10 A0 - Coding Domain Boundary And Facade Plan",
    "sectionPayloadDigest": "ec846590f84405384ff426a0ec24b9979deaf808b7dbe70fda6c2d58285e8d66",
    "followingBlockDigest": "29d751df228ea67a5e63494828f1de17e9116a967d1c734d2fb62e3782ee1eac",
    "identityFingerprint": "ce4774df40183d0931ebbe54bfe81597cba0aad45f25a58d566528cc61ec9a86",
    "ancestry": [],
    "text": "# Step 10 A0 - Coding Domain Boundary And Facade Plan",
    "sectionText": "# Step 10 A0 - Coding Domain Boundary And Facade Plan\n\nDocument type: Detailed architecture and execution plan\nDesign status: Draft\nImplementation: Not started\nLast reviewed: 2026-09-05\nCanonical for: detailed A0 architecture and execution plan under Step 10 until\naccepted or superseded\n\nRelated:\n- [Step 10 Coding Domain Adoption](step-10-coding-domain-adoption.md)\n- [Architect Roadmap](../roadmap.md)\n- [Workspace Topology Architecture](../workspace-topology.md)\n- [Runtime Identity And Activation](../packaging-distribution/runtime-identity-and-activation.md)\n- [System Vision: Trong Mem Ngoai Cung](../system-vision-trong-mem-ngoai-cung.md)"
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Step 10 A0 - Coding Domain Boundary And Facade Plan",
    "anchor": "step-10-a0---coding-domain-boundary-and-facade-plan",
    "githubAnchor": "step-10-a0---coding-domain-boundary-and-facade-plan",
    "stableAnchor": "h-b363c0eb493a",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "5bf2a3ef2be08019d1200bfb0822da8b451c7fda67d81ec78168b0393f1d153c",
    "sample": "Step 10 A0 - Coding Domain Boundary And Facade Plan",
    "sectionPayloadDigest": "b7157cb244b68278d2f205c0c371b2bd98cb29a1fa9812b4912aa146710b8c14",
    "followingBlockDigest": "0043498ebb467e1b81059035df6397b015e8a59601463ef77df1919a600a72e1",
    "identityFingerprint": "4bcc3a3b732429da825fb86af46d5b8a7aa52868cc7daa61194eed69d7e0e4c9",
    "ancestry": [],
    "text": "# Step 10 A0 - Coding Domain Boundary And Facade Plan",
    "sectionText": "# Step 10 A0 - Coding Domain Boundary And Facade Plan\n\n```txt\nDocument type: Proposal\nAudience: Human reviewer, architect, maintainer, agent\nPurpose: Preserve mapped source text for independent conservation review\nDesign status: Candidate\nImplementation: Source snapshot retained; current implementation truth not certified\nProvenance: docs/architect/proposals/step-10-a0-coding-domain-boundary-facade-plan.md at fb046210539cbcbe8ca1dab254763f5e78c573d2; blob e233f9878ae84ae8b23455171d80f9f4ec0acdcb\nWriter type: Agent draft writer\nCanonical: No\nCanonical for: Nothing; non-canonical candidate conservation carrier\nUse this when: Reviewing source carriage, placement, intent and provenance\nDo not use this for: Current authority, implementation proof or cutover approval\nLast reviewed: Pending independent review\nRelated:\n- docs/architect/proposals/step-10-a0-coding-domain-boundary-facade-plan.md\nSupersedes: None; legacy source remains intact\nSuperseded by: None\n```\n\nAdded in candidate: Candidate carriage; Keep map proposal; partial foundation retirement and surviving harnesses do not settle an unaccepted plan. Retain Not started and prerequisite uncertainty. Original source metadata and text follow. Physical relative-link destinations alone are rebased to the same repository paths. Units with inherited missing links are preserved as literal fenced source text, without substituting another design or changing any assertion. Source metadata is provenance, not candidate authority.\n\nSource relationship: [original source](step-10-a0-coding-domain-boundary-facade-plan.md).\n\n\nDocument type: Detailed architecture and execution plan\nDesign status: Draft\nImplementation: Not started\nLast reviewed: 2026-09-05\nCanonical for: detailed A0 architecture and execution plan under Step 10 until\naccepted or superseded\n\nRelated:\n- [Step 10 Coding Domain Adoption](step-10-coding-domain-adoption.md)\n- [Architect Roadmap](../system-architecture/architecture/roadmap.md)\n- [Workspace Topology Architecture](../system-architecture/architecture/workspace-topology.md)\n- [Runtime Identity And Activation](../packaging-distribution/README.md)\n- [System Vision: Trong Mem Ngoai Cung](../system-architecture/architecture/system-vision-trong-mem-ngoai-cung.md)"
  }
}
```

## Entry f-296: link-296

```json
{
  "id": "link-296",
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

## Entry f-297: link-297

```json
{
  "id": "link-297",
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
  "reviewStatus": "pending",
  "oldDestination": "../../architect/roadmap.md",
  "newDestination": "../system-architecture/architecture/roadmap.md",
  "alias": {
    "aliasId": "step10-whole-system-1283",
    "fromPath": "docs/architect/roadmap.md",
    "toOwner": "docs/platform/system-architecture/architecture/roadmap.md",
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
    "title": "Architect Roadmap",
    "anchor": "architect-roadmap",
    "githubAnchor": "architect-roadmap",
    "stableAnchor": "h-9d84f03a80cd",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "14baa7da6d628dddad76498d0e5564e5b5d47fff29137ebbaf924fd43ae03df7",
    "sample": "Architect Roadmap",
    "sectionPayloadDigest": "11a920dc839997ecdb8c39e25dbce833e8f71ccc9f3403188f99f4cfb0e10249",
    "followingBlockDigest": "c41500ab364afc291b7b0bff5b6373420f16251c876602e8aac50d447cc78b54",
    "identityFingerprint": "898b52031d09e0cc798c9b91c454d9614f7ce4fb07377d5afa3a17dc5c9d6ac8",
    "ancestry": [],
    "text": "# Architect Roadmap",
    "sectionText": "# Architect Roadmap\n\nDocument type: Architecture roadmap\nDesign status: Living planning document\nImplementation: Mixed\nLast reviewed: 2026-09-04\nCanonical for: sequencing architecture work under `docs/architect/`\n\nThis roadmap keeps the large architecture streams in one place so the work can\nmove in a deliberate order and still deliver quickly. It is not the product\nbacklog and it is not a task registry. Its job is to preserve sequence,\ndependency, architectural intent, and the minimum high-level plan needed to\navoid analysis drift while several cross-cutting redesigns are open at the\nsame time.\n\nThe operating principle is:\n\n```txt\nDecide the boundary first.\nWrite the smallest contract that can be implemented.\nDeliver one proof slice.\nFeed the result back into the architecture only when evidence changes it.\n```"
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Architect Roadmap",
    "anchor": "architect-roadmap",
    "githubAnchor": "architect-roadmap",
    "stableAnchor": "h-9d84f03a80cd",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "1a0f208445f489e61d09f4d14d071ffdf2264934e00885f94fc7865a9944fe7b",
    "sample": "Architect Roadmap",
    "sectionPayloadDigest": "de2a894c0006b0deb25f484cde871512a4402645d4c761d6a051cce0d6deb0eb",
    "followingBlockDigest": "76468776b88732bb4e083b27d96380bb697fc12ccd88a349be860800200ef2a0",
    "identityFingerprint": "e30b9a9cac92e615ab5805c98882c5fc63409b92ef47790dbf22ae6ae0581830",
    "ancestry": [],
    "text": "# Architect Roadmap",
    "sectionText": "# Architect Roadmap\n\n```txt\nDocument type: Architecture\nAudience: Human reviewer, architect, maintainer, agent\nPurpose: Preserve the complete roadmap.md source at its frozen-map candidate owner\nDesign status: Candidate\nImplementation: Partial — inherited source qualifications; not independently truth-verified\nProvenance: docs/architect/roadmap.md at 69dd3ee7fd84bc5e93fe9c75d63622d4f5aa8539 (blob 9f457e6a5bc4dfe7da05a6f7dec7c14aa5dc44a3)\nWriter type: Agent carriage; independent review pending\nCanonical for: Nothing until promotion; current source remains docs/architect/roadmap.md\nUse this when: Reviewing whole-system candidate carriage and placement\nDo not use this for: Inferring implementation, promotion or superseding source authority\nLast reviewed: Pending independent review\nRelated:\n- docs/architect/roadmap.md\n- docs/platform/component-boundary.md\n- docs/platform/architecture-map.md\nSupersedes: None — candidate only\nSuperseded by: None\n```\n\nAdded in candidate: migration metadata and physical link rebasing. Original source metadata, dates, design limits and historic claims below are provenance, not fresh review. Current truth is unverified; A28 requires sampled truth review at this checkpoint and full truth review at promotion.\n\n\nDocument type: Architecture roadmap\nDesign status: Living planning document\nImplementation: Mixed\nLast reviewed: 2026-09-04\nCanonical for: sequencing architecture work under `docs/architect/`\n\nThis roadmap keeps the large architecture streams in one place so the work can\nmove in a deliberate order and still deliver quickly. It is not the product\nbacklog and it is not a task registry. Its job is to preserve sequence,\ndependency, architectural intent, and the minimum high-level plan needed to\navoid analysis drift while several cross-cutting redesigns are open at the\nsame time.\n\nThe operating principle is:\n\n```txt\nDecide the boundary first.\nWrite the smallest contract that can be implemented.\nDeliver one proof slice.\nFeed the result back into the architecture only when evidence changes it.\n```"
  }
}
```

## Entry f-298: link-298

```json
{
  "id": "link-298",
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

## Entry f-299: link-299

```json
{
  "id": "link-299",
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

## Entry f-300: link-300

```json
{
  "id": "link-300",
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
  "reviewStatus": "pending",
  "oldDestination": "../../architect/system-vision-trong-mem-ngoai-cung.md",
  "newDestination": "../system-architecture/architecture/system-vision-trong-mem-ngoai-cung.md",
  "alias": {
    "aliasId": "step10-whole-system-1321",
    "fromPath": "docs/architect/system-vision-trong-mem-ngoai-cung.md",
    "toOwner": "docs/platform/system-architecture/architecture/system-vision-trong-mem-ngoai-cung.md",
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
    "title": "System Vision: Trong Mem Ngoai Cung",
    "anchor": "system-vision-trong-mem-ngoai-cung",
    "githubAnchor": "system-vision-trong-mem-ngoai-cung",
    "stableAnchor": "h-ab626936e74c",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "3c6cade55629a91704628da7ada07f43360fff62bcc6e8d1c23abae9ddce8d81",
    "sample": "System Vision: Trong Mem Ngoai Cung",
    "sectionPayloadDigest": "2d38a8b85750e2ad698eb5bada7baa91dea80b0d4f430179ebde5f51b9cb27d6",
    "followingBlockDigest": "2d38a8b85750e2ad698eb5bada7baa91dea80b0d4f430179ebde5f51b9cb27d6",
    "identityFingerprint": "5dc61095ac85b2912668b7704cb41868ec284b170af45f305a0ec1174fc8b496",
    "ancestry": [],
    "text": "# System Vision: Trong Mem Ngoai Cung",
    "sectionText": "# System Vision: Trong Mem Ngoai Cung\n\nDocument type: System-wide architecture vision\nDesign status: Guiding vision\nImplementation: Cross-cutting\nLast reviewed: 2026-09-05\nCanonical for: balancing hard runtime contracts with adaptive agent soul/prose/skill across fgOS"
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "System Vision: Trong Mem Ngoai Cung",
    "anchor": "system-vision-trong-mem-ngoai-cung",
    "githubAnchor": "system-vision-trong-mem-ngoai-cung",
    "stableAnchor": "h-ab626936e74c",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "ed8092dd2b9cd330bc467efd0472a61b70765f53bbaeab1087126c74beff1e28",
    "sample": "System Vision: Trong Mem Ngoai Cung",
    "sectionPayloadDigest": "bc7fd2bfd14a8acc8ac1b376269d2435989d8a96a91f782f625321ccb2dba5cb",
    "followingBlockDigest": "c0c113ba85ee7b2d4de003e40d27463f653fe08013463bb68aa5830df5015113",
    "identityFingerprint": "306b00634acd7d63939a1b1d49aef9b2d6f1dfb657d8094d07617964196f4048",
    "ancestry": [],
    "text": "# System Vision: Trong Mem Ngoai Cung",
    "sectionText": "# System Vision: Trong Mem Ngoai Cung\n\n```txt\nDocument type: Architecture\nAudience: Human reviewer, architect, maintainer, agent\nPurpose: Preserve the complete system-vision-trong-mem-ngoai-cung.md source at its frozen-map candidate owner\nDesign status: Candidate\nImplementation: Partial — inherited source qualifications; not independently truth-verified\nProvenance: docs/architect/system-vision-trong-mem-ngoai-cung.md at 69dd3ee7fd84bc5e93fe9c75d63622d4f5aa8539 (blob 473dd8f1f28f4573194c47ca787973c52cc65756)\nWriter type: Agent carriage; independent review pending\nCanonical for: Nothing until promotion; current source remains docs/architect/system-vision-trong-mem-ngoai-cung.md\nUse this when: Reviewing whole-system candidate carriage and placement\nDo not use this for: Inferring implementation, promotion or superseding source authority\nLast reviewed: Pending independent review\nRelated:\n- docs/architect/system-vision-trong-mem-ngoai-cung.md\n- docs/platform/component-boundary.md\n- docs/platform/architecture-map.md\nSupersedes: None — candidate only\nSuperseded by: None\n```\n\nAdded in candidate: migration metadata and physical link rebasing. Original source metadata, dates, design limits and historic claims below are provenance, not fresh review. Current truth is unverified; A28 requires sampled truth review at this checkpoint and full truth review at promotion.\n\n\nDocument type: System-wide architecture vision\nDesign status: Guiding vision\nImplementation: Cross-cutting\nLast reviewed: 2026-09-05\nCanonical for: balancing hard runtime contracts with adaptive agent soul/prose/skill across fgOS"
  }
}
```

## Entry f-301: link-301

```json
{
  "id": "link-301",
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

## Entry f-302: link-302

```json
{
  "id": "link-302",
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

## Entry f-303: link-303

```json
{
  "id": "link-303",
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
  "reviewStatus": "pending",
  "oldDestination": "../../architect/proposals/step-10-a0-coding-domain-boundary-facade-plan.md",
  "newDestination": "step-10-a0-coding-domain-boundary-facade-plan.md",
  "alias": {
    "aliasId": "step10-proposals-redesigns-0608",
    "fromPath": "docs/architect/proposals/step-10-a0-coding-domain-boundary-facade-plan.md",
    "toOwner": "docs/platform/proposals/step-10-a0-coding-domain-boundary-facade-plan.md",
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
    "title": "Step 10 A0 - Coding Domain Boundary And Facade Plan",
    "anchor": "step-10-a0---coding-domain-boundary-and-facade-plan",
    "githubAnchor": "step-10-a0---coding-domain-boundary-and-facade-plan",
    "stableAnchor": "h-b363c0eb493a",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "44ecb4cfb929e8cd6881bf44b2d603520efeecfe51f40e91c4c0c3b6280ba42e",
    "sample": "Step 10 A0 - Coding Domain Boundary And Facade Plan",
    "sectionPayloadDigest": "ec846590f84405384ff426a0ec24b9979deaf808b7dbe70fda6c2d58285e8d66",
    "followingBlockDigest": "29d751df228ea67a5e63494828f1de17e9116a967d1c734d2fb62e3782ee1eac",
    "identityFingerprint": "ce4774df40183d0931ebbe54bfe81597cba0aad45f25a58d566528cc61ec9a86",
    "ancestry": [],
    "text": "# Step 10 A0 - Coding Domain Boundary And Facade Plan",
    "sectionText": "# Step 10 A0 - Coding Domain Boundary And Facade Plan\n\nDocument type: Detailed architecture and execution plan\nDesign status: Draft\nImplementation: Not started\nLast reviewed: 2026-09-05\nCanonical for: detailed A0 architecture and execution plan under Step 10 until\naccepted or superseded\n\nRelated:\n- [Step 10 Coding Domain Adoption](step-10-coding-domain-adoption.md)\n- [Architect Roadmap](../roadmap.md)\n- [Workspace Topology Architecture](../workspace-topology.md)\n- [Runtime Identity And Activation](../packaging-distribution/runtime-identity-and-activation.md)\n- [System Vision: Trong Mem Ngoai Cung](../system-vision-trong-mem-ngoai-cung.md)"
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Step 10 A0 - Coding Domain Boundary And Facade Plan",
    "anchor": "step-10-a0---coding-domain-boundary-and-facade-plan",
    "githubAnchor": "step-10-a0---coding-domain-boundary-and-facade-plan",
    "stableAnchor": "h-b363c0eb493a",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "5bf2a3ef2be08019d1200bfb0822da8b451c7fda67d81ec78168b0393f1d153c",
    "sample": "Step 10 A0 - Coding Domain Boundary And Facade Plan",
    "sectionPayloadDigest": "b7157cb244b68278d2f205c0c371b2bd98cb29a1fa9812b4912aa146710b8c14",
    "followingBlockDigest": "0043498ebb467e1b81059035df6397b015e8a59601463ef77df1919a600a72e1",
    "identityFingerprint": "4bcc3a3b732429da825fb86af46d5b8a7aa52868cc7daa61194eed69d7e0e4c9",
    "ancestry": [],
    "text": "# Step 10 A0 - Coding Domain Boundary And Facade Plan",
    "sectionText": "# Step 10 A0 - Coding Domain Boundary And Facade Plan\n\n```txt\nDocument type: Proposal\nAudience: Human reviewer, architect, maintainer, agent\nPurpose: Preserve mapped source text for independent conservation review\nDesign status: Candidate\nImplementation: Source snapshot retained; current implementation truth not certified\nProvenance: docs/architect/proposals/step-10-a0-coding-domain-boundary-facade-plan.md at fb046210539cbcbe8ca1dab254763f5e78c573d2; blob e233f9878ae84ae8b23455171d80f9f4ec0acdcb\nWriter type: Agent draft writer\nCanonical: No\nCanonical for: Nothing; non-canonical candidate conservation carrier\nUse this when: Reviewing source carriage, placement, intent and provenance\nDo not use this for: Current authority, implementation proof or cutover approval\nLast reviewed: Pending independent review\nRelated:\n- docs/architect/proposals/step-10-a0-coding-domain-boundary-facade-plan.md\nSupersedes: None; legacy source remains intact\nSuperseded by: None\n```\n\nAdded in candidate: Candidate carriage; Keep map proposal; partial foundation retirement and surviving harnesses do not settle an unaccepted plan. Retain Not started and prerequisite uncertainty. Original source metadata and text follow. Physical relative-link destinations alone are rebased to the same repository paths. Units with inherited missing links are preserved as literal fenced source text, without substituting another design or changing any assertion. Source metadata is provenance, not candidate authority.\n\nSource relationship: [original source](step-10-a0-coding-domain-boundary-facade-plan.md).\n\n\nDocument type: Detailed architecture and execution plan\nDesign status: Draft\nImplementation: Not started\nLast reviewed: 2026-09-05\nCanonical for: detailed A0 architecture and execution plan under Step 10 until\naccepted or superseded\n\nRelated:\n- [Step 10 Coding Domain Adoption](step-10-coding-domain-adoption.md)\n- [Architect Roadmap](../system-architecture/architecture/roadmap.md)\n- [Workspace Topology Architecture](../system-architecture/architecture/workspace-topology.md)\n- [Runtime Identity And Activation](../packaging-distribution/README.md)\n- [System Vision: Trong Mem Ngoai Cung](../system-architecture/architecture/system-vision-trong-mem-ngoai-cung.md)"
  }
}
```

## Entry f-304: link-304

```json
{
  "id": "link-304",
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

## Entry f-305: link-305

```json
{
  "id": "link-305",
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

## Entry f-306: link-306

```json
{
  "id": "link-306",
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

## Entry f-307: link-307

```json
{
  "id": "link-307",
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
  "reviewStatus": "pending",
  "oldDestination": "../../architect/proposals/visibility-and-interactive-contact-herdr-spawn.md",
  "newDestination": "visibility-and-interactive-contact-herdr-spawn.md",
  "alias": {
    "aliasId": "step10-proposals-redesigns-0860",
    "fromPath": "docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md",
    "toOwner": "docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md",
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
    "title": "Visibility và Interactive Contact trong Dispatch & Execution — herdr-spawn là candidate đầu tiên",
    "anchor": "visibility-và-interactive-contact-trong-dispatch-execution-herdr-spawn-là-candidate-đầu-tiên",
    "githubAnchor": "visibility-và-interactive-contact-trong-dispatch-execution-herdr-spawn-là-candidate-đầu-tiên",
    "stableAnchor": "h-93a28848ad6c",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "011ff1ead4b5626955fb4c368e23c5c0e43dea44b10d06bf5ab9b9ac30631b24",
    "sample": "Visibility và Interactive Contact trong Dispatch & Execution — herdr-spawn là candidate đầu tiên",
    "sectionPayloadDigest": "0bfc25e7ce21a48a9953ba672b5d331390c87efa1489a5672baeef0c2b670b63",
    "followingBlockDigest": "46753d58e2bcfaaafb4401c27c9750ec8bbb6e4a437792ad3574abd498e459f9",
    "identityFingerprint": "f414248f51964da8efea096314ce4c80350011b67cc64c45fbb7fdd40eaa46a2",
    "ancestry": [],
    "text": "# Visibility và Interactive Contact trong Dispatch & Execution — herdr-spawn là candidate đầu tiên",
    "sectionText": "# Visibility và Interactive Contact trong Dispatch & Execution — herdr-spawn là candidate đầu tiên\n\nDocument type: Proposal (investigation, lượt conceptual đầu — read-only)\nDesign status: Discussion\nImplementation: Existing `herdr-spawn` adapter (family A bên dưới); không có source nào được sửa trong lượt này\nLast reviewed: 2026-09-06\nCanonical for: nothing until accepted; reconstruct hiện trạng + failure modes + boundary + conceptual design cho visibility/contact của mechanism interactive\nState class: State\n\nRelated: [Visibility And Herdr](../agent-coordination/architecture/visibility-and-herdr.md),\n[Dispatch Control Plane](../agent-coordination/architecture/dispatch-control-plane.md),\n[Coordination ↔ Dispatch contract](coordination-dispatch-contract.md),\n[Worker/provider/control boundary](coordination-worker-provider-boundary.md),\n[herdr-spawn adapter history](../../explanation/herdr-spawn-adapter-fresh-pane.md),\n[Brainstorm 2026-08-27 (superseded)](../agent-coordination/history/brainstorms/agent-team-dispatch-and-herdr-stability-2026-08-27.md).\n\nNhãn chứng cứ dùng trong tài liệu: **native proven** (code + test có trong repo, chạy được), **native observed but incomplete** (code có, hành vi chỉ đúng một phần hoặc chưa test), **prototype-only**, **unproven** (chỉ là prose/giả định), **unsafe** (đã đo là gây hại), **upstream-proven** (beegog v2.33.2 đã đo và ship, chưa chạy trong fgOS).\n\n---"
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Visibility và Interactive Contact trong Dispatch & Execution — herdr-spawn là candidate đầu tiên",
    "anchor": "visibility-và-interactive-contact-trong-dispatch-execution-herdr-spawn-là-candidate-đầu-tiên",
    "githubAnchor": "visibility-và-interactive-contact-trong-dispatch-execution-herdr-spawn-là-candidate-đầu-tiên",
    "stableAnchor": "h-93a28848ad6c",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "123a08add0c34cce298f2c769a965c59ce4abc1cf6bb75a326e23615980e5b51",
    "sample": "Visibility và Interactive Contact trong Dispatch & Execution — herdr-spawn là candidate đầu tiên",
    "sectionPayloadDigest": "cb00a43b1c6362236d9db3f8ac240e5e8910e808fe9bff4e15692e0a57bfdad5",
    "followingBlockDigest": "0978630f14116d4e4f6ef49ecef9de5bc02e4823b4851f1ef2551286e7497ff9",
    "identityFingerprint": "4773c2f5c77aeba4e5b3ef63880e438efaaaac2beb91474256be46a0b470234c",
    "ancestry": [],
    "text": "# Visibility và Interactive Contact trong Dispatch & Execution — herdr-spawn là candidate đầu tiên",
    "sectionText": "# Visibility và Interactive Contact trong Dispatch & Execution — herdr-spawn là candidate đầu tiên\n\n```txt\nDocument type: Proposal\nAudience: Human reviewer, architect, maintainer, agent\nPurpose: Preserve mapped source text for independent conservation review\nDesign status: Candidate\nImplementation: Source snapshot retained; current implementation truth not certified\nProvenance: docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md at fb046210539cbcbe8ca1dab254763f5e78c573d2; blob 0669c4440662d98e207e676b76eb0ba70387be44\nWriter type: Agent draft writer\nCanonical: No\nCanonical for: Nothing; non-canonical candidate conservation carrier\nUse this when: Reviewing source carriage, placement, intent and provenance\nDo not use this for: Current authority, implementation proof or cutover approval\nLast reviewed: Pending independent review\nRelated:\n- docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md\nSupersedes: None; legacy source remains intact\nSuperseded by: None\n```\n\nAdded in candidate: Candidate design evidence cited by docs/specs/runner.md:999 RUL40, sections 3.3, 4 and 14 H1. Source transport line references and proposed recommendations are preserved as dated text. Original source metadata and text follow. Physical relative-link destinations alone are rebased to the same repository paths. Units with inherited missing links are preserved as literal fenced source text, without substituting another design or changing any assertion. Source metadata is provenance, not candidate authority.\n\nSource relationship: [original source](visibility-and-interactive-contact-herdr-spawn.md).\n\n\nDocument type: Proposal (investigation, lượt conceptual đầu — read-only)\nDesign status: Discussion\nImplementation: Existing `herdr-spawn` adapter (family A bên dưới); không có source nào được sửa trong lượt này\nLast reviewed: 2026-09-06\nCanonical for: nothing until accepted; reconstruct hiện trạng + failure modes + boundary + conceptual design cho visibility/contact của mechanism interactive\nState class: State\n\nRelated: [Visibility And Herdr](../agent-coordination/README.md),\n[Dispatch Control Plane](../agent-coordination/README.md),\n[Coordination ↔ Dispatch contract](coordination-dispatch-contract.md),\n[Worker/provider/control boundary](coordination-worker-provider-boundary.md),\n[herdr-spawn adapter history](../../explanation/herdr-spawn-adapter-fresh-pane.md),\n[Brainstorm 2026-08-27 (superseded)](../agent-coordination/history/brainstorms/agent-team-dispatch-and-herdr-stability-2026-08-27.md).\n\nNhãn chứng cứ dùng trong tài liệu: **native proven** (code + test có trong repo, chạy được), **native observed but incomplete** (code có, hành vi chỉ đúng một phần hoặc chưa test), **prototype-only**, **unproven** (chỉ là prose/giả định), **unsafe** (đã đo là gây hại), **upstream-proven** (beegog v2.33.2 đã đo và ship, chưa chạy trong fgOS).\n\n---"
  }
}
```

## Entry f-308: link-308

```json
{
  "id": "link-308",
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
  "reviewStatus": "pending",
  "oldDestination": "../../architect/agent-coordination/architecture/visibility-and-herdr.md",
  "newDestination": "../agent-coordination/README.md",
  "alias": {
    "aliasId": "step10-agent-coordination-0407",
    "fromPath": "docs/architect/agent-coordination/architecture/visibility-and-herdr.md",
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
    "title": "Visibility And Herdr",
    "anchor": "visibility-and-herdr",
    "githubAnchor": "visibility-and-herdr",
    "stableAnchor": "h-05baf8e1d312",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "ef80ef05e28ce8cf10940f373e7955f5802983cdaff0d70ba7013bc8b5887c9a",
    "sample": "Visibility And Herdr",
    "sectionPayloadDigest": "6640da57552ba2a1aeb35c39f93e100adbfef3c35b06b0ee566dc8657ca7b683",
    "followingBlockDigest": "0fe4b4a9b9fab2b97deec938ae7d70ce489e9c5c783c52433058606fd6e4b6cc",
    "identityFingerprint": "0e70a589e450f18287b652822ca01acf21b2a0b3ed23e487fcc2cee8a9b180eb",
    "ancestry": [],
    "text": "# Visibility And Herdr",
    "sectionText": "# Visibility And Herdr\n\n> Migration status: This document is a legacy/current source for\n> `docs/platform/agent-coordination/architecture/visibility-and-herdr.md`. Do not edit divergent design\n> claims here without also updating the target doc or migration inventory.\n\nDocument type: Architecture\nDesign status: Accepted\nImplementation: Substantial — the runtime-recovery track (closed 2026-09-14)\nimplemented Run admission/control-epoch fencing (P01), cli-spawn and\nherdr-spawn launch reconciliation including a real bwrap-confined herdr-spawn\nlaunch (P02L, P02H, hardened in the P02H reopen), governed fallback (P03),\nand standalone/session recovery read-apply doors (P05, P05S). Every invariant\nand forbidden inference below held through that work's own independent\nreview/red-team verification. See `plans/260911-2305-runtime-recovery/plan.md`\nand its per-cell trace docs for what shipped.\nLast reviewed: 2026-09-14\nCanonical for: visibility versus runtime truth"
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

## Entry f-309: link-309

```json
{
  "id": "link-309",
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

## Entry f-310: link-310

```json
{
  "id": "link-310",
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
  "reviewStatus": "pending",
  "oldDestination": "../../architect/proposals/coordination-dispatch-contract.md",
  "newDestination": "coordination-dispatch-contract.md",
  "alias": {
    "aliasId": "step10-proposals-redesigns-0323",
    "fromPath": "docs/architect/proposals/coordination-dispatch-contract.md",
    "toOwner": "docs/platform/proposals/coordination-dispatch-contract.md",
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
    "title": "Coordination ↔ Dispatch & Execution Contract",
    "anchor": "coordination-dispatch-execution-contract",
    "githubAnchor": "coordination-dispatch-execution-contract",
    "stableAnchor": "h-8c937b84f370",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "42436466f569b9645c8f9c31dbead2426e207f0156f0a63aa7f74c8d7e5b51cf",
    "sample": "Coordination ↔ Dispatch & Execution Contract",
    "sectionPayloadDigest": "fe0aad6fb51708684bf3e9ebb90e2c0b11e5b93e848a1b780860c69206a6f28a",
    "followingBlockDigest": "f9e3d3073004e198e33b6d4b18e7e2d7421415706f66f829df647b48503000da",
    "identityFingerprint": "be84ea1fd034aaa7259e0e7d55a4a935472bd5e87bd4c536dc66eea2ef287f69",
    "ancestry": [],
    "text": "# Coordination ↔ Dispatch & Execution Contract",
    "sectionText": "# Coordination ↔ Dispatch & Execution Contract\n\nDocument type: Proposal\nDesign status: Discussion\nImplementation: Existing dispatch substrate; proposed coordination seam not yet accepted\nLast reviewed: 2026-09-06\nCanonical for: nothing until accepted; conceptual boundary for the current architecture review\nState class: State\n\nRelated: [Dispatch Control Plane](../agent-coordination/architecture/dispatch-control-plane.md),\n[Coordination capability envelope](coordination-capability-envelope.md),\n[Worker/provider/control boundary](coordination-worker-provider-boundary.md),\n[Progress](coordination-envelope-progress.md)."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Coordination ↔ Dispatch & Execution Contract",
    "anchor": "coordination-dispatch-execution-contract",
    "githubAnchor": "coordination-dispatch-execution-contract",
    "stableAnchor": "h-8c937b84f370",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "82e90ef583401448e13d3d31ef8d3282808450b97089263c660247a492214e75",
    "sample": "Coordination ↔ Dispatch & Execution Contract",
    "sectionPayloadDigest": "a3f9648489144deecc71ee4deb75ae9a717171ee7e156925fe1d5e686353f81d",
    "followingBlockDigest": "49d69a9eea4551d05b4a05f26df4c2bd68bbbff54d5d70427c21efaf9b94e0a1",
    "identityFingerprint": "fcd810007e0a80e0a3e35f13c614de95dddea752f298de4cb9cb6f1fa51e2bf8",
    "ancestry": [],
    "text": "# Coordination ↔ Dispatch & Execution Contract",
    "sectionText": "# Coordination ↔ Dispatch & Execution Contract\n\n```txt\nDocument type: Proposal\nAudience: Human reviewer, architect, maintainer, agent\nPurpose: Preserve mapped source text for independent conservation review\nDesign status: Candidate\nImplementation: Source snapshot retained; current implementation truth not certified\nProvenance: docs/architect/proposals/coordination-dispatch-contract.md at fb046210539cbcbe8ca1dab254763f5e78c573d2; blob 80c315d884fdf211c752f0c53d43a459d4935092\nWriter type: Agent draft writer\nCanonical: No\nCanonical for: Nothing; non-canonical candidate conservation carrier\nUse this when: Reviewing source carriage, placement, intent and provenance\nDo not use this for: Current authority, implementation proof or cutover approval\nLast reviewed: Pending independent review\nRelated:\n- docs/architect/proposals/coordination-dispatch-contract.md\nSupersedes: None; legacy source remains intact\nSuperseded by: None\n```\n\nAdded in candidate: Candidate carriage; Keep the map proposal conservatively: the shared dispatch boundary survives. No acceptance of its unbuilt coordinator-facing contract or historical observations as current truth. Original source metadata and text follow. Physical relative-link destinations alone are rebased to the same repository paths. Units with inherited missing links are preserved as literal fenced source text, without substituting another design or changing any assertion. Source metadata is provenance, not candidate authority.\n\nSource relationship: [original source](coordination-dispatch-contract.md).\n\n\nDocument type: Proposal\nDesign status: Discussion\nImplementation: Existing dispatch substrate; proposed coordination seam not yet accepted\nLast reviewed: 2026-09-06\nCanonical for: nothing until accepted; conceptual boundary for the current architecture review\nState class: State\n\nRelated: [Dispatch Control Plane](../agent-coordination/README.md),\n[Coordination capability envelope](coordination-capability-envelope.md),\n[Worker/provider/control boundary](coordination-worker-provider-boundary.md),\n[Progress](../agent-coordination/history/proposals-redesigns/coordination-envelope-progress.md)."
  }
}
```

## Entry f-311: link-311

```json
{
  "id": "link-311",
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
  "reviewStatus": "pending",
  "oldDestination": "../../architect/proposals/coordination-worker-provider-boundary.md",
  "newDestination": "coordination-worker-provider-boundary.md",
  "alias": {
    "aliasId": "step10-proposals-redesigns-0430",
    "fromPath": "docs/architect/proposals/coordination-worker-provider-boundary.md",
    "toOwner": "docs/platform/proposals/coordination-worker-provider-boundary.md",
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
    "title": "Coordination Envelope — Worker, Provider, and Control Boundary",
    "anchor": "coordination-envelope-worker-provider-and-control-boundary",
    "githubAnchor": "coordination-envelope-worker-provider-and-control-boundary",
    "stableAnchor": "h-9d3c2430fefc",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "024edf570bf63f77e5d5ae17ff9740b8dcef0913d2f886e3f90fbaf931b4e0fd",
    "sample": "Coordination Envelope — Worker, Provider, and Control Boundary",
    "sectionPayloadDigest": "8c2fd961d0778d0279d252c010b89f11959075a2944d848f4735cb743166355d",
    "followingBlockDigest": "bcaba1cea1679c359ea6b781b34fd3641659d2f49df0b91380843c8b8f87bbb1",
    "identityFingerprint": "38ccb5161c6d22e0835fd4f9309477546bf8e5176141a8be3318ee7f902785ef",
    "ancestry": [],
    "text": "# Coordination Envelope — Worker, Provider, and Control Boundary",
    "sectionText": "# Coordination Envelope — Worker, Provider, and Control Boundary\n\nDocument type: Proposal\nDesign status: Discussion\nImplementation: Not started; supporting OS-only probes exist\nLast reviewed: 2026-09-06\nCanonical for: nothing until accepted; minimum boundary sketch before a live probe\nState class: State\n\nRelated: [Conceptual architecture](coordination-capability-envelope.md),\n[Probe contract](coordination-envelope-probe-contract.md),\n[Progress](coordination-envelope-progress.md),\n[Capability audit](../agent-coordination/verification/coordination-envelope/capability-fit-2026-09-06.md),\n[Dispatch control plane](../agent-coordination/architecture/dispatch-control-plane.md)."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Coordination Envelope — Worker, Provider, and Control Boundary",
    "anchor": "coordination-envelope-worker-provider-and-control-boundary",
    "githubAnchor": "coordination-envelope-worker-provider-and-control-boundary",
    "stableAnchor": "h-9d3c2430fefc",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "a3af59cfe684b859097c56dc9d60c9047b985f2b53aa22ba74790eb6a727fae9",
    "sample": "Coordination Envelope — Worker, Provider, and Control Boundary",
    "sectionPayloadDigest": "fe59e4f4739487bfe32f8c9669f79b58202ce692c19903c3a4475588437e2bd8",
    "followingBlockDigest": "09882c677ec1c579968be1dbb4b7f17fd3f8e361531d2ca667b52973565915a7",
    "identityFingerprint": "949b97a33bd74b850a06c487ffdcbd1ece217d2383f50e26efa75d267e26861a",
    "ancestry": [],
    "text": "# Coordination Envelope — Worker, Provider, and Control Boundary",
    "sectionText": "# Coordination Envelope — Worker, Provider, and Control Boundary\n\n```txt\nDocument type: Proposal\nAudience: Human reviewer, architect, maintainer, agent\nPurpose: Preserve mapped source text for independent conservation review\nDesign status: Candidate\nImplementation: Source snapshot retained; current implementation truth not certified\nProvenance: docs/architect/proposals/coordination-worker-provider-boundary.md at fb046210539cbcbe8ca1dab254763f5e78c573d2; blob fae58710ab56c7e418f472c6cd318d27eb8e2258\nWriter type: Agent draft writer\nCanonical: No\nCanonical for: Nothing; non-canonical candidate conservation carrier\nUse this when: Reviewing source carriage, placement, intent and provenance\nDo not use this for: Current authority, implementation proof or cutover approval\nLast reviewed: Pending independent review\nRelated:\n- docs/architect/proposals/coordination-worker-provider-boundary.md\nSupersedes: None; legacy source remains intact\nSuperseded by: None\n```\n\nAdded in candidate: Candidate carriage; Keep map proposal in full. Supporting OS probes and private HOME are not full implementation; retain Not started statement as source metadata. Original source metadata and text follow. Physical relative-link destinations alone are rebased to the same repository paths. Units with inherited missing links are preserved as literal fenced source text, without substituting another design or changing any assertion. Source metadata is provenance, not candidate authority.\n\nSource relationship: [original source](coordination-worker-provider-boundary.md).\n\n\nDocument type: Proposal\nDesign status: Discussion\nImplementation: Not started; supporting OS-only probes exist\nLast reviewed: 2026-09-06\nCanonical for: nothing until accepted; minimum boundary sketch before a live probe\nState class: State\n\nRelated: [Conceptual architecture](coordination-capability-envelope.md),\n[Probe contract](coordination-envelope-probe-contract.md),\n[Progress](../agent-coordination/history/proposals-redesigns/coordination-envelope-progress.md),\n[Capability audit](../agent-coordination/verification/coordination-envelope/capability-fit-2026-09-06.md),\n[Dispatch control plane](../agent-coordination/README.md)."
  }
}
```

## Entry f-312: link-312

```json
{
  "id": "link-312",
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
  "reviewStatus": "pending",
  "oldDestination": "../../architect/agent-coordination/history/brainstorms/agent-team-dispatch-and-herdr-stability-2026-08-27.md",
  "newDestination": "../agent-coordination/history/brainstorms/agent-team-dispatch-and-herdr-stability-2026-08-27.md",
  "alias": {
    "aliasId": "step10-agent-coordination-1043",
    "fromPath": "docs/architect/agent-coordination/history/brainstorms/agent-team-dispatch-and-herdr-stability-2026-08-27.md",
    "toOwner": "docs/platform/agent-coordination/history/brainstorms/agent-team-dispatch-and-herdr-stability-2026-08-27.md",
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
    "title": "Agent Team Dispatch And Herdr Stability",
    "anchor": "agent-team-dispatch-and-herdr-stability",
    "githubAnchor": "agent-team-dispatch-and-herdr-stability",
    "stableAnchor": "h-60977e512b15",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "273b8768b20b5541a12d3bacbe4859c9297811ee0e7447a99efa0891b1211f44",
    "sample": "Agent Team Dispatch And Herdr Stability",
    "sectionPayloadDigest": "969910b47c0ae1ce10409d3e6cfa9fe3a1c8d65575ec3f94c95382ecab835ff8",
    "followingBlockDigest": "f52e416d8142c6e912f6261401085da0df88eed34d2be81a9ccbf875d8927f70",
    "identityFingerprint": "aa85ea3525dfefee10eb090d7b4b05a5d43fc37fe9052f7613a1c7abd647a5f1",
    "ancestry": [],
    "text": "# Agent Team Dispatch And Herdr Stability",
    "sectionText": "# Agent Team Dispatch And Herdr Stability\n\n> Migration status: This document is a legacy/current source for\n> `docs/platform/agent-coordination/history/brainstorms/agent-team-dispatch-and-herdr-stability-2026-08-27.md`. Do not edit divergent design\n> claims here without also updating the target doc or migration inventory.\n\nDocument type: History\nDesign status: Superseded\nImplementation: N/A\nLast reviewed: 2026-08-31\nCanonical for: nothing; retained as brainstorm history\nOriginal date: 2026-08-27\nScope: multi-provider agent dispatch, Herdr visibility, runtime evidence, AgentMessage boundaries, and a lightweight stabilization path for `agy-herdr`"
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Agent Team Dispatch And Herdr Stability",
    "anchor": "agent-team-dispatch-and-herdr-stability",
    "githubAnchor": "agent-team-dispatch-and-herdr-stability",
    "stableAnchor": "h-60977e512b15",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "8d4ff1341b76a73dc792c19665abb139634076beab5a2bab3e519fa62d56d034",
    "sample": "Agent Team Dispatch And Herdr Stability",
    "sectionPayloadDigest": "48f0779e523e1b23a16b17888ba9869e58a1cdca8c0ac7775a39736bd3cb0969",
    "followingBlockDigest": "48f0779e523e1b23a16b17888ba9869e58a1cdca8c0ac7775a39736bd3cb0969",
    "identityFingerprint": "e323364b34dcae1b6a20122b8c1d2fea286e73b3e6a6506e8667c2dae03134e0",
    "ancestry": [],
    "text": "# Agent Team Dispatch And Herdr Stability",
    "sectionText": "# Agent Team Dispatch And Herdr Stability\n\n```txt\nDocument type: History\nAudience: Human reviewers, maintainers, documentation agents\nPurpose: Preserve source material for Agent Team Dispatch And Herdr Stability\nDesign status: Candidate\nImplementation: Not re-verified; source implementation statements remain in the body\nProvenance: Retained from docs/architect/agent-coordination/history/brainstorms/agent-team-dispatch-and-herdr-stability-2026-08-27.md at fcfe78cb89585bc9ab23f11bab67d41458834fc4\nWriter type: Documentation maintainer\nCanonical for: Preserved history material for Agent Team Dispatch And Herdr Stability; no authority cutover\nUse this when: Comparing this candidate with its pinned legacy source\nDo not use this for: Inferring current implementation or supersession of retained sources\nLast reviewed: UNPROVEN; independent content review pending\nRelated:\n- None\nSupersedes: None; retained source authority is unchanged\nSuperseded by: None\nAdded in candidate: Promotion metadata only; source claims and implementation are not re-decided here\n```\nDocument type: History\nDesign status: Superseded\nImplementation: N/A\nLast reviewed: 2026-08-31\nCanonical for: nothing; retained as brainstorm history\nOriginal date: 2026-08-27\nScope: multi-provider agent dispatch, Herdr visibility, runtime evidence, AgentMessage boundaries, and a lightweight stabilization path for `agy-herdr`"
  }
}
```

## Entry f-313: link-313

```json
{
  "id": "link-313",
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
  "reviewStatus": "pending",
  "oldDestination": "../../architect/agent-coordination/verification/visibility-herdr/proofs/2026-09-06-isolation/permission-posture-findings.md",
  "newDestination": "../agent-coordination/verification/visibility-herdr/proofs/2026-09-06-isolation/permission-posture-findings.md",
  "alias": {
    "aliasId": "step10-agent-coordination-4299",
    "fromPath": "docs/architect/agent-coordination/verification/visibility-herdr/proofs/2026-09-06-isolation/permission-posture-findings.md",
    "toOwner": "docs/platform/agent-coordination/verification/visibility-herdr/proofs/2026-09-06-isolation/permission-posture-findings.md",
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
    "title": "Permission posture — where it actually comes from, and the rule that follows",
    "anchor": "permission-posture-where-it-actually-comes-from-and-the-rule-that-follows",
    "githubAnchor": "permission-posture-where-it-actually-comes-from-and-the-rule-that-follows",
    "stableAnchor": "h-1df516f3cc9c",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "573bd94e0ab972689edeac03e5f02b99f1c099c93b52333ba8dc1a0a27d23a31",
    "sample": "Permission posture — where it actually comes from, and the rule that follows",
    "sectionPayloadDigest": "c04870a166c60d2c49f0caa83cb0aeda5b7aacbc9be392751e797265eb0ad4b3",
    "followingBlockDigest": "c04870a166c60d2c49f0caa83cb0aeda5b7aacbc9be392751e797265eb0ad4b3",
    "identityFingerprint": "254f72ed1bfe8019629b0a4b9f89c225fefdd78dbd86847e8a8d2a31c64934c1",
    "ancestry": [],
    "text": "# Permission posture — where it actually comes from, and the rule that follows",
    "sectionText": "# Permission posture — where it actually comes from, and the rule that follows\n\nDate: 2026-09-06 | herdr 0.8.2 | claude\nScripts: `permission-posture-probe.sh`, `skip-permissions-probe.sh`, `provisioned-worker-probe.sh`\nEvery run created and destroyed its own herdr session; the operator's `default` session was\nnever touched."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Permission posture — where it actually comes from, and the rule that follows",
    "anchor": "permission-posture-where-it-actually-comes-from-and-the-rule-that-follows",
    "githubAnchor": "permission-posture-where-it-actually-comes-from-and-the-rule-that-follows",
    "stableAnchor": "h-1df516f3cc9c",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "573bd94e0ab972689edeac03e5f02b99f1c099c93b52333ba8dc1a0a27d23a31",
    "sample": "Permission posture — where it actually comes from, and the rule that follows",
    "sectionPayloadDigest": "c04870a166c60d2c49f0caa83cb0aeda5b7aacbc9be392751e797265eb0ad4b3",
    "followingBlockDigest": "c04870a166c60d2c49f0caa83cb0aeda5b7aacbc9be392751e797265eb0ad4b3",
    "identityFingerprint": "254f72ed1bfe8019629b0a4b9f89c225fefdd78dbd86847e8a8d2a31c64934c1",
    "ancestry": [],
    "text": "# Permission posture — where it actually comes from, and the rule that follows",
    "sectionText": "# Permission posture — where it actually comes from, and the rule that follows\n\nDate: 2026-09-06 | herdr 0.8.2 | claude\nScripts: `permission-posture-probe.sh`, `skip-permissions-probe.sh`, `provisioned-worker-probe.sh`\nEvery run created and destroyed its own herdr session; the operator's `default` session was\nnever touched."
  }
}
```

## Entry f-314: link-314

```json
{
  "id": "link-314",
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
  "reviewStatus": "pending",
  "oldDestination": "../../../architect/agent-coordination/architecture/dispatch-control-plane.md",
  "newDestination": "../../agent-coordination/README.md",
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

## Entry f-315: link-315

```json
{
  "id": "link-315",
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
  "reviewStatus": "pending",
  "oldDestination": "../../../specs/confinement-authority.md",
  "newDestination": "../../agent-confinement/README.md",
  "alias": {
    "aliasId": "step10-specs-0001",
    "fromPath": "docs/specs/confinement-authority.md",
    "toOwner": "docs/platform/agent-confinement/README.md",
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
    "title": "Spec: Agent Confinement Authority",
    "anchor": "spec-agent-confinement-authority",
    "githubAnchor": "spec-agent-confinement-authority",
    "stableAnchor": "h-ec2c2004ddb2",
    "startLine": 7,
    "endLine": 7,
    "textDigest": "d616d06522982d87caf2b59041a80220005e76ba36608070ce92bfb7644a45a3",
    "sample": "Spec: Agent Confinement Authority",
    "sectionPayloadDigest": "9c7a5f29c2242f9aae324b709b533335f6161724e9882e17db9d1a999d86988c",
    "followingBlockDigest": "9c7a5f29c2242f9aae324b709b533335f6161724e9882e17db9d1a999d86988c",
    "identityFingerprint": "bed48ad217ced22c14009cae2dc2cb88c39c2a7000833f0d7d3c036700f49bde",
    "ancestry": [],
    "text": "# Spec: Agent Confinement Authority",
    "sectionText": "# Spec: Agent Confinement Authority\n\n> **Trạng thái:** IMPLEMENTED. Đã được hiện thực hoá hoàn chỉnh qua track `confinement-authority-implementation` (P00-P07).\n> Một cửa runtime duy nhất `executeThroughConfinement` bảo vệ mọi dispatch ngoại trình (`cli-spawn`, `herdr-spawn`, `http`)\n> trước khi adapter được spawn agent. Backend registry `~/.fgos/confinement-backends.json` quản lý backend instances máy chủ,\n> driver `bwrap` v1 bảo đảm fail-closed cho `required` với 8 falsification probes. Ba executor bwrap (`claude-bwrap`, `agy-bwrap`, `codex-bwrap`)\n> chỉ di trú sang backend reference ở dạng fixture (P04.md R4) — bản `.fgos/config.json` thật vẫn giữ hand-rolled `command:\"bwrap\"` argv,\n> không có key `confinement`; live migration để deferred cho một phase sau (P06 thử tạm rồi revert nguyên trạng, sha256-verified). Live dogfood\n> coordination đã chứng minh multi-agent cross-provider enforcement trên đường observe/legacy hiện có, không phụ thuộc migration nói trên.\n> Chế độ strict mode (`runner.confinement.strict`) mặc định giữ `false` với chẩn đoán sẵn sàng từ `fgos doctor` (xem R1 decision).\n>\n> **Nguồn:** RUN1\n> `plans/reports/architecture-advisory-panel-260909-2107-confinement-authority-fgos-dispatch-report.md`,\n> RUN2\n> `plans/reports/architecture-advisory-panel-260910-0216-confinement-authority-run2-decision-and-run1-comparison-report.md`,\n> và source được đối chiếu ngày 2026-09-11."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "agent-confinement candidate area",
    "anchor": "agent-confinement-candidate-area",
    "githubAnchor": "agent-confinement-candidate-area",
    "stableAnchor": "h-9322e0587b12",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "584ec0449e954d60aecf858e8caf68ae54fd6de1ec147b6ae82a0782edab466c",
    "sample": "agent-confinement candidate area",
    "sectionPayloadDigest": "5f9782e71f1b86fdaeb7b270277d3493fe426ccb6a69565292a05a9c22b87159",
    "followingBlockDigest": "f5a06d91953d474d069c22434c0a6fe8c094ef1e10664fe4331f6032a31f9dcd",
    "identityFingerprint": "baa103eab85d24f186e54475dceac2af0826d2050156e75ea8bc346ba0d97a93",
    "ancestry": [],
    "text": "# agent-confinement candidate area",
    "sectionText": "# agent-confinement candidate area\n\n```txt\nDocument type: Area portal\nAudience: Documentation migration reviewer, maintainer, agent\nPurpose: Preserve mapped legacy content for independent conservation review\nDesign status: Candidate\nImplementation: Carriage only; current implementation truth is not certified\nProvenance: docs/specs/confinement-authority.md at 111adc51fd047d99121fd9d076eb4794c87045a4\nWriter type: Agent draft writer\nCanonical: No\nCanonical for: None; candidate only\nUse this when: Reviewing carriage, placement and source conservation\nDo not use this for: Current canonical authority or implemented-behavior proof\nLast reviewed: Not independently reviewed; authored 2026-10-15\nRelated:\n- docs/specs/confinement-authority.md\nSupersedes: None; candidate only\nSuperseded by: None\n```\n\n> Added in candidate: Candidate metadata and placement scaffolding. This reading portal is new navigation, not a new component or authority. Legacy authority remains unchanged; source wording is preserved for conservation, including known stale assertions."
  }
}
```

## Entry f-316: link-316

```json
{
  "id": "link-316",
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
  "reviewStatus": "pending",
  "oldDestination": "../../../architect/system-vision-trong-mem-ngoai-cung.md",
  "newDestination": "system-vision-trong-mem-ngoai-cung.md",
  "alias": {
    "aliasId": "step10-whole-system-1321",
    "fromPath": "docs/architect/system-vision-trong-mem-ngoai-cung.md",
    "toOwner": "docs/platform/system-architecture/architecture/system-vision-trong-mem-ngoai-cung.md",
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
    "title": "System Vision: Trong Mem Ngoai Cung",
    "anchor": "system-vision-trong-mem-ngoai-cung",
    "githubAnchor": "system-vision-trong-mem-ngoai-cung",
    "stableAnchor": "h-ab626936e74c",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "3c6cade55629a91704628da7ada07f43360fff62bcc6e8d1c23abae9ddce8d81",
    "sample": "System Vision: Trong Mem Ngoai Cung",
    "sectionPayloadDigest": "2d38a8b85750e2ad698eb5bada7baa91dea80b0d4f430179ebde5f51b9cb27d6",
    "followingBlockDigest": "2d38a8b85750e2ad698eb5bada7baa91dea80b0d4f430179ebde5f51b9cb27d6",
    "identityFingerprint": "5dc61095ac85b2912668b7704cb41868ec284b170af45f305a0ec1174fc8b496",
    "ancestry": [],
    "text": "# System Vision: Trong Mem Ngoai Cung",
    "sectionText": "# System Vision: Trong Mem Ngoai Cung\n\nDocument type: System-wide architecture vision\nDesign status: Guiding vision\nImplementation: Cross-cutting\nLast reviewed: 2026-09-05\nCanonical for: balancing hard runtime contracts with adaptive agent soul/prose/skill across fgOS"
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "System Vision: Trong Mem Ngoai Cung",
    "anchor": "system-vision-trong-mem-ngoai-cung",
    "githubAnchor": "system-vision-trong-mem-ngoai-cung",
    "stableAnchor": "h-ab626936e74c",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "ed8092dd2b9cd330bc467efd0472a61b70765f53bbaeab1087126c74beff1e28",
    "sample": "System Vision: Trong Mem Ngoai Cung",
    "sectionPayloadDigest": "bc7fd2bfd14a8acc8ac1b376269d2435989d8a96a91f782f625321ccb2dba5cb",
    "followingBlockDigest": "c0c113ba85ee7b2d4de003e40d27463f653fe08013463bb68aa5830df5015113",
    "identityFingerprint": "306b00634acd7d63939a1b1d49aef9b2d6f1dfb657d8094d07617964196f4048",
    "ancestry": [],
    "text": "# System Vision: Trong Mem Ngoai Cung",
    "sectionText": "# System Vision: Trong Mem Ngoai Cung\n\n```txt\nDocument type: Architecture\nAudience: Human reviewer, architect, maintainer, agent\nPurpose: Preserve the complete system-vision-trong-mem-ngoai-cung.md source at its frozen-map candidate owner\nDesign status: Candidate\nImplementation: Partial — inherited source qualifications; not independently truth-verified\nProvenance: docs/architect/system-vision-trong-mem-ngoai-cung.md at 69dd3ee7fd84bc5e93fe9c75d63622d4f5aa8539 (blob 473dd8f1f28f4573194c47ca787973c52cc65756)\nWriter type: Agent carriage; independent review pending\nCanonical for: Nothing until promotion; current source remains docs/architect/system-vision-trong-mem-ngoai-cung.md\nUse this when: Reviewing whole-system candidate carriage and placement\nDo not use this for: Inferring implementation, promotion or superseding source authority\nLast reviewed: Pending independent review\nRelated:\n- docs/architect/system-vision-trong-mem-ngoai-cung.md\n- docs/platform/component-boundary.md\n- docs/platform/architecture-map.md\nSupersedes: None — candidate only\nSuperseded by: None\n```\n\nAdded in candidate: migration metadata and physical link rebasing. Original source metadata, dates, design limits and historic claims below are provenance, not fresh review. Current truth is unverified; A28 requires sampled truth review at this checkpoint and full truth review at promotion.\n\n\nDocument type: System-wide architecture vision\nDesign status: Guiding vision\nImplementation: Cross-cutting\nLast reviewed: 2026-09-05\nCanonical for: balancing hard runtime contracts with adaptive agent soul/prose/skill across fgOS"
  }
}
```

## Entry f-317: link-317

```json
{
  "id": "link-317",
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
  "reviewStatus": "pending",
  "oldDestination": "../../../architect/proposals/step-09-group-thinking-substrate.md",
  "newDestination": "../../proposals/step-09-group-thinking-substrate.md",
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

## Entry f-318: link-318

```json
{
  "id": "link-318",
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
  "reviewStatus": "pending",
  "oldDestination": "../../../architect/workspace-topology.md",
  "newDestination": "workspace-topology.md",
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

## Entry f-319: link-319

```json
{
  "id": "link-319",
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
  "reviewStatus": "pending",
  "oldDestination": "../../../architect/workspace-topology.md",
  "newDestination": "workspace-topology.md",
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

## Entry f-320: link-320

```json
{
  "id": "link-320",
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
  "reviewStatus": "pending",
  "oldDestination": "../../../architect/workspace-topology.md",
  "newDestination": "workspace-topology.md",
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

## Entry f-321: link-321

```json
{
  "id": "link-321",
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
  "reviewStatus": "pending",
  "oldDestination": "../../../architect/workspace-topology-audit.md",
  "newDestination": "workspace-topology-audit.md",
  "alias": {
    "aliasId": "step10-whole-system-1353",
    "fromPath": "docs/architect/workspace-topology-audit.md",
    "toOwner": "docs/platform/system-architecture/architecture/workspace-topology-audit.md",
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
    "title": "Workspace Topology Codebase Audit",
    "anchor": "workspace-topology-codebase-audit",
    "githubAnchor": "workspace-topology-codebase-audit",
    "stableAnchor": "h-57728414c1eb",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "9ee83d73f562002c39426d8de0579ce461f8d83e5d3d81ee36ee7141331220e9",
    "sample": "Workspace Topology Codebase Audit",
    "sectionPayloadDigest": "ea0a848ddec3663848089fb58f592aaf4fcbf2623814af976aaa7529123d077c",
    "followingBlockDigest": "a6f75b670446ea96971dc97cc64d95daf3e9eaf59d656368bf86e84064dfbd48",
    "identityFingerprint": "649a9097453d4e437d49d760b109e3cb6e01caa72c4c82a366306687f89dd24b",
    "ancestry": [],
    "text": "# Workspace Topology Codebase Audit",
    "sectionText": "# Workspace Topology Codebase Audit\n\n**Status:** Evidence snapshot for the topology contract.\n**Date:** 2026-09-04.\n**Evidence scope:** Current code and generated specs in this checkout.\n**Contract:** [workspace-topology.md](workspace-topology.md).\n\nThis document records why the topology contract is needed. It is allowed to go\nstale as code changes; the contract should not."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Workspace Topology Codebase Audit",
    "anchor": "workspace-topology-codebase-audit",
    "githubAnchor": "workspace-topology-codebase-audit",
    "stableAnchor": "h-57728414c1eb",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "d4a61eaea94baeab0d30531225f43ac0a03270e0ceeb33ea6aa79a42bca377ae",
    "sample": "Workspace Topology Codebase Audit",
    "sectionPayloadDigest": "aec5d0f70bb682be8af1ed3a1ed23c23c63d8a6fd1b9e7fffa93b5869a333e3e",
    "followingBlockDigest": "b851e6ad89a3503be3a6cbdf0b6a4e6b9ef978e2aefa616c3032ddc3235b7599",
    "identityFingerprint": "bd70845e7aa8967a8f587ac9f49e5d09296dc7a2d4cabab91a0b49c5a7de4f4f",
    "ancestry": [],
    "text": "# Workspace Topology Codebase Audit",
    "sectionText": "# Workspace Topology Codebase Audit\n\n```txt\nDocument type: Architecture\nAudience: Human reviewer, architect, maintainer, agent\nPurpose: Preserve the complete workspace-topology-audit.md source at its frozen-map candidate owner\nDesign status: Candidate\nImplementation: Partial — inherited source qualifications; not independently truth-verified\nProvenance: docs/architect/workspace-topology-audit.md at 69dd3ee7fd84bc5e93fe9c75d63622d4f5aa8539 (blob 024cac1f17203b20d4fcfdf95d1672c17fd4e5a5)\nWriter type: Agent carriage; independent review pending\nCanonical for: Nothing until promotion; current source remains docs/architect/workspace-topology-audit.md\nUse this when: Reviewing whole-system candidate carriage and placement\nDo not use this for: Inferring implementation, promotion or superseding source authority\nLast reviewed: Pending independent review\nRelated:\n- docs/architect/workspace-topology-audit.md\n- docs/platform/component-boundary.md\n- docs/platform/architecture-map.md\nSupersedes: None — candidate only\nSuperseded by: None\n```\n\nAdded in candidate: migration metadata and physical link rebasing. Original source metadata, dates, design limits and historic claims below are provenance, not fresh review. Current truth is unverified; A28 requires sampled truth review at this checkpoint and full truth review at promotion.\n\n\n**Status:** Evidence snapshot for the topology contract.\n**Date:** 2026-09-04.\n**Evidence scope:** Current code and generated specs in this checkout.\n**Contract:** [workspace-topology.md](workspace-topology.md).\n\nThis document records why the topology contract is needed. It is allowed to go\nstale as code changes; the contract should not."
  }
}
```

## Entry f-322: link-322

```json
{
  "id": "link-322",
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
  "reviewStatus": "pending",
  "oldDestination": "../../../architect/workspace-topology-audit.md",
  "newDestination": "workspace-topology-audit.md",
  "alias": {
    "aliasId": "step10-whole-system-1353",
    "fromPath": "docs/architect/workspace-topology-audit.md",
    "toOwner": "docs/platform/system-architecture/architecture/workspace-topology-audit.md",
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
    "title": "Workspace Topology Codebase Audit",
    "anchor": "workspace-topology-codebase-audit",
    "githubAnchor": "workspace-topology-codebase-audit",
    "stableAnchor": "h-57728414c1eb",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "9ee83d73f562002c39426d8de0579ce461f8d83e5d3d81ee36ee7141331220e9",
    "sample": "Workspace Topology Codebase Audit",
    "sectionPayloadDigest": "ea0a848ddec3663848089fb58f592aaf4fcbf2623814af976aaa7529123d077c",
    "followingBlockDigest": "a6f75b670446ea96971dc97cc64d95daf3e9eaf59d656368bf86e84064dfbd48",
    "identityFingerprint": "649a9097453d4e437d49d760b109e3cb6e01caa72c4c82a366306687f89dd24b",
    "ancestry": [],
    "text": "# Workspace Topology Codebase Audit",
    "sectionText": "# Workspace Topology Codebase Audit\n\n**Status:** Evidence snapshot for the topology contract.\n**Date:** 2026-09-04.\n**Evidence scope:** Current code and generated specs in this checkout.\n**Contract:** [workspace-topology.md](workspace-topology.md).\n\nThis document records why the topology contract is needed. It is allowed to go\nstale as code changes; the contract should not."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Workspace Topology Codebase Audit",
    "anchor": "workspace-topology-codebase-audit",
    "githubAnchor": "workspace-topology-codebase-audit",
    "stableAnchor": "h-57728414c1eb",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "d4a61eaea94baeab0d30531225f43ac0a03270e0ceeb33ea6aa79a42bca377ae",
    "sample": "Workspace Topology Codebase Audit",
    "sectionPayloadDigest": "aec5d0f70bb682be8af1ed3a1ed23c23c63d8a6fd1b9e7fffa93b5869a333e3e",
    "followingBlockDigest": "b851e6ad89a3503be3a6cbdf0b6a4e6b9ef978e2aefa616c3032ddc3235b7599",
    "identityFingerprint": "bd70845e7aa8967a8f587ac9f49e5d09296dc7a2d4cabab91a0b49c5a7de4f4f",
    "ancestry": [],
    "text": "# Workspace Topology Codebase Audit",
    "sectionText": "# Workspace Topology Codebase Audit\n\n```txt\nDocument type: Architecture\nAudience: Human reviewer, architect, maintainer, agent\nPurpose: Preserve the complete workspace-topology-audit.md source at its frozen-map candidate owner\nDesign status: Candidate\nImplementation: Partial — inherited source qualifications; not independently truth-verified\nProvenance: docs/architect/workspace-topology-audit.md at 69dd3ee7fd84bc5e93fe9c75d63622d4f5aa8539 (blob 024cac1f17203b20d4fcfdf95d1672c17fd4e5a5)\nWriter type: Agent carriage; independent review pending\nCanonical for: Nothing until promotion; current source remains docs/architect/workspace-topology-audit.md\nUse this when: Reviewing whole-system candidate carriage and placement\nDo not use this for: Inferring implementation, promotion or superseding source authority\nLast reviewed: Pending independent review\nRelated:\n- docs/architect/workspace-topology-audit.md\n- docs/platform/component-boundary.md\n- docs/platform/architecture-map.md\nSupersedes: None — candidate only\nSuperseded by: None\n```\n\nAdded in candidate: migration metadata and physical link rebasing. Original source metadata, dates, design limits and historic claims below are provenance, not fresh review. Current truth is unverified; A28 requires sampled truth review at this checkpoint and full truth review at promotion.\n\n\n**Status:** Evidence snapshot for the topology contract.\n**Date:** 2026-09-04.\n**Evidence scope:** Current code and generated specs in this checkout.\n**Contract:** [workspace-topology.md](workspace-topology.md).\n\nThis document records why the topology contract is needed. It is allowed to go\nstale as code changes; the contract should not."
  }
}
```

## Entry f-323: link-323

```json
{
  "id": "link-323",
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
  "reviewStatus": "pending",
  "oldDestination": "../../../architect/workspace-topology-roadmap.md",
  "newDestination": "workspace-topology-roadmap.md",
  "alias": {
    "aliasId": "step10-whole-system-1409",
    "fromPath": "docs/architect/workspace-topology-roadmap.md",
    "toOwner": "docs/platform/system-architecture/architecture/workspace-topology-roadmap.md",
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
    "title": "Workspace Topology Roadmap",
    "anchor": "workspace-topology-roadmap",
    "githubAnchor": "workspace-topology-roadmap",
    "stableAnchor": "h-0bfe53142d10",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "82add3e586f3c6fa005798bd39ad1bce62b79072e3077956418aa16084a88453",
    "sample": "Workspace Topology Roadmap",
    "sectionPayloadDigest": "0f6af1526813e543597f2d670b40dad389bb21c90db2b30ce794b81eeeb82d1b",
    "followingBlockDigest": "2ed32d04eb7641b5d876a03ee078dbd26abc18b9550430032a24e6d8ea7dd850",
    "identityFingerprint": "31915110925d887560a35384acb3ad25f1a73c9053ae2e46e57cf4df3883c686",
    "ancestry": [],
    "text": "# Workspace Topology Roadmap",
    "sectionText": "# Workspace Topology Roadmap\n\n**Status:** Planning companion for [workspace-topology.md](workspace-topology.md).\n**Date:** 2026-09-04.\n\nThis roadmap sequences the decisions and migration work required to make\nworkspace topology enforceable. It is not the contract; the contract is\n[workspace-topology.md](workspace-topology.md). Evidence lives in\n[workspace-topology-audit.md](workspace-topology-audit.md)."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Workspace Topology Roadmap",
    "anchor": "workspace-topology-roadmap",
    "githubAnchor": "workspace-topology-roadmap",
    "stableAnchor": "h-0bfe53142d10",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "31c8ead54b84d8d81540697b687d749ff83e06cc698e4e25ce68f62c38c193eb",
    "sample": "Workspace Topology Roadmap",
    "sectionPayloadDigest": "e48781dacb707e11d8471d306e61f0a342101d023d6abda489ccff5597e7bbdb",
    "followingBlockDigest": "120fffc25f8269b4e34d850a9c84e43796aa1fafc9cd67808c67ecd0579b9042",
    "identityFingerprint": "635cc19e9e5fa2c82b5711ae0186c8a621ca7f94f672b9735e09062ed25342e7",
    "ancestry": [],
    "text": "# Workspace Topology Roadmap",
    "sectionText": "# Workspace Topology Roadmap\n\n```txt\nDocument type: Architecture\nAudience: Human reviewer, architect, maintainer, agent\nPurpose: Preserve the complete workspace-topology-roadmap.md source at its frozen-map candidate owner\nDesign status: Candidate\nImplementation: Partial — inherited source qualifications; not independently truth-verified\nProvenance: docs/architect/workspace-topology-roadmap.md at 69dd3ee7fd84bc5e93fe9c75d63622d4f5aa8539 (blob 17fefba5747976105b7797be9e99e7dfc9bed510)\nWriter type: Agent carriage; independent review pending\nCanonical for: Nothing until promotion; current source remains docs/architect/workspace-topology-roadmap.md\nUse this when: Reviewing whole-system candidate carriage and placement\nDo not use this for: Inferring implementation, promotion or superseding source authority\nLast reviewed: Pending independent review\nRelated:\n- docs/architect/workspace-topology-roadmap.md\n- docs/platform/component-boundary.md\n- docs/platform/architecture-map.md\nSupersedes: None — candidate only\nSuperseded by: None\n```\n\nAdded in candidate: migration metadata and physical link rebasing. Original source metadata, dates, design limits and historic claims below are provenance, not fresh review. Current truth is unverified; A28 requires sampled truth review at this checkpoint and full truth review at promotion.\n\n\n**Status:** Planning companion for [workspace-topology.md](workspace-topology.md).\n**Date:** 2026-09-04.\n\nThis roadmap sequences the decisions and migration work required to make\nworkspace topology enforceable. It is not the contract; the contract is\n[workspace-topology.md](workspace-topology.md). Evidence lives in\n[workspace-topology-audit.md](workspace-topology-audit.md)."
  }
}
```

## Entry f-324: link-324

```json
{
  "id": "link-324",
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

## Entry f-325: link-325

```json
{
  "id": "link-325",
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
  "reviewStatus": "pending",
  "oldDestination": "../platform-foundations.md",
  "newDestination": "platform-foundations.md",
  "alias": {
    "aliasId": "root-authorities-draft-0047",
    "fromPath": "docs/platform-foundations.md",
    "toOwner": "docs/platform/platform-foundations.md",
    "toAnchor": null,
    "kind": "moved",
    "evidenceRef": "plans/260925-documentation-authority-unification/ledger/decisions/s5-root-source-completion.json",
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
    "title": "Luật nền platform forgent (Phase 0 — compound-learning stack)",
    "anchor": "luật-nền-platform-forgent-phase-0-compound-learning-stack",
    "githubAnchor": "luật-nền-platform-forgent-phase-0-compound-learning-stack",
    "stableAnchor": "h-f08b009a3284",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "41e92c8d1b769ce801adf6bfb5596e8f86dd508c788a2ebd08e5cebd24b3bab6",
    "sample": "Luật nền platform forgent (Phase 0 — compound-learning stack)",
    "sectionPayloadDigest": "9b2b89811941d17e3d72264dbe736c26e3b3c4f3e0bfa4604ae8e484bee9ed2d",
    "followingBlockDigest": "576ef4b9c089c5932e3ceb6fd85f26befd352ffb1a05e9cf768fb54a4bfe88a9",
    "identityFingerprint": "4503bd30aab97a1bee31329ad6f690dfd3b49f231eeb8655b8655f3aaf0aeb59",
    "ancestry": [],
    "text": "# Luật nền platform forgent (Phase 0 — compound-learning stack)",
    "sectionText": "# Luật nền platform forgent (Phase 0 — compound-learning stack)\n\n```txt\nLegacy status: Full source retained during migration\nPromoted target entry: docs/platform/platform-foundations.md\nRelated target anchors:\n- docs/platform/vision.md\n- docs/platform/component-boundary.md\nUse this legacy file for: Full law wording, thresholds, and rationale\nDo not use this legacy file for: Target documentation navigation\nLast reviewed: 2026-09-13\n```\n\nTài liệu này khóa các **luật thiết kế** đứng trên mọi code của compound stack\n(state/FSM → routing → compound-learning). Mỗi luật kèm: phát biểu, nguồn gốc\nbằng chứng (cú pháp `nguồn:slug` tra trong `docs/distillery/sources/`), hệ quả\nthực hành, và **ngưỡng xem lại** — luật không bất tử, nó bất tử *cho tới khi\nngưỡng có tên của nó bị chạm*. Quyết định gốc mang D-ID trong\n`.bee/decisions.jsonl`; chất liệu đầy đủ:\n`plans/reports/distill-consult-260713-2323-compound-learning-stack-report.md`\n+ `docs/distillery/deep-dives/{state,compound-engineering,routing}.md`.\n\nTrạng thái: **chốt 2026-07-13/14** (user). Thay đổi luật = supersede quyết định\nD-ID tương ứng, không sửa tại chỗ.\n\n---"
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Platform Foundations",
    "anchor": "platform-foundations",
    "githubAnchor": "platform-foundations",
    "stableAnchor": "h-dfa2c961e332",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "5c759487c5bbaf994cc259125ee951974a5884b5d2ffb76e0c26f321cd77bb8a",
    "sample": "Platform Foundations",
    "sectionPayloadDigest": "e768e1726afe9a00c736aedb86cce313a8723f0b9e4e8168808767ea578fb883",
    "followingBlockDigest": "e768e1726afe9a00c736aedb86cce313a8723f0b9e4e8168808767ea578fb883",
    "identityFingerprint": "a915d45b2ea08ed5bfbb4187bbd5c1c9150bf657fbdab309a08909eae88ae9cd",
    "ancestry": [],
    "text": "# Platform Foundations",
    "sectionText": "# Platform Foundations\n\n```txt\nDocument type: Platform foundations\nAudience: Human reviewer, architect, maintainer, agent\nPurpose: Route readers through locked platform laws and durable constraints\nDesign status: Candidate\nImplementation status: Partial\nCanonical: No\nOwner: Platform documentation\nSource type: Promoted anchor from docs/platform-foundations.md and docs/specs/platform-foundations.md\nLast reviewed: 2026-09-13\nRelated:\n- docs/platform/README.md\n- docs/platform/vision.md\n- docs/platform-foundations.md\n- docs/specs/platform-foundations.md\nImplementation: Partial; carried source truth not certified\nProvenance: docs/platform-foundations.md at f0efa3330a14d117ad89feba91bdb9b61d768339\nWriter type: Agent draft writer\nCanonical for: None until independent review and atomic cutover\nUse this when: Reviewing the full mapped legacy source and its retained direction\nDo not use this for: Proof that dated claims are currently implemented\nSupersedes: None; candidate carriage only\nSuperseded by: None\n```"
  }
}
```

## Entry f-326: link-326

```json
{
  "id": "link-326",
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
  "reviewStatus": "pending",
  "oldDestination": "../../../specs/work-state.md",
  "newDestination": "../README.md",
  "alias": {
    "aliasId": "root-authorities-draft-0073",
    "fromPath": "docs/specs/work-state.md",
    "toOwner": "docs/platform/work-state/README.md",
    "toAnchor": null,
    "kind": "merged",
    "evidenceRef": "plans/260925-documentation-authority-unification/pilot/decisions/b-behaviors.json",
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
    "title": "Spec: Work-State (tầng quản việc của forgent)",
    "anchor": "spec-work-state-tầng-quản-việc-của-forgent",
    "githubAnchor": "spec-work-state-tầng-quản-việc-của-forgent",
    "stableAnchor": "h-0d070b2449f6",
    "startLine": 9,
    "endLine": 9,
    "textDigest": "bbef379255aa6ba73f98654a66f22aa11f0939ec3e8dc0a87a9bdfcb50d8aa52",
    "sample": "Spec: Work-State (tầng quản việc của forgent)",
    "sectionPayloadDigest": "d9f06bbaa0ffe5ab3f54dd8fba4e9514ed4e126572c8a570dea57f366837d117",
    "followingBlockDigest": "d9f06bbaa0ffe5ab3f54dd8fba4e9514ed4e126572c8a570dea57f366837d117",
    "identityFingerprint": "bf1b64516976c2a0a79c008b62384aa50a2700e5a494004313a6416d85ad0401",
    "ancestry": [],
    "text": "# Spec: Work-State (tầng quản việc của forgent)",
    "sectionText": "# Spec: Work-State (tầng quản việc của forgent)\n\nBộ nhớ công việc tự quản của forgent: nơi duy nhất ghi nhận \"đang có việc gì, việc nào ở trạng thái nào, quyết định nào đã chốt\". Người dùng: người vận hành repo và agent làm việc trong repo — cả hai thao tác qua đúng một cửa lệnh `fgos`. Sự thật nằm ở **nhật ký sự kiện** append-only được commit; **bản chiếu trạng thái** hiện hành chỉ là dẫn xuất, xóa đi dựng lại được nguyên vẹn."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Work State",
    "anchor": "work-state",
    "githubAnchor": "work-state",
    "stableAnchor": "h-7e885f29a711",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "252bd4bd0b73bb5287d39df62a5d10bd81c7c72b2dc98cddbb464930df613005",
    "sample": "Work State",
    "sectionPayloadDigest": "34b3a3683fddf06454bc6de3bea4596b63fad84e2bdaff3d901a188e9703f560",
    "followingBlockDigest": "34b3a3683fddf06454bc6de3bea4596b63fad84e2bdaff3d901a188e9703f560",
    "identityFingerprint": "209648a3c62d56317b0913151dc54164a7cc0ee22d9eb90428a20273cf5a98cd",
    "ancestry": [],
    "text": "# Work State",
    "sectionText": "# Work State\n\n```txt\nDocument type: Area portal\nAudience: Human reviewer, architect, maintainer, implementation agent\nPurpose: Route readers through the candidate documents of the work state area and point to the legacy sources they are drawn from\nDesign status: Candidate\nLast reviewed: 2026-10-06\nRelated:\n- docs/platform/work-state/README.md\n- docs/platform/work-state/spec.md\n- docs/platform/work-state/contracts/cli-io-contract.md\n- docs/platform/work-state/architecture/implementation-pointers.md\n- docs/platform/work-state/decisions/retired-decision-history.md\n- docs/platform/work-state/history/multi-role-harness-distill-record.md\n- docs/specs/work-state.md\n- docs/io-contract.md\n- docs/work-item-lifecycle-vision.md\n- docs/platform/vision.md\nImplementation: Carried source material; current implementation truth unverified\nProvenance: Retained work-state candidate carriage from docs/specs/work-state.md; existing Related references retained\nWriter type: Original writer attribution not recorded; retained source provenance\nCanonical for: Candidate scope: Route readers through the candidate documents of the work state area and point to the legacy sources they are drawn from; authority follows transitional switchboard\nUse this when: Route readers through the candidate documents of the work state area and point to the legacy sources they are drawn from\nDo not use this for: Authority beyond the declared scope or implementation truth without the cited verification\nSupersedes: None; legacy sources remain in place during migration\nSuperseded by: None recorded\n```"
  }
}
```

## Entry f-327: link-327

```json
{
  "id": "link-327",
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
  "reviewStatus": "pending",
  "oldDestination": "../../../specs/work-state.md",
  "newDestination": "../README.md",
  "alias": {
    "aliasId": "root-authorities-draft-0073",
    "fromPath": "docs/specs/work-state.md",
    "toOwner": "docs/platform/work-state/README.md",
    "toAnchor": null,
    "kind": "merged",
    "evidenceRef": "plans/260925-documentation-authority-unification/pilot/decisions/b-behaviors.json",
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
    "title": "Spec: Work-State (tầng quản việc của forgent)",
    "anchor": "spec-work-state-tầng-quản-việc-của-forgent",
    "githubAnchor": "spec-work-state-tầng-quản-việc-của-forgent",
    "stableAnchor": "h-0d070b2449f6",
    "startLine": 9,
    "endLine": 9,
    "textDigest": "bbef379255aa6ba73f98654a66f22aa11f0939ec3e8dc0a87a9bdfcb50d8aa52",
    "sample": "Spec: Work-State (tầng quản việc của forgent)",
    "sectionPayloadDigest": "d9f06bbaa0ffe5ab3f54dd8fba4e9514ed4e126572c8a570dea57f366837d117",
    "followingBlockDigest": "d9f06bbaa0ffe5ab3f54dd8fba4e9514ed4e126572c8a570dea57f366837d117",
    "identityFingerprint": "bf1b64516976c2a0a79c008b62384aa50a2700e5a494004313a6416d85ad0401",
    "ancestry": [],
    "text": "# Spec: Work-State (tầng quản việc của forgent)",
    "sectionText": "# Spec: Work-State (tầng quản việc của forgent)\n\nBộ nhớ công việc tự quản của forgent: nơi duy nhất ghi nhận \"đang có việc gì, việc nào ở trạng thái nào, quyết định nào đã chốt\". Người dùng: người vận hành repo và agent làm việc trong repo — cả hai thao tác qua đúng một cửa lệnh `fgos`. Sự thật nằm ở **nhật ký sự kiện** append-only được commit; **bản chiếu trạng thái** hiện hành chỉ là dẫn xuất, xóa đi dựng lại được nguyên vẹn."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Work State",
    "anchor": "work-state",
    "githubAnchor": "work-state",
    "stableAnchor": "h-7e885f29a711",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "252bd4bd0b73bb5287d39df62a5d10bd81c7c72b2dc98cddbb464930df613005",
    "sample": "Work State",
    "sectionPayloadDigest": "34b3a3683fddf06454bc6de3bea4596b63fad84e2bdaff3d901a188e9703f560",
    "followingBlockDigest": "34b3a3683fddf06454bc6de3bea4596b63fad84e2bdaff3d901a188e9703f560",
    "identityFingerprint": "209648a3c62d56317b0913151dc54164a7cc0ee22d9eb90428a20273cf5a98cd",
    "ancestry": [],
    "text": "# Work State",
    "sectionText": "# Work State\n\n```txt\nDocument type: Area portal\nAudience: Human reviewer, architect, maintainer, implementation agent\nPurpose: Route readers through the candidate documents of the work state area and point to the legacy sources they are drawn from\nDesign status: Candidate\nLast reviewed: 2026-10-06\nRelated:\n- docs/platform/work-state/README.md\n- docs/platform/work-state/spec.md\n- docs/platform/work-state/contracts/cli-io-contract.md\n- docs/platform/work-state/architecture/implementation-pointers.md\n- docs/platform/work-state/decisions/retired-decision-history.md\n- docs/platform/work-state/history/multi-role-harness-distill-record.md\n- docs/specs/work-state.md\n- docs/io-contract.md\n- docs/work-item-lifecycle-vision.md\n- docs/platform/vision.md\nImplementation: Carried source material; current implementation truth unverified\nProvenance: Retained work-state candidate carriage from docs/specs/work-state.md; existing Related references retained\nWriter type: Original writer attribution not recorded; retained source provenance\nCanonical for: Candidate scope: Route readers through the candidate documents of the work state area and point to the legacy sources they are drawn from; authority follows transitional switchboard\nUse this when: Route readers through the candidate documents of the work state area and point to the legacy sources they are drawn from\nDo not use this for: Authority beyond the declared scope or implementation truth without the cited verification\nSupersedes: None; legacy sources remain in place during migration\nSuperseded by: None recorded\n```"
  }
}
```

## Entry f-328: link-328

```json
{
  "id": "link-328",
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
  "reviewStatus": "pending",
  "oldDestination": "../../../io-contract.md",
  "newDestination": "cli-io-contract.md",
  "alias": {
    "aliasId": "root-authorities-draft-0027",
    "fromPath": "docs/io-contract.md",
    "toOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "toAnchor": null,
    "kind": "moved",
    "evidenceRef": "plans/260925-documentation-authority-unification/pilot/decisions/b-io-contract.json",
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
    "title": "Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner`",
    "anchor": "hợp-đồng-io-của-fgos-cửa-cli-bề-mặt-stdout-của-fgos-runner",
    "githubAnchor": "hợp-đồng-io-của-fgos-cửa-cli-bề-mặt-stdout-của-fgos-runner",
    "stableAnchor": "h-370cc10f3720",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "f72297b85c91b398d8341653aabae3add3e9cfc3079149c05b594d543b853d8a",
    "sample": "Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner`",
    "sectionPayloadDigest": "b54c97321e74760179179cb14a65a3ce230f6de6cd4b1956eb1c494d4bb8f6b7",
    "followingBlockDigest": "476e7efba05e358ccd01c95cbfb350eca1cc6a7905d784c5651cb99960515322",
    "identityFingerprint": "21ac90429f5eda202fdb6e1fb642b9861daef90794b4c1f4582225c093098364",
    "ancestry": [],
    "text": "# Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner`",
    "sectionText": "# Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner`\n\nHợp đồng giao tiếp VÀO/RA hạng nhất cho bề mặt CLI của fgOS (`bin/fgos.mjs`)\nvà bề mặt stdout của vòng tự hành (`bin/fgos-runner.mjs`), theo record\n[0014](decisions/0014-kien-truc-giao-tiep-nguoi-fgos.md) (kiến trúc cửa, đã\nkhoá) và [0011](decisions/0011-version-tuong-minh-cho-moi-contract.md) (mọi\ncontract mang version tường minh `<name>/v<N>`). Tài liệu này là bản chốt\nbằng văn xuôi hợp nhất những gì `str46-io-contract` đã dựng qua ba lát —\nkhông phải code runtime mới, không lặp lại chi tiết cài đặt đã có trong\n`docs/specs/work-state.md`/`docs/specs/runner.md`.\n\n**Mục tiêu:** một transport MỚI (terminal, pane, chat, web, thứ chưa nghĩ\nra) cắm vào chỉ bằng cách dịch transport→verb (chiều vào) và đọc envelope/sổ\nverb (chiều ra) — không mở đường ghi riêng, không phải đoán hình dạng output\nbằng cách đọc mã."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "CLI I/O Contract",
    "anchor": "cli-io-contract",
    "githubAnchor": "cli-io-contract",
    "stableAnchor": "h-1a12f8bbe2ff",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "d402870da7c60d96c00eb162384d3e6c5f65e4aae549efeb991d5e8a5186bedb",
    "sample": "CLI I/O Contract",
    "sectionPayloadDigest": "a49b56e4c14198649dee1224ebf0bc991561a1b17a6bbde52b840d7b3c5775e0",
    "followingBlockDigest": "a49b56e4c14198649dee1224ebf0bc991561a1b17a6bbde52b840d7b3c5775e0",
    "identityFingerprint": "9294ce6dbff1c5fde364c4a3750c7e60e871aab7f4a505d80f6599020bcc6a81",
    "ancestry": [],
    "text": "# CLI I/O Contract",
    "sectionText": "# CLI I/O Contract\n\n```txt\nDocument type: Contract\nAudience: Human reviewer, architect, maintainer, implementation agent\nPurpose: Owns the input and output contract of the fgOS CLI door and the stdout surface of fgos-runner: writer identity, envelope, exit codes, pagination, verb manifest and version tokens.\nDesign status: Candidate\nLast reviewed: 2026-10-06\nAdded in candidate: the headings Single Write Door, Writer Source Trust Levels, Writer Resolution Rules, Caller Role, Error Path Is Not Enveloped, Runner Stdout Envelope, Recognizing A Real Envelope and Entry Fields And Effect Axes subdivide sections of the sources that have no heading of their own; the text under them is carried from the sources.\nRelated:\n- docs/platform/work-state/README.md\n- docs/platform/work-state/spec.md\n- docs/platform/work-state/decisions/retired-decision-history.md\n- docs/specs/work-state.md\n- docs/io-contract.md\nImplementation: Carried source material; current implementation truth unverified\nProvenance: Retained work-state candidate carriage from docs/specs/work-state.md and docs/io-contract.md; existing Related references retained\nWriter type: Original writer attribution not recorded; retained source provenance\nCanonical for: Candidate scope: Owns the input and output contract of the fgOS CLI door and the stdout surface of fgos-runner: writer identity, envelope, exit codes, pagination, verb manifest and version tokens; authority follows transitional switchboard\nUse this when: Owns the input and output contract of the fgOS CLI door and the stdout surface of fgos-runner: writer identity, envelope, exit codes, pagination, verb manifest and version tokens\nDo not use this for: Authority beyond the declared scope or implementation truth without the cited verification\nSupersedes: None; legacy sources remain in place during migration\nSuperseded by: None recorded\n```"
  }
}
```

## Entry f-329: link-329

```json
{
  "id": "link-329",
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
  "reviewStatus": "pending",
  "oldDestination": "../../specs/work-state.md",
  "newDestination": "README.md",
  "alias": {
    "aliasId": "root-authorities-draft-0073",
    "fromPath": "docs/specs/work-state.md",
    "toOwner": "docs/platform/work-state/README.md",
    "toAnchor": null,
    "kind": "merged",
    "evidenceRef": "plans/260925-documentation-authority-unification/pilot/decisions/b-behaviors.json",
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
    "title": "Spec: Work-State (tầng quản việc của forgent)",
    "anchor": "spec-work-state-tầng-quản-việc-của-forgent",
    "githubAnchor": "spec-work-state-tầng-quản-việc-của-forgent",
    "stableAnchor": "h-0d070b2449f6",
    "startLine": 9,
    "endLine": 9,
    "textDigest": "bbef379255aa6ba73f98654a66f22aa11f0939ec3e8dc0a87a9bdfcb50d8aa52",
    "sample": "Spec: Work-State (tầng quản việc của forgent)",
    "sectionPayloadDigest": "d9f06bbaa0ffe5ab3f54dd8fba4e9514ed4e126572c8a570dea57f366837d117",
    "followingBlockDigest": "d9f06bbaa0ffe5ab3f54dd8fba4e9514ed4e126572c8a570dea57f366837d117",
    "identityFingerprint": "bf1b64516976c2a0a79c008b62384aa50a2700e5a494004313a6416d85ad0401",
    "ancestry": [],
    "text": "# Spec: Work-State (tầng quản việc của forgent)",
    "sectionText": "# Spec: Work-State (tầng quản việc của forgent)\n\nBộ nhớ công việc tự quản của forgent: nơi duy nhất ghi nhận \"đang có việc gì, việc nào ở trạng thái nào, quyết định nào đã chốt\". Người dùng: người vận hành repo và agent làm việc trong repo — cả hai thao tác qua đúng một cửa lệnh `fgos`. Sự thật nằm ở **nhật ký sự kiện** append-only được commit; **bản chiếu trạng thái** hiện hành chỉ là dẫn xuất, xóa đi dựng lại được nguyên vẹn."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Work State",
    "anchor": "work-state",
    "githubAnchor": "work-state",
    "stableAnchor": "h-7e885f29a711",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "252bd4bd0b73bb5287d39df62a5d10bd81c7c72b2dc98cddbb464930df613005",
    "sample": "Work State",
    "sectionPayloadDigest": "34b3a3683fddf06454bc6de3bea4596b63fad84e2bdaff3d901a188e9703f560",
    "followingBlockDigest": "34b3a3683fddf06454bc6de3bea4596b63fad84e2bdaff3d901a188e9703f560",
    "identityFingerprint": "209648a3c62d56317b0913151dc54164a7cc0ee22d9eb90428a20273cf5a98cd",
    "ancestry": [],
    "text": "# Work State",
    "sectionText": "# Work State\n\n```txt\nDocument type: Area portal\nAudience: Human reviewer, architect, maintainer, implementation agent\nPurpose: Route readers through the candidate documents of the work state area and point to the legacy sources they are drawn from\nDesign status: Candidate\nLast reviewed: 2026-10-06\nRelated:\n- docs/platform/work-state/README.md\n- docs/platform/work-state/spec.md\n- docs/platform/work-state/contracts/cli-io-contract.md\n- docs/platform/work-state/architecture/implementation-pointers.md\n- docs/platform/work-state/decisions/retired-decision-history.md\n- docs/platform/work-state/history/multi-role-harness-distill-record.md\n- docs/specs/work-state.md\n- docs/io-contract.md\n- docs/work-item-lifecycle-vision.md\n- docs/platform/vision.md\nImplementation: Carried source material; current implementation truth unverified\nProvenance: Retained work-state candidate carriage from docs/specs/work-state.md; existing Related references retained\nWriter type: Original writer attribution not recorded; retained source provenance\nCanonical for: Candidate scope: Route readers through the candidate documents of the work state area and point to the legacy sources they are drawn from; authority follows transitional switchboard\nUse this when: Route readers through the candidate documents of the work state area and point to the legacy sources they are drawn from\nDo not use this for: Authority beyond the declared scope or implementation truth without the cited verification\nSupersedes: None; legacy sources remain in place during migration\nSuperseded by: None recorded\n```"
  }
}
```

## Entry f-330: link-330

```json
{
  "id": "link-330",
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
  "reviewStatus": "pending",
  "oldDestination": "../../io-contract.md",
  "newDestination": "contracts/cli-io-contract.md",
  "alias": {
    "aliasId": "root-authorities-draft-0027",
    "fromPath": "docs/io-contract.md",
    "toOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "toAnchor": null,
    "kind": "moved",
    "evidenceRef": "plans/260925-documentation-authority-unification/pilot/decisions/b-io-contract.json",
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
    "title": "Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner`",
    "anchor": "hợp-đồng-io-của-fgos-cửa-cli-bề-mặt-stdout-của-fgos-runner",
    "githubAnchor": "hợp-đồng-io-của-fgos-cửa-cli-bề-mặt-stdout-của-fgos-runner",
    "stableAnchor": "h-370cc10f3720",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "f72297b85c91b398d8341653aabae3add3e9cfc3079149c05b594d543b853d8a",
    "sample": "Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner`",
    "sectionPayloadDigest": "b54c97321e74760179179cb14a65a3ce230f6de6cd4b1956eb1c494d4bb8f6b7",
    "followingBlockDigest": "476e7efba05e358ccd01c95cbfb350eca1cc6a7905d784c5651cb99960515322",
    "identityFingerprint": "21ac90429f5eda202fdb6e1fb642b9861daef90794b4c1f4582225c093098364",
    "ancestry": [],
    "text": "# Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner`",
    "sectionText": "# Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner`\n\nHợp đồng giao tiếp VÀO/RA hạng nhất cho bề mặt CLI của fgOS (`bin/fgos.mjs`)\nvà bề mặt stdout của vòng tự hành (`bin/fgos-runner.mjs`), theo record\n[0014](decisions/0014-kien-truc-giao-tiep-nguoi-fgos.md) (kiến trúc cửa, đã\nkhoá) và [0011](decisions/0011-version-tuong-minh-cho-moi-contract.md) (mọi\ncontract mang version tường minh `<name>/v<N>`). Tài liệu này là bản chốt\nbằng văn xuôi hợp nhất những gì `str46-io-contract` đã dựng qua ba lát —\nkhông phải code runtime mới, không lặp lại chi tiết cài đặt đã có trong\n`docs/specs/work-state.md`/`docs/specs/runner.md`.\n\n**Mục tiêu:** một transport MỚI (terminal, pane, chat, web, thứ chưa nghĩ\nra) cắm vào chỉ bằng cách dịch transport→verb (chiều vào) và đọc envelope/sổ\nverb (chiều ra) — không mở đường ghi riêng, không phải đoán hình dạng output\nbằng cách đọc mã."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "CLI I/O Contract",
    "anchor": "cli-io-contract",
    "githubAnchor": "cli-io-contract",
    "stableAnchor": "h-1a12f8bbe2ff",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "d402870da7c60d96c00eb162384d3e6c5f65e4aae549efeb991d5e8a5186bedb",
    "sample": "CLI I/O Contract",
    "sectionPayloadDigest": "a49b56e4c14198649dee1224ebf0bc991561a1b17a6bbde52b840d7b3c5775e0",
    "followingBlockDigest": "a49b56e4c14198649dee1224ebf0bc991561a1b17a6bbde52b840d7b3c5775e0",
    "identityFingerprint": "9294ce6dbff1c5fde364c4a3750c7e60e871aab7f4a505d80f6599020bcc6a81",
    "ancestry": [],
    "text": "# CLI I/O Contract",
    "sectionText": "# CLI I/O Contract\n\n```txt\nDocument type: Contract\nAudience: Human reviewer, architect, maintainer, implementation agent\nPurpose: Owns the input and output contract of the fgOS CLI door and the stdout surface of fgos-runner: writer identity, envelope, exit codes, pagination, verb manifest and version tokens.\nDesign status: Candidate\nLast reviewed: 2026-10-06\nAdded in candidate: the headings Single Write Door, Writer Source Trust Levels, Writer Resolution Rules, Caller Role, Error Path Is Not Enveloped, Runner Stdout Envelope, Recognizing A Real Envelope and Entry Fields And Effect Axes subdivide sections of the sources that have no heading of their own; the text under them is carried from the sources.\nRelated:\n- docs/platform/work-state/README.md\n- docs/platform/work-state/spec.md\n- docs/platform/work-state/decisions/retired-decision-history.md\n- docs/specs/work-state.md\n- docs/io-contract.md\nImplementation: Carried source material; current implementation truth unverified\nProvenance: Retained work-state candidate carriage from docs/specs/work-state.md and docs/io-contract.md; existing Related references retained\nWriter type: Original writer attribution not recorded; retained source provenance\nCanonical for: Candidate scope: Owns the input and output contract of the fgOS CLI door and the stdout surface of fgos-runner: writer identity, envelope, exit codes, pagination, verb manifest and version tokens; authority follows transitional switchboard\nUse this when: Owns the input and output contract of the fgOS CLI door and the stdout surface of fgos-runner: writer identity, envelope, exit codes, pagination, verb manifest and version tokens\nDo not use this for: Authority beyond the declared scope or implementation truth without the cited verification\nSupersedes: None; legacy sources remain in place during migration\nSuperseded by: None recorded\n```"
  }
}
```

## Entry f-331: link-331

```json
{
  "id": "link-331",
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
  "reviewStatus": "pending",
  "oldDestination": "../platform-foundations.md",
  "newDestination": "platform-foundations.md",
  "alias": {
    "aliasId": "root-authorities-draft-0047",
    "fromPath": "docs/platform-foundations.md",
    "toOwner": "docs/platform/platform-foundations.md",
    "toAnchor": null,
    "kind": "moved",
    "evidenceRef": "plans/260925-documentation-authority-unification/ledger/decisions/s5-root-source-completion.json",
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
    "title": "Luật nền platform forgent (Phase 0 — compound-learning stack)",
    "anchor": "luật-nền-platform-forgent-phase-0-compound-learning-stack",
    "githubAnchor": "luật-nền-platform-forgent-phase-0-compound-learning-stack",
    "stableAnchor": "h-f08b009a3284",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "41e92c8d1b769ce801adf6bfb5596e8f86dd508c788a2ebd08e5cebd24b3bab6",
    "sample": "Luật nền platform forgent (Phase 0 — compound-learning stack)",
    "sectionPayloadDigest": "9b2b89811941d17e3d72264dbe736c26e3b3c4f3e0bfa4604ae8e484bee9ed2d",
    "followingBlockDigest": "576ef4b9c089c5932e3ceb6fd85f26befd352ffb1a05e9cf768fb54a4bfe88a9",
    "identityFingerprint": "4503bd30aab97a1bee31329ad6f690dfd3b49f231eeb8655b8655f3aaf0aeb59",
    "ancestry": [],
    "text": "# Luật nền platform forgent (Phase 0 — compound-learning stack)",
    "sectionText": "# Luật nền platform forgent (Phase 0 — compound-learning stack)\n\n```txt\nLegacy status: Full source retained during migration\nPromoted target entry: docs/platform/platform-foundations.md\nRelated target anchors:\n- docs/platform/vision.md\n- docs/platform/component-boundary.md\nUse this legacy file for: Full law wording, thresholds, and rationale\nDo not use this legacy file for: Target documentation navigation\nLast reviewed: 2026-09-13\n```\n\nTài liệu này khóa các **luật thiết kế** đứng trên mọi code của compound stack\n(state/FSM → routing → compound-learning). Mỗi luật kèm: phát biểu, nguồn gốc\nbằng chứng (cú pháp `nguồn:slug` tra trong `docs/distillery/sources/`), hệ quả\nthực hành, và **ngưỡng xem lại** — luật không bất tử, nó bất tử *cho tới khi\nngưỡng có tên của nó bị chạm*. Quyết định gốc mang D-ID trong\n`.bee/decisions.jsonl`; chất liệu đầy đủ:\n`plans/reports/distill-consult-260713-2323-compound-learning-stack-report.md`\n+ `docs/distillery/deep-dives/{state,compound-engineering,routing}.md`.\n\nTrạng thái: **chốt 2026-07-13/14** (user). Thay đổi luật = supersede quyết định\nD-ID tương ứng, không sửa tại chỗ.\n\n---"
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Platform Foundations",
    "anchor": "platform-foundations",
    "githubAnchor": "platform-foundations",
    "stableAnchor": "h-dfa2c961e332",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "5c759487c5bbaf994cc259125ee951974a5884b5d2ffb76e0c26f321cd77bb8a",
    "sample": "Platform Foundations",
    "sectionPayloadDigest": "e768e1726afe9a00c736aedb86cce313a8723f0b9e4e8168808767ea578fb883",
    "followingBlockDigest": "e768e1726afe9a00c736aedb86cce313a8723f0b9e4e8168808767ea578fb883",
    "identityFingerprint": "a915d45b2ea08ed5bfbb4187bbd5c1c9150bf657fbdab309a08909eae88ae9cd",
    "ancestry": [],
    "text": "# Platform Foundations",
    "sectionText": "# Platform Foundations\n\n```txt\nDocument type: Platform foundations\nAudience: Human reviewer, architect, maintainer, agent\nPurpose: Route readers through locked platform laws and durable constraints\nDesign status: Candidate\nImplementation status: Partial\nCanonical: No\nOwner: Platform documentation\nSource type: Promoted anchor from docs/platform-foundations.md and docs/specs/platform-foundations.md\nLast reviewed: 2026-09-13\nRelated:\n- docs/platform/README.md\n- docs/platform/vision.md\n- docs/platform-foundations.md\n- docs/specs/platform-foundations.md\nImplementation: Partial; carried source truth not certified\nProvenance: docs/platform-foundations.md at f0efa3330a14d117ad89feba91bdb9b61d768339\nWriter type: Agent draft writer\nCanonical for: None until independent review and atomic cutover\nUse this when: Reviewing the full mapped legacy source and its retained direction\nDo not use this for: Proof that dated claims are currently implemented\nSupersedes: None; candidate carriage only\nSuperseded by: None\n```"
  }
}
```

## Entry f-332: link-332

```json
{
  "id": "link-332",
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
  "reviewStatus": "pending",
  "oldDestination": "../architect/agent-coordination/intent-preservation-ledger.md",
  "newDestination": "agent-coordination/README.md",
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

## Entry f-333: link-333

```json
{
  "id": "link-333",
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
  "reviewStatus": "pending",
  "oldDestination": "../platform-foundations.md",
  "newDestination": "platform-foundations.md",
  "alias": {
    "aliasId": "root-authorities-draft-0047",
    "fromPath": "docs/platform-foundations.md",
    "toOwner": "docs/platform/platform-foundations.md",
    "toAnchor": null,
    "kind": "moved",
    "evidenceRef": "plans/260925-documentation-authority-unification/ledger/decisions/s5-root-source-completion.json",
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
    "title": "Luật nền platform forgent (Phase 0 — compound-learning stack)",
    "anchor": "luật-nền-platform-forgent-phase-0-compound-learning-stack",
    "githubAnchor": "luật-nền-platform-forgent-phase-0-compound-learning-stack",
    "stableAnchor": "h-f08b009a3284",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "41e92c8d1b769ce801adf6bfb5596e8f86dd508c788a2ebd08e5cebd24b3bab6",
    "sample": "Luật nền platform forgent (Phase 0 — compound-learning stack)",
    "sectionPayloadDigest": "9b2b89811941d17e3d72264dbe736c26e3b3c4f3e0bfa4604ae8e484bee9ed2d",
    "followingBlockDigest": "576ef4b9c089c5932e3ceb6fd85f26befd352ffb1a05e9cf768fb54a4bfe88a9",
    "identityFingerprint": "4503bd30aab97a1bee31329ad6f690dfd3b49f231eeb8655b8655f3aaf0aeb59",
    "ancestry": [],
    "text": "# Luật nền platform forgent (Phase 0 — compound-learning stack)",
    "sectionText": "# Luật nền platform forgent (Phase 0 — compound-learning stack)\n\n```txt\nLegacy status: Full source retained during migration\nPromoted target entry: docs/platform/platform-foundations.md\nRelated target anchors:\n- docs/platform/vision.md\n- docs/platform/component-boundary.md\nUse this legacy file for: Full law wording, thresholds, and rationale\nDo not use this legacy file for: Target documentation navigation\nLast reviewed: 2026-09-13\n```\n\nTài liệu này khóa các **luật thiết kế** đứng trên mọi code của compound stack\n(state/FSM → routing → compound-learning). Mỗi luật kèm: phát biểu, nguồn gốc\nbằng chứng (cú pháp `nguồn:slug` tra trong `docs/distillery/sources/`), hệ quả\nthực hành, và **ngưỡng xem lại** — luật không bất tử, nó bất tử *cho tới khi\nngưỡng có tên của nó bị chạm*. Quyết định gốc mang D-ID trong\n`.bee/decisions.jsonl`; chất liệu đầy đủ:\n`plans/reports/distill-consult-260713-2323-compound-learning-stack-report.md`\n+ `docs/distillery/deep-dives/{state,compound-engineering,routing}.md`.\n\nTrạng thái: **chốt 2026-07-13/14** (user). Thay đổi luật = supersede quyết định\nD-ID tương ứng, không sửa tại chỗ.\n\n---"
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Platform Foundations",
    "anchor": "platform-foundations",
    "githubAnchor": "platform-foundations",
    "stableAnchor": "h-dfa2c961e332",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "5c759487c5bbaf994cc259125ee951974a5884b5d2ffb76e0c26f321cd77bb8a",
    "sample": "Platform Foundations",
    "sectionPayloadDigest": "e768e1726afe9a00c736aedb86cce313a8723f0b9e4e8168808767ea578fb883",
    "followingBlockDigest": "e768e1726afe9a00c736aedb86cce313a8723f0b9e4e8168808767ea578fb883",
    "identityFingerprint": "a915d45b2ea08ed5bfbb4187bbd5c1c9150bf657fbdab309a08909eae88ae9cd",
    "ancestry": [],
    "text": "# Platform Foundations",
    "sectionText": "# Platform Foundations\n\n```txt\nDocument type: Platform foundations\nAudience: Human reviewer, architect, maintainer, agent\nPurpose: Route readers through locked platform laws and durable constraints\nDesign status: Candidate\nImplementation status: Partial\nCanonical: No\nOwner: Platform documentation\nSource type: Promoted anchor from docs/platform-foundations.md and docs/specs/platform-foundations.md\nLast reviewed: 2026-09-13\nRelated:\n- docs/platform/README.md\n- docs/platform/vision.md\n- docs/platform-foundations.md\n- docs/specs/platform-foundations.md\nImplementation: Partial; carried source truth not certified\nProvenance: docs/platform-foundations.md at f0efa3330a14d117ad89feba91bdb9b61d768339\nWriter type: Agent draft writer\nCanonical for: None until independent review and atomic cutover\nUse this when: Reviewing the full mapped legacy source and its retained direction\nDo not use this for: Proof that dated claims are currently implemented\nSupersedes: None; candidate carriage only\nSuperseded by: None\n```"
  }
}
```

## Entry f-334: link-334

```json
{
  "id": "link-334",
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
  "reviewStatus": "pending",
  "oldDestination": "../architecture-map.md",
  "newDestination": "architecture-map.md",
  "alias": {
    "aliasId": "step10-whole-system-1520",
    "fromPath": "docs/architecture-map.md",
    "toOwner": "docs/platform/architecture-map.md",
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
    "title": "Bản đồ kiến trúc fgOS — một khung chính, hai lớp phủ, hai sổ đăng ký",
    "anchor": "bản-đồ-kiến-trúc-fgos-một-khung-chính-hai-lớp-phủ-hai-sổ-đăng-ký",
    "githubAnchor": "bản-đồ-kiến-trúc-fgos-một-khung-chính-hai-lớp-phủ-hai-sổ-đăng-ký",
    "stableAnchor": "h-40c3bdbe06b5",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "e9b8dc72faf32ca302a347b6710b983f21132879e34fc0bf96d0038c46eb695f",
    "sample": "Bản đồ kiến trúc fgOS — một khung chính, hai lớp phủ, hai sổ đăng ký",
    "sectionPayloadDigest": "7f767323cf49d61ac69ffd6f9e8cedf7e9c24d31e151df0dc1a8ea16800de2e0",
    "followingBlockDigest": "0a323eca0f30fbe836d6962d2fcabc973b03ee842a69b31a627de9fd74d0c7e1",
    "identityFingerprint": "16ec7666f0dc5296a93b7ca528be70da783383f02ec7ca0fd86c03d4e92e3b15",
    "ancestry": [],
    "text": "# Bản đồ kiến trúc fgOS — một khung chính, hai lớp phủ, hai sổ đăng ký",
    "sectionText": "# Bản đồ kiến trúc fgOS — một khung chính, hai lớp phủ, hai sổ đăng ký\n\n```txt\nLegacy status: Promoted source\nPromoted to: docs/platform/architecture-map.md\nRelated target anchors:\n- docs/platform/component-boundary.md\n- docs/platform/platform-foundations.md\n- docs/platform/vision.md\nUse this legacy file for: Full historical architecture-map detail during migration\nDo not use this legacy file for: The target documentation entry path\nLast reviewed: 2026-09-13\n```\n\n**Phiên bản:** v0.6. **Trạng thái:** CHUẨN — chấp nhận 2026-07-16, record\n[0010](decisions/0010-ban-do-kien-truc-la-ban-chuan.md); nâng v0.3 theo record\n[0012](decisions/0012-typed-edge-model-supersedes-deps-parent-separation.md);\nnâng v0.4 theo record\n[0013](decisions/0013-discovered-from-runner-report-channel.md); nâng v0.5\ntheo record\n[0015](decisions/0015-doi-ten-ctr-cho-contract.md); nâng v0.6 theo record\n[0017](decisions/0017-dong-audit-he-id-ten-goi.md) (§12 thêm dòng id-systems-audit,\nPhụ lục B mới — sổ đăng ký 13 hệ id/tên gọi).\n\nChưng từ tài liệu bàn luận ở xưởng và hai deep-dive distillery (`work-item-management`,\n`work-item-schema-and-io-contracts`); v0.2 sửa theo hai vòng tự phản biện có kiểm\nchứng trên code (hồ sơ hai vòng lưu ở xưởng). Tài liệu này là **bản chuẩn kiến trúc\ncủa sản phẩm**: mọi ví dụ là thành phần fgOS. Thay đổi bản đồ về sau đi qua decision\nrecord kèm nâng version — supersede, không sửa ngầm.\n\n**Changelog v0.1 → v0.2** (tóm tắt — chi tiết ở §11):\n\n1. Thứ tự tầng sửa theo import graph THẬT: `Entry → Use-case → Infra → Domain →\n   Kernel` (v0.1 đặt Domain trên Infra — bị chính đồ thị import bác bỏ).\n2. Host Adapter không còn là tầng đầu chuỗi — là **ổ cắm** (port + config) bên hông.\n3. Sổ component xây lại bottom-up từ inventory file: đủ 13 module (v0.1 thiếu 5),\n   tách hai loại row **component** (một nhà) và **slice** (lát dọc).\n4. Thêm contract **CTR009 · executor.v1** (biên model-gateway ↔ provider — đã live,\n   trước đây vô danh); CTR006 hạ maturity `live` → `designed` cho đúng sự thật.\n5. Sequence §8 thêm **nhánh fail** (park/halt → friction, chỗ S2 cắm vào).\n6. Thêm §12: quan hệ với `system-overview.md`, `reading-map.md`, `backlog.md`.\n\n**Changelog v0.2 → v0.3** (record [0012](decisions/0012-typed-edge-model-supersedes-deps-parent-separation.md) — supersede ADR0002, chi tiết ở §11):\n\n1. `src/state/dep-graph.mjs` (§6) không còn chỉ kiểm chu trình trên `deps` —\n   đổi thành đồ thị cạnh-định-kiểu HỢP NHẤT `blocks`+`parent-child` (`deps`\n   chiếu `blocks`, `parent` chiếu `parent-child`), đã ship + verify xanh.\n2. Contract **CTR002** (§7) thêm mệnh đề bất biến phi-chu-trình: bảo đảm một-cửa-\n   ghi giờ phủ đồ thị hợp nhất `blocks`+`parent-child`, không chỉ `deps` —\n   đóng một lỗ hổng chu trình cha-con sống (benign) mà bản đồ chưa từng khai.\n3. \"deps và parent tách rời có chủ đích\" (decision ADR0002) được supersede: tách\n   rời về lưu trữ vẫn giữ, nhưng hợp nhất thành một đồ thị cho cycle-check +\n   compute. Không đổi schema tại thời điểm đó — `SCHEMA_VERSION` khi ấy vẫn là\n   2 (nay đã lên 3, per D19/D27 str46-io-contract), không có row §6/manifest\n   mới (mở rộng module đã có, không tạo module mới).\n\n**Changelog v0.3 → v0.4** (record [0013](decisions/0013-discovered-from-runner-report-channel.md) — mở rộng CTR003, không supersede):\n\n1. Contract **CTR003** (§7, orchestrator ↔ worker) thêm một mệnh đề **kênh\n   báo-cáo-không-ghi** (report-not-write): worker CÓ THỂ phát một khối\n   `fgos-discovered` (dữ liệu thuần) trong output để nêu một việc mới phát\n   hiện; worker vẫn KHÔNG BAO GIỜ gọi `fgos` hay ghi `.fgos/` — RUNNER đọc\n   khối đó và tự tạo item với `discoveredFrom` trỏ về việc đang chạy. Bảo đảm\n   runner-một-cửa-ghi (D3) giữ nguyên tuyệt đối.\n2. Không đổi schema tại thời điểm đó, không module mới, không row §6/manifest\n   mới — `loop.mjs` và `dispatch.mjs` đã có (mở rộng tại chỗ). Trường `discoveredFrom`\n   là lineage phi-chặn (loại khỏi cycle-check theo thiết kế), cưỡi SCHEMA_VERSION\n   khi ấy vẫn là 2 (nay đã lên 3, per D19/D27 str46-io-contract).\n\n**Changelog v0.4 → v0.5** (record [0015](decisions/0015-doi-ten-ctr-cho-contract.md) — đổi tên định danh, không supersede):\n\n1. Định danh contract một-chữ-số-trần cũ (§7, từ số 1 đến số 9) đổi tên\n   thành `CTR001`-`CTR009` (3-digit zero-padded, cùng quy ước padding với\n   `RUL<n>`), theo `docs/id-systems-audit.md` #6. Đổi tên thuần — không đổi\n   ý nghĩa, ranh giới, hay maturity của bất kỳ contract nào; mỗi contract\n   vẫn là cùng một contract, chỉ đổi cách viết định danh.\n2. Không đổi schema, không module mới, không row §6/manifest mới — chỉ đổi\n   nhãn ở mọi nơi contract ID xuất hiện trong file này (§6, §7, hai sơ đồ\n   mermaid, changelog, câu hỏi mở).\n\n---"
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Architecture Map",
    "anchor": "architecture-map",
    "githubAnchor": "architecture-map",
    "stableAnchor": "h-77b8a1b8c2ff",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "05d9cc45eefa33ab959c9dad93935840f85544e60a48d41118f0cefcef038479",
    "sample": "Architecture Map",
    "sectionPayloadDigest": "c1a112a5119ac918a129af9cc8ac7f36d9e86437d94546de04846a11bd40d7ae",
    "followingBlockDigest": "c1a112a5119ac918a129af9cc8ac7f36d9e86437d94546de04846a11bd40d7ae",
    "identityFingerprint": "f11e0c362f2655c623b478cc9c5046b9d1acbf275aa9516a6eeb7b44dd8e118e",
    "ancestry": [],
    "text": "# Architecture Map",
    "sectionText": "# Architecture Map\n\n```txt\nDocument type: Platform architecture map\nAudience: Human reviewer, architect, maintainer, agent\nPurpose: Route readers through the whole-system architecture map\nDesign status: Draft\nImplementation status: Partial\nCanonical: Yes, after review\nOwner: Platform documentation\nSource type: Promoted anchor from docs/architecture-map.md\nLast reviewed: 2026-09-13\nRelated:\n- docs/platform/README.md\n- docs/platform/component-boundary.md\n- docs/architecture-map.md\nImplementation: Partial\nProvenance: Promoted anchor from docs/architecture-map.md\nWriter type: Original writer attribution not recorded; retained source provenance\nCanonical for: Candidate scope: Route readers through the whole-system architecture map; authority follows transitional switchboard\nUse this when: Route readers through the whole-system architecture map\nDo not use this for: Authority beyond the declared scope or implementation truth without the cited verification\nSupersedes: None; legacy sources remain in place during migration\nSuperseded by: None recorded\n```"
  }
}
```

## Entry f-335: link-335

```json
{
  "id": "link-335",
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
  "reviewStatus": "pending",
  "oldDestination": "../routing-handoff-contract.md",
  "newDestination": "runner/contracts/routing-handoff.md",
  "alias": {
    "aliasId": "root-authorities-draft-0066",
    "fromPath": "docs/routing-handoff-contract.md",
    "toOwner": "docs/platform/runner/contracts/routing-handoff.md",
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
    "title": "Routing Handoff Contract — fgos-runner",
    "anchor": "routing-handoff-contract-fgos-runner",
    "githubAnchor": "routing-handoff-contract-fgos-runner",
    "stableAnchor": "h-c9955a9d3eec",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "8f61f45a3a22860498899b29f2bf0eeb07569c9a31ad502bf91292748ba8411a",
    "sample": "Routing Handoff Contract — fgos-runner",
    "sectionPayloadDigest": "509c09f8d9c5d789b48446cbc179231de7fa268133ade3900676a574f08732b9",
    "followingBlockDigest": "509c09f8d9c5d789b48446cbc179231de7fa268133ade3900676a574f08732b9",
    "identityFingerprint": "06f6a748d60693f65ddb820d8be808bfcb51069584514c84d7b23860fe492ed5",
    "ancestry": [],
    "text": "# Routing Handoff Contract — fgos-runner",
    "sectionText": "# Routing Handoff Contract — fgos-runner\n\nContract chuyển việc **agent ↔ agent trong chain** cho vòng lặp runner (Phase\n2, epic E3). Theo luật routing-theo-audience (`docs/platform-foundations.md`\nL4, D-ID `14ebeea9`): agent↔agent trong chain dùng **prose-handoff tường\nminh**, không JSON contract — LLM đọc prose tốt hơn parse JSON. Tài liệu này\nlà bản chốt bằng văn xuôi của contract đó cho runner cụ thể; không phải code\nruntime mới (chỉ prose + bảng)."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Routing Handoff Contract — fgos-runner",
    "anchor": "routing-handoff-contract-fgos-runner",
    "githubAnchor": "routing-handoff-contract-fgos-runner",
    "stableAnchor": "h-c9955a9d3eec",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "8a4633a098112bd85e3e30b3926de510983a1a6b5470193e311d1b0dea3b4348",
    "sample": "Routing Handoff Contract — fgos-runner",
    "sectionPayloadDigest": "e5a5e092bb246aeabc0406f30769b066d30452b4a8dbdb8c8044e70644f6b158",
    "followingBlockDigest": "2cf8b2804c543a24a8069e49f7298d2469fabb5efa38f475bfeb6782000fab7f",
    "identityFingerprint": "d45d4b80def8a3e66972203c7df464213ead01eed9ce940f52a5ee0338048be2",
    "ancestry": [],
    "text": "# Routing Handoff Contract — fgos-runner",
    "sectionText": "# Routing Handoff Contract — fgos-runner\n\n```txt\nDocument type: Contract\nAudience: Documentation migration reviewer, maintainer, agent\nPurpose: Preserve the mapped source as candidate material for conservation review\nDesign status: Candidate\nImplementation: Historical source retained; current truth not certified\nProvenance: docs/routing-handoff-contract.md at ad2ca83e245bbd76c0d275cc30366457b26c8df3\nWriter type: Agent draft writer\nCanonical: No\nCanonical for: None; candidate only\nUse this when: Reviewing conservation of the mapped legacy source\nDo not use this for: Current canonical authority or proof of implemented behavior\nLast reviewed: 2026-10-14\nRelated:\n- docs/routing-handoff-contract.md\nSupersedes: None; candidate only\nSuperseded by: None\n```\n\nContract chuyển việc **agent ↔ agent trong chain** cho vòng lặp runner (Phase\n2, epic E3). Theo luật routing-theo-audience (`docs/platform-foundations.md`\nL4, D-ID `14ebeea9`): agent↔agent trong chain dùng **prose-handoff tường\nminh**, không JSON contract — LLM đọc prose tốt hơn parse JSON. Tài liệu này\nlà bản chốt bằng văn xuôi của contract đó cho runner cụ thể; không phải code\nruntime mới (chỉ prose + bảng)."
  }
}
```

## Entry f-336: link-336

```json
{
  "id": "link-336",
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
  "reviewStatus": "pending",
  "oldDestination": "../specs/runner.md",
  "newDestination": "runner/README.md",
  "alias": {
    "aliasId": "step10-runner-0001",
    "fromPath": "docs/specs/runner.md",
    "toOwner": "docs/platform/runner/README.md",
    "toAnchor": null,
    "kind": "moved",
    "evidenceRef": "plans/260925-documentation-authority-unification/ledger/area-map-runner.md",
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
    "title": "Spec: Runner (vòng tự hành)",
    "anchor": "spec-runner-vòng-tự-hành",
    "githubAnchor": "spec-runner-vòng-tự-hành",
    "stableAnchor": "h-cf32145a0715",
    "startLine": 9,
    "endLine": 9,
    "textDigest": "a86d867279b4935bdfdfe419a3121f088ead4fe51ea0a62fbfec1da3949cb54c",
    "sample": "Spec: Runner (vòng tự hành)",
    "sectionPayloadDigest": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "followingBlockDigest": null,
    "identityFingerprint": "3cd6fbc17111343773fbdc31c12203474377a0dd3fd697308c6eb7fdf0326213",
    "ancestry": [],
    "text": "# Spec: Runner (vòng tự hành)",
    "sectionText": "# Spec: Runner (vòng tự hành)"
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Runner candidate area",
    "anchor": "runner-candidate-area",
    "githubAnchor": "runner-candidate-area",
    "stableAnchor": "h-e8e77031d058",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "8f85b4fcfa3a55a15633d9bd933117e32d41e496e35fb45ad7a780bb2731523b",
    "sample": "Runner candidate area",
    "sectionPayloadDigest": "92292e684fce34bd22e97057edac9d97e78396dbb0aa0d67a4f0a646236e7454",
    "followingBlockDigest": "0dd22b80ce69d32f5ee9bf0591f3ced11c75d6d57d9708804636fe54a052f741",
    "identityFingerprint": "12241bc94c247eee42a98c1040e13ebca7149de17c49b63b3047210ca2daf1b5",
    "ancestry": [],
    "text": "# Runner candidate area",
    "sectionText": "# Runner candidate area\n\n\n```txt\nDocument type: Area portal\nAudience: Documentation migration reviewer, maintainer, agent\nPurpose: Preserve frozen-map runner content for independent conservation review\nDesign status: Candidate\nImplementation: Carriage only; implementation truth not certified\nProvenance: docs/specs/runner.md at 63fa6f15266f45c881f610235e0be8d61ff07120; blob ddfa78cc7183cf1f7db8ee64d2339653a0aa0023\nWriter type: Agent draft writer\nCanonical: No\nCanonical for: None; candidate only\nUse this when: Reviewing runner carriage, placement and conservation\nDo not use this for: Canonical behavior, source retirement or current truth proof\nLast reviewed: Not independently reviewed; authored 2026-10-15\nRelated:\n- docs/specs/runner.md\nSupersedes: None; legacy authority retained\nSuperseded by: None\n```\n\n> Added in candidate: Metadata and map-based placement scaffolding. This is Added in candidate navigation only; no component or authority change. Known stale carried sentences; full truth check owed at promotion. A19 carriage and explicit Lead A35 note preserve deleted-module, retired-corpus, moved-plan and runner.md:<line> text verbatim."
  }
}
```

## Entry f-337: link-337

```json
{
  "id": "link-337",
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
  "reviewStatus": "pending",
  "oldDestination": "../specs/work-state.md",
  "newDestination": "work-state/README.md",
  "alias": {
    "aliasId": "root-authorities-draft-0073",
    "fromPath": "docs/specs/work-state.md",
    "toOwner": "docs/platform/work-state/README.md",
    "toAnchor": null,
    "kind": "merged",
    "evidenceRef": "plans/260925-documentation-authority-unification/pilot/decisions/b-behaviors.json",
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
    "title": "Spec: Work-State (tầng quản việc của forgent)",
    "anchor": "spec-work-state-tầng-quản-việc-của-forgent",
    "githubAnchor": "spec-work-state-tầng-quản-việc-của-forgent",
    "stableAnchor": "h-0d070b2449f6",
    "startLine": 9,
    "endLine": 9,
    "textDigest": "bbef379255aa6ba73f98654a66f22aa11f0939ec3e8dc0a87a9bdfcb50d8aa52",
    "sample": "Spec: Work-State (tầng quản việc của forgent)",
    "sectionPayloadDigest": "d9f06bbaa0ffe5ab3f54dd8fba4e9514ed4e126572c8a570dea57f366837d117",
    "followingBlockDigest": "d9f06bbaa0ffe5ab3f54dd8fba4e9514ed4e126572c8a570dea57f366837d117",
    "identityFingerprint": "bf1b64516976c2a0a79c008b62384aa50a2700e5a494004313a6416d85ad0401",
    "ancestry": [],
    "text": "# Spec: Work-State (tầng quản việc của forgent)",
    "sectionText": "# Spec: Work-State (tầng quản việc của forgent)\n\nBộ nhớ công việc tự quản của forgent: nơi duy nhất ghi nhận \"đang có việc gì, việc nào ở trạng thái nào, quyết định nào đã chốt\". Người dùng: người vận hành repo và agent làm việc trong repo — cả hai thao tác qua đúng một cửa lệnh `fgos`. Sự thật nằm ở **nhật ký sự kiện** append-only được commit; **bản chiếu trạng thái** hiện hành chỉ là dẫn xuất, xóa đi dựng lại được nguyên vẹn."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Work State",
    "anchor": "work-state",
    "githubAnchor": "work-state",
    "stableAnchor": "h-7e885f29a711",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "252bd4bd0b73bb5287d39df62a5d10bd81c7c72b2dc98cddbb464930df613005",
    "sample": "Work State",
    "sectionPayloadDigest": "34b3a3683fddf06454bc6de3bea4596b63fad84e2bdaff3d901a188e9703f560",
    "followingBlockDigest": "34b3a3683fddf06454bc6de3bea4596b63fad84e2bdaff3d901a188e9703f560",
    "identityFingerprint": "209648a3c62d56317b0913151dc54164a7cc0ee22d9eb90428a20273cf5a98cd",
    "ancestry": [],
    "text": "# Work State",
    "sectionText": "# Work State\n\n```txt\nDocument type: Area portal\nAudience: Human reviewer, architect, maintainer, implementation agent\nPurpose: Route readers through the candidate documents of the work state area and point to the legacy sources they are drawn from\nDesign status: Candidate\nLast reviewed: 2026-10-06\nRelated:\n- docs/platform/work-state/README.md\n- docs/platform/work-state/spec.md\n- docs/platform/work-state/contracts/cli-io-contract.md\n- docs/platform/work-state/architecture/implementation-pointers.md\n- docs/platform/work-state/decisions/retired-decision-history.md\n- docs/platform/work-state/history/multi-role-harness-distill-record.md\n- docs/specs/work-state.md\n- docs/io-contract.md\n- docs/work-item-lifecycle-vision.md\n- docs/platform/vision.md\nImplementation: Carried source material; current implementation truth unverified\nProvenance: Retained work-state candidate carriage from docs/specs/work-state.md; existing Related references retained\nWriter type: Original writer attribution not recorded; retained source provenance\nCanonical for: Candidate scope: Route readers through the candidate documents of the work state area and point to the legacy sources they are drawn from; authority follows transitional switchboard\nUse this when: Route readers through the candidate documents of the work state area and point to the legacy sources they are drawn from\nDo not use this for: Authority beyond the declared scope or implementation truth without the cited verification\nSupersedes: None; legacy sources remain in place during migration\nSuperseded by: None recorded\n```"
  }
}
```

## Entry f-338: link-338

```json
{
  "id": "link-338",
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
  "reviewStatus": "pending",
  "oldDestination": "../specs/distribution.md",
  "newDestination": "packaging-distribution/README.md",
  "alias": {
    "aliasId": "step10-specs-0245",
    "fromPath": "docs/specs/distribution.md",
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
    "title": "Spec: Distribution",
    "anchor": "spec-distribution",
    "githubAnchor": "spec-distribution",
    "stableAnchor": "h-a08ee0ebec2b",
    "startLine": 22,
    "endLine": 22,
    "textDigest": "1c988598ecab9fafad8791366e0117bbe4c10e7428e0e63631ce34eafb617553",
    "sample": "Spec: Distribution",
    "sectionPayloadDigest": "38e7467e63d434cad969f415699ed7a67abeaa8becb100975d091f9ad55a7074",
    "followingBlockDigest": "38e7467e63d434cad969f415699ed7a67abeaa8becb100975d091f9ad55a7074",
    "identityFingerprint": "0bbea23d0051847b56bfde9f572bb59153c829cd8510c9de61d5922eb5e1bd70",
    "ancestry": [],
    "text": "# Spec: Distribution",
    "sectionText": "# Spec: Distribution\n\nHow a developer gets the `fgos` and `fgos-runner` commands running — either\nonto their own machine and into their own project from outside the forgent\nsource repository, or directly from inside a checkout of the source\nrepository itself, without a separate install. Used by: a developer who\nwants to run `fgos` in a project that is not this repo, and a forgent\ncontributor working inside this repo's own checkout (or a linked worktree\nof it)."
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

## Entry f-339: link-339

```json
{
  "id": "link-339",
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

## Entry f-340: link-340

```json
{
  "id": "link-340",
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

## Entry f-341: link-341

```json
{
  "id": "link-341",
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

## Entry f-342: link-342

```json
{
  "id": "link-342",
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
  "reviewStatus": "pending",
  "oldDestination": "../../specs/runner.md",
  "newDestination": "../runner/README.md",
  "alias": {
    "aliasId": "step10-runner-0001",
    "fromPath": "docs/specs/runner.md",
    "toOwner": "docs/platform/runner/README.md",
    "toAnchor": null,
    "kind": "moved",
    "evidenceRef": "plans/260925-documentation-authority-unification/ledger/area-map-runner.md",
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
    "title": "Spec: Runner (vòng tự hành)",
    "anchor": "spec-runner-vòng-tự-hành",
    "githubAnchor": "spec-runner-vòng-tự-hành",
    "stableAnchor": "h-cf32145a0715",
    "startLine": 9,
    "endLine": 9,
    "textDigest": "a86d867279b4935bdfdfe419a3121f088ead4fe51ea0a62fbfec1da3949cb54c",
    "sample": "Spec: Runner (vòng tự hành)",
    "sectionPayloadDigest": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "followingBlockDigest": null,
    "identityFingerprint": "3cd6fbc17111343773fbdc31c12203474377a0dd3fd697308c6eb7fdf0326213",
    "ancestry": [],
    "text": "# Spec: Runner (vòng tự hành)",
    "sectionText": "# Spec: Runner (vòng tự hành)"
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Runner candidate area",
    "anchor": "runner-candidate-area",
    "githubAnchor": "runner-candidate-area",
    "stableAnchor": "h-e8e77031d058",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "8f85b4fcfa3a55a15633d9bd933117e32d41e496e35fb45ad7a780bb2731523b",
    "sample": "Runner candidate area",
    "sectionPayloadDigest": "92292e684fce34bd22e97057edac9d97e78396dbb0aa0d67a4f0a646236e7454",
    "followingBlockDigest": "0dd22b80ce69d32f5ee9bf0591f3ced11c75d6d57d9708804636fe54a052f741",
    "identityFingerprint": "12241bc94c247eee42a98c1040e13ebca7149de17c49b63b3047210ca2daf1b5",
    "ancestry": [],
    "text": "# Runner candidate area",
    "sectionText": "# Runner candidate area\n\n\n```txt\nDocument type: Area portal\nAudience: Documentation migration reviewer, maintainer, agent\nPurpose: Preserve frozen-map runner content for independent conservation review\nDesign status: Candidate\nImplementation: Carriage only; implementation truth not certified\nProvenance: docs/specs/runner.md at 63fa6f15266f45c881f610235e0be8d61ff07120; blob ddfa78cc7183cf1f7db8ee64d2339653a0aa0023\nWriter type: Agent draft writer\nCanonical: No\nCanonical for: None; candidate only\nUse this when: Reviewing runner carriage, placement and conservation\nDo not use this for: Canonical behavior, source retirement or current truth proof\nLast reviewed: Not independently reviewed; authored 2026-10-15\nRelated:\n- docs/specs/runner.md\nSupersedes: None; legacy authority retained\nSuperseded by: None\n```\n\n> Added in candidate: Metadata and map-based placement scaffolding. This is Added in candidate navigation only; no component or authority change. Known stale carried sentences; full truth check owed at promotion. A19 carriage and explicit Lead A35 note preserve deleted-module, retired-corpus, moved-plan and runner.md:<line> text verbatim."
  }
}
```

## Entry f-343: link-343

```json
{
  "id": "link-343",
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
  "reviewStatus": "pending",
  "oldDestination": "../../../architect/architecture-intent.md",
  "newDestination": "../../system-architecture/architecture/architecture-intent.md",
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

## Entry f-344: link-344

```json
{
  "id": "link-344",
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
  "reviewStatus": "pending",
  "oldDestination": "../../../architect/proposals/step-09-group-thinking-substrate.md",
  "newDestination": "../../proposals/step-09-group-thinking-substrate.md",
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

## Entry f-345: link-345

```json
{
  "id": "link-345",
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
  "reviewStatus": "pending",
  "oldDestination": "../../../architect/proposals/step-10-coding-domain-adoption.md",
  "newDestination": "../../proposals/step-10-coding-domain-adoption.md",
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

## Entry f-346: link-346

```json
{
  "id": "link-346",
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
  "reviewStatus": "pending",
  "oldDestination": "../../../architect/proposals/component-authority-boundary-map.md",
  "newDestination": "../../proposals/component-authority-boundary-map.md",
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

## Entry f-347: link-347

```json
{
  "id": "link-347",
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
  "reviewStatus": "pending",
  "oldDestination": "../../architect/component-boundary/README.md",
  "newDestination": "../component-boundary.md",
  "alias": {
    "aliasId": "step10-whole-system-0159",
    "fromPath": "docs/architect/component-boundary/README.md",
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
    "title": "Component Boundary Architecture",
    "anchor": "component-boundary-architecture",
    "githubAnchor": "component-boundary-architecture",
    "stableAnchor": "h-855f7cc3a676",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "daeb933bbf407e7672a26c307056eb550a0bf0eace00d53719c6dc22e9b2cb71",
    "sample": "Component Boundary Architecture",
    "sectionPayloadDigest": "1d640fb17d82df36e15f5a98311ceedca6dc92e410d144430d2e34dd4bfcb467",
    "followingBlockDigest": "19135f799ed3ec60d7da1ea132c13fab7545b9f30883380678d74284eb2201c1",
    "identityFingerprint": "d4acfc20469e834ca3a1d632eee7b3509028956a6d501845d4dc1c778073bcbd",
    "ancestry": [],
    "text": "# Component Boundary Architecture",
    "sectionText": "# Component Boundary Architecture\n\nThis folder collects vision-level architecture notes about how fgOS should name,\nseparate, and eventually place its high-level components across the whole\nsystem.\n\nThese documents are not implementation plans. They are refactoring compass\ndocuments: use them to keep slices moving toward clearer boundaries without\nforcing a large rebuild.\n\nThe scope is all of forgentX: Work Lifecycle, domain components,\ndispatch/execution, result evaluation, host surfaces, setup/doctor/distribution,\ngateway/Herdr, learning, and runtime implementation boundaries.\n\nFor the domain-specific split itself, read\n[Domainization Architecture](../domainization/README.md). This folder keeps the\nwhole-system component map; domainization is the deep dive for the Domain\nComponents And Extension Layer."
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

## Entry f-348: link-348

```json
{
  "id": "link-348",
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

## Entry f-349: link-349

```json
{
  "id": "link-349",
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
  "reviewStatus": "pending",
  "oldDestination": "../../architect/packaging-distribution/history/distribution-baseline.md",
  "newDestination": "history/distribution-baseline.md",
  "alias": {
    "aliasId": "step10-packaging-distribution-0057",
    "fromPath": "docs/architect/packaging-distribution/history/distribution-baseline.md",
    "toOwner": "docs/platform/packaging-distribution/history/distribution-baseline.md",
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
    "title": "Distribution Baseline And Scattered Spec Fragments",
    "anchor": "distribution-baseline-and-scattered-spec-fragments",
    "githubAnchor": "distribution-baseline-and-scattered-spec-fragments",
    "stableAnchor": "h-fbe34570b822",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "e01445cc31e3c304322e2d91470933c1f7394477d4c08c7e46fca9f42e26e393",
    "sample": "Distribution Baseline And Scattered Spec Fragments",
    "sectionPayloadDigest": "6dc4cde2935344d6b4deef1a02ac342cfce900ff076d430c802284aff536ce51",
    "followingBlockDigest": "6888500adab304fde5234372769bf5916c377da2b57c3ac88b36b7f7798e4d3a",
    "identityFingerprint": "582b010432d4263dd2da6590342c2904b024d6132990b14a3adc9979394389b8",
    "ancestry": [],
    "text": "# Distribution Baseline And Scattered Spec Fragments",
    "sectionText": "# Distribution Baseline And Scattered Spec Fragments\n\n```txt\nLegacy status: Promoted history source\nPromoted to: docs/platform/packaging-distribution/history/distribution-baseline.md\nCurrent reader entry: docs/platform/packaging-distribution/README.md\nUse this legacy file for: Original baseline collection and source trace\nDo not use this legacy file for: Current canonical history\nLast reviewed: 2026-09-13\n```\n\n> Status: historical source. The active condensed history is\n> [docs/platform/packaging-distribution/history/distribution-baseline.md](../../../platform/packaging-distribution/history/distribution-baseline.md).\n> This file remains the full discussion-era evidence ledger and is not current\n> target architecture.\n\n**Status:** Historical/input record for the new Packaging And Distribution\narchitecture.\n**Date:** 2026-09-04.\n**Purpose:** Preserve the current generated-spec baseline and scattered\ndistribution-relevant facts while the new runtime identity/activation contract\nbecomes the canonical V1 design target.\n\nThis file is not the target design. It is the source-context ledger: facts,\nconstraints, older vocabulary, and design pressure that must not be forgotten\nwhen the generated specs are eventually updated."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "History: Distribution Baseline",
    "anchor": "history-distribution-baseline",
    "githubAnchor": "history-distribution-baseline",
    "stableAnchor": "h-8cf8a24d7149",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "b57fe4039be08296553e47795d1a22410c52ee030475f3cc98e711ccef7631dd",
    "sample": "History: Distribution Baseline",
    "sectionPayloadDigest": "c9b860344990b95975c3479384c1072d1c6eb66f3ceabab7a0350b60f9b06a0c",
    "followingBlockDigest": "c9b860344990b95975c3479384c1072d1c6eb66f3ceabab7a0350b60f9b06a0c",
    "identityFingerprint": "2bbc21e91c4892e14551debb651a0a7fe79e3b8ce234e9033c3df140ef37fa78",
    "ancestry": [],
    "text": "# History: Distribution Baseline",
    "sectionText": "# History: Distribution Baseline\n\n```txt\nDocument type: History\nAudience: Maintainer, architecture reviewer, documentation agent\nPurpose: Preserve old distribution baseline and rationale while new packaging-distribution docs become canonical\nDesign status: Draft\nImplementation status: Historical source\nCanonical: Yes, after review\nOwner: Platform documentation\nSource type: Condensed from docs/specs/distribution.md, docs/distribution-vision.md, and docs/architect/packaging-distribution/history/distribution-baseline.md\nLast reviewed: 2026-09-13\nRelated:\n- docs/specs/distribution.md\n- docs/distribution-vision.md\n- docs/platform/packaging-distribution/vision.md\n- docs/architect/packaging-distribution/history/distribution-baseline.md\nImplementation: Original section-specific implementation statements retained; carriage is pending independent review\nProvenance: Existing area document plus source-detail carriage at 77830ba77eb05991d95b005919776ee6254e833b\nWriter type: Human + agent coauthor\nCanonical for: The topic stated by this document, subject to the unchanged switchboard route and independent review\nUse this when: Reading this area topic and its retained design details\nDo not use this for: Claiming a truth review or an authority cutover from carriage alone\nSupersedes: No authority transition in this carriage pass\nSuperseded by: None recorded\n```"
  }
}
```

## Entry f-350: link-350

```json
{
  "id": "link-350",
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

## Entry f-351: link-351

```json
{
  "id": "link-351",
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
  "reviewStatus": "pending",
  "oldDestination": "../../architect/packaging-distribution/history/distribution-baseline.md",
  "newDestination": "history/distribution-baseline.md",
  "alias": {
    "aliasId": "step10-packaging-distribution-0057",
    "fromPath": "docs/architect/packaging-distribution/history/distribution-baseline.md",
    "toOwner": "docs/platform/packaging-distribution/history/distribution-baseline.md",
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
    "title": "Distribution Baseline And Scattered Spec Fragments",
    "anchor": "distribution-baseline-and-scattered-spec-fragments",
    "githubAnchor": "distribution-baseline-and-scattered-spec-fragments",
    "stableAnchor": "h-fbe34570b822",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "e01445cc31e3c304322e2d91470933c1f7394477d4c08c7e46fca9f42e26e393",
    "sample": "Distribution Baseline And Scattered Spec Fragments",
    "sectionPayloadDigest": "6dc4cde2935344d6b4deef1a02ac342cfce900ff076d430c802284aff536ce51",
    "followingBlockDigest": "6888500adab304fde5234372769bf5916c377da2b57c3ac88b36b7f7798e4d3a",
    "identityFingerprint": "582b010432d4263dd2da6590342c2904b024d6132990b14a3adc9979394389b8",
    "ancestry": [],
    "text": "# Distribution Baseline And Scattered Spec Fragments",
    "sectionText": "# Distribution Baseline And Scattered Spec Fragments\n\n```txt\nLegacy status: Promoted history source\nPromoted to: docs/platform/packaging-distribution/history/distribution-baseline.md\nCurrent reader entry: docs/platform/packaging-distribution/README.md\nUse this legacy file for: Original baseline collection and source trace\nDo not use this legacy file for: Current canonical history\nLast reviewed: 2026-09-13\n```\n\n> Status: historical source. The active condensed history is\n> [docs/platform/packaging-distribution/history/distribution-baseline.md](../../../platform/packaging-distribution/history/distribution-baseline.md).\n> This file remains the full discussion-era evidence ledger and is not current\n> target architecture.\n\n**Status:** Historical/input record for the new Packaging And Distribution\narchitecture.\n**Date:** 2026-09-04.\n**Purpose:** Preserve the current generated-spec baseline and scattered\ndistribution-relevant facts while the new runtime identity/activation contract\nbecomes the canonical V1 design target.\n\nThis file is not the target design. It is the source-context ledger: facts,\nconstraints, older vocabulary, and design pressure that must not be forgotten\nwhen the generated specs are eventually updated."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "History: Distribution Baseline",
    "anchor": "history-distribution-baseline",
    "githubAnchor": "history-distribution-baseline",
    "stableAnchor": "h-8cf8a24d7149",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "b57fe4039be08296553e47795d1a22410c52ee030475f3cc98e711ccef7631dd",
    "sample": "History: Distribution Baseline",
    "sectionPayloadDigest": "c9b860344990b95975c3479384c1072d1c6eb66f3ceabab7a0350b60f9b06a0c",
    "followingBlockDigest": "c9b860344990b95975c3479384c1072d1c6eb66f3ceabab7a0350b60f9b06a0c",
    "identityFingerprint": "2bbc21e91c4892e14551debb651a0a7fe79e3b8ce234e9033c3df140ef37fa78",
    "ancestry": [],
    "text": "# History: Distribution Baseline",
    "sectionText": "# History: Distribution Baseline\n\n```txt\nDocument type: History\nAudience: Maintainer, architecture reviewer, documentation agent\nPurpose: Preserve old distribution baseline and rationale while new packaging-distribution docs become canonical\nDesign status: Draft\nImplementation status: Historical source\nCanonical: Yes, after review\nOwner: Platform documentation\nSource type: Condensed from docs/specs/distribution.md, docs/distribution-vision.md, and docs/architect/packaging-distribution/history/distribution-baseline.md\nLast reviewed: 2026-09-13\nRelated:\n- docs/specs/distribution.md\n- docs/distribution-vision.md\n- docs/platform/packaging-distribution/vision.md\n- docs/architect/packaging-distribution/history/distribution-baseline.md\nImplementation: Original section-specific implementation statements retained; carriage is pending independent review\nProvenance: Existing area document plus source-detail carriage at 77830ba77eb05991d95b005919776ee6254e833b\nWriter type: Human + agent coauthor\nCanonical for: The topic stated by this document, subject to the unchanged switchboard route and independent review\nUse this when: Reading this area topic and its retained design details\nDo not use this for: Claiming a truth review or an authority cutover from carriage alone\nSupersedes: No authority transition in this carriage pass\nSuperseded by: None recorded\n```"
  }
}
```

## Entry f-352: link-352

```json
{
  "id": "link-352",
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
  "reviewStatus": "pending",
  "oldDestination": "../../architect/proposals/README.md",
  "newDestination": "README.md",
  "alias": {
    "aliasId": "step10-proposals-redesigns-0001",
    "fromPath": "docs/architect/proposals/README.md",
    "toOwner": "docs/platform/proposals/README.md",
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
    "title": "Architect-Level Proposals",
    "anchor": "architect-level-proposals",
    "githubAnchor": "architect-level-proposals",
    "stableAnchor": "h-ec7061843bb4",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "5c24a592f7b19694cd316b58db92a582e861d992ade3752bc722824e49941fca",
    "sample": "Architect-Level Proposals",
    "sectionPayloadDigest": "1c143e80d46b9d54cc55229249a8b442ce0ed13acb2e82fc50cc49c5a4d662a4",
    "followingBlockDigest": "a53e19b7b54a5568a7e7b6fdaabb2f786438aa6642d8d6629cecbd6a75326fdf",
    "identityFingerprint": "09c8995edeb05508f8afc515659414515f7f5a7a0e12431abb2a96fe09bc8946",
    "ancestry": [],
    "text": "# Architect-Level Proposals",
    "sectionText": "# Architect-Level Proposals\n\nDocument type: Index\nDesign status: Discussion\nImplementation: Not started unless each proposal says otherwise\nLast reviewed: 2026-09-02\n\nThis folder holds proposals whose scope crosses one architecture area. A file\nstaying here means it is still a proposal, not accepted architecture. Once\naccepted, extract the settled design into the relevant architect-level or\narea-specific canonical document and leave the proposal as history.\n\nArea-specific proposals stay under that area's own `proposals/` folder until\ntheir scope crosses the area boundary."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Architect-Level Proposals",
    "anchor": "architect-level-proposals",
    "githubAnchor": "architect-level-proposals",
    "stableAnchor": "h-ec7061843bb4",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "ba23c9f7168a47d266068ab83548609fee3b0a4fa5dc6f7d8dd1b256df38a6b0",
    "sample": "Architect-Level Proposals",
    "sectionPayloadDigest": "3303beb5969e693378c50d32805950ae5e25bf537f8e11cea1fab96cba421ed6",
    "followingBlockDigest": "9b0265b0d4a825b4f4b7409ade58a12c329db4c5955b1857aa75c1b2de685e96",
    "identityFingerprint": "3e097d2260a83952530e7216f2fe1a16fa3586f45d76f321ce822d4507f3fa00",
    "ancestry": [],
    "text": "# Architect-Level Proposals",
    "sectionText": "# Architect-Level Proposals\n\n```txt\nDocument type: Collection index\nAudience: Human reviewer, architect, maintainer, agent\nPurpose: Preserve mapped source text for independent conservation review\nDesign status: Candidate\nImplementation: Source snapshot retained; current implementation truth not certified\nProvenance: docs/architect/proposals/README.md at fb046210539cbcbe8ca1dab254763f5e78c573d2; blob 48a80d339a1f676a56153bac6677895e0d4eb377\nWriter type: Agent draft writer\nCanonical: No\nCanonical for: Nothing; non-canonical candidate conservation carrier\nUse this when: Reviewing source carriage, placement, intent and provenance\nDo not use this for: Current authority, implementation proof or cutover approval\nLast reviewed: Pending independent review\nRelated:\n- docs/architect/proposals/README.md\nSupersedes: None; legacy source remains intact\nSuperseded by: None\n```\n\nAdded in candidate: Candidate carriage; Keep the map collection-index as a candidate snapshot. Its active list is historical source wording and will not describe the final live/history split; navigation owner owes reviewed update, no silent rewrite now. Original source metadata and text follow. Physical relative-link destinations alone are rebased to the same repository paths. Units with inherited missing links are preserved as literal fenced source text, without substituting another design or changing any assertion. Source metadata is provenance, not candidate authority.\n\nSource relationship: [original source](README.md).\n\n\nDocument type: Index\nDesign status: Discussion\nImplementation: Not started unless each proposal says otherwise\nLast reviewed: 2026-09-02\n\nThis folder holds proposals whose scope crosses one architecture area. A file\nstaying here means it is still a proposal, not accepted architecture. Once\naccepted, extract the settled design into the relevant architect-level or\narea-specific canonical document and leave the proposal as history.\n\nArea-specific proposals stay under that area's own `proposals/` folder until\ntheir scope crosses the area boundary."
  }
}
```

## Entry f-353: link-353

```json
{
  "id": "link-353",
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

## Entry f-354: link-354

```json
{
  "id": "link-354",
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

## Entry f-355: link-355

```json
{
  "id": "link-355",
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

## Entry f-356: link-356

```json
{
  "id": "link-356",
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

## Entry f-357: link-357

```json
{
  "id": "link-357",
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

## Entry f-358: link-358

```json
{
  "id": "link-358",
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
  "reviewStatus": "pending",
  "oldDestination": "../../architect/proposals/step-09-step-10-replan-handoff-prompt.md",
  "newDestination": "../agent-coordination/history/proposals-redesigns/step-09-step-10-replan-handoff-prompt.md",
  "alias": {
    "aliasId": "step10-proposals-redesigns-0603",
    "fromPath": "docs/architect/proposals/step-09-step-10-replan-handoff-prompt.md",
    "toOwner": "docs/platform/agent-coordination/history/proposals-redesigns/step-09-step-10-replan-handoff-prompt.md",
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
    "title": "Step 09 / Step 10 Replan Handoff Prompt",
    "anchor": "step-09-step-10-replan-handoff-prompt",
    "githubAnchor": "step-09-step-10-replan-handoff-prompt",
    "stableAnchor": "h-ef821ecf59cd",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "d4c07b1b279fe005d92de5d9a48b608bb67a27a4f47f56b6d8ac6994f6cf3bb7",
    "sample": "Step 09 / Step 10 Replan Handoff Prompt",
    "sectionPayloadDigest": "31c9db99681a7209641933762d89108a2e09c29c403e4238c475740929d1d6df",
    "followingBlockDigest": "55c67de7e3f08e6b2bb094056e0a51a0ad796d3da1f44561e5be4067a3739b93",
    "identityFingerprint": "3a11b8e5d2686d077542e4d46aad80b32e80b3ea346f1aa3c0df6be707ef910d",
    "ancestry": [],
    "text": "# Step 09 / Step 10 Replan Handoff Prompt",
    "sectionText": "# Step 09 / Step 10 Replan Handoff Prompt\n\nDocument type: Handoff prompt\nDesign status: Discussion\nImplementation: Not started\nLast reviewed: 2026-09-02\nCanonical for: nothing; use only to start a fresh design chat\n\nUse this prompt to start a new chat about the next architecture step after the\nAgent Coordination redesign delivered through Step 08.\n\n```txt\nChúng ta cần tiếp tục thiết kế fgOS ở giao điểm giữa:\n\n1. Step 8b: mở rộng group-cognitive coordination vượt khỏi các fixture\n   isolation-heavy/static hiện tại, để fgOS có thể biểu đạt các cơ chế\n   problem-solving/coding-review/adversarial/recheck thông dụng mà không làm\n   yếu các invariant đã được Step 08 chứng minh.\n\n2. Step 10: đưa coding domain lên dùng coordination foundation đã delivered\n   qua Step 08, giảm duplicate mechanism, xác định seam giữa foundation và\n   coding domain, và chuẩn bị một implementation plan tốt hơn thay vì tiếp tục\n   vá theo từng deferred decision.\n\nNgữ cảnh quan trọng:\n\n- Agent Coordination redesign đã deliver tới Step 08 trên code.\n- Step 00-08 đã được promote thành canonical baseline:\n  docs/architect/agent-coordination/architecture/coordination-foundation-baseline.md\n- Step 00-06 roadmap giờ là rollout history, không phải nơi đọc design chính:\n  docs/architect/agent-coordination/roadmap/team-dispatch-v1/README.md\n- Step 07/08 proposal giờ là promoted history, không còn active design frontier:\n  docs/architect/agent-coordination/proposals/README.md\n- Step 09 hiện là group-thinking substrate proposal cấp architect.\n- Step 10 hiện là coding-domain adoption proposal cấp architect, vì scope vượt\n  khỏi riêng Agent Coordination.\n- Component authority boundary map là architect-level guardrail song song:\n  docs/architect/proposals/step-09-group-thinking-substrate.md\n  docs/architect/proposals/step-10-coding-domain-adoption.md\n  docs/architect/proposals/component-authority-boundary-map.md\n- Architecture-wide intent đang được giữ ở:\n  docs/architect/architecture-intent.md\n\nĐọc trước, theo thứ tự:\n\n1. docs/specs/reading-map.md\n2. docs/architect/README.md\n3. docs/architect/architecture-intent.md\n4. docs/architect/agent-coordination/README.md\n5. docs/architect/agent-coordination/architecture/coordination-foundation-baseline.md\n6. docs/architect/agent-coordination/contracts/coordination-session.md\n7. docs/architect/agent-coordination/contracts/flow-definition.md\n8. docs/architect/proposals/step-09-group-thinking-substrate.md\n9. docs/architect/proposals/step-10-coding-domain-adoption.md\n10. docs/architect/proposals/component-authority-boundary-map.md\n11. docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md\n\nSau khi đọc, đừng re-derive lịch sử cũ. Hãy trả lời như một architecture\nadvisor chính, có phản biện, với mục tiêu tạo một plan sắc và thực thi được.\n\nViệc cần làm trong chat mới:\n\n1. Tóm tắt trạng thái hiện tại bằng \"current implemented shape\", không bằng\n   lịch sử step.\n2. Chỉ ra chính xác chỗ Step 8b và Step 09 đang gặp nhau:\n   - coding-domain implementation cell cần review/fix/red-team/recheck loop;\n   - current coordination foundation đã có session/FlowDefinition/actors/\n     bounded dispatch/evidence, nhưng chưa đủ rich group-cognitive capability;\n   - Work mutation/gitintegration vẫn phải đi qua coding-domain authority,\n     không được coordination tự chiếm.\n3. Phân biệt ba loại việc:\n   - normalize/migrate duplicate coding mechanisms onto existing foundation;\n   - extend foundation capability vì coding là consumer thứ hai chứng minh\n     nhu cầu thật;\n   - defer-preserve những capability rộng hơn chưa cần cho MVP.\n4. Đề xuất một MVP theo từng bước, không hỏi người dùng chọn option trước:\n   - mỗi bước nói real shape trên tài liệu/schema/runtime;\n   - bước nào docs-only, bước nào cần implementation;\n   - bước nào cần proof/test/live run;\n   - invariant nào được giữ;\n   - điều gì cố tình không làm.\n5. Cố gắng draft \"real shape\" của first useful coding-domain implementation\n   cell:\n   - Doer;\n   - Reviewer;\n   - Fixer hoặc Doer-followup;\n   - Red-Team hoặc adversarial reviewer;\n   - recheck/disposition;\n   - persistent external coordinator/driver authority outside the declared\n     worker graph.\n6. Kiểm tra xem current FlowDefinition/CoordinationSession shape có đủ để viết\n   fixture đó không. Nếu không đủ, nêu gap bằng field/operation/event cụ thể,\n   không nói chung chung.\n7. Reconcile lại các open questions hiện có:\n   - primitive nên là `requestRound`, `authorizeDeclaredOperation`,\n     `addSessionEdge`, hay một hình khác?\n   - `intent` vocabulary nên closed enum, fixture-local enum, hay registry?\n   - operation-level `maxRounds` liên hệ thế nào với\n     `aggregateBounds.maxRounds`?\n   - Red-Team recheck là operation riêng hay Reviewer redispatch với intent\n     khác?\n   - ai được gọi primitive runtime deviation/round authorization?\n8. Đưa ra phản biện:\n   - điểm nào trong Step 8b proposal hiện quá rộng hoặc sai thứ tự;\n   - điểm nào trong Step 10 proposal hiện quá migration-heavy mà chưa đạt\n     design intent;\n   - điểm nào nếu làm sớm sẽ phá R3/isolation proof hoặc làm Work authority\n     bị lẫn vào coordination.\n9. Kết quả cần xuất ra:\n   - proposed replan, theo phase/MVP;\n   - first fixture shape;\n   - schema/runtime deltas, nếu có;\n   - tests/proofs required;\n   - docs cần promote/update;\n   - explicit not-proposed/deferred list.\n\nRàng buộc:\n\n- Không implement trong chat này trừ khi người dùng yêu cầu rõ.\n- Không sửa `schema.mjs`, `session-engine.mjs`, hay source runtime trước khi\n  hướng được chốt.\n- Không reopen các Tier 1 invariant: evidence immutability, governance-final,\n  budget caps, mutation exclusivity.\n- Không nới `group-cognition-framework.yaml` để lấy communication. Fixture đó\n  giữ isolation-heavy R3 proof.\n- Không đề xuất autonomous in-graph leader. Persistent coordinator/driver ở\n  ngoài worker graph mới là authority stop/recheck.\n- Không biến Step 09/Step 10 proposal thành accepted design. Chúng vẫn là discussion cho\n  tới khi được promote.\n- Không đặt câu hỏi theo kiểu bắt người dùng chọn option. Hãy đưa plan có\n  chính kiến, rồi nêu điểm cần chốt.\n- Nếu cần dùng sol-agent/subagent để phản biện, trước hết chạy:\n  node src/runner/dispatch.mjs decide --for sol-agent --needs-soul --has-live-task-access\n  rồi tuân theo kết quả dispatch. Nếu không cần, tự phản biện trực tiếp.\n\nTone mong muốn:\n\n- Nghĩ như advisor kiến trúc chính.\n- Có chính kiến và phản biện.\n- Ưu tiên plan/MVP/real shape.\n- Giữ design intent ban đầu thay vì để deferred decisions làm biến dạng hệ\n  thống.\n- Tránh viết proposal trừu tượng khó hiểu; mỗi ý lớn phải nối được với file,\n  schema, runtime primitive, proof, hoặc explicit deferred item.\n```"
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Step 09 / Step 10 Replan Handoff Prompt",
    "anchor": "step-09-step-10-replan-handoff-prompt",
    "githubAnchor": "step-09-step-10-replan-handoff-prompt",
    "stableAnchor": "h-ef821ecf59cd",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "99660662643fdbf89df15656d4aeb079b182e1b65e9740b105ec016b41c578c7",
    "sample": "Step 09 / Step 10 Replan Handoff Prompt",
    "sectionPayloadDigest": "a43a242621dad40e58f801a407170edc6e06a733112cc4f786ae68696a168200",
    "followingBlockDigest": "f3fb6607f060714f0f56f8da561ea4cdae4cfe9f620d38c8ce713abd2eb9a5a9",
    "identityFingerprint": "16d965e2dec6d107f2139368c6733d7b10ff9087fd0c1c68ace0dcc952b3eba4",
    "ancestry": [],
    "text": "# Step 09 / Step 10 Replan Handoff Prompt",
    "sectionText": "# Step 09 / Step 10 Replan Handoff Prompt\n\n```txt\nDocument type: History\nAudience: Human reviewer, architect, maintainer, agent\nPurpose: Preserve historical source text for independent conservation review\nDesign status: Candidate\nImplementation: Source snapshot retained; current implementation truth not certified\nProvenance: docs/architect/proposals/step-09-step-10-replan-handoff-prompt.md at fb046210539cbcbe8ca1dab254763f5e78c573d2; blob fd6e47f8aa7a75c77a37fb3ef1b5ae0593a90a70\nWriter type: Agent draft writer\nCanonical: No\nCanonical for: Nothing; non-canonical candidate conservation carrier\nUse this when: Reviewing source carriage, placement, intent and provenance\nDo not use this for: Current authority, implementation proof or cutover approval\nLast reviewed: Pending independent review\nRelated:\n- docs/architect/proposals/step-09-step-10-replan-handoff-prompt.md\nSupersedes: None; legacy source remains intact\nSuperseded by: None\n```\n\nAdded in candidate: Historical snapshot; Archive the consumed prompt, with provenance value for the surviving adoption proposals. No delete-as-obsolete recommendation. Original source metadata and text follow. Physical relative-link destinations alone are rebased to the same repository paths. Units with inherited missing links are preserved as literal fenced source text, without substituting another design or changing any assertion. Source metadata is provenance, not candidate authority.\n\nSource relationship: [original source](../../../../architect/proposals/step-09-step-10-replan-handoff-prompt.md).\n\n\nDocument type: Handoff prompt\nDesign status: Discussion\nImplementation: Not started\nLast reviewed: 2026-09-02\nCanonical for: nothing; use only to start a fresh design chat\n\nUse this prompt to start a new chat about the next architecture step after the\nAgent Coordination redesign delivered through Step 08.\n\n```txt\nChúng ta cần tiếp tục thiết kế fgOS ở giao điểm giữa:\n\n1. Step 8b: mở rộng group-cognitive coordination vượt khỏi các fixture\n   isolation-heavy/static hiện tại, để fgOS có thể biểu đạt các cơ chế\n   problem-solving/coding-review/adversarial/recheck thông dụng mà không làm\n   yếu các invariant đã được Step 08 chứng minh.\n\n2. Step 10: đưa coding domain lên dùng coordination foundation đã delivered\n   qua Step 08, giảm duplicate mechanism, xác định seam giữa foundation và\n   coding domain, và chuẩn bị một implementation plan tốt hơn thay vì tiếp tục\n   vá theo từng deferred decision.\n\nNgữ cảnh quan trọng:\n\n- Agent Coordination redesign đã deliver tới Step 08 trên code.\n- Step 00-08 đã được promote thành canonical baseline:\n  docs/architect/agent-coordination/architecture/coordination-foundation-baseline.md\n- Step 00-06 roadmap giờ là rollout history, không phải nơi đọc design chính:\n  docs/architect/agent-coordination/roadmap/team-dispatch-v1/README.md\n- Step 07/08 proposal giờ là promoted history, không còn active design frontier:\n  docs/architect/agent-coordination/proposals/README.md\n- Step 09 hiện là group-thinking substrate proposal cấp architect.\n- Step 10 hiện là coding-domain adoption proposal cấp architect, vì scope vượt\n  khỏi riêng Agent Coordination.\n- Component authority boundary map là architect-level guardrail song song:\n  docs/architect/proposals/step-09-group-thinking-substrate.md\n  docs/architect/proposals/step-10-coding-domain-adoption.md\n  docs/architect/proposals/component-authority-boundary-map.md\n- Architecture-wide intent đang được giữ ở:\n  docs/architect/architecture-intent.md\n\nĐọc trước, theo thứ tự:\n\n1. docs/specs/reading-map.md\n2. docs/architect/README.md\n3. docs/architect/architecture-intent.md\n4. docs/architect/agent-coordination/README.md\n5. docs/architect/agent-coordination/architecture/coordination-foundation-baseline.md\n6. docs/architect/agent-coordination/contracts/coordination-session.md\n7. docs/architect/agent-coordination/contracts/flow-definition.md\n8. docs/architect/proposals/step-09-group-thinking-substrate.md\n9. docs/architect/proposals/step-10-coding-domain-adoption.md\n10. docs/architect/proposals/component-authority-boundary-map.md\n11. docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md\n\nSau khi đọc, đừng re-derive lịch sử cũ. Hãy trả lời như một architecture\nadvisor chính, có phản biện, với mục tiêu tạo một plan sắc và thực thi được.\n\nViệc cần làm trong chat mới:\n\n1. Tóm tắt trạng thái hiện tại bằng \"current implemented shape\", không bằng\n   lịch sử step.\n2. Chỉ ra chính xác chỗ Step 8b và Step 09 đang gặp nhau:\n   - coding-domain implementation cell cần review/fix/red-team/recheck loop;\n   - current coordination foundation đã có session/FlowDefinition/actors/\n     bounded dispatch/evidence, nhưng chưa đủ rich group-cognitive capability;\n   - Work mutation/gitintegration vẫn phải đi qua coding-domain authority,\n     không được coordination tự chiếm.\n3. Phân biệt ba loại việc:\n   - normalize/migrate duplicate coding mechanisms onto existing foundation;\n   - extend foundation capability vì coding là consumer thứ hai chứng minh\n     nhu cầu thật;\n   - defer-preserve những capability rộng hơn chưa cần cho MVP.\n4. Đề xuất một MVP theo từng bước, không hỏi người dùng chọn option trước:\n   - mỗi bước nói real shape trên tài liệu/schema/runtime;\n   - bước nào docs-only, bước nào cần implementation;\n   - bước nào cần proof/test/live run;\n   - invariant nào được giữ;\n   - điều gì cố tình không làm.\n5. Cố gắng draft \"real shape\" của first useful coding-domain implementation\n   cell:\n   - Doer;\n   - Reviewer;\n   - Fixer hoặc Doer-followup;\n   - Red-Team hoặc adversarial reviewer;\n   - recheck/disposition;\n   - persistent external coordinator/driver authority outside the declared\n     worker graph.\n6. Kiểm tra xem current FlowDefinition/CoordinationSession shape có đủ để viết\n   fixture đó không. Nếu không đủ, nêu gap bằng field/operation/event cụ thể,\n   không nói chung chung.\n7. Reconcile lại các open questions hiện có:\n   - primitive nên là `requestRound`, `authorizeDeclaredOperation`,\n     `addSessionEdge`, hay một hình khác?\n   - `intent` vocabulary nên closed enum, fixture-local enum, hay registry?\n   - operation-level `maxRounds` liên hệ thế nào với\n     `aggregateBounds.maxRounds`?\n   - Red-Team recheck là operation riêng hay Reviewer redispatch với intent\n     khác?\n   - ai được gọi primitive runtime deviation/round authorization?\n8. Đưa ra phản biện:\n   - điểm nào trong Step 8b proposal hiện quá rộng hoặc sai thứ tự;\n   - điểm nào trong Step 10 proposal hiện quá migration-heavy mà chưa đạt\n     design intent;\n   - điểm nào nếu làm sớm sẽ phá R3/isolation proof hoặc làm Work authority\n     bị lẫn vào coordination.\n9. Kết quả cần xuất ra:\n   - proposed replan, theo phase/MVP;\n   - first fixture shape;\n   - schema/runtime deltas, nếu có;\n   - tests/proofs required;\n   - docs cần promote/update;\n   - explicit not-proposed/deferred list.\n\nRàng buộc:\n\n- Không implement trong chat này trừ khi người dùng yêu cầu rõ.\n- Không sửa `schema.mjs`, `session-engine.mjs`, hay source runtime trước khi\n  hướng được chốt.\n- Không reopen các Tier 1 invariant: evidence immutability, governance-final,\n  budget caps, mutation exclusivity.\n- Không nới `group-cognition-framework.yaml` để lấy communication. Fixture đó\n  giữ isolation-heavy R3 proof.\n- Không đề xuất autonomous in-graph leader. Persistent coordinator/driver ở\n  ngoài worker graph mới là authority stop/recheck.\n- Không biến Step 09/Step 10 proposal thành accepted design. Chúng vẫn là discussion cho\n  tới khi được promote.\n- Không đặt câu hỏi theo kiểu bắt người dùng chọn option. Hãy đưa plan có\n  chính kiến, rồi nêu điểm cần chốt.\n- Nếu cần dùng sol-agent/subagent để phản biện, trước hết chạy:\n  node src/runner/dispatch.mjs decide --for sol-agent --needs-soul --has-live-task-access\n  rồi tuân theo kết quả dispatch. Nếu không cần, tự phản biện trực tiếp.\n\nTone mong muốn:\n\n- Nghĩ như advisor kiến trúc chính.\n- Có chính kiến và phản biện.\n- Ưu tiên plan/MVP/real shape.\n- Giữ design intent ban đầu thay vì để deferred decisions làm biến dạng hệ\n  thống.\n- Tránh viết proposal trừu tượng khó hiểu; mỗi ý lớn phải nối được với file,\n  schema, runtime primitive, proof, hoặc explicit deferred item.\n```"
  }
}
```

## Entry f-359: link-359

```json
{
  "id": "link-359",
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
  "reviewStatus": "pending",
  "oldDestination": "../../specs/work-state.md",
  "newDestination": "README.md",
  "alias": {
    "aliasId": "root-authorities-draft-0073",
    "fromPath": "docs/specs/work-state.md",
    "toOwner": "docs/platform/work-state/README.md",
    "toAnchor": null,
    "kind": "merged",
    "evidenceRef": "plans/260925-documentation-authority-unification/pilot/decisions/b-behaviors.json",
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
    "title": "Spec: Work-State (tầng quản việc của forgent)",
    "anchor": "spec-work-state-tầng-quản-việc-của-forgent",
    "githubAnchor": "spec-work-state-tầng-quản-việc-của-forgent",
    "stableAnchor": "h-0d070b2449f6",
    "startLine": 9,
    "endLine": 9,
    "textDigest": "bbef379255aa6ba73f98654a66f22aa11f0939ec3e8dc0a87a9bdfcb50d8aa52",
    "sample": "Spec: Work-State (tầng quản việc của forgent)",
    "sectionPayloadDigest": "d9f06bbaa0ffe5ab3f54dd8fba4e9514ed4e126572c8a570dea57f366837d117",
    "followingBlockDigest": "d9f06bbaa0ffe5ab3f54dd8fba4e9514ed4e126572c8a570dea57f366837d117",
    "identityFingerprint": "bf1b64516976c2a0a79c008b62384aa50a2700e5a494004313a6416d85ad0401",
    "ancestry": [],
    "text": "# Spec: Work-State (tầng quản việc của forgent)",
    "sectionText": "# Spec: Work-State (tầng quản việc của forgent)\n\nBộ nhớ công việc tự quản của forgent: nơi duy nhất ghi nhận \"đang có việc gì, việc nào ở trạng thái nào, quyết định nào đã chốt\". Người dùng: người vận hành repo và agent làm việc trong repo — cả hai thao tác qua đúng một cửa lệnh `fgos`. Sự thật nằm ở **nhật ký sự kiện** append-only được commit; **bản chiếu trạng thái** hiện hành chỉ là dẫn xuất, xóa đi dựng lại được nguyên vẹn."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "Work State",
    "anchor": "work-state",
    "githubAnchor": "work-state",
    "stableAnchor": "h-7e885f29a711",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "252bd4bd0b73bb5287d39df62a5d10bd81c7c72b2dc98cddbb464930df613005",
    "sample": "Work State",
    "sectionPayloadDigest": "34b3a3683fddf06454bc6de3bea4596b63fad84e2bdaff3d901a188e9703f560",
    "followingBlockDigest": "34b3a3683fddf06454bc6de3bea4596b63fad84e2bdaff3d901a188e9703f560",
    "identityFingerprint": "209648a3c62d56317b0913151dc54164a7cc0ee22d9eb90428a20273cf5a98cd",
    "ancestry": [],
    "text": "# Work State",
    "sectionText": "# Work State\n\n```txt\nDocument type: Area portal\nAudience: Human reviewer, architect, maintainer, implementation agent\nPurpose: Route readers through the candidate documents of the work state area and point to the legacy sources they are drawn from\nDesign status: Candidate\nLast reviewed: 2026-10-06\nRelated:\n- docs/platform/work-state/README.md\n- docs/platform/work-state/spec.md\n- docs/platform/work-state/contracts/cli-io-contract.md\n- docs/platform/work-state/architecture/implementation-pointers.md\n- docs/platform/work-state/decisions/retired-decision-history.md\n- docs/platform/work-state/history/multi-role-harness-distill-record.md\n- docs/specs/work-state.md\n- docs/io-contract.md\n- docs/work-item-lifecycle-vision.md\n- docs/platform/vision.md\nImplementation: Carried source material; current implementation truth unverified\nProvenance: Retained work-state candidate carriage from docs/specs/work-state.md; existing Related references retained\nWriter type: Original writer attribution not recorded; retained source provenance\nCanonical for: Candidate scope: Route readers through the candidate documents of the work state area and point to the legacy sources they are drawn from; authority follows transitional switchboard\nUse this when: Route readers through the candidate documents of the work state area and point to the legacy sources they are drawn from\nDo not use this for: Authority beyond the declared scope or implementation truth without the cited verification\nSupersedes: None; legacy sources remain in place during migration\nSuperseded by: None recorded\n```"
  }
}
```

## Entry f-360: link-360

```json
{
  "id": "link-360",
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
  "reviewStatus": "pending",
  "oldDestination": "../../io-contract.md",
  "newDestination": "contracts/cli-io-contract.md",
  "alias": {
    "aliasId": "root-authorities-draft-0027",
    "fromPath": "docs/io-contract.md",
    "toOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "toAnchor": null,
    "kind": "moved",
    "evidenceRef": "plans/260925-documentation-authority-unification/pilot/decisions/b-io-contract.json",
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
    "title": "Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner`",
    "anchor": "hợp-đồng-io-của-fgos-cửa-cli-bề-mặt-stdout-của-fgos-runner",
    "githubAnchor": "hợp-đồng-io-của-fgos-cửa-cli-bề-mặt-stdout-của-fgos-runner",
    "stableAnchor": "h-370cc10f3720",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "f72297b85c91b398d8341653aabae3add3e9cfc3079149c05b594d543b853d8a",
    "sample": "Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner`",
    "sectionPayloadDigest": "b54c97321e74760179179cb14a65a3ce230f6de6cd4b1956eb1c494d4bb8f6b7",
    "followingBlockDigest": "476e7efba05e358ccd01c95cbfb350eca1cc6a7905d784c5651cb99960515322",
    "identityFingerprint": "21ac90429f5eda202fdb6e1fb642b9861daef90794b4c1f4582225c093098364",
    "ancestry": [],
    "text": "# Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner`",
    "sectionText": "# Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner`\n\nHợp đồng giao tiếp VÀO/RA hạng nhất cho bề mặt CLI của fgOS (`bin/fgos.mjs`)\nvà bề mặt stdout của vòng tự hành (`bin/fgos-runner.mjs`), theo record\n[0014](decisions/0014-kien-truc-giao-tiep-nguoi-fgos.md) (kiến trúc cửa, đã\nkhoá) và [0011](decisions/0011-version-tuong-minh-cho-moi-contract.md) (mọi\ncontract mang version tường minh `<name>/v<N>`). Tài liệu này là bản chốt\nbằng văn xuôi hợp nhất những gì `str46-io-contract` đã dựng qua ba lát —\nkhông phải code runtime mới, không lặp lại chi tiết cài đặt đã có trong\n`docs/specs/work-state.md`/`docs/specs/runner.md`.\n\n**Mục tiêu:** một transport MỚI (terminal, pane, chat, web, thứ chưa nghĩ\nra) cắm vào chỉ bằng cách dịch transport→verb (chiều vào) và đọc envelope/sổ\nverb (chiều ra) — không mở đường ghi riêng, không phải đoán hình dạng output\nbằng cách đọc mã."
  },
  "newReferent": {
    "unitKind": "heading",
    "level": 1,
    "title": "CLI I/O Contract",
    "anchor": "cli-io-contract",
    "githubAnchor": "cli-io-contract",
    "stableAnchor": "h-1a12f8bbe2ff",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "d402870da7c60d96c00eb162384d3e6c5f65e4aae549efeb991d5e8a5186bedb",
    "sample": "CLI I/O Contract",
    "sectionPayloadDigest": "a49b56e4c14198649dee1224ebf0bc991561a1b17a6bbde52b840d7b3c5775e0",
    "followingBlockDigest": "a49b56e4c14198649dee1224ebf0bc991561a1b17a6bbde52b840d7b3c5775e0",
    "identityFingerprint": "9294ce6dbff1c5fde364c4a3750c7e60e871aab7f4a505d80f6599020bcc6a81",
    "ancestry": [],
    "text": "# CLI I/O Contract",
    "sectionText": "# CLI I/O Contract\n\n```txt\nDocument type: Contract\nAudience: Human reviewer, architect, maintainer, implementation agent\nPurpose: Owns the input and output contract of the fgOS CLI door and the stdout surface of fgos-runner: writer identity, envelope, exit codes, pagination, verb manifest and version tokens.\nDesign status: Candidate\nLast reviewed: 2026-10-06\nAdded in candidate: the headings Single Write Door, Writer Source Trust Levels, Writer Resolution Rules, Caller Role, Error Path Is Not Enveloped, Runner Stdout Envelope, Recognizing A Real Envelope and Entry Fields And Effect Axes subdivide sections of the sources that have no heading of their own; the text under them is carried from the sources.\nRelated:\n- docs/platform/work-state/README.md\n- docs/platform/work-state/spec.md\n- docs/platform/work-state/decisions/retired-decision-history.md\n- docs/specs/work-state.md\n- docs/io-contract.md\nImplementation: Carried source material; current implementation truth unverified\nProvenance: Retained work-state candidate carriage from docs/specs/work-state.md and docs/io-contract.md; existing Related references retained\nWriter type: Original writer attribution not recorded; retained source provenance\nCanonical for: Candidate scope: Owns the input and output contract of the fgOS CLI door and the stdout surface of fgos-runner: writer identity, envelope, exit codes, pagination, verb manifest and version tokens; authority follows transitional switchboard\nUse this when: Owns the input and output contract of the fgOS CLI door and the stdout surface of fgos-runner: writer identity, envelope, exit codes, pagination, verb manifest and version tokens\nDo not use this for: Authority beyond the declared scope or implementation truth without the cited verification\nSupersedes: None; legacy sources remain in place during migration\nSuperseded by: None recorded\n```"
  }
}
```

