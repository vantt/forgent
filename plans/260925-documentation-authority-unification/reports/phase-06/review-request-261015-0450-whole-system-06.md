# Bounded whole-system source review request

Content commit: `a8a10abc1a24218518a14764f68c8d86f4810f91`. Author session: `codex-session:37@2026-10-15`. Review mode requested: ordinary.

Shard: `plans/260925-documentation-authority-unification/ledger/decisions/s6-whole-system-component-readme.json`. Part 1/1; entries: **52**. Sidecar: `review-request-261015-0450-whole-system-06.md.json`.

Read review-brief.md, owner-answers.md A28–A37, frozen whole-system map, constitution, vocabulary and shard schema. Apply A36: mechanically check every row (full digest recompute, anchor check, shard/pack equality); deeply read the reviewer-seeded sample plus every differing-digest row in both directions with its diff. Preserve conditions, qualifiers, dated status and complete payload; verify one owner and labelled additions. No approval is supplied here.

Step 6’s closing review is a **checkpoint review whose sensitivity pack the reviewer holds**. The author has not created, seen or selected that pack/key. Ordinary review and A36 sampling do not replace checkpoint sensitivity.

Ordinary verdict contract: `Reviewer: <independent identity>`, `Review mode: ordinary`, request/content/shard pins; one own note and full 64-hex shown-unit digests per row. Use ok/rework/hold. Consolidate parts into a complete report for the original shard before unchanged ordinary application; never edit decisions manually.

| Claim | Verdict | Note | Source digest | Target digest |
|---|---|---|---|---|

A36 mandatory differing-digest rows (21): `claim_360bac2add48bf0a2a49e7af1f87e903`, `claim_5e9da3a2297ea0810b77633e4e384725`, `claim_c8d98c0008701e264eca755e375bf49f`, `claim_c8d61d6eb9aba8dcc3ec841c10279546`, `claim_97c40015bd680b6640e0efc66092a286`, `claim_317048c0d0e634cadad884f042e0fb41`, `claim_2f2826e65d051c01194cd662b5a8be9e`, `claim_1ae387c9a41cee96fc8d499dcc6fe6f9`, `claim_ea14128a766600a9a0942fcc908ff4ce`, `claim_841c0c452b31d698f08d8460a92f8925`, `claim_0d68eb897094a19d27659cf0925e8da3`, `claim_9d1e7b76bcbf3b0fcf5e0edcdf130653`, `claim_88c428b7e894b8c99ecc7231259db834`, `claim_57cd483e44658aa1583e968cc86e8ab9`, `claim_d4ad966e412c3a12848ec1b573664699`, `claim_683108aca3e656fed37a3c814155cab2`, `claim_1f3e0eb3acc3bc476ddf81b58b8c9976`, `claim_d590be5f9d8551d9b4290c296c4e059a`, `claim_00f11cd8215f5649d5ef7bcb34bdb737`, `claim_d060f9dfcce5f534cfa957c4245ac9e1`, `claim_919ee8461ba273f0a132459b308ab3ff`.

Absent-target rows (0): none.

This pack has 52 Weak-exact/Judgment rows; reviewer independently draws/records at least 10 by seed (>=15%, minimum 10, all if fewer), plus every differing pair listed above. Each verdict note says deep or mechanical. If >3% of deep-read rows need rework, deeply read the complete pack before reporting. Author selected no sample. Whole batch: 300 Unit-exact, 392 Weak-exact, 134 Judgment, all 826 pending; 123 mandatory differing pairs. The 79-row batch-wide lower bound does not replace each pack minimum.

Reverse review: the separate native candidate-unverified request/list covers the complete scoped population; it is not reset per sliced pack. Full shown text hashes below bind payload separately from native heading identity digests.

## claim_360bac2add48bf0a2a49e7af1f87e903

Source: `docs/architect/component-boundary/README.md#component-boundary-architecture`. Target: `docs/platform/component-boundary.md#component-boundary-architecture`.

Mechanical class: Judgment. Source digest: `daeb933bbf407e7672a26c307056eb550a0bf0eace00d53719c6dc22e9b2cb71`. Target digest: `8ea5d5f25f0420342051d060df79e99f43de87cabdac6589a7c476173e7e3ecc`.

Full shown source SHA256: `370daf4619db48d3017a54124c60352782aa55711f5c69d76d64fa8bc6f74a63`. Full shown target SHA256: `ad944b1108583cd9210899dfeaef4c9bd86b2e2f730201f1827c1ec930d86fcf`.

### Proposed decision

```json
{
  "claimId": "claim_360bac2add48bf0a2a49e7af1f87e903",
  "sourceUnitDigest": "daeb933bbf407e7672a26c307056eb550a0bf0eace00d53719c6dc22e9b2cb71",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "component-boundary-architecture",
  "targetUnitDigest": "8ea5d5f25f0420342051d060df79e99f43de87cabdac6589a7c476173e7e3ecc",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: README source carriage"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Judgment: no target digest match. Carry the complete heading at docs/architect/component-boundary/README.md#component-boundary-architecture (lines 1–1) into docs/platform/component-boundary.md#component-boundary-architecture (lines 1154–1154), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. Digest differences come only from the recorded candidate header/frontmatter fence, heading-level shift or physical relative-link rebasing; full before/after units and line mapping are in authoring accounting. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
# Component Boundary Architecture

This folder collects vision-level architecture notes about how fgOS should name,
separate, and eventually place its high-level components across the whole
system.

These documents are not implementation plans. They are refactoring compass
documents: use them to keep slices moving toward clearer boundaries without
forcing a large rebuild.

The scope is all of forgentX: Work Lifecycle, domain components,
dispatch/execution, result evaluation, host surfaces, setup/doctor/distribution,
gateway/Herdr, learning, and runtime implementation boundaries.

For the domain-specific split itself, read
[Domainization Architecture](../domainization/README.md). This folder keeps the
whole-system component map; domainization is the deep dive for the Domain
Components And Extension Layer.
```

### Full target shown text

```text
### Component Boundary Architecture

This folder collects vision-level architecture notes about how fgOS should name,
separate, and eventually place its high-level components across the whole
system.

These documents are not implementation plans. They are refactoring compass
documents: use them to keep slices moving toward clearer boundaries without
forcing a large rebuild.

The scope is all of forgentX: Work Lifecycle, domain components,
dispatch/execution, result evaluation, host surfaces, setup/doctor/distribution,
gateway/Herdr, learning, and runtime implementation boundaries.

For the domain-specific split itself, read
[Domainization Architecture](../architect/domainization/README.md). This folder keeps the
whole-system component map; domainization is the deep dive for the Domain
Components And Extension Layer.
```

### Unified diff

```diff
--- docs/architect/component-boundary/README.md#component-boundary-architecture
+++ docs/platform/component-boundary.md#component-boundary-architecture
@@ -1,4 +1,4 @@
-# Component Boundary Architecture
+### Component Boundary Architecture
 
 This folder collects vision-level architecture notes about how fgOS should name,
 separate, and eventually place its high-level components across the whole
@@ -13,6 +13,6 @@
 gateway/Herdr, learning, and runtime implementation boundaries.
 
 For the domain-specific split itself, read
-[Domainization Architecture](../domainization/README.md). This folder keeps the
+[Domainization Architecture](../architect/domainization/README.md). This folder keeps the
 whole-system component map; domainization is the deep dive for the Domain
 Components And Extension Layer.

```

## claim_5cba6fa874b39710beebf2ab34824909

Source: `docs/architect/component-boundary/README.md#unheaded-block-1`. Target: `docs/platform/component-boundary.md#unheaded-block-160`.

Mechanical class: Weak-exact. Source digest: `19135f799ed3ec60d7da1ea132c13fab7545b9f30883380678d74284eb2201c1`. Target digest: `19135f799ed3ec60d7da1ea132c13fab7545b9f30883380678d74284eb2201c1`.

Full shown source SHA256: `19135f799ed3ec60d7da1ea132c13fab7545b9f30883380678d74284eb2201c1`. Full shown target SHA256: `19135f799ed3ec60d7da1ea132c13fab7545b9f30883380678d74284eb2201c1`.

### Proposed decision

```json
{
  "claimId": "claim_5cba6fa874b39710beebf2ab34824909",
  "sourceUnitDigest": "19135f799ed3ec60d7da1ea132c13fab7545b9f30883380678d74284eb2201c1",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-160",
  "targetUnitDigest": "19135f799ed3ec60d7da1ea132c13fab7545b9f30883380678d74284eb2201c1",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: README source carriage",
    "Component Boundary Architecture"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/README.md#unheaded-block-1 (lines 3–5) into docs/platform/component-boundary.md#unheaded-block-160 (lines 1156–1158), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
This folder collects vision-level architecture notes about how fgOS should name,
separate, and eventually place its high-level components across the whole
system.
```

### Full target shown text

```text
This folder collects vision-level architecture notes about how fgOS should name,
separate, and eventually place its high-level components across the whole
system.
```

### Unified diff

```diff
No text difference.
```

## claim_9aa75d68c36bea18cf766d3ccc0a103e

Source: `docs/architect/component-boundary/README.md#unheaded-block-2`. Target: `docs/platform/component-boundary.md#unheaded-block-161`.

Mechanical class: Weak-exact. Source digest: `0bc4b93b1cfb3bba817a53834c3877f3d224c893a72e99ed8df2d2d0a993fca6`. Target digest: `0bc4b93b1cfb3bba817a53834c3877f3d224c893a72e99ed8df2d2d0a993fca6`.

Full shown source SHA256: `0bc4b93b1cfb3bba817a53834c3877f3d224c893a72e99ed8df2d2d0a993fca6`. Full shown target SHA256: `0bc4b93b1cfb3bba817a53834c3877f3d224c893a72e99ed8df2d2d0a993fca6`.

### Proposed decision

```json
{
  "claimId": "claim_9aa75d68c36bea18cf766d3ccc0a103e",
  "sourceUnitDigest": "0bc4b93b1cfb3bba817a53834c3877f3d224c893a72e99ed8df2d2d0a993fca6",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-161",
  "targetUnitDigest": "0bc4b93b1cfb3bba817a53834c3877f3d224c893a72e99ed8df2d2d0a993fca6",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: README source carriage",
    "Component Boundary Architecture"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/README.md#unheaded-block-2 (lines 7–9) into docs/platform/component-boundary.md#unheaded-block-161 (lines 1160–1162), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
These documents are not implementation plans. They are refactoring compass
documents: use them to keep slices moving toward clearer boundaries without
forcing a large rebuild.
```

### Full target shown text

```text
These documents are not implementation plans. They are refactoring compass
documents: use them to keep slices moving toward clearer boundaries without
forcing a large rebuild.
```

### Unified diff

```diff
No text difference.
```

## claim_2094b9effbdcfb3aae60eeb22c9abe2f

Source: `docs/architect/component-boundary/README.md#unheaded-block-3`. Target: `docs/platform/component-boundary.md#unheaded-block-162`.

Mechanical class: Weak-exact. Source digest: `e661ee55798ab87f7b84a3df84275608074bd198e59df3c06b05d3d2aeb60636`. Target digest: `e661ee55798ab87f7b84a3df84275608074bd198e59df3c06b05d3d2aeb60636`.

Full shown source SHA256: `e661ee55798ab87f7b84a3df84275608074bd198e59df3c06b05d3d2aeb60636`. Full shown target SHA256: `e661ee55798ab87f7b84a3df84275608074bd198e59df3c06b05d3d2aeb60636`.

### Proposed decision

```json
{
  "claimId": "claim_2094b9effbdcfb3aae60eeb22c9abe2f",
  "sourceUnitDigest": "e661ee55798ab87f7b84a3df84275608074bd198e59df3c06b05d3d2aeb60636",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-162",
  "targetUnitDigest": "e661ee55798ab87f7b84a3df84275608074bd198e59df3c06b05d3d2aeb60636",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: README source carriage",
    "Component Boundary Architecture"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/README.md#unheaded-block-3 (lines 11–13) into docs/platform/component-boundary.md#unheaded-block-162 (lines 1164–1166), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
The scope is all of forgentX: Work Lifecycle, domain components,
dispatch/execution, result evaluation, host surfaces, setup/doctor/distribution,
gateway/Herdr, learning, and runtime implementation boundaries.
```

### Full target shown text

```text
The scope is all of forgentX: Work Lifecycle, domain components,
dispatch/execution, result evaluation, host surfaces, setup/doctor/distribution,
gateway/Herdr, learning, and runtime implementation boundaries.
```

### Unified diff

```diff
No text difference.
```

## claim_5e9da3a2297ea0810b77633e4e384725

Source: `docs/architect/component-boundary/README.md#unheaded-block-4`. Target: `docs/platform/component-boundary.md#unheaded-block-163`.

Mechanical class: Judgment. Source digest: `290894187323ba1f1d2d89a2f29ddac053d7f4b9a6a211065e1c98150113bcc6`. Target digest: `6d91f582129f4e2fa84190ca8fca9eb2e1621eadc48ed9b9689076be59e2d559`.

Full shown source SHA256: `290894187323ba1f1d2d89a2f29ddac053d7f4b9a6a211065e1c98150113bcc6`. Full shown target SHA256: `6d91f582129f4e2fa84190ca8fca9eb2e1621eadc48ed9b9689076be59e2d559`.

### Proposed decision

```json
{
  "claimId": "claim_5e9da3a2297ea0810b77633e4e384725",
  "sourceUnitDigest": "290894187323ba1f1d2d89a2f29ddac053d7f4b9a6a211065e1c98150113bcc6",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-163",
  "targetUnitDigest": "6d91f582129f4e2fa84190ca8fca9eb2e1621eadc48ed9b9689076be59e2d559",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: README source carriage",
    "Component Boundary Architecture"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Judgment: no target digest match. Carry the complete unheaded-block at docs/architect/component-boundary/README.md#unheaded-block-4 (lines 15–18) into docs/platform/component-boundary.md#unheaded-block-163 (lines 1168–1171), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. Digest differences come only from the recorded candidate header/frontmatter fence, heading-level shift or physical relative-link rebasing; full before/after units and line mapping are in authoring accounting. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
For the domain-specific split itself, read
[Domainization Architecture](../domainization/README.md). This folder keeps the
whole-system component map; domainization is the deep dive for the Domain
Components And Extension Layer.
```

### Full target shown text

```text
For the domain-specific split itself, read
[Domainization Architecture](../architect/domainization/README.md). This folder keeps the
whole-system component map; domainization is the deep dive for the Domain
Components And Extension Layer.
```

### Unified diff

```diff
--- docs/architect/component-boundary/README.md#unheaded-block-4
+++ docs/platform/component-boundary.md#unheaded-block-163
@@ -1,4 +1,4 @@
 For the domain-specific split itself, read
-[Domainization Architecture](../domainization/README.md). This folder keeps the
+[Domainization Architecture](../architect/domainization/README.md). This folder keeps the
 whole-system component map; domainization is the deep dive for the Domain
 Components And Extension Layer.

```

## claim_c8d98c0008701e264eca755e375bf49f

Source: `docs/architect/component-boundary/README.md#1-how-to-read-this-folder`. Target: `docs/platform/component-boundary.md#1-how-to-read-this-folder`.

Mechanical class: Judgment. Source digest: `0a12d2aaeb3b5ead1732e3af0f672b8dd90b88744d357dc43b7660420b5ad0b2`. Target digest: `b12bf8185a361bfd625a3554d721329b7b7c6d91c431a73b5459c003033a4304`.

Full shown source SHA256: `9a467d808ac1dd0361a99bd3bf99dd2c5e8e7db02cb9b68a357f589dfa03c3b7`. Full shown target SHA256: `0fe8817ca7d0140b502a18e0ea836543fa19c7f97022dc6bce973e88ffbc10e4`.

### Proposed decision

