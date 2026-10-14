# Bounded whole-system source review request

Content commit: `a8a10abc1a24218518a14764f68c8d86f4810f91`. Author session: `codex-session:37@2026-10-15`. Review mode requested: ordinary.

Shard: `plans/260925-documentation-authority-unification/ledger/decisions/s6-whole-system-workspace-topology-audit.json`. Part 1/1; entries: **55**. Sidecar: `review-request-261015-0450-whole-system-11.md.json`.

Read review-brief.md, owner-answers.md A28–A37, frozen whole-system map, constitution, vocabulary and shard schema. Apply A36: mechanically check every row (full digest recompute, anchor check, shard/pack equality); deeply read the reviewer-seeded sample plus every differing-digest row in both directions with its diff. Preserve conditions, qualifiers, dated status and complete payload; verify one owner and labelled additions. No approval is supplied here.

Step 6’s closing review is a **checkpoint review whose sensitivity pack the reviewer holds**. The author has not created, seen or selected that pack/key. Ordinary review and A36 sampling do not replace checkpoint sensitivity.

Ordinary verdict contract: `Reviewer: <independent identity>`, `Review mode: ordinary`, request/content/shard pins; one own note and full 64-hex shown-unit digests per row. Use ok/rework/hold. Consolidate parts into a complete report for the original shard before unchanged ordinary application; never edit decisions manually.

| Claim | Verdict | Note | Source digest | Target digest |
|---|---|---|---|---|

A36 mandatory differing-digest rows (2): `claim_f6b7a8a68f6de66de68356df609e40b8`, `claim_42e7c719607bfe7fd194900be5ff3f3e`.

Absent-target rows (0): none.

This pack has 14 Weak-exact/Judgment rows; reviewer independently draws/records at least 10 by seed (>=15%, minimum 10, all if fewer), plus every differing pair listed above. Each verdict note says deep or mechanical. If >3% of deep-read rows need rework, deeply read the complete pack before reporting. Author selected no sample. Whole batch: 300 Unit-exact, 392 Weak-exact, 134 Judgment, all 826 pending; 123 mandatory differing pairs. The 79-row batch-wide lower bound does not replace each pack minimum.

Reverse review: the separate native candidate-unverified request/list covers the complete scoped population; it is not reset per sliced pack. Full shown text hashes below bind payload separately from native heading identity digests.

## claim_f6b7a8a68f6de66de68356df609e40b8

Source: `docs/architect/workspace-topology-audit.md#workspace-topology-codebase-audit`. Target: `docs/platform/system-architecture/architecture/workspace-topology-audit.md#workspace-topology-codebase-audit`.

Mechanical class: Judgment. Source digest: `9ee83d73f562002c39426d8de0579ce461f8d83e5d3d81ee36ee7141331220e9`. Target digest: `a8d8116e6f670bb92082014b0e5d37e319feeebd20537acf41eb4755757db9c5`.

Full shown source SHA256: `5be3bfcbf118ef97f03e92b5807ab82aea7f5ad745afdbeaa6563c0f64547e6f`. Full shown target SHA256: `94b1df8207daa69522aaf94046f82042cb03f91213ba60073d66bc5909ab3cbc`.

### Proposed decision

```json
{
  "claimId": "claim_f6b7a8a68f6de66de68356df609e40b8",
  "sourceUnitDigest": "9ee83d73f562002c39426d8de0579ce461f8d83e5d3d81ee36ee7141331220e9",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology-audit.md",
  "targetAnchor": "workspace-topology-codebase-audit",
  "targetUnitDigest": "a8d8116e6f670bb92082014b0e5d37e319feeebd20537acf41eb4755757db9c5",
  "targetAncestry": [],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Judgment: no target digest match. Carry the complete heading at docs/architect/workspace-topology-audit.md#workspace-topology-codebase-audit (lines 1–1) into docs/platform/system-architecture/architecture/workspace-topology-audit.md#workspace-topology-codebase-audit (lines 1–1), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. Digest differences come only from the recorded candidate header/frontmatter fence, heading-level shift or physical relative-link rebasing; full before/after units and line mapping are in authoring accounting. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
# Workspace Topology Codebase Audit

**Status:** Evidence snapshot for the topology contract.
**Date:** 2026-09-04.
**Evidence scope:** Current code and generated specs in this checkout.
**Contract:** [workspace-topology.md](workspace-topology.md).

This document records why the topology contract is needed. It is allowed to go
stale as code changes; the contract should not.
```

### Full target shown text

````text
# Workspace Topology Codebase Audit

```txt
Document type: Architecture
Audience: Human reviewer, architect, maintainer, agent
Purpose: Preserve the complete workspace-topology-audit.md source at its frozen-map candidate owner
Design status: Candidate
Implementation: Partial — inherited source qualifications; not independently truth-verified
Provenance: docs/architect/workspace-topology-audit.md at 69dd3ee7fd84bc5e93fe9c75d63622d4f5aa8539 (blob 024cac1f17203b20d4fcfdf95d1672c17fd4e5a5)
Writer type: Agent carriage; independent review pending
Canonical for: Nothing until promotion; current source remains docs/architect/workspace-topology-audit.md
Use this when: Reviewing whole-system candidate carriage and placement
Do not use this for: Inferring implementation, promotion or superseding source authority
Last reviewed: Pending independent review
Related:
- docs/architect/workspace-topology-audit.md
- docs/platform/component-boundary.md
- docs/platform/architecture-map.md
Supersedes: None — candidate only
Superseded by: None
```

Added in candidate: migration metadata and physical link rebasing. Original source metadata, dates, design limits and historic claims below are provenance, not fresh review. Current truth is unverified; A28 requires sampled truth review at this checkpoint and full truth review at promotion.


**Status:** Evidence snapshot for the topology contract.
**Date:** 2026-09-04.
**Evidence scope:** Current code and generated specs in this checkout.
**Contract:** [workspace-topology.md](../../../architect/workspace-topology.md).

This document records why the topology contract is needed. It is allowed to go
stale as code changes; the contract should not.
````

### Unified diff

````diff
--- docs/architect/workspace-topology-audit.md#workspace-topology-codebase-audit
+++ docs/platform/system-architecture/architecture/workspace-topology-audit.md#workspace-topology-codebase-audit
@@ -1,9 +1,32 @@
 # Workspace Topology Codebase Audit
+
+```txt
+Document type: Architecture
+Audience: Human reviewer, architect, maintainer, agent
+Purpose: Preserve the complete workspace-topology-audit.md source at its frozen-map candidate owner
+Design status: Candidate
+Implementation: Partial — inherited source qualifications; not independently truth-verified
+Provenance: docs/architect/workspace-topology-audit.md at 69dd3ee7fd84bc5e93fe9c75d63622d4f5aa8539 (blob 024cac1f17203b20d4fcfdf95d1672c17fd4e5a5)
+Writer type: Agent carriage; independent review pending
+Canonical for: Nothing until promotion; current source remains docs/architect/workspace-topology-audit.md
+Use this when: Reviewing whole-system candidate carriage and placement
+Do not use this for: Inferring implementation, promotion or superseding source authority
+Last reviewed: Pending independent review
+Related:
+- docs/architect/workspace-topology-audit.md
+- docs/platform/component-boundary.md
+- docs/platform/architecture-map.md
+Supersedes: None — candidate only
+Superseded by: None
+```
+
+Added in candidate: migration metadata and physical link rebasing. Original source metadata, dates, design limits and historic claims below are provenance, not fresh review. Current truth is unverified; A28 requires sampled truth review at this checkpoint and full truth review at promotion.
+
 
 **Status:** Evidence snapshot for the topology contract.
 **Date:** 2026-09-04.
 **Evidence scope:** Current code and generated specs in this checkout.
-**Contract:** [workspace-topology.md](workspace-topology.md).
+**Contract:** [workspace-topology.md](../../../architect/workspace-topology.md).
 
 This document records why the topology contract is needed. It is allowed to go
 stale as code changes; the contract should not.

````

## claim_42e7c719607bfe7fd194900be5ff3f3e

Source: `docs/architect/workspace-topology-audit.md#unheaded-block-1`. Target: `docs/platform/system-architecture/architecture/workspace-topology-audit.md#unheaded-block-3`.

Mechanical class: Judgment. Source digest: `a6f75b670446ea96971dc97cc64d95daf3e9eaf59d656368bf86e84064dfbd48`. Target digest: `cfa895f74c8c3e49d026e8c6da06ead2f550ec61f6d1ccbc301ed4b83cd6e35c`.

Full shown source SHA256: `a6f75b670446ea96971dc97cc64d95daf3e9eaf59d656368bf86e84064dfbd48`. Full shown target SHA256: `cfa895f74c8c3e49d026e8c6da06ead2f550ec61f6d1ccbc301ed4b83cd6e35c`.

### Proposed decision

```json
{
  "claimId": "claim_42e7c719607bfe7fd194900be5ff3f3e",
  "sourceUnitDigest": "a6f75b670446ea96971dc97cc64d95daf3e9eaf59d656368bf86e84064dfbd48",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology-audit.md",
  "targetAnchor": "unheaded-block-3",
  "targetUnitDigest": "cfa895f74c8c3e49d026e8c6da06ead2f550ec61f6d1ccbc301ed4b83cd6e35c",
  "targetAncestry": [
    "Workspace Topology Codebase Audit"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Judgment: no target digest match. Carry the complete unheaded-block at docs/architect/workspace-topology-audit.md#unheaded-block-1 (lines 3–6) into docs/platform/system-architecture/architecture/workspace-topology-audit.md#unheaded-block-3 (lines 26–29), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. Digest differences come only from the recorded candidate header/frontmatter fence, heading-level shift or physical relative-link rebasing; full before/after units and line mapping are in authoring accounting. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
**Status:** Evidence snapshot for the topology contract.
**Date:** 2026-09-04.
**Evidence scope:** Current code and generated specs in this checkout.
**Contract:** [workspace-topology.md](workspace-topology.md).
```

### Full target shown text

```text
**Status:** Evidence snapshot for the topology contract.
**Date:** 2026-09-04.
**Evidence scope:** Current code and generated specs in this checkout.
**Contract:** [workspace-topology.md](../../../architect/workspace-topology.md).
```

### Unified diff

```diff
--- docs/architect/workspace-topology-audit.md#unheaded-block-1
+++ docs/platform/system-architecture/architecture/workspace-topology-audit.md#unheaded-block-3
@@ -1,4 +1,4 @@
 **Status:** Evidence snapshot for the topology contract.
 **Date:** 2026-09-04.
 **Evidence scope:** Current code and generated specs in this checkout.
-**Contract:** [workspace-topology.md](workspace-topology.md).
+**Contract:** [workspace-topology.md](../../../architect/workspace-topology.md).

```

## claim_678b8f5e9ccb142f6972b7cd5c33e125

Source: `docs/architect/workspace-topology-audit.md#unheaded-block-2`. Target: `docs/platform/system-architecture/architecture/workspace-topology-audit.md#unheaded-block-4`.

Mechanical class: Unit-exact. Source digest: `0b9a2e97e8517745222d012310395bbe9e4206f885bdf551a6b0c9e74b6337b3`. Target digest: `0b9a2e97e8517745222d012310395bbe9e4206f885bdf551a6b0c9e74b6337b3`.

Full shown source SHA256: `0b9a2e97e8517745222d012310395bbe9e4206f885bdf551a6b0c9e74b6337b3`. Full shown target SHA256: `0b9a2e97e8517745222d012310395bbe9e4206f885bdf551a6b0c9e74b6337b3`.

### Proposed decision

```json
{
  "claimId": "claim_678b8f5e9ccb142f6972b7cd5c33e125",
  "sourceUnitDigest": "0b9a2e97e8517745222d012310395bbe9e4206f885bdf551a6b0c9e74b6337b3",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology-audit.md",
  "targetAnchor": "unheaded-block-4",
  "targetUnitDigest": "0b9a2e97e8517745222d012310395bbe9e4206f885bdf551a6b0c9e74b6337b3",
  "targetAncestry": [
    "Workspace Topology Codebase Audit"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/workspace-topology-audit.md#unheaded-block-2 (lines 8–9) into docs/platform/system-architecture/architecture/workspace-topology-audit.md#unheaded-block-4 (lines 31–32), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
This document records why the topology contract is needed. It is allowed to go
stale as code changes; the contract should not.
```

### Full target shown text

```text
This document records why the topology contract is needed. It is allowed to go
stale as code changes; the contract should not.
```

### Unified diff

```diff
No text difference.
```

## claim_484284261561f6e9e7ac7aad9732f2dc

Source: `docs/architect/workspace-topology-audit.md#summary`. Target: `docs/platform/system-architecture/architecture/workspace-topology-audit.md#summary`.

Mechanical class: Weak-exact. Source digest: `f25272ec4e14c60cf6a718a86eec91dd04e51020391e11030b7f3ab791239c82`. Target digest: `f25272ec4e14c60cf6a718a86eec91dd04e51020391e11030b7f3ab791239c82`.

Full shown source SHA256: `a0104d6870809f70e19732ef403e182c2042c875441d95861cb95438542646fc`. Full shown target SHA256: `a0104d6870809f70e19732ef403e182c2042c875441d95861cb95438542646fc`.

### Proposed decision

```json
{
  "claimId": "claim_484284261561f6e9e7ac7aad9732f2dc",
  "sourceUnitDigest": "f25272ec4e14c60cf6a718a86eec91dd04e51020391e11030b7f3ab791239c82",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology-audit.md",
  "targetAnchor": "summary",
  "targetUnitDigest": "f25272ec4e14c60cf6a718a86eec91dd04e51020391e11030b7f3ab791239c82",
  "targetAncestry": [
    "Workspace Topology Codebase Audit"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. Carry the complete heading at docs/architect/workspace-topology-audit.md#summary (lines 11–11) into docs/platform/system-architecture/architecture/workspace-topology-audit.md#summary (lines 34–34), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

````text
## Summary

The current codebase has several strong local fixes:

- isolated worker branches/worktrees;
- per-writer event shards;
- event append plus derived-view refresh under one lock;
- gitignored cache/log/assignment/coordination buckets;
- active claim overlay;
- session registry lock;
- main-checkout lock and hook;
- setup/doctor registry.

The remaining problem is that these are not yet one coherent topology. Callers
can still choose "cwd", "repo root", "main checkout", or direct `.fgos` paths
case by case.

The current abstraction failure:

```txt
For this operation, which workspace's policy is read,
which work-state is mutated,
which coordination state is shared,
which runtime digest has writer authority,
and which checkout is allowed to become dirty?
```
````

### Full target shown text

````text
## Summary

The current codebase has several strong local fixes:

- isolated worker branches/worktrees;
- per-writer event shards;
- event append plus derived-view refresh under one lock;
- gitignored cache/log/assignment/coordination buckets;
- active claim overlay;
- session registry lock;
- main-checkout lock and hook;
- setup/doctor registry.

The remaining problem is that these are not yet one coherent topology. Callers
can still choose "cwd", "repo root", "main checkout", or direct `.fgos` paths
case by case.

The current abstraction failure:

```txt
For this operation, which workspace's policy is read,
which work-state is mutated,
which coordination state is shared,
which runtime digest has writer authority,
and which checkout is allowed to become dirty?
```
````

### Unified diff

```diff
No text difference.
```

## claim_8012dfbe583c056f3e5323691c905b8e

Source: `docs/architect/workspace-topology-audit.md#unheaded-block-3`. Target: `docs/platform/system-architecture/architecture/workspace-topology-audit.md#unheaded-block-5`.

Mechanical class: Unit-exact. Source digest: `20f325c2de03615c0847f2a77876fe32b05a9da3626fd2d8f76d73c044f7b145`. Target digest: `20f325c2de03615c0847f2a77876fe32b05a9da3626fd2d8f76d73c044f7b145`.

Full shown source SHA256: `20f325c2de03615c0847f2a77876fe32b05a9da3626fd2d8f76d73c044f7b145`. Full shown target SHA256: `20f325c2de03615c0847f2a77876fe32b05a9da3626fd2d8f76d73c044f7b145`.

### Proposed decision

```json
{
  "claimId": "claim_8012dfbe583c056f3e5323691c905b8e",
  "sourceUnitDigest": "20f325c2de03615c0847f2a77876fe32b05a9da3626fd2d8f76d73c044f7b145",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology-audit.md",
  "targetAnchor": "unheaded-block-5",
  "targetUnitDigest": "20f325c2de03615c0847f2a77876fe32b05a9da3626fd2d8f76d73c044f7b145",
  "targetAncestry": [
    "Workspace Topology Codebase Audit",
    "Summary"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/workspace-topology-audit.md#unheaded-block-3 (lines 13–13) into docs/platform/system-architecture/architecture/workspace-topology-audit.md#unheaded-block-5 (lines 36–36), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
The current codebase has several strong local fixes:
```

### Full target shown text

```text
The current codebase has several strong local fixes:
```

### Unified diff

```diff
No text difference.
```

## claim_242459af9ee6e5f6fd07d51fb4b6c462

Source: `docs/architect/workspace-topology-audit.md#unheaded-block-4`. Target: `docs/platform/system-architecture/architecture/workspace-topology-audit.md#unheaded-block-6`.

Mechanical class: Unit-exact. Source digest: `f497595370a1b07280b16d7cfbc0a5c9897805a01248dd13515497b44dc8442b`. Target digest: `f497595370a1b07280b16d7cfbc0a5c9897805a01248dd13515497b44dc8442b`.

Full shown source SHA256: `f497595370a1b07280b16d7cfbc0a5c9897805a01248dd13515497b44dc8442b`. Full shown target SHA256: `f497595370a1b07280b16d7cfbc0a5c9897805a01248dd13515497b44dc8442b`.

