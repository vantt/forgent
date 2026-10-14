# Bounded whole-system source review request

Content commit: `a8a10abc1a24218518a14764f68c8d86f4810f91`. Author session: `codex-session:37@2026-10-15`. Review mode requested: ordinary.

Shard: `plans/260925-documentation-authority-unification/ledger/decisions/s6-whole-system-component-component-boundary-advisory.json`. Part 1/3; entries: **80**. Sidecar: `review-request-261015-0450-whole-system-03.md.json`.

Read review-brief.md, owner-answers.md A28–A37, frozen whole-system map, constitution, vocabulary and shard schema. Apply A36: mechanically check every row (full digest recompute, anchor check, shard/pack equality); deeply read the reviewer-seeded sample plus every differing-digest row in both directions with its diff. Preserve conditions, qualifiers, dated status and complete payload; verify one owner and labelled additions. No approval is supplied here.

Step 6’s closing review is a **checkpoint review whose sensitivity pack the reviewer holds**. The author has not created, seen or selected that pack/key. Ordinary review and A36 sampling do not replace checkpoint sensitivity.

Ordinary verdict contract: `Reviewer: <independent identity>`, `Review mode: ordinary`, request/content/shard pins; one own note and full 64-hex shown-unit digests per row. Use ok/rework/hold. Consolidate parts into a complete report for the original shard before unchanged ordinary application; never edit decisions manually.

| Claim | Verdict | Note | Source digest | Target digest |
|---|---|---|---|---|

A36 mandatory differing-digest rows (16): `claim_6a9ed963beadff6cbe381fe46ccd8d8d`, `claim_b5eaf900c55b4d0160e490fd9da0de39`, `claim_046eeac7c222602b244507f2829c43d7`, `claim_0e028e16afe6931703eea5bb0ce1b213`, `claim_5fd8d8715b894471ec6b7dcbb6c53b56`, `claim_8011b527ba30707d1a1e93fe256e6205`, `claim_ae69ca82e388b03292f8c25fe9c998c0`, `claim_ab73231bdd37667748e73f92da406a7b`, `claim_41f97bc51d3e290eee4ede5329ceb32a`, `claim_239931ca8e26fd3b19bf970e30e2ae4b`, `claim_ae47f4ebf4390cd7a05bc5455deb37ed`, `claim_fe1e3cdfa133bbe5a28323f30047167b`, `claim_83174b29e18380691596cf50df35f0d6`, `claim_96e947d6daf7dd7612cc711be8e3e22e`, `claim_4e86e8414c4e3b780e81f77255853447`, `claim_496db5ac38fbd813df06a0a32358fd67`.

Absent-target rows (0): none.

This pack has 80 Weak-exact/Judgment rows; reviewer independently draws/records at least 12 by seed (>=15%, minimum 10, all if fewer), plus every differing pair listed above. Each verdict note says deep or mechanical. If >3% of deep-read rows need rework, deeply read the complete pack before reporting. Author selected no sample. Whole batch: 300 Unit-exact, 392 Weak-exact, 134 Judgment, all 826 pending; 123 mandatory differing pairs. The 79-row batch-wide lower bound does not replace each pack minimum.

Reverse review: the separate native candidate-unverified request/list covers the complete scoped population; it is not reset per sliced pack. Full shown text hashes below bind payload separately from native heading identity digests.

## claim_6a9ed963beadff6cbe381fe46ccd8d8d

Source: `docs/architect/component-boundary/component-boundary-advisory.md#fgos-component-boundary-advisory`. Target: `docs/platform/component-boundary.md#fgos-component-boundary-advisory`.

Mechanical class: Judgment. Source digest: `60a53b2e9e95066e9c8aed269a5c87e08f4fdc622d280e3cefcdcf196d1fd66c`. Target digest: `649b5512477ff5be808c16e91fb1ccb75d026ebc8778314a2d08c7641e51b4da`.

Full shown source SHA256: `51fe473f064a6e434971d11639530f0b19bd451ef6820c3e8ae657e7cdd40270`. Full shown target SHA256: `f913c65d49e7a220a11058425baca3d91cf7126b4208c018b5b064a45bddc67b`.

### Proposed decision

```json
{
  "claimId": "claim_6a9ed963beadff6cbe381fe46ccd8d8d",
  "sourceUnitDigest": "60a53b2e9e95066e9c8aed269a5c87e08f4fdc622d280e3cefcdcf196d1fd66c",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "fgos-component-boundary-advisory",
  "targetUnitDigest": "649b5512477ff5be808c16e91fb1ccb75d026ebc8778314a2d08c7641e51b4da",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: component-boundary-advisory source carriage"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Judgment: no target digest match. Carry the complete heading at docs/architect/component-boundary/component-boundary-advisory.md#fgos-component-boundary-advisory (lines 1–1) into docs/platform/component-boundary.md#fgos-component-boundary-advisory (lines 98–98), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. Digest differences come only from the recorded candidate header/frontmatter fence, heading-level shift or physical relative-link rebasing; full before/after units and line mapping are in authoring accounting. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
# fgOS Component Boundary Advisory

Document type: Proposal
Design status: Discussion / Visionary advisory
Implementation: N/A
Last reviewed: 2026-09-01
Canonical for: nothing; architectural advisory only
Related: [Architecture Map](../../architecture-map.md), [System Overview](../../specs/system-overview.md), [Platform Foundations](../../platform-foundations.md), [Domainization Architecture](../domainization/README.md), [Agent Coordination Foundation Vision](../agent-coordination/vision.md), [Concept Relationships](../agent-coordination/vocabulary/concept-relationships.md), [Dispatch Control Plane](../agent-coordination/architecture/dispatch-control-plane.md), [Protocol Model](../agent-coordination/architecture/protocol-model.md), [CoordinationSession Contract](../agent-coordination/contracts/coordination-session.md), [FlowDefinition Contract](../agent-coordination/contracts/flow-definition.md)
```

### Full target shown text

```text
### fgOS Component Boundary Advisory

Document type: Proposal
Design status: Discussion / Visionary advisory
Implementation: N/A
Last reviewed: 2026-09-01
Canonical for: nothing; architectural advisory only
Related: [Architecture Map](../architecture-map.md), [System Overview](../specs/system-overview.md), [Platform Foundations](../platform-foundations.md), [Domainization Architecture](../architect/domainization/README.md), [Agent Coordination Foundation Vision](../architect/agent-coordination/vision.md), [Concept Relationships](../architect/agent-coordination/vocabulary/concept-relationships.md), [Dispatch Control Plane](../architect/agent-coordination/architecture/dispatch-control-plane.md), [Protocol Model](../architect/agent-coordination/architecture/protocol-model.md), [CoordinationSession Contract](../architect/agent-coordination/contracts/coordination-session.md), [FlowDefinition Contract](../architect/agent-coordination/contracts/flow-definition.md)
```

### Unified diff

```diff
--- docs/architect/component-boundary/component-boundary-advisory.md#fgos-component-boundary-advisory
+++ docs/platform/component-boundary.md#fgos-component-boundary-advisory
@@ -1,8 +1,8 @@
-# fgOS Component Boundary Advisory
+### fgOS Component Boundary Advisory
 
 Document type: Proposal
 Design status: Discussion / Visionary advisory
 Implementation: N/A
 Last reviewed: 2026-09-01
 Canonical for: nothing; architectural advisory only
-Related: [Architecture Map](../../architecture-map.md), [System Overview](../../specs/system-overview.md), [Platform Foundations](../../platform-foundations.md), [Domainization Architecture](../domainization/README.md), [Agent Coordination Foundation Vision](../agent-coordination/vision.md), [Concept Relationships](../agent-coordination/vocabulary/concept-relationships.md), [Dispatch Control Plane](../agent-coordination/architecture/dispatch-control-plane.md), [Protocol Model](../agent-coordination/architecture/protocol-model.md), [CoordinationSession Contract](../agent-coordination/contracts/coordination-session.md), [FlowDefinition Contract](../agent-coordination/contracts/flow-definition.md)
+Related: [Architecture Map](../architecture-map.md), [System Overview](../specs/system-overview.md), [Platform Foundations](../platform-foundations.md), [Domainization Architecture](../architect/domainization/README.md), [Agent Coordination Foundation Vision](../architect/agent-coordination/vision.md), [Concept Relationships](../architect/agent-coordination/vocabulary/concept-relationships.md), [Dispatch Control Plane](../architect/agent-coordination/architecture/dispatch-control-plane.md), [Protocol Model](../architect/agent-coordination/architecture/protocol-model.md), [CoordinationSession Contract](../architect/agent-coordination/contracts/coordination-session.md), [FlowDefinition Contract](../architect/agent-coordination/contracts/flow-definition.md)

```

## claim_b5eaf900c55b4d0160e490fd9da0de39

Source: `docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-1`. Target: `docs/platform/component-boundary.md#unheaded-block-15`.

Mechanical class: Judgment. Source digest: `67a1060f9c3ca588a89d2f10b4d096a4bc75c70e03c7276a0aceb30b7f1357d3`. Target digest: `2fe14948da8854744ebb6006b5a35d8f16dc79988c74fa56e3880297da287e1d`.

Full shown source SHA256: `67a1060f9c3ca588a89d2f10b4d096a4bc75c70e03c7276a0aceb30b7f1357d3`. Full shown target SHA256: `2fe14948da8854744ebb6006b5a35d8f16dc79988c74fa56e3880297da287e1d`.

### Proposed decision

```json
{
  "claimId": "claim_b5eaf900c55b4d0160e490fd9da0de39",
  "sourceUnitDigest": "67a1060f9c3ca588a89d2f10b4d096a4bc75c70e03c7276a0aceb30b7f1357d3",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-15",
  "targetUnitDigest": "2fe14948da8854744ebb6006b5a35d8f16dc79988c74fa56e3880297da287e1d",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: component-boundary-advisory source carriage",
    "fgOS Component Boundary Advisory"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Judgment: no target digest match. Carry the complete unheaded-block at docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-1 (lines 3–8) into docs/platform/component-boundary.md#unheaded-block-15 (lines 100–105), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. Digest differences come only from the recorded candidate header/frontmatter fence, heading-level shift or physical relative-link rebasing; full before/after units and line mapping are in authoring accounting. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
Document type: Proposal
Design status: Discussion / Visionary advisory
Implementation: N/A
Last reviewed: 2026-09-01
Canonical for: nothing; architectural advisory only
Related: [Architecture Map](../../architecture-map.md), [System Overview](../../specs/system-overview.md), [Platform Foundations](../../platform-foundations.md), [Domainization Architecture](../domainization/README.md), [Agent Coordination Foundation Vision](../agent-coordination/vision.md), [Concept Relationships](../agent-coordination/vocabulary/concept-relationships.md), [Dispatch Control Plane](../agent-coordination/architecture/dispatch-control-plane.md), [Protocol Model](../agent-coordination/architecture/protocol-model.md), [CoordinationSession Contract](../agent-coordination/contracts/coordination-session.md), [FlowDefinition Contract](../agent-coordination/contracts/flow-definition.md)
```

### Full target shown text

```text
Document type: Proposal
Design status: Discussion / Visionary advisory
Implementation: N/A
Last reviewed: 2026-09-01
Canonical for: nothing; architectural advisory only
Related: [Architecture Map](../architecture-map.md), [System Overview](../specs/system-overview.md), [Platform Foundations](../platform-foundations.md), [Domainization Architecture](../architect/domainization/README.md), [Agent Coordination Foundation Vision](../architect/agent-coordination/vision.md), [Concept Relationships](../architect/agent-coordination/vocabulary/concept-relationships.md), [Dispatch Control Plane](../architect/agent-coordination/architecture/dispatch-control-plane.md), [Protocol Model](../architect/agent-coordination/architecture/protocol-model.md), [CoordinationSession Contract](../architect/agent-coordination/contracts/coordination-session.md), [FlowDefinition Contract](../architect/agent-coordination/contracts/flow-definition.md)
```

### Unified diff

```diff
--- docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-1
+++ docs/platform/component-boundary.md#unheaded-block-15
@@ -3,4 +3,4 @@
 Implementation: N/A
 Last reviewed: 2026-09-01
 Canonical for: nothing; architectural advisory only
-Related: [Architecture Map](../../architecture-map.md), [System Overview](../../specs/system-overview.md), [Platform Foundations](../../platform-foundations.md), [Domainization Architecture](../domainization/README.md), [Agent Coordination Foundation Vision](../agent-coordination/vision.md), [Concept Relationships](../agent-coordination/vocabulary/concept-relationships.md), [Dispatch Control Plane](../agent-coordination/architecture/dispatch-control-plane.md), [Protocol Model](../agent-coordination/architecture/protocol-model.md), [CoordinationSession Contract](../agent-coordination/contracts/coordination-session.md), [FlowDefinition Contract](../agent-coordination/contracts/flow-definition.md)
+Related: [Architecture Map](../architecture-map.md), [System Overview](../specs/system-overview.md), [Platform Foundations](../platform-foundations.md), [Domainization Architecture](../architect/domainization/README.md), [Agent Coordination Foundation Vision](../architect/agent-coordination/vision.md), [Concept Relationships](../architect/agent-coordination/vocabulary/concept-relationships.md), [Dispatch Control Plane](../architect/agent-coordination/architecture/dispatch-control-plane.md), [Protocol Model](../architect/agent-coordination/architecture/protocol-model.md), [CoordinationSession Contract](../architect/agent-coordination/contracts/coordination-session.md), [FlowDefinition Contract](../architect/agent-coordination/contracts/flow-definition.md)

```

## claim_046eeac7c222602b244507f2829c43d7

Source: `docs/architect/component-boundary/component-boundary-advisory.md#1-purpose`. Target: `docs/platform/component-boundary.md#1-purpose-1`.

Mechanical class: Judgment. Source digest: `9ad2289326253d0c392faaea70a75f0dc062d9fe7c2a1134751c122a1e8fe675`. Target digest: `a55c1413a243228ffc24509e1e176d1c921bebdbbbbecffbb04cc36ca4e47b9c`.

Full shown source SHA256: `46899f9adb75ff2e8c37a1d30594486fd0241210332ecac4cbbcbccbed3f3755`. Full shown target SHA256: `c40aea1d4493cf31641d2670d7f6a3dc6de9ebdc56d4ac56fc0f0a4a8f0ff47b`.

### Proposed decision

