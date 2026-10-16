# Bounded re-review: accounting 1

Author session: `codex-session:unit-run-1792090455209-159fbfed@2026-10-16`
Packaged by: `codex-session:unit-run-1792116045118-73cfbb42@2026-10-16`
Content commit: `287a22d33a0eaf2d9e47549a1142daf62361bb8c` (author changes at `0d8c602e2`)
Comparison base: `5035fed52e60254ecbe034cc987553feb24616f4`
Entries: **14**; each request at most60 entries and400000 bytes.

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

## Entry accounting-040

```json
{
  "kind": "refreshed-dependent-accounting",
  "historicalArtifact": "plans/260925-documentation-authority-unification/reports/phase-06/step10-sync19-predecessor-reconciliation.json",
  "historicalProjectionPath": "/receipts/1/after",
  "historicalSnapshot": {
    "claimId": "claim_f5365b8e40fb58c75adc56a574263242",
    "sourcePath": "docs/io-contract.md",
    "sourceUnitDigest": "fa53d50b84fef3025e7b4e5e8e810a83f885e4aab37a760652c1bcb9e676a5a9",
    "claimKind": "contract",
    "disposition": "partial-carry",
    "targetOwner": "docs/io-contract.md",
    "targetAnchor": "unheaded-block-5",
    "rationale": "A22/A31/A34: one native sync at 19ca8de23908e161c34c91626e41041b7813167c preserves this historical predecessor as a gap; current upstream source successor is separately native-accounted and carried to the candidate. Historical lines changed; exact untransferred residual is retained verbatim with SHA256, independent representation review required; cutover remains blocked. Full source/current witnesses and residual: step10-sync19-predecessor-residuals.json. No identity graft or approval carry.",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
    "reviewNote": "deep: historical unit docs/io-contract.md#unheaded-block-5 at witness 2300d6557 (L24-31, digest recomputed equal) against the current successor L24-34 (digest d3828696 recomputed equal): the longest-common-subsequence of lines leaves exactly the 3 residual lines the residual file records (their text equals residualText and its SHA256 b276baca recomputes), the successor is carried to the candidate by claim_57f11d83, so partial-carry with a named verbatim remainder is accurate; A34 acceptance stays false until this review, and the residual file SHA binding belongs to closure",
    "remainder": "Verbatim historical residual in plans/260925-documentation-authority-unification/reports/phase-06/step10-sync19-predecessor-residuals.json, claim claim_f5365b8e40fb58c75adc56a574263242, residual SHA256 b276baca8168777f55bdba5a90f6ca6334a7e6e1e5d0c9ebef8df5b362313957. Source fa53d50b84fef3025e7b4e5e8e810a83f885e4aab37a760652c1bcb9e676a5a9; primary target d38286962b4133b3c55926e513b03625483e4bd0b6b885a6fd3dde23c00686b8. Residual file SHA256 recorded in step10-sync19-predecessor-reconciliation.json. A34 independent acceptance pending; cutover blocked.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-19ca8de23.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "d38286962b4133b3c55926e513b03625483e4bd0b6b885a6fd3dde23c00686b8",
    "targetAncestry": [
      "Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner`",
      "Chiều vào — verb + danh tính"
    ],
    "reviewReportCommit": "4a18f35ff5d6a9b7a07e955bd64418282c6a91b2"
  },
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-io-contract.json",
  "collection": "registryGaps",
  "relatedClaimId": "claim_f5365b8e40fb58c75adc56a574263242",
  "after": {
    "claimId": "claim_f5365b8e40fb58c75adc56a574263242",
    "sourcePath": "docs/io-contract.md",
    "sourceUnitDigest": "fa53d50b84fef3025e7b4e5e8e810a83f885e4aab37a760652c1bcb9e676a5a9",
    "claimKind": "contract",
    "disposition": "partial-carry",
    "targetOwner": "docs/io-contract.md",
    "targetAnchor": "unheaded-block-5",
    "rationale": "A22/A31/A34: one native sync at 19ca8de23908e161c34c91626e41041b7813167c preserves this historical predecessor as a gap; current upstream source successor is separately native-accounted and carried to the candidate. Historical lines changed; exact untransferred residual is retained verbatim with SHA256, independent representation review required; cutover remains blocked. Full source/current witnesses and residual: step10-sync19-predecessor-residuals.json. No identity graft or approval carry.",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
    "reviewNote": "deep: historical docs/io-contract.md#unheaded-block-5 at witness 2300d6557 (L24-31, digest fa53d50b recomputed by extractor and by hand) against its successor d3828696 (current L24-34, recomputed): a line-subsequence comparison leaves exactly 3 residual lines whose text equals step10-sync19-predecessor-residuals.json and whose SHA256 b276baca recomputes (the residual file is unchanged since 62d147641); the successor is carried by claim_57f11d83, so partial-carry with a named verbatim remainder stays accurate; applied approval checked: the shard row equals the pack, the reviewNote equals the Note in my committed 19ca8de23 report byte for byte, reviewedBy/reviewedAt/reviewReport (review-step10-decisions-05-19ca8de23.md at 4a18f35ff) match, and every non-review field equals the row at the request commit of that round (62d147641)",
    "remainder": "Verbatim historical residual in plans/260925-documentation-authority-unification/reports/phase-06/step10-sync19-predecessor-residuals.json, claim claim_f5365b8e40fb58c75adc56a574263242, residual SHA256 b276baca8168777f55bdba5a90f6ca6334a7e6e1e5d0c9ebef8df5b362313957. Source fa53d50b84fef3025e7b4e5e8e810a83f885e4aab37a760652c1bcb9e676a5a9; primary target d38286962b4133b3c55926e513b03625483e4bd0b6b885a6fd3dde23c00686b8. Residual file SHA256 recorded in step10-sync19-predecessor-reconciliation.json. A34 independent acceptance pending; cutover blocked.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-03-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "d38286962b4133b3c55926e513b03625483e4bd0b6b885a6fd3dde23c00686b8",
    "targetAncestry": [
      "Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner`",
      "Chiều vào — verb + danh tính"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-5",
    "githubAnchor": "unheaded-block-5",
    "stableAnchor": "unheaded-block-5",
    "title": "Unheaded block 5",
    "startLine": 24,
    "endLine": 34,
    "textDigest": "d38286962b4133b3c55926e513b03625483e4bd0b6b885a6fd3dde23c00686b8",
    "sample": "- `writer.id` — cá thể nào đang gọi (phân biệt hai phiên agent chạy song\n  song), luôn có mặt.\n- `writer.source` — độ tin của `id` đó, một trong bốn giá trị theo thứ tự ưu\n  tiên: ",
    "identityFingerprint": "bcd5fad94d4723e8decd7375d5df9a749a53154e519ca0b4392815883b490e04",
    "ancestry": [
      "Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner`",
      "Chiều vào — verb + danh tính"
    ],
    "text": "- `writer.id` — cá thể nào đang gọi (phân biệt hai phiên agent chạy song\n  song), luôn có mặt.\n- `writer.source` — độ tin của `id` đó, một trong bốn giá trị theo thứ tự ưu\n  tiên: `registry` (đối chiếu được với `.fgos/sessions.json`, tin nhất) ·\n  `env` (biến môi trường, ai cũng set được) · `pid` (tổ tiên cao nhất còn\n  terminal, không có thì session id của tiến trình gọi; best-effort) ·\n  `unresolved` (không nguồn nào xác nhận được — `id` vẫn là\n  pid của chính tiến trình gọi, KHÔNG rỗng, KHÔNG vắng khoá; chỉ nhãn\n  `source` nói giá trị chưa kiểm chứng được). Luật đầy đủ (thứ tự biến env,\n  giới hạn đã biết) chỉ nằm ở [spec Session Identity](platform/session-identity/spec.md);\n  nguồn duy nhất là crate Rust `fgos-session-identity`."
  },
  "currentNativeSuccessor": {
    "sourcePath": "docs/io-contract.md",
    "unitDigest": "bcd5fad94d4723e8decd7375d5df9a749a53154e519ca0b4392815883b490e04",
    "identityFingerprint": "bcd5fad94d4723e8decd7375d5df9a749a53154e519ca0b4392815883b490e04",
    "claimId": "claim_57f11d837272b3f9781b376ef1665c81",
    "sourceAnchor": "unheaded-block-5",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "d38286962b4133b3c55926e513b03625483e4bd0b6b885a6fd3dde23c00686b8",
    "claimKind": "contract",
    "status": "current"
  },
  "sourceAndResidualHistoryPreserved": true,
  "reviewScope": "Current projection supersedes the historical artifact for this package only; historical before/native witness remains immutable. Pending rows receive no approval.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "currentDecision": {
    "claimId": "claim_f5365b8e40fb58c75adc56a574263242",
    "sourcePath": "docs/io-contract.md",
    "sourceUnitDigest": "fa53d50b84fef3025e7b4e5e8e810a83f885e4aab37a760652c1bcb9e676a5a9",
    "claimKind": "contract",
    "disposition": "partial-carry",
    "targetOwner": "docs/io-contract.md",
    "targetAnchor": "unheaded-block-5",
    "rationale": "A22/A31/A34: one native sync at 19ca8de23908e161c34c91626e41041b7813167c preserves this historical predecessor as a gap; current upstream source successor is separately native-accounted and carried to the candidate. Historical lines changed; exact untransferred residual is retained verbatim with SHA256, independent representation review required; cutover remains blocked. Full source/current witnesses and residual: step10-sync19-predecessor-residuals.json. No identity graft or approval carry.",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
    "reviewNote": "deep: historical docs/io-contract.md#unheaded-block-5 at witness 2300d6557 (L24-31, digest fa53d50b recomputed by extractor and by hand) against its successor d3828696 (current L24-34, recomputed): a line-subsequence comparison leaves exactly 3 residual lines whose text equals step10-sync19-predecessor-residuals.json and whose SHA256 b276baca recomputes (the residual file is unchanged since 62d147641); the successor is carried by claim_57f11d83, so partial-carry with a named verbatim remainder stays accurate; applied approval checked: the shard row equals the pack, the reviewNote equals the Note in my committed 19ca8de23 report byte for byte, reviewedBy/reviewedAt/reviewReport (review-step10-decisions-05-19ca8de23.md at 4a18f35ff) match, and every non-review field equals the row at the request commit of that round (62d147641)",
    "remainder": "Verbatim historical residual in plans/260925-documentation-authority-unification/reports/phase-06/step10-sync19-predecessor-residuals.json, claim claim_f5365b8e40fb58c75adc56a574263242, residual SHA256 b276baca8168777f55bdba5a90f6ca6334a7e6e1e5d0c9ebef8df5b362313957. Source fa53d50b84fef3025e7b4e5e8e810a83f885e4aab37a760652c1bcb9e676a5a9; primary target d38286962b4133b3c55926e513b03625483e4bd0b6b885a6fd3dde23c00686b8. Residual file SHA256 recorded in step10-sync19-predecessor-reconciliation.json. A34 independent acceptance pending; cutover blocked.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-03-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "d38286962b4133b3c55926e513b03625483e4bd0b6b885a6fd3dde23c00686b8",
    "targetAncestry": [
      "Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner`",
      "Chiều vào — verb + danh tính"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "accounting-040"
}
```

## Entry accounting-041

```json
{
  "kind": "refreshed-dependent-accounting",
  "historicalArtifact": "plans/260925-documentation-authority-unification/reports/phase-06/step10-sync19-predecessor-reconciliation.json",
  "historicalProjectionPath": "/receipts/3/after",
  "historicalSnapshot": {
    "claimId": "claim_251b389b227a62ef26b0fd3e1f0bebd9",
    "sourceUnitDigest": "9babb9141d90b2e3a99f353c735db9e64679ea4be0bc12cf27432d1cd728df8f",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
    "rationale": "L10-3 / A31: historical native instruction/navigation identity claim_251b389b227a62ef26b0fd3e1f0bebd9 records AGENTS.md#unheaded-block-14 at digest 9babb9141d90b2e3a99f353c735db9e64679ea4be0bc12cf27432d1cd728df8f. The numbered anchor identifies historical text, not a claim of current byte equality. Retain root instructions and repository navigation outside platform authority. Current changed unit is separately drafted at SYNC 59b9b7087; native sync must determine retained identity or predecessor gap, preserving all history. No platform copy, source-to-self carry proof, truth approval or retirement. Native sync at 19ca8de23908e161c34c91626e41041b7813167c confirms a predecessor gap; retain historical root/navigation identity outside platform scope. Current successor is separately native-resolved. No live old-anchor claim.",
    "reviewNote": "deep: historical AGENTS.md#unheaded-block-14 at witness 2300d6557 (L85-91, digest 9babb914 recomputed equal): retain outside platform authority with no live old-anchor claim is accurate, AGENTS.md at HEAD is byte-identical to SYNC 59b9b7087 (current unit L85-94 is the separate claim_c328f1aa) and the rationale correctly says the numbered anchor names historical text",
    "sourcePath": "AGENTS.md",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-19ca8de23.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "4a18f35ff5d6a9b7a07e955bd64418282c6a91b2"
  },
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s10-closing-instructions.json",
  "collection": "registryGaps",
  "relatedClaimId": "claim_251b389b227a62ef26b0fd3e1f0bebd9",
  "after": {
    "claimId": "claim_251b389b227a62ef26b0fd3e1f0bebd9",
    "sourceUnitDigest": "9babb9141d90b2e3a99f353c735db9e64679ea4be0bc12cf27432d1cd728df8f",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
    "rationale": "L10-3 / A31: historical native instruction/navigation identity claim_251b389b227a62ef26b0fd3e1f0bebd9 records AGENTS.md#unheaded-block-14 at digest 9babb9141d90b2e3a99f353c735db9e64679ea4be0bc12cf27432d1cd728df8f. The numbered anchor identifies historical text, not a claim of current byte equality. Retain root instructions and repository navigation outside platform authority. Current changed unit is separately drafted at SYNC 59b9b7087; native sync must determine retained identity or predecessor gap, preserving all history. No platform copy, source-to-self carry proof, truth approval or retirement. Native sync at 19ca8de23908e161c34c91626e41041b7813167c confirms a predecessor gap; retain historical root/navigation identity outside platform scope. Current successor is separately native-resolved. No live old-anchor claim.",
    "reviewNote": "deep: historical AGENTS.md#unheaded-block-14 at witness 2300d6557 (L85-91, digest 9babb914 recomputed by extractor and by hand), no target: AGENTS.md at HEAD is byte-identical to the sync pin 59b9b7087 and to 19ca8de23 (git diff empty, sha256 47f3a4e5), so the rationale's statement that the numbered anchor names historical text with no live old-anchor claim holds; applied approval checked: the shard row equals the pack, the reviewNote equals the Note in my committed 19ca8de23 report byte for byte, reviewedBy/reviewedAt/reviewReport (review-step10-decisions-05-19ca8de23.md at 4a18f35ff) match, and every non-review field equals the row at the request commit of that round (62d147641)",
    "sourcePath": "AGENTS.md",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-03-345f15d95.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "currentTarget": null,
  "currentNativeSuccessor": null,
  "sourceAndResidualHistoryPreserved": true,
  "reviewScope": "Current projection supersedes the historical artifact for this package only; historical before/native witness remains immutable. Pending rows receive no approval.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "currentDecision": {
    "claimId": "claim_251b389b227a62ef26b0fd3e1f0bebd9",
    "sourceUnitDigest": "9babb9141d90b2e3a99f353c735db9e64679ea4be0bc12cf27432d1cd728df8f",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
    "rationale": "L10-3 / A31: historical native instruction/navigation identity claim_251b389b227a62ef26b0fd3e1f0bebd9 records AGENTS.md#unheaded-block-14 at digest 9babb9141d90b2e3a99f353c735db9e64679ea4be0bc12cf27432d1cd728df8f. The numbered anchor identifies historical text, not a claim of current byte equality. Retain root instructions and repository navigation outside platform authority. Current changed unit is separately drafted at SYNC 59b9b7087; native sync must determine retained identity or predecessor gap, preserving all history. No platform copy, source-to-self carry proof, truth approval or retirement. Native sync at 19ca8de23908e161c34c91626e41041b7813167c confirms a predecessor gap; retain historical root/navigation identity outside platform scope. Current successor is separately native-resolved. No live old-anchor claim.",
    "reviewNote": "deep: historical AGENTS.md#unheaded-block-14 at witness 2300d6557 (L85-91, digest 9babb914 recomputed by extractor and by hand), no target: AGENTS.md at HEAD is byte-identical to the sync pin 59b9b7087 and to 19ca8de23 (git diff empty, sha256 47f3a4e5), so the rationale's statement that the numbered anchor names historical text with no live old-anchor claim holds; applied approval checked: the shard row equals the pack, the reviewNote equals the Note in my committed 19ca8de23 report byte for byte, reviewedBy/reviewedAt/reviewReport (review-step10-decisions-05-19ca8de23.md at 4a18f35ff) match, and every non-review field equals the row at the request commit of that round (62d147641)",
    "sourcePath": "AGENTS.md",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-03-345f15d95.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "accounting-041"
}
```

## Entry accounting-042

```json
{
  "kind": "refreshed-dependent-accounting",
  "historicalArtifact": "plans/260925-documentation-authority-unification/reports/phase-06/step10-sync19-predecessor-reconciliation.json",
  "historicalProjectionPath": "/receipts/5/after",
  "historicalSnapshot": {
    "claimId": "claim_26f62a1ae1abc17d0f02706788bfd399",
    "sourcePath": "docs/specs/distribution.md",
    "sourceUnitDigest": "034305c494ee289535b1b4121c8b90ed9d2eb5b850364e1c2a63e936221d40e3",
    "claimKind": "specification",
    "disposition": "partial-carry",
    "targetOwner": "docs/specs/distribution.md",
    "targetAnchor": "unheaded-block-5",
    "rationale": "A22/A31/A34: one native sync at 19ca8de23908e161c34c91626e41041b7813167c preserves this historical predecessor as a gap; current upstream source successor is separately native-accounted and carried to the candidate. Historical lines changed; exact untransferred residual is retained verbatim with SHA256, independent representation review required; cutover remains blocked. Full source/current witnesses and residual: step10-sync19-predecessor-residuals.json. No identity graft or approval carry.",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
    "reviewNote": "deep: historical unit docs/specs/distribution.md#unheaded-block-5 at witness 2300d6557 (L57-73, digest 034305c4 recomputed equal) against the current successor L57-73 (digest 59297ed6 recomputed equal): the line comparison leaves exactly one residual line (table row 7 Doctor check), its text and SHA256 4894dcf4 match the residual file, the successor is carried to the candidate by claim_d9185072 (byte-identical), so partial-carry is accurate",
    "remainder": "Verbatim historical residual in plans/260925-documentation-authority-unification/reports/phase-06/step10-sync19-predecessor-residuals.json, claim claim_26f62a1ae1abc17d0f02706788bfd399, residual SHA256 4894dcf4de3a1254ebc5e89c78ffed0afafc58859c82fa2b2781ac8216b08424. Source 034305c494ee289535b1b4121c8b90ed9d2eb5b850364e1c2a63e936221d40e3; primary target 59297ed6cac29ae0d34e9f3a48ca0c518e8c06fed5e224ca0182f627ae93839e. Residual file SHA256 recorded in step10-sync19-predecessor-reconciliation.json. A34 independent acceptance pending; cutover blocked.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-19ca8de23.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "59297ed6cac29ae0d34e9f3a48ca0c518e8c06fed5e224ca0182f627ae93839e",
    "targetAncestry": [
      "Spec: Distribution",
      "Data Dictionary"
    ],
    "reviewReportCommit": "4a18f35ff5d6a9b7a07e955bd64418282c6a91b2"
  },
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s4-packaging-main-recarry.json",
  "collection": "registryGaps",
  "relatedClaimId": "claim_26f62a1ae1abc17d0f02706788bfd399",
  "after": {
    "claimId": "claim_26f62a1ae1abc17d0f02706788bfd399",
    "sourcePath": "docs/specs/distribution.md",
    "sourceUnitDigest": "034305c494ee289535b1b4121c8b90ed9d2eb5b850364e1c2a63e936221d40e3",
    "claimKind": "specification",
    "disposition": "partial-carry",
    "targetOwner": "docs/specs/distribution.md",
    "targetAnchor": "unheaded-block-5",
    "rationale": "A22/A31/A34: one native sync at 19ca8de23908e161c34c91626e41041b7813167c preserves this historical predecessor as a gap; current upstream source successor is separately native-accounted and carried to the candidate. Historical lines changed; exact untransferred residual is retained verbatim with SHA256, independent representation review required; cutover remains blocked. Full source/current witnesses and residual: step10-sync19-predecessor-residuals.json. No identity graft or approval carry.",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
    "reviewNote": "deep: historical docs/specs/distribution.md#unheaded-block-5 at witness 2300d6557 (L57-73, digest 034305c4 recomputed by extractor and by hand) against successor 59297ed6: the comparison leaves one residual line (the Doctor check row), whose text and SHA256 4894dcf4 equal the residual file, successor carried by claim_d9185072, so partial-carry is accurate; applied approval checked: the shard row equals the pack, the reviewNote equals the Note in my committed 19ca8de23 report byte for byte, reviewedBy/reviewedAt/reviewReport (review-step10-decisions-05-19ca8de23.md at 4a18f35ff) match, and every non-review field equals the row at the request commit of that round (62d147641)",
    "remainder": "Verbatim historical residual in plans/260925-documentation-authority-unification/reports/phase-06/step10-sync19-predecessor-residuals.json, claim claim_26f62a1ae1abc17d0f02706788bfd399, residual SHA256 4894dcf4de3a1254ebc5e89c78ffed0afafc58859c82fa2b2781ac8216b08424. Source 034305c494ee289535b1b4121c8b90ed9d2eb5b850364e1c2a63e936221d40e3; primary target 59297ed6cac29ae0d34e9f3a48ca0c518e8c06fed5e224ca0182f627ae93839e. Residual file SHA256 recorded in step10-sync19-predecessor-reconciliation.json. A34 independent acceptance pending; cutover blocked.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-03-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "59297ed6cac29ae0d34e9f3a48ca0c518e8c06fed5e224ca0182f627ae93839e",
    "targetAncestry": [
      "Spec: Distribution",
      "Data Dictionary"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-5",
    "githubAnchor": "unheaded-block-5",
    "stableAnchor": "unheaded-block-5",
    "title": "Unheaded block 5",
    "startLine": 57,
    "endLine": 73,
    "textDigest": "59297ed6cac29ae0d34e9f3a48ca0c518e8c06fed5e224ca0182f627ae93839e",
    "sample": "| # | Element | Meaning | Values | Required | Default |\n|---|-------|---------|--------|----------|---------|\n| 1 | Package name | The npm package identity used for the git-based i",
    "identityFingerprint": "efdbc472e987bef628352ebcce1a16bf80b33d017c6b99af37f0f9d20d2dd69f",
    "ancestry": [
      "Spec: Distribution",
      "Data Dictionary"
    ],
    "text": "| # | Element | Meaning | Values | Required | Default |\n|---|-------|---------|--------|----------|---------|\n| 1 | Package name | The npm package identity used for the git-based install command | `forgent` | yes | — |\n| 2 | Package version | A semantic version string tooling (e.g. packaging commands) needs to treat the package as valid | semver string | yes | `0.1.0` |\n| 3 | Distribution file allowlist | The exact set of paths shipped to anyone installing the package — everything else in the source repo is excluded | `bin`, `src`, `scripts`, `core`, `domains`, `.agents`, `README.md`, `LICENSE`, the end-user documentation subset (`docs/how-to`, `docs/explanation`, and `docs/enduser-docs-index.json`), plus `packages/convention/contracts/convention.rules.v1.json`, which installed doctor needs to interpret per-rule cutoffs without duplicating native rule data | yes | — |\n| 4 | CLI entry points | The commands exposed once installed | `fgos` → runs `bin/fgos.mjs`; `fgos-runner` → runs `bin/fgos-runner.mjs` (the autonomous-loop runner, see spec Runner) | yes | — |\n| 4b | Claude Code plugin skill set | `plugins/fgOS/skills/` — the Claude Code plugin's own skill bundle, distributed via the Claude Code plugin marketplace mechanism (a separate distribution channel from the npm-installed `fgos`/`fgos-runner` CLI above). Ships two layers: hand-authored CLI-wrapper skills (`cook`, `discover`, `pick`, `submit`, ...) and mirrored `fgos-*` dev-skills plus `_shared/` for plugin-only consumers. Dev-skills are authored in `core/skills/` or `domains/*/skills/`; run `npm run build:skills` in the fgOS source repo to assemble `.agents/skills/`, generate `.claude/skills/` thin wrappers and references, and mirror dev-skills/shared fragments into the plugin. Plugin mirrors stay byte-identical to `.agents/skills/`, while Claude `SKILL.md` files are thin redirects with byte-identical frontmatter (`test/skills/fgos-mirror.test.mjs`). Assembled Markdown carries a generated-from source header. Do not hand-edit `.agents`, generated `.claude` files, or plugin mirrors; hand-authored CLI-wrapper skills remain sources. `plugin-dev-skills-packaged` (doctor check, row 7 below) detects missing or stale plugin mirrors | mirrored dev-skills + shared fragments + hand-authored CLI-wrapper skills | yes (the mirrors let plugin-only consumers dispatch dev-skills without a source checkout) | — |\n| 5 | Dev checkout shell helper | An opt-in file, sourced from a contributor's own shell profile, exposing the same two CLI entry points from inside a checkout of the source repository — no install, no package fetch | one file, both commands | no (contributor's own choice) | not sourced automatically anywhere |\n| 5b | Global config file | `~/.fgos/config.json` — same schema as the project-local shared config file, initialized/kept current by `fgos setup` (tsk-1ri) the same way it already handles the project-local file; project always wins any key present in both (`mergeWithGlobalConfig`, `src/config/global-config.mjs`) | one file, home-dir-relative | no (optional; a missing file is not an error, resolves to `{}`) | not created by anything except `fgos setup` |\n| 5c | Machine backend registry file | `~/.fgos/confinement-backends.json` (overridable via `FGOS_CONFINEMENT_BACKEND_REGISTRY_PATH`) — machine-local backend registry declaring confinement backends (e.g. `bwrap`, container) available on the host (`confinement-backend-registry.v1`); managed by `fgos doctor --fix` (not project-over-global merge), trust store for security isolation drivers | one file, machine-local path | no (optional; bootstrap creates default bwrap backend on demand) | `~/.fgos/confinement-backends.json` |\n| 5d | Provider-capacity runtime state | `~/.fgos/runtime/provider-capacity/state.json` plus lock `state.lock` — machine-local selected-account lease/quarantine state for provider-capacity rotation. Intentionally host-global only (never project-overridden) so multiple projects sharing provider accounts coordinate concurrency and rate limits safely without starvation. It is never packaged, never committed, and never repaired by `doctor`; `fgos dispatch inspect --provider-capacity` and the `provider-capacity-state` doctor check report it, while manual clear goes through `fgos dispatch reconcile provider-capacity clear-quarantine ...`. An account locked for a dead login is also unlocked by one real call when a dispatch would otherwise find no usable account (the lazy-probe unlock rule, now in `docs/specs/runner.md`). The same directory holds `account-locks/<provider>/<account>/`: the per-account lock, copies of a login renewed elsewhere and waiting to be applied, a scratch home while a renewal runs, and the renewal failure cooldown; it is created only when a renewal or write-back runs and holds no credential outside those copies. | one runtime directory, home-dir-relative | no (created only when a provider account lease/quarantine/write occurs) | absent/inactive |\n| 5e | Confinement attestation store state | `~/.local/state/fgos/attestations/` (or `$XDG_STATE_HOME/fgos/attestations`, overridable via `FGOS_CONFINEMENT_ATTESTATION_STORE_PATH`) — host-global security attestation records. Intentionally host-global only (outside all agent write grants) so confined agents can never tamper with their own audit trails, preserving immutable attestation integrity across projects. | one directory, machine-local path | no (created on first confined dispatch attestation) | absent/inactive |\n| 5f | Workspace customization folder | `fgos/` at the project root: tracked in the project's own git, written once as a skeleton at onboarding and never edited by fgOS afterwards. Holds the customer's own agent definitions (`fgos/agents/<name>.yaml`), which win over a definition of the same name in the installed set (RUL13 (customer customization lives in one tracked workspace folder)). Read by `--seats @name` (runner decision 0057); the `fgctl init` skeleton is not built yet | directory | no | absent — the installed set alone applies |\n| 6 | Config staleness | Whether a config file (project-local or global — same computation, tsk-1ri) already has every setting the current default schema defines | up to date / missing one or more default settings | yes (computed, not stored) | — |\n| 7 | Doctor check | One named diagnostic `fgos doctor` reports on | not a fixed list — an extensible registry (`src/setup/registrations.mjs`'s `registerCheck`); a check registration and a config-default registration are independent, never a forced pairing — a module may register only a check, only a config-default, or both. Today's registered checks: `convention-conformance`, `node-version-and-git`, `cli-version-visible` (tsk-2ej), `shell-integration-sourced`, `project-fgos-launcher` (a release install has one fgos launcher on PATH that runs each project's own activated fgos, see RUL17 (one fgos on PATH runs each project's own activated fgos)), `config-not-stale`, `main-checkout-hook-wired`, `tool-registry-configured`, `work-classification-vocabulary`, `work-step-vocabulary` (tsk-64h), `domain-workflow-operations-coverage`, `root-drift`, `delivered-not-on-trunk` (tsk-1l9), `config-awareness`, `provider-capacity-state` (reports account lease/quarantine state and never auto-clears), `credential-copies-retained` (login copies still pending for a renewal after a day, and private homes held after repeated staging failures, counted by provider/account and age; read-only, a held home fails, copies waiting for a renewal only warn, and, when the machine-global provider inventory was read, copies of any age in a store directory the account's login store layout no longer reads fail, naming the directory for hand recovery (when the global config cannot be read or is refused by the validator the check fails, says the layout was not checked with the reason, lists copies at any age and promises nothing about a dispatch); interrupted stagings (pending/.tmp-*) are reported too once their writer is gone and they have sat for ten minutes, and the over-limit line names the store; kept homes under a registered backend's temp and private-home roots are scanned, which the orphan reaper check does not do, and one there counts as held at once because nothing retries it; the check itself never deletes and never prints a value), `provider-capacity-lock-stale` (Phase 06 C2c: the provider-capacity state.lock file, if any, is not held by a dead process; read-only, never reclaims), `dependencies-installed`, `gate-bypass-configured`, `claude-plugin-marketplace`, `plugin-skill-cli-reachable`, `plugin-dev-skills-packaged` (tsk-32b), `changelog-unreleased-stale`, `herdr-launcher-configured`, `herdr-web-dashboard-configured` (tsk-48w), `enduser-docs-index-stale` (tsk-1m0), `invariant-checks-configured` (tsk-516), `invocation-git-write-grants` (warns when an invocation or executor still grants a git add or git commit tool; the runner commits, workers only edit files; read-only, never rewrites user config), `worktree-setup-configured` (a present worktreeSetup section is a list of non-empty shell commands every runner-created worktree runs after its dependency install; never executes them), `events-jsonl-not-truncated` (tsk-cgg), `worker-slots-ceiling-usable` (tsk-1oz), `gateway-token-configured` (tsk-4r1), `readme-install-tag-exists` (tsk-2t8), `iron-law-configured` (tsk-1y6-1), `leaf-notify-drift` (tsk-1el), `task-specs-resolve` (tsk-2t9c), `agent-claims-resolve` (tsk-2t9c), `agent-type-names-unique` (tsk-397-12; names unique within each tier fgos/agents, domains/*/agents, core/agents, a higher tier replaces a lower one whole, the fgos/agents files checked for shape), `domain-registry-compiled` (every domain's compiled.json file under domains — the YAML-free form of the registry and workflow YAML the Work lifecycle reads, regenerated by the build:domains npm script; a drift test keeps it equal to the YAML), `dispatch-decide-hook-wired` (tsk-60f; also requires the AskUserQuestion decision-question hook), `codex-hook-wired`, `agy-hook-wired`, `omp-hook-wired`, `pi-hook-wired`, `decision-index-stale` (tsk-1lv-2/tsk-1lv), `advise-execute-capabilities-configured` (tsk-2uf-3), `workflow-capabilities-configured` (every capability a core/domain Workflow unit names resolves in runner.capabilities by exact name or bare verb, the way bind() looks it up, and fails when it does not; one that resolves but has no \"prefer\" pool on either name is reported as a warning because bind() refuses its unit headless; fgos setup registers every shipped Workflow's capabilities as description-only defaults, so a fresh project starts with that warning, and never overwrites a project's own entry), `capability-serves-valid` (I19: every runner.capabilities entry's serves attribute set is well-formed, no two entries declare the identical set, and the review slot is present), `agy-permissions-configured` (tsk-1xm), `agy-sub-homes-configured`, `bwrap-available`, `curl-available` (curl runs, because fgctl init downloads a release through it; a missing curl is a warning that only blocks the download paths, never a failure, see RUL15 (fgctl init downloads a checksum-verified release when no source is given)), `main-checkout-guard-warnings` (tsk-1vc-3), `events-compaction-verified` (tsk-3ve-6), `no-stuck-merge-abort` (tsk-40a), `doc-registry-enforce` (tsk-28x), `doc-registry-stale` (tsk-28x), `doc-alias-broken` (tsk-28x), `doc-active-duplicate` (tsk-28x), `doc-near-duplicate` (tsk-28x), `doc-provisional-aged` (tsk-28x), `doc-topic-oversized` (tsk-28x), `doc-role-underused` (tsk-28x), `doc-source-conservation` (tsk-28x), `doc-current-path-missing` (tsk-3uc), `doc-source-unreachable` (tsk-3uc), `coordination-protocol-fixtures-valid` (retired; confirms legacy definition fixtures retired), `operation-prompt-templates-valid` (Phase 03 I04: every discoverable operation prompt template validates against bounded variables and schema), `coordination-example-requests-valid` (Step 08 Phase 07 R3: published fgos coordination run example request files validate against the same schema boundary the CLI itself enforces, and resolve every referenced protocolRef), `herdr-available`, `trust-store-readable`, `non-claude-trust-stores-readable` (Phase 07 herdr-trust-supervisor R3: every executor or invocation declaring a codex-toml or agy/agy-json trustStore reads from a store that is actually readable, using the same reader the live dispatch will use), `confined-pane-accounts` (every confined herdr invocation that binds a private home has an account in the machine-global provider account inventory whose credential files exist, so its pane starts logged in; see RUL65b in the runner spec), `agent-cli-project-trusted` (the project root is trusted in every codex home and agy sub-HOME the configured executors run under, so a headless dispatch does not stop at a \"Trust this folder?\" prompt until its timeout; reads only a yes/no for the one path, names the exact line a person must add, never edits the CLI's config; not applicable when the root is not a git repository or no codex/agy executor is configured), `workflow-pools-satisfy-independence` (for every panel or reviewed Workflow unit, drives the runner's own pattern code through bind() without dispatching anything and fails when the capability prefer pool cannot supply enough distinct provider families for every role (three panelists plus a synthesizer need four); a provider out of quota or blocked on a trust prompt is invisible to bind() and not counted), `blind-steps-use-proven-pools` (for every Workflow unit declared blind, walks each role's candidates through bind() without dispatching anything and fails when the capability prefer pool can bind an executor whose provider family, transport and confinement backend are not in the table of canary-proven pairs kept in the check's own module; read-only, no model call; not applicable when no unit is blind), `executor-posture-coverage` (core capabilities execute, code:implement, and capabilities declaring a pool have at least one candidate executor capable of applying required posture; dry simulation via bind(), no process spawn), `executor-confinement` (dispatch visibility V0 Phase 01 group D: the transport an interactive dispatch needs, a readable folder-trust store so a fresh worktree can be pre-trusted instead of stopping at a dialog, and a second reading of the rule that an executor may only declare bypass permission mode alongside full confinement), `herdr-executor-kinds` (Phase 05 R3: every executor dispatched through a herdr pane names an agent kind herdr can actually start, and none depends on an integration hook herdr reports as outdated -- an installed-but-stale hook is believed by herdr and may report the wrong agent state, while a missing one only degrades detection), `executor-profile-warnings` (Phase 06 executor-policy-dispatch-seams: legacy executor/capability entries hardcoding policy-shaped flags, policy-overrides-as-identity, or account-pool-shaped env, each named with its documented migration target -- informational only, never a hard failure), `active-release-matches-checkout` (read-only Node payload contents against doctor dir working tree, not HEAD or Rust binary freshness; reports changed/missing/extra source files while excluding staged dependencies, skips outside source checkouts and main-owned activation in linked worktrees; use fgos:dev for working-tree code or restage/activate for plain fgos), `rust-host-binary-present`, `rust-host-target-supported`, `legacy-node-payload-present`, `command-routes-drift`, `confinement-policies-declared`, `confinement-backend-registry-readable`, `confinement-bwrap-platform`, `confinement-probe-freshness`, `confinement-blind-read` (a blind unit can be enforced: the registered bwrap backend hides peer run state, homes and processes from a worker; reports pass, fail, or backend-unsupported, in which case every blind unit is refused), `confinement-strict-readiness`, `confinement-orphaned-resources-reaped` (Phase 04 M8: no confinement temp resource is left behind by a dead owning process, and no confinement temp root is readable beyond its owner; a home kept for a still-open pane is not orphaned; the fix tightens the root to 0700 and reaps), `confinement-herdr-maturity`, `instruction-projections-stale`, `coordination-abandoned-claims`, `runner-coordination-orgPolicy-shape`, `operation-capability-resolves` (Unit I21: every discoverable operation's declared policy.capability resolves against the live runner config, reporting reachable provider-family diversity), `shadow-binder-divergence` (dispatch-engine-liveness-hardening Phase 7 C1: real PlacementPolicy/ProviderAdapter shadow-binder divergence is durably recorded to a local JSONL under .fgos/dispatch/, not only an ephemeral stderr line; informational, never fails), `observe-dir-writable`, `observe-friction-migrated`, `observe-host-resolvable`, `writer-identity-resolvable` (the writer identity resolves through the Rust host for both the running host and the workspace activation a plain git commit hook uses; each binary is asked directly, so an older activated release shows as a version mismatch), `observe-run-coverage`, `runner-rigor-config` (validates project/global rigor-to-tier mappings and retired capability overrides), `coordination-protocol-dead-vocabulary` (validates definitions against dead vocabulary), `model-policy-tier-coverage` (validates model policies cover all tiers required by rigor-to-tier), `tier-vocabulary-dead-keys` (validates project and global config do not contain retired tier/rigor keys), `runner-patterns-config` (validates presence, valid checkers, and cumulative checkersByRigor for runner patterns), `runner-generated-paths` (validates runner.generatedPaths source-to-render-target mappings), `mutating-assignment-binding-snapshot` (validates that mutating assignment RunResult bindings match unit.json snapshot). The registry is open, but this list is not a snapshot — it names every registered check, and a module adding one updates this row in the same change | yes | — |\n| 7b | Doctor fix | One named repair `fgos doctor --fix` can run before re-reporting checks | not a fixed list — an extensible registry (`registerFix`), independent of `registerCheck`/`registerConfigDefault` (per tsk-2cs). Today's registered fixes: `credential-copies-retained` (re-checks private homes held after repeated staging failures, and any kept home under a registered backend's own root, which nothing else retries, under the account lock, and removes one only when its login is shown applied or obsolete; also removes an interrupted staging (pending/.tmp-*) only after claiming it by rename, when its writer is gone and it is empty, identical to a copy already kept, or shown no newer than the source login under the account lock; never removes on age), `gate-bypass-configured` (tsk-2qz, the registry's first entry to register all three capabilities at once), `claude-plugin-marketplace` (tsk-4xg), `enduser-docs-index-stale` (tsk-1m0), `bin-discovery-cache` (tsk-2qc-1), `gateway-token-configured` (tsk-4r1), `iron-law-configured` (tsk-1y6-1), `decision-index-stale` (tsk-1lv-2/tsk-1lv), `agy-permissions-configured` (tsk-1xm), `no-stuck-merge-abort` (tsk-40a), `doc-registry-stale` (tsk-28x), `confinement-backend-registry-readable`, `confinement-orphaned-resources-reaped` (Phase 04 M8), `instruction-projections-stale`, `coordination-abandoned-claims`, `runner-coordination-orgPolicy-shape`, `project-fgos-launcher`, `dispatch-decide-hook-wired`, `codex-hook-wired`, `agy-hook-wired`, `omp-hook-wired`, `pi-hook-wired`. Same rule as #7: the registry is open, but this list names every registered fix and a module adding one updates this row in the same change | yes | — |\n| 8 | Output rendering mode | How `fgos setup`/`fgos doctor` present their result | enveloped JSON (every other verb's shape, unchanged) / colored plain text (`--pretty`) | yes | enveloped JSON |"
  },
  "currentNativeSuccessor": {
    "sourcePath": "docs/specs/distribution.md",
    "unitDigest": "efdbc472e987bef628352ebcce1a16bf80b33d017c6b99af37f0f9d20d2dd69f",
    "identityFingerprint": "efdbc472e987bef628352ebcce1a16bf80b33d017c6b99af37f0f9d20d2dd69f",
    "claimId": "claim_d9185072d68925b4c020b13ba6c4d74f",
    "sourceAnchor": "unheaded-block-5",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "59297ed6cac29ae0d34e9f3a48ca0c518e8c06fed5e224ca0182f627ae93839e",
    "claimKind": "specification",
    "status": "current"
  },
  "sourceAndResidualHistoryPreserved": true,
  "reviewScope": "Current projection supersedes the historical artifact for this package only; historical before/native witness remains immutable. Pending rows receive no approval.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "currentDecision": {
    "claimId": "claim_26f62a1ae1abc17d0f02706788bfd399",
    "sourcePath": "docs/specs/distribution.md",
    "sourceUnitDigest": "034305c494ee289535b1b4121c8b90ed9d2eb5b850364e1c2a63e936221d40e3",
    "claimKind": "specification",
    "disposition": "partial-carry",
    "targetOwner": "docs/specs/distribution.md",
    "targetAnchor": "unheaded-block-5",
    "rationale": "A22/A31/A34: one native sync at 19ca8de23908e161c34c91626e41041b7813167c preserves this historical predecessor as a gap; current upstream source successor is separately native-accounted and carried to the candidate. Historical lines changed; exact untransferred residual is retained verbatim with SHA256, independent representation review required; cutover remains blocked. Full source/current witnesses and residual: step10-sync19-predecessor-residuals.json. No identity graft or approval carry.",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
    "reviewNote": "deep: historical docs/specs/distribution.md#unheaded-block-5 at witness 2300d6557 (L57-73, digest 034305c4 recomputed by extractor and by hand) against successor 59297ed6: the comparison leaves one residual line (the Doctor check row), whose text and SHA256 4894dcf4 equal the residual file, successor carried by claim_d9185072, so partial-carry is accurate; applied approval checked: the shard row equals the pack, the reviewNote equals the Note in my committed 19ca8de23 report byte for byte, reviewedBy/reviewedAt/reviewReport (review-step10-decisions-05-19ca8de23.md at 4a18f35ff) match, and every non-review field equals the row at the request commit of that round (62d147641)",
    "remainder": "Verbatim historical residual in plans/260925-documentation-authority-unification/reports/phase-06/step10-sync19-predecessor-residuals.json, claim claim_26f62a1ae1abc17d0f02706788bfd399, residual SHA256 4894dcf4de3a1254ebc5e89c78ffed0afafc58859c82fa2b2781ac8216b08424. Source 034305c494ee289535b1b4121c8b90ed9d2eb5b850364e1c2a63e936221d40e3; primary target 59297ed6cac29ae0d34e9f3a48ca0c518e8c06fed5e224ca0182f627ae93839e. Residual file SHA256 recorded in step10-sync19-predecessor-reconciliation.json. A34 independent acceptance pending; cutover blocked.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-03-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "59297ed6cac29ae0d34e9f3a48ca0c518e8c06fed5e224ca0182f627ae93839e",
    "targetAncestry": [
      "Spec: Distribution",
      "Data Dictionary"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "accounting-042"
}
```

## Entry accounting-043

```json
{
  "kind": "refreshed-dependent-accounting",
  "historicalArtifact": "plans/260925-documentation-authority-unification/reports/phase-06/step10-sync19-predecessor-reconciliation.json",
  "historicalProjectionPath": "/receipts/6/after",
  "historicalSnapshot": {
    "claimId": "claim_d956ba3fb9a8cce9589194e5f59d021f",
    "sourceUnitDigest": "3cb37dbc28864019579211dcadd7e189fb667783946e770ad45a9a81c2ca5b30",
    "claimKind": "navigation",
    "disposition": "reclassify-out-of-platform-scope",
    "authoredBy": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
    "rationale": "L10-3 / A31: historical native instruction/navigation identity claim_d956ba3fb9a8cce9589194e5f59d021f records docs/specs/reading-map.md#unheaded-block-2 at digest 3cb37dbc28864019579211dcadd7e189fb667783946e770ad45a9a81c2ca5b30. The numbered anchor identifies historical text, not a claim of current byte equality. Retain root instructions and repository navigation outside platform authority. Current changed unit is separately drafted at SYNC 59b9b7087; native sync must determine retained identity or predecessor gap, preserving all history. No platform copy, source-to-self carry proof, truth approval or retirement. Final b01 clarification: the current merged section 5 carries 53 original entries, with seven entries explicitly labelled truth corrections and evidence, plus one verbatim Session Identity entry from main. It does not assert that all 53 are still verbatim or defer those seven known truth fixes to promotion; wrapper count is 36 in 55 directories (_shared has no SKILL.md). Historical source binding and current navigation are separately pending independent review. Native sync at 19ca8de23908e161c34c91626e41041b7813167c confirms a predecessor gap; retain historical root/navigation identity outside platform scope. Current successor is separately native-resolved. No live old-anchor claim.",
    "reviewStatus": "reviewed",
    "reviewNote": "deep: historical docs/specs/reading-map.md#unheaded-block-2 at witness 2300d6557 (L11-63, digest 3cb37dbc recomputed equal): the rationale now says the merged section 5 carries 53 entries with seven labelled truth corrections plus one Session Identity entry and a 36-wrapper count; checked: seven Truth correction labels in docs/reading-map.md, entries 24, 25, 42, 44, 48, 51, 52 differ from docs/specs/reading-map.md, the other 47 entries are byte-equal (Session Identity entry included), plugins/fgOS/skills has 55 directories, 54 SKILL.md, 18 fgos- prefixed, 36 wrappers, _shared has no SKILL.md; previous rework answered",
    "sourcePath": "docs/specs/reading-map.md",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-19ca8de23.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "4a18f35ff5d6a9b7a07e955bd64418282c6a91b2"
  },
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s5-root-boundary-sync.json",
  "collection": "registryGaps",
  "relatedClaimId": "claim_d956ba3fb9a8cce9589194e5f59d021f",
  "after": {
    "claimId": "claim_d956ba3fb9a8cce9589194e5f59d021f",
    "sourceUnitDigest": "3cb37dbc28864019579211dcadd7e189fb667783946e770ad45a9a81c2ca5b30",
    "claimKind": "navigation",
    "disposition": "reclassify-out-of-platform-scope",
    "authoredBy": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
    "rationale": "L10-3 / A31: historical native instruction/navigation identity claim_d956ba3fb9a8cce9589194e5f59d021f records docs/specs/reading-map.md#unheaded-block-2 at digest 3cb37dbc28864019579211dcadd7e189fb667783946e770ad45a9a81c2ca5b30. The numbered anchor identifies historical text, not a claim of current byte equality. Retain root instructions and repository navigation outside platform authority. Current changed unit is separately drafted at SYNC 59b9b7087; native sync must determine retained identity or predecessor gap, preserving all history. No platform copy, source-to-self carry proof, truth approval or retirement. Final b01 clarification: the current merged section 5 carries 53 original entries, with seven entries explicitly labelled truth corrections and evidence, plus one verbatim Session Identity entry from main. It does not assert that all 53 are still verbatim or defer those seven known truth fixes to promotion; wrapper count is 36 in 55 directories (_shared has no SKILL.md). Historical source binding and current navigation are separately pending independent review. Native sync at 19ca8de23908e161c34c91626e41041b7813167c confirms a predecessor gap; retain historical root/navigation identity outside platform scope. Current successor is separately native-resolved. No live old-anchor claim.",
    "reviewStatus": "reviewed",
    "reviewNote": "deep: historical docs/specs/reading-map.md#unheaded-block-2 at witness 2300d6557 (L11-63, digest 3cb37dbc recomputed by extractor and by hand), no target: the rationale's statements about the merged section (seven labelled truth corrections, one Session Identity entry, 36 wrappers in 55 directories without SKILL.md in _shared) were rechecked at HEAD (seven 'Truth correction' labels and the 36-in-55 wording in docs/reading-map.md; plugins/fgOS/skills has 55 directories and 54 SKILL.md) and docs/reading-map.md, docs/specs/reading-map.md and AGENTS.md are identical to 19ca8de23; applied approval checked: the shard row equals the pack, the reviewNote equals the Note in my committed 19ca8de23 report byte for byte, reviewedBy/reviewedAt/reviewReport (review-step10-decisions-05-19ca8de23.md at 4a18f35ff) match, and every non-review field equals the row at the request commit of that round (62d147641)",
    "sourcePath": "docs/specs/reading-map.md",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-03-345f15d95.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "currentTarget": null,
  "currentNativeSuccessor": null,
  "sourceAndResidualHistoryPreserved": true,
  "reviewScope": "Current projection supersedes the historical artifact for this package only; historical before/native witness remains immutable. Pending rows receive no approval.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "currentDecision": {
    "claimId": "claim_d956ba3fb9a8cce9589194e5f59d021f",
    "sourceUnitDigest": "3cb37dbc28864019579211dcadd7e189fb667783946e770ad45a9a81c2ca5b30",
    "claimKind": "navigation",
    "disposition": "reclassify-out-of-platform-scope",
    "authoredBy": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
    "rationale": "L10-3 / A31: historical native instruction/navigation identity claim_d956ba3fb9a8cce9589194e5f59d021f records docs/specs/reading-map.md#unheaded-block-2 at digest 3cb37dbc28864019579211dcadd7e189fb667783946e770ad45a9a81c2ca5b30. The numbered anchor identifies historical text, not a claim of current byte equality. Retain root instructions and repository navigation outside platform authority. Current changed unit is separately drafted at SYNC 59b9b7087; native sync must determine retained identity or predecessor gap, preserving all history. No platform copy, source-to-self carry proof, truth approval or retirement. Final b01 clarification: the current merged section 5 carries 53 original entries, with seven entries explicitly labelled truth corrections and evidence, plus one verbatim Session Identity entry from main. It does not assert that all 53 are still verbatim or defer those seven known truth fixes to promotion; wrapper count is 36 in 55 directories (_shared has no SKILL.md). Historical source binding and current navigation are separately pending independent review. Native sync at 19ca8de23908e161c34c91626e41041b7813167c confirms a predecessor gap; retain historical root/navigation identity outside platform scope. Current successor is separately native-resolved. No live old-anchor claim.",
    "reviewStatus": "reviewed",
    "reviewNote": "deep: historical docs/specs/reading-map.md#unheaded-block-2 at witness 2300d6557 (L11-63, digest 3cb37dbc recomputed by extractor and by hand), no target: the rationale's statements about the merged section (seven labelled truth corrections, one Session Identity entry, 36 wrappers in 55 directories without SKILL.md in _shared) were rechecked at HEAD (seven 'Truth correction' labels and the 36-in-55 wording in docs/reading-map.md; plugins/fgOS/skills has 55 directories and 54 SKILL.md) and docs/reading-map.md, docs/specs/reading-map.md and AGENTS.md are identical to 19ca8de23; applied approval checked: the shard row equals the pack, the reviewNote equals the Note in my committed 19ca8de23 report byte for byte, reviewedBy/reviewedAt/reviewReport (review-step10-decisions-05-19ca8de23.md at 4a18f35ff) match, and every non-review field equals the row at the request commit of that round (62d147641)",
    "sourcePath": "docs/specs/reading-map.md",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-03-345f15d95.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "accounting-043"
}
```

## Entry accounting-044

```json
{
  "kind": "refreshed-dependent-accounting",
  "historicalArtifact": "plans/260925-documentation-authority-unification/reports/phase-06/step10-sync19-predecessor-reconciliation.json",
  "historicalProjectionPath": "/receipts/7/after",
  "historicalSnapshot": {
    "claimId": "claim_b19630ef4dcf1330c9807fc226a90e7b",
    "sourcePath": "docs/architecture-manifest.json",
    "sourceUnitDigest": "92391ce631b0c3602a5e22947a73182a6fd37f148e4b052cb4749a55b7657a6d",
    "claimKind": "contract",
    "disposition": "supersede",
    "targetOwner": "docs/architecture-manifest.json",
    "targetAnchor": "file-block",
    "rationale": "A22/A31/A34: one native sync at 19ca8de23908e161c34c91626e41041b7813167c preserves this historical predecessor as a gap; current upstream source successor is separately native-accounted and carried to the candidate. All historical source lines occur verbatim in order in current successor; insertion-only containment. Full source/current witnesses and residual: step10-sync19-predecessor-residuals.json. No identity graft or approval carry.",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
    "reviewNote": "deep: historical file docs/architecture-manifest.json at witness 2300d6557 (digest 92391ce6 recomputed equal) against the current file (digest 2d55be82 recomputed equal): line comparison shows zero historical lines lost and one inserted line (src/util/host-bin-path.mjs kernel entry), matching the residual file (empty, SHA e3b0c442), so supersede with insertion-only containment is accurate; the current file is carried by claim_03ef50e8",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-19ca8de23.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "2d55be82331318dd370052c80940458ce88894b98b049d626e41ba1bc6653b6a",
    "targetAncestry": [],
    "reviewReportCommit": "4a18f35ff5d6a9b7a07e955bd64418282c6a91b2"
  },
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s5-root-main-recarry.json",
  "collection": "registryGaps",
  "relatedClaimId": "claim_b19630ef4dcf1330c9807fc226a90e7b",
  "after": {
    "claimId": "claim_b19630ef4dcf1330c9807fc226a90e7b",
    "sourcePath": "docs/architecture-manifest.json",
    "sourceUnitDigest": "92391ce631b0c3602a5e22947a73182a6fd37f148e4b052cb4749a55b7657a6d",
    "claimKind": "contract",
    "disposition": "supersede",
    "targetOwner": "docs/architecture-manifest.json",
    "targetAnchor": "file-block",
    "rationale": "A22/A31/A34: one native sync at 19ca8de23908e161c34c91626e41041b7813167c preserves this historical predecessor as a gap; current upstream source successor is separately native-accounted and carried to the candidate. All historical source lines occur verbatim in order in current successor; insertion-only containment. Full source/current witnesses and residual: step10-sync19-predecessor-residuals.json. No identity graft or approval carry.",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
    "reviewNote": "deep: historical docs/architecture-manifest.json at witness 2300d6557 (sha256 92391ce6 recomputed) against the current file 2d55be82: 268 historical lines all occur in order in the 269-line successor (one inserted line), the residual is empty (SHA256 e3b0c442 is the empty-string hash, matches the residual file), successor carried by claim_03ef50e8, so supersede with insertion-only containment is accurate; applied approval checked: the shard row equals the pack, the reviewNote equals the Note in my committed 19ca8de23 report byte for byte, reviewedBy/reviewedAt/reviewReport (review-step10-decisions-05-19ca8de23.md at 4a18f35ff) match, and every non-review field equals the row at the request commit of that round (62d147641)",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-03-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "2d55be82331318dd370052c80940458ce88894b98b049d626e41ba1bc6653b6a",
    "targetAncestry": [],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "currentTarget": {
    "unitKind": "file-block",
    "anchor": "file-block",
    "githubAnchor": "file-block",
    "stableAnchor": "file-block",
    "title": "architecture-manifest.json",
    "startLine": 1,
    "endLine": 269,
    "textDigest": "2d55be82331318dd370052c80940458ce88894b98b049d626e41ba1bc6653b6a",
    "identityFingerprint": "bee0f585dc079a9cf24fe84a2cfacaa3aa99e6818f4fbf4e69dbf76dd601e99c",
    "sample": "{\n  \"contract\": \"architecture-manifest.v1\",\n  \"map\": \"docs/architecture-map.md\",\n  \"layers\": [\n    \"entry\",\n    \"use-case\",\n    \"infra\",\n    \"domain\",\n    \"kernel\"\n  ],\n  \"rules\": ",
    "ancestry": [],
    "text": "{\n  \"contract\": \"architecture-manifest.v1\",\n  \"map\": \"docs/architecture-map.md\",\n  \"layers\": [\n    \"entry\",\n    \"use-case\",\n    \"infra\",\n    \"domain\",\n    \"kernel\"\n  ],\n  \"rules\": [\n    \"one-directional-layer\",\n    \"domain-siloing\"\n  ],\n  \"components\": [\n    \"packaging-distribution\"\n  ],\n  \"domains\": [\n    \"coding\",\n    \"marketing\"\n  ],\n  \"files\": {\n    \"bin/fgos.mjs\": \"entry\",\n    \"bin/fgos-runner.mjs\": \"entry\",\n    \"src/runner/loop.mjs\": \"use-case\",\n    \"src/runner/paths.mjs\": \"infra\",\n    \"src/runner/dispatch.mjs\": \"infra\",\n    \"src/runner/operation-capability.mjs\": \"domain\",\n    \"src/runner/rigor.mjs\": \"kernel\",\n    \"src/runner/fanout-batch.mjs\": \"use-case\",\n    \"src/runner/work-compat.mjs\": \"infra\",\n    \"src/runner/dispatch/adapters.mjs\": \"infra\",\n    \"src/runner/dispatch/config.mjs\": \"infra\",\n    \"src/runner/dispatch/confinement/policies.mjs\": \"infra\",\n    \"src/runner/dispatch/confinement/bypass-pairing.mjs\": \"infra\",\n    \"src/runner/dispatch/confinement/backend-registry.mjs\": \"infra\",\n    \"src/runner/dispatch/confinement/authority.mjs\": \"infra\",\n    \"src/runner/dispatch/confinement/request.mjs\": \"infra\",\n    \"src/runner/dispatch/confinement/resources.mjs\": \"infra\",\n    \"src/runner/dispatch/confinement/cleanup.mjs\": \"infra\",\n    \"src/runner/dispatch/confinement/attestation-store.mjs\": \"infra\",\n    \"src/runner/dispatch/confinement/drivers/bwrap.mjs\": \"infra\",\n    \"src/runner/dispatch/confinement/probes/harness.mjs\": \"infra\",\n    \"src/runner/dispatch/resolve.mjs\": \"infra\",\n    \"src/runner/dispatch/mechanism.mjs\": \"infra\",\n    \"src/runner/dispatch/plan.mjs\": \"infra\",\n    \"src/runner/dispatch/transport.mjs\": \"infra\",\n    \"src/runner/dispatch/prepare.mjs\": \"infra\",\n    \"src/runner/dispatch/result-ladder.mjs\": \"infra\",\n    \"src/runner/dispatch/assignment.mjs\": \"infra\",\n    \"src/runner/dispatch/assignment-layout.mjs\": \"infra\",\n    \"src/runner/dispatch/assignment-normalizer.mjs\": \"infra\",\n    \"src/runner/dispatch/execution-contract.mjs\": \"infra\",\n    \"src/runner/dispatch/effective-execution-contract.mjs\": \"infra\",\n    \"src/runner/dispatch/agent-result-claim-contract.mjs\": \"infra\",\n    \"src/runner/dispatch/evidence-attribution.mjs\": \"infra\",\n    \"src/runner/dispatch/write-scope.mjs\": \"kernel\",\n    \"src/runner/dispatch/run-timeout.mjs\": \"kernel\",\n    \"src/runner/dispatch/run-result.mjs\": \"infra\",\n    \"src/runner/dispatch/usage-parsers.mjs\": \"infra\",\n    \"src/runner/dispatch/runtime-inspection.mjs\": \"infra\",\n    \"src/runner/dispatch/reconciliation-planner.mjs\": \"infra\",\n    \"src/runner/dispatch/assignment-policy.mjs\": \"infra\",\n    \"src/runner/dispatch/operation-prompt-templates.mjs\": \"infra\",\n    \"src/runner/dispatch/provider-adapter.mjs\": \"infra\",\n    \"src/runner/dispatch/provider-capacity.mjs\": \"infra\",\n    \"src/runner/dispatch/provider-auth-failure.mjs\": \"infra\",\n    \"src/runner/dispatch/provider-credential-probe.mjs\": \"infra\",\n    \"src/runner/dispatch/provider-account-probe.mjs\": \"infra\",\n    \"src/runner/dispatch/provider-credential-renewal.mjs\": \"infra\",\n    \"src/runner/dispatch/assignment-runner.mjs\": \"infra\",\n    \"src/runner/dispatch/settlement.mjs\": \"infra\",\n    \"src/runner/dispatch/reconcile-cli-spawn.mjs\": \"infra\",\n    \"src/runner/dispatch/cli.mjs\": \"infra\",\n    \"src/runner/dispatch/detached-run-supervisor.mjs\": \"infra\",\n    \"src/runner/prompt-templates.mjs\": \"infra\",\n    \"src/runner/worker-log.mjs\": \"infra\",\n    \"src/runner/agent-roster.mjs\": \"infra\",\n    \"src/runner/agent-definitions.mjs\": \"infra\",\n    \"src/runner/agent-listing.mjs\": \"infra\",\n    \"src/runner/worktree.mjs\": \"infra\",\n    \"src/runner/promote-preflight.mjs\": \"infra\",\n    \"src/runner/promote-engine.mjs\": \"infra\",\n    \"src/runner/session.mjs\": \"infra\",\n    \"src/runner/gateway-control.mjs\": \"infra\",\n    \"src/runner/goal-check.mjs\": \"infra\",\n    \"src/runner/iron-law-gate.mjs\": \"infra\",\n    \"src/runner/frozen-judge.mjs\": \"domain\",\n    \"src/runner/merge.mjs\": \"infra\",\n    \"src/runner/main-checkout-lock.mjs\": \"infra\",\n    \"src/runner/main-checkout-activity.mjs\": \"infra\",\n    \"src/runner/main-checkout-reset-guard.mjs\": \"infra\",\n    \"src/runner/github-adapter.mjs\": \"infra\",\n    \"src/state/drift-status.mjs\": \"infra\",\n    \"src/state/postland-drift.mjs\": \"infra\",\n    \"src/state/store.mjs\": \"infra\",\n    \"src/state/gate-bypass.mjs\": \"infra\",\n    \"src/state/cursor.mjs\": \"use-case\",\n    \"src/state/porting-store.mjs\": \"infra\",\n    \"src/state/tool-registry.mjs\": \"domain\",\n    \"src/install/coexist.mjs\": \"infra\",\n    \"src/runner/recovery.mjs\": \"domain\",\n    \"src/runner/anti-loop.mjs\": \"domain\",\n    \"src/runner/attestation-guard.mjs\": \"domain\",\n    \"src/runner/claim-port.mjs\": \"infra\",\n    \"src/runner/claim-liveness.mjs\": \"infra\",\n    \"src/runner/lock-wait.mjs\": \"infra\",\n    \"src/runner/write-queue.mjs\": \"domain\",\n    \"src/runner/root-affinity.mjs\": \"domain\",\n    \"src/state/status-fsm.mjs\": \"domain\",\n    \"src/state/decision-question.mjs\": \"domain\",\n    \"src/state/handoff.mjs\": \"domain\",\n    \"src/state/porting.mjs\": \"domain\",\n    \"src/state/frontier.mjs\": \"domain\",\n    \"src/state/impact.mjs\": \"domain\",\n    \"src/state/priority-formula.mjs\": \"domain\",\n    \"src/state/replay.mjs\": \"domain\",\n    \"src/state/events-compaction.mjs\": \"domain\",\n    \"src/state/dep-graph.mjs\": \"domain\",\n    \"src/state/graph-harness.mjs\": \"domain\",\n    \"src/state/graph-metrics.mjs\": \"domain\",\n    \"src/state/awaiting-context.mjs\": \"domain\",\n    \"src/state/cleanup-harness.mjs\": \"domain\",\n    \"src/state/cleanup-pool.mjs\": \"domain\",\n    \"src/state/discover-pool.mjs\": \"domain\",\n    \"src/state/plan-pool.mjs\": \"domain\",\n    \"src/state/retro-pool.mjs\": \"domain\",\n    \"src/state/retrospective-doors.mjs\": \"domain\",\n    \"src/state/worker-slots.mjs\": \"domain\",\n    \"src/intake/discovery.mjs\": \"use-case\",\n    \"src/intake/plan.mjs\": \"use-case\",\n    \"src/intake/plan-verdict-from-plan-md.mjs\": \"use-case\",\n    \"src/intake/verify-pattern-check.mjs\": \"kernel\",\n    \"src/cli/command-registry.mjs\": \"kernel\",\n    \"src/cli/deprecation.mjs\": \"kernel\",\n    \"src/cli/version.mjs\": \"kernel\",\n    \"src/cli/invocation-fault-log.mjs\": \"infra\",\n    \"src/cli/approve-fault-log.mjs\": \"infra\",\n    \"src/report/enduser-index.mjs\": \"domain\",\n    \"src/report/enduser-index-generate.mjs\": \"infra\",\n    \"src/report/decision-index.mjs\": \"infra\",\n    \"src/report/capability-plan-lint.mjs\": \"infra\",\n    \"src/report/context-render.mjs\": \"domain\",\n    \"src/report/frontmatter.mjs\": \"domain\",\n    \"src/report/authoritative-match.mjs\": \"domain\",\n    \"src/evolve/iron-law.mjs\": \"domain\",\n    \"src/state/events.mjs\": \"kernel\",\n    \"src/state/events-jsonl-truncation-guard.mjs\": \"kernel\",\n    \"src/state/main-checkout-guard-warnings.mjs\": \"kernel\",\n    \"src/state/work.mjs\": \"kernel\",\n    \"src/state/envelope.mjs\": \"kernel\",\n    \"src/intake/risk-keywords.mjs\": \"kernel\",\n    \"src/verbs/merge/merge.mjs\": \"use-case\",\n    \"src/verbs/merge/iron-law-level.mjs\": \"use-case\",\n    \"src/verbs/merge/approve.mjs\": \"use-case\",\n    \"src/verbs/merge/review.mjs\": \"use-case\",\n    \"src/verbs/merge/sync-root.mjs\": \"use-case\",\n    \"src/verbs/merge/catchup.mjs\": \"use-case\",\n    \"src/verbs/merge/reject.mjs\": \"use-case\",\n    \"src/verbs/merge/promote-to-component.mjs\": \"use-case\",\n    \"src/verbs/state/edit.mjs\": \"use-case\",\n    \"src/verbs/state/move.mjs\": \"use-case\",\n    \"src/verbs/state/read.mjs\": \"use-case\",\n    \"src/verbs/dispatch/show-run.mjs\": \"use-case\",\n    \"src/verbs/dispatch/inspect.mjs\": \"use-case\",\n    \"src/verbs/dispatch/reconcile.mjs\": \"use-case\",\n    \"src/verbs/dispatch/watch.mjs\": \"use-case\",\n    \"src/verbs/dispatch/recover.mjs\": \"use-case\",\n    \"src/report/item-trace.mjs\": \"domain\",\n    \"src/util/format-bytes.mjs\": \"kernel\",\n    \"src/util/format-duration.mjs\": \"kernel\",\n    \"src/util/normalize-path.mjs\": \"kernel\",\n    \"src/util/git-paths.mjs\": \"kernel\",\n    \"src/util/release-binary-path.mjs\": \"kernel\",\n    \"src/util/release-targets.mjs\": \"kernel\",\n    \"src/util/session-identity.mjs\": \"kernel\",\n    \"src/util/host-bin-path.mjs\": \"kernel\",\n    \"src/util/unique-tmp-tag.mjs\": \"kernel\",\n    \"src/util/host-bin.mjs\": \"infra\",\n    \"src/convention/convention-client.mjs\": \"infra\",\n    \"src/observe/friction-client.mjs\": \"infra\",\n    \"src/intake/classify.mjs\": \"use-case\",\n    \"src/setup/ansi.mjs\": \"domain\",\n    \"src/setup/config-merge.mjs\": \"domain\",\n    \"src/setup/shell-rc.mjs\": \"infra\",\n    \"src/setup/project-launcher.mjs\": \"infra\",\n    \"src/setup/bin-discovery.mjs\": \"infra\",\n    \"src/setup/skill-wrappers.mjs\": \"infra\",\n    \"src/setup/instruction-registry.mjs\": \"infra\",\n    \"src/setup/git-hooks.mjs\": \"infra\",\n    \"src/setup/claude-code-hooks.mjs\": \"infra\",\n    \"src/setup/agent-hooks.mjs\": \"infra\",\n    \"src/setup/agy-permissions.mjs\": \"infra\",\n    \"src/setup/agent-cli-trust.mjs\": \"infra\",\n    \"src/setup/blind-steps-proven-pools.mjs\": \"use-case\",\n    \"src/setup/workflow-pool-independence.mjs\": \"use-case\",\n    \"src/setup/checks.mjs\": \"use-case\",\n    \"src/setup/executor-profile-warnings.mjs\": \"infra\",\n    \"src/config/global-config.mjs\": \"infra\",\n    \"src/setup/registrations.mjs\": \"use-case\",\n    \"src/setup/executor-posture-coverage.mjs\": \"use-case\",\n    \"src/config/shared-config-file.mjs\": \"domain\",\n    \"src/state/knowledge-registry.mjs\": \"domain\",\n    \"src/report/knowledge-resolver.mjs\": \"domain\",\n    \"src/report/knowledge-projection.mjs\": \"domain\",\n    \"src/state/fgos-file-registry.mjs\": \"kernel\",\n    \"src/state/runtime-coordination.mjs\": \"infra\",\n    \"src/runner/dispatch/brief.mjs\": \"infra\",\n    \"src/runner/dispatch/dispatch-error.mjs\": \"infra\",\n    \"src/runner/dispatch/proof-helpers.mjs\": \"infra\",\n    \"src/runner/dispatch/herdr-agent.mjs\": \"infra\",\n    \"src/runner/dispatch/herdr-diagnosis.mjs\": \"infra\",\n    \"src/runner/dispatch/herdr-round.mjs\": \"infra\",\n    \"src/runner/dispatch/herdr-reconcile.mjs\": \"infra\",\n    \"src/runner/dispatch/worker-artifacts.mjs\": \"infra\",\n    \"src/runner/dispatch/liveness.mjs\": \"infra\",\n    \"src/runner/dispatch/visibility-session.mjs\": \"infra\",\n    \"src/runner/dispatch/recovery-planner.mjs\": \"infra\",\n    \"src/runner/dispatch/run-lock.mjs\": \"infra\",\n    \"src/runner/dispatch/process-identity.mjs\": \"infra\",\n    \"src/runner/dispatch/trust-store.mjs\": \"infra\",\n    \"src/runner/dispatch/worker-home.mjs\": \"infra\",\n    \"src/runner/dispatch/stop-processes-inside.mjs\": \"infra\",\n    \"src/runner/dispatch/worker-session.mjs\": \"infra\",\n    \"src/runner/dispatch/worker-session-boot.mjs\": \"infra\",\n    \"src/runner/dispatch/recovery.mjs\": \"infra\",\n    \"src/setup/instruction-composition.mjs\": \"infra\",\n    \"src/setup/instruction-projections.mjs\": \"infra\",\n    \"src/runner/execution/unit.mjs\": \"infra\",\n    \"src/runner/execution/bind.mjs\": \"infra\",\n    \"src/runner/execution/account-pin.mjs\": \"infra\",\n    \"src/runner/execution/account-rotation.mjs\": \"infra\",\n    \"src/runner/execution/dry-bind.mjs\": \"infra\",\n    \"src/runner/execution/role-ledger.mjs\": \"infra\",\n    \"src/runner/execution/commit-unit-work.mjs\": \"infra\",\n    \"src/runner/execution/partial-writes.mjs\": \"infra\",\n    \"src/runner/execution/unit-sync.mjs\": \"infra\",\n    \"src/runner/execution/handoff-refs.mjs\": \"infra\",\n    \"src/runner/execution/unit-run-history.mjs\": \"infra\",\n    \"src/runner/execution/unit-summary.mjs\": \"infra\",\n    \"src/runner/execution/run.mjs\": \"use-case\",\n    \"src/runner/execution/patterns/index.mjs\": \"domain\",\n    \"src/runner/execution/patterns/panel.mjs\": \"domain\",\n    \"src/runner/execution/patterns/presets.mjs\": \"domain\",\n    \"src/runner/execution/patterns/reviewed.mjs\": \"domain\",\n    \"src/runner/execution/patterns/role-tasks.mjs\": \"domain\",\n    \"src/runner/execution/patterns/solo.mjs\": \"domain\",\n    \"src/workflow/definition.mjs\": \"kernel\",\n    \"src/workflow/dir-guard.mjs\": \"infra\",\n    \"src/workflow/loader.mjs\": \"infra\",\n    \"src/workflow/store.mjs\": \"infra\",\n    \"src/workflow/integrate.mjs\": \"infra\",\n    \"src/workflow/plan-source.mjs\": \"infra\",\n    \"src/workflow/units-source.mjs\": \"infra\",\n    \"src/workflow/runner.mjs\": \"use-case\",\n    \"src/workflow/index.mjs\": \"use-case\",\n    \"src/workflow/checked.mjs\": \"infra\",\n    \"src/workflow/ref-digests.mjs\": \"infra\",\n    \"src/workflow/seat-providers.mjs\": \"infra\",\n    \"src/workflow/seats.mjs\": \"infra\",\n    \"src/workflow/steps.mjs\": \"kernel\",\n    \"src/state/domain-registry.mjs\": \"kernel\",\n    \"src/state/step-fsm.mjs\": \"domain\",\n    \"src/verbs/state/step.mjs\": \"use-case\",\n    \"src/runner/operation-choice.mjs\": \"use-case\",\n    \"src/runner/work-dispatch.mjs\": \"use-case\"\n  }\n}"
  },
  "currentNativeSuccessor": {
    "sourcePath": "docs/architecture-manifest.json",
    "unitDigest": "bee0f585dc079a9cf24fe84a2cfacaa3aa99e6818f4fbf4e69dbf76dd601e99c",
    "identityFingerprint": "bee0f585dc079a9cf24fe84a2cfacaa3aa99e6818f4fbf4e69dbf76dd601e99c",
    "claimId": "claim_03ef50e87178220032a3eebe5c5d89d9",
    "sourceAnchor": "file-block",
    "unitKind": "file-block",
    "sourceUnitDigest": "2d55be82331318dd370052c80940458ce88894b98b049d626e41ba1bc6653b6a",
    "claimKind": "contract",
    "status": "future"
  },
  "sourceAndResidualHistoryPreserved": true,
  "reviewScope": "Current projection supersedes the historical artifact for this package only; historical before/native witness remains immutable. Pending rows receive no approval.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "currentDecision": {
    "claimId": "claim_b19630ef4dcf1330c9807fc226a90e7b",
    "sourcePath": "docs/architecture-manifest.json",
    "sourceUnitDigest": "92391ce631b0c3602a5e22947a73182a6fd37f148e4b052cb4749a55b7657a6d",
    "claimKind": "contract",
    "disposition": "supersede",
    "targetOwner": "docs/architecture-manifest.json",
    "targetAnchor": "file-block",
    "rationale": "A22/A31/A34: one native sync at 19ca8de23908e161c34c91626e41041b7813167c preserves this historical predecessor as a gap; current upstream source successor is separately native-accounted and carried to the candidate. All historical source lines occur verbatim in order in current successor; insertion-only containment. Full source/current witnesses and residual: step10-sync19-predecessor-residuals.json. No identity graft or approval carry.",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
    "reviewNote": "deep: historical docs/architecture-manifest.json at witness 2300d6557 (sha256 92391ce6 recomputed) against the current file 2d55be82: 268 historical lines all occur in order in the 269-line successor (one inserted line), the residual is empty (SHA256 e3b0c442 is the empty-string hash, matches the residual file), successor carried by claim_03ef50e8, so supersede with insertion-only containment is accurate; applied approval checked: the shard row equals the pack, the reviewNote equals the Note in my committed 19ca8de23 report byte for byte, reviewedBy/reviewedAt/reviewReport (review-step10-decisions-05-19ca8de23.md at 4a18f35ff) match, and every non-review field equals the row at the request commit of that round (62d147641)",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-03-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "2d55be82331318dd370052c80940458ce88894b98b049d626e41ba1bc6653b6a",
    "targetAncestry": [],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "accounting-044"
}
```

## Entry accounting-045

```json
{
  "kind": "refreshed-dependent-accounting",
  "historicalArtifact": "plans/260925-documentation-authority-unification/reports/phase-06/step10-sync19-predecessor-reconciliation.json",
  "historicalProjectionPath": "/receipts/10/after",
  "historicalSnapshot": {
    "claimId": "claim_2bdbea8cb68325ec8b5b8d1a62447f4d",
    "sourceUnitDigest": "9a08a47745ab1aaa1c00c35a181813b16ff2e9f12eb14332d3993c9009d36219",
    "claimKind": "navigation",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
    "rationale": "L10-3 / A31: historical native instruction/navigation identity claim_2bdbea8cb68325ec8b5b8d1a62447f4d records docs/reading-map.md#unheaded-block-16 at digest 9a08a47745ab1aaa1c00c35a181813b16ff2e9f12eb14332d3993c9009d36219. The numbered anchor identifies historical text, not a claim of current byte equality. Retain root instructions and repository navigation outside platform authority. Current changed unit is separately drafted at SYNC 59b9b7087; native sync must determine retained identity or predecessor gap, preserving all history. No platform copy, source-to-self carry proof, truth approval or retirement. Native sync at 19ca8de23908e161c34c91626e41041b7813167c confirms a predecessor gap; retain historical root/navigation identity outside platform scope. Current successor is separately native-resolved. No live old-anchor claim.",
    "reviewNote": "deep: historical docs/reading-map.md#unheaded-block-16 at witness 2300d6557 (L131-183, digest 9a08a477 recomputed equal): the previous rework (37 wrappers should be 36) is fixed in the retained file, a line comparison of the witness block against current section 5 shows exactly the L155 correction (37 to 36, _shared note and Truth correction label) and one inserted Session Identity entry; the gap rationale (historical identity, no live old-anchor claim, retain outside platform scope) is accurate",
    "sourcePath": "docs/reading-map.md",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-19ca8de23.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "4a18f35ff5d6a9b7a07e955bd64418282c6a91b2"
  },
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s5-root-retained-navigation-proposal.json",
  "collection": "registryGaps",
  "relatedClaimId": "claim_2bdbea8cb68325ec8b5b8d1a62447f4d",
  "after": {
    "claimId": "claim_2bdbea8cb68325ec8b5b8d1a62447f4d",
    "sourceUnitDigest": "9a08a47745ab1aaa1c00c35a181813b16ff2e9f12eb14332d3993c9009d36219",
    "claimKind": "navigation",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
    "rationale": "L10-3 / A31: historical native instruction/navigation identity claim_2bdbea8cb68325ec8b5b8d1a62447f4d records docs/reading-map.md#unheaded-block-16 at digest 9a08a47745ab1aaa1c00c35a181813b16ff2e9f12eb14332d3993c9009d36219. The numbered anchor identifies historical text, not a claim of current byte equality. Retain root instructions and repository navigation outside platform authority. Current changed unit is separately drafted at SYNC 59b9b7087; native sync must determine retained identity or predecessor gap, preserving all history. No platform copy, source-to-self carry proof, truth approval or retirement. Native sync at 19ca8de23908e161c34c91626e41041b7813167c confirms a predecessor gap; retain historical root/navigation identity outside platform scope. Current successor is separately native-resolved. No live old-anchor claim.",
    "reviewNote": "deep: historical docs/reading-map.md#unheaded-block-16 at witness 2300d6557 (L131-183, digest 9a08a477 recomputed by extractor and by hand), no target: docs/reading-map.md is identical to 19ca8de23 and carries the corrected '36 wrapper ... 55 thư mục skill' wording (line 155; 55 directories and 54 SKILL.md on disk); applied approval checked: the shard row equals the pack, the reviewNote equals the Note in my committed 19ca8de23 report byte for byte, reviewedBy/reviewedAt/reviewReport (review-step10-decisions-05-19ca8de23.md at 4a18f35ff) match, and every non-review field equals the row at the request commit of that round (62d147641)",
    "sourcePath": "docs/reading-map.md",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-03-345f15d95.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "currentTarget": null,
  "currentNativeSuccessor": null,
  "sourceAndResidualHistoryPreserved": true,
  "reviewScope": "Current projection supersedes the historical artifact for this package only; historical before/native witness remains immutable. Pending rows receive no approval.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "currentDecision": {
    "claimId": "claim_2bdbea8cb68325ec8b5b8d1a62447f4d",
    "sourceUnitDigest": "9a08a47745ab1aaa1c00c35a181813b16ff2e9f12eb14332d3993c9009d36219",
    "claimKind": "navigation",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
    "rationale": "L10-3 / A31: historical native instruction/navigation identity claim_2bdbea8cb68325ec8b5b8d1a62447f4d records docs/reading-map.md#unheaded-block-16 at digest 9a08a47745ab1aaa1c00c35a181813b16ff2e9f12eb14332d3993c9009d36219. The numbered anchor identifies historical text, not a claim of current byte equality. Retain root instructions and repository navigation outside platform authority. Current changed unit is separately drafted at SYNC 59b9b7087; native sync must determine retained identity or predecessor gap, preserving all history. No platform copy, source-to-self carry proof, truth approval or retirement. Native sync at 19ca8de23908e161c34c91626e41041b7813167c confirms a predecessor gap; retain historical root/navigation identity outside platform scope. Current successor is separately native-resolved. No live old-anchor claim.",
    "reviewNote": "deep: historical docs/reading-map.md#unheaded-block-16 at witness 2300d6557 (L131-183, digest 9a08a477 recomputed by extractor and by hand), no target: docs/reading-map.md is identical to 19ca8de23 and carries the corrected '36 wrapper ... 55 thư mục skill' wording (line 155; 55 directories and 54 SKILL.md on disk); applied approval checked: the shard row equals the pack, the reviewNote equals the Note in my committed 19ca8de23 report byte for byte, reviewedBy/reviewedAt/reviewReport (review-step10-decisions-05-19ca8de23.md at 4a18f35ff) match, and every non-review field equals the row at the request commit of that round (62d147641)",
    "sourcePath": "docs/reading-map.md",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-03-345f15d95.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "accounting-045"
}
```

## Entry accounting-046

```json
{
  "kind": "refreshed-dependent-accounting",
  "historicalArtifact": "plans/260925-documentation-authority-unification/reports/phase-06/step10-sync19-predecessor-reconciliation.json",
  "historicalProjectionPath": "/receipts/12/after",
  "historicalSnapshot": {
    "claimId": "claim_a7278e1567e5432cfb079506cf2f5050",
    "sourcePath": "docs/specs/observe.md",
    "sourceUnitDigest": "1840cc4b1da22587ed69755276cad9a882139c62a36179d8fba2269905414623",
    "claimKind": "specification",
    "disposition": "partial-carry",
    "targetOwner": "docs/specs/observe.md",
    "targetAnchor": "unheaded-block-3",
    "rationale": "A22/A31/A34: one native sync at 19ca8de23908e161c34c91626e41041b7813167c preserves this historical predecessor as a gap; current upstream source successor is separately native-accounted and carried to the candidate. Historical lines changed; exact untransferred residual is retained verbatim with SHA256, independent representation review required; cutover remains blocked. Full source/current witnesses and residual: step10-sync19-predecessor-residuals.json. No identity graft or approval carry.",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
    "reviewNote": "deep: historical unit docs/specs/observe.md#unheaded-block-3 at witness 2300d6557 (L13-17, digest 1840cc4b recomputed equal) against the current successor L13-17 (digest 36f5428d recomputed equal): exactly one historical line (the store lock bullet) is not in the successor, its text and SHA256 ca9a59c1 match the residual file, the successor is carried by claim_bf1888a0, so partial-carry is accurate",
    "remainder": "Verbatim historical residual in plans/260925-documentation-authority-unification/reports/phase-06/step10-sync19-predecessor-residuals.json, claim claim_a7278e1567e5432cfb079506cf2f5050, residual SHA256 ca9a59c18839e81d0f58c6602e5c373a161cbeb6a20721e23fbff39be36107af. Source 1840cc4b1da22587ed69755276cad9a882139c62a36179d8fba2269905414623; primary target 36f5428de433214eb4a9a17e3a2366471095b9bb658faa4f11d4bb108beea137. Residual file SHA256 recorded in step10-sync19-predecessor-reconciliation.json. A34 independent acceptance pending; cutover blocked.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-19ca8de23.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "36f5428de433214eb4a9a17e3a2366471095b9bb658faa4f11d4bb108beea137",
    "targetAncestry": [
      "Observe Component Specification",
      "1. Overview & Boundaries",
      "Owns"
    ],
    "reviewReportCommit": "4a18f35ff5d6a9b7a07e955bd64418282c6a91b2"
  },
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s8-observe-01.json",
  "collection": "registryGaps",
  "relatedClaimId": "claim_a7278e1567e5432cfb079506cf2f5050",
  "after": {
    "claimId": "claim_a7278e1567e5432cfb079506cf2f5050",
    "sourcePath": "docs/specs/observe.md",
    "sourceUnitDigest": "1840cc4b1da22587ed69755276cad9a882139c62a36179d8fba2269905414623",
    "claimKind": "specification",
    "disposition": "partial-carry",
    "targetOwner": "docs/specs/observe.md",
    "targetAnchor": "unheaded-block-3",
    "rationale": "A22/A31/A34: one native sync at 19ca8de23908e161c34c91626e41041b7813167c preserves this historical predecessor as a gap; current upstream source successor is separately native-accounted and carried to the candidate. Historical lines changed; exact untransferred residual is retained verbatim with SHA256, independent representation review required; cutover remains blocked. Full source/current witnesses and residual: step10-sync19-predecessor-residuals.json. No identity graft or approval carry.",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
    "reviewNote": "deep: historical docs/specs/observe.md#unheaded-block-3 at witness 2300d6557 (L13-17, digest 1840cc4b recomputed by extractor and by hand) against successor 36f5428d: one residual line (the friction command bullet without ping and migrate), text and SHA256 ca9a59c1 equal the residual file, successor carried by claim_bf1888a0, so partial-carry with a named remainder is accurate; applied approval checked: the shard row equals the pack, the reviewNote equals the Note in my committed 19ca8de23 report byte for byte, reviewedBy/reviewedAt/reviewReport (review-step10-decisions-05-19ca8de23.md at 4a18f35ff) match, and every non-review field equals the row at the request commit of that round (62d147641)",
    "remainder": "Verbatim historical residual in plans/260925-documentation-authority-unification/reports/phase-06/step10-sync19-predecessor-residuals.json, claim claim_a7278e1567e5432cfb079506cf2f5050, residual SHA256 ca9a59c18839e81d0f58c6602e5c373a161cbeb6a20721e23fbff39be36107af. Source 1840cc4b1da22587ed69755276cad9a882139c62a36179d8fba2269905414623; primary target 36f5428de433214eb4a9a17e3a2366471095b9bb658faa4f11d4bb108beea137. Residual file SHA256 recorded in step10-sync19-predecessor-reconciliation.json. A34 independent acceptance pending; cutover blocked.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-03-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "36f5428de433214eb4a9a17e3a2366471095b9bb658faa4f11d4bb108beea137",
    "targetAncestry": [
      "Observe Component Specification",
      "1. Overview & Boundaries",
      "Owns"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-3",
    "githubAnchor": "unheaded-block-3",
    "stableAnchor": "unheaded-block-3",
    "title": "Unheaded block 3",
    "startLine": 13,
    "endLine": 17,
    "textDigest": "36f5428de433214eb4a9a17e3a2366471095b9bb658faa4f11d4bb108beea137",
    "sample": "- Quản lý nhật ký và vòng đời case đo lường (`fgos metrics case`).\n- Thu thập và tính toán scorecard tầng nền (`fgos metrics harness`, `fgos metrics runs`, `fgos metrics coverage`,",
    "identityFingerprint": "d4ba57f63848f35113fc0984b0062b63b09b99132feba60325b6be4553f5d2aa",
    "ancestry": [
      "Observe Component Specification",
      "1. Overview & Boundaries",
      "Owns"
    ],
    "text": "- Quản lý nhật ký và vòng đời case đo lường (`fgos metrics case`).\n- Thu thập và tính toán scorecard tầng nền (`fgos metrics harness`, `fgos metrics runs`, `fgos metrics coverage`, `fgos metrics outcomes`, `fgos metrics entropy`, `fgos metrics snapshot`).\n- Quản lý kho lưu trữ friction độc lập, phi tập trung (`fgos friction record`, `fgos friction resolve`, `fgos friction list`, `fgos friction show`, `fgos friction rank`).\n- Quản lý store lock (`.fgos/observe/.lock`) và phân mảnh writer shard (`.fgos/observe/<store>/<writerId>.jsonl`). `writerId` lấy từ crate Session Identity ([spec](../platform/session-identity/spec.md)): chính session id khi `source` là `env`/`registry` (gồm `CLAUDE_CODE_SESSION_ID`, `CODEX_THREAD_ID`), `pid-<id>` khi `pid`/`unresolved` (gốc terminal hoặc session, không còn pid của chính process). `sessionId` của friction cũng lấy từ đó. Observe không tự đọc biến env identity.\n- Khai báo traits `ObservationSource` và `LegacyFrictionSource` cho các crate khác triển khai."
  },
  "currentNativeSuccessor": {
    "sourcePath": "docs/specs/observe.md",
    "unitDigest": "d4ba57f63848f35113fc0984b0062b63b09b99132feba60325b6be4553f5d2aa",
    "identityFingerprint": "d4ba57f63848f35113fc0984b0062b63b09b99132feba60325b6be4553f5d2aa",
    "claimId": "claim_bf1888a05f53ba3cd515eb792c5059b8",
    "sourceAnchor": "unheaded-block-3",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "36f5428de433214eb4a9a17e3a2366471095b9bb658faa4f11d4bb108beea137",
    "claimKind": "specification",
    "status": "current"
  },
  "sourceAndResidualHistoryPreserved": true,
  "reviewScope": "Current projection supersedes the historical artifact for this package only; historical before/native witness remains immutable. Pending rows receive no approval.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "currentDecision": {
    "claimId": "claim_a7278e1567e5432cfb079506cf2f5050",
    "sourcePath": "docs/specs/observe.md",
    "sourceUnitDigest": "1840cc4b1da22587ed69755276cad9a882139c62a36179d8fba2269905414623",
    "claimKind": "specification",
    "disposition": "partial-carry",
    "targetOwner": "docs/specs/observe.md",
    "targetAnchor": "unheaded-block-3",
    "rationale": "A22/A31/A34: one native sync at 19ca8de23908e161c34c91626e41041b7813167c preserves this historical predecessor as a gap; current upstream source successor is separately native-accounted and carried to the candidate. Historical lines changed; exact untransferred residual is retained verbatim with SHA256, independent representation review required; cutover remains blocked. Full source/current witnesses and residual: step10-sync19-predecessor-residuals.json. No identity graft or approval carry.",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
    "reviewNote": "deep: historical docs/specs/observe.md#unheaded-block-3 at witness 2300d6557 (L13-17, digest 1840cc4b recomputed by extractor and by hand) against successor 36f5428d: one residual line (the friction command bullet without ping and migrate), text and SHA256 ca9a59c1 equal the residual file, successor carried by claim_bf1888a0, so partial-carry with a named remainder is accurate; applied approval checked: the shard row equals the pack, the reviewNote equals the Note in my committed 19ca8de23 report byte for byte, reviewedBy/reviewedAt/reviewReport (review-step10-decisions-05-19ca8de23.md at 4a18f35ff) match, and every non-review field equals the row at the request commit of that round (62d147641)",
    "remainder": "Verbatim historical residual in plans/260925-documentation-authority-unification/reports/phase-06/step10-sync19-predecessor-residuals.json, claim claim_a7278e1567e5432cfb079506cf2f5050, residual SHA256 ca9a59c18839e81d0f58c6602e5c373a161cbeb6a20721e23fbff39be36107af. Source 1840cc4b1da22587ed69755276cad9a882139c62a36179d8fba2269905414623; primary target 36f5428de433214eb4a9a17e3a2366471095b9bb658faa4f11d4bb108beea137. Residual file SHA256 recorded in step10-sync19-predecessor-reconciliation.json. A34 independent acceptance pending; cutover blocked.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-03-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "36f5428de433214eb4a9a17e3a2366471095b9bb658faa4f11d4bb108beea137",
    "targetAncestry": [
      "Observe Component Specification",
      "1. Overview & Boundaries",
      "Owns"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "accounting-046"
}
```

## Entry accounting-062

```json
{
  "kind": "refreshed-dependent-accounting",
  "historicalArtifact": "plans/260925-documentation-authority-unification/reports/phase-06/step10-sync19-prior-findings.json",
  "historicalProjectionPath": "/rows/1/currentDecision",
  "historicalSnapshot": {
    "claimId": "claim_f5365b8e40fb58c75adc56a574263242",
    "sourcePath": "docs/io-contract.md",
    "sourceUnitDigest": "fa53d50b84fef3025e7b4e5e8e810a83f885e4aab37a760652c1bcb9e676a5a9",
    "claimKind": "contract",
    "disposition": "partial-carry",
    "targetOwner": "docs/io-contract.md",
    "targetAnchor": "unheaded-block-5",
    "rationale": "A22/A31/A34: one native sync at 19ca8de23908e161c34c91626e41041b7813167c preserves this historical predecessor as a gap; current upstream source successor is separately native-accounted and carried to the candidate. Historical lines changed; exact untransferred residual is retained verbatim with SHA256, independent representation review required; cutover remains blocked. Full source/current witnesses and residual: step10-sync19-predecessor-residuals.json. No identity graft or approval carry.",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
    "reviewNote": "deep: historical unit docs/io-contract.md#unheaded-block-5 at witness 2300d6557 (L24-31, digest recomputed equal) against the current successor L24-34 (digest d3828696 recomputed equal): the longest-common-subsequence of lines leaves exactly the 3 residual lines the residual file records (their text equals residualText and its SHA256 b276baca recomputes), the successor is carried to the candidate by claim_57f11d83, so partial-carry with a named verbatim remainder is accurate; A34 acceptance stays false until this review, and the residual file SHA binding belongs to closure",
    "remainder": "Verbatim historical residual in plans/260925-documentation-authority-unification/reports/phase-06/step10-sync19-predecessor-residuals.json, claim claim_f5365b8e40fb58c75adc56a574263242, residual SHA256 b276baca8168777f55bdba5a90f6ca6334a7e6e1e5d0c9ebef8df5b362313957. Source fa53d50b84fef3025e7b4e5e8e810a83f885e4aab37a760652c1bcb9e676a5a9; primary target d38286962b4133b3c55926e513b03625483e4bd0b6b885a6fd3dde23c00686b8. Residual file SHA256 recorded in step10-sync19-predecessor-reconciliation.json. A34 independent acceptance pending; cutover blocked.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-19ca8de23.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "d38286962b4133b3c55926e513b03625483e4bd0b6b885a6fd3dde23c00686b8",
    "targetAncestry": [
      "Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner`",
      "Chiều vào — verb + danh tính"
    ],
    "reviewReportCommit": "4a18f35ff5d6a9b7a07e955bd64418282c6a91b2"
  },
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-io-contract.json",
  "collection": "registryGaps",
  "relatedClaimId": "claim_f5365b8e40fb58c75adc56a574263242",
  "after": {
    "claimId": "claim_f5365b8e40fb58c75adc56a574263242",
    "sourcePath": "docs/io-contract.md",
    "sourceUnitDigest": "fa53d50b84fef3025e7b4e5e8e810a83f885e4aab37a760652c1bcb9e676a5a9",
    "claimKind": "contract",
    "disposition": "partial-carry",
    "targetOwner": "docs/io-contract.md",
    "targetAnchor": "unheaded-block-5",
    "rationale": "A22/A31/A34: one native sync at 19ca8de23908e161c34c91626e41041b7813167c preserves this historical predecessor as a gap; current upstream source successor is separately native-accounted and carried to the candidate. Historical lines changed; exact untransferred residual is retained verbatim with SHA256, independent representation review required; cutover remains blocked. Full source/current witnesses and residual: step10-sync19-predecessor-residuals.json. No identity graft or approval carry.",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
    "reviewNote": "deep: historical docs/io-contract.md#unheaded-block-5 at witness 2300d6557 (L24-31, digest fa53d50b recomputed by extractor and by hand) against its successor d3828696 (current L24-34, recomputed): a line-subsequence comparison leaves exactly 3 residual lines whose text equals step10-sync19-predecessor-residuals.json and whose SHA256 b276baca recomputes (the residual file is unchanged since 62d147641); the successor is carried by claim_57f11d83, so partial-carry with a named verbatim remainder stays accurate; applied approval checked: the shard row equals the pack, the reviewNote equals the Note in my committed 19ca8de23 report byte for byte, reviewedBy/reviewedAt/reviewReport (review-step10-decisions-05-19ca8de23.md at 4a18f35ff) match, and every non-review field equals the row at the request commit of that round (62d147641)",
    "remainder": "Verbatim historical residual in plans/260925-documentation-authority-unification/reports/phase-06/step10-sync19-predecessor-residuals.json, claim claim_f5365b8e40fb58c75adc56a574263242, residual SHA256 b276baca8168777f55bdba5a90f6ca6334a7e6e1e5d0c9ebef8df5b362313957. Source fa53d50b84fef3025e7b4e5e8e810a83f885e4aab37a760652c1bcb9e676a5a9; primary target d38286962b4133b3c55926e513b03625483e4bd0b6b885a6fd3dde23c00686b8. Residual file SHA256 recorded in step10-sync19-predecessor-reconciliation.json. A34 independent acceptance pending; cutover blocked.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-03-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "d38286962b4133b3c55926e513b03625483e4bd0b6b885a6fd3dde23c00686b8",
    "targetAncestry": [
      "Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner`",
      "Chiều vào — verb + danh tính"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-5",
    "githubAnchor": "unheaded-block-5",
    "stableAnchor": "unheaded-block-5",
    "title": "Unheaded block 5",
    "startLine": 24,
    "endLine": 34,
    "textDigest": "d38286962b4133b3c55926e513b03625483e4bd0b6b885a6fd3dde23c00686b8",
    "sample": "- `writer.id` — cá thể nào đang gọi (phân biệt hai phiên agent chạy song\n  song), luôn có mặt.\n- `writer.source` — độ tin của `id` đó, một trong bốn giá trị theo thứ tự ưu\n  tiên: ",
    "identityFingerprint": "bcd5fad94d4723e8decd7375d5df9a749a53154e519ca0b4392815883b490e04",
    "ancestry": [
      "Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner`",
      "Chiều vào — verb + danh tính"
    ],
    "text": "- `writer.id` — cá thể nào đang gọi (phân biệt hai phiên agent chạy song\n  song), luôn có mặt.\n- `writer.source` — độ tin của `id` đó, một trong bốn giá trị theo thứ tự ưu\n  tiên: `registry` (đối chiếu được với `.fgos/sessions.json`, tin nhất) ·\n  `env` (biến môi trường, ai cũng set được) · `pid` (tổ tiên cao nhất còn\n  terminal, không có thì session id của tiến trình gọi; best-effort) ·\n  `unresolved` (không nguồn nào xác nhận được — `id` vẫn là\n  pid của chính tiến trình gọi, KHÔNG rỗng, KHÔNG vắng khoá; chỉ nhãn\n  `source` nói giá trị chưa kiểm chứng được). Luật đầy đủ (thứ tự biến env,\n  giới hạn đã biết) chỉ nằm ở [spec Session Identity](platform/session-identity/spec.md);\n  nguồn duy nhất là crate Rust `fgos-session-identity`."
  },
  "currentNativeSuccessor": {
    "sourcePath": "docs/io-contract.md",
    "unitDigest": "bcd5fad94d4723e8decd7375d5df9a749a53154e519ca0b4392815883b490e04",
    "identityFingerprint": "bcd5fad94d4723e8decd7375d5df9a749a53154e519ca0b4392815883b490e04",
    "claimId": "claim_57f11d837272b3f9781b376ef1665c81",
    "sourceAnchor": "unheaded-block-5",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "d38286962b4133b3c55926e513b03625483e4bd0b6b885a6fd3dde23c00686b8",
    "claimKind": "contract",
    "status": "current"
  },
  "sourceAndResidualHistoryPreserved": true,
  "reviewScope": "Current projection supersedes the historical artifact for this package only; historical before/native witness remains immutable. Pending rows receive no approval.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "currentDecision": {
    "claimId": "claim_f5365b8e40fb58c75adc56a574263242",
    "sourcePath": "docs/io-contract.md",
    "sourceUnitDigest": "fa53d50b84fef3025e7b4e5e8e810a83f885e4aab37a760652c1bcb9e676a5a9",
    "claimKind": "contract",
    "disposition": "partial-carry",
    "targetOwner": "docs/io-contract.md",
    "targetAnchor": "unheaded-block-5",
    "rationale": "A22/A31/A34: one native sync at 19ca8de23908e161c34c91626e41041b7813167c preserves this historical predecessor as a gap; current upstream source successor is separately native-accounted and carried to the candidate. Historical lines changed; exact untransferred residual is retained verbatim with SHA256, independent representation review required; cutover remains blocked. Full source/current witnesses and residual: step10-sync19-predecessor-residuals.json. No identity graft or approval carry.",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
    "reviewNote": "deep: historical docs/io-contract.md#unheaded-block-5 at witness 2300d6557 (L24-31, digest fa53d50b recomputed by extractor and by hand) against its successor d3828696 (current L24-34, recomputed): a line-subsequence comparison leaves exactly 3 residual lines whose text equals step10-sync19-predecessor-residuals.json and whose SHA256 b276baca recomputes (the residual file is unchanged since 62d147641); the successor is carried by claim_57f11d83, so partial-carry with a named verbatim remainder stays accurate; applied approval checked: the shard row equals the pack, the reviewNote equals the Note in my committed 19ca8de23 report byte for byte, reviewedBy/reviewedAt/reviewReport (review-step10-decisions-05-19ca8de23.md at 4a18f35ff) match, and every non-review field equals the row at the request commit of that round (62d147641)",
    "remainder": "Verbatim historical residual in plans/260925-documentation-authority-unification/reports/phase-06/step10-sync19-predecessor-residuals.json, claim claim_f5365b8e40fb58c75adc56a574263242, residual SHA256 b276baca8168777f55bdba5a90f6ca6334a7e6e1e5d0c9ebef8df5b362313957. Source fa53d50b84fef3025e7b4e5e8e810a83f885e4aab37a760652c1bcb9e676a5a9; primary target d38286962b4133b3c55926e513b03625483e4bd0b6b885a6fd3dde23c00686b8. Residual file SHA256 recorded in step10-sync19-predecessor-reconciliation.json. A34 independent acceptance pending; cutover blocked.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-03-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "d38286962b4133b3c55926e513b03625483e4bd0b6b885a6fd3dde23c00686b8",
    "targetAncestry": [
      "Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner`",
      "Chiều vào — verb + danh tính"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "accounting-062"
}
```

## Entry accounting-064

```json
{
  "kind": "refreshed-dependent-accounting",
  "historicalArtifact": "plans/260925-documentation-authority-unification/reports/phase-06/step10-sync19-prior-findings.json",
  "historicalProjectionPath": "/rows/3/currentDecision",
  "historicalSnapshot": {
    "claimId": "claim_251b389b227a62ef26b0fd3e1f0bebd9",
    "sourceUnitDigest": "9babb9141d90b2e3a99f353c735db9e64679ea4be0bc12cf27432d1cd728df8f",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
    "rationale": "L10-3 / A31: historical native instruction/navigation identity claim_251b389b227a62ef26b0fd3e1f0bebd9 records AGENTS.md#unheaded-block-14 at digest 9babb9141d90b2e3a99f353c735db9e64679ea4be0bc12cf27432d1cd728df8f. The numbered anchor identifies historical text, not a claim of current byte equality. Retain root instructions and repository navigation outside platform authority. Current changed unit is separately drafted at SYNC 59b9b7087; native sync must determine retained identity or predecessor gap, preserving all history. No platform copy, source-to-self carry proof, truth approval or retirement. Native sync at 19ca8de23908e161c34c91626e41041b7813167c confirms a predecessor gap; retain historical root/navigation identity outside platform scope. Current successor is separately native-resolved. No live old-anchor claim.",
    "reviewNote": "deep: historical AGENTS.md#unheaded-block-14 at witness 2300d6557 (L85-91, digest 9babb914 recomputed equal): retain outside platform authority with no live old-anchor claim is accurate, AGENTS.md at HEAD is byte-identical to SYNC 59b9b7087 (current unit L85-94 is the separate claim_c328f1aa) and the rationale correctly says the numbered anchor names historical text",
    "sourcePath": "AGENTS.md",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-19ca8de23.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "4a18f35ff5d6a9b7a07e955bd64418282c6a91b2"
  },
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s10-closing-instructions.json",
  "collection": "registryGaps",
  "relatedClaimId": "claim_251b389b227a62ef26b0fd3e1f0bebd9",
  "after": {
    "claimId": "claim_251b389b227a62ef26b0fd3e1f0bebd9",
    "sourceUnitDigest": "9babb9141d90b2e3a99f353c735db9e64679ea4be0bc12cf27432d1cd728df8f",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
    "rationale": "L10-3 / A31: historical native instruction/navigation identity claim_251b389b227a62ef26b0fd3e1f0bebd9 records AGENTS.md#unheaded-block-14 at digest 9babb9141d90b2e3a99f353c735db9e64679ea4be0bc12cf27432d1cd728df8f. The numbered anchor identifies historical text, not a claim of current byte equality. Retain root instructions and repository navigation outside platform authority. Current changed unit is separately drafted at SYNC 59b9b7087; native sync must determine retained identity or predecessor gap, preserving all history. No platform copy, source-to-self carry proof, truth approval or retirement. Native sync at 19ca8de23908e161c34c91626e41041b7813167c confirms a predecessor gap; retain historical root/navigation identity outside platform scope. Current successor is separately native-resolved. No live old-anchor claim.",
    "reviewNote": "deep: historical AGENTS.md#unheaded-block-14 at witness 2300d6557 (L85-91, digest 9babb914 recomputed by extractor and by hand), no target: AGENTS.md at HEAD is byte-identical to the sync pin 59b9b7087 and to 19ca8de23 (git diff empty, sha256 47f3a4e5), so the rationale's statement that the numbered anchor names historical text with no live old-anchor claim holds; applied approval checked: the shard row equals the pack, the reviewNote equals the Note in my committed 19ca8de23 report byte for byte, reviewedBy/reviewedAt/reviewReport (review-step10-decisions-05-19ca8de23.md at 4a18f35ff) match, and every non-review field equals the row at the request commit of that round (62d147641)",
    "sourcePath": "AGENTS.md",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-03-345f15d95.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "currentTarget": null,
  "currentNativeSuccessor": null,
  "sourceAndResidualHistoryPreserved": true,
  "reviewScope": "Current projection supersedes the historical artifact for this package only; historical before/native witness remains immutable. Pending rows receive no approval.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "currentDecision": {
    "claimId": "claim_251b389b227a62ef26b0fd3e1f0bebd9",
    "sourceUnitDigest": "9babb9141d90b2e3a99f353c735db9e64679ea4be0bc12cf27432d1cd728df8f",
    "targetOwner": null,
    "targetAnchor": null,
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
    "rationale": "L10-3 / A31: historical native instruction/navigation identity claim_251b389b227a62ef26b0fd3e1f0bebd9 records AGENTS.md#unheaded-block-14 at digest 9babb9141d90b2e3a99f353c735db9e64679ea4be0bc12cf27432d1cd728df8f. The numbered anchor identifies historical text, not a claim of current byte equality. Retain root instructions and repository navigation outside platform authority. Current changed unit is separately drafted at SYNC 59b9b7087; native sync must determine retained identity or predecessor gap, preserving all history. No platform copy, source-to-self carry proof, truth approval or retirement. Native sync at 19ca8de23908e161c34c91626e41041b7813167c confirms a predecessor gap; retain historical root/navigation identity outside platform scope. Current successor is separately native-resolved. No live old-anchor claim.",
    "reviewNote": "deep: historical AGENTS.md#unheaded-block-14 at witness 2300d6557 (L85-91, digest 9babb914 recomputed by extractor and by hand), no target: AGENTS.md at HEAD is byte-identical to the sync pin 59b9b7087 and to 19ca8de23 (git diff empty, sha256 47f3a4e5), so the rationale's statement that the numbered anchor names historical text with no live old-anchor claim holds; applied approval checked: the shard row equals the pack, the reviewNote equals the Note in my committed 19ca8de23 report byte for byte, reviewedBy/reviewedAt/reviewReport (review-step10-decisions-05-19ca8de23.md at 4a18f35ff) match, and every non-review field equals the row at the request commit of that round (62d147641)",
    "sourcePath": "AGENTS.md",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-03-345f15d95.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "accounting-064"
}
```

## Entry accounting-066

```json
{
  "kind": "refreshed-dependent-accounting",
  "historicalArtifact": "plans/260925-documentation-authority-unification/reports/phase-06/step10-sync19-prior-findings.json",
  "historicalProjectionPath": "/rows/5/currentDecision",
  "historicalSnapshot": {
    "claimId": "claim_26f62a1ae1abc17d0f02706788bfd399",
    "sourcePath": "docs/specs/distribution.md",
    "sourceUnitDigest": "034305c494ee289535b1b4121c8b90ed9d2eb5b850364e1c2a63e936221d40e3",
    "claimKind": "specification",
    "disposition": "partial-carry",
    "targetOwner": "docs/specs/distribution.md",
    "targetAnchor": "unheaded-block-5",
    "rationale": "A22/A31/A34: one native sync at 19ca8de23908e161c34c91626e41041b7813167c preserves this historical predecessor as a gap; current upstream source successor is separately native-accounted and carried to the candidate. Historical lines changed; exact untransferred residual is retained verbatim with SHA256, independent representation review required; cutover remains blocked. Full source/current witnesses and residual: step10-sync19-predecessor-residuals.json. No identity graft or approval carry.",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
    "reviewNote": "deep: historical unit docs/specs/distribution.md#unheaded-block-5 at witness 2300d6557 (L57-73, digest 034305c4 recomputed equal) against the current successor L57-73 (digest 59297ed6 recomputed equal): the line comparison leaves exactly one residual line (table row 7 Doctor check), its text and SHA256 4894dcf4 match the residual file, the successor is carried to the candidate by claim_d9185072 (byte-identical), so partial-carry is accurate",
    "remainder": "Verbatim historical residual in plans/260925-documentation-authority-unification/reports/phase-06/step10-sync19-predecessor-residuals.json, claim claim_26f62a1ae1abc17d0f02706788bfd399, residual SHA256 4894dcf4de3a1254ebc5e89c78ffed0afafc58859c82fa2b2781ac8216b08424. Source 034305c494ee289535b1b4121c8b90ed9d2eb5b850364e1c2a63e936221d40e3; primary target 59297ed6cac29ae0d34e9f3a48ca0c518e8c06fed5e224ca0182f627ae93839e. Residual file SHA256 recorded in step10-sync19-predecessor-reconciliation.json. A34 independent acceptance pending; cutover blocked.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-19ca8de23.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "59297ed6cac29ae0d34e9f3a48ca0c518e8c06fed5e224ca0182f627ae93839e",
    "targetAncestry": [
      "Spec: Distribution",
      "Data Dictionary"
    ],
    "reviewReportCommit": "4a18f35ff5d6a9b7a07e955bd64418282c6a91b2"
  },
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s4-packaging-main-recarry.json",
  "collection": "registryGaps",
  "relatedClaimId": "claim_26f62a1ae1abc17d0f02706788bfd399",
  "after": {
    "claimId": "claim_26f62a1ae1abc17d0f02706788bfd399",
    "sourcePath": "docs/specs/distribution.md",
    "sourceUnitDigest": "034305c494ee289535b1b4121c8b90ed9d2eb5b850364e1c2a63e936221d40e3",
    "claimKind": "specification",
    "disposition": "partial-carry",
    "targetOwner": "docs/specs/distribution.md",
    "targetAnchor": "unheaded-block-5",
    "rationale": "A22/A31/A34: one native sync at 19ca8de23908e161c34c91626e41041b7813167c preserves this historical predecessor as a gap; current upstream source successor is separately native-accounted and carried to the candidate. Historical lines changed; exact untransferred residual is retained verbatim with SHA256, independent representation review required; cutover remains blocked. Full source/current witnesses and residual: step10-sync19-predecessor-residuals.json. No identity graft or approval carry.",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
    "reviewNote": "deep: historical docs/specs/distribution.md#unheaded-block-5 at witness 2300d6557 (L57-73, digest 034305c4 recomputed by extractor and by hand) against successor 59297ed6: the comparison leaves one residual line (the Doctor check row), whose text and SHA256 4894dcf4 equal the residual file, successor carried by claim_d9185072, so partial-carry is accurate; applied approval checked: the shard row equals the pack, the reviewNote equals the Note in my committed 19ca8de23 report byte for byte, reviewedBy/reviewedAt/reviewReport (review-step10-decisions-05-19ca8de23.md at 4a18f35ff) match, and every non-review field equals the row at the request commit of that round (62d147641)",
    "remainder": "Verbatim historical residual in plans/260925-documentation-authority-unification/reports/phase-06/step10-sync19-predecessor-residuals.json, claim claim_26f62a1ae1abc17d0f02706788bfd399, residual SHA256 4894dcf4de3a1254ebc5e89c78ffed0afafc58859c82fa2b2781ac8216b08424. Source 034305c494ee289535b1b4121c8b90ed9d2eb5b850364e1c2a63e936221d40e3; primary target 59297ed6cac29ae0d34e9f3a48ca0c518e8c06fed5e224ca0182f627ae93839e. Residual file SHA256 recorded in step10-sync19-predecessor-reconciliation.json. A34 independent acceptance pending; cutover blocked.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-03-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "59297ed6cac29ae0d34e9f3a48ca0c518e8c06fed5e224ca0182f627ae93839e",
    "targetAncestry": [
      "Spec: Distribution",
      "Data Dictionary"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-5",
    "githubAnchor": "unheaded-block-5",
    "stableAnchor": "unheaded-block-5",
    "title": "Unheaded block 5",
    "startLine": 57,
    "endLine": 73,
    "textDigest": "59297ed6cac29ae0d34e9f3a48ca0c518e8c06fed5e224ca0182f627ae93839e",
    "sample": "| # | Element | Meaning | Values | Required | Default |\n|---|-------|---------|--------|----------|---------|\n| 1 | Package name | The npm package identity used for the git-based i",
    "identityFingerprint": "efdbc472e987bef628352ebcce1a16bf80b33d017c6b99af37f0f9d20d2dd69f",
    "ancestry": [
      "Spec: Distribution",
      "Data Dictionary"
    ],
    "text": "| # | Element | Meaning | Values | Required | Default |\n|---|-------|---------|--------|----------|---------|\n| 1 | Package name | The npm package identity used for the git-based install command | `forgent` | yes | — |\n| 2 | Package version | A semantic version string tooling (e.g. packaging commands) needs to treat the package as valid | semver string | yes | `0.1.0` |\n| 3 | Distribution file allowlist | The exact set of paths shipped to anyone installing the package — everything else in the source repo is excluded | `bin`, `src`, `scripts`, `core`, `domains`, `.agents`, `README.md`, `LICENSE`, the end-user documentation subset (`docs/how-to`, `docs/explanation`, and `docs/enduser-docs-index.json`), plus `packages/convention/contracts/convention.rules.v1.json`, which installed doctor needs to interpret per-rule cutoffs without duplicating native rule data | yes | — |\n| 4 | CLI entry points | The commands exposed once installed | `fgos` → runs `bin/fgos.mjs`; `fgos-runner` → runs `bin/fgos-runner.mjs` (the autonomous-loop runner, see spec Runner) | yes | — |\n| 4b | Claude Code plugin skill set | `plugins/fgOS/skills/` — the Claude Code plugin's own skill bundle, distributed via the Claude Code plugin marketplace mechanism (a separate distribution channel from the npm-installed `fgos`/`fgos-runner` CLI above). Ships two layers: hand-authored CLI-wrapper skills (`cook`, `discover`, `pick`, `submit`, ...) and mirrored `fgos-*` dev-skills plus `_shared/` for plugin-only consumers. Dev-skills are authored in `core/skills/` or `domains/*/skills/`; run `npm run build:skills` in the fgOS source repo to assemble `.agents/skills/`, generate `.claude/skills/` thin wrappers and references, and mirror dev-skills/shared fragments into the plugin. Plugin mirrors stay byte-identical to `.agents/skills/`, while Claude `SKILL.md` files are thin redirects with byte-identical frontmatter (`test/skills/fgos-mirror.test.mjs`). Assembled Markdown carries a generated-from source header. Do not hand-edit `.agents`, generated `.claude` files, or plugin mirrors; hand-authored CLI-wrapper skills remain sources. `plugin-dev-skills-packaged` (doctor check, row 7 below) detects missing or stale plugin mirrors | mirrored dev-skills + shared fragments + hand-authored CLI-wrapper skills | yes (the mirrors let plugin-only consumers dispatch dev-skills without a source checkout) | — |\n| 5 | Dev checkout shell helper | An opt-in file, sourced from a contributor's own shell profile, exposing the same two CLI entry points from inside a checkout of the source repository — no install, no package fetch | one file, both commands | no (contributor's own choice) | not sourced automatically anywhere |\n| 5b | Global config file | `~/.fgos/config.json` — same schema as the project-local shared config file, initialized/kept current by `fgos setup` (tsk-1ri) the same way it already handles the project-local file; project always wins any key present in both (`mergeWithGlobalConfig`, `src/config/global-config.mjs`) | one file, home-dir-relative | no (optional; a missing file is not an error, resolves to `{}`) | not created by anything except `fgos setup` |\n| 5c | Machine backend registry file | `~/.fgos/confinement-backends.json` (overridable via `FGOS_CONFINEMENT_BACKEND_REGISTRY_PATH`) — machine-local backend registry declaring confinement backends (e.g. `bwrap`, container) available on the host (`confinement-backend-registry.v1`); managed by `fgos doctor --fix` (not project-over-global merge), trust store for security isolation drivers | one file, machine-local path | no (optional; bootstrap creates default bwrap backend on demand) | `~/.fgos/confinement-backends.json` |\n| 5d | Provider-capacity runtime state | `~/.fgos/runtime/provider-capacity/state.json` plus lock `state.lock` — machine-local selected-account lease/quarantine state for provider-capacity rotation. Intentionally host-global only (never project-overridden) so multiple projects sharing provider accounts coordinate concurrency and rate limits safely without starvation. It is never packaged, never committed, and never repaired by `doctor`; `fgos dispatch inspect --provider-capacity` and the `provider-capacity-state` doctor check report it, while manual clear goes through `fgos dispatch reconcile provider-capacity clear-quarantine ...`. An account locked for a dead login is also unlocked by one real call when a dispatch would otherwise find no usable account (the lazy-probe unlock rule, now in `docs/specs/runner.md`). The same directory holds `account-locks/<provider>/<account>/`: the per-account lock, copies of a login renewed elsewhere and waiting to be applied, a scratch home while a renewal runs, and the renewal failure cooldown; it is created only when a renewal or write-back runs and holds no credential outside those copies. | one runtime directory, home-dir-relative | no (created only when a provider account lease/quarantine/write occurs) | absent/inactive |\n| 5e | Confinement attestation store state | `~/.local/state/fgos/attestations/` (or `$XDG_STATE_HOME/fgos/attestations`, overridable via `FGOS_CONFINEMENT_ATTESTATION_STORE_PATH`) — host-global security attestation records. Intentionally host-global only (outside all agent write grants) so confined agents can never tamper with their own audit trails, preserving immutable attestation integrity across projects. | one directory, machine-local path | no (created on first confined dispatch attestation) | absent/inactive |\n| 5f | Workspace customization folder | `fgos/` at the project root: tracked in the project's own git, written once as a skeleton at onboarding and never edited by fgOS afterwards. Holds the customer's own agent definitions (`fgos/agents/<name>.yaml`), which win over a definition of the same name in the installed set (RUL13 (customer customization lives in one tracked workspace folder)). Read by `--seats @name` (runner decision 0057); the `fgctl init` skeleton is not built yet | directory | no | absent — the installed set alone applies |\n| 6 | Config staleness | Whether a config file (project-local or global — same computation, tsk-1ri) already has every setting the current default schema defines | up to date / missing one or more default settings | yes (computed, not stored) | — |\n| 7 | Doctor check | One named diagnostic `fgos doctor` reports on | not a fixed list — an extensible registry (`src/setup/registrations.mjs`'s `registerCheck`); a check registration and a config-default registration are independent, never a forced pairing — a module may register only a check, only a config-default, or both. Today's registered checks: `convention-conformance`, `node-version-and-git`, `cli-version-visible` (tsk-2ej), `shell-integration-sourced`, `project-fgos-launcher` (a release install has one fgos launcher on PATH that runs each project's own activated fgos, see RUL17 (one fgos on PATH runs each project's own activated fgos)), `config-not-stale`, `main-checkout-hook-wired`, `tool-registry-configured`, `work-classification-vocabulary`, `work-step-vocabulary` (tsk-64h), `domain-workflow-operations-coverage`, `root-drift`, `delivered-not-on-trunk` (tsk-1l9), `config-awareness`, `provider-capacity-state` (reports account lease/quarantine state and never auto-clears), `credential-copies-retained` (login copies still pending for a renewal after a day, and private homes held after repeated staging failures, counted by provider/account and age; read-only, a held home fails, copies waiting for a renewal only warn, and, when the machine-global provider inventory was read, copies of any age in a store directory the account's login store layout no longer reads fail, naming the directory for hand recovery (when the global config cannot be read or is refused by the validator the check fails, says the layout was not checked with the reason, lists copies at any age and promises nothing about a dispatch); interrupted stagings (pending/.tmp-*) are reported too once their writer is gone and they have sat for ten minutes, and the over-limit line names the store; kept homes under a registered backend's temp and private-home roots are scanned, which the orphan reaper check does not do, and one there counts as held at once because nothing retries it; the check itself never deletes and never prints a value), `provider-capacity-lock-stale` (Phase 06 C2c: the provider-capacity state.lock file, if any, is not held by a dead process; read-only, never reclaims), `dependencies-installed`, `gate-bypass-configured`, `claude-plugin-marketplace`, `plugin-skill-cli-reachable`, `plugin-dev-skills-packaged` (tsk-32b), `changelog-unreleased-stale`, `herdr-launcher-configured`, `herdr-web-dashboard-configured` (tsk-48w), `enduser-docs-index-stale` (tsk-1m0), `invariant-checks-configured` (tsk-516), `invocation-git-write-grants` (warns when an invocation or executor still grants a git add or git commit tool; the runner commits, workers only edit files; read-only, never rewrites user config), `worktree-setup-configured` (a present worktreeSetup section is a list of non-empty shell commands every runner-created worktree runs after its dependency install; never executes them), `events-jsonl-not-truncated` (tsk-cgg), `worker-slots-ceiling-usable` (tsk-1oz), `gateway-token-configured` (tsk-4r1), `readme-install-tag-exists` (tsk-2t8), `iron-law-configured` (tsk-1y6-1), `leaf-notify-drift` (tsk-1el), `task-specs-resolve` (tsk-2t9c), `agent-claims-resolve` (tsk-2t9c), `agent-type-names-unique` (tsk-397-12; names unique within each tier fgos/agents, domains/*/agents, core/agents, a higher tier replaces a lower one whole, the fgos/agents files checked for shape), `domain-registry-compiled` (every domain's compiled.json file under domains — the YAML-free form of the registry and workflow YAML the Work lifecycle reads, regenerated by the build:domains npm script; a drift test keeps it equal to the YAML), `dispatch-decide-hook-wired` (tsk-60f; also requires the AskUserQuestion decision-question hook), `codex-hook-wired`, `agy-hook-wired`, `omp-hook-wired`, `pi-hook-wired`, `decision-index-stale` (tsk-1lv-2/tsk-1lv), `advise-execute-capabilities-configured` (tsk-2uf-3), `workflow-capabilities-configured` (every capability a core/domain Workflow unit names resolves in runner.capabilities by exact name or bare verb, the way bind() looks it up, and fails when it does not; one that resolves but has no \"prefer\" pool on either name is reported as a warning because bind() refuses its unit headless; fgos setup registers every shipped Workflow's capabilities as description-only defaults, so a fresh project starts with that warning, and never overwrites a project's own entry), `capability-serves-valid` (I19: every runner.capabilities entry's serves attribute set is well-formed, no two entries declare the identical set, and the review slot is present), `agy-permissions-configured` (tsk-1xm), `agy-sub-homes-configured`, `bwrap-available`, `curl-available` (curl runs, because fgctl init downloads a release through it; a missing curl is a warning that only blocks the download paths, never a failure, see RUL15 (fgctl init downloads a checksum-verified release when no source is given)), `main-checkout-guard-warnings` (tsk-1vc-3), `events-compaction-verified` (tsk-3ve-6), `no-stuck-merge-abort` (tsk-40a), `doc-registry-enforce` (tsk-28x), `doc-registry-stale` (tsk-28x), `doc-alias-broken` (tsk-28x), `doc-active-duplicate` (tsk-28x), `doc-near-duplicate` (tsk-28x), `doc-provisional-aged` (tsk-28x), `doc-topic-oversized` (tsk-28x), `doc-role-underused` (tsk-28x), `doc-source-conservation` (tsk-28x), `doc-current-path-missing` (tsk-3uc), `doc-source-unreachable` (tsk-3uc), `coordination-protocol-fixtures-valid` (retired; confirms legacy definition fixtures retired), `operation-prompt-templates-valid` (Phase 03 I04: every discoverable operation prompt template validates against bounded variables and schema), `coordination-example-requests-valid` (Step 08 Phase 07 R3: published fgos coordination run example request files validate against the same schema boundary the CLI itself enforces, and resolve every referenced protocolRef), `herdr-available`, `trust-store-readable`, `non-claude-trust-stores-readable` (Phase 07 herdr-trust-supervisor R3: every executor or invocation declaring a codex-toml or agy/agy-json trustStore reads from a store that is actually readable, using the same reader the live dispatch will use), `confined-pane-accounts` (every confined herdr invocation that binds a private home has an account in the machine-global provider account inventory whose credential files exist, so its pane starts logged in; see RUL65b in the runner spec), `agent-cli-project-trusted` (the project root is trusted in every codex home and agy sub-HOME the configured executors run under, so a headless dispatch does not stop at a \"Trust this folder?\" prompt until its timeout; reads only a yes/no for the one path, names the exact line a person must add, never edits the CLI's config; not applicable when the root is not a git repository or no codex/agy executor is configured), `workflow-pools-satisfy-independence` (for every panel or reviewed Workflow unit, drives the runner's own pattern code through bind() without dispatching anything and fails when the capability prefer pool cannot supply enough distinct provider families for every role (three panelists plus a synthesizer need four); a provider out of quota or blocked on a trust prompt is invisible to bind() and not counted), `blind-steps-use-proven-pools` (for every Workflow unit declared blind, walks each role's candidates through bind() without dispatching anything and fails when the capability prefer pool can bind an executor whose provider family, transport and confinement backend are not in the table of canary-proven pairs kept in the check's own module; read-only, no model call; not applicable when no unit is blind), `executor-posture-coverage` (core capabilities execute, code:implement, and capabilities declaring a pool have at least one candidate executor capable of applying required posture; dry simulation via bind(), no process spawn), `executor-confinement` (dispatch visibility V0 Phase 01 group D: the transport an interactive dispatch needs, a readable folder-trust store so a fresh worktree can be pre-trusted instead of stopping at a dialog, and a second reading of the rule that an executor may only declare bypass permission mode alongside full confinement), `herdr-executor-kinds` (Phase 05 R3: every executor dispatched through a herdr pane names an agent kind herdr can actually start, and none depends on an integration hook herdr reports as outdated -- an installed-but-stale hook is believed by herdr and may report the wrong agent state, while a missing one only degrades detection), `executor-profile-warnings` (Phase 06 executor-policy-dispatch-seams: legacy executor/capability entries hardcoding policy-shaped flags, policy-overrides-as-identity, or account-pool-shaped env, each named with its documented migration target -- informational only, never a hard failure), `active-release-matches-checkout` (read-only Node payload contents against doctor dir working tree, not HEAD or Rust binary freshness; reports changed/missing/extra source files while excluding staged dependencies, skips outside source checkouts and main-owned activation in linked worktrees; use fgos:dev for working-tree code or restage/activate for plain fgos), `rust-host-binary-present`, `rust-host-target-supported`, `legacy-node-payload-present`, `command-routes-drift`, `confinement-policies-declared`, `confinement-backend-registry-readable`, `confinement-bwrap-platform`, `confinement-probe-freshness`, `confinement-blind-read` (a blind unit can be enforced: the registered bwrap backend hides peer run state, homes and processes from a worker; reports pass, fail, or backend-unsupported, in which case every blind unit is refused), `confinement-strict-readiness`, `confinement-orphaned-resources-reaped` (Phase 04 M8: no confinement temp resource is left behind by a dead owning process, and no confinement temp root is readable beyond its owner; a home kept for a still-open pane is not orphaned; the fix tightens the root to 0700 and reaps), `confinement-herdr-maturity`, `instruction-projections-stale`, `coordination-abandoned-claims`, `runner-coordination-orgPolicy-shape`, `operation-capability-resolves` (Unit I21: every discoverable operation's declared policy.capability resolves against the live runner config, reporting reachable provider-family diversity), `shadow-binder-divergence` (dispatch-engine-liveness-hardening Phase 7 C1: real PlacementPolicy/ProviderAdapter shadow-binder divergence is durably recorded to a local JSONL under .fgos/dispatch/, not only an ephemeral stderr line; informational, never fails), `observe-dir-writable`, `observe-friction-migrated`, `observe-host-resolvable`, `writer-identity-resolvable` (the writer identity resolves through the Rust host for both the running host and the workspace activation a plain git commit hook uses; each binary is asked directly, so an older activated release shows as a version mismatch), `observe-run-coverage`, `runner-rigor-config` (validates project/global rigor-to-tier mappings and retired capability overrides), `coordination-protocol-dead-vocabulary` (validates definitions against dead vocabulary), `model-policy-tier-coverage` (validates model policies cover all tiers required by rigor-to-tier), `tier-vocabulary-dead-keys` (validates project and global config do not contain retired tier/rigor keys), `runner-patterns-config` (validates presence, valid checkers, and cumulative checkersByRigor for runner patterns), `runner-generated-paths` (validates runner.generatedPaths source-to-render-target mappings), `mutating-assignment-binding-snapshot` (validates that mutating assignment RunResult bindings match unit.json snapshot). The registry is open, but this list is not a snapshot — it names every registered check, and a module adding one updates this row in the same change | yes | — |\n| 7b | Doctor fix | One named repair `fgos doctor --fix` can run before re-reporting checks | not a fixed list — an extensible registry (`registerFix`), independent of `registerCheck`/`registerConfigDefault` (per tsk-2cs). Today's registered fixes: `credential-copies-retained` (re-checks private homes held after repeated staging failures, and any kept home under a registered backend's own root, which nothing else retries, under the account lock, and removes one only when its login is shown applied or obsolete; also removes an interrupted staging (pending/.tmp-*) only after claiming it by rename, when its writer is gone and it is empty, identical to a copy already kept, or shown no newer than the source login under the account lock; never removes on age), `gate-bypass-configured` (tsk-2qz, the registry's first entry to register all three capabilities at once), `claude-plugin-marketplace` (tsk-4xg), `enduser-docs-index-stale` (tsk-1m0), `bin-discovery-cache` (tsk-2qc-1), `gateway-token-configured` (tsk-4r1), `iron-law-configured` (tsk-1y6-1), `decision-index-stale` (tsk-1lv-2/tsk-1lv), `agy-permissions-configured` (tsk-1xm), `no-stuck-merge-abort` (tsk-40a), `doc-registry-stale` (tsk-28x), `confinement-backend-registry-readable`, `confinement-orphaned-resources-reaped` (Phase 04 M8), `instruction-projections-stale`, `coordination-abandoned-claims`, `runner-coordination-orgPolicy-shape`, `project-fgos-launcher`, `dispatch-decide-hook-wired`, `codex-hook-wired`, `agy-hook-wired`, `omp-hook-wired`, `pi-hook-wired`. Same rule as #7: the registry is open, but this list names every registered fix and a module adding one updates this row in the same change | yes | — |\n| 8 | Output rendering mode | How `fgos setup`/`fgos doctor` present their result | enveloped JSON (every other verb's shape, unchanged) / colored plain text (`--pretty`) | yes | enveloped JSON |"
  },
  "currentNativeSuccessor": {
    "sourcePath": "docs/specs/distribution.md",
    "unitDigest": "efdbc472e987bef628352ebcce1a16bf80b33d017c6b99af37f0f9d20d2dd69f",
    "identityFingerprint": "efdbc472e987bef628352ebcce1a16bf80b33d017c6b99af37f0f9d20d2dd69f",
    "claimId": "claim_d9185072d68925b4c020b13ba6c4d74f",
    "sourceAnchor": "unheaded-block-5",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "59297ed6cac29ae0d34e9f3a48ca0c518e8c06fed5e224ca0182f627ae93839e",
    "claimKind": "specification",
    "status": "current"
  },
  "sourceAndResidualHistoryPreserved": true,
  "reviewScope": "Current projection supersedes the historical artifact for this package only; historical before/native witness remains immutable. Pending rows receive no approval.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "currentDecision": {
    "claimId": "claim_26f62a1ae1abc17d0f02706788bfd399",
    "sourcePath": "docs/specs/distribution.md",
    "sourceUnitDigest": "034305c494ee289535b1b4121c8b90ed9d2eb5b850364e1c2a63e936221d40e3",
    "claimKind": "specification",
    "disposition": "partial-carry",
    "targetOwner": "docs/specs/distribution.md",
    "targetAnchor": "unheaded-block-5",
    "rationale": "A22/A31/A34: one native sync at 19ca8de23908e161c34c91626e41041b7813167c preserves this historical predecessor as a gap; current upstream source successor is separately native-accounted and carried to the candidate. Historical lines changed; exact untransferred residual is retained verbatim with SHA256, independent representation review required; cutover remains blocked. Full source/current witnesses and residual: step10-sync19-predecessor-residuals.json. No identity graft or approval carry.",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
    "reviewNote": "deep: historical docs/specs/distribution.md#unheaded-block-5 at witness 2300d6557 (L57-73, digest 034305c4 recomputed by extractor and by hand) against successor 59297ed6: the comparison leaves one residual line (the Doctor check row), whose text and SHA256 4894dcf4 equal the residual file, successor carried by claim_d9185072, so partial-carry is accurate; applied approval checked: the shard row equals the pack, the reviewNote equals the Note in my committed 19ca8de23 report byte for byte, reviewedBy/reviewedAt/reviewReport (review-step10-decisions-05-19ca8de23.md at 4a18f35ff) match, and every non-review field equals the row at the request commit of that round (62d147641)",
    "remainder": "Verbatim historical residual in plans/260925-documentation-authority-unification/reports/phase-06/step10-sync19-predecessor-residuals.json, claim claim_26f62a1ae1abc17d0f02706788bfd399, residual SHA256 4894dcf4de3a1254ebc5e89c78ffed0afafc58859c82fa2b2781ac8216b08424. Source 034305c494ee289535b1b4121c8b90ed9d2eb5b850364e1c2a63e936221d40e3; primary target 59297ed6cac29ae0d34e9f3a48ca0c518e8c06fed5e224ca0182f627ae93839e. Residual file SHA256 recorded in step10-sync19-predecessor-reconciliation.json. A34 independent acceptance pending; cutover blocked.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-03-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "59297ed6cac29ae0d34e9f3a48ca0c518e8c06fed5e224ca0182f627ae93839e",
    "targetAncestry": [
      "Spec: Distribution",
      "Data Dictionary"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "accounting-066"
}
```

## Entry accounting-067

```json
{
  "kind": "refreshed-dependent-accounting",
  "historicalArtifact": "plans/260925-documentation-authority-unification/reports/phase-06/step10-sync19-prior-findings.json",
  "historicalProjectionPath": "/rows/6/currentDecision",
  "historicalSnapshot": {
    "claimId": "claim_d956ba3fb9a8cce9589194e5f59d021f",
    "sourceUnitDigest": "3cb37dbc28864019579211dcadd7e189fb667783946e770ad45a9a81c2ca5b30",
    "claimKind": "navigation",
    "disposition": "reclassify-out-of-platform-scope",
    "authoredBy": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
    "rationale": "L10-3 / A31: historical native instruction/navigation identity claim_d956ba3fb9a8cce9589194e5f59d021f records docs/specs/reading-map.md#unheaded-block-2 at digest 3cb37dbc28864019579211dcadd7e189fb667783946e770ad45a9a81c2ca5b30. The numbered anchor identifies historical text, not a claim of current byte equality. Retain root instructions and repository navigation outside platform authority. Current changed unit is separately drafted at SYNC 59b9b7087; native sync must determine retained identity or predecessor gap, preserving all history. No platform copy, source-to-self carry proof, truth approval or retirement. Final b01 clarification: the current merged section 5 carries 53 original entries, with seven entries explicitly labelled truth corrections and evidence, plus one verbatim Session Identity entry from main. It does not assert that all 53 are still verbatim or defer those seven known truth fixes to promotion; wrapper count is 36 in 55 directories (_shared has no SKILL.md). Historical source binding and current navigation are separately pending independent review. Native sync at 19ca8de23908e161c34c91626e41041b7813167c confirms a predecessor gap; retain historical root/navigation identity outside platform scope. Current successor is separately native-resolved. No live old-anchor claim.",
    "reviewStatus": "reviewed",
    "reviewNote": "deep: historical docs/specs/reading-map.md#unheaded-block-2 at witness 2300d6557 (L11-63, digest 3cb37dbc recomputed equal): the rationale now says the merged section 5 carries 53 entries with seven labelled truth corrections plus one Session Identity entry and a 36-wrapper count; checked: seven Truth correction labels in docs/reading-map.md, entries 24, 25, 42, 44, 48, 51, 52 differ from docs/specs/reading-map.md, the other 47 entries are byte-equal (Session Identity entry included), plugins/fgOS/skills has 55 directories, 54 SKILL.md, 18 fgos- prefixed, 36 wrappers, _shared has no SKILL.md; previous rework answered",
    "sourcePath": "docs/specs/reading-map.md",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-19ca8de23.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "4a18f35ff5d6a9b7a07e955bd64418282c6a91b2"
  },
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s5-root-boundary-sync.json",
  "collection": "registryGaps",
  "relatedClaimId": "claim_d956ba3fb9a8cce9589194e5f59d021f",
  "after": {
    "claimId": "claim_d956ba3fb9a8cce9589194e5f59d021f",
    "sourceUnitDigest": "3cb37dbc28864019579211dcadd7e189fb667783946e770ad45a9a81c2ca5b30",
    "claimKind": "navigation",
    "disposition": "reclassify-out-of-platform-scope",
    "authoredBy": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
    "rationale": "L10-3 / A31: historical native instruction/navigation identity claim_d956ba3fb9a8cce9589194e5f59d021f records docs/specs/reading-map.md#unheaded-block-2 at digest 3cb37dbc28864019579211dcadd7e189fb667783946e770ad45a9a81c2ca5b30. The numbered anchor identifies historical text, not a claim of current byte equality. Retain root instructions and repository navigation outside platform authority. Current changed unit is separately drafted at SYNC 59b9b7087; native sync must determine retained identity or predecessor gap, preserving all history. No platform copy, source-to-self carry proof, truth approval or retirement. Final b01 clarification: the current merged section 5 carries 53 original entries, with seven entries explicitly labelled truth corrections and evidence, plus one verbatim Session Identity entry from main. It does not assert that all 53 are still verbatim or defer those seven known truth fixes to promotion; wrapper count is 36 in 55 directories (_shared has no SKILL.md). Historical source binding and current navigation are separately pending independent review. Native sync at 19ca8de23908e161c34c91626e41041b7813167c confirms a predecessor gap; retain historical root/navigation identity outside platform scope. Current successor is separately native-resolved. No live old-anchor claim.",
    "reviewStatus": "reviewed",
    "reviewNote": "deep: historical docs/specs/reading-map.md#unheaded-block-2 at witness 2300d6557 (L11-63, digest 3cb37dbc recomputed by extractor and by hand), no target: the rationale's statements about the merged section (seven labelled truth corrections, one Session Identity entry, 36 wrappers in 55 directories without SKILL.md in _shared) were rechecked at HEAD (seven 'Truth correction' labels and the 36-in-55 wording in docs/reading-map.md; plugins/fgOS/skills has 55 directories and 54 SKILL.md) and docs/reading-map.md, docs/specs/reading-map.md and AGENTS.md are identical to 19ca8de23; applied approval checked: the shard row equals the pack, the reviewNote equals the Note in my committed 19ca8de23 report byte for byte, reviewedBy/reviewedAt/reviewReport (review-step10-decisions-05-19ca8de23.md at 4a18f35ff) match, and every non-review field equals the row at the request commit of that round (62d147641)",
    "sourcePath": "docs/specs/reading-map.md",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-03-345f15d95.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "currentTarget": null,
  "currentNativeSuccessor": null,
  "sourceAndResidualHistoryPreserved": true,
  "reviewScope": "Current projection supersedes the historical artifact for this package only; historical before/native witness remains immutable. Pending rows receive no approval.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "currentDecision": {
    "claimId": "claim_d956ba3fb9a8cce9589194e5f59d021f",
    "sourceUnitDigest": "3cb37dbc28864019579211dcadd7e189fb667783946e770ad45a9a81c2ca5b30",
    "claimKind": "navigation",
    "disposition": "reclassify-out-of-platform-scope",
    "authoredBy": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
    "rationale": "L10-3 / A31: historical native instruction/navigation identity claim_d956ba3fb9a8cce9589194e5f59d021f records docs/specs/reading-map.md#unheaded-block-2 at digest 3cb37dbc28864019579211dcadd7e189fb667783946e770ad45a9a81c2ca5b30. The numbered anchor identifies historical text, not a claim of current byte equality. Retain root instructions and repository navigation outside platform authority. Current changed unit is separately drafted at SYNC 59b9b7087; native sync must determine retained identity or predecessor gap, preserving all history. No platform copy, source-to-self carry proof, truth approval or retirement. Final b01 clarification: the current merged section 5 carries 53 original entries, with seven entries explicitly labelled truth corrections and evidence, plus one verbatim Session Identity entry from main. It does not assert that all 53 are still verbatim or defer those seven known truth fixes to promotion; wrapper count is 36 in 55 directories (_shared has no SKILL.md). Historical source binding and current navigation are separately pending independent review. Native sync at 19ca8de23908e161c34c91626e41041b7813167c confirms a predecessor gap; retain historical root/navigation identity outside platform scope. Current successor is separately native-resolved. No live old-anchor claim.",
    "reviewStatus": "reviewed",
    "reviewNote": "deep: historical docs/specs/reading-map.md#unheaded-block-2 at witness 2300d6557 (L11-63, digest 3cb37dbc recomputed by extractor and by hand), no target: the rationale's statements about the merged section (seven labelled truth corrections, one Session Identity entry, 36 wrappers in 55 directories without SKILL.md in _shared) were rechecked at HEAD (seven 'Truth correction' labels and the 36-in-55 wording in docs/reading-map.md; plugins/fgOS/skills has 55 directories and 54 SKILL.md) and docs/reading-map.md, docs/specs/reading-map.md and AGENTS.md are identical to 19ca8de23; applied approval checked: the shard row equals the pack, the reviewNote equals the Note in my committed 19ca8de23 report byte for byte, reviewedBy/reviewedAt/reviewReport (review-step10-decisions-05-19ca8de23.md at 4a18f35ff) match, and every non-review field equals the row at the request commit of that round (62d147641)",
    "sourcePath": "docs/specs/reading-map.md",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-03-345f15d95.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "accounting-067"
}
```

## Entry accounting-068

```json
{
  "kind": "refreshed-dependent-accounting",
  "historicalArtifact": "plans/260925-documentation-authority-unification/reports/phase-06/step10-sync19-prior-findings.json",
  "historicalProjectionPath": "/rows/7/currentDecision",
  "historicalSnapshot": {
    "claimId": "claim_b19630ef4dcf1330c9807fc226a90e7b",
    "sourcePath": "docs/architecture-manifest.json",
    "sourceUnitDigest": "92391ce631b0c3602a5e22947a73182a6fd37f148e4b052cb4749a55b7657a6d",
    "claimKind": "contract",
    "disposition": "supersede",
    "targetOwner": "docs/architecture-manifest.json",
    "targetAnchor": "file-block",
    "rationale": "A22/A31/A34: one native sync at 19ca8de23908e161c34c91626e41041b7813167c preserves this historical predecessor as a gap; current upstream source successor is separately native-accounted and carried to the candidate. All historical source lines occur verbatim in order in current successor; insertion-only containment. Full source/current witnesses and residual: step10-sync19-predecessor-residuals.json. No identity graft or approval carry.",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
    "reviewNote": "deep: historical file docs/architecture-manifest.json at witness 2300d6557 (digest 92391ce6 recomputed equal) against the current file (digest 2d55be82 recomputed equal): line comparison shows zero historical lines lost and one inserted line (src/util/host-bin-path.mjs kernel entry), matching the residual file (empty, SHA e3b0c442), so supersede with insertion-only containment is accurate; the current file is carried by claim_03ef50e8",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-19ca8de23.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "2d55be82331318dd370052c80940458ce88894b98b049d626e41ba1bc6653b6a",
    "targetAncestry": [],
    "reviewReportCommit": "4a18f35ff5d6a9b7a07e955bd64418282c6a91b2"
  },
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s5-root-main-recarry.json",
  "collection": "registryGaps",
  "relatedClaimId": "claim_b19630ef4dcf1330c9807fc226a90e7b",
  "after": {
    "claimId": "claim_b19630ef4dcf1330c9807fc226a90e7b",
    "sourcePath": "docs/architecture-manifest.json",
    "sourceUnitDigest": "92391ce631b0c3602a5e22947a73182a6fd37f148e4b052cb4749a55b7657a6d",
    "claimKind": "contract",
    "disposition": "supersede",
    "targetOwner": "docs/architecture-manifest.json",
    "targetAnchor": "file-block",
    "rationale": "A22/A31/A34: one native sync at 19ca8de23908e161c34c91626e41041b7813167c preserves this historical predecessor as a gap; current upstream source successor is separately native-accounted and carried to the candidate. All historical source lines occur verbatim in order in current successor; insertion-only containment. Full source/current witnesses and residual: step10-sync19-predecessor-residuals.json. No identity graft or approval carry.",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
    "reviewNote": "deep: historical docs/architecture-manifest.json at witness 2300d6557 (sha256 92391ce6 recomputed) against the current file 2d55be82: 268 historical lines all occur in order in the 269-line successor (one inserted line), the residual is empty (SHA256 e3b0c442 is the empty-string hash, matches the residual file), successor carried by claim_03ef50e8, so supersede with insertion-only containment is accurate; applied approval checked: the shard row equals the pack, the reviewNote equals the Note in my committed 19ca8de23 report byte for byte, reviewedBy/reviewedAt/reviewReport (review-step10-decisions-05-19ca8de23.md at 4a18f35ff) match, and every non-review field equals the row at the request commit of that round (62d147641)",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-03-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "2d55be82331318dd370052c80940458ce88894b98b049d626e41ba1bc6653b6a",
    "targetAncestry": [],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "currentTarget": {
    "unitKind": "file-block",
    "anchor": "file-block",
    "githubAnchor": "file-block",
    "stableAnchor": "file-block",
    "title": "architecture-manifest.json",
    "startLine": 1,
    "endLine": 269,
    "textDigest": "2d55be82331318dd370052c80940458ce88894b98b049d626e41ba1bc6653b6a",
    "identityFingerprint": "bee0f585dc079a9cf24fe84a2cfacaa3aa99e6818f4fbf4e69dbf76dd601e99c",
    "sample": "{\n  \"contract\": \"architecture-manifest.v1\",\n  \"map\": \"docs/architecture-map.md\",\n  \"layers\": [\n    \"entry\",\n    \"use-case\",\n    \"infra\",\n    \"domain\",\n    \"kernel\"\n  ],\n  \"rules\": ",
    "ancestry": [],
    "text": "{\n  \"contract\": \"architecture-manifest.v1\",\n  \"map\": \"docs/architecture-map.md\",\n  \"layers\": [\n    \"entry\",\n    \"use-case\",\n    \"infra\",\n    \"domain\",\n    \"kernel\"\n  ],\n  \"rules\": [\n    \"one-directional-layer\",\n    \"domain-siloing\"\n  ],\n  \"components\": [\n    \"packaging-distribution\"\n  ],\n  \"domains\": [\n    \"coding\",\n    \"marketing\"\n  ],\n  \"files\": {\n    \"bin/fgos.mjs\": \"entry\",\n    \"bin/fgos-runner.mjs\": \"entry\",\n    \"src/runner/loop.mjs\": \"use-case\",\n    \"src/runner/paths.mjs\": \"infra\",\n    \"src/runner/dispatch.mjs\": \"infra\",\n    \"src/runner/operation-capability.mjs\": \"domain\",\n    \"src/runner/rigor.mjs\": \"kernel\",\n    \"src/runner/fanout-batch.mjs\": \"use-case\",\n    \"src/runner/work-compat.mjs\": \"infra\",\n    \"src/runner/dispatch/adapters.mjs\": \"infra\",\n    \"src/runner/dispatch/config.mjs\": \"infra\",\n    \"src/runner/dispatch/confinement/policies.mjs\": \"infra\",\n    \"src/runner/dispatch/confinement/bypass-pairing.mjs\": \"infra\",\n    \"src/runner/dispatch/confinement/backend-registry.mjs\": \"infra\",\n    \"src/runner/dispatch/confinement/authority.mjs\": \"infra\",\n    \"src/runner/dispatch/confinement/request.mjs\": \"infra\",\n    \"src/runner/dispatch/confinement/resources.mjs\": \"infra\",\n    \"src/runner/dispatch/confinement/cleanup.mjs\": \"infra\",\n    \"src/runner/dispatch/confinement/attestation-store.mjs\": \"infra\",\n    \"src/runner/dispatch/confinement/drivers/bwrap.mjs\": \"infra\",\n    \"src/runner/dispatch/confinement/probes/harness.mjs\": \"infra\",\n    \"src/runner/dispatch/resolve.mjs\": \"infra\",\n    \"src/runner/dispatch/mechanism.mjs\": \"infra\",\n    \"src/runner/dispatch/plan.mjs\": \"infra\",\n    \"src/runner/dispatch/transport.mjs\": \"infra\",\n    \"src/runner/dispatch/prepare.mjs\": \"infra\",\n    \"src/runner/dispatch/result-ladder.mjs\": \"infra\",\n    \"src/runner/dispatch/assignment.mjs\": \"infra\",\n    \"src/runner/dispatch/assignment-layout.mjs\": \"infra\",\n    \"src/runner/dispatch/assignment-normalizer.mjs\": \"infra\",\n    \"src/runner/dispatch/execution-contract.mjs\": \"infra\",\n    \"src/runner/dispatch/effective-execution-contract.mjs\": \"infra\",\n    \"src/runner/dispatch/agent-result-claim-contract.mjs\": \"infra\",\n    \"src/runner/dispatch/evidence-attribution.mjs\": \"infra\",\n    \"src/runner/dispatch/write-scope.mjs\": \"kernel\",\n    \"src/runner/dispatch/run-timeout.mjs\": \"kernel\",\n    \"src/runner/dispatch/run-result.mjs\": \"infra\",\n    \"src/runner/dispatch/usage-parsers.mjs\": \"infra\",\n    \"src/runner/dispatch/runtime-inspection.mjs\": \"infra\",\n    \"src/runner/dispatch/reconciliation-planner.mjs\": \"infra\",\n    \"src/runner/dispatch/assignment-policy.mjs\": \"infra\",\n    \"src/runner/dispatch/operation-prompt-templates.mjs\": \"infra\",\n    \"src/runner/dispatch/provider-adapter.mjs\": \"infra\",\n    \"src/runner/dispatch/provider-capacity.mjs\": \"infra\",\n    \"src/runner/dispatch/provider-auth-failure.mjs\": \"infra\",\n    \"src/runner/dispatch/provider-credential-probe.mjs\": \"infra\",\n    \"src/runner/dispatch/provider-account-probe.mjs\": \"infra\",\n    \"src/runner/dispatch/provider-credential-renewal.mjs\": \"infra\",\n    \"src/runner/dispatch/assignment-runner.mjs\": \"infra\",\n    \"src/runner/dispatch/settlement.mjs\": \"infra\",\n    \"src/runner/dispatch/reconcile-cli-spawn.mjs\": \"infra\",\n    \"src/runner/dispatch/cli.mjs\": \"infra\",\n    \"src/runner/dispatch/detached-run-supervisor.mjs\": \"infra\",\n    \"src/runner/prompt-templates.mjs\": \"infra\",\n    \"src/runner/worker-log.mjs\": \"infra\",\n    \"src/runner/agent-roster.mjs\": \"infra\",\n    \"src/runner/agent-definitions.mjs\": \"infra\",\n    \"src/runner/agent-listing.mjs\": \"infra\",\n    \"src/runner/worktree.mjs\": \"infra\",\n    \"src/runner/promote-preflight.mjs\": \"infra\",\n    \"src/runner/promote-engine.mjs\": \"infra\",\n    \"src/runner/session.mjs\": \"infra\",\n    \"src/runner/gateway-control.mjs\": \"infra\",\n    \"src/runner/goal-check.mjs\": \"infra\",\n    \"src/runner/iron-law-gate.mjs\": \"infra\",\n    \"src/runner/frozen-judge.mjs\": \"domain\",\n    \"src/runner/merge.mjs\": \"infra\",\n    \"src/runner/main-checkout-lock.mjs\": \"infra\",\n    \"src/runner/main-checkout-activity.mjs\": \"infra\",\n    \"src/runner/main-checkout-reset-guard.mjs\": \"infra\",\n    \"src/runner/github-adapter.mjs\": \"infra\",\n    \"src/state/drift-status.mjs\": \"infra\",\n    \"src/state/postland-drift.mjs\": \"infra\",\n    \"src/state/store.mjs\": \"infra\",\n    \"src/state/gate-bypass.mjs\": \"infra\",\n    \"src/state/cursor.mjs\": \"use-case\",\n    \"src/state/porting-store.mjs\": \"infra\",\n    \"src/state/tool-registry.mjs\": \"domain\",\n    \"src/install/coexist.mjs\": \"infra\",\n    \"src/runner/recovery.mjs\": \"domain\",\n    \"src/runner/anti-loop.mjs\": \"domain\",\n    \"src/runner/attestation-guard.mjs\": \"domain\",\n    \"src/runner/claim-port.mjs\": \"infra\",\n    \"src/runner/claim-liveness.mjs\": \"infra\",\n    \"src/runner/lock-wait.mjs\": \"infra\",\n    \"src/runner/write-queue.mjs\": \"domain\",\n    \"src/runner/root-affinity.mjs\": \"domain\",\n    \"src/state/status-fsm.mjs\": \"domain\",\n    \"src/state/decision-question.mjs\": \"domain\",\n    \"src/state/handoff.mjs\": \"domain\",\n    \"src/state/porting.mjs\": \"domain\",\n    \"src/state/frontier.mjs\": \"domain\",\n    \"src/state/impact.mjs\": \"domain\",\n    \"src/state/priority-formula.mjs\": \"domain\",\n    \"src/state/replay.mjs\": \"domain\",\n    \"src/state/events-compaction.mjs\": \"domain\",\n    \"src/state/dep-graph.mjs\": \"domain\",\n    \"src/state/graph-harness.mjs\": \"domain\",\n    \"src/state/graph-metrics.mjs\": \"domain\",\n    \"src/state/awaiting-context.mjs\": \"domain\",\n    \"src/state/cleanup-harness.mjs\": \"domain\",\n    \"src/state/cleanup-pool.mjs\": \"domain\",\n    \"src/state/discover-pool.mjs\": \"domain\",\n    \"src/state/plan-pool.mjs\": \"domain\",\n    \"src/state/retro-pool.mjs\": \"domain\",\n    \"src/state/retrospective-doors.mjs\": \"domain\",\n    \"src/state/worker-slots.mjs\": \"domain\",\n    \"src/intake/discovery.mjs\": \"use-case\",\n    \"src/intake/plan.mjs\": \"use-case\",\n    \"src/intake/plan-verdict-from-plan-md.mjs\": \"use-case\",\n    \"src/intake/verify-pattern-check.mjs\": \"kernel\",\n    \"src/cli/command-registry.mjs\": \"kernel\",\n    \"src/cli/deprecation.mjs\": \"kernel\",\n    \"src/cli/version.mjs\": \"kernel\",\n    \"src/cli/invocation-fault-log.mjs\": \"infra\",\n    \"src/cli/approve-fault-log.mjs\": \"infra\",\n    \"src/report/enduser-index.mjs\": \"domain\",\n    \"src/report/enduser-index-generate.mjs\": \"infra\",\n    \"src/report/decision-index.mjs\": \"infra\",\n    \"src/report/capability-plan-lint.mjs\": \"infra\",\n    \"src/report/context-render.mjs\": \"domain\",\n    \"src/report/frontmatter.mjs\": \"domain\",\n    \"src/report/authoritative-match.mjs\": \"domain\",\n    \"src/evolve/iron-law.mjs\": \"domain\",\n    \"src/state/events.mjs\": \"kernel\",\n    \"src/state/events-jsonl-truncation-guard.mjs\": \"kernel\",\n    \"src/state/main-checkout-guard-warnings.mjs\": \"kernel\",\n    \"src/state/work.mjs\": \"kernel\",\n    \"src/state/envelope.mjs\": \"kernel\",\n    \"src/intake/risk-keywords.mjs\": \"kernel\",\n    \"src/verbs/merge/merge.mjs\": \"use-case\",\n    \"src/verbs/merge/iron-law-level.mjs\": \"use-case\",\n    \"src/verbs/merge/approve.mjs\": \"use-case\",\n    \"src/verbs/merge/review.mjs\": \"use-case\",\n    \"src/verbs/merge/sync-root.mjs\": \"use-case\",\n    \"src/verbs/merge/catchup.mjs\": \"use-case\",\n    \"src/verbs/merge/reject.mjs\": \"use-case\",\n    \"src/verbs/merge/promote-to-component.mjs\": \"use-case\",\n    \"src/verbs/state/edit.mjs\": \"use-case\",\n    \"src/verbs/state/move.mjs\": \"use-case\",\n    \"src/verbs/state/read.mjs\": \"use-case\",\n    \"src/verbs/dispatch/show-run.mjs\": \"use-case\",\n    \"src/verbs/dispatch/inspect.mjs\": \"use-case\",\n    \"src/verbs/dispatch/reconcile.mjs\": \"use-case\",\n    \"src/verbs/dispatch/watch.mjs\": \"use-case\",\n    \"src/verbs/dispatch/recover.mjs\": \"use-case\",\n    \"src/report/item-trace.mjs\": \"domain\",\n    \"src/util/format-bytes.mjs\": \"kernel\",\n    \"src/util/format-duration.mjs\": \"kernel\",\n    \"src/util/normalize-path.mjs\": \"kernel\",\n    \"src/util/git-paths.mjs\": \"kernel\",\n    \"src/util/release-binary-path.mjs\": \"kernel\",\n    \"src/util/release-targets.mjs\": \"kernel\",\n    \"src/util/session-identity.mjs\": \"kernel\",\n    \"src/util/host-bin-path.mjs\": \"kernel\",\n    \"src/util/unique-tmp-tag.mjs\": \"kernel\",\n    \"src/util/host-bin.mjs\": \"infra\",\n    \"src/convention/convention-client.mjs\": \"infra\",\n    \"src/observe/friction-client.mjs\": \"infra\",\n    \"src/intake/classify.mjs\": \"use-case\",\n    \"src/setup/ansi.mjs\": \"domain\",\n    \"src/setup/config-merge.mjs\": \"domain\",\n    \"src/setup/shell-rc.mjs\": \"infra\",\n    \"src/setup/project-launcher.mjs\": \"infra\",\n    \"src/setup/bin-discovery.mjs\": \"infra\",\n    \"src/setup/skill-wrappers.mjs\": \"infra\",\n    \"src/setup/instruction-registry.mjs\": \"infra\",\n    \"src/setup/git-hooks.mjs\": \"infra\",\n    \"src/setup/claude-code-hooks.mjs\": \"infra\",\n    \"src/setup/agent-hooks.mjs\": \"infra\",\n    \"src/setup/agy-permissions.mjs\": \"infra\",\n    \"src/setup/agent-cli-trust.mjs\": \"infra\",\n    \"src/setup/blind-steps-proven-pools.mjs\": \"use-case\",\n    \"src/setup/workflow-pool-independence.mjs\": \"use-case\",\n    \"src/setup/checks.mjs\": \"use-case\",\n    \"src/setup/executor-profile-warnings.mjs\": \"infra\",\n    \"src/config/global-config.mjs\": \"infra\",\n    \"src/setup/registrations.mjs\": \"use-case\",\n    \"src/setup/executor-posture-coverage.mjs\": \"use-case\",\n    \"src/config/shared-config-file.mjs\": \"domain\",\n    \"src/state/knowledge-registry.mjs\": \"domain\",\n    \"src/report/knowledge-resolver.mjs\": \"domain\",\n    \"src/report/knowledge-projection.mjs\": \"domain\",\n    \"src/state/fgos-file-registry.mjs\": \"kernel\",\n    \"src/state/runtime-coordination.mjs\": \"infra\",\n    \"src/runner/dispatch/brief.mjs\": \"infra\",\n    \"src/runner/dispatch/dispatch-error.mjs\": \"infra\",\n    \"src/runner/dispatch/proof-helpers.mjs\": \"infra\",\n    \"src/runner/dispatch/herdr-agent.mjs\": \"infra\",\n    \"src/runner/dispatch/herdr-diagnosis.mjs\": \"infra\",\n    \"src/runner/dispatch/herdr-round.mjs\": \"infra\",\n    \"src/runner/dispatch/herdr-reconcile.mjs\": \"infra\",\n    \"src/runner/dispatch/worker-artifacts.mjs\": \"infra\",\n    \"src/runner/dispatch/liveness.mjs\": \"infra\",\n    \"src/runner/dispatch/visibility-session.mjs\": \"infra\",\n    \"src/runner/dispatch/recovery-planner.mjs\": \"infra\",\n    \"src/runner/dispatch/run-lock.mjs\": \"infra\",\n    \"src/runner/dispatch/process-identity.mjs\": \"infra\",\n    \"src/runner/dispatch/trust-store.mjs\": \"infra\",\n    \"src/runner/dispatch/worker-home.mjs\": \"infra\",\n    \"src/runner/dispatch/stop-processes-inside.mjs\": \"infra\",\n    \"src/runner/dispatch/worker-session.mjs\": \"infra\",\n    \"src/runner/dispatch/worker-session-boot.mjs\": \"infra\",\n    \"src/runner/dispatch/recovery.mjs\": \"infra\",\n    \"src/setup/instruction-composition.mjs\": \"infra\",\n    \"src/setup/instruction-projections.mjs\": \"infra\",\n    \"src/runner/execution/unit.mjs\": \"infra\",\n    \"src/runner/execution/bind.mjs\": \"infra\",\n    \"src/runner/execution/account-pin.mjs\": \"infra\",\n    \"src/runner/execution/account-rotation.mjs\": \"infra\",\n    \"src/runner/execution/dry-bind.mjs\": \"infra\",\n    \"src/runner/execution/role-ledger.mjs\": \"infra\",\n    \"src/runner/execution/commit-unit-work.mjs\": \"infra\",\n    \"src/runner/execution/partial-writes.mjs\": \"infra\",\n    \"src/runner/execution/unit-sync.mjs\": \"infra\",\n    \"src/runner/execution/handoff-refs.mjs\": \"infra\",\n    \"src/runner/execution/unit-run-history.mjs\": \"infra\",\n    \"src/runner/execution/unit-summary.mjs\": \"infra\",\n    \"src/runner/execution/run.mjs\": \"use-case\",\n    \"src/runner/execution/patterns/index.mjs\": \"domain\",\n    \"src/runner/execution/patterns/panel.mjs\": \"domain\",\n    \"src/runner/execution/patterns/presets.mjs\": \"domain\",\n    \"src/runner/execution/patterns/reviewed.mjs\": \"domain\",\n    \"src/runner/execution/patterns/role-tasks.mjs\": \"domain\",\n    \"src/runner/execution/patterns/solo.mjs\": \"domain\",\n    \"src/workflow/definition.mjs\": \"kernel\",\n    \"src/workflow/dir-guard.mjs\": \"infra\",\n    \"src/workflow/loader.mjs\": \"infra\",\n    \"src/workflow/store.mjs\": \"infra\",\n    \"src/workflow/integrate.mjs\": \"infra\",\n    \"src/workflow/plan-source.mjs\": \"infra\",\n    \"src/workflow/units-source.mjs\": \"infra\",\n    \"src/workflow/runner.mjs\": \"use-case\",\n    \"src/workflow/index.mjs\": \"use-case\",\n    \"src/workflow/checked.mjs\": \"infra\",\n    \"src/workflow/ref-digests.mjs\": \"infra\",\n    \"src/workflow/seat-providers.mjs\": \"infra\",\n    \"src/workflow/seats.mjs\": \"infra\",\n    \"src/workflow/steps.mjs\": \"kernel\",\n    \"src/state/domain-registry.mjs\": \"kernel\",\n    \"src/state/step-fsm.mjs\": \"domain\",\n    \"src/verbs/state/step.mjs\": \"use-case\",\n    \"src/runner/operation-choice.mjs\": \"use-case\",\n    \"src/runner/work-dispatch.mjs\": \"use-case\"\n  }\n}"
  },
  "currentNativeSuccessor": {
    "sourcePath": "docs/architecture-manifest.json",
    "unitDigest": "bee0f585dc079a9cf24fe84a2cfacaa3aa99e6818f4fbf4e69dbf76dd601e99c",
    "identityFingerprint": "bee0f585dc079a9cf24fe84a2cfacaa3aa99e6818f4fbf4e69dbf76dd601e99c",
    "claimId": "claim_03ef50e87178220032a3eebe5c5d89d9",
    "sourceAnchor": "file-block",
    "unitKind": "file-block",
    "sourceUnitDigest": "2d55be82331318dd370052c80940458ce88894b98b049d626e41ba1bc6653b6a",
    "claimKind": "contract",
    "status": "future"
  },
  "sourceAndResidualHistoryPreserved": true,
  "reviewScope": "Current projection supersedes the historical artifact for this package only; historical before/native witness remains immutable. Pending rows receive no approval.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "currentDecision": {
    "claimId": "claim_b19630ef4dcf1330c9807fc226a90e7b",
    "sourcePath": "docs/architecture-manifest.json",
    "sourceUnitDigest": "92391ce631b0c3602a5e22947a73182a6fd37f148e4b052cb4749a55b7657a6d",
    "claimKind": "contract",
    "disposition": "supersede",
    "targetOwner": "docs/architecture-manifest.json",
    "targetAnchor": "file-block",
    "rationale": "A22/A31/A34: one native sync at 19ca8de23908e161c34c91626e41041b7813167c preserves this historical predecessor as a gap; current upstream source successor is separately native-accounted and carried to the candidate. All historical source lines occur verbatim in order in current successor; insertion-only containment. Full source/current witnesses and residual: step10-sync19-predecessor-residuals.json. No identity graft or approval carry.",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
    "reviewNote": "deep: historical docs/architecture-manifest.json at witness 2300d6557 (sha256 92391ce6 recomputed) against the current file 2d55be82: 268 historical lines all occur in order in the 269-line successor (one inserted line), the residual is empty (SHA256 e3b0c442 is the empty-string hash, matches the residual file), successor carried by claim_03ef50e8, so supersede with insertion-only containment is accurate; applied approval checked: the shard row equals the pack, the reviewNote equals the Note in my committed 19ca8de23 report byte for byte, reviewedBy/reviewedAt/reviewReport (review-step10-decisions-05-19ca8de23.md at 4a18f35ff) match, and every non-review field equals the row at the request commit of that round (62d147641)",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-03-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "2d55be82331318dd370052c80940458ce88894b98b049d626e41ba1bc6653b6a",
    "targetAncestry": [],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "accounting-068"
}
```

## Entry accounting-071

```json
{
  "kind": "refreshed-dependent-accounting",
  "historicalArtifact": "plans/260925-documentation-authority-unification/reports/phase-06/step10-sync19-prior-findings.json",
  "historicalProjectionPath": "/rows/10/currentDecision",
  "historicalSnapshot": {
    "claimId": "claim_2bdbea8cb68325ec8b5b8d1a62447f4d",
    "sourceUnitDigest": "9a08a47745ab1aaa1c00c35a181813b16ff2e9f12eb14332d3993c9009d36219",
    "claimKind": "navigation",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
    "rationale": "L10-3 / A31: historical native instruction/navigation identity claim_2bdbea8cb68325ec8b5b8d1a62447f4d records docs/reading-map.md#unheaded-block-16 at digest 9a08a47745ab1aaa1c00c35a181813b16ff2e9f12eb14332d3993c9009d36219. The numbered anchor identifies historical text, not a claim of current byte equality. Retain root instructions and repository navigation outside platform authority. Current changed unit is separately drafted at SYNC 59b9b7087; native sync must determine retained identity or predecessor gap, preserving all history. No platform copy, source-to-self carry proof, truth approval or retirement. Native sync at 19ca8de23908e161c34c91626e41041b7813167c confirms a predecessor gap; retain historical root/navigation identity outside platform scope. Current successor is separately native-resolved. No live old-anchor claim.",
    "reviewNote": "deep: historical docs/reading-map.md#unheaded-block-16 at witness 2300d6557 (L131-183, digest 9a08a477 recomputed equal): the previous rework (37 wrappers should be 36) is fixed in the retained file, a line comparison of the witness block against current section 5 shows exactly the L155 correction (37 to 36, _shared note and Truth correction label) and one inserted Session Identity entry; the gap rationale (historical identity, no live old-anchor claim, retain outside platform scope) is accurate",
    "sourcePath": "docs/reading-map.md",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-19ca8de23.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "4a18f35ff5d6a9b7a07e955bd64418282c6a91b2"
  },
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s5-root-retained-navigation-proposal.json",
  "collection": "registryGaps",
  "relatedClaimId": "claim_2bdbea8cb68325ec8b5b8d1a62447f4d",
  "after": {
    "claimId": "claim_2bdbea8cb68325ec8b5b8d1a62447f4d",
    "sourceUnitDigest": "9a08a47745ab1aaa1c00c35a181813b16ff2e9f12eb14332d3993c9009d36219",
    "claimKind": "navigation",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
    "rationale": "L10-3 / A31: historical native instruction/navigation identity claim_2bdbea8cb68325ec8b5b8d1a62447f4d records docs/reading-map.md#unheaded-block-16 at digest 9a08a47745ab1aaa1c00c35a181813b16ff2e9f12eb14332d3993c9009d36219. The numbered anchor identifies historical text, not a claim of current byte equality. Retain root instructions and repository navigation outside platform authority. Current changed unit is separately drafted at SYNC 59b9b7087; native sync must determine retained identity or predecessor gap, preserving all history. No platform copy, source-to-self carry proof, truth approval or retirement. Native sync at 19ca8de23908e161c34c91626e41041b7813167c confirms a predecessor gap; retain historical root/navigation identity outside platform scope. Current successor is separately native-resolved. No live old-anchor claim.",
    "reviewNote": "deep: historical docs/reading-map.md#unheaded-block-16 at witness 2300d6557 (L131-183, digest 9a08a477 recomputed by extractor and by hand), no target: docs/reading-map.md is identical to 19ca8de23 and carries the corrected '36 wrapper ... 55 thư mục skill' wording (line 155; 55 directories and 54 SKILL.md on disk); applied approval checked: the shard row equals the pack, the reviewNote equals the Note in my committed 19ca8de23 report byte for byte, reviewedBy/reviewedAt/reviewReport (review-step10-decisions-05-19ca8de23.md at 4a18f35ff) match, and every non-review field equals the row at the request commit of that round (62d147641)",
    "sourcePath": "docs/reading-map.md",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-03-345f15d95.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "currentTarget": null,
  "currentNativeSuccessor": null,
  "sourceAndResidualHistoryPreserved": true,
  "reviewScope": "Current projection supersedes the historical artifact for this package only; historical before/native witness remains immutable. Pending rows receive no approval.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "currentDecision": {
    "claimId": "claim_2bdbea8cb68325ec8b5b8d1a62447f4d",
    "sourceUnitDigest": "9a08a47745ab1aaa1c00c35a181813b16ff2e9f12eb14332d3993c9009d36219",
    "claimKind": "navigation",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
    "rationale": "L10-3 / A31: historical native instruction/navigation identity claim_2bdbea8cb68325ec8b5b8d1a62447f4d records docs/reading-map.md#unheaded-block-16 at digest 9a08a47745ab1aaa1c00c35a181813b16ff2e9f12eb14332d3993c9009d36219. The numbered anchor identifies historical text, not a claim of current byte equality. Retain root instructions and repository navigation outside platform authority. Current changed unit is separately drafted at SYNC 59b9b7087; native sync must determine retained identity or predecessor gap, preserving all history. No platform copy, source-to-self carry proof, truth approval or retirement. Native sync at 19ca8de23908e161c34c91626e41041b7813167c confirms a predecessor gap; retain historical root/navigation identity outside platform scope. Current successor is separately native-resolved. No live old-anchor claim.",
    "reviewNote": "deep: historical docs/reading-map.md#unheaded-block-16 at witness 2300d6557 (L131-183, digest 9a08a477 recomputed by extractor and by hand), no target: docs/reading-map.md is identical to 19ca8de23 and carries the corrected '36 wrapper ... 55 thư mục skill' wording (line 155; 55 directories and 54 SKILL.md on disk); applied approval checked: the shard row equals the pack, the reviewNote equals the Note in my committed 19ca8de23 report byte for byte, reviewedBy/reviewedAt/reviewReport (review-step10-decisions-05-19ca8de23.md at 4a18f35ff) match, and every non-review field equals the row at the request commit of that round (62d147641)",
    "sourcePath": "docs/reading-map.md",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-03-345f15d95.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "accounting-071"
}
```

## Entry accounting-073

```json
{
  "kind": "refreshed-dependent-accounting",
  "historicalArtifact": "plans/260925-documentation-authority-unification/reports/phase-06/step10-sync19-prior-findings.json",
  "historicalProjectionPath": "/rows/12/currentDecision",
  "historicalSnapshot": {
    "claimId": "claim_a7278e1567e5432cfb079506cf2f5050",
    "sourcePath": "docs/specs/observe.md",
    "sourceUnitDigest": "1840cc4b1da22587ed69755276cad9a882139c62a36179d8fba2269905414623",
    "claimKind": "specification",
    "disposition": "partial-carry",
    "targetOwner": "docs/specs/observe.md",
    "targetAnchor": "unheaded-block-3",
    "rationale": "A22/A31/A34: one native sync at 19ca8de23908e161c34c91626e41041b7813167c preserves this historical predecessor as a gap; current upstream source successor is separately native-accounted and carried to the candidate. Historical lines changed; exact untransferred residual is retained verbatim with SHA256, independent representation review required; cutover remains blocked. Full source/current witnesses and residual: step10-sync19-predecessor-residuals.json. No identity graft or approval carry.",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
    "reviewNote": "deep: historical unit docs/specs/observe.md#unheaded-block-3 at witness 2300d6557 (L13-17, digest 1840cc4b recomputed equal) against the current successor L13-17 (digest 36f5428d recomputed equal): exactly one historical line (the store lock bullet) is not in the successor, its text and SHA256 ca9a59c1 match the residual file, the successor is carried by claim_bf1888a0, so partial-carry is accurate",
    "remainder": "Verbatim historical residual in plans/260925-documentation-authority-unification/reports/phase-06/step10-sync19-predecessor-residuals.json, claim claim_a7278e1567e5432cfb079506cf2f5050, residual SHA256 ca9a59c18839e81d0f58c6602e5c373a161cbeb6a20721e23fbff39be36107af. Source 1840cc4b1da22587ed69755276cad9a882139c62a36179d8fba2269905414623; primary target 36f5428de433214eb4a9a17e3a2366471095b9bb658faa4f11d4bb108beea137. Residual file SHA256 recorded in step10-sync19-predecessor-reconciliation.json. A34 independent acceptance pending; cutover blocked.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-19ca8de23.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "36f5428de433214eb4a9a17e3a2366471095b9bb658faa4f11d4bb108beea137",
    "targetAncestry": [
      "Observe Component Specification",
      "1. Overview & Boundaries",
      "Owns"
    ],
    "reviewReportCommit": "4a18f35ff5d6a9b7a07e955bd64418282c6a91b2"
  },
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s8-observe-01.json",
  "collection": "registryGaps",
  "relatedClaimId": "claim_a7278e1567e5432cfb079506cf2f5050",
  "after": {
    "claimId": "claim_a7278e1567e5432cfb079506cf2f5050",
    "sourcePath": "docs/specs/observe.md",
    "sourceUnitDigest": "1840cc4b1da22587ed69755276cad9a882139c62a36179d8fba2269905414623",
    "claimKind": "specification",
    "disposition": "partial-carry",
    "targetOwner": "docs/specs/observe.md",
    "targetAnchor": "unheaded-block-3",
    "rationale": "A22/A31/A34: one native sync at 19ca8de23908e161c34c91626e41041b7813167c preserves this historical predecessor as a gap; current upstream source successor is separately native-accounted and carried to the candidate. Historical lines changed; exact untransferred residual is retained verbatim with SHA256, independent representation review required; cutover remains blocked. Full source/current witnesses and residual: step10-sync19-predecessor-residuals.json. No identity graft or approval carry.",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
    "reviewNote": "deep: historical docs/specs/observe.md#unheaded-block-3 at witness 2300d6557 (L13-17, digest 1840cc4b recomputed by extractor and by hand) against successor 36f5428d: one residual line (the friction command bullet without ping and migrate), text and SHA256 ca9a59c1 equal the residual file, successor carried by claim_bf1888a0, so partial-carry with a named remainder is accurate; applied approval checked: the shard row equals the pack, the reviewNote equals the Note in my committed 19ca8de23 report byte for byte, reviewedBy/reviewedAt/reviewReport (review-step10-decisions-05-19ca8de23.md at 4a18f35ff) match, and every non-review field equals the row at the request commit of that round (62d147641)",
    "remainder": "Verbatim historical residual in plans/260925-documentation-authority-unification/reports/phase-06/step10-sync19-predecessor-residuals.json, claim claim_a7278e1567e5432cfb079506cf2f5050, residual SHA256 ca9a59c18839e81d0f58c6602e5c373a161cbeb6a20721e23fbff39be36107af. Source 1840cc4b1da22587ed69755276cad9a882139c62a36179d8fba2269905414623; primary target 36f5428de433214eb4a9a17e3a2366471095b9bb658faa4f11d4bb108beea137. Residual file SHA256 recorded in step10-sync19-predecessor-reconciliation.json. A34 independent acceptance pending; cutover blocked.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-03-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "36f5428de433214eb4a9a17e3a2366471095b9bb658faa4f11d4bb108beea137",
    "targetAncestry": [
      "Observe Component Specification",
      "1. Overview & Boundaries",
      "Owns"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-3",
    "githubAnchor": "unheaded-block-3",
    "stableAnchor": "unheaded-block-3",
    "title": "Unheaded block 3",
    "startLine": 13,
    "endLine": 17,
    "textDigest": "36f5428de433214eb4a9a17e3a2366471095b9bb658faa4f11d4bb108beea137",
    "sample": "- Quản lý nhật ký và vòng đời case đo lường (`fgos metrics case`).\n- Thu thập và tính toán scorecard tầng nền (`fgos metrics harness`, `fgos metrics runs`, `fgos metrics coverage`,",
    "identityFingerprint": "d4ba57f63848f35113fc0984b0062b63b09b99132feba60325b6be4553f5d2aa",
    "ancestry": [
      "Observe Component Specification",
      "1. Overview & Boundaries",
      "Owns"
    ],
    "text": "- Quản lý nhật ký và vòng đời case đo lường (`fgos metrics case`).\n- Thu thập và tính toán scorecard tầng nền (`fgos metrics harness`, `fgos metrics runs`, `fgos metrics coverage`, `fgos metrics outcomes`, `fgos metrics entropy`, `fgos metrics snapshot`).\n- Quản lý kho lưu trữ friction độc lập, phi tập trung (`fgos friction record`, `fgos friction resolve`, `fgos friction list`, `fgos friction show`, `fgos friction rank`).\n- Quản lý store lock (`.fgos/observe/.lock`) và phân mảnh writer shard (`.fgos/observe/<store>/<writerId>.jsonl`). `writerId` lấy từ crate Session Identity ([spec](../platform/session-identity/spec.md)): chính session id khi `source` là `env`/`registry` (gồm `CLAUDE_CODE_SESSION_ID`, `CODEX_THREAD_ID`), `pid-<id>` khi `pid`/`unresolved` (gốc terminal hoặc session, không còn pid của chính process). `sessionId` của friction cũng lấy từ đó. Observe không tự đọc biến env identity.\n- Khai báo traits `ObservationSource` và `LegacyFrictionSource` cho các crate khác triển khai."
  },
  "currentNativeSuccessor": {
    "sourcePath": "docs/specs/observe.md",
    "unitDigest": "d4ba57f63848f35113fc0984b0062b63b09b99132feba60325b6be4553f5d2aa",
    "identityFingerprint": "d4ba57f63848f35113fc0984b0062b63b09b99132feba60325b6be4553f5d2aa",
    "claimId": "claim_bf1888a05f53ba3cd515eb792c5059b8",
    "sourceAnchor": "unheaded-block-3",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "36f5428de433214eb4a9a17e3a2366471095b9bb658faa4f11d4bb108beea137",
    "claimKind": "specification",
    "status": "current"
  },
  "sourceAndResidualHistoryPreserved": true,
  "reviewScope": "Current projection supersedes the historical artifact for this package only; historical before/native witness remains immutable. Pending rows receive no approval.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "currentDecision": {
    "claimId": "claim_a7278e1567e5432cfb079506cf2f5050",
    "sourcePath": "docs/specs/observe.md",
    "sourceUnitDigest": "1840cc4b1da22587ed69755276cad9a882139c62a36179d8fba2269905414623",
    "claimKind": "specification",
    "disposition": "partial-carry",
    "targetOwner": "docs/specs/observe.md",
    "targetAnchor": "unheaded-block-3",
    "rationale": "A22/A31/A34: one native sync at 19ca8de23908e161c34c91626e41041b7813167c preserves this historical predecessor as a gap; current upstream source successor is separately native-accounted and carried to the candidate. Historical lines changed; exact untransferred residual is retained verbatim with SHA256, independent representation review required; cutover remains blocked. Full source/current witnesses and residual: step10-sync19-predecessor-residuals.json. No identity graft or approval carry.",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
    "reviewNote": "deep: historical docs/specs/observe.md#unheaded-block-3 at witness 2300d6557 (L13-17, digest 1840cc4b recomputed by extractor and by hand) against successor 36f5428d: one residual line (the friction command bullet without ping and migrate), text and SHA256 ca9a59c1 equal the residual file, successor carried by claim_bf1888a0, so partial-carry with a named remainder is accurate; applied approval checked: the shard row equals the pack, the reviewNote equals the Note in my committed 19ca8de23 report byte for byte, reviewedBy/reviewedAt/reviewReport (review-step10-decisions-05-19ca8de23.md at 4a18f35ff) match, and every non-review field equals the row at the request commit of that round (62d147641)",
    "remainder": "Verbatim historical residual in plans/260925-documentation-authority-unification/reports/phase-06/step10-sync19-predecessor-residuals.json, claim claim_a7278e1567e5432cfb079506cf2f5050, residual SHA256 ca9a59c18839e81d0f58c6602e5c373a161cbeb6a20721e23fbff39be36107af. Source 1840cc4b1da22587ed69755276cad9a882139c62a36179d8fba2269905414623; primary target 36f5428de433214eb4a9a17e3a2366471095b9bb658faa4f11d4bb108beea137. Residual file SHA256 recorded in step10-sync19-predecessor-reconciliation.json. A34 independent acceptance pending; cutover blocked.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-03-345f15d95.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "36f5428de433214eb4a9a17e3a2366471095b9bb658faa4f11d4bb108beea137",
    "targetAncestry": [
      "Observe Component Specification",
      "1. Overview & Boundaries",
      "Owns"
    ],
    "reviewReportCommit": "5035fed52e60254ecbe034cc987553feb24616f4"
  },
  "entryId": "accounting-073"
}
```

