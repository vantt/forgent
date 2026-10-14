# Bounded whole-system source review request

Content commit: `a8a10abc1a24218518a14764f68c8d86f4810f91`. Author session: `codex-session:37@2026-10-15`. Review mode requested: ordinary.

Shard: `plans/260925-documentation-authority-unification/ledger/decisions/s6-whole-system-workspace-topology.json`. Part 1/1; entries: **61**. Sidecar: `review-request-261015-0450-whole-system-13.md.json`.

Read review-brief.md, owner-answers.md A28–A37, frozen whole-system map, constitution, vocabulary and shard schema. Apply A36: mechanically check every row (full digest recompute, anchor check, shard/pack equality); deeply read the reviewer-seeded sample plus every differing-digest row in both directions with its diff. Preserve conditions, qualifiers, dated status and complete payload; verify one owner and labelled additions. No approval is supplied here.

Step 6’s closing review is a **checkpoint review whose sensitivity pack the reviewer holds**. The author has not created, seen or selected that pack/key. Ordinary review and A36 sampling do not replace checkpoint sensitivity.

Ordinary verdict contract: `Reviewer: <independent identity>`, `Review mode: ordinary`, request/content/shard pins; one own note and full 64-hex shown-unit digests per row. Use ok/rework/hold. Consolidate parts into a complete report for the original shard before unchanged ordinary application; never edit decisions manually.

| Claim | Verdict | Note | Source digest | Target digest |
|---|---|---|---|---|

A36 mandatory differing-digest rows (2): `claim_b7836e79df85137e931c3b27fb212e1e`, `claim_081f727213d245958366e64c71c41bac`.

Absent-target rows (0): none.

This pack has 20 Weak-exact/Judgment rows; reviewer independently draws/records at least 10 by seed (>=15%, minimum 10, all if fewer), plus every differing pair listed above. Each verdict note says deep or mechanical. If >3% of deep-read rows need rework, deeply read the complete pack before reporting. Author selected no sample. Whole batch: 300 Unit-exact, 392 Weak-exact, 134 Judgment, all 826 pending; 123 mandatory differing pairs. The 79-row batch-wide lower bound does not replace each pack minimum.

Reverse review: the separate native candidate-unverified request/list covers the complete scoped population; it is not reset per sliced pack. Full shown text hashes below bind payload separately from native heading identity digests.

## claim_b7836e79df85137e931c3b27fb212e1e

Source: `docs/architect/workspace-topology.md#workspace-topology-architecture`. Target: `docs/platform/system-architecture/architecture/workspace-topology.md#workspace-topology-architecture`.

Mechanical class: Judgment. Source digest: `dbbddecaa7d55c08594bb562576db34a91215ebbd035781a1dba012b2812b85c`. Target digest: `b0c3bdc7f48af0ef7eae16dc2ecbb7363504b33c1c1807c63a84ae2d4f989f90`.

Full shown source SHA256: `9827a473a71629f8fb5406f8b26b3fac6abf9276fb74a6c0ae462fefcf16786c`. Full shown target SHA256: `bf5e039c9b1eeaad35d77f60759a9506bbd3166e87fb13e6c40aaaf92c5b682a`.

### Proposed decision

```json
{
  "claimId": "claim_b7836e79df85137e931c3b27fb212e1e",
  "sourceUnitDigest": "dbbddecaa7d55c08594bb562576db34a91215ebbd035781a1dba012b2812b85c",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology.md",
  "targetAnchor": "workspace-topology-architecture",
  "targetUnitDigest": "b0c3bdc7f48af0ef7eae16dc2ecbb7363504b33c1c1807c63a84ae2d4f989f90",
  "targetAncestry": [],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Judgment: no target digest match. Carry the complete heading at docs/architect/workspace-topology.md#workspace-topology-architecture (lines 1–1) into docs/platform/system-architecture/architecture/workspace-topology.md#workspace-topology-architecture (lines 1–1), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. Digest differences come only from the recorded candidate header/frontmatter fence, heading-level shift or physical relative-link rebasing; full before/after units and line mapping are in authoring accounting. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

````text
# Workspace Topology Architecture

**Status:** Architecture contract draft; pending decision on durable work-history
placement.
**Date:** 2026-09-04.
**Scope:** Identity, state ownership, root resolution, and mutation authority for
fgOS in single-workspace and isolated-worktree modes.

This document is the topology contract. It defines the primitive every
packaging, work-state, coding-domain, runtime-coordination, config/init/doctor,
and future host-surface design must use:

```txt
TopologyContext = resolved identities + typed roots + granted capabilities
```

No business/workflow module should infer "main root", "cwd root", or a `.fgos`
path directly. It should receive a `TopologyContext` and use the typed root or
capability named by that context.

Companion documents:

- [workspace-topology-audit.md](workspace-topology-audit.md) records current
  codebase evidence and gaps.
- [workspace-topology-roadmap.md](workspace-topology-roadmap.md) records
  decision order and migration slices.
````

### Full target shown text

````text
# Workspace Topology Architecture

```txt
Document type: Architecture
Audience: Human reviewer, architect, maintainer, agent
Purpose: Preserve the complete workspace-topology.md source at its frozen-map candidate owner
Design status: Candidate
Implementation: Partial — inherited source qualifications; not independently truth-verified
Provenance: docs/architect/workspace-topology.md at 69dd3ee7fd84bc5e93fe9c75d63622d4f5aa8539 (blob 0513cd70c080c546bb009a253adab60dbb5d43f1)
Writer type: Agent carriage; independent review pending
Canonical for: Nothing until promotion; current source remains docs/architect/workspace-topology.md
Use this when: Reviewing whole-system candidate carriage and placement
Do not use this for: Inferring implementation, promotion or superseding source authority
Last reviewed: Pending independent review
Related:
- docs/architect/workspace-topology.md
- docs/platform/component-boundary.md
- docs/platform/architecture-map.md
Supersedes: None — candidate only
Superseded by: None
```

Added in candidate: migration metadata and physical link rebasing. Original source metadata, dates, design limits and historic claims below are provenance, not fresh review. Current truth is unverified; A28 requires sampled truth review at this checkpoint and full truth review at promotion.


**Status:** Architecture contract draft; pending decision on durable work-history
placement.
**Date:** 2026-09-04.
**Scope:** Identity, state ownership, root resolution, and mutation authority for
fgOS in single-workspace and isolated-worktree modes.

This document is the topology contract. It defines the primitive every
packaging, work-state, coding-domain, runtime-coordination, config/init/doctor,
and future host-surface design must use:

```txt
TopologyContext = resolved identities + typed roots + granted capabilities
```

No business/workflow module should infer "main root", "cwd root", or a `.fgos`
path directly. It should receive a `TopologyContext` and use the typed root or
capability named by that context.

Companion documents:

- [workspace-topology-audit.md](../../../architect/workspace-topology-audit.md) records current
  codebase evidence and gaps.
- [workspace-topology-roadmap.md](../../../architect/workspace-topology-roadmap.md) records
  decision order and migration slices.
````

### Unified diff

````diff
--- docs/architect/workspace-topology.md#workspace-topology-architecture
+++ docs/platform/system-architecture/architecture/workspace-topology.md#workspace-topology-architecture
@@ -1,4 +1,27 @@
 # Workspace Topology Architecture
+
+```txt
+Document type: Architecture
+Audience: Human reviewer, architect, maintainer, agent
+Purpose: Preserve the complete workspace-topology.md source at its frozen-map candidate owner
+Design status: Candidate
+Implementation: Partial — inherited source qualifications; not independently truth-verified
+Provenance: docs/architect/workspace-topology.md at 69dd3ee7fd84bc5e93fe9c75d63622d4f5aa8539 (blob 0513cd70c080c546bb009a253adab60dbb5d43f1)
+Writer type: Agent carriage; independent review pending
+Canonical for: Nothing until promotion; current source remains docs/architect/workspace-topology.md
+Use this when: Reviewing whole-system candidate carriage and placement
+Do not use this for: Inferring implementation, promotion or superseding source authority
+Last reviewed: Pending independent review
+Related:
+- docs/architect/workspace-topology.md
+- docs/platform/component-boundary.md
+- docs/platform/architecture-map.md
+Supersedes: None — candidate only
+Superseded by: None
+```
+
+Added in candidate: migration metadata and physical link rebasing. Original source metadata, dates, design limits and historic claims below are provenance, not fresh review. Current truth is unverified; A28 requires sampled truth review at this checkpoint and full truth review at promotion.
+
 
 **Status:** Architecture contract draft; pending decision on durable work-history
 placement.
@@ -20,7 +43,7 @@
 
 Companion documents:
 
-- [workspace-topology-audit.md](workspace-topology-audit.md) records current
+- [workspace-topology-audit.md](../../../architect/workspace-topology-audit.md) records current
   codebase evidence and gaps.
-- [workspace-topology-roadmap.md](workspace-topology-roadmap.md) records
+- [workspace-topology-roadmap.md](../../../architect/workspace-topology-roadmap.md) records
   decision order and migration slices.

````

## claim_2ff6ef0c9ddd759bfa5490b708036996

Source: `docs/architect/workspace-topology.md#unheaded-block-1`. Target: `docs/platform/system-architecture/architecture/workspace-topology.md#unheaded-block-3`.

Mechanical class: Unit-exact. Source digest: `23dfefb7d31af758f7248261a875778d05dc6fc597cb9090750673f0400f8343`. Target digest: `23dfefb7d31af758f7248261a875778d05dc6fc597cb9090750673f0400f8343`.

Full shown source SHA256: `23dfefb7d31af758f7248261a875778d05dc6fc597cb9090750673f0400f8343`. Full shown target SHA256: `23dfefb7d31af758f7248261a875778d05dc6fc597cb9090750673f0400f8343`.

### Proposed decision

```json
{
  "claimId": "claim_2ff6ef0c9ddd759bfa5490b708036996",
  "sourceUnitDigest": "23dfefb7d31af758f7248261a875778d05dc6fc597cb9090750673f0400f8343",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology.md",
  "targetAnchor": "unheaded-block-3",
  "targetUnitDigest": "23dfefb7d31af758f7248261a875778d05dc6fc597cb9090750673f0400f8343",
  "targetAncestry": [
    "Workspace Topology Architecture"
  ],
  "claimKind": "decision",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/workspace-topology.md#unheaded-block-1 (lines 3–7) into docs/platform/system-architecture/architecture/workspace-topology.md#unheaded-block-3 (lines 26–30), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
**Status:** Architecture contract draft; pending decision on durable work-history
placement.
**Date:** 2026-09-04.
**Scope:** Identity, state ownership, root resolution, and mutation authority for
fgOS in single-workspace and isolated-worktree modes.
```

### Full target shown text

```text
**Status:** Architecture contract draft; pending decision on durable work-history
placement.
**Date:** 2026-09-04.
**Scope:** Identity, state ownership, root resolution, and mutation authority for
fgOS in single-workspace and isolated-worktree modes.
```

### Unified diff

```diff
No text difference.
```

## claim_285780516840ab4c8c6ea312fe5bbc71

Source: `docs/architect/workspace-topology.md#unheaded-block-2`. Target: `docs/platform/system-architecture/architecture/workspace-topology.md#unheaded-block-4`.

Mechanical class: Unit-exact. Source digest: `a31b60ed2d72b3b0ba574546dfe8278cc31b1d11a2f0cb803bed5650c3e2d375`. Target digest: `a31b60ed2d72b3b0ba574546dfe8278cc31b1d11a2f0cb803bed5650c3e2d375`.

Full shown source SHA256: `a31b60ed2d72b3b0ba574546dfe8278cc31b1d11a2f0cb803bed5650c3e2d375`. Full shown target SHA256: `a31b60ed2d72b3b0ba574546dfe8278cc31b1d11a2f0cb803bed5650c3e2d375`.

### Proposed decision

```json
{
  "claimId": "claim_285780516840ab4c8c6ea312fe5bbc71",
  "sourceUnitDigest": "a31b60ed2d72b3b0ba574546dfe8278cc31b1d11a2f0cb803bed5650c3e2d375",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology.md",
  "targetAnchor": "unheaded-block-4",
  "targetUnitDigest": "a31b60ed2d72b3b0ba574546dfe8278cc31b1d11a2f0cb803bed5650c3e2d375",
  "targetAncestry": [
    "Workspace Topology Architecture"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/workspace-topology.md#unheaded-block-2 (lines 9–11) into docs/platform/system-architecture/architecture/workspace-topology.md#unheaded-block-4 (lines 32–34), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
This document is the topology contract. It defines the primitive every
packaging, work-state, coding-domain, runtime-coordination, config/init/doctor,
and future host-surface design must use:
```

### Full target shown text

```text
This document is the topology contract. It defines the primitive every
packaging, work-state, coding-domain, runtime-coordination, config/init/doctor,
and future host-surface design must use:
```

### Unified diff

```diff
No text difference.
```

## claim_72606c7d6f06b680ab8bcba01db103cc

Source: `docs/architect/workspace-topology.md#unheaded-block-3`. Target: `docs/platform/system-architecture/architecture/workspace-topology.md#unheaded-block-5`.

Mechanical class: Unit-exact. Source digest: `8862efb32471a0fa299ff6201cabb9829f2e31da14a61646f20c99bf71b9e586`. Target digest: `8862efb32471a0fa299ff6201cabb9829f2e31da14a61646f20c99bf71b9e586`.

Full shown source SHA256: `8862efb32471a0fa299ff6201cabb9829f2e31da14a61646f20c99bf71b9e586`. Full shown target SHA256: `8862efb32471a0fa299ff6201cabb9829f2e31da14a61646f20c99bf71b9e586`.

### Proposed decision

```json
{
  "claimId": "claim_72606c7d6f06b680ab8bcba01db103cc",
  "sourceUnitDigest": "8862efb32471a0fa299ff6201cabb9829f2e31da14a61646f20c99bf71b9e586",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology.md",
  "targetAnchor": "unheaded-block-5",
  "targetUnitDigest": "8862efb32471a0fa299ff6201cabb9829f2e31da14a61646f20c99bf71b9e586",
  "targetAncestry": [
    "Workspace Topology Architecture"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/workspace-topology.md#unheaded-block-3 (lines 13–15) into docs/platform/system-architecture/architecture/workspace-topology.md#unheaded-block-5 (lines 36–38), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

````text
```txt
TopologyContext = resolved identities + typed roots + granted capabilities
```
````

### Full target shown text

````text
```txt
TopologyContext = resolved identities + typed roots + granted capabilities
```
````

### Unified diff

```diff
No text difference.
```

## claim_8e142358fdebd169cef5a3b415f776b3

Source: `docs/architect/workspace-topology.md#unheaded-block-4`. Target: `docs/platform/system-architecture/architecture/workspace-topology.md#unheaded-block-6`.

Mechanical class: Unit-exact. Source digest: `a99e2e72140a05f40ca30f5cdca5ffda8953e8f45c25e325f9d2b9d1334d72cb`. Target digest: `a99e2e72140a05f40ca30f5cdca5ffda8953e8f45c25e325f9d2b9d1334d72cb`.

Full shown source SHA256: `a99e2e72140a05f40ca30f5cdca5ffda8953e8f45c25e325f9d2b9d1334d72cb`. Full shown target SHA256: `a99e2e72140a05f40ca30f5cdca5ffda8953e8f45c25e325f9d2b9d1334d72cb`.

### Proposed decision

```json
{
  "claimId": "claim_8e142358fdebd169cef5a3b415f776b3",
  "sourceUnitDigest": "a99e2e72140a05f40ca30f5cdca5ffda8953e8f45c25e325f9d2b9d1334d72cb",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology.md",
  "targetAnchor": "unheaded-block-6",
  "targetUnitDigest": "a99e2e72140a05f40ca30f5cdca5ffda8953e8f45c25e325f9d2b9d1334d72cb",
  "targetAncestry": [
    "Workspace Topology Architecture"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/workspace-topology.md#unheaded-block-4 (lines 17–19) into docs/platform/system-architecture/architecture/workspace-topology.md#unheaded-block-6 (lines 40–42), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
No business/workflow module should infer "main root", "cwd root", or a `.fgos`
path directly. It should receive a `TopologyContext` and use the typed root or
capability named by that context.
```

### Full target shown text

```text
No business/workflow module should infer "main root", "cwd root", or a `.fgos`
path directly. It should receive a `TopologyContext` and use the typed root or
capability named by that context.
```

### Unified diff

```diff
No text difference.
```

## claim_081f727213d245958366e64c71c41bac

Source: `docs/architect/workspace-topology.md#unheaded-block-5`. Target: `docs/platform/system-architecture/architecture/workspace-topology.md#unheaded-block-7`.

Mechanical class: Judgment. Source digest: `b26dbf111de801c75d34547849213c54761519fb5aa83318057aa593857396c6`. Target digest: `1a555fe16c47829985441102ae00adaaa4b71ddbe4679a5967a6b320f6b61ed3`.

Full shown source SHA256: `b26dbf111de801c75d34547849213c54761519fb5aa83318057aa593857396c6`. Full shown target SHA256: `1a555fe16c47829985441102ae00adaaa4b71ddbe4679a5967a6b320f6b61ed3`.

### Proposed decision

```json
{
  "claimId": "claim_081f727213d245958366e64c71c41bac",
  "sourceUnitDigest": "b26dbf111de801c75d34547849213c54761519fb5aa83318057aa593857396c6",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology.md",
  "targetAnchor": "unheaded-block-7",
  "targetUnitDigest": "1a555fe16c47829985441102ae00adaaa4b71ddbe4679a5967a6b320f6b61ed3",
  "targetAncestry": [
    "Workspace Topology Architecture"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Judgment: no target digest match. Carry the complete unheaded-block at docs/architect/workspace-topology.md#unheaded-block-5 (lines 21–26) into docs/platform/system-architecture/architecture/workspace-topology.md#unheaded-block-7 (lines 44–49), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. Digest differences come only from the recorded candidate header/frontmatter fence, heading-level shift or physical relative-link rebasing; full before/after units and line mapping are in authoring accounting. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
Companion documents:

- [workspace-topology-audit.md](workspace-topology-audit.md) records current
  codebase evidence and gaps.
- [workspace-topology-roadmap.md](workspace-topology-roadmap.md) records
  decision order and migration slices.
```

### Full target shown text

```text
Companion documents:

- [workspace-topology-audit.md](../../../architect/workspace-topology-audit.md) records current
  codebase evidence and gaps.
- [workspace-topology-roadmap.md](../../../architect/workspace-topology-roadmap.md) records
  decision order and migration slices.
```

### Unified diff

```diff
--- docs/architect/workspace-topology.md#unheaded-block-5
+++ docs/platform/system-architecture/architecture/workspace-topology.md#unheaded-block-7
@@ -1,6 +1,6 @@
 Companion documents:
 
-- [workspace-topology-audit.md](workspace-topology-audit.md) records current
+- [workspace-topology-audit.md](../../../architect/workspace-topology-audit.md) records current
   codebase evidence and gaps.
-- [workspace-topology-roadmap.md](workspace-topology-roadmap.md) records
+- [workspace-topology-roadmap.md](../../../architect/workspace-topology-roadmap.md) records
   decision order and migration slices.

```

## claim_0c484c800ecda9608ca05b2e11ab4eeb

Source: `docs/architect/workspace-topology.md#1-contract-goal`. Target: `docs/platform/system-architecture/architecture/workspace-topology.md#1-contract-goal`.

Mechanical class: Weak-exact. Source digest: `114e825bc363a72d08c881dc8bec9dca64c74bbee12ca50cb437a6a2ad5925aa`. Target digest: `114e825bc363a72d08c881dc8bec9dca64c74bbee12ca50cb437a6a2ad5925aa`.

Full shown source SHA256: `013cd78320bf32f783e446ccbcb206d09357a2b1873311ebfda307691b9e30eb`. Full shown target SHA256: `013cd78320bf32f783e446ccbcb206d09357a2b1873311ebfda307691b9e30eb`.

### Proposed decision