### Proposed decision

```json
{
  "claimId": "claim_242459af9ee6e5f6fd07d51fb4b6c462",
  "sourceUnitDigest": "f497595370a1b07280b16d7cfbc0a5c9897805a01248dd13515497b44dc8442b",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology-audit.md",
  "targetAnchor": "unheaded-block-6",
  "targetUnitDigest": "f497595370a1b07280b16d7cfbc0a5c9897805a01248dd13515497b44dc8442b",
  "targetAncestry": [
    "Workspace Topology Codebase Audit",
    "Summary"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/workspace-topology-audit.md#unheaded-block-4 (lines 15–22) into docs/platform/system-architecture/architecture/workspace-topology-audit.md#unheaded-block-6 (lines 38–45), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
- isolated worker branches/worktrees;
- per-writer event shards;
- event append plus derived-view refresh under one lock;
- gitignored cache/log/assignment/coordination buckets;
- active claim overlay;
- session registry lock;
- main-checkout lock and hook;
- setup/doctor registry.
```

### Full target shown text

```text
- isolated worker branches/worktrees;
- per-writer event shards;
- event append plus derived-view refresh under one lock;
- gitignored cache/log/assignment/coordination buckets;
- active claim overlay;
- session registry lock;
- main-checkout lock and hook;
- setup/doctor registry.
```

### Unified diff

```diff
No text difference.
```

## claim_1fe796ebe3864c929565215b74520457

Source: `docs/architect/workspace-topology-audit.md#unheaded-block-5`. Target: `docs/platform/system-architecture/architecture/workspace-topology-audit.md#unheaded-block-7`.

Mechanical class: Unit-exact. Source digest: `9d1e92753df3577e28902002b4554d6ef0282eb250246a8b1978c288f91ea03c`. Target digest: `9d1e92753df3577e28902002b4554d6ef0282eb250246a8b1978c288f91ea03c`.

Full shown source SHA256: `9d1e92753df3577e28902002b4554d6ef0282eb250246a8b1978c288f91ea03c`. Full shown target SHA256: `9d1e92753df3577e28902002b4554d6ef0282eb250246a8b1978c288f91ea03c`.

### Proposed decision

```json
{
  "claimId": "claim_1fe796ebe3864c929565215b74520457",
  "sourceUnitDigest": "9d1e92753df3577e28902002b4554d6ef0282eb250246a8b1978c288f91ea03c",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology-audit.md",
  "targetAnchor": "unheaded-block-7",
  "targetUnitDigest": "9d1e92753df3577e28902002b4554d6ef0282eb250246a8b1978c288f91ea03c",
  "targetAncestry": [
    "Workspace Topology Codebase Audit",
    "Summary"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/workspace-topology-audit.md#unheaded-block-5 (lines 24–26) into docs/platform/system-architecture/architecture/workspace-topology-audit.md#unheaded-block-7 (lines 47–49), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
The remaining problem is that these are not yet one coherent topology. Callers
can still choose "cwd", "repo root", "main checkout", or direct `.fgos` paths
case by case.
```

### Full target shown text

```text
The remaining problem is that these are not yet one coherent topology. Callers
can still choose "cwd", "repo root", "main checkout", or direct `.fgos` paths
case by case.
```

### Unified diff

```diff
No text difference.
```

## claim_bc9f4ca74b746e9348004efefbf6cf7a

Source: `docs/architect/workspace-topology-audit.md#unheaded-block-6`. Target: `docs/platform/system-architecture/architecture/workspace-topology-audit.md#unheaded-block-8`.

Mechanical class: Weak-exact. Source digest: `aaa7db94935edb904d2e682aac8dbe71c4edbba73c76f14b6339f7858de92ee4`. Target digest: `aaa7db94935edb904d2e682aac8dbe71c4edbba73c76f14b6339f7858de92ee4`.

Full shown source SHA256: `aaa7db94935edb904d2e682aac8dbe71c4edbba73c76f14b6339f7858de92ee4`. Full shown target SHA256: `aaa7db94935edb904d2e682aac8dbe71c4edbba73c76f14b6339f7858de92ee4`.

### Proposed decision

```json
{
  "claimId": "claim_bc9f4ca74b746e9348004efefbf6cf7a",
  "sourceUnitDigest": "aaa7db94935edb904d2e682aac8dbe71c4edbba73c76f14b6339f7858de92ee4",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology-audit.md",
  "targetAnchor": "unheaded-block-8",
  "targetUnitDigest": "aaa7db94935edb904d2e682aac8dbe71c4edbba73c76f14b6339f7858de92ee4",
  "targetAncestry": [
    "Workspace Topology Codebase Audit",
    "Summary"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. Carry the complete unheaded-block at docs/architect/workspace-topology-audit.md#unheaded-block-6 (lines 28–28) into docs/platform/system-architecture/architecture/workspace-topology-audit.md#unheaded-block-8 (lines 51–51), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
The current abstraction failure:
```

### Full target shown text

```text
The current abstraction failure:
```

### Unified diff

```diff
No text difference.
```

## claim_d2f8a5d3c736ac3d94a25509f9cf1874

Source: `docs/architect/workspace-topology-audit.md#unheaded-block-7`. Target: `docs/platform/system-architecture/architecture/workspace-topology-audit.md#unheaded-block-9`.

Mechanical class: Unit-exact. Source digest: `2de1229b62c1e2c9fb7c6b77737ce231dfb0ce9d00063eb9d3843431b16661d8`. Target digest: `2de1229b62c1e2c9fb7c6b77737ce231dfb0ce9d00063eb9d3843431b16661d8`.

Full shown source SHA256: `2de1229b62c1e2c9fb7c6b77737ce231dfb0ce9d00063eb9d3843431b16661d8`. Full shown target SHA256: `2de1229b62c1e2c9fb7c6b77737ce231dfb0ce9d00063eb9d3843431b16661d8`.

### Proposed decision

```json
{
  "claimId": "claim_d2f8a5d3c736ac3d94a25509f9cf1874",
  "sourceUnitDigest": "2de1229b62c1e2c9fb7c6b77737ce231dfb0ce9d00063eb9d3843431b16661d8",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology-audit.md",
  "targetAnchor": "unheaded-block-9",
  "targetUnitDigest": "2de1229b62c1e2c9fb7c6b77737ce231dfb0ce9d00063eb9d3843431b16661d8",
  "targetAncestry": [
    "Workspace Topology Codebase Audit",
    "Summary"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/workspace-topology-audit.md#unheaded-block-7 (lines 30–36) into docs/platform/system-architecture/architecture/workspace-topology-audit.md#unheaded-block-9 (lines 53–59), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

````text
```txt
For this operation, which workspace's policy is read,
which work-state is mutated,
which coordination state is shared,
which runtime digest has writer authority,
and which checkout is allowed to become dirty?
```
````

### Full target shown text

````text
```txt
For this operation, which workspace's policy is read,
which work-state is mutated,
which coordination state is shared,
which runtime digest has writer authority,
and which checkout is allowed to become dirty?
```
````

### Unified diff

```diff
No text difference.
```

## claim_ac5769f25adab46ecf0df2d412ca8834

Source: `docs/architect/workspace-topology-audit.md#a1-root-resolution-has-multiple-semantics`. Target: `docs/platform/system-architecture/architecture/workspace-topology-audit.md#a1-root-resolution-has-multiple-semantics`.

Mechanical class: Unit-exact. Source digest: `d4f96b51a226923633086c9ddf67b752093f8a935043bb0ae9d50d0ef2985a50`. Target digest: `d4f96b51a226923633086c9ddf67b752093f8a935043bb0ae9d50d0ef2985a50`.

Full shown source SHA256: `bb6adf5523911441ec82f4142cdc2a375a6038cd4015fd3e81d970afc77efd8b`. Full shown target SHA256: `bb6adf5523911441ec82f4142cdc2a375a6038cd4015fd3e81d970afc77efd8b`.

### Proposed decision

```json
{
  "claimId": "claim_ac5769f25adab46ecf0df2d412ca8834",
  "sourceUnitDigest": "d4f96b51a226923633086c9ddf67b752093f8a935043bb0ae9d50d0ef2985a50",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology-audit.md",
  "targetAnchor": "a1-root-resolution-has-multiple-semantics",
  "targetUnitDigest": "d4f96b51a226923633086c9ddf67b752093f8a935043bb0ae9d50d0ef2985a50",
  "targetAncestry": [
    "Workspace Topology Codebase Audit"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete heading at docs/architect/workspace-topology-audit.md#a1-root-resolution-has-multiple-semantics (lines 38–38) into docs/platform/system-architecture/architecture/workspace-topology-audit.md#a1-root-resolution-has-multiple-semantics (lines 61–61), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
## A1. Root Resolution Has Multiple Semantics

Observed code:

- `src/runner/paths.mjs` has `resolveRepoRoot(cwd, { strict: true })`, which
  returns `cwd` as-is. `bin/fgos.mjs` uses this for cwd-strict CLI behavior.
- `resolveRepoRoot(cwd)` shells out to `git rev-parse --show-toplevel`, meaning
  the current checkout/worktree.
- `resolveMainCheckoutRoot(cwd)` shells out through `--git-common-dir`, meaning
  the main checkout even from a linked worktree.
- `resolveContentRoot(stateRoot, id, docsRef)` compensates for the fact that
  design artifacts may live on an item worktree branch, not main.

Status: partially solved.

What is good:

- The code knows main and linked worktree are not equivalent.
- Some paths intentionally use main to avoid phantom `.fgos` state.
- Content lookup already has branch/worktree awareness.

Gap:

- Business logic still receives plain `dir`/`repoRoot` and can pick the wrong
  resolver.
- There is no single `TopologyContext` choke point.
```

### Full target shown text

```text
## A1. Root Resolution Has Multiple Semantics

Observed code:

- `src/runner/paths.mjs` has `resolveRepoRoot(cwd, { strict: true })`, which
  returns `cwd` as-is. `bin/fgos.mjs` uses this for cwd-strict CLI behavior.
- `resolveRepoRoot(cwd)` shells out to `git rev-parse --show-toplevel`, meaning
  the current checkout/worktree.
- `resolveMainCheckoutRoot(cwd)` shells out through `--git-common-dir`, meaning
  the main checkout even from a linked worktree.
- `resolveContentRoot(stateRoot, id, docsRef)` compensates for the fact that
  design artifacts may live on an item worktree branch, not main.

Status: partially solved.

What is good:

- The code knows main and linked worktree are not equivalent.
- Some paths intentionally use main to avoid phantom `.fgos` state.
- Content lookup already has branch/worktree awareness.

Gap:

- Business logic still receives plain `dir`/`repoRoot` and can pick the wrong
  resolver.
- There is no single `TopologyContext` choke point.
```

### Unified diff

```diff
No text difference.
```

## claim_be66cf0f91abb8388d78a904bba78e4c

Source: `docs/architect/workspace-topology-audit.md#unheaded-block-8`. Target: `docs/platform/system-architecture/architecture/workspace-topology-audit.md#unheaded-block-10`.

Mechanical class: Unit-exact. Source digest: `5c215d7e3cd4eef3a917c3deb36f665be11df4c47b305a434cd17e32b69c395e`. Target digest: `5c215d7e3cd4eef3a917c3deb36f665be11df4c47b305a434cd17e32b69c395e`.

Full shown source SHA256: `5c215d7e3cd4eef3a917c3deb36f665be11df4c47b305a434cd17e32b69c395e`. Full shown target SHA256: `5c215d7e3cd4eef3a917c3deb36f665be11df4c47b305a434cd17e32b69c395e`.

### Proposed decision

```json
{
  "claimId": "claim_be66cf0f91abb8388d78a904bba78e4c",
  "sourceUnitDigest": "5c215d7e3cd4eef3a917c3deb36f665be11df4c47b305a434cd17e32b69c395e",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology-audit.md",
  "targetAnchor": "unheaded-block-10",
  "targetUnitDigest": "5c215d7e3cd4eef3a917c3deb36f665be11df4c47b305a434cd17e32b69c395e",
  "targetAncestry": [
    "Workspace Topology Codebase Audit",
    "A1. Root Resolution Has Multiple Semantics"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/workspace-topology-audit.md#unheaded-block-8 (lines 40–49) into docs/platform/system-architecture/architecture/workspace-topology-audit.md#unheaded-block-10 (lines 63–72), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
Observed code:

- `src/runner/paths.mjs` has `resolveRepoRoot(cwd, { strict: true })`, which
  returns `cwd` as-is. `bin/fgos.mjs` uses this for cwd-strict CLI behavior.
- `resolveRepoRoot(cwd)` shells out to `git rev-parse --show-toplevel`, meaning
  the current checkout/worktree.
- `resolveMainCheckoutRoot(cwd)` shells out through `--git-common-dir`, meaning
  the main checkout even from a linked worktree.
- `resolveContentRoot(stateRoot, id, docsRef)` compensates for the fact that
  design artifacts may live on an item worktree branch, not main.
```

### Full target shown text

```text
Observed code:

- `src/runner/paths.mjs` has `resolveRepoRoot(cwd, { strict: true })`, which
  returns `cwd` as-is. `bin/fgos.mjs` uses this for cwd-strict CLI behavior.
- `resolveRepoRoot(cwd)` shells out to `git rev-parse --show-toplevel`, meaning
  the current checkout/worktree.
- `resolveMainCheckoutRoot(cwd)` shells out through `--git-common-dir`, meaning
  the main checkout even from a linked worktree.
- `resolveContentRoot(stateRoot, id, docsRef)` compensates for the fact that
  design artifacts may live on an item worktree branch, not main.
```

### Unified diff

```diff
No text difference.
```

## claim_caecefc4d9b6b795426aba159292b425

Source: `docs/architect/workspace-topology-audit.md#unheaded-block-9`. Target: `docs/platform/system-architecture/architecture/workspace-topology-audit.md#unheaded-block-11`.

Mechanical class: Weak-exact. Source digest: `12612166a04d5866ebf6bd4a9eff15e12e5ff8219ea4ae8c52fa1d8e6088c31f`. Target digest: `12612166a04d5866ebf6bd4a9eff15e12e5ff8219ea4ae8c52fa1d8e6088c31f`.

Full shown source SHA256: `12612166a04d5866ebf6bd4a9eff15e12e5ff8219ea4ae8c52fa1d8e6088c31f`. Full shown target SHA256: `12612166a04d5866ebf6bd4a9eff15e12e5ff8219ea4ae8c52fa1d8e6088c31f`.

### Proposed decision

```json
{
  "claimId": "claim_caecefc4d9b6b795426aba159292b425",
  "sourceUnitDigest": "12612166a04d5866ebf6bd4a9eff15e12e5ff8219ea4ae8c52fa1d8e6088c31f",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology-audit.md",
  "targetAnchor": "unheaded-block-11",
  "targetUnitDigest": "12612166a04d5866ebf6bd4a9eff15e12e5ff8219ea4ae8c52fa1d8e6088c31f",
  "targetAncestry": [
    "Workspace Topology Codebase Audit",
    "A1. Root Resolution Has Multiple Semantics"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: target digest repeats; source unit shorter than 40 characters. Carry the complete unheaded-block at docs/architect/workspace-topology-audit.md#unheaded-block-9 (lines 51–51) into docs/platform/system-architecture/architecture/workspace-topology-audit.md#unheaded-block-11 (lines 74–74), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
Status: partially solved.
```

### Full target shown text

```text
Status: partially solved.
```

### Unified diff

```diff
No text difference.
```

## claim_e4b36dd51379141af7f5b42bb3e1769c

Source: `docs/architect/workspace-topology-audit.md#unheaded-block-10`. Target: `docs/platform/system-architecture/architecture/workspace-topology-audit.md#unheaded-block-12`.

Mechanical class: Unit-exact. Source digest: `5b268d34b9a82ae53819d07aadfdfbc8c2f2b319627f531384b172c06066299a`. Target digest: `5b268d34b9a82ae53819d07aadfdfbc8c2f2b319627f531384b172c06066299a`.

Full shown source SHA256: `5b268d34b9a82ae53819d07aadfdfbc8c2f2b319627f531384b172c06066299a`. Full shown target SHA256: `5b268d34b9a82ae53819d07aadfdfbc8c2f2b319627f531384b172c06066299a`.

### Proposed decision

```json
{
  "claimId": "claim_e4b36dd51379141af7f5b42bb3e1769c",
  "sourceUnitDigest": "5b268d34b9a82ae53819d07aadfdfbc8c2f2b319627f531384b172c06066299a",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology-audit.md",
  "targetAnchor": "unheaded-block-12",
  "targetUnitDigest": "5b268d34b9a82ae53819d07aadfdfbc8c2f2b319627f531384b172c06066299a",
  "targetAncestry": [
    "Workspace Topology Codebase Audit",
    "A1. Root Resolution Has Multiple Semantics"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/workspace-topology-audit.md#unheaded-block-10 (lines 53–57) into docs/platform/system-architecture/architecture/workspace-topology-audit.md#unheaded-block-12 (lines 76–80), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
What is good:

- The code knows main and linked worktree are not equivalent.
- Some paths intentionally use main to avoid phantom `.fgos` state.
- Content lookup already has branch/worktree awareness.
```

### Full target shown text

```text
What is good:

- The code knows main and linked worktree are not equivalent.
- Some paths intentionally use main to avoid phantom `.fgos` state.
- Content lookup already has branch/worktree awareness.
```

### Unified diff

```diff
No text difference.
```

## claim_312096c9da5d9d758b353e895d423a83

Source: `docs/architect/workspace-topology-audit.md#unheaded-block-11`. Target: `docs/platform/system-architecture/architecture/workspace-topology-audit.md#unheaded-block-13`.

