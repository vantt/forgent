# Bounded re-review: accounting 5

Author session: `codex-session:unit-run-1792114313040-56132651@2026-10-16`
Packaged by: `codex-session:unit-run-1792116045118-73cfbb42@2026-10-16`
Content commit: `287a22d33a0eaf2d9e47549a1142daf62361bb8c` (author changes at `0d8c602e2`)
Comparison base: `5035fed52e60254ecbe034cc987553feb24616f4`
Entries: **3**; each request at most60 entries and400000 bytes.

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

## Entry accounting-072

```json
{
  "kind": "refreshed-dependent-accounting",
  "historicalArtifact": "plans/260925-documentation-authority-unification/reports/phase-06/step10-sync19-prior-findings.json",
  "historicalProjectionPath": "/rows/11/currentDecision",
  "historicalSnapshot": {
    "claimId": "claim_b2a51d5d39832d330879947bdbbcb227",
    "sourcePath": "docs/specs/observe.md",
    "sourceAnchor": "owns",
    "sourceUnitDigest": "ca2fd76b4ca2fe575e858e1f9ae76cf0ddf0f7300593c6a58b11ac2249b4d1b2",
    "claimKind": "specification",
    "disposition": "supersede",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
    "rationale": "A31 / SYNC 59b9b7087: current upstream text carried into its mapped candidate with only disclosed relative-link rebases; existing labelled truth corrections remain. This is a provisional current-source draft from unchanged buildInventoryRow; next package must resolve native identity. No source retirement, authority flip or approval carried. Native identity resolved at 19ca8de23908e161c34c91626e41041b7813167c from the sole native sync. Historical gaps remain separate; no provisional ID is persisted as a decision and no approval carries.",
    "targetOwner": "docs/platform/observe/spec.md",
    "targetAnchor": "owns",
    "reviewNote": "deep: docs/specs/observe.md#owns to docs/platform/observe/spec.md#owns: section differs by the friction ping and migrate additions to the first bullet (labelled Truth correction in the candidate scaffold, with evidence friction_cli.rs:7-9) and one link destination rebased (../platform/session-identity/spec.md becomes ../session-identity/spec.md, not named in the scaffold list of rebased links but a pure destination change); nothing lost; mandatory unequal row, digests recomputed, anchors pass",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-19ca8de23.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "a03c9cf9107371c2ec305cd2efea93cc9ca0f549ec485158bdb5e9ecc05c63aa",
    "targetAncestry": [
      "Observe Component Specification",
      "1. Overview & Boundaries"
    ],
    "reviewReportCommit": "4a18f35ff5d6a9b7a07e955bd64418282c6a91b2"
  },
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s8-observe-01.json",
  "collection": "claims",
  "relatedClaimId": "claim_b2a51d5d39832d330879947bdbbcb227",
  "after": {
    "claimId": "claim_b2a51d5d39832d330879947bdbbcb227",
    "sourcePath": "docs/specs/observe.md",
    "sourceAnchor": "owns",
    "sourceUnitDigest": "ca2fd76b4ca2fe575e858e1f9ae76cf0ddf0f7300593c6a58b11ac2249b4d1b2",
    "claimKind": "specification",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/specs/observe.md:12-12#owns (current lines); unit SHA256 ca2fd76b4ca2fe575e858e1f9ae76cf0ddf0f7300593c6a58b11ac2249b4d1b2.\nTarget: docs/platform/observe/spec.md:34-34#owns (current lines); unit SHA256 a03c9cf9107371c2ec305cd2efea93cc9ca0f549ec485158bdb5e9ecc05c63aa.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest a03c9cf9107371c2ec305cd2efea93cc9ca0f549ec485158bdb5e9ecc05c63aa at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 1, target 1; 1 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nLink 1: \"spec\" (../platform/session-identity/spec.md) → \"spec\" (../session-identity/spec.md); resolved docs/platform/session-identity/spec.md → docs/platform/session-identity/spec.md.\nHeading depth: 3 → 3; title \"Owns\" → \"Owns\".\nApplicable labelled corrections:\nA40/step8-truth-corrections-1: \"`fgos friction rank`).\" → \"`fgos friction rank`, `fgos friction ping`, `fgos friction migrate`).\"; evidence step8-truth-corrections.json; packages/observe/rust/src/friction_cli.rs:7-9.\nDisposition supersede: Account for docs/specs/observe.md#owns under docs/platform/observe/spec.md#owns; source context \"Observe Component Specification / 1. Overview & Boundaries\", target context \"Observe Component Specification / 1. Overview & Boundaries\". The source text occurs verbatim inside the bound target section; section-level unit digests differ.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/observe/spec.md",
    "targetAnchor": "owns",
    "targetUnitDigest": "a03c9cf9107371c2ec305cd2efea93cc9ca0f549ec485158bdb5e9ecc05c63aa",
    "targetAncestry": [
      "Observe Component Specification",
      "1. Overview & Boundaries"
    ]
  },
  "currentTarget": {
    "unitKind": "heading",
    "level": 3,
    "title": "Owns",
    "anchor": "owns",
    "githubAnchor": "owns",
    "stableAnchor": "h-7876a0bcabd0",
    "startLine": 34,
    "endLine": 34,
    "textDigest": "a03c9cf9107371c2ec305cd2efea93cc9ca0f549ec485158bdb5e9ecc05c63aa",
    "sample": "Owns",
    "sectionPayloadDigest": "11717c094b7543079c51f31172bdc5cc8e3d66f9da00bdb02056323819401b2c",
    "followingBlockDigest": "11717c094b7543079c51f31172bdc5cc8e3d66f9da00bdb02056323819401b2c",
    "identityFingerprint": "1a6e22e6c6b4960b3cd50cc63bf4495513ec982f916cd4a58f3ab5e05ab13fc2",
    "ancestry": [
      "Observe Component Specification",
      "1. Overview & Boundaries"
    ],
    "text": "### Owns",
    "sectionText": "### Owns\n- Quản lý nhật ký và vòng đời case đo lường (`fgos metrics case`).\n- Thu thập và tính toán scorecard tầng nền (`fgos metrics harness`, `fgos metrics runs`, `fgos metrics coverage`, `fgos metrics outcomes`, `fgos metrics entropy`, `fgos metrics snapshot`).\n- Quản lý kho lưu trữ friction độc lập, phi tập trung (`fgos friction record`, `fgos friction resolve`, `fgos friction list`, `fgos friction show`, `fgos friction rank`, `fgos friction ping`, `fgos friction migrate`).\n- Quản lý store lock (`.fgos/observe/.lock`) và phân mảnh writer shard (`.fgos/observe/<store>/<writerId>.jsonl`). `writerId` lấy từ crate Session Identity ([spec](../session-identity/spec.md)): chính session id khi `source` là `env`/`registry` (gồm `CLAUDE_CODE_SESSION_ID`, `CODEX_THREAD_ID`), `pid-<id>` khi `pid`/`unresolved` (gốc terminal hoặc session, không còn pid của chính process). `sessionId` của friction cũng lấy từ đó. Observe không tự đọc biến env identity.\n- Khai báo traits `ObservationSource` và `LegacyFrictionSource` cho các crate khác triển khai."
  },
  "currentNativeSuccessor": {
    "sourcePath": "docs/platform/observe/spec.md",
    "unitDigest": "9cbef79c0d7a521e8a8427c1009b95df8e4b6f7c93e382337c265957d6281824",
    "identityFingerprint": "1a6e22e6c6b4960b3cd50cc63bf4495513ec982f916cd4a58f3ab5e05ab13fc2",
    "claimId": "claim_9a7f102f2e18a81ce472b2b57f81cff3",
    "sourceAnchor": "owns",
    "unitKind": "heading",
    "sourceUnitDigest": "a03c9cf9107371c2ec305cd2efea93cc9ca0f549ec485158bdb5e9ecc05c63aa",
    "claimKind": "specification",
    "status": "future"
  },
  "sourceAndResidualHistoryPreserved": true,
  "reviewScope": "Current projection supersedes the historical artifact for this package only; historical before/native witness remains immutable. Pending rows receive no approval.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_b2a51d5d39832d330879947bdbbcb227",
    "sourcePath": "docs/specs/observe.md",
    "sourceAnchor": "owns",
    "sourceUnitDigest": "ca2fd76b4ca2fe575e858e1f9ae76cf0ddf0f7300593c6a58b11ac2249b4d1b2",
    "claimKind": "specification",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/specs/observe.md:12-12#owns (current lines); unit SHA256 ca2fd76b4ca2fe575e858e1f9ae76cf0ddf0f7300593c6a58b11ac2249b4d1b2.\nTarget: docs/platform/observe/spec.md:34-34#owns (current lines); unit SHA256 a03c9cf9107371c2ec305cd2efea93cc9ca0f549ec485158bdb5e9ecc05c63aa.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest a03c9cf9107371c2ec305cd2efea93cc9ca0f549ec485158bdb5e9ecc05c63aa at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 1, target 1; 1 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nLink 1: \"spec\" (../platform/session-identity/spec.md) → \"spec\" (../session-identity/spec.md); resolved docs/platform/session-identity/spec.md → docs/platform/session-identity/spec.md.\nHeading depth: 3 → 3; title \"Owns\" → \"Owns\".\nApplicable labelled corrections:\nA40/step8-truth-corrections-1: \"`fgos friction rank`).\" → \"`fgos friction rank`, `fgos friction ping`, `fgos friction migrate`).\"; evidence step8-truth-corrections.json; packages/observe/rust/src/friction_cli.rs:7-9.\nDisposition supersede: Account for docs/specs/observe.md#owns under docs/platform/observe/spec.md#owns; source context \"Observe Component Specification / 1. Overview & Boundaries\", target context \"Observe Component Specification / 1. Overview & Boundaries\". The source text occurs verbatim inside the bound target section; section-level unit digests differ.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/observe/spec.md",
    "targetAnchor": "owns",
    "targetUnitDigest": "a03c9cf9107371c2ec305cd2efea93cc9ca0f549ec485158bdb5e9ecc05c63aa",
    "targetAncestry": [
      "Observe Component Specification",
      "1. Overview & Boundaries"
    ]
  },
  "entryId": "accounting-072"
}
```