```json
{
  "claimId": "claim_0c484c800ecda9608ca05b2e11ab4eeb",
  "sourceUnitDigest": "114e825bc363a72d08c881dc8bec9dca64c74bbee12ca50cb437a6a2ad5925aa",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology.md",
  "targetAnchor": "1-contract-goal",
  "targetUnitDigest": "114e825bc363a72d08c881dc8bec9dca64c74bbee12ca50cb437a6a2ad5925aa",
  "targetAncestry": [
    "Workspace Topology Architecture"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. Carry the complete heading at docs/architect/workspace-topology.md#1-contract-goal (lines 28–28) into docs/platform/system-architecture/architecture/workspace-topology.md#1-contract-goal (lines 51–51), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

````text
## 1. Contract Goal

"Project root" is not a strong enough abstraction for fgOS.

The same repository can simultaneously contain:

- branch/workspace policy files;
- hot durable workflow history;
- machine-local runtime coordination;
- workspace-local projections;
- immutable runtime payloads;
- derived caches/logs/temp files;
- multiple linked worktrees with different checked-out config and pins.

The contract goal is to make these questions mechanically answerable before any
operation mutates state:

```txt
Which workspace policy is read?
Which durable work-state is mutated?
Which coordination state is shared?
Which runtime artifact is authorized?
Which checkout may become dirty?
Which locks/leases fence the mutation?
```

If an operation cannot prove the identity/root/capability it needs, it must
refuse mutation. Read-only diagnostics may continue when safe.
````

### Full target shown text

````text
## 1. Contract Goal

"Project root" is not a strong enough abstraction for fgOS.

The same repository can simultaneously contain:

- branch/workspace policy files;
- hot durable workflow history;
- machine-local runtime coordination;
- workspace-local projections;
- immutable runtime payloads;
- derived caches/logs/temp files;
- multiple linked worktrees with different checked-out config and pins.

The contract goal is to make these questions mechanically answerable before any
operation mutates state:

```txt
Which workspace policy is read?
Which durable work-state is mutated?
Which coordination state is shared?
Which runtime artifact is authorized?
Which checkout may become dirty?
Which locks/leases fence the mutation?
```

If an operation cannot prove the identity/root/capability it needs, it must
refuse mutation. Read-only diagnostics may continue when safe.
````

### Unified diff

```diff
No text difference.
```

## claim_4ac23d5e83ef2434593a26dadd1bba6e

Source: `docs/architect/workspace-topology.md#unheaded-block-6`. Target: `docs/platform/system-architecture/architecture/workspace-topology.md#unheaded-block-8`.

Mechanical class: Unit-exact. Source digest: `0757916f75f1ca25022ad46fa5b6d27d2fa2908d683002614229ccb65eef09a8`. Target digest: `0757916f75f1ca25022ad46fa5b6d27d2fa2908d683002614229ccb65eef09a8`.

Full shown source SHA256: `0757916f75f1ca25022ad46fa5b6d27d2fa2908d683002614229ccb65eef09a8`. Full shown target SHA256: `0757916f75f1ca25022ad46fa5b6d27d2fa2908d683002614229ccb65eef09a8`.

### Proposed decision

```json
{
  "claimId": "claim_4ac23d5e83ef2434593a26dadd1bba6e",
  "sourceUnitDigest": "0757916f75f1ca25022ad46fa5b6d27d2fa2908d683002614229ccb65eef09a8",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology.md",
  "targetAnchor": "unheaded-block-8",
  "targetUnitDigest": "0757916f75f1ca25022ad46fa5b6d27d2fa2908d683002614229ccb65eef09a8",
  "targetAncestry": [
    "Workspace Topology Architecture",
    "1. Contract Goal"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/workspace-topology.md#unheaded-block-6 (lines 30–30) into docs/platform/system-architecture/architecture/workspace-topology.md#unheaded-block-8 (lines 53–53), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
"Project root" is not a strong enough abstraction for fgOS.
```

### Full target shown text

```text
"Project root" is not a strong enough abstraction for fgOS.
```

### Unified diff

```diff
No text difference.
```

## claim_9b81a51cf5c2c76e4640b63fb0134297

Source: `docs/architect/workspace-topology.md#unheaded-block-7`. Target: `docs/platform/system-architecture/architecture/workspace-topology.md#unheaded-block-9`.

Mechanical class: Unit-exact. Source digest: `6ad9b74605a3192be97956615ee4478efb5977d2293bd2815758a7b67e1733ef`. Target digest: `6ad9b74605a3192be97956615ee4478efb5977d2293bd2815758a7b67e1733ef`.

Full shown source SHA256: `6ad9b74605a3192be97956615ee4478efb5977d2293bd2815758a7b67e1733ef`. Full shown target SHA256: `6ad9b74605a3192be97956615ee4478efb5977d2293bd2815758a7b67e1733ef`.

### Proposed decision

```json
{
  "claimId": "claim_9b81a51cf5c2c76e4640b63fb0134297",
  "sourceUnitDigest": "6ad9b74605a3192be97956615ee4478efb5977d2293bd2815758a7b67e1733ef",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology.md",
  "targetAnchor": "unheaded-block-9",
  "targetUnitDigest": "6ad9b74605a3192be97956615ee4478efb5977d2293bd2815758a7b67e1733ef",
  "targetAncestry": [
    "Workspace Topology Architecture",
    "1. Contract Goal"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/workspace-topology.md#unheaded-block-7 (lines 32–32) into docs/platform/system-architecture/architecture/workspace-topology.md#unheaded-block-9 (lines 55–55), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
The same repository can simultaneously contain:
```

### Full target shown text

```text
The same repository can simultaneously contain:
```

### Unified diff

```diff
No text difference.
```

## claim_e360f5283233730b3a87fc9372d9dfb3

Source: `docs/architect/workspace-topology.md#unheaded-block-8`. Target: `docs/platform/system-architecture/architecture/workspace-topology.md#unheaded-block-10`.

Mechanical class: Unit-exact. Source digest: `aea3b3b8d3b9d36a092fff11d20a41e9cd24544403dbc6c33924453a2b211af4`. Target digest: `aea3b3b8d3b9d36a092fff11d20a41e9cd24544403dbc6c33924453a2b211af4`.

Full shown source SHA256: `aea3b3b8d3b9d36a092fff11d20a41e9cd24544403dbc6c33924453a2b211af4`. Full shown target SHA256: `aea3b3b8d3b9d36a092fff11d20a41e9cd24544403dbc6c33924453a2b211af4`.

### Proposed decision

```json
{
  "claimId": "claim_e360f5283233730b3a87fc9372d9dfb3",
  "sourceUnitDigest": "aea3b3b8d3b9d36a092fff11d20a41e9cd24544403dbc6c33924453a2b211af4",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology.md",
  "targetAnchor": "unheaded-block-10",
  "targetUnitDigest": "aea3b3b8d3b9d36a092fff11d20a41e9cd24544403dbc6c33924453a2b211af4",
  "targetAncestry": [
    "Workspace Topology Architecture",
    "1. Contract Goal"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/workspace-topology.md#unheaded-block-8 (lines 34–40) into docs/platform/system-architecture/architecture/workspace-topology.md#unheaded-block-10 (lines 57–63), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
- branch/workspace policy files;
- hot durable workflow history;
- machine-local runtime coordination;
- workspace-local projections;
- immutable runtime payloads;
- derived caches/logs/temp files;
- multiple linked worktrees with different checked-out config and pins.
```

### Full target shown text

```text
- branch/workspace policy files;
- hot durable workflow history;
- machine-local runtime coordination;
- workspace-local projections;
- immutable runtime payloads;
- derived caches/logs/temp files;
- multiple linked worktrees with different checked-out config and pins.
```

### Unified diff

```diff
No text difference.
```

## claim_ccb56167e070608b4b25b805550ec3c3

Source: `docs/architect/workspace-topology.md#unheaded-block-9`. Target: `docs/platform/system-architecture/architecture/workspace-topology.md#unheaded-block-11`.

Mechanical class: Unit-exact. Source digest: `dc2a9db68df12bba281865eb6d197ae783b80b9eb95270557abcb8969ddce9db`. Target digest: `dc2a9db68df12bba281865eb6d197ae783b80b9eb95270557abcb8969ddce9db`.

Full shown source SHA256: `dc2a9db68df12bba281865eb6d197ae783b80b9eb95270557abcb8969ddce9db`. Full shown target SHA256: `dc2a9db68df12bba281865eb6d197ae783b80b9eb95270557abcb8969ddce9db`.

### Proposed decision

```json
{
  "claimId": "claim_ccb56167e070608b4b25b805550ec3c3",
  "sourceUnitDigest": "dc2a9db68df12bba281865eb6d197ae783b80b9eb95270557abcb8969ddce9db",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology.md",
  "targetAnchor": "unheaded-block-11",
  "targetUnitDigest": "dc2a9db68df12bba281865eb6d197ae783b80b9eb95270557abcb8969ddce9db",
  "targetAncestry": [
    "Workspace Topology Architecture",
    "1. Contract Goal"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/workspace-topology.md#unheaded-block-9 (lines 42–43) into docs/platform/system-architecture/architecture/workspace-topology.md#unheaded-block-11 (lines 65–66), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
The contract goal is to make these questions mechanically answerable before any
operation mutates state:
```

### Full target shown text

```text
The contract goal is to make these questions mechanically answerable before any
operation mutates state:
```

### Unified diff

```diff
No text difference.
```

## claim_39ef8073b5e76da3ba7a7be103f1a5ee

Source: `docs/architect/workspace-topology.md#unheaded-block-10`. Target: `docs/platform/system-architecture/architecture/workspace-topology.md#unheaded-block-12`.

Mechanical class: Unit-exact. Source digest: `11e6c1b57e834019379aceacafaa01bc1a421cede5199824956cabcc74271290`. Target digest: `11e6c1b57e834019379aceacafaa01bc1a421cede5199824956cabcc74271290`.

Full shown source SHA256: `11e6c1b57e834019379aceacafaa01bc1a421cede5199824956cabcc74271290`. Full shown target SHA256: `11e6c1b57e834019379aceacafaa01bc1a421cede5199824956cabcc74271290`.

### Proposed decision

```json
{
  "claimId": "claim_39ef8073b5e76da3ba7a7be103f1a5ee",
  "sourceUnitDigest": "11e6c1b57e834019379aceacafaa01bc1a421cede5199824956cabcc74271290",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology.md",
  "targetAnchor": "unheaded-block-12",
  "targetUnitDigest": "11e6c1b57e834019379aceacafaa01bc1a421cede5199824956cabcc74271290",
  "targetAncestry": [
    "Workspace Topology Architecture",
    "1. Contract Goal"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/workspace-topology.md#unheaded-block-10 (lines 45–52) into docs/platform/system-architecture/architecture/workspace-topology.md#unheaded-block-12 (lines 68–75), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

````text
```txt
Which workspace policy is read?
Which durable work-state is mutated?
Which coordination state is shared?
Which runtime artifact is authorized?
Which checkout may become dirty?
Which locks/leases fence the mutation?
```
````

### Full target shown text

````text
```txt
Which workspace policy is read?
Which durable work-state is mutated?
Which coordination state is shared?
Which runtime artifact is authorized?
Which checkout may become dirty?
Which locks/leases fence the mutation?
```
````

### Unified diff

```diff
No text difference.
```

## claim_4b468b3315e6fcb2540a98e6c3fa0657

Source: `docs/architect/workspace-topology.md#unheaded-block-11`. Target: `docs/platform/system-architecture/architecture/workspace-topology.md#unheaded-block-13`.

Mechanical class: Unit-exact. Source digest: `97bf68c704bf5b0577110801042b13e91d56a4f2b74e1c401befcc10e5ca5d47`. Target digest: `97bf68c704bf5b0577110801042b13e91d56a4f2b74e1c401befcc10e5ca5d47`.

Full shown source SHA256: `97bf68c704bf5b0577110801042b13e91d56a4f2b74e1c401befcc10e5ca5d47`. Full shown target SHA256: `97bf68c704bf5b0577110801042b13e91d56a4f2b74e1c401befcc10e5ca5d47`.

### Proposed decision

```json
{
  "claimId": "claim_4b468b3315e6fcb2540a98e6c3fa0657",
  "sourceUnitDigest": "97bf68c704bf5b0577110801042b13e91d56a4f2b74e1c401befcc10e5ca5d47",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology.md",
  "targetAnchor": "unheaded-block-13",
  "targetUnitDigest": "97bf68c704bf5b0577110801042b13e91d56a4f2b74e1c401befcc10e5ca5d47",
  "targetAncestry": [
    "Workspace Topology Architecture",
    "1. Contract Goal"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/workspace-topology.md#unheaded-block-11 (lines 54–55) into docs/platform/system-architecture/architecture/workspace-topology.md#unheaded-block-13 (lines 77–78), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
If an operation cannot prove the identity/root/capability it needs, it must
refuse mutation. Read-only diagnostics may continue when safe.
```

### Full target shown text

```text
If an operation cannot prove the identity/root/capability it needs, it must
refuse mutation. Read-only diagnostics may continue when safe.
```

### Unified diff

```diff
No text difference.
```

## claim_2914e355f5fbb6f7d57fc842bae6f03f

Source: `docs/architect/workspace-topology.md#2-identities`. Target: `docs/platform/system-architecture/architecture/workspace-topology.md#2-identities`.

Mechanical class: Weak-exact. Source digest: `3d303a6ee14a2dce9909101f1c621c216ea3aea243846f15a267afe72f6ad85b`. Target digest: `3d303a6ee14a2dce9909101f1c621c216ea3aea243846f15a267afe72f6ad85b`.

Full shown source SHA256: `9f61f6aa5292eb676ac4a3597ba119d36e15b110411df0d5b82fb3796072a5f4`. Full shown target SHA256: `9f61f6aa5292eb676ac4a3597ba119d36e15b110411df0d5b82fb3796072a5f4`.

### Proposed decision

```json
{
  "claimId": "claim_2914e355f5fbb6f7d57fc842bae6f03f",
  "sourceUnitDigest": "3d303a6ee14a2dce9909101f1c621c216ea3aea243846f15a267afe72f6ad85b",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology.md",
  "targetAnchor": "2-identities",
  "targetUnitDigest": "3d303a6ee14a2dce9909101f1c621c216ea3aea243846f15a267afe72f6ad85b",
  "targetAncestry": [
    "Workspace Topology Architecture"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. Carry the complete heading at docs/architect/workspace-topology.md#2-identities (lines 57–57) into docs/platform/system-architecture/architecture/workspace-topology.md#2-identities (lines 80–80), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
## 2. Identities

Topology has three scope identities and one runtime content identity.

| Identity | Meaning | Creation | Persistence | Move/Symlink Rule |
|---|---|---|---|---|
| `repositoryId` | Logical repository/project lineage. Shared by main checkout and linked worktrees. | Git: read or create `<repositoryLocalStateRoot>/identity.json`, using git common dir only to find the shared repository anchor. Non-Git: read or create local workspace identity. | Git: machine-local binding under repository-local fgOS state; exported/imported through tracked checkpoint metadata only when explicitly supported. Non-Git: local only. | Git common dir and realpath are used for path comparison. Display paths are not identity. |
| `workspaceId` | One checkout/worktree where commands run and host-visible files live. | Read or create `<workspaceLocalStateRoot>/identity.json`. Main checkout is also a workspace. | Stable across path rename when its local identity file moves with the workspace; regenerated only if identity file is absent and no registry binding proves continuity. | Two symlink paths to the same checkout resolve to the same `workspaceId`. |
| `workStateId` | Durable fgOS work-state stream being read/mutated. | Bound by workspace policy or repository identity record. Fresh project creates one default `workStateId`. | Stored in repository-local fgOS state and referenced by workspace policy/binding. | Multiple workspaces may share one `workStateId` only through explicit binding. |
| `artifactDigest` | Immutable runtime release content identity. | Digest of canonical release tree manifest. | Stored in release manifest and activation binding. | Not a topology scope. It is used for runtime compatibility and writer authority. |

Rules:

- Main checkout is not automatically the owner of all fgOS truth.
- `artifactDigest` must not be used as a repository/workspace/work-state
  identity.
- Any binding change for `repositoryId`, `workspaceId`, or `workStateId` is a
  topology mutation and requires the relevant capability.
```

### Full target shown text

```text
## 2. Identities

Topology has three scope identities and one runtime content identity.

| Identity | Meaning | Creation | Persistence | Move/Symlink Rule |
|---|---|---|---|---|
| `repositoryId` | Logical repository/project lineage. Shared by main checkout and linked worktrees. | Git: read or create `<repositoryLocalStateRoot>/identity.json`, using git common dir only to find the shared repository anchor. Non-Git: read or create local workspace identity. | Git: machine-local binding under repository-local fgOS state; exported/imported through tracked checkpoint metadata only when explicitly supported. Non-Git: local only. | Git common dir and realpath are used for path comparison. Display paths are not identity. |
| `workspaceId` | One checkout/worktree where commands run and host-visible files live. | Read or create `<workspaceLocalStateRoot>/identity.json`. Main checkout is also a workspace. | Stable across path rename when its local identity file moves with the workspace; regenerated only if identity file is absent and no registry binding proves continuity. | Two symlink paths to the same checkout resolve to the same `workspaceId`. |
| `workStateId` | Durable fgOS work-state stream being read/mutated. | Bound by workspace policy or repository identity record. Fresh project creates one default `workStateId`. | Stored in repository-local fgOS state and referenced by workspace policy/binding. | Multiple workspaces may share one `workStateId` only through explicit binding. |
| `artifactDigest` | Immutable runtime release content identity. | Digest of canonical release tree manifest. | Stored in release manifest and activation binding. | Not a topology scope. It is used for runtime compatibility and writer authority. |

Rules:

- Main checkout is not automatically the owner of all fgOS truth.
- `artifactDigest` must not be used as a repository/workspace/work-state
  identity.
- Any binding change for `repositoryId`, `workspaceId`, or `workStateId` is a
  topology mutation and requires the relevant capability.
```

### Unified diff

```diff
No text difference.
```

## claim_e4091fccbb828619b627aa2ab32246d7

Source: `docs/architect/workspace-topology.md#unheaded-block-12`. Target: `docs/platform/system-architecture/architecture/workspace-topology.md#unheaded-block-14`.

Mechanical class: Unit-exact. Source digest: `b5fc7663663fd69af2ea721e53fa23158f1f70dd3e3f1f0319fa12802a14b956`. Target digest: `b5fc7663663fd69af2ea721e53fa23158f1f70dd3e3f1f0319fa12802a14b956`.

Full shown source SHA256: `b5fc7663663fd69af2ea721e53fa23158f1f70dd3e3f1f0319fa12802a14b956`. Full shown target SHA256: `b5fc7663663fd69af2ea721e53fa23158f1f70dd3e3f1f0319fa12802a14b956`.

### Proposed decision

```json
{
  "claimId": "claim_e4091fccbb828619b627aa2ab32246d7",
  "sourceUnitDigest": "b5fc7663663fd69af2ea721e53fa23158f1f70dd3e3f1f0319fa12802a14b956",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology.md",
  "targetAnchor": "unheaded-block-14",
  "targetUnitDigest": "b5fc7663663fd69af2ea721e53fa23158f1f70dd3e3f1f0319fa12802a14b956",
  "targetAncestry": [
    "Workspace Topology Architecture",
    "2. Identities"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/workspace-topology.md#unheaded-block-12 (lines 59–59) into docs/platform/system-architecture/architecture/workspace-topology.md#unheaded-block-14 (lines 82–82), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
Topology has three scope identities and one runtime content identity.
```

### Full target shown text

```text
Topology has three scope identities and one runtime content identity.
```

### Unified diff

```diff
No text difference.
```

## claim_80187f3dc0bcdc54a1cae6bd9ed4ef35

Source: `docs/architect/workspace-topology.md#unheaded-block-13`. Target: `docs/platform/system-architecture/architecture/workspace-topology.md#unheaded-block-15`.

Mechanical class: Unit-exact. Source digest: `9453a17513b11be8a9746eae9420b3a07161f70707f674b4d0d25fd12a6aad49`. Target digest: `9453a17513b11be8a9746eae9420b3a07161f70707f674b4d0d25fd12a6aad49`.

Full shown source SHA256: `9453a17513b11be8a9746eae9420b3a07161f70707f674b4d0d25fd12a6aad49`. Full shown target SHA256: `9453a17513b11be8a9746eae9420b3a07161f70707f674b4d0d25fd12a6aad49`.

### Proposed decision

```json
{
  "claimId": "claim_80187f3dc0bcdc54a1cae6bd9ed4ef35",
  "sourceUnitDigest": "9453a17513b11be8a9746eae9420b3a07161f70707f674b4d0d25fd12a6aad49",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology.md",
  "targetAnchor": "unheaded-block-15",
  "targetUnitDigest": "9453a17513b11be8a9746eae9420b3a07161f70707f674b4d0d25fd12a6aad49",
  "targetAncestry": [
    "Workspace Topology Architecture",
    "2. Identities"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/workspace-topology.md#unheaded-block-13 (lines 61–66) into docs/platform/system-architecture/architecture/workspace-topology.md#unheaded-block-15 (lines 84–89), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
| Identity | Meaning | Creation | Persistence | Move/Symlink Rule |
|---|---|---|---|---|
| `repositoryId` | Logical repository/project lineage. Shared by main checkout and linked worktrees. | Git: read or create `<repositoryLocalStateRoot>/identity.json`, using git common dir only to find the shared repository anchor. Non-Git: read or create local workspace identity. | Git: machine-local binding under repository-local fgOS state; exported/imported through tracked checkpoint metadata only when explicitly supported. Non-Git: local only. | Git common dir and realpath are used for path comparison. Display paths are not identity. |
| `workspaceId` | One checkout/worktree where commands run and host-visible files live. | Read or create `<workspaceLocalStateRoot>/identity.json`. Main checkout is also a workspace. | Stable across path rename when its local identity file moves with the workspace; regenerated only if identity file is absent and no registry binding proves continuity. | Two symlink paths to the same checkout resolve to the same `workspaceId`. |
| `workStateId` | Durable fgOS work-state stream being read/mutated. | Bound by workspace policy or repository identity record. Fresh project creates one default `workStateId`. | Stored in repository-local fgOS state and referenced by workspace policy/binding. | Multiple workspaces may share one `workStateId` only through explicit binding. |
| `artifactDigest` | Immutable runtime release content identity. | Digest of canonical release tree manifest. | Stored in release manifest and activation binding. | Not a topology scope. It is used for runtime compatibility and writer authority. |
```