Mechanical class: Unit-exact. Source digest: `913c42739c03136cf0acb6a43bcfb165758a476cd4080a87475024a4702def77`. Target digest: `913c42739c03136cf0acb6a43bcfb165758a476cd4080a87475024a4702def77`.

Full shown source SHA256: `913c42739c03136cf0acb6a43bcfb165758a476cd4080a87475024a4702def77`. Full shown target SHA256: `913c42739c03136cf0acb6a43bcfb165758a476cd4080a87475024a4702def77`.

### Proposed decision

```json
{
  "claimId": "claim_312096c9da5d9d758b353e895d423a83",
  "sourceUnitDigest": "913c42739c03136cf0acb6a43bcfb165758a476cd4080a87475024a4702def77",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology-audit.md",
  "targetAnchor": "unheaded-block-13",
  "targetUnitDigest": "913c42739c03136cf0acb6a43bcfb165758a476cd4080a87475024a4702def77",
  "targetAncestry": [
    "Workspace Topology Codebase Audit",
    "A1. Root Resolution Has Multiple Semantics"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/workspace-topology-audit.md#unheaded-block-11 (lines 59–63) into docs/platform/system-architecture/architecture/workspace-topology-audit.md#unheaded-block-13 (lines 82–86), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
Gap:

- Business logic still receives plain `dir`/`repoRoot` and can pick the wrong
  resolver.
- There is no single `TopologyContext` choke point.
```

### Full target shown text

```text
Gap:

- Business logic still receives plain `dir`/`repoRoot` and can pick the wrong
  resolver.
- There is no single `TopologyContext` choke point.
```

### Unified diff

```diff
No text difference.
```

## claim_43eda829c97742d56200ac22e1325d4f

Source: `docs/architect/workspace-topology-audit.md#a2-config-is-tracked-but-readwrite-authority-is-inconsistent`. Target: `docs/platform/system-architecture/architecture/workspace-topology-audit.md#a2-config-is-tracked-but-readwrite-authority-is-inconsistent`.

Mechanical class: Unit-exact. Source digest: `9cb13818104480b50952c78a209d4363cf382c352bbc2ecaf93f764f7d09cefc`. Target digest: `9cb13818104480b50952c78a209d4363cf382c352bbc2ecaf93f764f7d09cefc`.

Full shown source SHA256: `038b82d5dd1c5e2d3c00ba916324fdeff84e1f1e83dfa22be11e0d7a1557820c`. Full shown target SHA256: `038b82d5dd1c5e2d3c00ba916324fdeff84e1f1e83dfa22be11e0d7a1557820c`.

### Proposed decision

```json
{
  "claimId": "claim_43eda829c97742d56200ac22e1325d4f",
  "sourceUnitDigest": "9cb13818104480b50952c78a209d4363cf382c352bbc2ecaf93f764f7d09cefc",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology-audit.md",
  "targetAnchor": "a2-config-is-tracked-but-readwrite-authority-is-inconsistent",
  "targetUnitDigest": "9cb13818104480b50952c78a209d4363cf382c352bbc2ecaf93f764f7d09cefc",
  "targetAncestry": [
    "Workspace Topology Codebase Audit"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete heading at docs/architect/workspace-topology-audit.md#a2-config-is-tracked-but-readwrite-authority-is-inconsistent (lines 65–65) into docs/platform/system-architecture/architecture/workspace-topology-audit.md#a2-config-is-tracked-but-readwrite-authority-is-inconsistent (lines 88–88), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
## A2. Config Is Tracked But Read/Write Authority Is Inconsistent

Observed code:

- `src/config/shared-config-file.mjs` says `.fgos/config.json` is a normal
  git-tracked project config file and every worktree checkout carries its own
  copy.
- `src/runner/dispatch/config.mjs` reads `.fgos/config.json` and merges global
  config with project config winning.
- Some paths, including setup/doctor/dispatch variants, resolve to main checkout
  using `resolveMainCheckoutRoot`.
- `fgos setup` was changed to avoid writing `.fgos/config.json` inside linked
  worktrees.

Status: not root-solved.

What is good:

- One shared config file surface exists.
- Project config wins over global config.
- Setup/doctor registry makes defaults and checks discoverable.

Gap:

- Branch/workspace policy config and repository/machine coordination config are
  mixed in one file/root.
- A worker cannot reliably test config changes if the operation redirects to
  main.
- A repair may affect main when the user intended a worktree.

Architecture implication:

- Config keys need declared scope: workspace/branch, work-state, or machine.
```

### Full target shown text

```text
## A2. Config Is Tracked But Read/Write Authority Is Inconsistent

Observed code:

- `src/config/shared-config-file.mjs` says `.fgos/config.json` is a normal
  git-tracked project config file and every worktree checkout carries its own
  copy.
- `src/runner/dispatch/config.mjs` reads `.fgos/config.json` and merges global
  config with project config winning.
- Some paths, including setup/doctor/dispatch variants, resolve to main checkout
  using `resolveMainCheckoutRoot`.
- `fgos setup` was changed to avoid writing `.fgos/config.json` inside linked
  worktrees.

Status: not root-solved.

What is good:

- One shared config file surface exists.
- Project config wins over global config.
- Setup/doctor registry makes defaults and checks discoverable.

Gap:

- Branch/workspace policy config and repository/machine coordination config are
  mixed in one file/root.
- A worker cannot reliably test config changes if the operation redirects to
  main.
- A repair may affect main when the user intended a worktree.

Architecture implication:

- Config keys need declared scope: workspace/branch, work-state, or machine.
```

### Unified diff

```diff
No text difference.
```

## claim_2b14fd673bcb8cca5399435c5e6800f4

Source: `docs/architect/workspace-topology-audit.md#unheaded-block-12`. Target: `docs/platform/system-architecture/architecture/workspace-topology-audit.md#unheaded-block-14`.

Mechanical class: Unit-exact. Source digest: `29b1b7769f949f452151f0fc430c925e61093c3ae8eb268dcd219f40cfee4d31`. Target digest: `29b1b7769f949f452151f0fc430c925e61093c3ae8eb268dcd219f40cfee4d31`.

Full shown source SHA256: `29b1b7769f949f452151f0fc430c925e61093c3ae8eb268dcd219f40cfee4d31`. Full shown target SHA256: `29b1b7769f949f452151f0fc430c925e61093c3ae8eb268dcd219f40cfee4d31`.

### Proposed decision

```json
{
  "claimId": "claim_2b14fd673bcb8cca5399435c5e6800f4",
  "sourceUnitDigest": "29b1b7769f949f452151f0fc430c925e61093c3ae8eb268dcd219f40cfee4d31",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology-audit.md",
  "targetAnchor": "unheaded-block-14",
  "targetUnitDigest": "29b1b7769f949f452151f0fc430c925e61093c3ae8eb268dcd219f40cfee4d31",
  "targetAncestry": [
    "Workspace Topology Codebase Audit",
    "A2. Config Is Tracked But Read/Write Authority Is Inconsistent"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/workspace-topology-audit.md#unheaded-block-12 (lines 67–77) into docs/platform/system-architecture/architecture/workspace-topology-audit.md#unheaded-block-14 (lines 90–100), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
Observed code:

- `src/config/shared-config-file.mjs` says `.fgos/config.json` is a normal
  git-tracked project config file and every worktree checkout carries its own
  copy.
- `src/runner/dispatch/config.mjs` reads `.fgos/config.json` and merges global
  config with project config winning.
- Some paths, including setup/doctor/dispatch variants, resolve to main checkout
  using `resolveMainCheckoutRoot`.
- `fgos setup` was changed to avoid writing `.fgos/config.json` inside linked
  worktrees.
```

### Full target shown text

```text
Observed code:

- `src/config/shared-config-file.mjs` says `.fgos/config.json` is a normal
  git-tracked project config file and every worktree checkout carries its own
  copy.
- `src/runner/dispatch/config.mjs` reads `.fgos/config.json` and merges global
  config with project config winning.
- Some paths, including setup/doctor/dispatch variants, resolve to main checkout
  using `resolveMainCheckoutRoot`.
- `fgos setup` was changed to avoid writing `.fgos/config.json` inside linked
  worktrees.
```

### Unified diff

```diff
No text difference.
```

## claim_dfe81a5cb1b200983902d62cd8d03a94

Source: `docs/architect/workspace-topology-audit.md#unheaded-block-13`. Target: `docs/platform/system-architecture/architecture/workspace-topology-audit.md#unheaded-block-15`.

Mechanical class: Weak-exact. Source digest: `a2ecec92d152f421e48c77ae0756caa39396574be9421737961f1087e3b76c7a`. Target digest: `a2ecec92d152f421e48c77ae0756caa39396574be9421737961f1087e3b76c7a`.

Full shown source SHA256: `a2ecec92d152f421e48c77ae0756caa39396574be9421737961f1087e3b76c7a`. Full shown target SHA256: `a2ecec92d152f421e48c77ae0756caa39396574be9421737961f1087e3b76c7a`.

### Proposed decision

```json
{
  "claimId": "claim_dfe81a5cb1b200983902d62cd8d03a94",
  "sourceUnitDigest": "a2ecec92d152f421e48c77ae0756caa39396574be9421737961f1087e3b76c7a",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology-audit.md",
  "targetAnchor": "unheaded-block-15",
  "targetUnitDigest": "a2ecec92d152f421e48c77ae0756caa39396574be9421737961f1087e3b76c7a",
  "targetAncestry": [
    "Workspace Topology Codebase Audit",
    "A2. Config Is Tracked But Read/Write Authority Is Inconsistent"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: target digest repeats; source unit shorter than 40 characters. Carry the complete unheaded-block at docs/architect/workspace-topology-audit.md#unheaded-block-13 (lines 79–79) into docs/platform/system-architecture/architecture/workspace-topology-audit.md#unheaded-block-15 (lines 102–102), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
Status: not root-solved.
```

### Full target shown text

```text
Status: not root-solved.
```

### Unified diff

```diff
No text difference.
```

## claim_b669283aad48b466e267ae3a277edf20

Source: `docs/architect/workspace-topology-audit.md#unheaded-block-14`. Target: `docs/platform/system-architecture/architecture/workspace-topology-audit.md#unheaded-block-16`.

Mechanical class: Unit-exact. Source digest: `c1cab29b4aed535d827fb232e66e969ff4d881f26344f28d151c47b2223a9272`. Target digest: `c1cab29b4aed535d827fb232e66e969ff4d881f26344f28d151c47b2223a9272`.

Full shown source SHA256: `c1cab29b4aed535d827fb232e66e969ff4d881f26344f28d151c47b2223a9272`. Full shown target SHA256: `c1cab29b4aed535d827fb232e66e969ff4d881f26344f28d151c47b2223a9272`.

### Proposed decision

```json
{
  "claimId": "claim_b669283aad48b466e267ae3a277edf20",
  "sourceUnitDigest": "c1cab29b4aed535d827fb232e66e969ff4d881f26344f28d151c47b2223a9272",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology-audit.md",
  "targetAnchor": "unheaded-block-16",
  "targetUnitDigest": "c1cab29b4aed535d827fb232e66e969ff4d881f26344f28d151c47b2223a9272",
  "targetAncestry": [
    "Workspace Topology Codebase Audit",
    "A2. Config Is Tracked But Read/Write Authority Is Inconsistent"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/workspace-topology-audit.md#unheaded-block-14 (lines 81–85) into docs/platform/system-architecture/architecture/workspace-topology-audit.md#unheaded-block-16 (lines 104–108), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
What is good:

- One shared config file surface exists.
- Project config wins over global config.
- Setup/doctor registry makes defaults and checks discoverable.
```

### Full target shown text

```text
What is good:

- One shared config file surface exists.
- Project config wins over global config.
- Setup/doctor registry makes defaults and checks discoverable.
```

### Unified diff

```diff
No text difference.
```

## claim_5088c8b8259e695b55686d482c03c504

Source: `docs/architect/workspace-topology-audit.md#unheaded-block-15`. Target: `docs/platform/system-architecture/architecture/workspace-topology-audit.md#unheaded-block-17`.

Mechanical class: Unit-exact. Source digest: `b651264a86834be5e31f1e0d04f0063124d93cce6d988e072b06d4bede03167f`. Target digest: `b651264a86834be5e31f1e0d04f0063124d93cce6d988e072b06d4bede03167f`.

Full shown source SHA256: `b651264a86834be5e31f1e0d04f0063124d93cce6d988e072b06d4bede03167f`. Full shown target SHA256: `b651264a86834be5e31f1e0d04f0063124d93cce6d988e072b06d4bede03167f`.

### Proposed decision

```json
{
  "claimId": "claim_5088c8b8259e695b55686d482c03c504",
  "sourceUnitDigest": "b651264a86834be5e31f1e0d04f0063124d93cce6d988e072b06d4bede03167f",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology-audit.md",
  "targetAnchor": "unheaded-block-17",
  "targetUnitDigest": "b651264a86834be5e31f1e0d04f0063124d93cce6d988e072b06d4bede03167f",
  "targetAncestry": [
    "Workspace Topology Codebase Audit",
    "A2. Config Is Tracked But Read/Write Authority Is Inconsistent"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/workspace-topology-audit.md#unheaded-block-15 (lines 87–93) into docs/platform/system-architecture/architecture/workspace-topology-audit.md#unheaded-block-17 (lines 110–116), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
Gap:

- Branch/workspace policy config and repository/machine coordination config are
  mixed in one file/root.
- A worker cannot reliably test config changes if the operation redirects to
  main.
- A repair may affect main when the user intended a worktree.
```

### Full target shown text

```text
Gap:

- Branch/workspace policy config and repository/machine coordination config are
  mixed in one file/root.
- A worker cannot reliably test config changes if the operation redirects to
  main.
- A repair may affect main when the user intended a worktree.
```

### Unified diff

```diff
No text difference.
```

## claim_6c76d0fab04720e389309a5015571138

Source: `docs/architect/workspace-topology-audit.md#unheaded-block-16`. Target: `docs/platform/system-architecture/architecture/workspace-topology-audit.md#unheaded-block-18`.

Mechanical class: Weak-exact. Source digest: `2840fb495530fc2479bf82372ad6625bb92a7467a34bbc8772dfaf56508352e9`. Target digest: `2840fb495530fc2479bf82372ad6625bb92a7467a34bbc8772dfaf56508352e9`.

Full shown source SHA256: `2840fb495530fc2479bf82372ad6625bb92a7467a34bbc8772dfaf56508352e9`. Full shown target SHA256: `2840fb495530fc2479bf82372ad6625bb92a7467a34bbc8772dfaf56508352e9`.

### Proposed decision

```json
{
  "claimId": "claim_6c76d0fab04720e389309a5015571138",
  "sourceUnitDigest": "2840fb495530fc2479bf82372ad6625bb92a7467a34bbc8772dfaf56508352e9",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology-audit.md",
  "targetAnchor": "unheaded-block-18",
  "targetUnitDigest": "2840fb495530fc2479bf82372ad6625bb92a7467a34bbc8772dfaf56508352e9",
  "targetAncestry": [
    "Workspace Topology Codebase Audit",
    "A2. Config Is Tracked But Read/Write Authority Is Inconsistent"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: target digest repeats; source unit shorter than 40 characters. Carry the complete unheaded-block at docs/architect/workspace-topology-audit.md#unheaded-block-16 (lines 95–95) into docs/platform/system-architecture/architecture/workspace-topology-audit.md#unheaded-block-18 (lines 118–118), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
Architecture implication:
```

### Full target shown text

```text
Architecture implication:
```

### Unified diff

```diff
No text difference.
```

## claim_f6988fd14f4e9124d6e5b6dc0161a0cb

Source: `docs/architect/workspace-topology-audit.md#unheaded-block-17`. Target: `docs/platform/system-architecture/architecture/workspace-topology-audit.md#unheaded-block-19`.

Mechanical class: Unit-exact. Source digest: `d199b312b83fc7742d3fe2fa31adfee561509941ea6d37bb79b45c3d637b106a`. Target digest: `d199b312b83fc7742d3fe2fa31adfee561509941ea6d37bb79b45c3d637b106a`.

Full shown source SHA256: `d199b312b83fc7742d3fe2fa31adfee561509941ea6d37bb79b45c3d637b106a`. Full shown target SHA256: `d199b312b83fc7742d3fe2fa31adfee561509941ea6d37bb79b45c3d637b106a`.

### Proposed decision

```json
{
  "claimId": "claim_f6988fd14f4e9124d6e5b6dc0161a0cb",
  "sourceUnitDigest": "d199b312b83fc7742d3fe2fa31adfee561509941ea6d37bb79b45c3d637b106a",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology-audit.md",
  "targetAnchor": "unheaded-block-19",
  "targetUnitDigest": "d199b312b83fc7742d3fe2fa31adfee561509941ea6d37bb79b45c3d637b106a",
  "targetAncestry": [
    "Workspace Topology Codebase Audit",
    "A2. Config Is Tracked But Read/Write Authority Is Inconsistent"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/workspace-topology-audit.md#unheaded-block-17 (lines 97–97) into docs/platform/system-architecture/architecture/workspace-topology-audit.md#unheaded-block-19 (lines 120–120), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
- Config keys need declared scope: workspace/branch, work-state, or machine.
```

### Full target shown text

```text
- Config keys need declared scope: workspace/branch, work-state, or machine.
```

### Unified diff

```diff
No text difference.
```

## claim_d8a14ffed3b8df3379b23f96136449da

Source: `docs/architect/workspace-topology-audit.md#a3-worktree-isolation-exists-but-fgos-treatment-depends-on-mode`. Target: `docs/platform/system-architecture/architecture/workspace-topology-audit.md#a3-worktree-isolation-exists-but-fgos-treatment-depends-on-mode`.

