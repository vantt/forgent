# Bounded whole-system source review request

Content commit: `a8a10abc1a24218518a14764f68c8d86f4810f91`. Author session: `codex-session:37@2026-10-15`. Review mode requested: ordinary.

Shard: `plans/260925-documentation-authority-unification/ledger/decisions/s6-whole-system-workspace-topology-roadmap.json`. Part 1/1; entries: **48**. Sidecar: `review-request-261015-0450-whole-system-12.md.json`.

Read review-brief.md, owner-answers.md A28–A37, frozen whole-system map, constitution, vocabulary and shard schema. Apply A36: mechanically check every row (full digest recompute, anchor check, shard/pack equality); deeply read the reviewer-seeded sample plus every differing-digest row in both directions with its diff. Preserve conditions, qualifiers, dated status and complete payload; verify one owner and labelled additions. No approval is supplied here.

Step 6’s closing review is a **checkpoint review whose sensitivity pack the reviewer holds**. The author has not created, seen or selected that pack/key. Ordinary review and A36 sampling do not replace checkpoint sensitivity.

Ordinary verdict contract: `Reviewer: <independent identity>`, `Review mode: ordinary`, request/content/shard pins; one own note and full 64-hex shown-unit digests per row. Use ok/rework/hold. Consolidate parts into a complete report for the original shard before unchanged ordinary application; never edit decisions manually.

| Claim | Verdict | Note | Source digest | Target digest |
|---|---|---|---|---|

A36 mandatory differing-digest rows (3): `claim_c82b2c3d850baed4dbddab6d852a341f`, `claim_10fc1e33271d1736a8eabd0b522540ea`, `claim_a7edb0cf63356b89b074e3d31a3489cd`.

Absent-target rows (0): none.

This pack has 14 Weak-exact/Judgment rows; reviewer independently draws/records at least 10 by seed (>=15%, minimum 10, all if fewer), plus every differing pair listed above. Each verdict note says deep or mechanical. If >3% of deep-read rows need rework, deeply read the complete pack before reporting. Author selected no sample. Whole batch: 300 Unit-exact, 392 Weak-exact, 134 Judgment, all 826 pending; 123 mandatory differing pairs. The 79-row batch-wide lower bound does not replace each pack minimum.

Reverse review: the separate native candidate-unverified request/list covers the complete scoped population; it is not reset per sliced pack. Full shown text hashes below bind payload separately from native heading identity digests.

## claim_c82b2c3d850baed4dbddab6d852a341f

Source: `docs/architect/workspace-topology-roadmap.md#workspace-topology-roadmap`. Target: `docs/platform/system-architecture/architecture/workspace-topology-roadmap.md#workspace-topology-roadmap`.

Mechanical class: Judgment. Source digest: `82add3e586f3c6fa005798bd39ad1bce62b79072e3077956418aa16084a88453`. Target digest: `2fe32121b54b537707abefea3299f4872d2977dd7b02a6effe3ccb924a206cfb`.

Full shown source SHA256: `4f293fc14ad7d4dd4c557c2db823fd82c66e1acea4703ac420386ff7bab756de`. Full shown target SHA256: `95aae31c9de5ddb2a92fd0406151087a4e006ca2d26611b3b3d6d1c0cdbfd9e1`.

### Proposed decision

```json
{
  "claimId": "claim_c82b2c3d850baed4dbddab6d852a341f",
  "sourceUnitDigest": "82add3e586f3c6fa005798bd39ad1bce62b79072e3077956418aa16084a88453",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology-roadmap.md",
  "targetAnchor": "workspace-topology-roadmap",
  "targetUnitDigest": "2fe32121b54b537707abefea3299f4872d2977dd7b02a6effe3ccb924a206cfb",
  "targetAncestry": [],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Judgment: no target digest match. Carry the complete heading at docs/architect/workspace-topology-roadmap.md#workspace-topology-roadmap (lines 1–1) into docs/platform/system-architecture/architecture/workspace-topology-roadmap.md#workspace-topology-roadmap (lines 1–1), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. Digest differences come only from the recorded candidate header/frontmatter fence, heading-level shift or physical relative-link rebasing; full before/after units and line mapping are in authoring accounting. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
# Workspace Topology Roadmap

**Status:** Planning companion for [workspace-topology.md](workspace-topology.md).
**Date:** 2026-09-04.

This roadmap sequences the decisions and migration work required to make
workspace topology enforceable. It is not the contract; the contract is
[workspace-topology.md](workspace-topology.md). Evidence lives in
[workspace-topology-audit.md](workspace-topology-audit.md).
```

### Full target shown text

````text
# Workspace Topology Roadmap

```txt
Document type: Architecture
Audience: Human reviewer, architect, maintainer, agent
Purpose: Preserve the complete workspace-topology-roadmap.md source at its frozen-map candidate owner
Design status: Candidate
Implementation: Partial — inherited source qualifications; not independently truth-verified
Provenance: docs/architect/workspace-topology-roadmap.md at 69dd3ee7fd84bc5e93fe9c75d63622d4f5aa8539 (blob 17fefba5747976105b7797be9e99e7dfc9bed510)
Writer type: Agent carriage; independent review pending
Canonical for: Nothing until promotion; current source remains docs/architect/workspace-topology-roadmap.md
Use this when: Reviewing whole-system candidate carriage and placement
Do not use this for: Inferring implementation, promotion or superseding source authority
Last reviewed: Pending independent review
Related:
- docs/architect/workspace-topology-roadmap.md
- docs/platform/component-boundary.md
- docs/platform/architecture-map.md
Supersedes: None — candidate only
Superseded by: None
```

Added in candidate: migration metadata and physical link rebasing. Original source metadata, dates, design limits and historic claims below are provenance, not fresh review. Current truth is unverified; A28 requires sampled truth review at this checkpoint and full truth review at promotion.


**Status:** Planning companion for [workspace-topology.md](../../../architect/workspace-topology.md).
**Date:** 2026-09-04.

This roadmap sequences the decisions and migration work required to make
workspace topology enforceable. It is not the contract; the contract is
[workspace-topology.md](../../../architect/workspace-topology.md). Evidence lives in
[workspace-topology-audit.md](../../../architect/workspace-topology-audit.md).
````

### Unified diff

````diff
--- docs/architect/workspace-topology-roadmap.md#workspace-topology-roadmap
+++ docs/platform/system-architecture/architecture/workspace-topology-roadmap.md#workspace-topology-roadmap
@@ -1,9 +1,32 @@
 # Workspace Topology Roadmap
 
-**Status:** Planning companion for [workspace-topology.md](workspace-topology.md).
+```txt
+Document type: Architecture
+Audience: Human reviewer, architect, maintainer, agent
+Purpose: Preserve the complete workspace-topology-roadmap.md source at its frozen-map candidate owner
+Design status: Candidate
+Implementation: Partial — inherited source qualifications; not independently truth-verified
+Provenance: docs/architect/workspace-topology-roadmap.md at 69dd3ee7fd84bc5e93fe9c75d63622d4f5aa8539 (blob 17fefba5747976105b7797be9e99e7dfc9bed510)
+Writer type: Agent carriage; independent review pending
+Canonical for: Nothing until promotion; current source remains docs/architect/workspace-topology-roadmap.md
+Use this when: Reviewing whole-system candidate carriage and placement
+Do not use this for: Inferring implementation, promotion or superseding source authority
+Last reviewed: Pending independent review
+Related:
+- docs/architect/workspace-topology-roadmap.md
+- docs/platform/component-boundary.md
+- docs/platform/architecture-map.md
+Supersedes: None — candidate only
+Superseded by: None
+```
+
+Added in candidate: migration metadata and physical link rebasing. Original source metadata, dates, design limits and historic claims below are provenance, not fresh review. Current truth is unverified; A28 requires sampled truth review at this checkpoint and full truth review at promotion.
+
+
+**Status:** Planning companion for [workspace-topology.md](../../../architect/workspace-topology.md).
 **Date:** 2026-09-04.
 
 This roadmap sequences the decisions and migration work required to make
 workspace topology enforceable. It is not the contract; the contract is
-[workspace-topology.md](workspace-topology.md). Evidence lives in
-[workspace-topology-audit.md](workspace-topology-audit.md).
+[workspace-topology.md](../../../architect/workspace-topology.md). Evidence lives in
+[workspace-topology-audit.md](../../../architect/workspace-topology-audit.md).

````

## claim_10fc1e33271d1736a8eabd0b522540ea

Source: `docs/architect/workspace-topology-roadmap.md#unheaded-block-1`. Target: `docs/platform/system-architecture/architecture/workspace-topology-roadmap.md#unheaded-block-3`.

Mechanical class: Judgment. Source digest: `2ed32d04eb7641b5d876a03ee078dbd26abc18b9550430032a24e6d8ea7dd850`. Target digest: `0daf195fbb02923ab95178975bc8982605f905514c368b844ca892367958244f`.

Full shown source SHA256: `2ed32d04eb7641b5d876a03ee078dbd26abc18b9550430032a24e6d8ea7dd850`. Full shown target SHA256: `0daf195fbb02923ab95178975bc8982605f905514c368b844ca892367958244f`.

### Proposed decision

```json
{
  "claimId": "claim_10fc1e33271d1736a8eabd0b522540ea",
  "sourceUnitDigest": "2ed32d04eb7641b5d876a03ee078dbd26abc18b9550430032a24e6d8ea7dd850",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology-roadmap.md",
  "targetAnchor": "unheaded-block-3",
  "targetUnitDigest": "0daf195fbb02923ab95178975bc8982605f905514c368b844ca892367958244f",
  "targetAncestry": [
    "Workspace Topology Roadmap"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Judgment: no target digest match. Carry the complete unheaded-block at docs/architect/workspace-topology-roadmap.md#unheaded-block-1 (lines 3–4) into docs/platform/system-architecture/architecture/workspace-topology-roadmap.md#unheaded-block-3 (lines 26–27), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. Digest differences come only from the recorded candidate header/frontmatter fence, heading-level shift or physical relative-link rebasing; full before/after units and line mapping are in authoring accounting. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
**Status:** Planning companion for [workspace-topology.md](workspace-topology.md).
**Date:** 2026-09-04.
```

### Full target shown text

```text
**Status:** Planning companion for [workspace-topology.md](../../../architect/workspace-topology.md).
**Date:** 2026-09-04.
```

### Unified diff

```diff
--- docs/architect/workspace-topology-roadmap.md#unheaded-block-1
+++ docs/platform/system-architecture/architecture/workspace-topology-roadmap.md#unheaded-block-3
@@ -1,2 +1,2 @@
-**Status:** Planning companion for [workspace-topology.md](workspace-topology.md).
+**Status:** Planning companion for [workspace-topology.md](../../../architect/workspace-topology.md).
 **Date:** 2026-09-04.

```

## claim_a7edb0cf63356b89b074e3d31a3489cd

Source: `docs/architect/workspace-topology-roadmap.md#unheaded-block-2`. Target: `docs/platform/system-architecture/architecture/workspace-topology-roadmap.md#unheaded-block-4`.

Mechanical class: Judgment. Source digest: `84d5b847d4a094c22300c93d5247cf865df89f2fa2ea243a80cb76f9c9e19e1e`. Target digest: `aeb8904776ec5fd7cecd365edb616e25e63b22ea627cceaeafc8c4f35db5c913`.

Full shown source SHA256: `84d5b847d4a094c22300c93d5247cf865df89f2fa2ea243a80cb76f9c9e19e1e`. Full shown target SHA256: `aeb8904776ec5fd7cecd365edb616e25e63b22ea627cceaeafc8c4f35db5c913`.

### Proposed decision

```json
{
  "claimId": "claim_a7edb0cf63356b89b074e3d31a3489cd",
  "sourceUnitDigest": "84d5b847d4a094c22300c93d5247cf865df89f2fa2ea243a80cb76f9c9e19e1e",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology-roadmap.md",
  "targetAnchor": "unheaded-block-4",
  "targetUnitDigest": "aeb8904776ec5fd7cecd365edb616e25e63b22ea627cceaeafc8c4f35db5c913",
  "targetAncestry": [
    "Workspace Topology Roadmap"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Judgment: no target digest match. Carry the complete unheaded-block at docs/architect/workspace-topology-roadmap.md#unheaded-block-2 (lines 6–9) into docs/platform/system-architecture/architecture/workspace-topology-roadmap.md#unheaded-block-4 (lines 29–32), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. Digest differences come only from the recorded candidate header/frontmatter fence, heading-level shift or physical relative-link rebasing; full before/after units and line mapping are in authoring accounting. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
This roadmap sequences the decisions and migration work required to make
workspace topology enforceable. It is not the contract; the contract is
[workspace-topology.md](workspace-topology.md). Evidence lives in
[workspace-topology-audit.md](workspace-topology-audit.md).
```

### Full target shown text

```text
This roadmap sequences the decisions and migration work required to make
workspace topology enforceable. It is not the contract; the contract is
[workspace-topology.md](../../../architect/workspace-topology.md). Evidence lives in
[workspace-topology-audit.md](../../../architect/workspace-topology-audit.md).
```

### Unified diff

```diff
--- docs/architect/workspace-topology-roadmap.md#unheaded-block-2
+++ docs/platform/system-architecture/architecture/workspace-topology-roadmap.md#unheaded-block-4
@@ -1,4 +1,4 @@
 This roadmap sequences the decisions and migration work required to make
 workspace topology enforceable. It is not the contract; the contract is
-[workspace-topology.md](workspace-topology.md). Evidence lives in
-[workspace-topology-audit.md](workspace-topology-audit.md).
+[workspace-topology.md](../../../architect/workspace-topology.md). Evidence lives in
+[workspace-topology-audit.md](../../../architect/workspace-topology-audit.md).

```