## Entry accounting-077

```json
{
  "kind": "refreshed-dependent-accounting",
  "historicalArtifact": "plans/260925-documentation-authority-unification/reports/phase-06/step10-sync345-predecessor-reconciliation.json",
  "historicalProjectionPath": "/newPredecessors/3/after",
  "historicalSnapshot": {
    "claimId": "claim_08f9b4c140ce931a064c131c2bd4e014",
    "sourcePath": "docs/platform/runner/operations/h-51f5cd7279fd.md",
    "sourceUnitDigest": "30bbabf9219560dd2744a98e42e43b53e9fbaf15c4282e68860a8682f2b63059",
    "claimKind": "specification",
    "disposition": "supersede",
    "targetOwner": "docs/platform/runner/operations/h-51f5cd7279fd.md",
    "targetAnchor": "unheaded-block-26",
    "targetUnitDigest": "0dce2b78b5d497ab9dbe1b9cc6d0d8a00ad2ff468b97fe5964c8e86464b0a3b2",
    "targetAncestry": [
      "Added in candidate: Runner Behaviors & Operations",
      "Behaviors & Operations",
      "Gate A — xếp hạng candidate, bắc cầu sang việc thật (evolve)"
    ],
    "rationale": "A22/A31/L10-18b/L10-20: native predecessor from 19ca8de23 is superseded by the current same-section unit after authorized source/target link-cell restoration, sentence-order restoration or evolve code-line citation correction. Complete immutable before/after unit text and native successor identity are recorded in step10-sync345-predecessor-reconciliation.json; review the actual delta, not ordinal-anchor equality. Current successor remains candidate, no truth or cutover approval.",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792094246578-b2fbe39b@2026-10-16",
    "reviewNote": "Independent review pending at 345f15d95; no approval carried."
  },
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s10-systemic-native-predecessors.json",
  "collection": "registryGaps",
  "relatedClaimId": "claim_08f9b4c140ce931a064c131c2bd4e014",
  "after": {
    "claimId": "claim_08f9b4c140ce931a064c131c2bd4e014",
    "sourcePath": "docs/platform/runner/operations/h-51f5cd7279fd.md",
    "sourceUnitDigest": "30bbabf9219560dd2744a98e42e43b53e9fbaf15c4282e68860a8682f2b63059",
    "claimKind": "specification",
    "disposition": "supersede",
    "targetOwner": "docs/platform/runner/operations/h-51f5cd7279fd.md",
    "targetAnchor": "unheaded-block-26",
    "targetUnitDigest": "0f61fde6bc880cb19623ecde63a6a137571884e4b6ae2f8b24b8a585b25d600a",
    "targetAncestry": [
      "Added in candidate: Runner Behaviors & Operations",
      "Behaviors & Operations",
      "Gate A — xếp hạng candidate, bắc cầu sang việc thật (evolve)"
    ],
    "rationale": "Source: docs/platform/runner/operations/h-51f5cd7279fd.md:456-467#unheaded-block-26 (historical witness at 19ca8de23908e161c34c91626e41041b7813167c); unit SHA256 30bbabf9219560dd2744a98e42e43b53e9fbaf15c4282e68860a8682f2b63059.\nTarget: docs/platform/runner/operations/h-51f5cd7279fd.md:456-467#unheaded-block-26 (current lines); unit SHA256 0f61fde6bc880cb19623ecde63a6a137571884e4b6ae2f8b24b8a585b25d600a.\nSource and target unit digests differ.\nTarget changed since last reviewed digest 0dce2b78b5d497ab9dbe1b9cc6d0d8a00ad2ff468b97fe5964c8e86464b0a3b2 at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections:\nL10-24/citation-refuseHelp: \"bin/fgos.mjs:4415,4461\" → \"bin/fgos.mjs:4415,4503\"; evidence step10-round3-doc-edits.json; bin/fgos.mjs:4414-4417,4503.\nDisposition supersede: Account for docs/platform/runner/operations/h-51f5cd7279fd.md#unheaded-block-26 under docs/platform/runner/operations/h-51f5cd7279fd.md#unheaded-block-26; source context \"Added in candidate: Runner Behaviors & Operations / Behaviors & Operations / Gate A — xếp hạng candidate, bắc cầu sang việc thật (evolve)\", target context \"Added in candidate: Runner Behaviors & Operations / Behaviors & Operations / Gate A — xếp hạng candidate, bắc cầu sang việc thật (evolve)\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16"
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-26",
    "githubAnchor": "unheaded-block-26",
    "stableAnchor": "unheaded-block-26",
    "title": "Unheaded block 26",
    "startLine": 456,
    "endLine": 467,
    "textDigest": "0f61fde6bc880cb19623ecde63a6a137571884e4b6ae2f8b24b8a585b25d600a",
    "sample": "Added in candidate — A41/A42 correction: CLI hiện hành không có verb `evolve` (`bin/fgos.mjs:4415,4503`; `evolve --help` trả \"unknown verb\"). Module ranking đã bị xoá ở commit `120",
    "identityFingerprint": "871f3aa2e8699bc9b5c73af0cbf8305884b3469e1f6e2df1845dd8b030d52add",
    "ancestry": [
      "Added in candidate: Runner Behaviors & Operations",
      "Behaviors & Operations",
      "Gate A — xếp hạng candidate, bắc cầu sang việc thật (evolve)"
    ],
    "text": "Added in candidate — A41/A42 correction: CLI hiện hành không có verb `evolve` (`bin/fgos.mjs:4415,4503`; `evolve --help` trả \"unknown verb\"). Module ranking đã bị xoá ở commit `120af6b3d`. Đoạn dưới ghi lại hợp đồng Gate A trước khi bị gỡ, không xác nhận triển khai hiện hành; full truth check owed at promotion.\nBước vào trước đây của vòng tự cải thiện (self-improve loop, STR13 — CONTEXT.md):\nTheo hợp đồng cũ, fgOS xếp hạng chính friction chưa ngã-ngũ của nó thành\nmột danh sách candidate, người chọn đúng một hoặc dừng (Slice 1), rồi có thể\nbắc cầu candidate đã chọn sang một việc thật để runner thi công (Slice 3,\n`--submit`). Loop này chỉ nhắm vào chính `repo/src` của fgOS — không\nphải một tính năng mở cho host project ngoài — và chạy khi người gọi tay,\nkhông bao giờ là một nhánh tự động của vòng dispatch thường. Vòng khép\nkín đầy đủ: `evolve` (liệt kê) → `evolve --pick` (xem một candidate, đọc-thuần)\n→ `evolve --submit` (bắc cầu, HÀNH ĐỘNG GHI duy nhất của cả bề mặt evolve) →\nrunner dispatch việc mới như mọi việc khác → `review`/`approve` qua cổng duyệt\nPR nội bộ, với `approve` chạy thêm phán Iron Law (xem dưới) trước khi merge."
  },
  "currentNativeSuccessor": {
    "sourcePath": "docs/platform/runner/operations/h-51f5cd7279fd.md",
    "unitDigest": "871f3aa2e8699bc9b5c73af0cbf8305884b3469e1f6e2df1845dd8b030d52add",
    "identityFingerprint": "871f3aa2e8699bc9b5c73af0cbf8305884b3469e1f6e2df1845dd8b030d52add",
    "claimId": "claim_4e0d8183c900cb2ab3954533b1b13592",
    "sourceAnchor": "unheaded-block-26",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "0f61fde6bc880cb19623ecde63a6a137571884e4b6ae2f8b24b8a585b25d600a",
    "claimKind": "procedure",
    "status": "future",
    "origin": "added-since-345f15d95663260976200be66d1b9a6c648bcd6d"
  },
  "sourceAndResidualHistoryPreserved": true,
  "reviewScope": "Current projection supersedes the historical artifact for this package only; historical before/native witness remains immutable. Pending rows receive no approval.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_08f9b4c140ce931a064c131c2bd4e014",
    "sourcePath": "docs/platform/runner/operations/h-51f5cd7279fd.md",
    "sourceUnitDigest": "30bbabf9219560dd2744a98e42e43b53e9fbaf15c4282e68860a8682f2b63059",
    "claimKind": "specification",
    "disposition": "supersede",
    "targetOwner": "docs/platform/runner/operations/h-51f5cd7279fd.md",
    "targetAnchor": "unheaded-block-26",
    "targetUnitDigest": "0f61fde6bc880cb19623ecde63a6a137571884e4b6ae2f8b24b8a585b25d600a",
    "targetAncestry": [
      "Added in candidate: Runner Behaviors & Operations",
      "Behaviors & Operations",
      "Gate A — xếp hạng candidate, bắc cầu sang việc thật (evolve)"
    ],
    "rationale": "Source: docs/platform/runner/operations/h-51f5cd7279fd.md:456-467#unheaded-block-26 (historical witness at 19ca8de23908e161c34c91626e41041b7813167c); unit SHA256 30bbabf9219560dd2744a98e42e43b53e9fbaf15c4282e68860a8682f2b63059.\nTarget: docs/platform/runner/operations/h-51f5cd7279fd.md:456-467#unheaded-block-26 (current lines); unit SHA256 0f61fde6bc880cb19623ecde63a6a137571884e4b6ae2f8b24b8a585b25d600a.\nSource and target unit digests differ.\nTarget changed since last reviewed digest 0dce2b78b5d497ab9dbe1b9cc6d0d8a00ad2ff468b97fe5964c8e86464b0a3b2 at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections:\nL10-24/citation-refuseHelp: \"bin/fgos.mjs:4415,4461\" → \"bin/fgos.mjs:4415,4503\"; evidence step10-round3-doc-edits.json; bin/fgos.mjs:4414-4417,4503.\nDisposition supersede: Account for docs/platform/runner/operations/h-51f5cd7279fd.md#unheaded-block-26 under docs/platform/runner/operations/h-51f5cd7279fd.md#unheaded-block-26; source context \"Added in candidate: Runner Behaviors & Operations / Behaviors & Operations / Gate A — xếp hạng candidate, bắc cầu sang việc thật (evolve)\", target context \"Added in candidate: Runner Behaviors & Operations / Behaviors & Operations / Gate A — xếp hạng candidate, bắc cầu sang việc thật (evolve)\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16"
  },
  "entryId": "accounting-077"
}
```

## Entry accounting-082

```json
{
  "kind": "refreshed-dependent-accounting",
  "historicalArtifact": "plans/260925-documentation-authority-unification/reports/phase-06/step10-sync345-predecessor-reconciliation.json",
  "historicalProjectionPath": "/newPredecessors/8/after",
  "historicalSnapshot": {
    "claimId": "claim_61244b0a84842a2771f7cdb493ebb699",
    "sourcePath": "docs/platform/runner/subcomponents/h-f34e0d170d89/spec.md",
    "sourceUnitDigest": "ae0e268fad727f5deda17cf43d013aa1710f5cea2506fdd844809c3c8e98511f",
    "claimKind": "specification",
    "disposition": "supersede",
    "targetOwner": "docs/platform/runner/subcomponents/h-f34e0d170d89/spec.md",
    "targetAnchor": "unheaded-block-2",
    "targetUnitDigest": "35107e63035cafc34d5698a84f60bb1be49f6700d5e2ad14471d6de41ad86cca",
    "targetAncestry": [
      "Added in candidate: Runner Pointers (implementation)"
    ],
    "rationale": "A22/A31/L10-18b/L10-20: native predecessor from 19ca8de23 is superseded by the current same-section unit after authorized source/target link-cell restoration, sentence-order restoration or evolve code-line citation correction. Complete immutable before/after unit text and native successor identity are recorded in step10-sync345-predecessor-reconciliation.json; review the actual delta, not ordinal-anchor equality. Current successor remains candidate, no truth or cutover approval.",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792094246578-b2fbe39b@2026-10-16",
    "reviewNote": "Independent review pending at 345f15d95; no approval carried."
  },
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s10-systemic-native-predecessors.json",
  "collection": "registryGaps",
  "relatedClaimId": "claim_61244b0a84842a2771f7cdb493ebb699",
  "after": {
    "claimId": "claim_61244b0a84842a2771f7cdb493ebb699",
    "sourcePath": "docs/platform/runner/subcomponents/h-f34e0d170d89/spec.md",
    "sourceUnitDigest": "ae0e268fad727f5deda17cf43d013aa1710f5cea2506fdd844809c3c8e98511f",
    "claimKind": "specification",
    "disposition": "supersede",
    "targetOwner": "docs/platform/runner/subcomponents/h-f34e0d170d89/spec.md",
    "targetAnchor": "unheaded-block-2",
    "targetUnitDigest": "c354e3357585a5cc6bce8dd57d833b0e85d3f19e58ba6e81e9d6f562aca53edc",
    "targetAncestry": [
      "Added in candidate: Runner Pointers (implementation)"
    ],
    "rationale": "Source: docs/platform/runner/subcomponents/h-f34e0d170d89/spec.md:23-23#unheaded-block-2 (historical witness at 19ca8de23908e161c34c91626e41041b7813167c); unit SHA256 ae0e268fad727f5deda17cf43d013aa1710f5cea2506fdd844809c3c8e98511f.\nTarget: docs/platform/runner/subcomponents/h-f34e0d170d89/spec.md:23-23#unheaded-block-2 (current lines); unit SHA256 c354e3357585a5cc6bce8dd57d833b0e85d3f19e58ba6e81e9d6f562aca53edc.\nSource and target unit digests differ.\nNo prior reviewed target digest available; no unchanged-since-review claim.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections:\nL10-24/citation-scaffold: \"bin/fgos.mjs:4640-4643; bin/fgos.mjs:4415-4380\" → \"bin/fgos.mjs:4414-4417\"; evidence step10-round3-doc-edits.json; bin/fgos.mjs:4414-4417,4503.\nDisposition supersede: Account for docs/platform/runner/subcomponents/h-f34e0d170d89/spec.md#unheaded-block-2 under docs/platform/runner/subcomponents/h-f34e0d170d89/spec.md#unheaded-block-2; source context \"Added in candidate: Runner Pointers (implementation)\", target context \"Added in candidate: Runner Pointers (implementation)\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16"
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-2",
    "githubAnchor": "unheaded-block-2",
    "stableAnchor": "unheaded-block-2",
    "title": "Unheaded block 2",
    "startLine": 23,
    "endLine": 23,
    "textDigest": "c354e3357585a5cc6bce8dd57d833b0e85d3f19e58ba6e81e9d6f562aca53edc",
    "sample": "> Added in candidate: Metadata and map-based placement scaffolding. Original source heading levels, ids and direct sections are retained. Known stale carried sentences; full truth ",
    "identityFingerprint": "e1fbde6f58cfdeb1279b92317107b574bff70a5805f3838dcdc8be070ff0a51d",
    "ancestry": [
      "Added in candidate: Runner Pointers (implementation)"
    ],
    "text": "> Added in candidate: Metadata and map-based placement scaffolding. Original source heading levels, ids and direct sections are retained. Known stale carried sentences; full truth check owed at promotion. A19 carriage and explicit Lead A35 note preserve deleted-module, retired-corpus, moved-plan and runner.md:<line> text verbatim. Corrections in this candidate: A41 F2: replace deleted entropy pointer (packages/observe/rust/src/metrics_cli/entropy.rs:1-8; packages/observe/rust/src/metrics_cli/entropy.rs:107-127); A41 F1: replace deleted ranking pointer (bin/fgos.mjs:4414-4417); R9-5: remove decisions-placement boilerplate from non-decision carrier."
  },
  "currentNativeSuccessor": {
    "sourcePath": "docs/platform/runner/subcomponents/h-f34e0d170d89/spec.md",
    "unitDigest": "e1fbde6f58cfdeb1279b92317107b574bff70a5805f3838dcdc8be070ff0a51d",
    "identityFingerprint": "e1fbde6f58cfdeb1279b92317107b574bff70a5805f3838dcdc8be070ff0a51d",
    "claimId": "claim_83a11864c376f283107eeca5fe3ffca5",
    "sourceAnchor": "unheaded-block-2",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "c354e3357585a5cc6bce8dd57d833b0e85d3f19e58ba6e81e9d6f562aca53edc",
    "claimKind": "specification",
    "status": "future",
    "origin": "added-since-345f15d95663260976200be66d1b9a6c648bcd6d"
  },
  "sourceAndResidualHistoryPreserved": true,
  "reviewScope": "Current projection supersedes the historical artifact for this package only; historical before/native witness remains immutable. Pending rows receive no approval.",
  "currentContentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_61244b0a84842a2771f7cdb493ebb699",
    "sourcePath": "docs/platform/runner/subcomponents/h-f34e0d170d89/spec.md",
    "sourceUnitDigest": "ae0e268fad727f5deda17cf43d013aa1710f5cea2506fdd844809c3c8e98511f",
    "claimKind": "specification",
    "disposition": "supersede",
    "targetOwner": "docs/platform/runner/subcomponents/h-f34e0d170d89/spec.md",
    "targetAnchor": "unheaded-block-2",
    "targetUnitDigest": "c354e3357585a5cc6bce8dd57d833b0e85d3f19e58ba6e81e9d6f562aca53edc",
    "targetAncestry": [
      "Added in candidate: Runner Pointers (implementation)"
    ],
    "rationale": "Source: docs/platform/runner/subcomponents/h-f34e0d170d89/spec.md:23-23#unheaded-block-2 (historical witness at 19ca8de23908e161c34c91626e41041b7813167c); unit SHA256 ae0e268fad727f5deda17cf43d013aa1710f5cea2506fdd844809c3c8e98511f.\nTarget: docs/platform/runner/subcomponents/h-f34e0d170d89/spec.md:23-23#unheaded-block-2 (current lines); unit SHA256 c354e3357585a5cc6bce8dd57d833b0e85d3f19e58ba6e81e9d6f562aca53edc.\nSource and target unit digests differ.\nNo prior reviewed target digest available; no unchanged-since-review claim.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections:\nL10-24/citation-scaffold: \"bin/fgos.mjs:4640-4643; bin/fgos.mjs:4415-4380\" → \"bin/fgos.mjs:4414-4417\"; evidence step10-round3-doc-edits.json; bin/fgos.mjs:4414-4417,4503.\nDisposition supersede: Account for docs/platform/runner/subcomponents/h-f34e0d170d89/spec.md#unheaded-block-2 under docs/platform/runner/subcomponents/h-f34e0d170d89/spec.md#unheaded-block-2; source context \"Added in candidate: Runner Pointers (implementation)\", target context \"Added in candidate: Runner Pointers (implementation)\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16"
  },
  "entryId": "accounting-082"
}
```

