# Bounded re-review: decisions 8

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

## Entry decisions-121

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "collection": "claims",
  "claimId": "claim_ebfb0421fa0d9c6693aaf57a262dd471",
  "before": {
    "claimId": "claim_ebfb0421fa0d9c6693aaf57a262dd471",
    "sourceUnitDigest": "c71c9558d2d278e6",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "pending",
    "targetAnchor": "11-adr-0024-rename-proposed-status-to-awaiting-approval",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Source ADR 0024 title heading is represented by the frozen H2 \"11. ADR 0024 ...\" (11-adr-0024-rename-proposed-status-to-awaiting-approval); title is renumbered and re-worded in English, text of the record is unchanged. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "9a20af2987019cf46f528ef85e14e942102ce13d868c9cd7ae034e513c1da91a",
    "targetAncestry": [
      "Retired Decision History: Work State"
    ]
  },
  "after": {
    "claimId": "claim_ebfb0421fa0d9c6693aaf57a262dd471",
    "sourceUnitDigest": "c71c9558d2d278e6",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "11-adr-0024-rename-proposed-status-to-awaiting-approval",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Source ADR 0024 title heading is represented by the frozen H2 \"11. ADR 0024 ...\" (11-adr-0024-rename-proposed-status-to-awaiting-approval); title is renumbered and re-worded in English, text of the record is unchanged. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading unit \"0024 — Đổi tên status `proposed` thành `awaiti\" becomes \"11. ADR 0024 Rename Proposed Status To Awaiting-Appr\", the heading has no body text in either file, so only title and level differ as the rationale says; anchor and target digest unchanged from the reviewed binding, shard equals pack",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "9a20af2987019cf46f528ef85e14e942102ce13d868c9cd7ae034e513c1da91a",
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
    "claimId": "claim_ebfb0421fa0d9c6693aaf57a262dd471",
    "sourceUnitDigest": "c71c9558d2d278e6",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "11-adr-0024-rename-proposed-status-to-awaiting-approval",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Source ADR 0024 title heading is represented by the frozen H2 \"11. ADR 0024 ...\" (11-adr-0024-rename-proposed-status-to-awaiting-approval); title is renumbered and re-worded in English, text of the record is unchanged. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading unit \"0024 — Đổi tên status `proposed` thành `awaiti\" becomes \"11. ADR 0024 Rename Proposed Status To Awaiting-Appr\", the heading has no body text in either file, so only title and level differ as the rationale says; anchor and target digest unchanged from the reviewed binding, shard equals pack",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "9a20af2987019cf46f528ef85e14e942102ce13d868c9cd7ae034e513c1da91a",
    "targetAncestry": [
      "Retired Decision History: Work State"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-121"
}
```

## Entry decisions-122

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "collection": "claims",
  "claimId": "claim_aa501f53cee0b7ec6adc656971266a97",
  "before": {
    "claimId": "claim_aa501f53cee0b7ec6adc656971266a97",
    "sourceUnitDigest": "a70886dacf6f54f1",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "pending",
    "targetAnchor": "0024-context",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Section heading \"Bối cảnh\" of ADR 0024 is represented by the frozen H3 \"0024 Context\"; the title differs (prefixed with the ADR number, English) but the section it opens is the same. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "e7d340683e7d23c9fc7e740c59e3218b1ba61e5d3580913aaa17db28483b9bd9",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "11. ADR 0024 Rename Proposed Status To Awaiting-Approval"
    ]
  },
  "after": {
    "claimId": "claim_aa501f53cee0b7ec6adc656971266a97",
    "sourceUnitDigest": "a70886dacf6f54f1",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "0024-context",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Section heading \"Bối cảnh\" of ADR 0024 is represented by the frozen H3 \"0024 Context\"; the title differs (prefixed with the ADR number, English) but the section it opens is the same. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading unit \"Bối cảnh\" becomes \"0024 Context\", every line after the heading line is byte-equal (1093 chars), so only title and level differ as the rationale says; anchor and target digest unchanged from the reviewed binding, shard equals pack",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "e7d340683e7d23c9fc7e740c59e3218b1ba61e5d3580913aaa17db28483b9bd9",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "11. ADR 0024 Rename Proposed Status To Awaiting-Approval"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_aa501f53cee0b7ec6adc656971266a97",
    "sourceUnitDigest": "a70886dacf6f54f1",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "0024-context",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Section heading \"Bối cảnh\" of ADR 0024 is represented by the frozen H3 \"0024 Context\"; the title differs (prefixed with the ADR number, English) but the section it opens is the same. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading unit \"Bối cảnh\" becomes \"0024 Context\", every line after the heading line is byte-equal (1093 chars), so only title and level differ as the rationale says; anchor and target digest unchanged from the reviewed binding, shard equals pack",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "e7d340683e7d23c9fc7e740c59e3218b1ba61e5d3580913aaa17db28483b9bd9",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "11. ADR 0024 Rename Proposed Status To Awaiting-Approval"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-122"
}
```

## Entry decisions-123

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-first.json",
  "collection": "claims",
  "claimId": "claim_7d0cfc9e7e784ee0492be9c2d04fa93b",
  "before": {
    "claimId": "claim_7d0cfc9e7e784ee0492be9c2d04fa93b",
    "sourceUnitDigest": "7ef891c3b1ad980c",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "pending",
    "targetAnchor": "unheaded-block-58",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0024 (source lines 1826-1831, starting \"`0006` đặt tên status `proposed` cho trạng thái \"goal-check đạt, đề xu\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "7ef891c3b1ad980c1d7b4816db14927cbe0113c300984e0fa772aab39f164989",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "11. ADR 0024 Rename Proposed Status To Awaiting-Approval",
      "0024 Context"
    ]
  },
  "after": {
    "claimId": "claim_7d0cfc9e7e784ee0492be9c2d04fa93b",
    "sourceUnitDigest": "7ef891c3b1ad980c",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "unheaded-block-58",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0024 (source lines 1826-1831, starting \"`0006` đặt tên status `proposed` cho trạng thái \"goal-check đạt, đề xu\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: read source and target, 457 chars byte-equal, source sits under \"Bối cảnh\" and target under \"0024 Context\" (translated heading, which is why the exact class is only weak); rationale describes this unit correctly and now says content unchanged; anchor unheaded-block-58 ok, binding unchanged",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "7ef891c3b1ad980c1d7b4816db14927cbe0113c300984e0fa772aab39f164989",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "11. ADR 0024 Rename Proposed Status To Awaiting-Approval",
      "0024 Context"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_7d0cfc9e7e784ee0492be9c2d04fa93b",
    "sourceUnitDigest": "7ef891c3b1ad980c",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "reviewStatus": "reviewed",
    "targetAnchor": "unheaded-block-58",
    "claimKind": "decision",
    "disposition": "promote",
    "rationale": "Body of ADR 0024 (source lines 1826-1831, starting \"`0006` đặt tên status `proposed` cho trạng thái \"goal-check đạt, đề xu\") carried line for line into its own block; text identical to the source. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: read source and target, 457 chars byte-equal, source sits under \"Bối cảnh\" and target under \"0024 Context\" (translated heading, which is why the exact class is only weak); rationale describes this unit correctly and now says content unchanged; anchor unheaded-block-58 ok, binding unchanged",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "7ef891c3b1ad980c1d7b4816db14927cbe0113c300984e0fa772aab39f164989",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "11. ADR 0024 Rename Proposed Status To Awaiting-Approval",
      "0024 Context"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-123"
}
```

## Entry decisions-124

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-second.json",
  "collection": "claims",
  "claimId": "claim_67c5f9d1a031030f5bd1f3ab27320130",
  "before": {
    "claimId": "claim_67c5f9d1a031030f5bd1f3ab27320130",
    "sourceUnitDigest": "4b0aa9f66af44b86",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-59",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "ADR 0024 context paragraph: code check showing the FSM holding proposed is domain-agnostic; text identical in the candidate 0024 Context. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "4b0aa9f66af44b8646bc59ceecd4cd0ae333b703213d215683c9721a930d8e51",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "11. ADR 0024 Rename Proposed Status To Awaiting-Approval",
      "0024 Context"
    ]
  },
  "after": {
    "claimId": "claim_67c5f9d1a031030f5bd1f3ab27320130",
    "sourceUnitDigest": "4b0aa9f66af44b86",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-59",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "ADR 0024 context paragraph: code check showing the FSM holding proposed is domain-agnostic; text identical in the candidate 0024 Context. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: 338 chars byte-equal between source and target by script, ancestry differs only by the translated heading (\"0024 Context\"), anchor unheaded-block-59 ok, digest and shard to pack equal, binding unchanged from the reviewed state; text not read line by line",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "4b0aa9f66af44b8646bc59ceecd4cd0ae333b703213d215683c9721a930d8e51",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "11. ADR 0024 Rename Proposed Status To Awaiting-Approval",
      "0024 Context"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_67c5f9d1a031030f5bd1f3ab27320130",
    "sourceUnitDigest": "4b0aa9f66af44b86",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-59",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "ADR 0024 context paragraph: code check showing the FSM holding proposed is domain-agnostic; text identical in the candidate 0024 Context. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: 338 chars byte-equal between source and target by script, ancestry differs only by the translated heading (\"0024 Context\"), anchor unheaded-block-59 ok, digest and shard to pack equal, binding unchanged from the reviewed state; text not read line by line",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "4b0aa9f66af44b8646bc59ceecd4cd0ae333b703213d215683c9721a930d8e51",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "11. ADR 0024 Rename Proposed Status To Awaiting-Approval",
      "0024 Context"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-124"
}
```

## Entry decisions-125

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-second.json",
  "collection": "claims",
  "claimId": "claim_7a2a3390e3beca0100dbfebb57cb6aab",
  "before": {
    "claimId": "claim_7a2a3390e3beca0100dbfebb57cb6aab",
    "sourceUnitDigest": "bc40e0a51da3f0b6",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-60",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "ADR 0024 context paragraph: proposed is shared vocabulary between work.status and the outcome fields; text identical, only the surrounding heading levels changed. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "bc40e0a51da3f0b6c1bc1f2d9e080ca9425d47377adf8516d68d3017e61c10d2",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "11. ADR 0024 Rename Proposed Status To Awaiting-Approval",
      "0024 Context"
    ]
  },
  "after": {
    "claimId": "claim_7a2a3390e3beca0100dbfebb57cb6aab",
    "sourceUnitDigest": "bc40e0a51da3f0b6",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-60",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "ADR 0024 context paragraph: proposed is shared vocabulary between work.status and the outcome fields; text identical, only the surrounding heading levels changed. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: read source and target, 293 chars byte-equal, source sits under \"Bối cảnh\" and target under \"0024 Context\" (translated heading, which is why the exact class is only weak); rationale describes this unit correctly and now says content unchanged; anchor unheaded-block-60 ok, binding unchanged",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "bc40e0a51da3f0b6c1bc1f2d9e080ca9425d47377adf8516d68d3017e61c10d2",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "11. ADR 0024 Rename Proposed Status To Awaiting-Approval",
      "0024 Context"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_7a2a3390e3beca0100dbfebb57cb6aab",
    "sourceUnitDigest": "bc40e0a51da3f0b6",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-60",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "ADR 0024 context paragraph: proposed is shared vocabulary between work.status and the outcome fields; text identical, only the surrounding heading levels changed. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: read source and target, 293 chars byte-equal, source sits under \"Bối cảnh\" and target under \"0024 Context\" (translated heading, which is why the exact class is only weak); rationale describes this unit correctly and now says content unchanged; anchor unheaded-block-60 ok, binding unchanged",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "bc40e0a51da3f0b6c1bc1f2d9e080ca9425d47377adf8516d68d3017e61c10d2",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "11. ADR 0024 Rename Proposed Status To Awaiting-Approval",
      "0024 Context"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-125"
}
```

## Entry decisions-126

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-second.json",
  "collection": "claims",
  "claimId": "claim_69ddf8650201dae7cbe8fe80373c6a7c",
  "before": {
    "claimId": "claim_69ddf8650201dae7cbe8fe80373c6a7c",
    "sourceUnitDigest": "1c78b8c81620de3d",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "0024-decision",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "Source H4 \"Quyết định\" of ADR 0024 is carried as the H3 \"0024 Decision\"; title differs (English, ADR-prefixed), heading-only unit. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "83a65ba5e8f913c18138dea769b80eefb0b28529ba97e89546e42575decf9366",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "11. ADR 0024 Rename Proposed Status To Awaiting-Approval"
    ]
  },
  "after": {
    "claimId": "claim_69ddf8650201dae7cbe8fe80373c6a7c",
    "sourceUnitDigest": "1c78b8c81620de3d",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "0024-decision",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Source H4 \"Quyết định\" of ADR 0024 is carried as the H3 \"0024 Decision\"; title differs (English, ADR-prefixed), heading-only unit. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading unit \"Quyết định\" becomes \"0024 Decision\", every line after the heading line is byte-equal (1025 chars), so only title and level differ as the rationale says; anchor and target digest unchanged from the reviewed binding, shard equals pack",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "83a65ba5e8f913c18138dea769b80eefb0b28529ba97e89546e42575decf9366",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "11. ADR 0024 Rename Proposed Status To Awaiting-Approval"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_69ddf8650201dae7cbe8fe80373c6a7c",
    "sourceUnitDigest": "1c78b8c81620de3d",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "0024-decision",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Source H4 \"Quyết định\" of ADR 0024 is carried as the H3 \"0024 Decision\"; title differs (English, ADR-prefixed), heading-only unit. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading unit \"Quyết định\" becomes \"0024 Decision\", every line after the heading line is byte-equal (1025 chars), so only title and level differ as the rationale says; anchor and target digest unchanged from the reviewed binding, shard equals pack",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "83a65ba5e8f913c18138dea769b80eefb0b28529ba97e89546e42575decf9366",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "11. ADR 0024 Rename Proposed Status To Awaiting-Approval"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-126"
}
```

## Entry decisions-127

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-second.json",
  "collection": "claims",
  "claimId": "claim_5fb4a29b7884b27f3d265612f67e4f31",
  "before": {
    "claimId": "claim_5fb4a29b7884b27f3d265612f67e4f31",
    "sourceUnitDigest": "f0688f3556688d27",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-61",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "ADR 0024 decision paragraph (rename proposed to awaiting-approval, FSM edges untouched) carried verbatim. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "f0688f3556688d27119ec8c0d5d0d39020787569f9c8191bc9d9a09d49cad8f6",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "11. ADR 0024 Rename Proposed Status To Awaiting-Approval",
      "0024 Decision"
    ]
  },
  "after": {
    "claimId": "claim_5fb4a29b7884b27f3d265612f67e4f31",
    "sourceUnitDigest": "f0688f3556688d27",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-61",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "ADR 0024 decision paragraph (rename proposed to awaiting-approval, FSM edges untouched) carried verbatim. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: 452 chars byte-equal between source and target by script, ancestry differs only by the translated heading (\"0024 Decision\"), anchor unheaded-block-61 ok, digest and shard to pack equal, binding unchanged from the reviewed state; text not read line by line",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "f0688f3556688d27119ec8c0d5d0d39020787569f9c8191bc9d9a09d49cad8f6",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "11. ADR 0024 Rename Proposed Status To Awaiting-Approval",
      "0024 Decision"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_5fb4a29b7884b27f3d265612f67e4f31",
    "sourceUnitDigest": "f0688f3556688d27",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-61",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "ADR 0024 decision paragraph (rename proposed to awaiting-approval, FSM edges untouched) carried verbatim. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: 452 chars byte-equal between source and target by script, ancestry differs only by the translated heading (\"0024 Decision\"), anchor unheaded-block-61 ok, digest and shard to pack equal, binding unchanged from the reviewed state; text not read line by line",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "f0688f3556688d27119ec8c0d5d0d39020787569f9c8191bc9d9a09d49cad8f6",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "11. ADR 0024 Rename Proposed Status To Awaiting-Approval",
      "0024 Decision"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-127"
}
```

## Entry decisions-128

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-second.json",
  "collection": "claims",
  "claimId": "claim_5eca88140b6e1a8d5c14095b6cb31045",
  "before": {
    "claimId": "claim_5eca88140b6e1a8d5c14095b6cb31045",
    "sourceUnitDigest": "e63e9faed67fe666",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-62",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "ADR 0024 migration paragraph (pre-release exemption, migration script, three stores in scope) carried verbatim. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "e63e9faed67fe666896d680ac13dbc95a8757bf4e5a4fb9a8ac949b89c9144f4",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "11. ADR 0024 Rename Proposed Status To Awaiting-Approval",
      "0024 Decision"
    ]
  },
  "after": {
    "claimId": "claim_5eca88140b6e1a8d5c14095b6cb31045",
    "sourceUnitDigest": "e63e9faed67fe666",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-62",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "ADR 0024 migration paragraph (pre-release exemption, migration script, three stores in scope) carried verbatim. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: 570 chars byte-equal between source and target by script, ancestry differs only by the translated heading (\"0024 Decision\"), anchor unheaded-block-62 ok, digest and shard to pack equal, binding unchanged from the reviewed state; text not read line by line",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "e63e9faed67fe666896d680ac13dbc95a8757bf4e5a4fb9a8ac949b89c9144f4",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "11. ADR 0024 Rename Proposed Status To Awaiting-Approval",
      "0024 Decision"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_5eca88140b6e1a8d5c14095b6cb31045",
    "sourceUnitDigest": "e63e9faed67fe666",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-62",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "ADR 0024 migration paragraph (pre-release exemption, migration script, three stores in scope) carried verbatim. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: 570 chars byte-equal between source and target by script, ancestry differs only by the translated heading (\"0024 Decision\"), anchor unheaded-block-62 ok, digest and shard to pack equal, binding unchanged from the reviewed state; text not read line by line",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "e63e9faed67fe666896d680ac13dbc95a8757bf4e5a4fb9a8ac949b89c9144f4",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "11. ADR 0024 Rename Proposed Status To Awaiting-Approval",
      "0024 Decision"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-128"
}
```

## Entry decisions-129

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-second.json",
  "collection": "claims",
  "claimId": "claim_b1c9fa89736c52b8bff6d5ec328cc553",
  "before": {
    "claimId": "claim_b1c9fa89736c52b8bff6d5ec328cc553",
    "sourceUnitDigest": "6b827c7b203c054c",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "0024-consequences",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "Source H4 \"Hệ quả\" of ADR 0024 is carried as H3 \"0024 Consequences\"; title differs, heading-only unit. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "1cf238e42a2f95624c1b9839bb786556437785c3f35db1788e9e566cc94bf563",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "11. ADR 0024 Rename Proposed Status To Awaiting-Approval"
    ]
  },
  "after": {
    "claimId": "claim_b1c9fa89736c52b8bff6d5ec328cc553",
    "sourceUnitDigest": "6b827c7b203c054c",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "0024-consequences",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Source H4 \"Hệ quả\" of ADR 0024 is carried as H3 \"0024 Consequences\"; title differs, heading-only unit. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading unit \"Hệ quả\" becomes \"0024 Consequences\", every line after the heading line is byte-equal (887 chars), so only title and level differ as the rationale says; anchor and target digest unchanged from the reviewed binding, shard equals pack",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "1cf238e42a2f95624c1b9839bb786556437785c3f35db1788e9e566cc94bf563",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "11. ADR 0024 Rename Proposed Status To Awaiting-Approval"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_b1c9fa89736c52b8bff6d5ec328cc553",
    "sourceUnitDigest": "6b827c7b203c054c",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "0024-consequences",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Source H4 \"Hệ quả\" of ADR 0024 is carried as H3 \"0024 Consequences\"; title differs, heading-only unit. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading unit \"Hệ quả\" becomes \"0024 Consequences\", every line after the heading line is byte-equal (887 chars), so only title and level differ as the rationale says; anchor and target digest unchanged from the reviewed binding, shard equals pack",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "1cf238e42a2f95624c1b9839bb786556437785c3f35db1788e9e566cc94bf563",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "11. ADR 0024 Rename Proposed Status To Awaiting-Approval"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-129"
}
```

## Entry decisions-130

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-second.json",
  "collection": "claims",
  "claimId": "claim_ec3bfee565512c6d032778295c5838c1",
  "before": {
    "claimId": "claim_ec3bfee565512c6d032778295c5838c1",
    "sourceUnitDigest": "1d55a3e34d5b0515",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-63",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "ADR 0024 consequences list (consumers switch with migration, duplicate-seq finding, 0006 only partly superseded) carried verbatim. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "1d55a3e34d5b0515071b018c1d53482d9bf5a55a0c89eceb1dd80d27d32f1ee5",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "11. ADR 0024 Rename Proposed Status To Awaiting-Approval",
      "0024 Consequences"
    ]
  },
  "after": {
    "claimId": "claim_ec3bfee565512c6d032778295c5838c1",
    "sourceUnitDigest": "1d55a3e34d5b0515",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-63",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "ADR 0024 consequences list (consumers switch with migration, duplicate-seq finding, 0006 only partly superseded) carried verbatim. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: 818 chars byte-equal between source and target by script, ancestry differs only by the translated heading (\"0024 Consequences\"), anchor unheaded-block-63 ok, digest and shard to pack equal, binding unchanged from the reviewed state; text not read line by line",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "1d55a3e34d5b0515071b018c1d53482d9bf5a55a0c89eceb1dd80d27d32f1ee5",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "11. ADR 0024 Rename Proposed Status To Awaiting-Approval",
      "0024 Consequences"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_ec3bfee565512c6d032778295c5838c1",
    "sourceUnitDigest": "1d55a3e34d5b0515",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-63",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "ADR 0024 consequences list (consumers switch with migration, duplicate-seq finding, 0006 only partly superseded) carried verbatim. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: 818 chars byte-equal between source and target by script, ancestry differs only by the translated heading (\"0024 Consequences\"), anchor unheaded-block-63 ok, digest and shard to pack equal, binding unchanged from the reviewed state; text not read line by line",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "1d55a3e34d5b0515071b018c1d53482d9bf5a55a0c89eceb1dd80d27d32f1ee5",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "11. ADR 0024 Rename Proposed Status To Awaiting-Approval",
      "0024 Consequences"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-130"
}
```

## Entry decisions-131

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-second.json",
  "collection": "claims",
  "claimId": "claim_82f766f5320ab6bbe5174aeda52e710b",
  "before": {
    "claimId": "claim_82f766f5320ab6bbe5174aeda52e710b",
    "sourceUnitDigest": "95a357e29712c3c0",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-64",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "Closing sentence of ADR 0024 (changing it means a new superseding record); the sentence recurs under other ADRs so the owner is block 64 after 0024 Consequences (found by position, not by first-line match). Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "11. ADR 0024 Rename Proposed Status To Awaiting-Approval",
      "0024 Consequences"
    ]
  },
  "after": {
    "claimId": "claim_82f766f5320ab6bbe5174aeda52e710b",
    "sourceUnitDigest": "95a357e29712c3c0",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-64",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Closing sentence of ADR 0024 (changing it means a new superseding record); the sentence recurs under other ADRs so the owner is block 64 after 0024 Consequences (found by position, not by first-line match). Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: 66 chars byte-equal between source and target by script, ancestry differs only by the translated heading (\"0024 Consequences\"), anchor unheaded-block-64 ok, digest and shard to pack equal, binding unchanged from the reviewed state; text not read line by line",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "11. ADR 0024 Rename Proposed Status To Awaiting-Approval",
      "0024 Consequences"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_82f766f5320ab6bbe5174aeda52e710b",
    "sourceUnitDigest": "95a357e29712c3c0",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-64",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Closing sentence of ADR 0024 (changing it means a new superseding record); the sentence recurs under other ADRs so the owner is block 64 after 0024 Consequences (found by position, not by first-line match). Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: 66 chars byte-equal between source and target by script, ancestry differs only by the translated heading (\"0024 Consequences\"), anchor unheaded-block-64 ok, digest and shard to pack equal, binding unchanged from the reviewed state; text not read line by line",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "11. ADR 0024 Rename Proposed Status To Awaiting-Approval",
      "0024 Consequences"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-131"
}
```

## Entry decisions-132

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-second.json",
  "collection": "claims",
  "claimId": "claim_aa3cf298aaa31c6dc9b4c8382434bc9c",
  "before": {
    "claimId": "claim_aa3cf298aaa31c6dc9b4c8382434bc9c",
    "sourceUnitDigest": "8a864bfaf25cf078",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "12-adr-0027-domain-owns-the-pre-delivered-status-vocabulary",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "Source H3 for ADR 0027 is carried as H2 \"12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary\"; title shortened/translated and level changed. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "6ac1fb5912f4bccdf38301b753d5c1c7d7e4bfc5a152c9f00b156abaaafe7a79",
    "targetAncestry": [
      "Retired Decision History: Work State"
    ]
  },
  "after": {
    "claimId": "claim_aa3cf298aaa31c6dc9b4c8382434bc9c",
    "sourceUnitDigest": "8a864bfaf25cf078",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "12-adr-0027-domain-owns-the-pre-delivered-status-vocabulary",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Source H3 for ADR 0027 is carried as H2 \"12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary\"; title shortened/translated and level changed. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading unit \"0027 — Domain sở hữu vocabulary/transition sta\" becomes \"12. ADR 0027 Domain Owns The Pre-Delivered Status Vo\", the heading has no body text in either file, so only title and level differ as the rationale says; anchor and target digest unchanged from the reviewed binding, shard equals pack",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "6ac1fb5912f4bccdf38301b753d5c1c7d7e4bfc5a152c9f00b156abaaafe7a79",
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
    "claimId": "claim_aa3cf298aaa31c6dc9b4c8382434bc9c",
    "sourceUnitDigest": "8a864bfaf25cf078",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "12-adr-0027-domain-owns-the-pre-delivered-status-vocabulary",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Source H3 for ADR 0027 is carried as H2 \"12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary\"; title shortened/translated and level changed. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading unit \"0027 — Domain sở hữu vocabulary/transition sta\" becomes \"12. ADR 0027 Domain Owns The Pre-Delivered Status Vo\", the heading has no body text in either file, so only title and level differ as the rationale says; anchor and target digest unchanged from the reviewed binding, shard equals pack",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "6ac1fb5912f4bccdf38301b753d5c1c7d7e4bfc5a152c9f00b156abaaafe7a79",
    "targetAncestry": [
      "Retired Decision History: Work State"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-132"
}
```

