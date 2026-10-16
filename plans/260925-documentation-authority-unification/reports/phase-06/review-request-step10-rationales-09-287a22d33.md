# Bounded re-review: rationales 9

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

## Entry rationale-481

```json
{
  "entryId": "rationale-481",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_0b85ea8ddcbd3d505edf8b110e3a42ad",
  "before": "Move the complete direct unheaded-block unit \"**Callers of the old path.** A grep for `bin/fgos.mjs` finds ~150 hits; only ~9 are real call sites, all of them variants of \"where is `fgos`?\": the shell function's tier\" from docs/architect/host-invocation-routing/legacy-cli-transition.md#unheaded-block-15 to its frozen mapped owner docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#unheaded-block-21. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Weak-exact: ancestor headings differ; independent full-text judgment remains required, not a script-proven approval.",
  "after": "Source: docs/architect/host-invocation-routing/legacy-cli-transition.md:50-50#unheaded-block-15 (current lines); unit SHA256 005feb9cee3518c306c052f3d406dfcf4897ead42158b9cf86d085b4aa9a1432.\nTarget: docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md:113-113#unheaded-block-22 (current lines); unit SHA256 005feb9cee3518c306c052f3d406dfcf4897ead42158b9cf86d085b4aa9a1432.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 005feb9cee3518c306c052f3d406dfcf4897ead42158b9cf86d085b4aa9a1432 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/legacy-cli-transition.md#unheaded-block-15 under docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#unheaded-block-22; source context \"Legacy CLI Transition / 2. Legacy Payload Identity, Ownership, And Repair Path\", target context \"Architecture: Legacy CLI Transition / Retained selected source material / Legacy CLI Transition / 2. Legacy Payload Identity, Ownership, And Repair Path\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 480,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_0b85ea8ddcbd3d505edf8b110e3a42ad",
    "sourceUnitDigest": "005feb9cee3518c306c052f3d406dfcf4897ead42158b9cf86d085b4aa9a1432",
    "claimKind": "architecture",
    "kind": "architecture",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md",
    "targetAnchor": "unheaded-block-22",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/legacy-cli-transition.md:50-50#unheaded-block-15 (current lines); unit SHA256 005feb9cee3518c306c052f3d406dfcf4897ead42158b9cf86d085b4aa9a1432.\nTarget: docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md:113-113#unheaded-block-22 (current lines); unit SHA256 005feb9cee3518c306c052f3d406dfcf4897ead42158b9cf86d085b4aa9a1432.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 005feb9cee3518c306c052f3d406dfcf4897ead42158b9cf86d085b4aa9a1432 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/legacy-cli-transition.md#unheaded-block-15 under docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#unheaded-block-22; source context \"Legacy CLI Transition / 2. Legacy Payload Identity, Ownership, And Repair Path\", target context \"Architecture: Legacy CLI Transition / Retained selected source material / Legacy CLI Transition / 2. Legacy Payload Identity, Ownership, And Repair Path\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "005feb9cee3518c306c052f3d406dfcf4897ead42158b9cf86d085b4aa9a1432"
  }
}
```

## Entry rationale-482

```json
{
  "entryId": "rationale-482",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_df8ecf59eaba9c13d5ebc60784018f80",
  "before": "Move the complete direct unheaded-block unit \"Every selector has exactly one generated `CommandRouteDescriptor`, derived from the Node command registry plus checked migration annotations. Its minimum fields:\" from docs/architect/host-invocation-routing/legacy-cli-transition.md#unheaded-block-16 to its frozen mapped owner docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#unheaded-block-22. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Weak-exact: ancestor headings differ; independent full-text judgment remains required, not a script-proven approval.",
  "after": "Source: docs/architect/host-invocation-routing/legacy-cli-transition.md:52-52#unheaded-block-16 (current lines); unit SHA256 faed6966caa51ebd578b4309e97396a7586a5b76331c228ea7e06e1c634dbb49.\nTarget: docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md:115-115#unheaded-block-23 (current lines); unit SHA256 faed6966caa51ebd578b4309e97396a7586a5b76331c228ea7e06e1c634dbb49.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest faed6966caa51ebd578b4309e97396a7586a5b76331c228ea7e06e1c634dbb49 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/legacy-cli-transition.md#unheaded-block-16 under docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#unheaded-block-23; source context \"Legacy CLI Transition / 2. Legacy Payload Identity, Ownership, And Repair Path\", target context \"Architecture: Legacy CLI Transition / Retained selected source material / Legacy CLI Transition / 2. Legacy Payload Identity, Ownership, And Repair Path\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 481,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_df8ecf59eaba9c13d5ebc60784018f80",
    "sourceUnitDigest": "faed6966caa51ebd578b4309e97396a7586a5b76331c228ea7e06e1c634dbb49",
    "claimKind": "architecture",
    "kind": "architecture",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md",
    "targetAnchor": "unheaded-block-23",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/legacy-cli-transition.md:52-52#unheaded-block-16 (current lines); unit SHA256 faed6966caa51ebd578b4309e97396a7586a5b76331c228ea7e06e1c634dbb49.\nTarget: docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md:115-115#unheaded-block-23 (current lines); unit SHA256 faed6966caa51ebd578b4309e97396a7586a5b76331c228ea7e06e1c634dbb49.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest faed6966caa51ebd578b4309e97396a7586a5b76331c228ea7e06e1c634dbb49 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/legacy-cli-transition.md#unheaded-block-16 under docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#unheaded-block-23; source context \"Legacy CLI Transition / 2. Legacy Payload Identity, Ownership, And Repair Path\", target context \"Architecture: Legacy CLI Transition / Retained selected source material / Legacy CLI Transition / 2. Legacy Payload Identity, Ownership, And Repair Path\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "faed6966caa51ebd578b4309e97396a7586a5b76331c228ea7e06e1c634dbb49"
  }
}
```

## Entry rationale-483

