# Bounded re-review: historical 1

Author session: `codex-session:27@2026-10-14`
Packaged by: `codex-session:unit-run-1792116045118-73cfbb42@2026-10-16`
Content commit: `287a22d33a0eaf2d9e47549a1142daf62361bb8c` (author changes at `0d8c602e2`)
Comparison base: `5035fed52e60254ecbe034cc987553feb24616f4`
Entries: **1**; each request at most60 entries and400000 bytes.

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

## Entry historical-001

```json
{
  "kind": "historical-row-change",
  "file": "plans/260925-documentation-authority-unification/ledger/retired-unit-decisions.json",
  "collection": "rows",
  "claimId": "claim_500d588a939fd6109cf102b8343484bb",
  "before": {
    "sourcePath": "AGENTS.md",
    "unitDigest": "875b03c309d71842d09c8647b525586e9c79e529c46804487926d99f46550b89",
    "identityFingerprint": "875b03c309d71842d09c8647b525586e9c79e529c46804487926d99f46550b89",
    "claimId": "claim_500d588a939fd6109cf102b8343484bb",
    "sourceAnchor": "unheaded-block-28",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "45945b0c37c8cca3414b5e11c8b0dba3c210d8dcf30d34fc26a1d794e848801e",
    "claimKind": "unclassified",
    "status": "removed-pending-disposition",
    "priorStatus": "current",
    "retiredAtCommit": "6c6a65e8543fa72012bd55f8999f13f9ed6193c4",
    "retiredReason": "no counterpart in current source",
    "disposition": "retain-as-evidence",
    "targetOwner": null,
    "targetAnchor": null,
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:27@2026-10-14",
    "rationale": "A31 upstream removal: retain the exact prior unit as immutable git evidence at c18020da3. Full prior/current diff and informational successor shown for independent conservation review; no claim of full current carry or approval carry.",
    "reviewNote": "deep: AGENTS.md dispatch bullet list: the out-of-process bullet was rewritten upstream (dispatch execute to fgos run); 2 of 3 lines verbatim; old unit retained as git evidence and the missing line is in the main hunk",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-15",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-261015-0044-boundary-sync-resume-02.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "68b95dbd83adf817d42571d2c0b2961be75d78d2"
  },
  "after": {
    "sourcePath": "AGENTS.md",
    "unitDigest": "875b03c309d71842d09c8647b525586e9c79e529c46804487926d99f46550b89",
    "identityFingerprint": "875b03c309d71842d09c8647b525586e9c79e529c46804487926d99f46550b89",
    "claimId": "claim_500d588a939fd6109cf102b8343484bb",
    "sourceAnchor": "unheaded-block-28",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "45945b0c37c8cca3414b5e11c8b0dba3c210d8dcf30d34fc26a1d794e848801e",
    "claimKind": "unclassified",
    "status": "removed-pending-disposition",
    "priorStatus": "current",
    "retiredAtCommit": "6c6a65e8543fa72012bd55f8999f13f9ed6193c4",
    "retiredReason": "no counterpart in current source",
    "disposition": "retain-as-evidence",
    "targetOwner": null,
    "targetAnchor": null,
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:27@2026-10-14",
    "rationale": "A31 upstream removal: retain the exact prior unit as immutable git evidence at c18020da3. Full prior/current diff and informational successor shown for independent conservation review; no claim of full current carry or approval carry.",
    "reviewNote": "deep: the pending reclassify duplicate is gone (L10-22) and the single row is the retain-as-evidence row reviewed on 2026-10-15; row equals the pack and the working registry record byte for byte, one disposition per claim in all shards; unit digest recomputed (extractor and plain sha256 of the three bullets at fba5d0426 L168-170, and the same unit is unheaded-block-28 at c18020da3 L165-167, absent at 6c6a65e85 and HEAD) so the rationale's git evidence at c18020da3 is true; at HEAD the unavailable and in-process bullets are verbatim and only the out-of-process bullet is rewritten to fgos run, which the note says; approval pin 68b95dbd8 holds the matching ok row with the same digest; the report header there names author session 28 while the row says 27, a provenance nit only",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-historical-01-345f15d95.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "deepRequired": true,
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:27@2026-10-14",
  "currentDecision": {
    "sourcePath": "AGENTS.md",
    "unitDigest": "875b03c309d71842d09c8647b525586e9c79e529c46804487926d99f46550b89",
    "identityFingerprint": "875b03c309d71842d09c8647b525586e9c79e529c46804487926d99f46550b89",
    "claimId": "claim_500d588a939fd6109cf102b8343484bb",
    "sourceAnchor": "unheaded-block-28",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "45945b0c37c8cca3414b5e11c8b0dba3c210d8dcf30d34fc26a1d794e848801e",
    "claimKind": "unclassified",
    "status": "removed-pending-disposition",
    "priorStatus": "current",
    "retiredAtCommit": "6c6a65e8543fa72012bd55f8999f13f9ed6193c4",
    "retiredReason": "no counterpart in current source",
    "disposition": "retain-as-evidence",
    "targetOwner": null,
    "targetAnchor": null,
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:27@2026-10-14",
    "rationale": "A31 upstream removal: retain the exact prior unit as immutable git evidence at c18020da3. Full prior/current diff and informational successor shown for independent conservation review; no claim of full current carry or approval carry.",
    "reviewNote": "deep: the pending reclassify duplicate is gone (L10-22) and the single row is the retain-as-evidence row reviewed on 2026-10-15; row equals the pack and the working registry record byte for byte, one disposition per claim in all shards; unit digest recomputed (extractor and plain sha256 of the three bullets at fba5d0426 L168-170, and the same unit is unheaded-block-28 at c18020da3 L165-167, absent at 6c6a65e85 and HEAD) so the rationale's git evidence at c18020da3 is true; at HEAD the unavailable and in-process bullets are verbatim and only the out-of-process bullet is rewritten to fgos run, which the note says; approval pin 68b95dbd8 holds the matching ok row with the same digest; the report header there names author session 28 while the row says 27, a provenance nit only",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-historical-01-345f15d95.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "historical-001"
}
```