## Entry decisions-133

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-second.json",
  "collection": "claims",
  "claimId": "claim_818a58278988ed797931b14ca91614e2",
  "before": {
    "claimId": "claim_818a58278988ed797931b14ca91614e2",
    "sourceUnitDigest": "a06a29884a79a4eb",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "0027-context",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "Source H4 \"Bối cảnh\" of ADR 0027 is carried as H3 \"0027 Context\"; title differs, heading-only unit. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "452a2ba22e0a3ab3caa9b41add3ce44e9f750f2242c676baf1a0e24e4631a027",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary"
    ]
  },
  "after": {
    "claimId": "claim_818a58278988ed797931b14ca91614e2",
    "sourceUnitDigest": "a06a29884a79a4eb",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "0027-context",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Source H4 \"Bối cảnh\" of ADR 0027 is carried as H3 \"0027 Context\"; title differs, heading-only unit. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading unit \"Bối cảnh\" becomes \"0027 Context\", every line after the heading line is byte-equal (3212 chars), so only title and level differ as the rationale says; anchor and target digest unchanged from the reviewed binding, shard equals pack",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "452a2ba22e0a3ab3caa9b41add3ce44e9f750f2242c676baf1a0e24e4631a027",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_818a58278988ed797931b14ca91614e2",
    "sourceUnitDigest": "a06a29884a79a4eb",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "0027-context",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Source H4 \"Bối cảnh\" of ADR 0027 is carried as H3 \"0027 Context\"; title differs, heading-only unit. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading unit \"Bối cảnh\" becomes \"0027 Context\", every line after the heading line is byte-equal (3212 chars), so only title and level differ as the rationale says; anchor and target digest unchanged from the reviewed binding, shard equals pack",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "452a2ba22e0a3ab3caa9b41add3ce44e9f750f2242c676baf1a0e24e4631a027",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-133"
}
```

## Entry decisions-134

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-second.json",
  "collection": "claims",
  "claimId": "claim_2d89ae63cbc81e492eb80e9a28174b67",
  "before": {
    "claimId": "claim_2d89ae63cbc81e492eb80e9a28174b67",
    "sourceUnitDigest": "f4a426a2b8673dfb",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-65",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "ADR 0027 context opening: base-workflow-model does not exist as a file and what was lost; carried verbatim. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "f4a426a2b8673dfb37672014bca4267277fc6da03ffcd9103a7962736b64c4a4",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Context"
    ]
  },
  "after": {
    "claimId": "claim_2d89ae63cbc81e492eb80e9a28174b67",
    "sourceUnitDigest": "f4a426a2b8673dfb",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-65",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "ADR 0027 context opening: base-workflow-model does not exist as a file and what was lost; carried verbatim. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: 714 chars byte-equal between source and target by script, ancestry differs only by the translated heading (\"0027 Context\"), anchor unheaded-block-65 ok, digest and shard to pack equal, binding unchanged from the reviewed state; text not read line by line",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "f4a426a2b8673dfb37672014bca4267277fc6da03ffcd9103a7962736b64c4a4",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Context"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_2d89ae63cbc81e492eb80e9a28174b67",
    "sourceUnitDigest": "f4a426a2b8673dfb",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-65",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "ADR 0027 context opening: base-workflow-model does not exist as a file and what was lost; carried verbatim. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: 714 chars byte-equal between source and target by script, ancestry differs only by the translated heading (\"0027 Context\"), anchor unheaded-block-65 ok, digest and shard to pack equal, binding unchanged from the reviewed state; text not read line by line",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "f4a426a2b8673dfb37672014bca4267277fc6da03ffcd9103a7962736b64c4a4",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Context"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-134"
}
```

