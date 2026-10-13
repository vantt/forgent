# Packaging independent review: source-architecture 2

Content pin: `baef3a075899f83d515a28ab66abd6c3d55201c5`

Author: `codex-session:8@2026-10-13`; assembler: `codex-session:9@2026-10-13`. All proposals remain pending.

## claim_87a79a1055917fe0ccc476f20b00bacb

Source: docs/architect/packaging-distribution/README.md#unheaded-block-4

Target: docs/platform/packaging-distribution/README.md#unheaded-block-33

Source identity digest: `e8bb8f65be3c3511cda40637ad970817b3478efeee58ca50cee680eae06a28a4`

Target identity digest: `e8bb8f65be3c3511cda40637ad970817b3478efeee58ca50cee680eae06a28a4`

Source shown SHA256: `e8bb8f65be3c3511cda40637ad970817b3478efeee58ca50cee680eae06a28a4`

Target shown SHA256: `e8bb8f65be3c3511cda40637ad970817b3478efeee58ca50cee680eae06a28a4`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_87a79a1055917fe0ccc476f20b00bacb |
| sourceUnitDigest | e8bb8f65be3c3511cda40637ad970817b3478efeee58ca50cee680eae06a28a4 |
| targetOwner | docs/platform/packaging-distribution/README.md |
| targetAnchor | unheaded-block-33 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/README.md#unheaded-block-4, under "Packaging And Distribution Architecture", is retained at docs/platform/packaging-distribution/README.md#unheaded-block-33. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the packaging-distribution/README.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
This folder preserved the discussion that shaped the promoted fgOS
packaging/distribution mechanism. The promoted delivery target is not shared
web/gateway. The promoted target is a correct
project-local runtime model that can support:
```

### Target unit

```text
This folder preserved the discussion that shaped the promoted fgOS
packaging/distribution mechanism. The promoted delivery target is not shared
web/gateway. The promoted target is a correct
project-local runtime model that can support:
```

### Unified diff

```diff
No text difference.
```

## claim_c0cd0b1b3afe001a8f92d3421621dff1

Source: docs/architect/packaging-distribution/README.md#unheaded-block-5

Target: docs/platform/packaging-distribution/README.md#unheaded-block-34

Source identity digest: `53d64c17b9a2c78400bb847a5c3d6c19dd55290cdaf168c8505177a6342866f8`

Target identity digest: `53d64c17b9a2c78400bb847a5c3d6c19dd55290cdaf168c8505177a6342866f8`

Source shown SHA256: `53d64c17b9a2c78400bb847a5c3d6c19dd55290cdaf168c8505177a6342866f8`

Target shown SHA256: `53d64c17b9a2c78400bb847a5c3d6c19dd55290cdaf168c8505177a6342866f8`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_c0cd0b1b3afe001a8f92d3421621dff1 |
| sourceUnitDigest | 53d64c17b9a2c78400bb847a5c3d6c19dd55290cdaf168c8505177a6342866f8 |
| targetOwner | docs/platform/packaging-distribution/README.md |
| targetAnchor | unheaded-block-34 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/README.md#unheaded-block-5, under "Packaging And Distribution Architecture", is retained at docs/platform/packaging-distribution/README.md#unheaded-block-34. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the packaging-distribution/README.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
- `fgctl` as global/machine bootstrap and control;
- local `fgos` as project workflow authority;
- Rust `fgos` CLI distribution;
- legacy Node compatibility payload;
- project-local version safety;
- skills, agents, prose, docs, runner, init/doctor, and projections as part of
  one runtime identity story.
```

### Target unit

```text
- `fgctl` as global/machine bootstrap and control;
- local `fgos` as project workflow authority;
- Rust `fgos` CLI distribution;
- legacy Node compatibility payload;
- project-local version safety;
- skills, agents, prose, docs, runner, init/doctor, and projections as part of
  one runtime identity story.
```

### Unified diff

```diff
No text difference.
```

## claim_6741229cfdc5d39ced167646c763cffa

Source: docs/architect/packaging-distribution/README.md#1-historical-read-order

Target: docs/platform/packaging-distribution/README.md#1-historical-read-order

Source identity digest: `bbe95d34035f20022d650b13187b26135df1ee2f77dddb5bd7dbd0ddd641b9b1`

Target identity digest: `3eec93e722cb187e30a087567678012796959fb0762a1b99d9ede0eced1ce364`

Source shown SHA256: `e5dd7bccf4da7827f2af20ee5b5145e61fa98b2a579fce12270ad6eb285c0a6a`

Target shown SHA256: `ed3eb725b66450ce992c585d3fa025e0b68dfc95c087da385d02c4b77b090b7d`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_6741229cfdc5d39ced167646c763cffa |
| sourceUnitDigest | bbe95d34035f20022d650b13187b26135df1ee2f77dddb5bd7dbd0ddd641b9b1 |
| targetOwner | docs/platform/packaging-distribution/README.md |
| targetAnchor | 1-historical-read-order |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete heading from docs/architect/packaging-distribution/README.md#1-historical-read-order, under "1. Historical Read Order", is retained at docs/platform/packaging-distribution/README.md#1-historical-read-order. Only heading depth changes; the direct section payload follows the original source order. The named owner is the packaging-distribution/README.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
## 1. Historical Read Order

For current work, start at
[docs/platform/packaging-distribution/README.md](../../platform/packaging-distribution/README.md).
The older discussion order was:

1. [Workspace Topology Architecture](../workspace-topology.md) — root topology,
   state classes, worktree behavior, workspace activation binding, work-state
   writer compatibility, projection scope, locks, and dirty-tree rules.
2. [Promoted Runtime Identity And Activation](../../platform/packaging-distribution/architecture/runtime-identity-and-activation.md)
   — active promoted runtime architecture and first implementation target.
3. [Promoted Future Constraints](../../platform/packaging-distribution/architecture/future-constraints.md)
   — shared web/gateway, Project Runtime Adapter, and MCP/substrate constraints
   that packaging must not block, but does not deliver now.
4. [Distribution Baseline And Scattered Spec Fragments](./history/distribution-baseline.md)
   — old Node/npm distribution baseline and generated-spec fragments preserved
   as input/history.

The older generated specs under `docs/specs/*` are not edited during this
architecture churn. Once the design settles, update their generated source or
owning workflow and regenerate/check the spec projections.
```

### Target unit

```text
#### 1. Historical Read Order

For current work, start at
[docs/platform/packaging-distribution/README.md](README.md).
The older discussion order was:

1. [Workspace Topology Architecture](../../architect/workspace-topology.md) — root topology,
   state classes, worktree behavior, workspace activation binding, work-state
   writer compatibility, projection scope, locks, and dirty-tree rules.
2. [Promoted Runtime Identity And Activation](architecture/runtime-identity-and-activation.md)
   — active promoted runtime architecture and first implementation target.
3. [Promoted Future Constraints](architecture/future-constraints.md)
   — shared web/gateway, Project Runtime Adapter, and MCP/substrate constraints
   that packaging must not block, but does not deliver now.
4. [Distribution Baseline And Scattered Spec Fragments](../../architect/packaging-distribution/history/distribution-baseline.md)
   — old Node/npm distribution baseline and generated-spec fragments preserved
   as input/history.

The older generated specs under `docs/specs/*` are not edited during this
architecture churn. Once the design settles, update their generated source or
owning workflow and regenerate/check the spec projections.
```

### Unified diff

```diff
--- "docs/architect/packaging-distribution/README.md#1-historical-read-order"
+++ "docs/platform/packaging-distribution/README.md#1-historical-read-order"
@@ -1,18 +1,18 @@
-## 1. Historical Read Order
+#### 1. Historical Read Order
 
 For current work, start at
-[docs/platform/packaging-distribution/README.md](../../platform/packaging-distribution/README.md).
+[docs/platform/packaging-distribution/README.md](README.md).
 The older discussion order was:
 
-1. [Workspace Topology Architecture](../workspace-topology.md) — root topology,
+1. [Workspace Topology Architecture](../../architect/workspace-topology.md) — root topology,
    state classes, worktree behavior, workspace activation binding, work-state
    writer compatibility, projection scope, locks, and dirty-tree rules.
-2. [Promoted Runtime Identity And Activation](../../platform/packaging-distribution/architecture/runtime-identity-and-activation.md)
+2. [Promoted Runtime Identity And Activation](architecture/runtime-identity-and-activation.md)
    — active promoted runtime architecture and first implementation target.
-3. [Promoted Future Constraints](../../platform/packaging-distribution/architecture/future-constraints.md)
+3. [Promoted Future Constraints](architecture/future-constraints.md)
    — shared web/gateway, Project Runtime Adapter, and MCP/substrate constraints
    that packaging must not block, but does not deliver now.
-4. [Distribution Baseline And Scattered Spec Fragments](./history/distribution-baseline.md)
+4. [Distribution Baseline And Scattered Spec Fragments](../../architect/packaging-distribution/history/distribution-baseline.md)
    — old Node/npm distribution baseline and generated-spec fragments preserved
    as input/history.
```

## claim_180db2a5b2592775ada69d493e5e04f2

Source: docs/architect/packaging-distribution/README.md#unheaded-block-6

Target: docs/platform/packaging-distribution/README.md#unheaded-block-35

Source identity digest: `ddb0e3d1326432f99dfa4e828e4517494a4a5ee40338318923fe1a25cb18e124`

Target identity digest: `2b7884413eae24cc3c6fefa7a81a676d28189730e932edb9be5762ad86551dee`

Source shown SHA256: `ddb0e3d1326432f99dfa4e828e4517494a4a5ee40338318923fe1a25cb18e124`

Target shown SHA256: `2b7884413eae24cc3c6fefa7a81a676d28189730e932edb9be5762ad86551dee`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_180db2a5b2592775ada69d493e5e04f2 |
| sourceUnitDigest | ddb0e3d1326432f99dfa4e828e4517494a4a5ee40338318923fe1a25cb18e124 |
| targetOwner | docs/platform/packaging-distribution/README.md |
| targetAnchor | unheaded-block-35 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/README.md#unheaded-block-6, under "1. Historical Read Order", is retained at docs/platform/packaging-distribution/README.md#unheaded-block-35. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the packaging-distribution/README.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
For current work, start at
[docs/platform/packaging-distribution/README.md](../../platform/packaging-distribution/README.md).
The older discussion order was:
```

### Target unit

```text
For current work, start at
[docs/platform/packaging-distribution/README.md](README.md).
The older discussion order was:
```

### Unified diff

```diff
--- "docs/architect/packaging-distribution/README.md#unheaded-block-6"
+++ "docs/platform/packaging-distribution/README.md#unheaded-block-35"
@@ -1,3 +1,3 @@
 For current work, start at
-[docs/platform/packaging-distribution/README.md](../../platform/packaging-distribution/README.md).
+[docs/platform/packaging-distribution/README.md](README.md).
 The older discussion order was:
\ No newline at end of file
```

## claim_eb7642e47d0ae2c722553f41a0313065

Source: docs/architect/packaging-distribution/README.md#unheaded-block-7

Target: docs/platform/packaging-distribution/README.md#unheaded-block-36

Source identity digest: `734fe49bf07946dade79d0560271d7bd3a5504469f8ea396bc40d7e7f341764b`

Target identity digest: `467f04e58456e8e5a0bf3be6b9a065fb5ddbddf9606cff13954bc6f95200dea0`

Source shown SHA256: `734fe49bf07946dade79d0560271d7bd3a5504469f8ea396bc40d7e7f341764b`

Target shown SHA256: `467f04e58456e8e5a0bf3be6b9a065fb5ddbddf9606cff13954bc6f95200dea0`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_eb7642e47d0ae2c722553f41a0313065 |
| sourceUnitDigest | 734fe49bf07946dade79d0560271d7bd3a5504469f8ea396bc40d7e7f341764b |
| targetOwner | docs/platform/packaging-distribution/README.md |
| targetAnchor | unheaded-block-36 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/README.md#unheaded-block-7, under "1. Historical Read Order", is retained at docs/platform/packaging-distribution/README.md#unheaded-block-36. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the packaging-distribution/README.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
1. [Workspace Topology Architecture](../workspace-topology.md) — root topology,
   state classes, worktree behavior, workspace activation binding, work-state
   writer compatibility, projection scope, locks, and dirty-tree rules.
2. [Promoted Runtime Identity And Activation](../../platform/packaging-distribution/architecture/runtime-identity-and-activation.md)
   — active promoted runtime architecture and first implementation target.
3. [Promoted Future Constraints](../../platform/packaging-distribution/architecture/future-constraints.md)
   — shared web/gateway, Project Runtime Adapter, and MCP/substrate constraints
   that packaging must not block, but does not deliver now.
4. [Distribution Baseline And Scattered Spec Fragments](./history/distribution-baseline.md)
   — old Node/npm distribution baseline and generated-spec fragments preserved
   as input/history.
```

### Target unit

```text
1. [Workspace Topology Architecture](../../architect/workspace-topology.md) — root topology,
   state classes, worktree behavior, workspace activation binding, work-state
   writer compatibility, projection scope, locks, and dirty-tree rules.
2. [Promoted Runtime Identity And Activation](architecture/runtime-identity-and-activation.md)
   — active promoted runtime architecture and first implementation target.
3. [Promoted Future Constraints](architecture/future-constraints.md)
   — shared web/gateway, Project Runtime Adapter, and MCP/substrate constraints
   that packaging must not block, but does not deliver now.
4. [Distribution Baseline And Scattered Spec Fragments](../../architect/packaging-distribution/history/distribution-baseline.md)
   — old Node/npm distribution baseline and generated-spec fragments preserved
   as input/history.
```

### Unified diff

```diff
--- "docs/architect/packaging-distribution/README.md#unheaded-block-7"
+++ "docs/platform/packaging-distribution/README.md#unheaded-block-36"
@@ -1,11 +1,11 @@
-1. [Workspace Topology Architecture](../workspace-topology.md) — root topology,
+1. [Workspace Topology Architecture](../../architect/workspace-topology.md) — root topology,
    state classes, worktree behavior, workspace activation binding, work-state
    writer compatibility, projection scope, locks, and dirty-tree rules.
-2. [Promoted Runtime Identity And Activation](../../platform/packaging-distribution/architecture/runtime-identity-and-activation.md)
+2. [Promoted Runtime Identity And Activation](architecture/runtime-identity-and-activation.md)
    — active promoted runtime architecture and first implementation target.
-3. [Promoted Future Constraints](../../platform/packaging-distribution/architecture/future-constraints.md)
+3. [Promoted Future Constraints](architecture/future-constraints.md)
    — shared web/gateway, Project Runtime Adapter, and MCP/substrate constraints
    that packaging must not block, but does not deliver now.
-4. [Distribution Baseline And Scattered Spec Fragments](./history/distribution-baseline.md)
+4. [Distribution Baseline And Scattered Spec Fragments](../../architect/packaging-distribution/history/distribution-baseline.md)
    — old Node/npm distribution baseline and generated-spec fragments preserved
    as input/history.