Mechanical class: Unit-exact. Source digest: `6833a9972570de099758243a788d6754c67cbbdf83db2803474ba815c0c4bf6f`. Target digest: `6833a9972570de099758243a788d6754c67cbbdf83db2803474ba815c0c4bf6f`.

Full shown source SHA256: `ad39de92ed981a6a32bad0d1b2e0ecc7ca3bfcf051d0ef6a12295be00a35079c`. Full shown target SHA256: `ad39de92ed981a6a32bad0d1b2e0ecc7ca3bfcf051d0ef6a12295be00a35079c`.

### Proposed decision

```json
{
  "claimId": "claim_d8a14ffed3b8df3379b23f96136449da",
  "sourceUnitDigest": "6833a9972570de099758243a788d6754c67cbbdf83db2803474ba815c0c4bf6f",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology-audit.md",
  "targetAnchor": "a3-worktree-isolation-exists-but-fgos-treatment-depends-on-mode",
  "targetUnitDigest": "6833a9972570de099758243a788d6754c67cbbdf83db2803474ba815c0c4bf6f",
  "targetAncestry": [
    "Workspace Topology Codebase Audit"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete heading at docs/architect/workspace-topology-audit.md#a3-worktree-isolation-exists-but-fgos-treatment-depends-on-mode (lines 99–99) into docs/platform/system-architecture/architecture/workspace-topology-audit.md#a3-worktree-isolation-exists-but-fgos-treatment-depends-on-mode (lines 122–122), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
## A3. Worktree Isolation Exists, But `.fgos` Treatment Depends On Mode

Observed code:

- `src/runner/worktree.mjs` creates `fgw/<id>` branches in fresh worktrees.
- Worker worktrees remove checked-out `.fgos` because stale copied state is
  wrong and live symlinked state was rejected for worker execution.
- `src/runner/session.mjs` does the opposite: it removes checked-out `.fgos` and
  symlinks it back to main, because sessions are driver/readers of shared state.
- Worktree cleanup preserves proposal branches and force-removes only stale
  checkout directories.

Status: partially solved.

What is good:

- Worker product changes are isolated.
- Retry gets fresh worktree directories.
- Orphaned checkout cleanup exists.
- Session registry writes are locked.

Gap:

- "worker", "session", "proof", and "main" are not first-class workspace kinds.
- Relative `.fgos/...` access fails or misroutes depending on workspace type.
```

### Full target shown text

```text
## A3. Worktree Isolation Exists, But `.fgos` Treatment Depends On Mode

Observed code:

- `src/runner/worktree.mjs` creates `fgw/<id>` branches in fresh worktrees.
- Worker worktrees remove checked-out `.fgos` because stale copied state is
  wrong and live symlinked state was rejected for worker execution.
- `src/runner/session.mjs` does the opposite: it removes checked-out `.fgos` and
  symlinks it back to main, because sessions are driver/readers of shared state.
- Worktree cleanup preserves proposal branches and force-removes only stale
  checkout directories.

Status: partially solved.

What is good:

- Worker product changes are isolated.
- Retry gets fresh worktree directories.
- Orphaned checkout cleanup exists.
- Session registry writes are locked.

Gap:

- "worker", "session", "proof", and "main" are not first-class workspace kinds.
- Relative `.fgos/...` access fails or misroutes depending on workspace type.
```

### Unified diff

```diff
No text difference.
```

## claim_1d085d3226edfaee0c0be651da0bb763

Source: `docs/architect/workspace-topology-audit.md#unheaded-block-18`. Target: `docs/platform/system-architecture/architecture/workspace-topology-audit.md#unheaded-block-20`.

Mechanical class: Unit-exact. Source digest: `48d931d62a83189d4c557f69a1166329c0c4ba515e64bd62cadc5fa36c5133aa`. Target digest: `48d931d62a83189d4c557f69a1166329c0c4ba515e64bd62cadc5fa36c5133aa`.

Full shown source SHA256: `48d931d62a83189d4c557f69a1166329c0c4ba515e64bd62cadc5fa36c5133aa`. Full shown target SHA256: `48d931d62a83189d4c557f69a1166329c0c4ba515e64bd62cadc5fa36c5133aa`.

### Proposed decision

```json
{
  "claimId": "claim_1d085d3226edfaee0c0be651da0bb763",
  "sourceUnitDigest": "48d931d62a83189d4c557f69a1166329c0c4ba515e64bd62cadc5fa36c5133aa",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology-audit.md",
  "targetAnchor": "unheaded-block-20",
  "targetUnitDigest": "48d931d62a83189d4c557f69a1166329c0c4ba515e64bd62cadc5fa36c5133aa",
  "targetAncestry": [
    "Workspace Topology Codebase Audit",
    "A3. Worktree Isolation Exists, But `.fgos` Treatment Depends On Mode"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/workspace-topology-audit.md#unheaded-block-18 (lines 101–109) into docs/platform/system-architecture/architecture/workspace-topology-audit.md#unheaded-block-20 (lines 124–132), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
Observed code:

- `src/runner/worktree.mjs` creates `fgw/<id>` branches in fresh worktrees.
- Worker worktrees remove checked-out `.fgos` because stale copied state is
  wrong and live symlinked state was rejected for worker execution.
- `src/runner/session.mjs` does the opposite: it removes checked-out `.fgos` and
  symlinks it back to main, because sessions are driver/readers of shared state.
- Worktree cleanup preserves proposal branches and force-removes only stale
  checkout directories.
```

### Full target shown text

```text
Observed code:

- `src/runner/worktree.mjs` creates `fgw/<id>` branches in fresh worktrees.
- Worker worktrees remove checked-out `.fgos` because stale copied state is
  wrong and live symlinked state was rejected for worker execution.
- `src/runner/session.mjs` does the opposite: it removes checked-out `.fgos` and
  symlinks it back to main, because sessions are driver/readers of shared state.
- Worktree cleanup preserves proposal branches and force-removes only stale
  checkout directories.
```

### Unified diff

```diff
No text difference.
```

## claim_da68580cfb729f1a7b81e787d685220c

Source: `docs/architect/workspace-topology-audit.md#unheaded-block-19`. Target: `docs/platform/system-architecture/architecture/workspace-topology-audit.md#unheaded-block-21`.

Mechanical class: Judgment. Source digest: `12612166a04d5866ebf6bd4a9eff15e12e5ff8219ea4ae8c52fa1d8e6088c31f`. Target digest: `12612166a04d5866ebf6bd4a9eff15e12e5ff8219ea4ae8c52fa1d8e6088c31f`.

Full shown source SHA256: `12612166a04d5866ebf6bd4a9eff15e12e5ff8219ea4ae8c52fa1d8e6088c31f`. Full shown target SHA256: `12612166a04d5866ebf6bd4a9eff15e12e5ff8219ea4ae8c52fa1d8e6088c31f`.

### Proposed decision

```json
{
  "claimId": "claim_da68580cfb729f1a7b81e787d685220c",
  "sourceUnitDigest": "12612166a04d5866ebf6bd4a9eff15e12e5ff8219ea4ae8c52fa1d8e6088c31f",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology-audit.md",
  "targetAnchor": "unheaded-block-21",
  "targetUnitDigest": "12612166a04d5866ebf6bd4a9eff15e12e5ff8219ea4ae8c52fa1d8e6088c31f",
  "targetAncestry": [
    "Workspace Topology Codebase Audit",
    "A3. Worktree Isolation Exists, But `.fgos` Treatment Depends On Mode"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Judgment: digest match points to another occurrence; use the source occurrence line-mapped carrier. Carry the complete unheaded-block at docs/architect/workspace-topology-audit.md#unheaded-block-19 (lines 111–111) into docs/platform/system-architecture/architecture/workspace-topology-audit.md#unheaded-block-21 (lines 134–134), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
Status: partially solved.
```

### Full target shown text

```text
Status: partially solved.
```

### Unified diff

```diff
No text difference.
```

## claim_c760e46eda40e549cb073a0f14f9c380

Source: `docs/architect/workspace-topology-audit.md#unheaded-block-20`. Target: `docs/platform/system-architecture/architecture/workspace-topology-audit.md#unheaded-block-22`.

Mechanical class: Unit-exact. Source digest: `c0344916456f3a43c29fde6e95d616d2924e481d262600212fc5b3509758756b`. Target digest: `c0344916456f3a43c29fde6e95d616d2924e481d262600212fc5b3509758756b`.

Full shown source SHA256: `c0344916456f3a43c29fde6e95d616d2924e481d262600212fc5b3509758756b`. Full shown target SHA256: `c0344916456f3a43c29fde6e95d616d2924e481d262600212fc5b3509758756b`.

### Proposed decision

```json
{
  "claimId": "claim_c760e46eda40e549cb073a0f14f9c380",
  "sourceUnitDigest": "c0344916456f3a43c29fde6e95d616d2924e481d262600212fc5b3509758756b",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology-audit.md",
  "targetAnchor": "unheaded-block-22",
  "targetUnitDigest": "c0344916456f3a43c29fde6e95d616d2924e481d262600212fc5b3509758756b",
  "targetAncestry": [
    "Workspace Topology Codebase Audit",
    "A3. Worktree Isolation Exists, But `.fgos` Treatment Depends On Mode"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/workspace-topology-audit.md#unheaded-block-20 (lines 113–118) into docs/platform/system-architecture/architecture/workspace-topology-audit.md#unheaded-block-22 (lines 136–141), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
What is good:

- Worker product changes are isolated.
- Retry gets fresh worktree directories.
- Orphaned checkout cleanup exists.
- Session registry writes are locked.
```

### Full target shown text

```text
What is good:

- Worker product changes are isolated.
- Retry gets fresh worktree directories.
- Orphaned checkout cleanup exists.
- Session registry writes are locked.
```

### Unified diff

```diff
No text difference.
```

## claim_89612daac4ce8c4634675a4468edf7fb

Source: `docs/architect/workspace-topology-audit.md#unheaded-block-21`. Target: `docs/platform/system-architecture/architecture/workspace-topology-audit.md#unheaded-block-23`.

Mechanical class: Unit-exact. Source digest: `4b97820a34e369d598e4ccab1ce13bf7c5d752709cb170a7746815ac6d150114`. Target digest: `4b97820a34e369d598e4ccab1ce13bf7c5d752709cb170a7746815ac6d150114`.

Full shown source SHA256: `4b97820a34e369d598e4ccab1ce13bf7c5d752709cb170a7746815ac6d150114`. Full shown target SHA256: `4b97820a34e369d598e4ccab1ce13bf7c5d752709cb170a7746815ac6d150114`.

### Proposed decision

```json
{
  "claimId": "claim_89612daac4ce8c4634675a4468edf7fb",
  "sourceUnitDigest": "4b97820a34e369d598e4ccab1ce13bf7c5d752709cb170a7746815ac6d150114",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology-audit.md",
  "targetAnchor": "unheaded-block-23",
  "targetUnitDigest": "4b97820a34e369d598e4ccab1ce13bf7c5d752709cb170a7746815ac6d150114",
  "targetAncestry": [
    "Workspace Topology Codebase Audit",
    "A3. Worktree Isolation Exists, But `.fgos` Treatment Depends On Mode"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/workspace-topology-audit.md#unheaded-block-21 (lines 120–123) into docs/platform/system-architecture/architecture/workspace-topology-audit.md#unheaded-block-23 (lines 143–146), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
Gap:

- "worker", "session", "proof", and "main" are not first-class workspace kinds.
- Relative `.fgos/...` access fails or misroutes depending on workspace type.
```

### Full target shown text

```text
Gap:

- "worker", "session", "proof", and "main" are not first-class workspace kinds.
- Relative `.fgos/...` access fails or misroutes depending on workspace type.
```

### Unified diff

```diff
No text difference.
```

## claim_01b419087fce6e06450a59de2fefde5a

Source: `docs/architect/workspace-topology-audit.md#a4-durable-event-history-is-sharded-but-still-hot-in-git`. Target: `docs/platform/system-architecture/architecture/workspace-topology-audit.md#a4-durable-event-history-is-sharded-but-still-hot-in-git`.

Mechanical class: Unit-exact. Source digest: `3b921c68f57f15df198b56e0cb8d12d512a62c52b2bf66e4f4913cf373db4b6d`. Target digest: `3b921c68f57f15df198b56e0cb8d12d512a62c52b2bf66e4f4913cf373db4b6d`.

Full shown source SHA256: `59c8fe95f1951d5c4ba260ed50cefd663559739730fa12dc6d9eb75b36bb36e8`. Full shown target SHA256: `59c8fe95f1951d5c4ba260ed50cefd663559739730fa12dc6d9eb75b36bb36e8`.

### Proposed decision

