# Bounded whole-system source review request

Content commit: `a8a10abc1a24218518a14764f68c8d86f4810f91`. Author session: `codex-session:37@2026-10-15`. Review mode requested: ordinary.

Shard: `plans/260925-documentation-authority-unification/ledger/decisions/s6-whole-system-architect-portal.json`. Part 1/1; entries: **11**. Sidecar: `review-request-261015-0450-whole-system-08.md.json`.

Read review-brief.md, owner-answers.md A28–A37, frozen whole-system map, constitution, vocabulary and shard schema. Apply A36: mechanically check every row (full digest recompute, anchor check, shard/pack equality); deeply read the reviewer-seeded sample plus every differing-digest row in both directions with its diff. Preserve conditions, qualifiers, dated status and complete payload; verify one owner and labelled additions. No approval is supplied here.

Step 6’s closing review is a **checkpoint review whose sensitivity pack the reviewer holds**. The author has not created, seen or selected that pack/key. Ordinary review and A36 sampling do not replace checkpoint sensitivity.

Ordinary verdict contract: `Reviewer: <independent identity>`, `Review mode: ordinary`, request/content/shard pins; one own note and full 64-hex shown-unit digests per row. Use ok/rework/hold. Consolidate parts into a complete report for the original shard before unchanged ordinary application; never edit decisions manually.

| Claim | Verdict | Note | Source digest | Target digest |
|---|---|---|---|---|

A36 mandatory differing-digest rows (9): `claim_feceb74ddacd9505b466b57828944dbe`, `claim_e27539fb720c07fc732d6c0b8ac106c6`, `claim_8e07597a0163d64f1d5ca3ab8ad7b02a`, `claim_75dee385e5e27c6f5cf816ce81da66f3`, `claim_6729755c0a3b1b48ae5fa04ad0b634ef`, `claim_51a26e783af2c2a7ff8150886092366b`, `claim_9ef07c1714bdc408ccfcafaa152e41f9`, `claim_966fde97560d95682b95eaf79ad687e6`, `claim_f42e391a572ab02fa51adb4e64446f0e`.

Absent-target rows (0): none.

This pack has 11 Weak-exact/Judgment rows; reviewer independently draws/records at least 10 by seed (>=15%, minimum 10, all if fewer), plus every differing pair listed above. Each verdict note says deep or mechanical. If >3% of deep-read rows need rework, deeply read the complete pack before reporting. Author selected no sample. Whole batch: 300 Unit-exact, 392 Weak-exact, 134 Judgment, all 826 pending; 123 mandatory differing pairs. The 79-row batch-wide lower bound does not replace each pack minimum.

Reverse review: the separate native candidate-unverified request/list covers the complete scoped population; it is not reset per sliced pack. Full shown text hashes below bind payload separately from native heading identity digests.

## claim_feceb74ddacd9505b466b57828944dbe

Source: `docs/architect/README.md#architect-level-design`. Target: `docs/platform/README.md#architect-level-design`.

Mechanical class: Judgment. Source digest: `73554cfb77ca612f3a8ae819d9aa45da04803a612898b2a7b447aa16ee5e6205`. Target digest: `6728116d72d8078b550b06129599d2d346837494e530c0e658b4272acd3cbff3`.

Full shown source SHA256: `9230b36f1d9eb4fa4f2dbe221b42e8d34a6879a05531d0e1bc48a732ac7c6f30`. Full shown target SHA256: `b299377f4c363d7628c7f0e22c9c2a452d1ac6f46a7dfb9e2b37e3d56cc6de68`.

### Proposed decision

```json
{
  "claimId": "claim_feceb74ddacd9505b466b57828944dbe",
  "sourceUnitDigest": "73554cfb77ca612f3a8ae819d9aa45da04803a612898b2a7b447aa16ee5e6205",
  "targetOwner": "docs/platform/README.md",
  "targetAnchor": "architect-level-design",
  "targetUnitDigest": "6728116d72d8078b550b06129599d2d346837494e530c0e658b4272acd3cbff3",
  "targetAncestry": [
    "Platform Documentation",
    "Added in candidate: README source carriage"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Judgment: no target digest match. Carry the complete heading at docs/architect/README.md#architect-level-design (lines 1–1) into docs/platform/README.md#architect-level-design (lines 95–95), the frozen whole-system platform-portal owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. Digest differences come only from the recorded candidate header/frontmatter fence, heading-level shift or physical relative-link rebasing; full before/after units and line mapping are in authoring accounting. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
# Architect-Level Design

Document type: Index
Design status: Discussion
Implementation: Partial
Last reviewed: 2026-09-04

This directory holds architecture-wide intention and redesign documents whose
scope crosses one component area. Area-specific canonical documents still live
inside their own subtrees, such as `agent-coordination/` and
`component-boundary/`.
```

### Full target shown text

```text
### Architect-Level Design

Document type: Index
Design status: Discussion
Implementation: Partial
Last reviewed: 2026-09-04

This directory holds architecture-wide intention and redesign documents whose
scope crosses one component area. Area-specific canonical documents still live
inside their own subtrees, such as `agent-coordination/` and
`component-boundary/`.
```

### Unified diff