```json
{
  "claimId": "claim_046eeac7c222602b244507f2829c43d7",
  "sourceUnitDigest": "9ad2289326253d0c392faaea70a75f0dc062d9fe7c2a1134751c122a1e8fe675",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "1-purpose-1",
  "targetUnitDigest": "a55c1413a243228ffc24509e1e176d1c921bebdbbbbecffbb04cc36ca4e47b9c",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: component-boundary-advisory source carriage",
    "fgOS Component Boundary Advisory"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Judgment: no target digest match. Carry the complete heading at docs/architect/component-boundary/component-boundary-advisory.md#1-purpose (lines 10–10) into docs/platform/component-boundary.md#1-purpose-1 (lines 107–107), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. Digest differences come only from the recorded candidate header/frontmatter fence, heading-level shift or physical relative-link rebasing; full before/after units and line mapping are in authoring accounting. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

````text
## 1. Purpose

> **Ghi chú chuyển tiếp (2026-10-02):** Bảng phân chia component sau track Request-to-Run (P1–P5) đã thay thế "Agent Coordination Engine" bằng **Workflow Runner** (`src/workflow/**`) và **Collaboration Patterns / Execution Core** (`src/runner/execution/**`). Nguồn chuẩn hiện hành là `docs/platform/component-boundary.md`.

This note records an architecture advisory view of fgOS as a whole under
single-responsibility and hexagonal-architecture criteria. It is intentionally
not an implementation plan and does not approve new contracts. Its goal is to
make the candidate component, bounded-context, and authority boundaries easier
to discuss before any one area grows into a system-shaped module by accident.

The scope is the whole forgentX system: Work Lifecycle, Agent
Coordination, Dispatch And Execution, Run Result Evaluation, Domain Components,
Host And Surface, setup/doctor/distribution, gateway/Herdr,
knowledge/learning, and Node/Rust implementation boundaries.

Read this document as a refactoring compass, not as a rebuild mandate. It
describes the direction for moving existing behavior toward clearer
component, bounded-context, and authority ownership as implementation slices
create a natural opening. It should help reviewers decide whether a slice is
placing behavior behind the right boundary. It should not be used to require a
large repackage, rename, or module split before the runtime has proven the
need.

The central recommendation is:

```txt
Keep each platform engine small.
Separate component packaging, bounded contexts, and authority boundaries.
Make dispatch, cognition/protocols, domain harnesses, execution adapters, and
evidence evaluation replaceable through explicit ports.
```
````

### Full target shown text

````text
#### 1. Purpose

> **Ghi chú chuyển tiếp (2026-10-02):** Bảng phân chia component sau track Request-to-Run (P1–P5) đã thay thế "Agent Coordination Engine" bằng **Workflow Runner** (`src/workflow/**`) và **Collaboration Patterns / Execution Core** (`src/runner/execution/**`). Nguồn chuẩn hiện hành là `docs/platform/component-boundary.md`.

This note records an architecture advisory view of fgOS as a whole under
single-responsibility and hexagonal-architecture criteria. It is intentionally
not an implementation plan and does not approve new contracts. Its goal is to
make the candidate component, bounded-context, and authority boundaries easier
to discuss before any one area grows into a system-shaped module by accident.

The scope is the whole forgentX system: Work Lifecycle, Agent
Coordination, Dispatch And Execution, Run Result Evaluation, Domain Components,
Host And Surface, setup/doctor/distribution, gateway/Herdr,
knowledge/learning, and Node/Rust implementation boundaries.

Read this document as a refactoring compass, not as a rebuild mandate. It
describes the direction for moving existing behavior toward clearer
component, bounded-context, and authority ownership as implementation slices
create a natural opening. It should help reviewers decide whether a slice is
placing behavior behind the right boundary. It should not be used to require a
large repackage, rename, or module split before the runtime has proven the
need.

The central recommendation is:

```txt
Keep each platform engine small.
Separate component packaging, bounded contexts, and authority boundaries.
Make dispatch, cognition/protocols, domain harnesses, execution adapters, and
evidence evaluation replaceable through explicit ports.
```
````

### Unified diff

```diff
--- docs/architect/component-boundary/component-boundary-advisory.md#1-purpose
+++ docs/platform/component-boundary.md#1-purpose-1
@@ -1,4 +1,4 @@
-## 1. Purpose
+#### 1. Purpose
 
 > **Ghi chú chuyển tiếp (2026-10-02):** Bảng phân chia component sau track Request-to-Run (P1–P5) đã thay thế "Agent Coordination Engine" bằng **Workflow Runner** (`src/workflow/**`) và **Collaboration Patterns / Execution Core** (`src/runner/execution/**`). Nguồn chuẩn hiện hành là `docs/platform/component-boundary.md`.
 

```

## claim_b92189308a3f97db6d372cbc1d595e96

Source: `docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-2`. Target: `docs/platform/component-boundary.md#unheaded-block-16`.

Mechanical class: Weak-exact. Source digest: `4ccffa91cb32879adad24bbaa07de27f2045c8f092e9dc3a45da2df6960a6d1f`. Target digest: `4ccffa91cb32879adad24bbaa07de27f2045c8f092e9dc3a45da2df6960a6d1f`.

Full shown source SHA256: `4ccffa91cb32879adad24bbaa07de27f2045c8f092e9dc3a45da2df6960a6d1f`. Full shown target SHA256: `4ccffa91cb32879adad24bbaa07de27f2045c8f092e9dc3a45da2df6960a6d1f`.

### Proposed decision

```json
{
  "claimId": "claim_b92189308a3f97db6d372cbc1d595e96",
  "sourceUnitDigest": "4ccffa91cb32879adad24bbaa07de27f2045c8f092e9dc3a45da2df6960a6d1f",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-16",
  "targetUnitDigest": "4ccffa91cb32879adad24bbaa07de27f2045c8f092e9dc3a45da2df6960a6d1f",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: component-boundary-advisory source carriage",
    "fgOS Component Boundary Advisory",
    "1. Purpose"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-2 (lines 12–12) into docs/platform/component-boundary.md#unheaded-block-16 (lines 109–109), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
> **Ghi chú chuyển tiếp (2026-10-02):** Bảng phân chia component sau track Request-to-Run (P1–P5) đã thay thế "Agent Coordination Engine" bằng **Workflow Runner** (`src/workflow/**`) và **Collaboration Patterns / Execution Core** (`src/runner/execution/**`). Nguồn chuẩn hiện hành là `docs/platform/component-boundary.md`.
```

### Full target shown text

```text
> **Ghi chú chuyển tiếp (2026-10-02):** Bảng phân chia component sau track Request-to-Run (P1–P5) đã thay thế "Agent Coordination Engine" bằng **Workflow Runner** (`src/workflow/**`) và **Collaboration Patterns / Execution Core** (`src/runner/execution/**`). Nguồn chuẩn hiện hành là `docs/platform/component-boundary.md`.
```

### Unified diff

```diff
No text difference.
```

## claim_8b11b98d58f3e28176cc838ba918a3cc

Source: `docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-3`. Target: `docs/platform/component-boundary.md#unheaded-block-17`.

Mechanical class: Weak-exact. Source digest: `78d58148ed5a88f8afa9f17ea9dfca96f6e3782af983b93558176a1f027b77a9`. Target digest: `78d58148ed5a88f8afa9f17ea9dfca96f6e3782af983b93558176a1f027b77a9`.

Full shown source SHA256: `78d58148ed5a88f8afa9f17ea9dfca96f6e3782af983b93558176a1f027b77a9`. Full shown target SHA256: `78d58148ed5a88f8afa9f17ea9dfca96f6e3782af983b93558176a1f027b77a9`.

### Proposed decision

```json
{
  "claimId": "claim_8b11b98d58f3e28176cc838ba918a3cc",
  "sourceUnitDigest": "78d58148ed5a88f8afa9f17ea9dfca96f6e3782af983b93558176a1f027b77a9",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-17",
  "targetUnitDigest": "78d58148ed5a88f8afa9f17ea9dfca96f6e3782af983b93558176a1f027b77a9",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: component-boundary-advisory source carriage",
    "fgOS Component Boundary Advisory",
    "1. Purpose"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-3 (lines 14–18) into docs/platform/component-boundary.md#unheaded-block-17 (lines 111–115), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
This note records an architecture advisory view of fgOS as a whole under
single-responsibility and hexagonal-architecture criteria. It is intentionally
not an implementation plan and does not approve new contracts. Its goal is to
make the candidate component, bounded-context, and authority boundaries easier
to discuss before any one area grows into a system-shaped module by accident.
```

### Full target shown text

```text
This note records an architecture advisory view of fgOS as a whole under
single-responsibility and hexagonal-architecture criteria. It is intentionally
not an implementation plan and does not approve new contracts. Its goal is to
make the candidate component, bounded-context, and authority boundaries easier
to discuss before any one area grows into a system-shaped module by accident.
```

### Unified diff

```diff
No text difference.
```

## claim_bc4dae75c91315b033597e9334304bc2

Source: `docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-4`. Target: `docs/platform/component-boundary.md#unheaded-block-18`.

Mechanical class: Weak-exact. Source digest: `99604b6343fc67389feebfaa90d426013667e994f3aeea1e390c15cea87d1094`. Target digest: `99604b6343fc67389feebfaa90d426013667e994f3aeea1e390c15cea87d1094`.

Full shown source SHA256: `99604b6343fc67389feebfaa90d426013667e994f3aeea1e390c15cea87d1094`. Full shown target SHA256: `99604b6343fc67389feebfaa90d426013667e994f3aeea1e390c15cea87d1094`.

### Proposed decision

```json
{
  "claimId": "claim_bc4dae75c91315b033597e9334304bc2",
  "sourceUnitDigest": "99604b6343fc67389feebfaa90d426013667e994f3aeea1e390c15cea87d1094",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-18",
  "targetUnitDigest": "99604b6343fc67389feebfaa90d426013667e994f3aeea1e390c15cea87d1094",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: component-boundary-advisory source carriage",
    "fgOS Component Boundary Advisory",
    "1. Purpose"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-4 (lines 20–23) into docs/platform/component-boundary.md#unheaded-block-18 (lines 117–120), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
The scope is the whole forgentX system: Work Lifecycle, Agent
Coordination, Dispatch And Execution, Run Result Evaluation, Domain Components,
Host And Surface, setup/doctor/distribution, gateway/Herdr,
knowledge/learning, and Node/Rust implementation boundaries.
```

### Full target shown text

```text
The scope is the whole forgentX system: Work Lifecycle, Agent
Coordination, Dispatch And Execution, Run Result Evaluation, Domain Components,
Host And Surface, setup/doctor/distribution, gateway/Herdr,
knowledge/learning, and Node/Rust implementation boundaries.
```

### Unified diff

```diff
No text difference.
```

## claim_df36e613ed863d1a89c41c929818f470

Source: `docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-5`. Target: `docs/platform/component-boundary.md#unheaded-block-19`.

Mechanical class: Weak-exact. Source digest: `775e5a1e3ec8f34cedeec90a70b977b73fa12f5cf1af4375d45407efeb8ca150`. Target digest: `775e5a1e3ec8f34cedeec90a70b977b73fa12f5cf1af4375d45407efeb8ca150`.

Full shown source SHA256: `775e5a1e3ec8f34cedeec90a70b977b73fa12f5cf1af4375d45407efeb8ca150`. Full shown target SHA256: `775e5a1e3ec8f34cedeec90a70b977b73fa12f5cf1af4375d45407efeb8ca150`.

### Proposed decision

```json
{
  "claimId": "claim_df36e613ed863d1a89c41c929818f470",
  "sourceUnitDigest": "775e5a1e3ec8f34cedeec90a70b977b73fa12f5cf1af4375d45407efeb8ca150",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-19",
  "targetUnitDigest": "775e5a1e3ec8f34cedeec90a70b977b73fa12f5cf1af4375d45407efeb8ca150",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: component-boundary-advisory source carriage",
    "fgOS Component Boundary Advisory",
    "1. Purpose"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-5 (lines 25–31) into docs/platform/component-boundary.md#unheaded-block-19 (lines 122–128), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
Read this document as a refactoring compass, not as a rebuild mandate. It
describes the direction for moving existing behavior toward clearer
component, bounded-context, and authority ownership as implementation slices
create a natural opening. It should help reviewers decide whether a slice is
placing behavior behind the right boundary. It should not be used to require a
large repackage, rename, or module split before the runtime has proven the
need.
```

### Full target shown text

```text
Read this document as a refactoring compass, not as a rebuild mandate. It
describes the direction for moving existing behavior toward clearer
component, bounded-context, and authority ownership as implementation slices
create a natural opening. It should help reviewers decide whether a slice is
placing behavior behind the right boundary. It should not be used to require a
large repackage, rename, or module split before the runtime has proven the
need.
```

### Unified diff

```diff
No text difference.
```

## claim_957003b70a963677864efd089048503f

Source: `docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-6`. Target: `docs/platform/component-boundary.md#unheaded-block-20`.

Mechanical class: Weak-exact. Source digest: `5d824f3dd0668f48e96dd80da906608cab3e16f627adb31853cf74e08c86442b`. Target digest: `5d824f3dd0668f48e96dd80da906608cab3e16f627adb31853cf74e08c86442b`.

Full shown source SHA256: `5d824f3dd0668f48e96dd80da906608cab3e16f627adb31853cf74e08c86442b`. Full shown target SHA256: `5d824f3dd0668f48e96dd80da906608cab3e16f627adb31853cf74e08c86442b`.

### Proposed decision

```json
{
  "claimId": "claim_957003b70a963677864efd089048503f",
  "sourceUnitDigest": "5d824f3dd0668f48e96dd80da906608cab3e16f627adb31853cf74e08c86442b",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-20",
  "targetUnitDigest": "5d824f3dd0668f48e96dd80da906608cab3e16f627adb31853cf74e08c86442b",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: component-boundary-advisory source carriage",
    "fgOS Component Boundary Advisory",
    "1. Purpose"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ; source unit shorter than 40 characters. Carry the complete unheaded-block at docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-6 (lines 33–33) into docs/platform/component-boundary.md#unheaded-block-20 (lines 130–130), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
The central recommendation is:
```

### Full target shown text

```text
The central recommendation is:
```

### Unified diff

```diff
No text difference.
```

## claim_7489ec924442f26825dccb35b9a102e9

Source: `docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-7`. Target: `docs/platform/component-boundary.md#unheaded-block-21`.

Mechanical class: Weak-exact. Source digest: `c3e3065f86803d9cf1e8ffd2bbe7b66347e7fb1fae1244d3a286f3bb089a4c84`. Target digest: `c3e3065f86803d9cf1e8ffd2bbe7b66347e7fb1fae1244d3a286f3bb089a4c84`.

Full shown source SHA256: `c3e3065f86803d9cf1e8ffd2bbe7b66347e7fb1fae1244d3a286f3bb089a4c84`. Full shown target SHA256: `c3e3065f86803d9cf1e8ffd2bbe7b66347e7fb1fae1244d3a286f3bb089a4c84`.

### Proposed decision

```json
{
  "claimId": "claim_7489ec924442f26825dccb35b9a102e9",
  "sourceUnitDigest": "c3e3065f86803d9cf1e8ffd2bbe7b66347e7fb1fae1244d3a286f3bb089a4c84",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-21",
  "targetUnitDigest": "c3e3065f86803d9cf1e8ffd2bbe7b66347e7fb1fae1244d3a286f3bb089a4c84",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: component-boundary-advisory source carriage",
    "fgOS Component Boundary Advisory",
    "1. Purpose"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-7 (lines 35–40) into docs/platform/component-boundary.md#unheaded-block-21 (lines 132–137), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

````text
```txt
Keep each platform engine small.
Separate component packaging, bounded contexts, and authority boundaries.
Make dispatch, cognition/protocols, domain harnesses, execution adapters, and
evidence evaluation replaceable through explicit ports.
```
````

### Full target shown text

````text
```txt
Keep each platform engine small.
Separate component packaging, bounded contexts, and authority boundaries.
Make dispatch, cognition/protocols, domain harnesses, execution adapters, and
evidence evaluation replaceable through explicit ports.
```
````

### Unified diff

```diff
No text difference.
```

## claim_0e028e16afe6931703eea5bb0ce1b213

Source: `docs/architect/component-boundary/component-boundary-advisory.md#2-architectural-reading`. Target: `docs/platform/component-boundary.md#2-architectural-reading`.

Mechanical class: Judgment. Source digest: `09be351e10a90e492e09ea98d435262e114833a20eabea44387ecabfef0dbf9c`. Target digest: `2269bc64c0184627a65acff80ad17666348fa26cb74db769fa03d75d40a458bb`.

Full shown source SHA256: `71eebb00dd3d7758cafe6cbadd3f26539173c7c05c497214a39c70435a5bc1d0`. Full shown target SHA256: `ef2449f1cd12a00c0b7b1fc9757f19cf95d758a095b092eb09f2dd55ed060818`.

### Proposed decision

```json
{
  "claimId": "claim_0e028e16afe6931703eea5bb0ce1b213",
  "sourceUnitDigest": "09be351e10a90e492e09ea98d435262e114833a20eabea44387ecabfef0dbf9c",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "2-architectural-reading",
  "targetUnitDigest": "2269bc64c0184627a65acff80ad17666348fa26cb74db769fa03d75d40a458bb",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: component-boundary-advisory source carriage",
    "fgOS Component Boundary Advisory"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Judgment: no target digest match. Carry the complete heading at docs/architect/component-boundary/component-boundary-advisory.md#2-architectural-reading (lines 42–42) into docs/platform/component-boundary.md#2-architectural-reading (lines 139–139), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. Digest differences come only from the recorded candidate header/frontmatter fence, heading-level shift or physical relative-link rebasing; full before/after units and line mapping are in authoring accounting. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

````text
## 2. Architectural Reading

The accepted documents already point in the right direction:

- Work is optional integration, not coordination identity.
- Workflow or CollaborationPattern is optional structure, not a universal entry
  requirement.
- Every executable request still lowers to a validated semantic contract.
- Assignment, DispatchPlan, Run, RunResult, and Evidence form the shared
  governed execution path.
- Domain and organization augmentation must enrich or reject plans without
  forking the execution core.
- Foundation seams should be generalized only after unlike consumers prove the
  common need.

The risk is not that the concepts are missing. The risk is that several
adjacent concepts can drift into one large runner-shaped module unless their
ownership is made explicit:

```txt
coordinator / planner / protocol / domain harness / assignment builder /
dispatch / executor adapter / run runtime / evidence evaluator / work driver
```

These names describe different responsibilities. If they share one implicit
control path, changes such as a Rust dispatcher, new protocol families,
Herdr/headless parity, provider diversity, or Work-attached mutation will be
harder to introduce safely.
````

### Full target shown text

````text
#### 2. Architectural Reading

The accepted documents already point in the right direction:

- Work is optional integration, not coordination identity.
- Workflow or CollaborationPattern is optional structure, not a universal entry
  requirement.
- Every executable request still lowers to a validated semantic contract.
- Assignment, DispatchPlan, Run, RunResult, and Evidence form the shared
  governed execution path.
- Domain and organization augmentation must enrich or reject plans without
  forking the execution core.
- Foundation seams should be generalized only after unlike consumers prove the
  common need.

The risk is not that the concepts are missing. The risk is that several
adjacent concepts can drift into one large runner-shaped module unless their
ownership is made explicit:

```txt
coordinator / planner / protocol / domain harness / assignment builder /
dispatch / executor adapter / run runtime / evidence evaluator / work driver
```

These names describe different responsibilities. If they share one implicit
control path, changes such as a Rust dispatcher, new protocol families,
Herdr/headless parity, provider diversity, or Work-attached mutation will be
harder to introduce safely.
````

### Unified diff

```diff
--- docs/architect/component-boundary/component-boundary-advisory.md#2-architectural-reading
+++ docs/platform/component-boundary.md#2-architectural-reading
@@ -1,4 +1,4 @@
-## 2. Architectural Reading
+#### 2. Architectural Reading
 
 The accepted documents already point in the right direction:
 

```

## claim_d7ef7b9695e7e7591bc63a10b5772030

Source: `docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-8`. Target: `docs/platform/component-boundary.md#unheaded-block-22`.

Mechanical class: Weak-exact. Source digest: `4816c7877f70615ff18fe93897c011d4d36a279e8a3ed8bffe7f4c0a320c0d8f`. Target digest: `4816c7877f70615ff18fe93897c011d4d36a279e8a3ed8bffe7f4c0a320c0d8f`.

Full shown source SHA256: `4816c7877f70615ff18fe93897c011d4d36a279e8a3ed8bffe7f4c0a320c0d8f`. Full shown target SHA256: `4816c7877f70615ff18fe93897c011d4d36a279e8a3ed8bffe7f4c0a320c0d8f`.

### Proposed decision

```json
{
  "claimId": "claim_d7ef7b9695e7e7591bc63a10b5772030",
  "sourceUnitDigest": "4816c7877f70615ff18fe93897c011d4d36a279e8a3ed8bffe7f4c0a320c0d8f",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-22",
  "targetUnitDigest": "4816c7877f70615ff18fe93897c011d4d36a279e8a3ed8bffe7f4c0a320c0d8f",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: component-boundary-advisory source carriage",
    "fgOS Component Boundary Advisory",
    "2. Architectural Reading"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-8 (lines 44–44) into docs/platform/component-boundary.md#unheaded-block-22 (lines 141–141), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
The accepted documents already point in the right direction:
```

### Full target shown text

```text
The accepted documents already point in the right direction:
```

### Unified diff

```diff
No text difference.
```

## claim_578fb4877ff64851cfa60549b49f35bb

Source: `docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-9`. Target: `docs/platform/component-boundary.md#unheaded-block-23`.

Mechanical class: Weak-exact. Source digest: `414fbebab9b091e01cff844e26ff72df54cb40200d7feffe3e9a1478be20f174`. Target digest: `414fbebab9b091e01cff844e26ff72df54cb40200d7feffe3e9a1478be20f174`.

Full shown source SHA256: `414fbebab9b091e01cff844e26ff72df54cb40200d7feffe3e9a1478be20f174`. Full shown target SHA256: `414fbebab9b091e01cff844e26ff72df54cb40200d7feffe3e9a1478be20f174`.

### Proposed decision

```json
{
  "claimId": "claim_578fb4877ff64851cfa60549b49f35bb",
  "sourceUnitDigest": "414fbebab9b091e01cff844e26ff72df54cb40200d7feffe3e9a1478be20f174",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-23",
  "targetUnitDigest": "414fbebab9b091e01cff844e26ff72df54cb40200d7feffe3e9a1478be20f174",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: component-boundary-advisory source carriage",
    "fgOS Component Boundary Advisory",
    "2. Architectural Reading"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-9 (lines 46–55) into docs/platform/component-boundary.md#unheaded-block-23 (lines 143–152), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
- Work is optional integration, not coordination identity.
- Workflow or CollaborationPattern is optional structure, not a universal entry
  requirement.
- Every executable request still lowers to a validated semantic contract.
- Assignment, DispatchPlan, Run, RunResult, and Evidence form the shared
  governed execution path.
- Domain and organization augmentation must enrich or reject plans without
  forking the execution core.
- Foundation seams should be generalized only after unlike consumers prove the
  common need.
```

### Full target shown text

```text
- Work is optional integration, not coordination identity.
- Workflow or CollaborationPattern is optional structure, not a universal entry
  requirement.
- Every executable request still lowers to a validated semantic contract.
- Assignment, DispatchPlan, Run, RunResult, and Evidence form the shared
  governed execution path.
- Domain and organization augmentation must enrich or reject plans without
  forking the execution core.
- Foundation seams should be generalized only after unlike consumers prove the
  common need.
```

### Unified diff

```diff
No text difference.
```

## claim_80a366589a99e93ce66ed687286316b2

Source: `docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-10`. Target: `docs/platform/component-boundary.md#unheaded-block-24`.

Mechanical class: Weak-exact. Source digest: `1a29398d79ad8a867115fd31673666e42552143a665dff177202e0c0d626050b`. Target digest: `1a29398d79ad8a867115fd31673666e42552143a665dff177202e0c0d626050b`.

Full shown source SHA256: `1a29398d79ad8a867115fd31673666e42552143a665dff177202e0c0d626050b`. Full shown target SHA256: `1a29398d79ad8a867115fd31673666e42552143a665dff177202e0c0d626050b`.

### Proposed decision

```json
{
  "claimId": "claim_80a366589a99e93ce66ed687286316b2",
  "sourceUnitDigest": "1a29398d79ad8a867115fd31673666e42552143a665dff177202e0c0d626050b",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-24",
  "targetUnitDigest": "1a29398d79ad8a867115fd31673666e42552143a665dff177202e0c0d626050b",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: component-boundary-advisory source carriage",
    "fgOS Component Boundary Advisory",
    "2. Architectural Reading"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-10 (lines 57–59) into docs/platform/component-boundary.md#unheaded-block-24 (lines 154–156), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
The risk is not that the concepts are missing. The risk is that several
adjacent concepts can drift into one large runner-shaped module unless their
ownership is made explicit:
```

### Full target shown text

```text
The risk is not that the concepts are missing. The risk is that several
adjacent concepts can drift into one large runner-shaped module unless their
ownership is made explicit:
```

### Unified diff

```diff
No text difference.
```

## claim_903c42ff170ad483bf9cada26a9c70a3

Source: `docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-11`. Target: `docs/platform/component-boundary.md#unheaded-block-25`.

Mechanical class: Weak-exact. Source digest: `58a7d0b6b06e40af6787972e6b5ae17c5c91f8a045d4cb4394a46138c132debb`. Target digest: `58a7d0b6b06e40af6787972e6b5ae17c5c91f8a045d4cb4394a46138c132debb`.

Full shown source SHA256: `58a7d0b6b06e40af6787972e6b5ae17c5c91f8a045d4cb4394a46138c132debb`. Full shown target SHA256: `58a7d0b6b06e40af6787972e6b5ae17c5c91f8a045d4cb4394a46138c132debb`.

### Proposed decision

```json
{
  "claimId": "claim_903c42ff170ad483bf9cada26a9c70a3",
  "sourceUnitDigest": "58a7d0b6b06e40af6787972e6b5ae17c5c91f8a045d4cb4394a46138c132debb",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-25",
  "targetUnitDigest": "58a7d0b6b06e40af6787972e6b5ae17c5c91f8a045d4cb4394a46138c132debb",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: component-boundary-advisory source carriage",
    "fgOS Component Boundary Advisory",
    "2. Architectural Reading"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-11 (lines 61–64) into docs/platform/component-boundary.md#unheaded-block-25 (lines 158–161), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

````text
```txt
coordinator / planner / protocol / domain harness / assignment builder /
dispatch / executor adapter / run runtime / evidence evaluator / work driver
```
````

### Full target shown text

````text
```txt
coordinator / planner / protocol / domain harness / assignment builder /
dispatch / executor adapter / run runtime / evidence evaluator / work driver
```
````

### Unified diff

```diff
No text difference.
```

## claim_fdd23574c303e8356ad0ae21e4ba868b

Source: `docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-12`. Target: `docs/platform/component-boundary.md#unheaded-block-26`.

Mechanical class: Weak-exact. Source digest: `b87cc067c17c90645cd1fcdc200f508f6e8a36b0d03d52ae40f1d3047eb7a4a1`. Target digest: `b87cc067c17c90645cd1fcdc200f508f6e8a36b0d03d52ae40f1d3047eb7a4a1`.

Full shown source SHA256: `b87cc067c17c90645cd1fcdc200f508f6e8a36b0d03d52ae40f1d3047eb7a4a1`. Full shown target SHA256: `b87cc067c17c90645cd1fcdc200f508f6e8a36b0d03d52ae40f1d3047eb7a4a1`.

### Proposed decision

```json
{
  "claimId": "claim_fdd23574c303e8356ad0ae21e4ba868b",
  "sourceUnitDigest": "b87cc067c17c90645cd1fcdc200f508f6e8a36b0d03d52ae40f1d3047eb7a4a1",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-26",
  "targetUnitDigest": "b87cc067c17c90645cd1fcdc200f508f6e8a36b0d03d52ae40f1d3047eb7a4a1",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: component-boundary-advisory source carriage",
    "fgOS Component Boundary Advisory",
    "2. Architectural Reading"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-12 (lines 66–69) into docs/platform/component-boundary.md#unheaded-block-26 (lines 163–166), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
These names describe different responsibilities. If they share one implicit
control path, changes such as a Rust dispatcher, new protocol families,
Herdr/headless parity, provider diversity, or Work-attached mutation will be
harder to introduce safely.
```

### Full target shown text

```text
These names describe different responsibilities. If they share one implicit
control path, changes such as a Rust dispatcher, new protocol families,
Herdr/headless parity, provider diversity, or Work-attached mutation will be
harder to introduce safely.
```

### Unified diff

```diff
No text difference.
```

## claim_5fd8d8715b894471ec6b7dcbb6c53b56

Source: `docs/architect/component-boundary/component-boundary-advisory.md#3-recommended-responsibility-chain`. Target: `docs/platform/component-boundary.md#3-recommended-responsibility-chain`.

Mechanical class: Judgment. Source digest: `9b5156238794a910e8b9dafbc59267cdda835af775fe7daaa4199d5a144effb2`. Target digest: `1cd1fb55e0e0d42ab1faf298a558369bc36ba6abde2587791937bf3340e19f2d`.

Full shown source SHA256: `66f9e4a63eb0845fc303ae43bf428832b69df41e2e20722d2da59f50b2826167`. Full shown target SHA256: `7f515fc782ecb32ffdab1c9d9081aaa2e85fde19cf1d828c94b87a1e4a03c3bf`.

### Proposed decision

```json
{
  "claimId": "claim_5fd8d8715b894471ec6b7dcbb6c53b56",
  "sourceUnitDigest": "9b5156238794a910e8b9dafbc59267cdda835af775fe7daaa4199d5a144effb2",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "3-recommended-responsibility-chain",
  "targetUnitDigest": "1cd1fb55e0e0d42ab1faf298a558369bc36ba6abde2587791937bf3340e19f2d",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: component-boundary-advisory source carriage",
    "fgOS Component Boundary Advisory"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Judgment: no target digest match. Carry the complete heading at docs/architect/component-boundary/component-boundary-advisory.md#3-recommended-responsibility-chain (lines 71–71) into docs/platform/component-boundary.md#3-recommended-responsibility-chain (lines 168–168), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. Digest differences come only from the recorded candidate header/frontmatter fence, heading-level shift or physical relative-link rebasing; full before/after units and line mapping are in authoring accounting. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

````text
## 3. Recommended Responsibility Chain

The clean boundary chain is:

```txt
Team cognition decides what roles, tasks, and relations are useful.
Protocol and policy validate whether the proposed action is legal and bounded.
Assignment builder freezes exactly what is being requested.
Dispatch decides who/how may execute it.
Runtime records what attempt happened.
Evidence evaluation decides what can be trusted.
Work driver decides what lifecycle action is allowed.
```

No step should reach backward and secretly own the prior step's authority. No
step should reach forward and silently decide the next step's truth.
````

### Full target shown text

````text
#### 3. Recommended Responsibility Chain

The clean boundary chain is:

```txt
Team cognition decides what roles, tasks, and relations are useful.
Protocol and policy validate whether the proposed action is legal and bounded.
Assignment builder freezes exactly what is being requested.
Dispatch decides who/how may execute it.
Runtime records what attempt happened.
Evidence evaluation decides what can be trusted.
Work driver decides what lifecycle action is allowed.
```

No step should reach backward and secretly own the prior step's authority. No
step should reach forward and silently decide the next step's truth.
````

### Unified diff

```diff
--- docs/architect/component-boundary/component-boundary-advisory.md#3-recommended-responsibility-chain
+++ docs/platform/component-boundary.md#3-recommended-responsibility-chain
@@ -1,4 +1,4 @@
-## 3. Recommended Responsibility Chain
+#### 3. Recommended Responsibility Chain
 
 The clean boundary chain is:
 

```

## claim_d59095f8b7cd6716a79350856db4e3d6

Source: `docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-13`. Target: `docs/platform/component-boundary.md#unheaded-block-27`.

Mechanical class: Weak-exact. Source digest: `dc114607aada8a58c3fc40c251a33184310b9022f9f6456a6c4f350edecd94c9`. Target digest: `dc114607aada8a58c3fc40c251a33184310b9022f9f6456a6c4f350edecd94c9`.

Full shown source SHA256: `dc114607aada8a58c3fc40c251a33184310b9022f9f6456a6c4f350edecd94c9`. Full shown target SHA256: `dc114607aada8a58c3fc40c251a33184310b9022f9f6456a6c4f350edecd94c9`.

### Proposed decision

```json
{
  "claimId": "claim_d59095f8b7cd6716a79350856db4e3d6",
  "sourceUnitDigest": "dc114607aada8a58c3fc40c251a33184310b9022f9f6456a6c4f350edecd94c9",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-27",
  "targetUnitDigest": "dc114607aada8a58c3fc40c251a33184310b9022f9f6456a6c4f350edecd94c9",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: component-boundary-advisory source carriage",
    "fgOS Component Boundary Advisory",
    "3. Recommended Responsibility Chain"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ; source unit shorter than 40 characters. Carry the complete unheaded-block at docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-13 (lines 73–73) into docs/platform/component-boundary.md#unheaded-block-27 (lines 170–170), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
The clean boundary chain is:
```

### Full target shown text

```text
The clean boundary chain is:
```

### Unified diff

```diff
No text difference.
```

## claim_05fd95ccbaf6848e2a838e3cb13314cf

Source: `docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-14`. Target: `docs/platform/component-boundary.md#unheaded-block-28`.

Mechanical class: Weak-exact. Source digest: `5f39cf944ad6419bd674e7b2261f717adb72e7b3f56508585c9daa0c2add0148`. Target digest: `5f39cf944ad6419bd674e7b2261f717adb72e7b3f56508585c9daa0c2add0148`.

Full shown source SHA256: `5f39cf944ad6419bd674e7b2261f717adb72e7b3f56508585c9daa0c2add0148`. Full shown target SHA256: `5f39cf944ad6419bd674e7b2261f717adb72e7b3f56508585c9daa0c2add0148`.

### Proposed decision

```json
{
  "claimId": "claim_05fd95ccbaf6848e2a838e3cb13314cf",
  "sourceUnitDigest": "5f39cf944ad6419bd674e7b2261f717adb72e7b3f56508585c9daa0c2add0148",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-28",
  "targetUnitDigest": "5f39cf944ad6419bd674e7b2261f717adb72e7b3f56508585c9daa0c2add0148",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: component-boundary-advisory source carriage",
    "fgOS Component Boundary Advisory",
    "3. Recommended Responsibility Chain"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-14 (lines 75–83) into docs/platform/component-boundary.md#unheaded-block-28 (lines 172–180), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

````text
```txt
Team cognition decides what roles, tasks, and relations are useful.
Protocol and policy validate whether the proposed action is legal and bounded.
Assignment builder freezes exactly what is being requested.
Dispatch decides who/how may execute it.
Runtime records what attempt happened.
Evidence evaluation decides what can be trusted.
Work driver decides what lifecycle action is allowed.
```
````

### Full target shown text

````text
```txt
Team cognition decides what roles, tasks, and relations are useful.
Protocol and policy validate whether the proposed action is legal and bounded.
Assignment builder freezes exactly what is being requested.
Dispatch decides who/how may execute it.
Runtime records what attempt happened.
Evidence evaluation decides what can be trusted.
Work driver decides what lifecycle action is allowed.
```
````

### Unified diff

```diff
No text difference.
```

## claim_fe2a2bbbcf220cf6078d884f7a17b23e

Source: `docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-15`. Target: `docs/platform/component-boundary.md#unheaded-block-29`.

Mechanical class: Weak-exact. Source digest: `0d2107a21d41d6c32b5d6a8d33671ad6bc26cd901f1522620f59b6f161361054`. Target digest: `0d2107a21d41d6c32b5d6a8d33671ad6bc26cd901f1522620f59b6f161361054`.

Full shown source SHA256: `0d2107a21d41d6c32b5d6a8d33671ad6bc26cd901f1522620f59b6f161361054`. Full shown target SHA256: `0d2107a21d41d6c32b5d6a8d33671ad6bc26cd901f1522620f59b6f161361054`.

### Proposed decision

```json
{
  "claimId": "claim_fe2a2bbbcf220cf6078d884f7a17b23e",
  "sourceUnitDigest": "0d2107a21d41d6c32b5d6a8d33671ad6bc26cd901f1522620f59b6f161361054",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-29",
  "targetUnitDigest": "0d2107a21d41d6c32b5d6a8d33671ad6bc26cd901f1522620f59b6f161361054",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: component-boundary-advisory source carriage",
    "fgOS Component Boundary Advisory",
    "3. Recommended Responsibility Chain"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-15 (lines 85–86) into docs/platform/component-boundary.md#unheaded-block-29 (lines 182–183), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
No step should reach backward and secretly own the prior step's authority. No
step should reach forward and silently decide the next step's truth.
```

### Full target shown text

```text
No step should reach backward and secretly own the prior step's authority. No
step should reach forward and silently decide the next step's truth.
```

### Unified diff

```diff
No text difference.
```

## claim_8011b527ba30707d1a1e93fe256e6205

Source: `docs/architect/component-boundary/component-boundary-advisory.md#4-boundary-vocabulary`. Target: `docs/platform/component-boundary.md#4-boundary-vocabulary`.

Mechanical class: Judgment. Source digest: `473eec9ac6988dd6f944101966be52c075986c83e484e2f652f967498ab4a77a`. Target digest: `428c54989e74ebd6f7c81254573adeee4c4a9ea2010808f553f270bdad1e0cb3`.

Full shown source SHA256: `457f6ec7dcfdf437e1ae2fa0f476eab5d4202945f38f63d675ba0e78739fe30e`. Full shown target SHA256: `f75f0a8ee405afcfcc6212e898ad07f150509f21c431b6d30426aede5cd9413d`.

### Proposed decision

```json
{
  "claimId": "claim_8011b527ba30707d1a1e93fe256e6205",
  "sourceUnitDigest": "473eec9ac6988dd6f944101966be52c075986c83e484e2f652f967498ab4a77a",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "4-boundary-vocabulary",
  "targetUnitDigest": "428c54989e74ebd6f7c81254573adeee4c4a9ea2010808f553f270bdad1e0cb3",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: component-boundary-advisory source carriage",
    "fgOS Component Boundary Advisory"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Judgment: no target digest match. Carry the complete heading at docs/architect/component-boundary/component-boundary-advisory.md#4-boundary-vocabulary (lines 88–88) into docs/platform/component-boundary.md#4-boundary-vocabulary (lines 185–185), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. Digest differences come only from the recorded candidate header/frontmatter fence, heading-level shift or physical relative-link rebasing; full before/after units and line mapping are in authoring accounting. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

````text
## 4. Boundary Vocabulary

This advisory uses three different boundary concepts. They are related, but
they should not be collapsed into one idea.

| Concept | Question it answers | Use it for | Do not use it for |
|---|---|---|---|
| High-level component/module | How should the system be packaged so major parts can collaborate without becoming too fragmented? | Source/package/service grouping, implementation ownership, replacement strategy. | Deciding source of truth by itself. |
| Bounded context | Which model, vocabulary, and reason-to-change belong together? | Domain language, internal model boundaries, validation ownership, extension design. | Every small authority rule or helper function. |
| Authority boundary | Who is allowed to decide or write a specific piece of truth? | "Only X may", "must not bypass", state ownership, contract enforcement, false-success prevention. | Packaging every rule as a separate module. |

Practical reading rule:

```txt
Use components to decide packaging.
Use bounded contexts to decide model and vocabulary.
Use authority boundaries to decide who can write truth or make a decision.
```

Example:

```txt
Dispatch And Execution Engine    = high-level component
Dispatch                         = bounded context inside that component
"Only dispatch creates DispatchPlan" = authority boundary
```

Another example:

```txt
Run Result Evaluator                         = high-level component
Run Result Evaluation                        = bounded context
"Only Run Result Evaluator computes confidence" = authority boundary
```

An authority boundary may cross a module boundary. A module may call another
module to apply a decision, but it must not privately re-derive or overwrite
that module's authority.
````

### Full target shown text

````text
#### 4. Boundary Vocabulary

This advisory uses three different boundary concepts. They are related, but
they should not be collapsed into one idea.

| Concept | Question it answers | Use it for | Do not use it for |
|---|---|---|---|
| High-level component/module | How should the system be packaged so major parts can collaborate without becoming too fragmented? | Source/package/service grouping, implementation ownership, replacement strategy. | Deciding source of truth by itself. |
| Bounded context | Which model, vocabulary, and reason-to-change belong together? | Domain language, internal model boundaries, validation ownership, extension design. | Every small authority rule or helper function. |
| Authority boundary | Who is allowed to decide or write a specific piece of truth? | "Only X may", "must not bypass", state ownership, contract enforcement, false-success prevention. | Packaging every rule as a separate module. |

Practical reading rule:

```txt
Use components to decide packaging.
Use bounded contexts to decide model and vocabulary.
Use authority boundaries to decide who can write truth or make a decision.
```

Example:

```txt
Dispatch And Execution Engine    = high-level component
Dispatch                         = bounded context inside that component
"Only dispatch creates DispatchPlan" = authority boundary
```

Another example:

```txt
Run Result Evaluator                         = high-level component
Run Result Evaluation                        = bounded context
"Only Run Result Evaluator computes confidence" = authority boundary
```

An authority boundary may cross a module boundary. A module may call another
module to apply a decision, but it must not privately re-derive or overwrite
that module's authority.
````

### Unified diff

```diff
--- docs/architect/component-boundary/component-boundary-advisory.md#4-boundary-vocabulary
+++ docs/platform/component-boundary.md#4-boundary-vocabulary
@@ -1,4 +1,4 @@
-## 4. Boundary Vocabulary
+#### 4. Boundary Vocabulary
 
 This advisory uses three different boundary concepts. They are related, but
 they should not be collapsed into one idea.

```

## claim_41b292cc495c4aa071ea37e91c8c72f3

Source: `docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-16`. Target: `docs/platform/component-boundary.md#unheaded-block-30`.

Mechanical class: Weak-exact. Source digest: `34c3658a53018bbad7beb9fbea7100d39476029dc298a822baf472e0ae0e5e64`. Target digest: `34c3658a53018bbad7beb9fbea7100d39476029dc298a822baf472e0ae0e5e64`.

Full shown source SHA256: `34c3658a53018bbad7beb9fbea7100d39476029dc298a822baf472e0ae0e5e64`. Full shown target SHA256: `34c3658a53018bbad7beb9fbea7100d39476029dc298a822baf472e0ae0e5e64`.

### Proposed decision

```json
{
  "claimId": "claim_41b292cc495c4aa071ea37e91c8c72f3",
  "sourceUnitDigest": "34c3658a53018bbad7beb9fbea7100d39476029dc298a822baf472e0ae0e5e64",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-30",
  "targetUnitDigest": "34c3658a53018bbad7beb9fbea7100d39476029dc298a822baf472e0ae0e5e64",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: component-boundary-advisory source carriage",
    "fgOS Component Boundary Advisory",
    "4. Boundary Vocabulary"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-16 (lines 90–91) into docs/platform/component-boundary.md#unheaded-block-30 (lines 187–188), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
This advisory uses three different boundary concepts. They are related, but
they should not be collapsed into one idea.
```

### Full target shown text

```text
This advisory uses three different boundary concepts. They are related, but
they should not be collapsed into one idea.
```

### Unified diff

```diff
No text difference.
```

## claim_582676847955615c6264aaa11d8c23d7

Source: `docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-17`. Target: `docs/platform/component-boundary.md#unheaded-block-31`.

Mechanical class: Weak-exact. Source digest: `28a0a3648b70b5e53b3a987ba822ea55a92a6c480cae2b39be3c8c8ef0ed3eaa`. Target digest: `28a0a3648b70b5e53b3a987ba822ea55a92a6c480cae2b39be3c8c8ef0ed3eaa`.

Full shown source SHA256: `28a0a3648b70b5e53b3a987ba822ea55a92a6c480cae2b39be3c8c8ef0ed3eaa`. Full shown target SHA256: `28a0a3648b70b5e53b3a987ba822ea55a92a6c480cae2b39be3c8c8ef0ed3eaa`.

### Proposed decision

```json
{
  "claimId": "claim_582676847955615c6264aaa11d8c23d7",
  "sourceUnitDigest": "28a0a3648b70b5e53b3a987ba822ea55a92a6c480cae2b39be3c8c8ef0ed3eaa",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-31",
  "targetUnitDigest": "28a0a3648b70b5e53b3a987ba822ea55a92a6c480cae2b39be3c8c8ef0ed3eaa",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: component-boundary-advisory source carriage",
    "fgOS Component Boundary Advisory",
    "4. Boundary Vocabulary"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-17 (lines 93–97) into docs/platform/component-boundary.md#unheaded-block-31 (lines 190–194), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
| Concept | Question it answers | Use it for | Do not use it for |
|---|---|---|---|
| High-level component/module | How should the system be packaged so major parts can collaborate without becoming too fragmented? | Source/package/service grouping, implementation ownership, replacement strategy. | Deciding source of truth by itself. |
| Bounded context | Which model, vocabulary, and reason-to-change belong together? | Domain language, internal model boundaries, validation ownership, extension design. | Every small authority rule or helper function. |
| Authority boundary | Who is allowed to decide or write a specific piece of truth? | "Only X may", "must not bypass", state ownership, contract enforcement, false-success prevention. | Packaging every rule as a separate module. |
```

### Full target shown text

```text
| Concept | Question it answers | Use it for | Do not use it for |
|---|---|---|---|
| High-level component/module | How should the system be packaged so major parts can collaborate without becoming too fragmented? | Source/package/service grouping, implementation ownership, replacement strategy. | Deciding source of truth by itself. |
| Bounded context | Which model, vocabulary, and reason-to-change belong together? | Domain language, internal model boundaries, validation ownership, extension design. | Every small authority rule or helper function. |
| Authority boundary | Who is allowed to decide or write a specific piece of truth? | "Only X may", "must not bypass", state ownership, contract enforcement, false-success prevention. | Packaging every rule as a separate module. |
```

### Unified diff

```diff
No text difference.
```

## claim_1e8d9ed0c06e1735a8859fd26b5ba561

Source: `docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-18`. Target: `docs/platform/component-boundary.md#unheaded-block-32`.

Mechanical class: Weak-exact. Source digest: `9e8af87d9288e484a7a717c9795d5ed040f16b56d5a24b984d9fcc7a26b57577`. Target digest: `9e8af87d9288e484a7a717c9795d5ed040f16b56d5a24b984d9fcc7a26b57577`.

Full shown source SHA256: `9e8af87d9288e484a7a717c9795d5ed040f16b56d5a24b984d9fcc7a26b57577`. Full shown target SHA256: `9e8af87d9288e484a7a717c9795d5ed040f16b56d5a24b984d9fcc7a26b57577`.

### Proposed decision

```json
{
  "claimId": "claim_1e8d9ed0c06e1735a8859fd26b5ba561",
  "sourceUnitDigest": "9e8af87d9288e484a7a717c9795d5ed040f16b56d5a24b984d9fcc7a26b57577",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-32",
  "targetUnitDigest": "9e8af87d9288e484a7a717c9795d5ed040f16b56d5a24b984d9fcc7a26b57577",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: component-boundary-advisory source carriage",
    "fgOS Component Boundary Advisory",
    "4. Boundary Vocabulary"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ; source unit shorter than 40 characters. Carry the complete unheaded-block at docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-18 (lines 99–99) into docs/platform/component-boundary.md#unheaded-block-32 (lines 196–196), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
Practical reading rule:
```

### Full target shown text

```text
Practical reading rule:
```

### Unified diff

```diff
No text difference.
```

## claim_460efd60b6e51025fb94368dad1ef93d

Source: `docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-19`. Target: `docs/platform/component-boundary.md#unheaded-block-33`.

Mechanical class: Weak-exact. Source digest: `2cae11e68b1290299a20e70230fcaed27919fac50d0edbaf580a2791f1cb0b0d`. Target digest: `2cae11e68b1290299a20e70230fcaed27919fac50d0edbaf580a2791f1cb0b0d`.

Full shown source SHA256: `2cae11e68b1290299a20e70230fcaed27919fac50d0edbaf580a2791f1cb0b0d`. Full shown target SHA256: `2cae11e68b1290299a20e70230fcaed27919fac50d0edbaf580a2791f1cb0b0d`.

### Proposed decision

```json
{
  "claimId": "claim_460efd60b6e51025fb94368dad1ef93d",
  "sourceUnitDigest": "2cae11e68b1290299a20e70230fcaed27919fac50d0edbaf580a2791f1cb0b0d",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-33",
  "targetUnitDigest": "2cae11e68b1290299a20e70230fcaed27919fac50d0edbaf580a2791f1cb0b0d",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: component-boundary-advisory source carriage",
    "fgOS Component Boundary Advisory",
    "4. Boundary Vocabulary"
  ],
  "claimKind": "decision",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-19 (lines 101–105) into docs/platform/component-boundary.md#unheaded-block-33 (lines 198–202), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

````text
```txt
Use components to decide packaging.
Use bounded contexts to decide model and vocabulary.
Use authority boundaries to decide who can write truth or make a decision.
```
````

### Full target shown text

````text
```txt
Use components to decide packaging.
Use bounded contexts to decide model and vocabulary.
Use authority boundaries to decide who can write truth or make a decision.
```
````

### Unified diff

```diff
No text difference.
```

## claim_0468fd1a3fce3029f1ea242a13c9f46a

Source: `docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-20`. Target: `docs/platform/component-boundary.md#unheaded-block-34`.

Mechanical class: Weak-exact. Source digest: `2946d8be4ed11e89c5b9fc0211a851d0b294aa3a7fd383c538d180fd5634bf32`. Target digest: `2946d8be4ed11e89c5b9fc0211a851d0b294aa3a7fd383c538d180fd5634bf32`.

Full shown source SHA256: `2946d8be4ed11e89c5b9fc0211a851d0b294aa3a7fd383c538d180fd5634bf32`. Full shown target SHA256: `2946d8be4ed11e89c5b9fc0211a851d0b294aa3a7fd383c538d180fd5634bf32`.

### Proposed decision

```json
{
  "claimId": "claim_0468fd1a3fce3029f1ea242a13c9f46a",
  "sourceUnitDigest": "2946d8be4ed11e89c5b9fc0211a851d0b294aa3a7fd383c538d180fd5634bf32",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-34",
  "targetUnitDigest": "2946d8be4ed11e89c5b9fc0211a851d0b294aa3a7fd383c538d180fd5634bf32",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: component-boundary-advisory source carriage",
    "fgOS Component Boundary Advisory",
    "4. Boundary Vocabulary"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-20 (lines 107–113) into docs/platform/component-boundary.md#unheaded-block-34 (lines 204–210), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

````text
Example:

```txt
Dispatch And Execution Engine    = high-level component
Dispatch                         = bounded context inside that component
"Only dispatch creates DispatchPlan" = authority boundary
```
````

### Full target shown text

````text
Example:

```txt
Dispatch And Execution Engine    = high-level component
Dispatch                         = bounded context inside that component
"Only dispatch creates DispatchPlan" = authority boundary
```
````

### Unified diff

```diff
No text difference.
```

## claim_be53bec327318111b8b8b93a58f366bd

Source: `docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-21`. Target: `docs/platform/component-boundary.md#unheaded-block-35`.

Mechanical class: Weak-exact. Source digest: `45f67cf4091f5ed96a0ce91a95a3b6836dfbf94c5dbd622e955517017c22c04f`. Target digest: `45f67cf4091f5ed96a0ce91a95a3b6836dfbf94c5dbd622e955517017c22c04f`.

Full shown source SHA256: `45f67cf4091f5ed96a0ce91a95a3b6836dfbf94c5dbd622e955517017c22c04f`. Full shown target SHA256: `45f67cf4091f5ed96a0ce91a95a3b6836dfbf94c5dbd622e955517017c22c04f`.

### Proposed decision

```json
{
  "claimId": "claim_be53bec327318111b8b8b93a58f366bd",
  "sourceUnitDigest": "45f67cf4091f5ed96a0ce91a95a3b6836dfbf94c5dbd622e955517017c22c04f",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-35",
  "targetUnitDigest": "45f67cf4091f5ed96a0ce91a95a3b6836dfbf94c5dbd622e955517017c22c04f",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: component-boundary-advisory source carriage",
    "fgOS Component Boundary Advisory",
    "4. Boundary Vocabulary"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-21 (lines 115–121) into docs/platform/component-boundary.md#unheaded-block-35 (lines 212–218), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

````text
Another example:

```txt
Run Result Evaluator                         = high-level component
Run Result Evaluation                        = bounded context
"Only Run Result Evaluator computes confidence" = authority boundary
```
````

### Full target shown text

````text
Another example:

```txt
Run Result Evaluator                         = high-level component
Run Result Evaluation                        = bounded context
"Only Run Result Evaluator computes confidence" = authority boundary
```
````

### Unified diff

```diff
No text difference.
```

## claim_9e5d4af5736ee8ed729daba3843744af

Source: `docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-22`. Target: `docs/platform/component-boundary.md#unheaded-block-36`.

Mechanical class: Weak-exact. Source digest: `5122f358bb31e42999cf63d508fdb35108406dd5a412cfb92c5ce8e78afa735e`. Target digest: `5122f358bb31e42999cf63d508fdb35108406dd5a412cfb92c5ce8e78afa735e`.

Full shown source SHA256: `5122f358bb31e42999cf63d508fdb35108406dd5a412cfb92c5ce8e78afa735e`. Full shown target SHA256: `5122f358bb31e42999cf63d508fdb35108406dd5a412cfb92c5ce8e78afa735e`.

### Proposed decision

```json
{
  "claimId": "claim_9e5d4af5736ee8ed729daba3843744af",
  "sourceUnitDigest": "5122f358bb31e42999cf63d508fdb35108406dd5a412cfb92c5ce8e78afa735e",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-36",
  "targetUnitDigest": "5122f358bb31e42999cf63d508fdb35108406dd5a412cfb92c5ce8e78afa735e",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: component-boundary-advisory source carriage",
    "fgOS Component Boundary Advisory",
    "4. Boundary Vocabulary"
  ],
  "claimKind": "decision",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-22 (lines 123–125) into docs/platform/component-boundary.md#unheaded-block-36 (lines 220–222), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
An authority boundary may cross a module boundary. A module may call another
module to apply a decision, but it must not privately re-derive or overwrite
that module's authority.
```

### Full target shown text

```text
An authority boundary may cross a module boundary. A module may call another
module to apply a decision, but it must not privately re-derive or overwrite
that module's authority.
```

### Unified diff

```diff
No text difference.
```

## claim_ae69ca82e388b03292f8c25fe9c998c0

Source: `docs/architect/component-boundary/component-boundary-advisory.md#5-high-level-component-authority-register`. Target: `docs/platform/component-boundary.md#5-high-level-component-authority-register`.

Mechanical class: Judgment. Source digest: `2cf73fb7faa401dafde89b07119f4a5181bbe92232d67b936ecc5c068f602384`. Target digest: `5eb77ad16f6e0462b50d39b83e428a0ac9ecd6ef1fc37d2fea71eb929fe4af05`.

Full shown source SHA256: `084d9a47ec13bcd6d17555ea05b0bdce27012a18260a1efced0efda7cd264007`. Full shown target SHA256: `d4a07df41252f3ca433ceee3d08a6ff604587335351bb4ddb9c6d16aeb14a73f`.

### Proposed decision

```json
{
  "claimId": "claim_ae69ca82e388b03292f8c25fe9c998c0",
  "sourceUnitDigest": "2cf73fb7faa401dafde89b07119f4a5181bbe92232d67b936ecc5c068f602384",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "5-high-level-component-authority-register",
  "targetUnitDigest": "5eb77ad16f6e0462b50d39b83e428a0ac9ecd6ef1fc37d2fea71eb929fe4af05",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: component-boundary-advisory source carriage",
    "fgOS Component Boundary Advisory"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Judgment: no target digest match. Carry the complete heading at docs/architect/component-boundary/component-boundary-advisory.md#5-high-level-component-authority-register (lines 127–127) into docs/platform/component-boundary.md#5-high-level-component-authority-register (lines 224–224), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. Digest differences come only from the recorded candidate header/frontmatter fence, heading-level shift or physical relative-link rebasing; full before/after units and line mapping are in authoring accounting. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

````text
## 5. High-Level Component Authority Register

The lower-level boundaries below should not be mapped one-to-one into
top-level modules, services, or packages. That would make the implementation
too fragmented. They are a mix of bounded contexts and authority boundaries,
and should be grouped into a smaller set of practical components.

A component boundary can link to several documents because ownership is split
between product spec, architecture contract, and implementation reality. The
table below is the management view for the whole system.

| Component | Role | Internal boundaries | Owning / reference documents |
|---|---|---|---|
| Work Lifecycle Engine | fgOS component that owns domain-agnostic Work-unit management: item identity, status, stage, claim/return, related info, context, documents, questions, and Work verbs. It may use Agent Coordination for selected operations, but Agent Coordination never owns this lifecycle. | Work item state machine, domain-agnostic stage/status, claim/return ownership, related refs, context/document refs, human gates. | [Work-State Spec](../../specs/work-state.md), [Work Item Lifecycle Vision](../../work-item-lifecycle-vision.md), [System Overview](../../specs/system-overview.md) |
| Collaboration Patterns & Workflow Runner | Domain-neutral collaboration runtime (replaces retired Agent Coordination Engine per P4). Owns Workflow step DAG scheduling and small collaboration pattern loops (`solo`, `reviewed`, `panel`). | Workflow runner, Unit DAG scheduling, CollaborationPattern presets (`consult`, `research-fan-out`, `rfc`). | [Runner Spec](../../specs/runner.md), [Platform Component Boundary](../../platform/component-boundary.md) |
| Dispatch And Execution Engine | Governed execution of one approved Assignment. It chooses the allowed executor/provider/model/tier/mechanism and supervises the Run. | dispatch policy resolver, executor registry, governance/egress, DispatchPlan, Run creation, launch/timeout/cancel/retry, executor adapters. | [Runner Spec](../../specs/runner.md), [Dispatch Control Plane](../agent-coordination/architecture/dispatch-control-plane.md), [Assignment/Run/RunResult Contract](../agent-coordination/contracts/assignment-run-runresult.md) |
| Run Result Evaluator | Truth boundary for one Assignment Run. It turns the Assignment contract, Run settlement, worker claim, artifacts, and evidence into a RunResult confidence decision. | worker result parser, evidence collectors, freshness checks, artifact refs/store, confidence evaluator, RunResult normalizer. | [Evidence And Results](../agent-coordination/architecture/evidence-and-results.md), [Assignment/Run/RunResult Contract](../agent-coordination/contracts/assignment-run-runresult.md), [Runner Spec](../../specs/runner.md) |
| Domain Components And Extension Layer | Domain packages and smaller extension packages that use the engines while owning domain-specific behavior. A domain package may be large enough to have its own core and sub-workflows. | Coding Domain Component, Marketing Domain Component, Workflow definitions, TaskSpecs, Skills, domain harnesses, org policy/persona/tier preferences, evidence policy adapters. | [Domainization Architecture](../domainization/README.md), [System Overview](../../specs/system-overview.md), [Work Item Lifecycle Vision](../../work-item-lifecycle-vision.md), `domains/<domain>/AGENTS.md`, `domains/<domain>/manifest.yaml`, `domains/<domain>/workflows/` |
| Host And Surface Layer | Inbound/outbound surfaces and operator visibility. It translates CLI/API/plugin/dashboard/webhook/chat/Herdr interactions into calls against the engines, without becoming lifecycle or evidence truth. | CLI/API/plugin adapters, Herdr/dashboard visibility, host adapters, surface auth, command/API envelopes. | [fgOS Plugin Spec](../../specs/fgos-plugin.md), [Herdr Web Dashboard Spec](../../specs/herdr-web-dashboard.md), [Visibility And Herdr](../agent-coordination/architecture/visibility-and-herdr.md), [IO Contract](../../io-contract.md) |
| Setup, Doctor, And Distribution Health | Platform support component that owns install shape, config defaults, health checks, repair posture, and global/project precedence. | setup config merge, doctor check registry, distribution packaging, shell integration, dependency/default discoverability. | [Distribution Spec](../../specs/distribution.md), [Distribution Vision](../../distribution-vision.md), [Reading Map setup entries](../../specs/reading-map.md) |
| Knowledge, Learning, And Documentation Registry | Lifecycle-adjacent learning component that owns retrospective knowledge, doc/topic registry, end-user document indexing, trace, and evolve signals. | knowledge registry, doc registry, Diataxis index, item trace, friction/outcome learning, evolve candidates. | [Enduser Docs Authoring Spec](../../specs/enduser-docs-authoring.md), [Enduser Docs Index Spec](../../specs/enduser-docs-index.md), [System Overview](../../specs/system-overview.md) |

The collaboration shape should stay:

```txt
Host / Surface
  -> Work Lifecycle Engine
       owns Work lifecycle and may ask Agent Coordination to perform a legal
       operation
  -> Agent Coordination Engine
       can also run standalone without Work

Agent Coordination Engine
  -> Team Cognition Engine
       proposes cognitive strategy, roles, tasks, topology, and synthesis plan
  -> Dispatch And Execution Engine
       resolves and launches governed execution
  -> Run Result Evaluator
       normalizes RunResult, evidence, and confidence
  -> Work Lifecycle Engine
       returns evidence/recommendations only; Work verbs decide lifecycle

Domain Components And Extension Layer supplies domain workflow definitions,
protocol packages, domain harnesses, evidence policy adapters, and organization
policy through controlled ports.
```

Under this view, `Work Lifecycle Engine` is not an Agent Coordination submodule.
It is a sibling fgOS component that can consume Agent Coordination as an
execution/collaboration capability. It should stay domain-agnostic: marketing,
operations, coding, or another domain can use Work items to manage units of
work without inheriting coding-specific Git, worktree, merge, or technical
approval behavior.

The split is: the Work engine owns domain-agnostic work-unit lifecycle and
human gates; a domain extension owns domain-specific approval semantics,
resource isolation, branch/worktree behavior, and merge mechanics when that
domain needs them.

A Coding Domain Component is a high-level domain package, not a small
extension. Its job is to own coding-specific product and technical behavior
while consuming platform engines for generic lifecycle and collaboration.

Inside it, `Coding Domain Core`, `Coding Feature Workflow`, and `Bugfix
Workflow` are separate subcomponents. The core owns repository mechanics and
technical policy. The workflows own different coding work shapes. The component
uses Work Lifecycle Engine to manage Work units and Agent Coordination Engine to
run agent collaboration.

`Team Cognition Engine` is a major internal module of Agent Coordination
Engine, not a protocol package. Protocol packages are recipes/configuration.
The engine is the runtime reasoning component that consumes an objective,
session state, optional protocol definition, and domain/org constraints, then
proposes the next bounded coordination action.

`Run Result Evaluator` is not a generic verification harness. Its scope is
specific: evaluate the result of one Run for one Assignment. Domain-specific
evidence adapters may provide proof inputs, but the evaluator owns the final
RunResult confidence decision.
````

### Full target shown text

````text
#### 5. High-Level Component Authority Register

The lower-level boundaries below should not be mapped one-to-one into
top-level modules, services, or packages. That would make the implementation
too fragmented. They are a mix of bounded contexts and authority boundaries,
and should be grouped into a smaller set of practical components.

A component boundary can link to several documents because ownership is split
between product spec, architecture contract, and implementation reality. The
table below is the management view for the whole system.

| Component | Role | Internal boundaries | Owning / reference documents |
|---|---|---|---|
| Work Lifecycle Engine | fgOS component that owns domain-agnostic Work-unit management: item identity, status, stage, claim/return, related info, context, documents, questions, and Work verbs. It may use Agent Coordination for selected operations, but Agent Coordination never owns this lifecycle. | Work item state machine, domain-agnostic stage/status, claim/return ownership, related refs, context/document refs, human gates. | [Work-State Spec](../specs/work-state.md), [Work Item Lifecycle Vision](../work-item-lifecycle-vision.md), [System Overview](../specs/system-overview.md) |
| Collaboration Patterns & Workflow Runner | Domain-neutral collaboration runtime (replaces retired Agent Coordination Engine per P4). Owns Workflow step DAG scheduling and small collaboration pattern loops (`solo`, `reviewed`, `panel`). | Workflow runner, Unit DAG scheduling, CollaborationPattern presets (`consult`, `research-fan-out`, `rfc`). | [Runner Spec](../specs/runner.md), [Platform Component Boundary](component-boundary.md) |
| Dispatch And Execution Engine | Governed execution of one approved Assignment. It chooses the allowed executor/provider/model/tier/mechanism and supervises the Run. | dispatch policy resolver, executor registry, governance/egress, DispatchPlan, Run creation, launch/timeout/cancel/retry, executor adapters. | [Runner Spec](../specs/runner.md), [Dispatch Control Plane](../architect/agent-coordination/architecture/dispatch-control-plane.md), [Assignment/Run/RunResult Contract](../architect/agent-coordination/contracts/assignment-run-runresult.md) |
| Run Result Evaluator | Truth boundary for one Assignment Run. It turns the Assignment contract, Run settlement, worker claim, artifacts, and evidence into a RunResult confidence decision. | worker result parser, evidence collectors, freshness checks, artifact refs/store, confidence evaluator, RunResult normalizer. | [Evidence And Results](../architect/agent-coordination/architecture/evidence-and-results.md), [Assignment/Run/RunResult Contract](../architect/agent-coordination/contracts/assignment-run-runresult.md), [Runner Spec](../specs/runner.md) |
| Domain Components And Extension Layer | Domain packages and smaller extension packages that use the engines while owning domain-specific behavior. A domain package may be large enough to have its own core and sub-workflows. | Coding Domain Component, Marketing Domain Component, Workflow definitions, TaskSpecs, Skills, domain harnesses, org policy/persona/tier preferences, evidence policy adapters. | [Domainization Architecture](../architect/domainization/README.md), [System Overview](../specs/system-overview.md), [Work Item Lifecycle Vision](../work-item-lifecycle-vision.md), `domains/<domain>/AGENTS.md`, `domains/<domain>/manifest.yaml`, `domains/<domain>/workflows/` |
| Host And Surface Layer | Inbound/outbound surfaces and operator visibility. It translates CLI/API/plugin/dashboard/webhook/chat/Herdr interactions into calls against the engines, without becoming lifecycle or evidence truth. | CLI/API/plugin adapters, Herdr/dashboard visibility, host adapters, surface auth, command/API envelopes. | [fgOS Plugin Spec](../specs/fgos-plugin.md), [Herdr Web Dashboard Spec](../specs/herdr-web-dashboard.md), [Visibility And Herdr](../architect/agent-coordination/architecture/visibility-and-herdr.md), [IO Contract](../io-contract.md) |
| Setup, Doctor, And Distribution Health | Platform support component that owns install shape, config defaults, health checks, repair posture, and global/project precedence. | setup config merge, doctor check registry, distribution packaging, shell integration, dependency/default discoverability. | [Distribution Spec](../specs/distribution.md), [Distribution Vision](../distribution-vision.md), [Reading Map setup entries](../specs/reading-map.md) |
| Knowledge, Learning, And Documentation Registry | Lifecycle-adjacent learning component that owns retrospective knowledge, doc/topic registry, end-user document indexing, trace, and evolve signals. | knowledge registry, doc registry, Diataxis index, item trace, friction/outcome learning, evolve candidates. | [Enduser Docs Authoring Spec](../specs/enduser-docs-authoring.md), [Enduser Docs Index Spec](../specs/enduser-docs-index.md), [System Overview](../specs/system-overview.md) |

The collaboration shape should stay:

```txt
Host / Surface
  -> Work Lifecycle Engine
       owns Work lifecycle and may ask Agent Coordination to perform a legal
       operation
  -> Agent Coordination Engine
       can also run standalone without Work

Agent Coordination Engine
  -> Team Cognition Engine
       proposes cognitive strategy, roles, tasks, topology, and synthesis plan
  -> Dispatch And Execution Engine
       resolves and launches governed execution
  -> Run Result Evaluator
       normalizes RunResult, evidence, and confidence
  -> Work Lifecycle Engine
       returns evidence/recommendations only; Work verbs decide lifecycle

Domain Components And Extension Layer supplies domain workflow definitions,
protocol packages, domain harnesses, evidence policy adapters, and organization
policy through controlled ports.
```

Under this view, `Work Lifecycle Engine` is not an Agent Coordination submodule.
It is a sibling fgOS component that can consume Agent Coordination as an
execution/collaboration capability. It should stay domain-agnostic: marketing,
operations, coding, or another domain can use Work items to manage units of
work without inheriting coding-specific Git, worktree, merge, or technical
approval behavior.

The split is: the Work engine owns domain-agnostic work-unit lifecycle and
human gates; a domain extension owns domain-specific approval semantics,
resource isolation, branch/worktree behavior, and merge mechanics when that
domain needs them.

A Coding Domain Component is a high-level domain package, not a small
extension. Its job is to own coding-specific product and technical behavior
while consuming platform engines for generic lifecycle and collaboration.

Inside it, `Coding Domain Core`, `Coding Feature Workflow`, and `Bugfix
Workflow` are separate subcomponents. The core owns repository mechanics and
technical policy. The workflows own different coding work shapes. The component
uses Work Lifecycle Engine to manage Work units and Agent Coordination Engine to
run agent collaboration.

`Team Cognition Engine` is a major internal module of Agent Coordination
Engine, not a protocol package. Protocol packages are recipes/configuration.
The engine is the runtime reasoning component that consumes an objective,
session state, optional protocol definition, and domain/org constraints, then
proposes the next bounded coordination action.

`Run Result Evaluator` is not a generic verification harness. Its scope is
specific: evaluate the result of one Run for one Assignment. Domain-specific
evidence adapters may provide proof inputs, but the evaluator owns the final
RunResult confidence decision.
````

### Unified diff

```diff
--- docs/architect/component-boundary/component-boundary-advisory.md#5-high-level-component-authority-register
+++ docs/platform/component-boundary.md#5-high-level-component-authority-register
@@ -1,4 +1,4 @@
-## 5. High-Level Component Authority Register
+#### 5. High-Level Component Authority Register
 
 The lower-level boundaries below should not be mapped one-to-one into
 top-level modules, services, or packages. That would make the implementation
@@ -11,14 +11,14 @@
 
 | Component | Role | Internal boundaries | Owning / reference documents |
 |---|---|---|---|
-| Work Lifecycle Engine | fgOS component that owns domain-agnostic Work-unit management: item identity, status, stage, claim/return, related info, context, documents, questions, and Work verbs. It may use Agent Coordination for selected operations, but Agent Coordination never owns this lifecycle. | Work item state machine, domain-agnostic stage/status, claim/return ownership, related refs, context/document refs, human gates. | [Work-State Spec](../../specs/work-state.md), [Work Item Lifecycle Vision](../../work-item-lifecycle-vision.md), [System Overview](../../specs/system-overview.md) |
-| Collaboration Patterns & Workflow Runner | Domain-neutral collaboration runtime (replaces retired Agent Coordination Engine per P4). Owns Workflow step DAG scheduling and small collaboration pattern loops (`solo`, `reviewed`, `panel`). | Workflow runner, Unit DAG scheduling, CollaborationPattern presets (`consult`, `research-fan-out`, `rfc`). | [Runner Spec](../../specs/runner.md), [Platform Component Boundary](../../platform/component-boundary.md) |
-| Dispatch And Execution Engine | Governed execution of one approved Assignment. It chooses the allowed executor/provider/model/tier/mechanism and supervises the Run. | dispatch policy resolver, executor registry, governance/egress, DispatchPlan, Run creation, launch/timeout/cancel/retry, executor adapters. | [Runner Spec](../../specs/runner.md), [Dispatch Control Plane](../agent-coordination/architecture/dispatch-control-plane.md), [Assignment/Run/RunResult Contract](../agent-coordination/contracts/assignment-run-runresult.md) |
-| Run Result Evaluator | Truth boundary for one Assignment Run. It turns the Assignment contract, Run settlement, worker claim, artifacts, and evidence into a RunResult confidence decision. | worker result parser, evidence collectors, freshness checks, artifact refs/store, confidence evaluator, RunResult normalizer. | [Evidence And Results](../agent-coordination/architecture/evidence-and-results.md), [Assignment/Run/RunResult Contract](../agent-coordination/contracts/assignment-run-runresult.md), [Runner Spec](../../specs/runner.md) |
-| Domain Components And Extension Layer | Domain packages and smaller extension packages that use the engines while owning domain-specific behavior. A domain package may be large enough to have its own core and sub-workflows. | Coding Domain Component, Marketing Domain Component, Workflow definitions, TaskSpecs, Skills, domain harnesses, org policy/persona/tier preferences, evidence policy adapters. | [Domainization Architecture](../domainization/README.md), [System Overview](../../specs/system-overview.md), [Work Item Lifecycle Vision](../../work-item-lifecycle-vision.md), `domains/<domain>/AGENTS.md`, `domains/<domain>/manifest.yaml`, `domains/<domain>/workflows/` |
-| Host And Surface Layer | Inbound/outbound surfaces and operator visibility. It translates CLI/API/plugin/dashboard/webhook/chat/Herdr interactions into calls against the engines, without becoming lifecycle or evidence truth. | CLI/API/plugin adapters, Herdr/dashboard visibility, host adapters, surface auth, command/API envelopes. | [fgOS Plugin Spec](../../specs/fgos-plugin.md), [Herdr Web Dashboard Spec](../../specs/herdr-web-dashboard.md), [Visibility And Herdr](../agent-coordination/architecture/visibility-and-herdr.md), [IO Contract](../../io-contract.md) |
-| Setup, Doctor, And Distribution Health | Platform support component that owns install shape, config defaults, health checks, repair posture, and global/project precedence. | setup config merge, doctor check registry, distribution packaging, shell integration, dependency/default discoverability. | [Distribution Spec](../../specs/distribution.md), [Distribution Vision](../../distribution-vision.md), [Reading Map setup entries](../../specs/reading-map.md) |
-| Knowledge, Learning, And Documentation Registry | Lifecycle-adjacent learning component that owns retrospective knowledge, doc/topic registry, end-user document indexing, trace, and evolve signals. | knowledge registry, doc registry, Diataxis index, item trace, friction/outcome learning, evolve candidates. | [Enduser Docs Authoring Spec](../../specs/enduser-docs-authoring.md), [Enduser Docs Index Spec](../../specs/enduser-docs-index.md), [System Overview](../../specs/system-overview.md) |
+| Work Lifecycle Engine | fgOS component that owns domain-agnostic Work-unit management: item identity, status, stage, claim/return, related info, context, documents, questions, and Work verbs. It may use Agent Coordination for selected operations, but Agent Coordination never owns this lifecycle. | Work item state machine, domain-agnostic stage/status, claim/return ownership, related refs, context/document refs, human gates. | [Work-State Spec](../specs/work-state.md), [Work Item Lifecycle Vision](../work-item-lifecycle-vision.md), [System Overview](../specs/system-overview.md) |
+| Collaboration Patterns & Workflow Runner | Domain-neutral collaboration runtime (replaces retired Agent Coordination Engine per P4). Owns Workflow step DAG scheduling and small collaboration pattern loops (`solo`, `reviewed`, `panel`). | Workflow runner, Unit DAG scheduling, CollaborationPattern presets (`consult`, `research-fan-out`, `rfc`). | [Runner Spec](../specs/runner.md), [Platform Component Boundary](component-boundary.md) |
+| Dispatch And Execution Engine | Governed execution of one approved Assignment. It chooses the allowed executor/provider/model/tier/mechanism and supervises the Run. | dispatch policy resolver, executor registry, governance/egress, DispatchPlan, Run creation, launch/timeout/cancel/retry, executor adapters. | [Runner Spec](../specs/runner.md), [Dispatch Control Plane](../architect/agent-coordination/architecture/dispatch-control-plane.md), [Assignment/Run/RunResult Contract](../architect/agent-coordination/contracts/assignment-run-runresult.md) |
+| Run Result Evaluator | Truth boundary for one Assignment Run. It turns the Assignment contract, Run settlement, worker claim, artifacts, and evidence into a RunResult confidence decision. | worker result parser, evidence collectors, freshness checks, artifact refs/store, confidence evaluator, RunResult normalizer. | [Evidence And Results](../architect/agent-coordination/architecture/evidence-and-results.md), [Assignment/Run/RunResult Contract](../architect/agent-coordination/contracts/assignment-run-runresult.md), [Runner Spec](../specs/runner.md) |
+| Domain Components And Extension Layer | Domain packages and smaller extension packages that use the engines while owning domain-specific behavior. A domain package may be large enough to have its own core and sub-workflows. | Coding Domain Component, Marketing Domain Component, Workflow definitions, TaskSpecs, Skills, domain harnesses, org policy/persona/tier preferences, evidence policy adapters. | [Domainization Architecture](../architect/domainization/README.md), [System Overview](../specs/system-overview.md), [Work Item Lifecycle Vision](../work-item-lifecycle-vision.md), `domains/<domain>/AGENTS.md`, `domains/<domain>/manifest.yaml`, `domains/<domain>/workflows/` |
+| Host And Surface Layer | Inbound/outbound surfaces and operator visibility. It translates CLI/API/plugin/dashboard/webhook/chat/Herdr interactions into calls against the engines, without becoming lifecycle or evidence truth. | CLI/API/plugin adapters, Herdr/dashboard visibility, host adapters, surface auth, command/API envelopes. | [fgOS Plugin Spec](../specs/fgos-plugin.md), [Herdr Web Dashboard Spec](../specs/herdr-web-dashboard.md), [Visibility And Herdr](../architect/agent-coordination/architecture/visibility-and-herdr.md), [IO Contract](../io-contract.md) |
+| Setup, Doctor, And Distribution Health | Platform support component that owns install shape, config defaults, health checks, repair posture, and global/project precedence. | setup config merge, doctor check registry, distribution packaging, shell integration, dependency/default discoverability. | [Distribution Spec](../specs/distribution.md), [Distribution Vision](../distribution-vision.md), [Reading Map setup entries](../specs/reading-map.md) |
+| Knowledge, Learning, And Documentation Registry | Lifecycle-adjacent learning component that owns retrospective knowledge, doc/topic registry, end-user document indexing, trace, and evolve signals. | knowledge registry, doc registry, Diataxis index, item trace, friction/outcome learning, evolve candidates. | [Enduser Docs Authoring Spec](../specs/enduser-docs-authoring.md), [Enduser Docs Index Spec](../specs/enduser-docs-index.md), [System Overview](../specs/system-overview.md) |
 
 The collaboration shape should stay:
 

```

## claim_aac411c433a46e14d6964975230acbb0

Source: `docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-23`. Target: `docs/platform/component-boundary.md#unheaded-block-37`.

Mechanical class: Weak-exact. Source digest: `7cb40f48a17a3f179d8bf58fd03d67ead3d86aa57776986f4130c297fa881056`. Target digest: `7cb40f48a17a3f179d8bf58fd03d67ead3d86aa57776986f4130c297fa881056`.

Full shown source SHA256: `7cb40f48a17a3f179d8bf58fd03d67ead3d86aa57776986f4130c297fa881056`. Full shown target SHA256: `7cb40f48a17a3f179d8bf58fd03d67ead3d86aa57776986f4130c297fa881056`.

### Proposed decision

```json
{
  "claimId": "claim_aac411c433a46e14d6964975230acbb0",
  "sourceUnitDigest": "7cb40f48a17a3f179d8bf58fd03d67ead3d86aa57776986f4130c297fa881056",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-37",
  "targetUnitDigest": "7cb40f48a17a3f179d8bf58fd03d67ead3d86aa57776986f4130c297fa881056",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: component-boundary-advisory source carriage",
    "fgOS Component Boundary Advisory",
    "5. High-Level Component Authority Register"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-23 (lines 129–132) into docs/platform/component-boundary.md#unheaded-block-37 (lines 226–229), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
The lower-level boundaries below should not be mapped one-to-one into
top-level modules, services, or packages. That would make the implementation
too fragmented. They are a mix of bounded contexts and authority boundaries,
and should be grouped into a smaller set of practical components.
```

### Full target shown text

```text
The lower-level boundaries below should not be mapped one-to-one into
top-level modules, services, or packages. That would make the implementation
too fragmented. They are a mix of bounded contexts and authority boundaries,
and should be grouped into a smaller set of practical components.
```

### Unified diff

```diff
No text difference.
```

## claim_f978aaa99374cdd888b78ce0c6bc1c56

Source: `docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-24`. Target: `docs/platform/component-boundary.md#unheaded-block-38`.

Mechanical class: Weak-exact. Source digest: `cf6e54194d2c0af4e35d51e88bc596a5ded47f6aed5511d07369e986a047cf6f`. Target digest: `cf6e54194d2c0af4e35d51e88bc596a5ded47f6aed5511d07369e986a047cf6f`.

Full shown source SHA256: `cf6e54194d2c0af4e35d51e88bc596a5ded47f6aed5511d07369e986a047cf6f`. Full shown target SHA256: `cf6e54194d2c0af4e35d51e88bc596a5ded47f6aed5511d07369e986a047cf6f`.

### Proposed decision

```json
{
  "claimId": "claim_f978aaa99374cdd888b78ce0c6bc1c56",
  "sourceUnitDigest": "cf6e54194d2c0af4e35d51e88bc596a5ded47f6aed5511d07369e986a047cf6f",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-38",
  "targetUnitDigest": "cf6e54194d2c0af4e35d51e88bc596a5ded47f6aed5511d07369e986a047cf6f",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: component-boundary-advisory source carriage",
    "fgOS Component Boundary Advisory",
    "5. High-Level Component Authority Register"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-24 (lines 134–136) into docs/platform/component-boundary.md#unheaded-block-38 (lines 231–233), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
A component boundary can link to several documents because ownership is split
between product spec, architecture contract, and implementation reality. The
table below is the management view for the whole system.
```

### Full target shown text

```text
A component boundary can link to several documents because ownership is split
between product spec, architecture contract, and implementation reality. The
table below is the management view for the whole system.
```

### Unified diff

```diff
No text difference.
```

## claim_ab73231bdd37667748e73f92da406a7b

Source: `docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-25`. Target: `docs/platform/component-boundary.md#unheaded-block-39`.

Mechanical class: Judgment. Source digest: `9819ff097e5460c144503f4feb1ee09463529060b03882c2deafe01fb9ebe148`. Target digest: `34c525efcf0ba3c78a5c597ee3171e727708b425b32c3e0ad22b06335b212324`.

Full shown source SHA256: `9819ff097e5460c144503f4feb1ee09463529060b03882c2deafe01fb9ebe148`. Full shown target SHA256: `34c525efcf0ba3c78a5c597ee3171e727708b425b32c3e0ad22b06335b212324`.

### Proposed decision

```json
{
  "claimId": "claim_ab73231bdd37667748e73f92da406a7b",
  "sourceUnitDigest": "9819ff097e5460c144503f4feb1ee09463529060b03882c2deafe01fb9ebe148",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-39",
  "targetUnitDigest": "34c525efcf0ba3c78a5c597ee3171e727708b425b32c3e0ad22b06335b212324",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: component-boundary-advisory source carriage",
    "fgOS Component Boundary Advisory",
    "5. High-Level Component Authority Register"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Judgment: no target digest match. Carry the complete unheaded-block at docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-25 (lines 138–147) into docs/platform/component-boundary.md#unheaded-block-39 (lines 235–244), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. Digest differences come only from the recorded candidate header/frontmatter fence, heading-level shift or physical relative-link rebasing; full before/after units and line mapping are in authoring accounting. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
| Component | Role | Internal boundaries | Owning / reference documents |
|---|---|---|---|
| Work Lifecycle Engine | fgOS component that owns domain-agnostic Work-unit management: item identity, status, stage, claim/return, related info, context, documents, questions, and Work verbs. It may use Agent Coordination for selected operations, but Agent Coordination never owns this lifecycle. | Work item state machine, domain-agnostic stage/status, claim/return ownership, related refs, context/document refs, human gates. | [Work-State Spec](../../specs/work-state.md), [Work Item Lifecycle Vision](../../work-item-lifecycle-vision.md), [System Overview](../../specs/system-overview.md) |
| Collaboration Patterns & Workflow Runner | Domain-neutral collaboration runtime (replaces retired Agent Coordination Engine per P4). Owns Workflow step DAG scheduling and small collaboration pattern loops (`solo`, `reviewed`, `panel`). | Workflow runner, Unit DAG scheduling, CollaborationPattern presets (`consult`, `research-fan-out`, `rfc`). | [Runner Spec](../../specs/runner.md), [Platform Component Boundary](../../platform/component-boundary.md) |
| Dispatch And Execution Engine | Governed execution of one approved Assignment. It chooses the allowed executor/provider/model/tier/mechanism and supervises the Run. | dispatch policy resolver, executor registry, governance/egress, DispatchPlan, Run creation, launch/timeout/cancel/retry, executor adapters. | [Runner Spec](../../specs/runner.md), [Dispatch Control Plane](../agent-coordination/architecture/dispatch-control-plane.md), [Assignment/Run/RunResult Contract](../agent-coordination/contracts/assignment-run-runresult.md) |
| Run Result Evaluator | Truth boundary for one Assignment Run. It turns the Assignment contract, Run settlement, worker claim, artifacts, and evidence into a RunResult confidence decision. | worker result parser, evidence collectors, freshness checks, artifact refs/store, confidence evaluator, RunResult normalizer. | [Evidence And Results](../agent-coordination/architecture/evidence-and-results.md), [Assignment/Run/RunResult Contract](../agent-coordination/contracts/assignment-run-runresult.md), [Runner Spec](../../specs/runner.md) |
| Domain Components And Extension Layer | Domain packages and smaller extension packages that use the engines while owning domain-specific behavior. A domain package may be large enough to have its own core and sub-workflows. | Coding Domain Component, Marketing Domain Component, Workflow definitions, TaskSpecs, Skills, domain harnesses, org policy/persona/tier preferences, evidence policy adapters. | [Domainization Architecture](../domainization/README.md), [System Overview](../../specs/system-overview.md), [Work Item Lifecycle Vision](../../work-item-lifecycle-vision.md), `domains/<domain>/AGENTS.md`, `domains/<domain>/manifest.yaml`, `domains/<domain>/workflows/` |
| Host And Surface Layer | Inbound/outbound surfaces and operator visibility. It translates CLI/API/plugin/dashboard/webhook/chat/Herdr interactions into calls against the engines, without becoming lifecycle or evidence truth. | CLI/API/plugin adapters, Herdr/dashboard visibility, host adapters, surface auth, command/API envelopes. | [fgOS Plugin Spec](../../specs/fgos-plugin.md), [Herdr Web Dashboard Spec](../../specs/herdr-web-dashboard.md), [Visibility And Herdr](../agent-coordination/architecture/visibility-and-herdr.md), [IO Contract](../../io-contract.md) |
| Setup, Doctor, And Distribution Health | Platform support component that owns install shape, config defaults, health checks, repair posture, and global/project precedence. | setup config merge, doctor check registry, distribution packaging, shell integration, dependency/default discoverability. | [Distribution Spec](../../specs/distribution.md), [Distribution Vision](../../distribution-vision.md), [Reading Map setup entries](../../specs/reading-map.md) |
| Knowledge, Learning, And Documentation Registry | Lifecycle-adjacent learning component that owns retrospective knowledge, doc/topic registry, end-user document indexing, trace, and evolve signals. | knowledge registry, doc registry, Diataxis index, item trace, friction/outcome learning, evolve candidates. | [Enduser Docs Authoring Spec](../../specs/enduser-docs-authoring.md), [Enduser Docs Index Spec](../../specs/enduser-docs-index.md), [System Overview](../../specs/system-overview.md) |
```

### Full target shown text

```text
| Component | Role | Internal boundaries | Owning / reference documents |
|---|---|---|---|
| Work Lifecycle Engine | fgOS component that owns domain-agnostic Work-unit management: item identity, status, stage, claim/return, related info, context, documents, questions, and Work verbs. It may use Agent Coordination for selected operations, but Agent Coordination never owns this lifecycle. | Work item state machine, domain-agnostic stage/status, claim/return ownership, related refs, context/document refs, human gates. | [Work-State Spec](../specs/work-state.md), [Work Item Lifecycle Vision](../work-item-lifecycle-vision.md), [System Overview](../specs/system-overview.md) |
| Collaboration Patterns & Workflow Runner | Domain-neutral collaboration runtime (replaces retired Agent Coordination Engine per P4). Owns Workflow step DAG scheduling and small collaboration pattern loops (`solo`, `reviewed`, `panel`). | Workflow runner, Unit DAG scheduling, CollaborationPattern presets (`consult`, `research-fan-out`, `rfc`). | [Runner Spec](../specs/runner.md), [Platform Component Boundary](component-boundary.md) |
| Dispatch And Execution Engine | Governed execution of one approved Assignment. It chooses the allowed executor/provider/model/tier/mechanism and supervises the Run. | dispatch policy resolver, executor registry, governance/egress, DispatchPlan, Run creation, launch/timeout/cancel/retry, executor adapters. | [Runner Spec](../specs/runner.md), [Dispatch Control Plane](../architect/agent-coordination/architecture/dispatch-control-plane.md), [Assignment/Run/RunResult Contract](../architect/agent-coordination/contracts/assignment-run-runresult.md) |
| Run Result Evaluator | Truth boundary for one Assignment Run. It turns the Assignment contract, Run settlement, worker claim, artifacts, and evidence into a RunResult confidence decision. | worker result parser, evidence collectors, freshness checks, artifact refs/store, confidence evaluator, RunResult normalizer. | [Evidence And Results](../architect/agent-coordination/architecture/evidence-and-results.md), [Assignment/Run/RunResult Contract](../architect/agent-coordination/contracts/assignment-run-runresult.md), [Runner Spec](../specs/runner.md) |
| Domain Components And Extension Layer | Domain packages and smaller extension packages that use the engines while owning domain-specific behavior. A domain package may be large enough to have its own core and sub-workflows. | Coding Domain Component, Marketing Domain Component, Workflow definitions, TaskSpecs, Skills, domain harnesses, org policy/persona/tier preferences, evidence policy adapters. | [Domainization Architecture](../architect/domainization/README.md), [System Overview](../specs/system-overview.md), [Work Item Lifecycle Vision](../work-item-lifecycle-vision.md), `domains/<domain>/AGENTS.md`, `domains/<domain>/manifest.yaml`, `domains/<domain>/workflows/` |
| Host And Surface Layer | Inbound/outbound surfaces and operator visibility. It translates CLI/API/plugin/dashboard/webhook/chat/Herdr interactions into calls against the engines, without becoming lifecycle or evidence truth. | CLI/API/plugin adapters, Herdr/dashboard visibility, host adapters, surface auth, command/API envelopes. | [fgOS Plugin Spec](../specs/fgos-plugin.md), [Herdr Web Dashboard Spec](../specs/herdr-web-dashboard.md), [Visibility And Herdr](../architect/agent-coordination/architecture/visibility-and-herdr.md), [IO Contract](../io-contract.md) |
| Setup, Doctor, And Distribution Health | Platform support component that owns install shape, config defaults, health checks, repair posture, and global/project precedence. | setup config merge, doctor check registry, distribution packaging, shell integration, dependency/default discoverability. | [Distribution Spec](../specs/distribution.md), [Distribution Vision](../distribution-vision.md), [Reading Map setup entries](../specs/reading-map.md) |
| Knowledge, Learning, And Documentation Registry | Lifecycle-adjacent learning component that owns retrospective knowledge, doc/topic registry, end-user document indexing, trace, and evolve signals. | knowledge registry, doc registry, Diataxis index, item trace, friction/outcome learning, evolve candidates. | [Enduser Docs Authoring Spec](../specs/enduser-docs-authoring.md), [Enduser Docs Index Spec](../specs/enduser-docs-index.md), [System Overview](../specs/system-overview.md) |
```

### Unified diff

```diff
--- docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-25
+++ docs/platform/component-boundary.md#unheaded-block-39
@@ -1,10 +1,10 @@
 | Component | Role | Internal boundaries | Owning / reference documents |
 |---|---|---|---|
-| Work Lifecycle Engine | fgOS component that owns domain-agnostic Work-unit management: item identity, status, stage, claim/return, related info, context, documents, questions, and Work verbs. It may use Agent Coordination for selected operations, but Agent Coordination never owns this lifecycle. | Work item state machine, domain-agnostic stage/status, claim/return ownership, related refs, context/document refs, human gates. | [Work-State Spec](../../specs/work-state.md), [Work Item Lifecycle Vision](../../work-item-lifecycle-vision.md), [System Overview](../../specs/system-overview.md) |
-| Collaboration Patterns & Workflow Runner | Domain-neutral collaboration runtime (replaces retired Agent Coordination Engine per P4). Owns Workflow step DAG scheduling and small collaboration pattern loops (`solo`, `reviewed`, `panel`). | Workflow runner, Unit DAG scheduling, CollaborationPattern presets (`consult`, `research-fan-out`, `rfc`). | [Runner Spec](../../specs/runner.md), [Platform Component Boundary](../../platform/component-boundary.md) |
-| Dispatch And Execution Engine | Governed execution of one approved Assignment. It chooses the allowed executor/provider/model/tier/mechanism and supervises the Run. | dispatch policy resolver, executor registry, governance/egress, DispatchPlan, Run creation, launch/timeout/cancel/retry, executor adapters. | [Runner Spec](../../specs/runner.md), [Dispatch Control Plane](../agent-coordination/architecture/dispatch-control-plane.md), [Assignment/Run/RunResult Contract](../agent-coordination/contracts/assignment-run-runresult.md) |
-| Run Result Evaluator | Truth boundary for one Assignment Run. It turns the Assignment contract, Run settlement, worker claim, artifacts, and evidence into a RunResult confidence decision. | worker result parser, evidence collectors, freshness checks, artifact refs/store, confidence evaluator, RunResult normalizer. | [Evidence And Results](../agent-coordination/architecture/evidence-and-results.md), [Assignment/Run/RunResult Contract](../agent-coordination/contracts/assignment-run-runresult.md), [Runner Spec](../../specs/runner.md) |
-| Domain Components And Extension Layer | Domain packages and smaller extension packages that use the engines while owning domain-specific behavior. A domain package may be large enough to have its own core and sub-workflows. | Coding Domain Component, Marketing Domain Component, Workflow definitions, TaskSpecs, Skills, domain harnesses, org policy/persona/tier preferences, evidence policy adapters. | [Domainization Architecture](../domainization/README.md), [System Overview](../../specs/system-overview.md), [Work Item Lifecycle Vision](../../work-item-lifecycle-vision.md), `domains/<domain>/AGENTS.md`, `domains/<domain>/manifest.yaml`, `domains/<domain>/workflows/` |
-| Host And Surface Layer | Inbound/outbound surfaces and operator visibility. It translates CLI/API/plugin/dashboard/webhook/chat/Herdr interactions into calls against the engines, without becoming lifecycle or evidence truth. | CLI/API/plugin adapters, Herdr/dashboard visibility, host adapters, surface auth, command/API envelopes. | [fgOS Plugin Spec](../../specs/fgos-plugin.md), [Herdr Web Dashboard Spec](../../specs/herdr-web-dashboard.md), [Visibility And Herdr](../agent-coordination/architecture/visibility-and-herdr.md), [IO Contract](../../io-contract.md) |
-| Setup, Doctor, And Distribution Health | Platform support component that owns install shape, config defaults, health checks, repair posture, and global/project precedence. | setup config merge, doctor check registry, distribution packaging, shell integration, dependency/default discoverability. | [Distribution Spec](../../specs/distribution.md), [Distribution Vision](../../distribution-vision.md), [Reading Map setup entries](../../specs/reading-map.md) |
-| Knowledge, Learning, And Documentation Registry | Lifecycle-adjacent learning component that owns retrospective knowledge, doc/topic registry, end-user document indexing, trace, and evolve signals. | knowledge registry, doc registry, Diataxis index, item trace, friction/outcome learning, evolve candidates. | [Enduser Docs Authoring Spec](../../specs/enduser-docs-authoring.md), [Enduser Docs Index Spec](../../specs/enduser-docs-index.md), [System Overview](../../specs/system-overview.md) |
+| Work Lifecycle Engine | fgOS component that owns domain-agnostic Work-unit management: item identity, status, stage, claim/return, related info, context, documents, questions, and Work verbs. It may use Agent Coordination for selected operations, but Agent Coordination never owns this lifecycle. | Work item state machine, domain-agnostic stage/status, claim/return ownership, related refs, context/document refs, human gates. | [Work-State Spec](../specs/work-state.md), [Work Item Lifecycle Vision](../work-item-lifecycle-vision.md), [System Overview](../specs/system-overview.md) |
+| Collaboration Patterns & Workflow Runner | Domain-neutral collaboration runtime (replaces retired Agent Coordination Engine per P4). Owns Workflow step DAG scheduling and small collaboration pattern loops (`solo`, `reviewed`, `panel`). | Workflow runner, Unit DAG scheduling, CollaborationPattern presets (`consult`, `research-fan-out`, `rfc`). | [Runner Spec](../specs/runner.md), [Platform Component Boundary](component-boundary.md) |
+| Dispatch And Execution Engine | Governed execution of one approved Assignment. It chooses the allowed executor/provider/model/tier/mechanism and supervises the Run. | dispatch policy resolver, executor registry, governance/egress, DispatchPlan, Run creation, launch/timeout/cancel/retry, executor adapters. | [Runner Spec](../specs/runner.md), [Dispatch Control Plane](../architect/agent-coordination/architecture/dispatch-control-plane.md), [Assignment/Run/RunResult Contract](../architect/agent-coordination/contracts/assignment-run-runresult.md) |
+| Run Result Evaluator | Truth boundary for one Assignment Run. It turns the Assignment contract, Run settlement, worker claim, artifacts, and evidence into a RunResult confidence decision. | worker result parser, evidence collectors, freshness checks, artifact refs/store, confidence evaluator, RunResult normalizer. | [Evidence And Results](../architect/agent-coordination/architecture/evidence-and-results.md), [Assignment/Run/RunResult Contract](../architect/agent-coordination/contracts/assignment-run-runresult.md), [Runner Spec](../specs/runner.md) |
+| Domain Components And Extension Layer | Domain packages and smaller extension packages that use the engines while owning domain-specific behavior. A domain package may be large enough to have its own core and sub-workflows. | Coding Domain Component, Marketing Domain Component, Workflow definitions, TaskSpecs, Skills, domain harnesses, org policy/persona/tier preferences, evidence policy adapters. | [Domainization Architecture](../architect/domainization/README.md), [System Overview](../specs/system-overview.md), [Work Item Lifecycle Vision](../work-item-lifecycle-vision.md), `domains/<domain>/AGENTS.md`, `domains/<domain>/manifest.yaml`, `domains/<domain>/workflows/` |
+| Host And Surface Layer | Inbound/outbound surfaces and operator visibility. It translates CLI/API/plugin/dashboard/webhook/chat/Herdr interactions into calls against the engines, without becoming lifecycle or evidence truth. | CLI/API/plugin adapters, Herdr/dashboard visibility, host adapters, surface auth, command/API envelopes. | [fgOS Plugin Spec](../specs/fgos-plugin.md), [Herdr Web Dashboard Spec](../specs/herdr-web-dashboard.md), [Visibility And Herdr](../architect/agent-coordination/architecture/visibility-and-herdr.md), [IO Contract](../io-contract.md) |
+| Setup, Doctor, And Distribution Health | Platform support component that owns install shape, config defaults, health checks, repair posture, and global/project precedence. | setup config merge, doctor check registry, distribution packaging, shell integration, dependency/default discoverability. | [Distribution Spec](../specs/distribution.md), [Distribution Vision](../distribution-vision.md), [Reading Map setup entries](../specs/reading-map.md) |
+| Knowledge, Learning, And Documentation Registry | Lifecycle-adjacent learning component that owns retrospective knowledge, doc/topic registry, end-user document indexing, trace, and evolve signals. | knowledge registry, doc registry, Diataxis index, item trace, friction/outcome learning, evolve candidates. | [Enduser Docs Authoring Spec](../specs/enduser-docs-authoring.md), [Enduser Docs Index Spec](../specs/enduser-docs-index.md), [System Overview](../specs/system-overview.md) |

```

## claim_23a0c7979ae73ea30c2532171f40fd25

Source: `docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-26`. Target: `docs/platform/component-boundary.md#unheaded-block-40`.

Mechanical class: Weak-exact. Source digest: `3ee7c75c68c9e527207fabf58ca9a466ee370f6358c4015ba7951d704b029139`. Target digest: `3ee7c75c68c9e527207fabf58ca9a466ee370f6358c4015ba7951d704b029139`.

Full shown source SHA256: `3ee7c75c68c9e527207fabf58ca9a466ee370f6358c4015ba7951d704b029139`. Full shown target SHA256: `3ee7c75c68c9e527207fabf58ca9a466ee370f6358c4015ba7951d704b029139`.

### Proposed decision

```json
{
  "claimId": "claim_23a0c7979ae73ea30c2532171f40fd25",
  "sourceUnitDigest": "3ee7c75c68c9e527207fabf58ca9a466ee370f6358c4015ba7951d704b029139",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-40",
  "targetUnitDigest": "3ee7c75c68c9e527207fabf58ca9a466ee370f6358c4015ba7951d704b029139",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: component-boundary-advisory source carriage",
    "fgOS Component Boundary Advisory",
    "5. High-Level Component Authority Register"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ; source unit shorter than 40 characters. Carry the complete unheaded-block at docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-26 (lines 149–149) into docs/platform/component-boundary.md#unheaded-block-40 (lines 246–246), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
The collaboration shape should stay:
```

### Full target shown text

```text
The collaboration shape should stay:
```

### Unified diff

```diff
No text difference.
```

## claim_8dd5e63923184b2300df40a3ea7ed6f5

Source: `docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-27`. Target: `docs/platform/component-boundary.md#unheaded-block-41`.

Mechanical class: Weak-exact. Source digest: `9c60676513c958dea377865ed1f2099acdca34a1234b254527d750af2aef1461`. Target digest: `9c60676513c958dea377865ed1f2099acdca34a1234b254527d750af2aef1461`.

Full shown source SHA256: `9c60676513c958dea377865ed1f2099acdca34a1234b254527d750af2aef1461`. Full shown target SHA256: `9c60676513c958dea377865ed1f2099acdca34a1234b254527d750af2aef1461`.

### Proposed decision

```json
{
  "claimId": "claim_8dd5e63923184b2300df40a3ea7ed6f5",
  "sourceUnitDigest": "9c60676513c958dea377865ed1f2099acdca34a1234b254527d750af2aef1461",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-41",
  "targetUnitDigest": "9c60676513c958dea377865ed1f2099acdca34a1234b254527d750af2aef1461",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: component-boundary-advisory source carriage",
    "fgOS Component Boundary Advisory",
    "5. High-Level Component Authority Register"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-27 (lines 151–172) into docs/platform/component-boundary.md#unheaded-block-41 (lines 248–269), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

````text
```txt
Host / Surface
  -> Work Lifecycle Engine
       owns Work lifecycle and may ask Agent Coordination to perform a legal
       operation
  -> Agent Coordination Engine
       can also run standalone without Work

Agent Coordination Engine
  -> Team Cognition Engine
       proposes cognitive strategy, roles, tasks, topology, and synthesis plan
  -> Dispatch And Execution Engine
       resolves and launches governed execution
  -> Run Result Evaluator
       normalizes RunResult, evidence, and confidence
  -> Work Lifecycle Engine
       returns evidence/recommendations only; Work verbs decide lifecycle

Domain Components And Extension Layer supplies domain workflow definitions,
protocol packages, domain harnesses, evidence policy adapters, and organization
policy through controlled ports.
```
````

### Full target shown text

````text
```txt
Host / Surface
  -> Work Lifecycle Engine
       owns Work lifecycle and may ask Agent Coordination to perform a legal
       operation
  -> Agent Coordination Engine
       can also run standalone without Work

Agent Coordination Engine
  -> Team Cognition Engine
       proposes cognitive strategy, roles, tasks, topology, and synthesis plan
  -> Dispatch And Execution Engine
       resolves and launches governed execution
  -> Run Result Evaluator
       normalizes RunResult, evidence, and confidence
  -> Work Lifecycle Engine
       returns evidence/recommendations only; Work verbs decide lifecycle

Domain Components And Extension Layer supplies domain workflow definitions,
protocol packages, domain harnesses, evidence policy adapters, and organization
policy through controlled ports.
```
````

### Unified diff

```diff
No text difference.
```

## claim_ede299755b0bfb44ab23a6be8e3f42b4

Source: `docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-28`. Target: `docs/platform/component-boundary.md#unheaded-block-42`.

Mechanical class: Weak-exact. Source digest: `7fe45de88fbd483e76e550c337d25e8e713295869b1ef0d342e335809f7c706e`. Target digest: `7fe45de88fbd483e76e550c337d25e8e713295869b1ef0d342e335809f7c706e`.

Full shown source SHA256: `7fe45de88fbd483e76e550c337d25e8e713295869b1ef0d342e335809f7c706e`. Full shown target SHA256: `7fe45de88fbd483e76e550c337d25e8e713295869b1ef0d342e335809f7c706e`.

### Proposed decision

```json
{
  "claimId": "claim_ede299755b0bfb44ab23a6be8e3f42b4",
  "sourceUnitDigest": "7fe45de88fbd483e76e550c337d25e8e713295869b1ef0d342e335809f7c706e",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-42",
  "targetUnitDigest": "7fe45de88fbd483e76e550c337d25e8e713295869b1ef0d342e335809f7c706e",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: component-boundary-advisory source carriage",
    "fgOS Component Boundary Advisory",
    "5. High-Level Component Authority Register"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-28 (lines 174–179) into docs/platform/component-boundary.md#unheaded-block-42 (lines 271–276), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
Under this view, `Work Lifecycle Engine` is not an Agent Coordination submodule.
It is a sibling fgOS component that can consume Agent Coordination as an
execution/collaboration capability. It should stay domain-agnostic: marketing,
operations, coding, or another domain can use Work items to manage units of
work without inheriting coding-specific Git, worktree, merge, or technical
approval behavior.
```

### Full target shown text

```text
Under this view, `Work Lifecycle Engine` is not an Agent Coordination submodule.
It is a sibling fgOS component that can consume Agent Coordination as an
execution/collaboration capability. It should stay domain-agnostic: marketing,
operations, coding, or another domain can use Work items to manage units of
work without inheriting coding-specific Git, worktree, merge, or technical
approval behavior.
```

### Unified diff

```diff
No text difference.
```

## claim_76bbf3565d113f96c4ad339bce3fc115

Source: `docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-29`. Target: `docs/platform/component-boundary.md#unheaded-block-43`.

Mechanical class: Weak-exact. Source digest: `ddf501baab878da28e004ffac07861746b4975d8f2f6956c30bcbbcb0936f603`. Target digest: `ddf501baab878da28e004ffac07861746b4975d8f2f6956c30bcbbcb0936f603`.

Full shown source SHA256: `ddf501baab878da28e004ffac07861746b4975d8f2f6956c30bcbbcb0936f603`. Full shown target SHA256: `ddf501baab878da28e004ffac07861746b4975d8f2f6956c30bcbbcb0936f603`.

### Proposed decision

```json
{
  "claimId": "claim_76bbf3565d113f96c4ad339bce3fc115",
  "sourceUnitDigest": "ddf501baab878da28e004ffac07861746b4975d8f2f6956c30bcbbcb0936f603",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-43",
  "targetUnitDigest": "ddf501baab878da28e004ffac07861746b4975d8f2f6956c30bcbbcb0936f603",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: component-boundary-advisory source carriage",
    "fgOS Component Boundary Advisory",
    "5. High-Level Component Authority Register"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-29 (lines 181–184) into docs/platform/component-boundary.md#unheaded-block-43 (lines 278–281), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
The split is: the Work engine owns domain-agnostic work-unit lifecycle and
human gates; a domain extension owns domain-specific approval semantics,
resource isolation, branch/worktree behavior, and merge mechanics when that
domain needs them.
```

### Full target shown text

```text
The split is: the Work engine owns domain-agnostic work-unit lifecycle and
human gates; a domain extension owns domain-specific approval semantics,
resource isolation, branch/worktree behavior, and merge mechanics when that
domain needs them.
```

### Unified diff

```diff
No text difference.
```

## claim_d25f864350af23b18b3f416bb7887499

Source: `docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-30`. Target: `docs/platform/component-boundary.md#unheaded-block-44`.

Mechanical class: Weak-exact. Source digest: `f0f5df1caed78140a1faf77c1391de8dfe1d45f411bd11e57f8cbfec8da9ee3a`. Target digest: `f0f5df1caed78140a1faf77c1391de8dfe1d45f411bd11e57f8cbfec8da9ee3a`.

Full shown source SHA256: `f0f5df1caed78140a1faf77c1391de8dfe1d45f411bd11e57f8cbfec8da9ee3a`. Full shown target SHA256: `f0f5df1caed78140a1faf77c1391de8dfe1d45f411bd11e57f8cbfec8da9ee3a`.

### Proposed decision

```json
{
  "claimId": "claim_d25f864350af23b18b3f416bb7887499",
  "sourceUnitDigest": "f0f5df1caed78140a1faf77c1391de8dfe1d45f411bd11e57f8cbfec8da9ee3a",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-44",
  "targetUnitDigest": "f0f5df1caed78140a1faf77c1391de8dfe1d45f411bd11e57f8cbfec8da9ee3a",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: component-boundary-advisory source carriage",
    "fgOS Component Boundary Advisory",
    "5. High-Level Component Authority Register"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-30 (lines 186–188) into docs/platform/component-boundary.md#unheaded-block-44 (lines 283–285), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
A Coding Domain Component is a high-level domain package, not a small
extension. Its job is to own coding-specific product and technical behavior
while consuming platform engines for generic lifecycle and collaboration.
```

### Full target shown text

```text
A Coding Domain Component is a high-level domain package, not a small
extension. Its job is to own coding-specific product and technical behavior
while consuming platform engines for generic lifecycle and collaboration.
```

### Unified diff

```diff
No text difference.
```

## claim_ee89ec08217e76063f85c56c2b612177

Source: `docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-31`. Target: `docs/platform/component-boundary.md#unheaded-block-45`.

Mechanical class: Weak-exact. Source digest: `c84467d45b1ab143a666b7d7baa647d6bf8b44b91d67db6a7dff994d9e710e72`. Target digest: `c84467d45b1ab143a666b7d7baa647d6bf8b44b91d67db6a7dff994d9e710e72`.

Full shown source SHA256: `c84467d45b1ab143a666b7d7baa647d6bf8b44b91d67db6a7dff994d9e710e72`. Full shown target SHA256: `c84467d45b1ab143a666b7d7baa647d6bf8b44b91d67db6a7dff994d9e710e72`.

### Proposed decision

```json
{
  "claimId": "claim_ee89ec08217e76063f85c56c2b612177",
  "sourceUnitDigest": "c84467d45b1ab143a666b7d7baa647d6bf8b44b91d67db6a7dff994d9e710e72",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-45",
  "targetUnitDigest": "c84467d45b1ab143a666b7d7baa647d6bf8b44b91d67db6a7dff994d9e710e72",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: component-boundary-advisory source carriage",
    "fgOS Component Boundary Advisory",
    "5. High-Level Component Authority Register"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-31 (lines 190–194) into docs/platform/component-boundary.md#unheaded-block-45 (lines 287–291), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
Inside it, `Coding Domain Core`, `Coding Feature Workflow`, and `Bugfix
Workflow` are separate subcomponents. The core owns repository mechanics and
technical policy. The workflows own different coding work shapes. The component
uses Work Lifecycle Engine to manage Work units and Agent Coordination Engine to
run agent collaboration.
```

### Full target shown text

```text
Inside it, `Coding Domain Core`, `Coding Feature Workflow`, and `Bugfix
Workflow` are separate subcomponents. The core owns repository mechanics and
technical policy. The workflows own different coding work shapes. The component
uses Work Lifecycle Engine to manage Work units and Agent Coordination Engine to
run agent collaboration.
```

### Unified diff

```diff
No text difference.
```

## claim_a10e20a668c042d6b7391dd20f8e5ddd

Source: `docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-32`. Target: `docs/platform/component-boundary.md#unheaded-block-46`.

Mechanical class: Weak-exact. Source digest: `d52ae8848ecfb9ba6ab60ab5820cf238d032ce57339fd30a18bc56d992d458ae`. Target digest: `d52ae8848ecfb9ba6ab60ab5820cf238d032ce57339fd30a18bc56d992d458ae`.

Full shown source SHA256: `d52ae8848ecfb9ba6ab60ab5820cf238d032ce57339fd30a18bc56d992d458ae`. Full shown target SHA256: `d52ae8848ecfb9ba6ab60ab5820cf238d032ce57339fd30a18bc56d992d458ae`.

### Proposed decision

```json
{
  "claimId": "claim_a10e20a668c042d6b7391dd20f8e5ddd",
  "sourceUnitDigest": "d52ae8848ecfb9ba6ab60ab5820cf238d032ce57339fd30a18bc56d992d458ae",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-46",
  "targetUnitDigest": "d52ae8848ecfb9ba6ab60ab5820cf238d032ce57339fd30a18bc56d992d458ae",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: component-boundary-advisory source carriage",
    "fgOS Component Boundary Advisory",
    "5. High-Level Component Authority Register"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-32 (lines 196–200) into docs/platform/component-boundary.md#unheaded-block-46 (lines 293–297), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
`Team Cognition Engine` is a major internal module of Agent Coordination
Engine, not a protocol package. Protocol packages are recipes/configuration.
The engine is the runtime reasoning component that consumes an objective,
session state, optional protocol definition, and domain/org constraints, then
proposes the next bounded coordination action.
```

### Full target shown text

```text
`Team Cognition Engine` is a major internal module of Agent Coordination
Engine, not a protocol package. Protocol packages are recipes/configuration.
The engine is the runtime reasoning component that consumes an objective,
session state, optional protocol definition, and domain/org constraints, then
proposes the next bounded coordination action.
```

### Unified diff

```diff
No text difference.
```

## claim_aad8b37223d8857344794cafaba55cfd

Source: `docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-33`. Target: `docs/platform/component-boundary.md#unheaded-block-47`.

Mechanical class: Weak-exact. Source digest: `bd851151fbcce9fcff72bbe5777e19ad2cb3513e835f653dedd66dd345a2ff05`. Target digest: `bd851151fbcce9fcff72bbe5777e19ad2cb3513e835f653dedd66dd345a2ff05`.

Full shown source SHA256: `bd851151fbcce9fcff72bbe5777e19ad2cb3513e835f653dedd66dd345a2ff05`. Full shown target SHA256: `bd851151fbcce9fcff72bbe5777e19ad2cb3513e835f653dedd66dd345a2ff05`.

### Proposed decision

```json
{
  "claimId": "claim_aad8b37223d8857344794cafaba55cfd",
  "sourceUnitDigest": "bd851151fbcce9fcff72bbe5777e19ad2cb3513e835f653dedd66dd345a2ff05",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-47",
  "targetUnitDigest": "bd851151fbcce9fcff72bbe5777e19ad2cb3513e835f653dedd66dd345a2ff05",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: component-boundary-advisory source carriage",
    "fgOS Component Boundary Advisory",
    "5. High-Level Component Authority Register"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-33 (lines 202–205) into docs/platform/component-boundary.md#unheaded-block-47 (lines 299–302), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
`Run Result Evaluator` is not a generic verification harness. Its scope is
specific: evaluate the result of one Run for one Assignment. Domain-specific
evidence adapters may provide proof inputs, but the evaluator owns the final
RunResult confidence decision.
```

### Full target shown text

```text
`Run Result Evaluator` is not a generic verification harness. Its scope is
specific: evaluate the result of one Run for one Assignment. Domain-specific
evidence adapters may provide proof inputs, but the evaluator owns the final
RunResult confidence decision.
```

### Unified diff

```diff
No text difference.
```

## claim_41f97bc51d3e290eee4ede5329ceb32a

Source: `docs/architect/component-boundary/component-boundary-advisory.md#6-existing-decisions-that-must-be-preserved`. Target: `docs/platform/component-boundary.md#6-existing-decisions-that-must-be-preserved`.

Mechanical class: Judgment. Source digest: `60fb48c42303ae58a818f2c63d3ea8d77c0bf1b3abdedea3b15a8829585bbf48`. Target digest: `ef51053755d718c6c0de59d110635ca0f3d6d4c46ab3391471ef91ed8ac4d687`.

Full shown source SHA256: `0139effad6b12684671844cb7c156f105c1f4f0f187589a94f9c9acaa0c59d22`. Full shown target SHA256: `fbfeff74be293e36c63740386dbb102b06b0a48c1e97abf701556e730a55dd97`.

### Proposed decision

```json
{
  "claimId": "claim_41f97bc51d3e290eee4ede5329ceb32a",
  "sourceUnitDigest": "60fb48c42303ae58a818f2c63d3ea8d77c0bf1b3abdedea3b15a8829585bbf48",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "6-existing-decisions-that-must-be-preserved",
  "targetUnitDigest": "ef51053755d718c6c0de59d110635ca0f3d6d4c46ab3391471ef91ed8ac4d687",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: component-boundary-advisory source carriage",
    "fgOS Component Boundary Advisory"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Judgment: no target digest match. Carry the complete heading at docs/architect/component-boundary/component-boundary-advisory.md#6-existing-decisions-that-must-be-preserved (lines 207–207) into docs/platform/component-boundary.md#6-existing-decisions-that-must-be-preserved (lines 304–304), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. Digest differences come only from the recorded candidate header/frontmatter fence, heading-level shift or physical relative-link rebasing; full before/after units and line mapping are in authoring accounting. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

````text
## 6. Existing Decisions That Must Be Preserved

This advisory should not re-open decisions that the repo has already made. The
important recovered constraints are:

1. `domain -> N workflow -> item` is already the intended hierarchy.
   `coding` has a default workflow, `feature`, and the domain model separates
   coding into `feature`, `bugfix`, and `lightweight` workflows.
   Workflow selection belongs to the domain registry through `workflowFor`
   keyed by item `kind`; it is not an Agent Coordination decision.
2. A domain owns stage vocabulary, step mapping, legal stage transitions,
   stage-to-skill mapping, legal operations, `worktreeBacked`, status labels,
   park reasons, and classification vocabulary. A domain does not own the
   global status FSM.
3. The coding feature workflow declares `planning.validate-plan` as a legal
   operation: role `reviewer`, reason `review`, task-spec
   `validate-plan`, skill `fgos-coding-validating`, with policy hints
   `minTier: standard`, `preferPersona: code-reviewer`, and
   `preferExecutor: claude`.
4. `validate-plan` is the second half of planning, not a separate stage. The
   shape-plan skill writes the plan; validation proves it against reality; the
   lifecycle driver owns the eventual `planning -> executing` engine verb.
5. Skills do not own stage transitions. They produce artifacts, verdicts, and
   recommendations. Engine verbs validate and apply lifecycle movement.
6. Human gates are real authority boundaries. The machine must make the best
   grounded decision it can first, but a genuine human gate is not self-answered
   by a skill or worker.
7. Task-spec, skill, knowledge, and context are four different layers:
   task-spec is the executable contract; skill is executor know-how; knowledge
   is domain expertise; context is instance-specific material and references.
8. Collaboration triggers belong in task-specs per call edge and workflow/stage:
   when to call, why, to whom, and what return shape is expected. The doctrine
   is: prose teaches, the soul decides, guard blocks.
9. RoleGraph should stay small: implementer, researcher, reviewer, helper, and
   advisor. New specialties should normally be expressed as task-spec/skill
   combinations, not new core roles.

The practical correction for this document is: do not ask humans to classify a
case that is already classified by the domain registry, workflow declaration,
task-spec, or skill doctrine. The advisor must inspect those sources first,
then ask only when the existing system has a real gap or a human-only choice.

For example, the question "a coding feature work item at planning needs plan
validation; which component owns that?" should be answered from the repo:

```txt
Coding Feature Workflow
  declares planning.validate-plan as a legal reviewer operation

Work Lifecycle Driver / Domain Workflow Interpreter
  selects that legal operation when plan.md exists and validation is due

Assignment Builder
  freezes planning.validate-plan into an Assignment with taskSpec, role,
  skill, policy, expected outputs, and provenance

Dispatch And Execution Engine
  resolves executor/provider/model/mechanism and runs the reviewer Assignment

Run Result Evaluator
  interprets the reviewer run result and confidence for this Assignment

Work Lifecycle Engine
  applies planning -> executing only through the engine verb when validation
  produced sufficient evidence
```

This case does not require a new component or a human architecture decision. It
requires preserving the already-declared authority chain.
````

### Full target shown text

````text
#### 6. Existing Decisions That Must Be Preserved

This advisory should not re-open decisions that the repo has already made. The
important recovered constraints are:

1. `domain -> N workflow -> item` is already the intended hierarchy.
   `coding` has a default workflow, `feature`, and the domain model separates
   coding into `feature`, `bugfix`, and `lightweight` workflows.
   Workflow selection belongs to the domain registry through `workflowFor`
   keyed by item `kind`; it is not an Agent Coordination decision.
2. A domain owns stage vocabulary, step mapping, legal stage transitions,
   stage-to-skill mapping, legal operations, `worktreeBacked`, status labels,
   park reasons, and classification vocabulary. A domain does not own the
   global status FSM.
3. The coding feature workflow declares `planning.validate-plan` as a legal
   operation: role `reviewer`, reason `review`, task-spec
   `validate-plan`, skill `fgos-coding-validating`, with policy hints
   `minTier: standard`, `preferPersona: code-reviewer`, and
   `preferExecutor: claude`.
4. `validate-plan` is the second half of planning, not a separate stage. The
   shape-plan skill writes the plan; validation proves it against reality; the
   lifecycle driver owns the eventual `planning -> executing` engine verb.
5. Skills do not own stage transitions. They produce artifacts, verdicts, and
   recommendations. Engine verbs validate and apply lifecycle movement.
6. Human gates are real authority boundaries. The machine must make the best
   grounded decision it can first, but a genuine human gate is not self-answered
   by a skill or worker.
7. Task-spec, skill, knowledge, and context are four different layers:
   task-spec is the executable contract; skill is executor know-how; knowledge
   is domain expertise; context is instance-specific material and references.
8. Collaboration triggers belong in task-specs per call edge and workflow/stage:
   when to call, why, to whom, and what return shape is expected. The doctrine
   is: prose teaches, the soul decides, guard blocks.
9. RoleGraph should stay small: implementer, researcher, reviewer, helper, and
   advisor. New specialties should normally be expressed as task-spec/skill
   combinations, not new core roles.

The practical correction for this document is: do not ask humans to classify a
case that is already classified by the domain registry, workflow declaration,
task-spec, or skill doctrine. The advisor must inspect those sources first,
then ask only when the existing system has a real gap or a human-only choice.

For example, the question "a coding feature work item at planning needs plan
validation; which component owns that?" should be answered from the repo:

```txt
Coding Feature Workflow
  declares planning.validate-plan as a legal reviewer operation

Work Lifecycle Driver / Domain Workflow Interpreter
  selects that legal operation when plan.md exists and validation is due

Assignment Builder
  freezes planning.validate-plan into an Assignment with taskSpec, role,
  skill, policy, expected outputs, and provenance

Dispatch And Execution Engine
  resolves executor/provider/model/mechanism and runs the reviewer Assignment

Run Result Evaluator
  interprets the reviewer run result and confidence for this Assignment

Work Lifecycle Engine
  applies planning -> executing only through the engine verb when validation
  produced sufficient evidence
```

This case does not require a new component or a human architecture decision. It
requires preserving the already-declared authority chain.
````

### Unified diff

```diff
--- docs/architect/component-boundary/component-boundary-advisory.md#6-existing-decisions-that-must-be-preserved
+++ docs/platform/component-boundary.md#6-existing-decisions-that-must-be-preserved
@@ -1,4 +1,4 @@
-## 6. Existing Decisions That Must Be Preserved
+#### 6. Existing Decisions That Must Be Preserved
 
 This advisory should not re-open decisions that the repo has already made. The
 important recovered constraints are:

```

## claim_3ce7a04c3bfa7343ae31cd061a43b8bd

Source: `docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-34`. Target: `docs/platform/component-boundary.md#unheaded-block-48`.

Mechanical class: Weak-exact. Source digest: `288dcf20143ebce3b48e0c4370668734d849197fb2800d4e420ac1e6417bb181`. Target digest: `288dcf20143ebce3b48e0c4370668734d849197fb2800d4e420ac1e6417bb181`.

Full shown source SHA256: `288dcf20143ebce3b48e0c4370668734d849197fb2800d4e420ac1e6417bb181`. Full shown target SHA256: `288dcf20143ebce3b48e0c4370668734d849197fb2800d4e420ac1e6417bb181`.

### Proposed decision

```json
{
  "claimId": "claim_3ce7a04c3bfa7343ae31cd061a43b8bd",
  "sourceUnitDigest": "288dcf20143ebce3b48e0c4370668734d849197fb2800d4e420ac1e6417bb181",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-48",
  "targetUnitDigest": "288dcf20143ebce3b48e0c4370668734d849197fb2800d4e420ac1e6417bb181",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: component-boundary-advisory source carriage",
    "fgOS Component Boundary Advisory",
    "6. Existing Decisions That Must Be Preserved"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-34 (lines 209–210) into docs/platform/component-boundary.md#unheaded-block-48 (lines 306–307), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
This advisory should not re-open decisions that the repo has already made. The
important recovered constraints are:
```

### Full target shown text

```text
This advisory should not re-open decisions that the repo has already made. The
important recovered constraints are:
```

### Unified diff

```diff
No text difference.
```

## claim_7ffa8fe890b4d08db7e9dcaef3af6dbe

Source: `docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-35`. Target: `docs/platform/component-boundary.md#unheaded-block-49`.

Mechanical class: Weak-exact. Source digest: `86d5fbf4fd87da5c0528c02058843a78a373d031a91466384fc2fd3a12bc6bb1`. Target digest: `86d5fbf4fd87da5c0528c02058843a78a373d031a91466384fc2fd3a12bc6bb1`.

Full shown source SHA256: `86d5fbf4fd87da5c0528c02058843a78a373d031a91466384fc2fd3a12bc6bb1`. Full shown target SHA256: `86d5fbf4fd87da5c0528c02058843a78a373d031a91466384fc2fd3a12bc6bb1`.

### Proposed decision

```json
{
  "claimId": "claim_7ffa8fe890b4d08db7e9dcaef3af6dbe",
  "sourceUnitDigest": "86d5fbf4fd87da5c0528c02058843a78a373d031a91466384fc2fd3a12bc6bb1",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-49",
  "targetUnitDigest": "86d5fbf4fd87da5c0528c02058843a78a373d031a91466384fc2fd3a12bc6bb1",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: component-boundary-advisory source carriage",
    "fgOS Component Boundary Advisory",
    "6. Existing Decisions That Must Be Preserved"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-35 (lines 212–242) into docs/platform/component-boundary.md#unheaded-block-49 (lines 309–339), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
1. `domain -> N workflow -> item` is already the intended hierarchy.
   `coding` has a default workflow, `feature`, and the domain model separates
   coding into `feature`, `bugfix`, and `lightweight` workflows.
   Workflow selection belongs to the domain registry through `workflowFor`
   keyed by item `kind`; it is not an Agent Coordination decision.
2. A domain owns stage vocabulary, step mapping, legal stage transitions,
   stage-to-skill mapping, legal operations, `worktreeBacked`, status labels,
   park reasons, and classification vocabulary. A domain does not own the
   global status FSM.
3. The coding feature workflow declares `planning.validate-plan` as a legal
   operation: role `reviewer`, reason `review`, task-spec
   `validate-plan`, skill `fgos-coding-validating`, with policy hints
   `minTier: standard`, `preferPersona: code-reviewer`, and
   `preferExecutor: claude`.
4. `validate-plan` is the second half of planning, not a separate stage. The
   shape-plan skill writes the plan; validation proves it against reality; the
   lifecycle driver owns the eventual `planning -> executing` engine verb.
5. Skills do not own stage transitions. They produce artifacts, verdicts, and
   recommendations. Engine verbs validate and apply lifecycle movement.
6. Human gates are real authority boundaries. The machine must make the best
   grounded decision it can first, but a genuine human gate is not self-answered
   by a skill or worker.
7. Task-spec, skill, knowledge, and context are four different layers:
   task-spec is the executable contract; skill is executor know-how; knowledge
   is domain expertise; context is instance-specific material and references.
8. Collaboration triggers belong in task-specs per call edge and workflow/stage:
   when to call, why, to whom, and what return shape is expected. The doctrine
   is: prose teaches, the soul decides, guard blocks.
9. RoleGraph should stay small: implementer, researcher, reviewer, helper, and
   advisor. New specialties should normally be expressed as task-spec/skill
   combinations, not new core roles.
```

### Full target shown text

```text
1. `domain -> N workflow -> item` is already the intended hierarchy.
   `coding` has a default workflow, `feature`, and the domain model separates
   coding into `feature`, `bugfix`, and `lightweight` workflows.
   Workflow selection belongs to the domain registry through `workflowFor`
   keyed by item `kind`; it is not an Agent Coordination decision.
2. A domain owns stage vocabulary, step mapping, legal stage transitions,
   stage-to-skill mapping, legal operations, `worktreeBacked`, status labels,
   park reasons, and classification vocabulary. A domain does not own the
   global status FSM.
3. The coding feature workflow declares `planning.validate-plan` as a legal
   operation: role `reviewer`, reason `review`, task-spec
   `validate-plan`, skill `fgos-coding-validating`, with policy hints
   `minTier: standard`, `preferPersona: code-reviewer`, and
   `preferExecutor: claude`.
4. `validate-plan` is the second half of planning, not a separate stage. The
   shape-plan skill writes the plan; validation proves it against reality; the
   lifecycle driver owns the eventual `planning -> executing` engine verb.
5. Skills do not own stage transitions. They produce artifacts, verdicts, and
   recommendations. Engine verbs validate and apply lifecycle movement.
6. Human gates are real authority boundaries. The machine must make the best
   grounded decision it can first, but a genuine human gate is not self-answered
   by a skill or worker.
7. Task-spec, skill, knowledge, and context are four different layers:
   task-spec is the executable contract; skill is executor know-how; knowledge
   is domain expertise; context is instance-specific material and references.
8. Collaboration triggers belong in task-specs per call edge and workflow/stage:
   when to call, why, to whom, and what return shape is expected. The doctrine
   is: prose teaches, the soul decides, guard blocks.
9. RoleGraph should stay small: implementer, researcher, reviewer, helper, and
   advisor. New specialties should normally be expressed as task-spec/skill
   combinations, not new core roles.
```

### Unified diff

```diff
No text difference.
```

## claim_478e0d9f32b3e7d3c42a4baa93f133dc

Source: `docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-36`. Target: `docs/platform/component-boundary.md#unheaded-block-50`.

Mechanical class: Weak-exact. Source digest: `2153a68e7201b407e655d3e81260ec51b4d4b52fce90d0d7fa16aa4555fe7316`. Target digest: `2153a68e7201b407e655d3e81260ec51b4d4b52fce90d0d7fa16aa4555fe7316`.

Full shown source SHA256: `2153a68e7201b407e655d3e81260ec51b4d4b52fce90d0d7fa16aa4555fe7316`. Full shown target SHA256: `2153a68e7201b407e655d3e81260ec51b4d4b52fce90d0d7fa16aa4555fe7316`.

### Proposed decision

```json
{
  "claimId": "claim_478e0d9f32b3e7d3c42a4baa93f133dc",
  "sourceUnitDigest": "2153a68e7201b407e655d3e81260ec51b4d4b52fce90d0d7fa16aa4555fe7316",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-50",
  "targetUnitDigest": "2153a68e7201b407e655d3e81260ec51b4d4b52fce90d0d7fa16aa4555fe7316",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: component-boundary-advisory source carriage",
    "fgOS Component Boundary Advisory",
    "6. Existing Decisions That Must Be Preserved"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-36 (lines 244–247) into docs/platform/component-boundary.md#unheaded-block-50 (lines 341–344), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
The practical correction for this document is: do not ask humans to classify a
case that is already classified by the domain registry, workflow declaration,
task-spec, or skill doctrine. The advisor must inspect those sources first,
then ask only when the existing system has a real gap or a human-only choice.
```

### Full target shown text

```text
The practical correction for this document is: do not ask humans to classify a
case that is already classified by the domain registry, workflow declaration,
task-spec, or skill doctrine. The advisor must inspect those sources first,
then ask only when the existing system has a real gap or a human-only choice.
```

### Unified diff

```diff
No text difference.
```

## claim_2f379340702eb45444bea0bab3361f95

Source: `docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-37`. Target: `docs/platform/component-boundary.md#unheaded-block-51`.

Mechanical class: Weak-exact. Source digest: `c13537803ff56af1fe9978fc0e6cf5cb24379e51f0722679746693df00939aa9`. Target digest: `c13537803ff56af1fe9978fc0e6cf5cb24379e51f0722679746693df00939aa9`.

Full shown source SHA256: `c13537803ff56af1fe9978fc0e6cf5cb24379e51f0722679746693df00939aa9`. Full shown target SHA256: `c13537803ff56af1fe9978fc0e6cf5cb24379e51f0722679746693df00939aa9`.

### Proposed decision

```json
{
  "claimId": "claim_2f379340702eb45444bea0bab3361f95",
  "sourceUnitDigest": "c13537803ff56af1fe9978fc0e6cf5cb24379e51f0722679746693df00939aa9",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-51",
  "targetUnitDigest": "c13537803ff56af1fe9978fc0e6cf5cb24379e51f0722679746693df00939aa9",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: component-boundary-advisory source carriage",
    "fgOS Component Boundary Advisory",
    "6. Existing Decisions That Must Be Preserved"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-37 (lines 249–250) into docs/platform/component-boundary.md#unheaded-block-51 (lines 346–347), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
For example, the question "a coding feature work item at planning needs plan
validation; which component owns that?" should be answered from the repo:
```

### Full target shown text

```text
For example, the question "a coding feature work item at planning needs plan
validation; which component owns that?" should be answered from the repo:
```

### Unified diff

```diff
No text difference.
```

## claim_e8ba8df2876a0b07de5cc3acfc9af145

Source: `docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-38`. Target: `docs/platform/component-boundary.md#unheaded-block-52`.

Mechanical class: Weak-exact. Source digest: `d18d9725241f214247cc8a8c68d302f2bda761ce1eb5729eda0811508bfd97ca`. Target digest: `d18d9725241f214247cc8a8c68d302f2bda761ce1eb5729eda0811508bfd97ca`.

Full shown source SHA256: `d18d9725241f214247cc8a8c68d302f2bda761ce1eb5729eda0811508bfd97ca`. Full shown target SHA256: `d18d9725241f214247cc8a8c68d302f2bda761ce1eb5729eda0811508bfd97ca`.

### Proposed decision

```json
{
  "claimId": "claim_e8ba8df2876a0b07de5cc3acfc9af145",
  "sourceUnitDigest": "d18d9725241f214247cc8a8c68d302f2bda761ce1eb5729eda0811508bfd97ca",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-52",
  "targetUnitDigest": "d18d9725241f214247cc8a8c68d302f2bda761ce1eb5729eda0811508bfd97ca",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: component-boundary-advisory source carriage",
    "fgOS Component Boundary Advisory",
    "6. Existing Decisions That Must Be Preserved"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-38 (lines 252–272) into docs/platform/component-boundary.md#unheaded-block-52 (lines 349–369), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

````text
```txt
Coding Feature Workflow
  declares planning.validate-plan as a legal reviewer operation

Work Lifecycle Driver / Domain Workflow Interpreter
  selects that legal operation when plan.md exists and validation is due

Assignment Builder
  freezes planning.validate-plan into an Assignment with taskSpec, role,
  skill, policy, expected outputs, and provenance

Dispatch And Execution Engine
  resolves executor/provider/model/mechanism and runs the reviewer Assignment

Run Result Evaluator
  interprets the reviewer run result and confidence for this Assignment

Work Lifecycle Engine
  applies planning -> executing only through the engine verb when validation
  produced sufficient evidence
```
````

### Full target shown text

````text
```txt
Coding Feature Workflow
  declares planning.validate-plan as a legal reviewer operation

Work Lifecycle Driver / Domain Workflow Interpreter
  selects that legal operation when plan.md exists and validation is due

Assignment Builder
  freezes planning.validate-plan into an Assignment with taskSpec, role,
  skill, policy, expected outputs, and provenance

Dispatch And Execution Engine
  resolves executor/provider/model/mechanism and runs the reviewer Assignment

Run Result Evaluator
  interprets the reviewer run result and confidence for this Assignment

Work Lifecycle Engine
  applies planning -> executing only through the engine verb when validation
  produced sufficient evidence
```
````

### Unified diff

```diff
No text difference.
```

## claim_f85d39c523913fc7cb660e3b67989989

Source: `docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-39`. Target: `docs/platform/component-boundary.md#unheaded-block-53`.

Mechanical class: Weak-exact. Source digest: `41a41035bd290ed0ea23e35a11172176f08e771cbd31794bd4c65f9128c3d7c4`. Target digest: `41a41035bd290ed0ea23e35a11172176f08e771cbd31794bd4c65f9128c3d7c4`.

Full shown source SHA256: `41a41035bd290ed0ea23e35a11172176f08e771cbd31794bd4c65f9128c3d7c4`. Full shown target SHA256: `41a41035bd290ed0ea23e35a11172176f08e771cbd31794bd4c65f9128c3d7c4`.

### Proposed decision

```json
{
  "claimId": "claim_f85d39c523913fc7cb660e3b67989989",
  "sourceUnitDigest": "41a41035bd290ed0ea23e35a11172176f08e771cbd31794bd4c65f9128c3d7c4",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-53",
  "targetUnitDigest": "41a41035bd290ed0ea23e35a11172176f08e771cbd31794bd4c65f9128c3d7c4",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: component-boundary-advisory source carriage",
    "fgOS Component Boundary Advisory",
    "6. Existing Decisions That Must Be Preserved"
  ],
  "claimKind": "decision",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-39 (lines 274–275) into docs/platform/component-boundary.md#unheaded-block-53 (lines 371–372), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
This case does not require a new component or a human architecture decision. It
requires preserving the already-declared authority chain.
```

### Full target shown text

```text
This case does not require a new component or a human architecture decision. It
requires preserving the already-declared authority chain.
```

### Unified diff

```diff
No text difference.
```

## claim_239931ca8e26fd3b19bf970e30e2ae4b

Source: `docs/architect/component-boundary/component-boundary-advisory.md#7-contract-authority-matrix`. Target: `docs/platform/component-boundary.md#7-contract-authority-matrix`.

Mechanical class: Judgment. Source digest: `4d28b9272b26427ed2d52f257a57be32113f564fe2a49e164ba95262b990fe73`. Target digest: `ef8cba2d9be208afdf9a91a7cc5f7c2e49c3600f74ba9f913b7c3aff8a3a40fc`.

Full shown source SHA256: `f94c147a40ac9a17a3c5ae555a0dc41ef8fb68a60ac7496c6307470f6392fc4e`. Full shown target SHA256: `39402960db9661bd6f149d302ed09cc973974de21689e91d1a72e9b03798f04b`.

### Proposed decision

```json
{
  "claimId": "claim_239931ca8e26fd3b19bf970e30e2ae4b",
  "sourceUnitDigest": "4d28b9272b26427ed2d52f257a57be32113f564fe2a49e164ba95262b990fe73",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "7-contract-authority-matrix",
  "targetUnitDigest": "ef8cba2d9be208afdf9a91a7cc5f7c2e49c3600f74ba9f913b7c3aff8a3a40fc",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: component-boundary-advisory source carriage",
    "fgOS Component Boundary Advisory"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Judgment: no target digest match. Carry the complete heading at docs/architect/component-boundary/component-boundary-advisory.md#7-contract-authority-matrix (lines 277–277) into docs/platform/component-boundary.md#7-contract-authority-matrix (lines 374–374), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. Digest differences come only from the recorded candidate header/frontmatter fence, heading-level shift or physical relative-link rebasing; full before/after units and line mapping are in authoring accounting. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
## 7. Contract Authority Matrix

The existing contracts should be read as shared system contracts with explicit
component ownership. A document may describe a chain across components, but the
authority for each decision should still belong to one component.

In this advisory, a contract is not a component. A contract is the public
interface, schema, or invariant owned by the component that controls the
behavior. Other components interact through that contract and must not
re-derive it privately.

| Existing contract or rule | Primary owner | Important consumers | Ownership note |
|---|---|---|---|
| [Workflow Stage Operation Contract](../agent-coordination/contracts/workflow-stage-operation.md) | Domain Components And Extension Layer, as consumed by Work Lifecycle Engine | Agent Coordination Engine, Assignment Builder | Owns declared domain Work-stage operation normalization and compatibility. Coding Feature Workflow and Bugfix Workflow are coding-domain subcomponents, not Agent Coordination core. |
| [FlowDefinition Contract](../agent-coordination/contracts/flow-definition.md) | Domain Components And Extension Layer, with validation consumed by Agent Coordination Engine | Team Cognition Engine, Work Lifecycle Engine, Dispatch/Execution | Owns schema/IR for graph, roles, actors, operations, profiles, and declared policy hints. It should not own runtime state, executor choice, or evidence truth. |
| [CoordinationSession Contract](../agent-coordination/contracts/coordination-session.md) | Agent Coordination Engine | Team Cognition Engine, Dispatch/Execution, Run Result Evaluator, Work Lifecycle Engine | Owns session manifest, event stream, assignment membership, aggregate bounds, topology state, and recovery. It should reference Assignment/Run/RunResult records, not duplicate them. |
| Assignment section of [Assignment, Run, And RunResult Contract](../agent-coordination/contracts/assignment-run-runresult.md) | Agent Coordination Engine / Assignment Builder | Domain Components And Extension Layer, Domain Harnesses, Dispatch/Execution | Owns immutable semantic request shape and provenance. It should freeze mutation/evidence/budget/policy inputs before dispatch. |
| Run section of [Assignment, Run, And RunResult Contract](../agent-coordination/contracts/assignment-run-runresult.md) | Dispatch And Execution Engine | Run Result Evaluator, Host/Surface, Agent Coordination Engine | Owns one concrete attempt and its resolved DispatchPlan/mechanism metadata. It should not become semantic task identity. |
| RunResult and Confidence sections of [Assignment, Run, And RunResult Contract](../agent-coordination/contracts/assignment-run-runresult.md) | Run Result Evaluator | Agent Coordination Engine, Work Lifecycle Engine, Team Cognition Engine | Owns normalized outcome, confidence, accepted/rejected evidence, and failure classification. It should not authorize lifecycle mutation. |
| [Dispatch Control Plane](../agent-coordination/architecture/dispatch-control-plane.md) | Dispatch And Execution Engine | Agent Coordination Engine, Domain Components And Extension Layer, Host/Surface | Owns executor/provider/model/tier/mechanism/adapter/governance resolution. It should not choose semantic operations or interpret success. |
| [Evidence And Result Architecture](../agent-coordination/architecture/evidence-and-results.md) | Run Result Evaluator | Dispatch/Execution, Agent Coordination Engine, Work Lifecycle Engine, Domain Components And Extension Layer | Owns confidence boundaries, evidence freshness, and false-success rules. Adapters and domain evidence policy should feed it evidence, not replace it. |
| [Work Integration Boundaries](../agent-coordination/architecture/work-integration.md) | Work Lifecycle Engine | Agent Coordination Engine, Domain Components And Extension Layer, Run Result Evaluator | Owns the rule that only Work verbs move domain-agnostic Work lifecycle state. Domain-specific lifecycle effects such as coding merge/technical approval belong to the relevant domain component. Sessions and RunResults may inform drivers only. |
| [Visibility And Herdr](../agent-coordination/architecture/visibility-and-herdr.md) | Host And Surface Layer | Dispatch/Execution, Run Result Evaluator, Agent Coordination Engine | Owns observation and operator visibility. It must consume canonical Run/RunResult state where possible and must not become truth. |
| [ADR-007 Domain Harness Seam](../agent-coordination/decisions/ADR-007-domain-harness-seam-and-non-driving-inline-evidence.md) | Domain Components And Extension Layer | Assignment Builder, Agent Coordination Engine, Work Lifecycle Engine | Owns domain-specific enrichment/rejection before normalization. It may add constraints/evidence/policy hints, but may not dispatch or mutate lifecycle. |
| Domain manifest and workflow declarations (`domains/<domain>/manifest.yaml`, `workflows/*.yaml`) | Domain Components And Extension Layer | Work Lifecycle Engine, Agent Coordination Engine, Assignment Builder, Dispatch And Execution Engine | Own stage vocabulary, legal operations, stage skill/taskSpec mapping, workflow selection, and domain policy hints. Other components read them; they do not reinterpret them. |
| Domain task-specs (`domains/<domain>/task-specs/*.md`) | Domain Components And Extension Layer | Agent Coordination Engine, Assignment Builder, Skills, Run Result Evaluator | Own executable contract, collaboration triggers, required skill/agent hints, expected outputs, gates, and return shape for an operation. They are not runtime state and should not choose executor transport. |
| Domain skills (`domains/<domain>/skills/*` or `.agents/skills/*`) | Domain Components And Extension Layer | Executors, Assignment Builder, Host/Surface | Own operational know-how for an executor. They must not silently replace task-spec authority, domain workflow legality, dispatch policy, or Work lifecycle verbs. |

Two contract files deserve special care:

1. `assignment-run-runresult.md` is a chain contract, not a single-component
   ownership contract. Assignment, Run, and RunResult should remain separate
   authority boundaries even if they are documented together.
2. `flow-definition.md` carries policy and evidence requirement fields, but
   those are declared requirements. Effective provider/model resolution belongs
   to Dispatch And Execution, and confidence computation belongs to the Run
   Result Evaluator.

Three coding-domain sources deserve the same treatment:

1. `domains/coding/workflows/feature.yaml` is the source for the feature
   workflow's legal stage operations. `planning.validate-plan` should be read
   from here before any architectural question is asked.
2. `domains/coding/task-specs/*.md` are the task contracts. They should carry
   collaboration triggers and return-shape expectations.
3. `domains/coding/skills/*` are executor doctrine. They can describe how to do
   the work, but they do not own lifecycle movement or dispatch governance.
```

### Full target shown text

```text
#### 7. Contract Authority Matrix

The existing contracts should be read as shared system contracts with explicit
component ownership. A document may describe a chain across components, but the
authority for each decision should still belong to one component.

In this advisory, a contract is not a component. A contract is the public
interface, schema, or invariant owned by the component that controls the
behavior. Other components interact through that contract and must not
re-derive it privately.

| Existing contract or rule | Primary owner | Important consumers | Ownership note |
|---|---|---|---|
| [Workflow Stage Operation Contract](../architect/agent-coordination/contracts/workflow-stage-operation.md) | Domain Components And Extension Layer, as consumed by Work Lifecycle Engine | Agent Coordination Engine, Assignment Builder | Owns declared domain Work-stage operation normalization and compatibility. Coding Feature Workflow and Bugfix Workflow are coding-domain subcomponents, not Agent Coordination core. |
| [FlowDefinition Contract](../architect/agent-coordination/contracts/flow-definition.md) | Domain Components And Extension Layer, with validation consumed by Agent Coordination Engine | Team Cognition Engine, Work Lifecycle Engine, Dispatch/Execution | Owns schema/IR for graph, roles, actors, operations, profiles, and declared policy hints. It should not own runtime state, executor choice, or evidence truth. |
| [CoordinationSession Contract](../architect/agent-coordination/contracts/coordination-session.md) | Agent Coordination Engine | Team Cognition Engine, Dispatch/Execution, Run Result Evaluator, Work Lifecycle Engine | Owns session manifest, event stream, assignment membership, aggregate bounds, topology state, and recovery. It should reference Assignment/Run/RunResult records, not duplicate them. |
| Assignment section of [Assignment, Run, And RunResult Contract](../architect/agent-coordination/contracts/assignment-run-runresult.md) | Agent Coordination Engine / Assignment Builder | Domain Components And Extension Layer, Domain Harnesses, Dispatch/Execution | Owns immutable semantic request shape and provenance. It should freeze mutation/evidence/budget/policy inputs before dispatch. |
| Run section of [Assignment, Run, And RunResult Contract](../architect/agent-coordination/contracts/assignment-run-runresult.md) | Dispatch And Execution Engine | Run Result Evaluator, Host/Surface, Agent Coordination Engine | Owns one concrete attempt and its resolved DispatchPlan/mechanism metadata. It should not become semantic task identity. |
| RunResult and Confidence sections of [Assignment, Run, And RunResult Contract](../architect/agent-coordination/contracts/assignment-run-runresult.md) | Run Result Evaluator | Agent Coordination Engine, Work Lifecycle Engine, Team Cognition Engine | Owns normalized outcome, confidence, accepted/rejected evidence, and failure classification. It should not authorize lifecycle mutation. |
| [Dispatch Control Plane](../architect/agent-coordination/architecture/dispatch-control-plane.md) | Dispatch And Execution Engine | Agent Coordination Engine, Domain Components And Extension Layer, Host/Surface | Owns executor/provider/model/tier/mechanism/adapter/governance resolution. It should not choose semantic operations or interpret success. |
| [Evidence And Result Architecture](../architect/agent-coordination/architecture/evidence-and-results.md) | Run Result Evaluator | Dispatch/Execution, Agent Coordination Engine, Work Lifecycle Engine, Domain Components And Extension Layer | Owns confidence boundaries, evidence freshness, and false-success rules. Adapters and domain evidence policy should feed it evidence, not replace it. |
| [Work Integration Boundaries](../architect/agent-coordination/architecture/work-integration.md) | Work Lifecycle Engine | Agent Coordination Engine, Domain Components And Extension Layer, Run Result Evaluator | Owns the rule that only Work verbs move domain-agnostic Work lifecycle state. Domain-specific lifecycle effects such as coding merge/technical approval belong to the relevant domain component. Sessions and RunResults may inform drivers only. |
| [Visibility And Herdr](../architect/agent-coordination/architecture/visibility-and-herdr.md) | Host And Surface Layer | Dispatch/Execution, Run Result Evaluator, Agent Coordination Engine | Owns observation and operator visibility. It must consume canonical Run/RunResult state where possible and must not become truth. |
| [ADR-007 Domain Harness Seam](../architect/agent-coordination/decisions/ADR-007-domain-harness-seam-and-non-driving-inline-evidence.md) | Domain Components And Extension Layer | Assignment Builder, Agent Coordination Engine, Work Lifecycle Engine | Owns domain-specific enrichment/rejection before normalization. It may add constraints/evidence/policy hints, but may not dispatch or mutate lifecycle. |
| Domain manifest and workflow declarations (`domains/<domain>/manifest.yaml`, `workflows/*.yaml`) | Domain Components And Extension Layer | Work Lifecycle Engine, Agent Coordination Engine, Assignment Builder, Dispatch And Execution Engine | Own stage vocabulary, legal operations, stage skill/taskSpec mapping, workflow selection, and domain policy hints. Other components read them; they do not reinterpret them. |
| Domain task-specs (`domains/<domain>/task-specs/*.md`) | Domain Components And Extension Layer | Agent Coordination Engine, Assignment Builder, Skills, Run Result Evaluator | Own executable contract, collaboration triggers, required skill/agent hints, expected outputs, gates, and return shape for an operation. They are not runtime state and should not choose executor transport. |
| Domain skills (`domains/<domain>/skills/*` or `.agents/skills/*`) | Domain Components And Extension Layer | Executors, Assignment Builder, Host/Surface | Own operational know-how for an executor. They must not silently replace task-spec authority, domain workflow legality, dispatch policy, or Work lifecycle verbs. |

Two contract files deserve special care:

1. `assignment-run-runresult.md` is a chain contract, not a single-component
   ownership contract. Assignment, Run, and RunResult should remain separate
   authority boundaries even if they are documented together.
2. `flow-definition.md` carries policy and evidence requirement fields, but
   those are declared requirements. Effective provider/model resolution belongs
   to Dispatch And Execution, and confidence computation belongs to the Run
   Result Evaluator.

Three coding-domain sources deserve the same treatment:

1. `domains/coding/workflows/feature.yaml` is the source for the feature
   workflow's legal stage operations. `planning.validate-plan` should be read
   from here before any architectural question is asked.
2. `domains/coding/task-specs/*.md` are the task contracts. They should carry
   collaboration triggers and return-shape expectations.
3. `domains/coding/skills/*` are executor doctrine. They can describe how to do
   the work, but they do not own lifecycle movement or dispatch governance.
```

### Unified diff

```diff
--- docs/architect/component-boundary/component-boundary-advisory.md#7-contract-authority-matrix
+++ docs/platform/component-boundary.md#7-contract-authority-matrix
@@ -1,4 +1,4 @@
-## 7. Contract Authority Matrix
+#### 7. Contract Authority Matrix
 
 The existing contracts should be read as shared system contracts with explicit
 component ownership. A document may describe a chain across components, but the
@@ -11,17 +11,17 @@
 
 | Existing contract or rule | Primary owner | Important consumers | Ownership note |
 |---|---|---|---|
-| [Workflow Stage Operation Contract](../agent-coordination/contracts/workflow-stage-operation.md) | Domain Components And Extension Layer, as consumed by Work Lifecycle Engine | Agent Coordination Engine, Assignment Builder | Owns declared domain Work-stage operation normalization and compatibility. Coding Feature Workflow and Bugfix Workflow are coding-domain subcomponents, not Agent Coordination core. |
-| [FlowDefinition Contract](../agent-coordination/contracts/flow-definition.md) | Domain Components And Extension Layer, with validation consumed by Agent Coordination Engine | Team Cognition Engine, Work Lifecycle Engine, Dispatch/Execution | Owns schema/IR for graph, roles, actors, operations, profiles, and declared policy hints. It should not own runtime state, executor choice, or evidence truth. |
-| [CoordinationSession Contract](../agent-coordination/contracts/coordination-session.md) | Agent Coordination Engine | Team Cognition Engine, Dispatch/Execution, Run Result Evaluator, Work Lifecycle Engine | Owns session manifest, event stream, assignment membership, aggregate bounds, topology state, and recovery. It should reference Assignment/Run/RunResult records, not duplicate them. |
-| Assignment section of [Assignment, Run, And RunResult Contract](../agent-coordination/contracts/assignment-run-runresult.md) | Agent Coordination Engine / Assignment Builder | Domain Components And Extension Layer, Domain Harnesses, Dispatch/Execution | Owns immutable semantic request shape and provenance. It should freeze mutation/evidence/budget/policy inputs before dispatch. |
-| Run section of [Assignment, Run, And RunResult Contract](../agent-coordination/contracts/assignment-run-runresult.md) | Dispatch And Execution Engine | Run Result Evaluator, Host/Surface, Agent Coordination Engine | Owns one concrete attempt and its resolved DispatchPlan/mechanism metadata. It should not become semantic task identity. |
-| RunResult and Confidence sections of [Assignment, Run, And RunResult Contract](../agent-coordination/contracts/assignment-run-runresult.md) | Run Result Evaluator | Agent Coordination Engine, Work Lifecycle Engine, Team Cognition Engine | Owns normalized outcome, confidence, accepted/rejected evidence, and failure classification. It should not authorize lifecycle mutation. |
-| [Dispatch Control Plane](../agent-coordination/architecture/dispatch-control-plane.md) | Dispatch And Execution Engine | Agent Coordination Engine, Domain Components And Extension Layer, Host/Surface | Owns executor/provider/model/tier/mechanism/adapter/governance resolution. It should not choose semantic operations or interpret success. |
-| [Evidence And Result Architecture](../agent-coordination/architecture/evidence-and-results.md) | Run Result Evaluator | Dispatch/Execution, Agent Coordination Engine, Work Lifecycle Engine, Domain Components And Extension Layer | Owns confidence boundaries, evidence freshness, and false-success rules. Adapters and domain evidence policy should feed it evidence, not replace it. |
-| [Work Integration Boundaries](../agent-coordination/architecture/work-integration.md) | Work Lifecycle Engine | Agent Coordination Engine, Domain Components And Extension Layer, Run Result Evaluator | Owns the rule that only Work verbs move domain-agnostic Work lifecycle state. Domain-specific lifecycle effects such as coding merge/technical approval belong to the relevant domain component. Sessions and RunResults may inform drivers only. |
-| [Visibility And Herdr](../agent-coordination/architecture/visibility-and-herdr.md) | Host And Surface Layer | Dispatch/Execution, Run Result Evaluator, Agent Coordination Engine | Owns observation and operator visibility. It must consume canonical Run/RunResult state where possible and must not become truth. |
-| [ADR-007 Domain Harness Seam](../agent-coordination/decisions/ADR-007-domain-harness-seam-and-non-driving-inline-evidence.md) | Domain Components And Extension Layer | Assignment Builder, Agent Coordination Engine, Work Lifecycle Engine | Owns domain-specific enrichment/rejection before normalization. It may add constraints/evidence/policy hints, but may not dispatch or mutate lifecycle. |
+| [Workflow Stage Operation Contract](../architect/agent-coordination/contracts/workflow-stage-operation.md) | Domain Components And Extension Layer, as consumed by Work Lifecycle Engine | Agent Coordination Engine, Assignment Builder | Owns declared domain Work-stage operation normalization and compatibility. Coding Feature Workflow and Bugfix Workflow are coding-domain subcomponents, not Agent Coordination core. |
+| [FlowDefinition Contract](../architect/agent-coordination/contracts/flow-definition.md) | Domain Components And Extension Layer, with validation consumed by Agent Coordination Engine | Team Cognition Engine, Work Lifecycle Engine, Dispatch/Execution | Owns schema/IR for graph, roles, actors, operations, profiles, and declared policy hints. It should not own runtime state, executor choice, or evidence truth. |
+| [CoordinationSession Contract](../architect/agent-coordination/contracts/coordination-session.md) | Agent Coordination Engine | Team Cognition Engine, Dispatch/Execution, Run Result Evaluator, Work Lifecycle Engine | Owns session manifest, event stream, assignment membership, aggregate bounds, topology state, and recovery. It should reference Assignment/Run/RunResult records, not duplicate them. |
+| Assignment section of [Assignment, Run, And RunResult Contract](../architect/agent-coordination/contracts/assignment-run-runresult.md) | Agent Coordination Engine / Assignment Builder | Domain Components And Extension Layer, Domain Harnesses, Dispatch/Execution | Owns immutable semantic request shape and provenance. It should freeze mutation/evidence/budget/policy inputs before dispatch. |
+| Run section of [Assignment, Run, And RunResult Contract](../architect/agent-coordination/contracts/assignment-run-runresult.md) | Dispatch And Execution Engine | Run Result Evaluator, Host/Surface, Agent Coordination Engine | Owns one concrete attempt and its resolved DispatchPlan/mechanism metadata. It should not become semantic task identity. |
+| RunResult and Confidence sections of [Assignment, Run, And RunResult Contract](../architect/agent-coordination/contracts/assignment-run-runresult.md) | Run Result Evaluator | Agent Coordination Engine, Work Lifecycle Engine, Team Cognition Engine | Owns normalized outcome, confidence, accepted/rejected evidence, and failure classification. It should not authorize lifecycle mutation. |
+| [Dispatch Control Plane](../architect/agent-coordination/architecture/dispatch-control-plane.md) | Dispatch And Execution Engine | Agent Coordination Engine, Domain Components And Extension Layer, Host/Surface | Owns executor/provider/model/tier/mechanism/adapter/governance resolution. It should not choose semantic operations or interpret success. |
+| [Evidence And Result Architecture](../architect/agent-coordination/architecture/evidence-and-results.md) | Run Result Evaluator | Dispatch/Execution, Agent Coordination Engine, Work Lifecycle Engine, Domain Components And Extension Layer | Owns confidence boundaries, evidence freshness, and false-success rules. Adapters and domain evidence policy should feed it evidence, not replace it. |
+| [Work Integration Boundaries](../architect/agent-coordination/architecture/work-integration.md) | Work Lifecycle Engine | Agent Coordination Engine, Domain Components And Extension Layer, Run Result Evaluator | Owns the rule that only Work verbs move domain-agnostic Work lifecycle state. Domain-specific lifecycle effects such as coding merge/technical approval belong to the relevant domain component. Sessions and RunResults may inform drivers only. |
+| [Visibility And Herdr](../architect/agent-coordination/architecture/visibility-and-herdr.md) | Host And Surface Layer | Dispatch/Execution, Run Result Evaluator, Agent Coordination Engine | Owns observation and operator visibility. It must consume canonical Run/RunResult state where possible and must not become truth. |
+| [ADR-007 Domain Harness Seam](../architect/agent-coordination/decisions/ADR-007-domain-harness-seam-and-non-driving-inline-evidence.md) | Domain Components And Extension Layer | Assignment Builder, Agent Coordination Engine, Work Lifecycle Engine | Owns domain-specific enrichment/rejection before normalization. It may add constraints/evidence/policy hints, but may not dispatch or mutate lifecycle. |
 | Domain manifest and workflow declarations (`domains/<domain>/manifest.yaml`, `workflows/*.yaml`) | Domain Components And Extension Layer | Work Lifecycle Engine, Agent Coordination Engine, Assignment Builder, Dispatch And Execution Engine | Own stage vocabulary, legal operations, stage skill/taskSpec mapping, workflow selection, and domain policy hints. Other components read them; they do not reinterpret them. |
 | Domain task-specs (`domains/<domain>/task-specs/*.md`) | Domain Components And Extension Layer | Agent Coordination Engine, Assignment Builder, Skills, Run Result Evaluator | Own executable contract, collaboration triggers, required skill/agent hints, expected outputs, gates, and return shape for an operation. They are not runtime state and should not choose executor transport. |
 | Domain skills (`domains/<domain>/skills/*` or `.agents/skills/*`) | Domain Components And Extension Layer | Executors, Assignment Builder, Host/Surface | Own operational know-how for an executor. They must not silently replace task-spec authority, domain workflow legality, dispatch policy, or Work lifecycle verbs. |

```

## claim_a308864955bd4f2a7067191e4087a00a

Source: `docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-40`. Target: `docs/platform/component-boundary.md#unheaded-block-54`.

Mechanical class: Weak-exact. Source digest: `624f0470e956272b4aa288c111d0f175986229add08fe5739a0bf474e4503e8f`. Target digest: `624f0470e956272b4aa288c111d0f175986229add08fe5739a0bf474e4503e8f`.

Full shown source SHA256: `624f0470e956272b4aa288c111d0f175986229add08fe5739a0bf474e4503e8f`. Full shown target SHA256: `624f0470e956272b4aa288c111d0f175986229add08fe5739a0bf474e4503e8f`.

### Proposed decision

```json
{
  "claimId": "claim_a308864955bd4f2a7067191e4087a00a",
  "sourceUnitDigest": "624f0470e956272b4aa288c111d0f175986229add08fe5739a0bf474e4503e8f",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-54",
  "targetUnitDigest": "624f0470e956272b4aa288c111d0f175986229add08fe5739a0bf474e4503e8f",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: component-boundary-advisory source carriage",
    "fgOS Component Boundary Advisory",
    "7. Contract Authority Matrix"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-40 (lines 279–281) into docs/platform/component-boundary.md#unheaded-block-54 (lines 376–378), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
The existing contracts should be read as shared system contracts with explicit
component ownership. A document may describe a chain across components, but the
authority for each decision should still belong to one component.
```

### Full target shown text

```text
The existing contracts should be read as shared system contracts with explicit
component ownership. A document may describe a chain across components, but the
authority for each decision should still belong to one component.
```

### Unified diff

```diff
No text difference.
```

## claim_47bc7210839578adf19d5c75cdbc10bf

Source: `docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-41`. Target: `docs/platform/component-boundary.md#unheaded-block-55`.

Mechanical class: Weak-exact. Source digest: `03a1a58ed3626f8b56ac509d8f89f99f17fa5c7041929d9ec4dd46d464b9874a`. Target digest: `03a1a58ed3626f8b56ac509d8f89f99f17fa5c7041929d9ec4dd46d464b9874a`.

Full shown source SHA256: `03a1a58ed3626f8b56ac509d8f89f99f17fa5c7041929d9ec4dd46d464b9874a`. Full shown target SHA256: `03a1a58ed3626f8b56ac509d8f89f99f17fa5c7041929d9ec4dd46d464b9874a`.

### Proposed decision

```json
{
  "claimId": "claim_47bc7210839578adf19d5c75cdbc10bf",
  "sourceUnitDigest": "03a1a58ed3626f8b56ac509d8f89f99f17fa5c7041929d9ec4dd46d464b9874a",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-55",
  "targetUnitDigest": "03a1a58ed3626f8b56ac509d8f89f99f17fa5c7041929d9ec4dd46d464b9874a",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: component-boundary-advisory source carriage",
    "fgOS Component Boundary Advisory",
    "7. Contract Authority Matrix"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-41 (lines 283–286) into docs/platform/component-boundary.md#unheaded-block-55 (lines 380–383), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
In this advisory, a contract is not a component. A contract is the public
interface, schema, or invariant owned by the component that controls the
behavior. Other components interact through that contract and must not
re-derive it privately.
```

### Full target shown text

```text
In this advisory, a contract is not a component. A contract is the public
interface, schema, or invariant owned by the component that controls the
behavior. Other components interact through that contract and must not
re-derive it privately.
```

### Unified diff

```diff
No text difference.
```

## claim_ae47f4ebf4390cd7a05bc5455deb37ed

Source: `docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-42`. Target: `docs/platform/component-boundary.md#unheaded-block-56`.

Mechanical class: Judgment. Source digest: `f405dbc2b05c03968fce119fa06406015478ce173b757879a8544bcec0952c39`. Target digest: `06417e3a3ff67aff178b8e1cb564bcd32c7fc5032bdf1b738e4bf34313a0cff6`.

Full shown source SHA256: `f405dbc2b05c03968fce119fa06406015478ce173b757879a8544bcec0952c39`. Full shown target SHA256: `06417e3a3ff67aff178b8e1cb564bcd32c7fc5032bdf1b738e4bf34313a0cff6`.

### Proposed decision

```json
{
  "claimId": "claim_ae47f4ebf4390cd7a05bc5455deb37ed",
  "sourceUnitDigest": "f405dbc2b05c03968fce119fa06406015478ce173b757879a8544bcec0952c39",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-56",
  "targetUnitDigest": "06417e3a3ff67aff178b8e1cb564bcd32c7fc5032bdf1b738e4bf34313a0cff6",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: component-boundary-advisory source carriage",
    "fgOS Component Boundary Advisory",
    "7. Contract Authority Matrix"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Judgment: no target digest match. Carry the complete unheaded-block at docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-42 (lines 288–303) into docs/platform/component-boundary.md#unheaded-block-56 (lines 385–400), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. Digest differences come only from the recorded candidate header/frontmatter fence, heading-level shift or physical relative-link rebasing; full before/after units and line mapping are in authoring accounting. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
| Existing contract or rule | Primary owner | Important consumers | Ownership note |
|---|---|---|---|
| [Workflow Stage Operation Contract](../agent-coordination/contracts/workflow-stage-operation.md) | Domain Components And Extension Layer, as consumed by Work Lifecycle Engine | Agent Coordination Engine, Assignment Builder | Owns declared domain Work-stage operation normalization and compatibility. Coding Feature Workflow and Bugfix Workflow are coding-domain subcomponents, not Agent Coordination core. |
| [FlowDefinition Contract](../agent-coordination/contracts/flow-definition.md) | Domain Components And Extension Layer, with validation consumed by Agent Coordination Engine | Team Cognition Engine, Work Lifecycle Engine, Dispatch/Execution | Owns schema/IR for graph, roles, actors, operations, profiles, and declared policy hints. It should not own runtime state, executor choice, or evidence truth. |
| [CoordinationSession Contract](../agent-coordination/contracts/coordination-session.md) | Agent Coordination Engine | Team Cognition Engine, Dispatch/Execution, Run Result Evaluator, Work Lifecycle Engine | Owns session manifest, event stream, assignment membership, aggregate bounds, topology state, and recovery. It should reference Assignment/Run/RunResult records, not duplicate them. |
| Assignment section of [Assignment, Run, And RunResult Contract](../agent-coordination/contracts/assignment-run-runresult.md) | Agent Coordination Engine / Assignment Builder | Domain Components And Extension Layer, Domain Harnesses, Dispatch/Execution | Owns immutable semantic request shape and provenance. It should freeze mutation/evidence/budget/policy inputs before dispatch. |
| Run section of [Assignment, Run, And RunResult Contract](../agent-coordination/contracts/assignment-run-runresult.md) | Dispatch And Execution Engine | Run Result Evaluator, Host/Surface, Agent Coordination Engine | Owns one concrete attempt and its resolved DispatchPlan/mechanism metadata. It should not become semantic task identity. |
| RunResult and Confidence sections of [Assignment, Run, And RunResult Contract](../agent-coordination/contracts/assignment-run-runresult.md) | Run Result Evaluator | Agent Coordination Engine, Work Lifecycle Engine, Team Cognition Engine | Owns normalized outcome, confidence, accepted/rejected evidence, and failure classification. It should not authorize lifecycle mutation. |
| [Dispatch Control Plane](../agent-coordination/architecture/dispatch-control-plane.md) | Dispatch And Execution Engine | Agent Coordination Engine, Domain Components And Extension Layer, Host/Surface | Owns executor/provider/model/tier/mechanism/adapter/governance resolution. It should not choose semantic operations or interpret success. |
| [Evidence And Result Architecture](../agent-coordination/architecture/evidence-and-results.md) | Run Result Evaluator | Dispatch/Execution, Agent Coordination Engine, Work Lifecycle Engine, Domain Components And Extension Layer | Owns confidence boundaries, evidence freshness, and false-success rules. Adapters and domain evidence policy should feed it evidence, not replace it. |
| [Work Integration Boundaries](../agent-coordination/architecture/work-integration.md) | Work Lifecycle Engine | Agent Coordination Engine, Domain Components And Extension Layer, Run Result Evaluator | Owns the rule that only Work verbs move domain-agnostic Work lifecycle state. Domain-specific lifecycle effects such as coding merge/technical approval belong to the relevant domain component. Sessions and RunResults may inform drivers only. |
| [Visibility And Herdr](../agent-coordination/architecture/visibility-and-herdr.md) | Host And Surface Layer | Dispatch/Execution, Run Result Evaluator, Agent Coordination Engine | Owns observation and operator visibility. It must consume canonical Run/RunResult state where possible and must not become truth. |
| [ADR-007 Domain Harness Seam](../agent-coordination/decisions/ADR-007-domain-harness-seam-and-non-driving-inline-evidence.md) | Domain Components And Extension Layer | Assignment Builder, Agent Coordination Engine, Work Lifecycle Engine | Owns domain-specific enrichment/rejection before normalization. It may add constraints/evidence/policy hints, but may not dispatch or mutate lifecycle. |
| Domain manifest and workflow declarations (`domains/<domain>/manifest.yaml`, `workflows/*.yaml`) | Domain Components And Extension Layer | Work Lifecycle Engine, Agent Coordination Engine, Assignment Builder, Dispatch And Execution Engine | Own stage vocabulary, legal operations, stage skill/taskSpec mapping, workflow selection, and domain policy hints. Other components read them; they do not reinterpret them. |
| Domain task-specs (`domains/<domain>/task-specs/*.md`) | Domain Components And Extension Layer | Agent Coordination Engine, Assignment Builder, Skills, Run Result Evaluator | Own executable contract, collaboration triggers, required skill/agent hints, expected outputs, gates, and return shape for an operation. They are not runtime state and should not choose executor transport. |
| Domain skills (`domains/<domain>/skills/*` or `.agents/skills/*`) | Domain Components And Extension Layer | Executors, Assignment Builder, Host/Surface | Own operational know-how for an executor. They must not silently replace task-spec authority, domain workflow legality, dispatch policy, or Work lifecycle verbs. |
```

### Full target shown text

```text
| Existing contract or rule | Primary owner | Important consumers | Ownership note |
|---|---|---|---|
| [Workflow Stage Operation Contract](../architect/agent-coordination/contracts/workflow-stage-operation.md) | Domain Components And Extension Layer, as consumed by Work Lifecycle Engine | Agent Coordination Engine, Assignment Builder | Owns declared domain Work-stage operation normalization and compatibility. Coding Feature Workflow and Bugfix Workflow are coding-domain subcomponents, not Agent Coordination core. |
| [FlowDefinition Contract](../architect/agent-coordination/contracts/flow-definition.md) | Domain Components And Extension Layer, with validation consumed by Agent Coordination Engine | Team Cognition Engine, Work Lifecycle Engine, Dispatch/Execution | Owns schema/IR for graph, roles, actors, operations, profiles, and declared policy hints. It should not own runtime state, executor choice, or evidence truth. |
| [CoordinationSession Contract](../architect/agent-coordination/contracts/coordination-session.md) | Agent Coordination Engine | Team Cognition Engine, Dispatch/Execution, Run Result Evaluator, Work Lifecycle Engine | Owns session manifest, event stream, assignment membership, aggregate bounds, topology state, and recovery. It should reference Assignment/Run/RunResult records, not duplicate them. |
| Assignment section of [Assignment, Run, And RunResult Contract](../architect/agent-coordination/contracts/assignment-run-runresult.md) | Agent Coordination Engine / Assignment Builder | Domain Components And Extension Layer, Domain Harnesses, Dispatch/Execution | Owns immutable semantic request shape and provenance. It should freeze mutation/evidence/budget/policy inputs before dispatch. |
| Run section of [Assignment, Run, And RunResult Contract](../architect/agent-coordination/contracts/assignment-run-runresult.md) | Dispatch And Execution Engine | Run Result Evaluator, Host/Surface, Agent Coordination Engine | Owns one concrete attempt and its resolved DispatchPlan/mechanism metadata. It should not become semantic task identity. |
| RunResult and Confidence sections of [Assignment, Run, And RunResult Contract](../architect/agent-coordination/contracts/assignment-run-runresult.md) | Run Result Evaluator | Agent Coordination Engine, Work Lifecycle Engine, Team Cognition Engine | Owns normalized outcome, confidence, accepted/rejected evidence, and failure classification. It should not authorize lifecycle mutation. |
| [Dispatch Control Plane](../architect/agent-coordination/architecture/dispatch-control-plane.md) | Dispatch And Execution Engine | Agent Coordination Engine, Domain Components And Extension Layer, Host/Surface | Owns executor/provider/model/tier/mechanism/adapter/governance resolution. It should not choose semantic operations or interpret success. |
| [Evidence And Result Architecture](../architect/agent-coordination/architecture/evidence-and-results.md) | Run Result Evaluator | Dispatch/Execution, Agent Coordination Engine, Work Lifecycle Engine, Domain Components And Extension Layer | Owns confidence boundaries, evidence freshness, and false-success rules. Adapters and domain evidence policy should feed it evidence, not replace it. |
| [Work Integration Boundaries](../architect/agent-coordination/architecture/work-integration.md) | Work Lifecycle Engine | Agent Coordination Engine, Domain Components And Extension Layer, Run Result Evaluator | Owns the rule that only Work verbs move domain-agnostic Work lifecycle state. Domain-specific lifecycle effects such as coding merge/technical approval belong to the relevant domain component. Sessions and RunResults may inform drivers only. |
| [Visibility And Herdr](../architect/agent-coordination/architecture/visibility-and-herdr.md) | Host And Surface Layer | Dispatch/Execution, Run Result Evaluator, Agent Coordination Engine | Owns observation and operator visibility. It must consume canonical Run/RunResult state where possible and must not become truth. |
| [ADR-007 Domain Harness Seam](../architect/agent-coordination/decisions/ADR-007-domain-harness-seam-and-non-driving-inline-evidence.md) | Domain Components And Extension Layer | Assignment Builder, Agent Coordination Engine, Work Lifecycle Engine | Owns domain-specific enrichment/rejection before normalization. It may add constraints/evidence/policy hints, but may not dispatch or mutate lifecycle. |
| Domain manifest and workflow declarations (`domains/<domain>/manifest.yaml`, `workflows/*.yaml`) | Domain Components And Extension Layer | Work Lifecycle Engine, Agent Coordination Engine, Assignment Builder, Dispatch And Execution Engine | Own stage vocabulary, legal operations, stage skill/taskSpec mapping, workflow selection, and domain policy hints. Other components read them; they do not reinterpret them. |
| Domain task-specs (`domains/<domain>/task-specs/*.md`) | Domain Components And Extension Layer | Agent Coordination Engine, Assignment Builder, Skills, Run Result Evaluator | Own executable contract, collaboration triggers, required skill/agent hints, expected outputs, gates, and return shape for an operation. They are not runtime state and should not choose executor transport. |
| Domain skills (`domains/<domain>/skills/*` or `.agents/skills/*`) | Domain Components And Extension Layer | Executors, Assignment Builder, Host/Surface | Own operational know-how for an executor. They must not silently replace task-spec authority, domain workflow legality, dispatch policy, or Work lifecycle verbs. |
```

### Unified diff

```diff
--- docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-42
+++ docs/platform/component-boundary.md#unheaded-block-56
@@ -1,16 +1,16 @@
 | Existing contract or rule | Primary owner | Important consumers | Ownership note |
 |---|---|---|---|
-| [Workflow Stage Operation Contract](../agent-coordination/contracts/workflow-stage-operation.md) | Domain Components And Extension Layer, as consumed by Work Lifecycle Engine | Agent Coordination Engine, Assignment Builder | Owns declared domain Work-stage operation normalization and compatibility. Coding Feature Workflow and Bugfix Workflow are coding-domain subcomponents, not Agent Coordination core. |
-| [FlowDefinition Contract](../agent-coordination/contracts/flow-definition.md) | Domain Components And Extension Layer, with validation consumed by Agent Coordination Engine | Team Cognition Engine, Work Lifecycle Engine, Dispatch/Execution | Owns schema/IR for graph, roles, actors, operations, profiles, and declared policy hints. It should not own runtime state, executor choice, or evidence truth. |
-| [CoordinationSession Contract](../agent-coordination/contracts/coordination-session.md) | Agent Coordination Engine | Team Cognition Engine, Dispatch/Execution, Run Result Evaluator, Work Lifecycle Engine | Owns session manifest, event stream, assignment membership, aggregate bounds, topology state, and recovery. It should reference Assignment/Run/RunResult records, not duplicate them. |
-| Assignment section of [Assignment, Run, And RunResult Contract](../agent-coordination/contracts/assignment-run-runresult.md) | Agent Coordination Engine / Assignment Builder | Domain Components And Extension Layer, Domain Harnesses, Dispatch/Execution | Owns immutable semantic request shape and provenance. It should freeze mutation/evidence/budget/policy inputs before dispatch. |
-| Run section of [Assignment, Run, And RunResult Contract](../agent-coordination/contracts/assignment-run-runresult.md) | Dispatch And Execution Engine | Run Result Evaluator, Host/Surface, Agent Coordination Engine | Owns one concrete attempt and its resolved DispatchPlan/mechanism metadata. It should not become semantic task identity. |
-| RunResult and Confidence sections of [Assignment, Run, And RunResult Contract](../agent-coordination/contracts/assignment-run-runresult.md) | Run Result Evaluator | Agent Coordination Engine, Work Lifecycle Engine, Team Cognition Engine | Owns normalized outcome, confidence, accepted/rejected evidence, and failure classification. It should not authorize lifecycle mutation. |
-| [Dispatch Control Plane](../agent-coordination/architecture/dispatch-control-plane.md) | Dispatch And Execution Engine | Agent Coordination Engine, Domain Components And Extension Layer, Host/Surface | Owns executor/provider/model/tier/mechanism/adapter/governance resolution. It should not choose semantic operations or interpret success. |
-| [Evidence And Result Architecture](../agent-coordination/architecture/evidence-and-results.md) | Run Result Evaluator | Dispatch/Execution, Agent Coordination Engine, Work Lifecycle Engine, Domain Components And Extension Layer | Owns confidence boundaries, evidence freshness, and false-success rules. Adapters and domain evidence policy should feed it evidence, not replace it. |
-| [Work Integration Boundaries](../agent-coordination/architecture/work-integration.md) | Work Lifecycle Engine | Agent Coordination Engine, Domain Components And Extension Layer, Run Result Evaluator | Owns the rule that only Work verbs move domain-agnostic Work lifecycle state. Domain-specific lifecycle effects such as coding merge/technical approval belong to the relevant domain component. Sessions and RunResults may inform drivers only. |
-| [Visibility And Herdr](../agent-coordination/architecture/visibility-and-herdr.md) | Host And Surface Layer | Dispatch/Execution, Run Result Evaluator, Agent Coordination Engine | Owns observation and operator visibility. It must consume canonical Run/RunResult state where possible and must not become truth. |
-| [ADR-007 Domain Harness Seam](../agent-coordination/decisions/ADR-007-domain-harness-seam-and-non-driving-inline-evidence.md) | Domain Components And Extension Layer | Assignment Builder, Agent Coordination Engine, Work Lifecycle Engine | Owns domain-specific enrichment/rejection before normalization. It may add constraints/evidence/policy hints, but may not dispatch or mutate lifecycle. |
+| [Workflow Stage Operation Contract](../architect/agent-coordination/contracts/workflow-stage-operation.md) | Domain Components And Extension Layer, as consumed by Work Lifecycle Engine | Agent Coordination Engine, Assignment Builder | Owns declared domain Work-stage operation normalization and compatibility. Coding Feature Workflow and Bugfix Workflow are coding-domain subcomponents, not Agent Coordination core. |
+| [FlowDefinition Contract](../architect/agent-coordination/contracts/flow-definition.md) | Domain Components And Extension Layer, with validation consumed by Agent Coordination Engine | Team Cognition Engine, Work Lifecycle Engine, Dispatch/Execution | Owns schema/IR for graph, roles, actors, operations, profiles, and declared policy hints. It should not own runtime state, executor choice, or evidence truth. |
+| [CoordinationSession Contract](../architect/agent-coordination/contracts/coordination-session.md) | Agent Coordination Engine | Team Cognition Engine, Dispatch/Execution, Run Result Evaluator, Work Lifecycle Engine | Owns session manifest, event stream, assignment membership, aggregate bounds, topology state, and recovery. It should reference Assignment/Run/RunResult records, not duplicate them. |
+| Assignment section of [Assignment, Run, And RunResult Contract](../architect/agent-coordination/contracts/assignment-run-runresult.md) | Agent Coordination Engine / Assignment Builder | Domain Components And Extension Layer, Domain Harnesses, Dispatch/Execution | Owns immutable semantic request shape and provenance. It should freeze mutation/evidence/budget/policy inputs before dispatch. |
+| Run section of [Assignment, Run, And RunResult Contract](../architect/agent-coordination/contracts/assignment-run-runresult.md) | Dispatch And Execution Engine | Run Result Evaluator, Host/Surface, Agent Coordination Engine | Owns one concrete attempt and its resolved DispatchPlan/mechanism metadata. It should not become semantic task identity. |
+| RunResult and Confidence sections of [Assignment, Run, And RunResult Contract](../architect/agent-coordination/contracts/assignment-run-runresult.md) | Run Result Evaluator | Agent Coordination Engine, Work Lifecycle Engine, Team Cognition Engine | Owns normalized outcome, confidence, accepted/rejected evidence, and failure classification. It should not authorize lifecycle mutation. |
+| [Dispatch Control Plane](../architect/agent-coordination/architecture/dispatch-control-plane.md) | Dispatch And Execution Engine | Agent Coordination Engine, Domain Components And Extension Layer, Host/Surface | Owns executor/provider/model/tier/mechanism/adapter/governance resolution. It should not choose semantic operations or interpret success. |
+| [Evidence And Result Architecture](../architect/agent-coordination/architecture/evidence-and-results.md) | Run Result Evaluator | Dispatch/Execution, Agent Coordination Engine, Work Lifecycle Engine, Domain Components And Extension Layer | Owns confidence boundaries, evidence freshness, and false-success rules. Adapters and domain evidence policy should feed it evidence, not replace it. |
+| [Work Integration Boundaries](../architect/agent-coordination/architecture/work-integration.md) | Work Lifecycle Engine | Agent Coordination Engine, Domain Components And Extension Layer, Run Result Evaluator | Owns the rule that only Work verbs move domain-agnostic Work lifecycle state. Domain-specific lifecycle effects such as coding merge/technical approval belong to the relevant domain component. Sessions and RunResults may inform drivers only. |
+| [Visibility And Herdr](../architect/agent-coordination/architecture/visibility-and-herdr.md) | Host And Surface Layer | Dispatch/Execution, Run Result Evaluator, Agent Coordination Engine | Owns observation and operator visibility. It must consume canonical Run/RunResult state where possible and must not become truth. |
+| [ADR-007 Domain Harness Seam](../architect/agent-coordination/decisions/ADR-007-domain-harness-seam-and-non-driving-inline-evidence.md) | Domain Components And Extension Layer | Assignment Builder, Agent Coordination Engine, Work Lifecycle Engine | Owns domain-specific enrichment/rejection before normalization. It may add constraints/evidence/policy hints, but may not dispatch or mutate lifecycle. |
 | Domain manifest and workflow declarations (`domains/<domain>/manifest.yaml`, `workflows/*.yaml`) | Domain Components And Extension Layer | Work Lifecycle Engine, Agent Coordination Engine, Assignment Builder, Dispatch And Execution Engine | Own stage vocabulary, legal operations, stage skill/taskSpec mapping, workflow selection, and domain policy hints. Other components read them; they do not reinterpret them. |
 | Domain task-specs (`domains/<domain>/task-specs/*.md`) | Domain Components And Extension Layer | Agent Coordination Engine, Assignment Builder, Skills, Run Result Evaluator | Own executable contract, collaboration triggers, required skill/agent hints, expected outputs, gates, and return shape for an operation. They are not runtime state and should not choose executor transport. |
 | Domain skills (`domains/<domain>/skills/*` or `.agents/skills/*`) | Domain Components And Extension Layer | Executors, Assignment Builder, Host/Surface | Own operational know-how for an executor. They must not silently replace task-spec authority, domain workflow legality, dispatch policy, or Work lifecycle verbs. |

```

## claim_e4c5c8bed3b38df479ea7bb9fbc237c3

Source: `docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-43`. Target: `docs/platform/component-boundary.md#unheaded-block-57`.

Mechanical class: Weak-exact. Source digest: `027f2e8fb26217eb7e0fd7820c355e06c31c9c42897b4cbf11904518ab14e376`. Target digest: `027f2e8fb26217eb7e0fd7820c355e06c31c9c42897b4cbf11904518ab14e376`.

Full shown source SHA256: `027f2e8fb26217eb7e0fd7820c355e06c31c9c42897b4cbf11904518ab14e376`. Full shown target SHA256: `027f2e8fb26217eb7e0fd7820c355e06c31c9c42897b4cbf11904518ab14e376`.

### Proposed decision

```json
{
  "claimId": "claim_e4c5c8bed3b38df479ea7bb9fbc237c3",
  "sourceUnitDigest": "027f2e8fb26217eb7e0fd7820c355e06c31c9c42897b4cbf11904518ab14e376",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-57",
  "targetUnitDigest": "027f2e8fb26217eb7e0fd7820c355e06c31c9c42897b4cbf11904518ab14e376",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: component-boundary-advisory source carriage",
    "fgOS Component Boundary Advisory",
    "7. Contract Authority Matrix"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-43 (lines 305–305) into docs/platform/component-boundary.md#unheaded-block-57 (lines 402–402), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
Two contract files deserve special care:
```

### Full target shown text

```text
Two contract files deserve special care:
```

### Unified diff

```diff
No text difference.
```

## claim_994d4c5378ce61e03cd8ccd47bf199e2

Source: `docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-44`. Target: `docs/platform/component-boundary.md#unheaded-block-58`.

Mechanical class: Weak-exact. Source digest: `ce9fedaff71e7f78a97813fd6ea31e52c50d38250d56c929852825ecde7eefcc`. Target digest: `ce9fedaff71e7f78a97813fd6ea31e52c50d38250d56c929852825ecde7eefcc`.

Full shown source SHA256: `ce9fedaff71e7f78a97813fd6ea31e52c50d38250d56c929852825ecde7eefcc`. Full shown target SHA256: `ce9fedaff71e7f78a97813fd6ea31e52c50d38250d56c929852825ecde7eefcc`.

### Proposed decision

```json
{
  "claimId": "claim_994d4c5378ce61e03cd8ccd47bf199e2",
  "sourceUnitDigest": "ce9fedaff71e7f78a97813fd6ea31e52c50d38250d56c929852825ecde7eefcc",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-58",
  "targetUnitDigest": "ce9fedaff71e7f78a97813fd6ea31e52c50d38250d56c929852825ecde7eefcc",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: component-boundary-advisory source carriage",
    "fgOS Component Boundary Advisory",
    "7. Contract Authority Matrix"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-44 (lines 307–313) into docs/platform/component-boundary.md#unheaded-block-58 (lines 404–410), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
1. `assignment-run-runresult.md` is a chain contract, not a single-component
   ownership contract. Assignment, Run, and RunResult should remain separate
   authority boundaries even if they are documented together.
2. `flow-definition.md` carries policy and evidence requirement fields, but
   those are declared requirements. Effective provider/model resolution belongs
   to Dispatch And Execution, and confidence computation belongs to the Run
   Result Evaluator.
```

### Full target shown text

```text
1. `assignment-run-runresult.md` is a chain contract, not a single-component
   ownership contract. Assignment, Run, and RunResult should remain separate
   authority boundaries even if they are documented together.
2. `flow-definition.md` carries policy and evidence requirement fields, but
   those are declared requirements. Effective provider/model resolution belongs
   to Dispatch And Execution, and confidence computation belongs to the Run
   Result Evaluator.
```

### Unified diff

```diff
No text difference.
```

## claim_6f83af3c565fff22a6cee290af3a51c8

Source: `docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-45`. Target: `docs/platform/component-boundary.md#unheaded-block-59`.

Mechanical class: Weak-exact. Source digest: `143f6028eea6acd074e646e1e7d0a25e46033f231a37aa5b71110ea2b563b17b`. Target digest: `143f6028eea6acd074e646e1e7d0a25e46033f231a37aa5b71110ea2b563b17b`.

Full shown source SHA256: `143f6028eea6acd074e646e1e7d0a25e46033f231a37aa5b71110ea2b563b17b`. Full shown target SHA256: `143f6028eea6acd074e646e1e7d0a25e46033f231a37aa5b71110ea2b563b17b`.

### Proposed decision

```json
{
  "claimId": "claim_6f83af3c565fff22a6cee290af3a51c8",
  "sourceUnitDigest": "143f6028eea6acd074e646e1e7d0a25e46033f231a37aa5b71110ea2b563b17b",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-59",
  "targetUnitDigest": "143f6028eea6acd074e646e1e7d0a25e46033f231a37aa5b71110ea2b563b17b",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: component-boundary-advisory source carriage",
    "fgOS Component Boundary Advisory",
    "7. Contract Authority Matrix"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-45 (lines 315–315) into docs/platform/component-boundary.md#unheaded-block-59 (lines 412–412), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
Three coding-domain sources deserve the same treatment:
```

### Full target shown text

```text
Three coding-domain sources deserve the same treatment:
```

### Unified diff

```diff
No text difference.
```

## claim_cee2da46ee6b12adfbebaa8505598d19

Source: `docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-46`. Target: `docs/platform/component-boundary.md#unheaded-block-60`.

Mechanical class: Weak-exact. Source digest: `039a6bbc05030558465bd244a7c9cb8d2f6f3db067b716209b51023fddb35127`. Target digest: `039a6bbc05030558465bd244a7c9cb8d2f6f3db067b716209b51023fddb35127`.

Full shown source SHA256: `039a6bbc05030558465bd244a7c9cb8d2f6f3db067b716209b51023fddb35127`. Full shown target SHA256: `039a6bbc05030558465bd244a7c9cb8d2f6f3db067b716209b51023fddb35127`.

### Proposed decision

```json
{
  "claimId": "claim_cee2da46ee6b12adfbebaa8505598d19",
  "sourceUnitDigest": "039a6bbc05030558465bd244a7c9cb8d2f6f3db067b716209b51023fddb35127",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-60",
  "targetUnitDigest": "039a6bbc05030558465bd244a7c9cb8d2f6f3db067b716209b51023fddb35127",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: component-boundary-advisory source carriage",
    "fgOS Component Boundary Advisory",
    "7. Contract Authority Matrix"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-46 (lines 317–323) into docs/platform/component-boundary.md#unheaded-block-60 (lines 414–420), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
1. `domains/coding/workflows/feature.yaml` is the source for the feature
   workflow's legal stage operations. `planning.validate-plan` should be read
   from here before any architectural question is asked.
2. `domains/coding/task-specs/*.md` are the task contracts. They should carry
   collaboration triggers and return-shape expectations.
3. `domains/coding/skills/*` are executor doctrine. They can describe how to do
   the work, but they do not own lifecycle movement or dispatch governance.
```

### Full target shown text

```text
1. `domains/coding/workflows/feature.yaml` is the source for the feature
   workflow's legal stage operations. `planning.validate-plan` should be read
   from here before any architectural question is asked.
2. `domains/coding/task-specs/*.md` are the task contracts. They should carry
   collaboration triggers and return-shape expectations.
3. `domains/coding/skills/*` are executor doctrine. They can describe how to do
   the work, but they do not own lifecycle movement or dispatch governance.
```

### Unified diff

```diff
No text difference.
```

## claim_fe1e3cdfa133bbe5a28323f30047167b

Source: `docs/architect/component-boundary/component-boundary-advisory.md#8-internal-boundary-map`. Target: `docs/platform/component-boundary.md#8-internal-boundary-map`.

Mechanical class: Judgment. Source digest: `53819fec5c873f914692383691e9f8502d8391b6ccaa38532c2dcb1cb4f74405`. Target digest: `a9dfd52ce5279d1126f5acff4866e16263c4d65ac6777f2a6a2e692afefce479`.

Full shown source SHA256: `7e67f1a7b578c5346d6b8c195e38463f213b4c3f72c1a49f443a7ac614fd216a`. Full shown target SHA256: `8aecaf453bbb01edff3cc8c22bd7ec3f09560128e51462d2622cd0adfada3a24`.

### Proposed decision

```json
{
  "claimId": "claim_fe1e3cdfa133bbe5a28323f30047167b",
  "sourceUnitDigest": "53819fec5c873f914692383691e9f8502d8391b6ccaa38532c2dcb1cb4f74405",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "8-internal-boundary-map",
  "targetUnitDigest": "a9dfd52ce5279d1126f5acff4866e16263c4d65ac6777f2a6a2e692afefce479",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: component-boundary-advisory source carriage",
    "fgOS Component Boundary Advisory"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Judgment: no target digest match. Carry the complete heading at docs/architect/component-boundary/component-boundary-advisory.md#8-internal-boundary-map (lines 325–325) into docs/platform/component-boundary.md#8-internal-boundary-map (lines 422–422), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. Digest differences come only from the recorded candidate header/frontmatter fence, heading-level shift or physical relative-link rebasing; full before/after units and line mapping are in authoring accounting. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
## 8. Internal Boundary Map

These are lower-level boundaries that can live inside the high-level components
above. Some are bounded contexts with their own vocabulary and model; some are
authority boundaries that may remain as explicit ports, contracts, or policy
checks rather than standalone modules.

| Boundary | Type | Likely component | Owns | Must not own |
|---|---|---|---|---|
| Work Lifecycle | Bounded context + authority boundary | Work Lifecycle Engine | Work identity, status, stage, claim/return, related refs, context, documents, human gates, lifecycle verbs. | Agent runtime, task graph progress, executor selection, evidence confidence, domain-specific merge/worktree behavior. |
| Coordination Session Runtime | Bounded context | Agent Coordination Engine | One bounded coordination invocation, session manifest, event stream, AdhocTask graph, topology, budgets, recovery, synthesis boundary. | Work lifecycle mutation, provider/model execution choice, domain-specific branch authority. |
| Team Cognition Engine | Bounded context | Agent Coordination Engine | Runtime group reasoning: choose consult/research/debate/brainstorm/peer-review strategy, allocate semantic cohorts, manage visibility policy, and propose synthesis strategy. | Dispatch bypass, protocol schema ownership, canonical runtime record ownership, Work lifecycle. |
| Protocol Package / Definition | Extension boundary | Domain Components And Extension Layer | Reusable declared collaboration recipes: consult, research, debate, brainstorm, leader-worker, peer review, legal phases, operations, topology, and policy hints. | Runtime reasoning/adaptation, session persistence, executor choice, evidence truth. |
| Coding Domain Component | Domain component | Domain Components And Extension Layer | Coding-specific core, Feature Workflow, Bugfix Workflow, coding harness, coding evidence adapters, repository/resource model, worktree/merge behavior, technical approval gates. | Generic coordination runtime, direct executor launch, domain-agnostic Work lifecycle mutation outside Work verbs. |
| Coding Feature Workflow | Domain subcomponent | Coding Domain Component | Feature-specific stages, legal operations, TaskSpecs, Skills, and planning doctrine. | Bugfix-specific lifecycle semantics, generic Work state engine, direct executor launch. |
| Bugfix Workflow | Domain subcomponent | Coding Domain Component | Bugfix-specific stages such as reproduce/diagnose/fix/verify/review, operations, TaskSpecs, Skills, and verification doctrine. | Feature-specific planning semantics, generic Work state engine, direct executor launch. |
| Stage Operation Choice | Authority boundary | Work Lifecycle Engine, interpreting Domain workflow declarations | Select the next legal operation for the current Work stage from declared domain workflow operations and current evidence signals. | Declaring new operations, choosing concrete executor/provider/model, computing RunResult confidence. |
| Execution Contract / Assignment Builder | Authority boundary | Agent Coordination Engine | Convert declared operation or validated inline contract into immutable Assignment snapshot with provenance, mutation, evidence, budget, role, and policy inputs. | Dispatch target choice, retry lifecycle, Work mutation. |
| Dispatch Control Plane | Bounded context + authority boundary | Dispatch And Execution Engine | Resolve Assignment policy into DispatchPlan: executor, provider, model, tier, mechanism, adapter, governance, egress. Routes on exactly two identities, capability and executor-id — see the canonical [Dispatch Control Plane](../agent-coordination/architecture/dispatch-control-plane.md) doc for the accepted DispatchRequest/PolicyPatch/DispatchPlan contracts and component-internal ownership list. | Choosing semantic operation, interpreting task success, mutating lifecycle. |
| Execution Adapters | Adapter boundary | Dispatch And Execution Engine | Deliver one approved Run through CLI, Herdr, MCP, API, or future native mechanism. | Policy decision, evidence confidence, Work state. |
| Run Runtime | Authority boundary | Dispatch And Execution Engine | One attempt, settlement, timeout, cancellation, retry boundary, process/transport metadata. | Semantic task identity, evidence truth, lifecycle progression. |
| Run Result Evaluation | Bounded context + authority boundary | Run Result Evaluator | Parse worker claim, collect/validate artifacts, compute confidence, produce RunResult. | Launching executors, choosing providers, approving Work. |
| Domain Harnesses | Extension boundary + authority boundary | Domain Components And Extension Layer | Domain knowledge, resource/conflict/isolation advice, domain evidence rules, Work integration policy. | Generic execution core, provider launch, hidden lifecycle authority. |
| Visibility / Herdr | Adapter boundary | Host And Surface Layer | Pane/process observation, operator visibility, diagnostics, live intervention surface. | Runtime truth, evidence authority, lifecycle authority. |
```

### Full target shown text

```text
#### 8. Internal Boundary Map

These are lower-level boundaries that can live inside the high-level components
above. Some are bounded contexts with their own vocabulary and model; some are
authority boundaries that may remain as explicit ports, contracts, or policy
checks rather than standalone modules.

| Boundary | Type | Likely component | Owns | Must not own |
|---|---|---|---|---|
| Work Lifecycle | Bounded context + authority boundary | Work Lifecycle Engine | Work identity, status, stage, claim/return, related refs, context, documents, human gates, lifecycle verbs. | Agent runtime, task graph progress, executor selection, evidence confidence, domain-specific merge/worktree behavior. |
| Coordination Session Runtime | Bounded context | Agent Coordination Engine | One bounded coordination invocation, session manifest, event stream, AdhocTask graph, topology, budgets, recovery, synthesis boundary. | Work lifecycle mutation, provider/model execution choice, domain-specific branch authority. |
| Team Cognition Engine | Bounded context | Agent Coordination Engine | Runtime group reasoning: choose consult/research/debate/brainstorm/peer-review strategy, allocate semantic cohorts, manage visibility policy, and propose synthesis strategy. | Dispatch bypass, protocol schema ownership, canonical runtime record ownership, Work lifecycle. |
| Protocol Package / Definition | Extension boundary | Domain Components And Extension Layer | Reusable declared collaboration recipes: consult, research, debate, brainstorm, leader-worker, peer review, legal phases, operations, topology, and policy hints. | Runtime reasoning/adaptation, session persistence, executor choice, evidence truth. |
| Coding Domain Component | Domain component | Domain Components And Extension Layer | Coding-specific core, Feature Workflow, Bugfix Workflow, coding harness, coding evidence adapters, repository/resource model, worktree/merge behavior, technical approval gates. | Generic coordination runtime, direct executor launch, domain-agnostic Work lifecycle mutation outside Work verbs. |
| Coding Feature Workflow | Domain subcomponent | Coding Domain Component | Feature-specific stages, legal operations, TaskSpecs, Skills, and planning doctrine. | Bugfix-specific lifecycle semantics, generic Work state engine, direct executor launch. |
| Bugfix Workflow | Domain subcomponent | Coding Domain Component | Bugfix-specific stages such as reproduce/diagnose/fix/verify/review, operations, TaskSpecs, Skills, and verification doctrine. | Feature-specific planning semantics, generic Work state engine, direct executor launch. |
| Stage Operation Choice | Authority boundary | Work Lifecycle Engine, interpreting Domain workflow declarations | Select the next legal operation for the current Work stage from declared domain workflow operations and current evidence signals. | Declaring new operations, choosing concrete executor/provider/model, computing RunResult confidence. |
| Execution Contract / Assignment Builder | Authority boundary | Agent Coordination Engine | Convert declared operation or validated inline contract into immutable Assignment snapshot with provenance, mutation, evidence, budget, role, and policy inputs. | Dispatch target choice, retry lifecycle, Work mutation. |
| Dispatch Control Plane | Bounded context + authority boundary | Dispatch And Execution Engine | Resolve Assignment policy into DispatchPlan: executor, provider, model, tier, mechanism, adapter, governance, egress. Routes on exactly two identities, capability and executor-id — see the canonical [Dispatch Control Plane](../architect/agent-coordination/architecture/dispatch-control-plane.md) doc for the accepted DispatchRequest/PolicyPatch/DispatchPlan contracts and component-internal ownership list. | Choosing semantic operation, interpreting task success, mutating lifecycle. |
| Execution Adapters | Adapter boundary | Dispatch And Execution Engine | Deliver one approved Run through CLI, Herdr, MCP, API, or future native mechanism. | Policy decision, evidence confidence, Work state. |
| Run Runtime | Authority boundary | Dispatch And Execution Engine | One attempt, settlement, timeout, cancellation, retry boundary, process/transport metadata. | Semantic task identity, evidence truth, lifecycle progression. |
| Run Result Evaluation | Bounded context + authority boundary | Run Result Evaluator | Parse worker claim, collect/validate artifacts, compute confidence, produce RunResult. | Launching executors, choosing providers, approving Work. |
| Domain Harnesses | Extension boundary + authority boundary | Domain Components And Extension Layer | Domain knowledge, resource/conflict/isolation advice, domain evidence rules, Work integration policy. | Generic execution core, provider launch, hidden lifecycle authority. |
| Visibility / Herdr | Adapter boundary | Host And Surface Layer | Pane/process observation, operator visibility, diagnostics, live intervention surface. | Runtime truth, evidence authority, lifecycle authority. |
```

### Unified diff

```diff
--- docs/architect/component-boundary/component-boundary-advisory.md#8-internal-boundary-map
+++ docs/platform/component-boundary.md#8-internal-boundary-map
@@ -1,4 +1,4 @@
-## 8. Internal Boundary Map
+#### 8. Internal Boundary Map
 
 These are lower-level boundaries that can live inside the high-level components
 above. Some are bounded contexts with their own vocabulary and model; some are
@@ -16,7 +16,7 @@
 | Bugfix Workflow | Domain subcomponent | Coding Domain Component | Bugfix-specific stages such as reproduce/diagnose/fix/verify/review, operations, TaskSpecs, Skills, and verification doctrine. | Feature-specific planning semantics, generic Work state engine, direct executor launch. |
 | Stage Operation Choice | Authority boundary | Work Lifecycle Engine, interpreting Domain workflow declarations | Select the next legal operation for the current Work stage from declared domain workflow operations and current evidence signals. | Declaring new operations, choosing concrete executor/provider/model, computing RunResult confidence. |
 | Execution Contract / Assignment Builder | Authority boundary | Agent Coordination Engine | Convert declared operation or validated inline contract into immutable Assignment snapshot with provenance, mutation, evidence, budget, role, and policy inputs. | Dispatch target choice, retry lifecycle, Work mutation. |
-| Dispatch Control Plane | Bounded context + authority boundary | Dispatch And Execution Engine | Resolve Assignment policy into DispatchPlan: executor, provider, model, tier, mechanism, adapter, governance, egress. Routes on exactly two identities, capability and executor-id — see the canonical [Dispatch Control Plane](../agent-coordination/architecture/dispatch-control-plane.md) doc for the accepted DispatchRequest/PolicyPatch/DispatchPlan contracts and component-internal ownership list. | Choosing semantic operation, interpreting task success, mutating lifecycle. |
+| Dispatch Control Plane | Bounded context + authority boundary | Dispatch And Execution Engine | Resolve Assignment policy into DispatchPlan: executor, provider, model, tier, mechanism, adapter, governance, egress. Routes on exactly two identities, capability and executor-id — see the canonical [Dispatch Control Plane](../architect/agent-coordination/architecture/dispatch-control-plane.md) doc for the accepted DispatchRequest/PolicyPatch/DispatchPlan contracts and component-internal ownership list. | Choosing semantic operation, interpreting task success, mutating lifecycle. |
 | Execution Adapters | Adapter boundary | Dispatch And Execution Engine | Deliver one approved Run through CLI, Herdr, MCP, API, or future native mechanism. | Policy decision, evidence confidence, Work state. |
 | Run Runtime | Authority boundary | Dispatch And Execution Engine | One attempt, settlement, timeout, cancellation, retry boundary, process/transport metadata. | Semantic task identity, evidence truth, lifecycle progression. |
 | Run Result Evaluation | Bounded context + authority boundary | Run Result Evaluator | Parse worker claim, collect/validate artifacts, compute confidence, produce RunResult. | Launching executors, choosing providers, approving Work. |

```

## claim_e34280f4e5259d4bc456ed92df61b1f8

Source: `docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-47`. Target: `docs/platform/component-boundary.md#unheaded-block-61`.

Mechanical class: Weak-exact. Source digest: `e1e06122c7338e94d1bd360b83b455ea69f6a538127efe50836a045c70bc3d19`. Target digest: `e1e06122c7338e94d1bd360b83b455ea69f6a538127efe50836a045c70bc3d19`.

Full shown source SHA256: `e1e06122c7338e94d1bd360b83b455ea69f6a538127efe50836a045c70bc3d19`. Full shown target SHA256: `e1e06122c7338e94d1bd360b83b455ea69f6a538127efe50836a045c70bc3d19`.

### Proposed decision

```json
{
  "claimId": "claim_e34280f4e5259d4bc456ed92df61b1f8",
  "sourceUnitDigest": "e1e06122c7338e94d1bd360b83b455ea69f6a538127efe50836a045c70bc3d19",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-61",
  "targetUnitDigest": "e1e06122c7338e94d1bd360b83b455ea69f6a538127efe50836a045c70bc3d19",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: component-boundary-advisory source carriage",
    "fgOS Component Boundary Advisory",
    "8. Internal Boundary Map"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-47 (lines 327–330) into docs/platform/component-boundary.md#unheaded-block-61 (lines 424–427), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
These are lower-level boundaries that can live inside the high-level components
above. Some are bounded contexts with their own vocabulary and model; some are
authority boundaries that may remain as explicit ports, contracts, or policy
checks rather than standalone modules.
```

### Full target shown text

```text
These are lower-level boundaries that can live inside the high-level components
above. Some are bounded contexts with their own vocabulary and model; some are
authority boundaries that may remain as explicit ports, contracts, or policy
checks rather than standalone modules.
```

### Unified diff

```diff
No text difference.
```

## claim_83174b29e18380691596cf50df35f0d6

Source: `docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-48`. Target: `docs/platform/component-boundary.md#unheaded-block-62`.

Mechanical class: Judgment. Source digest: `de190045ef2bc52875604ab9757970853b38e8a471846458aec06790108205b8`. Target digest: `0fbb26b5b55ac7b4a59c5822c3a1d8b7d79929464f29ff7217e322b46e2b7d63`.

Full shown source SHA256: `de190045ef2bc52875604ab9757970853b38e8a471846458aec06790108205b8`. Full shown target SHA256: `0fbb26b5b55ac7b4a59c5822c3a1d8b7d79929464f29ff7217e322b46e2b7d63`.

### Proposed decision

```json
{
  "claimId": "claim_83174b29e18380691596cf50df35f0d6",
  "sourceUnitDigest": "de190045ef2bc52875604ab9757970853b38e8a471846458aec06790108205b8",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-62",
  "targetUnitDigest": "0fbb26b5b55ac7b4a59c5822c3a1d8b7d79929464f29ff7217e322b46e2b7d63",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: component-boundary-advisory source carriage",
    "fgOS Component Boundary Advisory",
    "8. Internal Boundary Map"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Judgment: no target digest match. Carry the complete unheaded-block at docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-48 (lines 332–348) into docs/platform/component-boundary.md#unheaded-block-62 (lines 429–445), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. Digest differences come only from the recorded candidate header/frontmatter fence, heading-level shift or physical relative-link rebasing; full before/after units and line mapping are in authoring accounting. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
| Boundary | Type | Likely component | Owns | Must not own |
|---|---|---|---|---|
| Work Lifecycle | Bounded context + authority boundary | Work Lifecycle Engine | Work identity, status, stage, claim/return, related refs, context, documents, human gates, lifecycle verbs. | Agent runtime, task graph progress, executor selection, evidence confidence, domain-specific merge/worktree behavior. |
| Coordination Session Runtime | Bounded context | Agent Coordination Engine | One bounded coordination invocation, session manifest, event stream, AdhocTask graph, topology, budgets, recovery, synthesis boundary. | Work lifecycle mutation, provider/model execution choice, domain-specific branch authority. |
| Team Cognition Engine | Bounded context | Agent Coordination Engine | Runtime group reasoning: choose consult/research/debate/brainstorm/peer-review strategy, allocate semantic cohorts, manage visibility policy, and propose synthesis strategy. | Dispatch bypass, protocol schema ownership, canonical runtime record ownership, Work lifecycle. |
| Protocol Package / Definition | Extension boundary | Domain Components And Extension Layer | Reusable declared collaboration recipes: consult, research, debate, brainstorm, leader-worker, peer review, legal phases, operations, topology, and policy hints. | Runtime reasoning/adaptation, session persistence, executor choice, evidence truth. |
| Coding Domain Component | Domain component | Domain Components And Extension Layer | Coding-specific core, Feature Workflow, Bugfix Workflow, coding harness, coding evidence adapters, repository/resource model, worktree/merge behavior, technical approval gates. | Generic coordination runtime, direct executor launch, domain-agnostic Work lifecycle mutation outside Work verbs. |
| Coding Feature Workflow | Domain subcomponent | Coding Domain Component | Feature-specific stages, legal operations, TaskSpecs, Skills, and planning doctrine. | Bugfix-specific lifecycle semantics, generic Work state engine, direct executor launch. |
| Bugfix Workflow | Domain subcomponent | Coding Domain Component | Bugfix-specific stages such as reproduce/diagnose/fix/verify/review, operations, TaskSpecs, Skills, and verification doctrine. | Feature-specific planning semantics, generic Work state engine, direct executor launch. |
| Stage Operation Choice | Authority boundary | Work Lifecycle Engine, interpreting Domain workflow declarations | Select the next legal operation for the current Work stage from declared domain workflow operations and current evidence signals. | Declaring new operations, choosing concrete executor/provider/model, computing RunResult confidence. |
| Execution Contract / Assignment Builder | Authority boundary | Agent Coordination Engine | Convert declared operation or validated inline contract into immutable Assignment snapshot with provenance, mutation, evidence, budget, role, and policy inputs. | Dispatch target choice, retry lifecycle, Work mutation. |
| Dispatch Control Plane | Bounded context + authority boundary | Dispatch And Execution Engine | Resolve Assignment policy into DispatchPlan: executor, provider, model, tier, mechanism, adapter, governance, egress. Routes on exactly two identities, capability and executor-id — see the canonical [Dispatch Control Plane](../agent-coordination/architecture/dispatch-control-plane.md) doc for the accepted DispatchRequest/PolicyPatch/DispatchPlan contracts and component-internal ownership list. | Choosing semantic operation, interpreting task success, mutating lifecycle. |
| Execution Adapters | Adapter boundary | Dispatch And Execution Engine | Deliver one approved Run through CLI, Herdr, MCP, API, or future native mechanism. | Policy decision, evidence confidence, Work state. |
| Run Runtime | Authority boundary | Dispatch And Execution Engine | One attempt, settlement, timeout, cancellation, retry boundary, process/transport metadata. | Semantic task identity, evidence truth, lifecycle progression. |
| Run Result Evaluation | Bounded context + authority boundary | Run Result Evaluator | Parse worker claim, collect/validate artifacts, compute confidence, produce RunResult. | Launching executors, choosing providers, approving Work. |
| Domain Harnesses | Extension boundary + authority boundary | Domain Components And Extension Layer | Domain knowledge, resource/conflict/isolation advice, domain evidence rules, Work integration policy. | Generic execution core, provider launch, hidden lifecycle authority. |
| Visibility / Herdr | Adapter boundary | Host And Surface Layer | Pane/process observation, operator visibility, diagnostics, live intervention surface. | Runtime truth, evidence authority, lifecycle authority. |
```

### Full target shown text

```text
| Boundary | Type | Likely component | Owns | Must not own |
|---|---|---|---|---|
| Work Lifecycle | Bounded context + authority boundary | Work Lifecycle Engine | Work identity, status, stage, claim/return, related refs, context, documents, human gates, lifecycle verbs. | Agent runtime, task graph progress, executor selection, evidence confidence, domain-specific merge/worktree behavior. |
| Coordination Session Runtime | Bounded context | Agent Coordination Engine | One bounded coordination invocation, session manifest, event stream, AdhocTask graph, topology, budgets, recovery, synthesis boundary. | Work lifecycle mutation, provider/model execution choice, domain-specific branch authority. |
| Team Cognition Engine | Bounded context | Agent Coordination Engine | Runtime group reasoning: choose consult/research/debate/brainstorm/peer-review strategy, allocate semantic cohorts, manage visibility policy, and propose synthesis strategy. | Dispatch bypass, protocol schema ownership, canonical runtime record ownership, Work lifecycle. |
| Protocol Package / Definition | Extension boundary | Domain Components And Extension Layer | Reusable declared collaboration recipes: consult, research, debate, brainstorm, leader-worker, peer review, legal phases, operations, topology, and policy hints. | Runtime reasoning/adaptation, session persistence, executor choice, evidence truth. |
| Coding Domain Component | Domain component | Domain Components And Extension Layer | Coding-specific core, Feature Workflow, Bugfix Workflow, coding harness, coding evidence adapters, repository/resource model, worktree/merge behavior, technical approval gates. | Generic coordination runtime, direct executor launch, domain-agnostic Work lifecycle mutation outside Work verbs. |
| Coding Feature Workflow | Domain subcomponent | Coding Domain Component | Feature-specific stages, legal operations, TaskSpecs, Skills, and planning doctrine. | Bugfix-specific lifecycle semantics, generic Work state engine, direct executor launch. |
| Bugfix Workflow | Domain subcomponent | Coding Domain Component | Bugfix-specific stages such as reproduce/diagnose/fix/verify/review, operations, TaskSpecs, Skills, and verification doctrine. | Feature-specific planning semantics, generic Work state engine, direct executor launch. |
| Stage Operation Choice | Authority boundary | Work Lifecycle Engine, interpreting Domain workflow declarations | Select the next legal operation for the current Work stage from declared domain workflow operations and current evidence signals. | Declaring new operations, choosing concrete executor/provider/model, computing RunResult confidence. |
| Execution Contract / Assignment Builder | Authority boundary | Agent Coordination Engine | Convert declared operation or validated inline contract into immutable Assignment snapshot with provenance, mutation, evidence, budget, role, and policy inputs. | Dispatch target choice, retry lifecycle, Work mutation. |
| Dispatch Control Plane | Bounded context + authority boundary | Dispatch And Execution Engine | Resolve Assignment policy into DispatchPlan: executor, provider, model, tier, mechanism, adapter, governance, egress. Routes on exactly two identities, capability and executor-id — see the canonical [Dispatch Control Plane](../architect/agent-coordination/architecture/dispatch-control-plane.md) doc for the accepted DispatchRequest/PolicyPatch/DispatchPlan contracts and component-internal ownership list. | Choosing semantic operation, interpreting task success, mutating lifecycle. |
| Execution Adapters | Adapter boundary | Dispatch And Execution Engine | Deliver one approved Run through CLI, Herdr, MCP, API, or future native mechanism. | Policy decision, evidence confidence, Work state. |
| Run Runtime | Authority boundary | Dispatch And Execution Engine | One attempt, settlement, timeout, cancellation, retry boundary, process/transport metadata. | Semantic task identity, evidence truth, lifecycle progression. |
| Run Result Evaluation | Bounded context + authority boundary | Run Result Evaluator | Parse worker claim, collect/validate artifacts, compute confidence, produce RunResult. | Launching executors, choosing providers, approving Work. |
| Domain Harnesses | Extension boundary + authority boundary | Domain Components And Extension Layer | Domain knowledge, resource/conflict/isolation advice, domain evidence rules, Work integration policy. | Generic execution core, provider launch, hidden lifecycle authority. |
| Visibility / Herdr | Adapter boundary | Host And Surface Layer | Pane/process observation, operator visibility, diagnostics, live intervention surface. | Runtime truth, evidence authority, lifecycle authority. |
```

### Unified diff

```diff
--- docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-48
+++ docs/platform/component-boundary.md#unheaded-block-62
@@ -9,7 +9,7 @@
 | Bugfix Workflow | Domain subcomponent | Coding Domain Component | Bugfix-specific stages such as reproduce/diagnose/fix/verify/review, operations, TaskSpecs, Skills, and verification doctrine. | Feature-specific planning semantics, generic Work state engine, direct executor launch. |
 | Stage Operation Choice | Authority boundary | Work Lifecycle Engine, interpreting Domain workflow declarations | Select the next legal operation for the current Work stage from declared domain workflow operations and current evidence signals. | Declaring new operations, choosing concrete executor/provider/model, computing RunResult confidence. |
 | Execution Contract / Assignment Builder | Authority boundary | Agent Coordination Engine | Convert declared operation or validated inline contract into immutable Assignment snapshot with provenance, mutation, evidence, budget, role, and policy inputs. | Dispatch target choice, retry lifecycle, Work mutation. |
-| Dispatch Control Plane | Bounded context + authority boundary | Dispatch And Execution Engine | Resolve Assignment policy into DispatchPlan: executor, provider, model, tier, mechanism, adapter, governance, egress. Routes on exactly two identities, capability and executor-id — see the canonical [Dispatch Control Plane](../agent-coordination/architecture/dispatch-control-plane.md) doc for the accepted DispatchRequest/PolicyPatch/DispatchPlan contracts and component-internal ownership list. | Choosing semantic operation, interpreting task success, mutating lifecycle. |
+| Dispatch Control Plane | Bounded context + authority boundary | Dispatch And Execution Engine | Resolve Assignment policy into DispatchPlan: executor, provider, model, tier, mechanism, adapter, governance, egress. Routes on exactly two identities, capability and executor-id — see the canonical [Dispatch Control Plane](../architect/agent-coordination/architecture/dispatch-control-plane.md) doc for the accepted DispatchRequest/PolicyPatch/DispatchPlan contracts and component-internal ownership list. | Choosing semantic operation, interpreting task success, mutating lifecycle. |
 | Execution Adapters | Adapter boundary | Dispatch And Execution Engine | Deliver one approved Run through CLI, Herdr, MCP, API, or future native mechanism. | Policy decision, evidence confidence, Work state. |
 | Run Runtime | Authority boundary | Dispatch And Execution Engine | One attempt, settlement, timeout, cancellation, retry boundary, process/transport metadata. | Semantic task identity, evidence truth, lifecycle progression. |
 | Run Result Evaluation | Bounded context + authority boundary | Run Result Evaluator | Parse worker claim, collect/validate artifacts, compute confidence, produce RunResult. | Launching executors, choosing providers, approving Work. |

```

## claim_96e947d6daf7dd7612cc711be8e3e22e

Source: `docs/architect/component-boundary/component-boundary-advisory.md#9-hexagonal-architecture-view`. Target: `docs/platform/component-boundary.md#9-hexagonal-architecture-view`.

Mechanical class: Judgment. Source digest: `fdf071494f5b3e8e4f6a0e21fe9eed5d5c3ee9dea294c1ba4b81099acea3a0fe`. Target digest: `c1190693935a61dea5a142fa3fa5a70a8bdcfbc27602869ca46286b551d79ee6`.

Full shown source SHA256: `3a8747636726a862ceb450516f4ce2b6f8c89b81eb969fa69e30f9dd5d0511ba`. Full shown target SHA256: `dbf0d87cda8f13330e636d2ab205b00edf98e1ebb85e93ae8e393d630a86d324`.

### Proposed decision

```json
{
  "claimId": "claim_96e947d6daf7dd7612cc711be8e3e22e",
  "sourceUnitDigest": "fdf071494f5b3e8e4f6a0e21fe9eed5d5c3ee9dea294c1ba4b81099acea3a0fe",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "9-hexagonal-architecture-view",
  "targetUnitDigest": "c1190693935a61dea5a142fa3fa5a70a8bdcfbc27602869ca46286b551d79ee6",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: component-boundary-advisory source carriage",
    "fgOS Component Boundary Advisory"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Judgment: no target digest match. Carry the complete heading at docs/architect/component-boundary/component-boundary-advisory.md#9-hexagonal-architecture-view (lines 350–350) into docs/platform/component-boundary.md#9-hexagonal-architecture-view (lines 447–447), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. Digest differences come only from the recorded candidate header/frontmatter fence, heading-level shift or physical relative-link rebasing; full before/after units and line mapping are in authoring accounting. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

````text
## 9. Hexagonal Architecture View

The system model should stay independent from concrete storage, transport,
executor, and UI choices.

Core model candidates, grouped by owning component:

```txt
Work Lifecycle Engine:
  Work
  Work identity/status/stage/claim/context/document state

Agent Coordination Engine:
  CoordinationSession
  AdhocTask
  Assignment
  Synthesis

Dispatch And Execution Engine:
  DispatchPlan
  Run

Run Result Evaluator:
  RunResult
  Evidence
  ArtifactRef

Domain Components And Extension Layer:
  FlowDefinition normalized model
  PolicyPatch
  TaskSpec / Skill references
  domain workflow definitions
```

This replaces the flatter mental model:

```txt
CoordinationSession
AdhocTask
Assignment
DispatchPlan
Run
RunResult
Evidence
Synthesis
PolicyPatch
FlowDefinition normalized model
```

Port candidates, grouped by owning component:

```txt
Work Lifecycle Engine:
  WorkLifecyclePort
  OccupancyPort

Agent Coordination Engine:
  SessionStorePort
  AssignmentStorePort
  TeamCognitionPort
  WorkContextPort

Dispatch And Execution Engine:
  DispatchResolverPort   (superseded in naming by DispatchRuntimePort,
                          [Component Authority Boundary Map §13](../proposals/component-authority-boundary-map.md#13-draft-ports);
                          same candidate facade, not two live ports)
  RunStorePort
  ExecutorAdapterPort

Run Result Evaluator:
  EvidenceCollectorPort
  ResultNormalizerPort
  ArtifactStorePort

Domain Components And Extension Layer:
  DefinitionLoaderPort
  DomainHarnessPort
  ProtocolPackagePort
  PolicyProviderPort
  EvidencePolicyPort

Host And Surface Layer:
  VisibilityPort
  CommandSurfacePort
  ApiSurfacePort

Shared infrastructure:
  ClockPort
  IdGeneratorPort
  FilesystemPort
```

Adapter candidates:

```txt
YAML Workflow loader
Workflow definition loader
coding-domain harness
CLI spawn adapter
Herdr spawn adapter
MCP adapter
API adapter
local .fgos file store
Git evidence collector
test command evidence collector
Work engine verb adapter
```

This split makes replacement easier. For example, dispatch governance,
FlowDefinition validation, session DAG scheduling, Run supervision, or evidence
collection could move to Rust without requiring protocol packages or Skills to
move with them.
````

### Full target shown text

````text
#### 9. Hexagonal Architecture View

The system model should stay independent from concrete storage, transport,
executor, and UI choices.

Core model candidates, grouped by owning component:

```txt
Work Lifecycle Engine:
  Work
  Work identity/status/stage/claim/context/document state

Agent Coordination Engine:
  CoordinationSession
  AdhocTask
  Assignment
  Synthesis

Dispatch And Execution Engine:
  DispatchPlan
  Run

Run Result Evaluator:
  RunResult
  Evidence
  ArtifactRef

Domain Components And Extension Layer:
  FlowDefinition normalized model
  PolicyPatch
  TaskSpec / Skill references
  domain workflow definitions
```

This replaces the flatter mental model:

```txt
CoordinationSession
AdhocTask
Assignment
DispatchPlan
Run
RunResult
Evidence
Synthesis
PolicyPatch
FlowDefinition normalized model
```

Port candidates, grouped by owning component:

```txt
Work Lifecycle Engine:
  WorkLifecyclePort
  OccupancyPort

Agent Coordination Engine:
  SessionStorePort
  AssignmentStorePort
  TeamCognitionPort
  WorkContextPort

Dispatch And Execution Engine:
  DispatchResolverPort   (superseded in naming by DispatchRuntimePort,
                          [Component Authority Boundary Map §13](../architect/proposals/component-authority-boundary-map.md#13-draft-ports);
                          same candidate facade, not two live ports)
  RunStorePort
  ExecutorAdapterPort

Run Result Evaluator:
  EvidenceCollectorPort
  ResultNormalizerPort
  ArtifactStorePort

Domain Components And Extension Layer:
  DefinitionLoaderPort
  DomainHarnessPort
  ProtocolPackagePort
  PolicyProviderPort
  EvidencePolicyPort

Host And Surface Layer:
  VisibilityPort
  CommandSurfacePort
  ApiSurfacePort

Shared infrastructure:
  ClockPort
  IdGeneratorPort
  FilesystemPort
```

Adapter candidates:

```txt
YAML Workflow loader
Workflow definition loader
coding-domain harness
CLI spawn adapter
Herdr spawn adapter
MCP adapter
API adapter
local .fgos file store
Git evidence collector
test command evidence collector
Work engine verb adapter
```

This split makes replacement easier. For example, dispatch governance,
FlowDefinition validation, session DAG scheduling, Run supervision, or evidence
collection could move to Rust without requiring protocol packages or Skills to
move with them.
````

### Unified diff

```diff
--- docs/architect/component-boundary/component-boundary-advisory.md#9-hexagonal-architecture-view
+++ docs/platform/component-boundary.md#9-hexagonal-architecture-view
@@ -1,4 +1,4 @@
-## 9. Hexagonal Architecture View
+#### 9. Hexagonal Architecture View
 
 The system model should stay independent from concrete storage, transport,
 executor, and UI choices.
@@ -62,7 +62,7 @@
 
 Dispatch And Execution Engine:
   DispatchResolverPort   (superseded in naming by DispatchRuntimePort,
-                          [Component Authority Boundary Map §13](../proposals/component-authority-boundary-map.md#13-draft-ports);
+                          [Component Authority Boundary Map §13](../architect/proposals/component-authority-boundary-map.md#13-draft-ports);
                           same candidate facade, not two live ports)
   RunStorePort
   ExecutorAdapterPort

```

## claim_2ee40967845ff151533c0464a063b889

Source: `docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-49`. Target: `docs/platform/component-boundary.md#unheaded-block-63`.

Mechanical class: Weak-exact. Source digest: `54e18a3af732fb59e7231c7192c3fe8667a4d705cc22e073d4b68b414e938f60`. Target digest: `54e18a3af732fb59e7231c7192c3fe8667a4d705cc22e073d4b68b414e938f60`.

Full shown source SHA256: `54e18a3af732fb59e7231c7192c3fe8667a4d705cc22e073d4b68b414e938f60`. Full shown target SHA256: `54e18a3af732fb59e7231c7192c3fe8667a4d705cc22e073d4b68b414e938f60`.

### Proposed decision

```json
{
  "claimId": "claim_2ee40967845ff151533c0464a063b889",
  "sourceUnitDigest": "54e18a3af732fb59e7231c7192c3fe8667a4d705cc22e073d4b68b414e938f60",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-63",
  "targetUnitDigest": "54e18a3af732fb59e7231c7192c3fe8667a4d705cc22e073d4b68b414e938f60",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: component-boundary-advisory source carriage",
    "fgOS Component Boundary Advisory",
    "9. Hexagonal Architecture View"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-49 (lines 352–353) into docs/platform/component-boundary.md#unheaded-block-63 (lines 449–450), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
The system model should stay independent from concrete storage, transport,
executor, and UI choices.
```

### Full target shown text

```text
The system model should stay independent from concrete storage, transport,
executor, and UI choices.
```

### Unified diff

```diff
No text difference.
```

## claim_f7863daa0185993b81a672c0420d3261

Source: `docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-50`. Target: `docs/platform/component-boundary.md#unheaded-block-64`.

Mechanical class: Weak-exact. Source digest: `9a13cfa56a3a37b764cb6d2fac4b0b13ca696a33d806bf6173f22f402899e510`. Target digest: `9a13cfa56a3a37b764cb6d2fac4b0b13ca696a33d806bf6173f22f402899e510`.

Full shown source SHA256: `9a13cfa56a3a37b764cb6d2fac4b0b13ca696a33d806bf6173f22f402899e510`. Full shown target SHA256: `9a13cfa56a3a37b764cb6d2fac4b0b13ca696a33d806bf6173f22f402899e510`.

### Proposed decision

```json
{
  "claimId": "claim_f7863daa0185993b81a672c0420d3261",
  "sourceUnitDigest": "9a13cfa56a3a37b764cb6d2fac4b0b13ca696a33d806bf6173f22f402899e510",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-64",
  "targetUnitDigest": "9a13cfa56a3a37b764cb6d2fac4b0b13ca696a33d806bf6173f22f402899e510",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: component-boundary-advisory source carriage",
    "fgOS Component Boundary Advisory",
    "9. Hexagonal Architecture View"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-50 (lines 355–355) into docs/platform/component-boundary.md#unheaded-block-64 (lines 452–452), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
Core model candidates, grouped by owning component:
```

### Full target shown text

```text
Core model candidates, grouped by owning component:
```

### Unified diff

```diff
No text difference.
```

## claim_263e571671bf5793b7bc367d01178f24

Source: `docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-51`. Target: `docs/platform/component-boundary.md#unheaded-block-65`.

Mechanical class: Weak-exact. Source digest: `ebb2e5e61f6da9d155d2b7458cc14f48c81f4948871f7ccc2839e109944629ae`. Target digest: `ebb2e5e61f6da9d155d2b7458cc14f48c81f4948871f7ccc2839e109944629ae`.

Full shown source SHA256: `ebb2e5e61f6da9d155d2b7458cc14f48c81f4948871f7ccc2839e109944629ae`. Full shown target SHA256: `ebb2e5e61f6da9d155d2b7458cc14f48c81f4948871f7ccc2839e109944629ae`.

### Proposed decision

```json
{
  "claimId": "claim_263e571671bf5793b7bc367d01178f24",
  "sourceUnitDigest": "ebb2e5e61f6da9d155d2b7458cc14f48c81f4948871f7ccc2839e109944629ae",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-65",
  "targetUnitDigest": "ebb2e5e61f6da9d155d2b7458cc14f48c81f4948871f7ccc2839e109944629ae",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: component-boundary-advisory source carriage",
    "fgOS Component Boundary Advisory",
    "9. Hexagonal Architecture View"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-51 (lines 357–382) into docs/platform/component-boundary.md#unheaded-block-65 (lines 454–479), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

````text
```txt
Work Lifecycle Engine:
  Work
  Work identity/status/stage/claim/context/document state

Agent Coordination Engine:
  CoordinationSession
  AdhocTask
  Assignment
  Synthesis

Dispatch And Execution Engine:
  DispatchPlan
  Run

Run Result Evaluator:
  RunResult
  Evidence
  ArtifactRef

Domain Components And Extension Layer:
  FlowDefinition normalized model
  PolicyPatch
  TaskSpec / Skill references
  domain workflow definitions
```
````

### Full target shown text

````text
```txt
Work Lifecycle Engine:
  Work
  Work identity/status/stage/claim/context/document state

Agent Coordination Engine:
  CoordinationSession
  AdhocTask
  Assignment
  Synthesis

Dispatch And Execution Engine:
  DispatchPlan
  Run

Run Result Evaluator:
  RunResult
  Evidence
  ArtifactRef

Domain Components And Extension Layer:
  FlowDefinition normalized model
  PolicyPatch
  TaskSpec / Skill references
  domain workflow definitions
```
````

### Unified diff

```diff
No text difference.
```

## claim_af0d28923201cebbf946e92f79f302c0

Source: `docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-52`. Target: `docs/platform/component-boundary.md#unheaded-block-66`.

Mechanical class: Weak-exact. Source digest: `95bb03c16c761c3e870e2e9c372ca48b8c918da72d6b5b0ffcfad0a317754f1a`. Target digest: `95bb03c16c761c3e870e2e9c372ca48b8c918da72d6b5b0ffcfad0a317754f1a`.

Full shown source SHA256: `95bb03c16c761c3e870e2e9c372ca48b8c918da72d6b5b0ffcfad0a317754f1a`. Full shown target SHA256: `95bb03c16c761c3e870e2e9c372ca48b8c918da72d6b5b0ffcfad0a317754f1a`.

### Proposed decision

```json
{
  "claimId": "claim_af0d28923201cebbf946e92f79f302c0",
  "sourceUnitDigest": "95bb03c16c761c3e870e2e9c372ca48b8c918da72d6b5b0ffcfad0a317754f1a",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-66",
  "targetUnitDigest": "95bb03c16c761c3e870e2e9c372ca48b8c918da72d6b5b0ffcfad0a317754f1a",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: component-boundary-advisory source carriage",
    "fgOS Component Boundary Advisory",
    "9. Hexagonal Architecture View"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ; source unit shorter than 40 characters. Carry the complete unheaded-block at docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-52 (lines 384–384) into docs/platform/component-boundary.md#unheaded-block-66 (lines 481–481), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
This replaces the flatter mental model:
```

### Full target shown text

```text
This replaces the flatter mental model:
```

### Unified diff

```diff
No text difference.
```

## claim_90f3f5b4a8e750f4048cd3eb069a59b0

Source: `docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-53`. Target: `docs/platform/component-boundary.md#unheaded-block-67`.

Mechanical class: Weak-exact. Source digest: `6ff387e7fe9208636b6d30c00e8c893f0ee98ecc4f90d8de6c5a8788bcbf077a`. Target digest: `6ff387e7fe9208636b6d30c00e8c893f0ee98ecc4f90d8de6c5a8788bcbf077a`.

Full shown source SHA256: `6ff387e7fe9208636b6d30c00e8c893f0ee98ecc4f90d8de6c5a8788bcbf077a`. Full shown target SHA256: `6ff387e7fe9208636b6d30c00e8c893f0ee98ecc4f90d8de6c5a8788bcbf077a`.

### Proposed decision

```json
{
  "claimId": "claim_90f3f5b4a8e750f4048cd3eb069a59b0",
  "sourceUnitDigest": "6ff387e7fe9208636b6d30c00e8c893f0ee98ecc4f90d8de6c5a8788bcbf077a",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-67",
  "targetUnitDigest": "6ff387e7fe9208636b6d30c00e8c893f0ee98ecc4f90d8de6c5a8788bcbf077a",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: component-boundary-advisory source carriage",
    "fgOS Component Boundary Advisory",
    "9. Hexagonal Architecture View"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-53 (lines 386–397) into docs/platform/component-boundary.md#unheaded-block-67 (lines 483–494), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

````text
```txt
CoordinationSession
AdhocTask
Assignment
DispatchPlan
Run
RunResult
Evidence
Synthesis
PolicyPatch
FlowDefinition normalized model
```
````

### Full target shown text

````text
```txt
CoordinationSession
AdhocTask
Assignment
DispatchPlan
Run
RunResult
Evidence
Synthesis
PolicyPatch
FlowDefinition normalized model
```
````

### Unified diff

```diff
No text difference.
```

## claim_eae874730b5400ed90cb1cdbc684bbad

Source: `docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-54`. Target: `docs/platform/component-boundary.md#unheaded-block-68`.

Mechanical class: Weak-exact. Source digest: `4e0b5f718a485d654aca0f25e351dd175e0feb157a018259b84607dcc770056f`. Target digest: `4e0b5f718a485d654aca0f25e351dd175e0feb157a018259b84607dcc770056f`.

Full shown source SHA256: `4e0b5f718a485d654aca0f25e351dd175e0feb157a018259b84607dcc770056f`. Full shown target SHA256: `4e0b5f718a485d654aca0f25e351dd175e0feb157a018259b84607dcc770056f`.

### Proposed decision

```json
{
  "claimId": "claim_eae874730b5400ed90cb1cdbc684bbad",
  "sourceUnitDigest": "4e0b5f718a485d654aca0f25e351dd175e0feb157a018259b84607dcc770056f",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-68",
  "targetUnitDigest": "4e0b5f718a485d654aca0f25e351dd175e0feb157a018259b84607dcc770056f",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: component-boundary-advisory source carriage",
    "fgOS Component Boundary Advisory",
    "9. Hexagonal Architecture View"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-54 (lines 399–399) into docs/platform/component-boundary.md#unheaded-block-68 (lines 496–496), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
Port candidates, grouped by owning component:
```

### Full target shown text

```text
Port candidates, grouped by owning component:
```

### Unified diff

```diff
No text difference.
```

## claim_4e86e8414c4e3b780e81f77255853447

Source: `docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-55`. Target: `docs/platform/component-boundary.md#unheaded-block-69`.

Mechanical class: Judgment. Source digest: `5700ffb4998b177096f2f1e47a65ec9fea217d555e382d03ae84f0422c4362c5`. Target digest: `913b0ef123585f0cb5173db892ff3183dfefcf6007df8b83e7aaae31f4bc883a`.

Full shown source SHA256: `5700ffb4998b177096f2f1e47a65ec9fea217d555e382d03ae84f0422c4362c5`. Full shown target SHA256: `913b0ef123585f0cb5173db892ff3183dfefcf6007df8b83e7aaae31f4bc883a`.

### Proposed decision

```json
{
  "claimId": "claim_4e86e8414c4e3b780e81f77255853447",
  "sourceUnitDigest": "5700ffb4998b177096f2f1e47a65ec9fea217d555e382d03ae84f0422c4362c5",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-69",
  "targetUnitDigest": "913b0ef123585f0cb5173db892ff3183dfefcf6007df8b83e7aaae31f4bc883a",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: component-boundary-advisory source carriage",
    "fgOS Component Boundary Advisory",
    "9. Hexagonal Architecture View"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Judgment: no target digest match. Carry the complete unheaded-block at docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-55 (lines 401–440) into docs/platform/component-boundary.md#unheaded-block-69 (lines 498–537), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. Digest differences come only from the recorded candidate header/frontmatter fence, heading-level shift or physical relative-link rebasing; full before/after units and line mapping are in authoring accounting. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

````text
```txt
Work Lifecycle Engine:
  WorkLifecyclePort
  OccupancyPort

Agent Coordination Engine:
  SessionStorePort
  AssignmentStorePort
  TeamCognitionPort
  WorkContextPort

Dispatch And Execution Engine:
  DispatchResolverPort   (superseded in naming by DispatchRuntimePort,
                          [Component Authority Boundary Map §13](../proposals/component-authority-boundary-map.md#13-draft-ports);
                          same candidate facade, not two live ports)
  RunStorePort
  ExecutorAdapterPort

Run Result Evaluator:
  EvidenceCollectorPort
  ResultNormalizerPort
  ArtifactStorePort

Domain Components And Extension Layer:
  DefinitionLoaderPort
  DomainHarnessPort
  ProtocolPackagePort
  PolicyProviderPort
  EvidencePolicyPort

Host And Surface Layer:
  VisibilityPort
  CommandSurfacePort
  ApiSurfacePort

Shared infrastructure:
  ClockPort
  IdGeneratorPort
  FilesystemPort
```
````

### Full target shown text

````text
```txt
Work Lifecycle Engine:
  WorkLifecyclePort
  OccupancyPort

Agent Coordination Engine:
  SessionStorePort
  AssignmentStorePort
  TeamCognitionPort
  WorkContextPort

Dispatch And Execution Engine:
  DispatchResolverPort   (superseded in naming by DispatchRuntimePort,
                          [Component Authority Boundary Map §13](../architect/proposals/component-authority-boundary-map.md#13-draft-ports);
                          same candidate facade, not two live ports)
  RunStorePort
  ExecutorAdapterPort

Run Result Evaluator:
  EvidenceCollectorPort
  ResultNormalizerPort
  ArtifactStorePort

Domain Components And Extension Layer:
  DefinitionLoaderPort
  DomainHarnessPort
  ProtocolPackagePort
  PolicyProviderPort
  EvidencePolicyPort

Host And Surface Layer:
  VisibilityPort
  CommandSurfacePort
  ApiSurfacePort

Shared infrastructure:
  ClockPort
  IdGeneratorPort
  FilesystemPort
```
````

### Unified diff

```diff
--- docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-55
+++ docs/platform/component-boundary.md#unheaded-block-69
@@ -11,7 +11,7 @@
 
 Dispatch And Execution Engine:
   DispatchResolverPort   (superseded in naming by DispatchRuntimePort,
-                          [Component Authority Boundary Map §13](../proposals/component-authority-boundary-map.md#13-draft-ports);
+                          [Component Authority Boundary Map §13](../architect/proposals/component-authority-boundary-map.md#13-draft-ports);
                           same candidate facade, not two live ports)
   RunStorePort
   ExecutorAdapterPort

```

## claim_25fee31e7b2231fb32eb4e5b2aa49178

Source: `docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-56`. Target: `docs/platform/component-boundary.md#unheaded-block-70`.

Mechanical class: Weak-exact. Source digest: `4ec428faf114de8efaf929a047d5f3333d593ef04df57c8d583981b77bdc68c4`. Target digest: `4ec428faf114de8efaf929a047d5f3333d593ef04df57c8d583981b77bdc68c4`.

Full shown source SHA256: `4ec428faf114de8efaf929a047d5f3333d593ef04df57c8d583981b77bdc68c4`. Full shown target SHA256: `4ec428faf114de8efaf929a047d5f3333d593ef04df57c8d583981b77bdc68c4`.

### Proposed decision

```json
{
  "claimId": "claim_25fee31e7b2231fb32eb4e5b2aa49178",
  "sourceUnitDigest": "4ec428faf114de8efaf929a047d5f3333d593ef04df57c8d583981b77bdc68c4",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-70",
  "targetUnitDigest": "4ec428faf114de8efaf929a047d5f3333d593ef04df57c8d583981b77bdc68c4",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: component-boundary-advisory source carriage",
    "fgOS Component Boundary Advisory",
    "9. Hexagonal Architecture View"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-56 (lines 442–456) into docs/platform/component-boundary.md#unheaded-block-70 (lines 539–553), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

````text
Adapter candidates:

```txt
YAML Workflow loader
Workflow definition loader
coding-domain harness
CLI spawn adapter
Herdr spawn adapter
MCP adapter
API adapter
local .fgos file store
Git evidence collector
test command evidence collector
Work engine verb adapter
```
````

### Full target shown text

````text
Adapter candidates:

```txt
YAML Workflow loader
Workflow definition loader
coding-domain harness
CLI spawn adapter
Herdr spawn adapter
MCP adapter
API adapter
local .fgos file store
Git evidence collector
test command evidence collector
Work engine verb adapter
```
````

### Unified diff

```diff
No text difference.
```

## claim_7da6822f720207b1752b95d2fcc64dc4

Source: `docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-57`. Target: `docs/platform/component-boundary.md#unheaded-block-71`.

Mechanical class: Weak-exact. Source digest: `fa69ae5f6450f46c4a7988b80abc5038b5f06938e5ba94ab0601984b4b631456`. Target digest: `fa69ae5f6450f46c4a7988b80abc5038b5f06938e5ba94ab0601984b4b631456`.

Full shown source SHA256: `fa69ae5f6450f46c4a7988b80abc5038b5f06938e5ba94ab0601984b4b631456`. Full shown target SHA256: `fa69ae5f6450f46c4a7988b80abc5038b5f06938e5ba94ab0601984b4b631456`.

### Proposed decision

```json
{
  "claimId": "claim_7da6822f720207b1752b95d2fcc64dc4",
  "sourceUnitDigest": "fa69ae5f6450f46c4a7988b80abc5038b5f06938e5ba94ab0601984b4b631456",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-71",
  "targetUnitDigest": "fa69ae5f6450f46c4a7988b80abc5038b5f06938e5ba94ab0601984b4b631456",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: component-boundary-advisory source carriage",
    "fgOS Component Boundary Advisory",
    "9. Hexagonal Architecture View"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-57 (lines 458–461) into docs/platform/component-boundary.md#unheaded-block-71 (lines 555–558), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
This split makes replacement easier. For example, dispatch governance,
FlowDefinition validation, session DAG scheduling, Run supervision, or evidence
collection could move to Rust without requiring protocol packages or Skills to
move with them.
```

### Full target shown text

```text
This split makes replacement easier. For example, dispatch governance,
FlowDefinition validation, session DAG scheduling, Run supervision, or evidence
collection could move to Rust without requiring protocol packages or Skills to
move with them.
```

### Unified diff

```diff
No text difference.
```

## claim_496db5ac38fbd813df06a0a32358fd67

Source: `docs/architect/component-boundary/component-boundary-advisory.md#10-coding-domain-component`. Target: `docs/platform/component-boundary.md#10-coding-domain-component`.

Mechanical class: Judgment. Source digest: `ce821e8adf5e89793e861d4312e78e714bb9007699437c236e976f67cc8fef82`. Target digest: `da9259bb5c1cf65c81e7db430d6ba2bd4c10821029bfd526a1bd0a50ab45d214`.

Full shown source SHA256: `1b902d44b9323210040b97f8a4f67c0011556f77914b17d7b72f594c9bbb8199`. Full shown target SHA256: `6c3a4c5210f9ec128b7e0d741e2e12623682158f6b8ea9a2d56fc907063f3682`.

### Proposed decision

```json
{
  "claimId": "claim_496db5ac38fbd813df06a0a32358fd67",
  "sourceUnitDigest": "ce821e8adf5e89793e861d4312e78e714bb9007699437c236e976f67cc8fef82",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "10-coding-domain-component",
  "targetUnitDigest": "da9259bb5c1cf65c81e7db430d6ba2bd4c10821029bfd526a1bd0a50ab45d214",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: component-boundary-advisory source carriage",
    "fgOS Component Boundary Advisory"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Judgment: no target digest match. Carry the complete heading at docs/architect/component-boundary/component-boundary-advisory.md#10-coding-domain-component (lines 463–463) into docs/platform/component-boundary.md#10-coding-domain-component (lines 560–560), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. Digest differences come only from the recorded candidate header/frontmatter fence, heading-level shift or physical relative-link rebasing; full before/after units and line mapping are in authoring accounting. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

````text
## 10. Coding Domain Component

The coding domain is a useful test case because it is large enough to be a real
domain component, not just a thin harness function. It touches multiple engines
without belonging wholly to any one of them.

The key architectural stance is:

```txt
Coding Domain Component is one large domain component.
It is not Work Lifecycle.
It is not Agent Coordination.
It is not Dispatch.
It uses those platform engines to deliver coding-domain behavior.
```

That makes the responsibility line simpler:

- Work Lifecycle manages generic work-unit state.
- Agent Coordination manages collaboration sessions and Assignments.
- Dispatch runs approved Assignments through governed executors.
- Run Result Evaluator computes confidence for one Assignment Run.
- Coding Domain decides what "coding work" means: feature planning, bug fixing,
  repo isolation, worktree/branch behavior, merge/integration, code verification,
  and technical approval semantics.

This is the intended high-level reading:

```txt
Coding Domain Component
  owns coding-specific product and technical behavior

  subcomponents:
    Coding Domain Core
      - repo scope model
      - repository/resource conflict model
      - worktree, branch, and isolation policy
      - merge and integration policy
      - technical approval gates
      - verification expectations for code changes
      - coding-specific evidence policy and adapters

    Coding Feature Workflow
      - feature-oriented stage graph
      - product/technical shaping for new or changed behavior
      - feature planning doctrine
      - feature TaskSpecs and Skills
      - operations such as shape-plan and validate-plan

    Bugfix Workflow
      - bugfix-oriented stage graph
      - reproduce/diagnose/fix/verify/review doctrine
      - bugfix TaskSpecs and Skills
      - bugfix-specific evidence and verification expectations

    Lightweight Workflow
      - cheap path for small coding work
      - reduced planning/review shape where the domain contract permits it

  consumes:
    Work Lifecycle Engine
      - Work item identity
      - domain-agnostic status/stage
      - claim/return
      - related info, context refs, docs refs, questions
      - lifecycle verbs and human gates

    Agent Coordination Engine
      - CoordinationSession / Assignment path
      - role-based collaboration
      - reviewer/researcher/helper/advisor calls
      - session evidence and synthesis hooks

    Dispatch And Execution Engine
      - governed executor/provider/model/mechanism selection
      - run launch/settlement

    Run Result Evaluator
      - normalized RunResult and confidence judgment
```

Coding workflows should not be implemented as Agent Coordination core. They are
subcomponents of the Coding Domain Component. The domain component uses Work
Lifecycle and Agent Coordination as platform engines while preserving its own
technical core.

The split is valuable because feature work and bugfix work have different
questions:

| Workflow | Primary question | Typical stages/operations | Evidence posture |
|---|---|---|---|
| Coding Feature Workflow | What should be built, how should it be shaped, and is the plan feasible? | discover/explore/shape-plan/validate-plan/implement/review | Plan evidence, scope fit, blast-radius, implementation proof, tests. |
| Bugfix Workflow | What is broken, why is it broken, and did the fix address the proven cause? | reproduce/diagnose/fix/verify/regression-review | Reproduction proof, root-cause evidence, before/after behavior, regression checks. |
| Lightweight Workflow | Can this small coding item safely skip heavier planning ceremony? | classify/execute/verify/review-as-needed | Cheap but still reproducible proof; no silent bypass of lifecycle or confidence. |

The Coding Domain Core is what prevents those workflows from duplicating
technical mechanics. It should centralize repo-level concerns:

- resolving repository scope and allowed file/resource footprint;
- deciding whether the item needs isolated worktree/branch handling;
- protecting against cross-item resource conflicts;
- defining merge, catch-up, and integration policy;
- defining technical approval semantics for coding results;
- mapping coding-specific evidence into evidence policies/adapters;
- keeping coding-specific verification doctrine out of generic Work Lifecycle.

This means `Feature Workflow` and `Bugfix Workflow` can differ in product
process while sharing the same coding core for repository mechanics.

Current coding-domain placement should therefore be:

| Concern | Component placement | Reason |
|---|---|---|
| `feature` workflow graph | Coding Domain Component / Feature Workflow | Already declared as the default workflow. It owns feature stage operation vocabulary. |
| Future `bugfix` workflow | Coding Domain Component / Bugfix Workflow | Bugfix needs different doctrine: reproduce, diagnose, fix, verify, review. It should not overload feature planning. |
| Future `lightweight` workflow | Coding Domain Component / Lightweight Workflow | Small coding work can use a cheaper graph without pretending to be full feature delivery. |
| `workflowFor(kind)` selector | Coding Domain Component / Domain Registry | Domain-level routing from item kind to workflow. Not dispatch, not team cognition. |
| `shape-plan` | Coding Feature Workflow task-spec/skill pair | First half of planning. Produces plan.md and handoff material. |
| `validate-plan` | Coding Feature Workflow task-spec, executed through Agent Coordination as reviewer Assignment | Second half of planning. Proves the plan against repo evidence and returns structured verdict artifacts. |
| Worktree, branch, merge, technical approval | Coding Domain Core | These are coding-specific resource and integration concerns. Marketing Work items must not inherit them. |
| Claim/status/stage/context/docs/questions | Work Lifecycle Engine | Domain-agnostic Work-unit lifecycle. Coding consumes it; coding does not redefine it. |
| Executor/provider/model choice | Dispatch And Execution Engine | A workflow can declare policy hints; dispatch computes the effective mechanism. |
| RunResult confidence | Run Result Evaluator | A domain can provide evidence policy/adapters; the evaluator computes confidence. |

The most important architectural consequences are:

1. A coding feature workflow is a domain workflow, not the Work Lifecycle
   Engine itself.
2. Coding Core must not leak into Work Lifecycle. Work Lifecycle can manage a
   marketing work unit, a coding work unit, or an operations work unit through
   the same domain-agnostic primitives.
3. Worktree, branch, merge, and technical approval are coding-domain concerns.
   They may be implemented as harnesses/adapters behind Coding Domain Core, but
   they should not become generic Work lifecycle semantics.
4. Coding workflows should call into platform engines through contracts:
   Work verbs for lifecycle, Assignment for collaboration work, DispatchPlan
   for execution, and RunResult for confidence.
5. Marketing can use the same Work lifecycle primitives while owning very
   different task-specs, skills, knowledge, context assets, gates, and
   dashboards.
````

### Full target shown text

````text
#### 10. Coding Domain Component

The coding domain is a useful test case because it is large enough to be a real
domain component, not just a thin harness function. It touches multiple engines
without belonging wholly to any one of them.

The key architectural stance is:

```txt
Coding Domain Component is one large domain component.
It is not Work Lifecycle.
It is not Agent Coordination.
It is not Dispatch.
It uses those platform engines to deliver coding-domain behavior.
```

That makes the responsibility line simpler:

- Work Lifecycle manages generic work-unit state.
- Agent Coordination manages collaboration sessions and Assignments.
- Dispatch runs approved Assignments through governed executors.
- Run Result Evaluator computes confidence for one Assignment Run.
- Coding Domain decides what "coding work" means: feature planning, bug fixing,
  repo isolation, worktree/branch behavior, merge/integration, code verification,
  and technical approval semantics.

This is the intended high-level reading:

```txt
Coding Domain Component
  owns coding-specific product and technical behavior

  subcomponents:
    Coding Domain Core
      - repo scope model
      - repository/resource conflict model
      - worktree, branch, and isolation policy
      - merge and integration policy
      - technical approval gates
      - verification expectations for code changes
      - coding-specific evidence policy and adapters

    Coding Feature Workflow
      - feature-oriented stage graph
      - product/technical shaping for new or changed behavior
      - feature planning doctrine
      - feature TaskSpecs and Skills
      - operations such as shape-plan and validate-plan

    Bugfix Workflow
      - bugfix-oriented stage graph
      - reproduce/diagnose/fix/verify/review doctrine
      - bugfix TaskSpecs and Skills
      - bugfix-specific evidence and verification expectations

    Lightweight Workflow
      - cheap path for small coding work
      - reduced planning/review shape where the domain contract permits it

  consumes:
    Work Lifecycle Engine
      - Work item identity
      - domain-agnostic status/stage
      - claim/return
      - related info, context refs, docs refs, questions
      - lifecycle verbs and human gates

    Agent Coordination Engine
      - CoordinationSession / Assignment path
      - role-based collaboration
      - reviewer/researcher/helper/advisor calls
      - session evidence and synthesis hooks

    Dispatch And Execution Engine
      - governed executor/provider/model/mechanism selection
      - run launch/settlement

    Run Result Evaluator
      - normalized RunResult and confidence judgment
```

Coding workflows should not be implemented as Agent Coordination core. They are
subcomponents of the Coding Domain Component. The domain component uses Work
Lifecycle and Agent Coordination as platform engines while preserving its own
technical core.

The split is valuable because feature work and bugfix work have different
questions:

| Workflow | Primary question | Typical stages/operations | Evidence posture |
|---|---|---|---|
| Coding Feature Workflow | What should be built, how should it be shaped, and is the plan feasible? | discover/explore/shape-plan/validate-plan/implement/review | Plan evidence, scope fit, blast-radius, implementation proof, tests. |
| Bugfix Workflow | What is broken, why is it broken, and did the fix address the proven cause? | reproduce/diagnose/fix/verify/regression-review | Reproduction proof, root-cause evidence, before/after behavior, regression checks. |
| Lightweight Workflow | Can this small coding item safely skip heavier planning ceremony? | classify/execute/verify/review-as-needed | Cheap but still reproducible proof; no silent bypass of lifecycle or confidence. |

The Coding Domain Core is what prevents those workflows from duplicating
technical mechanics. It should centralize repo-level concerns:

- resolving repository scope and allowed file/resource footprint;
- deciding whether the item needs isolated worktree/branch handling;
- protecting against cross-item resource conflicts;
- defining merge, catch-up, and integration policy;
- defining technical approval semantics for coding results;
- mapping coding-specific evidence into evidence policies/adapters;
- keeping coding-specific verification doctrine out of generic Work Lifecycle.

This means `Feature Workflow` and `Bugfix Workflow` can differ in product
process while sharing the same coding core for repository mechanics.

Current coding-domain placement should therefore be:

| Concern | Component placement | Reason |
|---|---|---|
| `feature` workflow graph | Coding Domain Component / Feature Workflow | Already declared as the default workflow. It owns feature stage operation vocabulary. |
| Future `bugfix` workflow | Coding Domain Component / Bugfix Workflow | Bugfix needs different doctrine: reproduce, diagnose, fix, verify, review. It should not overload feature planning. |
| Future `lightweight` workflow | Coding Domain Component / Lightweight Workflow | Small coding work can use a cheaper graph without pretending to be full feature delivery. |
| `workflowFor(kind)` selector | Coding Domain Component / Domain Registry | Domain-level routing from item kind to workflow. Not dispatch, not team cognition. |
| `shape-plan` | Coding Feature Workflow task-spec/skill pair | First half of planning. Produces plan.md and handoff material. |
| `validate-plan` | Coding Feature Workflow task-spec, executed through Agent Coordination as reviewer Assignment | Second half of planning. Proves the plan against repo evidence and returns structured verdict artifacts. |
| Worktree, branch, merge, technical approval | Coding Domain Core | These are coding-specific resource and integration concerns. Marketing Work items must not inherit them. |
| Claim/status/stage/context/docs/questions | Work Lifecycle Engine | Domain-agnostic Work-unit lifecycle. Coding consumes it; coding does not redefine it. |
| Executor/provider/model choice | Dispatch And Execution Engine | A workflow can declare policy hints; dispatch computes the effective mechanism. |
| RunResult confidence | Run Result Evaluator | A domain can provide evidence policy/adapters; the evaluator computes confidence. |

The most important architectural consequences are:

1. A coding feature workflow is a domain workflow, not the Work Lifecycle
   Engine itself.
2. Coding Core must not leak into Work Lifecycle. Work Lifecycle can manage a
   marketing work unit, a coding work unit, or an operations work unit through
   the same domain-agnostic primitives.
3. Worktree, branch, merge, and technical approval are coding-domain concerns.
   They may be implemented as harnesses/adapters behind Coding Domain Core, but
   they should not become generic Work lifecycle semantics.
4. Coding workflows should call into platform engines through contracts:
   Work verbs for lifecycle, Assignment for collaboration work, DispatchPlan
   for execution, and RunResult for confidence.
5. Marketing can use the same Work lifecycle primitives while owning very
   different task-specs, skills, knowledge, context assets, gates, and
   dashboards.
````

### Unified diff

```diff
--- docs/architect/component-boundary/component-boundary-advisory.md#10-coding-domain-component
+++ docs/platform/component-boundary.md#10-coding-domain-component
@@ -1,4 +1,4 @@
-## 10. Coding Domain Component
+#### 10. Coding Domain Component
 
 The coding domain is a useful test case because it is large enough to be a real
 domain component, not just a thin harness function. It touches multiple engines

```

## claim_9452917992853b89fe05ef73b736ea35

Source: `docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-58`. Target: `docs/platform/component-boundary.md#unheaded-block-72`.

Mechanical class: Weak-exact. Source digest: `f385751c80288ab5cd93ae36c774bfef09b09a08725fd4c840fc76adeae2ae46`. Target digest: `f385751c80288ab5cd93ae36c774bfef09b09a08725fd4c840fc76adeae2ae46`.

Full shown source SHA256: `f385751c80288ab5cd93ae36c774bfef09b09a08725fd4c840fc76adeae2ae46`. Full shown target SHA256: `f385751c80288ab5cd93ae36c774bfef09b09a08725fd4c840fc76adeae2ae46`.

### Proposed decision

```json
{
  "claimId": "claim_9452917992853b89fe05ef73b736ea35",
  "sourceUnitDigest": "f385751c80288ab5cd93ae36c774bfef09b09a08725fd4c840fc76adeae2ae46",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-72",
  "targetUnitDigest": "f385751c80288ab5cd93ae36c774bfef09b09a08725fd4c840fc76adeae2ae46",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: component-boundary-advisory source carriage",
    "fgOS Component Boundary Advisory",
    "10. Coding Domain Component"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-58 (lines 465–467) into docs/platform/component-boundary.md#unheaded-block-72 (lines 562–564), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
The coding domain is a useful test case because it is large enough to be a real
domain component, not just a thin harness function. It touches multiple engines
without belonging wholly to any one of them.
```

### Full target shown text

```text
The coding domain is a useful test case because it is large enough to be a real
domain component, not just a thin harness function. It touches multiple engines
without belonging wholly to any one of them.
```

### Unified diff

```diff
No text difference.
```

## claim_26f243278442f888b7593c83601b1dc9

Source: `docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-59`. Target: `docs/platform/component-boundary.md#unheaded-block-73`.

Mechanical class: Weak-exact. Source digest: `c989ffee9d3de903b8c589a0e16b030cf69920dbea41daa9c9c6ed02a555cadb`. Target digest: `c989ffee9d3de903b8c589a0e16b030cf69920dbea41daa9c9c6ed02a555cadb`.

Full shown source SHA256: `c989ffee9d3de903b8c589a0e16b030cf69920dbea41daa9c9c6ed02a555cadb`. Full shown target SHA256: `c989ffee9d3de903b8c589a0e16b030cf69920dbea41daa9c9c6ed02a555cadb`.

### Proposed decision

```json
{
  "claimId": "claim_26f243278442f888b7593c83601b1dc9",
  "sourceUnitDigest": "c989ffee9d3de903b8c589a0e16b030cf69920dbea41daa9c9c6ed02a555cadb",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-73",
  "targetUnitDigest": "c989ffee9d3de903b8c589a0e16b030cf69920dbea41daa9c9c6ed02a555cadb",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: component-boundary-advisory source carriage",
    "fgOS Component Boundary Advisory",
    "10. Coding Domain Component"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ; source unit shorter than 40 characters. Carry the complete unheaded-block at docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-59 (lines 469–469) into docs/platform/component-boundary.md#unheaded-block-73 (lines 566–566), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
The key architectural stance is:
```

### Full target shown text

```text
The key architectural stance is:
```

### Unified diff

```diff
No text difference.
```

## claim_a422a8d0becbce668176375d86bda228

Source: `docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-60`. Target: `docs/platform/component-boundary.md#unheaded-block-74`.

Mechanical class: Weak-exact. Source digest: `3282bea7d6795af73b2b79156c31c44682a7cd184f1236d4b8ed85071d65e2dc`. Target digest: `3282bea7d6795af73b2b79156c31c44682a7cd184f1236d4b8ed85071d65e2dc`.

Full shown source SHA256: `3282bea7d6795af73b2b79156c31c44682a7cd184f1236d4b8ed85071d65e2dc`. Full shown target SHA256: `3282bea7d6795af73b2b79156c31c44682a7cd184f1236d4b8ed85071d65e2dc`.

### Proposed decision

```json
{
  "claimId": "claim_a422a8d0becbce668176375d86bda228",
  "sourceUnitDigest": "3282bea7d6795af73b2b79156c31c44682a7cd184f1236d4b8ed85071d65e2dc",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-74",
  "targetUnitDigest": "3282bea7d6795af73b2b79156c31c44682a7cd184f1236d4b8ed85071d65e2dc",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: component-boundary-advisory source carriage",
    "fgOS Component Boundary Advisory",
    "10. Coding Domain Component"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-60 (lines 471–477) into docs/platform/component-boundary.md#unheaded-block-74 (lines 568–574), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

````text
```txt
Coding Domain Component is one large domain component.
It is not Work Lifecycle.
It is not Agent Coordination.
It is not Dispatch.
It uses those platform engines to deliver coding-domain behavior.
```
````

### Full target shown text

````text
```txt
Coding Domain Component is one large domain component.
It is not Work Lifecycle.
It is not Agent Coordination.
It is not Dispatch.
It uses those platform engines to deliver coding-domain behavior.
```
````

### Unified diff

```diff
No text difference.
```

## claim_5ebfb1d167893d08f762715d6d08995f

Source: `docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-61`. Target: `docs/platform/component-boundary.md#unheaded-block-75`.

Mechanical class: Weak-exact. Source digest: `21ba8ab7c1a646118e079db523c79fb11412238a6383bd6b165062103c32d3ab`. Target digest: `21ba8ab7c1a646118e079db523c79fb11412238a6383bd6b165062103c32d3ab`.

Full shown source SHA256: `21ba8ab7c1a646118e079db523c79fb11412238a6383bd6b165062103c32d3ab`. Full shown target SHA256: `21ba8ab7c1a646118e079db523c79fb11412238a6383bd6b165062103c32d3ab`.

### Proposed decision

```json
{
  "claimId": "claim_5ebfb1d167893d08f762715d6d08995f",
  "sourceUnitDigest": "21ba8ab7c1a646118e079db523c79fb11412238a6383bd6b165062103c32d3ab",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-75",
  "targetUnitDigest": "21ba8ab7c1a646118e079db523c79fb11412238a6383bd6b165062103c32d3ab",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: component-boundary-advisory source carriage",
    "fgOS Component Boundary Advisory",
    "10. Coding Domain Component"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-61 (lines 479–479) into docs/platform/component-boundary.md#unheaded-block-75 (lines 576–576), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
That makes the responsibility line simpler:
```

### Full target shown text

```text
That makes the responsibility line simpler:
```

### Unified diff

```diff
No text difference.
```

## claim_eebb5cca4b022a65034519ccdc92fa0f

Source: `docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-62`. Target: `docs/platform/component-boundary.md#unheaded-block-76`.

Mechanical class: Weak-exact. Source digest: `5879d0472fa861a6facc8cc7e880775101a83892776235abd6375a8a1f02d97a`. Target digest: `5879d0472fa861a6facc8cc7e880775101a83892776235abd6375a8a1f02d97a`.

Full shown source SHA256: `5879d0472fa861a6facc8cc7e880775101a83892776235abd6375a8a1f02d97a`. Full shown target SHA256: `5879d0472fa861a6facc8cc7e880775101a83892776235abd6375a8a1f02d97a`.

### Proposed decision

```json
{
  "claimId": "claim_eebb5cca4b022a65034519ccdc92fa0f",
  "sourceUnitDigest": "5879d0472fa861a6facc8cc7e880775101a83892776235abd6375a8a1f02d97a",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-76",
  "targetUnitDigest": "5879d0472fa861a6facc8cc7e880775101a83892776235abd6375a8a1f02d97a",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: component-boundary-advisory source carriage",
    "fgOS Component Boundary Advisory",
    "10. Coding Domain Component"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-62 (lines 481–487) into docs/platform/component-boundary.md#unheaded-block-76 (lines 578–584), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
- Work Lifecycle manages generic work-unit state.
- Agent Coordination manages collaboration sessions and Assignments.
- Dispatch runs approved Assignments through governed executors.
- Run Result Evaluator computes confidence for one Assignment Run.
- Coding Domain decides what "coding work" means: feature planning, bug fixing,
  repo isolation, worktree/branch behavior, merge/integration, code verification,
  and technical approval semantics.
```

### Full target shown text

```text
- Work Lifecycle manages generic work-unit state.
- Agent Coordination manages collaboration sessions and Assignments.
- Dispatch runs approved Assignments through governed executors.
- Run Result Evaluator computes confidence for one Assignment Run.
- Coding Domain decides what "coding work" means: feature planning, bug fixing,
  repo isolation, worktree/branch behavior, merge/integration, code verification,
  and technical approval semantics.
```

### Unified diff

```diff
No text difference.
```

## claim_3df789806717ec37edfaf8cdf08c828d

Source: `docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-63`. Target: `docs/platform/component-boundary.md#unheaded-block-77`.

Mechanical class: Weak-exact. Source digest: `7b026a618706c75896430901ef66d960fc7fe5aac7e875f532858165c6b3d879`. Target digest: `7b026a618706c75896430901ef66d960fc7fe5aac7e875f532858165c6b3d879`.

Full shown source SHA256: `7b026a618706c75896430901ef66d960fc7fe5aac7e875f532858165c6b3d879`. Full shown target SHA256: `7b026a618706c75896430901ef66d960fc7fe5aac7e875f532858165c6b3d879`.

### Proposed decision

```json
{
  "claimId": "claim_3df789806717ec37edfaf8cdf08c828d",
  "sourceUnitDigest": "7b026a618706c75896430901ef66d960fc7fe5aac7e875f532858165c6b3d879",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-77",
  "targetUnitDigest": "7b026a618706c75896430901ef66d960fc7fe5aac7e875f532858165c6b3d879",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: component-boundary-advisory source carriage",
    "fgOS Component Boundary Advisory",
    "10. Coding Domain Component"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-63 (lines 489–489) into docs/platform/component-boundary.md#unheaded-block-77 (lines 586–586), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
This is the intended high-level reading:
```

### Full target shown text

```text
This is the intended high-level reading:
```

### Unified diff

```diff
No text difference.
```

## claim_8e1e374753977320844fe605c2b3e58d

Source: `docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-64`. Target: `docs/platform/component-boundary.md#unheaded-block-78`.

Mechanical class: Weak-exact. Source digest: `2623d99daaca229f65c1d63d8fe89b098d5c1cd7ae2ab5a8b01323e9abe3d2e4`. Target digest: `2623d99daaca229f65c1d63d8fe89b098d5c1cd7ae2ab5a8b01323e9abe3d2e4`.

Full shown source SHA256: `2623d99daaca229f65c1d63d8fe89b098d5c1cd7ae2ab5a8b01323e9abe3d2e4`. Full shown target SHA256: `2623d99daaca229f65c1d63d8fe89b098d5c1cd7ae2ab5a8b01323e9abe3d2e4`.

### Proposed decision

```json
{
  "claimId": "claim_8e1e374753977320844fe605c2b3e58d",
  "sourceUnitDigest": "2623d99daaca229f65c1d63d8fe89b098d5c1cd7ae2ab5a8b01323e9abe3d2e4",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-78",
  "targetUnitDigest": "2623d99daaca229f65c1d63d8fe89b098d5c1cd7ae2ab5a8b01323e9abe3d2e4",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: component-boundary-advisory source carriage",
    "fgOS Component Boundary Advisory",
    "10. Coding Domain Component"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-64 (lines 491–542) into docs/platform/component-boundary.md#unheaded-block-78 (lines 588–639), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

````text
```txt
Coding Domain Component
  owns coding-specific product and technical behavior

  subcomponents:
    Coding Domain Core
      - repo scope model
      - repository/resource conflict model
      - worktree, branch, and isolation policy
      - merge and integration policy
      - technical approval gates
      - verification expectations for code changes
      - coding-specific evidence policy and adapters

    Coding Feature Workflow
      - feature-oriented stage graph
      - product/technical shaping for new or changed behavior
      - feature planning doctrine
      - feature TaskSpecs and Skills
      - operations such as shape-plan and validate-plan

    Bugfix Workflow
      - bugfix-oriented stage graph
      - reproduce/diagnose/fix/verify/review doctrine
      - bugfix TaskSpecs and Skills
      - bugfix-specific evidence and verification expectations

    Lightweight Workflow
      - cheap path for small coding work
      - reduced planning/review shape where the domain contract permits it

  consumes:
    Work Lifecycle Engine
      - Work item identity
      - domain-agnostic status/stage
      - claim/return
      - related info, context refs, docs refs, questions
      - lifecycle verbs and human gates

    Agent Coordination Engine
      - CoordinationSession / Assignment path
      - role-based collaboration
      - reviewer/researcher/helper/advisor calls
      - session evidence and synthesis hooks

    Dispatch And Execution Engine
      - governed executor/provider/model/mechanism selection
      - run launch/settlement

    Run Result Evaluator
      - normalized RunResult and confidence judgment
```
````

### Full target shown text

````text
```txt
Coding Domain Component
  owns coding-specific product and technical behavior

  subcomponents:
    Coding Domain Core
      - repo scope model
      - repository/resource conflict model
      - worktree, branch, and isolation policy
      - merge and integration policy
      - technical approval gates
      - verification expectations for code changes
      - coding-specific evidence policy and adapters

    Coding Feature Workflow
      - feature-oriented stage graph
      - product/technical shaping for new or changed behavior
      - feature planning doctrine
      - feature TaskSpecs and Skills
      - operations such as shape-plan and validate-plan

    Bugfix Workflow
      - bugfix-oriented stage graph
      - reproduce/diagnose/fix/verify/review doctrine
      - bugfix TaskSpecs and Skills
      - bugfix-specific evidence and verification expectations

    Lightweight Workflow
      - cheap path for small coding work
      - reduced planning/review shape where the domain contract permits it

  consumes:
    Work Lifecycle Engine
      - Work item identity
      - domain-agnostic status/stage
      - claim/return
      - related info, context refs, docs refs, questions
      - lifecycle verbs and human gates

    Agent Coordination Engine
      - CoordinationSession / Assignment path
      - role-based collaboration
      - reviewer/researcher/helper/advisor calls
      - session evidence and synthesis hooks

    Dispatch And Execution Engine
      - governed executor/provider/model/mechanism selection
      - run launch/settlement

    Run Result Evaluator
      - normalized RunResult and confidence judgment
```
````

### Unified diff

```diff
No text difference.
```

## claim_daa79430ef690753f25ef64313fa6f37

Source: `docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-65`. Target: `docs/platform/component-boundary.md#unheaded-block-79`.

Mechanical class: Weak-exact. Source digest: `2ad1c3d3b9610f4271afc3a3f1ad5d9a7fa3ec232d9c57cbdcf314a8953e85f2`. Target digest: `2ad1c3d3b9610f4271afc3a3f1ad5d9a7fa3ec232d9c57cbdcf314a8953e85f2`.

Full shown source SHA256: `2ad1c3d3b9610f4271afc3a3f1ad5d9a7fa3ec232d9c57cbdcf314a8953e85f2`. Full shown target SHA256: `2ad1c3d3b9610f4271afc3a3f1ad5d9a7fa3ec232d9c57cbdcf314a8953e85f2`.

### Proposed decision

```json
{
  "claimId": "claim_daa79430ef690753f25ef64313fa6f37",
  "sourceUnitDigest": "2ad1c3d3b9610f4271afc3a3f1ad5d9a7fa3ec232d9c57cbdcf314a8953e85f2",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-79",
  "targetUnitDigest": "2ad1c3d3b9610f4271afc3a3f1ad5d9a7fa3ec232d9c57cbdcf314a8953e85f2",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: component-boundary-advisory source carriage",
    "fgOS Component Boundary Advisory",
    "10. Coding Domain Component"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-65 (lines 544–547) into docs/platform/component-boundary.md#unheaded-block-79 (lines 641–644), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
Coding workflows should not be implemented as Agent Coordination core. They are
subcomponents of the Coding Domain Component. The domain component uses Work
Lifecycle and Agent Coordination as platform engines while preserving its own
technical core.
```

### Full target shown text

```text
Coding workflows should not be implemented as Agent Coordination core. They are
subcomponents of the Coding Domain Component. The domain component uses Work
Lifecycle and Agent Coordination as platform engines while preserving its own
technical core.
```

### Unified diff

```diff
No text difference.
```

## claim_f15433c5dfd93b337cf99a92d964a9ca

Source: `docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-66`. Target: `docs/platform/component-boundary.md#unheaded-block-80`.

Mechanical class: Weak-exact. Source digest: `8487a251571cbbde59755701bf076c29d2c4b863752917a9e1b6e1ce985c64ba`. Target digest: `8487a251571cbbde59755701bf076c29d2c4b863752917a9e1b6e1ce985c64ba`.

Full shown source SHA256: `8487a251571cbbde59755701bf076c29d2c4b863752917a9e1b6e1ce985c64ba`. Full shown target SHA256: `8487a251571cbbde59755701bf076c29d2c4b863752917a9e1b6e1ce985c64ba`.

### Proposed decision

```json
{
  "claimId": "claim_f15433c5dfd93b337cf99a92d964a9ca",
  "sourceUnitDigest": "8487a251571cbbde59755701bf076c29d2c4b863752917a9e1b6e1ce985c64ba",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-80",
  "targetUnitDigest": "8487a251571cbbde59755701bf076c29d2c4b863752917a9e1b6e1ce985c64ba",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: component-boundary-advisory source carriage",
    "fgOS Component Boundary Advisory",
    "10. Coding Domain Component"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-66 (lines 549–550) into docs/platform/component-boundary.md#unheaded-block-80 (lines 646–647), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
The split is valuable because feature work and bugfix work have different
questions:
```

### Full target shown text

```text
The split is valuable because feature work and bugfix work have different
questions:
```

### Unified diff

```diff
No text difference.
```

## claim_a1ffea3ef120ab711217d25fefdde00a

Source: `docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-67`. Target: `docs/platform/component-boundary.md#unheaded-block-81`.

Mechanical class: Weak-exact. Source digest: `cd06197896e564b741335e14c700bb99eea04199f5936a24beceb23bffbe1519`. Target digest: `cd06197896e564b741335e14c700bb99eea04199f5936a24beceb23bffbe1519`.

Full shown source SHA256: `cd06197896e564b741335e14c700bb99eea04199f5936a24beceb23bffbe1519`. Full shown target SHA256: `cd06197896e564b741335e14c700bb99eea04199f5936a24beceb23bffbe1519`.

### Proposed decision

```json
{
  "claimId": "claim_a1ffea3ef120ab711217d25fefdde00a",
  "sourceUnitDigest": "cd06197896e564b741335e14c700bb99eea04199f5936a24beceb23bffbe1519",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-81",
  "targetUnitDigest": "cd06197896e564b741335e14c700bb99eea04199f5936a24beceb23bffbe1519",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: component-boundary-advisory source carriage",
    "fgOS Component Boundary Advisory",
    "10. Coding Domain Component"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-67 (lines 552–556) into docs/platform/component-boundary.md#unheaded-block-81 (lines 649–653), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
| Workflow | Primary question | Typical stages/operations | Evidence posture |
|---|---|---|---|
| Coding Feature Workflow | What should be built, how should it be shaped, and is the plan feasible? | discover/explore/shape-plan/validate-plan/implement/review | Plan evidence, scope fit, blast-radius, implementation proof, tests. |
| Bugfix Workflow | What is broken, why is it broken, and did the fix address the proven cause? | reproduce/diagnose/fix/verify/regression-review | Reproduction proof, root-cause evidence, before/after behavior, regression checks. |
| Lightweight Workflow | Can this small coding item safely skip heavier planning ceremony? | classify/execute/verify/review-as-needed | Cheap but still reproducible proof; no silent bypass of lifecycle or confidence. |
```

### Full target shown text

```text
| Workflow | Primary question | Typical stages/operations | Evidence posture |
|---|---|---|---|
| Coding Feature Workflow | What should be built, how should it be shaped, and is the plan feasible? | discover/explore/shape-plan/validate-plan/implement/review | Plan evidence, scope fit, blast-radius, implementation proof, tests. |
| Bugfix Workflow | What is broken, why is it broken, and did the fix address the proven cause? | reproduce/diagnose/fix/verify/regression-review | Reproduction proof, root-cause evidence, before/after behavior, regression checks. |
| Lightweight Workflow | Can this small coding item safely skip heavier planning ceremony? | classify/execute/verify/review-as-needed | Cheap but still reproducible proof; no silent bypass of lifecycle or confidence. |
```

### Unified diff

```diff
No text difference.
```

## claim_2f7308769dc8999765381fb9f2a973f0

Source: `docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-68`. Target: `docs/platform/component-boundary.md#unheaded-block-82`.

Mechanical class: Weak-exact. Source digest: `075aef0ea50ce000c57519b6d3a272c39387d1cc9983e223bd9d7a5f90cebb8e`. Target digest: `075aef0ea50ce000c57519b6d3a272c39387d1cc9983e223bd9d7a5f90cebb8e`.

Full shown source SHA256: `075aef0ea50ce000c57519b6d3a272c39387d1cc9983e223bd9d7a5f90cebb8e`. Full shown target SHA256: `075aef0ea50ce000c57519b6d3a272c39387d1cc9983e223bd9d7a5f90cebb8e`.

### Proposed decision

```json
{
  "claimId": "claim_2f7308769dc8999765381fb9f2a973f0",
  "sourceUnitDigest": "075aef0ea50ce000c57519b6d3a272c39387d1cc9983e223bd9d7a5f90cebb8e",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-82",
  "targetUnitDigest": "075aef0ea50ce000c57519b6d3a272c39387d1cc9983e223bd9d7a5f90cebb8e",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: component-boundary-advisory source carriage",
    "fgOS Component Boundary Advisory",
    "10. Coding Domain Component"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-68 (lines 558–559) into docs/platform/component-boundary.md#unheaded-block-82 (lines 655–656), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
The Coding Domain Core is what prevents those workflows from duplicating
technical mechanics. It should centralize repo-level concerns:
```

### Full target shown text

```text
The Coding Domain Core is what prevents those workflows from duplicating
technical mechanics. It should centralize repo-level concerns:
```

### Unified diff

```diff
No text difference.
```

## claim_3a0f4a18e99a0f6e5968081ac9bb070e

Source: `docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-69`. Target: `docs/platform/component-boundary.md#unheaded-block-83`.

Mechanical class: Weak-exact. Source digest: `11108fa8af64a1e39efc244879b8e1cfea6ec369387a0061b1a0dcdffb77e299`. Target digest: `11108fa8af64a1e39efc244879b8e1cfea6ec369387a0061b1a0dcdffb77e299`.

Full shown source SHA256: `11108fa8af64a1e39efc244879b8e1cfea6ec369387a0061b1a0dcdffb77e299`. Full shown target SHA256: `11108fa8af64a1e39efc244879b8e1cfea6ec369387a0061b1a0dcdffb77e299`.

### Proposed decision

```json
{
  "claimId": "claim_3a0f4a18e99a0f6e5968081ac9bb070e",
  "sourceUnitDigest": "11108fa8af64a1e39efc244879b8e1cfea6ec369387a0061b1a0dcdffb77e299",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-83",
  "targetUnitDigest": "11108fa8af64a1e39efc244879b8e1cfea6ec369387a0061b1a0dcdffb77e299",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: component-boundary-advisory source carriage",
    "fgOS Component Boundary Advisory",
    "10. Coding Domain Component"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-69 (lines 561–567) into docs/platform/component-boundary.md#unheaded-block-83 (lines 658–664), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
- resolving repository scope and allowed file/resource footprint;
- deciding whether the item needs isolated worktree/branch handling;
- protecting against cross-item resource conflicts;
- defining merge, catch-up, and integration policy;
- defining technical approval semantics for coding results;
- mapping coding-specific evidence into evidence policies/adapters;
- keeping coding-specific verification doctrine out of generic Work Lifecycle.
```

### Full target shown text

```text
- resolving repository scope and allowed file/resource footprint;
- deciding whether the item needs isolated worktree/branch handling;
- protecting against cross-item resource conflicts;
- defining merge, catch-up, and integration policy;
- defining technical approval semantics for coding results;
- mapping coding-specific evidence into evidence policies/adapters;
- keeping coding-specific verification doctrine out of generic Work Lifecycle.
```

### Unified diff

```diff
No text difference.
```