## claim_fcec8006b059b9aa10718d8ba3e460d4

Source: `docs/architect/workspace-topology-roadmap.md#hard-gates-before-distribution-activation-planning`. Target: `docs/platform/system-architecture/architecture/workspace-topology-roadmap.md#hard-gates-before-distribution-activation-planning`.

Mechanical class: Unit-exact. Source digest: `0b95a7f938b79055e64c2b2c17db7d894c3ac03596edc8f45eddd84db73e7796`. Target digest: `0b95a7f938b79055e64c2b2c17db7d894c3ac03596edc8f45eddd84db73e7796`.

Full shown source SHA256: `3309244bbb97e0d10b8ef66247c68e9bc04ce5b61e51ab5129d8cd8bcc27c7ce`. Full shown target SHA256: `3309244bbb97e0d10b8ef66247c68e9bc04ce5b61e51ab5129d8cd8bcc27c7ce`.

### Proposed decision

```json
{
  "claimId": "claim_fcec8006b059b9aa10718d8ba3e460d4",
  "sourceUnitDigest": "0b95a7f938b79055e64c2b2c17db7d894c3ac03596edc8f45eddd84db73e7796",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology-roadmap.md",
  "targetAnchor": "hard-gates-before-distribution-activation-planning",
  "targetUnitDigest": "0b95a7f938b79055e64c2b2c17db7d894c3ac03596edc8f45eddd84db73e7796",
  "targetAncestry": [
    "Workspace Topology Roadmap"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete heading at docs/architect/workspace-topology-roadmap.md#hard-gates-before-distribution-activation-planning (lines 11–11) into docs/platform/system-architecture/architecture/workspace-topology-roadmap.md#hard-gates-before-distribution-activation-planning (lines 34–34), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
## Hard Gates Before Distribution Activation Planning

These must be settled before `fgctl` activation and Rust `fgos` migration are
planned in detail.

1. Durable work-history placement.
2. Config/workspace policy scope.
3. Runtime coordination namespace.
4. Activation binding cardinality.
5. Projection ownership for skills, agents, prose, hooks, and managed files.
```

### Full target shown text

```text
## Hard Gates Before Distribution Activation Planning

These must be settled before `fgctl` activation and Rust `fgos` migration are
planned in detail.

1. Durable work-history placement.
2. Config/workspace policy scope.
3. Runtime coordination namespace.
4. Activation binding cardinality.
5. Projection ownership for skills, agents, prose, hooks, and managed files.
```

### Unified diff

```diff
No text difference.
```

## claim_dcd6a3d339fd03c04fef73a85b620a79

Source: `docs/architect/workspace-topology-roadmap.md#unheaded-block-3`. Target: `docs/platform/system-architecture/architecture/workspace-topology-roadmap.md#unheaded-block-5`.

Mechanical class: Unit-exact. Source digest: `e5e3d0806936072d8bf3508b1f159b413b376a2a2a5d957706886a6586214224`. Target digest: `e5e3d0806936072d8bf3508b1f159b413b376a2a2a5d957706886a6586214224`.

Full shown source SHA256: `e5e3d0806936072d8bf3508b1f159b413b376a2a2a5d957706886a6586214224`. Full shown target SHA256: `e5e3d0806936072d8bf3508b1f159b413b376a2a2a5d957706886a6586214224`.

### Proposed decision

```json
{
  "claimId": "claim_dcd6a3d339fd03c04fef73a85b620a79",
  "sourceUnitDigest": "e5e3d0806936072d8bf3508b1f159b413b376a2a2a5d957706886a6586214224",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology-roadmap.md",
  "targetAnchor": "unheaded-block-5",
  "targetUnitDigest": "e5e3d0806936072d8bf3508b1f159b413b376a2a2a5d957706886a6586214224",
  "targetAncestry": [
    "Workspace Topology Roadmap",
    "Hard Gates Before Distribution Activation Planning"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/workspace-topology-roadmap.md#unheaded-block-3 (lines 13–14) into docs/platform/system-architecture/architecture/workspace-topology-roadmap.md#unheaded-block-5 (lines 36–37), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
These must be settled before `fgctl` activation and Rust `fgos` migration are
planned in detail.
```

### Full target shown text

```text
These must be settled before `fgctl` activation and Rust `fgos` migration are
planned in detail.
```

### Unified diff

```diff
No text difference.
```

## claim_a684af1acf4f87dabf4800a17a805953

Source: `docs/architect/workspace-topology-roadmap.md#unheaded-block-4`. Target: `docs/platform/system-architecture/architecture/workspace-topology-roadmap.md#unheaded-block-6`.

Mechanical class: Unit-exact. Source digest: `9723a1e8002f2e5dea1a5b35d7658f065f5896999a1591167775ce1cbc98e67e`. Target digest: `9723a1e8002f2e5dea1a5b35d7658f065f5896999a1591167775ce1cbc98e67e`.

Full shown source SHA256: `9723a1e8002f2e5dea1a5b35d7658f065f5896999a1591167775ce1cbc98e67e`. Full shown target SHA256: `9723a1e8002f2e5dea1a5b35d7658f065f5896999a1591167775ce1cbc98e67e`.

### Proposed decision

```json
{
  "claimId": "claim_a684af1acf4f87dabf4800a17a805953",
  "sourceUnitDigest": "9723a1e8002f2e5dea1a5b35d7658f065f5896999a1591167775ce1cbc98e67e",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology-roadmap.md",
  "targetAnchor": "unheaded-block-6",
  "targetUnitDigest": "9723a1e8002f2e5dea1a5b35d7658f065f5896999a1591167775ce1cbc98e67e",
  "targetAncestry": [
    "Workspace Topology Roadmap",
    "Hard Gates Before Distribution Activation Planning"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/workspace-topology-roadmap.md#unheaded-block-4 (lines 16–20) into docs/platform/system-architecture/architecture/workspace-topology-roadmap.md#unheaded-block-6 (lines 39–43), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
1. Durable work-history placement.
2. Config/workspace policy scope.
3. Runtime coordination namespace.
4. Activation binding cardinality.
5. Projection ownership for skills, agents, prose, hooks, and managed files.
```

### Full target shown text

```text
1. Durable work-history placement.
2. Config/workspace policy scope.
3. Runtime coordination namespace.
4. Activation binding cardinality.
5. Projection ownership for skills, agents, prose, hooks, and managed files.
```

### Unified diff

```diff
No text difference.
```

## claim_5c0bc5aee9656b9a4b29b3a4304d2697

Source: `docs/architect/workspace-topology-roadmap.md#recommended-decisions`. Target: `docs/platform/system-architecture/architecture/workspace-topology-roadmap.md#recommended-decisions`.

Mechanical class: Weak-exact. Source digest: `47796cea4a40c31ececf158aeea410b54dbed3d0e6b235a59396d626c862cffa`. Target digest: `47796cea4a40c31ececf158aeea410b54dbed3d0e6b235a59396d626c862cffa`.

Full shown source SHA256: `37172cc17c71b1f237f0bd2481b76c0af31420b0cbb59ac5de47371b0a5453ff`. Full shown target SHA256: `37172cc17c71b1f237f0bd2481b76c0af31420b0cbb59ac5de47371b0a5453ff`.

### Proposed decision

```json
{
  "claimId": "claim_5c0bc5aee9656b9a4b29b3a4304d2697",
  "sourceUnitDigest": "47796cea4a40c31ececf158aeea410b54dbed3d0e6b235a59396d626c862cffa",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology-roadmap.md",
  "targetAnchor": "recommended-decisions",
  "targetUnitDigest": "47796cea4a40c31ececf158aeea410b54dbed3d0e6b235a59396d626c862cffa",
  "targetAncestry": [
    "Workspace Topology Roadmap"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. Carry the complete heading at docs/architect/workspace-topology-roadmap.md#recommended-decisions (lines 22–22) into docs/platform/system-architecture/architecture/workspace-topology-roadmap.md#recommended-decisions (lines 45–45), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
## Recommended Decisions
```

### Full target shown text

```text
## Recommended Decisions
```

### Unified diff

```diff
No text difference.
```

## claim_7e554252ea63ae4f31b82ef898c26f06

Source: `docs/architect/workspace-topology-roadmap.md#d1-hot-work-history-leaves-the-tracked-working-tree`. Target: `docs/platform/system-architecture/architecture/workspace-topology-roadmap.md#d1-hot-work-history-leaves-the-tracked-working-tree`.

Mechanical class: Unit-exact. Source digest: `67e12f0411ec12473b7e341adbe49ad76bdbf2e9f043087f49fa055dba6a8640`. Target digest: `67e12f0411ec12473b7e341adbe49ad76bdbf2e9f043087f49fa055dba6a8640`.

Full shown source SHA256: `f6749561365339f36496ca4bd980aa4fd813581c907d56066396f6f7a9e253e1`. Full shown target SHA256: `f6749561365339f36496ca4bd980aa4fd813581c907d56066396f6f7a9e253e1`.

### Proposed decision

```json
{
  "claimId": "claim_7e554252ea63ae4f31b82ef898c26f06",
  "sourceUnitDigest": "67e12f0411ec12473b7e341adbe49ad76bdbf2e9f043087f49fa055dba6a8640",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology-roadmap.md",
  "targetAnchor": "d1-hot-work-history-leaves-the-tracked-working-tree",
  "targetUnitDigest": "67e12f0411ec12473b7e341adbe49ad76bdbf2e9f043087f49fa055dba6a8640",
  "targetAncestry": [
    "Workspace Topology Roadmap",
    "Recommended Decisions"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete heading at docs/architect/workspace-topology-roadmap.md#d1-hot-work-history-leaves-the-tracked-working-tree (lines 24–24) into docs/platform/system-architecture/architecture/workspace-topology-roadmap.md#d1-hot-work-history-leaves-the-tracked-working-tree (lines 47–47), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

````text
### D1. Hot Work History Leaves The Tracked Working Tree

Recommended shape:

```txt
hot event writes -> <main-checkout-root>/.fgos/local/work-state/<workStateId>/active-events/
sealed checkpoints -> <workspace-root>/.fgos/history/checkpoints/
```

Reason:

- hot events should not dirty main;
- fgOS does not write arbitrary state into Git's private `.git` structure;
- Git remains backup/sync/audit through immutable checkpoint segments;
- fresh clone can import checkpoints and create local hot state;
- multi-machine reconciliation can be explicit and idempotent.

Checkpoint segment requirements:

- immutable file;
- sequence range;
- predecessor digest;
- segment digest;
- event identity/content hash;
- idempotent import;
- no rewrite in place.
````

### Full target shown text

````text
### D1. Hot Work History Leaves The Tracked Working Tree

Recommended shape:

```txt
hot event writes -> <main-checkout-root>/.fgos/local/work-state/<workStateId>/active-events/
sealed checkpoints -> <workspace-root>/.fgos/history/checkpoints/
```

Reason:

- hot events should not dirty main;
- fgOS does not write arbitrary state into Git's private `.git` structure;
- Git remains backup/sync/audit through immutable checkpoint segments;
- fresh clone can import checkpoints and create local hot state;
- multi-machine reconciliation can be explicit and idempotent.

Checkpoint segment requirements:

- immutable file;
- sequence range;
- predecessor digest;
- segment digest;
- event identity/content hash;
- idempotent import;
- no rewrite in place.
````

### Unified diff

```diff
No text difference.
```

## claim_a7cfeaa8f828a7e96b18790da95029e5

Source: `docs/architect/workspace-topology-roadmap.md#unheaded-block-5`. Target: `docs/platform/system-architecture/architecture/workspace-topology-roadmap.md#unheaded-block-7`.

Mechanical class: Unit-exact. Source digest: `cd259d3f048d94c88397b75c86b9ee8b5b2a3edddbfc5cd92c9a640f524483d8`. Target digest: `cd259d3f048d94c88397b75c86b9ee8b5b2a3edddbfc5cd92c9a640f524483d8`.

Full shown source SHA256: `cd259d3f048d94c88397b75c86b9ee8b5b2a3edddbfc5cd92c9a640f524483d8`. Full shown target SHA256: `cd259d3f048d94c88397b75c86b9ee8b5b2a3edddbfc5cd92c9a640f524483d8`.

### Proposed decision

```json
{
  "claimId": "claim_a7cfeaa8f828a7e96b18790da95029e5",
  "sourceUnitDigest": "cd259d3f048d94c88397b75c86b9ee8b5b2a3edddbfc5cd92c9a640f524483d8",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology-roadmap.md",
  "targetAnchor": "unheaded-block-7",
  "targetUnitDigest": "cd259d3f048d94c88397b75c86b9ee8b5b2a3edddbfc5cd92c9a640f524483d8",
  "targetAncestry": [
    "Workspace Topology Roadmap",
    "Recommended Decisions",
    "D1. Hot Work History Leaves The Tracked Working Tree"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/workspace-topology-roadmap.md#unheaded-block-5 (lines 26–31) into docs/platform/system-architecture/architecture/workspace-topology-roadmap.md#unheaded-block-7 (lines 49–54), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

````text
Recommended shape:

```txt
hot event writes -> <main-checkout-root>/.fgos/local/work-state/<workStateId>/active-events/
sealed checkpoints -> <workspace-root>/.fgos/history/checkpoints/
```
````

### Full target shown text

````text
Recommended shape:

```txt
hot event writes -> <main-checkout-root>/.fgos/local/work-state/<workStateId>/active-events/
sealed checkpoints -> <workspace-root>/.fgos/history/checkpoints/
```
````

### Unified diff

```diff
No text difference.
```

## claim_10a0fa9e9622a1b1771c643006a5446a

Source: `docs/architect/workspace-topology-roadmap.md#unheaded-block-6`. Target: `docs/platform/system-architecture/architecture/workspace-topology-roadmap.md#unheaded-block-8`.

