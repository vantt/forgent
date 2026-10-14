# Bounded whole-system source review request

Content commit: `a8a10abc1a24218518a14764f68c8d86f4810f91`. Author session: `codex-session:37@2026-10-15`. Review mode requested: ordinary.

Shard: `plans/260925-documentation-authority-unification/ledger/decisions/s6-whole-system-component-repo-layout-vision.json`. Part 1/1; entries: **51**. Sidecar: `review-request-261015-0450-whole-system-07.md.json`.

Read review-brief.md, owner-answers.md A28–A37, frozen whole-system map, constitution, vocabulary and shard schema. Apply A36: mechanically check every row (full digest recompute, anchor check, shard/pack equality); deeply read the reviewer-seeded sample plus every differing-digest row in both directions with its diff. Preserve conditions, qualifiers, dated status and complete payload; verify one owner and labelled additions. No approval is supplied here.

Step 6’s closing review is a **checkpoint review whose sensitivity pack the reviewer holds**. The author has not created, seen or selected that pack/key. Ordinary review and A36 sampling do not replace checkpoint sensitivity.

Ordinary verdict contract: `Reviewer: <independent identity>`, `Review mode: ordinary`, request/content/shard pins; one own note and full 64-hex shown-unit digests per row. Use ok/rework/hold. Consolidate parts into a complete report for the original shard before unchanged ordinary application; never edit decisions manually.

| Claim | Verdict | Note | Source digest | Target digest |
|---|---|---|---|---|

A36 mandatory differing-digest rows (10): `claim_2ec8b055e66f2e619fd52fe0e034749b`, `claim_639902d65d5f6df0093258f57c8204e1`, `claim_dce48cdf3d5bc4286851019b60b3bef0`, `claim_32d9111a44a0fd47c5931d9ae4326c98`, `claim_41897bb097a7f5cd419fb5befcb4e8a5`, `claim_42567e9be1c7ee274c16626c6128ca5e`, `claim_4f6eab9173895d9e8f28872b08fd8482`, `claim_9ab5449a4dca62046f1ab1ca6ea93ba2`, `claim_1b9db4dfec256a65756b0b18f80b5a8e`, `claim_ab116066789a96601346310606cc30a0`.

Absent-target rows (0): none.

This pack has 51 Weak-exact/Judgment rows; reviewer independently draws/records at least 10 by seed (>=15%, minimum 10, all if fewer), plus every differing pair listed above. Each verdict note says deep or mechanical. If >3% of deep-read rows need rework, deeply read the complete pack before reporting. Author selected no sample. Whole batch: 300 Unit-exact, 392 Weak-exact, 134 Judgment, all 826 pending; 123 mandatory differing pairs. The 79-row batch-wide lower bound does not replace each pack minimum.

Reverse review: the separate native candidate-unverified request/list covers the complete scoped population; it is not reset per sliced pack. Full shown text hashes below bind payload separately from native heading identity digests.

## claim_2ec8b055e66f2e619fd52fe0e034749b

Source: `docs/architect/component-boundary/repo-layout-vision.md#repo-layout-vision-apps-and-packages`. Target: `docs/platform/component-boundary.md#repo-layout-vision-apps-and-packages`.

Mechanical class: Judgment. Source digest: `9ae78c3cca831de53cf961ce318559c75696fcdb80fda15ce8b72cf99b6c85e3`. Target digest: `1ac581c7858e4e0ce09744e6ae7604d2f66acea231082ec088b4eb6ffbe376fe`.

Full shown source SHA256: `53209d2f64d4a15729494fdbcf9dd56804e6125b97ac5044c911fedb0816d04d`. Full shown target SHA256: `b0c1a21985e7839f68308d65a9b1792f3a36345d521336fbe32826e84e0a03f7`.

### Proposed decision

```json
{
  "claimId": "claim_2ec8b055e66f2e619fd52fe0e034749b",
  "sourceUnitDigest": "9ae78c3cca831de53cf961ce318559c75696fcdb80fda15ce8b72cf99b6c85e3",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "repo-layout-vision-apps-and-packages",
  "targetUnitDigest": "1ac581c7858e4e0ce09744e6ae7604d2f66acea231082ec088b4eb6ffbe376fe",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: repo-layout-vision source carriage"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Judgment: no target digest match. Carry the complete heading at docs/architect/component-boundary/repo-layout-vision.md#repo-layout-vision-apps-and-packages (lines 1–1) into docs/platform/component-boundary.md#repo-layout-vision-apps-and-packages (lines 1389–1389), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. Digest differences come only from the recorded candidate header/frontmatter fence, heading-level shift or physical relative-link rebasing; full before/after units and line mapping are in authoring accounting. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
# Repo Layout Vision: Apps And Packages

**Status:** Vision / direction, not a locked platform law and not a full spec.
**Date:** 2026-08-26.
**Source:** Product-owner direction.

This document records a physical repo-layout direction for separating thin
entrypoints from reusable implementation packages. It does not change runtime
behavior by itself.

The locked target in this document is the Rust/web slice around
`herdr-plugin/`. The Node side is intentionally left for a later discussion.
```

### Full target shown text

```text
### Repo Layout Vision: Apps And Packages

**Status:** Vision / direction, not a locked platform law and not a full spec.
**Date:** 2026-08-26.
**Source:** Product-owner direction.

This document records a physical repo-layout direction for separating thin
entrypoints from reusable implementation packages. It does not change runtime
behavior by itself.

The locked target in this document is the Rust/web slice around
`herdr-plugin/`. The Node side is intentionally left for a later discussion.
```

### Unified diff

```diff
--- docs/architect/component-boundary/repo-layout-vision.md#repo-layout-vision-apps-and-packages
+++ docs/platform/component-boundary.md#repo-layout-vision-apps-and-packages
@@ -1,4 +1,4 @@
-# Repo Layout Vision: Apps And Packages
+### Repo Layout Vision: Apps And Packages
 
 **Status:** Vision / direction, not a locked platform law and not a full spec.
 **Date:** 2026-08-26.

```

## claim_677ebcfcc1b4ba2e5e942d69b86a745c

Source: `docs/architect/component-boundary/repo-layout-vision.md#unheaded-block-1`. Target: `docs/platform/component-boundary.md#unheaded-block-201`.

Mechanical class: Weak-exact. Source digest: `600bc69a0d8c5cdc1971c2d0be88c8a834718567f57aad21da8a8bb2da8a4865`. Target digest: `600bc69a0d8c5cdc1971c2d0be88c8a834718567f57aad21da8a8bb2da8a4865`.

Full shown source SHA256: `600bc69a0d8c5cdc1971c2d0be88c8a834718567f57aad21da8a8bb2da8a4865`. Full shown target SHA256: `600bc69a0d8c5cdc1971c2d0be88c8a834718567f57aad21da8a8bb2da8a4865`.

### Proposed decision

```json
{
  "claimId": "claim_677ebcfcc1b4ba2e5e942d69b86a745c",
  "sourceUnitDigest": "600bc69a0d8c5cdc1971c2d0be88c8a834718567f57aad21da8a8bb2da8a4865",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-201",
  "targetUnitDigest": "600bc69a0d8c5cdc1971c2d0be88c8a834718567f57aad21da8a8bb2da8a4865",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: repo-layout-vision source carriage",
    "Repo Layout Vision: Apps And Packages"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/repo-layout-vision.md#unheaded-block-1 (lines 3–5) into docs/platform/component-boundary.md#unheaded-block-201 (lines 1391–1393), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
**Status:** Vision / direction, not a locked platform law and not a full spec.
**Date:** 2026-08-26.
**Source:** Product-owner direction.
```

### Full target shown text

```text
**Status:** Vision / direction, not a locked platform law and not a full spec.
**Date:** 2026-08-26.
**Source:** Product-owner direction.
```

### Unified diff

```diff
No text difference.
```

## claim_43135edc5a24c4bd52adb2d7d28043bd

Source: `docs/architect/component-boundary/repo-layout-vision.md#unheaded-block-2`. Target: `docs/platform/component-boundary.md#unheaded-block-202`.

Mechanical class: Weak-exact. Source digest: `646da677b24d7d254aa6a427ed000fa54c265036006b85f5829784308b1e9e59`. Target digest: `646da677b24d7d254aa6a427ed000fa54c265036006b85f5829784308b1e9e59`.

Full shown source SHA256: `646da677b24d7d254aa6a427ed000fa54c265036006b85f5829784308b1e9e59`. Full shown target SHA256: `646da677b24d7d254aa6a427ed000fa54c265036006b85f5829784308b1e9e59`.

### Proposed decision

```json
{
  "claimId": "claim_43135edc5a24c4bd52adb2d7d28043bd",
  "sourceUnitDigest": "646da677b24d7d254aa6a427ed000fa54c265036006b85f5829784308b1e9e59",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-202",
  "targetUnitDigest": "646da677b24d7d254aa6a427ed000fa54c265036006b85f5829784308b1e9e59",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: repo-layout-vision source carriage",
    "Repo Layout Vision: Apps And Packages"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/repo-layout-vision.md#unheaded-block-2 (lines 7–9) into docs/platform/component-boundary.md#unheaded-block-202 (lines 1395–1397), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
This document records a physical repo-layout direction for separating thin
entrypoints from reusable implementation packages. It does not change runtime
behavior by itself.
```

### Full target shown text

```text
This document records a physical repo-layout direction for separating thin
entrypoints from reusable implementation packages. It does not change runtime
behavior by itself.
```

### Unified diff

```diff
No text difference.
```

## claim_4e3f9eda058d9f35f4de1478c117e4a3

Source: `docs/architect/component-boundary/repo-layout-vision.md#unheaded-block-3`. Target: `docs/platform/component-boundary.md#unheaded-block-203`.

Mechanical class: Weak-exact. Source digest: `a78654448d18c93b0449abec6162b702095760f3b2a170f26407a1824cea09a1`. Target digest: `a78654448d18c93b0449abec6162b702095760f3b2a170f26407a1824cea09a1`.

Full shown source SHA256: `a78654448d18c93b0449abec6162b702095760f3b2a170f26407a1824cea09a1`. Full shown target SHA256: `a78654448d18c93b0449abec6162b702095760f3b2a170f26407a1824cea09a1`.

### Proposed decision

```json
{
  "claimId": "claim_4e3f9eda058d9f35f4de1478c117e4a3",
  "sourceUnitDigest": "a78654448d18c93b0449abec6162b702095760f3b2a170f26407a1824cea09a1",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-203",
  "targetUnitDigest": "a78654448d18c93b0449abec6162b702095760f3b2a170f26407a1824cea09a1",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: repo-layout-vision source carriage",
    "Repo Layout Vision: Apps And Packages"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/repo-layout-vision.md#unheaded-block-3 (lines 11–12) into docs/platform/component-boundary.md#unheaded-block-203 (lines 1399–1400), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
The locked target in this document is the Rust/web slice around
`herdr-plugin/`. The Node side is intentionally left for a later discussion.
```

### Full target shown text

```text
The locked target in this document is the Rust/web slice around
`herdr-plugin/`. The Node side is intentionally left for a later discussion.
```

### Unified diff

```diff
No text difference.
```

## claim_639902d65d5f6df0093258f57c8204e1

Source: `docs/architect/component-boundary/repo-layout-vision.md#implementation-status-2026-10-04`. Target: `docs/platform/component-boundary.md#implementation-status-2026-10-04`.

Mechanical class: Judgment. Source digest: `64a338ebc8a2d6af1011479e3997e9b3b29c7391d45862634782b241a0f75c26`. Target digest: `7b8df0d39695b13b8cff1527ff7809dd0fb088024cce3df49291107657449977`.

Full shown source SHA256: `38067767de33ee62f17a3724658390df22699afa4b97241ee9802a58dd3ea2bc`. Full shown target SHA256: `47886a8c5712931468bd8197d78df04632ff430fd5f20670ffc8c9e4296ad4c5`.

### Proposed decision