```diff
--- docs/architect/README.md#architect-level-design
+++ docs/platform/README.md#architect-level-design
@@ -1,4 +1,4 @@
-# Architect-Level Design
+### Architect-Level Design
 
 Document type: Index
 Design status: Discussion

```

## claim_2896a30027e0e6b1d5790748308d08e6

Source: `docs/architect/README.md#unheaded-block-1`. Target: `docs/platform/README.md#unheaded-block-11`.

Mechanical class: Weak-exact. Source digest: `8db83e4e0a0c4f7f4b3997f5fd63ce1cd27d444871eaf2c50254af5de942ccc0`. Target digest: `8db83e4e0a0c4f7f4b3997f5fd63ce1cd27d444871eaf2c50254af5de942ccc0`.

Full shown source SHA256: `8db83e4e0a0c4f7f4b3997f5fd63ce1cd27d444871eaf2c50254af5de942ccc0`. Full shown target SHA256: `8db83e4e0a0c4f7f4b3997f5fd63ce1cd27d444871eaf2c50254af5de942ccc0`.

### Proposed decision

```json
{
  "claimId": "claim_2896a30027e0e6b1d5790748308d08e6",
  "sourceUnitDigest": "8db83e4e0a0c4f7f4b3997f5fd63ce1cd27d444871eaf2c50254af5de942ccc0",
  "targetOwner": "docs/platform/README.md",
  "targetAnchor": "unheaded-block-11",
  "targetUnitDigest": "8db83e4e0a0c4f7f4b3997f5fd63ce1cd27d444871eaf2c50254af5de942ccc0",
  "targetAncestry": [
    "Platform Documentation",
    "Added in candidate: README source carriage",
    "Architect-Level Design"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ; document exact share below one half. Carry the complete unheaded-block at docs/architect/README.md#unheaded-block-1 (lines 3–6) into docs/platform/README.md#unheaded-block-11 (lines 97–100), the frozen whole-system platform-portal owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
Document type: Index
Design status: Discussion
Implementation: Partial
Last reviewed: 2026-09-04
```

### Full target shown text

```text
Document type: Index
Design status: Discussion
Implementation: Partial
Last reviewed: 2026-09-04
```

### Unified diff

```diff
No text difference.
```

## claim_50a65e67f2ed6c8391a0e104b46640cb

Source: `docs/architect/README.md#unheaded-block-2`. Target: `docs/platform/README.md#unheaded-block-12`.

Mechanical class: Weak-exact. Source digest: `31b31117fa644b51192ab7299a40420fdbf64307c77cf118bfed3f7b98a8d327`. Target digest: `31b31117fa644b51192ab7299a40420fdbf64307c77cf118bfed3f7b98a8d327`.

Full shown source SHA256: `31b31117fa644b51192ab7299a40420fdbf64307c77cf118bfed3f7b98a8d327`. Full shown target SHA256: `31b31117fa644b51192ab7299a40420fdbf64307c77cf118bfed3f7b98a8d327`.

### Proposed decision

```json
{
  "claimId": "claim_50a65e67f2ed6c8391a0e104b46640cb",
  "sourceUnitDigest": "31b31117fa644b51192ab7299a40420fdbf64307c77cf118bfed3f7b98a8d327",
  "targetOwner": "docs/platform/README.md",
  "targetAnchor": "unheaded-block-12",
  "targetUnitDigest": "31b31117fa644b51192ab7299a40420fdbf64307c77cf118bfed3f7b98a8d327",
  "targetAncestry": [
    "Platform Documentation",
    "Added in candidate: README source carriage",
    "Architect-Level Design"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ; document exact share below one half. Carry the complete unheaded-block at docs/architect/README.md#unheaded-block-2 (lines 8–11) into docs/platform/README.md#unheaded-block-12 (lines 102–105), the frozen whole-system platform-portal owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
This directory holds architecture-wide intention and redesign documents whose
scope crosses one component area. Area-specific canonical documents still live
inside their own subtrees, such as `agent-coordination/` and
`component-boundary/`.
```

### Full target shown text

```text
This directory holds architecture-wide intention and redesign documents whose
scope crosses one component area. Area-specific canonical documents still live
inside their own subtrees, such as `agent-coordination/` and
`component-boundary/`.
```

### Unified diff

```diff
No text difference.
```

## claim_e27539fb720c07fc732d6c0b8ac106c6

Source: `docs/architect/README.md#cross-area-intentions`. Target: `docs/platform/README.md#cross-area-intentions`.

Mechanical class: Judgment. Source digest: `4fd24b963667eddd594439646e203a3e685c95bbe43beed2dfb88fbad35162fd`. Target digest: `0f4433053968e22e3020d90bc74d59c7b07f727d24d1c6cf7fee0cabdad5bb5b`.

Full shown source SHA256: `058f238717e4347d81f1be90f9b2c2e34789b77edb1c0c4e4d4715fd18ff3393`. Full shown target SHA256: `3e0f786de152934be8faa9f505f4f62158c7ddeda6884f46bec0523ffc6004de`.

### Proposed decision

