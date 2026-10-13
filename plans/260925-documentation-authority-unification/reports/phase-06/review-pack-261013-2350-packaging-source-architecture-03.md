# Packaging independent review: source-architecture 3

Content pin: `baef3a075899f83d515a28ab66abd6c3d55201c5`

Author: `codex-session:8@2026-10-13`; assembler: `codex-session:9@2026-10-13`. All proposals remain pending.

## claim_35cf33a00e8a54b906e9b69850014755

Source: docs/architect/packaging-distribution/rewrite-plan.md#9-first-concrete-next-step

Target: docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#9-first-concrete-next-step

Source identity digest: `416a4d0c0c76164ef24b066d8ce0edd6a324801c8e0d10786b8170c142355ecb`

Target identity digest: `feb0a6c5804c704d6b398263b0a44c1c99478118ba618bd4a1f723a471095288`

Source shown SHA256: `77831b054bedad8ad52a452c65a93a546f1ff2258da5f21b6021c18bae9f1212`

Target shown SHA256: `7fda37af2b76869b87a63656f729686a77538394d92514f41ca2f791497ef25b`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_35cf33a00e8a54b906e9b69850014755 |
| sourceUnitDigest | 416a4d0c0c76164ef24b066d8ce0edd6a324801c8e0d10786b8170c142355ecb |
| targetOwner | docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md |
| targetAnchor | 9-first-concrete-next-step |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete heading from docs/architect/packaging-distribution/rewrite-plan.md#9-first-concrete-next-step, under "9. First Concrete Next Step", is retained at docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#9-first-concrete-next-step. Only heading depth changes; the direct section payload follows the original source order. This remains dated source context, with no current runtime truth claim. |

### Source unit

```text
# 9. First Concrete Next Step

Create a migration map for the packaging-distribution area:

| Source | Type | Authority now | Target destination | Action |
| --- | --- | --- | --- | --- |
| `docs/specs/distribution.md` | generated/curated spec | current-state source | `docs/platform/packaging-distribution/spec.md` | extract and rewrite |
| `docs/distribution-vision.md` | hand-curated vision | rationale | history or architecture rationale links | reconcile |
| `docs/architect/packaging-distribution/runtime-identity-and-activation.md` | discussion-derived architecture | target design | `architecture/runtime-identity-and-activation.md` plus contracts | split/promote |
| `docs/architect/packaging-distribution/history/distribution-baseline.md` | history | evidence | `history/distribution-baseline.md` | preserve |
| code/test scan result | implementation evidence | proof | `verification/implementation-alignment.md` | link and validate |

After that map is reviewed, rewrite the area portal first, not the deep spec.
```

### Target unit

```text
### 9. First Concrete Next Step

Create a migration map for the packaging-distribution area:

| Source | Type | Authority now | Target destination | Action |
| --- | --- | --- | --- | --- |
| `docs/specs/distribution.md` | generated/curated spec | current-state source | `docs/platform/packaging-distribution/spec.md` | extract and rewrite |
| `docs/distribution-vision.md` | hand-curated vision | rationale | history or architecture rationale links | reconcile |
| `docs/architect/packaging-distribution/runtime-identity-and-activation.md` | discussion-derived architecture | target design | `architecture/runtime-identity-and-activation.md` plus contracts | split/promote |
| `docs/architect/packaging-distribution/history/distribution-baseline.md` | history | evidence | `history/distribution-baseline.md` | preserve |
| code/test scan result | implementation evidence | proof | `verification/implementation-alignment.md` | link and validate |

After that map is reviewed, rewrite the area portal first, not the deep spec.
```

### Unified diff

```diff
--- "docs/architect/packaging-distribution/rewrite-plan.md#9-first-concrete-next-step"
+++ "docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#9-first-concrete-next-step"
@@ -1,4 +1,4 @@
-# 9. First Concrete Next Step
+### 9. First Concrete Next Step
 
 Create a migration map for the packaging-distribution area:
```

## claim_7a394bc533b63f4bcb608aae3da9a585

Source: docs/architect/packaging-distribution/rewrite-plan.md#unheaded-block-47

Target: docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#unheaded-block-49

Source identity digest: `ace2c46365cfbeac3e4a7395bdce7249e8beb0d0a1e8f582f0565f74909d65e9`

Target identity digest: `ace2c46365cfbeac3e4a7395bdce7249e8beb0d0a1e8f582f0565f74909d65e9`

Source shown SHA256: `ace2c46365cfbeac3e4a7395bdce7249e8beb0d0a1e8f582f0565f74909d65e9`

Target shown SHA256: `ace2c46365cfbeac3e4a7395bdce7249e8beb0d0a1e8f582f0565f74909d65e9`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_7a394bc533b63f4bcb608aae3da9a585 |
| sourceUnitDigest | ace2c46365cfbeac3e4a7395bdce7249e8beb0d0a1e8f582f0565f74909d65e9 |
| targetOwner | docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md |
| targetAnchor | unheaded-block-49 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/rewrite-plan.md#unheaded-block-47, under "9. First Concrete Next Step", is retained at docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#unheaded-block-49. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. This remains dated source context, with no current runtime truth claim. |

### Source unit

```text
Create a migration map for the packaging-distribution area:
```

### Target unit

```text
Create a migration map for the packaging-distribution area:
```

### Unified diff

```diff
No text difference.
```

## claim_30069b0c5b66150c0afd7909cdedb51d

Source: docs/architect/packaging-distribution/rewrite-plan.md#unheaded-block-48

Target: docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#unheaded-block-50

Source identity digest: `8934746bab70212209011429bd0440ad91c5379cb8cb143e59578677ab34f63a`

Target identity digest: `8934746bab70212209011429bd0440ad91c5379cb8cb143e59578677ab34f63a`

Source shown SHA256: `8934746bab70212209011429bd0440ad91c5379cb8cb143e59578677ab34f63a`

Target shown SHA256: `8934746bab70212209011429bd0440ad91c5379cb8cb143e59578677ab34f63a`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_30069b0c5b66150c0afd7909cdedb51d |
| sourceUnitDigest | 8934746bab70212209011429bd0440ad91c5379cb8cb143e59578677ab34f63a |
| targetOwner | docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md |
| targetAnchor | unheaded-block-50 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/rewrite-plan.md#unheaded-block-48, under "9. First Concrete Next Step", is retained at docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#unheaded-block-50. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. This remains dated source context, with no current runtime truth claim. |

### Source unit

```text
| Source | Type | Authority now | Target destination | Action |
| --- | --- | --- | --- | --- |
| `docs/specs/distribution.md` | generated/curated spec | current-state source | `docs/platform/packaging-distribution/spec.md` | extract and rewrite |
| `docs/distribution-vision.md` | hand-curated vision | rationale | history or architecture rationale links | reconcile |
| `docs/architect/packaging-distribution/runtime-identity-and-activation.md` | discussion-derived architecture | target design | `architecture/runtime-identity-and-activation.md` plus contracts | split/promote |
| `docs/architect/packaging-distribution/history/distribution-baseline.md` | history | evidence | `history/distribution-baseline.md` | preserve |
| code/test scan result | implementation evidence | proof | `verification/implementation-alignment.md` | link and validate |
```

### Target unit

```text
| Source | Type | Authority now | Target destination | Action |
| --- | --- | --- | --- | --- |
| `docs/specs/distribution.md` | generated/curated spec | current-state source | `docs/platform/packaging-distribution/spec.md` | extract and rewrite |
| `docs/distribution-vision.md` | hand-curated vision | rationale | history or architecture rationale links | reconcile |
| `docs/architect/packaging-distribution/runtime-identity-and-activation.md` | discussion-derived architecture | target design | `architecture/runtime-identity-and-activation.md` plus contracts | split/promote |
| `docs/architect/packaging-distribution/history/distribution-baseline.md` | history | evidence | `history/distribution-baseline.md` | preserve |
| code/test scan result | implementation evidence | proof | `verification/implementation-alignment.md` | link and validate |
```

### Unified diff

```diff
No text difference.
```

## claim_e311b370638ba6122de019bf1f6e7642

Source: docs/architect/packaging-distribution/rewrite-plan.md#unheaded-block-49

Target: docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#unheaded-block-51

Source identity digest: `a24f6f0c53ff290f9d3e5cfb67646a3980c43c4001f8bf610178ddd4dba54a8d`

Target identity digest: `a24f6f0c53ff290f9d3e5cfb67646a3980c43c4001f8bf610178ddd4dba54a8d`

Source shown SHA256: `a24f6f0c53ff290f9d3e5cfb67646a3980c43c4001f8bf610178ddd4dba54a8d`

Target shown SHA256: `a24f6f0c53ff290f9d3e5cfb67646a3980c43c4001f8bf610178ddd4dba54a8d`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_e311b370638ba6122de019bf1f6e7642 |
| sourceUnitDigest | a24f6f0c53ff290f9d3e5cfb67646a3980c43c4001f8bf610178ddd4dba54a8d |
| targetOwner | docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md |
| targetAnchor | unheaded-block-51 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/rewrite-plan.md#unheaded-block-49, under "9. First Concrete Next Step", is retained at docs/platform/packaging-distribution/history/documentation-migration/rewrite-plan.md#unheaded-block-51. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. This remains dated source context, with no current runtime truth claim. |

### Source unit

```text
After that map is reviewed, rewrite the area portal first, not the deep spec.
```

### Target unit

```text
After that map is reviewed, rewrite the area portal first, not the deep spec.
```

### Unified diff

```diff
No text difference.
```

## claim_f3d6f2172d4780ee47f3a2f7a44b2ec8

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#runtime-identity-and-activation

Target: docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md#runtime-identity-and-activation-1

Source identity digest: `b0443ae563d60b4c86e1a73c3187615831c3cd8c21cd015488f9e2695a68ac96`

Target identity digest: `54660ce11d518179ea925df6d69831e3c4f990e5e40ed35de69ce4b5c5c672cd`

Source shown SHA256: `58e20c597120f44e153dbfdde9d84c6ac9000bb3ce21473dd4e03986f47fef61`

Target shown SHA256: `6e98b503d44ce697a54a59b21ac898a709aaa7809e59936e0bd1c70dcc3cadfb`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_f3d6f2172d4780ee47f3a2f7a44b2ec8 |
| sourceUnitDigest | b0443ae563d60b4c86e1a73c3187615831c3cd8c21cd015488f9e2695a68ac96 |
| targetOwner | docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md |
| targetAnchor | runtime-identity-and-activation-1 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete heading from docs/architect/packaging-distribution/runtime-identity-and-activation.md#runtime-identity-and-activation, under "Runtime Identity And Activation", is retained at docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md#runtime-identity-and-activation-1. Only heading depth changes; the direct section payload follows the original source order. The named owner is the architecture/runtime-identity-and-activation.md topic owner; carriage does not certify current implementation. |

### Source unit

````text
# Runtime Identity And Activation

```txt
Legacy status: Promoted architecture/contract source
Promoted to:
- docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md
- docs/platform/packaging-distribution/contracts/release-manifest.md
- docs/platform/packaging-distribution/contracts/activation-binding.md
- docs/platform/packaging-distribution/contracts/distribution-pin.md
Current reader entry: docs/platform/packaging-distribution/README.md
Use this legacy file for: Source detail until contract extraction is complete
Do not use this legacy file for: Current implementation status without checking implementation alignment
Last reviewed: 2026-09-13
```

> Status: historical redirect. The active promoted runtime docs are
> [runtime-identity-and-activation.md](../../platform/packaging-distribution/architecture/runtime-identity-and-activation.md),
> [repository-runtime-layout.md](../../platform/packaging-distribution/contracts/repository-runtime-layout.md),
> [release-manifest.md](../../platform/packaging-distribution/contracts/release-manifest.md),
> [activation-binding.md](../../platform/packaging-distribution/contracts/activation-binding.md),
> [distribution-pin.md](../../platform/packaging-distribution/contracts/distribution-pin.md),
> and [fgctl-and-local-fgos.md](../../platform/packaging-distribution/architecture/fgctl-and-local-fgos.md).
> Keep this file only as detailed source context.

**Status:** Historical architecture contract draft.
**Date:** 2026-09-04.
**Scope:** Project-local fgOS runtime identity, release records, per-workspace
activation binding, pinning, drift, rollback, quarantine, and the minimum
command boundary needed for packaging/distribution and the Rust `fgos` CLI.

This document was the first contract draft before promotion into
`docs/platform/packaging-distribution/**`. It deliberately kept shared
gateway/web as a future constraint, not active delivery scope.
````

### Target unit

````text
### Runtime Identity And Activation

```txt
Legacy status: Promoted architecture/contract source
Promoted to:
- docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md
- docs/platform/packaging-distribution/contracts/release-manifest.md
- docs/platform/packaging-distribution/contracts/activation-binding.md
- docs/platform/packaging-distribution/contracts/distribution-pin.md
Current reader entry: docs/platform/packaging-distribution/README.md
Use this legacy file for: Source detail until contract extraction is complete
Do not use this legacy file for: Current implementation status without checking implementation alignment
Last reviewed: 2026-09-13
```

> Status: historical redirect. The active promoted runtime docs are
> [runtime-identity-and-activation.md](runtime-identity-and-activation.md),
> [repository-runtime-layout.md](../contracts/repository-runtime-layout.md),
> [release-manifest.md](../contracts/release-manifest.md),
> [activation-binding.md](../contracts/activation-binding.md),
> [distribution-pin.md](../contracts/distribution-pin.md),
> and [fgctl-and-local-fgos.md](fgctl-and-local-fgos.md).
> Keep this file only as detailed source context.

**Status:** Historical architecture contract draft.
**Date:** 2026-09-04.
**Scope:** Project-local fgOS runtime identity, release records, per-workspace
activation binding, pinning, drift, rollback, quarantine, and the minimum
command boundary needed for packaging/distribution and the Rust `fgos` CLI.

This document was the first contract draft before promotion into
`docs/platform/packaging-distribution/**`. It deliberately kept shared
gateway/web as a future constraint, not active delivery scope.
````

### Unified diff

````diff
--- "docs/architect/packaging-distribution/runtime-identity-and-activation.md#runtime-identity-and-activation"
+++ "docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md#runtime-identity-and-activation-1"
@@ -1,4 +1,4 @@
-# Runtime Identity And Activation
+### Runtime Identity And Activation
 
 ```txt
 Legacy status: Promoted architecture/contract source
@@ -14,12 +14,12 @@ Last reviewed: 2026-09-13
 ```
 
 > Status: historical redirect. The active promoted runtime docs are
-> [runtime-identity-and-activation.md](../../platform/packaging-distribution/architecture/runtime-identity-and-activation.md),
-> [repository-runtime-layout.md](../../platform/packaging-distribution/contracts/repository-runtime-layout.md),
-> [release-manifest.md](../../platform/packaging-distribution/contracts/release-manifest.md),
-> [activation-binding.md](../../platform/packaging-distribution/contracts/activation-binding.md),
-> [distribution-pin.md](../../platform/packaging-distribution/contracts/distribution-pin.md),
-> and [fgctl-and-local-fgos.md](../../platform/packaging-distribution/architecture/fgctl-and-local-fgos.md).
+> [runtime-identity-and-activation.md](runtime-identity-and-activation.md),
+> [repository-runtime-layout.md](../contracts/repository-runtime-layout.md),
+> [release-manifest.md](../contracts/release-manifest.md),
+> [activation-binding.md](../contracts/activation-binding.md),
+> [distribution-pin.md](../contracts/distribution-pin.md),
+> and [fgctl-and-local-fgos.md](fgctl-and-local-fgos.md).
 > Keep this file only as detailed source context.
 
 **Status:** Historical architecture contract draft.
````

## claim_b6c7e0cf73c35dad866f2dd1d7a2a3e2

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-1

Target: docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md#unheaded-block-25

Source identity digest: `10091961d72f5052ef0355d73033bdd6e6653df594f6393e50c3e6155bdc0cce`

Target identity digest: `10091961d72f5052ef0355d73033bdd6e6653df594f6393e50c3e6155bdc0cce`

Source shown SHA256: `10091961d72f5052ef0355d73033bdd6e6653df594f6393e50c3e6155bdc0cce`

Target shown SHA256: `10091961d72f5052ef0355d73033bdd6e6653df594f6393e50c3e6155bdc0cce`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_b6c7e0cf73c35dad866f2dd1d7a2a3e2 |
| sourceUnitDigest | 10091961d72f5052ef0355d73033bdd6e6653df594f6393e50c3e6155bdc0cce |
| targetOwner | docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md |
| targetAnchor | unheaded-block-25 |
| claimKind | contract |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-1, under "Runtime Identity And Activation", is retained at docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md#unheaded-block-25. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the architecture/runtime-identity-and-activation.md topic owner; carriage does not certify current implementation. |

### Source unit

````text
```txt
Legacy status: Promoted architecture/contract source
Promoted to:
- docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md
- docs/platform/packaging-distribution/contracts/release-manifest.md
- docs/platform/packaging-distribution/contracts/activation-binding.md
- docs/platform/packaging-distribution/contracts/distribution-pin.md
Current reader entry: docs/platform/packaging-distribution/README.md
Use this legacy file for: Source detail until contract extraction is complete
Do not use this legacy file for: Current implementation status without checking implementation alignment
Last reviewed: 2026-09-13
```
````

### Target unit

````text
```txt
Legacy status: Promoted architecture/contract source
Promoted to:
- docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md
- docs/platform/packaging-distribution/contracts/release-manifest.md
- docs/platform/packaging-distribution/contracts/activation-binding.md
- docs/platform/packaging-distribution/contracts/distribution-pin.md
Current reader entry: docs/platform/packaging-distribution/README.md
Use this legacy file for: Source detail until contract extraction is complete
Do not use this legacy file for: Current implementation status without checking implementation alignment
Last reviewed: 2026-09-13
```
````

### Unified diff

```diff
No text difference.
```

## claim_a8c8bb05d3b2183c26cfb7f502c66ac3

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-2

Target: docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md#unheaded-block-26

Source identity digest: `38a429413f394159e5c091001f54d1a9459961e43cf285cce6354a5476c1e9a6`

Target identity digest: `461b6eb88c2114010dd0f6de1c5c3e420ebe54ede0b3db61fc12cafce456a99a`

Source shown SHA256: `38a429413f394159e5c091001f54d1a9459961e43cf285cce6354a5476c1e9a6`

Target shown SHA256: `461b6eb88c2114010dd0f6de1c5c3e420ebe54ede0b3db61fc12cafce456a99a`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_a8c8bb05d3b2183c26cfb7f502c66ac3 |
| sourceUnitDigest | 38a429413f394159e5c091001f54d1a9459961e43cf285cce6354a5476c1e9a6 |
| targetOwner | docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md |
| targetAnchor | unheaded-block-26 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-2, under "Runtime Identity And Activation", is retained at docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md#unheaded-block-26. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the architecture/runtime-identity-and-activation.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
> Status: historical redirect. The active promoted runtime docs are
> [runtime-identity-and-activation.md](../../platform/packaging-distribution/architecture/runtime-identity-and-activation.md),
> [repository-runtime-layout.md](../../platform/packaging-distribution/contracts/repository-runtime-layout.md),
> [release-manifest.md](../../platform/packaging-distribution/contracts/release-manifest.md),
> [activation-binding.md](../../platform/packaging-distribution/contracts/activation-binding.md),
> [distribution-pin.md](../../platform/packaging-distribution/contracts/distribution-pin.md),
> and [fgctl-and-local-fgos.md](../../platform/packaging-distribution/architecture/fgctl-and-local-fgos.md).
> Keep this file only as detailed source context.
```

### Target unit

```text
> Status: historical redirect. The active promoted runtime docs are
> [runtime-identity-and-activation.md](runtime-identity-and-activation.md),
> [repository-runtime-layout.md](../contracts/repository-runtime-layout.md),
> [release-manifest.md](../contracts/release-manifest.md),
> [activation-binding.md](../contracts/activation-binding.md),
> [distribution-pin.md](../contracts/distribution-pin.md),
> and [fgctl-and-local-fgos.md](fgctl-and-local-fgos.md).
> Keep this file only as detailed source context.
```

### Unified diff

```diff
--- "docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-2"
+++ "docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md#unheaded-block-26"
@@ -1,8 +1,8 @@
 > Status: historical redirect. The active promoted runtime docs are
-> [runtime-identity-and-activation.md](../../platform/packaging-distribution/architecture/runtime-identity-and-activation.md),
-> [repository-runtime-layout.md](../../platform/packaging-distribution/contracts/repository-runtime-layout.md),
-> [release-manifest.md](../../platform/packaging-distribution/contracts/release-manifest.md),
-> [activation-binding.md](../../platform/packaging-distribution/contracts/activation-binding.md),
-> [distribution-pin.md](../../platform/packaging-distribution/contracts/distribution-pin.md),
-> and [fgctl-and-local-fgos.md](../../platform/packaging-distribution/architecture/fgctl-and-local-fgos.md).
+> [runtime-identity-and-activation.md](runtime-identity-and-activation.md),
+> [repository-runtime-layout.md](../contracts/repository-runtime-layout.md),
+> [release-manifest.md](../contracts/release-manifest.md),
+> [activation-binding.md](../contracts/activation-binding.md),
+> [distribution-pin.md](../contracts/distribution-pin.md),
+> and [fgctl-and-local-fgos.md](fgctl-and-local-fgos.md).
 > Keep this file only as detailed source context.
\ No newline at end of file
```

## claim_26dac21a6c44a07abe3ff6c726462bca

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-3

Target: docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md#unheaded-block-27

Source identity digest: `c04b3e9f7cf11dfba642005558dafc2bf67a1b96da1e475ed8634e4c9ddde1ad`

Target identity digest: `c04b3e9f7cf11dfba642005558dafc2bf67a1b96da1e475ed8634e4c9ddde1ad`

Source shown SHA256: `c04b3e9f7cf11dfba642005558dafc2bf67a1b96da1e475ed8634e4c9ddde1ad`

Target shown SHA256: `c04b3e9f7cf11dfba642005558dafc2bf67a1b96da1e475ed8634e4c9ddde1ad`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_26dac21a6c44a07abe3ff6c726462bca |
| sourceUnitDigest | c04b3e9f7cf11dfba642005558dafc2bf67a1b96da1e475ed8634e4c9ddde1ad |
| targetOwner | docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md |
| targetAnchor | unheaded-block-27 |
| claimKind | contract |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-3, under "Runtime Identity And Activation", is retained at docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md#unheaded-block-27. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the architecture/runtime-identity-and-activation.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
**Status:** Historical architecture contract draft.
**Date:** 2026-09-04.
**Scope:** Project-local fgOS runtime identity, release records, per-workspace
activation binding, pinning, drift, rollback, quarantine, and the minimum
command boundary needed for packaging/distribution and the Rust `fgos` CLI.
```

### Target unit

```text
**Status:** Historical architecture contract draft.
**Date:** 2026-09-04.
**Scope:** Project-local fgOS runtime identity, release records, per-workspace
activation binding, pinning, drift, rollback, quarantine, and the minimum
command boundary needed for packaging/distribution and the Rust `fgos` CLI.
```

### Unified diff

```diff
No text difference.
```

## claim_e7c16bc6110144f3672d8e3263df7c4b

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-4

Target: docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md#unheaded-block-28

Source identity digest: `646813dad37dce5e09992cf8bf2aeddbb132e4620f1455dd55ec2060aa4a4b88`

Target identity digest: `646813dad37dce5e09992cf8bf2aeddbb132e4620f1455dd55ec2060aa4a4b88`

Source shown SHA256: `646813dad37dce5e09992cf8bf2aeddbb132e4620f1455dd55ec2060aa4a4b88`

