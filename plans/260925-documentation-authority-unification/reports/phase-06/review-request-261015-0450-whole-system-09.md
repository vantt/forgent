# Bounded whole-system source review request

Content commit: `a8a10abc1a24218518a14764f68c8d86f4810f91`. Author session: `codex-session:37@2026-10-15`. Review mode requested: ordinary.

Shard: `plans/260925-documentation-authority-unification/ledger/decisions/s6-whole-system-roadmap.json`. Part 1/1; entries: **37**. Sidecar: `review-request-261015-0450-whole-system-09.md.json`.

Read review-brief.md, owner-answers.md A28–A37, frozen whole-system map, constitution, vocabulary and shard schema. Apply A36: mechanically check every row (full digest recompute, anchor check, shard/pack equality); deeply read the reviewer-seeded sample plus every differing-digest row in both directions with its diff. Preserve conditions, qualifiers, dated status and complete payload; verify one owner and labelled additions. No approval is supplied here.

Step 6’s closing review is a **checkpoint review whose sensitivity pack the reviewer holds**. The author has not created, seen or selected that pack/key. Ordinary review and A36 sampling do not replace checkpoint sensitivity.

Ordinary verdict contract: `Reviewer: <independent identity>`, `Review mode: ordinary`, request/content/shard pins; one own note and full 64-hex shown-unit digests per row. Use ok/rework/hold. Consolidate parts into a complete report for the original shard before unchanged ordinary application; never edit decisions manually.

| Claim | Verdict | Note | Source digest | Target digest |
|---|---|---|---|---|

A36 mandatory differing-digest rows (1): `claim_c1c9b1fba823738fc52c30de816c233b`.

Absent-target rows (0): none.

This pack has 12 Weak-exact/Judgment rows; reviewer independently draws/records at least 10 by seed (>=15%, minimum 10, all if fewer), plus every differing pair listed above. Each verdict note says deep or mechanical. If >3% of deep-read rows need rework, deeply read the complete pack before reporting. Author selected no sample. Whole batch: 300 Unit-exact, 392 Weak-exact, 134 Judgment, all 826 pending; 123 mandatory differing pairs. The 79-row batch-wide lower bound does not replace each pack minimum.

Reverse review: the separate native candidate-unverified request/list covers the complete scoped population; it is not reset per sliced pack. Full shown text hashes below bind payload separately from native heading identity digests.

## claim_c1c9b1fba823738fc52c30de816c233b

Source: `docs/architect/roadmap.md#architect-roadmap`. Target: `docs/platform/system-architecture/architecture/roadmap.md#architect-roadmap`.

Mechanical class: Judgment. Source digest: `14baa7da6d628dddad76498d0e5564e5b5d47fff29137ebbaf924fd43ae03df7`. Target digest: `1a0f208445f489e61d09f4d14d071ffdf2264934e00885f94fc7865a9944fe7b`.

Full shown source SHA256: `9b55277399b0a949d525f6c35d55d02b2d3cdf3ac20f393901692c82d09b31c1`. Full shown target SHA256: `703b153bbef5c9b27856ab5a26919679bb2df2b648878702758d44506e6e284d`.

### Proposed decision

```json
{
  "claimId": "claim_c1c9b1fba823738fc52c30de816c233b",
  "sourceUnitDigest": "14baa7da6d628dddad76498d0e5564e5b5d47fff29137ebbaf924fd43ae03df7",
  "targetOwner": "docs/platform/system-architecture/architecture/roadmap.md",
  "targetAnchor": "architect-roadmap",
  "targetUnitDigest": "1a0f208445f489e61d09f4d14d071ffdf2264934e00885f94fc7865a9944fe7b",
  "targetAncestry": [],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Judgment: no target digest match. Carry the complete heading at docs/architect/roadmap.md#architect-roadmap (lines 1–1) into docs/platform/system-architecture/architecture/roadmap.md#architect-roadmap (lines 1–1), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. Digest differences come only from the recorded candidate header/frontmatter fence, heading-level shift or physical relative-link rebasing; full before/after units and line mapping are in authoring accounting. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

````text
# Architect Roadmap

Document type: Architecture roadmap
Design status: Living planning document
Implementation: Mixed
Last reviewed: 2026-09-04
Canonical for: sequencing architecture work under `docs/architect/`

This roadmap keeps the large architecture streams in one place so the work can
move in a deliberate order and still deliver quickly. It is not the product
backlog and it is not a task registry. Its job is to preserve sequence,
dependency, architectural intent, and the minimum high-level plan needed to
avoid analysis drift while several cross-cutting redesigns are open at the
same time.

The operating principle is:

```txt
Decide the boundary first.
Write the smallest contract that can be implemented.
Deliver one proof slice.
Feed the result back into the architecture only when evidence changes it.
```
````

### Full target shown text

````text
# Architect Roadmap

```txt
Document type: Architecture
Audience: Human reviewer, architect, maintainer, agent
Purpose: Preserve the complete roadmap.md source at its frozen-map candidate owner
Design status: Candidate
Implementation: Partial — inherited source qualifications; not independently truth-verified
Provenance: docs/architect/roadmap.md at 69dd3ee7fd84bc5e93fe9c75d63622d4f5aa8539 (blob 9f457e6a5bc4dfe7da05a6f7dec7c14aa5dc44a3)
Writer type: Agent carriage; independent review pending
Canonical for: Nothing until promotion; current source remains docs/architect/roadmap.md
Use this when: Reviewing whole-system candidate carriage and placement
Do not use this for: Inferring implementation, promotion or superseding source authority
Last reviewed: Pending independent review
Related:
- docs/architect/roadmap.md
- docs/platform/component-boundary.md
- docs/platform/architecture-map.md
Supersedes: None — candidate only
Superseded by: None
```

Added in candidate: migration metadata and physical link rebasing. Original source metadata, dates, design limits and historic claims below are provenance, not fresh review. Current truth is unverified; A28 requires sampled truth review at this checkpoint and full truth review at promotion.


Document type: Architecture roadmap
Design status: Living planning document
Implementation: Mixed
Last reviewed: 2026-09-04
Canonical for: sequencing architecture work under `docs/architect/`

This roadmap keeps the large architecture streams in one place so the work can
move in a deliberate order and still deliver quickly. It is not the product
backlog and it is not a task registry. Its job is to preserve sequence,
dependency, architectural intent, and the minimum high-level plan needed to
avoid analysis drift while several cross-cutting redesigns are open at the
same time.

The operating principle is:

```txt
Decide the boundary first.
Write the smallest contract that can be implemented.
Deliver one proof slice.
Feed the result back into the architecture only when evidence changes it.
```
````

### Unified diff

````diff
--- docs/architect/roadmap.md#architect-roadmap
+++ docs/platform/system-architecture/architecture/roadmap.md#architect-roadmap
@@ -1,4 +1,27 @@
 # Architect Roadmap
+
+```txt
+Document type: Architecture
+Audience: Human reviewer, architect, maintainer, agent
+Purpose: Preserve the complete roadmap.md source at its frozen-map candidate owner
+Design status: Candidate
+Implementation: Partial — inherited source qualifications; not independently truth-verified
+Provenance: docs/architect/roadmap.md at 69dd3ee7fd84bc5e93fe9c75d63622d4f5aa8539 (blob 9f457e6a5bc4dfe7da05a6f7dec7c14aa5dc44a3)
+Writer type: Agent carriage; independent review pending
+Canonical for: Nothing until promotion; current source remains docs/architect/roadmap.md
+Use this when: Reviewing whole-system candidate carriage and placement
+Do not use this for: Inferring implementation, promotion or superseding source authority
+Last reviewed: Pending independent review
+Related:
+- docs/architect/roadmap.md
+- docs/platform/component-boundary.md
+- docs/platform/architecture-map.md
+Supersedes: None — candidate only
+Superseded by: None
+```
+
+Added in candidate: migration metadata and physical link rebasing. Original source metadata, dates, design limits and historic claims below are provenance, not fresh review. Current truth is unverified; A28 requires sampled truth review at this checkpoint and full truth review at promotion.
+
 
 Document type: Architecture roadmap
 Design status: Living planning document

````

## claim_60f6edf61f77cd31a40bd4e7d23be61d

Source: `docs/architect/roadmap.md#unheaded-block-1`. Target: `docs/platform/system-architecture/architecture/roadmap.md#unheaded-block-3`.

Mechanical class: Unit-exact. Source digest: `c41500ab364afc291b7b0bff5b6373420f16251c876602e8aac50d447cc78b54`. Target digest: `c41500ab364afc291b7b0bff5b6373420f16251c876602e8aac50d447cc78b54`.

Full shown source SHA256: `c41500ab364afc291b7b0bff5b6373420f16251c876602e8aac50d447cc78b54`. Full shown target SHA256: `c41500ab364afc291b7b0bff5b6373420f16251c876602e8aac50d447cc78b54`.

### Proposed decision

```json
{
  "claimId": "claim_60f6edf61f77cd31a40bd4e7d23be61d",
  "sourceUnitDigest": "c41500ab364afc291b7b0bff5b6373420f16251c876602e8aac50d447cc78b54",
  "targetOwner": "docs/platform/system-architecture/architecture/roadmap.md",
  "targetAnchor": "unheaded-block-3",
  "targetUnitDigest": "c41500ab364afc291b7b0bff5b6373420f16251c876602e8aac50d447cc78b54",
  "targetAncestry": [
    "Architect Roadmap"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/roadmap.md#unheaded-block-1 (lines 3–7) into docs/platform/system-architecture/architecture/roadmap.md#unheaded-block-3 (lines 26–30), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
Document type: Architecture roadmap
Design status: Living planning document
Implementation: Mixed
Last reviewed: 2026-09-04
Canonical for: sequencing architecture work under `docs/architect/`
```

### Full target shown text

```text
Document type: Architecture roadmap
Design status: Living planning document
Implementation: Mixed
Last reviewed: 2026-09-04
Canonical for: sequencing architecture work under `docs/architect/`
```

### Unified diff

```diff
No text difference.
```

## claim_df79ecb132c646b624704774ed75d7ac

Source: `docs/architect/roadmap.md#unheaded-block-2`. Target: `docs/platform/system-architecture/architecture/roadmap.md#unheaded-block-4`.

Mechanical class: Unit-exact. Source digest: `c0b2bddfecfbead604082d26c2c92d55e66a8567b53337410184676e8e6167dd`. Target digest: `c0b2bddfecfbead604082d26c2c92d55e66a8567b53337410184676e8e6167dd`.

Full shown source SHA256: `c0b2bddfecfbead604082d26c2c92d55e66a8567b53337410184676e8e6167dd`. Full shown target SHA256: `c0b2bddfecfbead604082d26c2c92d55e66a8567b53337410184676e8e6167dd`.

### Proposed decision

```json
{
  "claimId": "claim_df79ecb132c646b624704774ed75d7ac",
  "sourceUnitDigest": "c0b2bddfecfbead604082d26c2c92d55e66a8567b53337410184676e8e6167dd",
  "targetOwner": "docs/platform/system-architecture/architecture/roadmap.md",
  "targetAnchor": "unheaded-block-4",
  "targetUnitDigest": "c0b2bddfecfbead604082d26c2c92d55e66a8567b53337410184676e8e6167dd",
  "targetAncestry": [
    "Architect Roadmap"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/roadmap.md#unheaded-block-2 (lines 9–14) into docs/platform/system-architecture/architecture/roadmap.md#unheaded-block-4 (lines 32–37), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
This roadmap keeps the large architecture streams in one place so the work can
move in a deliberate order and still deliver quickly. It is not the product
backlog and it is not a task registry. Its job is to preserve sequence,
dependency, architectural intent, and the minimum high-level plan needed to
avoid analysis drift while several cross-cutting redesigns are open at the
same time.
```

### Full target shown text

```text
This roadmap keeps the large architecture streams in one place so the work can
move in a deliberate order and still deliver quickly. It is not the product
backlog and it is not a task registry. Its job is to preserve sequence,
dependency, architectural intent, and the minimum high-level plan needed to
avoid analysis drift while several cross-cutting redesigns are open at the
same time.
```

### Unified diff

```diff
No text difference.
```

## claim_f3eddd82c8614c393b22fde80ca52844

Source: `docs/architect/roadmap.md#unheaded-block-3`. Target: `docs/platform/system-architecture/architecture/roadmap.md#unheaded-block-5`.

Mechanical class: Weak-exact. Source digest: `7d2719b4ab11857c800283b1f76a0f5276d7e1eeba0ab804c465aef0f4fce182`. Target digest: `7d2719b4ab11857c800283b1f76a0f5276d7e1eeba0ab804c465aef0f4fce182`.

Full shown source SHA256: `7d2719b4ab11857c800283b1f76a0f5276d7e1eeba0ab804c465aef0f4fce182`. Full shown target SHA256: `7d2719b4ab11857c800283b1f76a0f5276d7e1eeba0ab804c465aef0f4fce182`.

### Proposed decision

```json
{
  "claimId": "claim_f3eddd82c8614c393b22fde80ca52844",
  "sourceUnitDigest": "7d2719b4ab11857c800283b1f76a0f5276d7e1eeba0ab804c465aef0f4fce182",
  "targetOwner": "docs/platform/system-architecture/architecture/roadmap.md",
  "targetAnchor": "unheaded-block-5",
  "targetUnitDigest": "7d2719b4ab11857c800283b1f76a0f5276d7e1eeba0ab804c465aef0f4fce182",
  "targetAncestry": [
    "Architect Roadmap"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. Carry the complete unheaded-block at docs/architect/roadmap.md#unheaded-block-3 (lines 16–16) into docs/platform/system-architecture/architecture/roadmap.md#unheaded-block-5 (lines 39–39), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
The operating principle is:
```

### Full target shown text

```text
The operating principle is:
```

### Unified diff

```diff
No text difference.
```

## claim_7f275ff7eb2a6a72149d05f533eb57fd

Source: `docs/architect/roadmap.md#unheaded-block-4`. Target: `docs/platform/system-architecture/architecture/roadmap.md#unheaded-block-6`.

Mechanical class: Unit-exact. Source digest: `354f10ad35d975216101989dcad6dbfe5bb5bfc3134e4b5978389002f984466c`. Target digest: `354f10ad35d975216101989dcad6dbfe5bb5bfc3134e4b5978389002f984466c`.

Full shown source SHA256: `354f10ad35d975216101989dcad6dbfe5bb5bfc3134e4b5978389002f984466c`. Full shown target SHA256: `354f10ad35d975216101989dcad6dbfe5bb5bfc3134e4b5978389002f984466c`.

### Proposed decision

```json
{
  "claimId": "claim_7f275ff7eb2a6a72149d05f533eb57fd",
  "sourceUnitDigest": "354f10ad35d975216101989dcad6dbfe5bb5bfc3134e4b5978389002f984466c",
  "targetOwner": "docs/platform/system-architecture/architecture/roadmap.md",
  "targetAnchor": "unheaded-block-6",
  "targetUnitDigest": "354f10ad35d975216101989dcad6dbfe5bb5bfc3134e4b5978389002f984466c",
  "targetAncestry": [
    "Architect Roadmap"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/roadmap.md#unheaded-block-4 (lines 18–23) into docs/platform/system-architecture/architecture/roadmap.md#unheaded-block-6 (lines 41–46), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

````text
```txt
Decide the boundary first.
Write the smallest contract that can be implemented.
Deliver one proof slice.
Feed the result back into the architecture only when evidence changes it.
```
````

### Full target shown text

````text
```txt
Decide the boundary first.
Write the smallest contract that can be implemented.
Deliver one proof slice.
Feed the result back into the architecture only when evidence changes it.
```
````

### Unified diff

```diff
No text difference.
```

## claim_3ad84c4f53da80446a324e8e65a9e6ce

Source: `docs/architect/roadmap.md#1-current-active-streams`. Target: `docs/platform/system-architecture/architecture/roadmap.md#1-current-active-streams`.

Mechanical class: Weak-exact. Source digest: `907fe5aed1e12e0b4321f85be390d81c57491cf15563a0a19ccd67a77a272b15`. Target digest: `907fe5aed1e12e0b4321f85be390d81c57491cf15563a0a19ccd67a77a272b15`.

Full shown source SHA256: `fd461fc7c312a05f87dae63686397a4b63447814b6ac9d43916fad91c3720728`. Full shown target SHA256: `fd461fc7c312a05f87dae63686397a4b63447814b6ac9d43916fad91c3720728`.

### Proposed decision