Mechanical class: Unit-exact. Source digest: `927728157fc62558e72cd0a0fefd14f3cc13c2ee2278ca878dafbc40d30b5f3f`. Target digest: `927728157fc62558e72cd0a0fefd14f3cc13c2ee2278ca878dafbc40d30b5f3f`.

Full shown source SHA256: `927728157fc62558e72cd0a0fefd14f3cc13c2ee2278ca878dafbc40d30b5f3f`. Full shown target SHA256: `927728157fc62558e72cd0a0fefd14f3cc13c2ee2278ca878dafbc40d30b5f3f`.

### Proposed decision

```json
{
  "claimId": "claim_10a0fa9e9622a1b1771c643006a5446a",
  "sourceUnitDigest": "927728157fc62558e72cd0a0fefd14f3cc13c2ee2278ca878dafbc40d30b5f3f",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology-roadmap.md",
  "targetAnchor": "unheaded-block-8",
  "targetUnitDigest": "927728157fc62558e72cd0a0fefd14f3cc13c2ee2278ca878dafbc40d30b5f3f",
  "targetAncestry": [
    "Workspace Topology Roadmap",
    "Recommended Decisions",
    "D1. Hot Work History Leaves The Tracked Working Tree"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/workspace-topology-roadmap.md#unheaded-block-6 (lines 33–39) into docs/platform/system-architecture/architecture/workspace-topology-roadmap.md#unheaded-block-8 (lines 56–62), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
Reason:

- hot events should not dirty main;
- fgOS does not write arbitrary state into Git's private `.git` structure;
- Git remains backup/sync/audit through immutable checkpoint segments;
- fresh clone can import checkpoints and create local hot state;
- multi-machine reconciliation can be explicit and idempotent.
```

### Full target shown text

```text
Reason:

- hot events should not dirty main;
- fgOS does not write arbitrary state into Git's private `.git` structure;
- Git remains backup/sync/audit through immutable checkpoint segments;
- fresh clone can import checkpoints and create local hot state;
- multi-machine reconciliation can be explicit and idempotent.
```

### Unified diff

```diff
No text difference.
```

## claim_eb66de2e1574509b34c3a9cdbe3d9d7f

Source: `docs/architect/workspace-topology-roadmap.md#unheaded-block-7`. Target: `docs/platform/system-architecture/architecture/workspace-topology-roadmap.md#unheaded-block-9`.

Mechanical class: Weak-exact. Source digest: `a5c60f4d37ed273d3328fa649e7451489baefdaf7211ae07c5ad3b23cfd08c56`. Target digest: `a5c60f4d37ed273d3328fa649e7451489baefdaf7211ae07c5ad3b23cfd08c56`.

Full shown source SHA256: `a5c60f4d37ed273d3328fa649e7451489baefdaf7211ae07c5ad3b23cfd08c56`. Full shown target SHA256: `a5c60f4d37ed273d3328fa649e7451489baefdaf7211ae07c5ad3b23cfd08c56`.

### Proposed decision

```json
{
  "claimId": "claim_eb66de2e1574509b34c3a9cdbe3d9d7f",
  "sourceUnitDigest": "a5c60f4d37ed273d3328fa649e7451489baefdaf7211ae07c5ad3b23cfd08c56",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology-roadmap.md",
  "targetAnchor": "unheaded-block-9",
  "targetUnitDigest": "a5c60f4d37ed273d3328fa649e7451489baefdaf7211ae07c5ad3b23cfd08c56",
  "targetAncestry": [
    "Workspace Topology Roadmap",
    "Recommended Decisions",
    "D1. Hot Work History Leaves The Tracked Working Tree"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. Carry the complete unheaded-block at docs/architect/workspace-topology-roadmap.md#unheaded-block-7 (lines 41–41) into docs/platform/system-architecture/architecture/workspace-topology-roadmap.md#unheaded-block-9 (lines 64–64), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
Checkpoint segment requirements:
```

### Full target shown text

```text
Checkpoint segment requirements:
```

### Unified diff

```diff
No text difference.
```

## claim_1c5f6ecf96defc1cda66a21c60ae7b28

Source: `docs/architect/workspace-topology-roadmap.md#unheaded-block-8`. Target: `docs/platform/system-architecture/architecture/workspace-topology-roadmap.md#unheaded-block-10`.

Mechanical class: Unit-exact. Source digest: `64d21cbdbe3ad2a31b22e9e79250fe6176af8417a0466e668bc6295a15fea95d`. Target digest: `64d21cbdbe3ad2a31b22e9e79250fe6176af8417a0466e668bc6295a15fea95d`.

Full shown source SHA256: `64d21cbdbe3ad2a31b22e9e79250fe6176af8417a0466e668bc6295a15fea95d`. Full shown target SHA256: `64d21cbdbe3ad2a31b22e9e79250fe6176af8417a0466e668bc6295a15fea95d`.

### Proposed decision

```json
{
  "claimId": "claim_1c5f6ecf96defc1cda66a21c60ae7b28",
  "sourceUnitDigest": "64d21cbdbe3ad2a31b22e9e79250fe6176af8417a0466e668bc6295a15fea95d",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology-roadmap.md",
  "targetAnchor": "unheaded-block-10",
  "targetUnitDigest": "64d21cbdbe3ad2a31b22e9e79250fe6176af8417a0466e668bc6295a15fea95d",
  "targetAncestry": [
    "Workspace Topology Roadmap",
    "Recommended Decisions",
    "D1. Hot Work History Leaves The Tracked Working Tree"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/workspace-topology-roadmap.md#unheaded-block-8 (lines 43–49) into docs/platform/system-architecture/architecture/workspace-topology-roadmap.md#unheaded-block-10 (lines 66–72), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
- immutable file;
- sequence range;
- predecessor digest;
- segment digest;
- event identity/content hash;
- idempotent import;
- no rewrite in place.
```

### Full target shown text

```text
- immutable file;
- sequence range;
- predecessor digest;
- segment digest;
- event identity/content hash;
- idempotent import;
- no rewrite in place.
```

### Unified diff

```diff
No text difference.
```

## claim_34088b7ac9057c90bc2bcd2e5cb5e61b

Source: `docs/architect/workspace-topology-roadmap.md#d2-workspace-policy-is-branchworkspace-scoped`. Target: `docs/platform/system-architecture/architecture/workspace-topology-roadmap.md#d2-workspace-policy-is-branchworkspace-scoped`.

Mechanical class: Unit-exact. Source digest: `b39b2b28a9d9977b61df0460873ed1b0ff9d38db2a94aee8bd93ef5d881c8457`. Target digest: `b39b2b28a9d9977b61df0460873ed1b0ff9d38db2a94aee8bd93ef5d881c8457`.

Full shown source SHA256: `ecd3fbc436e09166eb01bdd3c874e4aa443f37f0a5b1fbe580842cd3b47e338f`. Full shown target SHA256: `ecd3fbc436e09166eb01bdd3c874e4aa443f37f0a5b1fbe580842cd3b47e338f`.

### Proposed decision

```json
{
  "claimId": "claim_34088b7ac9057c90bc2bcd2e5cb5e61b",
  "sourceUnitDigest": "b39b2b28a9d9977b61df0460873ed1b0ff9d38db2a94aee8bd93ef5d881c8457",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology-roadmap.md",
  "targetAnchor": "d2-workspace-policy-is-branchworkspace-scoped",
  "targetUnitDigest": "b39b2b28a9d9977b61df0460873ed1b0ff9d38db2a94aee8bd93ef5d881c8457",
  "targetAncestry": [
    "Workspace Topology Roadmap",
    "Recommended Decisions"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete heading at docs/architect/workspace-topology-roadmap.md#d2-workspace-policy-is-branchworkspace-scoped (lines 51–51) into docs/platform/system-architecture/architecture/workspace-topology-roadmap.md#d2-workspace-policy-is-branchworkspace-scoped (lines 74–74), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
### D2. Workspace Policy Is Branch/Workspace Scoped

`.fgos/config.json`, `.fgos/distribution.json`, and domain policy are
`workspacePolicy`.

Rules:

- local execution reads policy from the current `workspaceId`;
- work-state/machine settings must not hide inside branch policy unless the key
  declares that layer;
- a worker can test policy changes before merge;
- repair must not silently retarget from worker to main.
```

### Full target shown text

```text
### D2. Workspace Policy Is Branch/Workspace Scoped

`.fgos/config.json`, `.fgos/distribution.json`, and domain policy are
`workspacePolicy`.

Rules:

- local execution reads policy from the current `workspaceId`;
- work-state/machine settings must not hide inside branch policy unless the key
  declares that layer;
- a worker can test policy changes before merge;
- repair must not silently retarget from worker to main.
```

### Unified diff

```diff
No text difference.
```

## claim_91091a393a7c1764343c15b22741c4e7

Source: `docs/architect/workspace-topology-roadmap.md#unheaded-block-9`. Target: `docs/platform/system-architecture/architecture/workspace-topology-roadmap.md#unheaded-block-11`.

Mechanical class: Unit-exact. Source digest: `2a2d95d7f67958e73baa6a1bbb099a2a632a1f97e1841377746f1b4f10fe48dd`. Target digest: `2a2d95d7f67958e73baa6a1bbb099a2a632a1f97e1841377746f1b4f10fe48dd`.

Full shown source SHA256: `2a2d95d7f67958e73baa6a1bbb099a2a632a1f97e1841377746f1b4f10fe48dd`. Full shown target SHA256: `2a2d95d7f67958e73baa6a1bbb099a2a632a1f97e1841377746f1b4f10fe48dd`.

### Proposed decision

```json
{
  "claimId": "claim_91091a393a7c1764343c15b22741c4e7",
  "sourceUnitDigest": "2a2d95d7f67958e73baa6a1bbb099a2a632a1f97e1841377746f1b4f10fe48dd",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology-roadmap.md",
  "targetAnchor": "unheaded-block-11",
  "targetUnitDigest": "2a2d95d7f67958e73baa6a1bbb099a2a632a1f97e1841377746f1b4f10fe48dd",
  "targetAncestry": [
    "Workspace Topology Roadmap",
    "Recommended Decisions",
    "D2. Workspace Policy Is Branch/Workspace Scoped"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/workspace-topology-roadmap.md#unheaded-block-9 (lines 53–54) into docs/platform/system-architecture/architecture/workspace-topology-roadmap.md#unheaded-block-11 (lines 76–77), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
`.fgos/config.json`, `.fgos/distribution.json`, and domain policy are
`workspacePolicy`.
```

### Full target shown text

```text
`.fgos/config.json`, `.fgos/distribution.json`, and domain policy are
`workspacePolicy`.
```

### Unified diff

```diff
No text difference.
```

## claim_e30fc754ade3184b4f7fca5d2a467d45

Source: `docs/architect/workspace-topology-roadmap.md#unheaded-block-10`. Target: `docs/platform/system-architecture/architecture/workspace-topology-roadmap.md#unheaded-block-12`.

Mechanical class: Unit-exact. Source digest: `0b687b8f7697d6533d6958d48b840a93007d8df15bcde2c850b13868decd7ff6`. Target digest: `0b687b8f7697d6533d6958d48b840a93007d8df15bcde2c850b13868decd7ff6`.

Full shown source SHA256: `0b687b8f7697d6533d6958d48b840a93007d8df15bcde2c850b13868decd7ff6`. Full shown target SHA256: `0b687b8f7697d6533d6958d48b840a93007d8df15bcde2c850b13868decd7ff6`.

### Proposed decision

```json
{
  "claimId": "claim_e30fc754ade3184b4f7fca5d2a467d45",
  "sourceUnitDigest": "0b687b8f7697d6533d6958d48b840a93007d8df15bcde2c850b13868decd7ff6",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology-roadmap.md",
  "targetAnchor": "unheaded-block-12",
  "targetUnitDigest": "0b687b8f7697d6533d6958d48b840a93007d8df15bcde2c850b13868decd7ff6",
  "targetAncestry": [
    "Workspace Topology Roadmap",
    "Recommended Decisions",
    "D2. Workspace Policy Is Branch/Workspace Scoped"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/workspace-topology-roadmap.md#unheaded-block-10 (lines 56–62) into docs/platform/system-architecture/architecture/workspace-topology-roadmap.md#unheaded-block-12 (lines 79–85), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
Rules:

- local execution reads policy from the current `workspaceId`;
- work-state/machine settings must not hide inside branch policy unless the key
  declares that layer;
- a worker can test policy changes before merge;
- repair must not silently retarget from worker to main.
```

### Full target shown text

```text
Rules:

- local execution reads policy from the current `workspaceId`;
- work-state/machine settings must not hide inside branch policy unless the key
  declares that layer;
- a worker can test policy changes before merge;
- repair must not silently retarget from worker to main.
```

### Unified diff

```diff
No text difference.
```

## claim_e649baa7403c946f6f41f51aca7e2f0c

Source: `docs/architect/workspace-topology-roadmap.md#d3-runtime-coordination-gets-its-own-root`. Target: `docs/platform/system-architecture/architecture/workspace-topology-roadmap.md#d3-runtime-coordination-gets-its-own-root`.

Mechanical class: Unit-exact. Source digest: `2b5e6488a22ff4e5ac0da3d77466dd36432d5b6d4a47434cbe53275a0d681a90`. Target digest: `2b5e6488a22ff4e5ac0da3d77466dd36432d5b6d4a47434cbe53275a0d681a90`.