Target shown SHA256: `646813dad37dce5e09992cf8bf2aeddbb132e4620f1455dd55ec2060aa4a4b88`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_e7c16bc6110144f3672d8e3263df7c4b |
| sourceUnitDigest | 646813dad37dce5e09992cf8bf2aeddbb132e4620f1455dd55ec2060aa4a4b88 |
| targetOwner | docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md |
| targetAnchor | unheaded-block-28 |
| claimKind | contract |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-4, under "Runtime Identity And Activation", is retained at docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md#unheaded-block-28. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the architecture/runtime-identity-and-activation.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
This document was the first contract draft before promotion into
`docs/platform/packaging-distribution/**`. It deliberately kept shared
gateway/web as a future constraint, not active delivery scope.
```

### Target unit

```text
This document was the first contract draft before promotion into
`docs/platform/packaging-distribution/**`. It deliberately kept shared
gateway/web as a future constraint, not active delivery scope.
```

### Unified diff

```diff
No text difference.
```

## claim_a194d0ab7320ba24239af2947b286713

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#how-to-use-this-document

Target: docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md#how-to-use-this-document

Source identity digest: `43afffffa5c14ced4d88b4f77dd85918110522d11d204d3ccdb266b7d4cfdb1f`

Target identity digest: `af9d7395f28979e64969c6ed6a2c53b35d1de02b1d879d4649c16bd5d841329f`

Source shown SHA256: `7bd1e2cf5862bf1d5b1bc591e7efcc8342fa8c234e7404a5003c53255016b309`

Target shown SHA256: `d496020cd3bf362f1bffa9153935110a8e6ec9685bb1230a20938262aa7421e2`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_a194d0ab7320ba24239af2947b286713 |
| sourceUnitDigest | 43afffffa5c14ced4d88b4f77dd85918110522d11d204d3ccdb266b7d4cfdb1f |
| targetOwner | docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md |
| targetAnchor | how-to-use-this-document |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete heading from docs/architect/packaging-distribution/runtime-identity-and-activation.md#how-to-use-this-document, under "How To Use This Document", is retained at docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md#how-to-use-this-document. Only heading depth changes; the direct section payload follows the original source order. The named owner is the architecture/runtime-identity-and-activation.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
## How To Use This Document

This document is intentionally detailed historical source context. Use the
promoted platform docs as the working contract for new changes.

Read it in layers:

1. Read [Workspace Topology Architecture](../workspace-topology.md) first for root
   topology, state classes, worktree behavior, and dirty-tree rules.
2. Read the promoted
   [runtime identity architecture](../../platform/packaging-distribution/architecture/runtime-identity-and-activation.md)
   for current runtime identity language.
3. Read the promoted contracts for
   [repository layout](../../platform/packaging-distribution/contracts/repository-runtime-layout.md),
   [activation binding](../../platform/packaging-distribution/contracts/activation-binding.md),
   [distribution pin](../../platform/packaging-distribution/contracts/distribution-pin.md),
   and [release manifest](../../platform/packaging-distribution/contracts/release-manifest.md).
4. Use the remaining sections here only to recover historical rationale or
   details that the preservation audit points to.
```

### Target unit

```text
#### How To Use This Document

This document is intentionally detailed historical source context. Use the
promoted platform docs as the working contract for new changes.

Read it in layers:

1. Read [Workspace Topology Architecture](../../../architect/workspace-topology.md) first for root
   topology, state classes, worktree behavior, and dirty-tree rules.
2. Read the promoted
   [runtime identity architecture](runtime-identity-and-activation.md)
   for current runtime identity language.
3. Read the promoted contracts for
   [repository layout](../contracts/repository-runtime-layout.md),
   [activation binding](../contracts/activation-binding.md),
   [distribution pin](../contracts/distribution-pin.md),
   and [release manifest](../contracts/release-manifest.md).
4. Use the remaining sections here only to recover historical rationale or
   details that the preservation audit points to.
```

### Unified diff

```diff
--- "docs/architect/packaging-distribution/runtime-identity-and-activation.md#how-to-use-this-document"
+++ "docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md#how-to-use-this-document"
@@ -1,19 +1,19 @@
-## How To Use This Document
+#### How To Use This Document
 
 This document is intentionally detailed historical source context. Use the
 promoted platform docs as the working contract for new changes.
 
 Read it in layers:
 
-1. Read [Workspace Topology Architecture](../workspace-topology.md) first for root
+1. Read [Workspace Topology Architecture](../../../architect/workspace-topology.md) first for root
    topology, state classes, worktree behavior, and dirty-tree rules.
 2. Read the promoted
-   [runtime identity architecture](../../platform/packaging-distribution/architecture/runtime-identity-and-activation.md)
+   [runtime identity architecture](runtime-identity-and-activation.md)
    for current runtime identity language.
 3. Read the promoted contracts for
-   [repository layout](../../platform/packaging-distribution/contracts/repository-runtime-layout.md),
-   [activation binding](../../platform/packaging-distribution/contracts/activation-binding.md),
-   [distribution pin](../../platform/packaging-distribution/contracts/distribution-pin.md),
-   and [release manifest](../../platform/packaging-distribution/contracts/release-manifest.md).
+   [repository layout](../contracts/repository-runtime-layout.md),
+   [activation binding](../contracts/activation-binding.md),
+   [distribution pin](../contracts/distribution-pin.md),
+   and [release manifest](../contracts/release-manifest.md).
 4. Use the remaining sections here only to recover historical rationale or
    details that the preservation audit points to.
\ No newline at end of file
```

## claim_6f1dc76a5f99b9f747725aef60bd5d12

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-5

Target: docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md#unheaded-block-29

Source identity digest: `627342a16c82cf6723afcd338d1fb2e690df1999c4c86d1c9cd812cb48c4393a`

Target identity digest: `627342a16c82cf6723afcd338d1fb2e690df1999c4c86d1c9cd812cb48c4393a`

Source shown SHA256: `627342a16c82cf6723afcd338d1fb2e690df1999c4c86d1c9cd812cb48c4393a`

Target shown SHA256: `627342a16c82cf6723afcd338d1fb2e690df1999c4c86d1c9cd812cb48c4393a`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_6f1dc76a5f99b9f747725aef60bd5d12 |
| sourceUnitDigest | 627342a16c82cf6723afcd338d1fb2e690df1999c4c86d1c9cd812cb48c4393a |
| targetOwner | docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md |
| targetAnchor | unheaded-block-29 |
| claimKind | contract |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-5, under "How To Use This Document", is retained at docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md#unheaded-block-29. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the architecture/runtime-identity-and-activation.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
This document is intentionally detailed historical source context. Use the
promoted platform docs as the working contract for new changes.
```

### Target unit

```text
This document is intentionally detailed historical source context. Use the
promoted platform docs as the working contract for new changes.
```

### Unified diff

```diff
No text difference.
```

## claim_821b6180ae535904a105ff8c47fe5dff

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-6

Target: docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md#unheaded-block-30

Source identity digest: `981d12637202f28c2cb25b03666114bd3c97c10c774c339f67cdcd71d1925db3`

Target identity digest: `2f95e86d725a3a2577ebdcb12f9ba2ef5fb74a15465af07a456766752243aa6c`

Source shown SHA256: `981d12637202f28c2cb25b03666114bd3c97c10c774c339f67cdcd71d1925db3`

Target shown SHA256: `2f95e86d725a3a2577ebdcb12f9ba2ef5fb74a15465af07a456766752243aa6c`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_821b6180ae535904a105ff8c47fe5dff |
| sourceUnitDigest | 981d12637202f28c2cb25b03666114bd3c97c10c774c339f67cdcd71d1925db3 |
| targetOwner | docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md |
| targetAnchor | unheaded-block-30 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-6, under "How To Use This Document", is retained at docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md#unheaded-block-30. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the architecture/runtime-identity-and-activation.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
Read it in layers:

1. Read [Workspace Topology Architecture](../workspace-topology.md) first for root
   topology, state classes, worktree behavior, and dirty-tree rules.
2. Read the promoted
   [runtime identity architecture](../../platform/packaging-distribution/architecture/runtime-identity-and-activation.md)
   for current runtime identity language.
3. Read the promoted contracts for
   [repository layout](../../platform/packaging-distribution/contracts/repository-runtime-layout.md),
   [activation binding](../../platform/packaging-distribution/contracts/activation-binding.md),
   [distribution pin](../../platform/packaging-distribution/contracts/distribution-pin.md),
   and [release manifest](../../platform/packaging-distribution/contracts/release-manifest.md).
4. Use the remaining sections here only to recover historical rationale or
   details that the preservation audit points to.
```

### Target unit

```text
Read it in layers:

1. Read [Workspace Topology Architecture](../../../architect/workspace-topology.md) first for root
   topology, state classes, worktree behavior, and dirty-tree rules.
2. Read the promoted
   [runtime identity architecture](runtime-identity-and-activation.md)
   for current runtime identity language.
3. Read the promoted contracts for
   [repository layout](../contracts/repository-runtime-layout.md),
   [activation binding](../contracts/activation-binding.md),
   [distribution pin](../contracts/distribution-pin.md),
   and [release manifest](../contracts/release-manifest.md).
4. Use the remaining sections here only to recover historical rationale or
   details that the preservation audit points to.
```

### Unified diff

```diff
--- "docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-6"
+++ "docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md#unheaded-block-30"
@@ -1,14 +1,14 @@
 Read it in layers:
 
-1. Read [Workspace Topology Architecture](../workspace-topology.md) first for root
+1. Read [Workspace Topology Architecture](../../../architect/workspace-topology.md) first for root
    topology, state classes, worktree behavior, and dirty-tree rules.
 2. Read the promoted
-   [runtime identity architecture](../../platform/packaging-distribution/architecture/runtime-identity-and-activation.md)
+   [runtime identity architecture](runtime-identity-and-activation.md)
    for current runtime identity language.
 3. Read the promoted contracts for
-   [repository layout](../../platform/packaging-distribution/contracts/repository-runtime-layout.md),
-   [activation binding](../../platform/packaging-distribution/contracts/activation-binding.md),
-   [distribution pin](../../platform/packaging-distribution/contracts/distribution-pin.md),
-   and [release manifest](../../platform/packaging-distribution/contracts/release-manifest.md).
+   [repository layout](../contracts/repository-runtime-layout.md),
+   [activation binding](../contracts/activation-binding.md),
+   [distribution pin](../contracts/distribution-pin.md),
+   and [release manifest](../contracts/release-manifest.md).
 4. Use the remaining sections here only to recover historical rationale or
    details that the preservation audit points to.
\ No newline at end of file
```

## claim_dc75ad7e62660d3711910c31e2882533

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#historical-decisions-promoted-or-tracked

Target: docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md#historical-decisions-promoted-or-tracked

Source identity digest: `3b4563ef12a08c63362ee6a262109828d32f9515918343fe1ae56a55e54ece59`

Target identity digest: `6cc6e399493acc5297347592b2c25321f3966e749515b140164c6d2afe66963e`

Source shown SHA256: `e5041d0fe791fcae6827465d44dfe722cd9118b97e84785dd5527a7309127158`

Target shown SHA256: `d21f43aed882765f2691423639089f248003025b5ae02d6ec9031220c5438851`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_dc75ad7e62660d3711910c31e2882533 |
| sourceUnitDigest | 3b4563ef12a08c63362ee6a262109828d32f9515918343fe1ae56a55e54ece59 |
| targetOwner | docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md |
| targetAnchor | historical-decisions-promoted-or-tracked |
| claimKind | architecture |
| disposition | partial-carry |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The source heading and its title are retained at docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md#historical-decisions-promoted-or-tracked. Its compound settled-facts table is handled separately by the required dev-source deferral; the non-dev clauses appear in the labelled stub companion table. |
| remainder | The full compound settled-facts table, including the dev:\<rev\> clause, is deferred as a separate source unit to the Dev Source Activation Restoration Stub. Its other clauses are retained in that stub companion table; dev restoration remains Plan C. |

### Source unit

```text
## Historical Decisions Promoted Or Tracked

| Decision | Status |
|---|---|
| Runtime identity is digest-based, not PATH-based. | Settled for V1. |
| `artifactDigest` is the digest of the canonical release tree manifest, not an archive digest. | Settled for V1. |
| Release tree manifest uses normalized logical paths and refuses symlinks/case collisions in V1. | Settled for V1. |
| Project commands enter through stable local shims under workspace `.fgos/installation/bin/`. | Settled for V1. |
| Immutable release payloads live under a shared content-addressed machine/trust-domain release store, not under each worktree. | Settled for V1. |
| Activation is per workspace via `.fgos/installation/activation.json`; there is no single repository-wide active runtime pointer in V1. | Settled for V1. |
| Packaging release/activation state uses workspace installation roots and must not share a namespace with work coordination state. | Settled for V1. |
| The project/team pin is tracked as `.fgos/distribution.json`; machine-local activation state remains ignored. | Settled for V1. |
| `activation.json` is a durably published workspace binding, not a symlink, in V1. | Settled for V1. |
| Install transaction state lives under the release store root's `installs/<activationId>.json`, not inside `activation.json`. | Settled for V1. |
| Mutating invocations create lease files; `fgctl` may stage/verify during leases but refuses activation while a non-stale mutating lease exists. | Settled for V1. |
| V1 does not do automatic state migration during upgrade/rollback. | Settled for V1. |
| `fgctl` never writes host-visible projection files directly; local `fgos init` / `doctor --fix` owns projection materialization under active identity. | Settled for V1. |
| Existing projects are adoptable: a missing state schema record is treated as schema `1` and written during local `fgos init`. | Settled for V1. |
| Source checkouts support explicit `dev:<rev>` activation for dogfood; it is non-distributable and skips immutable release guarantees. | Settled for V1. |
| `fgctl` V1 is a Rust bootstrap binary with local path/tarball and GitHub release asset as acquisition sources. | Settled for V1. |
| Candidate preflight is static: `fgctl` never executes candidate release code before the ready binding is published. | Settled for V1 (P7 red-team fix, 2026-09-14). |
| Shared gateway/web are architecture constraints only, not active delivery scope. | Promoted for active delivery. |
```

### Target unit

```text
#### Historical Decisions Promoted Or Tracked
```

### Unified diff

```diff
--- "docs/architect/packaging-distribution/runtime-identity-and-activation.md#historical-decisions-promoted-or-tracked"
+++ "docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md#historical-decisions-promoted-or-tracked"
@@ -1,22 +1 @@
-## Historical Decisions Promoted Or Tracked
-
-| Decision | Status |
-|---|---|
-| Runtime identity is digest-based, not PATH-based. | Settled for V1. |
-| `artifactDigest` is the digest of the canonical release tree manifest, not an archive digest. | Settled for V1. |
-| Release tree manifest uses normalized logical paths and refuses symlinks/case collisions in V1. | Settled for V1. |
-| Project commands enter through stable local shims under workspace `.fgos/installation/bin/`. | Settled for V1. |
-| Immutable release payloads live under a shared content-addressed machine/trust-domain release store, not under each worktree. | Settled for V1. |
-| Activation is per workspace via `.fgos/installation/activation.json`; there is no single repository-wide active runtime pointer in V1. | Settled for V1. |
-| Packaging release/activation state uses workspace installation roots and must not share a namespace with work coordination state. | Settled for V1. |
-| The project/team pin is tracked as `.fgos/distribution.json`; machine-local activation state remains ignored. | Settled for V1. |
-| `activation.json` is a durably published workspace binding, not a symlink, in V1. | Settled for V1. |
-| Install transaction state lives under the release store root's `installs/<activationId>.json`, not inside `activation.json`. | Settled for V1. |
-| Mutating invocations create lease files; `fgctl` may stage/verify during leases but refuses activation while a non-stale mutating lease exists. | Settled for V1. |
-| V1 does not do automatic state migration during upgrade/rollback. | Settled for V1. |
-| `fgctl` never writes host-visible projection files directly; local `fgos init` / `doctor --fix` owns projection materialization under active identity. | Settled for V1. |
-| Existing projects are adoptable: a missing state schema record is treated as schema `1` and written during local `fgos init`. | Settled for V1. |
-| Source checkouts support explicit `dev:<rev>` activation for dogfood; it is non-distributable and skips immutable release guarantees. | Settled for V1. |
-| `fgctl` V1 is a Rust bootstrap binary with local path/tarball and GitHub release asset as acquisition sources. | Settled for V1. |
-| Candidate preflight is static: `fgctl` never executes candidate release code before the ready binding is published. | Settled for V1 (P7 red-team fix, 2026-09-14). |
-| Shared gateway/web are architecture constraints only, not active delivery scope. | Promoted for active delivery. |
\ No newline at end of file
+#### Historical Decisions Promoted Or Tracked
\ No newline at end of file
```

## claim_12d5dbb269ca537c8e1923d57274a43f

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-7

Target: docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md#dev-source-activation-restoration-stub

Source identity digest: `0266dc3bbac745ba6953a93d03d3ccb6a9cfb9c06d3dfc4f760b28f5b9224bcf`

Target identity digest: `2cda289ff834706e95ac82903eb9518fc523d85011a80349900cb627158ddde1`

Source shown SHA256: `0266dc3bbac745ba6953a93d03d3ccb6a9cfb9c06d3dfc4f760b28f5b9224bcf`

Target shown SHA256: `43976f11724a656ad1ad1aa763e8cc3cbc3e4b1090279e9aacf3778241835d5a`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_12d5dbb269ca537c8e1923d57274a43f |
| sourceUnitDigest | 0266dc3bbac745ba6953a93d03d3ccb6a9cfb9c06d3dfc4f760b28f5b9224bcf |
| targetOwner | docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md |
| targetAnchor | dev-source-activation-restoration-stub |
| claimKind | decision |
| disposition | defer-with-owner |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The unheaded-block at docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-7 is one of the seven registered dev/source activation units. Restore remains owned by Plan C; the labelled stub tracks this exact unit. For the compound table, all non-dev clauses are retained in the stub companion table. No implementation or retirement verdict is asserted. |
| stubOwner | docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md |
| stubAnchor | dev-source-activation-restoration-stub |

### Source unit

```text
| Decision | Status |
|---|---|
| Runtime identity is digest-based, not PATH-based. | Settled for V1. |
| `artifactDigest` is the digest of the canonical release tree manifest, not an archive digest. | Settled for V1. |
| Release tree manifest uses normalized logical paths and refuses symlinks/case collisions in V1. | Settled for V1. |
| Project commands enter through stable local shims under workspace `.fgos/installation/bin/`. | Settled for V1. |
| Immutable release payloads live under a shared content-addressed machine/trust-domain release store, not under each worktree. | Settled for V1. |
| Activation is per workspace via `.fgos/installation/activation.json`; there is no single repository-wide active runtime pointer in V1. | Settled for V1. |
| Packaging release/activation state uses workspace installation roots and must not share a namespace with work coordination state. | Settled for V1. |
| The project/team pin is tracked as `.fgos/distribution.json`; machine-local activation state remains ignored. | Settled for V1. |
| `activation.json` is a durably published workspace binding, not a symlink, in V1. | Settled for V1. |
| Install transaction state lives under the release store root's `installs/<activationId>.json`, not inside `activation.json`. | Settled for V1. |
| Mutating invocations create lease files; `fgctl` may stage/verify during leases but refuses activation while a non-stale mutating lease exists. | Settled for V1. |
| V1 does not do automatic state migration during upgrade/rollback. | Settled for V1. |
| `fgctl` never writes host-visible projection files directly; local `fgos init` / `doctor --fix` owns projection materialization under active identity. | Settled for V1. |
| Existing projects are adoptable: a missing state schema record is treated as schema `1` and written during local `fgos init`. | Settled for V1. |
| Source checkouts support explicit `dev:<rev>` activation for dogfood; it is non-distributable and skips immutable release guarantees. | Settled for V1. |
| `fgctl` V1 is a Rust bootstrap binary with local path/tarball and GitHub release asset as acquisition sources. | Settled for V1. |
| Candidate preflight is static: `fgctl` never executes candidate release code before the ready binding is published. | Settled for V1 (P7 red-team fix, 2026-09-14). |
| Shared gateway/web are architecture constraints only, not active delivery scope. | Promoted for active delivery. |
```

### Target unit

```text
## Dev Source Activation Restoration Stub

Added in candidate — not carried; restoration tracked by dropped-001 and Plan C.

Restoration owner: Plan C (`plans/261006-1445-fgctl-dev-activation/`, draft, unscheduled). This is an explicit deferral of the seven source units, not an implementation or retirement verdict. The six units under Dev / Source Activation and the dev-source clause in the compound settled-facts table remain tracked in the source register. All other clauses of that table are retained below without promoting dev activation.

| Decision | Status |
|---|---|
| Runtime identity is digest-based, not PATH-based. | Settled for V1. |
| `artifactDigest` is the digest of the canonical release tree manifest, not an archive digest. | Settled for V1. |
| Release tree manifest uses normalized logical paths and refuses symlinks/case collisions in V1. | Settled for V1. |
| Project commands enter through stable local shims under workspace `.fgos/installation/bin/`. | Settled for V1. |
| Immutable release payloads live under a shared content-addressed machine/trust-domain release store, not under each worktree. | Settled for V1. |
| Activation is per workspace via `.fgos/installation/activation.json`; there is no single repository-wide active runtime pointer in V1. | Settled for V1. |
| Packaging release/activation state uses workspace installation roots and must not share a namespace with work coordination state. | Settled for V1. |
| The project/team pin is tracked as `.fgos/distribution.json`; machine-local activation state remains ignored. | Settled for V1. |
| `activation.json` is a durably published workspace binding, not a symlink, in V1. | Settled for V1. |
| Install transaction state lives under the release store root's `installs/<activationId>.json`, not inside `activation.json`. | Settled for V1. |
| Mutating invocations create lease files; `fgctl` may stage/verify during leases but refuses activation while a non-stale mutating lease exists. | Settled for V1. |
| V1 does not do automatic state migration during upgrade/rollback. | Settled for V1. |
| `fgctl` never writes host-visible projection files directly; local `fgos init` / `doctor --fix` owns projection materialization under active identity. | Settled for V1. |
| Existing projects are adoptable: a missing state schema record is treated as schema `1` and written during local `fgos init`. | Settled for V1. |
| Dev / source activation restoration is tracked by dropped-001 and Plan C. | Deferred; not carried in this candidate. |
| `fgctl` V1 is a Rust bootstrap binary with local path/tarball and GitHub release asset as acquisition sources. | Settled for V1. |
| Candidate preflight is static: `fgctl` never executes candidate release code before the ready binding is published. | Settled for V1 (P7 red-team fix, 2026-09-14). |
| Shared gateway/web are architecture constraints only, not active delivery scope. | Promoted for active delivery. |
```

### Unified diff

```diff
--- "docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-7"
+++ "docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md#dev-source-activation-restoration-stub"
@@ -1,3 +1,9 @@
+## Dev Source Activation Restoration Stub
+
+Added in candidate — not carried; restoration tracked by dropped-001 and Plan C.
+
+Restoration owner: Plan C (`plans/261006-1445-fgctl-dev-activation/`, draft, unscheduled). This is an explicit deferral of the seven source units, not an implementation or retirement verdict. The six units under Dev / Source Activation and the dev-source clause in the compound settled-facts table remain tracked in the source register. All other clauses of that table are retained below without promoting dev activation.
+
 | Decision | Status |
 |---|---|
 | Runtime identity is digest-based, not PATH-based. | Settled for V1. |
@@ -14,7 +20,7 @@
 | V1 does not do automatic state migration during upgrade/rollback. | Settled for V1. |
 | `fgctl` never writes host-visible projection files directly; local `fgos init` / `doctor --fix` owns projection materialization under active identity. | Settled for V1. |
 | Existing projects are adoptable: a missing state schema record is treated as schema `1` and written during local `fgos init`. | Settled for V1. |
-| Source checkouts support explicit `dev:<rev>` activation for dogfood; it is non-distributable and skips immutable release guarantees. | Settled for V1. |
+| Dev / source activation restoration is tracked by dropped-001 and Plan C. | Deferred; not carried in this candidate. |
 | `fgctl` V1 is a Rust bootstrap binary with local path/tarball and GitHub release asset as acquisition sources. | Settled for V1. |
 | Candidate preflight is static: `fgctl` never executes candidate release code before the ready binding is published. | Settled for V1 (P7 red-team fix, 2026-09-14). |
 | Shared gateway/web are architecture constraints only, not active delivery scope. | Promoted for active delivery. |
\ No newline at end of file
```

## claim_66b58ad141eda076944d47edf360f2e1

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#1-core-position

Target: docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md#1-core-position-1

Source identity digest: `208048747e295cc9bf730f72f78c838bf349edee7ae900887cb351e2b6eeba65`

Target identity digest: `d8443cfa2f90ab369871a7afb68ef2e5c9552854977a85ca831db6fa3661f2a5`

Source shown SHA256: `ac39f3c827fdcec6f35ed2793244c447c4fc85b97b509ff2257bd5b90fb801a0`