```json
{
  "claimId": "claim_c8d98c0008701e264eca755e375bf49f",
  "sourceUnitDigest": "0a12d2aaeb3b5ead1732e3af0f672b8dd90b88744d357dc43b7660420b5ad0b2",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "1-how-to-read-this-folder",
  "targetUnitDigest": "b12bf8185a361bfd625a3554d721329b7b7c6d91c431a73b5459c003033a4304",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: README source carriage",
    "Component Boundary Architecture"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Judgment: no target digest match. Carry the complete heading at docs/architect/component-boundary/README.md#1-how-to-read-this-folder (lines 20–20) into docs/platform/component-boundary.md#1-how-to-read-this-folder (lines 1173–1173), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. Digest differences come only from the recorded candidate header/frontmatter fence, heading-level shift or physical relative-link rebasing; full before/after units and line mapping are in authoring accounting. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

````text
## 1. How To Read This Folder

Read boundary before layout:

1. [Component Boundary Advisory](./component-boundary-advisory.md)
2. [Repo Layout Vision](./repo-layout-vision.md)
3. [Host Invocation And Provider Routing](../host-invocation-routing/host-invocation-provider-routing.md)
4. [Node To Rust Component Migration](../host-invocation-routing/node-to-rust-component-migration.md)
5. [Packaging And Distribution Architecture](../packaging-distribution/README.md)

The first document answers:

```txt
What components exist?
What responsibility does each component own?
Where are the bounded contexts?
Which component has authority over each state transition or decision?
Which behavior must stay domain-specific instead of moving into foundation?
```

The second document answers:

```txt
Where should those components live physically in the repo?
Which code should be a thin app entrypoint?
Which code should become a reusable package?
Which source paths are placement, not architectural ownership?
```

The third document answers:

```txt
How do CLI and remote host use cases enter the same semantic operation path?
How does one router select built-in, legacy, process-plugin, or WASM providers?
Where do provider discovery, capability grants, and failure normalization live?
```

The fourth document answers:

```txt
How can one component at a time move from Node to Rust?
Which parts of fgos are already thin, partly thin, or not thin yet?
How does fgos keep the same CLI and envelope while implementation changes?
How does the Rust host delegate whole operations to the legacy Node provider?
When does implementation movement become authority movement?
```

The fifth document answers:

```txt
How is the project-local fgOS runtime payload selected, installed, verified,
repaired, and upgraded?
Where is the boundary between global bootstrap, shared web/gateway, project
runtime adapter, and local project fgOS semantics?
How do skills, agents, prose, runner, legacy Node payload, Rust host, and docs
fit into one distributable payload identity?
```

Do not invert that order. Folder layout should express component boundaries; it
should not create authority by convenience of file location.
````

### Full target shown text

````text
#### 1. How To Read This Folder

Read boundary before layout:

1. [Component Boundary Advisory](../architect/component-boundary/component-boundary-advisory.md)
2. [Repo Layout Vision](../architect/component-boundary/repo-layout-vision.md)
3. [Host Invocation And Provider Routing](../architect/host-invocation-routing/host-invocation-provider-routing.md)
4. [Node To Rust Component Migration](../architect/host-invocation-routing/node-to-rust-component-migration.md)
5. [Packaging And Distribution Architecture](../architect/packaging-distribution/README.md)

The first document answers:

```txt
What components exist?
What responsibility does each component own?
Where are the bounded contexts?
Which component has authority over each state transition or decision?
Which behavior must stay domain-specific instead of moving into foundation?
```

The second document answers:

```txt
Where should those components live physically in the repo?
Which code should be a thin app entrypoint?
Which code should become a reusable package?
Which source paths are placement, not architectural ownership?
```

The third document answers:

```txt
How do CLI and remote host use cases enter the same semantic operation path?
How does one router select built-in, legacy, process-plugin, or WASM providers?
Where do provider discovery, capability grants, and failure normalization live?
```

The fourth document answers:

```txt
How can one component at a time move from Node to Rust?
Which parts of fgos are already thin, partly thin, or not thin yet?
How does fgos keep the same CLI and envelope while implementation changes?
How does the Rust host delegate whole operations to the legacy Node provider?
When does implementation movement become authority movement?
```

The fifth document answers:

```txt
How is the project-local fgOS runtime payload selected, installed, verified,
repaired, and upgraded?
Where is the boundary between global bootstrap, shared web/gateway, project
runtime adapter, and local project fgOS semantics?
How do skills, agents, prose, runner, legacy Node payload, Rust host, and docs
fit into one distributable payload identity?
```

Do not invert that order. Folder layout should express component boundaries; it
should not create authority by convenience of file location.
````

### Unified diff

```diff
--- docs/architect/component-boundary/README.md#1-how-to-read-this-folder
+++ docs/platform/component-boundary.md#1-how-to-read-this-folder
@@ -1,12 +1,12 @@
-## 1. How To Read This Folder
+#### 1. How To Read This Folder
 
 Read boundary before layout:
 
-1. [Component Boundary Advisory](./component-boundary-advisory.md)
-2. [Repo Layout Vision](./repo-layout-vision.md)
-3. [Host Invocation And Provider Routing](../host-invocation-routing/host-invocation-provider-routing.md)
-4. [Node To Rust Component Migration](../host-invocation-routing/node-to-rust-component-migration.md)
-5. [Packaging And Distribution Architecture](../packaging-distribution/README.md)
+1. [Component Boundary Advisory](../architect/component-boundary/component-boundary-advisory.md)
+2. [Repo Layout Vision](../architect/component-boundary/repo-layout-vision.md)
+3. [Host Invocation And Provider Routing](../architect/host-invocation-routing/host-invocation-provider-routing.md)
+4. [Node To Rust Component Migration](../architect/host-invocation-routing/node-to-rust-component-migration.md)
+5. [Packaging And Distribution Architecture](../architect/packaging-distribution/README.md)
 
 The first document answers:
 

```

## claim_9dda3f43258c741830447e1f10a72fd8

Source: `docs/architect/component-boundary/README.md#unheaded-block-5`. Target: `docs/platform/component-boundary.md#unheaded-block-164`.

Mechanical class: Weak-exact. Source digest: `d502c9085325bc99f244af24c20979635885deedbe201ee7eedc972e716cbe7e`. Target digest: `d502c9085325bc99f244af24c20979635885deedbe201ee7eedc972e716cbe7e`.

Full shown source SHA256: `d502c9085325bc99f244af24c20979635885deedbe201ee7eedc972e716cbe7e`. Full shown target SHA256: `d502c9085325bc99f244af24c20979635885deedbe201ee7eedc972e716cbe7e`.

### Proposed decision

```json
{
  "claimId": "claim_9dda3f43258c741830447e1f10a72fd8",
  "sourceUnitDigest": "d502c9085325bc99f244af24c20979635885deedbe201ee7eedc972e716cbe7e",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-164",
  "targetUnitDigest": "d502c9085325bc99f244af24c20979635885deedbe201ee7eedc972e716cbe7e",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: README source carriage",
    "Component Boundary Architecture",
    "1. How To Read This Folder"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ; source unit shorter than 40 characters. Carry the complete unheaded-block at docs/architect/component-boundary/README.md#unheaded-block-5 (lines 22–22) into docs/platform/component-boundary.md#unheaded-block-164 (lines 1175–1175), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
Read boundary before layout:
```

### Full target shown text

```text
Read boundary before layout:
```

### Unified diff

```diff
No text difference.
```

## claim_c8d61d6eb9aba8dcc3ec841c10279546

Source: `docs/architect/component-boundary/README.md#unheaded-block-6`. Target: `docs/platform/component-boundary.md#unheaded-block-165`.

Mechanical class: Judgment. Source digest: `37411f226aa68407dcbbe9815c804fe174c5b135006fed1afba81a571b0bce00`. Target digest: `881d146490056748986914791cf60ca4bece0757e5a88e4f69399f0a1415c7a1`.

Full shown source SHA256: `37411f226aa68407dcbbe9815c804fe174c5b135006fed1afba81a571b0bce00`. Full shown target SHA256: `881d146490056748986914791cf60ca4bece0757e5a88e4f69399f0a1415c7a1`.

### Proposed decision

```json
{
  "claimId": "claim_c8d61d6eb9aba8dcc3ec841c10279546",
  "sourceUnitDigest": "37411f226aa68407dcbbe9815c804fe174c5b135006fed1afba81a571b0bce00",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-165",
  "targetUnitDigest": "881d146490056748986914791cf60ca4bece0757e5a88e4f69399f0a1415c7a1",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: README source carriage",
    "Component Boundary Architecture",
    "1. How To Read This Folder"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Judgment: no target digest match. Carry the complete unheaded-block at docs/architect/component-boundary/README.md#unheaded-block-6 (lines 24–28) into docs/platform/component-boundary.md#unheaded-block-165 (lines 1177–1181), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. Digest differences come only from the recorded candidate header/frontmatter fence, heading-level shift or physical relative-link rebasing; full before/after units and line mapping are in authoring accounting. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
1. [Component Boundary Advisory](./component-boundary-advisory.md)
2. [Repo Layout Vision](./repo-layout-vision.md)
3. [Host Invocation And Provider Routing](../host-invocation-routing/host-invocation-provider-routing.md)
4. [Node To Rust Component Migration](../host-invocation-routing/node-to-rust-component-migration.md)
5. [Packaging And Distribution Architecture](../packaging-distribution/README.md)
```

### Full target shown text

```text
1. [Component Boundary Advisory](../architect/component-boundary/component-boundary-advisory.md)
2. [Repo Layout Vision](../architect/component-boundary/repo-layout-vision.md)
3. [Host Invocation And Provider Routing](../architect/host-invocation-routing/host-invocation-provider-routing.md)
4. [Node To Rust Component Migration](../architect/host-invocation-routing/node-to-rust-component-migration.md)
5. [Packaging And Distribution Architecture](../architect/packaging-distribution/README.md)
```

### Unified diff

```diff
--- docs/architect/component-boundary/README.md#unheaded-block-6
+++ docs/platform/component-boundary.md#unheaded-block-165
@@ -1,5 +1,5 @@
-1. [Component Boundary Advisory](./component-boundary-advisory.md)
-2. [Repo Layout Vision](./repo-layout-vision.md)
-3. [Host Invocation And Provider Routing](../host-invocation-routing/host-invocation-provider-routing.md)
-4. [Node To Rust Component Migration](../host-invocation-routing/node-to-rust-component-migration.md)
-5. [Packaging And Distribution Architecture](../packaging-distribution/README.md)
+1. [Component Boundary Advisory](../architect/component-boundary/component-boundary-advisory.md)
+2. [Repo Layout Vision](../architect/component-boundary/repo-layout-vision.md)
+3. [Host Invocation And Provider Routing](../architect/host-invocation-routing/host-invocation-provider-routing.md)
+4. [Node To Rust Component Migration](../architect/host-invocation-routing/node-to-rust-component-migration.md)
+5. [Packaging And Distribution Architecture](../architect/packaging-distribution/README.md)

```

## claim_c54e55e6e9ae2a4dd7d365ba03c5a421

Source: `docs/architect/component-boundary/README.md#unheaded-block-7`. Target: `docs/platform/component-boundary.md#unheaded-block-166`.

Mechanical class: Weak-exact. Source digest: `b9b6c198748ec3983b3b0fb097618b8b200bb77ad2ae2cccbed9e09eb1b91b13`. Target digest: `b9b6c198748ec3983b3b0fb097618b8b200bb77ad2ae2cccbed9e09eb1b91b13`.

Full shown source SHA256: `b9b6c198748ec3983b3b0fb097618b8b200bb77ad2ae2cccbed9e09eb1b91b13`. Full shown target SHA256: `b9b6c198748ec3983b3b0fb097618b8b200bb77ad2ae2cccbed9e09eb1b91b13`.

### Proposed decision

```json
{
  "claimId": "claim_c54e55e6e9ae2a4dd7d365ba03c5a421",
  "sourceUnitDigest": "b9b6c198748ec3983b3b0fb097618b8b200bb77ad2ae2cccbed9e09eb1b91b13",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-166",
  "targetUnitDigest": "b9b6c198748ec3983b3b0fb097618b8b200bb77ad2ae2cccbed9e09eb1b91b13",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: README source carriage",
    "Component Boundary Architecture",
    "1. How To Read This Folder"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ; source unit shorter than 40 characters. Carry the complete unheaded-block at docs/architect/component-boundary/README.md#unheaded-block-7 (lines 30–30) into docs/platform/component-boundary.md#unheaded-block-166 (lines 1183–1183), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
The first document answers:
```

### Full target shown text

```text
The first document answers:
```

### Unified diff

```diff
No text difference.
```

## claim_750796b88a0ab406b63aa1a8353b9a0d

Source: `docs/architect/component-boundary/README.md#unheaded-block-8`. Target: `docs/platform/component-boundary.md#unheaded-block-167`.

Mechanical class: Weak-exact. Source digest: `f74695a91194175b0ebe6d4def9e454104f2fff55db0b040d5a652b21a5b56a7`. Target digest: `f74695a91194175b0ebe6d4def9e454104f2fff55db0b040d5a652b21a5b56a7`.

Full shown source SHA256: `f74695a91194175b0ebe6d4def9e454104f2fff55db0b040d5a652b21a5b56a7`. Full shown target SHA256: `f74695a91194175b0ebe6d4def9e454104f2fff55db0b040d5a652b21a5b56a7`.

### Proposed decision

```json
{
  "claimId": "claim_750796b88a0ab406b63aa1a8353b9a0d",
  "sourceUnitDigest": "f74695a91194175b0ebe6d4def9e454104f2fff55db0b040d5a652b21a5b56a7",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-167",
  "targetUnitDigest": "f74695a91194175b0ebe6d4def9e454104f2fff55db0b040d5a652b21a5b56a7",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: README source carriage",
    "Component Boundary Architecture",
    "1. How To Read This Folder"
  ],
  "claimKind": "decision",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/README.md#unheaded-block-8 (lines 32–38) into docs/platform/component-boundary.md#unheaded-block-167 (lines 1185–1191), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

````text
```txt
What components exist?
What responsibility does each component own?
Where are the bounded contexts?
Which component has authority over each state transition or decision?
Which behavior must stay domain-specific instead of moving into foundation?
```
````

### Full target shown text

````text
```txt
What components exist?
What responsibility does each component own?
Where are the bounded contexts?
Which component has authority over each state transition or decision?
Which behavior must stay domain-specific instead of moving into foundation?
```
````

### Unified diff

```diff
No text difference.
```

## claim_b93487e7e6b7d234fe5fcb7811ad0fa7

Source: `docs/architect/component-boundary/README.md#unheaded-block-9`. Target: `docs/platform/component-boundary.md#unheaded-block-168`.

Mechanical class: Weak-exact. Source digest: `d39e4b5b9f8a2c4ff073d1e9a7ee0ee143f0fe451c9363b1e40b2174945a1b59`. Target digest: `d39e4b5b9f8a2c4ff073d1e9a7ee0ee143f0fe451c9363b1e40b2174945a1b59`.

Full shown source SHA256: `d39e4b5b9f8a2c4ff073d1e9a7ee0ee143f0fe451c9363b1e40b2174945a1b59`. Full shown target SHA256: `d39e4b5b9f8a2c4ff073d1e9a7ee0ee143f0fe451c9363b1e40b2174945a1b59`.

### Proposed decision

```json
{
  "claimId": "claim_b93487e7e6b7d234fe5fcb7811ad0fa7",
  "sourceUnitDigest": "d39e4b5b9f8a2c4ff073d1e9a7ee0ee143f0fe451c9363b1e40b2174945a1b59",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-168",
  "targetUnitDigest": "d39e4b5b9f8a2c4ff073d1e9a7ee0ee143f0fe451c9363b1e40b2174945a1b59",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: README source carriage",
    "Component Boundary Architecture",
    "1. How To Read This Folder"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ; source unit shorter than 40 characters. Carry the complete unheaded-block at docs/architect/component-boundary/README.md#unheaded-block-9 (lines 40–40) into docs/platform/component-boundary.md#unheaded-block-168 (lines 1193–1193), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
The second document answers:
```

### Full target shown text

```text
The second document answers:
```

### Unified diff

```diff
No text difference.
```

## claim_d120c13f7e76aeb205ef250711b86be9

Source: `docs/architect/component-boundary/README.md#unheaded-block-10`. Target: `docs/platform/component-boundary.md#unheaded-block-169`.

Mechanical class: Weak-exact. Source digest: `403ff071ce2d9781a13267023bc018142c83a0121b22fcd65787600af218aee0`. Target digest: `403ff071ce2d9781a13267023bc018142c83a0121b22fcd65787600af218aee0`.

Full shown source SHA256: `403ff071ce2d9781a13267023bc018142c83a0121b22fcd65787600af218aee0`. Full shown target SHA256: `403ff071ce2d9781a13267023bc018142c83a0121b22fcd65787600af218aee0`.

### Proposed decision

```json
{
  "claimId": "claim_d120c13f7e76aeb205ef250711b86be9",
  "sourceUnitDigest": "403ff071ce2d9781a13267023bc018142c83a0121b22fcd65787600af218aee0",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-169",
  "targetUnitDigest": "403ff071ce2d9781a13267023bc018142c83a0121b22fcd65787600af218aee0",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: README source carriage",
    "Component Boundary Architecture",
    "1. How To Read This Folder"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/README.md#unheaded-block-10 (lines 42–47) into docs/platform/component-boundary.md#unheaded-block-169 (lines 1195–1200), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

````text
```txt
Where should those components live physically in the repo?
Which code should be a thin app entrypoint?
Which code should become a reusable package?
Which source paths are placement, not architectural ownership?
```
````

### Full target shown text

````text
```txt
Where should those components live physically in the repo?
Which code should be a thin app entrypoint?
Which code should become a reusable package?
Which source paths are placement, not architectural ownership?
```
````

### Unified diff

```diff
No text difference.
```

## claim_fa13561423637cf97449f281ec43891c

Source: `docs/architect/component-boundary/README.md#unheaded-block-11`. Target: `docs/platform/component-boundary.md#unheaded-block-170`.

Mechanical class: Weak-exact. Source digest: `797187949ae63ddb5c42e3b0bf8df573c9a2358d4fc2add04edfd79567acf835`. Target digest: `797187949ae63ddb5c42e3b0bf8df573c9a2358d4fc2add04edfd79567acf835`.