### Full target shown text

```text
| Identity | Meaning | Creation | Persistence | Move/Symlink Rule |
|---|---|---|---|---|
| `repositoryId` | Logical repository/project lineage. Shared by main checkout and linked worktrees. | Git: read or create `<repositoryLocalStateRoot>/identity.json`, using git common dir only to find the shared repository anchor. Non-Git: read or create local workspace identity. | Git: machine-local binding under repository-local fgOS state; exported/imported through tracked checkpoint metadata only when explicitly supported. Non-Git: local only. | Git common dir and realpath are used for path comparison. Display paths are not identity. |
| `workspaceId` | One checkout/worktree where commands run and host-visible files live. | Read or create `<workspaceLocalStateRoot>/identity.json`. Main checkout is also a workspace. | Stable across path rename when its local identity file moves with the workspace; regenerated only if identity file is absent and no registry binding proves continuity. | Two symlink paths to the same checkout resolve to the same `workspaceId`. |
| `workStateId` | Durable fgOS work-state stream being read/mutated. | Bound by workspace policy or repository identity record. Fresh project creates one default `workStateId`. | Stored in repository-local fgOS state and referenced by workspace policy/binding. | Multiple workspaces may share one `workStateId` only through explicit binding. |
| `artifactDigest` | Immutable runtime release content identity. | Digest of canonical release tree manifest. | Stored in release manifest and activation binding. | Not a topology scope. It is used for runtime compatibility and writer authority. |
```

### Unified diff

```diff
No text difference.
```

## claim_fd65f6674343924ebc7a1b696085c339

Source: `docs/architect/workspace-topology.md#unheaded-block-14`. Target: `docs/platform/system-architecture/architecture/workspace-topology.md#unheaded-block-16`.

Mechanical class: Unit-exact. Source digest: `b7bccd9bcbb1e45920d6b8bf8a38ba0df7ad8422b05163beea7fb28ae797ceae`. Target digest: `b7bccd9bcbb1e45920d6b8bf8a38ba0df7ad8422b05163beea7fb28ae797ceae`.

Full shown source SHA256: `b7bccd9bcbb1e45920d6b8bf8a38ba0df7ad8422b05163beea7fb28ae797ceae`. Full shown target SHA256: `b7bccd9bcbb1e45920d6b8bf8a38ba0df7ad8422b05163beea7fb28ae797ceae`.

### Proposed decision

```json
{
  "claimId": "claim_fd65f6674343924ebc7a1b696085c339",
  "sourceUnitDigest": "b7bccd9bcbb1e45920d6b8bf8a38ba0df7ad8422b05163beea7fb28ae797ceae",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology.md",
  "targetAnchor": "unheaded-block-16",
  "targetUnitDigest": "b7bccd9bcbb1e45920d6b8bf8a38ba0df7ad8422b05163beea7fb28ae797ceae",
  "targetAncestry": [
    "Workspace Topology Architecture",
    "2. Identities"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/workspace-topology.md#unheaded-block-14 (lines 68–74) into docs/platform/system-architecture/architecture/workspace-topology.md#unheaded-block-16 (lines 91–97), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
Rules:

- Main checkout is not automatically the owner of all fgOS truth.
- `artifactDigest` must not be used as a repository/workspace/work-state
  identity.
- Any binding change for `repositoryId`, `workspaceId`, or `workStateId` is a
  topology mutation and requires the relevant capability.
```

### Full target shown text

```text
Rules:

- Main checkout is not automatically the owner of all fgOS truth.
- `artifactDigest` must not be used as a repository/workspace/work-state
  identity.
- Any binding change for `repositoryId`, `workspaceId`, or `workStateId` is a
  topology mutation and requires the relevant capability.
```

### Unified diff

```diff
No text difference.
```

## claim_3e04d76aef6d34b77588108c8c22dad5

Source: `docs/architect/workspace-topology.md#3-state-classes`. Target: `docs/platform/system-architecture/architecture/workspace-topology.md#3-state-classes`.

Mechanical class: Weak-exact. Source digest: `0717b8fbbb2a0cd8f71d4b660c06b51649f3a10ae93f14fb3f046f4a1fff1a3a`. Target digest: `0717b8fbbb2a0cd8f71d4b660c06b51649f3a10ae93f14fb3f046f4a1fff1a3a`.

Full shown source SHA256: `a77200e0af81f45375a4ccd975c0728d337d8e024855379ad43206b74c6639fb`. Full shown target SHA256: `a77200e0af81f45375a4ccd975c0728d337d8e024855379ad43206b74c6639fb`.

### Proposed decision

```json
{
  "claimId": "claim_3e04d76aef6d34b77588108c8c22dad5",
  "sourceUnitDigest": "0717b8fbbb2a0cd8f71d4b660c06b51649f3a10ae93f14fb3f046f4a1fff1a3a",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology.md",
  "targetAnchor": "3-state-classes",
  "targetUnitDigest": "0717b8fbbb2a0cd8f71d4b660c06b51649f3a10ae93f14fb3f046f4a1fff1a3a",
  "targetAncestry": [
    "Workspace Topology Architecture"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. Carry the complete heading at docs/architect/workspace-topology.md#3-state-classes (lines 76–76) into docs/platform/system-architecture/architecture/workspace-topology.md#3-state-classes (lines 99–99), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
## 3. State Classes

Each state class is closed for V1. A caller must not invent a new class without
updating this contract.

| Class | Examples | Scope | Authoritative Root | Durability | Git Policy | Sharing | Writer Capability | Lock Domain | Recovery Authority |
|---|---|---|---|---|---|---|---|---|---|
| `workspacePolicy` | `.fgos/config.json`, `.fgos/distribution.json`, domain config | `workspaceId` / branch | `configPolicyRoot` | durable branch content | tracked | follows checkout/branch | `workspace-policy:write` | `workspace:<workspaceId>` | explicit local fix or user edit |
| `workHistoryHot` | active event shards, current durable workflow log | `workStateId` | `workHistoryRoot` | durable hot state | not in worktree hot path | shared by bound workspaces | `work-history:append` | `work-state:<workStateId>` | fail-closed; explicit recovery |
| `workHistoryCheckpoint` | sealed history segments for backup/sync/audit | `workStateId` + repository branch | workspace content root under `.fgos/history/checkpoints/` | durable exchange artifact | tracked immutable | travels with Git | `history-checkpoint:seal` | `work-state:<workStateId>` then `repository-git` | import/seal tooling only |
| `runtimeCoordination` | claims, sessions, assignment claims, locks, leases | `workStateId` + machine | `runtimeCoordinationRoot` | machine-local operational state | ignored | shared by bound workspaces on same machine | `coordination:write` | `coordination:<workStateId>` | automatic only with provable owner death; otherwise explicit recovery |
| `workspaceProjection` | skills, agents, managed host files, generated docs blocks | `workspaceId` | `projectionRoot` plus projection ledger | rebuildable or managed | ignored/generated unless explicitly managed | not shared across workspaces | `projection:write` | `projection:<workspaceId>` | `fgos doctor --fix` / projection repair |
| `runtimePayload` | release trees, manifests, payload binaries/prose/skills source | `artifactDigest` + machine trust domain | `machineReleaseStore` | immutable content-addressed | ignored / outside repo | shared across repositories by digest | `runtime-payload:stage` | `artifact:<artifactDigest>` | quarantine or restage |
| `activationBinding` | selected runtime for one workspace | `workspaceId` | `activationBindingRoot` | durable machine-local binding | ignored workspace-local state | workspace-local | `activation:publish` | `activation:<workspaceId>` | rollback to previous ready binding or explicit repair |
| `derivedState` | read models, caches, diagnostic logs, temp files | declared owner scope | `derivedStateRoot` | rebuildable unless declared | ignored | owner-declared | owner-specific | owner-specific | delete/rebuild when safe |

V1 default: hot work history is outside the tracked workspace tree, and tracked
history checkpoints are immutable exchange artifacts. This is the recommended
contract shape. If the project temporarily keeps hot history in Git, it is a
compatibility mode and must still expose the same logical roots/capabilities.
```

### Full target shown text

```text
## 3. State Classes

Each state class is closed for V1. A caller must not invent a new class without
updating this contract.

| Class | Examples | Scope | Authoritative Root | Durability | Git Policy | Sharing | Writer Capability | Lock Domain | Recovery Authority |
|---|---|---|---|---|---|---|---|---|---|
| `workspacePolicy` | `.fgos/config.json`, `.fgos/distribution.json`, domain config | `workspaceId` / branch | `configPolicyRoot` | durable branch content | tracked | follows checkout/branch | `workspace-policy:write` | `workspace:<workspaceId>` | explicit local fix or user edit |
| `workHistoryHot` | active event shards, current durable workflow log | `workStateId` | `workHistoryRoot` | durable hot state | not in worktree hot path | shared by bound workspaces | `work-history:append` | `work-state:<workStateId>` | fail-closed; explicit recovery |
| `workHistoryCheckpoint` | sealed history segments for backup/sync/audit | `workStateId` + repository branch | workspace content root under `.fgos/history/checkpoints/` | durable exchange artifact | tracked immutable | travels with Git | `history-checkpoint:seal` | `work-state:<workStateId>` then `repository-git` | import/seal tooling only |
| `runtimeCoordination` | claims, sessions, assignment claims, locks, leases | `workStateId` + machine | `runtimeCoordinationRoot` | machine-local operational state | ignored | shared by bound workspaces on same machine | `coordination:write` | `coordination:<workStateId>` | automatic only with provable owner death; otherwise explicit recovery |
| `workspaceProjection` | skills, agents, managed host files, generated docs blocks | `workspaceId` | `projectionRoot` plus projection ledger | rebuildable or managed | ignored/generated unless explicitly managed | not shared across workspaces | `projection:write` | `projection:<workspaceId>` | `fgos doctor --fix` / projection repair |
| `runtimePayload` | release trees, manifests, payload binaries/prose/skills source | `artifactDigest` + machine trust domain | `machineReleaseStore` | immutable content-addressed | ignored / outside repo | shared across repositories by digest | `runtime-payload:stage` | `artifact:<artifactDigest>` | quarantine or restage |
| `activationBinding` | selected runtime for one workspace | `workspaceId` | `activationBindingRoot` | durable machine-local binding | ignored workspace-local state | workspace-local | `activation:publish` | `activation:<workspaceId>` | rollback to previous ready binding or explicit repair |
| `derivedState` | read models, caches, diagnostic logs, temp files | declared owner scope | `derivedStateRoot` | rebuildable unless declared | ignored | owner-declared | owner-specific | owner-specific | delete/rebuild when safe |

V1 default: hot work history is outside the tracked workspace tree, and tracked
history checkpoints are immutable exchange artifacts. This is the recommended
contract shape. If the project temporarily keeps hot history in Git, it is a
compatibility mode and must still expose the same logical roots/capabilities.
```

### Unified diff

```diff
No text difference.
```

## claim_14c9a7a4552602674b153f2a72b7d2f1

Source: `docs/architect/workspace-topology.md#unheaded-block-15`. Target: `docs/platform/system-architecture/architecture/workspace-topology.md#unheaded-block-17`.

Mechanical class: Unit-exact. Source digest: `7a633ed06026d47649fc2d4ac35de02cd5fb252f3ab7687e152739b0d26e9090`. Target digest: `7a633ed06026d47649fc2d4ac35de02cd5fb252f3ab7687e152739b0d26e9090`.

Full shown source SHA256: `7a633ed06026d47649fc2d4ac35de02cd5fb252f3ab7687e152739b0d26e9090`. Full shown target SHA256: `7a633ed06026d47649fc2d4ac35de02cd5fb252f3ab7687e152739b0d26e9090`.

### Proposed decision

```json
{
  "claimId": "claim_14c9a7a4552602674b153f2a72b7d2f1",
  "sourceUnitDigest": "7a633ed06026d47649fc2d4ac35de02cd5fb252f3ab7687e152739b0d26e9090",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology.md",
  "targetAnchor": "unheaded-block-17",
  "targetUnitDigest": "7a633ed06026d47649fc2d4ac35de02cd5fb252f3ab7687e152739b0d26e9090",
  "targetAncestry": [
    "Workspace Topology Architecture",
    "3. State Classes"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/workspace-topology.md#unheaded-block-15 (lines 78–79) into docs/platform/system-architecture/architecture/workspace-topology.md#unheaded-block-17 (lines 101–102), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
Each state class is closed for V1. A caller must not invent a new class without
updating this contract.
```

### Full target shown text

```text
Each state class is closed for V1. A caller must not invent a new class without
updating this contract.
```

### Unified diff

```diff
No text difference.
```

## claim_23f6d99ca2848dda4830fcdfa3b9d4b7

Source: `docs/architect/workspace-topology.md#unheaded-block-16`. Target: `docs/platform/system-architecture/architecture/workspace-topology.md#unheaded-block-18`.

Mechanical class: Unit-exact. Source digest: `d9029278ed88bae0d1ac412cadc03b4ce8f827c44e37a153079811e5c1d460d1`. Target digest: `d9029278ed88bae0d1ac412cadc03b4ce8f827c44e37a153079811e5c1d460d1`.

Full shown source SHA256: `d9029278ed88bae0d1ac412cadc03b4ce8f827c44e37a153079811e5c1d460d1`. Full shown target SHA256: `d9029278ed88bae0d1ac412cadc03b4ce8f827c44e37a153079811e5c1d460d1`.

### Proposed decision

```json
{
  "claimId": "claim_23f6d99ca2848dda4830fcdfa3b9d4b7",
  "sourceUnitDigest": "d9029278ed88bae0d1ac412cadc03b4ce8f827c44e37a153079811e5c1d460d1",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology.md",
  "targetAnchor": "unheaded-block-18",
  "targetUnitDigest": "d9029278ed88bae0d1ac412cadc03b4ce8f827c44e37a153079811e5c1d460d1",
  "targetAncestry": [
    "Workspace Topology Architecture",
    "3. State Classes"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/workspace-topology.md#unheaded-block-16 (lines 81–90) into docs/platform/system-architecture/architecture/workspace-topology.md#unheaded-block-18 (lines 104–113), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
| Class | Examples | Scope | Authoritative Root | Durability | Git Policy | Sharing | Writer Capability | Lock Domain | Recovery Authority |
|---|---|---|---|---|---|---|---|---|---|
| `workspacePolicy` | `.fgos/config.json`, `.fgos/distribution.json`, domain config | `workspaceId` / branch | `configPolicyRoot` | durable branch content | tracked | follows checkout/branch | `workspace-policy:write` | `workspace:<workspaceId>` | explicit local fix or user edit |
| `workHistoryHot` | active event shards, current durable workflow log | `workStateId` | `workHistoryRoot` | durable hot state | not in worktree hot path | shared by bound workspaces | `work-history:append` | `work-state:<workStateId>` | fail-closed; explicit recovery |
| `workHistoryCheckpoint` | sealed history segments for backup/sync/audit | `workStateId` + repository branch | workspace content root under `.fgos/history/checkpoints/` | durable exchange artifact | tracked immutable | travels with Git | `history-checkpoint:seal` | `work-state:<workStateId>` then `repository-git` | import/seal tooling only |
| `runtimeCoordination` | claims, sessions, assignment claims, locks, leases | `workStateId` + machine | `runtimeCoordinationRoot` | machine-local operational state | ignored | shared by bound workspaces on same machine | `coordination:write` | `coordination:<workStateId>` | automatic only with provable owner death; otherwise explicit recovery |
| `workspaceProjection` | skills, agents, managed host files, generated docs blocks | `workspaceId` | `projectionRoot` plus projection ledger | rebuildable or managed | ignored/generated unless explicitly managed | not shared across workspaces | `projection:write` | `projection:<workspaceId>` | `fgos doctor --fix` / projection repair |
| `runtimePayload` | release trees, manifests, payload binaries/prose/skills source | `artifactDigest` + machine trust domain | `machineReleaseStore` | immutable content-addressed | ignored / outside repo | shared across repositories by digest | `runtime-payload:stage` | `artifact:<artifactDigest>` | quarantine or restage |
| `activationBinding` | selected runtime for one workspace | `workspaceId` | `activationBindingRoot` | durable machine-local binding | ignored workspace-local state | workspace-local | `activation:publish` | `activation:<workspaceId>` | rollback to previous ready binding or explicit repair |
| `derivedState` | read models, caches, diagnostic logs, temp files | declared owner scope | `derivedStateRoot` | rebuildable unless declared | ignored | owner-declared | owner-specific | owner-specific | delete/rebuild when safe |
```

### Full target shown text

```text
| Class | Examples | Scope | Authoritative Root | Durability | Git Policy | Sharing | Writer Capability | Lock Domain | Recovery Authority |
|---|---|---|---|---|---|---|---|---|---|
| `workspacePolicy` | `.fgos/config.json`, `.fgos/distribution.json`, domain config | `workspaceId` / branch | `configPolicyRoot` | durable branch content | tracked | follows checkout/branch | `workspace-policy:write` | `workspace:<workspaceId>` | explicit local fix or user edit |
| `workHistoryHot` | active event shards, current durable workflow log | `workStateId` | `workHistoryRoot` | durable hot state | not in worktree hot path | shared by bound workspaces | `work-history:append` | `work-state:<workStateId>` | fail-closed; explicit recovery |
| `workHistoryCheckpoint` | sealed history segments for backup/sync/audit | `workStateId` + repository branch | workspace content root under `.fgos/history/checkpoints/` | durable exchange artifact | tracked immutable | travels with Git | `history-checkpoint:seal` | `work-state:<workStateId>` then `repository-git` | import/seal tooling only |
| `runtimeCoordination` | claims, sessions, assignment claims, locks, leases | `workStateId` + machine | `runtimeCoordinationRoot` | machine-local operational state | ignored | shared by bound workspaces on same machine | `coordination:write` | `coordination:<workStateId>` | automatic only with provable owner death; otherwise explicit recovery |
| `workspaceProjection` | skills, agents, managed host files, generated docs blocks | `workspaceId` | `projectionRoot` plus projection ledger | rebuildable or managed | ignored/generated unless explicitly managed | not shared across workspaces | `projection:write` | `projection:<workspaceId>` | `fgos doctor --fix` / projection repair |
| `runtimePayload` | release trees, manifests, payload binaries/prose/skills source | `artifactDigest` + machine trust domain | `machineReleaseStore` | immutable content-addressed | ignored / outside repo | shared across repositories by digest | `runtime-payload:stage` | `artifact:<artifactDigest>` | quarantine or restage |
| `activationBinding` | selected runtime for one workspace | `workspaceId` | `activationBindingRoot` | durable machine-local binding | ignored workspace-local state | workspace-local | `activation:publish` | `activation:<workspaceId>` | rollback to previous ready binding or explicit repair |
| `derivedState` | read models, caches, diagnostic logs, temp files | declared owner scope | `derivedStateRoot` | rebuildable unless declared | ignored | owner-declared | owner-specific | owner-specific | delete/rebuild when safe |
```

### Unified diff

```diff
No text difference.
```

## claim_4b396b3f1e4e17a69dca1a2d643d00eb

Source: `docs/architect/workspace-topology.md#unheaded-block-17`. Target: `docs/platform/system-architecture/architecture/workspace-topology.md#unheaded-block-19`.

Mechanical class: Unit-exact. Source digest: `5302f56b649e8c85081d6ada5a529e8b8e30e0de95c57a3cc0102a9c8e2cf787`. Target digest: `5302f56b649e8c85081d6ada5a529e8b8e30e0de95c57a3cc0102a9c8e2cf787`.

Full shown source SHA256: `5302f56b649e8c85081d6ada5a529e8b8e30e0de95c57a3cc0102a9c8e2cf787`. Full shown target SHA256: `5302f56b649e8c85081d6ada5a529e8b8e30e0de95c57a3cc0102a9c8e2cf787`.

### Proposed decision

