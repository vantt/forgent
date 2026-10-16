# Bounded re-review: decisions 9

Author session: `codex-session:unit-run-1792093168554-f28af963@2026-10-16`
Packaged by: `codex-session:unit-run-1792116045118-73cfbb42@2026-10-16`
Content commit: `287a22d33a0eaf2d9e47549a1142daf62361bb8c` (author changes at `0d8c602e2`)
Comparison base: `5035fed52e60254ecbe034cc987553feb24616f4`
Entries: **19**; each request at most60 entries and400000 bytes.

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

## Entry decisions-181

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-second.json",
  "collection": "claims",
  "claimId": "claim_092f7d288e8617bb3b8abff586e988f8",
  "before": {
    "claimId": "claim_092f7d288e8617bb3b8abff586e988f8",
    "sourceUnitDigest": "2431462c129b13b9",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-94",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "ADR 0032 numbered list of deliberately deferred questions; carried verbatim. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "2431462c129b13b99afc3b1e18061c825932a166ce50c26248dca7ce2905f946",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "13. ADR 0032 Multi-Role Team Harness",
      "0032 Deliberately Deferred Questions"
    ]
  },
  "after": {
    "claimId": "claim_092f7d288e8617bb3b8abff586e988f8",
    "sourceUnitDigest": "2431462c129b13b9",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-94",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "ADR 0032 numbered list of deliberately deferred questions; carried verbatim. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: 646 chars byte-equal between source and target by script, ancestry differs only by the translated heading (\"0032 Deliberately Deferred Que\"), anchor unheaded-block-94 ok, digest and shard to pack equal, binding unchanged from the reviewed state; text not read line by line",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "2431462c129b13b99afc3b1e18061c825932a166ce50c26248dca7ce2905f946",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "13. ADR 0032 Multi-Role Team Harness",
      "0032 Deliberately Deferred Questions"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_092f7d288e8617bb3b8abff586e988f8",
    "sourceUnitDigest": "2431462c129b13b9",
    "targetOwner": "docs/platform/work-state/decisions/retired-decision-history.md",
    "targetAnchor": "unheaded-block-94",
    "claimKind": "decision",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "ADR 0032 numbered list of deliberately deferred questions; carried verbatim. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: 646 chars byte-equal between source and target by script, ancestry differs only by the translated heading (\"0032 Deliberately Deferred Que\"), anchor unheaded-block-94 ok, digest and shard to pack equal, binding unchanged from the reviewed state; text not read line by line",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "2431462c129b13b99afc3b1e18061c825932a166ce50c26248dca7ce2905f946",
    "targetAncestry": [
      "Retired Decision History: Work State",
      "13. ADR 0032 Multi-Role Team Harness",
      "0032 Deliberately Deferred Questions"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-181"
}
```

## Entry decisions-182

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-second.json",
  "collection": "claims",
  "claimId": "claim_cf9060b6664b21d6e5fac0b31aac0ff6",
  "before": {
    "claimId": "claim_cf9060b6664b21d6e5fac0b31aac0ff6",
    "sourceUnitDigest": "a88af4784f074e4e",
    "targetOwner": "docs/platform/work-state/history/multi-role-harness-distill-record.md",
    "targetAnchor": "3-state-at-distill-time",
    "claimKind": "historical-context",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "Source H4 \"VII. Trạng thái tại thời điểm distill (2026-08-15)\" is carried as H2 \"3. State At Distill Time\" in the history document; dated snapshot, title differs. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "dda4c28cba5f1a13d782c50c996bc50d5848d6d8172ecb38066a23e8e1c19023",
    "targetAncestry": [
      "Multi-Role Harness Distill Record"
    ]
  },
  "after": {
    "claimId": "claim_cf9060b6664b21d6e5fac0b31aac0ff6",
    "sourceUnitDigest": "a88af4784f074e4e",
    "targetOwner": "docs/platform/work-state/history/multi-role-harness-distill-record.md",
    "targetAnchor": "3-state-at-distill-time",
    "claimKind": "historical-context",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Source H4 \"VII. Trạng thái tại thời điểm distill (2026-08-15)\" is carried as H2 \"3. State At Distill Time\" in the history document; dated snapshot, title differs. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading unit \"VII. Trạng thái tại thời điểm distill (2026-08\" becomes \"3. State At Distill Time\", every line after the heading line is byte-equal (898 chars), so only title and level differ as the rationale says; anchor and target digest unchanged from the reviewed binding, shard equals pack",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "dda4c28cba5f1a13d782c50c996bc50d5848d6d8172ecb38066a23e8e1c19023",
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
    "claimId": "claim_cf9060b6664b21d6e5fac0b31aac0ff6",
    "sourceUnitDigest": "a88af4784f074e4e",
    "targetOwner": "docs/platform/work-state/history/multi-role-harness-distill-record.md",
    "targetAnchor": "3-state-at-distill-time",
    "claimKind": "historical-context",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Source H4 \"VII. Trạng thái tại thời điểm distill (2026-08-15)\" is carried as H2 \"3. State At Distill Time\" in the history document; dated snapshot, title differs. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading unit \"VII. Trạng thái tại thời điểm distill (2026-08\" becomes \"3. State At Distill Time\", every line after the heading line is byte-equal (898 chars), so only title and level differ as the rationale says; anchor and target digest unchanged from the reviewed binding, shard equals pack",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "dda4c28cba5f1a13d782c50c996bc50d5848d6d8172ecb38066a23e8e1c19023",
    "targetAncestry": [
      "Multi-Role Harness Distill Record"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-182"
}
```

## Entry decisions-183

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-second.json",
  "collection": "claims",
  "claimId": "claim_be0cd74b4a0bd4c5860e9116aa8dd6c6",
  "before": {
    "claimId": "claim_be0cd74b4a0bd4c5860e9116aa8dd6c6",
    "sourceUnitDigest": "09bb0ef5d78c9357",
    "targetOwner": "docs/platform/work-state/history/multi-role-harness-distill-record.md",
    "targetAnchor": "unheaded-block-4",
    "claimKind": "historical-context",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "Dated state-at-distill list (validating finished, reality gate 6/6); carried verbatim into the history document as historical-context. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "09bb0ef5d78c9357cc67cc5622d215a494f8bcc8948a9b11a6287dd110b2fce9",
    "targetAncestry": [
      "Multi-Role Harness Distill Record",
      "3. State At Distill Time"
    ]
  },
  "after": {
    "claimId": "claim_be0cd74b4a0bd4c5860e9116aa8dd6c6",
    "sourceUnitDigest": "09bb0ef5d78c9357",
    "targetOwner": "docs/platform/work-state/history/multi-role-harness-distill-record.md",
    "targetAnchor": "unheaded-block-4",
    "claimKind": "historical-context",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Dated state-at-distill list (validating finished, reality gate 6/6); carried verbatim into the history document as historical-context. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: read source and target, 897 chars byte-equal, source sits under \"VII. Trạng thái tại thời điểm dist\" and target under \"3. State At Distill Time\" (translated heading, which is why the exact class is only weak); rationale describes this unit correctly and now says content unchanged; anchor unheaded-block-4 ok, binding unchanged",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "09bb0ef5d78c9357cc67cc5622d215a494f8bcc8948a9b11a6287dd110b2fce9",
    "targetAncestry": [
      "Multi-Role Harness Distill Record",
      "3. State At Distill Time"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_be0cd74b4a0bd4c5860e9116aa8dd6c6",
    "sourceUnitDigest": "09bb0ef5d78c9357",
    "targetOwner": "docs/platform/work-state/history/multi-role-harness-distill-record.md",
    "targetAnchor": "unheaded-block-4",
    "claimKind": "historical-context",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Dated state-at-distill list (validating finished, reality gate 6/6); carried verbatim into the history document as historical-context. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: read source and target, 897 chars byte-equal, source sits under \"VII. Trạng thái tại thời điểm dist\" and target under \"3. State At Distill Time\" (translated heading, which is why the exact class is only weak); rationale describes this unit correctly and now says content unchanged; anchor unheaded-block-4 ok, binding unchanged",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "09bb0ef5d78c9357cc67cc5622d215a494f8bcc8948a9b11a6287dd110b2fce9",
    "targetAncestry": [
      "Multi-Role Harness Distill Record",
      "3. State At Distill Time"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-183"
}
```

## Entry decisions-184

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-second.json",
  "collection": "claims",
  "claimId": "claim_581643ec8243af5744e04c222f13c214",
  "before": {
    "claimId": "claim_581643ec8243af5744e04c222f13c214",
    "sourceUnitDigest": "a143984b5d286e28",
    "targetOwner": "docs/platform/work-state/history/multi-role-harness-distill-record.md",
    "targetAnchor": "4-implementation-review-and-verification-after-distill",
    "claimKind": "historical-context",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "Source H4 \"VIII. Sau distill ...\" is carried as H2 \"4. Implementation Review And Verification After Distill\"; dated section, title translated. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "a88add6a18b0023671d9f83c9261dfd52d1440fd05936db3be3acd430adb0b11",
    "targetAncestry": [
      "Multi-Role Harness Distill Record"
    ]
  },
  "after": {
    "claimId": "claim_581643ec8243af5744e04c222f13c214",
    "sourceUnitDigest": "a143984b5d286e28",
    "targetOwner": "docs/platform/work-state/history/multi-role-harness-distill-record.md",
    "targetAnchor": "4-implementation-review-and-verification-after-distill",
    "claimKind": "historical-context",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Source H4 \"VIII. Sau distill ...\" is carried as H2 \"4. Implementation Review And Verification After Distill\"; dated section, title translated. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading unit \"VIII. Sau distill — implement, review độc lập,\" becomes \"4. Implementation Review And Verification After Dist\", every line after the heading line is byte-equal (2379 chars), so only title and level differ as the rationale says; anchor and target digest unchanged from the reviewed binding, shard equals pack",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "a88add6a18b0023671d9f83c9261dfd52d1440fd05936db3be3acd430adb0b11",
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
    "claimId": "claim_581643ec8243af5744e04c222f13c214",
    "sourceUnitDigest": "a143984b5d286e28",
    "targetOwner": "docs/platform/work-state/history/multi-role-harness-distill-record.md",
    "targetAnchor": "4-implementation-review-and-verification-after-distill",
    "claimKind": "historical-context",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Source H4 \"VIII. Sau distill ...\" is carried as H2 \"4. Implementation Review And Verification After Distill\"; dated section, title translated. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: heading unit \"VIII. Sau distill — implement, review độc lập,\" becomes \"4. Implementation Review And Verification After Dist\", every line after the heading line is byte-equal (2379 chars), so only title and level differ as the rationale says; anchor and target digest unchanged from the reviewed binding, shard equals pack",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "a88add6a18b0023671d9f83c9261dfd52d1440fd05936db3be3acd430adb0b11",
    "targetAncestry": [
      "Multi-Role Harness Distill Record"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-184"
}
```

## Entry decisions-185

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-second.json",
  "collection": "claims",
  "claimId": "claim_690988881136792349476d55b83bd81d",
  "before": {
    "claimId": "claim_690988881136792349476d55b83bd81d",
    "sourceUnitDigest": "721cb9fe837087d2",
    "targetOwner": "docs/platform/work-state/history/multi-role-harness-distill-record.md",
    "targetAnchor": "unheaded-block-5",
    "claimKind": "historical-context",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "Note that this section was not in the original distill and was added when copying to docs/decisions; carried verbatim. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "721cb9fe837087d22e83ba6ac1761a6cf9c628a88e0445f49dd1bd26943a8ec9",
    "targetAncestry": [
      "Multi-Role Harness Distill Record",
      "4. Implementation Review And Verification After Distill"
    ]
  },
  "after": {
    "claimId": "claim_690988881136792349476d55b83bd81d",
    "sourceUnitDigest": "721cb9fe837087d2",
    "targetOwner": "docs/platform/work-state/history/multi-role-harness-distill-record.md",
    "targetAnchor": "unheaded-block-5",
    "claimKind": "historical-context",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Note that this section was not in the original distill and was added when copying to docs/decisions; carried verbatim. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: read source and target, 299 chars byte-equal, source sits under \"VIII. Sau distill — implement, rev\" and target under \"4. Implementation Review And Verif\" (translated heading, which is why the exact class is only weak); rationale describes this unit correctly and now says content unchanged; anchor unheaded-block-5 ok, binding unchanged",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "721cb9fe837087d22e83ba6ac1761a6cf9c628a88e0445f49dd1bd26943a8ec9",
    "targetAncestry": [
      "Multi-Role Harness Distill Record",
      "4. Implementation Review And Verification After Distill"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_690988881136792349476d55b83bd81d",
    "sourceUnitDigest": "721cb9fe837087d2",
    "targetOwner": "docs/platform/work-state/history/multi-role-harness-distill-record.md",
    "targetAnchor": "unheaded-block-5",
    "claimKind": "historical-context",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Note that this section was not in the original distill and was added when copying to docs/decisions; carried verbatim. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "deep: read source and target, 299 chars byte-equal, source sits under \"VIII. Sau distill — implement, rev\" and target under \"4. Implementation Review And Verif\" (translated heading, which is why the exact class is only weak); rationale describes this unit correctly and now says content unchanged; anchor unheaded-block-5 ok, binding unchanged",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "721cb9fe837087d22e83ba6ac1761a6cf9c628a88e0445f49dd1bd26943a8ec9",
    "targetAncestry": [
      "Multi-Role Harness Distill Record",
      "4. Implementation Review And Verification After Distill"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-185"
}
```

## Entry decisions-186

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-second.json",
  "collection": "claims",
  "claimId": "claim_e24e9588d1d0d0ec87a1a90db87e62b9",
  "before": {
    "claimId": "claim_e24e9588d1d0d0ec87a1a90db87e62b9",
    "sourceUnitDigest": "42f0a4f36be3f872",
    "targetOwner": "docs/platform/work-state/history/multi-role-harness-distill-record.md",
    "targetAnchor": "unheaded-block-6",
    "claimKind": "historical-context",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "Paragraph on the three pieces implemented, tested, self-reviewed and committed sequentially; carried verbatim. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "42f0a4f36be3f8722adbd5bc7066fc539bd31e67484940ec1c0e7f3c6a0d7cb8",
    "targetAncestry": [
      "Multi-Role Harness Distill Record",
      "4. Implementation Review And Verification After Distill"
    ]
  },
  "after": {
    "claimId": "claim_e24e9588d1d0d0ec87a1a90db87e62b9",
    "sourceUnitDigest": "42f0a4f36be3f872",
    "targetOwner": "docs/platform/work-state/history/multi-role-harness-distill-record.md",
    "targetAnchor": "unheaded-block-6",
    "claimKind": "historical-context",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Paragraph on the three pieces implemented, tested, self-reviewed and committed sequentially; carried verbatim. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: 185 chars byte-equal between source and target by script, ancestry differs only by the translated heading (\"4. Implementation Review And V\"), anchor unheaded-block-6 ok, digest and shard to pack equal, binding unchanged from the reviewed state; text not read line by line",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "42f0a4f36be3f8722adbd5bc7066fc539bd31e67484940ec1c0e7f3c6a0d7cb8",
    "targetAncestry": [
      "Multi-Role Harness Distill Record",
      "4. Implementation Review And Verification After Distill"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_e24e9588d1d0d0ec87a1a90db87e62b9",
    "sourceUnitDigest": "42f0a4f36be3f872",
    "targetOwner": "docs/platform/work-state/history/multi-role-harness-distill-record.md",
    "targetAnchor": "unheaded-block-6",
    "claimKind": "historical-context",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Paragraph on the three pieces implemented, tested, self-reviewed and committed sequentially; carried verbatim. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: 185 chars byte-equal between source and target by script, ancestry differs only by the translated heading (\"4. Implementation Review And V\"), anchor unheaded-block-6 ok, digest and shard to pack equal, binding unchanged from the reviewed state; text not read line by line",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "42f0a4f36be3f8722adbd5bc7066fc539bd31e67484940ec1c0e7f3c6a0d7cb8",
    "targetAncestry": [
      "Multi-Role Harness Distill Record",
      "4. Implementation Review And Verification After Distill"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-186"
}
```

## Entry decisions-187

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-second.json",
  "collection": "claims",
  "claimId": "claim_6866da75d153e251a298ec889e5e67f8",
  "before": {
    "claimId": "claim_6866da75d153e251a298ec889e5e67f8",
    "sourceUnitDigest": "0ce476ffc3451d8e",
    "targetOwner": "docs/platform/work-state/history/multi-role-harness-distill-record.md",
    "targetAnchor": "unheaded-block-7",
    "claimKind": "historical-context",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "Long post-distill list (real handoff wiring, independent review, real verify); 22 lines carried verbatim. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "0ce476ffc3451d8e11c1e2c4c802eb70edf96b3e83627708fa309fbfba167bde",
    "targetAncestry": [
      "Multi-Role Harness Distill Record",
      "4. Implementation Review And Verification After Distill"
    ]
  },
  "after": {
    "claimId": "claim_6866da75d153e251a298ec889e5e67f8",
    "sourceUnitDigest": "0ce476ffc3451d8e",
    "targetOwner": "docs/platform/work-state/history/multi-role-harness-distill-record.md",
    "targetAnchor": "unheaded-block-7",
    "claimKind": "historical-context",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Long post-distill list (real handoff wiring, independent review, real verify); 22 lines carried verbatim. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: 1485 chars byte-equal between source and target by script, ancestry differs only by the translated heading (\"4. Implementation Review And V\"), anchor unheaded-block-7 ok, digest and shard to pack equal, binding unchanged from the reviewed state; text not read line by line",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "0ce476ffc3451d8e11c1e2c4c802eb70edf96b3e83627708fa309fbfba167bde",
    "targetAncestry": [
      "Multi-Role Harness Distill Record",
      "4. Implementation Review And Verification After Distill"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_6866da75d153e251a298ec889e5e67f8",
    "sourceUnitDigest": "0ce476ffc3451d8e",
    "targetOwner": "docs/platform/work-state/history/multi-role-harness-distill-record.md",
    "targetAnchor": "unheaded-block-7",
    "claimKind": "historical-context",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Long post-distill list (real handoff wiring, independent review, real verify); 22 lines carried verbatim. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: 1485 chars byte-equal between source and target by script, ancestry differs only by the translated heading (\"4. Implementation Review And V\"), anchor unheaded-block-7 ok, digest and shard to pack equal, binding unchanged from the reviewed state; text not read line by line",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "0ce476ffc3451d8e11c1e2c4c802eb70edf96b3e83627708fa309fbfba167bde",
    "targetAncestry": [
      "Multi-Role Harness Distill Record",
      "4. Implementation Review And Verification After Distill"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-187"
}
```

## Entry decisions-188

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-decisions-second.json",
  "collection": "claims",
  "claimId": "claim_48a16587298cde876c7142378489c618",
  "before": {
    "claimId": "claim_48a16587298cde876c7142378489c618",
    "sourceUnitDigest": "71b2516db6bbf541",
    "targetOwner": "docs/platform/work-state/history/multi-role-harness-distill-record.md",
    "targetAnchor": "unheaded-block-8",
    "claimKind": "historical-context",
    "disposition": "promote",
    "reviewStatus": "pending",
    "rationale": "Closing lesson paragraph of the post-distill section (unit/integration tests prove engine, not real run); carried verbatim. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "targetUnitDigest": "71b2516db6bbf541250e88bbb627868772f01e932ba697f12b1bafa46adc00fc",
    "targetAncestry": [
      "Multi-Role Harness Distill Record",
      "4. Implementation Review And Verification After Distill"
    ]
  },
  "after": {
    "claimId": "claim_48a16587298cde876c7142378489c618",
    "sourceUnitDigest": "71b2516db6bbf541",
    "targetOwner": "docs/platform/work-state/history/multi-role-harness-distill-record.md",
    "targetAnchor": "unheaded-block-8",
    "claimKind": "historical-context",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Closing lesson paragraph of the post-distill section (unit/integration tests prove engine, not real run); carried verbatim. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: 403 chars byte-equal between source and target by script, ancestry differs only by the translated heading (\"4. Implementation Review And V\"), anchor unheaded-block-8 ok, digest and shard to pack equal, binding unchanged from the reviewed state; text not read line by line",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "71b2516db6bbf541250e88bbb627868772f01e932ba697f12b1bafa46adc00fc",
    "targetAncestry": [
      "Multi-Role Harness Distill Record",
      "4. Implementation Review And Verification After Distill"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_48a16587298cde876c7142378489c618",
    "sourceUnitDigest": "71b2516db6bbf541",
    "targetOwner": "docs/platform/work-state/history/multi-role-harness-distill-record.md",
    "targetAnchor": "unheaded-block-8",
    "claimKind": "historical-context",
    "disposition": "promote",
    "reviewStatus": "reviewed",
    "rationale": "Closing lesson paragraph of the post-distill section (unit/integration tests prove engine, not real run); carried verbatim. Target digest expanded to full SHA256; source and target content are unchanged.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "reviewNote": "mechanical: 403 chars byte-equal between source and target by script, ancestry differs only by the translated heading (\"4. Implementation Review And V\"), anchor unheaded-block-8 ok, digest and shard to pack equal, binding unchanged from the reviewed state; text not read line by line",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "71b2516db6bbf541250e88bbb627868772f01e932ba697f12b1bafa46adc00fc",
    "targetAncestry": [
      "Multi-Role Harness Distill Record",
      "4. Implementation Review And Verification After Distill"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-188"
}
```

## Entry decisions-189

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-io-contract.json",
  "collection": "claims",
  "claimId": "claim_51848961a2bbf93d37bc2b46d9f141f5",
  "before": {
    "claimId": "claim_51848961a2bbf93d37bc2b46d9f141f5",
    "sourcePath": "docs/io-contract.md",
    "sourceAnchor": "chiều-vào-verb-danh-tính",
    "sourceUnitDigest": "a8638afcbc30af3cfed8ddecb38f890e54215f551afcbd9a9d09d23c02d8bce3",
    "claimKind": "specification",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "rationale": "Heading translated and renumbered: “Chiều vào — verb + danh tính” becomes “2. Input Direction Verb And Identity”. Its forty-line direct source body is carried under new H3 subsections, each body unit has its own decision row. Heading and section digests differ because of translation, numbering and structural relocation, in addition to the disclosed Session Identity relative link rebase. Native identity resolved at 19ca8de23; no provisional identity, source retirement, authority flip or truth approval.",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "2-input-direction-verb-and-identity",
    "targetUnitDigest": "7c4e0214ec4c8c108c24c1b00a560516fbc5de0bc1a26d70a082eca5ccafb23c",
    "targetAncestry": [
      "CLI I/O Contract"
    ]
  },
  "after": {
    "claimId": "claim_51848961a2bbf93d37bc2b46d9f141f5",
    "sourcePath": "docs/io-contract.md",
    "sourceAnchor": "chiều-vào-verb-danh-tính",
    "sourceUnitDigest": "a8638afcbc30af3cfed8ddecb38f890e54215f551afcbd9a9d09d23c02d8bce3",
    "claimKind": "specification",
    "disposition": "supersede",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "rationale": "Heading translated and renumbered: “Chiều vào — verb + danh tính” becomes “2. Input Direction Verb And Identity”. Its forty-line direct source body is carried under new H3 subsections, each body unit has its own decision row. Heading and section digests differ because of translation, numbering and structural relocation, in addition to the disclosed Session Identity relative link rebase. Native identity resolved at 19ca8de23; no provisional identity, source retirement, authority flip or truth approval.",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "2-input-direction-verb-and-identity",
    "reviewNote": "deep: heading \"Chieu vao\" translated and renumbered to \"2. Input Direction Verb And Identity\"; all 32 non-blank body lines of the source section are found verbatim under the H3 subsections of cli-io-contract.md section 2, the only absent line is the Session Identity bullet whose relative link was rebased as the rationale discloses; binding unchanged from the reviewed state (same anchor and digest), rationale now truthful (previous rework answered)",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "7c4e0214ec4c8c108c24c1b00a560516fbc5de0bc1a26d70a082eca5ccafb23c",
    "targetAncestry": [
      "CLI I/O Contract"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_51848961a2bbf93d37bc2b46d9f141f5",
    "sourcePath": "docs/io-contract.md",
    "sourceAnchor": "chiều-vào-verb-danh-tính",
    "sourceUnitDigest": "a8638afcbc30af3cfed8ddecb38f890e54215f551afcbd9a9d09d23c02d8bce3",
    "claimKind": "specification",
    "disposition": "supersede",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "rationale": "Heading translated and renumbered: “Chiều vào — verb + danh tính” becomes “2. Input Direction Verb And Identity”. Its forty-line direct source body is carried under new H3 subsections, each body unit has its own decision row. Heading and section digests differ because of translation, numbering and structural relocation, in addition to the disclosed Session Identity relative link rebase. Native identity resolved at 19ca8de23; no provisional identity, source retirement, authority flip or truth approval.",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "2-input-direction-verb-and-identity",
    "reviewNote": "deep: heading \"Chieu vao\" translated and renumbered to \"2. Input Direction Verb And Identity\"; all 32 non-blank body lines of the source section are found verbatim under the H3 subsections of cli-io-contract.md section 2, the only absent line is the Session Identity bullet whose relative link was rebased as the rationale discloses; binding unchanged from the reviewed state (same anchor and digest), rationale now truthful (previous rework answered)",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "7c4e0214ec4c8c108c24c1b00a560516fbc5de0bc1a26d70a082eca5ccafb23c",
    "targetAncestry": [
      "CLI I/O Contract"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-189"
}
```

## Entry decisions-191

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-io-contract.json",
  "collection": "registryGaps",
  "claimId": "claim_e2377849e4ba8e3d3beaf70880e4ed23",
  "before": {
    "claimId": "claim_e2377849e4ba8e3d3beaf70880e4ed23",
    "sourceUnitDigest": "39e4ab1f30a6acc99de534a9fd16bd348b9ef8c1827664c0a7a50487f0587c0c",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-35",
    "claimKind": "contract",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "rationale": "Supersede: current entry-field bullets drop coordination from the externalEffect examples, add the fifteen-verb list and add the subcommands bullet. Complete successor is cli-io-contract.md#unheaded-block-35 after the installation-error insertion. No historical-source byte-equality or approval carry.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "sourcePath": "docs/io-contract.md",
    "sourceAnchor": "unheaded-block-19",
    "targetUnitDigest": "e013c5b05d6ff58782aa8231ab4a55967bd5ef853dac4015aec8f16f5fcf9c68",
    "targetAncestry": [
      "CLI I/O Contract",
      "7. Machine-Readable Verb Registry",
      "Entry Fields And Effect Axes"
    ]
  },
  "after": {
    "claimId": "claim_e2377849e4ba8e3d3beaf70880e4ed23",
    "sourceUnitDigest": "39e4ab1f30a6acc99de534a9fd16bd348b9ef8c1827664c0a7a50487f0587c0c",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-35",
    "claimKind": "contract",
    "disposition": "supersede",
    "reviewStatus": "reviewed",
    "rationale": "Supersede: current entry-field bullets drop coordination from the externalEffect examples, add the fifteen-verb list and add the subcommands bullet. Complete successor is cli-io-contract.md#unheaded-block-35 after the installation-error insertion. No historical-source byte-equality or approval carry.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "sourcePath": "docs/io-contract.md",
    "sourceAnchor": "unheaded-block-19",
    "reviewNote": "deep: successor binding verified, reviewed digest e013c5b0 sat at unheaded-block-34 at 2300d6557 and is now at unheaded-block-35; diff source to target is exactly what the rationale lists (coordination dropped from the externalEffect examples, fifteen-verb list, run example, new subcommands bullet); rationale is specific and clean, previous stale-anchor rework answered",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "e013c5b05d6ff58782aa8231ab4a55967bd5ef853dac4015aec8f16f5fcf9c68",
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
    "claimId": "claim_e2377849e4ba8e3d3beaf70880e4ed23",
    "sourceUnitDigest": "39e4ab1f30a6acc99de534a9fd16bd348b9ef8c1827664c0a7a50487f0587c0c",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-35",
    "claimKind": "contract",
    "disposition": "supersede",
    "reviewStatus": "reviewed",
    "rationale": "Supersede: current entry-field bullets drop coordination from the externalEffect examples, add the fifteen-verb list and add the subcommands bullet. Complete successor is cli-io-contract.md#unheaded-block-35 after the installation-error insertion. No historical-source byte-equality or approval carry.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "sourcePath": "docs/io-contract.md",
    "sourceAnchor": "unheaded-block-19",
    "reviewNote": "deep: successor binding verified, reviewed digest e013c5b0 sat at unheaded-block-34 at 2300d6557 and is now at unheaded-block-35; diff source to target is exactly what the rationale lists (coordination dropped from the externalEffect examples, fifteen-verb list, run example, new subcommands bullet); rationale is specific and clean, previous stale-anchor rework answered",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "e013c5b05d6ff58782aa8231ab4a55967bd5ef853dac4015aec8f16f5fcf9c68",
    "targetAncestry": [
      "CLI I/O Contract",
      "7. Machine-Readable Verb Registry",
      "Entry Fields And Effect Axes"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-191"
}
```

## Entry decisions-192

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-io-contract.json",
  "collection": "registryGaps",
  "claimId": "claim_2fa062c56cf4226e8519e768a5b5cab4",
  "before": {
    "claimId": "claim_2fa062c56cf4226e8519e768a5b5cab4",
    "sourceUnitDigest": "3727b3fa0ee79f8b0b38d0e9fc868e336e85f10e12f7dbd47a34d140f3681127",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-23",
    "claimKind": "contract",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "rationale": "Supersede: EXIT_CODES successor adds OUTCOME_EXIT_CODES, exit 4 not-found, and ok/pass outcome mapping. Complete successor is cli-io-contract.md#unheaded-block-23 after the installation-error insertion. No historical-source byte-equality or approval carry.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "sourcePath": "docs/io-contract.md",
    "targetUnitDigest": "d1af2d5a982f5d139fda776a23b4ad0b3776cc40c1fc0177636c44bdc91b968d",
    "targetAncestry": [
      "CLI I/O Contract",
      "4. Exit Codes"
    ]
  },
  "after": {
    "claimId": "claim_2fa062c56cf4226e8519e768a5b5cab4",
    "sourceUnitDigest": "3727b3fa0ee79f8b0b38d0e9fc868e336e85f10e12f7dbd47a34d140f3681127",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-23",
    "claimKind": "contract",
    "disposition": "supersede",
    "reviewStatus": "reviewed",
    "rationale": "Supersede: EXIT_CODES successor adds OUTCOME_EXIT_CODES, exit 4 not-found, and ok/pass outcome mapping. Complete successor is cli-io-contract.md#unheaded-block-23 after the installation-error insertion. No historical-source byte-equality or approval carry.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "sourcePath": "docs/io-contract.md",
    "reviewNote": "deep: successor binding verified, reviewed digest d1af2d5a sat at unheaded-block-22 at 2300d6557 and is now at unheaded-block-23; diff is exactly the OUTCOME_EXIT_CODES list, exit 4 not-found and ok / pass mapping the rationale names; rationale clean, previous stale-anchor rework answered",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "d1af2d5a982f5d139fda776a23b4ad0b3776cc40c1fc0177636c44bdc91b968d",
    "targetAncestry": [
      "CLI I/O Contract",
      "4. Exit Codes"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_2fa062c56cf4226e8519e768a5b5cab4",
    "sourceUnitDigest": "3727b3fa0ee79f8b0b38d0e9fc868e336e85f10e12f7dbd47a34d140f3681127",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-23",
    "claimKind": "contract",
    "disposition": "supersede",
    "reviewStatus": "reviewed",
    "rationale": "Supersede: EXIT_CODES successor adds OUTCOME_EXIT_CODES, exit 4 not-found, and ok/pass outcome mapping. Complete successor is cli-io-contract.md#unheaded-block-23 after the installation-error insertion. No historical-source byte-equality or approval carry.",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "sourcePath": "docs/io-contract.md",
    "reviewNote": "deep: successor binding verified, reviewed digest d1af2d5a sat at unheaded-block-22 at 2300d6557 and is now at unheaded-block-23; diff is exactly the OUTCOME_EXIT_CODES list, exit 4 not-found and ok / pass mapping the rationale names; rationale clean, previous stale-anchor rework answered",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "d1af2d5a982f5d139fda776a23b4ad0b3776cc40c1fc0177636c44bdc91b968d",
    "targetAncestry": [
      "CLI I/O Contract",
      "4. Exit Codes"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-192"
}
```

## Entry decisions-208

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s10-closing-instructions.json",
  "collection": "claims",
  "claimId": "claim_ccf1acf857fc4e9757a933ca22ed34f1",
  "before": {
    "claimId": "claim_ccf1acf857fc4e9757a933ca22ed34f1",
    "sourcePath": "AGENTS.md",
    "sourceAnchor": "legacy-node-cli-ownership-boundary",
    "sourceUnitDigest": "fed79e2e75d57ab326d97e74e6b2cd4b8fd1474aa6df3abb284ae2bb6d46f817",
    "claimKind": "navigation",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "rationale": "Retain in place outside platform documentation authority: AGENTS.md#legacy-node-cli-ownership-boundary, source unit SHA256 fed79e2e75d57ab326d97e74e6b2cd4b8fd1474aa6df3abb284ae2bb6d46f817, source file SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f at 19ca8de23. The root instruction/navigation file remains its existing owner. No mapped platform target or platform copy is claimed. Native identity resolved at 19ca8de23; historical predecessors remain separately accounted. Pending independent review; no authority flip or truth certificate."
  },
  "after": {
    "claimId": "claim_ccf1acf857fc4e9757a933ca22ed34f1",
    "sourcePath": "AGENTS.md",
    "sourceAnchor": "legacy-node-cli-ownership-boundary",
    "sourceUnitDigest": "fed79e2e75d57ab326d97e74e6b2cd4b8fd1474aa6df3abb284ae2bb6d46f817",
    "claimKind": "navigation",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "rationale": "Retain in place outside platform documentation authority: AGENTS.md#legacy-node-cli-ownership-boundary, source unit SHA256 fed79e2e75d57ab326d97e74e6b2cd4b8fd1474aa6df3abb284ae2bb6d46f817, source file SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f at 19ca8de23. The root instruction/navigation file remains its existing owner. No mapped platform target or platform copy is claimed. Native identity resolved at 19ca8de23; historical predecessors remain separately accounted. Pending independent review; no authority flip or truth certificate.",
    "reviewNote": "deep: retain-in-place row with no target, AGENTS.md is byte-identical to 19ca8de23 and to the pin (sha256 47f3a4e5...), unit digest fed79e2e recomputed equal and quoted in the rationale, anchor ok; the rationale no longer claims a candidate carry (previous rework answered); read the unit text, it is the Legacy-Node CLI Ownership Boundary section the rationale names",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_ccf1acf857fc4e9757a933ca22ed34f1",
    "sourcePath": "AGENTS.md",
    "sourceAnchor": "legacy-node-cli-ownership-boundary",
    "sourceUnitDigest": "fed79e2e75d57ab326d97e74e6b2cd4b8fd1474aa6df3abb284ae2bb6d46f817",
    "claimKind": "navigation",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "rationale": "Retain in place outside platform documentation authority: AGENTS.md#legacy-node-cli-ownership-boundary, source unit SHA256 fed79e2e75d57ab326d97e74e6b2cd4b8fd1474aa6df3abb284ae2bb6d46f817, source file SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f at 19ca8de23. The root instruction/navigation file remains its existing owner. No mapped platform target or platform copy is claimed. Native identity resolved at 19ca8de23; historical predecessors remain separately accounted. Pending independent review; no authority flip or truth certificate.",
    "reviewNote": "deep: retain-in-place row with no target, AGENTS.md is byte-identical to 19ca8de23 and to the pin (sha256 47f3a4e5...), unit digest fed79e2e recomputed equal and quoted in the rationale, anchor ok; the rationale no longer claims a candidate carry (previous rework answered); read the unit text, it is the Legacy-Node CLI Ownership Boundary section the rationale names",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-208"
}
```

## Entry decisions-272

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s10-closing-instructions.json",
  "collection": "claims",
  "claimId": "claim_c328f1aab4c53a87e5564dab101facf2",
  "before": {
    "claimId": "claim_c328f1aab4c53a87e5564dab101facf2",
    "sourcePath": "AGENTS.md",
    "sourceAnchor": "unheaded-block-14",
    "sourceUnitDigest": "e3c0146e4d7a42d364c551fcb327b9ab9faef893cfe3b6075a4e658836d69972",
    "claimKind": "navigation",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "rationale": "Retain in place outside platform documentation authority: AGENTS.md#unheaded-block-14, source unit SHA256 e3c0146e4d7a42d364c551fcb327b9ab9faef893cfe3b6075a4e658836d69972, source file SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f at 19ca8de23. The root instruction/navigation file remains its existing owner. No mapped platform target or platform copy is claimed. Native identity resolved at 19ca8de23; historical predecessors remain separately accounted. Pending independent review; no authority flip or truth certificate."
  },
  "after": {
    "claimId": "claim_c328f1aab4c53a87e5564dab101facf2",
    "sourcePath": "AGENTS.md",
    "sourceAnchor": "unheaded-block-14",
    "sourceUnitDigest": "e3c0146e4d7a42d364c551fcb327b9ab9faef893cfe3b6075a4e658836d69972",
    "claimKind": "navigation",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "rationale": "Retain in place outside platform documentation authority: AGENTS.md#unheaded-block-14, source unit SHA256 e3c0146e4d7a42d364c551fcb327b9ab9faef893cfe3b6075a4e658836d69972, source file SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f at 19ca8de23. The root instruction/navigation file remains its existing owner. No mapped platform target or platform copy is claimed. Native identity resolved at 19ca8de23; historical predecessors remain separately accounted. Pending independent review; no authority flip or truth certificate.",
    "reviewNote": "mechanical: retain-in-place row with no target, AGENTS.md is byte-identical to 19ca8de23 and to the pin (sha256 47f3a4e5...), unit digest e3c0146e recomputed equal and quoted in the rationale, anchor ok; the rationale no longer claims a candidate carry (previous rework answered)",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_c328f1aab4c53a87e5564dab101facf2",
    "sourcePath": "AGENTS.md",
    "sourceAnchor": "unheaded-block-14",
    "sourceUnitDigest": "e3c0146e4d7a42d364c551fcb327b9ab9faef893cfe3b6075a4e658836d69972",
    "claimKind": "navigation",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "rationale": "Retain in place outside platform documentation authority: AGENTS.md#unheaded-block-14, source unit SHA256 e3c0146e4d7a42d364c551fcb327b9ab9faef893cfe3b6075a4e658836d69972, source file SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f at 19ca8de23. The root instruction/navigation file remains its existing owner. No mapped platform target or platform copy is claimed. Native identity resolved at 19ca8de23; historical predecessors remain separately accounted. Pending independent review; no authority flip or truth certificate.",
    "reviewNote": "mechanical: retain-in-place row with no target, AGENTS.md is byte-identical to 19ca8de23 and to the pin (sha256 47f3a4e5...), unit digest e3c0146e recomputed equal and quoted in the rationale, anchor ok; the rationale no longer claims a candidate carry (previous rework answered)",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-272"
}
```

## Entry decisions-299

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s5-root-mapped-conservation.json",
  "collection": "claims",
  "claimId": "claim_1be7573f879e8eda05723b6d40b3b84e",
  "before": {
    "claimId": "claim_1be7573f879e8eda05723b6d40b3b84e",
    "sourceUnitDigest": "12b28da343768f1576f3797fb78cc9f5e32b1875275d52d38a1b56ffd6a5d467",
    "targetOwner": "docs/platform/documentation/switchboard.md",
    "targetAnchor": "5-related-files",
    "claimKind": "navigation",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "rationale": "Frozen root map assigns docs/transitional-switchboard.md#5-related-files to docs/platform/documentation/switchboard.md#5-related-files. Carry the complete unit into its candidate switchboard doc owner. This unit includes 6 documented link spelling adjustment(s): [docs/reading-map.md](reading-map.md) becomes [docs/reading-map.md](../../reading-map.md) (Relative spelling changes only; original repository destination conserved.); [docs/platform/README.md](platform/README.md) becomes [docs/platform/README.md](../README.md) (Relative spelling changes only; original repository destination conserved.); [docs/doc-governance.md](doc-governance.md) becomes [docs/platform/governance.md](../governance.md) (Destination repointed to docs/platform/governance.md and label changed from docs/doc-governance.md to docs/platform/governance.md.); [docs/platform/migration-authoring-rules.md](platform/migration-authoring-rules.md) becomes [docs/platform/migration-authoring-rules.md](../migration-authoring-rules.md) (Relative spelling changes only; original repository destination conserved.); [plans/260925-documentation-authority-unification/current-authority-map-2026-09-25.md](../plans/260925-documentation-authority-unification/current-authority-map-2026-09-25.md) becomes [plans/260925-documentation-authority-unification/current-authority-map-2026-09-25.md](../../../plans/260925-documentation-authority-unification/current-authority-map-2026-09-25.md) (Relative spelling changes only; original repository destination conserved.); [plans/260925-documentation-authority-unification/plan.md](../plans/260925-documentation-authority-unification/plan.md) becomes [plans/260925-documentation-authority-unification/plan.md](../../../plans/260925-documentation-authority-unification/plan.md) (Relative spelling changes only; original repository destination conserved.). Full source/target text and diff are submitted for independent whole-unit conservation review; wrapping/header/relative-path changes grant no truth approval. No source retirement, promotion or component-boundary change. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by native retained identity. Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding. Package at 2300d65571968bb3bcb80123a273272586e3f1db: pending target rebind by native retained identity. Full before/after and digests are in step10-sync2300-rebindings.json; historical approval does not cover the changed binding. L10 review correction: the doc-governance link is repointed to docs/platform/governance.md; its original legacy destination is not retained. Both label change and candidate referent are disclosed; pending independent review.",
    "targetUnitDigest": "31d43bc08eb7f07bb47204e7cef0998d514836e35e717db722eb8e171a2c578e",
    "targetAncestry": [
      "Transitional Documentation Authority Switchboard"
    ]
  },
  "after": {
    "claimId": "claim_1be7573f879e8eda05723b6d40b3b84e",
    "sourceUnitDigest": "12b28da343768f1576f3797fb78cc9f5e32b1875275d52d38a1b56ffd6a5d467",
    "targetOwner": "docs/platform/documentation/switchboard.md",
    "targetAnchor": "5-related-files",
    "claimKind": "navigation",
    "disposition": "supersede",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "rationale": "Frozen root map assigns docs/transitional-switchboard.md#5-related-files to docs/platform/documentation/switchboard.md#5-related-files. Carry the complete unit into its candidate switchboard doc owner. This unit includes 6 documented link spelling adjustment(s): [docs/reading-map.md](reading-map.md) becomes [docs/reading-map.md](../../reading-map.md) (Relative spelling changes only; original repository destination conserved.); [docs/platform/README.md](platform/README.md) becomes [docs/platform/README.md](../README.md) (Relative spelling changes only; original repository destination conserved.); [docs/doc-governance.md](doc-governance.md) becomes [docs/platform/governance.md](../governance.md) (Destination repointed to docs/platform/governance.md and label changed from docs/doc-governance.md to docs/platform/governance.md.); [docs/platform/migration-authoring-rules.md](platform/migration-authoring-rules.md) becomes [docs/platform/migration-authoring-rules.md](../migration-authoring-rules.md) (Relative spelling changes only; original repository destination conserved.); [plans/260925-documentation-authority-unification/current-authority-map-2026-09-25.md](../plans/260925-documentation-authority-unification/current-authority-map-2026-09-25.md) becomes [plans/260925-documentation-authority-unification/current-authority-map-2026-09-25.md](../../../plans/260925-documentation-authority-unification/current-authority-map-2026-09-25.md) (Relative spelling changes only; original repository destination conserved.); [plans/260925-documentation-authority-unification/plan.md](../plans/260925-documentation-authority-unification/plan.md) becomes [plans/260925-documentation-authority-unification/plan.md](../../../plans/260925-documentation-authority-unification/plan.md) (Relative spelling changes only; original repository destination conserved.). Full source/target text and diff are submitted for independent whole-unit conservation review; wrapping/header/relative-path changes grant no truth approval. No source retirement, promotion or component-boundary change. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by native retained identity. Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding. Package at 2300d65571968bb3bcb80123a273272586e3f1db: pending target rebind by native retained identity. Full before/after and digests are in step10-sync2300-rebindings.json; historical approval does not cover the changed binding. L10 review correction: the doc-governance link is repointed to docs/platform/governance.md; its original legacy destination is not retained. Both label change and candidate referent are disclosed; pending independent review.",
    "reviewNote": "deep: Related Files heading section, six link pairs listed in the rationale match the six table rows one to one, doc-governance link repointed to docs/platform/governance.md with its label changed (disclosed, previous rework answered), other five resolve to the same files; digest unchanged since the last round",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "31d43bc08eb7f07bb47204e7cef0998d514836e35e717db722eb8e171a2c578e",
    "targetAncestry": [
      "Transitional Documentation Authority Switchboard"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_1be7573f879e8eda05723b6d40b3b84e",
    "sourceUnitDigest": "12b28da343768f1576f3797fb78cc9f5e32b1875275d52d38a1b56ffd6a5d467",
    "targetOwner": "docs/platform/documentation/switchboard.md",
    "targetAnchor": "5-related-files",
    "claimKind": "navigation",
    "disposition": "supersede",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "rationale": "Frozen root map assigns docs/transitional-switchboard.md#5-related-files to docs/platform/documentation/switchboard.md#5-related-files. Carry the complete unit into its candidate switchboard doc owner. This unit includes 6 documented link spelling adjustment(s): [docs/reading-map.md](reading-map.md) becomes [docs/reading-map.md](../../reading-map.md) (Relative spelling changes only; original repository destination conserved.); [docs/platform/README.md](platform/README.md) becomes [docs/platform/README.md](../README.md) (Relative spelling changes only; original repository destination conserved.); [docs/doc-governance.md](doc-governance.md) becomes [docs/platform/governance.md](../governance.md) (Destination repointed to docs/platform/governance.md and label changed from docs/doc-governance.md to docs/platform/governance.md.); [docs/platform/migration-authoring-rules.md](platform/migration-authoring-rules.md) becomes [docs/platform/migration-authoring-rules.md](../migration-authoring-rules.md) (Relative spelling changes only; original repository destination conserved.); [plans/260925-documentation-authority-unification/current-authority-map-2026-09-25.md](../plans/260925-documentation-authority-unification/current-authority-map-2026-09-25.md) becomes [plans/260925-documentation-authority-unification/current-authority-map-2026-09-25.md](../../../plans/260925-documentation-authority-unification/current-authority-map-2026-09-25.md) (Relative spelling changes only; original repository destination conserved.); [plans/260925-documentation-authority-unification/plan.md](../plans/260925-documentation-authority-unification/plan.md) becomes [plans/260925-documentation-authority-unification/plan.md](../../../plans/260925-documentation-authority-unification/plan.md) (Relative spelling changes only; original repository destination conserved.). Full source/target text and diff are submitted for independent whole-unit conservation review; wrapping/header/relative-path changes grant no truth approval. No source retirement, promotion or component-boundary change. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by native retained identity. Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding. Package at 2300d65571968bb3bcb80123a273272586e3f1db: pending target rebind by native retained identity. Full before/after and digests are in step10-sync2300-rebindings.json; historical approval does not cover the changed binding. L10 review correction: the doc-governance link is repointed to docs/platform/governance.md; its original legacy destination is not retained. Both label change and candidate referent are disclosed; pending independent review.",
    "reviewNote": "deep: Related Files heading section, six link pairs listed in the rationale match the six table rows one to one, doc-governance link repointed to docs/platform/governance.md with its label changed (disclosed, previous rework answered), other five resolve to the same files; digest unchanged since the last round",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "31d43bc08eb7f07bb47204e7cef0998d514836e35e717db722eb8e171a2c578e",
    "targetAncestry": [
      "Transitional Documentation Authority Switchboard"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-299"
}
```

## Entry decisions-304

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s5-root-retained-navigation-proposal.json",
  "collection": "claims",
  "claimId": "claim_8e290abbe8f1344bf8f19c997da11921",
  "before": {
    "claimId": "claim_8e290abbe8f1344bf8f19c997da11921",
    "sourcePath": "docs/specs/reading-map.md",
    "sourceAnchor": "reading-map-sản-phẩm",
    "sourceUnitDigest": "19c2ff247fb664d39a56d6194b1d47b6dce16ea18c8ee19369bd2884efbf918a",
    "claimKind": "navigation",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "rationale": "Retain in place outside platform documentation authority: docs/specs/reading-map.md#reading-map-sản-phẩm, source unit SHA256 19c2ff247fb664d39a56d6194b1d47b6dce16ea18c8ee19369bd2884efbf918a, source file SHA256 22606348608523b94c6a25f1540007aec5512d340278efea1f835713a7e67250 at 19ca8de23. The root instruction/navigation file remains its existing owner. No mapped platform target or platform copy is claimed. Native identity resolved at 19ca8de23; historical predecessors remain separately accounted. docs/reading-map.md section 5 contains seven labelled truth corrections plus the Session Identity entry; retained legacy docs/specs/reading-map.md is untouched. Pending independent review; no authority flip or truth certificate."
  },
  "after": {
    "claimId": "claim_8e290abbe8f1344bf8f19c997da11921",
    "sourcePath": "docs/specs/reading-map.md",
    "sourceAnchor": "reading-map-sản-phẩm",
    "sourceUnitDigest": "19c2ff247fb664d39a56d6194b1d47b6dce16ea18c8ee19369bd2884efbf918a",
    "claimKind": "navigation",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "rationale": "Retain in place outside platform documentation authority: docs/specs/reading-map.md#reading-map-sản-phẩm, source unit SHA256 19c2ff247fb664d39a56d6194b1d47b6dce16ea18c8ee19369bd2884efbf918a, source file SHA256 22606348608523b94c6a25f1540007aec5512d340278efea1f835713a7e67250 at 19ca8de23. The root instruction/navigation file remains its existing owner. No mapped platform target or platform copy is claimed. Native identity resolved at 19ca8de23; historical predecessors remain separately accounted. docs/reading-map.md section 5 contains seven labelled truth corrections plus the Session Identity entry; retained legacy docs/specs/reading-map.md is untouched. Pending independent review; no authority flip or truth certificate.",
    "reviewNote": "mechanical: retain-in-place row, no target; docs/specs/reading-map.md byte-identical to 19ca8de23 and to the pin (sha256 22606348...), H1 unit digest 19c2ff24 recomputed equal and quoted in the rationale, anchor ok; the claim that docs/reading-map.md section 5 holds seven labelled truth corrections plus the Session Identity entry was counted true (seven Truth correction labels, line 179 entry); rationale no longer says carried into a candidate (previous rework answered)",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_8e290abbe8f1344bf8f19c997da11921",
    "sourcePath": "docs/specs/reading-map.md",
    "sourceAnchor": "reading-map-sản-phẩm",
    "sourceUnitDigest": "19c2ff247fb664d39a56d6194b1d47b6dce16ea18c8ee19369bd2884efbf918a",
    "claimKind": "navigation",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "rationale": "Retain in place outside platform documentation authority: docs/specs/reading-map.md#reading-map-sản-phẩm, source unit SHA256 19c2ff247fb664d39a56d6194b1d47b6dce16ea18c8ee19369bd2884efbf918a, source file SHA256 22606348608523b94c6a25f1540007aec5512d340278efea1f835713a7e67250 at 19ca8de23. The root instruction/navigation file remains its existing owner. No mapped platform target or platform copy is claimed. Native identity resolved at 19ca8de23; historical predecessors remain separately accounted. docs/reading-map.md section 5 contains seven labelled truth corrections plus the Session Identity entry; retained legacy docs/specs/reading-map.md is untouched. Pending independent review; no authority flip or truth certificate.",
    "reviewNote": "mechanical: retain-in-place row, no target; docs/specs/reading-map.md byte-identical to 19ca8de23 and to the pin (sha256 22606348...), H1 unit digest 19c2ff24 recomputed equal and quoted in the rationale, anchor ok; the claim that docs/reading-map.md section 5 holds seven labelled truth corrections plus the Session Identity entry was counted true (seven Truth correction labels, line 179 entry); rationale no longer says carried into a candidate (previous rework answered)",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-304"
}
```

## Entry decisions-306

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s5-root-retained-navigation-proposal.json",
  "collection": "claims",
  "claimId": "claim_c8677c74072e0ac1ac4d9b345de1ee1f",
  "before": {
    "claimId": "claim_c8677c74072e0ac1ac4d9b345de1ee1f",
    "sourcePath": "docs/reading-map.md",
    "sourceAnchor": "5-detailed-product-and-source-map",
    "sourceUnitDigest": "01204e281f177e257efc7b015d93651c874a149f0e4bb3a68054b943a66d2e91",
    "claimKind": "navigation",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "rationale": "Retain in place outside platform documentation authority: docs/reading-map.md#5-detailed-product-and-source-map, source unit SHA256 01204e281f177e257efc7b015d93651c874a149f0e4bb3a68054b943a66d2e91, source file SHA256 f4fce87549f728da23d13a9ff8c8c85efc397956bfacf5c5cf83badf13dc5abb at 19ca8de23. The root instruction/navigation file remains its existing owner. No mapped platform target or platform copy is claimed. Native identity resolved at 19ca8de23; historical predecessors remain separately accounted. docs/reading-map.md section 5 contains seven labelled truth corrections plus the Session Identity entry; retained legacy docs/specs/reading-map.md is untouched. Pending independent review; no authority flip or truth certificate."
  },
  "after": {
    "claimId": "claim_c8677c74072e0ac1ac4d9b345de1ee1f",
    "sourcePath": "docs/reading-map.md",
    "sourceAnchor": "5-detailed-product-and-source-map",
    "sourceUnitDigest": "01204e281f177e257efc7b015d93651c874a149f0e4bb3a68054b943a66d2e91",
    "claimKind": "navigation",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "rationale": "Retain in place outside platform documentation authority: docs/reading-map.md#5-detailed-product-and-source-map, source unit SHA256 01204e281f177e257efc7b015d93651c874a149f0e4bb3a68054b943a66d2e91, source file SHA256 f4fce87549f728da23d13a9ff8c8c85efc397956bfacf5c5cf83badf13dc5abb at 19ca8de23. The root instruction/navigation file remains its existing owner. No mapped platform target or platform copy is claimed. Native identity resolved at 19ca8de23; historical predecessors remain separately accounted. docs/reading-map.md section 5 contains seven labelled truth corrections plus the Session Identity entry; retained legacy docs/specs/reading-map.md is untouched. Pending independent review; no authority flip or truth certificate.",
    "reviewNote": "deep: retain-in-place row, no target; docs/reading-map.md byte-identical to 19ca8de23 and to the pin (sha256 f4fce875...), section 5 heading unit digest 01204e28 recomputed equal and quoted, anchor ok; read section 5, it holds exactly seven bold Truth correction labels (lines 154 155 172 174 178 181 182) plus the Session Identity entry at 179 as the rationale says; previous rework answered",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_c8677c74072e0ac1ac4d9b345de1ee1f",
    "sourcePath": "docs/reading-map.md",
    "sourceAnchor": "5-detailed-product-and-source-map",
    "sourceUnitDigest": "01204e281f177e257efc7b015d93651c874a149f0e4bb3a68054b943a66d2e91",
    "claimKind": "navigation",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "rationale": "Retain in place outside platform documentation authority: docs/reading-map.md#5-detailed-product-and-source-map, source unit SHA256 01204e281f177e257efc7b015d93651c874a149f0e4bb3a68054b943a66d2e91, source file SHA256 f4fce87549f728da23d13a9ff8c8c85efc397956bfacf5c5cf83badf13dc5abb at 19ca8de23. The root instruction/navigation file remains its existing owner. No mapped platform target or platform copy is claimed. Native identity resolved at 19ca8de23; historical predecessors remain separately accounted. docs/reading-map.md section 5 contains seven labelled truth corrections plus the Session Identity entry; retained legacy docs/specs/reading-map.md is untouched. Pending independent review; no authority flip or truth certificate.",
    "reviewNote": "deep: retain-in-place row, no target; docs/reading-map.md byte-identical to 19ca8de23 and to the pin (sha256 f4fce875...), section 5 heading unit digest 01204e28 recomputed equal and quoted, anchor ok; read section 5, it holds exactly seven bold Truth correction labels (lines 154 155 172 174 178 181 182) plus the Session Identity entry at 179 as the rationale says; previous rework answered",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-345f15d95.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-306"
}
```

## Entry decisions-307

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s5-root-retained-navigation-proposal.json",
  "collection": "claims",
  "claimId": "claim_690e83ad4f79a1bbac8eafc9acb1d4ea",
  "before": {
    "claimId": "claim_690e83ad4f79a1bbac8eafc9acb1d4ea",
    "sourcePath": "docs/specs/reading-map.md",
    "sourceAnchor": "unheaded-block-2",
    "sourceUnitDigest": "1c7bbf9e95dcf48b5e1f6de612a5baf82e268ea009eda1ff201ffa5dacdd1fbd",
    "claimKind": "navigation",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "rationale": "Retain in place outside platform documentation authority: docs/specs/reading-map.md#unheaded-block-2, source unit SHA256 1c7bbf9e95dcf48b5e1f6de612a5baf82e268ea009eda1ff201ffa5dacdd1fbd, source file SHA256 22606348608523b94c6a25f1540007aec5512d340278efea1f835713a7e67250 at 19ca8de23. The root instruction/navigation file remains its existing owner. No mapped platform target or platform copy is claimed. Native identity resolved at 19ca8de23; historical predecessors remain separately accounted. docs/reading-map.md section 5 contains seven labelled truth corrections plus the Session Identity entry; retained legacy docs/specs/reading-map.md is untouched. Pending independent review; no authority flip or truth certificate."
  },
  "after": {
    "claimId": "claim_690e83ad4f79a1bbac8eafc9acb1d4ea",
    "sourcePath": "docs/specs/reading-map.md",
    "sourceAnchor": "unheaded-block-2",
    "sourceUnitDigest": "1c7bbf9e95dcf48b5e1f6de612a5baf82e268ea009eda1ff201ffa5dacdd1fbd",
    "claimKind": "navigation",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "rationale": "Retain in place outside platform documentation authority: docs/specs/reading-map.md#unheaded-block-2, source unit SHA256 1c7bbf9e95dcf48b5e1f6de612a5baf82e268ea009eda1ff201ffa5dacdd1fbd, source file SHA256 22606348608523b94c6a25f1540007aec5512d340278efea1f835713a7e67250 at 19ca8de23. The root instruction/navigation file remains its existing owner. No mapped platform target or platform copy is claimed. Native identity resolved at 19ca8de23; historical predecessors remain separately accounted. docs/reading-map.md section 5 contains seven labelled truth corrections plus the Session Identity entry; retained legacy docs/specs/reading-map.md is untouched. Pending independent review; no authority flip or truth certificate.",
    "reviewNote": "deep: retain-in-place row, no target; docs/specs/reading-map.md byte-identical to 19ca8de23 and to the pin (sha256 22606348...), unheaded-block-2 digest 1c7bbf9e recomputed equal and quoted, anchor ok; rationale no longer says carried into a candidate and its count of seven labelled truth corrections plus the Session Identity entry in docs/reading-map.md section 5 is true (previous rework answered); wording \"root instruction/navigation file\" is loose for a docs/specs file but not false",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-06-345f15d95.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_690e83ad4f79a1bbac8eafc9acb1d4ea",
    "sourcePath": "docs/specs/reading-map.md",
    "sourceAnchor": "unheaded-block-2",
    "sourceUnitDigest": "1c7bbf9e95dcf48b5e1f6de612a5baf82e268ea009eda1ff201ffa5dacdd1fbd",
    "claimKind": "navigation",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "rationale": "Retain in place outside platform documentation authority: docs/specs/reading-map.md#unheaded-block-2, source unit SHA256 1c7bbf9e95dcf48b5e1f6de612a5baf82e268ea009eda1ff201ffa5dacdd1fbd, source file SHA256 22606348608523b94c6a25f1540007aec5512d340278efea1f835713a7e67250 at 19ca8de23. The root instruction/navigation file remains its existing owner. No mapped platform target or platform copy is claimed. Native identity resolved at 19ca8de23; historical predecessors remain separately accounted. docs/reading-map.md section 5 contains seven labelled truth corrections plus the Session Identity entry; retained legacy docs/specs/reading-map.md is untouched. Pending independent review; no authority flip or truth certificate.",
    "reviewNote": "deep: retain-in-place row, no target; docs/specs/reading-map.md byte-identical to 19ca8de23 and to the pin (sha256 22606348...), unheaded-block-2 digest 1c7bbf9e recomputed equal and quoted, anchor ok; rationale no longer says carried into a candidate and its count of seven labelled truth corrections plus the Session Identity entry in docs/reading-map.md section 5 is true (previous rework answered); wording \"root instruction/navigation file\" is loose for a docs/specs file but not false",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-06-345f15d95.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-307"
}
```

## Entry decisions-308

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s5-root-retained-navigation-proposal.json",
  "collection": "claims",
  "claimId": "claim_42444c5f44c4076300c2b9c56516c429",
  "before": {
    "claimId": "claim_42444c5f44c4076300c2b9c56516c429",
    "sourcePath": "docs/reading-map.md",
    "sourceAnchor": "unheaded-block-16",
    "sourceUnitDigest": "607cd88b7a9323d610811e9bee61bbcb328ad12ba92f9f1b62defc5ab6c6db24",
    "claimKind": "navigation",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "rationale": "Retain in place outside platform documentation authority: docs/reading-map.md#unheaded-block-16, source unit SHA256 607cd88b7a9323d610811e9bee61bbcb328ad12ba92f9f1b62defc5ab6c6db24, source file SHA256 f4fce87549f728da23d13a9ff8c8c85efc397956bfacf5c5cf83badf13dc5abb at 19ca8de23. The root instruction/navigation file remains its existing owner. No mapped platform target or platform copy is claimed. Native identity resolved at 19ca8de23; historical predecessors remain separately accounted. docs/reading-map.md section 5 contains seven labelled truth corrections plus the Session Identity entry; retained legacy docs/specs/reading-map.md is untouched. Pending independent review; no authority flip or truth certificate."
  },
  "after": {
    "claimId": "claim_42444c5f44c4076300c2b9c56516c429",
    "sourcePath": "docs/reading-map.md",
    "sourceAnchor": "unheaded-block-16",
    "sourceUnitDigest": "607cd88b7a9323d610811e9bee61bbcb328ad12ba92f9f1b62defc5ab6c6db24",
    "claimKind": "navigation",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "rationale": "Retain in place outside platform documentation authority: docs/reading-map.md#unheaded-block-16, source unit SHA256 607cd88b7a9323d610811e9bee61bbcb328ad12ba92f9f1b62defc5ab6c6db24, source file SHA256 f4fce87549f728da23d13a9ff8c8c85efc397956bfacf5c5cf83badf13dc5abb at 19ca8de23. The root instruction/navigation file remains its existing owner. No mapped platform target or platform copy is claimed. Native identity resolved at 19ca8de23; historical predecessors remain separately accounted. docs/reading-map.md section 5 contains seven labelled truth corrections plus the Session Identity entry; retained legacy docs/specs/reading-map.md is untouched. Pending independent review; no authority flip or truth certificate.",
    "reviewNote": "deep: retain-in-place row, no target; docs/reading-map.md byte-identical to 19ca8de23 and to the pin (sha256 f4fce875...), unheaded-block-16 digest 607cd88b recomputed equal and quoted, anchor ok; the seven Truth correction labels plus Session Identity entry sentence is true; previous rework answered",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-06-345f15d95.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_42444c5f44c4076300c2b9c56516c429",
    "sourcePath": "docs/reading-map.md",
    "sourceAnchor": "unheaded-block-16",
    "sourceUnitDigest": "607cd88b7a9323d610811e9bee61bbcb328ad12ba92f9f1b62defc5ab6c6db24",
    "claimKind": "navigation",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "rationale": "Retain in place outside platform documentation authority: docs/reading-map.md#unheaded-block-16, source unit SHA256 607cd88b7a9323d610811e9bee61bbcb328ad12ba92f9f1b62defc5ab6c6db24, source file SHA256 f4fce87549f728da23d13a9ff8c8c85efc397956bfacf5c5cf83badf13dc5abb at 19ca8de23. The root instruction/navigation file remains its existing owner. No mapped platform target or platform copy is claimed. Native identity resolved at 19ca8de23; historical predecessors remain separately accounted. docs/reading-map.md section 5 contains seven labelled truth corrections plus the Session Identity entry; retained legacy docs/specs/reading-map.md is untouched. Pending independent review; no authority flip or truth certificate.",
    "reviewNote": "deep: retain-in-place row, no target; docs/reading-map.md byte-identical to 19ca8de23 and to the pin (sha256 f4fce875...), unheaded-block-16 digest 607cd88b recomputed equal and quoted, anchor ok; the seven Truth correction labels plus Session Identity entry sentence is true; previous rework answered",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-06-345f15d95.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-308"
}
```

## Entry decisions-364

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s9-runner-01.json",
  "collection": "claims",
  "claimId": "claim_5788dd19c4378fbb442c6a455f0e7857",
  "before": {
    "claimId": "claim_5788dd19c4378fbb442c6a455f0e7857",
    "sourceUnitDigest": "29d41a45489095b7ca89fd6570c786bc74bce025d8b3c4cb995cf315b3c653d9",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "0063-work-chỉ-là-bên-dùng-dispatch-nhận-input-generic-thay-phần-đầu-vào-còn-lại-của-rul73-dispatch-does-not-know-work2",
    "claimKind": "specification",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "rationale": "Judgment: labelled candidate addition. Whole heading docs/specs/runner.md#0063-work-chỉ-là-bên-dùng-dispatch-nhận-input-generic-thay-phần-đầu-vào-còn-lại-của-rul73-dispatch-does-not-know-work2 (lines 3329–3329) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#0063-work-chỉ-là-bên-dùng-dispatch-nhận-input-generic-thay-phần-đầu-vào-còn-lại-của-rul73-dispatch-does-not-know-work2. Source/target digests differ because the labelled 0064 introduction blockquote (Added in candidate: Settled runner decision carried from the retained source) sits at the end of the 0063 direct section; source decision text remains verbatim. Supersede records that labelled addition. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover. L10-13/L10-14: specific candidate link correction or explicit added-decision wrapper changes this direct unit; current target binding re-decided pending. Historical decision semantics remain; all text differences shown in step10-correction-edits.json. No approval carry.",
    "targetUnitDigest": "3a1f30f7334b753a47a5c620be560d11b00e969789882a65e594c96d92177f55",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
    ]
  },
  "after": {
    "claimId": "claim_5788dd19c4378fbb442c6a455f0e7857",
    "sourceUnitDigest": "29d41a45489095b7ca89fd6570c786bc74bce025d8b3c4cb995cf315b3c653d9",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "0063-work-chỉ-là-bên-dùng-dispatch-nhận-input-generic-thay-phần-đầu-vào-còn-lại-của-rul73-dispatch-does-not-know-work2",
    "claimKind": "specification",
    "disposition": "supersede",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "rationale": "Judgment: labelled candidate addition. Whole heading docs/specs/runner.md#0063-work-chỉ-là-bên-dùng-dispatch-nhận-input-generic-thay-phần-đầu-vào-còn-lại-của-rul73-dispatch-does-not-know-work2 (lines 3329–3329) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#0063-work-chỉ-là-bên-dùng-dispatch-nhận-input-generic-thay-phần-đầu-vào-còn-lại-của-rul73-dispatch-does-not-know-work2. Source/target digests differ because the labelled 0064 introduction blockquote (Added in candidate: Settled runner decision carried from the retained source) sits at the end of the 0063 direct section; source decision text remains verbatim. Supersede records that labelled addition. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover. L10-13/L10-14: specific candidate link correction or explicit added-decision wrapper changes this direct unit; current target binding re-decided pending. Historical decision semantics remain; all text differences shown in step10-correction-edits.json. No approval carry.",
    "reviewNote": "deep: 0063 decision heading, the only difference to the source is the one labelled Added in candidate blockquote at the end of the section which the rationale explains; the rationale now gives the true source line 3329 (previous rework answered, heading is at line 3329 of docs/specs/runner.md at the pin)",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-06-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "3a1f30f7334b753a47a5c620be560d11b00e969789882a65e594c96d92177f55",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_5788dd19c4378fbb442c6a455f0e7857",
    "sourceUnitDigest": "29d41a45489095b7ca89fd6570c786bc74bce025d8b3c4cb995cf315b3c653d9",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "0063-work-chỉ-là-bên-dùng-dispatch-nhận-input-generic-thay-phần-đầu-vào-còn-lại-của-rul73-dispatch-does-not-know-work2",
    "claimKind": "specification",
    "disposition": "supersede",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "rationale": "Judgment: labelled candidate addition. Whole heading docs/specs/runner.md#0063-work-chỉ-là-bên-dùng-dispatch-nhận-input-generic-thay-phần-đầu-vào-còn-lại-của-rul73-dispatch-does-not-know-work2 (lines 3329–3329) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#0063-work-chỉ-là-bên-dùng-dispatch-nhận-input-generic-thay-phần-đầu-vào-còn-lại-của-rul73-dispatch-does-not-know-work2. Source/target digests differ because the labelled 0064 introduction blockquote (Added in candidate: Settled runner decision carried from the retained source) sits at the end of the 0063 direct section; source decision text remains verbatim. Supersede records that labelled addition. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover. L10-13/L10-14: specific candidate link correction or explicit added-decision wrapper changes this direct unit; current target binding re-decided pending. Historical decision semantics remain; all text differences shown in step10-correction-edits.json. No approval carry.",
    "reviewNote": "deep: 0063 decision heading, the only difference to the source is the one labelled Added in candidate blockquote at the end of the section which the rationale explains; the rationale now gives the true source line 3329 (previous rework answered, heading is at line 3329 of docs/specs/runner.md at the pin)",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-06-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "3a1f30f7334b753a47a5c620be560d11b00e969789882a65e594c96d92177f55",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-364"
}
```

