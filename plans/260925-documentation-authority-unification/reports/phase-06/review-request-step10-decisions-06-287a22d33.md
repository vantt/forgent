# Bounded re-review: decisions 6

Author session: `codex-session:unit-run-1792093168554-f28af963@2026-10-16`
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

## Entry decisions-001

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-behaviors.json",
  "collection": "claims",
  "claimId": "claim_22efb604ffdcadbc5fd3d9a3df00d539",
  "before": {
    "claimId": "claim_22efb604ffdcadbc5fd3d9a3df00d539",
    "sourceUnitDigest": "dd49a6c2fced83ce",
    "targetOwner": "docs/platform/work-state/spec.md",
    "targetAnchor": "unheaded-block-66",
    "claimKind": "specification",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "Body of the add verb section (source lines 873-886) is carried byte-identical (checked line by line against the candidate block, no link rewrite) in unheaded-block-66 of spec.md under the add verb heading; behavior-format specification of the CLI verb. A22 mechanical compatibility consequence: the exact whole-shard legacy approval exemption is no longer available after the authorized A35 target edits in this shard. This row's source, target unit and ancestry are unchanged; independent ordinary conservation review is required with no assumed old approval.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "dd49a6c2fced83cebc38d9acb4a40dc3954a7776b9c56c825e3fc71c95407fd6",
    "targetAncestry": [
      "Work State Specification",
      "9. Behaviors And Operations",
      "Add Verb"
    ]
  },
  "after": {
    "claimId": "claim_22efb604ffdcadbc5fd3d9a3df00d539",
    "sourceUnitDigest": "dd49a6c2fced83ce",
    "targetOwner": "docs/platform/work-state/spec.md",
    "targetAnchor": "unheaded-block-66",
    "claimKind": "specification",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Body of the add verb section (source lines 873-886) is carried byte-identical (checked line by line against the candidate block, no link rewrite) in unheaded-block-66 of spec.md under the add verb heading; behavior-format specification of the CLI verb. A22 mechanical compatibility consequence: the exact whole-shard legacy approval exemption is no longer available after the authorized A35 target edits in this shard. This row's source, target unit and ancestry are unchanged; independent ordinary conservation review is required with no assumed old approval.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: digests recomputed by extractor and independent hash and equal (text byte-equal), shard row equals pack, source and target anchors pass, ancestry Add Verb equals the shard, rationale line range 873-886 and target anchor match the unit; text not re-read beyond byte equality",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "dd49a6c2fced83cebc38d9acb4a40dc3954a7776b9c56c825e3fc71c95407fd6",
    "targetAncestry": [
      "Work State Specification",
      "9. Behaviors And Operations",
      "Add Verb"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_22efb604ffdcadbc5fd3d9a3df00d539",
    "sourceUnitDigest": "dd49a6c2fced83ce",
    "targetOwner": "docs/platform/work-state/spec.md",
    "targetAnchor": "unheaded-block-66",
    "claimKind": "specification",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Body of the add verb section (source lines 873-886) is carried byte-identical (checked line by line against the candidate block, no link rewrite) in unheaded-block-66 of spec.md under the add verb heading; behavior-format specification of the CLI verb. A22 mechanical compatibility consequence: the exact whole-shard legacy approval exemption is no longer available after the authorized A35 target edits in this shard. This row's source, target unit and ancestry are unchanged; independent ordinary conservation review is required with no assumed old approval.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: digests recomputed by extractor and independent hash and equal (text byte-equal), shard row equals pack, source and target anchors pass, ancestry Add Verb equals the shard, rationale line range 873-886 and target anchor match the unit; text not re-read beyond byte equality",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "dd49a6c2fced83cebc38d9acb4a40dc3954a7776b9c56c825e3fc71c95407fd6",
    "targetAncestry": [
      "Work State Specification",
      "9. Behaviors And Operations",
      "Add Verb"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-001"
}
```

## Entry decisions-002

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-behaviors.json",
  "collection": "claims",
  "claimId": "claim_51cd8773ebe1fd970ca4d3dd8c718b17",
  "before": {
    "claimId": "claim_51cd8773ebe1fd970ca4d3dd8c718b17",
    "sourceUnitDigest": "876c0093197ca07d",
    "targetOwner": "docs/platform/work-state/spec.md",
    "targetAnchor": "unheaded-block-69",
    "claimKind": "specification",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "Body of the plan verb section (source lines 985-1005) is carried byte-identical (checked line by line against the candidate block, no link rewrite) in unheaded-block-69 of spec.md under the plan verb heading; behavior-format specification of the CLI verb. A22 mechanical compatibility consequence: the exact whole-shard legacy approval exemption is no longer available after the authorized A35 target edits in this shard. This row's source, target unit and ancestry are unchanged; independent ordinary conservation review is required with no assumed old approval.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "876c0093197ca07debf3dbbc4844f926cfb2268f897bef63fca4254c50bd55f7",
    "targetAncestry": [
      "Work State Specification",
      "9. Behaviors And Operations",
      "Plan Verb"
    ]
  },
  "after": {
    "claimId": "claim_51cd8773ebe1fd970ca4d3dd8c718b17",
    "sourceUnitDigest": "876c0093197ca07d",
    "targetOwner": "docs/platform/work-state/spec.md",
    "targetAnchor": "unheaded-block-69",
    "claimKind": "specification",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Body of the plan verb section (source lines 985-1005) is carried byte-identical (checked line by line against the candidate block, no link rewrite) in unheaded-block-69 of spec.md under the plan verb heading; behavior-format specification of the CLI verb. A22 mechanical compatibility consequence: the exact whole-shard legacy approval exemption is no longer available after the authorized A35 target edits in this shard. This row's source, target unit and ancestry are unchanged; independent ordinary conservation review is required with no assumed old approval.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: digests recomputed by extractor and independent hash and equal (text byte-equal), shard row equals pack, source and target anchors pass, ancestry Plan Verb equals the shard, rationale line range 985-1005 and target anchor match the unit; text not re-read beyond byte equality",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "876c0093197ca07debf3dbbc4844f926cfb2268f897bef63fca4254c50bd55f7",
    "targetAncestry": [
      "Work State Specification",
      "9. Behaviors And Operations",
      "Plan Verb"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_51cd8773ebe1fd970ca4d3dd8c718b17",
    "sourceUnitDigest": "876c0093197ca07d",
    "targetOwner": "docs/platform/work-state/spec.md",
    "targetAnchor": "unheaded-block-69",
    "claimKind": "specification",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Body of the plan verb section (source lines 985-1005) is carried byte-identical (checked line by line against the candidate block, no link rewrite) in unheaded-block-69 of spec.md under the plan verb heading; behavior-format specification of the CLI verb. A22 mechanical compatibility consequence: the exact whole-shard legacy approval exemption is no longer available after the authorized A35 target edits in this shard. This row's source, target unit and ancestry are unchanged; independent ordinary conservation review is required with no assumed old approval.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: digests recomputed by extractor and independent hash and equal (text byte-equal), shard row equals pack, source and target anchors pass, ancestry Plan Verb equals the shard, rationale line range 985-1005 and target anchor match the unit; text not re-read beyond byte equality",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "876c0093197ca07debf3dbbc4844f926cfb2268f897bef63fca4254c50bd55f7",
    "targetAncestry": [
      "Work State Specification",
      "9. Behaviors And Operations",
      "Plan Verb"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-002"
}
```

## Entry decisions-003

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-behaviors.json",
  "collection": "claims",
  "claimId": "claim_c43065f0988aa74de6c17c9a17ea138b",
  "before": {
    "claimId": "claim_c43065f0988aa74de6c17c9a17ea138b",
    "sourceUnitDigest": "03e628ac0acb982a",
    "targetOwner": "docs/platform/work-state/spec.md",
    "targetAnchor": "unheaded-block-70",
    "claimKind": "specification",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "Body of the move verb section (source lines 1009-1012) is carried byte-identical (checked line by line against the candidate block, no link rewrite) in unheaded-block-70 of spec.md under the move verb heading; behavior-format specification of the CLI verb. A22 mechanical compatibility consequence: the exact whole-shard legacy approval exemption is no longer available after the authorized A35 target edits in this shard. This row's source, target unit and ancestry are unchanged; independent ordinary conservation review is required with no assumed old approval.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "03e628ac0acb982ad74952d25a5455b032f21664ed147ecf3d8a7fb8c880bf18",
    "targetAncestry": [
      "Work State Specification",
      "9. Behaviors And Operations",
      "Move Verb"
    ]
  },
  "after": {
    "claimId": "claim_c43065f0988aa74de6c17c9a17ea138b",
    "sourceUnitDigest": "03e628ac0acb982a",
    "targetOwner": "docs/platform/work-state/spec.md",
    "targetAnchor": "unheaded-block-70",
    "claimKind": "specification",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Body of the move verb section (source lines 1009-1012) is carried byte-identical (checked line by line against the candidate block, no link rewrite) in unheaded-block-70 of spec.md under the move verb heading; behavior-format specification of the CLI verb. A22 mechanical compatibility consequence: the exact whole-shard legacy approval exemption is no longer available after the authorized A35 target edits in this shard. This row's source, target unit and ancestry are unchanged; independent ordinary conservation review is required with no assumed old approval.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: digests recomputed by extractor and independent hash and equal (text byte-equal), shard row equals pack, source and target anchors pass, ancestry Move Verb equals the shard, rationale line range 1009-1012 and target anchor match the unit; text not re-read beyond byte equality",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "03e628ac0acb982ad74952d25a5455b032f21664ed147ecf3d8a7fb8c880bf18",
    "targetAncestry": [
      "Work State Specification",
      "9. Behaviors And Operations",
      "Move Verb"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_c43065f0988aa74de6c17c9a17ea138b",
    "sourceUnitDigest": "03e628ac0acb982a",
    "targetOwner": "docs/platform/work-state/spec.md",
    "targetAnchor": "unheaded-block-70",
    "claimKind": "specification",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Body of the move verb section (source lines 1009-1012) is carried byte-identical (checked line by line against the candidate block, no link rewrite) in unheaded-block-70 of spec.md under the move verb heading; behavior-format specification of the CLI verb. A22 mechanical compatibility consequence: the exact whole-shard legacy approval exemption is no longer available after the authorized A35 target edits in this shard. This row's source, target unit and ancestry are unchanged; independent ordinary conservation review is required with no assumed old approval.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: digests recomputed by extractor and independent hash and equal (text byte-equal), shard row equals pack, source and target anchors pass, ancestry Move Verb equals the shard, rationale line range 1009-1012 and target anchor match the unit; text not re-read beyond byte equality",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "03e628ac0acb982ad74952d25a5455b032f21664ed147ecf3d8a7fb8c880bf18",
    "targetAncestry": [
      "Work State Specification",
      "9. Behaviors And Operations",
      "Move Verb"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-003"
}
```

## Entry decisions-004

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-behaviors.json",
  "collection": "claims",
  "claimId": "claim_c0b05f63cf59ca8de5eb30a847394aca",
  "before": {
    "claimId": "claim_c0b05f63cf59ca8de5eb30a847394aca",
    "sourceUnitDigest": "62894935652369b5",
    "targetOwner": "docs/platform/work-state/spec.md",
    "targetAnchor": "unheaded-block-71",
    "claimKind": "specification",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "Body of the edit verb section (source lines 1016-1030) is carried byte-identical (checked line by line against the candidate block, no link rewrite) in unheaded-block-71 of spec.md under the edit verb heading; behavior-format specification of the CLI verb. A22 mechanical compatibility consequence: the exact whole-shard legacy approval exemption is no longer available after the authorized A35 target edits in this shard. This row's source, target unit and ancestry are unchanged; independent ordinary conservation review is required with no assumed old approval.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "62894935652369b5403e491ef4abbb29b006389988bc1e3e25fc20253ba48bc4",
    "targetAncestry": [
      "Work State Specification",
      "9. Behaviors And Operations",
      "Edit Verb"
    ]
  },
  "after": {
    "claimId": "claim_c0b05f63cf59ca8de5eb30a847394aca",
    "sourceUnitDigest": "62894935652369b5",
    "targetOwner": "docs/platform/work-state/spec.md",
    "targetAnchor": "unheaded-block-71",
    "claimKind": "specification",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Body of the edit verb section (source lines 1016-1030) is carried byte-identical (checked line by line against the candidate block, no link rewrite) in unheaded-block-71 of spec.md under the edit verb heading; behavior-format specification of the CLI verb. A22 mechanical compatibility consequence: the exact whole-shard legacy approval exemption is no longer available after the authorized A35 target edits in this shard. This row's source, target unit and ancestry are unchanged; independent ordinary conservation review is required with no assumed old approval.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: work-state.md#unheaded-block-84 (L1016-1030) to work-state/spec.md#unheaded-block-71 (L866-880): text byte-equal (read both ends, 1221 chars), digests recomputed by extractor and by independent hash, anchor passes, ancestry Edit Verb equals the shard; rationale line range, anchor and opening words match the unit",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "62894935652369b5403e491ef4abbb29b006389988bc1e3e25fc20253ba48bc4",
    "targetAncestry": [
      "Work State Specification",
      "9. Behaviors And Operations",
      "Edit Verb"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_c0b05f63cf59ca8de5eb30a847394aca",
    "sourceUnitDigest": "62894935652369b5",
    "targetOwner": "docs/platform/work-state/spec.md",
    "targetAnchor": "unheaded-block-71",
    "claimKind": "specification",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Body of the edit verb section (source lines 1016-1030) is carried byte-identical (checked line by line against the candidate block, no link rewrite) in unheaded-block-71 of spec.md under the edit verb heading; behavior-format specification of the CLI verb. A22 mechanical compatibility consequence: the exact whole-shard legacy approval exemption is no longer available after the authorized A35 target edits in this shard. This row's source, target unit and ancestry are unchanged; independent ordinary conservation review is required with no assumed old approval.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: work-state.md#unheaded-block-84 (L1016-1030) to work-state/spec.md#unheaded-block-71 (L866-880): text byte-equal (read both ends, 1221 chars), digests recomputed by extractor and by independent hash, anchor passes, ancestry Edit Verb equals the shard; rationale line range, anchor and opening words match the unit",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "62894935652369b5403e491ef4abbb29b006389988bc1e3e25fc20253ba48bc4",
    "targetAncestry": [
      "Work State Specification",
      "9. Behaviors And Operations",
      "Edit Verb"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-004"
}
```

## Entry decisions-005

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-behaviors.json",
  "collection": "claims",
  "claimId": "claim_ff435eb0a41c23d9066c658cdbd2c2b9",
  "before": {
    "claimId": "claim_ff435eb0a41c23d9066c658cdbd2c2b9",
    "sourceUnitDigest": "c36313e9a59bc69c",
    "targetOwner": "docs/platform/work-state/spec.md",
    "targetAnchor": "unheaded-block-72",
    "claimKind": "specification",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "Body of the edit verb section (source lines 1032-1056) is carried byte-identical (checked line by line against the candidate block, no link rewrite) in unheaded-block-72 of spec.md under the edit verb heading; behavior-format specification of the CLI verb. A22 mechanical compatibility consequence: the exact whole-shard legacy approval exemption is no longer available after the authorized A35 target edits in this shard. This row's source, target unit and ancestry are unchanged; independent ordinary conservation review is required with no assumed old approval.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "c36313e9a59bc69c1f04a65dc22c55bd72e374e693fd9f4351a3534d1ccf1493",
    "targetAncestry": [
      "Work State Specification",
      "9. Behaviors And Operations",
      "Edit Verb"
    ]
  },
  "after": {
    "claimId": "claim_ff435eb0a41c23d9066c658cdbd2c2b9",
    "sourceUnitDigest": "c36313e9a59bc69c",
    "targetOwner": "docs/platform/work-state/spec.md",
    "targetAnchor": "unheaded-block-72",
    "claimKind": "specification",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Body of the edit verb section (source lines 1032-1056) is carried byte-identical (checked line by line against the candidate block, no link rewrite) in unheaded-block-72 of spec.md under the edit verb heading; behavior-format specification of the CLI verb. A22 mechanical compatibility consequence: the exact whole-shard legacy approval exemption is no longer available after the authorized A35 target edits in this shard. This row's source, target unit and ancestry are unchanged; independent ordinary conservation review is required with no assumed old approval.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: digests recomputed by extractor and independent hash and equal (text byte-equal), shard row equals pack, source and target anchors pass, ancestry Edit Verb equals the shard, rationale line range 1032-1056 and target anchor match the unit; text not re-read beyond byte equality",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "c36313e9a59bc69c1f04a65dc22c55bd72e374e693fd9f4351a3534d1ccf1493",
    "targetAncestry": [
      "Work State Specification",
      "9. Behaviors And Operations",
      "Edit Verb"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_ff435eb0a41c23d9066c658cdbd2c2b9",
    "sourceUnitDigest": "c36313e9a59bc69c",
    "targetOwner": "docs/platform/work-state/spec.md",
    "targetAnchor": "unheaded-block-72",
    "claimKind": "specification",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Body of the edit verb section (source lines 1032-1056) is carried byte-identical (checked line by line against the candidate block, no link rewrite) in unheaded-block-72 of spec.md under the edit verb heading; behavior-format specification of the CLI verb. A22 mechanical compatibility consequence: the exact whole-shard legacy approval exemption is no longer available after the authorized A35 target edits in this shard. This row's source, target unit and ancestry are unchanged; independent ordinary conservation review is required with no assumed old approval.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: digests recomputed by extractor and independent hash and equal (text byte-equal), shard row equals pack, source and target anchors pass, ancestry Edit Verb equals the shard, rationale line range 1032-1056 and target anchor match the unit; text not re-read beyond byte equality",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "c36313e9a59bc69c1f04a65dc22c55bd72e374e693fd9f4351a3534d1ccf1493",
    "targetAncestry": [
      "Work State Specification",
      "9. Behaviors And Operations",
      "Edit Verb"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-005"
}
```

## Entry decisions-006

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-behaviors.json",
  "collection": "claims",
  "claimId": "claim_b96048ae94d1c4ef2735793bd5243751",
  "before": {
    "claimId": "claim_b96048ae94d1c4ef2735793bd5243751",
    "sourceUnitDigest": "8e520755293c85e5",
    "targetOwner": "docs/platform/work-state/spec.md",
    "targetAnchor": "unheaded-block-73",
    "claimKind": "specification",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "Body of the decision verb section (source lines 1060-1061) is carried byte-identical (checked line by line against the candidate block, no link rewrite) in unheaded-block-73 of spec.md under the decision verb heading; behavior-format specification of the CLI verb. A22 mechanical compatibility consequence: the exact whole-shard legacy approval exemption is no longer available after the authorized A35 target edits in this shard. This row's source, target unit and ancestry are unchanged; independent ordinary conservation review is required with no assumed old approval.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "8e520755293c85e501ebeaff9485524a4e8d098caff35958b5c52baf0069b406",
    "targetAncestry": [
      "Work State Specification",
      "9. Behaviors And Operations",
      "Decision Verb"
    ]
  },
  "after": {
    "claimId": "claim_b96048ae94d1c4ef2735793bd5243751",
    "sourceUnitDigest": "8e520755293c85e5",
    "targetOwner": "docs/platform/work-state/spec.md",
    "targetAnchor": "unheaded-block-73",
    "claimKind": "specification",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Body of the decision verb section (source lines 1060-1061) is carried byte-identical (checked line by line against the candidate block, no link rewrite) in unheaded-block-73 of spec.md under the decision verb heading; behavior-format specification of the CLI verb. A22 mechanical compatibility consequence: the exact whole-shard legacy approval exemption is no longer available after the authorized A35 target edits in this shard. This row's source, target unit and ancestry are unchanged; independent ordinary conservation review is required with no assumed old approval.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: digests recomputed by extractor and independent hash and equal (text byte-equal), shard row equals pack, source and target anchors pass, ancestry Decision Verb equals the shard, rationale line range 1060-1061 and target anchor match the unit; text not re-read beyond byte equality",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "8e520755293c85e501ebeaff9485524a4e8d098caff35958b5c52baf0069b406",
    "targetAncestry": [
      "Work State Specification",
      "9. Behaviors And Operations",
      "Decision Verb"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_b96048ae94d1c4ef2735793bd5243751",
    "sourceUnitDigest": "8e520755293c85e5",
    "targetOwner": "docs/platform/work-state/spec.md",
    "targetAnchor": "unheaded-block-73",
    "claimKind": "specification",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Body of the decision verb section (source lines 1060-1061) is carried byte-identical (checked line by line against the candidate block, no link rewrite) in unheaded-block-73 of spec.md under the decision verb heading; behavior-format specification of the CLI verb. A22 mechanical compatibility consequence: the exact whole-shard legacy approval exemption is no longer available after the authorized A35 target edits in this shard. This row's source, target unit and ancestry are unchanged; independent ordinary conservation review is required with no assumed old approval.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: digests recomputed by extractor and independent hash and equal (text byte-equal), shard row equals pack, source and target anchors pass, ancestry Decision Verb equals the shard, rationale line range 1060-1061 and target anchor match the unit; text not re-read beyond byte equality",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "8e520755293c85e501ebeaff9485524a4e8d098caff35958b5c52baf0069b406",
    "targetAncestry": [
      "Work State Specification",
      "9. Behaviors And Operations",
      "Decision Verb"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-006"
}
```

## Entry decisions-007

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-behaviors.json",
  "collection": "claims",
  "claimId": "claim_6542850539c0c00e6ec1f1fa5b31f6a5",
  "before": {
    "claimId": "claim_6542850539c0c00e6ec1f1fa5b31f6a5",
    "sourceUnitDigest": "3934104c59667221",
    "targetOwner": "docs/platform/work-state/spec.md",
    "targetAnchor": "unheaded-block-74",
    "claimKind": "specification",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "Body of the ask verb section (source lines 1065-1069) is carried byte-identical (checked line by line against the candidate block, no link rewrite) in unheaded-block-74 of spec.md under the ask verb heading; behavior-format specification of the CLI verb. A22 mechanical compatibility consequence: the exact whole-shard legacy approval exemption is no longer available after the authorized A35 target edits in this shard. This row's source, target unit and ancestry are unchanged; independent ordinary conservation review is required with no assumed old approval.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "3934104c59667221af37e30f52693b53c87032c9b95729315ceb9d18273f62bc",
    "targetAncestry": [
      "Work State Specification",
      "9. Behaviors And Operations",
      "Ask Verb"
    ]
  },
  "after": {
    "claimId": "claim_6542850539c0c00e6ec1f1fa5b31f6a5",
    "sourceUnitDigest": "3934104c59667221",
    "targetOwner": "docs/platform/work-state/spec.md",
    "targetAnchor": "unheaded-block-74",
    "claimKind": "specification",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Body of the ask verb section (source lines 1065-1069) is carried byte-identical (checked line by line against the candidate block, no link rewrite) in unheaded-block-74 of spec.md under the ask verb heading; behavior-format specification of the CLI verb. A22 mechanical compatibility consequence: the exact whole-shard legacy approval exemption is no longer available after the authorized A35 target edits in this shard. This row's source, target unit and ancestry are unchanged; independent ordinary conservation review is required with no assumed old approval.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: work-state.md#unheaded-block-87 (L1065-1069) to work-state/spec.md#unheaded-block-74 (L915-919): text byte-equal (read both ends, 719 chars), digests recomputed by extractor and by independent hash, anchor passes, ancestry Ask Verb equals the shard; rationale line range, anchor and opening words match the unit",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "3934104c59667221af37e30f52693b53c87032c9b95729315ceb9d18273f62bc",
    "targetAncestry": [
      "Work State Specification",
      "9. Behaviors And Operations",
      "Ask Verb"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_6542850539c0c00e6ec1f1fa5b31f6a5",
    "sourceUnitDigest": "3934104c59667221",
    "targetOwner": "docs/platform/work-state/spec.md",
    "targetAnchor": "unheaded-block-74",
    "claimKind": "specification",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Body of the ask verb section (source lines 1065-1069) is carried byte-identical (checked line by line against the candidate block, no link rewrite) in unheaded-block-74 of spec.md under the ask verb heading; behavior-format specification of the CLI verb. A22 mechanical compatibility consequence: the exact whole-shard legacy approval exemption is no longer available after the authorized A35 target edits in this shard. This row's source, target unit and ancestry are unchanged; independent ordinary conservation review is required with no assumed old approval.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: work-state.md#unheaded-block-87 (L1065-1069) to work-state/spec.md#unheaded-block-74 (L915-919): text byte-equal (read both ends, 719 chars), digests recomputed by extractor and by independent hash, anchor passes, ancestry Ask Verb equals the shard; rationale line range, anchor and opening words match the unit",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "3934104c59667221af37e30f52693b53c87032c9b95729315ceb9d18273f62bc",
    "targetAncestry": [
      "Work State Specification",
      "9. Behaviors And Operations",
      "Ask Verb"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-007"
}
```

## Entry decisions-008

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-behaviors.json",
  "collection": "claims",
  "claimId": "claim_80498f2c23623a2165e2fe2bf39af2d8",
  "before": {
    "claimId": "claim_80498f2c23623a2165e2fe2bf39af2d8",
    "sourceUnitDigest": "def08282f651f17f",
    "targetOwner": "docs/platform/work-state/spec.md",
    "targetAnchor": "unheaded-block-76",
    "claimKind": "specification",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "Body of the outcome verb section (source lines 1081-1085) is carried byte-identical (checked line by line against the candidate block, no link rewrite) in unheaded-block-76 of spec.md under the outcome verb heading; behavior-format specification of the CLI verb. A22 mechanical compatibility consequence: the exact whole-shard legacy approval exemption is no longer available after the authorized A35 target edits in this shard. This row's source, target unit and ancestry are unchanged; independent ordinary conservation review is required with no assumed old approval.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "def08282f651f17f0d259f239b2ad9cc3d9e3b8dfeb3299cac39036dfcba7b93",
    "targetAncestry": [
      "Work State Specification",
      "9. Behaviors And Operations",
      "Outcome Recording"
    ]
  },
  "after": {
    "claimId": "claim_80498f2c23623a2165e2fe2bf39af2d8",
    "sourceUnitDigest": "def08282f651f17f",
    "targetOwner": "docs/platform/work-state/spec.md",
    "targetAnchor": "unheaded-block-76",
    "claimKind": "specification",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Body of the outcome verb section (source lines 1081-1085) is carried byte-identical (checked line by line against the candidate block, no link rewrite) in unheaded-block-76 of spec.md under the outcome verb heading; behavior-format specification of the CLI verb. A22 mechanical compatibility consequence: the exact whole-shard legacy approval exemption is no longer available after the authorized A35 target edits in this shard. This row's source, target unit and ancestry are unchanged; independent ordinary conservation review is required with no assumed old approval.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: digests recomputed by extractor and independent hash and equal (text byte-equal), shard row equals pack, source and target anchors pass, ancestry Outcome Recording equals the shard, rationale line range 1081-1085 and target anchor match the unit; text not re-read beyond byte equality",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "def08282f651f17f0d259f239b2ad9cc3d9e3b8dfeb3299cac39036dfcba7b93",
    "targetAncestry": [
      "Work State Specification",
      "9. Behaviors And Operations",
      "Outcome Recording"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_80498f2c23623a2165e2fe2bf39af2d8",
    "sourceUnitDigest": "def08282f651f17f",
    "targetOwner": "docs/platform/work-state/spec.md",
    "targetAnchor": "unheaded-block-76",
    "claimKind": "specification",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Body of the outcome verb section (source lines 1081-1085) is carried byte-identical (checked line by line against the candidate block, no link rewrite) in unheaded-block-76 of spec.md under the outcome verb heading; behavior-format specification of the CLI verb. A22 mechanical compatibility consequence: the exact whole-shard legacy approval exemption is no longer available after the authorized A35 target edits in this shard. This row's source, target unit and ancestry are unchanged; independent ordinary conservation review is required with no assumed old approval.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: digests recomputed by extractor and independent hash and equal (text byte-equal), shard row equals pack, source and target anchors pass, ancestry Outcome Recording equals the shard, rationale line range 1081-1085 and target anchor match the unit; text not re-read beyond byte equality",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "def08282f651f17f0d259f239b2ad9cc3d9e3b8dfeb3299cac39036dfcba7b93",
    "targetAncestry": [
      "Work State Specification",
      "9. Behaviors And Operations",
      "Outcome Recording"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-008"
}
```

## Entry decisions-009

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-behaviors.json",
  "collection": "claims",
  "claimId": "claim_4d0a469da5aa54fe21e1f0ba954dee18",
  "before": {
    "claimId": "claim_4d0a469da5aa54fe21e1f0ba954dee18",
    "sourceUnitDigest": "4a561ae476fb9a96",
    "targetOwner": "docs/platform/work-state/spec.md",
    "targetAnchor": "unheaded-block-77",
    "claimKind": "specification",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "Body of the check verb section (source lines 1089-1092) is carried byte-identical (checked line by line against the candidate block, no link rewrite) in unheaded-block-77 of spec.md under the check verb heading; behavior-format specification of the CLI verb. A22 mechanical compatibility consequence: the exact whole-shard legacy approval exemption is no longer available after the authorized A35 target edits in this shard. This row's source, target unit and ancestry are unchanged; independent ordinary conservation review is required with no assumed old approval.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "4a561ae476fb9a96d25fdd9172c3a452704f5ecedc7c131b71b85b6a5883d20d",
    "targetAncestry": [
      "Work State Specification",
      "9. Behaviors And Operations",
      "Check Verb"
    ]
  },
  "after": {
    "claimId": "claim_4d0a469da5aa54fe21e1f0ba954dee18",
    "sourceUnitDigest": "4a561ae476fb9a96",
    "targetOwner": "docs/platform/work-state/spec.md",
    "targetAnchor": "unheaded-block-77",
    "claimKind": "specification",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Body of the check verb section (source lines 1089-1092) is carried byte-identical (checked line by line against the candidate block, no link rewrite) in unheaded-block-77 of spec.md under the check verb heading; behavior-format specification of the CLI verb. A22 mechanical compatibility consequence: the exact whole-shard legacy approval exemption is no longer available after the authorized A35 target edits in this shard. This row's source, target unit and ancestry are unchanged; independent ordinary conservation review is required with no assumed old approval.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: digests recomputed by extractor and independent hash and equal (text byte-equal), shard row equals pack, source and target anchors pass, ancestry Check Verb equals the shard, rationale line range 1089-1092 and target anchor match the unit; text not re-read beyond byte equality",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "4a561ae476fb9a96d25fdd9172c3a452704f5ecedc7c131b71b85b6a5883d20d",
    "targetAncestry": [
      "Work State Specification",
      "9. Behaviors And Operations",
      "Check Verb"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_4d0a469da5aa54fe21e1f0ba954dee18",
    "sourceUnitDigest": "4a561ae476fb9a96",
    "targetOwner": "docs/platform/work-state/spec.md",
    "targetAnchor": "unheaded-block-77",
    "claimKind": "specification",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Body of the check verb section (source lines 1089-1092) is carried byte-identical (checked line by line against the candidate block, no link rewrite) in unheaded-block-77 of spec.md under the check verb heading; behavior-format specification of the CLI verb. A22 mechanical compatibility consequence: the exact whole-shard legacy approval exemption is no longer available after the authorized A35 target edits in this shard. This row's source, target unit and ancestry are unchanged; independent ordinary conservation review is required with no assumed old approval.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: digests recomputed by extractor and independent hash and equal (text byte-equal), shard row equals pack, source and target anchors pass, ancestry Check Verb equals the shard, rationale line range 1089-1092 and target anchor match the unit; text not re-read beyond byte equality",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "4a561ae476fb9a96d25fdd9172c3a452704f5ecedc7c131b71b85b6a5883d20d",
    "targetAncestry": [
      "Work State Specification",
      "9. Behaviors And Operations",
      "Check Verb"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-009"
}
```

## Entry decisions-010

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-behaviors.json",
  "collection": "claims",
  "claimId": "claim_39cbc86a2ed322069e28cf4ed8efdbfd",
  "before": {
    "claimId": "claim_39cbc86a2ed322069e28cf4ed8efdbfd",
    "sourceUnitDigest": "fc9cf98c574c23b2",
    "targetOwner": "docs/platform/work-state/spec.md",
    "targetAnchor": "unheaded-block-78",
    "claimKind": "specification",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "Body of the docs-index verb section (source lines 1096-1099) is carried byte-identical (checked line by line against the candidate block, no link rewrite) in unheaded-block-78 of spec.md under the docs-index verb heading; behavior-format specification of the CLI verb. A22 mechanical compatibility consequence: the exact whole-shard legacy approval exemption is no longer available after the authorized A35 target edits in this shard. This row's source, target unit and ancestry are unchanged; independent ordinary conservation review is required with no assumed old approval.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "fc9cf98c574c23b2d1cadd3b9c0c73dd84c2bfee51494ced1f60fa2a3cac637b",
    "targetAncestry": [
      "Work State Specification",
      "9. Behaviors And Operations",
      "Docs Index Verb"
    ]
  },
  "after": {
    "claimId": "claim_39cbc86a2ed322069e28cf4ed8efdbfd",
    "sourceUnitDigest": "fc9cf98c574c23b2",
    "targetOwner": "docs/platform/work-state/spec.md",
    "targetAnchor": "unheaded-block-78",
    "claimKind": "specification",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Body of the docs-index verb section (source lines 1096-1099) is carried byte-identical (checked line by line against the candidate block, no link rewrite) in unheaded-block-78 of spec.md under the docs-index verb heading; behavior-format specification of the CLI verb. A22 mechanical compatibility consequence: the exact whole-shard legacy approval exemption is no longer available after the authorized A35 target edits in this shard. This row's source, target unit and ancestry are unchanged; independent ordinary conservation review is required with no assumed old approval.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: digests recomputed by extractor and independent hash and equal (text byte-equal), shard row equals pack, source and target anchors pass, ancestry Docs Index Verb equals the shard, rationale line range 1096-1099 and target anchor match the unit; text not re-read beyond byte equality",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "fc9cf98c574c23b2d1cadd3b9c0c73dd84c2bfee51494ced1f60fa2a3cac637b",
    "targetAncestry": [
      "Work State Specification",
      "9. Behaviors And Operations",
      "Docs Index Verb"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_39cbc86a2ed322069e28cf4ed8efdbfd",
    "sourceUnitDigest": "fc9cf98c574c23b2",
    "targetOwner": "docs/platform/work-state/spec.md",
    "targetAnchor": "unheaded-block-78",
    "claimKind": "specification",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Body of the docs-index verb section (source lines 1096-1099) is carried byte-identical (checked line by line against the candidate block, no link rewrite) in unheaded-block-78 of spec.md under the docs-index verb heading; behavior-format specification of the CLI verb. A22 mechanical compatibility consequence: the exact whole-shard legacy approval exemption is no longer available after the authorized A35 target edits in this shard. This row's source, target unit and ancestry are unchanged; independent ordinary conservation review is required with no assumed old approval.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: digests recomputed by extractor and independent hash and equal (text byte-equal), shard row equals pack, source and target anchors pass, ancestry Docs Index Verb equals the shard, rationale line range 1096-1099 and target anchor match the unit; text not re-read beyond byte equality",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "fc9cf98c574c23b2d1cadd3b9c0c73dd84c2bfee51494ced1f60fa2a3cac637b",
    "targetAncestry": [
      "Work State Specification",
      "9. Behaviors And Operations",
      "Docs Index Verb"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-010"
}
```

## Entry decisions-011

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-behaviors.json",
  "collection": "claims",
  "claimId": "claim_87f14f490b3dc3b8d34fba3dbf4a35f1",
  "before": {
    "claimId": "claim_87f14f490b3dc3b8d34fba3dbf4a35f1",
    "sourceUnitDigest": "8df771b9a95fb4b3",
    "targetOwner": "docs/platform/work-state/spec.md",
    "targetAnchor": "unheaded-block-79",
    "claimKind": "specification",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "Body of the rollup verb section (source lines 1103-1106) is carried byte-identical (checked line by line against the candidate block, no link rewrite) in unheaded-block-79 of spec.md under the rollup verb heading; behavior-format specification of the CLI verb. A22 mechanical compatibility consequence: the exact whole-shard legacy approval exemption is no longer available after the authorized A35 target edits in this shard. This row's source, target unit and ancestry are unchanged; independent ordinary conservation review is required with no assumed old approval.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "8df771b9a95fb4b30a9156cd5e9d7a356eb45b338bdbe27701e457bb31b93f2d",
    "targetAncestry": [
      "Work State Specification",
      "9. Behaviors And Operations",
      "Rollup Verb"
    ]
  },
  "after": {
    "claimId": "claim_87f14f490b3dc3b8d34fba3dbf4a35f1",
    "sourceUnitDigest": "8df771b9a95fb4b3",
    "targetOwner": "docs/platform/work-state/spec.md",
    "targetAnchor": "unheaded-block-79",
    "claimKind": "specification",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Body of the rollup verb section (source lines 1103-1106) is carried byte-identical (checked line by line against the candidate block, no link rewrite) in unheaded-block-79 of spec.md under the rollup verb heading; behavior-format specification of the CLI verb. A22 mechanical compatibility consequence: the exact whole-shard legacy approval exemption is no longer available after the authorized A35 target edits in this shard. This row's source, target unit and ancestry are unchanged; independent ordinary conservation review is required with no assumed old approval.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: digests recomputed by extractor and independent hash and equal (text byte-equal), shard row equals pack, source and target anchors pass, ancestry Rollup Verb equals the shard, rationale line range 1103-1106 and target anchor match the unit; text not re-read beyond byte equality",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "8df771b9a95fb4b30a9156cd5e9d7a356eb45b338bdbe27701e457bb31b93f2d",
    "targetAncestry": [
      "Work State Specification",
      "9. Behaviors And Operations",
      "Rollup Verb"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_87f14f490b3dc3b8d34fba3dbf4a35f1",
    "sourceUnitDigest": "8df771b9a95fb4b3",
    "targetOwner": "docs/platform/work-state/spec.md",
    "targetAnchor": "unheaded-block-79",
    "claimKind": "specification",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Body of the rollup verb section (source lines 1103-1106) is carried byte-identical (checked line by line against the candidate block, no link rewrite) in unheaded-block-79 of spec.md under the rollup verb heading; behavior-format specification of the CLI verb. A22 mechanical compatibility consequence: the exact whole-shard legacy approval exemption is no longer available after the authorized A35 target edits in this shard. This row's source, target unit and ancestry are unchanged; independent ordinary conservation review is required with no assumed old approval.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: digests recomputed by extractor and independent hash and equal (text byte-equal), shard row equals pack, source and target anchors pass, ancestry Rollup Verb equals the shard, rationale line range 1103-1106 and target anchor match the unit; text not re-read beyond byte equality",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "8df771b9a95fb4b30a9156cd5e9d7a356eb45b338bdbe27701e457bb31b93f2d",
    "targetAncestry": [
      "Work State Specification",
      "9. Behaviors And Operations",
      "Rollup Verb"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-011"
}
```

## Entry decisions-012

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-behaviors.json",
  "collection": "claims",
  "claimId": "claim_49246718fefa63a9fa016017a2072f1e",
  "before": {
    "claimId": "claim_49246718fefa63a9fa016017a2072f1e",
    "sourceUnitDigest": "595c67ae94bc2fe4",
    "targetOwner": "docs/platform/work-state/spec.md",
    "targetAnchor": "unheaded-block-80",
    "claimKind": "specification",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "Body of the triage verb section (source lines 1110-1113) is carried byte-identical (checked line by line against the candidate block, no link rewrite) in unheaded-block-80 of spec.md under the triage verb heading; behavior-format specification of the CLI verb. A22 mechanical compatibility consequence: the exact whole-shard legacy approval exemption is no longer available after the authorized A35 target edits in this shard. This row's source, target unit and ancestry are unchanged; independent ordinary conservation review is required with no assumed old approval.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "595c67ae94bc2fe4f46251ba6d6d35f16a9fbdb8fe0d09e92c87bfb810fb3070",
    "targetAncestry": [
      "Work State Specification",
      "9. Behaviors And Operations",
      "Triage Verb"
    ]
  },
  "after": {
    "claimId": "claim_49246718fefa63a9fa016017a2072f1e",
    "sourceUnitDigest": "595c67ae94bc2fe4",
    "targetOwner": "docs/platform/work-state/spec.md",
    "targetAnchor": "unheaded-block-80",
    "claimKind": "specification",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Body of the triage verb section (source lines 1110-1113) is carried byte-identical (checked line by line against the candidate block, no link rewrite) in unheaded-block-80 of spec.md under the triage verb heading; behavior-format specification of the CLI verb. A22 mechanical compatibility consequence: the exact whole-shard legacy approval exemption is no longer available after the authorized A35 target edits in this shard. This row's source, target unit and ancestry are unchanged; independent ordinary conservation review is required with no assumed old approval.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: digests recomputed by extractor and independent hash and equal (text byte-equal), shard row equals pack, source and target anchors pass, ancestry Triage Verb equals the shard, rationale line range 1110-1113 and target anchor match the unit; text not re-read beyond byte equality",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "595c67ae94bc2fe4f46251ba6d6d35f16a9fbdb8fe0d09e92c87bfb810fb3070",
    "targetAncestry": [
      "Work State Specification",
      "9. Behaviors And Operations",
      "Triage Verb"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_49246718fefa63a9fa016017a2072f1e",
    "sourceUnitDigest": "595c67ae94bc2fe4",
    "targetOwner": "docs/platform/work-state/spec.md",
    "targetAnchor": "unheaded-block-80",
    "claimKind": "specification",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Body of the triage verb section (source lines 1110-1113) is carried byte-identical (checked line by line against the candidate block, no link rewrite) in unheaded-block-80 of spec.md under the triage verb heading; behavior-format specification of the CLI verb. A22 mechanical compatibility consequence: the exact whole-shard legacy approval exemption is no longer available after the authorized A35 target edits in this shard. This row's source, target unit and ancestry are unchanged; independent ordinary conservation review is required with no assumed old approval.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: digests recomputed by extractor and independent hash and equal (text byte-equal), shard row equals pack, source and target anchors pass, ancestry Triage Verb equals the shard, rationale line range 1110-1113 and target anchor match the unit; text not re-read beyond byte equality",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "595c67ae94bc2fe4f46251ba6d6d35f16a9fbdb8fe0d09e92c87bfb810fb3070",
    "targetAncestry": [
      "Work State Specification",
      "9. Behaviors And Operations",
      "Triage Verb"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-012"
}
```

## Entry decisions-013

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-behaviors.json",
  "collection": "claims",
  "claimId": "claim_2e4a2eebcc3ac6e8600590e0df9d3282",
  "before": {
    "claimId": "claim_2e4a2eebcc3ac6e8600590e0df9d3282",
    "sourceUnitDigest": "c353e48e7f6e9d09",
    "targetOwner": "docs/platform/work-state/spec.md",
    "targetAnchor": "unheaded-block-81",
    "claimKind": "specification",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "Body of the take verb section (source lines 1117-1121) is carried byte-identical (checked line by line against the candidate block, no link rewrite) in unheaded-block-81 of spec.md under the take verb heading; behavior-format specification of the CLI verb. A22 mechanical compatibility consequence: the exact whole-shard legacy approval exemption is no longer available after the authorized A35 target edits in this shard. This row's source, target unit and ancestry are unchanged; independent ordinary conservation review is required with no assumed old approval.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "c353e48e7f6e9d099ed7acc8db76b98bef4e8decacc1b68e6603f8fd009a58c5",
    "targetAncestry": [
      "Work State Specification",
      "9. Behaviors And Operations",
      "Take Verb"
    ]
  },
  "after": {
    "claimId": "claim_2e4a2eebcc3ac6e8600590e0df9d3282",
    "sourceUnitDigest": "c353e48e7f6e9d09",
    "targetOwner": "docs/platform/work-state/spec.md",
    "targetAnchor": "unheaded-block-81",
    "claimKind": "specification",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Body of the take verb section (source lines 1117-1121) is carried byte-identical (checked line by line against the candidate block, no link rewrite) in unheaded-block-81 of spec.md under the take verb heading; behavior-format specification of the CLI verb. A22 mechanical compatibility consequence: the exact whole-shard legacy approval exemption is no longer available after the authorized A35 target edits in this shard. This row's source, target unit and ancestry are unchanged; independent ordinary conservation review is required with no assumed old approval.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: work-state.md#unheaded-block-94 (L1117-1121) to work-state/spec.md#unheaded-block-81 (L967-971): text byte-equal (read both ends, 1390 chars), digests recomputed by extractor and by independent hash, anchor passes, ancestry Take Verb equals the shard; rationale line range, anchor and opening words match the unit",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "c353e48e7f6e9d099ed7acc8db76b98bef4e8decacc1b68e6603f8fd009a58c5",
    "targetAncestry": [
      "Work State Specification",
      "9. Behaviors And Operations",
      "Take Verb"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_2e4a2eebcc3ac6e8600590e0df9d3282",
    "sourceUnitDigest": "c353e48e7f6e9d09",
    "targetOwner": "docs/platform/work-state/spec.md",
    "targetAnchor": "unheaded-block-81",
    "claimKind": "specification",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Body of the take verb section (source lines 1117-1121) is carried byte-identical (checked line by line against the candidate block, no link rewrite) in unheaded-block-81 of spec.md under the take verb heading; behavior-format specification of the CLI verb. A22 mechanical compatibility consequence: the exact whole-shard legacy approval exemption is no longer available after the authorized A35 target edits in this shard. This row's source, target unit and ancestry are unchanged; independent ordinary conservation review is required with no assumed old approval.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: work-state.md#unheaded-block-94 (L1117-1121) to work-state/spec.md#unheaded-block-81 (L967-971): text byte-equal (read both ends, 1390 chars), digests recomputed by extractor and by independent hash, anchor passes, ancestry Take Verb equals the shard; rationale line range, anchor and opening words match the unit",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "c353e48e7f6e9d099ed7acc8db76b98bef4e8decacc1b68e6603f8fd009a58c5",
    "targetAncestry": [
      "Work State Specification",
      "9. Behaviors And Operations",
      "Take Verb"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-013"
}
```

## Entry decisions-014

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-behaviors.json",
  "collection": "claims",
  "claimId": "claim_39a6cc5306f849af650f26e27e473d2a",
  "before": {
    "claimId": "claim_39a6cc5306f849af650f26e27e473d2a",
    "sourceUnitDigest": "09be94379bedfc46",
    "targetOwner": "docs/platform/work-state/spec.md",
    "targetAnchor": "unheaded-block-82",
    "claimKind": "specification",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "Body of the pick verb section (source lines 1125-1129) is carried byte-identical (checked line by line against the candidate block, no link rewrite) in unheaded-block-82 of spec.md under the pick verb heading; behavior-format specification of the CLI verb. A22 mechanical compatibility consequence: the exact whole-shard legacy approval exemption is no longer available after the authorized A35 target edits in this shard. This row's source, target unit and ancestry are unchanged; independent ordinary conservation review is required with no assumed old approval.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "09be94379bedfc46f88f54503e52daa53a53e96f472cd8035e80db873e923ffe",
    "targetAncestry": [
      "Work State Specification",
      "9. Behaviors And Operations",
      "Pick Verb"
    ]
  },
  "after": {
    "claimId": "claim_39a6cc5306f849af650f26e27e473d2a",
    "sourceUnitDigest": "09be94379bedfc46",
    "targetOwner": "docs/platform/work-state/spec.md",
    "targetAnchor": "unheaded-block-82",
    "claimKind": "specification",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Body of the pick verb section (source lines 1125-1129) is carried byte-identical (checked line by line against the candidate block, no link rewrite) in unheaded-block-82 of spec.md under the pick verb heading; behavior-format specification of the CLI verb. A22 mechanical compatibility consequence: the exact whole-shard legacy approval exemption is no longer available after the authorized A35 target edits in this shard. This row's source, target unit and ancestry are unchanged; independent ordinary conservation review is required with no assumed old approval.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: work-state.md#unheaded-block-95 (L1125-1129) to work-state/spec.md#unheaded-block-82 (L975-979): text byte-equal (read both ends, 1896 chars), digests recomputed by extractor and by independent hash, anchor passes, ancestry Pick Verb equals the shard; rationale line range, anchor and opening words match the unit",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "09be94379bedfc46f88f54503e52daa53a53e96f472cd8035e80db873e923ffe",
    "targetAncestry": [
      "Work State Specification",
      "9. Behaviors And Operations",
      "Pick Verb"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_39a6cc5306f849af650f26e27e473d2a",
    "sourceUnitDigest": "09be94379bedfc46",
    "targetOwner": "docs/platform/work-state/spec.md",
    "targetAnchor": "unheaded-block-82",
    "claimKind": "specification",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Body of the pick verb section (source lines 1125-1129) is carried byte-identical (checked line by line against the candidate block, no link rewrite) in unheaded-block-82 of spec.md under the pick verb heading; behavior-format specification of the CLI verb. A22 mechanical compatibility consequence: the exact whole-shard legacy approval exemption is no longer available after the authorized A35 target edits in this shard. This row's source, target unit and ancestry are unchanged; independent ordinary conservation review is required with no assumed old approval.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: work-state.md#unheaded-block-95 (L1125-1129) to work-state/spec.md#unheaded-block-82 (L975-979): text byte-equal (read both ends, 1896 chars), digests recomputed by extractor and by independent hash, anchor passes, ancestry Pick Verb equals the shard; rationale line range, anchor and opening words match the unit",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "09be94379bedfc46f88f54503e52daa53a53e96f472cd8035e80db873e923ffe",
    "targetAncestry": [
      "Work State Specification",
      "9. Behaviors And Operations",
      "Pick Verb"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-014"
}
```

## Entry decisions-015

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-behaviors.json",
  "collection": "claims",
  "claimId": "claim_6cfb40f6b0796d53b8fa927a862e67ce",
  "before": {
    "claimId": "claim_6cfb40f6b0796d53b8fa927a862e67ce",
    "sourceUnitDigest": "b2eaf8daf7008b99",
    "targetOwner": "docs/platform/work-state/spec.md",
    "targetAnchor": "unheaded-block-83",
    "claimKind": "specification",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "Body of the return verb section (source lines 1133-1137) is carried byte-identical (checked line by line against the candidate block, no link rewrite) in unheaded-block-83 of spec.md under the return verb heading; behavior-format specification of the CLI verb. A22 mechanical compatibility consequence: the exact whole-shard legacy approval exemption is no longer available after the authorized A35 target edits in this shard. This row's source, target unit and ancestry are unchanged; independent ordinary conservation review is required with no assumed old approval.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "b2eaf8daf7008b991917f223318d5e1de57fe2575580c0847cbe688ff6397baf",
    "targetAncestry": [
      "Work State Specification",
      "9. Behaviors And Operations",
      "Return Verb"
    ]
  },
  "after": {
    "claimId": "claim_6cfb40f6b0796d53b8fa927a862e67ce",
    "sourceUnitDigest": "b2eaf8daf7008b99",
    "targetOwner": "docs/platform/work-state/spec.md",
    "targetAnchor": "unheaded-block-83",
    "claimKind": "specification",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Body of the return verb section (source lines 1133-1137) is carried byte-identical (checked line by line against the candidate block, no link rewrite) in unheaded-block-83 of spec.md under the return verb heading; behavior-format specification of the CLI verb. A22 mechanical compatibility consequence: the exact whole-shard legacy approval exemption is no longer available after the authorized A35 target edits in this shard. This row's source, target unit and ancestry are unchanged; independent ordinary conservation review is required with no assumed old approval.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: digests recomputed by extractor and independent hash and equal (text byte-equal), shard row equals pack, source and target anchors pass, ancestry Return Verb equals the shard, rationale line range 1133-1137 and target anchor match the unit; text not re-read beyond byte equality",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "b2eaf8daf7008b991917f223318d5e1de57fe2575580c0847cbe688ff6397baf",
    "targetAncestry": [
      "Work State Specification",
      "9. Behaviors And Operations",
      "Return Verb"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_6cfb40f6b0796d53b8fa927a862e67ce",
    "sourceUnitDigest": "b2eaf8daf7008b99",
    "targetOwner": "docs/platform/work-state/spec.md",
    "targetAnchor": "unheaded-block-83",
    "claimKind": "specification",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Body of the return verb section (source lines 1133-1137) is carried byte-identical (checked line by line against the candidate block, no link rewrite) in unheaded-block-83 of spec.md under the return verb heading; behavior-format specification of the CLI verb. A22 mechanical compatibility consequence: the exact whole-shard legacy approval exemption is no longer available after the authorized A35 target edits in this shard. This row's source, target unit and ancestry are unchanged; independent ordinary conservation review is required with no assumed old approval.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: digests recomputed by extractor and independent hash and equal (text byte-equal), shard row equals pack, source and target anchors pass, ancestry Return Verb equals the shard, rationale line range 1133-1137 and target anchor match the unit; text not re-read beyond byte equality",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "b2eaf8daf7008b991917f223318d5e1de57fe2575580c0847cbe688ff6397baf",
    "targetAncestry": [
      "Work State Specification",
      "9. Behaviors And Operations",
      "Return Verb"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-015"
}
```

## Entry decisions-016

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-behaviors.json",
  "collection": "claims",
  "claimId": "claim_a80bb774c7d1a17e08befd309803e0a2",
  "before": {
    "claimId": "claim_a80bb774c7d1a17e08befd309803e0a2",
    "sourceUnitDigest": "3b409a02d049a208",
    "targetOwner": "docs/platform/work-state/spec.md",
    "targetAnchor": "unheaded-block-84",
    "claimKind": "specification",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "Body of the rebuild verb section (source lines 1141-1143) is carried byte-identical (checked line by line against the candidate block, no link rewrite) in unheaded-block-84 of spec.md under the rebuild verb heading; behavior-format specification of the CLI verb. A22 mechanical compatibility consequence: the exact whole-shard legacy approval exemption is no longer available after the authorized A35 target edits in this shard. This row's source, target unit and ancestry are unchanged; independent ordinary conservation review is required with no assumed old approval.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "3b409a02d049a208d8dd89ec1517d283d06682dcd37aa9ae30e9ebd3028db7e4",
    "targetAncestry": [
      "Work State Specification",
      "9. Behaviors And Operations",
      "Rebuild Verb"
    ]
  },
  "after": {
    "claimId": "claim_a80bb774c7d1a17e08befd309803e0a2",
    "sourceUnitDigest": "3b409a02d049a208",
    "targetOwner": "docs/platform/work-state/spec.md",
    "targetAnchor": "unheaded-block-84",
    "claimKind": "specification",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Body of the rebuild verb section (source lines 1141-1143) is carried byte-identical (checked line by line against the candidate block, no link rewrite) in unheaded-block-84 of spec.md under the rebuild verb heading; behavior-format specification of the CLI verb. A22 mechanical compatibility consequence: the exact whole-shard legacy approval exemption is no longer available after the authorized A35 target edits in this shard. This row's source, target unit and ancestry are unchanged; independent ordinary conservation review is required with no assumed old approval.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: digests recomputed by extractor and independent hash and equal (text byte-equal), shard row equals pack, source and target anchors pass, ancestry Rebuild Verb equals the shard, rationale line range 1141-1143 and target anchor match the unit; text not re-read beyond byte equality",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "3b409a02d049a208d8dd89ec1517d283d06682dcd37aa9ae30e9ebd3028db7e4",
    "targetAncestry": [
      "Work State Specification",
      "9. Behaviors And Operations",
      "Rebuild Verb"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_a80bb774c7d1a17e08befd309803e0a2",
    "sourceUnitDigest": "3b409a02d049a208",
    "targetOwner": "docs/platform/work-state/spec.md",
    "targetAnchor": "unheaded-block-84",
    "claimKind": "specification",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Body of the rebuild verb section (source lines 1141-1143) is carried byte-identical (checked line by line against the candidate block, no link rewrite) in unheaded-block-84 of spec.md under the rebuild verb heading; behavior-format specification of the CLI verb. A22 mechanical compatibility consequence: the exact whole-shard legacy approval exemption is no longer available after the authorized A35 target edits in this shard. This row's source, target unit and ancestry are unchanged; independent ordinary conservation review is required with no assumed old approval.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: digests recomputed by extractor and independent hash and equal (text byte-equal), shard row equals pack, source and target anchors pass, ancestry Rebuild Verb equals the shard, rationale line range 1141-1143 and target anchor match the unit; text not re-read beyond byte equality",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "3b409a02d049a208d8dd89ec1517d283d06682dcd37aa9ae30e9ebd3028db7e4",
    "targetAncestry": [
      "Work State Specification",
      "9. Behaviors And Operations",
      "Rebuild Verb"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-016"
}
```

## Entry decisions-017

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-behaviors.json",
  "collection": "claims",
  "claimId": "claim_0a1c2b6c0eabf83074bb042b962024d7",
  "before": {
    "claimId": "claim_0a1c2b6c0eabf83074bb042b962024d7",
    "sourceUnitDigest": "47f8d1203550fbf1",
    "targetOwner": "docs/platform/work-state/spec.md",
    "targetAnchor": "unheaded-block-85",
    "claimKind": "specification",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "Body of the list and ready verb section (source lines 1147-1149) is carried byte-identical (checked line by line against the candidate block, no link rewrite) in unheaded-block-85 of spec.md under the list and ready verb heading; behavior-format specification of the CLI verb. A22 mechanical compatibility consequence: the exact whole-shard legacy approval exemption is no longer available after the authorized A35 target edits in this shard. This row's source, target unit and ancestry are unchanged; independent ordinary conservation review is required with no assumed old approval.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "47f8d1203550fbf1cf157dc6f4b44f5dad48385f62994bb16a1834ad21e5b8a0",
    "targetAncestry": [
      "Work State Specification",
      "9. Behaviors And Operations",
      "List And Ready Verbs"
    ]
  },
  "after": {
    "claimId": "claim_0a1c2b6c0eabf83074bb042b962024d7",
    "sourceUnitDigest": "47f8d1203550fbf1",
    "targetOwner": "docs/platform/work-state/spec.md",
    "targetAnchor": "unheaded-block-85",
    "claimKind": "specification",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Body of the list and ready verb section (source lines 1147-1149) is carried byte-identical (checked line by line against the candidate block, no link rewrite) in unheaded-block-85 of spec.md under the list and ready verb heading; behavior-format specification of the CLI verb. A22 mechanical compatibility consequence: the exact whole-shard legacy approval exemption is no longer available after the authorized A35 target edits in this shard. This row's source, target unit and ancestry are unchanged; independent ordinary conservation review is required with no assumed old approval.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: digests recomputed by extractor and independent hash and equal (text byte-equal), shard row equals pack, source and target anchors pass, ancestry List And Ready Verbs equals the shard, rationale line range 1147-1149 and target anchor match the unit; text not re-read beyond byte equality",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "47f8d1203550fbf1cf157dc6f4b44f5dad48385f62994bb16a1834ad21e5b8a0",
    "targetAncestry": [
      "Work State Specification",
      "9. Behaviors And Operations",
      "List And Ready Verbs"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_0a1c2b6c0eabf83074bb042b962024d7",
    "sourceUnitDigest": "47f8d1203550fbf1",
    "targetOwner": "docs/platform/work-state/spec.md",
    "targetAnchor": "unheaded-block-85",
    "claimKind": "specification",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Body of the list and ready verb section (source lines 1147-1149) is carried byte-identical (checked line by line against the candidate block, no link rewrite) in unheaded-block-85 of spec.md under the list and ready verb heading; behavior-format specification of the CLI verb. A22 mechanical compatibility consequence: the exact whole-shard legacy approval exemption is no longer available after the authorized A35 target edits in this shard. This row's source, target unit and ancestry are unchanged; independent ordinary conservation review is required with no assumed old approval.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: digests recomputed by extractor and independent hash and equal (text byte-equal), shard row equals pack, source and target anchors pass, ancestry List And Ready Verbs equals the shard, rationale line range 1147-1149 and target anchor match the unit; text not re-read beyond byte equality",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "47f8d1203550fbf1cf157dc6f4b44f5dad48385f62994bb16a1834ad21e5b8a0",
    "targetAncestry": [
      "Work State Specification",
      "9. Behaviors And Operations",
      "List And Ready Verbs"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-017"
}
```

## Entry decisions-018

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-behaviors.json",
  "collection": "claims",
  "claimId": "claim_27804afda28daba4d5a2f2b2c5593294",
  "before": {
    "claimId": "claim_27804afda28daba4d5a2f2b2c5593294",
    "sourceUnitDigest": "6070f51f4128ebf3",
    "targetOwner": "docs/platform/work-state/spec.md",
    "targetAnchor": "unheaded-block-86",
    "claimKind": "specification",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "Body of the graph verb section (source lines 1153-1153) is carried byte-identical (checked line by line against the candidate block, no link rewrite) in unheaded-block-86 of spec.md under the graph verb heading; behavior-format specification of the CLI verb. A22 mechanical compatibility consequence: the exact whole-shard legacy approval exemption is no longer available after the authorized A35 target edits in this shard. This row's source, target unit and ancestry are unchanged; independent ordinary conservation review is required with no assumed old approval.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "6070f51f4128ebf3bdcc18334e1a4ecb281d516142e341777e411b91bb7eaf61",
    "targetAncestry": [
      "Work State Specification",
      "9. Behaviors And Operations",
      "Graph Verb"
    ]
  },
  "after": {
    "claimId": "claim_27804afda28daba4d5a2f2b2c5593294",
    "sourceUnitDigest": "6070f51f4128ebf3",
    "targetOwner": "docs/platform/work-state/spec.md",
    "targetAnchor": "unheaded-block-86",
    "claimKind": "specification",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Body of the graph verb section (source lines 1153-1153) is carried byte-identical (checked line by line against the candidate block, no link rewrite) in unheaded-block-86 of spec.md under the graph verb heading; behavior-format specification of the CLI verb. A22 mechanical compatibility consequence: the exact whole-shard legacy approval exemption is no longer available after the authorized A35 target edits in this shard. This row's source, target unit and ancestry are unchanged; independent ordinary conservation review is required with no assumed old approval.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: work-state.md#unheaded-block-99 (L1153-1153) to work-state/spec.md#unheaded-block-86 (L1003-1003): text byte-equal (read both ends, 437 chars), digests recomputed by extractor and by independent hash, anchor passes, ancestry Graph Verb equals the shard; rationale line range, anchor and opening words match the unit",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "6070f51f4128ebf3bdcc18334e1a4ecb281d516142e341777e411b91bb7eaf61",
    "targetAncestry": [
      "Work State Specification",
      "9. Behaviors And Operations",
      "Graph Verb"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_27804afda28daba4d5a2f2b2c5593294",
    "sourceUnitDigest": "6070f51f4128ebf3",
    "targetOwner": "docs/platform/work-state/spec.md",
    "targetAnchor": "unheaded-block-86",
    "claimKind": "specification",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Body of the graph verb section (source lines 1153-1153) is carried byte-identical (checked line by line against the candidate block, no link rewrite) in unheaded-block-86 of spec.md under the graph verb heading; behavior-format specification of the CLI verb. A22 mechanical compatibility consequence: the exact whole-shard legacy approval exemption is no longer available after the authorized A35 target edits in this shard. This row's source, target unit and ancestry are unchanged; independent ordinary conservation review is required with no assumed old approval.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: work-state.md#unheaded-block-99 (L1153-1153) to work-state/spec.md#unheaded-block-86 (L1003-1003): text byte-equal (read both ends, 437 chars), digests recomputed by extractor and by independent hash, anchor passes, ancestry Graph Verb equals the shard; rationale line range, anchor and opening words match the unit",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "6070f51f4128ebf3bdcc18334e1a4ecb281d516142e341777e411b91bb7eaf61",
    "targetAncestry": [
      "Work State Specification",
      "9. Behaviors And Operations",
      "Graph Verb"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-018"
}
```

## Entry decisions-019

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-behaviors.json",
  "collection": "claims",
  "claimId": "claim_82e5b138d21e606463ef458783510a14",
  "before": {
    "claimId": "claim_82e5b138d21e606463ef458783510a14",
    "sourceUnitDigest": "c1a962fe830292f7",
    "targetOwner": "docs/platform/work-state/spec.md",
    "targetAnchor": "unheaded-block-87",
    "claimKind": "specification",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "Body of the graph verb section (source lines 1155-1163) is carried byte-identical (checked line by line against the candidate block, no link rewrite) in unheaded-block-87 of spec.md under the graph verb heading; behavior-format specification of the CLI verb. A22 mechanical compatibility consequence: the exact whole-shard legacy approval exemption is no longer available after the authorized A35 target edits in this shard. This row's source, target unit and ancestry are unchanged; independent ordinary conservation review is required with no assumed old approval.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "c1a962fe830292f73a80e7dbca5e8d0cf0df5bcb2020de0dbda1439032d85c0c",
    "targetAncestry": [
      "Work State Specification",
      "9. Behaviors And Operations",
      "Graph Verb"
    ]
  },
  "after": {
    "claimId": "claim_82e5b138d21e606463ef458783510a14",
    "sourceUnitDigest": "c1a962fe830292f7",
    "targetOwner": "docs/platform/work-state/spec.md",
    "targetAnchor": "unheaded-block-87",
    "claimKind": "specification",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Body of the graph verb section (source lines 1155-1163) is carried byte-identical (checked line by line against the candidate block, no link rewrite) in unheaded-block-87 of spec.md under the graph verb heading; behavior-format specification of the CLI verb. A22 mechanical compatibility consequence: the exact whole-shard legacy approval exemption is no longer available after the authorized A35 target edits in this shard. This row's source, target unit and ancestry are unchanged; independent ordinary conservation review is required with no assumed old approval.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: work-state.md#unheaded-block-100 (L1155-1163) to work-state/spec.md#unheaded-block-87 (L1005-1013): text byte-equal (read both ends, 2136 chars), digests recomputed by extractor and by independent hash, anchor passes, ancestry Graph Verb equals the shard; rationale line range, anchor and opening words match the unit",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "c1a962fe830292f73a80e7dbca5e8d0cf0df5bcb2020de0dbda1439032d85c0c",
    "targetAncestry": [
      "Work State Specification",
      "9. Behaviors And Operations",
      "Graph Verb"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_82e5b138d21e606463ef458783510a14",
    "sourceUnitDigest": "c1a962fe830292f7",
    "targetOwner": "docs/platform/work-state/spec.md",
    "targetAnchor": "unheaded-block-87",
    "claimKind": "specification",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Body of the graph verb section (source lines 1155-1163) is carried byte-identical (checked line by line against the candidate block, no link rewrite) in unheaded-block-87 of spec.md under the graph verb heading; behavior-format specification of the CLI verb. A22 mechanical compatibility consequence: the exact whole-shard legacy approval exemption is no longer available after the authorized A35 target edits in this shard. This row's source, target unit and ancestry are unchanged; independent ordinary conservation review is required with no assumed old approval.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: work-state.md#unheaded-block-100 (L1155-1163) to work-state/spec.md#unheaded-block-87 (L1005-1013): text byte-equal (read both ends, 2136 chars), digests recomputed by extractor and by independent hash, anchor passes, ancestry Graph Verb equals the shard; rationale line range, anchor and opening words match the unit",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "c1a962fe830292f73a80e7dbca5e8d0cf0df5bcb2020de0dbda1439032d85c0c",
    "targetAncestry": [
      "Work State Specification",
      "9. Behaviors And Operations",
      "Graph Verb"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-019"
}
```

## Entry decisions-020

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-behaviors.json",
  "collection": "claims",
  "claimId": "claim_f9746ce25ba57acff13c1e5d7f159f07",
  "before": {
    "claimId": "claim_f9746ce25ba57acff13c1e5d7f159f07",
    "sourceUnitDigest": "31897e5272138032",
    "targetOwner": "docs/platform/work-state/spec.md",
    "targetAnchor": "unheaded-block-88",
    "claimKind": "specification",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "Body of the stale verb section (source lines 1167-1167) is carried byte-identical (checked line by line against the candidate block, no link rewrite) in unheaded-block-88 of spec.md under the stale verb heading; behavior-format specification of the CLI verb. A22 mechanical compatibility consequence: the exact whole-shard legacy approval exemption is no longer available after the authorized A35 target edits in this shard. This row's source, target unit and ancestry are unchanged; independent ordinary conservation review is required with no assumed old approval.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "31897e527213803203f7a7e3fb5b126986d4821eb4c374117f00acf81a38d218",
    "targetAncestry": [
      "Work State Specification",
      "9. Behaviors And Operations",
      "Stale Verb"
    ]
  },
  "after": {
    "claimId": "claim_f9746ce25ba57acff13c1e5d7f159f07",
    "sourceUnitDigest": "31897e5272138032",
    "targetOwner": "docs/platform/work-state/spec.md",
    "targetAnchor": "unheaded-block-88",
    "claimKind": "specification",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Body of the stale verb section (source lines 1167-1167) is carried byte-identical (checked line by line against the candidate block, no link rewrite) in unheaded-block-88 of spec.md under the stale verb heading; behavior-format specification of the CLI verb. A22 mechanical compatibility consequence: the exact whole-shard legacy approval exemption is no longer available after the authorized A35 target edits in this shard. This row's source, target unit and ancestry are unchanged; independent ordinary conservation review is required with no assumed old approval.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: digests recomputed by extractor and independent hash and equal (text byte-equal), shard row equals pack, source and target anchors pass, ancestry Stale Verb equals the shard, rationale line range 1167-1167 and target anchor match the unit; text not re-read beyond byte equality",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "31897e527213803203f7a7e3fb5b126986d4821eb4c374117f00acf81a38d218",
    "targetAncestry": [
      "Work State Specification",
      "9. Behaviors And Operations",
      "Stale Verb"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_f9746ce25ba57acff13c1e5d7f159f07",
    "sourceUnitDigest": "31897e5272138032",
    "targetOwner": "docs/platform/work-state/spec.md",
    "targetAnchor": "unheaded-block-88",
    "claimKind": "specification",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Body of the stale verb section (source lines 1167-1167) is carried byte-identical (checked line by line against the candidate block, no link rewrite) in unheaded-block-88 of spec.md under the stale verb heading; behavior-format specification of the CLI verb. A22 mechanical compatibility consequence: the exact whole-shard legacy approval exemption is no longer available after the authorized A35 target edits in this shard. This row's source, target unit and ancestry are unchanged; independent ordinary conservation review is required with no assumed old approval.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: digests recomputed by extractor and independent hash and equal (text byte-equal), shard row equals pack, source and target anchors pass, ancestry Stale Verb equals the shard, rationale line range 1167-1167 and target anchor match the unit; text not re-read beyond byte equality",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "31897e527213803203f7a7e3fb5b126986d4821eb4c374117f00acf81a38d218",
    "targetAncestry": [
      "Work State Specification",
      "9. Behaviors And Operations",
      "Stale Verb"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-020"
}
```

## Entry decisions-021

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-behaviors.json",
  "collection": "claims",
  "claimId": "claim_872c3173f1d52ab7503e3762dc83c091",
  "before": {
    "claimId": "claim_872c3173f1d52ab7503e3762dc83c091",
    "sourceUnitDigest": "6eb3dc776fa680fb",
    "targetOwner": "docs/platform/work-state/spec.md",
    "targetAnchor": "unheaded-block-89",
    "claimKind": "specification",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "Body of the stale verb section (source lines 1169-1171) is carried byte-identical (checked line by line against the candidate block, no link rewrite) in unheaded-block-89 of spec.md under the stale verb heading; behavior-format specification of the CLI verb. A22 mechanical compatibility consequence: the exact whole-shard legacy approval exemption is no longer available after the authorized A35 target edits in this shard. This row's source, target unit and ancestry are unchanged; independent ordinary conservation review is required with no assumed old approval.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "6eb3dc776fa680fbcd958d313c4a1a6a7362c13279a59bfaf074d7deb7d510d1",
    "targetAncestry": [
      "Work State Specification",
      "9. Behaviors And Operations",
      "Stale Verb"
    ]
  },
  "after": {
    "claimId": "claim_872c3173f1d52ab7503e3762dc83c091",
    "sourceUnitDigest": "6eb3dc776fa680fb",
    "targetOwner": "docs/platform/work-state/spec.md",
    "targetAnchor": "unheaded-block-89",
    "claimKind": "specification",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Body of the stale verb section (source lines 1169-1171) is carried byte-identical (checked line by line against the candidate block, no link rewrite) in unheaded-block-89 of spec.md under the stale verb heading; behavior-format specification of the CLI verb. A22 mechanical compatibility consequence: the exact whole-shard legacy approval exemption is no longer available after the authorized A35 target edits in this shard. This row's source, target unit and ancestry are unchanged; independent ordinary conservation review is required with no assumed old approval.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: digests recomputed by extractor and independent hash and equal (text byte-equal), shard row equals pack, source and target anchors pass, ancestry Stale Verb equals the shard, rationale line range 1169-1171 and target anchor match the unit; text not re-read beyond byte equality",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "6eb3dc776fa680fbcd958d313c4a1a6a7362c13279a59bfaf074d7deb7d510d1",
    "targetAncestry": [
      "Work State Specification",
      "9. Behaviors And Operations",
      "Stale Verb"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_872c3173f1d52ab7503e3762dc83c091",
    "sourceUnitDigest": "6eb3dc776fa680fb",
    "targetOwner": "docs/platform/work-state/spec.md",
    "targetAnchor": "unheaded-block-89",
    "claimKind": "specification",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Body of the stale verb section (source lines 1169-1171) is carried byte-identical (checked line by line against the candidate block, no link rewrite) in unheaded-block-89 of spec.md under the stale verb heading; behavior-format specification of the CLI verb. A22 mechanical compatibility consequence: the exact whole-shard legacy approval exemption is no longer available after the authorized A35 target edits in this shard. This row's source, target unit and ancestry are unchanged; independent ordinary conservation review is required with no assumed old approval.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: digests recomputed by extractor and independent hash and equal (text byte-equal), shard row equals pack, source and target anchors pass, ancestry Stale Verb equals the shard, rationale line range 1169-1171 and target anchor match the unit; text not re-read beyond byte equality",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "6eb3dc776fa680fbcd958d313c4a1a6a7362c13279a59bfaf074d7deb7d510d1",
    "targetAncestry": [
      "Work State Specification",
      "9. Behaviors And Operations",
      "Stale Verb"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-021"
}
```

## Entry decisions-022

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-behaviors.json",
  "collection": "claims",
  "claimId": "claim_90c314f669a8c8a6e06c8c114d5e8232",
  "before": {
    "claimId": "claim_90c314f669a8c8a6e06c8c114d5e8232",
    "sourceUnitDigest": "3694cfa1568e58a1",
    "targetOwner": "docs/platform/work-state/spec.md",
    "targetAnchor": "unheaded-block-90",
    "claimKind": "specification",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "Body of the conflicts verb section (source lines 1175-1175) is carried byte-identical (checked line by line against the candidate block, no link rewrite) in unheaded-block-90 of spec.md under the conflicts verb heading; behavior-format specification of the CLI verb. A22 mechanical compatibility consequence: the exact whole-shard legacy approval exemption is no longer available after the authorized A35 target edits in this shard. This row's source, target unit and ancestry are unchanged; independent ordinary conservation review is required with no assumed old approval.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "3694cfa1568e58a1b3fb4fa4e447f9cf23a953e2b2eb9dd8809a42c78c85204e",
    "targetAncestry": [
      "Work State Specification",
      "9. Behaviors And Operations",
      "Conflicts Verb"
    ]
  },
  "after": {
    "claimId": "claim_90c314f669a8c8a6e06c8c114d5e8232",
    "sourceUnitDigest": "3694cfa1568e58a1",
    "targetOwner": "docs/platform/work-state/spec.md",
    "targetAnchor": "unheaded-block-90",
    "claimKind": "specification",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Body of the conflicts verb section (source lines 1175-1175) is carried byte-identical (checked line by line against the candidate block, no link rewrite) in unheaded-block-90 of spec.md under the conflicts verb heading; behavior-format specification of the CLI verb. A22 mechanical compatibility consequence: the exact whole-shard legacy approval exemption is no longer available after the authorized A35 target edits in this shard. This row's source, target unit and ancestry are unchanged; independent ordinary conservation review is required with no assumed old approval.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: digests recomputed by extractor and independent hash and equal (text byte-equal), shard row equals pack, source and target anchors pass, ancestry Conflicts Verb equals the shard, rationale line range 1175-1175 and target anchor match the unit; text not re-read beyond byte equality",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "3694cfa1568e58a1b3fb4fa4e447f9cf23a953e2b2eb9dd8809a42c78c85204e",
    "targetAncestry": [
      "Work State Specification",
      "9. Behaviors And Operations",
      "Conflicts Verb"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_90c314f669a8c8a6e06c8c114d5e8232",
    "sourceUnitDigest": "3694cfa1568e58a1",
    "targetOwner": "docs/platform/work-state/spec.md",
    "targetAnchor": "unheaded-block-90",
    "claimKind": "specification",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Body of the conflicts verb section (source lines 1175-1175) is carried byte-identical (checked line by line against the candidate block, no link rewrite) in unheaded-block-90 of spec.md under the conflicts verb heading; behavior-format specification of the CLI verb. A22 mechanical compatibility consequence: the exact whole-shard legacy approval exemption is no longer available after the authorized A35 target edits in this shard. This row's source, target unit and ancestry are unchanged; independent ordinary conservation review is required with no assumed old approval.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: digests recomputed by extractor and independent hash and equal (text byte-equal), shard row equals pack, source and target anchors pass, ancestry Conflicts Verb equals the shard, rationale line range 1175-1175 and target anchor match the unit; text not re-read beyond byte equality",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "3694cfa1568e58a1b3fb4fa4e447f9cf23a953e2b2eb9dd8809a42c78c85204e",
    "targetAncestry": [
      "Work State Specification",
      "9. Behaviors And Operations",
      "Conflicts Verb"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-022"
}
```

## Entry decisions-023

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-data-dictionary.json",
  "collection": "claims",
  "claimId": "claim_ce947d10ed900598bde4df5b552e0265",
  "before": {
    "claimId": "claim_ce947d10ed900598bde4df5b552e0265",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "sourceUnitDigest": "c219ee825c3475e61bb642fd89e50efedc586df24b0252a6d99e58df63f419d8",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-34",
    "claimKind": "contract",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "rationale": "Supersede: the externalEffect sentence replaces the historical claim that only review and approve carry external effects with the fifteen-verb COMMAND_REGISTRY list, excluding coordination. The complete successor is now cli-io-contract.md#unheaded-block-34 after the installation-error insertion; reviewed prior successor text is unchanged. No claim of byte equality to the historical source or current-truth approval.",
    "targetUnitDigest": "0b3d8cfa5bd06f2dc735968a1297d8567d8f78a6257cf8aed0b0611067e870a2",
    "targetAncestry": [
      "CLI I/O Contract",
      "7. Machine-Readable Verb Registry",
      "Entry Fields And Effect Axes"
    ]
  },
  "after": {
    "claimId": "claim_ce947d10ed900598bde4df5b552e0265",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "sourceUnitDigest": "c219ee825c3475e61bb642fd89e50efedc586df24b0252a6d99e58df63f419d8",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-34",
    "claimKind": "contract",
    "disposition": "supersede",
    "reviewStatus": "reviewed",
    "rationale": "Supersede: the externalEffect sentence replaces the historical claim that only review and approve carry external effects with the fifteen-verb COMMAND_REGISTRY list, excluding coordination. The complete successor is now cli-io-contract.md#unheaded-block-34 after the installation-error insertion; reviewed prior successor text is unchanged. No claim of byte equality to the historical source or current-truth approval.",
    "reviewNote": "deep: docs/specs/work-state.md#unheaded-block-68 (L679-690) to docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-34 (L310-320): word diff shows exactly one clause replaced ('hôm nay chỉ review và approve mang externalEffect: true' becomes the COMMAND_REGISTRY list of 15 verbs without coordination, with review approve run as examples), everything else byte-equal; the rewritten rationale states that delta, names the successor anchor after the installation-error insertion and disclaims byte equality, which is what the previous round asked for; prior-round anchor fix (block 33 to 34) applied, digest recomputed equal",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "0b3d8cfa5bd06f2dc735968a1297d8567d8f78a6257cf8aed0b0611067e870a2",
    "targetAncestry": [
      "CLI I/O Contract",
      "7. Machine-Readable Verb Registry",
      "Entry Fields And Effect Axes"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_ce947d10ed900598bde4df5b552e0265",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "sourceUnitDigest": "c219ee825c3475e61bb642fd89e50efedc586df24b0252a6d99e58df63f419d8",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-34",
    "claimKind": "contract",
    "disposition": "supersede",
    "reviewStatus": "reviewed",
    "rationale": "Supersede: the externalEffect sentence replaces the historical claim that only review and approve carry external effects with the fifteen-verb COMMAND_REGISTRY list, excluding coordination. The complete successor is now cli-io-contract.md#unheaded-block-34 after the installation-error insertion; reviewed prior successor text is unchanged. No claim of byte equality to the historical source or current-truth approval.",
    "reviewNote": "deep: docs/specs/work-state.md#unheaded-block-68 (L679-690) to docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-34 (L310-320): word diff shows exactly one clause replaced ('hôm nay chỉ review và approve mang externalEffect: true' becomes the COMMAND_REGISTRY list of 15 verbs without coordination, with review approve run as examples), everything else byte-equal; the rewritten rationale states that delta, names the successor anchor after the installation-error insertion and disclaims byte equality, which is what the previous round asked for; prior-round anchor fix (block 33 to 34) applied, digest recomputed equal",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "0b3d8cfa5bd06f2dc735968a1297d8567d8f78a6257cf8aed0b0611067e870a2",
    "targetAncestry": [
      "CLI I/O Contract",
      "7. Machine-Readable Verb Registry",
      "Entry Fields And Effect Axes"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-023"
}
```

## Entry decisions-024

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "collection": "claims",
  "claimId": "claim_ae1f21106b52006a2ff377f9104a1fce",
  "before": {
    "claimId": "claim_ae1f21106b52006a2ff377f9104a1fce",
    "sourceUnitDigest": "0e00c9cccba1af1e",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "pending",
    "targetAnchor": "1-provenance-of-retired-decisions",
    "claimKind": "historical-context",
    "disposition": "promote",
    "rationale": "Source H2 stating where the retired records came from is represented by the frozen H2 \"1. Provenance Of Retired Decisions\"; only the heading title differs (numbered, English, no tsk id in the title). Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "260da5fd6eab8c113ea7e756985b782b5e45721aae8f34aab1e50389af0dff24",
    "targetAncestry": [
      "Retired Decision History: Work State"
    ]
  },
  "after": {
    "claimId": "claim_ae1f21106b52006a2ff377f9104a1fce",
    "sourceUnitDigest": "0e00c9cccba1af1e",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "1-provenance-of-retired-decisions",
    "claimKind": "historical-context",
    "disposition": "promote",
    "rationale": "Source H2 stating where the retired records came from is represented by the frozen H2 \"1. Provenance Of Retired Decisions\"; only the heading title differs (numbered, English, no tsk id in the title). Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading H2 'Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)' (work-state.md L1363) to H2 '1. Provenance Of Retired Decisions' (L23): title change only, section payload and following-block digests equal on both sides (both digests recomputed independently), target ancestry names ADR (provenance section) like the source position, the frozen-heading quote in the rationale equals the target heading",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "260da5fd6eab8c113ea7e756985b782b5e45721aae8f34aab1e50389af0dff24",
    "targetAncestry": [
      "Retired Decision History: Work State"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_ae1f21106b52006a2ff377f9104a1fce",
    "sourceUnitDigest": "0e00c9cccba1af1e",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "1-provenance-of-retired-decisions",
    "claimKind": "historical-context",
    "disposition": "promote",
    "rationale": "Source H2 stating where the retired records came from is represented by the frozen H2 \"1. Provenance Of Retired Decisions\"; only the heading title differs (numbered, English, no tsk id in the title). Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading H2 'Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)' (work-state.md L1363) to H2 '1. Provenance Of Retired Decisions' (L23): title change only, section payload and following-block digests equal on both sides (both digests recomputed independently), target ancestry names ADR (provenance section) like the source position, the frozen-heading quote in the rationale equals the target heading",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "260da5fd6eab8c113ea7e756985b782b5e45721aae8f34aab1e50389af0dff24",
    "targetAncestry": [
      "Retired Decision History: Work State"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-024"
}
```

## Entry decisions-025

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "collection": "claims",
  "claimId": "claim_192ebab9dbc6cec8b8957683e3ff8c82",
  "before": {
    "claimId": "claim_192ebab9dbc6cec8b8957683e3ff8c82",
    "sourceUnitDigest": "ac2b043c0d4f9fde",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "pending",
    "targetAnchor": "unheaded-block-2",
    "claimKind": "historical-context",
    "disposition": "promote",
    "rationale": "Relocation statement (ADRs moved verbatim from docs/decisions/, corpus retired) carried unchanged as the body of section 1; text identical to the source line. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "ac2b043c0d4f9fde1e7ecee60609cbe700480b9dd33105f98d30f6c6057ffb5c",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "1. Provenance Of Retired Decisions"
    ]
  },
  "after": {
    "claimId": "claim_192ebab9dbc6cec8b8957683e3ff8c82",
    "sourceUnitDigest": "ac2b043c0d4f9fde",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "unheaded-block-2",
    "claimKind": "historical-context",
    "disposition": "promote",
    "rationale": "Relocation statement (ADRs moved verbatim from docs/decisions/, corpus retired) carried unchanged as the body of section 1; text identical to the source line. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: digests recomputed by extractor and independent hash and equal (text byte-equal), shard row equals pack, source and target anchors pass, ancestry 1. Provenance Of Retired Decisions equals the shard, rationale line range 1365-1365 and target anchor match the unit; text not re-read beyond byte equality",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "ac2b043c0d4f9fde1e7ecee60609cbe700480b9dd33105f98d30f6c6057ffb5c",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "1. Provenance Of Retired Decisions"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_192ebab9dbc6cec8b8957683e3ff8c82",
    "sourceUnitDigest": "ac2b043c0d4f9fde",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "unheaded-block-2",
    "claimKind": "historical-context",
    "disposition": "promote",
    "rationale": "Relocation statement (ADRs moved verbatim from docs/decisions/, corpus retired) carried unchanged as the body of section 1; text identical to the source line. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: digests recomputed by extractor and independent hash and equal (text byte-equal), shard row equals pack, source and target anchors pass, ancestry 1. Provenance Of Retired Decisions equals the shard, rationale line range 1365-1365 and target anchor match the unit; text not re-read beyond byte equality",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "ac2b043c0d4f9fde1e7ecee60609cbe700480b9dd33105f98d30f6c6057ffb5c",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "1. Provenance Of Retired Decisions"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-025"
}
```

## Entry decisions-026

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "collection": "claims",
  "claimId": "claim_5412ac73c702e4ec33e4b59dd9ad1940",
  "before": {
    "claimId": "claim_5412ac73c702e4ec33e4b59dd9ad1940",
    "sourceUnitDigest": "cb78249b3b34c872",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "pending",
    "targetAnchor": "2-adr-0002-flat-work-model",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Source ADR 0002 title heading is represented by the frozen H2 \"2. ADR 0002 ...\" (2-adr-0002-flat-work-model); title is renumbered and re-worded in English, text of the record is unchanged. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "dfbfbdbf1e8717cabbe38306651ad15e816065313a7244b973a62ba4703a843d",
    "targetAncestry": [
      "Retired Decision History: Work State"
    ]
  },
  "after": {
    "claimId": "claim_5412ac73c702e4ec33e4b59dd9ad1940",
    "sourceUnitDigest": "cb78249b3b34c872",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "2-adr-0002-flat-work-model",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Source ADR 0002 title heading is represented by the frozen H2 \"2. ADR 0002 ...\" (2-adr-0002-flat-work-model); title is renumbered and re-worded in English, text of the record is unchanged. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: docs/specs/work-state.md#0002-mô-hình-việc-phẳng (H3, L1368) to retired-decision-history.md#2-adr-0002-flat-work-model (H2, L27): title renumbered and translated and depth H3 to H2 (permitted depth change, not named in the rationale); the section payload digest differs only because the blockquote link destination was rewritten, which claim_0201a1d6 (blockquote unit) discloses and I verified word by word; ADR 0002 ancestry matches; shared target with the merge row claim_f8e2b48d is the intended two-heading-to-one-heading merge; the quoted anchor and the abbreviated title with three dots match the target",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "dfbfbdbf1e8717cabbe38306651ad15e816065313a7244b973a62ba4703a843d",
    "targetAncestry": [
      "Retired Decision History: Work State"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_5412ac73c702e4ec33e4b59dd9ad1940",
    "sourceUnitDigest": "cb78249b3b34c872",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "2-adr-0002-flat-work-model",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Source ADR 0002 title heading is represented by the frozen H2 \"2. ADR 0002 ...\" (2-adr-0002-flat-work-model); title is renumbered and re-worded in English, text of the record is unchanged. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: docs/specs/work-state.md#0002-mô-hình-việc-phẳng (H3, L1368) to retired-decision-history.md#2-adr-0002-flat-work-model (H2, L27): title renumbered and translated and depth H3 to H2 (permitted depth change, not named in the rationale); the section payload digest differs only because the blockquote link destination was rewritten, which claim_0201a1d6 (blockquote unit) discloses and I verified word by word; ADR 0002 ancestry matches; shared target with the merge row claim_f8e2b48d is the intended two-heading-to-one-heading merge; the quoted anchor and the abbreviated title with three dots match the target",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "dfbfbdbf1e8717cabbe38306651ad15e816065313a7244b973a62ba4703a843d",
    "targetAncestry": [
      "Retired Decision History: Work State"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-026"
}
```

## Entry decisions-027

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "collection": "claims",
  "claimId": "claim_0201a1d648765d578fb8fd96673da674",
  "before": {
    "claimId": "claim_0201a1d648765d578fb8fd96673da674",
    "sourceUnitDigest": "75563525a8cefd7b",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "pending",
    "targetAnchor": "unheaded-block-3",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Supersession blockquote of ADR 0002 (partly superseded by 0012) carried in the ADR 0002 section; the only change is the link, rewritten from the retired 0012 file path to the in-document anchor #8-adr-0012-unified-typed-edge-graph-model. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "0a885e8073f37063ef015b0288f7517cdd829863ae4f866864cf1969ad3260dd",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "2. ADR 0002 Flat Work Model"
    ]
  },
  "after": {
    "claimId": "claim_0201a1d648765d578fb8fd96673da674",
    "sourceUnitDigest": "75563525a8cefd7b",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "unheaded-block-3",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Supersession blockquote of ADR 0002 (partly superseded by 0012) carried in the ADR 0002 section; the only change is the link, rewritten from the retired 0012 file path to the in-document anchor #8-adr-0012-unified-typed-edge-graph-model. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: docs/specs/work-state.md#unheaded-block-113 (L1370-1373) to retired-decision-history.md#unheaded-block-3 (L29-32): word diff shows one change, the 0012 link destination (0012-typed-edge-model-supersedes-deps-parent-separation.md becomes #8-adr-0012-unified-typed-edge-graph-model), exactly as the rationale says; that anchor exists in the target (anchor check run) and names ADR 0012's own heading; the four lines of quoted prose are otherwise byte-equal",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "0a885e8073f37063ef015b0288f7517cdd829863ae4f866864cf1969ad3260dd",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "2. ADR 0002 Flat Work Model"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_0201a1d648765d578fb8fd96673da674",
    "sourceUnitDigest": "75563525a8cefd7b",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "unheaded-block-3",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Supersession blockquote of ADR 0002 (partly superseded by 0012) carried in the ADR 0002 section; the only change is the link, rewritten from the retired 0012 file path to the in-document anchor #8-adr-0012-unified-typed-edge-graph-model. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: docs/specs/work-state.md#unheaded-block-113 (L1370-1373) to retired-decision-history.md#unheaded-block-3 (L29-32): word diff shows one change, the 0012 link destination (0012-typed-edge-model-supersedes-deps-parent-separation.md becomes #8-adr-0012-unified-typed-edge-graph-model), exactly as the rationale says; that anchor exists in the target (anchor check run) and names ADR 0012's own heading; the four lines of quoted prose are otherwise byte-equal",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "0a885e8073f37063ef015b0288f7517cdd829863ae4f866864cf1969ad3260dd",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "2. ADR 0002 Flat Work Model"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-027"
}
```

## Entry decisions-028

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "collection": "claims",
  "claimId": "claim_f8e2b48d6234ca8a73e15cdaad7d9c07",
  "before": {
    "claimId": "claim_f8e2b48d6234ca8a73e15cdaad7d9c07",
    "sourceUnitDigest": "a05e96aa58d47c2d",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "pending",
    "targetAnchor": "2-adr-0002-flat-work-model",
    "claimKind": "decision",
    "disposition": "merge",
    "rationale": "Repeated duplicate title \"# 0002 - Mo hinh viec phang\" inside the ADR 0002 text: merged into the single ADR 0002 H2 (no second H1 in the candidate), so no claim is lost but the heading itself does not appear twice. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "dfbfbdbf1e8717cabbe38306651ad15e816065313a7244b973a62ba4703a843d",
    "targetAncestry": [
      "Retired Decision History: Work State"
    ]
  },
  "after": {
    "claimId": "claim_f8e2b48d6234ca8a73e15cdaad7d9c07",
    "sourceUnitDigest": "a05e96aa58d47c2d",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "2-adr-0002-flat-work-model",
    "claimKind": "decision",
    "disposition": "merge",
    "rationale": "Repeated duplicate title \"# 0002 - Mo hinh viec phang\" inside the ADR 0002 text: merged into the single ADR 0002 H2 (no second H1 in the candidate), so no claim is lost but the heading itself does not appear twice. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: docs/specs/work-state.md#0002-mô-hình-việc-phẳng-1 (second H1 title, L1375, empty payload) merged into the single ADR 0002 H2 at L27: the source line is the same title text already carried by claim_5412ac73, so nothing is lost and the rationale's no-second-heading statement is true; the two rows share one target by design (promote plus merge); digests recomputed independently, anchor passes",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "dfbfbdbf1e8717cabbe38306651ad15e816065313a7244b973a62ba4703a843d",
    "targetAncestry": [
      "Retired Decision History: Work State"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_f8e2b48d6234ca8a73e15cdaad7d9c07",
    "sourceUnitDigest": "a05e96aa58d47c2d",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "2-adr-0002-flat-work-model",
    "claimKind": "decision",
    "disposition": "merge",
    "rationale": "Repeated duplicate title \"# 0002 - Mo hinh viec phang\" inside the ADR 0002 text: merged into the single ADR 0002 H2 (no second H1 in the candidate), so no claim is lost but the heading itself does not appear twice. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: docs/specs/work-state.md#0002-mô-hình-việc-phẳng-1 (second H1 title, L1375, empty payload) merged into the single ADR 0002 H2 at L27: the source line is the same title text already carried by claim_5412ac73, so nothing is lost and the rationale's no-second-heading statement is true; the two rows share one target by design (promote plus merge); digests recomputed independently, anchor passes",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "dfbfbdbf1e8717cabbe38306651ad15e816065313a7244b973a62ba4703a843d",
    "targetAncestry": [
      "Retired Decision History: Work State"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-028"
}
```

## Entry decisions-029

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "collection": "claims",
  "claimId": "claim_faeaa8e46158de47c45810fb0a595dcc",
  "before": {
    "claimId": "claim_faeaa8e46158de47c45810fb0a595dcc",
    "sourceUnitDigest": "f014a166cf0c8f3d",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "pending",
    "targetAnchor": "0002-context",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Section heading \"Bối cảnh\" of ADR 0002 is represented by the frozen H3 \"0002 Context\"; the title differs (prefixed with the ADR number, English) but the section it opens is the same. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "5cd2a9a136e3025d04ed41810213e2a9c383290b3eb3e863644e4af952612d3e",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "2. ADR 0002 Flat Work Model"
    ]
  },
  "after": {
    "claimId": "claim_faeaa8e46158de47c45810fb0a595dcc",
    "sourceUnitDigest": "f014a166cf0c8f3d",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "0002-context",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Section heading \"Bối cảnh\" of ADR 0002 is represented by the frozen H3 \"0002 Context\"; the title differs (prefixed with the ADR number, English) but the section it opens is the same. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading H4 'Bối cảnh' (work-state.md L1377) to H3 '0002 Context' (L34): title and depth change only, section payload and following-block digests equal on both sides (both digests recomputed independently), target ancestry names ADR 0002 like the source position, the frozen-heading quote in the rationale equals the target heading, depth H4 to H3 is a permitted depth-only change that the rationale does not name",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "5cd2a9a136e3025d04ed41810213e2a9c383290b3eb3e863644e4af952612d3e",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "2. ADR 0002 Flat Work Model"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_faeaa8e46158de47c45810fb0a595dcc",
    "sourceUnitDigest": "f014a166cf0c8f3d",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "0002-context",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Section heading \"Bối cảnh\" of ADR 0002 is represented by the frozen H3 \"0002 Context\"; the title differs (prefixed with the ADR number, English) but the section it opens is the same. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading H4 'Bối cảnh' (work-state.md L1377) to H3 '0002 Context' (L34): title and depth change only, section payload and following-block digests equal on both sides (both digests recomputed independently), target ancestry names ADR 0002 like the source position, the frozen-heading quote in the rationale equals the target heading, depth H4 to H3 is a permitted depth-only change that the rationale does not name",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "5cd2a9a136e3025d04ed41810213e2a9c383290b3eb3e863644e4af952612d3e",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "2. ADR 0002 Flat Work Model"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-029"
}
```

## Entry decisions-030

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "collection": "claims",
  "claimId": "claim_310b7c85756d5a5631a83fd5b6f51450",
  "before": {
    "claimId": "claim_310b7c85756d5a5631a83fd5b6f51450",
    "sourceUnitDigest": "2d791158021d4df9",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "pending",
    "targetAnchor": "unheaded-block-4",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0002 (source lines 1379-1382, starting \"forgent cần một mô hình dữ liệu cho công việc tự-quản, đồng thời mở đư\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "2d791158021d4df9eabbc0897dffa6df940c425a067c7e7edee5c200e9111594",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "2. ADR 0002 Flat Work Model",
      "0002 Context"
    ]
  },
  "after": {
    "claimId": "claim_310b7c85756d5a5631a83fd5b6f51450",
    "sourceUnitDigest": "2d791158021d4df9",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "unheaded-block-4",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0002 (source lines 1379-1382, starting \"forgent cần một mô hình dữ liệu cho công việc tự-quản, đồng thời mở đư\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: digests recomputed by extractor and independent hash and equal (text byte-equal), shard row equals pack, source and target anchors pass, ancestry 0002 Context equals the shard, rationale line range 1379-1382 and target anchor match the unit; text not re-read beyond byte equality",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "2d791158021d4df9eabbc0897dffa6df940c425a067c7e7edee5c200e9111594",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "2. ADR 0002 Flat Work Model",
      "0002 Context"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_310b7c85756d5a5631a83fd5b6f51450",
    "sourceUnitDigest": "2d791158021d4df9",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "unheaded-block-4",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0002 (source lines 1379-1382, starting \"forgent cần một mô hình dữ liệu cho công việc tự-quản, đồng thời mở đư\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: digests recomputed by extractor and independent hash and equal (text byte-equal), shard row equals pack, source and target anchors pass, ancestry 0002 Context equals the shard, rationale line range 1379-1382 and target anchor match the unit; text not re-read beyond byte equality",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "2d791158021d4df9eabbc0897dffa6df940c425a067c7e7edee5c200e9111594",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "2. ADR 0002 Flat Work Model",
      "0002 Context"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-030"
}
```

## Entry decisions-031

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "collection": "claims",
  "claimId": "claim_5b6cd72833b3ee7ea7a2862b4eadb328",
  "before": {
    "claimId": "claim_5b6cd72833b3ee7ea7a2862b4eadb328",
    "sourceUnitDigest": "d6043b1481fba899",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "pending",
    "targetAnchor": "0002-decision",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Section heading \"Quyết định\" of ADR 0002 is represented by the frozen H3 \"0002 Decision\"; the title differs (prefixed with the ADR number, English) but the section it opens is the same. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "6a7b90c72430f1cb8d04a666d3fa97514ec1f6ba3c24cf36641333a9745f4e19",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "2. ADR 0002 Flat Work Model"
    ]
  },
  "after": {
    "claimId": "claim_5b6cd72833b3ee7ea7a2862b4eadb328",
    "sourceUnitDigest": "d6043b1481fba899",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "0002-decision",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Section heading \"Quyết định\" of ADR 0002 is represented by the frozen H3 \"0002 Decision\"; the title differs (prefixed with the ADR number, English) but the section it opens is the same. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading H4 'Quyết định' (work-state.md L1384) to H3 '0002 Decision' (L41): title and depth change only, section payload and following-block digests equal on both sides (both digests recomputed independently), target ancestry names ADR 0002 like the source position, the frozen-heading quote in the rationale equals the target heading, depth H4 to H3 is a permitted depth-only change that the rationale does not name",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "6a7b90c72430f1cb8d04a666d3fa97514ec1f6ba3c24cf36641333a9745f4e19",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "2. ADR 0002 Flat Work Model"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_5b6cd72833b3ee7ea7a2862b4eadb328",
    "sourceUnitDigest": "d6043b1481fba899",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "0002-decision",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Section heading \"Quyết định\" of ADR 0002 is represented by the frozen H3 \"0002 Decision\"; the title differs (prefixed with the ADR number, English) but the section it opens is the same. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading H4 'Quyết định' (work-state.md L1384) to H3 '0002 Decision' (L41): title and depth change only, section payload and following-block digests equal on both sides (both digests recomputed independently), target ancestry names ADR 0002 like the source position, the frozen-heading quote in the rationale equals the target heading, depth H4 to H3 is a permitted depth-only change that the rationale does not name",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "6a7b90c72430f1cb8d04a666d3fa97514ec1f6ba3c24cf36641333a9745f4e19",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "2. ADR 0002 Flat Work Model"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-031"
}
```

## Entry decisions-032

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "collection": "claims",
  "claimId": "claim_6f1392a7f197c9824233896cf218bda9",
  "before": {
    "claimId": "claim_6f1392a7f197c9824233896cf218bda9",
    "sourceUnitDigest": "6d29bd7598817238",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "pending",
    "targetAnchor": "unheaded-block-5",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0002 (source lines 1386-1392, starting \"- **Một loại work item duy nhất, một FSM duy nhất.** Item trỏ **deps**\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "6d29bd75988172380cec9e3e8c6d38c00ca34fe475aec97c412f338cf6484ba4",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "2. ADR 0002 Flat Work Model",
      "0002 Decision"
    ]
  },
  "after": {
    "claimId": "claim_6f1392a7f197c9824233896cf218bda9",
    "sourceUnitDigest": "6d29bd7598817238",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "unheaded-block-5",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0002 (source lines 1386-1392, starting \"- **Một loại work item duy nhất, một FSM duy nhất.** Item trỏ **deps**\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: digests recomputed by extractor and independent hash and equal (text byte-equal), shard row equals pack, source and target anchors pass, ancestry 0002 Decision equals the shard, rationale line range 1386-1392 and target anchor match the unit; text not re-read beyond byte equality",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "6d29bd75988172380cec9e3e8c6d38c00ca34fe475aec97c412f338cf6484ba4",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "2. ADR 0002 Flat Work Model",
      "0002 Decision"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_6f1392a7f197c9824233896cf218bda9",
    "sourceUnitDigest": "6d29bd7598817238",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "unheaded-block-5",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0002 (source lines 1386-1392, starting \"- **Một loại work item duy nhất, một FSM duy nhất.** Item trỏ **deps**\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: digests recomputed by extractor and independent hash and equal (text byte-equal), shard row equals pack, source and target anchors pass, ancestry 0002 Decision equals the shard, rationale line range 1386-1392 and target anchor match the unit; text not re-read beyond byte equality",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "6d29bd75988172380cec9e3e8c6d38c00ca34fe475aec97c412f338cf6484ba4",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "2. ADR 0002 Flat Work Model",
      "0002 Decision"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-032"
}
```

## Entry decisions-033

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "collection": "claims",
  "claimId": "claim_e8b18c86c4297b05e04a14793817bf6a",
  "before": {
    "claimId": "claim_e8b18c86c4297b05e04a14793817bf6a",
    "sourceUnitDigest": "e91bbb5ae8fcb8f8",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "pending",
    "targetAnchor": "0002-consequences",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Section heading \"Hệ quả\" of ADR 0002 is represented by the frozen H3 \"0002 Consequences\"; the title differs (prefixed with the ADR number, English) but the section it opens is the same. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "fc62699538350fccc923e8874a342f8d5e5f5582ae09db366066bf776b60ef7a",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "2. ADR 0002 Flat Work Model"
    ]
  },
  "after": {
    "claimId": "claim_e8b18c86c4297b05e04a14793817bf6a",
    "sourceUnitDigest": "e91bbb5ae8fcb8f8",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "0002-consequences",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Section heading \"Hệ quả\" of ADR 0002 is represented by the frozen H3 \"0002 Consequences\"; the title differs (prefixed with the ADR number, English) but the section it opens is the same. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading H4 'Hệ quả' (work-state.md L1394) to H3 '0002 Consequences' (L51): title and depth change only, section payload and following-block digests equal on both sides (both digests recomputed independently), target ancestry names ADR 0002 like the source position, the frozen-heading quote in the rationale equals the target heading, depth H4 to H3 is a permitted depth-only change that the rationale does not name",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "fc62699538350fccc923e8874a342f8d5e5f5582ae09db366066bf776b60ef7a",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "2. ADR 0002 Flat Work Model"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_e8b18c86c4297b05e04a14793817bf6a",
    "sourceUnitDigest": "e91bbb5ae8fcb8f8",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "0002-consequences",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Section heading \"Hệ quả\" of ADR 0002 is represented by the frozen H3 \"0002 Consequences\"; the title differs (prefixed with the ADR number, English) but the section it opens is the same. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading H4 'Hệ quả' (work-state.md L1394) to H3 '0002 Consequences' (L51): title and depth change only, section payload and following-block digests equal on both sides (both digests recomputed independently), target ancestry names ADR 0002 like the source position, the frozen-heading quote in the rationale equals the target heading, depth H4 to H3 is a permitted depth-only change that the rationale does not name",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "fc62699538350fccc923e8874a342f8d5e5f5582ae09db366066bf776b60ef7a",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "2. ADR 0002 Flat Work Model"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-033"
}
```

## Entry decisions-034

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "collection": "claims",
  "claimId": "claim_6bf5e5b90a15803e49010737491afdb9",
  "before": {
    "claimId": "claim_6bf5e5b90a15803e49010737491afdb9",
    "sourceUnitDigest": "a45346dbf45eca84",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "pending",
    "targetAnchor": "unheaded-block-6",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0002 (source lines 1396-1401, starting \"- **Fan-out đa-agent xuyên câu chuyện tự nhiên:** frontier gom mọi việ\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "a45346dbf45eca841ecf385d6a2d1444175f264ec2bdf3a261f038abc7a84e90",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "2. ADR 0002 Flat Work Model",
      "0002 Consequences"
    ]
  },
  "after": {
    "claimId": "claim_6bf5e5b90a15803e49010737491afdb9",
    "sourceUnitDigest": "a45346dbf45eca84",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "unheaded-block-6",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0002 (source lines 1396-1401, starting \"- **Fan-out đa-agent xuyên câu chuyện tự nhiên:** frontier gom mọi việ\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: digests recomputed by extractor and independent hash and equal (text byte-equal), shard row equals pack, source and target anchors pass, ancestry 0002 Consequences equals the shard, rationale line range 1396-1401 and target anchor match the unit; text not re-read beyond byte equality",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "a45346dbf45eca841ecf385d6a2d1444175f264ec2bdf3a261f038abc7a84e90",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "2. ADR 0002 Flat Work Model",
      "0002 Consequences"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_6bf5e5b90a15803e49010737491afdb9",
    "sourceUnitDigest": "a45346dbf45eca84",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "unheaded-block-6",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0002 (source lines 1396-1401, starting \"- **Fan-out đa-agent xuyên câu chuyện tự nhiên:** frontier gom mọi việ\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: digests recomputed by extractor and independent hash and equal (text byte-equal), shard row equals pack, source and target anchors pass, ancestry 0002 Consequences equals the shard, rationale line range 1396-1401 and target anchor match the unit; text not re-read beyond byte equality",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "a45346dbf45eca841ecf385d6a2d1444175f264ec2bdf3a261f038abc7a84e90",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "2. ADR 0002 Flat Work Model",
      "0002 Consequences"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-034"
}
```

## Entry decisions-035

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "collection": "claims",
  "claimId": "claim_c56e0ea4200729ae5cf5542803b2fe10",
  "before": {
    "claimId": "claim_c56e0ea4200729ae5cf5542803b2fe10",
    "sourceUnitDigest": "95a357e29712c3c0",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "pending",
    "targetAnchor": "unheaded-block-7",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Supersession-rule line of ADR 0002 (change by superseding with a new record) carried verbatim at the end of its consequences section; the located suggestion pointed at the first identical copy, so the anchor was set to this ADR's own block. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "2. ADR 0002 Flat Work Model",
      "0002 Consequences"
    ]
  },
  "after": {
    "claimId": "claim_c56e0ea4200729ae5cf5542803b2fe10",
    "sourceUnitDigest": "95a357e29712c3c0",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "unheaded-block-7",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Supersession-rule line of ADR 0002 (change by superseding with a new record) carried verbatim at the end of its consequences section; the located suggestion pointed at the first identical copy, so the anchor was set to this ADR's own block. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: digests recomputed by extractor and independent hash and equal (text byte-equal), shard row equals pack, source and target anchors pass, ancestry 0002 Consequences equals the shard, rationale line range 1403-1403 and target anchor match the unit; text not re-read beyond byte equality",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "2. ADR 0002 Flat Work Model",
      "0002 Consequences"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_c56e0ea4200729ae5cf5542803b2fe10",
    "sourceUnitDigest": "95a357e29712c3c0",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "unheaded-block-7",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Supersession-rule line of ADR 0002 (change by superseding with a new record) carried verbatim at the end of its consequences section; the located suggestion pointed at the first identical copy, so the anchor was set to this ADR's own block. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: digests recomputed by extractor and independent hash and equal (text byte-equal), shard row equals pack, source and target anchors pass, ancestry 0002 Consequences equals the shard, rationale line range 1403-1403 and target anchor match the unit; text not re-read beyond byte equality",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "2. ADR 0002 Flat Work Model",
      "0002 Consequences"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-035"
}
```

## Entry decisions-036

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "collection": "claims",
  "claimId": "claim_0e062808f47ce5c348b6b44a91650ecc",
  "before": {
    "claimId": "claim_0e062808f47ce5c348b6b44a91650ecc",
    "sourceUnitDigest": "c0dc9acc17db4283",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "pending",
    "targetAnchor": "3-adr-0003-naming-and-data-layout",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Source ADR 0003 title heading is represented by the frozen H2 \"3. ADR 0003 ...\" (3-adr-0003-naming-and-data-layout); title is renumbered and re-worded in English, text of the record is unchanged. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "eed7c45e529a07ba42be1926c4715e28e71d7ab481a6e270e4db28d1981b35d3",
    "targetAncestry": [
      "Retired Decision History: Work State"
    ]
  },
  "after": {
    "claimId": "claim_0e062808f47ce5c348b6b44a91650ecc",
    "sourceUnitDigest": "c0dc9acc17db4283",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "3-adr-0003-naming-and-data-layout",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Source ADR 0003 title heading is represented by the frozen H2 \"3. ADR 0003 ...\" (3-adr-0003-naming-and-data-layout); title is renumbered and re-worded in English, text of the record is unchanged. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading H3 '0003 — Đặt tên & bố cục dữ liệu' (work-state.md L1405) to H2 '3. ADR 0003 Naming And Data Layout' (L62): title and depth change only, section payload and following-block digests equal on both sides (both digests recomputed independently), target ancestry names ADR 0003 like the source position, the frozen-heading quote in the rationale equals the target heading, depth H3 to H2 is a permitted depth-only change that the rationale does not name",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "eed7c45e529a07ba42be1926c4715e28e71d7ab481a6e270e4db28d1981b35d3",
    "targetAncestry": [
      "Retired Decision History: Work State"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_0e062808f47ce5c348b6b44a91650ecc",
    "sourceUnitDigest": "c0dc9acc17db4283",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "3-adr-0003-naming-and-data-layout",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Source ADR 0003 title heading is represented by the frozen H2 \"3. ADR 0003 ...\" (3-adr-0003-naming-and-data-layout); title is renumbered and re-worded in English, text of the record is unchanged. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading H3 '0003 — Đặt tên & bố cục dữ liệu' (work-state.md L1405) to H2 '3. ADR 0003 Naming And Data Layout' (L62): title and depth change only, section payload and following-block digests equal on both sides (both digests recomputed independently), target ancestry names ADR 0003 like the source position, the frozen-heading quote in the rationale equals the target heading, depth H3 to H2 is a permitted depth-only change that the rationale does not name",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "eed7c45e529a07ba42be1926c4715e28e71d7ab481a6e270e4db28d1981b35d3",
    "targetAncestry": [
      "Retired Decision History: Work State"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-036"
}
```

## Entry decisions-037

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "collection": "claims",
  "claimId": "claim_75f47ef3fd99abd07c138f106f1ca023",
  "before": {
    "claimId": "claim_75f47ef3fd99abd07c138f106f1ca023",
    "sourceUnitDigest": "203f9cd3142f933c",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "pending",
    "targetAnchor": "0003-context",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Section heading \"Bối cảnh\" of ADR 0003 is represented by the frozen H3 \"0003 Context\"; the title differs (prefixed with the ADR number, English) but the section it opens is the same. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "c6a2c64d4858021065b5e9f3a7dd05666d15ee2123b64859bc98ecf175325bd1",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "3. ADR 0003 Naming And Data Layout"
    ]
  },
  "after": {
    "claimId": "claim_75f47ef3fd99abd07c138f106f1ca023",
    "sourceUnitDigest": "203f9cd3142f933c",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "0003-context",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Section heading \"Bối cảnh\" of ADR 0003 is represented by the frozen H3 \"0003 Context\"; the title differs (prefixed with the ADR number, English) but the section it opens is the same. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading H4 'Bối cảnh' (work-state.md L1407) to H3 '0003 Context' (L64): title and depth change only, section payload and following-block digests equal on both sides (both digests recomputed independently), target ancestry names ADR 0003 like the source position, the frozen-heading quote in the rationale equals the target heading, depth H4 to H3 is a permitted depth-only change that the rationale does not name",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "c6a2c64d4858021065b5e9f3a7dd05666d15ee2123b64859bc98ecf175325bd1",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "3. ADR 0003 Naming And Data Layout"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_75f47ef3fd99abd07c138f106f1ca023",
    "sourceUnitDigest": "203f9cd3142f933c",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "0003-context",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Section heading \"Bối cảnh\" of ADR 0003 is represented by the frozen H3 \"0003 Context\"; the title differs (prefixed with the ADR number, English) but the section it opens is the same. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading H4 'Bối cảnh' (work-state.md L1407) to H3 '0003 Context' (L64): title and depth change only, section payload and following-block digests equal on both sides (both digests recomputed independently), target ancestry names ADR 0003 like the source position, the frozen-heading quote in the rationale equals the target heading, depth H4 to H3 is a permitted depth-only change that the rationale does not name",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "c6a2c64d4858021065b5e9f3a7dd05666d15ee2123b64859bc98ecf175325bd1",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "3. ADR 0003 Naming And Data Layout"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-037"
}
```

## Entry decisions-038

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "collection": "claims",
  "claimId": "claim_70c83eabb546f46e040404b3b908a02e",
  "before": {
    "claimId": "claim_70c83eabb546f46e040404b3b908a02e",
    "sourceUnitDigest": "152aead220875817",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "pending",
    "targetAnchor": "unheaded-block-8",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0003 (source lines 1409-1411, starting \"Cần chốt danh xưng và bố cục dữ liệu trên đĩa cho lớp work-state trước\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "152aead220875817c189bb95c64a8e95ae9be24d79d6190afd2c02dfc5992fab",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "3. ADR 0003 Naming And Data Layout",
      "0003 Context"
    ]
  },
  "after": {
    "claimId": "claim_70c83eabb546f46e040404b3b908a02e",
    "sourceUnitDigest": "152aead220875817",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "unheaded-block-8",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0003 (source lines 1409-1411, starting \"Cần chốt danh xưng và bố cục dữ liệu trên đĩa cho lớp work-state trước\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: work-state.md#unheaded-block-118 (L1409-1411) to decisions/retired-decision-history.md#unheaded-block-8 (L66-68): text byte-equal (read both ends, 169 chars), digests recomputed by extractor and by independent hash, anchor passes, ancestry 0003 Context equals the shard; rationale line range, anchor and opening words match the unit",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "152aead220875817c189bb95c64a8e95ae9be24d79d6190afd2c02dfc5992fab",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "3. ADR 0003 Naming And Data Layout",
      "0003 Context"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_70c83eabb546f46e040404b3b908a02e",
    "sourceUnitDigest": "152aead220875817",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "unheaded-block-8",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0003 (source lines 1409-1411, starting \"Cần chốt danh xưng và bố cục dữ liệu trên đĩa cho lớp work-state trước\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: work-state.md#unheaded-block-118 (L1409-1411) to decisions/retired-decision-history.md#unheaded-block-8 (L66-68): text byte-equal (read both ends, 169 chars), digests recomputed by extractor and by independent hash, anchor passes, ancestry 0003 Context equals the shard; rationale line range, anchor and opening words match the unit",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "152aead220875817c189bb95c64a8e95ae9be24d79d6190afd2c02dfc5992fab",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "3. ADR 0003 Naming And Data Layout",
      "0003 Context"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-038"
}
```

## Entry decisions-039

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "collection": "claims",
  "claimId": "claim_c6a1314c4583518f5100cc53e78b1979",
  "before": {
    "claimId": "claim_c6a1314c4583518f5100cc53e78b1979",
    "sourceUnitDigest": "798c507e268c8c14",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "pending",
    "targetAnchor": "0003-decision",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Section heading \"Quyết định\" of ADR 0003 is represented by the frozen H3 \"0003 Decision\"; the title differs (prefixed with the ADR number, English) but the section it opens is the same. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "d0f79f2a53f7edfc1d92c6e8c71d50e3eecb588a7bccf96f3eb9c97f0a628a7d",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "3. ADR 0003 Naming And Data Layout"
    ]
  },
  "after": {
    "claimId": "claim_c6a1314c4583518f5100cc53e78b1979",
    "sourceUnitDigest": "798c507e268c8c14",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "0003-decision",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Section heading \"Quyết định\" of ADR 0003 is represented by the frozen H3 \"0003 Decision\"; the title differs (prefixed with the ADR number, English) but the section it opens is the same. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading H4 'Quyết định' (work-state.md L1413) to H3 '0003 Decision' (L70): title and depth change only, section payload and following-block digests equal on both sides (both digests recomputed independently), target ancestry names ADR 0003 like the source position, the frozen-heading quote in the rationale equals the target heading, depth H4 to H3 is a permitted depth-only change that the rationale does not name",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "d0f79f2a53f7edfc1d92c6e8c71d50e3eecb588a7bccf96f3eb9c97f0a628a7d",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "3. ADR 0003 Naming And Data Layout"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_c6a1314c4583518f5100cc53e78b1979",
    "sourceUnitDigest": "798c507e268c8c14",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "0003-decision",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Section heading \"Quyết định\" of ADR 0003 is represented by the frozen H3 \"0003 Decision\"; the title differs (prefixed with the ADR number, English) but the section it opens is the same. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading H4 'Quyết định' (work-state.md L1413) to H3 '0003 Decision' (L70): title and depth change only, section payload and following-block digests equal on both sides (both digests recomputed independently), target ancestry names ADR 0003 like the source position, the frozen-heading quote in the rationale equals the target heading, depth H4 to H3 is a permitted depth-only change that the rationale does not name",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "d0f79f2a53f7edfc1d92c6e8c71d50e3eecb588a7bccf96f3eb9c97f0a628a7d",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "3. ADR 0003 Naming And Data Layout"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-039"
}
```

## Entry decisions-040

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "collection": "claims",
  "claimId": "claim_45c662066b6e70bac4ff5991ee40afca",
  "before": {
    "claimId": "claim_45c662066b6e70bac4ff5991ee40afca",
    "sourceUnitDigest": "6f7961ba49b014f5",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "pending",
    "targetAnchor": "unheaded-block-9",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0003 (source lines 1415-1420, starting \"- **CLI = `fgos`** (cửa lệnh của sản phẩm).\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "6f7961ba49b014f58ba0ec626d207f11d8fa5ca3852f090640e1521c781db391",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "3. ADR 0003 Naming And Data Layout",
      "0003 Decision"
    ]
  },
  "after": {
    "claimId": "claim_45c662066b6e70bac4ff5991ee40afca",
    "sourceUnitDigest": "6f7961ba49b014f5",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "unheaded-block-9",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0003 (source lines 1415-1420, starting \"- **CLI = `fgos`** (cửa lệnh của sản phẩm).\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: digests recomputed by extractor and independent hash and equal (text byte-equal), shard row equals pack, source and target anchors pass, ancestry 0003 Decision equals the shard, rationale line range 1415-1420 and target anchor match the unit; text not re-read beyond byte equality",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "6f7961ba49b014f58ba0ec626d207f11d8fa5ca3852f090640e1521c781db391",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "3. ADR 0003 Naming And Data Layout",
      "0003 Decision"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_45c662066b6e70bac4ff5991ee40afca",
    "sourceUnitDigest": "6f7961ba49b014f5",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "unheaded-block-9",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0003 (source lines 1415-1420, starting \"- **CLI = `fgos`** (cửa lệnh của sản phẩm).\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: digests recomputed by extractor and independent hash and equal (text byte-equal), shard row equals pack, source and target anchors pass, ancestry 0003 Decision equals the shard, rationale line range 1415-1420 and target anchor match the unit; text not re-read beyond byte equality",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "6f7961ba49b014f58ba0ec626d207f11d8fa5ca3852f090640e1521c781db391",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "3. ADR 0003 Naming And Data Layout",
      "0003 Decision"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-040"
}
```

## Entry decisions-041

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "collection": "claims",
  "claimId": "claim_f161fbd15476131b86b7c2fd2f1d8f59",
  "before": {
    "claimId": "claim_f161fbd15476131b86b7c2fd2f1d8f59",
    "sourceUnitDigest": "055bb7583cd58580",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "pending",
    "targetAnchor": "0003-consequences",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Section heading \"Hệ quả\" of ADR 0003 is represented by the frozen H3 \"0003 Consequences\"; the title differs (prefixed with the ADR number, English) but the section it opens is the same. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "e6a929b78a9cc9b4254c5e289f33c764837ff88c2f3ff9919376e5f8823b9ff0",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "3. ADR 0003 Naming And Data Layout"
    ]
  },
  "after": {
    "claimId": "claim_f161fbd15476131b86b7c2fd2f1d8f59",
    "sourceUnitDigest": "055bb7583cd58580",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "0003-consequences",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Section heading \"Hệ quả\" of ADR 0003 is represented by the frozen H3 \"0003 Consequences\"; the title differs (prefixed with the ADR number, English) but the section it opens is the same. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading H4 'Hệ quả' (work-state.md L1422) to H3 '0003 Consequences' (L79): title and depth change only, section payload and following-block digests equal on both sides (both digests recomputed independently), target ancestry names ADR 0003 like the source position, the frozen-heading quote in the rationale equals the target heading, depth H4 to H3 is a permitted depth-only change that the rationale does not name",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "e6a929b78a9cc9b4254c5e289f33c764837ff88c2f3ff9919376e5f8823b9ff0",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "3. ADR 0003 Naming And Data Layout"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_f161fbd15476131b86b7c2fd2f1d8f59",
    "sourceUnitDigest": "055bb7583cd58580",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "0003-consequences",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Section heading \"Hệ quả\" of ADR 0003 is represented by the frozen H3 \"0003 Consequences\"; the title differs (prefixed with the ADR number, English) but the section it opens is the same. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading H4 'Hệ quả' (work-state.md L1422) to H3 '0003 Consequences' (L79): title and depth change only, section payload and following-block digests equal on both sides (both digests recomputed independently), target ancestry names ADR 0003 like the source position, the frozen-heading quote in the rationale equals the target heading, depth H4 to H3 is a permitted depth-only change that the rationale does not name",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "e6a929b78a9cc9b4254c5e289f33c764837ff88c2f3ff9919376e5f8823b9ff0",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "3. ADR 0003 Naming And Data Layout"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-041"
}
```

## Entry decisions-042

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "collection": "claims",
  "claimId": "claim_0f85275ad3f392256b805bf226c9562d",
  "before": {
    "claimId": "claim_0f85275ad3f392256b805bf226c9562d",
    "sourceUnitDigest": "37d75ce7b883a61c",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "pending",
    "targetAnchor": "unheaded-block-10",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0003 (source lines 1424-1428, starting \"- **Brand nhất quán** giữa CLI, tài liệu và data dir.\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "37d75ce7b883a61c5bee0ad0e4bcc382fec55e8223ceeb80d63056d62f71d9e2",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "3. ADR 0003 Naming And Data Layout",
      "0003 Consequences"
    ]
  },
  "after": {
    "claimId": "claim_0f85275ad3f392256b805bf226c9562d",
    "sourceUnitDigest": "37d75ce7b883a61c",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "unheaded-block-10",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0003 (source lines 1424-1428, starting \"- **Brand nhất quán** giữa CLI, tài liệu và data dir.\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: digests recomputed by extractor and independent hash and equal (text byte-equal), shard row equals pack, source and target anchors pass, ancestry 0003 Consequences equals the shard, rationale line range 1424-1428 and target anchor match the unit; text not re-read beyond byte equality",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "37d75ce7b883a61c5bee0ad0e4bcc382fec55e8223ceeb80d63056d62f71d9e2",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "3. ADR 0003 Naming And Data Layout",
      "0003 Consequences"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_0f85275ad3f392256b805bf226c9562d",
    "sourceUnitDigest": "37d75ce7b883a61c",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "unheaded-block-10",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0003 (source lines 1424-1428, starting \"- **Brand nhất quán** giữa CLI, tài liệu và data dir.\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: digests recomputed by extractor and independent hash and equal (text byte-equal), shard row equals pack, source and target anchors pass, ancestry 0003 Consequences equals the shard, rationale line range 1424-1428 and target anchor match the unit; text not re-read beyond byte equality",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "37d75ce7b883a61c5bee0ad0e4bcc382fec55e8223ceeb80d63056d62f71d9e2",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "3. ADR 0003 Naming And Data Layout",
      "0003 Consequences"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-042"
}
```

## Entry decisions-043

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "collection": "claims",
  "claimId": "claim_c57c39536b983d5f172833853e8b3344",
  "before": {
    "claimId": "claim_c57c39536b983d5f172833853e8b3344",
    "sourceUnitDigest": "95a357e29712c3c0",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "pending",
    "targetAnchor": "unheaded-block-11",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Supersession-rule line of ADR 0003 (change by superseding with a new record) carried verbatim at the end of its consequences section; the located suggestion pointed at the first identical copy, so the anchor was set to this ADR's own block. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "3. ADR 0003 Naming And Data Layout",
      "0003 Consequences"
    ]
  },
  "after": {
    "claimId": "claim_c57c39536b983d5f172833853e8b3344",
    "sourceUnitDigest": "95a357e29712c3c0",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "unheaded-block-11",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Supersession-rule line of ADR 0003 (change by superseding with a new record) carried verbatim at the end of its consequences section; the located suggestion pointed at the first identical copy, so the anchor was set to this ADR's own block. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: work-state.md#unheaded-block-121 (L1430-1430) to decisions/retired-decision-history.md#unheaded-block-11 (L87-87): text byte-equal (read both ends, 66 chars), digests recomputed by extractor and by independent hash, anchor passes, ancestry 0003 Consequences equals the shard; rationale line range, anchor and opening words match the unit; footer bound to its own ADR block",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "3. ADR 0003 Naming And Data Layout",
      "0003 Consequences"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_c57c39536b983d5f172833853e8b3344",
    "sourceUnitDigest": "95a357e29712c3c0",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "unheaded-block-11",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Supersession-rule line of ADR 0003 (change by superseding with a new record) carried verbatim at the end of its consequences section; the located suggestion pointed at the first identical copy, so the anchor was set to this ADR's own block. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: work-state.md#unheaded-block-121 (L1430-1430) to decisions/retired-decision-history.md#unheaded-block-11 (L87-87): text byte-equal (read both ends, 66 chars), digests recomputed by extractor and by independent hash, anchor passes, ancestry 0003 Consequences equals the shard; rationale line range, anchor and opening words match the unit; footer bound to its own ADR block",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "3. ADR 0003 Naming And Data Layout",
      "0003 Consequences"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-043"
}
```

## Entry decisions-044

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "collection": "claims",
  "claimId": "claim_5908b357cb98d52934398e26e43fcb39",
  "before": {
    "claimId": "claim_5908b357cb98d52934398e26e43fcb39",
    "sourceUnitDigest": "a0ff252fe4a05fd8",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "pending",
    "targetAnchor": "4-adr-0004-scope-and-non-goals",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Source ADR 0004 title heading is represented by the frozen H2 \"4. ADR 0004 ...\" (4-adr-0004-scope-and-non-goals); title is renumbered and re-worded in English, text of the record is unchanged. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "2d2db2abca61349471af2e2a3d0f5581e7f87af45a979df1e541c1448a865f8a",
    "targetAncestry": [
      "Retired Decision History: Work State"
    ]
  },
  "after": {
    "claimId": "claim_5908b357cb98d52934398e26e43fcb39",
    "sourceUnitDigest": "a0ff252fe4a05fd8",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "4-adr-0004-scope-and-non-goals",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Source ADR 0004 title heading is represented by the frozen H2 \"4. ADR 0004 ...\" (4-adr-0004-scope-and-non-goals); title is renumbered and re-worded in English, text of the record is unchanged. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading H3 '0004 — Phạm vi & non-goal' (work-state.md L1432) to H2 '4. ADR 0004 Scope And Non-Goals' (L89): title and depth change only, section payload and following-block digests equal on both sides (both digests recomputed independently), target ancestry names ADR 0004 like the source position, the frozen-heading quote in the rationale equals the target heading, depth H3 to H2 is a permitted depth-only change that the rationale does not name",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "2d2db2abca61349471af2e2a3d0f5581e7f87af45a979df1e541c1448a865f8a",
    "targetAncestry": [
      "Retired Decision History: Work State"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_5908b357cb98d52934398e26e43fcb39",
    "sourceUnitDigest": "a0ff252fe4a05fd8",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "4-adr-0004-scope-and-non-goals",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Source ADR 0004 title heading is represented by the frozen H2 \"4. ADR 0004 ...\" (4-adr-0004-scope-and-non-goals); title is renumbered and re-worded in English, text of the record is unchanged. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading H3 '0004 — Phạm vi & non-goal' (work-state.md L1432) to H2 '4. ADR 0004 Scope And Non-Goals' (L89): title and depth change only, section payload and following-block digests equal on both sides (both digests recomputed independently), target ancestry names ADR 0004 like the source position, the frozen-heading quote in the rationale equals the target heading, depth H3 to H2 is a permitted depth-only change that the rationale does not name",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "2d2db2abca61349471af2e2a3d0f5581e7f87af45a979df1e541c1448a865f8a",
    "targetAncestry": [
      "Retired Decision History: Work State"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-044"
}
```

## Entry decisions-045

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "collection": "claims",
  "claimId": "claim_67494c7de8ad006fcb01b825ea00e6b2",
  "before": {
    "claimId": "claim_67494c7de8ad006fcb01b825ea00e6b2",
    "sourceUnitDigest": "f27931862e682c2f",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "pending",
    "targetAnchor": "0004-context",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Section heading \"Bối cảnh\" of ADR 0004 is represented by the frozen H3 \"0004 Context\"; the title differs (prefixed with the ADR number, English) but the section it opens is the same. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "2d45d4866f7526c232afdeaf650c17f9c3efee2a04afd9e6241922d522abffe9",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "4. ADR 0004 Scope And Non-Goals"
    ]
  },
  "after": {
    "claimId": "claim_67494c7de8ad006fcb01b825ea00e6b2",
    "sourceUnitDigest": "f27931862e682c2f",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "0004-context",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Section heading \"Bối cảnh\" of ADR 0004 is represented by the frozen H3 \"0004 Context\"; the title differs (prefixed with the ADR number, English) but the section it opens is the same. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading H4 'Bối cảnh' (work-state.md L1434) to H3 '0004 Context' (L91): title and depth change only, section payload and following-block digests equal on both sides (both digests recomputed independently), target ancestry names ADR 0004 like the source position, the frozen-heading quote in the rationale equals the target heading, depth H4 to H3 is a permitted depth-only change that the rationale does not name",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "2d45d4866f7526c232afdeaf650c17f9c3efee2a04afd9e6241922d522abffe9",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "4. ADR 0004 Scope And Non-Goals"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_67494c7de8ad006fcb01b825ea00e6b2",
    "sourceUnitDigest": "f27931862e682c2f",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "0004-context",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Section heading \"Bối cảnh\" of ADR 0004 is represented by the frozen H3 \"0004 Context\"; the title differs (prefixed with the ADR number, English) but the section it opens is the same. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading H4 'Bối cảnh' (work-state.md L1434) to H3 '0004 Context' (L91): title and depth change only, section payload and following-block digests equal on both sides (both digests recomputed independently), target ancestry names ADR 0004 like the source position, the frozen-heading quote in the rationale equals the target heading, depth H4 to H3 is a permitted depth-only change that the rationale does not name",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "2d45d4866f7526c232afdeaf650c17f9c3efee2a04afd9e6241922d522abffe9",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "4. ADR 0004 Scope And Non-Goals"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-045"
}
```

## Entry decisions-046

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "collection": "claims",
  "claimId": "claim_c23f1c3ed45f72de28f6ed3c605bc43a",
  "before": {
    "claimId": "claim_c23f1c3ed45f72de28f6ed3c605bc43a",
    "sourceUnitDigest": "e64dd190deebcac5",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "pending",
    "targetAnchor": "unheaded-block-12",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0004 (source lines 1436-1438, starting \"Trước khi xây lớp state, cần chốt hai biên: nó phục vụ *ai trước*, và \") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "e64dd190deebcac53e83492fe91319c1fced7ca4a6054a2b4c4745821020e531",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "4. ADR 0004 Scope And Non-Goals",
      "0004 Context"
    ]
  },
  "after": {
    "claimId": "claim_c23f1c3ed45f72de28f6ed3c605bc43a",
    "sourceUnitDigest": "e64dd190deebcac5",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "unheaded-block-12",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0004 (source lines 1436-1438, starting \"Trước khi xây lớp state, cần chốt hai biên: nó phục vụ *ai trước*, và \") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: work-state.md#unheaded-block-122 (L1436-1438) to decisions/retired-decision-history.md#unheaded-block-12 (L93-95): text byte-equal (read both ends, 226 chars), digests recomputed by extractor and by independent hash, anchor passes, ancestry 0004 Context equals the shard; rationale line range, anchor and opening words match the unit",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "e64dd190deebcac53e83492fe91319c1fced7ca4a6054a2b4c4745821020e531",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "4. ADR 0004 Scope And Non-Goals",
      "0004 Context"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_c23f1c3ed45f72de28f6ed3c605bc43a",
    "sourceUnitDigest": "e64dd190deebcac5",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "unheaded-block-12",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0004 (source lines 1436-1438, starting \"Trước khi xây lớp state, cần chốt hai biên: nó phục vụ *ai trước*, và \") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: work-state.md#unheaded-block-122 (L1436-1438) to decisions/retired-decision-history.md#unheaded-block-12 (L93-95): text byte-equal (read both ends, 226 chars), digests recomputed by extractor and by independent hash, anchor passes, ancestry 0004 Context equals the shard; rationale line range, anchor and opening words match the unit",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "e64dd190deebcac53e83492fe91319c1fced7ca4a6054a2b4c4745821020e531",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "4. ADR 0004 Scope And Non-Goals",
      "0004 Context"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-046"
}
```

## Entry decisions-047

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "collection": "claims",
  "claimId": "claim_4a9e0c360118d90051bb7c03002ff4d9",
  "before": {
    "claimId": "claim_4a9e0c360118d90051bb7c03002ff4d9",
    "sourceUnitDigest": "7fa451435e5be174",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "pending",
    "targetAnchor": "unheaded-block-13",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0004 (source lines 1440-1442, starting \"> Ghi chú viết lại: quyết định gốc phát biểu qua quan hệ với harness p\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "7fa451435e5be174a0cf5118a1eaccb44b208aaaf561387fbd36a186bfe74f48",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "4. ADR 0004 Scope And Non-Goals",
      "0004 Context"
    ]
  },
  "after": {
    "claimId": "claim_4a9e0c360118d90051bb7c03002ff4d9",
    "sourceUnitDigest": "7fa451435e5be174",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "unheaded-block-13",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0004 (source lines 1440-1442, starting \"> Ghi chú viết lại: quyết định gốc phát biểu qua quan hệ với harness p\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: work-state.md#unheaded-block-123 (L1440-1442) to decisions/retired-decision-history.md#unheaded-block-13 (L97-99): text byte-equal (read both ends, 197 chars), digests recomputed by extractor and by independent hash, anchor passes, ancestry 0004 Context equals the shard; rationale line range, anchor and opening words match the unit",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "7fa451435e5be174a0cf5118a1eaccb44b208aaaf561387fbd36a186bfe74f48",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "4. ADR 0004 Scope And Non-Goals",
      "0004 Context"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_4a9e0c360118d90051bb7c03002ff4d9",
    "sourceUnitDigest": "7fa451435e5be174",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "unheaded-block-13",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0004 (source lines 1440-1442, starting \"> Ghi chú viết lại: quyết định gốc phát biểu qua quan hệ với harness p\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: work-state.md#unheaded-block-123 (L1440-1442) to decisions/retired-decision-history.md#unheaded-block-13 (L97-99): text byte-equal (read both ends, 197 chars), digests recomputed by extractor and by independent hash, anchor passes, ancestry 0004 Context equals the shard; rationale line range, anchor and opening words match the unit",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "7fa451435e5be174a0cf5118a1eaccb44b208aaaf561387fbd36a186bfe74f48",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "4. ADR 0004 Scope And Non-Goals",
      "0004 Context"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-047"
}
```

## Entry decisions-048

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "collection": "claims",
  "claimId": "claim_4063855a9287de7cf5b27cb77d96955f",
  "before": {
    "claimId": "claim_4063855a9287de7cf5b27cb77d96955f",
    "sourceUnitDigest": "b72bf8ee1aea6db6",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "pending",
    "targetAnchor": "0004-decision",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Section heading \"Quyết định\" of ADR 0004 is represented by the frozen H3 \"0004 Decision\"; the title differs (prefixed with the ADR number, English) but the section it opens is the same. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "59bda06684c6859316ad8f0b236bc7b6ebc9dc72139fca854456d9b38de05252",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "4. ADR 0004 Scope And Non-Goals"
    ]
  },
  "after": {
    "claimId": "claim_4063855a9287de7cf5b27cb77d96955f",
    "sourceUnitDigest": "b72bf8ee1aea6db6",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "0004-decision",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Section heading \"Quyết định\" of ADR 0004 is represented by the frozen H3 \"0004 Decision\"; the title differs (prefixed with the ADR number, English) but the section it opens is the same. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading H4 'Quyết định' (work-state.md L1444) to H3 '0004 Decision' (L101): title and depth change only, section payload and following-block digests equal on both sides (both digests recomputed independently), target ancestry names ADR 0004 like the source position, the frozen-heading quote in the rationale equals the target heading, depth H4 to H3 is a permitted depth-only change that the rationale does not name",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "59bda06684c6859316ad8f0b236bc7b6ebc9dc72139fca854456d9b38de05252",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "4. ADR 0004 Scope And Non-Goals"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_4063855a9287de7cf5b27cb77d96955f",
    "sourceUnitDigest": "b72bf8ee1aea6db6",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "0004-decision",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Section heading \"Quyết định\" of ADR 0004 is represented by the frozen H3 \"0004 Decision\"; the title differs (prefixed with the ADR number, English) but the section it opens is the same. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading H4 'Quyết định' (work-state.md L1444) to H3 '0004 Decision' (L101): title and depth change only, section payload and following-block digests equal on both sides (both digests recomputed independently), target ancestry names ADR 0004 like the source position, the frozen-heading quote in the rationale equals the target heading, depth H4 to H3 is a permitted depth-only change that the rationale does not name",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "59bda06684c6859316ad8f0b236bc7b6ebc9dc72139fca854456d9b38de05252",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "4. ADR 0004 Scope And Non-Goals"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-048"
}
```

## Entry decisions-049

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "collection": "claims",
  "claimId": "claim_93d9f629f8c7258d208b1c2d3fc413ab",
  "before": {
    "claimId": "claim_93d9f629f8c7258d208b1c2d3fc413ab",
    "sourceUnitDigest": "fc46702e212ac516",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "pending",
    "targetAnchor": "unheaded-block-14",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0004 (source lines 1446-1452, starting \"1. **Domain đầu tiên của lớp state là work-state của chính forgent** —\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "fc46702e212ac516c32faa5292ce63999a0e60af3361b2dcb7ddbe1dd43d09c7",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "4. ADR 0004 Scope And Non-Goals",
      "0004 Decision"
    ]
  },
  "after": {
    "claimId": "claim_93d9f629f8c7258d208b1c2d3fc413ab",
    "sourceUnitDigest": "fc46702e212ac516",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "unheaded-block-14",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0004 (source lines 1446-1452, starting \"1. **Domain đầu tiên của lớp state là work-state của chính forgent** —\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: digests recomputed by extractor and independent hash and equal (text byte-equal), shard row equals pack, source and target anchors pass, ancestry 0004 Decision equals the shard, rationale line range 1446-1452 and target anchor match the unit; text not re-read beyond byte equality",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "fc46702e212ac516c32faa5292ce63999a0e60af3361b2dcb7ddbe1dd43d09c7",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "4. ADR 0004 Scope And Non-Goals",
      "0004 Decision"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_93d9f629f8c7258d208b1c2d3fc413ab",
    "sourceUnitDigest": "fc46702e212ac516",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "unheaded-block-14",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0004 (source lines 1446-1452, starting \"1. **Domain đầu tiên của lớp state là work-state của chính forgent** —\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: digests recomputed by extractor and independent hash and equal (text byte-equal), shard row equals pack, source and target anchors pass, ancestry 0004 Decision equals the shard, rationale line range 1446-1452 and target anchor match the unit; text not re-read beyond byte equality",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "fc46702e212ac516c32faa5292ce63999a0e60af3361b2dcb7ddbe1dd43d09c7",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "4. ADR 0004 Scope And Non-Goals",
      "0004 Decision"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-049"
}
```

## Entry decisions-050

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "collection": "claims",
  "claimId": "claim_0b4d53be3903ac1ce9299b5d7174feab",
  "before": {
    "claimId": "claim_0b4d53be3903ac1ce9299b5d7174feab",
    "sourceUnitDigest": "e44f9991b9931d7c",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "pending",
    "targetAnchor": "0004-consequences",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Section heading \"Hệ quả\" of ADR 0004 is represented by the frozen H3 \"0004 Consequences\"; the title differs (prefixed with the ADR number, English) but the section it opens is the same. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "12d505aab6487945d39c7e3a3f15ad06171917f8bf16b2b27387a9c6efd0d33b",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "4. ADR 0004 Scope And Non-Goals"
    ]
  },
  "after": {
    "claimId": "claim_0b4d53be3903ac1ce9299b5d7174feab",
    "sourceUnitDigest": "e44f9991b9931d7c",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "0004-consequences",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Section heading \"Hệ quả\" of ADR 0004 is represented by the frozen H3 \"0004 Consequences\"; the title differs (prefixed with the ADR number, English) but the section it opens is the same. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading H4 'Hệ quả' (work-state.md L1454) to H3 '0004 Consequences' (L111): title and depth change only, section payload and following-block digests equal on both sides (both digests recomputed independently), target ancestry names ADR 0004 like the source position, the frozen-heading quote in the rationale equals the target heading, depth H4 to H3 is a permitted depth-only change that the rationale does not name",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "12d505aab6487945d39c7e3a3f15ad06171917f8bf16b2b27387a9c6efd0d33b",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "4. ADR 0004 Scope And Non-Goals"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_0b4d53be3903ac1ce9299b5d7174feab",
    "sourceUnitDigest": "e44f9991b9931d7c",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "0004-consequences",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Section heading \"Hệ quả\" of ADR 0004 is represented by the frozen H3 \"0004 Consequences\"; the title differs (prefixed with the ADR number, English) but the section it opens is the same. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading H4 'Hệ quả' (work-state.md L1454) to H3 '0004 Consequences' (L111): title and depth change only, section payload and following-block digests equal on both sides (both digests recomputed independently), target ancestry names ADR 0004 like the source position, the frozen-heading quote in the rationale equals the target heading, depth H4 to H3 is a permitted depth-only change that the rationale does not name",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "12d505aab6487945d39c7e3a3f15ad06171917f8bf16b2b27387a9c6efd0d33b",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "4. ADR 0004 Scope And Non-Goals"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-050"
}
```

## Entry decisions-051

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "collection": "claims",
  "claimId": "claim_664fd1639ad346a2d2d240596a2a6604",
  "before": {
    "claimId": "claim_664fd1639ad346a2d2d240596a2a6604",
    "sourceUnitDigest": "9d43cd58043503f8",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "pending",
    "targetAnchor": "unheaded-block-15",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0004 (source lines 1456-1459, starting \"- **Scope bước đầu nhỏ:** không phải cover ngay các cơ chế điều phối n\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "9d43cd58043503f832f75d165615f47af07532b2dbf99d50a87a5a553a5ae62c",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "4. ADR 0004 Scope And Non-Goals",
      "0004 Consequences"
    ]
  },
  "after": {
    "claimId": "claim_664fd1639ad346a2d2d240596a2a6604",
    "sourceUnitDigest": "9d43cd58043503f8",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "unheaded-block-15",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0004 (source lines 1456-1459, starting \"- **Scope bước đầu nhỏ:** không phải cover ngay các cơ chế điều phối n\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: digests recomputed by extractor and independent hash and equal (text byte-equal), shard row equals pack, source and target anchors pass, ancestry 0004 Consequences equals the shard, rationale line range 1456-1459 and target anchor match the unit; text not re-read beyond byte equality",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "9d43cd58043503f832f75d165615f47af07532b2dbf99d50a87a5a553a5ae62c",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "4. ADR 0004 Scope And Non-Goals",
      "0004 Consequences"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_664fd1639ad346a2d2d240596a2a6604",
    "sourceUnitDigest": "9d43cd58043503f8",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "unheaded-block-15",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0004 (source lines 1456-1459, starting \"- **Scope bước đầu nhỏ:** không phải cover ngay các cơ chế điều phối n\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: digests recomputed by extractor and independent hash and equal (text byte-equal), shard row equals pack, source and target anchors pass, ancestry 0004 Consequences equals the shard, rationale line range 1456-1459 and target anchor match the unit; text not re-read beyond byte equality",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "9d43cd58043503f832f75d165615f47af07532b2dbf99d50a87a5a553a5ae62c",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "4. ADR 0004 Scope And Non-Goals",
      "0004 Consequences"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-051"
}
```

## Entry decisions-052

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "collection": "claims",
  "claimId": "claim_7bc17cd130d9b9600e3a8db9bd57ca88",
  "before": {
    "claimId": "claim_7bc17cd130d9b9600e3a8db9bd57ca88",
    "sourceUnitDigest": "95a357e29712c3c0",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "pending",
    "targetAnchor": "unheaded-block-16",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Supersession-rule line of ADR 0004 (change by superseding with a new record) carried verbatim at the end of its consequences section; the located suggestion pointed at the first identical copy, so the anchor was set to this ADR's own block. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "4. ADR 0004 Scope And Non-Goals",
      "0004 Consequences"
    ]
  },
  "after": {
    "claimId": "claim_7bc17cd130d9b9600e3a8db9bd57ca88",
    "sourceUnitDigest": "95a357e29712c3c0",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "unheaded-block-16",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Supersession-rule line of ADR 0004 (change by superseding with a new record) carried verbatim at the end of its consequences section; the located suggestion pointed at the first identical copy, so the anchor was set to this ADR's own block. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: digests recomputed by extractor and independent hash and equal (text byte-equal), shard row equals pack, source and target anchors pass, ancestry 0004 Consequences equals the shard, rationale line range 1461-1461 and target anchor match the unit; text not re-read beyond byte equality",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "4. ADR 0004 Scope And Non-Goals",
      "0004 Consequences"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_7bc17cd130d9b9600e3a8db9bd57ca88",
    "sourceUnitDigest": "95a357e29712c3c0",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "unheaded-block-16",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Supersession-rule line of ADR 0004 (change by superseding with a new record) carried verbatim at the end of its consequences section; the located suggestion pointed at the first identical copy, so the anchor was set to this ADR's own block. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: digests recomputed by extractor and independent hash and equal (text byte-equal), shard row equals pack, source and target anchors pass, ancestry 0004 Consequences equals the shard, rationale line range 1461-1461 and target anchor match the unit; text not re-read beyond byte equality",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "4. ADR 0004 Scope And Non-Goals",
      "0004 Consequences"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-052"
}
```

## Entry decisions-053

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "collection": "claims",
  "claimId": "claim_dbc0da98acd1c90327ebd67850cc8983",
  "before": {
    "claimId": "claim_dbc0da98acd1c90327ebd67850cc8983",
    "sourceUnitDigest": "2ff34201c3aa91d6",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "pending",
    "targetAnchor": "5-adr-0006-proposed-status",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Source ADR 0006 title heading is represented by the frozen H2 \"5. ADR 0006 ...\" (5-adr-0006-proposed-status); title is renumbered and re-worded in English, text of the record is unchanged. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "67c97b2b884ac9505324dc3b688a7989f36bfd27700bf7389751058845c479f0",
    "targetAncestry": [
      "Retired Decision History: Work State"
    ]
  },
  "after": {
    "claimId": "claim_dbc0da98acd1c90327ebd67850cc8983",
    "sourceUnitDigest": "2ff34201c3aa91d6",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "5-adr-0006-proposed-status",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Source ADR 0006 title heading is represented by the frozen H2 \"5. ADR 0006 ...\" (5-adr-0006-proposed-status); title is renumbered and re-worded in English, text of the record is unchanged. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading H3 '0006 — Trạng thái `proposed`' (work-state.md L1463) to H2 '5. ADR 0006 Proposed Status' (L120): title and depth change only, section payload and following-block digests equal on both sides (both digests recomputed independently), target ancestry names ADR 0006 like the source position, the frozen-heading quote in the rationale equals the target heading, depth H3 to H2 is a permitted depth-only change that the rationale does not name",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "67c97b2b884ac9505324dc3b688a7989f36bfd27700bf7389751058845c479f0",
    "targetAncestry": [
      "Retired Decision History: Work State"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_dbc0da98acd1c90327ebd67850cc8983",
    "sourceUnitDigest": "2ff34201c3aa91d6",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "5-adr-0006-proposed-status",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Source ADR 0006 title heading is represented by the frozen H2 \"5. ADR 0006 ...\" (5-adr-0006-proposed-status); title is renumbered and re-worded in English, text of the record is unchanged. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading H3 '0006 — Trạng thái `proposed`' (work-state.md L1463) to H2 '5. ADR 0006 Proposed Status' (L120): title and depth change only, section payload and following-block digests equal on both sides (both digests recomputed independently), target ancestry names ADR 0006 like the source position, the frozen-heading quote in the rationale equals the target heading, depth H3 to H2 is a permitted depth-only change that the rationale does not name",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "67c97b2b884ac9505324dc3b688a7989f36bfd27700bf7389751058845c479f0",
    "targetAncestry": [
      "Retired Decision History: Work State"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-053"
}
```

## Entry decisions-054

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "collection": "claims",
  "claimId": "claim_a79114f19bb479ea6b69c50166af8972",
  "before": {
    "claimId": "claim_a79114f19bb479ea6b69c50166af8972",
    "sourceUnitDigest": "9c8485790cf86a6a",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "pending",
    "targetAnchor": "0006-context",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Section heading \"Bối cảnh\" of ADR 0006 is represented by the frozen H3 \"0006 Context\"; the title differs (prefixed with the ADR number, English) but the section it opens is the same. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "6163b36b62dbb7c76e3510b09ab0d83b08f3542562b99abc5c41cd0534b0c789",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "5. ADR 0006 Proposed Status"
    ]
  },
  "after": {
    "claimId": "claim_a79114f19bb479ea6b69c50166af8972",
    "sourceUnitDigest": "9c8485790cf86a6a",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "0006-context",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Section heading \"Bối cảnh\" of ADR 0006 is represented by the frozen H3 \"0006 Context\"; the title differs (prefixed with the ADR number, English) but the section it opens is the same. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading H4 'Bối cảnh' (work-state.md L1465) to H3 '0006 Context' (L122): title and depth change only, section payload and following-block digests equal on both sides (both digests recomputed independently), target ancestry names ADR 0006 like the source position, the frozen-heading quote in the rationale equals the target heading, depth H4 to H3 is a permitted depth-only change that the rationale does not name",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "6163b36b62dbb7c76e3510b09ab0d83b08f3542562b99abc5c41cd0534b0c789",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "5. ADR 0006 Proposed Status"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_a79114f19bb479ea6b69c50166af8972",
    "sourceUnitDigest": "9c8485790cf86a6a",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "0006-context",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Section heading \"Bối cảnh\" of ADR 0006 is represented by the frozen H3 \"0006 Context\"; the title differs (prefixed with the ADR number, English) but the section it opens is the same. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading H4 'Bối cảnh' (work-state.md L1465) to H3 '0006 Context' (L122): title and depth change only, section payload and following-block digests equal on both sides (both digests recomputed independently), target ancestry names ADR 0006 like the source position, the frozen-heading quote in the rationale equals the target heading, depth H4 to H3 is a permitted depth-only change that the rationale does not name",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "6163b36b62dbb7c76e3510b09ab0d83b08f3542562b99abc5c41cd0534b0c789",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "5. ADR 0006 Proposed Status"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-054"
}
```

## Entry decisions-055

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "collection": "claims",
  "claimId": "claim_423abdded73e62ffd62a773173555583",
  "before": {
    "claimId": "claim_423abdded73e62ffd62a773173555583",
    "sourceUnitDigest": "b2285ceac14bdb72",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "pending",
    "targetAnchor": "unheaded-block-17",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0006 (source lines 1467-1467, starting \"Runner (0005) cho worker sinh kết quả trên **nhánh chưa merge**. Điều \") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "b2285ceac14bdb7210baf54029fa70b8e167563a09c6804e7cc59330ad886f45",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "5. ADR 0006 Proposed Status",
      "0006 Context"
    ]
  },
  "after": {
    "claimId": "claim_423abdded73e62ffd62a773173555583",
    "sourceUnitDigest": "b2285ceac14bdb72",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "unheaded-block-17",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0006 (source lines 1467-1467, starting \"Runner (0005) cho worker sinh kết quả trên **nhánh chưa merge**. Điều \") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: digests recomputed by extractor and independent hash and equal (text byte-equal), shard row equals pack, source and target anchors pass, ancestry 0006 Context equals the shard, rationale line range 1467-1467 and target anchor match the unit; text not re-read beyond byte equality",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "b2285ceac14bdb7210baf54029fa70b8e167563a09c6804e7cc59330ad886f45",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "5. ADR 0006 Proposed Status",
      "0006 Context"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_423abdded73e62ffd62a773173555583",
    "sourceUnitDigest": "b2285ceac14bdb72",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "unheaded-block-17",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0006 (source lines 1467-1467, starting \"Runner (0005) cho worker sinh kết quả trên **nhánh chưa merge**. Điều \") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: digests recomputed by extractor and independent hash and equal (text byte-equal), shard row equals pack, source and target anchors pass, ancestry 0006 Context equals the shard, rationale line range 1467-1467 and target anchor match the unit; text not re-read beyond byte equality",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "b2285ceac14bdb7210baf54029fa70b8e167563a09c6804e7cc59330ad886f45",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "5. ADR 0006 Proposed Status",
      "0006 Context"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-055"
}
```

## Entry decisions-056

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "collection": "claims",
  "claimId": "claim_0fe4212f0537cfd4b9232280e9e6781b",
  "before": {
    "claimId": "claim_0fe4212f0537cfd4b9232280e9e6781b",
    "sourceUnitDigest": "3077bff801c5d9f0",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "pending",
    "targetAnchor": "unheaded-block-18",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0006 (source lines 1469-1472, starting \"1. Một việc B phụ thuộc A có thể chạy trên nền **thiếu code của A** (A\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "3077bff801c5d9f092db1c250ec563092342fdee17a8941b01e1318f6c3ff827",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "5. ADR 0006 Proposed Status",
      "0006 Context"
    ]
  },
  "after": {
    "claimId": "claim_0fe4212f0537cfd4b9232280e9e6781b",
    "sourceUnitDigest": "3077bff801c5d9f0",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "unheaded-block-18",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0006 (source lines 1469-1472, starting \"1. Một việc B phụ thuộc A có thể chạy trên nền **thiếu code của A** (A\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: work-state.md#unheaded-block-128 (L1469-1472) to decisions/retired-decision-history.md#unheaded-block-18 (L126-129): text byte-equal (read both ends, 241 chars), digests recomputed by extractor and by independent hash, anchor passes, ancestry 0006 Context equals the shard; rationale line range, anchor and opening words match the unit",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "3077bff801c5d9f092db1c250ec563092342fdee17a8941b01e1318f6c3ff827",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "5. ADR 0006 Proposed Status",
      "0006 Context"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_0fe4212f0537cfd4b9232280e9e6781b",
    "sourceUnitDigest": "3077bff801c5d9f0",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "unheaded-block-18",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0006 (source lines 1469-1472, starting \"1. Một việc B phụ thuộc A có thể chạy trên nền **thiếu code của A** (A\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: work-state.md#unheaded-block-128 (L1469-1472) to decisions/retired-decision-history.md#unheaded-block-18 (L126-129): text byte-equal (read both ends, 241 chars), digests recomputed by extractor and by independent hash, anchor passes, ancestry 0006 Context equals the shard; rationale line range, anchor and opening words match the unit",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "3077bff801c5d9f092db1c250ec563092342fdee17a8941b01e1318f6c3ff827",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "5. ADR 0006 Proposed Status",
      "0006 Context"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-056"
}
```

## Entry decisions-057

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "collection": "claims",
  "claimId": "claim_99fa84eefd3c917530ef1a453f08be21",
  "before": {
    "claimId": "claim_99fa84eefd3c917530ef1a453f08be21",
    "sourceUnitDigest": "965caf0a03321009",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "pending",
    "targetAnchor": "0006-decision",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Section heading \"Quyết định\" of ADR 0006 is represented by the frozen H3 \"0006 Decision\"; the title differs (prefixed with the ADR number, English) but the section it opens is the same. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "ffd717cc616acfaa71c4fb8a61763bcfb0a5272b8345d44b839fc6e10e2afb43",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "5. ADR 0006 Proposed Status"
    ]
  },
  "after": {
    "claimId": "claim_99fa84eefd3c917530ef1a453f08be21",
    "sourceUnitDigest": "965caf0a03321009",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "0006-decision",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Section heading \"Quyết định\" of ADR 0006 is represented by the frozen H3 \"0006 Decision\"; the title differs (prefixed with the ADR number, English) but the section it opens is the same. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading H4 'Quyết định' (work-state.md L1474) to H3 '0006 Decision' (L131): title and depth change only, section payload and following-block digests equal on both sides (both digests recomputed independently), target ancestry names ADR 0006 like the source position, the frozen-heading quote in the rationale equals the target heading, depth H4 to H3 is a permitted depth-only change that the rationale does not name",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "ffd717cc616acfaa71c4fb8a61763bcfb0a5272b8345d44b839fc6e10e2afb43",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "5. ADR 0006 Proposed Status"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_99fa84eefd3c917530ef1a453f08be21",
    "sourceUnitDigest": "965caf0a03321009",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "0006-decision",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Section heading \"Quyết định\" of ADR 0006 is represented by the frozen H3 \"0006 Decision\"; the title differs (prefixed with the ADR number, English) but the section it opens is the same. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading H4 'Quyết định' (work-state.md L1474) to H3 '0006 Decision' (L131): title and depth change only, section payload and following-block digests equal on both sides (both digests recomputed independently), target ancestry names ADR 0006 like the source position, the frozen-heading quote in the rationale equals the target heading, depth H4 to H3 is a permitted depth-only change that the rationale does not name",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "ffd717cc616acfaa71c4fb8a61763bcfb0a5272b8345d44b839fc6e10e2afb43",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "5. ADR 0006 Proposed Status"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-057"
}
```

## Entry decisions-058

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "collection": "claims",
  "claimId": "claim_9283d5a06984f8b7a0bb9b53cb947051",
  "before": {
    "claimId": "claim_9283d5a06984f8b7a0bb9b53cb947051",
    "sourceUnitDigest": "bc5ca7e6617538ad",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "pending",
    "targetAnchor": "unheaded-block-19",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0006 (source lines 1476-1476, starting \"Thêm trạng thái **`proposed`** vào FSM, với các cạnh:\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "bc5ca7e6617538adf69f4c157336e967194051ccd11b686cfb97a85358255643",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "5. ADR 0006 Proposed Status",
      "0006 Decision"
    ]
  },
  "after": {
    "claimId": "claim_9283d5a06984f8b7a0bb9b53cb947051",
    "sourceUnitDigest": "bc5ca7e6617538ad",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "unheaded-block-19",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0006 (source lines 1476-1476, starting \"Thêm trạng thái **`proposed`** vào FSM, với các cạnh:\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: work-state.md#unheaded-block-129 (L1476-1476) to decisions/retired-decision-history.md#unheaded-block-19 (L133-133): text byte-equal (read both ends, 53 chars), digests recomputed by extractor and by independent hash, anchor passes, ancestry 0006 Decision equals the shard; rationale line range, anchor and opening words match the unit",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "bc5ca7e6617538adf69f4c157336e967194051ccd11b686cfb97a85358255643",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "5. ADR 0006 Proposed Status",
      "0006 Decision"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_9283d5a06984f8b7a0bb9b53cb947051",
    "sourceUnitDigest": "bc5ca7e6617538ad",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "unheaded-block-19",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0006 (source lines 1476-1476, starting \"Thêm trạng thái **`proposed`** vào FSM, với các cạnh:\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: work-state.md#unheaded-block-129 (L1476-1476) to decisions/retired-decision-history.md#unheaded-block-19 (L133-133): text byte-equal (read both ends, 53 chars), digests recomputed by extractor and by independent hash, anchor passes, ancestry 0006 Decision equals the shard; rationale line range, anchor and opening words match the unit",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "bc5ca7e6617538adf69f4c157336e967194051ccd11b686cfb97a85358255643",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "5. ADR 0006 Proposed Status",
      "0006 Decision"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-058"
}
```

## Entry decisions-059

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "collection": "claims",
  "claimId": "claim_6175bd55a942311ba1056efd762f44be",
  "before": {
    "claimId": "claim_6175bd55a942311ba1056efd762f44be",
    "sourceUnitDigest": "23622b5a51f195a4",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "pending",
    "targetAnchor": "unheaded-block-20",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0006 (source lines 1478-1483, the transition list) carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "23622b5a51f195a41cc870aac9b70d45f4e6bc7f6247da22248bdaa5fea969f3",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "5. ADR 0006 Proposed Status",
      "0006 Decision"
    ]
  },
  "after": {
    "claimId": "claim_6175bd55a942311ba1056efd762f44be",
    "sourceUnitDigest": "23622b5a51f195a4",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "unheaded-block-20",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0006 (source lines 1478-1483, the transition list) carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: digests recomputed by extractor and independent hash and equal (text byte-equal), shard row equals pack, source and target anchors pass, ancestry 0006 Decision equals the shard, rationale line range 1478-1483 and target anchor match the unit; text not re-read beyond byte equality",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "23622b5a51f195a41cc870aac9b70d45f4e6bc7f6247da22248bdaa5fea969f3",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "5. ADR 0006 Proposed Status",
      "0006 Decision"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_6175bd55a942311ba1056efd762f44be",
    "sourceUnitDigest": "23622b5a51f195a4",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "unheaded-block-20",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0006 (source lines 1478-1483, the transition list) carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: digests recomputed by extractor and independent hash and equal (text byte-equal), shard row equals pack, source and target anchors pass, ancestry 0006 Decision equals the shard, rationale line range 1478-1483 and target anchor match the unit; text not re-read beyond byte equality",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "23622b5a51f195a41cc870aac9b70d45f4e6bc7f6247da22248bdaa5fea969f3",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "5. ADR 0006 Proposed Status",
      "0006 Decision"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-059"
}
```

## Entry decisions-060

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "collection": "claims",
  "claimId": "claim_e482cc83d02ca103ac12e881c2a712ee",
  "before": {
    "claimId": "claim_e482cc83d02ca103ac12e881c2a712ee",
    "sourceUnitDigest": "671d794492bb185f",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "pending",
    "targetAnchor": "unheaded-block-21",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "The label \"Ngữ nghĩa:\" and the two bullets it introduces (source lines 1485-1490) carried line for line into one block; the extraction rule attaches a short label ending in a colon to the block it introduces, in the candidate as in the source; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "671d794492bb185fc86e5b1cdbca92dc3a96080e0bf8b4319c51715c7a88ca85",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "5. ADR 0006 Proposed Status",
      "0006 Decision"
    ]
  },
  "after": {
    "claimId": "claim_e482cc83d02ca103ac12e881c2a712ee",
    "sourceUnitDigest": "671d794492bb185f",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "unheaded-block-21",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "The label \"Ngữ nghĩa:\" and the two bullets it introduces (source lines 1485-1490) carried line for line into one block; the extraction rule attaches a short label ending in a colon to the block it introduces, in the candidate as in the source; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: work-state.md#unheaded-block-131 (L1485-1490) to decisions/retired-decision-history.md#unheaded-block-21 (L142-147): text byte-equal (read both ends, 244 chars), digests recomputed by extractor and by independent hash, anchor passes, ancestry 0006 Decision equals the shard; rationale line range, anchor and opening words match the unit",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "671d794492bb185fc86e5b1cdbca92dc3a96080e0bf8b4319c51715c7a88ca85",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "5. ADR 0006 Proposed Status",
      "0006 Decision"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_e482cc83d02ca103ac12e881c2a712ee",
    "sourceUnitDigest": "671d794492bb185f",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "unheaded-block-21",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "The label \"Ngữ nghĩa:\" and the two bullets it introduces (source lines 1485-1490) carried line for line into one block; the extraction rule attaches a short label ending in a colon to the block it introduces, in the candidate as in the source; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: work-state.md#unheaded-block-131 (L1485-1490) to decisions/retired-decision-history.md#unheaded-block-21 (L142-147): text byte-equal (read both ends, 244 chars), digests recomputed by extractor and by independent hash, anchor passes, ancestry 0006 Decision equals the shard; rationale line range, anchor and opening words match the unit",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "671d794492bb185fc86e5b1cdbca92dc3a96080e0bf8b4319c51715c7a88ca85",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "5. ADR 0006 Proposed Status",
      "0006 Decision"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-060"
}
```