```json
{
  "claimId": "claim_4b396b3f1e4e17a69dca1a2d643d00eb",
  "sourceUnitDigest": "5302f56b649e8c85081d6ada5a529e8b8e30e0de95c57a3cc0102a9c8e2cf787",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology.md",
  "targetAnchor": "unheaded-block-19",
  "targetUnitDigest": "5302f56b649e8c85081d6ada5a529e8b8e30e0de95c57a3cc0102a9c8e2cf787",
  "targetAncestry": [
    "Workspace Topology Architecture",
    "3. State Classes"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/workspace-topology.md#unheaded-block-17 (lines 92–95) into docs/platform/system-architecture/architecture/workspace-topology.md#unheaded-block-19 (lines 115–118), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
V1 default: hot work history is outside the tracked workspace tree, and tracked
history checkpoints are immutable exchange artifacts. This is the recommended
contract shape. If the project temporarily keeps hot history in Git, it is a
compatibility mode and must still expose the same logical roots/capabilities.
```

### Full target shown text

```text
V1 default: hot work history is outside the tracked workspace tree, and tracked
history checkpoints are immutable exchange artifacts. This is the recommended
contract shape. If the project temporarily keeps hot history in Git, it is a
compatibility mode and must still expose the same logical roots/capabilities.
```

### Unified diff

```diff
No text difference.
```

## claim_9a3700a1cec5fc00bc55825b1c474569

Source: `docs/architect/workspace-topology.md#4-physical-placement-defaults`. Target: `docs/platform/system-architecture/architecture/workspace-topology.md#4-physical-placement-defaults`.

Mechanical class: Weak-exact. Source digest: `c4705264d4dbd92ff84a092eb98088e97f6d81e044ae1c01abc4f32e4da3ca18`. Target digest: `c4705264d4dbd92ff84a092eb98088e97f6d81e044ae1c01abc4f32e4da3ca18`.

Full shown source SHA256: `7425959cff88d662bf3cd4d8fdb4fd6f7028b44d829c67d791dbf26fd4a2ffe7`. Full shown target SHA256: `7425959cff88d662bf3cd4d8fdb4fd6f7028b44d829c67d791dbf26fd4a2ffe7`.

### Proposed decision

```json
{
  "claimId": "claim_9a3700a1cec5fc00bc55825b1c474569",
  "sourceUnitDigest": "c4705264d4dbd92ff84a092eb98088e97f6d81e044ae1c01abc4f32e4da3ca18",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology.md",
  "targetAnchor": "4-physical-placement-defaults",
  "targetUnitDigest": "c4705264d4dbd92ff84a092eb98088e97f6d81e044ae1c01abc4f32e4da3ca18",
  "targetAncestry": [
    "Workspace Topology Architecture"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. Carry the complete heading at docs/architect/workspace-topology.md#4-physical-placement-defaults (lines 97–97) into docs/platform/system-architecture/architecture/workspace-topology.md#4-physical-placement-defaults (lines 120–120), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
## 4. Physical Placement Defaults
```

### Full target shown text

```text
## 4. Physical Placement Defaults
```

### Unified diff

```diff
No text difference.
```

## claim_a8066551ad92ae37f9a4add7ba9c9c6b

Source: `docs/architect/workspace-topology.md#git-workspace`. Target: `docs/platform/system-architecture/architecture/workspace-topology.md#git-workspace`.

Mechanical class: Weak-exact. Source digest: `5a6447ad5a9ac2b62b600edd0bf97bf58cb0ebc00086cf483c0ac1fb15c3f84c`. Target digest: `5a6447ad5a9ac2b62b600edd0bf97bf58cb0ebc00086cf483c0ac1fb15c3f84c`.

Full shown source SHA256: `12eac3856ead1d14cc3391ab056c61a9abd3a34fb11b9419c2054cb3968fcf4b`. Full shown target SHA256: `12eac3856ead1d14cc3391ab056c61a9abd3a34fb11b9419c2054cb3968fcf4b`.

### Proposed decision

```json
{
  "claimId": "claim_a8066551ad92ae37f9a4add7ba9c9c6b",
  "sourceUnitDigest": "5a6447ad5a9ac2b62b600edd0bf97bf58cb0ebc00086cf483c0ac1fb15c3f84c",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology.md",
  "targetAnchor": "git-workspace",
  "targetUnitDigest": "5a6447ad5a9ac2b62b600edd0bf97bf58cb0ebc00086cf483c0ac1fb15c3f84c",
  "targetAncestry": [
    "Workspace Topology Architecture",
    "4. Physical Placement Defaults"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. Carry the complete heading at docs/architect/workspace-topology.md#git-workspace (lines 99–99) into docs/platform/system-architecture/architecture/workspace-topology.md#git-workspace (lines 122–122), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

````text
### Git Workspace

```txt
<workspace-root>/
  product files
  .fgos/
    config.json
    distribution.json
    installation/
      bin/
        fgos
        fgos-runner
      root.json
      activation.json
      projections/ledger.json
    history/checkpoints/

<main-checkout-root>/.fgos/local/
  identity.json
  work-state/<workStateId>/
    active-events/
    coordination/
    claims/
    derived/
  workspaces/<workspaceId>/
    registry.json

<workspace-local-state-root>/
  identity.json
  transient/

<machine-state>/fgos/releases/<artifactDigest>/
  manifest.json
  bin/
  workshop/
```

Notes:

- `<git-common-dir>` is the common Git directory returned by
  `git rev-parse --path-format=absolute --git-common-dir`. It is an anchor for
  discovering the shared repository topology, not the default place for fgOS to
  store arbitrary state.
- `<main-checkout-root>/.fgos/local/` is gitignored repository-local fgOS state.
  It is outside the hot product tree contract but still inspectable by the
  operator and not inside Git's private storage.
- `<workspace-root>/.fgos/installation/` is the workspace installation capsule:
  stable shims, root binding, activation binding, and projection ledger. Worker
  workspaces that need local command entry get this capsule, not a symlink or
  copy of the whole shared `.fgos` state tree.
- `<workspace-local-state-root>` is a workspace-scoped ignored root for
  transient local state not covered by the installation capsule. In a simple
  main checkout this may be `<workspace-root>/.fgos/local/workspace/`; in a
  linked worktree it may be a pointer/binding under repository-local state when
  the worktree itself intentionally has no `.fgos/` directory.
- `machineReleaseStore` is not repository-scoped. Immutable payloads are
  content-addressed and may be shared by multiple repositories.
````

### Full target shown text

````text
### Git Workspace

```txt
<workspace-root>/
  product files
  .fgos/
    config.json
    distribution.json
    installation/
      bin/
        fgos
        fgos-runner
      root.json
      activation.json
      projections/ledger.json
    history/checkpoints/

<main-checkout-root>/.fgos/local/
  identity.json
  work-state/<workStateId>/
    active-events/
    coordination/
    claims/
    derived/
  workspaces/<workspaceId>/
    registry.json

<workspace-local-state-root>/
  identity.json
  transient/

<machine-state>/fgos/releases/<artifactDigest>/
  manifest.json
  bin/
  workshop/
```

Notes:

- `<git-common-dir>` is the common Git directory returned by
  `git rev-parse --path-format=absolute --git-common-dir`. It is an anchor for
  discovering the shared repository topology, not the default place for fgOS to
  store arbitrary state.
- `<main-checkout-root>/.fgos/local/` is gitignored repository-local fgOS state.
  It is outside the hot product tree contract but still inspectable by the
  operator and not inside Git's private storage.
- `<workspace-root>/.fgos/installation/` is the workspace installation capsule:
  stable shims, root binding, activation binding, and projection ledger. Worker
  workspaces that need local command entry get this capsule, not a symlink or
  copy of the whole shared `.fgos` state tree.
- `<workspace-local-state-root>` is a workspace-scoped ignored root for
  transient local state not covered by the installation capsule. In a simple
  main checkout this may be `<workspace-root>/.fgos/local/workspace/`; in a
  linked worktree it may be a pointer/binding under repository-local state when
  the worktree itself intentionally has no `.fgos/` directory.
- `machineReleaseStore` is not repository-scoped. Immutable payloads are
  content-addressed and may be shared by multiple repositories.
````

### Unified diff

```diff
No text difference.
```

## claim_62872131629e0bd7f51787b238ce92f8

Source: `docs/architect/workspace-topology.md#unheaded-block-18`. Target: `docs/platform/system-architecture/architecture/workspace-topology.md#unheaded-block-20`.

Mechanical class: Unit-exact. Source digest: `c4ac2bd971d58a1d2ec9b50a37929ee8b930127fe75bf1a9c64f7cb104a5f5ef`. Target digest: `c4ac2bd971d58a1d2ec9b50a37929ee8b930127fe75bf1a9c64f7cb104a5f5ef`.

Full shown source SHA256: `c4ac2bd971d58a1d2ec9b50a37929ee8b930127fe75bf1a9c64f7cb104a5f5ef`. Full shown target SHA256: `c4ac2bd971d58a1d2ec9b50a37929ee8b930127fe75bf1a9c64f7cb104a5f5ef`.

### Proposed decision

```json
{
  "claimId": "claim_62872131629e0bd7f51787b238ce92f8",
  "sourceUnitDigest": "c4ac2bd971d58a1d2ec9b50a37929ee8b930127fe75bf1a9c64f7cb104a5f5ef",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology.md",
  "targetAnchor": "unheaded-block-20",
  "targetUnitDigest": "c4ac2bd971d58a1d2ec9b50a37929ee8b930127fe75bf1a9c64f7cb104a5f5ef",
  "targetAncestry": [
    "Workspace Topology Architecture",
    "4. Physical Placement Defaults",
    "Git Workspace"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/workspace-topology.md#unheaded-block-18 (lines 101–134) into docs/platform/system-architecture/architecture/workspace-topology.md#unheaded-block-20 (lines 124–157), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

````text
```txt
<workspace-root>/
  product files
  .fgos/
    config.json
    distribution.json
    installation/
      bin/
        fgos
        fgos-runner
      root.json
      activation.json
      projections/ledger.json
    history/checkpoints/

<main-checkout-root>/.fgos/local/
  identity.json
  work-state/<workStateId>/
    active-events/
    coordination/
    claims/
    derived/
  workspaces/<workspaceId>/
    registry.json

<workspace-local-state-root>/
  identity.json
  transient/

<machine-state>/fgos/releases/<artifactDigest>/
  manifest.json
  bin/
  workshop/
```
````

### Full target shown text

````text
```txt
<workspace-root>/
  product files
  .fgos/
    config.json
    distribution.json
    installation/
      bin/
        fgos
        fgos-runner
      root.json
      activation.json
      projections/ledger.json
    history/checkpoints/

<main-checkout-root>/.fgos/local/
  identity.json
  work-state/<workStateId>/
    active-events/
    coordination/
    claims/
    derived/
  workspaces/<workspaceId>/
    registry.json

<workspace-local-state-root>/
  identity.json
  transient/

<machine-state>/fgos/releases/<artifactDigest>/
  manifest.json
  bin/
  workshop/
```
````

### Unified diff

```diff
No text difference.
```

## claim_fae641a90aea165eaa4e235a9c0bf2fe

Source: `docs/architect/workspace-topology.md#unheaded-block-19`. Target: `docs/platform/system-architecture/architecture/workspace-topology.md#unheaded-block-21`.

Mechanical class: Unit-exact. Source digest: `873f30bee0966ddc41b65e74790d3743429eca697fa81dbf4b921799e393f1f7`. Target digest: `873f30bee0966ddc41b65e74790d3743429eca697fa81dbf4b921799e393f1f7`.

Full shown source SHA256: `873f30bee0966ddc41b65e74790d3743429eca697fa81dbf4b921799e393f1f7`. Full shown target SHA256: `873f30bee0966ddc41b65e74790d3743429eca697fa81dbf4b921799e393f1f7`.

### Proposed decision

```json
{
  "claimId": "claim_fae641a90aea165eaa4e235a9c0bf2fe",
  "sourceUnitDigest": "873f30bee0966ddc41b65e74790d3743429eca697fa81dbf4b921799e393f1f7",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology.md",
  "targetAnchor": "unheaded-block-21",
  "targetUnitDigest": "873f30bee0966ddc41b65e74790d3743429eca697fa81dbf4b921799e393f1f7",
  "targetAncestry": [
    "Workspace Topology Architecture",
    "4. Physical Placement Defaults",
    "Git Workspace"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/workspace-topology.md#unheaded-block-19 (lines 136–155) into docs/platform/system-architecture/architecture/workspace-topology.md#unheaded-block-21 (lines 159–178), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
Notes:

- `<git-common-dir>` is the common Git directory returned by
  `git rev-parse --path-format=absolute --git-common-dir`. It is an anchor for
  discovering the shared repository topology, not the default place for fgOS to
  store arbitrary state.
- `<main-checkout-root>/.fgos/local/` is gitignored repository-local fgOS state.
  It is outside the hot product tree contract but still inspectable by the
  operator and not inside Git's private storage.
- `<workspace-root>/.fgos/installation/` is the workspace installation capsule:
  stable shims, root binding, activation binding, and projection ledger. Worker
  workspaces that need local command entry get this capsule, not a symlink or
  copy of the whole shared `.fgos` state tree.
- `<workspace-local-state-root>` is a workspace-scoped ignored root for
  transient local state not covered by the installation capsule. In a simple
  main checkout this may be `<workspace-root>/.fgos/local/workspace/`; in a
  linked worktree it may be a pointer/binding under repository-local state when
  the worktree itself intentionally has no `.fgos/` directory.
- `machineReleaseStore` is not repository-scoped. Immutable payloads are
  content-addressed and may be shared by multiple repositories.
```

### Full target shown text

```text
Notes:

- `<git-common-dir>` is the common Git directory returned by
  `git rev-parse --path-format=absolute --git-common-dir`. It is an anchor for
  discovering the shared repository topology, not the default place for fgOS to
  store arbitrary state.
- `<main-checkout-root>/.fgos/local/` is gitignored repository-local fgOS state.
  It is outside the hot product tree contract but still inspectable by the
  operator and not inside Git's private storage.
- `<workspace-root>/.fgos/installation/` is the workspace installation capsule:
  stable shims, root binding, activation binding, and projection ledger. Worker
  workspaces that need local command entry get this capsule, not a symlink or
  copy of the whole shared `.fgos` state tree.
- `<workspace-local-state-root>` is a workspace-scoped ignored root for
  transient local state not covered by the installation capsule. In a simple
  main checkout this may be `<workspace-root>/.fgos/local/workspace/`; in a
  linked worktree it may be a pointer/binding under repository-local state when
  the worktree itself intentionally has no `.fgos/` directory.
- `machineReleaseStore` is not repository-scoped. Immutable payloads are
  content-addressed and may be shared by multiple repositories.
```

### Unified diff

```diff
No text difference.
```

## claim_7e96333ef3e28f8b31c56d7f37321d6c

Source: `docs/architect/workspace-topology.md#non-git-workspace`. Target: `docs/platform/system-architecture/architecture/workspace-topology.md#non-git-workspace`.

Mechanical class: Weak-exact. Source digest: `fa801a114199f20f5a732d34702bf427f88d579a80de6a05c194e80072c42727`. Target digest: `fa801a114199f20f5a732d34702bf427f88d579a80de6a05c194e80072c42727`.

Full shown source SHA256: `fc9cde2ba7d80643a6b80d579b1ac1973bad65c123b058914f6f24593f329a8a`. Full shown target SHA256: `fc9cde2ba7d80643a6b80d579b1ac1973bad65c123b058914f6f24593f329a8a`.

### Proposed decision

```json
{
  "claimId": "claim_7e96333ef3e28f8b31c56d7f37321d6c",
  "sourceUnitDigest": "fa801a114199f20f5a732d34702bf427f88d579a80de6a05c194e80072c42727",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology.md",
  "targetAnchor": "non-git-workspace",
  "targetUnitDigest": "fa801a114199f20f5a732d34702bf427f88d579a80de6a05c194e80072c42727",
  "targetAncestry": [
    "Workspace Topology Architecture",
    "4. Physical Placement Defaults"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. Carry the complete heading at docs/architect/workspace-topology.md#non-git-workspace (lines 157–157) into docs/platform/system-architecture/architecture/workspace-topology.md#non-git-workspace (lines 180–180), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

````text
### Non-Git Workspace

```txt
<workspace-root>/
  product files
  .fgos/
    config.json
    distribution.json
    identity/
    local-state/
    installation/
      bin/
        fgos
        fgos-runner
      root.json
      activation.json
      projections/ledger.json
```

Non-Git mode has no Git worktree isolation, no Git checkpoint/merge guarantees,
and no linked-worktree sharing. It can still use local workflow state and
project-local runtime activation.
````

### Full target shown text

````text
### Non-Git Workspace

```txt
<workspace-root>/
  product files
  .fgos/
    config.json
    distribution.json
    identity/
    local-state/
    installation/
      bin/
        fgos
        fgos-runner
      root.json
      activation.json
      projections/ledger.json
```

Non-Git mode has no Git worktree isolation, no Git checkpoint/merge guarantees,
and no linked-worktree sharing. It can still use local workflow state and
project-local runtime activation.
````

### Unified diff

```diff
No text difference.
```

## claim_22b553899c040e5b87a28bb4186ba42b

Source: `docs/architect/workspace-topology.md#unheaded-block-20`. Target: `docs/platform/system-architecture/architecture/workspace-topology.md#unheaded-block-22`.

Mechanical class: Unit-exact. Source digest: `7a3c4d696e93e9973d1eda0772fe405d039883c5f7dbf872cb0b875f7e79a583`. Target digest: `7a3c4d696e93e9973d1eda0772fe405d039883c5f7dbf872cb0b875f7e79a583`.

Full shown source SHA256: `7a3c4d696e93e9973d1eda0772fe405d039883c5f7dbf872cb0b875f7e79a583`. Full shown target SHA256: `7a3c4d696e93e9973d1eda0772fe405d039883c5f7dbf872cb0b875f7e79a583`.

### Proposed decision

```json
{
  "claimId": "claim_22b553899c040e5b87a28bb4186ba42b",
  "sourceUnitDigest": "7a3c4d696e93e9973d1eda0772fe405d039883c5f7dbf872cb0b875f7e79a583",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology.md",
  "targetAnchor": "unheaded-block-22",
  "targetUnitDigest": "7a3c4d696e93e9973d1eda0772fe405d039883c5f7dbf872cb0b875f7e79a583",
  "targetAncestry": [
    "Workspace Topology Architecture",
    "4. Physical Placement Defaults",
    "Non-Git Workspace"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/workspace-topology.md#unheaded-block-20 (lines 159–174) into docs/platform/system-architecture/architecture/workspace-topology.md#unheaded-block-22 (lines 182–197), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

````text
```txt
<workspace-root>/
  product files
  .fgos/
    config.json
    distribution.json
    identity/
    local-state/
    installation/
      bin/
        fgos
        fgos-runner
      root.json
      activation.json
      projections/ledger.json
```
````

### Full target shown text

````text
```txt
<workspace-root>/
  product files
  .fgos/
    config.json
    distribution.json
    identity/
    local-state/
    installation/
      bin/
        fgos
        fgos-runner
      root.json
      activation.json
      projections/ledger.json
```
````

### Unified diff

```diff
No text difference.
```

## claim_a06df27779e34f830988b51e1b2e5e42

Source: `docs/architect/workspace-topology.md#unheaded-block-21`. Target: `docs/platform/system-architecture/architecture/workspace-topology.md#unheaded-block-23`.

Mechanical class: Unit-exact. Source digest: `93025f3d5830761f7304b31eae197eb964c87646b5efb70e8152f808dcafabe1`. Target digest: `93025f3d5830761f7304b31eae197eb964c87646b5efb70e8152f808dcafabe1`.

Full shown source SHA256: `93025f3d5830761f7304b31eae197eb964c87646b5efb70e8152f808dcafabe1`. Full shown target SHA256: `93025f3d5830761f7304b31eae197eb964c87646b5efb70e8152f808dcafabe1`.

### Proposed decision

```json
{
  "claimId": "claim_a06df27779e34f830988b51e1b2e5e42",
  "sourceUnitDigest": "93025f3d5830761f7304b31eae197eb964c87646b5efb70e8152f808dcafabe1",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology.md",
  "targetAnchor": "unheaded-block-23",
  "targetUnitDigest": "93025f3d5830761f7304b31eae197eb964c87646b5efb70e8152f808dcafabe1",
  "targetAncestry": [
    "Workspace Topology Architecture",
    "4. Physical Placement Defaults",
    "Non-Git Workspace"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/workspace-topology.md#unheaded-block-21 (lines 176–178) into docs/platform/system-architecture/architecture/workspace-topology.md#unheaded-block-23 (lines 199–201), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
Non-Git mode has no Git worktree isolation, no Git checkpoint/merge guarantees,
and no linked-worktree sharing. It can still use local workflow state and
project-local runtime activation.
```

### Full target shown text

```text
Non-Git mode has no Git worktree isolation, no Git checkpoint/merge guarantees,
and no linked-worktree sharing. It can still use local workflow state and
project-local runtime activation.
```

### Unified diff

```diff
No text difference.
```

## claim_734144fe4fd82cca5b846bc4e93b6a6e

