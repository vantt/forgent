# Bounded re-review: rationales 8

Author session: `codex-session:unit-run-1792114313040-56132651@2026-10-16`
Packaged by: `codex-session:unit-run-1792116045118-73cfbb42@2026-10-16`
Content commit: `287a22d33a0eaf2d9e47549a1142daf62361bb8c` (author changes at `0d8c602e2`)
Comparison base: `5035fed52e60254ecbe034cc987553feb24616f4`
Entries: **60**; each request at most60 entries and400000 bytes.

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

## Entry rationale-421

```json
{
  "entryId": "rationale-421",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_af6831310fe9fcdaa7c8e69902e3c767",
  "before": "Partial carry of the direct source section docs/architect/host-invocation-routing/external-provider-protocol.md#1-component-classes at docs/platform/host-invocation-routing/architecture/external-provider-protocol.md#1-component-classes; surrounding content stays here. Remainder: The relocated passage of docs/architect/host-invocation-routing/external-provider-protocol.md#1-component-classes is retained verbatim at docs/platform/host-invocation-routing/architecture/release-boundaries.md#restored-class-definitions and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-7 (claim_d90840823918415e74ddd353dae32ea3; **Core component** — required for a useful fgOS release; owned by fgOS, released atomically with the host, normally statically linked once m); docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-8 (claim_2ce14ab31e5b889ce37c4e99735c69e5; **Packaged extension** — owned and shipped by fgOS but not required for a minimum useful release; may be enabled/disabled/omitted by configu); docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-10 (claim_95063c4b27e671f29631d4fd68427008; | Component class | Common invocation mechanism | Notes | |---|---|---| | Core component | Built-in after migration; LegacyNode during trans); docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-11 (claim_bb84143c32c84b94257bfeb7ca6dacd2; This classification blocks two mistakes: treating every statically linked implementation as architecturally core, and treating every out-of-). No source wording is discarded; this row does not claim the primary target alone contains the relocated passage.",
  "after": "Source: docs/architect/host-invocation-routing/external-provider-protocol.md:19-19#1-component-classes (current lines); unit SHA256 a180ac1d80159115a4f336ae648d311a92f7b2a09de392544c38273cf1ffa34f.\nTarget: docs/platform/host-invocation-routing/architecture/external-provider-protocol.md:77-77#1-component-classes (current lines); unit SHA256 fd51d86a3880f7da70c7e5791d50dfb1af4cd414023a70d924a3606a319e252f.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest fd51d86a3880f7da70c7e5791d50dfb1af4cd414023a70d924a3606a319e252f at 0c06e6e6b67a3897d660ee54de25fdc9971e59a4.\nLinks: source 0, target 1; 1 changed spellings/labels, 0 destination changes; 1 added, 0 removed.\nLink 1: \"none\" (none) → \"the dropped-005 restoration\" (release-boundaries.md#restored-class-definitions); resolved none → docs/platform/host-invocation-routing/architecture/release-boundaries.md#restored-class-definitions.\nHeading depth: 2 → 4; title \"1. Component Classes\" → \"1. Component Classes\".\nApplicable labelled corrections: none in this bound unit.\nDisposition partial-carry: Account for docs/architect/host-invocation-routing/external-provider-protocol.md#1-component-classes under docs/platform/host-invocation-routing/architecture/external-provider-protocol.md#1-component-classes; source context \"External Provider Protocol\", target context \"Architecture: External Provider Protocol / Retained selected source material / External Provider Protocol\". The source text occurs verbatim inside the bound target section; section-level unit digests differ. Recorded residual: The relocated passage of docs/architect/host-invocation-routing/external-provider-protocol.md#1-component-classes is retained verbatim at docs/platform/host-invocation-routing/architecture/release-boundaries.md#restored-class-definitions and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-7 (claim_d90840823918415e74ddd353dae32ea3; **Core component** — required for a useful fgOS release; owned by fgOS, released atomically with the host, normally statically linked once m); docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-8 (claim_2ce14ab31e5b889ce37c4e99735c69e5; **Packaged extension** — owned and shipped by fgOS but not required for a minimum useful release; may be enabled/disabled/omitted by configu); docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-10 (claim_95063c4b27e671f29631d4fd68427008; | Component class | Common invocation mechanism | Notes | |---|---|---| | Core component | Built-in after migration; LegacyNode during trans); docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-11 (claim_bb84143c32c84b94257bfeb7ca6dacd2; This classification blocks two mistakes: treating every statically linked implementation as architecturally core, and treating every out-of-)..\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 420,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_af6831310fe9fcdaa7c8e69902e3c767",
    "sourceUnitDigest": "a180ac1d80159115a4f336ae648d311a92f7b2a09de392544c38273cf1ffa34f",
    "claimKind": "contract",
    "kind": "architecture",
    "disposition": "partial-carry",
    "targetOwner": "docs/platform/host-invocation-routing/architecture/external-provider-protocol.md",
    "targetAnchor": "1-component-classes",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/external-provider-protocol.md:19-19#1-component-classes (current lines); unit SHA256 a180ac1d80159115a4f336ae648d311a92f7b2a09de392544c38273cf1ffa34f.\nTarget: docs/platform/host-invocation-routing/architecture/external-provider-protocol.md:77-77#1-component-classes (current lines); unit SHA256 fd51d86a3880f7da70c7e5791d50dfb1af4cd414023a70d924a3606a319e252f.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest fd51d86a3880f7da70c7e5791d50dfb1af4cd414023a70d924a3606a319e252f at 0c06e6e6b67a3897d660ee54de25fdc9971e59a4.\nLinks: source 0, target 1; 1 changed spellings/labels, 0 destination changes; 1 added, 0 removed.\nLink 1: \"none\" (none) → \"the dropped-005 restoration\" (release-boundaries.md#restored-class-definitions); resolved none → docs/platform/host-invocation-routing/architecture/release-boundaries.md#restored-class-definitions.\nHeading depth: 2 → 4; title \"1. Component Classes\" → \"1. Component Classes\".\nApplicable labelled corrections: none in this bound unit.\nDisposition partial-carry: Account for docs/architect/host-invocation-routing/external-provider-protocol.md#1-component-classes under docs/platform/host-invocation-routing/architecture/external-provider-protocol.md#1-component-classes; source context \"External Provider Protocol\", target context \"Architecture: External Provider Protocol / Retained selected source material / External Provider Protocol\". The source text occurs verbatim inside the bound target section; section-level unit digests differ. Recorded residual: The relocated passage of docs/architect/host-invocation-routing/external-provider-protocol.md#1-component-classes is retained verbatim at docs/platform/host-invocation-routing/architecture/release-boundaries.md#restored-class-definitions and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-7 (claim_d90840823918415e74ddd353dae32ea3; **Core component** — required for a useful fgOS release; owned by fgOS, released atomically with the host, normally statically linked once m); docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-8 (claim_2ce14ab31e5b889ce37c4e99735c69e5; **Packaged extension** — owned and shipped by fgOS but not required for a minimum useful release; may be enabled/disabled/omitted by configu); docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-10 (claim_95063c4b27e671f29631d4fd68427008; | Component class | Common invocation mechanism | Notes | |---|---|---| | Core component | Built-in after migration; LegacyNode during trans); docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-11 (claim_bb84143c32c84b94257bfeb7ca6dacd2; This classification blocks two mistakes: treating every statically linked implementation as architecturally core, and treating every out-of-)..\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "remainder": "The relocated passage of docs/architect/host-invocation-routing/external-provider-protocol.md#1-component-classes is retained verbatim at docs/platform/host-invocation-routing/architecture/release-boundaries.md#restored-class-definitions and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-7 (claim_d90840823918415e74ddd353dae32ea3; **Core component** — required for a useful fgOS release; owned by fgOS, released atomically with the host, normally statically linked once m); docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-8 (claim_2ce14ab31e5b889ce37c4e99735c69e5; **Packaged extension** — owned and shipped by fgOS but not required for a minimum useful release; may be enabled/disabled/omitted by configu); docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-10 (claim_95063c4b27e671f29631d4fd68427008; | Component class | Common invocation mechanism | Notes | |---|---|---| | Core component | Built-in after migration; LegacyNode during trans); docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-11 (claim_bb84143c32c84b94257bfeb7ca6dacd2; This classification blocks two mistakes: treating every statically linked implementation as architecturally core, and treating every out-of-).",
    "targetUnitDigest": "fd51d86a3880f7da70c7e5791d50dfb1af4cd414023a70d924a3606a319e252f",
    "targetAncestry": [
      "Architecture: External Provider Protocol",
      "Retained selected source material",
      "External Provider Protocol"
    ]
  }
}
```

## Entry rationale-422

```json
{
  "entryId": "rationale-422",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_d90840823918415e74ddd353dae32ea3",
  "before": "Move the complete direct unheaded-block unit \"**Core component** — required for a useful fgOS release; owned by fgOS, released atomically with the host, normally statically linked once migrated. Not optional and not \" from docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-7 to its frozen mapped owner docs/platform/host-invocation-routing/architecture/release-boundaries.md#unheaded-block-13. The literal restoration contains the complete pinned source span. The class/mechanism axes are preserved as design policy. ProviderDescriptor stores open string metadata; this citation does not prove every release/authority policy or example pack is enforced or shipped. Native counterpart class Judgment: no target digest match; independent full-text judgment remains required, not a script-proven approval.",
  "after": "Source: docs/architect/host-invocation-routing/external-provider-protocol.md:30-30#unheaded-block-7 (current lines); unit SHA256 ca3175301f93d1e7fd4591388e947fbf0ee82bac0c8052f27fcca200f4b992ab.\nTarget: docs/platform/host-invocation-routing/architecture/release-boundaries.md:106-108#unheaded-block-14 (current lines); unit SHA256 8726336468979ea33b99ca48587fd63d0a9de92528653b469166b727d669eef9.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 8726336468979ea33b99ca48587fd63d0a9de92528653b469166b727d669eef9 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-7 under docs/platform/host-invocation-routing/architecture/release-boundaries.md#unheaded-block-14; source context \"External Provider Protocol / 1. Component Classes\", target context \"Architecture: Release Boundaries / Restored class definitions\". The source text occurs verbatim inside the bound target section; section-level unit digests differ.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 421,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_d90840823918415e74ddd353dae32ea3",
    "sourceUnitDigest": "ca3175301f93d1e7fd4591388e947fbf0ee82bac0c8052f27fcca200f4b992ab",
    "claimKind": "contract",
    "kind": "architecture",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/architecture/release-boundaries.md",
    "targetAnchor": "unheaded-block-14",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/external-provider-protocol.md:30-30#unheaded-block-7 (current lines); unit SHA256 ca3175301f93d1e7fd4591388e947fbf0ee82bac0c8052f27fcca200f4b992ab.\nTarget: docs/platform/host-invocation-routing/architecture/release-boundaries.md:106-108#unheaded-block-14 (current lines); unit SHA256 8726336468979ea33b99ca48587fd63d0a9de92528653b469166b727d669eef9.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 8726336468979ea33b99ca48587fd63d0a9de92528653b469166b727d669eef9 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-7 under docs/platform/host-invocation-routing/architecture/release-boundaries.md#unheaded-block-14; source context \"External Provider Protocol / 1. Component Classes\", target context \"Architecture: Release Boundaries / Restored class definitions\". The source text occurs verbatim inside the bound target section; section-level unit digests differ.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "8726336468979ea33b99ca48587fd63d0a9de92528653b469166b727d669eef9"
  }
}
```

## Entry rationale-423

```json
{
  "entryId": "rationale-423",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_95063c4b27e671f29631d4fd68427008",
  "before": "Move the complete direct unheaded-block unit \"| Component class | Common invocation mechanism | Notes | |---|---|---| | Core component | Built-in after migration; LegacyNode during transition | Required, fgOS-owned, \" from docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-10 to its frozen mapped owner docs/platform/host-invocation-routing/architecture/release-boundaries.md#unheaded-block-15. The literal restoration contains the complete pinned source span. The class/mechanism axes are preserved as design policy. ProviderDescriptor stores open string metadata; this citation does not prove every release/authority policy or example pack is enforced or shipped. Native counterpart class Judgment: no target digest match; independent full-text judgment remains required, not a script-proven approval.",
  "after": "Source: docs/architect/host-invocation-routing/external-provider-protocol.md:36-40#unheaded-block-10 (current lines); unit SHA256 f57d1f9db82a03d77d5a7226ebc084f864232da06ef14aa014d72da08587aa29.\nTarget: docs/platform/host-invocation-routing/architecture/release-boundaries.md:114-120#unheaded-block-16 (current lines); unit SHA256 b73a8d7457c473f6265103183b3b10c0d07ac7de04d4e0d8664e500aa5275e99.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest b73a8d7457c473f6265103183b3b10c0d07ac7de04d4e0d8664e500aa5275e99 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-10 under docs/platform/host-invocation-routing/architecture/release-boundaries.md#unheaded-block-16; source context \"External Provider Protocol / 1. Component Classes\", target context \"Architecture: Release Boundaries / Restored class definitions\". The source text occurs verbatim inside the bound target section; section-level unit digests differ.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 422,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_95063c4b27e671f29631d4fd68427008",
    "sourceUnitDigest": "f57d1f9db82a03d77d5a7226ebc084f864232da06ef14aa014d72da08587aa29",
    "claimKind": "contract",
    "kind": "architecture",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/architecture/release-boundaries.md",
    "targetAnchor": "unheaded-block-16",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/external-provider-protocol.md:36-40#unheaded-block-10 (current lines); unit SHA256 f57d1f9db82a03d77d5a7226ebc084f864232da06ef14aa014d72da08587aa29.\nTarget: docs/platform/host-invocation-routing/architecture/release-boundaries.md:114-120#unheaded-block-16 (current lines); unit SHA256 b73a8d7457c473f6265103183b3b10c0d07ac7de04d4e0d8664e500aa5275e99.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest b73a8d7457c473f6265103183b3b10c0d07ac7de04d4e0d8664e500aa5275e99 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-10 under docs/platform/host-invocation-routing/architecture/release-boundaries.md#unheaded-block-16; source context \"External Provider Protocol / 1. Component Classes\", target context \"Architecture: Release Boundaries / Restored class definitions\". The source text occurs verbatim inside the bound target section; section-level unit digests differ.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "b73a8d7457c473f6265103183b3b10c0d07ac7de04d4e0d8664e500aa5275e99"
  }
}
```

## Entry rationale-424

```json
{
  "entryId": "rationale-424",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_bb84143c32c84b94257bfeb7ca6dacd2",
  "before": "Move the complete direct unheaded-block unit \"This classification blocks two mistakes: treating every statically linked implementation as architecturally core, and treating every out-of-process implementation as a us\" from docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-11 to its frozen mapped owner docs/platform/host-invocation-routing/architecture/release-boundaries.md#unheaded-block-16. The literal restoration contains the complete pinned source span. The class/mechanism axes are preserved as design policy. ProviderDescriptor stores open string metadata; this citation does not prove every release/authority policy or example pack is enforced or shipped. Native counterpart class Judgment: no target digest match; independent full-text judgment remains required, not a script-proven approval.",
  "after": "Source: docs/architect/host-invocation-routing/external-provider-protocol.md:42-42#unheaded-block-11 (current lines); unit SHA256 242f609e08654c18bbb6beb2af3941a88ac66d62f30d02a4d30832e425e609c4.\nTarget: docs/platform/host-invocation-routing/architecture/release-boundaries.md:122-124#unheaded-block-17 (current lines); unit SHA256 3e98835b0ff33fc28c7e5eba0d48522b6637cc0b1c1c89774a2091a2d98e4a84.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 3e98835b0ff33fc28c7e5eba0d48522b6637cc0b1c1c89774a2091a2d98e4a84 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-11 under docs/platform/host-invocation-routing/architecture/release-boundaries.md#unheaded-block-17; source context \"External Provider Protocol / 1. Component Classes\", target context \"Architecture: Release Boundaries / Restored class definitions\". The source text occurs verbatim inside the bound target section; section-level unit digests differ.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 423,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_bb84143c32c84b94257bfeb7ca6dacd2",
    "sourceUnitDigest": "242f609e08654c18bbb6beb2af3941a88ac66d62f30d02a4d30832e425e609c4",
    "claimKind": "contract",
    "kind": "architecture",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/architecture/release-boundaries.md",
    "targetAnchor": "unheaded-block-17",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/external-provider-protocol.md:42-42#unheaded-block-11 (current lines); unit SHA256 242f609e08654c18bbb6beb2af3941a88ac66d62f30d02a4d30832e425e609c4.\nTarget: docs/platform/host-invocation-routing/architecture/release-boundaries.md:122-124#unheaded-block-17 (current lines); unit SHA256 3e98835b0ff33fc28c7e5eba0d48522b6637cc0b1c1c89774a2091a2d98e4a84.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 3e98835b0ff33fc28c7e5eba0d48522b6637cc0b1c1c89774a2091a2d98e4a84 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-11 under docs/platform/host-invocation-routing/architecture/release-boundaries.md#unheaded-block-17; source context \"External Provider Protocol / 1. Component Classes\", target context \"Architecture: Release Boundaries / Restored class definitions\". The source text occurs verbatim inside the bound target section; section-level unit digests differ.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "3e98835b0ff33fc28c7e5eba0d48522b6637cc0b1c1c89774a2091a2d98e4a84"
  }
}
```

## Entry rationale-425

```json
{
  "entryId": "rationale-425",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_d5dd5fbdb3483914743a14791a5f02a8",
  "before": "Partial carry of the direct source section docs/architect/host-invocation-routing/external-provider-protocol.md#2-invocation-mechanisms at docs/platform/host-invocation-routing/architecture/external-provider-protocol.md#2-invocation-mechanisms; surrounding content stays here. Remainder: The relocated passage of docs/architect/host-invocation-routing/external-provider-protocol.md#2-invocation-mechanisms is retained verbatim at docs/platform/host-invocation-routing/architecture/release-boundaries.md#restored-class-definitions and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-12 (claim_3f7b5a5b5b1c39251e56f0d232e11ec3; ```rust enum Provider { BuiltIn(Arc<dyn OperationProvider>), ExternalProcess(ProcessRpcClient), ExternalWasm(WasmComponent), } `); docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-14 (claim_962d99a375bab41c2063612523bdf348; **Built-In** — a trusted Rust crate statically linked into the host binary, called through the `OperationProvider` trait. No serialization o); docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-15 (claim_f2755ef85799b9a6ec4fd4f5d03e9106; **External Process** — an independently installed, language-neutral plugin reached through persistent framed RPC (§3). Fits extensions needi); docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-16 (claim_66ce4edf221963b22ad02dbdf872da1c; **External WebAssembly** — a sandboxed plugin reached through a typed component interface such as WIT. Fits pure or tightly capability-scope); docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-17 (claim_8948a9c62d80ce2692687f3fcfbaf8ff; Native Rust dynamic libraries are not the default external mechanism: Rust has no stable ABI, and in-process third-party native code loses t). No source wording is discarded; this row does not claim the primary target alone contains the relocated passage.",
  "after": "Source: docs/architect/host-invocation-routing/external-provider-protocol.md:44-44#2-invocation-mechanisms (current lines); unit SHA256 19bd3465163fc281e12f6ac88d531d651ce0e8329d0485fa4536c107516305fe.\nTarget: docs/platform/host-invocation-routing/architecture/external-provider-protocol.md:97-97#2-invocation-mechanisms (current lines); unit SHA256 e7a9211054b328f165f59f75bfc1633b8b3a60a383afeff778f1eb2312f6d8a0.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest e7a9211054b328f165f59f75bfc1633b8b3a60a383afeff778f1eb2312f6d8a0 at 2b445a90693c6d5e9861a916be3279482f171a18.\nLinks: source 1, target 5; 5 changed spellings/labels, 1 destination changes; 4 added, 0 removed.\nLink 1: \"none\" (none) → \"the dropped-005 restoration\" (release-boundaries.md#restored-class-definitions); resolved none → docs/platform/host-invocation-routing/architecture/release-boundaries.md#restored-class-definitions.\nLink 2: \"Legacy CLI Transition\" (./legacy-cli-transition.md) → \"Legacy CLI Transition\" (legacy-cli-transition.md); resolved docs/architect/host-invocation-routing/legacy-cli-transition.md → docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md.\nLink 3: \"none\" (none) → \"the dropped-006 restoration\" (../contracts/component-protocol.md#restored-same-process-built-ins-vs-runtime-extensions-and-cross-process-cost); resolved none → docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-same-process-built-ins-vs-runtime-extensions-and-cross-process-cost.\nLink 4: \"none\" (none) → \"the dropped-006 restoration\" (../contracts/component-protocol.md#restored-same-process-built-ins-vs-runtime-extensions-and-cross-process-cost); resolved none → docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-same-process-built-ins-vs-runtime-extensions-and-cross-process-cost.\nLink 5: \"none\" (none) → \"the dropped-006 restoration\" (../contracts/component-protocol.md#restored-same-process-built-ins-vs-runtime-extensions-and-cross-process-cost); resolved none → docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-same-process-built-ins-vs-runtime-extensions-and-cross-process-cost.\nHeading depth: 2 → 4; title \"2. Invocation Mechanisms\" → \"2. Invocation Mechanisms\".\nApplicable labelled corrections: none in this bound unit.\nDisposition partial-carry: Account for docs/architect/host-invocation-routing/external-provider-protocol.md#2-invocation-mechanisms under docs/platform/host-invocation-routing/architecture/external-provider-protocol.md#2-invocation-mechanisms; source context \"External Provider Protocol\", target context \"Architecture: External Provider Protocol / Retained selected source material / External Provider Protocol\". The source text occurs verbatim inside the bound target section; section-level unit digests differ. Recorded residual: The relocated passage of docs/architect/host-invocation-routing/external-provider-protocol.md#2-invocation-mechanisms is retained verbatim at docs/platform/host-invocation-routing/architecture/release-boundaries.md#restored-class-definitions and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-12 (claim_3f7b5a5b5b1c39251e56f0d232e11ec3; ```rust enum Provider { BuiltIn(Arc<dyn OperationProvider>), ExternalProcess(ProcessRpcClient), ExternalWasm(WasmComponent), } `); docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-14 (claim_962d99a375bab41c2063612523bdf348; **Built-In** — a trusted Rust crate statically linked into the host binary, called through the `OperationProvider` trait. No serialization o); docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-15 (claim_f2755ef85799b9a6ec4fd4f5d03e9106; **External Process** — an independently installed, language-neutral plugin reached through persistent framed RPC (§3). Fits extensions needi); docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-16 (claim_66ce4edf221963b22ad02dbdf872da1c; **External WebAssembly** — a sandboxed plugin reached through a typed component interface such as WIT. Fits pure or tightly capability-scope); docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-17 (claim_8948a9c62d80ce2692687f3fcfbaf8ff; Native Rust dynamic libraries are not the default external mechanism: Rust has no stable ABI, and in-process third-party native code loses t)..\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 424,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_d5dd5fbdb3483914743a14791a5f02a8",
    "sourceUnitDigest": "19bd3465163fc281e12f6ac88d531d651ce0e8329d0485fa4536c107516305fe",
    "claimKind": "contract",
    "kind": "architecture",
    "disposition": "partial-carry",
    "targetOwner": "docs/platform/host-invocation-routing/architecture/external-provider-protocol.md",
    "targetAnchor": "2-invocation-mechanisms",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/external-provider-protocol.md:44-44#2-invocation-mechanisms (current lines); unit SHA256 19bd3465163fc281e12f6ac88d531d651ce0e8329d0485fa4536c107516305fe.\nTarget: docs/platform/host-invocation-routing/architecture/external-provider-protocol.md:97-97#2-invocation-mechanisms (current lines); unit SHA256 e7a9211054b328f165f59f75bfc1633b8b3a60a383afeff778f1eb2312f6d8a0.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest e7a9211054b328f165f59f75bfc1633b8b3a60a383afeff778f1eb2312f6d8a0 at 2b445a90693c6d5e9861a916be3279482f171a18.\nLinks: source 1, target 5; 5 changed spellings/labels, 1 destination changes; 4 added, 0 removed.\nLink 1: \"none\" (none) → \"the dropped-005 restoration\" (release-boundaries.md#restored-class-definitions); resolved none → docs/platform/host-invocation-routing/architecture/release-boundaries.md#restored-class-definitions.\nLink 2: \"Legacy CLI Transition\" (./legacy-cli-transition.md) → \"Legacy CLI Transition\" (legacy-cli-transition.md); resolved docs/architect/host-invocation-routing/legacy-cli-transition.md → docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md.\nLink 3: \"none\" (none) → \"the dropped-006 restoration\" (../contracts/component-protocol.md#restored-same-process-built-ins-vs-runtime-extensions-and-cross-process-cost); resolved none → docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-same-process-built-ins-vs-runtime-extensions-and-cross-process-cost.\nLink 4: \"none\" (none) → \"the dropped-006 restoration\" (../contracts/component-protocol.md#restored-same-process-built-ins-vs-runtime-extensions-and-cross-process-cost); resolved none → docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-same-process-built-ins-vs-runtime-extensions-and-cross-process-cost.\nLink 5: \"none\" (none) → \"the dropped-006 restoration\" (../contracts/component-protocol.md#restored-same-process-built-ins-vs-runtime-extensions-and-cross-process-cost); resolved none → docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-same-process-built-ins-vs-runtime-extensions-and-cross-process-cost.\nHeading depth: 2 → 4; title \"2. Invocation Mechanisms\" → \"2. Invocation Mechanisms\".\nApplicable labelled corrections: none in this bound unit.\nDisposition partial-carry: Account for docs/architect/host-invocation-routing/external-provider-protocol.md#2-invocation-mechanisms under docs/platform/host-invocation-routing/architecture/external-provider-protocol.md#2-invocation-mechanisms; source context \"External Provider Protocol\", target context \"Architecture: External Provider Protocol / Retained selected source material / External Provider Protocol\". The source text occurs verbatim inside the bound target section; section-level unit digests differ. Recorded residual: The relocated passage of docs/architect/host-invocation-routing/external-provider-protocol.md#2-invocation-mechanisms is retained verbatim at docs/platform/host-invocation-routing/architecture/release-boundaries.md#restored-class-definitions and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-12 (claim_3f7b5a5b5b1c39251e56f0d232e11ec3; ```rust enum Provider { BuiltIn(Arc<dyn OperationProvider>), ExternalProcess(ProcessRpcClient), ExternalWasm(WasmComponent), } `); docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-14 (claim_962d99a375bab41c2063612523bdf348; **Built-In** — a trusted Rust crate statically linked into the host binary, called through the `OperationProvider` trait. No serialization o); docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-15 (claim_f2755ef85799b9a6ec4fd4f5d03e9106; **External Process** — an independently installed, language-neutral plugin reached through persistent framed RPC (§3). Fits extensions needi); docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-16 (claim_66ce4edf221963b22ad02dbdf872da1c; **External WebAssembly** — a sandboxed plugin reached through a typed component interface such as WIT. Fits pure or tightly capability-scope); docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-17 (claim_8948a9c62d80ce2692687f3fcfbaf8ff; Native Rust dynamic libraries are not the default external mechanism: Rust has no stable ABI, and in-process third-party native code loses t)..\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "remainder": "The relocated passage of docs/architect/host-invocation-routing/external-provider-protocol.md#2-invocation-mechanisms is retained verbatim at docs/platform/host-invocation-routing/architecture/release-boundaries.md#restored-class-definitions and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-12 (claim_3f7b5a5b5b1c39251e56f0d232e11ec3; ```rust enum Provider { BuiltIn(Arc<dyn OperationProvider>), ExternalProcess(ProcessRpcClient), ExternalWasm(WasmComponent), } `); docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-14 (claim_962d99a375bab41c2063612523bdf348; **Built-In** — a trusted Rust crate statically linked into the host binary, called through the `OperationProvider` trait. No serialization o); docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-15 (claim_f2755ef85799b9a6ec4fd4f5d03e9106; **External Process** — an independently installed, language-neutral plugin reached through persistent framed RPC (§3). Fits extensions needi); docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-16 (claim_66ce4edf221963b22ad02dbdf872da1c; **External WebAssembly** — a sandboxed plugin reached through a typed component interface such as WIT. Fits pure or tightly capability-scope); docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-17 (claim_8948a9c62d80ce2692687f3fcfbaf8ff; Native Rust dynamic libraries are not the default external mechanism: Rust has no stable ABI, and in-process third-party native code loses t).",
    "targetUnitDigest": "e7a9211054b328f165f59f75bfc1633b8b3a60a383afeff778f1eb2312f6d8a0",
    "targetAncestry": [
      "Architecture: External Provider Protocol",
      "Retained selected source material",
      "External Provider Protocol"
    ]
  }
}
```