```json
{
  "claimId": "claim_e27539fb720c07fc732d6c0b8ac106c6",
  "sourceUnitDigest": "4fd24b963667eddd594439646e203a3e685c95bbe43beed2dfb88fbad35162fd",
  "targetOwner": "docs/platform/README.md",
  "targetAnchor": "cross-area-intentions",
  "targetUnitDigest": "0f4433053968e22e3020d90bc74d59c7b07f727d24d1c6cf7fee0cabdad5bb5b",
  "targetAncestry": [
    "Platform Documentation",
    "Added in candidate: README source carriage",
    "Architect-Level Design"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Judgment: no target digest match. Carry the complete heading at docs/architect/README.md#cross-area-intentions (lines 13–13) into docs/platform/README.md#cross-area-intentions (lines 107–107), the frozen whole-system platform-portal owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. Digest differences come only from the recorded candidate header/frontmatter fence, heading-level shift or physical relative-link rebasing; full before/after units and line mapping are in authoring accounting. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
## Cross-Area Intentions

- [Architect Roadmap](roadmap.md) keeps the high-level sequencing and delivery
  plan across active architecture streams: agent coordination, coding domain,
  component boundary, host invocation, Node-to-Rust migration, and packaging
  distribution.
- [Architecture Intent](architecture-intent.md) preserves architecture-wide
  design intent across deferred capabilities. Its first active thread covers
  widening fgOS from strict fan-out/fan-in and artifact-mediated coordination
  toward richer group-thinking/problem-solving capability, while keeping
  isolation-heavy fixtures intact.
- [System Vision: Trong Mem Ngoai Cung](system-vision-trong-mem-ngoai-cung.md)
  records the cross-system direction that fgOS must combine hard outer
  contracts with soft inner soul/prose/skill, so architecture slices do not
  become either unverifiable prose or rigid harness without living operating
  intelligence.
- [Workspace Topology Architecture](workspace-topology.md) defines
  repository/workspace/work-state/runtime identities, state classes, root
  ownership, worktree mode invariants, and mutation topology used by
  packaging, work-state, coding-domain, coordination, and config/init/doctor.
  Read this contract before packaging activation, work-state relocation,
  coding-domain worktree changes, or runtime coordination changes.
- [Workspace Topology Audit](workspace-topology-audit.md) records current
  codebase evidence and gaps behind the topology contract.
- [Workspace Topology Roadmap](workspace-topology-roadmap.md) sequences the
  decisions and migration slices needed to make the contract enforceable.
```

### Full target shown text

```text
#### Cross-Area Intentions

- [Architect Roadmap](../architect/roadmap.md) keeps the high-level sequencing and delivery
  plan across active architecture streams: agent coordination, coding domain,
  component boundary, host invocation, Node-to-Rust migration, and packaging
  distribution.
- [Architecture Intent](../architect/architecture-intent.md) preserves architecture-wide
  design intent across deferred capabilities. Its first active thread covers
  widening fgOS from strict fan-out/fan-in and artifact-mediated coordination
  toward richer group-thinking/problem-solving capability, while keeping
  isolation-heavy fixtures intact.
- [System Vision: Trong Mem Ngoai Cung](../architect/system-vision-trong-mem-ngoai-cung.md)
  records the cross-system direction that fgOS must combine hard outer
  contracts with soft inner soul/prose/skill, so architecture slices do not
  become either unverifiable prose or rigid harness without living operating
  intelligence.
- [Workspace Topology Architecture](../architect/workspace-topology.md) defines
  repository/workspace/work-state/runtime identities, state classes, root
  ownership, worktree mode invariants, and mutation topology used by
  packaging, work-state, coding-domain, coordination, and config/init/doctor.
  Read this contract before packaging activation, work-state relocation,
  coding-domain worktree changes, or runtime coordination changes.
- [Workspace Topology Audit](../architect/workspace-topology-audit.md) records current
  codebase evidence and gaps behind the topology contract.
- [Workspace Topology Roadmap](../architect/workspace-topology-roadmap.md) sequences the
  decisions and migration slices needed to make the contract enforceable.
```

### Unified diff

```diff
--- docs/architect/README.md#cross-area-intentions
+++ docs/platform/README.md#cross-area-intentions
@@ -1,26 +1,26 @@
-## Cross-Area Intentions
+#### Cross-Area Intentions
 
-- [Architect Roadmap](roadmap.md) keeps the high-level sequencing and delivery
+- [Architect Roadmap](../architect/roadmap.md) keeps the high-level sequencing and delivery
   plan across active architecture streams: agent coordination, coding domain,
   component boundary, host invocation, Node-to-Rust migration, and packaging
   distribution.
-- [Architecture Intent](architecture-intent.md) preserves architecture-wide
+- [Architecture Intent](../architect/architecture-intent.md) preserves architecture-wide
   design intent across deferred capabilities. Its first active thread covers
   widening fgOS from strict fan-out/fan-in and artifact-mediated coordination
   toward richer group-thinking/problem-solving capability, while keeping
   isolation-heavy fixtures intact.
-- [System Vision: Trong Mem Ngoai Cung](system-vision-trong-mem-ngoai-cung.md)
+- [System Vision: Trong Mem Ngoai Cung](../architect/system-vision-trong-mem-ngoai-cung.md)
   records the cross-system direction that fgOS must combine hard outer
   contracts with soft inner soul/prose/skill, so architecture slices do not
   become either unverifiable prose or rigid harness without living operating
   intelligence.
-- [Workspace Topology Architecture](workspace-topology.md) defines
+- [Workspace Topology Architecture](../architect/workspace-topology.md) defines
   repository/workspace/work-state/runtime identities, state classes, root
   ownership, worktree mode invariants, and mutation topology used by
   packaging, work-state, coding-domain, coordination, and config/init/doctor.
   Read this contract before packaging activation, work-state relocation,
   coding-domain worktree changes, or runtime coordination changes.
-- [Workspace Topology Audit](workspace-topology-audit.md) records current
+- [Workspace Topology Audit](../architect/workspace-topology-audit.md) records current
   codebase evidence and gaps behind the topology contract.
-- [Workspace Topology Roadmap](workspace-topology-roadmap.md) sequences the
+- [Workspace Topology Roadmap](../architect/workspace-topology-roadmap.md) sequences the
   decisions and migration slices needed to make the contract enforceable.

```