Source: `docs/architect/workspace-topology.md#5-workspace-modes`. Target: `docs/platform/system-architecture/architecture/workspace-topology.md#5-workspace-modes`.

Mechanical class: Weak-exact. Source digest: `a6d766b27255be8d62e6e7ea6e0fb0f98eea1cb4deebca0e9876824cca374f52`. Target digest: `a6d766b27255be8d62e6e7ea6e0fb0f98eea1cb4deebca0e9876824cca374f52`.

Full shown source SHA256: `f0466c7eacc58c635be5289113c66a1216e4ad19cc0aebe83073679b6f1bae1d`. Full shown target SHA256: `f0466c7eacc58c635be5289113c66a1216e4ad19cc0aebe83073679b6f1bae1d`.

### Proposed decision

```json
{
  "claimId": "claim_734144fe4fd82cca5b846bc4e93b6a6e",
  "sourceUnitDigest": "a6d766b27255be8d62e6e7ea6e0fb0f98eea1cb4deebca0e9876824cca374f52",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology.md",
  "targetAnchor": "5-workspace-modes",
  "targetUnitDigest": "a6d766b27255be8d62e6e7ea6e0fb0f98eea1cb4deebca0e9876824cca374f52",
  "targetAncestry": [
    "Workspace Topology Architecture"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. Carry the complete heading at docs/architect/workspace-topology.md#5-workspace-modes (lines 180–180) into docs/platform/system-architecture/architecture/workspace-topology.md#5-workspace-modes (lines 203–203), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
## 5. Workspace Modes
```

### Full target shown text

```text
## 5. Workspace Modes
```

### Unified diff

```diff
No text difference.
```

## claim_cb618356d295f0ee4a7bad7847e2fa66

Source: `docs/architect/workspace-topology.md#single-workspace-mode`. Target: `docs/platform/system-architecture/architecture/workspace-topology.md#single-workspace-mode`.

Mechanical class: Weak-exact. Source digest: `2683190ccf93c7afe72ea8bf1bfc685c2b33181b00ea7de4c08f2f2de668ad00`. Target digest: `2683190ccf93c7afe72ea8bf1bfc685c2b33181b00ea7de4c08f2f2de668ad00`.

Full shown source SHA256: `8308ced4a66f05ae4ceb60430f299193e08127c36fecc41667d574a54eac870a`. Full shown target SHA256: `8308ced4a66f05ae4ceb60430f299193e08127c36fecc41667d574a54eac870a`.

### Proposed decision

```json
{
  "claimId": "claim_cb618356d295f0ee4a7bad7847e2fa66",
  "sourceUnitDigest": "2683190ccf93c7afe72ea8bf1bfc685c2b33181b00ea7de4c08f2f2de668ad00",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology.md",
  "targetAnchor": "single-workspace-mode",
  "targetUnitDigest": "2683190ccf93c7afe72ea8bf1bfc685c2b33181b00ea7de4c08f2f2de668ad00",
  "targetAncestry": [
    "Workspace Topology Architecture",
    "5. Workspace Modes"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. Carry the complete heading at docs/architect/workspace-topology.md#single-workspace-mode (lines 182–182) into docs/platform/system-architecture/architecture/workspace-topology.md#single-workspace-mode (lines 205–205), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

````text
### Single-Workspace Mode

```txt
repositoryId = one repository/local workspace
workspaceId = main workspace
workStateId = default work-state
activation binding = one workspace-local binding
```

Physical roots may coincide, but capabilities remain separate.
````

### Full target shown text

````text
### Single-Workspace Mode

```txt
repositoryId = one repository/local workspace
workspaceId = main workspace
workStateId = default work-state
activation binding = one workspace-local binding
```

Physical roots may coincide, but capabilities remain separate.
````

### Unified diff

```diff
No text difference.
```

## claim_483255456130e67892e7cb6d5571c497

Source: `docs/architect/workspace-topology.md#unheaded-block-22`. Target: `docs/platform/system-architecture/architecture/workspace-topology.md#unheaded-block-24`.

Mechanical class: Unit-exact. Source digest: `539d65cdde4eeba0c0702fb00cdd3c6bb7c2972cd1b2ad2e9dc486916f3680d2`. Target digest: `539d65cdde4eeba0c0702fb00cdd3c6bb7c2972cd1b2ad2e9dc486916f3680d2`.

Full shown source SHA256: `539d65cdde4eeba0c0702fb00cdd3c6bb7c2972cd1b2ad2e9dc486916f3680d2`. Full shown target SHA256: `539d65cdde4eeba0c0702fb00cdd3c6bb7c2972cd1b2ad2e9dc486916f3680d2`.

### Proposed decision

```json
{
  "claimId": "claim_483255456130e67892e7cb6d5571c497",
  "sourceUnitDigest": "539d65cdde4eeba0c0702fb00cdd3c6bb7c2972cd1b2ad2e9dc486916f3680d2",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology.md",
  "targetAnchor": "unheaded-block-24",
  "targetUnitDigest": "539d65cdde4eeba0c0702fb00cdd3c6bb7c2972cd1b2ad2e9dc486916f3680d2",
  "targetAncestry": [
    "Workspace Topology Architecture",
    "5. Workspace Modes",
    "Single-Workspace Mode"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/workspace-topology.md#unheaded-block-22 (lines 184–189) into docs/platform/system-architecture/architecture/workspace-topology.md#unheaded-block-24 (lines 207–212), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

````text
```txt
repositoryId = one repository/local workspace
workspaceId = main workspace
workStateId = default work-state
activation binding = one workspace-local binding
```
````

### Full target shown text

````text
```txt
repositoryId = one repository/local workspace
workspaceId = main workspace
workStateId = default work-state
activation binding = one workspace-local binding
```
````

### Unified diff

```diff
No text difference.
```

## claim_e73bbf1adacd32d754c3ab0c855e64e1

Source: `docs/architect/workspace-topology.md#unheaded-block-23`. Target: `docs/platform/system-architecture/architecture/workspace-topology.md#unheaded-block-25`.

Mechanical class: Unit-exact. Source digest: `6eecb972c3b80df631ead7d7dd34e8bed7d073eb3518d13e5691b196b06d425a`. Target digest: `6eecb972c3b80df631ead7d7dd34e8bed7d073eb3518d13e5691b196b06d425a`.

Full shown source SHA256: `6eecb972c3b80df631ead7d7dd34e8bed7d073eb3518d13e5691b196b06d425a`. Full shown target SHA256: `6eecb972c3b80df631ead7d7dd34e8bed7d073eb3518d13e5691b196b06d425a`.

### Proposed decision

```json
{
  "claimId": "claim_e73bbf1adacd32d754c3ab0c855e64e1",
  "sourceUnitDigest": "6eecb972c3b80df631ead7d7dd34e8bed7d073eb3518d13e5691b196b06d425a",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology.md",
  "targetAnchor": "unheaded-block-25",
  "targetUnitDigest": "6eecb972c3b80df631ead7d7dd34e8bed7d073eb3518d13e5691b196b06d425a",
  "targetAncestry": [
    "Workspace Topology Architecture",
    "5. Workspace Modes",
    "Single-Workspace Mode"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/workspace-topology.md#unheaded-block-23 (lines 191–191) into docs/platform/system-architecture/architecture/workspace-topology.md#unheaded-block-25 (lines 214–214), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
Physical roots may coincide, but capabilities remain separate.
```

### Full target shown text

```text
Physical roots may coincide, but capabilities remain separate.
```

### Unified diff

```diff
No text difference.
```

## claim_3290c078f70a7910f81242c87c10c51b

Source: `docs/architect/workspace-topology.md#isolated-worktree-mode`. Target: `docs/platform/system-architecture/architecture/workspace-topology.md#isolated-worktree-mode`.

Mechanical class: Weak-exact. Source digest: `433c66532240f295cb6f897da6022033aa8b5d0bc73255d940432573e43a56d7`. Target digest: `433c66532240f295cb6f897da6022033aa8b5d0bc73255d940432573e43a56d7`.

Full shown source SHA256: `30ece62b0e6b95fb8518e9ff889aedb7c05665da68b988bd1196b37807ab953b`. Full shown target SHA256: `30ece62b0e6b95fb8518e9ff889aedb7c05665da68b988bd1196b37807ab953b`.

### Proposed decision

```json
{
  "claimId": "claim_3290c078f70a7910f81242c87c10c51b",
  "sourceUnitDigest": "433c66532240f295cb6f897da6022033aa8b5d0bc73255d940432573e43a56d7",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology.md",
  "targetAnchor": "isolated-worktree-mode",
  "targetUnitDigest": "433c66532240f295cb6f897da6022033aa8b5d0bc73255d940432573e43a56d7",
  "targetAncestry": [
    "Workspace Topology Architecture",
    "5. Workspace Modes"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. Carry the complete heading at docs/architect/workspace-topology.md#isolated-worktree-mode (lines 193–193) into docs/platform/system-architecture/architecture/workspace-topology.md#isolated-worktree-mode (lines 216–216), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

````text
### Isolated-Worktree Mode

```txt
repositoryId = shared through git common dir
workspaceId = one per checkout/worktree
workStateId = explicitly shared or explicitly separate
release store = machine-wide by artifactDigest
activation/projections/policy = workspace-scoped
coordination/work history = governed by workStateId
```

Required invariants:

- worker product writes never land in main checkout;
- branch/workspace policy is read from the running workspace;
- runtime coordination does not fork per worktree unless the operation asks for
  a separate `workStateId`;
- hot work history does not dirty main;
- workspace projections and activation bindings are scoped by `workspaceId`;
- two runtime digests cannot mutate the same `workStateId` unless writer
  compatibility is proven.
````

### Full target shown text

````text
### Isolated-Worktree Mode

```txt
repositoryId = shared through git common dir
workspaceId = one per checkout/worktree
workStateId = explicitly shared or explicitly separate
release store = machine-wide by artifactDigest
activation/projections/policy = workspace-scoped
coordination/work history = governed by workStateId
```

Required invariants:

- worker product writes never land in main checkout;
- branch/workspace policy is read from the running workspace;
- runtime coordination does not fork per worktree unless the operation asks for
  a separate `workStateId`;
- hot work history does not dirty main;
- workspace projections and activation bindings are scoped by `workspaceId`;
- two runtime digests cannot mutate the same `workStateId` unless writer
  compatibility is proven.
````

### Unified diff

```diff
No text difference.
```

## claim_47df55083a4a390f6cf722f881c223ea

Source: `docs/architect/workspace-topology.md#unheaded-block-24`. Target: `docs/platform/system-architecture/architecture/workspace-topology.md#unheaded-block-26`.

Mechanical class: Unit-exact. Source digest: `1a24aada67229b4eee869b9fc5cfc8f453f9321bc5be5aac79003e715157ac60`. Target digest: `1a24aada67229b4eee869b9fc5cfc8f453f9321bc5be5aac79003e715157ac60`.

Full shown source SHA256: `1a24aada67229b4eee869b9fc5cfc8f453f9321bc5be5aac79003e715157ac60`. Full shown target SHA256: `1a24aada67229b4eee869b9fc5cfc8f453f9321bc5be5aac79003e715157ac60`.

### Proposed decision

```json
{
  "claimId": "claim_47df55083a4a390f6cf722f881c223ea",
  "sourceUnitDigest": "1a24aada67229b4eee869b9fc5cfc8f453f9321bc5be5aac79003e715157ac60",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology.md",
  "targetAnchor": "unheaded-block-26",
  "targetUnitDigest": "1a24aada67229b4eee869b9fc5cfc8f453f9321bc5be5aac79003e715157ac60",
  "targetAncestry": [
    "Workspace Topology Architecture",
    "5. Workspace Modes",
    "Isolated-Worktree Mode"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/workspace-topology.md#unheaded-block-24 (lines 195–202) into docs/platform/system-architecture/architecture/workspace-topology.md#unheaded-block-26 (lines 218–225), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

````text
```txt
repositoryId = shared through git common dir
workspaceId = one per checkout/worktree
workStateId = explicitly shared or explicitly separate
release store = machine-wide by artifactDigest
activation/projections/policy = workspace-scoped
coordination/work history = governed by workStateId
```
````

### Full target shown text

````text
```txt
repositoryId = shared through git common dir
workspaceId = one per checkout/worktree
workStateId = explicitly shared or explicitly separate
release store = machine-wide by artifactDigest
activation/projections/policy = workspace-scoped
coordination/work history = governed by workStateId
```
````

### Unified diff

```diff
No text difference.
```

## claim_315efb6480d4dee277ba25d2ee2aec67

Source: `docs/architect/workspace-topology.md#unheaded-block-25`. Target: `docs/platform/system-architecture/architecture/workspace-topology.md#unheaded-block-27`.

Mechanical class: Unit-exact. Source digest: `2d2ed745f11c6953cf46af46918a46fb5d15945597690b27ed178abdadcf948b`. Target digest: `2d2ed745f11c6953cf46af46918a46fb5d15945597690b27ed178abdadcf948b`.

Full shown source SHA256: `2d2ed745f11c6953cf46af46918a46fb5d15945597690b27ed178abdadcf948b`. Full shown target SHA256: `2d2ed745f11c6953cf46af46918a46fb5d15945597690b27ed178abdadcf948b`.

### Proposed decision

```json
{
  "claimId": "claim_315efb6480d4dee277ba25d2ee2aec67",
  "sourceUnitDigest": "2d2ed745f11c6953cf46af46918a46fb5d15945597690b27ed178abdadcf948b",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology.md",
  "targetAnchor": "unheaded-block-27",
  "targetUnitDigest": "2d2ed745f11c6953cf46af46918a46fb5d15945597690b27ed178abdadcf948b",
  "targetAncestry": [
    "Workspace Topology Architecture",
    "5. Workspace Modes",
    "Isolated-Worktree Mode"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/workspace-topology.md#unheaded-block-25 (lines 204–213) into docs/platform/system-architecture/architecture/workspace-topology.md#unheaded-block-27 (lines 227–236), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
Required invariants:

- worker product writes never land in main checkout;
- branch/workspace policy is read from the running workspace;
- runtime coordination does not fork per worktree unless the operation asks for
  a separate `workStateId`;
- hot work history does not dirty main;
- workspace projections and activation bindings are scoped by `workspaceId`;
- two runtime digests cannot mutate the same `workStateId` unless writer
  compatibility is proven.
```

### Full target shown text

```text
Required invariants:

- worker product writes never land in main checkout;
- branch/workspace policy is read from the running workspace;
- runtime coordination does not fork per worktree unless the operation asks for
  a separate `workStateId`;
- hot work history does not dirty main;
- workspace projections and activation bindings are scoped by `workspaceId`;
- two runtime digests cannot mutate the same `workStateId` unless writer
  compatibility is proven.
```

### Unified diff

```diff
No text difference.
```

## claim_667c4b149f85122dc5a385988543d5d8

Source: `docs/architect/workspace-topology.md#6-resolvetopology-protocol`. Target: `docs/platform/system-architecture/architecture/workspace-topology.md#6-resolvetopology-protocol`.

Mechanical class: Weak-exact. Source digest: `af332495ce3fce9cd4cab76b916d7de3824b17ea7c29cc18fcd03d03cf0a7150`. Target digest: `af332495ce3fce9cd4cab76b916d7de3824b17ea7c29cc18fcd03d03cf0a7150`.

Full shown source SHA256: `d25e1110c4f68fe86a16045627f9007b07bb3a84f59ca14f04c897545eef704f`. Full shown target SHA256: `d25e1110c4f68fe86a16045627f9007b07bb3a84f59ca14f04c897545eef704f`.

### Proposed decision

```json
{
  "claimId": "claim_667c4b149f85122dc5a385988543d5d8",
  "sourceUnitDigest": "af332495ce3fce9cd4cab76b916d7de3824b17ea7c29cc18fcd03d03cf0a7150",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology.md",
  "targetAnchor": "6-resolvetopology-protocol",
  "targetUnitDigest": "af332495ce3fce9cd4cab76b916d7de3824b17ea7c29cc18fcd03d03cf0a7150",
  "targetAncestry": [
    "Workspace Topology Architecture"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. Carry the complete heading at docs/architect/workspace-topology.md#6-resolvetopology-protocol (lines 215–215) into docs/platform/system-architecture/architecture/workspace-topology.md#6-resolvetopology-protocol (lines 238–238), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

````text
## 6. `resolveTopology()` Protocol

All CLI, runner, doctor, init, gateway-adapter, and coordination entry points
must go through one conceptual protocol:

```txt
resolveTopology(invocationCwd, explicitFlags, operation) -> TopologyContext
```

Required protocol order:

1. Canonicalize `invocationCwd` using realpath when possible.
2. Detect Git vs non-Git workspace.
3. For Git, resolve git common dir and current worktree identity only as
   topology anchors; do not store fgOS state inside Git's private directories
   by default.
4. Load workspace policy from the current `workspaceId`'s content root unless
   explicit flags name another workspace.
5. Resolve or create `repositoryId` and `workspaceId` using the identity rules.
6. Resolve `workStateId` from workspace policy or repository binding.
7. Resolve typed roots for every state class the operation may touch.
8. Resolve candidate/current `artifactDigest` from workspace runtime pin and
   activation binding.
9. Check runtime/work-state schema compatibility.
10. Grant operation capabilities and required locks/leases.
11. Return a `TopologyContext`; do not expose raw resolver choice to business
    logic.

If any required identity or root is ambiguous, return a typed refusal. Do not
fall back from workspace to main, or from shared state to local state, without an
explicit compatibility/adoption rule.
````

### Full target shown text

````text
## 6. `resolveTopology()` Protocol

All CLI, runner, doctor, init, gateway-adapter, and coordination entry points
must go through one conceptual protocol:

```txt
resolveTopology(invocationCwd, explicitFlags, operation) -> TopologyContext
```

Required protocol order:

1. Canonicalize `invocationCwd` using realpath when possible.
2. Detect Git vs non-Git workspace.
3. For Git, resolve git common dir and current worktree identity only as
   topology anchors; do not store fgOS state inside Git's private directories
   by default.
4. Load workspace policy from the current `workspaceId`'s content root unless
   explicit flags name another workspace.
5. Resolve or create `repositoryId` and `workspaceId` using the identity rules.
6. Resolve `workStateId` from workspace policy or repository binding.
7. Resolve typed roots for every state class the operation may touch.
8. Resolve candidate/current `artifactDigest` from workspace runtime pin and
   activation binding.
9. Check runtime/work-state schema compatibility.
10. Grant operation capabilities and required locks/leases.
11. Return a `TopologyContext`; do not expose raw resolver choice to business
    logic.

If any required identity or root is ambiguous, return a typed refusal. Do not
fall back from workspace to main, or from shared state to local state, without an
explicit compatibility/adoption rule.
````

### Unified diff

```diff
No text difference.
```

## claim_74809a844a73f3f186a9d07af689de0a

Source: `docs/architect/workspace-topology.md#unheaded-block-26`. Target: `docs/platform/system-architecture/architecture/workspace-topology.md#unheaded-block-28`.

Mechanical class: Unit-exact. Source digest: `383a9ffbe8b7d03da59e224cf6cfd6ceffa450a7d2927f96b5ca7008522fc4e4`. Target digest: `383a9ffbe8b7d03da59e224cf6cfd6ceffa450a7d2927f96b5ca7008522fc4e4`.

Full shown source SHA256: `383a9ffbe8b7d03da59e224cf6cfd6ceffa450a7d2927f96b5ca7008522fc4e4`. Full shown target SHA256: `383a9ffbe8b7d03da59e224cf6cfd6ceffa450a7d2927f96b5ca7008522fc4e4`.

### Proposed decision

```json
{
  "claimId": "claim_74809a844a73f3f186a9d07af689de0a",
  "sourceUnitDigest": "383a9ffbe8b7d03da59e224cf6cfd6ceffa450a7d2927f96b5ca7008522fc4e4",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology.md",
  "targetAnchor": "unheaded-block-28",
  "targetUnitDigest": "383a9ffbe8b7d03da59e224cf6cfd6ceffa450a7d2927f96b5ca7008522fc4e4",
  "targetAncestry": [
    "Workspace Topology Architecture",
    "6. `resolveTopology()` Protocol"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/workspace-topology.md#unheaded-block-26 (lines 217–218) into docs/platform/system-architecture/architecture/workspace-topology.md#unheaded-block-28 (lines 240–241), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
All CLI, runner, doctor, init, gateway-adapter, and coordination entry points
must go through one conceptual protocol:
```

### Full target shown text

```text
All CLI, runner, doctor, init, gateway-adapter, and coordination entry points
must go through one conceptual protocol:
```

### Unified diff

```diff
No text difference.
```

## claim_f157598134832392bd620b6bfa36ea4f

Source: `docs/architect/workspace-topology.md#unheaded-block-27`. Target: `docs/platform/system-architecture/architecture/workspace-topology.md#unheaded-block-29`.