Full shown source SHA256: `2e11958f4a617fdb0ca3bf246019cb35c8490f534e40771cead6d32386eb0baf`. Full shown target SHA256: `2e11958f4a617fdb0ca3bf246019cb35c8490f534e40771cead6d32386eb0baf`.

### Proposed decision

```json
{
  "claimId": "claim_e649baa7403c946f6f41f51aca7e2f0c",
  "sourceUnitDigest": "2b5e6488a22ff4e5ac0da3d77466dd36432d5b6d4a47434cbe53275a0d681a90",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology-roadmap.md",
  "targetAnchor": "d3-runtime-coordination-gets-its-own-root",
  "targetUnitDigest": "2b5e6488a22ff4e5ac0da3d77466dd36432d5b6d4a47434cbe53275a0d681a90",
  "targetAncestry": [
    "Workspace Topology Roadmap",
    "Recommended Decisions"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete heading at docs/architect/workspace-topology-roadmap.md#d3-runtime-coordination-gets-its-own-root (lines 64–64) into docs/platform/system-architecture/architecture/workspace-topology-roadmap.md#d3-runtime-coordination-gets-its-own-root (lines 87–87), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
### D3. Runtime Coordination Gets Its Own Root

Claims, sessions, assignment claims, locks, and runtime leases move conceptually
under `runtimeCoordinationRoot`, not packaging's runtime payload namespace.

Rules:

- coordination records declare `workStateId`;
- workspace-specific coordination also declares `workspaceId`;
- liveness records use fencing token, boot/process identity, heartbeat, and
  explicit completion-unknown recovery.
```

### Full target shown text

```text
### D3. Runtime Coordination Gets Its Own Root

Claims, sessions, assignment claims, locks, and runtime leases move conceptually
under `runtimeCoordinationRoot`, not packaging's runtime payload namespace.

Rules:

- coordination records declare `workStateId`;
- workspace-specific coordination also declares `workspaceId`;
- liveness records use fencing token, boot/process identity, heartbeat, and
  explicit completion-unknown recovery.
```

### Unified diff

```diff
No text difference.
```

## claim_7143cb204cf48a050b45e5c47387affb

Source: `docs/architect/workspace-topology-roadmap.md#unheaded-block-11`. Target: `docs/platform/system-architecture/architecture/workspace-topology-roadmap.md#unheaded-block-13`.

Mechanical class: Unit-exact. Source digest: `619a4459d7e52c24d9ff59098b9b2ba8e4cbf6d52f91c7a69e2054257e3a7dcc`. Target digest: `619a4459d7e52c24d9ff59098b9b2ba8e4cbf6d52f91c7a69e2054257e3a7dcc`.

Full shown source SHA256: `619a4459d7e52c24d9ff59098b9b2ba8e4cbf6d52f91c7a69e2054257e3a7dcc`. Full shown target SHA256: `619a4459d7e52c24d9ff59098b9b2ba8e4cbf6d52f91c7a69e2054257e3a7dcc`.

### Proposed decision

```json
{
  "claimId": "claim_7143cb204cf48a050b45e5c47387affb",
  "sourceUnitDigest": "619a4459d7e52c24d9ff59098b9b2ba8e4cbf6d52f91c7a69e2054257e3a7dcc",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology-roadmap.md",
  "targetAnchor": "unheaded-block-13",
  "targetUnitDigest": "619a4459d7e52c24d9ff59098b9b2ba8e4cbf6d52f91c7a69e2054257e3a7dcc",
  "targetAncestry": [
    "Workspace Topology Roadmap",
    "Recommended Decisions",
    "D3. Runtime Coordination Gets Its Own Root"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/workspace-topology-roadmap.md#unheaded-block-11 (lines 66–67) into docs/platform/system-architecture/architecture/workspace-topology-roadmap.md#unheaded-block-13 (lines 89–90), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
Claims, sessions, assignment claims, locks, and runtime leases move conceptually
under `runtimeCoordinationRoot`, not packaging's runtime payload namespace.
```

### Full target shown text

```text
Claims, sessions, assignment claims, locks, and runtime leases move conceptually
under `runtimeCoordinationRoot`, not packaging's runtime payload namespace.
```

### Unified diff

```diff
No text difference.
```

## claim_a70e2d572645baf3fa3318fc249a43d5

Source: `docs/architect/workspace-topology-roadmap.md#unheaded-block-12`. Target: `docs/platform/system-architecture/architecture/workspace-topology-roadmap.md#unheaded-block-14`.

Mechanical class: Unit-exact. Source digest: `7792f05a12318887bb928aad393d0cfbb65068595dddb7e43945b69d73df1d09`. Target digest: `7792f05a12318887bb928aad393d0cfbb65068595dddb7e43945b69d73df1d09`.

Full shown source SHA256: `7792f05a12318887bb928aad393d0cfbb65068595dddb7e43945b69d73df1d09`. Full shown target SHA256: `7792f05a12318887bb928aad393d0cfbb65068595dddb7e43945b69d73df1d09`.

### Proposed decision

```json
{
  "claimId": "claim_a70e2d572645baf3fa3318fc249a43d5",
  "sourceUnitDigest": "7792f05a12318887bb928aad393d0cfbb65068595dddb7e43945b69d73df1d09",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology-roadmap.md",
  "targetAnchor": "unheaded-block-14",
  "targetUnitDigest": "7792f05a12318887bb928aad393d0cfbb65068595dddb7e43945b69d73df1d09",
  "targetAncestry": [
    "Workspace Topology Roadmap",
    "Recommended Decisions",
    "D3. Runtime Coordination Gets Its Own Root"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/workspace-topology-roadmap.md#unheaded-block-12 (lines 69–74) into docs/platform/system-architecture/architecture/workspace-topology-roadmap.md#unheaded-block-14 (lines 92–97), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
Rules:

- coordination records declare `workStateId`;
- workspace-specific coordination also declares `workspaceId`;
- liveness records use fencing token, boot/process identity, heartbeat, and
  explicit completion-unknown recovery.
```

### Full target shown text

```text
Rules:

- coordination records declare `workStateId`;
- workspace-specific coordination also declares `workspaceId`;
- liveness records use fencing token, boot/process identity, heartbeat, and
  explicit completion-unknown recovery.
```

### Unified diff

```diff
No text difference.
```

## claim_e840a17bb14018cf0a782762b9e6b6da

Source: `docs/architect/workspace-topology-roadmap.md#d4-activation-binding-is-workspace-scoped`. Target: `docs/platform/system-architecture/architecture/workspace-topology-roadmap.md#d4-activation-binding-is-workspace-scoped`.

Mechanical class: Unit-exact. Source digest: `357370282d6a8e7aa037935b97566eca8317b7156c0cc4b5611d6b378fa9b931`. Target digest: `357370282d6a8e7aa037935b97566eca8317b7156c0cc4b5611d6b378fa9b931`.

Full shown source SHA256: `d25f9f858f52cfb42f1a2cbd81c624059c201b01f24acb2c79b10e9b6801cef4`. Full shown target SHA256: `d25f9f858f52cfb42f1a2cbd81c624059c201b01f24acb2c79b10e9b6801cef4`.

### Proposed decision

```json
{
  "claimId": "claim_e840a17bb14018cf0a782762b9e6b6da",
  "sourceUnitDigest": "357370282d6a8e7aa037935b97566eca8317b7156c0cc4b5611d6b378fa9b931",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology-roadmap.md",
  "targetAnchor": "d4-activation-binding-is-workspace-scoped",
  "targetUnitDigest": "357370282d6a8e7aa037935b97566eca8317b7156c0cc4b5611d6b378fa9b931",
  "targetAncestry": [
    "Workspace Topology Roadmap",
    "Recommended Decisions"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete heading at docs/architect/workspace-topology-roadmap.md#d4-activation-binding-is-workspace-scoped (lines 76–76) into docs/platform/system-architecture/architecture/workspace-topology-roadmap.md#d4-activation-binding-is-workspace-scoped (lines 99–99), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
### D4. Activation Binding Is Workspace-Scoped

Release payloads are shared by digest on the machine. Activation bindings are
per `workspaceId`.

Rules:

- two worktrees may bind different runtime digests;
- mutating the same `workStateId` requires writer compatibility;
- `fgctl` publishes only ready activation bindings;
- candidate runtime preparation must happen before ready publication.
```

### Full target shown text

```text
### D4. Activation Binding Is Workspace-Scoped

Release payloads are shared by digest on the machine. Activation bindings are
per `workspaceId`.

Rules:

- two worktrees may bind different runtime digests;
- mutating the same `workStateId` requires writer compatibility;
- `fgctl` publishes only ready activation bindings;
- candidate runtime preparation must happen before ready publication.
```

### Unified diff

```diff
No text difference.
```

## claim_fe9665d9b31ef5de6f30c7d9aac8920a

Source: `docs/architect/workspace-topology-roadmap.md#unheaded-block-13`. Target: `docs/platform/system-architecture/architecture/workspace-topology-roadmap.md#unheaded-block-15`.

Mechanical class: Unit-exact. Source digest: `48fc5189cc53075e46263c19925bd197bb578008423423decd67b70910442841`. Target digest: `48fc5189cc53075e46263c19925bd197bb578008423423decd67b70910442841`.

Full shown source SHA256: `48fc5189cc53075e46263c19925bd197bb578008423423decd67b70910442841`. Full shown target SHA256: `48fc5189cc53075e46263c19925bd197bb578008423423decd67b70910442841`.

### Proposed decision

```json
{
  "claimId": "claim_fe9665d9b31ef5de6f30c7d9aac8920a",
  "sourceUnitDigest": "48fc5189cc53075e46263c19925bd197bb578008423423decd67b70910442841",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology-roadmap.md",
  "targetAnchor": "unheaded-block-15",
  "targetUnitDigest": "48fc5189cc53075e46263c19925bd197bb578008423423decd67b70910442841",
  "targetAncestry": [
    "Workspace Topology Roadmap",
    "Recommended Decisions",
    "D4. Activation Binding Is Workspace-Scoped"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/workspace-topology-roadmap.md#unheaded-block-13 (lines 78–79) into docs/platform/system-architecture/architecture/workspace-topology-roadmap.md#unheaded-block-15 (lines 101–102), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
Release payloads are shared by digest on the machine. Activation bindings are
per `workspaceId`.
```

### Full target shown text

```text
Release payloads are shared by digest on the machine. Activation bindings are
per `workspaceId`.
```

### Unified diff

```diff
No text difference.
```

## claim_66d5c6f5c70e2f2e889263202da6a2d4

Source: `docs/architect/workspace-topology-roadmap.md#unheaded-block-14`. Target: `docs/platform/system-architecture/architecture/workspace-topology-roadmap.md#unheaded-block-16`.

Mechanical class: Unit-exact. Source digest: `59cec777f8ebed64f758f6390318efd6482591310356a1078498bd53eb2373c5`. Target digest: `59cec777f8ebed64f758f6390318efd6482591310356a1078498bd53eb2373c5`.

Full shown source SHA256: `59cec777f8ebed64f758f6390318efd6482591310356a1078498bd53eb2373c5`. Full shown target SHA256: `59cec777f8ebed64f758f6390318efd6482591310356a1078498bd53eb2373c5`.

### Proposed decision

```json
{
  "claimId": "claim_66d5c6f5c70e2f2e889263202da6a2d4",
  "sourceUnitDigest": "59cec777f8ebed64f758f6390318efd6482591310356a1078498bd53eb2373c5",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology-roadmap.md",
  "targetAnchor": "unheaded-block-16",
  "targetUnitDigest": "59cec777f8ebed64f758f6390318efd6482591310356a1078498bd53eb2373c5",
  "targetAncestry": [
    "Workspace Topology Roadmap",
    "Recommended Decisions",
    "D4. Activation Binding Is Workspace-Scoped"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/workspace-topology-roadmap.md#unheaded-block-14 (lines 81–86) into docs/platform/system-architecture/architecture/workspace-topology-roadmap.md#unheaded-block-16 (lines 104–109), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
Rules:

- two worktrees may bind different runtime digests;
- mutating the same `workStateId` requires writer compatibility;
- `fgctl` publishes only ready activation bindings;
- candidate runtime preparation must happen before ready publication.
```

### Full target shown text

```text
Rules:

- two worktrees may bind different runtime digests;
- mutating the same `workStateId` requires writer compatibility;
- `fgctl` publishes only ready activation bindings;
- candidate runtime preparation must happen before ready publication.
```

### Unified diff

```diff
No text difference.
```

## claim_bcbcc1525bc4a480641dbbce5c21c773

Source: `docs/architect/workspace-topology-roadmap.md#d5-projections-are-workspace-scoped-and-ledgered`. Target: `docs/platform/system-architecture/architecture/workspace-topology-roadmap.md#d5-projections-are-workspace-scoped-and-ledgered`.

Mechanical class: Unit-exact. Source digest: `35e6d439354a90e91df5aa9ce742f1741a60faa1359a0e0eec8379b3db2ff4e5`. Target digest: `35e6d439354a90e91df5aa9ce742f1741a60faa1359a0e0eec8379b3db2ff4e5`.

Full shown source SHA256: `45c2a7ef94fc5e03290f7c3312e7838926fc50c2364930fba1e2d21fb421fbb4`. Full shown target SHA256: `45c2a7ef94fc5e03290f7c3312e7838926fc50c2364930fba1e2d21fb421fbb4`.

### Proposed decision