## claim_8e07597a0163d64f1d5ca3ab8ad7b02a

Source: `docs/architect/README.md#unheaded-block-3`. Target: `docs/platform/README.md#unheaded-block-13`.

Mechanical class: Judgment. Source digest: `e10db7d91f47b1d28d58d88cf1496d275c349f6269dd430171b27bf95d3737e9`. Target digest: `317afa51c7f2a4104fb813f126eca9a13f6ae6a7274d31c43fb5822f848b50a4`.

Full shown source SHA256: `e10db7d91f47b1d28d58d88cf1496d275c349f6269dd430171b27bf95d3737e9`. Full shown target SHA256: `317afa51c7f2a4104fb813f126eca9a13f6ae6a7274d31c43fb5822f848b50a4`.

### Proposed decision

```json
{
  "claimId": "claim_8e07597a0163d64f1d5ca3ab8ad7b02a",
  "sourceUnitDigest": "e10db7d91f47b1d28d58d88cf1496d275c349f6269dd430171b27bf95d3737e9",
  "targetOwner": "docs/platform/README.md",
  "targetAnchor": "unheaded-block-13",
  "targetUnitDigest": "317afa51c7f2a4104fb813f126eca9a13f6ae6a7274d31c43fb5822f848b50a4",
  "targetAncestry": [
    "Platform Documentation",
    "Added in candidate: README source carriage",
    "Architect-Level Design",
    "Cross-Area Intentions"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Judgment: no target digest match. Carry the complete unheaded-block at docs/architect/README.md#unheaded-block-3 (lines 15–38) into docs/platform/README.md#unheaded-block-13 (lines 109–132), the frozen whole-system platform-portal owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. Digest differences come only from the recorded candidate header/frontmatter fence, heading-level shift or physical relative-link rebasing; full before/after units and line mapping are in authoring accounting. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
- [Architect Roadmap](roadmap.md) keeps the high-level sequencing and delivery
  plan across active architecture streams: agent coordination, coding domain,
  component boundary, host invocation, Node-to-Rust migration, and packaging
  distribution.
- [Architecture Intent](architecture-intent.md) preserves architecture-wide
  design intent across deferred capabilities. Its first active thread covers
  widening fgOS from strict fan-out/fan-in and artifact-mediated coordination
  toward richer group-thinking/problem-solving capability, while keeping
  isolation-heavy fixtures intact.
- [System Vision: Trong Mem Ngoai Cung](system-vision-trong-mem-ngoai-cung.md)
  records the cross-system direction that fgOS must combine hard outer
  contracts with soft inner soul/prose/skill, so architecture slices do not
  become either unverifiable prose or rigid harness without living operating
  intelligence.
- [Workspace Topology Architecture](workspace-topology.md) defines
  repository/workspace/work-state/runtime identities, state classes, root
  ownership, worktree mode invariants, and mutation topology used by
  packaging, work-state, coding-domain, coordination, and config/init/doctor.
  Read this contract before packaging activation, work-state relocation,
  coding-domain worktree changes, or runtime coordination changes.
- [Workspace Topology Audit](workspace-topology-audit.md) records current
  codebase evidence and gaps behind the topology contract.
- [Workspace Topology Roadmap](workspace-topology-roadmap.md) sequences the
  decisions and migration slices needed to make the contract enforceable.
```

### Full target shown text

```text
- [Architect Roadmap](../architect/roadmap.md) keeps the high-level sequencing and delivery
  plan across active architecture streams: agent coordination, coding domain,
  component boundary, host invocation, Node-to-Rust migration, and packaging
  distribution.
- [Architecture Intent](../architect/architecture-intent.md) preserves architecture-wide
  design intent across deferred capabilities. Its first active thread covers
  widening fgOS from strict fan-out/fan-in and artifact-mediated coordination
  toward richer group-thinking/problem-solving capability, while keeping
  isolation-heavy fixtures intact.
- [System Vision: Trong Mem Ngoai Cung](../architect/system-vision-trong-mem-ngoai-cung.md)
  records the cross-system direction that fgOS must combine hard outer
  contracts with soft inner soul/prose/skill, so architecture slices do not
  become either unverifiable prose or rigid harness without living operating
  intelligence.
- [Workspace Topology Architecture](../architect/workspace-topology.md) defines
  repository/workspace/work-state/runtime identities, state classes, root
  ownership, worktree mode invariants, and mutation topology used by
  packaging, work-state, coding-domain, coordination, and config/init/doctor.
  Read this contract before packaging activation, work-state relocation,
  coding-domain worktree changes, or runtime coordination changes.
- [Workspace Topology Audit](../architect/workspace-topology-audit.md) records current
  codebase evidence and gaps behind the topology contract.
- [Workspace Topology Roadmap](../architect/workspace-topology-roadmap.md) sequences the
  decisions and migration slices needed to make the contract enforceable.
```