## Entry rationale-426

```json
{
  "entryId": "rationale-426",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_3f7b5a5b5b1c39251e56f0d232e11ec3",
  "before": "Move the complete direct unheaded-block unit \"```rust enum Provider { BuiltIn(Arc<dyn OperationProvider>), ExternalProcess(ProcessRpcClient), ExternalWasm(WasmComponent), } ```\" from docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-12 to its frozen mapped owner docs/platform/host-invocation-routing/architecture/release-boundaries.md#unheaded-block-17. The literal restoration contains the complete pinned source span. The class/mechanism axes are preserved as design policy. ProviderDescriptor stores open string metadata; this citation does not prove every release/authority policy or example pack is enforced or shipped. Native counterpart class Judgment: no target digest match; independent full-text judgment remains required, not a script-proven approval.",
  "after": "Source: docs/architect/host-invocation-routing/external-provider-protocol.md:46-52#unheaded-block-12 (current lines); unit SHA256 d09d58dd69d2e8725c47283982c08f0adf224cec74a505042ce7c7a9631c1c05.\nTarget: docs/platform/host-invocation-routing/architecture/release-boundaries.md:126-134#unheaded-block-18 (current lines); unit SHA256 3da997bcd8918278b3621a1c24864aecf416acee475c99fec3afd04fb1063d58.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 3da997bcd8918278b3621a1c24864aecf416acee475c99fec3afd04fb1063d58 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-12 under docs/platform/host-invocation-routing/architecture/release-boundaries.md#unheaded-block-18; source context \"External Provider Protocol / 2. Invocation Mechanisms\", target context \"Architecture: Release Boundaries / Restored class definitions\". The source text occurs verbatim inside the bound target section; section-level unit digests differ.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 425,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_3f7b5a5b5b1c39251e56f0d232e11ec3",
    "sourceUnitDigest": "d09d58dd69d2e8725c47283982c08f0adf224cec74a505042ce7c7a9631c1c05",
    "claimKind": "contract",
    "kind": "architecture",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/architecture/release-boundaries.md",
    "targetAnchor": "unheaded-block-18",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/external-provider-protocol.md:46-52#unheaded-block-12 (current lines); unit SHA256 d09d58dd69d2e8725c47283982c08f0adf224cec74a505042ce7c7a9631c1c05.\nTarget: docs/platform/host-invocation-routing/architecture/release-boundaries.md:126-134#unheaded-block-18 (current lines); unit SHA256 3da997bcd8918278b3621a1c24864aecf416acee475c99fec3afd04fb1063d58.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 3da997bcd8918278b3621a1c24864aecf416acee475c99fec3afd04fb1063d58 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-12 under docs/platform/host-invocation-routing/architecture/release-boundaries.md#unheaded-block-18; source context \"External Provider Protocol / 2. Invocation Mechanisms\", target context \"Architecture: Release Boundaries / Restored class definitions\". The source text occurs verbatim inside the bound target section; section-level unit digests differ.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "3da997bcd8918278b3621a1c24864aecf416acee475c99fec3afd04fb1063d58"
  }
}
```

## Entry rationale-427

```json
{
  "entryId": "rationale-427",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_962d99a375bab41c2063612523bdf348",
  "before": "Move the complete direct unheaded-block unit \"**Built-In** — a trusted Rust crate statically linked into the host binary, called through the `OperationProvider` trait. No serialization or cross-process cost; still ob\" from docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-14 to its frozen mapped owner docs/platform/host-invocation-routing/architecture/release-boundaries.md#unheaded-block-18. The literal restoration contains the complete pinned source span. The class/mechanism axes are preserved as design policy. ProviderDescriptor stores open string metadata; this citation does not prove every release/authority policy or example pack is enforced or shipped. Native counterpart class Judgment: no target digest match; independent full-text judgment remains required, not a script-proven approval.",
  "after": "Source: docs/architect/host-invocation-routing/external-provider-protocol.md:56-56#unheaded-block-14 (current lines); unit SHA256 ad59236e4c47fac38590ed404ef23f56d3525321141a1c30bc19a7196c86b27d.\nTarget: docs/platform/host-invocation-routing/architecture/release-boundaries.md:136-138#unheaded-block-19 (current lines); unit SHA256 28063dfbfde3d042943f471867eb0e590c37428feebb7e4bde144cedbbf03f0e.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 28063dfbfde3d042943f471867eb0e590c37428feebb7e4bde144cedbbf03f0e at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-14 under docs/platform/host-invocation-routing/architecture/release-boundaries.md#unheaded-block-19; source context \"External Provider Protocol / 2. Invocation Mechanisms\", target context \"Architecture: Release Boundaries / Restored class definitions\". The source text occurs verbatim inside the bound target section; section-level unit digests differ.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 426,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_962d99a375bab41c2063612523bdf348",
    "sourceUnitDigest": "ad59236e4c47fac38590ed404ef23f56d3525321141a1c30bc19a7196c86b27d",
    "claimKind": "contract",
    "kind": "architecture",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/architecture/release-boundaries.md",
    "targetAnchor": "unheaded-block-19",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/external-provider-protocol.md:56-56#unheaded-block-14 (current lines); unit SHA256 ad59236e4c47fac38590ed404ef23f56d3525321141a1c30bc19a7196c86b27d.\nTarget: docs/platform/host-invocation-routing/architecture/release-boundaries.md:136-138#unheaded-block-19 (current lines); unit SHA256 28063dfbfde3d042943f471867eb0e590c37428feebb7e4bde144cedbbf03f0e.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 28063dfbfde3d042943f471867eb0e590c37428feebb7e4bde144cedbbf03f0e at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-14 under docs/platform/host-invocation-routing/architecture/release-boundaries.md#unheaded-block-19; source context \"External Provider Protocol / 2. Invocation Mechanisms\", target context \"Architecture: Release Boundaries / Restored class definitions\". The source text occurs verbatim inside the bound target section; section-level unit digests differ.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "28063dfbfde3d042943f471867eb0e590c37428feebb7e4bde144cedbbf03f0e"
  }
}
```

## Entry rationale-428

```json
{
  "entryId": "rationale-428",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_f2755ef85799b9a6ec4fd4f5d03e9106",
  "before": "Move the complete direct unheaded-block unit \"**External Process** — an independently installed, language-neutral plugin reached through persistent framed RPC (§3). Fits extensions needing filesystem, Git, network, s\" from docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-15 to its frozen mapped owner docs/platform/host-invocation-routing/architecture/release-boundaries.md#unheaded-block-19. The literal restoration contains the complete pinned source span. The class/mechanism axes are preserved as design policy. ProviderDescriptor stores open string metadata; this citation does not prove every release/authority policy or example pack is enforced or shipped. Native counterpart class Judgment: no target digest match; independent full-text judgment remains required, not a script-proven approval.",
  "after": "Source: docs/architect/host-invocation-routing/external-provider-protocol.md:58-58#unheaded-block-15 (current lines); unit SHA256 e0492b4f17e96958b01aace4d3033f0cee43b21404128dd13a56f82072066ccb.\nTarget: docs/platform/host-invocation-routing/architecture/release-boundaries.md:140-142#unheaded-block-20 (current lines); unit SHA256 5e13fbf6b82041abbdcc4dde206304a30dec6c264e25c744d5ef22677e9f15ac.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 5e13fbf6b82041abbdcc4dde206304a30dec6c264e25c744d5ef22677e9f15ac at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-15 under docs/platform/host-invocation-routing/architecture/release-boundaries.md#unheaded-block-20; source context \"External Provider Protocol / 2. Invocation Mechanisms\", target context \"Architecture: Release Boundaries / Restored class definitions\". The source text occurs verbatim inside the bound target section; section-level unit digests differ.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 427,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_f2755ef85799b9a6ec4fd4f5d03e9106",
    "sourceUnitDigest": "e0492b4f17e96958b01aace4d3033f0cee43b21404128dd13a56f82072066ccb",
    "claimKind": "contract",
    "kind": "architecture",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/architecture/release-boundaries.md",
    "targetAnchor": "unheaded-block-20",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/external-provider-protocol.md:58-58#unheaded-block-15 (current lines); unit SHA256 e0492b4f17e96958b01aace4d3033f0cee43b21404128dd13a56f82072066ccb.\nTarget: docs/platform/host-invocation-routing/architecture/release-boundaries.md:140-142#unheaded-block-20 (current lines); unit SHA256 5e13fbf6b82041abbdcc4dde206304a30dec6c264e25c744d5ef22677e9f15ac.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 5e13fbf6b82041abbdcc4dde206304a30dec6c264e25c744d5ef22677e9f15ac at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-15 under docs/platform/host-invocation-routing/architecture/release-boundaries.md#unheaded-block-20; source context \"External Provider Protocol / 2. Invocation Mechanisms\", target context \"Architecture: Release Boundaries / Restored class definitions\". The source text occurs verbatim inside the bound target section; section-level unit digests differ.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "5e13fbf6b82041abbdcc4dde206304a30dec6c264e25c744d5ef22677e9f15ac"
  }
}
```

## Entry rationale-429

```json
{
  "entryId": "rationale-429",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_66ce4edf221963b22ad02dbdf872da1c",
  "before": "Move the complete direct unheaded-block unit \"**External WebAssembly** — a sandboxed plugin reached through a typed component interface such as WIT. Fits pure or tightly capability-scoped extensions. Required host fu\" from docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-16 to its frozen mapped owner docs/platform/host-invocation-routing/architecture/release-boundaries.md#unheaded-block-20. The literal restoration contains the complete pinned source span. The class/mechanism axes are preserved as design policy. ProviderDescriptor stores open string metadata; this citation does not prove every release/authority policy or example pack is enforced or shipped. Native counterpart class Judgment: no target digest match; independent full-text judgment remains required, not a script-proven approval.",
  "after": "Source: docs/architect/host-invocation-routing/external-provider-protocol.md:60-60#unheaded-block-16 (current lines); unit SHA256 4188ad667cd103dbf687bae37f8981faf863dd2ec0de70679a79193e58c28522.\nTarget: docs/platform/host-invocation-routing/architecture/release-boundaries.md:144-146#unheaded-block-21 (current lines); unit SHA256 438edf5341c9e187a6b5810fb958a7889e4267b684f3d9921b2670a8ca545481.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 438edf5341c9e187a6b5810fb958a7889e4267b684f3d9921b2670a8ca545481 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-16 under docs/platform/host-invocation-routing/architecture/release-boundaries.md#unheaded-block-21; source context \"External Provider Protocol / 2. Invocation Mechanisms\", target context \"Architecture: Release Boundaries / Restored class definitions\". The source text occurs verbatim inside the bound target section; section-level unit digests differ.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 428,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_66ce4edf221963b22ad02dbdf872da1c",
    "sourceUnitDigest": "4188ad667cd103dbf687bae37f8981faf863dd2ec0de70679a79193e58c28522",
    "claimKind": "contract",
    "kind": "architecture",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/architecture/release-boundaries.md",
    "targetAnchor": "unheaded-block-21",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/external-provider-protocol.md:60-60#unheaded-block-16 (current lines); unit SHA256 4188ad667cd103dbf687bae37f8981faf863dd2ec0de70679a79193e58c28522.\nTarget: docs/platform/host-invocation-routing/architecture/release-boundaries.md:144-146#unheaded-block-21 (current lines); unit SHA256 438edf5341c9e187a6b5810fb958a7889e4267b684f3d9921b2670a8ca545481.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 438edf5341c9e187a6b5810fb958a7889e4267b684f3d9921b2670a8ca545481 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-16 under docs/platform/host-invocation-routing/architecture/release-boundaries.md#unheaded-block-21; source context \"External Provider Protocol / 2. Invocation Mechanisms\", target context \"Architecture: Release Boundaries / Restored class definitions\". The source text occurs verbatim inside the bound target section; section-level unit digests differ.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "438edf5341c9e187a6b5810fb958a7889e4267b684f3d9921b2670a8ca545481"
  }
}
```

## Entry rationale-430

```json
{
  "entryId": "rationale-430",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_8948a9c62d80ce2692687f3fcfbaf8ff",
  "before": "Move the complete direct unheaded-block unit \"Native Rust dynamic libraries are not the default external mechanism: Rust has no stable ABI, and in-process third-party native code loses the crash/memory isolation proc\" from docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-17 to its frozen mapped owner docs/platform/host-invocation-routing/architecture/release-boundaries.md#unheaded-block-21. The literal restoration contains the complete pinned source span. The class/mechanism axes are preserved as design policy. ProviderDescriptor stores open string metadata; this citation does not prove every release/authority policy or example pack is enforced or shipped. Native counterpart class Judgment: no target digest match; independent full-text judgment remains required, not a script-proven approval.",
  "after": "Source: docs/architect/host-invocation-routing/external-provider-protocol.md:62-62#unheaded-block-17 (current lines); unit SHA256 f32d862a6e98405216984764ea4f4899b64449d161c74e938f23d9b3e83281ed.\nTarget: docs/platform/host-invocation-routing/architecture/release-boundaries.md:148-150#unheaded-block-22 (current lines); unit SHA256 4d5eb89ed283ce4f938956e515228eea393c127dfe2fca7b2853e7b711b7d900.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 4d5eb89ed283ce4f938956e515228eea393c127dfe2fca7b2853e7b711b7d900 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-17 under docs/platform/host-invocation-routing/architecture/release-boundaries.md#unheaded-block-22; source context \"External Provider Protocol / 2. Invocation Mechanisms\", target context \"Architecture: Release Boundaries / Restored class definitions\". The source text occurs verbatim inside the bound target section; section-level unit digests differ.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 429,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_8948a9c62d80ce2692687f3fcfbaf8ff",
    "sourceUnitDigest": "f32d862a6e98405216984764ea4f4899b64449d161c74e938f23d9b3e83281ed",
    "claimKind": "contract",
    "kind": "architecture",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/architecture/release-boundaries.md",
    "targetAnchor": "unheaded-block-22",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/external-provider-protocol.md:62-62#unheaded-block-17 (current lines); unit SHA256 f32d862a6e98405216984764ea4f4899b64449d161c74e938f23d9b3e83281ed.\nTarget: docs/platform/host-invocation-routing/architecture/release-boundaries.md:148-150#unheaded-block-22 (current lines); unit SHA256 4d5eb89ed283ce4f938956e515228eea393c127dfe2fca7b2853e7b711b7d900.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 4d5eb89ed283ce4f938956e515228eea393c127dfe2fca7b2853e7b711b7d900 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-17 under docs/platform/host-invocation-routing/architecture/release-boundaries.md#unheaded-block-22; source context \"External Provider Protocol / 2. Invocation Mechanisms\", target context \"Architecture: Release Boundaries / Restored class definitions\". The source text occurs verbatim inside the bound target section; section-level unit digests differ.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "4d5eb89ed283ce4f938956e515228eea393c127dfe2fca7b2853e7b711b7d900"
  }
}
```

## Entry rationale-431

```json
{
  "entryId": "rationale-431",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_8066684d5e7c7159d6f58caeef26d8cc",
  "before": "Partial carry of the direct source section docs/architect/host-invocation-routing/external-provider-protocol.md#3-component-protocol at docs/platform/host-invocation-routing/architecture/external-provider-protocol.md#3-component-protocol; surrounding content stays here. Remainder: The relocated passage of docs/architect/host-invocation-routing/external-provider-protocol.md#3-component-protocol is retained verbatim at docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-semantic-contract-stays-transport-neutral and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-25 (claim_d1c4102dc6dea3ae86434fb12c0abf71; The semantic contract stays transport-neutral: a future binary codec or local socket transport may replace framing without renaming the oper). No source wording is discarded; this row does not claim the primary target alone contains the relocated passage.",
  "after": "Source: docs/architect/host-invocation-routing/external-provider-protocol.md:72-72#3-component-protocol (current lines); unit SHA256 4788de97424c5b1035cf2384d427ef5a7694dfbae3af9c94f73cf5dcf4420ea6.\nTarget: docs/platform/host-invocation-routing/architecture/external-provider-protocol.md:122-122#3-component-protocol (current lines); unit SHA256 7cf43dd0dccf83e356b760c88da2576ecb1eb4cf9219caaf09a95ff12d2fd5a8.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 7cf43dd0dccf83e356b760c88da2576ecb1eb4cf9219caaf09a95ff12d2fd5a8 at 0c06e6e6b67a3897d660ee54de25fdc9971e59a4.\nLinks: source 0, target 1; 1 changed spellings/labels, 0 destination changes; 1 added, 0 removed.\nLink 1: \"none\" (none) → \"the dropped-007 restoration\" (../contracts/component-protocol.md#restored-semantic-contract-stays-transport-neutral); resolved none → docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-semantic-contract-stays-transport-neutral.\nHeading depth: 2 → 4; title \"3. Component Protocol\" → \"3. Component Protocol\".\nApplicable labelled corrections: none in this bound unit.\nDisposition partial-carry: Account for docs/architect/host-invocation-routing/external-provider-protocol.md#3-component-protocol under docs/platform/host-invocation-routing/architecture/external-provider-protocol.md#3-component-protocol; source context \"External Provider Protocol\", target context \"Architecture: External Provider Protocol / Retained selected source material / External Provider Protocol\". The source text occurs verbatim inside the bound target section; section-level unit digests differ. Recorded residual: The relocated passage of docs/architect/host-invocation-routing/external-provider-protocol.md#3-component-protocol is retained verbatim at docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-semantic-contract-stays-transport-neutral and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-25 (claim_d1c4102dc6dea3ae86434fb12c0abf71; The semantic contract stays transport-neutral: a future binary codec or local socket transport may replace framing without renaming the oper)..\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 430,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_8066684d5e7c7159d6f58caeef26d8cc",
    "sourceUnitDigest": "4788de97424c5b1035cf2384d427ef5a7694dfbae3af9c94f73cf5dcf4420ea6",
    "claimKind": "contract",
    "kind": "architecture",
    "disposition": "partial-carry",
    "targetOwner": "docs/platform/host-invocation-routing/architecture/external-provider-protocol.md",
    "targetAnchor": "3-component-protocol",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/external-provider-protocol.md:72-72#3-component-protocol (current lines); unit SHA256 4788de97424c5b1035cf2384d427ef5a7694dfbae3af9c94f73cf5dcf4420ea6.\nTarget: docs/platform/host-invocation-routing/architecture/external-provider-protocol.md:122-122#3-component-protocol (current lines); unit SHA256 7cf43dd0dccf83e356b760c88da2576ecb1eb4cf9219caaf09a95ff12d2fd5a8.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 7cf43dd0dccf83e356b760c88da2576ecb1eb4cf9219caaf09a95ff12d2fd5a8 at 0c06e6e6b67a3897d660ee54de25fdc9971e59a4.\nLinks: source 0, target 1; 1 changed spellings/labels, 0 destination changes; 1 added, 0 removed.\nLink 1: \"none\" (none) → \"the dropped-007 restoration\" (../contracts/component-protocol.md#restored-semantic-contract-stays-transport-neutral); resolved none → docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-semantic-contract-stays-transport-neutral.\nHeading depth: 2 → 4; title \"3. Component Protocol\" → \"3. Component Protocol\".\nApplicable labelled corrections: none in this bound unit.\nDisposition partial-carry: Account for docs/architect/host-invocation-routing/external-provider-protocol.md#3-component-protocol under docs/platform/host-invocation-routing/architecture/external-provider-protocol.md#3-component-protocol; source context \"External Provider Protocol\", target context \"Architecture: External Provider Protocol / Retained selected source material / External Provider Protocol\". The source text occurs verbatim inside the bound target section; section-level unit digests differ. Recorded residual: The relocated passage of docs/architect/host-invocation-routing/external-provider-protocol.md#3-component-protocol is retained verbatim at docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-semantic-contract-stays-transport-neutral and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-25 (claim_d1c4102dc6dea3ae86434fb12c0abf71; The semantic contract stays transport-neutral: a future binary codec or local socket transport may replace framing without renaming the oper)..\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "remainder": "The relocated passage of docs/architect/host-invocation-routing/external-provider-protocol.md#3-component-protocol is retained verbatim at docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-semantic-contract-stays-transport-neutral and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-25 (claim_d1c4102dc6dea3ae86434fb12c0abf71; The semantic contract stays transport-neutral: a future binary codec or local socket transport may replace framing without renaming the oper).",
    "targetUnitDigest": "7cf43dd0dccf83e356b760c88da2576ecb1eb4cf9219caaf09a95ff12d2fd5a8",
    "targetAncestry": [
      "Architecture: External Provider Protocol",
      "Retained selected source material",
      "External Provider Protocol"
    ]
  }
}
```

## Entry rationale-432

