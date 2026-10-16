# Bounded re-review: decisions 7

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

## Entry decisions-061

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "collection": "claims",
  "claimId": "claim_e602fe2731b631f7be06ccebc5cf8e91",
  "before": {
    "claimId": "claim_e602fe2731b631f7be06ccebc5cf8e91",
    "sourceUnitDigest": "899175d57462b103",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "pending",
    "targetAnchor": "0006-consequences",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Section heading \"Hệ quả\" of ADR 0006 is represented by the frozen H3 \"0006 Consequences\"; the title differs (prefixed with the ADR number, English) but the section it opens is the same. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "783e9b5f2b2e44c3010507770e87c9785bcf8ff5b1aae09aecd902440090f996",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "5. ADR 0006 Proposed Status"
    ]
  },
  "after": {
    "claimId": "claim_e602fe2731b631f7be06ccebc5cf8e91",
    "sourceUnitDigest": "899175d57462b103",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "0006-consequences",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Section heading \"Hệ quả\" of ADR 0006 is represented by the frozen H3 \"0006 Consequences\"; the title differs (prefixed with the ADR number, English) but the section it opens is the same. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading H4 'Hệ quả' (work-state.md L1492) to H3 '0006 Consequences' (L149): title and depth change only, section payload and following-block digests equal on both sides (both digests recomputed independently), target ancestry names ADR 0006 like the source position, the frozen-heading quote in the rationale equals the target heading, depth H4 to H3 is a permitted depth-only change that the rationale does not name",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "783e9b5f2b2e44c3010507770e87c9785bcf8ff5b1aae09aecd902440090f996",
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
    "claimId": "claim_e602fe2731b631f7be06ccebc5cf8e91",
    "sourceUnitDigest": "899175d57462b103",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "0006-consequences",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Section heading \"Hệ quả\" of ADR 0006 is represented by the frozen H3 \"0006 Consequences\"; the title differs (prefixed with the ADR number, English) but the section it opens is the same. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading H4 'Hệ quả' (work-state.md L1492) to H3 '0006 Consequences' (L149): title and depth change only, section payload and following-block digests equal on both sides (both digests recomputed independently), target ancestry names ADR 0006 like the source position, the frozen-heading quote in the rationale equals the target heading, depth H4 to H3 is a permitted depth-only change that the rationale does not name",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "783e9b5f2b2e44c3010507770e87c9785bcf8ff5b1aae09aecd902440090f996",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "5. ADR 0006 Proposed Status"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-061"
}
```

## Entry decisions-062

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "collection": "claims",
  "claimId": "claim_453534a2ccfccba30980d90ae47b6e63",
  "before": {
    "claimId": "claim_453534a2ccfccba30980d90ae47b6e63",
    "sourceUnitDigest": "b7287de2ff36f57c",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "pending",
    "targetAnchor": "unheaded-block-22",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0006 (source lines 1494-1499, starting \"- **Ghép nối qua nhánh an toàn:** phụ thuộc chỉ mở khi dep đã vào cây \") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "b7287de2ff36f57cb44f105c8ee8d259283f0f6445670c63dbe90337489cf97d",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "5. ADR 0006 Proposed Status",
      "0006 Consequences"
    ]
  },
  "after": {
    "claimId": "claim_453534a2ccfccba30980d90ae47b6e63",
    "sourceUnitDigest": "b7287de2ff36f57c",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "unheaded-block-22",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0006 (source lines 1494-1499, starting \"- **Ghép nối qua nhánh an toàn:** phụ thuộc chỉ mở khi dep đã vào cây \") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: digests recomputed by extractor and independent hash and equal (text byte-equal), shard row equals pack, source and target anchors pass, ancestry 0006 Consequences equals the shard, rationale line range 1494-1499 and target anchor match the unit; text not re-read beyond byte equality",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "b7287de2ff36f57cb44f105c8ee8d259283f0f6445670c63dbe90337489cf97d",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "5. ADR 0006 Proposed Status",
      "0006 Consequences"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_453534a2ccfccba30980d90ae47b6e63",
    "sourceUnitDigest": "b7287de2ff36f57c",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "unheaded-block-22",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0006 (source lines 1494-1499, starting \"- **Ghép nối qua nhánh an toàn:** phụ thuộc chỉ mở khi dep đã vào cây \") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: digests recomputed by extractor and independent hash and equal (text byte-equal), shard row equals pack, source and target anchors pass, ancestry 0006 Consequences equals the shard, rationale line range 1494-1499 and target anchor match the unit; text not re-read beyond byte equality",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "b7287de2ff36f57cb44f105c8ee8d259283f0f6445670c63dbe90337489cf97d",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "5. ADR 0006 Proposed Status",
      "0006 Consequences"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-062"
}
```

## Entry decisions-063

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "collection": "claims",
  "claimId": "claim_ad95e550092bec4474133ac2a451649d",
  "before": {
    "claimId": "claim_ad95e550092bec4474133ac2a451649d",
    "sourceUnitDigest": "12602590029a0f3b",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "pending",
    "targetAnchor": "unheaded-block-23",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0006 (source lines 1501-1502, starting \"- Record này supersede **Tập trạng thái FSM của Phase 1 (spec work-sta\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "12602590029a0f3b8fe58c0ef444d33801cb9c512c751362f2532c0323235155",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "5. ADR 0006 Proposed Status",
      "0006 Consequences"
    ]
  },
  "after": {
    "claimId": "claim_ad95e550092bec4474133ac2a451649d",
    "sourceUnitDigest": "12602590029a0f3b",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "unheaded-block-23",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0006 (source lines 1501-1502, starting \"- Record này supersede **Tập trạng thái FSM của Phase 1 (spec work-sta\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: work-state.md#unheaded-block-133 (L1501-1502) to decisions/retired-decision-history.md#unheaded-block-23 (L158-159): text byte-equal (read both ends, 169 chars), digests recomputed by extractor and by independent hash, anchor passes, ancestry 0006 Consequences equals the shard; rationale line range, anchor and opening words match the unit",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "12602590029a0f3b8fe58c0ef444d33801cb9c512c751362f2532c0323235155",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "5. ADR 0006 Proposed Status",
      "0006 Consequences"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_ad95e550092bec4474133ac2a451649d",
    "sourceUnitDigest": "12602590029a0f3b",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "unheaded-block-23",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0006 (source lines 1501-1502, starting \"- Record này supersede **Tập trạng thái FSM của Phase 1 (spec work-sta\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: work-state.md#unheaded-block-133 (L1501-1502) to decisions/retired-decision-history.md#unheaded-block-23 (L158-159): text byte-equal (read both ends, 169 chars), digests recomputed by extractor and by independent hash, anchor passes, ancestry 0006 Consequences equals the shard; rationale line range, anchor and opening words match the unit",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "12602590029a0f3b8fe58c0ef444d33801cb9c512c751362f2532c0323235155",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "5. ADR 0006 Proposed Status",
      "0006 Consequences"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-063"
}
```

## Entry decisions-064

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "collection": "claims",
  "claimId": "claim_2f1ede55aaf8adff2f15c46ffc646e8d",
  "before": {
    "claimId": "claim_2f1ede55aaf8adff2f15c46ffc646e8d",
    "sourceUnitDigest": "0652eaa390a60c98",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "pending",
    "targetAnchor": "6-adr-0007-schema-and-event-evolution",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Source ADR 0007 title heading is represented by the frozen H2 \"6. ADR 0007 ...\" (6-adr-0007-schema-and-event-evolution); title is renumbered and re-worded in English, text of the record is unchanged. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "38c7e64350e2c0ead7dc9dab84c6ecc28918e7bb019e31a35b07fc88b495842f",
    "targetAncestry": [
      "Retired Decision History: Work State"
    ]
  },
  "after": {
    "claimId": "claim_2f1ede55aaf8adff2f15c46ffc646e8d",
    "sourceUnitDigest": "0652eaa390a60c98",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "6-adr-0007-schema-and-event-evolution",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Source ADR 0007 title heading is represented by the frozen H2 \"6. ADR 0007 ...\" (6-adr-0007-schema-and-event-evolution); title is renumbered and re-worded in English, text of the record is unchanged. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading H3 '0007 — Tiến hoá schema & event' (work-state.md L1504) to H2 '6. ADR 0007 Schema And Event Evolution' (L161): title and depth change only, section payload and following-block digests equal on both sides (both digests recomputed independently), target ancestry names ADR 0007 like the source position, the frozen-heading quote in the rationale equals the target heading, depth H3 to H2 is a permitted depth-only change that the rationale does not name",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "38c7e64350e2c0ead7dc9dab84c6ecc28918e7bb019e31a35b07fc88b495842f",
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
    "claimId": "claim_2f1ede55aaf8adff2f15c46ffc646e8d",
    "sourceUnitDigest": "0652eaa390a60c98",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "6-adr-0007-schema-and-event-evolution",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Source ADR 0007 title heading is represented by the frozen H2 \"6. ADR 0007 ...\" (6-adr-0007-schema-and-event-evolution); title is renumbered and re-worded in English, text of the record is unchanged. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading H3 '0007 — Tiến hoá schema & event' (work-state.md L1504) to H2 '6. ADR 0007 Schema And Event Evolution' (L161): title and depth change only, section payload and following-block digests equal on both sides (both digests recomputed independently), target ancestry names ADR 0007 like the source position, the frozen-heading quote in the rationale equals the target heading, depth H3 to H2 is a permitted depth-only change that the rationale does not name",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "38c7e64350e2c0ead7dc9dab84c6ecc28918e7bb019e31a35b07fc88b495842f",
    "targetAncestry": [
      "Retired Decision History: Work State"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-064"
}
```

## Entry decisions-065

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "collection": "claims",
  "claimId": "claim_208f5cc84da2b23ab24abde2c91c4f06",
  "before": {
    "claimId": "claim_208f5cc84da2b23ab24abde2c91c4f06",
    "sourceUnitDigest": "5483e14a0ec0d67c",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "pending",
    "targetAnchor": "0007-context",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Section heading \"Bối cảnh\" of ADR 0007 is represented by the frozen H3 \"0007 Context\"; the title differs (prefixed with the ADR number, English) but the section it opens is the same. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "ab86aba22bff4bd95dfd666582cad23d4a6f3c760c8cf86de79efdac597d4dd2",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "6. ADR 0007 Schema And Event Evolution"
    ]
  },
  "after": {
    "claimId": "claim_208f5cc84da2b23ab24abde2c91c4f06",
    "sourceUnitDigest": "5483e14a0ec0d67c",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "0007-context",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Section heading \"Bối cảnh\" of ADR 0007 is represented by the frozen H3 \"0007 Context\"; the title differs (prefixed with the ADR number, English) but the section it opens is the same. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading H4 'Bối cảnh' (work-state.md L1506) to H3 '0007 Context' (L163): title and depth change only, section payload and following-block digests equal on both sides (both digests recomputed independently), target ancestry names ADR 0007 like the source position, the frozen-heading quote in the rationale equals the target heading, depth H4 to H3 is a permitted depth-only change that the rationale does not name",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "ab86aba22bff4bd95dfd666582cad23d4a6f3c760c8cf86de79efdac597d4dd2",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "6. ADR 0007 Schema And Event Evolution"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_208f5cc84da2b23ab24abde2c91c4f06",
    "sourceUnitDigest": "5483e14a0ec0d67c",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "0007-context",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Section heading \"Bối cảnh\" of ADR 0007 is represented by the frozen H3 \"0007 Context\"; the title differs (prefixed with the ADR number, English) but the section it opens is the same. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading H4 'Bối cảnh' (work-state.md L1506) to H3 '0007 Context' (L163): title and depth change only, section payload and following-block digests equal on both sides (both digests recomputed independently), target ancestry names ADR 0007 like the source position, the frozen-heading quote in the rationale equals the target heading, depth H4 to H3 is a permitted depth-only change that the rationale does not name",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "ab86aba22bff4bd95dfd666582cad23d4a6f3c760c8cf86de79efdac597d4dd2",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "6. ADR 0007 Schema And Event Evolution"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-065"
}
```

## Entry decisions-066

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "collection": "claims",
  "claimId": "claim_5f4f81607ad69719e2fed9631a8dcd2b",
  "before": {
    "claimId": "claim_5f4f81607ad69719e2fed9631a8dcd2b",
    "sourceUnitDigest": "8dd703c9d39dc60b",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "pending",
    "targetAnchor": "unheaded-block-24",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0007 (source lines 1508-1510, starting \"Trạng thái `proposed` (0006) và trường `tier` (0005) **đổi shape dữ li\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "8dd703c9d39dc60ba48ae30e587eb759cc74eacd6680d54fbc831410a91eb791",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "6. ADR 0007 Schema And Event Evolution",
      "0007 Context"
    ]
  },
  "after": {
    "claimId": "claim_5f4f81607ad69719e2fed9631a8dcd2b",
    "sourceUnitDigest": "8dd703c9d39dc60b",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "unheaded-block-24",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0007 (source lines 1508-1510, starting \"Trạng thái `proposed` (0006) và trường `tier` (0005) **đổi shape dữ li\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: digests recomputed by extractor and independent hash and equal (text byte-equal), shard row equals pack, source and target anchors pass, ancestry 0007 Context equals the shard, rationale line range 1508-1510 and target anchor match the unit; text not re-read beyond byte equality",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "8dd703c9d39dc60ba48ae30e587eb759cc74eacd6680d54fbc831410a91eb791",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "6. ADR 0007 Schema And Event Evolution",
      "0007 Context"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_5f4f81607ad69719e2fed9631a8dcd2b",
    "sourceUnitDigest": "8dd703c9d39dc60b",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "unheaded-block-24",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0007 (source lines 1508-1510, starting \"Trạng thái `proposed` (0006) và trường `tier` (0005) **đổi shape dữ li\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: digests recomputed by extractor and independent hash and equal (text byte-equal), shard row equals pack, source and target anchors pass, ancestry 0007 Context equals the shard, rationale line range 1508-1510 and target anchor match the unit; text not re-read beyond byte equality",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "8dd703c9d39dc60ba48ae30e587eb759cc74eacd6680d54fbc831410a91eb791",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "6. ADR 0007 Schema And Event Evolution",
      "0007 Context"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-066"
}
```

## Entry decisions-067

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "collection": "claims",
  "claimId": "claim_886f9acc902249e303bacc887ffb9882",
  "before": {
    "claimId": "claim_886f9acc902249e303bacc887ffb9882",
    "sourceUnitDigest": "eb9a345fe658f7c4",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "pending",
    "targetAnchor": "0007-decision",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Section heading \"Quyết định\" of ADR 0007 is represented by the frozen H3 \"0007 Decision\"; the title differs (prefixed with the ADR number, English) but the section it opens is the same. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "08f6311c148ae29221fd5d1a3613d38b0e740914a3dcde683f27d48ee398de27",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "6. ADR 0007 Schema And Event Evolution"
    ]
  },
  "after": {
    "claimId": "claim_886f9acc902249e303bacc887ffb9882",
    "sourceUnitDigest": "eb9a345fe658f7c4",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "0007-decision",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Section heading \"Quyết định\" of ADR 0007 is represented by the frozen H3 \"0007 Decision\"; the title differs (prefixed with the ADR number, English) but the section it opens is the same. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading H4 'Quyết định' (work-state.md L1512) to H3 '0007 Decision' (L169): title and depth change only, section payload and following-block digests equal on both sides (both digests recomputed independently), target ancestry names ADR 0007 like the source position, the frozen-heading quote in the rationale equals the target heading, depth H4 to H3 is a permitted depth-only change that the rationale does not name",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "08f6311c148ae29221fd5d1a3613d38b0e740914a3dcde683f27d48ee398de27",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "6. ADR 0007 Schema And Event Evolution"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_886f9acc902249e303bacc887ffb9882",
    "sourceUnitDigest": "eb9a345fe658f7c4",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "0007-decision",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Section heading \"Quyết định\" of ADR 0007 is represented by the frozen H3 \"0007 Decision\"; the title differs (prefixed with the ADR number, English) but the section it opens is the same. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading H4 'Quyết định' (work-state.md L1512) to H3 '0007 Decision' (L169): title and depth change only, section payload and following-block digests equal on both sides (both digests recomputed independently), target ancestry names ADR 0007 like the source position, the frozen-heading quote in the rationale equals the target heading, depth H4 to H3 is a permitted depth-only change that the rationale does not name",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "08f6311c148ae29221fd5d1a3613d38b0e740914a3dcde683f27d48ee398de27",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "6. ADR 0007 Schema And Event Evolution"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-067"
}
```

## Entry decisions-068

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "collection": "claims",
  "claimId": "claim_37315ade5a8ca0c583456c157daaecba",
  "before": {
    "claimId": "claim_37315ade5a8ca0c583456c157daaecba",
    "sourceUnitDigest": "cc510df779670e7b",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "pending",
    "targetAnchor": "unheaded-block-25",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0007 (source lines 1514-1514, starting \"Ba luật cho mọi tiến hoá schema/event từ đây về sau:\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "cc510df779670e7b9c13293a5a14adce6a4890e98d58ab3de5cfca9ba1512f68",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "6. ADR 0007 Schema And Event Evolution",
      "0007 Decision"
    ]
  },
  "after": {
    "claimId": "claim_37315ade5a8ca0c583456c157daaecba",
    "sourceUnitDigest": "cc510df779670e7b",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "unheaded-block-25",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0007 (source lines 1514-1514, starting \"Ba luật cho mọi tiến hoá schema/event từ đây về sau:\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: digests recomputed by extractor and independent hash and equal (text byte-equal), shard row equals pack, source and target anchors pass, ancestry 0007 Decision equals the shard, rationale line range 1514-1514 and target anchor match the unit; text not re-read beyond byte equality",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "cc510df779670e7b9c13293a5a14adce6a4890e98d58ab3de5cfca9ba1512f68",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "6. ADR 0007 Schema And Event Evolution",
      "0007 Decision"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_37315ade5a8ca0c583456c157daaecba",
    "sourceUnitDigest": "cc510df779670e7b",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "unheaded-block-25",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0007 (source lines 1514-1514, starting \"Ba luật cho mọi tiến hoá schema/event từ đây về sau:\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: digests recomputed by extractor and independent hash and equal (text byte-equal), shard row equals pack, source and target anchors pass, ancestry 0007 Decision equals the shard, rationale line range 1514-1514 and target anchor match the unit; text not re-read beyond byte equality",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "cc510df779670e7b9c13293a5a14adce6a4890e98d58ab3de5cfca9ba1512f68",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "6. ADR 0007 Schema And Event Evolution",
      "0007 Decision"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-068"
}
```