```json
{
  "claimId": "claim_bcbcc1525bc4a480641dbbce5c21c773",
  "sourceUnitDigest": "35e6d439354a90e91df5aa9ce742f1741a60faa1359a0e0eec8379b3db2ff4e5",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology-roadmap.md",
  "targetAnchor": "d5-projections-are-workspace-scoped-and-ledgered",
  "targetUnitDigest": "35e6d439354a90e91df5aa9ce742f1741a60faa1359a0e0eec8379b3db2ff4e5",
  "targetAncestry": [
    "Workspace Topology Roadmap",
    "Recommended Decisions"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete heading at docs/architect/workspace-topology-roadmap.md#d5-projections-are-workspace-scoped-and-ledgered (lines 88–88) into docs/platform/system-architecture/architecture/workspace-topology-roadmap.md#d5-projections-are-workspace-scoped-and-ledgered (lines 111–111), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
### D5. Projections Are Workspace-Scoped And Ledgered

Skills, agents, prose, hooks, and generated host files are materialized by local
`fgos init` / `fgos doctor --fix`, not written directly by `fgctl`.

Rules:

- projection ledger is per `workspaceId`;
- each path is `generated-owned`, `managed-block`, `source-owned`, or
  `coexistence-refuse`;
- dogfood/source checkout must be cleanly separable from installed workshop
  projections.
```

### Full target shown text

```text
### D5. Projections Are Workspace-Scoped And Ledgered

Skills, agents, prose, hooks, and generated host files are materialized by local
`fgos init` / `fgos doctor --fix`, not written directly by `fgctl`.

Rules:

- projection ledger is per `workspaceId`;
- each path is `generated-owned`, `managed-block`, `source-owned`, or
  `coexistence-refuse`;
- dogfood/source checkout must be cleanly separable from installed workshop
  projections.
```

### Unified diff

```diff
No text difference.
```

## claim_7f019bb1766ae7b894f88d0993adf548

Source: `docs/architect/workspace-topology-roadmap.md#unheaded-block-15`. Target: `docs/platform/system-architecture/architecture/workspace-topology-roadmap.md#unheaded-block-17`.

Mechanical class: Unit-exact. Source digest: `1be69c6e5bc884f9f81fe9be1dcefcfbbdc6edc630ffffc29ac672508642f083`. Target digest: `1be69c6e5bc884f9f81fe9be1dcefcfbbdc6edc630ffffc29ac672508642f083`.

Full shown source SHA256: `1be69c6e5bc884f9f81fe9be1dcefcfbbdc6edc630ffffc29ac672508642f083`. Full shown target SHA256: `1be69c6e5bc884f9f81fe9be1dcefcfbbdc6edc630ffffc29ac672508642f083`.

### Proposed decision

```json
{
  "claimId": "claim_7f019bb1766ae7b894f88d0993adf548",
  "sourceUnitDigest": "1be69c6e5bc884f9f81fe9be1dcefcfbbdc6edc630ffffc29ac672508642f083",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology-roadmap.md",
  "targetAnchor": "unheaded-block-17",
  "targetUnitDigest": "1be69c6e5bc884f9f81fe9be1dcefcfbbdc6edc630ffffc29ac672508642f083",
  "targetAncestry": [
    "Workspace Topology Roadmap",
    "Recommended Decisions",
    "D5. Projections Are Workspace-Scoped And Ledgered"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/workspace-topology-roadmap.md#unheaded-block-15 (lines 90–91) into docs/platform/system-architecture/architecture/workspace-topology-roadmap.md#unheaded-block-17 (lines 113–114), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
Skills, agents, prose, hooks, and generated host files are materialized by local
`fgos init` / `fgos doctor --fix`, not written directly by `fgctl`.
```

### Full target shown text

```text
Skills, agents, prose, hooks, and generated host files are materialized by local
`fgos init` / `fgos doctor --fix`, not written directly by `fgctl`.
```

### Unified diff

```diff
No text difference.
```

## claim_abe2f2da35f685b062a0fb6d5f4f702e

Source: `docs/architect/workspace-topology-roadmap.md#unheaded-block-16`. Target: `docs/platform/system-architecture/architecture/workspace-topology-roadmap.md#unheaded-block-18`.

Mechanical class: Unit-exact. Source digest: `a35f6e7d29e6011b38934d95996cd41857c5227f2cc0660194cafca424675d24`. Target digest: `a35f6e7d29e6011b38934d95996cd41857c5227f2cc0660194cafca424675d24`.

Full shown source SHA256: `a35f6e7d29e6011b38934d95996cd41857c5227f2cc0660194cafca424675d24`. Full shown target SHA256: `a35f6e7d29e6011b38934d95996cd41857c5227f2cc0660194cafca424675d24`.

### Proposed decision

```json
{
  "claimId": "claim_abe2f2da35f685b062a0fb6d5f4f702e",
  "sourceUnitDigest": "a35f6e7d29e6011b38934d95996cd41857c5227f2cc0660194cafca424675d24",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology-roadmap.md",
  "targetAnchor": "unheaded-block-18",
  "targetUnitDigest": "a35f6e7d29e6011b38934d95996cd41857c5227f2cc0660194cafca424675d24",
  "targetAncestry": [
    "Workspace Topology Roadmap",
    "Recommended Decisions",
    "D5. Projections Are Workspace-Scoped And Ledgered"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/workspace-topology-roadmap.md#unheaded-block-16 (lines 93–99) into docs/platform/system-architecture/architecture/workspace-topology-roadmap.md#unheaded-block-18 (lines 116–122), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
Rules:

- projection ledger is per `workspaceId`;
- each path is `generated-owned`, `managed-block`, `source-owned`, or
  `coexistence-refuse`;
- dogfood/source checkout must be cleanly separable from installed workshop
  projections.
```

### Full target shown text

```text
Rules:

- projection ledger is per `workspaceId`;
- each path is `generated-owned`, `managed-block`, `source-owned`, or
  `coexistence-refuse`;
- dogfood/source checkout must be cleanly separable from installed workshop
  projections.
```

### Unified diff

```diff
No text difference.
```

## claim_6eac0a624cee523c616658249dd3d039

Source: `docs/architect/workspace-topology-roadmap.md#migration-slices`. Target: `docs/platform/system-architecture/architecture/workspace-topology-roadmap.md#migration-slices`.

Mechanical class: Weak-exact. Source digest: `73cc7cba32dc0093a2d45b69721cdab0224c47ac8960c4cdb9b0fd47eb0a2b1c`. Target digest: `73cc7cba32dc0093a2d45b69721cdab0224c47ac8960c4cdb9b0fd47eb0a2b1c`.

Full shown source SHA256: `fc94a3868f846e24095a3043a3089ae5429a71bf15c17270260e7ab534cea485`. Full shown target SHA256: `fc94a3868f846e24095a3043a3089ae5429a71bf15c17270260e7ab534cea485`.

### Proposed decision

```json
{
  "claimId": "claim_6eac0a624cee523c616658249dd3d039",
  "sourceUnitDigest": "73cc7cba32dc0093a2d45b69721cdab0224c47ac8960c4cdb9b0fd47eb0a2b1c",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology-roadmap.md",
  "targetAnchor": "migration-slices",
  "targetUnitDigest": "73cc7cba32dc0093a2d45b69721cdab0224c47ac8960c4cdb9b0fd47eb0a2b1c",
  "targetAncestry": [
    "Workspace Topology Roadmap"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. Carry the complete heading at docs/architect/workspace-topology-roadmap.md#migration-slices (lines 101–101) into docs/platform/system-architecture/architecture/workspace-topology-roadmap.md#migration-slices (lines 124–124), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
## Migration Slices
```

### Full target shown text

```text
## Migration Slices
```

### Unified diff

```diff
No text difference.
```

## claim_46a99d6408899da28c5c04c58c252fe3

Source: `docs/architect/workspace-topology-roadmap.md#t0-document-contract-lock`. Target: `docs/platform/system-architecture/architecture/workspace-topology-roadmap.md#t0-document-contract-lock`.

Mechanical class: Weak-exact. Source digest: `e0ad4bc2f32d1cbb555dc9d0594102811e06ada347be714ac94e37313e30c3e9`. Target digest: `e0ad4bc2f32d1cbb555dc9d0594102811e06ada347be714ac94e37313e30c3e9`.

Full shown source SHA256: `3612813fb5f12958ea9eab4f73631a764d7fbacebbd85b5f8fdc47a108090384`. Full shown target SHA256: `3612813fb5f12958ea9eab4f73631a764d7fbacebbd85b5f8fdc47a108090384`.

### Proposed decision

```json
{
  "claimId": "claim_46a99d6408899da28c5c04c58c252fe3",
  "sourceUnitDigest": "e0ad4bc2f32d1cbb555dc9d0594102811e06ada347be714ac94e37313e30c3e9",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology-roadmap.md",
  "targetAnchor": "t0-document-contract-lock",
  "targetUnitDigest": "e0ad4bc2f32d1cbb555dc9d0594102811e06ada347be714ac94e37313e30c3e9",
  "targetAncestry": [
    "Workspace Topology Roadmap",
    "Migration Slices"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. Carry the complete heading at docs/architect/workspace-topology-roadmap.md#t0-document-contract-lock (lines 103–103) into docs/platform/system-architecture/architecture/workspace-topology-roadmap.md#t0-document-contract-lock (lines 126–126), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
### T0. Document Contract Lock

Deliverables:

- close durable history decision;
- finalize `workspace-topology.md`;
- mark audit/roadmap as companion docs;
- update packaging docs to depend on topology.

Proof:

- a new engineer can answer root/capability choice for each operation without
  reading chat history.
```

### Full target shown text

```text
### T0. Document Contract Lock

Deliverables:

- close durable history decision;
- finalize `workspace-topology.md`;
- mark audit/roadmap as companion docs;
- update packaging docs to depend on topology.

Proof:

- a new engineer can answer root/capability choice for each operation without
  reading chat history.
```

### Unified diff

```diff
No text difference.
```

## claim_1e9da585db30f58901ce63e1a008fad2

Source: `docs/architect/workspace-topology-roadmap.md#unheaded-block-17`. Target: `docs/platform/system-architecture/architecture/workspace-topology-roadmap.md#unheaded-block-19`.

Mechanical class: Unit-exact. Source digest: `02409769f4fac8b5546894be10918e57cc0e109f792a4606260fe894929d6fc1`. Target digest: `02409769f4fac8b5546894be10918e57cc0e109f792a4606260fe894929d6fc1`.

Full shown source SHA256: `02409769f4fac8b5546894be10918e57cc0e109f792a4606260fe894929d6fc1`. Full shown target SHA256: `02409769f4fac8b5546894be10918e57cc0e109f792a4606260fe894929d6fc1`.

### Proposed decision

```json
{
  "claimId": "claim_1e9da585db30f58901ce63e1a008fad2",
  "sourceUnitDigest": "02409769f4fac8b5546894be10918e57cc0e109f792a4606260fe894929d6fc1",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology-roadmap.md",
  "targetAnchor": "unheaded-block-19",
  "targetUnitDigest": "02409769f4fac8b5546894be10918e57cc0e109f792a4606260fe894929d6fc1",
  "targetAncestry": [
    "Workspace Topology Roadmap",
    "Migration Slices",
    "T0. Document Contract Lock"
  ],
  "claimKind": "decision",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/workspace-topology-roadmap.md#unheaded-block-17 (lines 105–110) into docs/platform/system-architecture/architecture/workspace-topology-roadmap.md#unheaded-block-19 (lines 128–133), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
Deliverables:

- close durable history decision;
- finalize `workspace-topology.md`;
- mark audit/roadmap as companion docs;
- update packaging docs to depend on topology.
```

### Full target shown text

```text
Deliverables:

- close durable history decision;
- finalize `workspace-topology.md`;
- mark audit/roadmap as companion docs;
- update packaging docs to depend on topology.
```

### Unified diff

```diff
No text difference.
```

## claim_d0f19b7dd3dbed74e895877f250c818c

Source: `docs/architect/workspace-topology-roadmap.md#unheaded-block-18`. Target: `docs/platform/system-architecture/architecture/workspace-topology-roadmap.md#unheaded-block-20`.

Mechanical class: Unit-exact. Source digest: `c0df9e23404d2464c59c3b798603b7fbaaea53a62275ee3ef304755aad6fed1d`. Target digest: `c0df9e23404d2464c59c3b798603b7fbaaea53a62275ee3ef304755aad6fed1d`.

Full shown source SHA256: `c0df9e23404d2464c59c3b798603b7fbaaea53a62275ee3ef304755aad6fed1d`. Full shown target SHA256: `c0df9e23404d2464c59c3b798603b7fbaaea53a62275ee3ef304755aad6fed1d`.

### Proposed decision

```json
{
  "claimId": "claim_d0f19b7dd3dbed74e895877f250c818c",
  "sourceUnitDigest": "c0df9e23404d2464c59c3b798603b7fbaaea53a62275ee3ef304755aad6fed1d",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology-roadmap.md",
  "targetAnchor": "unheaded-block-20",
  "targetUnitDigest": "c0df9e23404d2464c59c3b798603b7fbaaea53a62275ee3ef304755aad6fed1d",
  "targetAncestry": [
    "Workspace Topology Roadmap",
    "Migration Slices",
    "T0. Document Contract Lock"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/workspace-topology-roadmap.md#unheaded-block-18 (lines 112–115) into docs/platform/system-architecture/architecture/workspace-topology-roadmap.md#unheaded-block-20 (lines 135–138), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
Proof:

- a new engineer can answer root/capability choice for each operation without
  reading chat history.
```

### Full target shown text

```text
Proof:

- a new engineer can answer root/capability choice for each operation without
  reading chat history.
```

### Unified diff

```diff
No text difference.
```

## claim_0924788cdaa268f927c6dd9be32a1b37