Full shown source SHA256: `797187949ae63ddb5c42e3b0bf8df573c9a2358d4fc2add04edfd79567acf835`. Full shown target SHA256: `797187949ae63ddb5c42e3b0bf8df573c9a2358d4fc2add04edfd79567acf835`.

### Proposed decision

```json
{
  "claimId": "claim_fa13561423637cf97449f281ec43891c",
  "sourceUnitDigest": "797187949ae63ddb5c42e3b0bf8df573c9a2358d4fc2add04edfd79567acf835",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-170",
  "targetUnitDigest": "797187949ae63ddb5c42e3b0bf8df573c9a2358d4fc2add04edfd79567acf835",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: README source carriage",
    "Component Boundary Architecture",
    "1. How To Read This Folder"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ; source unit shorter than 40 characters. Carry the complete unheaded-block at docs/architect/component-boundary/README.md#unheaded-block-11 (lines 49–49) into docs/platform/component-boundary.md#unheaded-block-170 (lines 1202–1202), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
The third document answers:
```

### Full target shown text

```text
The third document answers:
```

### Unified diff

```diff
No text difference.
```

## claim_0d81116040bb14965e0dfa2e9d194e34

Source: `docs/architect/component-boundary/README.md#unheaded-block-12`. Target: `docs/platform/component-boundary.md#unheaded-block-171`.

Mechanical class: Weak-exact. Source digest: `b973706c156fe222b069bd657d5d6bcde95f50d98a14ad4820ea113403f05098`. Target digest: `b973706c156fe222b069bd657d5d6bcde95f50d98a14ad4820ea113403f05098`.

Full shown source SHA256: `b973706c156fe222b069bd657d5d6bcde95f50d98a14ad4820ea113403f05098`. Full shown target SHA256: `b973706c156fe222b069bd657d5d6bcde95f50d98a14ad4820ea113403f05098`.

### Proposed decision

```json
{
  "claimId": "claim_0d81116040bb14965e0dfa2e9d194e34",
  "sourceUnitDigest": "b973706c156fe222b069bd657d5d6bcde95f50d98a14ad4820ea113403f05098",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-171",
  "targetUnitDigest": "b973706c156fe222b069bd657d5d6bcde95f50d98a14ad4820ea113403f05098",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: README source carriage",
    "Component Boundary Architecture",
    "1. How To Read This Folder"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/README.md#unheaded-block-12 (lines 51–55) into docs/platform/component-boundary.md#unheaded-block-171 (lines 1204–1208), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

````text
```txt
How do CLI and remote host use cases enter the same semantic operation path?
How does one router select built-in, legacy, process-plugin, or WASM providers?
Where do provider discovery, capability grants, and failure normalization live?
```
````

### Full target shown text

````text
```txt
How do CLI and remote host use cases enter the same semantic operation path?
How does one router select built-in, legacy, process-plugin, or WASM providers?
Where do provider discovery, capability grants, and failure normalization live?
```
````

### Unified diff

```diff
No text difference.
```

## claim_533b0c15729ee7e25f036b86e4be93b0

Source: `docs/architect/component-boundary/README.md#unheaded-block-13`. Target: `docs/platform/component-boundary.md#unheaded-block-172`.

Mechanical class: Weak-exact. Source digest: `73b56654cb052ff03a1ad2a5aaabc0694145d4c933c33339cbed4511014e3a08`. Target digest: `73b56654cb052ff03a1ad2a5aaabc0694145d4c933c33339cbed4511014e3a08`.

Full shown source SHA256: `73b56654cb052ff03a1ad2a5aaabc0694145d4c933c33339cbed4511014e3a08`. Full shown target SHA256: `73b56654cb052ff03a1ad2a5aaabc0694145d4c933c33339cbed4511014e3a08`.

### Proposed decision

```json
{
  "claimId": "claim_533b0c15729ee7e25f036b86e4be93b0",
  "sourceUnitDigest": "73b56654cb052ff03a1ad2a5aaabc0694145d4c933c33339cbed4511014e3a08",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-172",
  "targetUnitDigest": "73b56654cb052ff03a1ad2a5aaabc0694145d4c933c33339cbed4511014e3a08",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: README source carriage",
    "Component Boundary Architecture",
    "1. How To Read This Folder"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ; source unit shorter than 40 characters. Carry the complete unheaded-block at docs/architect/component-boundary/README.md#unheaded-block-13 (lines 57–57) into docs/platform/component-boundary.md#unheaded-block-172 (lines 1210–1210), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
The fourth document answers:
```

### Full target shown text

```text
The fourth document answers:
```

### Unified diff

```diff
No text difference.
```

## claim_23709cd9c32cdd8339294c0b372822d0

Source: `docs/architect/component-boundary/README.md#unheaded-block-14`. Target: `docs/platform/component-boundary.md#unheaded-block-173`.

Mechanical class: Weak-exact. Source digest: `48596c41b91763c313fe61f1e93688a9cfe37d92fcdc28578b544a0fb86e3766`. Target digest: `48596c41b91763c313fe61f1e93688a9cfe37d92fcdc28578b544a0fb86e3766`.

Full shown source SHA256: `48596c41b91763c313fe61f1e93688a9cfe37d92fcdc28578b544a0fb86e3766`. Full shown target SHA256: `48596c41b91763c313fe61f1e93688a9cfe37d92fcdc28578b544a0fb86e3766`.

### Proposed decision

```json
{
  "claimId": "claim_23709cd9c32cdd8339294c0b372822d0",
  "sourceUnitDigest": "48596c41b91763c313fe61f1e93688a9cfe37d92fcdc28578b544a0fb86e3766",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-173",
  "targetUnitDigest": "48596c41b91763c313fe61f1e93688a9cfe37d92fcdc28578b544a0fb86e3766",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: README source carriage",
    "Component Boundary Architecture",
    "1. How To Read This Folder"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/README.md#unheaded-block-14 (lines 59–65) into docs/platform/component-boundary.md#unheaded-block-173 (lines 1212–1218), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

````text
```txt
How can one component at a time move from Node to Rust?
Which parts of fgos are already thin, partly thin, or not thin yet?
How does fgos keep the same CLI and envelope while implementation changes?
How does the Rust host delegate whole operations to the legacy Node provider?
When does implementation movement become authority movement?
```
````

### Full target shown text

````text
```txt
How can one component at a time move from Node to Rust?
Which parts of fgos are already thin, partly thin, or not thin yet?
How does fgos keep the same CLI and envelope while implementation changes?
How does the Rust host delegate whole operations to the legacy Node provider?
When does implementation movement become authority movement?
```
````

### Unified diff

```diff
No text difference.
```

## claim_8458579190fa923f1766f81f534c3c3e

Source: `docs/architect/component-boundary/README.md#unheaded-block-15`. Target: `docs/platform/component-boundary.md#unheaded-block-174`.

Mechanical class: Weak-exact. Source digest: `0e246285ffd931e2e8d66d5026627ebed177793df8289b2eb0df20dad76fd136`. Target digest: `0e246285ffd931e2e8d66d5026627ebed177793df8289b2eb0df20dad76fd136`.

Full shown source SHA256: `0e246285ffd931e2e8d66d5026627ebed177793df8289b2eb0df20dad76fd136`. Full shown target SHA256: `0e246285ffd931e2e8d66d5026627ebed177793df8289b2eb0df20dad76fd136`.

### Proposed decision

```json
{
  "claimId": "claim_8458579190fa923f1766f81f534c3c3e",
  "sourceUnitDigest": "0e246285ffd931e2e8d66d5026627ebed177793df8289b2eb0df20dad76fd136",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-174",
  "targetUnitDigest": "0e246285ffd931e2e8d66d5026627ebed177793df8289b2eb0df20dad76fd136",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: README source carriage",
    "Component Boundary Architecture",
    "1. How To Read This Folder"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ; source unit shorter than 40 characters. Carry the complete unheaded-block at docs/architect/component-boundary/README.md#unheaded-block-15 (lines 67–67) into docs/platform/component-boundary.md#unheaded-block-174 (lines 1220–1220), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
The fifth document answers:
```

### Full target shown text

```text
The fifth document answers:
```

### Unified diff

```diff
No text difference.
```

## claim_3f6430d4f351a7523abcc7867bafb7fe

Source: `docs/architect/component-boundary/README.md#unheaded-block-16`. Target: `docs/platform/component-boundary.md#unheaded-block-175`.

Mechanical class: Weak-exact. Source digest: `0b61e6b2a77c566443420395ded709d5f2903de8f000a0099311bbd8805201f0`. Target digest: `0b61e6b2a77c566443420395ded709d5f2903de8f000a0099311bbd8805201f0`.

Full shown source SHA256: `0b61e6b2a77c566443420395ded709d5f2903de8f000a0099311bbd8805201f0`. Full shown target SHA256: `0b61e6b2a77c566443420395ded709d5f2903de8f000a0099311bbd8805201f0`.

### Proposed decision

```json
{
  "claimId": "claim_3f6430d4f351a7523abcc7867bafb7fe",
  "sourceUnitDigest": "0b61e6b2a77c566443420395ded709d5f2903de8f000a0099311bbd8805201f0",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-175",
  "targetUnitDigest": "0b61e6b2a77c566443420395ded709d5f2903de8f000a0099311bbd8805201f0",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: README source carriage",
    "Component Boundary Architecture",
    "1. How To Read This Folder"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/README.md#unheaded-block-16 (lines 69–76) into docs/platform/component-boundary.md#unheaded-block-175 (lines 1222–1229), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

````text
```txt
How is the project-local fgOS runtime payload selected, installed, verified,
repaired, and upgraded?
Where is the boundary between global bootstrap, shared web/gateway, project
runtime adapter, and local project fgOS semantics?
How do skills, agents, prose, runner, legacy Node payload, Rust host, and docs
fit into one distributable payload identity?
```
````

### Full target shown text

````text
```txt
How is the project-local fgOS runtime payload selected, installed, verified,
repaired, and upgraded?
Where is the boundary between global bootstrap, shared web/gateway, project
runtime adapter, and local project fgOS semantics?
How do skills, agents, prose, runner, legacy Node payload, Rust host, and docs
fit into one distributable payload identity?
```
````

### Unified diff

```diff
No text difference.
```

## claim_526a5af09a34f8dd43d69d38ca4d16d8

Source: `docs/architect/component-boundary/README.md#unheaded-block-17`. Target: `docs/platform/component-boundary.md#unheaded-block-176`.

Mechanical class: Weak-exact. Source digest: `3446d95f4df3808c9228d010a728595b53c5cae030e85ceb865b83e066cd727f`. Target digest: `3446d95f4df3808c9228d010a728595b53c5cae030e85ceb865b83e066cd727f`.

Full shown source SHA256: `3446d95f4df3808c9228d010a728595b53c5cae030e85ceb865b83e066cd727f`. Full shown target SHA256: `3446d95f4df3808c9228d010a728595b53c5cae030e85ceb865b83e066cd727f`.

### Proposed decision

```json
{
  "claimId": "claim_526a5af09a34f8dd43d69d38ca4d16d8",
  "sourceUnitDigest": "3446d95f4df3808c9228d010a728595b53c5cae030e85ceb865b83e066cd727f",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-176",
  "targetUnitDigest": "3446d95f4df3808c9228d010a728595b53c5cae030e85ceb865b83e066cd727f",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: README source carriage",
    "Component Boundary Architecture",
    "1. How To Read This Folder"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/README.md#unheaded-block-17 (lines 78–79) into docs/platform/component-boundary.md#unheaded-block-176 (lines 1231–1232), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
Do not invert that order. Folder layout should express component boundaries; it
should not create authority by convenience of file location.
```

### Full target shown text

```text
Do not invert that order. Folder layout should express component boundaries; it
should not create authority by convenience of file location.
```

### Unified diff

```diff
No text difference.
```

## claim_97c40015bd680b6640e0efc66092a286

Source: `docs/architect/component-boundary/README.md#2-documents`. Target: `docs/platform/component-boundary.md#2-documents`.

Mechanical class: Judgment. Source digest: `433648b7d31fffefb4b288ab5f0b9f5ebe13753ce0055ba7a6e265a28fccfc00`. Target digest: `328ff9a2b8b5b6393c7d54c156d5fccaee7a7c609267dd886494c0998ae38696`.

Full shown source SHA256: `f3babb4c9d74a23c8675e802cbf8f940e4486aeeb2ca9c90736b052ca639179c`. Full shown target SHA256: `ed395b75a6d3f6c5ddf2ed86aefe23780757a357059c07ff79b158b234feccae`.

### Proposed decision

```json
{
  "claimId": "claim_97c40015bd680b6640e0efc66092a286",
  "sourceUnitDigest": "433648b7d31fffefb4b288ab5f0b9f5ebe13753ce0055ba7a6e265a28fccfc00",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "2-documents",
  "targetUnitDigest": "328ff9a2b8b5b6393c7d54c156d5fccaee7a7c609267dd886494c0998ae38696",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: README source carriage",
    "Component Boundary Architecture"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Judgment: no target digest match. Carry the complete heading at docs/architect/component-boundary/README.md#2-documents (lines 81–81) into docs/platform/component-boundary.md#2-documents (lines 1234–1234), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. Digest differences come only from the recorded candidate header/frontmatter fence, heading-level shift or physical relative-link rebasing; full before/after units and line mapping are in authoring accounting. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
## 2. Documents
```

### Full target shown text

```text
#### 2. Documents
```

### Unified diff

```diff
--- docs/architect/component-boundary/README.md#2-documents
+++ docs/platform/component-boundary.md#2-documents
@@ -1 +1 @@
-## 2. Documents
+#### 2. Documents

```

## claim_317048c0d0e634cadad884f042e0fb41

Source: `docs/architect/component-boundary/README.md#component-boundary-advisory`. Target: `docs/platform/component-boundary.md#component-boundary-advisory`.

Mechanical class: Judgment. Source digest: `0b56c8fb2801a3bd815576022286a44a68fea2dc55ae89c90d03d71fa4b014ee`. Target digest: `e1ec95c1300a683d82998a0796dc40a32c40f080150404006fb54aea77dcb9ca`.

Full shown source SHA256: `880f632b92918c97e918014c08e2c97716732928686d3366a4e96f73ece70254`. Full shown target SHA256: `5ac1a47e55ae4169182f39e89fb76aa517f82fbd4b63478d16bd15c427950cc2`.

### Proposed decision

```json
{
  "claimId": "claim_317048c0d0e634cadad884f042e0fb41",
  "sourceUnitDigest": "0b56c8fb2801a3bd815576022286a44a68fea2dc55ae89c90d03d71fa4b014ee",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "component-boundary-advisory",
  "targetUnitDigest": "e1ec95c1300a683d82998a0796dc40a32c40f080150404006fb54aea77dcb9ca",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: README source carriage",
    "Component Boundary Architecture",
    "2. Documents"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Judgment: no target digest match. Carry the complete heading at docs/architect/component-boundary/README.md#component-boundary-advisory (lines 83–83) into docs/platform/component-boundary.md#component-boundary-advisory (lines 1236–1236), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. Digest differences come only from the recorded candidate header/frontmatter fence, heading-level shift or physical relative-link rebasing; full before/after units and line mapping are in authoring accounting. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
### Component Boundary Advisory

[component-boundary-advisory.md](./component-boundary-advisory.md) is the
vision document for component responsibility, bounded context, and authority
boundary.

It asks whether fgOS is split at the right conceptual boundaries: Work
Lifecycle, Agent Coordination, Dispatch And Execution, Run Result Evaluation,
Domain Components, Host Surfaces, setup/doctor/distribution, gateway/Herdr,
learning, and the additional boundaries already visible in code.

Use this document when deciding:

- whether a behavior belongs in foundation or a domain;
- whether Coding Domain is owning enough of its coding-specific behavior;
- whether Work Lifecycle remains domain-agnostic;
- whether Dispatch, RunResult evaluation, workflow driving, and domain harnesses
  are overlapping;
- whether a refactor is clarifying an authority boundary or merely moving
  files.

For folder-level domain authoring shape, domain manifest/workflow files,
domain-scoped doctrine, task-spec placement, skill/agent authoring sources, and
domain-siloing enforcement, use
[Domainization Architecture](../domainization/README.md).
```

### Full target shown text

```text
##### Component Boundary Advisory

[component-boundary-advisory.md](../architect/component-boundary/component-boundary-advisory.md) is the
vision document for component responsibility, bounded context, and authority
boundary.

It asks whether fgOS is split at the right conceptual boundaries: Work
Lifecycle, Agent Coordination, Dispatch And Execution, Run Result Evaluation,
Domain Components, Host Surfaces, setup/doctor/distribution, gateway/Herdr,
learning, and the additional boundaries already visible in code.

Use this document when deciding:

- whether a behavior belongs in foundation or a domain;
- whether Coding Domain is owning enough of its coding-specific behavior;
- whether Work Lifecycle remains domain-agnostic;
- whether Dispatch, RunResult evaluation, workflow driving, and domain harnesses
  are overlapping;
- whether a refactor is clarifying an authority boundary or merely moving
  files.

For folder-level domain authoring shape, domain manifest/workflow files,
domain-scoped doctrine, task-spec placement, skill/agent authoring sources, and
domain-siloing enforcement, use
[Domainization Architecture](../architect/domainization/README.md).
```

