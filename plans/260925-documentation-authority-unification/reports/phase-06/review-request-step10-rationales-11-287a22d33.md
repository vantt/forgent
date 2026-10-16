# Bounded re-review: rationales 11

Author session: `codex-session:unit-run-1792114313040-56132651@2026-10-16`
Packaged by: `codex-session:unit-run-1792116045118-73cfbb42@2026-10-16`
Content commit: `287a22d33a0eaf2d9e47549a1142daf62361bb8c` (author changes at `0d8c602e2`)
Comparison base: `5035fed52e60254ecbe034cc987553feb24616f4`
Entries: **57**; each request at most60 entries and400000 bytes.

[Single request index](review-request-step10-index-287a22d33.md). Before values are historical; currentDecision and after for content rows come from `git show <content commit>:<shard>` through unchanged `reviewEntryFromCommittedRow`. New package-native predecessor rows are explicitly labelled overlay and require the runner package commit. No seed, sample IDs or verdict chosen by producer.

Reproduce all-shard consistency and every714 generated rationale (unchanged checker, no --apply):

```sh
env -u CLAUDE_CODE_SESSION_ID TMPDIR=/tmp/fgos-work python3 plans/260925-documentation-authority-unification/reports/phase-06/step10-sync287-reproduce.py consistency
```

Reproduce tests yourself (473 expected):

```sh
env -u CLAUDE_CODE_SESSION_ID TMPDIR=/tmp/fgos-work node --test test/scripts/doc-*.test.mjs test/scripts/check-doc-*.test.mjs test/scripts/generate-doc-inventory.test.mjs test/scripts/list-doc-anchors.test.mjs test/scripts/verify-phase-02.test.mjs test/scripts/next-doc-id.test.mjs
```

Run at the runner package checkout from repository root. The consistency reproduction materializes scratch only under `/tmp/fgos-work/`, checks all90 pinned shards with the original checker, verifies their current-row equality, then audits all4 package-native rows with unchanged `checkLegacyRationale`:12893 rows/91 nonempty shards in total. The original checker directly on the new shard errors because its historical oldRow lookup assumes every shard existed at5035fed52; that observed limitation is preserved in `step10-sync287-rationale-consistency.log`. No checker code was altered or bypassed for a pass.

Review every submitted current claim with an ordinary verdict and full digest/anchor/shard equality. Rationales are grouped for mechanical regeneration plus an independent seeded deep sample of at least108/714. A36 additionally requires reviewer-seeded at least162/1079 conservative Weak-exact/Judgment population, every unequal source/target digest and partial/historical row deep. One independently selected draw may satisfy both populations if both coverage thresholds are met; otherwise add draws. All exact doc corrections, tool changes and marked native predecessor transitions are deep. >3% deep rework escalates to the entire pack. Report seed/sample IDs and each claim's deep/mechanical note. Independent checkpoint/truth/red-team obligations remain. Confirmations retain existing committed approvals; metadata/evidence/native entries do not approve claims.

## Entry rationale-601

```json
{
  "entryId": "rationale-601",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-boundary-gaps.json",
  "collection": "registryGaps",
  "claimId": "claim_0f4d968b593902731bd334f9ed2af711",
  "before": "A31 main-only source change: this native old identity gap has the shown same-file successor from the upstream diff. This is conservation accounting, not a plan move or truth approval. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package.",
  "after": "Source: docs/specs/distribution.md:57-73#unheaded-block-5 (historical witness at 67a276b0d3534840bd669839776d122ff829ff67); unit SHA256 cdf23ebc6949803aa19ec83913121c79ebc370e9ef29134c0fb3bf49af44a99c.\nTarget: docs/specs/distribution.md:57-73#unheaded-block-5 (current lines); unit SHA256 59297ed6cac29ae0d34e9f3a48ca0c518e8c06fed5e224ca0182f627ae93839e.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 59297ed6cac29ae0d34e9f3a48ca0c518e8c06fed5e224ca0182f627ae93839e at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/specs/distribution.md#unheaded-block-5 under docs/specs/distribution.md#unheaded-block-5; source context \"Spec: Distribution / Data Dictionary\", target context \"Spec: Distribution / Data Dictionary\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 600,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_0f4d968b593902731bd334f9ed2af711",
    "sourcePath": "docs/specs/distribution.md",
    "sourceUnitDigest": "cdf23ebc6949803aa19ec83913121c79ebc370e9ef29134c0fb3bf49af44a99c",
    "disposition": "supersede",
    "targetOwner": "docs/specs/distribution.md",
    "targetAnchor": "unheaded-block-5",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "pending",
    "rationale": "Source: docs/specs/distribution.md:57-73#unheaded-block-5 (historical witness at 67a276b0d3534840bd669839776d122ff829ff67); unit SHA256 cdf23ebc6949803aa19ec83913121c79ebc370e9ef29134c0fb3bf49af44a99c.\nTarget: docs/specs/distribution.md:57-73#unheaded-block-5 (current lines); unit SHA256 59297ed6cac29ae0d34e9f3a48ca0c518e8c06fed5e224ca0182f627ae93839e.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 59297ed6cac29ae0d34e9f3a48ca0c518e8c06fed5e224ca0182f627ae93839e at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/specs/distribution.md#unheaded-block-5 under docs/specs/distribution.md#unheaded-block-5; source context \"Spec: Distribution / Data Dictionary\", target context \"Spec: Distribution / Data Dictionary\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "59297ed6cac29ae0d34e9f3a48ca0c518e8c06fed5e224ca0182f627ae93839e",
    "targetAncestry": [
      "Spec: Distribution",
      "Data Dictionary"
    ]
  }
}
```

## Entry rationale-602

```json
{
  "entryId": "rationale-602",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-boundary-gaps.json",
  "collection": "registryGaps",
  "claimId": "claim_76d404ea624a10455d7a14debe2b2a95",
  "before": "A31 main-only source change: this native old identity gap has the shown same-file successor from the upstream diff. This is conservation accounting, not a plan move or truth approval. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package.",
  "after": "Source: docs/specs/runner.md:73-87#unheaded-block-9 (historical witness at c3272bc6fc70015e995921e1c458658b084b0b11); unit SHA256 9070d65058bf41570d8fb1fbaef63f8decdc54c10b932c90d069a15d5f780677.\nTarget: docs/specs/runner.md:73-87#unheaded-block-9 (current lines); unit SHA256 43f03eb4dffdeff420f464531d60be7e37e13192429963b10ba302be1e9b777e.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 43f03eb4dffdeff420f464531d60be7e37e13192429963b10ba302be1e9b777e at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/specs/runner.md#unheaded-block-9 under docs/specs/runner.md#unheaded-block-9; source context \"Spec: Runner (vòng tự hành) / Data Dictionary\", target context \"Spec: Runner (vòng tự hành) / Data Dictionary\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 601,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_76d404ea624a10455d7a14debe2b2a95",
    "sourcePath": "docs/specs/runner.md",
    "sourceUnitDigest": "9070d65058bf41570d8fb1fbaef63f8decdc54c10b932c90d069a15d5f780677",
    "disposition": "supersede",
    "targetOwner": "docs/specs/runner.md",
    "targetAnchor": "unheaded-block-9",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "pending",
    "rationale": "Source: docs/specs/runner.md:73-87#unheaded-block-9 (historical witness at c3272bc6fc70015e995921e1c458658b084b0b11); unit SHA256 9070d65058bf41570d8fb1fbaef63f8decdc54c10b932c90d069a15d5f780677.\nTarget: docs/specs/runner.md:73-87#unheaded-block-9 (current lines); unit SHA256 43f03eb4dffdeff420f464531d60be7e37e13192429963b10ba302be1e9b777e.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 43f03eb4dffdeff420f464531d60be7e37e13192429963b10ba302be1e9b777e at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/specs/runner.md#unheaded-block-9 under docs/specs/runner.md#unheaded-block-9; source context \"Spec: Runner (vòng tự hành) / Data Dictionary\", target context \"Spec: Runner (vòng tự hành) / Data Dictionary\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "43f03eb4dffdeff420f464531d60be7e37e13192429963b10ba302be1e9b777e",
    "targetAncestry": [
      "Spec: Runner (vòng tự hành)",
      "Data Dictionary"
    ]
  }
}
```

## Entry rationale-603