Source: `docs/architect/workspace-topology-roadmap.md#t1-topology-resolver-skeleton`. Target: `docs/platform/system-architecture/architecture/workspace-topology-roadmap.md#t1-topology-resolver-skeleton`.

Mechanical class: Weak-exact. Source digest: `f8a5b3b07acbeb47b5388dd95baa8ca22ed402e4fde83558219ca7e0f93bbe04`. Target digest: `f8a5b3b07acbeb47b5388dd95baa8ca22ed402e4fde83558219ca7e0f93bbe04`.

Full shown source SHA256: `067a8fa5ea816ce6f925bd1a871717d88ba6b8ac2421d2e607cd4b94af9254b0`. Full shown target SHA256: `067a8fa5ea816ce6f925bd1a871717d88ba6b8ac2421d2e607cd4b94af9254b0`.

### Proposed decision

```json
{
  "claimId": "claim_0924788cdaa268f927c6dd9be32a1b37",
  "sourceUnitDigest": "f8a5b3b07acbeb47b5388dd95baa8ca22ed402e4fde83558219ca7e0f93bbe04",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology-roadmap.md",
  "targetAnchor": "t1-topology-resolver-skeleton",
  "targetUnitDigest": "f8a5b3b07acbeb47b5388dd95baa8ca22ed402e4fde83558219ca7e0f93bbe04",
  "targetAncestry": [
    "Workspace Topology Roadmap",
    "Migration Slices"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. Carry the complete heading at docs/architect/workspace-topology-roadmap.md#t1-topology-resolver-skeleton (lines 117–117) into docs/platform/system-architecture/architecture/workspace-topology-roadmap.md#t1-topology-resolver-skeleton (lines 140–140), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
### T1. Topology Resolver Skeleton

Deliverables:

- implement a read-only `resolveTopology()` returning identities and typed roots;
- support Git main checkout, linked worktree, and non-Git workspace;
- no behavior migration yet.

Proof:

- fixture tests for main, linked worktree, symlink path, fresh clone-like
  workspace, non-Git directory.
```

### Full target shown text

```text
### T1. Topology Resolver Skeleton

Deliverables:

- implement a read-only `resolveTopology()` returning identities and typed roots;
- support Git main checkout, linked worktree, and non-Git workspace;
- no behavior migration yet.

Proof:

- fixture tests for main, linked worktree, symlink path, fresh clone-like
  workspace, non-Git directory.
```

### Unified diff

```diff
No text difference.
```

## claim_6bd3d060b78973b429ec88b266eb8cd2

Source: `docs/architect/workspace-topology-roadmap.md#unheaded-block-19`. Target: `docs/platform/system-architecture/architecture/workspace-topology-roadmap.md#unheaded-block-21`.

Mechanical class: Unit-exact. Source digest: `675be9dc1c636f7cee49f6f1161d26ea5d8a47e1fab2eb2a9726669ecd784797`. Target digest: `675be9dc1c636f7cee49f6f1161d26ea5d8a47e1fab2eb2a9726669ecd784797`.

Full shown source SHA256: `675be9dc1c636f7cee49f6f1161d26ea5d8a47e1fab2eb2a9726669ecd784797`. Full shown target SHA256: `675be9dc1c636f7cee49f6f1161d26ea5d8a47e1fab2eb2a9726669ecd784797`.

### Proposed decision

```json
{
  "claimId": "claim_6bd3d060b78973b429ec88b266eb8cd2",
  "sourceUnitDigest": "675be9dc1c636f7cee49f6f1161d26ea5d8a47e1fab2eb2a9726669ecd784797",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology-roadmap.md",
  "targetAnchor": "unheaded-block-21",
  "targetUnitDigest": "675be9dc1c636f7cee49f6f1161d26ea5d8a47e1fab2eb2a9726669ecd784797",
  "targetAncestry": [
    "Workspace Topology Roadmap",
    "Migration Slices",
    "T1. Topology Resolver Skeleton"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/workspace-topology-roadmap.md#unheaded-block-19 (lines 119–123) into docs/platform/system-architecture/architecture/workspace-topology-roadmap.md#unheaded-block-21 (lines 142–146), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
Deliverables:

- implement a read-only `resolveTopology()` returning identities and typed roots;
- support Git main checkout, linked worktree, and non-Git workspace;
- no behavior migration yet.
```

### Full target shown text

```text
Deliverables:

- implement a read-only `resolveTopology()` returning identities and typed roots;
- support Git main checkout, linked worktree, and non-Git workspace;
- no behavior migration yet.
```

### Unified diff

```diff
No text difference.
```

## claim_e4aaee56015175d6d70524151d5d56b7

Source: `docs/architect/workspace-topology-roadmap.md#unheaded-block-20`. Target: `docs/platform/system-architecture/architecture/workspace-topology-roadmap.md#unheaded-block-22`.

Mechanical class: Unit-exact. Source digest: `4f772c7021e27c123303091ab408d63c3050a6629573f1b372b558e612f40d22`. Target digest: `4f772c7021e27c123303091ab408d63c3050a6629573f1b372b558e612f40d22`.

Full shown source SHA256: `4f772c7021e27c123303091ab408d63c3050a6629573f1b372b558e612f40d22`. Full shown target SHA256: `4f772c7021e27c123303091ab408d63c3050a6629573f1b372b558e612f40d22`.

### Proposed decision

```json
{
  "claimId": "claim_e4aaee56015175d6d70524151d5d56b7",
  "sourceUnitDigest": "4f772c7021e27c123303091ab408d63c3050a6629573f1b372b558e612f40d22",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology-roadmap.md",
  "targetAnchor": "unheaded-block-22",
  "targetUnitDigest": "4f772c7021e27c123303091ab408d63c3050a6629573f1b372b558e612f40d22",
  "targetAncestry": [
    "Workspace Topology Roadmap",
    "Migration Slices",
    "T1. Topology Resolver Skeleton"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/workspace-topology-roadmap.md#unheaded-block-20 (lines 125–128) into docs/platform/system-architecture/architecture/workspace-topology-roadmap.md#unheaded-block-22 (lines 148–151), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
Proof:

- fixture tests for main, linked worktree, symlink path, fresh clone-like
  workspace, non-Git directory.
```

### Full target shown text

```text
Proof:

- fixture tests for main, linked worktree, symlink path, fresh clone-like
  workspace, non-Git directory.
```

### Unified diff

```diff
No text difference.
```

## claim_d175770ec8abeefb5fe6be49c10c277e

Source: `docs/architect/workspace-topology-roadmap.md#t2-config-scope-enforcement`. Target: `docs/platform/system-architecture/architecture/workspace-topology-roadmap.md#t2-config-scope-enforcement`.

Mechanical class: Weak-exact. Source digest: `97c76ff49b84b3d1096ac661e9f731df389c0bb4a559e3130cb1a94aa9d7d116`. Target digest: `97c76ff49b84b3d1096ac661e9f731df389c0bb4a559e3130cb1a94aa9d7d116`.

Full shown source SHA256: `198176329869dc599981ce61f4494573d62368793fae2660a19c05b174668f0a`. Full shown target SHA256: `198176329869dc599981ce61f4494573d62368793fae2660a19c05b174668f0a`.

### Proposed decision

```json
{
  "claimId": "claim_d175770ec8abeefb5fe6be49c10c277e",
  "sourceUnitDigest": "97c76ff49b84b3d1096ac661e9f731df389c0bb4a559e3130cb1a94aa9d7d116",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology-roadmap.md",
  "targetAnchor": "t2-config-scope-enforcement",
  "targetUnitDigest": "97c76ff49b84b3d1096ac661e9f731df389c0bb4a559e3130cb1a94aa9d7d116",
  "targetAncestry": [
    "Workspace Topology Roadmap",
    "Migration Slices"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. Carry the complete heading at docs/architect/workspace-topology-roadmap.md#t2-config-scope-enforcement (lines 130–130) into docs/platform/system-architecture/architecture/workspace-topology-roadmap.md#t2-config-scope-enforcement (lines 153–153), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
### T2. Config Scope Enforcement

Deliverables:

- classify existing config keys;
- update config readers to consume `TopologyContext`;
- prevent silent main fallback for workspace policy reads.

Proof:

- worker branch config edit is read by worker operation and does not edit main.
```

### Full target shown text

```text
### T2. Config Scope Enforcement

Deliverables:

- classify existing config keys;
- update config readers to consume `TopologyContext`;
- prevent silent main fallback for workspace policy reads.

Proof:

- worker branch config edit is read by worker operation and does not edit main.
```

### Unified diff

```diff
No text difference.
```

## claim_2da47f647aa631358e5e75604bd08a23

Source: `docs/architect/workspace-topology-roadmap.md#unheaded-block-21`. Target: `docs/platform/system-architecture/architecture/workspace-topology-roadmap.md#unheaded-block-23`.

Mechanical class: Unit-exact. Source digest: `d6012af53a755f8500963209b673ce69236f55581fb08ea83720a00024beda99`. Target digest: `d6012af53a755f8500963209b673ce69236f55581fb08ea83720a00024beda99`.

Full shown source SHA256: `d6012af53a755f8500963209b673ce69236f55581fb08ea83720a00024beda99`. Full shown target SHA256: `d6012af53a755f8500963209b673ce69236f55581fb08ea83720a00024beda99`.

### Proposed decision

```json
{
  "claimId": "claim_2da47f647aa631358e5e75604bd08a23",
  "sourceUnitDigest": "d6012af53a755f8500963209b673ce69236f55581fb08ea83720a00024beda99",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology-roadmap.md",
  "targetAnchor": "unheaded-block-23",
  "targetUnitDigest": "d6012af53a755f8500963209b673ce69236f55581fb08ea83720a00024beda99",
  "targetAncestry": [
    "Workspace Topology Roadmap",
    "Migration Slices",
    "T2. Config Scope Enforcement"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/workspace-topology-roadmap.md#unheaded-block-21 (lines 132–136) into docs/platform/system-architecture/architecture/workspace-topology-roadmap.md#unheaded-block-23 (lines 155–159), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
Deliverables:

- classify existing config keys;
- update config readers to consume `TopologyContext`;
- prevent silent main fallback for workspace policy reads.
```

### Full target shown text

```text
Deliverables:

- classify existing config keys;
- update config readers to consume `TopologyContext`;
- prevent silent main fallback for workspace policy reads.
```

### Unified diff

```diff
No text difference.
```

## claim_bfbe8c5e54fe09d79bfa2324e440bca5

Source: `docs/architect/workspace-topology-roadmap.md#unheaded-block-22`. Target: `docs/platform/system-architecture/architecture/workspace-topology-roadmap.md#unheaded-block-24`.

Mechanical class: Unit-exact. Source digest: `deb7ab2cdcb8bc3f6c6ff9fbca35c125ab3c9b94da30248996e9fd4e7be54375`. Target digest: `deb7ab2cdcb8bc3f6c6ff9fbca35c125ab3c9b94da30248996e9fd4e7be54375`.

Full shown source SHA256: `deb7ab2cdcb8bc3f6c6ff9fbca35c125ab3c9b94da30248996e9fd4e7be54375`. Full shown target SHA256: `deb7ab2cdcb8bc3f6c6ff9fbca35c125ab3c9b94da30248996e9fd4e7be54375`.

### Proposed decision

```json
{
  "claimId": "claim_bfbe8c5e54fe09d79bfa2324e440bca5",
  "sourceUnitDigest": "deb7ab2cdcb8bc3f6c6ff9fbca35c125ab3c9b94da30248996e9fd4e7be54375",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology-roadmap.md",
  "targetAnchor": "unheaded-block-24",
  "targetUnitDigest": "deb7ab2cdcb8bc3f6c6ff9fbca35c125ab3c9b94da30248996e9fd4e7be54375",
  "targetAncestry": [
    "Workspace Topology Roadmap",
    "Migration Slices",
    "T2. Config Scope Enforcement"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/workspace-topology-roadmap.md#unheaded-block-22 (lines 138–140) into docs/platform/system-architecture/architecture/workspace-topology-roadmap.md#unheaded-block-24 (lines 161–163), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
Proof:

- worker branch config edit is read by worker operation and does not edit main.
```

### Full target shown text

```text
Proof:

- worker branch config edit is read by worker operation and does not edit main.
```

### Unified diff

```diff
No text difference.
```

## claim_52252fa90946ef979ab70e11de5e25a5

Source: `docs/architect/workspace-topology-roadmap.md#t3-runtime-coordination-root-split`. Target: `docs/platform/system-architecture/architecture/workspace-topology-roadmap.md#t3-runtime-coordination-root-split`.

Mechanical class: Weak-exact. Source digest: `cc8fd83df039ca1c2094f1db896f6da355b23a81fd3a4585aed7af75f71f5748`. Target digest: `cc8fd83df039ca1c2094f1db896f6da355b23a81fd3a4585aed7af75f71f5748`.

Full shown source SHA256: `c684dbf38376067a3410825fb3990abd510e96e3898a867c11035c97ba024f88`. Full shown target SHA256: `c684dbf38376067a3410825fb3990abd510e96e3898a867c11035c97ba024f88`.

### Proposed decision

```json
{
  "claimId": "claim_52252fa90946ef979ab70e11de5e25a5",
  "sourceUnitDigest": "cc8fd83df039ca1c2094f1db896f6da355b23a81fd3a4585aed7af75f71f5748",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology-roadmap.md",
  "targetAnchor": "t3-runtime-coordination-root-split",
  "targetUnitDigest": "cc8fd83df039ca1c2094f1db896f6da355b23a81fd3a4585aed7af75f71f5748",
  "targetAncestry": [
    "Workspace Topology Roadmap",
    "Migration Slices"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. Carry the complete heading at docs/architect/workspace-topology-roadmap.md#t3-runtime-coordination-root-split (lines 142–142) into docs/platform/system-architecture/architecture/workspace-topology-roadmap.md#t3-runtime-coordination-root-split (lines 165–165), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
### T3. Runtime Coordination Root Split

Deliverables:

- move conceptual claim/session/assignment/lease resolution behind
  `runtimeCoordinationRoot`;
- do not use packaging runtime namespace for claims;
- add lease identity fields required by the contract.

Proof:

- linked worktrees share intended coordination state; corrupt/ambiguous leases
  fail closed.
```