### Unified diff

```diff
--- docs/architect/component-boundary/README.md#component-boundary-advisory
+++ docs/platform/component-boundary.md#component-boundary-advisory
@@ -1,6 +1,6 @@
-### Component Boundary Advisory
+##### Component Boundary Advisory
 
-[component-boundary-advisory.md](./component-boundary-advisory.md) is the
+[component-boundary-advisory.md](../architect/component-boundary/component-boundary-advisory.md) is the
 vision document for component responsibility, bounded context, and authority
 boundary.
 
@@ -22,4 +22,4 @@
 For folder-level domain authoring shape, domain manifest/workflow files,
 domain-scoped doctrine, task-spec placement, skill/agent authoring sources, and
 domain-siloing enforcement, use
-[Domainization Architecture](../domainization/README.md).
+[Domainization Architecture](../architect/domainization/README.md).

```

## claim_2f2826e65d051c01194cd662b5a8be9e

Source: `docs/architect/component-boundary/README.md#unheaded-block-18`. Target: `docs/platform/component-boundary.md#unheaded-block-177`.

Mechanical class: Judgment. Source digest: `d47d1273d068ea891d9eb0d228e14e48a6a585de41b26d96be3a3bf57780495a`. Target digest: `a3a418d3011a365ff46381767ed5c15547ad1a33da57b7e83405010c7c659fdd`.

Full shown source SHA256: `d47d1273d068ea891d9eb0d228e14e48a6a585de41b26d96be3a3bf57780495a`. Full shown target SHA256: `a3a418d3011a365ff46381767ed5c15547ad1a33da57b7e83405010c7c659fdd`.

### Proposed decision

```json
{
  "claimId": "claim_2f2826e65d051c01194cd662b5a8be9e",
  "sourceUnitDigest": "d47d1273d068ea891d9eb0d228e14e48a6a585de41b26d96be3a3bf57780495a",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-177",
  "targetUnitDigest": "a3a418d3011a365ff46381767ed5c15547ad1a33da57b7e83405010c7c659fdd",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: README source carriage",
    "Component Boundary Architecture",
    "2. Documents",
    "Component Boundary Advisory"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Judgment: no target digest match. Carry the complete unheaded-block at docs/architect/component-boundary/README.md#unheaded-block-18 (lines 85–87) into docs/platform/component-boundary.md#unheaded-block-177 (lines 1238–1240), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. Digest differences come only from the recorded candidate header/frontmatter fence, heading-level shift or physical relative-link rebasing; full before/after units and line mapping are in authoring accounting. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
[component-boundary-advisory.md](./component-boundary-advisory.md) is the
vision document for component responsibility, bounded context, and authority
boundary.
```

### Full target shown text

```text
[component-boundary-advisory.md](../architect/component-boundary/component-boundary-advisory.md) is the
vision document for component responsibility, bounded context, and authority
boundary.
```

### Unified diff

```diff
--- docs/architect/component-boundary/README.md#unheaded-block-18
+++ docs/platform/component-boundary.md#unheaded-block-177
@@ -1,3 +1,3 @@
-[component-boundary-advisory.md](./component-boundary-advisory.md) is the
+[component-boundary-advisory.md](../architect/component-boundary/component-boundary-advisory.md) is the
 vision document for component responsibility, bounded context, and authority
 boundary.

```

## claim_6a4ad0be2d1231536575859cc0b797b7

Source: `docs/architect/component-boundary/README.md#unheaded-block-19`. Target: `docs/platform/component-boundary.md#unheaded-block-178`.

Mechanical class: Weak-exact. Source digest: `5551fd216212d7accdabd3e3447be97f06bb59f0e7df3d7031cb4657ee2c98e2`. Target digest: `5551fd216212d7accdabd3e3447be97f06bb59f0e7df3d7031cb4657ee2c98e2`.

Full shown source SHA256: `5551fd216212d7accdabd3e3447be97f06bb59f0e7df3d7031cb4657ee2c98e2`. Full shown target SHA256: `5551fd216212d7accdabd3e3447be97f06bb59f0e7df3d7031cb4657ee2c98e2`.

### Proposed decision

```json
{
  "claimId": "claim_6a4ad0be2d1231536575859cc0b797b7",
  "sourceUnitDigest": "5551fd216212d7accdabd3e3447be97f06bb59f0e7df3d7031cb4657ee2c98e2",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-178",
  "targetUnitDigest": "5551fd216212d7accdabd3e3447be97f06bb59f0e7df3d7031cb4657ee2c98e2",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: README source carriage",
    "Component Boundary Architecture",
    "2. Documents",
    "Component Boundary Advisory"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/README.md#unheaded-block-19 (lines 89–92) into docs/platform/component-boundary.md#unheaded-block-178 (lines 1242–1245), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
It asks whether fgOS is split at the right conceptual boundaries: Work
Lifecycle, Agent Coordination, Dispatch And Execution, Run Result Evaluation,
Domain Components, Host Surfaces, setup/doctor/distribution, gateway/Herdr,
learning, and the additional boundaries already visible in code.
```

### Full target shown text

```text
It asks whether fgOS is split at the right conceptual boundaries: Work
Lifecycle, Agent Coordination, Dispatch And Execution, Run Result Evaluation,
Domain Components, Host Surfaces, setup/doctor/distribution, gateway/Herdr,
learning, and the additional boundaries already visible in code.
```

### Unified diff

```diff
No text difference.
```

## claim_995540c81874c90492ab2a4dbf509fe8

Source: `docs/architect/component-boundary/README.md#unheaded-block-20`. Target: `docs/platform/component-boundary.md#unheaded-block-179`.

Mechanical class: Weak-exact. Source digest: `b42afa8a9f4b9cc1da9b559818a6752a77ee3b72a9d51f029b02de4ca2354308`. Target digest: `b42afa8a9f4b9cc1da9b559818a6752a77ee3b72a9d51f029b02de4ca2354308`.

Full shown source SHA256: `b42afa8a9f4b9cc1da9b559818a6752a77ee3b72a9d51f029b02de4ca2354308`. Full shown target SHA256: `b42afa8a9f4b9cc1da9b559818a6752a77ee3b72a9d51f029b02de4ca2354308`.

### Proposed decision

```json
{
  "claimId": "claim_995540c81874c90492ab2a4dbf509fe8",
  "sourceUnitDigest": "b42afa8a9f4b9cc1da9b559818a6752a77ee3b72a9d51f029b02de4ca2354308",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-179",
  "targetUnitDigest": "b42afa8a9f4b9cc1da9b559818a6752a77ee3b72a9d51f029b02de4ca2354308",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: README source carriage",
    "Component Boundary Architecture",
    "2. Documents",
    "Component Boundary Advisory"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: target digest repeats; ancestor headings differ; source unit shorter than 40 characters. Carry the complete unheaded-block at docs/architect/component-boundary/README.md#unheaded-block-20 (lines 94–94) into docs/platform/component-boundary.md#unheaded-block-179 (lines 1247–1247), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
Use this document when deciding:
```

### Full target shown text

```text
Use this document when deciding:
```

### Unified diff

```diff
No text difference.
```

## claim_33525e399259bb23b39abf9d4f7f24f3

Source: `docs/architect/component-boundary/README.md#unheaded-block-21`. Target: `docs/platform/component-boundary.md#unheaded-block-180`.

Mechanical class: Weak-exact. Source digest: `9133812401e9915bc639f323e866b14b4fae879c7749143004685e209bed95ca`. Target digest: `9133812401e9915bc639f323e866b14b4fae879c7749143004685e209bed95ca`.

Full shown source SHA256: `9133812401e9915bc639f323e866b14b4fae879c7749143004685e209bed95ca`. Full shown target SHA256: `9133812401e9915bc639f323e866b14b4fae879c7749143004685e209bed95ca`.

### Proposed decision

```json
{
  "claimId": "claim_33525e399259bb23b39abf9d4f7f24f3",
  "sourceUnitDigest": "9133812401e9915bc639f323e866b14b4fae879c7749143004685e209bed95ca",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-180",
  "targetUnitDigest": "9133812401e9915bc639f323e866b14b4fae879c7749143004685e209bed95ca",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: README source carriage",
    "Component Boundary Architecture",
    "2. Documents",
    "Component Boundary Advisory"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/README.md#unheaded-block-21 (lines 96–102) into docs/platform/component-boundary.md#unheaded-block-180 (lines 1249–1255), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
- whether a behavior belongs in foundation or a domain;
- whether Coding Domain is owning enough of its coding-specific behavior;
- whether Work Lifecycle remains domain-agnostic;
- whether Dispatch, RunResult evaluation, workflow driving, and domain harnesses
  are overlapping;
- whether a refactor is clarifying an authority boundary or merely moving
  files.
```

### Full target shown text

```text
- whether a behavior belongs in foundation or a domain;
- whether Coding Domain is owning enough of its coding-specific behavior;
- whether Work Lifecycle remains domain-agnostic;
- whether Dispatch, RunResult evaluation, workflow driving, and domain harnesses
  are overlapping;
- whether a refactor is clarifying an authority boundary or merely moving
  files.
```

### Unified diff

```diff
No text difference.
```

## claim_1ae387c9a41cee96fc8d499dcc6fe6f9

Source: `docs/architect/component-boundary/README.md#unheaded-block-22`. Target: `docs/platform/component-boundary.md#unheaded-block-181`.

Mechanical class: Judgment. Source digest: `1a446b1df310f3aa7b0147f2172b97d36ae1a2a74b8160cfc6e6a341fc688e05`. Target digest: `1eb35b496c0cde55e97c8f3285f2a58b0d3681f75928a094184fd698991b091f`.

Full shown source SHA256: `1a446b1df310f3aa7b0147f2172b97d36ae1a2a74b8160cfc6e6a341fc688e05`. Full shown target SHA256: `1eb35b496c0cde55e97c8f3285f2a58b0d3681f75928a094184fd698991b091f`.

### Proposed decision

```json
{
  "claimId": "claim_1ae387c9a41cee96fc8d499dcc6fe6f9",
  "sourceUnitDigest": "1a446b1df310f3aa7b0147f2172b97d36ae1a2a74b8160cfc6e6a341fc688e05",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-181",
  "targetUnitDigest": "1eb35b496c0cde55e97c8f3285f2a58b0d3681f75928a094184fd698991b091f",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: README source carriage",
    "Component Boundary Architecture",
    "2. Documents",
    "Component Boundary Advisory"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Judgment: no target digest match. Carry the complete unheaded-block at docs/architect/component-boundary/README.md#unheaded-block-22 (lines 104–107) into docs/platform/component-boundary.md#unheaded-block-181 (lines 1257–1260), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. Digest differences come only from the recorded candidate header/frontmatter fence, heading-level shift or physical relative-link rebasing; full before/after units and line mapping are in authoring accounting. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
For folder-level domain authoring shape, domain manifest/workflow files,
domain-scoped doctrine, task-spec placement, skill/agent authoring sources, and
domain-siloing enforcement, use
[Domainization Architecture](../domainization/README.md).
```

### Full target shown text

```text
For folder-level domain authoring shape, domain manifest/workflow files,
domain-scoped doctrine, task-spec placement, skill/agent authoring sources, and
domain-siloing enforcement, use
[Domainization Architecture](../architect/domainization/README.md).
```

### Unified diff

```diff
--- docs/architect/component-boundary/README.md#unheaded-block-22
+++ docs/platform/component-boundary.md#unheaded-block-181
@@ -1,4 +1,4 @@
 For folder-level domain authoring shape, domain manifest/workflow files,
 domain-scoped doctrine, task-spec placement, skill/agent authoring sources, and
 domain-siloing enforcement, use
-[Domainization Architecture](../domainization/README.md).
+[Domainization Architecture](../architect/domainization/README.md).

```

## claim_ea14128a766600a9a0942fcc908ff4ce

Source: `docs/architect/component-boundary/README.md#repo-layout-vision`. Target: `docs/platform/component-boundary.md#repo-layout-vision`.

Mechanical class: Judgment. Source digest: `6e96a65df5665f05dbff0635188e1c47361952547d278d4d73bcc304bae78bbe`. Target digest: `76ec7851ade9bdd4fef5b40b167bc07ec745dcedfc0e50c3672b6bd25796ad02`.

Full shown source SHA256: `bbc37db6dd479c8c1e86eee2a478ed97fd0f466edc734ab146794a1b446fb126`. Full shown target SHA256: `dec6d4246dc084e366a7f75310df0541f514e1c18ac4f79584f4e75b4fb42514`.

### Proposed decision

```json
{
  "claimId": "claim_ea14128a766600a9a0942fcc908ff4ce",
  "sourceUnitDigest": "6e96a65df5665f05dbff0635188e1c47361952547d278d4d73bcc304bae78bbe",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "repo-layout-vision",
  "targetUnitDigest": "76ec7851ade9bdd4fef5b40b167bc07ec745dcedfc0e50c3672b6bd25796ad02",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: README source carriage",
    "Component Boundary Architecture",
    "2. Documents"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Judgment: no target digest match. Carry the complete heading at docs/architect/component-boundary/README.md#repo-layout-vision (lines 109–109) into docs/platform/component-boundary.md#repo-layout-vision (lines 1262–1262), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. Digest differences come only from the recorded candidate header/frontmatter fence, heading-level shift or physical relative-link rebasing; full before/after units and line mapping are in authoring accounting. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
### Repo Layout Vision

[repo-layout-vision.md](./repo-layout-vision.md) is the vision document for
physical source layout.

It describes the `apps/` plus `packages/` direction: apps are thin entrypoints
and packages hold reusable implementation logic. Its concrete scope is the
Rust/web split of the former `herdr-plugin/` package (now `apps/fgos-gateway/`, `herdr-dashboard/` and `packages/herdr-fgos-common/rust/`; see its status note). The Node side is outside this document.

Use this document when deciding:

- where a component should live once its boundary is agreed;
- whether a binary should be a thin app or a logic-owning package;
- how existing Rust gateway, MCP, TUI, port, and web-dashboard code should be
  separated physically;
- what mechanical blast radius a layout refactor is likely to touch.
```

### Full target shown text

```text
##### Repo Layout Vision

[repo-layout-vision.md](../architect/component-boundary/repo-layout-vision.md) is the vision document for
physical source layout.

It describes the `apps/` plus `packages/` direction: apps are thin entrypoints
and packages hold reusable implementation logic. Its concrete scope is the
Rust/web split of the former `herdr-plugin/` package (now `apps/fgos-gateway/`, `herdr-dashboard/` and `packages/herdr-fgos-common/rust/`; see its status note). The Node side is outside this document.

Use this document when deciding:

- where a component should live once its boundary is agreed;
- whether a binary should be a thin app or a logic-owning package;
- how existing Rust gateway, MCP, TUI, port, and web-dashboard code should be
  separated physically;
- what mechanical blast radius a layout refactor is likely to touch.
```

### Unified diff

```diff
--- docs/architect/component-boundary/README.md#repo-layout-vision
+++ docs/platform/component-boundary.md#repo-layout-vision
@@ -1,6 +1,6 @@
-### Repo Layout Vision
+##### Repo Layout Vision
 
-[repo-layout-vision.md](./repo-layout-vision.md) is the vision document for
+[repo-layout-vision.md](../architect/component-boundary/repo-layout-vision.md) is the vision document for
 physical source layout.
 
 It describes the `apps/` plus `packages/` direction: apps are thin entrypoints

```

## claim_841c0c452b31d698f08d8460a92f8925

Source: `docs/architect/component-boundary/README.md#unheaded-block-23`. Target: `docs/platform/component-boundary.md#unheaded-block-182`.

Mechanical class: Judgment. Source digest: `8364f8b1017ecf23f4f6d06422a4b8ce6bb4ab4aa72c0382b23462dca99b40ae`. Target digest: `cd07aba31d0b8612aa7585d57c57e30a9905fc2fb17d6dd0bb53d852aae0d71b`.

Full shown source SHA256: `8364f8b1017ecf23f4f6d06422a4b8ce6bb4ab4aa72c0382b23462dca99b40ae`. Full shown target SHA256: `cd07aba31d0b8612aa7585d57c57e30a9905fc2fb17d6dd0bb53d852aae0d71b`.

### Proposed decision

```json
{
  "claimId": "claim_841c0c452b31d698f08d8460a92f8925",
  "sourceUnitDigest": "8364f8b1017ecf23f4f6d06422a4b8ce6bb4ab4aa72c0382b23462dca99b40ae",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-182",
  "targetUnitDigest": "cd07aba31d0b8612aa7585d57c57e30a9905fc2fb17d6dd0bb53d852aae0d71b",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: README source carriage",
    "Component Boundary Architecture",
    "2. Documents",
    "Repo Layout Vision"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Judgment: no target digest match. Carry the complete unheaded-block at docs/architect/component-boundary/README.md#unheaded-block-23 (lines 111–112) into docs/platform/component-boundary.md#unheaded-block-182 (lines 1264–1265), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. Digest differences come only from the recorded candidate header/frontmatter fence, heading-level shift or physical relative-link rebasing; full before/after units and line mapping are in authoring accounting. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
[repo-layout-vision.md](./repo-layout-vision.md) is the vision document for
physical source layout.
```