```json
{
  "claimId": "claim_01b419087fce6e06450a59de2fefde5a",
  "sourceUnitDigest": "3b921c68f57f15df198b56e0cb8d12d512a62c52b2bf66e4f4913cf373db4b6d",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology-audit.md",
  "targetAnchor": "a4-durable-event-history-is-sharded-but-still-hot-in-git",
  "targetUnitDigest": "3b921c68f57f15df198b56e0cb8d12d512a62c52b2bf66e4f4913cf373db4b6d",
  "targetAncestry": [
    "Workspace Topology Codebase Audit"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete heading at docs/architect/workspace-topology-audit.md#a4-durable-event-history-is-sharded-but-still-hot-in-git (lines 125–125) into docs/platform/system-architecture/architecture/workspace-topology-audit.md#a4-durable-event-history-is-sharded-but-still-hot-in-git (lines 148–148), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
## A4. Durable Event History Is Sharded But Still Hot In Git

Observed code:

- `src/state/store.mjs` treats old `.fgos/events.jsonl` as baseline-0.
- New writes go to `.fgos/events/<writer-id>-<openTs>.jsonl`.
- Append/CAS plus `state.json` refresh happen under `events.lock`.
- `.gitattributes` has `merge=union` for `.fgos/events/*.jsonl`.
- Doctor has truncation checks for baseline and per-writer files.

Status: partially solved.

What is good:

- Same-file append contention is reduced.
- Derived view lost-update race was closed.
- Baseline log is not rewritten.
- Truncation detection exists.

Gap:

- Hot durable history still modifies Git-tracked files.
- `events.lock` does not protect against arbitrary Git checkout/merge/stash/reset
  or human edits.
- Main can still become dirty from fgOS work-state activity.

Architecture implication:

- Hot work history should move out of the tracked working tree, with tracked
  immutable checkpoints as exchange/backup.
```

### Full target shown text

```text
## A4. Durable Event History Is Sharded But Still Hot In Git

Observed code:

- `src/state/store.mjs` treats old `.fgos/events.jsonl` as baseline-0.
- New writes go to `.fgos/events/<writer-id>-<openTs>.jsonl`.
- Append/CAS plus `state.json` refresh happen under `events.lock`.
- `.gitattributes` has `merge=union` for `.fgos/events/*.jsonl`.
- Doctor has truncation checks for baseline and per-writer files.

Status: partially solved.

What is good:

- Same-file append contention is reduced.
- Derived view lost-update race was closed.
- Baseline log is not rewritten.
- Truncation detection exists.

Gap:

- Hot durable history still modifies Git-tracked files.
- `events.lock` does not protect against arbitrary Git checkout/merge/stash/reset
  or human edits.
- Main can still become dirty from fgOS work-state activity.

Architecture implication:

- Hot work history should move out of the tracked working tree, with tracked
  immutable checkpoints as exchange/backup.
```

### Unified diff

```diff
No text difference.
```

## claim_520ab07cc0f5fd7876aa80df77da50c3

Source: `docs/architect/workspace-topology-audit.md#unheaded-block-22`. Target: `docs/platform/system-architecture/architecture/workspace-topology-audit.md#unheaded-block-24`.

Mechanical class: Unit-exact. Source digest: `3e7af6bb192573d02acbe6dd315e4bccba982f9121967e2a75dc4219679c43e6`. Target digest: `3e7af6bb192573d02acbe6dd315e4bccba982f9121967e2a75dc4219679c43e6`.

Full shown source SHA256: `3e7af6bb192573d02acbe6dd315e4bccba982f9121967e2a75dc4219679c43e6`. Full shown target SHA256: `3e7af6bb192573d02acbe6dd315e4bccba982f9121967e2a75dc4219679c43e6`.

### Proposed decision

```json
{
  "claimId": "claim_520ab07cc0f5fd7876aa80df77da50c3",
  "sourceUnitDigest": "3e7af6bb192573d02acbe6dd315e4bccba982f9121967e2a75dc4219679c43e6",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology-audit.md",
  "targetAnchor": "unheaded-block-24",
  "targetUnitDigest": "3e7af6bb192573d02acbe6dd315e4bccba982f9121967e2a75dc4219679c43e6",
  "targetAncestry": [
    "Workspace Topology Codebase Audit",
    "A4. Durable Event History Is Sharded But Still Hot In Git"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/workspace-topology-audit.md#unheaded-block-22 (lines 127–133) into docs/platform/system-architecture/architecture/workspace-topology-audit.md#unheaded-block-24 (lines 150–156), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
Observed code:

- `src/state/store.mjs` treats old `.fgos/events.jsonl` as baseline-0.
- New writes go to `.fgos/events/<writer-id>-<openTs>.jsonl`.
- Append/CAS plus `state.json` refresh happen under `events.lock`.
- `.gitattributes` has `merge=union` for `.fgos/events/*.jsonl`.
- Doctor has truncation checks for baseline and per-writer files.
```

### Full target shown text

```text
Observed code:

- `src/state/store.mjs` treats old `.fgos/events.jsonl` as baseline-0.
- New writes go to `.fgos/events/<writer-id>-<openTs>.jsonl`.
- Append/CAS plus `state.json` refresh happen under `events.lock`.
- `.gitattributes` has `merge=union` for `.fgos/events/*.jsonl`.
- Doctor has truncation checks for baseline and per-writer files.
```

### Unified diff

```diff
No text difference.
```

## claim_2b685526323300f0e68f92cda05ef946

Source: `docs/architect/workspace-topology-audit.md#unheaded-block-23`. Target: `docs/platform/system-architecture/architecture/workspace-topology-audit.md#unheaded-block-25`.

Mechanical class: Judgment. Source digest: `12612166a04d5866ebf6bd4a9eff15e12e5ff8219ea4ae8c52fa1d8e6088c31f`. Target digest: `12612166a04d5866ebf6bd4a9eff15e12e5ff8219ea4ae8c52fa1d8e6088c31f`.

Full shown source SHA256: `12612166a04d5866ebf6bd4a9eff15e12e5ff8219ea4ae8c52fa1d8e6088c31f`. Full shown target SHA256: `12612166a04d5866ebf6bd4a9eff15e12e5ff8219ea4ae8c52fa1d8e6088c31f`.

### Proposed decision

```json
{
  "claimId": "claim_2b685526323300f0e68f92cda05ef946",
  "sourceUnitDigest": "12612166a04d5866ebf6bd4a9eff15e12e5ff8219ea4ae8c52fa1d8e6088c31f",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology-audit.md",
  "targetAnchor": "unheaded-block-25",
  "targetUnitDigest": "12612166a04d5866ebf6bd4a9eff15e12e5ff8219ea4ae8c52fa1d8e6088c31f",
  "targetAncestry": [
    "Workspace Topology Codebase Audit",
    "A4. Durable Event History Is Sharded But Still Hot In Git"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Judgment: digest match points to another occurrence; use the source occurrence line-mapped carrier. Carry the complete unheaded-block at docs/architect/workspace-topology-audit.md#unheaded-block-23 (lines 135–135) into docs/platform/system-architecture/architecture/workspace-topology-audit.md#unheaded-block-25 (lines 158–158), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
Status: partially solved.
```

### Full target shown text

```text
Status: partially solved.
```

### Unified diff

```diff
No text difference.
```

## claim_19850694078633d95f43091fb3ceb2b0

Source: `docs/architect/workspace-topology-audit.md#unheaded-block-24`. Target: `docs/platform/system-architecture/architecture/workspace-topology-audit.md#unheaded-block-26`.

Mechanical class: Unit-exact. Source digest: `3fdb825d943761a41082d3aabdfa030600100c97012dcf4875b5d2ee98bc98ae`. Target digest: `3fdb825d943761a41082d3aabdfa030600100c97012dcf4875b5d2ee98bc98ae`.

Full shown source SHA256: `3fdb825d943761a41082d3aabdfa030600100c97012dcf4875b5d2ee98bc98ae`. Full shown target SHA256: `3fdb825d943761a41082d3aabdfa030600100c97012dcf4875b5d2ee98bc98ae`.

### Proposed decision

```json
{
  "claimId": "claim_19850694078633d95f43091fb3ceb2b0",
  "sourceUnitDigest": "3fdb825d943761a41082d3aabdfa030600100c97012dcf4875b5d2ee98bc98ae",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology-audit.md",
  "targetAnchor": "unheaded-block-26",
  "targetUnitDigest": "3fdb825d943761a41082d3aabdfa030600100c97012dcf4875b5d2ee98bc98ae",
  "targetAncestry": [
    "Workspace Topology Codebase Audit",
    "A4. Durable Event History Is Sharded But Still Hot In Git"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/workspace-topology-audit.md#unheaded-block-24 (lines 137–142) into docs/platform/system-architecture/architecture/workspace-topology-audit.md#unheaded-block-26 (lines 160–165), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
What is good:

- Same-file append contention is reduced.
- Derived view lost-update race was closed.
- Baseline log is not rewritten.
- Truncation detection exists.
```

### Full target shown text

```text
What is good:

- Same-file append contention is reduced.
- Derived view lost-update race was closed.
- Baseline log is not rewritten.
- Truncation detection exists.
```

### Unified diff

```diff
No text difference.
```

## claim_adce9371188dce223e20d1eb82c8aa43

Source: `docs/architect/workspace-topology-audit.md#unheaded-block-25`. Target: `docs/platform/system-architecture/architecture/workspace-topology-audit.md#unheaded-block-27`.

Mechanical class: Unit-exact. Source digest: `522094808749607928708f0d12f513a309e07a60eaf72cc52bdc562af6ac569d`. Target digest: `522094808749607928708f0d12f513a309e07a60eaf72cc52bdc562af6ac569d`.

Full shown source SHA256: `522094808749607928708f0d12f513a309e07a60eaf72cc52bdc562af6ac569d`. Full shown target SHA256: `522094808749607928708f0d12f513a309e07a60eaf72cc52bdc562af6ac569d`.

### Proposed decision

```json
{
  "claimId": "claim_adce9371188dce223e20d1eb82c8aa43",
  "sourceUnitDigest": "522094808749607928708f0d12f513a309e07a60eaf72cc52bdc562af6ac569d",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology-audit.md",
  "targetAnchor": "unheaded-block-27",
  "targetUnitDigest": "522094808749607928708f0d12f513a309e07a60eaf72cc52bdc562af6ac569d",
  "targetAncestry": [
    "Workspace Topology Codebase Audit",
    "A4. Durable Event History Is Sharded But Still Hot In Git"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/workspace-topology-audit.md#unheaded-block-25 (lines 144–149) into docs/platform/system-architecture/architecture/workspace-topology-audit.md#unheaded-block-27 (lines 167–172), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
Gap:

- Hot durable history still modifies Git-tracked files.
- `events.lock` does not protect against arbitrary Git checkout/merge/stash/reset
  or human edits.
- Main can still become dirty from fgOS work-state activity.
```

### Full target shown text

```text
Gap:

- Hot durable history still modifies Git-tracked files.
- `events.lock` does not protect against arbitrary Git checkout/merge/stash/reset
  or human edits.
- Main can still become dirty from fgOS work-state activity.
```

### Unified diff

```diff
No text difference.
```

## claim_9c882c9a292181de10a614b8d8b583fa

Source: `docs/architect/workspace-topology-audit.md#unheaded-block-26`. Target: `docs/platform/system-architecture/architecture/workspace-topology-audit.md#unheaded-block-28`.

Mechanical class: Judgment. Source digest: `2840fb495530fc2479bf82372ad6625bb92a7467a34bbc8772dfaf56508352e9`. Target digest: `2840fb495530fc2479bf82372ad6625bb92a7467a34bbc8772dfaf56508352e9`.

Full shown source SHA256: `2840fb495530fc2479bf82372ad6625bb92a7467a34bbc8772dfaf56508352e9`. Full shown target SHA256: `2840fb495530fc2479bf82372ad6625bb92a7467a34bbc8772dfaf56508352e9`.

### Proposed decision

```json
{
  "claimId": "claim_9c882c9a292181de10a614b8d8b583fa",
  "sourceUnitDigest": "2840fb495530fc2479bf82372ad6625bb92a7467a34bbc8772dfaf56508352e9",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology-audit.md",
  "targetAnchor": "unheaded-block-28",
  "targetUnitDigest": "2840fb495530fc2479bf82372ad6625bb92a7467a34bbc8772dfaf56508352e9",
  "targetAncestry": [
    "Workspace Topology Codebase Audit",
    "A4. Durable Event History Is Sharded But Still Hot In Git"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Judgment: digest match points to another occurrence; use the source occurrence line-mapped carrier. Carry the complete unheaded-block at docs/architect/workspace-topology-audit.md#unheaded-block-26 (lines 151–151) into docs/platform/system-architecture/architecture/workspace-topology-audit.md#unheaded-block-28 (lines 174–174), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
Architecture implication:
```

### Full target shown text

```text
Architecture implication:
```

### Unified diff

```diff
No text difference.
```

## claim_0bd32d6e9d6f49a0df463d1bc78ebff5

Source: `docs/architect/workspace-topology-audit.md#unheaded-block-27`. Target: `docs/platform/system-architecture/architecture/workspace-topology-audit.md#unheaded-block-29`.

Mechanical class: Unit-exact. Source digest: `eec1b8bb69ffa469393d3446d922e5d4239b3c1b6e3c86d3fc5debaae00ea4d9`. Target digest: `eec1b8bb69ffa469393d3446d922e5d4239b3c1b6e3c86d3fc5debaae00ea4d9`.

Full shown source SHA256: `eec1b8bb69ffa469393d3446d922e5d4239b3c1b6e3c86d3fc5debaae00ea4d9`. Full shown target SHA256: `eec1b8bb69ffa469393d3446d922e5d4239b3c1b6e3c86d3fc5debaae00ea4d9`.

### Proposed decision

```json
{
  "claimId": "claim_0bd32d6e9d6f49a0df463d1bc78ebff5",
  "sourceUnitDigest": "eec1b8bb69ffa469393d3446d922e5d4239b3c1b6e3c86d3fc5debaae00ea4d9",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology-audit.md",
  "targetAnchor": "unheaded-block-29",
  "targetUnitDigest": "eec1b8bb69ffa469393d3446d922e5d4239b3c1b6e3c86d3fc5debaae00ea4d9",
  "targetAncestry": [
    "Workspace Topology Codebase Audit",
    "A4. Durable Event History Is Sharded But Still Hot In Git"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/workspace-topology-audit.md#unheaded-block-27 (lines 153–154) into docs/platform/system-architecture/architecture/workspace-topology-audit.md#unheaded-block-29 (lines 176–177), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
- Hot work history should move out of the tracked working tree, with tracked
  immutable checkpoints as exchange/backup.
```

### Full target shown text

```text
- Hot work history should move out of the tracked working tree, with tracked
  immutable checkpoints as exchange/backup.
```

### Unified diff

```diff
No text difference.
```

## claim_8fb296d2c5ca4ead1811534cdb0ff7d8

Source: `docs/architect/workspace-topology-audit.md#a5-runtime-coordination-is-ignored-but-namespaceliveness-are-weak`. Target: `docs/platform/system-architecture/architecture/workspace-topology-audit.md#a5-runtime-coordination-is-ignored-but-namespaceliveness-are-weak`.

Mechanical class: Unit-exact. Source digest: `b013cfd7480e7c56199dcd79dd2cb5f87065630942698ac37c1da97dff025021`. Target digest: `b013cfd7480e7c56199dcd79dd2cb5f87065630942698ac37c1da97dff025021`.

Full shown source SHA256: `ea89d162ae557aef680c6f41e6a4364ba9d8f919889d28028cc8aec1b2a530ca`. Full shown target SHA256: `ea89d162ae557aef680c6f41e6a4364ba9d8f919889d28028cc8aec1b2a530ca`.

### Proposed decision

```json
{
  "claimId": "claim_8fb296d2c5ca4ead1811534cdb0ff7d8",
  "sourceUnitDigest": "b013cfd7480e7c56199dcd79dd2cb5f87065630942698ac37c1da97dff025021",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology-audit.md",
  "targetAnchor": "a5-runtime-coordination-is-ignored-but-namespaceliveness-are-weak",
  "targetUnitDigest": "b013cfd7480e7c56199dcd79dd2cb5f87065630942698ac37c1da97dff025021",
  "targetAncestry": [
    "Workspace Topology Codebase Audit"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete heading at docs/architect/workspace-topology-audit.md#a5-runtime-coordination-is-ignored-but-namespaceliveness-are-weak (lines 156–156) into docs/platform/system-architecture/architecture/workspace-topology-audit.md#a5-runtime-coordination-is-ignored-but-namespaceliveness-are-weak (lines 179–179), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
## A5. Runtime Coordination Is Ignored But Namespace/Liveness Are Weak

Observed code:

- `src/state/runtime-coordination.mjs` stores active claims under
  `.fgos/runtime/claims/<id>.json`.
- Claim reads fail closed on corrupt/unreadable files.
- `getMainFgosDir()` forces claim state to main `.fgos` from a worktree.
- Claim locks use PID/timestamp.

Status: partially solved.

What is good:

- Live claim overlay is separated from durable status.
- Claim state is gitignored.
- Claim acquisition is lock-protected.

Gap:

- `.fgos/runtime` is overloaded with claims today and packaging runtime payload/
  activation tomorrow.
- PID/time does not prove liveness across reboot, PID reuse, detached children,
  containers, or remote executors.
- Claim records are not scoped by `workspaceId`, `workStateId`, and
  `artifactDigest`.
```

### Full target shown text

```text
## A5. Runtime Coordination Is Ignored But Namespace/Liveness Are Weak

Observed code:

- `src/state/runtime-coordination.mjs` stores active claims under
  `.fgos/runtime/claims/<id>.json`.
- Claim reads fail closed on corrupt/unreadable files.
- `getMainFgosDir()` forces claim state to main `.fgos` from a worktree.
- Claim locks use PID/timestamp.

Status: partially solved.

What is good:

- Live claim overlay is separated from durable status.
- Claim state is gitignored.
- Claim acquisition is lock-protected.

Gap:

- `.fgos/runtime` is overloaded with claims today and packaging runtime payload/
  activation tomorrow.
- PID/time does not prove liveness across reboot, PID reuse, detached children,
  containers, or remote executors.
- Claim records are not scoped by `workspaceId`, `workStateId`, and
  `artifactDigest`.
```

### Unified diff

```diff
No text difference.
```

## claim_8da50a3cdaccf8d772c2ce4fa71d67b5

Source: `docs/architect/workspace-topology-audit.md#unheaded-block-28`. Target: `docs/platform/system-architecture/architecture/workspace-topology-audit.md#unheaded-block-30`.

Mechanical class: Unit-exact. Source digest: `fdbf8562758b48387a5eafa7ece5c81a37362c2cd562a5cafe7169234666032b`. Target digest: `fdbf8562758b48387a5eafa7ece5c81a37362c2cd562a5cafe7169234666032b`.

Full shown source SHA256: `fdbf8562758b48387a5eafa7ece5c81a37362c2cd562a5cafe7169234666032b`. Full shown target SHA256: `fdbf8562758b48387a5eafa7ece5c81a37362c2cd562a5cafe7169234666032b`.

### Proposed decision

```json
{
  "claimId": "claim_8da50a3cdaccf8d772c2ce4fa71d67b5",
  "sourceUnitDigest": "fdbf8562758b48387a5eafa7ece5c81a37362c2cd562a5cafe7169234666032b",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology-audit.md",
  "targetAnchor": "unheaded-block-30",
  "targetUnitDigest": "fdbf8562758b48387a5eafa7ece5c81a37362c2cd562a5cafe7169234666032b",
  "targetAncestry": [
    "Workspace Topology Codebase Audit",
    "A5. Runtime Coordination Is Ignored But Namespace/Liveness Are Weak"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/workspace-topology-audit.md#unheaded-block-28 (lines 158–164) into docs/platform/system-architecture/architecture/workspace-topology-audit.md#unheaded-block-30 (lines 181–187), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
Observed code:

- `src/state/runtime-coordination.mjs` stores active claims under
  `.fgos/runtime/claims/<id>.json`.
- Claim reads fail closed on corrupt/unreadable files.
- `getMainFgosDir()` forces claim state to main `.fgos` from a worktree.
- Claim locks use PID/timestamp.
```

### Full target shown text

```text
Observed code:

- `src/state/runtime-coordination.mjs` stores active claims under
  `.fgos/runtime/claims/<id>.json`.
- Claim reads fail closed on corrupt/unreadable files.
- `getMainFgosDir()` forces claim state to main `.fgos` from a worktree.
- Claim locks use PID/timestamp.
```

### Unified diff

```diff
No text difference.
```

## claim_44444870e10b079acbc572200edb869a

Source: `docs/architect/workspace-topology-audit.md#unheaded-block-29`. Target: `docs/platform/system-architecture/architecture/workspace-topology-audit.md#unheaded-block-31`.

Mechanical class: Judgment. Source digest: `12612166a04d5866ebf6bd4a9eff15e12e5ff8219ea4ae8c52fa1d8e6088c31f`. Target digest: `12612166a04d5866ebf6bd4a9eff15e12e5ff8219ea4ae8c52fa1d8e6088c31f`.

Full shown source SHA256: `12612166a04d5866ebf6bd4a9eff15e12e5ff8219ea4ae8c52fa1d8e6088c31f`. Full shown target SHA256: `12612166a04d5866ebf6bd4a9eff15e12e5ff8219ea4ae8c52fa1d8e6088c31f`.

### Proposed decision

```json
{
  "claimId": "claim_44444870e10b079acbc572200edb869a",
  "sourceUnitDigest": "12612166a04d5866ebf6bd4a9eff15e12e5ff8219ea4ae8c52fa1d8e6088c31f",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology-audit.md",
  "targetAnchor": "unheaded-block-31",
  "targetUnitDigest": "12612166a04d5866ebf6bd4a9eff15e12e5ff8219ea4ae8c52fa1d8e6088c31f",
  "targetAncestry": [
    "Workspace Topology Codebase Audit",
    "A5. Runtime Coordination Is Ignored But Namespace/Liveness Are Weak"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Judgment: digest match points to another occurrence; use the source occurrence line-mapped carrier. Carry the complete unheaded-block at docs/architect/workspace-topology-audit.md#unheaded-block-29 (lines 166–166) into docs/platform/system-architecture/architecture/workspace-topology-audit.md#unheaded-block-31 (lines 189–189), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
Status: partially solved.
```

### Full target shown text

```text
Status: partially solved.
```

### Unified diff

```diff
No text difference.
```

## claim_6f5e806b3c0ef2d237b44ae814f02f50

Source: `docs/architect/workspace-topology-audit.md#unheaded-block-30`. Target: `docs/platform/system-architecture/architecture/workspace-topology-audit.md#unheaded-block-32`.

Mechanical class: Unit-exact. Source digest: `1a0bdc02dd29e911b054e59e7e0c43438b7ff7a23e907871cb46cb93c5ef8a8c`. Target digest: `1a0bdc02dd29e911b054e59e7e0c43438b7ff7a23e907871cb46cb93c5ef8a8c`.

Full shown source SHA256: `1a0bdc02dd29e911b054e59e7e0c43438b7ff7a23e907871cb46cb93c5ef8a8c`. Full shown target SHA256: `1a0bdc02dd29e911b054e59e7e0c43438b7ff7a23e907871cb46cb93c5ef8a8c`.

### Proposed decision

```json
{
  "claimId": "claim_6f5e806b3c0ef2d237b44ae814f02f50",
  "sourceUnitDigest": "1a0bdc02dd29e911b054e59e7e0c43438b7ff7a23e907871cb46cb93c5ef8a8c",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology-audit.md",
  "targetAnchor": "unheaded-block-32",
  "targetUnitDigest": "1a0bdc02dd29e911b054e59e7e0c43438b7ff7a23e907871cb46cb93c5ef8a8c",
  "targetAncestry": [
    "Workspace Topology Codebase Audit",
    "A5. Runtime Coordination Is Ignored But Namespace/Liveness Are Weak"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/workspace-topology-audit.md#unheaded-block-30 (lines 168–172) into docs/platform/system-architecture/architecture/workspace-topology-audit.md#unheaded-block-32 (lines 191–195), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
What is good:

- Live claim overlay is separated from durable status.
- Claim state is gitignored.
- Claim acquisition is lock-protected.
```

### Full target shown text

```text
What is good:

- Live claim overlay is separated from durable status.
- Claim state is gitignored.
- Claim acquisition is lock-protected.
```

### Unified diff

```diff
No text difference.
```

## claim_4f0cebdd7274f3e8a1cfa458d3ed766a

Source: `docs/architect/workspace-topology-audit.md#unheaded-block-31`. Target: `docs/platform/system-architecture/architecture/workspace-topology-audit.md#unheaded-block-33`.

Mechanical class: Unit-exact. Source digest: `b930d298630e0f1a82f78998362ba9ae772853ef19c0891f688ea251dd05fa37`. Target digest: `b930d298630e0f1a82f78998362ba9ae772853ef19c0891f688ea251dd05fa37`.

Full shown source SHA256: `b930d298630e0f1a82f78998362ba9ae772853ef19c0891f688ea251dd05fa37`. Full shown target SHA256: `b930d298630e0f1a82f78998362ba9ae772853ef19c0891f688ea251dd05fa37`.

### Proposed decision

```json
{
  "claimId": "claim_4f0cebdd7274f3e8a1cfa458d3ed766a",
  "sourceUnitDigest": "b930d298630e0f1a82f78998362ba9ae772853ef19c0891f688ea251dd05fa37",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology-audit.md",
  "targetAnchor": "unheaded-block-33",
  "targetUnitDigest": "b930d298630e0f1a82f78998362ba9ae772853ef19c0891f688ea251dd05fa37",
  "targetAncestry": [
    "Workspace Topology Codebase Audit",
    "A5. Runtime Coordination Is Ignored But Namespace/Liveness Are Weak"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/workspace-topology-audit.md#unheaded-block-31 (lines 174–181) into docs/platform/system-architecture/architecture/workspace-topology-audit.md#unheaded-block-33 (lines 197–204), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
Gap:

- `.fgos/runtime` is overloaded with claims today and packaging runtime payload/
  activation tomorrow.
- PID/time does not prove liveness across reboot, PID reuse, detached children,
  containers, or remote executors.
- Claim records are not scoped by `workspaceId`, `workStateId`, and
  `artifactDigest`.
```

### Full target shown text

```text
Gap:

- `.fgos/runtime` is overloaded with claims today and packaging runtime payload/
  activation tomorrow.
- PID/time does not prove liveness across reboot, PID reuse, detached children,
  containers, or remote executors.
- Claim records are not scoped by `workspaceId`, `workStateId`, and
  `artifactDigest`.
```

### Unified diff

```diff
No text difference.
```

## claim_8aac58ff895bbccb48da18c2b99c867b

Source: `docs/architect/workspace-topology-audit.md#a6-agent-coordination-store-needs-root-review`. Target: `docs/platform/system-architecture/architecture/workspace-topology-audit.md#a6-agent-coordination-store-needs-root-review`.

Mechanical class: Unit-exact. Source digest: `bdce661e07907b0346c07408dc6d94e484f85260239566c241382f0ee74097b4`. Target digest: `bdce661e07907b0346c07408dc6d94e484f85260239566c241382f0ee74097b4`.

Full shown source SHA256: `f00df91bbb82c524953380dadf9126bfadbf17424989e23a38f696c7cd235748`. Full shown target SHA256: `f00df91bbb82c524953380dadf9126bfadbf17424989e23a38f696c7cd235748`.

### Proposed decision

```json
{
  "claimId": "claim_8aac58ff895bbccb48da18c2b99c867b",
  "sourceUnitDigest": "bdce661e07907b0346c07408dc6d94e484f85260239566c241382f0ee74097b4",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology-audit.md",
  "targetAnchor": "a6-agent-coordination-store-needs-root-review",
  "targetUnitDigest": "bdce661e07907b0346c07408dc6d94e484f85260239566c241382f0ee74097b4",
  "targetAncestry": [
    "Workspace Topology Codebase Audit"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete heading at docs/architect/workspace-topology-audit.md#a6-agent-coordination-store-needs-root-review (lines 183–183) into docs/platform/system-architecture/architecture/workspace-topology-audit.md#a6-agent-coordination-store-needs-root-review (lines 206–206), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
## A6. Agent Coordination Store Needs Root Review

Observed code:

- `src/runner/coordination/store.mjs` roots sessions at
  `.fgos/coordination/sessions/<id>/`.
- It validates coordination ids before path construction.
- Manifest writes use atomic rename.
- Session event writes reuse event-lock lineage.
- `resolveCoordinationPaths()` computes a `root` from main checkout, but creates
  `fgosDir` from `cwd`.

Status: partially solved / needs focused review.

Gap:

- It is unclear whether unit runs / sessions are repository-shared,
  workspace-local, or mode-dependent.
- If shared, `fgosDirFromRoot(cwd)` can be wrong inside a linked worktree.
- If local, fanout/session visibility rules need to say so explicitly.
```

### Full target shown text

```text
## A6. Agent Coordination Store Needs Root Review

Observed code:

- `src/runner/coordination/store.mjs` roots sessions at
  `.fgos/coordination/sessions/<id>/`.
- It validates coordination ids before path construction.
- Manifest writes use atomic rename.
- Session event writes reuse event-lock lineage.
- `resolveCoordinationPaths()` computes a `root` from main checkout, but creates
  `fgosDir` from `cwd`.

Status: partially solved / needs focused review.

Gap:

- It is unclear whether unit runs / sessions are repository-shared,
  workspace-local, or mode-dependent.
- If shared, `fgosDirFromRoot(cwd)` can be wrong inside a linked worktree.
- If local, fanout/session visibility rules need to say so explicitly.
```

### Unified diff

```diff
No text difference.
```

## claim_4d3ddbd61f874743b26277e455231548

Source: `docs/architect/workspace-topology-audit.md#unheaded-block-32`. Target: `docs/platform/system-architecture/architecture/workspace-topology-audit.md#unheaded-block-34`.

Mechanical class: Unit-exact. Source digest: `92f64e9941d35ff96891b13e642e4e0bc527d2f716db004ab59cce251188dfb8`. Target digest: `92f64e9941d35ff96891b13e642e4e0bc527d2f716db004ab59cce251188dfb8`.

Full shown source SHA256: `92f64e9941d35ff96891b13e642e4e0bc527d2f716db004ab59cce251188dfb8`. Full shown target SHA256: `92f64e9941d35ff96891b13e642e4e0bc527d2f716db004ab59cce251188dfb8`.

### Proposed decision

```json
{
  "claimId": "claim_4d3ddbd61f874743b26277e455231548",
  "sourceUnitDigest": "92f64e9941d35ff96891b13e642e4e0bc527d2f716db004ab59cce251188dfb8",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology-audit.md",
  "targetAnchor": "unheaded-block-34",
  "targetUnitDigest": "92f64e9941d35ff96891b13e642e4e0bc527d2f716db004ab59cce251188dfb8",
  "targetAncestry": [
    "Workspace Topology Codebase Audit",
    "A6. Agent Coordination Store Needs Root Review"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/workspace-topology-audit.md#unheaded-block-32 (lines 185–193) into docs/platform/system-architecture/architecture/workspace-topology-audit.md#unheaded-block-34 (lines 208–216), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
Observed code:

- `src/runner/coordination/store.mjs` roots sessions at
  `.fgos/coordination/sessions/<id>/`.
- It validates coordination ids before path construction.
- Manifest writes use atomic rename.
- Session event writes reuse event-lock lineage.
- `resolveCoordinationPaths()` computes a `root` from main checkout, but creates
  `fgosDir` from `cwd`.
```

### Full target shown text

```text
Observed code:

- `src/runner/coordination/store.mjs` roots sessions at
  `.fgos/coordination/sessions/<id>/`.
- It validates coordination ids before path construction.
- Manifest writes use atomic rename.
- Session event writes reuse event-lock lineage.
- `resolveCoordinationPaths()` computes a `root` from main checkout, but creates
  `fgosDir` from `cwd`.
```

### Unified diff

```diff
No text difference.
```

## claim_b3287ea650b671ed6a044e346cb62493

Source: `docs/architect/workspace-topology-audit.md#unheaded-block-33`. Target: `docs/platform/system-architecture/architecture/workspace-topology-audit.md#unheaded-block-35`.

Mechanical class: Unit-exact. Source digest: `2ab5f64fb462964a533309eccde21efbe4d0300f833362e7c678a2e42d46bcf8`. Target digest: `2ab5f64fb462964a533309eccde21efbe4d0300f833362e7c678a2e42d46bcf8`.

Full shown source SHA256: `2ab5f64fb462964a533309eccde21efbe4d0300f833362e7c678a2e42d46bcf8`. Full shown target SHA256: `2ab5f64fb462964a533309eccde21efbe4d0300f833362e7c678a2e42d46bcf8`.

### Proposed decision

```json
{
  "claimId": "claim_b3287ea650b671ed6a044e346cb62493",
  "sourceUnitDigest": "2ab5f64fb462964a533309eccde21efbe4d0300f833362e7c678a2e42d46bcf8",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology-audit.md",
  "targetAnchor": "unheaded-block-35",
  "targetUnitDigest": "2ab5f64fb462964a533309eccde21efbe4d0300f833362e7c678a2e42d46bcf8",
  "targetAncestry": [
    "Workspace Topology Codebase Audit",
    "A6. Agent Coordination Store Needs Root Review"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/workspace-topology-audit.md#unheaded-block-33 (lines 195–195) into docs/platform/system-architecture/architecture/workspace-topology-audit.md#unheaded-block-35 (lines 218–218), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
Status: partially solved / needs focused review.
```

### Full target shown text

```text
Status: partially solved / needs focused review.
```

### Unified diff

```diff
No text difference.
```

## claim_bb011a1f70a185b2d2b48eabd0b9a2bc

Source: `docs/architect/workspace-topology-audit.md#unheaded-block-34`. Target: `docs/platform/system-architecture/architecture/workspace-topology-audit.md#unheaded-block-36`.

Mechanical class: Unit-exact. Source digest: `83dcc88b1c9c82a6f296ed7b30202c691807ccc03da7bdb8d9c4157d794ecd95`. Target digest: `83dcc88b1c9c82a6f296ed7b30202c691807ccc03da7bdb8d9c4157d794ecd95`.

Full shown source SHA256: `83dcc88b1c9c82a6f296ed7b30202c691807ccc03da7bdb8d9c4157d794ecd95`. Full shown target SHA256: `83dcc88b1c9c82a6f296ed7b30202c691807ccc03da7bdb8d9c4157d794ecd95`.

### Proposed decision

```json
{
  "claimId": "claim_bb011a1f70a185b2d2b48eabd0b9a2bc",
  "sourceUnitDigest": "83dcc88b1c9c82a6f296ed7b30202c691807ccc03da7bdb8d9c4157d794ecd95",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology-audit.md",
  "targetAnchor": "unheaded-block-36",
  "targetUnitDigest": "83dcc88b1c9c82a6f296ed7b30202c691807ccc03da7bdb8d9c4157d794ecd95",
  "targetAncestry": [
    "Workspace Topology Codebase Audit",
    "A6. Agent Coordination Store Needs Root Review"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/workspace-topology-audit.md#unheaded-block-34 (lines 197–202) into docs/platform/system-architecture/architecture/workspace-topology-audit.md#unheaded-block-36 (lines 220–225), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
Gap:

- It is unclear whether unit runs / sessions are repository-shared,
  workspace-local, or mode-dependent.
- If shared, `fgosDirFromRoot(cwd)` can be wrong inside a linked worktree.
- If local, fanout/session visibility rules need to say so explicitly.
```

### Full target shown text

```text
Gap:

- It is unclear whether unit runs / sessions are repository-shared,
  workspace-local, or mode-dependent.
- If shared, `fgosDirFromRoot(cwd)` can be wrong inside a linked worktree.
- If local, fanout/session visibility rules need to say so explicitly.
```

### Unified diff

```diff
No text difference.
```

## claim_89d41a64cc742965219de857d8a0b5eb

Source: `docs/architect/workspace-topology-audit.md#a7-main-checkout-dirty-guard-is-not-a-work-state-guard`. Target: `docs/platform/system-architecture/architecture/workspace-topology-audit.md#a7-main-checkout-dirty-guard-is-not-a-work-state-guard`.

Mechanical class: Unit-exact. Source digest: `7355d4dcbb4916d6caa1445527a0d1c0e75eca00dd6d9ab58f4d922243a0b7bf`. Target digest: `7355d4dcbb4916d6caa1445527a0d1c0e75eca00dd6d9ab58f4d922243a0b7bf`.

Full shown source SHA256: `16ea1673b720927e604bf1a436afcbc98c0194eeb4e32e46e474c0483f617ee8`. Full shown target SHA256: `16ea1673b720927e604bf1a436afcbc98c0194eeb4e32e46e474c0483f617ee8`.

### Proposed decision

```json
{
  "claimId": "claim_89d41a64cc742965219de857d8a0b5eb",
  "sourceUnitDigest": "7355d4dcbb4916d6caa1445527a0d1c0e75eca00dd6d9ab58f4d922243a0b7bf",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology-audit.md",
  "targetAnchor": "a7-main-checkout-dirty-guard-is-not-a-work-state-guard",
  "targetUnitDigest": "7355d4dcbb4916d6caa1445527a0d1c0e75eca00dd6d9ab58f4d922243a0b7bf",
  "targetAncestry": [
    "Workspace Topology Codebase Audit"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete heading at docs/architect/workspace-topology-audit.md#a7-main-checkout-dirty-guard-is-not-a-work-state-guard (lines 204–204) into docs/platform/system-architecture/architecture/workspace-topology-audit.md#a7-main-checkout-dirty-guard-is-not-a-work-state-guard (lines 227–227), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
## A7. Main Checkout Dirty Guard Is Not A Work-State Guard

Observed code:

- `src/runner/main-checkout-lock.mjs` guards direct main checkout activity.
- It has ambiguity handling, self-recognition, TTL distinction, and hook support.
- Doctor checks stuck merge state and points to manual recovery.

Status: partially solved.

What is good:

- Direct commits against main are guarded.
- Linked-worktree vs main-worktree detection exists.
- Some merge paths distinguish fgOS lifecycle noise from product footprint.

Gap:

- Event append, coordination updates, config repair, projection materialization,
  and activation binding all have separate locks or no topology-level resource
  lease.
- One broad global lock would be safe but too slow; resource-scoped leases are
  needed.
```

### Full target shown text

```text
## A7. Main Checkout Dirty Guard Is Not A Work-State Guard

Observed code:

- `src/runner/main-checkout-lock.mjs` guards direct main checkout activity.
- It has ambiguity handling, self-recognition, TTL distinction, and hook support.
- Doctor checks stuck merge state and points to manual recovery.

Status: partially solved.

What is good:

- Direct commits against main are guarded.
- Linked-worktree vs main-worktree detection exists.
- Some merge paths distinguish fgOS lifecycle noise from product footprint.

Gap:

- Event append, coordination updates, config repair, projection materialization,
  and activation binding all have separate locks or no topology-level resource
  lease.
- One broad global lock would be safe but too slow; resource-scoped leases are
  needed.
```

### Unified diff

```diff
No text difference.
```

## claim_524ee5c47cfaecee876e3d7d8263d3c7

Source: `docs/architect/workspace-topology-audit.md#unheaded-block-35`. Target: `docs/platform/system-architecture/architecture/workspace-topology-audit.md#unheaded-block-37`.

Mechanical class: Unit-exact. Source digest: `fe2196af4c69099dded8ff2178778271d82766921213097571f5115ea7f6577b`. Target digest: `fe2196af4c69099dded8ff2178778271d82766921213097571f5115ea7f6577b`.

Full shown source SHA256: `fe2196af4c69099dded8ff2178778271d82766921213097571f5115ea7f6577b`. Full shown target SHA256: `fe2196af4c69099dded8ff2178778271d82766921213097571f5115ea7f6577b`.

### Proposed decision

```json
{
  "claimId": "claim_524ee5c47cfaecee876e3d7d8263d3c7",
  "sourceUnitDigest": "fe2196af4c69099dded8ff2178778271d82766921213097571f5115ea7f6577b",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology-audit.md",
  "targetAnchor": "unheaded-block-37",
  "targetUnitDigest": "fe2196af4c69099dded8ff2178778271d82766921213097571f5115ea7f6577b",
  "targetAncestry": [
    "Workspace Topology Codebase Audit",
    "A7. Main Checkout Dirty Guard Is Not A Work-State Guard"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/workspace-topology-audit.md#unheaded-block-35 (lines 206–210) into docs/platform/system-architecture/architecture/workspace-topology-audit.md#unheaded-block-37 (lines 229–233), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
Observed code:

- `src/runner/main-checkout-lock.mjs` guards direct main checkout activity.
- It has ambiguity handling, self-recognition, TTL distinction, and hook support.
- Doctor checks stuck merge state and points to manual recovery.
```

### Full target shown text

```text
Observed code:

- `src/runner/main-checkout-lock.mjs` guards direct main checkout activity.
- It has ambiguity handling, self-recognition, TTL distinction, and hook support.
- Doctor checks stuck merge state and points to manual recovery.
```

### Unified diff

```diff
No text difference.
```

## claim_6eaad9a5058bf76391c378bc33b88616

Source: `docs/architect/workspace-topology-audit.md#unheaded-block-36`. Target: `docs/platform/system-architecture/architecture/workspace-topology-audit.md#unheaded-block-38`.

Mechanical class: Judgment. Source digest: `12612166a04d5866ebf6bd4a9eff15e12e5ff8219ea4ae8c52fa1d8e6088c31f`. Target digest: `12612166a04d5866ebf6bd4a9eff15e12e5ff8219ea4ae8c52fa1d8e6088c31f`.

Full shown source SHA256: `12612166a04d5866ebf6bd4a9eff15e12e5ff8219ea4ae8c52fa1d8e6088c31f`. Full shown target SHA256: `12612166a04d5866ebf6bd4a9eff15e12e5ff8219ea4ae8c52fa1d8e6088c31f`.

### Proposed decision

```json
{
  "claimId": "claim_6eaad9a5058bf76391c378bc33b88616",
  "sourceUnitDigest": "12612166a04d5866ebf6bd4a9eff15e12e5ff8219ea4ae8c52fa1d8e6088c31f",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology-audit.md",
  "targetAnchor": "unheaded-block-38",
  "targetUnitDigest": "12612166a04d5866ebf6bd4a9eff15e12e5ff8219ea4ae8c52fa1d8e6088c31f",
  "targetAncestry": [
    "Workspace Topology Codebase Audit",
    "A7. Main Checkout Dirty Guard Is Not A Work-State Guard"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Judgment: digest match points to another occurrence; use the source occurrence line-mapped carrier. Carry the complete unheaded-block at docs/architect/workspace-topology-audit.md#unheaded-block-36 (lines 212–212) into docs/platform/system-architecture/architecture/workspace-topology-audit.md#unheaded-block-38 (lines 235–235), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
Status: partially solved.
```

### Full target shown text

```text
Status: partially solved.
```

### Unified diff

```diff
No text difference.
```

## claim_291df64890ebcb72a6b462c07a839908

Source: `docs/architect/workspace-topology-audit.md#unheaded-block-37`. Target: `docs/platform/system-architecture/architecture/workspace-topology-audit.md#unheaded-block-39`.

Mechanical class: Unit-exact. Source digest: `a9644dc01be4d803493d9f4c23ba5a819877a3f7062f6e7b678dc52d90614c08`. Target digest: `a9644dc01be4d803493d9f4c23ba5a819877a3f7062f6e7b678dc52d90614c08`.

Full shown source SHA256: `a9644dc01be4d803493d9f4c23ba5a819877a3f7062f6e7b678dc52d90614c08`. Full shown target SHA256: `a9644dc01be4d803493d9f4c23ba5a819877a3f7062f6e7b678dc52d90614c08`.

### Proposed decision

```json
{
  "claimId": "claim_291df64890ebcb72a6b462c07a839908",
  "sourceUnitDigest": "a9644dc01be4d803493d9f4c23ba5a819877a3f7062f6e7b678dc52d90614c08",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology-audit.md",
  "targetAnchor": "unheaded-block-39",
  "targetUnitDigest": "a9644dc01be4d803493d9f4c23ba5a819877a3f7062f6e7b678dc52d90614c08",
  "targetAncestry": [
    "Workspace Topology Codebase Audit",
    "A7. Main Checkout Dirty Guard Is Not A Work-State Guard"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/workspace-topology-audit.md#unheaded-block-37 (lines 214–218) into docs/platform/system-architecture/architecture/workspace-topology-audit.md#unheaded-block-39 (lines 237–241), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
What is good:

- Direct commits against main are guarded.
- Linked-worktree vs main-worktree detection exists.
- Some merge paths distinguish fgOS lifecycle noise from product footprint.
```

### Full target shown text

```text
What is good:

- Direct commits against main are guarded.
- Linked-worktree vs main-worktree detection exists.
- Some merge paths distinguish fgOS lifecycle noise from product footprint.
```

### Unified diff

```diff
No text difference.
```

## claim_02ce7f91316cd72ed19ee7ef4336075d

Source: `docs/architect/workspace-topology-audit.md#unheaded-block-38`. Target: `docs/platform/system-architecture/architecture/workspace-topology-audit.md#unheaded-block-40`.

Mechanical class: Unit-exact. Source digest: `41bb5762b59498edf8a3f9e5aa311dad57c08f2d1648a554277586edc1217f4e`. Target digest: `41bb5762b59498edf8a3f9e5aa311dad57c08f2d1648a554277586edc1217f4e`.

Full shown source SHA256: `41bb5762b59498edf8a3f9e5aa311dad57c08f2d1648a554277586edc1217f4e`. Full shown target SHA256: `41bb5762b59498edf8a3f9e5aa311dad57c08f2d1648a554277586edc1217f4e`.

### Proposed decision

```json
{
  "claimId": "claim_02ce7f91316cd72ed19ee7ef4336075d",
  "sourceUnitDigest": "41bb5762b59498edf8a3f9e5aa311dad57c08f2d1648a554277586edc1217f4e",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology-audit.md",
  "targetAnchor": "unheaded-block-40",
  "targetUnitDigest": "41bb5762b59498edf8a3f9e5aa311dad57c08f2d1648a554277586edc1217f4e",
  "targetAncestry": [
    "Workspace Topology Codebase Audit",
    "A7. Main Checkout Dirty Guard Is Not A Work-State Guard"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/workspace-topology-audit.md#unheaded-block-38 (lines 220–226) into docs/platform/system-architecture/architecture/workspace-topology-audit.md#unheaded-block-40 (lines 243–249), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
Gap:

- Event append, coordination updates, config repair, projection materialization,
  and activation binding all have separate locks or no topology-level resource
  lease.
- One broad global lock would be safe but too slow; resource-scoped leases are
  needed.
```

### Full target shown text

```text
Gap:

- Event append, coordination updates, config repair, projection materialization,
  and activation binding all have separate locks or no topology-level resource
  lease.
- One broad global lock would be safe but too slow; resource-scoped leases are
  needed.
```

### Unified diff

```diff
No text difference.
```

## claim_04db4d48fca2d3d16d7ee7eca43731c4

Source: `docs/architect/workspace-topology-audit.md#a8-projection-materialization-is-not-root-solved`. Target: `docs/platform/system-architecture/architecture/workspace-topology-audit.md#a8-projection-materialization-is-not-root-solved`.

Mechanical class: Unit-exact. Source digest: `19db050aade4adbe009ab0bdd07ee1dc8467a5924d94984b6b0ea602c4956e79`. Target digest: `19db050aade4adbe009ab0bdd07ee1dc8467a5924d94984b6b0ea602c4956e79`.

Full shown source SHA256: `3a5a945a6d81e4e84f860317470f22b1ec6c6c15416c064b7dc9136de9e7511c`. Full shown target SHA256: `3a5a945a6d81e4e84f860317470f22b1ec6c6c15416c064b7dc9136de9e7511c`.

### Proposed decision

```json
{
  "claimId": "claim_04db4d48fca2d3d16d7ee7eca43731c4",
  "sourceUnitDigest": "19db050aade4adbe009ab0bdd07ee1dc8467a5924d94984b6b0ea602c4956e79",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology-audit.md",
  "targetAnchor": "a8-projection-materialization-is-not-root-solved",
  "targetUnitDigest": "19db050aade4adbe009ab0bdd07ee1dc8467a5924d94984b6b0ea602c4956e79",
  "targetAncestry": [
    "Workspace Topology Codebase Audit"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete heading at docs/architect/workspace-topology-audit.md#a8-projection-materialization-is-not-root-solved (lines 228–228) into docs/platform/system-architecture/architecture/workspace-topology-audit.md#a8-projection-materialization-is-not-root-solved (lines 251–251), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
## A8. Projection Materialization Is Not Root-Solved

Observed code:

- setup/doctor registry handles many generated/configured surfaces.
- Some generated docs projections can be checked/fixed.
- Logs/cache have moved under ignored buckets.

Status: not root-solved.

Gap:

- No universal projection ledger exists.
- Projection ownership is not encoded as source-owned/generated/managed/refuse.
- Skills, agents, prose, hooks, and managed host files need workspace-local
  materialization without polluting product packaging or dogfood source.
```

### Full target shown text

```text
## A8. Projection Materialization Is Not Root-Solved

Observed code:

- setup/doctor registry handles many generated/configured surfaces.
- Some generated docs projections can be checked/fixed.
- Logs/cache have moved under ignored buckets.

Status: not root-solved.

Gap:

- No universal projection ledger exists.
- Projection ownership is not encoded as source-owned/generated/managed/refuse.
- Skills, agents, prose, hooks, and managed host files need workspace-local
  materialization without polluting product packaging or dogfood source.
```

### Unified diff

```diff
No text difference.
```

## claim_dddfe383878d712740c2321fcb0f0a55

Source: `docs/architect/workspace-topology-audit.md#unheaded-block-39`. Target: `docs/platform/system-architecture/architecture/workspace-topology-audit.md#unheaded-block-41`.

Mechanical class: Unit-exact. Source digest: `1c2b801eb6693f059fa2bf208f4d9ec001301ac606b4a0dfd11ac95a6d0e97e2`. Target digest: `1c2b801eb6693f059fa2bf208f4d9ec001301ac606b4a0dfd11ac95a6d0e97e2`.

Full shown source SHA256: `1c2b801eb6693f059fa2bf208f4d9ec001301ac606b4a0dfd11ac95a6d0e97e2`. Full shown target SHA256: `1c2b801eb6693f059fa2bf208f4d9ec001301ac606b4a0dfd11ac95a6d0e97e2`.

### Proposed decision

```json
{
  "claimId": "claim_dddfe383878d712740c2321fcb0f0a55",
  "sourceUnitDigest": "1c2b801eb6693f059fa2bf208f4d9ec001301ac606b4a0dfd11ac95a6d0e97e2",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology-audit.md",
  "targetAnchor": "unheaded-block-41",
  "targetUnitDigest": "1c2b801eb6693f059fa2bf208f4d9ec001301ac606b4a0dfd11ac95a6d0e97e2",
  "targetAncestry": [
    "Workspace Topology Codebase Audit",
    "A8. Projection Materialization Is Not Root-Solved"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/workspace-topology-audit.md#unheaded-block-39 (lines 230–234) into docs/platform/system-architecture/architecture/workspace-topology-audit.md#unheaded-block-41 (lines 253–257), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
Observed code:

- setup/doctor registry handles many generated/configured surfaces.
- Some generated docs projections can be checked/fixed.
- Logs/cache have moved under ignored buckets.
```

### Full target shown text

```text
Observed code:

- setup/doctor registry handles many generated/configured surfaces.
- Some generated docs projections can be checked/fixed.
- Logs/cache have moved under ignored buckets.
```

### Unified diff

```diff
No text difference.
```

## claim_0c370fc20180821d9c9852a2ba6d9fbf

Source: `docs/architect/workspace-topology-audit.md#unheaded-block-40`. Target: `docs/platform/system-architecture/architecture/workspace-topology-audit.md#unheaded-block-42`.

Mechanical class: Judgment. Source digest: `a2ecec92d152f421e48c77ae0756caa39396574be9421737961f1087e3b76c7a`. Target digest: `a2ecec92d152f421e48c77ae0756caa39396574be9421737961f1087e3b76c7a`.

Full shown source SHA256: `a2ecec92d152f421e48c77ae0756caa39396574be9421737961f1087e3b76c7a`. Full shown target SHA256: `a2ecec92d152f421e48c77ae0756caa39396574be9421737961f1087e3b76c7a`.

### Proposed decision

```json
{
  "claimId": "claim_0c370fc20180821d9c9852a2ba6d9fbf",
  "sourceUnitDigest": "a2ecec92d152f421e48c77ae0756caa39396574be9421737961f1087e3b76c7a",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology-audit.md",
  "targetAnchor": "unheaded-block-42",
  "targetUnitDigest": "a2ecec92d152f421e48c77ae0756caa39396574be9421737961f1087e3b76c7a",
  "targetAncestry": [
    "Workspace Topology Codebase Audit",
    "A8. Projection Materialization Is Not Root-Solved"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Judgment: digest match points to another occurrence; use the source occurrence line-mapped carrier. Carry the complete unheaded-block at docs/architect/workspace-topology-audit.md#unheaded-block-40 (lines 236–236) into docs/platform/system-architecture/architecture/workspace-topology-audit.md#unheaded-block-42 (lines 259–259), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
Status: not root-solved.
```

### Full target shown text

```text
Status: not root-solved.
```

### Unified diff

```diff
No text difference.
```

## claim_d6a7dfb274591cb0bf8c8ec9290d0e3e

Source: `docs/architect/workspace-topology-audit.md#unheaded-block-41`. Target: `docs/platform/system-architecture/architecture/workspace-topology-audit.md#unheaded-block-43`.

Mechanical class: Unit-exact. Source digest: `8483a8a04bb174e0145afce81bd97f991412e7926c04e8c88162ed0dc84617c2`. Target digest: `8483a8a04bb174e0145afce81bd97f991412e7926c04e8c88162ed0dc84617c2`.

Full shown source SHA256: `8483a8a04bb174e0145afce81bd97f991412e7926c04e8c88162ed0dc84617c2`. Full shown target SHA256: `8483a8a04bb174e0145afce81bd97f991412e7926c04e8c88162ed0dc84617c2`.

### Proposed decision

```json
{
  "claimId": "claim_d6a7dfb274591cb0bf8c8ec9290d0e3e",
  "sourceUnitDigest": "8483a8a04bb174e0145afce81bd97f991412e7926c04e8c88162ed0dc84617c2",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology-audit.md",
  "targetAnchor": "unheaded-block-43",
  "targetUnitDigest": "8483a8a04bb174e0145afce81bd97f991412e7926c04e8c88162ed0dc84617c2",
  "targetAncestry": [
    "Workspace Topology Codebase Audit",
    "A8. Projection Materialization Is Not Root-Solved"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/workspace-topology-audit.md#unheaded-block-41 (lines 238–243) into docs/platform/system-architecture/architecture/workspace-topology-audit.md#unheaded-block-43 (lines 261–266), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
Gap:

- No universal projection ledger exists.
- Projection ownership is not encoded as source-owned/generated/managed/refuse.
- Skills, agents, prose, hooks, and managed host files need workspace-local
  materialization without polluting product packaging or dogfood source.
```

### Full target shown text

```text
Gap:

- No universal projection ledger exists.
- Projection ownership is not encoded as source-owned/generated/managed/refuse.
- Skills, agents, prose, hooks, and managed host files need workspace-local
  materialization without polluting product packaging or dogfood source.
```

### Unified diff

```diff
No text difference.
```

## claim_08ab9f9f745a6f48c5d8ca3b461a83bc

Source: `docs/architect/workspace-topology-audit.md#unresolved-or-poorly-solved-sub-problems`. Target: `docs/platform/system-architecture/architecture/workspace-topology-audit.md#unresolved-or-poorly-solved-sub-problems`.

Mechanical class: Unit-exact. Source digest: `7bd9fefa17597b0122a21a1501e1bcb28de90c87e00374c348750104e7219868`. Target digest: `7bd9fefa17597b0122a21a1501e1bcb28de90c87e00374c348750104e7219868`.

Full shown source SHA256: `63db787cc20dff6a3a0ada37ee45ffe412add30aa2a3794db51688b9f621d957`. Full shown target SHA256: `63db787cc20dff6a3a0ada37ee45ffe412add30aa2a3794db51688b9f621d957`.

### Proposed decision

```json
{
  "claimId": "claim_08ab9f9f745a6f48c5d8ca3b461a83bc",
  "sourceUnitDigest": "7bd9fefa17597b0122a21a1501e1bcb28de90c87e00374c348750104e7219868",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology-audit.md",
  "targetAnchor": "unresolved-or-poorly-solved-sub-problems",
  "targetUnitDigest": "7bd9fefa17597b0122a21a1501e1bcb28de90c87e00374c348750104e7219868",
  "targetAncestry": [
    "Workspace Topology Codebase Audit"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete heading at docs/architect/workspace-topology-audit.md#unresolved-or-poorly-solved-sub-problems (lines 245–245) into docs/platform/system-architecture/architecture/workspace-topology-audit.md#unresolved-or-poorly-solved-sub-problems (lines 268–268), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
## Unresolved Or Poorly Solved Sub-Problems

| Sub-Problem | Current Shape | Why It Is Not Root-Solved | Direction |
|---|---|---|---|
| Workspace policy vs shared state root | `.fgos/config.json` is tracked and should follow branches, while claims/events/coordination often resolve through main. | One `.fgos` path still carries both branch policy and shared runtime/work-state meaning. | Split root resolution by state class. |
| Testing config changes inside worktree | Some paths read cwd config; others force main. | Branch cannot reliably validate config changes before merge. | Config keys declare scope and operation-specific read layer. |
| `.fgos` visibility in worktrees | Workers remove `.fgos`; sessions symlink it. | Correct locally, undocumented as workspace kinds. | Define workspace kinds and `.fgos` policy per kind. |
| Hot durable history dirties main | `.fgos/events/` is tracked and active. | Sharding reduces conflicts, not dirty-main. | External hot store + immutable Git checkpoints. |
| Git operations vs event append | `events.lock` covers fgOS appenders only. | Git mutations can still move/revert tracked event files. | Shared resource protocol if history remains in Git. |
| Derived view write amplification | `state.json` rewrites under cache. | Safe but can become performance bottleneck. | Keep V1; move view store later when measured. |
| Runtime namespace collision | Claims live in `.fgos/runtime`. | Packaging also needs runtime namespace. | Split payload/activation from coordination. |
| Claim liveness proof | PID/time/TTL. | Unsafe across reboot/PID reuse/remote/container. | Add boot id, process token, heartbeat, fencing token. |
| Runner/watch activation safety | No distribution lease model. | Long watcher should not block forever; assignments must not race upgrade. | Per-assignment leases, re-read activation between assignments. |
| Coordination root ambiguity | Main-ish `root`, cwd-based `fgosDir`. | Sharing semantics unclear. | Coordination declares `workspaceId` and `workStateId`. |
| Assignment/run-result locality | Gitignored `.fgos/assignments`. | Future gateway/remote visibility depends on root choice. | Classify as runtime coordination / derived execution record. |
| Projection ownership | No universal ledger. | Fix can overwrite wrong checkout/source-owned path. | Workspace projection ledger. |
| Skills/agents/prose install | Must be visible near workspace. | Can pollute product package/dogfood source. | Materialize as workspace projections via local fgos. |
| Dirty-state classification | `.fgos` mixes policy/history/ignored state. | Dirty can mean product, history, generated noise, or config. | Dirty checks classify by state class. |
| Activation cardinality | Shared active binding was considered. | Worktrees may have different pins. | Binding scoped by `workspaceId`; release store shared by digest. |
| New clone adoption | Tracked policy exists; runtime ignored/missing. | Fresh clone needs deterministic bootstrap. | `fgctl init` stages pinned runtime and imports checkpoints. |
| Non-Git behavior | Some paths require git; some tolerate cwd. | Feature degradation not specified. | Explicit non-Git mode. |
| Symlink/multiple path identity | Some realpath helpers exist. | Duplicate workspace records still possible. | Canonicalize by git dirs/realpath; display path is metadata. |
| Recovery authority | Manual vs auto fixes are scattered. | State class does not own recovery rule. | Recovery owner per state class. |
```

### Full target shown text

```text
## Unresolved Or Poorly Solved Sub-Problems

| Sub-Problem | Current Shape | Why It Is Not Root-Solved | Direction |
|---|---|---|---|
| Workspace policy vs shared state root | `.fgos/config.json` is tracked and should follow branches, while claims/events/coordination often resolve through main. | One `.fgos` path still carries both branch policy and shared runtime/work-state meaning. | Split root resolution by state class. |
| Testing config changes inside worktree | Some paths read cwd config; others force main. | Branch cannot reliably validate config changes before merge. | Config keys declare scope and operation-specific read layer. |
| `.fgos` visibility in worktrees | Workers remove `.fgos`; sessions symlink it. | Correct locally, undocumented as workspace kinds. | Define workspace kinds and `.fgos` policy per kind. |
| Hot durable history dirties main | `.fgos/events/` is tracked and active. | Sharding reduces conflicts, not dirty-main. | External hot store + immutable Git checkpoints. |
| Git operations vs event append | `events.lock` covers fgOS appenders only. | Git mutations can still move/revert tracked event files. | Shared resource protocol if history remains in Git. |
| Derived view write amplification | `state.json` rewrites under cache. | Safe but can become performance bottleneck. | Keep V1; move view store later when measured. |
| Runtime namespace collision | Claims live in `.fgos/runtime`. | Packaging also needs runtime namespace. | Split payload/activation from coordination. |
| Claim liveness proof | PID/time/TTL. | Unsafe across reboot/PID reuse/remote/container. | Add boot id, process token, heartbeat, fencing token. |
| Runner/watch activation safety | No distribution lease model. | Long watcher should not block forever; assignments must not race upgrade. | Per-assignment leases, re-read activation between assignments. |
| Coordination root ambiguity | Main-ish `root`, cwd-based `fgosDir`. | Sharing semantics unclear. | Coordination declares `workspaceId` and `workStateId`. |
| Assignment/run-result locality | Gitignored `.fgos/assignments`. | Future gateway/remote visibility depends on root choice. | Classify as runtime coordination / derived execution record. |
| Projection ownership | No universal ledger. | Fix can overwrite wrong checkout/source-owned path. | Workspace projection ledger. |
| Skills/agents/prose install | Must be visible near workspace. | Can pollute product package/dogfood source. | Materialize as workspace projections via local fgos. |
| Dirty-state classification | `.fgos` mixes policy/history/ignored state. | Dirty can mean product, history, generated noise, or config. | Dirty checks classify by state class. |
| Activation cardinality | Shared active binding was considered. | Worktrees may have different pins. | Binding scoped by `workspaceId`; release store shared by digest. |
| New clone adoption | Tracked policy exists; runtime ignored/missing. | Fresh clone needs deterministic bootstrap. | `fgctl init` stages pinned runtime and imports checkpoints. |
| Non-Git behavior | Some paths require git; some tolerate cwd. | Feature degradation not specified. | Explicit non-Git mode. |
| Symlink/multiple path identity | Some realpath helpers exist. | Duplicate workspace records still possible. | Canonicalize by git dirs/realpath; display path is metadata. |
| Recovery authority | Manual vs auto fixes are scattered. | State class does not own recovery rule. | Recovery owner per state class. |
```

### Unified diff

```diff
No text difference.
```

## claim_596d67bf9e870544c21f2422dcc5543a

Source: `docs/architect/workspace-topology-audit.md#unheaded-block-42`. Target: `docs/platform/system-architecture/architecture/workspace-topology-audit.md#unheaded-block-44`.

Mechanical class: Unit-exact. Source digest: `cbe32a215d24e230cc356447fec3e91d0c07a0c50e604aedc09af8a8fee594b5`. Target digest: `cbe32a215d24e230cc356447fec3e91d0c07a0c50e604aedc09af8a8fee594b5`.

Full shown source SHA256: `cbe32a215d24e230cc356447fec3e91d0c07a0c50e604aedc09af8a8fee594b5`. Full shown target SHA256: `cbe32a215d24e230cc356447fec3e91d0c07a0c50e604aedc09af8a8fee594b5`.

### Proposed decision

```json
{
  "claimId": "claim_596d67bf9e870544c21f2422dcc5543a",
  "sourceUnitDigest": "cbe32a215d24e230cc356447fec3e91d0c07a0c50e604aedc09af8a8fee594b5",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology-audit.md",
  "targetAnchor": "unheaded-block-44",
  "targetUnitDigest": "cbe32a215d24e230cc356447fec3e91d0c07a0c50e604aedc09af8a8fee594b5",
  "targetAncestry": [
    "Workspace Topology Codebase Audit",
    "Unresolved Or Poorly Solved Sub-Problems"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/workspace-topology-audit.md#unheaded-block-42 (lines 247–267) into docs/platform/system-architecture/architecture/workspace-topology-audit.md#unheaded-block-44 (lines 270–290), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
| Sub-Problem | Current Shape | Why It Is Not Root-Solved | Direction |
|---|---|---|---|
| Workspace policy vs shared state root | `.fgos/config.json` is tracked and should follow branches, while claims/events/coordination often resolve through main. | One `.fgos` path still carries both branch policy and shared runtime/work-state meaning. | Split root resolution by state class. |
| Testing config changes inside worktree | Some paths read cwd config; others force main. | Branch cannot reliably validate config changes before merge. | Config keys declare scope and operation-specific read layer. |
| `.fgos` visibility in worktrees | Workers remove `.fgos`; sessions symlink it. | Correct locally, undocumented as workspace kinds. | Define workspace kinds and `.fgos` policy per kind. |
| Hot durable history dirties main | `.fgos/events/` is tracked and active. | Sharding reduces conflicts, not dirty-main. | External hot store + immutable Git checkpoints. |
| Git operations vs event append | `events.lock` covers fgOS appenders only. | Git mutations can still move/revert tracked event files. | Shared resource protocol if history remains in Git. |
| Derived view write amplification | `state.json` rewrites under cache. | Safe but can become performance bottleneck. | Keep V1; move view store later when measured. |
| Runtime namespace collision | Claims live in `.fgos/runtime`. | Packaging also needs runtime namespace. | Split payload/activation from coordination. |
| Claim liveness proof | PID/time/TTL. | Unsafe across reboot/PID reuse/remote/container. | Add boot id, process token, heartbeat, fencing token. |
| Runner/watch activation safety | No distribution lease model. | Long watcher should not block forever; assignments must not race upgrade. | Per-assignment leases, re-read activation between assignments. |
| Coordination root ambiguity | Main-ish `root`, cwd-based `fgosDir`. | Sharing semantics unclear. | Coordination declares `workspaceId` and `workStateId`. |
| Assignment/run-result locality | Gitignored `.fgos/assignments`. | Future gateway/remote visibility depends on root choice. | Classify as runtime coordination / derived execution record. |
| Projection ownership | No universal ledger. | Fix can overwrite wrong checkout/source-owned path. | Workspace projection ledger. |
| Skills/agents/prose install | Must be visible near workspace. | Can pollute product package/dogfood source. | Materialize as workspace projections via local fgos. |
| Dirty-state classification | `.fgos` mixes policy/history/ignored state. | Dirty can mean product, history, generated noise, or config. | Dirty checks classify by state class. |
| Activation cardinality | Shared active binding was considered. | Worktrees may have different pins. | Binding scoped by `workspaceId`; release store shared by digest. |
| New clone adoption | Tracked policy exists; runtime ignored/missing. | Fresh clone needs deterministic bootstrap. | `fgctl init` stages pinned runtime and imports checkpoints. |
| Non-Git behavior | Some paths require git; some tolerate cwd. | Feature degradation not specified. | Explicit non-Git mode. |
| Symlink/multiple path identity | Some realpath helpers exist. | Duplicate workspace records still possible. | Canonicalize by git dirs/realpath; display path is metadata. |
| Recovery authority | Manual vs auto fixes are scattered. | State class does not own recovery rule. | Recovery owner per state class. |
```

### Full target shown text

```text
| Sub-Problem | Current Shape | Why It Is Not Root-Solved | Direction |
|---|---|---|---|
| Workspace policy vs shared state root | `.fgos/config.json` is tracked and should follow branches, while claims/events/coordination often resolve through main. | One `.fgos` path still carries both branch policy and shared runtime/work-state meaning. | Split root resolution by state class. |
| Testing config changes inside worktree | Some paths read cwd config; others force main. | Branch cannot reliably validate config changes before merge. | Config keys declare scope and operation-specific read layer. |
| `.fgos` visibility in worktrees | Workers remove `.fgos`; sessions symlink it. | Correct locally, undocumented as workspace kinds. | Define workspace kinds and `.fgos` policy per kind. |
| Hot durable history dirties main | `.fgos/events/` is tracked and active. | Sharding reduces conflicts, not dirty-main. | External hot store + immutable Git checkpoints. |
| Git operations vs event append | `events.lock` covers fgOS appenders only. | Git mutations can still move/revert tracked event files. | Shared resource protocol if history remains in Git. |
| Derived view write amplification | `state.json` rewrites under cache. | Safe but can become performance bottleneck. | Keep V1; move view store later when measured. |
| Runtime namespace collision | Claims live in `.fgos/runtime`. | Packaging also needs runtime namespace. | Split payload/activation from coordination. |
| Claim liveness proof | PID/time/TTL. | Unsafe across reboot/PID reuse/remote/container. | Add boot id, process token, heartbeat, fencing token. |
| Runner/watch activation safety | No distribution lease model. | Long watcher should not block forever; assignments must not race upgrade. | Per-assignment leases, re-read activation between assignments. |
| Coordination root ambiguity | Main-ish `root`, cwd-based `fgosDir`. | Sharing semantics unclear. | Coordination declares `workspaceId` and `workStateId`. |
| Assignment/run-result locality | Gitignored `.fgos/assignments`. | Future gateway/remote visibility depends on root choice. | Classify as runtime coordination / derived execution record. |
| Projection ownership | No universal ledger. | Fix can overwrite wrong checkout/source-owned path. | Workspace projection ledger. |
| Skills/agents/prose install | Must be visible near workspace. | Can pollute product package/dogfood source. | Materialize as workspace projections via local fgos. |
| Dirty-state classification | `.fgos` mixes policy/history/ignored state. | Dirty can mean product, history, generated noise, or config. | Dirty checks classify by state class. |
| Activation cardinality | Shared active binding was considered. | Worktrees may have different pins. | Binding scoped by `workspaceId`; release store shared by digest. |
| New clone adoption | Tracked policy exists; runtime ignored/missing. | Fresh clone needs deterministic bootstrap. | `fgctl init` stages pinned runtime and imports checkpoints. |
| Non-Git behavior | Some paths require git; some tolerate cwd. | Feature degradation not specified. | Explicit non-Git mode. |
| Symlink/multiple path identity | Some realpath helpers exist. | Duplicate workspace records still possible. | Canonicalize by git dirs/realpath; display path is metadata. |
| Recovery authority | Manual vs auto fixes are scattered. | State class does not own recovery rule. | Recovery owner per state class. |
```

### Unified diff

```diff
No text difference.
```

## claim_1a8f534980236d7968fec3a74dd7a142

Source: `docs/architect/workspace-topology-audit.md#audit-conclusion`. Target: `docs/platform/system-architecture/architecture/workspace-topology-audit.md#audit-conclusion`.

Mechanical class: Weak-exact. Source digest: `827070bd42424514129878275385f65a2695b139bcf5428d57114c9b8e2fbeda`. Target digest: `827070bd42424514129878275385f65a2695b139bcf5428d57114c9b8e2fbeda`.

Full shown source SHA256: `b557b6cbe53aba79bd62d2354e53d15f99198557c3c389b9d09af8d3d487608f`. Full shown target SHA256: `b557b6cbe53aba79bd62d2354e53d15f99198557c3c389b9d09af8d3d487608f`.

### Proposed decision

```json
{
  "claimId": "claim_1a8f534980236d7968fec3a74dd7a142",
  "sourceUnitDigest": "827070bd42424514129878275385f65a2695b139bcf5428d57114c9b8e2fbeda",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology-audit.md",
  "targetAnchor": "audit-conclusion",
  "targetUnitDigest": "827070bd42424514129878275385f65a2695b139bcf5428d57114c9b8e2fbeda",
  "targetAncestry": [
    "Workspace Topology Codebase Audit"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. Carry the complete heading at docs/architect/workspace-topology-audit.md#audit-conclusion (lines 269–269) into docs/platform/system-architecture/architecture/workspace-topology-audit.md#audit-conclusion (lines 292–292), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
## Audit Conclusion

The codebase has already converged toward the right idea through localized
fixes. The missing step is to make `TopologyContext` the only accepted primitive
for root and authority decisions.
```

### Full target shown text

```text
## Audit Conclusion

The codebase has already converged toward the right idea through localized
fixes. The missing step is to make `TopologyContext` the only accepted primitive
for root and authority decisions.
```

### Unified diff

```diff
No text difference.
```

## claim_b07bffdb08aec21383f42089d435284f

Source: `docs/architect/workspace-topology-audit.md#unheaded-block-43`. Target: `docs/platform/system-architecture/architecture/workspace-topology-audit.md#unheaded-block-45`.

Mechanical class: Unit-exact. Source digest: `65ca52632e6c4ab1902abc0ba293c2784c40b7127ec0c18e74098c0d29255335`. Target digest: `65ca52632e6c4ab1902abc0ba293c2784c40b7127ec0c18e74098c0d29255335`.

Full shown source SHA256: `65ca52632e6c4ab1902abc0ba293c2784c40b7127ec0c18e74098c0d29255335`. Full shown target SHA256: `65ca52632e6c4ab1902abc0ba293c2784c40b7127ec0c18e74098c0d29255335`.

### Proposed decision

```json
{
  "claimId": "claim_b07bffdb08aec21383f42089d435284f",
  "sourceUnitDigest": "65ca52632e6c4ab1902abc0ba293c2784c40b7127ec0c18e74098c0d29255335",
  "targetOwner": "docs/platform/system-architecture/architecture/workspace-topology-audit.md",
  "targetAnchor": "unheaded-block-45",
  "targetUnitDigest": "65ca52632e6c4ab1902abc0ba293c2784c40b7127ec0c18e74098c0d29255335",
  "targetAncestry": [
    "Workspace Topology Codebase Audit",
    "Audit Conclusion"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/workspace-topology-audit.md#unheaded-block-43 (lines 271–273) into docs/platform/system-architecture/architecture/workspace-topology-audit.md#unheaded-block-45 (lines 294–296), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
The codebase has already converged toward the right idea through localized
fixes. The missing step is to make `TopologyContext` the only accepted primitive
for root and authority decisions.
```

### Full target shown text

```text
The codebase has already converged toward the right idea through localized
fixes. The missing step is to make `TopologyContext` the only accepted primitive
for root and authority decisions.
```

### Unified diff

```diff
No text difference.
```