```json
{
  "entryId": "rationale-603",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_080c5cdacf820ed661ab372086ca7e41",
  "before": "Partial carry of the direct source section docs/architect/host-invocation-routing/host-invocation-provider-routing.md#9-physical-placement at docs/platform/host-invocation-routing/spec.md#9-physical-placement; surrounding content stays here. Remainder: The relocated passage of docs/architect/host-invocation-routing/host-invocation-provider-routing.md#9-physical-placement is retained verbatim at docs/platform/host-invocation-routing/architecture/release-boundaries.md#restored-physical-placement-layout-tree and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-46 (claim_54536d1078dc6a2b6eacd17105389f2b; ```txt Cargo.toml # workspace root; herdr-plugin/ excluded in R1 apps/ fgos/ # crat). No source wording is discarded; this row does not claim the primary target alone contains the relocated passage. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by native retained identity. Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding. Package at 2300d65571968bb3bcb80123a273272586e3f1db: pending target rebind by native retained identity. Full before/after and digests are in step10-sync2300-rebindings.json; historical approval does not cover the changed binding.",
  "after": "Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md:190-190#9-physical-placement (current lines); unit SHA256 26dedcce46fdb8fba749ce8ecb56418bbc45624ad00c28a2a355647221c73a35.\nTarget: docs/platform/host-invocation-routing/spec.md:295-295#9-physical-placement (current lines); unit SHA256 e95f14771b2c72fc9eb48e5c9813b74f897175763fa9b44441fb2cb6a896c1cd.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest e95f14771b2c72fc9eb48e5c9813b74f897175763fa9b44441fb2cb6a896c1cd at 2300d65571968bb3bcb80123a273272586e3f1db.\nLinks: source 1, target 2; 2 changed spellings/labels, 1 destination changes; 1 added, 0 removed.\nLink 1: \"none\" (none) → \"the dropped-004 restoration\" (architecture/release-boundaries.md#restored-physical-placement-layout-tree); resolved none → docs/platform/host-invocation-routing/architecture/release-boundaries.md#restored-physical-placement-layout-tree.\nLink 2: \"Runtime Identity And Activation\" (../packaging-distribution/runtime-identity-and-activation.md) → \"Runtime Identity And Activation\" (../packaging-distribution/architecture/runtime-identity-and-activation.md); resolved docs/architect/packaging-distribution/runtime-identity-and-activation.md → docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md.\nHeading depth: 2 → 4; title \"9. Physical Placement\" → \"9. Physical Placement\".\nApplicable labelled corrections: none in this bound unit.\nDisposition partial-carry: Account for docs/architect/host-invocation-routing/host-invocation-provider-routing.md#9-physical-placement under docs/platform/host-invocation-routing/spec.md#9-physical-placement; source context \"Host Invocation And Provider Routing Architecture\", target context \"Spec: Host Invocation / Retained selected source material / Host Invocation And Provider Routing Architecture\". The source text occurs verbatim inside the bound target section; section-level unit digests differ. Recorded residual: The relocated passage of docs/architect/host-invocation-routing/host-invocation-provider-routing.md#9-physical-placement is retained verbatim at docs/platform/host-invocation-routing/architecture/release-boundaries.md#restored-physical-placement-layout-tree and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-46 (claim_54536d1078dc6a2b6eacd17105389f2b; ```txt Cargo.toml # workspace root; herdr-plugin/ excluded in R1 apps/ fgos/ # crat)..\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 602,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_080c5cdacf820ed661ab372086ca7e41",
    "sourceUnitDigest": "26dedcce46fdb8fba749ce8ecb56418bbc45624ad00c28a2a355647221c73a35",
    "claimKind": "architecture",
    "kind": "spec",
    "disposition": "partial-carry",
    "targetOwner": "docs/platform/host-invocation-routing/spec.md",
    "targetAnchor": "9-physical-placement",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md:190-190#9-physical-placement (current lines); unit SHA256 26dedcce46fdb8fba749ce8ecb56418bbc45624ad00c28a2a355647221c73a35.\nTarget: docs/platform/host-invocation-routing/spec.md:295-295#9-physical-placement (current lines); unit SHA256 e95f14771b2c72fc9eb48e5c9813b74f897175763fa9b44441fb2cb6a896c1cd.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest e95f14771b2c72fc9eb48e5c9813b74f897175763fa9b44441fb2cb6a896c1cd at 2300d65571968bb3bcb80123a273272586e3f1db.\nLinks: source 1, target 2; 2 changed spellings/labels, 1 destination changes; 1 added, 0 removed.\nLink 1: \"none\" (none) → \"the dropped-004 restoration\" (architecture/release-boundaries.md#restored-physical-placement-layout-tree); resolved none → docs/platform/host-invocation-routing/architecture/release-boundaries.md#restored-physical-placement-layout-tree.\nLink 2: \"Runtime Identity And Activation\" (../packaging-distribution/runtime-identity-and-activation.md) → \"Runtime Identity And Activation\" (../packaging-distribution/architecture/runtime-identity-and-activation.md); resolved docs/architect/packaging-distribution/runtime-identity-and-activation.md → docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md.\nHeading depth: 2 → 4; title \"9. Physical Placement\" → \"9. Physical Placement\".\nApplicable labelled corrections: none in this bound unit.\nDisposition partial-carry: Account for docs/architect/host-invocation-routing/host-invocation-provider-routing.md#9-physical-placement under docs/platform/host-invocation-routing/spec.md#9-physical-placement; source context \"Host Invocation And Provider Routing Architecture\", target context \"Spec: Host Invocation / Retained selected source material / Host Invocation And Provider Routing Architecture\". The source text occurs verbatim inside the bound target section; section-level unit digests differ. Recorded residual: The relocated passage of docs/architect/host-invocation-routing/host-invocation-provider-routing.md#9-physical-placement is retained verbatim at docs/platform/host-invocation-routing/architecture/release-boundaries.md#restored-physical-placement-layout-tree and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-46 (claim_54536d1078dc6a2b6eacd17105389f2b; ```txt Cargo.toml # workspace root; herdr-plugin/ excluded in R1 apps/ fgos/ # crat)..\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "remainder": "The relocated passage of docs/architect/host-invocation-routing/host-invocation-provider-routing.md#9-physical-placement is retained verbatim at docs/platform/host-invocation-routing/architecture/release-boundaries.md#restored-physical-placement-layout-tree and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-46 (claim_54536d1078dc6a2b6eacd17105389f2b; ```txt Cargo.toml # workspace root; herdr-plugin/ excluded in R1 apps/ fgos/ # crat).",
    "targetUnitDigest": "e95f14771b2c72fc9eb48e5c9813b74f897175763fa9b44441fb2cb6a896c1cd",
    "targetAncestry": [
      "Spec: Host Invocation",
      "Retained selected source material",
      "Host Invocation And Provider Routing Architecture"
    ]
  }
}
```

## Entry rationale-604

```json
{
  "entryId": "rationale-604",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_6bc953eb6105342ced582ea637d33f80",
  "before": "Move the complete direct unheaded-block unit \"Distribution selects and activates the trusted runtime (`fgctl`: acquire/stage/verify/activate/upgrade/rollback); host invocation routes inside the activated runtime. Pac\" from docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-48 to its frozen mapped owner docs/platform/host-invocation-routing/spec.md#unheaded-block-61. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Judgment: no target digest match; independent full-text judgment remains required, not a script-proven approval. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by committed line-diff correspondence with equal unit kind and ancestry (replace). Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding. Package at 2300d65571968bb3bcb80123a273272586e3f1db: pending target rebind by committed line-diff correspondence with equal unit kind and ancestry (replace). Full before/after and digests are in step10-sync2300-rebindings.json; historical approval does not cover the changed binding.",
  "after": "Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md:222-222#unheaded-block-48 (current lines); unit SHA256 a0aa294e66a01b454b06e9979a36c859df484646756a5ca6f3c9523a150b5538.\nTarget: docs/platform/host-invocation-routing/spec.md:305-305#unheaded-block-62 (current lines); unit SHA256 e9893942d9bce6fe7bf258af1493b90e55530dec51230332c2ba0024773f0ca2.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest e9893942d9bce6fe7bf258af1493b90e55530dec51230332c2ba0024773f0ca2 at 2300d65571968bb3bcb80123a273272586e3f1db.\nLinks: source 1, target 1; 1 changed spellings/labels, 1 destination changes; 0 added, 0 removed.\nLink 1: \"Runtime Identity And Activation\" (../packaging-distribution/runtime-identity-and-activation.md) → \"Runtime Identity And Activation\" (../packaging-distribution/architecture/runtime-identity-and-activation.md); resolved docs/architect/packaging-distribution/runtime-identity-and-activation.md → docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-48 under docs/platform/host-invocation-routing/spec.md#unheaded-block-62; source context \"Host Invocation And Provider Routing Architecture / 9. Physical Placement\", target context \"Spec: Host Invocation / Retained selected source material / Host Invocation And Provider Routing Architecture / 9. Physical Placement\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 603,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_6bc953eb6105342ced582ea637d33f80",
    "sourceUnitDigest": "a0aa294e66a01b454b06e9979a36c859df484646756a5ca6f3c9523a150b5538",
    "claimKind": "architecture",
    "kind": "spec",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/spec.md",
    "targetAnchor": "unheaded-block-62",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md:222-222#unheaded-block-48 (current lines); unit SHA256 a0aa294e66a01b454b06e9979a36c859df484646756a5ca6f3c9523a150b5538.\nTarget: docs/platform/host-invocation-routing/spec.md:305-305#unheaded-block-62 (current lines); unit SHA256 e9893942d9bce6fe7bf258af1493b90e55530dec51230332c2ba0024773f0ca2.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest e9893942d9bce6fe7bf258af1493b90e55530dec51230332c2ba0024773f0ca2 at 2300d65571968bb3bcb80123a273272586e3f1db.\nLinks: source 1, target 1; 1 changed spellings/labels, 1 destination changes; 0 added, 0 removed.\nLink 1: \"Runtime Identity And Activation\" (../packaging-distribution/runtime-identity-and-activation.md) → \"Runtime Identity And Activation\" (../packaging-distribution/architecture/runtime-identity-and-activation.md); resolved docs/architect/packaging-distribution/runtime-identity-and-activation.md → docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-48 under docs/platform/host-invocation-routing/spec.md#unheaded-block-62; source context \"Host Invocation And Provider Routing Architecture / 9. Physical Placement\", target context \"Spec: Host Invocation / Retained selected source material / Host Invocation And Provider Routing Architecture / 9. Physical Placement\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "e9893942d9bce6fe7bf258af1493b90e55530dec51230332c2ba0024773f0ca2",
    "targetAncestry": [
      "Spec: Host Invocation",
      "Retained selected source material",
      "Host Invocation And Provider Routing Architecture",
      "9. Physical Placement"
    ]
  }
}
```

## Entry rationale-605

```json
{
  "entryId": "rationale-605",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_559fca19404946ba9ede9006edab6e63",
  "before": "Move the complete direct unheaded-block unit \"| Release | Required architecture slice | Explicitly not a gate | |---|---|---| | R1 — distributable Rust CLI host | Invocation kernel; `const` `OperationCatalog` / `Regi\" from docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-49 to its frozen mapped owner docs/platform/host-invocation-routing/spec.md#unheaded-block-62. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Judgment: no target digest match; independent full-text judgment remains required, not a script-proven approval. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by committed line-diff correspondence with equal unit kind and ancestry (equal). Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding.",
  "after": "Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md:226-230#unheaded-block-49 (current lines); unit SHA256 06049bca0768ee38177380fc223b8f0f517614d31d6f48803d16871c90ce9382.\nTarget: docs/platform/host-invocation-routing/spec.md:309-313#unheaded-block-63 (current lines); unit SHA256 967a235d033516997ebf0f52a71ae3875df102a5dd106af58e40486c80475b31.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 967a235d033516997ebf0f52a71ae3875df102a5dd106af58e40486c80475b31 at 2300d65571968bb3bcb80123a273272586e3f1db.\nLinks: source 1, target 1; 1 changed spellings/labels, 1 destination changes; 0 added, 0 removed.\nLink 1: \"Future Constraints\" (../packaging-distribution/future-constraints.md) → \"Future Constraints\" (../packaging-distribution/architecture/future-constraints.md); resolved docs/architect/packaging-distribution/future-constraints.md → docs/platform/packaging-distribution/architecture/future-constraints.md.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-49 under docs/platform/host-invocation-routing/spec.md#unheaded-block-63; source context \"Host Invocation And Provider Routing Architecture / 10. Release Boundaries\", target context \"Spec: Host Invocation / Retained selected source material / Host Invocation And Provider Routing Architecture / 10. Release Boundaries\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 604,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_559fca19404946ba9ede9006edab6e63",
    "sourceUnitDigest": "06049bca0768ee38177380fc223b8f0f517614d31d6f48803d16871c90ce9382",
    "claimKind": "architecture",
    "kind": "spec",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/spec.md",
    "targetAnchor": "unheaded-block-63",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md:226-230#unheaded-block-49 (current lines); unit SHA256 06049bca0768ee38177380fc223b8f0f517614d31d6f48803d16871c90ce9382.\nTarget: docs/platform/host-invocation-routing/spec.md:309-313#unheaded-block-63 (current lines); unit SHA256 967a235d033516997ebf0f52a71ae3875df102a5dd106af58e40486c80475b31.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 967a235d033516997ebf0f52a71ae3875df102a5dd106af58e40486c80475b31 at 2300d65571968bb3bcb80123a273272586e3f1db.\nLinks: source 1, target 1; 1 changed spellings/labels, 1 destination changes; 0 added, 0 removed.\nLink 1: \"Future Constraints\" (../packaging-distribution/future-constraints.md) → \"Future Constraints\" (../packaging-distribution/architecture/future-constraints.md); resolved docs/architect/packaging-distribution/future-constraints.md → docs/platform/packaging-distribution/architecture/future-constraints.md.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-49 under docs/platform/host-invocation-routing/spec.md#unheaded-block-63; source context \"Host Invocation And Provider Routing Architecture / 10. Release Boundaries\", target context \"Spec: Host Invocation / Retained selected source material / Host Invocation And Provider Routing Architecture / 10. Release Boundaries\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "967a235d033516997ebf0f52a71ae3875df102a5dd106af58e40486c80475b31",
    "targetAncestry": [
      "Spec: Host Invocation",
      "Retained selected source material",
      "Host Invocation And Provider Routing Architecture",
      "10. Release Boundaries"
    ]
  }
}
```

## Entry rationale-606

```json
{
  "entryId": "rationale-606",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_eff16b53a71c2109f97bb2e2bab25e87",
  "before": "Move the complete direct unheaded-block unit \"Target matrix, install/upgrade mechanism, and R1 definition are owned by packaging — see [Runtime Identity And Activation](../packaging-distribution/runtime-identity-and-\" from docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-52 to its frozen mapped owner docs/platform/host-invocation-routing/spec.md#unheaded-block-65. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Judgment: no target digest match; independent full-text judgment remains required, not a script-proven approval. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by committed line-diff correspondence with equal unit kind and ancestry (replace). Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding. Package at 2300d65571968bb3bcb80123a273272586e3f1db: pending target rebind by committed line-diff correspondence with equal unit kind and ancestry (replace). Full before/after and digests are in step10-sync2300-rebindings.json; historical approval does not cover the changed binding.",
  "after": "Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md:242-242#unheaded-block-52 (current lines); unit SHA256 4570273c78e216d61372f1704e042e1c10e203001baa7d59d10ae00e3b26e4dc.\nTarget: docs/platform/host-invocation-routing/spec.md:325-325#unheaded-block-66 (current lines); unit SHA256 c89318820321f4ab2e4103085bb297a1c0acb615407968344860a010d3c8d105.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest c89318820321f4ab2e4103085bb297a1c0acb615407968344860a010d3c8d105 at 2300d65571968bb3bcb80123a273272586e3f1db.\nLinks: source 1, target 1; 1 changed spellings/labels, 1 destination changes; 0 added, 0 removed.\nLink 1: \"Runtime Identity And Activation\" (../packaging-distribution/runtime-identity-and-activation.md) → \"Runtime Identity And Activation\" (../packaging-distribution/architecture/runtime-identity-and-activation.md); resolved docs/architect/packaging-distribution/runtime-identity-and-activation.md → docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-52 under docs/platform/host-invocation-routing/spec.md#unheaded-block-66; source context \"Host Invocation And Provider Routing Architecture / 11. Open Questions\", target context \"Spec: Host Invocation / Retained selected source material / Host Invocation And Provider Routing Architecture / 11. Open Questions\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 605,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_eff16b53a71c2109f97bb2e2bab25e87",
    "sourceUnitDigest": "4570273c78e216d61372f1704e042e1c10e203001baa7d59d10ae00e3b26e4dc",
    "claimKind": "architecture",
    "kind": "spec",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/spec.md",
    "targetAnchor": "unheaded-block-66",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md:242-242#unheaded-block-52 (current lines); unit SHA256 4570273c78e216d61372f1704e042e1c10e203001baa7d59d10ae00e3b26e4dc.\nTarget: docs/platform/host-invocation-routing/spec.md:325-325#unheaded-block-66 (current lines); unit SHA256 c89318820321f4ab2e4103085bb297a1c0acb615407968344860a010d3c8d105.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest c89318820321f4ab2e4103085bb297a1c0acb615407968344860a010d3c8d105 at 2300d65571968bb3bcb80123a273272586e3f1db.\nLinks: source 1, target 1; 1 changed spellings/labels, 1 destination changes; 0 added, 0 removed.\nLink 1: \"Runtime Identity And Activation\" (../packaging-distribution/runtime-identity-and-activation.md) → \"Runtime Identity And Activation\" (../packaging-distribution/architecture/runtime-identity-and-activation.md); resolved docs/architect/packaging-distribution/runtime-identity-and-activation.md → docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-52 under docs/platform/host-invocation-routing/spec.md#unheaded-block-66; source context \"Host Invocation And Provider Routing Architecture / 11. Open Questions\", target context \"Spec: Host Invocation / Retained selected source material / Host Invocation And Provider Routing Architecture / 11. Open Questions\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "c89318820321f4ab2e4103085bb297a1c0acb615407968344860a010d3c8d105",
    "targetAncestry": [
      "Spec: Host Invocation",
      "Retained selected source material",
      "Host Invocation And Provider Routing Architecture",
      "11. Open Questions"
    ]
  }
}
```

## Entry rationale-607

```json
{
  "entryId": "rationale-607",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_b2a8587f5b61f728d0136e54d808289f",
  "before": "Move the complete direct unheaded-block unit \"- [External Provider Protocol](./external-provider-protocol.md) - [Legacy CLI Transition](./legacy-cli-transition.md) - [Node To Rust Component Migration](./node-to-rust-\" from docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-53 to its frozen mapped owner docs/platform/host-invocation-routing/spec.md#unheaded-block-66. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Judgment: no target digest match; independent full-text judgment remains required, not a script-proven approval. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by committed line-diff correspondence with equal unit kind and ancestry (equal). Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding. Package at 2300d65571968bb3bcb80123a273272586e3f1db: pending target rebind by committed line-diff correspondence with equal unit kind and ancestry (equal). Full before/after and digests are in step10-sync2300-rebindings.json; historical approval does not cover the changed binding.",
  "after": "Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md:246-251#unheaded-block-53 (current lines); unit SHA256 34fa9922c1fc3d22569b5dd91bdab9fc6a83d3fb5ff79664bcd424f844ed6f87.\nTarget: docs/platform/host-invocation-routing/spec.md:329-334#unheaded-block-67 (current lines); unit SHA256 652b3b9849349b5fe0c60e38f9f909bf4785407f9e710a318c74ba6b32129c3b.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 652b3b9849349b5fe0c60e38f9f909bf4785407f9e710a318c74ba6b32129c3b at 2300d65571968bb3bcb80123a273272586e3f1db.\nLinks: source 6, target 6; 6 changed spellings/labels, 6 destination changes; 0 added, 0 removed.\nLink 1: \"External Provider Protocol\" (./external-provider-protocol.md) → \"External Provider Protocol\" (architecture/external-provider-protocol.md); resolved docs/architect/host-invocation-routing/external-provider-protocol.md → docs/platform/host-invocation-routing/architecture/external-provider-protocol.md.\nLink 2: \"Legacy CLI Transition\" (./legacy-cli-transition.md) → \"Legacy CLI Transition\" (architecture/legacy-cli-transition.md); resolved docs/architect/host-invocation-routing/legacy-cli-transition.md → docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md.\nLink 3: \"Node To Rust Component Migration\" (./node-to-rust-component-migration.md) → \"Node To Rust Component Migration\" (architecture/node-to-rust-migration.md); resolved docs/architect/host-invocation-routing/node-to-rust-component-migration.md → docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md.\nLink 4: \"Rust Host And Proof Providers Implementation Plan\" (./rust-cli-and-proof-components-plan.md) → \"Rust Host And Proof Providers Implementation Plan\" (roadmap.md); resolved docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md → docs/platform/host-invocation-routing/roadmap.md.\nLink 5: \"Component Boundary Advisory\" (../component-boundary/component-boundary-advisory.md) → \"Component Boundary Advisory\" (../component-boundary.md); resolved docs/architect/component-boundary/component-boundary-advisory.md → docs/platform/component-boundary.md.\nLink 6: \"Runtime Identity And Activation\" (../packaging-distribution/runtime-identity-and-activation.md) → \"Runtime Identity And Activation\" (../packaging-distribution/architecture/runtime-identity-and-activation.md); resolved docs/architect/packaging-distribution/runtime-identity-and-activation.md → docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-53 under docs/platform/host-invocation-routing/spec.md#unheaded-block-67; source context \"Host Invocation And Provider Routing Architecture / Related Documents\", target context \"Spec: Host Invocation / Retained selected source material / Host Invocation And Provider Routing Architecture / Related Documents\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 606,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_b2a8587f5b61f728d0136e54d808289f",
    "sourceUnitDigest": "34fa9922c1fc3d22569b5dd91bdab9fc6a83d3fb5ff79664bcd424f844ed6f87",
    "claimKind": "contract",
    "kind": "spec",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/spec.md",
    "targetAnchor": "unheaded-block-67",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md:246-251#unheaded-block-53 (current lines); unit SHA256 34fa9922c1fc3d22569b5dd91bdab9fc6a83d3fb5ff79664bcd424f844ed6f87.\nTarget: docs/platform/host-invocation-routing/spec.md:329-334#unheaded-block-67 (current lines); unit SHA256 652b3b9849349b5fe0c60e38f9f909bf4785407f9e710a318c74ba6b32129c3b.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 652b3b9849349b5fe0c60e38f9f909bf4785407f9e710a318c74ba6b32129c3b at 2300d65571968bb3bcb80123a273272586e3f1db.\nLinks: source 6, target 6; 6 changed spellings/labels, 6 destination changes; 0 added, 0 removed.\nLink 1: \"External Provider Protocol\" (./external-provider-protocol.md) → \"External Provider Protocol\" (architecture/external-provider-protocol.md); resolved docs/architect/host-invocation-routing/external-provider-protocol.md → docs/platform/host-invocation-routing/architecture/external-provider-protocol.md.\nLink 2: \"Legacy CLI Transition\" (./legacy-cli-transition.md) → \"Legacy CLI Transition\" (architecture/legacy-cli-transition.md); resolved docs/architect/host-invocation-routing/legacy-cli-transition.md → docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md.\nLink 3: \"Node To Rust Component Migration\" (./node-to-rust-component-migration.md) → \"Node To Rust Component Migration\" (architecture/node-to-rust-migration.md); resolved docs/architect/host-invocation-routing/node-to-rust-component-migration.md → docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md.\nLink 4: \"Rust Host And Proof Providers Implementation Plan\" (./rust-cli-and-proof-components-plan.md) → \"Rust Host And Proof Providers Implementation Plan\" (roadmap.md); resolved docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md → docs/platform/host-invocation-routing/roadmap.md.\nLink 5: \"Component Boundary Advisory\" (../component-boundary/component-boundary-advisory.md) → \"Component Boundary Advisory\" (../component-boundary.md); resolved docs/architect/component-boundary/component-boundary-advisory.md → docs/platform/component-boundary.md.\nLink 6: \"Runtime Identity And Activation\" (../packaging-distribution/runtime-identity-and-activation.md) → \"Runtime Identity And Activation\" (../packaging-distribution/architecture/runtime-identity-and-activation.md); resolved docs/architect/packaging-distribution/runtime-identity-and-activation.md → docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-53 under docs/platform/host-invocation-routing/spec.md#unheaded-block-67; source context \"Host Invocation And Provider Routing Architecture / Related Documents\", target context \"Spec: Host Invocation / Retained selected source material / Host Invocation And Provider Routing Architecture / Related Documents\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "652b3b9849349b5fe0c60e38f9f909bf4785407f9e710a318c74ba6b32129c3b",
    "targetAncestry": [
      "Spec: Host Invocation",
      "Retained selected source material",
      "Host Invocation And Provider Routing Architecture",
      "Related Documents"
    ]
  }
}
```

## Entry rationale-608

```json
{
  "entryId": "rationale-608",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_04f0605dc840e350f63e53d0e1e96843",
  "before": "Partial carry of the direct source section docs/architect/host-invocation-routing/legacy-cli-transition.md#2-legacy-payload-identity-ownership-and-repair-path at docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#2-legacy-payload-identity-ownership-and-repair-path; surrounding content stays here. Remainder: The relocated passage of docs/architect/host-invocation-routing/legacy-cli-transition.md#2-legacy-payload-identity-ownership-and-repair-path is retained verbatim at docs/platform/host-invocation-routing/architecture/release-boundaries.md#restored-package-json-bin-fgos-removed-pointed-at-workspace-shim-at-default-flip-bin-fgos-runner-stays-ownership-hea and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/legacy-cli-transition.md#unheaded-block-14 (claim_6a37273a0a45d24c53e344928c3edf22; `package.json` `bin.fgos` is removed (or pointed at the workspace shim) when the Rust host becomes the installed default; `bin.fgos-runner` ). No source wording is discarded; this row does not claim the primary target alone contains the relocated passage. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by native retained identity. Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding. Package at 2300d65571968bb3bcb80123a273272586e3f1db: pending target rebind by native retained identity. Full before/after and digests are in step10-sync2300-rebindings.json; historical approval does not cover the changed binding. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package.",
  "after": "Source: docs/architect/host-invocation-routing/legacy-cli-transition.md:34-34#2-legacy-payload-identity-ownership-and-repair-path (current lines); unit SHA256 e9f472117d68d8c826f9f9b15946883a24addeedf3c298765032fc081f37cb2d.\nTarget: docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md:94-94#2-legacy-payload-identity-ownership-and-repair-path (current lines); unit SHA256 bcaecc76a91e2cd04d8a432c31285c9d795a274e2ae8dcba92ccfd94780daddf.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest bcaecc76a91e2cd04d8a432c31285c9d795a274e2ae8dcba92ccfd94780daddf at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 2, target 3; 3 changed spellings/labels, 0 destination changes; 1 added, 0 removed.\nLink 1: \"Repo Layout Vision\" (../component-boundary/repo-layout-vision.md) → \"Repo Layout Vision\" (../../../architect/component-boundary/repo-layout-vision.md); resolved docs/architect/component-boundary/repo-layout-vision.md → docs/architect/component-boundary/repo-layout-vision.md.\nLink 2: \"Runtime Identity And Activation\" (../packaging-distribution/runtime-identity-and-activation.md) → \"Runtime Identity And Activation\" (../../../architect/packaging-distribution/runtime-identity-and-activation.md); resolved docs/architect/packaging-distribution/runtime-identity-and-activation.md → docs/architect/packaging-distribution/runtime-identity-and-activation.md.\nLink 3: \"none\" (none) → \"the dropped-010 restoration\" (release-boundaries.md#restored-package-json-bin-fgos-removed-pointed-at-workspace-shim-at-default-flip-bin-fgos-runner-stays-ownership-hea); resolved none → docs/platform/host-invocation-routing/architecture/release-boundaries.md#restored-package-json-bin-fgos-removed-pointed-at-workspace-shim-at-default-flip-bin-fgos-runner-stays-ownership-hea.\nHeading depth: 2 → 4; title \"2. Legacy Payload Identity, Ownership, And Repair Path\" → \"2. Legacy Payload Identity, Ownership, And Repair Path\".\nApplicable labelled corrections: none in this bound unit.\nDisposition partial-carry: Account for docs/architect/host-invocation-routing/legacy-cli-transition.md#2-legacy-payload-identity-ownership-and-repair-path under docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#2-legacy-payload-identity-ownership-and-repair-path; source context \"Legacy CLI Transition\", target context \"Architecture: Legacy CLI Transition / Retained selected source material / Legacy CLI Transition\". The source text occurs verbatim inside the bound target section; section-level unit digests differ. Recorded residual: The relocated passage of docs/architect/host-invocation-routing/legacy-cli-transition.md#2-legacy-payload-identity-ownership-and-repair-path is retained verbatim at docs/platform/host-invocation-routing/architecture/release-boundaries.md#restored-package-json-bin-fgos-removed-pointed-at-workspace-shim-at-default-flip-bin-fgos-runner-stays-ownership-hea and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/legacy-cli-transition.md#unheaded-block-14 (claim_6a37273a0a45d24c53e344928c3edf22; `package.json` `bin.fgos` is removed (or pointed at the workspace shim) when the Rust host becomes the installed default; `bin.fgos-runner` )..\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 607,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_04f0605dc840e350f63e53d0e1e96843",
    "sourceUnitDigest": "e9f472117d68d8c826f9f9b15946883a24addeedf3c298765032fc081f37cb2d",
    "claimKind": "architecture",
    "kind": "architecture",
    "disposition": "partial-carry",
    "targetOwner": "docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md",
    "targetAnchor": "2-legacy-payload-identity-ownership-and-repair-path",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/legacy-cli-transition.md:34-34#2-legacy-payload-identity-ownership-and-repair-path (current lines); unit SHA256 e9f472117d68d8c826f9f9b15946883a24addeedf3c298765032fc081f37cb2d.\nTarget: docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md:94-94#2-legacy-payload-identity-ownership-and-repair-path (current lines); unit SHA256 bcaecc76a91e2cd04d8a432c31285c9d795a274e2ae8dcba92ccfd94780daddf.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest bcaecc76a91e2cd04d8a432c31285c9d795a274e2ae8dcba92ccfd94780daddf at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 2, target 3; 3 changed spellings/labels, 0 destination changes; 1 added, 0 removed.\nLink 1: \"Repo Layout Vision\" (../component-boundary/repo-layout-vision.md) → \"Repo Layout Vision\" (../../../architect/component-boundary/repo-layout-vision.md); resolved docs/architect/component-boundary/repo-layout-vision.md → docs/architect/component-boundary/repo-layout-vision.md.\nLink 2: \"Runtime Identity And Activation\" (../packaging-distribution/runtime-identity-and-activation.md) → \"Runtime Identity And Activation\" (../../../architect/packaging-distribution/runtime-identity-and-activation.md); resolved docs/architect/packaging-distribution/runtime-identity-and-activation.md → docs/architect/packaging-distribution/runtime-identity-and-activation.md.\nLink 3: \"none\" (none) → \"the dropped-010 restoration\" (release-boundaries.md#restored-package-json-bin-fgos-removed-pointed-at-workspace-shim-at-default-flip-bin-fgos-runner-stays-ownership-hea); resolved none → docs/platform/host-invocation-routing/architecture/release-boundaries.md#restored-package-json-bin-fgos-removed-pointed-at-workspace-shim-at-default-flip-bin-fgos-runner-stays-ownership-hea.\nHeading depth: 2 → 4; title \"2. Legacy Payload Identity, Ownership, And Repair Path\" → \"2. Legacy Payload Identity, Ownership, And Repair Path\".\nApplicable labelled corrections: none in this bound unit.\nDisposition partial-carry: Account for docs/architect/host-invocation-routing/legacy-cli-transition.md#2-legacy-payload-identity-ownership-and-repair-path under docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#2-legacy-payload-identity-ownership-and-repair-path; source context \"Legacy CLI Transition\", target context \"Architecture: Legacy CLI Transition / Retained selected source material / Legacy CLI Transition\". The source text occurs verbatim inside the bound target section; section-level unit digests differ. Recorded residual: The relocated passage of docs/architect/host-invocation-routing/legacy-cli-transition.md#2-legacy-payload-identity-ownership-and-repair-path is retained verbatim at docs/platform/host-invocation-routing/architecture/release-boundaries.md#restored-package-json-bin-fgos-removed-pointed-at-workspace-shim-at-default-flip-bin-fgos-runner-stays-ownership-hea and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/legacy-cli-transition.md#unheaded-block-14 (claim_6a37273a0a45d24c53e344928c3edf22; `package.json` `bin.fgos` is removed (or pointed at the workspace shim) when the Rust host becomes the installed default; `bin.fgos-runner` )..\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "remainder": "The relocated passage of docs/architect/host-invocation-routing/legacy-cli-transition.md#2-legacy-payload-identity-ownership-and-repair-path is retained verbatim at docs/platform/host-invocation-routing/architecture/release-boundaries.md#restored-package-json-bin-fgos-removed-pointed-at-workspace-shim-at-default-flip-bin-fgos-runner-stays-ownership-hea and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/legacy-cli-transition.md#unheaded-block-14 (claim_6a37273a0a45d24c53e344928c3edf22; `package.json` `bin.fgos` is removed (or pointed at the workspace shim) when the Rust host becomes the installed default; `bin.fgos-runner` ).",
    "targetUnitDigest": "bcaecc76a91e2cd04d8a432c31285c9d795a274e2ae8dcba92ccfd94780daddf",
    "targetAncestry": [
      "Architecture: Legacy CLI Transition",
      "Retained selected source material",
      "Legacy CLI Transition"
    ]
  }
}
```

## Entry rationale-609

```json
{
  "entryId": "rationale-609",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_b098afd80d02a32e6c6dd6c0f1e23284",
  "before": "Move the complete direct unheaded-block unit \"**The Node program is not relocated and not renamed in the source tree** (decided 2026-09-10). `bin/fgos.mjs` computes its package root from its own file location and imp\" from docs/architect/host-invocation-routing/legacy-cli-transition.md#unheaded-block-12 to its frozen mapped owner docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#unheaded-block-18. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Judgment: no target digest match; independent full-text judgment remains required, not a script-proven approval. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by committed line-diff correspondence with equal unit kind and ancestry (replace). Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package.",
  "after": "Source: docs/architect/host-invocation-routing/legacy-cli-transition.md:44-44#unheaded-block-12 (current lines); unit SHA256 dfa5106e5a2c65608b2fb1bb8b7869265d23a7c499d3288b30249487c34142ce.\nTarget: docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md:104-104#unheaded-block-18 (current lines); unit SHA256 118885816abfb7f4aab2be95229d48b5f9d505ee4d781ced7fff9c43ce7dd95e.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 118885816abfb7f4aab2be95229d48b5f9d505ee4d781ced7fff9c43ce7dd95e at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 1, target 1; 1 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nLink 1: \"Repo Layout Vision\" (../component-boundary/repo-layout-vision.md) → \"Repo Layout Vision\" (../../../architect/component-boundary/repo-layout-vision.md); resolved docs/architect/component-boundary/repo-layout-vision.md → docs/architect/component-boundary/repo-layout-vision.md.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/legacy-cli-transition.md#unheaded-block-12 under docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#unheaded-block-18; source context \"Legacy CLI Transition / 2. Legacy Payload Identity, Ownership, And Repair Path\", target context \"Architecture: Legacy CLI Transition / Retained selected source material / Legacy CLI Transition / 2. Legacy Payload Identity, Ownership, And Repair Path\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 608,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_b098afd80d02a32e6c6dd6c0f1e23284",
    "sourceUnitDigest": "dfa5106e5a2c65608b2fb1bb8b7869265d23a7c499d3288b30249487c34142ce",
    "claimKind": "decision",
    "kind": "architecture",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md",
    "targetAnchor": "unheaded-block-18",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/legacy-cli-transition.md:44-44#unheaded-block-12 (current lines); unit SHA256 dfa5106e5a2c65608b2fb1bb8b7869265d23a7c499d3288b30249487c34142ce.\nTarget: docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md:104-104#unheaded-block-18 (current lines); unit SHA256 118885816abfb7f4aab2be95229d48b5f9d505ee4d781ced7fff9c43ce7dd95e.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 118885816abfb7f4aab2be95229d48b5f9d505ee4d781ced7fff9c43ce7dd95e at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 1, target 1; 1 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nLink 1: \"Repo Layout Vision\" (../component-boundary/repo-layout-vision.md) → \"Repo Layout Vision\" (../../../architect/component-boundary/repo-layout-vision.md); resolved docs/architect/component-boundary/repo-layout-vision.md → docs/architect/component-boundary/repo-layout-vision.md.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/legacy-cli-transition.md#unheaded-block-12 under docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#unheaded-block-18; source context \"Legacy CLI Transition / 2. Legacy Payload Identity, Ownership, And Repair Path\", target context \"Architecture: Legacy CLI Transition / Retained selected source material / Legacy CLI Transition / 2. Legacy Payload Identity, Ownership, And Repair Path\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "118885816abfb7f4aab2be95229d48b5f9d505ee4d781ced7fff9c43ce7dd95e",
    "targetAncestry": [
      "Architecture: Legacy CLI Transition",
      "Retained selected source material",
      "Legacy CLI Transition",
      "2. Legacy Payload Identity, Ownership, And Repair Path"
    ]
  }
}
```

## Entry rationale-610

```json
{
  "entryId": "rationale-610",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_c1993044e428f031329f23c67bc2a1d6",
  "before": "Move the complete direct unheaded-block unit \"The public `fgos` executable is the platform Rust host. It resolves the legacy payload as `join(activeReleasePath, components.legacyNode.root, components.legacyNode.entry\" from docs/architect/host-invocation-routing/legacy-cli-transition.md#unheaded-block-13 to its frozen mapped owner docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#unheaded-block-19. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Judgment: no target digest match; independent full-text judgment remains required, not a script-proven approval. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by committed line-diff correspondence with equal unit kind and ancestry (replace). Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding. Package at 2300d65571968bb3bcb80123a273272586e3f1db: pending target rebind by committed line-diff correspondence with equal unit kind and ancestry (replace). Full before/after and digests are in step10-sync2300-rebindings.json; historical approval does not cover the changed binding. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package.",
  "after": "Source: docs/architect/host-invocation-routing/legacy-cli-transition.md:46-46#unheaded-block-13 (current lines); unit SHA256 dd06d97ff0ed979559a570366b424ec49ae1661c6916fa89364ec9f6c1bc3716.\nTarget: docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md:106-106#unheaded-block-19 (current lines); unit SHA256 c3301ca9cc5d4bc1b53296a7edf3a3afb1726f1280db021c8c3131b554354f95.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest c3301ca9cc5d4bc1b53296a7edf3a3afb1726f1280db021c8c3131b554354f95 at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 1, target 1; 1 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nLink 1: \"Runtime Identity And Activation\" (../packaging-distribution/runtime-identity-and-activation.md) → \"Runtime Identity And Activation\" (../../../architect/packaging-distribution/runtime-identity-and-activation.md); resolved docs/architect/packaging-distribution/runtime-identity-and-activation.md → docs/architect/packaging-distribution/runtime-identity-and-activation.md.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/legacy-cli-transition.md#unheaded-block-13 under docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#unheaded-block-19; source context \"Legacy CLI Transition / 2. Legacy Payload Identity, Ownership, And Repair Path\", target context \"Architecture: Legacy CLI Transition / Retained selected source material / Legacy CLI Transition / 2. Legacy Payload Identity, Ownership, And Repair Path\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 609,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_c1993044e428f031329f23c67bc2a1d6",
    "sourceUnitDigest": "dd06d97ff0ed979559a570366b424ec49ae1661c6916fa89364ec9f6c1bc3716",
    "claimKind": "architecture",
    "kind": "architecture",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md",
    "targetAnchor": "unheaded-block-19",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/legacy-cli-transition.md:46-46#unheaded-block-13 (current lines); unit SHA256 dd06d97ff0ed979559a570366b424ec49ae1661c6916fa89364ec9f6c1bc3716.\nTarget: docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md:106-106#unheaded-block-19 (current lines); unit SHA256 c3301ca9cc5d4bc1b53296a7edf3a3afb1726f1280db021c8c3131b554354f95.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest c3301ca9cc5d4bc1b53296a7edf3a3afb1726f1280db021c8c3131b554354f95 at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 1, target 1; 1 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nLink 1: \"Runtime Identity And Activation\" (../packaging-distribution/runtime-identity-and-activation.md) → \"Runtime Identity And Activation\" (../../../architect/packaging-distribution/runtime-identity-and-activation.md); resolved docs/architect/packaging-distribution/runtime-identity-and-activation.md → docs/architect/packaging-distribution/runtime-identity-and-activation.md.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/legacy-cli-transition.md#unheaded-block-13 under docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#unheaded-block-19; source context \"Legacy CLI Transition / 2. Legacy Payload Identity, Ownership, And Repair Path\", target context \"Architecture: Legacy CLI Transition / Retained selected source material / Legacy CLI Transition / 2. Legacy Payload Identity, Ownership, And Repair Path\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "c3301ca9cc5d4bc1b53296a7edf3a3afb1726f1280db021c8c3131b554354f95",
    "targetAncestry": [
      "Architecture: Legacy CLI Transition",
      "Retained selected source material",
      "Legacy CLI Transition",
      "2. Legacy Payload Identity, Ownership, And Repair Path"
    ]
  }
}
```

## Entry rationale-611

```json
{
  "entryId": "rationale-611",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_b1e44493c254c54dc18efa2088b0018a",
  "before": "Move the complete direct heading unit \"## Related Documents\" from docs/architect/host-invocation-routing/legacy-cli-transition.md#related-documents to its frozen mapped owner docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#related-documents. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Judgment: no target digest match; independent full-text judgment remains required, not a script-proven approval. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by native retained identity. Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding. Package at 2300d65571968bb3bcb80123a273272586e3f1db: pending target rebind by native retained identity. Full before/after and digests are in step10-sync2300-rebindings.json; historical approval does not cover the changed binding. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package.",
  "after": "Source: docs/architect/host-invocation-routing/legacy-cli-transition.md:93-93#related-documents (current lines); unit SHA256 ded8adca384e6ae2de3bd7fe2c03692191f0bf14248ca807ff434b43e2efeeab.\nTarget: docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md:160-160#related-documents (current lines); unit SHA256 954b3dcc8c61cac86072dbe20d9c6aa044d2ddc3387979c743c81bfd69ae9337.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 954b3dcc8c61cac86072dbe20d9c6aa044d2ddc3387979c743c81bfd69ae9337 at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 3, target 3; 3 changed spellings/labels, 2 destination changes; 0 added, 0 removed.\nLink 1: \"Host Invocation And Provider Routing\" (./host-invocation-provider-routing.md) → \"Host Invocation And Provider Routing\" (../spec.md); resolved docs/architect/host-invocation-routing/host-invocation-provider-routing.md → docs/platform/host-invocation-routing/spec.md.\nLink 2: \"External Provider Protocol\" (./external-provider-protocol.md) → \"External Provider Protocol\" (external-provider-protocol.md); resolved docs/architect/host-invocation-routing/external-provider-protocol.md → docs/platform/host-invocation-routing/architecture/external-provider-protocol.md.\nLink 3: \"Runtime Identity And Activation\" (../packaging-distribution/runtime-identity-and-activation.md) → \"Runtime Identity And Activation\" (../../../architect/packaging-distribution/runtime-identity-and-activation.md); resolved docs/architect/packaging-distribution/runtime-identity-and-activation.md → docs/architect/packaging-distribution/runtime-identity-and-activation.md.\nHeading depth: 2 → 4; title \"Related Documents\" → \"Related Documents\".\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/legacy-cli-transition.md#related-documents under docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#related-documents; source context \"Legacy CLI Transition\", target context \"Architecture: Legacy CLI Transition / Retained selected source material / Legacy CLI Transition\". The source text occurs verbatim inside the bound target section; section-level unit digests differ.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 610,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_b1e44493c254c54dc18efa2088b0018a",
    "sourceUnitDigest": "ded8adca384e6ae2de3bd7fe2c03692191f0bf14248ca807ff434b43e2efeeab",
    "claimKind": "architecture",
    "kind": "architecture",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md",
    "targetAnchor": "related-documents",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/legacy-cli-transition.md:93-93#related-documents (current lines); unit SHA256 ded8adca384e6ae2de3bd7fe2c03692191f0bf14248ca807ff434b43e2efeeab.\nTarget: docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md:160-160#related-documents (current lines); unit SHA256 954b3dcc8c61cac86072dbe20d9c6aa044d2ddc3387979c743c81bfd69ae9337.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 954b3dcc8c61cac86072dbe20d9c6aa044d2ddc3387979c743c81bfd69ae9337 at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 3, target 3; 3 changed spellings/labels, 2 destination changes; 0 added, 0 removed.\nLink 1: \"Host Invocation And Provider Routing\" (./host-invocation-provider-routing.md) → \"Host Invocation And Provider Routing\" (../spec.md); resolved docs/architect/host-invocation-routing/host-invocation-provider-routing.md → docs/platform/host-invocation-routing/spec.md.\nLink 2: \"External Provider Protocol\" (./external-provider-protocol.md) → \"External Provider Protocol\" (external-provider-protocol.md); resolved docs/architect/host-invocation-routing/external-provider-protocol.md → docs/platform/host-invocation-routing/architecture/external-provider-protocol.md.\nLink 3: \"Runtime Identity And Activation\" (../packaging-distribution/runtime-identity-and-activation.md) → \"Runtime Identity And Activation\" (../../../architect/packaging-distribution/runtime-identity-and-activation.md); resolved docs/architect/packaging-distribution/runtime-identity-and-activation.md → docs/architect/packaging-distribution/runtime-identity-and-activation.md.\nHeading depth: 2 → 4; title \"Related Documents\" → \"Related Documents\".\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/legacy-cli-transition.md#related-documents under docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#related-documents; source context \"Legacy CLI Transition\", target context \"Architecture: Legacy CLI Transition / Retained selected source material / Legacy CLI Transition\". The source text occurs verbatim inside the bound target section; section-level unit digests differ.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "954b3dcc8c61cac86072dbe20d9c6aa044d2ddc3387979c743c81bfd69ae9337",
    "targetAncestry": [
      "Architecture: Legacy CLI Transition",
      "Retained selected source material",
      "Legacy CLI Transition"
    ]
  }
}
```

## Entry rationale-612

```json
{
  "entryId": "rationale-612",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_949229109da1c08a1d85f8503ea3ee9d",
  "before": "Move the complete direct unheaded-block unit \"- [Host Invocation And Provider Routing](./host-invocation-provider-routing.md) — kernel contract this document depends on. - [External Provider Protocol](./external-prov\" from docs/architect/host-invocation-routing/legacy-cli-transition.md#unheaded-block-30 to its frozen mapped owner docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#unheaded-block-36. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Judgment: no target digest match; independent full-text judgment remains required, not a script-proven approval. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by committed line-diff correspondence with equal unit kind and ancestry (equal). Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding. Package at 2300d65571968bb3bcb80123a273272586e3f1db: pending target rebind by committed line-diff correspondence with equal unit kind and ancestry (equal). Full before/after and digests are in step10-sync2300-rebindings.json; historical approval does not cover the changed binding. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package.",
  "after": "Source: docs/architect/host-invocation-routing/legacy-cli-transition.md:95-97#unheaded-block-30 (current lines); unit SHA256 42cc4ac1d11d27794f03b4cb8c1981441babf36f7b6a207ae7d6513e1e90aaa7.\nTarget: docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md:162-164#unheaded-block-37 (current lines); unit SHA256 79a8711ca2d89312fa54c5f3518f6e8541db0883c16b6de74b945a0c78b886a0.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 79a8711ca2d89312fa54c5f3518f6e8541db0883c16b6de74b945a0c78b886a0 at 19ca8de23908e161c34c91626e41041b7813167c.\nLinks: source 3, target 3; 3 changed spellings/labels, 2 destination changes; 0 added, 0 removed.\nLink 1: \"Host Invocation And Provider Routing\" (./host-invocation-provider-routing.md) → \"Host Invocation And Provider Routing\" (../spec.md); resolved docs/architect/host-invocation-routing/host-invocation-provider-routing.md → docs/platform/host-invocation-routing/spec.md.\nLink 2: \"External Provider Protocol\" (./external-provider-protocol.md) → \"External Provider Protocol\" (external-provider-protocol.md); resolved docs/architect/host-invocation-routing/external-provider-protocol.md → docs/platform/host-invocation-routing/architecture/external-provider-protocol.md.\nLink 3: \"Runtime Identity And Activation\" (../packaging-distribution/runtime-identity-and-activation.md) → \"Runtime Identity And Activation\" (../../../architect/packaging-distribution/runtime-identity-and-activation.md); resolved docs/architect/packaging-distribution/runtime-identity-and-activation.md → docs/architect/packaging-distribution/runtime-identity-and-activation.md.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/legacy-cli-transition.md#unheaded-block-30 under docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#unheaded-block-37; source context \"Legacy CLI Transition / Related Documents\", target context \"Architecture: Legacy CLI Transition / Retained selected source material / Legacy CLI Transition / Related Documents\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 611,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_949229109da1c08a1d85f8503ea3ee9d",
    "sourceUnitDigest": "42cc4ac1d11d27794f03b4cb8c1981441babf36f7b6a207ae7d6513e1e90aaa7",
    "claimKind": "contract",
    "kind": "architecture",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md",
    "targetAnchor": "unheaded-block-37",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/legacy-cli-transition.md:95-97#unheaded-block-30 (current lines); unit SHA256 42cc4ac1d11d27794f03b4cb8c1981441babf36f7b6a207ae7d6513e1e90aaa7.\nTarget: docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md:162-164#unheaded-block-37 (current lines); unit SHA256 79a8711ca2d89312fa54c5f3518f6e8541db0883c16b6de74b945a0c78b886a0.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 79a8711ca2d89312fa54c5f3518f6e8541db0883c16b6de74b945a0c78b886a0 at 19ca8de23908e161c34c91626e41041b7813167c.\nLinks: source 3, target 3; 3 changed spellings/labels, 2 destination changes; 0 added, 0 removed.\nLink 1: \"Host Invocation And Provider Routing\" (./host-invocation-provider-routing.md) → \"Host Invocation And Provider Routing\" (../spec.md); resolved docs/architect/host-invocation-routing/host-invocation-provider-routing.md → docs/platform/host-invocation-routing/spec.md.\nLink 2: \"External Provider Protocol\" (./external-provider-protocol.md) → \"External Provider Protocol\" (external-provider-protocol.md); resolved docs/architect/host-invocation-routing/external-provider-protocol.md → docs/platform/host-invocation-routing/architecture/external-provider-protocol.md.\nLink 3: \"Runtime Identity And Activation\" (../packaging-distribution/runtime-identity-and-activation.md) → \"Runtime Identity And Activation\" (../../../architect/packaging-distribution/runtime-identity-and-activation.md); resolved docs/architect/packaging-distribution/runtime-identity-and-activation.md → docs/architect/packaging-distribution/runtime-identity-and-activation.md.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/legacy-cli-transition.md#unheaded-block-30 under docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#unheaded-block-37; source context \"Legacy CLI Transition / Related Documents\", target context \"Architecture: Legacy CLI Transition / Retained selected source material / Legacy CLI Transition / Related Documents\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "79a8711ca2d89312fa54c5f3518f6e8541db0883c16b6de74b945a0c78b886a0",
    "targetAncestry": [
      "Architecture: Legacy CLI Transition",
      "Retained selected source material",
      "Legacy CLI Transition",
      "Related Documents"
    ]
  }
}
```

## Entry rationale-613

```json
{
  "entryId": "rationale-613",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_ac2177776d1a367f2d8e81699b04fc63",
  "before": "Partial carry of the direct source section docs/architect/host-invocation-routing/node-to-rust-component-migration.md#13-rollback-rules at docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md#13-rollback-rules; surrounding content stays here. Remainder: The relocated passage of docs/architect/host-invocation-routing/node-to-rust-component-migration.md#13-rollback-rules is retained verbatim at docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-rollback-bullets and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/node-to-rust-component-migration.md#unheaded-block-59 (claim_a1c1085c9d77a84ca5e5aefe1de6d059; - Keep legacy and native implementations side by side only for the observation window of their operation. - Never delete a Node writer bef). No source wording is discarded; this row does not claim the primary target alone contains the relocated passage. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by native retained identity. Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding. Package at 2300d65571968bb3bcb80123a273272586e3f1db: pending target rebind by native retained identity. Full before/after and digests are in step10-sync2300-rebindings.json; historical approval does not cover the changed binding.",
  "after": "Source: docs/architect/host-invocation-routing/node-to-rust-component-migration.md:377-377#13-rollback-rules (current lines); unit SHA256 30245265d7fc653884caff4a90018addd38af26a0e29f35223b0f4fcd4ecdd20.\nTarget: docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md:398-398#13-rollback-rules (current lines); unit SHA256 8d879f9c47c2ff7d5802b8a53b77ac6b4367b511681b018b81644f370b5abae6.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 8d879f9c47c2ff7d5802b8a53b77ac6b4367b511681b018b81644f370b5abae6 at 2300d65571968bb3bcb80123a273272586e3f1db.\nLinks: source 1, target 2; 2 changed spellings/labels, 1 destination changes; 1 added, 0 removed.\nLink 1: \"Runtime Identity And Activation\" (../packaging-distribution/runtime-identity-and-activation.md) → \"Runtime Identity And Activation\" (../../packaging-distribution/architecture/runtime-identity-and-activation.md); resolved docs/architect/packaging-distribution/runtime-identity-and-activation.md → docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md.\nLink 2: \"none\" (none) → \"the dropped-015 restoration\" (../contracts/component-protocol.md#restored-rollback-bullets); resolved none → docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-rollback-bullets.\nHeading depth: 2 → 4; title \"13. Rollback Rules\" → \"13. Rollback Rules\".\nApplicable labelled corrections: none in this bound unit.\nDisposition partial-carry: Account for docs/architect/host-invocation-routing/node-to-rust-component-migration.md#13-rollback-rules under docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md#13-rollback-rules; source context \"Node To Rust Component Migration\", target context \"Architecture: Node To Rust Migration / Retained selected source material / Node To Rust Component Migration\". The source text occurs verbatim inside the bound target section; section-level unit digests differ. Recorded residual: The relocated passage of docs/architect/host-invocation-routing/node-to-rust-component-migration.md#13-rollback-rules is retained verbatim at docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-rollback-bullets and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/node-to-rust-component-migration.md#unheaded-block-59 (claim_a1c1085c9d77a84ca5e5aefe1de6d059; - Keep legacy and native implementations side by side only for the observation window of their operation. - Never delete a Node writer bef)..\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 612,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_ac2177776d1a367f2d8e81699b04fc63",
    "sourceUnitDigest": "30245265d7fc653884caff4a90018addd38af26a0e29f35223b0f4fcd4ecdd20",
    "claimKind": "architecture",
    "kind": "architecture",
    "disposition": "partial-carry",
    "targetOwner": "docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md",
    "targetAnchor": "13-rollback-rules",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/node-to-rust-component-migration.md:377-377#13-rollback-rules (current lines); unit SHA256 30245265d7fc653884caff4a90018addd38af26a0e29f35223b0f4fcd4ecdd20.\nTarget: docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md:398-398#13-rollback-rules (current lines); unit SHA256 8d879f9c47c2ff7d5802b8a53b77ac6b4367b511681b018b81644f370b5abae6.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 8d879f9c47c2ff7d5802b8a53b77ac6b4367b511681b018b81644f370b5abae6 at 2300d65571968bb3bcb80123a273272586e3f1db.\nLinks: source 1, target 2; 2 changed spellings/labels, 1 destination changes; 1 added, 0 removed.\nLink 1: \"Runtime Identity And Activation\" (../packaging-distribution/runtime-identity-and-activation.md) → \"Runtime Identity And Activation\" (../../packaging-distribution/architecture/runtime-identity-and-activation.md); resolved docs/architect/packaging-distribution/runtime-identity-and-activation.md → docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md.\nLink 2: \"none\" (none) → \"the dropped-015 restoration\" (../contracts/component-protocol.md#restored-rollback-bullets); resolved none → docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-rollback-bullets.\nHeading depth: 2 → 4; title \"13. Rollback Rules\" → \"13. Rollback Rules\".\nApplicable labelled corrections: none in this bound unit.\nDisposition partial-carry: Account for docs/architect/host-invocation-routing/node-to-rust-component-migration.md#13-rollback-rules under docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md#13-rollback-rules; source context \"Node To Rust Component Migration\", target context \"Architecture: Node To Rust Migration / Retained selected source material / Node To Rust Component Migration\". The source text occurs verbatim inside the bound target section; section-level unit digests differ. Recorded residual: The relocated passage of docs/architect/host-invocation-routing/node-to-rust-component-migration.md#13-rollback-rules is retained verbatim at docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-rollback-bullets and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/node-to-rust-component-migration.md#unheaded-block-59 (claim_a1c1085c9d77a84ca5e5aefe1de6d059; - Keep legacy and native implementations side by side only for the observation window of their operation. - Never delete a Node writer bef)..\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "remainder": "The relocated passage of docs/architect/host-invocation-routing/node-to-rust-component-migration.md#13-rollback-rules is retained verbatim at docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-rollback-bullets and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/node-to-rust-component-migration.md#unheaded-block-59 (claim_a1c1085c9d77a84ca5e5aefe1de6d059; - Keep legacy and native implementations side by side only for the observation window of their operation. - Never delete a Node writer bef).",
    "targetUnitDigest": "8d879f9c47c2ff7d5802b8a53b77ac6b4367b511681b018b81644f370b5abae6",
    "targetAncestry": [
      "Architecture: Node To Rust Migration",
      "Retained selected source material",
      "Node To Rust Component Migration"
    ]
  }
}
```

## Entry rationale-614

```json
{
  "entryId": "rationale-614",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_182dc1f2f896d82f0cf35519579ebbbf",
  "before": "Move the complete direct unheaded-block unit \"**Status:** Proposed execution plan; blocked only by the remaining §3 decisions (target matrix, preview-vs-stable, compatibility-window duration) and the packaging stream\" from docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-1 to its frozen mapped owner docs/platform/host-invocation-routing/roadmap.md#unheaded-block-60. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Judgment: no target digest match; independent full-text judgment remains required, not a script-proven approval. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by committed line-diff correspondence with equal unit kind and ancestry (equal). Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding. Package at 2300d65571968bb3bcb80123a273272586e3f1db: pending target rebind by committed line-diff correspondence with equal unit kind and ancestry (equal). Full before/after and digests are in step10-sync2300-rebindings.json; historical approval does not cover the changed binding.",
  "after": "Source: docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md:3-11#unheaded-block-1 (current lines); unit SHA256 bbf58c843d81479697f50cb65c3a1570f2aa9b42bc6222cbbbdb153ad2ce0e02.\nTarget: docs/platform/host-invocation-routing/roadmap.md:325-333#unheaded-block-61 (current lines); unit SHA256 aff8c73a22167b7d5acd8883f25f064b536e45ba923186c01132b6e4ff56f639.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest aff8c73a22167b7d5acd8883f25f064b536e45ba923186c01132b6e4ff56f639 at 2300d65571968bb3bcb80123a273272586e3f1db.\nLinks: source 4, target 4; 4 changed spellings/labels, 4 destination changes; 0 added, 0 removed.\nLink 1: \"Host Invocation And Provider Routing\" (./host-invocation-provider-routing.md) → \"Host Invocation And Provider Routing\" (spec.md); resolved docs/architect/host-invocation-routing/host-invocation-provider-routing.md → docs/platform/host-invocation-routing/spec.md.\nLink 2: \"Node To Rust Component Migration\" (./node-to-rust-component-migration.md) → \"Node To Rust Component Migration\" (architecture/node-to-rust-migration.md); resolved docs/architect/host-invocation-routing/node-to-rust-component-migration.md → docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md.\nLink 3: \"fgOS Component Boundary Advisory\" (../component-boundary/component-boundary-advisory.md) → \"fgOS Component Boundary Advisory\" (../component-boundary.md); resolved docs/architect/component-boundary/component-boundary-advisory.md → docs/platform/component-boundary.md.\nLink 4: \"Runtime Identity And Activation\" (../packaging-distribution/runtime-identity-and-activation.md) → \"Runtime Identity And Activation\" (../packaging-distribution/architecture/runtime-identity-and-activation.md); resolved docs/architect/packaging-distribution/runtime-identity-and-activation.md → docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-1 under docs/platform/host-invocation-routing/roadmap.md#unheaded-block-61; source context \"Rust Host And Proof Providers Implementation Plan\", target context \"Host Invocation Routing Roadmap / Retained selected source material / Rust Host And Proof Providers Implementation Plan\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 613,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_182dc1f2f896d82f0cf35519579ebbbf",
    "sourceUnitDigest": "bbf58c843d81479697f50cb65c3a1570f2aa9b42bc6222cbbbdb153ad2ce0e02",
    "claimKind": "architecture",
    "kind": "roadmap",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/roadmap.md",
    "targetAnchor": "unheaded-block-61",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md:3-11#unheaded-block-1 (current lines); unit SHA256 bbf58c843d81479697f50cb65c3a1570f2aa9b42bc6222cbbbdb153ad2ce0e02.\nTarget: docs/platform/host-invocation-routing/roadmap.md:325-333#unheaded-block-61 (current lines); unit SHA256 aff8c73a22167b7d5acd8883f25f064b536e45ba923186c01132b6e4ff56f639.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest aff8c73a22167b7d5acd8883f25f064b536e45ba923186c01132b6e4ff56f639 at 2300d65571968bb3bcb80123a273272586e3f1db.\nLinks: source 4, target 4; 4 changed spellings/labels, 4 destination changes; 0 added, 0 removed.\nLink 1: \"Host Invocation And Provider Routing\" (./host-invocation-provider-routing.md) → \"Host Invocation And Provider Routing\" (spec.md); resolved docs/architect/host-invocation-routing/host-invocation-provider-routing.md → docs/platform/host-invocation-routing/spec.md.\nLink 2: \"Node To Rust Component Migration\" (./node-to-rust-component-migration.md) → \"Node To Rust Component Migration\" (architecture/node-to-rust-migration.md); resolved docs/architect/host-invocation-routing/node-to-rust-component-migration.md → docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md.\nLink 3: \"fgOS Component Boundary Advisory\" (../component-boundary/component-boundary-advisory.md) → \"fgOS Component Boundary Advisory\" (../component-boundary.md); resolved docs/architect/component-boundary/component-boundary-advisory.md → docs/platform/component-boundary.md.\nLink 4: \"Runtime Identity And Activation\" (../packaging-distribution/runtime-identity-and-activation.md) → \"Runtime Identity And Activation\" (../packaging-distribution/architecture/runtime-identity-and-activation.md); resolved docs/architect/packaging-distribution/runtime-identity-and-activation.md → docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-1 under docs/platform/host-invocation-routing/roadmap.md#unheaded-block-61; source context \"Rust Host And Proof Providers Implementation Plan\", target context \"Host Invocation Routing Roadmap / Retained selected source material / Rust Host And Proof Providers Implementation Plan\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "aff8c73a22167b7d5acd8883f25f064b536e45ba923186c01132b6e4ff56f639",
    "targetAncestry": [
      "Host Invocation Routing Roadmap",
      "Retained selected source material",
      "Rust Host And Proof Providers Implementation Plan"
    ]
  }
}
```

## Entry rationale-615

```json
{
  "entryId": "rationale-615",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s4-packaging-distribution-architecture.json",
  "collection": "claims",
  "claimId": "claim_5766225be2d76d6239e116a664aec7cf",
  "before": "The complete heading from docs/architect/packaging-distribution/README.md#2-historical-supersession-table, under \"2. Historical Supersession Table\", is retained at docs/platform/packaging-distribution/README.md#2-historical-supersession-table. Heading depth and relative-link destinations change; rewritten links resolve to the same files; the direct section payload follows the original source order. The named owner is the packaging-distribution/README.md topic owner; carriage does not certify current implementation. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by native retained identity. Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package.",
  "after": "Source: docs/architect/packaging-distribution/README.md:57-57#2-historical-supersession-table (current lines); unit SHA256 70847eb505d007a2f2d5667bd66ecb218b1714f49112e48163ab449ad74f5dc8.\nTarget: docs/platform/packaging-distribution/README.md:266-266#2-historical-supersession-table (current lines); unit SHA256 7a121f1faaa77b183e3e2d5b187d1ae7a2d65980bfa7a3a4ead0088e25ef938e.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 7a121f1faaa77b183e3e2d5b187d1ae7a2d65980bfa7a3a4ead0088e25ef938e at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 4, target 4; 4 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nLink 1: \"Workspace Topology Architecture\" (../workspace-topology.md) → \"Workspace Topology Architecture\" (../../architect/workspace-topology.md); resolved docs/architect/workspace-topology.md → docs/architect/workspace-topology.md.\nLink 2: \"Promoted Runtime Identity And Activation\" (../../platform/packaging-distribution/architecture/runtime-identity-and-activation.md) → \"Promoted Runtime Identity And Activation\" (architecture/runtime-identity-and-activation.md); resolved docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md → docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md.\nLink 3: \"Promoted Future Constraints\" (../../platform/packaging-distribution/architecture/future-constraints.md) → \"Promoted Future Constraints\" (architecture/future-constraints.md); resolved docs/platform/packaging-distribution/architecture/future-constraints.md → docs/platform/packaging-distribution/architecture/future-constraints.md.\nLink 4: \"Distribution Baseline And Scattered Spec Fragments\" (./history/distribution-baseline.md) → \"Distribution Baseline And Scattered Spec Fragments\" (../../architect/packaging-distribution/history/distribution-baseline.md); resolved docs/architect/packaging-distribution/history/distribution-baseline.md → docs/architect/packaging-distribution/history/distribution-baseline.md.\nHeading depth: 2 → 4; title \"2. Historical Supersession Table\" → \"2. Historical Supersession Table\".\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/packaging-distribution/README.md#2-historical-supersession-table under docs/platform/packaging-distribution/README.md#2-historical-supersession-table; source context \"Packaging And Distribution Architecture\", target context \"Packaging-Distribution / Retained Readme Source Detail / Packaging And Distribution Architecture\". The source text occurs verbatim inside the bound target section; section-level unit digests differ.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 614,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_5766225be2d76d6239e116a664aec7cf",
    "sourceUnitDigest": "70847eb505d007a2f2d5667bd66ecb218b1714f49112e48163ab449ad74f5dc8",
    "targetOwner": "docs/platform/packaging-distribution/README.md",
    "targetAnchor": "2-historical-supersession-table",
    "claimKind": "architecture",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/packaging-distribution/README.md:57-57#2-historical-supersession-table (current lines); unit SHA256 70847eb505d007a2f2d5667bd66ecb218b1714f49112e48163ab449ad74f5dc8.\nTarget: docs/platform/packaging-distribution/README.md:266-266#2-historical-supersession-table (current lines); unit SHA256 7a121f1faaa77b183e3e2d5b187d1ae7a2d65980bfa7a3a4ead0088e25ef938e.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 7a121f1faaa77b183e3e2d5b187d1ae7a2d65980bfa7a3a4ead0088e25ef938e at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 4, target 4; 4 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nLink 1: \"Workspace Topology Architecture\" (../workspace-topology.md) → \"Workspace Topology Architecture\" (../../architect/workspace-topology.md); resolved docs/architect/workspace-topology.md → docs/architect/workspace-topology.md.\nLink 2: \"Promoted Runtime Identity And Activation\" (../../platform/packaging-distribution/architecture/runtime-identity-and-activation.md) → \"Promoted Runtime Identity And Activation\" (architecture/runtime-identity-and-activation.md); resolved docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md → docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md.\nLink 3: \"Promoted Future Constraints\" (../../platform/packaging-distribution/architecture/future-constraints.md) → \"Promoted Future Constraints\" (architecture/future-constraints.md); resolved docs/platform/packaging-distribution/architecture/future-constraints.md → docs/platform/packaging-distribution/architecture/future-constraints.md.\nLink 4: \"Distribution Baseline And Scattered Spec Fragments\" (./history/distribution-baseline.md) → \"Distribution Baseline And Scattered Spec Fragments\" (../../architect/packaging-distribution/history/distribution-baseline.md); resolved docs/architect/packaging-distribution/history/distribution-baseline.md → docs/architect/packaging-distribution/history/distribution-baseline.md.\nHeading depth: 2 → 4; title \"2. Historical Supersession Table\" → \"2. Historical Supersession Table\".\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/packaging-distribution/README.md#2-historical-supersession-table under docs/platform/packaging-distribution/README.md#2-historical-supersession-table; source context \"Packaging And Distribution Architecture\", target context \"Packaging-Distribution / Retained Readme Source Detail / Packaging And Distribution Architecture\". The source text occurs verbatim inside the bound target section; section-level unit digests differ.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "7a121f1faaa77b183e3e2d5b187d1ae7a2d65980bfa7a3a4ead0088e25ef938e",
    "targetAncestry": [
      "Packaging-Distribution",
      "Retained Readme Source Detail",
      "Packaging And Distribution Architecture"
    ]
  }
}
```

## Entry rationale-616

```json
{
  "entryId": "rationale-616",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s4-packaging-distribution-architecture.json",
  "collection": "claims",
  "claimId": "claim_37a8691bba650ed4cd9d98314b6a2b1a",
  "before": "The complete unheaded-block from docs/architect/packaging-distribution/README.md#unheaded-block-9, under \"2. Historical Supersession Table\", is retained at docs/platform/packaging-distribution/README.md#unheaded-block-38. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the packaging-distribution/README.md topic owner; carriage does not certify current implementation. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by committed line-diff correspondence with equal unit kind and ancestry (equal). Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package.",
  "after": "Source: docs/architect/packaging-distribution/README.md:59-65#unheaded-block-9 (current lines); unit SHA256 302168079cde3ef23795b07c1b04407141262f1af1a9586a56c7e39059878d29.\nTarget: docs/platform/packaging-distribution/README.md:268-274#unheaded-block-38 (current lines); unit SHA256 8938a4cbe3f1099f298566f2fd822d2745030454f4f50025e8f9ff685a38f405.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 8938a4cbe3f1099f298566f2fd822d2745030454f4f50025e8f9ff685a38f405 at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 4, target 4; 4 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nLink 1: \"Workspace Topology Architecture\" (../workspace-topology.md) → \"Workspace Topology Architecture\" (../../architect/workspace-topology.md); resolved docs/architect/workspace-topology.md → docs/architect/workspace-topology.md.\nLink 2: \"Promoted Runtime Identity And Activation\" (../../platform/packaging-distribution/architecture/runtime-identity-and-activation.md) → \"Promoted Runtime Identity And Activation\" (architecture/runtime-identity-and-activation.md); resolved docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md → docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md.\nLink 3: \"Promoted Future Constraints\" (../../platform/packaging-distribution/architecture/future-constraints.md) → \"Promoted Future Constraints\" (architecture/future-constraints.md); resolved docs/platform/packaging-distribution/architecture/future-constraints.md → docs/platform/packaging-distribution/architecture/future-constraints.md.\nLink 4: \"Distribution Baseline And Scattered Spec Fragments\" (./history/distribution-baseline.md) → \"Distribution Baseline And Scattered Spec Fragments\" (../../architect/packaging-distribution/history/distribution-baseline.md); resolved docs/architect/packaging-distribution/history/distribution-baseline.md → docs/architect/packaging-distribution/history/distribution-baseline.md.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/packaging-distribution/README.md#unheaded-block-9 under docs/platform/packaging-distribution/README.md#unheaded-block-38; source context \"Packaging And Distribution Architecture / 2. Historical Supersession Table\", target context \"Packaging-Distribution / Retained Readme Source Detail / Packaging And Distribution Architecture / 2. Historical Supersession Table\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 615,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_37a8691bba650ed4cd9d98314b6a2b1a",
    "sourceUnitDigest": "302168079cde3ef23795b07c1b04407141262f1af1a9586a56c7e39059878d29",
    "targetOwner": "docs/platform/packaging-distribution/README.md",
    "targetAnchor": "unheaded-block-38",
    "claimKind": "architecture",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/packaging-distribution/README.md:59-65#unheaded-block-9 (current lines); unit SHA256 302168079cde3ef23795b07c1b04407141262f1af1a9586a56c7e39059878d29.\nTarget: docs/platform/packaging-distribution/README.md:268-274#unheaded-block-38 (current lines); unit SHA256 8938a4cbe3f1099f298566f2fd822d2745030454f4f50025e8f9ff685a38f405.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 8938a4cbe3f1099f298566f2fd822d2745030454f4f50025e8f9ff685a38f405 at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 4, target 4; 4 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nLink 1: \"Workspace Topology Architecture\" (../workspace-topology.md) → \"Workspace Topology Architecture\" (../../architect/workspace-topology.md); resolved docs/architect/workspace-topology.md → docs/architect/workspace-topology.md.\nLink 2: \"Promoted Runtime Identity And Activation\" (../../platform/packaging-distribution/architecture/runtime-identity-and-activation.md) → \"Promoted Runtime Identity And Activation\" (architecture/runtime-identity-and-activation.md); resolved docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md → docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md.\nLink 3: \"Promoted Future Constraints\" (../../platform/packaging-distribution/architecture/future-constraints.md) → \"Promoted Future Constraints\" (architecture/future-constraints.md); resolved docs/platform/packaging-distribution/architecture/future-constraints.md → docs/platform/packaging-distribution/architecture/future-constraints.md.\nLink 4: \"Distribution Baseline And Scattered Spec Fragments\" (./history/distribution-baseline.md) → \"Distribution Baseline And Scattered Spec Fragments\" (../../architect/packaging-distribution/history/distribution-baseline.md); resolved docs/architect/packaging-distribution/history/distribution-baseline.md → docs/architect/packaging-distribution/history/distribution-baseline.md.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/packaging-distribution/README.md#unheaded-block-9 under docs/platform/packaging-distribution/README.md#unheaded-block-38; source context \"Packaging And Distribution Architecture / 2. Historical Supersession Table\", target context \"Packaging-Distribution / Retained Readme Source Detail / Packaging And Distribution Architecture / 2. Historical Supersession Table\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "8938a4cbe3f1099f298566f2fd822d2745030454f4f50025e8f9ff685a38f405",
    "targetAncestry": [
      "Packaging-Distribution",
      "Retained Readme Source Detail",
      "Packaging And Distribution Architecture",
      "2. Historical Supersession Table"
    ]
  }
}
```

## Entry rationale-617

```json
{
  "entryId": "rationale-617",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s4-packaging-distribution-architecture.json",
  "collection": "claims",
  "claimId": "claim_088af18a5796ed72fe6d33ff2cc5d05c",
  "before": "The complete heading from docs/architect/packaging-distribution/runtime-identity-and-activation.md#5-releasemanifest, under \"5. ReleaseManifest\", is retained at docs/platform/packaging-distribution/contracts/release-manifest.md#5-releasemanifest. Heading depth and relative-link destinations change; rewritten links resolve to the same files; the direct section payload follows the original source order. The named owner is the contracts/release-manifest.md topic owner; carriage does not certify current implementation. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by native retained identity. Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding. Package at 2300d65571968bb3bcb80123a273272586e3f1db: pending target rebind by native retained identity. Full before/after and digests are in step10-sync2300-rebindings.json; historical approval does not cover the changed binding. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package.",
  "after": "Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md:295-295#5-releasemanifest (current lines); unit SHA256 b801deec612f9c048de490e35353b38f99031f2bac692e2955b64c7b1411587b.\nTarget: docs/platform/packaging-distribution/contracts/release-manifest.md:146-146#5-releasemanifest (current lines); unit SHA256 dab662376a62121a0cdec73438f62b6955fe94aa868d54deceb124c3aceaefee.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest dab662376a62121a0cdec73438f62b6955fe94aa868d54deceb124c3aceaefee at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 1, target 1; 1 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nLink 1: \"Legacy CLI Transition\" (../host-invocation-routing/legacy-cli-transition.md) → \"Legacy CLI Transition\" (../../../architect/host-invocation-routing/legacy-cli-transition.md); resolved docs/architect/host-invocation-routing/legacy-cli-transition.md → docs/architect/host-invocation-routing/legacy-cli-transition.md.\nHeading depth: 2 → 4; title \"5. ReleaseManifest\" → \"5. ReleaseManifest\".\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/packaging-distribution/runtime-identity-and-activation.md#5-releasemanifest under docs/platform/packaging-distribution/contracts/release-manifest.md#5-releasemanifest; source context \"Runtime Identity And Activation\", target context \"Contract: Release Manifest / Retained Runtime Identity And Activation Source Detail\". The source text occurs verbatim inside the bound target section; section-level unit digests differ.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 616,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_088af18a5796ed72fe6d33ff2cc5d05c",
    "sourceUnitDigest": "b801deec612f9c048de490e35353b38f99031f2bac692e2955b64c7b1411587b",
    "targetOwner": "docs/platform/packaging-distribution/contracts/release-manifest.md",
    "targetAnchor": "5-releasemanifest",
    "claimKind": "architecture",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md:295-295#5-releasemanifest (current lines); unit SHA256 b801deec612f9c048de490e35353b38f99031f2bac692e2955b64c7b1411587b.\nTarget: docs/platform/packaging-distribution/contracts/release-manifest.md:146-146#5-releasemanifest (current lines); unit SHA256 dab662376a62121a0cdec73438f62b6955fe94aa868d54deceb124c3aceaefee.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest dab662376a62121a0cdec73438f62b6955fe94aa868d54deceb124c3aceaefee at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 1, target 1; 1 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nLink 1: \"Legacy CLI Transition\" (../host-invocation-routing/legacy-cli-transition.md) → \"Legacy CLI Transition\" (../../../architect/host-invocation-routing/legacy-cli-transition.md); resolved docs/architect/host-invocation-routing/legacy-cli-transition.md → docs/architect/host-invocation-routing/legacy-cli-transition.md.\nHeading depth: 2 → 4; title \"5. ReleaseManifest\" → \"5. ReleaseManifest\".\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/packaging-distribution/runtime-identity-and-activation.md#5-releasemanifest under docs/platform/packaging-distribution/contracts/release-manifest.md#5-releasemanifest; source context \"Runtime Identity And Activation\", target context \"Contract: Release Manifest / Retained Runtime Identity And Activation Source Detail\". The source text occurs verbatim inside the bound target section; section-level unit digests differ.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "dab662376a62121a0cdec73438f62b6955fe94aa868d54deceb124c3aceaefee",
    "targetAncestry": [
      "Contract: Release Manifest",
      "Retained Runtime Identity And Activation Source Detail"
    ]
  }
}
```

## Entry rationale-618

```json
{
  "entryId": "rationale-618",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s4-packaging-distribution-architecture.json",
  "collection": "claims",
  "claimId": "claim_5b308c0d698cf4b6e679cefd4b72159e",
  "before": "The complete unheaded-block from docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-41, under \"5. ReleaseManifest\", is retained at docs/platform/packaging-distribution/contracts/release-manifest.md#unheaded-block-17. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the contracts/release-manifest.md topic owner; carriage does not certify current implementation. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by committed line-diff correspondence with equal unit kind and ancestry (replace). Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding. Package at 2300d65571968bb3bcb80123a273272586e3f1db: pending target rebind by committed line-diff correspondence with equal unit kind and ancestry (replace). Full before/after and digests are in step10-sync2300-rebindings.json; historical approval does not cover the changed binding. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package.",
  "after": "Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md:369-369#unheaded-block-41 (current lines); unit SHA256 b22b5c1e8b0d30d63d4ecdff35d16e1b07c4e8f1dddb748e55fdc961c6f1e7ac.\nTarget: docs/platform/packaging-distribution/contracts/release-manifest.md:220-220#unheaded-block-17 (current lines); unit SHA256 2c2c843c119b46a01d8e99728f09aa95a1bd650fe7c85276230a0324ccf40265.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 2c2c843c119b46a01d8e99728f09aa95a1bd650fe7c85276230a0324ccf40265 at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 1, target 1; 1 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nLink 1: \"Legacy CLI Transition\" (../host-invocation-routing/legacy-cli-transition.md) → \"Legacy CLI Transition\" (../../../architect/host-invocation-routing/legacy-cli-transition.md); resolved docs/architect/host-invocation-routing/legacy-cli-transition.md → docs/architect/host-invocation-routing/legacy-cli-transition.md.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-41 under docs/platform/packaging-distribution/contracts/release-manifest.md#unheaded-block-17; source context \"Runtime Identity And Activation / 5. ReleaseManifest\", target context \"Contract: Release Manifest / Retained Runtime Identity And Activation Source Detail / 5. ReleaseManifest\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 617,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_5b308c0d698cf4b6e679cefd4b72159e",
    "sourceUnitDigest": "b22b5c1e8b0d30d63d4ecdff35d16e1b07c4e8f1dddb748e55fdc961c6f1e7ac",
    "targetOwner": "docs/platform/packaging-distribution/contracts/release-manifest.md",
    "targetAnchor": "unheaded-block-17",
    "claimKind": "architecture",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md:369-369#unheaded-block-41 (current lines); unit SHA256 b22b5c1e8b0d30d63d4ecdff35d16e1b07c4e8f1dddb748e55fdc961c6f1e7ac.\nTarget: docs/platform/packaging-distribution/contracts/release-manifest.md:220-220#unheaded-block-17 (current lines); unit SHA256 2c2c843c119b46a01d8e99728f09aa95a1bd650fe7c85276230a0324ccf40265.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 2c2c843c119b46a01d8e99728f09aa95a1bd650fe7c85276230a0324ccf40265 at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 1, target 1; 1 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nLink 1: \"Legacy CLI Transition\" (../host-invocation-routing/legacy-cli-transition.md) → \"Legacy CLI Transition\" (../../../architect/host-invocation-routing/legacy-cli-transition.md); resolved docs/architect/host-invocation-routing/legacy-cli-transition.md → docs/architect/host-invocation-routing/legacy-cli-transition.md.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/packaging-distribution/runtime-identity-and-activation.md#unheaded-block-41 under docs/platform/packaging-distribution/contracts/release-manifest.md#unheaded-block-17; source context \"Runtime Identity And Activation / 5. ReleaseManifest\", target context \"Contract: Release Manifest / Retained Runtime Identity And Activation Source Detail / 5. ReleaseManifest\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "2c2c843c119b46a01d8e99728f09aa95a1bd650fe7c85276230a0324ccf40265",
    "targetAncestry": [
      "Contract: Release Manifest",
      "Retained Runtime Identity And Activation Source Detail",
      "5. ReleaseManifest"
    ]
  }
}
```

## Entry rationale-619

```json
{
  "entryId": "rationale-619",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s4-packaging-distribution-architecture.json",
  "collection": "claims",
  "claimId": "claim_163988c8973416bdd64781cc7c667f65",
  "before": "Complete Workspace Runtime Model heading and direct-section text retained with heading-depth changes. The workspace-topology link is repointed from docs/architect/workspace-topology.md to docs/platform/system-architecture/architecture/workspace-topology.md; these are different files. Other relative spellings preserve their referents. Carriage does not certify implementation truth.",
  "after": "Source: docs/architect/packaging-distribution/workspace-runtime-model.md:1-1#workspace-runtime-model (current lines); unit SHA256 b40b26ddf0efce28d42470472e5c0ff0ec8976b3a7c2e8793bfd9bfef47c06b0.\nTarget: docs/platform/packaging-distribution/spec.md:425-425#workspace-runtime-model (current lines); unit SHA256 d53ab4e2ea878a02f665cfaa616e61dbd2a988f027669faff34b62bd1834ad2e.\nSource and target unit digests differ.\nTarget changed since last reviewed digest b17cd70e3bb848b985deb966b7c9ffc192142e8f887bfb49d3bf4d76c70efa15 at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 3, target 3; 3 changed spellings/labels, 1 destination changes; 0 added, 0 removed.\nLink 1: \"docs/architect/workspace-topology.md\" (../workspace-topology.md) → \"docs/architect/workspace-topology.md\" (../../architect/workspace-topology.md); resolved docs/architect/workspace-topology.md → docs/architect/workspace-topology.md.\nLink 2: \"docs/platform/packaging-distribution/\" (../../platform/packaging-distribution/README.md) → \"docs/platform/packaging-distribution/\" (README.md); resolved docs/platform/packaging-distribution/README.md → docs/platform/packaging-distribution/README.md.\nLink 3: \"Workspace Topology Architecture\" (../workspace-topology.md) → \"Workspace Topology Architecture\" (../system-architecture/architecture/workspace-topology.md); resolved docs/architect/workspace-topology.md → docs/platform/system-architecture/architecture/workspace-topology.md.\nHeading depth: 1 → 3; title \"Workspace Runtime Model\" → \"Workspace Runtime Model\".\nApplicable labelled corrections:\nL10-26: \"[docs/architect/workspace-topology.md](../system-architecture/architecture/workspace-topology.md)\" → \"[docs/architect/workspace-topology.md](../../architect/workspace-topology.md)\"; evidence step10-round3-doc-edits.json.\nDisposition move: Account for docs/architect/packaging-distribution/workspace-runtime-model.md#workspace-runtime-model under docs/platform/packaging-distribution/spec.md#workspace-runtime-model; source context \"workspace-runtime-model\", target context \"Spec: Packaging-Distribution / Retained Workspace Runtime Model Source Detail\". The source text occurs verbatim inside the bound target section; section-level unit digests differ.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 618,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_163988c8973416bdd64781cc7c667f65",
    "sourceUnitDigest": "b40b26ddf0efce28d42470472e5c0ff0ec8976b3a7c2e8793bfd9bfef47c06b0",
    "targetOwner": "docs/platform/packaging-distribution/spec.md",
    "targetAnchor": "workspace-runtime-model",
    "claimKind": "architecture",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/packaging-distribution/workspace-runtime-model.md:1-1#workspace-runtime-model (current lines); unit SHA256 b40b26ddf0efce28d42470472e5c0ff0ec8976b3a7c2e8793bfd9bfef47c06b0.\nTarget: docs/platform/packaging-distribution/spec.md:425-425#workspace-runtime-model (current lines); unit SHA256 d53ab4e2ea878a02f665cfaa616e61dbd2a988f027669faff34b62bd1834ad2e.\nSource and target unit digests differ.\nTarget changed since last reviewed digest b17cd70e3bb848b985deb966b7c9ffc192142e8f887bfb49d3bf4d76c70efa15 at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 3, target 3; 3 changed spellings/labels, 1 destination changes; 0 added, 0 removed.\nLink 1: \"docs/architect/workspace-topology.md\" (../workspace-topology.md) → \"docs/architect/workspace-topology.md\" (../../architect/workspace-topology.md); resolved docs/architect/workspace-topology.md → docs/architect/workspace-topology.md.\nLink 2: \"docs/platform/packaging-distribution/\" (../../platform/packaging-distribution/README.md) → \"docs/platform/packaging-distribution/\" (README.md); resolved docs/platform/packaging-distribution/README.md → docs/platform/packaging-distribution/README.md.\nLink 3: \"Workspace Topology Architecture\" (../workspace-topology.md) → \"Workspace Topology Architecture\" (../system-architecture/architecture/workspace-topology.md); resolved docs/architect/workspace-topology.md → docs/platform/system-architecture/architecture/workspace-topology.md.\nHeading depth: 1 → 3; title \"Workspace Runtime Model\" → \"Workspace Runtime Model\".\nApplicable labelled corrections:\nL10-26: \"[docs/architect/workspace-topology.md](../system-architecture/architecture/workspace-topology.md)\" → \"[docs/architect/workspace-topology.md](../../architect/workspace-topology.md)\"; evidence step10-round3-doc-edits.json.\nDisposition move: Account for docs/architect/packaging-distribution/workspace-runtime-model.md#workspace-runtime-model under docs/platform/packaging-distribution/spec.md#workspace-runtime-model; source context \"workspace-runtime-model\", target context \"Spec: Packaging-Distribution / Retained Workspace Runtime Model Source Detail\". The source text occurs verbatim inside the bound target section; section-level unit digests differ.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "d53ab4e2ea878a02f665cfaa616e61dbd2a988f027669faff34b62bd1834ad2e",
    "targetAncestry": [
      "Spec: Packaging-Distribution",
      "Retained Workspace Runtime Model Source Detail"
    ]
  }
}
```

## Entry rationale-620

```json
{
  "entryId": "rationale-620",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s4-packaging-distribution-architecture.json",
  "collection": "claims",
  "claimId": "claim_d6701453661c34a2331f9d9bd12ef843",
  "before": "Complete Workspace Runtime Model paragraph retained. The workspace-topology link is repointed from docs/architect/workspace-topology.md to docs/platform/system-architecture/architecture/workspace-topology.md; these are different files. Other relative spellings preserve their referents. Carriage does not certify implementation truth.",
  "after": "Source: docs/architect/packaging-distribution/workspace-runtime-model.md:14-18#unheaded-block-2 (current lines); unit SHA256 4b5c6ec34731f2d032006f5fdd787ef8207452a06456fb639c11a3c1df6c6b39.\nTarget: docs/platform/packaging-distribution/spec.md:438-442#unheaded-block-75 (current lines); unit SHA256 19851b062b9026d35b203683af36c1a27d3cf542f557549831e1e860138dee6a.\nSource and target unit digests differ.\nTarget changed since last reviewed digest 9aefc76daebb502839626d20f26342d459be16ca0412bed1a7d4d3af5dd4ea9c at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 2, target 2; 2 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nLink 1: \"docs/architect/workspace-topology.md\" (../workspace-topology.md) → \"docs/architect/workspace-topology.md\" (../../architect/workspace-topology.md); resolved docs/architect/workspace-topology.md → docs/architect/workspace-topology.md.\nLink 2: \"docs/platform/packaging-distribution/\" (../../platform/packaging-distribution/README.md) → \"docs/platform/packaging-distribution/\" (README.md); resolved docs/platform/packaging-distribution/README.md → docs/platform/packaging-distribution/README.md.\nApplicable labelled corrections:\nL10-26: \"[docs/architect/workspace-topology.md](../system-architecture/architecture/workspace-topology.md)\" → \"[docs/architect/workspace-topology.md](../../architect/workspace-topology.md)\"; evidence step10-round3-doc-edits.json.\nDisposition move: Account for docs/architect/packaging-distribution/workspace-runtime-model.md#unheaded-block-2 under docs/platform/packaging-distribution/spec.md#unheaded-block-75; source context \"Workspace Runtime Model\", target context \"Spec: Packaging-Distribution / Retained Workspace Runtime Model Source Detail / Workspace Runtime Model\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 619,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_d6701453661c34a2331f9d9bd12ef843",
    "sourceUnitDigest": "4b5c6ec34731f2d032006f5fdd787ef8207452a06456fb639c11a3c1df6c6b39",
    "targetOwner": "docs/platform/packaging-distribution/spec.md",
    "targetAnchor": "unheaded-block-75",
    "claimKind": "architecture",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/packaging-distribution/workspace-runtime-model.md:14-18#unheaded-block-2 (current lines); unit SHA256 4b5c6ec34731f2d032006f5fdd787ef8207452a06456fb639c11a3c1df6c6b39.\nTarget: docs/platform/packaging-distribution/spec.md:438-442#unheaded-block-75 (current lines); unit SHA256 19851b062b9026d35b203683af36c1a27d3cf542f557549831e1e860138dee6a.\nSource and target unit digests differ.\nTarget changed since last reviewed digest 9aefc76daebb502839626d20f26342d459be16ca0412bed1a7d4d3af5dd4ea9c at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 2, target 2; 2 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nLink 1: \"docs/architect/workspace-topology.md\" (../workspace-topology.md) → \"docs/architect/workspace-topology.md\" (../../architect/workspace-topology.md); resolved docs/architect/workspace-topology.md → docs/architect/workspace-topology.md.\nLink 2: \"docs/platform/packaging-distribution/\" (../../platform/packaging-distribution/README.md) → \"docs/platform/packaging-distribution/\" (README.md); resolved docs/platform/packaging-distribution/README.md → docs/platform/packaging-distribution/README.md.\nApplicable labelled corrections:\nL10-26: \"[docs/architect/workspace-topology.md](../system-architecture/architecture/workspace-topology.md)\" → \"[docs/architect/workspace-topology.md](../../architect/workspace-topology.md)\"; evidence step10-round3-doc-edits.json.\nDisposition move: Account for docs/architect/packaging-distribution/workspace-runtime-model.md#unheaded-block-2 under docs/platform/packaging-distribution/spec.md#unheaded-block-75; source context \"Workspace Runtime Model\", target context \"Spec: Packaging-Distribution / Retained Workspace Runtime Model Source Detail / Workspace Runtime Model\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "19851b062b9026d35b203683af36c1a27d3cf542f557549831e1e860138dee6a",
    "targetAncestry": [
      "Spec: Packaging-Distribution",
      "Retained Workspace Runtime Model Source Detail",
      "Workspace Runtime Model"
    ]
  }
}
```

## Entry rationale-621

```json
{
  "entryId": "rationale-621",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s4-packaging-distribution-distribution.json",
  "collection": "claims",
  "claimId": "claim_4eeb2f406288458e61bad21531966ab1",
  "before": "A31 / SYNC 59b9b7087: current upstream text carried into its mapped candidate with only disclosed relative-link rebases; existing labelled truth corrections remain. This is a provisional current-source draft from unchanged buildInventoryRow; next package must resolve native identity. No source retirement, authority flip or approval carried. Native identity resolved at 19ca8de23908e161c34c91626e41041b7813167c from the sole native sync. Historical gaps remain separate; no provisional ID is persisted as a decision and no approval carries.",
  "after": "Source: docs/specs/distribution.md:55-55#data-dictionary (current lines); unit SHA256 04f89e98512b5fd7af474ab2abbf362b9a0d30a25b5a911d011037539b3a9d3f.\nTarget: docs/platform/packaging-distribution/spec.md:515-515#data-dictionary (current lines); unit SHA256 3dd2d51fac193d78f712a83b2f0918c9f5f48a0e8eb65572afda4bb678b1de95.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 3dd2d51fac193d78f712a83b2f0918c9f5f48a0e8eb65572afda4bb678b1de95 at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 2 → 4; title \"Data Dictionary\" → \"Data Dictionary\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/specs/distribution.md#data-dictionary under docs/platform/packaging-distribution/spec.md#data-dictionary; source context \"Spec: Distribution\", target context \"Spec: Packaging-Distribution / Retained Distribution Source Detail / Spec: Distribution\". The source text occurs verbatim inside the bound target section; section-level unit digests differ.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 620,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_4eeb2f406288458e61bad21531966ab1",
    "sourcePath": "docs/specs/distribution.md",
    "sourceAnchor": "data-dictionary",
    "sourceUnitDigest": "04f89e98512b5fd7af474ab2abbf362b9a0d30a25b5a911d011037539b3a9d3f",
    "claimKind": "specification",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/specs/distribution.md:55-55#data-dictionary (current lines); unit SHA256 04f89e98512b5fd7af474ab2abbf362b9a0d30a25b5a911d011037539b3a9d3f.\nTarget: docs/platform/packaging-distribution/spec.md:515-515#data-dictionary (current lines); unit SHA256 3dd2d51fac193d78f712a83b2f0918c9f5f48a0e8eb65572afda4bb678b1de95.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 3dd2d51fac193d78f712a83b2f0918c9f5f48a0e8eb65572afda4bb678b1de95 at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 2 → 4; title \"Data Dictionary\" → \"Data Dictionary\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/specs/distribution.md#data-dictionary under docs/platform/packaging-distribution/spec.md#data-dictionary; source context \"Spec: Distribution\", target context \"Spec: Packaging-Distribution / Retained Distribution Source Detail / Spec: Distribution\". The source text occurs verbatim inside the bound target section; section-level unit digests differ.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/packaging-distribution/spec.md",
    "targetAnchor": "data-dictionary",
    "targetUnitDigest": "3dd2d51fac193d78f712a83b2f0918c9f5f48a0e8eb65572afda4bb678b1de95",
    "targetAncestry": [
      "Spec: Packaging-Distribution",
      "Retained Distribution Source Detail",
      "Spec: Distribution"
    ]
  }
}
```

## Entry rationale-622

```json
{
  "entryId": "rationale-622",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s4-packaging-distribution-distribution.json",
  "collection": "registryGaps",
  "claimId": "claim_a26a90f97c6a399a30ce1df9207743b0",
  "before": "A22 actual working target digest/anchor rebound. Full original/current units and decisions in reports/phase-06/step8-final-rework-accounting.json. Pending independent bounded review; no approval carry, source edit, promotion or cutover. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package.",
  "after": "Source: docs/specs/distribution.md:57-73#unheaded-block-5 (historical witness at 7df21d6ca2eceeeefb0d9fbcfc8752964b041941); unit SHA256 648a2fee27dd55616a3ca003e9bb21fc11827ca1947dbf7463dbec2538f113b6.\nTarget: docs/platform/packaging-distribution/spec.md:517-533#unheaded-block-85 (current lines); unit SHA256 59297ed6cac29ae0d34e9f3a48ca0c518e8c06fed5e224ca0182f627ae93839e.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 59297ed6cac29ae0d34e9f3a48ca0c518e8c06fed5e224ca0182f627ae93839e at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/specs/distribution.md#unheaded-block-5 under docs/platform/packaging-distribution/spec.md#unheaded-block-85; source context \"Spec: Distribution / Data Dictionary\", target context \"Spec: Packaging-Distribution / Retained Distribution Source Detail / Spec: Distribution / Data Dictionary\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 621,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_a26a90f97c6a399a30ce1df9207743b0",
    "sourceUnitDigest": "648a2fee27dd55616a3ca003e9bb21fc11827ca1947dbf7463dbec2538f113b6",
    "targetOwner": "docs/platform/packaging-distribution/spec.md",
    "targetAnchor": "unheaded-block-85",
    "claimKind": "specification",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/specs/distribution.md:57-73#unheaded-block-5 (historical witness at 7df21d6ca2eceeeefb0d9fbcfc8752964b041941); unit SHA256 648a2fee27dd55616a3ca003e9bb21fc11827ca1947dbf7463dbec2538f113b6.\nTarget: docs/platform/packaging-distribution/spec.md:517-533#unheaded-block-85 (current lines); unit SHA256 59297ed6cac29ae0d34e9f3a48ca0c518e8c06fed5e224ca0182f627ae93839e.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 59297ed6cac29ae0d34e9f3a48ca0c518e8c06fed5e224ca0182f627ae93839e at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/specs/distribution.md#unheaded-block-5 under docs/platform/packaging-distribution/spec.md#unheaded-block-85; source context \"Spec: Distribution / Data Dictionary\", target context \"Spec: Packaging-Distribution / Retained Distribution Source Detail / Spec: Distribution / Data Dictionary\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "sourcePath": "docs/specs/distribution.md",
    "sourceAnchor": "unheaded-block-5",
    "targetUnitDigest": "59297ed6cac29ae0d34e9f3a48ca0c518e8c06fed5e224ca0182f627ae93839e",
    "targetAncestry": [
      "Spec: Packaging-Distribution",
      "Retained Distribution Source Detail",
      "Spec: Distribution",
      "Data Dictionary"
    ]
  }
}
```

## Entry rationale-623

```json
{
  "entryId": "rationale-623",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s4-packaging-distribution-successors.json",
  "collection": "registryGaps",
  "claimId": "claim_de531cd96f9f92540f16d2ec822dbaf3",
  "before": "A31 main-only text change has this native same-file successor from the upstream diff. Conservation proposal only; no code truth review or identity graft. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package. L10-21: content-based rebind from reviewed prior target unheaded-block-144 (f0b5e6c1688beadf7d5f7bbe985a9b46c27990ea720f3a6bbbe3a8df9806dad3) to unheaded-block-145 (f0b5e6c1688beadf7d5f7bbe985a9b46c27990ea720f3a6bbbe3a8df9806dad3); inserted paragraphs shift the anchor, prior target text is unchanged.",
  "after": "Source: docs/specs/confinement-authority.md:1369-1370#unheaded-block-144 (historical witness at 1f911229f5fb056f3c9c70918a6875dc6cd9334e); unit SHA256 f99e0d4d9f055f630281cd3e3aead0de52d35fd8fa152c8d429bf0af333ca246.\nTarget: docs/specs/confinement-authority.md:1371-1372#unheaded-block-145 (current lines); unit SHA256 f0b5e6c1688beadf7d5f7bbe985a9b46c27990ea720f3a6bbbe3a8df9806dad3.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest f0b5e6c1688beadf7d5f7bbe985a9b46c27990ea720f3a6bbbe3a8df9806dad3 at 1276467f37a99d19aff05808d42fafbf40341449.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/specs/confinement-authority.md#unheaded-block-144 under docs/specs/confinement-authority.md#unheaded-block-145; source context \"Spec: Agent Confinement Authority / 13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items) / 13.2 Login được gia hạn trong private home: bản chép là snapshot, bản mới hơn được ghi ngược\", target context \"Spec: Agent Confinement Authority / 13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items) / 13.2 Login được gia hạn trong private home: bản chép là snapshot, bản mới hơn được ghi ngược\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "pending",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 622,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_de531cd96f9f92540f16d2ec822dbaf3",
    "sourcePath": "docs/specs/confinement-authority.md",
    "sourceUnitDigest": "f99e0d4d9f055f630281cd3e3aead0de52d35fd8fa152c8d429bf0af333ca246",
    "disposition": "supersede",
    "targetOwner": "docs/specs/confinement-authority.md",
    "targetAnchor": "unheaded-block-145",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "pending",
    "rationale": "Source: docs/specs/confinement-authority.md:1369-1370#unheaded-block-144 (historical witness at 1f911229f5fb056f3c9c70918a6875dc6cd9334e); unit SHA256 f99e0d4d9f055f630281cd3e3aead0de52d35fd8fa152c8d429bf0af333ca246.\nTarget: docs/specs/confinement-authority.md:1371-1372#unheaded-block-145 (current lines); unit SHA256 f0b5e6c1688beadf7d5f7bbe985a9b46c27990ea720f3a6bbbe3a8df9806dad3.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest f0b5e6c1688beadf7d5f7bbe985a9b46c27990ea720f3a6bbbe3a8df9806dad3 at 1276467f37a99d19aff05808d42fafbf40341449.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/specs/confinement-authority.md#unheaded-block-144 under docs/specs/confinement-authority.md#unheaded-block-145; source context \"Spec: Agent Confinement Authority / 13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items) / 13.2 Login được gia hạn trong private home: bản chép là snapshot, bản mới hơn được ghi ngược\", target context \"Spec: Agent Confinement Authority / 13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items) / 13.2 Login được gia hạn trong private home: bản chép là snapshot, bản mới hơn được ghi ngược\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "f0b5e6c1688beadf7d5f7bbe985a9b46c27990ea720f3a6bbbe3a8df9806dad3",
    "targetAncestry": [
      "Spec: Agent Confinement Authority",
      "13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)",
      "13.2 Login được gia hạn trong private home: bản chép là snapshot, bản mới hơn được ghi ngược"
    ]
  }
}
```

## Entry rationale-624

```json
{
  "entryId": "rationale-624",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s4-packaging-main-recarry.json",
  "collection": "claims",
  "claimId": "claim_d9185072d68925b4c020b13ba6c4d74f",
  "before": "A31 / SYNC 59b9b7087: current upstream text carried into its mapped candidate with only disclosed relative-link rebases; existing labelled truth corrections remain. This is a provisional current-source draft from unchanged buildInventoryRow; next package must resolve native identity. No source retirement, authority flip or approval carried. Native identity resolved at 19ca8de23908e161c34c91626e41041b7813167c from the sole native sync. Historical gaps remain separate; no provisional ID is persisted as a decision and no approval carries.",
  "after": "Source: docs/specs/distribution.md:57-73#unheaded-block-5 (current lines); unit SHA256 59297ed6cac29ae0d34e9f3a48ca0c518e8c06fed5e224ca0182f627ae93839e.\nTarget: docs/platform/packaging-distribution/spec.md:517-533#unheaded-block-85 (current lines); unit SHA256 59297ed6cac29ae0d34e9f3a48ca0c518e8c06fed5e224ca0182f627ae93839e.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 59297ed6cac29ae0d34e9f3a48ca0c518e8c06fed5e224ca0182f627ae93839e at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/specs/distribution.md#unheaded-block-5 under docs/platform/packaging-distribution/spec.md#unheaded-block-85; source context \"Spec: Distribution / Data Dictionary\", target context \"Spec: Packaging-Distribution / Retained Distribution Source Detail / Spec: Distribution / Data Dictionary\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 623,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_d9185072d68925b4c020b13ba6c4d74f",
    "sourcePath": "docs/specs/distribution.md",
    "sourceAnchor": "unheaded-block-5",
    "sourceUnitDigest": "59297ed6cac29ae0d34e9f3a48ca0c518e8c06fed5e224ca0182f627ae93839e",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/specs/distribution.md:57-73#unheaded-block-5 (current lines); unit SHA256 59297ed6cac29ae0d34e9f3a48ca0c518e8c06fed5e224ca0182f627ae93839e.\nTarget: docs/platform/packaging-distribution/spec.md:517-533#unheaded-block-85 (current lines); unit SHA256 59297ed6cac29ae0d34e9f3a48ca0c518e8c06fed5e224ca0182f627ae93839e.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 59297ed6cac29ae0d34e9f3a48ca0c518e8c06fed5e224ca0182f627ae93839e at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/specs/distribution.md#unheaded-block-5 under docs/platform/packaging-distribution/spec.md#unheaded-block-85; source context \"Spec: Distribution / Data Dictionary\", target context \"Spec: Packaging-Distribution / Retained Distribution Source Detail / Spec: Distribution / Data Dictionary\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/packaging-distribution/spec.md",
    "targetAnchor": "unheaded-block-85",
    "targetUnitDigest": "59297ed6cac29ae0d34e9f3a48ca0c518e8c06fed5e224ca0182f627ae93839e",
    "targetAncestry": [
      "Spec: Packaging-Distribution",
      "Retained Distribution Source Detail",
      "Spec: Distribution",
      "Data Dictionary"
    ]
  }
}
```

## Entry rationale-625

```json
{
  "entryId": "rationale-625",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s5-root-authorities-boundary-gaps.json",
  "collection": "registryGaps",
  "claimId": "claim_970b6ae8bfa6cb7f00a0e4c2d98e4d4d",
  "before": "A22 actual working target digest/anchor rebound. Full original/current units and decisions in reports/phase-06/step8-final-rework-accounting.json. Pending independent bounded review; no approval carry, source edit, promotion or cutover. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package.",
  "after": "Source: docs/platform/packaging-distribution/spec.md:517-533#unheaded-block-85 (historical witness at aa43c29a15bf74c0cd4b6767e28f322a522d29b5); unit SHA256 0ce5ce17cd290a31a55e9a63872f96732a0cd0d096c4aa29693105768629ba90.\nTarget: docs/platform/packaging-distribution/spec.md:517-533#unheaded-block-85 (current lines); unit SHA256 59297ed6cac29ae0d34e9f3a48ca0c518e8c06fed5e224ca0182f627ae93839e.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 59297ed6cac29ae0d34e9f3a48ca0c518e8c06fed5e224ca0182f627ae93839e at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/platform/packaging-distribution/spec.md#unheaded-block-85 under docs/platform/packaging-distribution/spec.md#unheaded-block-85; source context \"Spec: Packaging-Distribution / Retained Distribution Source Detail / Spec: Distribution / Data Dictionary\", target context \"Spec: Packaging-Distribution / Retained Distribution Source Detail / Spec: Distribution / Data Dictionary\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 624,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_970b6ae8bfa6cb7f00a0e4c2d98e4d4d",
    "sourcePath": "docs/platform/packaging-distribution/spec.md",
    "sourceUnitDigest": "0ce5ce17cd290a31a55e9a63872f96732a0cd0d096c4aa29693105768629ba90",
    "disposition": "supersede",
    "targetOwner": "docs/platform/packaging-distribution/spec.md",
    "targetAnchor": "unheaded-block-85",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "pending",
    "rationale": "Source: docs/platform/packaging-distribution/spec.md:517-533#unheaded-block-85 (historical witness at aa43c29a15bf74c0cd4b6767e28f322a522d29b5); unit SHA256 0ce5ce17cd290a31a55e9a63872f96732a0cd0d096c4aa29693105768629ba90.\nTarget: docs/platform/packaging-distribution/spec.md:517-533#unheaded-block-85 (current lines); unit SHA256 59297ed6cac29ae0d34e9f3a48ca0c518e8c06fed5e224ca0182f627ae93839e.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 59297ed6cac29ae0d34e9f3a48ca0c518e8c06fed5e224ca0182f627ae93839e at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/platform/packaging-distribution/spec.md#unheaded-block-85 under docs/platform/packaging-distribution/spec.md#unheaded-block-85; source context \"Spec: Packaging-Distribution / Retained Distribution Source Detail / Spec: Distribution / Data Dictionary\", target context \"Spec: Packaging-Distribution / Retained Distribution Source Detail / Spec: Distribution / Data Dictionary\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "59297ed6cac29ae0d34e9f3a48ca0c518e8c06fed5e224ca0182f627ae93839e",
    "targetAncestry": [
      "Spec: Packaging-Distribution",
      "Retained Distribution Source Detail",
      "Spec: Distribution",
      "Data Dictionary"
    ]
  }
}
```

## Entry rationale-626

```json
{
  "entryId": "rationale-626",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s5-root-authorities-boundary-gaps.json",
  "collection": "registryGaps",
  "claimId": "claim_04703f011b22383992b94545055b9e56",
  "before": "A31 exact upstream/candidate restoration successor: the old native identity gap is conserved by the complete same-file current unit shown in the main/import diff. No guessed identity graft or carried approval; code truth and the future batch source disposition remain separate. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package. L10-21: content-based rebind from reviewed prior target unheaded-block-144 (f0b5e6c1688beadf7d5f7bbe985a9b46c27990ea720f3a6bbbe3a8df9806dad3) to unheaded-block-145 (f0b5e6c1688beadf7d5f7bbe985a9b46c27990ea720f3a6bbbe3a8df9806dad3); inserted paragraphs shift the anchor, prior target text is unchanged.",
  "after": "Source: docs/specs/confinement-authority.md:1369-1370#unheaded-block-144 (historical witness at 8098d7be256c49dc5d5debcfe51e5941520f36ea); unit SHA256 12018d6ddfb98564eca2e0dbd9267ffa859e1e5e69c11db3f506886fa0ab717c.\nTarget: docs/specs/confinement-authority.md:1371-1372#unheaded-block-145 (current lines); unit SHA256 f0b5e6c1688beadf7d5f7bbe985a9b46c27990ea720f3a6bbbe3a8df9806dad3.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest f0b5e6c1688beadf7d5f7bbe985a9b46c27990ea720f3a6bbbe3a8df9806dad3 at 1276467f37a99d19aff05808d42fafbf40341449.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/specs/confinement-authority.md#unheaded-block-144 under docs/specs/confinement-authority.md#unheaded-block-145; source context \"Spec: Agent Confinement Authority / 13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items) / 13.2 Login được gia hạn trong private home: bản chép là snapshot, bản mới hơn được ghi ngược\", target context \"Spec: Agent Confinement Authority / 13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items) / 13.2 Login được gia hạn trong private home: bản chép là snapshot, bản mới hơn được ghi ngược\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "pending",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 625,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_04703f011b22383992b94545055b9e56",
    "sourcePath": "docs/specs/confinement-authority.md",
    "sourceUnitDigest": "12018d6ddfb98564eca2e0dbd9267ffa859e1e5e69c11db3f506886fa0ab717c",
    "disposition": "supersede",
    "targetOwner": "docs/specs/confinement-authority.md",
    "targetAnchor": "unheaded-block-145",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "pending",
    "rationale": "Source: docs/specs/confinement-authority.md:1369-1370#unheaded-block-144 (historical witness at 8098d7be256c49dc5d5debcfe51e5941520f36ea); unit SHA256 12018d6ddfb98564eca2e0dbd9267ffa859e1e5e69c11db3f506886fa0ab717c.\nTarget: docs/specs/confinement-authority.md:1371-1372#unheaded-block-145 (current lines); unit SHA256 f0b5e6c1688beadf7d5f7bbe985a9b46c27990ea720f3a6bbbe3a8df9806dad3.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest f0b5e6c1688beadf7d5f7bbe985a9b46c27990ea720f3a6bbbe3a8df9806dad3 at 1276467f37a99d19aff05808d42fafbf40341449.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/specs/confinement-authority.md#unheaded-block-144 under docs/specs/confinement-authority.md#unheaded-block-145; source context \"Spec: Agent Confinement Authority / 13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items) / 13.2 Login được gia hạn trong private home: bản chép là snapshot, bản mới hơn được ghi ngược\", target context \"Spec: Agent Confinement Authority / 13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items) / 13.2 Login được gia hạn trong private home: bản chép là snapshot, bản mới hơn được ghi ngược\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "f0b5e6c1688beadf7d5f7bbe985a9b46c27990ea720f3a6bbbe3a8df9806dad3",
    "targetAncestry": [
      "Spec: Agent Confinement Authority",
      "13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)",
      "13.2 Login được gia hạn trong private home: bản chép là snapshot, bản mới hơn được ghi ngược"
    ]
  }
}
```

## Entry rationale-627

```json
{
  "entryId": "rationale-627",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s5-root-authorities-boundary-gaps.json",
  "collection": "registryGaps",
  "claimId": "claim_f2f1dadddff0c5440195d8c00b74d56e",
  "before": "A31 exact upstream/candidate restoration successor: the old native identity gap is conserved by the complete same-file current unit shown in the main/import diff. No guessed identity graft or carried approval; code truth and the future batch source disposition remain separate. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package.",
  "after": "Source: docs/specs/distribution.md:57-73#unheaded-block-5 (historical witness at 806d8946b75eca7a862b3207b50081e2c2f44414); unit SHA256 0ce5ce17cd290a31a55e9a63872f96732a0cd0d096c4aa29693105768629ba90.\nTarget: docs/specs/distribution.md:57-73#unheaded-block-5 (current lines); unit SHA256 59297ed6cac29ae0d34e9f3a48ca0c518e8c06fed5e224ca0182f627ae93839e.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 59297ed6cac29ae0d34e9f3a48ca0c518e8c06fed5e224ca0182f627ae93839e at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/specs/distribution.md#unheaded-block-5 under docs/specs/distribution.md#unheaded-block-5; source context \"Spec: Distribution / Data Dictionary\", target context \"Spec: Distribution / Data Dictionary\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 626,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_f2f1dadddff0c5440195d8c00b74d56e",
    "sourcePath": "docs/specs/distribution.md",
    "sourceUnitDigest": "0ce5ce17cd290a31a55e9a63872f96732a0cd0d096c4aa29693105768629ba90",
    "disposition": "supersede",
    "targetOwner": "docs/specs/distribution.md",
    "targetAnchor": "unheaded-block-5",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "pending",
    "rationale": "Source: docs/specs/distribution.md:57-73#unheaded-block-5 (historical witness at 806d8946b75eca7a862b3207b50081e2c2f44414); unit SHA256 0ce5ce17cd290a31a55e9a63872f96732a0cd0d096c4aa29693105768629ba90.\nTarget: docs/specs/distribution.md:57-73#unheaded-block-5 (current lines); unit SHA256 59297ed6cac29ae0d34e9f3a48ca0c518e8c06fed5e224ca0182f627ae93839e.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 59297ed6cac29ae0d34e9f3a48ca0c518e8c06fed5e224ca0182f627ae93839e at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/specs/distribution.md#unheaded-block-5 under docs/specs/distribution.md#unheaded-block-5; source context \"Spec: Distribution / Data Dictionary\", target context \"Spec: Distribution / Data Dictionary\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "59297ed6cac29ae0d34e9f3a48ca0c518e8c06fed5e224ca0182f627ae93839e",
    "targetAncestry": [
      "Spec: Distribution",
      "Data Dictionary"
    ]
  }
}
```

## Entry rationale-628

```json
{
  "entryId": "rationale-628",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s5-root-authorities-governance.json",
  "collection": "claims",
  "claimId": "claim_66f7be3b79ca1fe458ce0416ba1adf89",
  "before": "Whole Related Files section retained, with nine relative link adjustments. Three destinations are repointed to candidate carriers: docs/README.md to docs/platform/documentation/operations/portals/docs-portal.md; docs/transitional-switchboard.md to docs/platform/documentation/switchboard.md; the platform portal to docs/platform/README.md. These repoints do not retain the legacy portal destinations. Other link spellings preserve their repository referents. No authority flip or current-truth approval.",
  "after": "Source: docs/doc-governance.md:466-466#14-related-files (current lines); unit SHA256 b94c5cec93998f88a549a7613a90fbb1c4f111181aacf0faffc469528603bf9f.\nTarget: docs/platform/governance.md:467-467#14-related-files (current lines); unit SHA256 12cc18517f23da3cdd1de3e0a0090371e92f19fce30063363466eb6fdea56cb6.\nSource and target unit digests differ.\nTarget changed since last reviewed digest 1b5703ab9905bb5b86c289e9b6474f95cb2313ac563451919595515af5f1000c at 2300d65571968bb3bcb80123a273272586e3f1db.\nLinks: source 6, target 6; 6 changed spellings/labels, 2 destination changes; 0 added, 0 removed.\nLink 1: \"README.md\" (README.md) → \"README.md\" (documentation/operations/portals/docs-portal.md); resolved docs/README.md → docs/platform/documentation/operations/portals/docs-portal.md.\nLink 2: \"reading-map.md\" (reading-map.md) → \"reading-map.md\" (../reading-map.md); resolved docs/reading-map.md → docs/reading-map.md.\nLink 3: \"transitional-switchboard.md\" (transitional-switchboard.md) → \"transitional-switchboard.md\" (documentation/switchboard.md); resolved docs/transitional-switchboard.md → docs/platform/documentation/switchboard.md.\nLink 4: \"platform/migration-authoring-rules.md\" (platform/migration-authoring-rules.md) → \"platform/migration-authoring-rules.md\" (migration-authoring-rules.md); resolved docs/platform/migration-authoring-rules.md → docs/platform/migration-authoring-rules.md.\nLink 5: \"platform/README.md\" (platform/README.md) → \"platform/README.md\" (README.md); resolved docs/platform/README.md → docs/platform/README.md.\nLink 6: \"architect/documentation-system-design.md\" (architect/documentation-system-design.md) → \"architect/documentation-system-design.md\" (../architect/documentation-system-design.md); resolved docs/architect/documentation-system-design.md → docs/architect/documentation-system-design.md.\nHeading depth: 2 → 2; title \"14. Related Files\" → \"14. Related Files\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/doc-governance.md#14-related-files under docs/platform/governance.md#14-related-files; source context \"Documentation Governance\", target context \"Documentation Governance\". The source text occurs verbatim inside the bound target section; section-level unit digests differ.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "pending",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 627,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_66f7be3b79ca1fe458ce0416ba1adf89",
    "sourceUnitDigest": "b94c5cec93998f88a549a7613a90fbb1c4f111181aacf0faffc469528603bf9f",
    "targetOwner": "docs/platform/governance.md",
    "targetAnchor": "14-related-files",
    "claimKind": "contract",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/doc-governance.md:466-466#14-related-files (current lines); unit SHA256 b94c5cec93998f88a549a7613a90fbb1c4f111181aacf0faffc469528603bf9f.\nTarget: docs/platform/governance.md:467-467#14-related-files (current lines); unit SHA256 12cc18517f23da3cdd1de3e0a0090371e92f19fce30063363466eb6fdea56cb6.\nSource and target unit digests differ.\nTarget changed since last reviewed digest 1b5703ab9905bb5b86c289e9b6474f95cb2313ac563451919595515af5f1000c at 2300d65571968bb3bcb80123a273272586e3f1db.\nLinks: source 6, target 6; 6 changed spellings/labels, 2 destination changes; 0 added, 0 removed.\nLink 1: \"README.md\" (README.md) → \"README.md\" (documentation/operations/portals/docs-portal.md); resolved docs/README.md → docs/platform/documentation/operations/portals/docs-portal.md.\nLink 2: \"reading-map.md\" (reading-map.md) → \"reading-map.md\" (../reading-map.md); resolved docs/reading-map.md → docs/reading-map.md.\nLink 3: \"transitional-switchboard.md\" (transitional-switchboard.md) → \"transitional-switchboard.md\" (documentation/switchboard.md); resolved docs/transitional-switchboard.md → docs/platform/documentation/switchboard.md.\nLink 4: \"platform/migration-authoring-rules.md\" (platform/migration-authoring-rules.md) → \"platform/migration-authoring-rules.md\" (migration-authoring-rules.md); resolved docs/platform/migration-authoring-rules.md → docs/platform/migration-authoring-rules.md.\nLink 5: \"platform/README.md\" (platform/README.md) → \"platform/README.md\" (README.md); resolved docs/platform/README.md → docs/platform/README.md.\nLink 6: \"architect/documentation-system-design.md\" (architect/documentation-system-design.md) → \"architect/documentation-system-design.md\" (../architect/documentation-system-design.md); resolved docs/architect/documentation-system-design.md → docs/architect/documentation-system-design.md.\nHeading depth: 2 → 2; title \"14. Related Files\" → \"14. Related Files\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/doc-governance.md#14-related-files under docs/platform/governance.md#14-related-files; source context \"Documentation Governance\", target context \"Documentation Governance\". The source text occurs verbatim inside the bound target section; section-level unit digests differ.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "12cc18517f23da3cdd1de3e0a0090371e92f19fce30063363466eb6fdea56cb6",
    "targetAncestry": [
      "Documentation Governance"
    ]
  }
}
```

## Entry rationale-629

```json
{
  "entryId": "rationale-629",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s5-root-authorities-governance.json",
  "collection": "claims",
  "claimId": "claim_5f99956630d0cb78499c2a3542d2e5e3",
  "before": "Whole Related Files table retained, with nine relative link adjustments. Three destinations are repointed to candidate carriers: docs/README.md to docs/platform/documentation/operations/portals/docs-portal.md; docs/transitional-switchboard.md to docs/platform/documentation/switchboard.md; the platform portal to docs/platform/README.md. These repoints do not retain the legacy portal destinations. Other link spellings preserve their repository referents. No authority flip or current-truth approval.",
  "after": "Source: docs/doc-governance.md:468-475#unheaded-block-60 (current lines); unit SHA256 f42764566cc00268ec5f1cf4ab8d130764ffe3dc3a367881640633c3c876b083.\nTarget: docs/platform/governance.md:469-476#unheaded-block-60 (current lines); unit SHA256 f389738a959bded8d713ae3139c654c123eed5d9a93ae8b439562d84aca629ae.\nSource and target unit digests differ.\nTarget changed since last reviewed digest 32b40e383cb5cb41ff5b61f312d99116278ddac6728391109adbd1f7f891c4ba at 2300d65571968bb3bcb80123a273272586e3f1db.\nLinks: source 6, target 6; 6 changed spellings/labels, 2 destination changes; 0 added, 0 removed.\nLink 1: \"README.md\" (README.md) → \"README.md\" (documentation/operations/portals/docs-portal.md); resolved docs/README.md → docs/platform/documentation/operations/portals/docs-portal.md.\nLink 2: \"reading-map.md\" (reading-map.md) → \"reading-map.md\" (../reading-map.md); resolved docs/reading-map.md → docs/reading-map.md.\nLink 3: \"transitional-switchboard.md\" (transitional-switchboard.md) → \"transitional-switchboard.md\" (documentation/switchboard.md); resolved docs/transitional-switchboard.md → docs/platform/documentation/switchboard.md.\nLink 4: \"platform/migration-authoring-rules.md\" (platform/migration-authoring-rules.md) → \"platform/migration-authoring-rules.md\" (migration-authoring-rules.md); resolved docs/platform/migration-authoring-rules.md → docs/platform/migration-authoring-rules.md.\nLink 5: \"platform/README.md\" (platform/README.md) → \"platform/README.md\" (README.md); resolved docs/platform/README.md → docs/platform/README.md.\nLink 6: \"architect/documentation-system-design.md\" (architect/documentation-system-design.md) → \"architect/documentation-system-design.md\" (../architect/documentation-system-design.md); resolved docs/architect/documentation-system-design.md → docs/architect/documentation-system-design.md.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/doc-governance.md#unheaded-block-60 under docs/platform/governance.md#unheaded-block-60; source context \"Documentation Governance / 14. Related Files\", target context \"Documentation Governance / 14. Related Files\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "pending",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 628,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_5f99956630d0cb78499c2a3542d2e5e3",
    "sourceUnitDigest": "f42764566cc00268ec5f1cf4ab8d130764ffe3dc3a367881640633c3c876b083",
    "targetOwner": "docs/platform/governance.md",
    "targetAnchor": "unheaded-block-60",
    "claimKind": "contract",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/doc-governance.md:468-475#unheaded-block-60 (current lines); unit SHA256 f42764566cc00268ec5f1cf4ab8d130764ffe3dc3a367881640633c3c876b083.\nTarget: docs/platform/governance.md:469-476#unheaded-block-60 (current lines); unit SHA256 f389738a959bded8d713ae3139c654c123eed5d9a93ae8b439562d84aca629ae.\nSource and target unit digests differ.\nTarget changed since last reviewed digest 32b40e383cb5cb41ff5b61f312d99116278ddac6728391109adbd1f7f891c4ba at 2300d65571968bb3bcb80123a273272586e3f1db.\nLinks: source 6, target 6; 6 changed spellings/labels, 2 destination changes; 0 added, 0 removed.\nLink 1: \"README.md\" (README.md) → \"README.md\" (documentation/operations/portals/docs-portal.md); resolved docs/README.md → docs/platform/documentation/operations/portals/docs-portal.md.\nLink 2: \"reading-map.md\" (reading-map.md) → \"reading-map.md\" (../reading-map.md); resolved docs/reading-map.md → docs/reading-map.md.\nLink 3: \"transitional-switchboard.md\" (transitional-switchboard.md) → \"transitional-switchboard.md\" (documentation/switchboard.md); resolved docs/transitional-switchboard.md → docs/platform/documentation/switchboard.md.\nLink 4: \"platform/migration-authoring-rules.md\" (platform/migration-authoring-rules.md) → \"platform/migration-authoring-rules.md\" (migration-authoring-rules.md); resolved docs/platform/migration-authoring-rules.md → docs/platform/migration-authoring-rules.md.\nLink 5: \"platform/README.md\" (platform/README.md) → \"platform/README.md\" (README.md); resolved docs/platform/README.md → docs/platform/README.md.\nLink 6: \"architect/documentation-system-design.md\" (architect/documentation-system-design.md) → \"architect/documentation-system-design.md\" (../architect/documentation-system-design.md); resolved docs/architect/documentation-system-design.md → docs/architect/documentation-system-design.md.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/doc-governance.md#unheaded-block-60 under docs/platform/governance.md#unheaded-block-60; source context \"Documentation Governance / 14. Related Files\", target context \"Documentation Governance / 14. Related Files\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "f389738a959bded8d713ae3139c654c123eed5d9a93ae8b439562d84aca629ae",
    "targetAncestry": [
      "Documentation Governance",
      "14. Related Files"
    ]
  }
}
```

## Entry rationale-630

```json
{
  "entryId": "rationale-630",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s5-root-authorities-sc1-gaps.json",
  "collection": "registryGaps",
  "claimId": "claim_4a023fa2faa879fb0e1dfd8bc5c051e7",
  "before": "A22 actual working target digest/anchor rebound. Full original/current units and decisions in reports/phase-06/step8-final-rework-accounting.json. Pending independent bounded review; no approval carry, source edit, promotion or cutover. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package. L10-21: content-based rebind from reviewed prior target unheaded-block-33 (0b3d8cfa5bd06f2dc735968a1297d8567d8f78a6257cf8aed0b0611067e870a2) to unheaded-block-34 (0b3d8cfa5bd06f2dc735968a1297d8567d8f78a6257cf8aed0b0611067e870a2); inserted paragraphs shift the anchor, prior target text is unchanged.",
  "after": "Source: docs/platform/work-state/contracts/cli-io-contract.md:269-279#unheaded-block-31 (historical witness at 9881f8622732e3ba7c8e203097d42674b8aba36d); unit SHA256 857ad2167a0283ad4b9f08a4493f324f899b84211e10234b9d0eddfb9683c63f.\nTarget: docs/platform/work-state/contracts/cli-io-contract.md:310-320#unheaded-block-34 (current lines); unit SHA256 0b3d8cfa5bd06f2dc735968a1297d8567d8f78a6257cf8aed0b0611067e870a2.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 0b3d8cfa5bd06f2dc735968a1297d8567d8f78a6257cf8aed0b0611067e870a2 at 7854cff84d8bcb67075d4f9c09cd0b6d04808ff4.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-31 under docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-34; source context \"CLI I/O Contract / 7. Machine-Readable Verb Registry / Entry Fields And Effect Axes\", target context \"CLI I/O Contract / 7. Machine-Readable Verb Registry / Entry Fields And Effect Axes\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "pending",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 629,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_4a023fa2faa879fb0e1dfd8bc5c051e7",
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "sourceUnitDigest": "857ad2167a0283ad4b9f08a4493f324f899b84211e10234b9d0eddfb9683c63f",
    "disposition": "supersede",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-34",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "pending",
    "rationale": "Source: docs/platform/work-state/contracts/cli-io-contract.md:269-279#unheaded-block-31 (historical witness at 9881f8622732e3ba7c8e203097d42674b8aba36d); unit SHA256 857ad2167a0283ad4b9f08a4493f324f899b84211e10234b9d0eddfb9683c63f.\nTarget: docs/platform/work-state/contracts/cli-io-contract.md:310-320#unheaded-block-34 (current lines); unit SHA256 0b3d8cfa5bd06f2dc735968a1297d8567d8f78a6257cf8aed0b0611067e870a2.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 0b3d8cfa5bd06f2dc735968a1297d8567d8f78a6257cf8aed0b0611067e870a2 at 7854cff84d8bcb67075d4f9c09cd0b6d04808ff4.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-31 under docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-34; source context \"CLI I/O Contract / 7. Machine-Readable Verb Registry / Entry Fields And Effect Axes\", target context \"CLI I/O Contract / 7. Machine-Readable Verb Registry / Entry Fields And Effect Axes\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "0b3d8cfa5bd06f2dc735968a1297d8567d8f78a6257cf8aed0b0611067e870a2",
    "targetAncestry": [
      "CLI I/O Contract",
      "7. Machine-Readable Verb Registry",
      "Entry Fields And Effect Axes"
    ]
  }
}
```

## Entry rationale-631

```json
{
  "entryId": "rationale-631",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s5-root-authorities-sc1-gaps.json",
  "collection": "registryGaps",
  "claimId": "claim_7333c439fa8d29886b82168e015ca113",
  "before": "A22 actual working target digest/anchor rebound. Full original/current units and decisions in reports/phase-06/step8-final-rework-accounting.json. Pending independent bounded review; no approval carry, source edit, promotion or cutover. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package. L10-21: content-based rebind from reviewed prior target unheaded-block-33 (0b3d8cfa5bd06f2dc735968a1297d8567d8f78a6257cf8aed0b0611067e870a2) to unheaded-block-34 (0b3d8cfa5bd06f2dc735968a1297d8567d8f78a6257cf8aed0b0611067e870a2); inserted paragraphs shift the anchor, prior target text is unchanged.",
  "after": "Source: docs/platform/work-state/contracts/cli-io-contract.md:269-279#unheaded-block-31 (historical witness at 977509d5f8c49a31c781b54ea53c2b3617f70a13); unit SHA256 97e661532202da60735c985f4cda6302e805d100441b148cd8b0ff05c9c914b2.\nTarget: docs/platform/work-state/contracts/cli-io-contract.md:310-320#unheaded-block-34 (current lines); unit SHA256 0b3d8cfa5bd06f2dc735968a1297d8567d8f78a6257cf8aed0b0611067e870a2.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 0b3d8cfa5bd06f2dc735968a1297d8567d8f78a6257cf8aed0b0611067e870a2 at 7854cff84d8bcb67075d4f9c09cd0b6d04808ff4.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-31 under docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-34; source context \"CLI I/O Contract / 7. Machine-Readable Verb Registry / Entry Fields And Effect Axes\", target context \"CLI I/O Contract / 7. Machine-Readable Verb Registry / Entry Fields And Effect Axes\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "pending",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 630,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_7333c439fa8d29886b82168e015ca113",
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "sourceUnitDigest": "97e661532202da60735c985f4cda6302e805d100441b148cd8b0ff05c9c914b2",
    "disposition": "supersede",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-34",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "pending",
    "rationale": "Source: docs/platform/work-state/contracts/cli-io-contract.md:269-279#unheaded-block-31 (historical witness at 977509d5f8c49a31c781b54ea53c2b3617f70a13); unit SHA256 97e661532202da60735c985f4cda6302e805d100441b148cd8b0ff05c9c914b2.\nTarget: docs/platform/work-state/contracts/cli-io-contract.md:310-320#unheaded-block-34 (current lines); unit SHA256 0b3d8cfa5bd06f2dc735968a1297d8567d8f78a6257cf8aed0b0611067e870a2.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 0b3d8cfa5bd06f2dc735968a1297d8567d8f78a6257cf8aed0b0611067e870a2 at 7854cff84d8bcb67075d4f9c09cd0b6d04808ff4.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-31 under docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-34; source context \"CLI I/O Contract / 7. Machine-Readable Verb Registry / Entry Fields And Effect Axes\", target context \"CLI I/O Contract / 7. Machine-Readable Verb Registry / Entry Fields And Effect Axes\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "0b3d8cfa5bd06f2dc735968a1297d8567d8f78a6257cf8aed0b0611067e870a2",
    "targetAncestry": [
      "CLI I/O Contract",
      "7. Machine-Readable Verb Registry",
      "Entry Fields And Effect Axes"
    ]
  }
}
```

## Entry rationale-632

```json
{
  "entryId": "rationale-632",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s5-root-authorities-sc1-gaps.json",
  "collection": "registryGaps",
  "claimId": "claim_665eb7f4bfb9bee7ba3f5e58368eaba1",
  "before": "The native predecessor docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-32 at 01fe216b4 is superseded by the complete same-file effect-axis unit. It preserves the field definitions, review/--github rationale where present, every list item and the external dispatch qualifier, adds explicit COMMAND_REGISTRY/15/no-coordination manifest wording, and keeps the valid review/approve/run examples. Whole source and target are shown; no identity graft or approval carry. Corrected binding: the successor is the bullets unit unheaded-block-34 (name, touchesState, externalEffect, paginated and subcommands), not the paragraph at unheaded-block-33. The old stored anchor/digest pair was inconsistent; no identity is grafted and no approval is carried. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package. L10-21: content-based rebind from reviewed prior target unheaded-block-34 (e013c5b05d6ff58782aa8231ab4a55967bd5ef853dac4015aec8f16f5fcf9c68) to unheaded-block-35 (e013c5b05d6ff58782aa8231ab4a55967bd5ef853dac4015aec8f16f5fcf9c68); inserted paragraphs shift the anchor, prior target text is unchanged.",
  "after": "Source: docs/platform/work-state/contracts/cli-io-contract.md:281-291#unheaded-block-32 (historical witness at 977509d5f8c49a31c781b54ea53c2b3617f70a13); unit SHA256 ba9c9d6e641e3049b46d0596077eabd74593dd83e12391cd7336986f7733d796.\nTarget: docs/platform/work-state/contracts/cli-io-contract.md:322-336#unheaded-block-35 (current lines); unit SHA256 e013c5b05d6ff58782aa8231ab4a55967bd5ef853dac4015aec8f16f5fcf9c68.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest e013c5b05d6ff58782aa8231ab4a55967bd5ef853dac4015aec8f16f5fcf9c68 at 7854cff84d8bcb67075d4f9c09cd0b6d04808ff4.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-32 under docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-35; source context \"CLI I/O Contract / 7. Machine-Readable Verb Registry / Entry Fields And Effect Axes\", target context \"CLI I/O Contract / 7. Machine-Readable Verb Registry / Entry Fields And Effect Axes\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "pending",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 631,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_665eb7f4bfb9bee7ba3f5e58368eaba1",
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "sourceUnitDigest": "ba9c9d6e641e3049b46d0596077eabd74593dd83e12391cd7336986f7733d796",
    "disposition": "supersede",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-35",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "pending",
    "rationale": "Source: docs/platform/work-state/contracts/cli-io-contract.md:281-291#unheaded-block-32 (historical witness at 977509d5f8c49a31c781b54ea53c2b3617f70a13); unit SHA256 ba9c9d6e641e3049b46d0596077eabd74593dd83e12391cd7336986f7733d796.\nTarget: docs/platform/work-state/contracts/cli-io-contract.md:322-336#unheaded-block-35 (current lines); unit SHA256 e013c5b05d6ff58782aa8231ab4a55967bd5ef853dac4015aec8f16f5fcf9c68.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest e013c5b05d6ff58782aa8231ab4a55967bd5ef853dac4015aec8f16f5fcf9c68 at 7854cff84d8bcb67075d4f9c09cd0b6d04808ff4.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-32 under docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-35; source context \"CLI I/O Contract / 7. Machine-Readable Verb Registry / Entry Fields And Effect Axes\", target context \"CLI I/O Contract / 7. Machine-Readable Verb Registry / Entry Fields And Effect Axes\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "e013c5b05d6ff58782aa8231ab4a55967bd5ef853dac4015aec8f16f5fcf9c68",
    "targetAncestry": [
      "CLI I/O Contract",
      "7. Machine-Readable Verb Registry",
      "Entry Fields And Effect Axes"
    ]
  }
}
```

## Entry rationale-633

```json
{
  "entryId": "rationale-633",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s5-root-authorities-sc1-gaps.json",
  "collection": "registryGaps",
  "claimId": "claim_e597b776163803dcf6e4194962ea4f6e",
  "before": "The predecessor block 32 at 9881f8622 already states COMMAND_REGISTRY, 15 externalEffect verbs and no coordination. The successor adds two deltas: the review/approve/run examples and the whole subcommands bullet (three lines), which the source never had. The other source field definitions, paginated/multiValueFormat bullet and dispatch executor qualifier are retained, with line reflow. Corrected binding remains the same-file bullets unit unheaded-block-34 (name, touchesState, externalEffect, paginated and subcommands), digest e013c5b05d6ff58782aa8231ab4a55967bd5ef853dac4015aec8f16f5fcf9c68; paragraph unheaded-block-33 was an inconsistent earlier binding. Native predecessor identity is conserved without graft or approval carry. Pending independent rationale re-review. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package. L10-21: content-based rebind from reviewed prior target unheaded-block-34 (e013c5b05d6ff58782aa8231ab4a55967bd5ef853dac4015aec8f16f5fcf9c68) to unheaded-block-35 (e013c5b05d6ff58782aa8231ab4a55967bd5ef853dac4015aec8f16f5fcf9c68); inserted paragraphs shift the anchor, prior target text is unchanged.",
  "after": "Source: docs/platform/work-state/contracts/cli-io-contract.md:281-291#unheaded-block-32 (historical witness at 9881f8622732e3ba7c8e203097d42674b8aba36d); unit SHA256 5bed5c61440ab7ef0a9c595d18e3485c47c1952c78cbd07a0ea354db8ad750c3.\nTarget: docs/platform/work-state/contracts/cli-io-contract.md:322-336#unheaded-block-35 (current lines); unit SHA256 e013c5b05d6ff58782aa8231ab4a55967bd5ef853dac4015aec8f16f5fcf9c68.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest e013c5b05d6ff58782aa8231ab4a55967bd5ef853dac4015aec8f16f5fcf9c68 at 7854cff84d8bcb67075d4f9c09cd0b6d04808ff4.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-32 under docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-35; source context \"CLI I/O Contract / 7. Machine-Readable Verb Registry / Entry Fields And Effect Axes\", target context \"CLI I/O Contract / 7. Machine-Readable Verb Registry / Entry Fields And Effect Axes\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "pending",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 632,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_e597b776163803dcf6e4194962ea4f6e",
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "sourceUnitDigest": "5bed5c61440ab7ef0a9c595d18e3485c47c1952c78cbd07a0ea354db8ad750c3",
    "disposition": "supersede",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-35",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "pending",
    "rationale": "Source: docs/platform/work-state/contracts/cli-io-contract.md:281-291#unheaded-block-32 (historical witness at 9881f8622732e3ba7c8e203097d42674b8aba36d); unit SHA256 5bed5c61440ab7ef0a9c595d18e3485c47c1952c78cbd07a0ea354db8ad750c3.\nTarget: docs/platform/work-state/contracts/cli-io-contract.md:322-336#unheaded-block-35 (current lines); unit SHA256 e013c5b05d6ff58782aa8231ab4a55967bd5ef853dac4015aec8f16f5fcf9c68.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest e013c5b05d6ff58782aa8231ab4a55967bd5ef853dac4015aec8f16f5fcf9c68 at 7854cff84d8bcb67075d4f9c09cd0b6d04808ff4.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-32 under docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-35; source context \"CLI I/O Contract / 7. Machine-Readable Verb Registry / Entry Fields And Effect Axes\", target context \"CLI I/O Contract / 7. Machine-Readable Verb Registry / Entry Fields And Effect Axes\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "e013c5b05d6ff58782aa8231ab4a55967bd5ef853dac4015aec8f16f5fcf9c68",
    "targetAncestry": [
      "CLI I/O Contract",
      "7. Machine-Readable Verb Registry",
      "Entry Fields And Effect Axes"
    ]
  }
}
```

## Entry rationale-634

```json
{
  "entryId": "rationale-634",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s5-root-boundary-sync.json",
  "collection": "claims",
  "claimId": "claim_cbc7ad17e0764ac8d1d4d386e3b62e74",
  "before": "A22 actual working target digest/anchor rebound. Full original/current units and decisions in reports/phase-06/step8-final-rework-accounting.json. Pending independent bounded review; no approval carry, source edit, promotion or cutover. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package. L10-21: content-based rebind from reviewed prior target unheaded-block-32 (51dd3c8aa026a8f5a15e4c12c522b3bf2ad7c29238c49bf9ba51324806e10e23) to unheaded-block-33 (51dd3c8aa026a8f5a15e4c12c522b3bf2ad7c29238c49bf9ba51324806e10e23); inserted paragraphs shift the anchor, prior target text is unchanged.",
  "after": "Source: docs/io-contract.md:136-143#unheaded-block-20 (current lines); unit SHA256 51dd3c8aa026a8f5a15e4c12c522b3bf2ad7c29238c49bf9ba51324806e10e23.\nTarget: docs/platform/work-state/contracts/cli-io-contract.md:299-306#unheaded-block-33 (current lines); unit SHA256 51dd3c8aa026a8f5a15e4c12c522b3bf2ad7c29238c49bf9ba51324806e10e23.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 51dd3c8aa026a8f5a15e4c12c522b3bf2ad7c29238c49bf9ba51324806e10e23 at 7854cff84d8bcb67075d4f9c09cd0b6d04808ff4.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/io-contract.md#unheaded-block-20 under docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-33; source context \"Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner` / Sổ verb máy-đọc — CLI tự mô tả\", target context \"CLI I/O Contract / 7. Machine-Readable Verb Registry / Manifest Shape\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "pending",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 633,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_cbc7ad17e0764ac8d1d4d386e3b62e74",
    "sourceUnitDigest": "51dd3c8aa026a8f5a15e4c12c522b3bf2ad7c29238c49bf9ba51324806e10e23",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-33",
    "claimKind": "contract",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "rationale": "Source: docs/io-contract.md:136-143#unheaded-block-20 (current lines); unit SHA256 51dd3c8aa026a8f5a15e4c12c522b3bf2ad7c29238c49bf9ba51324806e10e23.\nTarget: docs/platform/work-state/contracts/cli-io-contract.md:299-306#unheaded-block-33 (current lines); unit SHA256 51dd3c8aa026a8f5a15e4c12c522b3bf2ad7c29238c49bf9ba51324806e10e23.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 51dd3c8aa026a8f5a15e4c12c522b3bf2ad7c29238c49bf9ba51324806e10e23 at 7854cff84d8bcb67075d4f9c09cd0b6d04808ff4.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/io-contract.md#unheaded-block-20 under docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-33; source context \"Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner` / Sổ verb máy-đọc — CLI tự mô tả\", target context \"CLI I/O Contract / 7. Machine-Readable Verb Registry / Manifest Shape\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "targetUnitDigest": "51dd3c8aa026a8f5a15e4c12c522b3bf2ad7c29238c49bf9ba51324806e10e23",
    "targetAncestry": [
      "CLI I/O Contract",
      "7. Machine-Readable Verb Registry",
      "Manifest Shape"
    ]
  }
}
```

## Entry rationale-635

```json
{
  "entryId": "rationale-635",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s5-root-boundary-sync.json",
  "collection": "claims",
  "claimId": "claim_b8fa7fa2cd614433de754bbb92302140",
  "before": "A22 actual working target digest/anchor rebound. Full original/current units and decisions in reports/phase-06/step8-final-rework-accounting.json. Pending independent bounded review; no approval carry, source edit, promotion or cutover. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package. L10-21: content-based rebind from reviewed prior target unheaded-block-34 (e013c5b05d6ff58782aa8231ab4a55967bd5ef853dac4015aec8f16f5fcf9c68) to unheaded-block-35 (e013c5b05d6ff58782aa8231ab4a55967bd5ef853dac4015aec8f16f5fcf9c68); inserted paragraphs shift the anchor, prior target text is unchanged.",
  "after": "Source: docs/io-contract.md:145-158#unheaded-block-21 (current lines); unit SHA256 d08ac6f65427df6334f383a722e80ed4640fc93af7693c530ce2265d7262fcb7.\nTarget: docs/platform/work-state/contracts/cli-io-contract.md:322-336#unheaded-block-35 (current lines); unit SHA256 e013c5b05d6ff58782aa8231ab4a55967bd5ef853dac4015aec8f16f5fcf9c68.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest e013c5b05d6ff58782aa8231ab4a55967bd5ef853dac4015aec8f16f5fcf9c68 at 7854cff84d8bcb67075d4f9c09cd0b6d04808ff4.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/io-contract.md#unheaded-block-21 under docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-35; source context \"Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner` / Sổ verb máy-đọc — CLI tự mô tả\", target context \"CLI I/O Contract / 7. Machine-Readable Verb Registry / Entry Fields And Effect Axes\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "pending",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 634,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_b8fa7fa2cd614433de754bbb92302140",
    "sourceUnitDigest": "d08ac6f65427df6334f383a722e80ed4640fc93af7693c530ce2265d7262fcb7",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-35",
    "claimKind": "contract",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "rationale": "Source: docs/io-contract.md:145-158#unheaded-block-21 (current lines); unit SHA256 d08ac6f65427df6334f383a722e80ed4640fc93af7693c530ce2265d7262fcb7.\nTarget: docs/platform/work-state/contracts/cli-io-contract.md:322-336#unheaded-block-35 (current lines); unit SHA256 e013c5b05d6ff58782aa8231ab4a55967bd5ef853dac4015aec8f16f5fcf9c68.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest e013c5b05d6ff58782aa8231ab4a55967bd5ef853dac4015aec8f16f5fcf9c68 at 7854cff84d8bcb67075d4f9c09cd0b6d04808ff4.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/io-contract.md#unheaded-block-21 under docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-35; source context \"Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner` / Sổ verb máy-đọc — CLI tự mô tả\", target context \"CLI I/O Contract / 7. Machine-Readable Verb Registry / Entry Fields And Effect Axes\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "targetUnitDigest": "e013c5b05d6ff58782aa8231ab4a55967bd5ef853dac4015aec8f16f5fcf9c68",
    "targetAncestry": [
      "CLI I/O Contract",
      "7. Machine-Readable Verb Registry",
      "Entry Fields And Effect Axes"
    ]
  }
}
```

## Entry rationale-636

```json
{
  "entryId": "rationale-636",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s5-root-boundary-sync.json",
  "collection": "claims",
  "claimId": "claim_9c7dc2d7af79db454e4d63ffffe3d6f6",
  "before": "A22 actual working target digest/anchor rebound. Full original/current units and decisions in reports/phase-06/step8-final-rework-accounting.json. Pending independent bounded review; no approval carry, source edit, promotion or cutover. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package. L10-21: content-based rebind from reviewed prior target unheaded-block-30 (878d708db7a0afb3e23a0829f98be122c83ac562946b51ab1989e73e5e4a8bfe) to unheaded-block-31 (878d708db7a0afb3e23a0829f98be122c83ac562946b51ab1989e73e5e4a8bfe); inserted paragraphs shift the anchor, prior target text is unchanged.",
  "after": "Source: docs/specs/work-state.md:649-664#unheaded-block-66 (current lines); unit SHA256 878d708db7a0afb3e23a0829f98be122c83ac562946b51ab1989e73e5e4a8bfe.\nTarget: docs/platform/work-state/contracts/cli-io-contract.md:269-284#unheaded-block-31 (current lines); unit SHA256 878d708db7a0afb3e23a0829f98be122c83ac562946b51ab1989e73e5e4a8bfe.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 878d708db7a0afb3e23a0829f98be122c83ac562946b51ab1989e73e5e4a8bfe at 7854cff84d8bcb67075d4f9c09cd0b6d04808ff4.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/specs/work-state.md#unheaded-block-66 under docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-31; source context \"Spec: Work-State (tầng quản việc của forgent) / Data Dictionary / Sổ verb máy-đọc (manifest) — `--help --json`\", target context \"CLI I/O Contract / 7. Machine-Readable Verb Registry / Manifest Shape\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "pending",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 635,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_9c7dc2d7af79db454e4d63ffffe3d6f6",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "sourceUnitDigest": "878d708db7a0afb3e23a0829f98be122c83ac562946b51ab1989e73e5e4a8bfe",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-31",
    "claimKind": "contract",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "rationale": "Source: docs/specs/work-state.md:649-664#unheaded-block-66 (current lines); unit SHA256 878d708db7a0afb3e23a0829f98be122c83ac562946b51ab1989e73e5e4a8bfe.\nTarget: docs/platform/work-state/contracts/cli-io-contract.md:269-284#unheaded-block-31 (current lines); unit SHA256 878d708db7a0afb3e23a0829f98be122c83ac562946b51ab1989e73e5e4a8bfe.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 878d708db7a0afb3e23a0829f98be122c83ac562946b51ab1989e73e5e4a8bfe at 7854cff84d8bcb67075d4f9c09cd0b6d04808ff4.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/specs/work-state.md#unheaded-block-66 under docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-31; source context \"Spec: Work-State (tầng quản việc của forgent) / Data Dictionary / Sổ verb máy-đọc (manifest) — `--help --json`\", target context \"CLI I/O Contract / 7. Machine-Readable Verb Registry / Manifest Shape\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "878d708db7a0afb3e23a0829f98be122c83ac562946b51ab1989e73e5e4a8bfe",
    "targetAncestry": [
      "CLI I/O Contract",
      "7. Machine-Readable Verb Registry",
      "Manifest Shape"
    ]
  }
}
```

## Entry rationale-637

```json
{
  "entryId": "rationale-637",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s5-root-boundary-sync.json",
  "collection": "claims",
  "claimId": "claim_045b588f4d839f90c40b48fbc0fc3f4d",
  "before": "A22 actual working target digest/anchor rebound. Full original/current units and decisions in reports/phase-06/step8-final-rework-accounting.json. Pending independent bounded review; no approval carry, source edit, promotion or cutover. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package. L10-21: content-based rebind from reviewed prior target unheaded-block-31 (a5128895b71f07c2e1baa3ecb90cd302f016fdb4191518ef02835a768c8dc156) to unheaded-block-32 (a5128895b71f07c2e1baa3ecb90cd302f016fdb4191518ef02835a768c8dc156); inserted paragraphs shift the anchor, prior target text is unchanged.",
  "after": "Source: docs/specs/work-state.md:666-677#unheaded-block-67 (current lines); unit SHA256 a5128895b71f07c2e1baa3ecb90cd302f016fdb4191518ef02835a768c8dc156.\nTarget: docs/platform/work-state/contracts/cli-io-contract.md:286-297#unheaded-block-32 (current lines); unit SHA256 a5128895b71f07c2e1baa3ecb90cd302f016fdb4191518ef02835a768c8dc156.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest a5128895b71f07c2e1baa3ecb90cd302f016fdb4191518ef02835a768c8dc156 at 7854cff84d8bcb67075d4f9c09cd0b6d04808ff4.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/specs/work-state.md#unheaded-block-67 under docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-32; source context \"Spec: Work-State (tầng quản việc của forgent) / Data Dictionary / Sổ verb máy-đọc (manifest) — `--help --json`\", target context \"CLI I/O Contract / 7. Machine-Readable Verb Registry / Manifest Shape\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "pending",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 636,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_045b588f4d839f90c40b48fbc0fc3f4d",
    "sourceUnitDigest": "a5128895b71f07c2e1baa3ecb90cd302f016fdb4191518ef02835a768c8dc156",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-32",
    "claimKind": "specification",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "rationale": "Source: docs/specs/work-state.md:666-677#unheaded-block-67 (current lines); unit SHA256 a5128895b71f07c2e1baa3ecb90cd302f016fdb4191518ef02835a768c8dc156.\nTarget: docs/platform/work-state/contracts/cli-io-contract.md:286-297#unheaded-block-32 (current lines); unit SHA256 a5128895b71f07c2e1baa3ecb90cd302f016fdb4191518ef02835a768c8dc156.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest a5128895b71f07c2e1baa3ecb90cd302f016fdb4191518ef02835a768c8dc156 at 7854cff84d8bcb67075d4f9c09cd0b6d04808ff4.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/specs/work-state.md#unheaded-block-67 under docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-32; source context \"Spec: Work-State (tầng quản việc của forgent) / Data Dictionary / Sổ verb máy-đọc (manifest) — `--help --json`\", target context \"CLI I/O Contract / 7. Machine-Readable Verb Registry / Manifest Shape\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "targetUnitDigest": "a5128895b71f07c2e1baa3ecb90cd302f016fdb4191518ef02835a768c8dc156",
    "targetAncestry": [
      "CLI I/O Contract",
      "7. Machine-Readable Verb Registry",
      "Manifest Shape"
    ]
  }
}
```

## Entry rationale-638

```json
{
  "entryId": "rationale-638",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s5-root-boundary-sync.json",
  "collection": "claims",
  "claimId": "claim_e8c37a28267ca355475a2286b90ba453",
  "before": "A22 actual working target digest/anchor rebound. Full original/current units and decisions in reports/phase-06/step8-final-rework-accounting.json. Pending independent bounded review; no approval carry, source edit, promotion or cutover. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package. L10-21: content-based rebind from reviewed prior target unheaded-block-38 (7cb2dbfd3b698c923c15d17222daf08e96f5fcbf54aa79afd3e1248fdd8d9b2e) to unheaded-block-39 (7cb2dbfd3b698c923c15d17222daf08e96f5fcbf54aa79afd3e1248fdd8d9b2e); inserted paragraphs shift the anchor, prior target text is unchanged.",
  "after": "Source: docs/specs/work-state.md:729-734#unheaded-block-71 (current lines); unit SHA256 7cb2dbfd3b698c923c15d17222daf08e96f5fcbf54aa79afd3e1248fdd8d9b2e.\nTarget: docs/platform/work-state/contracts/cli-io-contract.md:360-365#unheaded-block-39 (current lines); unit SHA256 7cb2dbfd3b698c923c15d17222daf08e96f5fcbf54aa79afd3e1248fdd8d9b2e.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 7cb2dbfd3b698c923c15d17222daf08e96f5fcbf54aa79afd3e1248fdd8d9b2e at 7854cff84d8bcb67075d4f9c09cd0b6d04808ff4.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/specs/work-state.md#unheaded-block-71 under docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-39; source context \"Spec: Work-State (tầng quản việc của forgent) / Data Dictionary / Trợ giúp theo từng verb — `fgos <verb> [<sub>] --help|-h [--json]`\", target context \"CLI I/O Contract / 9. Per-Verb Help\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "pending",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 637,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_e8c37a28267ca355475a2286b90ba453",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "sourceUnitDigest": "7cb2dbfd3b698c923c15d17222daf08e96f5fcbf54aa79afd3e1248fdd8d9b2e",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-39",
    "claimKind": "contract",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "rationale": "Source: docs/specs/work-state.md:729-734#unheaded-block-71 (current lines); unit SHA256 7cb2dbfd3b698c923c15d17222daf08e96f5fcbf54aa79afd3e1248fdd8d9b2e.\nTarget: docs/platform/work-state/contracts/cli-io-contract.md:360-365#unheaded-block-39 (current lines); unit SHA256 7cb2dbfd3b698c923c15d17222daf08e96f5fcbf54aa79afd3e1248fdd8d9b2e.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 7cb2dbfd3b698c923c15d17222daf08e96f5fcbf54aa79afd3e1248fdd8d9b2e at 7854cff84d8bcb67075d4f9c09cd0b6d04808ff4.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/specs/work-state.md#unheaded-block-71 under docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-39; source context \"Spec: Work-State (tầng quản việc của forgent) / Data Dictionary / Trợ giúp theo từng verb — `fgos <verb> [<sub>] --help|-h [--json]`\", target context \"CLI I/O Contract / 9. Per-Verb Help\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "7cb2dbfd3b698c923c15d17222daf08e96f5fcbf54aa79afd3e1248fdd8d9b2e",
    "targetAncestry": [
      "CLI I/O Contract",
      "9. Per-Verb Help"
    ]
  }
}
```

## Entry rationale-639

```json
{
  "entryId": "rationale-639",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s5-root-boundary-sync.json",
  "collection": "claims",
  "claimId": "claim_b69096018a7da1d3dc629b5d37f6fdac",
  "before": "A22 actual working target digest/anchor rebound. Full original/current units and decisions in reports/phase-06/step8-final-rework-accounting.json. Pending independent bounded review; no approval carry, source edit, promotion or cutover. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package. L10-21: content-based rebind from reviewed prior target unheaded-block-39 (9b711cb5a088ede56ad00207289f1fed2ccc05887597169bbc41eb2e55429db3) to unheaded-block-40 (9b711cb5a088ede56ad00207289f1fed2ccc05887597169bbc41eb2e55429db3); inserted paragraphs shift the anchor, prior target text is unchanged.",
  "after": "Source: docs/specs/work-state.md:736-749#unheaded-block-72 (current lines); unit SHA256 9b711cb5a088ede56ad00207289f1fed2ccc05887597169bbc41eb2e55429db3.\nTarget: docs/platform/work-state/contracts/cli-io-contract.md:367-380#unheaded-block-40 (current lines); unit SHA256 9b711cb5a088ede56ad00207289f1fed2ccc05887597169bbc41eb2e55429db3.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 9b711cb5a088ede56ad00207289f1fed2ccc05887597169bbc41eb2e55429db3 at 7854cff84d8bcb67075d4f9c09cd0b6d04808ff4.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/specs/work-state.md#unheaded-block-72 under docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-40; source context \"Spec: Work-State (tầng quản việc của forgent) / Data Dictionary / Trợ giúp theo từng verb — `fgos <verb> [<sub>] --help|-h [--json]`\", target context \"CLI I/O Contract / 9. Per-Verb Help\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "pending",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 638,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_b69096018a7da1d3dc629b5d37f6fdac",
    "sourceUnitDigest": "9b711cb5a088ede56ad00207289f1fed2ccc05887597169bbc41eb2e55429db3",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-40",
    "claimKind": "specification",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "rationale": "Source: docs/specs/work-state.md:736-749#unheaded-block-72 (current lines); unit SHA256 9b711cb5a088ede56ad00207289f1fed2ccc05887597169bbc41eb2e55429db3.\nTarget: docs/platform/work-state/contracts/cli-io-contract.md:367-380#unheaded-block-40 (current lines); unit SHA256 9b711cb5a088ede56ad00207289f1fed2ccc05887597169bbc41eb2e55429db3.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 9b711cb5a088ede56ad00207289f1fed2ccc05887597169bbc41eb2e55429db3 at 7854cff84d8bcb67075d4f9c09cd0b6d04808ff4.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/specs/work-state.md#unheaded-block-72 under docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-40; source context \"Spec: Work-State (tầng quản việc của forgent) / Data Dictionary / Trợ giúp theo từng verb — `fgos <verb> [<sub>] --help|-h [--json]`\", target context \"CLI I/O Contract / 9. Per-Verb Help\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "targetUnitDigest": "9b711cb5a088ede56ad00207289f1fed2ccc05887597169bbc41eb2e55429db3",
    "targetAncestry": [
      "CLI I/O Contract",
      "9. Per-Verb Help"
    ]
  }
}
```

## Entry rationale-640

```json
{
  "entryId": "rationale-640",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s5-root-boundary-sync.json",
  "collection": "registryGaps",
  "claimId": "claim_2f7cbb5fabfc5e77f7014c54f020c524",
  "before": "A22 actual working target digest/anchor rebound. Full original/current units and decisions in reports/phase-06/step8-final-rework-accounting.json. Pending independent bounded review; no approval carry, source edit, promotion or cutover. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package.",
  "after": "Source: docs/platform/contracts/architecture-manifest.json:1-260#file-block (historical witness at 86ce0d284e72543899750674fac47db1dadc11aa); unit SHA256 c1c230462d8e6a3a59005658d279246afcdcee727e89f03ff08b0f9ce8b14e85.\nTarget: docs/platform/contracts/architecture-manifest.json:1-269#file-block (current lines); unit SHA256 2d55be82331318dd370052c80940458ce88894b98b049d626e41ba1bc6653b6a.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 2d55be82331318dd370052c80940458ce88894b98b049d626e41ba1bc6653b6a at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/platform/contracts/architecture-manifest.json#file-block under docs/platform/contracts/architecture-manifest.json#file-block; source context \"file-block\", target context \"file-block\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 639,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_2f7cbb5fabfc5e77f7014c54f020c524",
    "sourcePath": "docs/platform/contracts/architecture-manifest.json",
    "sourceAnchor": "file-block",
    "sourceUnitDigest": "c1c230462d8e6a3a59005658d279246afcdcee727e89f03ff08b0f9ce8b14e85",
    "disposition": "supersede",
    "targetOwner": "docs/platform/contracts/architecture-manifest.json",
    "targetAnchor": "file-block",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/platform/contracts/architecture-manifest.json:1-260#file-block (historical witness at 86ce0d284e72543899750674fac47db1dadc11aa); unit SHA256 c1c230462d8e6a3a59005658d279246afcdcee727e89f03ff08b0f9ce8b14e85.\nTarget: docs/platform/contracts/architecture-manifest.json:1-269#file-block (current lines); unit SHA256 2d55be82331318dd370052c80940458ce88894b98b049d626e41ba1bc6653b6a.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 2d55be82331318dd370052c80940458ce88894b98b049d626e41ba1bc6653b6a at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/platform/contracts/architecture-manifest.json#file-block under docs/platform/contracts/architecture-manifest.json#file-block; source context \"file-block\", target context \"file-block\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "2d55be82331318dd370052c80940458ce88894b98b049d626e41ba1bc6653b6a",
    "targetAncestry": []
  }
}
```

## Entry rationale-641

```json
{
  "entryId": "rationale-641",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s5-root-boundary-sync.json",
  "collection": "registryGaps",
  "claimId": "claim_4217ac86de0ba075ca046202b2ce4284",
  "before": "A22 actual working target digest/anchor rebound. Full original/current units and decisions in reports/phase-06/step8-final-rework-accounting.json. Pending independent bounded review; no approval carry, source edit, promotion or cutover. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package. L10-21: content-based rebind from reviewed prior target unheaded-block-25 (f58253403717e416cd5aa169d971bc332b43ab40f16ab6845c90d959d4283221) to unheaded-block-26 (f58253403717e416cd5aa169d971bc332b43ab40f16ab6845c90d959d4283221); inserted paragraphs shift the anchor, prior target text is unchanged.",
  "after": "Source: docs/platform/work-state/contracts/cli-io-contract.md:181-194#unheaded-block-24 (historical witness at c8b2d948d6dd0b408011b294fd67aea59870749b); unit SHA256 4a338e4d813b275ce1c923da4f814881eaab30a4bdca231382fd7df5c5fe9b4a.\nTarget: docs/platform/work-state/contracts/cli-io-contract.md:203-217#unheaded-block-26 (current lines); unit SHA256 f58253403717e416cd5aa169d971bc332b43ab40f16ab6845c90d959d4283221.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest f58253403717e416cd5aa169d971bc332b43ab40f16ab6845c90d959d4283221 at 7854cff84d8bcb67075d4f9c09cd0b6d04808ff4.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-24 under docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-26; source context \"CLI I/O Contract / 5. Reasoned Envelope Exceptions\", target context \"CLI I/O Contract / 5. Reasoned Envelope Exceptions\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "pending",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 640,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_4217ac86de0ba075ca046202b2ce4284",
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "sourceAnchor": "unheaded-block-24",
    "sourceUnitDigest": "4a338e4d813b275ce1c923da4f814881eaab30a4bdca231382fd7df5c5fe9b4a",
    "disposition": "supersede",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-26",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/platform/work-state/contracts/cli-io-contract.md:181-194#unheaded-block-24 (historical witness at c8b2d948d6dd0b408011b294fd67aea59870749b); unit SHA256 4a338e4d813b275ce1c923da4f814881eaab30a4bdca231382fd7df5c5fe9b4a.\nTarget: docs/platform/work-state/contracts/cli-io-contract.md:203-217#unheaded-block-26 (current lines); unit SHA256 f58253403717e416cd5aa169d971bc332b43ab40f16ab6845c90d959d4283221.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest f58253403717e416cd5aa169d971bc332b43ab40f16ab6845c90d959d4283221 at 7854cff84d8bcb67075d4f9c09cd0b6d04808ff4.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-24 under docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-26; source context \"CLI I/O Contract / 5. Reasoned Envelope Exceptions\", target context \"CLI I/O Contract / 5. Reasoned Envelope Exceptions\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "f58253403717e416cd5aa169d971bc332b43ab40f16ab6845c90d959d4283221",
    "targetAncestry": [
      "CLI I/O Contract",
      "5. Reasoned Envelope Exceptions"
    ]
  }
}
```

## Entry rationale-642

```json
{
  "entryId": "rationale-642",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s5-root-boundary-sync.json",
  "collection": "registryGaps",
  "claimId": "claim_0bf4d10d1c0f4cda16abe6091d639b64",
  "before": "A22 actual working target digest/anchor rebound. Full original/current units and decisions in reports/phase-06/step8-final-rework-accounting.json. Pending independent bounded review; no approval carry, source edit, promotion or cutover. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package. L10-21: content-based rebind from reviewed prior target unheaded-block-30 (878d708db7a0afb3e23a0829f98be122c83ac562946b51ab1989e73e5e4a8bfe) to unheaded-block-31 (878d708db7a0afb3e23a0829f98be122c83ac562946b51ab1989e73e5e4a8bfe); inserted paragraphs shift the anchor, prior target text is unchanged.",
  "after": "Source: docs/platform/work-state/contracts/cli-io-contract.md:246-260#unheaded-block-29 (historical witness at c8b2d948d6dd0b408011b294fd67aea59870749b); unit SHA256 a2e6a5ffa58ec1f13d1321cf4b14d70b2a261fba6ce0f15c0bda50975cf8de04.\nTarget: docs/platform/work-state/contracts/cli-io-contract.md:269-284#unheaded-block-31 (current lines); unit SHA256 878d708db7a0afb3e23a0829f98be122c83ac562946b51ab1989e73e5e4a8bfe.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 878d708db7a0afb3e23a0829f98be122c83ac562946b51ab1989e73e5e4a8bfe at 7854cff84d8bcb67075d4f9c09cd0b6d04808ff4.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-29 under docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-31; source context \"CLI I/O Contract / 7. Machine-Readable Verb Registry / Manifest Shape\", target context \"CLI I/O Contract / 7. Machine-Readable Verb Registry / Manifest Shape\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "pending",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 641,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_0bf4d10d1c0f4cda16abe6091d639b64",
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "sourceAnchor": "unheaded-block-29",
    "sourceUnitDigest": "a2e6a5ffa58ec1f13d1321cf4b14d70b2a261fba6ce0f15c0bda50975cf8de04",
    "disposition": "supersede",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-31",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/platform/work-state/contracts/cli-io-contract.md:246-260#unheaded-block-29 (historical witness at c8b2d948d6dd0b408011b294fd67aea59870749b); unit SHA256 a2e6a5ffa58ec1f13d1321cf4b14d70b2a261fba6ce0f15c0bda50975cf8de04.\nTarget: docs/platform/work-state/contracts/cli-io-contract.md:269-284#unheaded-block-31 (current lines); unit SHA256 878d708db7a0afb3e23a0829f98be122c83ac562946b51ab1989e73e5e4a8bfe.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 878d708db7a0afb3e23a0829f98be122c83ac562946b51ab1989e73e5e4a8bfe at 7854cff84d8bcb67075d4f9c09cd0b6d04808ff4.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-29 under docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-31; source context \"CLI I/O Contract / 7. Machine-Readable Verb Registry / Manifest Shape\", target context \"CLI I/O Contract / 7. Machine-Readable Verb Registry / Manifest Shape\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "878d708db7a0afb3e23a0829f98be122c83ac562946b51ab1989e73e5e4a8bfe",
    "targetAncestry": [
      "CLI I/O Contract",
      "7. Machine-Readable Verb Registry",
      "Manifest Shape"
    ]
  }
}
```

## Entry rationale-643

```json
{
  "entryId": "rationale-643",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s5-root-boundary-sync.json",
  "collection": "registryGaps",
  "claimId": "claim_bc055098a9e2bedf2ed30ab0dfcacf79",
  "before": "A22 actual working target digest/anchor rebound. Full original/current units and decisions in reports/phase-06/step8-final-rework-accounting.json. Pending independent bounded review; no approval carry, source edit, promotion or cutover. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package. L10-21: content-based rebind from reviewed prior target unheaded-block-32 (51dd3c8aa026a8f5a15e4c12c522b3bf2ad7c29238c49bf9ba51324806e10e23) to unheaded-block-33 (51dd3c8aa026a8f5a15e4c12c522b3bf2ad7c29238c49bf9ba51324806e10e23); inserted paragraphs shift the anchor, prior target text is unchanged.",
  "after": "Source: docs/platform/work-state/contracts/cli-io-contract.md:262-265#unheaded-block-30 (historical witness at c8b2d948d6dd0b408011b294fd67aea59870749b); unit SHA256 83773dda67db8d5f71205bb8c7106186023672125b08cbe4f33b09b0578163ca.\nTarget: docs/platform/work-state/contracts/cli-io-contract.md:299-306#unheaded-block-33 (current lines); unit SHA256 51dd3c8aa026a8f5a15e4c12c522b3bf2ad7c29238c49bf9ba51324806e10e23.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 51dd3c8aa026a8f5a15e4c12c522b3bf2ad7c29238c49bf9ba51324806e10e23 at 7854cff84d8bcb67075d4f9c09cd0b6d04808ff4.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-30 under docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-33; source context \"CLI I/O Contract / 7. Machine-Readable Verb Registry / Manifest Shape\", target context \"CLI I/O Contract / 7. Machine-Readable Verb Registry / Manifest Shape\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "pending",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 642,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_bc055098a9e2bedf2ed30ab0dfcacf79",
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "sourceAnchor": "unheaded-block-30",
    "sourceUnitDigest": "83773dda67db8d5f71205bb8c7106186023672125b08cbe4f33b09b0578163ca",
    "disposition": "supersede",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-33",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/platform/work-state/contracts/cli-io-contract.md:262-265#unheaded-block-30 (historical witness at c8b2d948d6dd0b408011b294fd67aea59870749b); unit SHA256 83773dda67db8d5f71205bb8c7106186023672125b08cbe4f33b09b0578163ca.\nTarget: docs/platform/work-state/contracts/cli-io-contract.md:299-306#unheaded-block-33 (current lines); unit SHA256 51dd3c8aa026a8f5a15e4c12c522b3bf2ad7c29238c49bf9ba51324806e10e23.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 51dd3c8aa026a8f5a15e4c12c522b3bf2ad7c29238c49bf9ba51324806e10e23 at 7854cff84d8bcb67075d4f9c09cd0b6d04808ff4.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-30 under docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-33; source context \"CLI I/O Contract / 7. Machine-Readable Verb Registry / Manifest Shape\", target context \"CLI I/O Contract / 7. Machine-Readable Verb Registry / Manifest Shape\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "51dd3c8aa026a8f5a15e4c12c522b3bf2ad7c29238c49bf9ba51324806e10e23",
    "targetAncestry": [
      "CLI I/O Contract",
      "7. Machine-Readable Verb Registry",
      "Manifest Shape"
    ]
  }
}
```

## Entry rationale-644

```json
{
  "entryId": "rationale-644",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s5-root-boundary-sync.json",
  "collection": "registryGaps",
  "claimId": "claim_b7876fcb567891ddc8431cdab2f2dab0",
  "before": "A31 upstream same-file native successor located by the exact old/current diff line map. Preserve both native identities; independent conservation review pending, no ID graft or approval carry. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package.",
  "after": "Source: docs/specs/runner.md:1196-1238#unheaded-block-102 (historical witness at a8457b07f65f1b3e9ccc19de83546b5fb1bc69ee); unit SHA256 a9da2cf6e58fce799612fa0621321bd73b52671c571c30d19146f0e982f19d72.\nTarget: docs/specs/runner.md:1222-1272#unheaded-block-102 (current lines); unit SHA256 29fd80cd85f3529f3dcc99950563df4461655efc9d0550abe9dc52b199d07854.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 29fd80cd85f3529f3dcc99950563df4461655efc9d0550abe9dc52b199d07854 at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/specs/runner.md#unheaded-block-102 under docs/specs/runner.md#unheaded-block-102; source context \"Spec: Runner (vòng tự hành) / Pointers (implementation)\", target context \"Spec: Runner (vòng tự hành) / Pointers (implementation)\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 643,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_b7876fcb567891ddc8431cdab2f2dab0",
    "sourcePath": "docs/specs/runner.md",
    "sourceAnchor": "unheaded-block-100",
    "sourceUnitDigest": "a9da2cf6e58fce799612fa0621321bd73b52671c571c30d19146f0e982f19d72",
    "disposition": "supersede",
    "targetOwner": "docs/specs/runner.md",
    "targetAnchor": "unheaded-block-102",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/specs/runner.md:1196-1238#unheaded-block-102 (historical witness at a8457b07f65f1b3e9ccc19de83546b5fb1bc69ee); unit SHA256 a9da2cf6e58fce799612fa0621321bd73b52671c571c30d19146f0e982f19d72.\nTarget: docs/specs/runner.md:1222-1272#unheaded-block-102 (current lines); unit SHA256 29fd80cd85f3529f3dcc99950563df4461655efc9d0550abe9dc52b199d07854.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 29fd80cd85f3529f3dcc99950563df4461655efc9d0550abe9dc52b199d07854 at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/specs/runner.md#unheaded-block-102 under docs/specs/runner.md#unheaded-block-102; source context \"Spec: Runner (vòng tự hành) / Pointers (implementation)\", target context \"Spec: Runner (vòng tự hành) / Pointers (implementation)\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "29fd80cd85f3529f3dcc99950563df4461655efc9d0550abe9dc52b199d07854",
    "targetAncestry": [
      "Spec: Runner (vòng tự hành)",
      "Pointers (implementation)"
    ]
  }
}
```

## Entry rationale-645

```json
{
  "entryId": "rationale-645",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s5-root-boundary-sync.json",
  "collection": "registryGaps",
  "claimId": "claim_c2cb6de3e8b1288ed15fcd60f3154bbb",
  "before": "A31 upstream same-file native successor located by the exact old/current diff line map. Preserve both native identities; independent conservation review pending, no ID graft or approval carry. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package.",
  "after": "Source: docs/specs/runner.md:73-87#unheaded-block-9 (historical witness at c67e9a6b24ab326edd3190051178663f42e3a665); unit SHA256 daf2341d585c13bd3e7f44184eb0b61402e41abf7ac9ae8a987b200a83f51c9e.\nTarget: docs/specs/runner.md:73-87#unheaded-block-9 (current lines); unit SHA256 43f03eb4dffdeff420f464531d60be7e37e13192429963b10ba302be1e9b777e.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 43f03eb4dffdeff420f464531d60be7e37e13192429963b10ba302be1e9b777e at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/specs/runner.md#unheaded-block-9 under docs/specs/runner.md#unheaded-block-9; source context \"Spec: Runner (vòng tự hành) / Data Dictionary\", target context \"Spec: Runner (vòng tự hành) / Data Dictionary\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 644,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_c2cb6de3e8b1288ed15fcd60f3154bbb",
    "sourcePath": "docs/specs/runner.md",
    "sourceAnchor": "unheaded-block-9",
    "sourceUnitDigest": "daf2341d585c13bd3e7f44184eb0b61402e41abf7ac9ae8a987b200a83f51c9e",
    "disposition": "supersede",
    "targetOwner": "docs/specs/runner.md",
    "targetAnchor": "unheaded-block-9",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/specs/runner.md:73-87#unheaded-block-9 (historical witness at c67e9a6b24ab326edd3190051178663f42e3a665); unit SHA256 daf2341d585c13bd3e7f44184eb0b61402e41abf7ac9ae8a987b200a83f51c9e.\nTarget: docs/specs/runner.md:73-87#unheaded-block-9 (current lines); unit SHA256 43f03eb4dffdeff420f464531d60be7e37e13192429963b10ba302be1e9b777e.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 43f03eb4dffdeff420f464531d60be7e37e13192429963b10ba302be1e9b777e at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/specs/runner.md#unheaded-block-9 under docs/specs/runner.md#unheaded-block-9; source context \"Spec: Runner (vòng tự hành) / Data Dictionary\", target context \"Spec: Runner (vòng tự hành) / Data Dictionary\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "43f03eb4dffdeff420f464531d60be7e37e13192429963b10ba302be1e9b777e",
    "targetAncestry": [
      "Spec: Runner (vòng tự hành)",
      "Data Dictionary"
    ]
  }
}
```

## Entry rationale-646

```json
{
  "entryId": "rationale-646",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s5-root-boundary-sync.json",
  "collection": "registryGaps",
  "claimId": "claim_6f9769825ad867b974bc2f69118c2261",
  "before": "A22 actual working target digest/anchor rebound. Full original/current units and decisions in reports/phase-06/step8-final-rework-accounting.json. Pending independent bounded review; no approval carry, source edit, promotion or cutover. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package.",
  "after": "Source: docs/platform/contracts/architecture-manifest.json:1-264#file-block (historical witness at 6c6a65e8543fa72012bd55f8999f13f9ed6193c4); unit SHA256 0eab58e60acc4e19019d05f6317967bbfe06fc70a222b7f6297b107a3071559f.\nTarget: docs/platform/contracts/architecture-manifest.json:1-269#file-block (current lines); unit SHA256 2d55be82331318dd370052c80940458ce88894b98b049d626e41ba1bc6653b6a.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 2d55be82331318dd370052c80940458ce88894b98b049d626e41ba1bc6653b6a at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/platform/contracts/architecture-manifest.json#file-block under docs/platform/contracts/architecture-manifest.json#file-block; source context \"file-block\", target context \"file-block\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 645,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_6f9769825ad867b974bc2f69118c2261",
    "sourcePath": "docs/platform/contracts/architecture-manifest.json",
    "sourceAnchor": "file-block",
    "sourceUnitDigest": "0eab58e60acc4e19019d05f6317967bbfe06fc70a222b7f6297b107a3071559f",
    "claimKind": "contract",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "targetOwner": "docs/platform/contracts/architecture-manifest.json",
    "targetAnchor": "file-block",
    "rationale": "Source: docs/platform/contracts/architecture-manifest.json:1-264#file-block (historical witness at 6c6a65e8543fa72012bd55f8999f13f9ed6193c4); unit SHA256 0eab58e60acc4e19019d05f6317967bbfe06fc70a222b7f6297b107a3071559f.\nTarget: docs/platform/contracts/architecture-manifest.json:1-269#file-block (current lines); unit SHA256 2d55be82331318dd370052c80940458ce88894b98b049d626e41ba1bc6653b6a.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 2d55be82331318dd370052c80940458ce88894b98b049d626e41ba1bc6653b6a at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/platform/contracts/architecture-manifest.json#file-block under docs/platform/contracts/architecture-manifest.json#file-block; source context \"file-block\", target context \"file-block\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "2d55be82331318dd370052c80940458ce88894b98b049d626e41ba1bc6653b6a",
    "targetAncestry": []
  }
}
```

## Entry rationale-647

```json
{
  "entryId": "rationale-647",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s5-root-boundary-sync.json",
  "collection": "registryGaps",
  "claimId": "claim_0416642260519cf992931a4968e80c03",
  "before": "A22 actual working target digest/anchor rebound. Full original/current units and decisions in reports/phase-06/step8-final-rework-accounting.json. Pending independent bounded review; no approval carry, source edit, promotion or cutover. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package.",
  "after": "Source: docs/architecture-manifest.json:1-264#file-block (historical witness at 84fe38b2f517613b753d85c21aeac0e80abe03e7); unit SHA256 0eab58e60acc4e19019d05f6317967bbfe06fc70a222b7f6297b107a3071559f.\nTarget: docs/platform/contracts/architecture-manifest.json:1-269#file-block (current lines); unit SHA256 2d55be82331318dd370052c80940458ce88894b98b049d626e41ba1bc6653b6a.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 2d55be82331318dd370052c80940458ce88894b98b049d626e41ba1bc6653b6a at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architecture-manifest.json#file-block under docs/platform/contracts/architecture-manifest.json#file-block; source context \"file-block\", target context \"file-block\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 646,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_0416642260519cf992931a4968e80c03",
    "sourceUnitDigest": "0eab58e60acc4e19019d05f6317967bbfe06fc70a222b7f6297b107a3071559f",
    "claimKind": "contract",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "targetOwner": "docs/platform/contracts/architecture-manifest.json",
    "targetAnchor": "file-block",
    "rationale": "Source: docs/architecture-manifest.json:1-264#file-block (historical witness at 84fe38b2f517613b753d85c21aeac0e80abe03e7); unit SHA256 0eab58e60acc4e19019d05f6317967bbfe06fc70a222b7f6297b107a3071559f.\nTarget: docs/platform/contracts/architecture-manifest.json:1-269#file-block (current lines); unit SHA256 2d55be82331318dd370052c80940458ce88894b98b049d626e41ba1bc6653b6a.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 2d55be82331318dd370052c80940458ce88894b98b049d626e41ba1bc6653b6a at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architecture-manifest.json#file-block under docs/platform/contracts/architecture-manifest.json#file-block; source context \"file-block\", target context \"file-block\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "sourcePath": "docs/architecture-manifest.json",
    "sourceAnchor": "file-block",
    "targetUnitDigest": "2d55be82331318dd370052c80940458ce88894b98b049d626e41ba1bc6653b6a",
    "targetAncestry": []
  }
}
```

## Entry rationale-648

```json
{
  "entryId": "rationale-648",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s5-root-boundary-sync.json",
  "collection": "registryGaps",
  "claimId": "claim_daaf3726036adad15b2529ad43f71d44",
  "before": "A31 native source predecessor became identity gap; retain native ID, supersede accounting to current carrier. A22 actual working target digest/anchor rebound. Full original/current units and decisions in reports/phase-06/step8-final-rework-accounting.json. Pending independent bounded review; no approval carry, source edit, promotion or cutover. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package.",
  "after": "Source: docs/specs/distribution.md:57-73#unheaded-block-5 (historical witness at 554401219ddbc4676c3b57381a468904442855e9); unit SHA256 b2602ce11716f89d5f4d3371f398fee7eba9a6db5481383e8b8a52b81b829b9f.\nTarget: docs/platform/packaging-distribution/spec.md:517-533#unheaded-block-85 (current lines); unit SHA256 59297ed6cac29ae0d34e9f3a48ca0c518e8c06fed5e224ca0182f627ae93839e.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 59297ed6cac29ae0d34e9f3a48ca0c518e8c06fed5e224ca0182f627ae93839e at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/specs/distribution.md#unheaded-block-5 under docs/platform/packaging-distribution/spec.md#unheaded-block-85; source context \"Spec: Distribution / Data Dictionary\", target context \"Spec: Packaging-Distribution / Retained Distribution Source Detail / Spec: Distribution / Data Dictionary\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 647,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_daaf3726036adad15b2529ad43f71d44",
    "sourceUnitDigest": "b2602ce11716f89d5f4d3371f398fee7eba9a6db5481383e8b8a52b81b829b9f",
    "targetOwner": "docs/platform/packaging-distribution/spec.md",
    "targetAnchor": "unheaded-block-85",
    "claimKind": "specification",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/specs/distribution.md:57-73#unheaded-block-5 (historical witness at 554401219ddbc4676c3b57381a468904442855e9); unit SHA256 b2602ce11716f89d5f4d3371f398fee7eba9a6db5481383e8b8a52b81b829b9f.\nTarget: docs/platform/packaging-distribution/spec.md:517-533#unheaded-block-85 (current lines); unit SHA256 59297ed6cac29ae0d34e9f3a48ca0c518e8c06fed5e224ca0182f627ae93839e.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 59297ed6cac29ae0d34e9f3a48ca0c518e8c06fed5e224ca0182f627ae93839e at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/specs/distribution.md#unheaded-block-5 under docs/platform/packaging-distribution/spec.md#unheaded-block-85; source context \"Spec: Distribution / Data Dictionary\", target context \"Spec: Packaging-Distribution / Retained Distribution Source Detail / Spec: Distribution / Data Dictionary\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "sourcePath": "docs/specs/distribution.md",
    "targetUnitDigest": "59297ed6cac29ae0d34e9f3a48ca0c518e8c06fed5e224ca0182f627ae93839e",
    "targetAncestry": [
      "Spec: Packaging-Distribution",
      "Retained Distribution Source Detail",
      "Spec: Distribution",
      "Data Dictionary"
    ]
  }
}
```

## Entry rationale-649

```json
{
  "entryId": "rationale-649",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s5-root-boundary-sync.json",
  "collection": "registryGaps",
  "claimId": "claim_cdb2776a59ac6a8bbc129754ffc7380f",
  "before": "A31 native source predecessor became identity gap; retain native ID, supersede accounting to current carrier. A22 actual working target digest/anchor rebound. Full original/current units and decisions in reports/phase-06/step8-final-rework-accounting.json. Pending independent bounded review; no approval carry, source edit, promotion or cutover. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package.",
  "after": "Source: docs/architecture-manifest.json:1-266#file-block (historical witness at 9a051dfd5af2cfe6a19ead00c54986c70470e67f); unit SHA256 5a7e59abe736f2b6d3af229d70366d3b7c83484c682540ec4bcf79c3ec0a1657.\nTarget: docs/platform/contracts/architecture-manifest.json:1-269#file-block (current lines); unit SHA256 2d55be82331318dd370052c80940458ce88894b98b049d626e41ba1bc6653b6a.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 2d55be82331318dd370052c80940458ce88894b98b049d626e41ba1bc6653b6a at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architecture-manifest.json#file-block under docs/platform/contracts/architecture-manifest.json#file-block; source context \"file-block\", target context \"file-block\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 648,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "sourcePath": "docs/architecture-manifest.json",
    "sourceAnchor": "file-block",
    "sourceUnitDigest": "5a7e59abe736f2b6d3af229d70366d3b7c83484c682540ec4bcf79c3ec0a1657",
    "targetOwner": "docs/platform/contracts/architecture-manifest.json",
    "targetAnchor": "file-block",
    "claimKind": "contract",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architecture-manifest.json:1-266#file-block (historical witness at 9a051dfd5af2cfe6a19ead00c54986c70470e67f); unit SHA256 5a7e59abe736f2b6d3af229d70366d3b7c83484c682540ec4bcf79c3ec0a1657.\nTarget: docs/platform/contracts/architecture-manifest.json:1-269#file-block (current lines); unit SHA256 2d55be82331318dd370052c80940458ce88894b98b049d626e41ba1bc6653b6a.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 2d55be82331318dd370052c80940458ce88894b98b049d626e41ba1bc6653b6a at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architecture-manifest.json#file-block under docs/platform/contracts/architecture-manifest.json#file-block; source context \"file-block\", target context \"file-block\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "claimId": "claim_cdb2776a59ac6a8bbc129754ffc7380f",
    "targetUnitDigest": "2d55be82331318dd370052c80940458ce88894b98b049d626e41ba1bc6653b6a",
    "targetAncestry": []
  }
}
```

## Entry rationale-650

```json
{
  "entryId": "rationale-650",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s5-root-historical-gaps.json",
  "collection": "registryGaps",
  "claimId": "claim_b92ac199356ff830e5554647ab143a90",
  "before": "A22 actual working target digest/anchor rebound. Full original/current units and decisions in reports/phase-06/step8-final-rework-accounting.json. Pending independent bounded review; no approval carry, source edit, promotion or cutover. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package. L10-21: content-based rebind from reviewed prior target unheaded-block-24 (cb6381a3b69f2fdd99ff81b06cafbce1f45add19c7076005c59ad0e093d49be8) to unheaded-block-25 (cb6381a3b69f2fdd99ff81b06cafbce1f45add19c7076005c59ad0e093d49be8); inserted paragraphs shift the anchor, prior target text is unchanged.",
  "after": "Source: docs/io-contract.md:83-84#unheaded-block-14 (historical witness at 05d6fc7ca8d48aa18c030908ec8165cb784cac10); unit SHA256 e24cc26161b017265526e8e287d7ddb0777cabce83f1effd56099a3ea79814e5.\nTarget: docs/platform/work-state/contracts/cli-io-contract.md:200-201#unheaded-block-25 (current lines); unit SHA256 cb6381a3b69f2fdd99ff81b06cafbce1f45add19c7076005c59ad0e093d49be8.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest cb6381a3b69f2fdd99ff81b06cafbce1f45add19c7076005c59ad0e093d49be8 at 7854cff84d8bcb67075d4f9c09cd0b6d04808ff4.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/io-contract.md#unheaded-block-14 under docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-25; source context \"Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner` / Chiều ra — envelope thống nhất / Ngoại lệ có lý do\", target context \"CLI I/O Contract / 5. Reasoned Envelope Exceptions\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "pending",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 649,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_b92ac199356ff830e5554647ab143a90",
    "sourcePath": "docs/io-contract.md",
    "sourceAnchor": "unheaded-block-14",
    "sourceUnitDigest": "e24cc26161b017265526e8e287d7ddb0777cabce83f1effd56099a3ea79814e5",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-25",
    "rationale": "Source: docs/io-contract.md:83-84#unheaded-block-14 (historical witness at 05d6fc7ca8d48aa18c030908ec8165cb784cac10); unit SHA256 e24cc26161b017265526e8e287d7ddb0777cabce83f1effd56099a3ea79814e5.\nTarget: docs/platform/work-state/contracts/cli-io-contract.md:200-201#unheaded-block-25 (current lines); unit SHA256 cb6381a3b69f2fdd99ff81b06cafbce1f45add19c7076005c59ad0e093d49be8.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest cb6381a3b69f2fdd99ff81b06cafbce1f45add19c7076005c59ad0e093d49be8 at 7854cff84d8bcb67075d4f9c09cd0b6d04808ff4.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/io-contract.md#unheaded-block-14 under docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-25; source context \"Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner` / Chiều ra — envelope thống nhất / Ngoại lệ có lý do\", target context \"CLI I/O Contract / 5. Reasoned Envelope Exceptions\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "cb6381a3b69f2fdd99ff81b06cafbce1f45add19c7076005c59ad0e093d49be8",
    "targetAncestry": [
      "CLI I/O Contract",
      "5. Reasoned Envelope Exceptions"
    ]
  }
}
```

## Entry rationale-651

```json
{
  "entryId": "rationale-651",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s5-root-historical-gaps.json",
  "collection": "registryGaps",
  "claimId": "claim_6a8087a3f502f37f9c7b729e871bee9c",
  "before": "A22 actual working target digest/anchor rebound. Full original/current units and decisions in reports/phase-06/step8-final-rework-accounting.json. Pending independent bounded review; no approval carry, source edit, promotion or cutover. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package. L10-21: content-based rebind from reviewed prior target unheaded-block-25 (f58253403717e416cd5aa169d971bc332b43ab40f16ab6845c90d959d4283221) to unheaded-block-26 (f58253403717e416cd5aa169d971bc332b43ab40f16ab6845c90d959d4283221); inserted paragraphs shift the anchor, prior target text is unchanged.",
  "after": "Source: docs/io-contract.md:86-95#unheaded-block-15 (historical witness at 05d6fc7ca8d48aa18c030908ec8165cb784cac10); unit SHA256 74809b036d96332c8fd99e73be67a5abacbef4b899eb741b946b39aed1ce1fa6.\nTarget: docs/platform/work-state/contracts/cli-io-contract.md:203-217#unheaded-block-26 (current lines); unit SHA256 f58253403717e416cd5aa169d971bc332b43ab40f16ab6845c90d959d4283221.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest f58253403717e416cd5aa169d971bc332b43ab40f16ab6845c90d959d4283221 at 7854cff84d8bcb67075d4f9c09cd0b6d04808ff4.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/io-contract.md#unheaded-block-15 under docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-26; source context \"Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner` / Chiều ra — envelope thống nhất / Ngoại lệ có lý do\", target context \"CLI I/O Contract / 5. Reasoned Envelope Exceptions\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "pending",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 650,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_6a8087a3f502f37f9c7b729e871bee9c",
    "sourcePath": "docs/io-contract.md",
    "sourceAnchor": "unheaded-block-15",
    "sourceUnitDigest": "74809b036d96332c8fd99e73be67a5abacbef4b899eb741b946b39aed1ce1fa6",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-26",
    "rationale": "Source: docs/io-contract.md:86-95#unheaded-block-15 (historical witness at 05d6fc7ca8d48aa18c030908ec8165cb784cac10); unit SHA256 74809b036d96332c8fd99e73be67a5abacbef4b899eb741b946b39aed1ce1fa6.\nTarget: docs/platform/work-state/contracts/cli-io-contract.md:203-217#unheaded-block-26 (current lines); unit SHA256 f58253403717e416cd5aa169d971bc332b43ab40f16ab6845c90d959d4283221.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest f58253403717e416cd5aa169d971bc332b43ab40f16ab6845c90d959d4283221 at 7854cff84d8bcb67075d4f9c09cd0b6d04808ff4.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/io-contract.md#unheaded-block-15 under docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-26; source context \"Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner` / Chiều ra — envelope thống nhất / Ngoại lệ có lý do\", target context \"CLI I/O Contract / 5. Reasoned Envelope Exceptions\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "f58253403717e416cd5aa169d971bc332b43ab40f16ab6845c90d959d4283221",
    "targetAncestry": [
      "CLI I/O Contract",
      "5. Reasoned Envelope Exceptions"
    ]
  }
}
```

## Entry rationale-652

```json
{
  "entryId": "rationale-652",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s5-root-main-recarry.json",
  "collection": "claims",
  "claimId": "claim_bc091727d4f9526a57978e0ccc1cd5f7",
  "before": "A31 native current source identity; full changed source unit carried verbatim in existing candidate owner. Main-only before/after retained in step8-final-rework-accounting.json. No predecessor identity graft or approval carry; no current-truth or promotion approval. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package. L10-21: content-based rebind from reviewed prior target unheaded-block-22 (d1af2d5a982f5d139fda776a23b4ad0b3776cc40c1fc0177636c44bdc91b968d) to unheaded-block-23 (d1af2d5a982f5d139fda776a23b4ad0b3776cc40c1fc0177636c44bdc91b968d); inserted paragraphs shift the anchor, prior target text is unchanged.",
  "after": "Source: docs/io-contract.md:85-90#unheaded-block-14 (current lines); unit SHA256 d1af2d5a982f5d139fda776a23b4ad0b3776cc40c1fc0177636c44bdc91b968d.\nTarget: docs/platform/work-state/contracts/cli-io-contract.md:188-193#unheaded-block-23 (current lines); unit SHA256 d1af2d5a982f5d139fda776a23b4ad0b3776cc40c1fc0177636c44bdc91b968d.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest d1af2d5a982f5d139fda776a23b4ad0b3776cc40c1fc0177636c44bdc91b968d at 7854cff84d8bcb67075d4f9c09cd0b6d04808ff4.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/io-contract.md#unheaded-block-14 under docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-23; source context \"Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner` / Chiều ra — envelope thống nhất / Mã thoát (exit code) — một nguồn duy nhất\", target context \"CLI I/O Contract / 4. Exit Codes\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "pending",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 651,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_bc091727d4f9526a57978e0ccc1cd5f7",
    "sourceUnitDigest": "d1af2d5a982f5d139fda776a23b4ad0b3776cc40c1fc0177636c44bdc91b968d",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-23",
    "claimKind": "contract",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/io-contract.md:85-90#unheaded-block-14 (current lines); unit SHA256 d1af2d5a982f5d139fda776a23b4ad0b3776cc40c1fc0177636c44bdc91b968d.\nTarget: docs/platform/work-state/contracts/cli-io-contract.md:188-193#unheaded-block-23 (current lines); unit SHA256 d1af2d5a982f5d139fda776a23b4ad0b3776cc40c1fc0177636c44bdc91b968d.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest d1af2d5a982f5d139fda776a23b4ad0b3776cc40c1fc0177636c44bdc91b968d at 7854cff84d8bcb67075d4f9c09cd0b6d04808ff4.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/io-contract.md#unheaded-block-14 under docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-23; source context \"Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner` / Chiều ra — envelope thống nhất / Mã thoát (exit code) — một nguồn duy nhất\", target context \"CLI I/O Contract / 4. Exit Codes\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "d1af2d5a982f5d139fda776a23b4ad0b3776cc40c1fc0177636c44bdc91b968d",
    "targetAncestry": [
      "CLI I/O Contract",
      "4. Exit Codes"
    ]
  }
}
```

## Entry rationale-653

```json
{
  "entryId": "rationale-653",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s5-root-main-recarry.json",
  "collection": "claims",
  "claimId": "claim_812873a889bd4222ea0ab3dc9194e1ad",
  "before": "A31 native current source identity; full changed source unit carried verbatim in existing candidate owner. Main-only before/after retained in step8-final-rework-accounting.json. No predecessor identity graft or approval carry; no current-truth or promotion approval. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package. L10-21: content-based rebind from reviewed prior target unheaded-block-23 (131cc0704d753f35dcbec3ebba7be49a0d103732b6f4ee8c5ecc175d5c46167e) to unheaded-block-24 (131cc0704d753f35dcbec3ebba7be49a0d103732b6f4ee8c5ecc175d5c46167e); inserted paragraphs shift the anchor, prior target text is unchanged.",
  "after": "Source: docs/io-contract.md:92-93#unheaded-block-15 (current lines); unit SHA256 131cc0704d753f35dcbec3ebba7be49a0d103732b6f4ee8c5ecc175d5c46167e.\nTarget: docs/platform/work-state/contracts/cli-io-contract.md:195-196#unheaded-block-24 (current lines); unit SHA256 131cc0704d753f35dcbec3ebba7be49a0d103732b6f4ee8c5ecc175d5c46167e.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 131cc0704d753f35dcbec3ebba7be49a0d103732b6f4ee8c5ecc175d5c46167e at 7854cff84d8bcb67075d4f9c09cd0b6d04808ff4.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/io-contract.md#unheaded-block-15 under docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-24; source context \"Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner` / Chiều ra — envelope thống nhất / Mã thoát (exit code) — một nguồn duy nhất\", target context \"CLI I/O Contract / 4. Exit Codes\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "pending",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 652,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_812873a889bd4222ea0ab3dc9194e1ad",
    "sourceUnitDigest": "131cc0704d753f35dcbec3ebba7be49a0d103732b6f4ee8c5ecc175d5c46167e",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-24",
    "claimKind": "contract",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/io-contract.md:92-93#unheaded-block-15 (current lines); unit SHA256 131cc0704d753f35dcbec3ebba7be49a0d103732b6f4ee8c5ecc175d5c46167e.\nTarget: docs/platform/work-state/contracts/cli-io-contract.md:195-196#unheaded-block-24 (current lines); unit SHA256 131cc0704d753f35dcbec3ebba7be49a0d103732b6f4ee8c5ecc175d5c46167e.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 131cc0704d753f35dcbec3ebba7be49a0d103732b6f4ee8c5ecc175d5c46167e at 7854cff84d8bcb67075d4f9c09cd0b6d04808ff4.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/io-contract.md#unheaded-block-15 under docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-24; source context \"Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner` / Chiều ra — envelope thống nhất / Mã thoát (exit code) — một nguồn duy nhất\", target context \"CLI I/O Contract / 4. Exit Codes\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "131cc0704d753f35dcbec3ebba7be49a0d103732b6f4ee8c5ecc175d5c46167e",
    "targetAncestry": [
      "CLI I/O Contract",
      "4. Exit Codes"
    ]
  }
}
```

## Entry rationale-654

```json
{
  "entryId": "rationale-654",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s5-root-main-recarry.json",
  "collection": "claims",
  "claimId": "claim_03ef50e87178220032a3eebe5c5d89d9",
  "before": "A31 / SYNC 59b9b7087: current upstream text carried into its mapped candidate with only disclosed relative-link rebases; existing labelled truth corrections remain. This is a provisional current-source draft from unchanged buildInventoryRow; next package must resolve native identity. No source retirement, authority flip or approval carried. Native identity resolved at 19ca8de23908e161c34c91626e41041b7813167c from the sole native sync. Historical gaps remain separate; no provisional ID is persisted as a decision and no approval carries.",
  "after": "Source: docs/architecture-manifest.json:1-269#file-block (current lines); unit SHA256 2d55be82331318dd370052c80940458ce88894b98b049d626e41ba1bc6653b6a.\nTarget: docs/platform/contracts/architecture-manifest.json:1-269#file-block (current lines); unit SHA256 2d55be82331318dd370052c80940458ce88894b98b049d626e41ba1bc6653b6a.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 2d55be82331318dd370052c80940458ce88894b98b049d626e41ba1bc6653b6a at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architecture-manifest.json#file-block under docs/platform/contracts/architecture-manifest.json#file-block; source context \"file-block\", target context \"file-block\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 653,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_03ef50e87178220032a3eebe5c5d89d9",
    "sourcePath": "docs/architecture-manifest.json",
    "sourceAnchor": "file-block",
    "sourceUnitDigest": "2d55be82331318dd370052c80940458ce88894b98b049d626e41ba1bc6653b6a",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architecture-manifest.json:1-269#file-block (current lines); unit SHA256 2d55be82331318dd370052c80940458ce88894b98b049d626e41ba1bc6653b6a.\nTarget: docs/platform/contracts/architecture-manifest.json:1-269#file-block (current lines); unit SHA256 2d55be82331318dd370052c80940458ce88894b98b049d626e41ba1bc6653b6a.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 2d55be82331318dd370052c80940458ce88894b98b049d626e41ba1bc6653b6a at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architecture-manifest.json#file-block under docs/platform/contracts/architecture-manifest.json#file-block; source context \"file-block\", target context \"file-block\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/contracts/architecture-manifest.json",
    "targetAnchor": "file-block",
    "targetUnitDigest": "2d55be82331318dd370052c80940458ce88894b98b049d626e41ba1bc6653b6a",
    "targetAncestry": []
  }
}
```

## Entry rationale-655

```json
{
  "entryId": "rationale-655",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s5-root-main-recarry.json",
  "collection": "registryGaps",
  "claimId": "claim_f9c135d80cce2e8cf98c8b3b5b0db4ad",
  "before": "A22/A34 at SYNC 2300d65571968bb3bcb80123a273272586e3f1db: native predecessor gap preserved; all historical lines occur verbatim in order in current source successor; insertion-only containment. Full source/successor and residual evidence: step10-sync2300-predecessor-residuals.json. No identity graft or approval carry. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package.",
  "after": "Source: docs/architecture-manifest.json:1-267#file-block (historical witness at d924f22ca44307ece579169fa2a2d459d5c0197e); unit SHA256 70c00c205578fc34084e5bf8701a6bde0999cb6f05a1b58f8424ad95ed4c28d4.\nTarget: docs/architecture-manifest.json:1-269#file-block (current lines); unit SHA256 2d55be82331318dd370052c80940458ce88894b98b049d626e41ba1bc6653b6a.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 2d55be82331318dd370052c80940458ce88894b98b049d626e41ba1bc6653b6a at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architecture-manifest.json#file-block under docs/architecture-manifest.json#file-block; source context \"file-block\", target context \"file-block\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 654,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_f9c135d80cce2e8cf98c8b3b5b0db4ad",
    "sourcePath": "docs/architecture-manifest.json",
    "sourceUnitDigest": "70c00c205578fc34084e5bf8701a6bde0999cb6f05a1b58f8424ad95ed4c28d4",
    "disposition": "supersede",
    "targetOwner": "docs/architecture-manifest.json",
    "targetAnchor": "file-block",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "pending",
    "rationale": "Source: docs/architecture-manifest.json:1-267#file-block (historical witness at d924f22ca44307ece579169fa2a2d459d5c0197e); unit SHA256 70c00c205578fc34084e5bf8701a6bde0999cb6f05a1b58f8424ad95ed4c28d4.\nTarget: docs/architecture-manifest.json:1-269#file-block (current lines); unit SHA256 2d55be82331318dd370052c80940458ce88894b98b049d626e41ba1bc6653b6a.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 2d55be82331318dd370052c80940458ce88894b98b049d626e41ba1bc6653b6a at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architecture-manifest.json#file-block under docs/architecture-manifest.json#file-block; source context \"file-block\", target context \"file-block\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "2d55be82331318dd370052c80940458ce88894b98b049d626e41ba1bc6653b6a",
    "targetAncestry": []
  }
}
```

## Entry rationale-656

```json
{
  "entryId": "rationale-656",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s5-root-mapped-conservation.json",
  "collection": "claims",
  "claimId": "claim_e5cc66ff5930f04b7ebd9a8acbc52942",
  "before": "Frozen root map assigns docs/transitional-switchboard.md#unheaded-block-7 to docs/platform/documentation/switchboard.md#unheaded-block-7. Carry the complete unit into its candidate switchboard doc owner. This unit includes 7 documented link spelling adjustment(s): [docs/platform/migration-authoring-rules.md](platform/migration-authoring-rules.md) becomes [docs/platform/migration-authoring-rules.md](../migration-authoring-rules.md) (Relative spelling changes only; original repository destination conserved.); [docs/reading-map.md](reading-map.md) becomes [docs/reading-map.md](../../reading-map.md) (Relative spelling changes only; original repository destination conserved.); [docs/platform/README.md](platform/README.md) becomes [docs/platform/README.md](../README.md) (Relative spelling changes only; original repository destination conserved.); [docs/doc-governance.md](doc-governance.md) becomes [docs/platform/governance.md](../governance.md) (Destination repointed to docs/platform/governance.md and label changed from docs/doc-governance.md to docs/platform/governance.md.); [docs/platform/migration-authoring-rules.md](platform/migration-authoring-rules.md) becomes [docs/platform/migration-authoring-rules.md](../migration-authoring-rules.md) (Relative spelling changes only; original repository destination conserved.); [plans/260925-documentation-authority-unification/current-authority-map-2026-09-25.md](../plans/260925-documentation-authority-unification/current-authority-map-2026-09-25.md) becomes [plans/260925-documentation-authority-unification/current-authority-map-2026-09-25.md](../../../plans/260925-documentation-authority-unification/current-authority-map-2026-09-25.md) (Relative spelling changes only; original repository destination conserved.); [plans/260925-documentation-authority-unification/plan.md](../plans/260925-documentation-authority-unification/plan.md) becomes [plans/260925-documentation-authority-unification/plan.md](../../../plans/260925-documentation-authority-unification/plan.md) (Relative spelling changes only; original repository destination conserved.). Full source/target text and diff are submitted for independent whole-unit conservation review; wrapping/header/relative-path changes grant no truth approval. No source retirement, promotion or component-boundary change. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by committed line-diff correspondence with equal unit kind and ancestry (equal). Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding. Package at 2300d65571968bb3bcb80123a273272586e3f1db: pending target rebind by committed line-diff correspondence with equal unit kind and ancestry (equal). Full before/after and digests are in step10-sync2300-rebindings.json; historical approval does not cover the changed binding. L10 review correction: the doc-governance link is repointed to docs/platform/governance.md; its original legacy destination is not retained. Both label change and candidate referent are disclosed; pending independent review.",
  "after": "Source: docs/transitional-switchboard.md:112-119#unheaded-block-7 (current lines); unit SHA256 b6e2d59f4375e48f5ac79aa9807e336f672b11db5beb8b6b786512b62a782ef3.\nTarget: docs/platform/documentation/switchboard.md:111-118#unheaded-block-7 (current lines); unit SHA256 9d3f5ac3c5d03730ea68427c86f1e9e1b324a008486e9a3a1864e92f7c671672.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 9d3f5ac3c5d03730ea68427c86f1e9e1b324a008486e9a3a1864e92f7c671672 at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 6, target 6; 6 changed spellings/labels, 1 destination changes; 0 added, 0 removed.\nLink 1: \"docs/reading-map.md\" (reading-map.md) → \"docs/reading-map.md\" (../../reading-map.md); resolved docs/reading-map.md → docs/reading-map.md.\nLink 2: \"docs/platform/README.md\" (platform/README.md) → \"docs/platform/README.md\" (../README.md); resolved docs/platform/README.md → docs/platform/README.md.\nLink 3: \"docs/doc-governance.md\" (doc-governance.md) → \"docs/platform/governance.md\" (../governance.md); resolved docs/doc-governance.md → docs/platform/governance.md.\nLink 4: \"docs/platform/migration-authoring-rules.md\" (platform/migration-authoring-rules.md) → \"docs/platform/migration-authoring-rules.md\" (../migration-authoring-rules.md); resolved docs/platform/migration-authoring-rules.md → docs/platform/migration-authoring-rules.md.\nLink 5: \"plans/260925-documentation-authority-unification/current-authority-map-2026-09-25.md\" (../plans/260925-documentation-authority-unification/current-authority-map-2026-09-25.md) → \"plans/260925-documentation-authority-unification/current-authority-map-2026-09-25.md\" (../../../plans/260925-documentation-authority-unification/current-authority-map-2026-09-25.md); resolved plans/260925-documentation-authority-unification/current-authority-map-2026-09-25.md → plans/260925-documentation-authority-unification/current-authority-map-2026-09-25.md.\nLink 6: \"plans/260925-documentation-authority-unification/plan.md\" (../plans/260925-documentation-authority-unification/plan.md) → \"plans/260925-documentation-authority-unification/plan.md\" (../../../plans/260925-documentation-authority-unification/plan.md); resolved plans/260925-documentation-authority-unification/plan.md → plans/260925-documentation-authority-unification/plan.md.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/transitional-switchboard.md#unheaded-block-7 under docs/platform/documentation/switchboard.md#unheaded-block-7; source context \"Transitional Documentation Authority Switchboard / 5. Related Files\", target context \"Transitional Documentation Authority Switchboard / 5. Related Files\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "pending",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 655,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_e5cc66ff5930f04b7ebd9a8acbc52942",
    "sourceUnitDigest": "b6e2d59f4375e48f5ac79aa9807e336f672b11db5beb8b6b786512b62a782ef3",
    "targetOwner": "docs/platform/documentation/switchboard.md",
    "targetAnchor": "unheaded-block-7",
    "claimKind": "navigation",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/transitional-switchboard.md:112-119#unheaded-block-7 (current lines); unit SHA256 b6e2d59f4375e48f5ac79aa9807e336f672b11db5beb8b6b786512b62a782ef3.\nTarget: docs/platform/documentation/switchboard.md:111-118#unheaded-block-7 (current lines); unit SHA256 9d3f5ac3c5d03730ea68427c86f1e9e1b324a008486e9a3a1864e92f7c671672.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 9d3f5ac3c5d03730ea68427c86f1e9e1b324a008486e9a3a1864e92f7c671672 at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 6, target 6; 6 changed spellings/labels, 1 destination changes; 0 added, 0 removed.\nLink 1: \"docs/reading-map.md\" (reading-map.md) → \"docs/reading-map.md\" (../../reading-map.md); resolved docs/reading-map.md → docs/reading-map.md.\nLink 2: \"docs/platform/README.md\" (platform/README.md) → \"docs/platform/README.md\" (../README.md); resolved docs/platform/README.md → docs/platform/README.md.\nLink 3: \"docs/doc-governance.md\" (doc-governance.md) → \"docs/platform/governance.md\" (../governance.md); resolved docs/doc-governance.md → docs/platform/governance.md.\nLink 4: \"docs/platform/migration-authoring-rules.md\" (platform/migration-authoring-rules.md) → \"docs/platform/migration-authoring-rules.md\" (../migration-authoring-rules.md); resolved docs/platform/migration-authoring-rules.md → docs/platform/migration-authoring-rules.md.\nLink 5: \"plans/260925-documentation-authority-unification/current-authority-map-2026-09-25.md\" (../plans/260925-documentation-authority-unification/current-authority-map-2026-09-25.md) → \"plans/260925-documentation-authority-unification/current-authority-map-2026-09-25.md\" (../../../plans/260925-documentation-authority-unification/current-authority-map-2026-09-25.md); resolved plans/260925-documentation-authority-unification/current-authority-map-2026-09-25.md → plans/260925-documentation-authority-unification/current-authority-map-2026-09-25.md.\nLink 6: \"plans/260925-documentation-authority-unification/plan.md\" (../plans/260925-documentation-authority-unification/plan.md) → \"plans/260925-documentation-authority-unification/plan.md\" (../../../plans/260925-documentation-authority-unification/plan.md); resolved plans/260925-documentation-authority-unification/plan.md → plans/260925-documentation-authority-unification/plan.md.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/transitional-switchboard.md#unheaded-block-7 under docs/platform/documentation/switchboard.md#unheaded-block-7; source context \"Transitional Documentation Authority Switchboard / 5. Related Files\", target context \"Transitional Documentation Authority Switchboard / 5. Related Files\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "9d3f5ac3c5d03730ea68427c86f1e9e1b324a008486e9a3a1864e92f7c671672",
    "targetAncestry": [
      "Transitional Documentation Authority Switchboard",
      "5. Related Files"
    ]
  }
}
```

## Entry rationale-657

```json
{
  "entryId": "rationale-657",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s5-root-source-completion.json",
  "collection": "registryGaps",
  "claimId": "claim_4b96f4f42ea417623dcc794155fa17ce",
  "before": "A22 actual working target digest/anchor rebound. Full original/current units and decisions in reports/phase-06/step8-final-rework-accounting.json. Pending independent bounded review; no approval carry, source edit, promotion or cutover. L10-18/A31 author correction: current direct target changed by the disclosed source-link restoration, label correction, upstream re-carry or header bookkeeping. Current digest explicitly recorded pending independent re-review; native --rebind and full identity accounting owed next package.",
  "after": "Source: docs/architecture-manifest.json:1-260#file-block (historical witness at 1b818c5862ad1dd31f7d0961c25b5052419450bd); unit SHA256 c1c230462d8e6a3a59005658d279246afcdcee727e89f03ff08b0f9ce8b14e85.\nTarget: docs/platform/contracts/architecture-manifest.json:1-269#file-block (current lines); unit SHA256 2d55be82331318dd370052c80940458ce88894b98b049d626e41ba1bc6653b6a.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 2d55be82331318dd370052c80940458ce88894b98b049d626e41ba1bc6653b6a at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architecture-manifest.json#file-block under docs/platform/contracts/architecture-manifest.json#file-block; source context \"file-block\", target context \"file-block\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 656,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_4b96f4f42ea417623dcc794155fa17ce",
    "sourceUnitDigest": "c1c230462d8e6a3a59005658d279246afcdcee727e89f03ff08b0f9ce8b14e85",
    "claimKind": "contract",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "targetOwner": "docs/platform/contracts/architecture-manifest.json",
    "targetAnchor": "file-block",
    "rationale": "Source: docs/architecture-manifest.json:1-260#file-block (historical witness at 1b818c5862ad1dd31f7d0961c25b5052419450bd); unit SHA256 c1c230462d8e6a3a59005658d279246afcdcee727e89f03ff08b0f9ce8b14e85.\nTarget: docs/platform/contracts/architecture-manifest.json:1-269#file-block (current lines); unit SHA256 2d55be82331318dd370052c80940458ce88894b98b049d626e41ba1bc6653b6a.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 2d55be82331318dd370052c80940458ce88894b98b049d626e41ba1bc6653b6a at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architecture-manifest.json#file-block under docs/platform/contracts/architecture-manifest.json#file-block; source context \"file-block\", target context \"file-block\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "sourcePath": "docs/architecture-manifest.json",
    "sourceAnchor": "file-block",
    "targetUnitDigest": "2d55be82331318dd370052c80940458ce88894b98b049d626e41ba1bc6653b6a",
    "targetAncestry": []
  }
}
```