```json
{
  "claimId": "claim_639902d65d5f6df0093258f57c8204e1",
  "sourceUnitDigest": "64a338ebc8a2d6af1011479e3997e9b3b29c7391d45862634782b241a0f75c26",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "implementation-status-2026-10-04",
  "targetUnitDigest": "7b8df0d39695b13b8cff1527ff7809dd0fb088024cce3df49291107657449977",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: repo-layout-vision source carriage",
    "Repo Layout Vision: Apps And Packages"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Judgment: no target digest match. Carry the complete heading at docs/architect/component-boundary/repo-layout-vision.md#implementation-status-2026-10-04 (lines 14–14) into docs/platform/component-boundary.md#implementation-status-2026-10-04 (lines 1402–1402), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. Digest differences come only from the recorded candidate header/frontmatter fence, heading-level shift or physical relative-link rebasing; full before/after units and line mapping are in authoring accounting. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
## Implementation Status (2026-10-04)

A smaller slice of this vision is implemented. It is a pure move and rename,
with no change to behavior:

- the gateway is `apps/fgos-gateway/` (crate and binary `fgos-gateway`, no
  `gateway` argument); it keeps `gateway.rs`, `mcp.rs`, `cf_access.rs`,
  `remote_invocation.rs`, `web/` and the embedded `static/` together instead of
  the `packages/gateway`, `packages/mcp` and `packages/web-dashboard` split;
- the herdr plugin stays one crate at `herdr-dashboard/` (renamed from
  `herdr-plugin/`; binary `herdr-dashboard`, manifest `herdr-plugin.toml`)
  instead of `apps/herdr-tui` plus `packages/herdr-core` and
  `packages/herdr-ui`;
- the shared fgos CLI adapter, settings and `WorkItemSource` port are
  `packages/herdr-fgos-common/rust/`, standing in for `packages/fgos-ports`;
  the gateway's `VerbGateway` port moved next to its only users in the gateway
  crate;
- both Rust crates stay outside the root Cargo workspace with their own lock
  file and `target/`, because herdr loads the plugin binary from
  `$HERDR_PLUGIN_ROOT/target/release/`.

The finer `packages/*` split below remains the long-term direction and is not
yet done.
```

### Full target shown text

```text
#### Implementation Status (2026-10-04)

A smaller slice of this vision is implemented. It is a pure move and rename,
with no change to behavior:

- the gateway is `apps/fgos-gateway/` (crate and binary `fgos-gateway`, no
  `gateway` argument); it keeps `gateway.rs`, `mcp.rs`, `cf_access.rs`,
  `remote_invocation.rs`, `web/` and the embedded `static/` together instead of
  the `packages/gateway`, `packages/mcp` and `packages/web-dashboard` split;
- the herdr plugin stays one crate at `herdr-dashboard/` (renamed from
  `herdr-plugin/`; binary `herdr-dashboard`, manifest `herdr-plugin.toml`)
  instead of `apps/herdr-tui` plus `packages/herdr-core` and
  `packages/herdr-ui`;
- the shared fgos CLI adapter, settings and `WorkItemSource` port are
  `packages/herdr-fgos-common/rust/`, standing in for `packages/fgos-ports`;
  the gateway's `VerbGateway` port moved next to its only users in the gateway
  crate;
- both Rust crates stay outside the root Cargo workspace with their own lock
  file and `target/`, because herdr loads the plugin binary from
  `$HERDR_PLUGIN_ROOT/target/release/`.

The finer `packages/*` split below remains the long-term direction and is not
yet done.
```

### Unified diff

```diff
--- docs/architect/component-boundary/repo-layout-vision.md#implementation-status-2026-10-04
+++ docs/platform/component-boundary.md#implementation-status-2026-10-04
@@ -1,4 +1,4 @@
-## Implementation Status (2026-10-04)
+#### Implementation Status (2026-10-04)
 
 A smaller slice of this vision is implemented. It is a pure move and rename,
 with no change to behavior:

```

## claim_cc3cf1b3934e5d819e4e2a48d11a4ccd

Source: `docs/architect/component-boundary/repo-layout-vision.md#unheaded-block-4`. Target: `docs/platform/component-boundary.md#unheaded-block-204`.

Mechanical class: Weak-exact. Source digest: `b057d1be2912bd98312d038ce8b46d6223cbdcac4bbde20d4538b7ab609342f9`. Target digest: `b057d1be2912bd98312d038ce8b46d6223cbdcac4bbde20d4538b7ab609342f9`.

Full shown source SHA256: `b057d1be2912bd98312d038ce8b46d6223cbdcac4bbde20d4538b7ab609342f9`. Full shown target SHA256: `b057d1be2912bd98312d038ce8b46d6223cbdcac4bbde20d4538b7ab609342f9`.

### Proposed decision

```json
{
  "claimId": "claim_cc3cf1b3934e5d819e4e2a48d11a4ccd",
  "sourceUnitDigest": "b057d1be2912bd98312d038ce8b46d6223cbdcac4bbde20d4538b7ab609342f9",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-204",
  "targetUnitDigest": "b057d1be2912bd98312d038ce8b46d6223cbdcac4bbde20d4538b7ab609342f9",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: repo-layout-vision source carriage",
    "Repo Layout Vision: Apps And Packages",
    "Implementation Status (2026-10-04)"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/repo-layout-vision.md#unheaded-block-4 (lines 16–17) into docs/platform/component-boundary.md#unheaded-block-204 (lines 1404–1405), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
A smaller slice of this vision is implemented. It is a pure move and rename,
with no change to behavior:
```

### Full target shown text

```text
A smaller slice of this vision is implemented. It is a pure move and rename,
with no change to behavior:
```

### Unified diff

```diff
No text difference.
```

## claim_a1748dac82eb1f3f63117716e7aa8c51

Source: `docs/architect/component-boundary/repo-layout-vision.md#unheaded-block-5`. Target: `docs/platform/component-boundary.md#unheaded-block-205`.

Mechanical class: Weak-exact. Source digest: `9ae3c5bd75b82fb7a88e7c0862837e1bde2bc44d4f22cbfe2a0f2e5726e7aea8`. Target digest: `9ae3c5bd75b82fb7a88e7c0862837e1bde2bc44d4f22cbfe2a0f2e5726e7aea8`.

Full shown source SHA256: `9ae3c5bd75b82fb7a88e7c0862837e1bde2bc44d4f22cbfe2a0f2e5726e7aea8`. Full shown target SHA256: `9ae3c5bd75b82fb7a88e7c0862837e1bde2bc44d4f22cbfe2a0f2e5726e7aea8`.

### Proposed decision

```json
{
  "claimId": "claim_a1748dac82eb1f3f63117716e7aa8c51",
  "sourceUnitDigest": "9ae3c5bd75b82fb7a88e7c0862837e1bde2bc44d4f22cbfe2a0f2e5726e7aea8",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-205",
  "targetUnitDigest": "9ae3c5bd75b82fb7a88e7c0862837e1bde2bc44d4f22cbfe2a0f2e5726e7aea8",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: repo-layout-vision source carriage",
    "Repo Layout Vision: Apps And Packages",
    "Implementation Status (2026-10-04)"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/repo-layout-vision.md#unheaded-block-5 (lines 19–33) into docs/platform/component-boundary.md#unheaded-block-205 (lines 1407–1421), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
- the gateway is `apps/fgos-gateway/` (crate and binary `fgos-gateway`, no
  `gateway` argument); it keeps `gateway.rs`, `mcp.rs`, `cf_access.rs`,
  `remote_invocation.rs`, `web/` and the embedded `static/` together instead of
  the `packages/gateway`, `packages/mcp` and `packages/web-dashboard` split;
- the herdr plugin stays one crate at `herdr-dashboard/` (renamed from
  `herdr-plugin/`; binary `herdr-dashboard`, manifest `herdr-plugin.toml`)
  instead of `apps/herdr-tui` plus `packages/herdr-core` and
  `packages/herdr-ui`;
- the shared fgos CLI adapter, settings and `WorkItemSource` port are
  `packages/herdr-fgos-common/rust/`, standing in for `packages/fgos-ports`;
  the gateway's `VerbGateway` port moved next to its only users in the gateway
  crate;
- both Rust crates stay outside the root Cargo workspace with their own lock
  file and `target/`, because herdr loads the plugin binary from
  `$HERDR_PLUGIN_ROOT/target/release/`.
```

### Full target shown text

```text
- the gateway is `apps/fgos-gateway/` (crate and binary `fgos-gateway`, no
  `gateway` argument); it keeps `gateway.rs`, `mcp.rs`, `cf_access.rs`,
  `remote_invocation.rs`, `web/` and the embedded `static/` together instead of
  the `packages/gateway`, `packages/mcp` and `packages/web-dashboard` split;
- the herdr plugin stays one crate at `herdr-dashboard/` (renamed from
  `herdr-plugin/`; binary `herdr-dashboard`, manifest `herdr-plugin.toml`)
  instead of `apps/herdr-tui` plus `packages/herdr-core` and
  `packages/herdr-ui`;
- the shared fgos CLI adapter, settings and `WorkItemSource` port are
  `packages/herdr-fgos-common/rust/`, standing in for `packages/fgos-ports`;
  the gateway's `VerbGateway` port moved next to its only users in the gateway
  crate;
- both Rust crates stay outside the root Cargo workspace with their own lock
  file and `target/`, because herdr loads the plugin binary from
  `$HERDR_PLUGIN_ROOT/target/release/`.
```

### Unified diff

```diff
No text difference.
```

## claim_70ff5c4e999f2c687855fdfdcbcec777

Source: `docs/architect/component-boundary/repo-layout-vision.md#unheaded-block-6`. Target: `docs/platform/component-boundary.md#unheaded-block-206`.

Mechanical class: Weak-exact. Source digest: `085efe034defd5140391d5b22c2ee2116e18c038ac206cbe687bf3c794c5d0b7`. Target digest: `085efe034defd5140391d5b22c2ee2116e18c038ac206cbe687bf3c794c5d0b7`.

Full shown source SHA256: `085efe034defd5140391d5b22c2ee2116e18c038ac206cbe687bf3c794c5d0b7`. Full shown target SHA256: `085efe034defd5140391d5b22c2ee2116e18c038ac206cbe687bf3c794c5d0b7`.

### Proposed decision

```json
{
  "claimId": "claim_70ff5c4e999f2c687855fdfdcbcec777",
  "sourceUnitDigest": "085efe034defd5140391d5b22c2ee2116e18c038ac206cbe687bf3c794c5d0b7",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-206",
  "targetUnitDigest": "085efe034defd5140391d5b22c2ee2116e18c038ac206cbe687bf3c794c5d0b7",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: repo-layout-vision source carriage",
    "Repo Layout Vision: Apps And Packages",
    "Implementation Status (2026-10-04)"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/repo-layout-vision.md#unheaded-block-6 (lines 35–36) into docs/platform/component-boundary.md#unheaded-block-206 (lines 1423–1424), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
The finer `packages/*` split below remains the long-term direction and is not
yet done.
```

### Full target shown text

```text
The finer `packages/*` split below remains the long-term direction and is not
yet done.
```

### Unified diff

```diff
No text difference.
```

## claim_dce48cdf3d5bc4286851019b60b3bef0

Source: `docs/architect/component-boundary/repo-layout-vision.md#1-decision-summary`. Target: `docs/platform/component-boundary.md#1-decision-summary`.

Mechanical class: Judgment. Source digest: `7fc1d07fcef79d350abe177ee166d1a750244ccfe71086604d888d2410d25e8c`. Target digest: `4c8ea3bee535dd7bc4618bd99dcd59348fcb66d44b70566bef73fefec499261d`.

Full shown source SHA256: `09ef02115ea048904d4ac609d1eed7c3a02d555958fda1e804be5c7c4b6ed762`. Full shown target SHA256: `03f87484b1cc49e0e4ccb12076750f7e22977ed5b3c48227fdd1b939625ce2b5`.

### Proposed decision

```json
{
  "claimId": "claim_dce48cdf3d5bc4286851019b60b3bef0",
  "sourceUnitDigest": "7fc1d07fcef79d350abe177ee166d1a750244ccfe71086604d888d2410d25e8c",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "1-decision-summary",
  "targetUnitDigest": "4c8ea3bee535dd7bc4618bd99dcd59348fcb66d44b70566bef73fefec499261d",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: repo-layout-vision source carriage",
    "Repo Layout Vision: Apps And Packages"
  ],
  "claimKind": "decision",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Judgment: no target digest match. Carry the complete heading at docs/architect/component-boundary/repo-layout-vision.md#1-decision-summary (lines 38–38) into docs/platform/component-boundary.md#1-decision-summary (lines 1426–1426), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. Digest differences come only from the recorded candidate header/frontmatter fence, heading-level shift or physical relative-link rebasing; full before/after units and line mapping are in authoring accounting. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

````text
## 1. Decision Summary

Move the current single `herdr-plugin/` package shape toward:

```txt
apps/       thin binaries and entrypoints
packages/   reusable implementation libraries
```

For the Rust/web slice:

- split the current `herdr-fgos` binary into two binaries with names that match
  their default behavior: `apps/gateway` and `apps/herdr-tui`;
- move real gateway, MCP, cockpit, UI, fgos-port, and web-dashboard logic into
  `packages/*`;
- keep the web dashboard served by the gateway from an embedded static bundle;
- keep `apps/*` thin: each app wires packages together and starts one runtime.
````

### Full target shown text

````text
#### 1. Decision Summary

Move the current single `herdr-plugin/` package shape toward:

```txt
apps/       thin binaries and entrypoints
packages/   reusable implementation libraries
```

For the Rust/web slice:

- split the current `herdr-fgos` binary into two binaries with names that match
  their default behavior: `apps/gateway` and `apps/herdr-tui`;
- move real gateway, MCP, cockpit, UI, fgos-port, and web-dashboard logic into
  `packages/*`;
- keep the web dashboard served by the gateway from an embedded static bundle;
- keep `apps/*` thin: each app wires packages together and starts one runtime.
````

### Unified diff

```diff
--- docs/architect/component-boundary/repo-layout-vision.md#1-decision-summary
+++ docs/platform/component-boundary.md#1-decision-summary
@@ -1,4 +1,4 @@
-## 1. Decision Summary
+#### 1. Decision Summary
 
 Move the current single `herdr-plugin/` package shape toward:
 

```

## claim_94cc91ea2f2b02c9eca1cc623b0b1302

Source: `docs/architect/component-boundary/repo-layout-vision.md#unheaded-block-7`. Target: `docs/platform/component-boundary.md#unheaded-block-207`.

Mechanical class: Weak-exact. Source digest: `1c50e062e0b50fd9e2b4faa1e632491a3e3f21b307358f5ee4429689c5100263`. Target digest: `1c50e062e0b50fd9e2b4faa1e632491a3e3f21b307358f5ee4429689c5100263`.

Full shown source SHA256: `1c50e062e0b50fd9e2b4faa1e632491a3e3f21b307358f5ee4429689c5100263`. Full shown target SHA256: `1c50e062e0b50fd9e2b4faa1e632491a3e3f21b307358f5ee4429689c5100263`.

### Proposed decision

```json
{
  "claimId": "claim_94cc91ea2f2b02c9eca1cc623b0b1302",
  "sourceUnitDigest": "1c50e062e0b50fd9e2b4faa1e632491a3e3f21b307358f5ee4429689c5100263",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-207",
  "targetUnitDigest": "1c50e062e0b50fd9e2b4faa1e632491a3e3f21b307358f5ee4429689c5100263",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: repo-layout-vision source carriage",
    "Repo Layout Vision: Apps And Packages",
    "1. Decision Summary"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/repo-layout-vision.md#unheaded-block-7 (lines 40–40) into docs/platform/component-boundary.md#unheaded-block-207 (lines 1428–1428), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
Move the current single `herdr-plugin/` package shape toward:
```

### Full target shown text

```text
Move the current single `herdr-plugin/` package shape toward:
```

### Unified diff

```diff
No text difference.
```

## claim_faf7499a8768d5ba04d5c11622e1135d

Source: `docs/architect/component-boundary/repo-layout-vision.md#unheaded-block-8`. Target: `docs/platform/component-boundary.md#unheaded-block-208`.

Mechanical class: Weak-exact. Source digest: `2a94dfe6bc6c219e71227aaec181d9075a2272a6d34b737527580773e6c699aa`. Target digest: `2a94dfe6bc6c219e71227aaec181d9075a2272a6d34b737527580773e6c699aa`.

Full shown source SHA256: `2a94dfe6bc6c219e71227aaec181d9075a2272a6d34b737527580773e6c699aa`. Full shown target SHA256: `2a94dfe6bc6c219e71227aaec181d9075a2272a6d34b737527580773e6c699aa`.

### Proposed decision

```json
{
  "claimId": "claim_faf7499a8768d5ba04d5c11622e1135d",
  "sourceUnitDigest": "2a94dfe6bc6c219e71227aaec181d9075a2272a6d34b737527580773e6c699aa",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-208",
  "targetUnitDigest": "2a94dfe6bc6c219e71227aaec181d9075a2272a6d34b737527580773e6c699aa",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: repo-layout-vision source carriage",
    "Repo Layout Vision: Apps And Packages",
    "1. Decision Summary"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/repo-layout-vision.md#unheaded-block-8 (lines 42–45) into docs/platform/component-boundary.md#unheaded-block-208 (lines 1430–1433), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

````text
```txt
apps/       thin binaries and entrypoints
packages/   reusable implementation libraries
```
````

### Full target shown text

````text
```txt
apps/       thin binaries and entrypoints
packages/   reusable implementation libraries
```
````

### Unified diff

```diff
No text difference.
```

## claim_5fee5ccc69ae71fc603ec44059ca4067

Source: `docs/architect/component-boundary/repo-layout-vision.md#unheaded-block-9`. Target: `docs/platform/component-boundary.md#unheaded-block-209`.

Mechanical class: Weak-exact. Source digest: `110aca8ef2bc06d3165a6c6160c82718f8fe33b3747fae0b1d4c0e7cec0d2e3e`. Target digest: `110aca8ef2bc06d3165a6c6160c82718f8fe33b3747fae0b1d4c0e7cec0d2e3e`.

Full shown source SHA256: `110aca8ef2bc06d3165a6c6160c82718f8fe33b3747fae0b1d4c0e7cec0d2e3e`. Full shown target SHA256: `110aca8ef2bc06d3165a6c6160c82718f8fe33b3747fae0b1d4c0e7cec0d2e3e`.

### Proposed decision

```json
{
  "claimId": "claim_5fee5ccc69ae71fc603ec44059ca4067",
  "sourceUnitDigest": "110aca8ef2bc06d3165a6c6160c82718f8fe33b3747fae0b1d4c0e7cec0d2e3e",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-209",
  "targetUnitDigest": "110aca8ef2bc06d3165a6c6160c82718f8fe33b3747fae0b1d4c0e7cec0d2e3e",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: repo-layout-vision source carriage",
    "Repo Layout Vision: Apps And Packages",
    "1. Decision Summary"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ; source unit shorter than 40 characters. Carry the complete unheaded-block at docs/architect/component-boundary/repo-layout-vision.md#unheaded-block-9 (lines 47–47) into docs/platform/component-boundary.md#unheaded-block-209 (lines 1435–1435), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
For the Rust/web slice:
```

### Full target shown text

```text
For the Rust/web slice:
```

### Unified diff

```diff
No text difference.
```

## claim_f9ba63ae692d7ad05f5b47fd625d0e43

Source: `docs/architect/component-boundary/repo-layout-vision.md#unheaded-block-10`. Target: `docs/platform/component-boundary.md#unheaded-block-210`.

Mechanical class: Weak-exact. Source digest: `7d16b3e1eb57c7234ee1436eeda0468502d45d1c40c18b1e9402a42e01b86fec`. Target digest: `7d16b3e1eb57c7234ee1436eeda0468502d45d1c40c18b1e9402a42e01b86fec`.

Full shown source SHA256: `7d16b3e1eb57c7234ee1436eeda0468502d45d1c40c18b1e9402a42e01b86fec`. Full shown target SHA256: `7d16b3e1eb57c7234ee1436eeda0468502d45d1c40c18b1e9402a42e01b86fec`.

### Proposed decision

```json
{
  "claimId": "claim_f9ba63ae692d7ad05f5b47fd625d0e43",
  "sourceUnitDigest": "7d16b3e1eb57c7234ee1436eeda0468502d45d1c40c18b1e9402a42e01b86fec",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-210",
  "targetUnitDigest": "7d16b3e1eb57c7234ee1436eeda0468502d45d1c40c18b1e9402a42e01b86fec",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: repo-layout-vision source carriage",
    "Repo Layout Vision: Apps And Packages",
    "1. Decision Summary"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/repo-layout-vision.md#unheaded-block-10 (lines 49–54) into docs/platform/component-boundary.md#unheaded-block-210 (lines 1437–1442), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
- split the current `herdr-fgos` binary into two binaries with names that match
  their default behavior: `apps/gateway` and `apps/herdr-tui`;
- move real gateway, MCP, cockpit, UI, fgos-port, and web-dashboard logic into
  `packages/*`;
- keep the web dashboard served by the gateway from an embedded static bundle;
- keep `apps/*` thin: each app wires packages together and starts one runtime.
```

### Full target shown text

```text
- split the current `herdr-fgos` binary into two binaries with names that match
  their default behavior: `apps/gateway` and `apps/herdr-tui`;
- move real gateway, MCP, cockpit, UI, fgos-port, and web-dashboard logic into
  `packages/*`;
- keep the web dashboard served by the gateway from an embedded static bundle;
- keep `apps/*` thin: each app wires packages together and starts one runtime.
```

### Unified diff

```diff
No text difference.
```

## claim_32d9111a44a0fd47c5931d9ae4326c98

Source: `docs/architect/component-boundary/repo-layout-vision.md#2-current-problem`. Target: `docs/platform/component-boundary.md#2-current-problem`.

Mechanical class: Judgment. Source digest: `cdb0bbd3849bad15bbf412f9dd2506796401fe7a0329325aa3e1629616402003`. Target digest: `bc360894cd27a141912d8562ce17cbe42bf6ab720f68936dacbcb8db0ebf5147`.

Full shown source SHA256: `42a669354c9dc896cd96a3f50a02a0b22380bde920d6130702ae342d32e5e229`. Full shown target SHA256: `65ec54e7603213874a523e42ecd65dffb9c1043d6f79b3edfddbe2d5a79c5533`.

### Proposed decision

```json
{
  "claimId": "claim_32d9111a44a0fd47c5931d9ae4326c98",
  "sourceUnitDigest": "cdb0bbd3849bad15bbf412f9dd2506796401fe7a0329325aa3e1629616402003",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "2-current-problem",
  "targetUnitDigest": "bc360894cd27a141912d8562ce17cbe42bf6ab720f68936dacbcb8db0ebf5147",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: repo-layout-vision source carriage",
    "Repo Layout Vision: Apps And Packages"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Judgment: no target digest match. Carry the complete heading at docs/architect/component-boundary/repo-layout-vision.md#2-current-problem (lines 56–56) into docs/platform/component-boundary.md#2-current-problem (lines 1444–1444), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. Digest differences come only from the recorded candidate header/frontmatter fence, heading-level shift or physical relative-link rebasing; full before/after units and line mapping are in authoring accounting. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

````text
## 2. Current Problem

`herdr-plugin/` is currently one Cargo package named `herdr-fgos`, with one
lib/bin shape serving two launch modes:

- no argument: TUI mode;
- `gateway` argument: daemon REST/MCP/web mode.

The current launch path confirms the mismatch:

```txt
src/runner/gateway-control.mjs:295
spawn(binaryPath, ['gateway'])
```

The binary name does not describe its default behavior, and gateway mode is a
separate launch path hidden behind an argument.

The code already has a cleaner hexagonal boundary than the folder layout shows:

- `ports.rs` defines the important ports: `WorkItemSource`, `PaneRegistry`,
  `PaneOrchestrator`, `VerbGateway`, and `TerminalUi`;
- `gateway.rs` and `mcp.rs` depend on `VerbGateway`, not on TUI internals;
- gateway logic is already separate from `app.rs`, `ui.rs`, `layout.rs`,
  `pane_scan.rs`, and `pick.rs`;
- the gateway already hosts static web assets through `rust_embed`.

The layout should make those existing boundaries visible.
````

### Full target shown text

````text
#### 2. Current Problem

`herdr-plugin/` is currently one Cargo package named `herdr-fgos`, with one
lib/bin shape serving two launch modes:

- no argument: TUI mode;
- `gateway` argument: daemon REST/MCP/web mode.

The current launch path confirms the mismatch:

```txt
src/runner/gateway-control.mjs:295
spawn(binaryPath, ['gateway'])
```

The binary name does not describe its default behavior, and gateway mode is a
separate launch path hidden behind an argument.

The code already has a cleaner hexagonal boundary than the folder layout shows:

- `ports.rs` defines the important ports: `WorkItemSource`, `PaneRegistry`,
  `PaneOrchestrator`, `VerbGateway`, and `TerminalUi`;
- `gateway.rs` and `mcp.rs` depend on `VerbGateway`, not on TUI internals;
- gateway logic is already separate from `app.rs`, `ui.rs`, `layout.rs`,
  `pane_scan.rs`, and `pick.rs`;
- the gateway already hosts static web assets through `rust_embed`.

The layout should make those existing boundaries visible.
````

### Unified diff

```diff
--- docs/architect/component-boundary/repo-layout-vision.md#2-current-problem
+++ docs/platform/component-boundary.md#2-current-problem
@@ -1,4 +1,4 @@
-## 2. Current Problem
+#### 2. Current Problem
 
 `herdr-plugin/` is currently one Cargo package named `herdr-fgos`, with one
 lib/bin shape serving two launch modes:

```

## claim_d968b79a52ef75611ff0afa4997f50f3

Source: `docs/architect/component-boundary/repo-layout-vision.md#unheaded-block-11`. Target: `docs/platform/component-boundary.md#unheaded-block-211`.

Mechanical class: Weak-exact. Source digest: `370df883ebebddbc35d23080820f3f07198ea9f2dee98bf3173c459f4b98fabf`. Target digest: `370df883ebebddbc35d23080820f3f07198ea9f2dee98bf3173c459f4b98fabf`.

Full shown source SHA256: `370df883ebebddbc35d23080820f3f07198ea9f2dee98bf3173c459f4b98fabf`. Full shown target SHA256: `370df883ebebddbc35d23080820f3f07198ea9f2dee98bf3173c459f4b98fabf`.

### Proposed decision

```json
{
  "claimId": "claim_d968b79a52ef75611ff0afa4997f50f3",
  "sourceUnitDigest": "370df883ebebddbc35d23080820f3f07198ea9f2dee98bf3173c459f4b98fabf",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-211",
  "targetUnitDigest": "370df883ebebddbc35d23080820f3f07198ea9f2dee98bf3173c459f4b98fabf",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: repo-layout-vision source carriage",
    "Repo Layout Vision: Apps And Packages",
    "2. Current Problem"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/repo-layout-vision.md#unheaded-block-11 (lines 58–59) into docs/platform/component-boundary.md#unheaded-block-211 (lines 1446–1447), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
`herdr-plugin/` is currently one Cargo package named `herdr-fgos`, with one
lib/bin shape serving two launch modes:
```

### Full target shown text

```text
`herdr-plugin/` is currently one Cargo package named `herdr-fgos`, with one
lib/bin shape serving two launch modes:
```

### Unified diff

```diff
No text difference.
```

## claim_54f002818e588b68efc65ede2d233b91

Source: `docs/architect/component-boundary/repo-layout-vision.md#unheaded-block-12`. Target: `docs/platform/component-boundary.md#unheaded-block-212`.

Mechanical class: Weak-exact. Source digest: `b1f621d5560adb5ba02c2b9c1355850e2494ad27e2786f7300062a7c1d8b897c`. Target digest: `b1f621d5560adb5ba02c2b9c1355850e2494ad27e2786f7300062a7c1d8b897c`.

Full shown source SHA256: `b1f621d5560adb5ba02c2b9c1355850e2494ad27e2786f7300062a7c1d8b897c`. Full shown target SHA256: `b1f621d5560adb5ba02c2b9c1355850e2494ad27e2786f7300062a7c1d8b897c`.

### Proposed decision

```json
{
  "claimId": "claim_54f002818e588b68efc65ede2d233b91",
  "sourceUnitDigest": "b1f621d5560adb5ba02c2b9c1355850e2494ad27e2786f7300062a7c1d8b897c",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-212",
  "targetUnitDigest": "b1f621d5560adb5ba02c2b9c1355850e2494ad27e2786f7300062a7c1d8b897c",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: repo-layout-vision source carriage",
    "Repo Layout Vision: Apps And Packages",
    "2. Current Problem"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/repo-layout-vision.md#unheaded-block-12 (lines 61–62) into docs/platform/component-boundary.md#unheaded-block-212 (lines 1449–1450), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
- no argument: TUI mode;
- `gateway` argument: daemon REST/MCP/web mode.
```

### Full target shown text

```text
- no argument: TUI mode;
- `gateway` argument: daemon REST/MCP/web mode.
```

### Unified diff

```diff
No text difference.
```

## claim_d2b96b98e8fd3c05fc34619c04219896

Source: `docs/architect/component-boundary/repo-layout-vision.md#unheaded-block-13`. Target: `docs/platform/component-boundary.md#unheaded-block-213`.

Mechanical class: Weak-exact. Source digest: `8cc995792a8672b26745e42a76b644eb99237b92d9ac009f5bbb7fcc33e34770`. Target digest: `8cc995792a8672b26745e42a76b644eb99237b92d9ac009f5bbb7fcc33e34770`.

Full shown source SHA256: `8cc995792a8672b26745e42a76b644eb99237b92d9ac009f5bbb7fcc33e34770`. Full shown target SHA256: `8cc995792a8672b26745e42a76b644eb99237b92d9ac009f5bbb7fcc33e34770`.

### Proposed decision

```json
{
  "claimId": "claim_d2b96b98e8fd3c05fc34619c04219896",
  "sourceUnitDigest": "8cc995792a8672b26745e42a76b644eb99237b92d9ac009f5bbb7fcc33e34770",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-213",
  "targetUnitDigest": "8cc995792a8672b26745e42a76b644eb99237b92d9ac009f5bbb7fcc33e34770",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: repo-layout-vision source carriage",
    "Repo Layout Vision: Apps And Packages",
    "2. Current Problem"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/repo-layout-vision.md#unheaded-block-13 (lines 64–64) into docs/platform/component-boundary.md#unheaded-block-213 (lines 1452–1452), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
The current launch path confirms the mismatch:
```

### Full target shown text

```text
The current launch path confirms the mismatch:
```

### Unified diff

```diff
No text difference.
```

## claim_a67e4cba70e6a0baab3442b5205dc118

Source: `docs/architect/component-boundary/repo-layout-vision.md#unheaded-block-14`. Target: `docs/platform/component-boundary.md#unheaded-block-214`.

Mechanical class: Weak-exact. Source digest: `a3d94e83661afa63afd65a66a575c2e632928331239d2b30d3a5fb7b9b32a056`. Target digest: `a3d94e83661afa63afd65a66a575c2e632928331239d2b30d3a5fb7b9b32a056`.

Full shown source SHA256: `a3d94e83661afa63afd65a66a575c2e632928331239d2b30d3a5fb7b9b32a056`. Full shown target SHA256: `a3d94e83661afa63afd65a66a575c2e632928331239d2b30d3a5fb7b9b32a056`.

### Proposed decision

```json
{
  "claimId": "claim_a67e4cba70e6a0baab3442b5205dc118",
  "sourceUnitDigest": "a3d94e83661afa63afd65a66a575c2e632928331239d2b30d3a5fb7b9b32a056",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-214",
  "targetUnitDigest": "a3d94e83661afa63afd65a66a575c2e632928331239d2b30d3a5fb7b9b32a056",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: repo-layout-vision source carriage",
    "Repo Layout Vision: Apps And Packages",
    "2. Current Problem"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/repo-layout-vision.md#unheaded-block-14 (lines 66–69) into docs/platform/component-boundary.md#unheaded-block-214 (lines 1454–1457), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

````text
```txt
src/runner/gateway-control.mjs:295
spawn(binaryPath, ['gateway'])
```
````

### Full target shown text

````text
```txt
src/runner/gateway-control.mjs:295
spawn(binaryPath, ['gateway'])
```
````

### Unified diff

```diff
No text difference.
```

## claim_8540009f9b169bae2a7479d6a0df8503

Source: `docs/architect/component-boundary/repo-layout-vision.md#unheaded-block-15`. Target: `docs/platform/component-boundary.md#unheaded-block-215`.

Mechanical class: Weak-exact. Source digest: `c182bc86d202b328850d6109efdaed9852ca667a3a0d9e1b87f38c25da3b08d0`. Target digest: `c182bc86d202b328850d6109efdaed9852ca667a3a0d9e1b87f38c25da3b08d0`.

Full shown source SHA256: `c182bc86d202b328850d6109efdaed9852ca667a3a0d9e1b87f38c25da3b08d0`. Full shown target SHA256: `c182bc86d202b328850d6109efdaed9852ca667a3a0d9e1b87f38c25da3b08d0`.

### Proposed decision

```json
{
  "claimId": "claim_8540009f9b169bae2a7479d6a0df8503",
  "sourceUnitDigest": "c182bc86d202b328850d6109efdaed9852ca667a3a0d9e1b87f38c25da3b08d0",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-215",
  "targetUnitDigest": "c182bc86d202b328850d6109efdaed9852ca667a3a0d9e1b87f38c25da3b08d0",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: repo-layout-vision source carriage",
    "Repo Layout Vision: Apps And Packages",
    "2. Current Problem"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/repo-layout-vision.md#unheaded-block-15 (lines 71–72) into docs/platform/component-boundary.md#unheaded-block-215 (lines 1459–1460), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
The binary name does not describe its default behavior, and gateway mode is a
separate launch path hidden behind an argument.
```

### Full target shown text

```text
The binary name does not describe its default behavior, and gateway mode is a
separate launch path hidden behind an argument.
```

### Unified diff

```diff
No text difference.
```

## claim_e9755d7eb7e99534c6b8e70256c62363

Source: `docs/architect/component-boundary/repo-layout-vision.md#unheaded-block-16`. Target: `docs/platform/component-boundary.md#unheaded-block-216`.

Mechanical class: Weak-exact. Source digest: `3742ccdedf3369a182231a7b3ecfa690e8653af1e406880b03cf450a8f23b85c`. Target digest: `3742ccdedf3369a182231a7b3ecfa690e8653af1e406880b03cf450a8f23b85c`.

Full shown source SHA256: `3742ccdedf3369a182231a7b3ecfa690e8653af1e406880b03cf450a8f23b85c`. Full shown target SHA256: `3742ccdedf3369a182231a7b3ecfa690e8653af1e406880b03cf450a8f23b85c`.

### Proposed decision

```json
{
  "claimId": "claim_e9755d7eb7e99534c6b8e70256c62363",
  "sourceUnitDigest": "3742ccdedf3369a182231a7b3ecfa690e8653af1e406880b03cf450a8f23b85c",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-216",
  "targetUnitDigest": "3742ccdedf3369a182231a7b3ecfa690e8653af1e406880b03cf450a8f23b85c",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: repo-layout-vision source carriage",
    "Repo Layout Vision: Apps And Packages",
    "2. Current Problem"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/repo-layout-vision.md#unheaded-block-16 (lines 74–74) into docs/platform/component-boundary.md#unheaded-block-216 (lines 1462–1462), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
The code already has a cleaner hexagonal boundary than the folder layout shows:
```

### Full target shown text

```text
The code already has a cleaner hexagonal boundary than the folder layout shows:
```

### Unified diff

```diff
No text difference.
```

## claim_6193ca38574bdc9531791a9cb9f131c3

Source: `docs/architect/component-boundary/repo-layout-vision.md#unheaded-block-17`. Target: `docs/platform/component-boundary.md#unheaded-block-217`.

Mechanical class: Weak-exact. Source digest: `12dc977646fc08fc8da23c4345453098e3c8fd47bbd9da32cba47f23a60a566a`. Target digest: `12dc977646fc08fc8da23c4345453098e3c8fd47bbd9da32cba47f23a60a566a`.

Full shown source SHA256: `12dc977646fc08fc8da23c4345453098e3c8fd47bbd9da32cba47f23a60a566a`. Full shown target SHA256: `12dc977646fc08fc8da23c4345453098e3c8fd47bbd9da32cba47f23a60a566a`.

### Proposed decision

```json
{
  "claimId": "claim_6193ca38574bdc9531791a9cb9f131c3",
  "sourceUnitDigest": "12dc977646fc08fc8da23c4345453098e3c8fd47bbd9da32cba47f23a60a566a",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-217",
  "targetUnitDigest": "12dc977646fc08fc8da23c4345453098e3c8fd47bbd9da32cba47f23a60a566a",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: repo-layout-vision source carriage",
    "Repo Layout Vision: Apps And Packages",
    "2. Current Problem"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/repo-layout-vision.md#unheaded-block-17 (lines 76–81) into docs/platform/component-boundary.md#unheaded-block-217 (lines 1464–1469), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
- `ports.rs` defines the important ports: `WorkItemSource`, `PaneRegistry`,
  `PaneOrchestrator`, `VerbGateway`, and `TerminalUi`;
- `gateway.rs` and `mcp.rs` depend on `VerbGateway`, not on TUI internals;
- gateway logic is already separate from `app.rs`, `ui.rs`, `layout.rs`,
  `pane_scan.rs`, and `pick.rs`;
- the gateway already hosts static web assets through `rust_embed`.
```

### Full target shown text

```text
- `ports.rs` defines the important ports: `WorkItemSource`, `PaneRegistry`,
  `PaneOrchestrator`, `VerbGateway`, and `TerminalUi`;
- `gateway.rs` and `mcp.rs` depend on `VerbGateway`, not on TUI internals;
- gateway logic is already separate from `app.rs`, `ui.rs`, `layout.rs`,
  `pane_scan.rs`, and `pick.rs`;
- the gateway already hosts static web assets through `rust_embed`.
```

### Unified diff

```diff
No text difference.
```

## claim_a1f9409d7da8f9c4659a3a76290e20e8

Source: `docs/architect/component-boundary/repo-layout-vision.md#unheaded-block-18`. Target: `docs/platform/component-boundary.md#unheaded-block-218`.

Mechanical class: Weak-exact. Source digest: `9992f4d1b811138d7622e7f4173ee9a9c669db9817f3aec314bb800140397155`. Target digest: `9992f4d1b811138d7622e7f4173ee9a9c669db9817f3aec314bb800140397155`.

Full shown source SHA256: `9992f4d1b811138d7622e7f4173ee9a9c669db9817f3aec314bb800140397155`. Full shown target SHA256: `9992f4d1b811138d7622e7f4173ee9a9c669db9817f3aec314bb800140397155`.

### Proposed decision

```json
{
  "claimId": "claim_a1f9409d7da8f9c4659a3a76290e20e8",
  "sourceUnitDigest": "9992f4d1b811138d7622e7f4173ee9a9c669db9817f3aec314bb800140397155",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-218",
  "targetUnitDigest": "9992f4d1b811138d7622e7f4173ee9a9c669db9817f3aec314bb800140397155",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: repo-layout-vision source carriage",
    "Repo Layout Vision: Apps And Packages",
    "2. Current Problem"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/repo-layout-vision.md#unheaded-block-18 (lines 83–83) into docs/platform/component-boundary.md#unheaded-block-218 (lines 1471–1471), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
The layout should make those existing boundaries visible.
```

### Full target shown text

```text
The layout should make those existing boundaries visible.
```

### Unified diff

```diff
No text difference.
```

## claim_41897bb097a7f5cd419fb5befcb4e8a5

Source: `docs/architect/component-boundary/repo-layout-vision.md#3-target-layout`. Target: `docs/platform/component-boundary.md#3-target-layout`.

Mechanical class: Judgment. Source digest: `17dc4fbab2703f0e66664f12168e94e6961da2281ff7388d460134a2ea67c098`. Target digest: `96cc06391467cdc93adf6c14382a18fa3451e09fe96755ab605a28eb5e5d22c3`.

Full shown source SHA256: `3b788a9949b540d9e1d98fd817a954c7afb4f82a975ec774ccba763ba9adffe4`. Full shown target SHA256: `2cc3085cfab44d4926876fbe8374aaf40b6a98ab5e244c5be402394228f6b5da`.

### Proposed decision

```json
{
  "claimId": "claim_41897bb097a7f5cd419fb5befcb4e8a5",
  "sourceUnitDigest": "17dc4fbab2703f0e66664f12168e94e6961da2281ff7388d460134a2ea67c098",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "3-target-layout",
  "targetUnitDigest": "96cc06391467cdc93adf6c14382a18fa3451e09fe96755ab605a28eb5e5d22c3",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: repo-layout-vision source carriage",
    "Repo Layout Vision: Apps And Packages"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Judgment: no target digest match. Carry the complete heading at docs/architect/component-boundary/repo-layout-vision.md#3-target-layout (lines 85–85) into docs/platform/component-boundary.md#3-target-layout (lines 1473–1473), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. Digest differences come only from the recorded candidate header/frontmatter fence, heading-level shift or physical relative-link rebasing; full before/after units and line mapping are in authoring accounting. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

````text
## 3. Target Layout

Scope of this target tree: Rust plus web only. Node packages are not decided in
this document.

```txt
forgentX/
  Cargo.toml
    # workspace members:
    # - apps/gateway
    # - apps/herdr-tui
    # - packages/gateway
    # - packages/mcp
    # - packages/herdr-core
    # - packages/herdr-ui
    # - packages/fgos-ports

  apps/
    gateway/
      Cargo.toml
      build.rs
      src/main.rs
      static/

    herdr-tui/
      Cargo.toml
      src/main.rs

  packages/
    gateway/
    mcp/
    herdr-core/
    herdr-ui/
    fgos-ports/
    web-dashboard/
```
````

### Full target shown text

````text
#### 3. Target Layout

Scope of this target tree: Rust plus web only. Node packages are not decided in
this document.

```txt
forgentX/
  Cargo.toml
    # workspace members:
    # - apps/gateway
    # - apps/herdr-tui
    # - packages/gateway
    # - packages/mcp
    # - packages/herdr-core
    # - packages/herdr-ui
    # - packages/fgos-ports

  apps/
    gateway/
      Cargo.toml
      build.rs
      src/main.rs
      static/

    herdr-tui/
      Cargo.toml
      src/main.rs

  packages/
    gateway/
    mcp/
    herdr-core/
    herdr-ui/
    fgos-ports/
    web-dashboard/
```
````

### Unified diff

```diff
--- docs/architect/component-boundary/repo-layout-vision.md#3-target-layout
+++ docs/platform/component-boundary.md#3-target-layout
@@ -1,4 +1,4 @@
-## 3. Target Layout
+#### 3. Target Layout
 
 Scope of this target tree: Rust plus web only. Node packages are not decided in
 this document.

```

## claim_e379da0cbbb2c52753b4ea5794017642

Source: `docs/architect/component-boundary/repo-layout-vision.md#unheaded-block-19`. Target: `docs/platform/component-boundary.md#unheaded-block-219`.

Mechanical class: Weak-exact. Source digest: `670c6c9b5d62550e0bb6719db175e6a6d7d6a9fe97d39545e77856ecc9ea5d8d`. Target digest: `670c6c9b5d62550e0bb6719db175e6a6d7d6a9fe97d39545e77856ecc9ea5d8d`.

Full shown source SHA256: `670c6c9b5d62550e0bb6719db175e6a6d7d6a9fe97d39545e77856ecc9ea5d8d`. Full shown target SHA256: `670c6c9b5d62550e0bb6719db175e6a6d7d6a9fe97d39545e77856ecc9ea5d8d`.

### Proposed decision

```json
{
  "claimId": "claim_e379da0cbbb2c52753b4ea5794017642",
  "sourceUnitDigest": "670c6c9b5d62550e0bb6719db175e6a6d7d6a9fe97d39545e77856ecc9ea5d8d",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-219",
  "targetUnitDigest": "670c6c9b5d62550e0bb6719db175e6a6d7d6a9fe97d39545e77856ecc9ea5d8d",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: repo-layout-vision source carriage",
    "Repo Layout Vision: Apps And Packages",
    "3. Target Layout"
  ],
  "claimKind": "decision",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/repo-layout-vision.md#unheaded-block-19 (lines 87–88) into docs/platform/component-boundary.md#unheaded-block-219 (lines 1475–1476), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
Scope of this target tree: Rust plus web only. Node packages are not decided in
this document.
```

### Full target shown text

```text
Scope of this target tree: Rust plus web only. Node packages are not decided in
this document.
```

### Unified diff

```diff
No text difference.
```

## claim_490edb0bb16303a28ae78b7658124196

Source: `docs/architect/component-boundary/repo-layout-vision.md#unheaded-block-20`. Target: `docs/platform/component-boundary.md#unheaded-block-220`.

Mechanical class: Weak-exact. Source digest: `4b78c198e7f7243313a2a2830f4c5b27c4865e21f8f9247147ceba2c405bc050`. Target digest: `4b78c198e7f7243313a2a2830f4c5b27c4865e21f8f9247147ceba2c405bc050`.

Full shown source SHA256: `4b78c198e7f7243313a2a2830f4c5b27c4865e21f8f9247147ceba2c405bc050`. Full shown target SHA256: `4b78c198e7f7243313a2a2830f4c5b27c4865e21f8f9247147ceba2c405bc050`.

### Proposed decision

```json
{
  "claimId": "claim_490edb0bb16303a28ae78b7658124196",
  "sourceUnitDigest": "4b78c198e7f7243313a2a2830f4c5b27c4865e21f8f9247147ceba2c405bc050",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-220",
  "targetUnitDigest": "4b78c198e7f7243313a2a2830f4c5b27c4865e21f8f9247147ceba2c405bc050",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: repo-layout-vision source carriage",
    "Repo Layout Vision: Apps And Packages",
    "3. Target Layout"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/repo-layout-vision.md#unheaded-block-20 (lines 90–120) into docs/platform/component-boundary.md#unheaded-block-220 (lines 1478–1508), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

````text
```txt
forgentX/
  Cargo.toml
    # workspace members:
    # - apps/gateway
    # - apps/herdr-tui
    # - packages/gateway
    # - packages/mcp
    # - packages/herdr-core
    # - packages/herdr-ui
    # - packages/fgos-ports

  apps/
    gateway/
      Cargo.toml
      build.rs
      src/main.rs
      static/

    herdr-tui/
      Cargo.toml
      src/main.rs

  packages/
    gateway/
    mcp/
    herdr-core/
    herdr-ui/
    fgos-ports/
    web-dashboard/
```
````

### Full target shown text

````text
```txt
forgentX/
  Cargo.toml
    # workspace members:
    # - apps/gateway
    # - apps/herdr-tui
    # - packages/gateway
    # - packages/mcp
    # - packages/herdr-core
    # - packages/herdr-ui
    # - packages/fgos-ports

  apps/
    gateway/
      Cargo.toml
      build.rs
      src/main.rs
      static/

    herdr-tui/
      Cargo.toml
      src/main.rs

  packages/
    gateway/
    mcp/
    herdr-core/
    herdr-ui/
    fgos-ports/
    web-dashboard/
```
````

### Unified diff

```diff
No text difference.
```

## claim_42567e9be1c7ee274c16626c6128ca5e

Source: `docs/architect/component-boundary/repo-layout-vision.md#4-app-boundaries`. Target: `docs/platform/component-boundary.md#4-app-boundaries`.

Mechanical class: Judgment. Source digest: `570d3bd3a7ac5edc854b67f667d911c2016f2ad1c4b7e3f3b0ac930da1d5b1ab`. Target digest: `538977e9fd4f0b4076a80bc96be36016df0b324b940e9c441c2f61d65ec2779b`.

Full shown source SHA256: `973357dc44198c8b24014860a8bdf16b2b0bda69e90c2c2d13c71cebd216a375`. Full shown target SHA256: `3ae0fb6e2a0ad9dea853a9b2909f702e09f1fb54aa5f384c396e1c31831365a4`.

### Proposed decision

```json
{
  "claimId": "claim_42567e9be1c7ee274c16626c6128ca5e",
  "sourceUnitDigest": "570d3bd3a7ac5edc854b67f667d911c2016f2ad1c4b7e3f3b0ac930da1d5b1ab",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "4-app-boundaries",
  "targetUnitDigest": "538977e9fd4f0b4076a80bc96be36016df0b324b940e9c441c2f61d65ec2779b",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: repo-layout-vision source carriage",
    "Repo Layout Vision: Apps And Packages"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Judgment: no target digest match. Carry the complete heading at docs/architect/component-boundary/repo-layout-vision.md#4-app-boundaries (lines 122–122) into docs/platform/component-boundary.md#4-app-boundaries (lines 1510–1510), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. Digest differences come only from the recorded candidate header/frontmatter fence, heading-level shift or physical relative-link rebasing; full before/after units and line mapping are in authoring accounting. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
## 4. App Boundaries

`apps/gateway` is a thin binary:

- wires `packages/gateway` and `packages/mcp`;
- starts the Axum server;
- serves embedded static files from `static/`;
- runs as gateway by default, without a `gateway` argument.

`apps/herdr-tui` is a thin binary:

- wires `packages/herdr-core` and `packages/herdr-ui`;
- starts the terminal dashboard loop;
- runs as TUI by default.

App packages should not own reusable domain logic. They assemble ports,
adapters, config, and runtime startup.
```

### Full target shown text

```text
#### 4. App Boundaries

`apps/gateway` is a thin binary:

- wires `packages/gateway` and `packages/mcp`;
- starts the Axum server;
- serves embedded static files from `static/`;
- runs as gateway by default, without a `gateway` argument.

`apps/herdr-tui` is a thin binary:

- wires `packages/herdr-core` and `packages/herdr-ui`;
- starts the terminal dashboard loop;
- runs as TUI by default.

App packages should not own reusable domain logic. They assemble ports,
adapters, config, and runtime startup.
```

### Unified diff

```diff
--- docs/architect/component-boundary/repo-layout-vision.md#4-app-boundaries
+++ docs/platform/component-boundary.md#4-app-boundaries
@@ -1,4 +1,4 @@
-## 4. App Boundaries
+#### 4. App Boundaries
 
 `apps/gateway` is a thin binary:
 

```

## claim_6841615370614de9df635e353a9d05a8

Source: `docs/architect/component-boundary/repo-layout-vision.md#unheaded-block-21`. Target: `docs/platform/component-boundary.md#unheaded-block-221`.

Mechanical class: Weak-exact. Source digest: `a62e1cfc75a3111fc758e51e9a5c1ca33678555f08555419f8d80890c3691978`. Target digest: `a62e1cfc75a3111fc758e51e9a5c1ca33678555f08555419f8d80890c3691978`.

Full shown source SHA256: `a62e1cfc75a3111fc758e51e9a5c1ca33678555f08555419f8d80890c3691978`. Full shown target SHA256: `a62e1cfc75a3111fc758e51e9a5c1ca33678555f08555419f8d80890c3691978`.

### Proposed decision

```json
{
  "claimId": "claim_6841615370614de9df635e353a9d05a8",
  "sourceUnitDigest": "a62e1cfc75a3111fc758e51e9a5c1ca33678555f08555419f8d80890c3691978",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-221",
  "targetUnitDigest": "a62e1cfc75a3111fc758e51e9a5c1ca33678555f08555419f8d80890c3691978",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: repo-layout-vision source carriage",
    "Repo Layout Vision: Apps And Packages",
    "4. App Boundaries"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ; source unit shorter than 40 characters. Carry the complete unheaded-block at docs/architect/component-boundary/repo-layout-vision.md#unheaded-block-21 (lines 124–124) into docs/platform/component-boundary.md#unheaded-block-221 (lines 1512–1512), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
`apps/gateway` is a thin binary:
```

### Full target shown text

```text
`apps/gateway` is a thin binary:
```

### Unified diff

```diff
No text difference.
```

## claim_7b1ad6dd0d0ea052141e8ff5b6a43441

Source: `docs/architect/component-boundary/repo-layout-vision.md#unheaded-block-22`. Target: `docs/platform/component-boundary.md#unheaded-block-222`.

Mechanical class: Weak-exact. Source digest: `f7ee6f36c7e676e7a98d89f4afacb279e235ac133f77337806bd75a8b21dbcac`. Target digest: `f7ee6f36c7e676e7a98d89f4afacb279e235ac133f77337806bd75a8b21dbcac`.

Full shown source SHA256: `f7ee6f36c7e676e7a98d89f4afacb279e235ac133f77337806bd75a8b21dbcac`. Full shown target SHA256: `f7ee6f36c7e676e7a98d89f4afacb279e235ac133f77337806bd75a8b21dbcac`.

### Proposed decision

```json
{
  "claimId": "claim_7b1ad6dd0d0ea052141e8ff5b6a43441",
  "sourceUnitDigest": "f7ee6f36c7e676e7a98d89f4afacb279e235ac133f77337806bd75a8b21dbcac",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-222",
  "targetUnitDigest": "f7ee6f36c7e676e7a98d89f4afacb279e235ac133f77337806bd75a8b21dbcac",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: repo-layout-vision source carriage",
    "Repo Layout Vision: Apps And Packages",
    "4. App Boundaries"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/repo-layout-vision.md#unheaded-block-22 (lines 126–129) into docs/platform/component-boundary.md#unheaded-block-222 (lines 1514–1517), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
- wires `packages/gateway` and `packages/mcp`;
- starts the Axum server;
- serves embedded static files from `static/`;
- runs as gateway by default, without a `gateway` argument.
```

### Full target shown text

```text
- wires `packages/gateway` and `packages/mcp`;
- starts the Axum server;
- serves embedded static files from `static/`;
- runs as gateway by default, without a `gateway` argument.
```

### Unified diff

```diff
No text difference.
```

## claim_d06496eebad534228dbfb44cdd575a6d

Source: `docs/architect/component-boundary/repo-layout-vision.md#unheaded-block-23`. Target: `docs/platform/component-boundary.md#unheaded-block-223`.

Mechanical class: Weak-exact. Source digest: `72aaced762de8aead8c986d440d9b7cbc326de3f99ef4d6cfb97aed779870a33`. Target digest: `72aaced762de8aead8c986d440d9b7cbc326de3f99ef4d6cfb97aed779870a33`.

Full shown source SHA256: `72aaced762de8aead8c986d440d9b7cbc326de3f99ef4d6cfb97aed779870a33`. Full shown target SHA256: `72aaced762de8aead8c986d440d9b7cbc326de3f99ef4d6cfb97aed779870a33`.

### Proposed decision

```json
{
  "claimId": "claim_d06496eebad534228dbfb44cdd575a6d",
  "sourceUnitDigest": "72aaced762de8aead8c986d440d9b7cbc326de3f99ef4d6cfb97aed779870a33",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-223",
  "targetUnitDigest": "72aaced762de8aead8c986d440d9b7cbc326de3f99ef4d6cfb97aed779870a33",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: repo-layout-vision source carriage",
    "Repo Layout Vision: Apps And Packages",
    "4. App Boundaries"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ; source unit shorter than 40 characters. Carry the complete unheaded-block at docs/architect/component-boundary/repo-layout-vision.md#unheaded-block-23 (lines 131–131) into docs/platform/component-boundary.md#unheaded-block-223 (lines 1519–1519), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
`apps/herdr-tui` is a thin binary:
```

### Full target shown text

```text
`apps/herdr-tui` is a thin binary:
```

### Unified diff

```diff
No text difference.
```

## claim_7b2e5d190d00b8bad516f9753546fed4

Source: `docs/architect/component-boundary/repo-layout-vision.md#unheaded-block-24`. Target: `docs/platform/component-boundary.md#unheaded-block-224`.

Mechanical class: Weak-exact. Source digest: `590d2502b5043f06cba0d2e5c772d85b47d14ada786b0a9c61ecb74d8a834b26`. Target digest: `590d2502b5043f06cba0d2e5c772d85b47d14ada786b0a9c61ecb74d8a834b26`.

Full shown source SHA256: `590d2502b5043f06cba0d2e5c772d85b47d14ada786b0a9c61ecb74d8a834b26`. Full shown target SHA256: `590d2502b5043f06cba0d2e5c772d85b47d14ada786b0a9c61ecb74d8a834b26`.

### Proposed decision

```json
{
  "claimId": "claim_7b2e5d190d00b8bad516f9753546fed4",
  "sourceUnitDigest": "590d2502b5043f06cba0d2e5c772d85b47d14ada786b0a9c61ecb74d8a834b26",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-224",
  "targetUnitDigest": "590d2502b5043f06cba0d2e5c772d85b47d14ada786b0a9c61ecb74d8a834b26",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: repo-layout-vision source carriage",
    "Repo Layout Vision: Apps And Packages",
    "4. App Boundaries"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/repo-layout-vision.md#unheaded-block-24 (lines 133–135) into docs/platform/component-boundary.md#unheaded-block-224 (lines 1521–1523), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
- wires `packages/herdr-core` and `packages/herdr-ui`;
- starts the terminal dashboard loop;
- runs as TUI by default.
```

### Full target shown text

```text
- wires `packages/herdr-core` and `packages/herdr-ui`;
- starts the terminal dashboard loop;
- runs as TUI by default.
```

### Unified diff

```diff
No text difference.
```

## claim_c90e11ad1b45be63d3a2473892178963

Source: `docs/architect/component-boundary/repo-layout-vision.md#unheaded-block-25`. Target: `docs/platform/component-boundary.md#unheaded-block-225`.

Mechanical class: Weak-exact. Source digest: `d7a19f7c33371b74b78a98a80f53e36438a7c431967ebb4608cdb50e2aba6582`. Target digest: `d7a19f7c33371b74b78a98a80f53e36438a7c431967ebb4608cdb50e2aba6582`.

Full shown source SHA256: `d7a19f7c33371b74b78a98a80f53e36438a7c431967ebb4608cdb50e2aba6582`. Full shown target SHA256: `d7a19f7c33371b74b78a98a80f53e36438a7c431967ebb4608cdb50e2aba6582`.

### Proposed decision

```json
{
  "claimId": "claim_c90e11ad1b45be63d3a2473892178963",
  "sourceUnitDigest": "d7a19f7c33371b74b78a98a80f53e36438a7c431967ebb4608cdb50e2aba6582",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-225",
  "targetUnitDigest": "d7a19f7c33371b74b78a98a80f53e36438a7c431967ebb4608cdb50e2aba6582",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: repo-layout-vision source carriage",
    "Repo Layout Vision: Apps And Packages",
    "4. App Boundaries"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/repo-layout-vision.md#unheaded-block-25 (lines 137–138) into docs/platform/component-boundary.md#unheaded-block-225 (lines 1525–1526), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
App packages should not own reusable domain logic. They assemble ports,
adapters, config, and runtime startup.
```

### Full target shown text

```text
App packages should not own reusable domain logic. They assemble ports,
adapters, config, and runtime startup.
```

### Unified diff

```diff
No text difference.
```

## claim_4f6eab9173895d9e8f28872b08fd8482

Source: `docs/architect/component-boundary/repo-layout-vision.md#5-package-boundaries`. Target: `docs/platform/component-boundary.md#5-package-boundaries`.

Mechanical class: Judgment. Source digest: `3ddc6cda753143472929d98ced051cd78de31e0bd72e292385c55188f968d28f`. Target digest: `d2922b54c780ce75d87809d276320ae0bad851f71cdf87726b79bbbdf72094df`.

Full shown source SHA256: `7195d9f08fa0f22e7a05f78895810399c699dcd41288381dd4a63c706fa16659`. Full shown target SHA256: `f3b35aac99851bfb8b918b17f70dfde7453d954c727104d7dcfd54e711530bad`.

### Proposed decision

```json
{
  "claimId": "claim_4f6eab9173895d9e8f28872b08fd8482",
  "sourceUnitDigest": "3ddc6cda753143472929d98ced051cd78de31e0bd72e292385c55188f968d28f",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "5-package-boundaries",
  "targetUnitDigest": "d2922b54c780ce75d87809d276320ae0bad851f71cdf87726b79bbbdf72094df",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: repo-layout-vision source carriage",
    "Repo Layout Vision: Apps And Packages"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Judgment: no target digest match. Carry the complete heading at docs/architect/component-boundary/repo-layout-vision.md#5-package-boundaries (lines 140–140) into docs/platform/component-boundary.md#5-package-boundaries (lines 1528–1528), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. Digest differences come only from the recorded candidate header/frontmatter fence, heading-level shift or physical relative-link rebasing; full before/after units and line mapping are in authoring accounting. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
## 5. Package Boundaries

`packages/gateway`

- owns REST route handlers and gateway-specific middleware;
- includes `cf_access.rs` for now;
- mounts web serving behavior but does not own the web-dashboard source.

`packages/mcp`

- owns the MCP surface;
- is mounted by `apps/gateway` into the same Axum process;
- keeps the current "same process" contract.

`packages/herdr-core`

- owns cockpit application state and operation-pane logic;
- includes `app.rs`, `layout.rs`, `pane_scan.rs`, and `pick.rs`;
- keeps pane scanning and pick logic together unless a clearer split emerges.

`packages/herdr-ui`

- owns terminal rendering;
- keeps crossterm/TUI drawing separate from cockpit domain state.

`packages/fgos-ports`

- owns shared ports and the fgos CLI adapter;
- includes `ports.rs`, `fgos.rs`, and shared settings;
- is the place where gateway and TUI agree on their boundary to fgOS.

`packages/web-dashboard`

- owns the Vite/TypeScript/React/Tailwind dashboard source;
- is not a Cargo crate;
- builds into `apps/gateway/static` for embedding and serving.
```

### Full target shown text

```text
#### 5. Package Boundaries

`packages/gateway`

- owns REST route handlers and gateway-specific middleware;
- includes `cf_access.rs` for now;
- mounts web serving behavior but does not own the web-dashboard source.

`packages/mcp`

- owns the MCP surface;
- is mounted by `apps/gateway` into the same Axum process;
- keeps the current "same process" contract.

`packages/herdr-core`

- owns cockpit application state and operation-pane logic;
- includes `app.rs`, `layout.rs`, `pane_scan.rs`, and `pick.rs`;
- keeps pane scanning and pick logic together unless a clearer split emerges.

`packages/herdr-ui`

- owns terminal rendering;
- keeps crossterm/TUI drawing separate from cockpit domain state.

`packages/fgos-ports`

- owns shared ports and the fgos CLI adapter;
- includes `ports.rs`, `fgos.rs`, and shared settings;
- is the place where gateway and TUI agree on their boundary to fgOS.

`packages/web-dashboard`

- owns the Vite/TypeScript/React/Tailwind dashboard source;
- is not a Cargo crate;
- builds into `apps/gateway/static` for embedding and serving.
```

### Unified diff

```diff
--- docs/architect/component-boundary/repo-layout-vision.md#5-package-boundaries
+++ docs/platform/component-boundary.md#5-package-boundaries
@@ -1,4 +1,4 @@
-## 5. Package Boundaries
+#### 5. Package Boundaries
 
 `packages/gateway`
 

```

## claim_45b6e170f25c8f95fd7c00d100929f3c

Source: `docs/architect/component-boundary/repo-layout-vision.md#unheaded-block-26`. Target: `docs/platform/component-boundary.md#unheaded-block-226`.

Mechanical class: Weak-exact. Source digest: `2e7c293104ffe890e092527f886745c2779a9bb9ae222bac5ccf7b684573d1c8`. Target digest: `2e7c293104ffe890e092527f886745c2779a9bb9ae222bac5ccf7b684573d1c8`.

Full shown source SHA256: `2e7c293104ffe890e092527f886745c2779a9bb9ae222bac5ccf7b684573d1c8`. Full shown target SHA256: `2e7c293104ffe890e092527f886745c2779a9bb9ae222bac5ccf7b684573d1c8`.

### Proposed decision

```json
{
  "claimId": "claim_45b6e170f25c8f95fd7c00d100929f3c",
  "sourceUnitDigest": "2e7c293104ffe890e092527f886745c2779a9bb9ae222bac5ccf7b684573d1c8",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-226",
  "targetUnitDigest": "2e7c293104ffe890e092527f886745c2779a9bb9ae222bac5ccf7b684573d1c8",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: repo-layout-vision source carriage",
    "Repo Layout Vision: Apps And Packages",
    "5. Package Boundaries"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/repo-layout-vision.md#unheaded-block-26 (lines 142–148) into docs/platform/component-boundary.md#unheaded-block-226 (lines 1530–1536), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
`packages/gateway`

- owns REST route handlers and gateway-specific middleware;
- includes `cf_access.rs` for now;
- mounts web serving behavior but does not own the web-dashboard source.

`packages/mcp`
```

### Full target shown text

```text
`packages/gateway`

- owns REST route handlers and gateway-specific middleware;
- includes `cf_access.rs` for now;
- mounts web serving behavior but does not own the web-dashboard source.

`packages/mcp`
```

### Unified diff

```diff
No text difference.
```

## claim_e03fb1ea3489395c622232dd808073f3

Source: `docs/architect/component-boundary/repo-layout-vision.md#unheaded-block-27`. Target: `docs/platform/component-boundary.md#unheaded-block-227`.

Mechanical class: Weak-exact. Source digest: `3f93c5f973be6b075326818a46322662d75c567fa67c7f25e2ad7df4ada4acd4`. Target digest: `3f93c5f973be6b075326818a46322662d75c567fa67c7f25e2ad7df4ada4acd4`.

Full shown source SHA256: `3f93c5f973be6b075326818a46322662d75c567fa67c7f25e2ad7df4ada4acd4`. Full shown target SHA256: `3f93c5f973be6b075326818a46322662d75c567fa67c7f25e2ad7df4ada4acd4`.

### Proposed decision

```json
{
  "claimId": "claim_e03fb1ea3489395c622232dd808073f3",
  "sourceUnitDigest": "3f93c5f973be6b075326818a46322662d75c567fa67c7f25e2ad7df4ada4acd4",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-227",
  "targetUnitDigest": "3f93c5f973be6b075326818a46322662d75c567fa67c7f25e2ad7df4ada4acd4",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: repo-layout-vision source carriage",
    "Repo Layout Vision: Apps And Packages",
    "5. Package Boundaries"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/repo-layout-vision.md#unheaded-block-27 (lines 150–152) into docs/platform/component-boundary.md#unheaded-block-227 (lines 1538–1540), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
- owns the MCP surface;
- is mounted by `apps/gateway` into the same Axum process;
- keeps the current "same process" contract.
```

### Full target shown text

```text
- owns the MCP surface;
- is mounted by `apps/gateway` into the same Axum process;
- keeps the current "same process" contract.
```

### Unified diff

```diff
No text difference.
```

## claim_3f4fb302f4a50b7b72531c2706bef9d6

Source: `docs/architect/component-boundary/repo-layout-vision.md#unheaded-block-28`. Target: `docs/platform/component-boundary.md#unheaded-block-228`.

Mechanical class: Weak-exact. Source digest: `23ce4e0056d551f0f1c67c6e3c354b47c5452cde9f215d90bfe8499a6bc3542d`. Target digest: `23ce4e0056d551f0f1c67c6e3c354b47c5452cde9f215d90bfe8499a6bc3542d`.

Full shown source SHA256: `23ce4e0056d551f0f1c67c6e3c354b47c5452cde9f215d90bfe8499a6bc3542d`. Full shown target SHA256: `23ce4e0056d551f0f1c67c6e3c354b47c5452cde9f215d90bfe8499a6bc3542d`.

### Proposed decision

```json
{
  "claimId": "claim_3f4fb302f4a50b7b72531c2706bef9d6",
  "sourceUnitDigest": "23ce4e0056d551f0f1c67c6e3c354b47c5452cde9f215d90bfe8499a6bc3542d",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-228",
  "targetUnitDigest": "23ce4e0056d551f0f1c67c6e3c354b47c5452cde9f215d90bfe8499a6bc3542d",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: repo-layout-vision source carriage",
    "Repo Layout Vision: Apps And Packages",
    "5. Package Boundaries"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ; source unit shorter than 40 characters. Carry the complete unheaded-block at docs/architect/component-boundary/repo-layout-vision.md#unheaded-block-28 (lines 154–154) into docs/platform/component-boundary.md#unheaded-block-228 (lines 1542–1542), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
`packages/herdr-core`
```

### Full target shown text

```text
`packages/herdr-core`
```

### Unified diff

```diff
No text difference.
```

## claim_a0bdd7e03fc99a6a4b17c4534fd85d10

Source: `docs/architect/component-boundary/repo-layout-vision.md#unheaded-block-29`. Target: `docs/platform/component-boundary.md#unheaded-block-229`.

Mechanical class: Weak-exact. Source digest: `357ea60d598b9a799f9e843cec6de12ecd40e98315ed6658bb5d0cea4aaf0957`. Target digest: `357ea60d598b9a799f9e843cec6de12ecd40e98315ed6658bb5d0cea4aaf0957`.

Full shown source SHA256: `357ea60d598b9a799f9e843cec6de12ecd40e98315ed6658bb5d0cea4aaf0957`. Full shown target SHA256: `357ea60d598b9a799f9e843cec6de12ecd40e98315ed6658bb5d0cea4aaf0957`.

### Proposed decision

```json
{
  "claimId": "claim_a0bdd7e03fc99a6a4b17c4534fd85d10",
  "sourceUnitDigest": "357ea60d598b9a799f9e843cec6de12ecd40e98315ed6658bb5d0cea4aaf0957",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-229",
  "targetUnitDigest": "357ea60d598b9a799f9e843cec6de12ecd40e98315ed6658bb5d0cea4aaf0957",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: repo-layout-vision source carriage",
    "Repo Layout Vision: Apps And Packages",
    "5. Package Boundaries"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/repo-layout-vision.md#unheaded-block-29 (lines 156–160) into docs/platform/component-boundary.md#unheaded-block-229 (lines 1544–1548), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
- owns cockpit application state and operation-pane logic;
- includes `app.rs`, `layout.rs`, `pane_scan.rs`, and `pick.rs`;
- keeps pane scanning and pick logic together unless a clearer split emerges.

`packages/herdr-ui`
```

### Full target shown text

```text
- owns cockpit application state and operation-pane logic;
- includes `app.rs`, `layout.rs`, `pane_scan.rs`, and `pick.rs`;
- keeps pane scanning and pick logic together unless a clearer split emerges.

`packages/herdr-ui`
```

### Unified diff

```diff
No text difference.
```

## claim_e5cbe793b35fc5b8e7972267aeb64ff2

Source: `docs/architect/component-boundary/repo-layout-vision.md#unheaded-block-30`. Target: `docs/platform/component-boundary.md#unheaded-block-230`.

Mechanical class: Weak-exact. Source digest: `65cfa8d1d79e581245da36e5a276131fd06d077a60a6d8f60b2adf8828408455`. Target digest: `65cfa8d1d79e581245da36e5a276131fd06d077a60a6d8f60b2adf8828408455`.

Full shown source SHA256: `65cfa8d1d79e581245da36e5a276131fd06d077a60a6d8f60b2adf8828408455`. Full shown target SHA256: `65cfa8d1d79e581245da36e5a276131fd06d077a60a6d8f60b2adf8828408455`.

### Proposed decision

```json
{
  "claimId": "claim_e5cbe793b35fc5b8e7972267aeb64ff2",
  "sourceUnitDigest": "65cfa8d1d79e581245da36e5a276131fd06d077a60a6d8f60b2adf8828408455",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-230",
  "targetUnitDigest": "65cfa8d1d79e581245da36e5a276131fd06d077a60a6d8f60b2adf8828408455",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: repo-layout-vision source carriage",
    "Repo Layout Vision: Apps And Packages",
    "5. Package Boundaries"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/repo-layout-vision.md#unheaded-block-30 (lines 162–163) into docs/platform/component-boundary.md#unheaded-block-230 (lines 1550–1551), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
- owns terminal rendering;
- keeps crossterm/TUI drawing separate from cockpit domain state.
```

### Full target shown text

```text
- owns terminal rendering;
- keeps crossterm/TUI drawing separate from cockpit domain state.
```

### Unified diff

```diff
No text difference.
```

## claim_94e07165e438cdc7b5d4eade767142d9

Source: `docs/architect/component-boundary/repo-layout-vision.md#unheaded-block-31`. Target: `docs/platform/component-boundary.md#unheaded-block-231`.

Mechanical class: Weak-exact. Source digest: `0bbcd3a5192d623bb5fd6f7bfb6462c061ed0de773f5aaf76cb96e5bf2a59314`. Target digest: `0bbcd3a5192d623bb5fd6f7bfb6462c061ed0de773f5aaf76cb96e5bf2a59314`.

Full shown source SHA256: `0bbcd3a5192d623bb5fd6f7bfb6462c061ed0de773f5aaf76cb96e5bf2a59314`. Full shown target SHA256: `0bbcd3a5192d623bb5fd6f7bfb6462c061ed0de773f5aaf76cb96e5bf2a59314`.

### Proposed decision

```json
{
  "claimId": "claim_94e07165e438cdc7b5d4eade767142d9",
  "sourceUnitDigest": "0bbcd3a5192d623bb5fd6f7bfb6462c061ed0de773f5aaf76cb96e5bf2a59314",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-231",
  "targetUnitDigest": "0bbcd3a5192d623bb5fd6f7bfb6462c061ed0de773f5aaf76cb96e5bf2a59314",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: repo-layout-vision source carriage",
    "Repo Layout Vision: Apps And Packages",
    "5. Package Boundaries"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ; source unit shorter than 40 characters. Carry the complete unheaded-block at docs/architect/component-boundary/repo-layout-vision.md#unheaded-block-31 (lines 165–165) into docs/platform/component-boundary.md#unheaded-block-231 (lines 1553–1553), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
`packages/fgos-ports`
```

### Full target shown text

```text
`packages/fgos-ports`
```

### Unified diff

```diff
No text difference.
```

## claim_c0c91ec2161f4fc38cdff12f4e4f0b29

Source: `docs/architect/component-boundary/repo-layout-vision.md#unheaded-block-32`. Target: `docs/platform/component-boundary.md#unheaded-block-232`.

Mechanical class: Weak-exact. Source digest: `e5987a0e96362b641d23036fd5de1d326f7b5f51e84bcda2b270ae8e8e4b865e`. Target digest: `e5987a0e96362b641d23036fd5de1d326f7b5f51e84bcda2b270ae8e8e4b865e`.

Full shown source SHA256: `e5987a0e96362b641d23036fd5de1d326f7b5f51e84bcda2b270ae8e8e4b865e`. Full shown target SHA256: `e5987a0e96362b641d23036fd5de1d326f7b5f51e84bcda2b270ae8e8e4b865e`.

### Proposed decision

```json
{
  "claimId": "claim_c0c91ec2161f4fc38cdff12f4e4f0b29",
  "sourceUnitDigest": "e5987a0e96362b641d23036fd5de1d326f7b5f51e84bcda2b270ae8e8e4b865e",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-232",
  "targetUnitDigest": "e5987a0e96362b641d23036fd5de1d326f7b5f51e84bcda2b270ae8e8e4b865e",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: repo-layout-vision source carriage",
    "Repo Layout Vision: Apps And Packages",
    "5. Package Boundaries"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/repo-layout-vision.md#unheaded-block-32 (lines 167–169) into docs/platform/component-boundary.md#unheaded-block-232 (lines 1555–1557), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
- owns shared ports and the fgos CLI adapter;
- includes `ports.rs`, `fgos.rs`, and shared settings;
- is the place where gateway and TUI agree on their boundary to fgOS.
```

### Full target shown text

```text
- owns shared ports and the fgos CLI adapter;
- includes `ports.rs`, `fgos.rs`, and shared settings;
- is the place where gateway and TUI agree on their boundary to fgOS.
```

### Unified diff

```diff
No text difference.
```

## claim_be5b35c49f48cfe74f3e0ef9fe5500a7

Source: `docs/architect/component-boundary/repo-layout-vision.md#unheaded-block-33`. Target: `docs/platform/component-boundary.md#unheaded-block-233`.

Mechanical class: Weak-exact. Source digest: `5eb244d8000dca602a1e066873f7db30bbbbb5cd99d8b27879537a2920d46597`. Target digest: `5eb244d8000dca602a1e066873f7db30bbbbb5cd99d8b27879537a2920d46597`.

Full shown source SHA256: `5eb244d8000dca602a1e066873f7db30bbbbb5cd99d8b27879537a2920d46597`. Full shown target SHA256: `5eb244d8000dca602a1e066873f7db30bbbbb5cd99d8b27879537a2920d46597`.

### Proposed decision

```json
{
  "claimId": "claim_be5b35c49f48cfe74f3e0ef9fe5500a7",
  "sourceUnitDigest": "5eb244d8000dca602a1e066873f7db30bbbbb5cd99d8b27879537a2920d46597",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-233",
  "targetUnitDigest": "5eb244d8000dca602a1e066873f7db30bbbbb5cd99d8b27879537a2920d46597",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: repo-layout-vision source carriage",
    "Repo Layout Vision: Apps And Packages",
    "5. Package Boundaries"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ; source unit shorter than 40 characters. Carry the complete unheaded-block at docs/architect/component-boundary/repo-layout-vision.md#unheaded-block-33 (lines 171–171) into docs/platform/component-boundary.md#unheaded-block-233 (lines 1559–1559), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
`packages/web-dashboard`
```

### Full target shown text

```text
`packages/web-dashboard`
```

### Unified diff

```diff
No text difference.
```

## claim_d80f4913654e65647a7809aa5705fb1e

Source: `docs/architect/component-boundary/repo-layout-vision.md#unheaded-block-34`. Target: `docs/platform/component-boundary.md#unheaded-block-234`.

Mechanical class: Weak-exact. Source digest: `4d8581ab208daaf5ad8254b89c4d2e35bb994b93704a713552d432d2a50add2c`. Target digest: `4d8581ab208daaf5ad8254b89c4d2e35bb994b93704a713552d432d2a50add2c`.

Full shown source SHA256: `4d8581ab208daaf5ad8254b89c4d2e35bb994b93704a713552d432d2a50add2c`. Full shown target SHA256: `4d8581ab208daaf5ad8254b89c4d2e35bb994b93704a713552d432d2a50add2c`.

### Proposed decision

```json
{
  "claimId": "claim_d80f4913654e65647a7809aa5705fb1e",
  "sourceUnitDigest": "4d8581ab208daaf5ad8254b89c4d2e35bb994b93704a713552d432d2a50add2c",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-234",
  "targetUnitDigest": "4d8581ab208daaf5ad8254b89c4d2e35bb994b93704a713552d432d2a50add2c",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: repo-layout-vision source carriage",
    "Repo Layout Vision: Apps And Packages",
    "5. Package Boundaries"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/repo-layout-vision.md#unheaded-block-34 (lines 173–175) into docs/platform/component-boundary.md#unheaded-block-234 (lines 1561–1563), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
- owns the Vite/TypeScript/React/Tailwind dashboard source;
- is not a Cargo crate;
- builds into `apps/gateway/static` for embedding and serving.
```

### Full target shown text

```text
- owns the Vite/TypeScript/React/Tailwind dashboard source;
- is not a Cargo crate;
- builds into `apps/gateway/static` for embedding and serving.
```

### Unified diff

```diff
No text difference.
```

## claim_9ab5449a4dca62046f1ab1ca6ea93ba2

Source: `docs/architect/component-boundary/repo-layout-vision.md#6-execution-blast-radius`. Target: `docs/platform/component-boundary.md#6-execution-blast-radius`.

Mechanical class: Judgment. Source digest: `658d4a6a076ebb82996f2262bb96acd5ad39c6ac0aff2c685e3055684683d883`. Target digest: `3bf75232bb5ba457a6dfe0a94f58be19cad4bca5d8ca1c5f5d3ee2cc33a5df1e`.

Full shown source SHA256: `34fc6843d9d67c3f4bfdca57be7ef311bc00c434f4d5c50f30e26976361412a5`. Full shown target SHA256: `023117e02a89d4a598123174c4fad3761c68570b3e969557371b843f9d5d554c`.

### Proposed decision

```json
{
  "claimId": "claim_9ab5449a4dca62046f1ab1ca6ea93ba2",
  "sourceUnitDigest": "658d4a6a076ebb82996f2262bb96acd5ad39c6ac0aff2c685e3055684683d883",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "6-execution-blast-radius",
  "targetUnitDigest": "3bf75232bb5ba457a6dfe0a94f58be19cad4bca5d8ca1c5f5d3ee2cc33a5df1e",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: repo-layout-vision source carriage",
    "Repo Layout Vision: Apps And Packages"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Judgment: no target digest match. Carry the complete heading at docs/architect/component-boundary/repo-layout-vision.md#6-execution-blast-radius (lines 177–177) into docs/platform/component-boundary.md#6-execution-blast-radius (lines 1565–1565), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. Digest differences come only from the recorded candidate header/frontmatter fence, heading-level shift or physical relative-link rebasing; full before/after units and line mapping are in authoring accounting. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
## 6. Execution Blast Radius

The following edits would be mechanical when this vision is implemented:

- `src/runner/gateway-control.mjs:240`: update the compiled binary path to the
  new `apps/gateway` binary;
- `src/runner/gateway-control.mjs:273`: change the release build command from
  `cargo build --release --bin herdr-fgos` to the new gateway package target;
- `src/runner/gateway-control.mjs:295`: remove the extra `gateway` argument
  from the spawned process;
- `herdr-plugin/web/package.json`: change the bundle output from `../static`
  to `../../apps/gateway/static`;
- `herdr-plugin.toml`: update any binary or package path assumptions;
- docs, tests, CI, and setup references to `herdr-plugin/`: update paths where
  they describe the physical layout;
- upstream Herdr plugin integration: update any path that loads the TUI binary.

This list describes known blast radius, not a complete implementation plan.
```

### Full target shown text

```text
#### 6. Execution Blast Radius

The following edits would be mechanical when this vision is implemented:

- `src/runner/gateway-control.mjs:240`: update the compiled binary path to the
  new `apps/gateway` binary;
- `src/runner/gateway-control.mjs:273`: change the release build command from
  `cargo build --release --bin herdr-fgos` to the new gateway package target;
- `src/runner/gateway-control.mjs:295`: remove the extra `gateway` argument
  from the spawned process;
- `herdr-plugin/web/package.json`: change the bundle output from `../static`
  to `../../apps/gateway/static`;
- `herdr-plugin.toml`: update any binary or package path assumptions;
- docs, tests, CI, and setup references to `herdr-plugin/`: update paths where
  they describe the physical layout;
- upstream Herdr plugin integration: update any path that loads the TUI binary.

This list describes known blast radius, not a complete implementation plan.
```

### Unified diff

```diff
--- docs/architect/component-boundary/repo-layout-vision.md#6-execution-blast-radius
+++ docs/platform/component-boundary.md#6-execution-blast-radius
@@ -1,4 +1,4 @@
-## 6. Execution Blast Radius
+#### 6. Execution Blast Radius
 
 The following edits would be mechanical when this vision is implemented:
 

```

## claim_2527945d27cce30a2a1458ce9b49a23f

Source: `docs/architect/component-boundary/repo-layout-vision.md#unheaded-block-35`. Target: `docs/platform/component-boundary.md#unheaded-block-235`.

Mechanical class: Weak-exact. Source digest: `e7523279ff9f9b4c9c356c1cfebdd59ab44fc8dda560b697dd63197c168b24ac`. Target digest: `e7523279ff9f9b4c9c356c1cfebdd59ab44fc8dda560b697dd63197c168b24ac`.

Full shown source SHA256: `e7523279ff9f9b4c9c356c1cfebdd59ab44fc8dda560b697dd63197c168b24ac`. Full shown target SHA256: `e7523279ff9f9b4c9c356c1cfebdd59ab44fc8dda560b697dd63197c168b24ac`.

### Proposed decision

```json
{
  "claimId": "claim_2527945d27cce30a2a1458ce9b49a23f",
  "sourceUnitDigest": "e7523279ff9f9b4c9c356c1cfebdd59ab44fc8dda560b697dd63197c168b24ac",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-235",
  "targetUnitDigest": "e7523279ff9f9b4c9c356c1cfebdd59ab44fc8dda560b697dd63197c168b24ac",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: repo-layout-vision source carriage",
    "Repo Layout Vision: Apps And Packages",
    "6. Execution Blast Radius"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/repo-layout-vision.md#unheaded-block-35 (lines 179–179) into docs/platform/component-boundary.md#unheaded-block-235 (lines 1567–1567), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
The following edits would be mechanical when this vision is implemented:
```

### Full target shown text

```text
The following edits would be mechanical when this vision is implemented:
```

### Unified diff

```diff
No text difference.
```

## claim_3ca5e4a8d30db84f15490f406cfd4471

Source: `docs/architect/component-boundary/repo-layout-vision.md#unheaded-block-36`. Target: `docs/platform/component-boundary.md#unheaded-block-236`.

Mechanical class: Weak-exact. Source digest: `01a94af982f066e67d479f6448bc04ae50babf4180fefdcfe53fab9bb3ccfff7`. Target digest: `01a94af982f066e67d479f6448bc04ae50babf4180fefdcfe53fab9bb3ccfff7`.

Full shown source SHA256: `01a94af982f066e67d479f6448bc04ae50babf4180fefdcfe53fab9bb3ccfff7`. Full shown target SHA256: `01a94af982f066e67d479f6448bc04ae50babf4180fefdcfe53fab9bb3ccfff7`.

### Proposed decision

```json
{
  "claimId": "claim_3ca5e4a8d30db84f15490f406cfd4471",
  "sourceUnitDigest": "01a94af982f066e67d479f6448bc04ae50babf4180fefdcfe53fab9bb3ccfff7",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-236",
  "targetUnitDigest": "01a94af982f066e67d479f6448bc04ae50babf4180fefdcfe53fab9bb3ccfff7",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: repo-layout-vision source carriage",
    "Repo Layout Vision: Apps And Packages",
    "6. Execution Blast Radius"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/repo-layout-vision.md#unheaded-block-36 (lines 181–192) into docs/platform/component-boundary.md#unheaded-block-236 (lines 1569–1580), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
- `src/runner/gateway-control.mjs:240`: update the compiled binary path to the
  new `apps/gateway` binary;
- `src/runner/gateway-control.mjs:273`: change the release build command from
  `cargo build --release --bin herdr-fgos` to the new gateway package target;
- `src/runner/gateway-control.mjs:295`: remove the extra `gateway` argument
  from the spawned process;
- `herdr-plugin/web/package.json`: change the bundle output from `../static`
  to `../../apps/gateway/static`;
- `herdr-plugin.toml`: update any binary or package path assumptions;
- docs, tests, CI, and setup references to `herdr-plugin/`: update paths where
  they describe the physical layout;
- upstream Herdr plugin integration: update any path that loads the TUI binary.
```

### Full target shown text

```text
- `src/runner/gateway-control.mjs:240`: update the compiled binary path to the
  new `apps/gateway` binary;
- `src/runner/gateway-control.mjs:273`: change the release build command from
  `cargo build --release --bin herdr-fgos` to the new gateway package target;
- `src/runner/gateway-control.mjs:295`: remove the extra `gateway` argument
  from the spawned process;
- `herdr-plugin/web/package.json`: change the bundle output from `../static`
  to `../../apps/gateway/static`;
- `herdr-plugin.toml`: update any binary or package path assumptions;
- docs, tests, CI, and setup references to `herdr-plugin/`: update paths where
  they describe the physical layout;
- upstream Herdr plugin integration: update any path that loads the TUI binary.
```

### Unified diff

```diff
No text difference.
```

## claim_89f5a63cbd6de9afbbb5fc398d365779

Source: `docs/architect/component-boundary/repo-layout-vision.md#unheaded-block-37`. Target: `docs/platform/component-boundary.md#unheaded-block-237`.

Mechanical class: Weak-exact. Source digest: `b5f72cfbe2d4b99347f1a87fa1074e064fbac10364ddf9e0f0c940d329e33fc6`. Target digest: `b5f72cfbe2d4b99347f1a87fa1074e064fbac10364ddf9e0f0c940d329e33fc6`.

Full shown source SHA256: `b5f72cfbe2d4b99347f1a87fa1074e064fbac10364ddf9e0f0c940d329e33fc6`. Full shown target SHA256: `b5f72cfbe2d4b99347f1a87fa1074e064fbac10364ddf9e0f0c940d329e33fc6`.

### Proposed decision

```json
{
  "claimId": "claim_89f5a63cbd6de9afbbb5fc398d365779",
  "sourceUnitDigest": "b5f72cfbe2d4b99347f1a87fa1074e064fbac10364ddf9e0f0c940d329e33fc6",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-237",
  "targetUnitDigest": "b5f72cfbe2d4b99347f1a87fa1074e064fbac10364ddf9e0f0c940d329e33fc6",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: repo-layout-vision source carriage",
    "Repo Layout Vision: Apps And Packages",
    "6. Execution Blast Radius"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/repo-layout-vision.md#unheaded-block-37 (lines 194–194) into docs/platform/component-boundary.md#unheaded-block-237 (lines 1582–1582), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
This list describes known blast radius, not a complete implementation plan.
```

### Full target shown text

```text
This list describes known blast radius, not a complete implementation plan.
```

### Unified diff

```diff
No text difference.
```

## claim_1b9db4dfec256a65756b0b18f80b5a8e

Source: `docs/architect/component-boundary/repo-layout-vision.md#7-out-of-scope-for-this-document`. Target: `docs/platform/component-boundary.md#7-out-of-scope-for-this-document`.

Mechanical class: Judgment. Source digest: `092fe6719d978d4d240366b82cfbc243349fb41eac9d42fbf24512cca37dcbb1`. Target digest: `ca51aad54bb762f800a1ecd68b1d0348dba2545717e7ba89fec37bcae9297c18`.

Full shown source SHA256: `1cc289335ce2cbc322f773a59265c99a277f065ebca4ca4c258d4d1a3872be2f`. Full shown target SHA256: `ea5526ce78d900fe7b38f7bc1834d1ae983699e9642eeb6d3d3ddca6f56f1b4f`.

### Proposed decision

```json
{
  "claimId": "claim_1b9db4dfec256a65756b0b18f80b5a8e",
  "sourceUnitDigest": "092fe6719d978d4d240366b82cfbc243349fb41eac9d42fbf24512cca37dcbb1",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "7-out-of-scope-for-this-document",
  "targetUnitDigest": "ca51aad54bb762f800a1ecd68b1d0348dba2545717e7ba89fec37bcae9297c18",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: repo-layout-vision source carriage",
    "Repo Layout Vision: Apps And Packages"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Judgment: no target digest match. Carry the complete heading at docs/architect/component-boundary/repo-layout-vision.md#7-out-of-scope-for-this-document (lines 196–196) into docs/platform/component-boundary.md#7-out-of-scope-for-this-document (lines 1584–1584), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. Digest differences come only from the recorded candidate header/frontmatter fence, heading-level shift or physical relative-link rebasing; full before/after units and line mapping are in authoring accounting. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
## 7. Out Of Scope For This Document

The Node side is deliberately not designed here:

- `packages/core`;
- `packages/config`;
- `packages/state`;
- `packages/shared`;
- `packages/orchestrator`;
- the thin-entry location for Node CLI/orchestrator binaries.

`packages/orchestrator` is reserved vocabulary. It must continue to match the
existing fgOS meaning: the T0 composition layer around dispatch/runner. It must
not be confused with the unrelated Rust setting name `herdr_orchestrator`.
```

### Full target shown text

```text
#### 7. Out Of Scope For This Document

The Node side is deliberately not designed here:

- `packages/core`;
- `packages/config`;
- `packages/state`;
- `packages/shared`;
- `packages/orchestrator`;
- the thin-entry location for Node CLI/orchestrator binaries.

`packages/orchestrator` is reserved vocabulary. It must continue to match the
existing fgOS meaning: the T0 composition layer around dispatch/runner. It must
not be confused with the unrelated Rust setting name `herdr_orchestrator`.
```

### Unified diff

```diff
--- docs/architect/component-boundary/repo-layout-vision.md#7-out-of-scope-for-this-document
+++ docs/platform/component-boundary.md#7-out-of-scope-for-this-document
@@ -1,4 +1,4 @@
-## 7. Out Of Scope For This Document
+#### 7. Out Of Scope For This Document
 
 The Node side is deliberately not designed here:
 

```

## claim_0ae9a7cc9fd90391dc02d171b8367af2

Source: `docs/architect/component-boundary/repo-layout-vision.md#unheaded-block-38`. Target: `docs/platform/component-boundary.md#unheaded-block-238`.

Mechanical class: Weak-exact. Source digest: `b33ce241cb4a606c1ad73396d28c6cc8f1894783dd911c4bbe5451b1bec91fad`. Target digest: `b33ce241cb4a606c1ad73396d28c6cc8f1894783dd911c4bbe5451b1bec91fad`.

Full shown source SHA256: `b33ce241cb4a606c1ad73396d28c6cc8f1894783dd911c4bbe5451b1bec91fad`. Full shown target SHA256: `b33ce241cb4a606c1ad73396d28c6cc8f1894783dd911c4bbe5451b1bec91fad`.

### Proposed decision

```json
{
  "claimId": "claim_0ae9a7cc9fd90391dc02d171b8367af2",
  "sourceUnitDigest": "b33ce241cb4a606c1ad73396d28c6cc8f1894783dd911c4bbe5451b1bec91fad",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-238",
  "targetUnitDigest": "b33ce241cb4a606c1ad73396d28c6cc8f1894783dd911c4bbe5451b1bec91fad",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: repo-layout-vision source carriage",
    "Repo Layout Vision: Apps And Packages",
    "7. Out Of Scope For This Document"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/repo-layout-vision.md#unheaded-block-38 (lines 198–198) into docs/platform/component-boundary.md#unheaded-block-238 (lines 1586–1586), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
The Node side is deliberately not designed here:
```

### Full target shown text

```text
The Node side is deliberately not designed here:
```

### Unified diff

```diff
No text difference.
```

## claim_0850cf30f57a7c51ce2356e66ea5a1e6

Source: `docs/architect/component-boundary/repo-layout-vision.md#unheaded-block-39`. Target: `docs/platform/component-boundary.md#unheaded-block-239`.

Mechanical class: Weak-exact. Source digest: `b8d83fe019bbd065a51466a5a808d7dca253fa397bfa9148f81e1e16745e7f59`. Target digest: `b8d83fe019bbd065a51466a5a808d7dca253fa397bfa9148f81e1e16745e7f59`.

Full shown source SHA256: `b8d83fe019bbd065a51466a5a808d7dca253fa397bfa9148f81e1e16745e7f59`. Full shown target SHA256: `b8d83fe019bbd065a51466a5a808d7dca253fa397bfa9148f81e1e16745e7f59`.

### Proposed decision

```json
{
  "claimId": "claim_0850cf30f57a7c51ce2356e66ea5a1e6",
  "sourceUnitDigest": "b8d83fe019bbd065a51466a5a808d7dca253fa397bfa9148f81e1e16745e7f59",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-239",
  "targetUnitDigest": "b8d83fe019bbd065a51466a5a808d7dca253fa397bfa9148f81e1e16745e7f59",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: repo-layout-vision source carriage",
    "Repo Layout Vision: Apps And Packages",
    "7. Out Of Scope For This Document"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/repo-layout-vision.md#unheaded-block-39 (lines 200–205) into docs/platform/component-boundary.md#unheaded-block-239 (lines 1588–1593), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
- `packages/core`;
- `packages/config`;
- `packages/state`;
- `packages/shared`;
- `packages/orchestrator`;
- the thin-entry location for Node CLI/orchestrator binaries.
```

### Full target shown text

```text
- `packages/core`;
- `packages/config`;
- `packages/state`;
- `packages/shared`;
- `packages/orchestrator`;
- the thin-entry location for Node CLI/orchestrator binaries.
```

### Unified diff

```diff
No text difference.
```

## claim_84fed8d8645eeddbd6151762b212d4e4

Source: `docs/architect/component-boundary/repo-layout-vision.md#unheaded-block-40`. Target: `docs/platform/component-boundary.md#unheaded-block-240`.

Mechanical class: Weak-exact. Source digest: `c49c7eb16ba5b281b3ad7bed4b218ab81ddfa142dc618353d4d8b3bce13e38af`. Target digest: `c49c7eb16ba5b281b3ad7bed4b218ab81ddfa142dc618353d4d8b3bce13e38af`.

Full shown source SHA256: `c49c7eb16ba5b281b3ad7bed4b218ab81ddfa142dc618353d4d8b3bce13e38af`. Full shown target SHA256: `c49c7eb16ba5b281b3ad7bed4b218ab81ddfa142dc618353d4d8b3bce13e38af`.

### Proposed decision

```json
{
  "claimId": "claim_84fed8d8645eeddbd6151762b212d4e4",
  "sourceUnitDigest": "c49c7eb16ba5b281b3ad7bed4b218ab81ddfa142dc618353d4d8b3bce13e38af",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-240",
  "targetUnitDigest": "c49c7eb16ba5b281b3ad7bed4b218ab81ddfa142dc618353d4d8b3bce13e38af",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: repo-layout-vision source carriage",
    "Repo Layout Vision: Apps And Packages",
    "7. Out Of Scope For This Document"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/repo-layout-vision.md#unheaded-block-40 (lines 207–209) into docs/platform/component-boundary.md#unheaded-block-240 (lines 1595–1597), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
`packages/orchestrator` is reserved vocabulary. It must continue to match the
existing fgOS meaning: the T0 composition layer around dispatch/runner. It must
not be confused with the unrelated Rust setting name `herdr_orchestrator`.
```

### Full target shown text

```text
`packages/orchestrator` is reserved vocabulary. It must continue to match the
existing fgOS meaning: the T0 composition layer around dispatch/runner. It must
not be confused with the unrelated Rust setting name `herdr_orchestrator`.
```

### Unified diff

```diff
No text difference.
```

## claim_ab116066789a96601346310606cc30a0

Source: `docs/architect/component-boundary/repo-layout-vision.md#8-open-questions`. Target: `docs/platform/component-boundary.md#8-open-questions`.

Mechanical class: Judgment. Source digest: `64a141e3f786cc456f75c5a32c8556e8d58f84e083f1627015e6167ba17f20d4`. Target digest: `dceaf7e07aae4e3ef8401933e7422dbf2b89d597b6889cb82f81e413cbc1b148`.

Full shown source SHA256: `7626526bf487786be3149d90a4407547db47318ad1ff1939218684a6e715de41`. Full shown target SHA256: `a75c0c1a955ac6500fcb0c4ad0b2d9f456339ed40a2a1bd192730c247b37c44f`.

### Proposed decision

```json
{
  "claimId": "claim_ab116066789a96601346310606cc30a0",
  "sourceUnitDigest": "64a141e3f786cc456f75c5a32c8556e8d58f84e083f1627015e6167ba17f20d4",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "8-open-questions",
  "targetUnitDigest": "dceaf7e07aae4e3ef8401933e7422dbf2b89d597b6889cb82f81e413cbc1b148",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: repo-layout-vision source carriage",
    "Repo Layout Vision: Apps And Packages"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Judgment: no target digest match. Carry the complete heading at docs/architect/component-boundary/repo-layout-vision.md#8-open-questions (lines 211–211) into docs/platform/component-boundary.md#8-open-questions (lines 1599–1599), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. Digest differences come only from the recorded candidate header/frontmatter fence, heading-level shift or physical relative-link rebasing; full before/after units and line mapping are in authoring accounting. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
## 8. Open Questions

- Should Node thin entries stay under root `bin/`, or move under an `apps/cli`
  shape when the Node side is designed?
- Should `cf_access.rs` remain inside `packages/gateway`, or become a separate
  `packages/cf-access` package if another consumer appears?
- Should `pane_scan.rs` and `pick.rs` remain inside `packages/herdr-core`, or
  split later if cockpit-core becomes too broad?
```

### Full target shown text

```text
#### 8. Open Questions

- Should Node thin entries stay under root `bin/`, or move under an `apps/cli`
  shape when the Node side is designed?
- Should `cf_access.rs` remain inside `packages/gateway`, or become a separate
  `packages/cf-access` package if another consumer appears?
- Should `pane_scan.rs` and `pick.rs` remain inside `packages/herdr-core`, or
  split later if cockpit-core becomes too broad?
```

### Unified diff

```diff
--- docs/architect/component-boundary/repo-layout-vision.md#8-open-questions
+++ docs/platform/component-boundary.md#8-open-questions
@@ -1,4 +1,4 @@
-## 8. Open Questions
+#### 8. Open Questions
 
 - Should Node thin entries stay under root `bin/`, or move under an `apps/cli`
   shape when the Node side is designed?

```

## claim_4af5cd00b12d5ee1dabea5065f98e010

Source: `docs/architect/component-boundary/repo-layout-vision.md#unheaded-block-41`. Target: `docs/platform/component-boundary.md#unheaded-block-241`.

Mechanical class: Weak-exact. Source digest: `32cd473aefa5dcfa0465722b173460f4b89f1205b74cfe3e54143f86d9076f02`. Target digest: `32cd473aefa5dcfa0465722b173460f4b89f1205b74cfe3e54143f86d9076f02`.

Full shown source SHA256: `32cd473aefa5dcfa0465722b173460f4b89f1205b74cfe3e54143f86d9076f02`. Full shown target SHA256: `32cd473aefa5dcfa0465722b173460f4b89f1205b74cfe3e54143f86d9076f02`.

### Proposed decision

```json
{
  "claimId": "claim_4af5cd00b12d5ee1dabea5065f98e010",
  "sourceUnitDigest": "32cd473aefa5dcfa0465722b173460f4b89f1205b74cfe3e54143f86d9076f02",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-241",
  "targetUnitDigest": "32cd473aefa5dcfa0465722b173460f4b89f1205b74cfe3e54143f86d9076f02",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: repo-layout-vision source carriage",
    "Repo Layout Vision: Apps And Packages",
    "8. Open Questions"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/repo-layout-vision.md#unheaded-block-41 (lines 213–218) into docs/platform/component-boundary.md#unheaded-block-241 (lines 1601–1606), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
- Should Node thin entries stay under root `bin/`, or move under an `apps/cli`
  shape when the Node side is designed?
- Should `cf_access.rs` remain inside `packages/gateway`, or become a separate
  `packages/cf-access` package if another consumer appears?
- Should `pane_scan.rs` and `pick.rs` remain inside `packages/herdr-core`, or
  split later if cockpit-core becomes too broad?
```

### Full target shown text

```text
- Should Node thin entries stay under root `bin/`, or move under an `apps/cli`
  shape when the Node side is designed?
- Should `cf_access.rs` remain inside `packages/gateway`, or become a separate
  `packages/cf-access` package if another consumer appears?
- Should `pane_scan.rs` and `pick.rs` remain inside `packages/herdr-core`, or
  split later if cockpit-core becomes too broad?
```

### Unified diff

```diff
No text difference.
```