### Full target shown text

```text
### T3. Runtime Coordination Root Split

Deliverables:

- move conceptual claim/session/assignment/lease resolution behind
  `runtimeCoordinationRoot`;
- do not use packaging runtime namespace for claims;
- add lease identity fields required by the contract.

Proof:

- linked worktrees share intended coordination state; corrupt/ambiguous leases
  fail closed.
```

### Unified diff

```diff
No text difference.
```

## claim_7b8707a814fad2d0077d6db03c4bfb98

Source: `docs/architect/workspace-topology-roadmap.md#unheaded-block-23`. Target: `docs/platform/system-architecture/architecture/workspace-topology-roadmap.md#unheaded-block-25`.

Mechanical class: Unit-exact. Source digest: `57e95224c65a82edf3f4d8b14be6d7fa1e92e455239b37f050bc1b192a60d46b`. Target digest: `57e95224c65a82edf3f4d8b14be6d7fa1e92e455239b37f050bc1b192a60d46b`.

Full shown source SHA256: `57e95224c65a82edf3f4d8b14be6d7fa1e92e455239b37f050bc1b192a60d46b`. Full shown target SHA256: `57e95224c65a82edf3f4d8b14be6d7fa1e92e455239b37f050bc1b192a60d46b`.

### Proposed decision

```json
{
  "claimId": "claim_7b8707a814fad2d0077d6db03c4bfb98",
  "sourceUnitDigest": "57e95224c65a82edf3f4d8b14be6d7fa1e92e455239b37f050bc1b192a60d46b",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology-roadmap.md",
  "targetAnchor": "unheaded-block-25",
  "targetUnitDigest": "57e95224c65a82edf3f4d8b14be6d7fa1e92e455239b37f050bc1b192a60d46b",
  "targetAncestry": [
    "Workspace Topology Roadmap",
    "Migration Slices",
    "T3. Runtime Coordination Root Split"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/workspace-topology-roadmap.md#unheaded-block-23 (lines 144–149) into docs/platform/system-architecture/architecture/workspace-topology-roadmap.md#unheaded-block-25 (lines 167–172), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
Deliverables:

- move conceptual claim/session/assignment/lease resolution behind
  `runtimeCoordinationRoot`;
- do not use packaging runtime namespace for claims;
- add lease identity fields required by the contract.
```

### Full target shown text

```text
Deliverables:

- move conceptual claim/session/assignment/lease resolution behind
  `runtimeCoordinationRoot`;
- do not use packaging runtime namespace for claims;
- add lease identity fields required by the contract.
```

### Unified diff

```diff
No text difference.
```

## claim_e718809467cdfe0d5f20c026f6bfbcb0

Source: `docs/architect/workspace-topology-roadmap.md#unheaded-block-24`. Target: `docs/platform/system-architecture/architecture/workspace-topology-roadmap.md#unheaded-block-26`.

Mechanical class: Unit-exact. Source digest: `84b06b2111ea033b185dd4419360533e081320c343bae059e8136878418f1ba0`. Target digest: `84b06b2111ea033b185dd4419360533e081320c343bae059e8136878418f1ba0`.

Full shown source SHA256: `84b06b2111ea033b185dd4419360533e081320c343bae059e8136878418f1ba0`. Full shown target SHA256: `84b06b2111ea033b185dd4419360533e081320c343bae059e8136878418f1ba0`.

### Proposed decision

```json
{
  "claimId": "claim_e718809467cdfe0d5f20c026f6bfbcb0",
  "sourceUnitDigest": "84b06b2111ea033b185dd4419360533e081320c343bae059e8136878418f1ba0",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology-roadmap.md",
  "targetAnchor": "unheaded-block-26",
  "targetUnitDigest": "84b06b2111ea033b185dd4419360533e081320c343bae059e8136878418f1ba0",
  "targetAncestry": [
    "Workspace Topology Roadmap",
    "Migration Slices",
    "T3. Runtime Coordination Root Split"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/workspace-topology-roadmap.md#unheaded-block-24 (lines 151–154) into docs/platform/system-architecture/architecture/workspace-topology-roadmap.md#unheaded-block-26 (lines 174–177), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
Proof:

- linked worktrees share intended coordination state; corrupt/ambiguous leases
  fail closed.
```

### Full target shown text

```text
Proof:

- linked worktrees share intended coordination state; corrupt/ambiguous leases
  fail closed.
```

### Unified diff

```diff
No text difference.
```

## claim_a532d8047933a351d2583484bcdbe8ce

Source: `docs/architect/workspace-topology-roadmap.md#t4-hot-history-relocation`. Target: `docs/platform/system-architecture/architecture/workspace-topology-roadmap.md#t4-hot-history-relocation`.

Mechanical class: Weak-exact. Source digest: `d36ce2e6d82dd216ba41df0a493d0797aa8315f079b6ab2ae513dad8e3218694`. Target digest: `d36ce2e6d82dd216ba41df0a493d0797aa8315f079b6ab2ae513dad8e3218694`.

Full shown source SHA256: `c4cd0b6d79973be67f604d748e35386b7f2895d399a84d39792f20ca888040e7`. Full shown target SHA256: `c4cd0b6d79973be67f604d748e35386b7f2895d399a84d39792f20ca888040e7`.

### Proposed decision

```json
{
  "claimId": "claim_a532d8047933a351d2583484bcdbe8ce",
  "sourceUnitDigest": "d36ce2e6d82dd216ba41df0a493d0797aa8315f079b6ab2ae513dad8e3218694",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology-roadmap.md",
  "targetAnchor": "t4-hot-history-relocation",
  "targetUnitDigest": "d36ce2e6d82dd216ba41df0a493d0797aa8315f079b6ab2ae513dad8e3218694",
  "targetAncestry": [
    "Workspace Topology Roadmap",
    "Migration Slices"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. Carry the complete heading at docs/architect/workspace-topology-roadmap.md#t4-hot-history-relocation (lines 156–156) into docs/platform/system-architecture/architecture/workspace-topology-roadmap.md#t4-hot-history-relocation (lines 179–179), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
### T4. Hot History Relocation

Deliverables:

- move hot event writes out of tracked workspace tree;
- keep import/replay from existing `.fgos/events.jsonl` and `.fgos/events/`;
- introduce sealed checkpoint writer/reader.

Proof:

- submit/return/pick mutate work history without dirtying main;
- old tracked event history remains readable.
```

### Full target shown text

```text
### T4. Hot History Relocation

Deliverables:

- move hot event writes out of tracked workspace tree;
- keep import/replay from existing `.fgos/events.jsonl` and `.fgos/events/`;
- introduce sealed checkpoint writer/reader.

Proof:

- submit/return/pick mutate work history without dirtying main;
- old tracked event history remains readable.
```

### Unified diff

```diff
No text difference.
```

## claim_5973fcbd4029b2ae8512a31f2b78d5de

Source: `docs/architect/workspace-topology-roadmap.md#unheaded-block-25`. Target: `docs/platform/system-architecture/architecture/workspace-topology-roadmap.md#unheaded-block-27`.

Mechanical class: Unit-exact. Source digest: `a80eb8fc6ebc4ce955b365cde2da732fb99d897d6c19026002995737564a035b`. Target digest: `a80eb8fc6ebc4ce955b365cde2da732fb99d897d6c19026002995737564a035b`.

Full shown source SHA256: `a80eb8fc6ebc4ce955b365cde2da732fb99d897d6c19026002995737564a035b`. Full shown target SHA256: `a80eb8fc6ebc4ce955b365cde2da732fb99d897d6c19026002995737564a035b`.

### Proposed decision

```json
{
  "claimId": "claim_5973fcbd4029b2ae8512a31f2b78d5de",
  "sourceUnitDigest": "a80eb8fc6ebc4ce955b365cde2da732fb99d897d6c19026002995737564a035b",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology-roadmap.md",
  "targetAnchor": "unheaded-block-27",
  "targetUnitDigest": "a80eb8fc6ebc4ce955b365cde2da732fb99d897d6c19026002995737564a035b",
  "targetAncestry": [
    "Workspace Topology Roadmap",
    "Migration Slices",
    "T4. Hot History Relocation"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/workspace-topology-roadmap.md#unheaded-block-25 (lines 158–162) into docs/platform/system-architecture/architecture/workspace-topology-roadmap.md#unheaded-block-27 (lines 181–185), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
Deliverables:

- move hot event writes out of tracked workspace tree;
- keep import/replay from existing `.fgos/events.jsonl` and `.fgos/events/`;
- introduce sealed checkpoint writer/reader.
```

### Full target shown text

```text
Deliverables:

- move hot event writes out of tracked workspace tree;
- keep import/replay from existing `.fgos/events.jsonl` and `.fgos/events/`;
- introduce sealed checkpoint writer/reader.
```

### Unified diff

```diff
No text difference.
```

## claim_9f0713814d6fdee48504b3fd61b5e40e

Source: `docs/architect/workspace-topology-roadmap.md#unheaded-block-26`. Target: `docs/platform/system-architecture/architecture/workspace-topology-roadmap.md#unheaded-block-28`.

Mechanical class: Unit-exact. Source digest: `2b0cfd5674909382dae7f9b1f8e2825cc68570a39a5fefddf8ed8167007bd126`. Target digest: `2b0cfd5674909382dae7f9b1f8e2825cc68570a39a5fefddf8ed8167007bd126`.

Full shown source SHA256: `2b0cfd5674909382dae7f9b1f8e2825cc68570a39a5fefddf8ed8167007bd126`. Full shown target SHA256: `2b0cfd5674909382dae7f9b1f8e2825cc68570a39a5fefddf8ed8167007bd126`.

### Proposed decision

```json
{
  "claimId": "claim_9f0713814d6fdee48504b3fd61b5e40e",
  "sourceUnitDigest": "2b0cfd5674909382dae7f9b1f8e2825cc68570a39a5fefddf8ed8167007bd126",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology-roadmap.md",
  "targetAnchor": "unheaded-block-28",
  "targetUnitDigest": "2b0cfd5674909382dae7f9b1f8e2825cc68570a39a5fefddf8ed8167007bd126",
  "targetAncestry": [
    "Workspace Topology Roadmap",
    "Migration Slices",
    "T4. Hot History Relocation"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/workspace-topology-roadmap.md#unheaded-block-26 (lines 164–167) into docs/platform/system-architecture/architecture/workspace-topology-roadmap.md#unheaded-block-28 (lines 187–190), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
Proof:

- submit/return/pick mutate work history without dirtying main;
- old tracked event history remains readable.
```

### Full target shown text

```text
Proof:

- submit/return/pick mutate work history without dirtying main;
- old tracked event history remains readable.
```

### Unified diff

```diff
No text difference.
```

## claim_121db32937da7f70aab171347b222eb4

Source: `docs/architect/workspace-topology-roadmap.md#t5-workspace-activation-binding`. Target: `docs/platform/system-architecture/architecture/workspace-topology-roadmap.md#t5-workspace-activation-binding`.

Mechanical class: Weak-exact. Source digest: `cb62f78be3b55ece8ef9d1389e15013ca8670573c9b6b5dd1075562be274aed3`. Target digest: `cb62f78be3b55ece8ef9d1389e15013ca8670573c9b6b5dd1075562be274aed3`.

Full shown source SHA256: `b0feb156deaf58c1b1eb56640f5c3483783f92f6be309b2463b230c9b558d24d`. Full shown target SHA256: `b0feb156deaf58c1b1eb56640f5c3483783f92f6be309b2463b230c9b558d24d`.

### Proposed decision

```json
{
  "claimId": "claim_121db32937da7f70aab171347b222eb4",
  "sourceUnitDigest": "cb62f78be3b55ece8ef9d1389e15013ca8670573c9b6b5dd1075562be274aed3",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology-roadmap.md",
  "targetAnchor": "t5-workspace-activation-binding",
  "targetUnitDigest": "cb62f78be3b55ece8ef9d1389e15013ca8670573c9b6b5dd1075562be274aed3",
  "targetAncestry": [
    "Workspace Topology Roadmap",
    "Migration Slices"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. Carry the complete heading at docs/architect/workspace-topology-roadmap.md#t5-workspace-activation-binding (lines 169–169) into docs/platform/system-architecture/architecture/workspace-topology-roadmap.md#t5-workspace-activation-binding (lines 192–192), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
### T5. Workspace Activation Binding

Deliverables:

- shared machine release store;
- per-workspace activation binding;
- runtime compatibility check against `workStateId`;
- candidate preparation before ready publish.

Proof:

- two worktrees activate different runtime digests without changing each other.
```

### Full target shown text

```text
### T5. Workspace Activation Binding

Deliverables:

- shared machine release store;
- per-workspace activation binding;
- runtime compatibility check against `workStateId`;
- candidate preparation before ready publish.

Proof:

- two worktrees activate different runtime digests without changing each other.
```

### Unified diff

```diff
No text difference.
```

## claim_c36cb70eff5c072dfdd129439a9ebb97

Source: `docs/architect/workspace-topology-roadmap.md#unheaded-block-27`. Target: `docs/platform/system-architecture/architecture/workspace-topology-roadmap.md#unheaded-block-29`.