## Entry decisions-069

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "collection": "claims",
  "claimId": "claim_4c29ddf395edf0a905c5cf76729c2d26",
  "before": {
    "claimId": "claim_4c29ddf395edf0a905c5cf76729c2d26",
    "sourceUnitDigest": "3544a54900acf99f",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "pending",
    "targetAnchor": "unheaded-block-26",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0007 (source lines 1516-1522, starting \"1. **Log đã commit là bất khả xâm phạm.** Không bao giờ chạy migration\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "3544a54900acf99fb0dc62fc6dad1f1d86468e495e95968a5c470efad2df6c8c",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "6. ADR 0007 Schema And Event Evolution",
      "0007 Decision"
    ]
  },
  "after": {
    "claimId": "claim_4c29ddf395edf0a905c5cf76729c2d26",
    "sourceUnitDigest": "3544a54900acf99f",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "unheaded-block-26",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0007 (source lines 1516-1522, starting \"1. **Log đã commit là bất khả xâm phạm.** Không bao giờ chạy migration\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: work-state.md#unheaded-block-136 (L1516-1522) to decisions/retired-decision-history.md#unheaded-block-26 (L173-179): text byte-equal (read both ends, 498 chars), digests recomputed by extractor and by independent hash, anchor passes, ancestry 0007 Decision equals the shard; rationale line range, anchor and opening words match the unit",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "3544a54900acf99fb0dc62fc6dad1f1d86468e495e95968a5c470efad2df6c8c",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "6. ADR 0007 Schema And Event Evolution",
      "0007 Decision"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_4c29ddf395edf0a905c5cf76729c2d26",
    "sourceUnitDigest": "3544a54900acf99f",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "unheaded-block-26",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0007 (source lines 1516-1522, starting \"1. **Log đã commit là bất khả xâm phạm.** Không bao giờ chạy migration\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: work-state.md#unheaded-block-136 (L1516-1522) to decisions/retired-decision-history.md#unheaded-block-26 (L173-179): text byte-equal (read both ends, 498 chars), digests recomputed by extractor and by independent hash, anchor passes, ancestry 0007 Decision equals the shard; rationale line range, anchor and opening words match the unit",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "3544a54900acf99fb0dc62fc6dad1f1d86468e495e95968a5c470efad2df6c8c",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "6. ADR 0007 Schema And Event Evolution",
      "0007 Decision"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-069"
}
```

## Entry decisions-070

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "collection": "claims",
  "claimId": "claim_9faf2f6fcfad6a089f7077f61abb3b56",
  "before": {
    "claimId": "claim_9faf2f6fcfad6a089f7077f61abb3b56",
    "sourceUnitDigest": "e5123dd05236e7c9",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "pending",
    "targetAnchor": "0007-consequences",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Section heading \"Hệ quả\" of ADR 0007 is represented by the frozen H3 \"0007 Consequences\"; the title differs (prefixed with the ADR number, English) but the section it opens is the same. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "55d9c1f19dff0d40bd97abcc406422ba20f7091135f9eaa20462af0bb2388f82",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "6. ADR 0007 Schema And Event Evolution"
    ]
  },
  "after": {
    "claimId": "claim_9faf2f6fcfad6a089f7077f61abb3b56",
    "sourceUnitDigest": "e5123dd05236e7c9",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "0007-consequences",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Section heading \"Hệ quả\" of ADR 0007 is represented by the frozen H3 \"0007 Consequences\"; the title differs (prefixed with the ADR number, English) but the section it opens is the same. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading H4 'Hệ quả' (work-state.md L1524) to H3 '0007 Consequences' (L181): title and depth change only, section payload and following-block digests equal on both sides (both digests recomputed independently), target ancestry names ADR 0007 like the source position, the frozen-heading quote in the rationale equals the target heading, depth H4 to H3 is a permitted depth-only change that the rationale does not name",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "55d9c1f19dff0d40bd97abcc406422ba20f7091135f9eaa20462af0bb2388f82",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "6. ADR 0007 Schema And Event Evolution"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_9faf2f6fcfad6a089f7077f61abb3b56",
    "sourceUnitDigest": "e5123dd05236e7c9",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "0007-consequences",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Section heading \"Hệ quả\" of ADR 0007 is represented by the frozen H3 \"0007 Consequences\"; the title differs (prefixed with the ADR number, English) but the section it opens is the same. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading H4 'Hệ quả' (work-state.md L1524) to H3 '0007 Consequences' (L181): title and depth change only, section payload and following-block digests equal on both sides (both digests recomputed independently), target ancestry names ADR 0007 like the source position, the frozen-heading quote in the rationale equals the target heading, depth H4 to H3 is a permitted depth-only change that the rationale does not name",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "55d9c1f19dff0d40bd97abcc406422ba20f7091135f9eaa20462af0bb2388f82",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "6. ADR 0007 Schema And Event Evolution"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-070"
}
```

## Entry decisions-071

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "collection": "claims",
  "claimId": "claim_d0aa35a58456de6d8e5f552bdad1b08c",
  "before": {
    "claimId": "claim_d0aa35a58456de6d8e5f552bdad1b08c",
    "sourceUnitDigest": "a7f8e3a1618320c0",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "pending",
    "targetAnchor": "unheaded-block-27",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0007 (source lines 1526-1531, starting \"- **Log là hợp đồng tiến-tới:** thêm trường an toàn; đổi ngữ nghĩa thì\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "a7f8e3a1618320c0c7ba6fa420ed0cb2286a83cae90d38e2052382c0cb0ed649",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "6. ADR 0007 Schema And Event Evolution",
      "0007 Consequences"
    ]
  },
  "after": {
    "claimId": "claim_d0aa35a58456de6d8e5f552bdad1b08c",
    "sourceUnitDigest": "a7f8e3a1618320c0",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "unheaded-block-27",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0007 (source lines 1526-1531, starting \"- **Log là hợp đồng tiến-tới:** thêm trường an toàn; đổi ngữ nghĩa thì\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: work-state.md#unheaded-block-137 (L1526-1531) to decisions/retired-decision-history.md#unheaded-block-27 (L183-188): text byte-equal (read both ends, 346 chars), digests recomputed by extractor and by independent hash, anchor passes, ancestry 0007 Consequences equals the shard; rationale line range, anchor and opening words match the unit",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "a7f8e3a1618320c0c7ba6fa420ed0cb2286a83cae90d38e2052382c0cb0ed649",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "6. ADR 0007 Schema And Event Evolution",
      "0007 Consequences"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_d0aa35a58456de6d8e5f552bdad1b08c",
    "sourceUnitDigest": "a7f8e3a1618320c0",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "unheaded-block-27",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0007 (source lines 1526-1531, starting \"- **Log là hợp đồng tiến-tới:** thêm trường an toàn; đổi ngữ nghĩa thì\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: work-state.md#unheaded-block-137 (L1526-1531) to decisions/retired-decision-history.md#unheaded-block-27 (L183-188): text byte-equal (read both ends, 346 chars), digests recomputed by extractor and by independent hash, anchor passes, ancestry 0007 Consequences equals the shard; rationale line range, anchor and opening words match the unit",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "a7f8e3a1618320c0c7ba6fa420ed0cb2286a83cae90d38e2052382c0cb0ed649",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "6. ADR 0007 Schema And Event Evolution",
      "0007 Consequences"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-071"
}
```

## Entry decisions-072

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "collection": "claims",
  "claimId": "claim_576e295be7d60ab95a555f11ada15da5",
  "before": {
    "claimId": "claim_576e295be7d60ab95a555f11ada15da5",
    "sourceUnitDigest": "95a357e29712c3c0",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "pending",
    "targetAnchor": "unheaded-block-28",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Supersession-rule line of ADR 0007 (change by superseding with a new record) carried verbatim at the end of its consequences section; the located suggestion pointed at the first identical copy, so the anchor was set to this ADR's own block. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "6. ADR 0007 Schema And Event Evolution",
      "0007 Consequences"
    ]
  },
  "after": {
    "claimId": "claim_576e295be7d60ab95a555f11ada15da5",
    "sourceUnitDigest": "95a357e29712c3c0",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "unheaded-block-28",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Supersession-rule line of ADR 0007 (change by superseding with a new record) carried verbatim at the end of its consequences section; the located suggestion pointed at the first identical copy, so the anchor was set to this ADR's own block. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: digests recomputed by extractor and independent hash and equal (text byte-equal), shard row equals pack, source and target anchors pass, ancestry 0007 Consequences equals the shard, rationale line range 1533-1533 and target anchor match the unit; text not re-read beyond byte equality",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "6. ADR 0007 Schema And Event Evolution",
      "0007 Consequences"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_576e295be7d60ab95a555f11ada15da5",
    "sourceUnitDigest": "95a357e29712c3c0",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "unheaded-block-28",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Supersession-rule line of ADR 0007 (change by superseding with a new record) carried verbatim at the end of its consequences section; the located suggestion pointed at the first identical copy, so the anchor was set to this ADR's own block. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: digests recomputed by extractor and independent hash and equal (text byte-equal), shard row equals pack, source and target anchors pass, ancestry 0007 Consequences equals the shard, rationale line range 1533-1533 and target anchor match the unit; text not re-read beyond byte equality",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "6. ADR 0007 Schema And Event Evolution",
      "0007 Consequences"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-072"
}
```

## Entry decisions-073

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "collection": "claims",
  "claimId": "claim_e375b70390617716823280eb03a82a87",
  "before": {
    "claimId": "claim_e375b70390617716823280eb03a82a87",
    "sourceUnitDigest": "520a09658b949755",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "pending",
    "targetAnchor": "7-adr-0011-explicit-version-for-every-contract",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Source ADR 0011 title heading is represented by the frozen H2 \"7. ADR 0011 ...\" (7-adr-0011-explicit-version-for-every-contract); title is renumbered and re-worded in English, text of the record is unchanged. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "7b520a895337dc7ea9a23e4bcc1debc386a39fc1e8120673d0aa77ea4a309457",
    "targetAncestry": [
      "Retired Decision History: Work State"
    ]
  },
  "after": {
    "claimId": "claim_e375b70390617716823280eb03a82a87",
    "sourceUnitDigest": "520a09658b949755",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "7-adr-0011-explicit-version-for-every-contract",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Source ADR 0011 title heading is represented by the frozen H2 \"7. ADR 0011 ...\" (7-adr-0011-explicit-version-for-every-contract); title is renumbered and re-worded in English, text of the record is unchanged. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading H3 '0011 — Version tường minh cho mọi contract' (work-state.md L1535) to H2 '7. ADR 0011 Explicit Version For Every Contract' (L192): title and depth change only, section payload and following-block digests equal on both sides (both digests recomputed independently), target ancestry names ADR 0011 like the source position, the frozen-heading quote in the rationale equals the target heading, depth H3 to H2 is a permitted depth-only change that the rationale does not name",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "7b520a895337dc7ea9a23e4bcc1debc386a39fc1e8120673d0aa77ea4a309457",
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
    "claimId": "claim_e375b70390617716823280eb03a82a87",
    "sourceUnitDigest": "520a09658b949755",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "7-adr-0011-explicit-version-for-every-contract",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Source ADR 0011 title heading is represented by the frozen H2 \"7. ADR 0011 ...\" (7-adr-0011-explicit-version-for-every-contract); title is renumbered and re-worded in English, text of the record is unchanged. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading H3 '0011 — Version tường minh cho mọi contract' (work-state.md L1535) to H2 '7. ADR 0011 Explicit Version For Every Contract' (L192): title and depth change only, section payload and following-block digests equal on both sides (both digests recomputed independently), target ancestry names ADR 0011 like the source position, the frozen-heading quote in the rationale equals the target heading, depth H3 to H2 is a permitted depth-only change that the rationale does not name",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "7b520a895337dc7ea9a23e4bcc1debc386a39fc1e8120673d0aa77ea4a309457",
    "targetAncestry": [
      "Retired Decision History: Work State"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-073"
}
```

## Entry decisions-074

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "collection": "claims",
  "claimId": "claim_a93bf40197e2bf32890a9cf931226e15",
  "before": {
    "claimId": "claim_a93bf40197e2bf32890a9cf931226e15",
    "sourceUnitDigest": "f0e519e3d177081f",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "pending",
    "targetAnchor": "0011-context",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Section heading \"Bối cảnh\" of ADR 0011 is represented by the frozen H3 \"0011 Context\"; the title differs (prefixed with the ADR number, English) but the section it opens is the same. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "e113b11d301e876e8e3b3d3f59eca420dab2ea0aa6f3adc8d3ac076de93317d4",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "7. ADR 0011 Explicit Version For Every Contract"
    ]
  },
  "after": {
    "claimId": "claim_a93bf40197e2bf32890a9cf931226e15",
    "sourceUnitDigest": "f0e519e3d177081f",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "0011-context",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Section heading \"Bối cảnh\" of ADR 0011 is represented by the frozen H3 \"0011 Context\"; the title differs (prefixed with the ADR number, English) but the section it opens is the same. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading H4 'Bối cảnh' (work-state.md L1537) to H3 '0011 Context' (L194): title and depth change only, section payload and following-block digests equal on both sides (both digests recomputed independently), target ancestry names ADR 0011 like the source position, the frozen-heading quote in the rationale equals the target heading, depth H4 to H3 is a permitted depth-only change that the rationale does not name",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "e113b11d301e876e8e3b3d3f59eca420dab2ea0aa6f3adc8d3ac076de93317d4",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "7. ADR 0011 Explicit Version For Every Contract"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_a93bf40197e2bf32890a9cf931226e15",
    "sourceUnitDigest": "f0e519e3d177081f",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "0011-context",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Section heading \"Bối cảnh\" of ADR 0011 is represented by the frozen H3 \"0011 Context\"; the title differs (prefixed with the ADR number, English) but the section it opens is the same. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading H4 'Bối cảnh' (work-state.md L1537) to H3 '0011 Context' (L194): title and depth change only, section payload and following-block digests equal on both sides (both digests recomputed independently), target ancestry names ADR 0011 like the source position, the frozen-heading quote in the rationale equals the target heading, depth H4 to H3 is a permitted depth-only change that the rationale does not name",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "e113b11d301e876e8e3b3d3f59eca420dab2ea0aa6f3adc8d3ac076de93317d4",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "7. ADR 0011 Explicit Version For Every Contract"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-074"
}
```

## Entry decisions-075

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "collection": "claims",
  "claimId": "claim_bad3eb429a52fae0b9100c7468c2d4d6",
  "before": {
    "claimId": "claim_bad3eb429a52fae0b9100c7468c2d4d6",
    "sourceUnitDigest": "3a9e4da78591f573",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "pending",
    "targetAnchor": "unheaded-block-29",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0011 (source lines 1539-1545, starting \"0007 đã khoá \"mỗi **event** mang trường schema version\". Nhưng fgOS kh\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "3a9e4da78591f573c1cf6b4019c03802f81d41c30be8ea815acaf95df65824bc",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "7. ADR 0011 Explicit Version For Every Contract",
      "0011 Context"
    ]
  },
  "after": {
    "claimId": "claim_bad3eb429a52fae0b9100c7468c2d4d6",
    "sourceUnitDigest": "3a9e4da78591f573",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "unheaded-block-29",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0011 (source lines 1539-1545, starting \"0007 đã khoá \"mỗi **event** mang trường schema version\". Nhưng fgOS kh\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: digests recomputed by extractor and independent hash and equal (text byte-equal), shard row equals pack, source and target anchors pass, ancestry 0011 Context equals the shard, rationale line range 1539-1545 and target anchor match the unit; text not re-read beyond byte equality",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "3a9e4da78591f573c1cf6b4019c03802f81d41c30be8ea815acaf95df65824bc",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "7. ADR 0011 Explicit Version For Every Contract",
      "0011 Context"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_bad3eb429a52fae0b9100c7468c2d4d6",
    "sourceUnitDigest": "3a9e4da78591f573",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "unheaded-block-29",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0011 (source lines 1539-1545, starting \"0007 đã khoá \"mỗi **event** mang trường schema version\". Nhưng fgOS kh\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: digests recomputed by extractor and independent hash and equal (text byte-equal), shard row equals pack, source and target anchors pass, ancestry 0011 Context equals the shard, rationale line range 1539-1545 and target anchor match the unit; text not re-read beyond byte equality",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "3a9e4da78591f573c1cf6b4019c03802f81d41c30be8ea815acaf95df65824bc",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "7. ADR 0011 Explicit Version For Every Contract",
      "0011 Context"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-075"
}
```

## Entry decisions-076

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "collection": "claims",
  "claimId": "claim_33c9953761a4fe99a4072b008cefc634",
  "before": {
    "claimId": "claim_33c9953761a4fe99a4072b008cefc634",
    "sourceUnitDigest": "f0eb277249c05d98",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "pending",
    "targetAnchor": "unheaded-block-30",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0011 (source lines 1547-1554, starting \"Bằng chứng sống trong chính workshop: bee (harness phát triển cạnh fgO\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "f0eb277249c05d987db88e8f1d6b6889788206f611c9b07aa9dc74e49982edee",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "7. ADR 0011 Explicit Version For Every Contract",
      "0011 Context"
    ]
  },
  "after": {
    "claimId": "claim_33c9953761a4fe99a4072b008cefc634",
    "sourceUnitDigest": "f0eb277249c05d98",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "unheaded-block-30",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0011 (source lines 1547-1554, starting \"Bằng chứng sống trong chính workshop: bee (harness phát triển cạnh fgO\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: digests recomputed by extractor and independent hash and equal (text byte-equal), shard row equals pack, source and target anchors pass, ancestry 0011 Context equals the shard, rationale line range 1547-1554 and target anchor match the unit; text not re-read beyond byte equality",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "f0eb277249c05d987db88e8f1d6b6889788206f611c9b07aa9dc74e49982edee",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "7. ADR 0011 Explicit Version For Every Contract",
      "0011 Context"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_33c9953761a4fe99a4072b008cefc634",
    "sourceUnitDigest": "f0eb277249c05d98",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "unheaded-block-30",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0011 (source lines 1547-1554, starting \"Bằng chứng sống trong chính workshop: bee (harness phát triển cạnh fgO\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: digests recomputed by extractor and independent hash and equal (text byte-equal), shard row equals pack, source and target anchors pass, ancestry 0011 Context equals the shard, rationale line range 1547-1554 and target anchor match the unit; text not re-read beyond byte equality",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "f0eb277249c05d987db88e8f1d6b6889788206f611c9b07aa9dc74e49982edee",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "7. ADR 0011 Explicit Version For Every Contract",
      "0011 Context"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-076"
}
```

## Entry decisions-077

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "collection": "claims",
  "claimId": "claim_ff4510bb2afe125aedac972ed943ce2c",
  "before": {
    "claimId": "claim_ff4510bb2afe125aedac972ed943ce2c",
    "sourceUnitDigest": "03f45ad00ec7a12c",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "pending",
    "targetAnchor": "0011-decision",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Section heading \"Quyết định\" of ADR 0011 is represented by the frozen H3 \"0011 Decision\"; the title differs (prefixed with the ADR number, English) but the section it opens is the same. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "28cc1686008a465c5f12c2c878349dc018dd023ba3dbd514689390ca5ac61776",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "7. ADR 0011 Explicit Version For Every Contract"
    ]
  },
  "after": {
    "claimId": "claim_ff4510bb2afe125aedac972ed943ce2c",
    "sourceUnitDigest": "03f45ad00ec7a12c",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "0011-decision",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Section heading \"Quyết định\" of ADR 0011 is represented by the frozen H3 \"0011 Decision\"; the title differs (prefixed with the ADR number, English) but the section it opens is the same. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading H4 'Quyết định' (work-state.md L1556) to H3 '0011 Decision' (L213): title and depth change only, section payload and following-block digests equal on both sides (both digests recomputed independently), target ancestry names ADR 0011 like the source position, the frozen-heading quote in the rationale equals the target heading, depth H4 to H3 is a permitted depth-only change that the rationale does not name",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "28cc1686008a465c5f12c2c878349dc018dd023ba3dbd514689390ca5ac61776",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "7. ADR 0011 Explicit Version For Every Contract"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_ff4510bb2afe125aedac972ed943ce2c",
    "sourceUnitDigest": "03f45ad00ec7a12c",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "0011-decision",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Section heading \"Quyết định\" of ADR 0011 is represented by the frozen H3 \"0011 Decision\"; the title differs (prefixed with the ADR number, English) but the section it opens is the same. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading H4 'Quyết định' (work-state.md L1556) to H3 '0011 Decision' (L213): title and depth change only, section payload and following-block digests equal on both sides (both digests recomputed independently), target ancestry names ADR 0011 like the source position, the frozen-heading quote in the rationale equals the target heading, depth H4 to H3 is a permitted depth-only change that the rationale does not name",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "28cc1686008a465c5f12c2c878349dc018dd023ba3dbd514689390ca5ac61776",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "7. ADR 0011 Explicit Version For Every Contract"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-077"
}
```

## Entry decisions-078

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "collection": "claims",
  "claimId": "claim_50eed5d7ed0c4f2107e50cca1ffcee82",
  "before": {
    "claimId": "claim_50eed5d7ed0c4f2107e50cca1ffcee82",
    "sourceUnitDigest": "4746d446f503df65",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "pending",
    "targetAnchor": "unheaded-block-31",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0011 (source lines 1558-1561, starting \"Ba loại contract fgOS expose ra ngoài code của nó — **schema** (shape \") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "4746d446f503df656947b8c1b4b27210c2d5c43ef909cd2aacb0d99c93bbe6c3",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "7. ADR 0011 Explicit Version For Every Contract",
      "0011 Decision"
    ]
  },
  "after": {
    "claimId": "claim_50eed5d7ed0c4f2107e50cca1ffcee82",
    "sourceUnitDigest": "4746d446f503df65",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "unheaded-block-31",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0011 (source lines 1558-1561, starting \"Ba loại contract fgOS expose ra ngoài code của nó — **schema** (shape \") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: digests recomputed by extractor and independent hash and equal (text byte-equal), shard row equals pack, source and target anchors pass, ancestry 0011 Decision equals the shard, rationale line range 1558-1561 and target anchor match the unit; text not re-read beyond byte equality",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "4746d446f503df656947b8c1b4b27210c2d5c43ef909cd2aacb0d99c93bbe6c3",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "7. ADR 0011 Explicit Version For Every Contract",
      "0011 Decision"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_50eed5d7ed0c4f2107e50cca1ffcee82",
    "sourceUnitDigest": "4746d446f503df65",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "unheaded-block-31",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0011 (source lines 1558-1561, starting \"Ba loại contract fgOS expose ra ngoài code của nó — **schema** (shape \") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: digests recomputed by extractor and independent hash and equal (text byte-equal), shard row equals pack, source and target anchors pass, ancestry 0011 Decision equals the shard, rationale line range 1558-1561 and target anchor match the unit; text not re-read beyond byte equality",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "4746d446f503df656947b8c1b4b27210c2d5c43ef909cd2aacb0d99c93bbe6c3",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "7. ADR 0011 Explicit Version For Every Contract",
      "0011 Decision"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-078"
}
```

## Entry decisions-079

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "collection": "claims",
  "claimId": "claim_6346dec77f2dff715949806586e100d3",
  "before": {
    "claimId": "claim_6346dec77f2dff715949806586e100d3",
    "sourceUnitDigest": "f665548de1acd2a9",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "pending",
    "targetAnchor": "unheaded-block-32",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0011 (source lines 1563-1575, starting \"1. **Artifact có shape ổn định mang `contract: <name>/v<N>`** trong\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "f665548de1acd2a9a08cd71ec99df897a2876584b3b987c25faf5a40c4ebfaa0",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "7. ADR 0011 Explicit Version For Every Contract",
      "0011 Decision"
    ]
  },
  "after": {
    "claimId": "claim_6346dec77f2dff715949806586e100d3",
    "sourceUnitDigest": "f665548de1acd2a9",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "unheaded-block-32",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0011 (source lines 1563-1575, starting \"1. **Artifact có shape ổn định mang `contract: <name>/v<N>`** trong\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: digests recomputed by extractor and independent hash and equal (text byte-equal), shard row equals pack, source and target anchors pass, ancestry 0011 Decision equals the shard, rationale line range 1563-1575 and target anchor match the unit; text not re-read beyond byte equality",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "f665548de1acd2a9a08cd71ec99df897a2876584b3b987c25faf5a40c4ebfaa0",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "7. ADR 0011 Explicit Version For Every Contract",
      "0011 Decision"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_6346dec77f2dff715949806586e100d3",
    "sourceUnitDigest": "f665548de1acd2a9",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "unheaded-block-32",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0011 (source lines 1563-1575, starting \"1. **Artifact có shape ổn định mang `contract: <name>/v<N>`** trong\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: digests recomputed by extractor and independent hash and equal (text byte-equal), shard row equals pack, source and target anchors pass, ancestry 0011 Decision equals the shard, rationale line range 1563-1575 and target anchor match the unit; text not re-read beyond byte equality",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "f665548de1acd2a9a08cd71ec99df897a2876584b3b987c25faf5a40c4ebfaa0",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "7. ADR 0011 Explicit Version For Every Contract",
      "0011 Decision"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-079"
}
```

## Entry decisions-080

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "collection": "claims",
  "claimId": "claim_0dd6189a9d8ed1bcdd656127bf71774e",
  "before": {
    "claimId": "claim_0dd6189a9d8ed1bcdd656127bf71774e",
    "sourceUnitDigest": "3bd6300879f149e8",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "pending",
    "targetAnchor": "0011-consequences",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Section heading \"Hệ quả\" of ADR 0011 is represented by the frozen H3 \"0011 Consequences\"; the title differs (prefixed with the ADR number, English) but the section it opens is the same. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "54a5977501d4d13b842a24d99b66e4591c4b04006f57477f35b248e444d7585c",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "7. ADR 0011 Explicit Version For Every Contract"
    ]
  },
  "after": {
    "claimId": "claim_0dd6189a9d8ed1bcdd656127bf71774e",
    "sourceUnitDigest": "3bd6300879f149e8",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "0011-consequences",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Section heading \"Hệ quả\" of ADR 0011 is represented by the frozen H3 \"0011 Consequences\"; the title differs (prefixed with the ADR number, English) but the section it opens is the same. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading H4 'Hệ quả' (work-state.md L1577) to H3 '0011 Consequences' (L234): title and depth change only, section payload and following-block digests equal on both sides (both digests recomputed independently), target ancestry names ADR 0011 like the source position, the frozen-heading quote in the rationale equals the target heading, depth H4 to H3 is a permitted depth-only change that the rationale does not name",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "54a5977501d4d13b842a24d99b66e4591c4b04006f57477f35b248e444d7585c",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "7. ADR 0011 Explicit Version For Every Contract"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_0dd6189a9d8ed1bcdd656127bf71774e",
    "sourceUnitDigest": "3bd6300879f149e8",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "0011-consequences",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Section heading \"Hệ quả\" of ADR 0011 is represented by the frozen H3 \"0011 Consequences\"; the title differs (prefixed with the ADR number, English) but the section it opens is the same. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading H4 'Hệ quả' (work-state.md L1577) to H3 '0011 Consequences' (L234): title and depth change only, section payload and following-block digests equal on both sides (both digests recomputed independently), target ancestry names ADR 0011 like the source position, the frozen-heading quote in the rationale equals the target heading, depth H4 to H3 is a permitted depth-only change that the rationale does not name",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "54a5977501d4d13b842a24d99b66e4591c4b04006f57477f35b248e444d7585c",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "7. ADR 0011 Explicit Version For Every Contract"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-080"
}
```

## Entry decisions-081

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "collection": "claims",
  "claimId": "claim_9be26c9507109484cc9b1663ca4ca2d9",
  "before": {
    "claimId": "claim_9be26c9507109484cc9b1663ca4ca2d9",
    "sourceUnitDigest": "da125878208e7de6",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "pending",
    "targetAnchor": "unheaded-block-33",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0011 (source lines 1579-1585, starting \"- **0007 không bị supersede** — 0011 mở rộng phạm vi (event → +schema,\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "da125878208e7de6ec45f980e4c8e5bbef2d5e53eadc5474c893b29a4e85beb1",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "7. ADR 0011 Explicit Version For Every Contract",
      "0011 Consequences"
    ]
  },
  "after": {
    "claimId": "claim_9be26c9507109484cc9b1663ca4ca2d9",
    "sourceUnitDigest": "da125878208e7de6",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "unheaded-block-33",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0011 (source lines 1579-1585, starting \"- **0007 không bị supersede** — 0011 mở rộng phạm vi (event → +schema,\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: digests recomputed by extractor and independent hash and equal (text byte-equal), shard row equals pack, source and target anchors pass, ancestry 0011 Consequences equals the shard, rationale line range 1579-1585 and target anchor match the unit; text not re-read beyond byte equality",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "da125878208e7de6ec45f980e4c8e5bbef2d5e53eadc5474c893b29a4e85beb1",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "7. ADR 0011 Explicit Version For Every Contract",
      "0011 Consequences"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_9be26c9507109484cc9b1663ca4ca2d9",
    "sourceUnitDigest": "da125878208e7de6",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "unheaded-block-33",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0011 (source lines 1579-1585, starting \"- **0007 không bị supersede** — 0011 mở rộng phạm vi (event → +schema,\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: digests recomputed by extractor and independent hash and equal (text byte-equal), shard row equals pack, source and target anchors pass, ancestry 0011 Consequences equals the shard, rationale line range 1579-1585 and target anchor match the unit; text not re-read beyond byte equality",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "da125878208e7de6ec45f980e4c8e5bbef2d5e53eadc5474c893b29a4e85beb1",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "7. ADR 0011 Explicit Version For Every Contract",
      "0011 Consequences"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-081"
}
```

## Entry decisions-082

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "collection": "claims",
  "claimId": "claim_08dc68ef23395b8f3f5b095508348e00",
  "before": {
    "claimId": "claim_08dc68ef23395b8f3f5b095508348e00",
    "sourceUnitDigest": "95a357e29712c3c0",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "pending",
    "targetAnchor": "unheaded-block-34",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Supersession-rule line of ADR 0011 (change by superseding with a new record) carried verbatim at the end of its consequences section; the located suggestion pointed at the first identical copy, so the anchor was set to this ADR's own block. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "7. ADR 0011 Explicit Version For Every Contract",
      "0011 Consequences"
    ]
  },
  "after": {
    "claimId": "claim_08dc68ef23395b8f3f5b095508348e00",
    "sourceUnitDigest": "95a357e29712c3c0",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "unheaded-block-34",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Supersession-rule line of ADR 0011 (change by superseding with a new record) carried verbatim at the end of its consequences section; the located suggestion pointed at the first identical copy, so the anchor was set to this ADR's own block. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: digests recomputed by extractor and independent hash and equal (text byte-equal), shard row equals pack, source and target anchors pass, ancestry 0011 Consequences equals the shard, rationale line range 1587-1587 and target anchor match the unit; text not re-read beyond byte equality",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "7. ADR 0011 Explicit Version For Every Contract",
      "0011 Consequences"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_08dc68ef23395b8f3f5b095508348e00",
    "sourceUnitDigest": "95a357e29712c3c0",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "unheaded-block-34",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Supersession-rule line of ADR 0011 (change by superseding with a new record) carried verbatim at the end of its consequences section; the located suggestion pointed at the first identical copy, so the anchor was set to this ADR's own block. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: digests recomputed by extractor and independent hash and equal (text byte-equal), shard row equals pack, source and target anchors pass, ancestry 0011 Consequences equals the shard, rationale line range 1587-1587 and target anchor match the unit; text not re-read beyond byte equality",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "7. ADR 0011 Explicit Version For Every Contract",
      "0011 Consequences"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-082"
}
```

## Entry decisions-083

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "collection": "claims",
  "claimId": "claim_e3c928a8fca5c645487d1b574f0c5d36",
  "before": {
    "claimId": "claim_e3c928a8fca5c645487d1b574f0c5d36",
    "sourceUnitDigest": "9b3ff4bedb1e8747",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "pending",
    "targetAnchor": "8-adr-0012-unified-typed-edge-graph-model",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Source ADR 0012 title heading is represented by the frozen H2 \"8. ADR 0012 ...\" (8-adr-0012-unified-typed-edge-graph-model); title is renumbered and re-worded in English, text of the record is unchanged. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "e9c5857a60ea685d3aab78eae8e2b44b7d96e10698e4764d4a8b109e54f47f45",
    "targetAncestry": [
      "Retired Decision History: Work State"
    ]
  },
  "after": {
    "claimId": "claim_e3c928a8fca5c645487d1b574f0c5d36",
    "sourceUnitDigest": "9b3ff4bedb1e8747",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "8-adr-0012-unified-typed-edge-graph-model",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Source ADR 0012 title heading is represented by the frozen H2 \"8. ADR 0012 ...\" (8-adr-0012-unified-typed-edge-graph-model); title is renumbered and re-worded in English, text of the record is unchanged. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading H3 '0012 — Mô hình đồ thị cạnh-định-kiểu hợp nhất thay thế deps/parent tách rời' (work-state.md L1589) to H2 '8. ADR 0012 Unified Typed-Edge Graph Model' (L246): title and depth change only, section payload and following-block digests equal on both sides (both digests recomputed independently), target ancestry names ADR 0012 like the source position, the frozen-heading quote in the rationale equals the target heading, depth H3 to H2 is a permitted depth-only change that the rationale does not name",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "e9c5857a60ea685d3aab78eae8e2b44b7d96e10698e4764d4a8b109e54f47f45",
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
    "claimId": "claim_e3c928a8fca5c645487d1b574f0c5d36",
    "sourceUnitDigest": "9b3ff4bedb1e8747",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "8-adr-0012-unified-typed-edge-graph-model",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Source ADR 0012 title heading is represented by the frozen H2 \"8. ADR 0012 ...\" (8-adr-0012-unified-typed-edge-graph-model); title is renumbered and re-worded in English, text of the record is unchanged. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading H3 '0012 — Mô hình đồ thị cạnh-định-kiểu hợp nhất thay thế deps/parent tách rời' (work-state.md L1589) to H2 '8. ADR 0012 Unified Typed-Edge Graph Model' (L246): title and depth change only, section payload and following-block digests equal on both sides (both digests recomputed independently), target ancestry names ADR 0012 like the source position, the frozen-heading quote in the rationale equals the target heading, depth H3 to H2 is a permitted depth-only change that the rationale does not name",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "e9c5857a60ea685d3aab78eae8e2b44b7d96e10698e4764d4a8b109e54f47f45",
    "targetAncestry": [
      "Retired Decision History: Work State"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-083"
}
```

## Entry decisions-084

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "collection": "claims",
  "claimId": "claim_386a8c90d7f9d79a52190add7a82f33f",
  "before": {
    "claimId": "claim_386a8c90d7f9d79a52190add7a82f33f",
    "sourceUnitDigest": "95bdd9de256a67e0",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "pending",
    "targetAnchor": "0012-context",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Section heading \"Bối cảnh\" of ADR 0012 is represented by the frozen H3 \"0012 Context\"; the title differs (prefixed with the ADR number, English) but the section it opens is the same. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "0dc5cda4fa7fbd44208f88a810d9e6f77a67e9efa236041735d82bad31cd0158",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "8. ADR 0012 Unified Typed-Edge Graph Model"
    ]
  },
  "after": {
    "claimId": "claim_386a8c90d7f9d79a52190add7a82f33f",
    "sourceUnitDigest": "95bdd9de256a67e0",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "0012-context",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Section heading \"Bối cảnh\" of ADR 0012 is represented by the frozen H3 \"0012 Context\"; the title differs (prefixed with the ADR number, English) but the section it opens is the same. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading H4 'Bối cảnh' (work-state.md L1591) to H3 '0012 Context' (L248): title and depth change only, section payload and following-block digests equal on both sides (both digests recomputed independently), target ancestry names ADR 0012 like the source position, the frozen-heading quote in the rationale equals the target heading, depth H4 to H3 is a permitted depth-only change that the rationale does not name",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "0dc5cda4fa7fbd44208f88a810d9e6f77a67e9efa236041735d82bad31cd0158",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "8. ADR 0012 Unified Typed-Edge Graph Model"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_386a8c90d7f9d79a52190add7a82f33f",
    "sourceUnitDigest": "95bdd9de256a67e0",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "0012-context",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Section heading \"Bối cảnh\" of ADR 0012 is represented by the frozen H3 \"0012 Context\"; the title differs (prefixed with the ADR number, English) but the section it opens is the same. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading H4 'Bối cảnh' (work-state.md L1591) to H3 '0012 Context' (L248): title and depth change only, section payload and following-block digests equal on both sides (both digests recomputed independently), target ancestry names ADR 0012 like the source position, the frozen-heading quote in the rationale equals the target heading, depth H4 to H3 is a permitted depth-only change that the rationale does not name",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "0dc5cda4fa7fbd44208f88a810d9e6f77a67e9efa236041735d82bad31cd0158",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "8. ADR 0012 Unified Typed-Edge Graph Model"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-084"
}
```

## Entry decisions-085

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "collection": "claims",
  "claimId": "claim_4806fa4d3041b4b051cddf6a2490730b",
  "before": {
    "claimId": "claim_4806fa4d3041b4b051cddf6a2490730b",
    "sourceUnitDigest": "46ed30006ee6e00a",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "pending",
    "targetAnchor": "unheaded-block-35",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0012 (source lines 1593-1598, starting \"0002 khoá \"deps và parent là hai quan hệ tách rời có chủ đích\": `deps`\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "46ed30006ee6e00a1f81320cb86f1e91d79732f033b3345aa8f956c9c1c54961",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "8. ADR 0012 Unified Typed-Edge Graph Model",
      "0012 Context"
    ]
  },
  "after": {
    "claimId": "claim_4806fa4d3041b4b051cddf6a2490730b",
    "sourceUnitDigest": "46ed30006ee6e00a",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "unheaded-block-35",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0012 (source lines 1593-1598, starting \"0002 khoá \"deps và parent là hai quan hệ tách rời có chủ đích\": `deps`\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: digests recomputed by extractor and independent hash and equal (text byte-equal), shard row equals pack, source and target anchors pass, ancestry 0012 Context equals the shard, rationale line range 1593-1598 and target anchor match the unit; text not re-read beyond byte equality",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "46ed30006ee6e00a1f81320cb86f1e91d79732f033b3345aa8f956c9c1c54961",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "8. ADR 0012 Unified Typed-Edge Graph Model",
      "0012 Context"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_4806fa4d3041b4b051cddf6a2490730b",
    "sourceUnitDigest": "46ed30006ee6e00a",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "unheaded-block-35",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0012 (source lines 1593-1598, starting \"0002 khoá \"deps và parent là hai quan hệ tách rời có chủ đích\": `deps`\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: digests recomputed by extractor and independent hash and equal (text byte-equal), shard row equals pack, source and target anchors pass, ancestry 0012 Context equals the shard, rationale line range 1593-1598 and target anchor match the unit; text not re-read beyond byte equality",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "46ed30006ee6e00a1f81320cb86f1e91d79732f033b3345aa8f956c9c1c54961",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "8. ADR 0012 Unified Typed-Edge Graph Model",
      "0012 Context"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-085"
}
```

## Entry decisions-086

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "collection": "claims",
  "claimId": "claim_d1d70b955b085baafa10ffcec2702b8d",
  "before": {
    "claimId": "claim_d1d70b955b085baafa10ffcec2702b8d",
    "sourceUnitDigest": "e4554b1ed9990b0f",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "pending",
    "targetAnchor": "unheaded-block-36",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0012 (source lines 1600-1606, starting \"Việc dò tay lúc validating S2a phát hiện một lỗ hổng sống **khác**, be\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "e4554b1ed9990b0f5dbf12aa19075d6dfd2eb29d0ca40117916f5672e419e4ba",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "8. ADR 0012 Unified Typed-Edge Graph Model",
      "0012 Context"
    ]
  },
  "after": {
    "claimId": "claim_d1d70b955b085baafa10ffcec2702b8d",
    "sourceUnitDigest": "e4554b1ed9990b0f",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "unheaded-block-36",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0012 (source lines 1600-1606, starting \"Việc dò tay lúc validating S2a phát hiện một lỗ hổng sống **khác**, be\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: digests recomputed by extractor and independent hash and equal (text byte-equal), shard row equals pack, source and target anchors pass, ancestry 0012 Context equals the shard, rationale line range 1600-1606 and target anchor match the unit; text not re-read beyond byte equality",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "e4554b1ed9990b0f5dbf12aa19075d6dfd2eb29d0ca40117916f5672e419e4ba",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "8. ADR 0012 Unified Typed-Edge Graph Model",
      "0012 Context"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_d1d70b955b085baafa10ffcec2702b8d",
    "sourceUnitDigest": "e4554b1ed9990b0f",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "unheaded-block-36",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0012 (source lines 1600-1606, starting \"Việc dò tay lúc validating S2a phát hiện một lỗ hổng sống **khác**, be\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: digests recomputed by extractor and independent hash and equal (text byte-equal), shard row equals pack, source and target anchors pass, ancestry 0012 Context equals the shard, rationale line range 1600-1606 and target anchor match the unit; text not re-read beyond byte equality",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "e4554b1ed9990b0f5dbf12aa19075d6dfd2eb29d0ca40117916f5672e419e4ba",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "8. ADR 0012 Unified Typed-Edge Graph Model",
      "0012 Context"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-086"
}
```

## Entry decisions-087

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "collection": "claims",
  "claimId": "claim_dc663544c2f4766e60ca2ce841c6ffd6",
  "before": {
    "claimId": "claim_dc663544c2f4766e60ca2ce841c6ffd6",
    "sourceUnitDigest": "1186cfa23b3d3a5f",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "pending",
    "targetAnchor": "unheaded-block-37",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0012 (source lines 1608-1612, starting \"Beads (nguồn tham khảo đã mined — `beads.md:36`, `work-item-management\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "1186cfa23b3d3a5f227a6f05ceacf581ab841a0bf5100c82d4db735cc5479859",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "8. ADR 0012 Unified Typed-Edge Graph Model",
      "0012 Context"
    ]
  },
  "after": {
    "claimId": "claim_dc663544c2f4766e60ca2ce841c6ffd6",
    "sourceUnitDigest": "1186cfa23b3d3a5f",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "unheaded-block-37",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0012 (source lines 1608-1612, starting \"Beads (nguồn tham khảo đã mined — `beads.md:36`, `work-item-management\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: digests recomputed by extractor and independent hash and equal (text byte-equal), shard row equals pack, source and target anchors pass, ancestry 0012 Context equals the shard, rationale line range 1608-1612 and target anchor match the unit; text not re-read beyond byte equality",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "1186cfa23b3d3a5f227a6f05ceacf581ab841a0bf5100c82d4db735cc5479859",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "8. ADR 0012 Unified Typed-Edge Graph Model",
      "0012 Context"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_dc663544c2f4766e60ca2ce841c6ffd6",
    "sourceUnitDigest": "1186cfa23b3d3a5f",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "unheaded-block-37",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0012 (source lines 1608-1612, starting \"Beads (nguồn tham khảo đã mined — `beads.md:36`, `work-item-management\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: digests recomputed by extractor and independent hash and equal (text byte-equal), shard row equals pack, source and target anchors pass, ancestry 0012 Context equals the shard, rationale line range 1608-1612 and target anchor match the unit; text not re-read beyond byte equality",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "1186cfa23b3d3a5f227a6f05ceacf581ab841a0bf5100c82d4db735cc5479859",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "8. ADR 0012 Unified Typed-Edge Graph Model",
      "0012 Context"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-087"
}
```

## Entry decisions-088

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "collection": "claims",
  "claimId": "claim_3b4da5c5b12c6780b24e84b53ca73e49",
  "before": {
    "claimId": "claim_3b4da5c5b12c6780b24e84b53ca73e49",
    "sourceUnitDigest": "24cacb854eb926ac",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "pending",
    "targetAnchor": "0012-decision",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Section heading \"Quyết định\" of ADR 0012 is represented by the frozen H3 \"0012 Decision\"; the title differs (prefixed with the ADR number, English) but the section it opens is the same. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "9dee590708c4181b56606cd803fd345edfe4a9db456d03efe6a0d63e7b8ad917",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "8. ADR 0012 Unified Typed-Edge Graph Model"
    ]
  },
  "after": {
    "claimId": "claim_3b4da5c5b12c6780b24e84b53ca73e49",
    "sourceUnitDigest": "24cacb854eb926ac",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "0012-decision",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Section heading \"Quyết định\" of ADR 0012 is represented by the frozen H3 \"0012 Decision\"; the title differs (prefixed with the ADR number, English) but the section it opens is the same. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading H4 'Quyết định' (work-state.md L1614) to H3 '0012 Decision' (L271): title and depth change only, section payload and following-block digests equal on both sides (both digests recomputed independently), target ancestry names ADR 0012 like the source position, the frozen-heading quote in the rationale equals the target heading, depth H4 to H3 is a permitted depth-only change that the rationale does not name",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "9dee590708c4181b56606cd803fd345edfe4a9db456d03efe6a0d63e7b8ad917",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "8. ADR 0012 Unified Typed-Edge Graph Model"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_3b4da5c5b12c6780b24e84b53ca73e49",
    "sourceUnitDigest": "24cacb854eb926ac",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "0012-decision",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Section heading \"Quyết định\" of ADR 0012 is represented by the frozen H3 \"0012 Decision\"; the title differs (prefixed with the ADR number, English) but the section it opens is the same. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading H4 'Quyết định' (work-state.md L1614) to H3 '0012 Decision' (L271): title and depth change only, section payload and following-block digests equal on both sides (both digests recomputed independently), target ancestry names ADR 0012 like the source position, the frozen-heading quote in the rationale equals the target heading, depth H4 to H3 is a permitted depth-only change that the rationale does not name",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "9dee590708c4181b56606cd803fd345edfe4a9db456d03efe6a0d63e7b8ad917",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "8. ADR 0012 Unified Typed-Edge Graph Model"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-088"
}
```

## Entry decisions-089

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "collection": "claims",
  "claimId": "claim_f44a3645601fbc48b21a8d73b3ac3426",
  "before": {
    "claimId": "claim_f44a3645601fbc48b21a8d73b3ac3426",
    "sourceUnitDigest": "0f8f279453f179f3",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "pending",
    "targetAnchor": "unheaded-block-38",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0012 (source lines 1616-1651, starting \"- **fgOS mô hình hoá quan hệ giữa các work item bằng MỘT đồ thị cạnh-đ\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "0f8f279453f179f3b8c688e65b42d55ff830d8cae0c7462980c05a4f00c04106",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "8. ADR 0012 Unified Typed-Edge Graph Model",
      "0012 Decision"
    ]
  },
  "after": {
    "claimId": "claim_f44a3645601fbc48b21a8d73b3ac3426",
    "sourceUnitDigest": "0f8f279453f179f3",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "unheaded-block-38",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0012 (source lines 1616-1651, starting \"- **fgOS mô hình hoá quan hệ giữa các work item bằng MỘT đồ thị cạnh-đ\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: digests recomputed by extractor and independent hash and equal (text byte-equal), shard row equals pack, source and target anchors pass, ancestry 0012 Decision equals the shard, rationale line range 1616-1651 and target anchor match the unit; text not re-read beyond byte equality",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "0f8f279453f179f3b8c688e65b42d55ff830d8cae0c7462980c05a4f00c04106",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "8. ADR 0012 Unified Typed-Edge Graph Model",
      "0012 Decision"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_f44a3645601fbc48b21a8d73b3ac3426",
    "sourceUnitDigest": "0f8f279453f179f3",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "unheaded-block-38",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0012 (source lines 1616-1651, starting \"- **fgOS mô hình hoá quan hệ giữa các work item bằng MỘT đồ thị cạnh-đ\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: digests recomputed by extractor and independent hash and equal (text byte-equal), shard row equals pack, source and target anchors pass, ancestry 0012 Decision equals the shard, rationale line range 1616-1651 and target anchor match the unit; text not re-read beyond byte equality",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "0f8f279453f179f3b8c688e65b42d55ff830d8cae0c7462980c05a4f00c04106",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "8. ADR 0012 Unified Typed-Edge Graph Model",
      "0012 Decision"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-089"
}
```

## Entry decisions-090

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "collection": "claims",
  "claimId": "claim_c6a32a1e4ab8c7078b89199236f3d5e0",
  "before": {
    "claimId": "claim_c6a32a1e4ab8c7078b89199236f3d5e0",
    "sourceUnitDigest": "f35473b9295a35af",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "pending",
    "targetAnchor": "0012-consequences",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Section heading \"Hệ quả\" of ADR 0012 is represented by the frozen H3 \"0012 Consequences\"; the title differs (prefixed with the ADR number, English) but the section it opens is the same. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "764a0029f0ee73f78c522c71e69830fac20871e226b636c7832f1461d0c0c79c",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "8. ADR 0012 Unified Typed-Edge Graph Model"
    ]
  },
  "after": {
    "claimId": "claim_c6a32a1e4ab8c7078b89199236f3d5e0",
    "sourceUnitDigest": "f35473b9295a35af",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "0012-consequences",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Section heading \"Hệ quả\" of ADR 0012 is represented by the frozen H3 \"0012 Consequences\"; the title differs (prefixed with the ADR number, English) but the section it opens is the same. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading H4 'Hệ quả' (work-state.md L1653) to H3 '0012 Consequences' (L310): title and depth change only, section payload and following-block digests equal on both sides (both digests recomputed independently), target ancestry names ADR 0012 like the source position, the frozen-heading quote in the rationale equals the target heading, depth H4 to H3 is a permitted depth-only change that the rationale does not name",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "764a0029f0ee73f78c522c71e69830fac20871e226b636c7832f1461d0c0c79c",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "8. ADR 0012 Unified Typed-Edge Graph Model"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_c6a32a1e4ab8c7078b89199236f3d5e0",
    "sourceUnitDigest": "f35473b9295a35af",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "0012-consequences",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Section heading \"Hệ quả\" of ADR 0012 is represented by the frozen H3 \"0012 Consequences\"; the title differs (prefixed with the ADR number, English) but the section it opens is the same. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading H4 'Hệ quả' (work-state.md L1653) to H3 '0012 Consequences' (L310): title and depth change only, section payload and following-block digests equal on both sides (both digests recomputed independently), target ancestry names ADR 0012 like the source position, the frozen-heading quote in the rationale equals the target heading, depth H4 to H3 is a permitted depth-only change that the rationale does not name",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "764a0029f0ee73f78c522c71e69830fac20871e226b636c7832f1461d0c0c79c",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "8. ADR 0012 Unified Typed-Edge Graph Model"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-090"
}
```

## Entry decisions-091

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "collection": "claims",
  "claimId": "claim_4da244a64b6f33711d89feb47331b4f0",
  "before": {
    "claimId": "claim_4da244a64b6f33711d89feb47331b4f0",
    "sourceUnitDigest": "df6252739cffc35e",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "pending",
    "targetAnchor": "unheaded-block-39",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0012 (source lines 1655-1662, starting \"- `docs/architecture-map.md` nâng v0.2 → v0.3: dòng version trỏ record\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "df6252739cffc35e81a7acce610d94cdb17bf12c53d106820a4b567ffbb55038",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "8. ADR 0012 Unified Typed-Edge Graph Model",
      "0012 Consequences"
    ]
  },
  "after": {
    "claimId": "claim_4da244a64b6f33711d89feb47331b4f0",
    "sourceUnitDigest": "df6252739cffc35e",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "unheaded-block-39",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0012 (source lines 1655-1662, starting \"- `docs/architecture-map.md` nâng v0.2 → v0.3: dòng version trỏ record\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: digests recomputed by extractor and independent hash and equal (text byte-equal), shard row equals pack, source and target anchors pass, ancestry 0012 Consequences equals the shard, rationale line range 1655-1662 and target anchor match the unit; text not re-read beyond byte equality",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "df6252739cffc35e81a7acce610d94cdb17bf12c53d106820a4b567ffbb55038",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "8. ADR 0012 Unified Typed-Edge Graph Model",
      "0012 Consequences"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_4da244a64b6f33711d89feb47331b4f0",
    "sourceUnitDigest": "df6252739cffc35e",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "unheaded-block-39",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0012 (source lines 1655-1662, starting \"- `docs/architecture-map.md` nâng v0.2 → v0.3: dòng version trỏ record\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: digests recomputed by extractor and independent hash and equal (text byte-equal), shard row equals pack, source and target anchors pass, ancestry 0012 Consequences equals the shard, rationale line range 1655-1662 and target anchor match the unit; text not re-read beyond byte equality",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "df6252739cffc35e81a7acce610d94cdb17bf12c53d106820a4b567ffbb55038",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "8. ADR 0012 Unified Typed-Edge Graph Model",
      "0012 Consequences"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-091"
}
```

## Entry decisions-092

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "collection": "claims",
  "claimId": "claim_a7c2e1310de5bcd152e86f3833e90033",
  "before": {
    "claimId": "claim_a7c2e1310de5bcd152e86f3833e90033",
    "sourceUnitDigest": "95a357e29712c3c0",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "pending",
    "targetAnchor": "unheaded-block-40",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Supersession-rule line of ADR 0012 (change by superseding with a new record) carried verbatim at the end of its consequences section; the located suggestion pointed at the first identical copy, so the anchor was set to this ADR's own block. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "8. ADR 0012 Unified Typed-Edge Graph Model",
      "0012 Consequences"
    ]
  },
  "after": {
    "claimId": "claim_a7c2e1310de5bcd152e86f3833e90033",
    "sourceUnitDigest": "95a357e29712c3c0",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "unheaded-block-40",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Supersession-rule line of ADR 0012 (change by superseding with a new record) carried verbatim at the end of its consequences section; the located suggestion pointed at the first identical copy, so the anchor was set to this ADR's own block. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: digests recomputed by extractor and independent hash and equal (text byte-equal), shard row equals pack, source and target anchors pass, ancestry 0012 Consequences equals the shard, rationale line range 1664-1664 and target anchor match the unit; text not re-read beyond byte equality",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "8. ADR 0012 Unified Typed-Edge Graph Model",
      "0012 Consequences"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_a7c2e1310de5bcd152e86f3833e90033",
    "sourceUnitDigest": "95a357e29712c3c0",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "unheaded-block-40",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Supersession-rule line of ADR 0012 (change by superseding with a new record) carried verbatim at the end of its consequences section; the located suggestion pointed at the first identical copy, so the anchor was set to this ADR's own block. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: digests recomputed by extractor and independent hash and equal (text byte-equal), shard row equals pack, source and target anchors pass, ancestry 0012 Consequences equals the shard, rationale line range 1664-1664 and target anchor match the unit; text not re-read beyond byte equality",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "8. ADR 0012 Unified Typed-Edge Graph Model",
      "0012 Consequences"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-092"
}
```

## Entry decisions-093

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "collection": "claims",
  "claimId": "claim_2d27908b73621a411fcf708b067b6ba2",
  "before": {
    "claimId": "claim_2d27908b73621a411fcf708b067b6ba2",
    "sourceUnitDigest": "f529cf675d973db5",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "pending",
    "targetAnchor": "9-adr-0013-report-not-write-channel-for-discovered-from",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Source ADR 0013 title heading is represented by the frozen H2 \"9. ADR 0013 ...\" (9-adr-0013-report-not-write-channel-for-discovered-from); title is renumbered and re-worded in English, text of the record is unchanged. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "bb9207e0916a5823e45378afb7d0247d511cb2bf870386fdefd982d8a17e51cb",
    "targetAncestry": [
      "Retired Decision History: Work State"
    ]
  },
  "after": {
    "claimId": "claim_2d27908b73621a411fcf708b067b6ba2",
    "sourceUnitDigest": "f529cf675d973db5",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "9-adr-0013-report-not-write-channel-for-discovered-from",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Source ADR 0013 title heading is represented by the frozen H2 \"9. ADR 0013 ...\" (9-adr-0013-report-not-write-channel-for-discovered-from); title is renumbered and re-worded in English, text of the record is unchanged. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading H3 '0013 — Kênh báo-cáo-không-ghi (worker→runner) cho `discovered-from`' (work-state.md L1666) to H2 '9. ADR 0013 Report-Not-Write Channel For Discovered-From' (L323): title and depth change only, section payload and following-block digests equal on both sides (both digests recomputed independently), target ancestry names ADR 0013 like the source position, the frozen-heading quote in the rationale equals the target heading, depth H3 to H2 is a permitted depth-only change that the rationale does not name",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "bb9207e0916a5823e45378afb7d0247d511cb2bf870386fdefd982d8a17e51cb",
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
    "claimId": "claim_2d27908b73621a411fcf708b067b6ba2",
    "sourceUnitDigest": "f529cf675d973db5",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "9-adr-0013-report-not-write-channel-for-discovered-from",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Source ADR 0013 title heading is represented by the frozen H2 \"9. ADR 0013 ...\" (9-adr-0013-report-not-write-channel-for-discovered-from); title is renumbered and re-worded in English, text of the record is unchanged. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading H3 '0013 — Kênh báo-cáo-không-ghi (worker→runner) cho `discovered-from`' (work-state.md L1666) to H2 '9. ADR 0013 Report-Not-Write Channel For Discovered-From' (L323): title and depth change only, section payload and following-block digests equal on both sides (both digests recomputed independently), target ancestry names ADR 0013 like the source position, the frozen-heading quote in the rationale equals the target heading, depth H3 to H2 is a permitted depth-only change that the rationale does not name",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "bb9207e0916a5823e45378afb7d0247d511cb2bf870386fdefd982d8a17e51cb",
    "targetAncestry": [
      "Retired Decision History: Work State"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-093"
}
```

## Entry decisions-094

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "collection": "claims",
  "claimId": "claim_e68c14be45a430e3676761d7bdc9e6db",
  "before": {
    "claimId": "claim_e68c14be45a430e3676761d7bdc9e6db",
    "sourceUnitDigest": "31a7f48e9cc16169",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "pending",
    "targetAnchor": "0013-context",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Section heading \"Bối cảnh\" of ADR 0013 is represented by the frozen H3 \"0013 Context\"; the title differs (prefixed with the ADR number, English) but the section it opens is the same. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "39a94a27f6e89fec290ba89590cff97929d9c7625c0ad041e4bb461c53fe5d61",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "9. ADR 0013 Report-Not-Write Channel For Discovered-From"
    ]
  },
  "after": {
    "claimId": "claim_e68c14be45a430e3676761d7bdc9e6db",
    "sourceUnitDigest": "31a7f48e9cc16169",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "0013-context",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Section heading \"Bối cảnh\" of ADR 0013 is represented by the frozen H3 \"0013 Context\"; the title differs (prefixed with the ADR number, English) but the section it opens is the same. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading H4 'Bối cảnh' (work-state.md L1668) to H3 '0013 Context' (L325): title and depth change only, section payload and following-block digests equal on both sides (both digests recomputed independently), target ancestry names ADR 0013 like the source position, the frozen-heading quote in the rationale equals the target heading, depth H4 to H3 is a permitted depth-only change that the rationale does not name",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "39a94a27f6e89fec290ba89590cff97929d9c7625c0ad041e4bb461c53fe5d61",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "9. ADR 0013 Report-Not-Write Channel For Discovered-From"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_e68c14be45a430e3676761d7bdc9e6db",
    "sourceUnitDigest": "31a7f48e9cc16169",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "0013-context",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Section heading \"Bối cảnh\" of ADR 0013 is represented by the frozen H3 \"0013 Context\"; the title differs (prefixed with the ADR number, English) but the section it opens is the same. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading H4 'Bối cảnh' (work-state.md L1668) to H3 '0013 Context' (L325): title and depth change only, section payload and following-block digests equal on both sides (both digests recomputed independently), target ancestry names ADR 0013 like the source position, the frozen-heading quote in the rationale equals the target heading, depth H4 to H3 is a permitted depth-only change that the rationale does not name",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "39a94a27f6e89fec290ba89590cff97929d9c7625c0ad041e4bb461c53fe5d61",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "9. ADR 0013 Report-Not-Write Channel For Discovered-From"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-094"
}
```

## Entry decisions-095

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "collection": "claims",
  "claimId": "claim_62c3b825e8cc887ad822b8d1b5316769",
  "before": {
    "claimId": "claim_62c3b825e8cc887ad822b8d1b5316769",
    "sourceUnitDigest": "a00c0f5592ff571c",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "pending",
    "targetAnchor": "unheaded-block-41",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0013 (source lines 1670-1674, starting \"work-graph-intelligence S2b thêm `discoveredFrom` — một trường lineage\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "a00c0f5592ff571cf91553ec9c8faad0802584c313d21071375ff8d6f8405ece",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "9. ADR 0013 Report-Not-Write Channel For Discovered-From",
      "0013 Context"
    ]
  },
  "after": {
    "claimId": "claim_62c3b825e8cc887ad822b8d1b5316769",
    "sourceUnitDigest": "a00c0f5592ff571c",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "unheaded-block-41",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0013 (source lines 1670-1674, starting \"work-graph-intelligence S2b thêm `discoveredFrom` — một trường lineage\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: digests recomputed by extractor and independent hash and equal (text byte-equal), shard row equals pack, source and target anchors pass, ancestry 0013 Context equals the shard, rationale line range 1670-1674 and target anchor match the unit; text not re-read beyond byte equality",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "a00c0f5592ff571cf91553ec9c8faad0802584c313d21071375ff8d6f8405ece",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "9. ADR 0013 Report-Not-Write Channel For Discovered-From",
      "0013 Context"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_62c3b825e8cc887ad822b8d1b5316769",
    "sourceUnitDigest": "a00c0f5592ff571c",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "unheaded-block-41",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0013 (source lines 1670-1674, starting \"work-graph-intelligence S2b thêm `discoveredFrom` — một trường lineage\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: digests recomputed by extractor and independent hash and equal (text byte-equal), shard row equals pack, source and target anchors pass, ancestry 0013 Context equals the shard, rationale line range 1670-1674 and target anchor match the unit; text not re-read beyond byte equality",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "a00c0f5592ff571cf91553ec9c8faad0802584c313d21071375ff8d6f8405ece",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "9. ADR 0013 Report-Not-Write Channel For Discovered-From",
      "0013 Context"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-095"
}
```

## Entry decisions-096

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "collection": "claims",
  "claimId": "claim_2591914de0c8f3b95488576fb8643dfb",
  "before": {
    "claimId": "claim_2591914de0c8f3b95488576fb8643dfb",
    "sourceUnitDigest": "ad532d04b4ed0695",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "pending",
    "targetAnchor": "unheaded-block-42",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0013 (source lines 1676-1681, starting \"Nhà sản xuất (B) va thẳng vào một bất biến đã khoá: **runner là nhà gh\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "ad532d04b4ed06951112d9fecaf1464867e47d988b18f9cfadf0dc88d059f767",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "9. ADR 0013 Report-Not-Write Channel For Discovered-From",
      "0013 Context"
    ]
  },
  "after": {
    "claimId": "claim_2591914de0c8f3b95488576fb8643dfb",
    "sourceUnitDigest": "ad532d04b4ed0695",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "unheaded-block-42",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0013 (source lines 1676-1681, starting \"Nhà sản xuất (B) va thẳng vào một bất biến đã khoá: **runner là nhà gh\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: digests recomputed by extractor and independent hash and equal (text byte-equal), shard row equals pack, source and target anchors pass, ancestry 0013 Context equals the shard, rationale line range 1676-1681 and target anchor match the unit; text not re-read beyond byte equality",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "ad532d04b4ed06951112d9fecaf1464867e47d988b18f9cfadf0dc88d059f767",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "9. ADR 0013 Report-Not-Write Channel For Discovered-From",
      "0013 Context"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_2591914de0c8f3b95488576fb8643dfb",
    "sourceUnitDigest": "ad532d04b4ed0695",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "unheaded-block-42",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0013 (source lines 1676-1681, starting \"Nhà sản xuất (B) va thẳng vào một bất biến đã khoá: **runner là nhà gh\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: digests recomputed by extractor and independent hash and equal (text byte-equal), shard row equals pack, source and target anchors pass, ancestry 0013 Context equals the shard, rationale line range 1676-1681 and target anchor match the unit; text not re-read beyond byte equality",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "ad532d04b4ed06951112d9fecaf1464867e47d988b18f9cfadf0dc88d059f767",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "9. ADR 0013 Report-Not-Write Channel For Discovered-From",
      "0013 Context"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-096"
}
```

## Entry decisions-097

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "collection": "claims",
  "claimId": "claim_1f9265c6ad8bc4b9e8cf754fb1b8b164",
  "before": {
    "claimId": "claim_1f9265c6ad8bc4b9e8cf754fb1b8b164",
    "sourceUnitDigest": "9b836a5af7fa427d",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "pending",
    "targetAnchor": "0013-decision",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Section heading \"Quyết định\" of ADR 0013 is represented by the frozen H3 \"0013 Decision\"; the title differs (prefixed with the ADR number, English) but the section it opens is the same. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "dc61b855030de6ec8c01fd1fd46215522d2327be9adb6c025724d974f8843b8e",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "9. ADR 0013 Report-Not-Write Channel For Discovered-From"
    ]
  },
  "after": {
    "claimId": "claim_1f9265c6ad8bc4b9e8cf754fb1b8b164",
    "sourceUnitDigest": "9b836a5af7fa427d",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "0013-decision",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Section heading \"Quyết định\" of ADR 0013 is represented by the frozen H3 \"0013 Decision\"; the title differs (prefixed with the ADR number, English) but the section it opens is the same. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading H4 'Quyết định' (work-state.md L1683) to H3 '0013 Decision' (L340): title and depth change only, section payload and following-block digests equal on both sides (both digests recomputed independently), target ancestry names ADR 0013 like the source position, the frozen-heading quote in the rationale equals the target heading, depth H4 to H3 is a permitted depth-only change that the rationale does not name",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "dc61b855030de6ec8c01fd1fd46215522d2327be9adb6c025724d974f8843b8e",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "9. ADR 0013 Report-Not-Write Channel For Discovered-From"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_1f9265c6ad8bc4b9e8cf754fb1b8b164",
    "sourceUnitDigest": "9b836a5af7fa427d",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "0013-decision",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Section heading \"Quyết định\" of ADR 0013 is represented by the frozen H3 \"0013 Decision\"; the title differs (prefixed with the ADR number, English) but the section it opens is the same. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading H4 'Quyết định' (work-state.md L1683) to H3 '0013 Decision' (L340): title and depth change only, section payload and following-block digests equal on both sides (both digests recomputed independently), target ancestry names ADR 0013 like the source position, the frozen-heading quote in the rationale equals the target heading, depth H4 to H3 is a permitted depth-only change that the rationale does not name",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "dc61b855030de6ec8c01fd1fd46215522d2327be9adb6c025724d974f8843b8e",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "9. ADR 0013 Report-Not-Write Channel For Discovered-From"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-097"
}
```

## Entry decisions-098

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "collection": "claims",
  "claimId": "claim_e2589be21644922e0424a20d39bbd6e3",
  "before": {
    "claimId": "claim_e2589be21644922e0424a20d39bbd6e3",
    "sourceUnitDigest": "c56d7ec3b4f47f64",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "pending",
    "targetAnchor": "unheaded-block-43",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0013 (source lines 1685-1686, starting \"Phát minh một **kênh báo-cáo-không-ghi** (report-not-write) giữa worke\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "c56d7ec3b4f47f64c9a1c99b5401e17c42ef591a0edaee116811a00ba808d373",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "9. ADR 0013 Report-Not-Write Channel For Discovered-From",
      "0013 Decision"
    ]
  },
  "after": {
    "claimId": "claim_e2589be21644922e0424a20d39bbd6e3",
    "sourceUnitDigest": "c56d7ec3b4f47f64",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "unheaded-block-43",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0013 (source lines 1685-1686, starting \"Phát minh một **kênh báo-cáo-không-ghi** (report-not-write) giữa worke\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: work-state.md#unheaded-block-153 (L1685-1686) to decisions/retired-decision-history.md#unheaded-block-43 (L342-343): text byte-equal (read both ends, 148 chars), digests recomputed by extractor and by independent hash, anchor passes, ancestry 0013 Decision equals the shard; rationale line range, anchor and opening words match the unit",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "c56d7ec3b4f47f64c9a1c99b5401e17c42ef591a0edaee116811a00ba808d373",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "9. ADR 0013 Report-Not-Write Channel For Discovered-From",
      "0013 Decision"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_e2589be21644922e0424a20d39bbd6e3",
    "sourceUnitDigest": "c56d7ec3b4f47f64",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "unheaded-block-43",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0013 (source lines 1685-1686, starting \"Phát minh một **kênh báo-cáo-không-ghi** (report-not-write) giữa worke\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: work-state.md#unheaded-block-153 (L1685-1686) to decisions/retired-decision-history.md#unheaded-block-43 (L342-343): text byte-equal (read both ends, 148 chars), digests recomputed by extractor and by independent hash, anchor passes, ancestry 0013 Decision equals the shard; rationale line range, anchor and opening words match the unit",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "c56d7ec3b4f47f64c9a1c99b5401e17c42ef591a0edaee116811a00ba808d373",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "9. ADR 0013 Report-Not-Write Channel For Discovered-From",
      "0013 Decision"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-098"
}
```

## Entry decisions-099

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "collection": "claims",
  "claimId": "claim_ebf8d11889aea2db10db3f7d03fb7d50",
  "before": {
    "claimId": "claim_ebf8d11889aea2db10db3f7d03fb7d50",
    "sourceUnitDigest": "f17f548794a78bbc",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "pending",
    "targetAnchor": "unheaded-block-44",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0013 (source lines 1688-1692, starting \"1. **Worker chỉ báo cáo, dữ liệu thuần.** Prompt dispatch mô tả một kê\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "f17f548794a78bbc05c2553918d93b56d0f307ea02732dcd113f04c48e8bd0f9",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "9. ADR 0013 Report-Not-Write Channel For Discovered-From",
      "0013 Decision"
    ]
  },
  "after": {
    "claimId": "claim_ebf8d11889aea2db10db3f7d03fb7d50",
    "sourceUnitDigest": "f17f548794a78bbc",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "unheaded-block-44",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0013 (source lines 1688-1692, starting \"1. **Worker chỉ báo cáo, dữ liệu thuần.** Prompt dispatch mô tả một kê\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: digests recomputed by extractor and independent hash and equal (text byte-equal), shard row equals pack, source and target anchors pass, ancestry 0013 Decision equals the shard, rationale line range 1688-1692 and target anchor match the unit; text not re-read beyond byte equality",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "f17f548794a78bbc05c2553918d93b56d0f307ea02732dcd113f04c48e8bd0f9",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "9. ADR 0013 Report-Not-Write Channel For Discovered-From",
      "0013 Decision"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_ebf8d11889aea2db10db3f7d03fb7d50",
    "sourceUnitDigest": "f17f548794a78bbc",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "unheaded-block-44",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0013 (source lines 1688-1692, starting \"1. **Worker chỉ báo cáo, dữ liệu thuần.** Prompt dispatch mô tả một kê\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: digests recomputed by extractor and independent hash and equal (text byte-equal), shard row equals pack, source and target anchors pass, ancestry 0013 Decision equals the shard, rationale line range 1688-1692 and target anchor match the unit; text not re-read beyond byte equality",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "f17f548794a78bbc05c2553918d93b56d0f307ea02732dcd113f04c48e8bd0f9",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "9. ADR 0013 Report-Not-Write Channel For Discovered-From",
      "0013 Decision"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-099"
}
```

## Entry decisions-100

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "collection": "claims",
  "claimId": "claim_afaa4b9499e137528bcf889ef6ef93f0",
  "before": {
    "claimId": "claim_afaa4b9499e137528bcf889ef6ef93f0",
    "sourceUnitDigest": "fe25484d362341cc",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "pending",
    "targetAnchor": "unheaded-block-45",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0013 (source lines 1694-1699, starting \"2. **Runner đọc và tự ghi.** `loop.mjs` `dispatchClaimedItem` parse cá\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "fe25484d362341cc389e461a59cba3bbc6a065c6998456273f1a1956c993931d",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "9. ADR 0013 Report-Not-Write Channel For Discovered-From",
      "0013 Decision"
    ]
  },
  "after": {
    "claimId": "claim_afaa4b9499e137528bcf889ef6ef93f0",
    "sourceUnitDigest": "fe25484d362341cc",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "unheaded-block-45",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0013 (source lines 1694-1699, starting \"2. **Runner đọc và tự ghi.** `loop.mjs` `dispatchClaimedItem` parse cá\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: digests recomputed by extractor and independent hash and equal (text byte-equal), shard row equals pack, source and target anchors pass, ancestry 0013 Decision equals the shard, rationale line range 1694-1699 and target anchor match the unit; text not re-read beyond byte equality",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "fe25484d362341cc389e461a59cba3bbc6a065c6998456273f1a1956c993931d",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "9. ADR 0013 Report-Not-Write Channel For Discovered-From",
      "0013 Decision"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_afaa4b9499e137528bcf889ef6ef93f0",
    "sourceUnitDigest": "fe25484d362341cc",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "unheaded-block-45",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0013 (source lines 1694-1699, starting \"2. **Runner đọc và tự ghi.** `loop.mjs` `dispatchClaimedItem` parse cá\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: digests recomputed by extractor and independent hash and equal (text byte-equal), shard row equals pack, source and target anchors pass, ancestry 0013 Decision equals the shard, rationale line range 1694-1699 and target anchor match the unit; text not re-read beyond byte equality",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "fe25484d362341cc389e461a59cba3bbc6a065c6998456273f1a1956c993931d",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "9. ADR 0013 Report-Not-Write Channel For Discovered-From",
      "0013 Decision"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-100"
}
```

## Entry decisions-101

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "collection": "claims",
  "claimId": "claim_185e1f6f4d1ef50fead4ce341980898d",
  "before": {
    "claimId": "claim_185e1f6f4d1ef50fead4ce341980898d",
    "sourceUnitDigest": "a25b933f983753d9",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "pending",
    "targetAnchor": "unheaded-block-46",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0013 (source lines 1701-1704, starting \"3. **Parse là an-toàn-hỏng (fail-safe).** Khối méo/thiếu `title`/không\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "a25b933f983753d92ab77173127f6af159da4cf1b259bcdf6bcb8a8ba0ada695",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "9. ADR 0013 Report-Not-Write Channel For Discovered-From",
      "0013 Decision"
    ]
  },
  "after": {
    "claimId": "claim_185e1f6f4d1ef50fead4ce341980898d",
    "sourceUnitDigest": "a25b933f983753d9",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "unheaded-block-46",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0013 (source lines 1701-1704, starting \"3. **Parse là an-toàn-hỏng (fail-safe).** Khối méo/thiếu `title`/không\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: digests recomputed by extractor and independent hash and equal (text byte-equal), shard row equals pack, source and target anchors pass, ancestry 0013 Decision equals the shard, rationale line range 1701-1704 and target anchor match the unit; text not re-read beyond byte equality",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "a25b933f983753d92ab77173127f6af159da4cf1b259bcdf6bcb8a8ba0ada695",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "9. ADR 0013 Report-Not-Write Channel For Discovered-From",
      "0013 Decision"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_185e1f6f4d1ef50fead4ce341980898d",
    "sourceUnitDigest": "a25b933f983753d9",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "unheaded-block-46",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0013 (source lines 1701-1704, starting \"3. **Parse là an-toàn-hỏng (fail-safe).** Khối méo/thiếu `title`/không\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: digests recomputed by extractor and independent hash and equal (text byte-equal), shard row equals pack, source and target anchors pass, ancestry 0013 Decision equals the shard, rationale line range 1701-1704 and target anchor match the unit; text not re-read beyond byte equality",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "a25b933f983753d92ab77173127f6af159da4cf1b259bcdf6bcb8a8ba0ada695",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "9. ADR 0013 Report-Not-Write Channel For Discovered-From",
      "0013 Decision"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-101"
}
```

## Entry decisions-102

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "collection": "claims",
  "claimId": "claim_fc4d5078de5528578407ea0e3715e723",
  "before": {
    "claimId": "claim_fc4d5078de5528578407ea0e3715e723",
    "sourceUnitDigest": "2bc3f7c954aa9f74",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "pending",
    "targetAnchor": "unheaded-block-47",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0013 (source lines 1706-1713, starting \"4. **Item tạo ra có hình dạng như một `submit` tươi.** `generateId(tit\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "2bc3f7c954aa9f7464b354246e208cbce1ebd91f0bc7679e22771a946b19d7c2",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "9. ADR 0013 Report-Not-Write Channel For Discovered-From",
      "0013 Decision"
    ]
  },
  "after": {
    "claimId": "claim_fc4d5078de5528578407ea0e3715e723",
    "sourceUnitDigest": "2bc3f7c954aa9f74",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "unheaded-block-47",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0013 (source lines 1706-1713, starting \"4. **Item tạo ra có hình dạng như một `submit` tươi.** `generateId(tit\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: digests recomputed by extractor and independent hash and equal (text byte-equal), shard row equals pack, source and target anchors pass, ancestry 0013 Decision equals the shard, rationale line range 1706-1713 and target anchor match the unit; text not re-read beyond byte equality",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "2bc3f7c954aa9f7464b354246e208cbce1ebd91f0bc7679e22771a946b19d7c2",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "9. ADR 0013 Report-Not-Write Channel For Discovered-From",
      "0013 Decision"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_fc4d5078de5528578407ea0e3715e723",
    "sourceUnitDigest": "2bc3f7c954aa9f74",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "unheaded-block-47",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0013 (source lines 1706-1713, starting \"4. **Item tạo ra có hình dạng như một `submit` tươi.** `generateId(tit\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: digests recomputed by extractor and independent hash and equal (text byte-equal), shard row equals pack, source and target anchors pass, ancestry 0013 Decision equals the shard, rationale line range 1706-1713 and target anchor match the unit; text not re-read beyond byte equality",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "2bc3f7c954aa9f7464b354246e208cbce1ebd91f0bc7679e22771a946b19d7c2",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "9. ADR 0013 Report-Not-Write Channel For Discovered-From",
      "0013 Decision"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-102"
}
```

## Entry decisions-103

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "collection": "claims",
  "claimId": "claim_df1ec9feeaeb131a98f44cebcd3c8f6c",
  "before": {
    "claimId": "claim_df1ec9feeaeb131a98f44cebcd3c8f6c",
    "sourceUnitDigest": "261b711fa046562a",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "pending",
    "targetAnchor": "0013-consequences",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Section heading \"Hệ quả\" of ADR 0013 is represented by the frozen H3 \"0013 Consequences\"; the title differs (prefixed with the ADR number, English) but the section it opens is the same. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "19ae019de9e9e6e87ca9d19d8bb92a18bbefab9ab1579d1010a315477e994782",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "9. ADR 0013 Report-Not-Write Channel For Discovered-From"
    ]
  },
  "after": {
    "claimId": "claim_df1ec9feeaeb131a98f44cebcd3c8f6c",
    "sourceUnitDigest": "261b711fa046562a",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "0013-consequences",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Section heading \"Hệ quả\" of ADR 0013 is represented by the frozen H3 \"0013 Consequences\"; the title differs (prefixed with the ADR number, English) but the section it opens is the same. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading H4 'Hệ quả' (work-state.md L1715) to H3 '0013 Consequences' (L372): title and depth change only, section payload and following-block digests equal on both sides (both digests recomputed independently), target ancestry names ADR 0013 like the source position, the frozen-heading quote in the rationale equals the target heading, depth H4 to H3 is a permitted depth-only change that the rationale does not name",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "19ae019de9e9e6e87ca9d19d8bb92a18bbefab9ab1579d1010a315477e994782",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "9. ADR 0013 Report-Not-Write Channel For Discovered-From"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_df1ec9feeaeb131a98f44cebcd3c8f6c",
    "sourceUnitDigest": "261b711fa046562a",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "0013-consequences",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Section heading \"Hệ quả\" of ADR 0013 is represented by the frozen H3 \"0013 Consequences\"; the title differs (prefixed with the ADR number, English) but the section it opens is the same. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading H4 'Hệ quả' (work-state.md L1715) to H3 '0013 Consequences' (L372): title and depth change only, section payload and following-block digests equal on both sides (both digests recomputed independently), target ancestry names ADR 0013 like the source position, the frozen-heading quote in the rationale equals the target heading, depth H4 to H3 is a permitted depth-only change that the rationale does not name",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "19ae019de9e9e6e87ca9d19d8bb92a18bbefab9ab1579d1010a315477e994782",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "9. ADR 0013 Report-Not-Write Channel For Discovered-From"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-103"
}
```

## Entry decisions-104

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "collection": "claims",
  "claimId": "claim_b8d85d30862c55869062b5418f430f69",
  "before": {
    "claimId": "claim_b8d85d30862c55869062b5418f430f69",
    "sourceUnitDigest": "dd8567cf8f523681",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "pending",
    "targetAnchor": "unheaded-block-48",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0013 (source lines 1717-1724, starting \"- **Runner vẫn một-cửa-ghi.** Worker phát dữ liệu; RUNNER ghi. Không c\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "dd8567cf8f5236817bec1f249d0b21893c5d99f1c4a3d39e95dfe7e68595079c",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "9. ADR 0013 Report-Not-Write Channel For Discovered-From",
      "0013 Consequences"
    ]
  },
  "after": {
    "claimId": "claim_b8d85d30862c55869062b5418f430f69",
    "sourceUnitDigest": "dd8567cf8f523681",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "unheaded-block-48",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0013 (source lines 1717-1724, starting \"- **Runner vẫn một-cửa-ghi.** Worker phát dữ liệu; RUNNER ghi. Không c\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: digests recomputed by extractor and independent hash and equal (text byte-equal), shard row equals pack, source and target anchors pass, ancestry 0013 Consequences equals the shard, rationale line range 1717-1724 and target anchor match the unit; text not re-read beyond byte equality",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "dd8567cf8f5236817bec1f249d0b21893c5d99f1c4a3d39e95dfe7e68595079c",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "9. ADR 0013 Report-Not-Write Channel For Discovered-From",
      "0013 Consequences"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_b8d85d30862c55869062b5418f430f69",
    "sourceUnitDigest": "dd8567cf8f523681",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "unheaded-block-48",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0013 (source lines 1717-1724, starting \"- **Runner vẫn một-cửa-ghi.** Worker phát dữ liệu; RUNNER ghi. Không c\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: digests recomputed by extractor and independent hash and equal (text byte-equal), shard row equals pack, source and target anchors pass, ancestry 0013 Consequences equals the shard, rationale line range 1717-1724 and target anchor match the unit; text not re-read beyond byte equality",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "dd8567cf8f5236817bec1f249d0b21893c5d99f1c4a3d39e95dfe7e68595079c",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "9. ADR 0013 Report-Not-Write Channel For Discovered-From",
      "0013 Consequences"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-104"
}
```

## Entry decisions-105

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "collection": "claims",
  "claimId": "claim_9f56719f95c81edecfe6dfda00ca0268",
  "before": {
    "claimId": "claim_9f56719f95c81edecfe6dfda00ca0268",
    "sourceUnitDigest": "5c944fd5d5e941cc",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "pending",
    "targetAnchor": "0013-trust-boundary",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Section heading \"Ranh giới tin cậy (bổ chú 2026-07-18, review-fix S11)\" of ADR 0013 is represented by the frozen H3 \"0013 Trust Boundary\"; the title differs (prefixed with the ADR number, English) but the section it opens is the same. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "f4b2987afebaa4bfcb171bf9122acb39d864d4321de4cc1af5bc61afa7f3c58b",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "9. ADR 0013 Report-Not-Write Channel For Discovered-From"
    ]
  },
  "after": {
    "claimId": "claim_9f56719f95c81edecfe6dfda00ca0268",
    "sourceUnitDigest": "5c944fd5d5e941cc",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "0013-trust-boundary",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Section heading \"Ranh giới tin cậy (bổ chú 2026-07-18, review-fix S11)\" of ADR 0013 is represented by the frozen H3 \"0013 Trust Boundary\"; the title differs (prefixed with the ADR number, English) but the section it opens is the same. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading H4 'Ranh giới tin cậy (bổ chú 2026-07-18, review-fix S11)' (work-state.md L1726) to H3 '0013 Trust Boundary' (L383): title and depth change only, section payload and following-block digests equal on both sides (both digests recomputed independently), target ancestry names ADR 0013 like the source position, the frozen-heading quote in the rationale equals the target heading, depth H4 to H3 is a permitted depth-only change that the rationale does not name; the dated annotation in the source title is not in the target title, which the rationale discloses by quoting the full source title",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "f4b2987afebaa4bfcb171bf9122acb39d864d4321de4cc1af5bc61afa7f3c58b",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "9. ADR 0013 Report-Not-Write Channel For Discovered-From"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_9f56719f95c81edecfe6dfda00ca0268",
    "sourceUnitDigest": "5c944fd5d5e941cc",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "0013-trust-boundary",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Section heading \"Ranh giới tin cậy (bổ chú 2026-07-18, review-fix S11)\" of ADR 0013 is represented by the frozen H3 \"0013 Trust Boundary\"; the title differs (prefixed with the ADR number, English) but the section it opens is the same. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading H4 'Ranh giới tin cậy (bổ chú 2026-07-18, review-fix S11)' (work-state.md L1726) to H3 '0013 Trust Boundary' (L383): title and depth change only, section payload and following-block digests equal on both sides (both digests recomputed independently), target ancestry names ADR 0013 like the source position, the frozen-heading quote in the rationale equals the target heading, depth H4 to H3 is a permitted depth-only change that the rationale does not name; the dated annotation in the source title is not in the target title, which the rationale discloses by quoting the full source title",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "f4b2987afebaa4bfcb171bf9122acb39d864d4321de4cc1af5bc61afa7f3c58b",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "9. ADR 0013 Report-Not-Write Channel For Discovered-From"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-105"
}
```

## Entry decisions-106

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "collection": "claims",
  "claimId": "claim_a4c7eec1fc96a1ad212a5de75a8942c5",
  "before": {
    "claimId": "claim_a4c7eec1fc96a1ad212a5de75a8942c5",
    "sourceUnitDigest": "1e83f0bc05ec81d1",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "pending",
    "targetAnchor": "unheaded-block-49",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0013 (source lines 1728-1740, starting \"`title`/`description` trong một khối `fgos-discovered` là VĂN BẢN KHÔN\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "1e83f0bc05ec81d1fe854887d220e203809ead02d46721a52758b39275350332",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "9. ADR 0013 Report-Not-Write Channel For Discovered-From",
      "0013 Trust Boundary"
    ]
  },
  "after": {
    "claimId": "claim_a4c7eec1fc96a1ad212a5de75a8942c5",
    "sourceUnitDigest": "1e83f0bc05ec81d1",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "unheaded-block-49",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0013 (source lines 1728-1740, starting \"`title`/`description` trong một khối `fgos-discovered` là VĂN BẢN KHÔN\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: digests recomputed by extractor and independent hash and equal (text byte-equal), shard row equals pack, source and target anchors pass, ancestry 0013 Trust Boundary equals the shard, rationale line range 1728-1740 and target anchor match the unit; text not re-read beyond byte equality",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "1e83f0bc05ec81d1fe854887d220e203809ead02d46721a52758b39275350332",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "9. ADR 0013 Report-Not-Write Channel For Discovered-From",
      "0013 Trust Boundary"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_a4c7eec1fc96a1ad212a5de75a8942c5",
    "sourceUnitDigest": "1e83f0bc05ec81d1",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "unheaded-block-49",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0013 (source lines 1728-1740, starting \"`title`/`description` trong một khối `fgos-discovered` là VĂN BẢN KHÔN\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: digests recomputed by extractor and independent hash and equal (text byte-equal), shard row equals pack, source and target anchors pass, ancestry 0013 Trust Boundary equals the shard, rationale line range 1728-1740 and target anchor match the unit; text not re-read beyond byte equality",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "1e83f0bc05ec81d1fe854887d220e203809ead02d46721a52758b39275350332",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "9. ADR 0013 Report-Not-Write Channel For Discovered-From",
      "0013 Trust Boundary"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-106"
}
```

## Entry decisions-107

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "collection": "claims",
  "claimId": "claim_4e04420f3322b42d6a313faa72216ae9",
  "before": {
    "claimId": "claim_4e04420f3322b42d6a313faa72216ae9",
    "sourceUnitDigest": "58646cbd3a8ef4bd",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "pending",
    "targetAnchor": "0013-delivery-guarantee",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Section heading \"Bảo đảm giao-nhận (bổ chú 2026-07-18, review-fix S11)\" of ADR 0013 is represented by the frozen H3 \"0013 Delivery Guarantee\"; the title differs (prefixed with the ADR number, English) but the section it opens is the same. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "42a5b4fd66d36c0accc5dd7dffd9f8d1fb12d5b002b70a26114cfe538f6c23f1",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "9. ADR 0013 Report-Not-Write Channel For Discovered-From"
    ]
  },
  "after": {
    "claimId": "claim_4e04420f3322b42d6a313faa72216ae9",
    "sourceUnitDigest": "58646cbd3a8ef4bd",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "0013-delivery-guarantee",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Section heading \"Bảo đảm giao-nhận (bổ chú 2026-07-18, review-fix S11)\" of ADR 0013 is represented by the frozen H3 \"0013 Delivery Guarantee\"; the title differs (prefixed with the ADR number, English) but the section it opens is the same. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading H4 'Bảo đảm giao-nhận (bổ chú 2026-07-18, review-fix S11)' (work-state.md L1742) to H3 '0013 Delivery Guarantee' (L399): title and depth change only, section payload and following-block digests equal on both sides (both digests recomputed independently), target ancestry names ADR 0013 like the source position, the frozen-heading quote in the rationale equals the target heading, depth H4 to H3 is a permitted depth-only change that the rationale does not name; the dated annotation in the source title is not in the target title, which the rationale discloses by quoting the full source title",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "42a5b4fd66d36c0accc5dd7dffd9f8d1fb12d5b002b70a26114cfe538f6c23f1",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "9. ADR 0013 Report-Not-Write Channel For Discovered-From"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_4e04420f3322b42d6a313faa72216ae9",
    "sourceUnitDigest": "58646cbd3a8ef4bd",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "0013-delivery-guarantee",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Section heading \"Bảo đảm giao-nhận (bổ chú 2026-07-18, review-fix S11)\" of ADR 0013 is represented by the frozen H3 \"0013 Delivery Guarantee\"; the title differs (prefixed with the ADR number, English) but the section it opens is the same. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading H4 'Bảo đảm giao-nhận (bổ chú 2026-07-18, review-fix S11)' (work-state.md L1742) to H3 '0013 Delivery Guarantee' (L399): title and depth change only, section payload and following-block digests equal on both sides (both digests recomputed independently), target ancestry names ADR 0013 like the source position, the frozen-heading quote in the rationale equals the target heading, depth H4 to H3 is a permitted depth-only change that the rationale does not name; the dated annotation in the source title is not in the target title, which the rationale discloses by quoting the full source title",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "42a5b4fd66d36c0accc5dd7dffd9f8d1fb12d5b002b70a26114cfe538f6c23f1",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "9. ADR 0013 Report-Not-Write Channel For Discovered-From"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-107"
}
```

## Entry decisions-108

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "collection": "claims",
  "claimId": "claim_bd1c7b0191b236990a4740f007de2397",
  "before": {
    "claimId": "claim_bd1c7b0191b236990a4740f007de2397",
    "sourceUnitDigest": "9a5163f684996577",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "pending",
    "targetAnchor": "unheaded-block-50",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0013 (source lines 1744-1748, starting \"Kênh này là **cố-gắng-tối-đa, tối-đa-một-lần** (best-effort, at-most-o\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "9a5163f6849965777501890f2c89595562a69b5f7de6fda209b27130d346a77b",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "9. ADR 0013 Report-Not-Write Channel For Discovered-From",
      "0013 Delivery Guarantee"
    ]
  },
  "after": {
    "claimId": "claim_bd1c7b0191b236990a4740f007de2397",
    "sourceUnitDigest": "9a5163f684996577",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "unheaded-block-50",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0013 (source lines 1744-1748, starting \"Kênh này là **cố-gắng-tối-đa, tối-đa-một-lần** (best-effort, at-most-o\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: work-state.md#unheaded-block-160 (L1744-1748) to decisions/retired-decision-history.md#unheaded-block-50 (L401-405): text byte-equal (read both ends, 505 chars), digests recomputed by extractor and by independent hash, anchor passes, ancestry 0013 Delivery Guarantee equals the shard; rationale line range, anchor and opening words match the unit",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "9a5163f6849965777501890f2c89595562a69b5f7de6fda209b27130d346a77b",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "9. ADR 0013 Report-Not-Write Channel For Discovered-From",
      "0013 Delivery Guarantee"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_bd1c7b0191b236990a4740f007de2397",
    "sourceUnitDigest": "9a5163f684996577",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "unheaded-block-50",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0013 (source lines 1744-1748, starting \"Kênh này là **cố-gắng-tối-đa, tối-đa-một-lần** (best-effort, at-most-o\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: work-state.md#unheaded-block-160 (L1744-1748) to decisions/retired-decision-history.md#unheaded-block-50 (L401-405): text byte-equal (read both ends, 505 chars), digests recomputed by extractor and by independent hash, anchor passes, ancestry 0013 Delivery Guarantee equals the shard; rationale line range, anchor and opening words match the unit",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "9a5163f6849965777501890f2c89595562a69b5f7de6fda209b27130d346a77b",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "9. ADR 0013 Report-Not-Write Channel For Discovered-From",
      "0013 Delivery Guarantee"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-108"
}
```

## Entry decisions-109

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "collection": "claims",
  "claimId": "claim_fe29583fb3eaae959e22d8ea42f76e6d",
  "before": {
    "claimId": "claim_fe29583fb3eaae959e22d8ea42f76e6d",
    "sourceUnitDigest": "e702d74cca4d0100",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "pending",
    "targetAnchor": "0013-alternatives-considered",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Section heading \"Phương án đã cân nhắc và bỏ\" of ADR 0013 is represented by the frozen H3 \"0013 Alternatives Considered\"; the title differs (prefixed with the ADR number, English) but the section it opens is the same. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "dd8d4e0029a8249cf8149298e7a2d77c1497f8922738eb1904e786085c1b7f65",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "9. ADR 0013 Report-Not-Write Channel For Discovered-From"
    ]
  },
  "after": {
    "claimId": "claim_fe29583fb3eaae959e22d8ea42f76e6d",
    "sourceUnitDigest": "e702d74cca4d0100",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "0013-alternatives-considered",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Section heading \"Phương án đã cân nhắc và bỏ\" of ADR 0013 is represented by the frozen H3 \"0013 Alternatives Considered\"; the title differs (prefixed with the ADR number, English) but the section it opens is the same. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading H4 'Phương án đã cân nhắc và bỏ' (work-state.md L1750) to H3 '0013 Alternatives Considered' (L407): title and depth change only, section payload and following-block digests equal on both sides (both digests recomputed independently), target ancestry names ADR 0013 like the source position, the frozen-heading quote in the rationale equals the target heading, depth H4 to H3 is a permitted depth-only change that the rationale does not name",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "dd8d4e0029a8249cf8149298e7a2d77c1497f8922738eb1904e786085c1b7f65",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "9. ADR 0013 Report-Not-Write Channel For Discovered-From"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_fe29583fb3eaae959e22d8ea42f76e6d",
    "sourceUnitDigest": "e702d74cca4d0100",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "0013-alternatives-considered",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Section heading \"Phương án đã cân nhắc và bỏ\" of ADR 0013 is represented by the frozen H3 \"0013 Alternatives Considered\"; the title differs (prefixed with the ADR number, English) but the section it opens is the same. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading H4 'Phương án đã cân nhắc và bỏ' (work-state.md L1750) to H3 '0013 Alternatives Considered' (L407): title and depth change only, section payload and following-block digests equal on both sides (both digests recomputed independently), target ancestry names ADR 0013 like the source position, the frozen-heading quote in the rationale equals the target heading, depth H4 to H3 is a permitted depth-only change that the rationale does not name",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "dd8d4e0029a8249cf8149298e7a2d77c1497f8922738eb1904e786085c1b7f65",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "9. ADR 0013 Report-Not-Write Channel For Discovered-From"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-109"
}
```

## Entry decisions-110

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "collection": "claims",
  "claimId": "claim_8beebc48272beb4cf5dd32b6ed94d5d0",
  "before": {
    "claimId": "claim_8beebc48272beb4cf5dd32b6ed94d5d0",
    "sourceUnitDigest": "61cda065233d2cdb",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "pending",
    "targetAnchor": "unheaded-block-51",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0013 (source lines 1752-1757, starting \"- **Worker tự gọi `fgos add`.** Bỏ — phá vỡ runner-một-cửa-ghi và làm \") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "61cda065233d2cdb3c74df03865aa0ac7863c547f41f83f6868e8cae003d7d24",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "9. ADR 0013 Report-Not-Write Channel For Discovered-From",
      "0013 Alternatives Considered"
    ]
  },
  "after": {
    "claimId": "claim_8beebc48272beb4cf5dd32b6ed94d5d0",
    "sourceUnitDigest": "61cda065233d2cdb",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "unheaded-block-51",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0013 (source lines 1752-1757, starting \"- **Worker tự gọi `fgos add`.** Bỏ — phá vỡ runner-một-cửa-ghi và làm \") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: digests recomputed by extractor and independent hash and equal (text byte-equal), shard row equals pack, source and target anchors pass, ancestry 0013 Alternatives Considered equals the shard, rationale line range 1752-1757 and target anchor match the unit; text not re-read beyond byte equality",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "61cda065233d2cdb3c74df03865aa0ac7863c547f41f83f6868e8cae003d7d24",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "9. ADR 0013 Report-Not-Write Channel For Discovered-From",
      "0013 Alternatives Considered"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_8beebc48272beb4cf5dd32b6ed94d5d0",
    "sourceUnitDigest": "61cda065233d2cdb",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "unheaded-block-51",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0013 (source lines 1752-1757, starting \"- **Worker tự gọi `fgos add`.** Bỏ — phá vỡ runner-một-cửa-ghi và làm \") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: digests recomputed by extractor and independent hash and equal (text byte-equal), shard row equals pack, source and target anchors pass, ancestry 0013 Alternatives Considered equals the shard, rationale line range 1752-1757 and target anchor match the unit; text not re-read beyond byte equality",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "61cda065233d2cdb3c74df03865aa0ac7863c547f41f83f6868e8cae003d7d24",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "9. ADR 0013 Report-Not-Write Channel For Discovered-From",
      "0013 Alternatives Considered"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-110"
}
```

## Entry decisions-111

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "collection": "claims",
  "claimId": "claim_e763e03b02e0c2d677ef4b49f30a9ad3",
  "before": {
    "claimId": "claim_e763e03b02e0c2d677ef4b49f30a9ad3",
    "sourceUnitDigest": "74fba64154edbbc6",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "pending",
    "targetAnchor": "10-adr-0019-pre-release-exemption-for-the-schema-evolution-rule",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Source ADR 0019 title heading is represented by the frozen H2 \"10. ADR 0019 ...\" (10-adr-0019-pre-release-exemption-for-the-schema-evolution-rule); title is renumbered and re-worded in English, text of the record is unchanged. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "76fc593cba1fa3b5ebaf7e373e9251e1774f5eb9c16d0e6ced80024d7d410c8f",
    "targetAncestry": [
      "Retired Decision History: Work State"
    ]
  },
  "after": {
    "claimId": "claim_e763e03b02e0c2d677ef4b49f30a9ad3",
    "sourceUnitDigest": "74fba64154edbbc6",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "10-adr-0019-pre-release-exemption-for-the-schema-evolution-rule",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Source ADR 0019 title heading is represented by the frozen H2 \"10. ADR 0019 ...\" (10-adr-0019-pre-release-exemption-for-the-schema-evolution-rule); title is renumbered and re-worded in English, text of the record is unchanged. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading unit \"0019 — Miễn trừ pre-release cho RUL11 (viết lạ\" becomes \"10. ADR 0019 Pre-Release Exemption For The Schema Ev\", the heading has no body text in either file, so only title and level differ as the rationale says; anchor and target digest unchanged from the reviewed binding, shard equals pack",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "76fc593cba1fa3b5ebaf7e373e9251e1774f5eb9c16d0e6ced80024d7d410c8f",
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
    "claimId": "claim_e763e03b02e0c2d677ef4b49f30a9ad3",
    "sourceUnitDigest": "74fba64154edbbc6",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "10-adr-0019-pre-release-exemption-for-the-schema-evolution-rule",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Source ADR 0019 title heading is represented by the frozen H2 \"10. ADR 0019 ...\" (10-adr-0019-pre-release-exemption-for-the-schema-evolution-rule); title is renumbered and re-worded in English, text of the record is unchanged. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading unit \"0019 — Miễn trừ pre-release cho RUL11 (viết lạ\" becomes \"10. ADR 0019 Pre-Release Exemption For The Schema Ev\", the heading has no body text in either file, so only title and level differ as the rationale says; anchor and target digest unchanged from the reviewed binding, shard equals pack",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "76fc593cba1fa3b5ebaf7e373e9251e1774f5eb9c16d0e6ced80024d7d410c8f",
    "targetAncestry": [
      "Retired Decision History: Work State"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-111"
}
```

## Entry decisions-112

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "collection": "claims",
  "claimId": "claim_a9ff1aae0ff13bbce2c3ba5e9f30b19e",
  "before": {
    "claimId": "claim_a9ff1aae0ff13bbce2c3ba5e9f30b19e",
    "sourceUnitDigest": "15548911bb940170",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "pending",
    "targetAnchor": "0019-context",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Section heading \"Bối cảnh\" of ADR 0019 is represented by the frozen H3 \"0019 Context\"; the title differs (prefixed with the ADR number, English) but the section it opens is the same. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "b589b460ed77e03ef37631a2f2e387529c52965ea0cb49f198e4e67d4c368d04",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "10. ADR 0019 Pre-Release Exemption For The Schema Evolution Rule"
    ]
  },
  "after": {
    "claimId": "claim_a9ff1aae0ff13bbce2c3ba5e9f30b19e",
    "sourceUnitDigest": "15548911bb940170",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "0019-context",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Section heading \"Bối cảnh\" of ADR 0019 is represented by the frozen H3 \"0019 Context\"; the title differs (prefixed with the ADR number, English) but the section it opens is the same. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading unit \"Bối cảnh\" becomes \"0019 Context\", every line after the heading line is byte-equal (715 chars), so only title and level differ as the rationale says; anchor and target digest unchanged from the reviewed binding, shard equals pack",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "b589b460ed77e03ef37631a2f2e387529c52965ea0cb49f198e4e67d4c368d04",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "10. ADR 0019 Pre-Release Exemption For The Schema Evolution Rule"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_a9ff1aae0ff13bbce2c3ba5e9f30b19e",
    "sourceUnitDigest": "15548911bb940170",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "0019-context",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Section heading \"Bối cảnh\" of ADR 0019 is represented by the frozen H3 \"0019 Context\"; the title differs (prefixed with the ADR number, English) but the section it opens is the same. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading unit \"Bối cảnh\" becomes \"0019 Context\", every line after the heading line is byte-equal (715 chars), so only title and level differ as the rationale says; anchor and target digest unchanged from the reviewed binding, shard equals pack",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "b589b460ed77e03ef37631a2f2e387529c52965ea0cb49f198e4e67d4c368d04",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "10. ADR 0019 Pre-Release Exemption For The Schema Evolution Rule"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-112"
}
```

## Entry decisions-113

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "collection": "claims",
  "claimId": "claim_b87e27dca1c9e551eb4d296c858d0f08",
  "before": {
    "claimId": "claim_b87e27dca1c9e551eb4d296c858d0f08",
    "sourceUnitDigest": "5a365fcd8c5b99f7",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "pending",
    "targetAnchor": "unheaded-block-52",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0019 (source lines 1763-1766, starting \"`RUL11 (tiến hóa schema)` (`docs/specs/work-state.md:886`, D-ID `feed7\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "5a365fcd8c5b99f79d1a6f32be9ae4363651d14b79a300edbe4f57e8b0827fe3",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "10. ADR 0019 Pre-Release Exemption For The Schema Evolution Rule",
      "0019 Context"
    ]
  },
  "after": {
    "claimId": "claim_b87e27dca1c9e551eb4d296c858d0f08",
    "sourceUnitDigest": "5a365fcd8c5b99f7",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "unheaded-block-52",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0019 (source lines 1763-1766, starting \"`RUL11 (tiến hóa schema)` (`docs/specs/work-state.md:886`, D-ID `feed7\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: 287 chars byte-equal between source and target by script, ancestry differs only by the translated heading (\"0019 Context\"), anchor unheaded-block-52 ok, digest and shard to pack equal, binding unchanged from the reviewed state; text not read line by line",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "5a365fcd8c5b99f79d1a6f32be9ae4363651d14b79a300edbe4f57e8b0827fe3",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "10. ADR 0019 Pre-Release Exemption For The Schema Evolution Rule",
      "0019 Context"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_b87e27dca1c9e551eb4d296c858d0f08",
    "sourceUnitDigest": "5a365fcd8c5b99f7",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "unheaded-block-52",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0019 (source lines 1763-1766, starting \"`RUL11 (tiến hóa schema)` (`docs/specs/work-state.md:886`, D-ID `feed7\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: 287 chars byte-equal between source and target by script, ancestry differs only by the translated heading (\"0019 Context\"), anchor unheaded-block-52 ok, digest and shard to pack equal, binding unchanged from the reviewed state; text not read line by line",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "5a365fcd8c5b99f79d1a6f32be9ae4363651d14b79a300edbe4f57e8b0827fe3",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "10. ADR 0019 Pre-Release Exemption For The Schema Evolution Rule",
      "0019 Context"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-113"
}
```

## Entry decisions-114

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "collection": "claims",
  "claimId": "claim_5770fe5a53057464d4c4795b24abb38a",
  "before": {
    "claimId": "claim_5770fe5a53057464d4c4795b24abb38a",
    "sourceUnitDigest": "04c1c4fb64c70d91",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "pending",
    "targetAnchor": "unheaded-block-53",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0019 (source lines 1768-1773, starting \"STR46 đổi tên trường `actor` (và các trường phái sinh: `claimActor`, k\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "04c1c4fb64c70d916b094a4a20866c3519994021038cee2d7a78f7701119ebf2",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "10. ADR 0019 Pre-Release Exemption For The Schema Evolution Rule",
      "0019 Context"
    ]
  },
  "after": {
    "claimId": "claim_5770fe5a53057464d4c4795b24abb38a",
    "sourceUnitDigest": "04c1c4fb64c70d91",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "unheaded-block-53",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0019 (source lines 1768-1773, starting \"STR46 đổi tên trường `actor` (và các trường phái sinh: `claimActor`, k\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: 425 chars byte-equal between source and target by script, ancestry differs only by the translated heading (\"0019 Context\"), anchor unheaded-block-53 ok, digest and shard to pack equal, binding unchanged from the reviewed state; text not read line by line",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "04c1c4fb64c70d916b094a4a20866c3519994021038cee2d7a78f7701119ebf2",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "10. ADR 0019 Pre-Release Exemption For The Schema Evolution Rule",
      "0019 Context"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_5770fe5a53057464d4c4795b24abb38a",
    "sourceUnitDigest": "04c1c4fb64c70d91",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "unheaded-block-53",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0019 (source lines 1768-1773, starting \"STR46 đổi tên trường `actor` (và các trường phái sinh: `claimActor`, k\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: 425 chars byte-equal between source and target by script, ancestry differs only by the translated heading (\"0019 Context\"), anchor unheaded-block-53 ok, digest and shard to pack equal, binding unchanged from the reviewed state; text not read line by line",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "04c1c4fb64c70d916b094a4a20866c3519994021038cee2d7a78f7701119ebf2",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "10. ADR 0019 Pre-Release Exemption For The Schema Evolution Rule",
      "0019 Context"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-114"
}
```

## Entry decisions-115

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "collection": "claims",
  "claimId": "claim_86e1127b120054dafe55e52585c2a1d9",
  "before": {
    "claimId": "claim_86e1127b120054dafe55e52585c2a1d9",
    "sourceUnitDigest": "1eb8c8df3524d600",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "pending",
    "targetAnchor": "0019-decision",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Section heading \"Quyết định\" of ADR 0019 is represented by the frozen H3 \"0019 Decision\"; the title differs (prefixed with the ADR number, English) but the section it opens is the same. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "f4473462b5e03712e55bee9a240b00c7699d73164ee8bc8bf071b6dfff526187",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "10. ADR 0019 Pre-Release Exemption For The Schema Evolution Rule"
    ]
  },
  "after": {
    "claimId": "claim_86e1127b120054dafe55e52585c2a1d9",
    "sourceUnitDigest": "1eb8c8df3524d600",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "0019-decision",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Section heading \"Quyết định\" of ADR 0019 is represented by the frozen H3 \"0019 Decision\"; the title differs (prefixed with the ADR number, English) but the section it opens is the same. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading unit \"Quyết định\" becomes \"0019 Decision\", every line after the heading line is byte-equal (2272 chars), so only title and level differ as the rationale says; anchor and target digest unchanged from the reviewed binding, shard equals pack",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "f4473462b5e03712e55bee9a240b00c7699d73164ee8bc8bf071b6dfff526187",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "10. ADR 0019 Pre-Release Exemption For The Schema Evolution Rule"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_86e1127b120054dafe55e52585c2a1d9",
    "sourceUnitDigest": "1eb8c8df3524d600",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "0019-decision",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Section heading \"Quyết định\" of ADR 0019 is represented by the frozen H3 \"0019 Decision\"; the title differs (prefixed with the ADR number, English) but the section it opens is the same. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading unit \"Quyết định\" becomes \"0019 Decision\", every line after the heading line is byte-equal (2272 chars), so only title and level differ as the rationale says; anchor and target digest unchanged from the reviewed binding, shard equals pack",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "f4473462b5e03712e55bee9a240b00c7699d73164ee8bc8bf071b6dfff526187",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "10. ADR 0019 Pre-Release Exemption For The Schema Evolution Rule"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-115"
}
```

## Entry decisions-116

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "collection": "claims",
  "claimId": "claim_ef05e66d20bc35c8c80ac2a83dbe7d92",
  "before": {
    "claimId": "claim_ef05e66d20bc35c8c80ac2a83dbe7d92",
    "sourceUnitDigest": "8dc8ecc4dc88503f",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "pending",
    "targetAnchor": "unheaded-block-54",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0019 (source lines 1777-1780, starting \"Ghi nhận một **miễn trừ pre-release** cho `RUL11 (tiến hóa schema)`: t\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "8dc8ecc4dc88503fd629b00fef6a1841c76a30a42340b9255a3c1f53300fd2c3",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "10. ADR 0019 Pre-Release Exemption For The Schema Evolution Rule",
      "0019 Decision"
    ]
  },
  "after": {
    "claimId": "claim_ef05e66d20bc35c8c80ac2a83dbe7d92",
    "sourceUnitDigest": "8dc8ecc4dc88503f",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "unheaded-block-54",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0019 (source lines 1777-1780, starting \"Ghi nhận một **miễn trừ pre-release** cho `RUL11 (tiến hóa schema)`: t\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: 276 chars byte-equal between source and target by script, ancestry differs only by the translated heading (\"0019 Decision\"), anchor unheaded-block-54 ok, digest and shard to pack equal, binding unchanged from the reviewed state; text not read line by line",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "8dc8ecc4dc88503fd629b00fef6a1841c76a30a42340b9255a3c1f53300fd2c3",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "10. ADR 0019 Pre-Release Exemption For The Schema Evolution Rule",
      "0019 Decision"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_ef05e66d20bc35c8c80ac2a83dbe7d92",
    "sourceUnitDigest": "8dc8ecc4dc88503f",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "unheaded-block-54",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0019 (source lines 1777-1780, starting \"Ghi nhận một **miễn trừ pre-release** cho `RUL11 (tiến hóa schema)`: t\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: 276 chars byte-equal between source and target by script, ancestry differs only by the translated heading (\"0019 Decision\"), anchor unheaded-block-54 ok, digest and shard to pack equal, binding unchanged from the reviewed state; text not read line by line",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "8dc8ecc4dc88503fd629b00fef6a1841c76a30a42340b9255a3c1f53300fd2c3",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "10. ADR 0019 Pre-Release Exemption For The Schema Evolution Rule",
      "0019 Decision"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-116"
}
```

## Entry decisions-117

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "collection": "claims",
  "claimId": "claim_16901b7106220f70f44d600ba4dbb40f",
  "before": {
    "claimId": "claim_16901b7106220f70f44d600ba4dbb40f",
    "sourceUnitDigest": "98bb7f4e04652171",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "pending",
    "targetAnchor": "unheaded-block-55",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0019 (source lines 1782-1804, starting \"- **Phạm vi (coverage).** Miễn trừ bao trùm cả BA kho `.fgos` liệt ở t\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "98bb7f4e04652171ceed757c50de5df4b645a5a6b96aa900b80b6ae114c6391f",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "10. ADR 0019 Pre-Release Exemption For The Schema Evolution Rule",
      "0019 Decision"
    ]
  },
  "after": {
    "claimId": "claim_16901b7106220f70f44d600ba4dbb40f",
    "sourceUnitDigest": "98bb7f4e04652171",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "unheaded-block-55",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0019 (source lines 1782-1804, starting \"- **Phạm vi (coverage).** Miễn trừ bao trùm cả BA kho `.fgos` liệt ở t\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: 1620 chars byte-equal between source and target by script, ancestry differs only by the translated heading (\"0019 Decision\"), anchor unheaded-block-55 ok, digest and shard to pack equal, binding unchanged from the reviewed state; text not read line by line",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "98bb7f4e04652171ceed757c50de5df4b645a5a6b96aa900b80b6ae114c6391f",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "10. ADR 0019 Pre-Release Exemption For The Schema Evolution Rule",
      "0019 Decision"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_16901b7106220f70f44d600ba4dbb40f",
    "sourceUnitDigest": "98bb7f4e04652171",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "unheaded-block-55",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0019 (source lines 1782-1804, starting \"- **Phạm vi (coverage).** Miễn trừ bao trùm cả BA kho `.fgos` liệt ở t\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: 1620 chars byte-equal between source and target by script, ancestry differs only by the translated heading (\"0019 Decision\"), anchor unheaded-block-55 ok, digest and shard to pack equal, binding unchanged from the reviewed state; text not read line by line",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "98bb7f4e04652171ceed757c50de5df4b645a5a6b96aa900b80b6ae114c6391f",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "10. ADR 0019 Pre-Release Exemption For The Schema Evolution Rule",
      "0019 Decision"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-117"
}
```

## Entry decisions-118

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "collection": "claims",
  "claimId": "claim_6ce44d19e0f7b99b1c363579bf6eb68e",
  "before": {
    "claimId": "claim_6ce44d19e0f7b99b1c363579bf6eb68e",
    "sourceUnitDigest": "2f6e935eb95f8af8",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "pending",
    "targetAnchor": "unheaded-block-56",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0019 (source lines 1806-1810, starting \"Vì `RUL11 (tiến hóa schema)` là một luật trong spec chứ không phải một\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "2f6e935eb95f8af8bd54cd1a01fc3f7cbba7eea9b5346b6b6f2458dc94555724",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "10. ADR 0019 Pre-Release Exemption For The Schema Evolution Rule",
      "0019 Decision"
    ]
  },
  "after": {
    "claimId": "claim_6ce44d19e0f7b99b1c363579bf6eb68e",
    "sourceUnitDigest": "2f6e935eb95f8af8",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "unheaded-block-56",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0019 (source lines 1806-1810, starting \"Vì `RUL11 (tiến hóa schema)` là một luật trong spec chứ không phải một\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: 371 chars byte-equal between source and target by script, ancestry differs only by the translated heading (\"0019 Decision\"), anchor unheaded-block-56 ok, digest and shard to pack equal, binding unchanged from the reviewed state; text not read line by line",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "2f6e935eb95f8af8bd54cd1a01fc3f7cbba7eea9b5346b6b6f2458dc94555724",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "10. ADR 0019 Pre-Release Exemption For The Schema Evolution Rule",
      "0019 Decision"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_6ce44d19e0f7b99b1c363579bf6eb68e",
    "sourceUnitDigest": "2f6e935eb95f8af8",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "unheaded-block-56",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0019 (source lines 1806-1810, starting \"Vì `RUL11 (tiến hóa schema)` là một luật trong spec chứ không phải một\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: 371 chars byte-equal between source and target by script, ancestry differs only by the translated heading (\"0019 Decision\"), anchor unheaded-block-56 ok, digest and shard to pack equal, binding unchanged from the reviewed state; text not read line by line",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "2f6e935eb95f8af8bd54cd1a01fc3f7cbba7eea9b5346b6b6f2458dc94555724",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "10. ADR 0019 Pre-Release Exemption For The Schema Evolution Rule",
      "0019 Decision"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-118"
}
```

## Entry decisions-119

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "collection": "claims",
  "claimId": "claim_9974f7370cd9be4ca66f08057a94d3d7",
  "before": {
    "claimId": "claim_9974f7370cd9be4ca66f08057a94d3d7",
    "sourceUnitDigest": "8ae8c5f37b83bcd7",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "pending",
    "targetAnchor": "0019-consequences",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Section heading \"Hệ quả\" of ADR 0019 is represented by the frozen H3 \"0019 Consequences\"; the title differs (prefixed with the ADR number, English) but the section it opens is the same. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "de5943f8259424b72bc4cfb00883277e6e232f8b46e0f0fb46efcd42f5dda549",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "10. ADR 0019 Pre-Release Exemption For The Schema Evolution Rule"
    ]
  },
  "after": {
    "claimId": "claim_9974f7370cd9be4ca66f08057a94d3d7",
    "sourceUnitDigest": "8ae8c5f37b83bcd7",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "0019-consequences",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Section heading \"Hệ quả\" of ADR 0019 is represented by the frozen H3 \"0019 Consequences\"; the title differs (prefixed with the ADR number, English) but the section it opens is the same. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading unit \"Hệ quả\" becomes \"0019 Consequences\", every line after the heading line is byte-equal (533 chars), so only title and level differ as the rationale says; anchor and target digest unchanged from the reviewed binding, shard equals pack",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "de5943f8259424b72bc4cfb00883277e6e232f8b46e0f0fb46efcd42f5dda549",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "10. ADR 0019 Pre-Release Exemption For The Schema Evolution Rule"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_9974f7370cd9be4ca66f08057a94d3d7",
    "sourceUnitDigest": "8ae8c5f37b83bcd7",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "0019-consequences",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Section heading \"Hệ quả\" of ADR 0019 is represented by the frozen H3 \"0019 Consequences\"; the title differs (prefixed with the ADR number, English) but the section it opens is the same. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading unit \"Hệ quả\" becomes \"0019 Consequences\", every line after the heading line is byte-equal (533 chars), so only title and level differ as the rationale says; anchor and target digest unchanged from the reviewed binding, shard equals pack",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "de5943f8259424b72bc4cfb00883277e6e232f8b46e0f0fb46efcd42f5dda549",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "10. ADR 0019 Pre-Release Exemption For The Schema Evolution Rule"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-119"
}
```

## Entry decisions-120

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "collection": "claims",
  "claimId": "claim_38fc27aadc8aecf157c5db30cda1862b",
  "before": {
    "claimId": "claim_38fc27aadc8aecf157c5db30cda1862b",
    "sourceUnitDigest": "03dc0e5f689c7e6c",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "pending",
    "targetAnchor": "unheaded-block-57",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0019 (source lines 1814-1820, starting \"- **Replay không còn đọc hai tên cho một trường.** Sau khi viết lại và\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "03dc0e5f689c7e6c592f7134944ef404913e3d53ba2d2f02d7812e330a6bd60d",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "10. ADR 0019 Pre-Release Exemption For The Schema Evolution Rule",
      "0019 Consequences"
    ]
  },
  "after": {
    "claimId": "claim_38fc27aadc8aecf157c5db30cda1862b",
    "sourceUnitDigest": "03dc0e5f689c7e6c",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "unheaded-block-57",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0019 (source lines 1814-1820, starting \"- **Replay không còn đọc hai tên cho một trường.** Sau khi viết lại và\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: 532 chars byte-equal between source and target by script, ancestry differs only by the translated heading (\"0019 Consequences\"), anchor unheaded-block-57 ok, digest and shard to pack equal, binding unchanged from the reviewed state; text not read line by line",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "03dc0e5f689c7e6c592f7134944ef404913e3d53ba2d2f02d7812e330a6bd60d",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "10. ADR 0019 Pre-Release Exemption For The Schema Evolution Rule",
      "0019 Consequences"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_38fc27aadc8aecf157c5db30cda1862b",
    "sourceUnitDigest": "03dc0e5f689c7e6c",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "unheaded-block-57",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0019 (source lines 1814-1820, starting \"- **Replay không còn đọc hai tên cho một trường.** Sau khi viết lại và\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: 532 chars byte-equal between source and target by script, ancestry differs only by the translated heading (\"0019 Consequences\"), anchor unheaded-block-57 ok, digest and shard to pack equal, binding unchanged from the reviewed state; text not read line by line",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "03dc0e5f689c7e6c592f7134944ef404913e3d53ba2d2f02d7812e330a6bd60d",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "10. ADR 0019 Pre-Release Exemption For The Schema Evolution Rule",
      "0019 Consequences"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-120"
}
```