## Entry decisions-135

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-second.json",
  "collection": "claims",
  "claimId": "claim_a92d8b1ad203c61b04078fa8b94c9b17",
  "before": {
    "claimId": "claim_a92d8b1ad203c61b04078fa8b94c9b17",
    "sourceUnitDigest": "9e779d390baf10f4",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-66",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "Quoted original rule (RUL35 text from work-state.md) inside ADR 0027 context; carried verbatim as historical text within a decision. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "9e779d390baf10f4993b0973177117e4316f471f04f463cffc54dd6affbc0197",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Context"
    ]
  },
  "after": {
    "claimId": "claim_a92d8b1ad203c61b04078fa8b94c9b17",
    "sourceUnitDigest": "9e779d390baf10f4",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-66",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Quoted original rule (RUL35 text from work-state.md) inside ADR 0027 context; carried verbatim as historical text within a decision. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: read source and target, 1144 chars byte-equal, source sits under \"Bối cảnh\" and target under \"0027 Context\" (translated heading, which is why the exact class is only weak); rationale describes this unit correctly and now says content unchanged; anchor unheaded-block-66 ok, binding unchanged",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "9e779d390baf10f4993b0973177117e4316f471f04f463cffc54dd6affbc0197",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Context"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_a92d8b1ad203c61b04078fa8b94c9b17",
    "sourceUnitDigest": "9e779d390baf10f4",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-66",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Quoted original rule (RUL35 text from work-state.md) inside ADR 0027 context; carried verbatim as historical text within a decision. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: read source and target, 1144 chars byte-equal, source sits under \"Bối cảnh\" and target under \"0027 Context\" (translated heading, which is why the exact class is only weak); rationale describes this unit correctly and now says content unchanged; anchor unheaded-block-66 ok, binding unchanged",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "9e779d390baf10f4993b0973177117e4316f471f04f463cffc54dd6affbc0197",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Context"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-135"
}
```

## Entry decisions-136

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-second.json",
  "collection": "claims",
  "claimId": "claim_a3944b679053b61dc2d743795cde3d77",
  "before": {
    "claimId": "claim_a3944b679053b61dc2d743795cde3d77",
    "sourceUnitDigest": "5e566c132da3b486",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-67",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "ADR 0027 reasons why the original rule was revised (multi-domain schema need); carried verbatim. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "5e566c132da3b486f17ad15991b3409a28229ac2f48472d4e61c13ab0b31b41a",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Context"
    ]
  },
  "after": {
    "claimId": "claim_a3944b679053b61dc2d743795cde3d77",
    "sourceUnitDigest": "5e566c132da3b486",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-67",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "ADR 0027 reasons why the original rule was revised (multi-domain schema need); carried verbatim. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: 1349 chars byte-equal between source and target by script, ancestry differs only by the translated heading (\"0027 Context\"), anchor unheaded-block-67 ok, digest and shard to pack equal, binding unchanged from the reviewed state; text not read line by line",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "5e566c132da3b486f17ad15991b3409a28229ac2f48472d4e61c13ab0b31b41a",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Context"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_a3944b679053b61dc2d743795cde3d77",
    "sourceUnitDigest": "5e566c132da3b486",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-67",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "ADR 0027 reasons why the original rule was revised (multi-domain schema need); carried verbatim. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: 1349 chars byte-equal between source and target by script, ancestry differs only by the translated heading (\"0027 Context\"), anchor unheaded-block-67 ok, digest and shard to pack equal, binding unchanged from the reviewed state; text not read line by line",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "5e566c132da3b486f17ad15991b3409a28229ac2f48472d4e61c13ab0b31b41a",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Context"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-136"
}
```

## Entry decisions-137

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-second.json",
  "collection": "claims",
  "claimId": "claim_466331635349f55e32c11e0fcf56d334",
  "before": {
    "claimId": "claim_466331635349f55e32c11e0fcf56d334",
    "sourceUnitDigest": "d76f5cf17475a3fb",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "0027-decision",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "Source H4 \"Quyết định\" of ADR 0027 is carried as H3 \"0027 Decision\"; title differs, heading-only unit. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "3969babe82040ce7d1d34672b372c59d3fd1d3721811bdcbfc19c2f0b0960afc",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary"
    ]
  },
  "after": {
    "claimId": "claim_466331635349f55e32c11e0fcf56d334",
    "sourceUnitDigest": "d76f5cf17475a3fb",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "0027-decision",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Source H4 \"Quyết định\" of ADR 0027 is carried as H3 \"0027 Decision\"; title differs, heading-only unit. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading unit \"Quyết định\" becomes \"0027 Decision\", every line after the heading line is byte-equal (3148 chars), so only title and level differ as the rationale says; anchor and target digest unchanged from the reviewed binding, shard equals pack",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "3969babe82040ce7d1d34672b372c59d3fd1d3721811bdcbfc19c2f0b0960afc",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_466331635349f55e32c11e0fcf56d334",
    "sourceUnitDigest": "d76f5cf17475a3fb",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "0027-decision",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Source H4 \"Quyết định\" of ADR 0027 is carried as H3 \"0027 Decision\"; title differs, heading-only unit. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading unit \"Quyết định\" becomes \"0027 Decision\", every line after the heading line is byte-equal (3148 chars), so only title and level differ as the rationale says; anchor and target digest unchanged from the reviewed binding, shard equals pack",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "3969babe82040ce7d1d34672b372c59d3fd1d3721811bdcbfc19c2f0b0960afc",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-137"
}
```

## Entry decisions-138

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-second.json",
  "collection": "claims",
  "claimId": "claim_3f65fc24d3eeb760ecc11ff781159152",
  "before": {
    "claimId": "claim_3f65fc24d3eeb760ecc11ff781159152",
    "sourceUnitDigest": "1c7ea2fda926300b",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-68",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "ADR 0027 statement of the exact supersede scope (only the first segment); carried verbatim. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "1c7ea2fda926300b7351bee9c39ec9314d0d7f3d053ba408667ef2c0d8f4ac0c",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Decision"
    ]
  },
  "after": {
    "claimId": "claim_3f65fc24d3eeb760ecc11ff781159152",
    "sourceUnitDigest": "1c7ea2fda926300b",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-68",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "ADR 0027 statement of the exact supersede scope (only the first segment); carried verbatim. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: 228 chars byte-equal between source and target by script, ancestry differs only by the translated heading (\"0027 Decision\"), anchor unheaded-block-68 ok, digest and shard to pack equal, binding unchanged from the reviewed state; text not read line by line",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "1c7ea2fda926300b7351bee9c39ec9314d0d7f3d053ba408667ef2c0d8f4ac0c",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Decision"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_3f65fc24d3eeb760ecc11ff781159152",
    "sourceUnitDigest": "1c7ea2fda926300b",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-68",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "ADR 0027 statement of the exact supersede scope (only the first segment); carried verbatim. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: 228 chars byte-equal between source and target by script, ancestry differs only by the translated heading (\"0027 Decision\"), anchor unheaded-block-68 ok, digest and shard to pack equal, binding unchanged from the reviewed state; text not read line by line",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "1c7ea2fda926300b7351bee9c39ec9314d0d7f3d053ba408667ef2c0d8f4ac0c",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Decision"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-138"
}
```

