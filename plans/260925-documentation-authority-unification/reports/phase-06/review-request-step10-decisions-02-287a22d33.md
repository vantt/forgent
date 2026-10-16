# Bounded re-review: decisions 2

Author session: `codex-session:unit-run-1792089181794-89ae42db@2026-10-16`
Packaged by: `codex-session:unit-run-1792116045118-73cfbb42@2026-10-16`
Content commit: `287a22d33a0eaf2d9e47549a1142daf62361bb8c` (author changes at `0d8c602e2`)
Comparison base: `5035fed52e60254ecbe034cc987553feb24616f4`
Entries: **46**; each request at most60 entries and400000 bytes.

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

## Entry decisions-254

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s10-closing-instructions.json",
  "collection": "claims",
  "claimId": "claim_11685a19f556cf213ef62e11a1d2d5c6",
  "before": {
    "claimId": "claim_11685a19f556cf213ef62e11a1d2d5c6",
    "sourceUnitDigest": "b64e3f9772c143e0d911c16218f5a9f280f96b0c1466f43f52e5aa4d63855221",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "L10-3: retain AGENTS.md#unheaded-block-44 as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f, pinned at 59b9b70876324e07135db53d2351f7db6a7e1746. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewNote": "mechanical: AGENTS.md#unheaded-block-44 digest recomputed by the extractor at 19ca8de23 and at HEAD equals the shown digest, anchor resolves, target none, rationale SHA256 47f3a4e5 at pin 59b9b7087 equals the committed file; unit text was not read",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-03-19ca8de23.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "4a18f35ff5d6a9b7a07e955bd64418282c6a91b2"
  },
  "after": {
    "claimId": "claim_11685a19f556cf213ef62e11a1d2d5c6",
    "sourceUnitDigest": "b64e3f9772c143e0d911c16218f5a9f280f96b0c1466f43f52e5aa4d63855221",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "L10-3: retain AGENTS.md#unheaded-block-44 as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f, pinned at 59b9b70876324e07135db53d2351f7db6a7e1746. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewNote": "mechanical: full digests recomputed by the extractor at 345f15d95 and equal to the shard and the pack; source anchor unheaded-block-44 resolves; AGENTS.md sha256 47f3a4e5 equals the rationale pin at 59b9b7087 and at 345f15d95, target none by design; independently recomputed in Python (seed 20261018); text not read beyond what is stated",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-01-345f15d95.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "currentDecision": {
    "claimId": "claim_11685a19f556cf213ef62e11a1d2d5c6",
    "sourceUnitDigest": "b64e3f9772c143e0d911c16218f5a9f280f96b0c1466f43f52e5aa4d63855221",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "L10-3: retain AGENTS.md#unheaded-block-44 as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f, pinned at 59b9b70876324e07135db53d2351f7db6a7e1746. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewNote": "mechanical: full digests recomputed by the extractor at 345f15d95 and equal to the shard and the pack; source anchor unheaded-block-44 resolves; AGENTS.md sha256 47f3a4e5 equals the rationale pin at 59b9b7087 and at 345f15d95, target none by design; independently recomputed in Python (seed 20261018); text not read beyond what is stated",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-01-345f15d95.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-254"
}
```

## Entry decisions-255

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s10-closing-instructions.json",
  "collection": "claims",
  "claimId": "claim_1661543368ff1c7e6f57d20e2345cf4d",
  "before": {
    "claimId": "claim_1661543368ff1c7e6f57d20e2345cf4d",
    "sourceUnitDigest": "8ca4c5c61c7f369a197d6118f0a325cc39727dbc792d3c53b1c2b1dd2aa7648a",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "L10-3: retain AGENTS.md#unheaded-block-45 as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f, pinned at 59b9b70876324e07135db53d2351f7db6a7e1746. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewNote": "mechanical: AGENTS.md#unheaded-block-45 digest recomputed by the extractor at 19ca8de23 and at HEAD equals the shown digest, anchor resolves, target none, rationale SHA256 47f3a4e5 at pin 59b9b7087 equals the committed file; unit text was not read",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-03-19ca8de23.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "4a18f35ff5d6a9b7a07e955bd64418282c6a91b2"
  },
  "after": {
    "claimId": "claim_1661543368ff1c7e6f57d20e2345cf4d",
    "sourceUnitDigest": "8ca4c5c61c7f369a197d6118f0a325cc39727dbc792d3c53b1c2b1dd2aa7648a",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "L10-3: retain AGENTS.md#unheaded-block-45 as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f, pinned at 59b9b70876324e07135db53d2351f7db6a7e1746. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewNote": "mechanical: full digests recomputed by the extractor at 345f15d95 and equal to the shard and the pack; source anchor unheaded-block-45 resolves; AGENTS.md sha256 47f3a4e5 equals the rationale pin at 59b9b7087 and at 345f15d95, target none by design; text not read beyond what is stated",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-01-345f15d95.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "currentDecision": {
    "claimId": "claim_1661543368ff1c7e6f57d20e2345cf4d",
    "sourceUnitDigest": "8ca4c5c61c7f369a197d6118f0a325cc39727dbc792d3c53b1c2b1dd2aa7648a",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "L10-3: retain AGENTS.md#unheaded-block-45 as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f, pinned at 59b9b70876324e07135db53d2351f7db6a7e1746. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewNote": "mechanical: full digests recomputed by the extractor at 345f15d95 and equal to the shard and the pack; source anchor unheaded-block-45 resolves; AGENTS.md sha256 47f3a4e5 equals the rationale pin at 59b9b7087 and at 345f15d95, target none by design; text not read beyond what is stated",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-01-345f15d95.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-255"
}
```

## Entry decisions-256

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s10-closing-instructions.json",
  "collection": "claims",
  "claimId": "claim_2165e8fcd1ec571e64eae458439bb309",
  "before": {
    "claimId": "claim_2165e8fcd1ec571e64eae458439bb309",
    "sourceUnitDigest": "1ac5061190836bd1107ae3eb6460b899d1d92486a62077b653cbf7d2016b2101",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "L10-3: retain AGENTS.md#unheaded-block-46 as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f, pinned at 59b9b70876324e07135db53d2351f7db6a7e1746. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewNote": "mechanical: AGENTS.md#unheaded-block-46 digest recomputed by the extractor at 19ca8de23 and at HEAD equals the shown digest, anchor resolves, target none, rationale SHA256 47f3a4e5 at pin 59b9b7087 equals the committed file; unit text was not read",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-03-19ca8de23.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "4a18f35ff5d6a9b7a07e955bd64418282c6a91b2"
  },
  "after": {
    "claimId": "claim_2165e8fcd1ec571e64eae458439bb309",
    "sourceUnitDigest": "1ac5061190836bd1107ae3eb6460b899d1d92486a62077b653cbf7d2016b2101",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "L10-3: retain AGENTS.md#unheaded-block-46 as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f, pinned at 59b9b70876324e07135db53d2351f7db6a7e1746. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewNote": "mechanical: full digests recomputed by the extractor at 345f15d95 and equal to the shard and the pack; source anchor unheaded-block-46 resolves; AGENTS.md sha256 47f3a4e5 equals the rationale pin at 59b9b7087 and at 345f15d95, target none by design; text not read beyond what is stated",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-01-345f15d95.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "currentDecision": {
    "claimId": "claim_2165e8fcd1ec571e64eae458439bb309",
    "sourceUnitDigest": "1ac5061190836bd1107ae3eb6460b899d1d92486a62077b653cbf7d2016b2101",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "L10-3: retain AGENTS.md#unheaded-block-46 as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f, pinned at 59b9b70876324e07135db53d2351f7db6a7e1746. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewNote": "mechanical: full digests recomputed by the extractor at 345f15d95 and equal to the shard and the pack; source anchor unheaded-block-46 resolves; AGENTS.md sha256 47f3a4e5 equals the rationale pin at 59b9b7087 and at 345f15d95, target none by design; text not read beyond what is stated",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-01-345f15d95.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-256"
}
```

## Entry decisions-257

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s10-closing-instructions.json",
  "collection": "claims",
  "claimId": "claim_1ac1158b31cf27d233825c9e70232fdb",
  "before": {
    "claimId": "claim_1ac1158b31cf27d233825c9e70232fdb",
    "sourceUnitDigest": "a412a2f5e102f17d8b6b108830fed27c29021381ac59ea9695c43d604e1a6570",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "L10-3: retain AGENTS.md#unheaded-block-47 as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f, pinned at 59b9b70876324e07135db53d2351f7db6a7e1746. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewNote": "mechanical: AGENTS.md#unheaded-block-47 digest recomputed by the extractor at 19ca8de23 and at HEAD equals the shown digest, anchor resolves, target none, rationale SHA256 47f3a4e5 at pin 59b9b7087 equals the committed file; unit text was not read",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-03-19ca8de23.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "4a18f35ff5d6a9b7a07e955bd64418282c6a91b2"
  },
  "after": {
    "claimId": "claim_1ac1158b31cf27d233825c9e70232fdb",
    "sourceUnitDigest": "a412a2f5e102f17d8b6b108830fed27c29021381ac59ea9695c43d604e1a6570",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "L10-3: retain AGENTS.md#unheaded-block-47 as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f, pinned at 59b9b70876324e07135db53d2351f7db6a7e1746. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewNote": "deep: read AGENTS.md#unheaded-block-47 (- id: `decision-question-template` - source: `core); digest recomputed at 345f15d95 equals the shown one, unit still present at that anchor, target none by design so nothing lost or added; rationale pin SHA256 47f3a4e5 equals AGENTS.md at 59b9b7087 and 345f15d95",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-01-345f15d95.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "currentDecision": {
    "claimId": "claim_1ac1158b31cf27d233825c9e70232fdb",
    "sourceUnitDigest": "a412a2f5e102f17d8b6b108830fed27c29021381ac59ea9695c43d604e1a6570",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "L10-3: retain AGENTS.md#unheaded-block-47 as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f, pinned at 59b9b70876324e07135db53d2351f7db6a7e1746. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewNote": "deep: read AGENTS.md#unheaded-block-47 (- id: `decision-question-template` - source: `core); digest recomputed at 345f15d95 equals the shown one, unit still present at that anchor, target none by design so nothing lost or added; rationale pin SHA256 47f3a4e5 equals AGENTS.md at 59b9b7087 and 345f15d95",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-01-345f15d95.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-257"
}
```

## Entry decisions-258

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s10-closing-instructions.json",
  "collection": "claims",
  "claimId": "claim_1c0fa8ed450e9b4d240269ee06fbb6d2",
  "before": {
    "claimId": "claim_1c0fa8ed450e9b4d240269ee06fbb6d2",
    "sourceUnitDigest": "1297672f2b5e8ad757858b4c7e8e54e6713cabadc7461f2f561b92e4e17bb16e",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "L10-3: retain AGENTS.md#unheaded-block-48 as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f, pinned at 59b9b70876324e07135db53d2351f7db6a7e1746. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewNote": "mechanical: AGENTS.md#unheaded-block-48 digest recomputed by the extractor at 19ca8de23 and at HEAD equals the shown digest, anchor resolves, target none, rationale SHA256 47f3a4e5 at pin 59b9b7087 equals the committed file; unit text was not read",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-03-19ca8de23.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "4a18f35ff5d6a9b7a07e955bd64418282c6a91b2"
  },
  "after": {
    "claimId": "claim_1c0fa8ed450e9b4d240269ee06fbb6d2",
    "sourceUnitDigest": "1297672f2b5e8ad757858b4c7e8e54e6713cabadc7461f2f561b92e4e17bb16e",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "L10-3: retain AGENTS.md#unheaded-block-48 as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f, pinned at 59b9b70876324e07135db53d2351f7db6a7e1746. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewNote": "mechanical: full digests recomputed by the extractor at 345f15d95 and equal to the shard and the pack; source anchor unheaded-block-48 resolves; AGENTS.md sha256 47f3a4e5 equals the rationale pin at 59b9b7087 and at 345f15d95, target none by design; text not read beyond what is stated",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-01-345f15d95.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "currentDecision": {
    "claimId": "claim_1c0fa8ed450e9b4d240269ee06fbb6d2",
    "sourceUnitDigest": "1297672f2b5e8ad757858b4c7e8e54e6713cabadc7461f2f561b92e4e17bb16e",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "L10-3: retain AGENTS.md#unheaded-block-48 as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f, pinned at 59b9b70876324e07135db53d2351f7db6a7e1746. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewNote": "mechanical: full digests recomputed by the extractor at 345f15d95 and equal to the shard and the pack; source anchor unheaded-block-48 resolves; AGENTS.md sha256 47f3a4e5 equals the rationale pin at 59b9b7087 and at 345f15d95, target none by design; text not read beyond what is stated",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-01-345f15d95.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-258"
}
```