### Unified diff

```diff
--- docs/architect/README.md#unheaded-block-3
+++ docs/platform/README.md#unheaded-block-13
@@ -1,24 +1,24 @@
-- [Architect Roadmap](roadmap.md) keeps the high-level sequencing and delivery
+- [Architect Roadmap](../architect/roadmap.md) keeps the high-level sequencing and delivery
   plan across active architecture streams: agent coordination, coding domain,
   component boundary, host invocation, Node-to-Rust migration, and packaging
   distribution.
-- [Architecture Intent](architecture-intent.md) preserves architecture-wide
+- [Architecture Intent](../architect/architecture-intent.md) preserves architecture-wide
   design intent across deferred capabilities. Its first active thread covers
   widening fgOS from strict fan-out/fan-in and artifact-mediated coordination
   toward richer group-thinking/problem-solving capability, while keeping
   isolation-heavy fixtures intact.
-- [System Vision: Trong Mem Ngoai Cung](system-vision-trong-mem-ngoai-cung.md)
+- [System Vision: Trong Mem Ngoai Cung](../architect/system-vision-trong-mem-ngoai-cung.md)
   records the cross-system direction that fgOS must combine hard outer
   contracts with soft inner soul/prose/skill, so architecture slices do not
   become either unverifiable prose or rigid harness without living operating
   intelligence.
-- [Workspace Topology Architecture](workspace-topology.md) defines
+- [Workspace Topology Architecture](../architect/workspace-topology.md) defines
   repository/workspace/work-state/runtime identities, state classes, root
   ownership, worktree mode invariants, and mutation topology used by
   packaging, work-state, coding-domain, coordination, and config/init/doctor.
   Read this contract before packaging activation, work-state relocation,
   coding-domain worktree changes, or runtime coordination changes.
-- [Workspace Topology Audit](workspace-topology-audit.md) records current
+- [Workspace Topology Audit](../architect/workspace-topology-audit.md) records current
   codebase evidence and gaps behind the topology contract.
-- [Workspace Topology Roadmap](workspace-topology-roadmap.md) sequences the
+- [Workspace Topology Roadmap](../architect/workspace-topology-roadmap.md) sequences the
   decisions and migration slices needed to make the contract enforceable.

```

## claim_75dee385e5e27c6f5cf816ce81da66f3

Source: `docs/architect/README.md#area-portals`. Target: `docs/platform/README.md#area-portals`.

Mechanical class: Judgment. Source digest: `f237948c6913adc9448f1eac6c38c2c470579ec5c50787ac277a4ce1e579431a`. Target digest: `9de4c9e6e752cf7002d6d260c85a20994df0bdb6b6840f9666617fc6603067c0`.

Full shown source SHA256: `bc13d5367894df052c78aa7d80b3aeaaeb1adef6f74bb0ce5b1da87dcc626fc5`. Full shown target SHA256: `4624fc48c110aadf40750710bf371ea6c7857cf6a04fe132f591b1bc6e7f07db`.

### Proposed decision

```json
{
  "claimId": "claim_75dee385e5e27c6f5cf816ce81da66f3",
  "sourceUnitDigest": "f237948c6913adc9448f1eac6c38c2c470579ec5c50787ac277a4ce1e579431a",
  "targetOwner": "docs/platform/README.md",
  "targetAnchor": "area-portals",
  "targetUnitDigest": "9de4c9e6e752cf7002d6d260c85a20994df0bdb6b6840f9666617fc6603067c0",
  "targetAncestry": [
    "Platform Documentation",
    "Added in candidate: README source carriage",
    "Architect-Level Design"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Judgment: no target digest match. Carry the complete heading at docs/architect/README.md#area-portals (lines 40–40) into docs/platform/README.md#area-portals (lines 134–134), the frozen whole-system platform-portal owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. Digest differences come only from the recorded candidate header/frontmatter fence, heading-level shift or physical relative-link rebasing; full before/after units and line mapping are in authoring accounting. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
## Area Portals

- [Agent Coordination](agent-coordination/README.md)
- [Component Boundary](component-boundary/README.md)
- [Domainization](domainization/README.md)
- [Host Invocation And Provider Routing](host-invocation-routing/host-invocation-provider-routing.md)
- [Packaging And Distribution](packaging-distribution/README.md)
```

### Full target shown text

```text
#### Area Portals

- [Agent Coordination](../architect/agent-coordination/README.md)
- [Component Boundary](../architect/component-boundary/README.md)
- [Domainization](../architect/domainization/README.md)
- [Host Invocation And Provider Routing](../architect/host-invocation-routing/host-invocation-provider-routing.md)
- [Packaging And Distribution](../architect/packaging-distribution/README.md)
```

### Unified diff