## Entry decisions-139

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-second.json",
  "collection": "claims",
  "claimId": "claim_a4a77d7c336663f81a9bc8ac697ab518",
  "before": {
    "claimId": "claim_a4a77d7c336663f81a9bc8ac697ab518",
    "sourceUnitDigest": "46ec1457959a8895",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-69",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "ADR 0027 list of the six pre-delivered statuses and the tail group; carried verbatim. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "46ec1457959a8895465a7d7320215bb4940457e34d39eaeb5ab18a8b637aae01",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Decision"
    ]
  },
  "after": {
    "claimId": "claim_a4a77d7c336663f81a9bc8ac697ab518",
    "sourceUnitDigest": "46ec1457959a8895",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-69",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "ADR 0027 list of the six pre-delivered statuses and the tail group; carried verbatim. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: 1193 chars byte-equal between source and target by script, ancestry differs only by the translated heading (\"0027 Decision\"), anchor unheaded-block-69 ok, digest and shard to pack equal, binding unchanged from the reviewed state; text not read line by line",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "46ec1457959a8895465a7d7320215bb4940457e34d39eaeb5ab18a8b637aae01",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Decision"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_a4a77d7c336663f81a9bc8ac697ab518",
    "sourceUnitDigest": "46ec1457959a8895",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-69",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "ADR 0027 list of the six pre-delivered statuses and the tail group; carried verbatim. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: 1193 chars byte-equal between source and target by script, ancestry differs only by the translated heading (\"0027 Decision\"), anchor unheaded-block-69 ok, digest and shard to pack equal, binding unchanged from the reviewed state; text not read line by line",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "46ec1457959a8895465a7d7320215bb4940457e34d39eaeb5ab18a8b637aae01",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Decision"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-139"
}
```

## Entry decisions-140

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-second.json",
  "collection": "claims",
  "claimId": "claim_a4ed529f5ed4745e1c6bbbb06eb3a4b2",
  "before": {
    "claimId": "claim_a4ed529f5ed4745e1c6bbbb06eb3a4b2",
    "sourceUnitDigest": "127c7c7a99d0a8fc",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-70",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "ADR 0027 sentence introducing the statusCategory mapping table; carried verbatim. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "127c7c7a99d0a8fcab543606c597226d64df9b202cda0911d7cbaa815a363cf4",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Decision"
    ]
  },
  "after": {
    "claimId": "claim_a4ed529f5ed4745e1c6bbbb06eb3a4b2",
    "sourceUnitDigest": "127c7c7a99d0a8fc",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-70",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "ADR 0027 sentence introducing the statusCategory mapping table; carried verbatim. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: read source and target, 185 chars byte-equal, source sits under \"Quyết định\" and target under \"0027 Decision\" (translated heading, which is why the exact class is only weak); rationale describes this unit correctly and now says content unchanged; anchor unheaded-block-70 ok, binding unchanged",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "127c7c7a99d0a8fcab543606c597226d64df9b202cda0911d7cbaa815a363cf4",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Decision"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_a4ed529f5ed4745e1c6bbbb06eb3a4b2",
    "sourceUnitDigest": "127c7c7a99d0a8fc",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-70",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "ADR 0027 sentence introducing the statusCategory mapping table; carried verbatim. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: read source and target, 185 chars byte-equal, source sits under \"Quyết định\" and target under \"0027 Decision\" (translated heading, which is why the exact class is only weak); rationale describes this unit correctly and now says content unchanged; anchor unheaded-block-70 ok, binding unchanged",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "127c7c7a99d0a8fcab543606c597226d64df9b202cda0911d7cbaa815a363cf4",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Decision"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-140"
}
```

## Entry decisions-141

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-second.json",
  "collection": "claims",
  "claimId": "claim_f3d9c6dbb704d09c37ab5cfd4f65927e",
  "before": {
    "claimId": "claim_f3d9c6dbb704d09c37ab5cfd4f65927e",
    "sourceUnitDigest": "7b133e87cfdf8159",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-71",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "ADR 0027 status-to-statusCategory mapping table; carried verbatim (table markup intact). Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "7b133e87cfdf8159a9ddd402d8ce2f59f1a286b8bac218807963a8a8bbbf3483",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Decision"
    ]
  },
  "after": {
    "claimId": "claim_f3d9c6dbb704d09c37ab5cfd4f65927e",
    "sourceUnitDigest": "7b133e87cfdf8159",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-71",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "ADR 0027 status-to-statusCategory mapping table; carried verbatim (table markup intact). Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: 225 chars byte-equal between source and target by script, ancestry differs only by the translated heading (\"0027 Decision\"), anchor unheaded-block-71 ok, digest and shard to pack equal, binding unchanged from the reviewed state; text not read line by line",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "7b133e87cfdf8159a9ddd402d8ce2f59f1a286b8bac218807963a8a8bbbf3483",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Decision"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_f3d9c6dbb704d09c37ab5cfd4f65927e",
    "sourceUnitDigest": "7b133e87cfdf8159",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-71",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "ADR 0027 status-to-statusCategory mapping table; carried verbatim (table markup intact). Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: 225 chars byte-equal between source and target by script, ancestry differs only by the translated heading (\"0027 Decision\"), anchor unheaded-block-71 ok, digest and shard to pack equal, binding unchanged from the reviewed state; text not read line by line",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "7b133e87cfdf8159a9ddd402d8ce2f59f1a286b8bac218807963a8a8bbbf3483",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Decision"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-141"
}
```

## Entry decisions-142

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-second.json",
  "collection": "claims",
  "claimId": "claim_6c5753df306960b46d20e133a2a36894",
  "before": {
    "claimId": "claim_6c5753df306960b46d20e133a2a36894",
    "sourceUnitDigest": "6d99060fca9f1fb5",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-72",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "ADR 0027 paragraph on statusCategory being a proven lossy compression; carried verbatim. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "6d99060fca9f1fb5602ee7d2ec14775af7aa01b666e2f16ed715219741b651c5",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Decision"
    ]
  },
  "after": {
    "claimId": "claim_6c5753df306960b46d20e133a2a36894",
    "sourceUnitDigest": "6d99060fca9f1fb5",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-72",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "ADR 0027 paragraph on statusCategory being a proven lossy compression; carried verbatim. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: 620 chars byte-equal between source and target by script, ancestry differs only by the translated heading (\"0027 Decision\"), anchor unheaded-block-72 ok, digest and shard to pack equal, binding unchanged from the reviewed state; text not read line by line",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "6d99060fca9f1fb5602ee7d2ec14775af7aa01b666e2f16ed715219741b651c5",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Decision"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_6c5753df306960b46d20e133a2a36894",
    "sourceUnitDigest": "6d99060fca9f1fb5",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-72",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "ADR 0027 paragraph on statusCategory being a proven lossy compression; carried verbatim. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: 620 chars byte-equal between source and target by script, ancestry differs only by the translated heading (\"0027 Decision\"), anchor unheaded-block-72 ok, digest and shard to pack equal, binding unchanged from the reviewed state; text not read line by line",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "6d99060fca9f1fb5602ee7d2ec14775af7aa01b666e2f16ed715219741b651c5",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Decision"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-142"
}
```

## Entry decisions-143

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-second.json",
  "collection": "claims",
  "claimId": "claim_1d98a4a5c3391d5318f53153b3f5f442",
  "before": {
    "claimId": "claim_1d98a4a5c3391d5318f53153b3f5f442",
    "sourceUnitDigest": "7c211b5505c4924d",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-73",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "ADR 0027 paragraph that the four tail statuses need no statusCategory; carried verbatim. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "7c211b5505c4924dd9c23a68d64ab36658204db5c7e536e15eceea988ef445f7",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Decision"
    ]
  },
  "after": {
    "claimId": "claim_1d98a4a5c3391d5318f53153b3f5f442",
    "sourceUnitDigest": "7c211b5505c4924d",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-73",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "ADR 0027 paragraph that the four tail statuses need no statusCategory; carried verbatim. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: 169 chars byte-equal between source and target by script, ancestry differs only by the translated heading (\"0027 Decision\"), anchor unheaded-block-73 ok, digest and shard to pack equal, binding unchanged from the reviewed state; text not read line by line",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "7c211b5505c4924dd9c23a68d64ab36658204db5c7e536e15eceea988ef445f7",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Decision"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_1d98a4a5c3391d5318f53153b3f5f442",
    "sourceUnitDigest": "7c211b5505c4924d",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-73",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "ADR 0027 paragraph that the four tail statuses need no statusCategory; carried verbatim. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: 169 chars byte-equal between source and target by script, ancestry differs only by the translated heading (\"0027 Decision\"), anchor unheaded-block-73 ok, digest and shard to pack equal, binding unchanged from the reviewed state; text not read line by line",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "7c211b5505c4924dd9c23a68d64ab36658204db5c7e536e15eceea988ef445f7",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Decision"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-143"
}
```

## Entry decisions-144

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-second.json",
  "collection": "claims",
  "claimId": "claim_546450931dd47024138ce0a32699cd72",
  "before": {
    "claimId": "claim_546450931dd47024138ce0a32699cd72",
    "sourceUnitDigest": "31a4c4ddccf1d5d5",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-74",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "ADR 0027 out-of-scope list of the supersede; carried verbatim. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "31a4c4ddccf1d5d56990ceba0e49bc09638561de5ffb5300c3fd73cab4f933fe",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Decision"
    ]
  },
  "after": {
    "claimId": "claim_546450931dd47024138ce0a32699cd72",
    "sourceUnitDigest": "31a4c4ddccf1d5d5",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-74",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "ADR 0027 out-of-scope list of the supersede; carried verbatim. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: 515 chars byte-equal between source and target by script, ancestry differs only by the translated heading (\"0027 Decision\"), anchor unheaded-block-74 ok, digest and shard to pack equal, binding unchanged from the reviewed state; text not read line by line",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "31a4c4ddccf1d5d56990ceba0e49bc09638561de5ffb5300c3fd73cab4f933fe",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Decision"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_546450931dd47024138ce0a32699cd72",
    "sourceUnitDigest": "31a4c4ddccf1d5d5",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-74",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "ADR 0027 out-of-scope list of the supersede; carried verbatim. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: 515 chars byte-equal between source and target by script, ancestry differs only by the translated heading (\"0027 Decision\"), anchor unheaded-block-74 ok, digest and shard to pack equal, binding unchanged from the reviewed state; text not read line by line",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "31a4c4ddccf1d5d56990ceba0e49bc09638561de5ffb5300c3fd73cab4f933fe",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Decision"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-144"
}
```

## Entry decisions-145

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-second.json",
  "collection": "claims",
  "claimId": "claim_0da8b597cb243173df9f5eb46a34ec76",
  "before": {
    "claimId": "claim_0da8b597cb243173df9f5eb46a34ec76",
    "sourceUnitDigest": "7dae6b0f1c8a4ba4",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "0027-consumer-audit",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "Source H4 \"Audit: mọi consumer thật ...\" is carried as H3 \"0027 Consumer Audit\"; title shortened and translated. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "e8596bf17b33258ee768e967da03d9efeddd19149ecdbccf1510cc7bdf3ec674",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary"
    ]
  },
  "after": {
    "claimId": "claim_0da8b597cb243173df9f5eb46a34ec76",
    "sourceUnitDigest": "7dae6b0f1c8a4ba4",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "0027-consumer-audit",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Source H4 \"Audit: mọi consumer thật ...\" is carried as H3 \"0027 Consumer Audit\"; title shortened and translated. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading unit \"Audit: mọi consumer thật của `status-fsm.mjs`/\" becomes \"0027 Consumer Audit\", every line after the heading line is byte-equal (733 chars), so only title and level differ as the rationale says; anchor and target digest unchanged from the reviewed binding, shard equals pack",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "e8596bf17b33258ee768e967da03d9efeddd19149ecdbccf1510cc7bdf3ec674",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_0da8b597cb243173df9f5eb46a34ec76",
    "sourceUnitDigest": "7dae6b0f1c8a4ba4",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "0027-consumer-audit",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Source H4 \"Audit: mọi consumer thật ...\" is carried as H3 \"0027 Consumer Audit\"; title shortened and translated. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading unit \"Audit: mọi consumer thật của `status-fsm.mjs`/\" becomes \"0027 Consumer Audit\", every line after the heading line is byte-equal (733 chars), so only title and level differ as the rationale says; anchor and target digest unchanged from the reviewed binding, shard equals pack",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "e8596bf17b33258ee768e967da03d9efeddd19149ecdbccf1510cc7bdf3ec674",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-145"
}
```

## Entry decisions-146

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-second.json",
  "collection": "claims",
  "claimId": "claim_0cabbd5a6b95edeb9aab6832ad276c50",
  "before": {
    "claimId": "claim_0cabbd5a6b95edeb9aab6832ad276c50",
    "sourceUnitDigest": "c2f2baeae1bc366d",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-75",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "ADR 0027 audit method paragraph (rg scan of STATUSES/TRANSITIONS) carried verbatim. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "c2f2baeae1bc366d51a16dbf1b083a2add5cacd51c1bf7c3ea6d3f91c5190d11",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Consumer Audit"
    ]
  },
  "after": {
    "claimId": "claim_0cabbd5a6b95edeb9aab6832ad276c50",
    "sourceUnitDigest": "c2f2baeae1bc366d",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-75",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "ADR 0027 audit method paragraph (rg scan of STATUSES/TRANSITIONS) carried verbatim. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: read source and target, 732 chars byte-equal, source sits under \"Audit: mọi consumer thật của `stat\" and target under \"0027 Consumer Audit\" (translated heading, which is why the exact class is only weak); rationale describes this unit correctly and now says content unchanged; anchor unheaded-block-75 ok, binding unchanged",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "c2f2baeae1bc366d51a16dbf1b083a2add5cacd51c1bf7c3ea6d3f91c5190d11",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Consumer Audit"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_0cabbd5a6b95edeb9aab6832ad276c50",
    "sourceUnitDigest": "c2f2baeae1bc366d",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-75",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "ADR 0027 audit method paragraph (rg scan of STATUSES/TRANSITIONS) carried verbatim. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: read source and target, 732 chars byte-equal, source sits under \"Audit: mọi consumer thật của `stat\" and target under \"0027 Consumer Audit\" (translated heading, which is why the exact class is only weak); rationale describes this unit correctly and now says content unchanged; anchor unheaded-block-75 ok, binding unchanged",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "c2f2baeae1bc366d51a16dbf1b083a2add5cacd51c1bf7c3ea6d3f91c5190d11",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Consumer Audit"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-146"
}
```

## Entry decisions-147

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-second.json",
  "collection": "claims",
  "claimId": "claim_7889671f1f2783b634ef6d90a251f3e9",
  "before": {
    "claimId": "claim_7889671f1f2783b634ef6d90a251f3e9",
    "sourceUnitDigest": "cfb28f2fabec3889",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "0027-audit-1-status-source-of-truth",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "Source H5 \"1. Nguồn sự thật\" is carried as H4 \"0027 Audit 1 Status Source Of Truth\"; title and level changed. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "50248a7774c2a4f3faf5bf48e42047130dd788a8ab92dc278a4c66bf17a2654a",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Consumer Audit"
    ]
  },
  "after": {
    "claimId": "claim_7889671f1f2783b634ef6d90a251f3e9",
    "sourceUnitDigest": "cfb28f2fabec3889",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "0027-audit-1-status-source-of-truth",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Source H5 \"1. Nguồn sự thật\" is carried as H4 \"0027 Audit 1 Status Source Of Truth\"; title and level changed. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading unit \"1. Nguồn sự thật (định nghĩa STATUSES/TRANSITI\" becomes \"0027 Audit 1 Status Source Of Truth\", every line after the heading line is byte-equal (1116 chars), so only title and level differ as the rationale says; anchor and target digest unchanged from the reviewed binding, shard equals pack",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "50248a7774c2a4f3faf5bf48e42047130dd788a8ab92dc278a4c66bf17a2654a",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Consumer Audit"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_7889671f1f2783b634ef6d90a251f3e9",
    "sourceUnitDigest": "cfb28f2fabec3889",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "0027-audit-1-status-source-of-truth",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Source H5 \"1. Nguồn sự thật\" is carried as H4 \"0027 Audit 1 Status Source Of Truth\"; title and level changed. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading unit \"1. Nguồn sự thật (định nghĩa STATUSES/TRANSITI\" becomes \"0027 Audit 1 Status Source Of Truth\", every line after the heading line is byte-equal (1116 chars), so only title and level differ as the rationale says; anchor and target digest unchanged from the reviewed binding, shard equals pack",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "50248a7774c2a4f3faf5bf48e42047130dd788a8ab92dc278a4c66bf17a2654a",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Consumer Audit"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-147"
}
```

## Entry decisions-148

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-second.json",
  "collection": "claims",
  "claimId": "claim_fc0f124b5b1368034455207d6378bc00",
  "before": {
    "claimId": "claim_fc0f124b5b1368034455207d6378bc00",
    "sourceUnitDigest": "bdee4fb8f864c64b",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-76",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "Audit 1 table (status source-of-truth file:line, role, changed?) carried verbatim into block 76 under Audit 1; the shared first-line suggestion was checked against the Audit 1 position. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "bdee4fb8f864c64bb1ccdda044960818cc6bfae1e87d8ac8da077bbb8fb4a757",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Consumer Audit",
      "0027 Audit 1 Status Source Of Truth"
    ]
  },
  "after": {
    "claimId": "claim_fc0f124b5b1368034455207d6378bc00",
    "sourceUnitDigest": "bdee4fb8f864c64b",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-76",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Audit 1 table (status source-of-truth file:line, role, changed?) carried verbatim into block 76 under Audit 1; the shared first-line suggestion was checked against the Audit 1 position. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: read source and target, 1115 chars byte-equal, source sits under \"1. Nguồn sự thật (định nghĩa STATU\" and target under \"0027 Audit 1 Status Source Of Trut\" (translated heading, which is why the exact class is only weak); rationale describes this unit correctly and now says content unchanged; anchor unheaded-block-76 ok, binding unchanged",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "bdee4fb8f864c64bb1ccdda044960818cc6bfae1e87d8ac8da077bbb8fb4a757",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Consumer Audit",
      "0027 Audit 1 Status Source Of Truth"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_fc0f124b5b1368034455207d6378bc00",
    "sourceUnitDigest": "bdee4fb8f864c64b",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-76",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Audit 1 table (status source-of-truth file:line, role, changed?) carried verbatim into block 76 under Audit 1; the shared first-line suggestion was checked against the Audit 1 position. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: read source and target, 1115 chars byte-equal, source sits under \"1. Nguồn sự thật (định nghĩa STATU\" and target under \"0027 Audit 1 Status Source Of Trut\" (translated heading, which is why the exact class is only weak); rationale describes this unit correctly and now says content unchanged; anchor unheaded-block-76 ok, binding unchanged",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "bdee4fb8f864c64bb1ccdda044960818cc6bfae1e87d8ac8da077bbb8fb4a757",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Consumer Audit",
      "0027 Audit 1 Status Source Of Truth"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-148"
}
```

## Entry decisions-149

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-second.json",
  "collection": "claims",
  "claimId": "claim_c0adce3f717a031d4159eee6dd0aaaa1",
  "before": {
    "claimId": "claim_c0adce3f717a031d4159eee6dd0aaaa1",
    "sourceUnitDigest": "517a80cc0c3f64d3",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "0027-audit-2-resolved-statuses-set",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "Source H5 \"2. RESOLVED_STATUSES\" is carried as H4 \"0027 Audit 2 Resolved Statuses Set\"; title and level changed. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "a4b78ba726bd39959cca89e81fa9d1bd269cf16807d014204b9427573cde9dea",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Consumer Audit"
    ]
  },
  "after": {
    "claimId": "claim_c0adce3f717a031d4159eee6dd0aaaa1",
    "sourceUnitDigest": "517a80cc0c3f64d3",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "0027-audit-2-resolved-statuses-set",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Source H5 \"2. RESOLVED_STATUSES\" is carried as H4 \"0027 Audit 2 Resolved Statuses Set\"; title and level changed. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading unit \"2. `RESOLVED_STATUSES` (tập \"giống category\" v\" becomes \"0027 Audit 2 Resolved Statuses Set\", every line after the heading line is byte-equal (2412 chars), so only title and level differ as the rationale says; anchor and target digest unchanged from the reviewed binding, shard equals pack",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "a4b78ba726bd39959cca89e81fa9d1bd269cf16807d014204b9427573cde9dea",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Consumer Audit"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_c0adce3f717a031d4159eee6dd0aaaa1",
    "sourceUnitDigest": "517a80cc0c3f64d3",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "0027-audit-2-resolved-statuses-set",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Source H5 \"2. RESOLVED_STATUSES\" is carried as H4 \"0027 Audit 2 Resolved Statuses Set\"; title and level changed. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading unit \"2. `RESOLVED_STATUSES` (tập \"giống category\" v\" becomes \"0027 Audit 2 Resolved Statuses Set\", every line after the heading line is byte-equal (2412 chars), so only title and level differ as the rationale says; anchor and target digest unchanged from the reviewed binding, shard equals pack",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "a4b78ba726bd39959cca89e81fa9d1bd269cf16807d014204b9427573cde9dea",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Consumer Audit"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-149"
}
```

## Entry decisions-150

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-second.json",
  "collection": "claims",
  "claimId": "claim_d97ba7f5ff310af83839fea58329acdd",
  "before": {
    "claimId": "claim_d97ba7f5ff310af83839fea58329acdd",
    "sourceUnitDigest": "827c7ac395f16aea",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-77",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "Audit 2 paragraph on RESOLVED_STATUSES in frontier.mjs; carried verbatim. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "827c7ac395f16aea73f4b6cb168d3876cf6a02ba54e137c27768654b4b04a7e4",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Consumer Audit",
      "0027 Audit 2 Resolved Statuses Set"
    ]
  },
  "after": {
    "claimId": "claim_d97ba7f5ff310af83839fea58329acdd",
    "sourceUnitDigest": "827c7ac395f16aea",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-77",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Audit 2 paragraph on RESOLVED_STATUSES in frontier.mjs; carried verbatim. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: 506 chars byte-equal between source and target by script, ancestry differs only by the translated heading (\"0027 Audit 2 Resolved Statuses\"), anchor unheaded-block-77 ok, digest and shard to pack equal, binding unchanged from the reviewed state; text not read line by line",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "827c7ac395f16aea73f4b6cb168d3876cf6a02ba54e137c27768654b4b04a7e4",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Consumer Audit",
      "0027 Audit 2 Resolved Statuses Set"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_d97ba7f5ff310af83839fea58329acdd",
    "sourceUnitDigest": "827c7ac395f16aea",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-77",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Audit 2 paragraph on RESOLVED_STATUSES in frontier.mjs; carried verbatim. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: 506 chars byte-equal between source and target by script, ancestry differs only by the translated heading (\"0027 Audit 2 Resolved Statuses\"), anchor unheaded-block-77 ok, digest and shard to pack equal, binding unchanged from the reviewed state; text not read line by line",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "827c7ac395f16aea73f4b6cb168d3876cf6a02ba54e137c27768654b4b04a7e4",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Consumer Audit",
      "0027 Audit 2 Resolved Statuses Set"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-150"
}
```

## Entry decisions-151

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-second.json",
  "collection": "claims",
  "claimId": "claim_84950cfff9d75392b847739c4812768a",
  "before": {
    "claimId": "claim_84950cfff9d75392b847739c4812768a",
    "sourceUnitDigest": "4e6cda4b133d000a",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-78",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "Audit 2 table of RESOLVED_STATUSES consumers; carried verbatim into block 78 (the located suggestion of block 76 was a first-line collision, the whole-text match is block 78). Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "4e6cda4b133d000a59389f9baa14d539c3dbc65fce54bbade31697dbdd6f33f6",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Consumer Audit",
      "0027 Audit 2 Resolved Statuses Set"
    ]
  },
  "after": {
    "claimId": "claim_84950cfff9d75392b847739c4812768a",
    "sourceUnitDigest": "4e6cda4b133d000a",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-78",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Audit 2 table of RESOLVED_STATUSES consumers; carried verbatim into block 78 (the located suggestion of block 76 was a first-line collision, the whole-text match is block 78). Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: read source and target, 1903 chars byte-equal, source sits under \"2. `RESOLVED_STATUSES` (tập \"giống\" and target under \"0027 Audit 2 Resolved Statuses Set\" (translated heading, which is why the exact class is only weak); rationale describes this unit correctly and now says content unchanged; anchor unheaded-block-78 ok, binding unchanged",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "4e6cda4b133d000a59389f9baa14d539c3dbc65fce54bbade31697dbdd6f33f6",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Consumer Audit",
      "0027 Audit 2 Resolved Statuses Set"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_84950cfff9d75392b847739c4812768a",
    "sourceUnitDigest": "4e6cda4b133d000a",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-78",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Audit 2 table of RESOLVED_STATUSES consumers; carried verbatim into block 78 (the located suggestion of block 76 was a first-line collision, the whole-text match is block 78). Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: read source and target, 1903 chars byte-equal, source sits under \"2. `RESOLVED_STATUSES` (tập \"giống\" and target under \"0027 Audit 2 Resolved Statuses Set\" (translated heading, which is why the exact class is only weak); rationale describes this unit correctly and now says content unchanged; anchor unheaded-block-78 ok, binding unchanged",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "4e6cda4b133d000a59389f9baa14d539c3dbc65fce54bbade31697dbdd6f33f6",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Consumer Audit",
      "0027 Audit 2 Resolved Statuses Set"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-151"
}
```