### Full target shown text

```text
[repo-layout-vision.md](../architect/component-boundary/repo-layout-vision.md) is the vision document for
physical source layout.
```

### Unified diff

```diff
--- docs/architect/component-boundary/README.md#unheaded-block-23
+++ docs/platform/component-boundary.md#unheaded-block-182
@@ -1,2 +1,2 @@
-[repo-layout-vision.md](./repo-layout-vision.md) is the vision document for
+[repo-layout-vision.md](../architect/component-boundary/repo-layout-vision.md) is the vision document for
 physical source layout.

```

## claim_8470d98a34a61ac21da3eed22e1f9bff

Source: `docs/architect/component-boundary/README.md#unheaded-block-24`. Target: `docs/platform/component-boundary.md#unheaded-block-183`.

Mechanical class: Weak-exact. Source digest: `ca6b14f4628ae268fde271e1970a0ee4d55743ba9f757ba3d56d659e98bdf290`. Target digest: `ca6b14f4628ae268fde271e1970a0ee4d55743ba9f757ba3d56d659e98bdf290`.

Full shown source SHA256: `ca6b14f4628ae268fde271e1970a0ee4d55743ba9f757ba3d56d659e98bdf290`. Full shown target SHA256: `ca6b14f4628ae268fde271e1970a0ee4d55743ba9f757ba3d56d659e98bdf290`.

### Proposed decision

```json
{
  "claimId": "claim_8470d98a34a61ac21da3eed22e1f9bff",
  "sourceUnitDigest": "ca6b14f4628ae268fde271e1970a0ee4d55743ba9f757ba3d56d659e98bdf290",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-183",
  "targetUnitDigest": "ca6b14f4628ae268fde271e1970a0ee4d55743ba9f757ba3d56d659e98bdf290",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: README source carriage",
    "Component Boundary Architecture",
    "2. Documents",
    "Repo Layout Vision"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/README.md#unheaded-block-24 (lines 114–116) into docs/platform/component-boundary.md#unheaded-block-183 (lines 1267–1269), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
It describes the `apps/` plus `packages/` direction: apps are thin entrypoints
and packages hold reusable implementation logic. Its concrete scope is the
Rust/web split of the former `herdr-plugin/` package (now `apps/fgos-gateway/`, `herdr-dashboard/` and `packages/herdr-fgos-common/rust/`; see its status note). The Node side is outside this document.
```

### Full target shown text

```text
It describes the `apps/` plus `packages/` direction: apps are thin entrypoints
and packages hold reusable implementation logic. Its concrete scope is the
Rust/web split of the former `herdr-plugin/` package (now `apps/fgos-gateway/`, `herdr-dashboard/` and `packages/herdr-fgos-common/rust/`; see its status note). The Node side is outside this document.
```

### Unified diff

```diff
No text difference.
```

## claim_dba9600769691de1386bcc6b5b48767e

Source: `docs/architect/component-boundary/README.md#unheaded-block-25`. Target: `docs/platform/component-boundary.md#unheaded-block-184`.

Mechanical class: Judgment. Source digest: `b42afa8a9f4b9cc1da9b559818a6752a77ee3b72a9d51f029b02de4ca2354308`. Target digest: `b42afa8a9f4b9cc1da9b559818a6752a77ee3b72a9d51f029b02de4ca2354308`.

Full shown source SHA256: `b42afa8a9f4b9cc1da9b559818a6752a77ee3b72a9d51f029b02de4ca2354308`. Full shown target SHA256: `b42afa8a9f4b9cc1da9b559818a6752a77ee3b72a9d51f029b02de4ca2354308`.

### Proposed decision

```json
{
  "claimId": "claim_dba9600769691de1386bcc6b5b48767e",
  "sourceUnitDigest": "b42afa8a9f4b9cc1da9b559818a6752a77ee3b72a9d51f029b02de4ca2354308",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-184",
  "targetUnitDigest": "b42afa8a9f4b9cc1da9b559818a6752a77ee3b72a9d51f029b02de4ca2354308",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: README source carriage",
    "Component Boundary Architecture",
    "2. Documents",
    "Repo Layout Vision"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Judgment: digest match points to another occurrence; use the source occurrence line-mapped carrier. Carry the complete unheaded-block at docs/architect/component-boundary/README.md#unheaded-block-25 (lines 118–118) into docs/platform/component-boundary.md#unheaded-block-184 (lines 1271–1271), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
Use this document when deciding:
```

### Full target shown text

```text
Use this document when deciding:
```

### Unified diff

```diff
No text difference.
```

## claim_3b5636929c814bde29c729dedc60cc99

Source: `docs/architect/component-boundary/README.md#unheaded-block-26`. Target: `docs/platform/component-boundary.md#unheaded-block-185`.

Mechanical class: Weak-exact. Source digest: `824d9338f41f5b7e7ac276a5809940499b22dcf703ea31a2027233fd63a102a6`. Target digest: `824d9338f41f5b7e7ac276a5809940499b22dcf703ea31a2027233fd63a102a6`.

Full shown source SHA256: `824d9338f41f5b7e7ac276a5809940499b22dcf703ea31a2027233fd63a102a6`. Full shown target SHA256: `824d9338f41f5b7e7ac276a5809940499b22dcf703ea31a2027233fd63a102a6`.

### Proposed decision

```json
{
  "claimId": "claim_3b5636929c814bde29c729dedc60cc99",
  "sourceUnitDigest": "824d9338f41f5b7e7ac276a5809940499b22dcf703ea31a2027233fd63a102a6",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-185",
  "targetUnitDigest": "824d9338f41f5b7e7ac276a5809940499b22dcf703ea31a2027233fd63a102a6",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: README source carriage",
    "Component Boundary Architecture",
    "2. Documents",
    "Repo Layout Vision"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/README.md#unheaded-block-26 (lines 120–124) into docs/platform/component-boundary.md#unheaded-block-185 (lines 1273–1277), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
- where a component should live once its boundary is agreed;
- whether a binary should be a thin app or a logic-owning package;
- how existing Rust gateway, MCP, TUI, port, and web-dashboard code should be
  separated physically;
- what mechanical blast radius a layout refactor is likely to touch.
```

### Full target shown text

```text
- where a component should live once its boundary is agreed;
- whether a binary should be a thin app or a logic-owning package;
- how existing Rust gateway, MCP, TUI, port, and web-dashboard code should be
  separated physically;
- what mechanical blast radius a layout refactor is likely to touch.
```

### Unified diff

```diff
No text difference.
```

## claim_0d68eb897094a19d27659cf0925e8da3

Source: `docs/architect/component-boundary/README.md#host-invocation-and-provider-routing`. Target: `docs/platform/component-boundary.md#host-invocation-and-provider-routing`.

Mechanical class: Judgment. Source digest: `61c172d15eec9d1ca56d1023c23ba8b5b0caf0e5261f866a6025fcf1c08988fb`. Target digest: `bafb3722c564dd1cf3178d904309809fac17465eb4c5754d54fd8d8f031f1330`.

Full shown source SHA256: `a1b55a8da18495552b203e5ea2e89f28b69afe883de57d4f49a2eec744c304a0`. Full shown target SHA256: `6dce56718b9851b768ffc4142225b4b235551eb0ab3c8c3f7e8af8a9ba722cb1`.

### Proposed decision

```json
{
  "claimId": "claim_0d68eb897094a19d27659cf0925e8da3",
  "sourceUnitDigest": "61c172d15eec9d1ca56d1023c23ba8b5b0caf0e5261f866a6025fcf1c08988fb",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "host-invocation-and-provider-routing",
  "targetUnitDigest": "bafb3722c564dd1cf3178d904309809fac17465eb4c5754d54fd8d8f031f1330",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: README source carriage",
    "Component Boundary Architecture",
    "2. Documents"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Judgment: no target digest match. Carry the complete heading at docs/architect/component-boundary/README.md#host-invocation-and-provider-routing (lines 126–126) into docs/platform/component-boundary.md#host-invocation-and-provider-routing (lines 1279–1279), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. Digest differences come only from the recorded candidate header/frontmatter fence, heading-level shift or physical relative-link rebasing; full before/after units and line mapping are in authoring accounting. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
### Host Invocation And Provider Routing

[host-invocation-provider-routing.md](../host-invocation-routing/host-invocation-provider-routing.md)
defines the shared host invocation path and the Operation Provider Router.

Use this document when deciding:

- how `cli-host-use-case` and `remote-host-use-case` remain peer entry paths;
- where CLI/REST/MCP input becomes a transport-neutral semantic operation;
- how one operation selects a built-in, legacy, process, or WASM provider;
- how external plugins declare operations and requested capabilities;
- which layer owns authority checks, provider lifecycle, and error projection.
```

### Full target shown text

```text
##### Host Invocation And Provider Routing

[host-invocation-provider-routing.md](../architect/host-invocation-routing/host-invocation-provider-routing.md)
defines the shared host invocation path and the Operation Provider Router.

Use this document when deciding:

- how `cli-host-use-case` and `remote-host-use-case` remain peer entry paths;
- where CLI/REST/MCP input becomes a transport-neutral semantic operation;
- how one operation selects a built-in, legacy, process, or WASM provider;
- how external plugins declare operations and requested capabilities;
- which layer owns authority checks, provider lifecycle, and error projection.
```

### Unified diff

```diff
--- docs/architect/component-boundary/README.md#host-invocation-and-provider-routing
+++ docs/platform/component-boundary.md#host-invocation-and-provider-routing
@@ -1,6 +1,6 @@
-### Host Invocation And Provider Routing
+##### Host Invocation And Provider Routing
 
-[host-invocation-provider-routing.md](../host-invocation-routing/host-invocation-provider-routing.md)
+[host-invocation-provider-routing.md](../architect/host-invocation-routing/host-invocation-provider-routing.md)
 defines the shared host invocation path and the Operation Provider Router.
 
 Use this document when deciding:

```

## claim_9d1e7b76bcbf3b0fcf5e0edcdf130653

Source: `docs/architect/component-boundary/README.md#unheaded-block-27`. Target: `docs/platform/component-boundary.md#unheaded-block-186`.

Mechanical class: Judgment. Source digest: `1990fcaa39fe655bd2b2b7321b2998f192476a9ef6c9fdaab4c55de2d58b936b`. Target digest: `8f4934d8d5237c661745685dd1ba2dca6e6e5a68cd00fff1ba3eae8682dfbcdc`.

Full shown source SHA256: `1990fcaa39fe655bd2b2b7321b2998f192476a9ef6c9fdaab4c55de2d58b936b`. Full shown target SHA256: `8f4934d8d5237c661745685dd1ba2dca6e6e5a68cd00fff1ba3eae8682dfbcdc`.

### Proposed decision

```json
{
  "claimId": "claim_9d1e7b76bcbf3b0fcf5e0edcdf130653",
  "sourceUnitDigest": "1990fcaa39fe655bd2b2b7321b2998f192476a9ef6c9fdaab4c55de2d58b936b",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-186",
  "targetUnitDigest": "8f4934d8d5237c661745685dd1ba2dca6e6e5a68cd00fff1ba3eae8682dfbcdc",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: README source carriage",
    "Component Boundary Architecture",
    "2. Documents",
    "Host Invocation And Provider Routing"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Judgment: no target digest match. Carry the complete unheaded-block at docs/architect/component-boundary/README.md#unheaded-block-27 (lines 128–129) into docs/platform/component-boundary.md#unheaded-block-186 (lines 1281–1282), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. Digest differences come only from the recorded candidate header/frontmatter fence, heading-level shift or physical relative-link rebasing; full before/after units and line mapping are in authoring accounting. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
[host-invocation-provider-routing.md](../host-invocation-routing/host-invocation-provider-routing.md)
defines the shared host invocation path and the Operation Provider Router.
```

### Full target shown text

```text
[host-invocation-provider-routing.md](../architect/host-invocation-routing/host-invocation-provider-routing.md)
defines the shared host invocation path and the Operation Provider Router.
```

### Unified diff

```diff
--- docs/architect/component-boundary/README.md#unheaded-block-27
+++ docs/platform/component-boundary.md#unheaded-block-186
@@ -1,2 +1,2 @@
-[host-invocation-provider-routing.md](../host-invocation-routing/host-invocation-provider-routing.md)
+[host-invocation-provider-routing.md](../architect/host-invocation-routing/host-invocation-provider-routing.md)
 defines the shared host invocation path and the Operation Provider Router.

```

## claim_8f95e3804f09043c13b0c3799e353fce

Source: `docs/architect/component-boundary/README.md#unheaded-block-28`. Target: `docs/platform/component-boundary.md#unheaded-block-187`.

Mechanical class: Judgment. Source digest: `b42afa8a9f4b9cc1da9b559818a6752a77ee3b72a9d51f029b02de4ca2354308`. Target digest: `b42afa8a9f4b9cc1da9b559818a6752a77ee3b72a9d51f029b02de4ca2354308`.

Full shown source SHA256: `b42afa8a9f4b9cc1da9b559818a6752a77ee3b72a9d51f029b02de4ca2354308`. Full shown target SHA256: `b42afa8a9f4b9cc1da9b559818a6752a77ee3b72a9d51f029b02de4ca2354308`.

### Proposed decision

```json
{
  "claimId": "claim_8f95e3804f09043c13b0c3799e353fce",
  "sourceUnitDigest": "b42afa8a9f4b9cc1da9b559818a6752a77ee3b72a9d51f029b02de4ca2354308",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-187",
  "targetUnitDigest": "b42afa8a9f4b9cc1da9b559818a6752a77ee3b72a9d51f029b02de4ca2354308",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: README source carriage",
    "Component Boundary Architecture",
    "2. Documents",
    "Host Invocation And Provider Routing"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Judgment: digest match points to another occurrence; use the source occurrence line-mapped carrier. Carry the complete unheaded-block at docs/architect/component-boundary/README.md#unheaded-block-28 (lines 131–131) into docs/platform/component-boundary.md#unheaded-block-187 (lines 1284–1284), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
Use this document when deciding:
```

### Full target shown text

```text
Use this document when deciding:
```

### Unified diff

```diff
No text difference.
```

## claim_f0bd5f56e2fb541f7ce5cfd8469a3370

Source: `docs/architect/component-boundary/README.md#unheaded-block-29`. Target: `docs/platform/component-boundary.md#unheaded-block-188`.

Mechanical class: Weak-exact. Source digest: `eced209438fbb993a839bb03099146d53a08f02ca5c7b34789e7c5fb6c189918`. Target digest: `eced209438fbb993a839bb03099146d53a08f02ca5c7b34789e7c5fb6c189918`.

Full shown source SHA256: `eced209438fbb993a839bb03099146d53a08f02ca5c7b34789e7c5fb6c189918`. Full shown target SHA256: `eced209438fbb993a839bb03099146d53a08f02ca5c7b34789e7c5fb6c189918`.

### Proposed decision

```json
{
  "claimId": "claim_f0bd5f56e2fb541f7ce5cfd8469a3370",
  "sourceUnitDigest": "eced209438fbb993a839bb03099146d53a08f02ca5c7b34789e7c5fb6c189918",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-188",
  "targetUnitDigest": "eced209438fbb993a839bb03099146d53a08f02ca5c7b34789e7c5fb6c189918",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: README source carriage",
    "Component Boundary Architecture",
    "2. Documents",
    "Host Invocation And Provider Routing"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/README.md#unheaded-block-29 (lines 133–137) into docs/platform/component-boundary.md#unheaded-block-188 (lines 1286–1290), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
- how `cli-host-use-case` and `remote-host-use-case` remain peer entry paths;
- where CLI/REST/MCP input becomes a transport-neutral semantic operation;
- how one operation selects a built-in, legacy, process, or WASM provider;
- how external plugins declare operations and requested capabilities;
- which layer owns authority checks, provider lifecycle, and error projection.
```

### Full target shown text

```text
- how `cli-host-use-case` and `remote-host-use-case` remain peer entry paths;
- where CLI/REST/MCP input becomes a transport-neutral semantic operation;
- how one operation selects a built-in, legacy, process, or WASM provider;
- how external plugins declare operations and requested capabilities;
- which layer owns authority checks, provider lifecycle, and error projection.
```

### Unified diff

```diff
No text difference.
```

## claim_88c428b7e894b8c99ecc7231259db834

Source: `docs/architect/component-boundary/README.md#node-to-rust-component-migration`. Target: `docs/platform/component-boundary.md#node-to-rust-component-migration`.

Mechanical class: Judgment. Source digest: `386fc70a7cb5ec073ba7127befe97be562cbe25c892c2d65e8991cf64aad4c9d`. Target digest: `a1d3f55d6cbd3a5ddaa9db1d1c09679cd46c6e350c5a9c207c22f8cb376034d2`.

Full shown source SHA256: `2f8b025dccc024c1694dc61a8c36ea6b9490d75929413a74663e2b76857e054f`. Full shown target SHA256: `1f52dafbb1f20c1db2c0ffd3529af8b4b9130b56f20737d9abd8bde93cd9171d`.

### Proposed decision