```diff
--- docs/architect/README.md#area-portals
+++ docs/platform/README.md#area-portals
@@ -1,7 +1,7 @@
-## Area Portals
+#### Area Portals
 
-- [Agent Coordination](agent-coordination/README.md)
-- [Component Boundary](component-boundary/README.md)
-- [Domainization](domainization/README.md)
-- [Host Invocation And Provider Routing](host-invocation-routing/host-invocation-provider-routing.md)
-- [Packaging And Distribution](packaging-distribution/README.md)
+- [Agent Coordination](../architect/agent-coordination/README.md)
+- [Component Boundary](../architect/component-boundary/README.md)
+- [Domainization](../architect/domainization/README.md)
+- [Host Invocation And Provider Routing](../architect/host-invocation-routing/host-invocation-provider-routing.md)
+- [Packaging And Distribution](../architect/packaging-distribution/README.md)

```

## claim_6729755c0a3b1b48ae5fa04ad0b634ef

Source: `docs/architect/README.md#unheaded-block-4`. Target: `docs/platform/README.md#unheaded-block-14`.

Mechanical class: Judgment. Source digest: `9e7c255cf914d8c5c1323713a63906c2c9d51bfd55c03e6443cc4f86e80bc6ac`. Target digest: `bf98fd90b7ce1fac97e09a5bde9e43389e4f86f1dae0a108e30d9d4026f4bd61`.

Full shown source SHA256: `9e7c255cf914d8c5c1323713a63906c2c9d51bfd55c03e6443cc4f86e80bc6ac`. Full shown target SHA256: `bf98fd90b7ce1fac97e09a5bde9e43389e4f86f1dae0a108e30d9d4026f4bd61`.

### Proposed decision

```json
{
  "claimId": "claim_6729755c0a3b1b48ae5fa04ad0b634ef",
  "sourceUnitDigest": "9e7c255cf914d8c5c1323713a63906c2c9d51bfd55c03e6443cc4f86e80bc6ac",
  "targetOwner": "docs/platform/README.md",
  "targetAnchor": "unheaded-block-14",
  "targetUnitDigest": "bf98fd90b7ce1fac97e09a5bde9e43389e4f86f1dae0a108e30d9d4026f4bd61",
  "targetAncestry": [
    "Platform Documentation",
    "Added in candidate: README source carriage",
    "Architect-Level Design",
    "Area Portals"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Judgment: no target digest match. Carry the complete unheaded-block at docs/architect/README.md#unheaded-block-4 (lines 42–46) into docs/platform/README.md#unheaded-block-14 (lines 136–140), the frozen whole-system platform-portal owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. Digest differences come only from the recorded candidate header/frontmatter fence, heading-level shift or physical relative-link rebasing; full before/after units and line mapping are in authoring accounting. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
- [Agent Coordination](agent-coordination/README.md)
- [Component Boundary](component-boundary/README.md)
- [Domainization](domainization/README.md)
- [Host Invocation And Provider Routing](host-invocation-routing/host-invocation-provider-routing.md)
- [Packaging And Distribution](packaging-distribution/README.md)
```

### Full target shown text

```text
- [Agent Coordination](../architect/agent-coordination/README.md)
- [Component Boundary](../architect/component-boundary/README.md)
- [Domainization](../architect/domainization/README.md)
- [Host Invocation And Provider Routing](../architect/host-invocation-routing/host-invocation-provider-routing.md)
- [Packaging And Distribution](../architect/packaging-distribution/README.md)
```

### Unified diff

```diff
--- docs/architect/README.md#unheaded-block-4
+++ docs/platform/README.md#unheaded-block-14
@@ -1,5 +1,5 @@
-- [Agent Coordination](agent-coordination/README.md)
-- [Component Boundary](component-boundary/README.md)
-- [Domainization](domainization/README.md)
-- [Host Invocation And Provider Routing](host-invocation-routing/host-invocation-provider-routing.md)
-- [Packaging And Distribution](packaging-distribution/README.md)
+- [Agent Coordination](../architect/agent-coordination/README.md)
+- [Component Boundary](../architect/component-boundary/README.md)
+- [Domainization](../architect/domainization/README.md)
+- [Host Invocation And Provider Routing](../architect/host-invocation-routing/host-invocation-provider-routing.md)
+- [Packaging And Distribution](../architect/packaging-distribution/README.md)

```

## claim_51a26e783af2c2a7ff8150886092366b

Source: `docs/architect/README.md#cross-area-proposals`. Target: `docs/platform/README.md#cross-area-proposals`.

Mechanical class: Judgment. Source digest: `c18a4e139a27d780f7b72f62023eccce6bf17b105e5ab5d51a86b7eb96fb78fe`. Target digest: `bca95d4d0317f17a3c721637dcc0da5d019deac1b79733304e81cb867011396d`.

Full shown source SHA256: `26c4e268501f2af68604d7d45c643d1b70a324f4de701c3aed3a698a96404a02`. Full shown target SHA256: `7995bf279aabc557cdbd8d272a8438e89c1655cab4e103ddb9b3e60a6d899ffc`.

### Proposed decision