## Entry decisions-152

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-second.json",
  "collection": "claims",
  "claimId": "claim_ebfe14fc1ae59246f7b3c8871b402520",
  "before": {
    "claimId": "claim_ebfe14fc1ae59246f7b3c8871b402520",
    "sourceUnitDigest": "8590e597d5f07589",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "0027-audit-3-cli-status-literals",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "Source H5 \"3. Literal status trong verb logic\" is carried as H4 \"0027 Audit 3 CLI Status Literals\"; title and level changed. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "f921d3b97d03d68d8e8ea0e0722b18935ef9d37b362a0ce7e23b40b04aea8d27",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Consumer Audit"
    ]
  },
  "after": {
    "claimId": "claim_ebfe14fc1ae59246f7b3c8871b402520",
    "sourceUnitDigest": "8590e597d5f07589",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "0027-audit-3-cli-status-literals",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Source H5 \"3. Literal status trong verb logic\" is carried as H4 \"0027 Audit 3 CLI Status Literals\"; title and level changed. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading unit \"3. Literal status trong verb logic của `bin/fg\" becomes \"0027 Audit 3 CLI Status Literals\", every line after the heading line is byte-equal (2558 chars), so only title and level differ as the rationale says; anchor and target digest unchanged from the reviewed binding, shard equals pack",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "f921d3b97d03d68d8e8ea0e0722b18935ef9d37b362a0ce7e23b40b04aea8d27",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Consumer Audit"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_ebfe14fc1ae59246f7b3c8871b402520",
    "sourceUnitDigest": "8590e597d5f07589",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "0027-audit-3-cli-status-literals",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Source H5 \"3. Literal status trong verb logic\" is carried as H4 \"0027 Audit 3 CLI Status Literals\"; title and level changed. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading unit \"3. Literal status trong verb logic của `bin/fg\" becomes \"0027 Audit 3 CLI Status Literals\", every line after the heading line is byte-equal (2558 chars), so only title and level differ as the rationale says; anchor and target digest unchanged from the reviewed binding, shard equals pack",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "f921d3b97d03d68d8e8ea0e0722b18935ef9d37b362a0ce7e23b40b04aea8d27",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Consumer Audit"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-152"
}
```

## Entry decisions-153

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-second.json",
  "collection": "claims",
  "claimId": "claim_72ee6b558f807216affeb2559c6a597d",
  "before": {
    "claimId": "claim_72ee6b558f807216affeb2559c6a597d",
    "sourceUnitDigest": "707bfd13096596cd",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-79",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "Audit 3 table of CLI status literals; carried verbatim. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "707bfd13096596cdaacead82be5204686f47f824c3a3323cbb5bed21ebcceb95",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Consumer Audit",
      "0027 Audit 3 CLI Status Literals"
    ]
  },
  "after": {
    "claimId": "claim_72ee6b558f807216affeb2559c6a597d",
    "sourceUnitDigest": "707bfd13096596cd",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-79",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Audit 3 table of CLI status literals; carried verbatim. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: 2557 chars byte-equal between source and target by script, ancestry differs only by the translated heading (\"0027 Audit 3 CLI Status Litera\"), anchor unheaded-block-79 ok, digest and shard to pack equal, binding unchanged from the reviewed state; text not read line by line",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "707bfd13096596cdaacead82be5204686f47f824c3a3323cbb5bed21ebcceb95",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Consumer Audit",
      "0027 Audit 3 CLI Status Literals"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_72ee6b558f807216affeb2559c6a597d",
    "sourceUnitDigest": "707bfd13096596cd",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-79",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Audit 3 table of CLI status literals; carried verbatim. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: 2557 chars byte-equal between source and target by script, ancestry differs only by the translated heading (\"0027 Audit 3 CLI Status Litera\"), anchor unheaded-block-79 ok, digest and shard to pack equal, binding unchanged from the reviewed state; text not read line by line",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "707bfd13096596cdaacead82be5204686f47f824c3a3323cbb5bed21ebcceb95",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Consumer Audit",
      "0027 Audit 3 CLI Status Literals"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-153"
}
```

## Entry decisions-154

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-second.json",
  "collection": "claims",
  "claimId": "claim_6a85836cdc08fbdfde62f6d3fd9c2d8f",
  "before": {
    "claimId": "claim_6a85836cdc08fbdfde62f6d3fd9c2d8f",
    "sourceUnitDigest": "96096e1e5dd0a59c",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "0027-audit-4-runner-consumers",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "Source H5 \"4. runner/ ...\" is carried as H4 \"0027 Audit 4 Runner Consumers\"; title and level changed. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "cab0851daca0bf6a441036d7b9e02d4f16af9a41b78fd56f251727b173b51e5d",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Consumer Audit"
    ]
  },
  "after": {
    "claimId": "claim_6a85836cdc08fbdfde62f6d3fd9c2d8f",
    "sourceUnitDigest": "96096e1e5dd0a59c",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "0027-audit-4-runner-consumers",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Source H5 \"4. runner/ ...\" is carried as H4 \"0027 Audit 4 Runner Consumers\"; title and level changed. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading unit \"4. `runner/` — vòng tự hành, tiêu thụ nặng nhó\" becomes \"0027 Audit 4 Runner Consumers\", every line after the heading line is byte-equal (1654 chars), so only title and level differ as the rationale says; anchor and target digest unchanged from the reviewed binding, shard equals pack",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "cab0851daca0bf6a441036d7b9e02d4f16af9a41b78fd56f251727b173b51e5d",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Consumer Audit"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_6a85836cdc08fbdfde62f6d3fd9c2d8f",
    "sourceUnitDigest": "96096e1e5dd0a59c",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "0027-audit-4-runner-consumers",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Source H5 \"4. runner/ ...\" is carried as H4 \"0027 Audit 4 Runner Consumers\"; title and level changed. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading unit \"4. `runner/` — vòng tự hành, tiêu thụ nặng nhó\" becomes \"0027 Audit 4 Runner Consumers\", every line after the heading line is byte-equal (1654 chars), so only title and level differ as the rationale says; anchor and target digest unchanged from the reviewed binding, shard equals pack",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "cab0851daca0bf6a441036d7b9e02d4f16af9a41b78fd56f251727b173b51e5d",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Consumer Audit"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-154"
}
```

## Entry decisions-155

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-second.json",
  "collection": "claims",
  "claimId": "claim_4fceb5ca59ea256ccd77c0975d3576e1",
  "before": {
    "claimId": "claim_4fceb5ca59ea256ccd77c0975d3576e1",
    "sourceUnitDigest": "78c3de3f1ca205de",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-80",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "Audit 4 runner table; carried verbatim into block 80 (the located suggestion of block 76 was a first-line collision, whole-text match is block 80). Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "78c3de3f1ca205dedc7323091a92d4c1fcfff8e99132b37291aa46035cd75a20",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Consumer Audit",
      "0027 Audit 4 Runner Consumers"
    ]
  },
  "after": {
    "claimId": "claim_4fceb5ca59ea256ccd77c0975d3576e1",
    "sourceUnitDigest": "78c3de3f1ca205de",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-80",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Audit 4 runner table; carried verbatim into block 80 (the located suggestion of block 76 was a first-line collision, whole-text match is block 80). Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: 1653 chars byte-equal between source and target by script, ancestry differs only by the translated heading (\"0027 Audit 4 Runner Consumers\"), anchor unheaded-block-80 ok, digest and shard to pack equal, binding unchanged from the reviewed state; text not read line by line",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "78c3de3f1ca205dedc7323091a92d4c1fcfff8e99132b37291aa46035cd75a20",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Consumer Audit",
      "0027 Audit 4 Runner Consumers"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_4fceb5ca59ea256ccd77c0975d3576e1",
    "sourceUnitDigest": "78c3de3f1ca205de",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-80",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Audit 4 runner table; carried verbatim into block 80 (the located suggestion of block 76 was a first-line collision, whole-text match is block 80). Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: 1653 chars byte-equal between source and target by script, ancestry differs only by the translated heading (\"0027 Audit 4 Runner Consumers\"), anchor unheaded-block-80 ok, digest and shard to pack equal, binding unchanged from the reviewed state; text not read line by line",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "78c3de3f1ca205dedc7323091a92d4c1fcfff8e99132b37291aa46035cd75a20",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Consumer Audit",
      "0027 Audit 4 Runner Consumers"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-155"
}
```

## Entry decisions-156

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-second.json",
  "collection": "claims",
  "claimId": "claim_f1507b5008c678f9474202706e018774",
  "before": {
    "claimId": "claim_f1507b5008c678f9474202706e018774",
    "sourceUnitDigest": "80901672ceab8f8c",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "0027-audit-5-other-domain-agnostic-mechanisms",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "Source H5 \"5. Cơ chế domain-agnostic khác\" is carried as H4 \"0027 Audit 5 Other Domain-Agnostic Mechanisms\"; title and level changed. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "42d14b107b6ba2a390f6c7881ba8471c91817a24674e7eae6f05ff917d296692",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Consumer Audit"
    ]
  },
  "after": {
    "claimId": "claim_f1507b5008c678f9474202706e018774",
    "sourceUnitDigest": "80901672ceab8f8c",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "0027-audit-5-other-domain-agnostic-mechanisms",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Source H5 \"5. Cơ chế domain-agnostic khác\" is carried as H4 \"0027 Audit 5 Other Domain-Agnostic Mechanisms\"; title and level changed. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading unit \"5. Cơ chế domain-agnostic khác (được DISCUSSIO\" becomes \"0027 Audit 5 Other Domain-Agnostic Mechanisms\", every line after the heading line is byte-equal (1694 chars), so only title and level differ as the rationale says; anchor and target digest unchanged from the reviewed binding, shard equals pack",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "42d14b107b6ba2a390f6c7881ba8471c91817a24674e7eae6f05ff917d296692",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Consumer Audit"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_f1507b5008c678f9474202706e018774",
    "sourceUnitDigest": "80901672ceab8f8c",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "0027-audit-5-other-domain-agnostic-mechanisms",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Source H5 \"5. Cơ chế domain-agnostic khác\" is carried as H4 \"0027 Audit 5 Other Domain-Agnostic Mechanisms\"; title and level changed. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading unit \"5. Cơ chế domain-agnostic khác (được DISCUSSIO\" becomes \"0027 Audit 5 Other Domain-Agnostic Mechanisms\", every line after the heading line is byte-equal (1694 chars), so only title and level differ as the rationale says; anchor and target digest unchanged from the reviewed binding, shard equals pack",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "42d14b107b6ba2a390f6c7881ba8471c91817a24674e7eae6f05ff917d296692",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Consumer Audit"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-156"
}
```

## Entry decisions-157

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-second.json",
  "collection": "claims",
  "claimId": "claim_042b85c001dab92b6ae561f89eac6337",
  "before": {
    "claimId": "claim_042b85c001dab92b6ae561f89eac6337",
    "sourceUnitDigest": "fa83039437009e5f",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-81",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "Audit 5 table of other domain-agnostic mechanisms; carried verbatim into block 81 (located suggestion block 76 was a first-line collision). Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "fa83039437009e5f88a38c2bc19014eb481d33e6f82c491aeee4e2b226bf5e6a",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Consumer Audit",
      "0027 Audit 5 Other Domain-Agnostic Mechanisms"
    ]
  },
  "after": {
    "claimId": "claim_042b85c001dab92b6ae561f89eac6337",
    "sourceUnitDigest": "fa83039437009e5f",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-81",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Audit 5 table of other domain-agnostic mechanisms; carried verbatim into block 81 (located suggestion block 76 was a first-line collision). Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: 1693 chars byte-equal between source and target by script, ancestry differs only by the translated heading (\"0027 Audit 5 Other Domain-Agno\"), anchor unheaded-block-81 ok, digest and shard to pack equal, binding unchanged from the reviewed state; text not read line by line",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "fa83039437009e5f88a38c2bc19014eb481d33e6f82c491aeee4e2b226bf5e6a",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Consumer Audit",
      "0027 Audit 5 Other Domain-Agnostic Mechanisms"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_042b85c001dab92b6ae561f89eac6337",
    "sourceUnitDigest": "fa83039437009e5f",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-81",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Audit 5 table of other domain-agnostic mechanisms; carried verbatim into block 81 (located suggestion block 76 was a first-line collision). Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: 1693 chars byte-equal between source and target by script, ancestry differs only by the translated heading (\"0027 Audit 5 Other Domain-Agno\"), anchor unheaded-block-81 ok, digest and shard to pack equal, binding unchanged from the reviewed state; text not read line by line",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "fa83039437009e5f88a38c2bc19014eb481d33e6f82c491aeee4e2b226bf5e6a",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Consumer Audit",
      "0027 Audit 5 Other Domain-Agnostic Mechanisms"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-157"
}
```

## Entry decisions-158

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-second.json",
  "collection": "claims",
  "claimId": "claim_3fbb7ac76d27f06cc8e095a1d0e6b88e",
  "before": {
    "claimId": "claim_3fbb7ac76d27f06cc8e095a1d0e6b88e",
    "sourceUnitDigest": "a2754368a8483a13",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "0027-audit-6-adjacent-gaps",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "Source H5 \"6. Gap liên quan ...\" is carried as H4 \"0027 Audit 6 Adjacent Gaps\"; title and level changed. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "379c5e08a01f354caaa42087399545a3e49c45edece199864baa00f02e0a7bbc",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Consumer Audit"
    ]
  },
  "after": {
    "claimId": "claim_3fbb7ac76d27f06cc8e095a1d0e6b88e",
    "sourceUnitDigest": "a2754368a8483a13",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "0027-audit-6-adjacent-gaps",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Source H5 \"6. Gap liên quan ...\" is carried as H4 \"0027 Audit 6 Adjacent Gaps\"; title and level changed. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading unit \"6. Gap liên quan nhưng KHÔNG phải phạm vi audi\" becomes \"0027 Audit 6 Adjacent Gaps\", every line after the heading line is byte-equal (354 chars), so only title and level differ as the rationale says; anchor and target digest unchanged from the reviewed binding, shard equals pack",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "379c5e08a01f354caaa42087399545a3e49c45edece199864baa00f02e0a7bbc",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Consumer Audit"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_3fbb7ac76d27f06cc8e095a1d0e6b88e",
    "sourceUnitDigest": "a2754368a8483a13",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "0027-audit-6-adjacent-gaps",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Source H5 \"6. Gap liên quan ...\" is carried as H4 \"0027 Audit 6 Adjacent Gaps\"; title and level changed. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading unit \"6. Gap liên quan nhưng KHÔNG phải phạm vi audi\" becomes \"0027 Audit 6 Adjacent Gaps\", every line after the heading line is byte-equal (354 chars), so only title and level differ as the rationale says; anchor and target digest unchanged from the reviewed binding, shard equals pack",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "379c5e08a01f354caaa42087399545a3e49c45edece199864baa00f02e0a7bbc",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Consumer Audit"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-158"
}
```

## Entry decisions-159

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-second.json",
  "collection": "claims",
  "claimId": "claim_c5f9a98133b0fd6692dd0c7555d775e1",
  "before": {
    "claimId": "claim_c5f9a98133b0fd6692dd0c7555d775e1",
    "sourceUnitDigest": "d398e694ec2837bb",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-82",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "Audit 6 note that fgos-coding-compounding is called hard for every retrospective item; carried verbatim. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "d398e694ec2837bbe5052cfea277526dd887042f9bcc401bea01cd63b3d42971",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Consumer Audit",
      "0027 Audit 6 Adjacent Gaps"
    ]
  },
  "after": {
    "claimId": "claim_c5f9a98133b0fd6692dd0c7555d775e1",
    "sourceUnitDigest": "d398e694ec2837bb",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-82",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Audit 6 note that fgos-coding-compounding is called hard for every retrospective item; carried verbatim. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: 353 chars byte-equal between source and target by script, ancestry differs only by the translated heading (\"0027 Audit 6 Adjacent Gaps\"), anchor unheaded-block-82 ok, digest and shard to pack equal, binding unchanged from the reviewed state; text not read line by line",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "d398e694ec2837bbe5052cfea277526dd887042f9bcc401bea01cd63b3d42971",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Consumer Audit",
      "0027 Audit 6 Adjacent Gaps"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_c5f9a98133b0fd6692dd0c7555d775e1",
    "sourceUnitDigest": "d398e694ec2837bb",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-82",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Audit 6 note that fgos-coding-compounding is called hard for every retrospective item; carried verbatim. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: 353 chars byte-equal between source and target by script, ancestry differs only by the translated heading (\"0027 Audit 6 Adjacent Gaps\"), anchor unheaded-block-82 ok, digest and shard to pack equal, binding unchanged from the reviewed state; text not read line by line",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "d398e694ec2837bbe5052cfea277526dd887042f9bcc401bea01cd63b3d42971",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Consumer Audit",
      "0027 Audit 6 Adjacent Gaps"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-159"
}
```