Target shown SHA256: `af446611e59b76d27b38c2be6f5f1415989dd79ef62ea71ac2eb0fc4bb5fdb72`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_66b58ad141eda076944d47edf360f2e1 |
| sourceUnitDigest | 208048747e295cc9bf730f72f78c838bf349edee7ae900887cb351e2b6eeba65 |
| targetOwner | docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md |
| targetAnchor | 1-core-position-1 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete heading from docs/architect/packaging-distribution/runtime-identity-and-activation.md#1-core-position, under "1. Core Position", is retained at docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md#1-core-position-1. Only heading depth changes; the direct section payload follows the original source order. The named owner is the architecture/runtime-identity-and-activation.md topic owner; carriage does not certify current implementation. |

### Source unit

````text
## 1. Core Position

The project-local fgOS runtime must be selected by a workspace activation
binding, not by whatever executable happens to be on `PATH`.

```txt
fgctl
  acquires/stages/verifies immutable releases in the shared release store
  prepares a workspace installation capsule
  publishes a ready workspace activation binding

local fgos
  runs only after a ready workspace activation binding is known
  owns project workflow semantics under that active identity
```

Runtime identity is digest-based. The artifact identity is the digest of the
canonical release tree manifest, not the digest of a compressed archive.
Version/tag/channel are human-facing metadata and selection policy. They are
not the final proof of what is installed.
````

### Target unit

````text
#### 1. Core Position

The project-local fgOS runtime must be selected by a workspace activation
binding, not by whatever executable happens to be on `PATH`.

```txt
fgctl
  acquires/stages/verifies immutable releases in the shared release store
  prepares a workspace installation capsule
  publishes a ready workspace activation binding

local fgos
  runs only after a ready workspace activation binding is known
  owns project workflow semantics under that active identity
```

Runtime identity is digest-based. The artifact identity is the digest of the
canonical release tree manifest, not the digest of a compressed archive.
Version/tag/channel are human-facing metadata and selection policy. They are
not the final proof of what is installed.
````

### Unified diff

```diff
--- "docs/architect/packaging-distribution/runtime-identity-and-activation.md#1-core-position"
+++ "docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md#1-core-position-1"
@@ -1,4 +1,4 @@
-## 1. Core Position
+#### 1. Core Position
 
 The project-local fgOS runtime must be selected by a workspace activation
 binding, not by whatever executable happens to be on `PATH`.
```

## claim_b3a8dbb74fb0731a881627328e2e80fa

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-8

Target: docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md#unheaded-block-31

Source identity digest: `f4738d29d59228f681a01636dbdb6b1078c7b5caae4741dbff9e435e2d73daf6`

Target identity digest: `f4738d29d59228f681a01636dbdb6b1078c7b5caae4741dbff9e435e2d73daf6`

Source shown SHA256: `f4738d29d59228f681a01636dbdb6b1078c7b5caae4741dbff9e435e2d73daf6`

Target shown SHA256: `f4738d29d59228f681a01636dbdb6b1078c7b5caae4741dbff9e435e2d73daf6`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_b3a8dbb74fb0731a881627328e2e80fa |
| sourceUnitDigest | f4738d29d59228f681a01636dbdb6b1078c7b5caae4741dbff9e435e2d73daf6 |
| targetOwner | docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md |
| targetAnchor | unheaded-block-31 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-8, under "1. Core Position", is retained at docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md#unheaded-block-31. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the architecture/runtime-identity-and-activation.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
The project-local fgOS runtime must be selected by a workspace activation
binding, not by whatever executable happens to be on `PATH`.
```

### Target unit

```text
The project-local fgOS runtime must be selected by a workspace activation
binding, not by whatever executable happens to be on `PATH`.
```

### Unified diff

```diff
No text difference.
```

## claim_aaf3be3d5306a121c46039453a59cbd6

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-9

Target: docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md#unheaded-block-32

Source identity digest: `7f9fba2427a6cbead6bceb56c0311556d7b029a12b3fd0d041fa77b5f46c72bd`

Target identity digest: `7f9fba2427a6cbead6bceb56c0311556d7b029a12b3fd0d041fa77b5f46c72bd`

Source shown SHA256: `7f9fba2427a6cbead6bceb56c0311556d7b029a12b3fd0d041fa77b5f46c72bd`

Target shown SHA256: `7f9fba2427a6cbead6bceb56c0311556d7b029a12b3fd0d041fa77b5f46c72bd`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_aaf3be3d5306a121c46039453a59cbd6 |
| sourceUnitDigest | 7f9fba2427a6cbead6bceb56c0311556d7b029a12b3fd0d041fa77b5f46c72bd |
| targetOwner | docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md |
| targetAnchor | unheaded-block-32 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-9, under "1. Core Position", is retained at docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md#unheaded-block-32. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the architecture/runtime-identity-and-activation.md topic owner; carriage does not certify current implementation. |

### Source unit

````text
```txt
fgctl
  acquires/stages/verifies immutable releases in the shared release store
  prepares a workspace installation capsule
  publishes a ready workspace activation binding

local fgos
  runs only after a ready workspace activation binding is known
  owns project workflow semantics under that active identity
```
````

### Target unit

````text
```txt
fgctl
  acquires/stages/verifies immutable releases in the shared release store
  prepares a workspace installation capsule
  publishes a ready workspace activation binding

local fgos
  runs only after a ready workspace activation binding is known
  owns project workflow semantics under that active identity
```
````

### Unified diff

```diff
No text difference.
```

## claim_c37dcdbe6ae24c4921c70633185cd44c

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-10

Target: docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md#unheaded-block-33

Source identity digest: `c3de0f56b6d14690ce7995a6de111f721e00bd8f832910129de11eb41b6ea462`

Target identity digest: `c3de0f56b6d14690ce7995a6de111f721e00bd8f832910129de11eb41b6ea462`

Source shown SHA256: `c3de0f56b6d14690ce7995a6de111f721e00bd8f832910129de11eb41b6ea462`

Target shown SHA256: `c3de0f56b6d14690ce7995a6de111f721e00bd8f832910129de11eb41b6ea462`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_c37dcdbe6ae24c4921c70633185cd44c |
| sourceUnitDigest | c3de0f56b6d14690ce7995a6de111f721e00bd8f832910129de11eb41b6ea462 |
| targetOwner | docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md |
| targetAnchor | unheaded-block-33 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-10, under "1. Core Position", is retained at docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md#unheaded-block-33. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the architecture/runtime-identity-and-activation.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
Runtime identity is digest-based. The artifact identity is the digest of the
canonical release tree manifest, not the digest of a compressed archive.
Version/tag/channel are human-facing metadata and selection policy. They are
not the final proof of what is installed.
```

### Target unit

```text
Runtime identity is digest-based. The artifact identity is the digest of the
canonical release tree manifest, not the digest of a compressed archive.
Version/tag/channel are human-facing metadata and selection policy. They are
not the final proof of what is installed.
```

### Unified diff

```diff
No text difference.
```

## claim_abc2a0de9c412207cb045053290a4e89

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#2-runtime-lifecycle

Target: docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md#2-runtime-lifecycle

Source identity digest: `8996967b902aee535019572e8977eec933f206af22143c70a777877bf9f76011`

Target identity digest: `ea8fc72b458939fea472d94d2c8d3c516dc13a412e087cf565da924b621460a9`

Source shown SHA256: `3938231a39f02181edc81db534affb56e3e39723f2b1daa593c036ced9972bf0`

Target shown SHA256: `3f34ba44bf5b3cadd345830dff5b00f51568a8bcd5d83f035347eecbb7cd1664`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_abc2a0de9c412207cb045053290a4e89 |
| sourceUnitDigest | 8996967b902aee535019572e8977eec933f206af22143c70a777877bf9f76011 |
| targetOwner | docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md |
| targetAnchor | 2-runtime-lifecycle |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete heading from docs/architect/packaging-distribution/runtime-identity-and-activation.md#2-runtime-lifecycle, under "2. Runtime Lifecycle", is retained at docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md#2-runtime-lifecycle. Only heading depth changes; the direct section payload follows the original source order. The named owner is the architecture/runtime-identity-and-activation.md topic owner; carriage does not certify current implementation. |

### Source unit

````text
## 2. Runtime Lifecycle

The install/upgrade/repair lifecycle is:

```txt
acquire artifact
  -> stage immutable payload
  -> verify release manifest
  -> prepare workspace installation capsule
  -> publish ready workspace activation binding atomically
  -> invoke active local fgos init / doctor --fix / doctor for projection/config repair
  -> allow project-state mutation
```

No project workflow command should mutate project state from a payload that has
not crossed the activation boundary.

Candidate releases may run only bootstrap/preflight checks before activation.
They must not write host-visible projection paths such as `.agents/`, `.claude/`,
or `AGENTS.md`. Projection materialization happens after the ready activation
binding exists, through the active local `fgos` command. If that tail fails, the
activation remains the selected runtime but the workspace is reported
`ready-degraded` until `fgos doctor --fix` repairs it.
````

### Target unit

````text
#### 2. Runtime Lifecycle

The install/upgrade/repair lifecycle is:

```txt
acquire artifact
  -> stage immutable payload
  -> verify release manifest
  -> prepare workspace installation capsule
  -> publish ready workspace activation binding atomically
  -> invoke active local fgos init / doctor --fix / doctor for projection/config repair
  -> allow project-state mutation
```

No project workflow command should mutate project state from a payload that has
not crossed the activation boundary.

Candidate releases may run only bootstrap/preflight checks before activation.
They must not write host-visible projection paths such as `.agents/`, `.claude/`,
or `AGENTS.md`. Projection materialization happens after the ready activation
binding exists, through the active local `fgos` command. If that tail fails, the
activation remains the selected runtime but the workspace is reported
`ready-degraded` until `fgos doctor --fix` repairs it.
````

### Unified diff

```diff
--- "docs/architect/packaging-distribution/runtime-identity-and-activation.md#2-runtime-lifecycle"
+++ "docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md#2-runtime-lifecycle"
@@ -1,4 +1,4 @@
-## 2. Runtime Lifecycle
+#### 2. Runtime Lifecycle
 
 The install/upgrade/repair lifecycle is:
```

## claim_74c5730141447c8e8ba33ab0cf2d3d66

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-11

Target: docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md#unheaded-block-34

Source identity digest: `9f5f2a73781943935b3a9b8f540165d30dc6edd71a6f02f320511a328ba250e1`

Target identity digest: `9f5f2a73781943935b3a9b8f540165d30dc6edd71a6f02f320511a328ba250e1`

Source shown SHA256: `9f5f2a73781943935b3a9b8f540165d30dc6edd71a6f02f320511a328ba250e1`

Target shown SHA256: `9f5f2a73781943935b3a9b8f540165d30dc6edd71a6f02f320511a328ba250e1`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_74c5730141447c8e8ba33ab0cf2d3d66 |
| sourceUnitDigest | 9f5f2a73781943935b3a9b8f540165d30dc6edd71a6f02f320511a328ba250e1 |
| targetOwner | docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md |
| targetAnchor | unheaded-block-34 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-11, under "2. Runtime Lifecycle", is retained at docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md#unheaded-block-34. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the architecture/runtime-identity-and-activation.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
The install/upgrade/repair lifecycle is:
```

### Target unit

```text
The install/upgrade/repair lifecycle is:
```

### Unified diff

```diff
No text difference.
```

## claim_6057d124ab44d29d90945fa60f209319

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-12

Target: docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md#unheaded-block-35

Source identity digest: `3c4c222ca843dec72aaa0e7795e528fd329fbd0385edad9eb0c6f80e39a1b5c1`

Target identity digest: `3c4c222ca843dec72aaa0e7795e528fd329fbd0385edad9eb0c6f80e39a1b5c1`

Source shown SHA256: `3c4c222ca843dec72aaa0e7795e528fd329fbd0385edad9eb0c6f80e39a1b5c1`

Target shown SHA256: `3c4c222ca843dec72aaa0e7795e528fd329fbd0385edad9eb0c6f80e39a1b5c1`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_6057d124ab44d29d90945fa60f209319 |
| sourceUnitDigest | 3c4c222ca843dec72aaa0e7795e528fd329fbd0385edad9eb0c6f80e39a1b5c1 |
| targetOwner | docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md |
| targetAnchor | unheaded-block-35 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-12, under "2. Runtime Lifecycle", is retained at docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md#unheaded-block-35. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the architecture/runtime-identity-and-activation.md topic owner; carriage does not certify current implementation. |

### Source unit

````text
```txt
acquire artifact
  -> stage immutable payload
  -> verify release manifest
  -> prepare workspace installation capsule
  -> publish ready workspace activation binding atomically
  -> invoke active local fgos init / doctor --fix / doctor for projection/config repair
  -> allow project-state mutation
```
````

### Target unit

````text
```txt
acquire artifact
  -> stage immutable payload
  -> verify release manifest
  -> prepare workspace installation capsule
  -> publish ready workspace activation binding atomically
  -> invoke active local fgos init / doctor --fix / doctor for projection/config repair
  -> allow project-state mutation
```
````

### Unified diff

```diff
No text difference.
```

## claim_659b692c5498f117fc6aeb1a67380a0d

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-13

Target: docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md#unheaded-block-36

Source identity digest: `101b41019955eaf805c687c04e44d477390b20ec7505b4ca1cdf8dadd919be33`

Target identity digest: `101b41019955eaf805c687c04e44d477390b20ec7505b4ca1cdf8dadd919be33`

Source shown SHA256: `101b41019955eaf805c687c04e44d477390b20ec7505b4ca1cdf8dadd919be33`

Target shown SHA256: `101b41019955eaf805c687c04e44d477390b20ec7505b4ca1cdf8dadd919be33`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_659b692c5498f117fc6aeb1a67380a0d |
| sourceUnitDigest | 101b41019955eaf805c687c04e44d477390b20ec7505b4ca1cdf8dadd919be33 |
| targetOwner | docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md |
| targetAnchor | unheaded-block-36 |
| claimKind | contract |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-13, under "2. Runtime Lifecycle", is retained at docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md#unheaded-block-36. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the architecture/runtime-identity-and-activation.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
No project workflow command should mutate project state from a payload that has
not crossed the activation boundary.
```

### Target unit

```text
No project workflow command should mutate project state from a payload that has
not crossed the activation boundary.
```

### Unified diff

```diff
No text difference.
```

## claim_7d62eb2a58328da0a2a9901c3a79533c

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-14

Target: docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md#unheaded-block-37

Source identity digest: `5b2c3b2fc2847d264ba4a59ec44331fee37fddd029c8a41c52449f9403e1a24f`

Target identity digest: `5b2c3b2fc2847d264ba4a59ec44331fee37fddd029c8a41c52449f9403e1a24f`

Source shown SHA256: `5b2c3b2fc2847d264ba4a59ec44331fee37fddd029c8a41c52449f9403e1a24f`

Target shown SHA256: `5b2c3b2fc2847d264ba4a59ec44331fee37fddd029c8a41c52449f9403e1a24f`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_7d62eb2a58328da0a2a9901c3a79533c |
| sourceUnitDigest | 5b2c3b2fc2847d264ba4a59ec44331fee37fddd029c8a41c52449f9403e1a24f |
| targetOwner | docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md |
| targetAnchor | unheaded-block-37 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-14, under "2. Runtime Lifecycle", is retained at docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md#unheaded-block-37. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the architecture/runtime-identity-and-activation.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
Candidate releases may run only bootstrap/preflight checks before activation.
They must not write host-visible projection paths such as `.agents/`, `.claude/`,
or `AGENTS.md`. Projection materialization happens after the ready activation
binding exists, through the active local `fgos` command. If that tail fails, the
activation remains the selected runtime but the workspace is reported
`ready-degraded` until `fgos doctor --fix` repairs it.
```

### Target unit

```text
Candidate releases may run only bootstrap/preflight checks before activation.
They must not write host-visible projection paths such as `.agents/`, `.claude/`,
or `AGENTS.md`. Projection materialization happens after the ready activation
binding exists, through the active local `fgos` command. If that tail fails, the
activation remains the selected runtime but the workspace is reported
`ready-degraded` until `fgos doctor --fix` repairs it.
```

### Unified diff

```diff
No text difference.
```

## claim_730ffda554a0b85dda9cf5813e028e29

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#3-roots-and-on-disk-shape

Target: docs/platform/packaging-distribution/contracts/repository-runtime-layout.md#3-roots-and-on-disk-shape

Source identity digest: `b41bcf03b6d6a9dc66be65ebf2042fff6580124af3dfbf01722a3a2cef476258`

Target identity digest: `8663234273000c940a8a87fcb1ecec9558e979f5135b38d28a91f7ad61474f1a`

Source shown SHA256: `8a83eda89b5005e0c4603001582fa890d1dc3c0d9a020988966b45d24b38e3bf`

Target shown SHA256: `a5b202934f25ebb797bd26ab544ca4e3f4d5dec6f0af61982e4fe49cd85ecf5d`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_730ffda554a0b85dda9cf5813e028e29 |
| sourceUnitDigest | b41bcf03b6d6a9dc66be65ebf2042fff6580124af3dfbf01722a3a2cef476258 |
| targetOwner | docs/platform/packaging-distribution/contracts/repository-runtime-layout.md |
| targetAnchor | 3-roots-and-on-disk-shape |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete heading from docs/architect/packaging-distribution/runtime-identity-and-activation.md#3-roots-and-on-disk-shape, under "3. Roots And On-Disk Shape", is retained at docs/platform/packaging-distribution/contracts/repository-runtime-layout.md#3-roots-and-on-disk-shape. Only heading depth changes; the direct section payload follows the original source order. The named owner is the contracts/repository-runtime-layout.md topic owner; carriage does not certify current implementation. |

### Source unit

````text
## 3. Roots And On-Disk Shape

The root topology is defined in
[Workspace Topology Architecture](../workspace-topology.md). This document uses
that topology and focuses on runtime identity records.

The minimum shape is:


```txt
workspace root:
  .fgos/
    config.json             # tracked workspace/branch policy
    distribution.json       # tracked team/project pin
    installation/
      bin/
        fgos                # ignored stable workspace shim
        fgos-runner         # ignored stable workspace shim
      root.json             # ignored TopologyContext/root binding snapshot
      activation.json       # ignored per-workspace ready binding
      projections/
        ledger.json         # ignored per-workspace projection ledger

workHistoryRoot(workStateId):
  active-events/            # hot durable history; physical placement owned by topology/work-state
  schema.json               # current work-state schema record
  derived/

runtimeCoordinationRoot(workStateId):
  claims/
  sessions/
  leases/
  locks/

machineReleaseStore:
  releases/
    <artifactDigest>/
      manifest.json
      bin/
        fgos
        fgos-runner
      libexec/
        legacy-node/
      workshop/
        skills/
        agents/
        prose/
      docs/
  installs/
    <activationId>.json
  install.lock
  quarantine/