```json
{
  "claimId": "claim_88c428b7e894b8c99ecc7231259db834",
  "sourceUnitDigest": "386fc70a7cb5ec073ba7127befe97be562cbe25c892c2d65e8991cf64aad4c9d",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "node-to-rust-component-migration",
  "targetUnitDigest": "a1d3f55d6cbd3a5ddaa9db1d1c09679cd46c6e350c5a9c207c22f8cb376034d2",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: README source carriage",
    "Component Boundary Architecture",
    "2. Documents"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Judgment: no target digest match. Carry the complete heading at docs/architect/component-boundary/README.md#node-to-rust-component-migration (lines 139–139) into docs/platform/component-boundary.md#node-to-rust-component-migration (lines 1292–1292), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. Digest differences come only from the recorded candidate header/frontmatter fence, heading-level shift or physical relative-link rebasing; full before/after units and line mapping are in authoring accounting. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
### Node To Rust Component Migration

[node-to-rust-component-migration.md](../host-invocation-routing/node-to-rust-component-migration.md)
records the migration shape for replacing Node harness internals with
Rust components one boundary at a time while preserving the existing `fgos`
surface.

Use this document when deciding:

- how the Rust CLI delegates unmigrated operations to the legacy Node provider;
- which `fgos` verb clusters are ready to become native Rust providers;
- how to avoid double parsing and split transactions during migration;
- how to preserve `fgos` CLI, envelope, error, and lifecycle contracts during a
  gradual migration;
- when a Node implementation and rollback path can be removed.
```

### Full target shown text

```text
##### Node To Rust Component Migration

[node-to-rust-component-migration.md](../architect/host-invocation-routing/node-to-rust-component-migration.md)
records the migration shape for replacing Node harness internals with
Rust components one boundary at a time while preserving the existing `fgos`
surface.

Use this document when deciding:

- how the Rust CLI delegates unmigrated operations to the legacy Node provider;
- which `fgos` verb clusters are ready to become native Rust providers;
- how to avoid double parsing and split transactions during migration;
- how to preserve `fgos` CLI, envelope, error, and lifecycle contracts during a
  gradual migration;
- when a Node implementation and rollback path can be removed.
```

### Unified diff

```diff
--- docs/architect/component-boundary/README.md#node-to-rust-component-migration
+++ docs/platform/component-boundary.md#node-to-rust-component-migration
@@ -1,6 +1,6 @@
-### Node To Rust Component Migration
+##### Node To Rust Component Migration
 
-[node-to-rust-component-migration.md](../host-invocation-routing/node-to-rust-component-migration.md)
+[node-to-rust-component-migration.md](../architect/host-invocation-routing/node-to-rust-component-migration.md)
 records the migration shape for replacing Node harness internals with
 Rust components one boundary at a time while preserving the existing `fgos`
 surface.

```

## claim_57cd483e44658aa1583e968cc86e8ab9

Source: `docs/architect/component-boundary/README.md#unheaded-block-30`. Target: `docs/platform/component-boundary.md#unheaded-block-189`.

Mechanical class: Judgment. Source digest: `6b34c822ee88e1ac1bbdd32c7f2db5b9fa63cf23378c2ea3a23cdcad68c09d5b`. Target digest: `6ab28ead7f3dc0927bce3c004a4a7c9cef30bb05552b9cf6bd8b9366470dc3c6`.

Full shown source SHA256: `6b34c822ee88e1ac1bbdd32c7f2db5b9fa63cf23378c2ea3a23cdcad68c09d5b`. Full shown target SHA256: `6ab28ead7f3dc0927bce3c004a4a7c9cef30bb05552b9cf6bd8b9366470dc3c6`.

### Proposed decision

```json
{
  "claimId": "claim_57cd483e44658aa1583e968cc86e8ab9",
  "sourceUnitDigest": "6b34c822ee88e1ac1bbdd32c7f2db5b9fa63cf23378c2ea3a23cdcad68c09d5b",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-189",
  "targetUnitDigest": "6ab28ead7f3dc0927bce3c004a4a7c9cef30bb05552b9cf6bd8b9366470dc3c6",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: README source carriage",
    "Component Boundary Architecture",
    "2. Documents",
    "Node To Rust Component Migration"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Judgment: no target digest match. Carry the complete unheaded-block at docs/architect/component-boundary/README.md#unheaded-block-30 (lines 141–144) into docs/platform/component-boundary.md#unheaded-block-189 (lines 1294–1297), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. Digest differences come only from the recorded candidate header/frontmatter fence, heading-level shift or physical relative-link rebasing; full before/after units and line mapping are in authoring accounting. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
[node-to-rust-component-migration.md](../host-invocation-routing/node-to-rust-component-migration.md)
records the migration shape for replacing Node harness internals with
Rust components one boundary at a time while preserving the existing `fgos`
surface.
```

### Full target shown text

```text
[node-to-rust-component-migration.md](../architect/host-invocation-routing/node-to-rust-component-migration.md)
records the migration shape for replacing Node harness internals with
Rust components one boundary at a time while preserving the existing `fgos`
surface.
```

### Unified diff

```diff
--- docs/architect/component-boundary/README.md#unheaded-block-30
+++ docs/platform/component-boundary.md#unheaded-block-189
@@ -1,4 +1,4 @@
-[node-to-rust-component-migration.md](../host-invocation-routing/node-to-rust-component-migration.md)
+[node-to-rust-component-migration.md](../architect/host-invocation-routing/node-to-rust-component-migration.md)
 records the migration shape for replacing Node harness internals with
 Rust components one boundary at a time while preserving the existing `fgos`
 surface.

```

## claim_3401119060c68c56af0822a00323287c

Source: `docs/architect/component-boundary/README.md#unheaded-block-31`. Target: `docs/platform/component-boundary.md#unheaded-block-190`.

Mechanical class: Judgment. Source digest: `b42afa8a9f4b9cc1da9b559818a6752a77ee3b72a9d51f029b02de4ca2354308`. Target digest: `b42afa8a9f4b9cc1da9b559818a6752a77ee3b72a9d51f029b02de4ca2354308`.

Full shown source SHA256: `b42afa8a9f4b9cc1da9b559818a6752a77ee3b72a9d51f029b02de4ca2354308`. Full shown target SHA256: `b42afa8a9f4b9cc1da9b559818a6752a77ee3b72a9d51f029b02de4ca2354308`.

### Proposed decision

```json
{
  "claimId": "claim_3401119060c68c56af0822a00323287c",
  "sourceUnitDigest": "b42afa8a9f4b9cc1da9b559818a6752a77ee3b72a9d51f029b02de4ca2354308",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-190",
  "targetUnitDigest": "b42afa8a9f4b9cc1da9b559818a6752a77ee3b72a9d51f029b02de4ca2354308",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: README source carriage",
    "Component Boundary Architecture",
    "2. Documents",
    "Node To Rust Component Migration"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Judgment: digest match points to another occurrence; use the source occurrence line-mapped carrier. Carry the complete unheaded-block at docs/architect/component-boundary/README.md#unheaded-block-31 (lines 146–146) into docs/platform/component-boundary.md#unheaded-block-190 (lines 1299–1299), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
Use this document when deciding:
```

### Full target shown text

```text
Use this document when deciding:
```

### Unified diff

```diff
No text difference.
```

## claim_57bff5928ff8240df27fc7362c67f481

Source: `docs/architect/component-boundary/README.md#unheaded-block-32`. Target: `docs/platform/component-boundary.md#unheaded-block-191`.

Mechanical class: Weak-exact. Source digest: `dd910f88b577ab74a727aa2b24d4cc2481270b00a9afaf289cf01281cb913c66`. Target digest: `dd910f88b577ab74a727aa2b24d4cc2481270b00a9afaf289cf01281cb913c66`.

Full shown source SHA256: `dd910f88b577ab74a727aa2b24d4cc2481270b00a9afaf289cf01281cb913c66`. Full shown target SHA256: `dd910f88b577ab74a727aa2b24d4cc2481270b00a9afaf289cf01281cb913c66`.

### Proposed decision

```json
{
  "claimId": "claim_57bff5928ff8240df27fc7362c67f481",
  "sourceUnitDigest": "dd910f88b577ab74a727aa2b24d4cc2481270b00a9afaf289cf01281cb913c66",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-191",
  "targetUnitDigest": "dd910f88b577ab74a727aa2b24d4cc2481270b00a9afaf289cf01281cb913c66",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: README source carriage",
    "Component Boundary Architecture",
    "2. Documents",
    "Node To Rust Component Migration"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/README.md#unheaded-block-32 (lines 148–153) into docs/platform/component-boundary.md#unheaded-block-191 (lines 1301–1306), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
- how the Rust CLI delegates unmigrated operations to the legacy Node provider;
- which `fgos` verb clusters are ready to become native Rust providers;
- how to avoid double parsing and split transactions during migration;
- how to preserve `fgos` CLI, envelope, error, and lifecycle contracts during a
  gradual migration;
- when a Node implementation and rollback path can be removed.
```

### Full target shown text

```text
- how the Rust CLI delegates unmigrated operations to the legacy Node provider;
- which `fgos` verb clusters are ready to become native Rust providers;
- how to avoid double parsing and split transactions during migration;
- how to preserve `fgos` CLI, envelope, error, and lifecycle contracts during a
  gradual migration;
- when a Node implementation and rollback path can be removed.
```

### Unified diff

```diff
No text difference.
```

## claim_d4ad966e412c3a12848ec1b573664699

Source: `docs/architect/component-boundary/README.md#3-relationship-between-these-documents`. Target: `docs/platform/component-boundary.md#3-relationship-between-these-documents`.

Mechanical class: Judgment. Source digest: `676de3194fd0d6f634397e2654d15e46f2d183af09b5866ff95a1fc64cd78ca9`. Target digest: `4863554bd226c4bc1c5f5be6e6429ed64db3310aa9b59061123dfb1217d1b16b`.

Full shown source SHA256: `83ff1cdd1a2fb5827a8b78a30bf8bb6cf95efc8b44ab3ca2b4315a7a3e7a069e`. Full shown target SHA256: `12143165daec09a2d669b286727717252e87d8ee9b61771f7105dad3fc467b43`.

### Proposed decision

```json
{
  "claimId": "claim_d4ad966e412c3a12848ec1b573664699",
  "sourceUnitDigest": "676de3194fd0d6f634397e2654d15e46f2d183af09b5866ff95a1fc64cd78ca9",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "3-relationship-between-these-documents",
  "targetUnitDigest": "4863554bd226c4bc1c5f5be6e6429ed64db3310aa9b59061123dfb1217d1b16b",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: README source carriage",
    "Component Boundary Architecture"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Judgment: no target digest match. Carry the complete heading at docs/architect/component-boundary/README.md#3-relationship-between-these-documents (lines 155–155) into docs/platform/component-boundary.md#3-relationship-between-these-documents (lines 1308–1308), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. Digest differences come only from the recorded candidate header/frontmatter fence, heading-level shift or physical relative-link rebasing; full before/after units and line mapping are in authoring accounting. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
## 3. Relationship Between These Documents

`component-boundary-advisory.md` defines the conceptual map.
`repo-layout-vision.md` defines a possible physical map.
`host-invocation-provider-routing.md` defines the host/provider invocation map.
`node-to-rust-component-migration.md` defines an implementation migration map
from the legacy Node provider to built-in Rust providers.
`packaging-distribution/README.md` defines the emerging install/runtime
authority map that keeps global machine services separate from project-local
fgOS semantic authority.

They are related but not interchangeable:

- a component boundary can exist before files move;
- source placement can reflect old implementation choices instead of ownership;
- some discovered boundaries may become subcomponents instead of top-level
  packages;
- coding-specific repository integration should be discussed as a subcomponent
  of Coding Domain Core, not as a generic foundation package;
- runtime-language migration should happen behind component contracts, not by
  treating a Node file or Rust crate as authority;
- shared web/gateway can aggregate many projects, but must delegate mutating
  project semantics through the selected project's local runtime adapter and
  payload;
- global bootstrap/control and project workflow authority are different
  components: `fgctl` installs/manages; local `fgos` drives workspace
  semantics;
- layout refactors should happen only after the component authority is clear.
```

### Full target shown text

```text
#### 3. Relationship Between These Documents

`component-boundary-advisory.md` defines the conceptual map.
`repo-layout-vision.md` defines a possible physical map.
`host-invocation-provider-routing.md` defines the host/provider invocation map.
`node-to-rust-component-migration.md` defines an implementation migration map
from the legacy Node provider to built-in Rust providers.
`packaging-distribution/README.md` defines the emerging install/runtime
authority map that keeps global machine services separate from project-local
fgOS semantic authority.

They are related but not interchangeable:

- a component boundary can exist before files move;
- source placement can reflect old implementation choices instead of ownership;
- some discovered boundaries may become subcomponents instead of top-level
  packages;
- coding-specific repository integration should be discussed as a subcomponent
  of Coding Domain Core, not as a generic foundation package;
- runtime-language migration should happen behind component contracts, not by
  treating a Node file or Rust crate as authority;
- shared web/gateway can aggregate many projects, but must delegate mutating
  project semantics through the selected project's local runtime adapter and
  payload;
- global bootstrap/control and project workflow authority are different
  components: `fgctl` installs/manages; local `fgos` drives workspace
  semantics;
- layout refactors should happen only after the component authority is clear.
```

### Unified diff

```diff
--- docs/architect/component-boundary/README.md#3-relationship-between-these-documents
+++ docs/platform/component-boundary.md#3-relationship-between-these-documents
@@ -1,4 +1,4 @@
-## 3. Relationship Between These Documents
+#### 3. Relationship Between These Documents
 
 `component-boundary-advisory.md` defines the conceptual map.
 `repo-layout-vision.md` defines a possible physical map.

```

## claim_3ac8ae95ba06f2e62be3f4d5a941b887

Source: `docs/architect/component-boundary/README.md#unheaded-block-33`. Target: `docs/platform/component-boundary.md#unheaded-block-192`.

Mechanical class: Weak-exact. Source digest: `edc5f9393cdc0d76ee32b8ba6154bf0dc9ff9d896e3a4d882da5b2b0976303cd`. Target digest: `edc5f9393cdc0d76ee32b8ba6154bf0dc9ff9d896e3a4d882da5b2b0976303cd`.

Full shown source SHA256: `edc5f9393cdc0d76ee32b8ba6154bf0dc9ff9d896e3a4d882da5b2b0976303cd`. Full shown target SHA256: `edc5f9393cdc0d76ee32b8ba6154bf0dc9ff9d896e3a4d882da5b2b0976303cd`.

### Proposed decision

```json
{
  "claimId": "claim_3ac8ae95ba06f2e62be3f4d5a941b887",
  "sourceUnitDigest": "edc5f9393cdc0d76ee32b8ba6154bf0dc9ff9d896e3a4d882da5b2b0976303cd",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-192",
  "targetUnitDigest": "edc5f9393cdc0d76ee32b8ba6154bf0dc9ff9d896e3a4d882da5b2b0976303cd",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: README source carriage",
    "Component Boundary Architecture",
    "3. Relationship Between These Documents"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/README.md#unheaded-block-33 (lines 157–164) into docs/platform/component-boundary.md#unheaded-block-192 (lines 1310–1317), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
`component-boundary-advisory.md` defines the conceptual map.
`repo-layout-vision.md` defines a possible physical map.
`host-invocation-provider-routing.md` defines the host/provider invocation map.
`node-to-rust-component-migration.md` defines an implementation migration map
from the legacy Node provider to built-in Rust providers.
`packaging-distribution/README.md` defines the emerging install/runtime
authority map that keeps global machine services separate from project-local
fgOS semantic authority.
```

### Full target shown text

```text
`component-boundary-advisory.md` defines the conceptual map.
`repo-layout-vision.md` defines a possible physical map.
`host-invocation-provider-routing.md` defines the host/provider invocation map.
`node-to-rust-component-migration.md` defines an implementation migration map
from the legacy Node provider to built-in Rust providers.
`packaging-distribution/README.md` defines the emerging install/runtime
authority map that keeps global machine services separate from project-local
fgOS semantic authority.
```

### Unified diff

```diff
No text difference.
```

## claim_7d92508fc2f26920652abce703a42e05

Source: `docs/architect/component-boundary/README.md#unheaded-block-34`. Target: `docs/platform/component-boundary.md#unheaded-block-193`.

Mechanical class: Weak-exact. Source digest: `0198998af5f4d8bebe46fc6198fd11355459d1ae886a5341046eb0ab35b4f551`. Target digest: `0198998af5f4d8bebe46fc6198fd11355459d1ae886a5341046eb0ab35b4f551`.

Full shown source SHA256: `0198998af5f4d8bebe46fc6198fd11355459d1ae886a5341046eb0ab35b4f551`. Full shown target SHA256: `0198998af5f4d8bebe46fc6198fd11355459d1ae886a5341046eb0ab35b4f551`.

### Proposed decision