## Entry decisions-160

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-second.json",
  "collection": "claims",
  "claimId": "claim_e2d3709ee991f35ec6153e7e84c46e2f",
  "before": {
    "claimId": "claim_e2d3709ee991f35ec6153e7e84c46e2f",
    "sourceUnitDigest": "d35b961952abd6b3",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "0027-consequences",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "Source H4 \"Hệ quả\" of ADR 0027 is carried as H3 \"0027 Consequences\"; title differs, heading-only unit. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "7729270993aaa029e4ceb8b64300670303de6930bf6412bd3c8097b7dac134ba",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary"
    ]
  },
  "after": {
    "claimId": "claim_e2d3709ee991f35ec6153e7e84c46e2f",
    "sourceUnitDigest": "d35b961952abd6b3",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "0027-consequences",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Source H4 \"Hệ quả\" of ADR 0027 is carried as H3 \"0027 Consequences\"; title differs, heading-only unit. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading unit \"Hệ quả\" becomes \"0027 Consequences\", every line after the heading line is byte-equal (1948 chars), so only title and level differ as the rationale says; anchor and target digest unchanged from the reviewed binding, shard equals pack",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "7729270993aaa029e4ceb8b64300670303de6930bf6412bd3c8097b7dac134ba",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_e2d3709ee991f35ec6153e7e84c46e2f",
    "sourceUnitDigest": "d35b961952abd6b3",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "0027-consequences",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Source H4 \"Hệ quả\" of ADR 0027 is carried as H3 \"0027 Consequences\"; title differs, heading-only unit. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading unit \"Hệ quả\" becomes \"0027 Consequences\", every line after the heading line is byte-equal (1948 chars), so only title and level differ as the rationale says; anchor and target digest unchanged from the reviewed binding, shard equals pack",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "7729270993aaa029e4ceb8b64300670303de6930bf6412bd3c8097b7dac134ba",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-160"
}
```

## Entry decisions-161

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-second.json",
  "collection": "claims",
  "claimId": "claim_8eeec687713e79da23a9339df1179b60",
  "before": {
    "claimId": "claim_8eeec687713e79da23a9339df1179b60",
    "sourceUnitDigest": "e12e5b17bd0afd2f",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-83",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "ADR 0027 consequences list (precondition for the multi-domain schema work and follow-ups); carried verbatim. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "e12e5b17bd0afd2f30ca5edac6ad58cfea0a5dce8eab8429d40b6eb688a3eba0",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Consequences"
    ]
  },
  "after": {
    "claimId": "claim_8eeec687713e79da23a9339df1179b60",
    "sourceUnitDigest": "e12e5b17bd0afd2f",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-83",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "ADR 0027 consequences list (precondition for the multi-domain schema work and follow-ups); carried verbatim. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: 1947 chars byte-equal between source and target by script, ancestry differs only by the translated heading (\"0027 Consequences\"), anchor unheaded-block-83 ok, digest and shard to pack equal, binding unchanged from the reviewed state; text not read line by line",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "e12e5b17bd0afd2f30ca5edac6ad58cfea0a5dce8eab8429d40b6eb688a3eba0",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Consequences"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_8eeec687713e79da23a9339df1179b60",
    "sourceUnitDigest": "e12e5b17bd0afd2f",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-83",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "ADR 0027 consequences list (precondition for the multi-domain schema work and follow-ups); carried verbatim. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: 1947 chars byte-equal between source and target by script, ancestry differs only by the translated heading (\"0027 Consequences\"), anchor unheaded-block-83 ok, digest and shard to pack equal, binding unchanged from the reviewed state; text not read line by line",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "e12e5b17bd0afd2f30ca5edac6ad58cfea0a5dce8eab8429d40b6eb688a3eba0",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary",
      "0027 Consequences"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-161"
}
```