```json
{
  "claimId": "claim_51a26e783af2c2a7ff8150886092366b",
  "sourceUnitDigest": "c18a4e139a27d780f7b72f62023eccce6bf17b105e5ab5d51a86b7eb96fb78fe",
  "targetOwner": "docs/platform/README.md",
  "targetAnchor": "cross-area-proposals",
  "targetUnitDigest": "bca95d4d0317f17a3c721637dcc0da5d019deac1b79733304e81cb867011396d",
  "targetAncestry": [
    "Platform Documentation",
    "Added in candidate: README source carriage",
    "Architect-Level Design"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Judgment: no target digest match. Carry the complete heading at docs/architect/README.md#cross-area-proposals (lines 48–48) into docs/platform/README.md#cross-area-proposals (lines 142–142), the frozen whole-system platform-portal owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. Digest differences come only from the recorded candidate header/frontmatter fence, heading-level shift or physical relative-link rebasing; full before/after units and line mapping are in authoring accounting. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
## Cross-Area Proposals

- [Architect-Level Proposals](proposals/README.md) holds discussion drafts
  whose scope crosses one architecture area. These are not accepted design
  until extracted into canonical architect-level or area-specific documents.
```

### Full target shown text

```text
#### Cross-Area Proposals

- [Architect-Level Proposals](../architect/proposals/README.md) holds discussion drafts
  whose scope crosses one architecture area. These are not accepted design
  until extracted into canonical architect-level or area-specific documents.
```

### Unified diff

```diff
--- docs/architect/README.md#cross-area-proposals
+++ docs/platform/README.md#cross-area-proposals
@@ -1,5 +1,5 @@
-## Cross-Area Proposals
+#### Cross-Area Proposals
 
-- [Architect-Level Proposals](proposals/README.md) holds discussion drafts
+- [Architect-Level Proposals](../architect/proposals/README.md) holds discussion drafts
   whose scope crosses one architecture area. These are not accepted design
   until extracted into canonical architect-level or area-specific documents.

```

## claim_9ef07c1714bdc408ccfcafaa152e41f9

Source: `docs/architect/README.md#unheaded-block-5`. Target: `docs/platform/README.md#unheaded-block-15`.

Mechanical class: Judgment. Source digest: `cc271694835a9bca595580cf746c3cde2c759fc15276e16858466c2cec581a28`. Target digest: `fe53ead8782ad2f6e6fc5f681b19506aeb5d62b3f3e9c7905760b2fb94dbe1ff`.

Full shown source SHA256: `cc271694835a9bca595580cf746c3cde2c759fc15276e16858466c2cec581a28`. Full shown target SHA256: `fe53ead8782ad2f6e6fc5f681b19506aeb5d62b3f3e9c7905760b2fb94dbe1ff`.

### Proposed decision

```json
{
  "claimId": "claim_9ef07c1714bdc408ccfcafaa152e41f9",
  "sourceUnitDigest": "cc271694835a9bca595580cf746c3cde2c759fc15276e16858466c2cec581a28",
  "targetOwner": "docs/platform/README.md",
  "targetAnchor": "unheaded-block-15",
  "targetUnitDigest": "fe53ead8782ad2f6e6fc5f681b19506aeb5d62b3f3e9c7905760b2fb94dbe1ff",
  "targetAncestry": [
    "Platform Documentation",
    "Added in candidate: README source carriage",
    "Architect-Level Design",
    "Cross-Area Proposals"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Judgment: no target digest match. Carry the complete unheaded-block at docs/architect/README.md#unheaded-block-5 (lines 50–52) into docs/platform/README.md#unheaded-block-15 (lines 144–146), the frozen whole-system platform-portal owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. Digest differences come only from the recorded candidate header/frontmatter fence, heading-level shift or physical relative-link rebasing; full before/after units and line mapping are in authoring accounting. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
- [Architect-Level Proposals](proposals/README.md) holds discussion drafts
  whose scope crosses one architecture area. These are not accepted design
  until extracted into canonical architect-level or area-specific documents.
```

### Full target shown text

```text
- [Architect-Level Proposals](../architect/proposals/README.md) holds discussion drafts
  whose scope crosses one architecture area. These are not accepted design
  until extracted into canonical architect-level or area-specific documents.
```

### Unified diff

```diff
--- docs/architect/README.md#unheaded-block-5
+++ docs/platform/README.md#unheaded-block-15
@@ -1,3 +1,3 @@
-- [Architect-Level Proposals](proposals/README.md) holds discussion drafts
+- [Architect-Level Proposals](../architect/proposals/README.md) holds discussion drafts
   whose scope crosses one architecture area. These are not accepted design
   until extracted into canonical architect-level or area-specific documents.

```

## claim_966fde97560d95682b95eaf79ad687e6

Source: `docs/architect/README.md#other-architecture-drafts`. Target: `docs/platform/README.md#other-architecture-drafts`.

Mechanical class: Judgment. Source digest: `03967938736daae01140765c27634b8c0b60ab3d3c028a2e1acf6dd21c7a8f43`. Target digest: `3d9cac1e701b09bbd35c7b3753d34ae6d4cdb5dc7e7de6978730c69ee9ffa670`.

Full shown source SHA256: `6926ff289bc9d697e1506eb6b07cc63b693e296f18931cf8d660635bdb8d6761`. Full shown target SHA256: `c2ee5269b4f40d02e9859c74a620475e30b7b790f6207c0816abe3c34e9b9c6d`.

### Proposed decision