```json
{
  "claimId": "claim_3ad84c4f53da80446a324e8e65a9e6ce",
  "sourceUnitDigest": "907fe5aed1e12e0b4321f85be390d81c57491cf15563a0a19ccd67a77a272b15",
  "targetOwner": "docs/platform/system-architecture/architecture/roadmap.md",
  "targetAnchor": "1-current-active-streams",
  "targetUnitDigest": "907fe5aed1e12e0b4321f85be390d81c57491cf15563a0a19ccd67a77a272b15",
  "targetAncestry": [
    "Architect Roadmap"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. Carry the complete heading at docs/architect/roadmap.md#1-current-active-streams (lines 25–25) into docs/platform/system-architecture/architecture/roadmap.md#1-current-active-streams (lines 48–48), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
## 1. Current Active Streams

| Stream | Primary Docs | Current Role | Depends On | Blocks / Informs |
|---|---|---|---|---|
| Agent Coordination / Execution Core | `agent-coordination/`, `proposals/step-09-group-thinking-substrate.md` | Post-P4, the coordination engine is retired in favor of CollaborationPattern (Unit run) and Workflow runner (`src/workflow/**`). Historical contracts are preserved in `agent-coordination/contracts/`. | Existing Work lifecycle, runner contracts, and accepted proof artifacts. | Coding-domain adoption, runner autonomy, host/gateway visibility. |
| Coding Domain / Step 10 | `proposals/step-10-coding-domain-adoption.md`, `domainization/`, coding-domain specs/history outside this folder | Make the existing coding domain a real consumer of the reusable Work Driver Core plus Workflow runner and Execution Core, without moving Work lifecycle, git, merge, or status authority into Agent Coordination. | Accepted proof slice, component authority guardrails, and the topology contract for any workspace/worktree mutation. | Real project development workflow, future non-coding domains such as marketing/business workflows, fgOS dogfood, runner unification, package cleanliness. |
| Workspace Topology | `workspace-topology.md`, `workspace-topology-roadmap.md`, `workspace-topology-audit.md` | Define repository/workspace/work-state/runtime identities, root ownership, state classes, worktree modes, and mutation topology; absorb the legacy `.fgos/runtime` and hot-history placement debt. | Current eventlog/worktree/coordination reality. | Packaging, Work State, Coding Domain, runtime coordination, config/init/doctor. |
| Component Boundary | `component-boundary/`, `proposals/component-authority-boundary-map.md` | Keep high-level component responsibilities and authority boundaries explicit before source layout or implementation migration. | Current architecture evidence from active streams. | Host Invocation, packaging split, repo-layout cleanup, Rust migration. |
| Host Invocation / fgOS CLI | `host-invocation-routing/` | Define how CLI, remote, gateway, chat, MCP, and future hosts enter one semantic operation path and select providers. | Component boundary and local payload selection. | Node-to-Rust migration, gateway adapter, distribution payload identity. |
| Node To Rust Migration | `host-invocation-routing/node-to-rust-component-migration.md`, `host-invocation-routing/rust-cli-and-proof-components-plan.md` | Move implementation one component at a time from Node to Rust without changing public semantics prematurely. | Host Invocation and Distribution artifact boundaries. | Public Rust `fgos` entry flip, legacy Node compatibility removal. |
| Packaging And Distribution | `packaging-distribution/` | Design correct install, runtime identity, activation, payload records, `fgctl`, local `fgos`, and workshop materialization model. Shared gateway/web are architecture constraints, not current delivery scope. | Component boundary, Host Invocation, current distribution specs. | Rust `fgos` CLI release, project-local version safety, self-host cleanliness, future shared web/gateway. |
```

### Full target shown text

```text
## 1. Current Active Streams

| Stream | Primary Docs | Current Role | Depends On | Blocks / Informs |
|---|---|---|---|---|
| Agent Coordination / Execution Core | `agent-coordination/`, `proposals/step-09-group-thinking-substrate.md` | Post-P4, the coordination engine is retired in favor of CollaborationPattern (Unit run) and Workflow runner (`src/workflow/**`). Historical contracts are preserved in `agent-coordination/contracts/`. | Existing Work lifecycle, runner contracts, and accepted proof artifacts. | Coding-domain adoption, runner autonomy, host/gateway visibility. |
| Coding Domain / Step 10 | `proposals/step-10-coding-domain-adoption.md`, `domainization/`, coding-domain specs/history outside this folder | Make the existing coding domain a real consumer of the reusable Work Driver Core plus Workflow runner and Execution Core, without moving Work lifecycle, git, merge, or status authority into Agent Coordination. | Accepted proof slice, component authority guardrails, and the topology contract for any workspace/worktree mutation. | Real project development workflow, future non-coding domains such as marketing/business workflows, fgOS dogfood, runner unification, package cleanliness. |
| Workspace Topology | `workspace-topology.md`, `workspace-topology-roadmap.md`, `workspace-topology-audit.md` | Define repository/workspace/work-state/runtime identities, root ownership, state classes, worktree modes, and mutation topology; absorb the legacy `.fgos/runtime` and hot-history placement debt. | Current eventlog/worktree/coordination reality. | Packaging, Work State, Coding Domain, runtime coordination, config/init/doctor. |
| Component Boundary | `component-boundary/`, `proposals/component-authority-boundary-map.md` | Keep high-level component responsibilities and authority boundaries explicit before source layout or implementation migration. | Current architecture evidence from active streams. | Host Invocation, packaging split, repo-layout cleanup, Rust migration. |
| Host Invocation / fgOS CLI | `host-invocation-routing/` | Define how CLI, remote, gateway, chat, MCP, and future hosts enter one semantic operation path and select providers. | Component boundary and local payload selection. | Node-to-Rust migration, gateway adapter, distribution payload identity. |
| Node To Rust Migration | `host-invocation-routing/node-to-rust-component-migration.md`, `host-invocation-routing/rust-cli-and-proof-components-plan.md` | Move implementation one component at a time from Node to Rust without changing public semantics prematurely. | Host Invocation and Distribution artifact boundaries. | Public Rust `fgos` entry flip, legacy Node compatibility removal. |
| Packaging And Distribution | `packaging-distribution/` | Design correct install, runtime identity, activation, payload records, `fgctl`, local `fgos`, and workshop materialization model. Shared gateway/web are architecture constraints, not current delivery scope. | Component boundary, Host Invocation, current distribution specs. | Rust `fgos` CLI release, project-local version safety, self-host cleanliness, future shared web/gateway. |
```

### Unified diff

```diff
No text difference.
```

## claim_c4bac2a1ec727560e4ea521fc5c3ab3b

Source: `docs/architect/roadmap.md#unheaded-block-5`. Target: `docs/platform/system-architecture/architecture/roadmap.md#unheaded-block-7`.

Mechanical class: Unit-exact. Source digest: `f07e30c4a860b7ec245abcbebcde39742b84acd56aa582a06c270ee97a387a4d`. Target digest: `f07e30c4a860b7ec245abcbebcde39742b84acd56aa582a06c270ee97a387a4d`.

Full shown source SHA256: `f07e30c4a860b7ec245abcbebcde39742b84acd56aa582a06c270ee97a387a4d`. Full shown target SHA256: `f07e30c4a860b7ec245abcbebcde39742b84acd56aa582a06c270ee97a387a4d`.

### Proposed decision

```json
{
  "claimId": "claim_c4bac2a1ec727560e4ea521fc5c3ab3b",
  "sourceUnitDigest": "f07e30c4a860b7ec245abcbebcde39742b84acd56aa582a06c270ee97a387a4d",
  "targetOwner": "docs/platform/system-architecture/architecture/roadmap.md",
  "targetAnchor": "unheaded-block-7",
  "targetUnitDigest": "f07e30c4a860b7ec245abcbebcde39742b84acd56aa582a06c270ee97a387a4d",
  "targetAncestry": [
    "Architect Roadmap",
    "1. Current Active Streams"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/roadmap.md#unheaded-block-5 (lines 27–35) into docs/platform/system-architecture/architecture/roadmap.md#unheaded-block-7 (lines 50–58), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
| Stream | Primary Docs | Current Role | Depends On | Blocks / Informs |
|---|---|---|---|---|
| Agent Coordination / Execution Core | `agent-coordination/`, `proposals/step-09-group-thinking-substrate.md` | Post-P4, the coordination engine is retired in favor of CollaborationPattern (Unit run) and Workflow runner (`src/workflow/**`). Historical contracts are preserved in `agent-coordination/contracts/`. | Existing Work lifecycle, runner contracts, and accepted proof artifacts. | Coding-domain adoption, runner autonomy, host/gateway visibility. |
| Coding Domain / Step 10 | `proposals/step-10-coding-domain-adoption.md`, `domainization/`, coding-domain specs/history outside this folder | Make the existing coding domain a real consumer of the reusable Work Driver Core plus Workflow runner and Execution Core, without moving Work lifecycle, git, merge, or status authority into Agent Coordination. | Accepted proof slice, component authority guardrails, and the topology contract for any workspace/worktree mutation. | Real project development workflow, future non-coding domains such as marketing/business workflows, fgOS dogfood, runner unification, package cleanliness. |
| Workspace Topology | `workspace-topology.md`, `workspace-topology-roadmap.md`, `workspace-topology-audit.md` | Define repository/workspace/work-state/runtime identities, root ownership, state classes, worktree modes, and mutation topology; absorb the legacy `.fgos/runtime` and hot-history placement debt. | Current eventlog/worktree/coordination reality. | Packaging, Work State, Coding Domain, runtime coordination, config/init/doctor. |
| Component Boundary | `component-boundary/`, `proposals/component-authority-boundary-map.md` | Keep high-level component responsibilities and authority boundaries explicit before source layout or implementation migration. | Current architecture evidence from active streams. | Host Invocation, packaging split, repo-layout cleanup, Rust migration. |
| Host Invocation / fgOS CLI | `host-invocation-routing/` | Define how CLI, remote, gateway, chat, MCP, and future hosts enter one semantic operation path and select providers. | Component boundary and local payload selection. | Node-to-Rust migration, gateway adapter, distribution payload identity. |
| Node To Rust Migration | `host-invocation-routing/node-to-rust-component-migration.md`, `host-invocation-routing/rust-cli-and-proof-components-plan.md` | Move implementation one component at a time from Node to Rust without changing public semantics prematurely. | Host Invocation and Distribution artifact boundaries. | Public Rust `fgos` entry flip, legacy Node compatibility removal. |
| Packaging And Distribution | `packaging-distribution/` | Design correct install, runtime identity, activation, payload records, `fgctl`, local `fgos`, and workshop materialization model. Shared gateway/web are architecture constraints, not current delivery scope. | Component boundary, Host Invocation, current distribution specs. | Rust `fgos` CLI release, project-local version safety, self-host cleanliness, future shared web/gateway. |
```

### Full target shown text

```text
| Stream | Primary Docs | Current Role | Depends On | Blocks / Informs |
|---|---|---|---|---|
| Agent Coordination / Execution Core | `agent-coordination/`, `proposals/step-09-group-thinking-substrate.md` | Post-P4, the coordination engine is retired in favor of CollaborationPattern (Unit run) and Workflow runner (`src/workflow/**`). Historical contracts are preserved in `agent-coordination/contracts/`. | Existing Work lifecycle, runner contracts, and accepted proof artifacts. | Coding-domain adoption, runner autonomy, host/gateway visibility. |
| Coding Domain / Step 10 | `proposals/step-10-coding-domain-adoption.md`, `domainization/`, coding-domain specs/history outside this folder | Make the existing coding domain a real consumer of the reusable Work Driver Core plus Workflow runner and Execution Core, without moving Work lifecycle, git, merge, or status authority into Agent Coordination. | Accepted proof slice, component authority guardrails, and the topology contract for any workspace/worktree mutation. | Real project development workflow, future non-coding domains such as marketing/business workflows, fgOS dogfood, runner unification, package cleanliness. |
| Workspace Topology | `workspace-topology.md`, `workspace-topology-roadmap.md`, `workspace-topology-audit.md` | Define repository/workspace/work-state/runtime identities, root ownership, state classes, worktree modes, and mutation topology; absorb the legacy `.fgos/runtime` and hot-history placement debt. | Current eventlog/worktree/coordination reality. | Packaging, Work State, Coding Domain, runtime coordination, config/init/doctor. |
| Component Boundary | `component-boundary/`, `proposals/component-authority-boundary-map.md` | Keep high-level component responsibilities and authority boundaries explicit before source layout or implementation migration. | Current architecture evidence from active streams. | Host Invocation, packaging split, repo-layout cleanup, Rust migration. |
| Host Invocation / fgOS CLI | `host-invocation-routing/` | Define how CLI, remote, gateway, chat, MCP, and future hosts enter one semantic operation path and select providers. | Component boundary and local payload selection. | Node-to-Rust migration, gateway adapter, distribution payload identity. |
| Node To Rust Migration | `host-invocation-routing/node-to-rust-component-migration.md`, `host-invocation-routing/rust-cli-and-proof-components-plan.md` | Move implementation one component at a time from Node to Rust without changing public semantics prematurely. | Host Invocation and Distribution artifact boundaries. | Public Rust `fgos` entry flip, legacy Node compatibility removal. |
| Packaging And Distribution | `packaging-distribution/` | Design correct install, runtime identity, activation, payload records, `fgctl`, local `fgos`, and workshop materialization model. Shared gateway/web are architecture constraints, not current delivery scope. | Component boundary, Host Invocation, current distribution specs. | Rust `fgos` CLI release, project-local version safety, self-host cleanliness, future shared web/gateway. |
```

### Unified diff

```diff
No text difference.
```

## claim_1364dba43b0ce6273740c06b92f67460

Source: `docs/architect/roadmap.md#2-dependency-shape`. Target: `docs/platform/system-architecture/architecture/roadmap.md#2-dependency-shape`.

Mechanical class: Weak-exact. Source digest: `55cda3b4b2d558ccff0d07dd19d8c9ccfcec7f8b068a486676e3db6cbcb347cf`. Target digest: `55cda3b4b2d558ccff0d07dd19d8c9ccfcec7f8b068a486676e3db6cbcb347cf`.

Full shown source SHA256: `a528b90b838e2b51cc64577f5d046225d6e8bb41ac8271f512dd4f8a951236e5`. Full shown target SHA256: `a528b90b838e2b51cc64577f5d046225d6e8bb41ac8271f512dd4f8a951236e5`.

### Proposed decision

```json
{
  "claimId": "claim_1364dba43b0ce6273740c06b92f67460",
  "sourceUnitDigest": "55cda3b4b2d558ccff0d07dd19d8c9ccfcec7f8b068a486676e3db6cbcb347cf",
  "targetOwner": "docs/platform/system-architecture/architecture/roadmap.md",
  "targetAnchor": "2-dependency-shape",
  "targetUnitDigest": "55cda3b4b2d558ccff0d07dd19d8c9ccfcec7f8b068a486676e3db6cbcb347cf",
  "targetAncestry": [
    "Architect Roadmap"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. Carry the complete heading at docs/architect/roadmap.md#2-dependency-shape (lines 37–37) into docs/platform/system-architecture/architecture/roadmap.md#2-dependency-shape (lines 60–60), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

````text
## 2. Dependency Shape

The streams are coupled, but they should not move in an arbitrary order.

```txt
Accepted Agent Coordination + Step 09 contracts
  -> Step 10 Coding Domain read-only adoption
  -> Workspace Topology enforcement lane
  -> Step 10 mutating adoption / runner unification
  -> Component Boundary consolidation
  -> Packaging And Distribution
  <-> Host Invocation / fgOS CLI
  -> Node To Rust public release
```

This is not a strict implementation sequence. It is the order in which
architecture assumptions should be stabilized:

1. Agent Coordination defines the reusable coordination/session substrate.
2. Step 09 is now closed for the implemented slice, so Coding Domain can start
   consuming the accepted read-only primitives.
3. Workspace Topology defines root ownership, state classes, and worktree
   mutation invariants before Step 10 opens mutating or fan-out paths.
4. Component Boundary names the components and authority owners.
5. Packaging And Distribution defines how the correct local payload is
   selected, trusted, activated, materialized, and repaired.
6. Host Invocation defines how external surfaces enter semantic operations
   after payload identity is known. In practice, steps 4 and 5 iterate: the
   payload needs a minimum callable ABI, and the host needs a concrete payload
   selection boundary.
7. Node To Rust public release uses the settled payload/provider boundary.

When a later stream discovers a missing assumption, it should feed back into
the earlier stream explicitly instead of patching around it locally.
````

### Full target shown text

````text
## 2. Dependency Shape

The streams are coupled, but they should not move in an arbitrary order.

```txt
Accepted Agent Coordination + Step 09 contracts
  -> Step 10 Coding Domain read-only adoption
  -> Workspace Topology enforcement lane
  -> Step 10 mutating adoption / runner unification
  -> Component Boundary consolidation
  -> Packaging And Distribution
  <-> Host Invocation / fgOS CLI
  -> Node To Rust public release
```

This is not a strict implementation sequence. It is the order in which
architecture assumptions should be stabilized:

1. Agent Coordination defines the reusable coordination/session substrate.
2. Step 09 is now closed for the implemented slice, so Coding Domain can start
   consuming the accepted read-only primitives.
3. Workspace Topology defines root ownership, state classes, and worktree
   mutation invariants before Step 10 opens mutating or fan-out paths.
4. Component Boundary names the components and authority owners.
5. Packaging And Distribution defines how the correct local payload is
   selected, trusted, activated, materialized, and repaired.
6. Host Invocation defines how external surfaces enter semantic operations
   after payload identity is known. In practice, steps 4 and 5 iterate: the
   payload needs a minimum callable ABI, and the host needs a concrete payload
   selection boundary.
7. Node To Rust public release uses the settled payload/provider boundary.

When a later stream discovers a missing assumption, it should feed back into
the earlier stream explicitly instead of patching around it locally.
````

### Unified diff

```diff
No text difference.
```

## claim_40edae24ec6ef0e926209b1930f73f83

Source: `docs/architect/roadmap.md#unheaded-block-6`. Target: `docs/platform/system-architecture/architecture/roadmap.md#unheaded-block-8`.

Mechanical class: Unit-exact. Source digest: `7558f26cced62422c7b5b28d5839cb7e5dcdc06b5d1e3e37fc7f21eff8ba2af8`. Target digest: `7558f26cced62422c7b5b28d5839cb7e5dcdc06b5d1e3e37fc7f21eff8ba2af8`.

Full shown source SHA256: `7558f26cced62422c7b5b28d5839cb7e5dcdc06b5d1e3e37fc7f21eff8ba2af8`. Full shown target SHA256: `7558f26cced62422c7b5b28d5839cb7e5dcdc06b5d1e3e37fc7f21eff8ba2af8`.

### Proposed decision

```json
{
  "claimId": "claim_40edae24ec6ef0e926209b1930f73f83",
  "sourceUnitDigest": "7558f26cced62422c7b5b28d5839cb7e5dcdc06b5d1e3e37fc7f21eff8ba2af8",
  "targetOwner": "docs/platform/system-architecture/architecture/roadmap.md",
  "targetAnchor": "unheaded-block-8",
  "targetUnitDigest": "7558f26cced62422c7b5b28d5839cb7e5dcdc06b5d1e3e37fc7f21eff8ba2af8",
  "targetAncestry": [
    "Architect Roadmap",
    "2. Dependency Shape"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/roadmap.md#unheaded-block-6 (lines 39–39) into docs/platform/system-architecture/architecture/roadmap.md#unheaded-block-8 (lines 62–62), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
The streams are coupled, but they should not move in an arbitrary order.
```

### Full target shown text

```text
The streams are coupled, but they should not move in an arbitrary order.
```

### Unified diff

```diff
No text difference.
```

## claim_3e5ba4bd0970f2ed12fe2a1b9e308a03

Source: `docs/architect/roadmap.md#unheaded-block-7`. Target: `docs/platform/system-architecture/architecture/roadmap.md#unheaded-block-9`.

Mechanical class: Unit-exact. Source digest: `97daf78a173cc2845ea39526301630435ae806a7d67519a6d404b485124cf3a3`. Target digest: `97daf78a173cc2845ea39526301630435ae806a7d67519a6d404b485124cf3a3`.

Full shown source SHA256: `97daf78a173cc2845ea39526301630435ae806a7d67519a6d404b485124cf3a3`. Full shown target SHA256: `97daf78a173cc2845ea39526301630435ae806a7d67519a6d404b485124cf3a3`.

### Proposed decision

```json
{
  "claimId": "claim_3e5ba4bd0970f2ed12fe2a1b9e308a03",
  "sourceUnitDigest": "97daf78a173cc2845ea39526301630435ae806a7d67519a6d404b485124cf3a3",
  "targetOwner": "docs/platform/system-architecture/architecture/roadmap.md",
  "targetAnchor": "unheaded-block-9",
  "targetUnitDigest": "97daf78a173cc2845ea39526301630435ae806a7d67519a6d404b485124cf3a3",
  "targetAncestry": [
    "Architect Roadmap",
    "2. Dependency Shape"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/roadmap.md#unheaded-block-7 (lines 41–50) into docs/platform/system-architecture/architecture/roadmap.md#unheaded-block-9 (lines 64–73), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

````text
```txt
Accepted Agent Coordination + Step 09 contracts
  -> Step 10 Coding Domain read-only adoption
  -> Workspace Topology enforcement lane
  -> Step 10 mutating adoption / runner unification
  -> Component Boundary consolidation
  -> Packaging And Distribution
  <-> Host Invocation / fgOS CLI
  -> Node To Rust public release
```
````

### Full target shown text

````text
```txt
Accepted Agent Coordination + Step 09 contracts
  -> Step 10 Coding Domain read-only adoption
  -> Workspace Topology enforcement lane
  -> Step 10 mutating adoption / runner unification
  -> Component Boundary consolidation
  -> Packaging And Distribution
  <-> Host Invocation / fgOS CLI
  -> Node To Rust public release
```
````

### Unified diff

```diff
No text difference.
```

## claim_5b9718f4d8fde7d44d45c0135762ed66

Source: `docs/architect/roadmap.md#unheaded-block-8`. Target: `docs/platform/system-architecture/architecture/roadmap.md#unheaded-block-10`.

Mechanical class: Unit-exact. Source digest: `fa99c444da87b82b895642407922400432a44453970eaa4cf9058920391c4b4e`. Target digest: `fa99c444da87b82b895642407922400432a44453970eaa4cf9058920391c4b4e`.

Full shown source SHA256: `fa99c444da87b82b895642407922400432a44453970eaa4cf9058920391c4b4e`. Full shown target SHA256: `fa99c444da87b82b895642407922400432a44453970eaa4cf9058920391c4b4e`.

### Proposed decision

```json
{
  "claimId": "claim_5b9718f4d8fde7d44d45c0135762ed66",
  "sourceUnitDigest": "fa99c444da87b82b895642407922400432a44453970eaa4cf9058920391c4b4e",
  "targetOwner": "docs/platform/system-architecture/architecture/roadmap.md",
  "targetAnchor": "unheaded-block-10",
  "targetUnitDigest": "fa99c444da87b82b895642407922400432a44453970eaa4cf9058920391c4b4e",
  "targetAncestry": [
    "Architect Roadmap",
    "2. Dependency Shape"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/roadmap.md#unheaded-block-8 (lines 52–53) into docs/platform/system-architecture/architecture/roadmap.md#unheaded-block-10 (lines 75–76), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
This is not a strict implementation sequence. It is the order in which
architecture assumptions should be stabilized:
```

### Full target shown text

```text
This is not a strict implementation sequence. It is the order in which
architecture assumptions should be stabilized:
```

### Unified diff

```diff
No text difference.
```

## claim_0a3d7ee0f725fb0b9bc603d8edae9725

Source: `docs/architect/roadmap.md#unheaded-block-9`. Target: `docs/platform/system-architecture/architecture/roadmap.md#unheaded-block-11`.

Mechanical class: Unit-exact. Source digest: `4cd42929f2205d5b94edb65c3a9f5ad90a77aff089773a97507ba8b2fd248d54`. Target digest: `4cd42929f2205d5b94edb65c3a9f5ad90a77aff089773a97507ba8b2fd248d54`.

Full shown source SHA256: `4cd42929f2205d5b94edb65c3a9f5ad90a77aff089773a97507ba8b2fd248d54`. Full shown target SHA256: `4cd42929f2205d5b94edb65c3a9f5ad90a77aff089773a97507ba8b2fd248d54`.

### Proposed decision

```json
{
  "claimId": "claim_0a3d7ee0f725fb0b9bc603d8edae9725",
  "sourceUnitDigest": "4cd42929f2205d5b94edb65c3a9f5ad90a77aff089773a97507ba8b2fd248d54",
  "targetOwner": "docs/platform/system-architecture/architecture/roadmap.md",
  "targetAnchor": "unheaded-block-11",
  "targetUnitDigest": "4cd42929f2205d5b94edb65c3a9f5ad90a77aff089773a97507ba8b2fd248d54",
  "targetAncestry": [
    "Architect Roadmap",
    "2. Dependency Shape"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/roadmap.md#unheaded-block-9 (lines 55–67) into docs/platform/system-architecture/architecture/roadmap.md#unheaded-block-11 (lines 78–90), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
1. Agent Coordination defines the reusable coordination/session substrate.
2. Step 09 is now closed for the implemented slice, so Coding Domain can start
   consuming the accepted read-only primitives.
3. Workspace Topology defines root ownership, state classes, and worktree
   mutation invariants before Step 10 opens mutating or fan-out paths.
4. Component Boundary names the components and authority owners.
5. Packaging And Distribution defines how the correct local payload is
   selected, trusted, activated, materialized, and repaired.
6. Host Invocation defines how external surfaces enter semantic operations
   after payload identity is known. In practice, steps 4 and 5 iterate: the
   payload needs a minimum callable ABI, and the host needs a concrete payload
   selection boundary.
7. Node To Rust public release uses the settled payload/provider boundary.
```

### Full target shown text

```text
1. Agent Coordination defines the reusable coordination/session substrate.
2. Step 09 is now closed for the implemented slice, so Coding Domain can start
   consuming the accepted read-only primitives.
3. Workspace Topology defines root ownership, state classes, and worktree
   mutation invariants before Step 10 opens mutating or fan-out paths.
4. Component Boundary names the components and authority owners.
5. Packaging And Distribution defines how the correct local payload is
   selected, trusted, activated, materialized, and repaired.
6. Host Invocation defines how external surfaces enter semantic operations
   after payload identity is known. In practice, steps 4 and 5 iterate: the
   payload needs a minimum callable ABI, and the host needs a concrete payload
   selection boundary.
7. Node To Rust public release uses the settled payload/provider boundary.
```

### Unified diff

```diff
No text difference.
```

## claim_88539b2416c67ed572bf0f06e3d8f8da

Source: `docs/architect/roadmap.md#unheaded-block-10`. Target: `docs/platform/system-architecture/architecture/roadmap.md#unheaded-block-12`.

Mechanical class: Unit-exact. Source digest: `f4130dd5451e9785379525600721ae4782f721a50a3bfc70dfd37dbff38fb2a9`. Target digest: `f4130dd5451e9785379525600721ae4782f721a50a3bfc70dfd37dbff38fb2a9`.

Full shown source SHA256: `f4130dd5451e9785379525600721ae4782f721a50a3bfc70dfd37dbff38fb2a9`. Full shown target SHA256: `f4130dd5451e9785379525600721ae4782f721a50a3bfc70dfd37dbff38fb2a9`.

### Proposed decision

```json
{
  "claimId": "claim_88539b2416c67ed572bf0f06e3d8f8da",
  "sourceUnitDigest": "f4130dd5451e9785379525600721ae4782f721a50a3bfc70dfd37dbff38fb2a9",
  "targetOwner": "docs/platform/system-architecture/architecture/roadmap.md",
  "targetAnchor": "unheaded-block-12",
  "targetUnitDigest": "f4130dd5451e9785379525600721ae4782f721a50a3bfc70dfd37dbff38fb2a9",
  "targetAncestry": [
    "Architect Roadmap",
    "2. Dependency Shape"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/roadmap.md#unheaded-block-10 (lines 69–70) into docs/platform/system-architecture/architecture/roadmap.md#unheaded-block-12 (lines 92–93), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
When a later stream discovers a missing assumption, it should feed back into
the earlier stream explicitly instead of patching around it locally.
```

### Full target shown text

```text
When a later stream discovers a missing assumption, it should feed back into
the earlier stream explicitly instead of patching around it locally.
```

### Unified diff

```diff
No text difference.
```

## claim_ac73c97d4a2319ae048eea00c9a9e609

Source: `docs/architect/roadmap.md#3-immediate-architecture-order`. Target: `docs/platform/system-architecture/architecture/roadmap.md#3-immediate-architecture-order`.

Mechanical class: Weak-exact. Source digest: `f62c0a87fd50d6f2733f35b8cd4b968e212cf2b6d14b39019338a2c84bec1031`. Target digest: `f62c0a87fd50d6f2733f35b8cd4b968e212cf2b6d14b39019338a2c84bec1031`.

Full shown source SHA256: `9b772c2be3aba43c2b6a9513b2c8b8364e7ae508995434d1e8ad6afcd6a48db8`. Full shown target SHA256: `9b772c2be3aba43c2b6a9513b2c8b8364e7ae508995434d1e8ad6afcd6a48db8`.

### Proposed decision

```json
{
  "claimId": "claim_ac73c97d4a2319ae048eea00c9a9e609",
  "sourceUnitDigest": "f62c0a87fd50d6f2733f35b8cd4b968e212cf2b6d14b39019338a2c84bec1031",
  "targetOwner": "docs/platform/system-architecture/architecture/roadmap.md",
  "targetAnchor": "3-immediate-architecture-order",
  "targetUnitDigest": "f62c0a87fd50d6f2733f35b8cd4b968e212cf2b6d14b39019338a2c84bec1031",
  "targetAncestry": [
    "Architect Roadmap"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. Carry the complete heading at docs/architect/roadmap.md#3-immediate-architecture-order (lines 72–72) into docs/platform/system-architecture/architecture/roadmap.md#3-immediate-architecture-order (lines 95–95), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
## 3. Immediate Architecture Order

The practical next order is:

1. Record Step 09 as closed for the implemented slice:
   keep the Execution Core (CollaborationPattern) and Workflow runner contracts as
   canonical; leave deferred group-thinking mechanisms parked.
2. Start Step 10 A0:
   run the node-only Coding Domain boundary/harness facade pass, including
   harnesses that touch Workspace Topology, and resolve raw root/path usage
   behind `TopologyContext` where that slice touches topology behavior.
3. Start Step 10 read-only adoption:
   wire coding's `validate-plan` collaboration through a Work-attached
   CoordinationSession while keeping Work driver, Workflow, lifecycle, and git
   authority outside Agent Coordination.
4. Lock the Workspace Topology contract enough for implementation:
   close durable work-history placement, classify existing config keys, split
   runtime coordination from packaging runtime, and require worker installation
   capsules where local shims are the entry contract.
5. Run topology migration skeletons before mutating Step 10:
   `resolveTopology()` read-only first, then config scope enforcement,
   coordination root split, and hot history relocation/adoption.
6. Continue Step 10 after the read-only proof:
   extract coding evidence interpretation, reconcile session concurrency with
   worker slots, then run the ADR-010 mutating live proof.
7. Stabilize Packaging And Distribution on top of TopologyContext:
   `fgctl`, local `fgos`, runtime identity/activation, payload records,
   init/doctor split, and workspace materialization. Packaging must not decide
   config/event/claim placement.
8. Reflect the new split into Component Boundary:
   separate global bootstrap, shared host surface, project runtime adapter,
   local runtime payload, Work driver, coding repository integration, and state
   authority.
9. Revisit Host Invocation:
   make payload/adapter selection happen before provider routing.
10. Re-evaluate Node To Rust migration:
   update Rust R1 release criteria around artifact identity, compatibility
   payload placement, topology resolution, and install/rollback proof.
11. Only after those are coherent, update generated specs through their owning
    workflow.
```

### Full target shown text

```text
## 3. Immediate Architecture Order

The practical next order is:

1. Record Step 09 as closed for the implemented slice:
   keep the Execution Core (CollaborationPattern) and Workflow runner contracts as
   canonical; leave deferred group-thinking mechanisms parked.
2. Start Step 10 A0:
   run the node-only Coding Domain boundary/harness facade pass, including
   harnesses that touch Workspace Topology, and resolve raw root/path usage
   behind `TopologyContext` where that slice touches topology behavior.
3. Start Step 10 read-only adoption:
   wire coding's `validate-plan` collaboration through a Work-attached
   CoordinationSession while keeping Work driver, Workflow, lifecycle, and git
   authority outside Agent Coordination.
4. Lock the Workspace Topology contract enough for implementation:
   close durable work-history placement, classify existing config keys, split
   runtime coordination from packaging runtime, and require worker installation
   capsules where local shims are the entry contract.
5. Run topology migration skeletons before mutating Step 10:
   `resolveTopology()` read-only first, then config scope enforcement,
   coordination root split, and hot history relocation/adoption.
6. Continue Step 10 after the read-only proof:
   extract coding evidence interpretation, reconcile session concurrency with
   worker slots, then run the ADR-010 mutating live proof.
7. Stabilize Packaging And Distribution on top of TopologyContext:
   `fgctl`, local `fgos`, runtime identity/activation, payload records,
   init/doctor split, and workspace materialization. Packaging must not decide
   config/event/claim placement.
8. Reflect the new split into Component Boundary:
   separate global bootstrap, shared host surface, project runtime adapter,
   local runtime payload, Work driver, coding repository integration, and state
   authority.
9. Revisit Host Invocation:
   make payload/adapter selection happen before provider routing.
10. Re-evaluate Node To Rust migration:
   update Rust R1 release criteria around artifact identity, compatibility
   payload placement, topology resolution, and install/rollback proof.
11. Only after those are coherent, update generated specs through their owning
    workflow.
```

### Unified diff

```diff
No text difference.
```

## claim_cc572123ed1081d875f26b61c676387e

Source: `docs/architect/roadmap.md#unheaded-block-11`. Target: `docs/platform/system-architecture/architecture/roadmap.md#unheaded-block-13`.

Mechanical class: Weak-exact. Source digest: `7da227c3ae94158f96b8534a5b96b0baa0284643a10fca6b96659ffe8445f07b`. Target digest: `7da227c3ae94158f96b8534a5b96b0baa0284643a10fca6b96659ffe8445f07b`.

Full shown source SHA256: `7da227c3ae94158f96b8534a5b96b0baa0284643a10fca6b96659ffe8445f07b`. Full shown target SHA256: `7da227c3ae94158f96b8534a5b96b0baa0284643a10fca6b96659ffe8445f07b`.

### Proposed decision

```json
{
  "claimId": "claim_cc572123ed1081d875f26b61c676387e",
  "sourceUnitDigest": "7da227c3ae94158f96b8534a5b96b0baa0284643a10fca6b96659ffe8445f07b",
  "targetOwner": "docs/platform/system-architecture/architecture/roadmap.md",
  "targetAnchor": "unheaded-block-13",
  "targetUnitDigest": "7da227c3ae94158f96b8534a5b96b0baa0284643a10fca6b96659ffe8445f07b",
  "targetAncestry": [
    "Architect Roadmap",
    "3. Immediate Architecture Order"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. Carry the complete unheaded-block at docs/architect/roadmap.md#unheaded-block-11 (lines 74–74) into docs/platform/system-architecture/architecture/roadmap.md#unheaded-block-13 (lines 97–97), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
The practical next order is:
```

### Full target shown text

```text
The practical next order is:
```

### Unified diff

```diff
No text difference.
```

## claim_3d45038b2ddd69df29d7f95db8bf4e44

Source: `docs/architect/roadmap.md#unheaded-block-12`. Target: `docs/platform/system-architecture/architecture/roadmap.md#unheaded-block-14`.

Mechanical class: Unit-exact. Source digest: `bfc783fc18dc591871513f0c90a4a4e4e57e0a0b14a2bc1bb37ca10a3dcb3f5a`. Target digest: `bfc783fc18dc591871513f0c90a4a4e4e57e0a0b14a2bc1bb37ca10a3dcb3f5a`.

Full shown source SHA256: `bfc783fc18dc591871513f0c90a4a4e4e57e0a0b14a2bc1bb37ca10a3dcb3f5a`. Full shown target SHA256: `bfc783fc18dc591871513f0c90a4a4e4e57e0a0b14a2bc1bb37ca10a3dcb3f5a`.

### Proposed decision

```json
{
  "claimId": "claim_3d45038b2ddd69df29d7f95db8bf4e44",
  "sourceUnitDigest": "bfc783fc18dc591871513f0c90a4a4e4e57e0a0b14a2bc1bb37ca10a3dcb3f5a",
  "targetOwner": "docs/platform/system-architecture/architecture/roadmap.md",
  "targetAnchor": "unheaded-block-14",
  "targetUnitDigest": "bfc783fc18dc591871513f0c90a4a4e4e57e0a0b14a2bc1bb37ca10a3dcb3f5a",
  "targetAncestry": [
    "Architect Roadmap",
    "3. Immediate Architecture Order"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/roadmap.md#unheaded-block-12 (lines 76–111) into docs/platform/system-architecture/architecture/roadmap.md#unheaded-block-14 (lines 99–134), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
1. Record Step 09 as closed for the implemented slice:
   keep the Execution Core (CollaborationPattern) and Workflow runner contracts as
   canonical; leave deferred group-thinking mechanisms parked.
2. Start Step 10 A0:
   run the node-only Coding Domain boundary/harness facade pass, including
   harnesses that touch Workspace Topology, and resolve raw root/path usage
   behind `TopologyContext` where that slice touches topology behavior.
3. Start Step 10 read-only adoption:
   wire coding's `validate-plan` collaboration through a Work-attached
   CoordinationSession while keeping Work driver, Workflow, lifecycle, and git
   authority outside Agent Coordination.
4. Lock the Workspace Topology contract enough for implementation:
   close durable work-history placement, classify existing config keys, split
   runtime coordination from packaging runtime, and require worker installation
   capsules where local shims are the entry contract.
5. Run topology migration skeletons before mutating Step 10:
   `resolveTopology()` read-only first, then config scope enforcement,
   coordination root split, and hot history relocation/adoption.
6. Continue Step 10 after the read-only proof:
   extract coding evidence interpretation, reconcile session concurrency with
   worker slots, then run the ADR-010 mutating live proof.
7. Stabilize Packaging And Distribution on top of TopologyContext:
   `fgctl`, local `fgos`, runtime identity/activation, payload records,
   init/doctor split, and workspace materialization. Packaging must not decide
   config/event/claim placement.
8. Reflect the new split into Component Boundary:
   separate global bootstrap, shared host surface, project runtime adapter,
   local runtime payload, Work driver, coding repository integration, and state
   authority.
9. Revisit Host Invocation:
   make payload/adapter selection happen before provider routing.
10. Re-evaluate Node To Rust migration:
   update Rust R1 release criteria around artifact identity, compatibility
   payload placement, topology resolution, and install/rollback proof.
11. Only after those are coherent, update generated specs through their owning
    workflow.
```

### Full target shown text

```text
1. Record Step 09 as closed for the implemented slice:
   keep the Execution Core (CollaborationPattern) and Workflow runner contracts as
   canonical; leave deferred group-thinking mechanisms parked.
2. Start Step 10 A0:
   run the node-only Coding Domain boundary/harness facade pass, including
   harnesses that touch Workspace Topology, and resolve raw root/path usage
   behind `TopologyContext` where that slice touches topology behavior.
3. Start Step 10 read-only adoption:
   wire coding's `validate-plan` collaboration through a Work-attached
   CoordinationSession while keeping Work driver, Workflow, lifecycle, and git
   authority outside Agent Coordination.
4. Lock the Workspace Topology contract enough for implementation:
   close durable work-history placement, classify existing config keys, split
   runtime coordination from packaging runtime, and require worker installation
   capsules where local shims are the entry contract.
5. Run topology migration skeletons before mutating Step 10:
   `resolveTopology()` read-only first, then config scope enforcement,
   coordination root split, and hot history relocation/adoption.
6. Continue Step 10 after the read-only proof:
   extract coding evidence interpretation, reconcile session concurrency with
   worker slots, then run the ADR-010 mutating live proof.
7. Stabilize Packaging And Distribution on top of TopologyContext:
   `fgctl`, local `fgos`, runtime identity/activation, payload records,
   init/doctor split, and workspace materialization. Packaging must not decide
   config/event/claim placement.
8. Reflect the new split into Component Boundary:
   separate global bootstrap, shared host surface, project runtime adapter,
   local runtime payload, Work driver, coding repository integration, and state
   authority.
9. Revisit Host Invocation:
   make payload/adapter selection happen before provider routing.
10. Re-evaluate Node To Rust migration:
   update Rust R1 release criteria around artifact identity, compatibility
   payload placement, topology resolution, and install/rollback proof.
11. Only after those are coherent, update generated specs through their owning
    workflow.
```

### Unified diff

```diff
No text difference.
```

## claim_3fc93f4bc8d3e1377e238bb3fce4c1ae

Source: `docs/architect/roadmap.md#4-high-level-delivery-plan`. Target: `docs/platform/system-architecture/architecture/roadmap.md#4-high-level-delivery-plan`.

Mechanical class: Weak-exact. Source digest: `98573d405e4683ddc76206491fba6947a94d3c0c56af2072da5186530db688d9`. Target digest: `98573d405e4683ddc76206491fba6947a94d3c0c56af2072da5186530db688d9`.

Full shown source SHA256: `e9c7603f875f6787edb83176bed002e5c67e36a0dbed050bab084261780efc15`. Full shown target SHA256: `e9c7603f875f6787edb83176bed002e5c67e36a0dbed050bab084261780efc15`.

### Proposed decision

```json
{
  "claimId": "claim_3fc93f4bc8d3e1377e238bb3fce4c1ae",
  "sourceUnitDigest": "98573d405e4683ddc76206491fba6947a94d3c0c56af2072da5186530db688d9",
  "targetOwner": "docs/platform/system-architecture/architecture/roadmap.md",
  "targetAnchor": "4-high-level-delivery-plan",
  "targetUnitDigest": "98573d405e4683ddc76206491fba6947a94d3c0c56af2072da5186530db688d9",
  "targetAncestry": [
    "Architect Roadmap"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. Carry the complete heading at docs/architect/roadmap.md#4-high-level-delivery-plan (lines 113–113) into docs/platform/system-architecture/architecture/roadmap.md#4-high-level-delivery-plan (lines 136–136), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
## 4. High-Level Delivery Plan

The delivery plan should keep architecture and implementation close without
letting either one block all progress.

| Phase | Goal | Architecture Output | Delivery Output | Exit Criteria |
|---|---|---|---|---|
| P0: Roadmap control | Keep active streams ordered and prevent cross-area drift. | This roadmap plus links from the architecture index. | None. | Every active stream has a named home, dependency, and next action. |
| P1: Step 10 A0 boundary/facade pass | Separate Coding Domain harness authority before adoption work builds on it. | Node-only Coding Domain boundary/facade plan: harness inventory, owner classification, topology-touching harness list, generic Domain Adapter ports, Coding Domain Adapter facade names, forbidden dependencies, and tests. | Minimal Coding Domain Adapter facades for the harnesses Step 10B will use; topology-touching harnesses either consume `TopologyContext` or record a named blocker. No Rust migration or large physical move. | Later Step 10 slices call stable Coding Domain Adapter facades instead of raw harness files/paths; topology-related harness behavior is not left as hidden cleanup. |
| P2: Step 10 read-only proof | Use the accepted Step 09 substrate for real coding-domain value without opening mutation authority. | Step 10 read-only bridge notes or ADR: Work-attached `validate-plan` sessions, declared Assignment provenance, lifecycle-blind session engine. | `validate-plan` can run through both interactive and headless doors and produce comparable session/evidence records. | Coding consumes CoordinationSession read-only; Workflow and Work lifecycle authority remain outside Agent Coordination. |
| P3: Topology contract lock | Settle the root/capability contract before moving legacy state. | `workspace-topology.md` promoted from draft once durable history placement closes; roadmap/audit remain companions. | No broad behavior migration yet. | A new engineer can answer root/capability choice for each operation without chat history. |
| P4: Topology resolver skeleton | Make topology a runtime input instead of prose. | TopologyContext API shape and adoption notes. | Read-only `resolveTopology()` for Git main, linked worktree, symlink path, fresh clone-like workspace, and non-Git mode. | Existing behavior still works, but callers can stop inferring raw `.fgos` paths. |
| P5: Legacy root migration | Remove the implementation pressure that makes topology and packaging drift. | Work-state / coordination migration notes, checkpoint/import rules, config key scope table. | Config readers use TopologyContext; claims/sessions/leases resolve through `runtimeCoordinationRoot`; hot events move out of tracked workspace with legacy import. | Worker config stays branch-local; shared coordination remains shared by `workStateId`; submit/return/pick do not dirty main with hot history. |
| P6: Step 10 mutating gate | Lift ADR-010 §5 only with the named live proof. | New ADR for mutating Work-attached sessions; evidence adapter boundary; occupancy/concurrency rule. | One executing item uses mutating Assignments in distinct worktrees, refuses overlapping footprint, survives crash/resume, and still merges only through `approve`. | Coding-domain mutation is proven as a CoordinationSession consumer without moving git/merge/status authority into Agent Coordination. |
| P7: Runner unification | Remove duplicate coding execution cores after the mutating proof. | Work Driver contract: one engine, two doors. | `implement-item` becomes a verified Assignment; `spawnWorker` and `fgos-coding-driving` reduce to thin entry paths; fan-out calls the driver rather than spawning raw agents. | Interactive and headless coding paths have equivalent capability and evidence semantics. |
| P8: Workspace/runtime skeleton | Prove the smallest useful distribution model on top of topology. | `runtime-identity-and-activation.md`: release store, workspace activation binding, work-state writer compatibility, manifest, pin, projection scope, and owner/failure rules. | Using existing Node payload if needed: `fgctl` stages an immutable release, verifies identity, prepares one workspace capsule, publishes workspace `activation.json`, and local `fgos` reports workspace + work-state + payload identity. | We can answer where release content lives, where each workspace binding lives, which work-state can be mutated, and how local `fgos` reports identity without dirtying/racing worktrees. |
| P9: Local init/doctor contract | Lock bootstrap vs workspace repair authority. | Same doc or later `fgctl-and-local-fgos-contract.md` only if the command contract grows large. | `fgctl init` invokes local `fgos init`, bootstrap-safe `doctor --fix`, and final read-only `doctor` without changing runtime identity from local `fgos`. | Fresh project init is reproducible; runtime drift is reported; runtime repair/upgrade remains `fgctl` authority. |
| P10: Host invocation alignment | Align Rust CLI/host entry with payload selection. | Host Invocation doc update. | One proof operation such as build/version/doctor routed through selected local payload. | Provider routing cannot start before project payload/adapter identity is known. |
| P11: Rust release gate | Convert Rust migration from code migration to distributable release. | Rust R1 release criteria updated with artifact/package/topology requirements. | Rust host can be installed as public local `fgos` while delegating unmigrated operations to legacy Node payload. | Install/upgrade/rollback evidence exists; Node compatibility payload identity is pinned. |
| P12: Spec consolidation | Move settled architecture back into generated specs. | Spec source changes through owning workflow. | Regenerated `docs/specs/*` and changelog/backlog alignment. | A stranger agent can read specs and see the settled distribution/host boundary without this chat. |

The fastest safe delivery path is P1 → P2 → P3 → P4 → P5 → P6 → P7 for coding
domain adoption and runner unification, then P8 → P11 for local packaging and
Rust `fgos` release. The gateway/project-runtime-adapter lane remains a design
constraint only until distribution and host invocation need a concrete adapter
proof.

Detailed plans must not replace this project-level sequence with local task
detail. When a Step 10 detailed plan changes the A0-G adoption shape, or when
Workspace Topology / Packaging discoveries change the dependency order, update
this roadmap in the same review so the project-level plan stays visible.
```

### Full target shown text

```text
## 4. High-Level Delivery Plan

The delivery plan should keep architecture and implementation close without
letting either one block all progress.

| Phase | Goal | Architecture Output | Delivery Output | Exit Criteria |
|---|---|---|---|---|
| P0: Roadmap control | Keep active streams ordered and prevent cross-area drift. | This roadmap plus links from the architecture index. | None. | Every active stream has a named home, dependency, and next action. |
| P1: Step 10 A0 boundary/facade pass | Separate Coding Domain harness authority before adoption work builds on it. | Node-only Coding Domain boundary/facade plan: harness inventory, owner classification, topology-touching harness list, generic Domain Adapter ports, Coding Domain Adapter facade names, forbidden dependencies, and tests. | Minimal Coding Domain Adapter facades for the harnesses Step 10B will use; topology-touching harnesses either consume `TopologyContext` or record a named blocker. No Rust migration or large physical move. | Later Step 10 slices call stable Coding Domain Adapter facades instead of raw harness files/paths; topology-related harness behavior is not left as hidden cleanup. |
| P2: Step 10 read-only proof | Use the accepted Step 09 substrate for real coding-domain value without opening mutation authority. | Step 10 read-only bridge notes or ADR: Work-attached `validate-plan` sessions, declared Assignment provenance, lifecycle-blind session engine. | `validate-plan` can run through both interactive and headless doors and produce comparable session/evidence records. | Coding consumes CoordinationSession read-only; Workflow and Work lifecycle authority remain outside Agent Coordination. |
| P3: Topology contract lock | Settle the root/capability contract before moving legacy state. | `workspace-topology.md` promoted from draft once durable history placement closes; roadmap/audit remain companions. | No broad behavior migration yet. | A new engineer can answer root/capability choice for each operation without chat history. |
| P4: Topology resolver skeleton | Make topology a runtime input instead of prose. | TopologyContext API shape and adoption notes. | Read-only `resolveTopology()` for Git main, linked worktree, symlink path, fresh clone-like workspace, and non-Git mode. | Existing behavior still works, but callers can stop inferring raw `.fgos` paths. |
| P5: Legacy root migration | Remove the implementation pressure that makes topology and packaging drift. | Work-state / coordination migration notes, checkpoint/import rules, config key scope table. | Config readers use TopologyContext; claims/sessions/leases resolve through `runtimeCoordinationRoot`; hot events move out of tracked workspace with legacy import. | Worker config stays branch-local; shared coordination remains shared by `workStateId`; submit/return/pick do not dirty main with hot history. |
| P6: Step 10 mutating gate | Lift ADR-010 §5 only with the named live proof. | New ADR for mutating Work-attached sessions; evidence adapter boundary; occupancy/concurrency rule. | One executing item uses mutating Assignments in distinct worktrees, refuses overlapping footprint, survives crash/resume, and still merges only through `approve`. | Coding-domain mutation is proven as a CoordinationSession consumer without moving git/merge/status authority into Agent Coordination. |
| P7: Runner unification | Remove duplicate coding execution cores after the mutating proof. | Work Driver contract: one engine, two doors. | `implement-item` becomes a verified Assignment; `spawnWorker` and `fgos-coding-driving` reduce to thin entry paths; fan-out calls the driver rather than spawning raw agents. | Interactive and headless coding paths have equivalent capability and evidence semantics. |
| P8: Workspace/runtime skeleton | Prove the smallest useful distribution model on top of topology. | `runtime-identity-and-activation.md`: release store, workspace activation binding, work-state writer compatibility, manifest, pin, projection scope, and owner/failure rules. | Using existing Node payload if needed: `fgctl` stages an immutable release, verifies identity, prepares one workspace capsule, publishes workspace `activation.json`, and local `fgos` reports workspace + work-state + payload identity. | We can answer where release content lives, where each workspace binding lives, which work-state can be mutated, and how local `fgos` reports identity without dirtying/racing worktrees. |
| P9: Local init/doctor contract | Lock bootstrap vs workspace repair authority. | Same doc or later `fgctl-and-local-fgos-contract.md` only if the command contract grows large. | `fgctl init` invokes local `fgos init`, bootstrap-safe `doctor --fix`, and final read-only `doctor` without changing runtime identity from local `fgos`. | Fresh project init is reproducible; runtime drift is reported; runtime repair/upgrade remains `fgctl` authority. |
| P10: Host invocation alignment | Align Rust CLI/host entry with payload selection. | Host Invocation doc update. | One proof operation such as build/version/doctor routed through selected local payload. | Provider routing cannot start before project payload/adapter identity is known. |
| P11: Rust release gate | Convert Rust migration from code migration to distributable release. | Rust R1 release criteria updated with artifact/package/topology requirements. | Rust host can be installed as public local `fgos` while delegating unmigrated operations to legacy Node payload. | Install/upgrade/rollback evidence exists; Node compatibility payload identity is pinned. |
| P12: Spec consolidation | Move settled architecture back into generated specs. | Spec source changes through owning workflow. | Regenerated `docs/specs/*` and changelog/backlog alignment. | A stranger agent can read specs and see the settled distribution/host boundary without this chat. |

The fastest safe delivery path is P1 → P2 → P3 → P4 → P5 → P6 → P7 for coding
domain adoption and runner unification, then P8 → P11 for local packaging and
Rust `fgos` release. The gateway/project-runtime-adapter lane remains a design
constraint only until distribution and host invocation need a concrete adapter
proof.

Detailed plans must not replace this project-level sequence with local task
detail. When a Step 10 detailed plan changes the A0-G adoption shape, or when
Workspace Topology / Packaging discoveries change the dependency order, update
this roadmap in the same review so the project-level plan stays visible.
```

### Unified diff

```diff
No text difference.
```

## claim_51cebdaf0cd75aa2a5a399db813a3999

Source: `docs/architect/roadmap.md#unheaded-block-13`. Target: `docs/platform/system-architecture/architecture/roadmap.md#unheaded-block-15`.

Mechanical class: Unit-exact. Source digest: `6b0067c00eb1c706f1db622c576ec64b3675388cee4af6473d7852215ac95234`. Target digest: `6b0067c00eb1c706f1db622c576ec64b3675388cee4af6473d7852215ac95234`.

Full shown source SHA256: `6b0067c00eb1c706f1db622c576ec64b3675388cee4af6473d7852215ac95234`. Full shown target SHA256: `6b0067c00eb1c706f1db622c576ec64b3675388cee4af6473d7852215ac95234`.

### Proposed decision

```json
{
  "claimId": "claim_51cebdaf0cd75aa2a5a399db813a3999",
  "sourceUnitDigest": "6b0067c00eb1c706f1db622c576ec64b3675388cee4af6473d7852215ac95234",
  "targetOwner": "docs/platform/system-architecture/architecture/roadmap.md",
  "targetAnchor": "unheaded-block-15",
  "targetUnitDigest": "6b0067c00eb1c706f1db622c576ec64b3675388cee4af6473d7852215ac95234",
  "targetAncestry": [
    "Architect Roadmap",
    "4. High-Level Delivery Plan"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/roadmap.md#unheaded-block-13 (lines 115–116) into docs/platform/system-architecture/architecture/roadmap.md#unheaded-block-15 (lines 138–139), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
The delivery plan should keep architecture and implementation close without
letting either one block all progress.
```

### Full target shown text

```text
The delivery plan should keep architecture and implementation close without
letting either one block all progress.
```

### Unified diff

```diff
No text difference.
```

## claim_af6891bce988e05f7f5867fec6a4129a

Source: `docs/architect/roadmap.md#unheaded-block-14`. Target: `docs/platform/system-architecture/architecture/roadmap.md#unheaded-block-16`.

Mechanical class: Unit-exact. Source digest: `566e12d4aac06acebfc3beb452dfd928cb4cf4c732f5e5f13afeef8bbf273988`. Target digest: `566e12d4aac06acebfc3beb452dfd928cb4cf4c732f5e5f13afeef8bbf273988`.

Full shown source SHA256: `566e12d4aac06acebfc3beb452dfd928cb4cf4c732f5e5f13afeef8bbf273988`. Full shown target SHA256: `566e12d4aac06acebfc3beb452dfd928cb4cf4c732f5e5f13afeef8bbf273988`.

### Proposed decision

```json
{
  "claimId": "claim_af6891bce988e05f7f5867fec6a4129a",
  "sourceUnitDigest": "566e12d4aac06acebfc3beb452dfd928cb4cf4c732f5e5f13afeef8bbf273988",
  "targetOwner": "docs/platform/system-architecture/architecture/roadmap.md",
  "targetAnchor": "unheaded-block-16",
  "targetUnitDigest": "566e12d4aac06acebfc3beb452dfd928cb4cf4c732f5e5f13afeef8bbf273988",
  "targetAncestry": [
    "Architect Roadmap",
    "4. High-Level Delivery Plan"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/roadmap.md#unheaded-block-14 (lines 118–132) into docs/platform/system-architecture/architecture/roadmap.md#unheaded-block-16 (lines 141–155), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
| Phase | Goal | Architecture Output | Delivery Output | Exit Criteria |
|---|---|---|---|---|
| P0: Roadmap control | Keep active streams ordered and prevent cross-area drift. | This roadmap plus links from the architecture index. | None. | Every active stream has a named home, dependency, and next action. |
| P1: Step 10 A0 boundary/facade pass | Separate Coding Domain harness authority before adoption work builds on it. | Node-only Coding Domain boundary/facade plan: harness inventory, owner classification, topology-touching harness list, generic Domain Adapter ports, Coding Domain Adapter facade names, forbidden dependencies, and tests. | Minimal Coding Domain Adapter facades for the harnesses Step 10B will use; topology-touching harnesses either consume `TopologyContext` or record a named blocker. No Rust migration or large physical move. | Later Step 10 slices call stable Coding Domain Adapter facades instead of raw harness files/paths; topology-related harness behavior is not left as hidden cleanup. |
| P2: Step 10 read-only proof | Use the accepted Step 09 substrate for real coding-domain value without opening mutation authority. | Step 10 read-only bridge notes or ADR: Work-attached `validate-plan` sessions, declared Assignment provenance, lifecycle-blind session engine. | `validate-plan` can run through both interactive and headless doors and produce comparable session/evidence records. | Coding consumes CoordinationSession read-only; Workflow and Work lifecycle authority remain outside Agent Coordination. |
| P3: Topology contract lock | Settle the root/capability contract before moving legacy state. | `workspace-topology.md` promoted from draft once durable history placement closes; roadmap/audit remain companions. | No broad behavior migration yet. | A new engineer can answer root/capability choice for each operation without chat history. |
| P4: Topology resolver skeleton | Make topology a runtime input instead of prose. | TopologyContext API shape and adoption notes. | Read-only `resolveTopology()` for Git main, linked worktree, symlink path, fresh clone-like workspace, and non-Git mode. | Existing behavior still works, but callers can stop inferring raw `.fgos` paths. |
| P5: Legacy root migration | Remove the implementation pressure that makes topology and packaging drift. | Work-state / coordination migration notes, checkpoint/import rules, config key scope table. | Config readers use TopologyContext; claims/sessions/leases resolve through `runtimeCoordinationRoot`; hot events move out of tracked workspace with legacy import. | Worker config stays branch-local; shared coordination remains shared by `workStateId`; submit/return/pick do not dirty main with hot history. |
| P6: Step 10 mutating gate | Lift ADR-010 §5 only with the named live proof. | New ADR for mutating Work-attached sessions; evidence adapter boundary; occupancy/concurrency rule. | One executing item uses mutating Assignments in distinct worktrees, refuses overlapping footprint, survives crash/resume, and still merges only through `approve`. | Coding-domain mutation is proven as a CoordinationSession consumer without moving git/merge/status authority into Agent Coordination. |
| P7: Runner unification | Remove duplicate coding execution cores after the mutating proof. | Work Driver contract: one engine, two doors. | `implement-item` becomes a verified Assignment; `spawnWorker` and `fgos-coding-driving` reduce to thin entry paths; fan-out calls the driver rather than spawning raw agents. | Interactive and headless coding paths have equivalent capability and evidence semantics. |
| P8: Workspace/runtime skeleton | Prove the smallest useful distribution model on top of topology. | `runtime-identity-and-activation.md`: release store, workspace activation binding, work-state writer compatibility, manifest, pin, projection scope, and owner/failure rules. | Using existing Node payload if needed: `fgctl` stages an immutable release, verifies identity, prepares one workspace capsule, publishes workspace `activation.json`, and local `fgos` reports workspace + work-state + payload identity. | We can answer where release content lives, where each workspace binding lives, which work-state can be mutated, and how local `fgos` reports identity without dirtying/racing worktrees. |
| P9: Local init/doctor contract | Lock bootstrap vs workspace repair authority. | Same doc or later `fgctl-and-local-fgos-contract.md` only if the command contract grows large. | `fgctl init` invokes local `fgos init`, bootstrap-safe `doctor --fix`, and final read-only `doctor` without changing runtime identity from local `fgos`. | Fresh project init is reproducible; runtime drift is reported; runtime repair/upgrade remains `fgctl` authority. |
| P10: Host invocation alignment | Align Rust CLI/host entry with payload selection. | Host Invocation doc update. | One proof operation such as build/version/doctor routed through selected local payload. | Provider routing cannot start before project payload/adapter identity is known. |
| P11: Rust release gate | Convert Rust migration from code migration to distributable release. | Rust R1 release criteria updated with artifact/package/topology requirements. | Rust host can be installed as public local `fgos` while delegating unmigrated operations to legacy Node payload. | Install/upgrade/rollback evidence exists; Node compatibility payload identity is pinned. |
| P12: Spec consolidation | Move settled architecture back into generated specs. | Spec source changes through owning workflow. | Regenerated `docs/specs/*` and changelog/backlog alignment. | A stranger agent can read specs and see the settled distribution/host boundary without this chat. |
```

### Full target shown text

```text
| Phase | Goal | Architecture Output | Delivery Output | Exit Criteria |
|---|---|---|---|---|
| P0: Roadmap control | Keep active streams ordered and prevent cross-area drift. | This roadmap plus links from the architecture index. | None. | Every active stream has a named home, dependency, and next action. |
| P1: Step 10 A0 boundary/facade pass | Separate Coding Domain harness authority before adoption work builds on it. | Node-only Coding Domain boundary/facade plan: harness inventory, owner classification, topology-touching harness list, generic Domain Adapter ports, Coding Domain Adapter facade names, forbidden dependencies, and tests. | Minimal Coding Domain Adapter facades for the harnesses Step 10B will use; topology-touching harnesses either consume `TopologyContext` or record a named blocker. No Rust migration or large physical move. | Later Step 10 slices call stable Coding Domain Adapter facades instead of raw harness files/paths; topology-related harness behavior is not left as hidden cleanup. |
| P2: Step 10 read-only proof | Use the accepted Step 09 substrate for real coding-domain value without opening mutation authority. | Step 10 read-only bridge notes or ADR: Work-attached `validate-plan` sessions, declared Assignment provenance, lifecycle-blind session engine. | `validate-plan` can run through both interactive and headless doors and produce comparable session/evidence records. | Coding consumes CoordinationSession read-only; Workflow and Work lifecycle authority remain outside Agent Coordination. |
| P3: Topology contract lock | Settle the root/capability contract before moving legacy state. | `workspace-topology.md` promoted from draft once durable history placement closes; roadmap/audit remain companions. | No broad behavior migration yet. | A new engineer can answer root/capability choice for each operation without chat history. |
| P4: Topology resolver skeleton | Make topology a runtime input instead of prose. | TopologyContext API shape and adoption notes. | Read-only `resolveTopology()` for Git main, linked worktree, symlink path, fresh clone-like workspace, and non-Git mode. | Existing behavior still works, but callers can stop inferring raw `.fgos` paths. |
| P5: Legacy root migration | Remove the implementation pressure that makes topology and packaging drift. | Work-state / coordination migration notes, checkpoint/import rules, config key scope table. | Config readers use TopologyContext; claims/sessions/leases resolve through `runtimeCoordinationRoot`; hot events move out of tracked workspace with legacy import. | Worker config stays branch-local; shared coordination remains shared by `workStateId`; submit/return/pick do not dirty main with hot history. |
| P6: Step 10 mutating gate | Lift ADR-010 §5 only with the named live proof. | New ADR for mutating Work-attached sessions; evidence adapter boundary; occupancy/concurrency rule. | One executing item uses mutating Assignments in distinct worktrees, refuses overlapping footprint, survives crash/resume, and still merges only through `approve`. | Coding-domain mutation is proven as a CoordinationSession consumer without moving git/merge/status authority into Agent Coordination. |
| P7: Runner unification | Remove duplicate coding execution cores after the mutating proof. | Work Driver contract: one engine, two doors. | `implement-item` becomes a verified Assignment; `spawnWorker` and `fgos-coding-driving` reduce to thin entry paths; fan-out calls the driver rather than spawning raw agents. | Interactive and headless coding paths have equivalent capability and evidence semantics. |
| P8: Workspace/runtime skeleton | Prove the smallest useful distribution model on top of topology. | `runtime-identity-and-activation.md`: release store, workspace activation binding, work-state writer compatibility, manifest, pin, projection scope, and owner/failure rules. | Using existing Node payload if needed: `fgctl` stages an immutable release, verifies identity, prepares one workspace capsule, publishes workspace `activation.json`, and local `fgos` reports workspace + work-state + payload identity. | We can answer where release content lives, where each workspace binding lives, which work-state can be mutated, and how local `fgos` reports identity without dirtying/racing worktrees. |
| P9: Local init/doctor contract | Lock bootstrap vs workspace repair authority. | Same doc or later `fgctl-and-local-fgos-contract.md` only if the command contract grows large. | `fgctl init` invokes local `fgos init`, bootstrap-safe `doctor --fix`, and final read-only `doctor` without changing runtime identity from local `fgos`. | Fresh project init is reproducible; runtime drift is reported; runtime repair/upgrade remains `fgctl` authority. |
| P10: Host invocation alignment | Align Rust CLI/host entry with payload selection. | Host Invocation doc update. | One proof operation such as build/version/doctor routed through selected local payload. | Provider routing cannot start before project payload/adapter identity is known. |
| P11: Rust release gate | Convert Rust migration from code migration to distributable release. | Rust R1 release criteria updated with artifact/package/topology requirements. | Rust host can be installed as public local `fgos` while delegating unmigrated operations to legacy Node payload. | Install/upgrade/rollback evidence exists; Node compatibility payload identity is pinned. |
| P12: Spec consolidation | Move settled architecture back into generated specs. | Spec source changes through owning workflow. | Regenerated `docs/specs/*` and changelog/backlog alignment. | A stranger agent can read specs and see the settled distribution/host boundary without this chat. |
```

### Unified diff

```diff
No text difference.
```

## claim_e4a841d0dc2eba677d43ff398a709d29

Source: `docs/architect/roadmap.md#unheaded-block-15`. Target: `docs/platform/system-architecture/architecture/roadmap.md#unheaded-block-17`.

Mechanical class: Unit-exact. Source digest: `d9cdd9afbe7f398fe09357623dd37ca0962c30323d8f63e85cb3b65b9e839bf1`. Target digest: `d9cdd9afbe7f398fe09357623dd37ca0962c30323d8f63e85cb3b65b9e839bf1`.

Full shown source SHA256: `d9cdd9afbe7f398fe09357623dd37ca0962c30323d8f63e85cb3b65b9e839bf1`. Full shown target SHA256: `d9cdd9afbe7f398fe09357623dd37ca0962c30323d8f63e85cb3b65b9e839bf1`.

### Proposed decision

```json
{
  "claimId": "claim_e4a841d0dc2eba677d43ff398a709d29",
  "sourceUnitDigest": "d9cdd9afbe7f398fe09357623dd37ca0962c30323d8f63e85cb3b65b9e839bf1",
  "targetOwner": "docs/platform/system-architecture/architecture/roadmap.md",
  "targetAnchor": "unheaded-block-17",
  "targetUnitDigest": "d9cdd9afbe7f398fe09357623dd37ca0962c30323d8f63e85cb3b65b9e839bf1",
  "targetAncestry": [
    "Architect Roadmap",
    "4. High-Level Delivery Plan"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/roadmap.md#unheaded-block-15 (lines 134–138) into docs/platform/system-architecture/architecture/roadmap.md#unheaded-block-17 (lines 157–161), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
The fastest safe delivery path is P1 → P2 → P3 → P4 → P5 → P6 → P7 for coding
domain adoption and runner unification, then P8 → P11 for local packaging and
Rust `fgos` release. The gateway/project-runtime-adapter lane remains a design
constraint only until distribution and host invocation need a concrete adapter
proof.
```

### Full target shown text

```text
The fastest safe delivery path is P1 → P2 → P3 → P4 → P5 → P6 → P7 for coding
domain adoption and runner unification, then P8 → P11 for local packaging and
Rust `fgos` release. The gateway/project-runtime-adapter lane remains a design
constraint only until distribution and host invocation need a concrete adapter
proof.
```

### Unified diff

```diff
No text difference.
```

## claim_091201b70577dcdf974a366e0773d6cc

Source: `docs/architect/roadmap.md#unheaded-block-16`. Target: `docs/platform/system-architecture/architecture/roadmap.md#unheaded-block-18`.

Mechanical class: Unit-exact. Source digest: `8f8560266b68900e1237d301d0dc1d5a896cc18a6b444da469a88889638c5ce3`. Target digest: `8f8560266b68900e1237d301d0dc1d5a896cc18a6b444da469a88889638c5ce3`.

Full shown source SHA256: `8f8560266b68900e1237d301d0dc1d5a896cc18a6b444da469a88889638c5ce3`. Full shown target SHA256: `8f8560266b68900e1237d301d0dc1d5a896cc18a6b444da469a88889638c5ce3`.

### Proposed decision

```json
{
  "claimId": "claim_091201b70577dcdf974a366e0773d6cc",
  "sourceUnitDigest": "8f8560266b68900e1237d301d0dc1d5a896cc18a6b444da469a88889638c5ce3",
  "targetOwner": "docs/platform/system-architecture/architecture/roadmap.md",
  "targetAnchor": "unheaded-block-18",
  "targetUnitDigest": "8f8560266b68900e1237d301d0dc1d5a896cc18a6b444da469a88889638c5ce3",
  "targetAncestry": [
    "Architect Roadmap",
    "4. High-Level Delivery Plan"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/roadmap.md#unheaded-block-16 (lines 140–143) into docs/platform/system-architecture/architecture/roadmap.md#unheaded-block-18 (lines 163–166), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
Detailed plans must not replace this project-level sequence with local task
detail. When a Step 10 detailed plan changes the A0-G adoption shape, or when
Workspace Topology / Packaging discoveries change the dependency order, update
this roadmap in the same review so the project-level plan stays visible.
```

### Full target shown text

```text
Detailed plans must not replace this project-level sequence with local task
detail. When a Step 10 detailed plan changes the A0-G adoption shape, or when
Workspace Topology / Packaging discoveries change the dependency order, update
this roadmap in the same review so the project-level plan stays visible.
```

### Unified diff

```diff
No text difference.
```

## claim_4f3ba6dd4a8c55b28a49d7a519de2b3d

Source: `docs/architect/roadmap.md#5-planning-rules-for-fast-delivery`. Target: `docs/platform/system-architecture/architecture/roadmap.md#5-planning-rules-for-fast-delivery`.

Mechanical class: Weak-exact. Source digest: `7c44910a446a2785492fd97584a7cc6aa3c4c8fc4d078b2ed07773dbf50a584c`. Target digest: `7c44910a446a2785492fd97584a7cc6aa3c4c8fc4d078b2ed07773dbf50a584c`.

Full shown source SHA256: `fd4143bb1f077f22f76fa8a217abe8e9568e3919c9bdaf735948e691720becf6`. Full shown target SHA256: `fd4143bb1f077f22f76fa8a217abe8e9568e3919c9bdaf735948e691720becf6`.

### Proposed decision

```json
{
  "claimId": "claim_4f3ba6dd4a8c55b28a49d7a519de2b3d",
  "sourceUnitDigest": "7c44910a446a2785492fd97584a7cc6aa3c4c8fc4d078b2ed07773dbf50a584c",
  "targetOwner": "docs/platform/system-architecture/architecture/roadmap.md",
  "targetAnchor": "5-planning-rules-for-fast-delivery",
  "targetUnitDigest": "7c44910a446a2785492fd97584a7cc6aa3c4c8fc4d078b2ed07773dbf50a584c",
  "targetAncestry": [
    "Architect Roadmap"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. Carry the complete heading at docs/architect/roadmap.md#5-planning-rules-for-fast-delivery (lines 145–145) into docs/platform/system-architecture/architecture/roadmap.md#5-planning-rules-for-fast-delivery (lines 168–168), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
## 5. Planning Rules For Fast Delivery

1. Do not wait for the full gateway design before proving local payload
   identity, activation, and install/repair. The local payload identity is
   useful immediately for the Rust `fgos` CLI.
2. Do not flip the public Rust `fgos` entry until distribution can prove
   artifact identity, rollback, and legacy compatibility placement.
3. Do not keep `setup` alive as a third user-facing concept. Collapse its old
   responsibilities into `fgctl init`, local `fgos init`, and local
   `fgos doctor --fix`.
4. Do not let shared gateway become the schema compatibility layer for every
   historical project version. Put project-specific translation in the local
   Project Runtime Adapter. This is an architecture constraint, not current
   gateway/web delivery scope.
5. Do not solve self-development by nested repositories. Solve it through
   payload/projection ownership, quarantine, and product-package exclusion.
6. Do not edit generated specs during live architecture churn. Distill under
   `docs/architect/`, then update generated sources once decisions settle.
7. Prefer proof slices that test an authority boundary, not cosmetic command
   wiring.
8. Activation is workspace-scoped: acquire artifact, stage shared release,
   verify manifest, prepare workspace, publish ready workspace binding, then
   allow project-state mutation. Each step needs one owner and one failure
   rule.
```

### Full target shown text

```text
## 5. Planning Rules For Fast Delivery

1. Do not wait for the full gateway design before proving local payload
   identity, activation, and install/repair. The local payload identity is
   useful immediately for the Rust `fgos` CLI.
2. Do not flip the public Rust `fgos` entry until distribution can prove
   artifact identity, rollback, and legacy compatibility placement.
3. Do not keep `setup` alive as a third user-facing concept. Collapse its old
   responsibilities into `fgctl init`, local `fgos init`, and local
   `fgos doctor --fix`.
4. Do not let shared gateway become the schema compatibility layer for every
   historical project version. Put project-specific translation in the local
   Project Runtime Adapter. This is an architecture constraint, not current
   gateway/web delivery scope.
5. Do not solve self-development by nested repositories. Solve it through
   payload/projection ownership, quarantine, and product-package exclusion.
6. Do not edit generated specs during live architecture churn. Distill under
   `docs/architect/`, then update generated sources once decisions settle.
7. Prefer proof slices that test an authority boundary, not cosmetic command
   wiring.
8. Activation is workspace-scoped: acquire artifact, stage shared release,
   verify manifest, prepare workspace, publish ready workspace binding, then
   allow project-state mutation. Each step needs one owner and one failure
   rule.
```

### Unified diff

```diff
No text difference.
```

## claim_8e347b55343e6d863f13a143536bf3a7

Source: `docs/architect/roadmap.md#unheaded-block-17`. Target: `docs/platform/system-architecture/architecture/roadmap.md#unheaded-block-19`.

Mechanical class: Unit-exact. Source digest: `72777a36579653ebf130ca67083e2e114e6d1cc4d454a782bec8dfe8fca679d9`. Target digest: `72777a36579653ebf130ca67083e2e114e6d1cc4d454a782bec8dfe8fca679d9`.

Full shown source SHA256: `72777a36579653ebf130ca67083e2e114e6d1cc4d454a782bec8dfe8fca679d9`. Full shown target SHA256: `72777a36579653ebf130ca67083e2e114e6d1cc4d454a782bec8dfe8fca679d9`.

### Proposed decision

```json
{
  "claimId": "claim_8e347b55343e6d863f13a143536bf3a7",
  "sourceUnitDigest": "72777a36579653ebf130ca67083e2e114e6d1cc4d454a782bec8dfe8fca679d9",
  "targetOwner": "docs/platform/system-architecture/architecture/roadmap.md",
  "targetAnchor": "unheaded-block-19",
  "targetUnitDigest": "72777a36579653ebf130ca67083e2e114e6d1cc4d454a782bec8dfe8fca679d9",
  "targetAncestry": [
    "Architect Roadmap",
    "5. Planning Rules For Fast Delivery"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/roadmap.md#unheaded-block-17 (lines 147–168) into docs/platform/system-architecture/architecture/roadmap.md#unheaded-block-19 (lines 170–191), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
1. Do not wait for the full gateway design before proving local payload
   identity, activation, and install/repair. The local payload identity is
   useful immediately for the Rust `fgos` CLI.
2. Do not flip the public Rust `fgos` entry until distribution can prove
   artifact identity, rollback, and legacy compatibility placement.
3. Do not keep `setup` alive as a third user-facing concept. Collapse its old
   responsibilities into `fgctl init`, local `fgos init`, and local
   `fgos doctor --fix`.
4. Do not let shared gateway become the schema compatibility layer for every
   historical project version. Put project-specific translation in the local
   Project Runtime Adapter. This is an architecture constraint, not current
   gateway/web delivery scope.
5. Do not solve self-development by nested repositories. Solve it through
   payload/projection ownership, quarantine, and product-package exclusion.
6. Do not edit generated specs during live architecture churn. Distill under
   `docs/architect/`, then update generated sources once decisions settle.
7. Prefer proof slices that test an authority boundary, not cosmetic command
   wiring.
8. Activation is workspace-scoped: acquire artifact, stage shared release,
   verify manifest, prepare workspace, publish ready workspace binding, then
   allow project-state mutation. Each step needs one owner and one failure
   rule.
```

### Full target shown text

```text
1. Do not wait for the full gateway design before proving local payload
   identity, activation, and install/repair. The local payload identity is
   useful immediately for the Rust `fgos` CLI.
2. Do not flip the public Rust `fgos` entry until distribution can prove
   artifact identity, rollback, and legacy compatibility placement.
3. Do not keep `setup` alive as a third user-facing concept. Collapse its old
   responsibilities into `fgctl init`, local `fgos init`, and local
   `fgos doctor --fix`.
4. Do not let shared gateway become the schema compatibility layer for every
   historical project version. Put project-specific translation in the local
   Project Runtime Adapter. This is an architecture constraint, not current
   gateway/web delivery scope.
5. Do not solve self-development by nested repositories. Solve it through
   payload/projection ownership, quarantine, and product-package exclusion.
6. Do not edit generated specs during live architecture churn. Distill under
   `docs/architect/`, then update generated sources once decisions settle.
7. Prefer proof slices that test an authority boundary, not cosmetic command
   wiring.
8. Activation is workspace-scoped: acquire artifact, stage shared release,
   verify manifest, prepare workspace, publish ready workspace binding, then
   allow project-state mutation. Each step needs one owner and one failure
   rule.
```

### Unified diff

```diff
No text difference.
```

## claim_a2c8ae1e05ff55cd12f45bf510adb0f0

Source: `docs/architect/roadmap.md#6-parallel-work-lanes`. Target: `docs/platform/system-architecture/architecture/roadmap.md#6-parallel-work-lanes`.

Mechanical class: Weak-exact. Source digest: `34b0f2b4efc09830589d6b52b1bb3d28c7c0a49828423bc2c75a43ccdd99cd25`. Target digest: `34b0f2b4efc09830589d6b52b1bb3d28c7c0a49828423bc2c75a43ccdd99cd25`.

Full shown source SHA256: `160e96f263299b867d9abab3f6b22e4c00c1bcac1c172f46c9e8c068450c2ab9`. Full shown target SHA256: `160e96f263299b867d9abab3f6b22e4c00c1bcac1c172f46c9e8c068450c2ab9`.

### Proposed decision

```json
{
  "claimId": "claim_a2c8ae1e05ff55cd12f45bf510adb0f0",
  "sourceUnitDigest": "34b0f2b4efc09830589d6b52b1bb3d28c7c0a49828423bc2c75a43ccdd99cd25",
  "targetOwner": "docs/platform/system-architecture/architecture/roadmap.md",
  "targetAnchor": "6-parallel-work-lanes",
  "targetUnitDigest": "34b0f2b4efc09830589d6b52b1bb3d28c7c0a49828423bc2c75a43ccdd99cd25",
  "targetAncestry": [
    "Architect Roadmap"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. Carry the complete heading at docs/architect/roadmap.md#6-parallel-work-lanes (lines 170–170) into docs/platform/system-architecture/architecture/roadmap.md#6-parallel-work-lanes (lines 193–193), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
## 6. Parallel Work Lanes

To ship faster, these lanes can proceed in parallel as long as their handoff
contracts are respected.

| Lane | Can Proceed Now | Must Wait For |
|---|---|---|
| Agent Coordination refinement | Yes, but only for explicitly deferred Step 09 mechanisms or bug fixes inside accepted contracts. | Anything that changes Work mutation, git authority, or runtime identity must wait for Step 10/topology decisions. |
| Step 10 A0 boundary/facade pass | Yes, first. Include coding harnesses that touch Workspace Topology and resolve them behind Coding Domain Adapter facades plus `TopologyContext` when touched. | Rust migration and broad physical moves wait for facade proof. |
| Step 10 read-only coding adoption | Yes after the minimum facade needed by `validate-plan` exists. | Mutating assignments, fan-out, and footprint claims wait for topology resolver + coordination root/occupancy rules. |
| Workspace Topology contract | Yes, highest priority beside Step 10 read-only. Close durable history placement and promote the contract. | Nothing except confirming legacy/adoption wording against current work-state reality. |
| Topology resolver implementation | Yes after contract lock, and can run while Step 10 read-only proceeds. | Migration of event/claim/config call sites should wait for the resolver API shape. |
| Legacy root migration | Partly. Inventory and tests can start now. | Actual hot-history/coordination moves wait for resolver skeleton and legacy import rules. |
| Coding Domain extraction | Yes at authority/classification level. Keep coding-specific repo/worktree/merge policy out of foundation. | Physical moves wait for Step 10 evidence adapter/driver contracts and topology root migration. |
| Component Boundary cleanup | Yes at advisory/index level. | Physical repo moves should wait until Step 10 and topology prove the ownership boundaries. |
| Packaging Distribution | Yes for docs already depending on topology. | Implementation waits for topology P2/P3 and the legacy root migration decisions it consumes. |
| Host Invocation design | Yes for provider routing internals and Rust CLI shape. | Public entry semantics wait for runtime identity/activation contract and topology-aware local shim behavior. |
| Rust migration implementation | Yes behind current entrypoints. | Public release flip waits for distribution gates plus topology-aware install/doctor proof. |
```

### Full target shown text

```text
## 6. Parallel Work Lanes

To ship faster, these lanes can proceed in parallel as long as their handoff
contracts are respected.

| Lane | Can Proceed Now | Must Wait For |
|---|---|---|
| Agent Coordination refinement | Yes, but only for explicitly deferred Step 09 mechanisms or bug fixes inside accepted contracts. | Anything that changes Work mutation, git authority, or runtime identity must wait for Step 10/topology decisions. |
| Step 10 A0 boundary/facade pass | Yes, first. Include coding harnesses that touch Workspace Topology and resolve them behind Coding Domain Adapter facades plus `TopologyContext` when touched. | Rust migration and broad physical moves wait for facade proof. |
| Step 10 read-only coding adoption | Yes after the minimum facade needed by `validate-plan` exists. | Mutating assignments, fan-out, and footprint claims wait for topology resolver + coordination root/occupancy rules. |
| Workspace Topology contract | Yes, highest priority beside Step 10 read-only. Close durable history placement and promote the contract. | Nothing except confirming legacy/adoption wording against current work-state reality. |
| Topology resolver implementation | Yes after contract lock, and can run while Step 10 read-only proceeds. | Migration of event/claim/config call sites should wait for the resolver API shape. |
| Legacy root migration | Partly. Inventory and tests can start now. | Actual hot-history/coordination moves wait for resolver skeleton and legacy import rules. |
| Coding Domain extraction | Yes at authority/classification level. Keep coding-specific repo/worktree/merge policy out of foundation. | Physical moves wait for Step 10 evidence adapter/driver contracts and topology root migration. |
| Component Boundary cleanup | Yes at advisory/index level. | Physical repo moves should wait until Step 10 and topology prove the ownership boundaries. |
| Packaging Distribution | Yes for docs already depending on topology. | Implementation waits for topology P2/P3 and the legacy root migration decisions it consumes. |
| Host Invocation design | Yes for provider routing internals and Rust CLI shape. | Public entry semantics wait for runtime identity/activation contract and topology-aware local shim behavior. |
| Rust migration implementation | Yes behind current entrypoints. | Public release flip waits for distribution gates plus topology-aware install/doctor proof. |
```

### Unified diff

```diff
No text difference.
```

## claim_8fcad0e9c173f20d24fb08517ef8be28

Source: `docs/architect/roadmap.md#unheaded-block-18`. Target: `docs/platform/system-architecture/architecture/roadmap.md#unheaded-block-20`.

Mechanical class: Unit-exact. Source digest: `469d265f7499652ddd6f7c3b449b59c20dd51b9ba8a622232e759f04c1432752`. Target digest: `469d265f7499652ddd6f7c3b449b59c20dd51b9ba8a622232e759f04c1432752`.

Full shown source SHA256: `469d265f7499652ddd6f7c3b449b59c20dd51b9ba8a622232e759f04c1432752`. Full shown target SHA256: `469d265f7499652ddd6f7c3b449b59c20dd51b9ba8a622232e759f04c1432752`.

### Proposed decision

```json
{
  "claimId": "claim_8fcad0e9c173f20d24fb08517ef8be28",
  "sourceUnitDigest": "469d265f7499652ddd6f7c3b449b59c20dd51b9ba8a622232e759f04c1432752",
  "targetOwner": "docs/platform/system-architecture/architecture/roadmap.md",
  "targetAnchor": "unheaded-block-20",
  "targetUnitDigest": "469d265f7499652ddd6f7c3b449b59c20dd51b9ba8a622232e759f04c1432752",
  "targetAncestry": [
    "Architect Roadmap",
    "6. Parallel Work Lanes"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/roadmap.md#unheaded-block-18 (lines 172–173) into docs/platform/system-architecture/architecture/roadmap.md#unheaded-block-20 (lines 195–196), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
To ship faster, these lanes can proceed in parallel as long as their handoff
contracts are respected.
```

### Full target shown text

```text
To ship faster, these lanes can proceed in parallel as long as their handoff
contracts are respected.
```

### Unified diff

```diff
No text difference.
```

## claim_105d9ce8a71a304dce1c6919c8cc4c34

Source: `docs/architect/roadmap.md#unheaded-block-19`. Target: `docs/platform/system-architecture/architecture/roadmap.md#unheaded-block-21`.

Mechanical class: Unit-exact. Source digest: `deb65a68c4c03a670d327f9ed3cbe34b489ad51938cbac50dafe5eef3ad7cfa9`. Target digest: `deb65a68c4c03a670d327f9ed3cbe34b489ad51938cbac50dafe5eef3ad7cfa9`.

Full shown source SHA256: `deb65a68c4c03a670d327f9ed3cbe34b489ad51938cbac50dafe5eef3ad7cfa9`. Full shown target SHA256: `deb65a68c4c03a670d327f9ed3cbe34b489ad51938cbac50dafe5eef3ad7cfa9`.

### Proposed decision

```json
{
  "claimId": "claim_105d9ce8a71a304dce1c6919c8cc4c34",
  "sourceUnitDigest": "deb65a68c4c03a670d327f9ed3cbe34b489ad51938cbac50dafe5eef3ad7cfa9",
  "targetOwner": "docs/platform/system-architecture/architecture/roadmap.md",
  "targetAnchor": "unheaded-block-21",
  "targetUnitDigest": "deb65a68c4c03a670d327f9ed3cbe34b489ad51938cbac50dafe5eef3ad7cfa9",
  "targetAncestry": [
    "Architect Roadmap",
    "6. Parallel Work Lanes"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/roadmap.md#unheaded-block-19 (lines 175–187) into docs/platform/system-architecture/architecture/roadmap.md#unheaded-block-21 (lines 198–210), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
| Lane | Can Proceed Now | Must Wait For |
|---|---|---|
| Agent Coordination refinement | Yes, but only for explicitly deferred Step 09 mechanisms or bug fixes inside accepted contracts. | Anything that changes Work mutation, git authority, or runtime identity must wait for Step 10/topology decisions. |
| Step 10 A0 boundary/facade pass | Yes, first. Include coding harnesses that touch Workspace Topology and resolve them behind Coding Domain Adapter facades plus `TopologyContext` when touched. | Rust migration and broad physical moves wait for facade proof. |
| Step 10 read-only coding adoption | Yes after the minimum facade needed by `validate-plan` exists. | Mutating assignments, fan-out, and footprint claims wait for topology resolver + coordination root/occupancy rules. |
| Workspace Topology contract | Yes, highest priority beside Step 10 read-only. Close durable history placement and promote the contract. | Nothing except confirming legacy/adoption wording against current work-state reality. |
| Topology resolver implementation | Yes after contract lock, and can run while Step 10 read-only proceeds. | Migration of event/claim/config call sites should wait for the resolver API shape. |
| Legacy root migration | Partly. Inventory and tests can start now. | Actual hot-history/coordination moves wait for resolver skeleton and legacy import rules. |
| Coding Domain extraction | Yes at authority/classification level. Keep coding-specific repo/worktree/merge policy out of foundation. | Physical moves wait for Step 10 evidence adapter/driver contracts and topology root migration. |
| Component Boundary cleanup | Yes at advisory/index level. | Physical repo moves should wait until Step 10 and topology prove the ownership boundaries. |
| Packaging Distribution | Yes for docs already depending on topology. | Implementation waits for topology P2/P3 and the legacy root migration decisions it consumes. |
| Host Invocation design | Yes for provider routing internals and Rust CLI shape. | Public entry semantics wait for runtime identity/activation contract and topology-aware local shim behavior. |
| Rust migration implementation | Yes behind current entrypoints. | Public release flip waits for distribution gates plus topology-aware install/doctor proof. |
```

### Full target shown text

```text
| Lane | Can Proceed Now | Must Wait For |
|---|---|---|
| Agent Coordination refinement | Yes, but only for explicitly deferred Step 09 mechanisms or bug fixes inside accepted contracts. | Anything that changes Work mutation, git authority, or runtime identity must wait for Step 10/topology decisions. |
| Step 10 A0 boundary/facade pass | Yes, first. Include coding harnesses that touch Workspace Topology and resolve them behind Coding Domain Adapter facades plus `TopologyContext` when touched. | Rust migration and broad physical moves wait for facade proof. |
| Step 10 read-only coding adoption | Yes after the minimum facade needed by `validate-plan` exists. | Mutating assignments, fan-out, and footprint claims wait for topology resolver + coordination root/occupancy rules. |
| Workspace Topology contract | Yes, highest priority beside Step 10 read-only. Close durable history placement and promote the contract. | Nothing except confirming legacy/adoption wording against current work-state reality. |
| Topology resolver implementation | Yes after contract lock, and can run while Step 10 read-only proceeds. | Migration of event/claim/config call sites should wait for the resolver API shape. |
| Legacy root migration | Partly. Inventory and tests can start now. | Actual hot-history/coordination moves wait for resolver skeleton and legacy import rules. |
| Coding Domain extraction | Yes at authority/classification level. Keep coding-specific repo/worktree/merge policy out of foundation. | Physical moves wait for Step 10 evidence adapter/driver contracts and topology root migration. |
| Component Boundary cleanup | Yes at advisory/index level. | Physical repo moves should wait until Step 10 and topology prove the ownership boundaries. |
| Packaging Distribution | Yes for docs already depending on topology. | Implementation waits for topology P2/P3 and the legacy root migration decisions it consumes. |
| Host Invocation design | Yes for provider routing internals and Rust CLI shape. | Public entry semantics wait for runtime identity/activation contract and topology-aware local shim behavior. |
| Rust migration implementation | Yes behind current entrypoints. | Public release flip waits for distribution gates plus topology-aware install/doctor proof. |
```

### Unified diff

```diff
No text difference.
```

## claim_415205ea7d0a7ea12d3f8388d3958825

Source: `docs/architect/roadmap.md#7-do-not-collapse-these-boundaries`. Target: `docs/platform/system-architecture/architecture/roadmap.md#7-do-not-collapse-these-boundaries`.

Mechanical class: Weak-exact. Source digest: `9321484a06622ba9230e25043852aef96091dbca37b7ff1467eb1fd2ca5c369a`. Target digest: `9321484a06622ba9230e25043852aef96091dbca37b7ff1467eb1fd2ca5c369a`.

Full shown source SHA256: `544983e0ca11484f639bbb212400151deef8b454db77d365f82d985560045a95`. Full shown target SHA256: `544983e0ca11484f639bbb212400151deef8b454db77d365f82d985560045a95`.

### Proposed decision

```json
{
  "claimId": "claim_415205ea7d0a7ea12d3f8388d3958825",
  "sourceUnitDigest": "9321484a06622ba9230e25043852aef96091dbca37b7ff1467eb1fd2ca5c369a",
  "targetOwner": "docs/platform/system-architecture/architecture/roadmap.md",
  "targetAnchor": "7-do-not-collapse-these-boundaries",
  "targetUnitDigest": "9321484a06622ba9230e25043852aef96091dbca37b7ff1467eb1fd2ca5c369a",
  "targetAncestry": [
    "Architect Roadmap"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. Carry the complete heading at docs/architect/roadmap.md#7-do-not-collapse-these-boundaries (lines 189–189) into docs/platform/system-architecture/architecture/roadmap.md#7-do-not-collapse-these-boundaries (lines 212–212), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
## 7. Do Not Collapse These Boundaries

These distinctions must stay visible while the roadmap moves:

| Boundary | Why It Matters |
|---|---|
| `fgctl` vs local `fgos` | Machine bootstrap/service control is not project workflow authority. |
| Work Core vs Work Driver Core vs Domain | Work Core owns Work truth and legal transitions; Work Driver Core is reusable platform core that interprets domain-owned workflow declarations; Coding Domain owns coding declarations/adapters, not a separate driver. |
| Shared web vs shared gateway vs project runtime | One dashboard can serve many projects later, but current delivery only needs the architecture boundary: project semantics must come from the selected local payload. |
| Gateway contract vs Project Runtime Adapter | Gateway owns a stable UI/chat contract later; the local adapter owns version-specific semantic translation and must be shaped so future gateway does not become semantic authority. |
| Installer repair vs local doctor fix | `fgctl repair/upgrade` may change runtime identity; local `fgos doctor --fix` repairs under the installed identity. |
| Canonical workshop material vs host-visible projections | Skills/agents/prose live in the immutable release payload/workshop area and are projected into `.agents/`, `.claude/`, or instruction files through the workspace projection ledger. |
| Runtime payload vs product package surface | fgOS workshop files must not dirty the clean product package, especially during fgOS self-development. |
| Distribution selection vs provider routing | Distribution selects the trusted project payload; Host Invocation routes operations inside that selected payload. |
| Global daemon/MCP substrate vs project verbs | Global services may accelerate registry/store/event/mailbox/process supervision, but must not own all project semantics. |
```

### Full target shown text

```text
## 7. Do Not Collapse These Boundaries

These distinctions must stay visible while the roadmap moves:

| Boundary | Why It Matters |
|---|---|
| `fgctl` vs local `fgos` | Machine bootstrap/service control is not project workflow authority. |
| Work Core vs Work Driver Core vs Domain | Work Core owns Work truth and legal transitions; Work Driver Core is reusable platform core that interprets domain-owned workflow declarations; Coding Domain owns coding declarations/adapters, not a separate driver. |
| Shared web vs shared gateway vs project runtime | One dashboard can serve many projects later, but current delivery only needs the architecture boundary: project semantics must come from the selected local payload. |
| Gateway contract vs Project Runtime Adapter | Gateway owns a stable UI/chat contract later; the local adapter owns version-specific semantic translation and must be shaped so future gateway does not become semantic authority. |
| Installer repair vs local doctor fix | `fgctl repair/upgrade` may change runtime identity; local `fgos doctor --fix` repairs under the installed identity. |
| Canonical workshop material vs host-visible projections | Skills/agents/prose live in the immutable release payload/workshop area and are projected into `.agents/`, `.claude/`, or instruction files through the workspace projection ledger. |
| Runtime payload vs product package surface | fgOS workshop files must not dirty the clean product package, especially during fgOS self-development. |
| Distribution selection vs provider routing | Distribution selects the trusted project payload; Host Invocation routes operations inside that selected payload. |
| Global daemon/MCP substrate vs project verbs | Global services may accelerate registry/store/event/mailbox/process supervision, but must not own all project semantics. |
```

### Unified diff

```diff
No text difference.
```

## claim_53d0c6c318eaaca97e659055b6c120fa

Source: `docs/architect/roadmap.md#unheaded-block-20`. Target: `docs/platform/system-architecture/architecture/roadmap.md#unheaded-block-22`.

Mechanical class: Unit-exact. Source digest: `6afc9fffd3243d9d894c856c072376063f8285bbd81666fd63ad9fdf56d72ce1`. Target digest: `6afc9fffd3243d9d894c856c072376063f8285bbd81666fd63ad9fdf56d72ce1`.

Full shown source SHA256: `6afc9fffd3243d9d894c856c072376063f8285bbd81666fd63ad9fdf56d72ce1`. Full shown target SHA256: `6afc9fffd3243d9d894c856c072376063f8285bbd81666fd63ad9fdf56d72ce1`.

### Proposed decision

```json
{
  "claimId": "claim_53d0c6c318eaaca97e659055b6c120fa",
  "sourceUnitDigest": "6afc9fffd3243d9d894c856c072376063f8285bbd81666fd63ad9fdf56d72ce1",
  "targetOwner": "docs/platform/system-architecture/architecture/roadmap.md",
  "targetAnchor": "unheaded-block-22",
  "targetUnitDigest": "6afc9fffd3243d9d894c856c072376063f8285bbd81666fd63ad9fdf56d72ce1",
  "targetAncestry": [
    "Architect Roadmap",
    "7. Do Not Collapse These Boundaries"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/roadmap.md#unheaded-block-20 (lines 191–191) into docs/platform/system-architecture/architecture/roadmap.md#unheaded-block-22 (lines 214–214), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
These distinctions must stay visible while the roadmap moves:
```

### Full target shown text

```text
These distinctions must stay visible while the roadmap moves:
```

### Unified diff

```diff
No text difference.
```

## claim_3704550ca5298f89dba23e546f456e37

Source: `docs/architect/roadmap.md#unheaded-block-21`. Target: `docs/platform/system-architecture/architecture/roadmap.md#unheaded-block-23`.

Mechanical class: Unit-exact. Source digest: `47cdf022c9528c502230b67934a1b2ae6a1c987f0926d45a65ffe1b0d51f5232`. Target digest: `47cdf022c9528c502230b67934a1b2ae6a1c987f0926d45a65ffe1b0d51f5232`.

Full shown source SHA256: `47cdf022c9528c502230b67934a1b2ae6a1c987f0926d45a65ffe1b0d51f5232`. Full shown target SHA256: `47cdf022c9528c502230b67934a1b2ae6a1c987f0926d45a65ffe1b0d51f5232`.

### Proposed decision

```json
{
  "claimId": "claim_3704550ca5298f89dba23e546f456e37",
  "sourceUnitDigest": "47cdf022c9528c502230b67934a1b2ae6a1c987f0926d45a65ffe1b0d51f5232",
  "targetOwner": "docs/platform/system-architecture/architecture/roadmap.md",
  "targetAnchor": "unheaded-block-23",
  "targetUnitDigest": "47cdf022c9528c502230b67934a1b2ae6a1c987f0926d45a65ffe1b0d51f5232",
  "targetAncestry": [
    "Architect Roadmap",
    "7. Do Not Collapse These Boundaries"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/roadmap.md#unheaded-block-21 (lines 193–203) into docs/platform/system-architecture/architecture/roadmap.md#unheaded-block-23 (lines 216–226), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
| Boundary | Why It Matters |
|---|---|
| `fgctl` vs local `fgos` | Machine bootstrap/service control is not project workflow authority. |
| Work Core vs Work Driver Core vs Domain | Work Core owns Work truth and legal transitions; Work Driver Core is reusable platform core that interprets domain-owned workflow declarations; Coding Domain owns coding declarations/adapters, not a separate driver. |
| Shared web vs shared gateway vs project runtime | One dashboard can serve many projects later, but current delivery only needs the architecture boundary: project semantics must come from the selected local payload. |
| Gateway contract vs Project Runtime Adapter | Gateway owns a stable UI/chat contract later; the local adapter owns version-specific semantic translation and must be shaped so future gateway does not become semantic authority. |
| Installer repair vs local doctor fix | `fgctl repair/upgrade` may change runtime identity; local `fgos doctor --fix` repairs under the installed identity. |
| Canonical workshop material vs host-visible projections | Skills/agents/prose live in the immutable release payload/workshop area and are projected into `.agents/`, `.claude/`, or instruction files through the workspace projection ledger. |
| Runtime payload vs product package surface | fgOS workshop files must not dirty the clean product package, especially during fgOS self-development. |
| Distribution selection vs provider routing | Distribution selects the trusted project payload; Host Invocation routes operations inside that selected payload. |
| Global daemon/MCP substrate vs project verbs | Global services may accelerate registry/store/event/mailbox/process supervision, but must not own all project semantics. |
```

### Full target shown text

```text
| Boundary | Why It Matters |
|---|---|
| `fgctl` vs local `fgos` | Machine bootstrap/service control is not project workflow authority. |
| Work Core vs Work Driver Core vs Domain | Work Core owns Work truth and legal transitions; Work Driver Core is reusable platform core that interprets domain-owned workflow declarations; Coding Domain owns coding declarations/adapters, not a separate driver. |
| Shared web vs shared gateway vs project runtime | One dashboard can serve many projects later, but current delivery only needs the architecture boundary: project semantics must come from the selected local payload. |
| Gateway contract vs Project Runtime Adapter | Gateway owns a stable UI/chat contract later; the local adapter owns version-specific semantic translation and must be shaped so future gateway does not become semantic authority. |
| Installer repair vs local doctor fix | `fgctl repair/upgrade` may change runtime identity; local `fgos doctor --fix` repairs under the installed identity. |
| Canonical workshop material vs host-visible projections | Skills/agents/prose live in the immutable release payload/workshop area and are projected into `.agents/`, `.claude/`, or instruction files through the workspace projection ledger. |
| Runtime payload vs product package surface | fgOS workshop files must not dirty the clean product package, especially during fgOS self-development. |
| Distribution selection vs provider routing | Distribution selects the trusted project payload; Host Invocation routes operations inside that selected payload. |
| Global daemon/MCP substrate vs project verbs | Global services may accelerate registry/store/event/mailbox/process supervision, but must not own all project semantics. |
```

### Unified diff

```diff
No text difference.
```

## claim_710cfe3b3f349d0eb85cd9f85980b25d

Source: `docs/architect/roadmap.md#8-packaging-and-distribution-sub-roadmap`. Target: `docs/platform/system-architecture/architecture/roadmap.md#8-packaging-and-distribution-sub-roadmap`.

Mechanical class: Unit-exact. Source digest: `24393ad467308fdcbb24b2db72b26dc8034f2070a306cc9ce1d3872e8427b03d`. Target digest: `24393ad467308fdcbb24b2db72b26dc8034f2070a306cc9ce1d3872e8427b03d`.

Full shown source SHA256: `42841b7bed7011262119a45ff4bcccbfdb1ce599b8240dbfd6cc110dadcd6f4b`. Full shown target SHA256: `42841b7bed7011262119a45ff4bcccbfdb1ce599b8240dbfd6cc110dadcd6f4b`.

### Proposed decision

```json
{
  "claimId": "claim_710cfe3b3f349d0eb85cd9f85980b25d",
  "sourceUnitDigest": "24393ad467308fdcbb24b2db72b26dc8034f2070a306cc9ce1d3872e8427b03d",
  "targetOwner": "docs/platform/system-architecture/architecture/roadmap.md",
  "targetAnchor": "8-packaging-and-distribution-sub-roadmap",
  "targetUnitDigest": "24393ad467308fdcbb24b2db72b26dc8034f2070a306cc9ce1d3872e8427b03d",
  "targetAncestry": [
    "Architect Roadmap"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete heading at docs/architect/roadmap.md#8-packaging-and-distribution-sub-roadmap (lines 205–205) into docs/platform/system-architecture/architecture/roadmap.md#8-packaging-and-distribution-sub-roadmap (lines 228–228), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
## 8. Packaging And Distribution Sub-Roadmap

Packaging And Distribution remains a high-pressure architecture stream because
it gates Rust release, shared web/gateway shape, and clean local project
operation. Its implementation order now runs behind Workspace Topology's typed
roots instead of owning placement itself.

Recommended split:

1. `runtime-identity-and-activation.md`
   - immutable release manifest;
   - workspace activation binding;
   - pin;
   - projection ledger outline;
   - migration journal outline;
   - invocation lease;
   - downgrade/refusal and state-schema compatibility;
   - drift report;
   - rollback/quarantine;
   - runtime identity reported by local `fgos`.
2. `fgctl-and-local-fgos-contract.md`, only if command responsibilities grow
   too large for the runtime identity document
   - `fgctl init/repair/upgrade/gateway`;
   - local `fgos init`;
   - local `fgos doctor` and `fgos doctor --fix`;
   - deprecated legacy setup compatibility and eventual setup retirement;
   - failure semantics.
3. `project-runtime-adapter-protocol.md`
   - future shared web/gateway constraint;
   - stable UI command context;
   - project-local adapter;
   - capability discovery;
   - event/progress/error transform;
   - out-of-process v1;
   - idempotency and payload attestation.
4. `workshop-materialization.md`, after host path/projection policy becomes a
   blocker
   - skills;
   - agents;
   - prose;
   - AGENTS.md;
   - `.agents/skills`;
   - `.claude/skills`;
   - self-development cleanliness.
```

### Full target shown text

```text
## 8. Packaging And Distribution Sub-Roadmap

Packaging And Distribution remains a high-pressure architecture stream because
it gates Rust release, shared web/gateway shape, and clean local project
operation. Its implementation order now runs behind Workspace Topology's typed
roots instead of owning placement itself.

Recommended split:

1. `runtime-identity-and-activation.md`
   - immutable release manifest;
   - workspace activation binding;
   - pin;
   - projection ledger outline;
   - migration journal outline;
   - invocation lease;
   - downgrade/refusal and state-schema compatibility;
   - drift report;
   - rollback/quarantine;
   - runtime identity reported by local `fgos`.
2. `fgctl-and-local-fgos-contract.md`, only if command responsibilities grow
   too large for the runtime identity document
   - `fgctl init/repair/upgrade/gateway`;
   - local `fgos init`;
   - local `fgos doctor` and `fgos doctor --fix`;
   - deprecated legacy setup compatibility and eventual setup retirement;
   - failure semantics.
3. `project-runtime-adapter-protocol.md`
   - future shared web/gateway constraint;
   - stable UI command context;
   - project-local adapter;
   - capability discovery;
   - event/progress/error transform;
   - out-of-process v1;
   - idempotency and payload attestation.
4. `workshop-materialization.md`, after host path/projection policy becomes a
   blocker
   - skills;
   - agents;
   - prose;
   - AGENTS.md;
   - `.agents/skills`;
   - `.claude/skills`;
   - self-development cleanliness.
```

### Unified diff

```diff
No text difference.
```

## claim_b1d4dd5d584f6021d2cfcf5c969e1dab

Source: `docs/architect/roadmap.md#unheaded-block-22`. Target: `docs/platform/system-architecture/architecture/roadmap.md#unheaded-block-24`.

Mechanical class: Unit-exact. Source digest: `9446812fdaa26253548e37263f9a7a242f489fc9db0109351c69d2245dd71144`. Target digest: `9446812fdaa26253548e37263f9a7a242f489fc9db0109351c69d2245dd71144`.

Full shown source SHA256: `9446812fdaa26253548e37263f9a7a242f489fc9db0109351c69d2245dd71144`. Full shown target SHA256: `9446812fdaa26253548e37263f9a7a242f489fc9db0109351c69d2245dd71144`.

### Proposed decision

```json
{
  "claimId": "claim_b1d4dd5d584f6021d2cfcf5c969e1dab",
  "sourceUnitDigest": "9446812fdaa26253548e37263f9a7a242f489fc9db0109351c69d2245dd71144",
  "targetOwner": "docs/platform/system-architecture/architecture/roadmap.md",
  "targetAnchor": "unheaded-block-24",
  "targetUnitDigest": "9446812fdaa26253548e37263f9a7a242f489fc9db0109351c69d2245dd71144",
  "targetAncestry": [
    "Architect Roadmap",
    "8. Packaging And Distribution Sub-Roadmap"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/roadmap.md#unheaded-block-22 (lines 207–210) into docs/platform/system-architecture/architecture/roadmap.md#unheaded-block-24 (lines 230–233), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
Packaging And Distribution remains a high-pressure architecture stream because
it gates Rust release, shared web/gateway shape, and clean local project
operation. Its implementation order now runs behind Workspace Topology's typed
roots instead of owning placement itself.
```

### Full target shown text

```text
Packaging And Distribution remains a high-pressure architecture stream because
it gates Rust release, shared web/gateway shape, and clean local project
operation. Its implementation order now runs behind Workspace Topology's typed
roots instead of owning placement itself.
```

### Unified diff

```diff
No text difference.
```

## claim_9f2a60e61c1ffc92aec216e2a711204c

Source: `docs/architect/roadmap.md#unheaded-block-23`. Target: `docs/platform/system-architecture/architecture/roadmap.md#unheaded-block-25`.

Mechanical class: Unit-exact. Source digest: `4dc084fbb4e17e76fc44418a5c9a8043f816ec214e3040d2db791c0ee1ff52b1`. Target digest: `4dc084fbb4e17e76fc44418a5c9a8043f816ec214e3040d2db791c0ee1ff52b1`.

Full shown source SHA256: `4dc084fbb4e17e76fc44418a5c9a8043f816ec214e3040d2db791c0ee1ff52b1`. Full shown target SHA256: `4dc084fbb4e17e76fc44418a5c9a8043f816ec214e3040d2db791c0ee1ff52b1`.

### Proposed decision

```json
{
  "claimId": "claim_9f2a60e61c1ffc92aec216e2a711204c",
  "sourceUnitDigest": "4dc084fbb4e17e76fc44418a5c9a8043f816ec214e3040d2db791c0ee1ff52b1",
  "targetOwner": "docs/platform/system-architecture/architecture/roadmap.md",
  "targetAnchor": "unheaded-block-25",
  "targetUnitDigest": "4dc084fbb4e17e76fc44418a5c9a8043f816ec214e3040d2db791c0ee1ff52b1",
  "targetAncestry": [
    "Architect Roadmap",
    "8. Packaging And Distribution Sub-Roadmap"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/roadmap.md#unheaded-block-23 (lines 212–248) into docs/platform/system-architecture/architecture/roadmap.md#unheaded-block-25 (lines 235–271), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
Recommended split:

1. `runtime-identity-and-activation.md`
   - immutable release manifest;
   - workspace activation binding;
   - pin;
   - projection ledger outline;
   - migration journal outline;
   - invocation lease;
   - downgrade/refusal and state-schema compatibility;
   - drift report;
   - rollback/quarantine;
   - runtime identity reported by local `fgos`.
2. `fgctl-and-local-fgos-contract.md`, only if command responsibilities grow
   too large for the runtime identity document
   - `fgctl init/repair/upgrade/gateway`;
   - local `fgos init`;
   - local `fgos doctor` and `fgos doctor --fix`;
   - deprecated legacy setup compatibility and eventual setup retirement;
   - failure semantics.
3. `project-runtime-adapter-protocol.md`
   - future shared web/gateway constraint;
   - stable UI command context;
   - project-local adapter;
   - capability discovery;
   - event/progress/error transform;
   - out-of-process v1;
   - idempotency and payload attestation.
4. `workshop-materialization.md`, after host path/projection policy becomes a
   blocker
   - skills;
   - agents;
   - prose;
   - AGENTS.md;
   - `.agents/skills`;
   - `.claude/skills`;
   - self-development cleanliness.
```

### Full target shown text

```text
Recommended split:

1. `runtime-identity-and-activation.md`
   - immutable release manifest;
   - workspace activation binding;
   - pin;
   - projection ledger outline;
   - migration journal outline;
   - invocation lease;
   - downgrade/refusal and state-schema compatibility;
   - drift report;
   - rollback/quarantine;
   - runtime identity reported by local `fgos`.
2. `fgctl-and-local-fgos-contract.md`, only if command responsibilities grow
   too large for the runtime identity document
   - `fgctl init/repair/upgrade/gateway`;
   - local `fgos init`;
   - local `fgos doctor` and `fgos doctor --fix`;
   - deprecated legacy setup compatibility and eventual setup retirement;
   - failure semantics.
3. `project-runtime-adapter-protocol.md`
   - future shared web/gateway constraint;
   - stable UI command context;
   - project-local adapter;
   - capability discovery;
   - event/progress/error transform;
   - out-of-process v1;
   - idempotency and payload attestation.
4. `workshop-materialization.md`, after host path/projection policy becomes a
   blocker
   - skills;
   - agents;
   - prose;
   - AGENTS.md;
   - `.agents/skills`;
   - `.claude/skills`;
   - self-development cleanliness.
```

### Unified diff

```diff
No text difference.
```

## claim_5da90c457140655340546484d478dd4e

Source: `docs/architect/roadmap.md#9-spec-update-rule`. Target: `docs/platform/system-architecture/architecture/roadmap.md#9-spec-update-rule`.

Mechanical class: Weak-exact. Source digest: `1b56f25a66f36c02facfd652d76fba986f50290fc84223b86ca03df729f8293d`. Target digest: `1b56f25a66f36c02facfd652d76fba986f50290fc84223b86ca03df729f8293d`.

Full shown source SHA256: `02322368d33a83f1a6ca3a0edb2af450c7b6c186a2859e77baffcad95870dc24`. Full shown target SHA256: `02322368d33a83f1a6ca3a0edb2af450c7b6c186a2859e77baffcad95870dc24`.

### Proposed decision

```json
{
  "claimId": "claim_5da90c457140655340546484d478dd4e",
  "sourceUnitDigest": "1b56f25a66f36c02facfd652d76fba986f50290fc84223b86ca03df729f8293d",
  "targetOwner": "docs/platform/system-architecture/architecture/roadmap.md",
  "targetAnchor": "9-spec-update-rule",
  "targetUnitDigest": "1b56f25a66f36c02facfd652d76fba986f50290fc84223b86ca03df729f8293d",
  "targetAncestry": [
    "Architect Roadmap"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. Carry the complete heading at docs/architect/roadmap.md#9-spec-update-rule (lines 250–250) into docs/platform/system-architecture/architecture/roadmap.md#9-spec-update-rule (lines 273–273), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
## 9. Spec Update Rule

For now, new architecture writing stays under `docs/architect/`.

`docs/specs/*` is treated as generated/curated state. It should not be edited
opportunistically while the design is still moving. Once a decision settles,
update the generated source or owning workflow first, then regenerate/check the
spec projection.
```

### Full target shown text

```text
## 9. Spec Update Rule

For now, new architecture writing stays under `docs/architect/`.

`docs/specs/*` is treated as generated/curated state. It should not be edited
opportunistically while the design is still moving. Once a decision settles,
update the generated source or owning workflow first, then regenerate/check the
spec projection.
```

### Unified diff

```diff
No text difference.
```

## claim_b26f5bb1a6707753a11e095029be5b84

Source: `docs/architect/roadmap.md#unheaded-block-24`. Target: `docs/platform/system-architecture/architecture/roadmap.md#unheaded-block-26`.

Mechanical class: Unit-exact. Source digest: `88015746993e09e29c55ca989dbd7df13b1b1268766ee5f5484e995b24bf9ade`. Target digest: `88015746993e09e29c55ca989dbd7df13b1b1268766ee5f5484e995b24bf9ade`.

Full shown source SHA256: `88015746993e09e29c55ca989dbd7df13b1b1268766ee5f5484e995b24bf9ade`. Full shown target SHA256: `88015746993e09e29c55ca989dbd7df13b1b1268766ee5f5484e995b24bf9ade`.

### Proposed decision

```json
{
  "claimId": "claim_b26f5bb1a6707753a11e095029be5b84",
  "sourceUnitDigest": "88015746993e09e29c55ca989dbd7df13b1b1268766ee5f5484e995b24bf9ade",
  "targetOwner": "docs/platform/system-architecture/architecture/roadmap.md",
  "targetAnchor": "unheaded-block-26",
  "targetUnitDigest": "88015746993e09e29c55ca989dbd7df13b1b1268766ee5f5484e995b24bf9ade",
  "targetAncestry": [
    "Architect Roadmap",
    "9. Spec Update Rule"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/roadmap.md#unheaded-block-24 (lines 252–252) into docs/platform/system-architecture/architecture/roadmap.md#unheaded-block-26 (lines 275–275), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
For now, new architecture writing stays under `docs/architect/`.
```

### Full target shown text

```text
For now, new architecture writing stays under `docs/architect/`.
```

### Unified diff

```diff
No text difference.
```

## claim_5583e5fb6f926677b26343d340174308

Source: `docs/architect/roadmap.md#unheaded-block-25`. Target: `docs/platform/system-architecture/architecture/roadmap.md#unheaded-block-27`.

Mechanical class: Unit-exact. Source digest: `8609e90d1bf1262f7a8e2255acd4c0001a349b75e2c665ad87d927c0e418a89a`. Target digest: `8609e90d1bf1262f7a8e2255acd4c0001a349b75e2c665ad87d927c0e418a89a`.

Full shown source SHA256: `8609e90d1bf1262f7a8e2255acd4c0001a349b75e2c665ad87d927c0e418a89a`. Full shown target SHA256: `8609e90d1bf1262f7a8e2255acd4c0001a349b75e2c665ad87d927c0e418a89a`.

### Proposed decision

```json
{
  "claimId": "claim_5583e5fb6f926677b26343d340174308",
  "sourceUnitDigest": "8609e90d1bf1262f7a8e2255acd4c0001a349b75e2c665ad87d927c0e418a89a",
  "targetOwner": "docs/platform/system-architecture/architecture/roadmap.md",
  "targetAnchor": "unheaded-block-27",
  "targetUnitDigest": "8609e90d1bf1262f7a8e2255acd4c0001a349b75e2c665ad87d927c0e418a89a",
  "targetAncestry": [
    "Architect Roadmap",
    "9. Spec Update Rule"
  ],
  "claimKind": "decision",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/roadmap.md#unheaded-block-25 (lines 254–257) into docs/platform/system-architecture/architecture/roadmap.md#unheaded-block-27 (lines 277–280), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
`docs/specs/*` is treated as generated/curated state. It should not be edited
opportunistically while the design is still moving. Once a decision settles,
update the generated source or owning workflow first, then regenerate/check the
spec projection.
```

### Full target shown text

```text
`docs/specs/*` is treated as generated/curated state. It should not be edited
opportunistically while the design is still moving. Once a decision settles,
update the generated source or owning workflow first, then regenerate/check the
spec projection.
```

### Unified diff

```diff
No text difference.
```

## claim_e56e94ff728fa8025c139f39228b20ff

Source: `docs/architect/roadmap.md#10-roadmap-status`. Target: `docs/platform/system-architecture/architecture/roadmap.md#10-roadmap-status`.

Mechanical class: Weak-exact. Source digest: `ae6ca13f1241311ca408bc68e8333a55f4976241cbae8e53d99b816894a90afd`. Target digest: `ae6ca13f1241311ca408bc68e8333a55f4976241cbae8e53d99b816894a90afd`.

Full shown source SHA256: `4dde3ef5bd939b3d976e081a54340a75bc3fd0ab7b6060408a433fa42a525266`. Full shown target SHA256: `4dde3ef5bd939b3d976e081a54340a75bc3fd0ab7b6060408a433fa42a525266`.

### Proposed decision

```json
{
  "claimId": "claim_e56e94ff728fa8025c139f39228b20ff",
  "sourceUnitDigest": "ae6ca13f1241311ca408bc68e8333a55f4976241cbae8e53d99b816894a90afd",
  "targetOwner": "docs/platform/system-architecture/architecture/roadmap.md",
  "targetAnchor": "10-roadmap-status",
  "targetUnitDigest": "ae6ca13f1241311ca408bc68e8333a55f4976241cbae8e53d99b816894a90afd",
  "targetAncestry": [
    "Architect Roadmap"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: source unit shorter than 40 characters. Carry the complete heading at docs/architect/roadmap.md#10-roadmap-status (lines 259–259) into docs/platform/system-architecture/architecture/roadmap.md#10-roadmap-status (lines 282–282), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
## 10. Roadmap Status

| Area | Current Status | Next Architecture Action |
|---|---|---|
| Agent Coordination | Step 09 implemented slice is closed and canonical through promoted contracts; deferred mechanisms remain parked. | Keep stable unless Step 10 proves a missing substrate primitive. |
| Coding Domain / Step 10 | Ready to resume after Step 09. | Start with node-only boundary/harness facade pass, then read-only `validate-plan` session bridge, evidence adapter, concurrency/occupancy reconciliation, mutating live proof, and Work Driver unification. |
| Component Boundary | Existing advisory exists. | Update after Step 10 and topology prove the ownership split; do not use file layout as the source of authority. |
| Workspace Topology | Contract draft and companion roadmap/audit exist; durable history placement remains the named lock blocker. | Close durable history placement, then implement resolver skeleton and migrate config/coordination/hot history behind typed roots. |
| Host Invocation | Existing routing/migration docs exist. | Add payload/adapter selection and TopologyContext preconditions. |
| Node To Rust | Migration path exists. | Reframe public R1 release around distribution artifact proof plus topology-aware activation/install proof. |
| Packaging Distribution | Runtime identity contract now depends on Workspace Topology and has resolved the major placement/lifecycle conflicts. | Hold implementation until topology contract/resolver can supply typed roots; continue doc-only adapter constraints in parallel. |
```

### Full target shown text

```text
## 10. Roadmap Status

| Area | Current Status | Next Architecture Action |
|---|---|---|
| Agent Coordination | Step 09 implemented slice is closed and canonical through promoted contracts; deferred mechanisms remain parked. | Keep stable unless Step 10 proves a missing substrate primitive. |
| Coding Domain / Step 10 | Ready to resume after Step 09. | Start with node-only boundary/harness facade pass, then read-only `validate-plan` session bridge, evidence adapter, concurrency/occupancy reconciliation, mutating live proof, and Work Driver unification. |
| Component Boundary | Existing advisory exists. | Update after Step 10 and topology prove the ownership split; do not use file layout as the source of authority. |
| Workspace Topology | Contract draft and companion roadmap/audit exist; durable history placement remains the named lock blocker. | Close durable history placement, then implement resolver skeleton and migrate config/coordination/hot history behind typed roots. |
| Host Invocation | Existing routing/migration docs exist. | Add payload/adapter selection and TopologyContext preconditions. |
| Node To Rust | Migration path exists. | Reframe public R1 release around distribution artifact proof plus topology-aware activation/install proof. |
| Packaging Distribution | Runtime identity contract now depends on Workspace Topology and has resolved the major placement/lifecycle conflicts. | Hold implementation until topology contract/resolver can supply typed roots; continue doc-only adapter constraints in parallel. |
```

### Unified diff

```diff
No text difference.
```

## claim_1e4477a65ecb1075b1d724d7e38d4293

Source: `docs/architect/roadmap.md#unheaded-block-26`. Target: `docs/platform/system-architecture/architecture/roadmap.md#unheaded-block-28`.

Mechanical class: Unit-exact. Source digest: `2b4e99a43773981f2ada8bdd238be0f89d3ad08dbc67dd923e57565748e71ba1`. Target digest: `2b4e99a43773981f2ada8bdd238be0f89d3ad08dbc67dd923e57565748e71ba1`.

Full shown source SHA256: `2b4e99a43773981f2ada8bdd238be0f89d3ad08dbc67dd923e57565748e71ba1`. Full shown target SHA256: `2b4e99a43773981f2ada8bdd238be0f89d3ad08dbc67dd923e57565748e71ba1`.

### Proposed decision

```json
{
  "claimId": "claim_1e4477a65ecb1075b1d724d7e38d4293",
  "sourceUnitDigest": "2b4e99a43773981f2ada8bdd238be0f89d3ad08dbc67dd923e57565748e71ba1",
  "targetOwner": "docs/platform/system-architecture/architecture/roadmap.md",
  "targetAnchor": "unheaded-block-28",
  "targetUnitDigest": "2b4e99a43773981f2ada8bdd238be0f89d3ad08dbc67dd923e57565748e71ba1",
  "targetAncestry": [
    "Architect Roadmap",
    "10. Roadmap Status"
  ],
  "claimKind": "architecture",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. Carry the complete unheaded-block at docs/architect/roadmap.md#unheaded-block-26 (lines 261–269) into docs/platform/system-architecture/architecture/roadmap.md#unheaded-block-28 (lines 284–292), the frozen whole-system architecture owner. The candidate keeps the source hierarchy and complete payload; new candidate metadata is separate from original dated source metadata. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
| Area | Current Status | Next Architecture Action |
|---|---|---|
| Agent Coordination | Step 09 implemented slice is closed and canonical through promoted contracts; deferred mechanisms remain parked. | Keep stable unless Step 10 proves a missing substrate primitive. |
| Coding Domain / Step 10 | Ready to resume after Step 09. | Start with node-only boundary/harness facade pass, then read-only `validate-plan` session bridge, evidence adapter, concurrency/occupancy reconciliation, mutating live proof, and Work Driver unification. |
| Component Boundary | Existing advisory exists. | Update after Step 10 and topology prove the ownership split; do not use file layout as the source of authority. |
| Workspace Topology | Contract draft and companion roadmap/audit exist; durable history placement remains the named lock blocker. | Close durable history placement, then implement resolver skeleton and migrate config/coordination/hot history behind typed roots. |
| Host Invocation | Existing routing/migration docs exist. | Add payload/adapter selection and TopologyContext preconditions. |
| Node To Rust | Migration path exists. | Reframe public R1 release around distribution artifact proof plus topology-aware activation/install proof. |
| Packaging Distribution | Runtime identity contract now depends on Workspace Topology and has resolved the major placement/lifecycle conflicts. | Hold implementation until topology contract/resolver can supply typed roots; continue doc-only adapter constraints in parallel. |
```

### Full target shown text

```text
| Area | Current Status | Next Architecture Action |
|---|---|---|
| Agent Coordination | Step 09 implemented slice is closed and canonical through promoted contracts; deferred mechanisms remain parked. | Keep stable unless Step 10 proves a missing substrate primitive. |
| Coding Domain / Step 10 | Ready to resume after Step 09. | Start with node-only boundary/harness facade pass, then read-only `validate-plan` session bridge, evidence adapter, concurrency/occupancy reconciliation, mutating live proof, and Work Driver unification. |
| Component Boundary | Existing advisory exists. | Update after Step 10 and topology prove the ownership split; do not use file layout as the source of authority. |
| Workspace Topology | Contract draft and companion roadmap/audit exist; durable history placement remains the named lock blocker. | Close durable history placement, then implement resolver skeleton and migrate config/coordination/hot history behind typed roots. |
| Host Invocation | Existing routing/migration docs exist. | Add payload/adapter selection and TopologyContext preconditions. |
| Node To Rust | Migration path exists. | Reframe public R1 release around distribution artifact proof plus topology-aware activation/install proof. |
| Packaging Distribution | Runtime identity contract now depends on Workspace Topology and has resolved the major placement/lifecycle conflicts. | Hold implementation until topology contract/resolver can supply typed roots; continue doc-only adapter constraints in parallel. |
```

### Unified diff

```diff
No text difference.
```