## Entry decisions-162

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-second.json",
  "collection": "claims",
  "claimId": "claim_217bf9908c0941c13b1eaf2f7a2d9d64",
  "before": {
    "claimId": "claim_217bf9908c0941c13b1eaf2f7a2d9d64",
    "sourceUnitDigest": "f617f1c06417c2f7",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "13-adr-0032-multi-role-team-harness",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "Source H3 \"0032 — Multi-role Team Harness: trục role/holder ...\" is carried as H2 \"13. ADR 0032 Multi-Role Team Harness\"; title shortened and translated. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "adc471524e7f457d3d74097885286fe95536a2bcb0db955d80faa15452aad116",
    "targetAncestry": [
      "Retired Decision History: Work State"
    ]
  },
  "after": {
    "claimId": "claim_217bf9908c0941c13b1eaf2f7a2d9d64",
    "sourceUnitDigest": "f617f1c06417c2f7",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "13-adr-0032-multi-role-team-harness",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Source H3 \"0032 — Multi-role Team Harness: trục role/holder ...\" is carried as H2 \"13. ADR 0032 Multi-Role Team Harness\"; title shortened and translated. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading unit \"0032 — Multi-role Team Harness: trục role/hold\" becomes \"13. ADR 0032 Multi-Role Team Harness\", every line after the heading line is byte-equal (652 chars), so only title and level differ as the rationale says; anchor and target digest unchanged from the reviewed binding, shard equals pack",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "adc471524e7f457d3d74097885286fe95536a2bcb0db955d80faa15452aad116",
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
    "claimId": "claim_217bf9908c0941c13b1eaf2f7a2d9d64",
    "sourceUnitDigest": "f617f1c06417c2f7",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "13-adr-0032-multi-role-team-harness",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Source H3 \"0032 — Multi-role Team Harness: trục role/holder ...\" is carried as H2 \"13. ADR 0032 Multi-Role Team Harness\"; title shortened and translated. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading unit \"0032 — Multi-role Team Harness: trục role/hold\" becomes \"13. ADR 0032 Multi-Role Team Harness\", every line after the heading line is byte-equal (652 chars), so only title and level differ as the rationale says; anchor and target digest unchanged from the reviewed binding, shard equals pack",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "adc471524e7f457d3d74097885286fe95536a2bcb0db955d80faa15452aad116",
    "targetAncestry": [
      "Retired Decision History: Work State"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-162"
}
```

## Entry decisions-163

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-second.json",
  "collection": "claims",
  "claimId": "claim_63db75c2d22d1861c69845d62518ee60",
  "before": {
    "claimId": "claim_63db75c2d22d1861c69845d62518ee60",
    "sourceUnitDigest": "6f54e9c73c49cc06",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-84",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "Distill-evidence blockquote opening ADR 0032 (24 discussion rounds, 2026-08-15); carried verbatim under the 0032 H2. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "6f54e9c73c49cc06bd93ba1401ddb0bdefda6e4c89e62bfc55be6fd092514bb6",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "13. ADR 0032 Multi-Role Team Harness"
    ]
  },
  "after": {
    "claimId": "claim_63db75c2d22d1861c69845d62518ee60",
    "sourceUnitDigest": "6f54e9c73c49cc06",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-84",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Distill-evidence blockquote opening ADR 0032 (24 discussion rounds, 2026-08-15); carried verbatim under the 0032 H2. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: 651 chars byte-equal between source and target by script, ancestry differs only by the translated heading (\"13. ADR 0032 Multi-Role Team H\"), anchor unheaded-block-84 ok, digest and shard to pack equal, binding unchanged from the reviewed state; text not read line by line",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "6f54e9c73c49cc06bd93ba1401ddb0bdefda6e4c89e62bfc55be6fd092514bb6",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "13. ADR 0032 Multi-Role Team Harness"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_63db75c2d22d1861c69845d62518ee60",
    "sourceUnitDigest": "6f54e9c73c49cc06",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-84",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Distill-evidence blockquote opening ADR 0032 (24 discussion rounds, 2026-08-15); carried verbatim under the 0032 H2. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: 651 chars byte-equal between source and target by script, ancestry differs only by the translated heading (\"13. ADR 0032 Multi-Role Team H\"), anchor unheaded-block-84 ok, digest and shard to pack equal, binding unchanged from the reviewed state; text not read line by line",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "6f54e9c73c49cc06bd93ba1401ddb0bdefda6e4c89e62bfc55be6fd092514bb6",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "13. ADR 0032 Multi-Role Team Harness"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-163"
}
```

## Entry decisions-164

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-second.json",
  "collection": "claims",
  "claimId": "claim_e6ae96517c239248948c36255ae4dcac",
  "before": {
    "claimId": "claim_e6ae96517c239248948c36255ae4dcac",
    "sourceUnitDigest": "8f1228fba7212659",
    "targetOwner": "docs/platform/work-state/history/multi-role-harness-distill-record.md",
    "targetAnchor": "2-distill-journey",
    "claimKind": "historical-context",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "Source H4 \"Hành trình\" is carried as H2 \"2. Distill Journey\" in the history document, not in the decision record; title differs. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "8cb65c5075a2a4c13e78b4300f757cfeb334104a6783d6f9c1e6c60f44515274",
    "targetAncestry": [
      "Multi-Role Harness Distill Record"
    ]
  },
  "after": {
    "claimId": "claim_e6ae96517c239248948c36255ae4dcac",
    "sourceUnitDigest": "8f1228fba7212659",
    "targetOwner": "docs/platform/work-state/history/multi-role-harness-distill-record.md",
    "targetAnchor": "2-distill-journey",
    "claimKind": "historical-context",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Source H4 \"Hành trình\" is carried as H2 \"2. Distill Journey\" in the history document, not in the decision record; title differs. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading unit \"Hành trình\" becomes \"2. Distill Journey\", every line after the heading line is byte-equal (448 chars), so only title and level differ as the rationale says; anchor and target digest unchanged from the reviewed binding, shard equals pack",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "8cb65c5075a2a4c13e78b4300f757cfeb334104a6783d6f9c1e6c60f44515274",
    "targetAncestry": [
      "Multi-Role Harness Distill Record"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_e6ae96517c239248948c36255ae4dcac",
    "sourceUnitDigest": "8f1228fba7212659",
    "targetOwner": "docs/platform/work-state/history/multi-role-harness-distill-record.md",
    "targetAnchor": "2-distill-journey",
    "claimKind": "historical-context",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Source H4 \"Hành trình\" is carried as H2 \"2. Distill Journey\" in the history document, not in the decision record; title differs. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading unit \"Hành trình\" becomes \"2. Distill Journey\", every line after the heading line is byte-equal (448 chars), so only title and level differ as the rationale says; anchor and target digest unchanged from the reviewed binding, shard equals pack",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "8cb65c5075a2a4c13e78b4300f757cfeb334104a6783d6f9c1e6c60f44515274",
    "targetAncestry": [
      "Multi-Role Harness Distill Record"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-164"
}
```

## Entry decisions-165

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-second.json",
  "collection": "claims",
  "claimId": "claim_634d509e158ed8fc22f610e4c51030ba",
  "before": {
    "claimId": "claim_634d509e158ed8fc22f610e4c51030ba",
    "sourceUnitDigest": "9f9c5aa1e0bc5a1c",
    "targetOwner": "docs/platform/work-state/history/multi-role-harness-distill-record.md",
    "targetAnchor": "unheaded-block-3",
    "claimKind": "historical-context",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "Dated distill-journey narrative (comparison request and the scouting rounds); carried verbatim into the history document, classified historical-context rather than decision. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "9f9c5aa1e0bc5a1c034b9356fe0d0dc2f659f3bb7202679d3db53ba250b1b5eb",
    "targetAncestry": [
      "Multi-Role Harness Distill Record",
      "2. Distill Journey"
    ]
  },
  "after": {
    "claimId": "claim_634d509e158ed8fc22f610e4c51030ba",
    "sourceUnitDigest": "9f9c5aa1e0bc5a1c",
    "targetOwner": "docs/platform/work-state/history/multi-role-harness-distill-record.md",
    "targetAnchor": "unheaded-block-3",
    "claimKind": "historical-context",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Dated distill-journey narrative (comparison request and the scouting rounds); carried verbatim into the history document, classified historical-context rather than decision. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: 447 chars byte-equal between source and target by script, ancestry differs only by the translated heading (\"2. Distill Journey\"), anchor unheaded-block-3 ok, digest and shard to pack equal, binding unchanged from the reviewed state; text not read line by line",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "9f9c5aa1e0bc5a1c034b9356fe0d0dc2f659f3bb7202679d3db53ba250b1b5eb",
    "targetAncestry": [
      "Multi-Role Harness Distill Record",
      "2. Distill Journey"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_634d509e158ed8fc22f610e4c51030ba",
    "sourceUnitDigest": "9f9c5aa1e0bc5a1c",
    "targetOwner": "docs/platform/work-state/history/multi-role-harness-distill-record.md",
    "targetAnchor": "unheaded-block-3",
    "claimKind": "historical-context",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Dated distill-journey narrative (comparison request and the scouting rounds); carried verbatim into the history document, classified historical-context rather than decision. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: 447 chars byte-equal between source and target by script, ancestry differs only by the translated heading (\"2. Distill Journey\"), anchor unheaded-block-3 ok, digest and shard to pack equal, binding unchanged from the reviewed state; text not read line by line",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "9f9c5aa1e0bc5a1c034b9356fe0d0dc2f659f3bb7202679d3db53ba250b1b5eb",
    "targetAncestry": [
      "Multi-Role Harness Distill Record",
      "2. Distill Journey"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-165"
}
```

## Entry decisions-166

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-second.json",
  "collection": "claims",
  "claimId": "claim_7e0016df70b7640b0337c5daf5f80e90",
  "before": {
    "claimId": "claim_7e0016df70b7640b0337c5daf5f80e90",
    "sourceUnitDigest": "18b3552e741e5967",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "0032-foundation-architecture",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "Source H4 \"I. Kiến trúc nền (seq ...)\" is carried as H3 \"0032 Foundation Architecture\"; title translated and seq references dropped. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "43773d8a795297806063bf0a0df747a426a048d010c7835e6a4c364f948e25e9",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "13. ADR 0032 Multi-Role Team Harness"
    ]
  },
  "after": {
    "claimId": "claim_7e0016df70b7640b0337c5daf5f80e90",
    "sourceUnitDigest": "18b3552e741e5967",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "0032-foundation-architecture",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Source H4 \"I. Kiến trúc nền (seq ...)\" is carried as H3 \"0032 Foundation Architecture\"; title translated and seq references dropped. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading unit \"I. Kiến trúc nền (seq 18029, 18031)\" becomes \"0032 Foundation Architecture\", every line after the heading line is byte-equal (747 chars), so only title and level differ as the rationale says; anchor and target digest unchanged from the reviewed binding, shard equals pack",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "43773d8a795297806063bf0a0df747a426a048d010c7835e6a4c364f948e25e9",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "13. ADR 0032 Multi-Role Team Harness"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_7e0016df70b7640b0337c5daf5f80e90",
    "sourceUnitDigest": "18b3552e741e5967",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "0032-foundation-architecture",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Source H4 \"I. Kiến trúc nền (seq ...)\" is carried as H3 \"0032 Foundation Architecture\"; title translated and seq references dropped. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading unit \"I. Kiến trúc nền (seq 18029, 18031)\" becomes \"0032 Foundation Architecture\", every line after the heading line is byte-equal (747 chars), so only title and level differ as the rationale says; anchor and target digest unchanged from the reviewed binding, shard equals pack",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "43773d8a795297806063bf0a0df747a426a048d010c7835e6a4c364f948e25e9",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "13. ADR 0032 Multi-Role Team Harness"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-166"
}
```

## Entry decisions-167

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-second.json",
  "collection": "claims",
  "claimId": "claim_a9be2da803446c73efbfcac40ee82637",
  "before": {
    "claimId": "claim_a9be2da803446c73efbfcac40ee82637",
    "sourceUnitDigest": "2a1722766193d70b",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-85",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "ADR 0032 foundation list (mechanism vs policy and related axes); carried verbatim. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "2a1722766193d70b5f41165f820655b64f3c7ce5a79b105d57af313ff03ffe9e",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "13. ADR 0032 Multi-Role Team Harness",
      "0032 Foundation Architecture"
    ]
  },
  "after": {
    "claimId": "claim_a9be2da803446c73efbfcac40ee82637",
    "sourceUnitDigest": "2a1722766193d70b",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-85",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "ADR 0032 foundation list (mechanism vs policy and related axes); carried verbatim. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: 746 chars byte-equal between source and target by script, ancestry differs only by the translated heading (\"0032 Foundation Architecture\"), anchor unheaded-block-85 ok, digest and shard to pack equal, binding unchanged from the reviewed state; text not read line by line",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "2a1722766193d70b5f41165f820655b64f3c7ce5a79b105d57af313ff03ffe9e",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "13. ADR 0032 Multi-Role Team Harness",
      "0032 Foundation Architecture"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_a9be2da803446c73efbfcac40ee82637",
    "sourceUnitDigest": "2a1722766193d70b",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-85",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "ADR 0032 foundation list (mechanism vs policy and related axes); carried verbatim. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: 746 chars byte-equal between source and target by script, ancestry differs only by the translated heading (\"0032 Foundation Architecture\"), anchor unheaded-block-85 ok, digest and shard to pack equal, binding unchanged from the reviewed state; text not read line by line",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "2a1722766193d70b5f41165f820655b64f3c7ce5a79b105d57af313ff03ffe9e",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "13. ADR 0032 Multi-Role Team Harness",
      "0032 Foundation Architecture"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-167"
}
```

## Entry decisions-168

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-second.json",
  "collection": "claims",
  "claimId": "claim_f30f58465c33adf6343057d6c3fcb2b3",
  "before": {
    "claimId": "claim_f30f58465c33adf6343057d6c3fcb2b3",
    "sourceUnitDigest": "bade02e702bb44fe",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "0032-handoff",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "Source H4 \"II. Handoff ...\" is carried as H3 \"0032 Handoff\"; title shortened and seq references dropped. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "6b297c17245b7ff04f30f0e8abc72bbb41907953c204d3469f8896771b5e88e0",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "13. ADR 0032 Multi-Role Team Harness"
    ]
  },
  "after": {
    "claimId": "claim_f30f58465c33adf6343057d6c3fcb2b3",
    "sourceUnitDigest": "bade02e702bb44fe",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "0032-handoff",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Source H4 \"II. Handoff ...\" is carried as H3 \"0032 Handoff\"; title shortened and seq references dropped. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading unit \"II. Handoff — trái tim của tính uyển chuyển (s\" becomes \"0032 Handoff\", every line after the heading line is byte-equal (1252 chars), so only title and level differ as the rationale says; anchor and target digest unchanged from the reviewed binding, shard equals pack",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "6b297c17245b7ff04f30f0e8abc72bbb41907953c204d3469f8896771b5e88e0",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "13. ADR 0032 Multi-Role Team Harness"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_f30f58465c33adf6343057d6c3fcb2b3",
    "sourceUnitDigest": "bade02e702bb44fe",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "0032-handoff",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Source H4 \"II. Handoff ...\" is carried as H3 \"0032 Handoff\"; title shortened and seq references dropped. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading unit \"II. Handoff — trái tim của tính uyển chuyển (s\" becomes \"0032 Handoff\", every line after the heading line is byte-equal (1252 chars), so only title and level differ as the rationale says; anchor and target digest unchanged from the reviewed binding, shard equals pack",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "6b297c17245b7ff04f30f0e8abc72bbb41907953c204d3469f8896771b5e88e0",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "13. ADR 0032 Multi-Role Team Harness"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-168"
}
```

## Entry decisions-169

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-second.json",
  "collection": "claims",
  "claimId": "claim_6f7a10c04ee1414d39b0b2ef8d7d2d6d",
  "before": {
    "claimId": "claim_6f7a10c04ee1414d39b0b2ef8d7d2d6d",
    "sourceUnitDigest": "dce677680de09c58",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-86",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "ADR 0032 handoff list (Call vs hand-off kinds and rules); carried verbatim. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "dce677680de09c58dce4e54b16850671db81f3e54202b29d8adc8e9c2f358bae",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "13. ADR 0032 Multi-Role Team Harness",
      "0032 Handoff"
    ]
  },
  "after": {
    "claimId": "claim_6f7a10c04ee1414d39b0b2ef8d7d2d6d",
    "sourceUnitDigest": "dce677680de09c58",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-86",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "ADR 0032 handoff list (Call vs hand-off kinds and rules); carried verbatim. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: 1251 chars byte-equal between source and target by script, ancestry differs only by the translated heading (\"0032 Handoff\"), anchor unheaded-block-86 ok, digest and shard to pack equal, binding unchanged from the reviewed state; text not read line by line",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "dce677680de09c58dce4e54b16850671db81f3e54202b29d8adc8e9c2f358bae",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "13. ADR 0032 Multi-Role Team Harness",
      "0032 Handoff"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_6f7a10c04ee1414d39b0b2ef8d7d2d6d",
    "sourceUnitDigest": "dce677680de09c58",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-86",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "ADR 0032 handoff list (Call vs hand-off kinds and rules); carried verbatim. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: 1251 chars byte-equal between source and target by script, ancestry differs only by the translated heading (\"0032 Handoff\"), anchor unheaded-block-86 ok, digest and shard to pack equal, binding unchanged from the reviewed state; text not read line by line",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "dce677680de09c58dce4e54b16850671db81f3e54202b29d8adc8e9c2f358bae",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "13. ADR 0032 Multi-Role Team Harness",
      "0032 Handoff"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-169"
}
```

## Entry decisions-170

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-second.json",
  "collection": "claims",
  "claimId": "claim_45840c035132a9c46aa748567ae37648",
  "before": {
    "claimId": "claim_45840c035132a9c46aa748567ae37648",
    "sourceUnitDigest": "fe8801065e62f36e",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "0032-declarative-structure",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "Source H4 \"III. Cấu trúc khai báo ...\" is carried as H3 \"0032 Declarative Structure\"; title translated and seq references dropped. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "f13c8f30093babf6efcf6b2fbb0062eecfe81a6db5527e400d33b8c3167a4cc5",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "13. ADR 0032 Multi-Role Team Harness"
    ]
  },
  "after": {
    "claimId": "claim_45840c035132a9c46aa748567ae37648",
    "sourceUnitDigest": "fe8801065e62f36e",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "0032-declarative-structure",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Source H4 \"III. Cấu trúc khai báo ...\" is carried as H3 \"0032 Declarative Structure\"; title translated and seq references dropped. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading unit \"III. Cấu trúc khai báo (seq 18059, 18060, 1811\" becomes \"0032 Declarative Structure\", every line after the heading line is byte-equal (4695 chars), so only title and level differ as the rationale says; anchor and target digest unchanged from the reviewed binding, shard equals pack",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "f13c8f30093babf6efcf6b2fbb0062eecfe81a6db5527e400d33b8c3167a4cc5",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "13. ADR 0032 Multi-Role Team Harness"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_45840c035132a9c46aa748567ae37648",
    "sourceUnitDigest": "fe8801065e62f36e",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "0032-declarative-structure",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Source H4 \"III. Cấu trúc khai báo ...\" is carried as H3 \"0032 Declarative Structure\"; title translated and seq references dropped. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading unit \"III. Cấu trúc khai báo (seq 18059, 18060, 1811\" becomes \"0032 Declarative Structure\", every line after the heading line is byte-equal (4695 chars), so only title and level differ as the rationale says; anchor and target digest unchanged from the reviewed binding, shard equals pack",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "f13c8f30093babf6efcf6b2fbb0062eecfe81a6db5527e400d33b8c3167a4cc5",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "13. ADR 0032 Multi-Role Team Harness"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-170"
}
```

## Entry decisions-171

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-second.json",
  "collection": "claims",
  "claimId": "claim_10986602d5cab816cf923616dc6b58f8",
  "before": {
    "claimId": "claim_10986602d5cab816cf923616dc6b58f8",
    "sourceUnitDigest": "7dfb88e6ee480189",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-87",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "Long ADR 0032 declarative-structure list (hierarchy domain, workflow, item and the declared structures); 66 lines carried verbatim as one block. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "7dfb88e6ee480189beccd2e878bedb9e493d9bad07a27830301fddd053040d70",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "13. ADR 0032 Multi-Role Team Harness",
      "0032 Declarative Structure"
    ]
  },
  "after": {
    "claimId": "claim_10986602d5cab816cf923616dc6b58f8",
    "sourceUnitDigest": "7dfb88e6ee480189",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-87",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Long ADR 0032 declarative-structure list (hierarchy domain, workflow, item and the declared structures); 66 lines carried verbatim as one block. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: 4694 chars byte-equal between source and target by script, ancestry differs only by the translated heading (\"0032 Declarative Structure\"), anchor unheaded-block-87 ok, digest and shard to pack equal, binding unchanged from the reviewed state; text not read line by line",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "7dfb88e6ee480189beccd2e878bedb9e493d9bad07a27830301fddd053040d70",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "13. ADR 0032 Multi-Role Team Harness",
      "0032 Declarative Structure"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_10986602d5cab816cf923616dc6b58f8",
    "sourceUnitDigest": "7dfb88e6ee480189",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-87",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Long ADR 0032 declarative-structure list (hierarchy domain, workflow, item and the declared structures); 66 lines carried verbatim as one block. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: 4694 chars byte-equal between source and target by script, ancestry differs only by the translated heading (\"0032 Declarative Structure\"), anchor unheaded-block-87 ok, digest and shard to pack equal, binding unchanged from the reviewed state; text not read line by line",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "7dfb88e6ee480189beccd2e878bedb9e493d9bad07a27830301fddd053040d70",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "13. ADR 0032 Multi-Role Team Harness",
      "0032 Declarative Structure"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-171"
}
```

## Entry decisions-172

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-second.json",
  "collection": "claims",
  "claimId": "claim_7baf6e6911d7bdc8cbb66425d0aff57a",
  "before": {
    "claimId": "claim_7baf6e6911d7bdc8cbb66425d0aff57a",
    "sourceUnitDigest": "58d933902652fcbf",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "0032-implementation-sequence",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "Source H4 \"IV. Trình tự triển khai (seq 18030)\" is carried as H3 \"0032 Implementation Sequence\"; title translated. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "861c399f16053144093e08b8bf68e573b9afa26758d326b719c0bb5ddcd0d88f",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "13. ADR 0032 Multi-Role Team Harness"
    ]
  },
  "after": {
    "claimId": "claim_7baf6e6911d7bdc8cbb66425d0aff57a",
    "sourceUnitDigest": "58d933902652fcbf",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "0032-implementation-sequence",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Source H4 \"IV. Trình tự triển khai (seq 18030)\" is carried as H3 \"0032 Implementation Sequence\"; title translated. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading unit \"IV. Trình tự triển khai (seq 18030)\" becomes \"0032 Implementation Sequence\", every line after the heading line is byte-equal (667 chars), so only title and level differ as the rationale says; anchor and target digest unchanged from the reviewed binding, shard equals pack",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "861c399f16053144093e08b8bf68e573b9afa26758d326b719c0bb5ddcd0d88f",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "13. ADR 0032 Multi-Role Team Harness"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_7baf6e6911d7bdc8cbb66425d0aff57a",
    "sourceUnitDigest": "58d933902652fcbf",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "0032-implementation-sequence",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Source H4 \"IV. Trình tự triển khai (seq 18030)\" is carried as H3 \"0032 Implementation Sequence\"; title translated. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading unit \"IV. Trình tự triển khai (seq 18030)\" becomes \"0032 Implementation Sequence\", every line after the heading line is byte-equal (667 chars), so only title and level differ as the rationale says; anchor and target digest unchanged from the reviewed binding, shard equals pack",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "861c399f16053144093e08b8bf68e573b9afa26758d326b719c0bb5ddcd0d88f",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "13. ADR 0032 Multi-Role Team Harness"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-172"
}
```

## Entry decisions-173

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-second.json",
  "collection": "claims",
  "claimId": "claim_2e0270967476b583f5548c2d0632c6f7",
  "before": {
    "claimId": "claim_2e0270967476b583f5548c2d0632c6f7",
    "sourceUnitDigest": "4b806f05cc974fa8",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-88",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "ADR 0032 statement that coding goes first (user decision reversing the proposal); carried verbatim. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "4b806f05cc974fa81ae9b0ebd50789a568fb41a274c5ffb11865accbfb2ef9cd",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "13. ADR 0032 Multi-Role Team Harness",
      "0032 Implementation Sequence"
    ]
  },
  "after": {
    "claimId": "claim_2e0270967476b583f5548c2d0632c6f7",
    "sourceUnitDigest": "4b806f05cc974fa8",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-88",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "ADR 0032 statement that coding goes first (user decision reversing the proposal); carried verbatim. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: read source and target, 188 chars byte-equal, source sits under \"IV. Trình tự triển khai (seq 18030\" and target under \"0032 Implementation Sequence\" (translated heading, which is why the exact class is only weak); rationale describes this unit correctly and now says content unchanged; anchor unheaded-block-88 ok, binding unchanged",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "4b806f05cc974fa81ae9b0ebd50789a568fb41a274c5ffb11865accbfb2ef9cd",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "13. ADR 0032 Multi-Role Team Harness",
      "0032 Implementation Sequence"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_2e0270967476b583f5548c2d0632c6f7",
    "sourceUnitDigest": "4b806f05cc974fa8",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-88",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "ADR 0032 statement that coding goes first (user decision reversing the proposal); carried verbatim. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: read source and target, 188 chars byte-equal, source sits under \"IV. Trình tự triển khai (seq 18030\" and target under \"0032 Implementation Sequence\" (translated heading, which is why the exact class is only weak); rationale describes this unit correctly and now says content unchanged; anchor unheaded-block-88 ok, binding unchanged",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "4b806f05cc974fa81ae9b0ebd50789a568fb41a274c5ffb11865accbfb2ef9cd",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "13. ADR 0032 Multi-Role Team Harness",
      "0032 Implementation Sequence"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-173"
}
```