Mechanical class: Unit-exact. Source digest: `2ac6e628da454763bd60dbeb48237e399dace6413260ea15bdd0895fd2318ccf`. Target digest: `2ac6e628da454763bd60dbeb48237e399dace6413260ea15bdd0895fd2318ccf`.

Full shown source SHA256: `2ac6e628da454763bd60dbeb48237e399dace6413260ea15bdd0895fd2318ccf`. Full shown target SHA256: `2ac6e628da454763bd60dbeb48237e399dace6413260ea15bdd0895fd2318ccf`.

### Proposed decision

```json
{
  "claimId": "claim_f157598134832392bd620b6bfa36ea4f",
  "sourceUnitDigest": "2ac6e628da454763bd60dbeb48237e399dace6413260ea15bdd0895fd2318ccf",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology.md",
  "targetAnchor": "unheaded-block-29",
  "targetUnitDigest": "2ac6e628da454763bd60dbeb48237e399dace6413260ea15bdd0895fd2318ccf",
  "targetAncestry": [
    "Workspace Topology Architecture",
    "6. `resolveTopology()` Protocol"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/workspace-topology.md#unheaded-block-27 (lines 220–222) into docs/platform/system-architecture/architecture/workspace-topology.md#unheaded-block-29 (lines 243–245), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

````text
```txt
resolveTopology(invocationCwd, explicitFlags, operation) -> TopologyContext
```
````

### Full target shown text

````text
```txt
resolveTopology(invocationCwd, explicitFlags, operation) -> TopologyContext
```
````

### Unified diff

```diff
No text difference.
```

## claim_5e0387b7245ee5b86250690634f71cb1

Source: `docs/architect/workspace-topology.md#unheaded-block-28`. Target: `docs/platform/system-architecture/architecture/workspace-topology.md#unheaded-block-30`.

Mechanical class: Weak-exact. Source digest: `8f09480af87d9ef0e438db1337915e2232527398fd7e2ee70784c34509e0cb95`. Target digest: `8f09480af87d9ef0e438db1337915e2232527398fd7e2ee70784c34509e0cb95`.

Full shown source SHA256: `8f09480af87d9ef0e438db1337915e2232527398fd7e2ee70784c34509e0cb95`. Full shown target SHA256: `8f09480af87d9ef0e438db1337915e2232527398fd7e2ee70784c34509e0cb95`.

### Proposed decision

```json
{
  "claimId": "claim_5e0387b7245ee5b86250690634f71cb1",
  "sourceUnitDigest": "8f09480af87d9ef0e438db1337915e2232527398fd7e2ee70784c34509e0cb95",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology.md",
  "targetAnchor": "unheaded-block-30",
  "targetUnitDigest": "8f09480af87d9ef0e438db1337915e2232527398fd7e2ee70784c34509e0cb95",
  "targetAncestry": [
    "Workspace Topology Architecture",
    "6. `resolveTopology()` Protocol"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. Carry the complete unheaded-block at docs/architect/workspace-topology.md#unheaded-block-28 (lines 224–224) into docs/platform/system-architecture/architecture/workspace-topology.md#unheaded-block-30 (lines 247–247), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
Required protocol order:
```

### Full target shown text

```text
Required protocol order:
```

### Unified diff

```diff
No text difference.
```

## claim_2f2d922f7e9abcd4e1155ba83e40106d

Source: `docs/architect/workspace-topology.md#unheaded-block-29`. Target: `docs/platform/system-architecture/architecture/workspace-topology.md#unheaded-block-31`.

Mechanical class: Unit-exact. Source digest: `fa079d9c52b2ebdb9f73771a76874d8af09fc59a23232219eb5a1378b6394540`. Target digest: `fa079d9c52b2ebdb9f73771a76874d8af09fc59a23232219eb5a1378b6394540`.

Full shown source SHA256: `fa079d9c52b2ebdb9f73771a76874d8af09fc59a23232219eb5a1378b6394540`. Full shown target SHA256: `fa079d9c52b2ebdb9f73771a76874d8af09fc59a23232219eb5a1378b6394540`.

### Proposed decision

```json
{
  "claimId": "claim_2f2d922f7e9abcd4e1155ba83e40106d",
  "sourceUnitDigest": "fa079d9c52b2ebdb9f73771a76874d8af09fc59a23232219eb5a1378b6394540",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology.md",
  "targetAnchor": "unheaded-block-31",
  "targetUnitDigest": "fa079d9c52b2ebdb9f73771a76874d8af09fc59a23232219eb5a1378b6394540",
  "targetAncestry": [
    "Workspace Topology Architecture",
    "6. `resolveTopology()` Protocol"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/workspace-topology.md#unheaded-block-29 (lines 226–241) into docs/platform/system-architecture/architecture/workspace-topology.md#unheaded-block-31 (lines 249–264), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
1. Canonicalize `invocationCwd` using realpath when possible.
2. Detect Git vs non-Git workspace.
3. For Git, resolve git common dir and current worktree identity only as
   topology anchors; do not store fgOS state inside Git's private directories
   by default.
4. Load workspace policy from the current `workspaceId`'s content root unless
   explicit flags name another workspace.
5. Resolve or create `repositoryId` and `workspaceId` using the identity rules.
6. Resolve `workStateId` from workspace policy or repository binding.
7. Resolve typed roots for every state class the operation may touch.
8. Resolve candidate/current `artifactDigest` from workspace runtime pin and
   activation binding.
9. Check runtime/work-state schema compatibility.
10. Grant operation capabilities and required locks/leases.
11. Return a `TopologyContext`; do not expose raw resolver choice to business
    logic.
```

### Full target shown text

```text
1. Canonicalize `invocationCwd` using realpath when possible.
2. Detect Git vs non-Git workspace.
3. For Git, resolve git common dir and current worktree identity only as
   topology anchors; do not store fgOS state inside Git's private directories
   by default.
4. Load workspace policy from the current `workspaceId`'s content root unless
   explicit flags name another workspace.
5. Resolve or create `repositoryId` and `workspaceId` using the identity rules.
6. Resolve `workStateId` from workspace policy or repository binding.
7. Resolve typed roots for every state class the operation may touch.
8. Resolve candidate/current `artifactDigest` from workspace runtime pin and
   activation binding.
9. Check runtime/work-state schema compatibility.
10. Grant operation capabilities and required locks/leases.
11. Return a `TopologyContext`; do not expose raw resolver choice to business
    logic.
```

### Unified diff

```diff
No text difference.
```

## claim_77b6678948ed3bf89fdbe3b6e83a9666

Source: `docs/architect/workspace-topology.md#unheaded-block-30`. Target: `docs/platform/system-architecture/architecture/workspace-topology.md#unheaded-block-32`.

Mechanical class: Unit-exact. Source digest: `e6577db62d4cad57f81942a4e2f58d372385aa3f193e5e08fe1302a343813d4f`. Target digest: `e6577db62d4cad57f81942a4e2f58d372385aa3f193e5e08fe1302a343813d4f`.

Full shown source SHA256: `e6577db62d4cad57f81942a4e2f58d372385aa3f193e5e08fe1302a343813d4f`. Full shown target SHA256: `e6577db62d4cad57f81942a4e2f58d372385aa3f193e5e08fe1302a343813d4f`.

### Proposed decision

```json
{
  "claimId": "claim_77b6678948ed3bf89fdbe3b6e83a9666",
  "sourceUnitDigest": "e6577db62d4cad57f81942a4e2f58d372385aa3f193e5e08fe1302a343813d4f",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology.md",
  "targetAnchor": "unheaded-block-32",
  "targetUnitDigest": "e6577db62d4cad57f81942a4e2f58d372385aa3f193e5e08fe1302a343813d4f",
  "targetAncestry": [
    "Workspace Topology Architecture",
    "6. `resolveTopology()` Protocol"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/workspace-topology.md#unheaded-block-30 (lines 243–245) into docs/platform/system-architecture/architecture/workspace-topology.md#unheaded-block-32 (lines 266–268), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
If any required identity or root is ambiguous, return a typed refusal. Do not
fall back from workspace to main, or from shared state to local state, without an
explicit compatibility/adoption rule.
```

### Full target shown text

```text
If any required identity or root is ambiguous, return a typed refusal. Do not
fall back from workspace to main, or from shared state to local state, without an
explicit compatibility/adoption rule.
```

### Unified diff

```diff
No text difference.
```

## claim_498a620f9e74d81a9c8be672efb7477c

Source: `docs/architect/workspace-topology.md#7-capability-and-lease-model`. Target: `docs/platform/system-architecture/architecture/workspace-topology.md#7-capability-and-lease-model`.

Mechanical class: Weak-exact. Source digest: `8ad1d3a8d5e55b17ff7634201efbab24887c3dc121d8de544060b3b8c5c6d59e`. Target digest: `8ad1d3a8d5e55b17ff7634201efbab24887c3dc121d8de544060b3b8c5c6d59e`.

Full shown source SHA256: `42aa9c95dfdfcd4b8ae768b33cb18b9c46a151fd74ee9116b013828b673b1a39`. Full shown target SHA256: `42aa9c95dfdfcd4b8ae768b33cb18b9c46a151fd74ee9116b013828b673b1a39`.

### Proposed decision

```json
{
  "claimId": "claim_498a620f9e74d81a9c8be672efb7477c",
  "sourceUnitDigest": "8ad1d3a8d5e55b17ff7634201efbab24887c3dc121d8de544060b3b8c5c6d59e",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology.md",
  "targetAnchor": "7-capability-and-lease-model",
  "targetUnitDigest": "8ad1d3a8d5e55b17ff7634201efbab24887c3dc121d8de544060b3b8c5c6d59e",
  "targetAncestry": [
    "Workspace Topology Architecture"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. Carry the complete heading at docs/architect/workspace-topology.md#7-capability-and-lease-model (lines 247–247) into docs/platform/system-architecture/architecture/workspace-topology.md#7-capability-and-lease-model (lines 270–270), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
## 7. Capability And Lease Model

Locks are resource-scoped, not one broad global mutex.

Canonical lock acquisition order:

1. `repository-git`
2. `work-state:<workStateId>`
3. `workspace:<workspaceId>`
4. `activation:<workspaceId>`
5. `projection:<workspaceId>`
6. `coordination:<workStateId>`
7. `artifact:<artifactDigest>`

Multi-resource operations must acquire locks in this order to avoid deadlock.

Each mutating lease/lock record must carry:

- resource id;
- owner kind;
- process id when available;
- process start token when available;
- boot id when available;
- `workspaceId`;
- `workStateId`;
- `artifactDigest` when a runtime is executing;
- fencing token;
- parent lease id when nested;
- heartbeat/expiry metadata.

TTL detects suspicion; it does not transfer authority. Recovery may clear or
supersede a lease only when owner death is mechanically proven or a human/local
operator records explicit completion-unknown recovery.
```

### Full target shown text

```text
## 7. Capability And Lease Model

Locks are resource-scoped, not one broad global mutex.

Canonical lock acquisition order:

1. `repository-git`
2. `work-state:<workStateId>`
3. `workspace:<workspaceId>`
4. `activation:<workspaceId>`
5. `projection:<workspaceId>`
6. `coordination:<workStateId>`
7. `artifact:<artifactDigest>`

Multi-resource operations must acquire locks in this order to avoid deadlock.

Each mutating lease/lock record must carry:

- resource id;
- owner kind;
- process id when available;
- process start token when available;
- boot id when available;
- `workspaceId`;
- `workStateId`;
- `artifactDigest` when a runtime is executing;
- fencing token;
- parent lease id when nested;
- heartbeat/expiry metadata.

TTL detects suspicion; it does not transfer authority. Recovery may clear or
supersede a lease only when owner death is mechanically proven or a human/local
operator records explicit completion-unknown recovery.
```

### Unified diff

```diff
No text difference.
```

## claim_c8134ee912609354583c6b4eee28d064

Source: `docs/architect/workspace-topology.md#unheaded-block-31`. Target: `docs/platform/system-architecture/architecture/workspace-topology.md#unheaded-block-33`.

Mechanical class: Unit-exact. Source digest: `39f12dcc60d00513fe8cac8d5b29527c5a1509a80dded0dbbb2f4a954bbacd82`. Target digest: `39f12dcc60d00513fe8cac8d5b29527c5a1509a80dded0dbbb2f4a954bbacd82`.

Full shown source SHA256: `39f12dcc60d00513fe8cac8d5b29527c5a1509a80dded0dbbb2f4a954bbacd82`. Full shown target SHA256: `39f12dcc60d00513fe8cac8d5b29527c5a1509a80dded0dbbb2f4a954bbacd82`.

### Proposed decision

```json
{
  "claimId": "claim_c8134ee912609354583c6b4eee28d064",
  "sourceUnitDigest": "39f12dcc60d00513fe8cac8d5b29527c5a1509a80dded0dbbb2f4a954bbacd82",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology.md",
  "targetAnchor": "unheaded-block-33",
  "targetUnitDigest": "39f12dcc60d00513fe8cac8d5b29527c5a1509a80dded0dbbb2f4a954bbacd82",
  "targetAncestry": [
    "Workspace Topology Architecture",
    "7. Capability And Lease Model"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/workspace-topology.md#unheaded-block-31 (lines 249–249) into docs/platform/system-architecture/architecture/workspace-topology.md#unheaded-block-33 (lines 272–272), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
Locks are resource-scoped, not one broad global mutex.
```

### Full target shown text

```text
Locks are resource-scoped, not one broad global mutex.
```

### Unified diff

```diff
No text difference.
```

## claim_503b44c63198e44c9aa9d8b94c378477

Source: `docs/architect/workspace-topology.md#unheaded-block-32`. Target: `docs/platform/system-architecture/architecture/workspace-topology.md#unheaded-block-34`.

Mechanical class: Weak-exact. Source digest: `82bc0e6b0a5a42dba6e5126849e556083652d85102e7f48d05e3702dd4cfe8c7`. Target digest: `82bc0e6b0a5a42dba6e5126849e556083652d85102e7f48d05e3702dd4cfe8c7`.

Full shown source SHA256: `82bc0e6b0a5a42dba6e5126849e556083652d85102e7f48d05e3702dd4cfe8c7`. Full shown target SHA256: `82bc0e6b0a5a42dba6e5126849e556083652d85102e7f48d05e3702dd4cfe8c7`.

### Proposed decision

```json
{
  "claimId": "claim_503b44c63198e44c9aa9d8b94c378477",
  "sourceUnitDigest": "82bc0e6b0a5a42dba6e5126849e556083652d85102e7f48d05e3702dd4cfe8c7",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology.md",
  "targetAnchor": "unheaded-block-34",
  "targetUnitDigest": "82bc0e6b0a5a42dba6e5126849e556083652d85102e7f48d05e3702dd4cfe8c7",
  "targetAncestry": [
    "Workspace Topology Architecture",
    "7. Capability And Lease Model"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. Carry the complete unheaded-block at docs/architect/workspace-topology.md#unheaded-block-32 (lines 251–251) into docs/platform/system-architecture/architecture/workspace-topology.md#unheaded-block-34 (lines 274–274), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
Canonical lock acquisition order:
```

### Full target shown text

```text
Canonical lock acquisition order:
```

### Unified diff

```diff
No text difference.
```

## claim_b015bb8b7df1191f8d4db01183027a5e

Source: `docs/architect/workspace-topology.md#unheaded-block-33`. Target: `docs/platform/system-architecture/architecture/workspace-topology.md#unheaded-block-35`.

Mechanical class: Unit-exact. Source digest: `38c0499a2c2c6ee84e2758e87ef3d2ea25ac7697bbe6b9d4dc8016e67930a7fb`. Target digest: `38c0499a2c2c6ee84e2758e87ef3d2ea25ac7697bbe6b9d4dc8016e67930a7fb`.

Full shown source SHA256: `38c0499a2c2c6ee84e2758e87ef3d2ea25ac7697bbe6b9d4dc8016e67930a7fb`. Full shown target SHA256: `38c0499a2c2c6ee84e2758e87ef3d2ea25ac7697bbe6b9d4dc8016e67930a7fb`.

### Proposed decision

```json
{
  "claimId": "claim_b015bb8b7df1191f8d4db01183027a5e",
  "sourceUnitDigest": "38c0499a2c2c6ee84e2758e87ef3d2ea25ac7697bbe6b9d4dc8016e67930a7fb",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology.md",
  "targetAnchor": "unheaded-block-35",
  "targetUnitDigest": "38c0499a2c2c6ee84e2758e87ef3d2ea25ac7697bbe6b9d4dc8016e67930a7fb",
  "targetAncestry": [
    "Workspace Topology Architecture",
    "7. Capability And Lease Model"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/workspace-topology.md#unheaded-block-33 (lines 253–259) into docs/platform/system-architecture/architecture/workspace-topology.md#unheaded-block-35 (lines 276–282), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
1. `repository-git`
2. `work-state:<workStateId>`
3. `workspace:<workspaceId>`
4. `activation:<workspaceId>`
5. `projection:<workspaceId>`
6. `coordination:<workStateId>`
7. `artifact:<artifactDigest>`
```

### Full target shown text

```text
1. `repository-git`
2. `work-state:<workStateId>`
3. `workspace:<workspaceId>`
4. `activation:<workspaceId>`
5. `projection:<workspaceId>`
6. `coordination:<workStateId>`
7. `artifact:<artifactDigest>`
```

### Unified diff

```diff
No text difference.
```

## claim_7f196f34a44aec9b8d7601dda4620344

Source: `docs/architect/workspace-topology.md#unheaded-block-34`. Target: `docs/platform/system-architecture/architecture/workspace-topology.md#unheaded-block-36`.

Mechanical class: Unit-exact. Source digest: `bafc5a6a0db6b3a2cc6146ccebfaa24b352f390ea832ec67665b8645a0688ee1`. Target digest: `bafc5a6a0db6b3a2cc6146ccebfaa24b352f390ea832ec67665b8645a0688ee1`.

Full shown source SHA256: `bafc5a6a0db6b3a2cc6146ccebfaa24b352f390ea832ec67665b8645a0688ee1`. Full shown target SHA256: `bafc5a6a0db6b3a2cc6146ccebfaa24b352f390ea832ec67665b8645a0688ee1`.

### Proposed decision

```json
{
  "claimId": "claim_7f196f34a44aec9b8d7601dda4620344",
  "sourceUnitDigest": "bafc5a6a0db6b3a2cc6146ccebfaa24b352f390ea832ec67665b8645a0688ee1",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology.md",
  "targetAnchor": "unheaded-block-36",
  "targetUnitDigest": "bafc5a6a0db6b3a2cc6146ccebfaa24b352f390ea832ec67665b8645a0688ee1",
  "targetAncestry": [
    "Workspace Topology Architecture",
    "7. Capability And Lease Model"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/workspace-topology.md#unheaded-block-34 (lines 261–261) into docs/platform/system-architecture/architecture/workspace-topology.md#unheaded-block-36 (lines 284–284), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
Multi-resource operations must acquire locks in this order to avoid deadlock.
```

### Full target shown text

```text
Multi-resource operations must acquire locks in this order to avoid deadlock.
```

### Unified diff

```diff
No text difference.
```

## claim_43228c7bdbb038087f9104fd20b64104

Source: `docs/architect/workspace-topology.md#unheaded-block-35`. Target: `docs/platform/system-architecture/architecture/workspace-topology.md#unheaded-block-37`.

Mechanical class: Unit-exact. Source digest: `9baabc6559384a84914378e18e03214959ef9990326d5c0bb8183fb053679c4f`. Target digest: `9baabc6559384a84914378e18e03214959ef9990326d5c0bb8183fb053679c4f`.

Full shown source SHA256: `9baabc6559384a84914378e18e03214959ef9990326d5c0bb8183fb053679c4f`. Full shown target SHA256: `9baabc6559384a84914378e18e03214959ef9990326d5c0bb8183fb053679c4f`.

### Proposed decision

```json
{
  "claimId": "claim_43228c7bdbb038087f9104fd20b64104",
  "sourceUnitDigest": "9baabc6559384a84914378e18e03214959ef9990326d5c0bb8183fb053679c4f",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology.md",
  "targetAnchor": "unheaded-block-37",
  "targetUnitDigest": "9baabc6559384a84914378e18e03214959ef9990326d5c0bb8183fb053679c4f",
  "targetAncestry": [
    "Workspace Topology Architecture",
    "7. Capability And Lease Model"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/workspace-topology.md#unheaded-block-35 (lines 263–263) into docs/platform/system-architecture/architecture/workspace-topology.md#unheaded-block-37 (lines 286–286), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
Each mutating lease/lock record must carry:
```

### Full target shown text

```text
Each mutating lease/lock record must carry:
```

### Unified diff

```diff
No text difference.
```

## claim_00af275bc40f0df0f12b3407c9e12e5b

Source: `docs/architect/workspace-topology.md#unheaded-block-36`. Target: `docs/platform/system-architecture/architecture/workspace-topology.md#unheaded-block-38`.