```

The separation is architectural:

- release store `releases/<artifactDigest>/` is immutable release payload;
- workspace `.fgos/installation/bin/*` is the stable local entry surface;
- workspace `.fgos/installation/activation.json` selects the active runtime for
  that workspace only;
- workspace `.fgos/config.json` is tracked workspace/branch policy;
- workspace `.fgos/distribution.json` is tracked runtime pin policy and may
  differ by branch/worktree;
- workspace `.fgos/installation/projections/ledger.json` records projections for
  that workspace only;
- `workHistoryRoot(workStateId)` owns durable workflow history, not packaging;
- `runtimeCoordinationRoot(workStateId)` owns claims/sessions/leases/locks and
  must not share a namespace with release/activation records;
- config, event history, coordination, cache, activation, and projections have
  distinct state classes per
  [Workspace Topology Architecture](../workspace-topology.md).

Worker workspaces still need an installation capsule if commands are expected
to enter through local shims. They must not symlink or copy the entire shared
`.fgos` state tree. The minimum worker capsule is:

```txt
worker workspace:
  .fgos/
    distribution.json        # checked out with the branch when present
    installation/
      bin/fgos
      bin/fgos-runner
      root.json              # binds shared workState/release/coordination roots
      activation.json
      projections/ledger.json
```

If `.fgos/distribution.json` exists but the release store has not staged its
requested release, the workspace is in `pinned-not-staged`. `fgctl init` must
acquire/stage the pinned release and publish this workspace's activation
binding, not silently choose latest.

Possible tracked pin shape:

```json
{
  "schemaVersion": 1,
  "projectRuntime": {
    "policy": "exact-digest",
    "artifactDigest": "sha256:...",
    "releaseVersion": "0.1.0",
    "channel": null,
    "allowPrerelease": false
  }
}
```

Root resolution order for the stable shim:

```txt
1. read workspace .fgos/installation/root.json if present;
2. otherwise resolve TopologyContext for repository/workspace/work-state identity;
3. read machineReleaseStore from TopologyContext;
4. read workspace .fgos/installation/activation.json;
5. exec releases/<artifactDigest>/bin/<entry>.
```

The shim must not treat a shared release store as a shared active runtime. Two
worktrees may use different activation bindings while sharing the same
content-addressed releases.

`<artifactDigest>` is a path-safe digest identity for the canonical release
tree manifest, for example `sha256-abc123...`. It is not the path humans,
agents, gateway, or runner supervisors should call directly. The stable command
path is:

```txt
.fgos/installation/bin/fgos
.fgos/installation/bin/fgos-runner
```

Those entries are thin local shims. A shim should do only the minimum required
to enter the active release:

```txt
resolve machineReleaseStore from TopologyContext/root binding
read workspace .fgos/installation/activation.json
resolve artifactDigest to releases/<digest>/
verify the target entry exists
exec the active release binary
```

It must not scan the full workspace, verify every fingerprint, resolve network
versions, run doctor checks, or load broad registries on every command. Full
verification belongs to install/repair/doctor paths. The normal command
overhead should be limited to reading one small record and executing the active
binary.

Shim forward-compatibility rule: the shim reads only `schemaVersion`,
`artifactDigest`, and `releasePath` from workspace `activation.json`. Broader
activation metadata may evolve without requiring every stable shim to be
replaced.

The alternative is a `current` symlink, but the preferred V1 is a shim because
it works more consistently on Windows, can produce clear errors when the active
release is missing, and can later add a lightweight invocation lease without
depending on filesystem symlink behavior.
````

### Target unit

````text
#### 3. Roots And On-Disk Shape

The root topology is defined in
[Workspace Topology Architecture](../../../architect/workspace-topology.md). This document uses
that topology and focuses on runtime identity records.

The minimum shape is:


```txt
workspace root:
  .fgos/
    config.json             # tracked workspace/branch policy
    distribution.json       # tracked team/project pin
    installation/
      bin/
        fgos                # ignored stable workspace shim
        fgos-runner         # ignored stable workspace shim
      root.json             # ignored TopologyContext/root binding snapshot
      activation.json       # ignored per-workspace ready binding
      projections/
        ledger.json         # ignored per-workspace projection ledger

workHistoryRoot(workStateId):
  active-events/            # hot durable history; physical placement owned by topology/work-state
  schema.json               # current work-state schema record
  derived/

runtimeCoordinationRoot(workStateId):
  claims/
  sessions/
  leases/
  locks/

machineReleaseStore:
  releases/
    <artifactDigest>/
      manifest.json
      bin/
        fgos
        fgos-runner
      libexec/
        legacy-node/
      workshop/
        skills/
        agents/
        prose/
      docs/
  installs/
    <activationId>.json
  install.lock
  quarantine/
```

The separation is architectural:

- release store `releases/<artifactDigest>/` is immutable release payload;
- workspace `.fgos/installation/bin/*` is the stable local entry surface;
- workspace `.fgos/installation/activation.json` selects the active runtime for
  that workspace only;
- workspace `.fgos/config.json` is tracked workspace/branch policy;
- workspace `.fgos/distribution.json` is tracked runtime pin policy and may
  differ by branch/worktree;
- workspace `.fgos/installation/projections/ledger.json` records projections for
  that workspace only;
- `workHistoryRoot(workStateId)` owns durable workflow history, not packaging;
- `runtimeCoordinationRoot(workStateId)` owns claims/sessions/leases/locks and
  must not share a namespace with release/activation records;
- config, event history, coordination, cache, activation, and projections have
  distinct state classes per
  [Workspace Topology Architecture](../../../architect/workspace-topology.md).

Worker workspaces still need an installation capsule if commands are expected
to enter through local shims. They must not symlink or copy the entire shared
`.fgos` state tree. The minimum worker capsule is:

```txt
worker workspace:
  .fgos/
    distribution.json        # checked out with the branch when present
    installation/
      bin/fgos
      bin/fgos-runner
      root.json              # binds shared workState/release/coordination roots
      activation.json
      projections/ledger.json
```

If `.fgos/distribution.json` exists but the release store has not staged its
requested release, the workspace is in `pinned-not-staged`. `fgctl init` must
acquire/stage the pinned release and publish this workspace's activation
binding, not silently choose latest.

Possible tracked pin shape:

```json
{
  "schemaVersion": 1,
  "projectRuntime": {
    "policy": "exact-digest",
    "artifactDigest": "sha256:...",
    "releaseVersion": "0.1.0",
    "channel": null,
    "allowPrerelease": false
  }
}
```

Root resolution order for the stable shim:

```txt
1. read workspace .fgos/installation/root.json if present;
2. otherwise resolve TopologyContext for repository/workspace/work-state identity;
3. read machineReleaseStore from TopologyContext;
4. read workspace .fgos/installation/activation.json;
5. exec releases/<artifactDigest>/bin/<entry>.
```

The shim must not treat a shared release store as a shared active runtime. Two
worktrees may use different activation bindings while sharing the same
content-addressed releases.

`<artifactDigest>` is a path-safe digest identity for the canonical release
tree manifest, for example `sha256-abc123...`. It is not the path humans,
agents, gateway, or runner supervisors should call directly. The stable command
path is:

```txt
.fgos/installation/bin/fgos
.fgos/installation/bin/fgos-runner
```

Those entries are thin local shims. A shim should do only the minimum required
to enter the active release:

```txt
resolve machineReleaseStore from TopologyContext/root binding
read workspace .fgos/installation/activation.json
resolve artifactDigest to releases/<digest>/
verify the target entry exists
exec the active release binary
```

It must not scan the full workspace, verify every fingerprint, resolve network
versions, run doctor checks, or load broad registries on every command. Full
verification belongs to install/repair/doctor paths. The normal command
overhead should be limited to reading one small record and executing the active
binary.

Shim forward-compatibility rule: the shim reads only `schemaVersion`,
`artifactDigest`, and `releasePath` from workspace `activation.json`. Broader
activation metadata may evolve without requiring every stable shim to be
replaced.

The alternative is a `current` symlink, but the preferred V1 is a shim because
it works more consistently on Windows, can produce clear errors when the active
release is missing, and can later add a lightweight invocation lease without
depending on filesystem symlink behavior.
````

### Unified diff

```diff
--- "docs/architect/packaging-distribution/runtime-identity-and-activation.md#3-roots-and-on-disk-shape"
+++ "docs/platform/packaging-distribution/contracts/repository-runtime-layout.md#3-roots-and-on-disk-shape"
@@ -1,7 +1,7 @@
-## 3. Roots And On-Disk Shape
+#### 3. Roots And On-Disk Shape
 
 The root topology is defined in
-[Workspace Topology Architecture](../workspace-topology.md). This document uses
+[Workspace Topology Architecture](../../../architect/workspace-topology.md). This document uses
 that topology and focuses on runtime identity records.
 
 The minimum shape is:
@@ -68,7 +68,7 @@ The separation is architectural:
   must not share a namespace with release/activation records;
 - config, event history, coordination, cache, activation, and projections have
   distinct state classes per
-  [Workspace Topology Architecture](../workspace-topology.md).
+  [Workspace Topology Architecture](../../../architect/workspace-topology.md).
 
 Worker workspaces still need an installation capsule if commands are expected
 to enter through local shims. They must not symlink or copy the entire shared
```

## claim_a2ffbcf3bf179c454c210a649e55c3e8

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-15

Target: docs/platform/packaging-distribution/contracts/repository-runtime-layout.md#unheaded-block-21

Source identity digest: `e765d47bd516e2958821d51c8ebe11e5c8029732a3be0d45285dd1ddabcdacfd`

Target identity digest: `bed9bf803d2c33e72ec33d712567dd322f7c5b20fff0747060948c46c4ad348b`

Source shown SHA256: `e765d47bd516e2958821d51c8ebe11e5c8029732a3be0d45285dd1ddabcdacfd`

Target shown SHA256: `bed9bf803d2c33e72ec33d712567dd322f7c5b20fff0747060948c46c4ad348b`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_a2ffbcf3bf179c454c210a649e55c3e8 |
| sourceUnitDigest | e765d47bd516e2958821d51c8ebe11e5c8029732a3be0d45285dd1ddabcdacfd |
| targetOwner | docs/platform/packaging-distribution/contracts/repository-runtime-layout.md |
| targetAnchor | unheaded-block-21 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-15, under "3. Roots And On-Disk Shape", is retained at docs/platform/packaging-distribution/contracts/repository-runtime-layout.md#unheaded-block-21. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the contracts/repository-runtime-layout.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
The root topology is defined in
[Workspace Topology Architecture](../workspace-topology.md). This document uses
that topology and focuses on runtime identity records.
```

### Target unit

```text
The root topology is defined in
[Workspace Topology Architecture](../../../architect/workspace-topology.md). This document uses
that topology and focuses on runtime identity records.
```

### Unified diff

```diff
--- "docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-15"
+++ "docs/platform/packaging-distribution/contracts/repository-runtime-layout.md#unheaded-block-21"
@@ -1,3 +1,3 @@
 The root topology is defined in
-[Workspace Topology Architecture](../workspace-topology.md). This document uses
+[Workspace Topology Architecture](../../../architect/workspace-topology.md). This document uses
 that topology and focuses on runtime identity records.
\ No newline at end of file
```

## claim_734e7078568afb68a70dd0e07119dea1

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-16

Target: docs/platform/packaging-distribution/contracts/repository-runtime-layout.md#unheaded-block-22

Source identity digest: `e177cd634ccbeb3491a371a5e05f52476c693db7d52385b6cb6d653499c42936`

Target identity digest: `e177cd634ccbeb3491a371a5e05f52476c693db7d52385b6cb6d653499c42936`

Source shown SHA256: `e177cd634ccbeb3491a371a5e05f52476c693db7d52385b6cb6d653499c42936`

Target shown SHA256: `e177cd634ccbeb3491a371a5e05f52476c693db7d52385b6cb6d653499c42936`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_734e7078568afb68a70dd0e07119dea1 |
| sourceUnitDigest | e177cd634ccbeb3491a371a5e05f52476c693db7d52385b6cb6d653499c42936 |
| targetOwner | docs/platform/packaging-distribution/contracts/repository-runtime-layout.md |
| targetAnchor | unheaded-block-22 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-16, under "3. Roots And On-Disk Shape", is retained at docs/platform/packaging-distribution/contracts/repository-runtime-layout.md#unheaded-block-22. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the contracts/repository-runtime-layout.md topic owner; carriage does not certify current implementation. |

### Source unit

````text
The minimum shape is:


```txt
workspace root:
  .fgos/
    config.json             # tracked workspace/branch policy
    distribution.json       # tracked team/project pin
    installation/
      bin/
        fgos                # ignored stable workspace shim
        fgos-runner         # ignored stable workspace shim
      root.json             # ignored TopologyContext/root binding snapshot
      activation.json       # ignored per-workspace ready binding
      projections/
        ledger.json         # ignored per-workspace projection ledger

workHistoryRoot(workStateId):
  active-events/            # hot durable history; physical placement owned by topology/work-state
  schema.json               # current work-state schema record
  derived/

runtimeCoordinationRoot(workStateId):
  claims/
  sessions/
  leases/
  locks/

machineReleaseStore:
  releases/
    <artifactDigest>/
      manifest.json
      bin/
        fgos
        fgos-runner
      libexec/
        legacy-node/
      workshop/
        skills/
        agents/
        prose/
      docs/
  installs/
    <activationId>.json
  install.lock
  quarantine/
```
````

### Target unit

````text
The minimum shape is:


```txt
workspace root:
  .fgos/
    config.json             # tracked workspace/branch policy
    distribution.json       # tracked team/project pin
    installation/
      bin/
        fgos                # ignored stable workspace shim
        fgos-runner         # ignored stable workspace shim
      root.json             # ignored TopologyContext/root binding snapshot
      activation.json       # ignored per-workspace ready binding
      projections/
        ledger.json         # ignored per-workspace projection ledger

workHistoryRoot(workStateId):
  active-events/            # hot durable history; physical placement owned by topology/work-state
  schema.json               # current work-state schema record
  derived/

runtimeCoordinationRoot(workStateId):
  claims/
  sessions/
  leases/
  locks/

machineReleaseStore:
  releases/
    <artifactDigest>/
      manifest.json
      bin/
        fgos
        fgos-runner
      libexec/
        legacy-node/
      workshop/
        skills/
        agents/
        prose/
      docs/
  installs/
    <activationId>.json
  install.lock
  quarantine/
```
````

### Unified diff

```diff
No text difference.
```

## claim_4ecf15f45c6d4ae5224b0c4fc9924184

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-17

Target: docs/platform/packaging-distribution/contracts/repository-runtime-layout.md#unheaded-block-23

Source identity digest: `dde0daf3a23c57b8c5f0542c917ba9e4052c45fcdc286f6875216bd65eed2854`

Target identity digest: `dde0daf3a23c57b8c5f0542c917ba9e4052c45fcdc286f6875216bd65eed2854`

Source shown SHA256: `dde0daf3a23c57b8c5f0542c917ba9e4052c45fcdc286f6875216bd65eed2854`

Target shown SHA256: `dde0daf3a23c57b8c5f0542c917ba9e4052c45fcdc286f6875216bd65eed2854`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_4ecf15f45c6d4ae5224b0c4fc9924184 |
| sourceUnitDigest | dde0daf3a23c57b8c5f0542c917ba9e4052c45fcdc286f6875216bd65eed2854 |
| targetOwner | docs/platform/packaging-distribution/contracts/repository-runtime-layout.md |
| targetAnchor | unheaded-block-23 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-17, under "3. Roots And On-Disk Shape", is retained at docs/platform/packaging-distribution/contracts/repository-runtime-layout.md#unheaded-block-23. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the contracts/repository-runtime-layout.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
The separation is architectural:
```

### Target unit

```text
The separation is architectural:
```

### Unified diff

```diff
No text difference.
```

## claim_2dec8131bea8fca857c017c1744f5f87

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-18

Target: docs/platform/packaging-distribution/contracts/repository-runtime-layout.md#unheaded-block-24

Source identity digest: `9a4418a0270aaf7efb1a193bf3268842bc26fd704b486b9a9766f519ac9ce4b2`

Target identity digest: `54fc6294ee0fb2999689259d21a78848ea10781e84ee5484af55747d4336c303`

Source shown SHA256: `9a4418a0270aaf7efb1a193bf3268842bc26fd704b486b9a9766f519ac9ce4b2`

Target shown SHA256: `54fc6294ee0fb2999689259d21a78848ea10781e84ee5484af55747d4336c303`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_2dec8131bea8fca857c017c1744f5f87 |
| sourceUnitDigest | 9a4418a0270aaf7efb1a193bf3268842bc26fd704b486b9a9766f519ac9ce4b2 |
| targetOwner | docs/platform/packaging-distribution/contracts/repository-runtime-layout.md |
| targetAnchor | unheaded-block-24 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-18, under "3. Roots And On-Disk Shape", is retained at docs/platform/packaging-distribution/contracts/repository-runtime-layout.md#unheaded-block-24. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the contracts/repository-runtime-layout.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
- release store `releases/<artifactDigest>/` is immutable release payload;
- workspace `.fgos/installation/bin/*` is the stable local entry surface;
- workspace `.fgos/installation/activation.json` selects the active runtime for
  that workspace only;
- workspace `.fgos/config.json` is tracked workspace/branch policy;
- workspace `.fgos/distribution.json` is tracked runtime pin policy and may
  differ by branch/worktree;
- workspace `.fgos/installation/projections/ledger.json` records projections for
  that workspace only;
- `workHistoryRoot(workStateId)` owns durable workflow history, not packaging;
- `runtimeCoordinationRoot(workStateId)` owns claims/sessions/leases/locks and
  must not share a namespace with release/activation records;
- config, event history, coordination, cache, activation, and projections have
  distinct state classes per
  [Workspace Topology Architecture](../workspace-topology.md).
```

### Target unit

```text
- release store `releases/<artifactDigest>/` is immutable release payload;
- workspace `.fgos/installation/bin/*` is the stable local entry surface;
- workspace `.fgos/installation/activation.json` selects the active runtime for
  that workspace only;
- workspace `.fgos/config.json` is tracked workspace/branch policy;
- workspace `.fgos/distribution.json` is tracked runtime pin policy and may
  differ by branch/worktree;
- workspace `.fgos/installation/projections/ledger.json` records projections for
  that workspace only;
- `workHistoryRoot(workStateId)` owns durable workflow history, not packaging;
- `runtimeCoordinationRoot(workStateId)` owns claims/sessions/leases/locks and
  must not share a namespace with release/activation records;
- config, event history, coordination, cache, activation, and projections have
  distinct state classes per
  [Workspace Topology Architecture](../../../architect/workspace-topology.md).
```

### Unified diff

```diff
--- "docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-18"
+++ "docs/platform/packaging-distribution/contracts/repository-runtime-layout.md#unheaded-block-24"
@@ -12,4 +12,4 @@
   must not share a namespace with release/activation records;
 - config, event history, coordination, cache, activation, and projections have
   distinct state classes per
-  [Workspace Topology Architecture](../workspace-topology.md).
\ No newline at end of file
+  [Workspace Topology Architecture](../../../architect/workspace-topology.md).
\ No newline at end of file
```

## claim_78fb7962a13f38faf373501503aad531

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-19

Target: docs/platform/packaging-distribution/contracts/repository-runtime-layout.md#unheaded-block-25

Source identity digest: `4ec49177875223e690ac085ebfdb91b1e5726963c7e5e80dbb441af6048f9767`

Target identity digest: `4ec49177875223e690ac085ebfdb91b1e5726963c7e5e80dbb441af6048f9767`

Source shown SHA256: `4ec49177875223e690ac085ebfdb91b1e5726963c7e5e80dbb441af6048f9767`

Target shown SHA256: `4ec49177875223e690ac085ebfdb91b1e5726963c7e5e80dbb441af6048f9767`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_78fb7962a13f38faf373501503aad531 |
| sourceUnitDigest | 4ec49177875223e690ac085ebfdb91b1e5726963c7e5e80dbb441af6048f9767 |
| targetOwner | docs/platform/packaging-distribution/contracts/repository-runtime-layout.md |
| targetAnchor | unheaded-block-25 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-19, under "3. Roots And On-Disk Shape", is retained at docs/platform/packaging-distribution/contracts/repository-runtime-layout.md#unheaded-block-25. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the contracts/repository-runtime-layout.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
Worker workspaces still need an installation capsule if commands are expected
to enter through local shims. They must not symlink or copy the entire shared
`.fgos` state tree. The minimum worker capsule is:
```

### Target unit

```text
Worker workspaces still need an installation capsule if commands are expected
to enter through local shims. They must not symlink or copy the entire shared
`.fgos` state tree. The minimum worker capsule is:
```

### Unified diff

```diff
No text difference.
```

## claim_67ea7318ee5a0c7394b3ab1f8adcc403

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-20

Target: docs/platform/packaging-distribution/contracts/repository-runtime-layout.md#unheaded-block-26

Source identity digest: `e6ea7ecd83eecbd2d4698b3080e7a97a22d7864e178b29ec90896654f3974a12`

Target identity digest: `e6ea7ecd83eecbd2d4698b3080e7a97a22d7864e178b29ec90896654f3974a12`

Source shown SHA256: `e6ea7ecd83eecbd2d4698b3080e7a97a22d7864e178b29ec90896654f3974a12`

Target shown SHA256: `e6ea7ecd83eecbd2d4698b3080e7a97a22d7864e178b29ec90896654f3974a12`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_67ea7318ee5a0c7394b3ab1f8adcc403 |
| sourceUnitDigest | e6ea7ecd83eecbd2d4698b3080e7a97a22d7864e178b29ec90896654f3974a12 |
| targetOwner | docs/platform/packaging-distribution/contracts/repository-runtime-layout.md |
| targetAnchor | unheaded-block-26 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-20, under "3. Roots And On-Disk Shape", is retained at docs/platform/packaging-distribution/contracts/repository-runtime-layout.md#unheaded-block-26. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the contracts/repository-runtime-layout.md topic owner; carriage does not certify current implementation. |

### Source unit

````text
```txt
worker workspace:
  .fgos/
    distribution.json        # checked out with the branch when present
    installation/
      bin/fgos
      bin/fgos-runner
      root.json              # binds shared workState/release/coordination roots
      activation.json
      projections/ledger.json
```
````

### Target unit

````text
```txt
worker workspace:
  .fgos/
    distribution.json        # checked out with the branch when present
    installation/
      bin/fgos
      bin/fgos-runner
      root.json              # binds shared workState/release/coordination roots
      activation.json
      projections/ledger.json
```
````

### Unified diff

```diff
No text difference.
```

## claim_bce7f3242b78cb8e82985d7c5adde2f3

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-21

Target: docs/platform/packaging-distribution/contracts/repository-runtime-layout.md#unheaded-block-27

Source identity digest: `ce51639978fcc97f4750b0b569f126fbbe1b5a9a93e7558d27839f962e9dfe3f`

Target identity digest: `ce51639978fcc97f4750b0b569f126fbbe1b5a9a93e7558d27839f962e9dfe3f`

Source shown SHA256: `ce51639978fcc97f4750b0b569f126fbbe1b5a9a93e7558d27839f962e9dfe3f`

Target shown SHA256: `ce51639978fcc97f4750b0b569f126fbbe1b5a9a93e7558d27839f962e9dfe3f`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_bce7f3242b78cb8e82985d7c5adde2f3 |
| sourceUnitDigest | ce51639978fcc97f4750b0b569f126fbbe1b5a9a93e7558d27839f962e9dfe3f |
| targetOwner | docs/platform/packaging-distribution/contracts/repository-runtime-layout.md |
| targetAnchor | unheaded-block-27 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-21, under "3. Roots And On-Disk Shape", is retained at docs/platform/packaging-distribution/contracts/repository-runtime-layout.md#unheaded-block-27. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the contracts/repository-runtime-layout.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
If `.fgos/distribution.json` exists but the release store has not staged its
requested release, the workspace is in `pinned-not-staged`. `fgctl init` must
acquire/stage the pinned release and publish this workspace's activation
binding, not silently choose latest.
```

### Target unit

```text
If `.fgos/distribution.json` exists but the release store has not staged its
requested release, the workspace is in `pinned-not-staged`. `fgctl init` must
acquire/stage the pinned release and publish this workspace's activation
binding, not silently choose latest.
```

### Unified diff

```diff
No text difference.
```

## claim_b9832e31175255738a4f2dac93d22f61

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-22

Target: docs/platform/packaging-distribution/contracts/repository-runtime-layout.md#unheaded-block-28

Source identity digest: `f10a8cc5d7042732e9b43e3674046eb42c1941b5c8e251a85a11f71349a7dd80`

Target identity digest: `f10a8cc5d7042732e9b43e3674046eb42c1941b5c8e251a85a11f71349a7dd80`

Source shown SHA256: `f10a8cc5d7042732e9b43e3674046eb42c1941b5c8e251a85a11f71349a7dd80`

Target shown SHA256: `f10a8cc5d7042732e9b43e3674046eb42c1941b5c8e251a85a11f71349a7dd80`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_b9832e31175255738a4f2dac93d22f61 |
| sourceUnitDigest | f10a8cc5d7042732e9b43e3674046eb42c1941b5c8e251a85a11f71349a7dd80 |
| targetOwner | docs/platform/packaging-distribution/contracts/repository-runtime-layout.md |
| targetAnchor | unheaded-block-28 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-22, under "3. Roots And On-Disk Shape", is retained at docs/platform/packaging-distribution/contracts/repository-runtime-layout.md#unheaded-block-28. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the contracts/repository-runtime-layout.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
Possible tracked pin shape:
```

### Target unit

```text
Possible tracked pin shape:
```

### Unified diff

```diff
No text difference.
```

## claim_32fe7ef12d653275e441c6fd15ea6a1d

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-23

Target: docs/platform/packaging-distribution/contracts/repository-runtime-layout.md#unheaded-block-29

Source identity digest: `953b75abc1fe178e38d0458abf23b5ec94465faa148331571e8212ddfcc2a4f9`

Target identity digest: `953b75abc1fe178e38d0458abf23b5ec94465faa148331571e8212ddfcc2a4f9`

Source shown SHA256: `953b75abc1fe178e38d0458abf23b5ec94465faa148331571e8212ddfcc2a4f9`

Target shown SHA256: `953b75abc1fe178e38d0458abf23b5ec94465faa148331571e8212ddfcc2a4f9`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_32fe7ef12d653275e441c6fd15ea6a1d |
| sourceUnitDigest | 953b75abc1fe178e38d0458abf23b5ec94465faa148331571e8212ddfcc2a4f9 |
| targetOwner | docs/platform/packaging-distribution/contracts/repository-runtime-layout.md |
| targetAnchor | unheaded-block-29 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-23, under "3. Roots And On-Disk Shape", is retained at docs/platform/packaging-distribution/contracts/repository-runtime-layout.md#unheaded-block-29. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the contracts/repository-runtime-layout.md topic owner; carriage does not certify current implementation. |

### Source unit

````text
```json
{
  "schemaVersion": 1,
  "projectRuntime": {
    "policy": "exact-digest",
    "artifactDigest": "sha256:...",
    "releaseVersion": "0.1.0",
    "channel": null,
    "allowPrerelease": false
  }
}
```
````

### Target unit

````text
```json
{
  "schemaVersion": 1,
  "projectRuntime": {
    "policy": "exact-digest",
    "artifactDigest": "sha256:...",
    "releaseVersion": "0.1.0",
    "channel": null,
    "allowPrerelease": false
  }
}
```
````

### Unified diff

```diff
No text difference.
```

## claim_a0b5501fc16d1899fa7113404c4d9592

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-24

Target: docs/platform/packaging-distribution/contracts/repository-runtime-layout.md#unheaded-block-30

Source identity digest: `17d5f71a2c81f868c3e7e26e92a8a97fe0235916752344df38b1f825cfbc6f0b`

Target identity digest: `17d5f71a2c81f868c3e7e26e92a8a97fe0235916752344df38b1f825cfbc6f0b`

Source shown SHA256: `17d5f71a2c81f868c3e7e26e92a8a97fe0235916752344df38b1f825cfbc6f0b`

Target shown SHA256: `17d5f71a2c81f868c3e7e26e92a8a97fe0235916752344df38b1f825cfbc6f0b`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_a0b5501fc16d1899fa7113404c4d9592 |
| sourceUnitDigest | 17d5f71a2c81f868c3e7e26e92a8a97fe0235916752344df38b1f825cfbc6f0b |
| targetOwner | docs/platform/packaging-distribution/contracts/repository-runtime-layout.md |
| targetAnchor | unheaded-block-30 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-24, under "3. Roots And On-Disk Shape", is retained at docs/platform/packaging-distribution/contracts/repository-runtime-layout.md#unheaded-block-30. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the contracts/repository-runtime-layout.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
Root resolution order for the stable shim:
```

### Target unit

```text
Root resolution order for the stable shim:
```

### Unified diff

```diff
No text difference.
```

## claim_b75456d68668096b7f0c16a1a127cea3

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-25

Target: docs/platform/packaging-distribution/contracts/repository-runtime-layout.md#unheaded-block-31

Source identity digest: `217109f7756002fb7536490af003e89541f5957ededfbed59405aec47e73b9c9`

Target identity digest: `217109f7756002fb7536490af003e89541f5957ededfbed59405aec47e73b9c9`

Source shown SHA256: `217109f7756002fb7536490af003e89541f5957ededfbed59405aec47e73b9c9`

Target shown SHA256: `217109f7756002fb7536490af003e89541f5957ededfbed59405aec47e73b9c9`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_b75456d68668096b7f0c16a1a127cea3 |
| sourceUnitDigest | 217109f7756002fb7536490af003e89541f5957ededfbed59405aec47e73b9c9 |
| targetOwner | docs/platform/packaging-distribution/contracts/repository-runtime-layout.md |
| targetAnchor | unheaded-block-31 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-25, under "3. Roots And On-Disk Shape", is retained at docs/platform/packaging-distribution/contracts/repository-runtime-layout.md#unheaded-block-31. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the contracts/repository-runtime-layout.md topic owner; carriage does not certify current implementation. |

### Source unit

````text
```txt
1. read workspace .fgos/installation/root.json if present;
2. otherwise resolve TopologyContext for repository/workspace/work-state identity;
3. read machineReleaseStore from TopologyContext;
4. read workspace .fgos/installation/activation.json;
5. exec releases/<artifactDigest>/bin/<entry>.
```
````

### Target unit

````text
```txt
1. read workspace .fgos/installation/root.json if present;
2. otherwise resolve TopologyContext for repository/workspace/work-state identity;
3. read machineReleaseStore from TopologyContext;
4. read workspace .fgos/installation/activation.json;
5. exec releases/<artifactDigest>/bin/<entry>.
```
````

### Unified diff

```diff
No text difference.
```

## claim_f52782c280bebce5da6b93525468767b

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-26

Target: docs/platform/packaging-distribution/contracts/repository-runtime-layout.md#unheaded-block-32

Source identity digest: `c605c14d493a1fede0420bf606d6e8cc9a248cfbbb67a0c2f7e8171d2fccac12`

Target identity digest: `c605c14d493a1fede0420bf606d6e8cc9a248cfbbb67a0c2f7e8171d2fccac12`

Source shown SHA256: `c605c14d493a1fede0420bf606d6e8cc9a248cfbbb67a0c2f7e8171d2fccac12`

Target shown SHA256: `c605c14d493a1fede0420bf606d6e8cc9a248cfbbb67a0c2f7e8171d2fccac12`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_f52782c280bebce5da6b93525468767b |
| sourceUnitDigest | c605c14d493a1fede0420bf606d6e8cc9a248cfbbb67a0c2f7e8171d2fccac12 |
| targetOwner | docs/platform/packaging-distribution/contracts/repository-runtime-layout.md |
| targetAnchor | unheaded-block-32 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-26, under "3. Roots And On-Disk Shape", is retained at docs/platform/packaging-distribution/contracts/repository-runtime-layout.md#unheaded-block-32. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the contracts/repository-runtime-layout.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
The shim must not treat a shared release store as a shared active runtime. Two
worktrees may use different activation bindings while sharing the same
content-addressed releases.
```

### Target unit

```text
The shim must not treat a shared release store as a shared active runtime. Two
worktrees may use different activation bindings while sharing the same
content-addressed releases.
```

### Unified diff

```diff
No text difference.
```

## claim_94279ae6161753a909f28f600f659a71

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-27

Target: docs/platform/packaging-distribution/contracts/repository-runtime-layout.md#unheaded-block-33

Source identity digest: `e38430e77a25fe87f03abd8fb262a61126c26a233236149486d134de96e72afc`

Target identity digest: `e38430e77a25fe87f03abd8fb262a61126c26a233236149486d134de96e72afc`

Source shown SHA256: `e38430e77a25fe87f03abd8fb262a61126c26a233236149486d134de96e72afc`

Target shown SHA256: `e38430e77a25fe87f03abd8fb262a61126c26a233236149486d134de96e72afc`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_94279ae6161753a909f28f600f659a71 |
| sourceUnitDigest | e38430e77a25fe87f03abd8fb262a61126c26a233236149486d134de96e72afc |
| targetOwner | docs/platform/packaging-distribution/contracts/repository-runtime-layout.md |
| targetAnchor | unheaded-block-33 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-27, under "3. Roots And On-Disk Shape", is retained at docs/platform/packaging-distribution/contracts/repository-runtime-layout.md#unheaded-block-33. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the contracts/repository-runtime-layout.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
`<artifactDigest>` is a path-safe digest identity for the canonical release
tree manifest, for example `sha256-abc123...`. It is not the path humans,
agents, gateway, or runner supervisors should call directly. The stable command
path is:
```

### Target unit

```text
`<artifactDigest>` is a path-safe digest identity for the canonical release
tree manifest, for example `sha256-abc123...`. It is not the path humans,
agents, gateway, or runner supervisors should call directly. The stable command
path is:
```

### Unified diff

```diff
No text difference.
```

## claim_5a3a18f32e281545d12940271cb4e89f

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-28

Target: docs/platform/packaging-distribution/contracts/repository-runtime-layout.md#unheaded-block-34

Source identity digest: `e1ee624971d89e1b4abb50437906852ad86c811ad2b0461945b1e185b05820e8`

Target identity digest: `e1ee624971d89e1b4abb50437906852ad86c811ad2b0461945b1e185b05820e8`

Source shown SHA256: `e1ee624971d89e1b4abb50437906852ad86c811ad2b0461945b1e185b05820e8`

Target shown SHA256: `e1ee624971d89e1b4abb50437906852ad86c811ad2b0461945b1e185b05820e8`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_5a3a18f32e281545d12940271cb4e89f |
| sourceUnitDigest | e1ee624971d89e1b4abb50437906852ad86c811ad2b0461945b1e185b05820e8 |
| targetOwner | docs/platform/packaging-distribution/contracts/repository-runtime-layout.md |
| targetAnchor | unheaded-block-34 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-28, under "3. Roots And On-Disk Shape", is retained at docs/platform/packaging-distribution/contracts/repository-runtime-layout.md#unheaded-block-34. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the contracts/repository-runtime-layout.md topic owner; carriage does not certify current implementation. |

### Source unit

````text
```txt
.fgos/installation/bin/fgos
.fgos/installation/bin/fgos-runner
```
````

### Target unit

````text
```txt
.fgos/installation/bin/fgos
.fgos/installation/bin/fgos-runner
```
````

### Unified diff

```diff
No text difference.
```

## claim_701258f4566c7c5081bace1eb5cde015

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-29

Target: docs/platform/packaging-distribution/contracts/repository-runtime-layout.md#unheaded-block-35

Source identity digest: `b4de8f587004719e95fae9f6a7dbb129eaebe14b7c04387023b46349f5832c3e`

Target identity digest: `b4de8f587004719e95fae9f6a7dbb129eaebe14b7c04387023b46349f5832c3e`

Source shown SHA256: `b4de8f587004719e95fae9f6a7dbb129eaebe14b7c04387023b46349f5832c3e`

Target shown SHA256: `b4de8f587004719e95fae9f6a7dbb129eaebe14b7c04387023b46349f5832c3e`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_701258f4566c7c5081bace1eb5cde015 |
| sourceUnitDigest | b4de8f587004719e95fae9f6a7dbb129eaebe14b7c04387023b46349f5832c3e |
| targetOwner | docs/platform/packaging-distribution/contracts/repository-runtime-layout.md |
| targetAnchor | unheaded-block-35 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-29, under "3. Roots And On-Disk Shape", is retained at docs/platform/packaging-distribution/contracts/repository-runtime-layout.md#unheaded-block-35. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the contracts/repository-runtime-layout.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
Those entries are thin local shims. A shim should do only the minimum required
to enter the active release:
```

### Target unit

```text
Those entries are thin local shims. A shim should do only the minimum required
to enter the active release:
```

### Unified diff

```diff
No text difference.
```

## claim_f64d078d07273a7fb7a4ea60cb70e7cc

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-30

Target: docs/platform/packaging-distribution/contracts/repository-runtime-layout.md#unheaded-block-36

Source identity digest: `db6f1601d9f94e7a7c62a187ae8ffb5fd79e07a11c6b1a2d6f7d3239de6a02ee`

Target identity digest: `db6f1601d9f94e7a7c62a187ae8ffb5fd79e07a11c6b1a2d6f7d3239de6a02ee`

Source shown SHA256: `db6f1601d9f94e7a7c62a187ae8ffb5fd79e07a11c6b1a2d6f7d3239de6a02ee`

Target shown SHA256: `db6f1601d9f94e7a7c62a187ae8ffb5fd79e07a11c6b1a2d6f7d3239de6a02ee`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_f64d078d07273a7fb7a4ea60cb70e7cc |
| sourceUnitDigest | db6f1601d9f94e7a7c62a187ae8ffb5fd79e07a11c6b1a2d6f7d3239de6a02ee |
| targetOwner | docs/platform/packaging-distribution/contracts/repository-runtime-layout.md |
| targetAnchor | unheaded-block-36 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-30, under "3. Roots And On-Disk Shape", is retained at docs/platform/packaging-distribution/contracts/repository-runtime-layout.md#unheaded-block-36. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the contracts/repository-runtime-layout.md topic owner; carriage does not certify current implementation. |

### Source unit

````text
```txt
resolve machineReleaseStore from TopologyContext/root binding
read workspace .fgos/installation/activation.json
resolve artifactDigest to releases/<digest>/
verify the target entry exists
exec the active release binary
```
````

### Target unit

````text
```txt
resolve machineReleaseStore from TopologyContext/root binding
read workspace .fgos/installation/activation.json
resolve artifactDigest to releases/<digest>/
verify the target entry exists
exec the active release binary
```
````

### Unified diff

```diff
No text difference.
```

## claim_e4b4c1384a54c958cf7388473616a465

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-31

Target: docs/platform/packaging-distribution/contracts/repository-runtime-layout.md#unheaded-block-37

Source identity digest: `40a4824d5b2adc943eaea2c7e1ce30a15da42a56fba765685497fcf14e5caeec`

Target identity digest: `40a4824d5b2adc943eaea2c7e1ce30a15da42a56fba765685497fcf14e5caeec`

Source shown SHA256: `40a4824d5b2adc943eaea2c7e1ce30a15da42a56fba765685497fcf14e5caeec`

Target shown SHA256: `40a4824d5b2adc943eaea2c7e1ce30a15da42a56fba765685497fcf14e5caeec`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_e4b4c1384a54c958cf7388473616a465 |
| sourceUnitDigest | 40a4824d5b2adc943eaea2c7e1ce30a15da42a56fba765685497fcf14e5caeec |
| targetOwner | docs/platform/packaging-distribution/contracts/repository-runtime-layout.md |
| targetAnchor | unheaded-block-37 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-31, under "3. Roots And On-Disk Shape", is retained at docs/platform/packaging-distribution/contracts/repository-runtime-layout.md#unheaded-block-37. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the contracts/repository-runtime-layout.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
It must not scan the full workspace, verify every fingerprint, resolve network
versions, run doctor checks, or load broad registries on every command. Full
verification belongs to install/repair/doctor paths. The normal command
overhead should be limited to reading one small record and executing the active
binary.
```

### Target unit

```text
It must not scan the full workspace, verify every fingerprint, resolve network
versions, run doctor checks, or load broad registries on every command. Full
verification belongs to install/repair/doctor paths. The normal command
overhead should be limited to reading one small record and executing the active
binary.
```

### Unified diff

```diff
No text difference.
```

## claim_9e084ca046f9dabf12285656ff43d26e

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-32

Target: docs/platform/packaging-distribution/contracts/repository-runtime-layout.md#unheaded-block-38

Source identity digest: `6dc375b19032484277898b91e67c4331990b18cb950bbdbb815fd1dd83710633`

Target identity digest: `6dc375b19032484277898b91e67c4331990b18cb950bbdbb815fd1dd83710633`

Source shown SHA256: `6dc375b19032484277898b91e67c4331990b18cb950bbdbb815fd1dd83710633`

Target shown SHA256: `6dc375b19032484277898b91e67c4331990b18cb950bbdbb815fd1dd83710633`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_9e084ca046f9dabf12285656ff43d26e |
| sourceUnitDigest | 6dc375b19032484277898b91e67c4331990b18cb950bbdbb815fd1dd83710633 |
| targetOwner | docs/platform/packaging-distribution/contracts/repository-runtime-layout.md |
| targetAnchor | unheaded-block-38 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-32, under "3. Roots And On-Disk Shape", is retained at docs/platform/packaging-distribution/contracts/repository-runtime-layout.md#unheaded-block-38. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the contracts/repository-runtime-layout.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
Shim forward-compatibility rule: the shim reads only `schemaVersion`,
`artifactDigest`, and `releasePath` from workspace `activation.json`. Broader
activation metadata may evolve without requiring every stable shim to be
replaced.
```

### Target unit

```text
Shim forward-compatibility rule: the shim reads only `schemaVersion`,
`artifactDigest`, and `releasePath` from workspace `activation.json`. Broader
activation metadata may evolve without requiring every stable shim to be
replaced.
```

### Unified diff

```diff
No text difference.
```

## claim_3b8bf6d3bc131881bdb9631412ad5ee9

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-33

Target: docs/platform/packaging-distribution/contracts/repository-runtime-layout.md#unheaded-block-39

Source identity digest: `53729c20689b7a3f8b88a76242f8f44643e19221b4e08acc70db0390e6949dff`

Target identity digest: `53729c20689b7a3f8b88a76242f8f44643e19221b4e08acc70db0390e6949dff`

Source shown SHA256: `53729c20689b7a3f8b88a76242f8f44643e19221b4e08acc70db0390e6949dff`

Target shown SHA256: `53729c20689b7a3f8b88a76242f8f44643e19221b4e08acc70db0390e6949dff`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_3b8bf6d3bc131881bdb9631412ad5ee9 |
| sourceUnitDigest | 53729c20689b7a3f8b88a76242f8f44643e19221b4e08acc70db0390e6949dff |
| targetOwner | docs/platform/packaging-distribution/contracts/repository-runtime-layout.md |
| targetAnchor | unheaded-block-39 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-33, under "3. Roots And On-Disk Shape", is retained at docs/platform/packaging-distribution/contracts/repository-runtime-layout.md#unheaded-block-39. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the contracts/repository-runtime-layout.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
The alternative is a `current` symlink, but the preferred V1 is a shim because
it works more consistently on Windows, can produce clear errors when the active
release is missing, and can later add a lightweight invocation lease without
depending on filesystem symlink behavior.
```

### Target unit

```text
The alternative is a `current` symlink, but the preferred V1 is a shim because
it works more consistently on Windows, can produce clear errors when the active
release is missing, and can later add a lightweight invocation lease without
depending on filesystem symlink behavior.
```

### Unified diff

```diff
No text difference.
```

## claim_7f687034c5f8c915c95d7c932ba0cbd6

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#4-record-types

Target: docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md#4-record-types

Source identity digest: `c30ccfd7fcd9ae71c2668b81f1718ecad1b070c88bfddac47843fdccc3a0f53d`

Target identity digest: `e802c4d389cea6a3c74d266fabab17ec424c135cc92dd2e63589b010caca2083`

Source shown SHA256: `2e72c256d47380cf2c2996983f01b403ae60176b6e3c49316cc47df5217321e7`

Target shown SHA256: `97cd95af8ba2f4f3215fdc7f5ccdf26fcd63384bf8cb61d91da1d1b78147ebaf`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_7f687034c5f8c915c95d7c932ba0cbd6 |
| sourceUnitDigest | c30ccfd7fcd9ae71c2668b81f1718ecad1b070c88bfddac47843fdccc3a0f53d |
| targetOwner | docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md |
| targetAnchor | 4-record-types |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete heading from docs/architect/packaging-distribution/runtime-identity-and-activation.md#4-record-types, under "4. Record Types", is retained at docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md#4-record-types. Only heading depth changes; the direct section payload follows the original source order. The named owner is the architecture/runtime-identity-and-activation.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
## 4. Record Types

Do not collapse all runtime facts into one ledger. Use separate records with
separate authority.

| Record | Mutability | Owner | Purpose |
|---|---|---|---|
| `ReleaseManifest` | Immutable, publisher-produced | Release build/publisher | Declares artifact identity, file digests, binaries, adapter contract, capabilities, state-schema compatibility, dependency closure. |
| `WorkspaceActivationBinding` | Mutable, workspace-local | `fgctl` | Declares which release digest is ready for this workspace, plus workspace/work-state/repository identity, activation transaction, timestamp, and status. |
| `Pin` | Mutable, git-tracked project policy | Semantic owner: packaging/distribution. Canonical writer: `fgctl`. External edits are tolerated input and validated fail-closed. | Declares desired version/channel/digest policy in `.fgos/distribution.json`. Selection input, not runtime proof. |
| `ProjectionLedger` | Mutable, project-local | local `fgos init` / `fgos doctor --fix` under active identity | Records host-visible generated/projection paths, source digest, last materialized digest, ownership class, and repair policy. |
| `MigrationJournal` | Append-only, project-local | local `fgos` under active identity | Records state-schema migration epoch, checkpoints/backups, reversibility, and compatibility facts. |
```

### Target unit

```text
#### 4. Record Types

Do not collapse all runtime facts into one ledger. Use separate records with
separate authority.

| Record | Mutability | Owner | Purpose |
|---|---|---|---|
| `ReleaseManifest` | Immutable, publisher-produced | Release build/publisher | Declares artifact identity, file digests, binaries, adapter contract, capabilities, state-schema compatibility, dependency closure. |
| `WorkspaceActivationBinding` | Mutable, workspace-local | `fgctl` | Declares which release digest is ready for this workspace, plus workspace/work-state/repository identity, activation transaction, timestamp, and status. |
| `Pin` | Mutable, git-tracked project policy | Semantic owner: packaging/distribution. Canonical writer: `fgctl`. External edits are tolerated input and validated fail-closed. | Declares desired version/channel/digest policy in `.fgos/distribution.json`. Selection input, not runtime proof. |
| `ProjectionLedger` | Mutable, project-local | local `fgos init` / `fgos doctor --fix` under active identity | Records host-visible generated/projection paths, source digest, last materialized digest, ownership class, and repair policy. |
| `MigrationJournal` | Append-only, project-local | local `fgos` under active identity | Records state-schema migration epoch, checkpoints/backups, reversibility, and compatibility facts. |
```

### Unified diff

```diff
--- "docs/architect/packaging-distribution/runtime-identity-and-activation.md#4-record-types"
+++ "docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md#4-record-types"
@@ -1,4 +1,4 @@
-## 4. Record Types
+#### 4. Record Types
 
 Do not collapse all runtime facts into one ledger. Use separate records with
 separate authority.
```

## claim_0372b73a7a1a072a8835ecde7be7d1df

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-34

Target: docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md#unheaded-block-38

Source identity digest: `389e419e3ff43d610e1e5d0ca84209a28d2672a779a95ae709c85c6f498e316f`

Target identity digest: `389e419e3ff43d610e1e5d0ca84209a28d2672a779a95ae709c85c6f498e316f`

Source shown SHA256: `389e419e3ff43d610e1e5d0ca84209a28d2672a779a95ae709c85c6f498e316f`

Target shown SHA256: `389e419e3ff43d610e1e5d0ca84209a28d2672a779a95ae709c85c6f498e316f`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_0372b73a7a1a072a8835ecde7be7d1df |
| sourceUnitDigest | 389e419e3ff43d610e1e5d0ca84209a28d2672a779a95ae709c85c6f498e316f |
| targetOwner | docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md |
| targetAnchor | unheaded-block-38 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-34, under "4. Record Types", is retained at docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md#unheaded-block-38. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the architecture/runtime-identity-and-activation.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
Do not collapse all runtime facts into one ledger. Use separate records with
separate authority.
```

### Target unit

```text
Do not collapse all runtime facts into one ledger. Use separate records with
separate authority.
```

### Unified diff

```diff
No text difference.
```

## claim_2a086421fe8b46ed8c0a7c2741704dac

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-35

Target: docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md#unheaded-block-39

Source identity digest: `994b75de735a509782264820b22d732b35f3ee4f734ff39aab967420fdc08d4f`

Target identity digest: `994b75de735a509782264820b22d732b35f3ee4f734ff39aab967420fdc08d4f`

Source shown SHA256: `994b75de735a509782264820b22d732b35f3ee4f734ff39aab967420fdc08d4f`

Target shown SHA256: `994b75de735a509782264820b22d732b35f3ee4f734ff39aab967420fdc08d4f`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_2a086421fe8b46ed8c0a7c2741704dac |
| sourceUnitDigest | 994b75de735a509782264820b22d732b35f3ee4f734ff39aab967420fdc08d4f |
| targetOwner | docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md |
| targetAnchor | unheaded-block-39 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-35, under "4. Record Types", is retained at docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md#unheaded-block-39. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the architecture/runtime-identity-and-activation.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
| Record | Mutability | Owner | Purpose |
|---|---|---|---|
| `ReleaseManifest` | Immutable, publisher-produced | Release build/publisher | Declares artifact identity, file digests, binaries, adapter contract, capabilities, state-schema compatibility, dependency closure. |
| `WorkspaceActivationBinding` | Mutable, workspace-local | `fgctl` | Declares which release digest is ready for this workspace, plus workspace/work-state/repository identity, activation transaction, timestamp, and status. |
| `Pin` | Mutable, git-tracked project policy | Semantic owner: packaging/distribution. Canonical writer: `fgctl`. External edits are tolerated input and validated fail-closed. | Declares desired version/channel/digest policy in `.fgos/distribution.json`. Selection input, not runtime proof. |
| `ProjectionLedger` | Mutable, project-local | local `fgos init` / `fgos doctor --fix` under active identity | Records host-visible generated/projection paths, source digest, last materialized digest, ownership class, and repair policy. |
| `MigrationJournal` | Append-only, project-local | local `fgos` under active identity | Records state-schema migration epoch, checkpoints/backups, reversibility, and compatibility facts. |
```

### Target unit

```text
| Record | Mutability | Owner | Purpose |
|---|---|---|---|
| `ReleaseManifest` | Immutable, publisher-produced | Release build/publisher | Declares artifact identity, file digests, binaries, adapter contract, capabilities, state-schema compatibility, dependency closure. |
| `WorkspaceActivationBinding` | Mutable, workspace-local | `fgctl` | Declares which release digest is ready for this workspace, plus workspace/work-state/repository identity, activation transaction, timestamp, and status. |
| `Pin` | Mutable, git-tracked project policy | Semantic owner: packaging/distribution. Canonical writer: `fgctl`. External edits are tolerated input and validated fail-closed. | Declares desired version/channel/digest policy in `.fgos/distribution.json`. Selection input, not runtime proof. |
| `ProjectionLedger` | Mutable, project-local | local `fgos init` / `fgos doctor --fix` under active identity | Records host-visible generated/projection paths, source digest, last materialized digest, ownership class, and repair policy. |
| `MigrationJournal` | Append-only, project-local | local `fgos` under active identity | Records state-schema migration epoch, checkpoints/backups, reversibility, and compatibility facts. |
```

### Unified diff

```diff
No text difference.
```

## claim_088af18a5796ed72fe6d33ff2cc5d05c

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#5-releasemanifest

Target: docs/platform/packaging-distribution/contracts/release-manifest.md#5-releasemanifest

Source identity digest: `b801deec612f9c048de490e35353b38f99031f2bac692e2955b64c7b1411587b`

Target identity digest: `dab662376a62121a0cdec73438f62b6955fe94aa868d54deceb124c3aceaefee`

Source shown SHA256: `58d7822f6171775470cdc34ba7e2d54c99708d6405c9e75ad7d4a119d1873c53`

Target shown SHA256: `bbf15d39ee5e46d10dad5b89e6bc941bc035a5cf2738843c12c10408fa786e56`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_088af18a5796ed72fe6d33ff2cc5d05c |
| sourceUnitDigest | b801deec612f9c048de490e35353b38f99031f2bac692e2955b64c7b1411587b |
| targetOwner | docs/platform/packaging-distribution/contracts/release-manifest.md |
| targetAnchor | 5-releasemanifest |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete heading from docs/architect/packaging-distribution/runtime-identity-and-activation.md#5-releasemanifest, under "5. ReleaseManifest", is retained at docs/platform/packaging-distribution/contracts/release-manifest.md#5-releasemanifest. Only heading depth changes; the direct section payload follows the original source order. The named owner is the contracts/release-manifest.md topic owner; carriage does not certify current implementation. |

### Source unit

````text
## 5. ReleaseManifest

The release manifest is the immutable statement of what an fgOS release
contains.

The canonical artifact digest is computed from this release tree manifest, not
from a `.zip`, `.tar.gz`, npm package archive, or transport wrapper. Archive
digests may still be recorded for download/integrity diagnostics, but they are
not runtime identity. Runtime identity must survive different compression
formats, package transports, and mirror locations.

The digest formula is:

```txt
fileDigest = sha256(file bytes as emitted by the release build)
artifactDigest = sha256(canonical-json(release tree manifest without artifactDigest))
```

The release build, not the installer, owns byte normalization. Install should
not rewrite line endings or file contents to make a digest pass.

Minimum fields:

```json
{
  "schemaVersion": 1,
  "artifactDigest": "sha256:...",
  "digestKind": "release-tree-manifest",
  "releaseVersion": "0.1.0",
  "sourceRevision": "...",
  "createdAt": "2026-09-04T00:00:00Z",
  "target": {
    "os": "linux",
    "arch": "x64",
    "libc": "glibc"
  },
  "entries": {
    "fgos": "bin/fgos",
    "fgosRunner": "bin/fgos-runner"
  },
  "components": {
    "legacyNode": {
      "root": "libexec/legacy-node",
      "entry": "bin/fgos.mjs",
      "digest": "sha256:..."
    },
    "runner": {
      "path": "bin/fgos-runner",
      "digest": "sha256:..."
    },
    "workshop": {
      "skillsDigest": "sha256:...",
      "agentsDigest": "sha256:...",
      "proseDigest": "sha256:..."
    }
  },
  "requires": {
    "node": ">=20 <23",
    "git": ">=2.39"
  },
  "adapter": {
    "protocolVersion": "1",
    "entry": "bin/fgos adapter",
    "capabilities": []
  },
  "stateSchemas": {
    "read": ["1"],
    "write": ["1"],
    "migrations": []
  },
  "files": []
}
```

`components.legacyNode` names a payload **root** plus an **entry** inside it, not a single file (proposed 2026-09-10 by the host-invocation stream, see [Legacy CLI Transition](../host-invocation-routing/legacy-cli-transition.md) §2): the legacy payload is the whole Node package as `package.json` `files` defines it, staged with its source-relative layout intact so `bin/fgos.mjs` needs no import changes, and `bin/fgos-runner.mjs` lives in the same root. The Rust host resolves `join(activeReleasePath, root, entry)` and nothing else. A `dev:<rev>` source activation declares `root: "."`, `entry: "bin/fgos.mjs"`, `entries.fgos: "target/release/fgos"` — the same fields serve dogfood and a staged release.
````

### Target unit

````text
#### 5. ReleaseManifest

The release manifest is the immutable statement of what an fgOS release
contains.

The canonical artifact digest is computed from this release tree manifest, not
from a `.zip`, `.tar.gz`, npm package archive, or transport wrapper. Archive
digests may still be recorded for download/integrity diagnostics, but they are
not runtime identity. Runtime identity must survive different compression
formats, package transports, and mirror locations.

The digest formula is:

```txt
fileDigest = sha256(file bytes as emitted by the release build)
artifactDigest = sha256(canonical-json(release tree manifest without artifactDigest))
```

The release build, not the installer, owns byte normalization. Install should
not rewrite line endings or file contents to make a digest pass.

Minimum fields:

```json
{
  "schemaVersion": 1,
  "artifactDigest": "sha256:...",
  "digestKind": "release-tree-manifest",
  "releaseVersion": "0.1.0",
  "sourceRevision": "...",
  "createdAt": "2026-09-04T00:00:00Z",
  "target": {
    "os": "linux",
    "arch": "x64",
    "libc": "glibc"
  },
  "entries": {
    "fgos": "bin/fgos",
    "fgosRunner": "bin/fgos-runner"
  },
  "components": {
    "legacyNode": {
      "root": "libexec/legacy-node",
      "entry": "bin/fgos.mjs",
      "digest": "sha256:..."
    },
    "runner": {
      "path": "bin/fgos-runner",
      "digest": "sha256:..."
    },
    "workshop": {
      "skillsDigest": "sha256:...",
      "agentsDigest": "sha256:...",
      "proseDigest": "sha256:..."
    }
  },
  "requires": {
    "node": ">=20 <23",
    "git": ">=2.39"
  },
  "adapter": {
    "protocolVersion": "1",
    "entry": "bin/fgos adapter",
    "capabilities": []
  },
  "stateSchemas": {
    "read": ["1"],
    "write": ["1"],
    "migrations": []
  },
  "files": []
}
```

`components.legacyNode` names a payload **root** plus an **entry** inside it, not a single file (proposed 2026-09-10 by the host-invocation stream, see [Legacy CLI Transition](../../../architect/host-invocation-routing/legacy-cli-transition.md) §2): the legacy payload is the whole Node package as `package.json` `files` defines it, staged with its source-relative layout intact so `bin/fgos.mjs` needs no import changes, and `bin/fgos-runner.mjs` lives in the same root. The Rust host resolves `join(activeReleasePath, root, entry)` and nothing else. A `dev:<rev>` source activation declares `root: "."`, `entry: "bin/fgos.mjs"`, `entries.fgos: "target/release/fgos"` — the same fields serve dogfood and a staged release.
````

### Unified diff

````diff
--- "docs/architect/packaging-distribution/runtime-identity-and-activation.md#5-releasemanifest"
+++ "docs/platform/packaging-distribution/contracts/release-manifest.md#5-releasemanifest"
@@ -1,4 +1,4 @@
-## 5. ReleaseManifest
+#### 5. ReleaseManifest
 
 The release manifest is the immutable statement of what an fgOS release
 contains.
@@ -72,4 +72,4 @@ Minimum fields:
 }
 ```
 
-`components.legacyNode` names a payload **root** plus an **entry** inside it, not a single file (proposed 2026-09-10 by the host-invocation stream, see [Legacy CLI Transition](../host-invocation-routing/legacy-cli-transition.md) §2): the legacy payload is the whole Node package as `package.json` `files` defines it, staged with its source-relative layout intact so `bin/fgos.mjs` needs no import changes, and `bin/fgos-runner.mjs` lives in the same root. The Rust host resolves `join(activeReleasePath, root, entry)` and nothing else. A `dev:<rev>` source activation declares `root: "."`, `entry: "bin/fgos.mjs"`, `entries.fgos: "target/release/fgos"` — the same fields serve dogfood and a staged release.
\ No newline at end of file
+`components.legacyNode` names a payload **root** plus an **entry** inside it, not a single file (proposed 2026-09-10 by the host-invocation stream, see [Legacy CLI Transition](../../../architect/host-invocation-routing/legacy-cli-transition.md) §2): the legacy payload is the whole Node package as `package.json` `files` defines it, staged with its source-relative layout intact so `bin/fgos.mjs` needs no import changes, and `bin/fgos-runner.mjs` lives in the same root. The Rust host resolves `join(activeReleasePath, root, entry)` and nothing else. A `dev:<rev>` source activation declares `root: "."`, `entry: "bin/fgos.mjs"`, `entries.fgos: "target/release/fgos"` — the same fields serve dogfood and a staged release.
\ No newline at end of file
````

## claim_f7b23e10496a2460c655bbcd0c765cfb

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-36

Target: docs/platform/packaging-distribution/contracts/release-manifest.md#unheaded-block-12

Source identity digest: `bac0a2990fcb00aa7b8a014d4397ba8c6cf36cfe401bfc85affe20105adaad07`

Target identity digest: `bac0a2990fcb00aa7b8a014d4397ba8c6cf36cfe401bfc85affe20105adaad07`

Source shown SHA256: `bac0a2990fcb00aa7b8a014d4397ba8c6cf36cfe401bfc85affe20105adaad07`

Target shown SHA256: `bac0a2990fcb00aa7b8a014d4397ba8c6cf36cfe401bfc85affe20105adaad07`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_f7b23e10496a2460c655bbcd0c765cfb |
| sourceUnitDigest | bac0a2990fcb00aa7b8a014d4397ba8c6cf36cfe401bfc85affe20105adaad07 |
| targetOwner | docs/platform/packaging-distribution/contracts/release-manifest.md |
| targetAnchor | unheaded-block-12 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-36, under "5. ReleaseManifest", is retained at docs/platform/packaging-distribution/contracts/release-manifest.md#unheaded-block-12. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the contracts/release-manifest.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
The release manifest is the immutable statement of what an fgOS release
contains.
```

### Target unit

```text
The release manifest is the immutable statement of what an fgOS release
contains.
```

### Unified diff

```diff
No text difference.
```

## claim_34af5eabebda68848f5a4f158e81702f

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-37

Target: docs/platform/packaging-distribution/contracts/release-manifest.md#unheaded-block-13

Source identity digest: `d54d128a83d245d152077055d35030f291cd78b240184690839922bd087e8124`

Target identity digest: `d54d128a83d245d152077055d35030f291cd78b240184690839922bd087e8124`

Source shown SHA256: `d54d128a83d245d152077055d35030f291cd78b240184690839922bd087e8124`

Target shown SHA256: `d54d128a83d245d152077055d35030f291cd78b240184690839922bd087e8124`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_34af5eabebda68848f5a4f158e81702f |
| sourceUnitDigest | d54d128a83d245d152077055d35030f291cd78b240184690839922bd087e8124 |
| targetOwner | docs/platform/packaging-distribution/contracts/release-manifest.md |
| targetAnchor | unheaded-block-13 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-37, under "5. ReleaseManifest", is retained at docs/platform/packaging-distribution/contracts/release-manifest.md#unheaded-block-13. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the contracts/release-manifest.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
The canonical artifact digest is computed from this release tree manifest, not
from a `.zip`, `.tar.gz`, npm package archive, or transport wrapper. Archive
digests may still be recorded for download/integrity diagnostics, but they are
not runtime identity. Runtime identity must survive different compression
formats, package transports, and mirror locations.
```

### Target unit

```text
The canonical artifact digest is computed from this release tree manifest, not
from a `.zip`, `.tar.gz`, npm package archive, or transport wrapper. Archive
digests may still be recorded for download/integrity diagnostics, but they are
not runtime identity. Runtime identity must survive different compression
formats, package transports, and mirror locations.
```

### Unified diff

```diff
No text difference.
```

## claim_c809de74f3631def7b3b3098a6290c9a

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-38

Target: docs/platform/packaging-distribution/contracts/release-manifest.md#unheaded-block-14

Source identity digest: `3e69f5309c46f933c74b52c6b3ec9c8b684a0f686fa0ae36e99d609832c8b61a`

Target identity digest: `3e69f5309c46f933c74b52c6b3ec9c8b684a0f686fa0ae36e99d609832c8b61a`

Source shown SHA256: `3e69f5309c46f933c74b52c6b3ec9c8b684a0f686fa0ae36e99d609832c8b61a`

Target shown SHA256: `3e69f5309c46f933c74b52c6b3ec9c8b684a0f686fa0ae36e99d609832c8b61a`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_c809de74f3631def7b3b3098a6290c9a |
| sourceUnitDigest | 3e69f5309c46f933c74b52c6b3ec9c8b684a0f686fa0ae36e99d609832c8b61a |
| targetOwner | docs/platform/packaging-distribution/contracts/release-manifest.md |
| targetAnchor | unheaded-block-14 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-38, under "5. ReleaseManifest", is retained at docs/platform/packaging-distribution/contracts/release-manifest.md#unheaded-block-14. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the contracts/release-manifest.md topic owner; carriage does not certify current implementation. |

### Source unit

````text
The digest formula is:

```txt
fileDigest = sha256(file bytes as emitted by the release build)
artifactDigest = sha256(canonical-json(release tree manifest without artifactDigest))
```
````

### Target unit

````text
The digest formula is:

```txt
fileDigest = sha256(file bytes as emitted by the release build)
artifactDigest = sha256(canonical-json(release tree manifest without artifactDigest))
```
````

### Unified diff

```diff
No text difference.
```

## claim_4ece2063c9e19d3693005ab4de9f86a1

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-39

Target: docs/platform/packaging-distribution/contracts/release-manifest.md#unheaded-block-15

Source identity digest: `ead8dd03ae57188ef8d39dbaeb54e973410f426f88701f050dbb675f87ac8829`

Target identity digest: `ead8dd03ae57188ef8d39dbaeb54e973410f426f88701f050dbb675f87ac8829`

Source shown SHA256: `ead8dd03ae57188ef8d39dbaeb54e973410f426f88701f050dbb675f87ac8829`

Target shown SHA256: `ead8dd03ae57188ef8d39dbaeb54e973410f426f88701f050dbb675f87ac8829`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_4ece2063c9e19d3693005ab4de9f86a1 |
| sourceUnitDigest | ead8dd03ae57188ef8d39dbaeb54e973410f426f88701f050dbb675f87ac8829 |
| targetOwner | docs/platform/packaging-distribution/contracts/release-manifest.md |
| targetAnchor | unheaded-block-15 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-39, under "5. ReleaseManifest", is retained at docs/platform/packaging-distribution/contracts/release-manifest.md#unheaded-block-15. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the contracts/release-manifest.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
The release build, not the installer, owns byte normalization. Install should
not rewrite line endings or file contents to make a digest pass.
```

### Target unit

```text
The release build, not the installer, owns byte normalization. Install should
not rewrite line endings or file contents to make a digest pass.
```

### Unified diff

```diff
No text difference.
```

## claim_ef427cea4a40a9001dcf5f004d5cda64

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-40

Target: docs/platform/packaging-distribution/contracts/release-manifest.md#unheaded-block-16

Source identity digest: `04f33e62f1f152294e35b2d568d3efcec43f8efd6629e623ead9e34bc9f860f4`

Target identity digest: `04f33e62f1f152294e35b2d568d3efcec43f8efd6629e623ead9e34bc9f860f4`

Source shown SHA256: `04f33e62f1f152294e35b2d568d3efcec43f8efd6629e623ead9e34bc9f860f4`

Target shown SHA256: `04f33e62f1f152294e35b2d568d3efcec43f8efd6629e623ead9e34bc9f860f4`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_ef427cea4a40a9001dcf5f004d5cda64 |
| sourceUnitDigest | 04f33e62f1f152294e35b2d568d3efcec43f8efd6629e623ead9e34bc9f860f4 |
| targetOwner | docs/platform/packaging-distribution/contracts/release-manifest.md |
| targetAnchor | unheaded-block-16 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-40, under "5. ReleaseManifest", is retained at docs/platform/packaging-distribution/contracts/release-manifest.md#unheaded-block-16. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the contracts/release-manifest.md topic owner; carriage does not certify current implementation. |

### Source unit

````text
Minimum fields:

```json
{
  "schemaVersion": 1,
  "artifactDigest": "sha256:...",
  "digestKind": "release-tree-manifest",
  "releaseVersion": "0.1.0",
  "sourceRevision": "...",
  "createdAt": "2026-09-04T00:00:00Z",
  "target": {
    "os": "linux",
    "arch": "x64",
    "libc": "glibc"
  },
  "entries": {
    "fgos": "bin/fgos",
    "fgosRunner": "bin/fgos-runner"
  },
  "components": {
    "legacyNode": {
      "root": "libexec/legacy-node",
      "entry": "bin/fgos.mjs",
      "digest": "sha256:..."
    },
    "runner": {
      "path": "bin/fgos-runner",
      "digest": "sha256:..."
    },
    "workshop": {
      "skillsDigest": "sha256:...",
      "agentsDigest": "sha256:...",
      "proseDigest": "sha256:..."
    }
  },
  "requires": {
    "node": ">=20 <23",
    "git": ">=2.39"
  },
  "adapter": {
    "protocolVersion": "1",
    "entry": "bin/fgos adapter",
    "capabilities": []
  },
  "stateSchemas": {
    "read": ["1"],
    "write": ["1"],
    "migrations": []
  },
  "files": []
}
```
````

### Target unit

````text
Minimum fields:

```json
{
  "schemaVersion": 1,
  "artifactDigest": "sha256:...",
  "digestKind": "release-tree-manifest",
  "releaseVersion": "0.1.0",
  "sourceRevision": "...",
  "createdAt": "2026-09-04T00:00:00Z",
  "target": {
    "os": "linux",
    "arch": "x64",
    "libc": "glibc"
  },
  "entries": {
    "fgos": "bin/fgos",
    "fgosRunner": "bin/fgos-runner"
  },
  "components": {
    "legacyNode": {
      "root": "libexec/legacy-node",
      "entry": "bin/fgos.mjs",
      "digest": "sha256:..."
    },
    "runner": {
      "path": "bin/fgos-runner",
      "digest": "sha256:..."
    },
    "workshop": {
      "skillsDigest": "sha256:...",
      "agentsDigest": "sha256:...",
      "proseDigest": "sha256:..."
    }
  },
  "requires": {
    "node": ">=20 <23",
    "git": ">=2.39"
  },
  "adapter": {
    "protocolVersion": "1",
    "entry": "bin/fgos adapter",
    "capabilities": []
  },
  "stateSchemas": {
    "read": ["1"],
    "write": ["1"],
    "migrations": []
  },
  "files": []
}
```
````

### Unified diff

```diff
No text difference.
```

## claim_5b308c0d698cf4b6e679cefd4b72159e

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-41

Target: docs/platform/packaging-distribution/contracts/release-manifest.md#unheaded-block-17

Source identity digest: `b22b5c1e8b0d30d63d4ecdff35d16e1b07c4e8f1dddb748e55fdc961c6f1e7ac`

Target identity digest: `2c2c843c119b46a01d8e99728f09aa95a1bd650fe7c85276230a0324ccf40265`

Source shown SHA256: `b22b5c1e8b0d30d63d4ecdff35d16e1b07c4e8f1dddb748e55fdc961c6f1e7ac`

Target shown SHA256: `2c2c843c119b46a01d8e99728f09aa95a1bd650fe7c85276230a0324ccf40265`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_5b308c0d698cf4b6e679cefd4b72159e |
| sourceUnitDigest | b22b5c1e8b0d30d63d4ecdff35d16e1b07c4e8f1dddb748e55fdc961c6f1e7ac |
| targetOwner | docs/platform/packaging-distribution/contracts/release-manifest.md |
| targetAnchor | unheaded-block-17 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-41, under "5. ReleaseManifest", is retained at docs/platform/packaging-distribution/contracts/release-manifest.md#unheaded-block-17. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the contracts/release-manifest.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
`components.legacyNode` names a payload **root** plus an **entry** inside it, not a single file (proposed 2026-09-10 by the host-invocation stream, see [Legacy CLI Transition](../host-invocation-routing/legacy-cli-transition.md) §2): the legacy payload is the whole Node package as `package.json` `files` defines it, staged with its source-relative layout intact so `bin/fgos.mjs` needs no import changes, and `bin/fgos-runner.mjs` lives in the same root. The Rust host resolves `join(activeReleasePath, root, entry)` and nothing else. A `dev:<rev>` source activation declares `root: "."`, `entry: "bin/fgos.mjs"`, `entries.fgos: "target/release/fgos"` — the same fields serve dogfood and a staged release.
```

### Target unit

```text
`components.legacyNode` names a payload **root** plus an **entry** inside it, not a single file (proposed 2026-09-10 by the host-invocation stream, see [Legacy CLI Transition](../../../architect/host-invocation-routing/legacy-cli-transition.md) §2): the legacy payload is the whole Node package as `package.json` `files` defines it, staged with its source-relative layout intact so `bin/fgos.mjs` needs no import changes, and `bin/fgos-runner.mjs` lives in the same root. The Rust host resolves `join(activeReleasePath, root, entry)` and nothing else. A `dev:<rev>` source activation declares `root: "."`, `entry: "bin/fgos.mjs"`, `entries.fgos: "target/release/fgos"` — the same fields serve dogfood and a staged release.
```

### Unified diff

```diff
--- "docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-41"
+++ "docs/platform/packaging-distribution/contracts/release-manifest.md#unheaded-block-17"
@@ -1 +1 @@
-`components.legacyNode` names a payload **root** plus an **entry** inside it, not a single file (proposed 2026-09-10 by the host-invocation stream, see [Legacy CLI Transition](../host-invocation-routing/legacy-cli-transition.md) §2): the legacy payload is the whole Node package as `package.json` `files` defines it, staged with its source-relative layout intact so `bin/fgos.mjs` needs no import changes, and `bin/fgos-runner.mjs` lives in the same root. The Rust host resolves `join(activeReleasePath, root, entry)` and nothing else. A `dev:<rev>` source activation declares `root: "."`, `entry: "bin/fgos.mjs"`, `entries.fgos: "target/release/fgos"` — the same fields serve dogfood and a staged release.
\ No newline at end of file
+`components.legacyNode` names a payload **root** plus an **entry** inside it, not a single file (proposed 2026-09-10 by the host-invocation stream, see [Legacy CLI Transition](../../../architect/host-invocation-routing/legacy-cli-transition.md) §2): the legacy payload is the whole Node package as `package.json` `files` defines it, staged with its source-relative layout intact so `bin/fgos.mjs` needs no import changes, and `bin/fgos-runner.mjs` lives in the same root. The Rust host resolves `join(activeReleasePath, root, entry)` and nothing else. A `dev:<rev>` source activation declares `root: "."`, `entry: "bin/fgos.mjs"`, `entries.fgos: "target/release/fgos"` — the same fields serve dogfood and a staged release.
\ No newline at end of file
```

## claim_66db7a2760e67bac298e8fa999e03918

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#release-tree-canonicalization

Target: docs/platform/packaging-distribution/contracts/release-manifest.md#release-tree-canonicalization

Source identity digest: `fe23874c284a1ce551815f8f69081e047472f13b62fa1ac1bd9301501c354007`

Target identity digest: `e5a1f647f9052ce79f148d74ecc48822debe0894583bee4117ebebcf5a525162`

Source shown SHA256: `cf6e3fb57f94f1452f5377d23ee27fc7d0c900d1ec26b77c672baf2d6f378eec`

Target shown SHA256: `5604680f68019b38d2c0a23fd0e6fbeedcbe9715ad31115a0a4ae44cc7665e13`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_66db7a2760e67bac298e8fa999e03918 |
| sourceUnitDigest | fe23874c284a1ce551815f8f69081e047472f13b62fa1ac1bd9301501c354007 |
| targetOwner | docs/platform/packaging-distribution/contracts/release-manifest.md |
| targetAnchor | release-tree-canonicalization |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete heading from docs/architect/packaging-distribution/runtime-identity-and-activation.md#release-tree-canonicalization, under "Release Tree Canonicalization", is retained at docs/platform/packaging-distribution/contracts/release-manifest.md#release-tree-canonicalization. Only heading depth changes; the direct section payload follows the original source order. The named owner is the contracts/release-manifest.md topic owner; carriage does not certify current implementation. |

### Source unit

````text
### Release Tree Canonicalization

V1 uses a logical release file tree, not raw filesystem metadata.

| Field / Rule | V1 Decision |
|---|---|
| Path root | All paths are relative to the release root. Absolute paths are invalid. |
| Path separator | Always `/`, including on Windows. |
| Path normalization | UTF-8 NFC normalization before ordering and digesting. |
| Path order | Lexicographic byte order after normalization. |
| Case collision | Refuse a release if two paths collide under case-insensitive comparison. |
| File digest | SHA-256 of exact release-build bytes. |
| Line endings | Included in file bytes. Build must normalize if needed; install must not rewrite. |
| Executable bit | Included as `mode`, at least `755` vs `644`. |
| Directory entries | Not hashed as separate entries; directories are inferred from file paths. |
| Symlink | Refused in V1. Add explicit `kind: "symlink"` later only with relative, non-escaping targets. |
| mtime / owner / group | Excluded from runtime identity. |
| Archive digest | Optional `transportDigest`; never the runtime identity. |

Each file entry should include an ownership class:

```json
{
  "path": "bin/fgos",
  "kind": "file",
  "digest": "sha256:...",
  "mode": "755",
  "class": "immutable-entry"
}
```

Initial classes:

| Class | Meaning |
|---|---|
| `immutable-entry` | Public executable entry included in the release. |
| `immutable-runtime` | Runtime implementation/provider file. |
| `immutable-workshop-source` | Canonical skills, agents, or prose shipped with the runtime. |
| `immutable-doc` | Shipped documentation/prose used by users or agents. |
| `metadata` | Manifest or metadata file that participates in release identity. |

Generated workspace projections are not recorded as release-tree files at
their projected workspace paths. The release manifest records their canonical
source material; `ProjectionLedger` records where that material was projected
inside the workspace.

`files` may eventually contain every immutable release file and digest. The
minimum useful fingerprint set is:

- public entry binaries;
- provider descriptors;
- active host entry at `bin/fgos` whether implemented by Node first or Rust
  later;
- legacy Node payload;
- runner;
- adapter metadata/entry;
- init/doctor registries;
- skills, agents, prose source;
- manifest files themselves.
````

### Target unit

````text
##### Release Tree Canonicalization

V1 uses a logical release file tree, not raw filesystem metadata.

| Field / Rule | V1 Decision |
|---|---|
| Path root | All paths are relative to the release root. Absolute paths are invalid. |
| Path separator | Always `/`, including on Windows. |
| Path normalization | UTF-8 NFC normalization before ordering and digesting. |
| Path order | Lexicographic byte order after normalization. |
| Case collision | Refuse a release if two paths collide under case-insensitive comparison. |
| File digest | SHA-256 of exact release-build bytes. |
| Line endings | Included in file bytes. Build must normalize if needed; install must not rewrite. |
| Executable bit | Included as `mode`, at least `755` vs `644`. |
| Directory entries | Not hashed as separate entries; directories are inferred from file paths. |
| Symlink | Refused in V1. Add explicit `kind: "symlink"` later only with relative, non-escaping targets. |
| mtime / owner / group | Excluded from runtime identity. |
| Archive digest | Optional `transportDigest`; never the runtime identity. |

Each file entry should include an ownership class:

```json
{
  "path": "bin/fgos",
  "kind": "file",
  "digest": "sha256:...",
  "mode": "755",
  "class": "immutable-entry"
}
```

Initial classes:

| Class | Meaning |
|---|---|
| `immutable-entry` | Public executable entry included in the release. |
| `immutable-runtime` | Runtime implementation/provider file. |
| `immutable-workshop-source` | Canonical skills, agents, or prose shipped with the runtime. |
| `immutable-doc` | Shipped documentation/prose used by users or agents. |
| `metadata` | Manifest or metadata file that participates in release identity. |

Generated workspace projections are not recorded as release-tree files at
their projected workspace paths. The release manifest records their canonical
source material; `ProjectionLedger` records where that material was projected
inside the workspace.

`files` may eventually contain every immutable release file and digest. The
minimum useful fingerprint set is:

- public entry binaries;
- provider descriptors;
- active host entry at `bin/fgos` whether implemented by Node first or Rust
  later;
- legacy Node payload;
- runner;
- adapter metadata/entry;
- init/doctor registries;
- skills, agents, prose source;
- manifest files themselves.
````

### Unified diff

```diff
--- "docs/architect/packaging-distribution/runtime-identity-and-activation.md#release-tree-canonicalization"
+++ "docs/platform/packaging-distribution/contracts/release-manifest.md#release-tree-canonicalization"
@@ -1,4 +1,4 @@
-### Release Tree Canonicalization
+##### Release Tree Canonicalization
 
 V1 uses a logical release file tree, not raw filesystem metadata.
```

## claim_e53e994efd41de413243c7feb18609f5

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-42

Target: docs/platform/packaging-distribution/contracts/release-manifest.md#unheaded-block-18

Source identity digest: `7f7044001655743cdc702ec27b67e4ab6e1801cb4ea72c8b4ff3cc36fc80416f`

Target identity digest: `7f7044001655743cdc702ec27b67e4ab6e1801cb4ea72c8b4ff3cc36fc80416f`

Source shown SHA256: `7f7044001655743cdc702ec27b67e4ab6e1801cb4ea72c8b4ff3cc36fc80416f`

Target shown SHA256: `7f7044001655743cdc702ec27b67e4ab6e1801cb4ea72c8b4ff3cc36fc80416f`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_e53e994efd41de413243c7feb18609f5 |
| sourceUnitDigest | 7f7044001655743cdc702ec27b67e4ab6e1801cb4ea72c8b4ff3cc36fc80416f |
| targetOwner | docs/platform/packaging-distribution/contracts/release-manifest.md |
| targetAnchor | unheaded-block-18 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-42, under "Release Tree Canonicalization", is retained at docs/platform/packaging-distribution/contracts/release-manifest.md#unheaded-block-18. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the contracts/release-manifest.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
V1 uses a logical release file tree, not raw filesystem metadata.
```

### Target unit

```text
V1 uses a logical release file tree, not raw filesystem metadata.
```

### Unified diff

```diff
No text difference.
```

## claim_3153b26f053448afc0c13f85a80b2337

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-43

Target: docs/platform/packaging-distribution/contracts/release-manifest.md#unheaded-block-19

Source identity digest: `b36d585b2b0651d5b9fd0cb39af3fa2430ab9f91154893fe4a4ba25d8fc10069`

Target identity digest: `b36d585b2b0651d5b9fd0cb39af3fa2430ab9f91154893fe4a4ba25d8fc10069`

Source shown SHA256: `b36d585b2b0651d5b9fd0cb39af3fa2430ab9f91154893fe4a4ba25d8fc10069`

Target shown SHA256: `b36d585b2b0651d5b9fd0cb39af3fa2430ab9f91154893fe4a4ba25d8fc10069`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_3153b26f053448afc0c13f85a80b2337 |
| sourceUnitDigest | b36d585b2b0651d5b9fd0cb39af3fa2430ab9f91154893fe4a4ba25d8fc10069 |
| targetOwner | docs/platform/packaging-distribution/contracts/release-manifest.md |
| targetAnchor | unheaded-block-19 |
| claimKind | decision |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-43, under "Release Tree Canonicalization", is retained at docs/platform/packaging-distribution/contracts/release-manifest.md#unheaded-block-19. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the contracts/release-manifest.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
| Field / Rule | V1 Decision |
|---|---|
| Path root | All paths are relative to the release root. Absolute paths are invalid. |
| Path separator | Always `/`, including on Windows. |
| Path normalization | UTF-8 NFC normalization before ordering and digesting. |
| Path order | Lexicographic byte order after normalization. |
| Case collision | Refuse a release if two paths collide under case-insensitive comparison. |
| File digest | SHA-256 of exact release-build bytes. |
| Line endings | Included in file bytes. Build must normalize if needed; install must not rewrite. |
| Executable bit | Included as `mode`, at least `755` vs `644`. |
| Directory entries | Not hashed as separate entries; directories are inferred from file paths. |
| Symlink | Refused in V1. Add explicit `kind: "symlink"` later only with relative, non-escaping targets. |
| mtime / owner / group | Excluded from runtime identity. |
| Archive digest | Optional `transportDigest`; never the runtime identity. |
```

### Target unit

```text
| Field / Rule | V1 Decision |
|---|---|
| Path root | All paths are relative to the release root. Absolute paths are invalid. |
| Path separator | Always `/`, including on Windows. |
| Path normalization | UTF-8 NFC normalization before ordering and digesting. |
| Path order | Lexicographic byte order after normalization. |
| Case collision | Refuse a release if two paths collide under case-insensitive comparison. |
| File digest | SHA-256 of exact release-build bytes. |
| Line endings | Included in file bytes. Build must normalize if needed; install must not rewrite. |
| Executable bit | Included as `mode`, at least `755` vs `644`. |
| Directory entries | Not hashed as separate entries; directories are inferred from file paths. |
| Symlink | Refused in V1. Add explicit `kind: "symlink"` later only with relative, non-escaping targets. |
| mtime / owner / group | Excluded from runtime identity. |
| Archive digest | Optional `transportDigest`; never the runtime identity. |
```

### Unified diff

```diff
No text difference.
```

## claim_4486d8c871bc7cace22f5877da298119

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-44

Target: docs/platform/packaging-distribution/contracts/release-manifest.md#unheaded-block-20

Source identity digest: `97cd2867dcc936f5efe7950bc065efc46379f62647e62718b515fb4bdde90b03`

Target identity digest: `97cd2867dcc936f5efe7950bc065efc46379f62647e62718b515fb4bdde90b03`

Source shown SHA256: `97cd2867dcc936f5efe7950bc065efc46379f62647e62718b515fb4bdde90b03`

Target shown SHA256: `97cd2867dcc936f5efe7950bc065efc46379f62647e62718b515fb4bdde90b03`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_4486d8c871bc7cace22f5877da298119 |
| sourceUnitDigest | 97cd2867dcc936f5efe7950bc065efc46379f62647e62718b515fb4bdde90b03 |
| targetOwner | docs/platform/packaging-distribution/contracts/release-manifest.md |
| targetAnchor | unheaded-block-20 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-44, under "Release Tree Canonicalization", is retained at docs/platform/packaging-distribution/contracts/release-manifest.md#unheaded-block-20. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the contracts/release-manifest.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
Each file entry should include an ownership class:
```

### Target unit

```text
Each file entry should include an ownership class:
```

### Unified diff

```diff
No text difference.
```

## claim_53faf89f35a824288c56245cbe2ad881

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-45

Target: docs/platform/packaging-distribution/contracts/release-manifest.md#unheaded-block-21

Source identity digest: `738abf5487f9f299c9278c6d13076bcb9385e942dabc5437420d0741ff129b3f`

Target identity digest: `738abf5487f9f299c9278c6d13076bcb9385e942dabc5437420d0741ff129b3f`

Source shown SHA256: `738abf5487f9f299c9278c6d13076bcb9385e942dabc5437420d0741ff129b3f`

Target shown SHA256: `738abf5487f9f299c9278c6d13076bcb9385e942dabc5437420d0741ff129b3f`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_53faf89f35a824288c56245cbe2ad881 |
| sourceUnitDigest | 738abf5487f9f299c9278c6d13076bcb9385e942dabc5437420d0741ff129b3f |
| targetOwner | docs/platform/packaging-distribution/contracts/release-manifest.md |
| targetAnchor | unheaded-block-21 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-45, under "Release Tree Canonicalization", is retained at docs/platform/packaging-distribution/contracts/release-manifest.md#unheaded-block-21. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the contracts/release-manifest.md topic owner; carriage does not certify current implementation. |

### Source unit

````text
```json
{
  "path": "bin/fgos",
  "kind": "file",
  "digest": "sha256:...",
  "mode": "755",
  "class": "immutable-entry"
}
```
````

### Target unit

````text
```json
{
  "path": "bin/fgos",
  "kind": "file",
  "digest": "sha256:...",
  "mode": "755",
  "class": "immutable-entry"
}
```
````

### Unified diff

```diff
No text difference.
```

## claim_4181e74c1b213526e0047eb5d8a3d2ac

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-46

Target: docs/platform/packaging-distribution/contracts/release-manifest.md#unheaded-block-22

Source identity digest: `089a50e18972a630a340349ad3e33a2917b313ac50cb1a1a344a6b78e6096831`

Target identity digest: `089a50e18972a630a340349ad3e33a2917b313ac50cb1a1a344a6b78e6096831`

Source shown SHA256: `089a50e18972a630a340349ad3e33a2917b313ac50cb1a1a344a6b78e6096831`

Target shown SHA256: `089a50e18972a630a340349ad3e33a2917b313ac50cb1a1a344a6b78e6096831`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_4181e74c1b213526e0047eb5d8a3d2ac |
| sourceUnitDigest | 089a50e18972a630a340349ad3e33a2917b313ac50cb1a1a344a6b78e6096831 |
| targetOwner | docs/platform/packaging-distribution/contracts/release-manifest.md |
| targetAnchor | unheaded-block-22 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-46, under "Release Tree Canonicalization", is retained at docs/platform/packaging-distribution/contracts/release-manifest.md#unheaded-block-22. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the contracts/release-manifest.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
Initial classes:

| Class | Meaning |
|---|---|
| `immutable-entry` | Public executable entry included in the release. |
| `immutable-runtime` | Runtime implementation/provider file. |
| `immutable-workshop-source` | Canonical skills, agents, or prose shipped with the runtime. |
| `immutable-doc` | Shipped documentation/prose used by users or agents. |
| `metadata` | Manifest or metadata file that participates in release identity. |
```

### Target unit

```text
Initial classes:

| Class | Meaning |
|---|---|
| `immutable-entry` | Public executable entry included in the release. |
| `immutable-runtime` | Runtime implementation/provider file. |
| `immutable-workshop-source` | Canonical skills, agents, or prose shipped with the runtime. |
| `immutable-doc` | Shipped documentation/prose used by users or agents. |
| `metadata` | Manifest or metadata file that participates in release identity. |
```

### Unified diff

```diff
No text difference.
```

## claim_2ce83669de6ea1d99233cd5dfee3de09

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-47

Target: docs/platform/packaging-distribution/contracts/release-manifest.md#unheaded-block-23

Source identity digest: `55012af631606c03d5fb4a9a0364f518b2e1e6c8144aef25ec3fd46db54cffdb`

Target identity digest: `55012af631606c03d5fb4a9a0364f518b2e1e6c8144aef25ec3fd46db54cffdb`

Source shown SHA256: `55012af631606c03d5fb4a9a0364f518b2e1e6c8144aef25ec3fd46db54cffdb`

Target shown SHA256: `55012af631606c03d5fb4a9a0364f518b2e1e6c8144aef25ec3fd46db54cffdb`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_2ce83669de6ea1d99233cd5dfee3de09 |
| sourceUnitDigest | 55012af631606c03d5fb4a9a0364f518b2e1e6c8144aef25ec3fd46db54cffdb |
| targetOwner | docs/platform/packaging-distribution/contracts/release-manifest.md |
| targetAnchor | unheaded-block-23 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-47, under "Release Tree Canonicalization", is retained at docs/platform/packaging-distribution/contracts/release-manifest.md#unheaded-block-23. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the contracts/release-manifest.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
Generated workspace projections are not recorded as release-tree files at
their projected workspace paths. The release manifest records their canonical
source material; `ProjectionLedger` records where that material was projected
inside the workspace.
```

### Target unit

```text
Generated workspace projections are not recorded as release-tree files at
their projected workspace paths. The release manifest records their canonical
source material; `ProjectionLedger` records where that material was projected
inside the workspace.
```

### Unified diff

```diff
No text difference.
```

## claim_ab15836d7a655b68626a332fa0667efb

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-48

Target: docs/platform/packaging-distribution/contracts/release-manifest.md#unheaded-block-24

Source identity digest: `3d1ea331b51042a1bdaefa21bcc3b9736a3698b201646581d4c7e2210321b320`

Target identity digest: `3d1ea331b51042a1bdaefa21bcc3b9736a3698b201646581d4c7e2210321b320`

Source shown SHA256: `3d1ea331b51042a1bdaefa21bcc3b9736a3698b201646581d4c7e2210321b320`

Target shown SHA256: `3d1ea331b51042a1bdaefa21bcc3b9736a3698b201646581d4c7e2210321b320`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_ab15836d7a655b68626a332fa0667efb |
| sourceUnitDigest | 3d1ea331b51042a1bdaefa21bcc3b9736a3698b201646581d4c7e2210321b320 |
| targetOwner | docs/platform/packaging-distribution/contracts/release-manifest.md |
| targetAnchor | unheaded-block-24 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-48, under "Release Tree Canonicalization", is retained at docs/platform/packaging-distribution/contracts/release-manifest.md#unheaded-block-24. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the contracts/release-manifest.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
`files` may eventually contain every immutable release file and digest. The
minimum useful fingerprint set is:
```

### Target unit

```text
`files` may eventually contain every immutable release file and digest. The
minimum useful fingerprint set is:
```

### Unified diff

```diff
No text difference.
```

## claim_bb2261debf9bf9f07bb9a0841991d1a2

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-49

Target: docs/platform/packaging-distribution/contracts/release-manifest.md#unheaded-block-25

Source identity digest: `32122ff0553fd6bc31cd9e5f77b680f47feb87399f7c1e0561c50e46730b49af`

Target identity digest: `32122ff0553fd6bc31cd9e5f77b680f47feb87399f7c1e0561c50e46730b49af`

Source shown SHA256: `32122ff0553fd6bc31cd9e5f77b680f47feb87399f7c1e0561c50e46730b49af`

Target shown SHA256: `32122ff0553fd6bc31cd9e5f77b680f47feb87399f7c1e0561c50e46730b49af`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_bb2261debf9bf9f07bb9a0841991d1a2 |
| sourceUnitDigest | 32122ff0553fd6bc31cd9e5f77b680f47feb87399f7c1e0561c50e46730b49af |
| targetOwner | docs/platform/packaging-distribution/contracts/release-manifest.md |
| targetAnchor | unheaded-block-25 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-49, under "Release Tree Canonicalization", is retained at docs/platform/packaging-distribution/contracts/release-manifest.md#unheaded-block-25. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the contracts/release-manifest.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
- public entry binaries;
- provider descriptors;
- active host entry at `bin/fgos` whether implemented by Node first or Rust
  later;
- legacy Node payload;
- runner;
- adapter metadata/entry;
- init/doctor registries;
- skills, agents, prose source;
- manifest files themselves.
```

### Target unit

```text
- public entry binaries;
- provider descriptors;
- active host entry at `bin/fgos` whether implemented by Node first or Rust
  later;
- legacy Node payload;
- runner;
- adapter metadata/entry;
- init/doctor registries;
- skills, agents, prose source;
- manifest files themselves.
```

### Unified diff

```diff
No text difference.
```

## claim_e4bf9b812f0b787bcf56246677865361

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#6-workspaceactivationbinding

Target: docs/platform/packaging-distribution/contracts/activation-binding.md#6-workspaceactivationbinding

Source identity digest: `57af5b1c65fd1dda38b5e2fa7e5231049f66141d34f71578f2509b78a4994305`

Target identity digest: `af026389acc476c217dd34e67292fe2ab3a06c89ccbe09e95f77a5f342e9e2f1`

Source shown SHA256: `bf8d61bb919b6ecb32f956bdc469ef583855749d23994adcc064d9ef384830d4`

Target shown SHA256: `e00f1788095d833ad6bb4d38a06a52b3fa605f7441c9589dcd3feb5d4ecb76fa`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_e4bf9b812f0b787bcf56246677865361 |
| sourceUnitDigest | 57af5b1c65fd1dda38b5e2fa7e5231049f66141d34f71578f2509b78a4994305 |
| targetOwner | docs/platform/packaging-distribution/contracts/activation-binding.md |
| targetAnchor | 6-workspaceactivationbinding |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete heading from docs/architect/packaging-distribution/runtime-identity-and-activation.md#6-workspaceactivationbinding, under "6. WorkspaceActivationBinding", is retained at docs/platform/packaging-distribution/contracts/activation-binding.md#6-workspaceactivationbinding. Only heading depth changes; the direct section payload follows the original source order. The named owner is the contracts/activation-binding.md topic owner; carriage does not certify current implementation. |

### Source unit

````text
## 6. WorkspaceActivationBinding

Activation is the moment a staged and verified release becomes the runtime
authority for one workspace. V1 uses workspace
`.fgos/installation/activation.json` as a durably published ready binding, not a
symlink and not one repository-wide active pointer.

Minimum fields:

```json
{
  "schemaVersion": 1,
  "repositoryId": "repo_...",
  "workspaceId": "wks_...",
  "workStateId": "state_...",
  "activationId": "act_...",
  "status": "ready",
  "artifactDigest": "sha256:...",
  "releasePath": "<release-store-root>/releases/sha256-...",
  "previousArtifactDigest": "sha256:...",
  "shimVersion": "1",
  "resolvedDependencies": {
    "node": "/usr/bin/node"
  },
  "pinSnapshot": {},
  "activatedAt": "2026-09-04T00:00:00Z",
  "activatedBy": {
    "tool": "fgctl",
    "version": "..."
  }
}
```

Publishing must be atomic from the perspective of invocations. A project
command must see either the previous ready workspace binding or the new ready
workspace binding, never a half-prepared runtime.

`fgctl` must hold the release store `install.lock` before staging, verifying,
repairing, upgrading, rolling back, or quarantining release content. It must
also hold a workspace activation lock before writing that workspace's
`activation.json`. Projection writes are not part of the activation publish;
they belong to local `fgos init` / `fgos doctor --fix` under projection locks
defined by workspace topology.

Implementation should use a temp file plus atomic rename for
`activation.json`:

```txt
write <workspace-root>/.fgos/installation/activation.json.tmp.<activationId>
fsync file when supported
rename tmp -> <workspace-root>/.fgos/installation/activation.json
fsync parent directory when supported
```

The stable shims under `.fgos/installation/bin/` should not change during normal
activation. Activation changes the selected release identity, not the command
path callers use.

`activation.json` should contain only a durably published ready runtime
binding. Do not write `status: "preparing"` into `activation.json`.
Installation/activation transaction state belongs in the release store:

```txt
<release-store-root>/installs/<activationId>.json
```

Possible transaction statuses:

```txt
staging
verified
preparing
ready-published
ready-degraded
complete
failed
quarantined
```

Failure rules:

| Failure Point | `activation.json` | Transaction / Payload Action |
|---|---|---|
| Acquire/stage fails | Unchanged | Mark install transaction failed; remove or keep staged temp for diagnostics. |
| Verify fails | Unchanged | Refuse activation; quarantine or remove staged release. |
| Runtime dependency missing | Unchanged | Refuse activation with `runtime-dependency-missing`. |
| Candidate preflight fails before publish | Unchanged | Mark transaction `failed`; candidate has no writer authority and must not touch host-visible projections. |
| Atomic binding write fails | Previous ready binding remains authoritative if readable | Fail closed; do not run local workflow from candidate. |
| Active local `fgos init` / `doctor --fix` projection tail fails after publish | New ready binding remains authoritative | Mark transaction `ready-degraded`; local doctor reports repair action. |

The important rule is readiness: a candidate release does not gain writer
authority merely because it was staged or verified. It gains writer authority
for a workspace only after the workspace binding is published with
`status: "ready"`.

During preparation, `fgctl` may invoke the candidate release directly with a
restricted bootstrap context:

```txt
FGOS_BOOTSTRAP_CANDIDATE=1
FGOS_CANDIDATE_ARTIFACT_DIGEST=<digest>
FGOS_CANDIDATE_RELEASE_PATH=<path>
```

In that context the candidate may run preflight checks and write only staging
records under the installation transaction. It must not write host-visible
projection paths, execute general workflow mutations, or claim/write shared
work-state as the active runtime.
````

### Target unit

````text
#### 6. WorkspaceActivationBinding

Activation is the moment a staged and verified release becomes the runtime
authority for one workspace. V1 uses workspace
`.fgos/installation/activation.json` as a durably published ready binding, not a
symlink and not one repository-wide active pointer.

Minimum fields:

```json
{
  "schemaVersion": 1,
  "repositoryId": "repo_...",
  "workspaceId": "wks_...",
  "workStateId": "state_...",
  "activationId": "act_...",
  "status": "ready",
  "artifactDigest": "sha256:...",
  "releasePath": "<release-store-root>/releases/sha256-...",
  "previousArtifactDigest": "sha256:...",
  "shimVersion": "1",
  "resolvedDependencies": {
    "node": "/usr/bin/node"
  },
  "pinSnapshot": {},
  "activatedAt": "2026-09-04T00:00:00Z",
  "activatedBy": {
    "tool": "fgctl",
    "version": "..."
  }
}
```

Publishing must be atomic from the perspective of invocations. A project
command must see either the previous ready workspace binding or the new ready
workspace binding, never a half-prepared runtime.

`fgctl` must hold the release store `install.lock` before staging, verifying,
repairing, upgrading, rolling back, or quarantining release content. It must
also hold a workspace activation lock before writing that workspace's
`activation.json`. Projection writes are not part of the activation publish;
they belong to local `fgos init` / `fgos doctor --fix` under projection locks
defined by workspace topology.

Implementation should use a temp file plus atomic rename for
`activation.json`:

```txt
write <workspace-root>/.fgos/installation/activation.json.tmp.<activationId>
fsync file when supported
rename tmp -> <workspace-root>/.fgos/installation/activation.json
fsync parent directory when supported
```

The stable shims under `.fgos/installation/bin/` should not change during normal
activation. Activation changes the selected release identity, not the command
path callers use.

`activation.json` should contain only a durably published ready runtime
binding. Do not write `status: "preparing"` into `activation.json`.
Installation/activation transaction state belongs in the release store:

```txt
<release-store-root>/installs/<activationId>.json
```

Possible transaction statuses:

```txt
staging
verified
preparing
ready-published
ready-degraded
complete
failed
quarantined
```

Failure rules:

| Failure Point | `activation.json` | Transaction / Payload Action |
|---|---|---|
| Acquire/stage fails | Unchanged | Mark install transaction failed; remove or keep staged temp for diagnostics. |
| Verify fails | Unchanged | Refuse activation; quarantine or remove staged release. |
| Runtime dependency missing | Unchanged | Refuse activation with `runtime-dependency-missing`. |
| Candidate preflight fails before publish | Unchanged | Mark transaction `failed`; candidate has no writer authority and must not touch host-visible projections. |
| Atomic binding write fails | Previous ready binding remains authoritative if readable | Fail closed; do not run local workflow from candidate. |
| Active local `fgos init` / `doctor --fix` projection tail fails after publish | New ready binding remains authoritative | Mark transaction `ready-degraded`; local doctor reports repair action. |

The important rule is readiness: a candidate release does not gain writer
authority merely because it was staged or verified. It gains writer authority
for a workspace only after the workspace binding is published with
`status: "ready"`.

During preparation, `fgctl` may invoke the candidate release directly with a
restricted bootstrap context:

```txt
FGOS_BOOTSTRAP_CANDIDATE=1
FGOS_CANDIDATE_ARTIFACT_DIGEST=<digest>
FGOS_CANDIDATE_RELEASE_PATH=<path>
```

In that context the candidate may run preflight checks and write only staging
records under the installation transaction. It must not write host-visible
projection paths, execute general workflow mutations, or claim/write shared
work-state as the active runtime.
````

### Unified diff

```diff
--- "docs/architect/packaging-distribution/runtime-identity-and-activation.md#6-workspaceactivationbinding"
+++ "docs/platform/packaging-distribution/contracts/activation-binding.md#6-workspaceactivationbinding"
@@ -1,4 +1,4 @@
-## 6. WorkspaceActivationBinding
+#### 6. WorkspaceActivationBinding
 
 Activation is the moment a staged and verified release becomes the runtime
 authority for one workspace. V1 uses workspace
```

## claim_a0843b462d3bf38fde961cbb25ca58a0

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-50

Target: docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-12

Source identity digest: `885678733f817f280b07d4b33f77ebe14f07d6adac8890f1731eac84a15fe455`

Target identity digest: `885678733f817f280b07d4b33f77ebe14f07d6adac8890f1731eac84a15fe455`

Source shown SHA256: `885678733f817f280b07d4b33f77ebe14f07d6adac8890f1731eac84a15fe455`

Target shown SHA256: `885678733f817f280b07d4b33f77ebe14f07d6adac8890f1731eac84a15fe455`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_a0843b462d3bf38fde961cbb25ca58a0 |
| sourceUnitDigest | 885678733f817f280b07d4b33f77ebe14f07d6adac8890f1731eac84a15fe455 |
| targetOwner | docs/platform/packaging-distribution/contracts/activation-binding.md |
| targetAnchor | unheaded-block-12 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-50, under "6. WorkspaceActivationBinding", is retained at docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-12. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the contracts/activation-binding.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
Activation is the moment a staged and verified release becomes the runtime
authority for one workspace. V1 uses workspace
`.fgos/installation/activation.json` as a durably published ready binding, not a
symlink and not one repository-wide active pointer.
```

### Target unit

```text
Activation is the moment a staged and verified release becomes the runtime
authority for one workspace. V1 uses workspace
`.fgos/installation/activation.json` as a durably published ready binding, not a
symlink and not one repository-wide active pointer.
```

### Unified diff

```diff
No text difference.
```

## claim_b1302fab2b069f48ae2cc5e5ae9353f7

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-51

Target: docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-13

Source identity digest: `12b89a785769f424521322c24841709e2d53a1fe5a0c7969d85b0e71129abe4b`

Target identity digest: `12b89a785769f424521322c24841709e2d53a1fe5a0c7969d85b0e71129abe4b`

Source shown SHA256: `12b89a785769f424521322c24841709e2d53a1fe5a0c7969d85b0e71129abe4b`

Target shown SHA256: `12b89a785769f424521322c24841709e2d53a1fe5a0c7969d85b0e71129abe4b`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_b1302fab2b069f48ae2cc5e5ae9353f7 |
| sourceUnitDigest | 12b89a785769f424521322c24841709e2d53a1fe5a0c7969d85b0e71129abe4b |
| targetOwner | docs/platform/packaging-distribution/contracts/activation-binding.md |
| targetAnchor | unheaded-block-13 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-51, under "6. WorkspaceActivationBinding", is retained at docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-13. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the contracts/activation-binding.md topic owner; carriage does not certify current implementation. |

### Source unit

````text
Minimum fields:

```json
{
  "schemaVersion": 1,
  "repositoryId": "repo_...",
  "workspaceId": "wks_...",
  "workStateId": "state_...",
  "activationId": "act_...",
  "status": "ready",
  "artifactDigest": "sha256:...",
  "releasePath": "<release-store-root>/releases/sha256-...",
  "previousArtifactDigest": "sha256:...",
  "shimVersion": "1",
  "resolvedDependencies": {
    "node": "/usr/bin/node"
  },
  "pinSnapshot": {},
  "activatedAt": "2026-09-04T00:00:00Z",
  "activatedBy": {
    "tool": "fgctl",
    "version": "..."
  }
}
```
````

### Target unit

````text
Minimum fields:

```json
{
  "schemaVersion": 1,
  "repositoryId": "repo_...",
  "workspaceId": "wks_...",
  "workStateId": "state_...",
  "activationId": "act_...",
  "status": "ready",
  "artifactDigest": "sha256:...",
  "releasePath": "<release-store-root>/releases/sha256-...",
  "previousArtifactDigest": "sha256:...",
  "shimVersion": "1",
  "resolvedDependencies": {
    "node": "/usr/bin/node"
  },
  "pinSnapshot": {},
  "activatedAt": "2026-09-04T00:00:00Z",
  "activatedBy": {
    "tool": "fgctl",
    "version": "..."
  }
}
```
````

### Unified diff

```diff
No text difference.
```

## claim_4b867492e168a488b4d812642f2aad61

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-52

Target: docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-14

Source identity digest: `346ec840057e1f81dffd3b79f9f0c2fa051879aeaa7d1fd1a25b619b02ad9800`

Target identity digest: `346ec840057e1f81dffd3b79f9f0c2fa051879aeaa7d1fd1a25b619b02ad9800`

Source shown SHA256: `346ec840057e1f81dffd3b79f9f0c2fa051879aeaa7d1fd1a25b619b02ad9800`

Target shown SHA256: `346ec840057e1f81dffd3b79f9f0c2fa051879aeaa7d1fd1a25b619b02ad9800`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_4b867492e168a488b4d812642f2aad61 |
| sourceUnitDigest | 346ec840057e1f81dffd3b79f9f0c2fa051879aeaa7d1fd1a25b619b02ad9800 |
| targetOwner | docs/platform/packaging-distribution/contracts/activation-binding.md |
| targetAnchor | unheaded-block-14 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-52, under "6. WorkspaceActivationBinding", is retained at docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-14. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the contracts/activation-binding.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
Publishing must be atomic from the perspective of invocations. A project
command must see either the previous ready workspace binding or the new ready
workspace binding, never a half-prepared runtime.
```

### Target unit

```text
Publishing must be atomic from the perspective of invocations. A project
command must see either the previous ready workspace binding or the new ready
workspace binding, never a half-prepared runtime.
```

### Unified diff

```diff
No text difference.
```

## claim_dcd34697ac5ac6857e5216f7d3798a0d

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-53

Target: docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-15

Source identity digest: `e8964fb80febb2c42771c961f8c52823197acec44b253c0a2f7943c6406d5d4f`

Target identity digest: `e8964fb80febb2c42771c961f8c52823197acec44b253c0a2f7943c6406d5d4f`

Source shown SHA256: `e8964fb80febb2c42771c961f8c52823197acec44b253c0a2f7943c6406d5d4f`

Target shown SHA256: `e8964fb80febb2c42771c961f8c52823197acec44b253c0a2f7943c6406d5d4f`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_dcd34697ac5ac6857e5216f7d3798a0d |
| sourceUnitDigest | e8964fb80febb2c42771c961f8c52823197acec44b253c0a2f7943c6406d5d4f |
| targetOwner | docs/platform/packaging-distribution/contracts/activation-binding.md |
| targetAnchor | unheaded-block-15 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-53, under "6. WorkspaceActivationBinding", is retained at docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-15. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the contracts/activation-binding.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
`fgctl` must hold the release store `install.lock` before staging, verifying,
repairing, upgrading, rolling back, or quarantining release content. It must
also hold a workspace activation lock before writing that workspace's
`activation.json`. Projection writes are not part of the activation publish;
they belong to local `fgos init` / `fgos doctor --fix` under projection locks
defined by workspace topology.
```

### Target unit

```text
`fgctl` must hold the release store `install.lock` before staging, verifying,
repairing, upgrading, rolling back, or quarantining release content. It must
also hold a workspace activation lock before writing that workspace's
`activation.json`. Projection writes are not part of the activation publish;
they belong to local `fgos init` / `fgos doctor --fix` under projection locks
defined by workspace topology.
```

### Unified diff

```diff
No text difference.
```

## claim_25d3080e64bc69696f28d89967456930

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-54

Target: docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-16

Source identity digest: `dcbbe772314b4b46c605c86a35c1e5e25c64da8d299ef2ee22ee460360ac611d`

Target identity digest: `dcbbe772314b4b46c605c86a35c1e5e25c64da8d299ef2ee22ee460360ac611d`

Source shown SHA256: `dcbbe772314b4b46c605c86a35c1e5e25c64da8d299ef2ee22ee460360ac611d`

Target shown SHA256: `dcbbe772314b4b46c605c86a35c1e5e25c64da8d299ef2ee22ee460360ac611d`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_25d3080e64bc69696f28d89967456930 |
| sourceUnitDigest | dcbbe772314b4b46c605c86a35c1e5e25c64da8d299ef2ee22ee460360ac611d |
| targetOwner | docs/platform/packaging-distribution/contracts/activation-binding.md |
| targetAnchor | unheaded-block-16 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-54, under "6. WorkspaceActivationBinding", is retained at docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-16. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the contracts/activation-binding.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
Implementation should use a temp file plus atomic rename for
`activation.json`:
```

### Target unit

```text
Implementation should use a temp file plus atomic rename for
`activation.json`:
```

### Unified diff

```diff
No text difference.
```

## claim_377f8ce648788d30644f3bc51bfe5381

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-55

Target: docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-17

Source identity digest: `3e990f9e6b22795ca945fd9b59a65b78b12c3b37fbc2ea88d3fa2bf43e15ce4a`

Target identity digest: `3e990f9e6b22795ca945fd9b59a65b78b12c3b37fbc2ea88d3fa2bf43e15ce4a`

Source shown SHA256: `3e990f9e6b22795ca945fd9b59a65b78b12c3b37fbc2ea88d3fa2bf43e15ce4a`

Target shown SHA256: `3e990f9e6b22795ca945fd9b59a65b78b12c3b37fbc2ea88d3fa2bf43e15ce4a`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_377f8ce648788d30644f3bc51bfe5381 |
| sourceUnitDigest | 3e990f9e6b22795ca945fd9b59a65b78b12c3b37fbc2ea88d3fa2bf43e15ce4a |
| targetOwner | docs/platform/packaging-distribution/contracts/activation-binding.md |
| targetAnchor | unheaded-block-17 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-55, under "6. WorkspaceActivationBinding", is retained at docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-17. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the contracts/activation-binding.md topic owner; carriage does not certify current implementation. |

### Source unit

````text
```txt
write <workspace-root>/.fgos/installation/activation.json.tmp.<activationId>
fsync file when supported
rename tmp -> <workspace-root>/.fgos/installation/activation.json
fsync parent directory when supported
```
````

### Target unit

````text
```txt
write <workspace-root>/.fgos/installation/activation.json.tmp.<activationId>
fsync file when supported
rename tmp -> <workspace-root>/.fgos/installation/activation.json
fsync parent directory when supported
```
````

### Unified diff

```diff
No text difference.
```

## claim_2d797473f60376ca54f9086ff0856496

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-56

Target: docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-18

Source identity digest: `a04d969d83b5e49defe710e91650b6705cca0acec720219e49f163c81aff2d13`

Target identity digest: `a04d969d83b5e49defe710e91650b6705cca0acec720219e49f163c81aff2d13`

Source shown SHA256: `a04d969d83b5e49defe710e91650b6705cca0acec720219e49f163c81aff2d13`

Target shown SHA256: `a04d969d83b5e49defe710e91650b6705cca0acec720219e49f163c81aff2d13`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_2d797473f60376ca54f9086ff0856496 |
| sourceUnitDigest | a04d969d83b5e49defe710e91650b6705cca0acec720219e49f163c81aff2d13 |
| targetOwner | docs/platform/packaging-distribution/contracts/activation-binding.md |
| targetAnchor | unheaded-block-18 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-56, under "6. WorkspaceActivationBinding", is retained at docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-18. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the contracts/activation-binding.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
The stable shims under `.fgos/installation/bin/` should not change during normal
activation. Activation changes the selected release identity, not the command
path callers use.
```

### Target unit

```text
The stable shims under `.fgos/installation/bin/` should not change during normal
activation. Activation changes the selected release identity, not the command
path callers use.
```

### Unified diff

```diff
No text difference.
```

## claim_f44d55f008d91c249201a984ce908b79

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-57

Target: docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-19

Source identity digest: `88d26cd1a90388f48bc95e9cba6d19643339a3163f45cea76c829a346156247b`

Target identity digest: `88d26cd1a90388f48bc95e9cba6d19643339a3163f45cea76c829a346156247b`

Source shown SHA256: `88d26cd1a90388f48bc95e9cba6d19643339a3163f45cea76c829a346156247b`

Target shown SHA256: `88d26cd1a90388f48bc95e9cba6d19643339a3163f45cea76c829a346156247b`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_f44d55f008d91c249201a984ce908b79 |
| sourceUnitDigest | 88d26cd1a90388f48bc95e9cba6d19643339a3163f45cea76c829a346156247b |
| targetOwner | docs/platform/packaging-distribution/contracts/activation-binding.md |
| targetAnchor | unheaded-block-19 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-57, under "6. WorkspaceActivationBinding", is retained at docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-19. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the contracts/activation-binding.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
`activation.json` should contain only a durably published ready runtime
binding. Do not write `status: "preparing"` into `activation.json`.
Installation/activation transaction state belongs in the release store:
```

### Target unit

```text
`activation.json` should contain only a durably published ready runtime
binding. Do not write `status: "preparing"` into `activation.json`.
Installation/activation transaction state belongs in the release store:
```

### Unified diff

```diff
No text difference.
```

## claim_5802544189befbf7e8e93082025a321f

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-58

Target: docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-20

Source identity digest: `c31de9a6af67d0eb1cd6bcfb97cdd527e5def03d15a0e2314dc09a8a48ea4f72`

Target identity digest: `c31de9a6af67d0eb1cd6bcfb97cdd527e5def03d15a0e2314dc09a8a48ea4f72`

Source shown SHA256: `c31de9a6af67d0eb1cd6bcfb97cdd527e5def03d15a0e2314dc09a8a48ea4f72`

Target shown SHA256: `c31de9a6af67d0eb1cd6bcfb97cdd527e5def03d15a0e2314dc09a8a48ea4f72`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_5802544189befbf7e8e93082025a321f |
| sourceUnitDigest | c31de9a6af67d0eb1cd6bcfb97cdd527e5def03d15a0e2314dc09a8a48ea4f72 |
| targetOwner | docs/platform/packaging-distribution/contracts/activation-binding.md |
| targetAnchor | unheaded-block-20 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-58, under "6. WorkspaceActivationBinding", is retained at docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-20. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the contracts/activation-binding.md topic owner; carriage does not certify current implementation. |

### Source unit

````text
```txt
<release-store-root>/installs/<activationId>.json
```
````

### Target unit

````text
```txt
<release-store-root>/installs/<activationId>.json
```
````

### Unified diff

```diff
No text difference.
```

## claim_627c2ef29f032273927e9dfb2f6590ee

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-59

Target: docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-21

Source identity digest: `dbf8dbfef2ba662c57de06f78ad450a238098cd8069d2f513587dc429ecdddd5`

Target identity digest: `dbf8dbfef2ba662c57de06f78ad450a238098cd8069d2f513587dc429ecdddd5`

Source shown SHA256: `dbf8dbfef2ba662c57de06f78ad450a238098cd8069d2f513587dc429ecdddd5`

Target shown SHA256: `dbf8dbfef2ba662c57de06f78ad450a238098cd8069d2f513587dc429ecdddd5`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_627c2ef29f032273927e9dfb2f6590ee |
| sourceUnitDigest | dbf8dbfef2ba662c57de06f78ad450a238098cd8069d2f513587dc429ecdddd5 |
| targetOwner | docs/platform/packaging-distribution/contracts/activation-binding.md |
| targetAnchor | unheaded-block-21 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-59, under "6. WorkspaceActivationBinding", is retained at docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-21. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the contracts/activation-binding.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
Possible transaction statuses:
```

### Target unit

```text
Possible transaction statuses:
```

### Unified diff

```diff
No text difference.
```

## claim_d1fbe2ed17042364fd3798e8f1acb938

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-60

Target: docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-22

Source identity digest: `4eb7a14280149d74fa9814bb99ec418b4638bd08c6eac32fcbfb4d68b37a5d13`

Target identity digest: `4eb7a14280149d74fa9814bb99ec418b4638bd08c6eac32fcbfb4d68b37a5d13`

Source shown SHA256: `4eb7a14280149d74fa9814bb99ec418b4638bd08c6eac32fcbfb4d68b37a5d13`

Target shown SHA256: `4eb7a14280149d74fa9814bb99ec418b4638bd08c6eac32fcbfb4d68b37a5d13`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_d1fbe2ed17042364fd3798e8f1acb938 |
| sourceUnitDigest | 4eb7a14280149d74fa9814bb99ec418b4638bd08c6eac32fcbfb4d68b37a5d13 |
| targetOwner | docs/platform/packaging-distribution/contracts/activation-binding.md |
| targetAnchor | unheaded-block-22 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-60, under "6. WorkspaceActivationBinding", is retained at docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-22. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the contracts/activation-binding.md topic owner; carriage does not certify current implementation. |

### Source unit

````text
```txt
staging
verified
preparing
ready-published
ready-degraded
complete
failed
quarantined
```
````

### Target unit

````text
```txt
staging
verified
preparing
ready-published
ready-degraded
complete
failed
quarantined
```
````

### Unified diff

```diff
No text difference.
```

## claim_655efd23210f4e37ebb981dab1d3572d

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-61

Target: docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-23

Source identity digest: `f85c2d79598886465957f90d305d2fcfb9c2510697bbac8444d542d9ebbe5e9d`

Target identity digest: `f85c2d79598886465957f90d305d2fcfb9c2510697bbac8444d542d9ebbe5e9d`

Source shown SHA256: `f85c2d79598886465957f90d305d2fcfb9c2510697bbac8444d542d9ebbe5e9d`

Target shown SHA256: `f85c2d79598886465957f90d305d2fcfb9c2510697bbac8444d542d9ebbe5e9d`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_655efd23210f4e37ebb981dab1d3572d |
| sourceUnitDigest | f85c2d79598886465957f90d305d2fcfb9c2510697bbac8444d542d9ebbe5e9d |
| targetOwner | docs/platform/packaging-distribution/contracts/activation-binding.md |
| targetAnchor | unheaded-block-23 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-61, under "6. WorkspaceActivationBinding", is retained at docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-23. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the contracts/activation-binding.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
Failure rules:

| Failure Point | `activation.json` | Transaction / Payload Action |
|---|---|---|
| Acquire/stage fails | Unchanged | Mark install transaction failed; remove or keep staged temp for diagnostics. |
| Verify fails | Unchanged | Refuse activation; quarantine or remove staged release. |
| Runtime dependency missing | Unchanged | Refuse activation with `runtime-dependency-missing`. |
| Candidate preflight fails before publish | Unchanged | Mark transaction `failed`; candidate has no writer authority and must not touch host-visible projections. |
| Atomic binding write fails | Previous ready binding remains authoritative if readable | Fail closed; do not run local workflow from candidate. |
| Active local `fgos init` / `doctor --fix` projection tail fails after publish | New ready binding remains authoritative | Mark transaction `ready-degraded`; local doctor reports repair action. |
```

### Target unit

```text
Failure rules:

| Failure Point | `activation.json` | Transaction / Payload Action |
|---|---|---|
| Acquire/stage fails | Unchanged | Mark install transaction failed; remove or keep staged temp for diagnostics. |
| Verify fails | Unchanged | Refuse activation; quarantine or remove staged release. |
| Runtime dependency missing | Unchanged | Refuse activation with `runtime-dependency-missing`. |
| Candidate preflight fails before publish | Unchanged | Mark transaction `failed`; candidate has no writer authority and must not touch host-visible projections. |
| Atomic binding write fails | Previous ready binding remains authoritative if readable | Fail closed; do not run local workflow from candidate. |
| Active local `fgos init` / `doctor --fix` projection tail fails after publish | New ready binding remains authoritative | Mark transaction `ready-degraded`; local doctor reports repair action. |
```

### Unified diff

```diff
No text difference.
```

## claim_ba307bc371864f9cec89f991fef61744

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-62

Target: docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-24

Source identity digest: `9d7e46eac50d16bd95ce331d38192f4a87d9797f99b71edf8ceea4205dd93ff5`

Target identity digest: `9d7e46eac50d16bd95ce331d38192f4a87d9797f99b71edf8ceea4205dd93ff5`

Source shown SHA256: `9d7e46eac50d16bd95ce331d38192f4a87d9797f99b71edf8ceea4205dd93ff5`

Target shown SHA256: `9d7e46eac50d16bd95ce331d38192f4a87d9797f99b71edf8ceea4205dd93ff5`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_ba307bc371864f9cec89f991fef61744 |
| sourceUnitDigest | 9d7e46eac50d16bd95ce331d38192f4a87d9797f99b71edf8ceea4205dd93ff5 |
| targetOwner | docs/platform/packaging-distribution/contracts/activation-binding.md |
| targetAnchor | unheaded-block-24 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-62, under "6. WorkspaceActivationBinding", is retained at docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-24. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the contracts/activation-binding.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
The important rule is readiness: a candidate release does not gain writer
authority merely because it was staged or verified. It gains writer authority
for a workspace only after the workspace binding is published with
`status: "ready"`.
```

### Target unit

```text
The important rule is readiness: a candidate release does not gain writer
authority merely because it was staged or verified. It gains writer authority
for a workspace only after the workspace binding is published with
`status: "ready"`.
```

### Unified diff

```diff
No text difference.
```

## claim_3673677485dd4449067c9e5074623e1a

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-63

Target: docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-25

Source identity digest: `a1e7ae9c98f45bb7c6b136fec8f222dffea7be454b7288a802983db5a7e43599`

Target identity digest: `a1e7ae9c98f45bb7c6b136fec8f222dffea7be454b7288a802983db5a7e43599`

Source shown SHA256: `a1e7ae9c98f45bb7c6b136fec8f222dffea7be454b7288a802983db5a7e43599`

Target shown SHA256: `a1e7ae9c98f45bb7c6b136fec8f222dffea7be454b7288a802983db5a7e43599`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_3673677485dd4449067c9e5074623e1a |
| sourceUnitDigest | a1e7ae9c98f45bb7c6b136fec8f222dffea7be454b7288a802983db5a7e43599 |
| targetOwner | docs/platform/packaging-distribution/contracts/activation-binding.md |
| targetAnchor | unheaded-block-25 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-63, under "6. WorkspaceActivationBinding", is retained at docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-25. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the contracts/activation-binding.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
During preparation, `fgctl` may invoke the candidate release directly with a
restricted bootstrap context:
```

### Target unit

```text
During preparation, `fgctl` may invoke the candidate release directly with a
restricted bootstrap context:
```

### Unified diff

```diff
No text difference.
```

## claim_ba9547c5587487b5a423db3dfbd2a593

Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-64

Target: docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-26

Source identity digest: `785e4981db56df9627b8591fd383cd6c57cc04d3e8116137b27e1b8aa1bd6849`

Target identity digest: `785e4981db56df9627b8591fd383cd6c57cc04d3e8116137b27e1b8aa1bd6849`

Source shown SHA256: `785e4981db56df9627b8591fd383cd6c57cc04d3e8116137b27e1b8aa1bd6849`

Target shown SHA256: `785e4981db56df9627b8591fd383cd6c57cc04d3e8116137b27e1b8aa1bd6849`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_ba9547c5587487b5a423db3dfbd2a593 |
| sourceUnitDigest | 785e4981db56df9627b8591fd383cd6c57cc04d3e8116137b27e1b8aa1bd6849 |
| targetOwner | docs/platform/packaging-distribution/contracts/activation-binding.md |
| targetAnchor | unheaded-block-26 |
| claimKind | architecture |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-64, under "6. WorkspaceActivationBinding", is retained at docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-26. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the contracts/activation-binding.md topic owner; carriage does not certify current implementation. |

### Source unit

````text
```txt
FGOS_BOOTSTRAP_CANDIDATE=1
FGOS_CANDIDATE_ARTIFACT_DIGEST=<digest>
FGOS_CANDIDATE_RELEASE_PATH=<path>
```
````

### Target unit

````text
```txt
FGOS_BOOTSTRAP_CANDIDATE=1
FGOS_CANDIDATE_ARTIFACT_DIGEST=<digest>
FGOS_CANDIDATE_RELEASE_PATH=<path>
```
````

### Unified diff

```diff
No text difference.
```