## Entry decisions-259

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s10-closing-instructions.json",
  "collection": "claims",
  "claimId": "claim_b70e7c39975314f130e9a2501156721d",
  "before": {
    "claimId": "claim_b70e7c39975314f130e9a2501156721d",
    "sourceUnitDigest": "0634893a1881205c0eb9275047c5b3a44f596f2dff7a47fb0d0e10aae07aebb4",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "L10-3: retain AGENTS.md#unheaded-block-49 as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f, pinned at 59b9b70876324e07135db53d2351f7db6a7e1746. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewNote": "mechanical: AGENTS.md#unheaded-block-49 digest recomputed by the extractor at 19ca8de23 and at HEAD equals the shown digest, anchor resolves, target none, rationale SHA256 47f3a4e5 at pin 59b9b7087 equals the committed file; unit text was not read",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-03-19ca8de23.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "4a18f35ff5d6a9b7a07e955bd64418282c6a91b2"
  },
  "after": {
    "claimId": "claim_b70e7c39975314f130e9a2501156721d",
    "sourceUnitDigest": "0634893a1881205c0eb9275047c5b3a44f596f2dff7a47fb0d0e10aae07aebb4",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "L10-3: retain AGENTS.md#unheaded-block-49 as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f, pinned at 59b9b70876324e07135db53d2351f7db6a7e1746. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewNote": "mechanical: full digests recomputed by the extractor at 345f15d95 and equal to the shard and the pack; source anchor unheaded-block-49 resolves; AGENTS.md sha256 47f3a4e5 equals the rationale pin at 59b9b7087 and at 345f15d95, target none by design; text not read beyond what is stated",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-01-345f15d95.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "currentDecision": {
    "claimId": "claim_b70e7c39975314f130e9a2501156721d",
    "sourceUnitDigest": "0634893a1881205c0eb9275047c5b3a44f596f2dff7a47fb0d0e10aae07aebb4",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "L10-3: retain AGENTS.md#unheaded-block-49 as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f, pinned at 59b9b70876324e07135db53d2351f7db6a7e1746. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewNote": "mechanical: full digests recomputed by the extractor at 345f15d95 and equal to the shard and the pack; source anchor unheaded-block-49 resolves; AGENTS.md sha256 47f3a4e5 equals the rationale pin at 59b9b7087 and at 345f15d95, target none by design; text not read beyond what is stated",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-01-345f15d95.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-259"
}
```

## Entry decisions-260

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s10-closing-instructions.json",
  "collection": "claims",
  "claimId": "claim_0b999bb17fb999e00f51a138af84c8a2",
  "before": {
    "claimId": "claim_0b999bb17fb999e00f51a138af84c8a2",
    "sourceUnitDigest": "f553a3334af338a1e4d76df5657adc8ac73d99d8971bd031043545b288db1cc7",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "L10-3: retain AGENTS.md#unheaded-block-5 as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f, pinned at 59b9b70876324e07135db53d2351f7db6a7e1746. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewNote": "mechanical: AGENTS.md#unheaded-block-5 digest recomputed by the extractor at 19ca8de23 and at HEAD equals the shown digest, anchor resolves, target none, rationale SHA256 47f3a4e5 at pin 59b9b7087 equals the committed file; unit text was not read",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-03-19ca8de23.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "4a18f35ff5d6a9b7a07e955bd64418282c6a91b2"
  },
  "after": {
    "claimId": "claim_0b999bb17fb999e00f51a138af84c8a2",
    "sourceUnitDigest": "f553a3334af338a1e4d76df5657adc8ac73d99d8971bd031043545b288db1cc7",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "L10-3: retain AGENTS.md#unheaded-block-5 as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f, pinned at 59b9b70876324e07135db53d2351f7db6a7e1746. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewNote": "mechanical: full digests recomputed by the extractor at 345f15d95 and equal to the shard and the pack; source anchor unheaded-block-5 resolves; AGENTS.md sha256 47f3a4e5 equals the rationale pin at 59b9b7087 and at 345f15d95, target none by design; text not read beyond what is stated",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-01-345f15d95.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "currentDecision": {
    "claimId": "claim_0b999bb17fb999e00f51a138af84c8a2",
    "sourceUnitDigest": "f553a3334af338a1e4d76df5657adc8ac73d99d8971bd031043545b288db1cc7",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "L10-3: retain AGENTS.md#unheaded-block-5 as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f, pinned at 59b9b70876324e07135db53d2351f7db6a7e1746. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewNote": "mechanical: full digests recomputed by the extractor at 345f15d95 and equal to the shard and the pack; source anchor unheaded-block-5 resolves; AGENTS.md sha256 47f3a4e5 equals the rationale pin at 59b9b7087 and at 345f15d95, target none by design; text not read beyond what is stated",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-01-345f15d95.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-260"
}
```

## Entry decisions-261

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s10-closing-instructions.json",
  "collection": "claims",
  "claimId": "claim_cace4724d966bb5a40bc0b17768520c1",
  "before": {
    "claimId": "claim_cace4724d966bb5a40bc0b17768520c1",
    "sourceUnitDigest": "7e4431ca6a7e941fe10d3962f79815b135aeb90897d2ab15817a4e7a903bd2a7",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "L10-3: retain AGENTS.md#unheaded-block-50 as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f, pinned at 59b9b70876324e07135db53d2351f7db6a7e1746. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewNote": "mechanical: AGENTS.md#unheaded-block-50 digest recomputed by the extractor at 19ca8de23 and at HEAD equals the shown digest, anchor resolves, target none, rationale SHA256 47f3a4e5 at pin 59b9b7087 equals the committed file; unit text was not read",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-03-19ca8de23.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "4a18f35ff5d6a9b7a07e955bd64418282c6a91b2"
  },
  "after": {
    "claimId": "claim_cace4724d966bb5a40bc0b17768520c1",
    "sourceUnitDigest": "7e4431ca6a7e941fe10d3962f79815b135aeb90897d2ab15817a4e7a903bd2a7",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "L10-3: retain AGENTS.md#unheaded-block-50 as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f, pinned at 59b9b70876324e07135db53d2351f7db6a7e1746. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewNote": "mechanical: full digests recomputed by the extractor at 345f15d95 and equal to the shard and the pack; source anchor unheaded-block-50 resolves; AGENTS.md sha256 47f3a4e5 equals the rationale pin at 59b9b7087 and at 345f15d95, target none by design; text not read beyond what is stated",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-01-345f15d95.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "currentDecision": {
    "claimId": "claim_cace4724d966bb5a40bc0b17768520c1",
    "sourceUnitDigest": "7e4431ca6a7e941fe10d3962f79815b135aeb90897d2ab15817a4e7a903bd2a7",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "L10-3: retain AGENTS.md#unheaded-block-50 as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f, pinned at 59b9b70876324e07135db53d2351f7db6a7e1746. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewNote": "mechanical: full digests recomputed by the extractor at 345f15d95 and equal to the shard and the pack; source anchor unheaded-block-50 resolves; AGENTS.md sha256 47f3a4e5 equals the rationale pin at 59b9b7087 and at 345f15d95, target none by design; text not read beyond what is stated",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-01-345f15d95.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-261"
}
```

## Entry decisions-262

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s10-closing-instructions.json",
  "collection": "claims",
  "claimId": "claim_07e83f30731906c4f25c96625cd95e26",
  "before": {
    "claimId": "claim_07e83f30731906c4f25c96625cd95e26",
    "sourceUnitDigest": "e9d6edc10b3656ef6f99a50549a6fd76c6a6010c62040c5ea6a8d61c753da3cc",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "L10-3: retain AGENTS.md#unheaded-block-51 as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f, pinned at 59b9b70876324e07135db53d2351f7db6a7e1746. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewNote": "deep: sampled; the unit text at L283-290 (- **L1 — Hai vật lý của tri thức: Log vs) is present verbatim in AGENTS.md at HEAD, digest recomputed by the extractor equals the shown one, anchor unheaded-block-51 resolves, target none, rationale pin 59b9b7087 gives SHA256 47f3a4e5 which equals the committed AGENTS.md; retain-only so nothing is lost or added",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-03-19ca8de23.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "4a18f35ff5d6a9b7a07e955bd64418282c6a91b2"
  },
  "after": {
    "claimId": "claim_07e83f30731906c4f25c96625cd95e26",
    "sourceUnitDigest": "e9d6edc10b3656ef6f99a50549a6fd76c6a6010c62040c5ea6a8d61c753da3cc",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "L10-3: retain AGENTS.md#unheaded-block-51 as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f, pinned at 59b9b70876324e07135db53d2351f7db6a7e1746. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewNote": "mechanical: full digests recomputed by the extractor at 345f15d95 and equal to the shard and the pack; source anchor unheaded-block-51 resolves; AGENTS.md sha256 47f3a4e5 equals the rationale pin at 59b9b7087 and at 345f15d95, target none by design; text not read beyond what is stated",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-01-345f15d95.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "currentDecision": {
    "claimId": "claim_07e83f30731906c4f25c96625cd95e26",
    "sourceUnitDigest": "e9d6edc10b3656ef6f99a50549a6fd76c6a6010c62040c5ea6a8d61c753da3cc",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "L10-3: retain AGENTS.md#unheaded-block-51 as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f, pinned at 59b9b70876324e07135db53d2351f7db6a7e1746. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewNote": "mechanical: full digests recomputed by the extractor at 345f15d95 and equal to the shard and the pack; source anchor unheaded-block-51 resolves; AGENTS.md sha256 47f3a4e5 equals the rationale pin at 59b9b7087 and at 345f15d95, target none by design; text not read beyond what is stated",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-01-345f15d95.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-262"
}
```

## Entry decisions-263

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s10-closing-instructions.json",
  "collection": "claims",
  "claimId": "claim_4c8b5dcba297831ece58a92091e942d6",
  "before": {
    "claimId": "claim_4c8b5dcba297831ece58a92091e942d6",
    "sourceUnitDigest": "f4b273ed312216976ee427785fccce89a1aaf29fe108f4af626cab39ee1b70fb",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "L10-3: retain AGENTS.md#unheaded-block-52 as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f, pinned at 59b9b70876324e07135db53d2351f7db6a7e1746. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewNote": "mechanical: AGENTS.md#unheaded-block-52 digest recomputed by the extractor at 19ca8de23 and at HEAD equals the shown digest, anchor resolves, target none, rationale SHA256 47f3a4e5 at pin 59b9b7087 equals the committed file; unit text was not read",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-03-19ca8de23.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "4a18f35ff5d6a9b7a07e955bd64418282c6a91b2"
  },
  "after": {
    "claimId": "claim_4c8b5dcba297831ece58a92091e942d6",
    "sourceUnitDigest": "f4b273ed312216976ee427785fccce89a1aaf29fe108f4af626cab39ee1b70fb",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "L10-3: retain AGENTS.md#unheaded-block-52 as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f, pinned at 59b9b70876324e07135db53d2351f7db6a7e1746. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewNote": "deep: read AGENTS.md#unheaded-block-52 (Authoritative statements, rationales, evidence sou); digest recomputed at 345f15d95 equals the shown one, unit still present at that anchor, target none by design so nothing lost or added; rationale pin SHA256 47f3a4e5 equals AGENTS.md at 59b9b7087 and 345f15d95; independently recomputed in Python (seed 20261018)",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-01-345f15d95.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "currentDecision": {
    "claimId": "claim_4c8b5dcba297831ece58a92091e942d6",
    "sourceUnitDigest": "f4b273ed312216976ee427785fccce89a1aaf29fe108f4af626cab39ee1b70fb",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "L10-3: retain AGENTS.md#unheaded-block-52 as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f, pinned at 59b9b70876324e07135db53d2351f7db6a7e1746. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewNote": "deep: read AGENTS.md#unheaded-block-52 (Authoritative statements, rationales, evidence sou); digest recomputed at 345f15d95 equals the shown one, unit still present at that anchor, target none by design so nothing lost or added; rationale pin SHA256 47f3a4e5 equals AGENTS.md at 59b9b7087 and 345f15d95; independently recomputed in Python (seed 20261018)",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-01-345f15d95.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-263"
}
```

## Entry decisions-264

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s10-closing-instructions.json",
  "collection": "claims",
  "claimId": "claim_e59f80485141f1b75d155dca7272c34e",
  "before": {
    "claimId": "claim_e59f80485141f1b75d155dca7272c34e",
    "sourceUnitDigest": "040484693fc054f7b37f6dc489b6295d3ccc3df440c68ceea04c9584ccf4b144",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "L10-3: retain AGENTS.md#unheaded-block-53 as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f, pinned at 59b9b70876324e07135db53d2351f7db6a7e1746. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewNote": "deep: sampled; the unit text at L294-294 (<!-- fgos:instruction-projection:end -->) is present verbatim in AGENTS.md at HEAD, digest recomputed by the extractor and by hand sha256 of the lines equals the shown one, anchor unheaded-block-53 resolves, target none, rationale pin 59b9b7087 gives SHA256 47f3a4e5 which equals the committed AGENTS.md; retain-only so nothing is lost or added",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-03-19ca8de23.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "4a18f35ff5d6a9b7a07e955bd64418282c6a91b2"
  },
  "after": {
    "claimId": "claim_e59f80485141f1b75d155dca7272c34e",
    "sourceUnitDigest": "040484693fc054f7b37f6dc489b6295d3ccc3df440c68ceea04c9584ccf4b144",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "L10-3: retain AGENTS.md#unheaded-block-53 as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f, pinned at 59b9b70876324e07135db53d2351f7db6a7e1746. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewNote": "deep: read AGENTS.md#unheaded-block-53 (<!-- fgos:instruction-projection:end -->); digest recomputed at 345f15d95 equals the shown one, unit still present at that anchor, target none by design so nothing lost or added; rationale pin SHA256 47f3a4e5 equals AGENTS.md at 59b9b7087 and 345f15d95",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-01-345f15d95.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "currentDecision": {
    "claimId": "claim_e59f80485141f1b75d155dca7272c34e",
    "sourceUnitDigest": "040484693fc054f7b37f6dc489b6295d3ccc3df440c68ceea04c9584ccf4b144",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "L10-3: retain AGENTS.md#unheaded-block-53 as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f, pinned at 59b9b70876324e07135db53d2351f7db6a7e1746. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewNote": "deep: read AGENTS.md#unheaded-block-53 (<!-- fgos:instruction-projection:end -->); digest recomputed at 345f15d95 equals the shown one, unit still present at that anchor, target none by design so nothing lost or added; rationale pin SHA256 47f3a4e5 equals AGENTS.md at 59b9b7087 and 345f15d95",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-01-345f15d95.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-264"
}
```

## Entry decisions-265

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s10-closing-instructions.json",
  "collection": "claims",
  "claimId": "claim_77dd0bf33d012bb3b23d9a8e8f0f7d3e",
  "before": {
    "claimId": "claim_77dd0bf33d012bb3b23d9a8e8f0f7d3e",
    "sourceUnitDigest": "60091b05c3c7e85182c3645da54621b6e3b9fdb4da2666cdd5ede92dbe6c9b9a",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "L10-3: retain AGENTS.md#unheaded-block-6 as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f, pinned at 59b9b70876324e07135db53d2351f7db6a7e1746. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewNote": "mechanical: AGENTS.md#unheaded-block-6 digest recomputed by the extractor at 19ca8de23 and at HEAD equals the shown digest, anchor resolves, target none, rationale SHA256 47f3a4e5 at pin 59b9b7087 equals the committed file; unit text was not read",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-03-19ca8de23.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "4a18f35ff5d6a9b7a07e955bd64418282c6a91b2"
  },
  "after": {
    "claimId": "claim_77dd0bf33d012bb3b23d9a8e8f0f7d3e",
    "sourceUnitDigest": "60091b05c3c7e85182c3645da54621b6e3b9fdb4da2666cdd5ede92dbe6c9b9a",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "L10-3: retain AGENTS.md#unheaded-block-6 as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f, pinned at 59b9b70876324e07135db53d2351f7db6a7e1746. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewNote": "mechanical: full digests recomputed by the extractor at 345f15d95 and equal to the shard and the pack; source anchor unheaded-block-6 resolves; AGENTS.md sha256 47f3a4e5 equals the rationale pin at 59b9b7087 and at 345f15d95, target none by design; text not read beyond what is stated",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-01-345f15d95.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "currentDecision": {
    "claimId": "claim_77dd0bf33d012bb3b23d9a8e8f0f7d3e",
    "sourceUnitDigest": "60091b05c3c7e85182c3645da54621b6e3b9fdb4da2666cdd5ede92dbe6c9b9a",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "L10-3: retain AGENTS.md#unheaded-block-6 as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f, pinned at 59b9b70876324e07135db53d2351f7db6a7e1746. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewNote": "mechanical: full digests recomputed by the extractor at 345f15d95 and equal to the shard and the pack; source anchor unheaded-block-6 resolves; AGENTS.md sha256 47f3a4e5 equals the rationale pin at 59b9b7087 and at 345f15d95, target none by design; text not read beyond what is stated",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-01-345f15d95.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-265"
}
```

## Entry decisions-266

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s10-closing-instructions.json",
  "collection": "claims",
  "claimId": "claim_f5c89fb59effe1dbfc4f83d06a78aefa",
  "before": {
    "claimId": "claim_f5c89fb59effe1dbfc4f83d06a78aefa",
    "sourceUnitDigest": "2f43e6ba7d13c017035a4295381b83e9a4d21eaf658d0c1f90f4bbf9608c137f",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "L10-3: retain AGENTS.md#unheaded-block-7 as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f, pinned at 59b9b70876324e07135db53d2351f7db6a7e1746. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewNote": "mechanical: AGENTS.md#unheaded-block-7 digest recomputed by the extractor at 19ca8de23 and at HEAD equals the shown digest, anchor resolves, target none, rationale SHA256 47f3a4e5 at pin 59b9b7087 equals the committed file; unit text was not read",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-03-19ca8de23.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "4a18f35ff5d6a9b7a07e955bd64418282c6a91b2"
  },
  "after": {
    "claimId": "claim_f5c89fb59effe1dbfc4f83d06a78aefa",
    "sourceUnitDigest": "2f43e6ba7d13c017035a4295381b83e9a4d21eaf658d0c1f90f4bbf9608c137f",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "L10-3: retain AGENTS.md#unheaded-block-7 as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f, pinned at 59b9b70876324e07135db53d2351f7db6a7e1746. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewNote": "mechanical: full digests recomputed by the extractor at 345f15d95 and equal to the shard and the pack; source anchor unheaded-block-7 resolves; AGENTS.md sha256 47f3a4e5 equals the rationale pin at 59b9b7087 and at 345f15d95, target none by design; independently recomputed in Python (seed 20261018); text not read beyond what is stated",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-01-345f15d95.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "currentDecision": {
    "claimId": "claim_f5c89fb59effe1dbfc4f83d06a78aefa",
    "sourceUnitDigest": "2f43e6ba7d13c017035a4295381b83e9a4d21eaf658d0c1f90f4bbf9608c137f",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "L10-3: retain AGENTS.md#unheaded-block-7 as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f, pinned at 59b9b70876324e07135db53d2351f7db6a7e1746. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewNote": "mechanical: full digests recomputed by the extractor at 345f15d95 and equal to the shard and the pack; source anchor unheaded-block-7 resolves; AGENTS.md sha256 47f3a4e5 equals the rationale pin at 59b9b7087 and at 345f15d95, target none by design; independently recomputed in Python (seed 20261018); text not read beyond what is stated",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-01-345f15d95.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-266"
}
```

## Entry decisions-267

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s10-closing-instructions.json",
  "collection": "claims",
  "claimId": "claim_a719410d0483e23da77bdbc36c01983a",
  "before": {
    "claimId": "claim_a719410d0483e23da77bdbc36c01983a",
    "sourceUnitDigest": "0423f98e178718c6acb150ab0fe91edf12bdcbaac258e1c213aeb912fd1d625f",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "L10-3: retain AGENTS.md#unheaded-block-8 as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f, pinned at 59b9b70876324e07135db53d2351f7db6a7e1746. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewNote": "mechanical: AGENTS.md#unheaded-block-8 digest recomputed by the extractor at 19ca8de23 and at HEAD equals the shown digest, anchor resolves, target none, rationale SHA256 47f3a4e5 at pin 59b9b7087 equals the committed file; unit text was not read",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-03-19ca8de23.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "4a18f35ff5d6a9b7a07e955bd64418282c6a91b2"
  },
  "after": {
    "claimId": "claim_a719410d0483e23da77bdbc36c01983a",
    "sourceUnitDigest": "0423f98e178718c6acb150ab0fe91edf12bdcbaac258e1c213aeb912fd1d625f",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "L10-3: retain AGENTS.md#unheaded-block-8 as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f, pinned at 59b9b70876324e07135db53d2351f7db6a7e1746. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewNote": "mechanical: full digests recomputed by the extractor at 345f15d95 and equal to the shard and the pack; source anchor unheaded-block-8 resolves; AGENTS.md sha256 47f3a4e5 equals the rationale pin at 59b9b7087 and at 345f15d95, target none by design; text not read beyond what is stated",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-01-345f15d95.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "currentDecision": {
    "claimId": "claim_a719410d0483e23da77bdbc36c01983a",
    "sourceUnitDigest": "0423f98e178718c6acb150ab0fe91edf12bdcbaac258e1c213aeb912fd1d625f",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "L10-3: retain AGENTS.md#unheaded-block-8 as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f, pinned at 59b9b70876324e07135db53d2351f7db6a7e1746. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewNote": "mechanical: full digests recomputed by the extractor at 345f15d95 and equal to the shard and the pack; source anchor unheaded-block-8 resolves; AGENTS.md sha256 47f3a4e5 equals the rationale pin at 59b9b7087 and at 345f15d95, target none by design; text not read beyond what is stated",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-01-345f15d95.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-267"
}
```

## Entry decisions-268

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s10-closing-instructions.json",
  "collection": "claims",
  "claimId": "claim_5225c43306e2c6004040bcdc1c833b9b",
  "before": {
    "claimId": "claim_5225c43306e2c6004040bcdc1c833b9b",
    "sourceUnitDigest": "4c9c8cc9ca45762d287d773c9625e674f5eed86e549fceb7f42325667a575d80",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "L10-3: retain AGENTS.md#unheaded-block-9 as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f, pinned at 59b9b70876324e07135db53d2351f7db6a7e1746. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewNote": "mechanical: AGENTS.md#unheaded-block-9 digest recomputed by the extractor at 19ca8de23 and at HEAD equals the shown digest, anchor resolves, target none, rationale SHA256 47f3a4e5 at pin 59b9b7087 equals the committed file; unit text was not read",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-03-19ca8de23.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "4a18f35ff5d6a9b7a07e955bd64418282c6a91b2"
  },
  "after": {
    "claimId": "claim_5225c43306e2c6004040bcdc1c833b9b",
    "sourceUnitDigest": "4c9c8cc9ca45762d287d773c9625e674f5eed86e549fceb7f42325667a575d80",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "L10-3: retain AGENTS.md#unheaded-block-9 as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f, pinned at 59b9b70876324e07135db53d2351f7db6a7e1746. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewNote": "mechanical: full digests recomputed by the extractor at 345f15d95 and equal to the shard and the pack; source anchor unheaded-block-9 resolves; AGENTS.md sha256 47f3a4e5 equals the rationale pin at 59b9b7087 and at 345f15d95, target none by design; text not read beyond what is stated",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-01-345f15d95.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "currentDecision": {
    "claimId": "claim_5225c43306e2c6004040bcdc1c833b9b",
    "sourceUnitDigest": "4c9c8cc9ca45762d287d773c9625e674f5eed86e549fceb7f42325667a575d80",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "L10-3: retain AGENTS.md#unheaded-block-9 as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f, pinned at 59b9b70876324e07135db53d2351f7db6a7e1746. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewNote": "mechanical: full digests recomputed by the extractor at 345f15d95 and equal to the shard and the pack; source anchor unheaded-block-9 resolves; AGENTS.md sha256 47f3a4e5 equals the rationale pin at 59b9b7087 and at 345f15d95, target none by design; text not read beyond what is stated",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-01-345f15d95.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-268"
}
```

## Entry decisions-269

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s10-closing-instructions.json",
  "collection": "claims",
  "claimId": "claim_33fda3508cbed38745f7b6796ea65709",
  "before": {
    "claimId": "claim_33fda3508cbed38745f7b6796ea65709",
    "sourceUnitDigest": "64aa23ebc68629f08a1537e7c3249b810327ec02c53a5ad2d4c98589bd174a3e",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "L10-3: retain AGENTS.md#using-cli-fallback as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f, pinned at 59b9b70876324e07135db53d2351f7db6a7e1746. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewNote": "deep: sampled; the unit text at L199-199 (### Using CLI fallback) is present verbatim in AGENTS.md at HEAD, digest recomputed by the extractor equals the shown one, anchor using-cli-fallback resolves, target none, rationale pin 59b9b7087 gives SHA256 47f3a4e5 which equals the committed AGENTS.md; retain-only so nothing is lost or added",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-03-19ca8de23.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "4a18f35ff5d6a9b7a07e955bd64418282c6a91b2"
  },
  "after": {
    "claimId": "claim_33fda3508cbed38745f7b6796ea65709",
    "sourceUnitDigest": "64aa23ebc68629f08a1537e7c3249b810327ec02c53a5ad2d4c98589bd174a3e",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "L10-3: retain AGENTS.md#using-cli-fallback as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f, pinned at 59b9b70876324e07135db53d2351f7db6a7e1746. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewNote": "deep: read AGENTS.md#using-cli-fallback (### Using CLI fallback ```sh mdview open <absolute); digest recomputed at 345f15d95 equals the shown one, unit still present at that anchor, target none by design so nothing lost or added; rationale pin SHA256 47f3a4e5 equals AGENTS.md at 59b9b7087 and 345f15d95",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-01-345f15d95.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "currentDecision": {
    "claimId": "claim_33fda3508cbed38745f7b6796ea65709",
    "sourceUnitDigest": "64aa23ebc68629f08a1537e7c3249b810327ec02c53a5ad2d4c98589bd174a3e",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "L10-3: retain AGENTS.md#using-cli-fallback as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f, pinned at 59b9b70876324e07135db53d2351f7db6a7e1746. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewNote": "deep: read AGENTS.md#using-cli-fallback (### Using CLI fallback ```sh mdview open <absolute); digest recomputed at 345f15d95 equals the shown one, unit still present at that anchor, target none by design so nothing lost or added; rationale pin SHA256 47f3a4e5 equals AGENTS.md at 59b9b7087 and 345f15d95",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-01-345f15d95.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-269"
}
```

## Entry decisions-270

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s10-closing-instructions.json",
  "collection": "claims",
  "claimId": "claim_9f129b46b75d0c4d4e7119da265c74b0",
  "before": {
    "claimId": "claim_9f129b46b75d0c4d4e7119da265c74b0",
    "sourceUnitDigest": "c1a9ae0dbb63cc6b9d2cdd56221d17c475fa8a12f90a2d9fe4d742ffbeddae51",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "L10-3: retain AGENTS.md#using-mcp-preferred as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f, pinned at 59b9b70876324e07135db53d2351f7db6a7e1746. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewNote": "mechanical: AGENTS.md#using-mcp-preferred digest recomputed by the extractor at 19ca8de23 and at HEAD equals the shown digest, anchor resolves, target none, rationale SHA256 47f3a4e5 at pin 59b9b7087 equals the committed file; unit text was not read",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-03-19ca8de23.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "4a18f35ff5d6a9b7a07e955bd64418282c6a91b2"
  },
  "after": {
    "claimId": "claim_9f129b46b75d0c4d4e7119da265c74b0",
    "sourceUnitDigest": "c1a9ae0dbb63cc6b9d2cdd56221d17c475fa8a12f90a2d9fe4d742ffbeddae51",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "L10-3: retain AGENTS.md#using-mcp-preferred as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f, pinned at 59b9b70876324e07135db53d2351f7db6a7e1746. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewNote": "mechanical: full digests recomputed by the extractor at 345f15d95 and equal to the shard and the pack; source anchor using-mcp-preferred resolves; AGENTS.md sha256 47f3a4e5 equals the rationale pin at 59b9b7087 and at 345f15d95, target none by design; text not read beyond what is stated",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-01-345f15d95.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "currentDecision": {
    "claimId": "claim_9f129b46b75d0c4d4e7119da265c74b0",
    "sourceUnitDigest": "c1a9ae0dbb63cc6b9d2cdd56221d17c475fa8a12f90a2d9fe4d742ffbeddae51",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "L10-3: retain AGENTS.md#using-mcp-preferred as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f, pinned at 59b9b70876324e07135db53d2351f7db6a7e1746. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewNote": "mechanical: full digests recomputed by the extractor at 345f15d95 and equal to the shard and the pack; source anchor using-mcp-preferred resolves; AGENTS.md sha256 47f3a4e5 equals the rationale pin at 59b9b7087 and at 345f15d95, target none by design; text not read beyond what is stated",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-01-345f15d95.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-270"
}
```

## Entry decisions-271

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s10-closing-instructions.json",
  "collection": "claims",
  "claimId": "claim_73ca3e1b87514a160d7114e22318f1e9",
  "before": {
    "claimId": "claim_73ca3e1b87514a160d7114e22318f1e9",
    "sourceUnitDigest": "b8596a3138791147b0ffa9b666027206135a910a94b7c8391467f8559fdb7828",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "L10-3: retain AGENTS.md#when-to-render as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f, pinned at 59b9b70876324e07135db53d2351f7db6a7e1746. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewNote": "deep: sampled; the unit text at L205-205 (### When to render) is present verbatim in AGENTS.md at HEAD, digest recomputed by the extractor equals the shown one, anchor when-to-render resolves, target none, rationale pin 59b9b7087 gives SHA256 47f3a4e5 which equals the committed AGENTS.md; retain-only so nothing is lost or added",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-03-19ca8de23.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "4a18f35ff5d6a9b7a07e955bd64418282c6a91b2"
  },
  "after": {
    "claimId": "claim_73ca3e1b87514a160d7114e22318f1e9",
    "sourceUnitDigest": "b8596a3138791147b0ffa9b666027206135a910a94b7c8391467f8559fdb7828",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "L10-3: retain AGENTS.md#when-to-render as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f, pinned at 59b9b70876324e07135db53d2351f7db6a7e1746. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewNote": "mechanical: full digests recomputed by the extractor at 345f15d95 and equal to the shard and the pack; source anchor when-to-render resolves; AGENTS.md sha256 47f3a4e5 equals the rationale pin at 59b9b7087 and at 345f15d95, target none by design; text not read beyond what is stated",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-01-345f15d95.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "currentDecision": {
    "claimId": "claim_73ca3e1b87514a160d7114e22318f1e9",
    "sourceUnitDigest": "b8596a3138791147b0ffa9b666027206135a910a94b7c8391467f8559fdb7828",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "L10-3: retain AGENTS.md#when-to-render as always-loaded instruction source outside platform doc authority; native identity retained; no truth certification. Current source-file SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f, pinned at 59b9b70876324e07135db53d2351f7db6a7e1746. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewNote": "mechanical: full digests recomputed by the extractor at 345f15d95 and equal to the shard and the pack; source anchor when-to-render resolves; AGENTS.md sha256 47f3a4e5 equals the rationale pin at 59b9b7087 and at 345f15d95, target none by design; text not read beyond what is stated",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-01-345f15d95.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-271"
}
```

## Entry decisions-273

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s10-closing-instructions.json",
  "collection": "registryGaps",
  "claimId": "claim_3de04e2fc7142ed6f2d1d6639e4c3dda",
  "before": {
    "claimId": "claim_3de04e2fc7142ed6f2d1d6639e4c3dda",
    "sourcePath": "AGENTS.md",
    "sourceAnchor": "unheaded-block-10",
    "sourceUnitDigest": "3e31a6424a4469dd4a7d238a9113fca9ab926a0deacd65b4192f36dd1c4c6d89",
    "disposition": "reclassify-out-of-platform-scope",
    "rationale": "L10-3: claim_3de04e2fc7142ed6f2d1d6639e4c3dda records the historical native instruction identity AGENTS.md#unheaded-block-10 (digest 3e31a6424a4469dd4a7d238a9113fca9ab926a0deacd65b4192f36dd1c4c6d89). The root instruction file remains the always-loaded owner outside platform documentation authority. The historical anchor names this predecessor, not a claim that its old text is the current unit at the same numbered anchor. Retain native predecessor/successor identities without creating a platform copy, target owner or truth certificate. Reclassify-out-of-platform-scope pending independent review; no historical approval is carried. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewStatus": "reviewed",
    "targetOwner": null,
    "targetAnchor": null,
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "deep: historical identity AGENTS.md#unheaded-block-10; the witness text (L43-49, f33612119) hashes to the shown digest, is present in AGENTS.md at that commit and the rationale states plainly that the old text is not claimed to be the current unit at this anchor; target none, nothing carried, pin SHA256 47f3a4e5 checked",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-03-19ca8de23.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "4a18f35ff5d6a9b7a07e955bd64418282c6a91b2"
  },
  "after": {
    "claimId": "claim_3de04e2fc7142ed6f2d1d6639e4c3dda",
    "sourcePath": "AGENTS.md",
    "sourceAnchor": "unheaded-block-10",
    "sourceUnitDigest": "3e31a6424a4469dd4a7d238a9113fca9ab926a0deacd65b4192f36dd1c4c6d89",
    "disposition": "reclassify-out-of-platform-scope",
    "rationale": "L10-3: claim_3de04e2fc7142ed6f2d1d6639e4c3dda records the historical native instruction identity AGENTS.md#unheaded-block-10 (digest 3e31a6424a4469dd4a7d238a9113fca9ab926a0deacd65b4192f36dd1c4c6d89). The root instruction file remains the always-loaded owner outside platform documentation authority. The historical anchor names this predecessor, not a claim that its old text is the current unit at the same numbered anchor. Retain native predecessor/successor identities without creating a platform copy, target owner or truth certificate. Reclassify-out-of-platform-scope pending independent review; no historical approval is carried. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewStatus": "reviewed",
    "targetOwner": null,
    "targetAnchor": null,
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "mechanical: full digests recomputed by the extractor at 345f15d95 and equal to the shard and the pack; source anchor unheaded-block-10 resolves; AGENTS.md sha256 47f3a4e5 equals the rationale pin at 59b9b7087 and at 345f15d95, target none by design; witness digest taken from the pack witness at f33612119; text not read beyond what is stated",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-01-345f15d95.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "currentDecision": {
    "claimId": "claim_3de04e2fc7142ed6f2d1d6639e4c3dda",
    "sourcePath": "AGENTS.md",
    "sourceAnchor": "unheaded-block-10",
    "sourceUnitDigest": "3e31a6424a4469dd4a7d238a9113fca9ab926a0deacd65b4192f36dd1c4c6d89",
    "disposition": "reclassify-out-of-platform-scope",
    "rationale": "L10-3: claim_3de04e2fc7142ed6f2d1d6639e4c3dda records the historical native instruction identity AGENTS.md#unheaded-block-10 (digest 3e31a6424a4469dd4a7d238a9113fca9ab926a0deacd65b4192f36dd1c4c6d89). The root instruction file remains the always-loaded owner outside platform documentation authority. The historical anchor names this predecessor, not a claim that its old text is the current unit at the same numbered anchor. Retain native predecessor/successor identities without creating a platform copy, target owner or truth certificate. Reclassify-out-of-platform-scope pending independent review; no historical approval is carried. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewStatus": "reviewed",
    "targetOwner": null,
    "targetAnchor": null,
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "mechanical: full digests recomputed by the extractor at 345f15d95 and equal to the shard and the pack; source anchor unheaded-block-10 resolves; AGENTS.md sha256 47f3a4e5 equals the rationale pin at 59b9b7087 and at 345f15d95, target none by design; witness digest taken from the pack witness at f33612119; text not read beyond what is stated",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-01-345f15d95.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-273"
}
```

## Entry decisions-274

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s10-closing-instructions.json",
  "collection": "registryGaps",
  "claimId": "claim_d8880e475680012ef18a447f529e9d4f",
  "before": {
    "claimId": "claim_d8880e475680012ef18a447f529e9d4f",
    "sourcePath": "AGENTS.md",
    "sourceAnchor": "unheaded-block-12",
    "sourceUnitDigest": "29f993be5c8705744b12957cb1dfd328fc338ca8d6a368c78876e8d82d8f4109",
    "disposition": "reclassify-out-of-platform-scope",
    "rationale": "L10-3: claim_d8880e475680012ef18a447f529e9d4f records the historical native instruction identity AGENTS.md#unheaded-block-12 (digest 29f993be5c8705744b12957cb1dfd328fc338ca8d6a368c78876e8d82d8f4109). The root instruction file remains the always-loaded owner outside platform documentation authority. The historical anchor names this predecessor, not a claim that its old text is the current unit at the same numbered anchor. Retain native predecessor/successor identities without creating a platform copy, target owner or truth certificate. Reclassify-out-of-platform-scope pending independent review; no historical approval is carried. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewStatus": "reviewed",
    "targetOwner": null,
    "targetAnchor": null,
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "deep: historical identity AGENTS.md#unheaded-block-12; the witness text (L54-66, 5df843bdb) hashes to the shown digest, is present in AGENTS.md at that commit and the rationale states plainly that the old text is not claimed to be the current unit at this anchor; target none, nothing carried, pin SHA256 47f3a4e5 checked",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-03-19ca8de23.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "4a18f35ff5d6a9b7a07e955bd64418282c6a91b2"
  },
  "after": {
    "claimId": "claim_d8880e475680012ef18a447f529e9d4f",
    "sourcePath": "AGENTS.md",
    "sourceAnchor": "unheaded-block-12",
    "sourceUnitDigest": "29f993be5c8705744b12957cb1dfd328fc338ca8d6a368c78876e8d82d8f4109",
    "disposition": "reclassify-out-of-platform-scope",
    "rationale": "L10-3: claim_d8880e475680012ef18a447f529e9d4f records the historical native instruction identity AGENTS.md#unheaded-block-12 (digest 29f993be5c8705744b12957cb1dfd328fc338ca8d6a368c78876e8d82d8f4109). The root instruction file remains the always-loaded owner outside platform documentation authority. The historical anchor names this predecessor, not a claim that its old text is the current unit at the same numbered anchor. Retain native predecessor/successor identities without creating a platform copy, target owner or truth certificate. Reclassify-out-of-platform-scope pending independent review; no historical approval is carried. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewStatus": "reviewed",
    "targetOwner": null,
    "targetAnchor": null,
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "deep: historical AGENTS.md identity unheaded-block-12; witness text at 5df843bdb read (1. **What to read first?** `docs/specs/readin) and hashes to the shown digest; the rationale says plainly the old text is not the current unit at that anchor; target none, nothing carried; AGENTS.md sha256 47f3a4e5 equals the pin at 59b9b7087 and at 345f15d95",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-01-345f15d95.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "currentDecision": {
    "claimId": "claim_d8880e475680012ef18a447f529e9d4f",
    "sourcePath": "AGENTS.md",
    "sourceAnchor": "unheaded-block-12",
    "sourceUnitDigest": "29f993be5c8705744b12957cb1dfd328fc338ca8d6a368c78876e8d82d8f4109",
    "disposition": "reclassify-out-of-platform-scope",
    "rationale": "L10-3: claim_d8880e475680012ef18a447f529e9d4f records the historical native instruction identity AGENTS.md#unheaded-block-12 (digest 29f993be5c8705744b12957cb1dfd328fc338ca8d6a368c78876e8d82d8f4109). The root instruction file remains the always-loaded owner outside platform documentation authority. The historical anchor names this predecessor, not a claim that its old text is the current unit at the same numbered anchor. Retain native predecessor/successor identities without creating a platform copy, target owner or truth certificate. Reclassify-out-of-platform-scope pending independent review; no historical approval is carried. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewStatus": "reviewed",
    "targetOwner": null,
    "targetAnchor": null,
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "deep: historical AGENTS.md identity unheaded-block-12; witness text at 5df843bdb read (1. **What to read first?** `docs/specs/readin) and hashes to the shown digest; the rationale says plainly the old text is not the current unit at that anchor; target none, nothing carried; AGENTS.md sha256 47f3a4e5 equals the pin at 59b9b7087 and at 345f15d95",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-01-345f15d95.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-274"
}
```

## Entry decisions-275

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s10-closing-instructions.json",
  "collection": "registryGaps",
  "claimId": "claim_903d53d47d24348c7f74569a2b68db7e",
  "before": {
    "claimId": "claim_903d53d47d24348c7f74569a2b68db7e",
    "sourcePath": "AGENTS.md",
    "sourceAnchor": "unheaded-block-13",
    "sourceUnitDigest": "91cfb1a76c93278e5944afad4fc06073798af2103066f2558cd659de938d3ec3",
    "disposition": "reclassify-out-of-platform-scope",
    "rationale": "L10-3: claim_903d53d47d24348c7f74569a2b68db7e records the historical native instruction identity AGENTS.md#unheaded-block-13 (digest 91cfb1a76c93278e5944afad4fc06073798af2103066f2558cd659de938d3ec3). The root instruction file remains the always-loaded owner outside platform documentation authority. The historical anchor names this predecessor, not a claim that its old text is the current unit at the same numbered anchor. Retain native predecessor/successor identities without creating a platform copy, target owner or truth certificate. Reclassify-out-of-platform-scope pending independent review; no historical approval is carried. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewStatus": "reviewed",
    "targetOwner": null,
    "targetAnchor": null,
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "deep: historical identity AGENTS.md#unheaded-block-13; the witness text (L70-70, 5df843bdb) hashes to the shown digest, is present in AGENTS.md at that commit and the rationale states plainly that the old text is not claimed to be the current unit at this anchor; target none, nothing carried, pin SHA256 47f3a4e5 checked",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-03-19ca8de23.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "4a18f35ff5d6a9b7a07e955bd64418282c6a91b2"
  },
  "after": {
    "claimId": "claim_903d53d47d24348c7f74569a2b68db7e",
    "sourcePath": "AGENTS.md",
    "sourceAnchor": "unheaded-block-13",
    "sourceUnitDigest": "91cfb1a76c93278e5944afad4fc06073798af2103066f2558cd659de938d3ec3",
    "disposition": "reclassify-out-of-platform-scope",
    "rationale": "L10-3: claim_903d53d47d24348c7f74569a2b68db7e records the historical native instruction identity AGENTS.md#unheaded-block-13 (digest 91cfb1a76c93278e5944afad4fc06073798af2103066f2558cd659de938d3ec3). The root instruction file remains the always-loaded owner outside platform documentation authority. The historical anchor names this predecessor, not a claim that its old text is the current unit at the same numbered anchor. Retain native predecessor/successor identities without creating a platform copy, target owner or truth certificate. Reclassify-out-of-platform-scope pending independent review; no historical approval is carried. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewStatus": "reviewed",
    "targetOwner": null,
    "targetAnchor": null,
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "mechanical: full digests recomputed by the extractor at 345f15d95 and equal to the shard and the pack; source anchor unheaded-block-13 resolves; AGENTS.md sha256 47f3a4e5 equals the rationale pin at 59b9b7087 and at 345f15d95, target none by design; witness digest taken from the pack witness at 5df843bdb; text not read beyond what is stated",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-01-345f15d95.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "currentDecision": {
    "claimId": "claim_903d53d47d24348c7f74569a2b68db7e",
    "sourcePath": "AGENTS.md",
    "sourceAnchor": "unheaded-block-13",
    "sourceUnitDigest": "91cfb1a76c93278e5944afad4fc06073798af2103066f2558cd659de938d3ec3",
    "disposition": "reclassify-out-of-platform-scope",
    "rationale": "L10-3: claim_903d53d47d24348c7f74569a2b68db7e records the historical native instruction identity AGENTS.md#unheaded-block-13 (digest 91cfb1a76c93278e5944afad4fc06073798af2103066f2558cd659de938d3ec3). The root instruction file remains the always-loaded owner outside platform documentation authority. The historical anchor names this predecessor, not a claim that its old text is the current unit at the same numbered anchor. Retain native predecessor/successor identities without creating a platform copy, target owner or truth certificate. Reclassify-out-of-platform-scope pending independent review; no historical approval is carried. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewStatus": "reviewed",
    "targetOwner": null,
    "targetAnchor": null,
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "mechanical: full digests recomputed by the extractor at 345f15d95 and equal to the shard and the pack; source anchor unheaded-block-13 resolves; AGENTS.md sha256 47f3a4e5 equals the rationale pin at 59b9b7087 and at 345f15d95, target none by design; witness digest taken from the pack witness at 5df843bdb; text not read beyond what is stated",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-01-345f15d95.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-275"
}
```

## Entry decisions-276

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s10-closing-instructions.json",
  "collection": "registryGaps",
  "claimId": "claim_4bc8eb18f4e9c507c2f05a9467a16b4c",
  "before": {
    "claimId": "claim_4bc8eb18f4e9c507c2f05a9467a16b4c",
    "sourcePath": "AGENTS.md",
    "sourceAnchor": "unheaded-block-20",
    "sourceUnitDigest": "227ca5a5e89112140bd9827bb072840016509dd62d8868ad83d5feccd5715906",
    "disposition": "reclassify-out-of-platform-scope",
    "rationale": "L10-3: claim_4bc8eb18f4e9c507c2f05a9467a16b4c records the historical native instruction identity AGENTS.md#unheaded-block-20 (digest 227ca5a5e89112140bd9827bb072840016509dd62d8868ad83d5feccd5715906). The root instruction file remains the always-loaded owner outside platform documentation authority. The historical anchor names this predecessor, not a claim that its old text is the current unit at the same numbered anchor. Retain native predecessor/successor identities without creating a platform copy, target owner or truth certificate. Reclassify-out-of-platform-scope pending independent review; no historical approval is carried. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewStatus": "reviewed",
    "targetOwner": null,
    "targetAnchor": null,
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "deep: historical identity AGENTS.md#unheaded-block-20; the witness text (L159-162, 2300d6557) hashes to the shown digest, is present in AGENTS.md at that commit and the rationale states plainly that the old text is not claimed to be the current unit at this anchor; target none, nothing carried, pin SHA256 47f3a4e5 checked",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-03-19ca8de23.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "4a18f35ff5d6a9b7a07e955bd64418282c6a91b2"
  },
  "after": {
    "claimId": "claim_4bc8eb18f4e9c507c2f05a9467a16b4c",
    "sourcePath": "AGENTS.md",
    "sourceAnchor": "unheaded-block-20",
    "sourceUnitDigest": "227ca5a5e89112140bd9827bb072840016509dd62d8868ad83d5feccd5715906",
    "disposition": "reclassify-out-of-platform-scope",
    "rationale": "L10-3: claim_4bc8eb18f4e9c507c2f05a9467a16b4c records the historical native instruction identity AGENTS.md#unheaded-block-20 (digest 227ca5a5e89112140bd9827bb072840016509dd62d8868ad83d5feccd5715906). The root instruction file remains the always-loaded owner outside platform documentation authority. The historical anchor names this predecessor, not a claim that its old text is the current unit at the same numbered anchor. Retain native predecessor/successor identities without creating a platform copy, target owner or truth certificate. Reclassify-out-of-platform-scope pending independent review; no historical approval is carried. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewStatus": "reviewed",
    "targetOwner": null,
    "targetAnchor": null,
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "mechanical: full digests recomputed by the extractor at 345f15d95 and equal to the shard and the pack; source anchor unheaded-block-20 resolves; AGENTS.md sha256 47f3a4e5 equals the rationale pin at 59b9b7087 and at 345f15d95, target none by design; witness digest taken from the pack witness at 345f15d95; text not read beyond what is stated",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-01-345f15d95.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "currentDecision": {
    "claimId": "claim_4bc8eb18f4e9c507c2f05a9467a16b4c",
    "sourcePath": "AGENTS.md",
    "sourceAnchor": "unheaded-block-20",
    "sourceUnitDigest": "227ca5a5e89112140bd9827bb072840016509dd62d8868ad83d5feccd5715906",
    "disposition": "reclassify-out-of-platform-scope",
    "rationale": "L10-3: claim_4bc8eb18f4e9c507c2f05a9467a16b4c records the historical native instruction identity AGENTS.md#unheaded-block-20 (digest 227ca5a5e89112140bd9827bb072840016509dd62d8868ad83d5feccd5715906). The root instruction file remains the always-loaded owner outside platform documentation authority. The historical anchor names this predecessor, not a claim that its old text is the current unit at the same numbered anchor. Retain native predecessor/successor identities without creating a platform copy, target owner or truth certificate. Reclassify-out-of-platform-scope pending independent review; no historical approval is carried. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewStatus": "reviewed",
    "targetOwner": null,
    "targetAnchor": null,
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "mechanical: full digests recomputed by the extractor at 345f15d95 and equal to the shard and the pack; source anchor unheaded-block-20 resolves; AGENTS.md sha256 47f3a4e5 equals the rationale pin at 59b9b7087 and at 345f15d95, target none by design; witness digest taken from the pack witness at 345f15d95; text not read beyond what is stated",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-01-345f15d95.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-276"
}
```

## Entry decisions-277

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s10-closing-instructions.json",
  "collection": "registryGaps",
  "claimId": "claim_8e643b64b72bef823e75904425fc6d07",
  "before": {
    "claimId": "claim_8e643b64b72bef823e75904425fc6d07",
    "sourcePath": "AGENTS.md",
    "sourceAnchor": "unheaded-block-20",
    "sourceUnitDigest": "2921133d68f4ba5dfc0428f6e63c3eafc839091ef150a7d174a7ec0925bb185e",
    "disposition": "reclassify-out-of-platform-scope",
    "rationale": "L10-3: claim_8e643b64b72bef823e75904425fc6d07 records the historical native instruction identity AGENTS.md#unheaded-block-20 (digest 2921133d68f4ba5dfc0428f6e63c3eafc839091ef150a7d174a7ec0925bb185e). The root instruction file remains the always-loaded owner outside platform documentation authority. The historical anchor names this predecessor, not a claim that its old text is the current unit at the same numbered anchor. Retain native predecessor/successor identities without creating a platform copy, target owner or truth certificate. Reclassify-out-of-platform-scope pending independent review; no historical approval is carried. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewStatus": "reviewed",
    "targetOwner": null,
    "targetAnchor": null,
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "deep: historical identity AGENTS.md#unheaded-block-20; the witness text (L136-140, b33876bce) hashes to the shown digest by hand sha256 as well, is present in AGENTS.md at that commit and the rationale states plainly that the old text is not claimed to be the current unit at this anchor; target none, nothing carried, pin SHA256 47f3a4e5 checked",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-03-19ca8de23.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "4a18f35ff5d6a9b7a07e955bd64418282c6a91b2"
  },
  "after": {
    "claimId": "claim_8e643b64b72bef823e75904425fc6d07",
    "sourcePath": "AGENTS.md",
    "sourceAnchor": "unheaded-block-20",
    "sourceUnitDigest": "2921133d68f4ba5dfc0428f6e63c3eafc839091ef150a7d174a7ec0925bb185e",
    "disposition": "reclassify-out-of-platform-scope",
    "rationale": "L10-3: claim_8e643b64b72bef823e75904425fc6d07 records the historical native instruction identity AGENTS.md#unheaded-block-20 (digest 2921133d68f4ba5dfc0428f6e63c3eafc839091ef150a7d174a7ec0925bb185e). The root instruction file remains the always-loaded owner outside platform documentation authority. The historical anchor names this predecessor, not a claim that its old text is the current unit at the same numbered anchor. Retain native predecessor/successor identities without creating a platform copy, target owner or truth certificate. Reclassify-out-of-platform-scope pending independent review; no historical approval is carried. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewStatus": "reviewed",
    "targetOwner": null,
    "targetAnchor": null,
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "mechanical: full digests recomputed by the extractor at 345f15d95 and equal to the shard and the pack; source anchor unheaded-block-20 resolves; AGENTS.md sha256 47f3a4e5 equals the rationale pin at 59b9b7087 and at 345f15d95, target none by design; witness digest taken from the pack witness at b33876bce; text not read beyond what is stated",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-01-345f15d95.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "currentDecision": {
    "claimId": "claim_8e643b64b72bef823e75904425fc6d07",
    "sourcePath": "AGENTS.md",
    "sourceAnchor": "unheaded-block-20",
    "sourceUnitDigest": "2921133d68f4ba5dfc0428f6e63c3eafc839091ef150a7d174a7ec0925bb185e",
    "disposition": "reclassify-out-of-platform-scope",
    "rationale": "L10-3: claim_8e643b64b72bef823e75904425fc6d07 records the historical native instruction identity AGENTS.md#unheaded-block-20 (digest 2921133d68f4ba5dfc0428f6e63c3eafc839091ef150a7d174a7ec0925bb185e). The root instruction file remains the always-loaded owner outside platform documentation authority. The historical anchor names this predecessor, not a claim that its old text is the current unit at the same numbered anchor. Retain native predecessor/successor identities without creating a platform copy, target owner or truth certificate. Reclassify-out-of-platform-scope pending independent review; no historical approval is carried. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewStatus": "reviewed",
    "targetOwner": null,
    "targetAnchor": null,
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "mechanical: full digests recomputed by the extractor at 345f15d95 and equal to the shard and the pack; source anchor unheaded-block-20 resolves; AGENTS.md sha256 47f3a4e5 equals the rationale pin at 59b9b7087 and at 345f15d95, target none by design; witness digest taken from the pack witness at b33876bce; text not read beyond what is stated",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-01-345f15d95.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-277"
}
```

## Entry decisions-278

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s10-closing-instructions.json",
  "collection": "registryGaps",
  "claimId": "claim_0bf7d168f64e5d7bf9add3470f4b6ec4",
  "before": {
    "claimId": "claim_0bf7d168f64e5d7bf9add3470f4b6ec4",
    "sourcePath": "AGENTS.md",
    "sourceAnchor": "unheaded-block-23",
    "sourceUnitDigest": "d7739e01344e0690261be6b9b224533f7adeae09df56f59f5cd8d474aad51207",
    "disposition": "reclassify-out-of-platform-scope",
    "rationale": "L10-3: claim_0bf7d168f64e5d7bf9add3470f4b6ec4 records the historical native instruction identity AGENTS.md#unheaded-block-23 (digest d7739e01344e0690261be6b9b224533f7adeae09df56f59f5cd8d474aad51207). The root instruction file remains the always-loaded owner outside platform documentation authority. The historical anchor names this predecessor, not a claim that its old text is the current unit at the same numbered anchor. Retain native predecessor/successor identities without creating a platform copy, target owner or truth certificate. Reclassify-out-of-platform-scope pending independent review; no historical approval is carried. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewStatus": "reviewed",
    "targetOwner": null,
    "targetAnchor": null,
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "deep: historical identity AGENTS.md#unheaded-block-23; the witness text (L155-155, fba5d0426) hashes to the shown digest, is present in AGENTS.md at that commit and the rationale states plainly that the old text is not claimed to be the current unit at this anchor; target none, nothing carried, pin SHA256 47f3a4e5 checked",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-03-19ca8de23.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "4a18f35ff5d6a9b7a07e955bd64418282c6a91b2"
  },
  "after": {
    "claimId": "claim_0bf7d168f64e5d7bf9add3470f4b6ec4",
    "sourcePath": "AGENTS.md",
    "sourceAnchor": "unheaded-block-23",
    "sourceUnitDigest": "d7739e01344e0690261be6b9b224533f7adeae09df56f59f5cd8d474aad51207",
    "disposition": "reclassify-out-of-platform-scope",
    "rationale": "L10-3: claim_0bf7d168f64e5d7bf9add3470f4b6ec4 records the historical native instruction identity AGENTS.md#unheaded-block-23 (digest d7739e01344e0690261be6b9b224533f7adeae09df56f59f5cd8d474aad51207). The root instruction file remains the always-loaded owner outside platform documentation authority. The historical anchor names this predecessor, not a claim that its old text is the current unit at the same numbered anchor. Retain native predecessor/successor identities without creating a platform copy, target owner or truth certificate. Reclassify-out-of-platform-scope pending independent review; no historical approval is carried. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewStatus": "reviewed",
    "targetOwner": null,
    "targetAnchor": null,
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "deep: historical AGENTS.md identity unheaded-block-23; witness text at fba5d0426 read (**Before dispatching any task out of the curr) and hashes to the shown digest; the rationale says plainly the old text is not the current unit at that anchor; target none, nothing carried; AGENTS.md sha256 47f3a4e5 equals the pin at 59b9b7087 and at 345f15d95",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-01-345f15d95.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "currentDecision": {
    "claimId": "claim_0bf7d168f64e5d7bf9add3470f4b6ec4",
    "sourcePath": "AGENTS.md",
    "sourceAnchor": "unheaded-block-23",
    "sourceUnitDigest": "d7739e01344e0690261be6b9b224533f7adeae09df56f59f5cd8d474aad51207",
    "disposition": "reclassify-out-of-platform-scope",
    "rationale": "L10-3: claim_0bf7d168f64e5d7bf9add3470f4b6ec4 records the historical native instruction identity AGENTS.md#unheaded-block-23 (digest d7739e01344e0690261be6b9b224533f7adeae09df56f59f5cd8d474aad51207). The root instruction file remains the always-loaded owner outside platform documentation authority. The historical anchor names this predecessor, not a claim that its old text is the current unit at the same numbered anchor. Retain native predecessor/successor identities without creating a platform copy, target owner or truth certificate. Reclassify-out-of-platform-scope pending independent review; no historical approval is carried. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewStatus": "reviewed",
    "targetOwner": null,
    "targetAnchor": null,
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "deep: historical AGENTS.md identity unheaded-block-23; witness text at fba5d0426 read (**Before dispatching any task out of the curr) and hashes to the shown digest; the rationale says plainly the old text is not the current unit at that anchor; target none, nothing carried; AGENTS.md sha256 47f3a4e5 equals the pin at 59b9b7087 and at 345f15d95",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-01-345f15d95.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-278"
}
```

## Entry decisions-279

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s10-closing-instructions.json",
  "collection": "registryGaps",
  "claimId": "claim_47e8159f8179edd8e17fd67c744d1e89",
  "before": {
    "claimId": "claim_47e8159f8179edd8e17fd67c744d1e89",
    "sourcePath": "AGENTS.md",
    "sourceAnchor": "unheaded-block-25",
    "sourceUnitDigest": "0f92ddb61556abcd67763a48ab1ad339f83d77aab6c2f4b399ef7418672b5a09",
    "disposition": "reclassify-out-of-platform-scope",
    "rationale": "L10-3: claim_47e8159f8179edd8e17fd67c744d1e89 records the historical native instruction identity AGENTS.md#unheaded-block-25 (digest 0f92ddb61556abcd67763a48ab1ad339f83d77aab6c2f4b399ef7418672b5a09). The root instruction file remains the always-loaded owner outside platform documentation authority. The historical anchor names this predecessor, not a claim that its old text is the current unit at the same numbered anchor. Retain native predecessor/successor identities without creating a platform copy, target owner or truth certificate. Reclassify-out-of-platform-scope pending independent review; no historical approval is carried. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewStatus": "reviewed",
    "targetOwner": null,
    "targetAnchor": null,
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "deep: historical identity AGENTS.md#unheaded-block-25; the witness text (L159-162, ab8cd3fc9) hashes to the shown digest, is present in AGENTS.md at that commit and the rationale states plainly that the old text is not claimed to be the current unit at this anchor; target none, nothing carried, pin SHA256 47f3a4e5 checked",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-03-19ca8de23.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "4a18f35ff5d6a9b7a07e955bd64418282c6a91b2"
  },
  "after": {
    "claimId": "claim_47e8159f8179edd8e17fd67c744d1e89",
    "sourcePath": "AGENTS.md",
    "sourceAnchor": "unheaded-block-25",
    "sourceUnitDigest": "0f92ddb61556abcd67763a48ab1ad339f83d77aab6c2f4b399ef7418672b5a09",
    "disposition": "reclassify-out-of-platform-scope",
    "rationale": "L10-3: claim_47e8159f8179edd8e17fd67c744d1e89 records the historical native instruction identity AGENTS.md#unheaded-block-25 (digest 0f92ddb61556abcd67763a48ab1ad339f83d77aab6c2f4b399ef7418672b5a09). The root instruction file remains the always-loaded owner outside platform documentation authority. The historical anchor names this predecessor, not a claim that its old text is the current unit at the same numbered anchor. Retain native predecessor/successor identities without creating a platform copy, target owner or truth certificate. Reclassify-out-of-platform-scope pending independent review; no historical approval is carried. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewStatus": "reviewed",
    "targetOwner": null,
    "targetAnchor": null,
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "mechanical: full digests recomputed by the extractor at 345f15d95 and equal to the shard and the pack; source anchor unheaded-block-25 resolves; AGENTS.md sha256 47f3a4e5 equals the rationale pin at 59b9b7087 and at 345f15d95, target none by design; witness digest taken from the pack witness at ab8cd3fc9; text not read beyond what is stated",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-01-345f15d95.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "currentDecision": {
    "claimId": "claim_47e8159f8179edd8e17fd67c744d1e89",
    "sourcePath": "AGENTS.md",
    "sourceAnchor": "unheaded-block-25",
    "sourceUnitDigest": "0f92ddb61556abcd67763a48ab1ad339f83d77aab6c2f4b399ef7418672b5a09",
    "disposition": "reclassify-out-of-platform-scope",
    "rationale": "L10-3: claim_47e8159f8179edd8e17fd67c744d1e89 records the historical native instruction identity AGENTS.md#unheaded-block-25 (digest 0f92ddb61556abcd67763a48ab1ad339f83d77aab6c2f4b399ef7418672b5a09). The root instruction file remains the always-loaded owner outside platform documentation authority. The historical anchor names this predecessor, not a claim that its old text is the current unit at the same numbered anchor. Retain native predecessor/successor identities without creating a platform copy, target owner or truth certificate. Reclassify-out-of-platform-scope pending independent review; no historical approval is carried. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewStatus": "reviewed",
    "targetOwner": null,
    "targetAnchor": null,
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "mechanical: full digests recomputed by the extractor at 345f15d95 and equal to the shard and the pack; source anchor unheaded-block-25 resolves; AGENTS.md sha256 47f3a4e5 equals the rationale pin at 59b9b7087 and at 345f15d95, target none by design; witness digest taken from the pack witness at ab8cd3fc9; text not read beyond what is stated",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-01-345f15d95.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-279"
}
```

## Entry decisions-280

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s10-closing-instructions.json",
  "collection": "registryGaps",
  "claimId": "claim_56d2e0f6f92f0430dab1e197c01d67ad",
  "before": {
    "claimId": "claim_56d2e0f6f92f0430dab1e197c01d67ad",
    "sourcePath": "AGENTS.md",
    "sourceAnchor": "unheaded-block-25",
    "sourceUnitDigest": "3502656dc385cc030c054352caaca9a331d186bfc1470f990ac9126fa1f86d45",
    "disposition": "reclassify-out-of-platform-scope",
    "rationale": "L10-3: claim_56d2e0f6f92f0430dab1e197c01d67ad records the historical native instruction identity AGENTS.md#unheaded-block-25 (digest 3502656dc385cc030c054352caaca9a331d186bfc1470f990ac9126fa1f86d45). The root instruction file remains the always-loaded owner outside platform documentation authority. The historical anchor names this predecessor, not a claim that its old text is the current unit at the same numbered anchor. Retain native predecessor/successor identities without creating a platform copy, target owner or truth certificate. Reclassify-out-of-platform-scope pending independent review; no historical approval is carried. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewStatus": "reviewed",
    "targetOwner": null,
    "targetAnchor": null,
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "deep: historical identity AGENTS.md#unheaded-block-25; the witness text (L120-120, 120af6b3d) hashes to the shown digest, is present in AGENTS.md at that commit and the rationale states plainly that the old text is not claimed to be the current unit at this anchor; target none, nothing carried, pin SHA256 47f3a4e5 checked",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-03-19ca8de23.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "4a18f35ff5d6a9b7a07e955bd64418282c6a91b2"
  },
  "after": {
    "claimId": "claim_56d2e0f6f92f0430dab1e197c01d67ad",
    "sourcePath": "AGENTS.md",
    "sourceAnchor": "unheaded-block-25",
    "sourceUnitDigest": "3502656dc385cc030c054352caaca9a331d186bfc1470f990ac9126fa1f86d45",
    "disposition": "reclassify-out-of-platform-scope",
    "rationale": "L10-3: claim_56d2e0f6f92f0430dab1e197c01d67ad records the historical native instruction identity AGENTS.md#unheaded-block-25 (digest 3502656dc385cc030c054352caaca9a331d186bfc1470f990ac9126fa1f86d45). The root instruction file remains the always-loaded owner outside platform documentation authority. The historical anchor names this predecessor, not a claim that its old text is the current unit at the same numbered anchor. Retain native predecessor/successor identities without creating a platform copy, target owner or truth certificate. Reclassify-out-of-platform-scope pending independent review; no historical approval is carried. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewStatus": "reviewed",
    "targetOwner": null,
    "targetAnchor": null,
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "mechanical: full digests recomputed by the extractor at 345f15d95 and equal to the shard and the pack; source anchor unheaded-block-25 resolves; AGENTS.md sha256 47f3a4e5 equals the rationale pin at 59b9b7087 and at 345f15d95, target none by design; witness digest taken from the pack witness at 120af6b3d; independently recomputed in Python (seed 20261018); text not read beyond what is stated",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-01-345f15d95.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "currentDecision": {
    "claimId": "claim_56d2e0f6f92f0430dab1e197c01d67ad",
    "sourcePath": "AGENTS.md",
    "sourceAnchor": "unheaded-block-25",
    "sourceUnitDigest": "3502656dc385cc030c054352caaca9a331d186bfc1470f990ac9126fa1f86d45",
    "disposition": "reclassify-out-of-platform-scope",
    "rationale": "L10-3: claim_56d2e0f6f92f0430dab1e197c01d67ad records the historical native instruction identity AGENTS.md#unheaded-block-25 (digest 3502656dc385cc030c054352caaca9a331d186bfc1470f990ac9126fa1f86d45). The root instruction file remains the always-loaded owner outside platform documentation authority. The historical anchor names this predecessor, not a claim that its old text is the current unit at the same numbered anchor. Retain native predecessor/successor identities without creating a platform copy, target owner or truth certificate. Reclassify-out-of-platform-scope pending independent review; no historical approval is carried. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewStatus": "reviewed",
    "targetOwner": null,
    "targetAnchor": null,
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "mechanical: full digests recomputed by the extractor at 345f15d95 and equal to the shard and the pack; source anchor unheaded-block-25 resolves; AGENTS.md sha256 47f3a4e5 equals the rationale pin at 59b9b7087 and at 345f15d95, target none by design; witness digest taken from the pack witness at 120af6b3d; independently recomputed in Python (seed 20261018); text not read beyond what is stated",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-01-345f15d95.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-280"
}
```

## Entry decisions-281

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s10-closing-instructions.json",
  "collection": "registryGaps",
  "claimId": "claim_a55aa524e35b109695acc79c3c4d7c75",
  "before": {
    "claimId": "claim_a55aa524e35b109695acc79c3c4d7c75",
    "sourcePath": "AGENTS.md",
    "sourceAnchor": "unheaded-block-26",
    "sourceUnitDigest": "d3121f545f6a84c5ffe0eea34fff6dbaf7578c9c6573ecfda87214959a872021",
    "disposition": "reclassify-out-of-platform-scope",
    "rationale": "L10-3: claim_a55aa524e35b109695acc79c3c4d7c75 records the historical native instruction identity AGENTS.md#unheaded-block-26 (digest d3121f545f6a84c5ffe0eea34fff6dbaf7578c9c6573ecfda87214959a872021). The root instruction file remains the always-loaded owner outside platform documentation authority. The historical anchor names this predecessor, not a claim that its old text is the current unit at the same numbered anchor. Retain native predecessor/successor identities without creating a platform copy, target owner or truth certificate. Reclassify-out-of-platform-scope pending independent review; no historical approval is carried. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewStatus": "reviewed",
    "targetOwner": null,
    "targetAnchor": null,
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "mechanical: historical AGENTS.md#unheaded-block-26 has no witness text (stated limitation kept from the earlier accepted review), so its digest could not be recomputed from text; the shown digest equals the rationale digest, the anchor resolves, target none, pin SHA256 47f3a4e5 equals the committed file; no text approved",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-03-19ca8de23.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "4a18f35ff5d6a9b7a07e955bd64418282c6a91b2"
  },
  "after": {
    "claimId": "claim_a55aa524e35b109695acc79c3c4d7c75",
    "sourcePath": "AGENTS.md",
    "sourceAnchor": "unheaded-block-26",
    "sourceUnitDigest": "d3121f545f6a84c5ffe0eea34fff6dbaf7578c9c6573ecfda87214959a872021",
    "disposition": "reclassify-out-of-platform-scope",
    "rationale": "L10-3: claim_a55aa524e35b109695acc79c3c4d7c75 records the historical native instruction identity AGENTS.md#unheaded-block-26 (digest d3121f545f6a84c5ffe0eea34fff6dbaf7578c9c6573ecfda87214959a872021). The root instruction file remains the always-loaded owner outside platform documentation authority. The historical anchor names this predecessor, not a claim that its old text is the current unit at the same numbered anchor. Retain native predecessor/successor identities without creating a platform copy, target owner or truth certificate. Reclassify-out-of-platform-scope pending independent review; no historical approval is carried. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewStatus": "reviewed",
    "targetOwner": null,
    "targetAnchor": null,
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "deep: historical AGENTS.md identity unheaded-block-26 has no witness text (stated limitation), so the digest cannot be recomputed from text; shard digest equals the rationale digest, target none, nothing carried; AGENTS.md sha256 47f3a4e5 equals the pin at 59b9b7087 and at 345f15d95; no text approved",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-01-345f15d95.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "currentDecision": {
    "claimId": "claim_a55aa524e35b109695acc79c3c4d7c75",
    "sourcePath": "AGENTS.md",
    "sourceAnchor": "unheaded-block-26",
    "sourceUnitDigest": "d3121f545f6a84c5ffe0eea34fff6dbaf7578c9c6573ecfda87214959a872021",
    "disposition": "reclassify-out-of-platform-scope",
    "rationale": "L10-3: claim_a55aa524e35b109695acc79c3c4d7c75 records the historical native instruction identity AGENTS.md#unheaded-block-26 (digest d3121f545f6a84c5ffe0eea34fff6dbaf7578c9c6573ecfda87214959a872021). The root instruction file remains the always-loaded owner outside platform documentation authority. The historical anchor names this predecessor, not a claim that its old text is the current unit at the same numbered anchor. Retain native predecessor/successor identities without creating a platform copy, target owner or truth certificate. Reclassify-out-of-platform-scope pending independent review; no historical approval is carried. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewStatus": "reviewed",
    "targetOwner": null,
    "targetAnchor": null,
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "deep: historical AGENTS.md identity unheaded-block-26 has no witness text (stated limitation), so the digest cannot be recomputed from text; shard digest equals the rationale digest, target none, nothing carried; AGENTS.md sha256 47f3a4e5 equals the pin at 59b9b7087 and at 345f15d95; no text approved",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-01-345f15d95.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-281"
}
```

## Entry decisions-282

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s10-closing-instructions.json",
  "collection": "registryGaps",
  "claimId": "claim_adc150a41d48dfde06422405a5b0f277",
  "before": {
    "claimId": "claim_adc150a41d48dfde06422405a5b0f277",
    "sourcePath": "AGENTS.md",
    "sourceAnchor": "unheaded-block-30",
    "sourceUnitDigest": "e19ff915b019695296a84779c61f78737d18266ded2094e5f712297bbb701861",
    "disposition": "reclassify-out-of-platform-scope",
    "rationale": "L10-3: claim_adc150a41d48dfde06422405a5b0f277 records the historical native instruction identity AGENTS.md#unheaded-block-30 (digest e19ff915b019695296a84779c61f78737d18266ded2094e5f712297bbb701861). The root instruction file remains the always-loaded owner outside platform documentation authority. The historical anchor names this predecessor, not a claim that its old text is the current unit at the same numbered anchor. Retain native predecessor/successor identities without creating a platform copy, target owner or truth certificate. Reclassify-out-of-platform-scope pending independent review; no historical approval is carried. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewStatus": "reviewed",
    "targetOwner": null,
    "targetAnchor": null,
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "mechanical: historical AGENTS.md#unheaded-block-30 has no witness text (stated limitation kept from the earlier accepted review), so its digest could not be recomputed from text; the shown digest equals the rationale digest, the anchor resolves, target none, pin SHA256 47f3a4e5 equals the committed file; no text approved",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-03-19ca8de23.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "4a18f35ff5d6a9b7a07e955bd64418282c6a91b2"
  },
  "after": {
    "claimId": "claim_adc150a41d48dfde06422405a5b0f277",
    "sourcePath": "AGENTS.md",
    "sourceAnchor": "unheaded-block-30",
    "sourceUnitDigest": "e19ff915b019695296a84779c61f78737d18266ded2094e5f712297bbb701861",
    "disposition": "reclassify-out-of-platform-scope",
    "rationale": "L10-3: claim_adc150a41d48dfde06422405a5b0f277 records the historical native instruction identity AGENTS.md#unheaded-block-30 (digest e19ff915b019695296a84779c61f78737d18266ded2094e5f712297bbb701861). The root instruction file remains the always-loaded owner outside platform documentation authority. The historical anchor names this predecessor, not a claim that its old text is the current unit at the same numbered anchor. Retain native predecessor/successor identities without creating a platform copy, target owner or truth certificate. Reclassify-out-of-platform-scope pending independent review; no historical approval is carried. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewStatus": "reviewed",
    "targetOwner": null,
    "targetAnchor": null,
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "deep: historical AGENTS.md identity unheaded-block-30 has no witness text (stated limitation), so the digest cannot be recomputed from text; shard digest equals the rationale digest, target none, nothing carried; AGENTS.md sha256 47f3a4e5 equals the pin at 59b9b7087 and at 345f15d95; no text approved",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-01-345f15d95.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "currentDecision": {
    "claimId": "claim_adc150a41d48dfde06422405a5b0f277",
    "sourcePath": "AGENTS.md",
    "sourceAnchor": "unheaded-block-30",
    "sourceUnitDigest": "e19ff915b019695296a84779c61f78737d18266ded2094e5f712297bbb701861",
    "disposition": "reclassify-out-of-platform-scope",
    "rationale": "L10-3: claim_adc150a41d48dfde06422405a5b0f277 records the historical native instruction identity AGENTS.md#unheaded-block-30 (digest e19ff915b019695296a84779c61f78737d18266ded2094e5f712297bbb701861). The root instruction file remains the always-loaded owner outside platform documentation authority. The historical anchor names this predecessor, not a claim that its old text is the current unit at the same numbered anchor. Retain native predecessor/successor identities without creating a platform copy, target owner or truth certificate. Reclassify-out-of-platform-scope pending independent review; no historical approval is carried. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewStatus": "reviewed",
    "targetOwner": null,
    "targetAnchor": null,
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "deep: historical AGENTS.md identity unheaded-block-30 has no witness text (stated limitation), so the digest cannot be recomputed from text; shard digest equals the rationale digest, target none, nothing carried; AGENTS.md sha256 47f3a4e5 equals the pin at 59b9b7087 and at 345f15d95; no text approved",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-01-345f15d95.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-282"
}
```

## Entry decisions-283

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s10-closing-instructions.json",
  "collection": "registryGaps",
  "claimId": "claim_39027736ba305981f20a973555300669",
  "before": {
    "claimId": "claim_39027736ba305981f20a973555300669",
    "sourcePath": "AGENTS.md",
    "sourceAnchor": "unheaded-block-4",
    "sourceUnitDigest": "5bc803f5f5d7289345ff1ae9ce0619a5417e0d7d5b9c452c9496b0e190a7da23",
    "disposition": "reclassify-out-of-platform-scope",
    "rationale": "L10-3: claim_39027736ba305981f20a973555300669 records the historical native instruction identity AGENTS.md#unheaded-block-4 (digest 5bc803f5f5d7289345ff1ae9ce0619a5417e0d7d5b9c452c9496b0e190a7da23). The root instruction file remains the always-loaded owner outside platform documentation authority. The historical anchor names this predecessor, not a claim that its old text is the current unit at the same numbered anchor. Retain native predecessor/successor identities without creating a platform copy, target owner or truth certificate. Reclassify-out-of-platform-scope pending independent review; no historical approval is carried. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewStatus": "reviewed",
    "targetOwner": null,
    "targetAnchor": null,
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "deep: historical identity AGENTS.md#unheaded-block-4; the witness text (L18-22, 3d3d32648) hashes to the shown digest, is present in AGENTS.md at that commit and the rationale states plainly that the old text is not claimed to be the current unit at this anchor; target none, nothing carried, pin SHA256 47f3a4e5 checked",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-03-19ca8de23.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "4a18f35ff5d6a9b7a07e955bd64418282c6a91b2"
  },
  "after": {
    "claimId": "claim_39027736ba305981f20a973555300669",
    "sourcePath": "AGENTS.md",
    "sourceAnchor": "unheaded-block-4",
    "sourceUnitDigest": "5bc803f5f5d7289345ff1ae9ce0619a5417e0d7d5b9c452c9496b0e190a7da23",
    "disposition": "reclassify-out-of-platform-scope",
    "rationale": "L10-3: claim_39027736ba305981f20a973555300669 records the historical native instruction identity AGENTS.md#unheaded-block-4 (digest 5bc803f5f5d7289345ff1ae9ce0619a5417e0d7d5b9c452c9496b0e190a7da23). The root instruction file remains the always-loaded owner outside platform documentation authority. The historical anchor names this predecessor, not a claim that its old text is the current unit at the same numbered anchor. Retain native predecessor/successor identities without creating a platform copy, target owner or truth certificate. Reclassify-out-of-platform-scope pending independent review; no historical approval is carried. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewStatus": "reviewed",
    "targetOwner": null,
    "targetAnchor": null,
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "mechanical: full digests recomputed by the extractor at 345f15d95 and equal to the shard and the pack; source anchor unheaded-block-4 resolves; AGENTS.md sha256 47f3a4e5 equals the rationale pin at 59b9b7087 and at 345f15d95, target none by design; witness digest taken from the pack witness at 3d3d32648; text not read beyond what is stated",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-01-345f15d95.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "currentDecision": {
    "claimId": "claim_39027736ba305981f20a973555300669",
    "sourcePath": "AGENTS.md",
    "sourceAnchor": "unheaded-block-4",
    "sourceUnitDigest": "5bc803f5f5d7289345ff1ae9ce0619a5417e0d7d5b9c452c9496b0e190a7da23",
    "disposition": "reclassify-out-of-platform-scope",
    "rationale": "L10-3: claim_39027736ba305981f20a973555300669 records the historical native instruction identity AGENTS.md#unheaded-block-4 (digest 5bc803f5f5d7289345ff1ae9ce0619a5417e0d7d5b9c452c9496b0e190a7da23). The root instruction file remains the always-loaded owner outside platform documentation authority. The historical anchor names this predecessor, not a claim that its old text is the current unit at the same numbered anchor. Retain native predecessor/successor identities without creating a platform copy, target owner or truth certificate. Reclassify-out-of-platform-scope pending independent review; no historical approval is carried. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewStatus": "reviewed",
    "targetOwner": null,
    "targetAnchor": null,
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "mechanical: full digests recomputed by the extractor at 345f15d95 and equal to the shard and the pack; source anchor unheaded-block-4 resolves; AGENTS.md sha256 47f3a4e5 equals the rationale pin at 59b9b7087 and at 345f15d95, target none by design; witness digest taken from the pack witness at 3d3d32648; text not read beyond what is stated",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-01-345f15d95.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-283"
}
```

## Entry decisions-284

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s10-closing-instructions.json",
  "collection": "registryGaps",
  "claimId": "claim_f3d9a6f6cc27c52855bc0ce2a3706e2c",
  "before": {
    "claimId": "claim_f3d9a6f6cc27c52855bc0ce2a3706e2c",
    "sourcePath": "AGENTS.md",
    "sourceAnchor": "unheaded-block-4",
    "sourceUnitDigest": "cdd2dfdef553a8b466bbf6f6316228592dd13e9038a90f4eeae2bf8af3b4fb9d",
    "disposition": "reclassify-out-of-platform-scope",
    "rationale": "L10-3: claim_f3d9a6f6cc27c52855bc0ce2a3706e2c records the historical native instruction identity AGENTS.md#unheaded-block-4 (digest cdd2dfdef553a8b466bbf6f6316228592dd13e9038a90f4eeae2bf8af3b4fb9d). The root instruction file remains the always-loaded owner outside platform documentation authority. The historical anchor names this predecessor, not a claim that its old text is the current unit at the same numbered anchor. Retain native predecessor/successor identities without creating a platform copy, target owner or truth certificate. Reclassify-out-of-platform-scope pending independent review; no historical approval is carried. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewStatus": "reviewed",
    "targetOwner": null,
    "targetAnchor": null,
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "deep: historical identity AGENTS.md#unheaded-block-4; the witness text (L18-21, 5df843bdb) hashes to the shown digest, is present in AGENTS.md at that commit and the rationale states plainly that the old text is not claimed to be the current unit at this anchor; target none, nothing carried, pin SHA256 47f3a4e5 checked",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-03-19ca8de23.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "4a18f35ff5d6a9b7a07e955bd64418282c6a91b2"
  },
  "after": {
    "claimId": "claim_f3d9a6f6cc27c52855bc0ce2a3706e2c",
    "sourcePath": "AGENTS.md",
    "sourceAnchor": "unheaded-block-4",
    "sourceUnitDigest": "cdd2dfdef553a8b466bbf6f6316228592dd13e9038a90f4eeae2bf8af3b4fb9d",
    "disposition": "reclassify-out-of-platform-scope",
    "rationale": "L10-3: claim_f3d9a6f6cc27c52855bc0ce2a3706e2c records the historical native instruction identity AGENTS.md#unheaded-block-4 (digest cdd2dfdef553a8b466bbf6f6316228592dd13e9038a90f4eeae2bf8af3b4fb9d). The root instruction file remains the always-loaded owner outside platform documentation authority. The historical anchor names this predecessor, not a claim that its old text is the current unit at the same numbered anchor. Retain native predecessor/successor identities without creating a platform copy, target owner or truth certificate. Reclassify-out-of-platform-scope pending independent review; no historical approval is carried. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewStatus": "reviewed",
    "targetOwner": null,
    "targetAnchor": null,
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "mechanical: full digests recomputed by the extractor at 345f15d95 and equal to the shard and the pack; source anchor unheaded-block-4 resolves; AGENTS.md sha256 47f3a4e5 equals the rationale pin at 59b9b7087 and at 345f15d95, target none by design; witness digest taken from the pack witness at 5df843bdb; text not read beyond what is stated",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-01-345f15d95.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "currentDecision": {
    "claimId": "claim_f3d9a6f6cc27c52855bc0ce2a3706e2c",
    "sourcePath": "AGENTS.md",
    "sourceAnchor": "unheaded-block-4",
    "sourceUnitDigest": "cdd2dfdef553a8b466bbf6f6316228592dd13e9038a90f4eeae2bf8af3b4fb9d",
    "disposition": "reclassify-out-of-platform-scope",
    "rationale": "L10-3: claim_f3d9a6f6cc27c52855bc0ce2a3706e2c records the historical native instruction identity AGENTS.md#unheaded-block-4 (digest cdd2dfdef553a8b466bbf6f6316228592dd13e9038a90f4eeae2bf8af3b4fb9d). The root instruction file remains the always-loaded owner outside platform documentation authority. The historical anchor names this predecessor, not a claim that its old text is the current unit at the same numbered anchor. Retain native predecessor/successor identities without creating a platform copy, target owner or truth certificate. Reclassify-out-of-platform-scope pending independent review; no historical approval is carried. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewStatus": "reviewed",
    "targetOwner": null,
    "targetAnchor": null,
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "mechanical: full digests recomputed by the extractor at 345f15d95 and equal to the shard and the pack; source anchor unheaded-block-4 resolves; AGENTS.md sha256 47f3a4e5 equals the rationale pin at 59b9b7087 and at 345f15d95, target none by design; witness digest taken from the pack witness at 5df843bdb; text not read beyond what is stated",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-01-345f15d95.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-284"
}
```

## Entry decisions-285

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s10-closing-instructions.json",
  "collection": "registryGaps",
  "claimId": "claim_839bc9774b75e893f078d20ecbbb39f0",
  "before": {
    "claimId": "claim_839bc9774b75e893f078d20ecbbb39f0",
    "sourcePath": "AGENTS.md",
    "sourceAnchor": "unheaded-block-43",
    "sourceUnitDigest": "a95a9f895ef3158dcea414aad702a9ed3fedd57533c2e08637853324ab897fc8",
    "disposition": "reclassify-out-of-platform-scope",
    "rationale": "L10-3: claim_839bc9774b75e893f078d20ecbbb39f0 records the historical native instruction identity AGENTS.md#unheaded-block-43 (digest a95a9f895ef3158dcea414aad702a9ed3fedd57533c2e08637853324ab897fc8). The root instruction file remains the always-loaded owner outside platform documentation authority. The historical anchor names this predecessor, not a claim that its old text is the current unit at the same numbered anchor. Retain native predecessor/successor identities without creating a platform copy, target owner or truth certificate. Reclassify-out-of-platform-scope pending independent review; no historical approval is carried. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewStatus": "reviewed",
    "targetOwner": null,
    "targetAnchor": null,
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "mechanical: historical AGENTS.md#unheaded-block-43 has no witness text (stated limitation kept from the earlier accepted review), so its digest could not be recomputed from text; the shown digest equals the rationale digest, the anchor resolves, target none, pin SHA256 47f3a4e5 equals the committed file; no text approved",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-03-19ca8de23.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "4a18f35ff5d6a9b7a07e955bd64418282c6a91b2"
  },
  "after": {
    "claimId": "claim_839bc9774b75e893f078d20ecbbb39f0",
    "sourcePath": "AGENTS.md",
    "sourceAnchor": "unheaded-block-43",
    "sourceUnitDigest": "a95a9f895ef3158dcea414aad702a9ed3fedd57533c2e08637853324ab897fc8",
    "disposition": "reclassify-out-of-platform-scope",
    "rationale": "L10-3: claim_839bc9774b75e893f078d20ecbbb39f0 records the historical native instruction identity AGENTS.md#unheaded-block-43 (digest a95a9f895ef3158dcea414aad702a9ed3fedd57533c2e08637853324ab897fc8). The root instruction file remains the always-loaded owner outside platform documentation authority. The historical anchor names this predecessor, not a claim that its old text is the current unit at the same numbered anchor. Retain native predecessor/successor identities without creating a platform copy, target owner or truth certificate. Reclassify-out-of-platform-scope pending independent review; no historical approval is carried. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewStatus": "reviewed",
    "targetOwner": null,
    "targetAnchor": null,
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "deep: historical AGENTS.md identity unheaded-block-43 has no witness text (stated limitation), so the digest cannot be recomputed from text; shard digest equals the rationale digest and the digest shown, target none, nothing carried; AGENTS.md sha256 47f3a4e5 equals the pin at 59b9b7087 and at 345f15d95; no text approved",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-01-345f15d95.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "currentDecision": {
    "claimId": "claim_839bc9774b75e893f078d20ecbbb39f0",
    "sourcePath": "AGENTS.md",
    "sourceAnchor": "unheaded-block-43",
    "sourceUnitDigest": "a95a9f895ef3158dcea414aad702a9ed3fedd57533c2e08637853324ab897fc8",
    "disposition": "reclassify-out-of-platform-scope",
    "rationale": "L10-3: claim_839bc9774b75e893f078d20ecbbb39f0 records the historical native instruction identity AGENTS.md#unheaded-block-43 (digest a95a9f895ef3158dcea414aad702a9ed3fedd57533c2e08637853324ab897fc8). The root instruction file remains the always-loaded owner outside platform documentation authority. The historical anchor names this predecessor, not a claim that its old text is the current unit at the same numbered anchor. Retain native predecessor/successor identities without creating a platform copy, target owner or truth certificate. Reclassify-out-of-platform-scope pending independent review; no historical approval is carried. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewStatus": "reviewed",
    "targetOwner": null,
    "targetAnchor": null,
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "deep: historical AGENTS.md identity unheaded-block-43 has no witness text (stated limitation), so the digest cannot be recomputed from text; shard digest equals the rationale digest and the digest shown, target none, nothing carried; AGENTS.md sha256 47f3a4e5 equals the pin at 59b9b7087 and at 345f15d95; no text approved",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-01-345f15d95.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-285"
}
```

## Entry decisions-300

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s5-root-mapped-conservation.json",
  "collection": "claims",
  "claimId": "claim_53ebf4b541ff8f6a2c40e3b95304d6b7",
  "before": {
    "claimId": "claim_53ebf4b541ff8f6a2c40e3b95304d6b7",
    "sourceUnitDigest": "2aff5e7721a256efce78953c498af0839f56f0bb5b9918290a36bbc072659eb1",
    "targetOwner": "docs/platform/documentation/operations/portals/docs-portal.md",
    "targetAnchor": "1-read-first",
    "claimKind": "navigation",
    "disposition": "supersede",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "Frozen root map assigns docs/README.md#1-read-first to docs/platform/documentation/operations/portals/docs-portal.md#1-read-first. Carry the complete unit into its candidate portal owner. This unit includes 13 documented link spelling adjustment(s): [doc-governance.md](doc-governance.md) becomes [doc-governance.md](../../../governance.md) (Candidate destination repointed to docs/platform/governance.md; label preserved.); [reading-map.md](reading-map.md) becomes [reading-map.md](../../../../reading-map.md) (Relative spelling changes only; original repository destination conserved.); [platform/README.md](platform/README.md) becomes [platform/README.md](../../../README.md) (Relative spelling changes only; original repository destination conserved.); [specs/reading-map.md](specs/reading-map.md) becomes [specs/reading-map.md](../../../../specs/reading-map.md) (Relative spelling changes only; original repository destination conserved.); [user/](user/) becomes [user/](../../../../user) (Relative spelling changes only; original repository destination conserved.); [how-to/](how-to/) becomes [how-to/](../../../../how-to) (Relative spelling changes only; original repository destination conserved.); [reference/](reference/) becomes [reference/](../../../../reference) (Relative spelling changes only; original repository destination conserved.); [explanation/](explanation/) becomes [explanation/](../../../../explanation) (Relative spelling changes only; original repository destination conserved.); [user/](user/) becomes [user/](../../../../user) (Relative spelling changes only; original repository destination conserved.); [doc-governance.md](doc-governance.md) becomes [doc-governance.md](../../../governance.md) (Candidate destination repointed to docs/platform/governance.md; label preserved.); [reading-map.md](reading-map.md) becomes [reading-map.md](../../../../reading-map.md) (Relative spelling changes only; original repository destination conserved.); [platform/README.md](platform/README.md) becomes [platform/README.md](../../../README.md) (Relative spelling changes only; original repository destination conserved.); [specs/reading-map.md](specs/reading-map.md) becomes [specs/reading-map.md](../../../../specs/reading-map.md) (Relative spelling changes only; original repository destination conserved.). Full source/target text and diff are submitted for independent whole-unit conservation review; wrapping/header/relative-path changes grant no truth approval. No source retirement, promotion or component-boundary change. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by native retained identity. Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding. L10 review correction: the doc-governance link is repointed to docs/platform/governance.md; its original legacy destination is not retained. Label and candidate referent are disclosed; pending independent review.",
    "reviewNote": "deep: answers the earlier rework: repoint of doc-governance.md to platform/governance.md is disclosed; every becomes-pair destination occurs in the target (13 pairs, 8 links, duplicates from the section payload); resolved paths equal except that one link; ok",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-03-19ca8de23.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "16929d439319f41461ebf8f9278446e233b23a3b2450a9b9bd4295b12e1052db",
    "targetAncestry": [
      "fgOS Documentation"
    ],
    "reviewReportCommit": "4a18f35ff5d6a9b7a07e955bd64418282c6a91b2"
  },
  "after": {
    "claimId": "claim_53ebf4b541ff8f6a2c40e3b95304d6b7",
    "sourceUnitDigest": "2aff5e7721a256efce78953c498af0839f56f0bb5b9918290a36bbc072659eb1",
    "targetOwner": "docs/platform/documentation/operations/portals/docs-portal.md",
    "targetAnchor": "1-read-first",
    "claimKind": "navigation",
    "disposition": "supersede",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "Frozen root map assigns docs/README.md#1-read-first to docs/platform/documentation/operations/portals/docs-portal.md#1-read-first. Carry the complete unit into its candidate portal owner. This unit includes 13 documented link spelling adjustment(s): [doc-governance.md](doc-governance.md) becomes [doc-governance.md](../../../governance.md) (Candidate destination repointed to docs/platform/governance.md; label preserved.); [reading-map.md](reading-map.md) becomes [reading-map.md](../../../../reading-map.md) (Relative spelling changes only; original repository destination conserved.); [platform/README.md](platform/README.md) becomes [platform/README.md](../../../README.md) (Relative spelling changes only; original repository destination conserved.); [specs/reading-map.md](specs/reading-map.md) becomes [specs/reading-map.md](../../../../specs/reading-map.md) (Relative spelling changes only; original repository destination conserved.); [user/](user/) becomes [user/](../../../../user) (Relative spelling changes only; original repository destination conserved.); [how-to/](how-to/) becomes [how-to/](../../../../how-to) (Relative spelling changes only; original repository destination conserved.); [reference/](reference/) becomes [reference/](../../../../reference) (Relative spelling changes only; original repository destination conserved.); [explanation/](explanation/) becomes [explanation/](../../../../explanation) (Relative spelling changes only; original repository destination conserved.); [user/](user/) becomes [user/](../../../../user) (Relative spelling changes only; original repository destination conserved.); [doc-governance.md](doc-governance.md) becomes [doc-governance.md](../../../governance.md) (Candidate destination repointed to docs/platform/governance.md; label preserved.); [reading-map.md](reading-map.md) becomes [reading-map.md](../../../../reading-map.md) (Relative spelling changes only; original repository destination conserved.); [platform/README.md](platform/README.md) becomes [platform/README.md](../../../README.md) (Relative spelling changes only; original repository destination conserved.); [specs/reading-map.md](specs/reading-map.md) becomes [specs/reading-map.md](../../../../specs/reading-map.md) (Relative spelling changes only; original repository destination conserved.). Full source/target text and diff are submitted for independent whole-unit conservation review; wrapping/header/relative-path changes grant no truth approval. No source retirement, promotion or component-boundary change. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by native retained identity. Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding. L10 review correction: the doc-governance link is repointed to docs/platform/governance.md; its original legacy destination is not retained. Label and candidate referent are disclosed; pending independent review.",
    "reviewNote": "deep: heading 1 Read First; same 13 link pairs checked by script in both directions, no unlisted link change, governance repoint disclosed; anchor ok",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-02-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "16929d439319f41461ebf8f9278446e233b23a3b2450a9b9bd4295b12e1052db",
    "targetAncestry": [
      "fgOS Documentation"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "currentDecision": {
    "claimId": "claim_53ebf4b541ff8f6a2c40e3b95304d6b7",
    "sourceUnitDigest": "2aff5e7721a256efce78953c498af0839f56f0bb5b9918290a36bbc072659eb1",
    "targetOwner": "docs/platform/documentation/operations/portals/docs-portal.md",
    "targetAnchor": "1-read-first",
    "claimKind": "navigation",
    "disposition": "supersede",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "Frozen root map assigns docs/README.md#1-read-first to docs/platform/documentation/operations/portals/docs-portal.md#1-read-first. Carry the complete unit into its candidate portal owner. This unit includes 13 documented link spelling adjustment(s): [doc-governance.md](doc-governance.md) becomes [doc-governance.md](../../../governance.md) (Candidate destination repointed to docs/platform/governance.md; label preserved.); [reading-map.md](reading-map.md) becomes [reading-map.md](../../../../reading-map.md) (Relative spelling changes only; original repository destination conserved.); [platform/README.md](platform/README.md) becomes [platform/README.md](../../../README.md) (Relative spelling changes only; original repository destination conserved.); [specs/reading-map.md](specs/reading-map.md) becomes [specs/reading-map.md](../../../../specs/reading-map.md) (Relative spelling changes only; original repository destination conserved.); [user/](user/) becomes [user/](../../../../user) (Relative spelling changes only; original repository destination conserved.); [how-to/](how-to/) becomes [how-to/](../../../../how-to) (Relative spelling changes only; original repository destination conserved.); [reference/](reference/) becomes [reference/](../../../../reference) (Relative spelling changes only; original repository destination conserved.); [explanation/](explanation/) becomes [explanation/](../../../../explanation) (Relative spelling changes only; original repository destination conserved.); [user/](user/) becomes [user/](../../../../user) (Relative spelling changes only; original repository destination conserved.); [doc-governance.md](doc-governance.md) becomes [doc-governance.md](../../../governance.md) (Candidate destination repointed to docs/platform/governance.md; label preserved.); [reading-map.md](reading-map.md) becomes [reading-map.md](../../../../reading-map.md) (Relative spelling changes only; original repository destination conserved.); [platform/README.md](platform/README.md) becomes [platform/README.md](../../../README.md) (Relative spelling changes only; original repository destination conserved.); [specs/reading-map.md](specs/reading-map.md) becomes [specs/reading-map.md](../../../../specs/reading-map.md) (Relative spelling changes only; original repository destination conserved.). Full source/target text and diff are submitted for independent whole-unit conservation review; wrapping/header/relative-path changes grant no truth approval. No source retirement, promotion or component-boundary change. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by native retained identity. Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding. L10 review correction: the doc-governance link is repointed to docs/platform/governance.md; its original legacy destination is not retained. Label and candidate referent are disclosed; pending independent review.",
    "reviewNote": "deep: heading 1 Read First; same 13 link pairs checked by script in both directions, no unlisted link change, governance repoint disclosed; anchor ok",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-02-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "16929d439319f41461ebf8f9278446e233b23a3b2450a9b9bd4295b12e1052db",
    "targetAncestry": [
      "fgOS Documentation"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-300"
}
```

## Entry decisions-301

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s5-root-mapped-conservation.json",
  "collection": "claims",
  "claimId": "claim_53d2f5742d24e980328f8cee963fb73b",
  "before": {
    "claimId": "claim_53d2f5742d24e980328f8cee963fb73b",
    "sourceUnitDigest": "dd493e9c64c0caf205f6acc1617c588a0f6710dc0a4f5922d58551efaf63e579",
    "targetOwner": "docs/platform/documentation/operations/portals/docs-portal.md",
    "targetAnchor": "unheaded-block-3",
    "claimKind": "navigation",
    "disposition": "supersede",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "Frozen root map assigns docs/README.md#unheaded-block-3 to docs/platform/documentation/operations/portals/docs-portal.md#unheaded-block-3. Carry the complete unit into its candidate portal owner. This unit includes 13 documented link spelling adjustment(s): [doc-governance.md](doc-governance.md) becomes [doc-governance.md](../../../governance.md) (Candidate destination repointed to docs/platform/governance.md; label preserved.); [reading-map.md](reading-map.md) becomes [reading-map.md](../../../../reading-map.md) (Relative spelling changes only; original repository destination conserved.); [platform/README.md](platform/README.md) becomes [platform/README.md](../../../README.md) (Relative spelling changes only; original repository destination conserved.); [specs/reading-map.md](specs/reading-map.md) becomes [specs/reading-map.md](../../../../specs/reading-map.md) (Relative spelling changes only; original repository destination conserved.); [user/](user/) becomes [user/](../../../../user) (Relative spelling changes only; original repository destination conserved.); [how-to/](how-to/) becomes [how-to/](../../../../how-to) (Relative spelling changes only; original repository destination conserved.); [reference/](reference/) becomes [reference/](../../../../reference) (Relative spelling changes only; original repository destination conserved.); [explanation/](explanation/) becomes [explanation/](../../../../explanation) (Relative spelling changes only; original repository destination conserved.); [user/](user/) becomes [user/](../../../../user) (Relative spelling changes only; original repository destination conserved.); [doc-governance.md](doc-governance.md) becomes [doc-governance.md](../../../governance.md) (Candidate destination repointed to docs/platform/governance.md; label preserved.); [reading-map.md](reading-map.md) becomes [reading-map.md](../../../../reading-map.md) (Relative spelling changes only; original repository destination conserved.); [platform/README.md](platform/README.md) becomes [platform/README.md](../../../README.md) (Relative spelling changes only; original repository destination conserved.); [specs/reading-map.md](specs/reading-map.md) becomes [specs/reading-map.md](../../../../specs/reading-map.md) (Relative spelling changes only; original repository destination conserved.). Full source/target text and diff are submitted for independent whole-unit conservation review; wrapping/header/relative-path changes grant no truth approval. No source retirement, promotion or component-boundary change. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by committed line-diff correspondence with equal unit kind and ancestry (equal). Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding. L10 review correction: the doc-governance link is repointed to docs/platform/governance.md; its original legacy destination is not retained. Label and candidate referent are disclosed; pending independent review.",
    "reviewNote": "deep: answers the earlier rework: same disclosure as the heading row; target links match the rationale pairs; masked text identical",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-03-19ca8de23.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "1b6544779a1b1b2aea1f57d5e9f59d5831cbbb499161f8ed90e23e16e3a7f134",
    "targetAncestry": [
      "fgOS Documentation",
      "1. Read First"
    ],
    "reviewReportCommit": "4a18f35ff5d6a9b7a07e955bd64418282c6a91b2"
  },
  "after": {
    "claimId": "claim_53d2f5742d24e980328f8cee963fb73b",
    "sourceUnitDigest": "dd493e9c64c0caf205f6acc1617c588a0f6710dc0a4f5922d58551efaf63e579",
    "targetOwner": "docs/platform/documentation/operations/portals/docs-portal.md",
    "targetAnchor": "unheaded-block-3",
    "claimKind": "navigation",
    "disposition": "supersede",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "Frozen root map assigns docs/README.md#unheaded-block-3 to docs/platform/documentation/operations/portals/docs-portal.md#unheaded-block-3. Carry the complete unit into its candidate portal owner. This unit includes 13 documented link spelling adjustment(s): [doc-governance.md](doc-governance.md) becomes [doc-governance.md](../../../governance.md) (Candidate destination repointed to docs/platform/governance.md; label preserved.); [reading-map.md](reading-map.md) becomes [reading-map.md](../../../../reading-map.md) (Relative spelling changes only; original repository destination conserved.); [platform/README.md](platform/README.md) becomes [platform/README.md](../../../README.md) (Relative spelling changes only; original repository destination conserved.); [specs/reading-map.md](specs/reading-map.md) becomes [specs/reading-map.md](../../../../specs/reading-map.md) (Relative spelling changes only; original repository destination conserved.); [user/](user/) becomes [user/](../../../../user) (Relative spelling changes only; original repository destination conserved.); [how-to/](how-to/) becomes [how-to/](../../../../how-to) (Relative spelling changes only; original repository destination conserved.); [reference/](reference/) becomes [reference/](../../../../reference) (Relative spelling changes only; original repository destination conserved.); [explanation/](explanation/) becomes [explanation/](../../../../explanation) (Relative spelling changes only; original repository destination conserved.); [user/](user/) becomes [user/](../../../../user) (Relative spelling changes only; original repository destination conserved.); [doc-governance.md](doc-governance.md) becomes [doc-governance.md](../../../governance.md) (Candidate destination repointed to docs/platform/governance.md; label preserved.); [reading-map.md](reading-map.md) becomes [reading-map.md](../../../../reading-map.md) (Relative spelling changes only; original repository destination conserved.); [platform/README.md](platform/README.md) becomes [platform/README.md](../../../README.md) (Relative spelling changes only; original repository destination conserved.); [specs/reading-map.md](specs/reading-map.md) becomes [specs/reading-map.md](../../../../specs/reading-map.md) (Relative spelling changes only; original repository destination conserved.). Full source/target text and diff are submitted for independent whole-unit conservation review; wrapping/header/relative-path changes grant no truth approval. No source retirement, promotion or component-boundary change. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by committed line-diff correspondence with equal unit kind and ancestry (equal). Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding. L10 review correction: the doc-governance link is repointed to docs/platform/governance.md; its original legacy destination is not retained. Label and candidate referent are disclosed; pending independent review.",
    "reviewNote": "deep: unit-3 table of docs/README.md; 13 rationale link pairs all present in source and target in the right direction, no unlisted link change, the doc-governance repoint disclosed; anchor ok",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-02-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "1b6544779a1b1b2aea1f57d5e9f59d5831cbbb499161f8ed90e23e16e3a7f134",
    "targetAncestry": [
      "fgOS Documentation",
      "1. Read First"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "currentDecision": {
    "claimId": "claim_53d2f5742d24e980328f8cee963fb73b",
    "sourceUnitDigest": "dd493e9c64c0caf205f6acc1617c588a0f6710dc0a4f5922d58551efaf63e579",
    "targetOwner": "docs/platform/documentation/operations/portals/docs-portal.md",
    "targetAnchor": "unheaded-block-3",
    "claimKind": "navigation",
    "disposition": "supersede",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "Frozen root map assigns docs/README.md#unheaded-block-3 to docs/platform/documentation/operations/portals/docs-portal.md#unheaded-block-3. Carry the complete unit into its candidate portal owner. This unit includes 13 documented link spelling adjustment(s): [doc-governance.md](doc-governance.md) becomes [doc-governance.md](../../../governance.md) (Candidate destination repointed to docs/platform/governance.md; label preserved.); [reading-map.md](reading-map.md) becomes [reading-map.md](../../../../reading-map.md) (Relative spelling changes only; original repository destination conserved.); [platform/README.md](platform/README.md) becomes [platform/README.md](../../../README.md) (Relative spelling changes only; original repository destination conserved.); [specs/reading-map.md](specs/reading-map.md) becomes [specs/reading-map.md](../../../../specs/reading-map.md) (Relative spelling changes only; original repository destination conserved.); [user/](user/) becomes [user/](../../../../user) (Relative spelling changes only; original repository destination conserved.); [how-to/](how-to/) becomes [how-to/](../../../../how-to) (Relative spelling changes only; original repository destination conserved.); [reference/](reference/) becomes [reference/](../../../../reference) (Relative spelling changes only; original repository destination conserved.); [explanation/](explanation/) becomes [explanation/](../../../../explanation) (Relative spelling changes only; original repository destination conserved.); [user/](user/) becomes [user/](../../../../user) (Relative spelling changes only; original repository destination conserved.); [doc-governance.md](doc-governance.md) becomes [doc-governance.md](../../../governance.md) (Candidate destination repointed to docs/platform/governance.md; label preserved.); [reading-map.md](reading-map.md) becomes [reading-map.md](../../../../reading-map.md) (Relative spelling changes only; original repository destination conserved.); [platform/README.md](platform/README.md) becomes [platform/README.md](../../../README.md) (Relative spelling changes only; original repository destination conserved.); [specs/reading-map.md](specs/reading-map.md) becomes [specs/reading-map.md](../../../../specs/reading-map.md) (Relative spelling changes only; original repository destination conserved.). Full source/target text and diff are submitted for independent whole-unit conservation review; wrapping/header/relative-path changes grant no truth approval. No source retirement, promotion or component-boundary change. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by committed line-diff correspondence with equal unit kind and ancestry (equal). Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding. L10 review correction: the doc-governance link is repointed to docs/platform/governance.md; its original legacy destination is not retained. Label and candidate referent are disclosed; pending independent review.",
    "reviewNote": "deep: unit-3 table of docs/README.md; 13 rationale link pairs all present in source and target in the right direction, no unlisted link change, the doc-governance repoint disclosed; anchor ok",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-02-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "1b6544779a1b1b2aea1f57d5e9f59d5831cbbb499161f8ed90e23e16e3a7f134",
    "targetAncestry": [
      "fgOS Documentation",
      "1. Read First"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-301"
}
```

## Entry decisions-302

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s5-root-mapped-conservation.json",
  "collection": "claims",
  "claimId": "claim_2ae0cd4fc1cf487f7caa4d77d46e9682",
  "before": {
    "claimId": "claim_2ae0cd4fc1cf487f7caa4d77d46e9682",
    "sourceUnitDigest": "93e63d0c77140732f2db5dcff67c39869f924d501e3556dfb36a9d48cc73ed8d",
    "targetOwner": "docs/platform/documentation/operations/portals/docs-portal.md",
    "targetAnchor": "4-related-files",
    "claimKind": "navigation",
    "disposition": "supersede",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "Frozen root map assigns docs/README.md#4-related-files to docs/platform/documentation/operations/portals/docs-portal.md#4-related-files. Carry the complete unit into its candidate portal owner. This unit includes 8 documented link spelling adjustment(s): [doc-governance.md](doc-governance.md) becomes [doc-governance.md](../../../governance.md) (Candidate destination repointed to docs/platform/governance.md; label preserved.); [reading-map.md](reading-map.md) becomes [reading-map.md](../../../../reading-map.md) (Relative spelling changes only; original repository destination conserved.); [platform/README.md](platform/README.md) becomes [platform/README.md](../../../README.md) (Relative spelling changes only; original repository destination conserved.); [specs/reading-map.md](specs/reading-map.md) becomes [specs/reading-map.md](../../../../specs/reading-map.md) (Relative spelling changes only; original repository destination conserved.); [doc-governance.md](doc-governance.md) becomes [doc-governance.md](../../../governance.md) (Candidate destination repointed to docs/platform/governance.md; label preserved.); [reading-map.md](reading-map.md) becomes [reading-map.md](../../../../reading-map.md) (Relative spelling changes only; original repository destination conserved.); [platform/README.md](platform/README.md) becomes [platform/README.md](../../../README.md) (Relative spelling changes only; original repository destination conserved.); [specs/reading-map.md](specs/reading-map.md) becomes [specs/reading-map.md](../../../../specs/reading-map.md) (Relative spelling changes only; original repository destination conserved.). Full source/target text and diff are submitted for independent whole-unit conservation review; wrapping/header/relative-path changes grant no truth approval. No source retirement, promotion or component-boundary change. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by native retained identity. Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding. L10 review correction: the doc-governance link is repointed to docs/platform/governance.md; its original legacy destination is not retained. Label and candidate referent are disclosed; pending independent review.",
    "reviewNote": "deep: answers the earlier rework: governance repoint disclosed; the 4 target links match the rationale pairs; masked text identical",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-03-19ca8de23.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "6dcde68b9663bbcefb3354897ee57514583ac7767a09df3f74a615011844a828",
    "targetAncestry": [
      "fgOS Documentation"
    ],
    "reviewReportCommit": "4a18f35ff5d6a9b7a07e955bd64418282c6a91b2"
  },
  "after": {
    "claimId": "claim_2ae0cd4fc1cf487f7caa4d77d46e9682",
    "sourceUnitDigest": "93e63d0c77140732f2db5dcff67c39869f924d501e3556dfb36a9d48cc73ed8d",
    "targetOwner": "docs/platform/documentation/operations/portals/docs-portal.md",
    "targetAnchor": "4-related-files",
    "claimKind": "navigation",
    "disposition": "supersede",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "Frozen root map assigns docs/README.md#4-related-files to docs/platform/documentation/operations/portals/docs-portal.md#4-related-files. Carry the complete unit into its candidate portal owner. This unit includes 8 documented link spelling adjustment(s): [doc-governance.md](doc-governance.md) becomes [doc-governance.md](../../../governance.md) (Candidate destination repointed to docs/platform/governance.md; label preserved.); [reading-map.md](reading-map.md) becomes [reading-map.md](../../../../reading-map.md) (Relative spelling changes only; original repository destination conserved.); [platform/README.md](platform/README.md) becomes [platform/README.md](../../../README.md) (Relative spelling changes only; original repository destination conserved.); [specs/reading-map.md](specs/reading-map.md) becomes [specs/reading-map.md](../../../../specs/reading-map.md) (Relative spelling changes only; original repository destination conserved.); [doc-governance.md](doc-governance.md) becomes [doc-governance.md](../../../governance.md) (Candidate destination repointed to docs/platform/governance.md; label preserved.); [reading-map.md](reading-map.md) becomes [reading-map.md](../../../../reading-map.md) (Relative spelling changes only; original repository destination conserved.); [platform/README.md](platform/README.md) becomes [platform/README.md](../../../README.md) (Relative spelling changes only; original repository destination conserved.); [specs/reading-map.md](specs/reading-map.md) becomes [specs/reading-map.md](../../../../specs/reading-map.md) (Relative spelling changes only; original repository destination conserved.). Full source/target text and diff are submitted for independent whole-unit conservation review; wrapping/header/relative-path changes grant no truth approval. No source retirement, promotion or component-boundary change. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by native retained identity. Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding. L10 review correction: the doc-governance link is repointed to docs/platform/governance.md; its original legacy destination is not retained. Label and candidate referent are disclosed; pending independent review.",
    "reviewNote": "deep: heading 4 Related Files of docs/README.md; same four link respellings as the sibling rows, every rationale pair found in source and target in the right direction, governance repoint disclosed; anchor ok",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-02-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "6dcde68b9663bbcefb3354897ee57514583ac7767a09df3f74a615011844a828",
    "targetAncestry": [
      "fgOS Documentation"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "currentDecision": {
    "claimId": "claim_2ae0cd4fc1cf487f7caa4d77d46e9682",
    "sourceUnitDigest": "93e63d0c77140732f2db5dcff67c39869f924d501e3556dfb36a9d48cc73ed8d",
    "targetOwner": "docs/platform/documentation/operations/portals/docs-portal.md",
    "targetAnchor": "4-related-files",
    "claimKind": "navigation",
    "disposition": "supersede",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "Frozen root map assigns docs/README.md#4-related-files to docs/platform/documentation/operations/portals/docs-portal.md#4-related-files. Carry the complete unit into its candidate portal owner. This unit includes 8 documented link spelling adjustment(s): [doc-governance.md](doc-governance.md) becomes [doc-governance.md](../../../governance.md) (Candidate destination repointed to docs/platform/governance.md; label preserved.); [reading-map.md](reading-map.md) becomes [reading-map.md](../../../../reading-map.md) (Relative spelling changes only; original repository destination conserved.); [platform/README.md](platform/README.md) becomes [platform/README.md](../../../README.md) (Relative spelling changes only; original repository destination conserved.); [specs/reading-map.md](specs/reading-map.md) becomes [specs/reading-map.md](../../../../specs/reading-map.md) (Relative spelling changes only; original repository destination conserved.); [doc-governance.md](doc-governance.md) becomes [doc-governance.md](../../../governance.md) (Candidate destination repointed to docs/platform/governance.md; label preserved.); [reading-map.md](reading-map.md) becomes [reading-map.md](../../../../reading-map.md) (Relative spelling changes only; original repository destination conserved.); [platform/README.md](platform/README.md) becomes [platform/README.md](../../../README.md) (Relative spelling changes only; original repository destination conserved.); [specs/reading-map.md](specs/reading-map.md) becomes [specs/reading-map.md](../../../../specs/reading-map.md) (Relative spelling changes only; original repository destination conserved.). Full source/target text and diff are submitted for independent whole-unit conservation review; wrapping/header/relative-path changes grant no truth approval. No source retirement, promotion or component-boundary change. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by native retained identity. Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding. L10 review correction: the doc-governance link is repointed to docs/platform/governance.md; its original legacy destination is not retained. Label and candidate referent are disclosed; pending independent review.",
    "reviewNote": "deep: heading 4 Related Files of docs/README.md; same four link respellings as the sibling rows, every rationale pair found in source and target in the right direction, governance repoint disclosed; anchor ok",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-02-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "6dcde68b9663bbcefb3354897ee57514583ac7767a09df3f74a615011844a828",
    "targetAncestry": [
      "fgOS Documentation"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-302"
}
```

## Entry decisions-303

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s5-root-mapped-conservation.json",
  "collection": "claims",
  "claimId": "claim_0f63a4c33bd9ab4d707e6ea459868a91",
  "before": {
    "claimId": "claim_0f63a4c33bd9ab4d707e6ea459868a91",
    "sourceUnitDigest": "30081b87c5f3fa70b025b187fa5dd4cc947c337d5c005aec01a17fd48d6652ef",
    "targetOwner": "docs/platform/documentation/operations/portals/docs-portal.md",
    "targetAnchor": "unheaded-block-6",
    "claimKind": "navigation",
    "disposition": "supersede",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "Frozen root map assigns docs/README.md#unheaded-block-6 to docs/platform/documentation/operations/portals/docs-portal.md#unheaded-block-6. Carry the complete unit into its candidate portal owner. This unit includes 8 documented link spelling adjustment(s): [doc-governance.md](doc-governance.md) becomes [doc-governance.md](../../../governance.md) (Candidate destination repointed to docs/platform/governance.md; label preserved.); [reading-map.md](reading-map.md) becomes [reading-map.md](../../../../reading-map.md) (Relative spelling changes only; original repository destination conserved.); [platform/README.md](platform/README.md) becomes [platform/README.md](../../../README.md) (Relative spelling changes only; original repository destination conserved.); [specs/reading-map.md](specs/reading-map.md) becomes [specs/reading-map.md](../../../../specs/reading-map.md) (Relative spelling changes only; original repository destination conserved.); [doc-governance.md](doc-governance.md) becomes [doc-governance.md](../../../governance.md) (Candidate destination repointed to docs/platform/governance.md; label preserved.); [reading-map.md](reading-map.md) becomes [reading-map.md](../../../../reading-map.md) (Relative spelling changes only; original repository destination conserved.); [platform/README.md](platform/README.md) becomes [platform/README.md](../../../README.md) (Relative spelling changes only; original repository destination conserved.); [specs/reading-map.md](specs/reading-map.md) becomes [specs/reading-map.md](../../../../specs/reading-map.md) (Relative spelling changes only; original repository destination conserved.). Full source/target text and diff are submitted for independent whole-unit conservation review; wrapping/header/relative-path changes grant no truth approval. No source retirement, promotion or component-boundary change. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by committed line-diff correspondence with equal unit kind and ancestry (equal). Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding. L10 review correction: the doc-governance link is repointed to docs/platform/governance.md; its original legacy destination is not retained. Label and candidate referent are disclosed; pending independent review.",
    "reviewNote": "deep: answers the earlier rework: governance repoint disclosed; 4 target links match the pairs; masked text identical",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-03-19ca8de23.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "10836db6663f77db9404e1d2502532f3928bef5224306570368ddb4fceb59d15",
    "targetAncestry": [
      "fgOS Documentation",
      "4. Related Files"
    ],
    "reviewReportCommit": "4a18f35ff5d6a9b7a07e955bd64418282c6a91b2"
  },
  "after": {
    "claimId": "claim_0f63a4c33bd9ab4d707e6ea459868a91",
    "sourceUnitDigest": "30081b87c5f3fa70b025b187fa5dd4cc947c337d5c005aec01a17fd48d6652ef",
    "targetOwner": "docs/platform/documentation/operations/portals/docs-portal.md",
    "targetAnchor": "unheaded-block-6",
    "claimKind": "navigation",
    "disposition": "supersede",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "Frozen root map assigns docs/README.md#unheaded-block-6 to docs/platform/documentation/operations/portals/docs-portal.md#unheaded-block-6. Carry the complete unit into its candidate portal owner. This unit includes 8 documented link spelling adjustment(s): [doc-governance.md](doc-governance.md) becomes [doc-governance.md](../../../governance.md) (Candidate destination repointed to docs/platform/governance.md; label preserved.); [reading-map.md](reading-map.md) becomes [reading-map.md](../../../../reading-map.md) (Relative spelling changes only; original repository destination conserved.); [platform/README.md](platform/README.md) becomes [platform/README.md](../../../README.md) (Relative spelling changes only; original repository destination conserved.); [specs/reading-map.md](specs/reading-map.md) becomes [specs/reading-map.md](../../../../specs/reading-map.md) (Relative spelling changes only; original repository destination conserved.); [doc-governance.md](doc-governance.md) becomes [doc-governance.md](../../../governance.md) (Candidate destination repointed to docs/platform/governance.md; label preserved.); [reading-map.md](reading-map.md) becomes [reading-map.md](../../../../reading-map.md) (Relative spelling changes only; original repository destination conserved.); [platform/README.md](platform/README.md) becomes [platform/README.md](../../../README.md) (Relative spelling changes only; original repository destination conserved.); [specs/reading-map.md](specs/reading-map.md) becomes [specs/reading-map.md](../../../../specs/reading-map.md) (Relative spelling changes only; original repository destination conserved.). Full source/target text and diff are submitted for independent whole-unit conservation review; wrapping/header/relative-path changes grant no truth approval. No source retirement, promotion or component-boundary change. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by committed line-diff correspondence with equal unit kind and ancestry (equal). Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding. L10 review correction: the doc-governance link is repointed to docs/platform/governance.md; its original legacy destination is not retained. Label and candidate referent are disclosed; pending independent review.",
    "reviewNote": "deep: unit-6 of docs/README.md; four link destinations respelled, and the rationale lists every pair in the right direction (source to target, checked by script against both texts) with the doc-governance repoint to platform/governance.md disclosed; no other difference; anchor ok",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-02-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "10836db6663f77db9404e1d2502532f3928bef5224306570368ddb4fceb59d15",
    "targetAncestry": [
      "fgOS Documentation",
      "4. Related Files"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "currentDecision": {
    "claimId": "claim_0f63a4c33bd9ab4d707e6ea459868a91",
    "sourceUnitDigest": "30081b87c5f3fa70b025b187fa5dd4cc947c337d5c005aec01a17fd48d6652ef",
    "targetOwner": "docs/platform/documentation/operations/portals/docs-portal.md",
    "targetAnchor": "unheaded-block-6",
    "claimKind": "navigation",
    "disposition": "supersede",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "Frozen root map assigns docs/README.md#unheaded-block-6 to docs/platform/documentation/operations/portals/docs-portal.md#unheaded-block-6. Carry the complete unit into its candidate portal owner. This unit includes 8 documented link spelling adjustment(s): [doc-governance.md](doc-governance.md) becomes [doc-governance.md](../../../governance.md) (Candidate destination repointed to docs/platform/governance.md; label preserved.); [reading-map.md](reading-map.md) becomes [reading-map.md](../../../../reading-map.md) (Relative spelling changes only; original repository destination conserved.); [platform/README.md](platform/README.md) becomes [platform/README.md](../../../README.md) (Relative spelling changes only; original repository destination conserved.); [specs/reading-map.md](specs/reading-map.md) becomes [specs/reading-map.md](../../../../specs/reading-map.md) (Relative spelling changes only; original repository destination conserved.); [doc-governance.md](doc-governance.md) becomes [doc-governance.md](../../../governance.md) (Candidate destination repointed to docs/platform/governance.md; label preserved.); [reading-map.md](reading-map.md) becomes [reading-map.md](../../../../reading-map.md) (Relative spelling changes only; original repository destination conserved.); [platform/README.md](platform/README.md) becomes [platform/README.md](../../../README.md) (Relative spelling changes only; original repository destination conserved.); [specs/reading-map.md](specs/reading-map.md) becomes [specs/reading-map.md](../../../../specs/reading-map.md) (Relative spelling changes only; original repository destination conserved.). Full source/target text and diff are submitted for independent whole-unit conservation review; wrapping/header/relative-path changes grant no truth approval. No source retirement, promotion or component-boundary change. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by committed line-diff correspondence with equal unit kind and ancestry (equal). Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding. L10 review correction: the doc-governance link is repointed to docs/platform/governance.md; its original legacy destination is not retained. Label and candidate referent are disclosed; pending independent review.",
    "reviewNote": "deep: unit-6 of docs/README.md; four link destinations respelled, and the rationale lists every pair in the right direction (source to target, checked by script against both texts) with the doc-governance repoint to platform/governance.md disclosed; no other difference; anchor ok",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-02-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "10836db6663f77db9404e1d2502532f3928bef5224306570368ddb4fceb59d15",
    "targetAncestry": [
      "fgOS Documentation",
      "4. Related Files"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-303"
}
```

## Entry decisions-305

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s5-root-retained-navigation-proposal.json",
  "collection": "claims",
  "claimId": "claim_587566a4401b92c909e862d72aad4af0",
  "before": {
    "claimId": "claim_587566a4401b92c909e862d72aad4af0",
    "sourceUnitDigest": "db75e0b3a3bb12f6da1feaaf6321eede85a208e6c93dcf82978ee26618a79196",
    "claimKind": "navigation",
    "disposition": "reclassify-out-of-platform-scope",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "Frozen map/constitution retain docs/specs/reading-map.md as legacy provenance and docs/reading-map.md as the sole repository-wide navigation singleton outside platform topology. Section 5 carries 53 original entries, with seven entries explicitly labelled truth corrections and evidence; the wrapper correction is 36 in 55 directories (_shared has no SKILL.md). Main adds one Session Identity entry verbatim under A31. No source retirement, source-to-self carry proof or truth approval; pending independent review. Final b01 clarification: the current merged section 5 carries 53 original entries, with seven entries explicitly labelled truth corrections and evidence, plus one verbatim Session Identity entry from main. It does not assert that all 53 are still verbatim or defer those seven known truth fixes to promotion; wrapper count is 36 in 55 directories (_shared has no SKILL.md). Historical source binding and current navigation are separately pending independent review.",
    "reviewStatus": "reviewed",
    "reviewNote": "deep: answers the earlier rework: unit L3-9 of docs/specs/reading-map.md is byte-identical at the pin and at HEAD and is retained in place (target none); the rewritten rationale no longer claims verbatim carriage and matches the repository: docs/reading-map.md section 5 has 54 entries with 7 labelled truth corrections and the one Session Identity entry from main, and 36 non-fgos wrappers in 55 plugin skill directories (_shared has no SKILL.md)",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-03-19ca8de23.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "4a18f35ff5d6a9b7a07e955bd64418282c6a91b2"
  },
  "after": {
    "claimId": "claim_587566a4401b92c909e862d72aad4af0",
    "sourceUnitDigest": "db75e0b3a3bb12f6da1feaaf6321eede85a208e6c93dcf82978ee26618a79196",
    "claimKind": "navigation",
    "disposition": "reclassify-out-of-platform-scope",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "Frozen map/constitution retain docs/specs/reading-map.md as legacy provenance and docs/reading-map.md as the sole repository-wide navigation singleton outside platform topology. Section 5 carries 53 original entries, with seven entries explicitly labelled truth corrections and evidence; the wrapper correction is 36 in 55 directories (_shared has no SKILL.md). Main adds one Session Identity entry verbatim under A31. No source retirement, source-to-self carry proof or truth approval; pending independent review. Final b01 clarification: the current merged section 5 carries 53 original entries, with seven entries explicitly labelled truth corrections and evidence, plus one verbatim Session Identity entry from main. It does not assert that all 53 are still verbatim or defer those seven known truth fixes to promotion; wrapper count is 36 in 55 directories (_shared has no SKILL.md). Historical source binding and current navigation are separately pending independent review.",
    "reviewStatus": "reviewed",
    "reviewNote": "mechanical: full digests recomputed by the extractor at 345f15d95 and equal to the shard and the pack; source anchor unheaded-block-1 resolves; source unit bytes identical at 59b9b7087, 19ca8de23 and 345f15d95, target none by design; text not read beyond what is stated",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-02-345f15d95.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "currentDecision": {
    "claimId": "claim_587566a4401b92c909e862d72aad4af0",
    "sourceUnitDigest": "db75e0b3a3bb12f6da1feaaf6321eede85a208e6c93dcf82978ee26618a79196",
    "claimKind": "navigation",
    "disposition": "reclassify-out-of-platform-scope",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "Frozen map/constitution retain docs/specs/reading-map.md as legacy provenance and docs/reading-map.md as the sole repository-wide navigation singleton outside platform topology. Section 5 carries 53 original entries, with seven entries explicitly labelled truth corrections and evidence; the wrapper correction is 36 in 55 directories (_shared has no SKILL.md). Main adds one Session Identity entry verbatim under A31. No source retirement, source-to-self carry proof or truth approval; pending independent review. Final b01 clarification: the current merged section 5 carries 53 original entries, with seven entries explicitly labelled truth corrections and evidence, plus one verbatim Session Identity entry from main. It does not assert that all 53 are still verbatim or defer those seven known truth fixes to promotion; wrapper count is 36 in 55 directories (_shared has no SKILL.md). Historical source binding and current navigation are separately pending independent review.",
    "reviewStatus": "reviewed",
    "reviewNote": "mechanical: full digests recomputed by the extractor at 345f15d95 and equal to the shard and the pack; source anchor unheaded-block-1 resolves; source unit bytes identical at 59b9b7087, 19ca8de23 and 345f15d95, target none by design; text not read beyond what is stated",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-02-345f15d95.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-305"
}
```

## Entry decisions-310

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s7-proposals-redesigns-09-coordination-capability-envelope.json",
  "collection": "claims",
  "claimId": "claim_08ce73390cb135225e26376d61a3c2c0",
  "before": {
    "claimId": "claim_08ce73390cb135225e26376d61a3c2c0",
    "sourceUnitDigest": "1dcc99a8d286c2a7810ab416e8252315a28c7ff47fa6f257e1cb992980b4eb1a",
    "targetOwner": "docs/platform/proposals/coordination-capability-envelope.md",
    "targetAnchor": "unheaded-block-43",
    "claimKind": "contract",
    "disposition": "supersede",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "Judgment: candidate link repoint. place verbatim: Reject inference that engine retirement retires this alternative recommendation. Preserve the complete map proposal, with stale code citations literal; no assumption the proposed envelope shipped. Evidence: Source section 2 cites surviving src/runner/dispatch/assignment-runner.mjs and assignment.mjs, while the session-engine/store/coordination verbs it criticizes were removed in 2180b4e72. Source lines 34–43 recommends an alternative to graph-owned deliberation, not merely use of the old graph. Complete source unheaded-block docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-40 (lines 250–253) is carried at docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-43 (lines 277–280); Frozen map target and kind retained. Source and target unit digests differ because the contract link is repointed to its mapped candidate; the original link label and surrounding text remain; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by committed line-diff correspondence with equal unit kind and ancestry (equal). Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding.",
    "reviewNote": "deep: answers the earlier rework: the rationale now says Judgment and that the digests differ only because the contract link is repointed to its mapped candidate; the masked diff is empty, source lines 250-253 and target lines 277-280 are right, full digests recomputed equal",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-03-19ca8de23.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "cf4d4ac0a274cf811024779a39918371bcf922db8ec1d3893163c0fc3d3c660a",
    "targetAncestry": [
      "Agent Coordination — Capability Envelope và Coordinator-Owned Deliberation",
      "7. Recommendation and reversal conditions"
    ],
    "reviewReportCommit": "4a18f35ff5d6a9b7a07e955bd64418282c6a91b2"
  },
  "after": {
    "claimId": "claim_08ce73390cb135225e26376d61a3c2c0",
    "sourceUnitDigest": "1dcc99a8d286c2a7810ab416e8252315a28c7ff47fa6f257e1cb992980b4eb1a",
    "targetOwner": "docs/platform/proposals/coordination-capability-envelope.md",
    "targetAnchor": "unheaded-block-43",
    "claimKind": "contract",
    "disposition": "supersede",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "Judgment: candidate link repoint. place verbatim: Reject inference that engine retirement retires this alternative recommendation. Preserve the complete map proposal, with stale code citations literal; no assumption the proposed envelope shipped. Evidence: Source section 2 cites surviving src/runner/dispatch/assignment-runner.mjs and assignment.mjs, while the session-engine/store/coordination verbs it criticizes were removed in 2180b4e72. Source lines 34–43 recommends an alternative to graph-owned deliberation, not merely use of the old graph. Complete source unheaded-block docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-40 (lines 250–253) is carried at docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-43 (lines 277–280); Frozen map target and kind retained. Source and target unit digests differ because the contract link is repointed to its mapped candidate; the original link label and surrounding text remain; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by committed line-diff correspondence with equal unit kind and ancestry (equal). Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding.",
    "reviewNote": "deep: one block; the only difference is the Routing Handoff Contract link repointed to its mapped candidate which the rationale names as the reason digests differ; rationale source lines 250-253 and candidate lines 277-280 equal the live units; the cited source lines 34-43 do recommend the capability envelope alternative; anchor ok",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-02-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "cf4d4ac0a274cf811024779a39918371bcf922db8ec1d3893163c0fc3d3c660a",
    "targetAncestry": [
      "Agent Coordination — Capability Envelope và Coordinator-Owned Deliberation",
      "7. Recommendation and reversal conditions"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "currentDecision": {
    "claimId": "claim_08ce73390cb135225e26376d61a3c2c0",
    "sourceUnitDigest": "1dcc99a8d286c2a7810ab416e8252315a28c7ff47fa6f257e1cb992980b4eb1a",
    "targetOwner": "docs/platform/proposals/coordination-capability-envelope.md",
    "targetAnchor": "unheaded-block-43",
    "claimKind": "contract",
    "disposition": "supersede",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "Judgment: candidate link repoint. place verbatim: Reject inference that engine retirement retires this alternative recommendation. Preserve the complete map proposal, with stale code citations literal; no assumption the proposed envelope shipped. Evidence: Source section 2 cites surviving src/runner/dispatch/assignment-runner.mjs and assignment.mjs, while the session-engine/store/coordination verbs it criticizes were removed in 2180b4e72. Source lines 34–43 recommends an alternative to graph-owned deliberation, not merely use of the old graph. Complete source unheaded-block docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-40 (lines 250–253) is carried at docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-43 (lines 277–280); Frozen map target and kind retained. Source and target unit digests differ because the contract link is repointed to its mapped candidate; the original link label and surrounding text remain; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by committed line-diff correspondence with equal unit kind and ancestry (equal). Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding.",
    "reviewNote": "deep: one block; the only difference is the Routing Handoff Contract link repointed to its mapped candidate which the rationale names as the reason digests differ; rationale source lines 250-253 and candidate lines 277-280 equal the live units; the cited source lines 34-43 do recommend the capability envelope alternative; anchor ok",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-02-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "cf4d4ac0a274cf811024779a39918371bcf922db8ec1d3893163c0fc3d3c660a",
    "targetAncestry": [
      "Agent Coordination — Capability Envelope và Coordinator-Owned Deliberation",
      "7. Recommendation and reversal conditions"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-310"
}
```

## Entry decisions-311

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s7-proposals-redesigns-09-coordination-capability-envelope.json",
  "collection": "claims",
  "claimId": "claim_d2341a538619073b583c4b3168b41387",
  "before": {
    "claimId": "claim_d2341a538619073b583c4b3168b41387",
    "sourceUnitDigest": "c35e33bb5e4d4fc730ef52f6b5823601188c474715bde9adaf98fbfd83276415",
    "targetOwner": "docs/platform/proposals/coordination-capability-envelope.md",
    "targetAnchor": "10-smallest-experiments-before-implementation-planning",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "Weak-exact: current source and target unit digests are equal; placement ancestry is disclosed.; mandatory A36 deep read. place verbatim: Reject inference that engine retirement retires this alternative recommendation. Preserve the complete map proposal, with stale code citations literal; no assumption the proposed envelope shipped. Evidence: Source section 2 cites surviving src/runner/dispatch/assignment-runner.mjs and assignment.mjs, while the session-engine/store/coordination verbs it criticizes were removed in 2180b4e72. Source lines 34–43 recommends an alternative to graph-owned deliberation, not merely use of the old graph. Complete source heading docs/architect/proposals/coordination-capability-envelope.md#10-smallest-experiments-before-implementation-planning (lines 386–386) is carried at docs/platform/proposals/coordination-capability-envelope.md#10-smallest-experiments-before-implementation-planning (lines 413–413); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by native retained identity. Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding.",
    "reviewNote": "deep: heading section 10; shown source and target digests are equal and the text is byte-identical (2860 chars); rationale now says Weak-exact with equal digests, matching the data; link spelling is identical though it resolves to the moved probe contract",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-03-19ca8de23.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "c35e33bb5e4d4fc730ef52f6b5823601188c474715bde9adaf98fbfd83276415",
    "targetAncestry": [
      "Agent Coordination — Capability Envelope và Coordinator-Owned Deliberation"
    ],
    "reviewReportCommit": "4a18f35ff5d6a9b7a07e955bd64418282c6a91b2"
  },
  "after": {
    "claimId": "claim_d2341a538619073b583c4b3168b41387",
    "sourceUnitDigest": "c35e33bb5e4d4fc730ef52f6b5823601188c474715bde9adaf98fbfd83276415",
    "targetOwner": "docs/platform/proposals/coordination-capability-envelope.md",
    "targetAnchor": "10-smallest-experiments-before-implementation-planning",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "Weak-exact: current source and target unit digests are equal; placement ancestry is disclosed.; mandatory A36 deep read. place verbatim: Reject inference that engine retirement retires this alternative recommendation. Preserve the complete map proposal, with stale code citations literal; no assumption the proposed envelope shipped. Evidence: Source section 2 cites surviving src/runner/dispatch/assignment-runner.mjs and assignment.mjs, while the session-engine/store/coordination verbs it criticizes were removed in 2180b4e72. Source lines 34–43 recommends an alternative to graph-owned deliberation, not merely use of the old graph. Complete source heading docs/architect/proposals/coordination-capability-envelope.md#10-smallest-experiments-before-implementation-planning (lines 386–386) is carried at docs/platform/proposals/coordination-capability-envelope.md#10-smallest-experiments-before-implementation-planning (lines 413–413); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by native retained identity. Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding.",
    "reviewNote": "mechanical: full digests recomputed by the extractor at 345f15d95 and equal to the shard and the pack; anchor 10-smallest-experiments-before-implementation-planning ok; source and target digests equal (text byte-equal by digest); rationale line ranges equal the live unit ranges; independently recomputed in Python (seed 20261018); text not read beyond what is stated",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-02-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "c35e33bb5e4d4fc730ef52f6b5823601188c474715bde9adaf98fbfd83276415",
    "targetAncestry": [
      "Agent Coordination — Capability Envelope và Coordinator-Owned Deliberation"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "currentDecision": {
    "claimId": "claim_d2341a538619073b583c4b3168b41387",
    "sourceUnitDigest": "c35e33bb5e4d4fc730ef52f6b5823601188c474715bde9adaf98fbfd83276415",
    "targetOwner": "docs/platform/proposals/coordination-capability-envelope.md",
    "targetAnchor": "10-smallest-experiments-before-implementation-planning",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "Weak-exact: current source and target unit digests are equal; placement ancestry is disclosed.; mandatory A36 deep read. place verbatim: Reject inference that engine retirement retires this alternative recommendation. Preserve the complete map proposal, with stale code citations literal; no assumption the proposed envelope shipped. Evidence: Source section 2 cites surviving src/runner/dispatch/assignment-runner.mjs and assignment.mjs, while the session-engine/store/coordination verbs it criticizes were removed in 2180b4e72. Source lines 34–43 recommends an alternative to graph-owned deliberation, not merely use of the old graph. Complete source heading docs/architect/proposals/coordination-capability-envelope.md#10-smallest-experiments-before-implementation-planning (lines 386–386) is carried at docs/platform/proposals/coordination-capability-envelope.md#10-smallest-experiments-before-implementation-planning (lines 413–413); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by native retained identity. Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding.",
    "reviewNote": "mechanical: full digests recomputed by the extractor at 345f15d95 and equal to the shard and the pack; anchor 10-smallest-experiments-before-implementation-planning ok; source and target digests equal (text byte-equal by digest); rationale line ranges equal the live unit ranges; independently recomputed in Python (seed 20261018); text not read beyond what is stated",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-02-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "c35e33bb5e4d4fc730ef52f6b5823601188c474715bde9adaf98fbfd83276415",
    "targetAncestry": [
      "Agent Coordination — Capability Envelope và Coordinator-Owned Deliberation"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-311"
}
```

## Entry decisions-312

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s7-proposals-redesigns-09-coordination-capability-envelope.json",
  "collection": "claims",
  "claimId": "claim_63e205836d7968a5141e0350e70ad8a8",
  "before": {
    "claimId": "claim_63e205836d7968a5141e0350e70ad8a8",
    "sourceUnitDigest": "d7fa9577c7921ff566d2e242f7c0a358a6f81a0c611c500eb7f923ba3d18a211",
    "targetOwner": "docs/platform/proposals/coordination-capability-envelope.md",
    "targetAnchor": "unheaded-block-65",
    "claimKind": "contract",
    "disposition": "supersede",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "Weak-exact: current source and target unit digests are equal; placement ancestry is disclosed.; mandatory A36 deep read. place verbatim: Reject inference that engine retirement retires this alternative recommendation. Preserve the complete map proposal, with stale code citations literal; no assumption the proposed envelope shipped. Evidence: Source section 2 cites surviving src/runner/dispatch/assignment-runner.mjs and assignment.mjs, while the session-engine/store/coordination verbs it criticizes were removed in 2180b4e72. Source lines 34–43 recommends an alternative to graph-owned deliberation, not merely use of the old graph. Complete source unheaded-block docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-62 (lines 388–394) is carried at docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-65 (lines 415–421); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by committed line-diff correspondence with equal unit kind and ancestry (replace). Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding.",
    "reviewNote": "deep: block unit-65; source and target digests equal and the text is byte-identical (568 chars); rationale wording corrected to equal digests; ancestry equal",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-03-19ca8de23.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "d7fa9577c7921ff566d2e242f7c0a358a6f81a0c611c500eb7f923ba3d18a211",
    "targetAncestry": [
      "Agent Coordination — Capability Envelope và Coordinator-Owned Deliberation",
      "10. Smallest experiments before implementation planning"
    ],
    "reviewReportCommit": "4a18f35ff5d6a9b7a07e955bd64418282c6a91b2"
  },
  "after": {
    "claimId": "claim_63e205836d7968a5141e0350e70ad8a8",
    "sourceUnitDigest": "d7fa9577c7921ff566d2e242f7c0a358a6f81a0c611c500eb7f923ba3d18a211",
    "targetOwner": "docs/platform/proposals/coordination-capability-envelope.md",
    "targetAnchor": "unheaded-block-65",
    "claimKind": "contract",
    "disposition": "supersede",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "Weak-exact: current source and target unit digests are equal; placement ancestry is disclosed.; mandatory A36 deep read. place verbatim: Reject inference that engine retirement retires this alternative recommendation. Preserve the complete map proposal, with stale code citations literal; no assumption the proposed envelope shipped. Evidence: Source section 2 cites surviving src/runner/dispatch/assignment-runner.mjs and assignment.mjs, while the session-engine/store/coordination verbs it criticizes were removed in 2180b4e72. Source lines 34–43 recommends an alternative to graph-owned deliberation, not merely use of the old graph. Complete source unheaded-block docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-62 (lines 388–394) is carried at docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-65 (lines 415–421); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by committed line-diff correspondence with equal unit kind and ancestry (replace). Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding.",
    "reviewNote": "mechanical: full digests recomputed by the extractor at 345f15d95 and equal to the shard and the pack; anchor unheaded-block-65 ok; source and target digests equal (text byte-equal by digest); rationale line ranges equal the live unit ranges; text not read beyond what is stated",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-02-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "d7fa9577c7921ff566d2e242f7c0a358a6f81a0c611c500eb7f923ba3d18a211",
    "targetAncestry": [
      "Agent Coordination — Capability Envelope và Coordinator-Owned Deliberation",
      "10. Smallest experiments before implementation planning"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "currentDecision": {
    "claimId": "claim_63e205836d7968a5141e0350e70ad8a8",
    "sourceUnitDigest": "d7fa9577c7921ff566d2e242f7c0a358a6f81a0c611c500eb7f923ba3d18a211",
    "targetOwner": "docs/platform/proposals/coordination-capability-envelope.md",
    "targetAnchor": "unheaded-block-65",
    "claimKind": "contract",
    "disposition": "supersede",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "Weak-exact: current source and target unit digests are equal; placement ancestry is disclosed.; mandatory A36 deep read. place verbatim: Reject inference that engine retirement retires this alternative recommendation. Preserve the complete map proposal, with stale code citations literal; no assumption the proposed envelope shipped. Evidence: Source section 2 cites surviving src/runner/dispatch/assignment-runner.mjs and assignment.mjs, while the session-engine/store/coordination verbs it criticizes were removed in 2180b4e72. Source lines 34–43 recommends an alternative to graph-owned deliberation, not merely use of the old graph. Complete source unheaded-block docs/architect/proposals/coordination-capability-envelope.md#unheaded-block-62 (lines 388–394) is carried at docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-65 (lines 415–421); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by committed line-diff correspondence with equal unit kind and ancestry (replace). Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding.",
    "reviewNote": "mechanical: full digests recomputed by the extractor at 345f15d95 and equal to the shard and the pack; anchor unheaded-block-65 ok; source and target digests equal (text byte-equal by digest); rationale line ranges equal the live unit ranges; text not read beyond what is stated",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-02-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "d7fa9577c7921ff566d2e242f7c0a358a6f81a0c611c500eb7f923ba3d18a211",
    "targetAncestry": [
      "Agent Coordination — Capability Envelope và Coordinator-Owned Deliberation",
      "10. Smallest experiments before implementation planning"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-312"
}
```

## Entry decisions-313

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s7-proposals-redesigns-11-coordination-envelope-probe-contract.json",
  "collection": "claims",
  "claimId": "claim_87bd809203f0b1b237b0afac092f6fda",
  "before": {
    "claimId": "claim_87bd809203f0b1b237b0afac092f6fda",
    "sourceUnitDigest": "51371604be3b8c08e83a306d3cd53e9df9b39691bf09284fdf3b3aa93ec9c606",
    "targetOwner": "docs/platform/proposals/coordination-envelope-probe-contract.md",
    "targetAnchor": "current-substrate-fit-and-gaps",
    "claimKind": "contract",
    "disposition": "supersede",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "Weak-exact: current source and target unit digests are equal; placement ancestry is disclosed.; mandatory A36 deep read. supersede: Retain the probe at its mapped proposal target with the live capability-envelope and worker/provider proposals that consume it. Preserve the complete experiment, unproven results and historical gap observations; no implementation or acceptance claim. Evidence: Source scenario uses Assignment/Run, read-only executors and independent-first reveal; it contains neither CoordinationSession nor FlowDefinition. Live coordination-capability-envelope.md:388 and coordination-worker-provider-boundary.md:11 cite this probe contract. Its retired-facility gap observations are dated, not proof the alternative experiment is retired. Complete source heading docs/architect/proposals/coordination-envelope-probe-contract.md#current-substrate-fit-and-gaps (lines 117–117) is carried at docs/platform/proposals/coordination-envelope-probe-contract.md#current-substrate-fit-and-gaps (lines 144–144); mapped proposal placement retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by native retained identity. Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding.",
    "reviewNote": "deep: docs/architect/proposals/coordination-envelope-probe-contract.md#current-substrate-fit-and-gaps (L117-117) to docs/platform/proposals/coordination-envelope-probe-contract.md#current-substrate-fit-and-gaps (L144-144): shard row equals pack, source and target digests recomputed by extractor and equal, anchors pass, whole section diffed source vs target byte-identical, ancestry equal, rationale evidence cites live files that exist; whole-pack escalation read",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-19ca8de23.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "51371604be3b8c08e83a306d3cd53e9df9b39691bf09284fdf3b3aa93ec9c606",
    "targetAncestry": [
      "Coordination Envelope — Minimal Probe Contract"
    ],
    "reviewReportCommit": "4a18f35ff5d6a9b7a07e955bd64418282c6a91b2"
  },
  "after": {
    "claimId": "claim_87bd809203f0b1b237b0afac092f6fda",
    "sourceUnitDigest": "51371604be3b8c08e83a306d3cd53e9df9b39691bf09284fdf3b3aa93ec9c606",
    "targetOwner": "docs/platform/proposals/coordination-envelope-probe-contract.md",
    "targetAnchor": "current-substrate-fit-and-gaps",
    "claimKind": "contract",
    "disposition": "supersede",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "Weak-exact: current source and target unit digests are equal; placement ancestry is disclosed.; mandatory A36 deep read. supersede: Retain the probe at its mapped proposal target with the live capability-envelope and worker/provider proposals that consume it. Preserve the complete experiment, unproven results and historical gap observations; no implementation or acceptance claim. Evidence: Source scenario uses Assignment/Run, read-only executors and independent-first reveal; it contains neither CoordinationSession nor FlowDefinition. Live coordination-capability-envelope.md:388 and coordination-worker-provider-boundary.md:11 cite this probe contract. Its retired-facility gap observations are dated, not proof the alternative experiment is retired. Complete source heading docs/architect/proposals/coordination-envelope-probe-contract.md#current-substrate-fit-and-gaps (lines 117–117) is carried at docs/platform/proposals/coordination-envelope-probe-contract.md#current-substrate-fit-and-gaps (lines 144–144); mapped proposal placement retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by native retained identity. Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding.",
    "reviewNote": "deep: read coordination-envelope-probe-contract.md#current-substrate-fit-and-gaps against coordination-envelope-probe-contract.md#current-substrate-fit-and-gaps: payload byte-equal (empty diff), ancestry as disclosed; rationale ranges source 117-117 and candidate 144-144 equal the live units; cited evidence lines read on the live files and hold; digests recomputed equal, anchor ok",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-02-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "51371604be3b8c08e83a306d3cd53e9df9b39691bf09284fdf3b3aa93ec9c606",
    "targetAncestry": [
      "Coordination Envelope — Minimal Probe Contract"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "currentDecision": {
    "claimId": "claim_87bd809203f0b1b237b0afac092f6fda",
    "sourceUnitDigest": "51371604be3b8c08e83a306d3cd53e9df9b39691bf09284fdf3b3aa93ec9c606",
    "targetOwner": "docs/platform/proposals/coordination-envelope-probe-contract.md",
    "targetAnchor": "current-substrate-fit-and-gaps",
    "claimKind": "contract",
    "disposition": "supersede",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "Weak-exact: current source and target unit digests are equal; placement ancestry is disclosed.; mandatory A36 deep read. supersede: Retain the probe at its mapped proposal target with the live capability-envelope and worker/provider proposals that consume it. Preserve the complete experiment, unproven results and historical gap observations; no implementation or acceptance claim. Evidence: Source scenario uses Assignment/Run, read-only executors and independent-first reveal; it contains neither CoordinationSession nor FlowDefinition. Live coordination-capability-envelope.md:388 and coordination-worker-provider-boundary.md:11 cite this probe contract. Its retired-facility gap observations are dated, not proof the alternative experiment is retired. Complete source heading docs/architect/proposals/coordination-envelope-probe-contract.md#current-substrate-fit-and-gaps (lines 117–117) is carried at docs/platform/proposals/coordination-envelope-probe-contract.md#current-substrate-fit-and-gaps (lines 144–144); mapped proposal placement retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by native retained identity. Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding.",
    "reviewNote": "deep: read coordination-envelope-probe-contract.md#current-substrate-fit-and-gaps against coordination-envelope-probe-contract.md#current-substrate-fit-and-gaps: payload byte-equal (empty diff), ancestry as disclosed; rationale ranges source 117-117 and candidate 144-144 equal the live units; cited evidence lines read on the live files and hold; digests recomputed equal, anchor ok",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-02-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "51371604be3b8c08e83a306d3cd53e9df9b39691bf09284fdf3b3aa93ec9c606",
    "targetAncestry": [
      "Coordination Envelope — Minimal Probe Contract"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-313"
}
```

## Entry decisions-314

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s7-proposals-redesigns-11-coordination-envelope-probe-contract.json",
  "collection": "claims",
  "claimId": "claim_92e903b30cfd63a63027bfff4d7a109d",
  "before": {
    "claimId": "claim_92e903b30cfd63a63027bfff4d7a109d",
    "sourceUnitDigest": "7a88cd1367a1f061fc69550b02958ba2b792609b6d814a30debb96fcc4d92b16",
    "targetOwner": "docs/platform/proposals/coordination-envelope-probe-contract.md",
    "targetAnchor": "unheaded-block-19",
    "claimKind": "contract",
    "disposition": "supersede",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "Weak-exact: current source and target unit digests are equal; placement ancestry is disclosed.; mandatory A36 deep read. supersede: Retain the probe at its mapped proposal target with the live capability-envelope and worker/provider proposals that consume it. Preserve the complete experiment, unproven results and historical gap observations; no implementation or acceptance claim. Evidence: Source scenario uses Assignment/Run, read-only executors and independent-first reveal; it contains neither CoordinationSession nor FlowDefinition. Live coordination-capability-envelope.md:388 and coordination-worker-provider-boundary.md:11 cite this probe contract. Its retired-facility gap observations are dated, not proof the alternative experiment is retired. Complete source unheaded-block docs/architect/proposals/coordination-envelope-probe-contract.md#unheaded-block-16 (lines 119–121) is carried at docs/platform/proposals/coordination-envelope-probe-contract.md#unheaded-block-19 (lines 146–148); mapped proposal placement retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by committed line-diff correspondence with equal unit kind and ancestry (replace). Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding.",
    "reviewNote": "deep: docs/architect/proposals/coordination-envelope-probe-contract.md#unheaded-block-16 (L119-121) to docs/platform/proposals/coordination-envelope-probe-contract.md#unheaded-block-19 (L146-148) (pack class Unit-exact, the rationale opens with the Weak-exact wording, harmless because the digests are equal): shard row equals pack, source and target digests recomputed by extractor and equal, anchors pass, whole section diffed source vs target byte-identical, ancestry equal, rationale evidence cites live files that exist; whole-pack escalation read",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-19ca8de23.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "7a88cd1367a1f061fc69550b02958ba2b792609b6d814a30debb96fcc4d92b16",
    "targetAncestry": [
      "Coordination Envelope — Minimal Probe Contract",
      "Current substrate fit and gaps"
    ],
    "reviewReportCommit": "4a18f35ff5d6a9b7a07e955bd64418282c6a91b2"
  },
  "after": {
    "claimId": "claim_92e903b30cfd63a63027bfff4d7a109d",
    "sourceUnitDigest": "7a88cd1367a1f061fc69550b02958ba2b792609b6d814a30debb96fcc4d92b16",
    "targetOwner": "docs/platform/proposals/coordination-envelope-probe-contract.md",
    "targetAnchor": "unheaded-block-19",
    "claimKind": "contract",
    "disposition": "supersede",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "Weak-exact: current source and target unit digests are equal; placement ancestry is disclosed.; mandatory A36 deep read. supersede: Retain the probe at its mapped proposal target with the live capability-envelope and worker/provider proposals that consume it. Preserve the complete experiment, unproven results and historical gap observations; no implementation or acceptance claim. Evidence: Source scenario uses Assignment/Run, read-only executors and independent-first reveal; it contains neither CoordinationSession nor FlowDefinition. Live coordination-capability-envelope.md:388 and coordination-worker-provider-boundary.md:11 cite this probe contract. Its retired-facility gap observations are dated, not proof the alternative experiment is retired. Complete source unheaded-block docs/architect/proposals/coordination-envelope-probe-contract.md#unheaded-block-16 (lines 119–121) is carried at docs/platform/proposals/coordination-envelope-probe-contract.md#unheaded-block-19 (lines 146–148); mapped proposal placement retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by committed line-diff correspondence with equal unit kind and ancestry (replace). Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding.",
    "reviewNote": "mechanical: full digests recomputed by the extractor at 345f15d95 and equal to the shard and the pack; anchor unheaded-block-19 ok; source and target digests equal (text byte-equal by digest); rationale line ranges equal the live unit ranges; text not read beyond what is stated",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-02-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "7a88cd1367a1f061fc69550b02958ba2b792609b6d814a30debb96fcc4d92b16",
    "targetAncestry": [
      "Coordination Envelope — Minimal Probe Contract",
      "Current substrate fit and gaps"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "currentDecision": {
    "claimId": "claim_92e903b30cfd63a63027bfff4d7a109d",
    "sourceUnitDigest": "7a88cd1367a1f061fc69550b02958ba2b792609b6d814a30debb96fcc4d92b16",
    "targetOwner": "docs/platform/proposals/coordination-envelope-probe-contract.md",
    "targetAnchor": "unheaded-block-19",
    "claimKind": "contract",
    "disposition": "supersede",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "Weak-exact: current source and target unit digests are equal; placement ancestry is disclosed.; mandatory A36 deep read. supersede: Retain the probe at its mapped proposal target with the live capability-envelope and worker/provider proposals that consume it. Preserve the complete experiment, unproven results and historical gap observations; no implementation or acceptance claim. Evidence: Source scenario uses Assignment/Run, read-only executors and independent-first reveal; it contains neither CoordinationSession nor FlowDefinition. Live coordination-capability-envelope.md:388 and coordination-worker-provider-boundary.md:11 cite this probe contract. Its retired-facility gap observations are dated, not proof the alternative experiment is retired. Complete source unheaded-block docs/architect/proposals/coordination-envelope-probe-contract.md#unheaded-block-16 (lines 119–121) is carried at docs/platform/proposals/coordination-envelope-probe-contract.md#unheaded-block-19 (lines 146–148); mapped proposal placement retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by committed line-diff correspondence with equal unit kind and ancestry (replace). Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding.",
    "reviewNote": "mechanical: full digests recomputed by the extractor at 345f15d95 and equal to the shard and the pack; anchor unheaded-block-19 ok; source and target digests equal (text byte-equal by digest); rationale line ranges equal the live unit ranges; text not read beyond what is stated",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-02-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "7a88cd1367a1f061fc69550b02958ba2b792609b6d814a30debb96fcc4d92b16",
    "targetAncestry": [
      "Coordination Envelope — Minimal Probe Contract",
      "Current substrate fit and gaps"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-314"
}
```

## Entry decisions-315

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s7-proposals-redesigns-13-coordination-worker-provider-boundary.json",
  "collection": "claims",
  "claimId": "claim_8dc6683dbb0a864d34d8649af015ce4a",
  "before": {
    "claimId": "claim_8dc6683dbb0a864d34d8649af015ce4a",
    "sourceUnitDigest": "ff821d613e8f839e523d5262b1f93881db3e7beefc78eb34bce79a6d152e2301",
    "targetOwner": "docs/platform/proposals/coordination-worker-provider-boundary.md",
    "targetAnchor": "new-evidence-since-the-first-capability-audit",
    "claimKind": "contract",
    "disposition": "supersede",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "Weak-exact: current source and target unit digests are equal; placement ancestry is disclosed.; mandatory A36 deep read. place verbatim: Keep map proposal in full. Supporting OS probes and private HOME are not full implementation; retain Not started statement as source metadata. Evidence: src/runner/dispatch/worker-home.mjs:32–37 explicitly cites this proposal; source Worker filesystem and process envelope / Output ingestion and mutation records the boundary. Private-home implementation survives, while relay/full containment is still proposed. Complete source heading docs/architect/proposals/coordination-worker-provider-boundary.md#new-evidence-since-the-first-capability-audit (lines 34–34) is carried at docs/platform/proposals/coordination-worker-provider-boundary.md#new-evidence-since-the-first-capability-audit (lines 58–58); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by native retained identity. Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding.",
    "reviewNote": "deep: docs/architect/proposals/coordination-worker-provider-boundary.md#new-evidence-since-the-first-capability-audit (L34-34) to docs/platform/proposals/coordination-worker-provider-boundary.md#new-evidence-since-the-first-capability-audit (L58-58) (pack class Unit-exact, the rationale opens with the Weak-exact wording, harmless because the digests are equal): shard row equals pack, source and target digests recomputed by extractor and equal, anchors pass, whole section diffed source vs target byte-identical, ancestry equal, rationale evidence cites live files that exist; whole-pack escalation read",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-19ca8de23.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "ff821d613e8f839e523d5262b1f93881db3e7beefc78eb34bce79a6d152e2301",
    "targetAncestry": [
      "Coordination Envelope — Worker, Provider, and Control Boundary"
    ],
    "reviewReportCommit": "4a18f35ff5d6a9b7a07e955bd64418282c6a91b2"
  },
  "after": {
    "claimId": "claim_8dc6683dbb0a864d34d8649af015ce4a",
    "sourceUnitDigest": "ff821d613e8f839e523d5262b1f93881db3e7beefc78eb34bce79a6d152e2301",
    "targetOwner": "docs/platform/proposals/coordination-worker-provider-boundary.md",
    "targetAnchor": "new-evidence-since-the-first-capability-audit",
    "claimKind": "contract",
    "disposition": "supersede",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "Weak-exact: current source and target unit digests are equal; placement ancestry is disclosed.; mandatory A36 deep read. place verbatim: Keep map proposal in full. Supporting OS probes and private HOME are not full implementation; retain Not started statement as source metadata. Evidence: src/runner/dispatch/worker-home.mjs:32–37 explicitly cites this proposal; source Worker filesystem and process envelope / Output ingestion and mutation records the boundary. Private-home implementation survives, while relay/full containment is still proposed. Complete source heading docs/architect/proposals/coordination-worker-provider-boundary.md#new-evidence-since-the-first-capability-audit (lines 34–34) is carried at docs/platform/proposals/coordination-worker-provider-boundary.md#new-evidence-since-the-first-capability-audit (lines 58–58); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by native retained identity. Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding.",
    "reviewNote": "mechanical: full digests recomputed by the extractor at 345f15d95 and equal to the shard and the pack; anchor new-evidence-since-the-first-capability-audit ok; source and target digests equal (text byte-equal by digest); rationale line ranges equal the live unit ranges; text not read beyond what is stated",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-02-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "ff821d613e8f839e523d5262b1f93881db3e7beefc78eb34bce79a6d152e2301",
    "targetAncestry": [
      "Coordination Envelope — Worker, Provider, and Control Boundary"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "currentDecision": {
    "claimId": "claim_8dc6683dbb0a864d34d8649af015ce4a",
    "sourceUnitDigest": "ff821d613e8f839e523d5262b1f93881db3e7beefc78eb34bce79a6d152e2301",
    "targetOwner": "docs/platform/proposals/coordination-worker-provider-boundary.md",
    "targetAnchor": "new-evidence-since-the-first-capability-audit",
    "claimKind": "contract",
    "disposition": "supersede",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "Weak-exact: current source and target unit digests are equal; placement ancestry is disclosed.; mandatory A36 deep read. place verbatim: Keep map proposal in full. Supporting OS probes and private HOME are not full implementation; retain Not started statement as source metadata. Evidence: src/runner/dispatch/worker-home.mjs:32–37 explicitly cites this proposal; source Worker filesystem and process envelope / Output ingestion and mutation records the boundary. Private-home implementation survives, while relay/full containment is still proposed. Complete source heading docs/architect/proposals/coordination-worker-provider-boundary.md#new-evidence-since-the-first-capability-audit (lines 34–34) is carried at docs/platform/proposals/coordination-worker-provider-boundary.md#new-evidence-since-the-first-capability-audit (lines 58–58); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by native retained identity. Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding.",
    "reviewNote": "mechanical: full digests recomputed by the extractor at 345f15d95 and equal to the shard and the pack; anchor new-evidence-since-the-first-capability-audit ok; source and target digests equal (text byte-equal by digest); rationale line ranges equal the live unit ranges; text not read beyond what is stated",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-02-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "ff821d613e8f839e523d5262b1f93881db3e7beefc78eb34bce79a6d152e2301",
    "targetAncestry": [
      "Coordination Envelope — Worker, Provider, and Control Boundary"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-315"
}
```

## Entry decisions-316

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s7-proposals-redesigns-13-coordination-worker-provider-boundary.json",
  "collection": "claims",
  "claimId": "claim_339a0cb071824020b79d4945db284748",
  "before": {
    "claimId": "claim_339a0cb071824020b79d4945db284748",
    "sourceUnitDigest": "87f61928718040da2b901c10a384cf8eed30496a360d1ffc73db97f6a77bc46c",
    "targetOwner": "docs/platform/proposals/coordination-worker-provider-boundary.md",
    "targetAnchor": "unheaded-block-11",
    "claimKind": "contract",
    "disposition": "supersede",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "Weak-exact: current source and target unit digests are equal; placement ancestry is disclosed.; mandatory A36 deep read. place verbatim: Keep map proposal in full. Supporting OS probes and private HOME are not full implementation; retain Not started statement as source metadata. Evidence: src/runner/dispatch/worker-home.mjs:32–37 explicitly cites this proposal; source Worker filesystem and process envelope / Output ingestion and mutation records the boundary. Private-home implementation survives, while relay/full containment is still proposed. Complete source unheaded-block docs/architect/proposals/coordination-worker-provider-boundary.md#unheaded-block-8 (lines 50–54) is carried at docs/platform/proposals/coordination-worker-provider-boundary.md#unheaded-block-11 (lines 74–78); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by committed line-diff correspondence with equal unit kind and ancestry (equal). Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding.",
    "reviewNote": "deep: docs/architect/proposals/coordination-worker-provider-boundary.md#unheaded-block-8 (L50-54) to docs/platform/proposals/coordination-worker-provider-boundary.md#unheaded-block-11 (L74-78) (pack class Unit-exact, the rationale opens with the Weak-exact wording, harmless because the digests are equal): shard row equals pack, source and target digests recomputed by extractor and equal, anchors pass, whole section diffed source vs target byte-identical, ancestry equal, rationale evidence cites live files that exist; whole-pack escalation read",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-19ca8de23.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "87f61928718040da2b901c10a384cf8eed30496a360d1ffc73db97f6a77bc46c",
    "targetAncestry": [
      "Coordination Envelope — Worker, Provider, and Control Boundary",
      "New evidence since the first capability audit"
    ],
    "reviewReportCommit": "4a18f35ff5d6a9b7a07e955bd64418282c6a91b2"
  },
  "after": {
    "claimId": "claim_339a0cb071824020b79d4945db284748",
    "sourceUnitDigest": "87f61928718040da2b901c10a384cf8eed30496a360d1ffc73db97f6a77bc46c",
    "targetOwner": "docs/platform/proposals/coordination-worker-provider-boundary.md",
    "targetAnchor": "unheaded-block-11",
    "claimKind": "contract",
    "disposition": "supersede",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "Weak-exact: current source and target unit digests are equal; placement ancestry is disclosed.; mandatory A36 deep read. place verbatim: Keep map proposal in full. Supporting OS probes and private HOME are not full implementation; retain Not started statement as source metadata. Evidence: src/runner/dispatch/worker-home.mjs:32–37 explicitly cites this proposal; source Worker filesystem and process envelope / Output ingestion and mutation records the boundary. Private-home implementation survives, while relay/full containment is still proposed. Complete source unheaded-block docs/architect/proposals/coordination-worker-provider-boundary.md#unheaded-block-8 (lines 50–54) is carried at docs/platform/proposals/coordination-worker-provider-boundary.md#unheaded-block-11 (lines 74–78); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by committed line-diff correspondence with equal unit kind and ancestry (equal). Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding.",
    "reviewNote": "mechanical: full digests recomputed by the extractor at 345f15d95 and equal to the shard and the pack; anchor unheaded-block-11 ok; source and target digests equal (text byte-equal by digest); rationale line ranges equal the live unit ranges; text not read beyond what is stated",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-02-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "87f61928718040da2b901c10a384cf8eed30496a360d1ffc73db97f6a77bc46c",
    "targetAncestry": [
      "Coordination Envelope — Worker, Provider, and Control Boundary",
      "New evidence since the first capability audit"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "currentDecision": {
    "claimId": "claim_339a0cb071824020b79d4945db284748",
    "sourceUnitDigest": "87f61928718040da2b901c10a384cf8eed30496a360d1ffc73db97f6a77bc46c",
    "targetOwner": "docs/platform/proposals/coordination-worker-provider-boundary.md",
    "targetAnchor": "unheaded-block-11",
    "claimKind": "contract",
    "disposition": "supersede",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "Weak-exact: current source and target unit digests are equal; placement ancestry is disclosed.; mandatory A36 deep read. place verbatim: Keep map proposal in full. Supporting OS probes and private HOME are not full implementation; retain Not started statement as source metadata. Evidence: src/runner/dispatch/worker-home.mjs:32–37 explicitly cites this proposal; source Worker filesystem and process envelope / Output ingestion and mutation records the boundary. Private-home implementation survives, while relay/full containment is still proposed. Complete source unheaded-block docs/architect/proposals/coordination-worker-provider-boundary.md#unheaded-block-8 (lines 50–54) is carried at docs/platform/proposals/coordination-worker-provider-boundary.md#unheaded-block-11 (lines 74–78); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by committed line-diff correspondence with equal unit kind and ancestry (equal). Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding.",
    "reviewNote": "mechanical: full digests recomputed by the extractor at 345f15d95 and equal to the shard and the pack; anchor unheaded-block-11 ok; source and target digests equal (text byte-equal by digest); rationale line ranges equal the live unit ranges; text not read beyond what is stated",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-02-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "87f61928718040da2b901c10a384cf8eed30496a360d1ffc73db97f6a77bc46c",
    "targetAncestry": [
      "Coordination Envelope — Worker, Provider, and Control Boundary",
      "New evidence since the first capability audit"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-316"
}
```

## Entry decisions-317

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s7-proposals-redesigns-15-readme.json",
  "collection": "claims",
  "claimId": "claim_69cd8997c627f22f069222676cc25e4d",
  "before": {
    "claimId": "claim_69cd8997c627f22f069222676cc25e4d",
    "sourceUnitDigest": "35d38e36aa9ae5117a3aba40a90d734ccb07badb2f8c4c7e19984e6f6c0b1b93",
    "targetOwner": "docs/platform/proposals/README.md",
    "targetAnchor": "active-proposals",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "Weak-exact: current source and target unit digests are equal; placement ancestry is disclosed.; mandatory A36 deep read. place verbatim: Keep the map collection-index as a candidate snapshot. Its active list is historical source wording and will not describe the final live/history split; navigation owner owes reviewed update, no silent rewrite now. Evidence: Source Active Proposals and Handoff Prompts lists six entries, with five active proposal links; the snapshot lists 6 of the directory’s 14 entries, all six carried in full. The map explicitly assigns collection-index; no semantic required-root consumer was found (README.md basename matches are unrelated). Complete source heading docs/architect/proposals/README.md#active-proposals (lines 16–16) is carried at docs/platform/proposals/README.md#active-proposals (lines 40–40); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by native retained identity. Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding.",
    "priorReview": {
      "claimId": "claim_69cd8997c627f22f069222676cc25e4d",
      "sourceUnitDigest": "35d38e36aa9ae5117a3aba40a90d734ccb07badb2f8c4c7e19984e6f6c0b1b93",
      "targetOwner": "docs/platform/proposals/README.md",
      "targetAnchor": "active-proposals",
      "claimKind": "architecture",
      "disposition": "supersede",
      "reviewStatus": "reviewed",
      "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
      "rationale": "Judgment: target unit digest differs; mandatory A36 deep read. place verbatim: Keep the map collection-index as a candidate snapshot. Its active list is historical source wording and will not describe the final live/history split; navigation owner owes reviewed update, no silent rewrite now. Evidence: Source Active Proposals and Handoff Prompts lists six entries, with five active proposal links; it omits later siblings. The map explicitly assigns collection-index; no semantic required-root consumer was found (README.md basename matches are unrelated). Complete source heading docs/architect/proposals/README.md#active-proposals (lines 16–16) is carried at docs/platform/proposals/README.md#active-proposals (lines 40–40); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement.",
      "reviewNote": "deep: heading active-proposals src lines 16-16 -> tgt active-proposals lines 40-40; shown source and target diffed line by line, only 5 link destination(s) rebased and each resolves to the same repository path as the source link, no wording change; supersede to README.md per map/triage, rationale evidence true.",
      "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
      "reviewedAt": "2026-10-15",
      "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-261015-1110-proposals-redesigns-source-15-01-0f063d18f.md",
      "reviewMode": "ordinary",
      "targetUnitDigest": "d836846ddf01300cd1a50ab447e19e2c6b478104bf0621e9f044b37446c2feb4",
      "targetAncestry": [
        "Architect-Level Proposals"
      ],
      "reviewReportCommit": "f5ca5d9e73b46d31bebf81e8e1cada96d022a09c"
    },
    "reviewNote": "deep: docs/architect/proposals/README.md#active-proposals (L16-16) to docs/platform/proposals/README.md#active-proposals (L40-40): shard row equals pack, source and target digests recomputed by extractor and equal, anchors pass, whole section diffed source vs target byte-identical, ancestry equal, rationale evidence cites live files that exist; whole-pack escalation read",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-19ca8de23.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "35d38e36aa9ae5117a3aba40a90d734ccb07badb2f8c4c7e19984e6f6c0b1b93",
    "targetAncestry": [
      "Architect-Level Proposals"
    ],
    "reviewReportCommit": "4a18f35ff5d6a9b7a07e955bd64418282c6a91b2"
  },
  "after": {
    "claimId": "claim_69cd8997c627f22f069222676cc25e4d",
    "sourceUnitDigest": "35d38e36aa9ae5117a3aba40a90d734ccb07badb2f8c4c7e19984e6f6c0b1b93",
    "targetOwner": "docs/platform/proposals/README.md",
    "targetAnchor": "active-proposals",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "Weak-exact: current source and target unit digests are equal; placement ancestry is disclosed.; mandatory A36 deep read. place verbatim: Keep the map collection-index as a candidate snapshot. Its active list is historical source wording and will not describe the final live/history split; navigation owner owes reviewed update, no silent rewrite now. Evidence: Source Active Proposals and Handoff Prompts lists six entries, with five active proposal links; the snapshot lists 6 of the directory’s 14 entries, all six carried in full. The map explicitly assigns collection-index; no semantic required-root consumer was found (README.md basename matches are unrelated). Complete source heading docs/architect/proposals/README.md#active-proposals (lines 16–16) is carried at docs/platform/proposals/README.md#active-proposals (lines 40–40); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by native retained identity. Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding.",
    "priorReview": {
      "claimId": "claim_69cd8997c627f22f069222676cc25e4d",
      "sourceUnitDigest": "35d38e36aa9ae5117a3aba40a90d734ccb07badb2f8c4c7e19984e6f6c0b1b93",
      "targetOwner": "docs/platform/proposals/README.md",
      "targetAnchor": "active-proposals",
      "claimKind": "architecture",
      "disposition": "supersede",
      "reviewStatus": "reviewed",
      "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
      "rationale": "Judgment: target unit digest differs; mandatory A36 deep read. place verbatim: Keep the map collection-index as a candidate snapshot. Its active list is historical source wording and will not describe the final live/history split; navigation owner owes reviewed update, no silent rewrite now. Evidence: Source Active Proposals and Handoff Prompts lists six entries, with five active proposal links; it omits later siblings. The map explicitly assigns collection-index; no semantic required-root consumer was found (README.md basename matches are unrelated). Complete source heading docs/architect/proposals/README.md#active-proposals (lines 16–16) is carried at docs/platform/proposals/README.md#active-proposals (lines 40–40); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement.",
      "reviewNote": "deep: heading active-proposals src lines 16-16 -> tgt active-proposals lines 40-40; shown source and target diffed line by line, only 5 link destination(s) rebased and each resolves to the same repository path as the source link, no wording change; supersede to README.md per map/triage, rationale evidence true.",
      "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
      "reviewedAt": "2026-10-15",
      "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-261015-1110-proposals-redesigns-source-15-01-0f063d18f.md",
      "reviewMode": "ordinary",
      "targetUnitDigest": "d836846ddf01300cd1a50ab447e19e2c6b478104bf0621e9f044b37446c2feb4",
      "targetAncestry": [
        "Architect-Level Proposals"
      ],
      "reviewReportCommit": "f5ca5d9e73b46d31bebf81e8e1cada96d022a09c"
    },
    "reviewNote": "mechanical: full digests recomputed by the extractor at 345f15d95 and equal to the shard and the pack; anchor active-proposals ok; source and target digests equal (text byte-equal by digest); rationale line ranges equal the live unit ranges; text not read beyond what is stated",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-02-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "35d38e36aa9ae5117a3aba40a90d734ccb07badb2f8c4c7e19984e6f6c0b1b93",
    "targetAncestry": [
      "Architect-Level Proposals"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "currentDecision": {
    "claimId": "claim_69cd8997c627f22f069222676cc25e4d",
    "sourceUnitDigest": "35d38e36aa9ae5117a3aba40a90d734ccb07badb2f8c4c7e19984e6f6c0b1b93",
    "targetOwner": "docs/platform/proposals/README.md",
    "targetAnchor": "active-proposals",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "Weak-exact: current source and target unit digests are equal; placement ancestry is disclosed.; mandatory A36 deep read. place verbatim: Keep the map collection-index as a candidate snapshot. Its active list is historical source wording and will not describe the final live/history split; navigation owner owes reviewed update, no silent rewrite now. Evidence: Source Active Proposals and Handoff Prompts lists six entries, with five active proposal links; the snapshot lists 6 of the directory’s 14 entries, all six carried in full. The map explicitly assigns collection-index; no semantic required-root consumer was found (README.md basename matches are unrelated). Complete source heading docs/architect/proposals/README.md#active-proposals (lines 16–16) is carried at docs/platform/proposals/README.md#active-proposals (lines 40–40); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by native retained identity. Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding.",
    "priorReview": {
      "claimId": "claim_69cd8997c627f22f069222676cc25e4d",
      "sourceUnitDigest": "35d38e36aa9ae5117a3aba40a90d734ccb07badb2f8c4c7e19984e6f6c0b1b93",
      "targetOwner": "docs/platform/proposals/README.md",
      "targetAnchor": "active-proposals",
      "claimKind": "architecture",
      "disposition": "supersede",
      "reviewStatus": "reviewed",
      "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
      "rationale": "Judgment: target unit digest differs; mandatory A36 deep read. place verbatim: Keep the map collection-index as a candidate snapshot. Its active list is historical source wording and will not describe the final live/history split; navigation owner owes reviewed update, no silent rewrite now. Evidence: Source Active Proposals and Handoff Prompts lists six entries, with five active proposal links; it omits later siblings. The map explicitly assigns collection-index; no semantic required-root consumer was found (README.md basename matches are unrelated). Complete source heading docs/architect/proposals/README.md#active-proposals (lines 16–16) is carried at docs/platform/proposals/README.md#active-proposals (lines 40–40); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement.",
      "reviewNote": "deep: heading active-proposals src lines 16-16 -> tgt active-proposals lines 40-40; shown source and target diffed line by line, only 5 link destination(s) rebased and each resolves to the same repository path as the source link, no wording change; supersede to README.md per map/triage, rationale evidence true.",
      "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
      "reviewedAt": "2026-10-15",
      "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-261015-1110-proposals-redesigns-source-15-01-0f063d18f.md",
      "reviewMode": "ordinary",
      "targetUnitDigest": "d836846ddf01300cd1a50ab447e19e2c6b478104bf0621e9f044b37446c2feb4",
      "targetAncestry": [
        "Architect-Level Proposals"
      ],
      "reviewReportCommit": "f5ca5d9e73b46d31bebf81e8e1cada96d022a09c"
    },
    "reviewNote": "mechanical: full digests recomputed by the extractor at 345f15d95 and equal to the shard and the pack; anchor active-proposals ok; source and target digests equal (text byte-equal by digest); rationale line ranges equal the live unit ranges; text not read beyond what is stated",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-02-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "35d38e36aa9ae5117a3aba40a90d734ccb07badb2f8c4c7e19984e6f6c0b1b93",
    "targetAncestry": [
      "Architect-Level Proposals"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-317"
}
```

## Entry decisions-318

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s7-proposals-redesigns-15-readme.json",
  "collection": "claims",
  "claimId": "claim_76cd5a79f79a23ddf7bf30b53312aadf",
  "before": {
    "claimId": "claim_76cd5a79f79a23ddf7bf30b53312aadf",
    "sourceUnitDigest": "949cee59831d5ac67c174f297bcdcc5837dca9532809923571987f7cb12a42b0",
    "targetOwner": "docs/platform/proposals/README.md",
    "targetAnchor": "unheaded-block-7",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "Weak-exact: current source and target unit digests are equal; placement ancestry is disclosed.; mandatory A36 deep read. place verbatim: Keep the map collection-index as a candidate snapshot. Its active list is historical source wording and will not describe the final live/history split; navigation owner owes reviewed update, no silent rewrite now. Evidence: Source Active Proposals and Handoff Prompts lists six entries, with five active proposal links; the snapshot lists 6 of the directory’s 14 entries, all six carried in full. The map explicitly assigns collection-index; no semantic required-root consumer was found (README.md basename matches are unrelated). Complete source unheaded-block docs/architect/proposals/README.md#unheaded-block-4 (lines 18–28) is carried at docs/platform/proposals/README.md#unheaded-block-7 (lines 42–52); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by committed line-diff correspondence with equal unit kind and ancestry (replace). Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding.",
    "priorReview": {
      "claimId": "claim_76cd5a79f79a23ddf7bf30b53312aadf",
      "sourceUnitDigest": "949cee59831d5ac67c174f297bcdcc5837dca9532809923571987f7cb12a42b0",
      "targetOwner": "docs/platform/proposals/README.md",
      "targetAnchor": "unheaded-block-7",
      "claimKind": "architecture",
      "disposition": "supersede",
      "reviewStatus": "reviewed",
      "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
      "rationale": "Judgment: target unit digest differs; mandatory A36 deep read. place verbatim: Keep the map collection-index as a candidate snapshot. Its active list is historical source wording and will not describe the final live/history split; navigation owner owes reviewed update, no silent rewrite now. Evidence: Source Active Proposals and Handoff Prompts lists six entries, with five active proposal links; it omits later siblings. The map explicitly assigns collection-index; no semantic required-root consumer was found (README.md basename matches are unrelated). Complete source unheaded-block docs/architect/proposals/README.md#unheaded-block-4 (lines 18–28) is carried at docs/platform/proposals/README.md#unheaded-block-7 (lines 42–52); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement.",
      "reviewNote": "deep: unheaded-block unheaded-block-4 src lines 18-28 -> tgt unheaded-block-7 lines 42-52; shown source and target diffed line by line, only 5 link destination(s) rebased and each resolves to the same repository path as the source link, no wording change; supersede to README.md per map/triage, rationale evidence true.",
      "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
      "reviewedAt": "2026-10-15",
      "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-261015-1110-proposals-redesigns-source-15-01-0f063d18f.md",
      "reviewMode": "ordinary",
      "targetUnitDigest": "3d3d1d86ca10ef2ed0b784f13f86a69a4f06b906a73fcdf2eeca096c8119b5c0",
      "targetAncestry": [
        "Architect-Level Proposals",
        "Active Proposals"
      ],
      "reviewReportCommit": "f5ca5d9e73b46d31bebf81e8e1cada96d022a09c"
    },
    "reviewNote": "deep: docs/architect/proposals/README.md#unheaded-block-4 (L18-28) to docs/platform/proposals/README.md#unheaded-block-7 (L42-52) (pack class Unit-exact, the rationale opens with the Weak-exact wording, harmless because the digests are equal): shard row equals pack, source and target digests recomputed by extractor and equal, anchors pass, whole section diffed source vs target byte-identical, ancestry equal, rationale evidence cites live files that exist; whole-pack escalation read",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-19ca8de23.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "949cee59831d5ac67c174f297bcdcc5837dca9532809923571987f7cb12a42b0",
    "targetAncestry": [
      "Architect-Level Proposals",
      "Active Proposals"
    ],
    "reviewReportCommit": "4a18f35ff5d6a9b7a07e955bd64418282c6a91b2"
  },
  "after": {
    "claimId": "claim_76cd5a79f79a23ddf7bf30b53312aadf",
    "sourceUnitDigest": "949cee59831d5ac67c174f297bcdcc5837dca9532809923571987f7cb12a42b0",
    "targetOwner": "docs/platform/proposals/README.md",
    "targetAnchor": "unheaded-block-7",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "Weak-exact: current source and target unit digests are equal; placement ancestry is disclosed.; mandatory A36 deep read. place verbatim: Keep the map collection-index as a candidate snapshot. Its active list is historical source wording and will not describe the final live/history split; navigation owner owes reviewed update, no silent rewrite now. Evidence: Source Active Proposals and Handoff Prompts lists six entries, with five active proposal links; the snapshot lists 6 of the directory’s 14 entries, all six carried in full. The map explicitly assigns collection-index; no semantic required-root consumer was found (README.md basename matches are unrelated). Complete source unheaded-block docs/architect/proposals/README.md#unheaded-block-4 (lines 18–28) is carried at docs/platform/proposals/README.md#unheaded-block-7 (lines 42–52); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by committed line-diff correspondence with equal unit kind and ancestry (replace). Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding.",
    "priorReview": {
      "claimId": "claim_76cd5a79f79a23ddf7bf30b53312aadf",
      "sourceUnitDigest": "949cee59831d5ac67c174f297bcdcc5837dca9532809923571987f7cb12a42b0",
      "targetOwner": "docs/platform/proposals/README.md",
      "targetAnchor": "unheaded-block-7",
      "claimKind": "architecture",
      "disposition": "supersede",
      "reviewStatus": "reviewed",
      "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
      "rationale": "Judgment: target unit digest differs; mandatory A36 deep read. place verbatim: Keep the map collection-index as a candidate snapshot. Its active list is historical source wording and will not describe the final live/history split; navigation owner owes reviewed update, no silent rewrite now. Evidence: Source Active Proposals and Handoff Prompts lists six entries, with five active proposal links; it omits later siblings. The map explicitly assigns collection-index; no semantic required-root consumer was found (README.md basename matches are unrelated). Complete source unheaded-block docs/architect/proposals/README.md#unheaded-block-4 (lines 18–28) is carried at docs/platform/proposals/README.md#unheaded-block-7 (lines 42–52); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement.",
      "reviewNote": "deep: unheaded-block unheaded-block-4 src lines 18-28 -> tgt unheaded-block-7 lines 42-52; shown source and target diffed line by line, only 5 link destination(s) rebased and each resolves to the same repository path as the source link, no wording change; supersede to README.md per map/triage, rationale evidence true.",
      "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
      "reviewedAt": "2026-10-15",
      "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-261015-1110-proposals-redesigns-source-15-01-0f063d18f.md",
      "reviewMode": "ordinary",
      "targetUnitDigest": "3d3d1d86ca10ef2ed0b784f13f86a69a4f06b906a73fcdf2eeca096c8119b5c0",
      "targetAncestry": [
        "Architect-Level Proposals",
        "Active Proposals"
      ],
      "reviewReportCommit": "f5ca5d9e73b46d31bebf81e8e1cada96d022a09c"
    },
    "reviewNote": "mechanical: full digests recomputed by the extractor at 345f15d95 and equal to the shard and the pack; anchor unheaded-block-7 ok; source and target digests equal (text byte-equal by digest); rationale line ranges equal the live unit ranges; text not read beyond what is stated",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-02-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "949cee59831d5ac67c174f297bcdcc5837dca9532809923571987f7cb12a42b0",
    "targetAncestry": [
      "Architect-Level Proposals",
      "Active Proposals"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "currentDecision": {
    "claimId": "claim_76cd5a79f79a23ddf7bf30b53312aadf",
    "sourceUnitDigest": "949cee59831d5ac67c174f297bcdcc5837dca9532809923571987f7cb12a42b0",
    "targetOwner": "docs/platform/proposals/README.md",
    "targetAnchor": "unheaded-block-7",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "Weak-exact: current source and target unit digests are equal; placement ancestry is disclosed.; mandatory A36 deep read. place verbatim: Keep the map collection-index as a candidate snapshot. Its active list is historical source wording and will not describe the final live/history split; navigation owner owes reviewed update, no silent rewrite now. Evidence: Source Active Proposals and Handoff Prompts lists six entries, with five active proposal links; the snapshot lists 6 of the directory’s 14 entries, all six carried in full. The map explicitly assigns collection-index; no semantic required-root consumer was found (README.md basename matches are unrelated). Complete source unheaded-block docs/architect/proposals/README.md#unheaded-block-4 (lines 18–28) is carried at docs/platform/proposals/README.md#unheaded-block-7 (lines 42–52); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by committed line-diff correspondence with equal unit kind and ancestry (replace). Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding.",
    "priorReview": {
      "claimId": "claim_76cd5a79f79a23ddf7bf30b53312aadf",
      "sourceUnitDigest": "949cee59831d5ac67c174f297bcdcc5837dca9532809923571987f7cb12a42b0",
      "targetOwner": "docs/platform/proposals/README.md",
      "targetAnchor": "unheaded-block-7",
      "claimKind": "architecture",
      "disposition": "supersede",
      "reviewStatus": "reviewed",
      "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
      "rationale": "Judgment: target unit digest differs; mandatory A36 deep read. place verbatim: Keep the map collection-index as a candidate snapshot. Its active list is historical source wording and will not describe the final live/history split; navigation owner owes reviewed update, no silent rewrite now. Evidence: Source Active Proposals and Handoff Prompts lists six entries, with five active proposal links; it omits later siblings. The map explicitly assigns collection-index; no semantic required-root consumer was found (README.md basename matches are unrelated). Complete source unheaded-block docs/architect/proposals/README.md#unheaded-block-4 (lines 18–28) is carried at docs/platform/proposals/README.md#unheaded-block-7 (lines 42–52); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement.",
      "reviewNote": "deep: unheaded-block unheaded-block-4 src lines 18-28 -> tgt unheaded-block-7 lines 42-52; shown source and target diffed line by line, only 5 link destination(s) rebased and each resolves to the same repository path as the source link, no wording change; supersede to README.md per map/triage, rationale evidence true.",
      "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
      "reviewedAt": "2026-10-15",
      "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-261015-1110-proposals-redesigns-source-15-01-0f063d18f.md",
      "reviewMode": "ordinary",
      "targetUnitDigest": "3d3d1d86ca10ef2ed0b784f13f86a69a4f06b906a73fcdf2eeca096c8119b5c0",
      "targetAncestry": [
        "Architect-Level Proposals",
        "Active Proposals"
      ],
      "reviewReportCommit": "f5ca5d9e73b46d31bebf81e8e1cada96d022a09c"
    },
    "reviewNote": "mechanical: full digests recomputed by the extractor at 345f15d95 and equal to the shard and the pack; anchor unheaded-block-7 ok; source and target digests equal (text byte-equal by digest); rationale line ranges equal the live unit ranges; text not read beyond what is stated",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-02-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "949cee59831d5ac67c174f297bcdcc5837dca9532809923571987f7cb12a42b0",
    "targetAncestry": [
      "Architect-Level Proposals",
      "Active Proposals"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-318"
}
```

## Entry decisions-319

```json
{
  "kind": "committed-review-application-confirmation",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s7-proposals-redesigns-16-step-09-group-thinking-substrate.json",
  "collection": "claims",
  "claimId": "claim_3865318571c3ebc0fed1203eddbca0c1",
  "before": {
    "claimId": "claim_3865318571c3ebc0fed1203eddbca0c1",
    "sourceUnitDigest": "e799486b069151affad99d34ae91de8d072b833dcc183a52ca0cfc6d7abb6457",
    "targetOwner": "docs/platform/proposals/step-09-group-thinking-substrate.md",
    "targetAnchor": "5-prompt-source-not-runtime-dependency",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "Weak-exact: current source and target unit digests are equal; placement ancestry is disclosed.; mandatory A36 deep read. place verbatim: Reject whole-file archive because live guidance still consumes its unfulfilled intent. Keep map proposal verbatim; old shipped slice is not claimed current and deferred obligations are not dropped. Evidence: docs/how-to/use-fgos-group-thinking.md:196–200 cites this source for deferred capabilities. core/skills/fgos-group-thinking/SKILL.md:27–40 now drives Workflows/presets; 2180b4e72 removed the old pack. Source header distinguishes implemented MVP0–9 from still-deferred items. Complete source heading docs/architect/proposals/step-09-group-thinking-substrate.md#5-prompt-source-not-runtime-dependency (lines 167–167) is carried at docs/platform/proposals/step-09-group-thinking-substrate.md#5-prompt-source-not-runtime-dependency (lines 191–191); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by native retained identity. Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding. Package at 2300d65571968bb3bcb80123a273272586e3f1db: pending target rebind by native retained identity. Full before/after and digests are in step10-sync2300-rebindings.json; historical approval does not cover the changed binding.",
    "reviewNote": "deep: docs/architect/proposals/step-09-group-thinking-substrate.md#5-prompt-source-not-runtime-dependency (L167-167) to docs/platform/proposals/step-09-group-thinking-substrate.md#5-prompt-source-not-runtime-dependency (L191-191) (pack class Unit-exact, the rationale opens with the Weak-exact wording, harmless because the digests are equal): shard row equals pack, source and target digests recomputed by extractor and equal, anchors pass, whole section diffed source vs target byte-identical, ancestry equal, rationale evidence cites live files that exist; whole-pack escalation read",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-04-19ca8de23.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "e799486b069151affad99d34ae91de8d072b833dcc183a52ca0cfc6d7abb6457",
    "targetAncestry": [
      "Step 09 - Group Thinking Substrate"
    ],
    "reviewReportCommit": "4a18f35ff5d6a9b7a07e955bd64418282c6a91b2"
  },
  "after": {
    "claimId": "claim_3865318571c3ebc0fed1203eddbca0c1",
    "sourceUnitDigest": "e799486b069151affad99d34ae91de8d072b833dcc183a52ca0cfc6d7abb6457",
    "targetOwner": "docs/platform/proposals/step-09-group-thinking-substrate.md",
    "targetAnchor": "5-prompt-source-not-runtime-dependency",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "Weak-exact: current source and target unit digests are equal; placement ancestry is disclosed.; mandatory A36 deep read. place verbatim: Reject whole-file archive because live guidance still consumes its unfulfilled intent. Keep map proposal verbatim; old shipped slice is not claimed current and deferred obligations are not dropped. Evidence: docs/how-to/use-fgos-group-thinking.md:196–200 cites this source for deferred capabilities. core/skills/fgos-group-thinking/SKILL.md:27–40 now drives Workflows/presets; 2180b4e72 removed the old pack. Source header distinguishes implemented MVP0–9 from still-deferred items. Complete source heading docs/architect/proposals/step-09-group-thinking-substrate.md#5-prompt-source-not-runtime-dependency (lines 167–167) is carried at docs/platform/proposals/step-09-group-thinking-substrate.md#5-prompt-source-not-runtime-dependency (lines 191–191); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by native retained identity. Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding. Package at 2300d65571968bb3bcb80123a273272586e3f1db: pending target rebind by native retained identity. Full before/after and digests are in step10-sync2300-rebindings.json; historical approval does not cover the changed binding.",
    "reviewNote": "mechanical: full digests recomputed by the extractor at 345f15d95 and equal to the shard and the pack; anchor 5-prompt-source-not-runtime-dependency ok; source and target digests equal (text byte-equal by digest); rationale line ranges equal the live unit ranges; text not read beyond what is stated",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-02-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "e799486b069151affad99d34ae91de8d072b833dcc183a52ca0cfc6d7abb6457",
    "targetAncestry": [
      "Step 09 - Group Thinking Substrate"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "mechanicalRequired": true,
  "reviewScope": "Confirm exact committed application and verbatim Notes; existing approval is preserved.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "currentDecision": {
    "claimId": "claim_3865318571c3ebc0fed1203eddbca0c1",
    "sourceUnitDigest": "e799486b069151affad99d34ae91de8d072b833dcc183a52ca0cfc6d7abb6457",
    "targetOwner": "docs/platform/proposals/step-09-group-thinking-substrate.md",
    "targetAnchor": "5-prompt-source-not-runtime-dependency",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "rationale": "Weak-exact: current source and target unit digests are equal; placement ancestry is disclosed.; mandatory A36 deep read. place verbatim: Reject whole-file archive because live guidance still consumes its unfulfilled intent. Keep map proposal verbatim; old shipped slice is not claimed current and deferred obligations are not dropped. Evidence: docs/how-to/use-fgos-group-thinking.md:196–200 cites this source for deferred capabilities. core/skills/fgos-group-thinking/SKILL.md:27–40 now drives Workflows/presets; 2180b4e72 removed the old pack. Source header distinguishes implemented MVP0–9 from still-deferred items. Complete source heading docs/architect/proposals/step-09-group-thinking-substrate.md#5-prompt-source-not-runtime-dependency (lines 167–167) is carried at docs/platform/proposals/step-09-group-thinking-substrate.md#5-prompt-source-not-runtime-dependency (lines 191–191); Frozen map target and kind retained. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending. Whole-unit supersede is the frozen vocabulary’s permitted retained-source carriage representation: all original content is carried, with no promotion or immediate source retirement. Package at aecdc30aad0ffd65a2956ff642c4be9410686ede: pending target rebind by native retained identity. Full before/after and digests are in step10-package-rebindings.json; historical approval does not cover the changed binding. Package at 2300d65571968bb3bcb80123a273272586e3f1db: pending target rebind by native retained identity. Full before/after and digests are in step10-sync2300-rebindings.json; historical approval does not cover the changed binding.",
    "reviewNote": "mechanical: full digests recomputed by the extractor at 345f15d95 and equal to the shard and the pack; anchor 5-prompt-source-not-runtime-dependency ok; source and target digests equal (text byte-equal by digest); rationale line ranges equal the live unit ranges; text not read beyond what is stated",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-02-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "e799486b069151affad99d34ae91de8d072b833dcc183a52ca0cfc6d7abb6457",
    "targetAncestry": [
      "Step 09 - Group Thinking Substrate"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "decisions-319"
}
```