Mechanical class: Unit-exact. Source digest: `51dc46a5d478151d94a61071561cd476661ecf863e6d591ba0d30caac2348365`. Target digest: `51dc46a5d478151d94a61071561cd476661ecf863e6d591ba0d30caac2348365`.

Full shown source SHA256: `51dc46a5d478151d94a61071561cd476661ecf863e6d591ba0d30caac2348365`. Full shown target SHA256: `51dc46a5d478151d94a61071561cd476661ecf863e6d591ba0d30caac2348365`.

### Proposed decision

```json
{
  "claimId": "claim_00af275bc40f0df0f12b3407c9e12e5b",
  "sourceUnitDigest": "51dc46a5d478151d94a61071561cd476661ecf863e6d591ba0d30caac2348365",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology.md",
  "targetAnchor": "unheaded-block-38",
  "targetUnitDigest": "51dc46a5d478151d94a61071561cd476661ecf863e6d591ba0d30caac2348365",
  "targetAncestry": [
    "Workspace Topology Architecture",
    "7. Capability And Lease Model"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/workspace-topology.md#unheaded-block-36 (lines 265–275) into docs/platform/system-architecture/architecture/workspace-topology.md#unheaded-block-38 (lines 288–298), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
- resource id;
- owner kind;
- process id when available;
- process start token when available;
- boot id when available;
- `workspaceId`;
- `workStateId`;
- `artifactDigest` when a runtime is executing;
- fencing token;
- parent lease id when nested;
- heartbeat/expiry metadata.
```

### Full target shown text

```text
- resource id;
- owner kind;
- process id when available;
- process start token when available;
- boot id when available;
- `workspaceId`;
- `workStateId`;
- `artifactDigest` when a runtime is executing;
- fencing token;
- parent lease id when nested;
- heartbeat/expiry metadata.
```

### Unified diff

```diff
No text difference.
```

## claim_5fc418b20c663d71ef9951a2dc04d5b8

Source: `docs/architect/workspace-topology.md#unheaded-block-37`. Target: `docs/platform/system-architecture/architecture/workspace-topology.md#unheaded-block-39`.

Mechanical class: Unit-exact. Source digest: `ce95f23bd6e77349342018d2429386a1a9e72b168f30c750557e84633ee7e541`. Target digest: `ce95f23bd6e77349342018d2429386a1a9e72b168f30c750557e84633ee7e541`.

Full shown source SHA256: `ce95f23bd6e77349342018d2429386a1a9e72b168f30c750557e84633ee7e541`. Full shown target SHA256: `ce95f23bd6e77349342018d2429386a1a9e72b168f30c750557e84633ee7e541`.

### Proposed decision

```json
{
  "claimId": "claim_5fc418b20c663d71ef9951a2dc04d5b8",
  "sourceUnitDigest": "ce95f23bd6e77349342018d2429386a1a9e72b168f30c750557e84633ee7e541",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology.md",
  "targetAnchor": "unheaded-block-39",
  "targetUnitDigest": "ce95f23bd6e77349342018d2429386a1a9e72b168f30c750557e84633ee7e541",
  "targetAncestry": [
    "Workspace Topology Architecture",
    "7. Capability And Lease Model"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/workspace-topology.md#unheaded-block-37 (lines 277–279) into docs/platform/system-architecture/architecture/workspace-topology.md#unheaded-block-39 (lines 300–302), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
TTL detects suspicion; it does not transfer authority. Recovery may clear or
supersede a lease only when owner death is mechanically proven or a human/local
operator records explicit completion-unknown recovery.
```

### Full target shown text

```text
TTL detects suspicion; it does not transfer authority. Recovery may clear or
supersede a lease only when owner death is mechanically proven or a human/local
operator records explicit completion-unknown recovery.
```

### Unified diff

```diff
No text difference.
```

## claim_5e1b7cbf697efdf3f8be1df4939948bf

Source: `docs/architect/workspace-topology.md#8-operation-capability-matrix`. Target: `docs/platform/system-architecture/architecture/workspace-topology.md#8-operation-capability-matrix`.

Mechanical class: Weak-exact. Source digest: `5b29c2699c83837a0e610fe734a2c3fdad3498c86731a32987e796a9c8dea3bb`. Target digest: `5b29c2699c83837a0e610fe734a2c3fdad3498c86731a32987e796a9c8dea3bb`.

Full shown source SHA256: `74856ba926d059dab557ef444d6be845b62f09e48b014adaac3e130252ae54ec`. Full shown target SHA256: `74856ba926d059dab557ef444d6be845b62f09e48b014adaac3e130252ae54ec`.

### Proposed decision

```json
{
  "claimId": "claim_5e1b7cbf697efdf3f8be1df4939948bf",
  "sourceUnitDigest": "5b29c2699c83837a0e610fe734a2c3fdad3498c86731a32987e796a9c8dea3bb",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology.md",
  "targetAnchor": "8-operation-capability-matrix",
  "targetUnitDigest": "5b29c2699c83837a0e610fe734a2c3fdad3498c86731a32987e796a9c8dea3bb",
  "targetAncestry": [
    "Workspace Topology Architecture"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. Carry the complete heading at docs/architect/workspace-topology.md#8-operation-capability-matrix (lines 281–281) into docs/platform/system-architecture/architecture/workspace-topology.md#8-operation-capability-matrix (lines 304–304), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
## 8. Operation Capability Matrix

| Operation | Policy Read | Durable Write | Coordination Write | Workspace Write | Required Locks/Leases | Forbidden Roots | Failure If Missing |
|---|---|---|---|---|---|---|---|
| `fgctl init` | `workspacePolicy(workspaceId)` | none directly | optional install transaction | shims/activation prep only | `activation:<workspaceId>`, `artifact:<artifactDigest>` | work history hot path | `runtime-not-staged`, `policy-ambiguous`, `activation-busy` |
| `fgctl upgrade/repair` | `workspacePolicy(workspaceId)` | none directly | install transaction | activation binding | `activation:<workspaceId>`, mutating runtime leases must be clear | work history hot path | `activation-busy`, `runtime-incompatible` |
| local `fgos init` | `workspacePolicy(workspaceId)` | schema adoption only when granted | none by default | projections/config defaults | `workspace:<workspaceId>`, `projection:<workspaceId>` | unrelated workspace roots | `workspace-policy-unwritable`, `projection-conflict` |
| `fgos doctor` | all declared read roots | none | none | none | read-only | all writes | `topology-ambiguous` warning/refusal depending check |
| `fgos doctor --fix` | workspace policy + projection ledger | only fixes declared safe state | repair coordination only when declared | safe projection/config repair | class-specific locks | immutable payload, unrelated workspace | `fix-not-authorized` |
| `fgos submit` | `workspacePolicy(workspaceId)` | append to `workHistoryRoot(workStateId)` | none | none except declared projection | `work-state:<workStateId>` | main/product files | `work-state-unavailable`, `policy-ambiguous` |
| `fgos pick` / `take` | workspace policy + work view | optional durable status event | claim/assignment state | worker worktree creation | `coordination:<workStateId>`, optional `repository-git` | main product files | `claim-conflict`, `worktree-unavailable` |
| `fgos return` | workspace policy + worktree branch | append return/result event | release claim | worker branch only | `work-state:<workStateId>`, `coordination:<workStateId>` | main product files before approve | `claim-mismatch`, `branch-dirty` |
| `fgos approve` | main workspace policy + work view | append approval/merge result | cleanup claim/session | main checkout through merge only | `repository-git`, `work-state:<workStateId>` | worker-only state roots | `main-dirty`, `merge-busy` |
| runner dispatch | workspace policy + work view | assignment/result events as granted | assignment claims | worker workspace | per-assignment lease, `coordination:<workStateId>` | long-lived activation lease | `slots-full`, `assignment-conflict` |
| event append/replay | none or policy read for validation | append only | none | derived view only | `work-state:<workStateId>` | workspace content except checkpoint | `event-lock-timeout`, `corrupt-log` |
| config edit/test | current workspace policy | none | none | `.fgos/config.json` in current workspace | `workspace:<workspaceId>` | main config unless current workspace is main | `policy-root-ambiguous` |
| projection materialization | runtime workshop + workspace policy | none | none | projection paths in current workspace | `projection:<workspaceId>` | source-owned unmanaged files | `projection-conflict` |
```

### Full target shown text

```text
## 8. Operation Capability Matrix

| Operation | Policy Read | Durable Write | Coordination Write | Workspace Write | Required Locks/Leases | Forbidden Roots | Failure If Missing |
|---|---|---|---|---|---|---|---|
| `fgctl init` | `workspacePolicy(workspaceId)` | none directly | optional install transaction | shims/activation prep only | `activation:<workspaceId>`, `artifact:<artifactDigest>` | work history hot path | `runtime-not-staged`, `policy-ambiguous`, `activation-busy` |
| `fgctl upgrade/repair` | `workspacePolicy(workspaceId)` | none directly | install transaction | activation binding | `activation:<workspaceId>`, mutating runtime leases must be clear | work history hot path | `activation-busy`, `runtime-incompatible` |
| local `fgos init` | `workspacePolicy(workspaceId)` | schema adoption only when granted | none by default | projections/config defaults | `workspace:<workspaceId>`, `projection:<workspaceId>` | unrelated workspace roots | `workspace-policy-unwritable`, `projection-conflict` |
| `fgos doctor` | all declared read roots | none | none | none | read-only | all writes | `topology-ambiguous` warning/refusal depending check |
| `fgos doctor --fix` | workspace policy + projection ledger | only fixes declared safe state | repair coordination only when declared | safe projection/config repair | class-specific locks | immutable payload, unrelated workspace | `fix-not-authorized` |
| `fgos submit` | `workspacePolicy(workspaceId)` | append to `workHistoryRoot(workStateId)` | none | none except declared projection | `work-state:<workStateId>` | main/product files | `work-state-unavailable`, `policy-ambiguous` |
| `fgos pick` / `take` | workspace policy + work view | optional durable status event | claim/assignment state | worker worktree creation | `coordination:<workStateId>`, optional `repository-git` | main product files | `claim-conflict`, `worktree-unavailable` |
| `fgos return` | workspace policy + worktree branch | append return/result event | release claim | worker branch only | `work-state:<workStateId>`, `coordination:<workStateId>` | main product files before approve | `claim-mismatch`, `branch-dirty` |
| `fgos approve` | main workspace policy + work view | append approval/merge result | cleanup claim/session | main checkout through merge only | `repository-git`, `work-state:<workStateId>` | worker-only state roots | `main-dirty`, `merge-busy` |
| runner dispatch | workspace policy + work view | assignment/result events as granted | assignment claims | worker workspace | per-assignment lease, `coordination:<workStateId>` | long-lived activation lease | `slots-full`, `assignment-conflict` |
| event append/replay | none or policy read for validation | append only | none | derived view only | `work-state:<workStateId>` | workspace content except checkpoint | `event-lock-timeout`, `corrupt-log` |
| config edit/test | current workspace policy | none | none | `.fgos/config.json` in current workspace | `workspace:<workspaceId>` | main config unless current workspace is main | `policy-root-ambiguous` |
| projection materialization | runtime workshop + workspace policy | none | none | projection paths in current workspace | `projection:<workspaceId>` | source-owned unmanaged files | `projection-conflict` |
```

### Unified diff

```diff
No text difference.
```

## claim_50c47b582dbc95fbe5e8bdf4098bec03

Source: `docs/architect/workspace-topology.md#unheaded-block-38`. Target: `docs/platform/system-architecture/architecture/workspace-topology.md#unheaded-block-40`.

Mechanical class: Unit-exact. Source digest: `593a79d0267f12f63a60679bb1159c63d8d897c98878a929eac391fca6fd7985`. Target digest: `593a79d0267f12f63a60679bb1159c63d8d897c98878a929eac391fca6fd7985`.

Full shown source SHA256: `593a79d0267f12f63a60679bb1159c63d8d897c98878a929eac391fca6fd7985`. Full shown target SHA256: `593a79d0267f12f63a60679bb1159c63d8d897c98878a929eac391fca6fd7985`.

### Proposed decision

```json
{
  "claimId": "claim_50c47b582dbc95fbe5e8bdf4098bec03",
  "sourceUnitDigest": "593a79d0267f12f63a60679bb1159c63d8d897c98878a929eac391fca6fd7985",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology.md",
  "targetAnchor": "unheaded-block-40",
  "targetUnitDigest": "593a79d0267f12f63a60679bb1159c63d8d897c98878a929eac391fca6fd7985",
  "targetAncestry": [
    "Workspace Topology Architecture",
    "8. Operation Capability Matrix"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/workspace-topology.md#unheaded-block-38 (lines 283–297) into docs/platform/system-architecture/architecture/workspace-topology.md#unheaded-block-40 (lines 306–320), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
| Operation | Policy Read | Durable Write | Coordination Write | Workspace Write | Required Locks/Leases | Forbidden Roots | Failure If Missing |
|---|---|---|---|---|---|---|---|
| `fgctl init` | `workspacePolicy(workspaceId)` | none directly | optional install transaction | shims/activation prep only | `activation:<workspaceId>`, `artifact:<artifactDigest>` | work history hot path | `runtime-not-staged`, `policy-ambiguous`, `activation-busy` |
| `fgctl upgrade/repair` | `workspacePolicy(workspaceId)` | none directly | install transaction | activation binding | `activation:<workspaceId>`, mutating runtime leases must be clear | work history hot path | `activation-busy`, `runtime-incompatible` |
| local `fgos init` | `workspacePolicy(workspaceId)` | schema adoption only when granted | none by default | projections/config defaults | `workspace:<workspaceId>`, `projection:<workspaceId>` | unrelated workspace roots | `workspace-policy-unwritable`, `projection-conflict` |
| `fgos doctor` | all declared read roots | none | none | none | read-only | all writes | `topology-ambiguous` warning/refusal depending check |
| `fgos doctor --fix` | workspace policy + projection ledger | only fixes declared safe state | repair coordination only when declared | safe projection/config repair | class-specific locks | immutable payload, unrelated workspace | `fix-not-authorized` |
| `fgos submit` | `workspacePolicy(workspaceId)` | append to `workHistoryRoot(workStateId)` | none | none except declared projection | `work-state:<workStateId>` | main/product files | `work-state-unavailable`, `policy-ambiguous` |
| `fgos pick` / `take` | workspace policy + work view | optional durable status event | claim/assignment state | worker worktree creation | `coordination:<workStateId>`, optional `repository-git` | main product files | `claim-conflict`, `worktree-unavailable` |
| `fgos return` | workspace policy + worktree branch | append return/result event | release claim | worker branch only | `work-state:<workStateId>`, `coordination:<workStateId>` | main product files before approve | `claim-mismatch`, `branch-dirty` |
| `fgos approve` | main workspace policy + work view | append approval/merge result | cleanup claim/session | main checkout through merge only | `repository-git`, `work-state:<workStateId>` | worker-only state roots | `main-dirty`, `merge-busy` |
| runner dispatch | workspace policy + work view | assignment/result events as granted | assignment claims | worker workspace | per-assignment lease, `coordination:<workStateId>` | long-lived activation lease | `slots-full`, `assignment-conflict` |
| event append/replay | none or policy read for validation | append only | none | derived view only | `work-state:<workStateId>` | workspace content except checkpoint | `event-lock-timeout`, `corrupt-log` |
| config edit/test | current workspace policy | none | none | `.fgos/config.json` in current workspace | `workspace:<workspaceId>` | main config unless current workspace is main | `policy-root-ambiguous` |
| projection materialization | runtime workshop + workspace policy | none | none | projection paths in current workspace | `projection:<workspaceId>` | source-owned unmanaged files | `projection-conflict` |
```

### Full target shown text

```text
| Operation | Policy Read | Durable Write | Coordination Write | Workspace Write | Required Locks/Leases | Forbidden Roots | Failure If Missing |
|---|---|---|---|---|---|---|---|
| `fgctl init` | `workspacePolicy(workspaceId)` | none directly | optional install transaction | shims/activation prep only | `activation:<workspaceId>`, `artifact:<artifactDigest>` | work history hot path | `runtime-not-staged`, `policy-ambiguous`, `activation-busy` |
| `fgctl upgrade/repair` | `workspacePolicy(workspaceId)` | none directly | install transaction | activation binding | `activation:<workspaceId>`, mutating runtime leases must be clear | work history hot path | `activation-busy`, `runtime-incompatible` |
| local `fgos init` | `workspacePolicy(workspaceId)` | schema adoption only when granted | none by default | projections/config defaults | `workspace:<workspaceId>`, `projection:<workspaceId>` | unrelated workspace roots | `workspace-policy-unwritable`, `projection-conflict` |
| `fgos doctor` | all declared read roots | none | none | none | read-only | all writes | `topology-ambiguous` warning/refusal depending check |
| `fgos doctor --fix` | workspace policy + projection ledger | only fixes declared safe state | repair coordination only when declared | safe projection/config repair | class-specific locks | immutable payload, unrelated workspace | `fix-not-authorized` |
| `fgos submit` | `workspacePolicy(workspaceId)` | append to `workHistoryRoot(workStateId)` | none | none except declared projection | `work-state:<workStateId>` | main/product files | `work-state-unavailable`, `policy-ambiguous` |
| `fgos pick` / `take` | workspace policy + work view | optional durable status event | claim/assignment state | worker worktree creation | `coordination:<workStateId>`, optional `repository-git` | main product files | `claim-conflict`, `worktree-unavailable` |
| `fgos return` | workspace policy + worktree branch | append return/result event | release claim | worker branch only | `work-state:<workStateId>`, `coordination:<workStateId>` | main product files before approve | `claim-mismatch`, `branch-dirty` |
| `fgos approve` | main workspace policy + work view | append approval/merge result | cleanup claim/session | main checkout through merge only | `repository-git`, `work-state:<workStateId>` | worker-only state roots | `main-dirty`, `merge-busy` |
| runner dispatch | workspace policy + work view | assignment/result events as granted | assignment claims | worker workspace | per-assignment lease, `coordination:<workStateId>` | long-lived activation lease | `slots-full`, `assignment-conflict` |
| event append/replay | none or policy read for validation | append only | none | derived view only | `work-state:<workStateId>` | workspace content except checkpoint | `event-lock-timeout`, `corrupt-log` |
| config edit/test | current workspace policy | none | none | `.fgos/config.json` in current workspace | `workspace:<workspaceId>` | main config unless current workspace is main | `policy-root-ambiguous` |
| projection materialization | runtime workshop + workspace policy | none | none | projection paths in current workspace | `projection:<workspaceId>` | source-owned unmanaged files | `projection-conflict` |
```

### Unified diff

```diff
No text difference.
```

## claim_51b16d6ef92fb91be81b9fcfa81102c3

Source: `docs/architect/workspace-topology.md#9-acceptance-scenarios`. Target: `docs/platform/system-architecture/architecture/workspace-topology.md#9-acceptance-scenarios`.

Mechanical class: Weak-exact. Source digest: `7f6a5e55a5b1fb8c55b28ede39ea32a1301aa8e37535dda2ad5d041de8176754`. Target digest: `7f6a5e55a5b1fb8c55b28ede39ea32a1301aa8e37535dda2ad5d041de8176754`.

Full shown source SHA256: `e478a663becacc442a53582b3758d646ad7669dac5f06212f97b96bd18d6b645`. Full shown target SHA256: `e478a663becacc442a53582b3758d646ad7669dac5f06212f97b96bd18d6b645`.

### Proposed decision

```json
{
  "claimId": "claim_51b16d6ef92fb91be81b9fcfa81102c3",
  "sourceUnitDigest": "7f6a5e55a5b1fb8c55b28ede39ea32a1301aa8e37535dda2ad5d041de8176754",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology.md",
  "targetAnchor": "9-acceptance-scenarios",
  "targetUnitDigest": "7f6a5e55a5b1fb8c55b28ede39ea32a1301aa8e37535dda2ad5d041de8176754",
  "targetAncestry": [
    "Workspace Topology Architecture"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. Carry the complete heading at docs/architect/workspace-topology.md#9-acceptance-scenarios (lines 299–299) into docs/platform/system-architecture/architecture/workspace-topology.md#9-acceptance-scenarios (lines 322–322), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
## 9. Acceptance Scenarios

A stranger engineer can implement against this contract when these scenarios
have pass/fail tests:

1. Two linked worktrees with different `.fgos/distribution.json` select different
   activation bindings but reuse the same machine release store.
2. A worker branch edits `.fgos/config.json`; dispatch/doctor for that worktree
   reads the edited config, while main remains unchanged.
3. `fgos submit` from a worker reads workspace policy but appends to the shared
   `workStateId` hot history without dirtying main.
4. Two workers append events concurrently; no lost update occurs, and no hot
   event file appears as main checkout dirty.
5. A stale claim with only expired TTL is not destructively cleared unless owner
   death is proven or explicit recovery is recorded.
6. `fgctl upgrade` refuses while a mutating assignment lease for the same
   `workspaceId`/`workStateId` is active.
7. `fgos doctor --fix` materializes skills/agents/prose only through the
   workspace projection ledger and refuses source-owned collisions.
8. A fresh clone with tracked config/pin/checkpoints but no machine runtime runs
   `fgctl init` and reaches a ready workspace activation.
9. The same checkout opened through a symlink resolves to the same
   `workspaceId`.
10. Non-Git workspace mode runs local init/doctor/submit but refuses operations
    requiring Git worktree isolation.
```