```json
{
  "entryId": "rationale-483",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_418ba1eb913f8fb73c2076c098709b9e",
  "before": "Move the complete direct unheaded-block unit \"```txt selector # canonical command/subcommand selector route_kind # legacy-cli | native operation_id # required only for native semantic routing legacy_payload # require\" from docs/architect/host-invocation-routing/legacy-cli-transition.md#unheaded-block-17 to its frozen mapped owner docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#unheaded-block-23. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Weak-exact: ancestor headings differ; independent full-text judgment remains required, not a script-proven approval.",
  "after": "Source: docs/architect/host-invocation-routing/legacy-cli-transition.md:54-61#unheaded-block-17 (current lines); unit SHA256 82c2e1bac0d754d2cd0cee59032449621aa149c236745c1e73f29ec3797088ab.\nTarget: docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md:117-124#unheaded-block-24 (current lines); unit SHA256 82c2e1bac0d754d2cd0cee59032449621aa149c236745c1e73f29ec3797088ab.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 82c2e1bac0d754d2cd0cee59032449621aa149c236745c1e73f29ec3797088ab at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/legacy-cli-transition.md#unheaded-block-17 under docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#unheaded-block-24; source context \"Legacy CLI Transition / 2. Legacy Payload Identity, Ownership, And Repair Path\", target context \"Architecture: Legacy CLI Transition / Retained selected source material / Legacy CLI Transition / 2. Legacy Payload Identity, Ownership, And Repair Path\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 482,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_418ba1eb913f8fb73c2076c098709b9e",
    "sourceUnitDigest": "82c2e1bac0d754d2cd0cee59032449621aa149c236745c1e73f29ec3797088ab",
    "claimKind": "architecture",
    "kind": "architecture",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md",
    "targetAnchor": "unheaded-block-24",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/legacy-cli-transition.md:54-61#unheaded-block-17 (current lines); unit SHA256 82c2e1bac0d754d2cd0cee59032449621aa149c236745c1e73f29ec3797088ab.\nTarget: docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md:117-124#unheaded-block-24 (current lines); unit SHA256 82c2e1bac0d754d2cd0cee59032449621aa149c236745c1e73f29ec3797088ab.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 82c2e1bac0d754d2cd0cee59032449621aa149c236745c1e73f29ec3797088ab at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/legacy-cli-transition.md#unheaded-block-17 under docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#unheaded-block-24; source context \"Legacy CLI Transition / 2. Legacy Payload Identity, Ownership, And Repair Path\", target context \"Architecture: Legacy CLI Transition / Retained selected source material / Legacy CLI Transition / 2. Legacy Payload Identity, Ownership, And Repair Path\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "82c2e1bac0d754d2cd0cee59032449621aa149c236745c1e73f29ec3797088ab"
  }
}
```

## Entry rationale-484

```json
{
  "entryId": "rationale-484",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_7cc93760fbe54867480b91577fcbbf34",
  "before": "Move the complete direct unheaded-block unit \"`legacy-cli` means the Node payload owns argument parsing and behavior; the Rust host must only recognize the checked selector and preserve the remaining `OsString` argv.\" from docs/architect/host-invocation-routing/legacy-cli-transition.md#unheaded-block-18 to its frozen mapped owner docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#unheaded-block-24. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Weak-exact: ancestor headings differ; independent full-text judgment remains required, not a script-proven approval.",
  "after": "Source: docs/architect/host-invocation-routing/legacy-cli-transition.md:63-63#unheaded-block-18 (current lines); unit SHA256 cdee5daf3a57d1ab26afa4ab6edbd9564cae928dafec2c1c8a696ded900f32da.\nTarget: docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md:126-126#unheaded-block-25 (current lines); unit SHA256 cdee5daf3a57d1ab26afa4ab6edbd9564cae928dafec2c1c8a696ded900f32da.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest cdee5daf3a57d1ab26afa4ab6edbd9564cae928dafec2c1c8a696ded900f32da at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/legacy-cli-transition.md#unheaded-block-18 under docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#unheaded-block-25; source context \"Legacy CLI Transition / 2. Legacy Payload Identity, Ownership, And Repair Path\", target context \"Architecture: Legacy CLI Transition / Retained selected source material / Legacy CLI Transition / 2. Legacy Payload Identity, Ownership, And Repair Path\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 483,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_7cc93760fbe54867480b91577fcbbf34",
    "sourceUnitDigest": "cdee5daf3a57d1ab26afa4ab6edbd9564cae928dafec2c1c8a696ded900f32da",
    "claimKind": "architecture",
    "kind": "architecture",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md",
    "targetAnchor": "unheaded-block-25",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/legacy-cli-transition.md:63-63#unheaded-block-18 (current lines); unit SHA256 cdee5daf3a57d1ab26afa4ab6edbd9564cae928dafec2c1c8a696ded900f32da.\nTarget: docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md:126-126#unheaded-block-25 (current lines); unit SHA256 cdee5daf3a57d1ab26afa4ab6edbd9564cae928dafec2c1c8a696ded900f32da.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest cdee5daf3a57d1ab26afa4ab6edbd9564cae928dafec2c1c8a696ded900f32da at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/legacy-cli-transition.md#unheaded-block-18 under docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#unheaded-block-25; source context \"Legacy CLI Transition / 2. Legacy Payload Identity, Ownership, And Repair Path\", target context \"Architecture: Legacy CLI Transition / Retained selected source material / Legacy CLI Transition / 2. Legacy Payload Identity, Ownership, And Repair Path\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "cdee5daf3a57d1ab26afa4ab6edbd9564cae928dafec2c1c8a696ded900f32da"
  }
}
```

## Entry rationale-485

```json
{
  "entryId": "rationale-485",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_174de09282f33f3be061af276a2f312c",
  "before": "Move the complete direct unheaded-block unit \"The descriptor is both the routing input and the contributor repair map. A repository-local `scripts/explain-command-route.mjs <selector>` reads the same checked artifact\" from docs/architect/host-invocation-routing/legacy-cli-transition.md#unheaded-block-19 to its frozen mapped owner docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#unheaded-block-25. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Weak-exact: ancestor headings differ; independent full-text judgment remains required, not a script-proven approval.",
  "after": "Source: docs/architect/host-invocation-routing/legacy-cli-transition.md:65-65#unheaded-block-19 (current lines); unit SHA256 7bff1203d4199d2bf5a8f30d49702196a121cabef40e79c2c87493876e83de1f.\nTarget: docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md:128-128#unheaded-block-26 (current lines); unit SHA256 7bff1203d4199d2bf5a8f30d49702196a121cabef40e79c2c87493876e83de1f.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 7bff1203d4199d2bf5a8f30d49702196a121cabef40e79c2c87493876e83de1f at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/legacy-cli-transition.md#unheaded-block-19 under docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#unheaded-block-26; source context \"Legacy CLI Transition / 2. Legacy Payload Identity, Ownership, And Repair Path\", target context \"Architecture: Legacy CLI Transition / Retained selected source material / Legacy CLI Transition / 2. Legacy Payload Identity, Ownership, And Repair Path\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 484,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_174de09282f33f3be061af276a2f312c",
    "sourceUnitDigest": "7bff1203d4199d2bf5a8f30d49702196a121cabef40e79c2c87493876e83de1f",
    "claimKind": "architecture",
    "kind": "architecture",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md",
    "targetAnchor": "unheaded-block-26",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/legacy-cli-transition.md:65-65#unheaded-block-19 (current lines); unit SHA256 7bff1203d4199d2bf5a8f30d49702196a121cabef40e79c2c87493876e83de1f.\nTarget: docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md:128-128#unheaded-block-26 (current lines); unit SHA256 7bff1203d4199d2bf5a8f30d49702196a121cabef40e79c2c87493876e83de1f.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 7bff1203d4199d2bf5a8f30d49702196a121cabef40e79c2c87493876e83de1f at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/legacy-cli-transition.md#unheaded-block-19 under docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#unheaded-block-26; source context \"Legacy CLI Transition / 2. Legacy Payload Identity, Ownership, And Repair Path\", target context \"Architecture: Legacy CLI Transition / Retained selected source material / Legacy CLI Transition / 2. Legacy Payload Identity, Ownership, And Repair Path\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "7bff1203d4199d2bf5a8f30d49702196a121cabef40e79c2c87493876e83de1f"
  }
}
```

## Entry rationale-486

```json
{
  "entryId": "rationale-486",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_19d889291655b99062f6d2a96f4d46e0",
  "before": "Move the complete direct unheaded-block unit \"**Rollback:** configuration can never replace a built-in provider (kernel contract §7), and there is no runtime provider-selection swap to roll back a native operation. R\" from docs/architect/host-invocation-routing/legacy-cli-transition.md#unheaded-block-20 to its frozen mapped owner docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#unheaded-block-26. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Weak-exact: ancestor headings differ; independent full-text judgment remains required, not a script-proven approval.",
  "after": "Source: docs/architect/host-invocation-routing/legacy-cli-transition.md:67-67#unheaded-block-20 (current lines); unit SHA256 f4eba1a374f08d640043dd98dbd0cf896df4390952d99b534d3db1d91f4a3888.\nTarget: docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md:130-130#unheaded-block-27 (current lines); unit SHA256 f4eba1a374f08d640043dd98dbd0cf896df4390952d99b534d3db1d91f4a3888.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest f4eba1a374f08d640043dd98dbd0cf896df4390952d99b534d3db1d91f4a3888 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/legacy-cli-transition.md#unheaded-block-20 under docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#unheaded-block-27; source context \"Legacy CLI Transition / 2. Legacy Payload Identity, Ownership, And Repair Path\", target context \"Architecture: Legacy CLI Transition / Retained selected source material / Legacy CLI Transition / 2. Legacy Payload Identity, Ownership, And Repair Path\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 485,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_19d889291655b99062f6d2a96f4d46e0",
    "sourceUnitDigest": "f4eba1a374f08d640043dd98dbd0cf896df4390952d99b534d3db1d91f4a3888",
    "claimKind": "contract",
    "kind": "architecture",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md",
    "targetAnchor": "unheaded-block-27",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/legacy-cli-transition.md:67-67#unheaded-block-20 (current lines); unit SHA256 f4eba1a374f08d640043dd98dbd0cf896df4390952d99b534d3db1d91f4a3888.\nTarget: docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md:130-130#unheaded-block-27 (current lines); unit SHA256 f4eba1a374f08d640043dd98dbd0cf896df4390952d99b534d3db1d91f4a3888.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest f4eba1a374f08d640043dd98dbd0cf896df4390952d99b534d3db1d91f4a3888 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/legacy-cli-transition.md#unheaded-block-20 under docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#unheaded-block-27; source context \"Legacy CLI Transition / 2. Legacy Payload Identity, Ownership, And Repair Path\", target context \"Architecture: Legacy CLI Transition / Retained selected source material / Legacy CLI Transition / 2. Legacy Payload Identity, Ownership, And Repair Path\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "f4eba1a374f08d640043dd98dbd0cf896df4390952d99b534d3db1d91f4a3888"
  }
}
```

## Entry rationale-487

```json
{
  "entryId": "rationale-487",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_2150505ad7a90a909c876f86d9f5045b",
  "before": "Move the complete direct unheaded-block unit \"While a CLI verb is legacy, the Rust CLI recognizes only a checked command selector and forwards every provider-owned `OsString` unchanged. The selector routes under a re\" from docs/architect/host-invocation-routing/legacy-cli-transition.md#unheaded-block-22 to its frozen mapped owner docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#unheaded-block-28. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Weak-exact: ancestor headings differ; independent full-text judgment remains required, not a script-proven approval.",
  "after": "Source: docs/architect/host-invocation-routing/legacy-cli-transition.md:73-73#unheaded-block-22 (current lines); unit SHA256 2e1f61975368434cb3d88ff92f9b9d2273920b8ea96a524ce7d84ba4a400db56.\nTarget: docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md:138-138#unheaded-block-29 (current lines); unit SHA256 2e1f61975368434cb3d88ff92f9b9d2273920b8ea96a524ce7d84ba4a400db56.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 2e1f61975368434cb3d88ff92f9b9d2273920b8ea96a524ce7d84ba4a400db56 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/legacy-cli-transition.md#unheaded-block-22 under docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#unheaded-block-29; source context \"Legacy CLI Transition / 3. Command Metadata And Parser Ownership\", target context \"Architecture: Legacy CLI Transition / Retained selected source material / Legacy CLI Transition / 3. Command Metadata And Parser Ownership\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 486,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_2150505ad7a90a909c876f86d9f5045b",
    "sourceUnitDigest": "2e1f61975368434cb3d88ff92f9b9d2273920b8ea96a524ce7d84ba4a400db56",
    "claimKind": "architecture",
    "kind": "architecture",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md",
    "targetAnchor": "unheaded-block-29",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/legacy-cli-transition.md:73-73#unheaded-block-22 (current lines); unit SHA256 2e1f61975368434cb3d88ff92f9b9d2273920b8ea96a524ce7d84ba4a400db56.\nTarget: docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md:138-138#unheaded-block-29 (current lines); unit SHA256 2e1f61975368434cb3d88ff92f9b9d2273920b8ea96a524ce7d84ba4a400db56.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 2e1f61975368434cb3d88ff92f9b9d2273920b8ea96a524ce7d84ba4a400db56 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/legacy-cli-transition.md#unheaded-block-22 under docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#unheaded-block-29; source context \"Legacy CLI Transition / 3. Command Metadata And Parser Ownership\", target context \"Architecture: Legacy CLI Transition / Retained selected source material / Legacy CLI Transition / 3. Command Metadata And Parser Ownership\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "2e1f61975368434cb3d88ff92f9b9d2273920b8ea96a524ce7d84ba4a400db56"
  }
}
```

## Entry rationale-488

```json
{
  "entryId": "rationale-488",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_e9ae0be6b74c4968b45802eb2cf6eb4f",
  "before": "Move the complete direct unheaded-block unit \"A deterministic generated command descriptor may bridge the current Node registry into the Rust host during migration. Generated metadata is validated for drift; it is no\" from docs/architect/host-invocation-routing/legacy-cli-transition.md#unheaded-block-23 to its frozen mapped owner docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#unheaded-block-29. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Weak-exact: ancestor headings differ; independent full-text judgment remains required, not a script-proven approval.",
  "after": "Source: docs/architect/host-invocation-routing/legacy-cli-transition.md:75-75#unheaded-block-23 (current lines); unit SHA256 3eb90ced14c221064458c91c8f9e056943c8a444a5f425cf2c139718881b5a0d.\nTarget: docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md:140-140#unheaded-block-30 (current lines); unit SHA256 3eb90ced14c221064458c91c8f9e056943c8a444a5f425cf2c139718881b5a0d.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 3eb90ced14c221064458c91c8f9e056943c8a444a5f425cf2c139718881b5a0d at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/legacy-cli-transition.md#unheaded-block-23 under docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#unheaded-block-30; source context \"Legacy CLI Transition / 3. Command Metadata And Parser Ownership\", target context \"Architecture: Legacy CLI Transition / Retained selected source material / Legacy CLI Transition / 3. Command Metadata And Parser Ownership\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 487,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_e9ae0be6b74c4968b45802eb2cf6eb4f",
    "sourceUnitDigest": "3eb90ced14c221064458c91c8f9e056943c8a444a5f425cf2c139718881b5a0d",
    "claimKind": "architecture",
    "kind": "architecture",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md",
    "targetAnchor": "unheaded-block-30",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/legacy-cli-transition.md:75-75#unheaded-block-23 (current lines); unit SHA256 3eb90ced14c221064458c91c8f9e056943c8a444a5f425cf2c139718881b5a0d.\nTarget: docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md:140-140#unheaded-block-30 (current lines); unit SHA256 3eb90ced14c221064458c91c8f9e056943c8a444a5f425cf2c139718881b5a0d.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 3eb90ced14c221064458c91c8f9e056943c8a444a5f425cf2c139718881b5a0d at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/legacy-cli-transition.md#unheaded-block-23 under docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#unheaded-block-30; source context \"Legacy CLI Transition / 3. Command Metadata And Parser Ownership\", target context \"Architecture: Legacy CLI Transition / Retained selected source material / Legacy CLI Transition / 3. Command Metadata And Parser Ownership\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "3eb90ced14c221064458c91c8f9e056943c8a444a5f425cf2c139718881b5a0d"
  }
}
```

## Entry rationale-489

```json
{
  "entryId": "rationale-489",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_87f8a5d0c80c3f928422a7ffbef9e8ee",
  "before": "Move the complete direct unheaded-block unit \"`fgos.v1` belongs to the CLI presenter, not to the provider protocol. Likewise, HTTP status and MCP tool results belong to the remote presenter.\" from docs/architect/host-invocation-routing/legacy-cli-transition.md#unheaded-block-24 to its frozen mapped owner docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#unheaded-block-30. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Weak-exact: ancestor headings differ; independent full-text judgment remains required, not a script-proven approval.",
  "after": "Source: docs/architect/host-invocation-routing/legacy-cli-transition.md:79-79#unheaded-block-24 (current lines); unit SHA256 e7f17313cf29b200e52c2db52e8ec9b8e4c4817230753bff368004d73c705581.\nTarget: docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md:144-144#unheaded-block-31 (current lines); unit SHA256 e7f17313cf29b200e52c2db52e8ec9b8e4c4817230753bff368004d73c705581.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest e7f17313cf29b200e52c2db52e8ec9b8e4c4817230753bff368004d73c705581 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/legacy-cli-transition.md#unheaded-block-24 under docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#unheaded-block-31; source context \"Legacy CLI Transition / 4. Public Presentation Versus Semantic Outcome\", target context \"Architecture: Legacy CLI Transition / Retained selected source material / Legacy CLI Transition / 4. Public Presentation Versus Semantic Outcome\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 488,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_87f8a5d0c80c3f928422a7ffbef9e8ee",
    "sourceUnitDigest": "e7f17313cf29b200e52c2db52e8ec9b8e4c4817230753bff368004d73c705581",
    "claimKind": "contract",
    "kind": "architecture",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md",
    "targetAnchor": "unheaded-block-31",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/legacy-cli-transition.md:79-79#unheaded-block-24 (current lines); unit SHA256 e7f17313cf29b200e52c2db52e8ec9b8e4c4817230753bff368004d73c705581.\nTarget: docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md:144-144#unheaded-block-31 (current lines); unit SHA256 e7f17313cf29b200e52c2db52e8ec9b8e4c4817230753bff368004d73c705581.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest e7f17313cf29b200e52c2db52e8ec9b8e4c4817230753bff368004d73c705581 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/legacy-cli-transition.md#unheaded-block-24 under docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#unheaded-block-31; source context \"Legacy CLI Transition / 4. Public Presentation Versus Semantic Outcome\", target context \"Architecture: Legacy CLI Transition / Retained selected source material / Legacy CLI Transition / 4. Public Presentation Versus Semantic Outcome\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "e7f17313cf29b200e52c2db52e8ec9b8e4c4817230753bff368004d73c705581"
  }
}
```

## Entry rationale-490

```json
{
  "entryId": "rationale-490",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_b44be17fc9825eab5a9a6822c1473110",
  "before": "Move the complete direct unheaded-block unit \"Native providers return `ProviderOutcome`; the calling presenter wraps it once. Transparent legacy output (from `LegacyCliPassthroughProvider`) is already a public presen\" from docs/architect/host-invocation-routing/legacy-cli-transition.md#unheaded-block-25 to its frozen mapped owner docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#unheaded-block-31. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Weak-exact: ancestor headings differ; independent full-text judgment remains required, not a script-proven approval.",
  "after": "Source: docs/architect/host-invocation-routing/legacy-cli-transition.md:81-81#unheaded-block-25 (current lines); unit SHA256 9842f2c86633b096fb3d855b79923a9c0646a8b23a28cbe0ecd61b1c22d50db7.\nTarget: docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md:146-146#unheaded-block-32 (current lines); unit SHA256 9842f2c86633b096fb3d855b79923a9c0646a8b23a28cbe0ecd61b1c22d50db7.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 9842f2c86633b096fb3d855b79923a9c0646a8b23a28cbe0ecd61b1c22d50db7 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/legacy-cli-transition.md#unheaded-block-25 under docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#unheaded-block-32; source context \"Legacy CLI Transition / 4. Public Presentation Versus Semantic Outcome\", target context \"Architecture: Legacy CLI Transition / Retained selected source material / Legacy CLI Transition / 4. Public Presentation Versus Semantic Outcome\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 489,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_b44be17fc9825eab5a9a6822c1473110",
    "sourceUnitDigest": "9842f2c86633b096fb3d855b79923a9c0646a8b23a28cbe0ecd61b1c22d50db7",
    "claimKind": "architecture",
    "kind": "architecture",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md",
    "targetAnchor": "unheaded-block-32",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/legacy-cli-transition.md:81-81#unheaded-block-25 (current lines); unit SHA256 9842f2c86633b096fb3d855b79923a9c0646a8b23a28cbe0ecd61b1c22d50db7.\nTarget: docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md:146-146#unheaded-block-32 (current lines); unit SHA256 9842f2c86633b096fb3d855b79923a9c0646a8b23a28cbe0ecd61b1c22d50db7.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 9842f2c86633b096fb3d855b79923a9c0646a8b23a28cbe0ecd61b1c22d50db7 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/legacy-cli-transition.md#unheaded-block-25 under docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#unheaded-block-32; source context \"Legacy CLI Transition / 4. Public Presentation Versus Semantic Outcome\", target context \"Architecture: Legacy CLI Transition / Retained selected source material / Legacy CLI Transition / 4. Public Presentation Versus Semantic Outcome\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "9842f2c86633b096fb3d855b79923a9c0646a8b23a28cbe0ecd61b1c22d50db7"
  }
}
```

## Entry rationale-491

```json
{
  "entryId": "rationale-491",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_d3a32297633d7d7cc626d7723dca46c7",
  "before": "Move the complete direct unheaded-block unit \"Current `fgos.v1` hashes compact `JSON.stringify(data)` bytes but prints the final envelope using two-space pretty JSON. Cross-runtime compatibility tests therefore separ\" from docs/architect/host-invocation-routing/legacy-cli-transition.md#unheaded-block-26 to its frozen mapped owner docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#unheaded-block-32. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Weak-exact: ancestor headings differ; independent full-text judgment remains required, not a script-proven approval.",
  "after": "Source: docs/architect/host-invocation-routing/legacy-cli-transition.md:83-83#unheaded-block-26 (current lines); unit SHA256 4661fe2bffbd3ed3adcc1045f8dc757e4e271e65f77393743c7f75febdfece3f.\nTarget: docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md:148-148#unheaded-block-33 (current lines); unit SHA256 4661fe2bffbd3ed3adcc1045f8dc757e4e271e65f77393743c7f75febdfece3f.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 4661fe2bffbd3ed3adcc1045f8dc757e4e271e65f77393743c7f75febdfece3f at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/legacy-cli-transition.md#unheaded-block-26 under docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#unheaded-block-33; source context \"Legacy CLI Transition / 4. Public Presentation Versus Semantic Outcome\", target context \"Architecture: Legacy CLI Transition / Retained selected source material / Legacy CLI Transition / 4. Public Presentation Versus Semantic Outcome\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 490,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_d3a32297633d7d7cc626d7723dca46c7",
    "sourceUnitDigest": "4661fe2bffbd3ed3adcc1045f8dc757e4e271e65f77393743c7f75febdfece3f",
    "claimKind": "architecture",
    "kind": "architecture",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md",
    "targetAnchor": "unheaded-block-33",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/legacy-cli-transition.md:83-83#unheaded-block-26 (current lines); unit SHA256 4661fe2bffbd3ed3adcc1045f8dc757e4e271e65f77393743c7f75febdfece3f.\nTarget: docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md:148-148#unheaded-block-33 (current lines); unit SHA256 4661fe2bffbd3ed3adcc1045f8dc757e4e271e65f77393743c7f75febdfece3f.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 4661fe2bffbd3ed3adcc1045f8dc757e4e271e65f77393743c7f75febdfece3f at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/legacy-cli-transition.md#unheaded-block-26 under docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#unheaded-block-33; source context \"Legacy CLI Transition / 4. Public Presentation Versus Semantic Outcome\", target context \"Architecture: Legacy CLI Transition / Retained selected source material / Legacy CLI Transition / 4. Public Presentation Versus Semantic Outcome\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "4661fe2bffbd3ed3adcc1045f8dc757e4e271e65f77393743c7f75febdfece3f"
  }
}
```

## Entry rationale-492

```json
{
  "entryId": "rationale-492",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_9a1f08d0bc4045fde2455e9a8d196a29",
  "before": "Move the complete direct unheaded-block unit \"Golden vectors are necessary but not sufficient. A Node-generated differential corpus covers object insertion order, integer limits, negative zero, floating exponent form\" from docs/architect/host-invocation-routing/legacy-cli-transition.md#unheaded-block-27 to its frozen mapped owner docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#unheaded-block-33. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Weak-exact: ancestor headings differ; independent full-text judgment remains required, not a script-proven approval.",
  "after": "Source: docs/architect/host-invocation-routing/legacy-cli-transition.md:85-85#unheaded-block-27 (current lines); unit SHA256 c0a85f4f3e27eeba57d5dff78dba55b787570a4c0b86f411a694538811de1fb4.\nTarget: docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md:150-150#unheaded-block-34 (current lines); unit SHA256 c0a85f4f3e27eeba57d5dff78dba55b787570a4c0b86f411a694538811de1fb4.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest c0a85f4f3e27eeba57d5dff78dba55b787570a4c0b86f411a694538811de1fb4 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/legacy-cli-transition.md#unheaded-block-27 under docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#unheaded-block-34; source context \"Legacy CLI Transition / 4. Public Presentation Versus Semantic Outcome\", target context \"Architecture: Legacy CLI Transition / Retained selected source material / Legacy CLI Transition / 4. Public Presentation Versus Semantic Outcome\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 491,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_9a1f08d0bc4045fde2455e9a8d196a29",
    "sourceUnitDigest": "c0a85f4f3e27eeba57d5dff78dba55b787570a4c0b86f411a694538811de1fb4",
    "claimKind": "architecture",
    "kind": "architecture",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md",
    "targetAnchor": "unheaded-block-34",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/legacy-cli-transition.md:85-85#unheaded-block-27 (current lines); unit SHA256 c0a85f4f3e27eeba57d5dff78dba55b787570a4c0b86f411a694538811de1fb4.\nTarget: docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md:150-150#unheaded-block-34 (current lines); unit SHA256 c0a85f4f3e27eeba57d5dff78dba55b787570a4c0b86f411a694538811de1fb4.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest c0a85f4f3e27eeba57d5dff78dba55b787570a4c0b86f411a694538811de1fb4 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/legacy-cli-transition.md#unheaded-block-27 under docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#unheaded-block-34; source context \"Legacy CLI Transition / 4. Public Presentation Versus Semantic Outcome\", target context \"Architecture: Legacy CLI Transition / Retained selected source material / Legacy CLI Transition / 4. Public Presentation Versus Semantic Outcome\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "c0a85f4f3e27eeba57d5dff78dba55b787570a4c0b86f411a694538811de1fb4"
  }
}
```

## Entry rationale-493

```json
{
  "entryId": "rationale-493",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_039865ac614bd07bd3b1f00f89e39441",
  "before": "Move the complete direct unheaded-block unit \"Making Rust the host before migrating components places the final composition root, peer host use cases, provider registry, and plugin seam in their permanent runtime imm\" from docs/architect/host-invocation-routing/legacy-cli-transition.md#unheaded-block-28 to its frozen mapped owner docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#unheaded-block-34. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Weak-exact: ancestor headings differ; independent full-text judgment remains required, not a script-proven approval.",
  "after": "Source: docs/architect/host-invocation-routing/legacy-cli-transition.md:89-89#unheaded-block-28 (current lines); unit SHA256 aa5f1acfc283ff3bf42d5fc63f54a9493aa89c8ede9a6f188a5c33728771508b.\nTarget: docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md:154-154#unheaded-block-35 (current lines); unit SHA256 aa5f1acfc283ff3bf42d5fc63f54a9493aa89c8ede9a6f188a5c33728771508b.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest aa5f1acfc283ff3bf42d5fc63f54a9493aa89c8ede9a6f188a5c33728771508b at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/legacy-cli-transition.md#unheaded-block-28 under docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#unheaded-block-35; source context \"Legacy CLI Transition / 5. Rust Host First: Benefit And Cost\", target context \"Architecture: Legacy CLI Transition / Retained selected source material / Legacy CLI Transition / 5. Rust Host First: Benefit And Cost\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 492,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_039865ac614bd07bd3b1f00f89e39441",
    "sourceUnitDigest": "aa5f1acfc283ff3bf42d5fc63f54a9493aa89c8ede9a6f188a5c33728771508b",
    "claimKind": "architecture",
    "kind": "architecture",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md",
    "targetAnchor": "unheaded-block-35",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/legacy-cli-transition.md:89-89#unheaded-block-28 (current lines); unit SHA256 aa5f1acfc283ff3bf42d5fc63f54a9493aa89c8ede9a6f188a5c33728771508b.\nTarget: docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md:154-154#unheaded-block-35 (current lines); unit SHA256 aa5f1acfc283ff3bf42d5fc63f54a9493aa89c8ede9a6f188a5c33728771508b.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest aa5f1acfc283ff3bf42d5fc63f54a9493aa89c8ede9a6f188a5c33728771508b at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/legacy-cli-transition.md#unheaded-block-28 under docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#unheaded-block-35; source context \"Legacy CLI Transition / 5. Rust Host First: Benefit And Cost\", target context \"Architecture: Legacy CLI Transition / Retained selected source material / Legacy CLI Transition / 5. Rust Host First: Benefit And Cost\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "aa5f1acfc283ff3bf42d5fc63f54a9493aa89c8ede9a6f188a5c33728771508b"
  }
}
```

## Entry rationale-494

```json
{
  "entryId": "rationale-494",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_2519e82bb2a6054b1b822fc266471424",
  "before": "Move the complete direct unheaded-block unit \"This document discusses only migration options, ordering, transition stages, cutover, and rollback. The stable host model, peer CLI/remote host use cases, Operation Provi\" from docs/architect/host-invocation-routing/node-to-rust-component-migration.md#unheaded-block-2 to its frozen mapped owner docs/platform/host-invocation-routing/architecture/release-boundaries.md#unheaded-block-29. The literal restoration contains the complete pinned source span. The scope and advisory-reading obligation are selected engineering guidance, not an automated runtime gate. The cited workspace records the actual current component placement. Native counterpart class Judgment: no target digest match; independent full-text judgment remains required, not a script-proven approval.",
  "after": "Source: docs/architect/host-invocation-routing/node-to-rust-component-migration.md:15-26#unheaded-block-2 (current lines); unit SHA256 3eb6efe648980740c062eb5f792200bc14dd24c64c620f7c677ab1657bdf87bd.\nTarget: docs/platform/host-invocation-routing/architecture/release-boundaries.md:172-185#unheaded-block-30 (current lines); unit SHA256 99352315c72370b04c18a9eed19b9c526ad319b71d99560f7914766b0b98a15a.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 99352315c72370b04c18a9eed19b9c526ad319b71d99560f7914766b0b98a15a at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 3, target 3; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/node-to-rust-component-migration.md#unheaded-block-2 under docs/platform/host-invocation-routing/architecture/release-boundaries.md#unheaded-block-30; source context \"Node To Rust Component Migration\", target context \"Architecture: Release Boundaries / Restored scope\". The source text occurs verbatim inside the bound target section; section-level unit digests differ.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 493,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_2519e82bb2a6054b1b822fc266471424",
    "sourceUnitDigest": "3eb6efe648980740c062eb5f792200bc14dd24c64c620f7c677ab1657bdf87bd",
    "claimKind": "architecture",
    "kind": "architecture",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/architecture/release-boundaries.md",
    "targetAnchor": "unheaded-block-30",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/node-to-rust-component-migration.md:15-26#unheaded-block-2 (current lines); unit SHA256 3eb6efe648980740c062eb5f792200bc14dd24c64c620f7c677ab1657bdf87bd.\nTarget: docs/platform/host-invocation-routing/architecture/release-boundaries.md:172-185#unheaded-block-30 (current lines); unit SHA256 99352315c72370b04c18a9eed19b9c526ad319b71d99560f7914766b0b98a15a.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 99352315c72370b04c18a9eed19b9c526ad319b71d99560f7914766b0b98a15a at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 3, target 3; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/node-to-rust-component-migration.md#unheaded-block-2 under docs/platform/host-invocation-routing/architecture/release-boundaries.md#unheaded-block-30; source context \"Node To Rust Component Migration\", target context \"Architecture: Release Boundaries / Restored scope\". The source text occurs verbatim inside the bound target section; section-level unit digests differ.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "99352315c72370b04c18a9eed19b9c526ad319b71d99560f7914766b0b98a15a"
  }
}
```

## Entry rationale-495

```json
{
  "entryId": "rationale-495",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_c072318ec582affe5e0e6936961fadc4",
  "before": "Partial carry of the direct source section docs/architect/host-invocation-routing/node-to-rust-component-migration.md#9-repeat-by-component-boundary at docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md#9-repeat-by-component-boundary; surrounding content stays here. Remainder: The relocated passage of docs/architect/host-invocation-routing/node-to-rust-component-migration.md#9-repeat-by-component-boundary is retained verbatim at docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-per-component-repeat-procedure and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/node-to-rust-component-migration.md#unheaded-block-44 (claim_9f2283b25ef4be9f0e68b4381f1ce08e; For each subsequent component:); docs/architect/host-invocation-routing/node-to-rust-component-migration.md#unheaded-block-45 (claim_abc80009ab1bf59c40a645089fbc82fd; 1. Read [fgOS Component Boundary Advisory](../component-boundary/component-boundary-advisory.md) and name responsibility, semantic ope). No source wording is discarded; this row does not claim the primary target alone contains the relocated passage.",
  "after": "Source: docs/architect/host-invocation-routing/node-to-rust-component-migration.md:303-303#9-repeat-by-component-boundary (current lines); unit SHA256 d1c2fad49a5087903461482aaa9dbb0b96c53baa6db717e0546f8b185552307f.\nTarget: docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md:340-340#9-repeat-by-component-boundary (current lines); unit SHA256 ef6d9f08943bdc073dcf957c969015d6821b081aeb08b90898f0f1024dd2319e.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest ef6d9f08943bdc073dcf957c969015d6821b081aeb08b90898f0f1024dd2319e at 0c06e6e6b67a3897d660ee54de25fdc9971e59a4.\nLinks: source 1, target 1; 1 changed spellings/labels, 1 destination changes; 0 added, 0 removed.\nLink 1: \"fgOS Component Boundary Advisory\" (../component-boundary/component-boundary-advisory.md) → \"the dropped-014 restoration\" (../contracts/component-protocol.md#restored-per-component-repeat-procedure); resolved docs/architect/component-boundary/component-boundary-advisory.md → docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-per-component-repeat-procedure.\nHeading depth: 2 → 4; title \"9. Repeat By Component Boundary\" → \"9. Repeat By Component Boundary\".\nApplicable labelled corrections: none in this bound unit.\nDisposition partial-carry: Account for docs/architect/host-invocation-routing/node-to-rust-component-migration.md#9-repeat-by-component-boundary under docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md#9-repeat-by-component-boundary; source context \"Node To Rust Component Migration\", target context \"Architecture: Node To Rust Migration / Retained selected source material / Node To Rust Component Migration\". The source text occurs verbatim inside the bound target section; section-level unit digests differ. Recorded residual: The relocated passage of docs/architect/host-invocation-routing/node-to-rust-component-migration.md#9-repeat-by-component-boundary is retained verbatim at docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-per-component-repeat-procedure and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/node-to-rust-component-migration.md#unheaded-block-44 (claim_9f2283b25ef4be9f0e68b4381f1ce08e; For each subsequent component:); docs/architect/host-invocation-routing/node-to-rust-component-migration.md#unheaded-block-45 (claim_abc80009ab1bf59c40a645089fbc82fd; 1. Read [fgOS Component Boundary Advisory](../component-boundary/component-boundary-advisory.md) and name responsibility, semantic ope)..\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 494,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_c072318ec582affe5e0e6936961fadc4",
    "sourceUnitDigest": "d1c2fad49a5087903461482aaa9dbb0b96c53baa6db717e0546f8b185552307f",
    "claimKind": "contract",
    "kind": "architecture",
    "disposition": "partial-carry",
    "targetOwner": "docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md",
    "targetAnchor": "9-repeat-by-component-boundary",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/node-to-rust-component-migration.md:303-303#9-repeat-by-component-boundary (current lines); unit SHA256 d1c2fad49a5087903461482aaa9dbb0b96c53baa6db717e0546f8b185552307f.\nTarget: docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md:340-340#9-repeat-by-component-boundary (current lines); unit SHA256 ef6d9f08943bdc073dcf957c969015d6821b081aeb08b90898f0f1024dd2319e.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest ef6d9f08943bdc073dcf957c969015d6821b081aeb08b90898f0f1024dd2319e at 0c06e6e6b67a3897d660ee54de25fdc9971e59a4.\nLinks: source 1, target 1; 1 changed spellings/labels, 1 destination changes; 0 added, 0 removed.\nLink 1: \"fgOS Component Boundary Advisory\" (../component-boundary/component-boundary-advisory.md) → \"the dropped-014 restoration\" (../contracts/component-protocol.md#restored-per-component-repeat-procedure); resolved docs/architect/component-boundary/component-boundary-advisory.md → docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-per-component-repeat-procedure.\nHeading depth: 2 → 4; title \"9. Repeat By Component Boundary\" → \"9. Repeat By Component Boundary\".\nApplicable labelled corrections: none in this bound unit.\nDisposition partial-carry: Account for docs/architect/host-invocation-routing/node-to-rust-component-migration.md#9-repeat-by-component-boundary under docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md#9-repeat-by-component-boundary; source context \"Node To Rust Component Migration\", target context \"Architecture: Node To Rust Migration / Retained selected source material / Node To Rust Component Migration\". The source text occurs verbatim inside the bound target section; section-level unit digests differ. Recorded residual: The relocated passage of docs/architect/host-invocation-routing/node-to-rust-component-migration.md#9-repeat-by-component-boundary is retained verbatim at docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-per-component-repeat-procedure and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/node-to-rust-component-migration.md#unheaded-block-44 (claim_9f2283b25ef4be9f0e68b4381f1ce08e; For each subsequent component:); docs/architect/host-invocation-routing/node-to-rust-component-migration.md#unheaded-block-45 (claim_abc80009ab1bf59c40a645089fbc82fd; 1. Read [fgOS Component Boundary Advisory](../component-boundary/component-boundary-advisory.md) and name responsibility, semantic ope)..\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "remainder": "The relocated passage of docs/architect/host-invocation-routing/node-to-rust-component-migration.md#9-repeat-by-component-boundary is retained verbatim at docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-per-component-repeat-procedure and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/node-to-rust-component-migration.md#unheaded-block-44 (claim_9f2283b25ef4be9f0e68b4381f1ce08e; For each subsequent component:); docs/architect/host-invocation-routing/node-to-rust-component-migration.md#unheaded-block-45 (claim_abc80009ab1bf59c40a645089fbc82fd; 1. Read [fgOS Component Boundary Advisory](../component-boundary/component-boundary-advisory.md) and name responsibility, semantic ope).",
    "targetUnitDigest": "ef6d9f08943bdc073dcf957c969015d6821b081aeb08b90898f0f1024dd2319e",
    "targetAncestry": [
      "Architecture: Node To Rust Migration",
      "Retained selected source material",
      "Node To Rust Component Migration"
    ]
  }
}
```

## Entry rationale-496

```json
{
  "entryId": "rationale-496",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_e960a05c0b656d0dae2cffd3daee5a0d",
  "before": "Partial carry of the direct source section docs/architect/host-invocation-routing/node-to-rust-component-migration.md#10-migrate-read-models-before-writers at docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md#10-migrate-read-models-before-writers; surrounding content stays here. Remainder: The relocated passage of docs/architect/host-invocation-routing/node-to-rust-component-migration.md#10-migrate-read-models-before-writers is retained verbatim at docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-per-component-repeat-procedure and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/node-to-rust-component-migration.md#unheaded-block-49 (claim_99bf6932b3f44681c138edf8384d652b; Sequence it internally:); docs/architect/host-invocation-routing/node-to-rust-component-migration.md#unheaded-block-50 (claim_056d11e86ef88989c436bc14a24997a1; 1. event/schema decode fixtures; 2. deterministic replay fixtures; 3. domain/stage projection fixtures; 4. frontier calculation fixtures; 5.). No source wording is discarded; this row does not claim the primary target alone contains the relocated passage.",
  "after": "Source: docs/architect/host-invocation-routing/node-to-rust-component-migration.md:329-329#10-migrate-read-models-before-writers (current lines); unit SHA256 225088240c21859fc36ee71b02c32151f4f19e37a2a17e8539b159561d58f15c.\nTarget: docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md:355-355#10-migrate-read-models-before-writers (current lines); unit SHA256 5ae126eab3838fb0b18c1226734b38c22b3674d2b370d9c47193602a09990c6d.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 5ae126eab3838fb0b18c1226734b38c22b3674d2b370d9c47193602a09990c6d at 0c06e6e6b67a3897d660ee54de25fdc9971e59a4.\nLinks: source 0, target 1; 1 changed spellings/labels, 0 destination changes; 1 added, 0 removed.\nLink 1: \"none\" (none) → \"the dropped-014 restoration\" (../contracts/component-protocol.md#restored-per-component-repeat-procedure); resolved none → docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-per-component-repeat-procedure.\nHeading depth: 2 → 4; title \"10. Migrate Read Models Before Writers\" → \"10. Migrate Read Models Before Writers\".\nApplicable labelled corrections: none in this bound unit.\nDisposition partial-carry: Account for docs/architect/host-invocation-routing/node-to-rust-component-migration.md#10-migrate-read-models-before-writers under docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md#10-migrate-read-models-before-writers; source context \"Node To Rust Component Migration\", target context \"Architecture: Node To Rust Migration / Retained selected source material / Node To Rust Component Migration\". The source text occurs verbatim inside the bound target section; section-level unit digests differ. Recorded residual: The relocated passage of docs/architect/host-invocation-routing/node-to-rust-component-migration.md#10-migrate-read-models-before-writers is retained verbatim at docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-per-component-repeat-procedure and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/node-to-rust-component-migration.md#unheaded-block-49 (claim_99bf6932b3f44681c138edf8384d652b; Sequence it internally:); docs/architect/host-invocation-routing/node-to-rust-component-migration.md#unheaded-block-50 (claim_056d11e86ef88989c436bc14a24997a1; 1. event/schema decode fixtures; 2. deterministic replay fixtures; 3. domain/stage projection fixtures; 4. frontier calculation fixtures; 5.)..\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 495,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_e960a05c0b656d0dae2cffd3daee5a0d",
    "sourceUnitDigest": "225088240c21859fc36ee71b02c32151f4f19e37a2a17e8539b159561d58f15c",
    "claimKind": "architecture",
    "kind": "architecture",
    "disposition": "partial-carry",
    "targetOwner": "docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md",
    "targetAnchor": "10-migrate-read-models-before-writers",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/node-to-rust-component-migration.md:329-329#10-migrate-read-models-before-writers (current lines); unit SHA256 225088240c21859fc36ee71b02c32151f4f19e37a2a17e8539b159561d58f15c.\nTarget: docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md:355-355#10-migrate-read-models-before-writers (current lines); unit SHA256 5ae126eab3838fb0b18c1226734b38c22b3674d2b370d9c47193602a09990c6d.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 5ae126eab3838fb0b18c1226734b38c22b3674d2b370d9c47193602a09990c6d at 0c06e6e6b67a3897d660ee54de25fdc9971e59a4.\nLinks: source 0, target 1; 1 changed spellings/labels, 0 destination changes; 1 added, 0 removed.\nLink 1: \"none\" (none) → \"the dropped-014 restoration\" (../contracts/component-protocol.md#restored-per-component-repeat-procedure); resolved none → docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-per-component-repeat-procedure.\nHeading depth: 2 → 4; title \"10. Migrate Read Models Before Writers\" → \"10. Migrate Read Models Before Writers\".\nApplicable labelled corrections: none in this bound unit.\nDisposition partial-carry: Account for docs/architect/host-invocation-routing/node-to-rust-component-migration.md#10-migrate-read-models-before-writers under docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md#10-migrate-read-models-before-writers; source context \"Node To Rust Component Migration\", target context \"Architecture: Node To Rust Migration / Retained selected source material / Node To Rust Component Migration\". The source text occurs verbatim inside the bound target section; section-level unit digests differ. Recorded residual: The relocated passage of docs/architect/host-invocation-routing/node-to-rust-component-migration.md#10-migrate-read-models-before-writers is retained verbatim at docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-per-component-repeat-procedure and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/node-to-rust-component-migration.md#unheaded-block-49 (claim_99bf6932b3f44681c138edf8384d652b; Sequence it internally:); docs/architect/host-invocation-routing/node-to-rust-component-migration.md#unheaded-block-50 (claim_056d11e86ef88989c436bc14a24997a1; 1. event/schema decode fixtures; 2. deterministic replay fixtures; 3. domain/stage projection fixtures; 4. frontier calculation fixtures; 5.)..\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "remainder": "The relocated passage of docs/architect/host-invocation-routing/node-to-rust-component-migration.md#10-migrate-read-models-before-writers is retained verbatim at docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-per-component-repeat-procedure and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/node-to-rust-component-migration.md#unheaded-block-49 (claim_99bf6932b3f44681c138edf8384d652b; Sequence it internally:); docs/architect/host-invocation-routing/node-to-rust-component-migration.md#unheaded-block-50 (claim_056d11e86ef88989c436bc14a24997a1; 1. event/schema decode fixtures; 2. deterministic replay fixtures; 3. domain/stage projection fixtures; 4. frontier calculation fixtures; 5.).",
    "targetUnitDigest": "5ae126eab3838fb0b18c1226734b38c22b3674d2b370d9c47193602a09990c6d",
    "targetAncestry": [
      "Architecture: Node To Rust Migration",
      "Retained selected source material",
      "Node To Rust Component Migration"
    ]
  }
}
```

## Entry rationale-497

```json
{
  "entryId": "rationale-497",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_c710c879488536d7a2b949141952f010",
  "before": "Move the complete direct unheaded-block unit \"This document contains execution order, deliverables, gates, verification, and rollback. Semantic contracts, provider lifecycle, authority, framing, registry rules, compa\" from docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-2 to its frozen mapped owner docs/platform/host-invocation-routing/roadmap.md#unheaded-block-61. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Weak-exact: ancestor headings differ; document exact share below one half; independent full-text judgment remains required, not a script-proven approval.",
  "after": "Source: docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md:13-16#unheaded-block-2 (current lines); unit SHA256 1aef0de67780feebd51f6b6ba3d08db23ffc4032b2b98c9e945aa188cab3d413.\nTarget: docs/platform/host-invocation-routing/roadmap.md:335-338#unheaded-block-62 (current lines); unit SHA256 1aef0de67780feebd51f6b6ba3d08db23ffc4032b2b98c9e945aa188cab3d413.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 1aef0de67780feebd51f6b6ba3d08db23ffc4032b2b98c9e945aa188cab3d413 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-2 under docs/platform/host-invocation-routing/roadmap.md#unheaded-block-62; source context \"Rust Host And Proof Providers Implementation Plan\", target context \"Host Invocation Routing Roadmap / Retained selected source material / Rust Host And Proof Providers Implementation Plan\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 496,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_c710c879488536d7a2b949141952f010",
    "sourceUnitDigest": "1aef0de67780feebd51f6b6ba3d08db23ffc4032b2b98c9e945aa188cab3d413",
    "claimKind": "architecture",
    "kind": "roadmap",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/roadmap.md",
    "targetAnchor": "unheaded-block-62",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md:13-16#unheaded-block-2 (current lines); unit SHA256 1aef0de67780feebd51f6b6ba3d08db23ffc4032b2b98c9e945aa188cab3d413.\nTarget: docs/platform/host-invocation-routing/roadmap.md:335-338#unheaded-block-62 (current lines); unit SHA256 1aef0de67780feebd51f6b6ba3d08db23ffc4032b2b98c9e945aa188cab3d413.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 1aef0de67780feebd51f6b6ba3d08db23ffc4032b2b98c9e945aa188cab3d413 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-2 under docs/platform/host-invocation-routing/roadmap.md#unheaded-block-62; source context \"Rust Host And Proof Providers Implementation Plan\", target context \"Host Invocation Routing Roadmap / Retained selected source material / Rust Host And Proof Providers Implementation Plan\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "1aef0de67780feebd51f6b6ba3d08db23ffc4032b2b98c9e945aa188cab3d413"
  }
}
```

## Entry rationale-498

```json
{
  "entryId": "rationale-498",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_a29012c7fb94f83828b7835413eebcc2",
  "before": "Move the complete direct unheaded-block unit \"Execution is complete in three independently shippable releases:\" from docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-4 to its frozen mapped owner docs/platform/host-invocation-routing/roadmap.md#unheaded-block-63. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Weak-exact: ancestor headings differ; document exact share below one half; independent full-text judgment remains required, not a script-proven approval.",
  "after": "Source: docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md:32-32#unheaded-block-4 (current lines); unit SHA256 62f374c5546f8bcbc6881ebbeb92e06b217c31d4229c8e8c862cf1de45532120.\nTarget: docs/platform/host-invocation-routing/roadmap.md:355-355#unheaded-block-64 (current lines); unit SHA256 62f374c5546f8bcbc6881ebbeb92e06b217c31d4229c8e8c862cf1de45532120.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 62f374c5546f8bcbc6881ebbeb92e06b217c31d4229c8e8c862cf1de45532120 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-4 under docs/platform/host-invocation-routing/roadmap.md#unheaded-block-64; source context \"Rust Host And Proof Providers Implementation Plan / 1. Outcome\", target context \"Host Invocation Routing Roadmap / Retained selected source material / Rust Host And Proof Providers Implementation Plan / 1. Outcome\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 497,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_a29012c7fb94f83828b7835413eebcc2",
    "sourceUnitDigest": "62f374c5546f8bcbc6881ebbeb92e06b217c31d4229c8e8c862cf1de45532120",
    "claimKind": "architecture",
    "kind": "roadmap",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/roadmap.md",
    "targetAnchor": "unheaded-block-64",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md:32-32#unheaded-block-4 (current lines); unit SHA256 62f374c5546f8bcbc6881ebbeb92e06b217c31d4229c8e8c862cf1de45532120.\nTarget: docs/platform/host-invocation-routing/roadmap.md:355-355#unheaded-block-64 (current lines); unit SHA256 62f374c5546f8bcbc6881ebbeb92e06b217c31d4229c8e8c862cf1de45532120.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 62f374c5546f8bcbc6881ebbeb92e06b217c31d4229c8e8c862cf1de45532120 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-4 under docs/platform/host-invocation-routing/roadmap.md#unheaded-block-64; source context \"Rust Host And Proof Providers Implementation Plan / 1. Outcome\", target context \"Host Invocation Routing Roadmap / Retained selected source material / Rust Host And Proof Providers Implementation Plan / 1. Outcome\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "62f374c5546f8bcbc6881ebbeb92e06b217c31d4229c8e8c862cf1de45532120"
  }
}
```

## Entry rationale-499

```json
{
  "entryId": "rationale-499",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_ab6683864cea05c444f1b78cd30475b9",
  "before": "Move the complete direct unheaded-block unit \"1. **R1 — distributable Rust CLI host:** installed `fgos` is Rust; every unmigrated CLI invocation transparently reaches Node; `version` is native; install, init/doctor, \" from docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-5 to its frozen mapped owner docs/platform/host-invocation-routing/roadmap.md#unheaded-block-64. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Weak-exact: ancestor headings differ; document exact share below one half; independent full-text judgment remains required, not a script-proven approval.",
  "after": "Source: docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md:34-44#unheaded-block-5 (current lines); unit SHA256 e0c70d6e826e2c968203b8648bdf07702f7afc0ed341faaeb9908fa8d0d04ec9.\nTarget: docs/platform/host-invocation-routing/roadmap.md:357-367#unheaded-block-65 (current lines); unit SHA256 e0c70d6e826e2c968203b8648bdf07702f7afc0ed341faaeb9908fa8d0d04ec9.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest e0c70d6e826e2c968203b8648bdf07702f7afc0ed341faaeb9908fa8d0d04ec9 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-5 under docs/platform/host-invocation-routing/roadmap.md#unheaded-block-65; source context \"Rust Host And Proof Providers Implementation Plan / 1. Outcome\", target context \"Host Invocation Routing Roadmap / Retained selected source material / Rust Host And Proof Providers Implementation Plan / 1. Outcome\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 498,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_ab6683864cea05c444f1b78cd30475b9",
    "sourceUnitDigest": "e0c70d6e826e2c968203b8648bdf07702f7afc0ed341faaeb9908fa8d0d04ec9",
    "claimKind": "architecture",
    "kind": "roadmap",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/roadmap.md",
    "targetAnchor": "unheaded-block-65",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md:34-44#unheaded-block-5 (current lines); unit SHA256 e0c70d6e826e2c968203b8648bdf07702f7afc0ed341faaeb9908fa8d0d04ec9.\nTarget: docs/platform/host-invocation-routing/roadmap.md:357-367#unheaded-block-65 (current lines); unit SHA256 e0c70d6e826e2c968203b8648bdf07702f7afc0ed341faaeb9908fa8d0d04ec9.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest e0c70d6e826e2c968203b8648bdf07702f7afc0ed341faaeb9908fa8d0d04ec9 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-5 under docs/platform/host-invocation-routing/roadmap.md#unheaded-block-65; source context \"Rust Host And Proof Providers Implementation Plan / 1. Outcome\", target context \"Host Invocation Routing Roadmap / Retained selected source material / Rust Host And Proof Providers Implementation Plan / 1. Outcome\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "e0c70d6e826e2c968203b8648bdf07702f7afc0ed341faaeb9908fa8d0d04ec9"
  }
}
```

## Entry rationale-500

```json
{
  "entryId": "rationale-500",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_a411676b68cace20da24d92621ed8925",
  "before": "Move the complete direct unheaded-block unit \"R1 is useful without R2 or R3. R2 and R3 may start after the R1 runtime kernel is stable, but neither delays the R1 installed-entry flip.\" from docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-6 to its frozen mapped owner docs/platform/host-invocation-routing/roadmap.md#unheaded-block-65. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Weak-exact: ancestor headings differ; document exact share below one half; independent full-text judgment remains required, not a script-proven approval.",
  "after": "Source: docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md:46-47#unheaded-block-6 (current lines); unit SHA256 32389e1a464f6b37542fac98207f8f4ce710bcb7406ddc72bb1ca973f5e10290.\nTarget: docs/platform/host-invocation-routing/roadmap.md:369-370#unheaded-block-66 (current lines); unit SHA256 32389e1a464f6b37542fac98207f8f4ce710bcb7406ddc72bb1ca973f5e10290.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 32389e1a464f6b37542fac98207f8f4ce710bcb7406ddc72bb1ca973f5e10290 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-6 under docs/platform/host-invocation-routing/roadmap.md#unheaded-block-66; source context \"Rust Host And Proof Providers Implementation Plan / 1. Outcome\", target context \"Host Invocation Routing Roadmap / Retained selected source material / Rust Host And Proof Providers Implementation Plan / 1. Outcome\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 499,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_a411676b68cace20da24d92621ed8925",
    "sourceUnitDigest": "32389e1a464f6b37542fac98207f8f4ce710bcb7406ddc72bb1ca973f5e10290",
    "claimKind": "architecture",
    "kind": "roadmap",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/roadmap.md",
    "targetAnchor": "unheaded-block-66",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md:46-47#unheaded-block-6 (current lines); unit SHA256 32389e1a464f6b37542fac98207f8f4ce710bcb7406ddc72bb1ca973f5e10290.\nTarget: docs/platform/host-invocation-routing/roadmap.md:369-370#unheaded-block-66 (current lines); unit SHA256 32389e1a464f6b37542fac98207f8f4ce710bcb7406ddc72bb1ca973f5e10290.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 32389e1a464f6b37542fac98207f8f4ce710bcb7406ddc72bb1ca973f5e10290 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-6 under docs/platform/host-invocation-routing/roadmap.md#unheaded-block-66; source context \"Rust Host And Proof Providers Implementation Plan / 1. Outcome\", target context \"Host Invocation Routing Roadmap / Retained selected source material / Rust Host And Proof Providers Implementation Plan / 1. Outcome\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "32389e1a464f6b37542fac98207f8f4ce710bcb7406ddc72bb1ca973f5e10290"
  }
}
```

## Entry rationale-501

```json
{
  "entryId": "rationale-501",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_cde3d5a31e679710c732f892d197b7ef",
  "before": "Move the complete direct unheaded-block unit \"- No Work Lifecycle writer, event append, claim/return, merge, runner, or coordination execution migration. - No repository-wide Node thinning before a component is selec\" from docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-7 to its frozen mapped owner docs/platform/host-invocation-routing/roadmap.md#unheaded-block-66. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Weak-exact: ancestor headings differ; document exact share below one half; independent full-text judgment remains required, not a script-proven approval.",
  "after": "Source: docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md:51-59#unheaded-block-7 (current lines); unit SHA256 8fef48718a84f098a0ab5e18c4db4c38d9eb5193a12c67d3b8eef3a6ee275f50.\nTarget: docs/platform/host-invocation-routing/roadmap.md:374-382#unheaded-block-67 (current lines); unit SHA256 8fef48718a84f098a0ab5e18c4db4c38d9eb5193a12c67d3b8eef3a6ee275f50.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 8fef48718a84f098a0ab5e18c4db4c38d9eb5193a12c67d3b8eef3a6ee275f50 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-7 under docs/platform/host-invocation-routing/roadmap.md#unheaded-block-67; source context \"Rust Host And Proof Providers Implementation Plan / 2. Non-Goals\", target context \"Host Invocation Routing Roadmap / Retained selected source material / Rust Host And Proof Providers Implementation Plan / 2. Non-Goals\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 500,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_cde3d5a31e679710c732f892d197b7ef",
    "sourceUnitDigest": "8fef48718a84f098a0ab5e18c4db4c38d9eb5193a12c67d3b8eef3a6ee275f50",
    "claimKind": "architecture",
    "kind": "roadmap",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/roadmap.md",
    "targetAnchor": "unheaded-block-67",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md:51-59#unheaded-block-7 (current lines); unit SHA256 8fef48718a84f098a0ab5e18c4db4c38d9eb5193a12c67d3b8eef3a6ee275f50.\nTarget: docs/platform/host-invocation-routing/roadmap.md:374-382#unheaded-block-67 (current lines); unit SHA256 8fef48718a84f098a0ab5e18c4db4c38d9eb5193a12c67d3b8eef3a6ee275f50.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 8fef48718a84f098a0ab5e18c4db4c38d9eb5193a12c67d3b8eef3a6ee275f50 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-7 under docs/platform/host-invocation-routing/roadmap.md#unheaded-block-67; source context \"Rust Host And Proof Providers Implementation Plan / 2. Non-Goals\", target context \"Host Invocation Routing Roadmap / Retained selected source material / Rust Host And Proof Providers Implementation Plan / 2. Non-Goals\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "8fef48718a84f098a0ab5e18c4db4c38d9eb5193a12c67d3b8eef3a6ee275f50"
  }
}
```

## Entry rationale-502

```json
{
  "entryId": "rationale-502",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_edbd740417658e6cfc22ced75d91b633",
  "before": "Move the complete direct unheaded-block unit \"These are product/release inputs, not implementation details to guess:\" from docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-8 to its frozen mapped owner docs/platform/host-invocation-routing/roadmap.md#unheaded-block-67. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Weak-exact: ancestor headings differ; document exact share below one half; independent full-text judgment remains required, not a script-proven approval.",
  "after": "Source: docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md:63-63#unheaded-block-8 (current lines); unit SHA256 32ffceba26aa0249afd1beeb73ab684f5afe328719c0a1c14b43a244f3dab9e8.\nTarget: docs/platform/host-invocation-routing/roadmap.md:386-386#unheaded-block-68 (current lines); unit SHA256 32ffceba26aa0249afd1beeb73ab684f5afe328719c0a1c14b43a244f3dab9e8.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 32ffceba26aa0249afd1beeb73ab684f5afe328719c0a1c14b43a244f3dab9e8 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-8 under docs/platform/host-invocation-routing/roadmap.md#unheaded-block-68; source context \"Rust Host And Proof Providers Implementation Plan / 3. Decisions Required Before R1 Execution\", target context \"Host Invocation Routing Roadmap / Retained selected source material / Rust Host And Proof Providers Implementation Plan / 3. Decisions Required Before R1 Execution\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 501,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_edbd740417658e6cfc22ced75d91b633",
    "sourceUnitDigest": "32ffceba26aa0249afd1beeb73ab684f5afe328719c0a1c14b43a244f3dab9e8",
    "claimKind": "architecture",
    "kind": "roadmap",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/roadmap.md",
    "targetAnchor": "unheaded-block-68",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md:63-63#unheaded-block-8 (current lines); unit SHA256 32ffceba26aa0249afd1beeb73ab684f5afe328719c0a1c14b43a244f3dab9e8.\nTarget: docs/platform/host-invocation-routing/roadmap.md:386-386#unheaded-block-68 (current lines); unit SHA256 32ffceba26aa0249afd1beeb73ab684f5afe328719c0a1c14b43a244f3dab9e8.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 32ffceba26aa0249afd1beeb73ab684f5afe328719c0a1c14b43a244f3dab9e8 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-8 under docs/platform/host-invocation-routing/roadmap.md#unheaded-block-68; source context \"Rust Host And Proof Providers Implementation Plan / 3. Decisions Required Before R1 Execution\", target context \"Host Invocation Routing Roadmap / Retained selected source material / Rust Host And Proof Providers Implementation Plan / 3. Decisions Required Before R1 Execution\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "32ffceba26aa0249afd1beeb73ab684f5afe328719c0a1c14b43a244f3dab9e8"
  }
}
```

## Entry rationale-503

```json
{
  "entryId": "rationale-503",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_c84180b3855a6187533b4f6f92c23630",
  "before": "Move the complete direct unheaded-block unit \"1. supported R1 target matrix; 2. ~~native archive publication and installation mechanism~~ — settled, see `runtime-identity-and-activation.md` §13 (`fgctl` Rust bootstra\" from docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-9 to its frozen mapped owner docs/platform/host-invocation-routing/roadmap.md#unheaded-block-68. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Weak-exact: ancestor headings differ; document exact share below one half; independent full-text judgment remains required, not a script-proven approval.",
  "after": "Source: docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md:65-79#unheaded-block-9 (current lines); unit SHA256 b6d4224f87ecdb2f74261c30bb303ff75d438aed2bdddcdbeb6cb7872473b4f9.\nTarget: docs/platform/host-invocation-routing/roadmap.md:388-402#unheaded-block-69 (current lines); unit SHA256 b6d4224f87ecdb2f74261c30bb303ff75d438aed2bdddcdbeb6cb7872473b4f9.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest b6d4224f87ecdb2f74261c30bb303ff75d438aed2bdddcdbeb6cb7872473b4f9 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-9 under docs/platform/host-invocation-routing/roadmap.md#unheaded-block-69; source context \"Rust Host And Proof Providers Implementation Plan / 3. Decisions Required Before R1 Execution\", target context \"Host Invocation Routing Roadmap / Retained selected source material / Rust Host And Proof Providers Implementation Plan / 3. Decisions Required Before R1 Execution\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 502,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_c84180b3855a6187533b4f6f92c23630",
    "sourceUnitDigest": "b6d4224f87ecdb2f74261c30bb303ff75d438aed2bdddcdbeb6cb7872473b4f9",
    "claimKind": "architecture",
    "kind": "roadmap",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/roadmap.md",
    "targetAnchor": "unheaded-block-69",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md:65-79#unheaded-block-9 (current lines); unit SHA256 b6d4224f87ecdb2f74261c30bb303ff75d438aed2bdddcdbeb6cb7872473b4f9.\nTarget: docs/platform/host-invocation-routing/roadmap.md:388-402#unheaded-block-69 (current lines); unit SHA256 b6d4224f87ecdb2f74261c30bb303ff75d438aed2bdddcdbeb6cb7872473b4f9.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest b6d4224f87ecdb2f74261c30bb303ff75d438aed2bdddcdbeb6cb7872473b4f9 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-9 under docs/platform/host-invocation-routing/roadmap.md#unheaded-block-69; source context \"Rust Host And Proof Providers Implementation Plan / 3. Decisions Required Before R1 Execution\", target context \"Host Invocation Routing Roadmap / Retained selected source material / Rust Host And Proof Providers Implementation Plan / 3. Decisions Required Before R1 Execution\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "b6d4224f87ecdb2f74261c30bb303ff75d438aed2bdddcdbeb6cb7872473b4f9"
  }
}
```

## Entry rationale-504

```json
{
  "entryId": "rationale-504",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_fb9821c822ae8aa2c943c79604fe94f1",
  "before": "Move the complete direct unheaded-block unit \"Decision \"whether setup/doctor may ever select or download an upgrade\" is closed: **never**. `fgctl` owns acquisition/upgrade/rollback; local `fgos init` and `fgos doctor\" from docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-10 to its frozen mapped owner docs/platform/host-invocation-routing/roadmap.md#unheaded-block-69. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Weak-exact: ancestor headings differ; document exact share below one half; independent full-text judgment remains required, not a script-proven approval.",
  "after": "Source: docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md:81-86#unheaded-block-10 (current lines); unit SHA256 e5c1c36c536525efbd5c547c830796fcee1a1b50a772c7eadbdae0e54c940e2e.\nTarget: docs/platform/host-invocation-routing/roadmap.md:404-409#unheaded-block-70 (current lines); unit SHA256 e5c1c36c536525efbd5c547c830796fcee1a1b50a772c7eadbdae0e54c940e2e.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest e5c1c36c536525efbd5c547c830796fcee1a1b50a772c7eadbdae0e54c940e2e at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-10 under docs/platform/host-invocation-routing/roadmap.md#unheaded-block-70; source context \"Rust Host And Proof Providers Implementation Plan / 3. Decisions Required Before R1 Execution\", target context \"Host Invocation Routing Roadmap / Retained selected source material / Rust Host And Proof Providers Implementation Plan / 3. Decisions Required Before R1 Execution\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 503,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_fb9821c822ae8aa2c943c79604fe94f1",
    "sourceUnitDigest": "e5c1c36c536525efbd5c547c830796fcee1a1b50a772c7eadbdae0e54c940e2e",
    "claimKind": "decision",
    "kind": "roadmap",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/roadmap.md",
    "targetAnchor": "unheaded-block-70",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md:81-86#unheaded-block-10 (current lines); unit SHA256 e5c1c36c536525efbd5c547c830796fcee1a1b50a772c7eadbdae0e54c940e2e.\nTarget: docs/platform/host-invocation-routing/roadmap.md:404-409#unheaded-block-70 (current lines); unit SHA256 e5c1c36c536525efbd5c547c830796fcee1a1b50a772c7eadbdae0e54c940e2e.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest e5c1c36c536525efbd5c547c830796fcee1a1b50a772c7eadbdae0e54c940e2e at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-10 under docs/platform/host-invocation-routing/roadmap.md#unheaded-block-70; source context \"Rust Host And Proof Providers Implementation Plan / 3. Decisions Required Before R1 Execution\", target context \"Host Invocation Routing Roadmap / Retained selected source material / Rust Host And Proof Providers Implementation Plan / 3. Decisions Required Before R1 Execution\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "e5c1c36c536525efbd5c547c830796fcee1a1b50a772c7eadbdae0e54c940e2e"
  }
}
```

## Entry rationale-505

```json
{
  "entryId": "rationale-505",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_cf0272c9d88e7c921805226ce86f7a61",
  "before": "Move the complete direct unheaded-block unit \"Record decisions 1, 5, and 6 in the packaging stream (`docs/architect/packaging-distribution/`), which owns install/activation; `docs/specs/distribution.md` is regenerate\" from docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-11 to its frozen mapped owner docs/platform/host-invocation-routing/roadmap.md#unheaded-block-70. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Weak-exact: ancestor headings differ; document exact share below one half; independent full-text judgment remains required, not a script-proven approval.",
  "after": "Source: docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md:88-92#unheaded-block-11 (current lines); unit SHA256 9374e834d79b7eeff4520727b4145ba122d992cc302021c5329ea71c6e0c6be6.\nTarget: docs/platform/host-invocation-routing/roadmap.md:413-417#unheaded-block-72 (current lines); unit SHA256 9374e834d79b7eeff4520727b4145ba122d992cc302021c5329ea71c6e0c6be6.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 9374e834d79b7eeff4520727b4145ba122d992cc302021c5329ea71c6e0c6be6 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-11 under docs/platform/host-invocation-routing/roadmap.md#unheaded-block-72; source context \"Rust Host And Proof Providers Implementation Plan / 3. Decisions Required Before R1 Execution\", target context \"Host Invocation Routing Roadmap / Retained selected source material / Rust Host And Proof Providers Implementation Plan / 3. Decisions Required Before R1 Execution\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 504,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_cf0272c9d88e7c921805226ce86f7a61",
    "sourceUnitDigest": "9374e834d79b7eeff4520727b4145ba122d992cc302021c5329ea71c6e0c6be6",
    "claimKind": "architecture",
    "kind": "roadmap",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/roadmap.md",
    "targetAnchor": "unheaded-block-72",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md:88-92#unheaded-block-11 (current lines); unit SHA256 9374e834d79b7eeff4520727b4145ba122d992cc302021c5329ea71c6e0c6be6.\nTarget: docs/platform/host-invocation-routing/roadmap.md:413-417#unheaded-block-72 (current lines); unit SHA256 9374e834d79b7eeff4520727b4145ba122d992cc302021c5329ea71c6e0c6be6.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 9374e834d79b7eeff4520727b4145ba122d992cc302021c5329ea71c6e0c6be6 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-11 under docs/platform/host-invocation-routing/roadmap.md#unheaded-block-72; source context \"Rust Host And Proof Providers Implementation Plan / 3. Decisions Required Before R1 Execution\", target context \"Host Invocation Routing Roadmap / Retained selected source material / Rust Host And Proof Providers Implementation Plan / 3. Decisions Required Before R1 Execution\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "9374e834d79b7eeff4520727b4145ba122d992cc302021c5329ea71c6e0c6be6"
  }
}
```

## Entry rationale-506

```json
{
  "entryId": "rationale-506",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_72cb929bf5ecffe3431de368d5cb7def",
  "before": "Move the complete direct unheaded-block unit \"```mermaid flowchart LR P0[P0 decisions + inventory] --> P1[P1 compatibility harness] P0 --> P2[P2 workspace + artifacts] P1 --> P3[P3 invocation kernel] P2 --> P3 P3 -->\" from docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-12 to its frozen mapped owner docs/platform/host-invocation-routing/roadmap.md#unheaded-block-71. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Weak-exact: ancestor headings differ; document exact share below one half; independent full-text judgment remains required, not a script-proven approval.",
  "after": "Source: docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md:96-110#unheaded-block-12 (current lines); unit SHA256 4fdba7fda591e7a2a96599a07ec8a0e894999319ea4447ca991bbcf170042340.\nTarget: docs/platform/host-invocation-routing/roadmap.md:421-435#unheaded-block-73 (current lines); unit SHA256 4fdba7fda591e7a2a96599a07ec8a0e894999319ea4447ca991bbcf170042340.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 4fdba7fda591e7a2a96599a07ec8a0e894999319ea4447ca991bbcf170042340 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-12 under docs/platform/host-invocation-routing/roadmap.md#unheaded-block-73; source context \"Rust Host And Proof Providers Implementation Plan / 4. Delivery Graph\", target context \"Host Invocation Routing Roadmap / Retained selected source material / Rust Host And Proof Providers Implementation Plan / 4. Delivery Graph\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 505,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_72cb929bf5ecffe3431de368d5cb7def",
    "sourceUnitDigest": "4fdba7fda591e7a2a96599a07ec8a0e894999319ea4447ca991bbcf170042340",
    "claimKind": "architecture",
    "kind": "roadmap",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/roadmap.md",
    "targetAnchor": "unheaded-block-73",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md:96-110#unheaded-block-12 (current lines); unit SHA256 4fdba7fda591e7a2a96599a07ec8a0e894999319ea4447ca991bbcf170042340.\nTarget: docs/platform/host-invocation-routing/roadmap.md:421-435#unheaded-block-73 (current lines); unit SHA256 4fdba7fda591e7a2a96599a07ec8a0e894999319ea4447ca991bbcf170042340.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 4fdba7fda591e7a2a96599a07ec8a0e894999319ea4447ca991bbcf170042340 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-12 under docs/platform/host-invocation-routing/roadmap.md#unheaded-block-73; source context \"Rust Host And Proof Providers Implementation Plan / 4. Delivery Graph\", target context \"Host Invocation Routing Roadmap / Retained selected source material / Rust Host And Proof Providers Implementation Plan / 4. Delivery Graph\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "4fdba7fda591e7a2a96599a07ec8a0e894999319ea4447ca991bbcf170042340"
  }
}
```

## Entry rationale-507

```json
{
  "entryId": "rationale-507",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_2f7f1c2f7b0f0673f7f2423731f30ae7",
  "before": "Move the complete direct unheaded-block unit \"P7 does not block P8 when the first production remote route is native `distribution.build.show`.\" from docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-13 to its frozen mapped owner docs/platform/host-invocation-routing/roadmap.md#unheaded-block-72. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Weak-exact: ancestor headings differ; document exact share below one half; independent full-text judgment remains required, not a script-proven approval.",
  "after": "Source: docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md:112-113#unheaded-block-13 (current lines); unit SHA256 61449d90239253751051bd9c2a455d92f341611105cfc91bae798a50dbc0f88a.\nTarget: docs/platform/host-invocation-routing/roadmap.md:437-438#unheaded-block-74 (current lines); unit SHA256 61449d90239253751051bd9c2a455d92f341611105cfc91bae798a50dbc0f88a.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 61449d90239253751051bd9c2a455d92f341611105cfc91bae798a50dbc0f88a at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-13 under docs/platform/host-invocation-routing/roadmap.md#unheaded-block-74; source context \"Rust Host And Proof Providers Implementation Plan / 4. Delivery Graph\", target context \"Host Invocation Routing Roadmap / Retained selected source material / Rust Host And Proof Providers Implementation Plan / 4. Delivery Graph\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 506,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_2f7f1c2f7b0f0673f7f2423731f30ae7",
    "sourceUnitDigest": "61449d90239253751051bd9c2a455d92f341611105cfc91bae798a50dbc0f88a",
    "claimKind": "architecture",
    "kind": "roadmap",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/roadmap.md",
    "targetAnchor": "unheaded-block-74",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md:112-113#unheaded-block-13 (current lines); unit SHA256 61449d90239253751051bd9c2a455d92f341611105cfc91bae798a50dbc0f88a.\nTarget: docs/platform/host-invocation-routing/roadmap.md:437-438#unheaded-block-74 (current lines); unit SHA256 61449d90239253751051bd9c2a455d92f341611105cfc91bae798a50dbc0f88a.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 61449d90239253751051bd9c2a455d92f341611105cfc91bae798a50dbc0f88a at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-13 under docs/platform/host-invocation-routing/roadmap.md#unheaded-block-74; source context \"Rust Host And Proof Providers Implementation Plan / 4. Delivery Graph\", target context \"Host Invocation Routing Roadmap / Retained selected source material / Rust Host And Proof Providers Implementation Plan / 4. Delivery Graph\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "61449d90239253751051bd9c2a455d92f341611105cfc91bae798a50dbc0f88a"
  }
}
```

## Entry rationale-508

```json
{
  "entryId": "rationale-508",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_9b87547dbf5c4930ad55f81ce588af0b",
  "before": "Move the complete direct unheaded-block unit \"`PK` is delivered by the packaging stream's own plan (`docs/architect/packaging-distribution/`), not this plan; this plan only consumes its interface (see the P0 delivera\" from docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-14 to its frozen mapped owner docs/platform/host-invocation-routing/roadmap.md#unheaded-block-73. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Weak-exact: ancestor headings differ; document exact share below one half; independent full-text judgment remains required, not a script-proven approval.",
  "after": "Source: docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md:115-118#unheaded-block-14 (current lines); unit SHA256 7f2127f23a3ecac4e2b08a33383153f30db1fc653c86f012e1488fd8a4be2d2b.\nTarget: docs/platform/host-invocation-routing/roadmap.md:440-443#unheaded-block-75 (current lines); unit SHA256 7f2127f23a3ecac4e2b08a33383153f30db1fc653c86f012e1488fd8a4be2d2b.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 7f2127f23a3ecac4e2b08a33383153f30db1fc653c86f012e1488fd8a4be2d2b at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-14 under docs/platform/host-invocation-routing/roadmap.md#unheaded-block-75; source context \"Rust Host And Proof Providers Implementation Plan / 4. Delivery Graph\", target context \"Host Invocation Routing Roadmap / Retained selected source material / Rust Host And Proof Providers Implementation Plan / 4. Delivery Graph\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 507,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_9b87547dbf5c4930ad55f81ce588af0b",
    "sourceUnitDigest": "7f2127f23a3ecac4e2b08a33383153f30db1fc653c86f012e1488fd8a4be2d2b",
    "claimKind": "architecture",
    "kind": "roadmap",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/roadmap.md",
    "targetAnchor": "unheaded-block-75",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md:115-118#unheaded-block-14 (current lines); unit SHA256 7f2127f23a3ecac4e2b08a33383153f30db1fc653c86f012e1488fd8a4be2d2b.\nTarget: docs/platform/host-invocation-routing/roadmap.md:440-443#unheaded-block-75 (current lines); unit SHA256 7f2127f23a3ecac4e2b08a33383153f30db1fc653c86f012e1488fd8a4be2d2b.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 7f2127f23a3ecac4e2b08a33383153f30db1fc653c86f012e1488fd8a4be2d2b at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-14 under docs/platform/host-invocation-routing/roadmap.md#unheaded-block-75; source context \"Rust Host And Proof Providers Implementation Plan / 4. Delivery Graph\", target context \"Host Invocation Routing Roadmap / Retained selected source material / Rust Host And Proof Providers Implementation Plan / 4. Delivery Graph\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "7f2127f23a3ecac4e2b08a33383153f30db1fc653c86f012e1488fd8a4be2d2b"
  }
}
```

## Entry rationale-509

```json
{
  "entryId": "rationale-509",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_97675a05c81f8d594b0023e409ef78de",
  "before": "Move the complete direct unheaded-block unit \"- Distribution decision update covering the remaining §3 items (target matrix, preview-vs-stable, compatibility-window duration), recorded in the packaging stream. - Conf\" from docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-15 to its frozen mapped owner docs/platform/host-invocation-routing/roadmap.md#unheaded-block-74. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Judgment: no target digest match; independent full-text judgment remains required, not a script-proven approval.",
  "after": "Source: docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md:124-160#unheaded-block-15 (current lines); unit SHA256 2f778d947cee7cb920f74974ad0fb9b412313003916de33974bdbd6db3d6252f.\nTarget: docs/platform/host-invocation-routing/roadmap.md:449-485#unheaded-block-76 (current lines); unit SHA256 8ce3c4fe31aa5d0f15641d13302bb248a6a7fb3d218db3c1fab0f8cd66d99943.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 8ce3c4fe31aa5d0f15641d13302bb248a6a7fb3d218db3c1fab0f8cd66d99943 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 1, target 1; 1 changed spellings/labels, 1 destination changes; 0 added, 0 removed.\nLink 1: \"Legacy CLI Transition\" (./legacy-cli-transition.md) → \"Legacy CLI Transition\" (architecture/legacy-cli-transition.md); resolved docs/architect/host-invocation-routing/legacy-cli-transition.md → docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-15 under docs/platform/host-invocation-routing/roadmap.md#unheaded-block-76; source context \"Rust Host And Proof Providers Implementation Plan / 5. P0 — Lock Release Inputs And Baseline Inventory / Deliverables\", target context \"Host Invocation Routing Roadmap / Retained selected source material / Rust Host And Proof Providers Implementation Plan / 5. P0 — Lock Release Inputs And Baseline Inventory / Deliverables\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 508,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_97675a05c81f8d594b0023e409ef78de",
    "sourceUnitDigest": "2f778d947cee7cb920f74974ad0fb9b412313003916de33974bdbd6db3d6252f",
    "claimKind": "decision",
    "kind": "roadmap",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/roadmap.md",
    "targetAnchor": "unheaded-block-76",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md:124-160#unheaded-block-15 (current lines); unit SHA256 2f778d947cee7cb920f74974ad0fb9b412313003916de33974bdbd6db3d6252f.\nTarget: docs/platform/host-invocation-routing/roadmap.md:449-485#unheaded-block-76 (current lines); unit SHA256 8ce3c4fe31aa5d0f15641d13302bb248a6a7fb3d218db3c1fab0f8cd66d99943.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 8ce3c4fe31aa5d0f15641d13302bb248a6a7fb3d218db3c1fab0f8cd66d99943 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 1, target 1; 1 changed spellings/labels, 1 destination changes; 0 added, 0 removed.\nLink 1: \"Legacy CLI Transition\" (./legacy-cli-transition.md) → \"Legacy CLI Transition\" (architecture/legacy-cli-transition.md); resolved docs/architect/host-invocation-routing/legacy-cli-transition.md → docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-15 under docs/platform/host-invocation-routing/roadmap.md#unheaded-block-76; source context \"Rust Host And Proof Providers Implementation Plan / 5. P0 — Lock Release Inputs And Baseline Inventory / Deliverables\", target context \"Host Invocation Routing Roadmap / Retained selected source material / Rust Host And Proof Providers Implementation Plan / 5. P0 — Lock Release Inputs And Baseline Inventory / Deliverables\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "8ce3c4fe31aa5d0f15641d13302bb248a6a7fb3d218db3c1fab0f8cd66d99943"
  }
}
```

## Entry rationale-510

```json
{
  "entryId": "rationale-510",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_beed103650a3300815a2f9fd55512980",
  "before": "Move the complete direct unheaded-block unit \"- `package.json` current binaries and package files. - `src/cli/command-registry.mjs` selector inventory. - `bin/fgos.mjs` global parsing, presentation, and error mapping\" from docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-16 to its frozen mapped owner docs/platform/host-invocation-routing/roadmap.md#unheaded-block-75. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Weak-exact: ancestor headings differ; document exact share below one half; independent full-text judgment remains required, not a script-proven approval.",
  "after": "Source: docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md:164-170#unheaded-block-16 (current lines); unit SHA256 a17bef0c0cedbf034704b9a3ef8b6ff29afbf8ffbf0a91066923567367ca1ce9.\nTarget: docs/platform/host-invocation-routing/roadmap.md:489-495#unheaded-block-77 (current lines); unit SHA256 a17bef0c0cedbf034704b9a3ef8b6ff29afbf8ffbf0a91066923567367ca1ce9.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest a17bef0c0cedbf034704b9a3ef8b6ff29afbf8ffbf0a91066923567367ca1ce9 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-16 under docs/platform/host-invocation-routing/roadmap.md#unheaded-block-77; source context \"Rust Host And Proof Providers Implementation Plan / 5. P0 — Lock Release Inputs And Baseline Inventory / Scout evidence\", target context \"Host Invocation Routing Roadmap / Retained selected source material / Rust Host And Proof Providers Implementation Plan / 5. P0 — Lock Release Inputs And Baseline Inventory / Scout evidence\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 509,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_beed103650a3300815a2f9fd55512980",
    "sourceUnitDigest": "a17bef0c0cedbf034704b9a3ef8b6ff29afbf8ffbf0a91066923567367ca1ce9",
    "claimKind": "architecture",
    "kind": "roadmap",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/roadmap.md",
    "targetAnchor": "unheaded-block-77",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md:164-170#unheaded-block-16 (current lines); unit SHA256 a17bef0c0cedbf034704b9a3ef8b6ff29afbf8ffbf0a91066923567367ca1ce9.\nTarget: docs/platform/host-invocation-routing/roadmap.md:489-495#unheaded-block-77 (current lines); unit SHA256 a17bef0c0cedbf034704b9a3ef8b6ff29afbf8ffbf0a91066923567367ca1ce9.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest a17bef0c0cedbf034704b9a3ef8b6ff29afbf8ffbf0a91066923567367ca1ce9 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-16 under docs/platform/host-invocation-routing/roadmap.md#unheaded-block-77; source context \"Rust Host And Proof Providers Implementation Plan / 5. P0 — Lock Release Inputs And Baseline Inventory / Scout evidence\", target context \"Host Invocation Routing Roadmap / Retained selected source material / Rust Host And Proof Providers Implementation Plan / 5. P0 — Lock Release Inputs And Baseline Inventory / Scout evidence\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "a17bef0c0cedbf034704b9a3ef8b6ff29afbf8ffbf0a91066923567367ca1ce9"
  }
}
```

## Entry rationale-511

```json
{
  "entryId": "rationale-511",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_2640fd2bf8f2de2fff20a9eecac26afb",
  "before": "Move the complete direct unheaded-block unit \"No selector is absent; every future binary, payload, cache, config, or runtime dependency has a planned init/doctor registration owner; unresolved distribution choices (§\" from docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-17 to its frozen mapped owner docs/platform/host-invocation-routing/roadmap.md#unheaded-block-76. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Weak-exact: ancestor headings differ; document exact share below one half; independent full-text judgment remains required, not a script-proven approval.",
  "after": "Source: docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md:174-178#unheaded-block-17 (current lines); unit SHA256 3bc05d64d21b4a585c89787fa5455c864d8bc212d071d5090a6282c922b81de0.\nTarget: docs/platform/host-invocation-routing/roadmap.md:499-503#unheaded-block-78 (current lines); unit SHA256 3bc05d64d21b4a585c89787fa5455c864d8bc212d071d5090a6282c922b81de0.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 3bc05d64d21b4a585c89787fa5455c864d8bc212d071d5090a6282c922b81de0 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-17 under docs/platform/host-invocation-routing/roadmap.md#unheaded-block-78; source context \"Rust Host And Proof Providers Implementation Plan / 5. P0 — Lock Release Inputs And Baseline Inventory / Exit gate\", target context \"Host Invocation Routing Roadmap / Retained selected source material / Rust Host And Proof Providers Implementation Plan / 5. P0 — Lock Release Inputs And Baseline Inventory / Exit gate\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 510,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_2640fd2bf8f2de2fff20a9eecac26afb",
    "sourceUnitDigest": "3bc05d64d21b4a585c89787fa5455c864d8bc212d071d5090a6282c922b81de0",
    "claimKind": "decision",
    "kind": "roadmap",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/roadmap.md",
    "targetAnchor": "unheaded-block-78",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md:174-178#unheaded-block-17 (current lines); unit SHA256 3bc05d64d21b4a585c89787fa5455c864d8bc212d071d5090a6282c922b81de0.\nTarget: docs/platform/host-invocation-routing/roadmap.md:499-503#unheaded-block-78 (current lines); unit SHA256 3bc05d64d21b4a585c89787fa5455c864d8bc212d071d5090a6282c922b81de0.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 3bc05d64d21b4a585c89787fa5455c864d8bc212d071d5090a6282c922b81de0 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-17 under docs/platform/host-invocation-routing/roadmap.md#unheaded-block-78; source context \"Rust Host And Proof Providers Implementation Plan / 5. P0 — Lock Release Inputs And Baseline Inventory / Exit gate\", target context \"Host Invocation Routing Roadmap / Retained selected source material / Rust Host And Proof Providers Implementation Plan / 5. P0 — Lock Release Inputs And Baseline Inventory / Exit gate\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "3bc05d64d21b4a585c89787fa5455c864d8bc212d071d5090a6282c922b81de0"
  }
}
```

## Entry rationale-512

```json
{
  "entryId": "rationale-512",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_edc2a35ab327afe6fae3c0079c44c33f",
  "before": "Move the complete direct unheaded-block unit \"```sh node bin/fgos.mjs --help --json npm test ```\" from docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-18 to its frozen mapped owner docs/platform/host-invocation-routing/roadmap.md#unheaded-block-77. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Weak-exact: ancestor headings differ; document exact share below one half; independent full-text judgment remains required, not a script-proven approval.",
  "after": "Source: docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md:182-185#unheaded-block-18 (current lines); unit SHA256 272e9c166888db82e3e0210750f0d69678f5b36926f1c8ed40354502c6a7637e.\nTarget: docs/platform/host-invocation-routing/roadmap.md:507-510#unheaded-block-79 (current lines); unit SHA256 272e9c166888db82e3e0210750f0d69678f5b36926f1c8ed40354502c6a7637e.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 272e9c166888db82e3e0210750f0d69678f5b36926f1c8ed40354502c6a7637e at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-18 under docs/platform/host-invocation-routing/roadmap.md#unheaded-block-79; source context \"Rust Host And Proof Providers Implementation Plan / 5. P0 — Lock Release Inputs And Baseline Inventory / Verify\", target context \"Host Invocation Routing Roadmap / Retained selected source material / Rust Host And Proof Providers Implementation Plan / 5. P0 — Lock Release Inputs And Baseline Inventory / Verify\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 511,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_edc2a35ab327afe6fae3c0079c44c33f",
    "sourceUnitDigest": "272e9c166888db82e3e0210750f0d69678f5b36926f1c8ed40354502c6a7637e",
    "claimKind": "architecture",
    "kind": "roadmap",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/roadmap.md",
    "targetAnchor": "unheaded-block-79",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md:182-185#unheaded-block-18 (current lines); unit SHA256 272e9c166888db82e3e0210750f0d69678f5b36926f1c8ed40354502c6a7637e.\nTarget: docs/platform/host-invocation-routing/roadmap.md:507-510#unheaded-block-79 (current lines); unit SHA256 272e9c166888db82e3e0210750f0d69678f5b36926f1c8ed40354502c6a7637e.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 272e9c166888db82e3e0210750f0d69678f5b36926f1c8ed40354502c6a7637e at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-18 under docs/platform/host-invocation-routing/roadmap.md#unheaded-block-79; source context \"Rust Host And Proof Providers Implementation Plan / 5. P0 — Lock Release Inputs And Baseline Inventory / Verify\", target context \"Host Invocation Routing Roadmap / Retained selected source material / Rust Host And Proof Providers Implementation Plan / 5. P0 — Lock Release Inputs And Baseline Inventory / Verify\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "272e9c166888db82e3e0210750f0d69678f5b36926f1c8ed40354502c6a7637e"
  }
}
```

## Entry rationale-513

```json
{
  "entryId": "rationale-513",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_aacc6f817470b6af566684cf21db1371",
  "before": "Move the complete direct unheaded-block unit \"1. Build one harness that invokes Node or a candidate Rust binary with identical argv bytes, stdin, cwd, selected environment, and timeout. 2. Capture stdout/stderr bytes\" from docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-20 to its frozen mapped owner docs/platform/host-invocation-routing/roadmap.md#unheaded-block-80. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Weak-exact: ancestor headings differ; document exact share below one half; independent full-text judgment remains required, not a script-proven approval.",
  "after": "Source: docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md:200-217#unheaded-block-20 (current lines); unit SHA256 75e970aa99de7261a1cf150d87f5ff1693b665fe8ba623de8fc0be0f6e561fec.\nTarget: docs/platform/host-invocation-routing/roadmap.md:524-541#unheaded-block-82 (current lines); unit SHA256 75e970aa99de7261a1cf150d87f5ff1693b665fe8ba623de8fc0be0f6e561fec.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 75e970aa99de7261a1cf150d87f5ff1693b665fe8ba623de8fc0be0f6e561fec at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-20 under docs/platform/host-invocation-routing/roadmap.md#unheaded-block-82; source context \"Rust Host And Proof Providers Implementation Plan / 6. P1 — Compatibility Harness / Steps\", target context \"Host Invocation Routing Roadmap / Retained selected source material / Rust Host And Proof Providers Implementation Plan / 6. P1 — Compatibility Harness / Steps\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 512,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_aacc6f817470b6af566684cf21db1371",
    "sourceUnitDigest": "75e970aa99de7261a1cf150d87f5ff1693b665fe8ba623de8fc0be0f6e561fec",
    "claimKind": "architecture",
    "kind": "roadmap",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/roadmap.md",
    "targetAnchor": "unheaded-block-82",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md:200-217#unheaded-block-20 (current lines); unit SHA256 75e970aa99de7261a1cf150d87f5ff1693b665fe8ba623de8fc0be0f6e561fec.\nTarget: docs/platform/host-invocation-routing/roadmap.md:524-541#unheaded-block-82 (current lines); unit SHA256 75e970aa99de7261a1cf150d87f5ff1693b665fe8ba623de8fc0be0f6e561fec.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 75e970aa99de7261a1cf150d87f5ff1693b665fe8ba623de8fc0be0f6e561fec at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-20 under docs/platform/host-invocation-routing/roadmap.md#unheaded-block-82; source context \"Rust Host And Proof Providers Implementation Plan / 6. P1 — Compatibility Harness / Steps\", target context \"Host Invocation Routing Roadmap / Retained selected source material / Rust Host And Proof Providers Implementation Plan / 6. P1 — Compatibility Harness / Steps\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "75e970aa99de7261a1cf150d87f5ff1693b665fe8ba623de8fc0be0f6e561fec"
  }
}
```

## Entry rationale-514

```json
{
  "entryId": "rationale-514",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_d2f98c28ed63bf5bdde71ee9905a5b9c",
  "before": "Move the complete direct unheaded-block unit \"- Every selector: recognition and help/syntax passthrough. - Every selector: route descriptor has exactly one active route, an owner, and a required proof suite; unknown \" from docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-21 to its frozen mapped owner docs/platform/host-invocation-routing/roadmap.md#unheaded-block-81. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Weak-exact: ancestor headings differ; document exact share below one half; independent full-text judgment remains required, not a script-proven approval.",
  "after": "Source: docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md:221-228#unheaded-block-21 (current lines); unit SHA256 5fb84715acee7850f620b819552e8e61fa21a67970352e176c580ae0c016e46a.\nTarget: docs/platform/host-invocation-routing/roadmap.md:545-552#unheaded-block-83 (current lines); unit SHA256 5fb84715acee7850f620b819552e8e61fa21a67970352e176c580ae0c016e46a.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 5fb84715acee7850f620b819552e8e61fa21a67970352e176c580ae0c016e46a at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-21 under docs/platform/host-invocation-routing/roadmap.md#unheaded-block-83; source context \"Rust Host And Proof Providers Implementation Plan / 6. P1 — Compatibility Harness / Coverage floor\", target context \"Host Invocation Routing Roadmap / Retained selected source material / Rust Host And Proof Providers Implementation Plan / 6. P1 — Compatibility Harness / Coverage floor\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 513,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_d2f98c28ed63bf5bdde71ee9905a5b9c",
    "sourceUnitDigest": "5fb84715acee7850f620b819552e8e61fa21a67970352e176c580ae0c016e46a",
    "claimKind": "architecture",
    "kind": "roadmap",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/roadmap.md",
    "targetAnchor": "unheaded-block-83",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md:221-228#unheaded-block-21 (current lines); unit SHA256 5fb84715acee7850f620b819552e8e61fa21a67970352e176c580ae0c016e46a.\nTarget: docs/platform/host-invocation-routing/roadmap.md:545-552#unheaded-block-83 (current lines); unit SHA256 5fb84715acee7850f620b819552e8e61fa21a67970352e176c580ae0c016e46a.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 5fb84715acee7850f620b819552e8e61fa21a67970352e176c580ae0c016e46a at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-21 under docs/platform/host-invocation-routing/roadmap.md#unheaded-block-83; source context \"Rust Host And Proof Providers Implementation Plan / 6. P1 — Compatibility Harness / Coverage floor\", target context \"Host Invocation Routing Roadmap / Retained selected source material / Rust Host And Proof Providers Implementation Plan / 6. P1 — Compatibility Harness / Coverage floor\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "5fb84715acee7850f620b819552e8e61fa21a67970352e176c580ae0c016e46a"
  }
}
```

## Entry rationale-515

```json
{
  "entryId": "rationale-515",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_2d10871c46be72d9e7255698a6fcaf9a",
  "before": "Move the complete direct unheaded-block unit \"```txt Cargo.toml # workspace root Cargo.lock apps/fgos/ # crate `fgos`, binary `fgos`; legacy_exec.rs is a module here packages/host-runtime/rust/ # crate `fgos-host-run\" from docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-25 to its frozen mapped owner docs/platform/host-invocation-routing/roadmap.md#unheaded-block-84. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Weak-exact: ancestor headings differ; document exact share below one half; independent full-text judgment remains required, not a script-proven approval.",
  "after": "Source: docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md:252-260#unheaded-block-25 (current lines); unit SHA256 f9717b6dd725b490c190abbed6cef7a1f12feb95025ffd06779dd9c54c71b550.\nTarget: docs/platform/host-invocation-routing/roadmap.md:569-577#unheaded-block-86 (current lines); unit SHA256 f9717b6dd725b490c190abbed6cef7a1f12feb95025ffd06779dd9c54c71b550.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest f9717b6dd725b490c190abbed6cef7a1f12feb95025ffd06779dd9c54c71b550 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-25 under docs/platform/host-invocation-routing/roadmap.md#unheaded-block-86; source context \"Rust Host And Proof Providers Implementation Plan / 7. P2 — Rust Workspace And Generated Inputs / Target areas\", target context \"Host Invocation Routing Roadmap / Retained selected source material / Rust Host And Proof Providers Implementation Plan / 7. P2 — Rust Workspace And Generated Inputs / Target areas\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 514,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_2d10871c46be72d9e7255698a6fcaf9a",
    "sourceUnitDigest": "f9717b6dd725b490c190abbed6cef7a1f12feb95025ffd06779dd9c54c71b550",
    "claimKind": "architecture",
    "kind": "roadmap",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/roadmap.md",
    "targetAnchor": "unheaded-block-86",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md:252-260#unheaded-block-25 (current lines); unit SHA256 f9717b6dd725b490c190abbed6cef7a1f12feb95025ffd06779dd9c54c71b550.\nTarget: docs/platform/host-invocation-routing/roadmap.md:569-577#unheaded-block-86 (current lines); unit SHA256 f9717b6dd725b490c190abbed6cef7a1f12feb95025ffd06779dd9c54c71b550.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest f9717b6dd725b490c190abbed6cef7a1f12feb95025ffd06779dd9c54c71b550 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-25 under docs/platform/host-invocation-routing/roadmap.md#unheaded-block-86; source context \"Rust Host And Proof Providers Implementation Plan / 7. P2 — Rust Workspace And Generated Inputs / Target areas\", target context \"Host Invocation Routing Roadmap / Retained selected source material / Rust Host And Proof Providers Implementation Plan / 7. P2 — Rust Workspace And Generated Inputs / Target areas\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "f9717b6dd725b490c190abbed6cef7a1f12feb95025ffd06779dd9c54c71b550"
  }
}
```

## Entry rationale-516

```json
{
  "entryId": "rationale-516",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_8a89cd3726b6841b4cce0fccb3963711",
  "before": "Move the complete direct unheaded-block unit \"R1 is exactly these three crates. `packages/component-protocol/rust/` is created in P7 (only the external-process adapter needs `EncodedMessage`); there is no `packages/l\" from docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-26 to its frozen mapped owner docs/platform/host-invocation-routing/roadmap.md#unheaded-block-85. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Weak-exact: ancestor headings differ; document exact share below one half; independent full-text judgment remains required, not a script-proven approval.",
  "after": "Source: docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md:262-267#unheaded-block-26 (current lines); unit SHA256 8a229664592893d7aaa74a8dd8446a9ba8ba93f7f10ae80d08dad43b1166215f.\nTarget: docs/platform/host-invocation-routing/roadmap.md:579-584#unheaded-block-87 (current lines); unit SHA256 8a229664592893d7aaa74a8dd8446a9ba8ba93f7f10ae80d08dad43b1166215f.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 8a229664592893d7aaa74a8dd8446a9ba8ba93f7f10ae80d08dad43b1166215f at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-26 under docs/platform/host-invocation-routing/roadmap.md#unheaded-block-87; source context \"Rust Host And Proof Providers Implementation Plan / 7. P2 — Rust Workspace And Generated Inputs / Target areas\", target context \"Host Invocation Routing Roadmap / Retained selected source material / Rust Host And Proof Providers Implementation Plan / 7. P2 — Rust Workspace And Generated Inputs / Target areas\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 515,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_8a89cd3726b6841b4cce0fccb3963711",
    "sourceUnitDigest": "8a229664592893d7aaa74a8dd8446a9ba8ba93f7f10ae80d08dad43b1166215f",
    "claimKind": "contract",
    "kind": "roadmap",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/roadmap.md",
    "targetAnchor": "unheaded-block-87",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md:262-267#unheaded-block-26 (current lines); unit SHA256 8a229664592893d7aaa74a8dd8446a9ba8ba93f7f10ae80d08dad43b1166215f.\nTarget: docs/platform/host-invocation-routing/roadmap.md:579-584#unheaded-block-87 (current lines); unit SHA256 8a229664592893d7aaa74a8dd8446a9ba8ba93f7f10ae80d08dad43b1166215f.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 8a229664592893d7aaa74a8dd8446a9ba8ba93f7f10ae80d08dad43b1166215f at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-26 under docs/platform/host-invocation-routing/roadmap.md#unheaded-block-87; source context \"Rust Host And Proof Providers Implementation Plan / 7. P2 — Rust Workspace And Generated Inputs / Target areas\", target context \"Host Invocation Routing Roadmap / Retained selected source material / Rust Host And Proof Providers Implementation Plan / 7. P2 — Rust Workspace And Generated Inputs / Target areas\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "8a229664592893d7aaa74a8dd8446a9ba8ba93f7f10ae80d08dad43b1166215f"
  }
}
```

## Entry rationale-517

```json
{
  "entryId": "rationale-517",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_a86aab8a7c793278b0f40c41445b40ae",
  "before": "Move the complete direct unheaded-block unit \"1. Add explicit workspace members/excludes. 2. Keep `herdr-plugin` and `upstreams/*` outside the new dependency graph. 3. Prove excluded nested crates still build indepen\" from docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-27 to its frozen mapped owner docs/platform/host-invocation-routing/roadmap.md#unheaded-block-86. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Weak-exact: ancestor headings differ; document exact share below one half; independent full-text judgment remains required, not a script-proven approval.",
  "after": "Source: docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md:271-281#unheaded-block-27 (current lines); unit SHA256 6875848bffc6d004f04b1dbe39d6e5906116662e2fe93bc085398a58bfb40d2e.\nTarget: docs/platform/host-invocation-routing/roadmap.md:588-598#unheaded-block-88 (current lines); unit SHA256 6875848bffc6d004f04b1dbe39d6e5906116662e2fe93bc085398a58bfb40d2e.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 6875848bffc6d004f04b1dbe39d6e5906116662e2fe93bc085398a58bfb40d2e at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-27 under docs/platform/host-invocation-routing/roadmap.md#unheaded-block-88; source context \"Rust Host And Proof Providers Implementation Plan / 7. P2 — Rust Workspace And Generated Inputs / Steps\", target context \"Host Invocation Routing Roadmap / Retained selected source material / Rust Host And Proof Providers Implementation Plan / 7. P2 — Rust Workspace And Generated Inputs / Steps\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 516,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_a86aab8a7c793278b0f40c41445b40ae",
    "sourceUnitDigest": "6875848bffc6d004f04b1dbe39d6e5906116662e2fe93bc085398a58bfb40d2e",
    "claimKind": "architecture",
    "kind": "roadmap",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/roadmap.md",
    "targetAnchor": "unheaded-block-88",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md:271-281#unheaded-block-27 (current lines); unit SHA256 6875848bffc6d004f04b1dbe39d6e5906116662e2fe93bc085398a58bfb40d2e.\nTarget: docs/platform/host-invocation-routing/roadmap.md:588-598#unheaded-block-88 (current lines); unit SHA256 6875848bffc6d004f04b1dbe39d6e5906116662e2fe93bc085398a58bfb40d2e.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 6875848bffc6d004f04b1dbe39d6e5906116662e2fe93bc085398a58bfb40d2e at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-27 under docs/platform/host-invocation-routing/roadmap.md#unheaded-block-88; source context \"Rust Host And Proof Providers Implementation Plan / 7. P2 — Rust Workspace And Generated Inputs / Steps\", target context \"Host Invocation Routing Roadmap / Retained selected source material / Rust Host And Proof Providers Implementation Plan / 7. P2 — Rust Workspace And Generated Inputs / Steps\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "6875848bffc6d004f04b1dbe39d6e5906116662e2fe93bc085398a58bfb40d2e"
  }
}
```

## Entry rationale-518

```json
{
  "entryId": "rationale-518",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_4c19c4afc310f49b917983466dd84051",
  "before": "Move the complete direct unheaded-block unit \"The workspace contains only intended members and causes no Herdr dependency or lockfile drift. The dev launcher cannot read an installed payload accidentally, and the sta\" from docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-28 to its frozen mapped owner docs/platform/host-invocation-routing/roadmap.md#unheaded-block-87. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Weak-exact: ancestor headings differ; document exact share below one half; independent full-text judgment remains required, not a script-proven approval.",
  "after": "Source: docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md:285-287#unheaded-block-28 (current lines); unit SHA256 f41238ebbdb29b855eba885bd1675ce7d44f81e184e304f801285d6efd3fbba2.\nTarget: docs/platform/host-invocation-routing/roadmap.md:602-604#unheaded-block-89 (current lines); unit SHA256 f41238ebbdb29b855eba885bd1675ce7d44f81e184e304f801285d6efd3fbba2.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest f41238ebbdb29b855eba885bd1675ce7d44f81e184e304f801285d6efd3fbba2 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-28 under docs/platform/host-invocation-routing/roadmap.md#unheaded-block-89; source context \"Rust Host And Proof Providers Implementation Plan / 7. P2 — Rust Workspace And Generated Inputs / Exit gate and verify\", target context \"Host Invocation Routing Roadmap / Retained selected source material / Rust Host And Proof Providers Implementation Plan / 7. P2 — Rust Workspace And Generated Inputs / Exit gate and verify\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 517,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_4c19c4afc310f49b917983466dd84051",
    "sourceUnitDigest": "f41238ebbdb29b855eba885bd1675ce7d44f81e184e304f801285d6efd3fbba2",
    "claimKind": "architecture",
    "kind": "roadmap",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/roadmap.md",
    "targetAnchor": "unheaded-block-89",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md:285-287#unheaded-block-28 (current lines); unit SHA256 f41238ebbdb29b855eba885bd1675ce7d44f81e184e304f801285d6efd3fbba2.\nTarget: docs/platform/host-invocation-routing/roadmap.md:602-604#unheaded-block-89 (current lines); unit SHA256 f41238ebbdb29b855eba885bd1675ce7d44f81e184e304f801285d6efd3fbba2.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest f41238ebbdb29b855eba885bd1675ce7d44f81e184e304f801285d6efd3fbba2 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-28 under docs/platform/host-invocation-routing/roadmap.md#unheaded-block-89; source context \"Rust Host And Proof Providers Implementation Plan / 7. P2 — Rust Workspace And Generated Inputs / Exit gate and verify\", target context \"Host Invocation Routing Roadmap / Retained selected source material / Rust Host And Proof Providers Implementation Plan / 7. P2 — Rust Workspace And Generated Inputs / Exit gate and verify\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "f41238ebbdb29b855eba885bd1675ce7d44f81e184e304f801285d6efd3fbba2"
  }
}
```

## Entry rationale-519

```json
{
  "entryId": "rationale-519",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_ad2a4c535503fa65a9d6aaf7e9e16b3f",
  "before": "Move the complete direct unheaded-block unit \"```sh cargo fmt --all -- --check cargo clippy --workspace --all-targets -- -D warnings cargo test --workspace cargo test --manifest-path herdr-plugin/Cargo.toml ```\" from docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-29 to its frozen mapped owner docs/platform/host-invocation-routing/roadmap.md#unheaded-block-88. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Weak-exact: ancestor headings differ; document exact share below one half; independent full-text judgment remains required, not a script-proven approval.",
  "after": "Source: docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md:289-294#unheaded-block-29 (current lines); unit SHA256 bbed69a63f075067943cc3c0035832256d167ec32729540811b8daec7251dbdd.\nTarget: docs/platform/host-invocation-routing/roadmap.md:606-611#unheaded-block-90 (current lines); unit SHA256 bbed69a63f075067943cc3c0035832256d167ec32729540811b8daec7251dbdd.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest bbed69a63f075067943cc3c0035832256d167ec32729540811b8daec7251dbdd at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-29 under docs/platform/host-invocation-routing/roadmap.md#unheaded-block-90; source context \"Rust Host And Proof Providers Implementation Plan / 7. P2 — Rust Workspace And Generated Inputs / Exit gate and verify\", target context \"Host Invocation Routing Roadmap / Retained selected source material / Rust Host And Proof Providers Implementation Plan / 7. P2 — Rust Workspace And Generated Inputs / Exit gate and verify\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 518,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_ad2a4c535503fa65a9d6aaf7e9e16b3f",
    "sourceUnitDigest": "bbed69a63f075067943cc3c0035832256d167ec32729540811b8daec7251dbdd",
    "claimKind": "architecture",
    "kind": "roadmap",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/roadmap.md",
    "targetAnchor": "unheaded-block-90",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md:289-294#unheaded-block-29 (current lines); unit SHA256 bbed69a63f075067943cc3c0035832256d167ec32729540811b8daec7251dbdd.\nTarget: docs/platform/host-invocation-routing/roadmap.md:606-611#unheaded-block-90 (current lines); unit SHA256 bbed69a63f075067943cc3c0035832256d167ec32729540811b8daec7251dbdd.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest bbed69a63f075067943cc3c0035832256d167ec32729540811b8daec7251dbdd at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-29 under docs/platform/host-invocation-routing/roadmap.md#unheaded-block-90; source context \"Rust Host And Proof Providers Implementation Plan / 7. P2 — Rust Workspace And Generated Inputs / Exit gate and verify\", target context \"Host Invocation Routing Roadmap / Retained selected source material / Rust Host And Proof Providers Implementation Plan / 7. P2 — Rust Workspace And Generated Inputs / Exit gate and verify\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "bbed69a63f075067943cc3c0035832256d167ec32729540811b8daec7251dbdd"
  }
}
```

## Entry rationale-520

```json
{
  "entryId": "rationale-520",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_e64b800c425e9aeabfe7001e2f3b2654",
  "before": "Move the complete direct unheaded-block unit \"The kernel exposes exactly one contract: `OperationRequest` → `ProviderOutcome`. `legacy-cli` selectors never enter it — see P4 and [Legacy CLI Transition](./legacy-cli-t\" from docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-30 to its frozen mapped owner docs/platform/host-invocation-routing/roadmap.md#unheaded-block-89. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Judgment: no target digest match; independent full-text judgment remains required, not a script-proven approval.",
  "after": "Source: docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md:298-300#unheaded-block-30 (current lines); unit SHA256 bde904172fa5b92e3d052d7e88231dd00d143e793fc202408632c9063d238ab2.\nTarget: docs/platform/host-invocation-routing/roadmap.md:615-617#unheaded-block-91 (current lines); unit SHA256 76fccfe2dc9de84352caa8360d813d2fa1205f18fb25d6125780483fc659c1cc.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 76fccfe2dc9de84352caa8360d813d2fa1205f18fb25d6125780483fc659c1cc at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 1, target 1; 1 changed spellings/labels, 1 destination changes; 0 added, 0 removed.\nLink 1: \"Legacy CLI Transition\" (./legacy-cli-transition.md) → \"Legacy CLI Transition\" (architecture/legacy-cli-transition.md); resolved docs/architect/host-invocation-routing/legacy-cli-transition.md → docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-30 under docs/platform/host-invocation-routing/roadmap.md#unheaded-block-91; source context \"Rust Host And Proof Providers Implementation Plan / 8. P3 — Invocation Kernel Vertical Slice\", target context \"Host Invocation Routing Roadmap / Retained selected source material / Rust Host And Proof Providers Implementation Plan / 8. P3 — Invocation Kernel Vertical Slice\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 519,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_e64b800c425e9aeabfe7001e2f3b2654",
    "sourceUnitDigest": "bde904172fa5b92e3d052d7e88231dd00d143e793fc202408632c9063d238ab2",
    "claimKind": "contract",
    "kind": "roadmap",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/roadmap.md",
    "targetAnchor": "unheaded-block-91",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md:298-300#unheaded-block-30 (current lines); unit SHA256 bde904172fa5b92e3d052d7e88231dd00d143e793fc202408632c9063d238ab2.\nTarget: docs/platform/host-invocation-routing/roadmap.md:615-617#unheaded-block-91 (current lines); unit SHA256 76fccfe2dc9de84352caa8360d813d2fa1205f18fb25d6125780483fc659c1cc.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 76fccfe2dc9de84352caa8360d813d2fa1205f18fb25d6125780483fc659c1cc at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 1, target 1; 1 changed spellings/labels, 1 destination changes; 0 added, 0 removed.\nLink 1: \"Legacy CLI Transition\" (./legacy-cli-transition.md) → \"Legacy CLI Transition\" (architecture/legacy-cli-transition.md); resolved docs/architect/host-invocation-routing/legacy-cli-transition.md → docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-30 under docs/platform/host-invocation-routing/roadmap.md#unheaded-block-91; source context \"Rust Host And Proof Providers Implementation Plan / 8. P3 — Invocation Kernel Vertical Slice\", target context \"Host Invocation Routing Roadmap / Retained selected source material / Rust Host And Proof Providers Implementation Plan / 8. P3 — Invocation Kernel Vertical Slice\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "76fccfe2dc9de84352caa8360d813d2fa1205f18fb25d6125780483fc659c1cc"
  }
}
```

## Entry rationale-521

```json
{
  "entryId": "rationale-521",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_4bb58b361010872dadfab11d31a82ea0",
  "before": "Move the complete direct unheaded-block unit \"- `OperationId` and typed in-process `OperationRequest`/`ProviderOutcome` types. `EncodedMessage` bytes are deferred entirely to the external-process adapter (P7); built-\" from docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-31 to its frozen mapped owner docs/platform/host-invocation-routing/roadmap.md#unheaded-block-90. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Weak-exact: ancestor headings differ; document exact share below one half; independent full-text judgment remains required, not a script-proven approval.",
  "after": "Source: docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md:304-319#unheaded-block-31 (current lines); unit SHA256 1e755bcc2b7eebda6cefee89492e1f8913b6e4d4a3f52c25f28bfad8d471be4e.\nTarget: docs/platform/host-invocation-routing/roadmap.md:621-636#unheaded-block-92 (current lines); unit SHA256 1e755bcc2b7eebda6cefee89492e1f8913b6e4d4a3f52c25f28bfad8d471be4e.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 1e755bcc2b7eebda6cefee89492e1f8913b6e4d4a3f52c25f28bfad8d471be4e at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-31 under docs/platform/host-invocation-routing/roadmap.md#unheaded-block-92; source context \"Rust Host And Proof Providers Implementation Plan / 8. P3 — Invocation Kernel Vertical Slice / Deliverables\", target context \"Host Invocation Routing Roadmap / Retained selected source material / Rust Host And Proof Providers Implementation Plan / 8. P3 — Invocation Kernel Vertical Slice / Deliverables\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 520,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_4bb58b361010872dadfab11d31a82ea0",
    "sourceUnitDigest": "1e755bcc2b7eebda6cefee89492e1f8913b6e4d4a3f52c25f28bfad8d471be4e",
    "claimKind": "architecture",
    "kind": "roadmap",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/roadmap.md",
    "targetAnchor": "unheaded-block-92",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md:304-319#unheaded-block-31 (current lines); unit SHA256 1e755bcc2b7eebda6cefee89492e1f8913b6e4d4a3f52c25f28bfad8d471be4e.\nTarget: docs/platform/host-invocation-routing/roadmap.md:621-636#unheaded-block-92 (current lines); unit SHA256 1e755bcc2b7eebda6cefee89492e1f8913b6e4d4a3f52c25f28bfad8d471be4e.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 1e755bcc2b7eebda6cefee89492e1f8913b6e4d4a3f52c25f28bfad8d471be4e at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-31 under docs/platform/host-invocation-routing/roadmap.md#unheaded-block-92; source context \"Rust Host And Proof Providers Implementation Plan / 8. P3 — Invocation Kernel Vertical Slice / Deliverables\", target context \"Host Invocation Routing Roadmap / Retained selected source material / Rust Host And Proof Providers Implementation Plan / 8. P3 — Invocation Kernel Vertical Slice / Deliverables\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "1e755bcc2b7eebda6cefee89492e1f8913b6e4d4a3f52c25f28bfad8d471be4e"
  }
}
```

## Entry rationale-522

```json
{
  "entryId": "rationale-522",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_7c356f4986b78e8e534ba028cc9c367a",
  "before": "Move the complete direct unheaded-block unit \"1. Write failing tests for duplicate/missing bindings, incompatible contracts, disallowed host, and denied provider capability. 2. Implement catalog validation and immuta\" from docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-32 to its frozen mapped owner docs/platform/host-invocation-routing/roadmap.md#unheaded-block-91. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Weak-exact: ancestor headings differ; document exact share below one half; independent full-text judgment remains required, not a script-proven approval.",
  "after": "Source: docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md:323-334#unheaded-block-32 (current lines); unit SHA256 7ecf431e67de61d1dd3305be2ebb122a884316b74b0f571cf964887532047120.\nTarget: docs/platform/host-invocation-routing/roadmap.md:640-651#unheaded-block-93 (current lines); unit SHA256 7ecf431e67de61d1dd3305be2ebb122a884316b74b0f571cf964887532047120.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 7ecf431e67de61d1dd3305be2ebb122a884316b74b0f571cf964887532047120 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-32 under docs/platform/host-invocation-routing/roadmap.md#unheaded-block-93; source context \"Rust Host And Proof Providers Implementation Plan / 8. P3 — Invocation Kernel Vertical Slice / Steps\", target context \"Host Invocation Routing Roadmap / Retained selected source material / Rust Host And Proof Providers Implementation Plan / 8. P3 — Invocation Kernel Vertical Slice / Steps\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 521,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_7c356f4986b78e8e534ba028cc9c367a",
    "sourceUnitDigest": "7ecf431e67de61d1dd3305be2ebb122a884316b74b0f571cf964887532047120",
    "claimKind": "architecture",
    "kind": "roadmap",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/roadmap.md",
    "targetAnchor": "unheaded-block-93",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md:323-334#unheaded-block-32 (current lines); unit SHA256 7ecf431e67de61d1dd3305be2ebb122a884316b74b0f571cf964887532047120.\nTarget: docs/platform/host-invocation-routing/roadmap.md:640-651#unheaded-block-93 (current lines); unit SHA256 7ecf431e67de61d1dd3305be2ebb122a884316b74b0f571cf964887532047120.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 7ecf431e67de61d1dd3305be2ebb122a884316b74b0f571cf964887532047120 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-32 under docs/platform/host-invocation-routing/roadmap.md#unheaded-block-93; source context \"Rust Host And Proof Providers Implementation Plan / 8. P3 — Invocation Kernel Vertical Slice / Steps\", target context \"Host Invocation Routing Roadmap / Retained selected source material / Rust Host And Proof Providers Implementation Plan / 8. P3 — Invocation Kernel Vertical Slice / Steps\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "7ecf431e67de61d1dd3305be2ebb122a884316b74b0f571cf964887532047120"
  }
}
```

## Entry rationale-523

```json
{
  "entryId": "rationale-523",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_ce523f4693d5650f3b9318313ec44f5c",
  "before": "Move the complete direct unheaded-block unit \"Both host projectors reach the same provider and all negative cases fail closed. The Router is unit-testable with no I/O and no async runtime. No Node/process/filesystem/\" from docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-33 to its frozen mapped owner docs/platform/host-invocation-routing/roadmap.md#unheaded-block-92. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Weak-exact: ancestor headings differ; document exact share below one half; independent full-text judgment remains required, not a script-proven approval.",
  "after": "Source: docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md:338-340#unheaded-block-33 (current lines); unit SHA256 9bd28c8cb6d9aa3c290df6933ab40d160bae5babbb7a77c6005a8f8d285e4b33.\nTarget: docs/platform/host-invocation-routing/roadmap.md:655-657#unheaded-block-94 (current lines); unit SHA256 9bd28c8cb6d9aa3c290df6933ab40d160bae5babbb7a77c6005a8f8d285e4b33.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 9bd28c8cb6d9aa3c290df6933ab40d160bae5babbb7a77c6005a8f8d285e4b33 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-33 under docs/platform/host-invocation-routing/roadmap.md#unheaded-block-94; source context \"Rust Host And Proof Providers Implementation Plan / 8. P3 — Invocation Kernel Vertical Slice / Exit gate and verify\", target context \"Host Invocation Routing Roadmap / Retained selected source material / Rust Host And Proof Providers Implementation Plan / 8. P3 — Invocation Kernel Vertical Slice / Exit gate and verify\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 522,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_ce523f4693d5650f3b9318313ec44f5c",
    "sourceUnitDigest": "9bd28c8cb6d9aa3c290df6933ab40d160bae5babbb7a77c6005a8f8d285e4b33",
    "claimKind": "architecture",
    "kind": "roadmap",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/roadmap.md",
    "targetAnchor": "unheaded-block-94",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md:338-340#unheaded-block-33 (current lines); unit SHA256 9bd28c8cb6d9aa3c290df6933ab40d160bae5babbb7a77c6005a8f8d285e4b33.\nTarget: docs/platform/host-invocation-routing/roadmap.md:655-657#unheaded-block-94 (current lines); unit SHA256 9bd28c8cb6d9aa3c290df6933ab40d160bae5babbb7a77c6005a8f8d285e4b33.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 9bd28c8cb6d9aa3c290df6933ab40d160bae5babbb7a77c6005a8f8d285e4b33 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-33 under docs/platform/host-invocation-routing/roadmap.md#unheaded-block-94; source context \"Rust Host And Proof Providers Implementation Plan / 8. P3 — Invocation Kernel Vertical Slice / Exit gate and verify\", target context \"Host Invocation Routing Roadmap / Retained selected source material / Rust Host And Proof Providers Implementation Plan / 8. P3 — Invocation Kernel Vertical Slice / Exit gate and verify\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "9bd28c8cb6d9aa3c290df6933ab40d160bae5babbb7a77c6005a8f8d285e4b33"
  }
}
```

## Entry rationale-524

```json
{
  "entryId": "rationale-524",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_170a6657616537761a61c5f21bd16795",
  "before": "Move the complete direct unheaded-block unit \"```sh cargo test --workspace host_runtime cargo test --workspace invocation_service ```\" from docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-34 to its frozen mapped owner docs/platform/host-invocation-routing/roadmap.md#unheaded-block-93. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Weak-exact: ancestor headings differ; document exact share below one half; independent full-text judgment remains required, not a script-proven approval.",
  "after": "Source: docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md:342-345#unheaded-block-34 (current lines); unit SHA256 bed3893625ec1eb0eab0c618fa1190627f01f7ec673c5c47b0a6a99e4ae32d47.\nTarget: docs/platform/host-invocation-routing/roadmap.md:659-662#unheaded-block-95 (current lines); unit SHA256 bed3893625ec1eb0eab0c618fa1190627f01f7ec673c5c47b0a6a99e4ae32d47.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest bed3893625ec1eb0eab0c618fa1190627f01f7ec673c5c47b0a6a99e4ae32d47 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-34 under docs/platform/host-invocation-routing/roadmap.md#unheaded-block-95; source context \"Rust Host And Proof Providers Implementation Plan / 8. P3 — Invocation Kernel Vertical Slice / Exit gate and verify\", target context \"Host Invocation Routing Roadmap / Retained selected source material / Rust Host And Proof Providers Implementation Plan / 8. P3 — Invocation Kernel Vertical Slice / Exit gate and verify\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 523,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_170a6657616537761a61c5f21bd16795",
    "sourceUnitDigest": "bed3893625ec1eb0eab0c618fa1190627f01f7ec673c5c47b0a6a99e4ae32d47",
    "claimKind": "architecture",
    "kind": "roadmap",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/roadmap.md",
    "targetAnchor": "unheaded-block-95",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md:342-345#unheaded-block-34 (current lines); unit SHA256 bed3893625ec1eb0eab0c618fa1190627f01f7ec673c5c47b0a6a99e4ae32d47.\nTarget: docs/platform/host-invocation-routing/roadmap.md:659-662#unheaded-block-95 (current lines); unit SHA256 bed3893625ec1eb0eab0c618fa1190627f01f7ec673c5c47b0a6a99e4ae32d47.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest bed3893625ec1eb0eab0c618fa1190627f01f7ec673c5c47b0a6a99e4ae32d47 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-34 under docs/platform/host-invocation-routing/roadmap.md#unheaded-block-95; source context \"Rust Host And Proof Providers Implementation Plan / 8. P3 — Invocation Kernel Vertical Slice / Exit gate and verify\", target context \"Host Invocation Routing Roadmap / Retained selected source material / Rust Host And Proof Providers Implementation Plan / 8. P3 — Invocation Kernel Vertical Slice / Exit gate and verify\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "bed3893625ec1eb0eab0c618fa1190627f01f7ec673c5c47b0a6a99e4ae32d47"
  }
}
```

## Entry rationale-525

```json
{
  "entryId": "rationale-525",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_b45d296754409e2acbb77c0a4c1fef1b",
  "before": "Move the complete direct unheaded-block unit \"This lane lives in the CLI adapter, not the kernel: for `legacy-cli` selectors the CLI adapter looks up `CommandRouteDescriptor`, then execs the Node payload directly — a\" from docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-35 to its frozen mapped owner docs/platform/host-invocation-routing/roadmap.md#unheaded-block-94. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Judgment: no target digest match; independent full-text judgment remains required, not a script-proven approval.",
  "after": "Source: docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md:349-355#unheaded-block-35 (current lines); unit SHA256 c9ead15358ca1152a3fe77c2ed88067a1760249bb1c76ba299c2bc2fbf947737.\nTarget: docs/platform/host-invocation-routing/roadmap.md:666-672#unheaded-block-96 (current lines); unit SHA256 e4fa4c7a386530f8cf7c3028856364f3fc75c74b5f1eb9ad49b0adc64798c159.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest e4fa4c7a386530f8cf7c3028856364f3fc75c74b5f1eb9ad49b0adc64798c159 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 1, target 1; 1 changed spellings/labels, 1 destination changes; 0 added, 0 removed.\nLink 1: \"Legacy CLI Transition\" (./legacy-cli-transition.md) → \"Legacy CLI Transition\" (architecture/legacy-cli-transition.md); resolved docs/architect/host-invocation-routing/legacy-cli-transition.md → docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-35 under docs/platform/host-invocation-routing/roadmap.md#unheaded-block-96; source context \"Rust Host And Proof Providers Implementation Plan / 9. P4 — CLI Adapter Legacy Exec\", target context \"Host Invocation Routing Roadmap / Retained selected source material / Rust Host And Proof Providers Implementation Plan / 9. P4 — CLI Adapter Legacy Exec\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 524,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_b45d296754409e2acbb77c0a4c1fef1b",
    "sourceUnitDigest": "c9ead15358ca1152a3fe77c2ed88067a1760249bb1c76ba299c2bc2fbf947737",
    "claimKind": "architecture",
    "kind": "roadmap",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/roadmap.md",
    "targetAnchor": "unheaded-block-96",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md:349-355#unheaded-block-35 (current lines); unit SHA256 c9ead15358ca1152a3fe77c2ed88067a1760249bb1c76ba299c2bc2fbf947737.\nTarget: docs/platform/host-invocation-routing/roadmap.md:666-672#unheaded-block-96 (current lines); unit SHA256 e4fa4c7a386530f8cf7c3028856364f3fc75c74b5f1eb9ad49b0adc64798c159.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest e4fa4c7a386530f8cf7c3028856364f3fc75c74b5f1eb9ad49b0adc64798c159 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 1, target 1; 1 changed spellings/labels, 1 destination changes; 0 added, 0 removed.\nLink 1: \"Legacy CLI Transition\" (./legacy-cli-transition.md) → \"Legacy CLI Transition\" (architecture/legacy-cli-transition.md); resolved docs/architect/host-invocation-routing/legacy-cli-transition.md → docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-35 under docs/platform/host-invocation-routing/roadmap.md#unheaded-block-96; source context \"Rust Host And Proof Providers Implementation Plan / 9. P4 — CLI Adapter Legacy Exec\", target context \"Host Invocation Routing Roadmap / Retained selected source material / Rust Host And Proof Providers Implementation Plan / 9. P4 — CLI Adapter Legacy Exec\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "e4fa4c7a386530f8cf7c3028856364f3fc75c74b5f1eb9ad49b0adc64798c159"
  }
}
```

## Entry rationale-526

```json
{
  "entryId": "rationale-526",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_3c530d80d64e3352d8588bc11e13ac6a",
  "before": "Move the complete direct unheaded-block unit \"- Candidate Rust `fgos` executable. - CLI adapter descriptor lookup and direct-exec path for every `legacy-cli` selector via `CommandRouteDescriptor`, bypassing `Invocati\" from docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-36 to its frozen mapped owner docs/platform/host-invocation-routing/roadmap.md#unheaded-block-95. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Weak-exact: ancestor headings differ; document exact share below one half; independent full-text judgment remains required, not a script-proven approval.",
  "after": "Source: docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md:359-372#unheaded-block-36 (current lines); unit SHA256 02bb057b55c4a040107fc746594ef0de54daf28838788d0141e23a0dd7de653d.\nTarget: docs/platform/host-invocation-routing/roadmap.md:676-689#unheaded-block-97 (current lines); unit SHA256 02bb057b55c4a040107fc746594ef0de54daf28838788d0141e23a0dd7de653d.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 02bb057b55c4a040107fc746594ef0de54daf28838788d0141e23a0dd7de653d at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-36 under docs/platform/host-invocation-routing/roadmap.md#unheaded-block-97; source context \"Rust Host And Proof Providers Implementation Plan / 9. P4 — CLI Adapter Legacy Exec / Deliverables\", target context \"Host Invocation Routing Roadmap / Retained selected source material / Rust Host And Proof Providers Implementation Plan / 9. P4 — CLI Adapter Legacy Exec / Deliverables\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 525,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_3c530d80d64e3352d8588bc11e13ac6a",
    "sourceUnitDigest": "02bb057b55c4a040107fc746594ef0de54daf28838788d0141e23a0dd7de653d",
    "claimKind": "architecture",
    "kind": "roadmap",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/roadmap.md",
    "targetAnchor": "unheaded-block-97",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md:359-372#unheaded-block-36 (current lines); unit SHA256 02bb057b55c4a040107fc746594ef0de54daf28838788d0141e23a0dd7de653d.\nTarget: docs/platform/host-invocation-routing/roadmap.md:676-689#unheaded-block-97 (current lines); unit SHA256 02bb057b55c4a040107fc746594ef0de54daf28838788d0141e23a0dd7de653d.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 02bb057b55c4a040107fc746594ef0de54daf28838788d0141e23a0dd7de653d at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-36 under docs/platform/host-invocation-routing/roadmap.md#unheaded-block-97; source context \"Rust Host And Proof Providers Implementation Plan / 9. P4 — CLI Adapter Legacy Exec / Deliverables\", target context \"Host Invocation Routing Roadmap / Retained selected source material / Rust Host And Proof Providers Implementation Plan / 9. P4 — CLI Adapter Legacy Exec / Deliverables\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "02bb057b55c4a040107fc746594ef0de54daf28838788d0141e23a0dd7de653d"
  }
}
```

## Entry rationale-527

```json
{
  "entryId": "rationale-527",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_d9af584b6c9f0301147adddd40c434dc",
  "before": "Move the complete direct unheaded-block unit \"1. Add the ownership header to `bin/fgos.mjs` and the `AGENTS.md` note; no file move, no rename. 2. Scan only host-global options and a checked selector using `args_os`; \" from docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-37 to its frozen mapped owner docs/platform/host-invocation-routing/roadmap.md#unheaded-block-96. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Weak-exact: ancestor headings differ; document exact share below one half; independent full-text judgment remains required, not a script-proven approval.",
  "after": "Source: docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md:376-398#unheaded-block-37 (current lines); unit SHA256 63a1e5305e649cb2a39a525947555a53a011a9c987594e625641db28fa90b566.\nTarget: docs/platform/host-invocation-routing/roadmap.md:693-715#unheaded-block-98 (current lines); unit SHA256 63a1e5305e649cb2a39a525947555a53a011a9c987594e625641db28fa90b566.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 63a1e5305e649cb2a39a525947555a53a011a9c987594e625641db28fa90b566 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-37 under docs/platform/host-invocation-routing/roadmap.md#unheaded-block-98; source context \"Rust Host And Proof Providers Implementation Plan / 9. P4 — CLI Adapter Legacy Exec / Steps\", target context \"Host Invocation Routing Roadmap / Retained selected source material / Rust Host And Proof Providers Implementation Plan / 9. P4 — CLI Adapter Legacy Exec / Steps\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 526,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_d9af584b6c9f0301147adddd40c434dc",
    "sourceUnitDigest": "63a1e5305e649cb2a39a525947555a53a011a9c987594e625641db28fa90b566",
    "claimKind": "architecture",
    "kind": "roadmap",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/roadmap.md",
    "targetAnchor": "unheaded-block-98",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md:376-398#unheaded-block-37 (current lines); unit SHA256 63a1e5305e649cb2a39a525947555a53a011a9c987594e625641db28fa90b566.\nTarget: docs/platform/host-invocation-routing/roadmap.md:693-715#unheaded-block-98 (current lines); unit SHA256 63a1e5305e649cb2a39a525947555a53a011a9c987594e625641db28fa90b566.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 63a1e5305e649cb2a39a525947555a53a011a9c987594e625641db28fa90b566 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-37 under docs/platform/host-invocation-routing/roadmap.md#unheaded-block-98; source context \"Rust Host And Proof Providers Implementation Plan / 9. P4 — CLI Adapter Legacy Exec / Steps\", target context \"Host Invocation Routing Roadmap / Retained selected source material / Rust Host And Proof Providers Implementation Plan / 9. P4 — CLI Adapter Legacy Exec / Steps\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "63a1e5305e649cb2a39a525947555a53a011a9c987594e625641db28fa90b566"
  }
}
```

## Entry rationale-528

```json
{
  "entryId": "rationale-528",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_9344ec4f4abbe45957e9e660949bcc50",
  "before": "Move the complete direct unheaded-block unit \"Stable bytes, status, and filesystem effects match P1. The route kind (`legacy-cli`) is visible in captured diagnostics without changing public output. Node remains direc\" from docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-38 to its frozen mapped owner docs/platform/host-invocation-routing/roadmap.md#unheaded-block-97. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Weak-exact: ancestor headings differ; document exact share below one half; independent full-text judgment remains required, not a script-proven approval.",
  "after": "Source: docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md:402-406#unheaded-block-38 (current lines); unit SHA256 bb69d75fc970b570aed513a059b9fa5abbf57ba4899c0e7a286352fb0d268afb.\nTarget: docs/platform/host-invocation-routing/roadmap.md:719-723#unheaded-block-99 (current lines); unit SHA256 bb69d75fc970b570aed513a059b9fa5abbf57ba4899c0e7a286352fb0d268afb.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest bb69d75fc970b570aed513a059b9fa5abbf57ba4899c0e7a286352fb0d268afb at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-38 under docs/platform/host-invocation-routing/roadmap.md#unheaded-block-99; source context \"Rust Host And Proof Providers Implementation Plan / 9. P4 — CLI Adapter Legacy Exec / Exit gate and verify\", target context \"Host Invocation Routing Roadmap / Retained selected source material / Rust Host And Proof Providers Implementation Plan / 9. P4 — CLI Adapter Legacy Exec / Exit gate and verify\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 527,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_9344ec4f4abbe45957e9e660949bcc50",
    "sourceUnitDigest": "bb69d75fc970b570aed513a059b9fa5abbf57ba4899c0e7a286352fb0d268afb",
    "claimKind": "architecture",
    "kind": "roadmap",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/roadmap.md",
    "targetAnchor": "unheaded-block-99",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md:402-406#unheaded-block-38 (current lines); unit SHA256 bb69d75fc970b570aed513a059b9fa5abbf57ba4899c0e7a286352fb0d268afb.\nTarget: docs/platform/host-invocation-routing/roadmap.md:719-723#unheaded-block-99 (current lines); unit SHA256 bb69d75fc970b570aed513a059b9fa5abbf57ba4899c0e7a286352fb0d268afb.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest bb69d75fc970b570aed513a059b9fa5abbf57ba4899c0e7a286352fb0d268afb at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-38 under docs/platform/host-invocation-routing/roadmap.md#unheaded-block-99; source context \"Rust Host And Proof Providers Implementation Plan / 9. P4 — CLI Adapter Legacy Exec / Exit gate and verify\", target context \"Host Invocation Routing Roadmap / Retained selected source material / Rust Host And Proof Providers Implementation Plan / 9. P4 — CLI Adapter Legacy Exec / Exit gate and verify\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "bb69d75fc970b570aed513a059b9fa5abbf57ba4899c0e7a286352fb0d268afb"
  }
}
```

## Entry rationale-529

```json
{
  "entryId": "rationale-529",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_67f27db330eee764c88b7e7b98fa7aec",
  "before": "Move the complete direct unheaded-block unit \"```sh node --test test/rust-host/legacy-compatibility.test.mjs cargo test --workspace legacy_node ```\" from docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-39 to its frozen mapped owner docs/platform/host-invocation-routing/roadmap.md#unheaded-block-98. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Weak-exact: ancestor headings differ; document exact share below one half; independent full-text judgment remains required, not a script-proven approval.",
  "after": "Source: docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md:408-411#unheaded-block-39 (current lines); unit SHA256 345e76168d68f845e81ec91e47b30d6eadefbac4dd8cb82cd66ba58b608373ad.\nTarget: docs/platform/host-invocation-routing/roadmap.md:725-728#unheaded-block-100 (current lines); unit SHA256 345e76168d68f845e81ec91e47b30d6eadefbac4dd8cb82cd66ba58b608373ad.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 345e76168d68f845e81ec91e47b30d6eadefbac4dd8cb82cd66ba58b608373ad at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-39 under docs/platform/host-invocation-routing/roadmap.md#unheaded-block-100; source context \"Rust Host And Proof Providers Implementation Plan / 9. P4 — CLI Adapter Legacy Exec / Exit gate and verify\", target context \"Host Invocation Routing Roadmap / Retained selected source material / Rust Host And Proof Providers Implementation Plan / 9. P4 — CLI Adapter Legacy Exec / Exit gate and verify\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 528,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_67f27db330eee764c88b7e7b98fa7aec",
    "sourceUnitDigest": "345e76168d68f845e81ec91e47b30d6eadefbac4dd8cb82cd66ba58b608373ad",
    "claimKind": "architecture",
    "kind": "roadmap",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/roadmap.md",
    "targetAnchor": "unheaded-block-100",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md:408-411#unheaded-block-39 (current lines); unit SHA256 345e76168d68f845e81ec91e47b30d6eadefbac4dd8cb82cd66ba58b608373ad.\nTarget: docs/platform/host-invocation-routing/roadmap.md:725-728#unheaded-block-100 (current lines); unit SHA256 345e76168d68f845e81ec91e47b30d6eadefbac4dd8cb82cd66ba58b608373ad.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 345e76168d68f845e81ec91e47b30d6eadefbac4dd8cb82cd66ba58b608373ad at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-39 under docs/platform/host-invocation-routing/roadmap.md#unheaded-block-100; source context \"Rust Host And Proof Providers Implementation Plan / 9. P4 — CLI Adapter Legacy Exec / Exit gate and verify\", target context \"Host Invocation Routing Roadmap / Retained selected source material / Rust Host And Proof Providers Implementation Plan / 9. P4 — CLI Adapter Legacy Exec / Exit gate and verify\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "345e76168d68f845e81ec91e47b30d6eadefbac4dd8cb82cd66ba58b608373ad"
  }
}
```

## Entry rationale-530

```json
{
  "entryId": "rationale-530",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_fe3f6f8ac10ba0e516faa2ba0669ab12",
  "before": "Move the complete direct unheaded-block unit \"- Typed `distribution.build.show` contracts and built-in provider. - CLI `version` projection and cross-runtime/no-Node proof.\" from docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-40 to its frozen mapped owner docs/platform/host-invocation-routing/roadmap.md#unheaded-block-99. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Weak-exact: ancestor headings differ; document exact share below one half; independent full-text judgment remains required, not a script-proven approval.",
  "after": "Source: docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md:417-418#unheaded-block-40 (current lines); unit SHA256 93ddcf4d8a516e9adcd62cc3d5d659fad5a933fbb9550c8d3f70d5aa495df4d8.\nTarget: docs/platform/host-invocation-routing/roadmap.md:734-735#unheaded-block-101 (current lines); unit SHA256 93ddcf4d8a516e9adcd62cc3d5d659fad5a933fbb9550c8d3f70d5aa495df4d8.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 93ddcf4d8a516e9adcd62cc3d5d659fad5a933fbb9550c8d3f70d5aa495df4d8 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-40 under docs/platform/host-invocation-routing/roadmap.md#unheaded-block-101; source context \"Rust Host And Proof Providers Implementation Plan / 10. P5 — Native `version` / Deliverables\", target context \"Host Invocation Routing Roadmap / Retained selected source material / Rust Host And Proof Providers Implementation Plan / 10. P5 — Native `version` / Deliverables\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 529,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_fe3f6f8ac10ba0e516faa2ba0669ab12",
    "sourceUnitDigest": "93ddcf4d8a516e9adcd62cc3d5d659fad5a933fbb9550c8d3f70d5aa495df4d8",
    "claimKind": "architecture",
    "kind": "roadmap",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/roadmap.md",
    "targetAnchor": "unheaded-block-101",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md:417-418#unheaded-block-40 (current lines); unit SHA256 93ddcf4d8a516e9adcd62cc3d5d659fad5a933fbb9550c8d3f70d5aa495df4d8.\nTarget: docs/platform/host-invocation-routing/roadmap.md:734-735#unheaded-block-101 (current lines); unit SHA256 93ddcf4d8a516e9adcd62cc3d5d659fad5a933fbb9550c8d3f70d5aa495df4d8.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 93ddcf4d8a516e9adcd62cc3d5d659fad5a933fbb9550c8d3f70d5aa495df4d8 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-40 under docs/platform/host-invocation-routing/roadmap.md#unheaded-block-101; source context \"Rust Host And Proof Providers Implementation Plan / 10. P5 — Native `version` / Deliverables\", target context \"Host Invocation Routing Roadmap / Retained selected source material / Rust Host And Proof Providers Implementation Plan / 10. P5 — Native `version` / Deliverables\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "93ddcf4d8a516e9adcd62cc3d5d659fad5a933fbb9550c8d3f70d5aa495df4d8"
  }
}
```

## Entry rationale-531

```json
{
  "entryId": "rationale-531",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_36867e29d791ecbb5a8afb6510e047f6",
  "before": "Move the complete direct unheaded-block unit \"1. Port package version, product-checkout commit, and sorted public verb data. 2. Test transition-time version equality with root `package.json`. 3. Resolve Git against p\" from docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-41 to its frozen mapped owner docs/platform/host-invocation-routing/roadmap.md#unheaded-block-100. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Weak-exact: ancestor headings differ; document exact share below one half; independent full-text judgment remains required, not a script-proven approval.",
  "after": "Source: docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md:422-428#unheaded-block-41 (current lines); unit SHA256 eb7ccd3eb74202aa995bac942a64736933861b4619458b9b9305bbcc1802e5fd.\nTarget: docs/platform/host-invocation-routing/roadmap.md:739-745#unheaded-block-102 (current lines); unit SHA256 eb7ccd3eb74202aa995bac942a64736933861b4619458b9b9305bbcc1802e5fd.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest eb7ccd3eb74202aa995bac942a64736933861b4619458b9b9305bbcc1802e5fd at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-41 under docs/platform/host-invocation-routing/roadmap.md#unheaded-block-102; source context \"Rust Host And Proof Providers Implementation Plan / 10. P5 — Native `version` / Steps\", target context \"Host Invocation Routing Roadmap / Retained selected source material / Rust Host And Proof Providers Implementation Plan / 10. P5 — Native `version` / Steps\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 530,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_36867e29d791ecbb5a8afb6510e047f6",
    "sourceUnitDigest": "eb7ccd3eb74202aa995bac942a64736933861b4619458b9b9305bbcc1802e5fd",
    "claimKind": "architecture",
    "kind": "roadmap",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/roadmap.md",
    "targetAnchor": "unheaded-block-102",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md:422-428#unheaded-block-41 (current lines); unit SHA256 eb7ccd3eb74202aa995bac942a64736933861b4619458b9b9305bbcc1802e5fd.\nTarget: docs/platform/host-invocation-routing/roadmap.md:739-745#unheaded-block-102 (current lines); unit SHA256 eb7ccd3eb74202aa995bac942a64736933861b4619458b9b9305bbcc1802e5fd.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest eb7ccd3eb74202aa995bac942a64736933861b4619458b9b9305bbcc1802e5fd at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-41 under docs/platform/host-invocation-routing/roadmap.md#unheaded-block-102; source context \"Rust Host And Proof Providers Implementation Plan / 10. P5 — Native `version` / Steps\", target context \"Host Invocation Routing Roadmap / Retained selected source material / Rust Host And Proof Providers Implementation Plan / 10. P5 — Native `version` / Steps\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "eb7ccd3eb74202aa995bac942a64736933861b4619458b9b9305bbcc1802e5fd"
  }
}
```

## Entry rationale-532

```json
{
  "entryId": "rationale-532",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_c0feb8d360ffddc02c84efc83661c458",
  "before": "Move the complete direct unheaded-block unit \"The immutable binding selects built-in `version`, matches Node contract, and creates no Node process.\" from docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-42 to its frozen mapped owner docs/platform/host-invocation-routing/roadmap.md#unheaded-block-101. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Weak-exact: ancestor headings differ; document exact share below one half; independent full-text judgment remains required, not a script-proven approval.",
  "after": "Source: docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md:432-433#unheaded-block-42 (current lines); unit SHA256 166de2f356a6b6b84345ed4fbe93abd8854b50a6a6dcab344588510a57868621.\nTarget: docs/platform/host-invocation-routing/roadmap.md:749-750#unheaded-block-103 (current lines); unit SHA256 166de2f356a6b6b84345ed4fbe93abd8854b50a6a6dcab344588510a57868621.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 166de2f356a6b6b84345ed4fbe93abd8854b50a6a6dcab344588510a57868621 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-42 under docs/platform/host-invocation-routing/roadmap.md#unheaded-block-103; source context \"Rust Host And Proof Providers Implementation Plan / 10. P5 — Native `version` / Exit gate and verify\", target context \"Host Invocation Routing Roadmap / Retained selected source material / Rust Host And Proof Providers Implementation Plan / 10. P5 — Native `version` / Exit gate and verify\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 531,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_c0feb8d360ffddc02c84efc83661c458",
    "sourceUnitDigest": "166de2f356a6b6b84345ed4fbe93abd8854b50a6a6dcab344588510a57868621",
    "claimKind": "contract",
    "kind": "roadmap",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/roadmap.md",
    "targetAnchor": "unheaded-block-103",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md:432-433#unheaded-block-42 (current lines); unit SHA256 166de2f356a6b6b84345ed4fbe93abd8854b50a6a6dcab344588510a57868621.\nTarget: docs/platform/host-invocation-routing/roadmap.md:749-750#unheaded-block-103 (current lines); unit SHA256 166de2f356a6b6b84345ed4fbe93abd8854b50a6a6dcab344588510a57868621.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 166de2f356a6b6b84345ed4fbe93abd8854b50a6a6dcab344588510a57868621 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-42 under docs/platform/host-invocation-routing/roadmap.md#unheaded-block-103; source context \"Rust Host And Proof Providers Implementation Plan / 10. P5 — Native `version` / Exit gate and verify\", target context \"Host Invocation Routing Roadmap / Retained selected source material / Rust Host And Proof Providers Implementation Plan / 10. P5 — Native `version` / Exit gate and verify\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "166de2f356a6b6b84345ed4fbe93abd8854b50a6a6dcab344588510a57868621"
  }
}
```

## Entry rationale-533

```json
{
  "entryId": "rationale-533",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_99639b47347fba434b9b7d4bd1327bb5",
  "before": "Move the complete direct unheaded-block unit \"```sh node --test test/rust-host/version-parity.test.mjs cargo test --workspace distribution_build_show ```\" from docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-43 to its frozen mapped owner docs/platform/host-invocation-routing/roadmap.md#unheaded-block-102. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Weak-exact: ancestor headings differ; document exact share below one half; independent full-text judgment remains required, not a script-proven approval.",
  "after": "Source: docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md:435-438#unheaded-block-43 (current lines); unit SHA256 82a35a6f1ff8a72fab25b0af474876e4ff8c175eee8c9c0ee25c6125ea196146.\nTarget: docs/platform/host-invocation-routing/roadmap.md:752-755#unheaded-block-104 (current lines); unit SHA256 82a35a6f1ff8a72fab25b0af474876e4ff8c175eee8c9c0ee25c6125ea196146.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 82a35a6f1ff8a72fab25b0af474876e4ff8c175eee8c9c0ee25c6125ea196146 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-43 under docs/platform/host-invocation-routing/roadmap.md#unheaded-block-104; source context \"Rust Host And Proof Providers Implementation Plan / 10. P5 — Native `version` / Exit gate and verify\", target context \"Host Invocation Routing Roadmap / Retained selected source material / Rust Host And Proof Providers Implementation Plan / 10. P5 — Native `version` / Exit gate and verify\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 532,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_99639b47347fba434b9b7d4bd1327bb5",
    "sourceUnitDigest": "82a35a6f1ff8a72fab25b0af474876e4ff8c175eee8c9c0ee25c6125ea196146",
    "claimKind": "architecture",
    "kind": "roadmap",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/roadmap.md",
    "targetAnchor": "unheaded-block-104",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md:435-438#unheaded-block-43 (current lines); unit SHA256 82a35a6f1ff8a72fab25b0af474876e4ff8c175eee8c9c0ee25c6125ea196146.\nTarget: docs/platform/host-invocation-routing/roadmap.md:752-755#unheaded-block-104 (current lines); unit SHA256 82a35a6f1ff8a72fab25b0af474876e4ff8c175eee8c9c0ee25c6125ea196146.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 82a35a6f1ff8a72fab25b0af474876e4ff8c175eee8c9c0ee25c6125ea196146 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-43 under docs/platform/host-invocation-routing/roadmap.md#unheaded-block-104; source context \"Rust Host And Proof Providers Implementation Plan / 10. P5 — Native `version` / Exit gate and verify\", target context \"Host Invocation Routing Roadmap / Retained selected source material / Rust Host And Proof Providers Implementation Plan / 10. P5 — Native `version` / Exit gate and verify\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "82a35a6f1ff8a72fab25b0af474876e4ff8c175eee8c9c0ee25c6125ea196146"
  }
}
```

## Entry rationale-534

```json
{
  "entryId": "rationale-534",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_8b2997b208e7079cfdc61218ee3d2a50",
  "before": "Move the complete direct unheaded-block unit \"P6 is part of R1, not late cleanup. Install, activation, upgrade, rollback, and uninstall are owned by the packaging stream (`runtime-identity-and-activation.md`), not by\" from docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-44 to its frozen mapped owner docs/platform/host-invocation-routing/roadmap.md#unheaded-block-103. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Weak-exact: ancestor headings differ; document exact share below one half; independent full-text judgment remains required, not a script-proven approval.",
  "after": "Source: docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md:442-447#unheaded-block-44 (current lines); unit SHA256 1d656023f93305b34f09795ab3ea4219b5d4c8c36154bef71e245fdc09aa26cf.\nTarget: docs/platform/host-invocation-routing/roadmap.md:759-764#unheaded-block-105 (current lines); unit SHA256 1d656023f93305b34f09795ab3ea4219b5d4c8c36154bef71e245fdc09aa26cf.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 1d656023f93305b34f09795ab3ea4219b5d4c8c36154bef71e245fdc09aa26cf at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-44 under docs/platform/host-invocation-routing/roadmap.md#unheaded-block-105; source context \"Rust Host And Proof Providers Implementation Plan / 11. P6 — Distribution And Installed-Entry Cutover\", target context \"Host Invocation Routing Roadmap / Retained selected source material / Rust Host And Proof Providers Implementation Plan / 11. P6 — Distribution And Installed-Entry Cutover\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 533,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_8b2997b208e7079cfdc61218ee3d2a50",
    "sourceUnitDigest": "1d656023f93305b34f09795ab3ea4219b5d4c8c36154bef71e245fdc09aa26cf",
    "claimKind": "architecture",
    "kind": "roadmap",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/roadmap.md",
    "targetAnchor": "unheaded-block-105",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md:442-447#unheaded-block-44 (current lines); unit SHA256 1d656023f93305b34f09795ab3ea4219b5d4c8c36154bef71e245fdc09aa26cf.\nTarget: docs/platform/host-invocation-routing/roadmap.md:759-764#unheaded-block-105 (current lines); unit SHA256 1d656023f93305b34f09795ab3ea4219b5d4c8c36154bef71e245fdc09aa26cf.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 1d656023f93305b34f09795ab3ea4219b5d4c8c36154bef71e245fdc09aa26cf at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-44 under docs/platform/host-invocation-routing/roadmap.md#unheaded-block-105; source context \"Rust Host And Proof Providers Implementation Plan / 11. P6 — Distribution And Installed-Entry Cutover\", target context \"Host Invocation Routing Roadmap / Retained selected source material / Rust Host And Proof Providers Implementation Plan / 11. P6 — Distribution And Installed-Entry Cutover\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "1d656023f93305b34f09795ab3ea4219b5d4c8c36154bef71e245fdc09aa26cf"
  }
}
```

## Entry rationale-535

```json
{
  "entryId": "rationale-535",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_9ee3c1e8a270afbecd9d993057f83607",
  "before": "Move the complete direct unheaded-block unit \"1. Confirm the remaining §3 decisions (target matrix, preview-vs-stable) are recorded in the packaging stream before adding a new build-script module. 2. Extend `scripts/\" from docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-45 to its frozen mapped owner docs/platform/host-invocation-routing/roadmap.md#unheaded-block-104. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Weak-exact: ancestor headings differ; document exact share below one half; independent full-text judgment remains required, not a script-proven approval.",
  "after": "Source: docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md:451-486#unheaded-block-45 (current lines); unit SHA256 25e866e682f0ec8e370f018c1a0c289d21dd3dbd1f95a93aef957306070b61d2.\nTarget: docs/platform/host-invocation-routing/roadmap.md:768-803#unheaded-block-106 (current lines); unit SHA256 25e866e682f0ec8e370f018c1a0c289d21dd3dbd1f95a93aef957306070b61d2.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 25e866e682f0ec8e370f018c1a0c289d21dd3dbd1f95a93aef957306070b61d2 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-45 under docs/platform/host-invocation-routing/roadmap.md#unheaded-block-106; source context \"Rust Host And Proof Providers Implementation Plan / 11. P6 — Distribution And Installed-Entry Cutover / Steps\", target context \"Host Invocation Routing Roadmap / Retained selected source material / Rust Host And Proof Providers Implementation Plan / 11. P6 — Distribution And Installed-Entry Cutover / Steps\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 534,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_9ee3c1e8a270afbecd9d993057f83607",
    "sourceUnitDigest": "25e866e682f0ec8e370f018c1a0c289d21dd3dbd1f95a93aef957306070b61d2",
    "claimKind": "architecture",
    "kind": "roadmap",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/roadmap.md",
    "targetAnchor": "unheaded-block-106",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md:451-486#unheaded-block-45 (current lines); unit SHA256 25e866e682f0ec8e370f018c1a0c289d21dd3dbd1f95a93aef957306070b61d2.\nTarget: docs/platform/host-invocation-routing/roadmap.md:768-803#unheaded-block-106 (current lines); unit SHA256 25e866e682f0ec8e370f018c1a0c289d21dd3dbd1f95a93aef957306070b61d2.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 25e866e682f0ec8e370f018c1a0c289d21dd3dbd1f95a93aef957306070b61d2 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-45 under docs/platform/host-invocation-routing/roadmap.md#unheaded-block-106; source context \"Rust Host And Proof Providers Implementation Plan / 11. P6 — Distribution And Installed-Entry Cutover / Steps\", target context \"Host Invocation Routing Roadmap / Retained selected source material / Rust Host And Proof Providers Implementation Plan / 11. P6 — Distribution And Installed-Entry Cutover / Steps\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "25e866e682f0ec8e370f018c1a0c289d21dd3dbd1f95a93aef957306070b61d2"
  }
}
```

## Entry rationale-536

```json
{
  "entryId": "rationale-536",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_d4cc5fce1718a48b3f1510a87eb47273",
  "before": "Move the complete direct unheaded-block unit \"All targets pass P1/P5 through `fgctl init` from outside the repo; missing Node payload is diagnosed before legacy invocation; a broken runner payload is diagnosed separa\" from docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-46 to its frozen mapped owner docs/platform/host-invocation-routing/roadmap.md#unheaded-block-105. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Weak-exact: ancestor headings differ; document exact share below one half; independent full-text judgment remains required, not a script-proven approval.",
  "after": "Source: docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md:490-495#unheaded-block-46 (current lines); unit SHA256 df2efdbe1065777bf66b29b3846e218272b41860a75558e99163a53fd2652788.\nTarget: docs/platform/host-invocation-routing/roadmap.md:807-812#unheaded-block-107 (current lines); unit SHA256 df2efdbe1065777bf66b29b3846e218272b41860a75558e99163a53fd2652788.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest df2efdbe1065777bf66b29b3846e218272b41860a75558e99163a53fd2652788 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-46 under docs/platform/host-invocation-routing/roadmap.md#unheaded-block-107; source context \"Rust Host And Proof Providers Implementation Plan / 11. P6 — Distribution And Installed-Entry Cutover / Exit gate and verify\", target context \"Host Invocation Routing Roadmap / Retained selected source material / Rust Host And Proof Providers Implementation Plan / 11. P6 — Distribution And Installed-Entry Cutover / Exit gate and verify\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 535,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_d4cc5fce1718a48b3f1510a87eb47273",
    "sourceUnitDigest": "df2efdbe1065777bf66b29b3846e218272b41860a75558e99163a53fd2652788",
    "claimKind": "architecture",
    "kind": "roadmap",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/roadmap.md",
    "targetAnchor": "unheaded-block-107",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md:490-495#unheaded-block-46 (current lines); unit SHA256 df2efdbe1065777bf66b29b3846e218272b41860a75558e99163a53fd2652788.\nTarget: docs/platform/host-invocation-routing/roadmap.md:807-812#unheaded-block-107 (current lines); unit SHA256 df2efdbe1065777bf66b29b3846e218272b41860a75558e99163a53fd2652788.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest df2efdbe1065777bf66b29b3846e218272b41860a75558e99163a53fd2652788 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-46 under docs/platform/host-invocation-routing/roadmap.md#unheaded-block-107; source context \"Rust Host And Proof Providers Implementation Plan / 11. P6 — Distribution And Installed-Entry Cutover / Exit gate and verify\", target context \"Host Invocation Routing Roadmap / Retained selected source material / Rust Host And Proof Providers Implementation Plan / 11. P6 — Distribution And Installed-Entry Cutover / Exit gate and verify\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "df2efdbe1065777bf66b29b3846e218272b41860a75558e99163a53fd2652788"
  }
}
```

## Entry rationale-537

```json
{
  "entryId": "rationale-537",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_76de093f955dea43ee8202b61fd82aa3",
  "before": "Move the complete direct unheaded-block unit \"```sh npm test cargo test --workspace node --test test/install-packaging.test.mjs ```\" from docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-47 to its frozen mapped owner docs/platform/host-invocation-routing/roadmap.md#unheaded-block-106. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Weak-exact: ancestor headings differ; document exact share below one half; independent full-text judgment remains required, not a script-proven approval.",
  "after": "Source: docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md:497-501#unheaded-block-47 (current lines); unit SHA256 371cd71299f3f7c1da0b33660c6cdc3f378c0df6673262dcc63fef7c9ab6b979.\nTarget: docs/platform/host-invocation-routing/roadmap.md:814-818#unheaded-block-108 (current lines); unit SHA256 371cd71299f3f7c1da0b33660c6cdc3f378c0df6673262dcc63fef7c9ab6b979.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 371cd71299f3f7c1da0b33660c6cdc3f378c0df6673262dcc63fef7c9ab6b979 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-47 under docs/platform/host-invocation-routing/roadmap.md#unheaded-block-108; source context \"Rust Host And Proof Providers Implementation Plan / 11. P6 — Distribution And Installed-Entry Cutover / Exit gate and verify\", target context \"Host Invocation Routing Roadmap / Retained selected source material / Rust Host And Proof Providers Implementation Plan / 11. P6 — Distribution And Installed-Entry Cutover / Exit gate and verify\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 536,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_76de093f955dea43ee8202b61fd82aa3",
    "sourceUnitDigest": "371cd71299f3f7c1da0b33660c6cdc3f378c0df6673262dcc63fef7c9ab6b979",
    "claimKind": "architecture",
    "kind": "roadmap",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/roadmap.md",
    "targetAnchor": "unheaded-block-108",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md:497-501#unheaded-block-47 (current lines); unit SHA256 371cd71299f3f7c1da0b33660c6cdc3f378c0df6673262dcc63fef7c9ab6b979.\nTarget: docs/platform/host-invocation-routing/roadmap.md:814-818#unheaded-block-108 (current lines); unit SHA256 371cd71299f3f7c1da0b33660c6cdc3f378c0df6673262dcc63fef7c9ab6b979.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 371cd71299f3f7c1da0b33660c6cdc3f378c0df6673262dcc63fef7c9ab6b979 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-47 under docs/platform/host-invocation-routing/roadmap.md#unheaded-block-108; source context \"Rust Host And Proof Providers Implementation Plan / 11. P6 — Distribution And Installed-Entry Cutover / Exit gate and verify\", target context \"Host Invocation Routing Roadmap / Retained selected source material / Rust Host And Proof Providers Implementation Plan / 11. P6 — Distribution And Installed-Entry Cutover / Exit gate and verify\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "371cd71299f3f7c1da0b33660c6cdc3f378c0df6673262dcc63fef7c9ab6b979"
  }
}
```

## Entry rationale-538

```json
{
  "entryId": "rationale-538",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_23895431539495abbc82161abcb35e9d",
  "before": "Move the complete direct unheaded-block unit \"Add explicit matrix commands after §3's remaining target-matrix and preview-vs-stable decisions land.\" from docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-48 to its frozen mapped owner docs/platform/host-invocation-routing/roadmap.md#unheaded-block-107. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Weak-exact: ancestor headings differ; document exact share below one half; independent full-text judgment remains required, not a script-proven approval.",
  "after": "Source: docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md:503-504#unheaded-block-48 (current lines); unit SHA256 d4563d252f032faff978402ee96bcd89afd89337c846925b5059f1037dd666bf.\nTarget: docs/platform/host-invocation-routing/roadmap.md:820-821#unheaded-block-109 (current lines); unit SHA256 d4563d252f032faff978402ee96bcd89afd89337c846925b5059f1037dd666bf.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest d4563d252f032faff978402ee96bcd89afd89337c846925b5059f1037dd666bf at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-48 under docs/platform/host-invocation-routing/roadmap.md#unheaded-block-109; source context \"Rust Host And Proof Providers Implementation Plan / 11. P6 — Distribution And Installed-Entry Cutover / Exit gate and verify\", target context \"Host Invocation Routing Roadmap / Retained selected source material / Rust Host And Proof Providers Implementation Plan / 11. P6 — Distribution And Installed-Entry Cutover / Exit gate and verify\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 537,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_23895431539495abbc82161abcb35e9d",
    "sourceUnitDigest": "d4563d252f032faff978402ee96bcd89afd89337c846925b5059f1037dd666bf",
    "claimKind": "architecture",
    "kind": "roadmap",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/roadmap.md",
    "targetAnchor": "unheaded-block-109",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md:503-504#unheaded-block-48 (current lines); unit SHA256 d4563d252f032faff978402ee96bcd89afd89337c846925b5059f1037dd666bf.\nTarget: docs/platform/host-invocation-routing/roadmap.md:820-821#unheaded-block-109 (current lines); unit SHA256 d4563d252f032faff978402ee96bcd89afd89337c846925b5059f1037dd666bf.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest d4563d252f032faff978402ee96bcd89afd89337c846925b5059f1037dd666bf at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-48 under docs/platform/host-invocation-routing/roadmap.md#unheaded-block-109; source context \"Rust Host And Proof Providers Implementation Plan / 11. P6 — Distribution And Installed-Entry Cutover / Exit gate and verify\", target context \"Host Invocation Routing Roadmap / Retained selected source material / Rust Host And Proof Providers Implementation Plan / 11. P6 — Distribution And Installed-Entry Cutover / Exit gate and verify\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "d4563d252f032faff978402ee96bcd89afd89337c846925b5059f1037dd666bf"
  }
}
```

## Entry rationale-539

```json
{
  "entryId": "rationale-539",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_0d786a42ec0d0eb88bfad2d38909ace5",
  "before": "Move the complete direct unheaded-block unit \"See [External Provider Protocol](./external-provider-protocol.md) for the wire-format/handshake contract this section proves against. This is also where `EncodedMessage` \" from docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-49 to its frozen mapped owner docs/platform/host-invocation-routing/roadmap.md#unheaded-block-108. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Judgment: no target digest match; independent full-text judgment remains required, not a script-proven approval.",
  "after": "Source: docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md:508-511#unheaded-block-49 (current lines); unit SHA256 045ef706aafe96262b3c3b9a2abc194e7d24c45f2d11a37fd7f5885afd67f795.\nTarget: docs/platform/host-invocation-routing/roadmap.md:825-828#unheaded-block-110 (current lines); unit SHA256 18c7e8073dd6c5fd6cd05822b630c50d44660275f1aac3ae8cafc2dd270c0798.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 18c7e8073dd6c5fd6cd05822b630c50d44660275f1aac3ae8cafc2dd270c0798 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 1, target 1; 1 changed spellings/labels, 1 destination changes; 0 added, 0 removed.\nLink 1: \"External Provider Protocol\" (./external-provider-protocol.md) → \"External Provider Protocol\" (architecture/external-provider-protocol.md); resolved docs/architect/host-invocation-routing/external-provider-protocol.md → docs/platform/host-invocation-routing/architecture/external-provider-protocol.md.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-49 under docs/platform/host-invocation-routing/roadmap.md#unheaded-block-110; source context \"Rust Host And Proof Providers Implementation Plan / 12. P7 — External Process Provider Preview\", target context \"Host Invocation Routing Roadmap / Retained selected source material / Rust Host And Proof Providers Implementation Plan / 12. P7 — External Process Provider Preview\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 538,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_0d786a42ec0d0eb88bfad2d38909ace5",
    "sourceUnitDigest": "045ef706aafe96262b3c3b9a2abc194e7d24c45f2d11a37fd7f5885afd67f795",
    "claimKind": "contract",
    "kind": "roadmap",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/roadmap.md",
    "targetAnchor": "unheaded-block-110",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md:508-511#unheaded-block-49 (current lines); unit SHA256 045ef706aafe96262b3c3b9a2abc194e7d24c45f2d11a37fd7f5885afd67f795.\nTarget: docs/platform/host-invocation-routing/roadmap.md:825-828#unheaded-block-110 (current lines); unit SHA256 18c7e8073dd6c5fd6cd05822b630c50d44660275f1aac3ae8cafc2dd270c0798.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 18c7e8073dd6c5fd6cd05822b630c50d44660275f1aac3ae8cafc2dd270c0798 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 1, target 1; 1 changed spellings/labels, 1 destination changes; 0 added, 0 removed.\nLink 1: \"External Provider Protocol\" (./external-provider-protocol.md) → \"External Provider Protocol\" (architecture/external-provider-protocol.md); resolved docs/architect/host-invocation-routing/external-provider-protocol.md → docs/platform/host-invocation-routing/architecture/external-provider-protocol.md.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-49 under docs/platform/host-invocation-routing/roadmap.md#unheaded-block-110; source context \"Rust Host And Proof Providers Implementation Plan / 12. P7 — External Process Provider Preview\", target context \"Host Invocation Routing Roadmap / Retained selected source material / Rust Host And Proof Providers Implementation Plan / 12. P7 — External Process Provider Preview\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "18c7e8073dd6c5fd6cd05822b630c50d44660275f1aac3ae8cafc2dd270c0798"
  }
}
```

## Entry rationale-540

```json
{
  "entryId": "rationale-540",
  "kind": "binding-derived-rationale-rebuild",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_51cc2bb9b57c4e57f4d874cedc48d5e1",
  "before": "Move the complete direct unheaded-block unit \"1. Create the provider fixture in a temp external directory. 2. Validate its static manifest without execution. 3. Prove handshake identity/digest/version/concurrency neg\" from docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-50 to its frozen mapped owner docs/platform/host-invocation-routing/roadmap.md#unheaded-block-109. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Weak-exact: ancestor headings differ; document exact share below one half; independent full-text judgment remains required, not a script-proven approval.",
  "after": "Source: docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md:515-523#unheaded-block-50 (current lines); unit SHA256 2601da12c9b64e7bccedcef274f7b4a27a8619f74412c97ad016b17a94991261.\nTarget: docs/platform/host-invocation-routing/roadmap.md:832-840#unheaded-block-111 (current lines); unit SHA256 2601da12c9b64e7bccedcef274f7b4a27a8619f74412c97ad016b17a94991261.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 2601da12c9b64e7bccedcef274f7b4a27a8619f74412c97ad016b17a94991261 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-50 under docs/platform/host-invocation-routing/roadmap.md#unheaded-block-111; source context \"Rust Host And Proof Providers Implementation Plan / 12. P7 — External Process Provider Preview / Steps\", target context \"Host Invocation Routing Roadmap / Retained selected source material / Rust Host And Proof Providers Implementation Plan / 12. P7 — External Process Provider Preview / Steps\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
  "priorReviewStatus": "reviewed",
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round3-rationale-edits.json",
  "evidenceIndex": 539,
  "mechanicalRequired": true,
  "deepReview": "Independent seeded sample of regenerated rationales; source-claim deep obligations under A36 remain. Recompute every generated rationale by rerunning unchanged checker.",
  "reviewScope": "One current pending claim verdict; the before prose is historical. CurrentDecision and after are loaded from the immutable content pin.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_51cc2bb9b57c4e57f4d874cedc48d5e1",
    "sourceUnitDigest": "2601da12c9b64e7bccedcef274f7b4a27a8619f74412c97ad016b17a94991261",
    "claimKind": "architecture",
    "kind": "roadmap",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/roadmap.md",
    "targetAnchor": "unheaded-block-111",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md:515-523#unheaded-block-50 (current lines); unit SHA256 2601da12c9b64e7bccedcef274f7b4a27a8619f74412c97ad016b17a94991261.\nTarget: docs/platform/host-invocation-routing/roadmap.md:832-840#unheaded-block-111 (current lines); unit SHA256 2601da12c9b64e7bccedcef274f7b4a27a8619f74412c97ad016b17a94991261.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 2601da12c9b64e7bccedcef274f7b4a27a8619f74412c97ad016b17a94991261 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-50 under docs/platform/host-invocation-routing/roadmap.md#unheaded-block-111; source context \"Rust Host And Proof Providers Implementation Plan / 12. P7 — External Process Provider Preview / Steps\", target context \"Host Invocation Routing Roadmap / Retained selected source material / Rust Host And Proof Providers Implementation Plan / 12. P7 — External Process Provider Preview / Steps\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "2601da12c9b64e7bccedcef274f7b4a27a8619f74412c97ad016b17a94991261"
  }
}
```