Mechanical class: Unit-exact. Source digest: `fa43574b83f0a3428e8b010bb7be2e0d4fca0b7503d30e2e875e97c8117a5fac`. Target digest: `fa43574b83f0a3428e8b010bb7be2e0d4fca0b7503d30e2e875e97c8117a5fac`.

Full shown source SHA256: `fa43574b83f0a3428e8b010bb7be2e0d4fca0b7503d30e2e875e97c8117a5fac`. Full shown target SHA256: `fa43574b83f0a3428e8b010bb7be2e0d4fca0b7503d30e2e875e97c8117a5fac`.

### Proposed decision

```json
{
  "claimId": "claim_c36cb70eff5c072dfdd129439a9ebb97",
  "sourceUnitDigest": "fa43574b83f0a3428e8b010bb7be2e0d4fca0b7503d30e2e875e97c8117a5fac",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology-roadmap.md",
  "targetAnchor": "unheaded-block-29",
  "targetUnitDigest": "fa43574b83f0a3428e8b010bb7be2e0d4fca0b7503d30e2e875e97c8117a5fac",
  "targetAncestry": [
    "Workspace Topology Roadmap",
    "Migration Slices",
    "T5. Workspace Activation Binding"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/workspace-topology-roadmap.md#unheaded-block-27 (lines 171–176) into docs/platform/system-architecture/architecture/workspace-topology-roadmap.md#unheaded-block-29 (lines 194–199), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
Deliverables:

- shared machine release store;
- per-workspace activation binding;
- runtime compatibility check against `workStateId`;
- candidate preparation before ready publish.
```

### Full target shown text

```text
Deliverables:

- shared machine release store;
- per-workspace activation binding;
- runtime compatibility check against `workStateId`;
- candidate preparation before ready publish.
```

### Unified diff

```diff
No text difference.
```

## claim_0fc855a47306dca4d83ce075166fca35

Source: `docs/architect/workspace-topology-roadmap.md#unheaded-block-28`. Target: `docs/platform/system-architecture/architecture/workspace-topology-roadmap.md#unheaded-block-30`.

Mechanical class: Unit-exact. Source digest: `c4e1ec6da488654ae7948612ea8b01e423cb301f23425438afda0f8fcedb651f`. Target digest: `c4e1ec6da488654ae7948612ea8b01e423cb301f23425438afda0f8fcedb651f`.

Full shown source SHA256: `c4e1ec6da488654ae7948612ea8b01e423cb301f23425438afda0f8fcedb651f`. Full shown target SHA256: `c4e1ec6da488654ae7948612ea8b01e423cb301f23425438afda0f8fcedb651f`.

### Proposed decision

```json
{
  "claimId": "claim_0fc855a47306dca4d83ce075166fca35",
  "sourceUnitDigest": "c4e1ec6da488654ae7948612ea8b01e423cb301f23425438afda0f8fcedb651f",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology-roadmap.md",
  "targetAnchor": "unheaded-block-30",
  "targetUnitDigest": "c4e1ec6da488654ae7948612ea8b01e423cb301f23425438afda0f8fcedb651f",
  "targetAncestry": [
    "Workspace Topology Roadmap",
    "Migration Slices",
    "T5. Workspace Activation Binding"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/workspace-topology-roadmap.md#unheaded-block-28 (lines 178–180) into docs/platform/system-architecture/architecture/workspace-topology-roadmap.md#unheaded-block-30 (lines 201–203), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
Proof:

- two worktrees activate different runtime digests without changing each other.
```

### Full target shown text

```text
Proof:

- two worktrees activate different runtime digests without changing each other.
```

### Unified diff

```diff
No text difference.
```

## claim_7d445901aa219257dc794f950e30f343

Source: `docs/architect/workspace-topology-roadmap.md#t6-projection-ledger`. Target: `docs/platform/system-architecture/architecture/workspace-topology-roadmap.md#t6-projection-ledger`.

Mechanical class: Weak-exact. Source digest: `15dacda45e3c695c442cd8ee7b4133af9a799ed71a956848601c495cd30ad57e`. Target digest: `15dacda45e3c695c442cd8ee7b4133af9a799ed71a956848601c495cd30ad57e`.

Full shown source SHA256: `6def7d134d9b455f58703490849cb5c3239a81e58bdc0877601ec2b921a6b0aa`. Full shown target SHA256: `6def7d134d9b455f58703490849cb5c3239a81e58bdc0877601ec2b921a6b0aa`.

### Proposed decision

```json
{
  "claimId": "claim_7d445901aa219257dc794f950e30f343",
  "sourceUnitDigest": "15dacda45e3c695c442cd8ee7b4133af9a799ed71a956848601c495cd30ad57e",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology-roadmap.md",
  "targetAnchor": "t6-projection-ledger",
  "targetUnitDigest": "15dacda45e3c695c442cd8ee7b4133af9a799ed71a956848601c495cd30ad57e",
  "targetAncestry": [
    "Workspace Topology Roadmap",
    "Migration Slices"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. Carry the complete heading at docs/architect/workspace-topology-roadmap.md#t6-projection-ledger (lines 182–182) into docs/platform/system-architecture/architecture/workspace-topology-roadmap.md#t6-projection-ledger (lines 205–205), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
### T6. Projection Ledger

Deliverables:

- per-workspace projection ledger;
- ownership classes;
- materialization for skills/agents/prose/hooks;
- clean dogfood/product separation.

Proof:

- projection repair refuses source-owned collisions and can cleanly remove or
  update generated-owned projections.
```

### Full target shown text

```text
### T6. Projection Ledger

Deliverables:

- per-workspace projection ledger;
- ownership classes;
- materialization for skills/agents/prose/hooks;
- clean dogfood/product separation.

Proof:

- projection repair refuses source-owned collisions and can cleanly remove or
  update generated-owned projections.
```

### Unified diff

```diff
No text difference.
```

## claim_253043973fb179992e957b7fd47931ea

Source: `docs/architect/workspace-topology-roadmap.md#unheaded-block-29`. Target: `docs/platform/system-architecture/architecture/workspace-topology-roadmap.md#unheaded-block-31`.

Mechanical class: Unit-exact. Source digest: `9dc2626df777eaeeec2523890e8843b184f40c9b23c497a78a9f4c39caab16a5`. Target digest: `9dc2626df777eaeeec2523890e8843b184f40c9b23c497a78a9f4c39caab16a5`.

Full shown source SHA256: `9dc2626df777eaeeec2523890e8843b184f40c9b23c497a78a9f4c39caab16a5`. Full shown target SHA256: `9dc2626df777eaeeec2523890e8843b184f40c9b23c497a78a9f4c39caab16a5`.

### Proposed decision

```json
{
  "claimId": "claim_253043973fb179992e957b7fd47931ea",
  "sourceUnitDigest": "9dc2626df777eaeeec2523890e8843b184f40c9b23c497a78a9f4c39caab16a5",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology-roadmap.md",
  "targetAnchor": "unheaded-block-31",
  "targetUnitDigest": "9dc2626df777eaeeec2523890e8843b184f40c9b23c497a78a9f4c39caab16a5",
  "targetAncestry": [
    "Workspace Topology Roadmap",
    "Migration Slices",
    "T6. Projection Ledger"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/workspace-topology-roadmap.md#unheaded-block-29 (lines 184–189) into docs/platform/system-architecture/architecture/workspace-topology-roadmap.md#unheaded-block-31 (lines 207–212), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
Deliverables:

- per-workspace projection ledger;
- ownership classes;
- materialization for skills/agents/prose/hooks;
- clean dogfood/product separation.
```

### Full target shown text

```text
Deliverables:

- per-workspace projection ledger;
- ownership classes;
- materialization for skills/agents/prose/hooks;
- clean dogfood/product separation.
```

### Unified diff

```diff
No text difference.
```

## claim_4ac91c5819620fd49226a95c6422a2c6

Source: `docs/architect/workspace-topology-roadmap.md#unheaded-block-30`. Target: `docs/platform/system-architecture/architecture/workspace-topology-roadmap.md#unheaded-block-32`.

Mechanical class: Unit-exact. Source digest: `777d543b105e0fd370384f612140fbe3c5c132a8a95e7a1d2a82706d1d783f8d`. Target digest: `777d543b105e0fd370384f612140fbe3c5c132a8a95e7a1d2a82706d1d783f8d`.

Full shown source SHA256: `777d543b105e0fd370384f612140fbe3c5c132a8a95e7a1d2a82706d1d783f8d`. Full shown target SHA256: `777d543b105e0fd370384f612140fbe3c5c132a8a95e7a1d2a82706d1d783f8d`.

### Proposed decision

```json
{
  "claimId": "claim_4ac91c5819620fd49226a95c6422a2c6",
  "sourceUnitDigest": "777d543b105e0fd370384f612140fbe3c5c132a8a95e7a1d2a82706d1d783f8d",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology-roadmap.md",
  "targetAnchor": "unheaded-block-32",
  "targetUnitDigest": "777d543b105e0fd370384f612140fbe3c5c132a8a95e7a1d2a82706d1d783f8d",
  "targetAncestry": [
    "Workspace Topology Roadmap",
    "Migration Slices",
    "T6. Projection Ledger"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/workspace-topology-roadmap.md#unheaded-block-30 (lines 191–194) into docs/platform/system-architecture/architecture/workspace-topology-roadmap.md#unheaded-block-32 (lines 214–217), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
Proof:

- projection repair refuses source-owned collisions and can cleanly remove or
  update generated-owned projections.
```

### Full target shown text

```text
Proof:

- projection repair refuses source-owned collisions and can cleanly remove or
  update generated-owned projections.
```

### Unified diff

```diff
No text difference.
```

## claim_cca790b0db270bc9d81b8830e6e83485

Source: `docs/architect/workspace-topology-roadmap.md#sequencing-rule`. Target: `docs/platform/system-architecture/architecture/workspace-topology-roadmap.md#sequencing-rule`.

Mechanical class: Weak-exact. Source digest: `583f084bf964af85fb8a67e3cd35d9aa8d5cbaa76af2e47dcc48e1ef24fe82da`. Target digest: `583f084bf964af85fb8a67e3cd35d9aa8d5cbaa76af2e47dcc48e1ef24fe82da`.

Full shown source SHA256: `c16b0952b9a46f19a9f3a73ce20e30c49352b21977caf4efb1f7c2a00044d7bb`. Full shown target SHA256: `c16b0952b9a46f19a9f3a73ce20e30c49352b21977caf4efb1f7c2a00044d7bb`.

### Proposed decision

```json
{
  "claimId": "claim_cca790b0db270bc9d81b8830e6e83485",
  "sourceUnitDigest": "583f084bf964af85fb8a67e3cd35d9aa8d5cbaa76af2e47dcc48e1ef24fe82da",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology-roadmap.md",
  "targetAnchor": "sequencing-rule",
  "targetUnitDigest": "583f084bf964af85fb8a67e3cd35d9aa8d5cbaa76af2e47dcc48e1ef24fe82da",
  "targetAncestry": [
    "Workspace Topology Roadmap"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. Carry the complete heading at docs/architect/workspace-topology-roadmap.md#sequencing-rule (lines 196–196) into docs/platform/system-architecture/architecture/workspace-topology-roadmap.md#sequencing-rule (lines 219–219), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
## Sequencing Rule

Packaging/distribution may proceed with release-tree and manifest work in
parallel, but activation, shims, upgrade, and Rust CLI cutover must not bypass
the topology gates above.
```

### Full target shown text

```text
## Sequencing Rule

Packaging/distribution may proceed with release-tree and manifest work in
parallel, but activation, shims, upgrade, and Rust CLI cutover must not bypass
the topology gates above.
```

### Unified diff

```diff
No text difference.
```

## claim_4661a8c370f186b3f1fe66cde7ec37e3

Source: `docs/architect/workspace-topology-roadmap.md#unheaded-block-31`. Target: `docs/platform/system-architecture/architecture/workspace-topology-roadmap.md#unheaded-block-33`.

Mechanical class: Unit-exact. Source digest: `150a2a559de453ceb6079cdb1a766c0caa8da065b86bfe34a9810d2b5442a903`. Target digest: `150a2a559de453ceb6079cdb1a766c0caa8da065b86bfe34a9810d2b5442a903`.

Full shown source SHA256: `150a2a559de453ceb6079cdb1a766c0caa8da065b86bfe34a9810d2b5442a903`. Full shown target SHA256: `150a2a559de453ceb6079cdb1a766c0caa8da065b86bfe34a9810d2b5442a903`.

### Proposed decision

```json
{
  "claimId": "claim_4661a8c370f186b3f1fe66cde7ec37e3",
  "sourceUnitDigest": "150a2a559de453ceb6079cdb1a766c0caa8da065b86bfe34a9810d2b5442a903",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology-roadmap.md",
  "targetAnchor": "unheaded-block-33",
  "targetUnitDigest": "150a2a559de453ceb6079cdb1a766c0caa8da065b86bfe34a9810d2b5442a903",
  "targetAncestry": [
    "Workspace Topology Roadmap",
    "Sequencing Rule"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/workspace-topology-roadmap.md#unheaded-block-31 (lines 198–200) into docs/platform/system-architecture/architecture/workspace-topology-roadmap.md#unheaded-block-33 (lines 221–223), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
Packaging/distribution may proceed with release-tree and manifest work in
parallel, but activation, shims, upgrade, and Rust CLI cutover must not bypass
the topology gates above.
```

### Full target shown text

```text
Packaging/distribution may proceed with release-tree and manifest work in
parallel, but activation, shims, upgrade, and Rust CLI cutover must not bypass
the topology gates above.
```

### Unified diff

```diff
No text difference.
```