```json
{
  "claimId": "claim_7d92508fc2f26920652abce703a42e05",
  "sourceUnitDigest": "0198998af5f4d8bebe46fc6198fd11355459d1ae886a5341046eb0ab35b4f551",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-193",
  "targetUnitDigest": "0198998af5f4d8bebe46fc6198fd11355459d1ae886a5341046eb0ab35b4f551",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: README source carriage",
    "Component Boundary Architecture",
    "3. Relationship Between These Documents"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/README.md#unheaded-block-34 (lines 166–166) into docs/platform/component-boundary.md#unheaded-block-193 (lines 1319–1319), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
They are related but not interchangeable:
```

### Full target shown text

```text
They are related but not interchangeable:
```

### Unified diff

```diff
No text difference.
```

## claim_994e6a2612bcd57138b3acf416ea8e6e

Source: `docs/architect/component-boundary/README.md#unheaded-block-35`. Target: `docs/platform/component-boundary.md#unheaded-block-194`.

Mechanical class: Weak-exact. Source digest: `5704abd579bfd9c37779ac045cb916166559cf84e44c15e0bee46e6db27f3f73`. Target digest: `5704abd579bfd9c37779ac045cb916166559cf84e44c15e0bee46e6db27f3f73`.

Full shown source SHA256: `5704abd579bfd9c37779ac045cb916166559cf84e44c15e0bee46e6db27f3f73`. Full shown target SHA256: `5704abd579bfd9c37779ac045cb916166559cf84e44c15e0bee46e6db27f3f73`.

### Proposed decision

```json
{
  "claimId": "claim_994e6a2612bcd57138b3acf416ea8e6e",
  "sourceUnitDigest": "5704abd579bfd9c37779ac045cb916166559cf84e44c15e0bee46e6db27f3f73",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-194",
  "targetUnitDigest": "5704abd579bfd9c37779ac045cb916166559cf84e44c15e0bee46e6db27f3f73",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: README source carriage",
    "Component Boundary Architecture",
    "3. Relationship Between These Documents"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/README.md#unheaded-block-35 (lines 168–182) into docs/platform/component-boundary.md#unheaded-block-194 (lines 1321–1335), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
- a component boundary can exist before files move;
- source placement can reflect old implementation choices instead of ownership;
- some discovered boundaries may become subcomponents instead of top-level
  packages;
- coding-specific repository integration should be discussed as a subcomponent
  of Coding Domain Core, not as a generic foundation package;
- runtime-language migration should happen behind component contracts, not by
  treating a Node file or Rust crate as authority;
- shared web/gateway can aggregate many projects, but must delegate mutating
  project semantics through the selected project's local runtime adapter and
  payload;
- global bootstrap/control and project workflow authority are different
  components: `fgctl` installs/manages; local `fgos` drives workspace
  semantics;
- layout refactors should happen only after the component authority is clear.
```

### Full target shown text

```text
- a component boundary can exist before files move;
- source placement can reflect old implementation choices instead of ownership;
- some discovered boundaries may become subcomponents instead of top-level
  packages;
- coding-specific repository integration should be discussed as a subcomponent
  of Coding Domain Core, not as a generic foundation package;
- runtime-language migration should happen behind component contracts, not by
  treating a Node file or Rust crate as authority;
- shared web/gateway can aggregate many projects, but must delegate mutating
  project semantics through the selected project's local runtime adapter and
  payload;
- global bootstrap/control and project workflow authority are different
  components: `fgctl` installs/manages; local `fgos` drives workspace
  semantics;
- layout refactors should happen only after the component authority is clear.
```

### Unified diff

```diff
No text difference.
```

## claim_683108aca3e656fed37a3c814155cab2

Source: `docs/architect/component-boundary/README.md#4-current-status`. Target: `docs/platform/component-boundary.md#4-current-status`.

Mechanical class: Judgment. Source digest: `744513d6e317871e546803a194b4daa89b603f4b44cdad0e63ae81f2797a56f6`. Target digest: `b792d416bbecbe214b22c473939afab3f0fc02029f3fefcf4b0dfbabe3dd1c53`.

Full shown source SHA256: `4de6842b54a9f778777333b377e4a98aafc831615c16d6499dc496e893ec174d`. Full shown target SHA256: `3dea43ca8ef8c383cad86d7d95d99e98587a07defeccea39cf4a86c7a4830035`.

### Proposed decision

```json
{
  "claimId": "claim_683108aca3e656fed37a3c814155cab2",
  "sourceUnitDigest": "744513d6e317871e546803a194b4daa89b603f4b44cdad0e63ae81f2797a56f6",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "4-current-status",
  "targetUnitDigest": "b792d416bbecbe214b22c473939afab3f0fc02029f3fefcf4b0dfbabe3dd1c53",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: README source carriage",
    "Component Boundary Architecture"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Judgment: no target digest match. Carry the complete heading at docs/architect/component-boundary/README.md#4-current-status (lines 184–184) into docs/platform/component-boundary.md#4-current-status (lines 1337–1337), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. Digest differences come only from the recorded candidate header/frontmatter fence, heading-level shift or physical relative-link rebasing; full before/after units and line mapping are in authoring accounting. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
## 4. Current Status

This folder is advisory. It can guide repo-layout cleanup, component
extraction, and authority-boundary review across fgOS, but canonical contracts
still live under their owning architecture, contract, spec, or ADR documents.

When a decision becomes settled, extract the stable fact into the appropriate
canonical document instead of treating this folder as the source of truth.
```

### Full target shown text

```text
#### 4. Current Status

This folder is advisory. It can guide repo-layout cleanup, component
extraction, and authority-boundary review across fgOS, but canonical contracts
still live under their owning architecture, contract, spec, or ADR documents.

When a decision becomes settled, extract the stable fact into the appropriate
canonical document instead of treating this folder as the source of truth.
```

### Unified diff

```diff
--- docs/architect/component-boundary/README.md#4-current-status
+++ docs/platform/component-boundary.md#4-current-status
@@ -1,4 +1,4 @@
-## 4. Current Status
+#### 4. Current Status
 
 This folder is advisory. It can guide repo-layout cleanup, component
 extraction, and authority-boundary review across fgOS, but canonical contracts

```

## claim_0ee219d1f56bb8618374020ebf261467

Source: `docs/architect/component-boundary/README.md#unheaded-block-36`. Target: `docs/platform/component-boundary.md#unheaded-block-195`.

Mechanical class: Weak-exact. Source digest: `641fa5c7aa8e023096cd021cc8ebd6bab088dbcbcdc20326f2df0804f8068f9d`. Target digest: `641fa5c7aa8e023096cd021cc8ebd6bab088dbcbcdc20326f2df0804f8068f9d`.

Full shown source SHA256: `641fa5c7aa8e023096cd021cc8ebd6bab088dbcbcdc20326f2df0804f8068f9d`. Full shown target SHA256: `641fa5c7aa8e023096cd021cc8ebd6bab088dbcbcdc20326f2df0804f8068f9d`.

### Proposed decision

```json
{
  "claimId": "claim_0ee219d1f56bb8618374020ebf261467",
  "sourceUnitDigest": "641fa5c7aa8e023096cd021cc8ebd6bab088dbcbcdc20326f2df0804f8068f9d",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-195",
  "targetUnitDigest": "641fa5c7aa8e023096cd021cc8ebd6bab088dbcbcdc20326f2df0804f8068f9d",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: README source carriage",
    "Component Boundary Architecture",
    "4. Current Status"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/README.md#unheaded-block-36 (lines 186–188) into docs/platform/component-boundary.md#unheaded-block-195 (lines 1339–1341), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
This folder is advisory. It can guide repo-layout cleanup, component
extraction, and authority-boundary review across fgOS, but canonical contracts
still live under their owning architecture, contract, spec, or ADR documents.
```

### Full target shown text

```text
This folder is advisory. It can guide repo-layout cleanup, component
extraction, and authority-boundary review across fgOS, but canonical contracts
still live under their owning architecture, contract, spec, or ADR documents.
```

### Unified diff

```diff
No text difference.
```

## claim_4e615f582b4f68441901a793b989256e

Source: `docs/architect/component-boundary/README.md#unheaded-block-37`. Target: `docs/platform/component-boundary.md#unheaded-block-196`.

Mechanical class: Weak-exact. Source digest: `95e1c88e05e45a624fffb2d71a4c4852d092eba44879794adc1b2c0d43811e36`. Target digest: `95e1c88e05e45a624fffb2d71a4c4852d092eba44879794adc1b2c0d43811e36`.

Full shown source SHA256: `95e1c88e05e45a624fffb2d71a4c4852d092eba44879794adc1b2c0d43811e36`. Full shown target SHA256: `95e1c88e05e45a624fffb2d71a4c4852d092eba44879794adc1b2c0d43811e36`.

### Proposed decision

```json
{
  "claimId": "claim_4e615f582b4f68441901a793b989256e",
  "sourceUnitDigest": "95e1c88e05e45a624fffb2d71a4c4852d092eba44879794adc1b2c0d43811e36",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-196",
  "targetUnitDigest": "95e1c88e05e45a624fffb2d71a4c4852d092eba44879794adc1b2c0d43811e36",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: README source carriage",
    "Component Boundary Architecture",
    "4. Current Status"
  ],
  "claimKind": "decision",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/README.md#unheaded-block-37 (lines 190–191) into docs/platform/component-boundary.md#unheaded-block-196 (lines 1343–1344), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
When a decision becomes settled, extract the stable fact into the appropriate
canonical document instead of treating this folder as the source of truth.
```

### Full target shown text

```text
When a decision becomes settled, extract the stable fact into the appropriate
canonical document instead of treating this folder as the source of truth.
```

### Unified diff

```diff
No text difference.
```

## claim_1f3e0eb3acc3bc476ddf81b58b8c9976

Source: `docs/architect/component-boundary/README.md#5-external-review-links`. Target: `docs/platform/component-boundary.md#5-external-review-links`.

Mechanical class: Judgment. Source digest: `8eb57a714ec7834cef6451658e73a9fa9e4a1ede9c6c3257e6ffb74e311badc1`. Target digest: `d13d6906e4c75c3030d9364a26fc3b05d2d80f52f1e753a679f065167d3b49d3`.

Full shown source SHA256: `b63b54b011a9bfdc759df5b702dd6bb0d1836dd2ed58ce80181e5ac6e38b883d`. Full shown target SHA256: `bcb168df0b8330377d6e0d1326deca50fe7f99f3a13c5c754b0c84c70e8378af`.

### Proposed decision

```json
{
  "claimId": "claim_1f3e0eb3acc3bc476ddf81b58b8c9976",
  "sourceUnitDigest": "8eb57a714ec7834cef6451658e73a9fa9e4a1ede9c6c3257e6ffb74e311badc1",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "5-external-review-links",
  "targetUnitDigest": "d13d6906e4c75c3030d9364a26fc3b05d2d80f52f1e753a679f065167d3b49d3",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: README source carriage",
    "Component Boundary Architecture"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Judgment: no target digest match. Carry the complete heading at docs/architect/component-boundary/README.md#5-external-review-links (lines 193–193) into docs/platform/component-boundary.md#5-external-review-links (lines 1346–1346), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. Digest differences come only from the recorded candidate header/frontmatter fence, heading-level shift or physical relative-link rebasing; full before/after units and line mapping are in authoring accounting. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
## 5. External Review Links

Use these outside documents as review material while shaping component
boundaries. They are not part of this folder's source-of-truth chain unless a
settled decision is later extracted into the owning canonical document.
```

### Full target shown text

```text
#### 5. External Review Links

Use these outside documents as review material while shaping component
boundaries. They are not part of this folder's source-of-truth chain unless a
settled decision is later extracted into the owning canonical document.
```

### Unified diff

```diff
--- docs/architect/component-boundary/README.md#5-external-review-links
+++ docs/platform/component-boundary.md#5-external-review-links
@@ -1,4 +1,4 @@
-## 5. External Review Links
+#### 5. External Review Links
 
 Use these outside documents as review material while shaping component
 boundaries. They are not part of this folder's source-of-truth chain unless a

```

## claim_3f9daed05c969b1d0c2eafb05f052a9d

Source: `docs/architect/component-boundary/README.md#unheaded-block-38`. Target: `docs/platform/component-boundary.md#unheaded-block-197`.

Mechanical class: Weak-exact. Source digest: `eb4d05b85ae250c096ece810c407c4043cea029c5a5176cf9aa1c1360ae42ccf`. Target digest: `eb4d05b85ae250c096ece810c407c4043cea029c5a5176cf9aa1c1360ae42ccf`.

Full shown source SHA256: `eb4d05b85ae250c096ece810c407c4043cea029c5a5176cf9aa1c1360ae42ccf`. Full shown target SHA256: `eb4d05b85ae250c096ece810c407c4043cea029c5a5176cf9aa1c1360ae42ccf`.

### Proposed decision

```json
{
  "claimId": "claim_3f9daed05c969b1d0c2eafb05f052a9d",
  "sourceUnitDigest": "eb4d05b85ae250c096ece810c407c4043cea029c5a5176cf9aa1c1360ae42ccf",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-197",
  "targetUnitDigest": "eb4d05b85ae250c096ece810c407c4043cea029c5a5176cf9aa1c1360ae42ccf",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: README source carriage",
    "Component Boundary Architecture",
    "5. External Review Links"
  ],
  "claimKind": "decision",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Weak-exact: ancestor headings differ. Carry the complete unheaded-block at docs/architect/component-boundary/README.md#unheaded-block-38 (lines 195–197) into docs/platform/component-boundary.md#unheaded-block-197 (lines 1348–1350), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. The full unit digest is equal; this author still claims no independent approval. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
Use these outside documents as review material while shaping component
boundaries. They are not part of this folder's source-of-truth chain unless a
settled decision is later extracted into the owning canonical document.
```

### Full target shown text

```text
Use these outside documents as review material while shaping component
boundaries. They are not part of this folder's source-of-truth chain unless a
settled decision is later extracted into the owning canonical document.
```

### Unified diff

```diff
No text difference.
```

## claim_d590be5f9d8551d9b4290c296c4e059a

Source: `docs/architect/component-boundary/README.md#canonical-architecture-and-specs`. Target: `docs/platform/component-boundary.md#canonical-architecture-and-specs`.

Mechanical class: Judgment. Source digest: `bd27b3807fbdb62ee1e6fd078d3bcae8aec3c68007ad3b7b2bbc89a330b71bea`. Target digest: `c8275ee71911e49df6de04af11e484fd90ba75a18944a412b74b013078a737d6`.

Full shown source SHA256: `4a92a9878d4510e01ecea0003851278272f9787ed9358b125a62e8a3b390609a`. Full shown target SHA256: `53161569ffc88eac258e053318a9926d2cfe63bd026947dc383c98679fa05907`.

### Proposed decision

```json
{
  "claimId": "claim_d590be5f9d8551d9b4290c296c4e059a",
  "sourceUnitDigest": "bd27b3807fbdb62ee1e6fd078d3bcae8aec3c68007ad3b7b2bbc89a330b71bea",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "canonical-architecture-and-specs",
  "targetUnitDigest": "c8275ee71911e49df6de04af11e484fd90ba75a18944a412b74b013078a737d6",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: README source carriage",
    "Component Boundary Architecture",
    "5. External Review Links"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Judgment: no target digest match. Carry the complete heading at docs/architect/component-boundary/README.md#canonical-architecture-and-specs (lines 199–199) into docs/platform/component-boundary.md#canonical-architecture-and-specs (lines 1352–1352), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. Digest differences come only from the recorded candidate header/frontmatter fence, heading-level shift or physical relative-link rebasing; full before/after units and line mapping are in authoring accounting. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
### Canonical Architecture And Specs

- [Architecture Map](../../architecture-map.md) — structure/physics/authority
  map, component registry, and contract registry.
- [System Overview](../../specs/system-overview.md) — area map, shared
  entities, actors, and cross-area flows.
- [Platform Foundations](../../platform-foundations.md) — locked platform laws
  and durability/DoD doctrine.
- [Work Item Lifecycle Vision](../../work-item-lifecycle-vision.md) — base
  workflow and coding-specific lifecycle mapping.
- [Distribution Vision](../../distribution-vision.md) — install/setup/doctor
  direction and config/default registration posture.
- [Domainization Architecture](../domainization/README.md) — core vs domain
  authoring, resolver, doctrine, workflow, skill, task-spec, knowledge, and
  agent boundaries.
```

### Full target shown text

```text
##### Canonical Architecture And Specs

- [Architecture Map](../architecture-map.md) — structure/physics/authority
  map, component registry, and contract registry.
- [System Overview](../specs/system-overview.md) — area map, shared
  entities, actors, and cross-area flows.
- [Platform Foundations](../platform-foundations.md) — locked platform laws
  and durability/DoD doctrine.
- [Work Item Lifecycle Vision](../work-item-lifecycle-vision.md) — base
  workflow and coding-specific lifecycle mapping.
- [Distribution Vision](../distribution-vision.md) — install/setup/doctor
  direction and config/default registration posture.
- [Domainization Architecture](../architect/domainization/README.md) — core vs domain
  authoring, resolver, doctrine, workflow, skill, task-spec, knowledge, and
  agent boundaries.
```

### Unified diff