### Full target shown text

```text
## 9. Acceptance Scenarios

A stranger engineer can implement against this contract when these scenarios
have pass/fail tests:

1. Two linked worktrees with different `.fgos/distribution.json` select different
   activation bindings but reuse the same machine release store.
2. A worker branch edits `.fgos/config.json`; dispatch/doctor for that worktree
   reads the edited config, while main remains unchanged.
3. `fgos submit` from a worker reads workspace policy but appends to the shared
   `workStateId` hot history without dirtying main.
4. Two workers append events concurrently; no lost update occurs, and no hot
   event file appears as main checkout dirty.
5. A stale claim with only expired TTL is not destructively cleared unless owner
   death is proven or explicit recovery is recorded.
6. `fgctl upgrade` refuses while a mutating assignment lease for the same
   `workspaceId`/`workStateId` is active.
7. `fgos doctor --fix` materializes skills/agents/prose only through the
   workspace projection ledger and refuses source-owned collisions.
8. A fresh clone with tracked config/pin/checkpoints but no machine runtime runs
   `fgctl init` and reaches a ready workspace activation.
9. The same checkout opened through a symlink resolves to the same
   `workspaceId`.
10. Non-Git workspace mode runs local init/doctor/submit but refuses operations
    requiring Git worktree isolation.
```

### Unified diff

```diff
No text difference.
```

## claim_40528aff000b27d36b3df7cd434dec48

Source: `docs/architect/workspace-topology.md#unheaded-block-39`. Target: `docs/platform/system-architecture/architecture/workspace-topology.md#unheaded-block-41`.

Mechanical class: Unit-exact. Source digest: `2eb0b1a00dca210dd65d932bfd680288f7c2e18d1e0b9ea9118f9652a73450d6`. Target digest: `2eb0b1a00dca210dd65d932bfd680288f7c2e18d1e0b9ea9118f9652a73450d6`.

Full shown source SHA256: `2eb0b1a00dca210dd65d932bfd680288f7c2e18d1e0b9ea9118f9652a73450d6`. Full shown target SHA256: `2eb0b1a00dca210dd65d932bfd680288f7c2e18d1e0b9ea9118f9652a73450d6`.

### Proposed decision

```json
{
  "claimId": "claim_40528aff000b27d36b3df7cd434dec48",
  "sourceUnitDigest": "2eb0b1a00dca210dd65d932bfd680288f7c2e18d1e0b9ea9118f9652a73450d6",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology.md",
  "targetAnchor": "unheaded-block-41",
  "targetUnitDigest": "2eb0b1a00dca210dd65d932bfd680288f7c2e18d1e0b9ea9118f9652a73450d6",
  "targetAncestry": [
    "Workspace Topology Architecture",
    "9. Acceptance Scenarios"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/workspace-topology.md#unheaded-block-39 (lines 301–302) into docs/platform/system-architecture/architecture/workspace-topology.md#unheaded-block-41 (lines 324–325), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
A stranger engineer can implement against this contract when these scenarios
have pass/fail tests:
```

### Full target shown text

```text
A stranger engineer can implement against this contract when these scenarios
have pass/fail tests:
```

### Unified diff

```diff
No text difference.
```

## claim_5133dedaf33a02681aacb2590da36701

Source: `docs/architect/workspace-topology.md#unheaded-block-40`. Target: `docs/platform/system-architecture/architecture/workspace-topology.md#unheaded-block-42`.

Mechanical class: Unit-exact. Source digest: `6d1d06bc72ab50a218b5b39d41f061319a01f2d12e223cfb6617b4f23ebcad8c`. Target digest: `6d1d06bc72ab50a218b5b39d41f061319a01f2d12e223cfb6617b4f23ebcad8c`.

Full shown source SHA256: `6d1d06bc72ab50a218b5b39d41f061319a01f2d12e223cfb6617b4f23ebcad8c`. Full shown target SHA256: `6d1d06bc72ab50a218b5b39d41f061319a01f2d12e223cfb6617b4f23ebcad8c`.

### Proposed decision

```json
{
  "claimId": "claim_5133dedaf33a02681aacb2590da36701",
  "sourceUnitDigest": "6d1d06bc72ab50a218b5b39d41f061319a01f2d12e223cfb6617b4f23ebcad8c",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology.md",
  "targetAnchor": "unheaded-block-42",
  "targetUnitDigest": "6d1d06bc72ab50a218b5b39d41f061319a01f2d12e223cfb6617b4f23ebcad8c",
  "targetAncestry": [
    "Workspace Topology Architecture",
    "9. Acceptance Scenarios"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/workspace-topology.md#unheaded-block-40 (lines 304–323) into docs/platform/system-architecture/architecture/workspace-topology.md#unheaded-block-42 (lines 327–346), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
1. Two linked worktrees with different `.fgos/distribution.json` select different
   activation bindings but reuse the same machine release store.
2. A worker branch edits `.fgos/config.json`; dispatch/doctor for that worktree
   reads the edited config, while main remains unchanged.
3. `fgos submit` from a worker reads workspace policy but appends to the shared
   `workStateId` hot history without dirtying main.
4. Two workers append events concurrently; no lost update occurs, and no hot
   event file appears as main checkout dirty.
5. A stale claim with only expired TTL is not destructively cleared unless owner
   death is proven or explicit recovery is recorded.
6. `fgctl upgrade` refuses while a mutating assignment lease for the same
   `workspaceId`/`workStateId` is active.
7. `fgos doctor --fix` materializes skills/agents/prose only through the
   workspace projection ledger and refuses source-owned collisions.
8. A fresh clone with tracked config/pin/checkpoints but no machine runtime runs
   `fgctl init` and reaches a ready workspace activation.
9. The same checkout opened through a symlink resolves to the same
   `workspaceId`.
10. Non-Git workspace mode runs local init/doctor/submit but refuses operations
    requiring Git worktree isolation.
```

### Full target shown text

```text
1. Two linked worktrees with different `.fgos/distribution.json` select different
   activation bindings but reuse the same machine release store.
2. A worker branch edits `.fgos/config.json`; dispatch/doctor for that worktree
   reads the edited config, while main remains unchanged.
3. `fgos submit` from a worker reads workspace policy but appends to the shared
   `workStateId` hot history without dirtying main.
4. Two workers append events concurrently; no lost update occurs, and no hot
   event file appears as main checkout dirty.
5. A stale claim with only expired TTL is not destructively cleared unless owner
   death is proven or explicit recovery is recorded.
6. `fgctl upgrade` refuses while a mutating assignment lease for the same
   `workspaceId`/`workStateId` is active.
7. `fgos doctor --fix` materializes skills/agents/prose only through the
   workspace projection ledger and refuses source-owned collisions.
8. A fresh clone with tracked config/pin/checkpoints but no machine runtime runs
   `fgctl init` and reaches a ready workspace activation.
9. The same checkout opened through a symlink resolves to the same
   `workspaceId`.
10. Non-Git workspace mode runs local init/doctor/submit but refuses operations
    requiring Git worktree isolation.
```

### Unified diff

```diff
No text difference.
```

## claim_cc6c4f59b7d4594b8db57b8ebbd96d16

Source: `docs/architect/workspace-topology.md#10-open-decision`. Target: `docs/platform/system-architecture/architecture/workspace-topology.md#10-open-decision`.

Mechanical class: Weak-exact. Source digest: `8ba447eac8e30eae6a221cbe3237a03b00ed068f81652b65bc98c5b9770ae26e`. Target digest: `8ba447eac8e30eae6a221cbe3237a03b00ed068f81652b65bc98c5b9770ae26e`.

Full shown source SHA256: `20a1b1b9837d68ec4020b85c80def5b18fe0c1b8c95161ece3770febe69cb867`. Full shown target SHA256: `20a1b1b9837d68ec4020b85c80def5b18fe0c1b8c95161ece3770febe69cb867`.

### Proposed decision

```json
{
  "claimId": "claim_cc6c4f59b7d4594b8db57b8ebbd96d16",
  "sourceUnitDigest": "8ba447eac8e30eae6a221cbe3237a03b00ed068f81652b65bc98c5b9770ae26e",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology.md",
  "targetAnchor": "10-open-decision",
  "targetUnitDigest": "8ba447eac8e30eae6a221cbe3237a03b00ed068f81652b65bc98c5b9770ae26e",
  "targetAncestry": [
    "Workspace Topology Architecture"
  ],
  "claimKind": "decision",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. Carry the complete heading at docs/architect/workspace-topology.md#10-open-decision (lines 325–325) into docs/platform/system-architecture/architecture/workspace-topology.md#10-open-decision (lines 348–348), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

````text
## 10. Open Decision

The remaining blocker before promoting this document from draft to locked
contract is durable work-history placement.

Recommended V1 decision:

```txt
hot work history lives outside the tracked workspace tree
sealed immutable checkpoints live inside tracked .fgos/history/checkpoints/
```

Checkpoint requirements:

- immutable segment files;
- sequence range;
- predecessor digest;
- segment digest;
- idempotent import rule;
- duplicate detection by event identity/content hash;
- no checkpoint segment may be rewritten in place.

This hybrid shape preserves audit/sync/backup through Git without making the
working tree the hot event store.
````

### Full target shown text

````text
## 10. Open Decision

The remaining blocker before promoting this document from draft to locked
contract is durable work-history placement.

Recommended V1 decision:

```txt
hot work history lives outside the tracked workspace tree
sealed immutable checkpoints live inside tracked .fgos/history/checkpoints/
```

Checkpoint requirements:

- immutable segment files;
- sequence range;
- predecessor digest;
- segment digest;
- idempotent import rule;
- duplicate detection by event identity/content hash;
- no checkpoint segment may be rewritten in place.

This hybrid shape preserves audit/sync/backup through Git without making the
working tree the hot event store.
````

### Unified diff

```diff
No text difference.
```

## claim_ffa1bff790cd60fb528a9f394c061678

Source: `docs/architect/workspace-topology.md#unheaded-block-41`. Target: `docs/platform/system-architecture/architecture/workspace-topology.md#unheaded-block-43`.

Mechanical class: Unit-exact. Source digest: `871aac64aa2d3ccbf21eba142c2cadf9db029948f1830110f08e914482d8e396`. Target digest: `871aac64aa2d3ccbf21eba142c2cadf9db029948f1830110f08e914482d8e396`.

Full shown source SHA256: `871aac64aa2d3ccbf21eba142c2cadf9db029948f1830110f08e914482d8e396`. Full shown target SHA256: `871aac64aa2d3ccbf21eba142c2cadf9db029948f1830110f08e914482d8e396`.

### Proposed decision

```json
{
  "claimId": "claim_ffa1bff790cd60fb528a9f394c061678",
  "sourceUnitDigest": "871aac64aa2d3ccbf21eba142c2cadf9db029948f1830110f08e914482d8e396",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology.md",
  "targetAnchor": "unheaded-block-43",
  "targetUnitDigest": "871aac64aa2d3ccbf21eba142c2cadf9db029948f1830110f08e914482d8e396",
  "targetAncestry": [
    "Workspace Topology Architecture",
    "10. Open Decision"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/workspace-topology.md#unheaded-block-41 (lines 327–328) into docs/platform/system-architecture/architecture/workspace-topology.md#unheaded-block-43 (lines 350–351), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
The remaining blocker before promoting this document from draft to locked
contract is durable work-history placement.
```

### Full target shown text

```text
The remaining blocker before promoting this document from draft to locked
contract is durable work-history placement.
```

### Unified diff

```diff
No text difference.
```

## claim_19bd2250a4ef180c9c8f31d839e744d6

Source: `docs/architect/workspace-topology.md#unheaded-block-42`. Target: `docs/platform/system-architecture/architecture/workspace-topology.md#unheaded-block-44`.

Mechanical class: Weak-exact. Source digest: `7d9256784fdd1a3c3e74792e3a15ee61822d1f1204bb63abfffd8772e853bf14`. Target digest: `7d9256784fdd1a3c3e74792e3a15ee61822d1f1204bb63abfffd8772e853bf14`.

Full shown source SHA256: `7d9256784fdd1a3c3e74792e3a15ee61822d1f1204bb63abfffd8772e853bf14`. Full shown target SHA256: `7d9256784fdd1a3c3e74792e3a15ee61822d1f1204bb63abfffd8772e853bf14`.

### Proposed decision

```json
{
  "claimId": "claim_19bd2250a4ef180c9c8f31d839e744d6",
  "sourceUnitDigest": "7d9256784fdd1a3c3e74792e3a15ee61822d1f1204bb63abfffd8772e853bf14",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology.md",
  "targetAnchor": "unheaded-block-44",
  "targetUnitDigest": "7d9256784fdd1a3c3e74792e3a15ee61822d1f1204bb63abfffd8772e853bf14",
  "targetAncestry": [
    "Workspace Topology Architecture",
    "10. Open Decision"
  ],
  "claimKind": "decision",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. Carry the complete unheaded-block at docs/architect/workspace-topology.md#unheaded-block-42 (lines 330–330) into docs/platform/system-architecture/architecture/workspace-topology.md#unheaded-block-44 (lines 353–353), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
Recommended V1 decision:
```

### Full target shown text

```text
Recommended V1 decision:
```

### Unified diff

```diff
No text difference.
```

## claim_09d2e5848df7a846cafe63aa26bbc84b

Source: `docs/architect/workspace-topology.md#unheaded-block-43`. Target: `docs/platform/system-architecture/architecture/workspace-topology.md#unheaded-block-45`.

Mechanical class: Unit-exact. Source digest: `1ecdab79a500623f963fb6d538f35dfd0116d484727915930ecc47a94a0df7a6`. Target digest: `1ecdab79a500623f963fb6d538f35dfd0116d484727915930ecc47a94a0df7a6`.

Full shown source SHA256: `1ecdab79a500623f963fb6d538f35dfd0116d484727915930ecc47a94a0df7a6`. Full shown target SHA256: `1ecdab79a500623f963fb6d538f35dfd0116d484727915930ecc47a94a0df7a6`.

### Proposed decision

```json
{
  "claimId": "claim_09d2e5848df7a846cafe63aa26bbc84b",
  "sourceUnitDigest": "1ecdab79a500623f963fb6d538f35dfd0116d484727915930ecc47a94a0df7a6",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology.md",
  "targetAnchor": "unheaded-block-45",
  "targetUnitDigest": "1ecdab79a500623f963fb6d538f35dfd0116d484727915930ecc47a94a0df7a6",
  "targetAncestry": [
    "Workspace Topology Architecture",
    "10. Open Decision"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/workspace-topology.md#unheaded-block-43 (lines 332–335) into docs/platform/system-architecture/architecture/workspace-topology.md#unheaded-block-45 (lines 355–358), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

````text
```txt
hot work history lives outside the tracked workspace tree
sealed immutable checkpoints live inside tracked .fgos/history/checkpoints/
```
````

### Full target shown text

````text
```txt
hot work history lives outside the tracked workspace tree
sealed immutable checkpoints live inside tracked .fgos/history/checkpoints/
```
````

### Unified diff

```diff
No text difference.
```

## claim_110036ff6506a3e5357d0a8c421bbed8

Source: `docs/architect/workspace-topology.md#unheaded-block-44`. Target: `docs/platform/system-architecture/architecture/workspace-topology.md#unheaded-block-46`.

Mechanical class: Weak-exact. Source digest: `eaf20036b6e6825243bd03edfe09be343ca0a91eda38672685b775203b346ee5`. Target digest: `eaf20036b6e6825243bd03edfe09be343ca0a91eda38672685b775203b346ee5`.

Full shown source SHA256: `eaf20036b6e6825243bd03edfe09be343ca0a91eda38672685b775203b346ee5`. Full shown target SHA256: `eaf20036b6e6825243bd03edfe09be343ca0a91eda38672685b775203b346ee5`.

### Proposed decision

```json
{
  "claimId": "claim_110036ff6506a3e5357d0a8c421bbed8",
  "sourceUnitDigest": "eaf20036b6e6825243bd03edfe09be343ca0a91eda38672685b775203b346ee5",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology.md",
  "targetAnchor": "unheaded-block-46",
  "targetUnitDigest": "eaf20036b6e6825243bd03edfe09be343ca0a91eda38672685b775203b346ee5",
  "targetAncestry": [
    "Workspace Topology Architecture",
    "10. Open Decision"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. Carry the complete unheaded-block at docs/architect/workspace-topology.md#unheaded-block-44 (lines 337–337) into docs/platform/system-architecture/architecture/workspace-topology.md#unheaded-block-46 (lines 360–360), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
Checkpoint requirements:
```

### Full target shown text

```text
Checkpoint requirements:
```

### Unified diff

```diff
No text difference.
```

## claim_ce0b03899dc057ddbc5fa02e070d7063

Source: `docs/architect/workspace-topology.md#unheaded-block-45`. Target: `docs/platform/system-architecture/architecture/workspace-topology.md#unheaded-block-47`.

Mechanical class: Unit-exact. Source digest: `03369e2b26f1efa8b4780a989d627330bc2b1b9e4871e6e514fada15a6ce9ebe`. Target digest: `03369e2b26f1efa8b4780a989d627330bc2b1b9e4871e6e514fada15a6ce9ebe`.

Full shown source SHA256: `03369e2b26f1efa8b4780a989d627330bc2b1b9e4871e6e514fada15a6ce9ebe`. Full shown target SHA256: `03369e2b26f1efa8b4780a989d627330bc2b1b9e4871e6e514fada15a6ce9ebe`.

### Proposed decision

```json
{
  "claimId": "claim_ce0b03899dc057ddbc5fa02e070d7063",
  "sourceUnitDigest": "03369e2b26f1efa8b4780a989d627330bc2b1b9e4871e6e514fada15a6ce9ebe",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology.md",
  "targetAnchor": "unheaded-block-47",
  "targetUnitDigest": "03369e2b26f1efa8b4780a989d627330bc2b1b9e4871e6e514fada15a6ce9ebe",
  "targetAncestry": [
    "Workspace Topology Architecture",
    "10. Open Decision"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/workspace-topology.md#unheaded-block-45 (lines 339–345) into docs/platform/system-architecture/architecture/workspace-topology.md#unheaded-block-47 (lines 362–368), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
- immutable segment files;
- sequence range;
- predecessor digest;
- segment digest;
- idempotent import rule;
- duplicate detection by event identity/content hash;
- no checkpoint segment may be rewritten in place.
```

### Full target shown text

```text
- immutable segment files;
- sequence range;
- predecessor digest;
- segment digest;
- idempotent import rule;
- duplicate detection by event identity/content hash;
- no checkpoint segment may be rewritten in place.
```

### Unified diff

```diff
No text difference.
```

## claim_68535041cafd06884dfaa35f9043b424

Source: `docs/architect/workspace-topology.md#unheaded-block-46`. Target: `docs/platform/system-architecture/architecture/workspace-topology.md#unheaded-block-48`.

Mechanical class: Unit-exact. Source digest: `637caeb7a71f38b59951b90ee9080eaf42e55ae78cbc9216ff7c9e7926759002`. Target digest: `637caeb7a71f38b59951b90ee9080eaf42e55ae78cbc9216ff7c9e7926759002`.

Full shown source SHA256: `637caeb7a71f38b59951b90ee9080eaf42e55ae78cbc9216ff7c9e7926759002`. Full shown target SHA256: `637caeb7a71f38b59951b90ee9080eaf42e55ae78cbc9216ff7c9e7926759002`.

### Proposed decision

```json
{
  "claimId": "claim_68535041cafd06884dfaa35f9043b424",
  "sourceUnitDigest": "637caeb7a71f38b59951b90ee9080eaf42e55ae78cbc9216ff7c9e7926759002",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology.md",
  "targetAnchor": "unheaded-block-48",
  "targetUnitDigest": "637caeb7a71f38b59951b90ee9080eaf42e55ae78cbc9216ff7c9e7926759002",
  "targetAncestry": [
    "Workspace Topology Architecture",
    "10. Open Decision"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/workspace-topology.md#unheaded-block-46 (lines 347–348) into docs/platform/system-architecture/architecture/workspace-topology.md#unheaded-block-48 (lines 370–371), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
This hybrid shape preserves audit/sync/backup through Git without making the
working tree the hot event store.
```

### Full target shown text

```text
This hybrid shape preserves audit/sync/backup through Git without making the
working tree the hot event store.
```

### Unified diff

```diff
No text difference.
```