\ No newline at end of file
```

## claim_c7ca681b20d38642b7df57b79289d6e5

Source: docs/architect/packaging-distribution/README.md#unheaded-block-8

Target: docs/platform/packaging-distribution/README.md#unheaded-block-37

Source identity digest: `434f7e5212d32995fd2f5b0b8241a715a1dabb4cf7c0d35e9a0c108f681bf694`

Target identity digest: `434f7e5212d32995fd2f5b0b8241a715a1dabb4cf7c0d35e9a0c108f681bf694`

Source shown SHA256: `434f7e5212d32995fd2f5b0b8241a715a1dabb4cf7c0d35e9a0c108f681bf694`

Target shown SHA256: `434f7e5212d32995fd2f5b0b8241a715a1dabb4cf7c0d35e9a0c108f681bf694`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_c7ca681b20d38642b7df57b79289d6e5 |
| sourceUnitDigest | 434f7e5212d32995fd2f5b0b8241a715a1dabb4cf7c0d35e9a0c108f681bf694 |
| targetOwner | docs/platform/packaging-distribution/README.md |
| targetAnchor | unheaded-block-37 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/README.md#unheaded-block-8, under "1. Historical Read Order", is retained at docs/platform/packaging-distribution/README.md#unheaded-block-37. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the packaging-distribution/README.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
The older generated specs under `docs/specs/*` are not edited during this
architecture churn. Once the design settles, update their generated source or
owning workflow and regenerate/check the spec projections.
```

### Target unit

```text
The older generated specs under `docs/specs/*` are not edited during this
architecture churn. Once the design settles, update their generated source or
owning workflow and regenerate/check the spec projections.
```

### Unified diff

```diff
No text difference.
```

## claim_5766225be2d76d6239e116a664aec7cf

Source: docs/architect/packaging-distribution/README.md#2-historical-supersession-table

Target: docs/platform/packaging-distribution/README.md#2-historical-supersession-table

Source identity digest: `70847eb505d007a2f2d5667bd66ecb218b1714f49112e48163ab449ad74f5dc8`

Target identity digest: `7a121f1faaa77b183e3e2d5b187d1ae7a2d65980bfa7a3a4ead0088e25ef938e`

Source shown SHA256: `c024c29002998a528c38f3b1d13c6b6c73cb3f8557c32c5347ec1ffbf3016396`

Target shown SHA256: `e272ae39b15dbf8dcf31bb459ecc812d21d5625a65a48a98e21cb57a47d73a64`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_5766225be2d76d6239e116a664aec7cf |
| sourceUnitDigest | 70847eb505d007a2f2d5667bd66ecb218b1714f49112e48163ab449ad74f5dc8 |
| targetOwner | docs/platform/packaging-distribution/README.md |
| targetAnchor | 2-historical-supersession-table |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete heading from docs/architect/packaging-distribution/README.md#2-historical-supersession-table, under "2. Historical Supersession Table", is retained at docs/platform/packaging-distribution/README.md#2-historical-supersession-table. Only heading depth changes; the direct section payload follows the original source order. The named owner is the packaging-distribution/README.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
## 2. Historical Supersession Table

| Topic | Active source to follow | Status |
|---|---|---|
| Runtime/workspace/work-state topology | [Workspace Topology Architecture](../workspace-topology.md) | Active architecture target. Supersedes any simpler "one project root / one runtime root" reading. Packaging must not own physical placement for config/event/coordination roots. |
| Release identity and activation | [Promoted Runtime Identity And Activation](../../platform/packaging-distribution/architecture/runtime-identity-and-activation.md) | Active architecture target. Uses per-workspace activation binding, not one repository-wide `active.json`. |
| Shared gateway/web | [Promoted Future Constraints](../../platform/packaging-distribution/architecture/future-constraints.md) | Future constraint only; not active delivery scope. |
| Old npm/global/setup install story | [Distribution Baseline And Scattered Spec Fragments](./history/distribution-baseline.md) | Historical input. Do not implement as target without explicit supersession. |
| `docs/specs/*` distribution wording | Generated specs | Read as current generated state plus historical constraints; not the target while this architecture stream is active. |
```

### Target unit

```text
#### 2. Historical Supersession Table

| Topic | Active source to follow | Status |
|---|---|---|
| Runtime/workspace/work-state topology | [Workspace Topology Architecture](../../architect/workspace-topology.md) | Active architecture target. Supersedes any simpler "one project root / one runtime root" reading. Packaging must not own physical placement for config/event/coordination roots. |
| Release identity and activation | [Promoted Runtime Identity And Activation](architecture/runtime-identity-and-activation.md) | Active architecture target. Uses per-workspace activation binding, not one repository-wide `active.json`. |
| Shared gateway/web | [Promoted Future Constraints](architecture/future-constraints.md) | Future constraint only; not active delivery scope. |
| Old npm/global/setup install story | [Distribution Baseline And Scattered Spec Fragments](../../architect/packaging-distribution/history/distribution-baseline.md) | Historical input. Do not implement as target without explicit supersession. |
| `docs/specs/*` distribution wording | Generated specs | Read as current generated state plus historical constraints; not the target while this architecture stream is active. |
```

### Unified diff

```diff
--- "docs/architect/packaging-distribution/README.md#2-historical-supersession-table"
+++ "docs/platform/packaging-distribution/README.md#2-historical-supersession-table"
@@ -1,9 +1,9 @@
-## 2. Historical Supersession Table
+#### 2. Historical Supersession Table
 
 | Topic | Active source to follow | Status |
 |---|---|---|
-| Runtime/workspace/work-state topology | [Workspace Topology Architecture](../workspace-topology.md) | Active architecture target. Supersedes any simpler "one project root / one runtime root" reading. Packaging must not own physical placement for config/event/coordination roots. |
-| Release identity and activation | [Promoted Runtime Identity And Activation](../../platform/packaging-distribution/architecture/runtime-identity-and-activation.md) | Active architecture target. Uses per-workspace activation binding, not one repository-wide `active.json`. |
-| Shared gateway/web | [Promoted Future Constraints](../../platform/packaging-distribution/architecture/future-constraints.md) | Future constraint only; not active delivery scope. |
-| Old npm/global/setup install story | [Distribution Baseline And Scattered Spec Fragments](./history/distribution-baseline.md) | Historical input. Do not implement as target without explicit supersession. |
+| Runtime/workspace/work-state topology | [Workspace Topology Architecture](../../architect/workspace-topology.md) | Active architecture target. Supersedes any simpler "one project root / one runtime root" reading. Packaging must not own physical placement for config/event/coordination roots. |
+| Release identity and activation | [Promoted Runtime Identity And Activation](architecture/runtime-identity-and-activation.md) | Active architecture target. Uses per-workspace activation binding, not one repository-wide `active.json`. |
+| Shared gateway/web | [Promoted Future Constraints](architecture/future-constraints.md) | Future constraint only; not active delivery scope. |
+| Old npm/global/setup install story | [Distribution Baseline And Scattered Spec Fragments](../../architect/packaging-distribution/history/distribution-baseline.md) | Historical input. Do not implement as target without explicit supersession. |
 | `docs/specs/*` distribution wording | Generated specs | Read as current generated state plus historical constraints; not the target while this architecture stream is active. |
\ No newline at end of file
```

## claim_37a8691bba650ed4cd9d98314b6a2b1a

Source: docs/architect/packaging-distribution/README.md#unheaded-block-9

Target: docs/platform/packaging-distribution/README.md#unheaded-block-38

Source identity digest: `302168079cde3ef23795b07c1b04407141262f1af1a9586a56c7e39059878d29`

Target identity digest: `8938a4cbe3f1099f298566f2fd822d2745030454f4f50025e8f9ff685a38f405`

Source shown SHA256: `302168079cde3ef23795b07c1b04407141262f1af1a9586a56c7e39059878d29`

Target shown SHA256: `8938a4cbe3f1099f298566f2fd822d2745030454f4f50025e8f9ff685a38f405`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_37a8691bba650ed4cd9d98314b6a2b1a |
| sourceUnitDigest | 302168079cde3ef23795b07c1b04407141262f1af1a9586a56c7e39059878d29 |
| targetOwner | docs/platform/packaging-distribution/README.md |
| targetAnchor | unheaded-block-38 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/README.md#unheaded-block-9, under "2. Historical Supersession Table", is retained at docs/platform/packaging-distribution/README.md#unheaded-block-38. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the packaging-distribution/README.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
| Topic | Active source to follow | Status |
|---|---|---|
| Runtime/workspace/work-state topology | [Workspace Topology Architecture](../workspace-topology.md) | Active architecture target. Supersedes any simpler "one project root / one runtime root" reading. Packaging must not own physical placement for config/event/coordination roots. |
| Release identity and activation | [Promoted Runtime Identity And Activation](../../platform/packaging-distribution/architecture/runtime-identity-and-activation.md) | Active architecture target. Uses per-workspace activation binding, not one repository-wide `active.json`. |
| Shared gateway/web | [Promoted Future Constraints](../../platform/packaging-distribution/architecture/future-constraints.md) | Future constraint only; not active delivery scope. |
| Old npm/global/setup install story | [Distribution Baseline And Scattered Spec Fragments](./history/distribution-baseline.md) | Historical input. Do not implement as target without explicit supersession. |
| `docs/specs/*` distribution wording | Generated specs | Read as current generated state plus historical constraints; not the target while this architecture stream is active. |
```

### Target unit

```text
| Topic | Active source to follow | Status |
|---|---|---|
| Runtime/workspace/work-state topology | [Workspace Topology Architecture](../../architect/workspace-topology.md) | Active architecture target. Supersedes any simpler "one project root / one runtime root" reading. Packaging must not own physical placement for config/event/coordination roots. |
| Release identity and activation | [Promoted Runtime Identity And Activation](architecture/runtime-identity-and-activation.md) | Active architecture target. Uses per-workspace activation binding, not one repository-wide `active.json`. |
| Shared gateway/web | [Promoted Future Constraints](architecture/future-constraints.md) | Future constraint only; not active delivery scope. |
| Old npm/global/setup install story | [Distribution Baseline And Scattered Spec Fragments](../../architect/packaging-distribution/history/distribution-baseline.md) | Historical input. Do not implement as target without explicit supersession. |
| `docs/specs/*` distribution wording | Generated specs | Read as current generated state plus historical constraints; not the target while this architecture stream is active. |
```

### Unified diff

```diff
--- "docs/architect/packaging-distribution/README.md#unheaded-block-9"
+++ "docs/platform/packaging-distribution/README.md#unheaded-block-38"
@@ -1,7 +1,7 @@
 | Topic | Active source to follow | Status |
 |---|---|---|
-| Runtime/workspace/work-state topology | [Workspace Topology Architecture](../workspace-topology.md) | Active architecture target. Supersedes any simpler "one project root / one runtime root" reading. Packaging must not own physical placement for config/event/coordination roots. |
-| Release identity and activation | [Promoted Runtime Identity And Activation](../../platform/packaging-distribution/architecture/runtime-identity-and-activation.md) | Active architecture target. Uses per-workspace activation binding, not one repository-wide `active.json`. |
-| Shared gateway/web | [Promoted Future Constraints](../../platform/packaging-distribution/architecture/future-constraints.md) | Future constraint only; not active delivery scope. |
-| Old npm/global/setup install story | [Distribution Baseline And Scattered Spec Fragments](./history/distribution-baseline.md) | Historical input. Do not implement as target without explicit supersession. |
+| Runtime/workspace/work-state topology | [Workspace Topology Architecture](../../architect/workspace-topology.md) | Active architecture target. Supersedes any simpler "one project root / one runtime root" reading. Packaging must not own physical placement for config/event/coordination roots. |
+| Release identity and activation | [Promoted Runtime Identity And Activation](architecture/runtime-identity-and-activation.md) | Active architecture target. Uses per-workspace activation binding, not one repository-wide `active.json`. |
+| Shared gateway/web | [Promoted Future Constraints](architecture/future-constraints.md) | Future constraint only; not active delivery scope. |
+| Old npm/global/setup install story | [Distribution Baseline And Scattered Spec Fragments](../../architect/packaging-distribution/history/distribution-baseline.md) | Historical input. Do not implement as target without explicit supersession. |
 | `docs/specs/*` distribution wording | Generated specs | Read as current generated state plus historical constraints; not the target while this architecture stream is active. |
\ No newline at end of file
```

## claim_b8f77a61e158f2e2d0415b1bad9a1134

Source: docs/architect/packaging-distribution/README.md#3-boundary-rule

Target: docs/platform/packaging-distribution/README.md#3-boundary-rule

Source identity digest: `9228108e0d5497dd10dc107ece2808b149a3b791de5da8db82f9b1c1ac8d2103`

Target identity digest: `d03d88bb8cf5b0f6f33ec75596e194e5b1e06243ab88d4ae77413714509d2e7c`

Source shown SHA256: `a70a53208fd9d3d372247723a32cf1e819513515adee1794c28c922c7af2e950`

Target shown SHA256: `d4162aab52d876f2bef7dc9c9ef7d39e1b6a6258d36d79d1734ab6d9535a71b7`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_b8f77a61e158f2e2d0415b1bad9a1134 |
| sourceUnitDigest | 9228108e0d5497dd10dc107ece2808b149a3b791de5da8db82f9b1c1ac8d2103 |
| targetOwner | docs/platform/packaging-distribution/README.md |
| targetAnchor | 3-boundary-rule |
| claimKind | contract |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete heading from docs/architect/packaging-distribution/README.md#3-boundary-rule, under "3. Boundary Rule", is retained at docs/platform/packaging-distribution/README.md#3-boundary-rule. Only heading depth changes; the direct section payload follows the original source order. The named owner is the packaging-distribution/README.md topic owner; carriage does not certify current implementation. |

### Source unit

````text
## 3. Boundary Rule

Use this rule to decide whether a detail belongs in packaging/distribution:

```txt
If the detail affects which fgOS runtime is selected, trusted, activated,
materialized, repaired, upgraded, or allowed to mutate a project, it belongs in
packaging/distribution.
```

Use this rule to route details elsewhere:

```txt
If the detail assumes the correct local runtime is already selected, then it
probably belongs in host invocation, runner, work-state, agent coordination,
domainization, or gateway architecture instead.
```
````

### Target unit

````text
#### 3. Boundary Rule

Use this rule to decide whether a detail belongs in packaging/distribution:

```txt
If the detail affects which fgOS runtime is selected, trusted, activated,
materialized, repaired, upgraded, or allowed to mutate a project, it belongs in
packaging/distribution.
```

Use this rule to route details elsewhere:

```txt
If the detail assumes the correct local runtime is already selected, then it
probably belongs in host invocation, runner, work-state, agent coordination,
domainization, or gateway architecture instead.
```
````

### Unified diff

```diff
--- "docs/architect/packaging-distribution/README.md#3-boundary-rule"
+++ "docs/platform/packaging-distribution/README.md#3-boundary-rule"
@@ -1,4 +1,4 @@
-## 3. Boundary Rule
+#### 3. Boundary Rule
 
 Use this rule to decide whether a detail belongs in packaging/distribution:
```

## claim_f3dd063ca7c7f474e8da47a41a50383f

Source: docs/architect/packaging-distribution/README.md#unheaded-block-10

Target: docs/platform/packaging-distribution/README.md#unheaded-block-39

Source identity digest: `0a60f4e2b6313ac8efb1e1923ff5e4010b74da93e88909aa00aa045b8e0a498d`

Target identity digest: `0a60f4e2b6313ac8efb1e1923ff5e4010b74da93e88909aa00aa045b8e0a498d`

Source shown SHA256: `0a60f4e2b6313ac8efb1e1923ff5e4010b74da93e88909aa00aa045b8e0a498d`

Target shown SHA256: `0a60f4e2b6313ac8efb1e1923ff5e4010b74da93e88909aa00aa045b8e0a498d`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_f3dd063ca7c7f474e8da47a41a50383f |
| sourceUnitDigest | 0a60f4e2b6313ac8efb1e1923ff5e4010b74da93e88909aa00aa045b8e0a498d |
| targetOwner | docs/platform/packaging-distribution/README.md |
| targetAnchor | unheaded-block-39 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/README.md#unheaded-block-10, under "3. Boundary Rule", is retained at docs/platform/packaging-distribution/README.md#unheaded-block-39. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the packaging-distribution/README.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
Use this rule to decide whether a detail belongs in packaging/distribution:
```

### Target unit

```text
Use this rule to decide whether a detail belongs in packaging/distribution:
```

### Unified diff

```diff
No text difference.
```

## claim_bfdccc161efc745d832eb3bf7b6154a1

Source: docs/architect/packaging-distribution/README.md#unheaded-block-11

Target: docs/platform/packaging-distribution/README.md#unheaded-block-40

Source identity digest: `1be4e9dc644b384e3c0655848c7b9879278f209877b7bc711e3504e92c8029d3`

Target identity digest: `1be4e9dc644b384e3c0655848c7b9879278f209877b7bc711e3504e92c8029d3`

Source shown SHA256: `1be4e9dc644b384e3c0655848c7b9879278f209877b7bc711e3504e92c8029d3`

Target shown SHA256: `1be4e9dc644b384e3c0655848c7b9879278f209877b7bc711e3504e92c8029d3`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_bfdccc161efc745d832eb3bf7b6154a1 |
| sourceUnitDigest | 1be4e9dc644b384e3c0655848c7b9879278f209877b7bc711e3504e92c8029d3 |
| targetOwner | docs/platform/packaging-distribution/README.md |
| targetAnchor | unheaded-block-40 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/README.md#unheaded-block-11, under "3. Boundary Rule", is retained at docs/platform/packaging-distribution/README.md#unheaded-block-40. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the packaging-distribution/README.md topic owner; carriage does not certify current implementation. |

### Source unit

````text
```txt
If the detail affects which fgOS runtime is selected, trusted, activated,
materialized, repaired, upgraded, or allowed to mutate a project, it belongs in
packaging/distribution.
```
````

### Target unit

````text
```txt
If the detail affects which fgOS runtime is selected, trusted, activated,
materialized, repaired, upgraded, or allowed to mutate a project, it belongs in
packaging/distribution.
```
````

### Unified diff

```diff
No text difference.
```

## claim_1b30715275684d16118b9373a00ca0cc

Source: docs/architect/packaging-distribution/README.md#unheaded-block-12

Target: docs/platform/packaging-distribution/README.md#unheaded-block-41

Source identity digest: `dd70e6a22ccab874d595de520b432d84094de92fd7b9623f3d361188d2b78c1e`

Target identity digest: `dd70e6a22ccab874d595de520b432d84094de92fd7b9623f3d361188d2b78c1e`

Source shown SHA256: `dd70e6a22ccab874d595de520b432d84094de92fd7b9623f3d361188d2b78c1e`

Target shown SHA256: `dd70e6a22ccab874d595de520b432d84094de92fd7b9623f3d361188d2b78c1e`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_1b30715275684d16118b9373a00ca0cc |
| sourceUnitDigest | dd70e6a22ccab874d595de520b432d84094de92fd7b9623f3d361188d2b78c1e |
| targetOwner | docs/platform/packaging-distribution/README.md |
| targetAnchor | unheaded-block-41 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/README.md#unheaded-block-12, under "3. Boundary Rule", is retained at docs/platform/packaging-distribution/README.md#unheaded-block-41. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the packaging-distribution/README.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
Use this rule to route details elsewhere:
```

### Target unit

```text
Use this rule to route details elsewhere:
```

### Unified diff

```diff
No text difference.
```

## claim_160a74067f855695f01d618db867f6fc

Source: docs/architect/packaging-distribution/README.md#unheaded-block-13

Target: docs/platform/packaging-distribution/README.md#unheaded-block-42

Source identity digest: `cdfa808721d08c512f30866e110c0914aacdbebe248350925515e45fd291928e`

Target identity digest: `cdfa808721d08c512f30866e110c0914aacdbebe248350925515e45fd291928e`

Source shown SHA256: `cdfa808721d08c512f30866e110c0914aacdbebe248350925515e45fd291928e`

Target shown SHA256: `cdfa808721d08c512f30866e110c0914aacdbebe248350925515e45fd291928e`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_160a74067f855695f01d618db867f6fc |
| sourceUnitDigest | cdfa808721d08c512f30866e110c0914aacdbebe248350925515e45fd291928e |
| targetOwner | docs/platform/packaging-distribution/README.md |
| targetAnchor | unheaded-block-42 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/README.md#unheaded-block-13, under "3. Boundary Rule", is retained at docs/platform/packaging-distribution/README.md#unheaded-block-42. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the packaging-distribution/README.md topic owner; carriage does not certify current implementation. |

### Source unit

````text
```txt
If the detail assumes the correct local runtime is already selected, then it
probably belongs in host invocation, runner, work-state, agent coordination,
domainization, or gateway architecture instead.
```
````

### Target unit

````text
```txt
If the detail assumes the correct local runtime is already selected, then it
probably belongs in host invocation, runner, work-state, agent coordination,
domainization, or gateway architecture instead.
```
````

### Unified diff

```diff
No text difference.
```

## claim_51bb85bbe9c18ac836770ed6a9d46fea

Source: docs/architect/packaging-distribution/README.md#4-vocabulary

Target: docs/platform/packaging-distribution/README.md#4-vocabulary

Source identity digest: `2db527ce06af8c9d7ef5c2dee5de5dd0b6ecb5dd7fae5080af3e5cec8146bfbc`

Target identity digest: `ffff2b7a3d064d22a14a5bdd418804d487e8974a116b70bcbf1270584822d5cc`

Source shown SHA256: `b9c0e49aad652946e618120fa649e1f94182fc92f4cf61701431f2180d34d5bc`

Target shown SHA256: `e6af753b607f8f16d73af77b6f0bbc51d864b673ac009b4c4c4b6c47c3b3ac6e`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_51bb85bbe9c18ac836770ed6a9d46fea |
| sourceUnitDigest | 2db527ce06af8c9d7ef5c2dee5de5dd0b6ecb5dd7fae5080af3e5cec8146bfbc |
| targetOwner | docs/platform/packaging-distribution/README.md |
| targetAnchor | 4-vocabulary |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete heading from docs/architect/packaging-distribution/README.md#4-vocabulary, under "4. Vocabulary", is retained at docs/platform/packaging-distribution/README.md#4-vocabulary. Only heading depth changes; the direct section payload follows the original source order. The named owner is the packaging-distribution/README.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
## 4. Vocabulary

| Term | Meaning |
|---|---|
| `fgctl` | Global/machine bootstrap and control command. Installs, stages, verifies, activates, repairs, upgrades, and later may control machine services. It does not own project workflow semantics. |
| local `fgos` | Project-local workflow/runtime command entered through the workspace installation shim, normally `.fgos/installation/bin/fgos`. Owns project semantics after an active runtime is selected. |
| release store root | Shared content-addressed machine/trust-domain store for immutable releases, installs, install lock, and quarantine. Multiple repositories may share one artifact by digest. |
| workspace installation root | Ignored per-workspace area for activation binding, stable shims, root binding, and projection ledger. |
| work-state root | Authoritative fgOS work-state home for durable workflow history. Its physical placement is owned by workspace topology / work-state architecture, not packaging. |
| workspace root | Checkout/worktree where fgOS drives work and where branch-local config/pin/projections are relative. |
| release | Immutable fgOS runtime payload under the release store root. |
| release tree manifest | Canonical logical file-tree manifest for a release. Its digest is the runtime artifact identity. |
| `artifactDigest` | Digest of the canonical release tree manifest, not an archive digest. |
| stable shim | Thin executable under `.fgos/installation/bin/` that reads active runtime identity and execs the active release entry. |
| activation binding | Per-workspace durable ready pointer, currently `activation.json`, written by `fgctl` after candidate runtime is prepared. |
| pin | Git-tracked project policy that says which fgOS runtime version/digest/channel the project wants. |
| projection ledger | Record of host-visible generated files such as `.agents/skills`, `.claude/skills`, or managed instruction blocks. |
```

### Target unit

```text
#### 4. Vocabulary

| Term | Meaning |
|---|---|
| `fgctl` | Global/machine bootstrap and control command. Installs, stages, verifies, activates, repairs, upgrades, and later may control machine services. It does not own project workflow semantics. |
| local `fgos` | Project-local workflow/runtime command entered through the workspace installation shim, normally `.fgos/installation/bin/fgos`. Owns project semantics after an active runtime is selected. |
| release store root | Shared content-addressed machine/trust-domain store for immutable releases, installs, install lock, and quarantine. Multiple repositories may share one artifact by digest. |
| workspace installation root | Ignored per-workspace area for activation binding, stable shims, root binding, and projection ledger. |
| work-state root | Authoritative fgOS work-state home for durable workflow history. Its physical placement is owned by workspace topology / work-state architecture, not packaging. |
| workspace root | Checkout/worktree where fgOS drives work and where branch-local config/pin/projections are relative. |
| release | Immutable fgOS runtime payload under the release store root. |
| release tree manifest | Canonical logical file-tree manifest for a release. Its digest is the runtime artifact identity. |
| `artifactDigest` | Digest of the canonical release tree manifest, not an archive digest. |
| stable shim | Thin executable under `.fgos/installation/bin/` that reads active runtime identity and execs the active release entry. |
| activation binding | Per-workspace durable ready pointer, currently `activation.json`, written by `fgctl` after candidate runtime is prepared. |
| pin | Git-tracked project policy that says which fgOS runtime version/digest/channel the project wants. |
| projection ledger | Record of host-visible generated files such as `.agents/skills`, `.claude/skills`, or managed instruction blocks. |
```

### Unified diff

```diff
--- "docs/architect/packaging-distribution/README.md#4-vocabulary"
+++ "docs/platform/packaging-distribution/README.md#4-vocabulary"
@@ -1,4 +1,4 @@
-## 4. Vocabulary
+#### 4. Vocabulary
 
 | Term | Meaning |
 |---|---|
```

## claim_40f219141e05c4af2cdf0a25a5841c94

Source: docs/architect/packaging-distribution/README.md#unheaded-block-14

Target: docs/platform/packaging-distribution/README.md#unheaded-block-43

Source identity digest: `0bdf31457ee770dfc66c1d4bd8e1a779e304668a18676942a42a4483e7d579fc`

Target identity digest: `0bdf31457ee770dfc66c1d4bd8e1a779e304668a18676942a42a4483e7d579fc`

Source shown SHA256: `0bdf31457ee770dfc66c1d4bd8e1a779e304668a18676942a42a4483e7d579fc`

Target shown SHA256: `0bdf31457ee770dfc66c1d4bd8e1a779e304668a18676942a42a4483e7d579fc`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_40f219141e05c4af2cdf0a25a5841c94 |
| sourceUnitDigest | 0bdf31457ee770dfc66c1d4bd8e1a779e304668a18676942a42a4483e7d579fc |
| targetOwner | docs/platform/packaging-distribution/README.md |
| targetAnchor | unheaded-block-43 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/README.md#unheaded-block-14, under "4. Vocabulary", is retained at docs/platform/packaging-distribution/README.md#unheaded-block-43. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the packaging-distribution/README.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
| Term | Meaning |
|---|---|
| `fgctl` | Global/machine bootstrap and control command. Installs, stages, verifies, activates, repairs, upgrades, and later may control machine services. It does not own project workflow semantics. |
| local `fgos` | Project-local workflow/runtime command entered through the workspace installation shim, normally `.fgos/installation/bin/fgos`. Owns project semantics after an active runtime is selected. |
| release store root | Shared content-addressed machine/trust-domain store for immutable releases, installs, install lock, and quarantine. Multiple repositories may share one artifact by digest. |
| workspace installation root | Ignored per-workspace area for activation binding, stable shims, root binding, and projection ledger. |
| work-state root | Authoritative fgOS work-state home for durable workflow history. Its physical placement is owned by workspace topology / work-state architecture, not packaging. |
| workspace root | Checkout/worktree where fgOS drives work and where branch-local config/pin/projections are relative. |
| release | Immutable fgOS runtime payload under the release store root. |
| release tree manifest | Canonical logical file-tree manifest for a release. Its digest is the runtime artifact identity. |
| `artifactDigest` | Digest of the canonical release tree manifest, not an archive digest. |
| stable shim | Thin executable under `.fgos/installation/bin/` that reads active runtime identity and execs the active release entry. |
| activation binding | Per-workspace durable ready pointer, currently `activation.json`, written by `fgctl` after candidate runtime is prepared. |
| pin | Git-tracked project policy that says which fgOS runtime version/digest/channel the project wants. |
| projection ledger | Record of host-visible generated files such as `.agents/skills`, `.claude/skills`, or managed instruction blocks. |
```

### Target unit

```text
| Term | Meaning |
|---|---|
| `fgctl` | Global/machine bootstrap and control command. Installs, stages, verifies, activates, repairs, upgrades, and later may control machine services. It does not own project workflow semantics. |
| local `fgos` | Project-local workflow/runtime command entered through the workspace installation shim, normally `.fgos/installation/bin/fgos`. Owns project semantics after an active runtime is selected. |
| release store root | Shared content-addressed machine/trust-domain store for immutable releases, installs, install lock, and quarantine. Multiple repositories may share one artifact by digest. |
| workspace installation root | Ignored per-workspace area for activation binding, stable shims, root binding, and projection ledger. |
| work-state root | Authoritative fgOS work-state home for durable workflow history. Its physical placement is owned by workspace topology / work-state architecture, not packaging. |
| workspace root | Checkout/worktree where fgOS drives work and where branch-local config/pin/projections are relative. |
| release | Immutable fgOS runtime payload under the release store root. |
| release tree manifest | Canonical logical file-tree manifest for a release. Its digest is the runtime artifact identity. |
| `artifactDigest` | Digest of the canonical release tree manifest, not an archive digest. |
| stable shim | Thin executable under `.fgos/installation/bin/` that reads active runtime identity and execs the active release entry. |
| activation binding | Per-workspace durable ready pointer, currently `activation.json`, written by `fgctl` after candidate runtime is prepared. |
| pin | Git-tracked project policy that says which fgOS runtime version/digest/channel the project wants. |
| projection ledger | Record of host-visible generated files such as `.agents/skills`, `.claude/skills`, or managed instruction blocks. |
```

### Unified diff

```diff
No text difference.
```

## claim_59e13b2acbe865701b281dab235a030c

Source: docs/architect/packaging-distribution/README.md#5-historical-design-position

Target: docs/platform/packaging-distribution/README.md#5-historical-design-position

Source identity digest: `59c1f6cb2795050263d881ffeba30a6819b8ef0592bfc1a6e691a60f5bc55ea9`

Target identity digest: `feb175bf0848b0faaf2d7e608f2f6e825aa4a44ab294b8dfc61e343c0ba2b94c`

Source shown SHA256: `05d3a64497e64231b7a0ea35faf887324427409cc93b476c9a606d998aecdd87`

Target shown SHA256: `7077e0927abd0e426948f0b75896361db2cb389a1fe63b093d691fa9a7c75ccb`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_59e13b2acbe865701b281dab235a030c |
| sourceUnitDigest | 59c1f6cb2795050263d881ffeba30a6819b8ef0592bfc1a6e691a60f5bc55ea9 |
| targetOwner | docs/platform/packaging-distribution/README.md |
| targetAnchor | 5-historical-design-position |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete heading from docs/architect/packaging-distribution/README.md#5-historical-design-position, under "5. Historical Design Position", is retained at docs/platform/packaging-distribution/README.md#5-historical-design-position. Only heading depth changes; the direct section payload follows the original source order. The named owner is the packaging-distribution/README.md topic owner; carriage does not certify current implementation. |

### Source unit

````text
## 5. Historical Design Position

The promoted architecture position captured from this discussion is:

```txt
fgctl
  -> acquire/stage/verify release into shared release store
  -> prepare workspace installation capsule
  -> install stable local shims
  -> publish per-workspace activation binding
  -> invoke active local fgos init / doctor --fix / doctor for projection/config repair

local fgos
  -> read workspace activation binding
  -> lease workspace/work-state/runtime identity
  -> enforce state-schema compatibility
  -> run project workflow semantics
  -> materialize projections through init/doctor --fix

release payload
  -> Rust host or Node host
  -> legacy Node compatibility payload when needed
  -> fgos-runner
  -> skills, agents, prose, docs
  -> init/doctor registries
```

Shared web/gateway remains a future constraint: the packaging model must not
make it impossible for one dashboard/gateway to serve many projects later, but
that implementation is outside the active delivery scope.
````

### Target unit

````text
#### 5. Historical Design Position

The promoted architecture position captured from this discussion is:

```txt
fgctl
  -> acquire/stage/verify release into shared release store
  -> prepare workspace installation capsule
  -> install stable local shims
  -> publish per-workspace activation binding
  -> invoke active local fgos init / doctor --fix / doctor for projection/config repair

local fgos
  -> read workspace activation binding
  -> lease workspace/work-state/runtime identity
  -> enforce state-schema compatibility
  -> run project workflow semantics
  -> materialize projections through init/doctor --fix

release payload
  -> Rust host or Node host
  -> legacy Node compatibility payload when needed
  -> fgos-runner
  -> skills, agents, prose, docs
  -> init/doctor registries
```

Shared web/gateway remains a future constraint: the packaging model must not
make it impossible for one dashboard/gateway to serve many projects later, but
that implementation is outside the active delivery scope.
````

### Unified diff

```diff
--- "docs/architect/packaging-distribution/README.md#5-historical-design-position"
+++ "docs/platform/packaging-distribution/README.md#5-historical-design-position"
@@ -1,4 +1,4 @@
-## 5. Historical Design Position
+#### 5. Historical Design Position
 
 The promoted architecture position captured from this discussion is:
```

## claim_3469a1790d794aebbe6b19a1eecdace1

Source: docs/architect/packaging-distribution/README.md#unheaded-block-15

Target: docs/platform/packaging-distribution/README.md#unheaded-block-44

Source identity digest: `3d4f84a55e987e30f703d7e725daafdb5f9ec0e8987e7365428338730116cf62`

Target identity digest: `3d4f84a55e987e30f703d7e725daafdb5f9ec0e8987e7365428338730116cf62`

Source shown SHA256: `3d4f84a55e987e30f703d7e725daafdb5f9ec0e8987e7365428338730116cf62`

Target shown SHA256: `3d4f84a55e987e30f703d7e725daafdb5f9ec0e8987e7365428338730116cf62`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_3469a1790d794aebbe6b19a1eecdace1 |
| sourceUnitDigest | 3d4f84a55e987e30f703d7e725daafdb5f9ec0e8987e7365428338730116cf62 |
| targetOwner | docs/platform/packaging-distribution/README.md |
| targetAnchor | unheaded-block-44 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/README.md#unheaded-block-15, under "5. Historical Design Position", is retained at docs/platform/packaging-distribution/README.md#unheaded-block-44. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the packaging-distribution/README.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
The promoted architecture position captured from this discussion is:
```

### Target unit

```text
The promoted architecture position captured from this discussion is:
```

### Unified diff

```diff
No text difference.
```

## claim_62dbba9d00bfd8726135dd30b61cf286

Source: docs/architect/packaging-distribution/README.md#unheaded-block-16

Target: docs/platform/packaging-distribution/README.md#unheaded-block-45

Source identity digest: `705690940b23bbee774aeb8374e2203364dd67095f8a24683925f963665bba5b`

Target identity digest: `705690940b23bbee774aeb8374e2203364dd67095f8a24683925f963665bba5b`

Source shown SHA256: `705690940b23bbee774aeb8374e2203364dd67095f8a24683925f963665bba5b`

Target shown SHA256: `705690940b23bbee774aeb8374e2203364dd67095f8a24683925f963665bba5b`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_62dbba9d00bfd8726135dd30b61cf286 |
| sourceUnitDigest | 705690940b23bbee774aeb8374e2203364dd67095f8a24683925f963665bba5b |
| targetOwner | docs/platform/packaging-distribution/README.md |
| targetAnchor | unheaded-block-45 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/README.md#unheaded-block-16, under "5. Historical Design Position", is retained at docs/platform/packaging-distribution/README.md#unheaded-block-45. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the packaging-distribution/README.md topic owner; carriage does not certify current implementation. |

### Source unit

````text
```txt
fgctl
  -> acquire/stage/verify release into shared release store
  -> prepare workspace installation capsule
  -> install stable local shims
  -> publish per-workspace activation binding
  -> invoke active local fgos init / doctor --fix / doctor for projection/config repair

local fgos
  -> read workspace activation binding
  -> lease workspace/work-state/runtime identity
  -> enforce state-schema compatibility
  -> run project workflow semantics
  -> materialize projections through init/doctor --fix

release payload
  -> Rust host or Node host
  -> legacy Node compatibility payload when needed
  -> fgos-runner
  -> skills, agents, prose, docs
  -> init/doctor registries
```
````

### Target unit

````text
```txt
fgctl
  -> acquire/stage/verify release into shared release store
  -> prepare workspace installation capsule
  -> install stable local shims
  -> publish per-workspace activation binding
  -> invoke active local fgos init / doctor --fix / doctor for projection/config repair

local fgos
  -> read workspace activation binding
  -> lease workspace/work-state/runtime identity
  -> enforce state-schema compatibility
  -> run project workflow semantics
  -> materialize projections through init/doctor --fix

release payload
  -> Rust host or Node host
  -> legacy Node compatibility payload when needed
  -> fgos-runner
  -> skills, agents, prose, docs
  -> init/doctor registries
```
````

### Unified diff

```diff
No text difference.
```

## claim_655aebe301e25232a80c6f34bba289b8

Source: docs/architect/packaging-distribution/README.md#unheaded-block-17

Target: docs/platform/packaging-distribution/README.md#unheaded-block-46

Source identity digest: `eab2207c8d2acca894f6e1420d941fbf4cec17555954b22df970f7104d74d914`

Target identity digest: `eab2207c8d2acca894f6e1420d941fbf4cec17555954b22df970f7104d74d914`

Source shown SHA256: `eab2207c8d2acca894f6e1420d941fbf4cec17555954b22df970f7104d74d914`

Target shown SHA256: `eab2207c8d2acca894f6e1420d941fbf4cec17555954b22df970f7104d74d914`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_655aebe301e25232a80c6f34bba289b8 |
| sourceUnitDigest | eab2207c8d2acca894f6e1420d941fbf4cec17555954b22df970f7104d74d914 |
| targetOwner | docs/platform/packaging-distribution/README.md |
| targetAnchor | unheaded-block-46 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/README.md#unheaded-block-17, under "5. Historical Design Position", is retained at docs/platform/packaging-distribution/README.md#unheaded-block-46. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the packaging-distribution/README.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
Shared web/gateway remains a future constraint: the packaging model must not
make it impossible for one dashboard/gateway to serve many projects later, but
that implementation is outside the active delivery scope.
```

### Target unit

```text
Shared web/gateway remains a future constraint: the packaging model must not
make it impossible for one dashboard/gateway to serve many projects later, but
that implementation is outside the active delivery scope.
```

### Unified diff

```diff
No text difference.
```

## claim_7006be8edfb8423940048f9129644ab4

Source: docs/architect/packaging-distribution/README.md#6-do-not-collapse-these-boundaries

Target: docs/platform/packaging-distribution/README.md#6-do-not-collapse-these-boundaries

Source identity digest: `3cd26e8417711e7ca378591b5220bfad88dfb390cb6ecf29de4d87108cca529c`

Target identity digest: `0cee1c12bf1da6c391baf0730f7c18b4eb02fea1b9a9d202d8869f9718d8ece9`

Source shown SHA256: `cbd94dcc2e7fd49e81edf5b8b85074b51e247f744eb516197330f7c294af395b`

Target shown SHA256: `a17705144b8ec5517d54acc4ef2dc7598b9cb082c0376e39e80d8eefdb2c1eda`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_7006be8edfb8423940048f9129644ab4 |
| sourceUnitDigest | 3cd26e8417711e7ca378591b5220bfad88dfb390cb6ecf29de4d87108cca529c |
| targetOwner | docs/platform/packaging-distribution/README.md |
| targetAnchor | 6-do-not-collapse-these-boundaries |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete heading from docs/architect/packaging-distribution/README.md#6-do-not-collapse-these-boundaries, under "6. Do Not Collapse These Boundaries", is retained at docs/platform/packaging-distribution/README.md#6-do-not-collapse-these-boundaries. Only heading depth changes; the direct section payload follows the original source order. The named owner is the packaging-distribution/README.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
## 6. Do Not Collapse These Boundaries

| Boundary | Reason |
|---|---|
| `fgctl` vs local `fgos` | Machine bootstrap/service control is not project workflow authority. |
| release store root vs workspace installation root vs work-state root vs workspace root | Git worktrees share release content and explicitly bound work-state/coordination, but each workspace has its own branch-local policy, activation binding, projections, and dirty-tree surface. |
| tracked pin vs machine-local workspace activation | Team/project desired version must travel with the branch/repo; the ready activation binding is local to the workspace. |
| immutable release vs mutable project state | Release files are verified/quarantined; state/events/config/logs are runtime data. |
| stable shim vs active release entry | Callers need a stable path; active release may change atomically. |
| release manifest vs workspace activation binding vs projection ledger | Release identity, local ready binding, and host-visible generated files have different mutability and owners. |
| install/repair vs doctor fix | `fgctl` may change runtime identity; local `fgos doctor --fix` repairs only under the active identity. |
| distribution selection vs provider routing | Distribution selects the trusted runtime; Host Invocation routes inside that selected runtime. |
```

### Target unit

```text
#### 6. Do Not Collapse These Boundaries

| Boundary | Reason |
|---|---|
| `fgctl` vs local `fgos` | Machine bootstrap/service control is not project workflow authority. |
| release store root vs workspace installation root vs work-state root vs workspace root | Git worktrees share release content and explicitly bound work-state/coordination, but each workspace has its own branch-local policy, activation binding, projections, and dirty-tree surface. |
| tracked pin vs machine-local workspace activation | Team/project desired version must travel with the branch/repo; the ready activation binding is local to the workspace. |
| immutable release vs mutable project state | Release files are verified/quarantined; state/events/config/logs are runtime data. |
| stable shim vs active release entry | Callers need a stable path; active release may change atomically. |
| release manifest vs workspace activation binding vs projection ledger | Release identity, local ready binding, and host-visible generated files have different mutability and owners. |
| install/repair vs doctor fix | `fgctl` may change runtime identity; local `fgos doctor --fix` repairs only under the active identity. |
| distribution selection vs provider routing | Distribution selects the trusted runtime; Host Invocation routes inside that selected runtime. |
```

### Unified diff

```diff
--- "docs/architect/packaging-distribution/README.md#6-do-not-collapse-these-boundaries"
+++ "docs/platform/packaging-distribution/README.md#6-do-not-collapse-these-boundaries"
@@ -1,4 +1,4 @@
-## 6. Do Not Collapse These Boundaries
+#### 6. Do Not Collapse These Boundaries
 
 | Boundary | Reason |
 |---|---|
```

## claim_de7ed92c2420583f2268f423ab1d0878

Source: docs/architect/packaging-distribution/README.md#unheaded-block-18

Target: docs/platform/packaging-distribution/README.md#unheaded-block-47

Source identity digest: `3d80b91f5319e44deeec9df53bd55663c46a0ff28d433a5b495a3e3d29c071ee`

Target identity digest: `3d80b91f5319e44deeec9df53bd55663c46a0ff28d433a5b495a3e3d29c071ee`

Source shown SHA256: `3d80b91f5319e44deeec9df53bd55663c46a0ff28d433a5b495a3e3d29c071ee`

Target shown SHA256: `3d80b91f5319e44deeec9df53bd55663c46a0ff28d433a5b495a3e3d29c071ee`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_de7ed92c2420583f2268f423ab1d0878 |
| sourceUnitDigest | 3d80b91f5319e44deeec9df53bd55663c46a0ff28d433a5b495a3e3d29c071ee |
| targetOwner | docs/platform/packaging-distribution/README.md |
| targetAnchor | unheaded-block-47 |
| claimKind | contract |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/README.md#unheaded-block-18, under "6. Do Not Collapse These Boundaries", is retained at docs/platform/packaging-distribution/README.md#unheaded-block-47. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the packaging-distribution/README.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
| Boundary | Reason |
|---|---|
| `fgctl` vs local `fgos` | Machine bootstrap/service control is not project workflow authority. |
| release store root vs workspace installation root vs work-state root vs workspace root | Git worktrees share release content and explicitly bound work-state/coordination, but each workspace has its own branch-local policy, activation binding, projections, and dirty-tree surface. |
| tracked pin vs machine-local workspace activation | Team/project desired version must travel with the branch/repo; the ready activation binding is local to the workspace. |
| immutable release vs mutable project state | Release files are verified/quarantined; state/events/config/logs are runtime data. |
| stable shim vs active release entry | Callers need a stable path; active release may change atomically. |
| release manifest vs workspace activation binding vs projection ledger | Release identity, local ready binding, and host-visible generated files have different mutability and owners. |
| install/repair vs doctor fix | `fgctl` may change runtime identity; local `fgos doctor --fix` repairs only under the active identity. |
| distribution selection vs provider routing | Distribution selects the trusted runtime; Host Invocation routes inside that selected runtime. |
```

### Target unit

```text
| Boundary | Reason |
|---|---|
| `fgctl` vs local `fgos` | Machine bootstrap/service control is not project workflow authority. |
| release store root vs workspace installation root vs work-state root vs workspace root | Git worktrees share release content and explicitly bound work-state/coordination, but each workspace has its own branch-local policy, activation binding, projections, and dirty-tree surface. |
| tracked pin vs machine-local workspace activation | Team/project desired version must travel with the branch/repo; the ready activation binding is local to the workspace. |
| immutable release vs mutable project state | Release files are verified/quarantined; state/events/config/logs are runtime data. |
| stable shim vs active release entry | Callers need a stable path; active release may change atomically. |
| release manifest vs workspace activation binding vs projection ledger | Release identity, local ready binding, and host-visible generated files have different mutability and owners. |
| install/repair vs doctor fix | `fgctl` may change runtime identity; local `fgos doctor --fix` repairs only under the active identity. |
| distribution selection vs provider routing | Distribution selects the trusted runtime; Host Invocation routes inside that selected runtime. |
```

### Unified diff

```diff
No text difference.
```

## claim_7393eb2f3380f370829bfa756f1e2b82

Source: docs/architect/packaging-distribution/README.md#7-historical-delivery-spine

Target: docs/platform/packaging-distribution/README.md#7-historical-delivery-spine

Source identity digest: `1cc1e334bff36d96536140dd30e74e994ffd1ea1d03bcfab887cd789249678fd`

Target identity digest: `770f72b401b0fcdad24e2e8dbf5a8eff808b066013f32f54bcb87947451c9610`

Source shown SHA256: `cc73ea31cb8afd54e4d328973a1dd7b5c26608074d6ee99f9f6afee6ef27a147`

Target shown SHA256: `125bcda0b1e3cc5f38d41687a29aefb439edb1d31435103201a1aca34c00b8e3`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_7393eb2f3380f370829bfa756f1e2b82 |
| sourceUnitDigest | 1cc1e334bff36d96536140dd30e74e994ffd1ea1d03bcfab887cd789249678fd |
| targetOwner | docs/platform/packaging-distribution/README.md |
| targetAnchor | 7-historical-delivery-spine |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete heading from docs/architect/packaging-distribution/README.md#7-historical-delivery-spine, under "7. Historical Delivery Spine", is retained at docs/platform/packaging-distribution/README.md#7-historical-delivery-spine. Only heading depth changes; the direct section payload follows the original source order. The named owner is the packaging-distribution/README.md topic owner; carriage does not certify current implementation. |

### Source unit

````text
## 7. Historical Delivery Spine

The first walking skeleton target captured here was promoted into the platform
proof docs:

```txt
fgctl obtains a release payload
fgctl stages it under the shared release store
fgctl verifies ReleaseManifest
fgctl prepares workspace installation capsule
fgctl atomically publishes workspace activation.json as ready
fgctl ensures stable local shim exists
.fgos/installation/bin/fgos version --runtime-json reports workspace + work-state + runtime identity
```

This can use the existing Node `fgos` payload first. Rust `fgctl` can arrive
before Rust replaces the local `fgos` host. That ships project-local version
safety earlier and lets the Rust host swap into the same release tree later.
````

### Target unit

````text
#### 7. Historical Delivery Spine

The first walking skeleton target captured here was promoted into the platform
proof docs:

```txt
fgctl obtains a release payload
fgctl stages it under the shared release store
fgctl verifies ReleaseManifest
fgctl prepares workspace installation capsule
fgctl atomically publishes workspace activation.json as ready
fgctl ensures stable local shim exists
.fgos/installation/bin/fgos version --runtime-json reports workspace + work-state + runtime identity
```

This can use the existing Node `fgos` payload first. Rust `fgctl` can arrive
before Rust replaces the local `fgos` host. That ships project-local version
safety earlier and lets the Rust host swap into the same release tree later.
````

### Unified diff

```diff
--- "docs/architect/packaging-distribution/README.md#7-historical-delivery-spine"
+++ "docs/platform/packaging-distribution/README.md#7-historical-delivery-spine"
@@ -1,4 +1,4 @@
-## 7. Historical Delivery Spine
+#### 7. Historical Delivery Spine
 
 The first walking skeleton target captured here was promoted into the platform
 proof docs:
```

## claim_6c527e7d02ccf2752d2cb49f81f326ba

Source: docs/architect/packaging-distribution/README.md#unheaded-block-19

Target: docs/platform/packaging-distribution/README.md#unheaded-block-48

Source identity digest: `6d78f99255ead02c7b7f6fc7a06ba68a1c144b9166621ffbba27daad9504dce6`

Target identity digest: `6d78f99255ead02c7b7f6fc7a06ba68a1c144b9166621ffbba27daad9504dce6`

Source shown SHA256: `6d78f99255ead02c7b7f6fc7a06ba68a1c144b9166621ffbba27daad9504dce6`

Target shown SHA256: `6d78f99255ead02c7b7f6fc7a06ba68a1c144b9166621ffbba27daad9504dce6`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_6c527e7d02ccf2752d2cb49f81f326ba |
| sourceUnitDigest | 6d78f99255ead02c7b7f6fc7a06ba68a1c144b9166621ffbba27daad9504dce6 |
| targetOwner | docs/platform/packaging-distribution/README.md |
| targetAnchor | unheaded-block-48 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/README.md#unheaded-block-19, under "7. Historical Delivery Spine", is retained at docs/platform/packaging-distribution/README.md#unheaded-block-48. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the packaging-distribution/README.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
The first walking skeleton target captured here was promoted into the platform
proof docs:
```

### Target unit

```text
The first walking skeleton target captured here was promoted into the platform
proof docs:
```

### Unified diff

```diff
No text difference.
```

## claim_55c38fbd29f3d4b8ba98ee27cb69bbf9

Source: docs/architect/packaging-distribution/README.md#unheaded-block-20

Target: docs/platform/packaging-distribution/README.md#unheaded-block-49

Source identity digest: `60a989cfc1f896aeb97ee8729a1efe5f5a50010e9904232b80d4db9c20ca2e1d`

Target identity digest: `60a989cfc1f896aeb97ee8729a1efe5f5a50010e9904232b80d4db9c20ca2e1d`

Source shown SHA256: `60a989cfc1f896aeb97ee8729a1efe5f5a50010e9904232b80d4db9c20ca2e1d`

Target shown SHA256: `60a989cfc1f896aeb97ee8729a1efe5f5a50010e9904232b80d4db9c20ca2e1d`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_55c38fbd29f3d4b8ba98ee27cb69bbf9 |
| sourceUnitDigest | 60a989cfc1f896aeb97ee8729a1efe5f5a50010e9904232b80d4db9c20ca2e1d |
| targetOwner | docs/platform/packaging-distribution/README.md |
| targetAnchor | unheaded-block-49 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/README.md#unheaded-block-20, under "7. Historical Delivery Spine", is retained at docs/platform/packaging-distribution/README.md#unheaded-block-49. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the packaging-distribution/README.md topic owner; carriage does not certify current implementation. |

### Source unit

````text
```txt
fgctl obtains a release payload
fgctl stages it under the shared release store
fgctl verifies ReleaseManifest
fgctl prepares workspace installation capsule
fgctl atomically publishes workspace activation.json as ready
fgctl ensures stable local shim exists
.fgos/installation/bin/fgos version --runtime-json reports workspace + work-state + runtime identity
```
````

### Target unit

````text
```txt
fgctl obtains a release payload
fgctl stages it under the shared release store
fgctl verifies ReleaseManifest
fgctl prepares workspace installation capsule
fgctl atomically publishes workspace activation.json as ready
fgctl ensures stable local shim exists
.fgos/installation/bin/fgos version --runtime-json reports workspace + work-state + runtime identity
```
````

### Unified diff

```diff
No text difference.
```

## claim_78250c7517d445de50ab460d48234055

Source: docs/architect/packaging-distribution/README.md#unheaded-block-21

Target: docs/platform/packaging-distribution/README.md#unheaded-block-50

Source identity digest: `0df0f6bb7f9d399c104e81d403ee072cf6c1283a4fa2f62cd6963b441bd29397`

Target identity digest: `0df0f6bb7f9d399c104e81d403ee072cf6c1283a4fa2f62cd6963b441bd29397`

Source shown SHA256: `0df0f6bb7f9d399c104e81d403ee072cf6c1283a4fa2f62cd6963b441bd29397`

Target shown SHA256: `0df0f6bb7f9d399c104e81d403ee072cf6c1283a4fa2f62cd6963b441bd29397`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_78250c7517d445de50ab460d48234055 |
| sourceUnitDigest | 0df0f6bb7f9d399c104e81d403ee072cf6c1283a4fa2f62cd6963b441bd29397 |
| targetOwner | docs/platform/packaging-distribution/README.md |
| targetAnchor | unheaded-block-50 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/README.md#unheaded-block-21, under "7. Historical Delivery Spine", is retained at docs/platform/packaging-distribution/README.md#unheaded-block-50. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the packaging-distribution/README.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
This can use the existing Node `fgos` payload first. Rust `fgctl` can arrive
before Rust replaces the local `fgos` host. That ships project-local version
safety earlier and lets the Rust host swap into the same release tree later.
```

### Target unit

```text
This can use the existing Node `fgos` payload first. Rust `fgctl` can arrive
before Rust replaces the local `fgos` host. That ships project-local version
safety earlier and lets the Rust host swap into the same release tree later.
```

### Unified diff

```diff
No text difference.
```

## claim_8f5afad9e717a19652425afa6e16fc9d

Source: docs/architect/packaging-distribution/rewrite-plan.md#unheaded-block-1

Target: docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#unheaded-block-3

Source identity digest: `54ff201e73bc48cab0d63ea787d563dc6da98d6928d82756314a74e712a3f8e3`

Target identity digest: `54ff201e73bc48cab0d63ea787d563dc6da98d6928d82756314a74e712a3f8e3`

Source shown SHA256: `54ff201e73bc48cab0d63ea787d563dc6da98d6928d82756314a74e712a3f8e3`

Target shown SHA256: `54ff201e73bc48cab0d63ea787d563dc6da98d6928d82756314a74e712a3f8e3`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_8f5afad9e717a19652425afa6e16fc9d |
| sourceUnitDigest | 54ff201e73bc48cab0d63ea787d563dc6da98d6928d82756314a74e712a3f8e3 |
| targetOwner | docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md |
| targetAnchor | unheaded-block-3 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-preamble from docs/architect/packaging-distribution/rewrite-plan.md#unheaded-block-1, under "source preamble", is retained at docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#unheaded-block-3. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. This remains dated source context, with no current runtime truth claim. |

### Source unit

````text
```txt
Title: Packaging Distribution Documentation Rewrite Plan
Audience: human maintainer, architecture collaborator, documentation agent
Purpose: Plan the rewrite of packaging/distribution documentation before moving canonical docs
Design status: Draft
Canonical: No
Source type: Human-agent planning note
Last reviewed: 2026-09-13
```
````

### Target unit

````text
```txt
Title: Packaging Distribution Documentation Rewrite Plan
Audience: human maintainer, architecture collaborator, documentation agent
Purpose: Plan the rewrite of packaging/distribution documentation before moving canonical docs
Design status: Draft
Canonical: No
Source type: Human-agent planning note
Last reviewed: 2026-09-13
```
````

### Unified diff

```diff
No text difference.
```

## claim_1f134034b57f352e603ef002af320b71

Source: docs/architect/packaging-distribution/rewrite-plan.md#1-goal

Target: docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#1-goal

Source identity digest: `63ee56628abecac4f1f7bfad92b9f7720a65f3d41406ece88b9f1d517aeacb45`

Target identity digest: `ce6c76eea64e8b9672f669b182f5bd571ea2509373bbfdfc9ec5b24944d3c65f`

Source shown SHA256: `f0f3ad0b5b7016d55704cfbe563b4233635cea2619175019a51e3a97ed6fc7fd`

Target shown SHA256: `bb65b9f0ea95197ce534f74051c3b4d5d7711e048de32170359db5693052983b`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_1f134034b57f352e603ef002af320b71 |
| sourceUnitDigest | 63ee56628abecac4f1f7bfad92b9f7720a65f3d41406ece88b9f1d517aeacb45 |
| targetOwner | docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md |
| targetAnchor | 1-goal |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete heading from docs/architect/packaging-distribution/rewrite-plan.md#1-goal, under "1. Goal", is retained at docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#1-goal. Only heading depth changes; the direct section payload follows the original source order. This remains dated source context, with no current runtime truth claim. |

### Source unit

```text
# 1. Goal

Rewrite the packaging/distribution documentation so a human can quickly answer:

- what is shipped today;
- what design is accepted but not fully implemented yet;
- which runtime/install authority owns each action;
- which code/tests prove each claim;
- which old generated/hand-curated docs are still source material only.

This plan does not move or rewrite canonical content yet. It defines the scan result, target shape, open decisions, and migration sequence.
```

### Target unit

```text
### 1. Goal

Rewrite the packaging/distribution documentation so a human can quickly answer:

- what is shipped today;
- what design is accepted but not fully implemented yet;
- which runtime/install authority owns each action;
- which code/tests prove each claim;
- which old generated/hand-curated docs are still source material only.

This plan does not move or rewrite canonical content yet. It defines the scan result, target shape, open decisions, and migration sequence.
```

### Unified diff

```diff
--- "docs/architect/packaging-distribution/rewrite-plan.md#1-goal"
+++ "docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#1-goal"
@@ -1,4 +1,4 @@
-# 1. Goal
+### 1. Goal
 
 Rewrite the packaging/distribution documentation so a human can quickly answer:
```

## claim_13d82a154f9fe90af9f5624c92634ca1

Source: docs/architect/packaging-distribution/rewrite-plan.md#unheaded-block-2

Target: docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#unheaded-block-4

Source identity digest: `d71fc837b60bb3142d456f7cd0e4d06a939736a7f57918f3938f79658dc42ab9`

Target identity digest: `d71fc837b60bb3142d456f7cd0e4d06a939736a7f57918f3938f79658dc42ab9`

Source shown SHA256: `d71fc837b60bb3142d456f7cd0e4d06a939736a7f57918f3938f79658dc42ab9`

Target shown SHA256: `d71fc837b60bb3142d456f7cd0e4d06a939736a7f57918f3938f79658dc42ab9`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_13d82a154f9fe90af9f5624c92634ca1 |
| sourceUnitDigest | d71fc837b60bb3142d456f7cd0e4d06a939736a7f57918f3938f79658dc42ab9 |
| targetOwner | docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md |
| targetAnchor | unheaded-block-4 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/rewrite-plan.md#unheaded-block-2, under "1. Goal", is retained at docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#unheaded-block-4. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. This remains dated source context, with no current runtime truth claim. |

### Source unit

```text
Rewrite the packaging/distribution documentation so a human can quickly answer:
```

### Target unit

```text
Rewrite the packaging/distribution documentation so a human can quickly answer:
```

### Unified diff

```diff
No text difference.
```

## claim_483dbe615cc89f83790c18d274dc92f5

Source: docs/architect/packaging-distribution/rewrite-plan.md#unheaded-block-3

Target: docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#unheaded-block-5

Source identity digest: `7ebeefdd5269078b32d04318ee383db6e94dfccbc3c1b1c7ed2b1710e79a52b1`

Target identity digest: `7ebeefdd5269078b32d04318ee383db6e94dfccbc3c1b1c7ed2b1710e79a52b1`

Source shown SHA256: `7ebeefdd5269078b32d04318ee383db6e94dfccbc3c1b1c7ed2b1710e79a52b1`

Target shown SHA256: `7ebeefdd5269078b32d04318ee383db6e94dfccbc3c1b1c7ed2b1710e79a52b1`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_483dbe615cc89f83790c18d274dc92f5 |
| sourceUnitDigest | 7ebeefdd5269078b32d04318ee383db6e94dfccbc3c1b1c7ed2b1710e79a52b1 |
| targetOwner | docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md |
| targetAnchor | unheaded-block-5 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/rewrite-plan.md#unheaded-block-3, under "1. Goal", is retained at docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#unheaded-block-5. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. This remains dated source context, with no current runtime truth claim. |

### Source unit

```text
- what is shipped today;
- what design is accepted but not fully implemented yet;
- which runtime/install authority owns each action;
- which code/tests prove each claim;
- which old generated/hand-curated docs are still source material only.
```

### Target unit

```text
- what is shipped today;
- what design is accepted but not fully implemented yet;
- which runtime/install authority owns each action;
- which code/tests prove each claim;
- which old generated/hand-curated docs are still source material only.
```

### Unified diff

```diff
No text difference.
```

## claim_d8d5954d604bc36692cf5fc8adc789ca

Source: docs/architect/packaging-distribution/rewrite-plan.md#unheaded-block-4

Target: docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#unheaded-block-6

Source identity digest: `349b4028ee3c0f3918fe941b012360acd8c8df2d733a52aba35005d076397a35`

Target identity digest: `349b4028ee3c0f3918fe941b012360acd8c8df2d733a52aba35005d076397a35`

Source shown SHA256: `349b4028ee3c0f3918fe941b012360acd8c8df2d733a52aba35005d076397a35`

Target shown SHA256: `349b4028ee3c0f3918fe941b012360acd8c8df2d733a52aba35005d076397a35`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_d8d5954d604bc36692cf5fc8adc789ca |
| sourceUnitDigest | 349b4028ee3c0f3918fe941b012360acd8c8df2d733a52aba35005d076397a35 |
| targetOwner | docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md |
| targetAnchor | unheaded-block-6 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/rewrite-plan.md#unheaded-block-4, under "1. Goal", is retained at docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#unheaded-block-6. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. This remains dated source context, with no current runtime truth claim. |

### Source unit

```text
This plan does not move or rewrite canonical content yet. It defines the scan result, target shape, open decisions, and migration sequence.
```

### Target unit

```text
This plan does not move or rewrite canonical content yet. It defines the scan result, target shape, open decisions, and migration sequence.
```

### Unified diff

```diff
No text difference.
```

## claim_b0f561cd80e4caa5e6cc8e7b7f89dada

Source: docs/architect/packaging-distribution/rewrite-plan.md#2-scan-result

Target: docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#2-scan-result

Source identity digest: `e496dd43a1ab1a982adb1bc34407361ea9a3b1c172efe623ad8c806cea6cdedd`

Target identity digest: `c59729906b2a3f52a3f9e2d264acf14af6cb72d237304cde98689afa67462070`

Source shown SHA256: `eb0a4927c8ba502e38aaf82dd59615455841ed86a6ae77b6df98d3e7630d6f8a`

Target shown SHA256: `f10fe1014485c7219e5672548a276da969bd9ae213ff75c75f26016d26560839`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_b0f561cd80e4caa5e6cc8e7b7f89dada |
| sourceUnitDigest | e496dd43a1ab1a982adb1bc34407361ea9a3b1c172efe623ad8c806cea6cdedd |
| targetOwner | docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md |
| targetAnchor | 2-scan-result |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete heading from docs/architect/packaging-distribution/rewrite-plan.md#2-scan-result, under "2. Scan Result", is retained at docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#2-scan-result. Only heading depth changes; the direct section payload follows the original source order. This remains dated source context, with no current runtime truth claim. |

### Source unit

```text
# 2. Scan Result
```

### Target unit

```text
### 2. Scan Result
```

### Unified diff

```diff
--- "docs/architect/packaging-distribution/rewrite-plan.md#2-scan-result"
+++ "docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#2-scan-result"
@@ -1 +1 @@
-# 2. Scan Result
\ No newline at end of file
+### 2. Scan Result
\ No newline at end of file
```

## claim_622289cbc75e51c53041b6289d29e192

Source: docs/architect/packaging-distribution/rewrite-plan.md#21-primary-source-documents

Target: docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#21-primary-source-documents

Source identity digest: `c31e44aa1de210d48e14dc0f818210ed61697f62c28b8c5f77f08485c8e1c010`

Target identity digest: `48f59a512ef2d7f4db8f5f958684845c4f1f29b750e32f8f4f4b660fbbff3af7`

Source shown SHA256: `7b59fad76dcfd6c197fd83a64e2928f2af7c1381ef0bfcec270e43d416112a81`

Target shown SHA256: `21ee3c45655478ebf60ab6338d09bc87479eaf707c51f5fb62f6b9218326e54d`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_622289cbc75e51c53041b6289d29e192 |
| sourceUnitDigest | c31e44aa1de210d48e14dc0f818210ed61697f62c28b8c5f77f08485c8e1c010 |
| targetOwner | docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md |
| targetAnchor | 21-primary-source-documents |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete heading from docs/architect/packaging-distribution/rewrite-plan.md#21-primary-source-documents, under "2.1 Primary Source Documents", is retained at docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#21-primary-source-documents. Only heading depth changes; the direct section payload follows the original source order. This remains dated source context, with no current runtime truth claim. |

### Source unit

```text
## 2.1 Primary Source Documents

| Source | Current role | Rewrite treatment |
| --- | --- | --- |
| `docs/specs/distribution.md` | Current BA/state spec for the old Node/npm/setup/doctor distribution layer, with many implemented facts and test links. | Preserve as current-state source; split into current shipped behavior, contracts, and historical context during rewrite. |
| `docs/distribution-vision.md` | Vision and rationale for install/setup/doctor becoming stable, reusable, self-fixing, global/project aware, and CI-backed. | Preserve as rationale; reconcile outdated statements against newer implementation and architecture docs. |
| `docs/architect/packaging-distribution/README.md` | Current architecture package portal for the new fgctl/project-local runtime direction. | Promote into the new packaging-distribution area portal or use it as the seed for that portal. |
| `docs/architect/packaging-distribution/runtime-identity-and-activation.md` | Main architecture contract draft for release identity, activation, pins, shims, manifest, repair, rollback. | Promote as architecture/contract source after implementation alignment scan. |
| `docs/architect/packaging-distribution/workspace-runtime-model.md` | Pointer to the renamed topology doc. | Retire or keep only as redirect after migration. |
| `docs/architect/workspace-topology.md` | Cross-area topology contract consumed by distribution. | Keep outside distribution; link from distribution docs as a platform contract dependency. |
| `docs/architect/packaging-distribution/future-constraints.md` | Future gateway/shared-web constraints. | Keep as future constraints; do not present as current implementation. |
| `docs/architect/packaging-distribution/history/distribution-baseline.md` | Curated history of old npm/global/setup facts and scattered references. | Move/promote into history after current facts have been extracted. |
| `docs/specs/reading-map.md` | Legacy doc/source map that points to distribution docs and source files. | Update only after target docs exist. |
| `README.md` | User-facing install instructions now prefer `fgctl`; npm is compatibility. | Must be reconciled with distribution spec and current code scan. |
```

### Target unit

```text
#### 2.1 Primary Source Documents

| Source | Current role | Rewrite treatment |
| --- | --- | --- |
| `docs/specs/distribution.md` | Current BA/state spec for the old Node/npm/setup/doctor distribution layer, with many implemented facts and test links. | Preserve as current-state source; split into current shipped behavior, contracts, and historical context during rewrite. |
| `docs/distribution-vision.md` | Vision and rationale for install/setup/doctor becoming stable, reusable, self-fixing, global/project aware, and CI-backed. | Preserve as rationale; reconcile outdated statements against newer implementation and architecture docs. |
| `docs/architect/packaging-distribution/README.md` | Current architecture package portal for the new fgctl/project-local runtime direction. | Promote into the new packaging-distribution area portal or use it as the seed for that portal. |
| `docs/architect/packaging-distribution/runtime-identity-and-activation.md` | Main architecture contract draft for release identity, activation, pins, shims, manifest, repair, rollback. | Promote as architecture/contract source after implementation alignment scan. |
| `docs/architect/packaging-distribution/workspace-runtime-model.md` | Pointer to the renamed topology doc. | Retire or keep only as redirect after migration. |
| `docs/architect/workspace-topology.md` | Cross-area topology contract consumed by distribution. | Keep outside distribution; link from distribution docs as a platform contract dependency. |
| `docs/architect/packaging-distribution/future-constraints.md` | Future gateway/shared-web constraints. | Keep as future constraints; do not present as current implementation. |
| `docs/architect/packaging-distribution/history/distribution-baseline.md` | Curated history of old npm/global/setup facts and scattered references. | Move/promote into history after current facts have been extracted. |
| `docs/specs/reading-map.md` | Legacy doc/source map that points to distribution docs and source files. | Update only after target docs exist. |
| `README.md` | User-facing install instructions now prefer `fgctl`; npm is compatibility. | Must be reconciled with distribution spec and current code scan. |
```

### Unified diff

```diff
--- "docs/architect/packaging-distribution/rewrite-plan.md#21-primary-source-documents"
+++ "docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#21-primary-source-documents"
@@ -1,4 +1,4 @@
-## 2.1 Primary Source Documents
+#### 2.1 Primary Source Documents
 
 | Source | Current role | Rewrite treatment |
 | --- | --- | --- |
```

## claim_46af52bc2582bbc9495d29b7c9b655f8

Source: docs/architect/packaging-distribution/rewrite-plan.md#unheaded-block-5

Target: docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#unheaded-block-7

Source identity digest: `d16e4a105df90204fcb14afbda59adc92b170987f6902a3309ebe938e2ee6f0a`

Target identity digest: `d16e4a105df90204fcb14afbda59adc92b170987f6902a3309ebe938e2ee6f0a`

Source shown SHA256: `d16e4a105df90204fcb14afbda59adc92b170987f6902a3309ebe938e2ee6f0a`

Target shown SHA256: `d16e4a105df90204fcb14afbda59adc92b170987f6902a3309ebe938e2ee6f0a`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_46af52bc2582bbc9495d29b7c9b655f8 |
| sourceUnitDigest | d16e4a105df90204fcb14afbda59adc92b170987f6902a3309ebe938e2ee6f0a |
| targetOwner | docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md |
| targetAnchor | unheaded-block-7 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/rewrite-plan.md#unheaded-block-5, under "2.1 Primary Source Documents", is retained at docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#unheaded-block-7. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. This remains dated source context, with no current runtime truth claim. |

### Source unit

```text
| Source | Current role | Rewrite treatment |
| --- | --- | --- |
| `docs/specs/distribution.md` | Current BA/state spec for the old Node/npm/setup/doctor distribution layer, with many implemented facts and test links. | Preserve as current-state source; split into current shipped behavior, contracts, and historical context during rewrite. |
| `docs/distribution-vision.md` | Vision and rationale for install/setup/doctor becoming stable, reusable, self-fixing, global/project aware, and CI-backed. | Preserve as rationale; reconcile outdated statements against newer implementation and architecture docs. |
| `docs/architect/packaging-distribution/README.md` | Current architecture package portal for the new fgctl/project-local runtime direction. | Promote into the new packaging-distribution area portal or use it as the seed for that portal. |
| `docs/architect/packaging-distribution/runtime-identity-and-activation.md` | Main architecture contract draft for release identity, activation, pins, shims, manifest, repair, rollback. | Promote as architecture/contract source after implementation alignment scan. |
| `docs/architect/packaging-distribution/workspace-runtime-model.md` | Pointer to the renamed topology doc. | Retire or keep only as redirect after migration. |
| `docs/architect/workspace-topology.md` | Cross-area topology contract consumed by distribution. | Keep outside distribution; link from distribution docs as a platform contract dependency. |
| `docs/architect/packaging-distribution/future-constraints.md` | Future gateway/shared-web constraints. | Keep as future constraints; do not present as current implementation. |
| `docs/architect/packaging-distribution/history/distribution-baseline.md` | Curated history of old npm/global/setup facts and scattered references. | Move/promote into history after current facts have been extracted. |
| `docs/specs/reading-map.md` | Legacy doc/source map that points to distribution docs and source files. | Update only after target docs exist. |
| `README.md` | User-facing install instructions now prefer `fgctl`; npm is compatibility. | Must be reconciled with distribution spec and current code scan. |
```

### Target unit

```text
| Source | Current role | Rewrite treatment |
| --- | --- | --- |
| `docs/specs/distribution.md` | Current BA/state spec for the old Node/npm/setup/doctor distribution layer, with many implemented facts and test links. | Preserve as current-state source; split into current shipped behavior, contracts, and historical context during rewrite. |
| `docs/distribution-vision.md` | Vision and rationale for install/setup/doctor becoming stable, reusable, self-fixing, global/project aware, and CI-backed. | Preserve as rationale; reconcile outdated statements against newer implementation and architecture docs. |
| `docs/architect/packaging-distribution/README.md` | Current architecture package portal for the new fgctl/project-local runtime direction. | Promote into the new packaging-distribution area portal or use it as the seed for that portal. |
| `docs/architect/packaging-distribution/runtime-identity-and-activation.md` | Main architecture contract draft for release identity, activation, pins, shims, manifest, repair, rollback. | Promote as architecture/contract source after implementation alignment scan. |
| `docs/architect/packaging-distribution/workspace-runtime-model.md` | Pointer to the renamed topology doc. | Retire or keep only as redirect after migration. |
| `docs/architect/workspace-topology.md` | Cross-area topology contract consumed by distribution. | Keep outside distribution; link from distribution docs as a platform contract dependency. |
| `docs/architect/packaging-distribution/future-constraints.md` | Future gateway/shared-web constraints. | Keep as future constraints; do not present as current implementation. |
| `docs/architect/packaging-distribution/history/distribution-baseline.md` | Curated history of old npm/global/setup facts and scattered references. | Move/promote into history after current facts have been extracted. |
| `docs/specs/reading-map.md` | Legacy doc/source map that points to distribution docs and source files. | Update only after target docs exist. |
| `README.md` | User-facing install instructions now prefer `fgctl`; npm is compatibility. | Must be reconciled with distribution spec and current code scan. |
```

### Unified diff

```diff
No text difference.
```

## claim_e930d787920c42d8d279926bc4492f42

Source: docs/architect/packaging-distribution/rewrite-plan.md#22-related-implementation-surface-found-in-code-scan

Target: docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#22-related-implementation-surface-found-in-code-scan

Source identity digest: `3fe26df2c3d779723efb90f6ca4e7190df039aa14169dc58807427c6bcac144e`

Target identity digest: `8060d6447b472549d65eb0e7a6be63ac239884bf103e79d6c2335c3c2254a6bd`

Source shown SHA256: `7b49cae3f71cf99bcba847e196bb80bc6abd78babe345e5b074af1d17d56b52d`

Target shown SHA256: `08198cf59dc2b9ff938fb0c3942c2e92f2f465d6c93d9a377ddbee494b532449`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_e930d787920c42d8d279926bc4492f42 |
| sourceUnitDigest | 3fe26df2c3d779723efb90f6ca4e7190df039aa14169dc58807427c6bcac144e |
| targetOwner | docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md |
| targetAnchor | 22-related-implementation-surface-found-in-code-scan |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete heading from docs/architect/packaging-distribution/rewrite-plan.md#22-related-implementation-surface-found-in-code-scan, under "2.2 Related Implementation Surface Found In Code Scan", is retained at docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#22-related-implementation-surface-found-in-code-scan. Only heading depth changes; the direct section payload follows the original source order. This remains dated source context, with no current runtime truth claim. |

### Source unit

```text
## 2.2 Related Implementation Surface Found In Code Scan

| Surface | Evidence paths | Notes |
| --- | --- | --- |
| Native/Rust distribution and `fgctl` path | `scripts/build-rust-distribution.mjs`, `scripts/ci-external-consumer.sh`, `test/rust-host/fgctl-stage.test.mjs`, `test/rust-host/fgctl-init.test.mjs`, `test/rust-host/fgctl-upgrade.test.mjs`, `test/rust-host/release-tree.test.mjs` | This proves the new direction is not only prose; rewrite needs an implementation-alignment table for each claim. |
| Legacy Node payload | `bin/fgos.mjs`, `scripts/build-rust-distribution.mjs`, `test/rust-host/*`, `package.json` | Must be documented as compatibility payload/bridge, not as the only distribution model. |
| Project-local runtime/shim resolution | `scripts/fgos-shell-integration.sh`, `test/scripts/fgos-shell-integration.test.mjs`, `scripts/ci-external-consumer.sh` | Shell helper already recognizes `.fgos/installation/bin/fgos` before dev/project/global tiers. |
| Setup/doctor registry | `src/setup/checks.mjs`, `src/setup/registrations.mjs`, `src/setup/config-merge.mjs`, `bin/fgos.mjs`, `test/setup/*.test.mjs` | This is both distribution-adjacent and operational. Need decide whether it stays under distribution or becomes a separate area later. |
| Install packaging proof | `test/install-packaging.test.mjs`, `test/install/install-sh.test.mjs`, `test/install/coexist.test.mjs` | Rewrite should link these as verification, not bury them in prose. |
| User install docs | `README.md`, `docs/how-to/cut-a-fgos-release-tag.md` | README already describes `fgctl` as recommended and npm as compatibility. |
| Plugin/dev-skill packaging | `plugins/fgOS/skills/`, `test/skills/fgos-mirror.test.mjs`, `src/setup/skill-wrappers.mjs` | Distribution touches this, but it may deserve a sub-contract rather than bloating the main spec. |
```

### Target unit

```text
#### 2.2 Related Implementation Surface Found In Code Scan

| Surface | Evidence paths | Notes |
| --- | --- | --- |
| Native/Rust distribution and `fgctl` path | `scripts/build-rust-distribution.mjs`, `scripts/ci-external-consumer.sh`, `test/rust-host/fgctl-stage.test.mjs`, `test/rust-host/fgctl-init.test.mjs`, `test/rust-host/fgctl-upgrade.test.mjs`, `test/rust-host/release-tree.test.mjs` | This proves the new direction is not only prose; rewrite needs an implementation-alignment table for each claim. |
| Legacy Node payload | `bin/fgos.mjs`, `scripts/build-rust-distribution.mjs`, `test/rust-host/*`, `package.json` | Must be documented as compatibility payload/bridge, not as the only distribution model. |
| Project-local runtime/shim resolution | `scripts/fgos-shell-integration.sh`, `test/scripts/fgos-shell-integration.test.mjs`, `scripts/ci-external-consumer.sh` | Shell helper already recognizes `.fgos/installation/bin/fgos` before dev/project/global tiers. |
| Setup/doctor registry | `src/setup/checks.mjs`, `src/setup/registrations.mjs`, `src/setup/config-merge.mjs`, `bin/fgos.mjs`, `test/setup/*.test.mjs` | This is both distribution-adjacent and operational. Need decide whether it stays under distribution or becomes a separate area later. |
| Install packaging proof | `test/install-packaging.test.mjs`, `test/install/install-sh.test.mjs`, `test/install/coexist.test.mjs` | Rewrite should link these as verification, not bury them in prose. |
| User install docs | `README.md`, `docs/how-to/cut-a-fgos-release-tag.md` | README already describes `fgctl` as recommended and npm as compatibility. |
| Plugin/dev-skill packaging | `plugins/fgOS/skills/`, `test/skills/fgos-mirror.test.mjs`, `src/setup/skill-wrappers.mjs` | Distribution touches this, but it may deserve a sub-contract rather than bloating the main spec. |
```

### Unified diff

```diff
--- "docs/architect/packaging-distribution/rewrite-plan.md#22-related-implementation-surface-found-in-code-scan"
+++ "docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#22-related-implementation-surface-found-in-code-scan"
@@ -1,4 +1,4 @@
-## 2.2 Related Implementation Surface Found In Code Scan
+#### 2.2 Related Implementation Surface Found In Code Scan
 
 | Surface | Evidence paths | Notes |
 | --- | --- | --- |
```

## claim_af1b6feffda6b7400be80a9355618310

Source: docs/architect/packaging-distribution/rewrite-plan.md#unheaded-block-6

Target: docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#unheaded-block-8

Source identity digest: `29e6c4b0086af528b1503042a4375867f85a77254647745e012c7661cbb33a97`

Target identity digest: `29e6c4b0086af528b1503042a4375867f85a77254647745e012c7661cbb33a97`

Source shown SHA256: `29e6c4b0086af528b1503042a4375867f85a77254647745e012c7661cbb33a97`

Target shown SHA256: `29e6c4b0086af528b1503042a4375867f85a77254647745e012c7661cbb33a97`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_af1b6feffda6b7400be80a9355618310 |
| sourceUnitDigest | 29e6c4b0086af528b1503042a4375867f85a77254647745e012c7661cbb33a97 |
| targetOwner | docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md |
| targetAnchor | unheaded-block-8 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/rewrite-plan.md#unheaded-block-6, under "2.2 Related Implementation Surface Found In Code Scan", is retained at docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#unheaded-block-8. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. This remains dated source context, with no current runtime truth claim. |

### Source unit

```text
| Surface | Evidence paths | Notes |
| --- | --- | --- |
| Native/Rust distribution and `fgctl` path | `scripts/build-rust-distribution.mjs`, `scripts/ci-external-consumer.sh`, `test/rust-host/fgctl-stage.test.mjs`, `test/rust-host/fgctl-init.test.mjs`, `test/rust-host/fgctl-upgrade.test.mjs`, `test/rust-host/release-tree.test.mjs` | This proves the new direction is not only prose; rewrite needs an implementation-alignment table for each claim. |
| Legacy Node payload | `bin/fgos.mjs`, `scripts/build-rust-distribution.mjs`, `test/rust-host/*`, `package.json` | Must be documented as compatibility payload/bridge, not as the only distribution model. |
| Project-local runtime/shim resolution | `scripts/fgos-shell-integration.sh`, `test/scripts/fgos-shell-integration.test.mjs`, `scripts/ci-external-consumer.sh` | Shell helper already recognizes `.fgos/installation/bin/fgos` before dev/project/global tiers. |
| Setup/doctor registry | `src/setup/checks.mjs`, `src/setup/registrations.mjs`, `src/setup/config-merge.mjs`, `bin/fgos.mjs`, `test/setup/*.test.mjs` | This is both distribution-adjacent and operational. Need decide whether it stays under distribution or becomes a separate area later. |
| Install packaging proof | `test/install-packaging.test.mjs`, `test/install/install-sh.test.mjs`, `test/install/coexist.test.mjs` | Rewrite should link these as verification, not bury them in prose. |
| User install docs | `README.md`, `docs/how-to/cut-a-fgos-release-tag.md` | README already describes `fgctl` as recommended and npm as compatibility. |
| Plugin/dev-skill packaging | `plugins/fgOS/skills/`, `test/skills/fgos-mirror.test.mjs`, `src/setup/skill-wrappers.mjs` | Distribution touches this, but it may deserve a sub-contract rather than bloating the main spec. |
```

### Target unit

```text
| Surface | Evidence paths | Notes |
| --- | --- | --- |
| Native/Rust distribution and `fgctl` path | `scripts/build-rust-distribution.mjs`, `scripts/ci-external-consumer.sh`, `test/rust-host/fgctl-stage.test.mjs`, `test/rust-host/fgctl-init.test.mjs`, `test/rust-host/fgctl-upgrade.test.mjs`, `test/rust-host/release-tree.test.mjs` | This proves the new direction is not only prose; rewrite needs an implementation-alignment table for each claim. |
| Legacy Node payload | `bin/fgos.mjs`, `scripts/build-rust-distribution.mjs`, `test/rust-host/*`, `package.json` | Must be documented as compatibility payload/bridge, not as the only distribution model. |
| Project-local runtime/shim resolution | `scripts/fgos-shell-integration.sh`, `test/scripts/fgos-shell-integration.test.mjs`, `scripts/ci-external-consumer.sh` | Shell helper already recognizes `.fgos/installation/bin/fgos` before dev/project/global tiers. |
| Setup/doctor registry | `src/setup/checks.mjs`, `src/setup/registrations.mjs`, `src/setup/config-merge.mjs`, `bin/fgos.mjs`, `test/setup/*.test.mjs` | This is both distribution-adjacent and operational. Need decide whether it stays under distribution or becomes a separate area later. |
| Install packaging proof | `test/install-packaging.test.mjs`, `test/install/install-sh.test.mjs`, `test/install/coexist.test.mjs` | Rewrite should link these as verification, not bury them in prose. |
| User install docs | `README.md`, `docs/how-to/cut-a-fgos-release-tag.md` | README already describes `fgctl` as recommended and npm as compatibility. |
| Plugin/dev-skill packaging | `plugins/fgOS/skills/`, `test/skills/fgos-mirror.test.mjs`, `src/setup/skill-wrappers.mjs` | Distribution touches this, but it may deserve a sub-contract rather than bloating the main spec. |
```

### Unified diff

```diff
No text difference.
```

## claim_84583eb258ce4940aa6ea139e175c59c

Source: docs/architect/packaging-distribution/rewrite-plan.md#3-documentation-standard-gap

Target: docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#3-documentation-standard-gap

Source identity digest: `bc9a3a6a9fe8c8a13b18e489b684f55a28fb1e378d3244a134a3df6e0a77c29d`

Target identity digest: `b8cf1c7f0d4e6db18e6192989c4217649c727e5620ae1a0eff98a9cc4e1a3908`

Source shown SHA256: `7b87956dfa6a0c060e446ab7a59fae032a2dd5842827ef4b9cfb546c68c8f01b`

Target shown SHA256: `87e68af474bd1f028e99e7f5d236198dc464535aa52032dd58c476192b47198f`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_84583eb258ce4940aa6ea139e175c59c |
| sourceUnitDigest | bc9a3a6a9fe8c8a13b18e489b684f55a28fb1e378d3244a134a3df6e0a77c29d |
| targetOwner | docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md |
| targetAnchor | 3-documentation-standard-gap |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete heading from docs/architect/packaging-distribution/rewrite-plan.md#3-documentation-standard-gap, under "3. Documentation Standard Gap", is retained at docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#3-documentation-standard-gap. Only heading depth changes; the direct section payload follows the original source order. This remains dated source context, with no current runtime truth claim. |

### Source unit

```text
# 3. Documentation Standard Gap

The current documentation standard has status, evidence, and verification sections, but it does not yet force a direct design-versus-implementation comparison.

For this rewrite, every maintained distribution document that contains normative design claims should include this block:

| Design claim | Implementation status | Evidence | Gap / next action |
| --- | --- | --- | --- |
| Short, testable claim | `implemented`, `partial`, `planned`, `superseded`, or `unknown` | Code/test/doc links | What remains or why no action is needed |

This should later be promoted into `docs/doc-governance.md` and the templates as an `Implementation Alignment` rule.
```

### Target unit

```text
### 3. Documentation Standard Gap

The current documentation standard has status, evidence, and verification sections, but it does not yet force a direct design-versus-implementation comparison.

For this rewrite, every maintained distribution document that contains normative design claims should include this block:

| Design claim | Implementation status | Evidence | Gap / next action |
| --- | --- | --- | --- |
| Short, testable claim | `implemented`, `partial`, `planned`, `superseded`, or `unknown` | Code/test/doc links | What remains or why no action is needed |

This should later be promoted into `docs/doc-governance.md` and the templates as an `Implementation Alignment` rule.
```

### Unified diff

```diff
--- "docs/architect/packaging-distribution/rewrite-plan.md#3-documentation-standard-gap"
+++ "docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#3-documentation-standard-gap"
@@ -1,4 +1,4 @@
-# 3. Documentation Standard Gap
+### 3. Documentation Standard Gap
 
 The current documentation standard has status, evidence, and verification sections, but it does not yet force a direct design-versus-implementation comparison.
```

## claim_4206bf10c55bad6c3a0e701ed2ccec35

Source: docs/architect/packaging-distribution/rewrite-plan.md#unheaded-block-7

Target: docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#unheaded-block-9

Source identity digest: `51b8cb21dd47a399746c7866aed5f22ef31124ce9006be80d3abb02b10cb7c26`

Target identity digest: `51b8cb21dd47a399746c7866aed5f22ef31124ce9006be80d3abb02b10cb7c26`

Source shown SHA256: `51b8cb21dd47a399746c7866aed5f22ef31124ce9006be80d3abb02b10cb7c26`

Target shown SHA256: `51b8cb21dd47a399746c7866aed5f22ef31124ce9006be80d3abb02b10cb7c26`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_4206bf10c55bad6c3a0e701ed2ccec35 |
| sourceUnitDigest | 51b8cb21dd47a399746c7866aed5f22ef31124ce9006be80d3abb02b10cb7c26 |
| targetOwner | docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md |
| targetAnchor | unheaded-block-9 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/rewrite-plan.md#unheaded-block-7, under "3. Documentation Standard Gap", is retained at docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#unheaded-block-9. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. This remains dated source context, with no current runtime truth claim. |

### Source unit

```text
The current documentation standard has status, evidence, and verification sections, but it does not yet force a direct design-versus-implementation comparison.
```

### Target unit

```text
The current documentation standard has status, evidence, and verification sections, but it does not yet force a direct design-versus-implementation comparison.
```

### Unified diff

```diff
No text difference.
```

## claim_453db5f9994d258e7b38277377a6151f

Source: docs/architect/packaging-distribution/rewrite-plan.md#unheaded-block-8

Target: docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#unheaded-block-10

Source identity digest: `4142f9d963eae4c9db1095a04df7160da047a623d85ded4ba66704e6ba096b1e`

Target identity digest: `4142f9d963eae4c9db1095a04df7160da047a623d85ded4ba66704e6ba096b1e`

Source shown SHA256: `4142f9d963eae4c9db1095a04df7160da047a623d85ded4ba66704e6ba096b1e`

Target shown SHA256: `4142f9d963eae4c9db1095a04df7160da047a623d85ded4ba66704e6ba096b1e`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_453db5f9994d258e7b38277377a6151f |
| sourceUnitDigest | 4142f9d963eae4c9db1095a04df7160da047a623d85ded4ba66704e6ba096b1e |
| targetOwner | docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md |
| targetAnchor | unheaded-block-10 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/rewrite-plan.md#unheaded-block-8, under "3. Documentation Standard Gap", is retained at docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#unheaded-block-10. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. This remains dated source context, with no current runtime truth claim. |

### Source unit

```text
For this rewrite, every maintained distribution document that contains normative design claims should include this block:
```

### Target unit

```text
For this rewrite, every maintained distribution document that contains normative design claims should include this block:
```

### Unified diff

```diff
No text difference.
```

## claim_ed9ea6a584842b2f07921e96bb9ea75d

Source: docs/architect/packaging-distribution/rewrite-plan.md#unheaded-block-9

Target: docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#unheaded-block-11

Source identity digest: `5267304fa32a76ff519295b68fc10e122530eb570021bd550981dcb95987ee59`

Target identity digest: `5267304fa32a76ff519295b68fc10e122530eb570021bd550981dcb95987ee59`

Source shown SHA256: `5267304fa32a76ff519295b68fc10e122530eb570021bd550981dcb95987ee59`

Target shown SHA256: `5267304fa32a76ff519295b68fc10e122530eb570021bd550981dcb95987ee59`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_ed9ea6a584842b2f07921e96bb9ea75d |
| sourceUnitDigest | 5267304fa32a76ff519295b68fc10e122530eb570021bd550981dcb95987ee59 |
| targetOwner | docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md |
| targetAnchor | unheaded-block-11 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/rewrite-plan.md#unheaded-block-9, under "3. Documentation Standard Gap", is retained at docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#unheaded-block-11. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. This remains dated source context, with no current runtime truth claim. |

### Source unit

```text
| Design claim | Implementation status | Evidence | Gap / next action |
| --- | --- | --- | --- |
| Short, testable claim | `implemented`, `partial`, `planned`, `superseded`, or `unknown` | Code/test/doc links | What remains or why no action is needed |
```

### Target unit

```text
| Design claim | Implementation status | Evidence | Gap / next action |
| --- | --- | --- | --- |
| Short, testable claim | `implemented`, `partial`, `planned`, `superseded`, or `unknown` | Code/test/doc links | What remains or why no action is needed |
```

### Unified diff

```diff
No text difference.
```

## claim_5c33a4d69bd90bbe87b610c1a3cd3ddf

Source: docs/architect/packaging-distribution/rewrite-plan.md#unheaded-block-10

Target: docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#unheaded-block-12

Source identity digest: `a1f6495231399a8157da580f96494223b9d66d4c2f30e98105685f9c6ca78683`

Target identity digest: `a1f6495231399a8157da580f96494223b9d66d4c2f30e98105685f9c6ca78683`

Source shown SHA256: `a1f6495231399a8157da580f96494223b9d66d4c2f30e98105685f9c6ca78683`

Target shown SHA256: `a1f6495231399a8157da580f96494223b9d66d4c2f30e98105685f9c6ca78683`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_5c33a4d69bd90bbe87b610c1a3cd3ddf |
| sourceUnitDigest | a1f6495231399a8157da580f96494223b9d66d4c2f30e98105685f9c6ca78683 |
| targetOwner | docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md |
| targetAnchor | unheaded-block-12 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/rewrite-plan.md#unheaded-block-10, under "3. Documentation Standard Gap", is retained at docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#unheaded-block-12. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. This remains dated source context, with no current runtime truth claim. |

### Source unit

```text
This should later be promoted into `docs/doc-governance.md` and the templates as an `Implementation Alignment` rule.
```

### Target unit

```text
This should later be promoted into `docs/doc-governance.md` and the templates as an `Implementation Alignment` rule.
```

### Unified diff

```diff
No text difference.
```

## claim_883af464f949ae92e66a6c549900f30d

Source: docs/architect/packaging-distribution/rewrite-plan.md#4-proposed-target-shape

Target: docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#4-proposed-target-shape

Source identity digest: `3ee29620433d45f30066cf47beef9e27cdbb47120c43c0f2365b0a616a89655d`

Target identity digest: `8002c4c3283634a4f25ab0175eeab30f54b78259b20dd620179ab056d0179cdd`

Source shown SHA256: `0080f77c50ecec034a2eec9fd8b27acc2f0505ba0388619a2581c7919a34d9a1`

Target shown SHA256: `3084eb74ed487d8380ebedd5412d6f3d9cb304001d43e9fe49e85e6a4f2ecd0e`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_883af464f949ae92e66a6c549900f30d |
| sourceUnitDigest | 3ee29620433d45f30066cf47beef9e27cdbb47120c43c0f2365b0a616a89655d |
| targetOwner | docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md |
| targetAnchor | 4-proposed-target-shape |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete heading from docs/architect/packaging-distribution/rewrite-plan.md#4-proposed-target-shape, under "4. Proposed Target Shape", is retained at docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#4-proposed-target-shape. Only heading depth changes; the direct section payload follows the original source order. This remains dated source context, with no current runtime truth claim. |

### Source unit

````text
# 4. Proposed Target Shape

Target area name: `packaging-distribution`.

Target human-facing title: `Packaging And Distribution`.

Proposed destination after migration:

```txt
docs/platform/packaging-distribution/
  README.md
  spec.md
  architecture/
    runtime-identity-and-activation.md
    fgctl-and-local-fgos.md
    future-constraints.md
  contracts/
    release-manifest.md
    activation-binding.md
    distribution-pin.md
    projection-ledger.md
    setup-doctor-registry.md
  verification/
    implementation-alignment.md
    install-and-release-proof.md
  history/
    distribution-baseline.md
```

Cross-area dependencies should stay outside the area and be linked:

| Dependency | Suggested owner |
| --- | --- |
| Workspace topology | Platform-wide architecture, not packaging-distribution |
| Host invocation routing / Rust host command dispatch | Host/runtime area |
| Confinement backend setup/doctor checks | Confinement authority area, linked from packaging-distribution |
| Gateway/shared web future | Gateway area plus distribution future constraints |
````

### Target unit

````text
### 4. Proposed Target Shape

Target area name: `packaging-distribution`.

Target human-facing title: `Packaging And Distribution`.

Proposed destination after migration:

```txt
docs/platform/packaging-distribution/
  README.md
  spec.md
  architecture/
    runtime-identity-and-activation.md
    fgctl-and-local-fgos.md
    future-constraints.md
  contracts/
    release-manifest.md
    activation-binding.md
    distribution-pin.md
    projection-ledger.md
    setup-doctor-registry.md
  verification/
    implementation-alignment.md
    install-and-release-proof.md
  history/
    distribution-baseline.md
```

Cross-area dependencies should stay outside the area and be linked:

| Dependency | Suggested owner |
| --- | --- |
| Workspace topology | Platform-wide architecture, not packaging-distribution |
| Host invocation routing / Rust host command dispatch | Host/runtime area |
| Confinement backend setup/doctor checks | Confinement authority area, linked from packaging-distribution |
| Gateway/shared web future | Gateway area plus distribution future constraints |
````

### Unified diff

```diff
--- "docs/architect/packaging-distribution/rewrite-plan.md#4-proposed-target-shape"
+++ "docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#4-proposed-target-shape"
@@ -1,4 +1,4 @@
-# 4. Proposed Target Shape
+### 4. Proposed Target Shape
 
 Target area name: `packaging-distribution`.
```

## claim_0a86c2af3fd40af225beb40de5f19808

Source: docs/architect/packaging-distribution/rewrite-plan.md#unheaded-block-11

Target: docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#unheaded-block-13

Source identity digest: `243a4c59acdd62e05656dfa9f0b065f0e52b65e632c9cc4449b587df6a98c2ab`

Target identity digest: `243a4c59acdd62e05656dfa9f0b065f0e52b65e632c9cc4449b587df6a98c2ab`

Source shown SHA256: `243a4c59acdd62e05656dfa9f0b065f0e52b65e632c9cc4449b587df6a98c2ab`

Target shown SHA256: `243a4c59acdd62e05656dfa9f0b065f0e52b65e632c9cc4449b587df6a98c2ab`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_0a86c2af3fd40af225beb40de5f19808 |
| sourceUnitDigest | 243a4c59acdd62e05656dfa9f0b065f0e52b65e632c9cc4449b587df6a98c2ab |
| targetOwner | docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md |
| targetAnchor | unheaded-block-13 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/rewrite-plan.md#unheaded-block-11, under "4. Proposed Target Shape", is retained at docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#unheaded-block-13. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. This remains dated source context, with no current runtime truth claim. |

### Source unit

```text
Target area name: `packaging-distribution`.
```

### Target unit

```text
Target area name: `packaging-distribution`.
```

### Unified diff

```diff
No text difference.
```

## claim_08a5ed2ccd07b58d50fe49a256d1833d

Source: docs/architect/packaging-distribution/rewrite-plan.md#unheaded-block-12

Target: docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#unheaded-block-14

Source identity digest: `41d73aeb1feafd90f0e37d3c73f8e704f75c42edb4bca5d8321107503ca2a226`

Target identity digest: `41d73aeb1feafd90f0e37d3c73f8e704f75c42edb4bca5d8321107503ca2a226`

Source shown SHA256: `41d73aeb1feafd90f0e37d3c73f8e704f75c42edb4bca5d8321107503ca2a226`

Target shown SHA256: `41d73aeb1feafd90f0e37d3c73f8e704f75c42edb4bca5d8321107503ca2a226`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_08a5ed2ccd07b58d50fe49a256d1833d |
| sourceUnitDigest | 41d73aeb1feafd90f0e37d3c73f8e704f75c42edb4bca5d8321107503ca2a226 |
| targetOwner | docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md |
| targetAnchor | unheaded-block-14 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/rewrite-plan.md#unheaded-block-12, under "4. Proposed Target Shape", is retained at docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#unheaded-block-14. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. This remains dated source context, with no current runtime truth claim. |

### Source unit

```text
Target human-facing title: `Packaging And Distribution`.
```

### Target unit

```text
Target human-facing title: `Packaging And Distribution`.
```

### Unified diff

```diff
No text difference.
```

## claim_4c3f85a8fc5aab46a172b633c141c034

Source: docs/architect/packaging-distribution/rewrite-plan.md#unheaded-block-13

Target: docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#unheaded-block-15

Source identity digest: `29fe6ee51817928898b2b49aa0d3ea289302f14d40346bb678c4a2cc7298b831`

Target identity digest: `29fe6ee51817928898b2b49aa0d3ea289302f14d40346bb678c4a2cc7298b831`

Source shown SHA256: `29fe6ee51817928898b2b49aa0d3ea289302f14d40346bb678c4a2cc7298b831`

Target shown SHA256: `29fe6ee51817928898b2b49aa0d3ea289302f14d40346bb678c4a2cc7298b831`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_4c3f85a8fc5aab46a172b633c141c034 |
| sourceUnitDigest | 29fe6ee51817928898b2b49aa0d3ea289302f14d40346bb678c4a2cc7298b831 |
| targetOwner | docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md |
| targetAnchor | unheaded-block-15 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/rewrite-plan.md#unheaded-block-13, under "4. Proposed Target Shape", is retained at docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#unheaded-block-15. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. This remains dated source context, with no current runtime truth claim. |

### Source unit

```text
Proposed destination after migration:
```

### Target unit

```text
Proposed destination after migration:
```

### Unified diff

```diff
No text difference.
```

## claim_4aa91c9c0611e4d3ea19926a3e8fc2dd

Source: docs/architect/packaging-distribution/rewrite-plan.md#unheaded-block-14

Target: docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#unheaded-block-16

Source identity digest: `6d8e01ea29ff241ff6513af7ed38927634132cb1d1595da92c6de676281b847c`

Target identity digest: `6d8e01ea29ff241ff6513af7ed38927634132cb1d1595da92c6de676281b847c`

Source shown SHA256: `6d8e01ea29ff241ff6513af7ed38927634132cb1d1595da92c6de676281b847c`

Target shown SHA256: `6d8e01ea29ff241ff6513af7ed38927634132cb1d1595da92c6de676281b847c`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_4aa91c9c0611e4d3ea19926a3e8fc2dd |
| sourceUnitDigest | 6d8e01ea29ff241ff6513af7ed38927634132cb1d1595da92c6de676281b847c |
| targetOwner | docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md |
| targetAnchor | unheaded-block-16 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/rewrite-plan.md#unheaded-block-14, under "4. Proposed Target Shape", is retained at docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#unheaded-block-16. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. This remains dated source context, with no current runtime truth claim. |

### Source unit

````text
```txt
docs/platform/packaging-distribution/
  README.md
  spec.md
  architecture/
    runtime-identity-and-activation.md
    fgctl-and-local-fgos.md
    future-constraints.md
  contracts/
    release-manifest.md
    activation-binding.md
    distribution-pin.md
    projection-ledger.md
    setup-doctor-registry.md
  verification/
    implementation-alignment.md
    install-and-release-proof.md
  history/
    distribution-baseline.md
```
````

### Target unit

````text
```txt
docs/platform/packaging-distribution/
  README.md
  spec.md
  architecture/
    runtime-identity-and-activation.md
    fgctl-and-local-fgos.md
    future-constraints.md
  contracts/
    release-manifest.md
    activation-binding.md
    distribution-pin.md
    projection-ledger.md
    setup-doctor-registry.md
  verification/
    implementation-alignment.md
    install-and-release-proof.md
  history/
    distribution-baseline.md
```
````

### Unified diff

```diff
No text difference.
```

## claim_6d64221408bc0725ec87d1647ee1f99e

Source: docs/architect/packaging-distribution/rewrite-plan.md#unheaded-block-15

Target: docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#unheaded-block-17

Source identity digest: `df1bdd45d336d4136d97aca0df02bd834f758533d1adf232c03dc12520bb1812`

Target identity digest: `df1bdd45d336d4136d97aca0df02bd834f758533d1adf232c03dc12520bb1812`

Source shown SHA256: `df1bdd45d336d4136d97aca0df02bd834f758533d1adf232c03dc12520bb1812`

Target shown SHA256: `df1bdd45d336d4136d97aca0df02bd834f758533d1adf232c03dc12520bb1812`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_6d64221408bc0725ec87d1647ee1f99e |
| sourceUnitDigest | df1bdd45d336d4136d97aca0df02bd834f758533d1adf232c03dc12520bb1812 |
| targetOwner | docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md |
| targetAnchor | unheaded-block-17 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/rewrite-plan.md#unheaded-block-15, under "4. Proposed Target Shape", is retained at docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#unheaded-block-17. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. This remains dated source context, with no current runtime truth claim. |

### Source unit

```text
Cross-area dependencies should stay outside the area and be linked:
```

### Target unit

```text
Cross-area dependencies should stay outside the area and be linked:
```

### Unified diff

```diff
No text difference.
```

## claim_6f07746f61ac8a7a89a8bf924fe8444a

Source: docs/architect/packaging-distribution/rewrite-plan.md#unheaded-block-16

Target: docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#unheaded-block-18

Source identity digest: `60ab6bf3c5f5a8a58b860fee76791c947705c37dfc3a583775bca6f9b47e2204`

Target identity digest: `60ab6bf3c5f5a8a58b860fee76791c947705c37dfc3a583775bca6f9b47e2204`

Source shown SHA256: `60ab6bf3c5f5a8a58b860fee76791c947705c37dfc3a583775bca6f9b47e2204`

Target shown SHA256: `60ab6bf3c5f5a8a58b860fee76791c947705c37dfc3a583775bca6f9b47e2204`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_6f07746f61ac8a7a89a8bf924fe8444a |
| sourceUnitDigest | 60ab6bf3c5f5a8a58b860fee76791c947705c37dfc3a583775bca6f9b47e2204 |
| targetOwner | docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md |
| targetAnchor | unheaded-block-18 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/rewrite-plan.md#unheaded-block-16, under "4. Proposed Target Shape", is retained at docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#unheaded-block-18. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. This remains dated source context, with no current runtime truth claim. |

### Source unit

```text
| Dependency | Suggested owner |
| --- | --- |
| Workspace topology | Platform-wide architecture, not packaging-distribution |
| Host invocation routing / Rust host command dispatch | Host/runtime area |
| Confinement backend setup/doctor checks | Confinement authority area, linked from packaging-distribution |
| Gateway/shared web future | Gateway area plus distribution future constraints |
```

### Target unit

```text
| Dependency | Suggested owner |
| --- | --- |
| Workspace topology | Platform-wide architecture, not packaging-distribution |
| Host invocation routing / Rust host command dispatch | Host/runtime area |
| Confinement backend setup/doctor checks | Confinement authority area, linked from packaging-distribution |
| Gateway/shared web future | Gateway area plus distribution future constraints |
```

### Unified diff

```diff
No text difference.
```

## claim_15562bd4682b6d4a51390e92f4b28c37

Source: docs/architect/packaging-distribution/rewrite-plan.md#5-rewrite-method

Target: docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#5-rewrite-method

Source identity digest: `dc674f6d9d22cc7821ebc58aa11fcd4fd19593a26f09861fd3f273c6c9562361`

Target identity digest: `c995b961171b99d06641bf6b9d98eb01dac730a0c575619afb4e26d22f76316c`

Source shown SHA256: `37938bc1d066482109f0a36ed46bedd76f7d8039dc7d91da6af04fbed21680b9`

Target shown SHA256: `30a70bffa604b5afaf07e09187d875ae61841365a3219e94413739da9a69c53a`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_15562bd4682b6d4a51390e92f4b28c37 |
| sourceUnitDigest | dc674f6d9d22cc7821ebc58aa11fcd4fd19593a26f09861fd3f273c6c9562361 |
| targetOwner | docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md |
| targetAnchor | 5-rewrite-method |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete heading from docs/architect/packaging-distribution/rewrite-plan.md#5-rewrite-method, under "5. Rewrite Method", is retained at docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#5-rewrite-method. Only heading depth changes; the direct section payload follows the original source order. This remains dated source context, with no current runtime truth claim. |

### Source unit

```text
# 5. Rewrite Method
```

### Target unit

```text
### 5. Rewrite Method
```

### Unified diff

```diff
--- "docs/architect/packaging-distribution/rewrite-plan.md#5-rewrite-method"
+++ "docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#5-rewrite-method"
@@ -1 +1 @@
-# 5. Rewrite Method
\ No newline at end of file
+### 5. Rewrite Method
\ No newline at end of file
```

## claim_3915f8ed8fe94d513d2f5bd03067ab71

Source: docs/architect/packaging-distribution/rewrite-plan.md#51-phase-1---freeze-inventory

Target: docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#51-phase-1---freeze-inventory

Source identity digest: `6095c15219684973d7266cb5ae6bfa515f62f4b633d65082f5d3951b609da839`

Target identity digest: `890cbf563f8f9f5c0f8cff7e2ebf6b74183259c123c5ab09fc43ea0901b0d750`

Source shown SHA256: `17139cf03485754cc67676fceea43f5534ec3501c2629b5fb561098b9691e92b`

Target shown SHA256: `6b97dc80df4581b31ff6223858f27c0ad6150eec4ed7049116033835f5a27b2c`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_3915f8ed8fe94d513d2f5bd03067ab71 |
| sourceUnitDigest | 6095c15219684973d7266cb5ae6bfa515f62f4b633d65082f5d3951b609da839 |
| targetOwner | docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md |
| targetAnchor | 51-phase-1---freeze-inventory |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete heading from docs/architect/packaging-distribution/rewrite-plan.md#51-phase-1---freeze-inventory, under "5.1 Phase 1 - Freeze Inventory", is retained at docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#51-phase-1---freeze-inventory. Only heading depth changes; the direct section payload follows the original source order. This remains dated source context, with no current runtime truth claim. |

### Source unit

```text
## 5.1 Phase 1 - Freeze Inventory

Create a source inventory before rewriting:

- list every distribution-related doc;
- classify each as current truth, architecture target, history, generated projection, or verification evidence;
- identify whether each source appears generated, hand-curated, or discussion-derived;
- record source authority and target destination.

Output: inventory table in the rewrite plan or a short `migration-map.md`.
```

### Target unit

```text
#### 5.1 Phase 1 - Freeze Inventory

Create a source inventory before rewriting:

- list every distribution-related doc;
- classify each as current truth, architecture target, history, generated projection, or verification evidence;
- identify whether each source appears generated, hand-curated, or discussion-derived;
- record source authority and target destination.

Output: inventory table in the rewrite plan or a short `migration-map.md`.
```

### Unified diff

```diff
--- "docs/architect/packaging-distribution/rewrite-plan.md#51-phase-1---freeze-inventory"
+++ "docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#51-phase-1---freeze-inventory"
@@ -1,4 +1,4 @@
-## 5.1 Phase 1 - Freeze Inventory
+#### 5.1 Phase 1 - Freeze Inventory
 
 Create a source inventory before rewriting:
```

## claim_97ce92c5ce6bfd7c04ae6eff4955bfa0

Source: docs/architect/packaging-distribution/rewrite-plan.md#unheaded-block-17

Target: docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#unheaded-block-19

Source identity digest: `67c0ad933d124f25d4b6757a47c25ded05d3fedbbee26bcb394052d558a1bea6`

Target identity digest: `67c0ad933d124f25d4b6757a47c25ded05d3fedbbee26bcb394052d558a1bea6`

Source shown SHA256: `67c0ad933d124f25d4b6757a47c25ded05d3fedbbee26bcb394052d558a1bea6`

Target shown SHA256: `67c0ad933d124f25d4b6757a47c25ded05d3fedbbee26bcb394052d558a1bea6`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_97ce92c5ce6bfd7c04ae6eff4955bfa0 |
| sourceUnitDigest | 67c0ad933d124f25d4b6757a47c25ded05d3fedbbee26bcb394052d558a1bea6 |
| targetOwner | docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md |
| targetAnchor | unheaded-block-19 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/rewrite-plan.md#unheaded-block-17, under "5.1 Phase 1 - Freeze Inventory", is retained at docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#unheaded-block-19. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. This remains dated source context, with no current runtime truth claim. |

### Source unit

```text
Create a source inventory before rewriting:
```

### Target unit

```text
Create a source inventory before rewriting:
```

### Unified diff

```diff
No text difference.
```

## claim_1db2433383b8bb2b37892501e3c16f23

Source: docs/architect/packaging-distribution/rewrite-plan.md#unheaded-block-18

Target: docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#unheaded-block-20

Source identity digest: `be8d57c2a55c0fdfced021055a2cf4482e5ad2e98723e2bb348f25f6bc38ef1e`

Target identity digest: `be8d57c2a55c0fdfced021055a2cf4482e5ad2e98723e2bb348f25f6bc38ef1e`

Source shown SHA256: `be8d57c2a55c0fdfced021055a2cf4482e5ad2e98723e2bb348f25f6bc38ef1e`

Target shown SHA256: `be8d57c2a55c0fdfced021055a2cf4482e5ad2e98723e2bb348f25f6bc38ef1e`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_1db2433383b8bb2b37892501e3c16f23 |
| sourceUnitDigest | be8d57c2a55c0fdfced021055a2cf4482e5ad2e98723e2bb348f25f6bc38ef1e |
| targetOwner | docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md |
| targetAnchor | unheaded-block-20 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/rewrite-plan.md#unheaded-block-18, under "5.1 Phase 1 - Freeze Inventory", is retained at docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#unheaded-block-20. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. This remains dated source context, with no current runtime truth claim. |

### Source unit

```text
- list every distribution-related doc;
- classify each as current truth, architecture target, history, generated projection, or verification evidence;
- identify whether each source appears generated, hand-curated, or discussion-derived;
- record source authority and target destination.
```

### Target unit

```text
- list every distribution-related doc;
- classify each as current truth, architecture target, history, generated projection, or verification evidence;
- identify whether each source appears generated, hand-curated, or discussion-derived;
- record source authority and target destination.
```

### Unified diff

```diff
No text difference.
```

## claim_4d6f6ef0095d4a62e1428407509de3b9

Source: docs/architect/packaging-distribution/rewrite-plan.md#unheaded-block-19

Target: docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#unheaded-block-21

Source identity digest: `76219d4f92f049beec82e6196f2cebd04f3faaab8c97264f12089a3cbcf1e244`

Target identity digest: `76219d4f92f049beec82e6196f2cebd04f3faaab8c97264f12089a3cbcf1e244`

Source shown SHA256: `76219d4f92f049beec82e6196f2cebd04f3faaab8c97264f12089a3cbcf1e244`

Target shown SHA256: `76219d4f92f049beec82e6196f2cebd04f3faaab8c97264f12089a3cbcf1e244`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_4d6f6ef0095d4a62e1428407509de3b9 |
| sourceUnitDigest | 76219d4f92f049beec82e6196f2cebd04f3faaab8c97264f12089a3cbcf1e244 |
| targetOwner | docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md |
| targetAnchor | unheaded-block-21 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/rewrite-plan.md#unheaded-block-19, under "5.1 Phase 1 - Freeze Inventory", is retained at docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#unheaded-block-21. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. This remains dated source context, with no current runtime truth claim. |

### Source unit

```text
Output: inventory table in the rewrite plan or a short `migration-map.md`.
```

### Target unit

```text
Output: inventory table in the rewrite plan or a short `migration-map.md`.
```

### Unified diff

```diff
No text difference.
```

## claim_9baf5a6a983c11dc335a8fb6f7473d9f

Source: docs/architect/packaging-distribution/rewrite-plan.md#52-phase-2---decide-authority-model

Target: docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#52-phase-2---decide-authority-model

Source identity digest: `cb230738c4a549ce21bf8d84abc23dfebcdea437040ecc81ce283e0dba1764fd`

Target identity digest: `157bed93a190b148677871b5f6f6217f713dbe288fb14f606fc4d8d1baaa9cd7`

Source shown SHA256: `806791fd5d912c9cce2a1ab5c1e601cd6595440840c0ed7d4e0ace93cd8a71f2`

Target shown SHA256: `241c5b8a02d0a455902d4ab41dd961183b4b601a4f46431ce178587bd910046b`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_9baf5a6a983c11dc335a8fb6f7473d9f |
| sourceUnitDigest | cb230738c4a549ce21bf8d84abc23dfebcdea437040ecc81ce283e0dba1764fd |
| targetOwner | docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md |
| targetAnchor | 52-phase-2---decide-authority-model |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete heading from docs/architect/packaging-distribution/rewrite-plan.md#52-phase-2---decide-authority-model, under "5.2 Phase 2 - Decide Authority Model", is retained at docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#52-phase-2---decide-authority-model. Only heading depth changes; the direct section payload follows the original source order. This remains dated source context, with no current runtime truth claim. |

### Source unit

```text
## 5.2 Phase 2 - Decide Authority Model

Settle these labels before editing canonical docs:

| Question | Recommended answer |
| --- | --- |
| Is `docs/specs/distribution.md` canonical after rewrite? | No; it remains legacy/current-state source until promoted into `docs/platform/packaging-distribution/spec.md`. |
| Is `runtime-identity-and-activation.md` current implementation truth? | Not fully; it is architecture target plus partial implementation, so it needs `Implementation Alignment`. |
| Does setup/doctor belong in packaging-distribution? | For now yes as a packaging-distribution contract, but keep it separable as `contracts/setup-doctor-registry.md`. |
| Does workspace topology belong inside packaging-distribution? | No; packaging-distribution consumes it and links to it. |
```

### Target unit

```text
#### 5.2 Phase 2 - Decide Authority Model

Settle these labels before editing canonical docs:

| Question | Recommended answer |
| --- | --- |
| Is `docs/specs/distribution.md` canonical after rewrite? | No; it remains legacy/current-state source until promoted into `docs/platform/packaging-distribution/spec.md`. |
| Is `runtime-identity-and-activation.md` current implementation truth? | Not fully; it is architecture target plus partial implementation, so it needs `Implementation Alignment`. |
| Does setup/doctor belong in packaging-distribution? | For now yes as a packaging-distribution contract, but keep it separable as `contracts/setup-doctor-registry.md`. |
| Does workspace topology belong inside packaging-distribution? | No; packaging-distribution consumes it and links to it. |
```

### Unified diff

```diff
--- "docs/architect/packaging-distribution/rewrite-plan.md#52-phase-2---decide-authority-model"
+++ "docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#52-phase-2---decide-authority-model"
@@ -1,4 +1,4 @@
-## 5.2 Phase 2 - Decide Authority Model
+#### 5.2 Phase 2 - Decide Authority Model
 
 Settle these labels before editing canonical docs:
```

## claim_9898058e8fe7decfbf7714019c031d0a

Source: docs/architect/packaging-distribution/rewrite-plan.md#unheaded-block-20

Target: docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#unheaded-block-22

Source identity digest: `63366dd6264db9ba78440214e92cc606cc05fe19485cd18bb57b9f0e818ca43d`

Target identity digest: `63366dd6264db9ba78440214e92cc606cc05fe19485cd18bb57b9f0e818ca43d`

Source shown SHA256: `63366dd6264db9ba78440214e92cc606cc05fe19485cd18bb57b9f0e818ca43d`

Target shown SHA256: `63366dd6264db9ba78440214e92cc606cc05fe19485cd18bb57b9f0e818ca43d`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_9898058e8fe7decfbf7714019c031d0a |
| sourceUnitDigest | 63366dd6264db9ba78440214e92cc606cc05fe19485cd18bb57b9f0e818ca43d |
| targetOwner | docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md |
| targetAnchor | unheaded-block-22 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/rewrite-plan.md#unheaded-block-20, under "5.2 Phase 2 - Decide Authority Model", is retained at docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#unheaded-block-22. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. This remains dated source context, with no current runtime truth claim. |

### Source unit

```text
Settle these labels before editing canonical docs:
```

### Target unit

```text
Settle these labels before editing canonical docs:
```

### Unified diff

```diff
No text difference.
```

## claim_d60c0e57eb3df0251ecf21ad6ba00bfe

Source: docs/architect/packaging-distribution/rewrite-plan.md#unheaded-block-21

Target: docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#unheaded-block-23

Source identity digest: `1744b55c1b78b5352a113a327eab32e99ef08741b8feecea3b247d7e06eed632`

Target identity digest: `1744b55c1b78b5352a113a327eab32e99ef08741b8feecea3b247d7e06eed632`

Source shown SHA256: `1744b55c1b78b5352a113a327eab32e99ef08741b8feecea3b247d7e06eed632`

Target shown SHA256: `1744b55c1b78b5352a113a327eab32e99ef08741b8feecea3b247d7e06eed632`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_d60c0e57eb3df0251ecf21ad6ba00bfe |
| sourceUnitDigest | 1744b55c1b78b5352a113a327eab32e99ef08741b8feecea3b247d7e06eed632 |
| targetOwner | docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md |
| targetAnchor | unheaded-block-23 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/rewrite-plan.md#unheaded-block-21, under "5.2 Phase 2 - Decide Authority Model", is retained at docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#unheaded-block-23. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. This remains dated source context, with no current runtime truth claim. |

### Source unit

```text
| Question | Recommended answer |
| --- | --- |
| Is `docs/specs/distribution.md` canonical after rewrite? | No; it remains legacy/current-state source until promoted into `docs/platform/packaging-distribution/spec.md`. |
| Is `runtime-identity-and-activation.md` current implementation truth? | Not fully; it is architecture target plus partial implementation, so it needs `Implementation Alignment`. |
| Does setup/doctor belong in packaging-distribution? | For now yes as a packaging-distribution contract, but keep it separable as `contracts/setup-doctor-registry.md`. |
| Does workspace topology belong inside packaging-distribution? | No; packaging-distribution consumes it and links to it. |
```

### Target unit

```text
| Question | Recommended answer |
| --- | --- |
| Is `docs/specs/distribution.md` canonical after rewrite? | No; it remains legacy/current-state source until promoted into `docs/platform/packaging-distribution/spec.md`. |
| Is `runtime-identity-and-activation.md` current implementation truth? | Not fully; it is architecture target plus partial implementation, so it needs `Implementation Alignment`. |
| Does setup/doctor belong in packaging-distribution? | For now yes as a packaging-distribution contract, but keep it separable as `contracts/setup-doctor-registry.md`. |
| Does workspace topology belong inside packaging-distribution? | No; packaging-distribution consumes it and links to it. |
```

### Unified diff

```diff
No text difference.
```

## claim_34ac4116422aad2956fdd30d5a2b5aea

Source: docs/architect/packaging-distribution/rewrite-plan.md#53-phase-3---write-the-area-portal

Target: docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#53-phase-3---write-the-area-portal

Source identity digest: `dab9556af36a50b2aa823b055d0874047ffd3a0b72392685c67fc9a9abf8720d`

Target identity digest: `3e265cd1325200c1f754b13641eaf318ca417d3fb6c70a62759588b023f7bd57`

Source shown SHA256: `f999c205fa7ba278cc1a604dd59f34b28a64463581917605ddadea8d8e350b6b`

Target shown SHA256: `f768730da86dabf85ff266eaf91fde24fe45b4c57d925dc732655742c6df83a4`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_34ac4116422aad2956fdd30d5a2b5aea |
| sourceUnitDigest | dab9556af36a50b2aa823b055d0874047ffd3a0b72392685c67fc9a9abf8720d |
| targetOwner | docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md |
| targetAnchor | 53-phase-3---write-the-area-portal |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete heading from docs/architect/packaging-distribution/rewrite-plan.md#53-phase-3---write-the-area-portal, under "5.3 Phase 3 - Write The Area Portal", is retained at docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#53-phase-3---write-the-area-portal. Only heading depth changes; the direct section payload follows the original source order. This remains dated source context, with no current runtime truth claim. |

### Source unit

```text
## 5.3 Phase 3 - Write The Area Portal

Create `docs/platform/packaging-distribution/README.md` with:

- who should read this area;
- what to read first by purpose;
- current shipped model versus target runtime model;
- owner boundaries;
- links to spec, architecture, contracts, verification, and history.

The portal must be scannable for humans without requiring them to read governance first.
```

### Target unit

```text
#### 5.3 Phase 3 - Write The Area Portal

Create `docs/platform/packaging-distribution/README.md` with:

- who should read this area;
- what to read first by purpose;
- current shipped model versus target runtime model;
- owner boundaries;
- links to spec, architecture, contracts, verification, and history.

The portal must be scannable for humans without requiring them to read governance first.
```

### Unified diff

```diff
--- "docs/architect/packaging-distribution/rewrite-plan.md#53-phase-3---write-the-area-portal"
+++ "docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#53-phase-3---write-the-area-portal"
@@ -1,4 +1,4 @@
-## 5.3 Phase 3 - Write The Area Portal
+#### 5.3 Phase 3 - Write The Area Portal
 
 Create `docs/platform/packaging-distribution/README.md` with:
```

## claim_a4bb17a0f57f5fbbc44aa16ad9b09929

Source: docs/architect/packaging-distribution/rewrite-plan.md#unheaded-block-22

Target: docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#unheaded-block-24

Source identity digest: `531c45a837f33c500ea012354e3a9741683d684e4662a7f9c6f31b95498d37f5`

Target identity digest: `531c45a837f33c500ea012354e3a9741683d684e4662a7f9c6f31b95498d37f5`

Source shown SHA256: `531c45a837f33c500ea012354e3a9741683d684e4662a7f9c6f31b95498d37f5`

Target shown SHA256: `531c45a837f33c500ea012354e3a9741683d684e4662a7f9c6f31b95498d37f5`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_a4bb17a0f57f5fbbc44aa16ad9b09929 |
| sourceUnitDigest | 531c45a837f33c500ea012354e3a9741683d684e4662a7f9c6f31b95498d37f5 |
| targetOwner | docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md |
| targetAnchor | unheaded-block-24 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/rewrite-plan.md#unheaded-block-22, under "5.3 Phase 3 - Write The Area Portal", is retained at docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#unheaded-block-24. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. This remains dated source context, with no current runtime truth claim. |

### Source unit

```text
Create `docs/platform/packaging-distribution/README.md` with:
```

### Target unit

```text
Create `docs/platform/packaging-distribution/README.md` with:
```

### Unified diff

```diff
No text difference.
```

## claim_82531f9634a2abcecf3755c46241a735

Source: docs/architect/packaging-distribution/rewrite-plan.md#unheaded-block-23

Target: docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#unheaded-block-25

Source identity digest: `83f2e3ca7f014f335bbe8ce296d467ada5272b4ffad1eab2d099c0f82a88228f`

Target identity digest: `83f2e3ca7f014f335bbe8ce296d467ada5272b4ffad1eab2d099c0f82a88228f`

Source shown SHA256: `83f2e3ca7f014f335bbe8ce296d467ada5272b4ffad1eab2d099c0f82a88228f`

Target shown SHA256: `83f2e3ca7f014f335bbe8ce296d467ada5272b4ffad1eab2d099c0f82a88228f`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_82531f9634a2abcecf3755c46241a735 |
| sourceUnitDigest | 83f2e3ca7f014f335bbe8ce296d467ada5272b4ffad1eab2d099c0f82a88228f |
| targetOwner | docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md |
| targetAnchor | unheaded-block-25 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/rewrite-plan.md#unheaded-block-23, under "5.3 Phase 3 - Write The Area Portal", is retained at docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#unheaded-block-25. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. This remains dated source context, with no current runtime truth claim. |

### Source unit

```text
- who should read this area;
- what to read first by purpose;
- current shipped model versus target runtime model;
- owner boundaries;
- links to spec, architecture, contracts, verification, and history.
```

### Target unit

```text
- who should read this area;
- what to read first by purpose;
- current shipped model versus target runtime model;
- owner boundaries;
- links to spec, architecture, contracts, verification, and history.
```

### Unified diff

```diff
No text difference.
```

## claim_7e32df91fcd3785a1ceb440081624afc

Source: docs/architect/packaging-distribution/rewrite-plan.md#unheaded-block-24

Target: docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#unheaded-block-26

Source identity digest: `cd01bd965deb642b6112b879d80e2a74a804be25a1a25574be72493f7447b0ff`

Target identity digest: `cd01bd965deb642b6112b879d80e2a74a804be25a1a25574be72493f7447b0ff`

Source shown SHA256: `cd01bd965deb642b6112b879d80e2a74a804be25a1a25574be72493f7447b0ff`

Target shown SHA256: `cd01bd965deb642b6112b879d80e2a74a804be25a1a25574be72493f7447b0ff`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_7e32df91fcd3785a1ceb440081624afc |
| sourceUnitDigest | cd01bd965deb642b6112b879d80e2a74a804be25a1a25574be72493f7447b0ff |
| targetOwner | docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md |
| targetAnchor | unheaded-block-26 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/rewrite-plan.md#unheaded-block-24, under "5.3 Phase 3 - Write The Area Portal", is retained at docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#unheaded-block-26. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. This remains dated source context, with no current runtime truth claim. |

### Source unit

```text
The portal must be scannable for humans without requiring them to read governance first.
```

### Target unit

```text
The portal must be scannable for humans without requiring them to read governance first.
```

### Unified diff

```diff
No text difference.
```

## claim_63934a917c05036698f405bf42f5f9a7

Source: docs/architect/packaging-distribution/rewrite-plan.md#54-phase-4---rewrite-the-spec

Target: docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#54-phase-4---rewrite-the-spec

Source identity digest: `04c79b5b6cab80fedfcc81cbb8d6833c01d5597c85f546d9cc8c2f6986d67f1f`

Target identity digest: `bb67e1028dc8294657694d5e9b4d295c27e81cc1c98601589616c4ce7d8cfbba`

Source shown SHA256: `9d5330a851d6d4c0963360eb0772481a66d4a3a70ca794e701f8e7cf5da78be9`

Target shown SHA256: `d41160e6a892d98dcd09ba9783a615d5087e3b9bdb0b37f3edb6dfee3ea23e14`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_63934a917c05036698f405bf42f5f9a7 |
| sourceUnitDigest | 04c79b5b6cab80fedfcc81cbb8d6833c01d5597c85f546d9cc8c2f6986d67f1f |
| targetOwner | docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md |
| targetAnchor | 54-phase-4---rewrite-the-spec |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete heading from docs/architect/packaging-distribution/rewrite-plan.md#54-phase-4---rewrite-the-spec, under "5.4 Phase 4 - Rewrite The Spec", is retained at docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#54-phase-4---rewrite-the-spec. Only heading depth changes; the direct section payload follows the original source order. This remains dated source context, with no current runtime truth claim. |

### Source unit

```text
## 5.4 Phase 4 - Rewrite The Spec

Rewrite `docs/specs/distribution.md` into `docs/platform/packaging-distribution/spec.md`.

The new spec should be BA/state-oriented:

- user-visible install/setup/doctor behavior;
- supported install channels;
- global/project/dev checkout precedence;
- setup/doctor rules;
- package/plugin distribution facts;
- compatibility guarantees;
- known non-goals.

It should not carry long implementation essays. Those move to architecture, contracts, verification, or history.
```

### Target unit

```text
#### 5.4 Phase 4 - Rewrite The Spec

Rewrite `docs/specs/distribution.md` into `docs/platform/packaging-distribution/spec.md`.

The new spec should be BA/state-oriented:

- user-visible install/setup/doctor behavior;
- supported install channels;
- global/project/dev checkout precedence;
- setup/doctor rules;
- package/plugin distribution facts;
- compatibility guarantees;
- known non-goals.

It should not carry long implementation essays. Those move to architecture, contracts, verification, or history.
```

### Unified diff

```diff
--- "docs/architect/packaging-distribution/rewrite-plan.md#54-phase-4---rewrite-the-spec"
+++ "docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#54-phase-4---rewrite-the-spec"
@@ -1,4 +1,4 @@
-## 5.4 Phase 4 - Rewrite The Spec
+#### 5.4 Phase 4 - Rewrite The Spec
 
 Rewrite `docs/specs/distribution.md` into `docs/platform/packaging-distribution/spec.md`.
```

## claim_61951e61b419c33495016cac2396fc5b

Source: docs/architect/packaging-distribution/rewrite-plan.md#unheaded-block-25

Target: docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#unheaded-block-27

Source identity digest: `1e4540dbb89953120695c1a26b8213c31beddab00398c9f8b361f67beca9d3e2`

Target identity digest: `1e4540dbb89953120695c1a26b8213c31beddab00398c9f8b361f67beca9d3e2`

Source shown SHA256: `1e4540dbb89953120695c1a26b8213c31beddab00398c9f8b361f67beca9d3e2`

Target shown SHA256: `1e4540dbb89953120695c1a26b8213c31beddab00398c9f8b361f67beca9d3e2`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_61951e61b419c33495016cac2396fc5b |
| sourceUnitDigest | 1e4540dbb89953120695c1a26b8213c31beddab00398c9f8b361f67beca9d3e2 |
| targetOwner | docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md |
| targetAnchor | unheaded-block-27 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/rewrite-plan.md#unheaded-block-25, under "5.4 Phase 4 - Rewrite The Spec", is retained at docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#unheaded-block-27. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. This remains dated source context, with no current runtime truth claim. |

### Source unit

```text
Rewrite `docs/specs/distribution.md` into `docs/platform/packaging-distribution/spec.md`.
```

### Target unit

```text
Rewrite `docs/specs/distribution.md` into `docs/platform/packaging-distribution/spec.md`.
```

### Unified diff

```diff
No text difference.
```

## claim_e36c9e6e9215161abb92ca2337fa3fe2

Source: docs/architect/packaging-distribution/rewrite-plan.md#unheaded-block-26

Target: docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#unheaded-block-28

Source identity digest: `b37f31b0db29653aa3842349ebdd1d65a78303197a8ef114f45661c30927d530`

Target identity digest: `b37f31b0db29653aa3842349ebdd1d65a78303197a8ef114f45661c30927d530`

Source shown SHA256: `b37f31b0db29653aa3842349ebdd1d65a78303197a8ef114f45661c30927d530`

Target shown SHA256: `b37f31b0db29653aa3842349ebdd1d65a78303197a8ef114f45661c30927d530`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_e36c9e6e9215161abb92ca2337fa3fe2 |
| sourceUnitDigest | b37f31b0db29653aa3842349ebdd1d65a78303197a8ef114f45661c30927d530 |
| targetOwner | docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md |
| targetAnchor | unheaded-block-28 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/rewrite-plan.md#unheaded-block-26, under "5.4 Phase 4 - Rewrite The Spec", is retained at docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#unheaded-block-28. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. This remains dated source context, with no current runtime truth claim. |

### Source unit

```text
The new spec should be BA/state-oriented:
```

### Target unit

```text
The new spec should be BA/state-oriented:
```

### Unified diff

```diff
No text difference.
```

## claim_3540f7146aa866c1f9c71c65aca3e1ad

Source: docs/architect/packaging-distribution/rewrite-plan.md#unheaded-block-27

Target: docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#unheaded-block-29

Source identity digest: `aee7513a4f210acbdf91d2a1c069f4e38c1f3c22e4ecf82fd0511e407594f1b5`

Target identity digest: `aee7513a4f210acbdf91d2a1c069f4e38c1f3c22e4ecf82fd0511e407594f1b5`

Source shown SHA256: `aee7513a4f210acbdf91d2a1c069f4e38c1f3c22e4ecf82fd0511e407594f1b5`

Target shown SHA256: `aee7513a4f210acbdf91d2a1c069f4e38c1f3c22e4ecf82fd0511e407594f1b5`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_3540f7146aa866c1f9c71c65aca3e1ad |
| sourceUnitDigest | aee7513a4f210acbdf91d2a1c069f4e38c1f3c22e4ecf82fd0511e407594f1b5 |
| targetOwner | docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md |
| targetAnchor | unheaded-block-29 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/rewrite-plan.md#unheaded-block-27, under "5.4 Phase 4 - Rewrite The Spec", is retained at docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#unheaded-block-29. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. This remains dated source context, with no current runtime truth claim. |

### Source unit

```text
- user-visible install/setup/doctor behavior;
- supported install channels;
- global/project/dev checkout precedence;
- setup/doctor rules;
- package/plugin distribution facts;
- compatibility guarantees;
- known non-goals.
```

### Target unit

```text
- user-visible install/setup/doctor behavior;
- supported install channels;
- global/project/dev checkout precedence;
- setup/doctor rules;
- package/plugin distribution facts;
- compatibility guarantees;
- known non-goals.
```

### Unified diff

```diff
No text difference.
```

## claim_28561227790a581f54803e46466497c4

Source: docs/architect/packaging-distribution/rewrite-plan.md#unheaded-block-28

Target: docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#unheaded-block-30

Source identity digest: `075ac45afef31fb282894a4947fb12564efcd62321a161aeabc1859ebbffea5b`

Target identity digest: `075ac45afef31fb282894a4947fb12564efcd62321a161aeabc1859ebbffea5b`

Source shown SHA256: `075ac45afef31fb282894a4947fb12564efcd62321a161aeabc1859ebbffea5b`

Target shown SHA256: `075ac45afef31fb282894a4947fb12564efcd62321a161aeabc1859ebbffea5b`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_28561227790a581f54803e46466497c4 |
| sourceUnitDigest | 075ac45afef31fb282894a4947fb12564efcd62321a161aeabc1859ebbffea5b |
| targetOwner | docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md |
| targetAnchor | unheaded-block-30 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/rewrite-plan.md#unheaded-block-28, under "5.4 Phase 4 - Rewrite The Spec", is retained at docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#unheaded-block-30. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. This remains dated source context, with no current runtime truth claim. |

### Source unit

```text
It should not carry long implementation essays. Those move to architecture, contracts, verification, or history.
```

### Target unit

```text
It should not carry long implementation essays. Those move to architecture, contracts, verification, or history.
```

### Unified diff

```diff
No text difference.
```

## claim_2b1d1f638a3f25da7f1d9aec5253a374

Source: docs/architect/packaging-distribution/rewrite-plan.md#55-phase-5---promote-architecture

Target: docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#55-phase-5---promote-architecture

Source identity digest: `5250420533ab23aed13b83cf586273b7d658e9f9624dd1ff906b10c8b7598946`

Target identity digest: `2d99577bf038b4bac789411ce9b9f58424055d990f4965f1d03bb63ac2e52da0`

Source shown SHA256: `5a041f6e52d63d267f844662bb3a4e8e8037a49eb520cb5c55926f64df3fbb4b`

Target shown SHA256: `ec265f8a1b03cde71a8c06a9dbee7a55032a8ac69575ae45192c2ce91a3125eb`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_2b1d1f638a3f25da7f1d9aec5253a374 |
| sourceUnitDigest | 5250420533ab23aed13b83cf586273b7d658e9f9624dd1ff906b10c8b7598946 |
| targetOwner | docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md |
| targetAnchor | 55-phase-5---promote-architecture |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete heading from docs/architect/packaging-distribution/rewrite-plan.md#55-phase-5---promote-architecture, under "5.5 Phase 5 - Promote Architecture", is retained at docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#55-phase-5---promote-architecture. Only heading depth changes; the direct section payload follows the original source order. This remains dated source context, with no current runtime truth claim. |

### Source unit

```text
## 5.5 Phase 5 - Promote Architecture

Promote the architecture package into smaller docs:

- `runtime-identity-and-activation.md`: identity, roots, activation, lifecycle;
- `fgctl-and-local-fgos.md`: ownership split between global bootstrap/control and local project runtime;
- `future-constraints.md`: shared gateway/web constraints, explicitly future-only.

Each architecture doc must carry `Implementation Alignment`.
```

### Target unit

```text
#### 5.5 Phase 5 - Promote Architecture

Promote the architecture package into smaller docs:

- `runtime-identity-and-activation.md`: identity, roots, activation, lifecycle;
- `fgctl-and-local-fgos.md`: ownership split between global bootstrap/control and local project runtime;
- `future-constraints.md`: shared gateway/web constraints, explicitly future-only.

Each architecture doc must carry `Implementation Alignment`.
```

### Unified diff

```diff
--- "docs/architect/packaging-distribution/rewrite-plan.md#55-phase-5---promote-architecture"
+++ "docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#55-phase-5---promote-architecture"
@@ -1,4 +1,4 @@
-## 5.5 Phase 5 - Promote Architecture
+#### 5.5 Phase 5 - Promote Architecture
 
 Promote the architecture package into smaller docs:
```

## claim_6ca3299025b2c1ec4b39a8c181b383d3

Source: docs/architect/packaging-distribution/rewrite-plan.md#unheaded-block-29

Target: docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#unheaded-block-31

Source identity digest: `aa4ff767a0862ca969055644729f115d8e2cf480a002614f0a34fdc9186bb1b3`

Target identity digest: `aa4ff767a0862ca969055644729f115d8e2cf480a002614f0a34fdc9186bb1b3`

Source shown SHA256: `aa4ff767a0862ca969055644729f115d8e2cf480a002614f0a34fdc9186bb1b3`

Target shown SHA256: `aa4ff767a0862ca969055644729f115d8e2cf480a002614f0a34fdc9186bb1b3`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_6ca3299025b2c1ec4b39a8c181b383d3 |
| sourceUnitDigest | aa4ff767a0862ca969055644729f115d8e2cf480a002614f0a34fdc9186bb1b3 |
| targetOwner | docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md |
| targetAnchor | unheaded-block-31 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/rewrite-plan.md#unheaded-block-29, under "5.5 Phase 5 - Promote Architecture", is retained at docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#unheaded-block-31. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. This remains dated source context, with no current runtime truth claim. |

### Source unit

```text
Promote the architecture package into smaller docs:
```

### Target unit

```text
Promote the architecture package into smaller docs:
```

### Unified diff

```diff
No text difference.
```

## claim_56859340e32ce85be9cac1710b30cef8

Source: docs/architect/packaging-distribution/rewrite-plan.md#unheaded-block-30

Target: docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#unheaded-block-32

Source identity digest: `f429c1e9d020c4ff948c5b0d2c5f4849402d34f17c27b8c153addec0c587a983`

Target identity digest: `f429c1e9d020c4ff948c5b0d2c5f4849402d34f17c27b8c153addec0c587a983`

Source shown SHA256: `f429c1e9d020c4ff948c5b0d2c5f4849402d34f17c27b8c153addec0c587a983`

Target shown SHA256: `f429c1e9d020c4ff948c5b0d2c5f4849402d34f17c27b8c153addec0c587a983`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_56859340e32ce85be9cac1710b30cef8 |
| sourceUnitDigest | f429c1e9d020c4ff948c5b0d2c5f4849402d34f17c27b8c153addec0c587a983 |
| targetOwner | docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md |
| targetAnchor | unheaded-block-32 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/rewrite-plan.md#unheaded-block-30, under "5.5 Phase 5 - Promote Architecture", is retained at docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#unheaded-block-32. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. This remains dated source context, with no current runtime truth claim. |

### Source unit

```text
- `runtime-identity-and-activation.md`: identity, roots, activation, lifecycle;
- `fgctl-and-local-fgos.md`: ownership split between global bootstrap/control and local project runtime;
- `future-constraints.md`: shared gateway/web constraints, explicitly future-only.
```

### Target unit

```text
- `runtime-identity-and-activation.md`: identity, roots, activation, lifecycle;
- `fgctl-and-local-fgos.md`: ownership split between global bootstrap/control and local project runtime;
- `future-constraints.md`: shared gateway/web constraints, explicitly future-only.
```

### Unified diff

```diff
No text difference.
```

## claim_4b688f7d2f46862d1542d3c8d75f51a4

Source: docs/architect/packaging-distribution/rewrite-plan.md#unheaded-block-31

Target: docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#unheaded-block-33

Source identity digest: `d30267a4aa41145678f9fa1a34b1906fac5d297ac37e4dcd1d2f87e446d8a959`

Target identity digest: `d30267a4aa41145678f9fa1a34b1906fac5d297ac37e4dcd1d2f87e446d8a959`

Source shown SHA256: `d30267a4aa41145678f9fa1a34b1906fac5d297ac37e4dcd1d2f87e446d8a959`

Target shown SHA256: `d30267a4aa41145678f9fa1a34b1906fac5d297ac37e4dcd1d2f87e446d8a959`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_4b688f7d2f46862d1542d3c8d75f51a4 |
| sourceUnitDigest | d30267a4aa41145678f9fa1a34b1906fac5d297ac37e4dcd1d2f87e446d8a959 |
| targetOwner | docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md |
| targetAnchor | unheaded-block-33 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/rewrite-plan.md#unheaded-block-31, under "5.5 Phase 5 - Promote Architecture", is retained at docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#unheaded-block-33. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. This remains dated source context, with no current runtime truth claim. |

### Source unit

```text
Each architecture doc must carry `Implementation Alignment`.
```

### Target unit

```text
Each architecture doc must carry `Implementation Alignment`.
```

### Unified diff

```diff
No text difference.
```

## claim_db296bf5efcdc48dac0f95093431713c

Source: docs/architect/packaging-distribution/rewrite-plan.md#56-phase-6---extract-contracts

Target: docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#56-phase-6---extract-contracts

Source identity digest: `2335f09d25316202656b61b89ea69e12503632915083a2de3f454faccd5b5347`

Target identity digest: `57ecf72e125aa99e4b7ebc7fbc8a1ff72f0d50b8850263ae20e2caa593d03362`

Source shown SHA256: `4f50675bcbee5e0b5733f70160efc38650a79a918c6ec31f06b3172c6d65d7b8`

Target shown SHA256: `9d97457a58f75d7d9c41428b82139590bb34714bcbe6286132097542c30db9bb`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_db296bf5efcdc48dac0f95093431713c |
| sourceUnitDigest | 2335f09d25316202656b61b89ea69e12503632915083a2de3f454faccd5b5347 |
| targetOwner | docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md |
| targetAnchor | 56-phase-6---extract-contracts |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete heading from docs/architect/packaging-distribution/rewrite-plan.md#56-phase-6---extract-contracts, under "5.6 Phase 6 - Extract Contracts", is retained at docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#56-phase-6---extract-contracts. Only heading depth changes; the direct section payload follows the original source order. This remains dated source context, with no current runtime truth claim. |

### Source unit

```text
## 5.6 Phase 6 - Extract Contracts

Move exact schemas and boundaries into contracts:

- `ReleaseManifest`;
- `ActivationRecord`;
- `.fgos/distribution.json` pin;
- projection ledger;
- setup/doctor registry;
- plugin/dev-skill packaging contract if it remains too large for `setup-doctor-registry.md`.

Contracts should link directly to implementation and tests.
```

### Target unit

```text
#### 5.6 Phase 6 - Extract Contracts

Move exact schemas and boundaries into contracts:

- `ReleaseManifest`;
- `ActivationRecord`;
- `.fgos/distribution.json` pin;
- projection ledger;
- setup/doctor registry;
- plugin/dev-skill packaging contract if it remains too large for `setup-doctor-registry.md`.

Contracts should link directly to implementation and tests.
```

### Unified diff

```diff
--- "docs/architect/packaging-distribution/rewrite-plan.md#56-phase-6---extract-contracts"
+++ "docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#56-phase-6---extract-contracts"
@@ -1,4 +1,4 @@
-## 5.6 Phase 6 - Extract Contracts
+#### 5.6 Phase 6 - Extract Contracts
 
 Move exact schemas and boundaries into contracts:
```

## claim_4f5c94dd20c7026eee33adcf9d2e032e

Source: docs/architect/packaging-distribution/rewrite-plan.md#unheaded-block-32

Target: docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#unheaded-block-34

Source identity digest: `92181043e64667e87788c3fe7e8336fab29bc6682afdb1e7d8bf2cb49d9b2003`

Target identity digest: `92181043e64667e87788c3fe7e8336fab29bc6682afdb1e7d8bf2cb49d9b2003`

Source shown SHA256: `92181043e64667e87788c3fe7e8336fab29bc6682afdb1e7d8bf2cb49d9b2003`

Target shown SHA256: `92181043e64667e87788c3fe7e8336fab29bc6682afdb1e7d8bf2cb49d9b2003`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_4f5c94dd20c7026eee33adcf9d2e032e |
| sourceUnitDigest | 92181043e64667e87788c3fe7e8336fab29bc6682afdb1e7d8bf2cb49d9b2003 |
| targetOwner | docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md |
| targetAnchor | unheaded-block-34 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/rewrite-plan.md#unheaded-block-32, under "5.6 Phase 6 - Extract Contracts", is retained at docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#unheaded-block-34. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. This remains dated source context, with no current runtime truth claim. |

### Source unit

```text
Move exact schemas and boundaries into contracts:
```

### Target unit

```text
Move exact schemas and boundaries into contracts:
```

### Unified diff

```diff
No text difference.
```

## claim_635aaf1ea472ec0c1e6aa32e40f8b09f

Source: docs/architect/packaging-distribution/rewrite-plan.md#unheaded-block-33

Target: docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#unheaded-block-35

Source identity digest: `fc4ccd3f4e017a12eaf8f9ed8e71b6cd183c8284875bc4aa33a158f4f9c7f882`

Target identity digest: `fc4ccd3f4e017a12eaf8f9ed8e71b6cd183c8284875bc4aa33a158f4f9c7f882`

Source shown SHA256: `fc4ccd3f4e017a12eaf8f9ed8e71b6cd183c8284875bc4aa33a158f4f9c7f882`

Target shown SHA256: `fc4ccd3f4e017a12eaf8f9ed8e71b6cd183c8284875bc4aa33a158f4f9c7f882`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_635aaf1ea472ec0c1e6aa32e40f8b09f |
| sourceUnitDigest | fc4ccd3f4e017a12eaf8f9ed8e71b6cd183c8284875bc4aa33a158f4f9c7f882 |
| targetOwner | docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md |
| targetAnchor | unheaded-block-35 |
| claimKind | contract |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/rewrite-plan.md#unheaded-block-33, under "5.6 Phase 6 - Extract Contracts", is retained at docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#unheaded-block-35. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. This remains dated source context, with no current runtime truth claim. |

### Source unit

```text
- `ReleaseManifest`;
- `ActivationRecord`;
- `.fgos/distribution.json` pin;
- projection ledger;
- setup/doctor registry;
- plugin/dev-skill packaging contract if it remains too large for `setup-doctor-registry.md`.
```

### Target unit

```text
- `ReleaseManifest`;
- `ActivationRecord`;
- `.fgos/distribution.json` pin;
- projection ledger;
- setup/doctor registry;
- plugin/dev-skill packaging contract if it remains too large for `setup-doctor-registry.md`.
```

### Unified diff

```diff
No text difference.
```

## claim_0a677ec340f984b7a7e75d8c7137c470

Source: docs/architect/packaging-distribution/rewrite-plan.md#unheaded-block-34

Target: docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#unheaded-block-36

Source identity digest: `91f24073416222a5e1e187e7b7b79f53dac7ddb3f3833e3d3e4c0e1391c1660d`

Target identity digest: `91f24073416222a5e1e187e7b7b79f53dac7ddb3f3833e3d3e4c0e1391c1660d`

Source shown SHA256: `91f24073416222a5e1e187e7b7b79f53dac7ddb3f3833e3d3e4c0e1391c1660d`

Target shown SHA256: `91f24073416222a5e1e187e7b7b79f53dac7ddb3f3833e3d3e4c0e1391c1660d`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_0a677ec340f984b7a7e75d8c7137c470 |
| sourceUnitDigest | 91f24073416222a5e1e187e7b7b79f53dac7ddb3f3833e3d3e4c0e1391c1660d |
| targetOwner | docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md |
| targetAnchor | unheaded-block-36 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/rewrite-plan.md#unheaded-block-34, under "5.6 Phase 6 - Extract Contracts", is retained at docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#unheaded-block-36. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. This remains dated source context, with no current runtime truth claim. |

### Source unit

```text
Contracts should link directly to implementation and tests.
```

### Target unit

```text
Contracts should link directly to implementation and tests.
```

### Unified diff

```diff
No text difference.
```

## claim_13bc4b4a4d533217a63de272c54d0cd8

Source: docs/architect/packaging-distribution/rewrite-plan.md#57-phase-7---build-verification-view

Target: docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#57-phase-7---build-verification-view

Source identity digest: `3053f69602eb4494f8a6408fc90ceedc9a580f50e6111a5379e4825535334ca0`

Target identity digest: `0552ede78512241565ad3042fad8798a1e7d16c5e1ebecff888bdd4a85c6cfe1`

Source shown SHA256: `9f5c8690182650316768b4df3ab849cc64db9aacc5d86d9d98b4f85bdb790d82`

Target shown SHA256: `c0228d971e5c008cdebee23bc5a42a049cb69e1ebb3ecee3a01680bc545ea43e`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_13bc4b4a4d533217a63de272c54d0cd8 |
| sourceUnitDigest | 3053f69602eb4494f8a6408fc90ceedc9a580f50e6111a5379e4825535334ca0 |
| targetOwner | docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md |
| targetAnchor | 57-phase-7---build-verification-view |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete heading from docs/architect/packaging-distribution/rewrite-plan.md#57-phase-7---build-verification-view, under "5.7 Phase 7 - Build Verification View", is retained at docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#57-phase-7---build-verification-view. Only heading depth changes; the direct section payload follows the original source order. This remains dated source context, with no current runtime truth claim. |

### Source unit

```text
## 5.7 Phase 7 - Build Verification View

Create `verification/implementation-alignment.md` to track:

- design claim;
- implementation status;
- code/test evidence;
- gap;
- next validation command.

This is the main answer to “mức độ triển khai so với thiết kế”.
```

### Target unit

```text
#### 5.7 Phase 7 - Build Verification View

Create `verification/implementation-alignment.md` to track:

- design claim;
- implementation status;
- code/test evidence;
- gap;
- next validation command.

This is the main answer to “mức độ triển khai so với thiết kế”.
```

### Unified diff

```diff
--- "docs/architect/packaging-distribution/rewrite-plan.md#57-phase-7---build-verification-view"
+++ "docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#57-phase-7---build-verification-view"
@@ -1,4 +1,4 @@
-## 5.7 Phase 7 - Build Verification View
+#### 5.7 Phase 7 - Build Verification View
 
 Create `verification/implementation-alignment.md` to track:
```

## claim_ebe3db9ec14c6de6f7dab9d849feae46

Source: docs/architect/packaging-distribution/rewrite-plan.md#unheaded-block-35

Target: docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#unheaded-block-37

Source identity digest: `766f48a27e71ce60f59dd3e1ef7fd4173955f62e4542acd4cfa79437d9fa1ae4`

Target identity digest: `766f48a27e71ce60f59dd3e1ef7fd4173955f62e4542acd4cfa79437d9fa1ae4`

Source shown SHA256: `766f48a27e71ce60f59dd3e1ef7fd4173955f62e4542acd4cfa79437d9fa1ae4`

Target shown SHA256: `766f48a27e71ce60f59dd3e1ef7fd4173955f62e4542acd4cfa79437d9fa1ae4`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_ebe3db9ec14c6de6f7dab9d849feae46 |
| sourceUnitDigest | 766f48a27e71ce60f59dd3e1ef7fd4173955f62e4542acd4cfa79437d9fa1ae4 |
| targetOwner | docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md |
| targetAnchor | unheaded-block-37 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/rewrite-plan.md#unheaded-block-35, under "5.7 Phase 7 - Build Verification View", is retained at docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#unheaded-block-37. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. This remains dated source context, with no current runtime truth claim. |

### Source unit

```text
Create `verification/implementation-alignment.md` to track:
```

### Target unit

```text
Create `verification/implementation-alignment.md` to track:
```

### Unified diff

```diff
No text difference.
```

## claim_bbe56c35676706cc06e9abd8774393e2

Source: docs/architect/packaging-distribution/rewrite-plan.md#unheaded-block-36

Target: docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#unheaded-block-38

Source identity digest: `13321794c8cd4047223cc93fe2455f5b767010267c31deb5ce88ca33d85b370f`

Target identity digest: `13321794c8cd4047223cc93fe2455f5b767010267c31deb5ce88ca33d85b370f`

Source shown SHA256: `13321794c8cd4047223cc93fe2455f5b767010267c31deb5ce88ca33d85b370f`

Target shown SHA256: `13321794c8cd4047223cc93fe2455f5b767010267c31deb5ce88ca33d85b370f`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_bbe56c35676706cc06e9abd8774393e2 |
| sourceUnitDigest | 13321794c8cd4047223cc93fe2455f5b767010267c31deb5ce88ca33d85b370f |
| targetOwner | docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md |
| targetAnchor | unheaded-block-38 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/rewrite-plan.md#unheaded-block-36, under "5.7 Phase 7 - Build Verification View", is retained at docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#unheaded-block-38. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. This remains dated source context, with no current runtime truth claim. |

### Source unit

```text
- design claim;
- implementation status;
- code/test evidence;
- gap;
- next validation command.
```

### Target unit

```text
- design claim;
- implementation status;
- code/test evidence;
- gap;
- next validation command.
```

### Unified diff

```diff
No text difference.
```

## claim_fdef24cd5487a3e14d537eb3e4f9dbee

Source: docs/architect/packaging-distribution/rewrite-plan.md#unheaded-block-37

Target: docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#unheaded-block-39

Source identity digest: `b978cdd9c4befe1e7d870b94fc7f55e0f4080ba7b0a0d39cb7318a41f99f9a21`

Target identity digest: `b978cdd9c4befe1e7d870b94fc7f55e0f4080ba7b0a0d39cb7318a41f99f9a21`

Source shown SHA256: `b978cdd9c4befe1e7d870b94fc7f55e0f4080ba7b0a0d39cb7318a41f99f9a21`

Target shown SHA256: `b978cdd9c4befe1e7d870b94fc7f55e0f4080ba7b0a0d39cb7318a41f99f9a21`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_fdef24cd5487a3e14d537eb3e4f9dbee |
| sourceUnitDigest | b978cdd9c4befe1e7d870b94fc7f55e0f4080ba7b0a0d39cb7318a41f99f9a21 |
| targetOwner | docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md |
| targetAnchor | unheaded-block-39 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/rewrite-plan.md#unheaded-block-37, under "5.7 Phase 7 - Build Verification View", is retained at docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#unheaded-block-39. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. This remains dated source context, with no current runtime truth claim. |

### Source unit

```text
This is the main answer to “mức độ triển khai so với thiết kế”.
```

### Target unit

```text
This is the main answer to “mức độ triển khai so với thiết kế”.
```

### Unified diff

```diff
No text difference.
```

## claim_ebecd97d292c1fd5df89f82ce12f0a8c

Source: docs/architect/packaging-distribution/rewrite-plan.md#58-phase-8---redirect-and-retire-legacy-docs

Target: docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#58-phase-8---redirect-and-retire-legacy-docs

Source identity digest: `1579fd12289c6f1d9b6e6ded10c03c606352abf5eea72821809666bc4cda2ccb`

Target identity digest: `873a911f9a1795dd7aab6fc036baf8b6c4f5d1365f40b1f07c51c70ac25117af`

Source shown SHA256: `ad7b428d02e905081e82e8befc618e574b4980f16e1e77d2ef48c5e5440ad27f`

Target shown SHA256: `707682960692bd428660228b26df756ba07643e50dc8fd070875318343944634`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_ebecd97d292c1fd5df89f82ce12f0a8c |
| sourceUnitDigest | 1579fd12289c6f1d9b6e6ded10c03c606352abf5eea72821809666bc4cda2ccb |
| targetOwner | docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md |
| targetAnchor | 58-phase-8---redirect-and-retire-legacy-docs |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete heading from docs/architect/packaging-distribution/rewrite-plan.md#58-phase-8---redirect-and-retire-legacy-docs, under "5.8 Phase 8 - Redirect And Retire Legacy Docs", is retained at docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#58-phase-8---redirect-and-retire-legacy-docs. Only heading depth changes; the direct section payload follows the original source order. This remains dated source context, with no current runtime truth claim. |

### Source unit

```text
## 5.8 Phase 8 - Redirect And Retire Legacy Docs

Only after the new docs are reviewed:

- update `docs/reading-map.md` and legacy `docs/specs/reading-map.md`;
- add redirect stubs or status notes to old paths;
- move historical content into `history/`;
- delete temporary discussion/rewrite notes when their decisions are promoted.
```

### Target unit

```text
#### 5.8 Phase 8 - Redirect And Retire Legacy Docs

Only after the new docs are reviewed:

- update `docs/reading-map.md` and legacy `docs/specs/reading-map.md`;
- add redirect stubs or status notes to old paths;
- move historical content into `history/`;
- delete temporary discussion/rewrite notes when their decisions are promoted.
```

### Unified diff

```diff
--- "docs/architect/packaging-distribution/rewrite-plan.md#58-phase-8---redirect-and-retire-legacy-docs"
+++ "docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#58-phase-8---redirect-and-retire-legacy-docs"
@@ -1,4 +1,4 @@
-## 5.8 Phase 8 - Redirect And Retire Legacy Docs
+#### 5.8 Phase 8 - Redirect And Retire Legacy Docs
 
 Only after the new docs are reviewed:
```

## claim_876987f1fb75a47edcb4d0ad20d8fbc9

Source: docs/architect/packaging-distribution/rewrite-plan.md#unheaded-block-38

Target: docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#unheaded-block-40

Source identity digest: `3657e885e447f5252b8808065dfde6de2ed73f21bbfc38552b007468652dfaad`

Target identity digest: `3657e885e447f5252b8808065dfde6de2ed73f21bbfc38552b007468652dfaad`

Source shown SHA256: `3657e885e447f5252b8808065dfde6de2ed73f21bbfc38552b007468652dfaad`

Target shown SHA256: `3657e885e447f5252b8808065dfde6de2ed73f21bbfc38552b007468652dfaad`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_876987f1fb75a47edcb4d0ad20d8fbc9 |
| sourceUnitDigest | 3657e885e447f5252b8808065dfde6de2ed73f21bbfc38552b007468652dfaad |
| targetOwner | docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md |
| targetAnchor | unheaded-block-40 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/rewrite-plan.md#unheaded-block-38, under "5.8 Phase 8 - Redirect And Retire Legacy Docs", is retained at docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#unheaded-block-40. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. This remains dated source context, with no current runtime truth claim. |

### Source unit

```text
Only after the new docs are reviewed:
```

### Target unit

```text
Only after the new docs are reviewed:
```

### Unified diff

```diff
No text difference.
```

## claim_fa209d9a17c117bf49b23a089f8872e6

Source: docs/architect/packaging-distribution/rewrite-plan.md#unheaded-block-39

Target: docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#unheaded-block-41

Source identity digest: `23773401279d1c1e710706421a61ed0c83c027e74fb5708f3ed21b94e1cb16e0`

Target identity digest: `23773401279d1c1e710706421a61ed0c83c027e74fb5708f3ed21b94e1cb16e0`

Source shown SHA256: `23773401279d1c1e710706421a61ed0c83c027e74fb5708f3ed21b94e1cb16e0`

Target shown SHA256: `23773401279d1c1e710706421a61ed0c83c027e74fb5708f3ed21b94e1cb16e0`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_fa209d9a17c117bf49b23a089f8872e6 |
| sourceUnitDigest | 23773401279d1c1e710706421a61ed0c83c027e74fb5708f3ed21b94e1cb16e0 |
| targetOwner | docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md |
| targetAnchor | unheaded-block-41 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/rewrite-plan.md#unheaded-block-39, under "5.8 Phase 8 - Redirect And Retire Legacy Docs", is retained at docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#unheaded-block-41. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. This remains dated source context, with no current runtime truth claim. |

### Source unit

```text
- update `docs/reading-map.md` and legacy `docs/specs/reading-map.md`;
- add redirect stubs or status notes to old paths;
- move historical content into `history/`;
- delete temporary discussion/rewrite notes when their decisions are promoted.
```

### Target unit

```text
- update `docs/reading-map.md` and legacy `docs/specs/reading-map.md`;
- add redirect stubs or status notes to old paths;
- move historical content into `history/`;
- delete temporary discussion/rewrite notes when their decisions are promoted.
```

### Unified diff

```diff
No text difference.
```

## claim_66e562a123e15dd39fd23c667f584927

Source: docs/architect/packaging-distribution/rewrite-plan.md#6-recommended-document-structure

Target: docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#6-recommended-document-structure

Source identity digest: `a20f2d48c7c24cb7686ce5f4369240852327ca8d48eec80ffcc7d2db4e9e59fa`

Target identity digest: `da9e38e8a44023c71a1ba01e75749dee1c69bfa2a0a8353843f6007c827dec6c`

Source shown SHA256: `1217712e263d5e58b692a3e8690d204d76e2d31db34bcebc35d837b5e075210b`

Target shown SHA256: `ef7f8c971b4ed65f3168658237b9509efce513ff5be0f80cebe712ec34eb7924`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_66e562a123e15dd39fd23c667f584927 |
| sourceUnitDigest | a20f2d48c7c24cb7686ce5f4369240852327ca8d48eec80ffcc7d2db4e9e59fa |
| targetOwner | docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md |
| targetAnchor | 6-recommended-document-structure |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete heading from docs/architect/packaging-distribution/rewrite-plan.md#6-recommended-document-structure, under "6. Recommended Document Structure", is retained at docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#6-recommended-document-structure. Only heading depth changes; the direct section payload follows the original source order. This remains dated source context, with no current runtime truth claim. |

### Source unit

````text
# 6. Recommended Document Structure

For each maintained packaging-distribution document:

```txt
Title:
Audience:
Purpose:
Design status:
Implementation status:
Canonical:
Owner:
Last reviewed:
```

Then use this section order:

1. Purpose And Audience
2. Current State
3. Target Design
4. Ownership And Boundaries
5. Contracts
6. Implementation Alignment
7. Verification
8. Open Questions
9. Related Documents

Small docs can omit empty sections, but must keep metadata, numbered headers, and related links.
````

### Target unit

````text
### 6. Recommended Document Structure

For each maintained packaging-distribution document:

```txt
Title:
Audience:
Purpose:
Design status:
Implementation status:
Canonical:
Owner:
Last reviewed:
```

Then use this section order:

1. Purpose And Audience
2. Current State
3. Target Design
4. Ownership And Boundaries
5. Contracts
6. Implementation Alignment
7. Verification
8. Open Questions
9. Related Documents

Small docs can omit empty sections, but must keep metadata, numbered headers, and related links.
````

### Unified diff

```diff
--- "docs/architect/packaging-distribution/rewrite-plan.md#6-recommended-document-structure"
+++ "docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#6-recommended-document-structure"
@@ -1,4 +1,4 @@
-# 6. Recommended Document Structure
+### 6. Recommended Document Structure
 
 For each maintained packaging-distribution document:
```

## claim_075a4fba8b091b1849c20ca68b73161d

Source: docs/architect/packaging-distribution/rewrite-plan.md#unheaded-block-40

Target: docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#unheaded-block-42

Source identity digest: `f958137e48677069bf369001b8cca4bf14be9f17847aa947a9db25d9332dbd7f`

Target identity digest: `f958137e48677069bf369001b8cca4bf14be9f17847aa947a9db25d9332dbd7f`

Source shown SHA256: `f958137e48677069bf369001b8cca4bf14be9f17847aa947a9db25d9332dbd7f`

Target shown SHA256: `f958137e48677069bf369001b8cca4bf14be9f17847aa947a9db25d9332dbd7f`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_075a4fba8b091b1849c20ca68b73161d |
| sourceUnitDigest | f958137e48677069bf369001b8cca4bf14be9f17847aa947a9db25d9332dbd7f |
| targetOwner | docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md |
| targetAnchor | unheaded-block-42 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/rewrite-plan.md#unheaded-block-40, under "6. Recommended Document Structure", is retained at docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#unheaded-block-42. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. This remains dated source context, with no current runtime truth claim. |

### Source unit

```text
For each maintained packaging-distribution document:
```

### Target unit

```text
For each maintained packaging-distribution document:
```

### Unified diff

```diff
No text difference.
```

## claim_cffe3c3a7c729e5082259d64b836163f

Source: docs/architect/packaging-distribution/rewrite-plan.md#unheaded-block-41

Target: docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#unheaded-block-43

Source identity digest: `66ec67c3a7172d50f8f9ab8b0f5bc47823a1f2c41f6c9fc882160110529f5ca3`

Target identity digest: `66ec67c3a7172d50f8f9ab8b0f5bc47823a1f2c41f6c9fc882160110529f5ca3`

Source shown SHA256: `66ec67c3a7172d50f8f9ab8b0f5bc47823a1f2c41f6c9fc882160110529f5ca3`

Target shown SHA256: `66ec67c3a7172d50f8f9ab8b0f5bc47823a1f2c41f6c9fc882160110529f5ca3`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_cffe3c3a7c729e5082259d64b836163f |
| sourceUnitDigest | 66ec67c3a7172d50f8f9ab8b0f5bc47823a1f2c41f6c9fc882160110529f5ca3 |
| targetOwner | docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md |
| targetAnchor | unheaded-block-43 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/rewrite-plan.md#unheaded-block-41, under "6. Recommended Document Structure", is retained at docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#unheaded-block-43. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. This remains dated source context, with no current runtime truth claim. |

### Source unit

````text
```txt
Title:
Audience:
Purpose:
Design status:
Implementation status:
Canonical:
Owner:
Last reviewed:
```
````

### Target unit

````text
```txt
Title:
Audience:
Purpose:
Design status:
Implementation status:
Canonical:
Owner:
Last reviewed:
```
````

### Unified diff

```diff
No text difference.
```

## claim_83e0514232a558d384664270171578c3

Source: docs/architect/packaging-distribution/rewrite-plan.md#unheaded-block-42

Target: docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#unheaded-block-44

Source identity digest: `25a4cd79fa8b1db740f8f07e3a64094d25812a91187fcbf00367b8ee51ec114c`

Target identity digest: `25a4cd79fa8b1db740f8f07e3a64094d25812a91187fcbf00367b8ee51ec114c`

Source shown SHA256: `25a4cd79fa8b1db740f8f07e3a64094d25812a91187fcbf00367b8ee51ec114c`

Target shown SHA256: `25a4cd79fa8b1db740f8f07e3a64094d25812a91187fcbf00367b8ee51ec114c`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_83e0514232a558d384664270171578c3 |
| sourceUnitDigest | 25a4cd79fa8b1db740f8f07e3a64094d25812a91187fcbf00367b8ee51ec114c |
| targetOwner | docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md |
| targetAnchor | unheaded-block-44 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/rewrite-plan.md#unheaded-block-42, under "6. Recommended Document Structure", is retained at docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#unheaded-block-44. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. This remains dated source context, with no current runtime truth claim. |

### Source unit

```text
Then use this section order:
```

### Target unit

```text
Then use this section order:
```

### Unified diff

```diff
No text difference.
```

## claim_169cb10cb1ae6e6645a948300a3f4063

Source: docs/architect/packaging-distribution/rewrite-plan.md#unheaded-block-43

Target: docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#unheaded-block-45

Source identity digest: `19ac2a31fd25fadaad80e97ef8b3ec866adf9fe81b3009fc292f9fc115098f2a`

Target identity digest: `19ac2a31fd25fadaad80e97ef8b3ec866adf9fe81b3009fc292f9fc115098f2a`

Source shown SHA256: `19ac2a31fd25fadaad80e97ef8b3ec866adf9fe81b3009fc292f9fc115098f2a`

Target shown SHA256: `19ac2a31fd25fadaad80e97ef8b3ec866adf9fe81b3009fc292f9fc115098f2a`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_169cb10cb1ae6e6645a948300a3f4063 |
| sourceUnitDigest | 19ac2a31fd25fadaad80e97ef8b3ec866adf9fe81b3009fc292f9fc115098f2a |
| targetOwner | docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md |
| targetAnchor | unheaded-block-45 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/rewrite-plan.md#unheaded-block-43, under "6. Recommended Document Structure", is retained at docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#unheaded-block-45. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. This remains dated source context, with no current runtime truth claim. |

### Source unit

```text
1. Purpose And Audience
2. Current State
3. Target Design
4. Ownership And Boundaries
5. Contracts
6. Implementation Alignment
7. Verification
8. Open Questions
9. Related Documents
```

### Target unit

```text
1. Purpose And Audience
2. Current State
3. Target Design
4. Ownership And Boundaries
5. Contracts
6. Implementation Alignment
7. Verification
8. Open Questions
9. Related Documents
```

### Unified diff

```diff
No text difference.
```

## claim_60a428b6d8acf5e3682c0f3f0974f040

Source: docs/architect/packaging-distribution/rewrite-plan.md#unheaded-block-44

Target: docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#unheaded-block-46

Source identity digest: `0342c89d0c33a0bdc3cc5f910d59ef8682e42a704c16bc2e72e47111fa068d5c`

Target identity digest: `0342c89d0c33a0bdc3cc5f910d59ef8682e42a704c16bc2e72e47111fa068d5c`

Source shown SHA256: `0342c89d0c33a0bdc3cc5f910d59ef8682e42a704c16bc2e72e47111fa068d5c`

Target shown SHA256: `0342c89d0c33a0bdc3cc5f910d59ef8682e42a704c16bc2e72e47111fa068d5c`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_60a428b6d8acf5e3682c0f3f0974f040 |
| sourceUnitDigest | 0342c89d0c33a0bdc3cc5f910d59ef8682e42a704c16bc2e72e47111fa068d5c |
| targetOwner | docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md |
| targetAnchor | unheaded-block-46 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/rewrite-plan.md#unheaded-block-44, under "6. Recommended Document Structure", is retained at docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#unheaded-block-46. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. This remains dated source context, with no current runtime truth claim. |

### Source unit

```text
Small docs can omit empty sections, but must keep metadata, numbered headers, and related links.
```

### Target unit

```text
Small docs can omit empty sections, but must keep metadata, numbered headers, and related links.
```

### Unified diff

```diff
No text difference.
```

## claim_a9a6c2182dff9ff356bc5800987dc6e7

Source: docs/architect/packaging-distribution/rewrite-plan.md#7-open-decisions

Target: docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#7-open-decisions

Source identity digest: `b9982e3a2ce1532775a57eca8fd35a42e3674d85e5c30bdc22778932d777d16c`

Target identity digest: `f630b4cc6e77113871f1e05ab85ebb3933363ae201baefe3ea11bbdd7fc01c1a`

Source shown SHA256: `ebff6104ddb4e1d069c6080624f3f09afce9fd2f631cf97e5c00087fbc152278`

Target shown SHA256: `ff7b81e6eaaa1fd43826b177acf7f431570a31d7830e43fa4d799a0b2fabd168`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_a9a6c2182dff9ff356bc5800987dc6e7 |
| sourceUnitDigest | b9982e3a2ce1532775a57eca8fd35a42e3674d85e5c30bdc22778932d777d16c |
| targetOwner | docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md |
| targetAnchor | 7-open-decisions |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete heading from docs/architect/packaging-distribution/rewrite-plan.md#7-open-decisions, under "7. Open Decisions", is retained at docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#7-open-decisions. Only heading depth changes; the direct section payload follows the original source order. This remains dated source context, with no current runtime truth claim. |

### Source unit

```text
# 7. Open Decisions

| Decision | Why it matters | Recommendation |
| --- | --- | --- |
| Area folder name: `distribution` or `packaging-distribution` | Human navigation and existing terms differ. | Use folder `packaging-distribution`; title can be `Packaging And Distribution`. |
| Setup/doctor ownership | It is currently central to install reliability, but may become its own area. | Keep under packaging-distribution for this rewrite; split later only if it grows independent contracts. |
| Spec status after Rust/fgctl migration | Old spec still has implemented truths but old framing. | Rewrite with explicit current/target split; do not delete old file until links are updated. |
| README versus spec authority | README already presents `fgctl` as recommended. | Treat README as user-facing current intent; verify against code/tests before finalizing spec. |
| Plugin packaging placement | It is distribution-related but can dominate the spec. | Extract to contract or subpage if it exceeds a compact section. |
```

### Target unit

```text
### 7. Open Decisions

| Decision | Why it matters | Recommendation |
| --- | --- | --- |
| Area folder name: `distribution` or `packaging-distribution` | Human navigation and existing terms differ. | Use folder `packaging-distribution`; title can be `Packaging And Distribution`. |
| Setup/doctor ownership | It is currently central to install reliability, but may become its own area. | Keep under packaging-distribution for this rewrite; split later only if it grows independent contracts. |
| Spec status after Rust/fgctl migration | Old spec still has implemented truths but old framing. | Rewrite with explicit current/target split; do not delete old file until links are updated. |
| README versus spec authority | README already presents `fgctl` as recommended. | Treat README as user-facing current intent; verify against code/tests before finalizing spec. |
| Plugin packaging placement | It is distribution-related but can dominate the spec. | Extract to contract or subpage if it exceeds a compact section. |
```

### Unified diff

```diff
--- "docs/architect/packaging-distribution/rewrite-plan.md#7-open-decisions"
+++ "docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#7-open-decisions"
@@ -1,4 +1,4 @@
-# 7. Open Decisions
+### 7. Open Decisions
 
 | Decision | Why it matters | Recommendation |
 | --- | --- | --- |
```

## claim_4e6d8ea4db0848ee75a72fe670b38a08

Source: docs/architect/packaging-distribution/rewrite-plan.md#unheaded-block-45

Target: docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#unheaded-block-47

Source identity digest: `448b8acd52ff9a8d8201151b8e21d69187c26f2fde2c6f3919a8273f2bf40e60`

Target identity digest: `448b8acd52ff9a8d8201151b8e21d69187c26f2fde2c6f3919a8273f2bf40e60`

Source shown SHA256: `448b8acd52ff9a8d8201151b8e21d69187c26f2fde2c6f3919a8273f2bf40e60`

Target shown SHA256: `448b8acd52ff9a8d8201151b8e21d69187c26f2fde2c6f3919a8273f2bf40e60`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_4e6d8ea4db0848ee75a72fe670b38a08 |
| sourceUnitDigest | 448b8acd52ff9a8d8201151b8e21d69187c26f2fde2c6f3919a8273f2bf40e60 |
| targetOwner | docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md |
| targetAnchor | unheaded-block-47 |
| claimKind | decision |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/rewrite-plan.md#unheaded-block-45, under "7. Open Decisions", is retained at docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#unheaded-block-47. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. This remains dated source context, with no current runtime truth claim. |

### Source unit

```text
| Decision | Why it matters | Recommendation |
| --- | --- | --- |
| Area folder name: `distribution` or `packaging-distribution` | Human navigation and existing terms differ. | Use folder `packaging-distribution`; title can be `Packaging And Distribution`. |
| Setup/doctor ownership | It is currently central to install reliability, but may become its own area. | Keep under packaging-distribution for this rewrite; split later only if it grows independent contracts. |
| Spec status after Rust/fgctl migration | Old spec still has implemented truths but old framing. | Rewrite with explicit current/target split; do not delete old file until links are updated. |
| README versus spec authority | README already presents `fgctl` as recommended. | Treat README as user-facing current intent; verify against code/tests before finalizing spec. |
| Plugin packaging placement | It is distribution-related but can dominate the spec. | Extract to contract or subpage if it exceeds a compact section. |
```

### Target unit

```text
| Decision | Why it matters | Recommendation |
| --- | --- | --- |
| Area folder name: `distribution` or `packaging-distribution` | Human navigation and existing terms differ. | Use folder `packaging-distribution`; title can be `Packaging And Distribution`. |
| Setup/doctor ownership | It is currently central to install reliability, but may become its own area. | Keep under packaging-distribution for this rewrite; split later only if it grows independent contracts. |
| Spec status after Rust/fgctl migration | Old spec still has implemented truths but old framing. | Rewrite with explicit current/target split; do not delete old file until links are updated. |
| README versus spec authority | README already presents `fgctl` as recommended. | Treat README as user-facing current intent; verify against code/tests before finalizing spec. |
| Plugin packaging placement | It is distribution-related but can dominate the spec. | Extract to contract or subpage if it exceeds a compact section. |
```

### Unified diff

```diff
No text difference.
```

## claim_40efa8c328a27bf90a90be847f1e0ce4

Source: docs/architect/packaging-distribution/rewrite-plan.md#8-non-negotiable-rules-for-the-rewrite

Target: docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#8-non-negotiable-rules-for-the-rewrite

Source identity digest: `5ffec9aa3c63e6d07951f0d2135c8aaa4c0adb02f8951c26c785a0a3e6d0e92b`

Target identity digest: `7e4e23608956013ba24a733a73b73a4a2ac2fe9ce3f9d8d221fe901192447586`

Source shown SHA256: `08f2f54b6c384ef6a1acdef94ee199e3facc1a6ad1d808465eda199dcec02c67`

Target shown SHA256: `33a19686197a788477ecea4bdb736be23ff41d0fb431087262be6a32aa206768`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_40efa8c328a27bf90a90be847f1e0ce4 |
| sourceUnitDigest | 5ffec9aa3c63e6d07951f0d2135c8aaa4c0adb02f8951c26c785a0a3e6d0e92b |
| targetOwner | docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md |
| targetAnchor | 8-non-negotiable-rules-for-the-rewrite |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete heading from docs/architect/packaging-distribution/rewrite-plan.md#8-non-negotiable-rules-for-the-rewrite, under "8. Non-Negotiable Rules For The Rewrite", is retained at docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#8-non-negotiable-rules-for-the-rewrite. Only heading depth changes; the direct section payload follows the original source order. This remains dated source context, with no current runtime truth claim. |

### Source unit

```text
# 8. Non-Negotiable Rules For The Rewrite

- Do a fresh doc scan before editing canonical docs.
- Do a fresh code/test scan before changing factual implementation claims.
- Every design claim must be tagged as implemented, partial, planned, superseded, or unknown.
- Every implemented claim needs code/test evidence or a named verification gap.
- Links between related docs are part of quality, not decoration.
- Human spatial navigation must work: folder placement and README summaries must make the system understandable before reading governance.
```

### Target unit

```text
### 8. Non-Negotiable Rules For The Rewrite

- Do a fresh doc scan before editing canonical docs.
- Do a fresh code/test scan before changing factual implementation claims.
- Every design claim must be tagged as implemented, partial, planned, superseded, or unknown.
- Every implemented claim needs code/test evidence or a named verification gap.
- Links between related docs are part of quality, not decoration.
- Human spatial navigation must work: folder placement and README summaries must make the system understandable before reading governance.
```

### Unified diff

```diff
--- "docs/architect/packaging-distribution/rewrite-plan.md#8-non-negotiable-rules-for-the-rewrite"
+++ "docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#8-non-negotiable-rules-for-the-rewrite"
@@ -1,4 +1,4 @@
-# 8. Non-Negotiable Rules For The Rewrite
+### 8. Non-Negotiable Rules For The Rewrite
 
 - Do a fresh doc scan before editing canonical docs.
 - Do a fresh code/test scan before changing factual implementation claims.
```

## claim_13d3d6c0ae0606b2ac069f34faebb757

Source: docs/architect/packaging-distribution/rewrite-plan.md#unheaded-block-46

Target: docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#unheaded-block-48

Source identity digest: `853d4cfc177da7487a96e0db1c759a18d6104fa079657e4ad15e1d1c6761ea75`

Target identity digest: `853d4cfc177da7487a96e0db1c759a18d6104fa079657e4ad15e1d1c6761ea75`

Source shown SHA256: `853d4cfc177da7487a96e0db1c759a18d6104fa079657e4ad15e1d1c6761ea75`

Target shown SHA256: `853d4cfc177da7487a96e0db1c759a18d6104fa079657e4ad15e1d1c6761ea75`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_13d3d6c0ae0606b2ac069f34faebb757 |
| sourceUnitDigest | 853d4cfc177da7487a96e0db1c759a18d6104fa079657e4ad15e1d1c6761ea75 |
| targetOwner | docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md |
| targetAnchor | unheaded-block-48 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/rewrite-plan.md#unheaded-block-46, under "8. Non-Negotiable Rules For The Rewrite", is retained at docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#unheaded-block-48. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. This remains dated source context, with no current runtime truth claim. |

### Source unit

```text
- Do a fresh doc scan before editing canonical docs.
- Do a fresh code/test scan before changing factual implementation claims.
- Every design claim must be tagged as implemented, partial, planned, superseded, or unknown.
- Every implemented claim needs code/test evidence or a named verification gap.
- Links between related docs are part of quality, not decoration.
- Human spatial navigation must work: folder placement and README summaries must make the system understandable before reading governance.
```

### Target unit

```text
- Do a fresh doc scan before editing canonical docs.
- Do a fresh code/test scan before changing factual implementation claims.
- Every design claim must be tagged as implemented, partial, planned, superseded, or unknown.
- Every implemented claim needs code/test evidence or a named verification gap.
- Links between related docs are part of quality, not decoration.
- Human spatial navigation must work: folder placement and README summaries must make the system understandable before reading governance.
```

### Unified diff

```diff
No text difference.
```