```json
{
  "entryId": "rationale-432",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_9a5781f0086209a17330035ff0e58638",
  "before": "Partial carry of the direct source section docs/architect/host-invocation-routing/external-provider-protocol.md#4-plugin-registry-linker at docs/platform/host-invocation-routing/architecture/external-provider-protocol.md#4-plugin-registry-linker; surrounding content stays here. Remainder: The relocated passage of docs/architect/host-invocation-routing/external-provider-protocol.md#4-plugin-registry-linker is retained verbatim at docs/platform/host-invocation-routing/verification/compatibility-harness.md#restored-registry-linker-procedure-and-its-input-output-formula and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-32 (claim_08172f75766eb1d002d4cba2669f9bbd; The registry linker: scans configured global and project plugin locations; parses and validates manifests without running the provider; veri); docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-33 (claim_7e15be77fb7c4bff223728491df3e212; Its complete input/output physics:); docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-34 (claim_0f401249972ad0ce465e24e0932a2834; ```txt authored OperationCatalog + built-in provider descriptors + transitional CLI-compatibility bindings + validated external manifest dec). No source wording is discarded; this row does not claim the primary target alone contains the relocated passage.",
  "after": "Source: docs/architect/host-invocation-routing/external-provider-protocol.md:103-103#4-plugin-registry-linker (current lines); unit SHA256 f26fe2980e00f599ee3395a67dd57972d0ef8371bf0219fde39bb7f44b353a4c.\nTarget: docs/platform/host-invocation-routing/architecture/external-provider-protocol.md:155-155#4-plugin-registry-linker (current lines); unit SHA256 cda1c088745776953a5144a0548869d897c54e9f69dcd512de6ad8359b99ed32.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest cda1c088745776953a5144a0548869d897c54e9f69dcd512de6ad8359b99ed32 at 0c06e6e6b67a3897d660ee54de25fdc9971e59a4.\nLinks: source 0, target 1; 1 changed spellings/labels, 0 destination changes; 1 added, 0 removed.\nLink 1: \"none\" (none) → \"the dropped-008 restoration\" (../verification/compatibility-harness.md#restored-registry-linker-procedure-and-its-input-output-formula); resolved none → docs/platform/host-invocation-routing/verification/compatibility-harness.md#restored-registry-linker-procedure-and-its-input-output-formula.\nHeading depth: 2 → 4; title \"4. Plugin Registry Linker\" → \"4. Plugin Registry Linker\".\nApplicable labelled corrections: none in this bound unit.\nDisposition partial-carry: Account for docs/architect/host-invocation-routing/external-provider-protocol.md#4-plugin-registry-linker under docs/platform/host-invocation-routing/architecture/external-provider-protocol.md#4-plugin-registry-linker; source context \"External Provider Protocol\", target context \"Architecture: External Provider Protocol / Retained selected source material / External Provider Protocol\". The source text occurs verbatim inside the bound target section; section-level unit digests differ. Recorded residual: The relocated passage of docs/architect/host-invocation-routing/external-provider-protocol.md#4-plugin-registry-linker is retained verbatim at docs/platform/host-invocation-routing/verification/compatibility-harness.md#restored-registry-linker-procedure-and-its-input-output-formula and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-32 (claim_08172f75766eb1d002d4cba2669f9bbd; The registry linker: scans configured global and project plugin locations; parses and validates manifests without running the provider; veri); docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-33 (claim_7e15be77fb7c4bff223728491df3e212; Its complete input/output physics:); docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-34 (claim_0f401249972ad0ce465e24e0932a2834; ```txt authored OperationCatalog + built-in provider descriptors + transitional CLI-compatibility bindings + validated external manifest dec)..\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 431,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_9a5781f0086209a17330035ff0e58638",
    "sourceUnitDigest": "f26fe2980e00f599ee3395a67dd57972d0ef8371bf0219fde39bb7f44b353a4c",
    "claimKind": "contract",
    "kind": "architecture",
    "disposition": "partial-carry",
    "targetOwner": "docs/platform/host-invocation-routing/architecture/external-provider-protocol.md",
    "targetAnchor": "4-plugin-registry-linker",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/external-provider-protocol.md:103-103#4-plugin-registry-linker (current lines); unit SHA256 f26fe2980e00f599ee3395a67dd57972d0ef8371bf0219fde39bb7f44b353a4c.\nTarget: docs/platform/host-invocation-routing/architecture/external-provider-protocol.md:155-155#4-plugin-registry-linker (current lines); unit SHA256 cda1c088745776953a5144a0548869d897c54e9f69dcd512de6ad8359b99ed32.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest cda1c088745776953a5144a0548869d897c54e9f69dcd512de6ad8359b99ed32 at 0c06e6e6b67a3897d660ee54de25fdc9971e59a4.\nLinks: source 0, target 1; 1 changed spellings/labels, 0 destination changes; 1 added, 0 removed.\nLink 1: \"none\" (none) → \"the dropped-008 restoration\" (../verification/compatibility-harness.md#restored-registry-linker-procedure-and-its-input-output-formula); resolved none → docs/platform/host-invocation-routing/verification/compatibility-harness.md#restored-registry-linker-procedure-and-its-input-output-formula.\nHeading depth: 2 → 4; title \"4. Plugin Registry Linker\" → \"4. Plugin Registry Linker\".\nApplicable labelled corrections: none in this bound unit.\nDisposition partial-carry: Account for docs/architect/host-invocation-routing/external-provider-protocol.md#4-plugin-registry-linker under docs/platform/host-invocation-routing/architecture/external-provider-protocol.md#4-plugin-registry-linker; source context \"External Provider Protocol\", target context \"Architecture: External Provider Protocol / Retained selected source material / External Provider Protocol\". The source text occurs verbatim inside the bound target section; section-level unit digests differ. Recorded residual: The relocated passage of docs/architect/host-invocation-routing/external-provider-protocol.md#4-plugin-registry-linker is retained verbatim at docs/platform/host-invocation-routing/verification/compatibility-harness.md#restored-registry-linker-procedure-and-its-input-output-formula and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-32 (claim_08172f75766eb1d002d4cba2669f9bbd; The registry linker: scans configured global and project plugin locations; parses and validates manifests without running the provider; veri); docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-33 (claim_7e15be77fb7c4bff223728491df3e212; Its complete input/output physics:); docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-34 (claim_0f401249972ad0ce465e24e0932a2834; ```txt authored OperationCatalog + built-in provider descriptors + transitional CLI-compatibility bindings + validated external manifest dec)..\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "remainder": "The relocated passage of docs/architect/host-invocation-routing/external-provider-protocol.md#4-plugin-registry-linker is retained verbatim at docs/platform/host-invocation-routing/verification/compatibility-harness.md#restored-registry-linker-procedure-and-its-input-output-formula and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-32 (claim_08172f75766eb1d002d4cba2669f9bbd; The registry linker: scans configured global and project plugin locations; parses and validates manifests without running the provider; veri); docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-33 (claim_7e15be77fb7c4bff223728491df3e212; Its complete input/output physics:); docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-34 (claim_0f401249972ad0ce465e24e0932a2834; ```txt authored OperationCatalog + built-in provider descriptors + transitional CLI-compatibility bindings + validated external manifest dec).",
    "targetUnitDigest": "cda1c088745776953a5144a0548869d897c54e9f69dcd512de6ad8359b99ed32",
    "targetAncestry": [
      "Architecture: External Provider Protocol",
      "Retained selected source material",
      "External Provider Protocol"
    ]
  }
}
```

## Entry rationale-433

```json
{
  "entryId": "rationale-433",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_0ad7cac649772e91b98de923b0e597e0",
  "before": "Move the complete direct unheaded-block unit \"**Status:** Vision / architecture advisory, not a locked platform law and not an implementation plan. **Date:** 2026-09-10. **Revised:** per [architecture-review-260910-1\" from docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-1 to its frozen mapped owner docs/platform/host-invocation-routing/spec.md#unheaded-block-14. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Weak-exact: ancestor headings differ; independent full-text judgment remains required, not a script-proven approval.",
  "after": "Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md:3-6#unheaded-block-1 (current lines); unit SHA256 b5d90a2f82ebb7b1b4cc9fb4d388233e24a26f68be6ed5ee2990b783e1a36a62.\nTarget: docs/platform/host-invocation-routing/spec.md:108-111#unheaded-block-15 (current lines); unit SHA256 b5d90a2f82ebb7b1b4cc9fb4d388233e24a26f68be6ed5ee2990b783e1a36a62.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest b5d90a2f82ebb7b1b4cc9fb4d388233e24a26f68be6ed5ee2990b783e1a36a62 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 1, target 1; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-1 under docs/platform/host-invocation-routing/spec.md#unheaded-block-15; source context \"Host Invocation And Provider Routing Architecture\", target context \"Spec: Host Invocation / Retained selected source material / Host Invocation And Provider Routing Architecture\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 432,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_0ad7cac649772e91b98de923b0e597e0",
    "sourceUnitDigest": "b5d90a2f82ebb7b1b4cc9fb4d388233e24a26f68be6ed5ee2990b783e1a36a62",
    "claimKind": "architecture",
    "kind": "spec",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/spec.md",
    "targetAnchor": "unheaded-block-15",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md:3-6#unheaded-block-1 (current lines); unit SHA256 b5d90a2f82ebb7b1b4cc9fb4d388233e24a26f68be6ed5ee2990b783e1a36a62.\nTarget: docs/platform/host-invocation-routing/spec.md:108-111#unheaded-block-15 (current lines); unit SHA256 b5d90a2f82ebb7b1b4cc9fb4d388233e24a26f68be6ed5ee2990b783e1a36a62.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest b5d90a2f82ebb7b1b4cc9fb4d388233e24a26f68be6ed5ee2990b783e1a36a62 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 1, target 1; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-1 under docs/platform/host-invocation-routing/spec.md#unheaded-block-15; source context \"Host Invocation And Provider Routing Architecture\", target context \"Spec: Host Invocation / Retained selected source material / Host Invocation And Provider Routing Architecture\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "b5d90a2f82ebb7b1b4cc9fb4d388233e24a26f68be6ed5ee2990b783e1a36a62"
  }
}
```

## Entry rationale-434

```json
{
  "entryId": "rationale-434",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_25109471da4be0edce65a48735584744",
  "before": "Move the complete direct unheaded-block unit \"This is the **kernel contract**: the permanent invocation/routing boundary every fgOS host uses, independent of transport (CLI, remote, chat) and provider mechanism (buil\" from docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-2 to its frozen mapped owner docs/platform/host-invocation-routing/spec.md#unheaded-block-15. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Judgment: no target digest match; independent full-text judgment remains required, not a script-proven approval.",
  "after": "Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md:8-8#unheaded-block-2 (current lines); unit SHA256 263529054aa9edd37b53b2d574601fea6822560b99f33037ede797b501a19d6c.\nTarget: docs/platform/host-invocation-routing/spec.md:113-113#unheaded-block-16 (current lines); unit SHA256 2cff589467aa2eec7d4ff55e5c87a0253580aa770e0deabe5f4b4a45c2588ac7.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 2cff589467aa2eec7d4ff55e5c87a0253580aa770e0deabe5f4b4a45c2588ac7 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 4, target 4; 4 changed spellings/labels, 4 destination changes; 0 added, 0 removed.\nLink 1: \"External Provider Protocol\" (./external-provider-protocol.md) → \"External Provider Protocol\" (architecture/external-provider-protocol.md); resolved docs/architect/host-invocation-routing/external-provider-protocol.md → docs/platform/host-invocation-routing/architecture/external-provider-protocol.md.\nLink 2: \"Legacy CLI Transition\" (./legacy-cli-transition.md) → \"Legacy CLI Transition\" (architecture/legacy-cli-transition.md); resolved docs/architect/host-invocation-routing/legacy-cli-transition.md → docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md.\nLink 3: \"Node To Rust Component Migration\" (./node-to-rust-component-migration.md) → \"Node To Rust Component Migration\" (architecture/node-to-rust-migration.md); resolved docs/architect/host-invocation-routing/node-to-rust-component-migration.md → docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md.\nLink 4: \"Rust Host And Proof Providers Implementation Plan\" (./rust-cli-and-proof-components-plan.md) → \"Rust Host And Proof Providers Implementation Plan\" (roadmap.md); resolved docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md → docs/platform/host-invocation-routing/roadmap.md.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-2 under docs/platform/host-invocation-routing/spec.md#unheaded-block-16; source context \"Host Invocation And Provider Routing Architecture\", target context \"Spec: Host Invocation / Retained selected source material / Host Invocation And Provider Routing Architecture\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 433,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_25109471da4be0edce65a48735584744",
    "sourceUnitDigest": "263529054aa9edd37b53b2d574601fea6822560b99f33037ede797b501a19d6c",
    "claimKind": "contract",
    "kind": "spec",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/spec.md",
    "targetAnchor": "unheaded-block-16",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md:8-8#unheaded-block-2 (current lines); unit SHA256 263529054aa9edd37b53b2d574601fea6822560b99f33037ede797b501a19d6c.\nTarget: docs/platform/host-invocation-routing/spec.md:113-113#unheaded-block-16 (current lines); unit SHA256 2cff589467aa2eec7d4ff55e5c87a0253580aa770e0deabe5f4b4a45c2588ac7.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 2cff589467aa2eec7d4ff55e5c87a0253580aa770e0deabe5f4b4a45c2588ac7 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 4, target 4; 4 changed spellings/labels, 4 destination changes; 0 added, 0 removed.\nLink 1: \"External Provider Protocol\" (./external-provider-protocol.md) → \"External Provider Protocol\" (architecture/external-provider-protocol.md); resolved docs/architect/host-invocation-routing/external-provider-protocol.md → docs/platform/host-invocation-routing/architecture/external-provider-protocol.md.\nLink 2: \"Legacy CLI Transition\" (./legacy-cli-transition.md) → \"Legacy CLI Transition\" (architecture/legacy-cli-transition.md); resolved docs/architect/host-invocation-routing/legacy-cli-transition.md → docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md.\nLink 3: \"Node To Rust Component Migration\" (./node-to-rust-component-migration.md) → \"Node To Rust Component Migration\" (architecture/node-to-rust-migration.md); resolved docs/architect/host-invocation-routing/node-to-rust-component-migration.md → docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md.\nLink 4: \"Rust Host And Proof Providers Implementation Plan\" (./rust-cli-and-proof-components-plan.md) → \"Rust Host And Proof Providers Implementation Plan\" (roadmap.md); resolved docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md → docs/platform/host-invocation-routing/roadmap.md.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-2 under docs/platform/host-invocation-routing/spec.md#unheaded-block-16; source context \"Host Invocation And Provider Routing Architecture\", target context \"Spec: Host Invocation / Retained selected source material / Host Invocation And Provider Routing Architecture\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "2cff589467aa2eec7d4ff55e5c87a0253580aa770e0deabe5f4b4a45c2588ac7"
  }
}
```

## Entry rationale-435

```json
{
  "entryId": "rationale-435",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_e96351fa78113b589f25b1b0b55e1623",
  "before": "Move the complete direct unheaded-block unit \"Named **Host Invocation And Provider Routing**; central component the **Operation Provider Router**. `Component Router` is avoided — not every component is a dispatchable\" from docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-4 to its frozen mapped owner docs/platform/host-invocation-routing/spec.md#unheaded-block-17. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Weak-exact: ancestor headings differ; independent full-text judgment remains required, not a script-proven approval.",
  "after": "Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md:26-26#unheaded-block-4 (current lines); unit SHA256 32916e9588f39ae68a35a1ff0999655fc82b1f34310657518907f22b5a03390b.\nTarget: docs/platform/host-invocation-routing/spec.md:132-132#unheaded-block-18 (current lines); unit SHA256 32916e9588f39ae68a35a1ff0999655fc82b1f34310657518907f22b5a03390b.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 32916e9588f39ae68a35a1ff0999655fc82b1f34310657518907f22b5a03390b at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-4 under docs/platform/host-invocation-routing/spec.md#unheaded-block-18; source context \"Host Invocation And Provider Routing Architecture / 1. Architecture Name\", target context \"Spec: Host Invocation / Retained selected source material / Host Invocation And Provider Routing Architecture / 1. Architecture Name\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 434,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_e96351fa78113b589f25b1b0b55e1623",
    "sourceUnitDigest": "32916e9588f39ae68a35a1ff0999655fc82b1f34310657518907f22b5a03390b",
    "claimKind": "architecture",
    "kind": "spec",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/spec.md",
    "targetAnchor": "unheaded-block-18",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md:26-26#unheaded-block-4 (current lines); unit SHA256 32916e9588f39ae68a35a1ff0999655fc82b1f34310657518907f22b5a03390b.\nTarget: docs/platform/host-invocation-routing/spec.md:132-132#unheaded-block-18 (current lines); unit SHA256 32916e9588f39ae68a35a1ff0999655fc82b1f34310657518907f22b5a03390b.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 32916e9588f39ae68a35a1ff0999655fc82b1f34310657518907f22b5a03390b at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-4 under docs/platform/host-invocation-routing/spec.md#unheaded-block-18; source context \"Host Invocation And Provider Routing Architecture / 1. Architecture Name\", target context \"Spec: Host Invocation / Retained selected source material / Host Invocation And Provider Routing Architecture / 1. Architecture Name\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "32916e9588f39ae68a35a1ff0999655fc82b1f34310657518907f22b5a03390b"
  }
}
```

## Entry rationale-436

```json
{
  "entryId": "rationale-436",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_0c88f05863191f643e3e9ad87275f0de",
  "before": "Move the complete direct unheaded-block unit \"```txt host invocation -> a transport-specific host use case admits/normalizes a request provider routing -> the Operation Provider Router selects an implementation ```\" from docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-5 to its frozen mapped owner docs/platform/host-invocation-routing/spec.md#unheaded-block-18. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Weak-exact: ancestor headings differ; independent full-text judgment remains required, not a script-proven approval.",
  "after": "Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md:28-31#unheaded-block-5 (current lines); unit SHA256 7cbf6d62da646f840071185dbbfa44a317c8f0860306c5545d2b20f9d57427c1.\nTarget: docs/platform/host-invocation-routing/spec.md:134-137#unheaded-block-19 (current lines); unit SHA256 7cbf6d62da646f840071185dbbfa44a317c8f0860306c5545d2b20f9d57427c1.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 7cbf6d62da646f840071185dbbfa44a317c8f0860306c5545d2b20f9d57427c1 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-5 under docs/platform/host-invocation-routing/spec.md#unheaded-block-19; source context \"Host Invocation And Provider Routing Architecture / 1. Architecture Name\", target context \"Spec: Host Invocation / Retained selected source material / Host Invocation And Provider Routing Architecture / 1. Architecture Name\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 435,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_0c88f05863191f643e3e9ad87275f0de",
    "sourceUnitDigest": "7cbf6d62da646f840071185dbbfa44a317c8f0860306c5545d2b20f9d57427c1",
    "claimKind": "architecture",
    "kind": "spec",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/spec.md",
    "targetAnchor": "unheaded-block-19",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md:28-31#unheaded-block-5 (current lines); unit SHA256 7cbf6d62da646f840071185dbbfa44a317c8f0860306c5545d2b20f9d57427c1.\nTarget: docs/platform/host-invocation-routing/spec.md:134-137#unheaded-block-19 (current lines); unit SHA256 7cbf6d62da646f840071185dbbfa44a317c8f0860306c5545d2b20f9d57427c1.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 7cbf6d62da646f840071185dbbfa44a317c8f0860306c5545d2b20f9d57427c1 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-5 under docs/platform/host-invocation-routing/spec.md#unheaded-block-19; source context \"Host Invocation And Provider Routing Architecture / 1. Architecture Name\", target context \"Spec: Host Invocation / Retained selected source material / Host Invocation And Provider Routing Architecture / 1. Architecture Name\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "7cbf6d62da646f840071185dbbfa44a317c8f0860306c5545d2b20f9d57427c1"
  }
}
```

## Entry rationale-437

```json
{
  "entryId": "rationale-437",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_722917cd4b4e98c8e6ed1498c02a752c",
  "before": "Move the complete direct unheaded-block unit \"fgOS has more than one entry surface (local CLI, remote REST/MCP, chat) that may request the same semantic operation but differ in parsing, auth context, streaming, and r\" from docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-6 to its frozen mapped owner docs/platform/host-invocation-routing/spec.md#unheaded-block-19. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Weak-exact: ancestor headings differ; independent full-text judgment remains required, not a script-proven approval.",
  "after": "Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md:35-35#unheaded-block-6 (current lines); unit SHA256 7d588a9680394fcef9f90b7da5cb1c8e0b2e3f81e836447d12b7fd1f61612580.\nTarget: docs/platform/host-invocation-routing/spec.md:141-141#unheaded-block-20 (current lines); unit SHA256 7d588a9680394fcef9f90b7da5cb1c8e0b2e3f81e836447d12b7fd1f61612580.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 7d588a9680394fcef9f90b7da5cb1c8e0b2e3f81e836447d12b7fd1f61612580 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-6 under docs/platform/host-invocation-routing/spec.md#unheaded-block-20; source context \"Host Invocation And Provider Routing Architecture / 2. Problem And Scope\", target context \"Spec: Host Invocation / Retained selected source material / Host Invocation And Provider Routing Architecture / 2. Problem And Scope\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 436,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_722917cd4b4e98c8e6ed1498c02a752c",
    "sourceUnitDigest": "7d588a9680394fcef9f90b7da5cb1c8e0b2e3f81e836447d12b7fd1f61612580",
    "claimKind": "architecture",
    "kind": "spec",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/spec.md",
    "targetAnchor": "unheaded-block-20",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md:35-35#unheaded-block-6 (current lines); unit SHA256 7d588a9680394fcef9f90b7da5cb1c8e0b2e3f81e836447d12b7fd1f61612580.\nTarget: docs/platform/host-invocation-routing/spec.md:141-141#unheaded-block-20 (current lines); unit SHA256 7d588a9680394fcef9f90b7da5cb1c8e0b2e3f81e836447d12b7fd1f61612580.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 7d588a9680394fcef9f90b7da5cb1c8e0b2e3f81e836447d12b7fd1f61612580 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-6 under docs/platform/host-invocation-routing/spec.md#unheaded-block-20; source context \"Host Invocation And Provider Routing Architecture / 2. Problem And Scope\", target context \"Spec: Host Invocation / Retained selected source material / Host Invocation And Provider Routing Architecture / 2. Problem And Scope\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "7d588a9680394fcef9f90b7da5cb1c8e0b2e3f81e836447d12b7fd1f61612580"
  }
}
```

## Entry rationale-438

```json
{
  "entryId": "rationale-438",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_04aa8f5405a6c04bb829d2b8057f91cf",
  "before": "Move the complete direct unheaded-block unit \"One name per concept; no alias appears anywhere in this document or its two companions.\" from docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-7 to its frozen mapped owner docs/platform/host-invocation-routing/spec.md#unheaded-block-20. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Weak-exact: ancestor headings differ; independent full-text judgment remains required, not a script-proven approval.",
  "after": "Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md:39-39#unheaded-block-7 (current lines); unit SHA256 061cc20a9f12cb32b8977768d432e50b03d608b2d8dc70666ad4935d4b6596a7.\nTarget: docs/platform/host-invocation-routing/spec.md:145-145#unheaded-block-21 (current lines); unit SHA256 061cc20a9f12cb32b8977768d432e50b03d608b2d8dc70666ad4935d4b6596a7.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 061cc20a9f12cb32b8977768d432e50b03d608b2d8dc70666ad4935d4b6596a7 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-7 under docs/platform/host-invocation-routing/spec.md#unheaded-block-21; source context \"Host Invocation And Provider Routing Architecture / 3. Canonical Names\", target context \"Spec: Host Invocation / Retained selected source material / Host Invocation And Provider Routing Architecture / 3. Canonical Names\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 437,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_04aa8f5405a6c04bb829d2b8057f91cf",
    "sourceUnitDigest": "061cc20a9f12cb32b8977768d432e50b03d608b2d8dc70666ad4935d4b6596a7",
    "claimKind": "architecture",
    "kind": "spec",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/spec.md",
    "targetAnchor": "unheaded-block-21",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md:39-39#unheaded-block-7 (current lines); unit SHA256 061cc20a9f12cb32b8977768d432e50b03d608b2d8dc70666ad4935d4b6596a7.\nTarget: docs/platform/host-invocation-routing/spec.md:145-145#unheaded-block-21 (current lines); unit SHA256 061cc20a9f12cb32b8977768d432e50b03d608b2d8dc70666ad4935d4b6596a7.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 061cc20a9f12cb32b8977768d432e50b03d608b2d8dc70666ad4935d4b6596a7 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-7 under docs/platform/host-invocation-routing/spec.md#unheaded-block-21; source context \"Host Invocation And Provider Routing Architecture / 3. Canonical Names\", target context \"Spec: Host Invocation / Retained selected source material / Host Invocation And Provider Routing Architecture / 3. Canonical Names\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "061cc20a9f12cb32b8977768d432e50b03d608b2d8dc70666ad4935d4b6596a7"
  }
}
```

## Entry rationale-439

```json
{
  "entryId": "rationale-439",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_6ccdb5afe9aeb2433d51be563f10c206",
  "before": "Move the complete direct unheaded-block unit \"| Name | What it is | |---|---| | `OperationId` | Stable semantic identifier, independent of CLI/REST/MCP spelling (§5). | | `HostInvocation` | Host/caller context (ident\" from docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-8 to its frozen mapped owner docs/platform/host-invocation-routing/spec.md#unheaded-block-21. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Judgment: no target digest match; independent full-text judgment remains required, not a script-proven approval.",
  "after": "Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md:41-59#unheaded-block-8 (current lines); unit SHA256 8b5d36ce46b660f2c8694b6895b8d16dafd3f70bc7a34cecce5e589b7fa70901.\nTarget: docs/platform/host-invocation-routing/spec.md:147-165#unheaded-block-22 (current lines); unit SHA256 98701b4e24e5105f7035c458a7c558f911dc522ebeb1a476c2c0417a65435e6d.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 98701b4e24e5105f7035c458a7c558f911dc522ebeb1a476c2c0417a65435e6d at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 1, target 1; 1 changed spellings/labels, 1 destination changes; 0 added, 0 removed.\nLink 1: \"Legacy CLI Transition\" (./legacy-cli-transition.md) → \"Legacy CLI Transition\" (architecture/legacy-cli-transition.md); resolved docs/architect/host-invocation-routing/legacy-cli-transition.md → docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-8 under docs/platform/host-invocation-routing/spec.md#unheaded-block-22; source context \"Host Invocation And Provider Routing Architecture / 3. Canonical Names\", target context \"Spec: Host Invocation / Retained selected source material / Host Invocation And Provider Routing Architecture / 3. Canonical Names\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 438,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_6ccdb5afe9aeb2433d51be563f10c206",
    "sourceUnitDigest": "8b5d36ce46b660f2c8694b6895b8d16dafd3f70bc7a34cecce5e589b7fa70901",
    "claimKind": "architecture",
    "kind": "spec",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/spec.md",
    "targetAnchor": "unheaded-block-22",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md:41-59#unheaded-block-8 (current lines); unit SHA256 8b5d36ce46b660f2c8694b6895b8d16dafd3f70bc7a34cecce5e589b7fa70901.\nTarget: docs/platform/host-invocation-routing/spec.md:147-165#unheaded-block-22 (current lines); unit SHA256 98701b4e24e5105f7035c458a7c558f911dc522ebeb1a476c2c0417a65435e6d.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 98701b4e24e5105f7035c458a7c558f911dc522ebeb1a476c2c0417a65435e6d at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 1, target 1; 1 changed spellings/labels, 1 destination changes; 0 added, 0 removed.\nLink 1: \"Legacy CLI Transition\" (./legacy-cli-transition.md) → \"Legacy CLI Transition\" (architecture/legacy-cli-transition.md); resolved docs/architect/host-invocation-routing/legacy-cli-transition.md → docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-8 under docs/platform/host-invocation-routing/spec.md#unheaded-block-22; source context \"Host Invocation And Provider Routing Architecture / 3. Canonical Names\", target context \"Spec: Host Invocation / Retained selected source material / Host Invocation And Provider Routing Architecture / 3. Canonical Names\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "98701b4e24e5105f7035c458a7c558f911dc522ebeb1a476c2c0417a65435e6d"
  }
}
```

## Entry rationale-440

```json
{
  "entryId": "rationale-440",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_c4100e9f00123b488f2793cf48044cd9",
  "before": "Move the complete direct unheaded-block unit \"`cli-host-use-case`, `remote-host-use-case`, and `chat-host-use-case` are peers; none wraps, shells out to, or calls through another.\" from docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-9 to its frozen mapped owner docs/platform/host-invocation-routing/spec.md#unheaded-block-22. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Weak-exact: ancestor headings differ; independent full-text judgment remains required, not a script-proven approval.",
  "after": "Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md:63-63#unheaded-block-9 (current lines); unit SHA256 1bca3e6e539055095d6f4343ce2ebd8cbf2a038e2c180124c6c231edbd8b9015.\nTarget: docs/platform/host-invocation-routing/spec.md:169-169#unheaded-block-23 (current lines); unit SHA256 1bca3e6e539055095d6f4343ce2ebd8cbf2a038e2c180124c6c231edbd8b9015.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 1bca3e6e539055095d6f4343ce2ebd8cbf2a038e2c180124c6c231edbd8b9015 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-9 under docs/platform/host-invocation-routing/spec.md#unheaded-block-23; source context \"Host Invocation And Provider Routing Architecture / 4. Peer Host Use Cases\", target context \"Spec: Host Invocation / Retained selected source material / Host Invocation And Provider Routing Architecture / 4. Peer Host Use Cases\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 439,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_c4100e9f00123b488f2793cf48044cd9",
    "sourceUnitDigest": "1bca3e6e539055095d6f4343ce2ebd8cbf2a038e2c180124c6c231edbd8b9015",
    "claimKind": "architecture",
    "kind": "spec",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/spec.md",
    "targetAnchor": "unheaded-block-23",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md:63-63#unheaded-block-9 (current lines); unit SHA256 1bca3e6e539055095d6f4343ce2ebd8cbf2a038e2c180124c6c231edbd8b9015.\nTarget: docs/platform/host-invocation-routing/spec.md:169-169#unheaded-block-23 (current lines); unit SHA256 1bca3e6e539055095d6f4343ce2ebd8cbf2a038e2c180124c6c231edbd8b9015.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 1bca3e6e539055095d6f4343ce2ebd8cbf2a038e2c180124c6c231edbd8b9015 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-9 under docs/platform/host-invocation-routing/spec.md#unheaded-block-23; source context \"Host Invocation And Provider Routing Architecture / 4. Peer Host Use Cases\", target context \"Spec: Host Invocation / Retained selected source material / Host Invocation And Provider Routing Architecture / 4. Peer Host Use Cases\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "1bca3e6e539055095d6f4343ce2ebd8cbf2a038e2c180124c6c231edbd8b9015"
  }
}
```

## Entry rationale-441

```json
{
  "entryId": "rationale-441",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_e4b8bd07e3f3a75850b54f7d8d4398e3",
  "before": "Move the complete direct unheaded-block unit \"```mermaid flowchart LR CLI[CLI adapter] --> LOOKUP[CommandRouteDescriptor lookup] LOOKUP -. legacy-cli: exec Node payload .-> NODE[Node payload] LOOKUP --> CH[cli-host-u\" from docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-10 to its frozen mapped owner docs/platform/host-invocation-routing/spec.md#unheaded-block-23. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Weak-exact: ancestor headings differ; independent full-text judgment remains required, not a script-proven approval.",
  "after": "Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md:65-81#unheaded-block-10 (current lines); unit SHA256 3bbdfed554473aa0c5ccbd37993b22c011ecda496a9aff540d899e7a93caaa0b.\nTarget: docs/platform/host-invocation-routing/spec.md:171-187#unheaded-block-24 (current lines); unit SHA256 3bbdfed554473aa0c5ccbd37993b22c011ecda496a9aff540d899e7a93caaa0b.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 3bbdfed554473aa0c5ccbd37993b22c011ecda496a9aff540d899e7a93caaa0b at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-10 under docs/platform/host-invocation-routing/spec.md#unheaded-block-24; source context \"Host Invocation And Provider Routing Architecture / 4. Peer Host Use Cases\", target context \"Spec: Host Invocation / Retained selected source material / Host Invocation And Provider Routing Architecture / 4. Peer Host Use Cases\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 440,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_e4b8bd07e3f3a75850b54f7d8d4398e3",
    "sourceUnitDigest": "3bbdfed554473aa0c5ccbd37993b22c011ecda496a9aff540d899e7a93caaa0b",
    "claimKind": "architecture",
    "kind": "spec",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/spec.md",
    "targetAnchor": "unheaded-block-24",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md:65-81#unheaded-block-10 (current lines); unit SHA256 3bbdfed554473aa0c5ccbd37993b22c011ecda496a9aff540d899e7a93caaa0b.\nTarget: docs/platform/host-invocation-routing/spec.md:171-187#unheaded-block-24 (current lines); unit SHA256 3bbdfed554473aa0c5ccbd37993b22c011ecda496a9aff540d899e7a93caaa0b.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 3bbdfed554473aa0c5ccbd37993b22c011ecda496a9aff540d899e7a93caaa0b at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-10 under docs/platform/host-invocation-routing/spec.md#unheaded-block-24; source context \"Host Invocation And Provider Routing Architecture / 4. Peer Host Use Cases\", target context \"Spec: Host Invocation / Retained selected source material / Host Invocation And Provider Routing Architecture / 4. Peer Host Use Cases\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "3bbdfed554473aa0c5ccbd37993b22c011ecda496a9aff540d899e7a93caaa0b"
  }
}
```

## Entry rationale-442

```json
{
  "entryId": "rationale-442",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_1c089a156e3b49003be410a6b22277b6",
  "before": "Move the complete direct unheaded-block unit \"The dashed lookup/direct-exec arrow to \"Node payload\" is the only non-`OperationRequest`/`ProviderOutcome` path and never touches `InvocationService` or the router — see \" from docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-11 to its frozen mapped owner docs/platform/host-invocation-routing/spec.md#unheaded-block-24. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Weak-exact: ancestor headings differ; independent full-text judgment remains required, not a script-proven approval.",
  "after": "Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md:83-83#unheaded-block-11 (current lines); unit SHA256 43bcb99a6f6b7a54f8ed1713967aa1daca5df6f863144ae80232a90ae6a931ac.\nTarget: docs/platform/host-invocation-routing/spec.md:189-189#unheaded-block-25 (current lines); unit SHA256 43bcb99a6f6b7a54f8ed1713967aa1daca5df6f863144ae80232a90ae6a931ac.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 43bcb99a6f6b7a54f8ed1713967aa1daca5df6f863144ae80232a90ae6a931ac at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-11 under docs/platform/host-invocation-routing/spec.md#unheaded-block-25; source context \"Host Invocation And Provider Routing Architecture / 4. Peer Host Use Cases\", target context \"Spec: Host Invocation / Retained selected source material / Host Invocation And Provider Routing Architecture / 4. Peer Host Use Cases\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 441,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_1c089a156e3b49003be410a6b22277b6",
    "sourceUnitDigest": "43bcb99a6f6b7a54f8ed1713967aa1daca5df6f863144ae80232a90ae6a931ac",
    "claimKind": "architecture",
    "kind": "spec",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/spec.md",
    "targetAnchor": "unheaded-block-25",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md:83-83#unheaded-block-11 (current lines); unit SHA256 43bcb99a6f6b7a54f8ed1713967aa1daca5df6f863144ae80232a90ae6a931ac.\nTarget: docs/platform/host-invocation-routing/spec.md:189-189#unheaded-block-25 (current lines); unit SHA256 43bcb99a6f6b7a54f8ed1713967aa1daca5df6f863144ae80232a90ae6a931ac.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 43bcb99a6f6b7a54f8ed1713967aa1daca5df6f863144ae80232a90ae6a931ac at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-11 under docs/platform/host-invocation-routing/spec.md#unheaded-block-25; source context \"Host Invocation And Provider Routing Architecture / 4. Peer Host Use Cases\", target context \"Spec: Host Invocation / Retained selected source material / Host Invocation And Provider Routing Architecture / 4. Peer Host Use Cases\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "43bcb99a6f6b7a54f8ed1713967aa1daca5df6f863144ae80232a90ae6a931ac"
  }
}
```

## Entry rationale-443

```json
{
  "entryId": "rationale-443",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_409136e69870a5b65fad1c316d27b2de",
  "before": "Move the complete direct unheaded-block unit \"| Host use case | Owns | Never does | |---|---|---| | `cli-host-use-case` | CLI options; verb -> `OperationId`; terminal stdio; `fgos.v1`/exit-code presentation; `Command\" from docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-12 to its frozen mapped owner docs/platform/host-invocation-routing/spec.md#unheaded-block-25. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Weak-exact: ancestor headings differ; independent full-text judgment remains required, not a script-proven approval.",
  "after": "Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md:85-89#unheaded-block-12 (current lines); unit SHA256 56bf6c6625c4e7566434dca9188acf80bc7b2b72b9583df8ac29a2e4380c7875.\nTarget: docs/platform/host-invocation-routing/spec.md:191-195#unheaded-block-26 (current lines); unit SHA256 56bf6c6625c4e7566434dca9188acf80bc7b2b72b9583df8ac29a2e4380c7875.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 56bf6c6625c4e7566434dca9188acf80bc7b2b72b9583df8ac29a2e4380c7875 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-12 under docs/platform/host-invocation-routing/spec.md#unheaded-block-26; source context \"Host Invocation And Provider Routing Architecture / 4. Peer Host Use Cases\", target context \"Spec: Host Invocation / Retained selected source material / Host Invocation And Provider Routing Architecture / 4. Peer Host Use Cases\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 442,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_409136e69870a5b65fad1c316d27b2de",
    "sourceUnitDigest": "56bf6c6625c4e7566434dca9188acf80bc7b2b72b9583df8ac29a2e4380c7875",
    "claimKind": "architecture",
    "kind": "spec",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/spec.md",
    "targetAnchor": "unheaded-block-26",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md:85-89#unheaded-block-12 (current lines); unit SHA256 56bf6c6625c4e7566434dca9188acf80bc7b2b72b9583df8ac29a2e4380c7875.\nTarget: docs/platform/host-invocation-routing/spec.md:191-195#unheaded-block-26 (current lines); unit SHA256 56bf6c6625c4e7566434dca9188acf80bc7b2b72b9583df8ac29a2e4380c7875.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 56bf6c6625c4e7566434dca9188acf80bc7b2b72b9583df8ac29a2e4380c7875 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-12 under docs/platform/host-invocation-routing/spec.md#unheaded-block-26; source context \"Host Invocation And Provider Routing Architecture / 4. Peer Host Use Cases\", target context \"Spec: Host Invocation / Retained selected source material / Host Invocation And Provider Routing Architecture / 4. Peer Host Use Cases\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "56bf6c6625c4e7566434dca9188acf80bc7b2b72b9583df8ac29a2e4380c7875"
  }
}
```

## Entry rationale-444

```json
{
  "entryId": "rationale-444",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_b36251074aafa1b9a7a18d09d35916c6",
  "before": "Move the complete direct unheaded-block unit \"R3's remote peer is the project-local gateway (current herdr, same release) — §10 has the future shared-gateway constraint.\" from docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-13 to its frozen mapped owner docs/platform/host-invocation-routing/spec.md#unheaded-block-26. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Weak-exact: ancestor headings differ; independent full-text judgment remains required, not a script-proven approval.",
  "after": "Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md:91-91#unheaded-block-13 (current lines); unit SHA256 2910e743873d1a68192f92e75f6ff36e4825594ec108a504a9b93ce0463b75d6.\nTarget: docs/platform/host-invocation-routing/spec.md:197-197#unheaded-block-27 (current lines); unit SHA256 2910e743873d1a68192f92e75f6ff36e4825594ec108a504a9b93ce0463b75d6.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 2910e743873d1a68192f92e75f6ff36e4825594ec108a504a9b93ce0463b75d6 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-13 under docs/platform/host-invocation-routing/spec.md#unheaded-block-27; source context \"Host Invocation And Provider Routing Architecture / 4. Peer Host Use Cases\", target context \"Spec: Host Invocation / Retained selected source material / Host Invocation And Provider Routing Architecture / 4. Peer Host Use Cases\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 443,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_b36251074aafa1b9a7a18d09d35916c6",
    "sourceUnitDigest": "2910e743873d1a68192f92e75f6ff36e4825594ec108a504a9b93ce0463b75d6",
    "claimKind": "architecture",
    "kind": "spec",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/spec.md",
    "targetAnchor": "unheaded-block-27",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md:91-91#unheaded-block-13 (current lines); unit SHA256 2910e743873d1a68192f92e75f6ff36e4825594ec108a504a9b93ce0463b75d6.\nTarget: docs/platform/host-invocation-routing/spec.md:197-197#unheaded-block-27 (current lines); unit SHA256 2910e743873d1a68192f92e75f6ff36e4825594ec108a504a9b93ce0463b75d6.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 2910e743873d1a68192f92e75f6ff36e4825594ec108a504a9b93ce0463b75d6 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-13 under docs/platform/host-invocation-routing/spec.md#unheaded-block-27; source context \"Host Invocation And Provider Routing Architecture / 4. Peer Host Use Cases\", target context \"Spec: Host Invocation / Retained selected source material / Host Invocation And Provider Routing Architecture / 4. Peer Host Use Cases\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "2910e743873d1a68192f92e75f6ff36e4825594ec108a504a9b93ce0463b75d6"
  }
}
```

## Entry rationale-445

```json
{
  "entryId": "rationale-445",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_e48bce114dd451e01284dfedff3189b8",
  "before": "Move the complete direct unheaded-block unit \"**Shared boundary:** all three projectors build the same `HostInvocation`/`OperationRequest` and call one `InvocationService` — deliberate reuse, not wrapping; presenters\" from docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-14 to its frozen mapped owner docs/platform/host-invocation-routing/spec.md#unheaded-block-27. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Weak-exact: ancestor headings differ; independent full-text judgment remains required, not a script-proven approval.",
  "after": "Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md:93-93#unheaded-block-14 (current lines); unit SHA256 a38df2d86d345a34c61ff09512375a2dffe0fa893e3d39da270172a8e884acb6.\nTarget: docs/platform/host-invocation-routing/spec.md:199-199#unheaded-block-28 (current lines); unit SHA256 a38df2d86d345a34c61ff09512375a2dffe0fa893e3d39da270172a8e884acb6.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest a38df2d86d345a34c61ff09512375a2dffe0fa893e3d39da270172a8e884acb6 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-14 under docs/platform/host-invocation-routing/spec.md#unheaded-block-28; source context \"Host Invocation And Provider Routing Architecture / 4. Peer Host Use Cases\", target context \"Spec: Host Invocation / Retained selected source material / Host Invocation And Provider Routing Architecture / 4. Peer Host Use Cases\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 444,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_e48bce114dd451e01284dfedff3189b8",
    "sourceUnitDigest": "a38df2d86d345a34c61ff09512375a2dffe0fa893e3d39da270172a8e884acb6",
    "claimKind": "contract",
    "kind": "spec",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/spec.md",
    "targetAnchor": "unheaded-block-28",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md:93-93#unheaded-block-14 (current lines); unit SHA256 a38df2d86d345a34c61ff09512375a2dffe0fa893e3d39da270172a8e884acb6.\nTarget: docs/platform/host-invocation-routing/spec.md:199-199#unheaded-block-28 (current lines); unit SHA256 a38df2d86d345a34c61ff09512375a2dffe0fa893e3d39da270172a8e884acb6.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest a38df2d86d345a34c61ff09512375a2dffe0fa893e3d39da270172a8e884acb6 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-14 under docs/platform/host-invocation-routing/spec.md#unheaded-block-28; source context \"Host Invocation And Provider Routing Architecture / 4. Peer Host Use Cases\", target context \"Spec: Host Invocation / Retained selected source material / Host Invocation And Provider Routing Architecture / 4. Peer Host Use Cases\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "a38df2d86d345a34c61ff09512375a2dffe0fa893e3d39da270172a8e884acb6"
  }
}
```

## Entry rationale-446

```json
{
  "entryId": "rationale-446",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_ff539e4d9e54b7a23852c01f926c5596",
  "before": "Move the complete direct unheaded-block unit \"**Transitional CLI lane:** the legacy Node lane lives in the CLI adapter, not the kernel — the kernel has exactly one input/output pair. The CLI adapter looks up `Command\" from docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-15 to its frozen mapped owner docs/platform/host-invocation-routing/spec.md#unheaded-block-28. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Judgment: no target digest match; independent full-text judgment remains required, not a script-proven approval.",
  "after": "Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md:95-95#unheaded-block-15 (current lines); unit SHA256 549405163a2bbd8cdd9f541a06cbe4f432dc9eb84b9f3f72f4bd37c22aacaf99.\nTarget: docs/platform/host-invocation-routing/spec.md:201-201#unheaded-block-29 (current lines); unit SHA256 e52e6cb6135f8ed324f2d8fb0e9e4ed6d1df73a0443dda2196926e9668bbd718.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest e52e6cb6135f8ed324f2d8fb0e9e4ed6d1df73a0443dda2196926e9668bbd718 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 1, target 1; 1 changed spellings/labels, 1 destination changes; 0 added, 0 removed.\nLink 1: \"Legacy CLI Transition\" (./legacy-cli-transition.md) → \"Legacy CLI Transition\" (architecture/legacy-cli-transition.md); resolved docs/architect/host-invocation-routing/legacy-cli-transition.md → docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-15 under docs/platform/host-invocation-routing/spec.md#unheaded-block-29; source context \"Host Invocation And Provider Routing Architecture / 4. Peer Host Use Cases\", target context \"Spec: Host Invocation / Retained selected source material / Host Invocation And Provider Routing Architecture / 4. Peer Host Use Cases\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 445,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_ff539e4d9e54b7a23852c01f926c5596",
    "sourceUnitDigest": "549405163a2bbd8cdd9f541a06cbe4f432dc9eb84b9f3f72f4bd37c22aacaf99",
    "claimKind": "architecture",
    "kind": "spec",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/spec.md",
    "targetAnchor": "unheaded-block-29",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md:95-95#unheaded-block-15 (current lines); unit SHA256 549405163a2bbd8cdd9f541a06cbe4f432dc9eb84b9f3f72f4bd37c22aacaf99.\nTarget: docs/platform/host-invocation-routing/spec.md:201-201#unheaded-block-29 (current lines); unit SHA256 e52e6cb6135f8ed324f2d8fb0e9e4ed6d1df73a0443dda2196926e9668bbd718.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest e52e6cb6135f8ed324f2d8fb0e9e4ed6d1df73a0443dda2196926e9668bbd718 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 1, target 1; 1 changed spellings/labels, 1 destination changes; 0 added, 0 removed.\nLink 1: \"Legacy CLI Transition\" (./legacy-cli-transition.md) → \"Legacy CLI Transition\" (architecture/legacy-cli-transition.md); resolved docs/architect/host-invocation-routing/legacy-cli-transition.md → docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-15 under docs/platform/host-invocation-routing/spec.md#unheaded-block-29; source context \"Host Invocation And Provider Routing Architecture / 4. Peer Host Use Cases\", target context \"Spec: Host Invocation / Retained selected source material / Host Invocation And Provider Routing Architecture / 4. Peer Host Use Cases\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "e52e6cb6135f8ed324f2d8fb0e9e4ed6d1df73a0443dda2196926e9668bbd718"
  }
}
```

## Entry rationale-447

```json
{
  "entryId": "rationale-447",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_80fe1621540d25e5e4f6968bea7e0a0b",
  "before": "Partial carry of the direct source section docs/architect/host-invocation-routing/host-invocation-provider-routing.md#5-core-contracts at docs/platform/host-invocation-routing/spec.md#5-core-contracts; surrounding content stays here. Remainder: The relocated passage of docs/architect/host-invocation-routing/host-invocation-provider-routing.md#5-core-contracts is retained verbatim at docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-contract-versioning and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-24 (claim_bbaec409dcbaee8f33968727aa0abed5; **Contract versioning:** request/outcome contracts version independently; linking picks one exact version pair from the host/provider range ). No source wording is discarded; this row does not claim the primary target alone contains the relocated passage.",
  "after": "Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md:97-97#5-core-contracts (current lines); unit SHA256 5e7c2c60dfed54dc9ebb433881669fc2e31db27fbf1cf90aef988969b14fd6e3.\nTarget: docs/platform/host-invocation-routing/spec.md:203-203#5-core-contracts (current lines); unit SHA256 9274b7dd1e623096538871b0934d940c5311b7dac7f87b98e8f3bbe9cbdf0e79.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 9274b7dd1e623096538871b0934d940c5311b7dac7f87b98e8f3bbe9cbdf0e79 at 0c06e6e6b67a3897d660ee54de25fdc9971e59a4.\nLinks: source 2, target 3; 3 changed spellings/labels, 2 destination changes; 1 added, 0 removed.\nLink 1: \"External Provider Protocol\" (./external-provider-protocol.md) → \"External Provider Protocol\" (architecture/external-provider-protocol.md); resolved docs/architect/host-invocation-routing/external-provider-protocol.md → docs/platform/host-invocation-routing/architecture/external-provider-protocol.md.\nLink 2: \"Legacy CLI Transition\" (./legacy-cli-transition.md) → \"Legacy CLI Transition\" (architecture/legacy-cli-transition.md); resolved docs/architect/host-invocation-routing/legacy-cli-transition.md → docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md.\nLink 3: \"none\" (none) → \"the dropped-002 restoration\" (contracts/component-protocol.md#restored-contract-versioning); resolved none → docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-contract-versioning.\nHeading depth: 2 → 4; title \"5. Core Contracts\" → \"5. Core Contracts\".\nApplicable labelled corrections: none in this bound unit.\nDisposition partial-carry: Account for docs/architect/host-invocation-routing/host-invocation-provider-routing.md#5-core-contracts under docs/platform/host-invocation-routing/spec.md#5-core-contracts; source context \"Host Invocation And Provider Routing Architecture\", target context \"Spec: Host Invocation / Retained selected source material / Host Invocation And Provider Routing Architecture\". The source text occurs verbatim inside the bound target section; section-level unit digests differ. Recorded residual: The relocated passage of docs/architect/host-invocation-routing/host-invocation-provider-routing.md#5-core-contracts is retained verbatim at docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-contract-versioning and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-24 (claim_bbaec409dcbaee8f33968727aa0abed5; **Contract versioning:** request/outcome contracts version independently; linking picks one exact version pair from the host/provider range )..\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 446,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_80fe1621540d25e5e4f6968bea7e0a0b",
    "sourceUnitDigest": "5e7c2c60dfed54dc9ebb433881669fc2e31db27fbf1cf90aef988969b14fd6e3",
    "claimKind": "architecture",
    "kind": "spec",
    "disposition": "partial-carry",
    "targetOwner": "docs/platform/host-invocation-routing/spec.md",
    "targetAnchor": "5-core-contracts",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md:97-97#5-core-contracts (current lines); unit SHA256 5e7c2c60dfed54dc9ebb433881669fc2e31db27fbf1cf90aef988969b14fd6e3.\nTarget: docs/platform/host-invocation-routing/spec.md:203-203#5-core-contracts (current lines); unit SHA256 9274b7dd1e623096538871b0934d940c5311b7dac7f87b98e8f3bbe9cbdf0e79.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 9274b7dd1e623096538871b0934d940c5311b7dac7f87b98e8f3bbe9cbdf0e79 at 0c06e6e6b67a3897d660ee54de25fdc9971e59a4.\nLinks: source 2, target 3; 3 changed spellings/labels, 2 destination changes; 1 added, 0 removed.\nLink 1: \"External Provider Protocol\" (./external-provider-protocol.md) → \"External Provider Protocol\" (architecture/external-provider-protocol.md); resolved docs/architect/host-invocation-routing/external-provider-protocol.md → docs/platform/host-invocation-routing/architecture/external-provider-protocol.md.\nLink 2: \"Legacy CLI Transition\" (./legacy-cli-transition.md) → \"Legacy CLI Transition\" (architecture/legacy-cli-transition.md); resolved docs/architect/host-invocation-routing/legacy-cli-transition.md → docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md.\nLink 3: \"none\" (none) → \"the dropped-002 restoration\" (contracts/component-protocol.md#restored-contract-versioning); resolved none → docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-contract-versioning.\nHeading depth: 2 → 4; title \"5. Core Contracts\" → \"5. Core Contracts\".\nApplicable labelled corrections: none in this bound unit.\nDisposition partial-carry: Account for docs/architect/host-invocation-routing/host-invocation-provider-routing.md#5-core-contracts under docs/platform/host-invocation-routing/spec.md#5-core-contracts; source context \"Host Invocation And Provider Routing Architecture\", target context \"Spec: Host Invocation / Retained selected source material / Host Invocation And Provider Routing Architecture\". The source text occurs verbatim inside the bound target section; section-level unit digests differ. Recorded residual: The relocated passage of docs/architect/host-invocation-routing/host-invocation-provider-routing.md#5-core-contracts is retained verbatim at docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-contract-versioning and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-24 (claim_bbaec409dcbaee8f33968727aa0abed5; **Contract versioning:** request/outcome contracts version independently; linking picks one exact version pair from the host/provider range )..\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "remainder": "The relocated passage of docs/architect/host-invocation-routing/host-invocation-provider-routing.md#5-core-contracts is retained verbatim at docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-contract-versioning and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-24 (claim_bbaec409dcbaee8f33968727aa0abed5; **Contract versioning:** request/outcome contracts version independently; linking picks one exact version pair from the host/provider range ).",
    "targetUnitDigest": "9274b7dd1e623096538871b0934d940c5311b7dac7f87b98e8f3bbe9cbdf0e79",
    "targetAncestry": [
      "Spec: Host Invocation",
      "Retained selected source material",
      "Host Invocation And Provider Routing Architecture"
    ]
  }
}
```

## Entry rationale-448

```json
{
  "entryId": "rationale-448",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_56a238faac6b847f9682d37b3120ee3d",
  "before": "Move the complete direct unheaded-block unit \"The name table (§3) says what each type is; this adds the rules it has no room for.\" from docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-16 to its frozen mapped owner docs/platform/host-invocation-routing/spec.md#unheaded-block-29. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Weak-exact: ancestor headings differ; independent full-text judgment remains required, not a script-proven approval.",
  "after": "Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md:99-99#unheaded-block-16 (current lines); unit SHA256 86cb21687de69958f80760e385f227f908f68738f5a4a6c9f60f260e4d16d18e.\nTarget: docs/platform/host-invocation-routing/spec.md:205-205#unheaded-block-30 (current lines); unit SHA256 86cb21687de69958f80760e385f227f908f68738f5a4a6c9f60f260e4d16d18e.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 86cb21687de69958f80760e385f227f908f68738f5a4a6c9f60f260e4d16d18e at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-16 under docs/platform/host-invocation-routing/spec.md#unheaded-block-30; source context \"Host Invocation And Provider Routing Architecture / 5. Core Contracts\", target context \"Spec: Host Invocation / Retained selected source material / Host Invocation And Provider Routing Architecture / 5. Core Contracts\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 447,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_56a238faac6b847f9682d37b3120ee3d",
    "sourceUnitDigest": "86cb21687de69958f80760e385f227f908f68738f5a4a6c9f60f260e4d16d18e",
    "claimKind": "architecture",
    "kind": "spec",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/spec.md",
    "targetAnchor": "unheaded-block-30",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md:99-99#unheaded-block-16 (current lines); unit SHA256 86cb21687de69958f80760e385f227f908f68738f5a4a6c9f60f260e4d16d18e.\nTarget: docs/platform/host-invocation-routing/spec.md:205-205#unheaded-block-30 (current lines); unit SHA256 86cb21687de69958f80760e385f227f908f68738f5a4a6c9f60f260e4d16d18e.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 86cb21687de69958f80760e385f227f908f68738f5a4a6c9f60f260e4d16d18e at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-16 under docs/platform/host-invocation-routing/spec.md#unheaded-block-30; source context \"Host Invocation And Provider Routing Architecture / 5. Core Contracts\", target context \"Spec: Host Invocation / Retained selected source material / Host Invocation And Provider Routing Architecture / 5. Core Contracts\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "86cb21687de69958f80760e385f227f908f68738f5a4a6c9f60f260e4d16d18e"
  }
}
```

## Entry rationale-449

```json
{
  "entryId": "rationale-449",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_6b0a503ec2f4be776646c3497dd2b654",
  "before": "Move the complete direct unheaded-block unit \"**`OperationId`** — `<component>.<object-type>.<action>[.<variant>]`. `<component>` owns authority; `<object-type>` is singular (`work.item.list` still names `WorkItem`);\" from docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-17 to its frozen mapped owner docs/platform/host-invocation-routing/spec.md#unheaded-block-30. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Weak-exact: ancestor headings differ; independent full-text judgment remains required, not a script-proven approval.",
  "after": "Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md:101-101#unheaded-block-17 (current lines); unit SHA256 e589d0c17cec471f3059cd9540cc278de8b1f52525baa81dfe2f5b15e8d0d869.\nTarget: docs/platform/host-invocation-routing/spec.md:207-207#unheaded-block-31 (current lines); unit SHA256 e589d0c17cec471f3059cd9540cc278de8b1f52525baa81dfe2f5b15e8d0d869.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest e589d0c17cec471f3059cd9540cc278de8b1f52525baa81dfe2f5b15e8d0d869 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-17 under docs/platform/host-invocation-routing/spec.md#unheaded-block-31; source context \"Host Invocation And Provider Routing Architecture / 5. Core Contracts\", target context \"Spec: Host Invocation / Retained selected source material / Host Invocation And Provider Routing Architecture / 5. Core Contracts\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 448,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_6b0a503ec2f4be776646c3497dd2b654",
    "sourceUnitDigest": "e589d0c17cec471f3059cd9540cc278de8b1f52525baa81dfe2f5b15e8d0d869",
    "claimKind": "architecture",
    "kind": "spec",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/spec.md",
    "targetAnchor": "unheaded-block-31",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md:101-101#unheaded-block-17 (current lines); unit SHA256 e589d0c17cec471f3059cd9540cc278de8b1f52525baa81dfe2f5b15e8d0d869.\nTarget: docs/platform/host-invocation-routing/spec.md:207-207#unheaded-block-31 (current lines); unit SHA256 e589d0c17cec471f3059cd9540cc278de8b1f52525baa81dfe2f5b15e8d0d869.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest e589d0c17cec471f3059cd9540cc278de8b1f52525baa81dfe2f5b15e8d0d869 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-17 under docs/platform/host-invocation-routing/spec.md#unheaded-block-31; source context \"Host Invocation And Provider Routing Architecture / 5. Core Contracts\", target context \"Spec: Host Invocation / Retained selected source material / Host Invocation And Provider Routing Architecture / 5. Core Contracts\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "e589d0c17cec471f3059cd9540cc278de8b1f52525baa81dfe2f5b15e8d0d869"
  }
}
```

## Entry rationale-450

```json
{
  "entryId": "rationale-450",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_8915e841d73567b51aeafbf90a505e53",
  "before": "Move the complete direct unheaded-block unit \"**`HostInvocation`** — host kind is an **open string** (`\"cli\" | \"remote\" | \"chat\"`, not a closed enum every future host must exist in R1).\" from docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-18 to its frozen mapped owner docs/platform/host-invocation-routing/spec.md#unheaded-block-31. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Weak-exact: ancestor headings differ; independent full-text judgment remains required, not a script-proven approval.",
  "after": "Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md:103-103#unheaded-block-18 (current lines); unit SHA256 4d58898e6a37274d567a87ae3b2720823dcfd22057a7d471b3ac0c96feccb4e2.\nTarget: docs/platform/host-invocation-routing/spec.md:209-209#unheaded-block-32 (current lines); unit SHA256 4d58898e6a37274d567a87ae3b2720823dcfd22057a7d471b3ac0c96feccb4e2.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 4d58898e6a37274d567a87ae3b2720823dcfd22057a7d471b3ac0c96feccb4e2 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-18 under docs/platform/host-invocation-routing/spec.md#unheaded-block-32; source context \"Host Invocation And Provider Routing Architecture / 5. Core Contracts\", target context \"Spec: Host Invocation / Retained selected source material / Host Invocation And Provider Routing Architecture / 5. Core Contracts\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 449,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_8915e841d73567b51aeafbf90a505e53",
    "sourceUnitDigest": "4d58898e6a37274d567a87ae3b2720823dcfd22057a7d471b3ac0c96feccb4e2",
    "claimKind": "architecture",
    "kind": "spec",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/spec.md",
    "targetAnchor": "unheaded-block-32",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md:103-103#unheaded-block-18 (current lines); unit SHA256 4d58898e6a37274d567a87ae3b2720823dcfd22057a7d471b3ac0c96feccb4e2.\nTarget: docs/platform/host-invocation-routing/spec.md:209-209#unheaded-block-32 (current lines); unit SHA256 4d58898e6a37274d567a87ae3b2720823dcfd22057a7d471b3ac0c96feccb4e2.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 4d58898e6a37274d567a87ae3b2720823dcfd22057a7d471b3ac0c96feccb4e2 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-18 under docs/platform/host-invocation-routing/spec.md#unheaded-block-32; source context \"Host Invocation And Provider Routing Architecture / 5. Core Contracts\", target context \"Spec: Host Invocation / Retained selected source material / Host Invocation And Provider Routing Architecture / 5. Core Contracts\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "4d58898e6a37274d567a87ae3b2720823dcfd22057a7d471b3ac0c96feccb4e2"
  }
}
```

## Entry rationale-451

```json
{
  "entryId": "rationale-451",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_172f16568383334882a377204d1bda92",
  "before": "Move the complete direct unheaded-block unit \"**`OperationRequest`** = `{ operation: OperationId, contract: ContractRef, input: Box<dyn Any + Send> }` — typed per contract; a built-in downcasts `input` directly, neve\" from docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-19 to its frozen mapped owner docs/platform/host-invocation-routing/spec.md#unheaded-block-32. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Weak-exact: ancestor headings differ; independent full-text judgment remains required, not a script-proven approval.",
  "after": "Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md:105-105#unheaded-block-19 (current lines); unit SHA256 ab4daa85566a73f17ff82c6bc6db130a7888d5d980b42854778167cc564393a5.\nTarget: docs/platform/host-invocation-routing/spec.md:211-211#unheaded-block-33 (current lines); unit SHA256 ab4daa85566a73f17ff82c6bc6db130a7888d5d980b42854778167cc564393a5.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest ab4daa85566a73f17ff82c6bc6db130a7888d5d980b42854778167cc564393a5 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-19 under docs/platform/host-invocation-routing/spec.md#unheaded-block-33; source context \"Host Invocation And Provider Routing Architecture / 5. Core Contracts\", target context \"Spec: Host Invocation / Retained selected source material / Host Invocation And Provider Routing Architecture / 5. Core Contracts\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 450,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_172f16568383334882a377204d1bda92",
    "sourceUnitDigest": "ab4daa85566a73f17ff82c6bc6db130a7888d5d980b42854778167cc564393a5",
    "claimKind": "contract",
    "kind": "spec",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/spec.md",
    "targetAnchor": "unheaded-block-33",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md:105-105#unheaded-block-19 (current lines); unit SHA256 ab4daa85566a73f17ff82c6bc6db130a7888d5d980b42854778167cc564393a5.\nTarget: docs/platform/host-invocation-routing/spec.md:211-211#unheaded-block-33 (current lines); unit SHA256 ab4daa85566a73f17ff82c6bc6db130a7888d5d980b42854778167cc564393a5.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest ab4daa85566a73f17ff82c6bc6db130a7888d5d980b42854778167cc564393a5 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-19 under docs/platform/host-invocation-routing/spec.md#unheaded-block-33; source context \"Host Invocation And Provider Routing Architecture / 5. Core Contracts\", target context \"Spec: Host Invocation / Retained selected source material / Host Invocation And Provider Routing Architecture / 5. Core Contracts\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "ab4daa85566a73f17ff82c6bc6db130a7888d5d980b42854778167cc564393a5"
  }
}
```

## Entry rationale-452

```json
{
  "entryId": "rationale-452",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_2d8e20d6682672ff45ace69f776f586e",
  "before": "Move the complete direct unheaded-block unit \"**No serialization for built-in providers** — the semantic contract is schema + version (`ContractRef`), but in-process representation is typed Rust through `OperationPro\" from docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-20 to its frozen mapped owner docs/platform/host-invocation-routing/spec.md#unheaded-block-33. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Judgment: no target digest match; independent full-text judgment remains required, not a script-proven approval.",
  "after": "Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md:107-107#unheaded-block-20 (current lines); unit SHA256 34bdcb7df2d600761b1ddac05aff6dab3623a3d07ab779442ee8c45199febd8e.\nTarget: docs/platform/host-invocation-routing/spec.md:213-213#unheaded-block-34 (current lines); unit SHA256 57adc8d3efaa2c34e47bdb3463d1a05b03ea1e620ea684c511beaaeb5843b405.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 57adc8d3efaa2c34e47bdb3463d1a05b03ea1e620ea684c511beaaeb5843b405 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 1, target 1; 1 changed spellings/labels, 1 destination changes; 0 added, 0 removed.\nLink 1: \"External Provider Protocol\" (./external-provider-protocol.md) → \"External Provider Protocol\" (architecture/external-provider-protocol.md); resolved docs/architect/host-invocation-routing/external-provider-protocol.md → docs/platform/host-invocation-routing/architecture/external-provider-protocol.md.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-20 under docs/platform/host-invocation-routing/spec.md#unheaded-block-34; source context \"Host Invocation And Provider Routing Architecture / 5. Core Contracts\", target context \"Spec: Host Invocation / Retained selected source material / Host Invocation And Provider Routing Architecture / 5. Core Contracts\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 451,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_2d8e20d6682672ff45ace69f776f586e",
    "sourceUnitDigest": "34bdcb7df2d600761b1ddac05aff6dab3623a3d07ab779442ee8c45199febd8e",
    "claimKind": "contract",
    "kind": "spec",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/spec.md",
    "targetAnchor": "unheaded-block-34",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md:107-107#unheaded-block-20 (current lines); unit SHA256 34bdcb7df2d600761b1ddac05aff6dab3623a3d07ab779442ee8c45199febd8e.\nTarget: docs/platform/host-invocation-routing/spec.md:213-213#unheaded-block-34 (current lines); unit SHA256 57adc8d3efaa2c34e47bdb3463d1a05b03ea1e620ea684c511beaaeb5843b405.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 57adc8d3efaa2c34e47bdb3463d1a05b03ea1e620ea684c511beaaeb5843b405 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 1, target 1; 1 changed spellings/labels, 1 destination changes; 0 added, 0 removed.\nLink 1: \"External Provider Protocol\" (./external-provider-protocol.md) → \"External Provider Protocol\" (architecture/external-provider-protocol.md); resolved docs/architect/host-invocation-routing/external-provider-protocol.md → docs/platform/host-invocation-routing/architecture/external-provider-protocol.md.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-20 under docs/platform/host-invocation-routing/spec.md#unheaded-block-34; source context \"Host Invocation And Provider Routing Architecture / 5. Core Contracts\", target context \"Spec: Host Invocation / Retained selected source material / Host Invocation And Provider Routing Architecture / 5. Core Contracts\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "57adc8d3efaa2c34e47bdb3463d1a05b03ea1e620ea684c511beaaeb5843b405"
  }
}
```

## Entry rationale-453

```json
{
  "entryId": "rationale-453",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_2d3c01cb290b26b07dea9f4253b48a2b",
  "before": "Move the complete direct unheaded-block unit \"**`ProviderOutcome`** — not a nested `fgos.v1` envelope or HTTP response; the presenter owns public projection; diagnostics travel through the trace/evidence sink, never \" from docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-21 to its frozen mapped owner docs/platform/host-invocation-routing/spec.md#unheaded-block-34. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Weak-exact: ancestor headings differ; independent full-text judgment remains required, not a script-proven approval.",
  "after": "Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md:109-109#unheaded-block-21 (current lines); unit SHA256 25f3278e48747b1da92b7226b9519ac969f64ca227fdde6284feab4375f1ebc5.\nTarget: docs/platform/host-invocation-routing/spec.md:215-215#unheaded-block-35 (current lines); unit SHA256 25f3278e48747b1da92b7226b9519ac969f64ca227fdde6284feab4375f1ebc5.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 25f3278e48747b1da92b7226b9519ac969f64ca227fdde6284feab4375f1ebc5 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-21 under docs/platform/host-invocation-routing/spec.md#unheaded-block-35; source context \"Host Invocation And Provider Routing Architecture / 5. Core Contracts\", target context \"Spec: Host Invocation / Retained selected source material / Host Invocation And Provider Routing Architecture / 5. Core Contracts\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 452,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_2d3c01cb290b26b07dea9f4253b48a2b",
    "sourceUnitDigest": "25f3278e48747b1da92b7226b9519ac969f64ca227fdde6284feab4375f1ebc5",
    "claimKind": "architecture",
    "kind": "spec",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/spec.md",
    "targetAnchor": "unheaded-block-35",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md:109-109#unheaded-block-21 (current lines); unit SHA256 25f3278e48747b1da92b7226b9519ac969f64ca227fdde6284feab4375f1ebc5.\nTarget: docs/platform/host-invocation-routing/spec.md:215-215#unheaded-block-35 (current lines); unit SHA256 25f3278e48747b1da92b7226b9519ac969f64ca227fdde6284feab4375f1ebc5.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 25f3278e48747b1da92b7226b9519ac969f64ca227fdde6284feab4375f1ebc5 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-21 under docs/platform/host-invocation-routing/spec.md#unheaded-block-35; source context \"Host Invocation And Provider Routing Architecture / 5. Core Contracts\", target context \"Spec: Host Invocation / Retained selected source material / Host Invocation And Provider Routing Architecture / 5. Core Contracts\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "25f3278e48747b1da92b7226b9519ac969f64ca227fdde6284feab4375f1ebc5"
  }
}
```

## Entry rationale-454

```json
{
  "entryId": "rationale-454",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_3093ee097f4a4c9dd5f2e4c1573baac0",
  "before": "Move the complete direct unheaded-block unit \"**`ProviderDescriptor` / `ConfigPort`** — `lifecycle` is `singleton | per-invocation | pooled`. Invocation mechanism is an **open string** (`\"builtin\" | \"legacy-node\" | \"\" from docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-22 to its frozen mapped owner docs/platform/host-invocation-routing/spec.md#unheaded-block-35. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Judgment: no target digest match; independent full-text judgment remains required, not a script-proven approval.",
  "after": "Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md:111-111#unheaded-block-22 (current lines); unit SHA256 368a48374bd909283fcb5acc86fdd26d33aeab5d2ebadd66a9c6666d559c6341.\nTarget: docs/platform/host-invocation-routing/spec.md:217-217#unheaded-block-36 (current lines); unit SHA256 5fa259c8f0e1c05b1e5a7197d4ebf95df05133b3783217b1acce7e36f3df4ad7.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 5fa259c8f0e1c05b1e5a7197d4ebf95df05133b3783217b1acce7e36f3df4ad7 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 1, target 1; 1 changed spellings/labels, 1 destination changes; 0 added, 0 removed.\nLink 1: \"Legacy CLI Transition\" (./legacy-cli-transition.md) → \"Legacy CLI Transition\" (architecture/legacy-cli-transition.md); resolved docs/architect/host-invocation-routing/legacy-cli-transition.md → docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-22 under docs/platform/host-invocation-routing/spec.md#unheaded-block-36; source context \"Host Invocation And Provider Routing Architecture / 5. Core Contracts\", target context \"Spec: Host Invocation / Retained selected source material / Host Invocation And Provider Routing Architecture / 5. Core Contracts\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 453,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_3093ee097f4a4c9dd5f2e4c1573baac0",
    "sourceUnitDigest": "368a48374bd909283fcb5acc86fdd26d33aeab5d2ebadd66a9c6666d559c6341",
    "claimKind": "architecture",
    "kind": "spec",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/spec.md",
    "targetAnchor": "unheaded-block-36",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md:111-111#unheaded-block-22 (current lines); unit SHA256 368a48374bd909283fcb5acc86fdd26d33aeab5d2ebadd66a9c6666d559c6341.\nTarget: docs/platform/host-invocation-routing/spec.md:217-217#unheaded-block-36 (current lines); unit SHA256 5fa259c8f0e1c05b1e5a7197d4ebf95df05133b3783217b1acce7e36f3df4ad7.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 5fa259c8f0e1c05b1e5a7197d4ebf95df05133b3783217b1acce7e36f3df4ad7 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 1, target 1; 1 changed spellings/labels, 1 destination changes; 0 added, 0 removed.\nLink 1: \"Legacy CLI Transition\" (./legacy-cli-transition.md) → \"Legacy CLI Transition\" (architecture/legacy-cli-transition.md); resolved docs/architect/host-invocation-routing/legacy-cli-transition.md → docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-22 under docs/platform/host-invocation-routing/spec.md#unheaded-block-36; source context \"Host Invocation And Provider Routing Architecture / 5. Core Contracts\", target context \"Spec: Host Invocation / Retained selected source material / Host Invocation And Provider Routing Architecture / 5. Core Contracts\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "5fa259c8f0e1c05b1e5a7197d4ebf95df05133b3783217b1acce7e36f3df4ad7"
  }
}
```

## Entry rationale-455

```json
{
  "entryId": "rationale-455",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_26a29b7f2a7b3e9bb7b7f428c1af8ea7",
  "before": "Move the complete direct unheaded-block unit \"**`OperationDescriptor` / `OperationCatalog`** — authored by owning components, never inferred from CLI commands or provider manifests. Fields: operation id, owning compo\" from docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-23 to its frozen mapped owner docs/platform/host-invocation-routing/spec.md#unheaded-block-36. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Weak-exact: ancestor headings differ; independent full-text judgment remains required, not a script-proven approval.",
  "after": "Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md:113-113#unheaded-block-23 (current lines); unit SHA256 ed4a701518de1f1daeee74fc034b27fbf31ce5d51e28a789bfbc98fe3b99112a.\nTarget: docs/platform/host-invocation-routing/spec.md:219-219#unheaded-block-37 (current lines); unit SHA256 ed4a701518de1f1daeee74fc034b27fbf31ce5d51e28a789bfbc98fe3b99112a.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest ed4a701518de1f1daeee74fc034b27fbf31ce5d51e28a789bfbc98fe3b99112a at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-23 under docs/platform/host-invocation-routing/spec.md#unheaded-block-37; source context \"Host Invocation And Provider Routing Architecture / 5. Core Contracts\", target context \"Spec: Host Invocation / Retained selected source material / Host Invocation And Provider Routing Architecture / 5. Core Contracts\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 454,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_26a29b7f2a7b3e9bb7b7f428c1af8ea7",
    "sourceUnitDigest": "ed4a701518de1f1daeee74fc034b27fbf31ce5d51e28a789bfbc98fe3b99112a",
    "claimKind": "architecture",
    "kind": "spec",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/spec.md",
    "targetAnchor": "unheaded-block-37",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md:113-113#unheaded-block-23 (current lines); unit SHA256 ed4a701518de1f1daeee74fc034b27fbf31ce5d51e28a789bfbc98fe3b99112a.\nTarget: docs/platform/host-invocation-routing/spec.md:219-219#unheaded-block-37 (current lines); unit SHA256 ed4a701518de1f1daeee74fc034b27fbf31ce5d51e28a789bfbc98fe3b99112a.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest ed4a701518de1f1daeee74fc034b27fbf31ce5d51e28a789bfbc98fe3b99112a at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-23 under docs/platform/host-invocation-routing/spec.md#unheaded-block-37; source context \"Host Invocation And Provider Routing Architecture / 5. Core Contracts\", target context \"Spec: Host Invocation / Retained selected source material / Host Invocation And Provider Routing Architecture / 5. Core Contracts\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "ed4a701518de1f1daeee74fc034b27fbf31ce5d51e28a789bfbc98fe3b99112a"
  }
}
```

## Entry rationale-456

```json
{
  "entryId": "rationale-456",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_305dece113643fd5b84ae2e927d0255c",
  "before": "Move the complete direct unheaded-block unit \"**Router** — no I/O, no async, no invocation, no failure normalization, no reporting:\" from docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-25 to its frozen mapped owner docs/platform/host-invocation-routing/spec.md#unheaded-block-38. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Weak-exact: ancestor headings differ; independent full-text judgment remains required, not a script-proven approval.",
  "after": "Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md:119-119#unheaded-block-25 (current lines); unit SHA256 15ddbb3e2c82e8c6e736ad16375407257c80854147570b36c4c0558af516004d.\nTarget: docs/platform/host-invocation-routing/spec.md:227-227#unheaded-block-39 (current lines); unit SHA256 15ddbb3e2c82e8c6e736ad16375407257c80854147570b36c4c0558af516004d.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 15ddbb3e2c82e8c6e736ad16375407257c80854147570b36c4c0558af516004d at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-25 under docs/platform/host-invocation-routing/spec.md#unheaded-block-39; source context \"Host Invocation And Provider Routing Architecture / 6. Router (Pure) And InvocationService (Pipeline)\", target context \"Spec: Host Invocation / Retained selected source material / Host Invocation And Provider Routing Architecture / 6. Router (Pure) And InvocationService (Pipeline)\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 455,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_305dece113643fd5b84ae2e927d0255c",
    "sourceUnitDigest": "15ddbb3e2c82e8c6e736ad16375407257c80854147570b36c4c0558af516004d",
    "claimKind": "architecture",
    "kind": "spec",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/spec.md",
    "targetAnchor": "unheaded-block-39",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md:119-119#unheaded-block-25 (current lines); unit SHA256 15ddbb3e2c82e8c6e736ad16375407257c80854147570b36c4c0558af516004d.\nTarget: docs/platform/host-invocation-routing/spec.md:227-227#unheaded-block-39 (current lines); unit SHA256 15ddbb3e2c82e8c6e736ad16375407257c80854147570b36c4c0558af516004d.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 15ddbb3e2c82e8c6e736ad16375407257c80854147570b36c4c0558af516004d at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-25 under docs/platform/host-invocation-routing/spec.md#unheaded-block-39; source context \"Host Invocation And Provider Routing Architecture / 6. Router (Pure) And InvocationService (Pipeline)\", target context \"Spec: Host Invocation / Retained selected source material / Host Invocation And Provider Routing Architecture / 6. Router (Pure) And InvocationService (Pipeline)\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "15ddbb3e2c82e8c6e736ad16375407257c80854147570b36c4c0558af516004d"
  }
}
```

## Entry rationale-457

```json
{
  "entryId": "rationale-457",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_05580d020f4747813ccde0f35a0d4253",
  "before": "Move the complete direct unheaded-block unit \"```txt Router: (OperationId, request/outcome contract versions, host kind, invocation mode, project policy, RegistrySnapshot) -> Result<ProviderDescriptor, SelectionRefus\" from docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-26 to its frozen mapped owner docs/platform/host-invocation-routing/spec.md#unheaded-block-39. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Weak-exact: ancestor headings differ; independent full-text judgment remains required, not a script-proven approval.",
  "after": "Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md:121-125#unheaded-block-26 (current lines); unit SHA256 fa90bd61a074a5ca00da821ac02722163365c5ea48ae706f61449755c32da95f.\nTarget: docs/platform/host-invocation-routing/spec.md:229-233#unheaded-block-40 (current lines); unit SHA256 fa90bd61a074a5ca00da821ac02722163365c5ea48ae706f61449755c32da95f.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest fa90bd61a074a5ca00da821ac02722163365c5ea48ae706f61449755c32da95f at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-26 under docs/platform/host-invocation-routing/spec.md#unheaded-block-40; source context \"Host Invocation And Provider Routing Architecture / 6. Router (Pure) And InvocationService (Pipeline)\", target context \"Spec: Host Invocation / Retained selected source material / Host Invocation And Provider Routing Architecture / 6. Router (Pure) And InvocationService (Pipeline)\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 456,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_05580d020f4747813ccde0f35a0d4253",
    "sourceUnitDigest": "fa90bd61a074a5ca00da821ac02722163365c5ea48ae706f61449755c32da95f",
    "claimKind": "contract",
    "kind": "spec",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/spec.md",
    "targetAnchor": "unheaded-block-40",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md:121-125#unheaded-block-26 (current lines); unit SHA256 fa90bd61a074a5ca00da821ac02722163365c5ea48ae706f61449755c32da95f.\nTarget: docs/platform/host-invocation-routing/spec.md:229-233#unheaded-block-40 (current lines); unit SHA256 fa90bd61a074a5ca00da821ac02722163365c5ea48ae706f61449755c32da95f.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest fa90bd61a074a5ca00da821ac02722163365c5ea48ae706f61449755c32da95f at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-26 under docs/platform/host-invocation-routing/spec.md#unheaded-block-40; source context \"Host Invocation And Provider Routing Architecture / 6. Router (Pure) And InvocationService (Pipeline)\", target context \"Spec: Host Invocation / Retained selected source material / Host Invocation And Provider Routing Architecture / 6. Router (Pure) And InvocationService (Pipeline)\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "fa90bd61a074a5ca00da821ac02722163365c5ea48ae706f61449755c32da95f"
  }
}
```

## Entry rationale-458

```json
{
  "entryId": "rationale-458",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_bd9700b35680814aed54cb5ead71f93e",
  "before": "Move the complete direct unheaded-block unit \"It reads the `RegistrySnapshot`, matches operation/mode/host/compatible contract versions, applies an explicit binding or named replacement policy, and fails closed on am\" from docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-27 to its frozen mapped owner docs/platform/host-invocation-routing/spec.md#unheaded-block-40. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Weak-exact: ancestor headings differ; independent full-text judgment remains required, not a script-proven approval.",
  "after": "Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md:127-127#unheaded-block-27 (current lines); unit SHA256 3b83b50ecb60c261c62571086880596c83d1dd43fba569dc820af0a283c5acc6.\nTarget: docs/platform/host-invocation-routing/spec.md:235-235#unheaded-block-41 (current lines); unit SHA256 3b83b50ecb60c261c62571086880596c83d1dd43fba569dc820af0a283c5acc6.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 3b83b50ecb60c261c62571086880596c83d1dd43fba569dc820af0a283c5acc6 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-27 under docs/platform/host-invocation-routing/spec.md#unheaded-block-41; source context \"Host Invocation And Provider Routing Architecture / 6. Router (Pure) And InvocationService (Pipeline)\", target context \"Spec: Host Invocation / Retained selected source material / Host Invocation And Provider Routing Architecture / 6. Router (Pure) And InvocationService (Pipeline)\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 457,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_bd9700b35680814aed54cb5ead71f93e",
    "sourceUnitDigest": "3b83b50ecb60c261c62571086880596c83d1dd43fba569dc820af0a283c5acc6",
    "claimKind": "contract",
    "kind": "spec",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/spec.md",
    "targetAnchor": "unheaded-block-41",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md:127-127#unheaded-block-27 (current lines); unit SHA256 3b83b50ecb60c261c62571086880596c83d1dd43fba569dc820af0a283c5acc6.\nTarget: docs/platform/host-invocation-routing/spec.md:235-235#unheaded-block-41 (current lines); unit SHA256 3b83b50ecb60c261c62571086880596c83d1dd43fba569dc820af0a283c5acc6.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 3b83b50ecb60c261c62571086880596c83d1dd43fba569dc820af0a283c5acc6 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-27 under docs/platform/host-invocation-routing/spec.md#unheaded-block-41; source context \"Host Invocation And Provider Routing Architecture / 6. Router (Pure) And InvocationService (Pipeline)\", target context \"Spec: Host Invocation / Retained selected source material / Host Invocation And Provider Routing Architecture / 6. Router (Pure) And InvocationService (Pipeline)\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "3b83b50ecb60c261c62571086880596c83d1dd43fba569dc820af0a283c5acc6"
  }
}
```

## Entry rationale-459

```json
{
  "entryId": "rationale-459",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_7cebe18b8107697678773ccc51789839",
  "before": "Move the complete direct unheaded-block unit \"**`InvocationService`** owns the pipeline and is the only thing that invokes a provider:\" from docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-28 to its frozen mapped owner docs/platform/host-invocation-routing/spec.md#unheaded-block-41. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Weak-exact: ancestor headings differ; independent full-text judgment remains required, not a script-proven approval.",
  "after": "Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md:129-129#unheaded-block-28 (current lines); unit SHA256 03f3ab396b900902ead2145adecacdcef5481ec931f6bb6af0dd3b6188a73bcd.\nTarget: docs/platform/host-invocation-routing/spec.md:237-237#unheaded-block-42 (current lines); unit SHA256 03f3ab396b900902ead2145adecacdcef5481ec931f6bb6af0dd3b6188a73bcd.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 03f3ab396b900902ead2145adecacdcef5481ec931f6bb6af0dd3b6188a73bcd at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-28 under docs/platform/host-invocation-routing/spec.md#unheaded-block-42; source context \"Host Invocation And Provider Routing Architecture / 6. Router (Pure) And InvocationService (Pipeline)\", target context \"Spec: Host Invocation / Retained selected source material / Host Invocation And Provider Routing Architecture / 6. Router (Pure) And InvocationService (Pipeline)\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 458,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_7cebe18b8107697678773ccc51789839",
    "sourceUnitDigest": "03f3ab396b900902ead2145adecacdcef5481ec931f6bb6af0dd3b6188a73bcd",
    "claimKind": "architecture",
    "kind": "spec",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/spec.md",
    "targetAnchor": "unheaded-block-42",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md:129-129#unheaded-block-28 (current lines); unit SHA256 03f3ab396b900902ead2145adecacdcef5481ec931f6bb6af0dd3b6188a73bcd.\nTarget: docs/platform/host-invocation-routing/spec.md:237-237#unheaded-block-42 (current lines); unit SHA256 03f3ab396b900902ead2145adecacdcef5481ec931f6bb6af0dd3b6188a73bcd.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 03f3ab396b900902ead2145adecacdcef5481ec931f6bb6af0dd3b6188a73bcd at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-28 under docs/platform/host-invocation-routing/spec.md#unheaded-block-42; source context \"Host Invocation And Provider Routing Architecture / 6. Router (Pure) And InvocationService (Pipeline)\", target context \"Spec: Host Invocation / Retained selected source material / Host Invocation And Provider Routing Architecture / 6. Router (Pure) And InvocationService (Pipeline)\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "03f3ab396b900902ead2145adecacdcef5481ec931f6bb6af0dd3b6188a73bcd"
  }
}
```

## Entry rationale-460

```json
{
  "entryId": "rationale-460",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_640e28371ba46f2a0b4d25d9bd4857cf",
  "before": "Move the complete direct unheaded-block unit \"```txt received -> admit -> Router.select -> grant -> invoke(adapter) -> normalize transport failure -> record lifecycle ```\" from docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-29 to its frozen mapped owner docs/platform/host-invocation-routing/spec.md#unheaded-block-42. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Weak-exact: ancestor headings differ; independent full-text judgment remains required, not a script-proven approval.",
  "after": "Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md:131-134#unheaded-block-29 (current lines); unit SHA256 3bb1b28e8b5d2b1a97993b41c7eef4fea2ed19324794237d5fead157f4e5ba7a.\nTarget: docs/platform/host-invocation-routing/spec.md:239-242#unheaded-block-43 (current lines); unit SHA256 3bb1b28e8b5d2b1a97993b41c7eef4fea2ed19324794237d5fead157f4e5ba7a.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 3bb1b28e8b5d2b1a97993b41c7eef4fea2ed19324794237d5fead157f4e5ba7a at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-29 under docs/platform/host-invocation-routing/spec.md#unheaded-block-43; source context \"Host Invocation And Provider Routing Architecture / 6. Router (Pure) And InvocationService (Pipeline)\", target context \"Spec: Host Invocation / Retained selected source material / Host Invocation And Provider Routing Architecture / 6. Router (Pure) And InvocationService (Pipeline)\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 459,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_640e28371ba46f2a0b4d25d9bd4857cf",
    "sourceUnitDigest": "3bb1b28e8b5d2b1a97993b41c7eef4fea2ed19324794237d5fead157f4e5ba7a",
    "claimKind": "architecture",
    "kind": "spec",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/spec.md",
    "targetAnchor": "unheaded-block-43",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md:131-134#unheaded-block-29 (current lines); unit SHA256 3bb1b28e8b5d2b1a97993b41c7eef4fea2ed19324794237d5fead157f4e5ba7a.\nTarget: docs/platform/host-invocation-routing/spec.md:239-242#unheaded-block-43 (current lines); unit SHA256 3bb1b28e8b5d2b1a97993b41c7eef4fea2ed19324794237d5fead157f4e5ba7a.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 3bb1b28e8b5d2b1a97993b41c7eef4fea2ed19324794237d5fead157f4e5ba7a at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-29 under docs/platform/host-invocation-routing/spec.md#unheaded-block-43; source context \"Host Invocation And Provider Routing Architecture / 6. Router (Pure) And InvocationService (Pipeline)\", target context \"Spec: Host Invocation / Retained selected source material / Host Invocation And Provider Routing Architecture / 6. Router (Pure) And InvocationService (Pipeline)\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "3bb1b28e8b5d2b1a97993b41c7eef4fea2ed19324794237d5fead157f4e5ba7a"
  }
}
```

## Entry rationale-461

```json
{
  "entryId": "rationale-461",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_5ddfd281d81055c96fda317ce953758c",
  "before": "Move the complete direct unheaded-block unit \"`admit`/`grant` are the two authority stages (§7); `invoke` calls the granted `OperationProvider` with deadline/cancellation/trace context; `normalize` maps adapter-speci\" from docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-30 to its frozen mapped owner docs/platform/host-invocation-routing/spec.md#unheaded-block-43. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Weak-exact: ancestor headings differ; independent full-text judgment remains required, not a script-proven approval.",
  "after": "Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md:136-136#unheaded-block-30 (current lines); unit SHA256 831f2fd6e6739bc4e5ceb63f2075d208d91f6b0cdb2de39029abec66dd81f483.\nTarget: docs/platform/host-invocation-routing/spec.md:244-244#unheaded-block-44 (current lines); unit SHA256 831f2fd6e6739bc4e5ceb63f2075d208d91f6b0cdb2de39029abec66dd81f483.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 831f2fd6e6739bc4e5ceb63f2075d208d91f6b0cdb2de39029abec66dd81f483 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-30 under docs/platform/host-invocation-routing/spec.md#unheaded-block-44; source context \"Host Invocation And Provider Routing Architecture / 6. Router (Pure) And InvocationService (Pipeline)\", target context \"Spec: Host Invocation / Retained selected source material / Host Invocation And Provider Routing Architecture / 6. Router (Pure) And InvocationService (Pipeline)\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 460,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_5ddfd281d81055c96fda317ce953758c",
    "sourceUnitDigest": "831f2fd6e6739bc4e5ceb63f2075d208d91f6b0cdb2de39029abec66dd81f483",
    "claimKind": "architecture",
    "kind": "spec",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/spec.md",
    "targetAnchor": "unheaded-block-44",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md:136-136#unheaded-block-30 (current lines); unit SHA256 831f2fd6e6739bc4e5ceb63f2075d208d91f6b0cdb2de39029abec66dd81f483.\nTarget: docs/platform/host-invocation-routing/spec.md:244-244#unheaded-block-44 (current lines); unit SHA256 831f2fd6e6739bc4e5ceb63f2075d208d91f6b0cdb2de39029abec66dd81f483.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 831f2fd6e6739bc4e5ceb63f2075d208d91f6b0cdb2de39029abec66dd81f483 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-30 under docs/platform/host-invocation-routing/spec.md#unheaded-block-44; source context \"Host Invocation And Provider Routing Architecture / 6. Router (Pure) And InvocationService (Pipeline)\", target context \"Spec: Host Invocation / Retained selected source material / Host Invocation And Provider Routing Architecture / 6. Router (Pure) And InvocationService (Pipeline)\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "831f2fd6e6739bc4e5ceb63f2075d208d91f6b0cdb2de39029abec66dd81f483"
  }
}
```

## Entry rationale-462

```json
{
  "entryId": "rationale-462",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_79be28c5dff309bf75120de9b05ae4d0",
  "before": "Move the complete direct unheaded-block unit \"Numeric priority, registration order, and last-writer-wins are not selection policy — a binding names one provider, a replacement names the provider it replaces plus the \" from docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-31 to its frozen mapped owner docs/platform/host-invocation-routing/spec.md#unheaded-block-44. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Weak-exact: ancestor headings differ; independent full-text judgment remains required, not a script-proven approval.",
  "after": "Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md:138-138#unheaded-block-31 (current lines); unit SHA256 dc0daca1c1136703f0431dcd50fe3b2e9ec5061a182f6e04cb3e206add533ae7.\nTarget: docs/platform/host-invocation-routing/spec.md:246-246#unheaded-block-45 (current lines); unit SHA256 dc0daca1c1136703f0431dcd50fe3b2e9ec5061a182f6e04cb3e206add533ae7.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest dc0daca1c1136703f0431dcd50fe3b2e9ec5061a182f6e04cb3e206add533ae7 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-31 under docs/platform/host-invocation-routing/spec.md#unheaded-block-45; source context \"Host Invocation And Provider Routing Architecture / 6. Router (Pure) And InvocationService (Pipeline)\", target context \"Spec: Host Invocation / Retained selected source material / Host Invocation And Provider Routing Architecture / 6. Router (Pure) And InvocationService (Pipeline)\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 461,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_79be28c5dff309bf75120de9b05ae4d0",
    "sourceUnitDigest": "dc0daca1c1136703f0431dcd50fe3b2e9ec5061a182f6e04cb3e206add533ae7",
    "claimKind": "architecture",
    "kind": "spec",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/spec.md",
    "targetAnchor": "unheaded-block-45",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md:138-138#unheaded-block-31 (current lines); unit SHA256 dc0daca1c1136703f0431dcd50fe3b2e9ec5061a182f6e04cb3e206add533ae7.\nTarget: docs/platform/host-invocation-routing/spec.md:246-246#unheaded-block-45 (current lines); unit SHA256 dc0daca1c1136703f0431dcd50fe3b2e9ec5061a182f6e04cb3e206add533ae7.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest dc0daca1c1136703f0431dcd50fe3b2e9ec5061a182f6e04cb3e206add533ae7 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-31 under docs/platform/host-invocation-routing/spec.md#unheaded-block-45; source context \"Host Invocation And Provider Routing Architecture / 6. Router (Pure) And InvocationService (Pipeline)\", target context \"Spec: Host Invocation / Retained selected source material / Host Invocation And Provider Routing Architecture / 6. Router (Pure) And InvocationService (Pipeline)\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "dc0daca1c1136703f0431dcd50fe3b2e9ec5061a182f6e04cb3e206add533ae7"
  }
}
```

## Entry rationale-463

```json
{
  "entryId": "rationale-463",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_d6010b0b5e57e716fdbb2b573a5c2e4a",
  "before": "Move the complete direct unheaded-block unit \"```rust pub trait OperationProvider: Send + Sync { fn descriptor(&self) -> &ProviderDescriptor; fn invoke<'a>( &'a self, invocation: &'a HostInvocation, request: Operatio\" from docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-32 to its frozen mapped owner docs/platform/host-invocation-routing/spec.md#unheaded-block-45. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Weak-exact: ancestor headings differ; independent full-text judgment remains required, not a script-proven approval.",
  "after": "Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md:140-148#unheaded-block-32 (current lines); unit SHA256 219d46d7c2d1616b8d2dbec767b8e45aa259ae8321f47b49051e07a132f4bdc3.\nTarget: docs/platform/host-invocation-routing/spec.md:248-256#unheaded-block-46 (current lines); unit SHA256 219d46d7c2d1616b8d2dbec767b8e45aa259ae8321f47b49051e07a132f4bdc3.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 219d46d7c2d1616b8d2dbec767b8e45aa259ae8321f47b49051e07a132f4bdc3 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-32 under docs/platform/host-invocation-routing/spec.md#unheaded-block-46; source context \"Host Invocation And Provider Routing Architecture / 6. Router (Pure) And InvocationService (Pipeline)\", target context \"Spec: Host Invocation / Retained selected source material / Host Invocation And Provider Routing Architecture / 6. Router (Pure) And InvocationService (Pipeline)\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 462,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_d6010b0b5e57e716fdbb2b573a5c2e4a",
    "sourceUnitDigest": "219d46d7c2d1616b8d2dbec767b8e45aa259ae8321f47b49051e07a132f4bdc3",
    "claimKind": "architecture",
    "kind": "spec",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/spec.md",
    "targetAnchor": "unheaded-block-46",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md:140-148#unheaded-block-32 (current lines); unit SHA256 219d46d7c2d1616b8d2dbec767b8e45aa259ae8321f47b49051e07a132f4bdc3.\nTarget: docs/platform/host-invocation-routing/spec.md:248-256#unheaded-block-46 (current lines); unit SHA256 219d46d7c2d1616b8d2dbec767b8e45aa259ae8321f47b49051e07a132f4bdc3.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 219d46d7c2d1616b8d2dbec767b8e45aa259ae8321f47b49051e07a132f4bdc3 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-32 under docs/platform/host-invocation-routing/spec.md#unheaded-block-46; source context \"Host Invocation And Provider Routing Architecture / 6. Router (Pure) And InvocationService (Pipeline)\", target context \"Spec: Host Invocation / Retained selected source material / Host Invocation And Provider Routing Architecture / 6. Router (Pure) And InvocationService (Pipeline)\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "219d46d7c2d1616b8d2dbec767b8e45aa259ae8321f47b49051e07a132f4bdc3"
  }
}
```

## Entry rationale-464

```json
{
  "entryId": "rationale-464",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_50f8ffbbb93953f5a4d7b276700aaf6d",
  "before": "Move the complete direct unheaded-block unit \"Core operation/command namespaces are reserved; plugins add vendor-scoped operations (`acme.deploy.release`) and implement published extension points only; `.fgos` writes\" from docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-33 to its frozen mapped owner docs/platform/host-invocation-routing/spec.md#unheaded-block-46. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Weak-exact: ancestor headings differ; independent full-text judgment remains required, not a script-proven approval.",
  "after": "Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md:152-152#unheaded-block-33 (current lines); unit SHA256 2928695057f7d3fe48b36607d329a6e28781eb4dd6293ea07781262aed245bd6.\nTarget: docs/platform/host-invocation-routing/spec.md:260-260#unheaded-block-47 (current lines); unit SHA256 2928695057f7d3fe48b36607d329a6e28781eb4dd6293ea07781262aed245bd6.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 2928695057f7d3fe48b36607d329a6e28781eb4dd6293ea07781262aed245bd6 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-33 under docs/platform/host-invocation-routing/spec.md#unheaded-block-47; source context \"Host Invocation And Provider Routing Architecture / 7. Authority (Two-Stage)\", target context \"Spec: Host Invocation / Retained selected source material / Host Invocation And Provider Routing Architecture / 7. Authority (Two-Stage)\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 463,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_50f8ffbbb93953f5a4d7b276700aaf6d",
    "sourceUnitDigest": "2928695057f7d3fe48b36607d329a6e28781eb4dd6293ea07781262aed245bd6",
    "claimKind": "architecture",
    "kind": "spec",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/spec.md",
    "targetAnchor": "unheaded-block-47",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md:152-152#unheaded-block-33 (current lines); unit SHA256 2928695057f7d3fe48b36607d329a6e28781eb4dd6293ea07781262aed245bd6.\nTarget: docs/platform/host-invocation-routing/spec.md:260-260#unheaded-block-47 (current lines); unit SHA256 2928695057f7d3fe48b36607d329a6e28781eb4dd6293ea07781262aed245bd6.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 2928695057f7d3fe48b36607d329a6e28781eb4dd6293ea07781262aed245bd6 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-33 under docs/platform/host-invocation-routing/spec.md#unheaded-block-47; source context \"Host Invocation And Provider Routing Architecture / 7. Authority (Two-Stage)\", target context \"Spec: Host Invocation / Retained selected source material / Host Invocation And Provider Routing Architecture / 7. Authority (Two-Stage)\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "2928695057f7d3fe48b36607d329a6e28781eb4dd6293ea07781262aed245bd6"
  }
}
```

## Entry rationale-465

```json
{
  "entryId": "rationale-465",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_8242c1d38b001421e537d3c00881719e",
  "before": "Move the complete direct unheaded-block unit \"The provider manifest is never an authority source:\" from docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-34 to its frozen mapped owner docs/platform/host-invocation-routing/spec.md#unheaded-block-47. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Weak-exact: ancestor headings differ; independent full-text judgment remains required, not a script-proven approval.",
  "after": "Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md:154-154#unheaded-block-34 (current lines); unit SHA256 a0caf84349022155d49f49db75495431fb3f9c0401af615badc90ca07f022a84.\nTarget: docs/platform/host-invocation-routing/spec.md:262-262#unheaded-block-48 (current lines); unit SHA256 a0caf84349022155d49f49db75495431fb3f9c0401af615badc90ca07f022a84.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest a0caf84349022155d49f49db75495431fb3f9c0401af615badc90ca07f022a84 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-34 under docs/platform/host-invocation-routing/spec.md#unheaded-block-48; source context \"Host Invocation And Provider Routing Architecture / 7. Authority (Two-Stage)\", target context \"Spec: Host Invocation / Retained selected source material / Host Invocation And Provider Routing Architecture / 7. Authority (Two-Stage)\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 464,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_8242c1d38b001421e537d3c00881719e",
    "sourceUnitDigest": "a0caf84349022155d49f49db75495431fb3f9c0401af615badc90ca07f022a84",
    "claimKind": "architecture",
    "kind": "spec",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/spec.md",
    "targetAnchor": "unheaded-block-48",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md:154-154#unheaded-block-34 (current lines); unit SHA256 a0caf84349022155d49f49db75495431fb3f9c0401af615badc90ca07f022a84.\nTarget: docs/platform/host-invocation-routing/spec.md:262-262#unheaded-block-48 (current lines); unit SHA256 a0caf84349022155d49f49db75495431fb3f9c0401af615badc90ca07f022a84.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest a0caf84349022155d49f49db75495431fb3f9c0401af615badc90ca07f022a84 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-34 under docs/platform/host-invocation-routing/spec.md#unheaded-block-48; source context \"Host Invocation And Provider Routing Architecture / 7. Authority (Two-Stage)\", target context \"Spec: Host Invocation / Retained selected source material / Host Invocation And Provider Routing Architecture / 7. Authority (Two-Stage)\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "a0caf84349022155d49f49db75495431fb3f9c0401af615badc90ca07f022a84"
  }
}
```

## Entry rationale-466

```json
{
  "entryId": "rationale-466",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_eec8cf4f92eb6874379f999e36411748",
  "before": "Move the complete direct unheaded-block unit \"1. **Caller admission** (before routing): principal, operation, project policy, requested context, host surface. 2. **Selected-provider grant** (after routing): intersect\" from docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-35 to its frozen mapped owner docs/platform/host-invocation-routing/spec.md#unheaded-block-48. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Weak-exact: ancestor headings differ; independent full-text judgment remains required, not a script-proven approval.",
  "after": "Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md:156-157#unheaded-block-35 (current lines); unit SHA256 24141d5360668fa982c7adbdff3a78dd8cdcf76c71effd8f2798aba62bf89a29.\nTarget: docs/platform/host-invocation-routing/spec.md:264-265#unheaded-block-49 (current lines); unit SHA256 24141d5360668fa982c7adbdff3a78dd8cdcf76c71effd8f2798aba62bf89a29.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 24141d5360668fa982c7adbdff3a78dd8cdcf76c71effd8f2798aba62bf89a29 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-35 under docs/platform/host-invocation-routing/spec.md#unheaded-block-49; source context \"Host Invocation And Provider Routing Architecture / 7. Authority (Two-Stage)\", target context \"Spec: Host Invocation / Retained selected source material / Host Invocation And Provider Routing Architecture / 7. Authority (Two-Stage)\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 465,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_eec8cf4f92eb6874379f999e36411748",
    "sourceUnitDigest": "24141d5360668fa982c7adbdff3a78dd8cdcf76c71effd8f2798aba62bf89a29",
    "claimKind": "architecture",
    "kind": "spec",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/spec.md",
    "targetAnchor": "unheaded-block-49",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md:156-157#unheaded-block-35 (current lines); unit SHA256 24141d5360668fa982c7adbdff3a78dd8cdcf76c71effd8f2798aba62bf89a29.\nTarget: docs/platform/host-invocation-routing/spec.md:264-265#unheaded-block-49 (current lines); unit SHA256 24141d5360668fa982c7adbdff3a78dd8cdcf76c71effd8f2798aba62bf89a29.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 24141d5360668fa982c7adbdff3a78dd8cdcf76c71effd8f2798aba62bf89a29 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-35 under docs/platform/host-invocation-routing/spec.md#unheaded-block-49; source context \"Host Invocation And Provider Routing Architecture / 7. Authority (Two-Stage)\", target context \"Spec: Host Invocation / Retained selected source material / Host Invocation And Provider Routing Architecture / 7. Authority (Two-Stage)\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "24141d5360668fa982c7adbdff3a78dd8cdcf76c71effd8f2798aba62bf89a29"
  }
}
```

## Entry rationale-467

```json
{
  "entryId": "rationale-467",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_8428870415cb04160f9b74b632be2f4e",
  "before": "Move the complete direct unheaded-block unit \"The provider receives only the resulting least-privilege grant via `InvocationControl`, identically for every host — a single pre-selection gate cannot evaluate the selec\" from docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-36 to its frozen mapped owner docs/platform/host-invocation-routing/spec.md#unheaded-block-49. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Weak-exact: ancestor headings differ; independent full-text judgment remains required, not a script-proven approval.",
  "after": "Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md:159-159#unheaded-block-36 (current lines); unit SHA256 2ebd1f72c973cce115952d9e7f34d8723f829e810c1111b0afb861f78fb0e335.\nTarget: docs/platform/host-invocation-routing/spec.md:267-267#unheaded-block-50 (current lines); unit SHA256 2ebd1f72c973cce115952d9e7f34d8723f829e810c1111b0afb861f78fb0e335.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 2ebd1f72c973cce115952d9e7f34d8723f829e810c1111b0afb861f78fb0e335 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-36 under docs/platform/host-invocation-routing/spec.md#unheaded-block-50; source context \"Host Invocation And Provider Routing Architecture / 7. Authority (Two-Stage)\", target context \"Spec: Host Invocation / Retained selected source material / Host Invocation And Provider Routing Architecture / 7. Authority (Two-Stage)\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 466,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_8428870415cb04160f9b74b632be2f4e",
    "sourceUnitDigest": "2ebd1f72c973cce115952d9e7f34d8723f829e810c1111b0afb861f78fb0e335",
    "claimKind": "architecture",
    "kind": "spec",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/spec.md",
    "targetAnchor": "unheaded-block-50",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md:159-159#unheaded-block-36 (current lines); unit SHA256 2ebd1f72c973cce115952d9e7f34d8723f829e810c1111b0afb861f78fb0e335.\nTarget: docs/platform/host-invocation-routing/spec.md:267-267#unheaded-block-50 (current lines); unit SHA256 2ebd1f72c973cce115952d9e7f34d8723f829e810c1111b0afb861f78fb0e335.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 2ebd1f72c973cce115952d9e7f34d8723f829e810c1111b0afb861f78fb0e335 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-36 under docs/platform/host-invocation-routing/spec.md#unheaded-block-50; source context \"Host Invocation And Provider Routing Architecture / 7. Authority (Two-Stage)\", target context \"Spec: Host Invocation / Retained selected source material / Host Invocation And Provider Routing Architecture / 7. Authority (Two-Stage)\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "2ebd1f72c973cce115952d9e7f34d8723f829e810c1111b0afb861f78fb0e335"
  }
}
```

## Entry rationale-468

```json
{
  "entryId": "rationale-468",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_dee53f3bfe9661d4d0fa015e3d0783ca",
  "before": "Move the complete direct unheaded-block unit \"Selecting a different provider never silently transfers authority — a replacement returns a result or proof; the existing authority owner still applies transitions and wr\" from docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-37 to its frozen mapped owner docs/platform/host-invocation-routing/spec.md#unheaded-block-50. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Weak-exact: ancestor headings differ; independent full-text judgment remains required, not a script-proven approval.",
  "after": "Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md:161-161#unheaded-block-37 (current lines); unit SHA256 78724be9a1f311792885d756c890d78bd57edebfc28b57e42b36d1bb8d907a88.\nTarget: docs/platform/host-invocation-routing/spec.md:269-269#unheaded-block-51 (current lines); unit SHA256 78724be9a1f311792885d756c890d78bd57edebfc28b57e42b36d1bb8d907a88.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 78724be9a1f311792885d756c890d78bd57edebfc28b57e42b36d1bb8d907a88 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-37 under docs/platform/host-invocation-routing/spec.md#unheaded-block-51; source context \"Host Invocation And Provider Routing Architecture / 7. Authority (Two-Stage)\", target context \"Spec: Host Invocation / Retained selected source material / Host Invocation And Provider Routing Architecture / 7. Authority (Two-Stage)\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 467,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_dee53f3bfe9661d4d0fa015e3d0783ca",
    "sourceUnitDigest": "78724be9a1f311792885d756c890d78bd57edebfc28b57e42b36d1bb8d907a88",
    "claimKind": "architecture",
    "kind": "spec",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/spec.md",
    "targetAnchor": "unheaded-block-51",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md:161-161#unheaded-block-37 (current lines); unit SHA256 78724be9a1f311792885d756c890d78bd57edebfc28b57e42b36d1bb8d907a88.\nTarget: docs/platform/host-invocation-routing/spec.md:269-269#unheaded-block-51 (current lines); unit SHA256 78724be9a1f311792885d756c890d78bd57edebfc28b57e42b36d1bb8d907a88.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 78724be9a1f311792885d756c890d78bd57edebfc28b57e42b36d1bb8d907a88 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-37 under docs/platform/host-invocation-routing/spec.md#unheaded-block-51; source context \"Host Invocation And Provider Routing Architecture / 7. Authority (Two-Stage)\", target context \"Spec: Host Invocation / Retained selected source material / Host Invocation And Provider Routing Architecture / 7. Authority (Two-Stage)\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "78724be9a1f311792885d756c890d78bd57edebfc28b57e42b36d1bb8d907a88"
  }
}
```

## Entry rationale-469

```json
{
  "entryId": "rationale-469",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_76dfcba31d147e73488ea3abeade7ef1",
  "before": "Partial carry of the direct source section docs/architect/host-invocation-routing/host-invocation-provider-routing.md#8-failure-cancellation-lifecycle-and-human-input at docs/platform/host-invocation-routing/spec.md#8-failure-cancellation-lifecycle-and-human-input; surrounding content stays here. Remainder: The relocated passage of docs/architect/host-invocation-routing/host-invocation-provider-routing.md#8-failure-cancellation-lifecycle-and-human-input is retained verbatim at docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-lifecycle-state-chain-received-admitted-refused-selected-refused-granted-refused-dispatched-te, docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-contract-versioning and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-41 (claim_75c780a31188a0fa1e19d03ccbd3b6b1; ```txt received -> admitted | admission-refused -> selected | selection-refused -> granted | grant-refused -> dis); docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-43 (claim_e365a92a236aa909b9148185aa8f0801; For idempotency-keyed operations the key lives in the owning operation contract and is stable across an authorized retry; the router never i). No source wording is discarded; this row does not claim the primary target alone contains the relocated passage.",
  "after": "Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md:163-163#8-failure-cancellation-lifecycle-and-human-input (current lines); unit SHA256 7a639345a5670ebb3cd24fd27a72fb08467d57f4667517fbd47f51d35b9bb224.\nTarget: docs/platform/host-invocation-routing/spec.md:271-271#8-failure-cancellation-lifecycle-and-human-input (current lines); unit SHA256 a3fd2fb5bbb38608bae7071b5f0571cbcccb756e34449544f509d1d40fc8fdc6.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest a3fd2fb5bbb38608bae7071b5f0571cbcccb756e34449544f509d1d40fc8fdc6 at 0c06e6e6b67a3897d660ee54de25fdc9971e59a4.\nLinks: source 0, target 2; 2 changed spellings/labels, 0 destination changes; 2 added, 0 removed.\nLink 1: \"none\" (none) → \"the dropped-003 restoration\" (contracts/component-protocol.md#restored-lifecycle-state-chain-received-admitted-refused-selected-refused-granted-refused-dispatched-te); resolved none → docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-lifecycle-state-chain-received-admitted-refused-selected-refused-granted-refused-dispatched-te.\nLink 2: \"none\" (none) → \"the dropped-002 restoration\" (contracts/component-protocol.md#restored-contract-versioning); resolved none → docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-contract-versioning.\nHeading depth: 2 → 4; title \"8. Failure, Cancellation, Lifecycle, And Human Input\" → \"8. Failure, Cancellation, Lifecycle, And Human Input\".\nApplicable labelled corrections: none in this bound unit.\nDisposition partial-carry: Account for docs/architect/host-invocation-routing/host-invocation-provider-routing.md#8-failure-cancellation-lifecycle-and-human-input under docs/platform/host-invocation-routing/spec.md#8-failure-cancellation-lifecycle-and-human-input; source context \"Host Invocation And Provider Routing Architecture\", target context \"Spec: Host Invocation / Retained selected source material / Host Invocation And Provider Routing Architecture\". The source text occurs verbatim inside the bound target section; section-level unit digests differ. Recorded residual: The relocated passage of docs/architect/host-invocation-routing/host-invocation-provider-routing.md#8-failure-cancellation-lifecycle-and-human-input is retained verbatim at docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-lifecycle-state-chain-received-admitted-refused-selected-refused-granted-refused-dispatched-te, docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-contract-versioning and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-41 (claim_75c780a31188a0fa1e19d03ccbd3b6b1; ```txt received -> admitted | admission-refused -> selected | selection-refused -> granted | grant-refused -> dis); docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-43 (claim_e365a92a236aa909b9148185aa8f0801; For idempotency-keyed operations the key lives in the owning operation contract and is stable across an authorized retry; the router never i)..\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 468,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_76dfcba31d147e73488ea3abeade7ef1",
    "sourceUnitDigest": "7a639345a5670ebb3cd24fd27a72fb08467d57f4667517fbd47f51d35b9bb224",
    "claimKind": "architecture",
    "kind": "spec",
    "disposition": "partial-carry",
    "targetOwner": "docs/platform/host-invocation-routing/spec.md",
    "targetAnchor": "8-failure-cancellation-lifecycle-and-human-input",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md:163-163#8-failure-cancellation-lifecycle-and-human-input (current lines); unit SHA256 7a639345a5670ebb3cd24fd27a72fb08467d57f4667517fbd47f51d35b9bb224.\nTarget: docs/platform/host-invocation-routing/spec.md:271-271#8-failure-cancellation-lifecycle-and-human-input (current lines); unit SHA256 a3fd2fb5bbb38608bae7071b5f0571cbcccb756e34449544f509d1d40fc8fdc6.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest a3fd2fb5bbb38608bae7071b5f0571cbcccb756e34449544f509d1d40fc8fdc6 at 0c06e6e6b67a3897d660ee54de25fdc9971e59a4.\nLinks: source 0, target 2; 2 changed spellings/labels, 0 destination changes; 2 added, 0 removed.\nLink 1: \"none\" (none) → \"the dropped-003 restoration\" (contracts/component-protocol.md#restored-lifecycle-state-chain-received-admitted-refused-selected-refused-granted-refused-dispatched-te); resolved none → docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-lifecycle-state-chain-received-admitted-refused-selected-refused-granted-refused-dispatched-te.\nLink 2: \"none\" (none) → \"the dropped-002 restoration\" (contracts/component-protocol.md#restored-contract-versioning); resolved none → docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-contract-versioning.\nHeading depth: 2 → 4; title \"8. Failure, Cancellation, Lifecycle, And Human Input\" → \"8. Failure, Cancellation, Lifecycle, And Human Input\".\nApplicable labelled corrections: none in this bound unit.\nDisposition partial-carry: Account for docs/architect/host-invocation-routing/host-invocation-provider-routing.md#8-failure-cancellation-lifecycle-and-human-input under docs/platform/host-invocation-routing/spec.md#8-failure-cancellation-lifecycle-and-human-input; source context \"Host Invocation And Provider Routing Architecture\", target context \"Spec: Host Invocation / Retained selected source material / Host Invocation And Provider Routing Architecture\". The source text occurs verbatim inside the bound target section; section-level unit digests differ. Recorded residual: The relocated passage of docs/architect/host-invocation-routing/host-invocation-provider-routing.md#8-failure-cancellation-lifecycle-and-human-input is retained verbatim at docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-lifecycle-state-chain-received-admitted-refused-selected-refused-granted-refused-dispatched-te, docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-contract-versioning and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-41 (claim_75c780a31188a0fa1e19d03ccbd3b6b1; ```txt received -> admitted | admission-refused -> selected | selection-refused -> granted | grant-refused -> dis); docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-43 (claim_e365a92a236aa909b9148185aa8f0801; For idempotency-keyed operations the key lives in the owning operation contract and is stable across an authorized retry; the router never i)..\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "remainder": "The relocated passage of docs/architect/host-invocation-routing/host-invocation-provider-routing.md#8-failure-cancellation-lifecycle-and-human-input is retained verbatim at docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-lifecycle-state-chain-received-admitted-refused-selected-refused-granted-refused-dispatched-te, docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-contract-versioning and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-41 (claim_75c780a31188a0fa1e19d03ccbd3b6b1; ```txt received -> admitted | admission-refused -> selected | selection-refused -> granted | grant-refused -> dis); docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-43 (claim_e365a92a236aa909b9148185aa8f0801; For idempotency-keyed operations the key lives in the owning operation contract and is stable across an authorized retry; the router never i).",
    "targetUnitDigest": "a3fd2fb5bbb38608bae7071b5f0571cbcccb756e34449544f509d1d40fc8fdc6",
    "targetAncestry": [
      "Spec: Host Invocation",
      "Retained selected source material",
      "Host Invocation And Provider Routing Architecture"
    ]
  }
}
```

## Entry rationale-470

```json
{
  "entryId": "rationale-470",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_be7bb33b5eafddffe9363e3f77cb41b6",
  "before": "Move the complete direct unheaded-block unit \"Closed failure families, common across every invocation mechanism:\" from docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-38 to its frozen mapped owner docs/platform/host-invocation-routing/spec.md#unheaded-block-51. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Weak-exact: ancestor headings differ; independent full-text judgment remains required, not a script-proven approval.",
  "after": "Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md:165-165#unheaded-block-38 (current lines); unit SHA256 57b360fb2f5eca6c39e0789d26807cd21d768ecf49004ae6946c79460e18be15.\nTarget: docs/platform/host-invocation-routing/spec.md:273-273#unheaded-block-52 (current lines); unit SHA256 57b360fb2f5eca6c39e0789d26807cd21d768ecf49004ae6946c79460e18be15.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 57b360fb2f5eca6c39e0789d26807cd21d768ecf49004ae6946c79460e18be15 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-38 under docs/platform/host-invocation-routing/spec.md#unheaded-block-52; source context \"Host Invocation And Provider Routing Architecture / 8. Failure, Cancellation, Lifecycle, And Human Input\", target context \"Spec: Host Invocation / Retained selected source material / Host Invocation And Provider Routing Architecture / 8. Failure, Cancellation, Lifecycle, And Human Input\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 469,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_be7bb33b5eafddffe9363e3f77cb41b6",
    "sourceUnitDigest": "57b360fb2f5eca6c39e0789d26807cd21d768ecf49004ae6946c79460e18be15",
    "claimKind": "architecture",
    "kind": "spec",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/spec.md",
    "targetAnchor": "unheaded-block-52",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md:165-165#unheaded-block-38 (current lines); unit SHA256 57b360fb2f5eca6c39e0789d26807cd21d768ecf49004ae6946c79460e18be15.\nTarget: docs/platform/host-invocation-routing/spec.md:273-273#unheaded-block-52 (current lines); unit SHA256 57b360fb2f5eca6c39e0789d26807cd21d768ecf49004ae6946c79460e18be15.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 57b360fb2f5eca6c39e0789d26807cd21d768ecf49004ae6946c79460e18be15 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-38 under docs/platform/host-invocation-routing/spec.md#unheaded-block-52; source context \"Host Invocation And Provider Routing Architecture / 8. Failure, Cancellation, Lifecycle, And Human Input\", target context \"Spec: Host Invocation / Retained selected source material / Host Invocation And Provider Routing Architecture / 8. Failure, Cancellation, Lifecycle, And Human Input\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "57b360fb2f5eca6c39e0789d26807cd21d768ecf49004ae6946c79460e18be15"
  }
}
```

## Entry rationale-471

```json
{
  "entryId": "rationale-471",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_1af2a90d9a26d86dd7a4366de7cd1940",
  "before": "Move the complete direct unheaded-block unit \"- semantic validation, precondition, conflict, not-found; - caller admission denied, selected-provider capability denied; - no binding, ambiguous binding, incompatible co\" from docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-39 to its frozen mapped owner docs/platform/host-invocation-routing/spec.md#unheaded-block-52. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Weak-exact: ancestor headings differ; independent full-text judgment remains required, not a script-proven approval.",
  "after": "Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md:167-171#unheaded-block-39 (current lines); unit SHA256 2c657327d903708971792260737eea2c5984bc8b9305c52b90a8ee0b576f3df3.\nTarget: docs/platform/host-invocation-routing/spec.md:275-279#unheaded-block-53 (current lines); unit SHA256 2c657327d903708971792260737eea2c5984bc8b9305c52b90a8ee0b576f3df3.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 2c657327d903708971792260737eea2c5984bc8b9305c52b90a8ee0b576f3df3 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-39 under docs/platform/host-invocation-routing/spec.md#unheaded-block-53; source context \"Host Invocation And Provider Routing Architecture / 8. Failure, Cancellation, Lifecycle, And Human Input\", target context \"Spec: Host Invocation / Retained selected source material / Host Invocation And Provider Routing Architecture / 8. Failure, Cancellation, Lifecycle, And Human Input\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 470,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_1af2a90d9a26d86dd7a4366de7cd1940",
    "sourceUnitDigest": "2c657327d903708971792260737eea2c5984bc8b9305c52b90a8ee0b576f3df3",
    "claimKind": "contract",
    "kind": "spec",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/spec.md",
    "targetAnchor": "unheaded-block-53",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md:167-171#unheaded-block-39 (current lines); unit SHA256 2c657327d903708971792260737eea2c5984bc8b9305c52b90a8ee0b576f3df3.\nTarget: docs/platform/host-invocation-routing/spec.md:275-279#unheaded-block-53 (current lines); unit SHA256 2c657327d903708971792260737eea2c5984bc8b9305c52b90a8ee0b576f3df3.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 2c657327d903708971792260737eea2c5984bc8b9305c52b90a8ee0b576f3df3 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-39 under docs/platform/host-invocation-routing/spec.md#unheaded-block-53; source context \"Host Invocation And Provider Routing Architecture / 8. Failure, Cancellation, Lifecycle, And Human Input\", target context \"Spec: Host Invocation / Retained selected source material / Host Invocation And Provider Routing Architecture / 8. Failure, Cancellation, Lifecycle, And Human Input\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "2c657327d903708971792260737eea2c5984bc8b9305c52b90a8ee0b576f3df3"
  }
}
```

## Entry rationale-472

```json
{
  "entryId": "rationale-472",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_cf5c63a7dd524801f09ae8137fdc3d6e",
  "before": "Move the complete direct unheaded-block unit \"Each host presenter maps these onto its own contract (`fgos.v1`/exit codes, REST/MCP response, chat result); `InvocationService` preserves invocation/provider IDs so proj\" from docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-40 to its frozen mapped owner docs/platform/host-invocation-routing/spec.md#unheaded-block-53. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Weak-exact: ancestor headings differ; independent full-text judgment remains required, not a script-proven approval.",
  "after": "Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md:173-173#unheaded-block-40 (current lines); unit SHA256 5cf2ddbbf256946ebb9bce5404ecd1393619a6ea2a0ca9cf7b930f8cc8ed23a5.\nTarget: docs/platform/host-invocation-routing/spec.md:281-281#unheaded-block-54 (current lines); unit SHA256 5cf2ddbbf256946ebb9bce5404ecd1393619a6ea2a0ca9cf7b930f8cc8ed23a5.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 5cf2ddbbf256946ebb9bce5404ecd1393619a6ea2a0ca9cf7b930f8cc8ed23a5 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-40 under docs/platform/host-invocation-routing/spec.md#unheaded-block-54; source context \"Host Invocation And Provider Routing Architecture / 8. Failure, Cancellation, Lifecycle, And Human Input\", target context \"Spec: Host Invocation / Retained selected source material / Host Invocation And Provider Routing Architecture / 8. Failure, Cancellation, Lifecycle, And Human Input\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 471,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_cf5c63a7dd524801f09ae8137fdc3d6e",
    "sourceUnitDigest": "5cf2ddbbf256946ebb9bce5404ecd1393619a6ea2a0ca9cf7b930f8cc8ed23a5",
    "claimKind": "contract",
    "kind": "spec",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/spec.md",
    "targetAnchor": "unheaded-block-54",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md:173-173#unheaded-block-40 (current lines); unit SHA256 5cf2ddbbf256946ebb9bce5404ecd1393619a6ea2a0ca9cf7b930f8cc8ed23a5.\nTarget: docs/platform/host-invocation-routing/spec.md:281-281#unheaded-block-54 (current lines); unit SHA256 5cf2ddbbf256946ebb9bce5404ecd1393619a6ea2a0ca9cf7b930f8cc8ed23a5.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 5cf2ddbbf256946ebb9bce5404ecd1393619a6ea2a0ca9cf7b930f8cc8ed23a5 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-40 under docs/platform/host-invocation-routing/spec.md#unheaded-block-54; source context \"Host Invocation And Provider Routing Architecture / 8. Failure, Cancellation, Lifecycle, And Human Input\", target context \"Spec: Host Invocation / Retained selected source material / Host Invocation And Provider Routing Architecture / 8. Failure, Cancellation, Lifecycle, And Human Input\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "5cf2ddbbf256946ebb9bce5404ecd1393619a6ea2a0ca9cf7b930f8cc8ed23a5"
  }
}
```

## Entry rationale-473

```json
{
  "entryId": "rationale-473",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_19fc68fdc1c3c1ab6616f2f973c66033",
  "before": "Move the complete direct unheaded-block unit \"Exactly one terminal record is emitted; `dispatched` is the point after which a transport loss may be completion-unknown, and a late response after cancellation/deadline \" from docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-42 to its frozen mapped owner docs/platform/host-invocation-routing/spec.md#unheaded-block-55. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Weak-exact: ancestor headings differ; independent full-text judgment remains required, not a script-proven approval.",
  "after": "Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md:184-184#unheaded-block-42 (current lines); unit SHA256 6a24fbcf8f52b8fc4dea53f740356266112abed4b91b8e048becac4206889717.\nTarget: docs/platform/host-invocation-routing/spec.md:287-287#unheaded-block-56 (current lines); unit SHA256 6a24fbcf8f52b8fc4dea53f740356266112abed4b91b8e048becac4206889717.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 6a24fbcf8f52b8fc4dea53f740356266112abed4b91b8e048becac4206889717 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-42 under docs/platform/host-invocation-routing/spec.md#unheaded-block-56; source context \"Host Invocation And Provider Routing Architecture / 8. Failure, Cancellation, Lifecycle, And Human Input\", target context \"Spec: Host Invocation / Retained selected source material / Host Invocation And Provider Routing Architecture / 8. Failure, Cancellation, Lifecycle, And Human Input\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 472,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_19fc68fdc1c3c1ab6616f2f973c66033",
    "sourceUnitDigest": "6a24fbcf8f52b8fc4dea53f740356266112abed4b91b8e048becac4206889717",
    "claimKind": "architecture",
    "kind": "spec",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/spec.md",
    "targetAnchor": "unheaded-block-56",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md:184-184#unheaded-block-42 (current lines); unit SHA256 6a24fbcf8f52b8fc4dea53f740356266112abed4b91b8e048becac4206889717.\nTarget: docs/platform/host-invocation-routing/spec.md:287-287#unheaded-block-56 (current lines); unit SHA256 6a24fbcf8f52b8fc4dea53f740356266112abed4b91b8e048becac4206889717.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 6a24fbcf8f52b8fc4dea53f740356266112abed4b91b8e048becac4206889717 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-42 under docs/platform/host-invocation-routing/spec.md#unheaded-block-56; source context \"Host Invocation And Provider Routing Architecture / 8. Failure, Cancellation, Lifecycle, And Human Input\", target context \"Spec: Host Invocation / Retained selected source material / Host Invocation And Provider Routing Architecture / 8. Failure, Cancellation, Lifecycle, And Human Input\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "6a24fbcf8f52b8fc4dea53f740356266112abed4b91b8e048becac4206889717"
  }
}
```

## Entry rationale-474

```json
{
  "entryId": "rationale-474",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_60fe87198f033ece2b006252ddc50e4e",
  "before": "Move the complete direct unheaded-block unit \"**Human input:** a provider never blocks waiting for a person. It returns a `parked` `ProviderOutcome`; the host or work lifecycle re-invokes later. No provider is ever g\" from docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-44 to its frozen mapped owner docs/platform/host-invocation-routing/spec.md#unheaded-block-57. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Weak-exact: ancestor headings differ; independent full-text judgment remains required, not a script-proven approval.",
  "after": "Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md:188-188#unheaded-block-44 (current lines); unit SHA256 3929043697a06a1d0261e12e94ca86851463ab44fdd3422705178cf6caae2849.\nTarget: docs/platform/host-invocation-routing/spec.md:293-293#unheaded-block-58 (current lines); unit SHA256 3929043697a06a1d0261e12e94ca86851463ab44fdd3422705178cf6caae2849.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 3929043697a06a1d0261e12e94ca86851463ab44fdd3422705178cf6caae2849 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-44 under docs/platform/host-invocation-routing/spec.md#unheaded-block-58; source context \"Host Invocation And Provider Routing Architecture / 8. Failure, Cancellation, Lifecycle, And Human Input\", target context \"Spec: Host Invocation / Retained selected source material / Host Invocation And Provider Routing Architecture / 8. Failure, Cancellation, Lifecycle, And Human Input\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 473,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_60fe87198f033ece2b006252ddc50e4e",
    "sourceUnitDigest": "3929043697a06a1d0261e12e94ca86851463ab44fdd3422705178cf6caae2849",
    "claimKind": "architecture",
    "kind": "spec",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/spec.md",
    "targetAnchor": "unheaded-block-58",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md:188-188#unheaded-block-44 (current lines); unit SHA256 3929043697a06a1d0261e12e94ca86851463ab44fdd3422705178cf6caae2849.\nTarget: docs/platform/host-invocation-routing/spec.md:293-293#unheaded-block-58 (current lines); unit SHA256 3929043697a06a1d0261e12e94ca86851463ab44fdd3422705178cf6caae2849.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 3929043697a06a1d0261e12e94ca86851463ab44fdd3422705178cf6caae2849 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-44 under docs/platform/host-invocation-routing/spec.md#unheaded-block-58; source context \"Host Invocation And Provider Routing Architecture / 8. Failure, Cancellation, Lifecycle, And Human Input\", target context \"Spec: Host Invocation / Retained selected source material / Host Invocation And Provider Routing Architecture / 8. Failure, Cancellation, Lifecycle, And Human Input\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "3929043697a06a1d0261e12e94ca86851463ab44fdd3422705178cf6caae2849"
  }
}
```

## Entry rationale-475

```json
{
  "entryId": "rationale-475",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_d261432b2a27b402bd3027b58e918774",
  "before": "Move the complete direct unheaded-block unit \"The public command name stays `fgos` — runtime identity is the release digest, not the name, and every skill, hook, plugin, and Herdr call already targets `fgos <verb>`. \" from docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-45 to its frozen mapped owner docs/platform/host-invocation-routing/spec.md#unheaded-block-58. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Weak-exact: ancestor headings differ; independent full-text judgment remains required, not a script-proven approval.",
  "after": "Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md:192-192#unheaded-block-45 (current lines); unit SHA256 c840292ccea938c3cf06ce6a02184761ebb3e3e8c6929420be628a793adced07.\nTarget: docs/platform/host-invocation-routing/spec.md:297-297#unheaded-block-59 (current lines); unit SHA256 c840292ccea938c3cf06ce6a02184761ebb3e3e8c6929420be628a793adced07.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest c840292ccea938c3cf06ce6a02184761ebb3e3e8c6929420be628a793adced07 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-45 under docs/platform/host-invocation-routing/spec.md#unheaded-block-59; source context \"Host Invocation And Provider Routing Architecture / 9. Physical Placement\", target context \"Spec: Host Invocation / Retained selected source material / Host Invocation And Provider Routing Architecture / 9. Physical Placement\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 474,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_d261432b2a27b402bd3027b58e918774",
    "sourceUnitDigest": "c840292ccea938c3cf06ce6a02184761ebb3e3e8c6929420be628a793adced07",
    "claimKind": "architecture",
    "kind": "spec",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/spec.md",
    "targetAnchor": "unheaded-block-59",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md:192-192#unheaded-block-45 (current lines); unit SHA256 c840292ccea938c3cf06ce6a02184761ebb3e3e8c6929420be628a793adced07.\nTarget: docs/platform/host-invocation-routing/spec.md:297-297#unheaded-block-59 (current lines); unit SHA256 c840292ccea938c3cf06ce6a02184761ebb3e3e8c6929420be628a793adced07.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest c840292ccea938c3cf06ce6a02184761ebb3e3e8c6929420be628a793adced07 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-45 under docs/platform/host-invocation-routing/spec.md#unheaded-block-59; source context \"Host Invocation And Provider Routing Architecture / 9. Physical Placement\", target context \"Spec: Host Invocation / Retained selected source material / Host Invocation And Provider Routing Architecture / 9. Physical Placement\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "c840292ccea938c3cf06ce6a02184761ebb3e3e8c6929420be628a793adced07"
  }
}
```

## Entry rationale-476

```json
{
  "entryId": "rationale-476",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_54536d1078dc6a2b6eacd17105389f2b",
  "before": "Move the complete direct unheaded-block unit \"```txt Cargo.toml # workspace root; herdr-plugin/ excluded in R1 apps/ fgos/ # crate `fgos`, binary `fgos` — thin CLI adapter src/cli_projector.rs # argv -> OperationRequ\" from docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-46 to its frozen mapped owner docs/platform/host-invocation-routing/architecture/release-boundaries.md#unheaded-block-9. The literal restoration contains the complete pinned source span. This is the selected illustrative layout, not a current directory listing: the workspace uses apps/fgos and packages/host-runtime/rust and excludes apps/fgos-gateway; the actual snapshot constructor is registry.rs, not the proposed registry_linker.rs filename. Native counterpart class Judgment: no target digest match; independent full-text judgment remains required, not a script-proven approval.",
  "after": "Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md:194-218#unheaded-block-46 (current lines); unit SHA256 929b1469dbdfbbdfadf002fdd962c3bfd29976b3f19680af12997836a904fde9.\nTarget: docs/platform/host-invocation-routing/architecture/release-boundaries.md:70-96#unheaded-block-10 (current lines); unit SHA256 d6fcc6cfd6c69e8a58b5c5855b503a2a4e90f7387c63cb62e19732d1ce12f475.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest d6fcc6cfd6c69e8a58b5c5855b503a2a4e90f7387c63cb62e19732d1ce12f475 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-46 under docs/platform/host-invocation-routing/architecture/release-boundaries.md#unheaded-block-10; source context \"Host Invocation And Provider Routing Architecture / 9. Physical Placement\", target context \"Architecture: Release Boundaries / Restored physical placement layout tree\". The source text occurs verbatim inside the bound target section; section-level unit digests differ.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 475,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_54536d1078dc6a2b6eacd17105389f2b",
    "sourceUnitDigest": "929b1469dbdfbbdfadf002fdd962c3bfd29976b3f19680af12997836a904fde9",
    "claimKind": "architecture",
    "kind": "architecture",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/architecture/release-boundaries.md",
    "targetAnchor": "unheaded-block-10",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md:194-218#unheaded-block-46 (current lines); unit SHA256 929b1469dbdfbbdfadf002fdd962c3bfd29976b3f19680af12997836a904fde9.\nTarget: docs/platform/host-invocation-routing/architecture/release-boundaries.md:70-96#unheaded-block-10 (current lines); unit SHA256 d6fcc6cfd6c69e8a58b5c5855b503a2a4e90f7387c63cb62e19732d1ce12f475.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest d6fcc6cfd6c69e8a58b5c5855b503a2a4e90f7387c63cb62e19732d1ce12f475 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-46 under docs/platform/host-invocation-routing/architecture/release-boundaries.md#unheaded-block-10; source context \"Host Invocation And Provider Routing Architecture / 9. Physical Placement\", target context \"Architecture: Release Boundaries / Restored physical placement layout tree\". The source text occurs verbatim inside the bound target section; section-level unit digests differ.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "d6fcc6cfd6c69e8a58b5c5855b503a2a4e90f7387c63cb62e19732d1ce12f475"
  }
}
```

## Entry rationale-477

```json
{
  "entryId": "rationale-477",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_a069d263becad79e86a1381d36e62f13",
  "before": "Move the complete direct unheaded-block unit \"R1 is three crates: `fgos`, `fgos-host-runtime`, `fgos-distribution`. The legacy exec lane is a module inside `apps/fgos`, not a crate, because it is CLI-adapter-local (§\" from docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-47 to its frozen mapped owner docs/platform/host-invocation-routing/spec.md#unheaded-block-60. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Weak-exact: ancestor headings differ; independent full-text judgment remains required, not a script-proven approval.",
  "after": "Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md:220-220#unheaded-block-47 (current lines); unit SHA256 e0eb1265391694f861ef188d4e569ae238614bd714f6298ea2afef00598f2282.\nTarget: docs/platform/host-invocation-routing/spec.md:303-303#unheaded-block-61 (current lines); unit SHA256 e0eb1265391694f861ef188d4e569ae238614bd714f6298ea2afef00598f2282.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest e0eb1265391694f861ef188d4e569ae238614bd714f6298ea2afef00598f2282 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-47 under docs/platform/host-invocation-routing/spec.md#unheaded-block-61; source context \"Host Invocation And Provider Routing Architecture / 9. Physical Placement\", target context \"Spec: Host Invocation / Retained selected source material / Host Invocation And Provider Routing Architecture / 9. Physical Placement\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 476,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_a069d263becad79e86a1381d36e62f13",
    "sourceUnitDigest": "e0eb1265391694f861ef188d4e569ae238614bd714f6298ea2afef00598f2282",
    "claimKind": "architecture",
    "kind": "spec",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/spec.md",
    "targetAnchor": "unheaded-block-61",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md:220-220#unheaded-block-47 (current lines); unit SHA256 e0eb1265391694f861ef188d4e569ae238614bd714f6298ea2afef00598f2282.\nTarget: docs/platform/host-invocation-routing/spec.md:303-303#unheaded-block-61 (current lines); unit SHA256 e0eb1265391694f861ef188d4e569ae238614bd714f6298ea2afef00598f2282.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest e0eb1265391694f861ef188d4e569ae238614bd714f6298ea2afef00598f2282 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-47 under docs/platform/host-invocation-routing/spec.md#unheaded-block-61; source context \"Host Invocation And Provider Routing Architecture / 9. Physical Placement\", target context \"Spec: Host Invocation / Retained selected source material / Host Invocation And Provider Routing Architecture / 9. Physical Placement\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "e0eb1265391694f861ef188d4e569ae238614bd714f6298ea2afef00598f2282"
  }
}
```

## Entry rationale-478

```json
{
  "entryId": "rationale-478",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_21a5d8159161b20d737a94c96eb0a55d",
  "before": "Move the complete direct unheaded-block unit \"Chat is a valid future peer but does not gate R1/R2 until a real chat adapter and its admission/interruption/presentation contracts exist. \"Ship the Rust host\" means a re\" from docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-50 to its frozen mapped owner docs/platform/host-invocation-routing/spec.md#unheaded-block-63. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Weak-exact: ancestor headings differ; independent full-text judgment remains required, not a script-proven approval.",
  "after": "Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md:232-232#unheaded-block-50 (current lines); unit SHA256 392b9905690571d318ce75d583457da5f32bef8a19fb3860ba2a743e0ea24e2e.\nTarget: docs/platform/host-invocation-routing/spec.md:315-315#unheaded-block-64 (current lines); unit SHA256 392b9905690571d318ce75d583457da5f32bef8a19fb3860ba2a743e0ea24e2e.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 392b9905690571d318ce75d583457da5f32bef8a19fb3860ba2a743e0ea24e2e at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-50 under docs/platform/host-invocation-routing/spec.md#unheaded-block-64; source context \"Host Invocation And Provider Routing Architecture / 10. Release Boundaries\", target context \"Spec: Host Invocation / Retained selected source material / Host Invocation And Provider Routing Architecture / 10. Release Boundaries\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 477,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_21a5d8159161b20d737a94c96eb0a55d",
    "sourceUnitDigest": "392b9905690571d318ce75d583457da5f32bef8a19fb3860ba2a743e0ea24e2e",
    "claimKind": "architecture",
    "kind": "spec",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/spec.md",
    "targetAnchor": "unheaded-block-64",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md:232-232#unheaded-block-50 (current lines); unit SHA256 392b9905690571d318ce75d583457da5f32bef8a19fb3860ba2a743e0ea24e2e.\nTarget: docs/platform/host-invocation-routing/spec.md:315-315#unheaded-block-64 (current lines); unit SHA256 392b9905690571d318ce75d583457da5f32bef8a19fb3860ba2a743e0ea24e2e.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 392b9905690571d318ce75d583457da5f32bef8a19fb3860ba2a743e0ea24e2e at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-50 under docs/platform/host-invocation-routing/spec.md#unheaded-block-64; source context \"Host Invocation And Provider Routing Architecture / 10. Release Boundaries\", target context \"Spec: Host Invocation / Retained selected source material / Host Invocation And Provider Routing Architecture / 10. Release Boundaries\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "392b9905690571d318ce75d583457da5f32bef8a19fb3860ba2a743e0ea24e2e"
  }
}
```

## Entry rationale-479

```json
{
  "entryId": "rationale-479",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_a8f97838dcc5ffcbacc85b316d50e496",
  "before": "Move the complete direct unheaded-block unit \"1. Which fgOS-owned capabilities should ship as packaged extensions rather than core components? 2. What are the exact `OperationId` descriptors and CLI/REST/MCP projecti\" from docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-51 to its frozen mapped owner docs/platform/host-invocation-routing/spec.md#unheaded-block-64. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Weak-exact: ancestor headings differ; independent full-text judgment remains required, not a script-proven approval.",
  "after": "Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md:236-240#unheaded-block-51 (current lines); unit SHA256 f5832e351cd9a8b7b982a52c68aa23545a1964cf798550d2d91bac9e6803c7ac.\nTarget: docs/platform/host-invocation-routing/spec.md:319-323#unheaded-block-65 (current lines); unit SHA256 f5832e351cd9a8b7b982a52c68aa23545a1964cf798550d2d91bac9e6803c7ac.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest f5832e351cd9a8b7b982a52c68aa23545a1964cf798550d2d91bac9e6803c7ac at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-51 under docs/platform/host-invocation-routing/spec.md#unheaded-block-65; source context \"Host Invocation And Provider Routing Architecture / 11. Open Questions\", target context \"Spec: Host Invocation / Retained selected source material / Host Invocation And Provider Routing Architecture / 11. Open Questions\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 478,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_a8f97838dcc5ffcbacc85b316d50e496",
    "sourceUnitDigest": "f5832e351cd9a8b7b982a52c68aa23545a1964cf798550d2d91bac9e6803c7ac",
    "claimKind": "architecture",
    "kind": "spec",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/spec.md",
    "targetAnchor": "unheaded-block-65",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md:236-240#unheaded-block-51 (current lines); unit SHA256 f5832e351cd9a8b7b982a52c68aa23545a1964cf798550d2d91bac9e6803c7ac.\nTarget: docs/platform/host-invocation-routing/spec.md:319-323#unheaded-block-65 (current lines); unit SHA256 f5832e351cd9a8b7b982a52c68aa23545a1964cf798550d2d91bac9e6803c7ac.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest f5832e351cd9a8b7b982a52c68aa23545a1964cf798550d2d91bac9e6803c7ac at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-51 under docs/platform/host-invocation-routing/spec.md#unheaded-block-65; source context \"Host Invocation And Provider Routing Architecture / 11. Open Questions\", target context \"Spec: Host Invocation / Retained selected source material / Host Invocation And Provider Routing Architecture / 11. Open Questions\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "f5832e351cd9a8b7b982a52c68aa23545a1964cf798550d2d91bac9e6803c7ac"
  }
}
```

## Entry rationale-480

```json
{
  "entryId": "rationale-480",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_7b3c9cdf89fe70d17f3f526bbdffa385",
  "before": "Partial carry of the direct source section docs/architect/host-invocation-routing/legacy-cli-transition.md#1-two-distinct-adapters at docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#1-two-distinct-adapters; surrounding content stays here. Remainder: The relocated passage of docs/architect/host-invocation-routing/legacy-cli-transition.md#1-two-distinct-adapters is retained verbatim at docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-both-adapters-delegate-a-complete-use-case and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/legacy-cli-transition.md#unheaded-block-8 (claim_7046eb56f67c02ef82f621a3fa30286c; Both adapters delegate a complete use case. A host must not split one state transaction between native and legacy providers unless a compone). No source wording is discarded; this row does not claim the primary target alone contains the relocated passage.",
  "after": "Source: docs/architect/host-invocation-routing/legacy-cli-transition.md:20-20#1-two-distinct-adapters (current lines); unit SHA256 fee7e29c8f6886025098180b705008f43d5a3198943485c0256f5645b9cdc0fd.\nTarget: docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md:78-78#1-two-distinct-adapters (current lines); unit SHA256 49afb148ce5b49502adacce9e063c07b40e58fb0981db00e6b2d9048a726d90d.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 49afb148ce5b49502adacce9e063c07b40e58fb0981db00e6b2d9048a726d90d at 0c06e6e6b67a3897d660ee54de25fdc9971e59a4.\nLinks: source 0, target 1; 1 changed spellings/labels, 0 destination changes; 1 added, 0 removed.\nLink 1: \"none\" (none) → \"the dropped-009 restoration\" (../contracts/component-protocol.md#restored-both-adapters-delegate-a-complete-use-case); resolved none → docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-both-adapters-delegate-a-complete-use-case.\nHeading depth: 2 → 4; title \"1. Two Distinct Adapters\" → \"1. Two Distinct Adapters\".\nApplicable labelled corrections: none in this bound unit.\nDisposition partial-carry: Account for docs/architect/host-invocation-routing/legacy-cli-transition.md#1-two-distinct-adapters under docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#1-two-distinct-adapters; source context \"Legacy CLI Transition\", target context \"Architecture: Legacy CLI Transition / Retained selected source material / Legacy CLI Transition\". The source text occurs verbatim inside the bound target section; section-level unit digests differ. Recorded residual: The relocated passage of docs/architect/host-invocation-routing/legacy-cli-transition.md#1-two-distinct-adapters is retained verbatim at docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-both-adapters-delegate-a-complete-use-case and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/legacy-cli-transition.md#unheaded-block-8 (claim_7046eb56f67c02ef82f621a3fa30286c; Both adapters delegate a complete use case. A host must not split one state transaction between native and legacy providers unless a compone)..\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 479,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_7b3c9cdf89fe70d17f3f526bbdffa385",
    "sourceUnitDigest": "fee7e29c8f6886025098180b705008f43d5a3198943485c0256f5645b9cdc0fd",
    "claimKind": "architecture",
    "kind": "architecture",
    "disposition": "partial-carry",
    "targetOwner": "docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md",
    "targetAnchor": "1-two-distinct-adapters",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/legacy-cli-transition.md:20-20#1-two-distinct-adapters (current lines); unit SHA256 fee7e29c8f6886025098180b705008f43d5a3198943485c0256f5645b9cdc0fd.\nTarget: docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md:78-78#1-two-distinct-adapters (current lines); unit SHA256 49afb148ce5b49502adacce9e063c07b40e58fb0981db00e6b2d9048a726d90d.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 49afb148ce5b49502adacce9e063c07b40e58fb0981db00e6b2d9048a726d90d at 0c06e6e6b67a3897d660ee54de25fdc9971e59a4.\nLinks: source 0, target 1; 1 changed spellings/labels, 0 destination changes; 1 added, 0 removed.\nLink 1: \"none\" (none) → \"the dropped-009 restoration\" (../contracts/component-protocol.md#restored-both-adapters-delegate-a-complete-use-case); resolved none → docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-both-adapters-delegate-a-complete-use-case.\nHeading depth: 2 → 4; title \"1. Two Distinct Adapters\" → \"1. Two Distinct Adapters\".\nApplicable labelled corrections: none in this bound unit.\nDisposition partial-carry: Account for docs/architect/host-invocation-routing/legacy-cli-transition.md#1-two-distinct-adapters under docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#1-two-distinct-adapters; source context \"Legacy CLI Transition\", target context \"Architecture: Legacy CLI Transition / Retained selected source material / Legacy CLI Transition\". The source text occurs verbatim inside the bound target section; section-level unit digests differ. Recorded residual: The relocated passage of docs/architect/host-invocation-routing/legacy-cli-transition.md#1-two-distinct-adapters is retained verbatim at docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-both-adapters-delegate-a-complete-use-case and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/legacy-cli-transition.md#unheaded-block-8 (claim_7046eb56f67c02ef82f621a3fa30286c; Both adapters delegate a complete use case. A host must not split one state transaction between native and legacy providers unless a compone)..\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "remainder": "The relocated passage of docs/architect/host-invocation-routing/legacy-cli-transition.md#1-two-distinct-adapters is retained verbatim at docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-both-adapters-delegate-a-complete-use-case and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/legacy-cli-transition.md#unheaded-block-8 (claim_7046eb56f67c02ef82f621a3fa30286c; Both adapters delegate a complete use case. A host must not split one state transaction between native and legacy providers unless a compone).",
    "targetUnitDigest": "49afb148ce5b49502adacce9e063c07b40e58fb0981db00e6b2d9048a726d90d",
    "targetAncestry": [
      "Architecture: Legacy CLI Transition",
      "Retained selected source material",
      "Legacy CLI Transition"
    ]
  }
}
```