```diff
--- docs/architect/component-boundary/README.md#canonical-architecture-and-specs
+++ docs/platform/component-boundary.md#canonical-architecture-and-specs
@@ -1,15 +1,15 @@
-### Canonical Architecture And Specs
+##### Canonical Architecture And Specs
 
-- [Architecture Map](../../architecture-map.md) — structure/physics/authority
+- [Architecture Map](../architecture-map.md) — structure/physics/authority
   map, component registry, and contract registry.
-- [System Overview](../../specs/system-overview.md) — area map, shared
+- [System Overview](../specs/system-overview.md) — area map, shared
   entities, actors, and cross-area flows.
-- [Platform Foundations](../../platform-foundations.md) — locked platform laws
+- [Platform Foundations](../platform-foundations.md) — locked platform laws
   and durability/DoD doctrine.
-- [Work Item Lifecycle Vision](../../work-item-lifecycle-vision.md) — base
+- [Work Item Lifecycle Vision](../work-item-lifecycle-vision.md) — base
   workflow and coding-specific lifecycle mapping.
-- [Distribution Vision](../../distribution-vision.md) — install/setup/doctor
+- [Distribution Vision](../distribution-vision.md) — install/setup/doctor
   direction and config/default registration posture.
-- [Domainization Architecture](../domainization/README.md) — core vs domain
+- [Domainization Architecture](../architect/domainization/README.md) — core vs domain
   authoring, resolver, doctrine, workflow, skill, task-spec, knowledge, and
   agent boundaries.

```

## claim_00f11cd8215f5649d5ef7bcb34bdb737

Source: `docs/architect/component-boundary/README.md#unheaded-block-39`. Target: `docs/platform/component-boundary.md#unheaded-block-198`.

Mechanical class: Judgment. Source digest: `a08cc83f7df187091c4b7b00e9e6a7363ddcad7a1a59ad9a7fdfe4cec31f7d39`. Target digest: `3c993a32695cce9b29c95fdbd2f4b6b8ba5cb31a4601b3c363ef094b6c217292`.

Full shown source SHA256: `a08cc83f7df187091c4b7b00e9e6a7363ddcad7a1a59ad9a7fdfe4cec31f7d39`. Full shown target SHA256: `3c993a32695cce9b29c95fdbd2f4b6b8ba5cb31a4601b3c363ef094b6c217292`.

### Proposed decision

```json
{
  "claimId": "claim_00f11cd8215f5649d5ef7bcb34bdb737",
  "sourceUnitDigest": "a08cc83f7df187091c4b7b00e9e6a7363ddcad7a1a59ad9a7fdfe4cec31f7d39",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-198",
  "targetUnitDigest": "3c993a32695cce9b29c95fdbd2f4b6b8ba5cb31a4601b3c363ef094b6c217292",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: README source carriage",
    "Component Boundary Architecture",
    "5. External Review Links",
    "Canonical Architecture And Specs"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Judgment: no target digest match. Carry the complete unheaded-block at docs/architect/component-boundary/README.md#unheaded-block-39 (lines 201–213) into docs/platform/component-boundary.md#unheaded-block-198 (lines 1354–1366), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. Digest differences come only from the recorded candidate header/frontmatter fence, heading-level shift or physical relative-link rebasing; full before/after units and line mapping are in authoring accounting. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
- [Architecture Map](../../architecture-map.md) — structure/physics/authority
  map, component registry, and contract registry.
- [System Overview](../../specs/system-overview.md) — area map, shared
  entities, actors, and cross-area flows.
- [Platform Foundations](../../platform-foundations.md) — locked platform laws
  and durability/DoD doctrine.
- [Work Item Lifecycle Vision](../../work-item-lifecycle-vision.md) — base
  workflow and coding-specific lifecycle mapping.
- [Distribution Vision](../../distribution-vision.md) — install/setup/doctor
  direction and config/default registration posture.
- [Domainization Architecture](../domainization/README.md) — core vs domain
  authoring, resolver, doctrine, workflow, skill, task-spec, knowledge, and
  agent boundaries.
```

### Full target shown text

```text
- [Architecture Map](../architecture-map.md) — structure/physics/authority
  map, component registry, and contract registry.
- [System Overview](../specs/system-overview.md) — area map, shared
  entities, actors, and cross-area flows.
- [Platform Foundations](../platform-foundations.md) — locked platform laws
  and durability/DoD doctrine.
- [Work Item Lifecycle Vision](../work-item-lifecycle-vision.md) — base
  workflow and coding-specific lifecycle mapping.
- [Distribution Vision](../distribution-vision.md) — install/setup/doctor
  direction and config/default registration posture.
- [Domainization Architecture](../architect/domainization/README.md) — core vs domain
  authoring, resolver, doctrine, workflow, skill, task-spec, knowledge, and
  agent boundaries.
```

### Unified diff

```diff
--- docs/architect/component-boundary/README.md#unheaded-block-39
+++ docs/platform/component-boundary.md#unheaded-block-198
@@ -1,13 +1,13 @@
-- [Architecture Map](../../architecture-map.md) — structure/physics/authority
+- [Architecture Map](../architecture-map.md) — structure/physics/authority
   map, component registry, and contract registry.
-- [System Overview](../../specs/system-overview.md) — area map, shared
+- [System Overview](../specs/system-overview.md) — area map, shared
   entities, actors, and cross-area flows.
-- [Platform Foundations](../../platform-foundations.md) — locked platform laws
+- [Platform Foundations](../platform-foundations.md) — locked platform laws
   and durability/DoD doctrine.
-- [Work Item Lifecycle Vision](../../work-item-lifecycle-vision.md) — base
+- [Work Item Lifecycle Vision](../work-item-lifecycle-vision.md) — base
   workflow and coding-specific lifecycle mapping.
-- [Distribution Vision](../../distribution-vision.md) — install/setup/doctor
+- [Distribution Vision](../distribution-vision.md) — install/setup/doctor
   direction and config/default registration posture.
-- [Domainization Architecture](../domainization/README.md) — core vs domain
+- [Domainization Architecture](../architect/domainization/README.md) — core vs domain
   authoring, resolver, doctrine, workflow, skill, task-spec, knowledge, and
   agent boundaries.

```

## claim_d060f9dfcce5f534cfa957c4245ac9e1

Source: `docs/architect/component-boundary/README.md#related-agent-coordination-contracts`. Target: `docs/platform/component-boundary.md#related-agent-coordination-contracts`.

Mechanical class: Judgment. Source digest: `8605d19e9c8d1e90e944e11956b67facf28fbbd46e4f4873a6ea21780cfebf1e`. Target digest: `6a334bab730625b37874c89617fa8a1e55b12a4fb451a646e60326eb1f7bdbbc`.

Full shown source SHA256: `ab3a3a55d56ab38e328491b6574b186a32df534773f49e2f22611d500291aa2a`. Full shown target SHA256: `20935206b1331a7ecda92403c0f669ba08db679b0ccc86941a0b642c927a6b1f`.

### Proposed decision

```json
{
  "claimId": "claim_d060f9dfcce5f534cfa957c4245ac9e1",
  "sourceUnitDigest": "8605d19e9c8d1e90e944e11956b67facf28fbbd46e4f4873a6ea21780cfebf1e",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "related-agent-coordination-contracts",
  "targetUnitDigest": "6a334bab730625b37874c89617fa8a1e55b12a4fb451a646e60326eb1f7bdbbc",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: README source carriage",
    "Component Boundary Architecture",
    "5. External Review Links"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Judgment: no target digest match. Carry the complete heading at docs/architect/component-boundary/README.md#related-agent-coordination-contracts (lines 215–215) into docs/platform/component-boundary.md#related-agent-coordination-contracts (lines 1368–1368), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. Digest differences come only from the recorded candidate header/frontmatter fence, heading-level shift or physical relative-link rebasing; full before/after units and line mapping are in authoring accounting. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
### Related Agent Coordination Contracts

- [Agent Coordination Portal](../agent-coordination/README.md) — reading entry
  for the Agent Coordination architecture set.
- [Agent Coordination Foundation Vision](../agent-coordination/vision.md) —
  foundation/domain split, runtime contracts, and small-core constraints.
- [System Context](../agent-coordination/architecture/system-context.md) —
  boundaries, runtime profiles, and trust boundaries.
- [Runtime Model](../agent-coordination/architecture/runtime-model.md) —
  assignment execution chain, invariants, and failure domains.
- [Dispatch Control Plane](../agent-coordination/architecture/dispatch-control-plane.md)
  — executor/provider/model/tier/mechanism governance boundary.
- [Evidence And Results](../agent-coordination/architecture/evidence-and-results.md)
  — RunResult confidence and evidence boundary.
- [Work Integration](../agent-coordination/architecture/work-integration.md) —
  Work lifecycle integration boundary.
```

### Full target shown text

```text
##### Related Agent Coordination Contracts

- [Agent Coordination Portal](../architect/agent-coordination/README.md) — reading entry
  for the Agent Coordination architecture set.
- [Agent Coordination Foundation Vision](../architect/agent-coordination/vision.md) —
  foundation/domain split, runtime contracts, and small-core constraints.
- [System Context](../architect/agent-coordination/architecture/system-context.md) —
  boundaries, runtime profiles, and trust boundaries.
- [Runtime Model](../architect/agent-coordination/architecture/runtime-model.md) —
  assignment execution chain, invariants, and failure domains.
- [Dispatch Control Plane](../architect/agent-coordination/architecture/dispatch-control-plane.md)
  — executor/provider/model/tier/mechanism governance boundary.
- [Evidence And Results](../architect/agent-coordination/architecture/evidence-and-results.md)
  — RunResult confidence and evidence boundary.
- [Work Integration](../architect/agent-coordination/architecture/work-integration.md) —
  Work lifecycle integration boundary.
```

### Unified diff

```diff
--- docs/architect/component-boundary/README.md#related-agent-coordination-contracts
+++ docs/platform/component-boundary.md#related-agent-coordination-contracts
@@ -1,16 +1,16 @@
-### Related Agent Coordination Contracts
+##### Related Agent Coordination Contracts
 
-- [Agent Coordination Portal](../agent-coordination/README.md) — reading entry
+- [Agent Coordination Portal](../architect/agent-coordination/README.md) — reading entry
   for the Agent Coordination architecture set.
-- [Agent Coordination Foundation Vision](../agent-coordination/vision.md) —
+- [Agent Coordination Foundation Vision](../architect/agent-coordination/vision.md) —
   foundation/domain split, runtime contracts, and small-core constraints.
-- [System Context](../agent-coordination/architecture/system-context.md) —
+- [System Context](../architect/agent-coordination/architecture/system-context.md) —
   boundaries, runtime profiles, and trust boundaries.
-- [Runtime Model](../agent-coordination/architecture/runtime-model.md) —
+- [Runtime Model](../architect/agent-coordination/architecture/runtime-model.md) —
   assignment execution chain, invariants, and failure domains.
-- [Dispatch Control Plane](../agent-coordination/architecture/dispatch-control-plane.md)
+- [Dispatch Control Plane](../architect/agent-coordination/architecture/dispatch-control-plane.md)
   — executor/provider/model/tier/mechanism governance boundary.
-- [Evidence And Results](../agent-coordination/architecture/evidence-and-results.md)
+- [Evidence And Results](../architect/agent-coordination/architecture/evidence-and-results.md)
   — RunResult confidence and evidence boundary.
-- [Work Integration](../agent-coordination/architecture/work-integration.md) —
+- [Work Integration](../architect/agent-coordination/architecture/work-integration.md) —
   Work lifecycle integration boundary.

```

## claim_919ee8461ba273f0a132459b308ab3ff

Source: `docs/architect/component-boundary/README.md#unheaded-block-40`. Target: `docs/platform/component-boundary.md#unheaded-block-199`.

Mechanical class: Judgment. Source digest: `71fbfcbcea0bd586d7648d00ac47a94997c3b1a3c7a1ae425b101bb9f339a75d`. Target digest: `2bc59f03868107f563cd20949b1754c5046da13e4b8ba4b71f745a9e6b4b1f31`.

Full shown source SHA256: `71fbfcbcea0bd586d7648d00ac47a94997c3b1a3c7a1ae425b101bb9f339a75d`. Full shown target SHA256: `2bc59f03868107f563cd20949b1754c5046da13e4b8ba4b71f745a9e6b4b1f31`.

### Proposed decision

```json
{
  "claimId": "claim_919ee8461ba273f0a132459b308ab3ff",
  "sourceUnitDigest": "71fbfcbcea0bd586d7648d00ac47a94997c3b1a3c7a1ae425b101bb9f339a75d",
  "targetOwner": "docs/platform/component-boundary.md",
  "targetAnchor": "unheaded-block-199",
  "targetUnitDigest": "2bc59f03868107f563cd20949b1754c5046da13e4b8ba4b71f745a9e6b4b1f31",
  "targetAncestry": [
    "Component Boundary",
    "Added in candidate: README source carriage",
    "Component Boundary Architecture",
    "5. External Review Links",
    "Related Agent Coordination Contracts"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:37@2026-10-15",
  "rationale": "Judgment: no target digest match. Carry the complete unheaded-block at docs/architect/component-boundary/README.md#unheaded-block-40 (lines 217–230) into docs/platform/component-boundary.md#unheaded-block-199 (lines 1370–1383), the frozen whole-system architecture owner. The source is appended as an explicitly labelled candidate subdivision to the existing anchor; original heading titles and every body line are retained, with heading levels changed only to preserve one H1. Digest differences come only from the recorded candidate header/frontmatter fence, heading-level shift or physical relative-link rebasing; full before/after units and line mapping are in authoring accounting. Source obligations, exceptions, open gaps, planned/unbuilt statements and design boundaries remain as written. No remainder, no source retirement, no promotion and no code-truth approval; independent review pending."
}
```

### Full source shown text

```text
- [Agent Coordination Portal](../agent-coordination/README.md) — reading entry
  for the Agent Coordination architecture set.
- [Agent Coordination Foundation Vision](../agent-coordination/vision.md) —
  foundation/domain split, runtime contracts, and small-core constraints.
- [System Context](../agent-coordination/architecture/system-context.md) —
  boundaries, runtime profiles, and trust boundaries.
- [Runtime Model](../agent-coordination/architecture/runtime-model.md) —
  assignment execution chain, invariants, and failure domains.
- [Dispatch Control Plane](../agent-coordination/architecture/dispatch-control-plane.md)
  — executor/provider/model/tier/mechanism governance boundary.
- [Evidence And Results](../agent-coordination/architecture/evidence-and-results.md)
  — RunResult confidence and evidence boundary.
- [Work Integration](../agent-coordination/architecture/work-integration.md) —
  Work lifecycle integration boundary.
```

### Full target shown text

```text
- [Agent Coordination Portal](../architect/agent-coordination/README.md) — reading entry
  for the Agent Coordination architecture set.
- [Agent Coordination Foundation Vision](../architect/agent-coordination/vision.md) —
  foundation/domain split, runtime contracts, and small-core constraints.
- [System Context](../architect/agent-coordination/architecture/system-context.md) —
  boundaries, runtime profiles, and trust boundaries.
- [Runtime Model](../architect/agent-coordination/architecture/runtime-model.md) —
  assignment execution chain, invariants, and failure domains.
- [Dispatch Control Plane](../architect/agent-coordination/architecture/dispatch-control-plane.md)
  — executor/provider/model/tier/mechanism governance boundary.
- [Evidence And Results](../architect/agent-coordination/architecture/evidence-and-results.md)
  — RunResult confidence and evidence boundary.
- [Work Integration](../architect/agent-coordination/architecture/work-integration.md) —
  Work lifecycle integration boundary.
```

### Unified diff

```diff
--- docs/architect/component-boundary/README.md#unheaded-block-40
+++ docs/platform/component-boundary.md#unheaded-block-199
@@ -1,14 +1,14 @@
-- [Agent Coordination Portal](../agent-coordination/README.md) — reading entry
+- [Agent Coordination Portal](../architect/agent-coordination/README.md) — reading entry
   for the Agent Coordination architecture set.
-- [Agent Coordination Foundation Vision](../agent-coordination/vision.md) —
+- [Agent Coordination Foundation Vision](../architect/agent-coordination/vision.md) —
   foundation/domain split, runtime contracts, and small-core constraints.
-- [System Context](../agent-coordination/architecture/system-context.md) —
+- [System Context](../architect/agent-coordination/architecture/system-context.md) —
   boundaries, runtime profiles, and trust boundaries.
-- [Runtime Model](../agent-coordination/architecture/runtime-model.md) —
+- [Runtime Model](../architect/agent-coordination/architecture/runtime-model.md) —
   assignment execution chain, invariants, and failure domains.
-- [Dispatch Control Plane](../agent-coordination/architecture/dispatch-control-plane.md)
+- [Dispatch Control Plane](../architect/agent-coordination/architecture/dispatch-control-plane.md)
   — executor/provider/model/tier/mechanism governance boundary.
-- [Evidence And Results](../agent-coordination/architecture/evidence-and-results.md)
+- [Evidence And Results](../architect/agent-coordination/architecture/evidence-and-results.md)
   — RunResult confidence and evidence boundary.
-- [Work Integration](../agent-coordination/architecture/work-integration.md) —
+- [Work Integration](../architect/agent-coordination/architecture/work-integration.md) —
   Work lifecycle integration boundary.

```