```json
{
  "claimId": "claim_966fde97560d95682b95eaf79ad687e6",
  "sourceUnitDigest": "03967938736daae01140765c27634b8c0b60ab3d3c028a2e1acf6dd21c7a8f43",
  "targetOwner": "docs/platform/README.md",
  "targetAnchor": "other-architecture-drafts",
  "targetUnitDigest": "3d9cac1e701b09bbd35c7b3753d34ae6d4cdb5dc7e7de6978730c69ee9ffa670",
  "targetAncestry": [
    "Platform Documentation",
    "Added in candidate: README source carriage",
    "Architect-Level Design"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Judgment: no target digest match. Carry the complete heading at docs/architect/README.md#other-architecture-drafts (lines 54–54) into docs/platform/README.md#other-architecture-drafts (lines 148–148), the frozen whole-system platform-portal owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. Digest differences come only from the recorded candidate header/frontmatter fence, heading-level shift or physical relative-link rebasing; full before/after units and line mapping are in authoring accounting. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
## Other Architecture Drafts

- [Dispatch Control Plane Redesign](dispatch-control-plane-redesign.md)
- [Doing Coordination Redesign](doing-coordination-redesign.md)
- [Knowledge Registry Redesign](knowledge-registry-redesign.md)
```

### Full target shown text

```text
#### Other Architecture Drafts

- [Dispatch Control Plane Redesign](../architect/dispatch-control-plane-redesign.md)
- [Doing Coordination Redesign](../architect/doing-coordination-redesign.md)
- [Knowledge Registry Redesign](../architect/knowledge-registry-redesign.md)
```

### Unified diff

```diff
--- docs/architect/README.md#other-architecture-drafts
+++ docs/platform/README.md#other-architecture-drafts
@@ -1,5 +1,5 @@
-## Other Architecture Drafts
+#### Other Architecture Drafts
 
-- [Dispatch Control Plane Redesign](dispatch-control-plane-redesign.md)
-- [Doing Coordination Redesign](doing-coordination-redesign.md)
-- [Knowledge Registry Redesign](knowledge-registry-redesign.md)
+- [Dispatch Control Plane Redesign](../architect/dispatch-control-plane-redesign.md)
+- [Doing Coordination Redesign](../architect/doing-coordination-redesign.md)
+- [Knowledge Registry Redesign](../architect/knowledge-registry-redesign.md)

```

## claim_f42e391a572ab02fa51adb4e64446f0e

Source: `docs/architect/README.md#unheaded-block-6`. Target: `docs/platform/README.md#unheaded-block-16`.

Mechanical class: Judgment. Source digest: `bb699555388ff13671ac77bc5c1f5f4c04540426a29df43b80101d350eb7bbc2`. Target digest: `442292211d93a3f6229329f1000f6a6d3288a2374569dc8e0ce3754adefdb19b`.

Full shown source SHA256: `bb699555388ff13671ac77bc5c1f5f4c04540426a29df43b80101d350eb7bbc2`. Full shown target SHA256: `442292211d93a3f6229329f1000f6a6d3288a2374569dc8e0ce3754adefdb19b`.

### Proposed decision

```json
{
  "claimId": "claim_f42e391a572ab02fa51adb4e64446f0e",
  "sourceUnitDigest": "bb699555388ff13671ac77bc5c1f5f4c04540426a29df43b80101d350eb7bbc2",
  "targetOwner": "docs/platform/README.md",
  "targetAnchor": "unheaded-block-16",
  "targetUnitDigest": "442292211d93a3f6229329f1000f6a6d3288a2374569dc8e0ce3754adefdb19b",
  "targetAncestry": [
    "Platform Documentation",
    "Added in candidate: README source carriage",
    "Architect-Level Design",
    "Other Architecture Drafts"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Judgment: no target digest match. Carry the complete unheaded-block at docs/architect/README.md#unheaded-block-6 (lines 56–58) into docs/platform/README.md#unheaded-block-16 (lines 150–152), the frozen whole-system platform-portal owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. Digest differences come only from the recorded candidate header/frontmatter fence, heading-level shift or physical relative-link rebasing; full before/after units and line mapping are in authoring accounting. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
- [Dispatch Control Plane Redesign](dispatch-control-plane-redesign.md)
- [Doing Coordination Redesign](doing-coordination-redesign.md)
- [Knowledge Registry Redesign](knowledge-registry-redesign.md)
```

### Full target shown text

```text
- [Dispatch Control Plane Redesign](../architect/dispatch-control-plane-redesign.md)
- [Doing Coordination Redesign](../architect/doing-coordination-redesign.md)
- [Knowledge Registry Redesign](../architect/knowledge-registry-redesign.md)
```

### Unified diff

```diff
--- docs/architect/README.md#unheaded-block-6
+++ docs/platform/README.md#unheaded-block-16
@@ -1,3 +1,3 @@
-- [Dispatch Control Plane Redesign](dispatch-control-plane-redesign.md)
-- [Doing Coordination Redesign](doing-coordination-redesign.md)
-- [Knowledge Registry Redesign](knowledge-registry-redesign.md)
+- [Dispatch Control Plane Redesign](../architect/dispatch-control-plane-redesign.md)
+- [Doing Coordination Redesign](../architect/doing-coordination-redesign.md)
+- [Knowledge Registry Redesign](../architect/knowledge-registry-redesign.md)

```