## Entry decisions-174

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-second.json",
  "collection": "claims",
  "claimId": "claim_b7d1849e7cde5d799b984dbf0ea3bcff",
  "before": {
    "claimId": "claim_b7d1849e7cde5d799b984dbf0ea3bcff",
    "sourceUnitDigest": "d6ebd90319d8f7c2",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-89",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "ADR 0032 table of reason versus existing implicit interaction; carried verbatim. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "d6ebd90319d8f7c2c586f0790b3649a8f9bad951d61aa6918d0aa40c7918483a",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "13. ADR 0032 Multi-Role Team Harness",
      "0032 Implementation Sequence"
    ]
  },
  "after": {
    "claimId": "claim_b7d1849e7cde5d799b984dbf0ea3bcff",
    "sourceUnitDigest": "d6ebd90319d8f7c2",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-89",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "ADR 0032 table of reason versus existing implicit interaction; carried verbatim. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: 264 chars byte-equal between source and target by script, ancestry differs only by the translated heading (\"0032 Implementation Sequence\"), anchor unheaded-block-89 ok, digest and shard to pack equal, binding unchanged from the reviewed state; text not read line by line",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "d6ebd90319d8f7c2c586f0790b3649a8f9bad951d61aa6918d0aa40c7918483a",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "13. ADR 0032 Multi-Role Team Harness",
      "0032 Implementation Sequence"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_b7d1849e7cde5d799b984dbf0ea3bcff",
    "sourceUnitDigest": "d6ebd90319d8f7c2",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-89",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "ADR 0032 table of reason versus existing implicit interaction; carried verbatim. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: 264 chars byte-equal between source and target by script, ancestry differs only by the translated heading (\"0032 Implementation Sequence\"), anchor unheaded-block-89 ok, digest and shard to pack equal, binding unchanged from the reviewed state; text not read line by line",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "d6ebd90319d8f7c2c586f0790b3649a8f9bad951d61aa6918d0aa40c7918483a",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "13. ADR 0032 Multi-Role Team Harness",
      "0032 Implementation Sequence"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-174"
}
```

## Entry decisions-175

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-second.json",
  "collection": "claims",
  "claimId": "claim_fd3c6c93c220012e1e08d65c9276ab24",
  "before": {
    "claimId": "claim_fd3c6c93c220012e1e08d65c9276ab24",
    "sourceUnitDigest": "a53db20b6d5f1c2b",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-90",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "ADR 0032 ordering sentence for the three delivery pieces; carried verbatim. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "a53db20b6d5f1c2bd15b3fee81feaa4d33c20ab74c964495d03a27b1fddc30a2",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "13. ADR 0032 Multi-Role Team Harness",
      "0032 Implementation Sequence"
    ]
  },
  "after": {
    "claimId": "claim_fd3c6c93c220012e1e08d65c9276ab24",
    "sourceUnitDigest": "a53db20b6d5f1c2b",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-90",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "ADR 0032 ordering sentence for the three delivery pieces; carried verbatim. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: 210 chars byte-equal between source and target by script, ancestry differs only by the translated heading (\"0032 Implementation Sequence\"), anchor unheaded-block-90 ok, digest and shard to pack equal, binding unchanged from the reviewed state; text not read line by line",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "a53db20b6d5f1c2bd15b3fee81feaa4d33c20ab74c964495d03a27b1fddc30a2",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "13. ADR 0032 Multi-Role Team Harness",
      "0032 Implementation Sequence"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_fd3c6c93c220012e1e08d65c9276ab24",
    "sourceUnitDigest": "a53db20b6d5f1c2b",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-90",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "ADR 0032 ordering sentence for the three delivery pieces; carried verbatim. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: 210 chars byte-equal between source and target by script, ancestry differs only by the translated heading (\"0032 Implementation Sequence\"), anchor unheaded-block-90 ok, digest and shard to pack equal, binding unchanged from the reviewed state; text not read line by line",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "a53db20b6d5f1c2bd15b3fee81feaa4d33c20ab74c964495d03a27b1fddc30a2",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "13. ADR 0032 Multi-Role Team Harness",
      "0032 Implementation Sequence"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-175"
}
```

## Entry decisions-176

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-second.json",
  "collection": "claims",
  "claimId": "claim_963bf3272df983c42aead0351a429ce4",
  "before": {
    "claimId": "claim_963bf3272df983c42aead0351a429ce4",
    "sourceUnitDigest": "7d8d4de935f8bf82",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "0032-marketing-cockpit-comparison-conclusion",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "Source H4 \"V. Kết luận so sánh marketing-cockpit ...\" is carried as H3 \"0032 Marketing Cockpit Comparison Conclusion\"; title translated. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "8a71adf68dd932df92f4e48b38dabd720531a798392f3d046c521c0cfb7ef4b7",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "13. ADR 0032 Multi-Role Team Harness"
    ]
  },
  "after": {
    "claimId": "claim_963bf3272df983c42aead0351a429ce4",
    "sourceUnitDigest": "7d8d4de935f8bf82",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "0032-marketing-cockpit-comparison-conclusion",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Source H4 \"V. Kết luận so sánh marketing-cockpit ...\" is carried as H3 \"0032 Marketing Cockpit Comparison Conclusion\"; title translated. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading unit \"V. Kết luận so sánh marketing-cockpit (vòng fa\" becomes \"0032 Marketing Cockpit Comparison Conclusion\", every line after the heading line is byte-equal (1203 chars), so only title and level differ as the rationale says; anchor and target digest unchanged from the reviewed binding, shard equals pack",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "8a71adf68dd932df92f4e48b38dabd720531a798392f3d046c521c0cfb7ef4b7",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "13. ADR 0032 Multi-Role Team Harness"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_963bf3272df983c42aead0351a429ce4",
    "sourceUnitDigest": "7d8d4de935f8bf82",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "0032-marketing-cockpit-comparison-conclusion",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Source H4 \"V. Kết luận so sánh marketing-cockpit ...\" is carried as H3 \"0032 Marketing Cockpit Comparison Conclusion\"; title translated. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading unit \"V. Kết luận so sánh marketing-cockpit (vòng fa\" becomes \"0032 Marketing Cockpit Comparison Conclusion\", every line after the heading line is byte-equal (1203 chars), so only title and level differ as the rationale says; anchor and target digest unchanged from the reviewed binding, shard equals pack",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "8a71adf68dd932df92f4e48b38dabd720531a798392f3d046c521c0cfb7ef4b7",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "13. ADR 0032 Multi-Role Team Harness"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-176"
}
```

## Entry decisions-177

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-second.json",
  "collection": "claims",
  "claimId": "claim_68304d9e3c8f531fd5dcc25392c6d072",
  "before": {
    "claimId": "claim_68304d9e3c8f531fd5dcc25392c6d072",
    "sourceUnitDigest": "6bfb192eaa61ff2f",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-91",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "ADR 0032 list of what is taken from the cockpit into fgOS; carried verbatim. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "6bfb192eaa61ff2f393e5621a2ccb051f67179a9627e65c6d6fdb53ceb54fe51",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "13. ADR 0032 Multi-Role Team Harness",
      "0032 Marketing Cockpit Comparison Conclusion"
    ]
  },
  "after": {
    "claimId": "claim_68304d9e3c8f531fd5dcc25392c6d072",
    "sourceUnitDigest": "6bfb192eaa61ff2f",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-91",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "ADR 0032 list of what is taken from the cockpit into fgOS; carried verbatim. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: read source and target, 465 chars byte-equal, source sits under \"V. Kết luận so sánh marketing-cock\" and target under \"0032 Marketing Cockpit Comparison \" (translated heading, which is why the exact class is only weak); rationale describes this unit correctly and now says content unchanged; anchor unheaded-block-91 ok, binding unchanged",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "6bfb192eaa61ff2f393e5621a2ccb051f67179a9627e65c6d6fdb53ceb54fe51",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "13. ADR 0032 Multi-Role Team Harness",
      "0032 Marketing Cockpit Comparison Conclusion"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_68304d9e3c8f531fd5dcc25392c6d072",
    "sourceUnitDigest": "6bfb192eaa61ff2f",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-91",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "ADR 0032 list of what is taken from the cockpit into fgOS; carried verbatim. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: read source and target, 465 chars byte-equal, source sits under \"V. Kết luận so sánh marketing-cock\" and target under \"0032 Marketing Cockpit Comparison \" (translated heading, which is why the exact class is only weak); rationale describes this unit correctly and now says content unchanged; anchor unheaded-block-91 ok, binding unchanged",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "6bfb192eaa61ff2f393e5621a2ccb051f67179a9627e65c6d6fdb53ceb54fe51",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "13. ADR 0032 Multi-Role Team Harness",
      "0032 Marketing Cockpit Comparison Conclusion"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-177"
}
```

## Entry decisions-178

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-second.json",
  "collection": "claims",
  "claimId": "claim_8d8de83dcecd115c8b517cbf12d08795",
  "before": {
    "claimId": "claim_8d8de83dcecd115c8b517cbf12d08795",
    "sourceUnitDigest": "a0a6b146892e904d",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-92",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "ADR 0032 four-way split port rule for a cockpit task yaml; carried verbatim. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "a0a6b146892e904d63cafd64b0a130c3c392e0a199fea7a9929b0f2006f7011d",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "13. ADR 0032 Multi-Role Team Harness",
      "0032 Marketing Cockpit Comparison Conclusion"
    ]
  },
  "after": {
    "claimId": "claim_8d8de83dcecd115c8b517cbf12d08795",
    "sourceUnitDigest": "a0a6b146892e904d",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-92",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "ADR 0032 four-way split port rule for a cockpit task yaml; carried verbatim. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: 179 chars byte-equal between source and target by script, ancestry differs only by the translated heading (\"0032 Marketing Cockpit Compari\"), anchor unheaded-block-92 ok, digest and shard to pack equal, binding unchanged from the reviewed state; text not read line by line",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "a0a6b146892e904d63cafd64b0a130c3c392e0a199fea7a9929b0f2006f7011d",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "13. ADR 0032 Multi-Role Team Harness",
      "0032 Marketing Cockpit Comparison Conclusion"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_8d8de83dcecd115c8b517cbf12d08795",
    "sourceUnitDigest": "a0a6b146892e904d",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-92",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "ADR 0032 four-way split port rule for a cockpit task yaml; carried verbatim. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: 179 chars byte-equal between source and target by script, ancestry differs only by the translated heading (\"0032 Marketing Cockpit Compari\"), anchor unheaded-block-92 ok, digest and shard to pack equal, binding unchanged from the reviewed state; text not read line by line",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "a0a6b146892e904d63cafd64b0a130c3c392e0a199fea7a9929b0f2006f7011d",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "13. ADR 0032 Multi-Role Team Harness",
      "0032 Marketing Cockpit Comparison Conclusion"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-178"
}
```

## Entry decisions-179

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-second.json",
  "collection": "claims",
  "claimId": "claim_331e9d0a3a7f29b20ec75ed8981f7fb7",
  "before": {
    "claimId": "claim_331e9d0a3a7f29b20ec75ed8981f7fb7",
    "sourceUnitDigest": "b18e4845b71df780",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-93",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "ADR 0032 list of what the cockpit drops on entry; carried verbatim. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "b18e4845b71df780025ec4c6b82b4551cf5916138dff3b17f3153700677909e5",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "13. ADR 0032 Multi-Role Team Harness",
      "0032 Marketing Cockpit Comparison Conclusion"
    ]
  },
  "after": {
    "claimId": "claim_331e9d0a3a7f29b20ec75ed8981f7fb7",
    "sourceUnitDigest": "b18e4845b71df780",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-93",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "ADR 0032 list of what the cockpit drops on entry; carried verbatim. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: read source and target, 554 chars byte-equal, source sits under \"V. Kết luận so sánh marketing-cock\" and target under \"0032 Marketing Cockpit Comparison \" (translated heading, which is why the exact class is only weak); rationale describes this unit correctly and now says content unchanged; anchor unheaded-block-93 ok, binding unchanged",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "b18e4845b71df780025ec4c6b82b4551cf5916138dff3b17f3153700677909e5",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "13. ADR 0032 Multi-Role Team Harness",
      "0032 Marketing Cockpit Comparison Conclusion"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_331e9d0a3a7f29b20ec75ed8981f7fb7",
    "sourceUnitDigest": "b18e4845b71df780",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-93",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "ADR 0032 list of what the cockpit drops on entry; carried verbatim. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: read source and target, 554 chars byte-equal, source sits under \"V. Kết luận so sánh marketing-cock\" and target under \"0032 Marketing Cockpit Comparison \" (translated heading, which is why the exact class is only weak); rationale describes this unit correctly and now says content unchanged; anchor unheaded-block-93 ok, binding unchanged",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "b18e4845b71df780025ec4c6b82b4551cf5916138dff3b17f3153700677909e5",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "13. ADR 0032 Multi-Role Team Harness",
      "0032 Marketing Cockpit Comparison Conclusion"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-179"
}
```

## Entry decisions-180

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-second.json",
  "collection": "claims",
  "claimId": "claim_c696887f984b8248a620d445d341cf0b",
  "before": {
    "claimId": "claim_c696887f984b8248a620d445d341cf0b",
    "sourceUnitDigest": "6c186518993aba9c",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "0032-deliberately-deferred-questions",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "Source H4 \"VI. Treo có chủ đích (không phải quên)\" is carried as H3 \"0032 Deliberately Deferred Questions\"; title translated. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "c71143d4c041f9d8943b66c9a1138bf3ce8e6f108c19234f9872579dc9eca773",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "13. ADR 0032 Multi-Role Team Harness"
    ]
  },
  "after": {
    "claimId": "claim_c696887f984b8248a620d445d341cf0b",
    "sourceUnitDigest": "6c186518993aba9c",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "0032-deliberately-deferred-questions",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Source H4 \"VI. Treo có chủ đích (không phải quên)\" is carried as H3 \"0032 Deliberately Deferred Questions\"; title translated. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading unit \"VI. Treo có chủ đích (không phải quên)\" becomes \"0032 Deliberately Deferred Questions\", every line after the heading line is byte-equal (647 chars), so only title and level differ as the rationale says; anchor and target digest unchanged from the reviewed binding, shard equals pack",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "c71143d4c041f9d8943b66c9a1138bf3ce8e6f108c19234f9872579dc9eca773",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "13. ADR 0032 Multi-Role Team Harness"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_c696887f984b8248a620d445d341cf0b",
    "sourceUnitDigest": "6c186518993aba9c",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "0032-deliberately-deferred-questions",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Source H4 \"VI. Treo có chủ đích (không phải quên)\" is carried as H3 \"0032 Deliberately Deferred Questions\"; title translated. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading unit \"VI. Treo có chủ đích (không phải quên)\" becomes \"0032 Deliberately Deferred Questions\", every line after the heading line is byte-equal (647 chars), so only title and level differ as the rationale says; anchor and target digest unchanged from the reviewed binding, shard equals pack",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "c71143d4c041f9d8943b66c9a1138bf3ce8e6f108c19234f9872579dc9eca773",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "13. ADR 0032 Multi-Role Team Harness"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-180"
}
```

